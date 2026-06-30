---
read_when:
    - ClawHub CLI का उपयोग करना
    - इंस्टॉल, अपडेट या प्रकाशन की डिबगिंग
summary: 'CLI संदर्भ: कमांड, फ़्लैग, कॉन्फ़िग, और लॉकफ़ाइल व्यवहार।'
x-i18n:
    generated_at: "2026-06-30T14:00:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63cdf64a1d5abe87ee475869fdb199053b7b4374962b03e91e822ddef3cad8e8
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

- `--workdir <dir>`: कार्यशील डायरेक्टरी (डिफ़ॉल्ट: cwd; कॉन्फ़िगर होने पर Clawdbot वर्कस्पेस पर वापस जाता है)
- `--dir <dir>`: workdir के अंतर्गत इंस्टॉल dir (डिफ़ॉल्ट: `skills`)
- `--site <url>`: ब्राउज़र लॉगिन के लिए बेस URL (डिफ़ॉल्ट: `https://clawhub.ai`)
- `--registry <url>`: API बेस URL (डिफ़ॉल्ट: खोजा गया, अन्यथा `https://clawhub.ai`)
- `--no-input`: प्रॉम्प्ट अक्षम करें

Env समकक्ष:

- `CLAWHUB_SITE` (लेगेसी `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (लेगेसी `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (लेगेसी `CLAWDHUB_WORKDIR`)

### HTTP प्रॉक्सी

CLI कॉर्पोरेट प्रॉक्सी या प्रतिबंधित नेटवर्क के पीछे मौजूद सिस्टम के लिए
मानक HTTP प्रॉक्सी एनवायरनमेंट वैरिएबल का सम्मान करता है:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

जब इनमें से कोई भी वैरिएबल सेट होता है, तो CLI आउटबाउंड अनुरोधों को
निर्दिष्ट प्रॉक्सी के माध्यम से रूट करता है। HTTPS अनुरोधों के लिए `HTTPS_PROXY` का उपयोग होता है, `HTTP_PROXY`
सादे HTTP के लिए। विशिष्ट होस्ट या डोमेन के लिए प्रॉक्सी को बायपास करने हेतु `NO_PROXY` / `no_proxy` का सम्मान किया जाता है।

यह उन सिस्टमों पर आवश्यक है जहां प्रत्यक्ष आउटबाउंड कनेक्शन ब्लॉक होते हैं
(जैसे Docker कंटेनर, केवल-प्रॉक्सी इंटरनेट वाला Hetzner VPS, कॉर्पोरेट
फ़ायरवॉल)।

उदाहरण:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

जब कोई प्रॉक्सी वैरिएबल सेट नहीं होता, तो व्यवहार अपरिवर्तित रहता है (प्रत्यक्ष कनेक्शन)।

## कॉन्फ़िग फ़ाइल

आपका API टोकन + कैश किया गया registry URL संग्रहीत करती है।

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- लेगेसी फ़ॉलबैक: यदि `clawhub/config.json` अभी मौजूद नहीं है लेकिन `clawdhub/config.json` मौजूद है, तो CLI लेगेसी पथ का पुनः उपयोग करता है
- ओवरराइड: `CLAWHUB_CONFIG_PATH` (लेगेसी `CLAWDHUB_CONFIG_PATH`)

## कमांड

### `login` / `auth login`

- डिफ़ॉल्ट: ब्राउज़र को `<site>/cli/auth` पर खोलता है और loopback कॉलबैक के माध्यम से पूरा करता है।
- हेडलेस: `clawhub login --token clh_...`
- रिमोट/हेडलेस इंटरैक्टिव: `clawhub login --device` एक कोड प्रिंट करता है और आपके द्वारा `<site>/cli/device` पर उसे अधिकृत करने तक प्रतीक्षा करता है।

### `whoami`

- संग्रहीत टोकन को `/api/v1/whoami` के माध्यम से सत्यापित करता है।

### `token`

- संग्रहीत API टोकन को stdout पर प्रिंट करता है।
- स्थानीय लॉगिन टोकन को CI secret सेटअप कमांड में पाइप करने के लिए उपयोगी।

### `star <skill>` / `unstar <skill>`

- आपके हाइलाइट्स में किसी skill को जोड़ता/हटाता है।
- `POST /api/v1/stars/<slug>` और `DELETE /api/v1/stars/<slug>` कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `search <query...>`

- `/api/v1/search?q=...` कॉल करता है।
- आउटपुट में skill slug, owner handle, display name, और relevance score शामिल होते हैं।
- खोज डाउनलोड लोकप्रियता से पहले सटीक slug/name token मिलानों को प्राथमिकता देती है। `map` जैसा standalone slug token `amap` के अंदर के substring की तुलना में `personal-map` से अधिक मज़बूती से मेल खाता है।
- लोकप्रियता एक छोटा ranking prior है, शीर्ष स्थान की गारंटी नहीं।
- यदि कोई skill दिखनी चाहिए लेकिन नहीं दिखती, तो metadata का नाम बदलने से पहले owner-visible moderation diagnostics जांचने के लिए लॉग इन रहते हुए `clawhub inspect @owner/slug` चलाएं।

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` के माध्यम से नवीनतम skills सूचीबद्ध करता है (`createdAt` desc द्वारा क्रमबद्ध)।
- फ़्लैग:
  - `--limit <n>` (1-200, डिफ़ॉल्ट: 25)
  - `--sort newest|updated|rating|downloads|trending` (डिफ़ॉल्ट: newest)। लेगेसी install sort aliases संगतता के लिए अभी भी काम करते हैं।
  - `--json` (मशीन-पठनीय आउटपुट)
- आउटपुट: `<slug>  v<version>  <age>  <summary>` (summary 50 अक्षरों तक छोटा किया गया)।

### `inspect @owner/slug`

- इंस्टॉल किए बिना skill metadata और version files प्राप्त करता है।
- `--version <version>`: किसी विशिष्ट version का निरीक्षण करें (डिफ़ॉल्ट: latest)।
- `--tag <tag>`: किसी टैग किए गए version का निरीक्षण करें (जैसे `latest`)।
- `--versions`: version history सूचीबद्ध करें (पहला पेज)।
- `--limit <n>`: सूचीबद्ध करने के लिए अधिकतम versions (1-200)।
- `--files`: चयनित version के लिए files सूचीबद्ध करें।
- `--file <path>`: raw file content प्राप्त करें (केवल text files; 200KB सीमा)।
- `--json`: मशीन-पठनीय आउटपुट।

### `install @owner/slug`

- नामित owner और skill के लिए latest version resolve करता है।
- `/api/v1/download` के माध्यम से zip डाउनलोड करता है।
- `<workdir>/<dir>/<slug>` में extract करता है।
- pinned skills को overwrite करने से इंकार करता है; पहले `clawhub unpin <skill>` चलाएं।
- लिखता है:
  - `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` हटाता है और lockfile entry हटाता है।
- लॉग इन रहने पर best-effort telemetry भेजता है ताकि वर्तमान install counts को
  निष्क्रिय किया जा सके।
- इंटरैक्टिव: पुष्टि मांगता है।
- गैर-इंटरैक्टिव (`--no-input`): `--yes` आवश्यक है।

### `list`

- `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`) पढ़ता है।
- `clawhub pin` से frozen skills के बगल में `pinned` दिखाता है, वैकल्पिक reason सहित।

### `pin <skill>`

- किसी इंस्टॉल किए गए skill को lockfile में pinned के रूप में चिह्नित करता है।
- `--reason <text>` रिकॉर्ड करता है कि skill क्यों frozen है।
- Pinned skills को `update --all` द्वारा छोड़ा जाता है और सीधे `update <skill>` द्वारा अस्वीकार किया जाता है।
- Pinned skills `install --force` को भी अस्वीकार करते हैं ताकि local bytes गलती से replace न हो सकें।

### `unpin <skill>`

- किसी इंस्टॉल किए गए skill से lockfile pin हटाता है ताकि भविष्य के updates उसे modify कर सकें।

### `update [@owner/slug]` / `update --all`

- local files से fingerprint की गणना करता है।
- यदि fingerprint किसी ज्ञात version से मेल खाता है: कोई prompt नहीं।
- यदि fingerprint मेल नहीं खाता:
  - डिफ़ॉल्ट रूप से इंकार करता है
  - `--force` से overwrite करता है (या interactive होने पर prompt)
- Pinned skills को `--force` द्वारा कभी update नहीं किया जाता।
- `update <skill>` pinned skills के लिए तुरंत विफल होता है और आपको पहले `clawhub unpin <skill>` चलाने को कहता है।
- `update --all` pinned slugs छोड़ता है और क्या frozen रहा इसका summary प्रिंट करता है।

### `skill publish <path>`

- local bundle fingerprint की तुलना ClawHub से करता है और content पहले से प्रकाशित होने पर
  सफलतापूर्वक exit करता है।
- नए skills का डिफ़ॉल्ट `1.0.0` होता है; बदले हुए skills का डिफ़ॉल्ट अगला patch
  version होता है।
- `--version <version>` स्पष्ट रूप से version चुनता है और content किसी मौजूदा version से मेल खाने पर भी प्रकाशित करता है।
- `--dry-run` upload किए बिना publish resolve करता है; `--json` एक
  मशीन-पठनीय परिणाम प्रिंट करता है।
- `--owner <handle>` किसी org/user publisher handle के अंतर्गत प्रकाशित करता है जब
  actor के पास publisher access हो।
- `--migrate-owner` किसी मौजूदा skill को नया
  version प्रकाशित करते समय `--owner` पर ले जाता है। दोनों publishers पर admin/owner access आवश्यक है।
- Owner और review व्यवहार `docs/publishing.md` में समझाया गया है।
- किसी skill को प्रकाशित करने का अर्थ है कि वह ClawHub पर `MIT-0` के अंतर्गत release किया गया है।
- प्रकाशित skills उपयोग, modify, और attribution के बिना redistribute करने के लिए free हैं।
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
workflow एक `skill_path` के लिए, या `root` के अंतर्गत प्रत्येक immediate skill
folder के लिए `skill publish` कॉल करता है (डिफ़ॉल्ट: `skills`)। यह unchanged skills को छोड़ता है और
उसी automatic patch-version behavior का उपयोग करता है।

टोकन के बिना preview करने के लिए `dry_run: true` सेट करें। वास्तविक publishes के लिए
`clawhub_token` secret आवश्यक है।

### `sync`

- वर्तमान workdir, configured skills directory, और किसी भी
  `--root <dir>` folders को local skill folders के लिए scan करता है जिनमें `SKILL.md` या
  `skill.md` हो।
- प्रत्येक local skill fingerprint की ClawHub से तुलना करता है और केवल नए या
  बदले हुए skills प्रकाशित करता है।
- नए skills `1.0.0` के रूप में publish होते हैं; changed skills डिफ़ॉल्ट रूप से अगला patch version
  publish करते हैं। ऐसे update batches के लिए `--bump minor|major` का उपयोग करें जिन्हें
  बड़े semver step से आगे बढ़ना चाहिए।
- `--dry-run` upload किए बिना publish plan दिखाता है; `--json` एक
  मशीन-पठनीय plan प्रिंट करता है।
- `--all` हर नए या बदले हुए skill को बिना prompt publish करता है। `--all` के बिना, interactive terminals आपको publish करने के skills चुनने देते हैं।
- `--owner <handle>` किसी org/user publisher handle के अंतर्गत publish करता है जब
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
- Scans asynchronous हैं और पूरा होने में समय लग सकता है। queued होने पर, terminal spinner वर्तमान prioritized scan position और कितने scans आगे हैं दिखाता है।
- Published scans के लिए ownership या publisher management access आवश्यक है। Moderators/admins उसी backend का उपयोग `clawhub-admin` के माध्यम से कर सकते हैं।
- `--update` केवल `--slug` के साथ valid है; यह successful published scan results को selected version पर वापस लिखता है।
- `--output <file.zip>` `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ full report archive डाउनलोड करता है।
- `--json` automation के लिए full poll response प्रिंट करता है।
- Local path scans अब supported नहीं हैं। नया version upload करें, फिर उस submitted version के लिए stored scan results प्राप्त करने के लिए `scan download` का उपयोग करें।

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` आवश्यक है।
- किसी submitted skill या plugin version के लिए stored scan report ZIP डाउनलोड करता है, उन versions सहित जिन्हें ClawHub security checks द्वारा blocked या hidden किया गया था।
- Skill downloads skill slug का उपयोग करते हैं और डिफ़ॉल्ट `--kind skill` होता है।
- Plugin downloads package name का उपयोग करते हैं और `--kind plugin` आवश्यक है।
- `--version` आवश्यक है ताकि authors उस exact submitted version का निरीक्षण करें जिसे ClawHub ने blocked किया।
- `--output <file.zip>` destination path चुनता है।

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub skill repos और catalog repos के लिए
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/skill-publish.yml)
पर एक official reusable workflow ship करता है।

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
- एक skill folder को process करने के लिए `skill_path: skills/review-helper` पास करें।
- `owner` CLI `--owner` flag पर map करता है; authenticated user के रूप में publish करने के लिए इसे omit करें।
- V1 skill publishing `clawhub_token` का उपयोग करता है; GitHub OIDC trusted publishing अभी के लिए package-only है।

### `delete <skill>`

- `--version` के बिना, किसी स्किल को सॉफ्ट-डिलीट करें (स्वामी, मॉडरेटर, या व्यवस्थापक)।
- `DELETE /api/v1/skills/{slug}` को कॉल करता है।
- स्वामी द्वारा शुरू किए गए सॉफ्ट डिलीट slug को 30 दिनों के लिए आरक्षित रखते हैं; कमांड समाप्ति समय प्रिंट करता है।
- `--version <version>` किसी स्वामित्व वाले गैर-नवीनतम संस्करण को fail-closed,
  संस्करण-विशिष्ट रूट के माध्यम से स्थायी रूप से हटाता है।
  हटाए गए संस्करणों को पुनर्स्थापित या फिर से प्रकाशित नहीं किया जा सकता। मौजूदा नवीनतम संस्करण हटाने से पहले
  कोई प्रतिस्थापन प्रकाशित करें। प्लेटफॉर्म कर्मचारी इस केवल-संस्करण प्रवाह में स्वामित्व को बायपास नहीं करते।
- `--reason <text>` पूरे-स्किल सॉफ्ट-डिलीट और ऑडिट लॉग पर मॉडरेशन नोट दर्ज करता है।
- `--note <text>` `--reason` का उपनाम है।
- `--yes` पुष्टि छोड़ देता है।

### `undelete <skill>`

- छिपी हुई स्किल पुनर्स्थापित करें (स्वामी, मॉडरेटर, या व्यवस्थापक)।
- संस्करण undelete नहीं है; स्थायी रूप से हटाए गए संस्करण पुनर्स्थापित नहीं किए जा सकते।
- `POST /api/v1/skills/{slug}/undelete` को कॉल करता है।
- `--reason <text>` स्किल और ऑडिट लॉग पर मॉडरेशन नोट दर्ज करता है।
- `--note <text>` `--reason` का उपनाम है।
- `--yes` पुष्टि छोड़ देता है।

### `hide <skill>`

- किसी स्किल को छिपाएं (स्वामी, मॉडरेटर, या व्यवस्थापक)।
- `delete` का उपनाम।

### `unhide <skill>`

- किसी स्किल को अनछिपा करें (स्वामी, मॉडरेटर, या व्यवस्थापक)।
- `undelete` का उपनाम।

### `skill rename <skill> <new-name>`

- स्वामित्व वाली स्किल का नाम बदलें और पिछले slug को रीडायरेक्ट उपनाम के रूप में रखें।
- `POST /api/v1/skills/{slug}/rename` को कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `skill merge <source> <target>`

- एक स्वामित्व वाली स्किल को दूसरी स्वामित्व वाली स्किल में मर्ज करें।
- स्रोत slug सार्वजनिक रूप से सूचीबद्ध होना बंद करता है और लक्ष्य का रीडायरेक्ट उपनाम बन जाता है।
- `POST /api/v1/skills/{sourceSlug}/merge` को कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `transfer`

- स्वामित्व हस्तांतरण कार्यप्रवाह।
- उपयोगकर्ता हैंडल पर हस्तांतरण एक लंबित अनुरोध बनाते हैं जिसे प्राप्तकर्ता स्वीकार करता है।
- संगठन/प्रकाशक हैंडल पर हस्तांतरण तुरंत तभी लागू होते हैं जब अभिनेता के पास
  मौजूदा स्वामी और गंतव्य प्रकाशक दोनों पर व्यवस्थापक पहुंच हो।
- उपकमांड:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- एंडपॉइंट:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- `GET /api/v1/packages` और `GET /api/v1/packages/search` के माध्यम से एकीकृत पैकेज कैटलॉग ब्राउज या खोजता है।
- इसे Plugin और अन्य पैकेज-परिवार प्रविष्टियों के लिए उपयोग करें; शीर्ष-स्तरीय `search` स्किल खोज सतह बनी रहती है।
- फ्लैग:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, डिफॉल्ट: 25)
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

- इंस्टॉल किए बिना पैकेज मेटाडेटा लाता है।
- इसे Plugin मेटाडेटा, संगतता, सत्यापन, स्रोत, और संस्करण/फाइल निरीक्षण के लिए उपयोग करें।
- `--version <version>`: किसी विशिष्ट संस्करण का निरीक्षण करें (डिफॉल्ट: नवीनतम)।
- `--tag <tag>`: टैग किए गए संस्करण का निरीक्षण करें (जैसे `latest`)।
- `--versions`: संस्करण इतिहास सूचीबद्ध करें (पहला पृष्ठ)।
- `--limit <n>`: सूचीबद्ध करने के लिए अधिकतम संस्करण (1-100)।
- `--files`: चुने गए संस्करण की फाइलें सूचीबद्ध करें।
- `--file <path>`: कच्ची फाइल सामग्री लाएं (केवल टेक्स्ट फाइलें; 200KB सीमा)।
- `--json`: मशीन-पठनीय आउटपुट।

### `package download <name>`

- पैकेज संस्करण को
  `GET /api/v1/packages/{name}/versions/{version}/artifact` के माध्यम से रिजॉल्व करता है।
- रिजॉल्वर के `downloadUrl` से आर्टिफैक्ट डाउनलोड करता है।
- सभी आर्टिफैक्ट के लिए ClawHub SHA-256 सत्यापित करता है।
- ClawPack npm-pack आर्टिफैक्ट के लिए, npm `sha512` अखंडता,
  npm shasum, और tarball के `package.json` नाम/संस्करण को भी सत्यापित करता है।
- लेगेसी ZIP संस्करण लेगेसी ZIP रूट के माध्यम से डाउनलोड होते हैं।
- फ्लैग:
  - `--version <version>`: कोई विशिष्ट संस्करण डाउनलोड करें।
  - `--tag <tag>`: टैग किया गया संस्करण डाउनलोड करें (डिफॉल्ट: `latest`)।
  - `-o, --output <path>`: आउटपुट फाइल या डायरेक्टरी।
  - `--force`: मौजूदा आउटपुट फाइल को ओवरराइट करें।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- स्थानीय आर्टिफैक्ट के लिए ClawHub SHA-256, npm `sha512` अखंडता, और npm shasum की गणना करता है।
- `--package` के साथ, ClawHub से अपेक्षित मेटाडेटा रिजॉल्व करता है और
  स्थानीय फाइल की प्रकाशित आर्टिफैक्ट मेटाडेटा से तुलना करता है।
- सीधे डाइजेस्ट फ्लैग के साथ, नेटवर्क लुकअप के बिना सत्यापित करता है।
- फ्लैग:
  - `--package <name>`: अपेक्षित आर्टिफैक्ट मेटाडेटा रिजॉल्व करने के लिए पैकेज नाम।
  - `--version <version>` या `--tag <tag>`: अपेक्षित पैकेज संस्करण।
  - `--sha256 <hex>`: अपेक्षित ClawHub SHA-256।
  - `--npm-integrity <sri>`: अपेक्षित npm अखंडता।
  - `--npm-shasum <sha1>`: अपेक्षित npm shasum।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- स्थानीय Plugin पैकेज फोल्डर के विरुद्ध ClawHub CLI का बंडल किया हुआ Plugin Inspector चलाता है।
- स्थानीय OpenClaw checkout खोजे या इंपोर्ट किए बिना, डिफॉल्ट रूप से ऑफलाइन/स्थिर सत्यापन करता है।
- कठोर संगतता त्रुटियां गैर-शून्य के साथ बाहर निकलती हैं। केवल-चेतावनी निष्कर्ष प्रिंट होते हैं लेकिन
  शून्य के साथ बाहर निकलते हैं।
- फ्लैग:
  - `--out <dir>`: Plugin Inspector रिपोर्ट इस डायरेक्टरी में लिखें।
  - `--openclaw <path>`: किसी स्पष्ट स्थानीय OpenClaw checkout के विरुद्ध निरीक्षण करें।
  - `--runtime`: रनटाइम कैप्चर सक्षम करें; Plugin कोड इंपोर्ट करता है।
  - `--allow-execute`: अलग-थलग workspace में रनटाइम कैप्चर की अनुमति दें।
  - `--no-mock-sdk`: रनटाइम कैप्चर के दौरान mocked OpenClaw SDK अक्षम करें।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package validate ./example-plugin
```

यदि सत्यापन किसी पैकेज, manifest, SDK इंपोर्ट, या आर्टिफैक्ट निष्कर्ष की रिपोर्ट करता है, तो
[Plugin सत्यापन सुधार](/clawhub/plugin-validation-fixes) देखें, फिर कमांड दोबारा चलाएं।

### `package delete <name>`

- `--version` के बिना, किसी पैकेज और सभी रिलीज को सॉफ्ट-डिलीट करता है।
- `--version <version>` किसी स्वामित्व वाली गैर-नवीनतम रिलीज को fail-closed,
  संस्करण-विशिष्ट रूट के माध्यम से स्थायी रूप से हटाता है।
  हटाए गए संस्करणों को पुनर्स्थापित या फिर से प्रकाशित नहीं किया जा सकता। मौजूदा नवीनतम संस्करण हटाने से पहले
  कोई प्रतिस्थापन प्रकाशित करें। इस केवल-संस्करण प्रवाह के लिए पैकेज स्वामी या संगठन प्रकाशक
  व्यवस्थापक आवश्यक है; प्लेटफॉर्म कर्मचारी पैकेज स्वामित्व को बायपास नहीं करते।
- पूरे-पैकेज सॉफ्ट-डिलीट के लिए पैकेज स्वामी, संगठन प्रकाशक स्वामी/व्यवस्थापक, प्लेटफॉर्म
  मॉडरेटर, या प्लेटफॉर्म व्यवस्थापक आवश्यक है।
- फ्लैग:
  - `--version <version>`: एक गैर-नवीनतम संस्करण को स्थायी रूप से हटाएं।
  - `--yes`: पुष्टि छोड़ें।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- सॉफ्ट-डिलीट किए गए पैकेज और रिलीज को पुनर्स्थापित करता है।
- संस्करण undelete नहीं है; स्थायी रूप से हटाए गए संस्करण पुनर्स्थापित नहीं किए जा सकते।
- पैकेज स्वामी, संगठन प्रकाशक स्वामी/व्यवस्थापक, प्लेटफॉर्म मॉडरेटर,
  या प्लेटफॉर्म व्यवस्थापक आवश्यक है।
- `POST /api/v1/packages/{name}/undelete` को कॉल करता है।
- फ्लैग:
  - `--yes`: पुष्टि छोड़ें।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- पैकेज को किसी दूसरे प्रकाशक को हस्तांतरित करता है।
- मौजूदा पैकेज स्वामी और गंतव्य
  प्रकाशक दोनों पर व्यवस्थापक पहुंच आवश्यक है, जब तक इसे प्लेटफॉर्म व्यवस्थापक द्वारा न किया जाए।
- स्कोप किए गए पैकेज नामों को मिलते-जुलते स्कोप स्वामी को ही हस्तांतरित होना चाहिए।
- `POST /api/v1/packages/{name}/transfer` को कॉल करता है।
- फ्लैग:
  - `--to <owner>`: गंतव्य प्रकाशक हैंडल।
  - `--reason <text>`: वैकल्पिक ऑडिट कारण।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- मॉडरेटर को पैकेज रिपोर्ट करने के लिए प्रमाणित कमांड।
- `POST /api/v1/packages/{name}/report` को कॉल करता है।
- रिपोर्ट पैकेज-स्तर की होती हैं, वैकल्पिक रूप से किसी संस्करण से जुड़ी होती हैं, और समीक्षा के लिए
  मॉडरेटर को दिखाई देती हैं।
- रिपोर्ट अपने-आप पैकेज नहीं छिपातीं या डाउनलोड ब्लॉक नहीं करतीं।
- फ्लैग:
  - `--version <version>`: रिपोर्ट से जोड़ने के लिए वैकल्पिक पैकेज संस्करण।
  - `--reason <text>`: आवश्यक रिपोर्ट कारण।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- पैकेज मॉडरेशन दृश्यता जांचने के लिए स्वामी कमांड।
- `GET /api/v1/packages/{name}/moderation` को कॉल करता है।
- मौजूदा पैकेज स्कैन स्थिति, खुली रिपोर्ट संख्या, नवीनतम रिलीज की मैन्युअल
  मॉडरेशन स्थिति, डाउनलोड ब्लॉक स्थिति, और मॉडरेशन कारण दिखाता है।
- फ्लैग:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- जांचता है कि कोई पैकेज भविष्य में OpenClaw उपभोग के लिए तैयार है या नहीं।
- `GET /api/v1/packages/{name}/readiness` को कॉल करता है।
- आधिकारिक स्थिति, ClawPack उपलब्धता, आर्टिफैक्ट डाइजेस्ट,
  स्रोत उद्गम, OpenClaw संगतता, host target, environment metadata,
  और scan state के लिए blocker रिपोर्ट करता है।
- फ्लैग:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- ऐसे पैकेज के लिए ऑपरेटर-उन्मुख migration status दिखाता है जो किसी
  बंडल किए गए OpenClaw Plugin को बदल सकता है।
- `package readiness` जैसा ही computed readiness endpoint कॉल करता है, लेकिन
  migration-केंद्रित status, latest version, official-package state, checks, और
  blockers प्रिंट करता है।
- फ्लैग:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- प्रमाणित उपयोगकर्ता के स्वामित्व वाला संगठन प्रकाशक बनाता है।
- हैंडल lowercase में सामान्यीकृत किया जाता है और `@` के साथ या बिना पास किया जा सकता है।
- नए बनाए गए संगठन प्रकाशक डिफॉल्ट रूप से trusted/official नहीं होते।
- यदि हैंडल पहले से किसी मौजूदा प्रकाशक, उपयोगकर्ता, या आरक्षित रूट द्वारा उपयोग में है, तो विफल होता है।

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` के माध्यम से code Plugin या bundle Plugin प्रकाशित करता है।
- `<source>` स्वीकार करता है:
  - स्थानीय folder path: `./my-plugin`
  - स्थानीय ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub repo: `owner/repo` या `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- मेटाडेटा `package.json`, `openclaw.plugin.json`, और वास्तविक OpenClaw bundle markers जैसे `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, और `.cursor-plugin/plugin.json` से अपने आप पहचाना जाता है।
- `.tgz` स्रोतों को ClawPack माना जाता है। CLI सटीक npm-pack
  bytes upload करता है और निकाले गए `package/` contents का उपयोग केवल validation और
  metadata prefill के लिए करता है।
- Code-plugin folders को upload से पहले ClawPack npm tarball में pack किया जाता है ताकि
  OpenClaw installs सटीक artifact verify कर सकें। Bundle-plugin folders अभी भी
  extracted-file publish path का उपयोग करते हैं।
- GitHub sources के लिए, source attribution repo, resolved commit, ref, और subpath से अपने आप भरा जाता है।
- स्थानीय folders के लिए, जब origin remote GitHub की ओर point करता है, तो source attribution local git से अपने आप पहचाना जाता है।
- External code plugins को `openclaw.compat.pluginApi` और
  `openclaw.build.openclawVersion` स्पष्ट रूप से declare करना होगा।
  Top-level `package.json.version` publish validation के लिए fallback के रूप में उपयोग नहीं किया जाता।
- `--dry-run` upload किए बिना resolved publish payload का preview दिखाता है।
- `--json` CI के लिए machine-readable output emit करता है।
- `--owner <handle>` तब user या org publisher handle के अंतर्गत publish करता है जब actor के पास publisher access हो।
- Scoped package names को selected owner से match करना होगा। `docs/publishing.md` देखें।
- मौजूदा flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) अभी भी overrides के रूप में काम करते हैं।
- Private GitHub repos के लिए `GITHUB_TOKEN` आवश्यक है।

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### अनुशंसित स्थानीय flow

पहले `--dry-run` का उपयोग करें ताकि live release बनाने से पहले आप resolved package metadata और
source attribution confirm कर सकें:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### स्थानीय folder flow

Code plugins के लिए, folder publish package folder से ClawPack artifact build और upload करता है:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` के लिए न्यूनतम `package.json`

External code plugins को `package.json` में थोड़ी OpenClaw metadata चाहिए।
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

Notes:

- `package.json.version` आपका package release version है, लेकिन इसे OpenClaw compatibility/build validation के लिए
  fallback के रूप में उपयोग नहीं किया जाता।
- `openclaw.hostTargets` और `openclaw.environment` optional metadata हैं।
  मौजूद होने पर ClawHub उन्हें surface कर सकता है, लेकिन publish के लिए वे आवश्यक नहीं हैं।
- `openclaw.compat.minGatewayVersion` और
  `openclaw.build.pluginSdkVersion` optional extras हैं, यदि आप
  अधिक विस्तृत compatibility metadata publish करना चाहते हैं।
- यदि आप पुराने `clawhub` CLI release का उपयोग कर रहे हैं, तो publish करने से पहले upgrade करें ताकि
  local preflight checks upload से पहले चलें।
- यदि validation कोई remediation code report करता है, तो
  [Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें।

#### GitHub Actions

ClawHub Plugin repos के लिए एक official reusable workflow भी ship करता है:
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/package-publish.yml)

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

Notes:

- Reusable workflow default रूप से `source` को caller repo पर set करता है।
- Monorepos के लिए, `source_path` pass करें ताकि workflow Plugin
  package folder publish करे, उदाहरण के लिए `source_path: extensions/codex`।
- Reusable workflow को stable tag या full commit SHA पर pin करें। `@main` से release publishing न चलाएँ।
- `pull_request` को `dry_run: true` का उपयोग करना चाहिए ताकि CI non-polluting रहे।
- Real publishes को trusted events जैसे `workflow_dispatch` या tag pushes तक सीमित रखना चाहिए।
- Secret के बिना trusted publishing केवल `workflow_dispatch` पर काम करता है; tag pushes के लिए अभी भी `clawhub_token` चाहिए।
- First publish, untrusted packages, या break-glass publishes के लिए `clawhub_token` उपलब्ध रखें।
- Workflow JSON result को artifact के रूप में upload करता है और उसे workflow outputs के रूप में expose करता है।

### `package trusted-publisher get <name>`

- किसी package के लिए GitHub Actions trusted publisher config दिखाता है।
- Config set करने के बाद इसका उपयोग repository, workflow filename,
  और optional environment pin confirm करने के लिए करें।
- Flags:
  - `--json`: machine-readable output।

Example:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- किसी मौजूदा package के लिए GitHub Actions trusted publisher config attach या replace करता है।
- Package पहले normal manual या token-authenticated
  `clawhub package publish` के माध्यम से बनाया जाना चाहिए।
- Config set होने के बाद, future supported GitHub Actions publishes long-lived ClawHub token के बिना
  OIDC/trusted publishing का उपयोग कर सकते हैं।
- `--repository <repo>` `owner/repo` होना चाहिए।
- `--workflow-filename <file>` को `.github/workflows/` में workflow file name से match करना होगा।
- `--environment <name>` optional है। Configure होने पर, OIDC claim में GitHub Actions
  environment को बिल्कुल match करना होगा।
- यह command चलने पर ClawHub configured GitHub repository verify करता है।
  Public repositories को public GitHub metadata के माध्यम से verify किया जा सकता है। Private
  repositories के लिए ClawHub के पास उस repository तक GitHub access होना आवश्यक है, जैसे
  future ClawHub GitHub App installation या किसी अन्य authorized
  GitHub integration के माध्यम से।
- Flags:
  - `--repository <repo>`: GitHub repository, उदाहरण के लिए `openclaw/example-plugin`।
  - `--workflow-filename <file>`: workflow file name, उदाहरण के लिए `package-publish.yml`।
  - `--environment <name>`: optional exact-match GitHub Actions environment।
  - `--json`: machine-readable output।

Example:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- किसी package से trusted publisher config हटाता है।
- यदि workflow, repository, या environment pin को disable या re-create करना हो, तो इसे rollback के रूप में उपयोग करें।
- Future real publishes को config फिर से set होने तक normal authenticated publishing का उपयोग करना होगा।
- Flags:
  - `--json`: machine-readable output।

Example:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Install telemetry

- Login होने पर `clawhub install <slug>` के बाद भेजा जाता है, जब तक
  `CLAWHUB_DISABLE_TELEMETRY=1` set न हो।
- Reporting best-effort है। Telemetry unavailable होने पर install commands fail नहीं होते।
- Details: `docs/telemetry.md`।
