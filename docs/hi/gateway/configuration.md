---
read_when:
    - पहली बार OpenClaw सेट अप करना
    - सामान्य कॉन्फ़िगरेशन पैटर्न खोजे जा रहे हैं
    - विशिष्ट कॉन्फ़िगरेशन अनुभागों पर जाना
summary: 'कॉन्फ़िगरेशन का अवलोकन: सामान्य कार्य, त्वरित सेटअप और संपूर्ण संदर्भ के लिंक'
title: कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-07-16T14:41:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw `~/.openclaw/openclaw.json` से वैकल्पिक <Tooltip tip="JSON5 टिप्पणियों और अंतिम अल्पविरामों का समर्थन करता है">**JSON5**</Tooltip> कॉन्फ़िग पढ़ता है। यदि फ़ाइल मौजूद नहीं है, तो OpenClaw सुरक्षित डिफ़ॉल्ट का उपयोग करता है।

सक्रिय कॉन्फ़िग पथ एक नियमित फ़ाइल होना चाहिए। OpenClaw द्वारा किए गए लेखन इसे परमाण्विक रूप से प्रतिस्थापित करते हैं (पथ पर नाम बदलकर), इसलिए सिमलिंक किए गए `openclaw.json` में लिखने के बजाय उसका लक्ष्य प्रतिस्थापित हो जाता है—सिमलिंक किए गए कॉन्फ़िग लेआउट से बचें। यदि आप कॉन्फ़िग को डिफ़ॉल्ट स्थिति डायरेक्टरी के बाहर रखते हैं, तो `OPENCLAW_CONFIG_PATH` को सीधे वास्तविक फ़ाइल की ओर इंगित करें।

कॉन्फ़िग जोड़ने के सामान्य कारण:

- चैनल कनेक्ट करें और नियंत्रित करें कि बॉट को कौन संदेश भेज सकता है
- मॉडल, टूल, सैंडबॉक्सिंग या स्वचालन (cron, हुक) सेट करें
- सेशन, मीडिया, नेटवर्किंग या UI को अनुकूलित करें

हर उपलब्ध फ़ील्ड के लिए [पूरा संदर्भ](/hi/gateway/configuration-reference) देखें।

कॉन्फ़िग संपादित करने से पहले एजेंट और स्वचालन को फ़ील्ड-स्तर के सटीक
दस्तावेज़ों के लिए `config.schema.lookup` का उपयोग करना चाहिए। कार्य-उन्मुख मार्गदर्शन के लिए इस पृष्ठ और
व्यापक फ़ील्ड मानचित्र तथा डिफ़ॉल्ट के लिए
[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) का उपयोग करें।

<Tip>
**कॉन्फ़िगरेशन में नए हैं?** इंटरैक्टिव सेटअप के लिए `openclaw onboard` से शुरू करें या पूरी तरह कॉपी-पेस्ट किए जा सकने वाले कॉन्फ़िग के लिए [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) मार्गदर्शिका देखें।
</Tip>

## न्यूनतम कॉन्फ़िग

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## कॉन्फ़िग संपादित करना

