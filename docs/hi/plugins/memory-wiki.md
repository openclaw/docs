---
read_when:
    - आप साधारण MEMORY.md नोट्स से आगे स्थायी ज्ञान चाहते हैं
    - आप बंडल किए गए memory-wiki Plugin को कॉन्फ़िगर कर रहे हैं
    - एक Gateway में एजेंटों के लिए अलग-अलग विकी वॉल्ट आवश्यक हैं
    - आप wiki_search, wiki_get या bridge मोड को समझना चाहते हैं
summary: 'memory-wiki: उद्गम-स्रोतों, दावों, डैशबोर्ड और ब्रिज मोड सहित संकलित ज्ञान भंडार'
title: मेमोरी विकी
x-i18n:
    generated_at: "2026-07-16T16:09:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` एक बंडल किया गया Plugin है, जो टिकाऊ ज्ञान को एक
नेविगेट करने योग्य विकी में संकलित करता है: निर्धारक पृष्ठ, साक्ष्य सहित संरचित दावे,
उद्गम, डैशबोर्ड और मशीन-पठनीय डाइजेस्ट।

यह Active Memory Plugin को प्रतिस्थापित नहीं करता। पुनःस्मरण, उन्नयन, इंडेक्सिंग और
Dreaming का स्वामित्व उसी मेमोरी बैकएंड के पास रहता है जिसे कॉन्फ़िगर किया गया है
(`memory-core`, QMD, Honcho आदि)। `memory-wiki` उसके साथ रहता है और
ज्ञान को एक अनुरक्षित विकी परत में संकलित करता है।

| परत                 | स्वामित्व                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Active Memory Plugin | पुनःस्मरण, सिमेंटिक खोज, उन्नयन, Dreaming, मेमोरी रनटाइम                          |
| `memory-wiki`        | संकलित विकी पृष्ठ, उद्गम-समृद्ध संश्लेषण, डैशबोर्ड, विकी खोज/प्राप्ति/लागू करना |

व्यावहारिक नियम:

- कॉन्फ़िगर किए गए सभी कॉर्पस में एक व्यापक पुनःस्मरण पास के लिए `memory_search`
- जब आपको विकी-विशिष्ट रैंकिंग, उद्गम या पृष्ठ-स्तरीय विश्वास संरचना चाहिए, तब `wiki_search` / `wiki_get`
- जब Active Memory Plugin कॉर्पस चयन का समर्थन करता हो, तब एक कॉल में दोनों परतों को समाहित करने के लिए `memory_search corpus=all`

