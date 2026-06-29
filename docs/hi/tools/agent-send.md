---
read_when:
    - आप scripts या command line से agent runs ट्रिगर करना चाहते हैं
    - आपको एजेंट के जवाबों को प्रोग्रामेटिक रूप से चैट चैनल तक पहुँचाना होगा
summary: CLI से एजेंट टर्न चलाएँ और वैकल्पिक रूप से उत्तर चैनलों तक पहुँचाएँ
title: Agent भेजें
x-i18n:
    generated_at: "2026-06-29T00:15:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` कमांड लाइन से एक ही एजेंट टर्न चलाता है, जिसके लिए
इनबाउंड चैट संदेश की आवश्यकता नहीं होती। इसे स्क्रिप्टेड वर्कफ़्लो, परीक्षण और
प्रोग्रामेटिक डिलीवरी के लिए उपयोग करें।

## त्वरित शुरुआत

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    यह संदेश को Gateway के माध्यम से भेजता है और उत्तर प्रिंट करता है।

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    यह एजेंट संदेश बॉडी के रूप में एक मान्य UTF-8 फ़ाइल पढ़ता है।

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## फ़्लैग

| फ़्लैग                         | विवरण                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | भेजने के लिए इनलाइन संदेश                                  |
| `--message-file \<path\>`     | एक मान्य UTF-8 फ़ाइल से संदेश पढ़ें                        |
| `--to \<dest\>`               | किसी लक्ष्य (फ़ोन, चैट id) से सेशन कुंजी प्राप्त करें      |
| `--session-key \<key\>`       | स्पष्ट सेशन कुंजी का उपयोग करें                            |
| `--agent \<id\>`              | कॉन्फ़िगर किए गए एजेंट को लक्षित करें (उसके `main` सेशन का उपयोग करता है) |
| `--session-id \<id\>`         | id द्वारा मौजूदा सेशन का पुनः उपयोग करें                   |
| `--local`                     | स्थानीय एम्बेडेड रनटाइम बाध्य करें (Gateway छोड़ें)        |
| `--deliver`                   | उत्तर को चैट चैनल पर भेजें                                 |
| `--channel \<name\>`          | डिलीवरी चैनल (whatsapp, telegram, discord, slack, आदि)     |
| `--reply-to \<target\>`       | डिलीवरी लक्ष्य ओवरराइड                                    |
| `--reply-channel \<name\>`    | डिलीवरी चैनल ओवरराइड                                      |
| `--reply-account \<id\>`      | डिलीवरी अकाउंट id ओवरराइड                                 |
| `--thinking \<level\>`        | चुने गए मॉडल प्रोफ़ाइल के लिए थिंकिंग स्तर सेट करें        |
| `--verbose \<on\|full\|off\>` | वर्बोज़ स्तर सेट करें                                      |
| `--timeout \<seconds\>`       | एजेंट टाइमआउट ओवरराइड करें                                |
| `--json`                      | संरचित JSON आउटपुट करें                                    |

## व्यवहार

- डिफ़ॉल्ट रूप से, CLI **Gateway के माध्यम से** जाता है। वर्तमान मशीन पर
  एम्बेडेड रनटाइम को बाध्य करने के लिए `--local` जोड़ें।
- `--message` या `--message-file` में से ठीक एक पास करें। फ़ाइल संदेश वैकल्पिक
  UTF-8 BOM हटाने के बाद मल्टीलाइन सामग्री को संरक्षित रखते हैं।
- यदि Gateway उपलब्ध नहीं है, तो CLI स्थानीय एम्बेडेड रन पर **फॉलबैक** करता है।
- सेशन चयन: `--to` सेशन कुंजी प्राप्त करता है (समूह/चैनल लक्ष्य
  आइसोलेशन संरक्षित रखते हैं; डायरेक्ट चैट `main` में समाहित हो जाती हैं)।
- `--session-key` एक स्पष्ट कुंजी चुनता है। एजेंट-प्रीफ़िक्स वाली कुंजियों को
  `agent:<agent-id>:<session-key>` का उपयोग करना होगा, और दोनों दिए जाने पर
  `--agent` को उस एजेंट id से मेल खाना चाहिए। बेयर नॉन-सेंटिनल कुंजियाँ
  दिए जाने पर `--agent` के स्कोप में होती हैं; उदाहरण के लिए,
  `--agent ops --session-key incident-42` को `agent:ops:incident-42` पर रूट करता है।
  `--agent` के बिना, बेयर नॉन-सेंटिनल कुंजियाँ कॉन्फ़िगर किए गए डिफ़ॉल्ट एजेंट
  के स्कोप में होती हैं। लिटरल `global` और `unknown` केवल तब अनस्कोप्ड रहते हैं
  जब कोई `--agent` नहीं दिया गया हो; उस स्थिति में, एम्बेडेड फॉलबैक और स्टोर
  ओनरशिप कॉन्फ़िगर किए गए डिफ़ॉल्ट एजेंट का उपयोग करते हैं।
- थिंकिंग और वर्बोज़ फ़्लैग सेशन स्टोर में बने रहते हैं।
- आउटपुट: डिफ़ॉल्ट रूप से सादा टेक्स्ट, या संरचित पेलोड + मेटाडेटा के लिए `--json`।
- `--json --deliver` के साथ, JSON में भेजे गए, दबाए गए, आंशिक और विफल भेजावों
  की डिलीवरी स्थिति शामिल होती है। देखें
  [JSON डिलीवरी स्थिति](/hi/cli/agent#json-delivery-status)।

## उदाहरण

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## संबंधित

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/hi/cli/agent" icon="terminal">
    पूरा `openclaw agent` फ़्लैग और विकल्प संदर्भ।
  </Card>
  <Card title="Sub-agents" href="/hi/tools/subagents" icon="users">
    बैकग्राउंड उप-एजेंट स्पॉनिंग।
  </Card>
  <Card title="Sessions" href="/hi/concepts/session" icon="comments">
    सेशन कुंजियाँ कैसे काम करती हैं और `--to`, `--agent`, और `--session-id` उन्हें कैसे रिज़ॉल्व करते हैं।
  </Card>
  <Card title="Slash commands" href="/hi/tools/slash-commands" icon="slash">
    एजेंट सेशन के अंदर उपयोग किया जाने वाला नेटिव कमांड कैटलॉग।
  </Card>
</CardGroup>
