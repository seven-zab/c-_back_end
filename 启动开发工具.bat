@echo off
echo 正在启动微信开发者工具...

REM 尝试常见的微信开发者工具安装路径
set "WECHAT_TOOL_PATH="

REM 检查常见路径
if exist "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" (
    set "WECHAT_TOOL_PATH=C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"
) else if exist "C:\Program Files\Tencent\微信web开发者工具\cli.bat" (
    set "WECHAT_TOOL_PATH=C:\Program Files\Tencent\微信web开发者工具\cli.bat"
) else if exist "%USERPROFILE%\AppData\Local\微信web开发者工具\cli.bat" (
    set "WECHAT_TOOL_PATH=%USERPROFILE%\AppData\Local\微信web开发者工具\cli.bat"
)

if "%WECHAT_TOOL_PATH%"=="" (
    echo 未找到微信开发者工具，请手动打开微信开发者工具并导入项目
    echo 项目路径: %~dp0
    pause
    exit /b 1
)

echo 找到微信开发者工具: %WECHAT_TOOL_PATH%
echo 正在打开项目...

"%WECHAT_TOOL_PATH%" open --project "%~dp0"

if %ERRORLEVEL% NEQ 0 (
    echo 启动失败，请手动打开微信开发者工具并导入项目
    echo 项目路径: %~dp0
    pause
) else (
    echo 微信开发者工具已启动
)

pause