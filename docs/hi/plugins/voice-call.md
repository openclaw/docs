---
read_when:
    - आप OpenClaw से एक आउटबाउंड वॉइस कॉल करना चाहते हैं
    - आप वॉइस-कॉल Plugin को कॉन्फ़िगर या विकसित कर रहे हैं
    - आपको टेलीफ़ोनी पर रीयल-टाइम वॉइस या स्ट्रीमिंग ट्रांसक्रिप्शन चाहिए
sidebarTitle: Voice call
summary: Twilio, Telnyx या Plivo के माध्यम से आउटबाउंड वॉइस कॉल करें और इनबाउंड वॉइस कॉल स्वीकार करें, साथ ही वैकल्पिक रीयल-टाइम वॉइस और स्ट्रीमिंग ट्रांसक्रिप्शन का उपयोग करें
title: वॉइस कॉल Plugin
x-i18n:
    generated_at: "2026-07-19T09:40:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ebadf26f53314f77154396b57323dcf1330c39e3bf5296630e4c11cabf42c209
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin के माध्यम से OpenClaw के लिए वॉइस कॉल: आउटबाउंड सूचनाएँ, बहु-चरणीय
बातचीत, पूर्ण-डुप्लेक्स रीयलटाइम वॉइस, स्ट्रीमिंग ट्रांसक्रिप्शन और
अनुमति-सूची नीतियों के साथ इनबाउंड कॉल।

**प्रदाता:** `mock` (डेवलपमेंट, कोई नेटवर्क नहीं), `plivo` (Voice API + XML ट्रांसफ़र +
GetInput स्पीच), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams)।

<Note>
Voice Call Plugin **Gateway प्रक्रिया के भीतर** चलता है। यदि आप
रिमोट Gateway का उपयोग करते हैं, तो Gateway चलाने वाली मशीन पर Plugin इंस्टॉल और कॉन्फ़िगर करें,
फिर उसे लोड करने के लिए Gateway पुनः आरंभ करें।
</Note>

