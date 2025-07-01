# Script para configurar el repositorio ingles_competencia en GitHub
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CONFIGURACION GIT PARA INGLES_COMPETENCIA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Verificar si Git está instalado
    Write-Host "Verificando instalacion de Git..." -ForegroundColor Yellow
    $gitVersion = git --version 2>$null
    if (-not $gitVersion) {
        throw "Git no encontrado"
    }
    Write-Host "✅ Git detectado: $gitVersion" -ForegroundColor Green
    
    # Paso 1: Inicializar repositorio
    Write-Host "`nPaso 1: Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    
    # Paso 2: Configurar Git si es necesario
    Write-Host "`nPaso 2: Verificando configuracion de Git..." -ForegroundColor Yellow
    $userName = git config --global user.name 2>$null
    $userEmail = git config --global user.email 2>$null
    
    if (-not $userName) {
        $inputName = Read-Host "Ingresa tu nombre para Git"
        git config --global user.name "$inputName"
        Write-Host "✅ Nombre configurado: $inputName" -ForegroundColor Green
    } else {
        Write-Host "✅ Nombre ya configurado: $userName" -ForegroundColor Green
    }
    
    if (-not $userEmail) {
        $inputEmail = Read-Host "Ingresa tu email para Git"
        git config --global user.email "$inputEmail"
        Write-Host "✅ Email configurado: $inputEmail" -ForegroundColor Green
    } else {
        Write-Host "✅ Email ya configurado: $userEmail" -ForegroundColor Green
    }
    
    # Paso 3: Agregar archivos
    Write-Host "`nPaso 3: Agregando archivos al repositorio..." -ForegroundColor Yellow
    git add .
    Write-Host "✅ Archivos agregados" -ForegroundColor Green
    
    # Paso 4: Crear commit
    Write-Host "`nPaso 4: Creando commit inicial..." -ForegroundColor Yellow
    git commit -m "Initial commit: Translate Blitz Pro with AI integration"
    Write-Host "✅ Commit creado" -ForegroundColor Green
    
    # Paso 5: Configurar repositorio remoto
    Write-Host "`nPaso 5: Configurando repositorio remoto..." -ForegroundColor Yellow
    $username = Read-Host "Ingresa tu nombre de usuario de GitHub"
    git remote add origin "https://github.com/$username/ingles_competencia.git"
    Write-Host "✅ Repositorio remoto configurado" -ForegroundColor Green
    
    # Paso 6: Cambiar a rama main
    Write-Host "`nPaso 6: Cambiando a rama main..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "✅ Rama main configurada" -ForegroundColor Green
    
    # Paso 7: Subir código
    Write-Host "`nPaso 7: Subiendo codigo a GitHub..." -ForegroundColor Yellow
    Write-Host "IMPORTANTE: Se te pedira autenticarte con GitHub" -ForegroundColor Red
    git push -u origin main
    
    # Éxito
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host "    CONFIGURACION COMPLETADA!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tu juego estara disponible en:" -ForegroundColor Cyan
    Write-Host "https://$username.github.io/ingles_competencia" -ForegroundColor White
    Write-Host ""
    Write-Host "SIGUIENTE PASO - Activar GitHub Pages:" -ForegroundColor Yellow
    Write-Host "1. Ve a tu repositorio en GitHub" -ForegroundColor White
    Write-Host "2. Settings > Pages" -ForegroundColor White
    Write-Host "3. Source: Deploy from a branch" -ForegroundColor White
    Write-Host "4. Branch: main / (root)" -ForegroundColor White
    Write-Host "5. Save" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "`n❌ ERROR: $_" -ForegroundColor Red
    
    if ($_.Exception.Message -match "Git no encontrado") {
        Write-Host "`nGit no esta instalado. Pasos para instalar:" -ForegroundColor Yellow
        Write-Host "1. Ve a: https://git-scm.com/download/win" -ForegroundColor White
        Write-Host "2. Descarga e instala Git" -ForegroundColor White
        Write-Host "3. Reinicia VS Code" -ForegroundColor White
        Write-Host "4. Ejecuta este script nuevamente" -ForegroundColor White
    }
    
    Write-Host "`nPresiona Enter para continuar..." -ForegroundColor Gray
    Read-Host
}
