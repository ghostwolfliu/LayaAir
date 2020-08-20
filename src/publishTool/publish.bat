@echo off
if exist ..\..\build_lt (
   rmdir /s/q ..\..\build_lt
) 

if exist ..\..\bin\tsc\layaAir (
   rmdir /s/q ..\..\bin\tsc\layaAir
) 
node index.js

cd ..\
gulp build

@pause