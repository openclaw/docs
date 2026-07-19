---
read_when:
    - ClawHub CLI का उपयोग करना
    - इंस्टॉल, अपडेट या पब्लिश की डीबगिंग
summary: 'CLI संदर्भ: कमांड, फ़्लैग, कॉन्फ़िगरेशन और लॉकफ़ाइल का व्यवहार।'
x-i18n:
    generated_at: "2026-07-19T08:56:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa830e77a2fe0639b113b5f3171da138189c3bdf0271f7b729ad0a84404bce72
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI पैकेज: `clawhub`, बाइनरी: `clawhub`।

इसे npm या pnpm से वैश्विक रूप से इंस्टॉल करें:

```bash
npm i -g clawhub
# या
pnpm add -g clawhub
```

फिर इसे सत्यापित करें:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## वैश्विक फ़्लैग

- `--workdir <dir>`: कार्यशील डायरेक्टरी (डिफ़ॉल्ट: cwd; कॉन्फ़िगर होने पर Clawdbot कार्यस्थान का उपयोग करता है)
- `--dir <dir>`: कार्यशील डायरेक्टरी के अंतर्गत इंस्टॉल डायरेक्टरी (डिफ़ॉल्ट: `skills`)
- `--site <url>`: ब्राउज़र लॉगिन के लिए आधार URL (डिफ़ॉल्ट: `https://clawhub.ai`)
- `--registry <url>`: API आधार URL (डिफ़ॉल्ट: खोजा गया URL, अन्यथा `https://clawhub.ai`)
- `--no-input`: प्रॉम्प्ट अक्षम करें

समतुल्य परिवेश चर:

- `CLAWHUB_SITE` (पुराना `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (पुराना `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (पुराना `CLAWDHUB_WORKDIR`)

### HTTP प्रॉक्सी

CLI कॉर्पोरेट प्रॉक्सी या प्रतिबंधित नेटवर्क के पीछे मौजूद सिस्टम के लिए
मानक HTTP प्रॉक्सी परिवेश चरों का पालन करता है:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

इनमें से कोई भी चर सेट होने पर, CLI आउटबाउंड अनुरोधों को
निर्दिष्ट प्रॉक्सी के माध्यम से भेजता है। HTTPS अनुरोधों के लिए `HTTPS_PROXY` और
साधारण HTTP के लिए `HTTP_PROXY` का उपयोग किया जाता है। विशिष्ट होस्ट या डोमेन के लिए
प्रॉक्सी को बायपास करने हेतु `NO_PROXY` / `no_proxy` का पालन किया जाता है।

यह उन सिस्टम पर आवश्यक है जहाँ प्रत्यक्ष आउटबाउंड कनेक्शन अवरुद्ध होते हैं
(उदा. Docker कंटेनर, केवल प्रॉक्सी इंटरनेट वाला Hetzner VPS, कॉर्पोरेट
फ़ायरवॉल)।

उदाहरण:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "मेरी क्वेरी"
```

जब कोई प्रॉक्सी चर सेट नहीं होता, तो व्यवहार अपरिवर्तित रहता है (प्रत्यक्ष कनेक्शन)।

## कॉन्फ़िगरेशन फ़ाइल

आपका API टोकन और कैश किया गया रजिस्ट्री URL संग्रहीत करती है।

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- पुराना फ़ॉलबैक: यदि `clawhub/config.json` अभी मौजूद नहीं है, लेकिन `clawdhub/config.json` मौजूद है, तो CLI पुराने पथ का पुनः उपयोग करता है
- ओवरराइड: `CLAWHUB_CONFIG_PATH` (पुराना `CLAWDHUB_CONFIG_PATH`)

## कमांड

### `login` / `auth login`

- डिफ़ॉल्ट: ब्राउज़र में `<site>/cli/auth` खोलता है और लूपबैक कॉलबैक के माध्यम से प्रक्रिया पूरी करता है।
- हेडलेस: `clawhub login --token clh_...`
- रिमोट/हेडलेस इंटरैक्टिव: `clawhub login --device` एक कोड प्रिंट करता है और आपके द्वारा `<site>/cli/device` पर इसे अधिकृत किए जाने तक प्रतीक्षा करता है।

### `whoami`

- `/api/v1/whoami` के माध्यम से संग्रहीत टोकन को सत्यापित करता है।

### `token`

- संग्रहीत API टोकन को stdout पर प्रिंट करता है।
- स्थानीय लॉगिन टोकन को CI सीक्रेट सेटअप कमांड में पाइप करने के लिए उपयोगी है।

### `star <skill>` / `unstar <skill>`

- आपके हाइलाइट्स में किसी स्किल को जोड़ता/हटाता है।
- `POST /api/v1/stars/<slug>` और `DELETE /api/v1/stars/<slug>` को कॉल करता है।
- `--yes` पुष्टिकरण को छोड़ देता है।

### `search <query...>`

- `/api/v1/search?q=...` को कॉल करता है।
- आउटपुट में skill slug, स्वामी हैंडल, प्रदर्शन नाम और प्रासंगिकता स्कोर शामिल होते हैं।
- खोज, डाउनलोड लोकप्रियता से पहले सटीक slug/name टोकन मिलानों को प्राथमिकता देती है। `map` जैसा स्वतंत्र slug टोकन, `amap` के भीतर मौजूद उपस्ट्रिंग की तुलना में `personal-map` से अधिक मजबूती से मेल खाता है।
- लोकप्रियता रैंकिंग के लिए एक छोटा पूर्व-संकेत है, शीर्ष स्थान की गारंटी नहीं।
- यदि कोई skill दिखाई देनी चाहिए लेकिन नहीं देती है, तो मेटाडेटा का नाम बदलने से पहले स्वामी को दिखाई देने वाले मॉडरेशन निदान जाँचने के लिए लॉग इन रहते हुए `clawhub inspect @owner/slug` चलाएँ।

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` के माध्यम से नवीनतम skills सूचीबद्ध करता है (`createdAt` के अनुसार अवरोही क्रम में क्रमबद्ध)।
- फ़्लैग:
  - `--limit <n>` (1-200, डिफ़ॉल्ट: 25)
  - `--sort newest|updated|rating|downloads|trending` (डिफ़ॉल्ट: नवीनतम)। संगतता के लिए पुराने इंस्टॉल क्रमबद्धता उपनाम अभी भी काम करते हैं।
  - `--json` (मशीन-पठनीय आउटपुट)
- आउटपुट: `<slug>  v<version>  <age>  <summary>` (सारांश को 50 वर्णों तक सीमित किया जाता है)।

### `inspect @owner/slug`

- इंस्टॉल किए बिना skill मेटाडेटा और संस्करण फ़ाइलें प्राप्त करता है।
- `--version <version>`: किसी विशिष्ट संस्करण का निरीक्षण करें (डिफ़ॉल्ट: नवीनतम)।
- `--tag <tag>`: टैग किए गए संस्करण का निरीक्षण करें (उदा. `latest`)।
- `--versions`: संस्करण इतिहास सूचीबद्ध करें (पहला पृष्ठ)।
- `--limit <n>`: सूचीबद्ध किए जाने वाले संस्करणों की अधिकतम संख्या (1-200)।
- `--files`: चयनित संस्करण की फ़ाइलें सूचीबद्ध करें।
- `--file <path>`: अपरिष्कृत फ़ाइल सामग्री प्राप्त करें (केवल टेक्स्ट फ़ाइलें; 200KB सीमा)।
- `--json`: मशीन-पठनीय आउटपुट।

### `install @owner/slug`

- नामित स्वामी और skill के नवीनतम संस्करण का निर्धारण करता है।
- `/api/v1/download` के माध्यम से zip डाउनलोड करता है।
- `<workdir>/<dir>/<slug>` में एक्सट्रैक्ट करता है।
- पिन की गई skills को अधिलेखित करने से इनकार करता है; पहले `clawhub unpin <skill>` चलाएँ।
- यह लिखता है:
  - `<workdir>/.clawhub/lock.json` (पुराना `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (पुराना `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` को हटाता है और लॉकफ़ाइल प्रविष्टि मिटाता है।
- लॉग इन होने पर सर्वोत्तम-प्रयास टेलीमेट्री भेजता है, ताकि वर्तमान इंस्टॉल गणनाओं को
  निष्क्रिय किया जा सके।
- इंटरैक्टिव: पुष्टि माँगता है।
- गैर-इंटरैक्टिव (`--no-input`): `--yes` आवश्यक है।

### `list`

- `<workdir>/.clawhub/lock.json` को पढ़ता है (पुराना `.clawdhub`)।
- `clawhub pin` के साथ फ़्रीज़ की गई skills के बगल में `pinned` दिखाता है, जिसमें वैकल्पिक कारण भी शामिल है।

### `pin <skill>`

- इंस्टॉल की गई skill को लॉकफ़ाइल में पिन की गई के रूप में चिह्नित करता है।
- `--reason <text>` दर्ज करता है कि skill को क्यों फ़्रीज़ किया गया है।
- पिन की गई skills को `update --all` छोड़ देता है और प्रत्यक्ष `update <skill>` उन्हें अस्वीकार करता है।
- पिन की गई skills `install --force` को भी अस्वीकार करती हैं, ताकि स्थानीय बाइट्स अनजाने में प्रतिस्थापित न हो सकें।

### `unpin <skill>`

- इंस्टॉल की गई skill से लॉकफ़ाइल पिन हटाता है, ताकि भविष्य के अपडेट उसे संशोधित कर सकें।

### `update [@owner/slug]` / `update --all`

- स्थानीय फ़ाइलों से फ़िंगरप्रिंट की गणना करता है।
- यदि फ़िंगरप्रिंट किसी ज्ञात संस्करण से मेल खाता है: कोई प्रॉम्प्ट नहीं।
- यदि फ़िंगरप्रिंट मेल नहीं खाता:
  - डिफ़ॉल्ट रूप से इनकार करता है
  - `--force` के साथ अधिलेखित करता है (या इंटरैक्टिव होने पर प्रॉम्प्ट दिखाता है)
- पिन की गई skills को `--force` कभी अपडेट नहीं करता।
- `update <skill>` पिन की गई skills के लिए तुरंत विफल होता है और आपको पहले `clawhub unpin <skill>` चलाने के लिए कहता है।
- `update --all` पिन किए गए slugs को छोड़ देता है और फ़्रीज़ बनी रही चीज़ों का सारांश प्रिंट करता है।

### `skill publish <path>`

- स्थानीय बंडल फ़िंगरप्रिंट की ClawHub से तुलना करता है और सामग्री पहले से प्रकाशित होने पर सफलतापूर्वक बाहर निकलता है।
- नई skills का डिफ़ॉल्ट `1.0.0` होता है; बदली गई skills का डिफ़ॉल्ट अगला पैच
  संस्करण होता है।
- `--version <version>` स्पष्ट रूप से किसी संस्करण का चयन करता है और सामग्री किसी मौजूदा संस्करण से मेल खाने पर भी
  प्रकाशित करता है।
- `--dry-run` अपलोड किए बिना प्रकाशन का निर्धारण करता है; `--json`
  मशीन-पठनीय परिणाम प्रिंट करता है।
- `--owner <handle>` किसी संगठन/उपयोगकर्ता प्रकाशक हैंडल के अंतर्गत प्रकाशित करता है, जब
  कर्ता के पास प्रकाशक पहुँच हो।
- `--migrate-owner` नया संस्करण प्रकाशित करते समय किसी मौजूदा skill को `--owner` में
  स्थानांतरित करता है। दोनों प्रकाशकों पर एडमिन/स्वामी पहुँच आवश्यक है।
- स्वामी और समीक्षा व्यवहार की व्याख्या `docs/publishing.md` में की गई है।
- किसी skill को प्रकाशित करने का अर्थ है कि उसे ClawHub पर `MIT-0` के अंतर्गत जारी किया गया है।
- प्रकाशित skills का बिना श्रेय दिए निःशुल्क उपयोग, संशोधन और पुनर्वितरण किया जा सकता है।
- ClawHub सशुल्क skills या प्रति-skill मूल्य निर्धारण का समर्थन नहीं करता।
- पुराना उपनाम: `publish <path>`।

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub का पुन: प्रयोज्य
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
वर्कफ़्लो एक `skill_path` के लिए, या `root` (डिफ़ॉल्ट: `skills`) के अंतर्गत प्रत्येक तत्काल skill
फ़ोल्डर के लिए `skill publish` को कॉल करता है। यह अपरिवर्तित skills को छोड़ देता है और समान
स्वचालित पैच-संस्करण व्यवहार का उपयोग करता है।

टोकन के बिना पूर्वावलोकन करने के लिए `dry_run: true` सेट करें। वास्तविक प्रकाशनों के लिए
`clawhub_token` secret आवश्यक है।

### `sync`

- वर्तमान कार्य निर्देशिका, कॉन्फ़िगर की गई skills निर्देशिका और `SKILL.md` या
  `skill.md` वाली स्थानीय skill निर्देशिकाओं के लिए किसी भी `--root <dir>` फ़ोल्डर को
  स्कैन करता है।
- प्रत्येक स्थानीय skill फ़िंगरप्रिंट की ClawHub से तुलना करता है और केवल नई या
  बदली गई skills प्रकाशित करता है।
- नई skills `1.0.0` के रूप में प्रकाशित होती हैं; बदली गई skills डिफ़ॉल्ट रूप से अगला पैच संस्करण
  प्रकाशित करती हैं। उन अपडेट बैचों के लिए `--bump minor|major` का उपयोग करें जिन्हें
  बड़े semver चरण से आगे बढ़ना चाहिए।
- `--dry-run` अपलोड किए बिना प्रकाशन योजना दिखाता है; `--json`
  मशीन-पठनीय योजना प्रिंट करता है।
- `--all` हर नई या बदली गई skill को बिना प्रॉम्प्ट किए प्रकाशित करता है। `--all` के बिना,
  इंटरैक्टिव टर्मिनल आपको प्रकाशित की जाने वाली skills चुनने देते हैं।
- `--owner <handle>` किसी संगठन/उपयोगकर्ता प्रकाशक हैंडल के अंतर्गत प्रकाशित करता है, जब
  कर्ता के पास प्रकाशक पहुँच हो।
- `sync` केवल एकतरफ़ा प्रकाशन करता है। यह इंस्टॉल, अपडेट या डाउनलोड नहीं करता और
  इंस्टॉल/डाउनलोड टेलीमेट्री रिपोर्ट नहीं करता।

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` आवश्यक है।
- `POST /api/v1/skills/-/scan` के माध्यम से ClawHub ClawScan चलाता है, फिर स्कैन के अंतिम स्थिति में पहुँचने तक पोल करता है।
- स्कैन अतुल्यकालिक होते हैं और पूर्ण होने में समय लग सकता है। कतार में रहते समय, टर्मिनल स्पिनर वर्तमान प्राथमिकता-प्राप्त स्कैन स्थिति और आगे मौजूद स्कैनों की संख्या दिखाता है।
- प्रकाशित स्कैन के लिए स्वामित्व या प्रकाशक प्रबंधन पहुँच आवश्यक है। मॉडरेटर/एडमिन `clawhub-admin` के माध्यम से समान बैकएंड का उपयोग कर सकते हैं।
- `--update` केवल `--slug` के साथ मान्य है; यह सफल प्रकाशित स्कैन परिणामों को चयनित संस्करण में वापस लिखता है।
- `--output <file.zip>`, `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` और `README.md` सहित पूर्ण रिपोर्ट अभिलेख डाउनलोड करता है।
- `--json` स्वचालन के लिए पूर्ण पोल प्रतिक्रिया प्रिंट करता है।
- स्थानीय पथ स्कैन अब समर्थित नहीं हैं। नया संस्करण अपलोड करें, फिर उस प्रस्तुत संस्करण के संग्रहीत स्कैन परिणाम प्राप्त करने के लिए `scan download` का उपयोग करें।

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- के लिए `clawhub login` आवश्यक है।
- सबमिट किए गए Skill या Plugin संस्करण के लिए संग्रहीत स्कैन रिपोर्ट ZIP डाउनलोड करता है, जिसमें ClawHub सुरक्षा जाँचों द्वारा अवरुद्ध या छिपाए गए संस्करण भी शामिल हैं।
- Skill डाउनलोड, Skill स्लग का उपयोग करते हैं और डिफ़ॉल्ट रूप से `--kind skill` का उपयोग करते हैं।
- Plugin डाउनलोड, पैकेज नाम का उपयोग करते हैं और इनके लिए `--kind plugin` आवश्यक है।
- `--version` आवश्यक है, ताकि लेखक उस सटीक सबमिट किए गए संस्करण का निरीक्षण करें जिसे ClawHub ने अवरुद्ध किया था।
- `--output <file.zip>` गंतव्य पथ चुनता है।

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub, Skill रिपॉज़िटरी और कैटलॉग रिपॉज़िटरी के लिए
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/skill-publish.yml)
पर एक आधिकारिक पुनः उपयोग योग्य वर्कफ़्लो प्रदान करता है।

सामान्य कैटलॉग सेटअप:

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

टिप्पणियाँ:

- कैटलॉग रिपॉज़िटरी के लिए `root` का डिफ़ॉल्ट मान `skills` है।
- एक Skill फ़ोल्डर को संसाधित करने के लिए `skill_path: skills/review-helper` पास करें।
- `owner`, CLI के `--owner` फ़्लैग से मैप होता है; प्रमाणित उपयोगकर्ता के रूप में प्रकाशित करने के लिए इसे छोड़ दें।
- V1 Skill प्रकाशन `clawhub_token` का उपयोग करता है; GitHub OIDC विश्वसनीय प्रकाशन फ़िलहाल केवल पैकेज के लिए है।

### `delete <skill>`

- `--version` के बिना, किसी Skill को सॉफ़्ट-डिलीट करें (स्वामी, मॉडरेटर या एडमिन)।
- `DELETE /api/v1/skills/{slug}` को कॉल करता है।
- स्वामी द्वारा शुरू किए गए सॉफ़्ट डिलीट, स्लग को 30 दिनों के लिए आरक्षित रखते हैं; कमांड समाप्ति समय प्रिंट करता है।
- `--version <version>`, विफलता पर बंद होने वाले संस्करण-विशिष्ट रूट के माध्यम से स्वामित्व वाले किसी एक गैर-नवीनतम संस्करण को स्थायी रूप से हटाता है।
  हटाए गए संस्करण पुनर्स्थापित या दोबारा प्रकाशित नहीं किए जा सकते। वर्तमान नवीनतम संस्करण को हटाने से पहले
  उसका प्रतिस्थापन प्रकाशित करें। इस केवल-संस्करण प्रवाह में प्लेटफ़ॉर्म कर्मचारी स्वामित्व को बायपास नहीं करते।
- `--reason <text>`, पूरे Skill के सॉफ़्ट-डिलीट और ऑडिट लॉग में मॉडरेशन टिप्पणी दर्ज करता है।
- `--note <text>`, `--reason` का उपनाम है।
- `--yes` पुष्टि को छोड़ देता है।

### `undelete <skill>`

- छिपाए गए Skill को पुनर्स्थापित करें (स्वामी, मॉडरेटर या एडमिन)।
- संस्करण को हटाना पूर्ववत करने की सुविधा नहीं है; स्थायी रूप से हटाए गए संस्करण पुनर्स्थापित नहीं किए जा सकते।
- `POST /api/v1/skills/{slug}/undelete` को कॉल करता है।
- `--reason <text>`, Skill और ऑडिट लॉग में मॉडरेशन टिप्पणी दर्ज करता है।
- `--note <text>`, `--reason` का उपनाम है।
- `--yes` पुष्टि को छोड़ देता है।

### `hide <skill>`

- किसी Skill को छिपाएँ (स्वामी, मॉडरेटर या एडमिन)।
- `delete` का उपनाम।

### `unhide <skill>`

- किसी Skill को फिर से दृश्यमान बनाएँ (स्वामी, मॉडरेटर या एडमिन)।
- `undelete` का उपनाम।

### `skill rename <skill> <new-name>`

- स्वामित्व वाले Skill का नाम बदलें और पिछले स्लग को रीडायरेक्ट उपनाम के रूप में बनाए रखें।
- `POST /api/v1/skills/{slug}/rename` को कॉल करता है।
- `--yes` पुष्टि को छोड़ देता है।

### `skill merge <source> <target>`

- स्वामित्व वाले एक Skill को स्वामित्व वाले दूसरे Skill में मर्ज करें।
- स्रोत स्लग सार्वजनिक रूप से सूचीबद्ध होना बंद हो जाता है और लक्ष्य का रीडायरेक्ट उपनाम बन जाता है।
- `POST /api/v1/skills/{sourceSlug}/merge` को कॉल करता है।
- `--yes` पुष्टि को छोड़ देता है।

### `transfer`

- स्वामित्व हस्तांतरण वर्कफ़्लो।
- उपयोगकर्ता हैंडल में हस्तांतरण एक लंबित अनुरोध बनाता है, जिसे प्राप्तकर्ता स्वीकार करता है।
- संगठन/प्रकाशक हैंडल में हस्तांतरण तुरंत केवल तभी लागू होता है, जब कार्य करने वाले व्यक्ति के पास
  वर्तमान स्वामी और गंतव्य प्रकाशक, दोनों के लिए एडमिन पहुँच हो।
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

- `GET /api/v1/packages` और `GET /api/v1/packages/search` के माध्यम से एकीकृत पैकेज कैटलॉग ब्राउज़ करता है या उसमें खोज करता है।
- इसे Plugin और अन्य पैकेज-परिवार प्रविष्टियों के लिए उपयोग करें; शीर्ष-स्तरीय `search` Skill खोज सतह बनी रहती है।
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
  - `--limit <n>` (1-100, डिफ़ॉल्ट: 25)
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

- इंस्टॉल किए बिना पैकेज मेटाडेटा प्राप्त करता है।
- इसे Plugin मेटाडेटा, संगतता, सत्यापन, स्रोत और संस्करण/फ़ाइल निरीक्षण के लिए उपयोग करें।
- `--version <version>`: किसी विशिष्ट संस्करण का निरीक्षण करें (डिफ़ॉल्ट: नवीनतम)।
- `--tag <tag>`: किसी टैग किए गए संस्करण का निरीक्षण करें (जैसे `latest`)।
- `--versions`: संस्करण इतिहास सूचीबद्ध करें (पहला पृष्ठ)।
- `--limit <n>`: सूचीबद्ध किए जाने वाले संस्करणों की अधिकतम संख्या (1-100)।
- `--files`: चयनित संस्करण की फ़ाइलें सूचीबद्ध करें।
- `--file <path>`: अपरिष्कृत फ़ाइल सामग्री प्राप्त करें (केवल टेक्स्ट फ़ाइलें; 200KB सीमा)।
- `--json`: मशीन-पठनीय आउटपुट।

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` के माध्यम से
  पैकेज संस्करण को रिज़ॉल्व करता है।
- रिज़ॉल्वर के `downloadUrl` से आर्टिफ़ैक्ट डाउनलोड करता है।
- सभी आर्टिफ़ैक्ट के लिए ClawHub SHA-256 सत्यापित करता है।
- ClawPack npm-pack आर्टिफ़ैक्ट के लिए, npm `sha512` अखंडता,
  npm shasum और टारबॉल के `package.json` नाम/संस्करण को भी सत्यापित करता है।
- लेगेसी ZIP संस्करण, लेगेसी ZIP रूट के माध्यम से डाउनलोड होते हैं।
- फ़्लैग:
  - `--version <version>`: कोई विशिष्ट संस्करण डाउनलोड करें।
  - `--tag <tag>`: कोई टैग किया गया संस्करण डाउनलोड करें (डिफ़ॉल्ट: `latest`)।
  - `-o, --output <path>`: आउटपुट फ़ाइल या डायरेक्टरी।
  - `--force`: मौजूदा आउटपुट फ़ाइल को अधिलेखित करें।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- स्थानीय आर्टिफ़ैक्ट के लिए ClawHub SHA-256, npm `sha512` अखंडता और npm shasum की
  गणना करता है।
- `--package` के साथ, ClawHub से अपेक्षित मेटाडेटा रिज़ॉल्व करता है और
  स्थानीय फ़ाइल की तुलना प्रकाशित आर्टिफ़ैक्ट मेटाडेटा से करता है।
- प्रत्यक्ष डाइजेस्ट फ़्लैग के साथ, नेटवर्क लुकअप के बिना सत्यापित करता है।
- फ़्लैग:
  - `--package <name>`: अपेक्षित आर्टिफ़ैक्ट मेटाडेटा रिज़ॉल्व करने के लिए पैकेज नाम।
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

- स्थानीय Plugin पैकेज फ़ोल्डर पर ClawHub CLI के साथ बंडल किए गए Plugin Inspector को
  चलाता है।
- स्थानीय OpenClaw चेकआउट का पता लगाए या उसे इंपोर्ट किए बिना, डिफ़ॉल्ट रूप से ऑफ़लाइन/स्थैतिक सत्यापन करता है।
- गंभीर संगतता त्रुटियों पर गैर-शून्य निकास होता है। केवल चेतावनी वाले निष्कर्ष प्रिंट होते हैं, लेकिन
  निकास शून्य रहता है।
- फ़्लैग:
  - `--out <dir>`: इस डायरेक्टरी में Plugin Inspector रिपोर्ट लिखें।
  - `--openclaw <path>`: स्पष्ट रूप से निर्दिष्ट स्थानीय OpenClaw चेकआउट के विरुद्ध निरीक्षण करें।
  - `--runtime`: रनटाइम कैप्चर सक्षम करें; Plugin कोड इंपोर्ट करता है।
  - `--allow-execute`: पृथक वर्कस्पेस में रनटाइम कैप्चर की अनुमति दें।
  - `--no-mock-sdk`: रनटाइम कैप्चर के दौरान मॉक किए गए OpenClaw SDK को अक्षम करें।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package validate ./example-plugin
```

यदि सत्यापन किसी पैकेज, मैनिफ़ेस्ट, SDK इंपोर्ट या आर्टिफ़ैक्ट निष्कर्ष की रिपोर्ट करता है, तो
[Plugin सत्यापन सुधार](/clawhub/plugin-validation-fixes) देखें, फिर कमांड दोबारा चलाएँ।

### `package delete <name>`

- `--version` के बिना, किसी पैकेज और उसकी सभी रिलीज़ को सॉफ़्ट-डिलीट करता है।
- `--version <version>`, विफलता पर बंद होने वाले संस्करण-विशिष्ट रूट के माध्यम से स्वामित्व वाली किसी एक गैर-नवीनतम रिलीज़ को स्थायी रूप से हटाता है।
  हटाए गए संस्करण पुनर्स्थापित या दोबारा प्रकाशित नहीं किए जा सकते। वर्तमान नवीनतम संस्करण को हटाने से पहले
  उसका प्रतिस्थापन प्रकाशित करें। इस केवल-संस्करण प्रवाह के लिए पैकेज स्वामी या संगठन प्रकाशक
  एडमिन होना आवश्यक है; प्लेटफ़ॉर्म कर्मचारी पैकेज स्वामित्व को बायपास नहीं करते।
- पूरे पैकेज को सॉफ़्ट-डिलीट करने के लिए पैकेज स्वामी, संगठन प्रकाशक स्वामी/एडमिन, प्लेटफ़ॉर्म
  मॉडरेटर या प्लेटफ़ॉर्म एडमिन होना आवश्यक है।
- फ़्लैग:
  - `--version <version>`: किसी एक गैर-नवीनतम संस्करण को स्थायी रूप से हटाएँ।
  - `--yes`: पुष्टि को छोड़ दें।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- सॉफ़्ट-डिलीट किए गए पैकेज और रिलीज़ को पुनर्स्थापित करता है।
- संस्करण को हटाना पूर्ववत करने की सुविधा नहीं है; स्थायी रूप से हटाए गए संस्करण पुनर्स्थापित नहीं किए जा सकते।
- इसके लिए पैकेज स्वामी, संगठन प्रकाशक स्वामी/एडमिन, प्लेटफ़ॉर्म मॉडरेटर
  या प्लेटफ़ॉर्म एडमिन होना आवश्यक है।
- `POST /api/v1/packages/{name}/undelete` को कॉल करता है।
- फ़्लैग:
  - `--yes`: पुष्टि को छोड़ दें।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- किसी पैकेज को दूसरे प्रकाशक को स्थानांतरित करता है।
- वर्तमान पैकेज स्वामी और गंतव्य प्रकाशक, दोनों के लिए एडमिन पहुँच आवश्यक है,
  जब तक कि यह किसी प्लेटफ़ॉर्म एडमिन द्वारा न किया जाए।
- स्कोप किए गए पैकेज नामों को मेल खाने वाले स्कोप स्वामी को स्थानांतरित करना आवश्यक है।
- `POST /api/v1/packages/{name}/transfer` को कॉल करता है।
- फ़्लैग:
  - `--to <owner>`: गंतव्य प्रकाशक हैंडल।
  - `--reason <text>`: वैकल्पिक ऑडिट कारण।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- मॉडरेटर को किसी पैकेज की रिपोर्ट करने के लिए प्रमाणित कमांड।
- `POST /api/v1/packages/{name}/report` को कॉल करता है।
- रिपोर्ट पैकेज-स्तरीय होती हैं, वैकल्पिक रूप से किसी संस्करण से संबद्ध की जा सकती हैं,
  और समीक्षा के लिए मॉडरेटर को दिखाई देने लगती हैं।
- रिपोर्ट अपने-आप पैकेज को छिपाती या डाउनलोड को अवरुद्ध नहीं करती हैं।
- फ़्लैग:
  - `--version <version>`: रिपोर्ट से संबद्ध करने के लिए वैकल्पिक पैकेज संस्करण।
  - `--reason <text>`: आवश्यक रिपोर्ट कारण।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "संदिग्ध नेटिव पेलोड"
```

### `package moderation-status`

- पैकेज मॉडरेशन दृश्यता जाँचने के लिए स्वामी कमांड।
- `GET /api/v1/packages/{name}/moderation` को कॉल करता है।
- वर्तमान पैकेज स्कैन स्थिति, खुली रिपोर्ट की संख्या, नवीनतम रिलीज़ की मैन्युअल
  मॉडरेशन स्थिति, डाउनलोड अवरोध स्थिति और मॉडरेशन कारण दिखाता है।
- फ़्लैग:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- जाँचता है कि कोई पैकेज भविष्य में OpenClaw द्वारा उपयोग के लिए तैयार है या नहीं।
- `GET /api/v1/packages/{name}/readiness` को कॉल करता है।
- आधिकारिक स्थिति, ClawPack उपलब्धता, आर्टिफ़ैक्ट डाइजेस्ट,
  स्रोत उत्पत्ति, OpenClaw संगतता, होस्ट लक्ष्य, परिवेश मेटाडेटा
  और स्कैन स्थिति से संबंधित अवरोधकों की रिपोर्ट करता है।
- फ़्लैग:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- किसी ऐसे पैकेज के लिए ऑपरेटर-केंद्रित माइग्रेशन स्थिति दिखाता है जो किसी
  बंडल किए गए OpenClaw plugin की जगह ले सकता है।
- `package readiness` वाले समान परिकलित तत्परता एंडपॉइंट को कॉल करता है, लेकिन
  माइग्रेशन-केंद्रित स्थिति, नवीनतम संस्करण, आधिकारिक-पैकेज स्थिति, जाँचें और
  अवरोधक प्रिंट करता है।
- फ़्लैग:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- प्रमाणित उपयोगकर्ता के स्वामित्व वाला एक संगठन प्रकाशक बनाता है।
- हैंडल को लोअरकेस में सामान्यीकृत किया जाता है और इसे `@` के साथ या उसके बिना दिया जा सकता है।
- नए बनाए गए संगठन प्रकाशक डिफ़ॉल्ट रूप से विश्वसनीय/आधिकारिक नहीं होते हैं।
- यदि हैंडल पहले से किसी मौजूदा प्रकाशक, उपयोगकर्ता या आरक्षित रूट द्वारा उपयोग किया जा रहा हो, तो यह विफल हो जाता है।

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` के माध्यम से कोड plugin या बंडल plugin प्रकाशित करता है।
- `<source>` इन्हें स्वीकार करता है:
  - स्थानीय फ़ोल्डर पथ: `./my-plugin`
  - स्थानीय ClawPack npm-pack टारबॉल: `./my-plugin-1.2.3.tgz`
  - GitHub रिपॉज़िटरी: `owner/repo` या `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- मेटाडेटा का स्वतः पता `package.json`, `openclaw.plugin.json` और
  वास्तविक OpenClaw बंडल मार्कर, जैसे `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` और `.cursor-plugin/plugin.json`, से लगाया जाता है।
- `.tgz` स्रोतों को ClawPack माना जाता है। CLI सटीक npm-pack
  बाइट अपलोड करता है और निकाली गई `package/` सामग्री का उपयोग केवल सत्यापन और
  मेटाडेटा पूर्व-भरण के लिए करता है।
- कोड-plugin फ़ोल्डर को अपलोड से पहले ClawPack npm टारबॉल में पैक किया जाता है, ताकि
  OpenClaw इंस्टॉलेशन सटीक आर्टिफ़ैक्ट सत्यापित कर सकें। बंडल-plugin फ़ोल्डर अब भी
  निकाली गई फ़ाइल वाले प्रकाशन पथ का उपयोग करते हैं।
- GitHub स्रोतों के लिए, स्रोत विशेषता रिपॉज़िटरी, निर्धारित कमिट, रेफ़ और उपपथ से स्वतः भरी जाती है।
- स्थानीय फ़ोल्डर के लिए, जब मूल रिमोट GitHub की ओर इंगित करता है, तो स्थानीय git से स्रोत विशेषता का स्वतः पता लगाया जाता है।
- बाहरी कोड plugin को `openclaw.compat.pluginApi` और
  `openclaw.build.openclawVersion` स्पष्ट रूप से घोषित करना आवश्यक है।
  शीर्ष-स्तरीय `package.json.version` का उपयोग प्रकाशन सत्यापन के लिए फ़ॉलबैक के रूप में नहीं किया जाता।
- `--dry-run` अपलोड किए बिना निर्धारित प्रकाशन पेलोड का पूर्वावलोकन करता है।
- `--json` CI के लिए मशीन-पठनीय आउटपुट देता है।
- जब कर्ता के पास प्रकाशक पहुँच होती है, तब `--owner <handle>` किसी उपयोगकर्ता या संगठन प्रकाशक हैंडल के अंतर्गत प्रकाशित करता है।
- स्कोप किए गए पैकेज नाम चयनित स्वामी से मेल खाने चाहिए। `docs/publishing.md` देखें।
- मौजूदा फ़्लैग (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) अब भी ओवरराइड के रूप में काम करते हैं।
- निजी GitHub रिपॉज़िटरी के लिए `GITHUB_TOKEN` आवश्यक है।

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### अनुशंसित स्थानीय प्रवाह

पहले `--dry-run` का उपयोग करें, ताकि लाइव रिलीज़ बनाने से पहले निर्धारित पैकेज मेटाडेटा और
स्रोत विशेषता की पुष्टि की जा सके:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### स्थानीय फ़ोल्डर प्रवाह

कोड plugin के लिए, फ़ोल्डर प्रकाशन पैकेज फ़ोल्डर से ClawPack आर्टिफ़ैक्ट बनाता
और अपलोड करता है:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` के लिए न्यूनतम `package.json`

बाहरी कोड plugin को `package.json` में थोड़ी-सी OpenClaw मेटाडेटा की
आवश्यकता होती है। यह न्यूनतम मेनिफ़ेस्ट सफल प्रकाशन के लिए पर्याप्त है:

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

आवश्यक फ़ील्ड:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

टिप्पणियाँ:

- `package.json.version` आपके पैकेज का रिलीज़ संस्करण है, लेकिन इसका उपयोग
  OpenClaw संगतता/बिल्ड सत्यापन के फ़ॉलबैक के रूप में नहीं किया जाता।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
  मौजूद होने पर ClawHub इन्हें दिखा सकता है, लेकिन प्रकाशन के लिए ये आवश्यक नहीं हैं।
- `openclaw.compat.minGatewayVersion` और
  `openclaw.build.pluginSdkVersion` वैकल्पिक अतिरिक्त फ़ील्ड हैं, यदि आप अधिक
  विस्तृत संगतता मेटाडेटा प्रकाशित करना चाहते हैं।
- यदि आप `clawhub` CLI का कोई पुराना रिलीज़ उपयोग कर रहे हैं, तो प्रकाशन से पहले अपग्रेड करें, ताकि
  अपलोड से पहले स्थानीय प्रीफ़्लाइट जाँचें चलें।
- यदि सत्यापन कोई सुधार कोड रिपोर्ट करता है, तो
  [Plugin सत्यापन सुधार](/clawhub/plugin-validation-fixes) देखें।

#### GitHub Actions

ClawHub plugin रिपॉज़िटरी के लिए
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/package-publish.yml)
पर एक आधिकारिक पुन: उपयोग योग्य वर्कफ़्लो भी प्रदान करता है।

