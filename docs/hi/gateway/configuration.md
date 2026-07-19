---
read_when:
    - पहली बार OpenClaw सेट अप करना
    - सामान्य कॉन्फ़िगरेशन पैटर्न खोजे जा रहे हैं
    - विशिष्ट कॉन्फ़िगरेशन अनुभागों पर जाना
summary: 'कॉन्फ़िगरेशन अवलोकन: सामान्य कार्य, त्वरित सेटअप और संपूर्ण संदर्भ के लिंक'
title: कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-07-19T08:39:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0fa0f0cd54052ebb3a2aa4cd5600d7bdcb65a0a499a07d7e62496ee23464afdd
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw `~/.openclaw/openclaw.json` से वैकल्पिक <Tooltip tip="JSON5 टिप्पणियों और अंत में अल्पविरामों का समर्थन करता है">**JSON5**</Tooltip> कॉन्फ़िगरेशन पढ़ता है। फ़ाइल न होने पर, OpenClaw सुरक्षित डिफ़ॉल्ट का उपयोग करता है।

सक्रिय कॉन्फ़िगरेशन पथ एक सामान्य फ़ाइल होना चाहिए। OpenClaw द्वारा किए गए लेखन इसे परमाणु रूप से प्रतिस्थापित करते हैं (पथ पर नाम बदलकर), इसलिए सिमलिंक किए गए `openclaw.json` में उसके लक्ष्य के आर-पार लिखने के बजाय लक्ष्य को प्रतिस्थापित कर दिया जाता है—सिमलिंक किए गए कॉन्फ़िगरेशन लेआउट से बचें। यदि आप कॉन्फ़िगरेशन को डिफ़ॉल्ट स्थिति निर्देशिका के बाहर रखते हैं, तो `OPENCLAW_CONFIG_PATH` को सीधे वास्तविक फ़ाइल पर इंगित करें।

कॉन्फ़िगरेशन जोड़ने के सामान्य कारण:

- चैनल कनेक्ट करें और नियंत्रित करें कि बॉट को कौन संदेश भेज सकता है
- मॉडल, टूल, सैंडबॉक्सिंग या ऑटोमेशन (cron, हुक) सेट करें
- सेशन, मीडिया, नेटवर्किंग या UI को अनुकूलित करें

हर उपलब्ध फ़ील्ड के लिए [पूरा संदर्भ](/hi/gateway/configuration-reference) देखें।

एजेंट और ऑटोमेशन को कॉन्फ़िगरेशन संपादित करने से पहले सटीक फ़ील्ड-स्तरीय
दस्तावेज़ों के लिए `config.schema.lookup` का उपयोग करना चाहिए। कार्य-उन्मुख मार्गदर्शन के लिए इस पृष्ठ और
व्यापक फ़ील्ड मानचित्र तथा डिफ़ॉल्ट के लिए
[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) का उपयोग करें।

<Tip>
**कॉन्फ़िगरेशन में नए हैं?** इंटरैक्टिव सेटअप के लिए `openclaw onboard` से शुरू करें, या कॉपी-पेस्ट के लिए तैयार संपूर्ण कॉन्फ़िगरेशन हेतु [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) मार्गदर्शिका देखें।
</Tip>

## न्यूनतम कॉन्फ़िगरेशन

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## कॉन्फ़िगरेशन संपादित करना

