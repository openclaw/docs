---
read_when:
    - ClawHub CLI का उपयोग करना
    - इंस्टॉल, अपडेट या प्रकाशित करने की डिबगिंग
summary: 'CLI संदर्भ: कमांड, फ़्लैग, कॉन्फ़िग, और लॉकफ़ाइल व्यवहार।'
x-i18n:
    generated_at: "2026-07-03T17:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI पैकेज: `clawhub`, बाइनरी: `clawhub`.

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

- `--workdir <dir>`: कार्यशील निर्देशिका (डिफ़ॉल्ट: cwd; कॉन्फ़िगर होने पर Clawdbot कार्यक्षेत्र पर वापस जाता है)
- `--dir <dir>`: workdir के अंतर्गत इंस्टॉल निर्देशिका (डिफ़ॉल्ट: `skills`)
- `--site <url>`: ब्राउज़र लॉगिन के लिए आधार URL (डिफ़ॉल्ट: `https://clawhub.ai`)
- `--registry <url>`: API आधार URL (डिफ़ॉल्ट: खोजा गया, अन्यथा `https://clawhub.ai`)
- `--no-input`: प्रॉम्प्ट अक्षम करें

Env समकक्ष:

- `CLAWHUB_SITE` (लेगेसी `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (लेगेसी `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (लेगेसी `CLAWDHUB_WORKDIR`)

### HTTP प्रॉक्सी

CLI कॉर्पोरेट प्रॉक्सी या प्रतिबंधित नेटवर्क के पीछे मौजूद सिस्टम के लिए
मानक HTTP प्रॉक्सी परिवेश वेरिएबल का सम्मान करता है:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

जब इनमें से कोई भी वेरिएबल सेट होता है, तो CLI आउटबाउंड अनुरोधों को
निर्दिष्ट प्रॉक्सी के माध्यम से रूट करता है। HTTPS अनुरोधों के लिए `HTTPS_PROXY`
और सादे HTTP के लिए `HTTP_PROXY` का उपयोग किया जाता है। विशिष्ट होस्ट या
डोमेन के लिए प्रॉक्सी को बायपास करने हेतु `NO_PROXY` / `no_proxy` का सम्मान
किया जाता है।

यह उन सिस्टम पर आवश्यक है जहाँ सीधे आउटबाउंड कनेक्शन अवरुद्ध होते हैं
(जैसे Docker कंटेनर, केवल-प्रॉक्सी इंटरनेट वाले Hetzner VPS, कॉर्पोरेट
फ़ायरवॉल)।

उदाहरण:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

जब कोई प्रॉक्सी वेरिएबल सेट नहीं होता, तो व्यवहार अपरिवर्तित रहता है (सीधे कनेक्शन)।

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
- रिमोट/हेडलेस इंटरैक्टिव: `clawhub login --device` एक कोड प्रिंट करता है और `<site>/cli/device` पर आपके द्वारा उसे अधिकृत करने तक प्रतीक्षा करता है।

### `whoami`

- संग्रहीत टोकन को `/api/v1/whoami` के माध्यम से सत्यापित करता है।

### `token`

- संग्रहीत API टोकन को मानक आउटपुट पर प्रिंट करता है।
- स्थानीय लॉगिन टोकन को CI सीक्रेट सेटअप कमांड में पाइप करने के लिए उपयोगी।

### `star <skill>` / `unstar <skill>`

- आपके हाइलाइट से किसी स्किल को जोड़ता/हटाता है।
- `POST /api/v1/stars/<slug>` और `DELETE /api/v1/stars/<slug>` कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `search <query...>`

- `/api/v1/search?q=...` कॉल करता है।
- आउटपुट में स्किल slug, मालिक handle, प्रदर्शन नाम, और प्रासंगिकता स्कोर शामिल होता है।
- खोज डाउनलोड लोकप्रियता से पहले सटीक slug/name टोकन मिलानों को प्राथमिकता देती है। `map` जैसा एक स्वतंत्र slug टोकन `amap` के अंदर की सबस्ट्रिंग की तुलना में `personal-map` से अधिक मजबूती से मेल खाता है।
- लोकप्रियता केवल एक छोटा रैंकिंग prior है, शीर्ष स्थान की गारंटी नहीं।
- यदि कोई स्किल दिखनी चाहिए लेकिन नहीं दिखती, तो मेटाडेटा का नाम बदलने से पहले मालिक-दृश्य मॉडरेशन डायग्नोस्टिक्स जाँचने के लिए लॉग इन रहते हुए `clawhub inspect @owner/slug` चलाएँ।

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` के माध्यम से नवीनतम Skills सूचीबद्ध करता है (`createdAt` desc द्वारा क्रमबद्ध)।
- फ़्लैग:
  - `--limit <n>` (1-200, डिफ़ॉल्ट: 25)
  - `--sort newest|updated|rating|downloads|trending` (डिफ़ॉल्ट: newest)। लेगेसी इंस्टॉल sort उपनाम संगतता के लिए अभी भी काम करते हैं।
  - `--json` (मशीन-पठनीय आउटपुट)
- आउटपुट: `<slug>  v<version>  <age>  <summary>` (सारांश 50 वर्णों तक छोटा किया गया)।

### `inspect @owner/slug`

- इंस्टॉल किए बिना स्किल मेटाडेटा और संस्करण फ़ाइलें प्राप्त करता है।
- `--version <version>`: किसी विशिष्ट संस्करण का निरीक्षण करें (डिफ़ॉल्ट: नवीनतम)।
- `--tag <tag>`: टैग किए गए संस्करण का निरीक्षण करें (जैसे `latest`)।
- `--versions`: संस्करण इतिहास सूचीबद्ध करें (पहला पृष्ठ)।
- `--limit <n>`: सूचीबद्ध करने के लिए अधिकतम संस्करण (1-200)।
- `--files`: चयनित संस्करण के लिए फ़ाइलें सूचीबद्ध करें।
- `--file <path>`: कच्ची फ़ाइल सामग्री प्राप्त करें (केवल टेक्स्ट फ़ाइलें; 200KB सीमा)।
- `--json`: मशीन-पठनीय आउटपुट।

### `install @owner/slug`

- नामित मालिक और स्किल के लिए नवीनतम संस्करण resolve करता है।
- `/api/v1/download` के माध्यम से zip डाउनलोड करता है।
- `<workdir>/<dir>/<slug>` में निकालता है।
- pinned Skills को overwrite करने से इनकार करता है; पहले `clawhub unpin <skill>` चलाएँ।
- लिखता है:
  - `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` हटाता है और lockfile प्रविष्टि हटाता है।
- लॉग इन रहते हुए best-effort telemetry भेजता है ताकि वर्तमान इंस्टॉल गिनतियों को
  निष्क्रिय किया जा सके।
- इंटरैक्टिव: पुष्टि पूछता है।
- नॉन-इंटरैक्टिव (`--no-input`): `--yes` आवश्यक है।

### `list`

- `<workdir>/.clawhub/lock.json` पढ़ता है (लेगेसी `.clawdhub`)।
- `clawhub pin` से फ़्रीज़ किए गए Skills के आगे `pinned` दिखाता है, वैकल्पिक कारण सहित।

### `pin <skill>`

- इंस्टॉल की गई स्किल को lockfile में pinned के रूप में चिह्नित करता है।
- `--reason <text>` दर्ज करता है कि स्किल क्यों फ़्रीज़ है।
- Pinned Skills को `update --all` द्वारा छोड़ दिया जाता है और सीधे `update <skill>` द्वारा अस्वीकार किया जाता है।
- Pinned Skills `install --force` को भी अस्वीकार करते हैं ताकि स्थानीय बाइट्स गलती से बदली न जा सकें।

### `unpin <skill>`

- इंस्टॉल की गई स्किल से lockfile pin हटाता है ताकि भविष्य के अपडेट उसे संशोधित कर सकें।

### `update [@owner/slug]` / `update --all`

- स्थानीय फ़ाइलों से fingerprint की गणना करता है।
- यदि fingerprint किसी ज्ञात संस्करण से मेल खाता है: कोई प्रॉम्प्ट नहीं।
- यदि fingerprint मेल नहीं खाता:
  - डिफ़ॉल्ट रूप से इनकार करता है
  - `--force` से overwrite करता है (या इंटरैक्टिव होने पर प्रॉम्प्ट)
- Pinned Skills कभी भी `--force` द्वारा अपडेट नहीं होते।
- `update <skill>` pinned Skills के लिए तुरंत विफल होता है और पहले `clawhub unpin <skill>` चलाने को कहता है।
- `update --all` pinned slugs को छोड़ता है और क्या फ़्रीज़ रहा इसका सारांश प्रिंट करता है।

### `skill publish <path>`

- स्थानीय bundle fingerprint की तुलना ClawHub से करता है और सामग्री पहले से प्रकाशित होने पर
  सफलतापूर्वक बाहर निकलता है।
- नई Skills का डिफ़ॉल्ट `1.0.0` होता है; बदली हुई Skills का डिफ़ॉल्ट अगला patch
  संस्करण होता है।
- `--version <version>` स्पष्ट रूप से एक संस्करण चुनता है और सामग्री किसी मौजूदा संस्करण से मेल खाने पर भी प्रकाशित करता है।
- `--dry-run` अपलोड किए बिना publish resolve करता है; `--json` एक
  मशीन-पठनीय परिणाम प्रिंट करता है।
- `--owner <handle>` org/user प्रकाशक handle के अंतर्गत प्रकाशित करता है जब
  actor के पास publisher access हो।
- `--migrate-owner` किसी मौजूदा स्किल को `--owner` पर ले जाता है जबकि नया
  संस्करण प्रकाशित करता है। दोनों publishers पर admin/owner access आवश्यक है।
- मालिक और review व्यवहार `docs/publishing.md` में समझाया गया है।
- किसी स्किल को प्रकाशित करने का अर्थ है कि उसे ClawHub पर `MIT-0` के अंतर्गत रिलीज़ किया गया है।
- प्रकाशित Skills बिना attribution के उपयोग, संशोधन, और पुनर्वितरण के लिए मुक्त हैं।
- ClawHub paid Skills या per-skill pricing का समर्थन नहीं करता।
- लेगेसी उपनाम: `publish <path>`।

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub का reusable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
workflow एक `skill_path` के लिए, या `root` के अंतर्गत प्रत्येक immediate skill
folder के लिए `skill publish` कॉल करता है (डिफ़ॉल्ट: `skills`)। यह अपरिवर्तित Skills को छोड़ता है और वही स्वचालित patch-version व्यवहार उपयोग करता है।

टोकन के बिना पूर्वावलोकन करने के लिए `dry_run: true` सेट करें। वास्तविक publish के लिए
`clawhub_token` secret आवश्यक है।

### `sync`

- वर्तमान workdir, कॉन्फ़िगर की गई Skills निर्देशिका, और किसी भी
  `--root <dir>` folders को ऐसे स्थानीय skill folders के लिए स्कैन करता है जिनमें `SKILL.md` या
  `skill.md` हो।
- प्रत्येक स्थानीय skill fingerprint की तुलना ClawHub से करता है और केवल नई या
  बदली हुई Skills प्रकाशित करता है।
- नई Skills `1.0.0` के रूप में प्रकाशित होती हैं; बदली हुई Skills डिफ़ॉल्ट रूप से अगला patch version
  प्रकाशित करती हैं। उन update batches के लिए `--bump minor|major` का उपयोग करें जिन्हें
  बड़े semver step से आगे बढ़ना चाहिए।
- `--dry-run` अपलोड किए बिना publish plan दिखाता है; `--json` एक
  मशीन-पठनीय plan प्रिंट करता है।
- `--all` हर नई या बदली हुई स्किल को बिना प्रॉम्प्ट प्रकाशित करता है। `--all` के बिना,
  इंटरैक्टिव terminal आपको प्रकाशित करने के लिए Skills चुनने देते हैं।
- `--owner <handle>` org/user प्रकाशक handle के अंतर्गत प्रकाशित करता है जब
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
- Scan asynchronous होते हैं और पूरा होने में समय लग सकता है। queued रहते समय, terminal spinner वर्तमान prioritized scan position और आगे कितने scans हैं दिखाता है।
- प्रकाशित scans के लिए ownership या publisher management access आवश्यक है। Moderators/admins वही backend `clawhub-admin` के माध्यम से उपयोग कर सकते हैं।
- `--update` केवल `--slug` के साथ मान्य है; यह सफल published scan results को चयनित version में वापस लिखता है।
- `--output <file.zip>` पूरा report archive डाउनलोड करता है जिसमें `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` शामिल हैं।
- `--json` automation के लिए पूर्ण poll response प्रिंट करता है।
- स्थानीय path scans अब समर्थित नहीं हैं। नया version upload करें, फिर उस submitted version के लिए stored scan results प्राप्त करने हेतु `scan download` का उपयोग करें।

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` आवश्यक है।
- submitted skill या Plugin version के लिए stored scan report ZIP डाउनलोड करता है, उन versions सहित जिन्हें ClawHub security checks ने blocked या hidden किया था।
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
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
पर एक official reusable workflow भेजता है।

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
- `owner` CLI `--owner` flag से map होता है; authenticated user के रूप में प्रकाशित करने के लिए इसे छोड़ दें।
- V1 skill publishing `clawhub_token` का उपयोग करता है; GitHub OIDC trusted publishing अभी के लिए केवल package-only है।

### `delete <skill>`

- `--version` के बिना, किसी Skill को सॉफ्ट-डिलीट करें (स्वामी, मॉडरेटर, या एडमिन)।
- `DELETE /api/v1/skills/{slug}` को कॉल करता है।
- स्वामी द्वारा शुरू किए गए सॉफ्ट डिलीट slug को 30 दिनों के लिए आरक्षित रखते हैं; कमांड समाप्ति समय प्रिंट करता है।
- `--version <version>` fail-closed,
  संस्करण-विशिष्ट route के माध्यम से स्वामित्व वाले एक non-latest संस्करण को स्थायी रूप से हटाता है।
  हटाए गए संस्करणों को पुनर्स्थापित या पुनः प्रकाशित नहीं किया जा सकता। वर्तमान latest संस्करण को हटाने से पहले प्रतिस्थापन प्रकाशित करें। इस केवल-संस्करण flow के लिए प्लेटफ़ॉर्म स्टाफ़ स्वामित्व को bypass नहीं करते।
- `--reason <text>` पूरे-Skill सॉफ्ट-डिलीट और audit log पर moderation note रिकॉर्ड करता है।
- `--note <text>` `--reason` का alias है।
- `--yes` पुष्टि छोड़ देता है।

### `undelete <skill>`

- छिपे हुए Skill को पुनर्स्थापित करें (स्वामी, मॉडरेटर, या एडमिन)।
- कोई संस्करण undelete नहीं है; स्थायी रूप से हटाए गए संस्करणों को पुनर्स्थापित नहीं किया जा सकता।
- `POST /api/v1/skills/{slug}/undelete` को कॉल करता है।
- `--reason <text>` Skill और audit log पर moderation note रिकॉर्ड करता है।
- `--note <text>` `--reason` का alias है।
- `--yes` पुष्टि छोड़ देता है।

### `hide <skill>`

- Skill छिपाएँ (स्वामी, मॉडरेटर, या एडमिन)।
- `delete` का alias।

### `unhide <skill>`

- Skill को फिर से दिखाएँ (स्वामी, मॉडरेटर, या एडमिन)।
- `undelete` का alias।

### `skill rename <skill> <new-name>`

- स्वामित्व वाले Skill का नाम बदलें और पिछले slug को redirect alias के रूप में रखें।
- `POST /api/v1/skills/{slug}/rename` को कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `skill merge <source> <target>`

- स्वामित्व वाले एक Skill को स्वामित्व वाले दूसरे Skill में merge करें।
- source slug सार्वजनिक listing में दिखना बंद कर देता है और target का redirect alias बन जाता है।
- `POST /api/v1/skills/{sourceSlug}/merge` को कॉल करता है।
- `--yes` पुष्टि छोड़ देता है।

### `transfer`

- स्वामित्व transfer workflow।
- user handles को किए गए transfer एक pending request बनाते हैं जिसे recipient स्वीकार करता है।
- org/publisher handles को किए गए transfer तुरंत तभी लागू होते हैं जब actor के पास
  वर्तमान owner और destination publisher दोनों का admin access हो।
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

- unified package catalog को `GET /api/v1/packages` और `GET /api/v1/packages/search` के माध्यम से browse या search करता है।
- plugins और अन्य package-family entries के लिए इसका उपयोग करें; top-level `search` Skill search surface बना रहता है।
- फ़्लैग:
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

- install किए बिना package metadata fetch करता है।
- इसका उपयोग plugin metadata, compatibility, verification, source, और version/file inspection के लिए करें।
- `--version <version>`: किसी विशिष्ट version को inspect करें (default: latest)।
- `--tag <tag>`: tagged version को inspect करें (जैसे `latest`)।
- `--versions`: version history list करें (पहला page)।
- `--limit <n>`: list करने के लिए अधिकतम versions (1-100)।
- `--files`: चयनित version के लिए files list करें।
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB सीमा)।
- `--json`: machine-readable output।

