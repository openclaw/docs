---
read_when:
    - ClawHub CLI का उपयोग करना
    - इंस्टॉल, अपडेट या प्रकाशन की डिबगिंग
summary: 'CLI संदर्भ: कमांड, फ़्लैग, कॉन्फ़िगरेशन, और लॉकफ़ाइल व्यवहार।'
x-i18n:
    generated_at: "2026-07-03T09:35:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
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

- `--workdir <dir>`: कार्यशील डायरेक्टरी (डिफ़ॉल्ट: cwd; कॉन्फ़िगर होने पर Clawdbot वर्कस्पेस पर फ़ॉलबैक करता है)
- `--dir <dir>`: workdir के अंतर्गत इंस्टॉल dir (डिफ़ॉल्ट: `skills`)
- `--site <url>`: ब्राउज़र लॉगिन के लिए बेस URL (डिफ़ॉल्ट: `https://clawhub.ai`)
- `--registry <url>`: API बेस URL (डिफ़ॉल्ट: खोजा गया, अन्यथा `https://clawhub.ai`)
- `--no-input`: प्रॉम्प्ट अक्षम करें

Env समकक्ष:

- `CLAWHUB_SITE` (लेगेसी `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (लेगेसी `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (लेगेसी `CLAWDHUB_WORKDIR`)

### HTTP प्रॉक्सी

CLI कॉर्पोरेट प्रॉक्सी या प्रतिबंधित नेटवर्क के पीछे मौजूद सिस्टम के लिए मानक HTTP प्रॉक्सी वातावरण वेरिएबल का सम्मान करता है:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

जब इनमें से कोई भी वेरिएबल सेट होता है, तो CLI आउटबाउंड अनुरोधों को निर्दिष्ट प्रॉक्सी से रूट करता है। `HTTPS_PROXY` का उपयोग HTTPS अनुरोधों के लिए, `HTTP_PROXY` का उपयोग सामान्य HTTP के लिए किया जाता है। विशिष्ट होस्ट या डोमेन के लिए प्रॉक्सी को बायपास करने हेतु `NO_PROXY` / `no_proxy` का सम्मान किया जाता है।

यह उन सिस्टम पर आवश्यक है जहाँ सीधे आउटबाउंड कनेक्शन अवरुद्ध होते हैं (जैसे Docker कंटेनर, केवल-प्रॉक्सी इंटरनेट वाले Hetzner VPS, कॉर्पोरेट फ़ायरवॉल)।

उदाहरण:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

जब कोई प्रॉक्सी वेरिएबल सेट नहीं होता, तो व्यवहार अपरिवर्तित रहता है (सीधे कनेक्शन)।

## कॉन्फ़िग फ़ाइल

आपका API टोकन + कैश किया गया registry URL संग्रहीत करती है।

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- लेगेसी फ़ॉलबैक: यदि `clawhub/config.json` अभी मौजूद नहीं है लेकिन `clawdhub/config.json` मौजूद है, तो CLI लेगेसी पथ का पुनः उपयोग करता है
- ओवरराइड: `CLAWHUB_CONFIG_PATH` (लेगेसी `CLAWDHUB_CONFIG_PATH`)

## कमांड

### `login` / `auth login`

- डिफ़ॉल्ट: ब्राउज़र को `<site>/cli/auth` पर खोलता है और loopback callback के माध्यम से पूरा करता है।
- हेडलेस: `clawhub login --token clh_...`
- रिमोट/हेडलेस इंटरैक्टिव: `clawhub login --device` एक कोड प्रिंट करता है और जब आप इसे `<site>/cli/device` पर अधिकृत करते हैं तब तक प्रतीक्षा करता है।

### `whoami`

- संग्रहीत टोकन को `/api/v1/whoami` के माध्यम से सत्यापित करता है।

### `token`

- संग्रहीत API टोकन को stdout पर प्रिंट करता है।
- स्थानीय लॉगिन टोकन को CI सीक्रेट सेटअप कमांड में पाइप करने के लिए उपयोगी।

### `star <skill>` / `unstar <skill>`

- आपके हाइलाइट्स से किसी skill को जोड़ता/हटाता है।
- `POST /api/v1/stars/<slug>` और `DELETE /api/v1/stars/<slug>` कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `search <query...>`

- `/api/v1/search?q=...` कॉल करता है।
- आउटपुट में skill slug, owner handle, display name, और relevance score शामिल होते हैं।
- खोज डाउनलोड लोकप्रियता से पहले सटीक slug/name टोकन मिलानों को प्राथमिकता देती है। `map` जैसा standalone slug token, `amap` के अंदर मौजूद substring की तुलना में `personal-map` से अधिक मज़बूती से मेल खाता है।
- लोकप्रियता एक छोटा ranking prior है, शीर्ष स्थान की गारंटी नहीं।
- यदि कोई skill दिखना चाहिए लेकिन नहीं दिखता, तो metadata का नाम बदलने से पहले owner-visible moderation diagnostics जाँचने के लिए लॉग इन रहते हुए `clawhub inspect @owner/slug` चलाएँ।

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` के माध्यम से नवीनतम skills सूचीबद्ध करता है (`createdAt` desc के अनुसार क्रमबद्ध)।
- फ़्लैग:
  - `--limit <n>` (1-200, डिफ़ॉल्ट: 25)
  - `--sort newest|updated|rating|downloads|trending` (डिफ़ॉल्ट: newest)। संगतता के लिए लेगेसी install sort aliases अभी भी काम करते हैं।
  - `--json` (मशीन-पठनीय आउटपुट)
- आउटपुट: `<slug>  v<version>  <age>  <summary>` (summary को 50 वर्णों तक छोटा किया गया)।

### `inspect @owner/slug`

- इंस्टॉल किए बिना skill metadata और version files प्राप्त करता है।
- `--version <version>`: किसी विशिष्ट version का निरीक्षण करें (डिफ़ॉल्ट: latest)।
- `--tag <tag>`: किसी tagged version का निरीक्षण करें (जैसे `latest`)।
- `--versions`: version history सूचीबद्ध करें (पहला पेज)।
- `--limit <n>`: सूचीबद्ध करने के लिए अधिकतम versions (1-200)।
- `--files`: चुने गए version के लिए files सूचीबद्ध करें।
- `--file <path>`: raw file content प्राप्त करें (केवल text files; 200KB सीमा)।
- `--json`: मशीन-पठनीय आउटपुट।

### `install @owner/slug`

- नामित owner और skill के लिए latest version resolve करता है।
- `/api/v1/download` के माध्यम से zip डाउनलोड करता है।
- `<workdir>/<dir>/<slug>` में extract करता है।
- pinned skills को overwrite करने से इंकार करता है; पहले `clawhub unpin <skill>` चलाएँ।
- लिखता है:
  - `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` हटाता है और lockfile entry मिटाता है।
- लॉग इन रहने पर best-effort telemetry भेजता है ताकि मौजूदा install counts को निष्क्रिय किया जा सके।
- इंटरैक्टिव: पुष्टि पूछता है।
- नॉन-इंटरैक्टिव (`--no-input`): `--yes` आवश्यक है।

### `list`

- `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`) पढ़ता है।
- `clawhub pin` से frozen skills के बगल में `pinned` दिखाता है, वैकल्पिक कारण सहित।

### `pin <skill>`

- इंस्टॉल की गई skill को lockfile में pinned के रूप में चिह्नित करता है।
- `--reason <text>` दर्ज करता है कि skill frozen क्यों है।
- Pinned skills को `update --all` द्वारा छोड़ा जाता है और direct `update <skill>` द्वारा अस्वीकार किया जाता है।
- Pinned skills `install --force` को भी अस्वीकार करती हैं ताकि स्थानीय bytes गलती से बदली न जा सकें।

### `unpin <skill>`

- इंस्टॉल की गई skill से lockfile pin हटाता है ताकि भविष्य के updates उसे संशोधित कर सकें।

### `update [@owner/slug]` / `update --all`

- स्थानीय files से fingerprint की गणना करता है।
- यदि fingerprint किसी ज्ञात version से मेल खाता है: कोई prompt नहीं।
- यदि fingerprint मेल नहीं खाता:
  - डिफ़ॉल्ट रूप से अस्वीकार करता है
  - `--force` से overwrite करता है (या interactive होने पर prompt)
- Pinned skills को `--force` द्वारा कभी update नहीं किया जाता।
- `update <skill>` pinned skills के लिए तुरंत विफल होता है और आपको पहले `clawhub unpin <skill>` चलाने को कहता है।
- `update --all` pinned slugs को छोड़ता है और क्या frozen रहा इसका summary प्रिंट करता है।

### `skill publish <path>`

- स्थानीय bundle fingerprint की ClawHub से तुलना करता है और content पहले से प्रकाशित होने पर सफलतापूर्वक बाहर निकलता है।
- नई skills का डिफ़ॉल्ट `1.0.0` होता है; बदली हुई skills का डिफ़ॉल्ट अगला patch version होता है।
- `--version <version>` स्पष्ट रूप से एक version चुनता है और content किसी existing version से मेल खाने पर भी प्रकाशित करता है।
- `--dry-run` अपलोड किए बिना publish resolve करता है; `--json` मशीन-पठनीय परिणाम प्रिंट करता है।
- `--owner <handle>` org/user publisher handle के अंतर्गत प्रकाशित करता है जब actor के पास publisher access हो।
- `--migrate-owner` मौजूदा skill को `--owner` पर ले जाता है, साथ ही नया version प्रकाशित करता है। दोनों publishers पर admin/owner access आवश्यक है।
- Owner और review behavior `docs/publishing.md` में समझाया गया है।
- किसी skill को प्रकाशित करने का अर्थ है कि यह ClawHub पर `MIT-0` के अंतर्गत रिलीज़ होती है।
- प्रकाशित skills attribution के बिना उपयोग, संशोधन, और पुनर्वितरण के लिए मुक्त हैं।
- ClawHub paid skills या per-skill pricing का समर्थन नहीं करता।
- लेगेसी alias: `publish <path>`।

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub का reusable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
workflow एक `skill_path` के लिए, या `root` (डिफ़ॉल्ट: `skills`) के अंतर्गत प्रत्येक immediate skill folder के लिए `skill publish` कॉल करता है। यह unchanged skills को छोड़ देता है और वही automatic patch-version behavior उपयोग करता है।

टोकन के बिना preview करने के लिए `dry_run: true` सेट करें। वास्तविक publishes के लिए `clawhub_token` secret आवश्यक है।

### `sync`

- वर्तमान workdir, configured skills directory, और किसी भी `--root <dir>` folders को ऐसे local skill folders के लिए scan करता है जिनमें `SKILL.md` या `skill.md` मौजूद हो।
- प्रत्येक local skill fingerprint की ClawHub से तुलना करता है और केवल नई या बदली हुई skills प्रकाशित करता है।
- नई skills `1.0.0` के रूप में प्रकाशित होती हैं; बदली हुई skills डिफ़ॉल्ट रूप से अगला patch version प्रकाशित करती हैं। ऐसे update batches के लिए जिन्हें बड़े semver step से आगे बढ़ना चाहिए, `--bump minor|major` उपयोग करें।
- `--dry-run` अपलोड किए बिना publish plan दिखाता है; `--json` मशीन-पठनीय plan प्रिंट करता है।
- `--all` हर नई या बदली हुई skill को बिना prompt प्रकाशित करता है। `--all` के बिना, interactive terminals आपको प्रकाशित करने के लिए skills चुनने देते हैं।
- `--owner <handle>` org/user publisher handle के अंतर्गत प्रकाशित करता है जब actor के पास publisher access हो।
- `sync` केवल one-way publish है। यह install, update, download, या install/download telemetry report नहीं करता।

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` आवश्यक है।
- ClawHub ClawScan को `POST /api/v1/skills/-/scan` के माध्यम से चलाता है, फिर scan terminal होने तक poll करता है।
- Scans asynchronous होते हैं और पूरा होने में समय लग सकता है। queued रहने के दौरान, terminal spinner मौजूदा prioritized scan position और आगे कितने scans हैं यह दिखाता है।
- Published scans के लिए ownership या publisher management access आवश्यक है। Moderators/admins वही backend `clawhub-admin` के माध्यम से उपयोग कर सकते हैं।
- `--update` केवल `--slug` के साथ valid है; यह successful published scan results को चुने गए version में वापस लिखता है।
- `--output <file.zip>` पूरा report archive डाउनलोड करता है जिसमें `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` शामिल हैं।
- `--json` automation के लिए पूरा poll response प्रिंट करता है।
- Local path scans अब समर्थित नहीं हैं। नया version upload करें, फिर उस submitted version के stored scan results प्राप्त करने के लिए `scan download` उपयोग करें।

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` आवश्यक है।
- submitted skill या plugin version के लिए stored scan report ZIP डाउनलोड करता है, जिसमें वे versions भी शामिल हैं जिन्हें ClawHub security checks ने blocked या hidden किया था।
- Skill downloads skill slug का उपयोग करते हैं और डिफ़ॉल्ट रूप से `--kind skill` होता है।
- Plugin downloads package name का उपयोग करते हैं और `--kind plugin` आवश्यक है।
- `--version` आवश्यक है ताकि authors ClawHub द्वारा blocked exact submitted version का निरीक्षण कर सकें।
- `--output <file.zip>` destination path चुनता है।

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub skill repos और catalog repos के लिए आधिकारिक reusable workflow
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml)
पर ship करता है।

सामान्य catalog setup:

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

- catalog repos के लिए `root` का डिफ़ॉल्ट `skills` है।
- एक skill folder process करने के लिए `skill_path: skills/review-helper` पास करें।
- `owner` CLI `--owner` flag से map होता है; authenticated user के रूप में publish करने के लिए इसे छोड़ दें।
- V1 skill publishing `clawhub_token` उपयोग करता है; GitHub OIDC trusted publishing अभी केवल package-only है।

### `delete <skill>`

- `--version` के बिना, किसी skill को soft-delete करें (owner, moderator, या admin).
- `DELETE /api/v1/skills/{slug}` को कॉल करता है.
- owner द्वारा शुरू किए गए soft deletes slug को 30 दिनों के लिए आरक्षित रखते हैं; command expiry time प्रिंट करता है.
- `--version <version>` fail-closed,
  version-specific route के माध्यम से एक owned non-latest version को स्थायी रूप से delete करता है.
  Deleted versions restore या republish नहीं किए जा सकते. current latest version को delete करने से पहले replacement publish करें. Platform staff इस version-only flow के लिए ownership bypass नहीं करते.
- `--reason <text>` whole-skill soft-delete और audit log पर moderation note record करता है.
- `--note <text>` `--reason` का alias है.
- `--yes` confirmation छोड़ देता है.

### `undelete <skill>`

- hidden skill को restore करें (owner, moderator, या admin).
- कोई version undelete नहीं है; permanently deleted versions restore नहीं किए जा सकते.
- `POST /api/v1/skills/{slug}/undelete` को कॉल करता है.
- `--reason <text>` skill और audit log पर moderation note record करता है.
- `--note <text>` `--reason` का alias है.
- `--yes` confirmation छोड़ देता है.

### `hide <skill>`

- skill को hide करें (owner, moderator, या admin).
- `delete` का alias.

### `unhide <skill>`

- skill को unhide करें (owner, moderator, या admin).
- `undelete` का alias.

### `skill rename <skill> <new-name>`

- owned skill का नाम बदलें और पिछले slug को redirect alias के रूप में रखें.
- `POST /api/v1/skills/{slug}/rename` को कॉल करता है.
- `--yes` confirmation छोड़ देता है.

### `skill merge <source> <target>`

- एक owned skill को दूसरे owned skill में merge करें.
- source slug सार्वजनिक listing बंद कर देता है और target के लिए redirect alias बन जाता है.
- `POST /api/v1/skills/{sourceSlug}/merge` को कॉल करता है.
- `--yes` confirmation छोड़ देता है.

### `transfer`

- Ownership transfer workflow.
- user handles पर transfers एक pending request बनाते हैं जिसे recipient accept करता है.
- org/publisher handles पर transfers तुरंत लागू होते हैं, केवल तब जब actor के पास current owner और destination publisher दोनों पर
  admin access हो.
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

- `GET /api/v1/packages` और `GET /api/v1/packages/search` के माध्यम से unified package catalog browse या search करता है.
- इसे plugins और अन्य package-family entries के लिए उपयोग करें; top-level `search` skill search surface बना रहता है.
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

- install किए बिना package metadata fetch करता है.
- इसे plugin metadata, compatibility, verification, source, और version/file inspection के लिए उपयोग करें.
- `--version <version>`: किसी specific version को inspect करें (default: latest).
- `--tag <tag>`: tagged version inspect करें (जैसे `latest`).
- `--versions`: version history list करें (first page).
- `--limit <n>`: list करने के लिए max versions (1-100).
- `--files`: selected version के files list करें.
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB limit).
- `--json`: machine-readable output.

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` के माध्यम से
  package version resolve करता है.
- resolver के `downloadUrl` से artifact download करता है.
- सभी artifacts के लिए ClawHub SHA-256 verify करता है.
- ClawPack npm-pack artifacts के लिए, npm `sha512` integrity,
  npm shasum, और tarball के `package.json` name/version को भी verify करता है.
- Legacy ZIP versions legacy ZIP route के माध्यम से download होते हैं.
- Flags:
  - `--version <version>`: specific version download करें.
  - `--tag <tag>`: tagged version download करें (default: `latest`).
  - `-o, --output <path>`: output file या directory.
  - `--force`: मौजूदा output file overwrite करें.
  - `--json`: machine-readable output.

Examples:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- local artifact के लिए ClawHub SHA-256, npm `sha512` integrity, और npm shasum compute करता है.
- `--package` के साथ, ClawHub से expected metadata resolve करता है और
  local file को published artifact metadata से compare करता है.
- direct digest flags के साथ, network lookup के बिना verify करता है.
- Flags:
  - `--package <name>`: expected artifact metadata resolve करने के लिए package name.
  - `--version <version>` या `--tag <tag>`: expected package version.
  - `--sha256 <hex>`: expected ClawHub SHA-256.
  - `--npm-integrity <sri>`: expected npm integrity.
  - `--npm-shasum <sha1>`: expected npm shasum.
  - `--json`: machine-readable output.

Examples:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- local plugin package
  folder के विरुद्ध ClawHub CLI का bundled Plugin Inspector चलाता है.
- local
  OpenClaw checkout locate या import किए बिना offline/static validation पर default करता है.
- Hard compatibility errors non-zero exit करते हैं. Warning-only findings print होते हैं लेकिन
  exit zero करते हैं.
- Flags:
  - `--out <dir>`: Plugin Inspector reports इस directory में write करें.
  - `--openclaw <path>`: explicit local OpenClaw checkout के विरुद्ध inspect करें.
  - `--runtime`: runtime capture enable करें; plugin code import करता है.
  - `--allow-execute`: isolated workspace में runtime capture allow करें.
  - `--no-mock-sdk`: runtime capture के दौरान mocked OpenClaw SDK disable करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package validate ./example-plugin
```

यदि validation किसी package, manifest, SDK import, या artifact finding की report करता है, तो
[Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें, फिर command दोबारा चलाएँ.

### `package delete <name>`

- `--version` के बिना, package और सभी releases को soft-delete करता है.
- `--version <version>` fail-closed,
  version-specific route के माध्यम से एक owned non-latest release को स्थायी रूप से delete करता है.
  Deleted versions restore या republish नहीं किए जा सकते. current latest version delete करने से पहले
  replacement publish करें. इस version-only flow के लिए package owner या org publisher
  admin चाहिए; platform staff package ownership bypass नहीं करते.
- Whole-package soft-delete के लिए package owner, org publisher owner/admin, platform
  moderator, या platform admin चाहिए.
- Flags:
  - `--version <version>`: एक non-latest version को स्थायी रूप से delete करें.
  - `--yes`: confirmation skip करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- soft-deleted package और releases को restore करता है.
- कोई version undelete नहीं है; permanently deleted versions restore नहीं किए जा सकते.
- package owner, org publisher owner/admin, platform moderator,
  या platform admin चाहिए.
- `POST /api/v1/packages/{name}/undelete` को कॉल करता है.
- Flags:
  - `--yes`: confirmation skip करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- package को दूसरे publisher को transfer करता है.
- current package owner और destination
  publisher दोनों पर admin access चाहिए, जब तक कि platform admin द्वारा perform न किया गया हो.
- Scoped package names matching scope owner को transfer होने चाहिए.
- `POST /api/v1/packages/{name}/transfer` को कॉल करता है.
- Flags:
  - `--to <owner>`: destination publisher handle.
  - `--reason <text>`: optional audit reason.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- moderators को package report करने के लिए authenticated command.
- `POST /api/v1/packages/{name}/report` को कॉल करता है.
- Reports package-level होते हैं, optional रूप से किसी version से tied होते हैं, और review के लिए
  moderators को visible हो जाते हैं.
- Reports अपने आप packages hide नहीं करते या downloads block नहीं करते.
- Flags:
  - `--version <version>`: report से attach करने के लिए optional package version.
  - `--reason <text>`: required report reason.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- package moderation visibility check करने के लिए owner command.
- `GET /api/v1/packages/{name}/moderation` को कॉल करता है.
- current package scan state, open report count, latest release manual
  moderation state, download block state, और moderation reasons दिखाता है.
- Flags:
  - `--json`: machine-readable output.

Example:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- check करता है कि package future OpenClaw consumption के लिए ready है या नहीं.
- `GET /api/v1/packages/{name}/readiness` को कॉल करता है.
- official status, ClawPack availability, artifact digest,
  source provenance, OpenClaw compatibility, host targets, environment metadata,
  और scan state के लिए blockers report करता है.
- Flags:
  - `--json`: machine-readable output.

Example:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- उस package के लिए operator-oriented migration status दिखाता है जो
  bundled OpenClaw plugin को replace कर सकता है.
- `package readiness` जैसा same computed readiness endpoint call करता है, लेकिन
  migration-focused status, latest version, official-package state, checks, और
  blockers print करता है.
- Flags:
  - `--json`: machine-readable output.

Example:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- authenticated user के owned org publisher को create करता है.
- handle lowercase में normalize होता है और `@` के साथ या बिना pass किया जा सकता है.
- नए बनाए गए org publishers default रूप से trusted/official नहीं होते.
- यदि handle पहले से existing publisher, user, या reserved route द्वारा used है तो fail होता है.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` के माध्यम से कोड Plugin या बंडल Plugin प्रकाशित करता है।
- `<source>` स्वीकार करता है:
  - स्थानीय फ़ोल्डर पथ: `./my-plugin`
  - स्थानीय ClawPack npm-pack टारबॉल: `./my-plugin-1.2.3.tgz`
  - GitHub रेपो: `owner/repo` या `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- मेटाडेटा `package.json`, `openclaw.plugin.json`, और वास्तविक OpenClaw बंडल मार्करों जैसे
  `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, और `.cursor-plugin/plugin.json` से स्वतः पहचाना जाता है।
- `.tgz` स्रोतों को ClawPack माना जाता है। CLI सटीक npm-pack
  बाइट्स अपलोड करता है और निकाले गए `package/` सामग्री का उपयोग केवल सत्यापन और
  मेटाडेटा पहले से भरने के लिए करता है।
- कोड-Plugin फ़ोल्डरों को अपलोड से पहले ClawPack npm टारबॉल में पैक किया जाता है ताकि
  OpenClaw इंस्टॉल सटीक आर्टिफैक्ट सत्यापित कर सकें। बंडल-Plugin फ़ोल्डर अभी भी
  निकाली गई फ़ाइलों वाले प्रकाशन पथ का उपयोग करते हैं।
- GitHub स्रोतों के लिए, स्रोत एट्रिब्यूशन रेपो, हल किए गए कमिट, ref, और सबपाथ से स्वतः भरा जाता है।
- स्थानीय फ़ोल्डरों के लिए, स्रोत एट्रिब्यूशन स्थानीय git से स्वतः पहचाना जाता है जब origin remote GitHub की ओर संकेत करता है।
- बाहरी कोड Plugin को `openclaw.compat.pluginApi` और
  `openclaw.build.openclawVersion` स्पष्ट रूप से घोषित करने होंगे।
  शीर्ष-स्तरीय `package.json.version` को प्रकाशन सत्यापन के लिए fallback के रूप में उपयोग नहीं किया जाता।
- `--dry-run` अपलोड किए बिना हल किए गए प्रकाशन payload का पूर्वावलोकन करता है।
- `--json` CI के लिए मशीन-पठनीय आउटपुट निकालता है।
- `--owner <handle>` तब उपयोगकर्ता या org publisher handle के अंतर्गत प्रकाशित करता है जब actor के पास publisher access हो।
- Scoped package names चयनित owner से मेल खाने चाहिए। `docs/publishing.md` देखें।
- मौजूदा flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) अभी भी overrides के रूप में काम करते हैं।
- निजी GitHub repos के लिए `GITHUB_TOKEN` आवश्यक है।

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### अनुशंसित स्थानीय flow

