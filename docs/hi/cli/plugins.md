---
read_when:
    - आप Gateway Plugin या संगत बंडल इंस्टॉल या प्रबंधित करना चाहते हैं
    - आप एक सरल टूल Plugin को स्कैफोल्ड या मान्य करना चाहते हैं
    - आप Plugin लोड विफलताओं को डीबग करना चाहते हैं
sidebarTitle: Plugins
summary: '`openclaw plugins` के लिए CLI संदर्भ (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-06-28T22:51:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugins, hook packs, और संगत bundles प्रबंधित करें।

<CardGroup cols={2}>
  <Card title="Plugin सिस्टम" href="/hi/tools/plugin">
    plugins इंस्टॉल, सक्षम और समस्या-निवारण करने के लिए अंतिम-उपयोगकर्ता गाइड।
  </Card>
  <Card title="Plugins प्रबंधित करें" href="/hi/plugins/manage-plugins">
    इंस्टॉल, सूची, अपडेट, अनइंस्टॉल और प्रकाशन के लिए त्वरित उदाहरण।
  </Card>
  <Card title="Plugin bundles" href="/hi/plugins/bundles">
    Bundle संगतता मॉडल।
  </Card>
  <Card title="Plugin manifest" href="/hi/plugins/manifest">
    Manifest फ़ील्ड और config schema।
  </Card>
  <Card title="सुरक्षा" href="/hi/gateway/security">
    plugin इंस्टॉल के लिए सुरक्षा सुदृढ़ीकरण।
  </Card>
</CardGroup>

## कमांड

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

धीमे install, inspect, uninstall, या registry-refresh जांच के लिए, कमांड को
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` के साथ चलाएं। trace phase timings को
stderr में लिखता है और JSON आउटपुट को parseable रखता है। [Debugging](/hi/help/debugging#plugin-lifecycle-trace) देखें।

<Note>
Nix मोड (`OPENCLAW_NIX_MODE=1`) में, plugin lifecycle mutators अक्षम होते हैं। इस इंस्टॉल के लिए `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, या `plugins disable` के बजाय Nix source का उपयोग करें; nix-openclaw के लिए, agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) का उपयोग करें।
</Note>

<Note>
Bundled plugins OpenClaw के साथ शिप होते हैं। कुछ डिफ़ॉल्ट रूप से सक्षम होते हैं (उदाहरण के लिए bundled model providers, bundled speech providers, और bundled browser plugin); अन्य के लिए `plugins enable` आवश्यक है।

Native OpenClaw plugins को inline JSON Schema (`configSchema`, भले ही खाली हो) के साथ `openclaw.plugin.json` शिप करना होगा। Compatible bundles इसके बजाय अपने bundle manifests का उपयोग करते हैं।

`plugins list` `Format: openclaw` या `Format: bundle` दिखाता है। Verbose list/info आउटपुट bundle subtype (`codex`, `claude`, या `cursor`) और detected bundle capabilities भी दिखाता है।
</Note>