सामान्य कॉलर सेटअप:

```yaml
name: पैकेज प्रकाशन

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

टिप्पणियाँ:

- पुन: उपयोग योग्य वर्कफ़्लो `source` को डिफ़ॉल्ट रूप से कॉलर रिपॉज़िटरी पर सेट करता है।
- मोनोरिपॉज़िटरी के लिए, `source_path` दें, ताकि वर्कफ़्लो plugin
  पैकेज फ़ोल्डर प्रकाशित करे, उदाहरण के लिए `source_path: extensions/codex`।
- पुन: उपयोग योग्य वर्कफ़्लो को किसी स्थिर टैग या पूर्ण कमिट SHA पर पिन करें। `@main` से रिलीज़ प्रकाशन न चलाएँ।
- `pull_request` को `dry_run: true` का उपयोग करना चाहिए, ताकि CI कोई अवांछित प्रभाव न डाले।
- वास्तविक प्रकाशन केवल `workflow_dispatch` या टैग पुश जैसे विश्वसनीय इवेंट तक सीमित होने चाहिए।
- सीक्रेट के बिना विश्वसनीय प्रकाशन केवल `workflow_dispatch` पर काम करता है; टैग पुश के लिए अब भी `clawhub_token` आवश्यक है।
- पहले प्रकाशन, अविश्वसनीय पैकेज या आपातकालीन प्रकाशन के लिए `clawhub_token` उपलब्ध रखें।
- वर्कफ़्लो JSON परिणाम को आर्टिफ़ैक्ट के रूप में अपलोड करता है और उसे वर्कफ़्लो आउटपुट के रूप में उपलब्ध कराता है।

### `package trusted-publisher get <name>`

- किसी पैकेज के लिए GitHub Actions विश्वसनीय प्रकाशक कॉन्फ़िगरेशन दिखाता है।
- कॉन्फ़िगरेशन सेट करने के बाद रिपॉज़िटरी, वर्कफ़्लो फ़ाइल नाम
  और वैकल्पिक परिवेश पिन की पुष्टि करने के लिए इसका उपयोग करें।
- फ़्लैग:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- किसी मौजूदा पैकेज के लिए GitHub Actions विश्वसनीय प्रकाशक कॉन्फ़िगरेशन
  संलग्न करता है या बदलता है।
- पैकेज को पहले सामान्य मैन्युअल या टोकन-प्रमाणित
  `clawhub package publish` के माध्यम से बनाया जाना आवश्यक है।
- कॉन्फ़िगरेशन सेट होने के बाद, भविष्य के समर्थित GitHub Actions प्रकाशन
  दीर्घकालिक ClawHub टोकन के बिना OIDC/विश्वसनीय प्रकाशन का उपयोग कर सकते हैं।
- `--repository <repo>` का `owner/repo` होना आवश्यक है।
- `--workflow-filename <file>` का
  `.github/workflows/` में मौजूद वर्कफ़्लो फ़ाइल नाम से मेल खाना आवश्यक है।
- `--environment <name>` वैकल्पिक है। कॉन्फ़िगर होने पर, OIDC दावे में मौजूद
  GitHub Actions परिवेश का बिल्कुल मेल खाना आवश्यक है।
- इस कमांड के चलने पर ClawHub कॉन्फ़िगर की गई GitHub रिपॉज़िटरी सत्यापित करता है।
  सार्वजनिक रिपॉज़िटरी को सार्वजनिक GitHub मेटाडेटा के माध्यम से सत्यापित किया जा सकता है। निजी
  रिपॉज़िटरी के लिए ClawHub के पास उस रिपॉज़िटरी की GitHub पहुँच होनी आवश्यक है,
  उदाहरण के लिए भविष्य में ClawHub GitHub App इंस्टॉलेशन या किसी अन्य अधिकृत
  GitHub एकीकरण के माध्यम से।
- फ़्लैग:
  - `--repository <repo>`: GitHub रिपॉज़िटरी, उदाहरण के लिए `openclaw/example-plugin`।
  - `--workflow-filename <file>`: वर्कफ़्लो फ़ाइल नाम, उदाहरण के लिए `package-publish.yml`।
  - `--environment <name>`: वैकल्पिक पूर्ण-मिलान वाला GitHub Actions परिवेश।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- किसी पैकेज से विश्वसनीय प्रकाशक कॉन्फ़िगरेशन हटाता है।
- यदि वर्कफ़्लो, रिपॉज़िटरी या परिवेश पिन को अक्षम करने या फिर से बनाने की
  आवश्यकता हो, तो इसका उपयोग रोलबैक के रूप में करें।
- कॉन्फ़िगरेशन फिर से सेट होने तक भविष्य के वास्तविक प्रकाशनों को सामान्य प्रमाणित प्रकाशन का उपयोग करना आवश्यक है।
- फ़्लैग:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### इंस्टॉल टेलीमेट्री

- लॉग इन होने पर `clawhub install <slug>` के बाद भेजी जाती है, जब तक कि
  `CLAWHUB_DISABLE_TELEMETRY=1` सेट न हो।
- रिपोर्टिंग सर्वोत्तम-प्रयास के आधार पर होती है। टेलीमेट्री अनुपलब्ध होने पर इंस्टॉल
  कमांड विफल नहीं होते।
- विवरण: `docs/telemetry.md`।
