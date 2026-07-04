---
read_when:
    - आप Plugin पैकेज इंस्टॉल को डीबग कर रहे हैं
    - आप Plugin स्टार्टअप, डॉक्टर, या पैकेज-मैनेजर इंस्टॉल व्यवहार बदल रहे हैं
    - आप पैकेज किए गए OpenClaw इंस्टॉल या बंडल किए गए Plugin मैनिफेस्ट का रखरखाव कर रहे हैं
sidebarTitle: Dependencies
summary: OpenClaw Plugin पैकेज कैसे इंस्टॉल करता है और Plugin निर्भरताएँ कैसे हल करता है
title: Plugin निर्भरता समाधान
x-i18n:
    generated_at: "2026-07-04T15:19:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw Plugin निर्भरता कार्य को install/update समय पर रखता है। Runtime loading
package managers नहीं चलाता, dependency trees की मरम्मत नहीं करता, या OpenClaw
package directory को mutate नहीं करता।

## जिम्मेदारी विभाजन

Plugin packages अपने dependency graph के मालिक होते हैं:

- runtime dependencies Plugin package `dependencies` या
  `optionalDependencies` में रहती हैं
- SDK/core imports peer या supplied OpenClaw imports होते हैं
- local development Plugins अपनी पहले से install की हुई dependencies लाते हैं
- npm और git Plugins OpenClaw-owned package roots में install किए जाते हैं

OpenClaw केवल Plugin lifecycle का मालिक है:

- Plugin source खोजें
- स्पष्ट रूप से अनुरोध होने पर package install या update करें
- install metadata रिकॉर्ड करें
- Plugin entrypoint load करें
- dependencies missing होने पर actionable error के साथ fail करें

## Install roots

OpenClaw स्थिर per-source roots का उपयोग करता है:

- npm packages per-plugin projects में install होते हैं
  `~/.openclaw/npm/projects/<encoded-package>` के अंतर्गत
- git packages `~/.openclaw/git` के अंतर्गत clone होते हैं
- local/path/archive installs dependency repair के बिना copy या reference किए जाते हैं

