---
read_when:
    - आप Plugin पैकेज इंस्टॉल की डीबगिंग कर रहे हैं
    - आप Plugin स्टार्टअप, डॉक्टर, या पैकेज-मैनेजर स्थापना व्यवहार बदल रहे हैं
    - आप पैकेज्ड OpenClaw इंस्टॉलेशन या बंडल किए गए Plugin मैनिफ़ेस्ट का रखरखाव कर रहे हैं
sidebarTitle: Dependencies
summary: OpenClaw Plugin पैकेज कैसे इंस्टॉल करता है और Plugin निर्भरताओं को कैसे हल करता है
title: Plugin निर्भरता समाधान
x-i18n:
    generated_at: "2026-06-28T23:35:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw Plugin निर्भरता का काम इंस्टॉल/अपडेट समय पर रखता है। रनटाइम लोडिंग
package manager नहीं चलाती, निर्भरता ट्री की मरम्मत नहीं करती, या OpenClaw
package directory को बदलती नहीं है।

## जिम्मेदारी का विभाजन

Plugin package अपने dependency graph के स्वामी होते हैं:

- runtime dependencies Plugin package `dependencies` या
  `optionalDependencies` में रहती हैं
- SDK/core imports peer या supplied OpenClaw imports होते हैं
- local development plugins अपनी पहले से इंस्टॉल की गई dependencies साथ लाते हैं
- npm और git plugins OpenClaw-स्वामित्व वाले package roots में इंस्टॉल किए जाते हैं

OpenClaw केवल Plugin lifecycle का स्वामी है:

- Plugin source खोजें
- स्पष्ट रूप से अनुरोध किए जाने पर package इंस्टॉल या अपडेट करें
- install metadata रिकॉर्ड करें
- Plugin entrypoint लोड करें
- dependencies गायब होने पर actionable error के साथ विफल हों

## Install roots

OpenClaw स्थिर per-source roots का उपयोग करता है:

- npm packages per-plugin projects में इंस्टॉल होते हैं
  `~/.openclaw/npm/projects/<encoded-package>` के अंतर्गत
- git packages `~/.openclaw/git` के अंतर्गत clone होते हैं
- local/path/archive installs dependency repair के बिना copied या referenced होते हैं

