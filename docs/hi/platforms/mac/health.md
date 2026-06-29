---
read_when:
    - Mac ऐप स्वास्थ्य संकेतकों की डिबगिंग
summary: macOS ऐप gateway/Baileys स्वास्थ्य स्थितियों की रिपोर्ट कैसे करता है
title: स्वास्थ्य जांच (macOS)
x-i18n:
    generated_at: "2026-06-28T23:28:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS पर स्वास्थ्य जांचें

मेनू बार ऐप से कैसे देखें कि लिंक किया गया चैनल स्वस्थ है या नहीं।

## मेनू बार

- स्थिति बिंदु अब Baileys स्वास्थ्य को दर्शाता है:
  - हरा: लिंक किया गया + सॉकेट हाल ही में खुला।
  - नारंगी: कनेक्ट हो रहा है/फिर से प्रयास कर रहा है।
  - लाल: लॉग आउट है या प्रोब विफल हुआ।
- द्वितीयक पंक्ति "linked · auth 12m" पढ़ती है या विफलता का कारण दिखाती है।
- "Run Health Check" मेनू आइटम मांग पर प्रोब ट्रिगर करता है।

## सेटिंग्स

- General टैब में एक स्वास्थ्य कार्ड जुड़ता है जो दिखाता है: लिंक की गई auth आयु, session-store पथ/गिनती, पिछली जांच का समय, पिछली त्रुटि/स्थिति कोड, और Run Health Check / Reveal Logs के बटन।
- कैश किए गए स्नैपशॉट का उपयोग करता है ताकि UI तुरंत लोड हो और ऑफलाइन होने पर सहजता से फ़ॉलबैक करे।
- **Channels टैब** WhatsApp/Telegram के लिए चैनल स्थिति + नियंत्रण दिखाता है (लॉगिन QR, लॉगआउट, प्रोब, पिछला डिस्कनेक्ट/त्रुटि)।

## प्रोब कैसे काम करता है

- ऐप `ShellExecutor` के माध्यम से हर ~60s और मांग पर `openclaw health --json` चलाता है। प्रोब creds लोड करता है और संदेश भेजे बिना स्थिति रिपोर्ट करता है।
- झिलमिलाहट से बचने के लिए पिछले अच्छे स्नैपशॉट और पिछली त्रुटि को अलग-अलग कैश करें; प्रत्येक का टाइमस्टैम्प दिखाएं।

## संदेह होने पर

- आप अभी भी [Gateway स्वास्थ्य](/hi/gateway/health) में CLI प्रवाह (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) का उपयोग कर सकते हैं और `web-heartbeat` / `web-reconnect` के लिए `/tmp/openclaw/openclaw-*.log` को tail कर सकते हैं।

## संबंधित

- [Gateway स्वास्थ्य](/hi/gateway/health)
- [macOS ऐप](/hi/platforms/macos)