### `package download <name>`

- package version को
  `GET /api/v1/packages/{name}/versions/{version}/artifact` के माध्यम से resolve करता है।
- resolver के `downloadUrl` से artifact download करता है।
- सभी artifacts के लिए ClawHub SHA-256 verify करता है।
- ClawPack npm-pack artifacts के लिए, npm `sha512` integrity,
  npm shasum, और tarball के `package.json` name/version को भी verify करता है।
- Legacy ZIP versions legacy ZIP route के माध्यम से download होते हैं।
- फ़्लैग:
  - `--version <version>`: कोई विशिष्ट version download करें।
  - `--tag <tag>`: tagged version download करें (default: `latest`)।
  - `-o, --output <path>`: output file या directory।
  - `--force`: मौजूदा output file को overwrite करें।
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- local artifact के लिए ClawHub SHA-256, npm `sha512` integrity, और npm shasum compute करता है।
- `--package` के साथ, ClawHub से expected metadata resolve करता है और
  local file की published artifact metadata से तुलना करता है।
- direct digest flags के साथ, network lookup के बिना verify करता है।
- फ़्लैग:
  - `--package <name>`: expected artifact metadata resolve करने के लिए package name।
  - `--version <version>` या `--tag <tag>`: expected package version।
  - `--sha256 <hex>`: expected ClawHub SHA-256।
  - `--npm-integrity <sri>`: expected npm integrity।
  - `--npm-shasum <sha1>`: expected npm shasum।
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- local plugin package
  folder के विरुद्ध ClawHub CLI का bundled Plugin Inspector चलाता है।
