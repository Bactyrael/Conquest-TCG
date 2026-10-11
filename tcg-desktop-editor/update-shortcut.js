const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const userProfile = process.env.USERPROFILE;
const appDir = path.resolve(__dirname);
const electronExe = path.join(appDir, 'node_modules', 'electron', 'dist', 'electron.exe');
const iconFile = path.join(appDir, 'build', 'icon.ico');

const vbsScript = `
Set oWS = WScript.CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = "${appDir.replace(/\\/g, '\\\\')}"
electronExe = "${electronExe.replace(/\\/g, '\\\\')}"
iconFile = "${iconFile.replace(/\\/g, '\\\\')}"

sub UpdateShortcut(lnkPath)
  If fso.FileExists(lnkPath) Then
    Set oLink = oWS.CreateShortcut(lnkPath)
    oLink.TargetPath = electronExe
    oLink.Arguments = "."
    oLink.WorkingDirectory = appDir
    oLink.Description = "Beasts and Bounties Card Editor"
    oLink.IconLocation = iconFile & ",0"
    oLink.WindowStyle = 1
    oLink.Save
    WScript.Echo "Updated: " & lnkPath
  End If
end sub

UpdateShortcut "${path.join(userProfile, 'Desktop', 'Beasts and Bounties Editor.lnk').replace(/\\/g, '\\\\')}"
UpdateShortcut "${path.join(userProfile, 'OneDrive', 'Desktop', 'Beasts and Bounties Editor.lnk').replace(/\\/g, '\\\\')}"
`;

fs.writeFileSync('temp_update.vbs', vbsScript);
try {
  const out = execSync('cscript //nologo temp_update.vbs').toString();
  console.log(out);
} finally {
  if (fs.existsSync('temp_update.vbs')) {
    fs.unlinkSync('temp_update.vbs');
  }
}
