---
read_when:
    - आप सेटअप के बाद बिना किसी कमांड के openclaw चलाते हैं और Crestodian को समझना चाहते हैं
    - आपको OpenClaw का निरीक्षण या मरम्मत करने के लिए कॉन्फ़िगरेशन-रहित सुरक्षित तरीका चाहिए
    - आप message-channel rescue mode डिज़ाइन या सक्षम कर रहे हैं
summary: Crestodian के लिए CLI संदर्भ और सुरक्षा मॉडल, configless-safe सेटअप और मरम्मत सहायक
title: Crestodian
x-i18n:
    generated_at: "2026-06-28T22:48:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian OpenClaw का स्थानीय सेटअप, मरम्मत और कॉन्फ़िगरेशन सहायक है। इसे इस तरह
डिज़ाइन किया गया है कि सामान्य एजेंट पथ टूट जाने पर भी यह उपलब्ध रहे।

बिना किसी कमांड के `openclaw` चलाने पर, यदि सक्रिय कॉन्फ़िग फ़ाइल मौजूद नहीं है या उसमें कोई लेखक-निर्धारित सेटिंग नहीं है (खाली या
केवल मेटाडेटा), तो पहले क्लासिक ऑनबोर्डिंग शुरू होती है। किसी कॉन्फ़िग फ़ाइल में लेखक-निर्धारित सेटिंग होने के बाद, बिना किसी कमांड के `openclaw`
चलाने पर इंटरैक्टिव टर्मिनल में Crestodian शुरू होता है। `openclaw crestodian`
चलाने पर वही सहायक स्पष्ट रूप से शुरू होता है।

## Crestodian क्या दिखाता है

स्टार्टअप पर, इंटरैक्टिव Crestodian वही TUI शेल खोलता है जिसका उपयोग
`openclaw tui` करता है, लेकिन Crestodian चैट बैकएंड के साथ। चैट लॉग एक छोटे
अभिवादन से शुरू होता है:

- Crestodian कब शुरू करना है
- Crestodian वास्तव में जिस मॉडल या निर्धारक प्लानर पथ का उपयोग कर रहा है
- कॉन्फ़िग वैधता और डिफ़ॉल्ट एजेंट
- पहले स्टार्टअप प्रोब से Gateway की पहुंचयोग्यता
- अगली डीबग कार्रवाई जो Crestodian कर सकता है

यह केवल शुरू होने के लिए सीक्रेट डंप नहीं करता या Plugin CLI कमांड लोड नहीं करता। TUI
अब भी सामान्य हेडर, चैट लॉग, स्थिति लाइन, फुटर, ऑटोकम्प्लीट,
और एडिटर नियंत्रण देता है।

कॉन्फ़िग पथ, डॉक्स/स्रोत पथ,
स्थानीय CLI प्रोब, API-कुंजी मौजूदगी, एजेंट, मॉडल, और Gateway विवरण वाली विस्तृत इन्वेंटरी के लिए `status` का उपयोग करें।

Crestodian सामान्य एजेंटों जैसी ही OpenClaw संदर्भ खोज का उपयोग करता है। Git चेकआउट में,
यह खुद को स्थानीय `docs/` और स्थानीय स्रोत ट्री की ओर इंगित करता है। npm पैकेज इंस्टॉल में, यह
बंडल किए गए पैकेज डॉक्स का उपयोग करता है और
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) से लिंक करता है, साथ में यह स्पष्ट
मार्गदर्शन देता है कि जब डॉक्स पर्याप्त न हों तो स्रोत की समीक्षा करें।

## उदाहरण

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Crestodian TUI के अंदर:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## सुरक्षित स्टार्टअप

Crestodian का स्टार्टअप पथ जानबूझकर छोटा रखा गया है। यह तब चल सकता है जब:

- `openclaw.json` मौजूद नहीं है
- `openclaw.json` अमान्य है
- Gateway बंद है
- Plugin कमांड पंजीकरण उपलब्ध नहीं है
- अभी तक कोई एजेंट कॉन्फ़िग नहीं किया गया है

