---
read_when:
    - आप चाहते हैं कि मेमोरी प्रमोशन स्वचालित रूप से चले
    - आप समझना चाहते हैं कि प्रत्येक Dreaming चरण क्या करता है
    - आप MEMORY.md को प्रदूषित किए बिना समेकन को ट्यून करना चाहते हैं
sidebarTitle: Dreaming
summary: हल्के, गहरे और REM चरणों के साथ पृष्ठभूमि मेमोरी समेकन और एक Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:04:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming `memory-core` में पृष्ठभूमि मेमोरी समेकन प्रणाली है। यह OpenClaw को मजबूत अल्पकालिक संकेतों को टिकाऊ मेमोरी में ले जाने में मदद करता है, जबकि प्रक्रिया को व्याख्यायोग्य और समीक्षा योग्य बनाए रखता है।

<Note>
Dreaming **ऑप्ट-इन** है और डिफ़ॉल्ट रूप से अक्षम रहता है।
</Note>

## Dreaming क्या लिखता है

Dreaming दो तरह के आउटपुट रखता है:

- `memory/.dreams/` में **मशीन स्थिति** (रिकॉल स्टोर, चरण संकेत, इनजेशन चेकपॉइंट, लॉक)।
- `DREAMS.md` (या मौजूदा `dreams.md`) में **मानव-पठनीय आउटपुट** और `memory/dreaming/<phase>/YYYY-MM-DD.md` के अंतर्गत वैकल्पिक चरण रिपोर्ट फ़ाइलें।

दीर्घकालिक प्रमोशन अब भी केवल `MEMORY.md` में लिखता है।

## चरण मॉडल

Dreaming तीन सहयोगी चरणों का उपयोग करता है:

| चरण | उद्देश्य                                   | टिकाऊ लेखन     |
| ----- | ----------------------------------------- | ----------------- |
| हल्का | हाल की अल्पकालिक सामग्री को छांटना और स्टेज करना | नहीं                |
| गहरा  | टिकाऊ उम्मीदवारों को स्कोर और प्रमोट करना      | हां (`MEMORY.md`) |
| REM   | थीम और दोहराए जाने वाले विचारों पर चिंतन करना     | नहीं                |

ये चरण आंतरिक कार्यान्वयन विवरण हैं, अलग उपयोगकर्ता-कॉन्फ़िगर किए गए "मोड" नहीं।

<AccordionGroup>
  <Accordion title="हल्का चरण">
    हल्का चरण हाल के दैनिक मेमोरी संकेतों और रिकॉल ट्रेस को इनजेस्ट करता है, उनका डीडुप करता है, और उम्मीदवार पंक्तियों को स्टेज करता है।

    - उपलब्ध होने पर अल्पकालिक रिकॉल स्थिति, हाल की दैनिक मेमोरी फ़ाइलों, और रिडैक्ट किए गए सेशन ट्रांसक्रिप्ट से पढ़ता है।
    - जब स्टोरेज में इनलाइन आउटपुट शामिल हो, तो एक प्रबंधित `## Light Sleep` ब्लॉक लिखता है।
    - बाद की गहरी रैंकिंग के लिए सुदृढ़ीकरण संकेत रिकॉर्ड करता है।
    - `MEMORY.md` में कभी नहीं लिखता।

  </Accordion>
  <Accordion title="गहरा चरण">
    गहरा चरण तय करता है कि दीर्घकालिक मेमोरी क्या बनेगा।

    - भारित स्कोरिंग और थ्रेशोल्ड गेट का उपयोग करके उम्मीदवारों को रैंक करता है।
    - पास होने के लिए `minScore`, `minRecallCount`, और `minUniqueQueries` की आवश्यकता होती है।
    - लिखने से पहले लाइव दैनिक फ़ाइलों से स्निपेट फिर से हाइड्रेट करता है, इसलिए पुराने/हटाए गए स्निपेट छोड़ दिए जाते हैं।
    - प्रमोट की गई प्रविष्टियां `MEMORY.md` में जोड़ता है।
    - `DREAMS.md` में `## Deep Sleep` सारांश लिखता है और वैकल्पिक रूप से `memory/dreaming/deep/YYYY-MM-DD.md` लिखता है।

  </Accordion>
  <Accordion title="REM चरण">
    REM चरण पैटर्न और चिंतनशील संकेत निकालता है।

    - हाल के अल्पकालिक ट्रेस से थीम और चिंतन सारांश बनाता है।
    - जब स्टोरेज में इनलाइन आउटपुट शामिल हो, तो एक प्रबंधित `## REM Sleep` ब्लॉक लिखता है।
    - गहरी रैंकिंग द्वारा उपयोग किए जाने वाले REM सुदृढ़ीकरण संकेत रिकॉर्ड करता है।
    - `MEMORY.md` में कभी नहीं लिखता।

  </Accordion>
</AccordionGroup>

## सेशन ट्रांसक्रिप्ट इनजेशन

