---
read_when:
    - ClawHub CLI का उपयोग करना
    - इंस्टॉल, अपडेट या प्रकाशन की डीबगिंग
summary: 'CLI संदर्भ: कमांड, फ़्लैग, कॉन्फ़िग, और लॉकफ़ाइल व्यवहार।'
x-i18n:
    generated_at: "2026-06-28T22:43:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a20b288bab0e81c9ba63e054adc35b66c9013da1e0b310401b3f931c2d0b2a1
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI पैकेज: `clawhub`, bin: `clawhub`.

इसे npm या pnpm से वैश्विक रूप से इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

फिर इसे सत्यापित करें:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## वैश्विक फ़्लैग

- `--workdir <dir>`: कार्यशील डायरेक्टरी (डिफ़ॉल्ट: cwd; कॉन्फ़िगर होने पर Clawdbot कार्यक्षेत्र पर वापस जाता है)
- `--dir <dir>`: workdir के अंतर्गत इंस्टॉल डायरेक्टरी (डिफ़ॉल्ट: `skills`)
- `--site <url>`: ब्राउज़र लॉगिन के लिए आधार URL (डिफ़ॉल्ट: `https://clawhub.ai`)
- `--registry <url>`: API आधार URL (डिफ़ॉल्ट: खोजा गया, अन्यथा `https://clawhub.ai`)
- `--no-input`: प्रॉम्प्ट अक्षम करें

Env समकक्ष:

- `CLAWHUB_SITE` (विरासत `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (विरासत `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (विरासत `CLAWDHUB_WORKDIR`)

### HTTP प्रॉक्सी

CLI कॉर्पोरेट प्रॉक्सी या प्रतिबंधित नेटवर्क के पीछे मौजूद सिस्टम के लिए
मानक HTTP प्रॉक्सी एनवायरनमेंट वेरिएबल्स का सम्मान करता है:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

जब इनमें से कोई भी वेरिएबल सेट होता है, CLI आउटबाउंड अनुरोधों को निर्दिष्ट
प्रॉक्सी के माध्यम से रूट करता है। `HTTPS_PROXY` का उपयोग HTTPS अनुरोधों के
लिए, और `HTTP_PROXY` का उपयोग सामान्य HTTP के लिए किया जाता है। विशिष्ट होस्ट
या डोमेन के लिए प्रॉक्सी को बायपास करने हेतु `NO_PROXY` / `no_proxy` का
सम्मान किया जाता है।

यह उन सिस्टमों पर आवश्यक है जहां सीधे आउटबाउंड कनेक्शन अवरुद्ध होते हैं
(जैसे Docker कंटेनर, केवल-प्रॉक्सी इंटरनेट वाला Hetzner VPS, कॉर्पोरेट
फ़ायरवॉल)।

उदाहरण:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

जब कोई प्रॉक्सी वेरिएबल सेट नहीं होता, व्यवहार अपरिवर्तित रहता है (सीधे कनेक्शन)।

## कॉन्फ़िग फ़ाइल

आपका API टोकन + कैश की गई registry URL संग्रहीत करती है।

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- विरासत फ़ॉलबैक: यदि `clawhub/config.json` अभी मौजूद नहीं है लेकिन `clawdhub/config.json` मौजूद है, तो CLI विरासत पथ का पुनः उपयोग करता है
- ओवरराइड: `CLAWHUB_CONFIG_PATH` (विरासत `CLAWDHUB_CONFIG_PATH`)

## कमांड

### `login` / `auth login`

- डिफ़ॉल्ट: ब्राउज़र को `<site>/cli/auth` पर खोलता है और loopback callback के माध्यम से पूरा करता है।
- Headless: `clawhub login --token clh_...`
- Remote/headless interactive: `clawhub login --device` एक कोड प्रिंट करता है और तब तक प्रतीक्षा करता है जब तक आप उसे `<site>/cli/device` पर अधिकृत करते हैं।

### `whoami`

- संग्रहीत टोकन को `/api/v1/whoami` के माध्यम से सत्यापित करता है।

### `token`

- संग्रहीत API टोकन को stdout पर प्रिंट करता है।
- स्थानीय लॉगिन टोकन को CI secret setup कमांड में पाइप करने के लिए उपयोगी है।

### `star <skill>` / `unstar <skill>`

- आपके highlights में Skill जोड़ता/हटाता है।
- `POST /api/v1/stars/<slug>` और `DELETE /api/v1/stars/<slug>` कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `search <query...>`

- `/api/v1/search?q=...` कॉल करता है।
- आउटपुट में Skill slug, owner handle, display name, और relevance score शामिल होते हैं।
- Search download popularity से पहले exact slug/name token matches को प्राथमिकता देता है। `map` जैसा standalone slug token `amap` के अंदर substring की तुलना में `personal-map` से अधिक मज़बूती से मेल खाता है।
- Popularity एक छोटा ranking prior है, शीर्ष स्थान की गारंटी नहीं।
- यदि कोई Skill दिखना चाहिए लेकिन नहीं दिखता, तो metadata का नाम बदलने से पहले owner-visible moderation diagnostics जांचने के लिए logged in रहते हुए `clawhub inspect @owner/slug` चलाएं।

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` के माध्यम से नवीनतम Skills सूचीबद्ध करता है (`createdAt` desc के अनुसार sorted)।
- फ़्लैग:
  - `--limit <n>` (1-200, डिफ़ॉल्ट: 25)
  - `--sort newest|updated|rating|downloads|trending` (डिफ़ॉल्ट: newest)। Legacy install sort aliases compatibility के लिए अभी भी काम करते हैं।
  - `--json` (मशीन-पठनीय आउटपुट)
- आउटपुट: `<slug>  v<version>  <age>  <summary>` (summary 50 chars तक truncated)।

### `inspect @owner/slug`

- इंस्टॉल किए बिना Skill metadata और version files fetch करता है।
- `--version <version>`: किसी विशिष्ट version का निरीक्षण करें (डिफ़ॉल्ट: latest)।
- `--tag <tag>`: tagged version का निरीक्षण करें (जैसे `latest`)।
- `--versions`: version history सूचीबद्ध करें (पहला page)।
- `--limit <n>`: सूचीबद्ध करने के लिए अधिकतम versions (1-200)।
- `--files`: चयनित version के लिए files सूचीबद्ध करें।
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB limit)।
- `--json`: मशीन-पठनीय आउटपुट।

### `install @owner/slug`

- नामित owner और Skill के लिए latest version resolve करता है।
- `/api/v1/download` के माध्यम से zip डाउनलोड करता है।
- `<workdir>/<dir>/<slug>` में extract करता है।
- pinned Skills को overwrite करने से मना करता है; पहले `clawhub unpin <skill>` चलाएं।
- लिखता है:
  - `<workdir>/.clawhub/lock.json` (विरासत `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (विरासत `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` हटाता है और lockfile entry डिलीट करता है।
- logged in होने पर best-effort telemetry भेजता है ताकि current install counts
  निष्क्रिय किए जा सकें।
- Interactive: पुष्टि मांगता है।
- Non-interactive (`--no-input`): `--yes` आवश्यक है।

### `list`

- `<workdir>/.clawhub/lock.json` पढ़ता है (विरासत `.clawdhub`)।
- `clawhub pin` से frozen Skills के बगल में `pinned` दिखाता है, optional reason सहित।

### `pin <skill>`

- इंस्टॉल किए गए Skill को lockfile में pinned के रूप में चिह्नित करता है।
- `--reason <text>` दर्ज करता है कि Skill frozen क्यों है।
- Pinned Skills को `update --all` द्वारा छोड़ा जाता है और direct `update <skill>` द्वारा reject किया जाता है।
- Pinned Skills `install --force` को भी reject करते हैं ताकि local bytes गलती से replace न हो सकें।

### `unpin <skill>`

- इंस्टॉल किए गए Skill से lockfile pin हटाता है ताकि भविष्य के updates उसे modify कर सकें।

### `update [@owner/slug]` / `update --all`

- local files से fingerprint compute करता है।
- यदि fingerprint किसी known version से match करता है: कोई prompt नहीं।
- यदि fingerprint match नहीं करता:
  - डिफ़ॉल्ट रूप से मना करता है
  - `--force` से overwrite करता है (या interactive होने पर prompt)
- Pinned Skills कभी भी `--force` द्वारा updated नहीं होते।
- `update <skill>` pinned Skills के लिए fast fail करता है और आपको पहले `clawhub unpin <skill>` चलाने को कहता है।
- `update --all` pinned slugs को छोड़ता है और क्या frozen रहा इसका summary print करता है।

### `skill publish <path>`

- local bundle fingerprint की ClawHub से तुलना करता है और content पहले से published होने पर
  successfully exit करता है।
- नए Skills डिफ़ॉल्ट रूप से `1.0.0` होते हैं; बदले हुए Skills डिफ़ॉल्ट रूप से next patch
  version पर जाते हैं।
- `--version <version>` स्पष्ट रूप से version चुनता है और content किसी existing version से
  match करने पर भी publish करता है।
- `--dry-run` upload किए बिना publish resolve करता है; `--json` मशीन-पठनीय result
  print करता है।
- `--owner <handle>` org/user publisher handle के अंतर्गत publish करता है जब
  actor के पास publisher access हो।
- `--migrate-owner` existing Skill को `--owner` पर move करता है और साथ में नया
  version publish करता है। दोनों publishers पर admin/owner access आवश्यक है।
- Owner और review behavior `docs/publishing.md` में समझाया गया है।
- Skill publish करने का अर्थ है कि वह ClawHub पर `MIT-0` के अंतर्गत release होता है।
- Published Skills attribution के बिना use, modify, और redistribute करने के लिए free हैं।
- ClawHub paid Skills या per-Skill pricing support नहीं करता।
- Legacy alias: `publish <path>`।

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub का reusable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
workflow एक `skill_path` के लिए, या `root` (डिफ़ॉल्ट: `skills`) के अंतर्गत हर immediate Skill
folder के लिए `skill publish` कॉल करता है। यह unchanged Skills को छोड़ता है और वही
automatic patch-version behavior उपयोग करता है।

Token के बिना preview करने के लिए `dry_run: true` सेट करें। वास्तविक publishes के लिए
`clawhub_token` secret आवश्यक है।

### `sync`

- current workdir, configured Skills directory, और किसी भी
  `--root <dir>` folders को local Skill folders के लिए scan करता है जिनमें `SKILL.md` या
  `skill.md` हो।
- हर local Skill fingerprint की ClawHub से तुलना करता है और केवल नए या
  बदले हुए Skills publish करता है।
- नए Skills `1.0.0` के रूप में publish होते हैं; बदले हुए Skills डिफ़ॉल्ट रूप से next patch version
  publish करते हैं। update batches के लिए जिन्हें बड़ा semver step लेना चाहिए,
  `--bump minor|major` का उपयोग करें।
- `--dry-run` upload किए बिना publish plan दिखाता है; `--json` मशीन-पठनीय plan
  print करता है।
- `--all` हर नए या बदले हुए Skill को prompt किए बिना publish करता है। बिना
  `--all` के, interactive terminals आपको publish करने के लिए Skills चुनने देते हैं।
- `--owner <handle>` org/user publisher handle के अंतर्गत publish करता है जब
  actor के पास publisher access हो।
- `sync` केवल one-way publish है। यह install, update, download, या
  install/download telemetry report नहीं करता।

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` आवश्यक है।
- `POST /api/v1/skills/-/scan` के माध्यम से ClawHub ClawScan चलाता है, फिर scan terminal होने तक poll करता है।
- Scans asynchronous होते हैं और पूरा होने में समय लग सकता है। queued रहते समय, terminal spinner current prioritized scan position और कितने scans आगे हैं दिखाता है।
- Published scans के लिए ownership या publisher management access आवश्यक है। Moderators/admins वही backend `clawhub-admin` के माध्यम से उपयोग कर सकते हैं।
- `--update` केवल `--slug` के साथ valid है; यह successful published scan results को selected version पर वापस लिखता है।
- `--output <file.zip>` full report archive डाउनलोड करता है जिसमें `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` शामिल हैं।
- `--json` automation के लिए full poll response print करता है।
- Local path scans अब support नहीं किए जाते। नया version upload करें, फिर उस submitted version के stored scan results retrieve करने के लिए `scan download` उपयोग करें।

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` आवश्यक है।
- submitted Skill या Plugin version के लिए stored scan report ZIP डाउनलोड करता है, उन versions सहित जिन्हें ClawHub security checks ने block या hide किया था।
- Skill downloads Skill slug का उपयोग करते हैं और डिफ़ॉल्ट रूप से `--kind skill` होते हैं।
- Plugin downloads package name का उपयोग करते हैं और `--kind plugin` आवश्यक करते हैं।
- `--version` आवश्यक है ताकि authors वही exact submitted version inspect कर सकें जिसे ClawHub ने block किया।
- `--output <file.zip>` destination path चुनता है।

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub Skill repos और catalog repos के लिए
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/skill-publish.yml)
पर एक official reusable workflow भेजता है।

Typical catalog setup:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

नोट्स:

- catalog repos के लिए `root` डिफ़ॉल्ट रूप से `skills` होता है।
- एक Skill folder process करने के लिए `skill_path: skills/review-helper` pass करें।
- `owner` CLI `--owner` flag से map होता है; authenticated user के रूप में publish करने के लिए इसे छोड़ दें।
- V1 Skill publishing `clawhub_token` उपयोग करता है; GitHub OIDC trusted publishing अभी package-only है।

### `delete <skill>`

- `--version` के बिना, किसी skill को soft-delete करें (owner, moderator, या admin)।
- `DELETE /api/v1/skills/{slug}` को कॉल करता है।
- owner द्वारा शुरू किए गए soft deletes slug को 30 दिनों के लिए आरक्षित रखते हैं; command expiry time प्रिंट करता है।
- `--version <version>` किसी owned non-latest version को fail-closed,
  version-specific route के जरिए स्थायी रूप से delete करता है।
  Deleted versions restore या republish नहीं किए जा सकते। मौजूदा latest version delete करने से पहले replacement publish करें। Platform staff इस version-only flow के लिए ownership bypass नहीं करते।
- `--reason <text>` whole-skill soft-delete और audit log पर moderation note रिकॉर्ड करता है।
- `--note <text>` `--reason` का alias है।
- `--yes` confirmation छोड़ देता है।

### `undelete <skill>`

- hidden skill restore करें (owner, moderator, या admin)।
- कोई version undelete नहीं है; स्थायी रूप से deleted versions restore नहीं किए जा सकते।
- `POST /api/v1/skills/{slug}/undelete` को कॉल करता है।
- `--reason <text>` skill और audit log पर moderation note रिकॉर्ड करता है।
- `--note <text>` `--reason` का alias है।
- `--yes` confirmation छोड़ देता है।

### `hide <skill>`

- किसी skill को hide करें (owner, moderator, या admin)।
- `delete` का alias।

### `unhide <skill>`

- किसी skill को unhide करें (owner, moderator, या admin)।
- `undelete` का alias।

### `skill rename <skill> <new-name>`

- किसी owned skill का नाम बदलें और पिछले slug को redirect alias के रूप में रखें।
- `POST /api/v1/skills/{slug}/rename` को कॉल करता है।
- `--yes` confirmation छोड़ देता है।

### `skill merge <source> <target>`

- एक owned skill को दूसरे owned skill में merge करें।
- source slug सार्वजनिक listing बंद कर देता है और target के लिए redirect alias बन जाता है।
- `POST /api/v1/skills/{sourceSlug}/merge` को कॉल करता है।
- `--yes` confirmation छोड़ देता है।

### `transfer`

- ownership transfer workflow।
- user handles पर transfers एक pending request बनाते हैं जिसे recipient accept करता है।
- org/publisher handles पर transfers तुरंत तभी apply होते हैं जब actor के पास current owner और destination publisher, दोनों पर
  admin access हो।
- Subcommands:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- unified package catalog को `GET /api/v1/packages` और `GET /api/v1/packages/search` के जरिए browse या search करता है।
- इसे plugins और अन्य package-family entries के लिए उपयोग करें; top-level `search` skill search surface ही रहता है।
- Flags:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, default: 25)
  - `--json`

