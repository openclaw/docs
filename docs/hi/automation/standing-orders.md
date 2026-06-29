---
read_when:
    - प्रति-कार्य प्रॉम्प्टिंग के बिना चलने वाले स्वायत्त एजेंट वर्कफ़्लो सेट अप करना
    - परिभाषित करना कि एजेंट स्वतंत्र रूप से क्या कर सकता है बनाम किन चीज़ों के लिए मानवीय अनुमोदन आवश्यक है
    - स्पष्ट सीमाओं और एस्केलेशन नियमों के साथ बहु-प्रोग्राम एजेंटों की संरचना करना
summary: स्वायत्त एजेंट प्रोग्रामों के लिए स्थायी संचालन अधिकार परिभाषित करें
title: स्थायी आदेश
x-i18n:
    generated_at: "2026-06-28T22:32:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
---

स्थायी आदेश आपके एजेंट को परिभाषित प्रोग्रामों के लिए **स्थायी संचालन अधिकार** देते हैं। हर बार अलग-अलग कार्य निर्देश देने के बजाय, आप स्पष्ट दायरे, ट्रिगर और एस्केलेशन नियमों के साथ प्रोग्राम परिभाषित करते हैं - और एजेंट उन सीमाओं के भीतर स्वायत्त रूप से निष्पादित करता है।

यह हर शुक्रवार अपने सहायक से "साप्ताहिक रिपोर्ट भेजो" कहने और स्थायी अधिकार देने के बीच का अंतर है: "साप्ताहिक रिपोर्ट तुम्हारी जिम्मेदारी है। इसे हर शुक्रवार संकलित करो, भेजो, और केवल तभी एस्केलेट करो जब कुछ गलत लगे।"

## स्थायी आदेश क्यों

**स्थायी आदेशों के बिना:**

- आपको हर कार्य के लिए एजेंट को प्रॉम्प्ट करना पड़ता है
- अनुरोधों के बीच एजेंट निष्क्रिय रहता है
- नियमित काम भूल जाता है या विलंबित हो जाता है
- आप बाधा बन जाते हैं

**स्थायी आदेशों के साथ:**

- एजेंट परिभाषित सीमाओं के भीतर स्वायत्त रूप से निष्पादित करता है
- नियमित काम बिना प्रॉम्प्ट किए समय पर होता है
- आप केवल अपवादों और अनुमोदनों के लिए शामिल होते हैं
- एजेंट खाली समय का उत्पादक उपयोग करता है

## ये कैसे काम करते हैं

स्थायी आदेश आपके [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace) फ़ाइलों में परिभाषित होते हैं। अनुशंसित तरीका है उन्हें सीधे `AGENTS.md` में शामिल करना (जो हर सत्र में स्वतः इंजेक्ट होता है) ताकि एजेंट के पास वे हमेशा संदर्भ में रहें। बड़ी कॉन्फ़िगरेशन के लिए, आप उन्हें `standing-orders.md` जैसी समर्पित फ़ाइल में भी रख सकते हैं और `AGENTS.md` से उसका संदर्भ दे सकते हैं।

हर प्रोग्राम निर्दिष्ट करता है:

1. **दायरा** - एजेंट को क्या करने का अधिकार है
2. **ट्रिगर** - कब निष्पादित करना है (शेड्यूल, इवेंट, या स्थिति)
3. **अनुमोदन गेट** - कार्रवाई से पहले किन चीज़ों पर मानव स्वीकृति चाहिए
4. **एस्केलेशन नियम** - कब रुककर मदद मांगनी है

एजेंट हर सत्र में वर्कस्पेस बूटस्ट्रैप फ़ाइलों के माध्यम से ये निर्देश लोड करता है (स्वतः इंजेक्ट होने वाली फ़ाइलों की पूरी सूची के लिए [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace) देखें) और समय-आधारित प्रवर्तन के लिए [Cron jobs](/hi/automation/cron-jobs) के साथ मिलाकर इनके अनुसार निष्पादित करता है।

