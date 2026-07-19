---
read_when:
    - ClawHub क्या है, इसकी व्याख्या करना
    - Skills या plugins को खोजना, इंस्टॉल करना या अपडेट करना
    - रजिस्ट्री में Skills या plugins प्रकाशित करना
    - openclaw और clawhub CLI प्रवाहों के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, इंस्टॉलेशन, प्रकाशन, सुरक्षा और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-19T08:59:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills और Plugins की सार्वजनिक रजिस्ट्री है।

- Skills खोजने, इंस्टॉल और अपडेट करने तथा ClawHub से Plugins इंस्टॉल करने के लिए नेटिव `openclaw` कमांड का उपयोग करें।
- रजिस्ट्री प्रमाणीकरण, प्रकाशन और हटाने/पुनर्स्थापित करने के कार्यप्रवाहों के लिए अलग `clawhub` CLI का उपयोग करें।

साइट: [clawhub.ai](https://clawhub.ai)

## त्वरित शुरुआत

OpenClaw के साथ Skills खोजें और इंस्टॉल करें:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw के साथ Plugins खोजें और इंस्टॉल करें:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

जब आप प्रकाशन या हटाने/पुनर्स्थापित करने जैसे रजिस्ट्री-प्रमाणीकृत कार्यप्रवाहों का उपयोग करना चाहते हों, तब ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# या
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह           | यह क्या संग्रहीत करती है                                      | सामान्य कमांड                               |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` और सहायक फ़ाइलों वाले संस्करणयुक्त टेक्स्ट बंडल | `openclaw skills install @openclaw/demo`     |
| कोड Plugins   | संगतता मेटाडेटा वाले OpenClaw Plugin पैकेज                  | `openclaw plugins install clawhub:<package>` |
| बंडल Plugins | OpenClaw वितरण के लिए पैकेज किए गए Plugin बंडल              | `clawhub package publish <source>`           |

ClawHub semver संस्करणों, `latest` जैसे टैग, बदलाव-सूचियों, फ़ाइलों,
डाउनलोड, स्टार और सुरक्षा स्कैन सारांशों को ट्रैक करता है। सार्वजनिक पृष्ठ रजिस्ट्री की
वर्तमान स्थिति दिखाते हैं, ताकि उपयोगकर्ता किसी Skill या Plugin को इंस्टॉल करने से पहले उसका निरीक्षण कर सकें।

## नेटिव OpenClaw प्रवाह

नेटिव OpenClaw कमांड सक्रिय OpenClaw कार्यक्षेत्र में इंस्टॉल करते हैं और
स्रोत मेटाडेटा को स्थायी रखते हैं, ताकि बाद के अपडेट कमांड ClawHub पर बने रह सकें।

जब किसी Plugin इंस्टॉलेशन को ClawHub के माध्यम से रिज़ॉल्व करना हो, तब `clawhub:<package>` का उपयोग करें।
लॉन्च संक्रमणों के दौरान बिना उपसर्ग वाले npm-सुरक्षित Plugin विनिर्देश npm के माध्यम से रिज़ॉल्व हो सकते हैं, और
जब स्रोत स्पष्ट होना आवश्यक हो, तब `npm:<package>` केवल npm के लिए रहता है।

Plugin इंस्टॉलेशन, आर्काइव इंस्टॉलेशन चलने से पहले घोषित `pluginApi` और `minGatewayVersion`
संगतता को सत्यापित करते हैं। जब कोई पैकेज संस्करण ClawPack आर्टिफ़ैक्ट प्रकाशित करता है,
तो OpenClaw सटीक अपलोड किए गए npm-pack `.tgz` को प्राथमिकता देता है, ClawHub डाइजेस्ट
हेडर और डाउनलोड किए गए बाइट्स को सत्यापित करता है और बाद के अपडेट के लिए आर्टिफ़ैक्ट मेटाडेटा
दर्ज करता है।

## ClawHub CLI

ClawHub CLI रजिस्ट्री-प्रमाणीकृत कार्य के लिए है:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI में प्रत्यक्ष रजिस्ट्री कार्यप्रवाहों के लिए Skill इंस्टॉल/अपडेट कमांड भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

वे कमांड वर्तमान कार्यशील डायरेक्टरी के अंतर्गत `./skills` में Skills इंस्टॉल करते हैं
और इंस्टॉल किए गए संस्करणों को `.clawhub/lock.json` में दर्ज करते हैं।

## प्रकाशन

`SKILL.md` वाली स्थानीय डायरेक्टरी से Skills प्रकाशित करें:

```bash
clawhub skill publish <path>
```

प्रकाशन के सामान्य विकल्प:

- `--slug <slug>`: प्रकाशित Skill के URL का नाम।
- `--name <name>`: प्रदर्शित नाम।
- `--version <version>`: semver संस्करण।
- `--changelog <text>`: बदलाव-सूची का टेक्स्ट।
- `--tags <tags>`: कॉमा से अलग किए गए टैग, जिनका डिफ़ॉल्ट `latest` है।

किसी स्थानीय डायरेक्टरी, `owner/repo`, `owner/repo@ref` या GitHub
URL से Plugins प्रकाशित करें:

```bash
clawhub package publish <source>
```

अपलोड किए बिना प्रकाशन की सटीक योजना बनाने के लिए `--dry-run` और CI-अनुकूल
आउटपुट के लिए `--json` का उपयोग करें।

कोड Plugins में `package.json` के भीतर आवश्यक OpenClaw संगतता मेटाडेटा होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` शामिल हैं। संपूर्ण कमांड संदर्भ के लिए [CLI](/hi/clawhub/cli)
और Skill मेटाडेटा के लिए [Skill प्रारूप](/hi/clawhub/skill-format) देखें।

## सुरक्षा और मॉडरेशन

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी अपलोड कर सकता है, लेकिन प्रकाशन के लिए ऐसा GitHub
खाता आवश्यक है जो अपलोड गेट पार करने के लिए पर्याप्त पुराना हो। सार्वजनिक विवरण पृष्ठ इंस्टॉल
या डाउनलोड से पहले नवीनतम स्कैन स्थिति का सारांश दिखाते हैं।

ClawHub प्रकाशित Skills और Plugin रिलीज़ पर स्वचालित जाँच चलाता है। स्कैन के कारण रोकी गई
या अवरुद्ध रिलीज़ सार्वजनिक कैटलॉग और इंस्टॉल सतहों से गायब हो सकती हैं, जबकि
`/dashboard` में उनके स्वामी को दिखाई देती रहती हैं।

साइन-इन किए हुए उपयोगकर्ता Skills और पैकेज की रिपोर्ट कर सकते हैं। मॉडरेटर रिपोर्ट की समीक्षा कर सकते हैं,
सामग्री छिपा या पुनर्स्थापित कर सकते हैं और दुरुपयोग करने वाले खातों को प्रतिबंधित कर सकते हैं। नीति और प्रवर्तन के विवरण के लिए
[सुरक्षा](/clawhub/security),
[सुरक्षा ऑडिट](/clawhub/security-audits),
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation), और
[स्वीकार्य उपयोग](/clawhub/acceptable-usage) देखें।