पहले `--dry-run` का उपयोग करें ताकि live release बनाने से पहले आप हल किए गए package metadata और
source attribution की पुष्टि कर सकें:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### स्थानीय फ़ोल्डर flow

कोड plugins के लिए, folder publish package folder से ClawPack artifact बनाता और अपलोड करता है:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` के लिए न्यूनतम `package.json`

बाहरी कोड plugins को `package.json` में OpenClaw metadata की थोड़ी मात्रा चाहिए।
यह न्यूनतम manifest सफल प्रकाशन के लिए पर्याप्त है:

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
  ClawHub मौजूद होने पर उन्हें दिखा सकता है, लेकिन publication के लिए वे आवश्यक नहीं हैं।
- `openclaw.compat.minGatewayVersion` और
  `openclaw.build.pluginSdkVersion` वैकल्पिक extras हैं यदि आप
  अधिक विस्तृत compatibility metadata प्रकाशित करना चाहते हैं।
- यदि आप पुराने `clawhub` CLI release का उपयोग कर रहे हैं, तो publish करने से पहले upgrade करें ताकि
  स्थानीय preflight checks upload से पहले चलें।
- यदि validation कोई remediation code रिपोर्ट करता है, तो
  [Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें।

#### GitHub Actions

ClawHub plugin repos के लिए एक official reusable workflow भी
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)
पर भेजता है।

Typical caller setup:

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

- reusable workflow `source` को caller repo पर default करता है।
- monorepos के लिए, `source_path` pass करें ताकि workflow plugin
  package folder प्रकाशित करे, उदाहरण के लिए `source_path: extensions/codex`।
- reusable workflow को stable tag या full commit SHA पर pin करें। `@main` से release publishing न चलाएं।
- `pull_request` को `dry_run: true` का उपयोग करना चाहिए ताकि CI non-polluting रहे।
- वास्तविक publishes को trusted events जैसे `workflow_dispatch` या tag pushes तक सीमित रखना चाहिए।
- secret के बिना trusted publishing केवल `workflow_dispatch` पर काम करती है; tag pushes को अभी भी `clawhub_token` चाहिए।
- first publish, untrusted packages, या break-glass publishes के लिए `clawhub_token` उपलब्ध रखें।
- workflow JSON result को artifact के रूप में upload करता है और उसे workflow outputs के रूप में expose करता है।

### `package trusted-publisher get <name>`

- package के लिए GitHub Actions trusted publisher config दिखाता है।
- config set करने के बाद repository, workflow filename,
  और optional environment pin की पुष्टि करने के लिए इसका उपयोग करें।
- Flags:
  - `--json`: मशीन-पठनीय output।

उदाहरण:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- मौजूदा package के लिए GitHub Actions trusted publisher config attach या replace करता है।
- package पहले normal manual या token-authenticated
  `clawhub package publish` के माध्यम से बनाया जाना चाहिए।
- config set होने के बाद, future supported GitHub Actions publishes
  long-lived ClawHub token के बिना OIDC/trusted publishing का उपयोग कर सकते हैं।
- `--repository <repo>` `owner/repo` होना चाहिए।
- `--workflow-filename <file>` को
  `.github/workflows/` में workflow file name से match करना चाहिए।
- `--environment <name>` optional है। configured होने पर, OIDC claim में GitHub Actions
  environment बिल्कुल match करना चाहिए।
- यह command चलते समय ClawHub configured GitHub repository को verify करता है।
  Public repositories को public GitHub metadata के माध्यम से verify किया जा सकता है। Private
  repositories के लिए ClawHub के पास उस repository तक GitHub access होना आवश्यक है, उदाहरण के लिए
  future ClawHub GitHub App installation या किसी अन्य authorized
  GitHub integration के माध्यम से।
- Flags:
  - `--repository <repo>`: GitHub repository, उदाहरण के लिए `openclaw/example-plugin`।
  - `--workflow-filename <file>`: workflow file name, उदाहरण के लिए `package-publish.yml`।
  - `--environment <name>`: optional exact-match GitHub Actions environment।
  - `--json`: मशीन-पठनीय output।

उदाहरण:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- package से trusted publisher config हटाता है।
- यदि workflow, repository, या environment pin को disable या re-create करने की आवश्यकता हो, तो rollback के रूप में इसका उपयोग करें।
- Future real publishes को तब तक normal authenticated publishing का उपयोग करना होगा जब तक config फिर से set न हो जाए।
- Flags:
  - `--json`: मशीन-पठनीय output।

उदाहरण:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Install telemetry

- logged in होने पर `clawhub install <slug>` के बाद भेजा जाता है, जब तक
  `CLAWHUB_DISABLE_TELEMETRY=1` set न हो।
- Reporting best-effort है। telemetry unavailable होने पर install commands fail नहीं होते।
- विवरण: `docs/telemetry.md`।