Dreaming रिडैक्ट किए गए सेशन ट्रांसक्रिप्ट को Dreaming कॉर्पस में इनजेस्ट कर सकता है। जब ट्रांसक्रिप्ट उपलब्ध होते हैं, तो उन्हें दैनिक मेमोरी संकेतों और रिकॉल ट्रेस के साथ हल्के चरण में भेजा जाता है। व्यक्तिगत और संवेदनशील सामग्री इनजेशन से पहले रिडैक्ट की जाती है।

## स्वप्न डायरी

Dreaming `DREAMS.md` में एक कथात्मक **स्वप्न डायरी** भी रखता है। प्रत्येक चरण में पर्याप्त सामग्री होने के बाद, `memory-core` एक best-effort पृष्ठभूमि subagent टर्न चलाता है और एक छोटी डायरी प्रविष्टि जोड़ता है। जब तक `dreaming.model` कॉन्फ़िगर न हो, यह डिफ़ॉल्ट रनटाइम मॉडल का उपयोग करता है। यदि कॉन्फ़िगर किया गया मॉडल उपलब्ध नहीं है, तो स्वप्न डायरी सेशन के डिफ़ॉल्ट मॉडल के साथ एक बार फिर प्रयास करती है।

<Note>
यह डायरी Dreams UI में मानव पढ़ने के लिए है, प्रमोशन स्रोत नहीं। Dreaming-जनित डायरी/रिपोर्ट आर्टिफैक्ट अल्पकालिक प्रमोशन से बाहर रखे जाते हैं। केवल grounded मेमोरी स्निपेट `MEMORY.md` में प्रमोट होने के योग्य हैं।
</Note>

समीक्षा और रिकवरी कार्य के लिए एक grounded ऐतिहासिक backfill lane भी है:

<AccordionGroup>
  <Accordion title="Backfill कमांड">
    - `memory rem-harness --path ... --grounded` ऐतिहासिक `YYYY-MM-DD.md` नोट से grounded डायरी आउटपुट का पूर्वावलोकन करता है।
    - `memory rem-backfill --path ...` `DREAMS.md` में reversible grounded डायरी प्रविष्टियां लिखता है।
    - `memory rem-backfill --path ... --stage-short-term` grounded टिकाऊ उम्मीदवारों को उसी अल्पकालिक evidence store में स्टेज करता है जिसे सामान्य गहरा चरण पहले से उपयोग करता है।
    - `memory rem-backfill --rollback` और `--rollback-short-term` साधारण डायरी प्रविष्टियों या लाइव अल्पकालिक रिकॉल को छुए बिना उन स्टेज किए गए backfill आर्टिफैक्ट को हटाते हैं।

  </Accordion>
</AccordionGroup>

Control UI वही डायरी backfill/reset प्रवाह दिखाता है ताकि आप यह तय करने से पहले कि grounded उम्मीदवार प्रमोशन के योग्य हैं या नहीं, Dreams दृश्य में परिणामों की जांच कर सकें। Scene एक अलग grounded lane भी दिखाता है ताकि आप देख सकें कि कौन-सी स्टेज की गई अल्पकालिक प्रविष्टियां ऐतिहासिक replay से आईं, कौन-से promoted items grounded-led थे, और साधारण लाइव अल्पकालिक स्थिति को छुए बिना केवल grounded-only स्टेज की गई प्रविष्टियां साफ़ कर सकें।

## गहरे रैंकिंग संकेत

गहरी रैंकिंग छह भारित आधार संकेतों और चरण सुदृढ़ीकरण का उपयोग करती है:

| संकेत              | भार | विवरण                                       |
| ------------------- | ------ | ------------------------------------------------- |
| आवृत्ति           | 0.24   | प्रविष्टि ने कितने अल्पकालिक संकेत जमा किए |
| प्रासंगिकता           | 0.30   | प्रविष्टि के लिए औसत retrieval गुणवत्ता           |
| क्वेरी विविधता     | 0.15   | अलग-अलग क्वेरी/दिन संदर्भ जिन्होंने इसे सामने लाया      |
| हालियापन             | 0.15   | समय-क्षयित freshness स्कोर                      |
| समेकन       | 0.10   | बहु-दिवसीय recurrence मजबूती                     |
| वैचारिक समृद्धि | 0.06   | स्निपेट/पथ से concept-tag घनत्व             |

हल्के और REM चरण के hits `memory/.dreams/phase-signals.json` से एक छोटा recency-decayed boost जोड़ते हैं।

Shadow-trial परिणामों को किसी भी टिकाऊ लेखन से पहले समीक्षा संकेत के रूप में उस आधार स्कोर के ऊपर लेयर किया जा सकता है। सहायक trial उम्मीदवार को एक छोटा सीमित boost देता है, neutral trial उसे deferred रखता है, और harmful trial उसे उस scoring pass के लिए rejected के रूप में चिह्नित करता है। यह संकेत अब भी केवल report-only है: यह उम्मीदवार क्रम या समीक्षा metadata बदल सकता है, लेकिन यह `MEMORY.md` में नहीं लिखता या उम्मीदवार को स्वयं promote नहीं करता।

## QA shadow trial रिपोर्ट कवरेज