<Tabs>
  <Tab title="इंटरैक्टिव विज़ार्ड">
    ```bash
    openclaw onboard       # पूरी ऑनबोर्डिंग प्रक्रिया
    openclaw configure     # कॉन्फ़िग विज़ार्ड
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
    [http://127.0.0.1:18789](http://127.0.0.1:18789) खोलें और **कॉन्फ़िग** टैब का उपयोग करें।
    नियंत्रण UI लाइव कॉन्फ़िग स्कीमा से एक फ़ॉर्म रेंडर करता है, जिसमें उपलब्ध होने पर फ़ील्ड
    `title` / `description` दस्तावेज़ मेटाडेटा के साथ Plugin और चैनल स्कीमा
    शामिल होते हैं तथा वैकल्पिक उपाय के रूप में **अपरिष्कृत JSON** संपादक मिलता है। विस्तृत
    UI और अन्य टूलिंग के लिए Gateway एक पथ-स्कोप वाला स्कीमा नोड और उसके निकटतम चाइल्ड सारांश
    प्राप्त करने हेतु `config.schema.lookup` भी उपलब्ध कराता है।
  </Tab>
  <Tab title="प्रत्यक्ष संपादन">
    `~/.openclaw/openclaw.json` को सीधे संपादित करें। Gateway फ़ाइल पर नज़र रखता है और परिवर्तनों को स्वचालित रूप से लागू करता है ([हॉट रीलोड](#config-hot-reload) देखें)।
  </Tab>
</Tabs>

## कठोर सत्यापन

<Warning>
OpenClaw केवल उन कॉन्फ़िगरेशन को स्वीकार करता है जो स्कीमा से पूरी तरह मेल खाते हैं। अज्ञात कुंजियों, विकृत प्रकारों या अमान्य मानों के कारण Gateway **आरंभ होने से इनकार कर देता है**। रूट स्तर का एकमात्र अपवाद `$schema` (स्ट्रिंग) है, ताकि संपादक JSON Schema मेटाडेटा संलग्न कर सकें।
</Warning>

`openclaw config schema` नियंत्रण UI और सत्यापन द्वारा उपयोग किया जाने वाला प्रामाणिक JSON Schema
प्रिंट करता है। `config.schema.lookup` विस्तृत टूलिंग के लिए एक पथ-स्कोप वाला नोड और
चाइल्ड सारांश प्राप्त करता है। फ़ील्ड `title`/`description` दस्तावेज़ मेटाडेटा
नेस्टेड ऑब्जेक्ट, वाइल्डकार्ड (`*`), ऐरे-आइटम (`[]`) और `anyOf`/
`oneOf`/`allOf` शाखाओं में आगे बढ़ता है। मैनिफ़ेस्ट रजिस्ट्री लोड होने पर रनटाइम Plugin और चैनल स्कीमा मर्ज हो जाते हैं।

सत्यापन विफल होने पर:

- Gateway बूट नहीं होता
- केवल निदान कमांड काम करते हैं (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- सटीक समस्याएँ देखने के लिए `openclaw doctor` चलाएँ
- सुधार लागू करने के लिए `openclaw doctor --fix` चलाएँ (`--repair` समान फ़्लैग है; `--yes` प्रॉम्प्ट छोड़ देता है)

प्रत्येक सफल स्टार्टअप के बाद Gateway अंतिम ज्ञात विश्वसनीय प्रति रखता है,
लेकिन स्टार्टअप और हॉट रीलोड इसे स्वचालित रूप से पुनर्स्थापित नहीं करते—केवल `openclaw doctor --fix`
ऐसा करता है। यदि `openclaw.json` सत्यापन में विफल होता है (Plugin-स्थानीय सत्यापन सहित), तो Gateway
का स्टार्टअप विफल हो जाता है या रीलोड छोड़ दिया जाता है और वर्तमान रनटाइम अंतिम स्वीकृत
कॉन्फ़िग का उपयोग जारी रखता है। अस्वीकृत लेखन को निरीक्षण के लिए `<path>.rejected.<timestamp>` के रूप में भी सहेजा जाता है।
Gateway उन लेखनों को रोकता है जो आकस्मिक अधिलेखन जैसे दिखाई देते हैं—`gateway.mode` हटाना,
`meta` ब्लॉक खोना या फ़ाइल को आधे से अधिक छोटा करना—जब तक कि लेखन
विनाशकारी परिवर्तनों की स्पष्ट अनुमति न दे। यदि किसी प्रत्याशी में `***` या `[redacted]` जैसा
संशोधित गुप्त मान प्लेसहोल्डर हो, तो उसे अंतिम ज्ञात विश्वसनीय प्रति के रूप में पदोन्नत नहीं किया जाता।

## सामान्य कार्य

<AccordionGroup>
  <Accordion title="चैनल सेट अप करें (WhatsApp, Telegram, Discord आदि)">
    प्रत्येक चैनल का `channels.<provider>` के अंतर्गत अपना कॉन्फ़िग अनुभाग होता है। सेटअप चरणों के लिए समर्पित चैनल पृष्ठ देखें:

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

    - `agents.defaults.models` मॉडल कैटलॉग परिभाषित करता है और `/model` की अनुमति-सूची के रूप में काम करता है; `provider/*` प्रविष्टियाँ गतिशील मॉडल खोज का उपयोग जारी रखते हुए `/model`, `/models` और मॉडल चयनकर्ताओं को चुने हुए प्रदाताओं तक सीमित करती हैं।
    - मौजूदा मॉडल हटाए बिना अनुमति-सूची प्रविष्टियाँ जोड़ने के लिए `openclaw config set agents.defaults.models '<json>' --strict-json --merge` का उपयोग करें। प्रविष्टियाँ हटाने वाले सामान्य प्रतिस्थापन तब तक अस्वीकार किए जाते हैं, जब तक आप `--replace` पास नहीं करते।
    - मॉडल संदर्भ `provider/model` प्रारूप का उपयोग करते हैं (उदाहरण: `anthropic/claude-opus-4-6`)।
    - `agents.defaults.imageMaxDimensionPx` ट्रांसक्रिप्ट/टूल छवियों के आकार में कमी नियंत्रित करता है (डिफ़ॉल्ट `1200`); कम मान आम तौर पर अधिक स्क्रीनशॉट वाले रन में विज़न-टोकन का उपयोग घटाते हैं।
    - चैट में मॉडल बदलने के लिए [मॉडल CLI](/hi/concepts/models) और प्रमाणीकरण रोटेशन तथा फ़ॉलबैक व्यवहार के लिए [मॉडल फ़ेलओवर](/hi/concepts/model-failover) देखें।
    - कस्टम/स्व-होस्टेड प्रदाताओं के लिए संदर्भ में [कस्टम प्रदाता](/hi/gateway/config-tools#custom-providers-and-base-urls) देखें।

  </Accordion>

  <Accordion title="नियंत्रित करें कि बॉट को कौन संदेश भेज सकता है">
    DM पहुँच को प्रत्येक चैनल के लिए `dmPolicy` (डिफ़ॉल्ट `"pairing"`) के माध्यम से नियंत्रित किया जाता है:

    - `"pairing"`: अज्ञात प्रेषकों को अनुमोदन के लिए एक बार उपयोग होने वाला पेयरिंग कोड मिलता है
    - `"allowlist"`: केवल `allowFrom` (या युग्मित अनुमति स्टोर) में मौजूद प्रेषक
    - `"open"`: आने वाले सभी DM की अनुमति दें (`allowFrom: ["*"]` आवश्यक)
    - `"disabled"`: सभी DM अनदेखे करें

    समूहों के लिए `groupPolicy` (`"allowlist" | "open" | "disabled"`) के साथ `groupAllowFrom` या चैनल-विशिष्ट अनुमति-सूचियों का उपयोग करें।

    प्रत्येक चैनल के विवरण के लिए [पूरा संदर्भ](/hi/gateway/config-channels#dm-and-group-access) देखें।

  </Accordion>

  <Accordion title="समूह चैट उल्लेख नियंत्रण सेट अप करें">
    समूह संदेशों के लिए डिफ़ॉल्ट रूप से **उल्लेख आवश्यक** होता है। प्रत्येक एजेंट के लिए ट्रिगर पैटर्न कॉन्फ़िगर करें। सामान्य समूह/चैनल उत्तर स्वचालित रूप से पोस्ट होते हैं; उन साझा कक्षों के लिए संदेश-टूल पथ चुनें जहाँ एजेंट को तय करना चाहिए कि कब बोलना है:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // हर जगह संदेश-टूल से भेजना आवश्यक करने के लिए "message_tool" सेट करें
        groupChat: {
          visibleReplies: "message_tool", // स्वैच्छिक; दृश्य आउटपुट के लिए message(action=send) आवश्यक है
          unmentionedInbound: "room_event", // उल्लेख रहित हमेशा सक्रिय समूह बातचीत शांत संदर्भ होती है
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

    - **मेटाडेटा उल्लेख**: मूल @-उल्लेख (WhatsApp में टैप करके उल्लेख, Telegram @bot आदि)
    - **टेक्स्ट पैटर्न**: `mentionPatterns` में सुरक्षित रेगुलर एक्सप्रेशन पैटर्न
    - **दृश्य उत्तर**: `messages.visibleReplies` वैश्विक रूप से संदेश-टूल से भेजना आवश्यक कर सकता है; `messages.groupChat.visibleReplies` समूहों/चैनलों के लिए इसे ओवरराइड करता है।
    - दृश्य उत्तर मोड, प्रत्येक चैनल के ओवरराइड और स्वयं-चैट मोड के लिए [पूरा संदर्भ](/hi/gateway/config-channels#group-chat-mention-gating) देखें।

  </Accordion>

  <Accordion title="प्रत्येक एजेंट के लिए Skills सीमित करें">
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
          { id: "docs", skills: ["docs-search"] }, // डिफ़ॉल्ट प्रतिस्थापित करता है
          { id: "locked-down", skills: [] }, // कोई Skills नहीं
        ],
      },
    }
    ```

    - डिफ़ॉल्ट रूप से अप्रतिबंधित Skills के लिए `agents.defaults.skills` छोड़ दें।
    - डिफ़ॉल्ट इनहेरिट करने के लिए `agents.list[].skills` छोड़ दें।
    - कोई Skills न रखने के लिए `agents.list[].skills: []` सेट करें।
    - [Skills](/hi/tools/skills), [Skills कॉन्फ़िग](/hi/tools/skills-config) और
      [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agents-defaults-skills) देखें।

  </Accordion>

  <Accordion title="Gateway चैनल स्वास्थ्य निगरानी अनुकूलित करें">
    नियंत्रित करें कि Gateway पुराने प्रतीत होने वाले चैनलों को कितनी आक्रामकता से पुनः आरंभ करता है:

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

    - दिखाए गए मान डिफ़ॉल्ट हैं। स्वास्थ्य निगरानी द्वारा पुनः आरंभ को वैश्विक रूप से अक्षम करने के लिए `gateway.channelHealthCheckMinutes: 0` सेट करें।
    - `channelStaleEventThresholdMinutes` जाँच अंतराल से अधिक या उसके बराबर होना चाहिए।
    - वैश्विक निगरानी अक्षम किए बिना किसी एक चैनल या खाते के लिए स्वचालित पुनः आरंभ अक्षम करने हेतु `channels.<provider>.healthMonitor.enabled` या `channels.<provider>.accounts.<id>.healthMonitor.enabled` का उपयोग करें।
    - परिचालन डीबगिंग के लिए [स्वास्थ्य जाँच](/hi/gateway/health) और सभी फ़ील्ड के लिए [पूरा संदर्भ](/hi/gateway/configuration-reference#gateway) देखें।

  </Accordion>

  <Accordion title="Gateway WebSocket हैंडशेक टाइमआउट अनुकूलित करें">
    अधिक लोड वाले या कम क्षमता वाले होस्ट पर स्थानीय क्लाइंट को प्रमाणीकरण-पूर्व WebSocket हैंडशेक
    पूरा करने के लिए अधिक समय दें:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - डिफ़ॉल्ट `15000` मिलीसेकंड है।
    - एकबारगी सेवा या शेल ओवरराइड के लिए `OPENCLAW_HANDSHAKE_TIMEOUT_MS` को अब भी प्राथमिकता मिलती है।
    - पहले स्टार्टअप/इवेंट-लूप अवरोधों को ठीक करने को प्राथमिकता दें; यह नियंत्रण उन होस्ट के लिए है जो स्वस्थ हैं लेकिन वार्मअप के दौरान धीमे होते हैं।

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
    - `threadBindings`: थ्रेड-बद्ध सत्र रूटिंग के लिए वैश्विक डिफ़ॉल्ट। `/focus`, `/unfocus`, `/agents`, `/session idle`, और `/session max-age` प्रत्येक सत्र के लिए इसे क्रमशः बाँधते, खोलते, सूचीबद्ध और समायोजित करते हैं (Discord थ्रेड बाँधता है, Telegram विषय/वार्तालाप बाँधता है)।
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

    पहले इमेज बनाएँ—स्रोत चेकआउट से `scripts/sandbox-setup.sh` चलाएँ, या npm इंस्टॉलेशन के लिए [सैंडबॉक्सिंग § इमेज और सेटअप](/hi/gateway/sandboxing#images-and-setup) में इनलाइन `docker build` कमांड देखें।

    पूरी मार्गदर्शिका के लिए [सैंडबॉक्सिंग](/hi/gateway/sandboxing) और सभी विकल्पों के लिए [पूर्ण संदर्भ](/hi/gateway/config-agents#agentsdefaultssandbox) देखें।

  </Accordion>

  <Accordion title="आधिकारिक iOS बिल्ड के लिए रिले-समर्थित पुश सक्षम करें">
    सार्वजनिक App Store बिल्ड के लिए रिले-समर्थित पुश होस्ट किए गए OpenClaw रिले का उपयोग करता है: `https://ios-push-relay.openclaw.ai`।

    कस्टम रिले परिनियोजन के लिए जानबूझकर अलग iOS बिल्ड/परिनियोजन पथ आवश्यक है, जिसका रिले URL Gateway रिले URL से मेल खाता हो। यदि आप कस्टम रिले बिल्ड का उपयोग कर रहे हैं, तो Gateway कॉन्फ़िगरेशन में इसे सेट करें:

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

    समकक्ष CLI कमांड:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    यह क्या करता है:

    - Gateway को बाहरी रिले के माध्यम से `push.test`, सक्रिय करने के संकेत और पुनः कनेक्ट करने के लिए सक्रिय करने के संकेत भेजने देता है।
    - युग्मित iOS ऐप द्वारा अग्रेषित, पंजीकरण-स्कोप वाला प्रेषण अनुदान उपयोग करता है। Gateway को पूरे परिनियोजन के लिए रिले टोकन की आवश्यकता नहीं होती।
    - प्रत्येक रिले-समर्थित पंजीकरण को उस Gateway पहचान से बाँधता है जिसके साथ iOS ऐप को युग्मित किया गया था, ताकि कोई अन्य Gateway संग्रहीत पंजीकरण का पुनः उपयोग न कर सके।
    - स्थानीय/मैन्युअल iOS बिल्ड को प्रत्यक्ष APNs पर बनाए रखता है। रिले-समर्थित प्रेषण केवल उन आधिकारिक रूप से वितरित बिल्ड पर लागू होते हैं जिन्होंने रिले के माध्यम से पंजीकरण किया है।
    - इसे iOS बिल्ड में अंतर्निहित रिले आधार URL से मेल खाना आवश्यक है, ताकि पंजीकरण और प्रेषण ट्रैफ़िक एक ही रिले परिनियोजन तक पहुँचे।

    आरंभ से अंत तक का प्रवाह:

    1. आधिकारिक iOS ऐप इंस्टॉल करें।
    2. वैकल्पिक: केवल जानबूझकर अलग कस्टम रिले बिल्ड का उपयोग करते समय Gateway पर `gateway.push.apns.relay.baseUrl` कॉन्फ़िगर करें।
    3. iOS ऐप को Gateway से युग्मित करें और Node तथा ऑपरेटर, दोनों सत्रों को कनेक्ट होने दें।
    4. iOS ऐप Gateway पहचान प्राप्त करता है, App Attest और ऐप रसीद का उपयोग करके रिले के साथ पंजीकरण करता है, और फिर रिले-समर्थित `push.apns.register` पेलोड को युग्मित Gateway पर प्रकाशित करता है।
    5. Gateway रिले हैंडल और प्रेषण अनुदान संग्रहीत करता है, फिर उन्हें `push.test`, सक्रिय करने के संकेतों और पुनः कनेक्ट करने के लिए सक्रिय करने के संकेतों हेतु उपयोग करता है।

    संचालन संबंधी टिप्पणियाँ:

    - यदि आप iOS ऐप को किसी दूसरे Gateway पर स्विच करते हैं, तो ऐप को पुनः कनेक्ट करें ताकि वह उस Gateway से बँधा नया रिले पंजीकरण प्रकाशित कर सके।
    - यदि आप ऐसा नया iOS बिल्ड जारी करते हैं जो किसी दूसरे रिले परिनियोजन की ओर इंगित करता है, तो ऐप पुराने रिले मूल का पुनः उपयोग करने के बजाय अपने कैश किए गए रिले पंजीकरण को रीफ़्रेश करता है।

    संगतता संबंधी टिप्पणी:

    - `OPENCLAW_APNS_RELAY_BASE_URL` और `OPENCLAW_APNS_RELAY_TIMEOUT_MS` अब भी अस्थायी परिवेश ओवरराइड के रूप में काम करते हैं।
    - कस्टम Gateway रिले URL को iOS बिल्ड में अंतर्निहित रिले आधार URL से मेल खाना आवश्यक है; सार्वजनिक App Store रिलीज़ लेन कस्टम iOS रिले URL ओवरराइड अस्वीकार करती है।
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` केवल लूपबैक वाला विकास आपात-मार्ग बना हुआ है; HTTP रिले URL को कॉन्फ़िगरेशन में स्थायी रूप से संग्रहीत न करें।

    आरंभ से अंत तक के प्रवाह के लिए [iOS ऐप](/hi/platforms/ios#relay-backed-push-for-official-builds) और रिले सुरक्षा मॉडल के लिए [प्रमाणीकरण और विश्वास प्रवाह](/hi/platforms/ios#authentication-and-trust-flow) देखें।

  </Accordion>

  <Accordion title="Heartbeat (आवधिक चेक-इन) सेट अप करें">
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
    - `directPolicy`: DM-शैली के Heartbeat लक्ष्यों के लिए `allow` (डिफ़ॉल्ट) या `block`
    - पूरी मार्गदर्शिका के लिए [Heartbeat](/hi/gateway/heartbeat) देखें।

  </Accordion>

  <Accordion title="Cron कार्य कॉन्फ़िगर करें">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // डिफ़ॉल्ट; cron प्रेषण + पृथक cron एजेंट-टर्न निष्पादन
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: SQLite सत्र पंक्तियों से पूर्ण हुए पृथक रन सत्रों को हटाएँ (डिफ़ॉल्ट `24h`; अक्षम करने के लिए `false` सेट करें)।
    - रन इतिहास प्रत्येक कार्य के लिए नवीनतम 2000 टर्मिनल पंक्तियाँ स्वचालित रूप से रखता है; खोई हुई पंक्तियों के लिए उनकी 24-घंटे की सफ़ाई अवधि बनी रहती है।
    - सुविधा के अवलोकन और CLI उदाहरणों के लिए [Cron कार्य](/hi/automation/cron-jobs) देखें।

  </Accordion>

  <Accordion title="Webhook (हुक) सेट अप करें">
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

    सुरक्षा संबंधी टिप्पणी:
    - सभी हुक/Webhook पेलोड सामग्री को अविश्वसनीय इनपुट मानें।
    - एक समर्पित `hooks.token` उपयोग करें; सक्रिय Gateway प्रमाणीकरण सीक्रेट (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) का पुनः उपयोग न करें।
    - हुक प्रमाणीकरण केवल हेडर के माध्यम से होता है (`Authorization: Bearer ...` या `x-openclaw-token`); क्वेरी-स्ट्रिंग टोकन अस्वीकार किए जाते हैं।
    - `hooks.path`, `/` नहीं हो सकता; Webhook प्रवेश को `/hooks` जैसे समर्पित उपपथ पर रखें।
    - असुरक्षित-सामग्री बायपास फ़्लैग (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) अक्षम रखें, जब तक कि बहुत सीमित दायरे में डीबगिंग न की जा रही हो।
    - यदि आप `hooks.allowRequestSessionKey` सक्षम करते हैं, तो कॉलर द्वारा चुनी गई सत्र कुंजियों को सीमित करने के लिए `hooks.allowedSessionKeyPrefixes` भी सेट करें।
    - हुक-संचालित एजेंटों के लिए, सशक्त आधुनिक मॉडल टियर और कठोर टूल नीति को प्राथमिकता दें (उदाहरण के लिए केवल संदेश सेवा और जहाँ संभव हो वहाँ सैंडबॉक्सिंग)।

    सभी मैपिंग विकल्पों और Gmail एकीकरण के लिए [पूर्ण संदर्भ](/hi/gateway/configuration-reference#hooks) देखें।

  </Accordion>

  <Accordion title="बहु-एजेंट रूटिंग कॉन्फ़िगर करें">
    अलग-अलग कार्यक्षेत्रों और सत्रों वाले कई पृथक एजेंट चलाएँ:

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

    बाइंडिंग नियमों और प्रत्येक एजेंट के पहुँच प्रोफ़ाइल के लिए [बहु-एजेंट](/hi/concepts/multi-agent) और [पूर्ण संदर्भ](/hi/gateway/config-agents#multi-agent-routing) देखें।

  </Accordion>

  <Accordion title="कॉन्फ़िगरेशन को एकाधिक फ़ाइलों में विभाजित करें ($include)">
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

    - **एकल फ़ाइल**: समावेशी ऑब्जेक्ट को प्रतिस्थापित करती है
    - **फ़ाइलों की सरणी**: क्रम में गहराई से मर्ज होती हैं (बाद वाली प्रभावी होती है), अधिकतम 10 नेस्टेड स्तरों तक
    - **सहोदर कुंजियाँ**: समावेशन के बाद मर्ज होती हैं (समावेशित मानों को ओवरराइड करती हैं)
    - **सापेक्ष पथ**: समावेश करने वाली फ़ाइल के सापेक्ष हल किए जाते हैं
    - **पथ प्रारूप**: समावेशन पथों में null बाइट नहीं होनी चाहिए और वे समाधान से पहले तथा बाद में 4096 वर्णों से सख्ती से छोटे होने चाहिए
    - **OpenClaw के स्वामित्व वाले लेखन**: जब कोई लेखन केवल एक शीर्ष-स्तरीय अनुभाग को बदलता है
      जो `plugins: { $include: "./plugins.json5" }` जैसे एकल-फ़ाइल समावेशन द्वारा समर्थित हो,
      OpenClaw उस समावेशित फ़ाइल को अपडेट करता है और `openclaw.json` को अक्षुण्ण छोड़ता है
    - **असमर्थित आर-पार लेखन**: रूट समावेशन, समावेशन सरणियाँ और सहोदर ओवरराइड वाले
      समावेशन, कॉन्फ़िगरेशन को समतल करने के बजाय OpenClaw के स्वामित्व वाले
      लेखनों के लिए सुरक्षित रूप से विफल होते हैं
    - **सीमाबद्धता**: `$include` पथों को `openclaw.json` वाली
      डायरेक्टरी के अंतर्गत हल होना आवश्यक है। किसी ट्री को मशीनों या उपयोगकर्ताओं के बीच साझा करने के लिए,
      `OPENCLAW_INCLUDE_ROOTS` को अतिरिक्त डायरेक्टरियों की पथ-सूची (`:` POSIX पर,
      `;` Windows पर) पर सेट करें, जिन्हें समावेशन संदर्भित कर सकते हैं। सिमलिंक हल करके
      दोबारा जाँचे जाते हैं, इसलिए ऐसा पथ जो शाब्दिक रूप से कॉन्फ़िगरेशन डायरेक्टरी में हो लेकिन जिसका
      वास्तविक लक्ष्य प्रत्येक अनुमत रूट से बाहर जाता हो, फिर भी अस्वीकार किया जाता है।
    - **त्रुटि प्रबंधन**: अनुपस्थित फ़ाइलों, पार्स त्रुटियों, चक्रीय समावेशनों, अमान्य पथ प्रारूप और अत्यधिक लंबाई के लिए स्पष्ट त्रुटियाँ

  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन हॉट रीलोड

Gateway `~/.openclaw/openclaw.json` पर नज़र रखता है और बदलावों को स्वचालित रूप से लागू करता है—अधिकांश सेटिंग के लिए मैन्युअल पुनरारंभ आवश्यक नहीं है।

प्रत्यक्ष फ़ाइल संपादनों को सत्यापन होने तक अविश्वसनीय माना जाता है। वॉचर
एडिटर की अस्थायी-लेखन/नाम-बदलाव गतिविधि के स्थिर होने की प्रतीक्षा करता है, अंतिम फ़ाइल पढ़ता है और
`openclaw.json` को दोबारा लिखे बिना अमान्य बाहरी संपादन अस्वीकार करता है। OpenClaw के स्वामित्व वाले कॉन्फ़िगरेशन
लेखन भी लिखने से पहले उसी स्कीमा गेट का उपयोग करते हैं (प्रत्येक लेखन पर लागू क्लॉबर/रोलबैक नियमों के लिए
[कठोर सत्यापन](#strict-validation) देखें)।

यदि आपको `config reload skipped (invalid config)` दिखाई देता है या स्टार्टअप `Invalid
config` की सूचना देता है, तो कॉन्फ़िगरेशन का निरीक्षण करें, `openclaw config validate` चलाएँ, फिर सुधार के लिए `openclaw
doctor --fix` चलाएँ। जाँच-सूची के लिए [Gateway समस्या निवारण](/hi/gateway/troubleshooting#gateway-rejected-invalid-config)
देखें।

### रीलोड मोड

| मोड                   | व्यवहार                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (डिफ़ॉल्ट) | सुरक्षित बदलाव तुरंत हॉट-लागू करता है। महत्वपूर्ण बदलावों के लिए अपने-आप पुनः आरंभ करता है।           |
| **`hot`**              | केवल सुरक्षित बदलाव हॉट-लागू करता है। पुनः आरंभ की आवश्यकता होने पर चेतावनी लॉग करता है—इसे आप संभालते हैं। |
| **`restart`**          | किसी भी कॉन्फ़िगरेशन बदलाव पर Gateway को पुनः आरंभ करता है, चाहे वह सुरक्षित हो या नहीं।                                 |
| **`off`**              | फ़ाइल निगरानी अक्षम करता है। बदलाव अगले मैन्युअल पुनः आरंभ पर प्रभावी होते हैं।                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### क्या हॉट-लागू होता है और किसके लिए पुनः आरंभ आवश्यक है

अधिकांश फ़ील्ड बिना डाउनटाइम के हॉट-लागू होते हैं; कुछ हॉट-लागू अनुभाग पूरे Gateway के बजाय केवल उस
उप-प्रणाली (चैनल, Cron, Heartbeat, स्वास्थ्य मॉनिटर) को पुनः आरंभ करते हैं। 
`hybrid` मोड में, Gateway को पुनः आरंभ करने वाले आवश्यक बदलाव अपने-आप संभाले जाते हैं।

| श्रेणी            | फ़ील्ड                                                                  | Gateway पुनः आरंभ आवश्यक?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| चैनल            | `channels.*`, `web` (WhatsApp)—सभी अंतर्निहित और Plugin चैनल       | नहीं (उस चैनल को पुनः आरंभ करता है)   |
| एजेंट और मॉडल      | `agent`, `agents`, `models`, `routing`                                  | नहीं                           |
| स्वचालन          | `hooks`, `cron`, `agent.heartbeat`                                      | नहीं (उस उप-प्रणाली को पुनः आरंभ करता है) |
| सत्र और संदेश | `session`, `messages`                                                   | नहीं                           |
| टूल और मीडिया       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | नहीं                           |
| Plugin कॉन्फ़िगरेशन       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | नहीं (Plugin रनटाइम को पुनः लोड करता है)  |
| UI और विविध           | `ui`, `logging`, `identity`, `bindings`                                 | नहीं                           |
| Gateway सर्वर      | `gateway.*` (पोर्ट, बाइंड, प्रमाणीकरण, Tailscale, TLS, HTTP, पुश)              | **हाँ**                      |
| अवसंरचना      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **हाँ**                      |

<Note>
`gateway.reload` और `gateway.remote`, `gateway.*` के अंतर्गत अपवाद हैं—इन्हें बदलने से पुनः आरंभ **नहीं** होता। अलग-अलग Plugin भी इस तालिका को ओवरराइड कर सकते हैं: लोड किया गया कोई Plugin पुनः आरंभ कराने वाले अपने कॉन्फ़िगरेशन प्रीफ़िक्स घोषित कर सकता है (उदाहरण के लिए, बंडल किया गया Canvas Plugin केवल अपने `plugins.entries.canvas` के लिए ही नहीं, बल्कि `plugins.enabled`, `plugins.allow`, और `plugins.deny` के लिए भी Gateway को पुनः आरंभ करता है), इसलिए वास्तविक व्यवहार इस पर निर्भर करता है कि कौन-से Plugin सक्रिय हैं।
</Note>

### पुनः लोड की योजना

जब आप `$include` के माध्यम से संदर्भित किसी स्रोत फ़ाइल को संपादित करते हैं, तो OpenClaw
समतल इन-मेमोरी दृश्य से नहीं, बल्कि स्रोत में लिखे गए लेआउट से पुनः लोड की योजना बनाता है।
इससे हॉट-रीलोड निर्णय (हॉट-लागू करना बनाम पुनः आरंभ करना) तब भी पूर्वानुमेय बने रहते हैं, जब कोई
एकल शीर्ष-स्तरीय अनुभाग अपनी अलग शामिल फ़ाइल में हो, जैसे
`plugins: { $include: "./plugins.json5" }`। स्रोत लेआउट अस्पष्ट होने पर पुनः लोड योजना सुरक्षित रूप से विफल हो जाती है।

## कॉन्फ़िगरेशन RPC (प्रोग्रामेटिक अपडेट)

Gateway API के माध्यम से कॉन्फ़िगरेशन लिखने वाले टूल के लिए, इस प्रवाह को प्राथमिकता दें:

- `config.schema.lookup` से एक उप-वृक्ष का निरीक्षण करें (उथला स्कीमा नोड + चाइल्ड
  सारांश)
- `config.get` से वर्तमान स्नैपशॉट और `hash` प्राप्त करें
- `config.patch` से आंशिक अपडेट करें (JSON मर्ज पैच: ऑब्जेक्ट मर्ज होते हैं, `null`
  हटाता है, और यदि प्रविष्टियाँ हटेंगी तो `replacePaths` के साथ स्पष्ट पुष्टि किए जाने पर
  ऐरे प्रतिस्थापित होते हैं)
- `config.apply` का उपयोग केवल तभी करें, जब आप पूरे कॉन्फ़िगरेशन को बदलना चाहते हों
- `update.run` का उपयोग स्पष्ट स्व-अपडेट और पुनः आरंभ के लिए करें; यदि पुनः आरंभ के बाद सत्र को एक अनुवर्ती टर्न चलाना हो, तो `continuationMessage` शामिल करें
- `update.status` से नवीनतम अपडेट पुनः आरंभ सेंटिनल का निरीक्षण करें और पुनः आरंभ के बाद चल रहे संस्करण की पुष्टि करें

फ़ील्ड-स्तरीय सटीक दस्तावेज़ और बाधाओं के लिए एजेंट को पहले `config.schema.lookup` देखना चाहिए।
जब उन्हें व्यापक कॉन्फ़िगरेशन मानचित्र, डिफ़ॉल्ट, या समर्पित
उप-प्रणाली संदर्भों के लिंक चाहिए हों, तब [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
का उपयोग करें।

<Note>
कंट्रोल-प्लेन लेखन (`config.apply`, `config.patch`, `update.run`) की
दर प्रति `deviceId+clientIp`, 60 सेकंड में 3 अनुरोध तक सीमित है। पुनः आरंभ
अनुरोध एकत्रित किए जाते हैं और फिर पुनः आरंभ चक्रों के बीच 30-सेकंड की कूलडाउन अवधि लागू करते हैं।
`update.status` केवल-पढ़ने योग्य है, लेकिन व्यवस्थापक-स्कोप वाला है, क्योंकि पुनः आरंभ सेंटिनल में
अपडेट चरण के सारांश और कमांड आउटपुट के अंतिम अंश शामिल हो सकते हैं।
</Note>

आंशिक पैच का उदाहरण:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash कैप्चर करें
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` और `config.patch`, दोनों `raw`, `baseHash`, `sessionKey`,
`note`, और `restartDelayMs` स्वीकार करते हैं। कॉन्फ़िगरेशन फ़ाइल पहले से मौजूद होने पर, दोनों विधियों के लिए
`baseHash` आवश्यक है (यदि कोई मौजूदा कॉन्फ़िगरेशन नहीं है, तो पहला लेखन यह जाँच छोड़ देता है)।

`config.patch`, `replacePaths` भी स्वीकार करता है, जो उन कॉन्फ़िगरेशन पथों का ऐरे है जिनका ऐरे
प्रतिस्थापन जानबूझकर किया गया है। यदि कोई पैच किसी मौजूदा ऐरे को कम प्रविष्टियों वाले ऐरे से
प्रतिस्थापित या हटाता है, तो Gateway लेखन को तब तक अस्वीकार करता है, जब तक वही सटीक पथ
`replacePaths` में मौजूद न हो; ऐरे प्रविष्टियों के अंतर्गत नेस्टेड ऐरे `[]` का उपयोग करते हैं, जैसे
`agents.list[].skills`। यह संक्षिप्त किए गए `config.get` स्नैपशॉट को
रूटिंग या अनुमति-सूची ऐरे चुपचाप अधिलेखित करने से रोकता है। जब आप पूरा कॉन्फ़िगरेशन
प्रतिस्थापित करना चाहते हों, तब `config.apply` का उपयोग करें।

## पर्यावरण चर

OpenClaw पैरेंट प्रक्रिया के साथ-साथ इनसे पर्यावरण चर पढ़ता है:

- वर्तमान कार्यशील डायरेक्टरी से `.env` (यदि मौजूद हो)
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
  यदि सक्षम हो और अपेक्षित कुंजियाँ सेट न हों, तो OpenClaw आपका लॉगिन शेल चलाता है और केवल अनुपलब्ध कुंजियाँ आयात करता है:

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

- केवल बड़े अक्षरों वाले नाम मेल खाते हैं: `[A-Z_][A-Z0-9_]*`
- अनुपलब्ध/रिक्त चर लोड के समय त्रुटि उत्पन्न करते हैं
- शाब्दिक आउटपुट के लिए `$${VAR}` से एस्केप करें
- `$include` फ़ाइलों के अंदर काम करता है
- इनलाइन प्रतिस्थापन: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="सीक्रेट संदर्भ (पर्यावरण, फ़ाइल, निष्पादन)">
  SecretRef ऑब्जेक्ट का समर्थन करने वाले फ़ील्ड के लिए, आप इसका उपयोग कर सकते हैं:

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

SecretRef का विवरण (`env`/`file`/`exec` के लिए `secrets.providers` सहित) [सीक्रेट प्रबंधन](/hi/gateway/secrets) में है।
समर्थित क्रेडेंशियल पथ [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) में सूचीबद्ध हैं।
</Accordion>

पूर्ण प्राथमिकता क्रम और स्रोतों के लिए [पर्यावरण](/hi/help/environment) देखें।

## पूर्ण संदर्भ

फ़ील्ड-दर-फ़ील्ड संपूर्ण संदर्भ के लिए, **[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)** देखें।

---

_संबंधित: [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) · [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) · [Doctor](/hi/gateway/doctor)_

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples)
- [Gateway रनबुक](/hi/gateway)