## त्वरित शुरुआत

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    <Tabs>
      <Tab title="npm से">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="स्थानीय फ़ोल्डर से (डेवलपमेंट)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    वर्तमान रिलीज़ टैग का अनुसरण करने के लिए बिना संस्करण वाला पैकेज उपयोग करें। सटीक
    संस्करण केवल तभी पिन करें, जब आपको पुनरुत्पाद्य इंस्टॉलेशन चाहिए। इसके बाद Gateway
    पुनः आरंभ करें, ताकि Plugin लोड हो जाए।

  </Step>
  <Step title="प्रदाता और Webhook कॉन्फ़िगर करें">
    `plugins.entries.voice-call.config` के अंतर्गत कॉन्फ़िगरेशन सेट करें (नीचे
    [कॉन्फ़िगरेशन](#configuration) देखें)। न्यूनतम रूप से: `provider`, प्रदाता
    क्रेडेंशियल, `fromNumber` और सार्वजनिक रूप से पहुँच योग्य Webhook URL।
  </Step>
  <Step title="सेटअप सत्यापित करें">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    यह Plugin के सक्षम होने, प्रदाता क्रेडेंशियल, Webhook एक्सपोज़र और
    केवल एक ऑडियो मोड (`streaming` या `realtime`) के सक्रिय होने की जाँच करता है।

  </Step>
  <Step title="स्मोक परीक्षण करें">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    डिफ़ॉल्ट रूप से दोनों ड्राई रन हैं। एक छोटी आउटबाउंड
    सूचना कॉल करने के लिए `--yes` जोड़ें:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx और Plivo के लिए, सेटअप को **सार्वजनिक Webhook URL** पर रिज़ॉल्व होना आवश्यक है।
यदि `publicUrl`, टनल URL, Tailscale URL या सर्व फ़ॉलबैक
लूपबैक अथवा निजी नेटवर्क स्पेस पर रिज़ॉल्व होता है, तो ऐसा प्रदाता शुरू करने के बजाय
सेटअप विफल हो जाता है जो कैरियर Webhook प्राप्त नहीं कर सकता।
</Warning>

## कॉन्फ़िगरेशन

यदि `enabled: true`, लेकिन चयनित प्रदाता के क्रेडेंशियल अनुपलब्ध हैं, तो Gateway
स्टार्टअप अनुपलब्ध कुंजियों के साथ सेटअप-अपूर्ण चेतावनी लॉग करता है और
रनटाइम प्रारंभ करना छोड़ देता है। उपयोग किए जाने पर कमांड, RPC कॉल और एजेंट टूल फिर भी
सटीक अनुपलब्ध कॉन्फ़िगरेशन लौटाते हैं।

<Note>
Voice-call क्रेडेंशियल SecretRefs स्वीकार करते हैं। `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` और `plugins.entries.voice-call.config.tts.providers.*.apiKey` मानक SecretRef सतह के माध्यम से रिज़ॉल्व होते हैं; [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) देखें।
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // या "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // या Twilio के लिए TWILIO_FROM_NUMBER
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, मैं आपकी कैसे सहायता कर सकता हूँ?",
              responseSystemPrompt: "आप संक्षिप्त उत्तर देने वाले बेसबॉल कार्ड विशेषज्ञ हैं।",
              tts: {
                providers: {
                  openai: { speakerVoice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
            // region: "ie1", // वैकल्पिक: us1 | ie1 | au1; डिफ़ॉल्ट us1 है
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Mission Control Portal से Telnyx Webhook सार्वजनिक कुंजी
            // (Base64; TELNYX_PUBLIC_KEY के माध्यम से भी सेट की जा सकती है)।
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook सर्वर
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook सुरक्षा (टनल/प्रॉक्सी के लिए अनुशंसित)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // सार्वजनिक एक्सपोज़र (एक चुनें)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* केवल Twilio; स्ट्रीमिंग ट्रांसक्रिप्शन देखें */ },
          realtime: { enabled: false /* रीयलटाइम वॉइस वार्तालाप देखें */ },
        },
      },
    },
  },
}
```

### कॉन्फ़िगरेशन संदर्भ

ऊपर न दिखाई गई `plugins.entries.voice-call.config` के अंतर्गत शीर्ष-स्तरीय कुंजियाँ:

| कुंजी                           | डिफ़ॉल्ट     | टिप्पणियाँ                                                                                          |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | मुख्य चालू/बंद स्विच।                                                                              |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`। [इनबाउंड कॉल](#inbound-calls) देखें।             |
| `allowFrom`                     | `[]`         | `inboundPolicy: "allowlist"` के लिए E.164 अनुमति-सूची।                                                  |
| `maxDurationSeconds`            | `300`        | प्रत्येक कॉल की अवधि की कठोर सीमा, उत्तर दिए जाने की स्थिति से निरपेक्ष रूप से लागू।                                 |
| `staleCallReaperSeconds`        | `120`        | [पुरानी कॉल रीपर](#stale-call-reaper) देखें। `0` इसे अक्षम करता है।                                      |
| `silenceTimeoutMs`              | `800`        | क्लासिक (गैर-रीयलटाइम) प्रवाह के लिए वाणी-समाप्ति मौन पहचान।                               |
| `transcriptTimeoutMs`           | `180000`     | किसी चरण को छोड़ने से पहले कॉलर ट्रांसक्रिप्ट की प्रतीक्षा की अधिकतम अवधि।                                       |
| `ringTimeoutMs`                 | `30000`      | आउटबाउंड कॉल के लिए रिंग टाइमआउट।                                                                   |
| `maxConcurrentCalls`            | `1`          | इस सीमा से अधिक आउटबाउंड कॉल अस्वीकार कर दी जाती हैं।                                                     |
| `outbound.notifyHangupDelaySec` | `3`          | सूचना मोड में स्वतः कॉल काटने से पहले TTS के बाद प्रतीक्षा के सेकंड।                                       |
| `skipSignatureVerification`     | `false`      | केवल स्थानीय परीक्षण के लिए; प्रोडक्शन में कभी सक्षम न करें।                                                    |
| `store`                         | सेट नहीं     | डिफ़ॉल्ट `$OPENCLAW_STATE_DIR/voice-calls` पथ (सामान्यतः `~/.openclaw/voice-calls`) को ओवरराइड करता है। |
| `agentId`                       | `"main"`     | प्रतिक्रिया जनरेशन और सत्र संग्रहण के लिए उपयोग किया जाने वाला एजेंट।                                            |
| `responseModel`                 | सेट नहीं     | क्लासिक (गैर-रीयलटाइम) प्रतिक्रियाओं के डिफ़ॉल्ट मॉडल को ओवरराइड करता है।                                  |
| `responseSystemPrompt`          | जनरेट किया गया | क्लासिक प्रतिक्रियाओं के लिए कस्टम सिस्टम प्रॉम्प्ट।                                                        |
| `responseTimeoutMs`             | `30000`      | क्लासिक प्रतिक्रिया जनरेशन का टाइमआउट (ms)।                                                      |

Twilio डिफ़ॉल्ट रूप से अपने US1 REST एंडपॉइंट का उपयोग करता है। समर्थित
गैर-US Region में कॉल संसाधित करने के लिए, `twilio.region` को `ie1` या `au1` पर सेट करें और
उस Region के क्रेडेंशियल उपयोग करें। देखें
[Twilio की गैर-US REST API मार्गदर्शिका](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)।

<AccordionGroup>
  <Accordion title="प्रदाता एक्सपोज़र और सुरक्षा संबंधी टिप्पणियाँ">
    - Twilio, Telnyx और Plivo सभी को **सार्वजनिक रूप से पहुँच योग्य** Webhook URL की आवश्यकता होती है।
    - `mock` एक स्थानीय डेवलपमेंट प्रदाता है (कोई नेटवर्क कॉल नहीं)।
    - Telnyx को `telnyx.publicKey` (या `TELNYX_PUBLIC_KEY`) की आवश्यकता होती है, जब तक `skipSignatureVerification` true न हो।
    - `skipSignatureVerification` केवल स्थानीय परीक्षण के लिए है।
    - ngrok के निःशुल्क टियर पर, `publicUrl` को सटीक ngrok URL पर सेट करें; हस्ताक्षर सत्यापन हमेशा लागू होता है।
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` अमान्य हस्ताक्षर वाले Twilio Webhook को **केवल** तभी अनुमति देता है, जब `tunnel.provider="ngrok"` और `serve.bind` लूपबैक हो (ngrok स्थानीय एजेंट)। केवल स्थानीय डेवलपमेंट के लिए।
    - ngrok के निःशुल्क-टियर URL बदल सकते हैं या इंटरस्टिशियल व्यवहार जोड़ सकते हैं; यदि `publicUrl` बदलता है, तो Twilio हस्ताक्षर विफल हो जाते हैं। प्रोडक्शन: स्थिर डोमेन या Tailscale फ़नल को प्राथमिकता दें।

  </Accordion>
  <Accordion title="स्ट्रीमिंग कनेक्शन सीमाएँ">
    - `streaming.preStartTimeoutMs` (डिफ़ॉल्ट `5000`) उन सॉकेट को बंद करता है जो कभी वैध `start` फ़्रेम नहीं भेजते।
    - `streaming.maxPendingConnections` (डिफ़ॉल्ट `32`) प्रारंभ होने से पहले के कुल अप्रमाणित सॉकेट की सीमा निर्धारित करता है।
    - `streaming.maxPendingConnectionsPerIp` (डिफ़ॉल्ट `4`) प्रत्येक स्रोत IP के लिए प्रारंभ होने से पहले के अप्रमाणित सॉकेट की सीमा निर्धारित करता है।
    - `streaming.maxConnections` (डिफ़ॉल्ट `128`) सभी खुले मीडिया स्ट्रीम सॉकेट (लंबित + सक्रिय) की सीमा निर्धारित करता है।

  </Accordion>
  <Accordion title="पुराने कॉन्फ़िगरेशन का माइग्रेशन">
    कॉन्फ़िगरेशन पार्सिंग इन पुरानी कुंजियों को स्वचालित रूप से सामान्यीकृत करती है और
    प्रतिस्थापन पथ का नाम बताने वाली चेतावनी लॉग करती है; यह शिम भावी
    रिलीज़ (`2026.6.0`) में हटा दिया जाएगा, इसलिए कमिट किए गए कॉन्फ़िगरेशन को
    मानक आकार में पुनः लिखने के लिए `openclaw doctor --fix` चलाएँ:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` हटा दिया गया है (रीयलटाइम संदर्भ अब जनरेट किए गए एजेंट प्रॉम्प्ट का उपयोग करता है)

  </Accordion>
</AccordionGroup>

## सत्र का दायरा

डिफ़ॉल्ट रूप से, Voice Call `sessionScope: "per-phone"` का उपयोग करता है, ताकि
एक ही कॉलर की बार-बार आने वाली कॉल में वार्तालाप स्मृति बनी रहे। जब
प्रत्येक कैरियर कॉल नए संदर्भ के साथ प्रारंभ होनी चाहिए, तब `sessionScope: "per-call"` सेट करें, उदाहरण के लिए रिसेप्शन,
बुकिंग, IVR या Google Meet ब्रिज प्रवाह, जहाँ एक ही फ़ोन नंबर
अलग-अलग मीटिंग का प्रतिनिधित्व कर सकता है।

Voice Call जनरेट की गई सत्र कुंजियों को कॉन्फ़िगर किए गए एजेंट नेमस्पेस
(`agent:<agentId>:voice:*`) के अंतर्गत संग्रहित करता है। प्रत्यक्ष स्पष्ट इंटीग्रेशन कुंजियाँ उसी
नेमस्पेस में रिज़ॉल्व होती हैं: एक मानक `agent:<configuredAgentId>:*` कुंजी उस
स्वामी को बनाए रखती है और कोर `session.mainKey`/वैश्विक-दायरा एलियसिंग का सम्मान करती है; बाहरी या
विकृत `agent:*` इनपुट को कॉन्फ़िगर किए गए एजेंट के अंतर्गत एक अपारदर्शी कुंजी के रूप में दायरा दिया जाता है;
`global` और `unknown` वैश्विक सेंटिनल बने रहते हैं।

## रीयलटाइम वॉइस वार्तालाप

`realtime` लाइव कॉल ऑडियो के लिए पूर्ण-डुप्लेक्स रीयलटाइम वॉइस प्रदाता चुनता है।
यह `streaming` से अलग है, जो ऑडियो को केवल रीयलटाइम
ट्रांसक्रिप्शन प्रदाताओं को अग्रेषित करता है।

<Warning>
`realtime.enabled` को `streaming.enabled` के साथ संयोजित नहीं किया जा सकता। प्रत्येक कॉल के लिए
एक ऑडियो मोड चुनें।
</Warning>

वर्तमान रनटाइम व्यवहार:

- `realtime.enabled` Twilio और Telnyx के लिए समर्थित है।
- `realtime.provider` वैकल्पिक है। यदि इसे सेट नहीं किया गया है, तो Voice Call पहले पंजीकृत रीयलटाइम वॉइस प्रदाता का उपयोग करता है।
- बंडल किए गए रीयलटाइम वॉइस प्रदाता: Google Gemini Live (`google`) और OpenAI (`openai`), जो अपने प्रदाता plugins द्वारा पंजीकृत होते हैं।
- प्रदाता-स्वामित्व वाला रॉ कॉन्फ़िगरेशन `realtime.providers.<providerId>` के अंतर्गत रहता है।
- Voice Call डिफ़ॉल्ट रूप से साझा `openclaw_agent_consult` रीयलटाइम टूल उपलब्ध कराता है। जब कॉलर अधिक गहन तर्क, वर्तमान जानकारी या सामान्य OpenClaw टूल माँगता है, तो रीयलटाइम मॉडल इसे कॉल कर सकता है।
- `realtime.consultPolicy` वैकल्पिक रूप से इस बारे में मार्गदर्शन जोड़ता है कि रीयलटाइम मॉडल को `openclaw_agent_consult` कब कॉल करना चाहिए।
- `realtime.agentContext.enabled` डिफ़ॉल्ट रूप से बंद रहता है। सक्षम होने पर, Voice Call सत्र सेटअप के दौरान रीयलटाइम प्रदाता के निर्देशों में सीमित एजेंट पहचान और चयनित वर्कस्पेस-फ़ाइल कैप्सूल सम्मिलित करता है।
- `realtime.fastContext.enabled` डिफ़ॉल्ट रूप से बंद रहता है। सक्षम होने पर, Voice Call पहले परामर्श प्रश्न के लिए अनुक्रमित मेमोरी/सत्र संदर्भ खोजता है और `realtime.fastContext.timeoutMs` के भीतर वे अंश रीयलटाइम मॉडल को लौटाता है; केवल `realtime.fastContext.fallbackToConsult` के true होने पर ही वह पूर्ण परामर्श एजेंट का सहारा लेता है।
- यदि `realtime.provider` किसी अपंजीकृत प्रदाता की ओर इंगित करता है, या कोई भी रीयलटाइम वॉइस प्रदाता पंजीकृत नहीं है, तो Voice Call चेतावनी लॉग करता है और पूरे plugin को विफल करने के बजाय रीयलटाइम मीडिया छोड़ देता है।
- जब `realtime.enabled` true हो, तब `inboundPolicy`, `"disabled"` नहीं होना चाहिए; `validateProviderConfig` उस संयोजन को अस्वीकार करता है।
- उपलब्ध होने पर परामर्श सत्र कुंजियाँ संग्रहीत कॉल सत्र का पुनः उपयोग करती हैं, फिर कॉन्फ़िगर किए गए `sessionScope` का सहारा लेती हैं (डिफ़ॉल्ट रूप से `per-phone`, या पृथक कॉल के लिए `per-call`)।

### टूल नीति

`realtime.toolPolicy` परामर्श रन को नियंत्रित करता है:

| नीति           | व्यवहार                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | परामर्श टूल उपलब्ध कराएँ और नियमित एजेंट को `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, तथा `memory_get` तक सीमित करें। |
| `owner`          | परामर्श टूल उपलब्ध कराएँ और नियमित एजेंट को सामान्य एजेंट टूल नीति का उपयोग करने दें।                                                      |
| `none`           | परामर्श टूल उपलब्ध न कराएँ। कस्टम `realtime.tools` फिर भी रीयलटाइम प्रदाता तक भेजे जाते हैं।                               |

`realtime.consultPolicy` केवल रीयलटाइम मॉडल के निर्देशों को नियंत्रित करता है:

| नीति        | मार्गदर्शन                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | डिफ़ॉल्ट प्रॉम्प्ट बनाए रखें और प्रदाता को तय करने दें कि परामर्श टूल कब कॉल करना है।              |
| `substantive` | सरल संवादात्मक संयोजक उत्तर सीधे दें और तथ्यों, मेमोरी, टूल या संदर्भ से पहले परामर्श करें। |
| `always`      | प्रत्येक सार्थक उत्तर से पहले परामर्श करें।                                                        |

### एजेंट वॉइस संदर्भ

जब वॉइस ब्रिज को सामान्य संवादों पर पूर्ण एजेंट-परामर्श राउंड ट्रिप की लागत के बिना
कॉन्फ़िगर किए गए OpenClaw एजेंट जैसा सुनाई देना चाहिए, तब `realtime.agentContext` सक्षम करें।
रीयलटाइम सत्र बनाते समय संदर्भ कैप्सूल एक बार जोड़ा जाता है,
इसलिए यह प्रत्येक संवाद में विलंबता नहीं जोड़ता। `openclaw_agent_consult`
की कॉल अब भी पूर्ण OpenClaw एजेंट चलाती हैं और इनका उपयोग टूल कार्य,
वर्तमान जानकारी, मेमोरी लुकअप या वर्कस्पेस स्थिति के लिए किया जाना चाहिए।

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### रीयलटाइम प्रदाता के उदाहरण

<Tabs>
  <Tab title="Google Gemini Live">
    डिफ़ॉल्ट: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`,
    या `GOOGLE_API_KEY` से API कुंजी; मॉडल `gemini-3.1-flash-live-preview`;
    वॉइस `Kore`। लंबे, पुनः कनेक्ट किए जा सकने वाले कॉल के लिए
    `sessionResumption` और `contextWindowCompression` डिफ़ॉल्ट रूप से चालू रहते हैं।
    टेलीफ़ोनी ऑडियो पर तेज़ बारी-बारी से संवाद को समायोजित करने के लिए
    `silenceDurationMs`, `startSensitivity`, और `endSensitivity` का उपयोग करें।

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "संक्षेप में बोलें। अधिक गहन टूल का उपयोग करने से पहले openclaw_agent_consult को कॉल करें।",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

प्रदाता-विशिष्ट रीयलटाइम वॉइस विकल्पों के लिए
[Google प्रदाता](/hi/providers/google) और
[OpenAI प्रदाता](/hi/providers/openai) देखें।

## स्ट्रीमिंग ट्रांसक्रिप्शन

`streaming` Twilio Media Streams को रीयलटाइम ट्रांसक्रिप्शन प्रदाता से जोड़ता है।
पारंपरिक स्ट्रीमिंग पथ के लिए `provider: "twilio"` आवश्यक है; Telnyx, Plivo,
या mock के साथ कॉन्फ़िगरेशन अस्वीकार कर दिया जाता है। Telnyx लाइव ऑडियो इसके बजाय
अलग से प्रमाणित `realtime.enabled` पथ का उपयोग करता है।

वर्तमान रनटाइम व्यवहार:

- `streaming.provider` वैकल्पिक है। यदि इसे सेट नहीं किया गया है, तो Voice Call पहले पंजीकृत रीयलटाइम ट्रांसक्रिप्शन प्रदाता का उपयोग करता है।
- बंडल किए गए रीयलटाइम ट्रांसक्रिप्शन प्रदाता: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), और xAI (`xai`), जो अपने प्रदाता plugins द्वारा पंजीकृत होते हैं।
- प्रदाता-स्वामित्व वाला रॉ कॉन्फ़िगरेशन `streaming.providers.<providerId>` के अंतर्गत रहता है।
- Twilio द्वारा स्वीकृत स्ट्रीम `start` संदेश भेजे जाने के बाद, Voice Call स्ट्रीम को तुरंत पंजीकृत करता है, प्रदाता के कनेक्ट होने के दौरान आने वाले मीडिया को ट्रांसक्रिप्शन प्रदाता के माध्यम से कतारबद्ध करता है और आरंभिक अभिवादन केवल रीयलटाइम ट्रांसक्रिप्शन के तैयार होने के बाद शुरू करता है।
- यदि `streaming.provider` किसी अपंजीकृत प्रदाता की ओर इंगित करता है, या कोई प्रदाता पंजीकृत नहीं है, तो Voice Call चेतावनी लॉग करता है और पूरे plugin को विफल करने के बजाय मीडिया स्ट्रीमिंग छोड़ देता है।

### स्ट्रीमिंग प्रदाता के उदाहरण

<Tabs>
  <Tab title="OpenAI">
    डिफ़ॉल्ट: API कुंजी `streaming.providers.openai.apiKey` या
    `OPENAI_API_KEY`; मॉडल `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`।

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // यदि OPENAI_API_KEY सेट है तो वैकल्पिक
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    डिफ़ॉल्ट: API कुंजी `streaming.providers.xai.apiKey` या `XAI_API_KEY` (यदि दोनों में से
    कोई भी सेट नहीं है, तो xAI OAuth प्रमाणीकरण प्रोफ़ाइल का सहारा लिया जाता है);
    एंडपॉइंट `wss://api.x.ai/v1/stt`; एन्कोडिंग `mulaw`; सैंपल दर
    `8000`; `endpointingMs: 800`; `interimResults: true`।

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // यदि XAI_API_KEY सेट है तो वैकल्पिक
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## कॉल के लिए TTS

Voice Call कॉल पर स्ट्रीमिंग स्पीच के लिए कोर `messages.tts` कॉन्फ़िगरेशन का उपयोग करता है।
आप इसे plugin कॉन्फ़िगरेशन के अंतर्गत **समान संरचना** से ओवरराइड कर सकते हैं —
यह `messages.tts` के साथ डीप-मर्ज होता है।

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**वॉइस कॉल के लिए Microsoft speech को अनदेखा किया जाता है।** टेलीफ़ोनी संश्लेषण के लिए
ऐसा प्रदाता आवश्यक है जो टेलीफ़ोनी-लक्ष्य आउटपुट लागू करता हो; Microsoft speech
प्रदाता ऐसा नहीं करता, इसलिए कॉल के लिए इसे छोड़ दिया जाता है और इसके बजाय
फ़ॉलबैक शृंखला के अन्य प्रदाताओं को आज़माया जाता है।
</Warning>

व्यवहार संबंधी टिप्पणियाँ:

- plugin कॉन्फ़िगरेशन के भीतर पुराने `tts.<provider>` कुंजी (`openai`, `elevenlabs`, `microsoft`, `edge`) को `openclaw doctor --fix` द्वारा सुधारा जाता है; कमिट किए गए कॉन्फ़िगरेशन को `tts.providers.<provider>` का उपयोग करना चाहिए।
- Twilio मीडिया स्ट्रीमिंग सक्षम होने पर कोर TTS का उपयोग किया जाता है; अन्यथा कॉल प्रदाता-नेटिव वॉइस का सहारा लेते हैं।
- यदि Twilio मीडिया स्ट्रीम पहले से सक्रिय है, तो Voice Call TwiML `<Say>` का सहारा नहीं लेता। यदि उस स्थिति में टेलीफ़ोनी TTS अनुपलब्ध है, तो दो प्लेबैक पथों को मिलाने के बजाय प्लेबैक अनुरोध विफल हो जाता है।
- जब टेलीफ़ोनी TTS किसी द्वितीयक प्रदाता का सहारा लेता है, तो Voice Call डीबगिंग के लिए प्रदाता शृंखला (`from`, `to`, `attempts`) के साथ चेतावनी लॉग करता है।
- जब Twilio बार्ज-इन या स्ट्रीम टियरडाउन लंबित TTS कतार को साफ़ करता है, तो कतारबद्ध प्लेबैक अनुरोध, प्लेबैक पूर्ण होने की प्रतीक्षा कर रहे कॉलर को अटकाने के बजाय पूर्ण हो जाते हैं।

### TTS के उदाहरण

<Tabs>
  <Tab title="केवल कोर TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs से ओवरराइड (केवल कॉल)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI मॉडल ओवरराइड (डीप-मर्ज)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                speakerVoice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## इनबाउंड कॉल

इनबाउंड नीति का डिफ़ॉल्ट `disabled` है। इनबाउंड कॉल सक्षम करने के लिए, यह सेट करें:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` कम-विश्वसनीयता वाली कॉलर-ID जाँच है। Plugin
प्रदाता से मिले `From` मान को सामान्यीकृत करता है और उसकी तुलना `allowFrom` से करता है।
Webhook सत्यापन प्रदाता की डिलीवरी और पेलोड की अखंडता को प्रमाणित करता है,
लेकिन यह PSTN/VoIP कॉलर-नंबर के स्वामित्व को प्रमाणित **नहीं** करता। `allowFrom`
को कॉलर-ID फ़िल्टरिंग मानें, न कि मजबूत कॉलर पहचान।
</Warning>

स्वचालित प्रतिक्रियाएँ एजेंट सिस्टम का उपयोग करती हैं। इन्हें `responseModel`,
`responseSystemPrompt`, और `responseTimeoutMs` से समायोजित करें।

### प्रति-नंबर रूटिंग

जब एक Voice Call Plugin कई फ़ोन नंबरों के लिए कॉल प्राप्त करता है और प्रत्येक नंबर को
अलग लाइन की तरह व्यवहार करना चाहिए, तब `numbers` का उपयोग करें। उदाहरण के लिए,
एक नंबर अनौपचारिक निजी सहायक का उपयोग कर सकता है, जबकि दूसरा व्यावसायिक
व्यक्तित्व, अलग प्रतिक्रिया एजेंट और अलग TTS आवाज़ का उपयोग कर सकता है।

रूट का चयन प्रदाता से मिले डायल किए गए `To` नंबर से होता है। कुंजियाँ
E.164 नंबर होनी चाहिए। कॉल आने पर Voice Call मेल खाने वाले
रूट को एक बार निर्धारित करता है, मेल खाया रूट कॉल रिकॉर्ड में संग्रहीत करता है और उसी
प्रभावी कॉन्फ़िगरेशन को अभिवादन, पारंपरिक स्वचालित-प्रतिक्रिया पथ, रीयलटाइम
परामर्श पथ और TTS प्लेबैक के लिए दोबारा उपयोग करता है। यदि कोई रूट मेल नहीं खाता, तो वैश्विक Voice Call
कॉन्फ़िगरेशन का उपयोग होता है। आउटबाउंड कॉल `numbers` का उपयोग नहीं करते; कॉल शुरू करते समय
आउटबाउंड लक्ष्य, संदेश और सत्र स्पष्ट रूप से पास करें।

रूट ओवरराइड वर्तमान में इनका समर्थन करते हैं:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` रूट मान वैश्विक Voice Call `tts` कॉन्फ़िगरेशन पर डीप-मर्ज होता है, इसलिए
आमतौर पर केवल प्रदाता की आवाज़ को ओवरराइड किया जा सकता है:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### वाचित आउटपुट अनुबंध

स्वचालित प्रतिक्रियाओं के लिए, Voice Call सिस्टम प्रॉम्प्ट में एक कठोर वाचित-आउटपुट अनुबंध जोड़ता है,
जिसमें `{"spoken":"..."}` JSON उत्तर आवश्यक होता है। Voice Call
सावधानीपूर्वक वाणी-पाठ निकालता है:

- तर्क/त्रुटि सामग्री के रूप में चिह्नित पेलोड को अनदेखा करता है।
- प्रत्यक्ष JSON, फ़ेंस किए गए JSON या इनलाइन `"spoken"` कुंजियों को पार्स करता है।
- सादे पाठ पर वापस जाता है और संभावित योजना/मेटा भूमिका वाले अनुच्छेद हटा देता है।

इससे वाचित प्लेबैक कॉलर के लिए लक्षित पाठ पर केंद्रित रहता है और
योजना संबंधी पाठ को ऑडियो में उजागर होने से रोका जाता है।

### वार्तालाप आरंभ व्यवहार

आउटबाउंड `conversation` कॉल के लिए, पहले संदेश का प्रबंधन लाइव
प्लेबैक स्थिति से जुड़ा होता है:

- बार्ज-इन कतार साफ़ करना और स्वचालित प्रतिक्रिया केवल तब रोके जाते हैं, जब प्रारंभिक अभिवादन सक्रिय रूप से बोला जा रहा हो।
- यदि प्रारंभिक प्लेबैक विफल होता है, तो कॉल `listening` पर लौट जाती है और प्रारंभिक संदेश पुनः प्रयास के लिए कतार में बना रहता है।
- Twilio स्ट्रीमिंग का प्रारंभिक प्लेबैक बिना अतिरिक्त विलंब के स्ट्रीम कनेक्ट होने पर शुरू होता है।
- बार्ज-इन सक्रिय प्लेबैक को निरस्त करता है और कतारबद्ध, लेकिन अभी तक न चल रही Twilio TTS प्रविष्टियों को साफ़ करता है। साफ़ की गई प्रविष्टियाँ छोड़ी गई के रूप में पूर्ण होती हैं, ताकि अनुवर्ती प्रतिक्रिया तर्क ऐसे ऑडियो की प्रतीक्षा किए बिना जारी रह सके जो कभी नहीं चलेगा।
- रीयलटाइम वॉइस वार्तालाप रीयलटाइम स्ट्रीम की अपनी आरंभिक बारी का उपयोग करते हैं। Voice Call उस प्रारंभिक संदेश के लिए पारंपरिक `<Say>` TwiML अपडेट पोस्ट **नहीं** करता, इसलिए आउटबाउंड `<Connect><Stream>` सत्र जुड़े रहते हैं।

### Twilio स्ट्रीम डिस्कनेक्ट छूट अवधि

जब Twilio मीडिया स्ट्रीम डिस्कनेक्ट होती है, तो Voice Call कॉल को
स्वतः समाप्त करने से पहले **2000 ms** प्रतीक्षा करता है:

- यदि उस अवधि में स्ट्रीम फिर से कनेक्ट हो जाती है, तो स्वतः-समापन रद्द हो जाता है।
- यदि छूट अवधि के बाद कोई स्ट्रीम फिर से पंजीकृत नहीं होती, तो अटकी हुई सक्रिय कॉल रोकने के लिए कॉल समाप्त कर दी जाती है।

## पुरानी कॉल रीपर

ऐसी कॉल समाप्त करने के लिए `staleCallReaperSeconds` (डिफ़ॉल्ट **120**) का उपयोग करें, जिनका
कभी उत्तर नहीं दिया जाता और जो कभी लाइव वार्तालाप स्थिति तक नहीं पहुँचतीं, उदाहरण के लिए सूचना-मोड
कॉल जिनके लिए प्रदाता कभी अंतिम Webhook नहीं भेजता। अक्षम करने के लिए इसे `0` पर
सेट करें।

रीपर प्रत्येक 30 सेकंड में चलता है और केवल ऐसी कॉल समाप्त करता है जिनमें
`answeredAt` टाइमस्टैम्प नहीं है और जो पहले से अंतिम या लाइव
(`speaking`/`listening`) स्थिति में नहीं हैं, इसलिए इस टाइमर द्वारा उत्तर दिए गए वार्तालाप कभी रीप
नहीं किए जाते; `maxDurationSeconds` (डिफ़ॉल्ट 300) अलग सीमा है, जो
बहुत लंबे समय तक चलने वाली उत्तर दी गई कॉल समाप्त करती है।

सूचना-शैली प्रवाहों में, जहाँ कैरियर रिंग/उत्तर
Webhook भेजने में धीमे हो सकते हैं, `staleCallReaperSeconds` को डिफ़ॉल्ट से अधिक बढ़ाएँ, ताकि धीमी लेकिन सामान्य
कॉल समय से पहले रीप न हों; `120`-`300` सेकंड उचित उत्पादन
सीमा है।

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Webhook सुरक्षा

जब Gateway के आगे कोई प्रॉक्सी या टनल होती है, तो Plugin हस्ताक्षर सत्यापन के लिए
सार्वजनिक URL का पुनर्निर्माण करता है। ये विकल्प नियंत्रित करते हैं कि किन
फ़ॉरवर्ड किए गए हेडर पर भरोसा किया जाए:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  फ़ॉरवर्डिंग हेडर से होस्ट की अनुमति-सूची।
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  अनुमति-सूची के बिना फ़ॉरवर्ड किए गए हेडर पर भरोसा करें।
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  फ़ॉरवर्ड किए गए हेडर पर केवल तभी भरोसा करें, जब अनुरोध का रिमोट IP सूची से मेल खाता हो।
</ParamField>

अतिरिक्त सुरक्षाएँ:

- Twilio, Telnyx और Plivo के लिए Webhook **रीप्ले सुरक्षा** सक्षम है। दोबारा चलाए गए वैध Webhook अनुरोध स्वीकार किए जाते हैं, लेकिन उनके दुष्प्रभाव छोड़ दिए जाते हैं।
- Twilio वार्तालाप की प्रत्येक बारी में `<Gather>` कॉलबैक में प्रति-बारी टोकन शामिल होता है, इसलिए पुराने/दोबारा चलाए गए वाणी कॉलबैक किसी नई लंबित ट्रांसक्रिप्ट बारी को पूरा नहीं कर सकते।
- प्रदाता के आवश्यक हस्ताक्षर हेडर अनुपस्थित होने पर अप्रमाणित Webhook अनुरोध बॉडी पढ़ने से पहले अस्वीकार कर दिए जाते हैं।
- voice-call Webhook हस्ताक्षर सत्यापन से पहले साझा पूर्व-प्रमाणीकरण बॉडी-पठन प्रोफ़ाइल (अधिकतम 64 KB बॉडी, 5-सेकंड पठन टाइमआउट) और प्रति-कुंजी जारी अनुरोध सीमा (डिफ़ॉल्ट रूप से प्रति कुंजी 8 समवर्ती अनुरोध) का उपयोग करता है।

स्थिर सार्वजनिक होस्ट वाला उदाहरण:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # कॉल का उपनाम
openclaw voicecall continue --call-id <id> --message "कोई प्रश्न?"
openclaw voicecall speak --call-id <id> --message "एक क्षण"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # लॉग से बारी की विलंबता का सारांश दें
openclaw voicecall expose --mode funnel
```

जब Gateway पहले से चल रहा हो, तब परिचालन `voicecall` कमांड
Gateway-स्वामित्व वाले voice-call रनटाइम को सौंपे जाते हैं, ताकि CLI दूसरा
Webhook सर्वर बाइंड न करे। यदि कोई Gateway उपलब्ध न हो, तो कमांड
स्वतंत्र CLI रनटाइम पर वापस चले जाते हैं।

`latency` डिफ़ॉल्ट voice-call संग्रहण पथ से `calls.jsonl` पढ़ता है। किसी
अलग लॉग की ओर इंगित करने के लिए `--file <path>` और विश्लेषण को
अंतिम N रिकॉर्ड (डिफ़ॉल्ट 200) तक सीमित करने के लिए `--last <n>` का उपयोग करें। आउटपुट में बारी की विलंबता और
सुनने-की-प्रतीक्षा समय के लिए न्यूनतम/अधिकतम/औसत, p50 और p95 शामिल होते हैं।

## एजेंट टूल

टूल का नाम: `voice_call`।

| क्रिया          | तर्क                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

voice-call Plugin के साथ मेल खाने वाली एजेंट स्किल आती है।

## Gateway RPC

| विधि                      | आर्ग्युमेंट                                                             | टिप्पणियाँ                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | `to` छोड़े जाने पर `toNumber` कॉन्फ़िग पर फ़ॉलबैक करता है।                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | `initiate` के समान, लेकिन प्री-कनेक्ट `dtmfSequence` भी स्वीकार करता है।           |
| `voicecall.continue`        | `callId`, `message`                                              | टर्न का समाधान होने तक ब्लॉक करता है; ट्रांसक्रिप्ट लौटाता है।                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | एसिंक वैरिएंट: तुरंत एक `operationId` लौटाता है।                      |
| `voicecall.continue.result` | `operationId`                                                    | लंबित `voicecall.continue.start` ऑपरेशन के परिणाम के लिए उसे पोल करता है।      |
| `voicecall.speak`           | `callId`, `message`                                              | प्रतीक्षा किए बिना बोलता है; `realtime.enabled` होने पर रीयलटाइम ब्रिज का उपयोग करता है। |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | सभी सक्रिय कॉल सूचीबद्ध करने के लिए `callId` छोड़ दें।                                   |

`dtmfSequence` केवल `mode: "conversation"` के साथ मान्य है; यदि नोटिफ़ाई-मोड कॉल को
कनेक्ट होने के बाद अंकों की आवश्यकता हो, तो कॉल मौजूद होने के बाद उन्हें
`voicecall.dtmf` का उपयोग करना चाहिए।

## समस्या निवारण

### सेटअप Webhook एक्सपोज़र में विफल होता है

सेटअप उसी परिवेश से चलाएँ जिसमें Gateway चलता है:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx`, और `plivo` के लिए, `webhook-exposure` हरा होना चाहिए। कॉन्फ़िगर किया गया
`publicUrl` तब भी विफल होता है जब वह स्थानीय या निजी नेटवर्क
स्पेस की ओर इंगित करता है, क्योंकि कैरियर उन पतों पर वापस कॉल नहीं कर सकता।
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8`, या अन्य कैरियर-ग्रेड-NAT
रेंज को `publicUrl` के रूप में उपयोग न करें।

Twilio नोटिफ़ाई-मोड आउटबाउंड कॉल अपना प्रारंभिक `<Say>` TwiML सीधे
कॉल बनाने के अनुरोध में भेजते हैं, इसलिए पहला बोला गया संदेश Twilio द्वारा
Webhook TwiML फ़ेच करने पर निर्भर नहीं करता। स्टेटस कॉलबैक, वार्तालाप कॉल,
प्री-कनेक्ट DTMF, रीयलटाइम स्ट्रीम और पोस्ट-कनेक्ट कॉल नियंत्रण के लिए
सार्वजनिक Webhook अभी भी आवश्यक है।

एक सार्वजनिक एक्सपोज़र पथ का उपयोग करें:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // या
          tunnel: { provider: "ngrok" },
          // या
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

कॉन्फ़िग बदलने के बाद Gateway को पुनरारंभ या रीलोड करें, फिर चलाएँ:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

जब तक आप `--yes` पास नहीं करते, `voicecall smoke` एक ड्राई रन है।

### प्रदाता क्रेडेंशियल विफल होते हैं

चयनित प्रदाता और आवश्यक क्रेडेंशियल फ़ील्ड जाँचें:

- Twilio: `twilio.accountSid`, `twilio.authToken`, और `fromNumber`, या
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, और `TWILIO_FROM_NUMBER`।
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`, और
  `fromNumber`, या `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID`, और
  `TELNYX_PUBLIC_KEY`।
- Plivo: `plivo.authId`, `plivo.authToken`, और `fromNumber`, या
  `PLIVO_AUTH_ID` और `PLIVO_AUTH_TOKEN`।

क्रेडेंशियल Gateway होस्ट पर मौजूद होने चाहिए। स्थानीय शेल प्रोफ़ाइल को
संपादित करने से पहले से चल रहे Gateway पर तब तक प्रभाव नहीं पड़ता, जब तक वह
पुनरारंभ नहीं होता या अपने परिवेश को रीलोड नहीं करता।

### कॉल शुरू होते हैं, लेकिन प्रदाता Webhook नहीं पहुँचते

पुष्टि करें कि प्रदाता कंसोल बिल्कुल सही सार्वजनिक Webhook URL की ओर इंगित करता है:

```text
https://voice.example.com/voice/webhook
```

फिर रनटाइम स्थिति की जाँच करें:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

सामान्य कारण:

- `publicUrl`, `serve.path` से अलग पथ की ओर इंगित करता है।
- Gateway शुरू होने के बाद टनल URL बदल गया।
- प्रॉक्सी अनुरोध अग्रेषित करता है, लेकिन होस्ट/प्रोटो हेडर हटा देता है या फिर से लिखता है।
- फ़ायरवॉल या DNS सार्वजनिक होस्टनाम को Gateway के बजाय किसी अन्य स्थान पर रूट करता है।
- Voice Call Plugin सक्षम किए बिना Gateway पुनरारंभ किया गया।

जब Gateway के आगे कोई रिवर्स प्रॉक्सी या टनल हो, तो
`webhookSecurity.allowedHosts` को सार्वजनिक होस्टनाम पर सेट करें, या किसी ज्ञात प्रॉक्सी
पते के लिए `webhookSecurity.trustedProxyIPs` का उपयोग करें। `webhookSecurity.trustForwardingHeaders` का उपयोग
केवल तभी करें जब प्रॉक्सी सीमा आपके नियंत्रण में हो।

### हस्ताक्षर सत्यापन विफल होता है

प्रदाता हस्ताक्षरों की जाँच उस सार्वजनिक URL के विरुद्ध की जाती है जिसे OpenClaw
आने वाले अनुरोध से पुनर्निर्मित करता है। यदि हस्ताक्षर विफल हों:

- पुष्टि करें कि प्रदाता Webhook URL, स्कीम, होस्ट और पथ सहित, `publicUrl` से बिल्कुल मेल खाता है।
- ngrok फ़्री-टियर URL के लिए, टनल होस्टनाम बदलने पर `publicUrl` अपडेट करें।
- सुनिश्चित करें कि प्रॉक्सी मूल होस्ट और प्रोटो हेडर सुरक्षित रखता है, या `webhookSecurity.allowedHosts` कॉन्फ़िगर करें।
- स्थानीय परीक्षण के बाहर `skipSignatureVerification` सक्षम न करें।

### Google Meet Twilio जॉइन विफल होते हैं

Google Meet, Twilio डायल-इन जॉइन के लिए इस Plugin का उपयोग करता है। पहले Voice
Call सत्यापित करें:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

फिर Google Meet ट्रांसपोर्ट को स्पष्ट रूप से सत्यापित करें:

```bash
openclaw googlemeet setup --transport twilio
```

यदि Voice Call हरा है, लेकिन Meet प्रतिभागी कभी जॉइन नहीं करता, तो Meet
डायल-इन नंबर, PIN और `--dtmf-sequence` जाँचें। फ़ोन कॉल स्वस्थ हो सकती है,
जबकि मीटिंग गलत DTMF क्रम को अस्वीकार या अनदेखा कर सकती है।

Google Meet, प्री-कनेक्ट DTMF क्रम के साथ `voicecall.start` के माध्यम से
Twilio फ़ोन लेग शुरू करता है। PIN से प्राप्त क्रमों में आरंभिक Twilio
प्रतीक्षा अंकों के रूप में Google Meet Plugin का `voiceCall.dtmfDelayMs` (डिफ़ॉल्ट **12000 ms**)
शामिल होता है, क्योंकि Meet डायल-इन प्रॉम्प्ट देर से आ सकते हैं। इसके बाद,
परिचय अभिवादन का अनुरोध किए जाने से पहले Voice Call वापस रीयलटाइम हैंडलिंग
पर रीडायरेक्ट करता है।

लाइव चरण ट्रेस के लिए `openclaw logs --follow` का उपयोग करें। एक स्वस्थ Twilio Meet
जॉइन इस क्रम को लॉग करता है:

- Google Meet, Twilio जॉइन को Voice Call को सौंपता है।
- Voice Call प्री-कनेक्ट DTMF TwiML संग्रहीत करता है।
- Twilio प्रारंभिक TwiML का उपभोग किया जाता है और रीयलटाइम हैंडलिंग से पहले सर्व किया जाता है।
- Voice Call, Twilio कॉल के लिए रीयलटाइम TwiML सर्व करता है।
- Google Meet, पोस्ट-DTMF विलंब के बाद `voicecall.speak` के साथ परिचय वाणी का अनुरोध करता है।

`openclaw voicecall tail` अब भी स्थायी कॉल रिकॉर्ड दिखाता है; यह कॉल स्थिति और
ट्रांसक्रिप्ट के लिए उपयोगी है, लेकिन हर Webhook/रीयलटाइम ट्रांज़िशन
वहाँ दिखाई नहीं देता।

### रीयलटाइम कॉल में वाणी नहीं है

पुष्टि करें कि केवल एक ऑडियो मोड सक्षम है: `realtime.enabled` और
`streaming.enabled` दोनों एक साथ true नहीं हो सकते।

रीयलटाइम Twilio/Telnyx कॉल के लिए यह भी सत्यापित करें:

- एक रीयलटाइम प्रदाता Plugin लोड और पंजीकृत है।
- `realtime.provider` अनसेट है या किसी पंजीकृत प्रदाता का नाम देता है।
- प्रदाता API कुंजी Gateway प्रक्रिया के लिए उपलब्ध है।
- `openclaw logs --follow` दिखाता है कि रीयलटाइम TwiML सर्व हुआ, रीयलटाइम ब्रिज शुरू हुआ और प्रारंभिक अभिवादन कतारबद्ध हुआ।

## संबंधित

- [टॉक मोड](/hi/nodes/talk)
- [टेक्स्ट-टू-स्पीच](/hi/tools/tts)
- [वॉइस वेक](/hi/nodes/voicewake)