### Author

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` डिफ़ॉल्ट रूप से एक न्यूनतम TypeScript tool plugin बनाता है। पहला
argument plugin id है; display name के लिए `--name` पास करें। OpenClaw default
output directory और package naming के लिए id का उपयोग करता है। Tool scaffolds
`defineToolPlugin` का उपयोग करते हैं।
`plugins build` built entry को import करता है, उसका static tool metadata पढ़ता है,
`openclaw.plugin.json` लिखता है, और `package.json` `openclaw.extensions` को aligned रखता है।
`plugins validate` जांचता है कि generated manifest, package metadata, और
current entry export अभी भी मेल खाते हैं। पूरा tool-authoring workflow देखने के लिए
[Tool Plugins](/hi/plugins/tool-plugins) देखें।

Scaffold TypeScript source लिखता है लेकिन built `./dist/index.js` entry से metadata generate करता है
ताकि workflow published CLI के साथ भी काम करे। जब entry default package entry न हो तो
`--entry <path>` का उपयोग करें। CI में `plugins build --check` का उपयोग करें ताकि
generated metadata stale होने पर files rewrite किए बिना fail हो।

### Provider Scaffold

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Provider scaffolds OpenAI-compatible API-key plumbing, `clawhub package
validate` के लिए built-in `npm run validate` script, ClawHub package metadata, और
GitHub Actions OIDC के माध्यम से भविष्य के trusted publishing के लिए manually dispatched GitHub workflow के साथ एक generic text/model provider plugin बनाते हैं। Provider scaffolds
skills generate नहीं करते और `openclaw plugins build` या
`openclaw plugins validate` का उपयोग नहीं करते; ये commands tool scaffold के
generated metadata path के लिए हैं।

प्रकाशन से पहले, placeholder API base URL, model catalog, docs
route, credential text, और README copy को वास्तविक provider details से बदलें। पहली बार ClawHub publishing और trusted publisher setup के लिए
generated README का उपयोग करें।

### Install

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Maintainers setup-time installs का परीक्षण करते समय guarded environment variables के साथ automatic plugin install
sources override कर सकते हैं। देखें
[Plugin install overrides](/hi/plugins/install-overrides)।

<Warning>
Bare package names launch cutover के दौरान डिफ़ॉल्ट रूप से npm से इंस्टॉल होते हैं, जब तक वे official plugin id से मेल न खाते हों। bundled plugins से मेल खाने वाले raw `@openclaw/*` package specs वर्तमान OpenClaw build के साथ shipped bundled copy का उपयोग करते हैं। जब आप जानबूझकर इसके बजाय external npm package चाहते हों तो `npm:<package>` का उपयोग करें। ClawHub के लिए `clawhub:<package>` का उपयोग करें। Plugin installs को code चलाने जैसा मानें। Pinned versions को प्राथमिकता दें।
</Warning>

`plugins search` installable plugin packages के लिए ClawHub query करता है और
install-ready package names print करता है। यह code-plugin और bundle-plugin packages खोजता है,
skills नहीं। ClawHub skills के लिए `openclaw skills search` का उपयोग करें।

<Note>
ClawHub अधिकांश plugins के लिए primary distribution और discovery surface है। Npm
supported fallback और direct-install path बना रहता है। OpenClaw-owned
`@openclaw/*` plugin packages npm पर फिर से प्रकाशित हैं; वर्तमान सूची
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) या
[plugin inventory](/hi/plugins/plugin-inventory) पर देखें। Stable installs `latest` का उपयोग करते हैं।
Beta-channel installs और updates npm `beta` dist-tag को प्राथमिकता देते हैं जब वह tag
available हो, फिर `latest` पर fallback करते हैं।
</Note>

<AccordionGroup>
  <Accordion title="Config includes और invalid-config repair">
    यदि आपका `plugins` section single-file `$include` से backed है, तो `plugins install/update/enable/disable/uninstall` उस included file में write through करते हैं और `openclaw.json` को untouched छोड़ते हैं। Root includes, include arrays, और sibling overrides वाले includes flattening के बजाय fail closed होते हैं। Supported shapes के लिए [Config includes](/hi/gateway/configuration) देखें।

    यदि install के दौरान config invalid है, तो `plugins install` सामान्यतः fail closed होता है और आपको पहले `openclaw doctor --fix` चलाने को कहता है। Gateway startup और hot reload के दौरान, invalid plugin config किसी भी अन्य invalid config की तरह fail closed होता है; `openclaw doctor --fix` invalid plugin entry को quarantine कर सकता है। एकमात्र documented install-time exception उन plugins के लिए narrow bundled-plugin recovery path है जो स्पष्ट रूप से `openclaw.install.allowInvalidConfigRecovery` opt into करते हैं।

  </Accordion>
  <Accordion title="--force और reinstall बनाम update">
    `--force` existing install target को reuse करता है और पहले से installed plugin या hook pack को उसी जगह overwrite करता है। इसका उपयोग तब करें जब आप जानबूझकर same id को नए local path, archive, ClawHub package, या npm artifact से reinstall कर रहे हों। पहले से tracked npm plugin के routine upgrades के लिए, `openclaw plugins update <id-or-npm-spec>` को प्राथमिकता दें।

    यदि आप पहले से installed plugin id के लिए `plugins install` चलाते हैं, तो OpenClaw रुकता है और normal upgrade के लिए आपको `plugins update <id-or-npm-spec>` की ओर, या जब आप वास्तव में current install को different source से overwrite करना चाहते हों तो `plugins install <package> --force` की ओर इंगित करता है।

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` केवल npm installs पर लागू होता है। यह `git:` installs के साथ supported नहीं है; pinned source चाहिए हो तो `git:github.com/acme/plugin@v1.2.3` जैसा explicit git ref उपयोग करें। यह `--marketplace` के साथ supported नहीं है, क्योंकि marketplace installs npm spec के बजाय marketplace source metadata persist करते हैं।
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` deprecated है और अब no-op है। OpenClaw अब plugin installs के लिए built-in install-time dangerous-code blocking नहीं चलाता।

    जब host-specific install policy आवश्यक हो, तो shared operator-owned `security.installPolicy` surface का उपयोग करें। Plugin `before_install` hooks plugin-runtime lifecycle hooks हैं और CLI installs के लिए primary policy boundary नहीं हैं।

    यदि ClawHub पर प्रकाशित आपका plugin registry scan द्वारा hidden या blocked है, तो [ClawHub publishing](/hi/clawhub/publishing) में publisher steps का उपयोग करें। `--dangerously-force-unsafe-install` ClawHub से plugin rescan करने या blocked release को public बनाने के लिए नहीं कहता।

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Community ClawHub installs package download करने से पहले selected release trust record जांचते हैं। यदि ClawHub release के लिए download disable करता है, malicious scan findings report करता है, या release को quarantine जैसी blocking moderation state में रखता है, तो OpenClaw release अस्वीकार कर देता है। Non-blocking risky scan statuses, risky moderation states, या registry reasons के लिए, OpenClaw trust details दिखाता है और जारी रखने से पहले confirmation मांगता है।

    `--acknowledge-clawhub-risk` का उपयोग केवल ClawHub warning की समीक्षा करने और interactive prompt के बिना जारी रखने का निर्णय लेने के बाद करें। Pending या stale clean trust records warning देते हैं लेकिन acknowledgement की आवश्यकता नहीं होती। Official ClawHub packages और bundled OpenClaw plugin sources इस release-trust prompt को bypass करते हैं।

  </Accordion>
  <Accordion title="Hook packs और npm specs">
    `plugins install` उन hook packs के लिए भी install surface है जो `package.json` में `openclaw.hooks` expose करते हैं। Filtered hook visibility और per-hook enablement के लिए `openclaw hooks` का उपयोग करें, package installation के लिए नहीं।

    Npm specs **registry-only** हैं (package name + वैकल्पिक **exact version** या **dist-tag**)। Git/URL/file specs और semver ranges अस्वीकार कर दिए जाते हैं। सुरक्षा के लिए dependency installs प्रति Plugin एक managed npm project में `--ignore-scripts` के साथ चलते हैं, भले ही आपके shell में global npm install settings हों। Managed plugin npm projects OpenClaw के package-level npm `overrides` को inherit करते हैं, इसलिए host security pins hoisted plugin dependencies पर भी लागू होते हैं।

    जब आप npm resolution को स्पष्ट बनाना चाहते हैं, तो `npm:<package>` का उपयोग करें। Bare package specs भी launch cutover के दौरान सीधे npm से install होते हैं, जब तक वे किसी official plugin id से match न करें।

    Raw `@openclaw/*` package specs जो bundled plugins से match करते हैं, npm fallback से पहले image-owned bundled copy पर resolve होते हैं। उदाहरण के लिए, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` managed npm override बनाने के बजाय मौजूदा OpenClaw build से bundled Discord plugin का उपयोग करता है। external npm package को force करने के लिए, `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` का उपयोग करें।

    Bare specs और `@latest` stable track पर रहते हैं। OpenClaw date-stamped correction versions, जैसे `2026.5.3-1`, इस check के लिए stable releases हैं। यदि npm इनमें से किसी को prerelease पर resolve करता है, तो OpenClaw रुक जाता है और आपसे `@beta`/`@rc` जैसे prerelease tag या `@1.2.3-beta.4` जैसे exact prerelease version के साथ स्पष्ट रूप से opt in करने को कहता है।

    exact version के बिना npm installs (`npm:<package>` या `npm:<package>@latest`) के लिए, OpenClaw install से पहले resolved package metadata check करता है। यदि latest stable package को newer OpenClaw plugin API या minimum host version की आवश्यकता है, तो OpenClaw पुराने stable versions inspect करता है और उसके बजाय newest compatible release install करता है। Exact versions और `@beta` जैसे explicit dist-tags strict रहते हैं: यदि selected package incompatible है, तो command fail होता है और आपसे OpenClaw upgrade करने या compatible version चुनने को कहता है।

    यदि कोई bare install spec किसी official plugin id (उदाहरण के लिए `diffs`) से match करता है, तो OpenClaw catalog entry सीधे install करता है। उसी नाम वाले npm package को install करने के लिए, explicit scoped spec (उदाहरण के लिए `@scope/diffs`) का उपयोग करें।

  </Accordion>
  <Accordion title="Git repositories">
    git repository से सीधे install करने के लिए `git:<repo>` का उपयोग करें। Supported forms में `git:github.com/owner/repo`, `git:owner/repo`, full `https://`, `ssh://`, `git://`, `file://`, और `git@host:owner/repo.git` clone URLs शामिल हैं। Install से पहले branch, tag, या commit check out करने के लिए `@<ref>` या `#<ref>` जोड़ें।

    Git installs temporary directory में clone करते हैं, मौजूद होने पर requested ref check out करते हैं, फिर normal plugin directory installer का उपयोग करते हैं। इसका मतलब है कि manifest validation, operator install policy, package-manager install work, और install records npm installs की तरह behave करते हैं। Recorded git installs में source URL/ref के साथ resolved commit शामिल होता है ताकि `openclaw plugins update` source को बाद में फिर से resolve कर सके।

    git से install करने के बाद, gateway methods और CLI commands जैसे runtime registrations verify करने के लिए `openclaw plugins inspect <id> --runtime --json` का उपयोग करें। यदि plugin ने `api.registerCli` के साथ CLI root register किया है, तो उस command को OpenClaw root CLI के माध्यम से सीधे execute करें, उदाहरण के लिए `openclaw demo-plugin ping`।

  </Accordion>
  <Accordion title="Archives">
    Supported archives: `.zip`, `.tgz`, `.tar.gz`, `.tar`। Native OpenClaw plugin archives में extracted plugin root पर valid `openclaw.plugin.json` होना चाहिए; केवल `package.json` रखने वाले archives को OpenClaw install records लिखने से पहले reject कर देता है।

    जब file npm-pack tarball हो और आप registry installs द्वारा उपयोग किए जाने वाले same per-plugin managed npm project path को test करना चाहते हों, तो `npm-pack:<path.tgz>` का उपयोग करें, जिसमें `package-lock.json` verification, hoisted dependency scanning, और npm install records शामिल हैं। Plain archive paths अब भी plugin extensions root के अंतर्गत local archives के रूप में install होते हैं।

    Claude marketplace installs भी supported हैं।

  </Accordion>
</AccordionGroup>

ClawHub installs explicit `clawhub:<package>` locator का उपयोग करते हैं:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare npm-safe plugin specs launch cutover के दौरान default रूप से npm से install होते हैं, जब तक वे official plugin id से match न करें:

```bash
openclaw plugins install openclaw-codex-app-server
```

npm-only resolution को स्पष्ट बनाने के लिए `npm:` का उपयोग करें:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw install से पहले advertised plugin API / minimum gateway compatibility check करता है। जब selected ClawHub version कोई ClawPack artifact publish करता है, OpenClaw versioned npm-pack `.tgz` download करता है, ClawHub digest header और artifact digest verify करता है, फिर उसे normal archive path के माध्यम से install करता है। ClawPack metadata के बिना पुराने ClawHub versions अब भी legacy package archive verification path के माध्यम से install होते हैं। Recorded installs अपने ClawHub source metadata, artifact kind, npm integrity, npm shasum, tarball name, और ClawPack digest facts को later updates के लिए रखते हैं।
Unversioned ClawHub installs unversioned recorded spec रखते हैं ताकि `openclaw plugins update` newer ClawHub releases follow कर सके; `clawhub:pkg@1.2.3` और `clawhub:pkg@beta` जैसे explicit version या tag selectors उस selector पर pinned रहते हैं।

#### Marketplace shorthand

जब marketplace name Claude के local registry cache `~/.claude/plugins/known_marketplaces.json` में मौजूद हो, तो `plugin@marketplace` shorthand का उपयोग करें:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

जब आप marketplace source को स्पष्ट रूप से pass करना चाहते हों, तो `--marketplace` का उपयोग करें:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` से Claude known-marketplace name
    - local marketplace root या `marketplace.json` path
    - `owner/repo` जैसा GitHub repo shorthand
    - `https://github.com/owner/repo` जैसा GitHub repo URL
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub या git से load किए गए remote marketplaces के लिए, plugin entries cloned marketplace repo के अंदर ही रहनी चाहिए। OpenClaw उस repo से relative path sources accept करता है और remote manifests से HTTP(S), absolute-path, git, GitHub, और अन्य non-path plugin sources reject करता है।
  </Tab>
</Tabs>

Local paths और archives के लिए, OpenClaw auto-detect करता है:

- native OpenClaw plugins (`openclaw.plugin.json`)
- Codex-compatible bundles (`.codex-plugin/plugin.json`)
- Claude-compatible bundles (`.claude-plugin/plugin.json` या default Claude component layout)
- Cursor-compatible bundles (`.cursor-plugin/plugin.json`)

Managed local installs plugin directories या archives होने चाहिए। Standalone `.js`,
`.mjs`, `.cjs`, और `.ts` plugin files को `plugins install` द्वारा managed plugin
root में copy नहीं किया जाता; इसके बजाय उन्हें `plugins.load.paths` में explicitly list करें।

<Note>
Compatible bundles normal plugin root में install होते हैं और same list/info/enable/disable flow में participate करते हैं। आज, bundle skills, Claude command-skills, Claude `settings.json` defaults, Claude `.lsp.json` / manifest-declared `lspServers` defaults, Cursor command-skills, और compatible Codex hook directories supported हैं; अन्य detected bundle capabilities diagnostics/info में दिखती हैं, लेकिन अभी runtime execution में wired नहीं हैं।
</Note>

### सूची

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  केवल enabled plugins दिखाएँ।
</ParamField>
<ParamField path="--verbose" type="boolean">
  table view से source/origin/version/activation metadata वाली per-plugin detail lines पर switch करें।
</ParamField>
<ParamField path="--json" type="boolean">
  Machine-readable inventory के साथ registry diagnostics और package dependency install state।
</ParamField>

<Note>
`plugins list` पहले persisted local plugin registry पढ़ता है, और registry missing या invalid होने पर manifest-only derived fallback के साथ चलता है। यह check करने के लिए उपयोगी है कि plugin installed, enabled, और cold startup planning के लिए visible है या नहीं, लेकिन यह पहले से चल रहे Gateway process का live runtime probe नहीं है। Plugin code, enablement, hook policy, या `plugins.load.paths` बदलने के बाद, नए `register(api)` code या hooks चलने की अपेक्षा करने से पहले channel serve करने वाले Gateway को restart करें। Remote/container deployments के लिए, verify करें कि आप actual `openclaw gateway run` child restart कर रहे हैं, केवल wrapper process नहीं।

`plugins list --json` में `package.json` `dependencies` और `optionalDependencies` से प्रत्येक plugin का `dependencyStatus` शामिल होता है। OpenClaw check करता है कि वे package names plugin के normal Node `node_modules` lookup path पर मौजूद हैं या नहीं; यह plugin runtime code import नहीं करता, package manager नहीं चलाता, और missing dependencies repair नहीं करता।
</Note>

यदि startup logs में `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` आता है,
तो plugin ids confirm करने के लिए `openclaw plugins list --enabled --verbose` या
listed plugin id के साथ `openclaw plugins inspect <id>` चलाएँ
और trusted ids को `openclaw.json` में `plugins.allow` में copy करें। जब
warning हर discovered plugin list कर सके, तो यह ready-to-paste
`plugins.allow` snippet print करता है जिसमें वे ids पहले से शामिल होते हैं। यदि कोई plugin
install/load-path provenance के बिना load होता है, तो उस plugin id को inspect करें, फिर या तो
trusted id को `plugins.allow` में pin करें या plugin को trusted source से reinstall करें
ताकि OpenClaw install provenance record करे।

`plugins search` remote ClawHub catalog lookup है। यह local
state inspect नहीं करता, config mutate नहीं करता, packages install नहीं करता, या plugin runtime code load नहीं करता। Search
results में ClawHub package name, family, channel, version, summary, और
`openclaw plugins install clawhub:<package>` जैसा install hint शामिल होता है।

Packaged Docker image के अंदर bundled plugin work के लिए, plugin
source directory को matching packaged source path पर bind-mount करें, जैसे
`/app/extensions/synology-chat`। OpenClaw उस mounted source
overlay को `/app/dist/extensions/synology-chat` से पहले discover करेगा; plain copied source
directory inert रहती है ताकि normal packaged installs अब भी compiled dist का उपयोग करें।

Runtime hook debugging के लिए:

- `openclaw plugins inspect <id> --runtime --json` module-loaded inspection pass से registered hooks और diagnostics दिखाता है। Runtime inspection कभी dependencies install नहीं करता; legacy dependency state clean करने या config द्वारा referenced missing downloadable plugins recover करने के लिए `openclaw doctor --fix` का उपयोग करें।
- `openclaw gateway status --deep --require-rpc` reachable Gateway URL/profile, service/process hints, config path, और RPC health confirm करता है।
- Non-bundled conversation hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) को `plugins.entries.<id>.hooks.allowConversationAccess=true` चाहिए।

Local plugin directory copy करने से बचने के लिए `--link` का उपयोग करें (`plugins.load.paths` में जोड़ता है):

```bash
openclaw plugins install -l ./my-plugin
```

Standalone plugin files को `plugins install` के साथ install करने या सीधे
`~/.openclaw/extensions` या `<workspace>/.openclaw/extensions` में रखने के बजाय
`plugins.load.paths` में list करना चाहिए। वे auto-discovered roots plugin
package या bundle directories load करते हैं, जबकि top-level script files local
helpers की तरह treat होती हैं और skip कर दी जाती हैं।

<Note>
workspace extensions root से खोजे गए workspace-origin Plugin तब तक
import या execute नहीं किए जाते जब तक उन्हें स्पष्ट रूप से enabled न किया जाए। स्थानीय development के लिए,
`openclaw plugins enable <plugin-id>` चलाएं या
`plugins.entries.<plugin-id>.enabled: true` सेट करें; यदि आपका config
`plugins.allow` का उपयोग करता है, तो वही plugin id वहां भी शामिल करें। यह fail-closed नियम
तब भी लागू होता है जब channel setup setup-only loading के लिए किसी workspace-origin Plugin को
स्पष्ट रूप से target करता है, इसलिए स्थानीय channel Plugin setup code तब तक नहीं चलेगा जब तक वह
workspace Plugin disabled रहे या allowlist से बाहर रहे। Linked installs
और स्पष्ट `plugins.load.paths` entries अपने resolved Plugin origin के लिए सामान्य policy का पालन करती हैं। देखें
[Plugin policy configure करें](/hi/tools/plugin#configure-plugin-policy)
और [Configuration reference](/hi/gateway/configuration-reference#plugins).

`--force` `--link` के साथ supported नहीं है क्योंकि linked installs managed install target पर copy करने के बजाय source path का फिर से उपयोग करते हैं।

npm installs पर `--pin` का उपयोग करें ताकि resolved exact spec (`name@version`) managed Plugin index में save हो, जबकि default behavior unpinned बना रहे।
</Note>

### Plugin इंडेक्स

Plugin install metadata machine-managed state है, user config नहीं। Installs और updates इसे active OpenClaw state directory के अंतर्गत shared SQLite state database में लिखते हैं। `installed_plugin_index` row durable `installRecords` metadata store करती है, जिसमें टूटे या missing Plugin manifests के records शामिल हैं, साथ ही `openclaw plugins update`, uninstall, diagnostics, और cold Plugin registry द्वारा उपयोग किया जाने वाला manifest-derived cold registry cache भी शामिल है।

जब OpenClaw config में shipped legacy `plugins.installs` records देखता है, तो runtime reads उन्हें `openclaw.json` rewrite किए बिना compatibility input के रूप में treat करते हैं। Explicit Plugin writes और `openclaw doctor --fix` उन records को Plugin index में move करते हैं और config writes allowed होने पर config key remove करते हैं; यदि कोई भी write fail होता है, तो config records रखे जाते हैं ताकि install metadata lost न हो।

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` लागू होने पर `plugins.entries`, persisted Plugin index, Plugin allow/deny list entries, और linked `plugins.load.paths` entries से Plugin records remove करता है। जब तक `--keep-files` set न हो, uninstall tracked managed install directory को भी remove करता है जब वह OpenClaw के Plugin extensions root के अंदर हो। Active memory Plugin के लिए, memory slot `memory-core` पर reset होता है।

<Note>
`--keep-config` `--keep-files` के deprecated alias के रूप में supported है।
</Note>

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates managed Plugin index में tracked Plugin installs और `hooks.internal.installs` में tracked hook-pack installs पर apply होते हैं।

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    जब आप कोई Plugin id pass करते हैं, OpenClaw उस Plugin के लिए recorded install spec का फिर से उपयोग करता है। इसका मतलब है कि पहले store किए गए dist-tags जैसे `@beta` और exact pinned versions बाद के `update <id>` runs में उपयोग होते रहते हैं।

    `update <id> --dry-run` के दौरान, exact pinned npm installs pinned रहते हैं। यदि OpenClaw package की registry default line भी resolve कर सकता है और वह default line installed pinned version से newer है, तो dry run pin report करता है और registry default line follow करने के लिए स्पष्ट `@latest` package update command print करता है।

    वह targeted-update rule bulk `openclaw plugins update --all` maintenance path से अलग है। Bulk updates अब भी ordinary tracked install specs का सम्मान करते हैं, लेकिन trusted official OpenClaw Plugin records stale exact official package पर रहने के बजाय current official catalog target से sync हो सकते हैं। जब आप जानबूझकर किसी exact या tagged official spec को untouched रखना चाहते हैं, तब targeted `update <id>` का उपयोग करें।

    npm installs के लिए, आप dist-tag या exact version वाला explicit npm package spec भी pass कर सकते हैं। OpenClaw उस package name को tracked Plugin record पर वापस resolve करता है, उस installed Plugin को update करता है, और future id-based updates के लिए नया npm spec record करता है।

    version या tag के बिना npm package name pass करना भी tracked Plugin record पर वापस resolve होता है। इसका उपयोग तब करें जब कोई Plugin exact version पर pinned था और आप उसे registry की default release line पर वापस move करना चाहते हैं।

  </Accordion>
  <Accordion title="Beta channel updates">
    Targeted `openclaw plugins update <id-or-npm-spec>` tracked Plugin spec का फिर से उपयोग करता है जब तक आप नया spec pass न करें। Bulk `openclaw plugins update --all` configured `update.channel` का उपयोग करता है जब वह trusted official Plugin records को official catalog target से sync करता है, इसलिए beta-channel installs silently stable/latest पर normalized होने के बजाय beta release line पर रह सकते हैं।

    `openclaw update` active OpenClaw update channel भी जानता है: beta channel पर, default-line npm और ClawHub Plugin records पहले `@beta` try करते हैं। यदि कोई Plugin beta release मौजूद नहीं है, तो वे recorded default/latest spec पर fallback करते हैं; npm Plugin तब भी fallback करते हैं जब beta package मौजूद हो लेकिन install validation fail करे। उस fallback को warning के रूप में report किया जाता है और core update fail नहीं होता। Exact versions और explicit tags targeted updates के लिए उसी selector पर pinned रहते हैं।

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    live npm update से पहले, OpenClaw installed package version को npm registry metadata के against check करता है। यदि installed version और recorded artifact identity पहले से resolved target से match करते हैं, तो update downloading, reinstalling, या `openclaw.json` rewriting के बिना skip कर दिया जाता है।

    जब stored integrity hash मौजूद होता है और fetched artifact hash बदलता है, OpenClaw इसे npm artifact drift मानता है। Interactive `openclaw plugins update` command expected और actual hashes print करता है और आगे बढ़ने से पहले confirmation मांगता है। Non-interactive update helpers fail closed होते हैं जब तक caller explicit continuation policy supply न करे।

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` compatibility के लिए `plugins update` पर भी accepted है, लेकिन यह deprecated है और अब Plugin update behavior नहीं बदलता। Operator `security.installPolicy` अब भी updates block कर सकता है; Plugin `before_install` hooks केवल उन processes में apply होते हैं जहां Plugin hooks loaded हैं।
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Community ClawHub-backed Plugin updates replacement package download करने से पहले installs जैसा ही exact-release trust check run करते हैं। Reviewed automation के लिए `--acknowledge-clawhub-risk` का उपयोग करें जिसे selected ClawHub release में risky trust warning होने पर भी continue करना चाहिए। Official ClawHub packages और bundled OpenClaw Plugin sources इस release-trust prompt को bypass करते हैं।
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect default रूप से Plugin runtime import किए बिना identity, load status, source, manifest capabilities, policy flags, diagnostics, install metadata, bundle capabilities, और कोई भी detected MCP या LSP server support दिखाता है। JSON output में Plugin manifest contracts शामिल होते हैं, जैसे `contracts.agentToolResultMiddleware` और `contracts.trustedToolPolicies`, ताकि operators Plugin enable या restart करने से पहले trusted-surface declarations audit कर सकें। Plugin module load करने और registered hooks, tools, commands, services, gateway methods, और HTTP routes शामिल करने के लिए `--runtime` जोड़ें। Runtime inspection missing Plugin dependencies सीधे report करता है; installs और repairs `openclaw plugins install`, `openclaw plugins update`, और `openclaw doctor --fix` में रहते हैं।

Plugin-owned CLI commands आम तौर पर root `openclaw` command groups के रूप में installed होते हैं, लेकिन Plugin core parent जैसे `openclaw nodes` के अंतर्गत nested commands भी register कर सकते हैं। `inspect --runtime` के बाद `cliCommands` के अंतर्गत command दिखे, तो उसे listed path पर run करें; उदाहरण के लिए `demo-git` register करने वाले Plugin को `openclaw demo-git ping` से verify किया जा सकता है।

हर Plugin को runtime पर वास्तव में क्या register करता है, उसके आधार पर classified किया जाता है:

- **plain-capability** — एक capability type (जैसे provider-only Plugin)
- **hybrid-capability** — कई capability types (जैसे text + speech + images)
- **hook-only** — केवल hooks, कोई capabilities या surfaces नहीं
- **non-capability** — tools/commands/services लेकिन कोई capabilities नहीं

capability model पर अधिक जानकारी के लिए [Plugin shapes](/hi/plugins/architecture#plugin-shapes) देखें।

<Note>
`--json` flag scripting और auditing के लिए उपयुक्त machine-readable report output करता है। `inspect --all` shape, capability kinds, compatibility notices, bundle capabilities, और hook summary columns वाली fleet-wide table render करता है। `info`, `inspect` का alias है।
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` Plugin load errors, manifest/discovery diagnostics, compatibility notices, और stale Plugin config references जैसे missing Plugin slots report करता है। जब install tree और Plugin config clean हों, तो यह `No plugin issues detected.` print करता है। यदि stale config बचा है लेकिन install tree अन्यथा healthy है, तो summary full Plugin health imply करने के बजाय वही बताती है।

यदि configured Plugin disk पर मौजूद है लेकिन loader की path-safety checks द्वारा blocked है, तो config validation Plugin entry रखता है और उसे `present but blocked` के रूप में report करता है। `plugins.entries.<id>` या `plugins.allow` config remove करने के बजाय preceding blocked-plugin diagnostic, जैसे path ownership या world-writable permissions, fix करें।

missing `register`/`activate` exports जैसी module-shape failures के लिए, diagnostic output में compact export-shape summary शामिल करने हेतु `OPENCLAW_PLUGIN_LOAD_DEBUG=1` के साथ rerun करें।

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

local Plugin registry installed Plugin identity, enablement, source metadata, और contribution ownership के लिए OpenClaw का persisted cold read model है। Normal startup, provider owner lookup, channel setup classification, और Plugin inventory इसे Plugin runtime modules import किए बिना read कर सकते हैं।

persisted registry present, current, या stale है या नहीं inspect करने के लिए `plugins registry` का उपयोग करें। persisted Plugin index, config policy, और manifest/package metadata से इसे rebuild करने के लिए `--refresh` का उपयोग करें। यह repair path है, runtime activation path नहीं।

`openclaw doctor --fix` registry-adjacent managed npm drift भी repair करता है: यदि managed Plugin npm project या legacy flat managed npm root के अंतर्गत कोई orphaned या recovered `@openclaw/*` package bundled Plugin को shadow करता है, तो doctor उस stale package को remove करता है और registry rebuild करता है ताकि startup bundled manifest के against validate करे। Doctor managed npm Plugin में host `openclaw` package भी relink करता है जो `peerDependencies.openclaw` declare करते हैं, ताकि package-local runtime imports जैसे `openclaw/plugin-sdk/*` updates या npm repairs के बाद resolve हों।

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` registry read failures के लिए deprecated break-glass compatibility switch है। `plugins registry --refresh` या `openclaw doctor --fix` को prefer करें; env fallback केवल emergency startup recovery के लिए है जब migration roll out हो रहा हो।
</Warning>

### Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` कॉन्फ़िगर किए गए OpenClaw मार्केटप्लेस फ़ीड से प्रविष्टियाँ सूचीबद्ध करता है। डिफ़ॉल्ट रूप से यह होस्टेड फ़ीड का प्रयास करता है और फिर नवीनतम स्वीकृत स्नैपशॉट या बंडल किए गए डेटा पर वापस जाता है। किसी विशिष्ट कॉन्फ़िगर की गई प्रोफ़ाइल को पढ़ने के लिए `--feed-profile <name>`, किसी स्पष्ट होस्टेड फ़ीड URL को पढ़ने के लिए `--feed-url <url>`, और फ़ीड लाए बिना नवीनतम स्वीकृत स्नैपशॉट पढ़ने के लिए `--offline` का उपयोग करें।

`plugins marketplace refresh` कॉन्फ़िगर किए गए होस्टेड फ़ीड स्नैपशॉट को ताज़ा करता है और रिपोर्ट करता है कि OpenClaw ने होस्टेड डेटा, होस्टेड स्नैपशॉट, या बंडल किए गए फ़ॉलबैक डेटा को स्वीकार किया है या नहीं। जब किसी कॉलर को कमांड को तब तक विफल करवाना हो जब तक कोई ताज़ा होस्टेड पेलोड पिन किए गए चेकसम से मेल न खाए, तब `--expected-sha256` का उपयोग करें।

मार्केटप्लेस `list` एक स्थानीय मार्केटप्लेस पथ, एक `marketplace.json` पथ, `owner/repo` जैसा GitHub शॉर्टहैंड, GitHub रेपो URL, या git URL स्वीकार करता है। `--json` हल किए गए स्रोत लेबल के साथ पार्स किया गया मार्केटप्लेस मैनिफ़ेस्ट और Plugin प्रविष्टियाँ प्रिंट करता है।

मार्केटप्लेस refresh होस्टेड OpenClaw मार्केटप्लेस फ़ीड लोड करता है और सत्यापित प्रतिक्रिया को स्थानीय होस्टेड-फ़ीड स्नैपशॉट के रूप में सुरक्षित रखता है। विकल्पों के बिना, यह कॉन्फ़िगर की गई डिफ़ॉल्ट फ़ीड प्रोफ़ाइल का उपयोग करता है। किसी विशिष्ट कॉन्फ़िगर की गई प्रोफ़ाइल को refresh करने के लिए `--feed-profile <name>`, किसी स्पष्ट होस्टेड फ़ीड URL को refresh करने के लिए `--feed-url <url>`, मेल खाते पेलोड चेकसम की आवश्यकता के लिए `--expected-sha256 <sha256>` (`sha256:<hex>` या साधारण 64-वर्णों वाला hex digest), और मशीन-पठनीय आउटपुट के लिए `--json` का उपयोग करें। स्पष्ट होस्टेड फ़ीड URL में क्रेडेंशियल, क्वेरी स्ट्रिंग, या फ़्रैगमेंट शामिल नहीं होने चाहिए। बिना पिन किए refresh कमांड को विफल किए बिना होस्टेड स्नैपशॉट या बंडल किए गए फ़ॉलबैक परिणाम की रिपोर्ट कर सकते हैं। पिन किए गए refresh तब तक विफल होते हैं जब तक वे ताज़ा होस्टेड पेलोड स्वीकार न करें, और सफल होस्टेड refresh तब विफल होते हैं जब OpenClaw सत्यापित स्नैपशॉट को सुरक्षित नहीं रख पाता।

## संबंधित

- [Plugin बनाना](/hi/plugins/building-plugins)
- [CLI संदर्भ](/hi/cli)
- [ClawHub](/hi/clawhub)