`openclaw --help` और `openclaw --version` अब भी सामान्य तेज़ पथों का उपयोग करते हैं।
नॉन-इंटरैक्टिव खाली `openclaw` रूट सहायता प्रिंट करने के बजाय एक छोटा संदेश देकर बाहर निकलता है।
नए इंस्टॉल पर, संदेश नॉन-इंटरैक्टिव ऑनबोर्डिंग की ओर संकेत करता है;
सेटअप के बाद, यह वन-शॉट Crestodian कमांड की ओर संकेत करता है।

## संचालन और अनुमोदन

Crestodian कॉन्फ़िग को मनमाने ढंग से संपादित करने के बजाय टाइप किए गए संचालन का उपयोग करता है।

केवल-पढ़ने वाले संचालन तुरंत चल सकते हैं:

- अवलोकन दिखाएं
- एजेंट सूचीबद्ध करें
- इंस्टॉल किए गए Plugin सूचीबद्ध करें
- ClawHub Plugin खोजें
- मॉडल/बैकएंड स्थिति दिखाएं
- स्थिति या स्वास्थ्य जांच चलाएं
- Gateway की पहुंचयोग्यता जांचें
- इंटरैक्टिव सुधारों के बिना doctor चलाएं
- कॉन्फ़िग सत्यापित करें
- ऑडिट-लॉग पथ दिखाएं

स्थायी संचालन के लिए इंटरैक्टिव मोड में संवादात्मक अनुमोदन चाहिए, जब तक कि
आप सीधे कमांड के लिए `--yes` पास न करें:

- कॉन्फ़िग लिखें
- `config set` चलाएं
- समर्थित SecretRef मानों को `config set-ref` के जरिए सेट करें
- सेटअप/ऑनबोर्डिंग बूटस्ट्रैप चलाएं
- डिफ़ॉल्ट मॉडल बदलें
- Gateway शुरू, बंद या पुनः शुरू करें
- एजेंट बनाएं
- ClawHub या npm से Plugin इंस्टॉल करें
- Plugin अनइंस्टॉल करें
- ऐसे doctor मरम्मत चलाएं जो कॉन्फ़िग या स्थिति को फिर से लिखते हैं

लागू किए गए लेखन यहां दर्ज किए जाते हैं:

```text
~/.openclaw/audit/crestodian.jsonl
```

खोज का ऑडिट नहीं किया जाता। केवल लागू किए गए संचालन और लेखन लॉग किए जाते हैं।

`openclaw onboard --modern` Crestodian को आधुनिक ऑनबोर्डिंग प्रीव्यू के रूप में शुरू करता है।
सादा `openclaw onboard` अब भी क्लासिक ऑनबोर्डिंग चलाता है।

## सेटअप बूटस्ट्रैप

`setup` चैट-प्रथम ऑनबोर्डिंग बूटस्ट्रैप है। यह केवल टाइप किए गए
कॉन्फ़िग संचालन के जरिए लिखता है और पहले अनुमोदन मांगता है।

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

जब कोई मॉडल कॉन्फ़िग नहीं है, तो सेटअप इस
क्रम में पहला उपयोगी बैकएंड चुनता है और बताता है कि उसने क्या चुना:

- मौजूदा स्पष्ट मॉडल, यदि पहले से कॉन्फ़िग है
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> Codex app-server harness के जरिए `openai/gpt-5.5`