Examples:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- install किए बिना package metadata fetch करता है।
- इसे plugin metadata, compatibility, verification, source, और version/file inspection के लिए उपयोग करें।
- `--version <version>`: किसी specific version को inspect करें (default: latest)।
- `--tag <tag>`: tagged version को inspect करें (जैसे `latest`)।
- `--versions`: version history list करें (पहला page)।
- `--limit <n>`: list करने के लिए max versions (1-100)।
- `--files`: selected version के लिए files list करें।
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB limit)।
- `--json`: machine-readable output।

### `package download <name>`

- package version को
  `GET /api/v1/packages/{name}/versions/{version}/artifact` के जरिए resolve करता है।
- resolver के `downloadUrl` से artifact download करता है।
- सभी artifacts के लिए ClawHub SHA-256 verify करता है।
- ClawPack npm-pack artifacts के लिए, npm `sha512` integrity,
  npm shasum, और tarball के `package.json` name/version को भी verify करता है।
- Legacy ZIP versions legacy ZIP route के जरिए download होते हैं।
- Flags:
  - `--version <version>`: specific version download करें।
  - `--tag <tag>`: tagged version download करें (default: `latest`)।
  - `-o, --output <path>`: output file या directory।
  - `--force`: existing output file overwrite करें।
  - `--json`: machine-readable output।

