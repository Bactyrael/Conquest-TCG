const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appDir = 'C:\\Users\\rcmil\\.gemini\\antigravity\\scratch\\tcg-website\\tcg-desktop-editor';
const electronExe = path.join(appDir, 'node_modules', 'electron', 'dist', 'electron.exe');
const iconFile = path.join(appDir, 'build', 'icon.ico');

const targets = [
  'C:\\Users\\rcmil\\Desktop\\Beasts and Bounties Editor.lnk',
  'C:\\Users\\rcmil\\Desktop\\B&B TCG.lnk',
  'C:\\Users\\rcmil\\OneDrive\\Desktop\\Beasts and Bounties Editor.lnk',
  'C:\\Users\\rcmil\\OneDrive\\Desktop\\B&B TCG.lnk'
];

const lines = [
  'Set oWS = WScript.CreateObject("WScript.Shell")',
  'Set fso = CreateObject("Scripting.FileSystemObject")',
  'Sub MakeOrUpdate(lnkPath)',
  `  Set oLink = oWS.CreateShortcut(lnkPath)`,
  `  oLink.TargetPath = "${electronExe.replace(/\\/g, '\\\\')}"`,
  `  oLink.Arguments = "."`,
  `  oLink.WorkingDirectory = "${appDir.replace(/\\/g, '\\\\')}"`,
  `  oLink.Description = "Beasts and Bounties Card Editor"`,
  `  oLink.IconLocation = "${iconFile.replace(/\\/g, '\\\\')},0"`,
  `  oLink.WindowStyle = 1`,
  `  oLink.Save`,
  `  WScript.Echo "Saved: " & lnkPath`,
  'End Sub'
];

targets.forEach(t => {
  lines.push(`MakeOrUpdate "${t.replace(/\\/g, '\\\\')}"`);
});

fs.writeFileSync('fix_all.vbs', lines.join('\r\n'));
try {
  const res = execSync('cscript //nologo fix_all.vbs').toString();
  console.log(res);
} finally {
  if (fs.existsSync('fix_all.vbs')) fs.unlinkSync('fix_all.vbs');
}