- local
  OpenClaw checkout locate या import किए बिना offline/static validation default है।
- Hard compatibility errors non-zero exit करते हैं। Warning-only findings print होते हैं लेकिन
  exit zero करते हैं।
- फ़्लैग:
  - `--out <dir>`: Plugin Inspector reports इस directory में लिखें।
  - `--openclaw <path>`: explicit local OpenClaw checkout के विरुद्ध inspect करें।
  - `--runtime`: runtime capture enable करें; plugin code import करता है।
  - `--allow-execute`: isolated workspace में runtime capture allow करें।
  - `--no-mock-sdk`: runtime capture के दौरान mocked OpenClaw SDK disable करें।
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package validate ./example-plugin
```

यदि validation किसी package, manifest, SDK import, या artifact finding की रिपोर्ट करता है, तो
[Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें, फिर command फिर से चलाएँ।

### `package delete <name>`

- `--version` के बिना, किसी package और सभी releases को soft-delete करता है।
- `--version <version>` fail-closed,
  version-specific route के माध्यम से स्वामित्व वाली एक non-latest release को स्थायी रूप से हटाता है।
  हटाए गए versions को restore या republish नहीं किया जा सकता। वर्तमान latest version हटाने से पहले
  replacement publish करें। इस version-only flow के लिए package owner या org publisher
  admin आवश्यक है; platform staff package ownership को bypass नहीं करते।
- Whole-package soft-delete के लिए package owner, org publisher owner/admin, platform
  moderator, या platform admin आवश्यक है।
- फ़्लैग:
  - `--version <version>`: एक non-latest version को स्थायी रूप से हटाएँ।
  - `--yes`: confirmation छोड़ें।
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- soft-deleted package और releases को restore करता है।
- कोई version undelete नहीं है; स्थायी रूप से हटाए गए versions restore नहीं किए जा सकते।
- package owner, org publisher owner/admin, platform moderator,
  या platform admin आवश्यक है।
- `POST /api/v1/packages/{name}/undelete` को कॉल करता है।
- फ़्लैग:
  - `--yes`: confirmation छोड़ें।
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- package को किसी दूसरे publisher को transfer करता है।
- current package owner और destination
  publisher, दोनों तक admin access आवश्यक है, जब तक कि platform admin द्वारा न किया जाए।
- Scoped package names को matching scope owner को transfer होना चाहिए।
- `POST /api/v1/packages/{name}/transfer` को कॉल करता है।
- फ़्लैग:
  - `--to <owner>`: destination publisher handle।
  - `--reason <text>`: optional audit reason।
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- moderators को package report करने के लिए authenticated command।
- `POST /api/v1/packages/{name}/report` को कॉल करता है।
- Reports package-level होती हैं, optionally किसी version से जुड़ी होती हैं, और review के लिए
  moderators को visible हो जाती हैं।
- Reports अपने आप packages hide नहीं करतीं या downloads block नहीं करतीं।
- फ़्लैग:
  - `--version <version>`: report से attach करने के लिए optional package version।
  - `--reason <text>`: required report reason।
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- package moderation visibility check करने के लिए owner command।
- `GET /api/v1/packages/{name}/moderation` को कॉल करता है।
- वर्तमान package scan state, open report count, latest release manual
  moderation state, download block state, और moderation reasons दिखाता है।
- फ़्लैग:
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- check करता है कि कोई package future OpenClaw consumption के लिए ready है या नहीं।
- `GET /api/v1/packages/{name}/readiness` को कॉल करता है।
- official status, ClawPack availability, artifact digest,
  source provenance, OpenClaw compatibility, host targets, environment metadata,
  और scan state के लिए blockers report करता है।
- फ़्लैग:
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- ऐसे package के लिए operator-oriented migration status दिखाता है जो किसी
  bundled OpenClaw plugin को replace कर सकता है।
- `package readiness` जैसा ही computed readiness endpoint call करता है, लेकिन
  migration-focused status, latest version, official-package state, checks, और
  blockers print करता है।
- फ़्लैग:
  - `--json`: machine-readable output।

उदाहरण:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- authenticated user के स्वामित्व वाला org publisher बनाता है।
- handle lowercase में normalize किया जाता है और `@` के साथ या बिना pass किया जा सकता है।
- नए बनाए गए org publishers default रूप से trusted/official नहीं होते।
- यदि handle पहले से किसी existing publisher, user, या reserved route द्वारा उपयोग किया गया है, तो fail होता है।

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` के ज़रिए code Plugin या bundle Plugin प्रकाशित करता है.
- `<source>` स्वीकार करता है:
  - स्थानीय फ़ोल्डर पथ: `./my-plugin`
  - स्थानीय ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub रेपो: `owner/repo` या `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- मेटाडेटा `package.json`, `openclaw.plugin.json`, और वास्तविक OpenClaw bundle markers जैसे `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, और `.cursor-plugin/plugin.json` से स्वतः पहचाना जाता है.
