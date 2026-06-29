---
read_when:
    - बाहरी CLI एकीकरण जोड़ना या बदलना
    - RPC एडेप्टरों की डीबगिंग (signal-cli, imsg)
summary: बाहरी CLI (`signal-cli`, `imsg`) और Gateway पैटर्न के लिए RPC अडैप्टर
title: RPC एडेप्टर
x-i18n:
    generated_at: "2026-06-29T00:08:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw बाहरी CLIs को JSON-RPC के माध्यम से एकीकृत करता है। आज दो पैटर्न उपयोग किए जाते हैं।

## पैटर्न A: HTTP डेमन (signal-cli)

- `signal-cli` HTTP पर JSON-RPC के साथ डेमन के रूप में चलता है।
- इवेंट स्ट्रीम SSE (`/api/v1/events`) है।
- स्वास्थ्य जांच: `/api/v1/check`।
- जब `channels.signal.autoStart=true` हो, तो OpenClaw lifecycle का स्वामी होता है।

सेटअप और endpoints के लिए [Signal](/hi/channels/signal) देखें।

## पैटर्न B: stdio child process (imsg)

- OpenClaw [iMessage](/hi/channels/imessage) के लिए `imsg rpc` को child process के रूप में spawn करता है।
- JSON-RPC stdin/stdout पर line-delimited होता है (प्रति पंक्ति एक JSON object)।
- कोई TCP port नहीं, कोई डेमन आवश्यक नहीं।

उपयोग की जाने वाली core methods:

- `watch.subscribe` → सूचनाएं (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostics)

legacy setup और addressing (`chat_id` preferred) के लिए [iMessage](/hi/channels/imessage) देखें।

## Adapter दिशानिर्देश

- Gateway process का स्वामी होता है (start/stop provider lifecycle से बंधा होता है)।
- RPC clients को resilient रखें: timeouts, exit पर restart।
- display strings के बजाय stable IDs (जैसे, `chat_id`) को प्राथमिकता दें।

## संबंधित

- [Gateway protocol](/hi/gateway/protocol)