npm installs उस per-plugin project root में इनके साथ चलते हैं:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` local npm-pack tarball के लिए उसी per-plugin npm
project root का उपयोग करता है। OpenClaw tarball का npm
metadata पढ़ता है, उसे managed project में copied `file:` dependency के रूप में जोड़ता है, normal npm install चलाता है,
और फिर Plugin पर भरोसा करने से पहले installed lockfile metadata सत्यापित करता है।
यह package-acceptance और release-candidate proof के लिए है, जहाँ
local pack artifact को उस registry artifact जैसा व्यवहार करना चाहिए जिसका वह simulation करता है।

npm transitive dependencies को per-plugin project के
`node_modules` में Plugin package के पास hoist कर सकता है। OpenClaw install पर भरोसा करने से पहले managed project
root को scan करता है और uninstall के दौरान उस project को हटा देता है, इसलिए
hoisted runtime dependencies उस Plugin की cleanup boundary के भीतर रहती हैं।

Published npm Plugin packages `npm-shrinkwrap.json` ship कर सकते हैं। npm install के दौरान उस
publishable lockfile का उपयोग करता है, और OpenClaw का managed npm project root
normal npm install path के माध्यम से इसका समर्थन करता है। OpenClaw-स्वामित्व वाले publishable
Plugin packages में उस Plugin package के published dependency graph से generate किया गया package-local shrinkwrap शामिल होना चाहिए:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator Plugin `devDependencies` हटाता है, workspace override
policy लागू करता है, और हर `publishToNpm` Plugin के लिए
`extensions/<id>/npm-shrinkwrap.json` लिखता है। Third-party Plugin packages भी shrinkwrap ship कर सकते हैं;
OpenClaw community packages के लिए इसे अनिवार्य नहीं करता, लेकिन मौजूद होने पर npm इसका सम्मान करेगा।

OpenClaw-स्वामित्व वाले npm Plugin packages explicit
`bundledDependencies` के साथ भी publish कर सकते हैं। npm publish path runtime dependency
name list overlay करता है, published package
manifest से dev-only workspace metadata हटाता है, package-local runtime
dependencies के लिए script-free npm install चलाता है, फिर Plugin tarball को उन dependency
files के साथ pack या publish करता है। Codex और ACP runtimes सहित native-heavy packages,
`openclaw.release.bundleRuntimeDependencies: false` के साथ opt out करते हैं; वे packages अभी भी
अपना shrinkwrap ship करते हैं, लेकिन npm Plugin tarball में हर platform binary embed करने के बजाय
install के दौरान runtime dependencies resolve करता है। root
`openclaw` package अपनी पूरी dependency tree bundle नहीं करता।

जो plugins `openclaw/plugin-sdk/*` import करते हैं, वे `openclaw` को peer
dependency घोषित करते हैं। OpenClaw npm को host package की अलग registry copy
managed project में install नहीं करने देता, क्योंकि stale host packages उस Plugin के भीतर npm
peer resolution को प्रभावित कर सकते हैं। Managed npm installs npm peer
resolution/materialization छोड़ते हैं और OpenClaw install या update के बाद host peer घोषित करने वाले installed packages के लिए plugin-local
`node_modules/openclaw` links फिर से लागू करता है।

git installs repository clone या refresh करते हैं, फिर चलाते हैं:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

फिर installed Plugin उसी package directory से load होता है, इसलिए package-local
और parent `node_modules` resolution उसी तरह काम करता है जैसे सामान्य
Node package के लिए करता है।

## Local plugins

Local plugins को developer-controlled directories माना जाता है। OpenClaw उनके लिए
`npm install`, `pnpm install`, या dependency repair नहीं चलाता। अगर local
Plugin में dependencies हैं, तो उसे load करने से पहले उन्हें उस Plugin में install करें।

Third-party TypeScript local plugins emergency Jiti path का उपयोग कर सकते हैं। Packaged
JavaScript plugins और bundled internal plugins Jiti के बजाय native
import/require के माध्यम से load होते हैं।

## Startup और reload

Gateway startup और config reload कभी Plugin dependencies install नहीं करते। वे
Plugin install records पढ़ते हैं, entrypoint compute करते हैं, और उसे load करते हैं।

अगर runtime पर कोई dependency गायब है, तो Plugin load होने में विफल होता है और error
operator को explicit fix की ओर इंगित करना चाहिए:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` legacy OpenClaw-generated dependency state को साफ कर सकता है और
downloadable plugins को recover कर सकता है जो config में reference होने पर local install records से गायब हैं।
Doctor पहले से installed local Plugin के लिए dependencies repair नहीं करता।

## Bundled plugins

Lightweight और core-critical bundled plugins OpenClaw के हिस्से के रूप में ship किए जाते हैं।
उनमें या तो heavy runtime dependency tree नहीं होना चाहिए या उन्हें
ClawHub/npm पर downloadable package में move किया जाना चाहिए।

core package में ship होने वाले, externally install होने वाले, या source-only रहने वाले plugins की current generated list के लिए
[Plugin इन्वेंटरी](/hi/plugins/plugin-inventory) देखें।

Bundled Plugin manifests को dependency staging का अनुरोध नहीं करना चाहिए। Large या optional
Plugin functionality को normal Plugin के रूप में package किया जाना चाहिए और
third-party plugins की तरह उसी npm/git/ClawHub path से install किया जाना चाहिए।

Source checkouts में, OpenClaw repository को pnpm monorepo मानता है। 
`pnpm install` के बाद, bundled plugins `extensions/<id>` से load होते हैं ताकि package-local
workspace dependencies उपलब्ध हों और edits सीधे pick up हों। Source
checkout development केवल pnpm है; repository root पर plain `npm install`
bundled Plugin dependencies तैयार करने का supported तरीका नहीं है।

| Install shape                    | Bundled Plugin location              | Dependency owner                                                     |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | package के भीतर built runtime tree   | OpenClaw package और explicit Plugin install/update/doctor flows      |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace packages | pnpm workspace, जिसमें हर Plugin package की अपनी dependencies शामिल हैं |
| `openclaw plugins install ...`   | Managed npm project/git/ClawHub root | Plugin install/update flow                                           |

## Legacy cleanup

पुराने OpenClaw versions startup पर या doctor repair के दौरान bundled-plugin dependency roots generate करते थे।
Current doctor cleanup `--fix` उपयोग होने पर उन stale directories और
symlinks को हटाता है, जिनमें पुराने `plugin-runtime-deps` roots, pruned `plugin-runtime-deps` targets की ओर point करने वाले global
Node-prefix package symlinks,
`.openclaw-runtime-deps*` manifests, generated Plugin `node_modules`, install
stage directories, और package-local pnpm stores शामिल हैं। Packaged postinstall भी
legacy target roots prune करने से पहले उन global symlinks को हटाता है ताकि upgrades
dangling ESM package imports न छोड़ें।

पुराने npm installs ने shared `~/.openclaw/npm/node_modules` root भी इस्तेमाल किया।
Current install, update, uninstall, और doctor flows अभी भी उस legacy
flat root को केवल recovery और cleanup के लिए पहचानते हैं। New npm installs को
per-plugin project roots बनाना चाहिए।