- `.tgz` स्रोतों को ClawPack माना जाता है. CLI ठीक वही npm-pack
  bytes अपलोड करता है और निकाले गए `package/` contents का उपयोग केवल सत्यापन और
  मेटाडेटा पहले से भरने के लिए करता है.
- Code-plugin फ़ोल्डरों को अपलोड से पहले ClawPack npm tarball में पैक किया जाता है ताकि
  OpenClaw installs ठीक उसी artifact को सत्यापित कर सकें. Bundle-plugin फ़ोल्डर अभी भी
  extracted-file publish path का उपयोग करते हैं.
- GitHub स्रोतों के लिए, स्रोत attribution रेपो, resolved commit, ref, और subpath से स्वतः भरी जाती है.
- स्थानीय फ़ोल्डरों के लिए, जब origin remote GitHub की ओर इशारा करता है, तो स्रोत attribution स्थानीय git से स्वतः पहचानी जाती है.
- बाहरी code plugins को `openclaw.compat.pluginApi` और
  `openclaw.build.openclawVersion` स्पष्ट रूप से घोषित करना होगा.
  Top-level `package.json.version` को publish validation के fallback के रूप में उपयोग नहीं किया जाता.
- `--dry-run` अपलोड किए बिना resolved publish payload का पूर्वावलोकन दिखाता है.
- `--json` CI के लिए machine-readable output निकालता है.
- `--owner <handle>` तब user या org publisher handle के अंतर्गत प्रकाशित करता है जब actor के पास publisher access हो.
- Scoped package names चयनित owner से मेल खाने चाहिए. `docs/publishing.md` देखें.
- मौजूदा flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) अभी भी overrides के रूप में काम करते हैं.
- निजी GitHub repos के लिए `GITHUB_TOKEN` आवश्यक है.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### अनुशंसित स्थानीय प्रवाह