एक सामान्य लोकल-फर्स्ट सेटअप: पुनःस्मरण के लिए Active Memory बैकएंड के रूप में QMD और
टिकाऊ संश्लेषित पृष्ठों के लिए `bridge` मोड में `memory-wiki`। [कॉन्फ़िगरेशन](#configuration)
के अंतर्गत QMD + ब्रिज मोड उदाहरण देखें।

यदि ब्रिज मोड शून्य निर्यातित आर्टिफ़ैक्ट की रिपोर्ट करता है, तो Active Memory Plugin
वर्तमान में सार्वजनिक ब्रिज इनपुट उपलब्ध नहीं करा रहा है। पहले `openclaw wiki doctor` चलाएँ,
फिर पुष्टि करें कि Active Memory Plugin सार्वजनिक आर्टिफ़ैक्ट का समर्थन करता है।

## वॉल्ट मोड

- `isolated` (डिफ़ॉल्ट): अपना वॉल्ट, अपने स्रोत, Active Memory Plugin पर कोई निर्भरता नहीं। इसका उपयोग एक स्व-निहित, व्यवस्थित ज्ञान भंडार के लिए करें।
- `bridge`: सार्वजनिक Plugin SDK सीमों के माध्यम से Active Memory Plugin से सार्वजनिक मेमोरी आर्टिफ़ैक्ट और इवेंट लॉग पढ़ता है। निजी Plugin आंतरिक भागों तक पहुँचे बिना मेमोरी Plugin के निर्यातित आर्टिफ़ैक्ट संकलित करने के लिए इसका उपयोग करें।
- `unsafe-local`: स्थानीय निजी पथों के लिए स्पष्ट समान-मशीन एस्केप हैच। जानबूझकर प्रयोगात्मक और गैर-पोर्टेबल; इसका उपयोग केवल तभी करें जब आप विश्वास सीमा समझते हों और विशेष रूप से ऐसी स्थानीय फ़ाइल-सिस्टम पहुँच चाहिए जिसे ब्रिज मोड प्रदान नहीं कर सकता।

वॉल्ट मोड और वॉल्ट स्कोप अलग-अलग विकल्प हैं:

- `vaultMode` चुनता है कि विकी इनपुट कहाँ से आते हैं।
- `vault.scope` चुनता है कि सभी एजेंट एक वॉल्ट का उपयोग करेंगे या प्रत्येक एजेंट को एक चाइल्ड वॉल्ट मिलेगा।

`vault.scope: "global"` डिफ़ॉल्ट है और मौजूदा एकल-वॉल्ट
व्यवहार को बनाए रखता है। जब एजेंटों को विकी पृष्ठ, संकलित डाइजेस्ट, खोज परिणाम या लेखन
साझा नहीं करना चाहिए, तब `isolated` या `bridge` मोड के साथ
`vault.scope: "agent"` का उपयोग करें। एजेंट स्कोप को `unsafe-local` मोड के साथ
संयोजित नहीं किया जा सकता, क्योंकि वे कॉन्फ़िगर किए गए निजी पथ एजेंट-स्वामित्व वाले इनपुट
नहीं हैं। कॉन्फ़िगरेशन सत्यापन इस संयोजन को अस्वीकार करता है।

`bridge.*` कॉन्फ़िग टॉगल के अनुसार ब्रिज मोड निम्न को इंडेक्स कर सकता है:

- निर्यातित मेमोरी आर्टिफ़ैक्ट (`indexMemoryRoot`)
- दैनिक नोट्स (`indexDailyNotes`)
- Dreaming रिपोर्ट (`indexDreamReports`)
- मेमोरी इवेंट लॉग (`followMemoryEvents`)

जब ब्रिज मोड सक्रिय हो और `bridge.readMemoryArtifacts` सक्षम हो,
तो `openclaw wiki status`, `openclaw wiki doctor` और `openclaw wiki bridge
import` चालू Gateway के माध्यम से रूट होते हैं, ताकि उन्हें एजेंट/रनटाइम मेमोरी जैसा ही Active Memory
Plugin संदर्भ दिखाई दे। यदि ब्रिज अक्षम है या आर्टिफ़ैक्ट पठन बंद है, तो वे कमांड
स्थानीय/ऑफ़लाइन व्यवहार बनाए रखते हैं।

## वॉल्ट लेआउट

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

प्रबंधित सामग्री जनरेट किए गए ब्लॉक के भीतर रहती है; मानवीय नोट ब्लॉक
पुनर्जनन के दौरान संरक्षित रहते हैं।

- `sources/`: आयातित कच्ची सामग्री और ब्रिज/असुरक्षित-स्थानीय-समर्थित पृष्ठ
- `entities/`: टिकाऊ वस्तुएँ, लोग, सिस्टम, प्रोजेक्ट, ऑब्जेक्ट
- `concepts/`: विचार, अमूर्तन, पैटर्न, नीतियाँ (OKF आयात का गंतव्य भी)
- `syntheses/`: संकलित सारांश और अनुरक्षित रोलअप
- `reports/`: जनरेट किए गए डैशबोर्ड

## Open Knowledge Format आयात

```bash
openclaw wiki okf import ./bundles/ga4
```

एक अनपैक किया गया Open Knowledge Format बंडल विकी अवधारणा पृष्ठों में आयात करें। यह तब
उपयुक्त है जब कोई डेटा कैटलॉग, दस्तावेज़ीकरण क्रॉलर या संवर्धन एजेंट पहले से
OKF बनाता हो: OKF को पोर्टेबल विनिमय आर्टिफ़ैक्ट के रूप में रखें और `memory-wiki`
को उसे OpenClaw-मूल अवधारणा पृष्ठों और संकलित डाइजेस्ट में बदलने दें।

- गैर-आरक्षित `.md` फ़ाइलें अवधारणा दस्तावेज़ हैं
- प्रत्येक आयातित अवधारणा के लिए एक गैर-रिक्त `type` फ्रंटमैटर फ़ील्ड आवश्यक है; अनुपस्थित `type` एक `missing-type` चेतावनी उत्पन्न करता है और फ़ाइल छोड़ दी जाती है
- अज्ञात `type` मान सामान्य अवधारणाओं के रूप में स्वीकार किए जाते हैं
- `index.md` और `log.md` आरक्षित हैं और उन्हें कभी अवधारणाओं के रूप में आयात नहीं किया जाता
- टूटे हुए या बाहरी Markdown लिंक अपरिवर्तित छोड़े जाते हैं

आयातित पृष्ठ `concepts/` के अंतर्गत समतल किए जाते हैं, ताकि मौजूदा संकलन, खोज, प्राप्ति और
डैशबोर्ड प्रवाह उन्हें दूसरी विकी ट्री के बिना देख सकें। प्रत्येक पृष्ठ मूल OKF अवधारणा ID,
स्रोत पथ, `type`, `resource`, `tags`, टाइमस्टैम्प
और पूरा प्रोड्यूसर फ्रंटमैटर बनाए रखता है। आंतरिक OKF लिंक जनरेट किए गए
विकी अवधारणा पृष्ठों पर पुनर्लिखे जाते हैं और `kind: okf-link` के साथ
संरचित `relationships` प्रविष्टियाँ भी उत्सर्जित करते हैं।

## संरचित दावे और साक्ष्य

पृष्ठ केवल मुक्त-रूप पाठ ही नहीं, बल्कि संरचित `claims` फ्रंटमैटर भी रखते हैं। प्रत्येक
दावे में `id`, `text`, `status`, `confidence`, `evidence[]` और
`updatedAt` शामिल हो सकते हैं। प्रत्येक साक्ष्य प्रविष्टि में `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` और `updatedAt` शामिल हो सकते हैं।

इससे विकी निष्क्रिय नोट डंप के बजाय एक विश्वास परत की तरह व्यवहार करता है।
दावों को ट्रैक और स्कोर किया जा सकता है, चुनौती दी जा सकती है और स्रोतों के आधार पर हल किया जा सकता है।

## एजेंट-अभिमुख एंटिटी मेटाडेटा

एंटिटी पृष्ठ लोगों, टीमों, सिस्टम, प्रोजेक्ट या किसी अन्य एंटिटी प्रकार के लिए
उपयोग योग्य सामान्य रूटिंग मेटाडेटा रखते हैं:

- `entityType`: उदाहरण के लिए `person`, `team`, `system`, `project`
- `canonicalId`: उपनामों और आयातों में स्थिर पहचान कुंजी
- `aliases`: नाम, हैंडल या लेबल जो उसी पृष्ठ पर रिज़ॉल्व होते हैं
- `privacyTier`: मुक्त-रूप स्ट्रिंग; `public` को समीक्षा-रहित माना जाता है, अन्य कोई भी मान (उदाहरण के लिए `local-private`, `sensitive`, `confirm-before-use`) `reports/privacy-review.md` में फ़्लैग किया जाता है
- `bestUsedFor` / `notEnoughFor`: संक्षिप्त रूटिंग संकेत
- `lastRefreshedAt`: स्रोत-रीफ़्रेश टाइमस्टैम्प, पृष्ठ संपादन समय से अलग
- `personCard`: वैकल्पिक व्यक्ति-विशिष्ट रूटिंग कार्ड (हैंडल, सोशल, ईमेल, समय क्षेत्र, लेन, किसके लिए पूछें, किसके लिए न पूछें, विश्वसनीयता, गोपनीयता स्तर)
- `relationships`: संबंधित पृष्ठों के लिए टाइप किए गए किनारे (लक्ष्य, प्रकार, भार, विश्वसनीयता, साक्ष्य प्रकार, गोपनीयता स्तर, नोट)

लोगों की विकी के लिए `reports/person-agent-directory.md` से शुरू करें, फिर संपर्क विवरण या अनुमानित
तथ्यों का उपयोग करने से पहले `wiki_get` से व्यक्ति पृष्ठ खोलें।

<Accordion title="एंटिटी पृष्ठ का उदाहरण">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## संकलन पाइपलाइन

संकलन विकी पृष्ठों को पढ़ता है, सारांशों को सामान्यीकृत करता है और निम्न के अंतर्गत
स्थिर मशीन-अभिमुख आर्टिफ़ैक्ट उत्सर्जित करता है:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

एजेंट और रनटाइम कोड Markdown को स्क्रैप करने के बजाय इन डाइजेस्ट को पढ़ते हैं।
संकलित आउटपुट खोज/प्राप्ति के लिए प्रथम-पास विकी इंडेक्सिंग, स्वामित्व वाले पृष्ठों पर
दावा-ID लुकअप, संक्षिप्त प्रॉम्प्ट पूरक और रिपोर्ट जनरेशन को भी संचालित करता है।

## डैशबोर्ड और स्वास्थ्य रिपोर्ट

जब `render.createDashboards` सक्षम हो, तो संकलन `reports/` के अंतर्गत
डैशबोर्ड बनाए रखता है:

| रिपोर्ट                              | ट्रैक करता है                                      |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | अनसुलझे प्रश्नों वाले पृष्ठ                        |
| `reports/contradictions.md`         | विरोधाभासी नोट क्लस्टर                             |
| `reports/low-confidence.md`         | कम-विश्वसनीयता वाले पृष्ठ और दावे                  |
| `reports/claim-health.md`           | संरचित साक्ष्य से रहित दावे                        |
| `reports/stale-pages.md`            | पुराने या अज्ञात नवीनता स्तर                       |
| `reports/person-agent-directory.md` | व्यक्ति/एंटिटी रूटिंग कार्ड                        |
| `reports/relationship-graph.md`     | संरचित संबंध किनारे                                |
| `reports/provenance-coverage.md`    | साक्ष्य वर्ग कवरेज                                  |
| `reports/privacy-review.md`         | गैर-सार्वजनिक गोपनीयता स्तर, जिनकी उपयोग से पहले समीक्षा आवश्यक है |

## खोज और पुनर्प्राप्ति

दो खोज बैकएंड:

- `shared`: उपलब्ध होने पर साझा मेमोरी खोज प्रवाह का उपयोग करें
- `local`: विकी में स्थानीय रूप से खोजें

तीन कॉर्पस: `wiki`, `memory`, `all`।

- `wiki_search` / `wiki_get` जहाँ संभव हो, प्रथम पास के रूप में संकलित डाइजेस्ट का उपयोग करते हैं
- दावा ID वापस स्वामित्व वाले पृष्ठ पर रिज़ॉल्व होते हैं
- विवादित/पुराने/नए दावे रैंकिंग को प्रभावित करते हैं
- उद्गम लेबल परिणामों में बने रहते हैं

खोज मोड (`--mode` / टूल `mode` पैरामीटर):

| मोड               | वरीयता देता है                                                |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | संतुलित डिफ़ॉल्ट                                               |
| `find-person`     | व्यक्ति-जैसी एंटिटी, उपनाम, हैंडल, सोशल, कैनोनिकल ID          |
| `route-question`  | एजेंट कार्ड, किसके लिए पूछें/किसके लिए सर्वोत्तम संकेत, संबंध संदर्भ |
| `source-evidence` | स्रोत पृष्ठ और संरचित साक्ष्य मेटाडेटा                         |
| `raw-claim`       | मेल खाते संरचित दावे; दावा/साक्ष्य मेटाडेटा लौटाता है          |

जब कोई परिणाम किसी संरचित दावे से मेल खाता है, तो `wiki_search` अपने विवरण पेलोड में
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` और `evidenceSourceIds` लौटाता है। उपलब्ध होने पर पाठ आउटपुट में
संक्षिप्त `Claim:` और `Evidence:` पंक्तियाँ शामिल होती हैं।

## एजेंट टूल्स

| टूल          | उद्देश्य                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | वर्तमान वॉल्ट मोड और दायरा, समाधान किया गया एजेंट, स्वास्थ्य, Obsidian CLI की उपलब्धता                                                                               |
| `wiki_search` | विकी पृष्ठों और कॉन्फ़िगर होने पर साझा मेमोरी कॉर्पस में खोज करता है; व्यक्ति खोज, प्रश्न रूटिंग, स्रोत साक्ष्य या मूल दावे की गहन जाँच के लिए `mode` स्वीकार करता है |
| `wiki_get`    | आईडी/पथ से विकी पृष्ठ पढ़ता है; साझा खोज सक्षम होने और लुकअप विफल होने पर साझा मेमोरी कॉर्पस का उपयोग करता है                                     |
| `wiki_apply`  | मुक्त-रूप पृष्ठ संपादन के बिना सीमित संश्लेषण/मेटाडेटा परिवर्तन                                                                                             |
| `wiki_lint`   | संरचनात्मक जाँच, उद्गम संबंधी कमियाँ, विरोधाभास, अनुत्तरित प्रश्न                                                                                            |

Plugin एक गैर-अनन्य मेमोरी कॉर्पस पूरक भी पंजीकृत करता है, इसलिए जब सक्रिय मेमोरी
Plugin कॉर्पस चयन का समर्थन करता है, तब साझा `memory_search` और
`memory_get` विकी तक पहुँच सकते हैं।

## प्रॉम्प्ट और संदर्भ का व्यवहार

जब `context.includeCompiledDigestPrompt` सक्षम होता है, तो मेमोरी प्रॉम्प्ट अनुभाग
`agent-digest.json` से एक संक्षिप्त संकलित स्नैपशॉट जोड़ते हैं: केवल शीर्ष पृष्ठ,
केवल शीर्ष दावे, विरोधाभासों की संख्या, प्रश्नों की संख्या और विश्वास/नवीनता
विशेषक। यह वैकल्पिक है क्योंकि इससे प्रॉम्प्ट का आकार बदलता है; यह मुख्य रूप से
उन संदर्भ इंजनों या प्रॉम्प्ट संयोजनों के लिए महत्वपूर्ण है जो मेमोरी
पूरकों का स्पष्ट रूप से उपयोग करते हैं।

## कॉन्फ़िगरेशन

कॉन्फ़िगरेशन को `plugins.entries.memory-wiki.config` के अंतर्गत रखें:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

मुख्य टॉगल:

| कुंजी                                        | मान / डिफ़ॉल्ट                               | टिप्पणियाँ                                                                         |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (डिफ़ॉल्ट), `bridge`, `unsafe-local` | इनपुट और एकीकरण व्यवहार चुनता है                                        |
| `vault.scope`                              | `global` (डिफ़ॉल्ट), `agent`                    | एक साझा वॉल्ट या प्रत्येक एजेंट के लिए एक चाइल्ड वॉल्ट                                 |
| `vault.path`                               | वैश्विक डिफ़ॉल्ट `~/.openclaw/wiki/main`         | वैश्विक रूप से सटीक वॉल्ट; एजेंट-दायरे का पैरेंट डिफ़ॉल्ट रूप से `~/.openclaw/wiki`       |
| `vault.renderMode`                         | `native` (डिफ़ॉल्ट), `obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | डिफ़ॉल्ट `true`                                 | सक्रिय मेमोरी Plugin की सार्वजनिक कलाकृतियाँ आयात करता है                                  |
| `bridge.followMemoryEvents`                | डिफ़ॉल्ट `true`                                 | ब्रिज मोड में इवेंट लॉग शामिल करता है                                             |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | डिफ़ॉल्ट `false`                                | `unsafe-local` आयात चलाने के लिए आवश्यक                                        |
| `unsafeLocal.paths`                        | डिफ़ॉल्ट `[]`                                   | `unsafe-local` मोड में आयात करने के लिए स्पष्ट स्थानीय पथ                         |
| `search.backend`                           | `shared` (डिफ़ॉल्ट), `local`                    |                                                                               |
| `search.corpus`                            | `wiki` (डिफ़ॉल्ट), `memory`, `all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | डिफ़ॉल्ट `false`                                | चयनित एजेंट का संक्षिप्त डाइजेस्ट स्नैपशॉट मेमोरी प्रॉम्प्ट अनुभागों में जोड़ता है |
| `render.createBacklinks`                   | डिफ़ॉल्ट `true`                                 | नियतात्मक संबंधित ब्लॉक जनरेट करता है                                         |
| `render.createDashboards`                  | डिफ़ॉल्ट `true`                                 | डैशबोर्ड पृष्ठ जनरेट करता है                                                      |

### प्रति-एजेंट वॉल्ट

प्रत्येक कॉन्फ़िगर किए गए एजेंट को अलग विकी देने के लिए `vault.scope` को
`agent` पर सेट करें। इस दायरे में `vault.path` एक पैरेंट
डायरेक्टरी है और OpenClaw सामान्यीकृत एजेंट आईडी जोड़ता है:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

इसका समाधान `~/.openclaw/wiki/support` और
`~/.openclaw/wiki/marketing` के रूप में होता है। यदि एजेंट दायरे में `vault.path`
छोड़ दिया गया है, तो पैरेंट डिफ़ॉल्ट रूप से `~/.openclaw/wiki` होता है। इसलिए
डिफ़ॉल्ट `main` एजेंट मौजूदा `~/.openclaw/wiki/main` पथ बनाए रखता है।

एजेंट टूल, संकलित प्रॉम्प्ट डाइजेस्ट और `memory_search` /
`memory_get` के माध्यम से उपलब्ध कराया गया विकी पूरक सक्रिय एजेंट संदर्भ
से वॉल्ट का समाधान करते हैं। कई कॉन्फ़िगर किए गए एजेंट वाले सेटअप में CLI और
Gateway कॉल के लिए, एजेंट को `openclaw wiki --agent <agentId> ...` या Gateway अनुरोध के
`agentId` के साथ स्पष्ट रूप से प्रदान करें। कोई आईडी प्रदान न किए जाने
पर एकमात्र कॉन्फ़िगर किया गया एजेंट डिफ़ॉल्ट बना रहता है।

ब्रिज मोड में एजेंट-दायरे के आयात किसी सार्वजनिक मेमोरी कलाकृति को केवल तभी
स्वीकार करते हैं, जब उसके `agentIds` में चयनित एजेंट शामिल हो। किसी
अन्य एजेंट के स्वामित्व वाली, स्वामित्व मेटाडेटा रहित या अज्ञात स्वामी वाली
कलाकृतियाँ छोड़ दी जाती हैं। वैश्विक दायरा मौजूदा साझा-कलाकृति व्यवहार बनाए
रखता है।

<Warning>
`vault.scope` बदलने से मौजूदा वॉल्ट की प्रतिलिपि नहीं बनती या वह विभाजित
नहीं होता। एजेंट दायरे में स्पष्ट रूप से कॉन्फ़िगर किया गया
`vault.path` एक पैरेंट डायरेक्टरी बन जाता है, इसलिए उत्पादन एजेंटों को
बदलने से पहले मौजूदा पृष्ठों को सोच-समझकर स्थानांतरित या आयात करें। पहले वॉल्ट
का बैकअप लें।

प्रति-एजेंट वॉल्ट एक ही प्रक्रिया के भीतर ज्ञान सीमा हैं, ऑपरेटिंग-सिस्टम
सुरक्षा सीमा नहीं। होस्ट फ़ाइल सिस्टम तक पहुँच रखने वाले Plugins और
सैंडबॉक्स-रहित टूल अब भी किसी अन्य एजेंट की डायरेक्टरी पढ़ सकते हैं। जब एजेंट
एक-दूसरे पर भरोसा न करते हों, तो [सैंडबॉक्सिंग](/hi/gateway/sandboxing) या
[अलग Gateway प्रोफ़ाइल](/hi/gateway/multiple-gateways) का उपयोग करें।
</Warning>

### उदाहरण: QMD + ब्रिज मोड

इसे तब उपयोग करें जब आप पुनःस्मरण के लिए QMD और अनुरक्षित ज्ञान परत के लिए
`memory-wiki` चाहते हों। प्रत्येक परत केंद्रित रहती है: QMD कच्चे नोट्स,
सत्र निर्यात और अतिरिक्त संग्रहों को खोजने योग्य रखता है, जबकि
`memory-wiki` स्थिर निकायों, दावों, डैशबोर्ड और स्रोत पृष्ठों को संकलित
करता है।

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

यह QMD को सक्रिय मेमोरी पुनःस्मरण का प्रभारी, `memory-wiki` को संकलित
पृष्ठों और डैशबोर्ड पर केंद्रित और प्रॉम्प्ट का आकार तब तक अपरिवर्तित रखता है,
जब तक आप जानबूझकर संकलित डाइजेस्ट प्रॉम्प्ट सक्षम नहीं करते।

## CLI

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

संपूर्ण कमांड संदर्भ के लिए [CLI: विकी](/hi/cli/wiki) देखें, जिसमें
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` और पूरा `wiki obsidian`
उप-कमांड समूह शामिल है।

## Obsidian समर्थन

जब `vault.renderMode`, `obsidian` होता है, तो Plugin
Obsidian-अनुकूल Markdown लिखता है और स्थिति जाँचने, वॉल्ट खोजने, पृष्ठ खोलने,
कमांड चलाने तथा दैनिक नोट पर जाने के लिए वैकल्पिक रूप से आधिकारिक
`obsidian` CLI का उपयोग कर सकता है। यह वैकल्पिक है; Obsidian के बिना भी
विकी नेटिव मोड में काम करता है।

एजेंट-दायरे के वॉल्ट अब भी Obsidian-अनुकूल Markdown का उपयोग कर सकते हैं, लेकिन
कॉन्फ़िगरेशन सत्यापन `obsidian.useOfficialCli: true` को `vault.scope: "agent"` के साथ अस्वीकार
करता है। वर्तमान `obsidian.vaultName` सेटिंग वैश्विक है और प्रत्येक एजेंट के लिए
अलग Obsidian वॉल्ट नहीं चुन सकती। इसके बजाय विकी टूल और CLI संचालन का उपयोग
करें, या Obsidian द्वारा संचालित विकी को वैश्विक दायरे में रखें।

## अनुशंसित कार्यप्रवाह

<Steps>
<Step title="पुनःस्मरण के लिए सक्रिय मेमोरी Plugin बनाए रखें">
पुनःस्मरण, उन्नयन और Dreaming का स्वामित्व कॉन्फ़िगर किए गए मेमोरी बैकएंड के पास रहता है।
</Step>
<Step title="memory-wiki सक्षम करें">
जब तक आप स्पष्ट रूप से ब्रिज मोड नहीं चाहते, `isolated` मोड से शुरू करें।
</Step>
<Step title="उद्गम महत्वपूर्ण होने पर wiki_search / wiki_get का उपयोग करें">
जब आप विकी-विशिष्ट रैंकिंग या पृष्ठ-स्तरीय विश्वास संरचना चाहते हैं, तब `memory_search` के बजाय इन्हें प्राथमिकता दें।
</Step>
<Step title="सीमित संश्लेषण या मेटाडेटा अपडेट के लिए wiki_apply का उपयोग करें">
प्रबंधित जनरेट किए गए ब्लॉक को हाथ से संपादित करने से बचें।
</Step>
<Step title="महत्वपूर्ण परिवर्तनों के बाद wiki_lint चलाएँ">
विरोधाभासों, अनुत्तरित प्रश्नों और उद्गम संबंधी कमियों का पता लगाता है।
</Step>
<Step title="पुरानी जानकारी/विरोधाभासों की दृश्यता के लिए डैशबोर्ड चालू करें">
`render.createDashboards: true` (डिफ़ॉल्ट) सेट करें।
</Step>
</Steps>

## संबंधित दस्तावेज़

- [मेमोरी का अवलोकन](/hi/concepts/memory)
- [CLI: मेमोरी](/hi/cli/memory)
- [CLI: विकी](/hi/cli/wiki)
- [Plugin SDK का अवलोकन](/hi/plugins/sdk-overview)