Examples:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- local artifact के लिए ClawHub SHA-256, npm `sha512` integrity, और npm shasum compute करता है।
- `--package` के साथ, ClawHub से expected metadata resolve करता है और
  local file की published artifact metadata से तुलना करता है।
- direct digest flags के साथ, network lookup के बिना verify करता है।
- Flags:
  - `--package <name>`: expected artifact metadata resolve करने के लिए package name।
  - `--version <version>` या `--tag <tag>`: expected package version।
  - `--sha256 <hex>`: expected ClawHub SHA-256।
  - `--npm-integrity <sri>`: expected npm integrity।
  - `--npm-shasum <sha1>`: expected npm shasum।
  - `--json`: machine-readable output।

Examples:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- local plugin package folder के विरुद्ध ClawHub CLI का bundled Plugin Inspector चलाता है।
- local OpenClaw checkout locate या import किए बिना, default रूप से offline/static validation करता है।
- Hard compatibility errors non-zero exit करते हैं। Warning-only findings print होते हैं लेकिन
  zero exit करते हैं।
- Flags:
  - `--out <dir>`: Plugin Inspector reports इस directory में लिखें।
  - `--openclaw <path>`: explicit local OpenClaw checkout के विरुद्ध inspect करें।
  - `--runtime`: runtime capture enable करें; plugin code import करता है।
  - `--allow-execute`: isolated workspace में runtime capture allow करें।
  - `--no-mock-sdk`: runtime capture के दौरान mocked OpenClaw SDK disable करें।
  - `--json`: machine-readable output।

