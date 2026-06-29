---
read_when:
    - OpenClaw को ClickClack कार्यक्षेत्र से कनेक्ट करना
    - ClickClack बॉट पहचानों का परीक्षण
summary: ClickClack bot-token चैनल सेटअप और लक्ष्य सिंटैक्स
title: ClickClack
x-i18n:
    generated_at: "2026-06-28T22:34:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack, OpenClaw को प्रथम-श्रेणी ClickClack बॉट टोकन के माध्यम से self-hosted ClickClack वर्कस्पेस से जोड़ता है।

इसका उपयोग तब करें जब आप चाहते हैं कि OpenClaw एजेंट ClickClack बॉट उपयोगकर्ता के रूप में दिखाई दे। ClickClack स्वतंत्र सेवा बॉट और उपयोगकर्ता-स्वामित्व वाले बॉट का समर्थन करता है; उपयोगकर्ता-स्वामित्व वाले बॉट `owner_user_id` रखते हैं और केवल वे टोकन स्कोप प्राप्त करते हैं जिन्हें आप अनुमति देते हैं।

## त्वरित सेटअप

ClickClack में बॉट टोकन बनाएँ:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

उपयोगकर्ता-स्वामित्व वाले बॉट के लिए, `--owner <user_id>` जोड़ें।

OpenClaw कॉन्फ़िगर करें:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

फिर चलाएँ:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

यदि `plugins.allow` एक गैर-खाली प्रतिबंधात्मक सूची है, तो चैनल सेटअप में ClickClack को स्पष्ट रूप से चुनना या `openclaw plugins enable clickclack` चलाना उस सूची में `clickclack` जोड़ देता है। ऑनबोर्डिंग इंस्टॉलेशन भी यही स्पष्ट-चयन व्यवहार उपयोग करता है। ये पथ `plugins.deny` या वैश्विक `plugins.enabled: false` सेटिंग को ओवरराइड नहीं करते। सीधे `openclaw plugins install @openclaw/clickclack` सामान्य Plugin-इंस्टॉल नीति का पालन करता है और मौजूदा allowlist में ClickClack को भी दर्ज करता है।

## कई बॉट

हर खाता अपना ClickClack रीयलटाइम कनेक्शन खोलता है और अपना बॉट टोकन उपयोग करता है।

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` छोटे बॉट जवाबों के लिए सीधे `api.runtime.llm.complete` का उपयोग करता है।
जब कोई खाता `agentId` सेट करता है, तो OpenClaw को स्पष्ट `plugins.entries.clickclack.llm.allowAgentIdOverride` भरोसा-बिट चाहिए होता है ताकि Plugin उस बॉट एजेंट के लिए completion चला सके। यदि आप केवल डिफ़ॉल्ट एजेंट रूट उपयोग करते हैं, तो इसे बंद रखें।

## लक्ष्य

- `channel:<name-or-id>` वर्कस्पेस चैनल में भेजता है। Bare लक्ष्य डिफ़ॉल्ट रूप से `channel:` होते हैं।
- `dm:<user_id>` उस उपयोगकर्ता के साथ सीधी बातचीत बनाता है या फिर से उपयोग करता है।
- `thread:<message_id>` मौजूदा थ्रेड में जवाब देता है।

उदाहरण:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## अनुमतियाँ

ClickClack टोकन स्कोप ClickClack API द्वारा लागू किए जाते हैं।

- `bot:read`: वर्कस्पेस/चैनल/संदेश/थ्रेड/DM/रीयलटाइम/प्रोफ़ाइल डेटा पढ़ें।
- `bot:write`: `bot:read` के साथ चैनल संदेश, थ्रेड जवाब, DM, और अपलोड।
- `bot:admin`: `bot:write` के साथ चैनल निर्माण।

सामान्य एजेंट चैट के लिए OpenClaw को केवल `bot:write` चाहिए।

## समस्या निवारण

- `ClickClack is not configured`: `channels.clickclack.token` या `CLICKCLACK_BOT_TOKEN` सेट करें।
- `workspace not found`: `workspace` को ClickClack द्वारा लौटाए गए वर्कस्पेस id या slug पर सेट करें।
- कोई इनबाउंड जवाब नहीं: पुष्टि करें कि टोकन के पास रीयलटाइम पढ़ने की पहुँच है और बॉट अपने ही संदेशों का जवाब नहीं दे रहा है।
- चैनल भेजना विफल होता है: सत्यापित करें कि बॉट वर्कस्पेस का सदस्य है और उसके पास `bot:write` है।
