Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd ""C:\Users\rcmil\.gemini\antigravity\scratch\tcg-website\tcg-desktop-editor"" && npm run electron:dev", 0, False
