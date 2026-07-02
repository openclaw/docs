---
read_when:
    - आप समझना चाहते हैं कि Task Flow पृष्ठभूमि कार्यों से कैसे संबंधित है
    - आपको रिलीज़ नोट्स या दस्तावेज़ों में Task Flow या openclaw tasks flow मिलता है
    - आप स्थायी फ़्लो स्थिति का निरीक्षण या प्रबंधन करना चाहते हैं
summary: Task Flow ऑर्केस्ट्रेशन परत, पृष्ठभूमि कार्यों के ऊपर
title: कार्य प्रवाह
x-i18n:
    generated_at: "2026-07-02T00:55:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow वह फ्लो ऑर्केस्ट्रेशन सब्सट्रेट है जो [बैकग्राउंड टास्क](/hi/automation/tasks) के ऊपर स्थित होता है। यह अपनी अलग स्थिति, रिविज़न ट्रैकिंग, और सिंक सिमेंटिक्स वाले टिकाऊ मल्टी-स्टेप फ्लो प्रबंधित करता है, जबकि अलग-अलग टास्क detached work की इकाई बने रहते हैं।

## Task Flow कब उपयोग करें

Task Flow का उपयोग तब करें जब काम कई क्रमिक या शाखाबद्ध चरणों में फैला हो और आपको gateway रीस्टार्ट के पार टिकाऊ प्रगति ट्रैकिंग चाहिए। एकल बैकग्राउंड ऑपरेशन के लिए, एक साधारण [टास्क](/hi/automation/tasks) पर्याप्त है।

| परिदृश्य                              | उपयोग                  |
| ------------------------------------- | -------------------- |
| एकल बैकग्राउंड जॉब                 | साधारण टास्क           |
| मल्टी-स्टेप पाइपलाइन (A फिर B फिर C) | Task Flow (प्रबंधित)  |
| बाहरी रूप से बनाए गए टास्क देखें      | Task Flow (मिरर्ड) |
| वन-शॉट रिमाइंडर                     | Cron जॉब             |

## भरोसेमंद शेड्यूल्ड वर्कफ़्लो पैटर्न

मार्केट इंटेलिजेंस ब्रीफिंग जैसे आवर्ती वर्कफ़्लो के लिए, शेड्यूल, ऑर्केस्ट्रेशन, और भरोसेमंदता जांचों को अलग-अलग परतों की तरह मानें:

1. टाइमिंग के लिए [Scheduled Tasks](/hi/automation/cron-jobs) का उपयोग करें।
2. पिछला संदर्भ वर्कफ़्लो की अपनी फ़ाइलों, डेटाबेस, या टूल स्थिति में स्टोर करें।
3. निर्धारक चरणों, अनुमोदन गेट, और रिज़्यूम टोकन के लिए [Lobster](/hi/tools/lobster) का उपयोग करें।
4. चाइल्ड टास्क, प्रतीक्षाओं, रीट्राई, और gateway रीस्टार्ट के पार मल्टी-स्टेप रन ट्रैक करने के लिए Task Flow का उपयोग करें।

उदाहरण Cron आकार:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

जब जॉब को डिलीवरी संदर्भ या सुरक्षित प्रेफरेंस सीडिंग के लिए किसी ज्ञात चैट/सेशन को लक्षित करना हो, तो `session:<id>` का उपयोग करें। Cron फिर भी हर रन को detached session में निष्पादित करता है, इसलिए पिछले रन के सारांश और स्थायी वर्कफ़्लो स्थिति को स्पष्ट स्टोरेज में रखें जिसे जॉब पढ़ सके।

वर्कफ़्लो के भीतर, LLM सारांश चरण से पहले भरोसेमंदता जांचें रखें:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

अनुशंसित प्रीफ़्लाइट जांचें:

- Browser उपलब्धता और प्रोफ़ाइल चयन, उदाहरण के लिए प्रबंधित स्थिति के लिए `openclaw` या जब साइन-इन Chrome सेशन आवश्यक हो तो `user`। [Browser](/hi/tools/browser) देखें।
- प्रत्येक स्रोत के लिए API क्रेडेंशियल और कोटा।
- आवश्यक endpoints के लिए नेटवर्क पहुंच।
- एजेंट के लिए सक्षम आवश्यक टूल, जैसे `lobster`, `browser`, और `llm-task`।
- Cron के लिए कॉन्फ़िगर किया गया विफलता गंतव्य ताकि प्रीफ़्लाइट विफलताएं दिखाई दें। [Scheduled Tasks](/hi/automation/cron-jobs#delivery-and-output) देखें।

हर एकत्रित आइटम के लिए अनुशंसित डेटा प्रोवेनेंस फ़ील्ड:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

सारांशीकरण से पहले वर्कफ़्लो से पुराने आइटम अस्वीकार या stale के रूप में चिह्नित करवाएं। LLM चरण को केवल संरचित JSON मिलना चाहिए और उससे अपने आउटपुट में `sourceUrl`, `retrievedAt`, और `asOf` बनाए रखने के लिए कहा जाना चाहिए। जब आपको वर्कफ़्लो के अंदर schema-validated मॉडल चरण चाहिए, तो [LLM Task](/hi/tools/llm-task) का उपयोग करें।

पुन: उपयोग योग्य टीम या समुदाय वर्कफ़्लो के लिए, CLI, `.lobster` फ़ाइलें, और कोई भी सेटअप नोट्स skill या plugin के रूप में पैकेज करें और उसे [ClawHub](/clawhub) के माध्यम से प्रकाशित करें। वर्कफ़्लो-विशिष्ट guardrails को उसी पैकेज में रखें, जब तक कि plugin API में कोई आवश्यक generic capability न हो।

## सिंक मोड

### प्रबंधित मोड

Task Flow पूरे जीवनचक्र का स्वामी होता है। यह फ्लो चरणों के रूप में टास्क बनाता है, उन्हें पूर्णता तक चलाता है, और फ्लो स्थिति को अपने-आप आगे बढ़ाता है।

उदाहरण: एक साप्ताहिक रिपोर्ट फ्लो जो (1) डेटा एकत्र करता है, (2) रिपोर्ट जनरेट करता है, और (3) उसे डिलीवर करता है। Task Flow हर चरण को बैकग्राउंड टास्क के रूप में बनाता है, पूर्णता की प्रतीक्षा करता है, फिर अगले चरण पर जाता है।

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### मिरर्ड मोड

Task Flow बाहरी रूप से बनाए गए टास्क देखता है और टास्क निर्माण का स्वामित्व लिए बिना फ्लो स्थिति को सिंक में रखता है। यह तब उपयोगी है जब टास्क Cron जॉब, CLI कमांड, या अन्य स्रोतों से उत्पन्न होते हैं और आप उनकी प्रगति का एकीकृत दृश्य फ्लो के रूप में चाहते हैं।

उदाहरण: तीन स्वतंत्र Cron जॉब जो मिलकर "morning ops" रूटीन बनाते हैं। एक मिरर्ड फ्लो उनकी सामूहिक प्रगति ट्रैक करता है, यह नियंत्रित किए बिना कि वे कब या कैसे चलते हैं।

## टिकाऊ स्थिति और रिविज़न ट्रैकिंग

हर फ्लो अपनी स्थिति persist करता है और रिविज़न ट्रैक करता है ताकि gateway रीस्टार्ट के बाद भी प्रगति बची रहे। रिविज़न ट्रैकिंग तब conflict detection सक्षम करती है जब कई स्रोत एक ही फ्लो को साथ-साथ आगे बढ़ाने का प्रयास करते हैं।
फ्लो registry सीमित write-ahead-log रखरखाव के साथ SQLite का उपयोग करती है, जिसमें
periodic और shutdown checkpoints शामिल हैं, ताकि लंबे समय तक चलने वाले gateways
असीमित `registry.sqlite-wal` sidecar फ़ाइलें बनाए न रखें।

## कैंसल व्यवहार

`openclaw tasks flow cancel` फ्लो पर sticky cancel intent सेट करता है। फ्लो के भीतर सक्रिय टास्क कैंसल किए जाते हैं, और कोई नए चरण शुरू नहीं किए जाते। cancel intent रीस्टार्ट के पार persist रहता है, इसलिए कैंसल किया गया फ्लो कैंसल ही रहता है, भले ही सभी चाइल्ड टास्क समाप्त होने से पहले gateway रीस्टार्ट हो जाए।

## CLI कमांड

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| कमांड                           | विवरण                                   |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | स्थिति और सिंक मोड के साथ ट्रैक किए गए फ्लो दिखाता है |
| `openclaw tasks flow show <id>`   | फ्लो id या lookup key से एक फ्लो की जांच करें     |
| `openclaw tasks flow cancel <id>` | चल रहे फ्लो और उसके सक्रिय टास्क कैंसल करें    |

## फ्लो टास्क से कैसे संबंधित हैं

फ्लो टास्क को समन्वित करते हैं, उन्हें प्रतिस्थापित नहीं करते। एक ही फ्लो अपने जीवनकाल में कई बैकग्राउंड टास्क चला सकता है। अलग-अलग टास्क रिकॉर्ड की जांच के लिए `openclaw tasks` और ऑर्केस्ट्रेटिंग फ्लो की जांच के लिए `openclaw tasks flow` का उपयोग करें।

## संबंधित

- [Background Tasks](/hi/automation/tasks) — detached work ledger जिसे फ्लो समन्वित करते हैं
- [CLI: tasks](/hi/cli/tasks) — `openclaw tasks flow` के लिए CLI कमांड संदर्भ
- [Automation Overview](/hi/automation) — सभी ऑटोमेशन मैकेनिज़्म एक नजर में
- [Cron Jobs](/hi/automation/cron-jobs) — शेड्यूल्ड जॉब जो फ्लो में फ़ीड हो सकते हैं