<Tip>
स्थायी आदेशों को `AGENTS.md` में रखें ताकि यह गारंटी हो कि वे हर सत्र में लोड हों। वर्कस्पेस बूटस्ट्रैप `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, और `MEMORY.md` को स्वतः इंजेक्ट करता है - लेकिन उपनिर्देशिकाओं की मनमानी फ़ाइलों को नहीं।
</Tip>

## स्थायी आदेश की संरचना

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## स्थायी आदेश और Cron jobs

स्थायी आदेश परिभाषित करते हैं कि एजेंट को **क्या** करने का अधिकार है। [Cron jobs](/hi/automation/cron-jobs) परिभाषित करते हैं कि यह **कब** होता है। वे साथ मिलकर काम करते हैं:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron job प्रॉम्प्ट को स्थायी आदेश की नकल करने के बजाय उसका संदर्भ देना चाहिए:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## उदाहरण

### उदाहरण 1: सामग्री और सोशल मीडिया (साप्ताहिक चक्र)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### उदाहरण 2: वित्तीय संचालन (इवेंट-ट्रिगर)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### उदाहरण 3: निगरानी और अलर्ट (निरंतर)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## निष्पादित-सत्यापित-रिपोर्ट पैटर्न

स्थायी आदेश तब सबसे अच्छे काम करते हैं जब उन्हें सख्त निष्पादन अनुशासन के साथ जोड़ा जाता है। स्थायी आदेश के हर कार्य को इस लूप का पालन करना चाहिए:

1. **निष्पादित करें** - वास्तविक काम करें (सिर्फ निर्देश स्वीकार न करें)
2. **सत्यापित करें** - पुष्टि करें कि परिणाम सही है (फ़ाइल मौजूद है, संदेश डिलीवर हुआ, डेटा पार्स हुआ)
3. **रिपोर्ट करें** - स्वामी को बताएं कि क्या किया गया और क्या सत्यापित हुआ

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

यह पैटर्न एजेंट की सबसे आम विफलता से बचाता है: कार्य पूरा किए बिना उसे स्वीकार कर लेना।

## बहु-प्रोग्राम आर्किटेक्चर

कई क्षेत्रों का प्रबंधन करने वाले एजेंटों के लिए, स्थायी आदेशों को स्पष्ट सीमाओं वाले अलग-अलग प्रोग्रामों के रूप में व्यवस्थित करें:

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

हर प्रोग्राम में होना चाहिए:

- उसका अपना **ट्रिगर कैडेंस** (साप्ताहिक, मासिक, इवेंट-आधारित, निरंतर)
- उसके अपने **अनुमोदन गेट** (कुछ प्रोग्रामों को दूसरों से अधिक निगरानी चाहिए)
- स्पष्ट **सीमाएं** (एजेंट को पता होना चाहिए कि एक प्रोग्राम कहां समाप्त होता है और दूसरा कहां शुरू होता है)

## सर्वोत्तम अभ्यास

### करें

- सीमित अधिकार से शुरू करें और भरोसा बढ़ने पर विस्तार करें
- उच्च-जोखिम कार्रवाइयों के लिए स्पष्ट अनुमोदन गेट परिभाषित करें
- "क्या नहीं करना है" अनुभाग शामिल करें - सीमाएं अनुमतियों जितनी ही महत्वपूर्ण हैं
- भरोसेमंद समय-आधारित निष्पादन के लिए Cron jobs के साथ संयोजित करें
- यह सत्यापित करने के लिए कि स्थायी आदेशों का पालन हो रहा है, एजेंट लॉग साप्ताहिक रूप से देखें
- अपनी ज़रूरतों के बदलने पर स्थायी आदेश अपडेट करें - वे जीवित दस्तावेज़ हैं

### बचें

- पहले दिन ही व्यापक अधिकार देना ("जो तुम्हें सबसे अच्छा लगे वह करो")
- एस्केलेशन नियम छोड़ना - हर प्रोग्राम में "कब रुककर पूछना है" वाला खंड चाहिए
- यह मान लेना कि एजेंट मौखिक निर्देश याद रखेगा - सब कुछ फ़ाइल में डालें
- एक ही प्रोग्राम में कई क्षेत्रों को मिलाना - अलग-अलग डोमेन के लिए अलग-अलग प्रोग्राम
- Cron jobs से प्रवर्तन भूल जाना - ट्रिगर के बिना स्थायी आदेश सुझाव बन जाते हैं

## संबंधित

- [ऑटोमेशन](/hi/automation): सभी ऑटोमेशन तंत्रों का एक नज़र में अवलोकन।
- [Cron jobs](/hi/automation/cron-jobs): स्थायी आदेशों के लिए शेड्यूल प्रवर्तन।
- [हुक्स](/hi/automation/hooks): एजेंट जीवनचक्र इवेंट के लिए इवेंट-आधारित स्क्रिप्ट।
- [Webhooks](/hi/automation/cron-jobs#webhooks): इनबाउंड HTTP इवेंट ट्रिगर।
- [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace): जहां स्थायी आदेश रहते हैं, जिसमें स्वतः इंजेक्ट होने वाली बूटस्ट्रैप फ़ाइलों (`AGENTS.md`, `SOUL.md`, आदि) की पूरी सूची शामिल है।
