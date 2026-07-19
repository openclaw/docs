---
read_when:
    - आप memory-wiki CLI का उपयोग करना चाहते हैं
    - आप `openclaw wiki` का दस्तावेज़ीकरण कर रहे हैं या उसे बदल रहे हैं
summary: '`openclaw wiki` के लिए CLI संदर्भ (memory-wiki वॉल्ट स्थिति, खोज, संकलन, लिंट, लागू करना, ब्रिज, ChatGPT आयात और Obsidian सहायक)'
title: विकी
x-i18n:
    generated_at: "2026-07-19T09:16:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475f2dfaaea3b7712746a52d17ccdea26db9018140502ebdc38e3c0fc326acf3
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` वॉल्ट का निरीक्षण और रखरखाव करें। बंडल किए गए `memory-wiki` Plugin द्वारा प्रदान किया गया।

संबंधित: [मेमोरी विकी Plugin](/hi/plugins/memory-wiki), [मेमोरी का अवलोकन](/hi/concepts/memory), [CLI: मेमोरी](/hi/cli/memory)

## सामान्य कमांड

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "Teams के बारे में मुझे किससे पूछना चाहिए?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha सारांश" \
  --body "संक्षिप्त संश्लेषण सामग्री" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "क्या यह अभी भी सक्रिय है?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## एजेंट चयन

जब `plugins.entries.memory-wiki.config.vault.scope`, `agent` हो, तो शीर्ष-स्तरीय
`--agent <id>` विकल्प से वॉल्ट चुनें:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

एकाधिक कॉन्फ़िगर किए गए एजेंटों वाले सेटअप में CLI
संचालनों के लिए `--agent` आवश्यक है, ताकि कोई कमांड किसी मनमाने डिफ़ॉल्ट वॉल्ट को पढ़ या लिख न सके। यदि
केवल एक एजेंट कॉन्फ़िगर किया गया है, तो वही एजेंट डिफ़ॉल्ट रहता है। अज्ञात एजेंट आईडी के कारण
वॉल्ट संचालन शुरू होने से पहले ही विफलता होती है। जब `vault.scope`, `global` हो, तब यह विकल्प चयनित
पथ को नहीं बदलता।

Gateway क्लाइंट भी इसी नियम का पालन करते हैं: एजेंट-स्कोप वाले बहु-एजेंट सेटअप में वॉल्ट-समर्थित `wiki.*`
अनुरोधों पर `agentId` पास करें। अनुपस्थित या अज्ञात आईडी
एक त्रुटि है। एजेंट टर्न, विकी टूल, मेमोरी कॉर्पस अनुपूरक और संकलित प्रॉम्प्ट
डाइजेस्ट पहले से सक्रिय रनटाइम एजेंट संदर्भ रखते हैं।

## कमांड

### `wiki status`

वॉल्ट मोड और स्कोप, समाधान किया गया एजेंट, स्वास्थ्य और Obsidian CLI की उपलब्धता दिखाएँ। यह जाँचने के लिए पहले इसका उपयोग करें कि इच्छित वॉल्ट आरंभ किया गया है या नहीं, ब्रिज मोड स्वस्थ है या नहीं, अथवा Obsidian एकीकरण उपलब्ध है या नहीं।

जब ब्रिज मोड सक्रिय हो और मेमोरी आर्टिफ़ैक्ट पढ़ने के लिए कॉन्फ़िगर किया गया हो, तो यह कमांड चालू Gateway से क्वेरी करता है, ताकि इसे एजेंट/रनटाइम मेमोरी के समान सक्रिय मेमोरी Plugin संदर्भ दिखाई दे।

### `wiki doctor`

विकी स्वास्थ्य जाँच चलाएँ और कार्रवाई योग्य सुधार बताएँ। अस्वस्थ होने पर गैर-शून्य निकास होता है।

जब ब्रिज मोड सक्रिय हो और मेमोरी आर्टिफ़ैक्ट पढ़ने के लिए कॉन्फ़िगर किया गया हो, तो यह कमांड रिपोर्ट बनाने से पहले चालू Gateway से क्वेरी करता है। अक्षम ब्रिज आयात और वे ब्रिज कॉन्फ़िगरेशन जो मेमोरी आर्टिफ़ैक्ट नहीं पढ़ते, स्थानीय/ऑफ़लाइन रहते हैं।

सामान्य समस्याएँ:

- सार्वजनिक मेमोरी आर्टिफ़ैक्ट के बिना ब्रिज मोड सक्षम
- अमान्य या अनुपस्थित वॉल्ट लेआउट
- Obsidian मोड अपेक्षित होने पर बाहरी Obsidian CLI अनुपस्थित

### `wiki init`

शीर्ष-स्तरीय इंडेक्स और कैश डायरेक्टरियों सहित विकी वॉल्ट लेआउट और आरंभिक पृष्ठ बनाएँ।

### `wiki ingest <path>`

किसी स्थानीय Markdown या टेक्स्ट फ़ाइल को स्रोत पृष्ठ के रूप में विकी के `sources/` फ़ोल्डर में आयात करें। `<path>` एक स्थानीय फ़ाइल पथ होना चाहिए; वर्तमान में URL से अंतर्ग्रहण उपलब्ध नहीं है। बाइनरी फ़ाइलें अस्वीकार की जाती हैं।

आयातित स्रोत पृष्ठों में उद्गम frontmatter (`sourceType: local-file`, `sourcePath`, `ingestedAt`) होता है। अंतर्ग्रहण के बाद वॉल्ट हमेशा पुनः संकलित होता है।

फ़्लैग: `--title <title>` स्रोत शीर्षक को ओवरराइड करता है (डिफ़ॉल्ट: फ़ाइल नाम से व्युत्पन्न)।

### `wiki okf import <path>`

अनपैक किए गए Open Knowledge Format बंडल को विकी अवधारणा पृष्ठों में आयात करें।

आयातक OKF डायरेक्टरी ट्री में हर गैर-आरक्षित `.md` अवधारणा दस्तावेज़ को पढ़ता है, एक गैर-रिक्त `type` फ़ील्ड आवश्यक बनाता है और अज्ञात OKF `type` मानों को सामान्य अवधारणाओं के रूप में मानता है। आरक्षित OKF `index.md` और `log.md` फ़ाइलों को अवधारणाओं के रूप में आयात नहीं किया जाता।

आयातित पृष्ठों को `concepts/` के अंतर्गत समतल किया जाता है, ताकि मौजूदा विकी संकलन, खोज, प्राप्ति, डाइजेस्ट और डैशबोर्ड प्रवाह उन्हें तुरंत देख सकें। मूल OKF अवधारणा आईडी, `type`, `resource`, `tags`, टाइमस्टैम्प, स्रोत पथ और पूरा frontmatter पृष्ठ के frontmatter में संरक्षित रहते हैं। आंतरिक OKF Markdown लिंक जनरेट किए गए विकी पृष्ठों की ओर पुनर्लिखे जाते हैं; टूटे हुए या बाहरी लिंक अपरिवर्तित छोड़े जाते हैं। आयात के बाद वॉल्ट हमेशा पुनः संकलित होता है।

उदाहरण:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

इंडेक्स, संबंधित ब्लॉक, डैशबोर्ड और संकलित क्वेरी/प्रॉम्प्ट स्नैपशॉट फिर से बनाएँ। स्नैपशॉट OpenClaw की साझा SQLite Plugin स्थिति में स्थायी रूप से संग्रहीत होता है और समकालिक प्रॉम्प्ट प्रक्षेपण के लिए मेमोरी में रखा जाता है; यह वॉल्ट में कैश फ़ाइलें नहीं बनाता।

यदि `render.createDashboards` सक्षम है, तो संकलन रिपोर्ट पृष्ठों को भी रीफ़्रेश करता है।

### `wiki lint`

वॉल्ट को लिंट करें और निम्न को समेटने वाली रिपोर्ट लिखें:

- संरचनात्मक समस्याएँ (टूटे लिंक, अनुपस्थित/डुप्लिकेट आईडी, अनुपस्थित पृष्ठ प्रकार या शीर्षक, अमान्य frontmatter)
- उद्गम में कमियाँ (अनुपस्थित स्रोत आईडी, अनुपस्थित आयात उद्गम)
- विरोधाभास (चिह्नित विरोधाभास, परस्पर विरोधी दावे)
- अनुत्तरित प्रश्न
- कम-विश्वसनीयता वाले पृष्ठ और दावे
- पुराने पृष्ठ और दावे

महत्वपूर्ण विकी अपडेट के बाद इसे चलाएँ।

### `wiki search <query>`

विकी सामग्री खोजें। व्यवहार कॉन्फ़िगरेशन पर निर्भर करता है:

- `search.backend`: `shared` या `local`
- `search.corpus`: `wiki`, `memory` या `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` या `raw-claim`

विकी-विशिष्ट रैंकिंग और उद्गम के लिए `wiki search` का उपयोग करें। एक व्यापक साझा स्मरण पास के लिए, जब सक्रिय मेमोरी Plugin साझा खोज उपलब्ध कराता हो, तब `openclaw memory search` को प्राथमिकता दें।

खोज मोड:

- `find-person`: उपनाम, हैंडल, सोशल पहचान, कैननिकल आईडी और व्यक्ति पृष्ठ
- `route-question`: किससे पूछें/किसके लिए सर्वोत्तम है संबंधी संकेत और संबंध संदर्भ
- `source-evidence`: स्रोत पृष्ठ और संरचित साक्ष्य फ़ील्ड
- `raw-claim`: दावा/साक्ष्य मेटाडेटा सहित संरचित दावा टेक्स्ट

उदाहरण:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "Teams रोलआउट के बारे में कौन जानता है?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

जब कोई परिणाम किसी संरचित दावे से मेल खाता है, तो टेक्स्ट आउटपुट में `Claim:` और `Evidence:` पंक्तियाँ शामिल होती हैं। JSON आउटपुट एजेंट-पक्षीय विस्तृत जाँच के लिए `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` और `evidenceSourceIds` भी उजागर करता है।

### `wiki get <lookup>`

आईडी या सापेक्ष पथ के आधार पर विकी पृष्ठ पढ़ें।

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

मनमाने पृष्ठ संपादन के बिना सीमित परिवर्तन लागू करें:

- `apply synthesis <title>`: प्रबंधित सारांश सामग्री वाला संश्लेषण पृष्ठ बनाएँ या रीफ़्रेश करें
- `apply metadata <lookup>`: मौजूदा पृष्ठ पर मेटाडेटा अपडेट करें

दोनों `--source-id`, `--contradiction`, `--question` (प्रत्येक दोहराने योग्य), `--confidence <n>` (0-1) और `--status <status>` स्वीकार करते हैं। संग्रहीत विश्वसनीयता मान हटाने के लिए `apply metadata`, `--clear-confidence` भी स्वीकार करता है। विकी पृष्ठों को विकसित करने का यही समर्थित तरीका है, जिससे प्रबंधित जनरेट किए गए ब्लॉक अक्षुण्ण रहें।

### `wiki bridge import`

सक्रिय मेमोरी Plugin से सार्वजनिक मेमोरी आर्टिफ़ैक्ट को ब्रिज-समर्थित स्रोत पृष्ठों में आयात करें। नवीनतम निर्यातित मेमोरी आर्टिफ़ैक्ट को विकी वॉल्ट में लाने के लिए `bridge` मोड में इसका उपयोग करें।

सक्रिय ब्रिज आर्टिफ़ैक्ट पठन के लिए CLI, Gateway RPC के माध्यम से आयात रूट करता है, ताकि यह रनटाइम मेमोरी Plugin संदर्भ का उपयोग करे। यदि ब्रिज आयात अक्षम हैं या आर्टिफ़ैक्ट पठन बंद है, तो कमांड स्थानीय/ऑफ़लाइन शून्य-आयात व्यवहार बनाए रखता है। आयात के बाद इंडेक्स रीफ़्रेश `ingest.autoCompile` द्वारा नियंत्रित होता है।

### `wiki unsafe-local import`

`unsafe-local` मोड में स्पष्ट रूप से कॉन्फ़िगर किए गए स्थानीय पथों (`unsafeLocal.paths`) से आयात करें। यह जानबूझकर प्रायोगिक है और केवल उसी मशीन पर काम करता है। आयात के बाद इंडेक्स रीफ़्रेश `ingest.autoCompile` द्वारा नियंत्रित होता है।

### `wiki chatgpt import`

ChatGPT निर्यात को प्रारूप विकी स्रोत पृष्ठों में आयात करें।

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| फ़्लैग              | डिफ़ॉल्ट    | विवरण                                                   |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | (आवश्यक) | ChatGPT निर्यात डायरेक्टरी या `conversations.json` पथ।        |
| `--dry-run`       | `false`    | पृष्ठ लिखे बिना बनाए गए/अपडेट किए गए/छोड़े गए पृष्ठों की संख्या का पूर्वावलोकन करें। |

कोई गैर-ड्राई-रन आयात जो किसी पृष्ठ को बदलता है, एक आयात रन आईडी दर्ज करता है, जो सारांश में दिखाई जाती है और रोलबैक के लिए आवश्यक होती है।

### `wiki chatgpt rollback <run-id>`

पहले लागू किए गए ChatGPT आयात रन को वापस लें, उसके बनाए पृष्ठ हटाएँ और उसके द्वारा अधिलेखित पृष्ठ पुनर्स्थापित करें। यदि रन पहले ही वापस लिया जा चुका है, तो कोई कार्रवाई नहीं होती (और `alreadyRolledBack` रिपोर्ट किया जाता है)।

### `wiki obsidian ...`

Obsidian-अनुकूल मोड में चलने वाले वॉल्ट के लिए Obsidian सहायक कमांड: `status`, `search`, `open`, `command`, `daily`। `obsidian.useOfficialCli` सक्षम होने पर इनके लिए `PATH` पर आधिकारिक `obsidian` CLI आवश्यक है।

जब `vault.scope`, `agent` हो, तब कॉन्फ़िगरेशन सत्यापन
`obsidian.useOfficialCli: true` को अस्वीकार करता है, क्योंकि `obsidian.vaultName` एक वैश्विक सेटिंग है,
प्रति-एजेंट मैपिंग नहीं। Obsidian-अनुकूल Markdown रेंडरिंग
उपलब्ध रहती है।

## व्यावहारिक उपयोग मार्गदर्शन

- जब उद्गम और पृष्ठ पहचान महत्वपूर्ण हों, तब `wiki search` + `wiki get` का उपयोग करें।
- प्रबंधित जनरेट किए गए अनुभागों को हाथ से संपादित करने के बजाय `wiki apply` का उपयोग करें।
- विरोधाभासी या कम-विश्वसनीयता वाली सामग्री पर भरोसा करने से पहले `wiki lint` का उपयोग करें।
- बल्क आयात या स्रोत परिवर्तनों के बाद, जब तुरंत ताज़ा डैशबोर्ड और संकलित डाइजेस्ट चाहिए हों, तब `wiki compile` का उपयोग करें।
- जब कोई डेटा कैटलॉग, दस्तावेज़ीकरण निर्यात या एजेंट संवर्धन पाइपलाइन पहले से OKF Markdown बंडल बनाती हो, तब `wiki okf import` का उपयोग करें।
- जब ब्रिज मोड नए निर्यातित मेमोरी आर्टिफ़ैक्ट पर निर्भर हो, तब `wiki bridge import` का उपयोग करें।

## कॉन्फ़िगरेशन संबंध

`openclaw wiki` का व्यवहार निम्न से निर्धारित होता है:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

पूर्ण कॉन्फ़िगरेशन मॉडल के लिए [मेमोरी विकी Plugin](/hi/plugins/memory-wiki) देखें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [मेमोरी विकी](/hi/plugins/memory-wiki)
