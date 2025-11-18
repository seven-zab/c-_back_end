@echo off
echo 开始部署权限系统相关云函数...

echo.
echo 1. 部署 permission 云函数...
cd cloudfunctions\permission
call npm install
cd ..\..

echo.
echo 2. 部署 initAdmin 云函数...
cd cloudfunctions\initAdmin
call npm install
cd ..\..

echo.
echo 3. 部署 initDatabase 云函数...
cd cloudfunctions\initDatabase
call npm install
cd ..\..

echo.
echo 权限系统云函数部署完成！
echo.
echo 请在微信开发者工具中：
echo 1. 右键点击 cloudfunctions/permission 文件夹，选择"上传并部署：云端安装依赖"
echo 2. 右键点击 cloudfunctions/initAdmin 文件夹，选择"上传并部署：云端安装依赖"
echo 3. 右键点击 cloudfunctions/initDatabase 文件夹，选择"上传并部署：云端安装依赖"
echo.
pause