## टेलीमेट्री और परिवेश

लॉग इन रहते हुए जब आप `clawhub install` चलाते हैं, तो CLI सर्वोत्तम-प्रयास के आधार पर
इंस्टॉलेशन इवेंट भेज सकता है, ताकि ClawHub कुल इंस्टॉलेशन संख्या की गणना कर सके। इसे इस प्रकार अक्षम करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी परिवेश ओवरराइड:

| वेरिएबल                      | प्रभाव                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ब्राउज़र लॉगिन के लिए उपयोग किए जाने वाले साइट URL को ओवरराइड करें।     |
| `CLAWHUB_REGISTRY`            | रजिस्ट्री API URL को ओवरराइड करें।                    |
| `CLAWHUB_CONFIG_PATH`         | CLI द्वारा टोकन/कॉन्फ़िगरेशन स्थिति संग्रहीत करने का स्थान ओवरराइड करें। |
| `CLAWHUB_WORKDIR`             | डिफ़ॉल्ट कार्यशील डायरेक्टरी को ओवरराइड करें।           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | इंस्टॉलेशन टेलीमेट्री अक्षम करें।                        |

अधिक विस्तृत संदर्भ सामग्री के लिए [टेलीमेट्री](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और
[समस्या निवारण](/clawhub/troubleshooting) देखें।