पहले `--dry-run` का उपयोग करें ताकि live release बनाने से पहले आप resolved package metadata और
source attribution की पुष्टि कर सकें:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### स्थानीय फ़ोल्डर प्रवाह

Code plugins के लिए, folder publish package folder से ClawPack artifact बनाता और अपलोड करता है:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` के लिए न्यूनतम `package.json`

बाहरी code plugins को `package.json` में थोड़े OpenClaw मेटाडेटा की आवश्यकता होती है.
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

- `package.json.version` आपके package release version के लिए है, लेकिन इसे OpenClaw compatibility/build validation के fallback के रूप में उपयोग नहीं किया जाता.
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं.
  मौजूद होने पर ClawHub उन्हें दिखा सकता है, लेकिन publish के लिए वे आवश्यक नहीं हैं.
- यदि आप अधिक विस्तृत compatibility metadata प्रकाशित करना चाहते हैं, तो `openclaw.compat.minGatewayVersion` और
  `openclaw.build.pluginSdkVersion` वैकल्पिक extras हैं.
- यदि आप पुराने `clawhub` CLI release का उपयोग कर रहे हैं, तो प्रकाशित करने से पहले upgrade करें ताकि
  स्थानीय preflight checks अपलोड से पहले चलें.
- यदि validation remediation code रिपोर्ट करता है, तो
  [Plugin सत्यापन सुधार](/clawhub/plugin-validation-fixes) देखें.

#### GitHub Actions

ClawHub plugin repos के लिए
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
पर एक आधिकारिक reusable workflow भी भेजता है.

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

- Reusable workflow `source` को caller repo पर default करता है.
- Monorepos के लिए, `source_path` पास करें ताकि workflow Plugin
  package folder प्रकाशित करे, उदाहरण के लिए `source_path: extensions/codex`.
- Reusable workflow को stable tag या full commit SHA पर pin करें. `@main` से release publishing न चलाएँ.
- `pull_request` में `dry_run: true` का उपयोग करना चाहिए ताकि CI गैर-प्रदूषक रहे.
- वास्तविक publishes को `workflow_dispatch` या tag pushes जैसे trusted events तक सीमित रखना चाहिए.
- Secret के बिना trusted publishing केवल `workflow_dispatch` पर काम करती है; tag pushes को अभी भी `clawhub_token` चाहिए.
- पहले publish, untrusted packages, या break-glass publishes के लिए `clawhub_token` उपलब्ध रखें.
- Workflow JSON result को artifact के रूप में अपलोड करता है और उसे workflow outputs के रूप में expose करता है.

### `package trusted-publisher get <name>`

- किसी package के लिए GitHub Actions trusted publisher config दिखाता है.
- Config सेट करने के बाद repository, workflow filename,
  और वैकल्पिक environment pin की पुष्टि करने के लिए इसका उपयोग करें.
- Flags:
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- किसी मौजूदा package के लिए GitHub Actions trusted publisher config जोड़ता या बदलता है.
- Package पहले सामान्य manual या token-authenticated
  `clawhub package publish` के माध्यम से बनाया जाना चाहिए.
- Config सेट होने के बाद, भविष्य के समर्थित GitHub Actions publishes लंबे समय तक रहने वाले ClawHub token के बिना
  OIDC/trusted publishing का उपयोग कर सकते हैं.
- `--repository <repo>` को `owner/repo` होना चाहिए.
- `--workflow-filename <file>` को `.github/workflows/` में workflow file name से मेल खाना चाहिए.
- `--environment <name>` वैकल्पिक है. Configure होने पर, OIDC claim में GitHub Actions
  environment को ठीक-ठीक मेल खाना चाहिए.
- यह command चलने पर ClawHub configured GitHub repository को सत्यापित करता है.
  Public repositories को public GitHub metadata के माध्यम से सत्यापित किया जा सकता है. Private
  repositories के लिए ClawHub के पास उस repository तक GitHub access होना आवश्यक है, उदाहरण के लिए भविष्य के ClawHub GitHub App installation या किसी अन्य authorized
  GitHub integration के माध्यम से.
- Flags:
  - `--repository <repo>`: GitHub repository, उदाहरण के लिए `openclaw/example-plugin`.
  - `--workflow-filename <file>`: workflow file name, उदाहरण के लिए `package-publish.yml`.
  - `--environment <name>`: वैकल्पिक exact-match GitHub Actions environment.
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- किसी package से trusted publisher config हटाता है.
- यदि workflow, repository, या environment pin को disable या फिर से create करने की आवश्यकता हो, तो इसे rollback के रूप में उपयोग करें.
- भविष्य के वास्तविक publishes को config फिर से सेट होने तक सामान्य authenticated publishing का उपयोग करना होगा.
- Flags:
  - `--json`: machine-readable output.

उदाहरण:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Install telemetry

- `clawhub install <slug>` के बाद, logged in होने पर भेजा जाता है, जब तक
  `CLAWHUB_DISABLE_TELEMETRY=1` सेट न हो.
- Reporting best-effort है. Telemetry उपलब्ध न होने पर install commands fail नहीं होते.
- विवरण: `docs/telemetry.md`.
