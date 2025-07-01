@echo off
echo ============================================
echo    CONFIGURACION GIT PARA INGLES_COMPETENCIA
echo ============================================
echo.

echo Paso 1: Inicializando repositorio Git...
git init
if errorlevel 1 (
    echo ERROR: Git no esta instalado. 
    echo Por favor instala Git desde: https://git-scm.com/download/win
    echo Luego ejecuta este script nuevamente.
    pause
    exit /b 1
)

echo.
echo Paso 2: Configurando Git (si es necesario)...
git config --global user.name "Tu Nombre" 2>nul || echo Ya configurado
git config --global user.email "tu@email.com" 2>nul || echo Ya configurado

echo.
echo Paso 3: Agregando archivos al repositorio...
git add .

echo.
echo Paso 4: Creando commit inicial...
git commit -m "Initial commit: Translate Blitz Pro with AI integration"

echo.
echo Paso 5: Configurando repositorio remoto...
set /p username="Ingresa tu nombre de usuario de GitHub: "
git remote add origin https://github.com/%username%/ingles_competencia.git

echo.
echo Paso 6: Cambiando a rama main...
git branch -M main

echo.
echo Paso 7: Subiendo codigo a GitHub...
echo IMPORTANTE: Se abrira el navegador para autenticarse con GitHub
git push -u origin main

echo.
echo ============================================
echo    CONFIGURACION COMPLETADA!
echo ============================================
echo.
echo Tu juego estara disponible en:
echo https://%username%.github.io/ingles_competencia
echo.
echo Recuerda activar GitHub Pages en:
echo 1. Ve a tu repositorio en GitHub
echo 2. Settings ^> Pages
echo 3. Source: Deploy from a branch
echo 4. Branch: main / (root)
echo 5. Save
echo.
pause