Example:

```bash
clawhub package validate ./example-plugin
```

अगर validation कोई package, manifest, SDK import, या artifact finding report करता है, तो
[Plugin validation fixes](/hi/clawhub/plugin-validation-fixes) देखें, फिर command दोबारा चलाएं।

### `package delete <name>`

- `--version` के बिना, package और सभी releases को soft-delete करता है।
- `--version <version>` किसी owned non-latest release को fail-closed,
  version-specific route के जरिए स्थायी रूप से delete करता है।
  Deleted versions restore या republish नहीं किए जा सकते। मौजूदा latest version delete करने से पहले replacement publish करें। इस version-only flow के लिए package owner या org publisher
  admin आवश्यक है; platform staff package ownership bypass नहीं करते।
- Whole-package soft-delete के लिए package owner, org publisher owner/admin, platform
  moderator, या platform admin आवश्यक है।
- Flags:
  - `--version <version>`: एक non-latest version स्थायी रूप से delete करें।
  - `--yes`: confirmation छोड़ दें।
  - `--json`: machine-readable output।

Example:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- soft-deleted package और releases को restore करता है।
- कोई version undelete नहीं है; स्थायी रूप से deleted versions restore नहीं किए जा सकते।
- package owner, org publisher owner/admin, platform moderator,
  या platform admin आवश्यक है।
- `POST /api/v1/packages/{name}/undelete` को कॉल करता है।
- Flags:
  - `--yes`: confirmation छोड़ दें।
  - `--json`: machine-readable output।

Example:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- package को दूसरे publisher को transfer करता है।
- current package owner और destination
  publisher, दोनों पर admin access आवश्यक है, जब तक कि platform admin द्वारा perform न किया गया हो।
- Scoped package names matching scope owner को ही transfer होने चाहिए।
- `POST /api/v1/packages/{name}/transfer` को कॉल करता है।
- Flags:
  - `--to <owner>`: destination publisher handle।
  - `--reason <text>`: optional audit reason।
  - `--json`: machine-readable output।

Example:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- moderators को package report करने के लिए authenticated command।
- `POST /api/v1/packages/{name}/report` को कॉल करता है।
- Reports package-level होते हैं, optionally किसी version से जुड़े होते हैं, और review के लिए moderators को visible हो जाते हैं।
- Reports अपने-आप packages hide नहीं करते या downloads block नहीं करते।
- Flags:
  - `--version <version>`: report से attach करने के लिए optional package version।
  - `--reason <text>`: required report reason।
  - `--json`: machine-readable output।

