---
read_when:
    - ClawHub CLI का उपयोग करना
    - इंस्टॉल, अपडेट या पब्लिश की डिबगिंग
summary: 'CLI संदर्भ: कमांड, फ़्लैग, कॉन्फ़िग, और लॉकफ़ाइल व्यवहार।'
x-i18n:
    generated_at: "2026-06-30T22:15:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119900fddb8c80213eb12060c07026527a1ff851546c632bf1f7a909659b1945
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI पैकेज: `clawhub`, बिन: `clawhub`.

इसे npm या pnpm के साथ वैश्विक रूप से इंस्टॉल करें:

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

- `--workdir <dir>`: कार्य निर्देशिका (डिफ़ॉल्ट: cwd; कॉन्फ़िगर होने पर Clawdbot कार्यक्षेत्र पर फ़ॉलबैक करता है)
- `--dir <dir>`: workdir के अंतर्गत इंस्टॉल निर्देशिका (डिफ़ॉल्ट: `skills`)
- `--site <url>`: ब्राउज़र लॉगिन के लिए आधार URL (डिफ़ॉल्ट: `https://clawhub.ai`)
- `--registry <url>`: API आधार URL (डिफ़ॉल्ट: खोजा गया, अन्यथा `https://clawhub.ai`)
- `--no-input`: प्रॉम्प्ट अक्षम करें

Env समतुल्य:

