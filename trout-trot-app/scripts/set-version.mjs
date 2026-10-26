// Sets the version shown in the stores and the internal build number, on Android and iOS at once.
//
//   npm run version:set -- 1.1 2
//
// The version (1.1) is what players see. The build number (2) is an integer the stores use to
// tell uploads apart: it must go up by at least 1 for every upload, even a re-upload of 1.1.
import fs from 'node:fs';
import path from 'node:path';

const [version, build] = process.argv.slice(2);
if (!/^\d+(\.\d+){0,2}$/.test(version || '') || !/^\d+$/.test(build || '')) {
  console.error('Usage: npm run version:set -- <version like 1.1> <build number like 2>');
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, '..');
const edit = (file, pairs) => {
  const p = path.join(root, file);
  let text = fs.readFileSync(p, 'utf8');
  for (const [re, rep] of pairs) {
    if (!re.test(text)) throw new Error(`${file}: ${re} not found`);
    text = text.replace(re, rep);
  }
  fs.writeFileSync(p, text);
  console.log('updated', file);
};

edit('android/app/build.gradle', [
  [/versionCode \d+/, `versionCode ${build}`],
  [/versionName "[^"]*"/, `versionName "${version}"`]
]);
edit('ios/App/App.xcodeproj/project.pbxproj', [
  [/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`],
  [/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`]
]);
const semver = version.split('.').concat(['0', '0']).slice(0, 3).join('.');
edit('package.json', [[/"version": "[^"]*"/, `"version": "${semver}"`]]);
console.log(`Trout Trot is now version ${version} (build ${build}).`);
