---
read_when:
    - प्रदाता पुनःप्रयास व्यवहार या डिफ़ॉल्ट अपडेट करना
    - प्रदाता की भेजने संबंधी त्रुटियों या दर सीमाओं को डीबग करना
summary: आउटबाउंड प्रदाता कॉल के लिए पुनः प्रयास नीति
title: पुनः प्रयास नीति
x-i18n:
    generated_at: "2026-06-28T23:03:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## लक्ष्य

- प्रति HTTP अनुरोध पुनः प्रयास करें, बहु-चरणीय फ़्लो पर नहीं।
- केवल वर्तमान चरण को फिर से आज़माकर क्रम बनाए रखें।
- गैर-idempotent ऑपरेशनों की प्रतिलिपि बनने से बचें।

## डिफ़ॉल्ट

- प्रयास: 3
- अधिकतम विलंब सीमा: 30000 ms
- जिटर: 0.1 (10 प्रतिशत)
- प्रदाता डिफ़ॉल्ट:
  - Telegram न्यूनतम विलंब: 400 ms
  - Discord न्यूनतम विलंब: 500 ms

## व्यवहार

### मॉडल प्रदाता

- OpenClaw प्रदाता SDKs को सामान्य छोटे पुनः प्रयास संभालने देता है।
- Anthropic और OpenAI जैसे Stainless-आधारित SDKs के लिए, पुनः प्रयास योग्य प्रतिक्रियाओं
  (`408`, `409`, `429`, और `5xx`) में `retry-after-ms` या
  `retry-after` शामिल हो सकता है। जब वह प्रतीक्षा 60 सेकंड से अधिक होती है, तो OpenClaw
  `x-should-retry: false` इंजेक्ट करता है ताकि SDK त्रुटि को तुरंत सतह पर ला दे और मॉडल
  failover किसी अन्य auth प्रोफ़ाइल या fallback मॉडल पर घूम सके।
- सीमा को `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` से ओवरराइड करें।
  SDKs को लंबे `Retry-After` sleeps को आंतरिक रूप से सम्मान करने देने के लिए इसे `0`, `false`, `off`, `none`, या `disabled` पर सेट करें।

### Discord

- rate-limit त्रुटियों (HTTP 429), अनुरोध timeouts, HTTP 5xx प्रतिक्रियाओं,
  और DNS lookup failures, connection resets, socket closes, और fetch failures जैसी क्षणिक transport failures पर पुनः प्रयास करता है।
- उपलब्ध होने पर Discord `retry_after` का उपयोग करता है, अन्यथा exponential backoff का।

### Telegram

- क्षणिक त्रुटियों (429, timeout, connect/reset/closed, temporarily unavailable) पर पुनः प्रयास करता है।
- उपलब्ध होने पर `retry_after` का उपयोग करता है, अन्यथा exponential backoff का।
- Markdown parse errors पर पुनः प्रयास नहीं किया जाता; वे plain text पर वापस जाते हैं।

## कॉन्फ़िगरेशन

`~/.openclaw/openclaw.json` में प्रति प्रदाता retry नीति सेट करें:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## नोट्स

- पुनः प्रयास प्रति अनुरोध लागू होते हैं (message send, media upload, reaction, poll, sticker)।
- Composite flows पूर्ण हो चुके चरणों पर पुनः प्रयास नहीं करते।

## संबंधित

- [मॉडल failover](/hi/concepts/model-failover)
- [Command queue](/hi/concepts/queue)
