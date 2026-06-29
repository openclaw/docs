---
read_when:
    - आप समझना चाहते हैं कि TaskFlow पृष्ठभूमि कार्यों से कैसे संबंधित है
    - आपको रिलीज़ नोट्स या दस्तावेज़ों में Task Flow या openclaw tasks flow दिखाई देता है
    - आप स्थायी प्रवाह स्थिति का निरीक्षण या प्रबंधन करना चाहते हैं
summary: Task Flow ऑर्केस्ट्रेशन परत, बैकग्राउंड कार्यों के ऊपर
title: कार्य प्रवाह
x-i18n:
    generated_at: "2026-06-28T22:33:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow वह फ़्लो ऑर्केस्ट्रेशन सब्सट्रेट है जो [बैकग्राउंड टास्क](/hi/automation/tasks) के ऊपर स्थित होता है। यह अपनी स्टेट, रिविज़न ट्रैकिंग और सिंक सेमांटिक्स वाले टिकाऊ मल्टी-स्टेप फ़्लो प्रबंधित करता है, जबकि अलग-अलग टास्क अलग किए गए काम की इकाई बने रहते हैं।

## Task Flow कब उपयोग करें

Task Flow का उपयोग तब करें जब काम कई क्रमिक या शाखायुक्त चरणों में फैला हो और आपको gateway रीस्टार्ट के पार टिकाऊ प्रगति ट्रैकिंग चाहिए। एकल बैकग्राउंड ऑपरेशन के लिए, साधारण [टास्क](/hi/automation/tasks) पर्याप्त है।

| परिदृश्य                              | उपयोग                  |
| ------------------------------------- | -------------------- |
| एकल बैकग्राउंड जॉब                 | साधारण टास्क           |
| मल्टी-स्टेप पाइपलाइन (A फिर B फिर C) | Task Flow (प्रबंधित)  |
| बाहरी रूप से बनाए गए टास्क देखें      | Task Flow (मिरर किया गया) |
| वन-शॉट रिमाइंडर                     | Cron जॉब             |

## भरोसेमंद शेड्यूल्ड वर्कफ़्लो पैटर्न

मार्केट इंटेलिजेंस ब्रीफिंग जैसे आवर्ती वर्कफ़्लो के लिए, शेड्यूल, ऑर्केस्ट्रेशन और विश्वसनीयता जांचों को अलग-अलग लेयर मानें:

1. टाइमिंग के लिए [शेड्यूल्ड टास्क](/hi/automation/cron-jobs) का उपयोग करें।
2. जब वर्कफ़्लो को पिछले संदर्भ पर बनना चाहिए, तब स्थायी cron सेशन का उपयोग करें।
3. निर्धारक चरणों, अप्रूवल गेट और रिज़्यूम टोकन के लिए [Lobster](/hi/tools/lobster) का उपयोग करें।
4. चाइल्ड टास्क, प्रतीक्षा, रीट्राई और gateway रीस्टार्ट के पार मल्टी-स्टेप रन ट्रैक करने के लिए Task Flow का उपयोग करें।

उदाहरण cron आकार:

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

जब आवर्ती वर्कफ़्लो को जानबूझकर हिस्ट्री, पिछले रन के सारांश या स्थायी संदर्भ की ज़रूरत हो, तब `isolated` के बजाय `session:<id>` का उपयोग करें। जब हर रन नए सिरे से शुरू होना चाहिए और सभी आवश्यक स्टेट वर्कफ़्लो में स्पष्ट हो, तब `isolated` का उपयोग करें।

वर्कफ़्लो के अंदर, LLM सारांश चरण से पहले विश्वसनीयता जांचें रखें:

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

अनुशंसित प्रीफ्लाइट जांचें:

- ब्राउज़र उपलब्धता और प्रोफ़ाइल चयन, उदाहरण के लिए प्रबंधित स्टेट के लिए `openclaw` या जब साइन-इन Chrome सेशन आवश्यक हो तब `user`। [ब्राउज़र](/hi/tools/browser) देखें।
- प्रत्येक स्रोत के लिए API क्रेडेंशियल और कोटा।
- आवश्यक एंडपॉइंट के लिए नेटवर्क पहुंच।
- एजेंट के लिए सक्षम आवश्यक टूल, जैसे `lobster`, `browser`, और `llm-task`।
- cron के लिए कॉन्फ़िगर किया गया विफलता गंतव्य ताकि प्रीफ्लाइट विफलताएं दिखाई दें। [शेड्यूल्ड टास्क](/hi/automation/cron-jobs#delivery-and-output) देखें।

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

सारांश से पहले वर्कफ़्लो से पुराने आइटम अस्वीकार या stale के रूप में चिह्नित करवाएं। LLM चरण को केवल स्ट्रक्चर्ड JSON मिलना चाहिए और उससे अपने आउटपुट में `sourceUrl`, `retrievedAt`, और `asOf` सुरक्षित रखने को कहा जाना चाहिए। जब आपको वर्कफ़्लो के अंदर schema-validated मॉडल चरण चाहिए, तब [LLM Task](/hi/tools/llm-task) का उपयोग करें।

रीयूज़ करने योग्य टीम या कम्युनिटी वर्कफ़्लो के लिए, CLI, `.lobster` फ़ाइलें और कोई भी सेटअप नोट्स किसी skill या plugin के रूप में पैकेज करें और उसे [ClawHub](/hi/clawhub) के माध्यम से प्रकाशित करें। वर्कफ़्लो-विशिष्ट गार्डरेल उसी पैकेज में रखें, जब तक कि plugin API में कोई आवश्यक सामान्य क्षमता न हो।

## सिंक मोड

### प्रबंधित मोड

Task Flow lifecycle को शुरू से अंत तक own करता है। यह फ़्लो चरणों के रूप में टास्क बनाता है, उन्हें completion तक चलाता है और फ़्लो स्टेट को अपने आप आगे बढ़ाता है।

उदाहरण: एक साप्ताहिक रिपोर्ट फ़्लो जो (1) डेटा इकट्ठा करता है, (2) रिपोर्ट जनरेट करता है, और (3) उसे डिलीवर करता है। Task Flow हर चरण को बैकग्राउंड टास्क के रूप में बनाता है, completion की प्रतीक्षा करता है, फिर अगले चरण पर जाता है।

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### मिरर किया गया मोड

Task Flow बाहरी रूप से बनाए गए टास्क देखता है और टास्क निर्माण का स्वामित्व लिए बिना फ़्लो स्टेट को सिंक में रखता है। यह तब उपयोगी है जब टास्क cron जॉब, CLI कमांड या अन्य स्रोतों से आते हैं और आप उनकी प्रगति को फ़्लो के रूप में एकीकृत दृश्य में देखना चाहते हैं।

उदाहरण: तीन स्वतंत्र cron जॉब जो मिलकर "मॉर्निंग ऑप्स" रूटीन बनाते हैं। मिरर किया गया फ़्लो यह नियंत्रित किए बिना उनकी सामूहिक प्रगति ट्रैक करता है कि वे कब या कैसे चलते हैं।

## टिकाऊ स्टेट और रिविज़न ट्रैकिंग

हर फ़्लो अपनी स्टेट बनाए रखता है और रिविज़न ट्रैक करता है ताकि gateway रीस्टार्ट के बाद भी प्रगति बनी रहे। जब कई स्रोत एक ही फ़्लो को साथ-साथ आगे बढ़ाने का प्रयास करते हैं, तब रिविज़न ट्रैकिंग conflict detection सक्षम करती है।
फ़्लो रजिस्ट्री SQLite का उपयोग bounded write-ahead-log maintenance के साथ करती है, जिसमें
periodic और shutdown checkpoints शामिल हैं, ताकि लंबे समय तक चलने वाले gateways
अनबाउंड `registry.sqlite-wal` sidecar फ़ाइलें न रखें।

## कैंसल व्यवहार

`openclaw tasks flow cancel` फ़्लो पर sticky cancel intent सेट करता है। फ़्लो के भीतर सक्रिय टास्क कैंसल किए जाते हैं, और कोई नया चरण शुरू नहीं होता। cancel intent रीस्टार्ट के पार बना रहता है, इसलिए कैंसल किया गया फ़्लो कैंसल ही रहता है, भले ही सभी चाइल्ड टास्क समाप्त होने से पहले gateway रीस्टार्ट हो जाए।

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
| `openclaw tasks flow list`        | स्टेटस और सिंक मोड के साथ ट्रैक किए गए फ़्लो दिखाता है |
| `openclaw tasks flow show <id>`   | फ़्लो id या lookup key से एक फ़्लो जांचें     |
| `openclaw tasks flow cancel <id>` | चल रहे फ़्लो और उसके सक्रिय टास्क कैंसल करें    |

## फ़्लो टास्क से कैसे संबंधित हैं

फ़्लो टास्क को coordinate करते हैं, उन्हें replace नहीं करते। एक फ़्लो अपने lifetime में कई बैकग्राउंड टास्क चला सकता है। अलग-अलग टास्क रिकॉर्ड देखने के लिए `openclaw tasks` और orchestrating फ़्लो देखने के लिए `openclaw tasks flow` का उपयोग करें।

## संबंधित

- [बैकग्राउंड टास्क](/hi/automation/tasks) — detached work ledger जिसे फ़्लो coordinate करते हैं
- [CLI: टास्क](/hi/cli/tasks) — `openclaw tasks flow` के लिए CLI कमांड संदर्भ
- [ऑटोमेशन अवलोकन](/hi/automation) — सभी ऑटोमेशन mechanisms एक नज़र में
- [Cron जॉब](/hi/automation/cron-jobs) — शेड्यूल्ड जॉब जो फ़्लो में feed कर सकते हैं
