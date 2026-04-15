@echo off
cd /d "%~dp0"
python predict.py >> predict.log 2>&1