npm installs उस per-plugin project root में इनके साथ चलते हैं:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` local npm-pack tarball के लिए उसी per-plugin npm
project root का उपयोग करता है। OpenClaw tarball का npm
metadata पढ़ता है, उसे managed project में copied `file:` dependency के रूप में जोड़ता है, normal npm install चलाता है,
और फिर Plugin पर भरोसा करने से पहले installed lockfile metadata verify करता है।
यह package-acceptance और release-candidate proof के लिए है, जहाँ
local pack artifact को उस registry artifact की तरह व्यवहार करना चाहिए जिसका वह simulation करता है।

publish से पहले official या external Plugin packages को test करते समय `npm-pack:` का उपयोग करें।
Raw archive या path install local debugging के लिए उपयोगी है, लेकिन यह
installed npm या ClawHub package जैसा वही dependency path prove नहीं करता।
`npm-pack:` managed package install shape prove करता है; यह अपने आप में
इस बात का proof नहीं है कि Plugin catalog-linked official content है।

जब behavior bundled-plugin या trusted official Plugin status पर निर्भर हो, तो
local package proof को catalog-backed official install या published
package path के साथ pair करें जो official trust रिकॉर्ड करता है। Privileged helper access और
trusted-official scope handling को उस trusted install
path पर validate किया जाना चाहिए, local tarball install से inferred नहीं।

यदि कोई Plugin runtime पर missing import के साथ fail होता है, तो managed project को हाथ से repair करने के बजाय package manifest
ठीक करें। Runtime imports Plugin package `dependencies` या `optionalDependencies` में होने चाहिए; `devDependencies`
managed runtime projects के लिए install नहीं की जातीं। `~/.openclaw/npm/projects/<encoded-package>` के अंदर local `npm install`
temporary diagnostic unblock कर सकता है,
लेकिन यह package-acceptance proof नहीं है क्योंकि अगला install या update
package metadata से project को फिर से बनाएगा।

npm transitive dependencies को per-plugin project के
`node_modules` में Plugin package के पास hoist कर सकता है। OpenClaw install पर भरोसा करने से पहले managed project
root scan करता है और uninstall के दौरान उस project को हटाता है, इसलिए
hoisted runtime dependencies उस Plugin की cleanup boundary के अंदर रहती हैं।

Published npm Plugin packages `npm-shrinkwrap.json` ship कर सकते हैं। npm install के दौरान उस
publishable lockfile का उपयोग करता है, और OpenClaw का managed npm project root
normal npm install path के माध्यम से उसे support करता है। OpenClaw-owned publishable
Plugin packages में उस Plugin package के published dependency graph से generate किया गया package-local shrinkwrap शामिल होना चाहिए:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator Plugin `devDependencies` हटाता है, workspace override
policy लागू करता है, और हर `publishToNpm` Plugin के लिए `extensions/<id>/npm-shrinkwrap.json` लिखता है।
Third-party Plugin packages भी shrinkwrap ship कर सकते हैं;
OpenClaw community packages के लिए इसे require नहीं करता, लेकिन मौजूद होने पर npm उसका सम्मान करेगा।

Local package को release-candidate proof मानने से पहले, install किए जाने वाले tarball को inspect करें:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Dependency changes के लिए, यह भी verify करें कि production install dev dependencies के बिना
runtime packages resolve कर सकता है:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw-owned npm Plugin packages explicit
`bundledDependencies` के साथ भी publish कर सकते हैं। npm publish path runtime dependency
name list overlay करता है, published package
manifest से dev-only workspace metadata हटाता है, package-local runtime
dependencies के लिए script-free npm install चलाता है, फिर उन dependency
files सहित Plugin tarball pack या publish करता है। Codex और ACP runtimes सहित native-heavy packages
`openclaw.release.bundleRuntimeDependencies: false` के साथ opt out करते हैं; वे packages फिर भी
अपना shrinkwrap ship करते हैं, लेकिन npm install के दौरान runtime dependencies resolve करता है
बजाय हर platform binary को Plugin tarball में embed करने के। Root
`openclaw` package अपनी पूरी dependency tree bundle नहीं करता।

जो Plugins `openclaw/plugin-sdk/*` import करते हैं, वे `openclaw` को peer
dependency declare करते हैं। OpenClaw npm को managed project में host package की अलग registry copy install नहीं करने देता,
क्योंकि stale host packages उस Plugin के अंदर npm
peer resolution को affect कर सकते हैं। Managed npm installs npm peer
resolution/materialization skip करते हैं और OpenClaw install या update के बाद host peer declare करने वाले installed packages के लिए plugin-local
`node_modules/openclaw` links फिर से assert करता है।

git installs repository को clone या refresh करते हैं, फिर चलाते हैं:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Installed Plugin फिर उस package directory से load होता है, इसलिए package-local
और parent `node_modules` resolution उसी तरह काम करता है जैसे normal
Node package के लिए करता है।

## Local Plugins

Local Plugins को developer-controlled directories माना जाता है। OpenClaw उनके लिए
`npm install`, `pnpm install`, या dependency repair नहीं चलाता। यदि किसी local
Plugin की dependencies हैं, तो उसे load करने से पहले उन्हें उस Plugin में install करें।

Third-party TypeScript local Plugins emergency Jiti path का उपयोग कर सकते हैं। Packaged
JavaScript Plugins और bundled internal Plugins Jiti के बजाय native
import/require के माध्यम से load होते हैं।

## Startup और reload

Gateway startup और config reload कभी Plugin dependencies install नहीं करते। वे
Plugin install records पढ़ते हैं, entrypoint compute करते हैं, और उसे load करते हैं।

यदि runtime पर कोई dependency missing है, तो Plugin load होने में fail होता है और error
operator को explicit fix की ओर point करना चाहिए:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` legacy OpenClaw-generated dependency state clean कर सकता है और
downloadable Plugins recover कर सकता है जो config में reference होने पर local install records से missing हैं।
Doctor पहले से installed local Plugin के लिए dependencies repair नहीं करता।

## Bundled Plugins

Lightweight और core-critical bundled Plugins OpenClaw के हिस्से के रूप में ship किए जाते हैं।
उनमें या तो heavy runtime dependency tree नहीं होनी चाहिए या उन्हें ClawHub/npm पर downloadable package में move किया जाना चाहिए।

Core package में ship होने वाले, externally install होने वाले, या source-only रहने वाले Plugins की current generated list के लिए [Plugin inventory](/hi/plugins/plugin-inventory) देखें।

Bundled Plugin manifests को dependency staging request नहीं करना चाहिए। Large या optional
Plugin functionality को normal Plugin के रूप में package किया जाना चाहिए और
third-party Plugins जैसे ही npm/git/ClawHub path के माध्यम से install किया जाना चाहिए।

Source checkouts में, OpenClaw repository को pnpm monorepo मानता है। `pnpm install` के बाद, bundled Plugins `extensions/<id>` से load होते हैं ताकि package-local
workspace dependencies उपलब्ध रहें और edits सीधे pick up हों। Source
checkout development केवल pnpm-only है; repository root पर plain `npm install`
bundled Plugin dependencies तैयार करने का supported तरीका नहीं है।

| Install shape                    | Bundled Plugin location               | Dependency owner                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Package के अंदर built runtime tree | OpenClaw package और explicit Plugin install/update/doctor flows     |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace packages  | pnpm workspace, जिसमें हर Plugin package की अपनी dependencies शामिल हैं |
| `openclaw plugins install ...`   | Managed npm project/git/ClawHub root  | Plugin install/update flow                                       |

## Legacy cleanup

पुराने OpenClaw versions startup पर या doctor repair के दौरान bundled-plugin dependency roots generate करते थे।
Current doctor cleanup `--fix` उपयोग होने पर उन stale directories और
symlinks को हटाता है, जिसमें old `plugin-runtime-deps` roots, pruned `plugin-runtime-deps` targets की ओर point करने वाले global
Node-prefix package symlinks,
`.openclaw-runtime-deps*` manifests, generated Plugin `node_modules`, install
stage directories, और package-local pnpm stores शामिल हैं। Packaged postinstall भी
legacy target roots prune करने से पहले उन global symlinks को हटाता है ताकि upgrades
dangling ESM package imports न छोड़ें।

पुराने npm installs ने shared `~/.openclaw/npm/node_modules` root भी उपयोग किया था।
Current install, update, uninstall, और doctor flows अभी भी उस legacy
flat root को केवल recovery और cleanup के लिए recognize करते हैं। New npm installs को
इसके बजाय per-plugin project roots create करने चाहिए।
