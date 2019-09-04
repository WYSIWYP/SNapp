@ echo off
if exist ./node_modules (
    start cmd.exe @cmd /q /c "npm start"
    timeout 3
    start chrome --app="http://localhost:8080"
) else (
    @ echo on
    echo "Installing SNapp"
    npm install
    @ timeout 3
    npm run build
    @ timeout 3
    start cmd.exe @cmd /q /c "npm start"
    @ timeout 3
    @ start chrome --app="http://localhost:8080"
    pause
)