Example:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- package moderation visibility check करने के लिए owner command।
- `GET /api/v1/packages/{name}/moderation` को कॉल करता है।
- current package scan state, open report count, latest release manual
  moderation state, download block state, और moderation reasons दिखाता है।
- Flags:
  - `--json`: machine-readable output।

Example:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- check करता है कि package future OpenClaw consumption के लिए ready है या नहीं।
- `GET /api/v1/packages/{name}/readiness` को कॉल करता है।
- official status, ClawPack availability, artifact digest,
  source provenance, OpenClaw compatibility, host targets, environment metadata,
  और scan state के लिए blockers report करता है।
- Flags:
  - `--json`: machine-readable output।

Example:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- ऐसे package के लिए operator-oriented migration status दिखाता है जो bundled OpenClaw plugin को replace कर सकता है।
- `package readiness` जैसा ही computed readiness endpoint कॉल करता है, लेकिन
  migration-focused status, latest version, official-package state, checks, और
  blockers print करता है।
- Flags:
  - `--json`: machine-readable output।

Example:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- authenticated user के owned org publisher को create करता है।
- handle को lowercase में normalize किया जाता है और `@` के साथ या बिना pass किया जा सकता है।
- नए बनाए गए org publishers default रूप से trusted/official नहीं होते।
- अगर handle पहले से किसी existing publisher, user, या reserved route द्वारा used है तो fail होता है।

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` के ज़रिए code plugin या bundle plugin प्रकाशित करता है।
- `<source>` स्वीकार करता है:
  - स्थानीय फ़ोल्डर पथ: `./my-plugin`
  - स्थानीय ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub repo: `owner/repo` या `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- Metadata `package.json`, `openclaw.plugin.json`, और वास्तविक OpenClaw bundle markers जैसे `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, और `.cursor-plugin/plugin.json` से अपने-आप पहचाना जाता है।
- `.tgz` स्रोतों को ClawPack माना जाता है। CLI सटीक npm-pack
  bytes अपलोड करता है और निकाली गई `package/` सामग्री का उपयोग केवल validation और
  metadata prefill के लिए करता है।
- Code-plugin फ़ोल्डरों को अपलोड से पहले ClawPack npm tarball में पैक किया जाता है ताकि
  OpenClaw installs सटीक artifact सत्यापित कर सकें। Bundle-plugin फ़ोल्डर अब भी
  extracted-file publish path का उपयोग करते हैं।
- GitHub स्रोतों के लिए, source attribution repo, resolved commit, ref, और subpath से अपने-आप भरा जाता है।
- स्थानीय फ़ोल्डरों के लिए, जब origin remote GitHub की ओर इंगित करता है, तो source attribution स्थानीय git से अपने-आप पहचाना जाता है।
- बाहरी code plugins को `openclaw.compat.pluginApi` और
  `openclaw.build.openclawVersion` स्पष्ट रूप से घोषित करने होंगे।
  Top-level `package.json.version` publish validation के लिए fallback के रूप में उपयोग नहीं किया जाता।
- `--dry-run` अपलोड किए बिना resolved publish payload का पूर्वावलोकन करता है।
- `--json` CI के लिए machine-readable output देता है।
- `--owner <handle>` तब user या org publisher handle के अंतर्गत प्रकाशित करता है जब actor के पास publisher access हो।
- Scoped package names चुने गए owner से मेल खाने चाहिए। `docs/publishing.md` देखें।
- मौजूदा flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) अब भी overrides के रूप में काम करते हैं।
- Private GitHub repos के लिए `GITHUB_TOKEN` आवश्यक है।

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### अनुशंसित स्थानीय flow

पहले `--dry-run` का उपयोग करें ताकि live release बनाने से पहले आप resolved package metadata और
source attribution की पुष्टि कर सकें:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### स्थानीय फ़ोल्डर flow

Code plugins के लिए, folder publish package folder से ClawPack artifact बनाता और अपलोड करता है:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` के लिए न्यूनतम `package.json`

बाहरी code plugins को `package.json` में थोड़ी OpenClaw metadata चाहिए।
यह न्यूनतम manifest सफल publish के लिए पर्याप्त है:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

आवश्यक fields:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

नोट्स:

- `package.json.version` आपका package release version है, लेकिन इसे OpenClaw compatibility/build validation के लिए
  fallback के रूप में उपयोग नहीं किया जाता।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक metadata हैं।
  ClawHub मौजूद होने पर उन्हें दिखा सकता है, लेकिन publish के लिए वे आवश्यक नहीं हैं।
- `openclaw.compat.minGatewayVersion` और
  `openclaw.build.pluginSdkVersion` वैकल्पिक extras हैं, यदि आप अधिक विस्तृत compatibility metadata प्रकाशित करना चाहते हैं।
- यदि आप पुराने `clawhub` CLI release का उपयोग कर रहे हैं, तो publish करने से पहले upgrade करें ताकि
  local preflight checks अपलोड से पहले चलें।
- यदि validation कोई remediation code रिपोर्ट करता है, तो
  [Plugin validation fixes](/hi/clawhub/plugin-validation-fixes) देखें।

#### GitHub Actions

ClawHub plugin repos के लिए
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/package-publish.yml)
पर एक official reusable workflow भी भेजता है।

सामान्य caller setup:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

नोट्स:

- Reusable workflow default रूप से `source` को caller repo पर सेट करता है।
- Monorepos के लिए, `source_path` पास करें ताकि workflow plugin
  package folder प्रकाशित करे, उदाहरण के लिए `source_path: extensions/codex`।
- Reusable workflow को stable tag या full commit SHA पर pin करें। `@main` से release publishing न चलाएँ।
- `pull_request` को `dry_run: true` उपयोग करना चाहिए ताकि CI non-polluting रहे।
- वास्तविक publishes को trusted events जैसे `workflow_dispatch` या tag pushes तक सीमित रखना चाहिए।
- Secret के बिना trusted publishing केवल `workflow_dispatch` पर काम करती है; tag pushes को अब भी `clawhub_token` चाहिए।
- पहले publish, untrusted packages, या break-glass publishes के लिए `clawhub_token` उपलब्ध रखें।
- Workflow JSON result को artifact के रूप में अपलोड करता है और उसे workflow outputs के रूप में expose करता है।

### `package trusted-publisher get <name>`

- किसी package के लिए GitHub Actions trusted publisher config दिखाता है।
- Config सेट करने के बाद repository, workflow filename,
  और optional environment pin की पुष्टि करने के लिए इसका उपयोग करें।
- Flags:
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- मौजूदा package के लिए GitHub Actions trusted publisher config जोड़ता या बदलता है।
- Package पहले सामान्य manual या token-authenticated
  `clawhub package publish` के माध्यम से बनाया जाना चाहिए।
- Config सेट होने के बाद, भविष्य में supported GitHub Actions publishes long-lived ClawHub token के बिना
  OIDC/trusted publishing का उपयोग कर सकते हैं।
- `--repository <repo>` `owner/repo` होना चाहिए।
- `--workflow-filename <file>` `.github/workflows/` में workflow file name से मेल खाना चाहिए।
- `--environment <name>` वैकल्पिक है। Configure होने पर, OIDC claim में GitHub Actions
  environment बिल्कुल मेल खाना चाहिए।
- यह command चलने पर ClawHub configured GitHub repository को verify करता है।
  Public repositories को public GitHub metadata के माध्यम से verify किया जा सकता है। Private
  repositories के लिए ClawHub को उस repository तक GitHub access चाहिए, उदाहरण के लिए
  भविष्य में ClawHub GitHub App installation या किसी अन्य authorized
  GitHub integration के माध्यम से।
- Flags:
  - `--repository <repo>`: GitHub repository, उदाहरण के लिए `openclaw/example-plugin`।
  - `--workflow-filename <file>`: workflow file name, उदाहरण के लिए `package-publish.yml`।
  - `--environment <name>`: optional exact-match GitHub Actions environment।
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- किसी package से trusted publisher config हटाता है।
- यदि workflow, repository, या environment pin को disabled या re-created करना हो, तो इसे rollback के रूप में उपयोग करें।
- भविष्य के वास्तविक publishes को सामान्य authenticated publishing का उपयोग करना होगा, जब तक config फिर से सेट न हो।
- Flags:
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Install telemetry

- Logged in होने पर `clawhub install <slug>` के बाद भेजा जाता है, जब तक
  `CLAWHUB_DISABLE_TELEMETRY=1` सेट न हो।
- Reporting best-effort है। Telemetry उपलब्ध न होने पर install commands fail नहीं होते।
- विवरण: `docs/telemetry.md`।
