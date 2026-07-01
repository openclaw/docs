---
read_when:
    - ClawHub क्या है, यह समझाना
    - Skills या Plugin खोजना, इंस्टॉल करना या अपडेट करना
    - Skills या Plugin को रजिस्ट्री में प्रकाशित करना
    - openclaw और clawhub CLI प्रवाहों के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, इंस्टॉल, प्रकाशित करने, सुरक्षा, और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T15:24:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills और प्लगइनों की सार्वजनिक रजिस्ट्री है।

- Skills खोजने, इंस्टॉल करने और अपडेट करने तथा ClawHub से प्लगइन इंस्टॉल करने के लिए नेटिव `openclaw` कमांड का उपयोग करें।
- रजिस्ट्री auth, प्रकाशन, और delete/undelete वर्कफ़्लो के लिए अलग `clawhub` CLI का उपयोग करें।

साइट: [clawhub.ai](https://clawhub.ai)

## त्वरित शुरुआत

OpenClaw के साथ Skills खोजें और इंस्टॉल करें:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw के साथ प्लगइन खोजें और इंस्टॉल करें:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

जब आपको publish या delete/undelete जैसे रजिस्ट्री-प्रमाणित वर्कफ़्लो चाहिए हों,
तो ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह           | यह क्या संग्रहीत करता है                                      | सामान्य कमांड                               |
| ------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Skills        | `SKILL.md` और सहायक फ़ाइलों के साथ वर्ज़न किए गए टेक्स्ट बंडल | `openclaw skills install @openclaw/demo`     |
| कोड प्लगइन    | संगतता मेटाडेटा के साथ OpenClaw प्लगइन पैकेज                  | `openclaw plugins install clawhub:<package>` |
| बंडल प्लगइन   | OpenClaw वितरण के लिए पैकेज किए गए प्लगइन बंडल                 | `clawhub package publish <source>`           |

ClawHub semver संस्करण, `latest` जैसे टैग, चेंजलॉग, फ़ाइलें,
डाउनलोड, स्टार, और सुरक्षा स्कैन सारांश ट्रैक करता है। सार्वजनिक पेज वर्तमान रजिस्ट्री
स्थिति दिखाते हैं ताकि उपयोगकर्ता किसी Skill या प्लगइन को इंस्टॉल करने से पहले उसका निरीक्षण कर सकें।

## नेटिव OpenClaw फ़्लो

नेटिव OpenClaw कमांड सक्रिय OpenClaw वर्कस्पेस में इंस्टॉल करते हैं और
स्रोत मेटाडेटा सहेजते हैं ताकि बाद के अपडेट कमांड ClawHub पर बने रह सकें।

जब किसी प्लगइन इंस्टॉल को ClawHub के माध्यम से resolve करना हो, तो `clawhub:<package>` का उपयोग करें।
लॉन्च कटओवर के दौरान bare npm-safe प्लगइन spec npm के माध्यम से resolve हो सकते हैं, और
जब स्रोत स्पष्ट होना चाहिए तो `npm:<package>` केवल npm ही रहता है।

प्लगइन इंस्टॉल archive install चलने से पहले विज्ञापित `pluginApi` और `minGatewayVersion`
संगतता को validate करते हैं। जब कोई पैकेज संस्करण ClawPack artifact प्रकाशित करता है,
OpenClaw ठीक अपलोड किए गए npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header
और डाउनलोड किए गए bytes को verify करता है, और बाद के अपडेट के लिए artifact मेटाडेटा रिकॉर्ड करता है।

## ClawHub CLI

ClawHub CLI रजिस्ट्री-प्रमाणित काम के लिए है:

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

CLI में सीधे रजिस्ट्री वर्कफ़्लो के लिए Skill install/update कमांड भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

वे कमांड वर्तमान कार्यशील directory के अंतर्गत `./skills` में Skills इंस्टॉल करते हैं
और इंस्टॉल किए गए संस्करणों को `.clawhub/lock.json` में रिकॉर्ड करते हैं।

## प्रकाशन

`SKILL.md` वाली स्थानीय folder से Skills प्रकाशित करें:

```bash
clawhub skill publish <path>
```

सामान्य publish विकल्प:

- `--slug <slug>`: प्रकाशित Skill URL नाम।
- `--name <name>`: display name।
- `--version <version>`: semver संस्करण।
- `--changelog <text>`: changelog text।
- `--tags <tags>`: comma-separated tags, डिफ़ॉल्ट रूप से `latest`।

स्थानीय folder, `owner/repo`, `owner/repo@ref`, या GitHub
URL से प्लगइन प्रकाशित करें:

```bash
clawhub package publish <source>
```

अपलोड किए बिना ठीक publish plan बनाने के लिए `--dry-run` का उपयोग करें, और CI-अनुकूल
output के लिए `--json` का उपयोग करें।

कोड प्लगइन में `package.json` में आवश्यक OpenClaw compatibility metadata होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` शामिल हैं। पूर्ण कमांड
संदर्भ के लिए [CLI](/hi/clawhub/cli) और Skill मेटाडेटा के लिए [Skill format](/clawhub/skill-format) देखें।

## सुरक्षा और मॉडरेशन

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी अपलोड कर सकता है, लेकिन प्रकाशन के लिए ऐसा GitHub
account आवश्यक है जो upload gate पास करने के लिए पर्याप्त पुराना हो। सार्वजनिक detail pages
install या download से पहले नवीनतम scan state का सारांश देते हैं।

ClawHub प्रकाशित Skills और प्लगइन रिलीज़ पर automated checks चलाता है। Scan-held
या blocked releases सार्वजनिक catalog और install surfaces से गायब हो सकती हैं, जबकि
`/dashboard` में अपने owner को दिखाई देती रहती हैं।

Signed-in users Skills और packages की रिपोर्ट कर सकते हैं। Moderators reports की समीक्षा कर सकते हैं,
content छिपा या restore कर सकते हैं, और abusive accounts को ban कर सकते हैं। नीति और enforcement details के लिए
[Security](/hi/clawhub/security),
[Security Audits](/clawhub/security-audits),
[Moderation and Account Safety](/clawhub/moderation), और
[Acceptable usage](/hi/clawhub/acceptable-usage) देखें।

## टेलीमेट्री और environment

जब आप logged in रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort
install event भेज सकता है ताकि ClawHub aggregate install counts compute कर सके। इसे इससे disable करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| Variable                      | प्रभाव                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | browser login के लिए उपयोग की गई site URL override करें। |
| `CLAWHUB_REGISTRY`            | registry API URL override करें।                  |
| `CLAWHUB_CONFIG_PATH`         | CLI token/config state कहाँ store करता है, इसे override करें। |
| `CLAWHUB_WORKDIR`             | default working directory override करें।          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | install telemetry disable करें।                   |

अधिक गहन संदर्भ सामग्री के लिए [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और
[Troubleshooting](/hi/clawhub/troubleshooting) देखें।