- `CLAWHUB_SITE` (लेगेसी `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (लेगेसी `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (लेगेसी `CLAWDHUB_WORKDIR`)

### HTTP प्रॉक्सी

CLI कॉर्पोरेट प्रॉक्सी या प्रतिबंधित नेटवर्क के पीछे मौजूद सिस्टमों के लिए
मानक HTTP प्रॉक्सी पर्यावरण चरों का सम्मान करता है:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

जब इनमें से कोई भी चर सेट होता है, CLI आउटबाउंड अनुरोधों को निर्दिष्ट
प्रॉक्सी के माध्यम से रूट करता है। `HTTPS_PROXY` HTTPS अनुरोधों के लिए,
`HTTP_PROXY` सामान्य HTTP के लिए उपयोग होता है। विशिष्ट होस्ट या डोमेन के लिए
प्रॉक्सी को बायपास करने हेतु `NO_PROXY` / `no_proxy` का सम्मान किया जाता है।

यह उन सिस्टमों पर आवश्यक है जहां सीधे आउटबाउंड कनेक्शन अवरुद्ध हैं
(जैसे Docker कंटेनर, केवल-प्रॉक्सी इंटरनेट वाला Hetzner VPS, कॉर्पोरेट
फ़ायरवॉल)।

उदाहरण:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

जब कोई प्रॉक्सी चर सेट नहीं होता, व्यवहार अपरिवर्तित रहता है (सीधे कनेक्शन)।

## कॉन्फ़िग फ़ाइल

आपका API टोकन + कैश किया गया रजिस्ट्री URL संग्रहीत करती है।

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- लेगेसी फ़ॉलबैक: यदि `clawhub/config.json` अभी मौजूद नहीं है लेकिन `clawdhub/config.json` मौजूद है, तो CLI लेगेसी पथ का पुनः उपयोग करता है
- ओवरराइड: `CLAWHUB_CONFIG_PATH` (लेगेसी `CLAWDHUB_CONFIG_PATH`)

## कमांड

### `login` / `auth login`

- डिफ़ॉल्ट: ब्राउज़र को `<site>/cli/auth` पर खोलता है और loopback कॉलबैक के माध्यम से पूरा करता है।
- हेडलेस: `clawhub login --token clh_...`
- रिमोट/हेडलेस इंटरैक्टिव: `clawhub login --device` एक कोड प्रिंट करता है और तब तक प्रतीक्षा करता है जब तक आप उसे `<site>/cli/device` पर अधिकृत नहीं कर देते।

### `whoami`

- संग्रहीत टोकन को `/api/v1/whoami` के माध्यम से सत्यापित करता है।

### `token`

- संग्रहीत API टोकन को stdout पर प्रिंट करता है।
- स्थानीय लॉगिन टोकन को CI secret सेटअप कमांड में पाइप करने के लिए उपयोगी।

### `star <skill>` / `unstar <skill>`

- आपके हाइलाइट्स में स्किल जोड़ता/हटाता है।
- `POST /api/v1/stars/<slug>` और `DELETE /api/v1/stars/<slug>` कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `search <query...>`

- `/api/v1/search?q=...` कॉल करता है।
- आउटपुट में स्किल slug, स्वामी handle, प्रदर्शन नाम, और प्रासंगिकता स्कोर शामिल होते हैं।
- खोज डाउनलोड लोकप्रियता से पहले सटीक slug/name टोकन मिलानों को प्राथमिकता देती है। `map` जैसा स्वतंत्र slug टोकन `amap` के भीतर के उपस्ट्रिंग की तुलना में `personal-map` से अधिक मजबूत मिलान करता है।
- लोकप्रियता केवल एक छोटा रैंकिंग पूर्व-कारक है, शीर्ष स्थान की गारंटी नहीं।
- यदि कोई स्किल दिखनी चाहिए लेकिन नहीं दिखती, तो मेटाडेटा का नाम बदलने से पहले स्वामी-दृश्यमान मॉडरेशन निदान जांचने के लिए लॉग इन रहते हुए `clawhub inspect @owner/slug` चलाएं।

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` के माध्यम से नवीनतम स्किल सूचीबद्ध करता है (`createdAt` desc से क्रमबद्ध)।
- फ़्लैग:
  - `--limit <n>` (1-200, डिफ़ॉल्ट: 25)
  - `--sort newest|updated|rating|downloads|trending` (डिफ़ॉल्ट: newest)। संगतता के लिए लेगेसी इंस्टॉल sort aliases अभी भी काम करते हैं।
  - `--json` (मशीन-पठनीय आउटपुट)
- आउटपुट: `<slug>  v<version>  <age>  <summary>` (सारांश 50 वर्णों तक काटा गया)।

### `inspect @owner/slug`

- इंस्टॉल किए बिना स्किल मेटाडेटा और संस्करण फ़ाइलें प्राप्त करता है।
- `--version <version>`: विशिष्ट संस्करण निरीक्षण करें (डिफ़ॉल्ट: latest)।
- `--tag <tag>`: टैग किया गया संस्करण निरीक्षण करें (जैसे `latest`)।
- `--versions`: संस्करण इतिहास सूचीबद्ध करें (पहला पृष्ठ)।
- `--limit <n>`: सूचीबद्ध करने के लिए अधिकतम संस्करण (1-200)।
- `--files`: चयनित संस्करण के लिए फ़ाइलें सूचीबद्ध करें।
- `--file <path>`: कच्ची फ़ाइल सामग्री प्राप्त करें (केवल टेक्स्ट फ़ाइलें; 200KB सीमा)।
- `--json`: मशीन-पठनीय आउटपुट।

### `install @owner/slug`

- नामित स्वामी और स्किल के लिए नवीनतम संस्करण resolve करता है।
- `/api/v1/download` के माध्यम से zip डाउनलोड करता है।
- `<workdir>/<dir>/<slug>` में extract करता है।
- pinned स्किल्स को overwrite करने से मना करता है; पहले `clawhub unpin <skill>` चलाएं।
- लिखता है:
  - `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` हटाता है और lockfile प्रविष्टि हटाता है।
- लॉग इन रहते हुए best-effort telemetry भेजता है ताकि वर्तमान इंस्टॉल गिनतियां
  निष्क्रिय की जा सकें।
- इंटरैक्टिव: पुष्टि पूछता है।
- नॉन-इंटरैक्टिव (`--no-input`): `--yes` आवश्यक है।

### `list`

- `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`) पढ़ता है।
- `clawhub pin` से frozen स्किल्स के पास `pinned` दिखाता है, वैकल्पिक कारण सहित।

### `pin <skill>`

- इंस्टॉल की गई स्किल को lockfile में pinned चिह्नित करता है।
- `--reason <text>` दर्ज करता है कि स्किल frozen क्यों है।
- Pinned स्किल्स को `update --all` छोड़ देता है और direct `update <skill>` उन्हें अस्वीकार करता है।
- Pinned स्किल्स `install --force` को भी अस्वीकार करती हैं ताकि स्थानीय bytes गलती से बदले न जा सकें।

### `unpin <skill>`

- इंस्टॉल की गई स्किल से lockfile pin हटाता है ताकि भविष्य के अपडेट उसे बदल सकें।

### `update [@owner/slug]` / `update --all`

- स्थानीय फ़ाइलों से fingerprint गणना करता है।
- यदि fingerprint ज्ञात संस्करण से मेल खाता है: कोई प्रॉम्प्ट नहीं।
- यदि fingerprint मेल नहीं खाता:
  - डिफ़ॉल्ट रूप से मना करता है
  - `--force` से overwrite करता है (या इंटरैक्टिव होने पर प्रॉम्प्ट)
- Pinned स्किल्स कभी भी `--force` से अपडेट नहीं होतीं।
- `update <skill>` pinned स्किल्स के लिए जल्दी विफल होता है और आपको पहले `clawhub unpin <skill>` चलाने को कहता है।
- `update --all` pinned slugs को छोड़ता है और जो frozen रहीं उनका सारांश प्रिंट करता है।

### `skill publish <path>`

- स्थानीय bundle fingerprint की ClawHub से तुलना करता है और सामग्री पहले से प्रकाशित होने पर
  सफलतापूर्वक बाहर निकलता है।
- नई स्किल्स का डिफ़ॉल्ट `1.0.0` होता है; बदली हुई स्किल्स का डिफ़ॉल्ट अगला patch
  संस्करण होता है।
- `--version <version>` स्पष्ट रूप से संस्करण चुनता है और सामग्री मौजूदा संस्करण से
  मेल खाने पर भी प्रकाशित करता है।
- `--dry-run` अपलोड किए बिना publish resolve करता है; `--json` एक
  मशीन-पठनीय परिणाम प्रिंट करता है।
- `--owner <handle>` org/user publisher handle के अंतर्गत प्रकाशित करता है जब
  actor के पास publisher access हो।
- `--migrate-owner` किसी मौजूदा स्किल को नए संस्करण को publish करते समय `--owner` पर
  ले जाता है। दोनों publishers पर admin/owner access आवश्यक है।
- स्वामी और समीक्षा व्यवहार `docs/publishing.md` में समझाया गया है।
- स्किल publish करने का अर्थ है कि वह ClawHub पर `MIT-0` के अंतर्गत release की गई है।
- प्रकाशित स्किल्स attribution के बिना उपयोग, संशोधन, और पुनर्वितरण के लिए free हैं।
- ClawHub paid स्किल्स या per-skill pricing का समर्थन नहीं करता।
- लेगेसी alias: `publish <path>`।

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub का reusable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
workflow एक `skill_path` के लिए, या `root` (डिफ़ॉल्ट: `skills`) के अंतर्गत प्रत्येक immediate skill
folder के लिए `skill publish` कॉल करता है। यह unchanged स्किल्स छोड़ देता है और वही
automatic patch-version व्यवहार उपयोग करता है।

टोकन के बिना preview करने के लिए `dry_run: true` सेट करें। वास्तविक publishes के लिए
`clawhub_token` secret आवश्यक है।

### `sync`

- वर्तमान workdir, configured skills directory, और किसी भी
  `--root <dir>` folders को स्थानीय skill folders के लिए scan करता है जिनमें `SKILL.md` या
  `skill.md` हो।
- प्रत्येक स्थानीय skill fingerprint की ClawHub से तुलना करता है और केवल नई या
  बदली हुई स्किल्स publish करता है।
- नई स्किल्स `1.0.0` के रूप में publish होती हैं; बदली हुई स्किल्स डिफ़ॉल्ट रूप से अगला patch version
  publish करती हैं। update batches के लिए जो बड़े semver step से आगे बढ़ने चाहिए,
  `--bump minor|major` का उपयोग करें।
- `--dry-run` अपलोड किए बिना publish plan दिखाता है; `--json` एक
  मशीन-पठनीय plan प्रिंट करता है।
- `--all` हर नई या बदली हुई स्किल को prompting के बिना publish करता है। `--all` के बिना,
  interactive terminals आपको publish करने के लिए स्किल्स चुनने देते हैं।
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
- ClawHub ClawScan को `POST /api/v1/skills/-/scan` के माध्यम से चलाता है, फिर scan terminal होने तक poll करता है।
- Scans asynchronous होते हैं और पूरा होने में समय लग सकता है। queued रहते समय, terminal spinner वर्तमान prioritized scan position और आगे कितने scans हैं दिखाता है।
- Published scans के लिए ownership या publisher management access आवश्यक है। Moderators/admins वही backend `clawhub-admin` के माध्यम से उपयोग कर सकते हैं।
- `--update` केवल `--slug` के साथ मान्य है; यह सफल published scan results को चयनित version पर वापस लिखता है।
- `--output <file.zip>` `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ पूर्ण report archive डाउनलोड करता है।
- `--json` automation के लिए पूरा poll response प्रिंट करता है।
- Local path scans अब supported नहीं हैं। नया version upload करें, फिर उस submitted version के stored scan results प्राप्त करने के लिए `scan download` उपयोग करें।

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` आवश्यक है।
- submitted skill या Plugin version के लिए stored scan report ZIP डाउनलोड करता है, उन versions सहित जिन्हें ClawHub security checks ने block या hidden किया था।
- Skill downloads skill slug का उपयोग करते हैं और डिफ़ॉल्ट `--kind skill` होता है।
- Plugin downloads package name का उपयोग करते हैं और `--kind plugin` आवश्यक होता है।
- `--version` आवश्यक है ताकि authors ठीक वही submitted version inspect करें जिसे ClawHub ने block किया।
- `--output <file.zip>` destination path चुनता है।

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub skill repos और catalog repos के लिए
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/skill-publish.yml)
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

- `root` catalog repos के लिए डिफ़ॉल्ट रूप से `skills` होता है।
- एक skill folder process करने के लिए `skill_path: skills/review-helper` पास करें।
- `owner` CLI `--owner` flag से map होता है; authenticated user के रूप में publish करने के लिए इसे omit करें।
- V1 skill publishing `clawhub_token` उपयोग करता है; GitHub OIDC trusted publishing अभी package-only है।

### `delete <skill>`

- `--version` के बिना, किसी skill को सॉफ्ट-डिलीट करें (owner, moderator, या admin).
- `DELETE /api/v1/skills/{slug}` को कॉल करता है.
- owner द्वारा शुरू किए गए सॉफ्ट डिलीट slug को 30 दिनों के लिए आरक्षित रखते हैं; command expiry time प्रिंट करता है.
- `--version <version>` fail-closed,
  version-specific route के जरिए एक owned non-latest version को स्थायी रूप से हटाता है.
  हटाए गए versions restore या republish नहीं किए जा सकते. current latest version को हटाने से पहले replacement publish करें. Platform staff इस version-only flow के लिए ownership को bypass नहीं करते.
- `--reason <text>` whole-skill soft-delete और audit log पर moderation note record करता है.
- `--note <text>` `--reason` का alias है.
- `--yes` confirmation छोड़ देता है.

### `undelete <skill>`

- hidden skill restore करें (owner, moderator, या admin).
- कोई version undelete नहीं है; स्थायी रूप से हटाए गए versions restore नहीं किए जा सकते.
- `POST /api/v1/skills/{slug}/undelete` को कॉल करता है.
- `--reason <text>` skill और audit log पर moderation note record करता है.
- `--note <text>` `--reason` का alias है.
- `--yes` confirmation छोड़ देता है.

### `hide <skill>`

- skill छिपाएं (owner, moderator, या admin).
- `delete` का alias.

### `unhide <skill>`

- skill को फिर से दिखाएं (owner, moderator, या admin).
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
- user handles में transfers एक pending request बनाते हैं जिसे recipient accept करता है.
- org/publisher handles में transfers तुरंत apply होते हैं, केवल तब जब actor के पास
  current owner और destination publisher दोनों के लिए admin access हो.
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

- unified package catalog को `GET /api/v1/packages` और `GET /api/v1/packages/search` के जरिए browse या search करता है.
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

उदाहरण:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- install किए बिना package metadata fetch करता है.
- इसे Plugin metadata, compatibility, verification, source, और version/file inspection के लिए उपयोग करें.
- `--version <version>`: specific version inspect करें (default: latest).
- `--tag <tag>`: tagged version inspect करें (जैसे `latest`).
- `--versions`: version history list करें (first page).
- `--limit <n>`: list करने के लिए max versions (1-100).
- `--files`: selected version के files list करें.
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB limit).
- `--json`: machine-readable output.

### `package download <name>`

- package version को
  `GET /api/v1/packages/{name}/versions/{version}/artifact` के जरिए resolve करता है.
- resolver के `downloadUrl` से artifact download करता है.
- सभी artifacts के लिए ClawHub SHA-256 verify करता है.
- ClawPack npm-pack artifacts के लिए, npm `sha512` integrity,
  npm shasum, और tarball के `package.json` name/version को भी verify करता है.
- Legacy ZIP versions legacy ZIP route के जरिए download होते हैं.
- Flags:
  - `--version <version>`: specific version download करें.
  - `--tag <tag>`: tagged version download करें (default: `latest`).
  - `-o, --output <path>`: output file या directory.
  - `--force`: existing output file overwrite करें.
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- local artifact के लिए ClawHub SHA-256, npm `sha512` integrity, और npm shasum compute करता है.
- `--package` के साथ, ClawHub से expected metadata resolve करता है और
  local file की published artifact metadata से तुलना करता है.
- direct digest flags के साथ, network lookup के बिना verify करता है.
- Flags:
  - `--package <name>`: expected artifact metadata resolve करने के लिए package name.
  - `--version <version>` या `--tag <tag>`: expected package version.
  - `--sha256 <hex>`: expected ClawHub SHA-256.
  - `--npm-integrity <sri>`: expected npm integrity.
  - `--npm-shasum <sha1>`: expected npm shasum.
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- local plugin package folder के विरुद्ध ClawHub CLI का bundled Plugin Inspector चलाता है.
- local OpenClaw checkout locate या import किए बिना, default रूप से offline/static validation करता है.
- Hard compatibility errors non-zero exit करते हैं. Warning-only findings प्रिंट होते हैं लेकिन
  exit zero होता है.
- Flags:
  - `--out <dir>`: Plugin Inspector reports इस directory में लिखें.
  - `--openclaw <path>`: explicit local OpenClaw checkout के विरुद्ध inspect करें.
  - `--runtime`: runtime capture enable करें; plugin code import करता है.
  - `--allow-execute`: isolated workspace में runtime capture allow करें.
  - `--no-mock-sdk`: runtime capture के दौरान mocked OpenClaw SDK disable करें.
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package validate ./example-plugin
```

अगर validation किसी package, manifest, SDK import, या artifact finding की report करता है, तो
[Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें, फिर command दोबारा चलाएं.

### `package delete <name>`

- `--version` के बिना, package और सभी releases को soft-delete करता है.
- `--version <version>` fail-closed,
  version-specific route के जरिए एक owned non-latest release को स्थायी रूप से हटाता है.
  हटाए गए versions restore या republish नहीं किए जा सकते. current latest version को हटाने से पहले replacement publish करें. इस version-only flow के लिए package owner या org publisher
  admin चाहिए; platform staff package ownership को bypass नहीं करते.
- Whole-package soft-delete के लिए package owner, org publisher owner/admin, platform
  moderator, या platform admin चाहिए.
- Flags:
  - `--version <version>`: एक non-latest version को स्थायी रूप से हटाएं.
  - `--yes`: confirmation छोड़ें.
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- soft-deleted package और releases restore करता है.
- कोई version undelete नहीं है; स्थायी रूप से हटाए गए versions restore नहीं किए जा सकते.
- package owner, org publisher owner/admin, platform moderator,
  या platform admin चाहिए.
- `POST /api/v1/packages/{name}/undelete` को कॉल करता है.
- Flags:
  - `--yes`: confirmation छोड़ें.
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- package को दूसरे publisher में transfer करता है.
- current package owner और destination
  publisher दोनों के लिए admin access चाहिए, जब तक कि यह platform admin द्वारा न किया गया हो.
- Scoped package names matching scope owner को ही transfer होने चाहिए.
- `POST /api/v1/packages/{name}/transfer` को कॉल करता है.
- Flags:
  - `--to <owner>`: destination publisher handle.
  - `--reason <text>`: optional audit reason.
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- moderators को package report करने के लिए authenticated command.
- `POST /api/v1/packages/{name}/report` को कॉल करता है.
- Reports package-level होती हैं, optional रूप से version से जुड़ी होती हैं, और review के लिए
  moderators को visible हो जाती हैं.
- Reports अपने आप packages hide नहीं करतीं या downloads block नहीं करतीं.
- Flags:
  - `--version <version>`: report से जोड़ने के लिए optional package version.
  - `--reason <text>`: required report reason.
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- package moderation visibility जांचने के लिए owner command.
- `GET /api/v1/packages/{name}/moderation` को कॉल करता है.
- current package scan state, open report count, latest release manual
  moderation state, download block state, और moderation reasons दिखाता है.
- Flags:
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- जांचता है कि package future OpenClaw consumption के लिए ready है या नहीं.
- `GET /api/v1/packages/{name}/readiness` को कॉल करता है.
- official status, ClawPack availability, artifact digest,
  source provenance, OpenClaw compatibility, host targets, environment metadata,
  और scan state के blockers report करता है.
- Flags:
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- ऐसे package के लिए operator-oriented migration status दिखाता है जो किसी
  bundled OpenClaw plugin को replace कर सकता है.
- `package readiness` वाले same computed readiness endpoint को कॉल करता है, लेकिन
  migration-focused status, latest version, official-package state, checks, और
  blockers प्रिंट करता है.
- Flags:
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- authenticated user के ownership वाला org publisher बनाता है.
- handle को lowercase में normalize किया जाता है और `@` के साथ या बिना pass किया जा सकता है.
- नए बनाए गए org publishers default रूप से trusted/official नहीं होते.
- अगर handle पहले से किसी existing publisher, user, या reserved route द्वारा उपयोग किया गया है तो fail होता है.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` के ज़रिए code Plugin या bundle Plugin प्रकाशित करता है।
- `<source>` स्वीकार करता है:
  - स्थानीय फ़ोल्डर पथ: `./my-plugin`
  - स्थानीय ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub रेपो: `owner/repo` या `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- Metadata `package.json`, `openclaw.plugin.json`, और वास्तविक OpenClaw bundle markers जैसे
  `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, और `.cursor-plugin/plugin.json` से अपने-आप पहचाना जाता है।
- `.tgz` स्रोतों को ClawPack माना जाता है। CLI सटीक npm-pack
  bytes अपलोड करता है और निकाले गए `package/` contents का उपयोग केवल validation और
  metadata prefill के लिए करता है।
- Code-plugin फ़ोल्डर upload से पहले ClawPack npm tarball में pack किए जाते हैं ताकि
  OpenClaw installs सटीक artifact verify कर सकें। Bundle-plugin फ़ोल्डर अभी भी
  extracted-file publish path का उपयोग करते हैं।
- GitHub स्रोतों के लिए, source attribution रेपो, resolved commit, ref, और subpath से अपने-आप भरा जाता है।
- स्थानीय फ़ोल्डरों के लिए, source attribution स्थानीय git से अपने-आप पहचाना जाता है जब origin remote GitHub की ओर संकेत करता है।
- बाहरी code plugins को `openclaw.compat.pluginApi` और
  `openclaw.build.openclawVersion` स्पष्ट रूप से declare करने होंगे।
  Top-level `package.json.version` publish validation के लिए fallback के रूप में उपयोग नहीं किया जाता।
- `--dry-run` upload किए बिना resolved publish payload का preview दिखाता है।
- `--json` CI के लिए machine-readable output emit करता है।
- `--owner <handle>` तब user या org publisher handle के अंतर्गत publish करता है जब actor के पास publisher access हो।
- Scoped package names को selected owner से match करना होगा। `docs/publishing.md` देखें।
- Existing flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) अभी भी overrides के रूप में काम करते हैं।
- Private GitHub repos के लिए `GITHUB_TOKEN` आवश्यक है।

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### अनुशंसित स्थानीय flow

पहले `--dry-run` का उपयोग करें ताकि live release बनाने से पहले resolved package metadata और
source attribution की पुष्टि की जा सके:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### स्थानीय फ़ोल्डर flow

Code plugins के लिए, folder publish package folder से ClawPack artifact बनाकर upload करता है:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` के लिए न्यूनतम `package.json`

बाहरी code plugins को
`package.json` में थोड़े OpenClaw metadata की आवश्यकता होती है। यह न्यूनतम manifest सफल publish के लिए पर्याप्त है:

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
- `openclaw.hostTargets` और `openclaw.environment` optional metadata हैं।
  ClawHub उनके मौजूद होने पर उन्हें surface कर सकता है, लेकिन publish के लिए वे आवश्यक नहीं हैं।
- `openclaw.compat.minGatewayVersion` और
  `openclaw.build.pluginSdkVersion` optional extras हैं यदि आप अधिक detailed compatibility metadata publish करना चाहते हैं।
- यदि आप पुराना `clawhub` CLI release उपयोग कर रहे हैं, तो publish करने से पहले upgrade करें ताकि
  local preflight checks upload से पहले चलें।
- यदि validation कोई remediation code report करता है, तो
  [Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें।

#### GitHub Actions

ClawHub Plugin repos के लिए
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/package-publish.yml)
पर एक आधिकारिक reusable workflow भी ship करता है।

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

- Reusable workflow `source` को default रूप से caller repo पर set करता है।
- Monorepos के लिए, `source_path` pass करें ताकि workflow Plugin
  package folder publish करे, उदाहरण के लिए `source_path: extensions/codex`।
- Reusable workflow को stable tag या full commit SHA पर pin करें। `@main` से release publishing न चलाएं।
- `pull_request` को `dry_run: true` का उपयोग करना चाहिए ताकि CI non-polluting रहे।
- वास्तविक publishes को `workflow_dispatch` या tag pushes जैसे trusted events तक सीमित रखना चाहिए।
- Secret के बिना trusted publishing केवल `workflow_dispatch` पर काम करती है; tag pushes को अभी भी `clawhub_token` चाहिए।
- First publish, untrusted packages, या break-glass publishes के लिए `clawhub_token` उपलब्ध रखें।
- Workflow JSON result को artifact के रूप में upload करता है और उसे workflow outputs के रूप में expose करता है।

### `package trusted-publisher get <name>`

- किसी package के लिए GitHub Actions trusted publisher config दिखाता है।
- Config set करने के बाद repository, workflow filename,
  और optional environment pin की पुष्टि के लिए इसका उपयोग करें।
- Flags:
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- मौजूदा package के लिए GitHub Actions trusted publisher config attach या replace करता है।
- Package पहले normal manual या token-authenticated
  `clawhub package publish` के ज़रिए बनाया जाना चाहिए।
- Config set होने के बाद, future supported GitHub Actions publishes लंबे समय तक रहने वाले ClawHub token के बिना
  OIDC/trusted publishing का उपयोग कर सकते हैं।
- `--repository <repo>` `owner/repo` होना चाहिए।
- `--workflow-filename <file>` को
  `.github/workflows/` में workflow file name से match करना होगा।
- `--environment <name>` optional है। Configure होने पर, OIDC claim में GitHub Actions
  environment को exactly match करना होगा।
- यह command चलने पर ClawHub configured GitHub repository verify करता है।
  Public repositories को public GitHub metadata के ज़रिए verify किया जा सकता है। Private
  repositories के लिए ClawHub को उस repository तक GitHub access की आवश्यकता होती है, जैसे
  future ClawHub GitHub App installation या किसी अन्य authorized
  GitHub integration के ज़रिए।
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
- यदि workflow, repository, या environment pin को disable या re-create करना हो, तो rollback के रूप में इसका उपयोग करें।
- Future real publishes को config फिर से set होने तक normal authenticated publishing का उपयोग करना होगा।
- Flags:
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Install telemetry

- Logged in होने पर `clawhub install <slug>` के बाद भेजी जाती है, जब तक
  `CLAWHUB_DISABLE_TELEMETRY=1` set न हो।
- Reporting best-effort है। Telemetry unavailable होने पर install commands fail नहीं होते।
- विवरण: `docs/telemetry.md`।
