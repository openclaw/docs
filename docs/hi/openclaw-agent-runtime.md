---
read_when:
    - OpenClaw एजेंट रनटाइम कोड या परीक्षणों पर काम करना
    - agent-runtime lint, typecheck, और live test फ़्लो चलाना
summary: 'OpenClaw एजेंट रनटाइम के लिए डेवलपर वर्कफ़्लो: बिल्ड, टेस्ट, और लाइव वैलिडेशन'
title: OpenClaw एजेंट रनटाइम कार्यप्रवाह
x-i18n:
    generated_at: "2026-06-28T23:26:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw में OpenClaw एजेंट रनटाइम पर काम करने के लिए एक समझदार वर्कफ़्लो।

## टाइप जाँच और लिंटिंग

- डिफ़ॉल्ट स्थानीय गेट: `pnpm check`
- बिल्ड गेट: `pnpm build` जब बदलाव बिल्ड आउटपुट, पैकेजिंग, या लेज़ी-लोडिंग/मॉड्यूल सीमाओं को प्रभावित कर सकता हो
- एजेंट-रनटाइम बदलावों के लिए पूरा लैंडिंग गेट: `pnpm check && pnpm test`

## एजेंट रनटाइम परीक्षण चलाना

एजेंट-रनटाइम परीक्षण सेट को सीधे Vitest के साथ चलाएँ:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

लाइव प्रोवाइडर अभ्यास शामिल करने के लिए:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

यह मुख्य एजेंट रनटाइम यूनिट सुइट्स को कवर करता है:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## मैनुअल परीक्षण

अनुशंसित प्रवाह:

- Gateway को डेवलपमेंट मोड में चलाएँ:
  - `pnpm gateway:dev`
- एजेंट को सीधे ट्रिगर करें:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- इंटरैक्टिव डीबगिंग के लिए TUI का उपयोग करें:
  - `pnpm tui`

टूल कॉल व्यवहार के लिए, `read` या `exec` क्रिया के लिए प्रॉम्प्ट दें ताकि आप टूल स्ट्रीमिंग और पेलोड हैंडलिंग देख सकें।

## साफ़-स्लेट रीसेट

स्टेट OpenClaw स्टेट डायरेक्टरी के अंतर्गत रहता है। डिफ़ॉल्ट `~/.openclaw` है। यदि `OPENCLAW_STATE_DIR` सेट है, तो उसके बजाय उस डायरेक्टरी का उपयोग करें।

सब कुछ रीसेट करने के लिए:

- कॉन्फ़िग के लिए `openclaw.json`
- मॉडल auth प्रोफ़ाइलों (API कुंजियाँ + OAuth) के लिए `agents/<agentId>/agent/auth-profiles.json`
- प्रोवाइडर/चैनल स्टेट के लिए `credentials/`, जो अभी भी auth प्रोफ़ाइल स्टोर के बाहर रहता है
- एजेंट सेशन इतिहास के लिए `agents/<agentId>/sessions/`
- सेशन इंडेक्स के लिए `agents/<agentId>/sessions/sessions.json`
- यदि लेगेसी पाथ मौजूद हों, तो `sessions/`
- यदि आप खाली वर्कस्पेस चाहते हैं, तो `workspace/`

यदि आप केवल सेशन रीसेट करना चाहते हैं, तो उस एजेंट के लिए `agents/<agentId>/sessions/` हटाएँ। यदि आप auth बनाए रखना चाहते हैं, तो `agents/<agentId>/agent/auth-profiles.json` और `credentials/` के अंतर्गत किसी भी प्रोवाइडर स्टेट को यथावत छोड़ दें।

## संदर्भ

- [परीक्षण](/hi/help/testing)
- [शुरुआत करना](/hi/start/getting-started)

## संबंधित

- [OpenClaw एजेंट रनटाइम आर्किटेक्चर](/hi/agent-runtime-architecture)