यदि कोई उपलब्ध नहीं है, तो सेटअप फिर भी डिफ़ॉल्ट वर्कस्पेस लिखता है और
मॉडल को अनसेट छोड़ देता है। Codex/Claude Code इंस्टॉल करें या उसमें लॉग इन करें, या
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` उपलब्ध कराएं, फिर सेटअप दोबारा चलाएं।

## मॉडल-सहायित प्लानर

Crestodian हमेशा निर्धारक मोड में शुरू होता है। ऐसे अस्पष्ट कमांड के लिए जिन्हें
निर्धारक पार्सर नहीं समझता, स्थानीय Crestodian OpenClaw के सामान्य रनटाइम पथों के जरिए एक सीमित
प्लानर टर्न कर सकता है। यह पहले कॉन्फ़िग किए गए
OpenClaw मॉडल का उपयोग करता है। यदि अभी कोई कॉन्फ़िग किया गया मॉडल उपयोगी नहीं है, तो यह मशीन पर पहले से मौजूद
स्थानीय रनटाइम पर fallback कर सकता है:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- Codex app-server harness: `openai/gpt-5.5`

मॉडल-सहायित प्लानर सीधे कॉन्फ़िग बदल नहीं सकता। इसे अनुरोध को
Crestodian के टाइप किए गए कमांड में से किसी एक में अनुवाद करना होगा, फिर सामान्य अनुमोदन और
ऑडिट नियम लागू होते हैं। कुछ भी चलाने से पहले Crestodian वह मॉडल प्रिंट करता है जिसका उसने उपयोग किया और
व्याख्यायित कमांड दिखाता है। कॉन्फ़िग-रहित fallback प्लानर टर्न
अस्थायी होते हैं, जहां रनटाइम समर्थन देता है वहां टूल-अक्षम होते हैं, और एक अस्थायी
वर्कस्पेस/सेशन का उपयोग करते हैं।

मैसेज-चैनल रेस्क्यू मोड मॉडल-सहायित प्लानर का उपयोग नहीं करता। रिमोट
रेस्क्यू निर्धारक रहता है ताकि टूटा या समझौता किया गया सामान्य एजेंट पथ
कॉन्फ़िग एडिटर के रूप में उपयोग न हो सके।

## एजेंट पर स्विच करना

Crestodian छोड़कर सामान्य TUI खोलने के लिए प्राकृतिक-भाषा चयनकर्ता का उपयोग करें:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, और `openclaw terminal` अब भी सीधे सामान्य
एजेंट TUI खोलते हैं। वे Crestodian शुरू नहीं करते।

सामान्य TUI में स्विच करने के बाद, Crestodian पर लौटने के लिए `/crestodian` का उपयोग करें।
आप एक अनुवर्ती अनुरोध शामिल कर सकते हैं:

```text
/crestodian
/crestodian restart gateway
```

TUI के अंदर एजेंट स्विच एक संकेत छोड़ते हैं कि `/crestodian` उपलब्ध है।

## संदेश रेस्क्यू मोड

संदेश रेस्क्यू मोड Crestodian के लिए मैसेज-चैनल एंट्रीपॉइंट है। यह उस
स्थिति के लिए है जहां आपका सामान्य एजेंट बंद है, लेकिन WhatsApp जैसा विश्वसनीय चैनल
अब भी कमांड प्राप्त करता है।

समर्थित टेक्स्ट कमांड:

- `/crestodian <request>`

ऑपरेटर प्रवाह:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

एजेंट निर्माण को स्थानीय प्रॉम्प्ट या रेस्क्यू मोड से भी कतारबद्ध किया जा सकता है:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

रिमोट रेस्क्यू मोड एक एडमिन सतह है। इसे सामान्य चैट की तरह नहीं,
बल्कि रिमोट कॉन्फ़िग मरम्मत की तरह माना जाना चाहिए।

रिमोट रेस्क्यू के लिए सुरक्षा अनुबंध:

- सैंडबॉक्सिंग सक्रिय होने पर अक्षम। यदि कोई एजेंट/सेशन सैंडबॉक्स किया गया है,
  तो Crestodian को रिमोट रेस्क्यू से इंकार करना चाहिए और समझाना चाहिए कि स्थानीय CLI मरम्मत
  आवश्यक है।
- डिफ़ॉल्ट प्रभावी स्थिति `auto` है: रिमोट रेस्क्यू केवल विश्वसनीय YOLO
  संचालन में अनुमति दें, जहां रनटाइम के पास पहले से बिना-सैंडबॉक्स स्थानीय अधिकार है।
- स्पष्ट मालिक पहचान आवश्यक करें। रेस्क्यू को वाइल्डकार्ड प्रेषक
  नियम, खुली समूह नीति, अप्रमाणित webhooks, या अनाम चैनल स्वीकार नहीं करने चाहिए।
- डिफ़ॉल्ट रूप से केवल मालिक DM। समूह/चैनल रेस्क्यू के लिए स्पष्ट opt-in आवश्यक है।
- Plugin खोज और सूची केवल-पढ़ने वाली हैं। Plugin इंस्टॉल डिफ़ॉल्ट रूप से केवल-स्थानीय है
  क्योंकि यह निष्पादन योग्य कोड डाउनलोड करता है। Plugin अनइंस्टॉल को
  अनुमोदित मरम्मत संचालन के रूप में अनुमति दी जा सकती है जब रेस्क्यू नीति स्थायी लेखन की अनुमति देती है।
- रिमोट रेस्क्यू स्थानीय TUI नहीं खोल सकता या इंटरैक्टिव एजेंट
  सेशन में स्विच नहीं कर सकता। एजेंट हैंडऑफ के लिए स्थानीय `openclaw` का उपयोग करें।
- स्थायी लेखन के लिए अब भी अनुमोदन आवश्यक है, रेस्क्यू मोड में भी।
- हर लागू रेस्क्यू संचालन का ऑडिट करें। मैसेज-चैनल रेस्क्यू चैनल,
  खाता, प्रेषक, और स्रोत-पता मेटाडेटा दर्ज करता है। कॉन्फ़िग बदलने वाले संचालन पहले और बाद के
  कॉन्फ़िग हैश भी दर्ज करते हैं।
- सीक्रेट कभी प्रतिध्वनित न करें। SecretRef निरीक्षण को उपलब्धता बतानी चाहिए,
  मान नहीं।
- यदि Gateway चालू है, तो Gateway के टाइप किए गए संचालन को प्राथमिकता दें। यदि Gateway
  बंद है, तो केवल उस न्यूनतम स्थानीय मरम्मत सतह का उपयोग करें जो
  सामान्य एजेंट लूप पर निर्भर नहीं है।

कॉन्फ़िग आकार:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` को ये स्वीकार करने चाहिए:

- `"auto"`: डिफ़ॉल्ट। केवल तब अनुमति दें जब प्रभावी रनटाइम YOLO हो और
  सैंडबॉक्सिंग बंद हो।
- `false`: मैसेज-चैनल रेस्क्यू को कभी अनुमति न दें।
- `true`: मालिक/चैनल जांच पास होने पर रेस्क्यू को स्पष्ट रूप से अनुमति दें। यह
  फिर भी सैंडबॉक्सिंग अस्वीकृति को बायपास नहीं कर सकता।

डिफ़ॉल्ट `"auto"` YOLO मुद्रा है:

- सैंडबॉक्स मोड `off` में resolve होता है
- `tools.exec.security` `full` में resolve होता है
- `tools.exec.ask` `off` में resolve होता है

रिमोट रेस्क्यू Docker lane द्वारा कवर किया गया है:

```bash
pnpm test:docker:crestodian-rescue
```

कॉन्फ़िग-रहित स्थानीय प्लानर fallback इससे कवर किया गया है:

```bash
pnpm test:docker:crestodian-planner
```

एक opt-in लाइव चैनल कमांड-सतह स्मोक `/crestodian status` और रेस्क्यू हैंडलर के जरिए
स्थायी अनुमोदन roundtrip की जांच करता है:

```bash
pnpm test:live:crestodian-rescue-channel
```

स्पष्ट Crestodian कमांड के जरिए कॉन्फ़िग-रहित सेटअप इससे कवर किया गया है:

```bash
pnpm test:docker:crestodian-first-run
```

वह lane खाली state dir से शुरू होता है, आधुनिक onboard Crestodian
entrypoint सत्यापित करता है, डिफ़ॉल्ट मॉडल सेट करता है, एक अतिरिक्त एजेंट बनाता है, Discord को
Plugin enablement और token SecretRef के जरिए कॉन्फ़िग करता है, कॉन्फ़िग सत्यापित करता है, और
ऑडिट लॉग जांचता है। QA Lab में इसी Ring 0
प्रवाह के लिए repo-backed scenario भी है:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Doctor](/hi/cli/doctor)
- [TUI](/hi/cli/tui)
- [सैंडबॉक्स](/hi/cli/sandbox)
- [सुरक्षा](/hi/cli/security)