<Tabs>
  <Tab title="इंटरैक्टिव विज़ार्ड">
    ```bash
    openclaw onboard       # संपूर्ण ऑनबोर्डिंग प्रवाह
    openclaw configure     # कॉन्फ़िगरेशन विज़ार्ड
    ```
  </Tab>
  <Tab title="CLI (एक-पंक्ति कमांड)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="नियंत्रण UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) खोलें और **कॉन्फ़िगरेशन** टैब का उपयोग करें।
    उपलब्ध होने पर नियंत्रण UI, लाइव कॉन्फ़िगरेशन स्कीमा से एक फ़ॉर्म रेंडर करता है, जिसमें फ़ील्ड
    `title` / `description` दस्तावेज़ मेटाडेटा तथा Plugin और चैनल स्कीमा शामिल होते हैं,
    और वैकल्पिक उपाय के रूप में एक **अपरिष्कृत JSON** संपादक मिलता है। विस्तृत
    UI और अन्य टूलिंग के लिए, Gateway एक पथ-सीमित स्कीमा Node तथा उसके
    निकटतम चाइल्ड सारांश प्राप्त करने हेतु `config.schema.lookup` भी उपलब्ध कराता है।
  </Tab>
  <Tab title="प्रत्यक्ष संपादन">
    `~/.openclaw/openclaw.json` को सीधे संपादित करें। Gateway फ़ाइल पर नज़र रखता है और बदलावों को स्वचालित रूप से लागू करता है ([हॉट रीलोड](#config-hot-reload) देखें)।
  </Tab>
</Tabs>

## कठोर सत्यापन

<Warning>
OpenClaw केवल उन्हीं कॉन्फ़िगरेशन को स्वीकार करता है जो स्कीमा से पूरी तरह मेल खाते हैं। अज्ञात कुंजियों, विकृत प्रकारों या अमान्य मानों के कारण Gateway **शुरू होने से इनकार कर देता है**। एकमात्र रूट-स्तरीय अपवाद `$schema` (स्ट्रिंग) है, ताकि संपादक JSON Schema मेटाडेटा संलग्न कर सकें।
</Warning>

`openclaw config schema` नियंत्रण UI और सत्यापन द्वारा उपयोग किया जाने वाला प्रामाणिक JSON Schema
प्रिंट करता है। `config.schema.lookup` विस्तृत टूलिंग के लिए एकल पथ-सीमित Node तथा
चाइल्ड सारांश प्राप्त करता है। फ़ील्ड `title`/`description` दस्तावेज़ मेटाडेटा
नेस्टेड ऑब्जेक्ट, वाइल्डकार्ड (`*`), ऐरे-आइटम (`[]`), और `anyOf`/
`oneOf`/`allOf` शाखाओं में भी बना रहता है। मैनिफ़ेस्ट रजिस्ट्री लोड होने पर रनटाइम Plugin और चैनल स्कीमा मर्ज हो जाते हैं।

सत्यापन विफल होने पर:

- Gateway बूट नहीं होता
- केवल निदान कमांड काम करते हैं (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- सटीक समस्याएँ देखने के लिए `openclaw doctor` चलाएँ
- सुधार लागू करने के लिए `openclaw doctor --fix` चलाएँ (`--repair` वही फ़्लैग है; `--yes` संकेतों को छोड़ देता है)

हर सफल स्टार्टअप के बाद Gateway अंतिम ज्ञात-सही विश्वसनीय प्रति रखता है,
लेकिन स्टार्टअप और हॉट रीलोड इसे स्वचालित रूप से पुनर्स्थापित नहीं करते—केवल `openclaw doctor --fix`
ऐसा करता है। यदि `openclaw.json` सत्यापन में विफल होता है (Plugin-स्थानीय सत्यापन सहित), तो Gateway
स्टार्टअप विफल हो जाता है या रीलोड छोड़ दिया जाता है और वर्तमान रनटाइम अंतिम स्वीकृत
कॉन्फ़िगरेशन बनाए रखता है। अस्वीकृत लेखन को निरीक्षण के लिए `<path>.rejected.<timestamp>` के रूप में भी सहेजा जाता है।
Gateway उन लेखनों को रोकता है जो आकस्मिक अधिलेखन जैसे लगते हैं—`gateway.mode` को हटाना,
`meta` ब्लॉक खो देना, या फ़ाइल को आधे से अधिक छोटा करना—जब तक लेखन
विनाशकारी बदलावों की स्पष्ट अनुमति न दे। यदि किसी उम्मीदवार में `***` या `[redacted]` जैसा
संशोधित गुप्त मान प्लेसहोल्डर हो, तो उसे अंतिम ज्ञात-सही स्थिति में पदोन्नत नहीं किया जाता।

## सामान्य कार्य

<AccordionGroup>
  <Accordion title="चैनल सेट अप करें (WhatsApp, Telegram, Discord आदि)">
    प्रत्येक चैनल का `channels.<provider>` के अंतर्गत अपना कॉन्फ़िगरेशन अनुभाग होता है। सेटअप के चरणों के लिए संबंधित चैनल पृष्ठ देखें:

    - [Discord](/hi/channels/discord) - `channels.discord`
    - [Feishu](/hi/channels/feishu) - `channels.feishu`
    - [Google Chat](/hi/channels/googlechat) - `channels.googlechat`
    - [iMessage](/hi/channels/imessage) - `channels.imessage`
    - [Mattermost](/hi/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/hi/channels/msteams) - `channels.msteams`
    - [Signal](/hi/channels/signal) - `channels.signal`
    - [Slack](/hi/channels/slack) - `channels.slack`
    - [Telegram](/hi/channels/telegram) - `channels.telegram`
    - [WhatsApp](/hi/channels/whatsapp) - `channels.whatsapp`

    सभी चैनल समान DM नीति पैटर्न साझा करते हैं:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // केवल allowlist/open के लिए
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="मॉडल चुनें और कॉन्फ़िगर करें">
    प्राथमिक मॉडल और वैकल्पिक फ़ॉलबैक सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` उपनाम और प्रति-मॉडल सेटिंग संग्रहीत करता है; कोई प्रविष्टि जोड़ने से `/model` या `--model` ओवरराइड कभी प्रतिबंधित नहीं होते।
    - `agents.defaults.modelPolicy.allow` ओवरराइड और मॉडल चयनकर्ताओं के लिए स्पष्ट अनुमति-सूची है। यह सटीक संदर्भ और `provider/*` वाइल्डकार्ड स्वीकार करता है; किसी भी मॉडल की अनुमति देने के लिए इसे छोड़ दें या `[]` का उपयोग करें।
    - मॉडल संदर्भ `provider/model` प्रारूप का उपयोग करते हैं (जैसे `anthropic/claude-opus-4-6`)।
    - `agents.defaults.imageMaxDimensionPx` ट्रांसक्रिप्ट/टूल इमेज का आकार घटाना नियंत्रित करता है (डिफ़ॉल्ट `1200`); कम मान आम तौर पर स्क्रीनशॉट-प्रधान रन में विज़न-टोकन उपयोग कम करते हैं।
    - चैट में मॉडल बदलने के लिए [मॉडल CLI](/hi/concepts/models) और प्रमाणीकरण रोटेशन तथा फ़ॉलबैक व्यवहार के लिए [मॉडल फ़ेलओवर](/hi/concepts/model-failover) देखें।
    - कस्टम/स्वयं-होस्ट किए गए प्रदाताओं के लिए, संदर्भ में [कस्टम प्रदाता](/hi/gateway/config-tools#custom-providers-and-base-urls) देखें।

  </Accordion>

  <Accordion title="नियंत्रित करें कि बॉट को कौन संदेश भेज सकता है">
    DM पहुँच को प्रति चैनल `dmPolicy` (डिफ़ॉल्ट `"pairing"`) के माध्यम से नियंत्रित किया जाता है:

    - `"pairing"`: अज्ञात प्रेषकों को अनुमोदन के लिए एक बार उपयोग होने वाला पेयरिंग कोड मिलता है
    - `"allowlist"`: केवल `allowFrom` में शामिल प्रेषक (या पेयर की गई अनुमति संग्रह में)
    - `"open"`: सभी आने वाले DM की अनुमति दें (`allowFrom: ["*"]` आवश्यक)
    - `"disabled"`: सभी DM अनदेखे करें

    समूहों के लिए, `groupPolicy` (`"allowlist" | "open" | "disabled"`) के साथ `groupAllowFrom` या चैनल-विशिष्ट अनुमति-सूचियों का उपयोग करें।

    प्रति-चैनल विवरणों के लिए [पूरा संदर्भ](/hi/gateway/config-channels#dm-and-group-access) देखें।

  </Accordion>

  <Accordion title="समूह चैट में उल्लेख की शर्त सेट अप करें">
    समूह संदेशों में डिफ़ॉल्ट रूप से **उल्लेख आवश्यक** होता है। प्रत्येक एजेंट के लिए ट्रिगर पैटर्न कॉन्फ़िगर करें। सामान्य समूह/चैनल उत्तर स्वचालित रूप से पोस्ट होते हैं; उन साझा कक्षों के लिए संदेश-टूल पथ चुनें जहाँ एजेंट को तय करना चाहिए कि कब बोलना है:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // हर जगह संदेश-टूल से भेजना आवश्यक करने के लिए "message_tool" सेट करें
        groupChat: {
          visibleReplies: "message_tool", // वैकल्पिक चयन; दृश्य आउटपुट के लिए message(action=send) आवश्यक है
          unmentionedInbound: "room_event", // उल्लेख-रहित हमेशा सक्रिय समूह वार्तालाप शांत संदर्भ है
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **मेटाडेटा उल्लेख**: मूल @-उल्लेख (WhatsApp पर टैप करके उल्लेख, Telegram @bot आदि)
    - **टेक्स्ट पैटर्न**: `mentionPatterns` में सुरक्षित रेगेक्स पैटर्न
    - **दृश्य उत्तर**: `messages.visibleReplies` वैश्विक रूप से संदेश-टूल से भेजना आवश्यक कर सकता है; `messages.groupChat.visibleReplies` समूहों/चैनलों के लिए इसे ओवरराइड करता है।
    - दृश्य उत्तर मोड, प्रति-चैनल ओवरराइड और स्वयं-चैट मोड के लिए [पूरा संदर्भ](/hi/gateway/config-channels#group-chat-mention-gating) देखें।

  </Accordion>

  <Accordion title="प्रति एजेंट Skills प्रतिबंधित करें">
    साझा आधाररेखा के लिए `agents.defaults.skills` का उपयोग करें, फिर विशिष्ट
    एजेंटों को `agents.list[].skills` से ओवरराइड करें:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather इनहेरिट करता है
          { id: "docs", skills: ["docs-search"] }, // डिफ़ॉल्ट को प्रतिस्थापित करता है
          { id: "locked-down", skills: [] }, // कोई Skills नहीं
        ],
      },
    }
    ```

    - डिफ़ॉल्ट रूप से अप्रतिबंधित Skills के लिए `agents.defaults.skills` को छोड़ दें।
    - डिफ़ॉल्ट इनहेरिट करने के लिए `agents.list[].skills` को छोड़ दें।
    - कोई Skills न रखने के लिए `agents.list[].skills: []` सेट करें।
    - [Skills](/hi/tools/skills), [Skills कॉन्फ़िगरेशन](/hi/tools/skills-config), और
      [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agents-defaults-skills) देखें।

  </Accordion>

  <Accordion title="Gateway चैनल स्वास्थ्य निगरानी को अनुकूलित करें">
    नियंत्रित करें कि Gateway निष्क्रिय दिखने वाले चैनलों को कितनी आक्रामकता से पुनः आरंभ करता है:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - दिखाए गए मान डिफ़ॉल्ट हैं। स्वास्थ्य-निगरानी पुनः आरंभ को वैश्विक रूप से अक्षम करने के लिए `gateway.channelHealthCheckMinutes: 0` सेट करें।
    - `channelStaleEventThresholdMinutes` जाँच अंतराल से अधिक या उसके बराबर होना चाहिए।
    - वैश्विक मॉनिटर को अक्षम किए बिना किसी एक चैनल या खाते के स्वचालित पुनः आरंभ अक्षम करने के लिए `channels.<provider>.healthMonitor.enabled` या `channels.<provider>.accounts.<id>.healthMonitor.enabled` का उपयोग करें।
    - परिचालन डीबगिंग के लिए [स्वास्थ्य जाँच](/hi/gateway/health) और सभी फ़ील्ड के लिए [पूरा संदर्भ](/hi/gateway/configuration-reference#gateway) देखें।

  </Accordion>

  <Accordion title="Gateway WebSocket हैंडशेक टाइमआउट को अनुकूलित करें">
    अधिक लोड वाले या कम क्षमता वाले होस्ट पर स्थानीय क्लाइंट को प्रमाणीकरण-पूर्व WebSocket हैंडशेक पूरा करने के लिए
    अधिक समय दें:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - डिफ़ॉल्ट `15000` मिलीसेकंड है।
    - एकबारगी सेवा या शेल ओवरराइड के लिए `OPENCLAW_HANDSHAKE_TIMEOUT_MS` अब भी प्राथमिकता लेता है।
    - पहले स्टार्टअप/इवेंट-लूप अवरोधों को ठीक करना बेहतर है; यह नियंत्रण उन होस्ट के लिए है जो स्वस्थ हैं लेकिन वार्मअप के दौरान धीमे रहते हैं।

  </Accordion>

  <Accordion title="सत्र और रीसेट कॉन्फ़िगर करें">
    सत्र वार्तालाप की निरंतरता और पृथक्करण नियंत्रित करते हैं:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // एकाधिक उपयोगकर्ताओं के लिए अनुशंसित
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (साझा) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: थ्रेड-बद्ध सत्र रूटिंग के वैश्विक डिफ़ॉल्ट। `/focus`, `/unfocus`, `/agents`, `/session idle`, और `/session max-age` प्रत्येक सत्र के लिए इसे क्रमशः बाँधते, खोलते, सूचीबद्ध करते और समायोजित करते हैं (Discord थ्रेड बाँधता है, Telegram विषय/वार्तालाप बाँधता है)।
    - स्कोपिंग, पहचान लिंक और प्रेषण नीति के लिए [सत्र प्रबंधन](/hi/concepts/session) देखें।
    - सभी फ़ील्ड के लिए [पूर्ण संदर्भ](/hi/gateway/config-agents#session) देखें।

  </Accordion>

  <Accordion title="सैंडबॉक्सिंग सक्षम करें">
    एजेंट सत्रों को पृथक सैंडबॉक्स रनटाइम में चलाएँ:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    पहले इमेज बनाएँ—स्रोत चेकआउट से `scripts/sandbox-setup.sh` चलाएँ, या npm इंस्टॉल से [सैंडबॉक्सिंग § इमेज और सेटअप](/hi/gateway/sandboxing#images-and-setup) में दी गई इनलाइन `docker build` कमांड देखें।

    संपूर्ण मार्गदर्शिका के लिए [सैंडबॉक्सिंग](/hi/gateway/sandboxing) और सभी विकल्पों के लिए [पूर्ण संदर्भ](/hi/gateway/config-agents#agentsdefaultssandbox) देखें।

  </Accordion>

  <Accordion title="आधिकारिक iOS बिल्ड के लिए रिले-समर्थित पुश सक्षम करें">
    सार्वजनिक App Store बिल्ड के लिए रिले-समर्थित पुश होस्ट किए गए OpenClaw रिले का उपयोग करता है: `https://ios-push-relay.openclaw.ai`।

    कस्टम रिले डिप्लॉयमेंट के लिए जानबूझकर अलग iOS बिल्ड/डिप्लॉयमेंट पथ आवश्यक है, जिसका रिले URL Gateway रिले URL से मेल खाता हो। यदि आप कस्टम रिले बिल्ड का उपयोग कर रहे हैं, तो Gateway कॉन्फ़िगरेशन में यह सेट करें:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // वैकल्पिक। डिफ़ॉल्ट: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    समतुल्य CLI कमांड:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    यह क्या करता है:

    - Gateway को बाहरी रिले के माध्यम से `push.test`, सक्रिय करने के संकेत और पुनः कनेक्ट करने के संकेत भेजने देता है।
    - युग्मित iOS ऐप द्वारा अग्रेषित, पंजीकरण-स्कोप वाला प्रेषण अनुदान उपयोग करता है। Gateway को पूरे डिप्लॉयमेंट के लिए रिले टोकन की आवश्यकता नहीं होती।
    - प्रत्येक रिले-समर्थित पंजीकरण को उस Gateway पहचान से बाँधता है जिसके साथ iOS ऐप युग्मित हुआ था, ताकि कोई अन्य Gateway संग्रहीत पंजीकरण का पुनः उपयोग न कर सके।
    - स्थानीय/मैन्युअल iOS बिल्ड को सीधे APNs पर रखता है। रिले-समर्थित प्रेषण केवल उन आधिकारिक रूप से वितरित बिल्ड पर लागू होते हैं जिन्होंने रिले के माध्यम से पंजीकरण किया है।
    - यह iOS बिल्ड में अंतर्निहित रिले बेस URL से मेल खाना चाहिए, ताकि पंजीकरण और प्रेषण ट्रैफ़िक समान रिले डिप्लॉयमेंट तक पहुँचे।

    शुरू से अंत तक का प्रवाह:

    1. आधिकारिक iOS ऐप इंस्टॉल करें।
    2. वैकल्पिक: जानबूझकर अलग कस्टम रिले बिल्ड का उपयोग करते समय ही Gateway पर `gateway.push.apns.relay.baseUrl` कॉन्फ़िगर करें।
    3. iOS ऐप को Gateway से युग्मित करें और Node तथा ऑपरेटर, दोनों सत्रों को कनेक्ट होने दें।
    4. iOS ऐप Gateway पहचान प्राप्त करता है, App Attest और ऐप रसीद का उपयोग करके रिले के साथ पंजीकरण करता है, और फिर रिले-समर्थित `push.apns.register` पेलोड को युग्मित Gateway पर प्रकाशित करता है।
    5. Gateway रिले हैंडल और प्रेषण अनुदान संग्रहीत करता है, फिर उनका उपयोग `push.test`, सक्रिय करने के संकेतों और पुनः कनेक्ट करने के संकेतों के लिए करता है।

    परिचालन संबंधी टिप्पणियाँ:

    - यदि आप iOS ऐप को किसी दूसरे Gateway पर स्विच करते हैं, तो ऐप को पुनः कनेक्ट करें ताकि वह उस Gateway से बँधा नया रिले पंजीकरण प्रकाशित कर सके।
    - यदि आप ऐसा नया iOS बिल्ड जारी करते हैं जो किसी भिन्न रिले डिप्लॉयमेंट की ओर इंगित करता है, तो ऐप पुराने रिले मूल का पुनः उपयोग करने के बजाय अपने कैश किए गए रिले पंजीकरण को रीफ़्रेश करता है।

    संगतता टिप्पणी:

    - `OPENCLAW_APNS_RELAY_BASE_URL` और `OPENCLAW_APNS_RELAY_TIMEOUT_MS` अस्थायी परिवेश ओवरराइड के रूप में अब भी काम करते हैं।
    - कस्टम Gateway रिले URL को iOS बिल्ड में अंतर्निहित रिले बेस URL से मेल खाना चाहिए; सार्वजनिक App Store रिलीज़ लेन कस्टम iOS रिले URL ओवरराइड अस्वीकार करती है।
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` केवल लूपबैक वाला विकास आपात-मार्ग बना हुआ है; HTTP रिले URL को कॉन्फ़िगरेशन में स्थायी न रखें।

    शुरू से अंत तक के प्रवाह के लिए [iOS ऐप](/hi/platforms/ios#relay-backed-push-for-official-builds) और रिले सुरक्षा मॉडल के लिए [प्रमाणीकरण और विश्वास प्रवाह](/hi/platforms/ios#authentication-and-trust-flow) देखें।

  </Accordion>

  <Accordion title="Heartbeat (आवधिक चेक-इन) सेट करें">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: अवधि स्ट्रिंग (`30m`, `2h`)। अक्षम करने के लिए `0m` सेट करें। डिफ़ॉल्ट: `30m`।
    - `target`: `last` | `none` | `<channel-id>` (उदाहरण के लिए `discord`, `matrix`, `telegram`, या `whatsapp`)
    - `directPolicy`: DM-शैली Heartbeat लक्ष्यों के लिए `allow` (डिफ़ॉल्ट) या `block`
    - संपूर्ण मार्गदर्शिका के लिए [Heartbeat](/hi/gateway/heartbeat) देखें।

  </Accordion>

  <Accordion title="Cron जॉब कॉन्फ़िगर करें">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // डिफ़ॉल्ट; Cron प्रेषण + पृथक Cron एजेंट-टर्न निष्पादन
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: SQLite सत्र पंक्तियों से पूर्ण हो चुके पृथक रन सत्र हटाएँ (डिफ़ॉल्ट `24h`; अक्षम करने के लिए `false` सेट करें)।
    - रन इतिहास प्रत्येक जॉब के लिए नवीनतम 2000 टर्मिनल पंक्तियाँ स्वचालित रूप से रखता है; खोई हुई पंक्तियाँ अपनी 24-घंटे की सफ़ाई अवधि बनाए रखती हैं।
    - सुविधा अवलोकन और CLI उदाहरणों के लिए [Cron जॉब](/hi/automation/cron-jobs) देखें।

  </Accordion>

  <Accordion title="Webhook (हुक) सेट करें">
    Gateway पर HTTP Webhook एंडपॉइंट सक्षम करें:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    सुरक्षा टिप्पणी:
    - सभी हुक/Webhook पेलोड सामग्री को अविश्वसनीय इनपुट मानें।
    - एक समर्पित `hooks.token` का उपयोग करें; सक्रिय Gateway प्रमाणीकरण सीक्रेट (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) का पुनः उपयोग न करें।
    - हुक प्रमाणीकरण केवल हेडर से होता है (`Authorization: Bearer ...` या `x-openclaw-token`); क्वेरी-स्ट्रिंग टोकन अस्वीकार किए जाते हैं।
    - `hooks.path`, `/` नहीं हो सकता; Webhook प्रवेश को `/hooks` जैसे समर्पित उपपथ पर रखें।
    - असुरक्षित-सामग्री बायपास फ़्लैग (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) को अक्षम रखें, जब तक कि बहुत सीमित दायरे में डीबगिंग न की जा रही हो।
    - यदि आप `hooks.allowRequestSessionKey` सक्षम करते हैं, तो कॉलर द्वारा चुनी गई सत्र कुंजियों को सीमित करने के लिए `hooks.allowedSessionKeyPrefixes` भी सेट करें।
    - हुक-संचालित एजेंटों के लिए सशक्त आधुनिक मॉडल स्तर और कठोर टूल नीति को प्राथमिकता दें (उदाहरण के लिए केवल संदेश-प्रेषण तथा जहाँ संभव हो वहाँ सैंडबॉक्सिंग)।

    सभी मैपिंग विकल्पों और Gmail एकीकरण के लिए [पूर्ण संदर्भ](/hi/gateway/configuration-reference#hooks) देखें।

  </Accordion>

  <Accordion title="बहु-एजेंट रूटिंग कॉन्फ़िगर करें">
    अलग-अलग कार्यस्थलों और सत्रों वाले कई पृथक एजेंट चलाएँ:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    बाइंडिंग नियमों और प्रत्येक एजेंट के एक्सेस प्रोफ़ाइल के लिए [बहु-एजेंट](/hi/concepts/multi-agent) और [पूर्ण संदर्भ](/hi/gateway/config-agents#multi-agent-routing) देखें।

  </Accordion>

  <Accordion title="कॉन्फ़िगरेशन को कई फ़ाइलों में विभाजित करें ($include)">
    बड़े कॉन्फ़िगरेशन व्यवस्थित करने के लिए `$include` का उपयोग करें:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **एकल फ़ाइल**: इसे समाहित करने वाले ऑब्जेक्ट को प्रतिस्थापित करती है
    - **फ़ाइलों की सरणी**: क्रम में गहराई से मर्ज होती है (बाद वाली प्रभावी होती है), अधिकतम 10 नेस्टेड स्तर तक
    - **सहोदर कुंजियाँ**: समावेशन के बाद मर्ज होती हैं (समाविष्ट मानों को ओवरराइड करती हैं)
    - **सापेक्ष पथ**: समावेश करने वाली फ़ाइल के सापेक्ष हल होते हैं
    - **पथ प्रारूप**: समावेशन पथ में नल बाइट नहीं हो सकती और हल किए जाने से पहले तथा बाद में उसकी लंबाई सख्ती से 4096 वर्णों से कम होनी चाहिए
    - **OpenClaw के स्वामित्व वाले लेखन**: जब कोई लेखन केवल एक शीर्ष-स्तरीय अनुभाग को बदलता है
      जो `plugins: { $include: "./plugins.json5" }` जैसे एकल-फ़ाइल समावेशन पर आधारित हो,
      तो OpenClaw उस समाविष्ट फ़ाइल को अपडेट करता है और `openclaw.json` को अक्षुण्ण रखता है
    - **असमर्थित आर-पार लेखन**: रूट समावेशन, समावेशन सरणियाँ और सहोदर ओवरराइड
      वाले समावेशन, कॉन्फ़िगरेशन को समतल करने के बजाय OpenClaw के स्वामित्व वाले लेखन के लिए
      सुरक्षित रूप से विफल होते हैं
    - **परिसीमन**: `$include` पथों को `openclaw.json` वाली डायरेक्टरी के अंतर्गत
      हल होना चाहिए। अलग-अलग मशीनों या उपयोगकर्ताओं के बीच ट्री साझा करने के लिए,
      `OPENCLAW_INCLUDE_ROOTS` को उन अतिरिक्त डायरेक्टरियों की पथ-सूची (`:` POSIX पर,
      `;` Windows पर) पर सेट करें, जिन्हें समावेशन संदर्भित कर सकते हैं। सिमलिंक हल करके
      दोबारा जाँचे जाते हैं, इसलिए ऐसा पथ जो शाब्दिक रूप से कॉन्फ़िगरेशन डायरेक्टरी में हो लेकिन जिसका
      वास्तविक लक्ष्य हर अनुमत रूट से बाहर निकलता हो, फिर भी अस्वीकार किया जाता है।
    - **त्रुटि प्रबंधन**: अनुपलब्ध फ़ाइलों, पार्स त्रुटियों, चक्रीय समावेशन, अमान्य पथ प्रारूप और अत्यधिक लंबाई के लिए स्पष्ट त्रुटियाँ

  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन हॉट रीलोड

Gateway `~/.openclaw/openclaw.json` पर नज़र रखता है और बदलाव स्वचालित रूप से लागू करता है—अधिकांश सेटिंग के लिए मैन्युअल रीस्टार्ट की आवश्यकता नहीं होती।

सीधे किए गए फ़ाइल संपादन सत्यापन होने तक अविश्वसनीय माने जाते हैं। वॉचर संपादक की अस्थायी-लेखन/नाम-बदलने की गतिविधि के स्थिर होने की प्रतीक्षा करता है, अंतिम फ़ाइल पढ़ता है, और `openclaw.json` को दोबारा लिखे बिना अमान्य बाहरी संपादन अस्वीकार करता है। OpenClaw के स्वामित्व वाले कॉन्फ़िगरेशन लेखन भी लिखने से पहले समान स्कीमा गेट का उपयोग करते हैं (प्रत्येक लेखन पर लागू अधिलेखन/रोलबैक नियमों के लिए [सख्त सत्यापन](#strict-validation) देखें)।

यदि आपको `config reload skipped (invalid config)` दिखाई दे या स्टार्टअप `Invalid
config` रिपोर्ट करे, तो कॉन्फ़िगरेशन की जाँच करें, `openclaw config validate` चलाएँ, फिर सुधार के लिए `openclaw
doctor --fix` चलाएँ। जाँच-सूची के लिए [Gateway समस्या निवारण](/hi/gateway/troubleshooting#gateway-rejected-invalid-config) देखें।

### रीलोड मोड

| मोड                   | व्यवहार                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (डिफ़ॉल्ट) | सुरक्षित बदलाव तुरंत हॉट-अप्लाई करता है। महत्वपूर्ण बदलावों के लिए अपने-आप पुनः आरंभ करता है।           |
| **`hot`**              | केवल सुरक्षित बदलाव हॉट-अप्लाई करता है। पुनः आरंभ की आवश्यकता होने पर चेतावनी लॉग करता है—इसे आप संभालते हैं। |
| **`restart`**          | कॉन्फ़िगरेशन में कोई भी बदलाव होने पर Gateway को पुनः आरंभ करता है, चाहे वह सुरक्षित हो या नहीं।                                 |
| **`off`**              | फ़ाइल निगरानी अक्षम करता है। बदलाव अगले मैन्युअल पुनः आरंभ पर प्रभावी होते हैं।                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### क्या हॉट-अप्लाई होता है और किसके लिए पुनः आरंभ आवश्यक है

अधिकांश फ़ील्ड बिना डाउनटाइम के हॉट-अप्लाई होते हैं; कुछ हॉट-अप्लाई किए गए अनुभाग पूरे Gateway के बजाय केवल उस
सब-सिस्टम (चैनल, cron, heartbeat, स्वास्थ्य मॉनिटर) को पुनः आरंभ करते हैं।
`hybrid` मोड में, Gateway को पुनः आरंभ करने वाले बदलाव अपने-आप संभाले जाते हैं।

| श्रेणी            | फ़ील्ड                                                                  | क्या Gateway पुनः आरंभ करना आवश्यक है?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| चैनल            | `channels.*`, `web` (WhatsApp)—सभी अंतर्निहित और plugin चैनल       | नहीं (उस चैनल को पुनः आरंभ करता है)   |
| एजेंट और मॉडल      | `agent`, `agents`, `models`, `routing`                                  | नहीं                           |
| स्वचालन          | `hooks`, `cron`, `agent.heartbeat`                                      | नहीं (उस सब-सिस्टम को पुनः आरंभ करता है) |
| सत्र और संदेश | `session`, `messages`                                                   | नहीं                           |
| टूल और मीडिया       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | नहीं                           |
| Plugin कॉन्फ़िगरेशन       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | नहीं (plugin रनटाइम को फिर से लोड करता है)  |
| UI और विविध           | `ui`, `logging`, `identity`, `bindings`                                 | नहीं                           |
| Gateway सर्वर      | `gateway.*` (पोर्ट, बाइंड, प्रमाणीकरण, tailscale, TLS, HTTP, पुश)              | **हाँ**                      |
| अवसंरचना      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **हाँ**                      |

<Note>
`gateway.reload` और `gateway.remote`, `gateway.*` के अंतर्गत अपवाद हैं—इन्हें बदलने से पुनः आरंभ **नहीं** होता। अलग-अलग plugins भी इस तालिका को ओवरराइड कर सकते हैं: कोई लोड किया गया plugin अपने स्वयं के पुनः आरंभ को सक्रिय करने वाले कॉन्फ़िगरेशन प्रीफ़िक्स घोषित कर सकता है (उदाहरण के लिए, बंडल किया गया Canvas plugin केवल अपने `plugins.entries.canvas` के लिए ही नहीं, बल्कि `plugins.enabled`, `plugins.allow`, और `plugins.deny` के लिए भी Gateway को पुनः आरंभ करता है), इसलिए वास्तविक व्यवहार इस पर निर्भर करता है कि कौन-से plugins सक्रिय हैं।
</Note>

### पुनः लोड की योजना

जब आप `$include` के माध्यम से संदर्भित किसी स्रोत फ़ाइल को संपादित करते हैं, तो OpenClaw
समतल इन-मेमोरी दृश्य से नहीं, बल्कि स्रोत में लिखे गए लेआउट से पुनः लोड की योजना बनाता है।
इससे हॉट-रीलोड के निर्णय (हॉट-अप्लाई बनाम पुनः आरंभ) तब भी पूर्वानुमेय बने रहते हैं, जब
कोई एक शीर्ष-स्तरीय अनुभाग अपनी शामिल फ़ाइल, जैसे
`plugins: { $include: "./plugins.json5" }`, में मौजूद हो। यदि
स्रोत लेआउट अस्पष्ट हो, तो पुनः लोड की योजना सुरक्षित रूप से विफल हो जाती है।

## कॉन्फ़िगरेशन RPC (प्रोग्रामेटिक अपडेट)

Gateway API के माध्यम से कॉन्फ़िगरेशन लिखने वाले टूल के लिए इस प्रवाह को प्राथमिकता दें:

- `config.schema.lookup` से एक सबट्री का निरीक्षण करें (उथला स्कीमा नोड + चाइल्ड
  सारांश)
- `config.get` से मौजूदा स्नैपशॉट और `hash` प्राप्त करें
- आंशिक अपडेट के लिए `config.patch` (JSON मर्ज पैच: ऑब्जेक्ट मर्ज होते हैं, `null`
  हटाता है, और यदि प्रविष्टियाँ हटाई जाएँगी तो `replacePaths` से स्पष्ट पुष्टि मिलने पर
  ऐरे प्रतिस्थापित होते हैं)
- `config.apply` केवल तभी, जब आपका उद्देश्य पूरे कॉन्फ़िगरेशन को बदलना हो
- स्पष्ट स्व-अपडेट और पुनः आरंभ के लिए `update.run`; यदि पुनः आरंभ के बाद के सत्र को एक अनुवर्ती टर्न चलाना चाहिए, तो `continuationMessage` शामिल करें
- नवीनतम अपडेट-पुनः आरंभ सेंटिनल का निरीक्षण करने और पुनः आरंभ के बाद चल रहे संस्करण को सत्यापित करने के लिए `update.status`

सटीक फ़ील्ड-स्तरीय दस्तावेज़ और प्रतिबंधों के लिए एजेंटों को पहले
`config.schema.lookup` देखना चाहिए। जब उन्हें व्यापक कॉन्फ़िगरेशन मानचित्र, डिफ़ॉल्ट या समर्पित
सब-सिस्टम संदर्भों के लिंक चाहिए, तो [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
का उपयोग करें।

<Note>
कंट्रोल-प्लेन लेखन (`config.apply`, `config.patch`, `update.run`) पर
प्रति विधि, प्रति `deviceId+clientIp`, प्रत्येक 60 सेकंड में 30 अनुरोधों की
दर सीमा लागू है; [दर सीमांकन](/hi/gateway/security/rate-limiting) देखें। पुनः आरंभ
अनुरोध एकत्रित होते हैं और फिर पुनः आरंभ चक्रों के बीच 30-सेकंड का कूलडाउन लागू करते हैं।
`update.status` केवल-पढ़ने योग्य है, लेकिन व्यवस्थापक-स्कोप वाला है क्योंकि पुनः आरंभ सेंटिनल में
अपडेट चरणों के सारांश और कमांड आउटपुट के अंतिम हिस्से शामिल हो सकते हैं।
</Note>

आंशिक पैच का उदाहरण:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash कैप्चर करें
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` और `config.patch` दोनों `raw`, `baseHash`, `sessionKey`,
`note`, और `restartDelayMs` स्वीकार करते हैं। कॉन्फ़िगरेशन फ़ाइल पहले से मौजूद होने पर दोनों विधियों के लिए
`baseHash` आवश्यक है (यदि कोई मौजूदा कॉन्फ़िगरेशन नहीं है, तो पहला लेखन इस जाँच को छोड़ देता है)।

`config.patch`, `replacePaths` भी स्वीकार करता है, जो उन कॉन्फ़िगरेशन पथों का ऐरे है जिनका ऐरे
प्रतिस्थापन जानबूझकर किया गया है। यदि कोई पैच किसी मौजूदा ऐरे को कम प्रविष्टियों वाले ऐरे से बदलता
या हटाता है, तो Gateway लेखन को अस्वीकार कर देता है, जब तक कि वही सटीक पथ
`replacePaths` में मौजूद न हो; ऐरे प्रविष्टियों के अंतर्गत नेस्टेड ऐरे `[]` का उपयोग करते हैं, जैसे
`agents.list[].skills`। इससे काटे गए `config.get` स्नैपशॉट
रूटिंग या अनुमत-सूची ऐरे को चुपचाप ओवरराइट नहीं कर पाते। जब आपका उद्देश्य
पूरे कॉन्फ़िगरेशन को बदलना हो, तो `config.apply` का उपयोग करें।

## पर्यावरण चर

OpenClaw मूल प्रक्रिया के साथ-साथ इनसे भी पर्यावरण चर पढ़ता है:

- मौजूदा कार्यशील डायरेक्टरी से `.env` (यदि मौजूद हो)
- `~/.openclaw/.env` (वैश्विक फ़ॉलबैक)

कोई भी फ़ाइल मौजूदा पर्यावरण चरों को ओवरराइड नहीं करती। आप कॉन्फ़िगरेशन में इनलाइन पर्यावरण चर भी सेट कर सकते हैं:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="शेल पर्यावरण आयात (वैकल्पिक)">
  यदि यह सक्षम है और अपेक्षित कुंजियाँ सेट नहीं हैं, तो OpenClaw आपका लॉगिन शेल चलाता है और केवल अनुपलब्ध कुंजियाँ आयात करता है:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

समतुल्य पर्यावरण चर: `OPENCLAW_LOAD_SHELL_ENV=1`। डिफ़ॉल्ट `timeoutMs`: `15000`।
</Accordion>

<Accordion title="कॉन्फ़िगरेशन मानों में पर्यावरण चर प्रतिस्थापन">
  किसी भी कॉन्फ़िगरेशन स्ट्रिंग मान में `${VAR_NAME}` के साथ पर्यावरण चरों का संदर्भ दें:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

नियम:

- केवल बड़े अक्षरों वाले नाम मिलाए जाते हैं: `[A-Z_][A-Z0-9_]*`
- अनुपलब्ध/रिक्त चर लोड होते समय त्रुटि उत्पन्न करते हैं
- शाब्दिक आउटपुट के लिए `$${VAR}` से एस्केप करें
- `$include` फ़ाइलों के भीतर काम करता है
- इनलाइन प्रतिस्थापन: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="गोपनीय संदर्भ (पर्यावरण, फ़ाइल, निष्पादन)">
  SecretRef ऑब्जेक्ट का समर्थन करने वाले फ़ील्ड के लिए आप इसका उपयोग कर सकते हैं:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef का विवरण (`env`/`file`/`exec` के लिए `secrets.providers` सहित) [गोपनीयता प्रबंधन](/hi/gateway/secrets) में उपलब्ध है।
समर्थित क्रेडेंशियल पथ [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) में सूचीबद्ध हैं।
</Accordion>

पूर्ण प्राथमिकता क्रम और स्रोतों के लिए [पर्यावरण](/hi/help/environment) देखें।

## पूर्ण संदर्भ

फ़ील्ड-दर-फ़ील्ड संपूर्ण संदर्भ के लिए **[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)** देखें।

---

_संबंधित: [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) · [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) · [Doctor](/hi/gateway/doctor)_

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples)
- [Gateway रनबुक](/hi/gateway)