QA Lab में यह पता लगाने के लिए report-only scenario शामिल है कि भविष्य का Dreaming shadow trial प्रमोशन से पहले किसी candidate memory की समीक्षा कैसे कर सकता है। scenario किसी agent से baseline answer की तुलना ऐसे answer से करने को कहता है जो candidate memory का उपयोग कर सकता है, फिर verdict, reason, और risk flags के साथ local report लिखने को कहता है।

यह कवरेज जानबूझकर QA तक सीमित है। यह सत्यापित करता है कि report artifact `MEMORY.md` से अलग रहता है और agent यह दावा नहीं करता कि candidate promote हुआ था। यह production shadow-trial behavior नहीं जोड़ता या deep-phase promotion engine नहीं बदलता।

`memory-core` shadow-trial runner उन code paths के लिए वही report-only contract रखता है जिन्हें stable artifact चाहिए। यह candidate, trial prompt, baseline outcome, candidate outcome, verdict, reason, risk flags, और evidence references स्वीकार करता है, फिर `promotion action: report-only` के साथ report लिखता है। helpful verdicts `promote` recommendation में map होते हैं, neutral verdicts `defer` में map होते हैं, और harmful verdicts `reject` में map होते हैं; इनमें से कोई भी recommendation `MEMORY.md` में नहीं लिखती या deep-phase promotion लागू नहीं करती।

## शेड्यूलिंग

सक्षम होने पर, `memory-core` पूरे Dreaming sweep के लिए एक cron job को auto-manage करता है। प्रत्येक sweep चरणों को क्रम में चलाता है: हल्का → REM → गहरा।

sweep में primary runtime workspace और कोई भी configured agent workspaces शामिल होते हैं, जिन्हें path के आधार पर dedupe किया जाता है, ताकि subagent workspace fan-out मुख्य agent के `DREAMS.md` और memory state को exclude न करे।

डिफ़ॉल्ट cadence behavior:

| सेटिंग              | डिफ़ॉल्ट       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | डिफ़ॉल्ट मॉडल |

## त्वरित शुरुआत

<Tabs>
  <Tab title="Dreaming सक्षम करें">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="कस्टम sweep cadence">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Slash command

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` और `/dreaming off` gateway-wide configuration बदलते हैं। Channel callers को owners होना चाहिए, और Gateway clients के पास `operator.admin` होना चाहिए। `/dreaming status` और `/dreaming help` read-only रहते हैं।

## CLI workflow

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manual `memory promote` डिफ़ॉल्ट रूप से deep-phase thresholds का उपयोग करता है, जब तक CLI flags से override न किया गया हो।

  </Tab>
  <Tab title="Promotion समझाएं">
    समझाएं कि कोई विशिष्ट candidate promote क्यों होगा या नहीं होगा:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    कुछ भी लिखे बिना REM reflections, candidate truths, और deep promotion output का preview करें:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## मुख्य डिफ़ॉल्ट

सभी settings `plugins.entries.memory-core.config.dreaming` के अंतर्गत रहती हैं।

<ParamField path="enabled" type="boolean" default="false">
  Dreaming sweep को सक्षम या अक्षम करें।
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  पूरे Dreaming sweep के लिए Cron cadence।
</ParamField>
<ParamField path="model" type="string">
  वैकल्पिक स्वप्न डायरी subagent model override। subagent `allowedModels` allowlist भी सेट करते समय canonical `provider/model` value का उपयोग करें।
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` में promote किए गए प्रत्येक short-term recall snippet से रखा जाने वाला maximum estimated token count। Ranking provenance visible रहती है।
</ParamField>

<Warning>
`dreaming.model` के लिए `plugins.entries.memory-core.subagent.allowModelOverride: true` आवश्यक है। इसे सीमित करने के लिए, `plugins.entries.memory-core.subagent.allowedModels` भी सेट करें। Trust या allowlist failures silently fallback होने के बजाय visible रहते हैं; retry केवल model-unavailable errors को cover करता है।
</Warning>

<Note>
अधिकांश phase policy, thresholds, और storage behavior internal implementation details हैं। पूरी key list के लिए [Memory configuration reference](/hi/reference/memory-config#dreaming) देखें।
</Note>

## Dreams UI

सक्षम होने पर, Gateway **Dreams** tab दिखाता है:

- वर्तमान Dreaming enabled state
- phase-level status और managed-sweep presence
- short-term, grounded, signal, और promoted-today counts
- अगले scheduled run का timing
- staged historical replay entries के लिए अलग grounded Scene lane
- `doctor.memory.dreamDiary` द्वारा backed expandable स्वप्न डायरी reader

## Dreaming कभी नहीं चलता: status blocked दिखाता है

यदि `openclaw memory status` `Dreaming status: blocked` report करता है, तो managed cron मौजूद है लेकिन default agent heartbeat fire नहीं हो रहा है। जांचें कि default agent के लिए heartbeat enabled है और उसका target `none` नहीं है, फिर अगले heartbeat interval के बाद `openclaw memory status --deep` फिर चलाएं।

## संबंधित

- [Memory](/hi/concepts/memory)
- [Memory CLI](/hi/cli/memory)
- [Memory configuration reference](/hi/reference/memory-config)
- [Memory search](/hi/concepts/memory-search)
