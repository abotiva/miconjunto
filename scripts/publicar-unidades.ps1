# Publica el modulo de unidades y las migraciones 0005-0007.
# Uso (PowerShell, desde cualquier carpeta):
#   & "C:\App Conjuntos\scripts\publicar-unidades.ps1"
# Solo agrega los archivos de este paquete. NO sube docs\ ni supabase\README.md.

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "Carpeta: $(Get-Location)"

# 1. Es el repositorio correcto?
$remoto = git remote get-url origin
if ($remoto -notmatch "abotiva/miconjunto") {
  Write-Host "El remoto es '$remoto', no abotiva/miconjunto. Me detengo." -ForegroundColor Red
  exit 1
}

# 2. Estan todos los archivos?
$archivos = @(
  "app\panel\unidades\page.tsx",
  "app\panel\unidades\[id]\page.tsx",
  "app\panel\unidades\[id]\actions.ts",
  "supabase\migrations\0005_porteria.sql",
  "supabase\migrations\0006_endurecer_seguridad.sql",
  "supabase\migrations\0007_integridad_unidades.sql"
)
foreach ($f in $archivos) {
  if (-not (Test-Path -LiteralPath $f)) {
    Write-Host "Falta el archivo: $f" -ForegroundColor Red
    exit 1
  }
}

# 3. La lista es la version nueva?
if (-not (Select-String -LiteralPath "app\panel\unidades\page.tsx" -Pattern "Ver ficha" -Quiet)) {
  Write-Host "page.tsx no es la version nueva (no contiene 'Ver ficha')." -ForegroundColor Red
  exit 1
}

# 4. Compila antes de subir
Write-Host "Compilando (npm run build)..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "El build fallo. No se sube nada. Copie el error y pegueselo a Claude." -ForegroundColor Red
  exit 1
}

# 5. Agrega solo lo del paquete
git add -- app/panel/unidades `
  supabase/migrations/0005_porteria.sql `
  supabase/migrations/0006_endurecer_seguridad.sql `
  supabase/migrations/0007_integridad_unidades.sql
git status --short

$respuesta = Read-Host "Hacer commit y push de lo anterior a main? (s/n)"
if ($respuesta -ne "s") {
  Write-Host "Cancelado. Nada se subio." -ForegroundColor Yellow
  exit 0
}

git commit -m "Ficha de unidad con edicion y filtros; migraciones 0005-0007"
git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "El push fallo. Si dice 'rejected', ejecute: git pull --rebase origin main  y repita." -ForegroundColor Red
  exit 1
}

Write-Host "Listo. Render desplegara en unos 2 minutos." -ForegroundColor Green
