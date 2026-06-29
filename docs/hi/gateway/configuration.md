---
read_when:
    - OpenClaw को पहली बार सेट अप करना
    - सामान्य कॉन्फ़िगरेशन पैटर्न खोज रहे हैं
    - विशिष्ट कॉन्फ़िग अनुभागों पर नेविगेट करना
summary: 'कॉन्फ़िगरेशन अवलोकन: सामान्य कार्य, त्वरित सेटअप, और पूर्ण संदर्भ के लिंक'
title: कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-06-28T23:06:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw `~/.openclaw/openclaw.json` से वैकल्पिक <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> कॉन्फ़िग पढ़ता है।
सक्रिय कॉन्फ़िग पथ एक नियमित फ़ाइल होना चाहिए। Symlink किए गए `openclaw.json`
लेआउट OpenClaw-स्वामित्व वाली writes के लिए समर्थित नहीं हैं; atomic write
symlink को सुरक्षित रखने के बजाय पथ को बदल सकती है। यदि आप कॉन्फ़िग को
डिफ़ॉल्ट state directory के बाहर रखते हैं, तो `OPENCLAW_CONFIG_PATH` को सीधे वास्तविक फ़ाइल पर इंगित करें।

यदि फ़ाइल मौजूद नहीं है, तो OpenClaw सुरक्षित डिफ़ॉल्ट इस्तेमाल करता है। कॉन्फ़िग जोड़ने के सामान्य कारण:

- चैनल कनेक्ट करें और नियंत्रित करें कि bot को कौन संदेश भेज सकता है
- मॉडल, tools, sandboxing, या automation (cron, hooks) सेट करें
- sessions, media, networking, या UI को ट्यून करें

हर उपलब्ध फ़ील्ड के लिए [पूर्ण संदर्भ](/hi/gateway/configuration-reference) देखें।

Agents और automation को कॉन्फ़िग संपादित करने से पहले सटीक field-level
docs के लिए `config.schema.lookup` इस्तेमाल करना चाहिए। task-oriented मार्गदर्शन के लिए यह पेज और विस्तृत
field map और defaults के लिए
[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) इस्तेमाल करें।

<Tip>
**कॉन्फ़िगरेशन में नए हैं?** interactive setup के लिए `openclaw onboard` से शुरू करें, या पूर्ण copy-paste configs के लिए [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) guide देखें।
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) खोलें और **कॉन्फ़िग** tab इस्तेमाल करें।
    Control UI live config schema से एक form render करता है, जिसमें field
    `title` / `description` docs metadata और उपलब्ध होने पर plugin और channel schemas शामिल होते हैं,
    साथ ही escape hatch के रूप में **Raw JSON** editor होता है। drill-down
    UIs और अन्य tooling के लिए, Gateway `config.schema.lookup` भी expose करता है ताकि
    एक path-scoped schema node और immediate child summaries fetch किए जा सकें।
  </Tab>
  <Tab title="Direct edit">
    `~/.openclaw/openclaw.json` को सीधे संपादित करें। Gateway फ़ाइल को watch करता है और बदलावों को अपने-आप लागू करता है ([hot reload](#config-hot-reload) देखें)।
  </Tab>
</Tabs>

## सख्त validation

<Warning>
OpenClaw केवल उन configurations को स्वीकार करता है जो schema से पूरी तरह match करते हैं। Unknown keys, malformed types, या invalid values के कारण Gateway **start करने से इनकार** कर देता है। केवल root-level exception `$schema` (string) है, ताकि editors JSON Schema metadata attach कर सकें।
</Warning>

`openclaw config schema` Control UI
और validation द्वारा इस्तेमाल किया जाने वाला canonical JSON Schema print करता है। `config.schema.lookup` drill-down tooling के लिए एक single path-scoped node और
child summaries fetch करता है। Field `title`/`description` docs metadata
nested objects, wildcard (`*`), array-item (`[]`), और `anyOf`/
`oneOf`/`allOf` branches तक carry होता है। Runtime plugin और channel schemas तब merge होते हैं जब
manifest registry loaded हो।

जब validation fail होता है:

- Gateway boot नहीं होता
- केवल diagnostic commands काम करती हैं (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- सटीक issues देखने के लिए `openclaw doctor` चलाएँ
- repairs लागू करने के लिए `openclaw doctor --fix` (या `--yes`) चलाएँ

Gateway हर सफल startup के बाद एक trusted last-known-good copy रखता है,
लेकिन startup और hot reload उसे अपने-आप restore नहीं करते। यदि `openclaw.json`
validation fail करता है (plugin-local validation सहित), तो Gateway startup fail होता है या
reload skip हो जाता है और current runtime आखिरी accepted config रखता है।
prefixed/clobbered config repair करने या
last-known-good copy restore करने के लिए `openclaw doctor --fix` (या `--yes`) चलाएँ। जब candidate में `***` जैसे redacted secret placeholders हों, तो last-known-good में promotion skip हो जाता है।

## सामान्य tasks

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    हर channel का अपना config section `channels.<provider>` के तहत होता है। setup steps के लिए dedicated channel page देखें:

    - [WhatsApp](/hi/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/hi/channels/telegram) - `channels.telegram`
    - [Discord](/hi/channels/discord) - `channels.discord`
    - [Feishu](/hi/channels/feishu) - `channels.feishu`
    - [Google Chat](/hi/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/hi/channels/msteams) - `channels.msteams`
    - [Slack](/hi/channels/slack) - `channels.slack`
    - [Signal](/hi/channels/signal) - `channels.signal`
    - [iMessage](/hi/channels/imessage) - `channels.imessage`
    - [Mattermost](/hi/channels/mattermost) - `channels.mattermost`

    सभी channels समान DM policy pattern साझा करते हैं:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choose and configure models">
    primary model और optional fallbacks सेट करें:

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

    - `agents.defaults.models` model catalog define करता है और `/model` के लिए allowlist की तरह काम करता है; `provider/*` entries dynamic model discovery का इस्तेमाल जारी रखते हुए `/model`, `/models`, और model pickers को selected providers तक filter करती हैं।
    - मौजूदा models हटाए बिना allowlist entries जोड़ने के लिए `openclaw config set agents.defaults.models '<json>' --strict-json --merge` इस्तेमाल करें। Plain replacements जो entries हटाएँगे, वे तब तक reject होते हैं जब तक आप `--replace` pass नहीं करते।
    - Model refs `provider/model` format इस्तेमाल करते हैं (जैसे `anthropic/claude-opus-4-6`)।
    - `agents.defaults.imageMaxDimensionPx` transcript/tool image downscaling नियंत्रित करता है (default `1200`); कम values आमतौर पर screenshot-heavy runs पर vision-token usage घटाती हैं।
    - chat में models switch करने के लिए [Models CLI](/hi/concepts/models) और auth rotation तथा fallback behavior के लिए [Model Failover](/hi/concepts/model-failover) देखें।
    - custom/self-hosted providers के लिए, reference में [Custom providers](/hi/gateway/config-tools#custom-providers-and-base-urls) देखें।

  </Accordion>

  <Accordion title="Control who can message the bot">
    DM access हर channel के लिए `dmPolicy` के जरिए नियंत्रित होता है:

    - `"pairing"` (default): unknown senders को approve करने के लिए one-time pairing code मिलता है
    - `"allowlist"`: केवल `allowFrom` में मौजूद senders (या paired allow store)
    - `"open"`: सभी inbound DMs allow करें (`allowFrom: ["*"]` आवश्यक)
    - `"disabled"`: सभी DMs ignore करें

    groups के लिए, `groupPolicy` + `groupAllowFrom` या channel-specific allowlists इस्तेमाल करें।

    per-channel details के लिए [पूर्ण संदर्भ](/hi/gateway/config-channels#dm-and-group-access) देखें।

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Group messages default रूप से **mention require** करते हैं। हर agent के लिए trigger patterns configure करें। सामान्य group/channel replies अपने-आप post होते हैं; shared rooms के लिए message-tool path opt into करें जहाँ agent को तय करना चाहिए कि कब बोलना है:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **Metadata mentions**: native @-mentions (WhatsApp tap-to-mention, Telegram @bot, आदि)
    - **Text patterns**: `mentionPatterns` में safe regex patterns
    - **Visible replies**: `messages.visibleReplies` globally message-tool sends require कर सकता है; `messages.groupChat.visibleReplies` groups/channels के लिए उसे override करता है।
    - visible reply modes, per-channel overrides, और self-chat mode के लिए [पूर्ण संदर्भ](/hi/gateway/config-channels#group-chat-mention-gating) देखें।

  </Accordion>

  <Accordion title="Restrict skills per agent">
    shared baseline के लिए `agents.defaults.skills` इस्तेमाल करें, फिर specific
    agents को `agents.list[].skills` से override करें:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - default रूप से unrestricted skills के लिए `agents.defaults.skills` omit करें।
    - defaults inherit करने के लिए `agents.list[].skills` omit करें।
    - no skills के लिए `agents.list[].skills: []` सेट करें।
    - [Skills](/hi/tools/skills), [Skills config](/hi/tools/skills-config), और
      [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agents-defaults-skills) देखें।

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Gateway stale दिखने वाले channels को कितनी aggressively restart करे, इसे नियंत्रित करें:

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

    - health-monitor restarts को globally disable करने के लिए `gateway.channelHealthCheckMinutes: 0` सेट करें।
    - `channelStaleEventThresholdMinutes` check interval से greater than or equal होना चाहिए।
    - global monitor disable किए बिना एक channel या account के लिए auto-restarts disable करने के लिए `channels.<provider>.healthMonitor.enabled` या `channels.<provider>.accounts.<id>.healthMonitor.enabled` इस्तेमाल करें।
    - operational debugging के लिए [Health Checks](/hi/gateway/health) और सभी fields के लिए [पूर्ण संदर्भ](/hi/gateway/configuration-reference#gateway) देखें।

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    loaded या low-powered hosts पर pre-auth WebSocket handshake पूरा करने के लिए
    local clients को अधिक समय दें:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Default `15000` milliseconds है।
    - one-off service या shell overrides के लिए `OPENCLAW_HANDSHAKE_TIMEOUT_MS` अब भी precedence लेता है।
    - पहले startup/event-loop stalls ठीक करना prefer करें; यह knob उन hosts के लिए है जो healthy हैं लेकिन warmup के दौरान slow हैं।

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Sessions conversation continuity और isolation नियंत्रित करते हैं:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
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
    - `threadBindings`: थ्रेड-बाउंड सत्र रूटिंग के लिए वैश्विक डिफ़ॉल्ट (Discord `/focus`, `/unfocus`, `/agents`, `/session idle`, और `/session max-age` का समर्थन करता है)।
    - स्कोपिंग, पहचान लिंक, और भेजने की नीति के लिए [सत्र प्रबंधन](/hi/concepts/session) देखें।
    - सभी फ़ील्ड के लिए [पूरा संदर्भ](/hi/gateway/config-agents#session) देखें।

  </Accordion>

  <Accordion title="Enable sandboxing">
    एजेंट सत्रों को अलग-थलग सैंडबॉक्स रनटाइम में चलाएं:

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

    पहले इमेज बनाएं - स्रोत चेकआउट से `scripts/sandbox-setup.sh` चलाएं, या npm इंस्टॉल से [सैंडबॉक्सिंग § इमेज और सेटअप](/hi/gateway/sandboxing#images-and-setup) में इनलाइन `docker build` कमांड देखें।

    पूरी गाइड के लिए [सैंडबॉक्सिंग](/hi/gateway/sandboxing) और सभी विकल्पों के लिए [पूरा संदर्भ](/hi/gateway/config-agents#agentsdefaultssandbox) देखें।

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
    सार्वजनिक App Store/TestFlight बिल्ड के लिए रिले-समर्थित पुश होस्ट किए गए OpenClaw रिले का उपयोग करता है: `https://ios-push-relay.openclaw.ai`।

    कस्टम रिले डिप्लॉयमेंट के लिए जानबूझकर अलग iOS बिल्ड/डिप्लॉयमेंट पथ चाहिए, जिसका रिले URL gateway रिले URL से मेल खाता हो। यदि आप कस्टम रिले बिल्ड का उपयोग कर रहे हैं, तो इसे gateway कॉन्फ़िग में सेट करें:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI समकक्ष:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    यह क्या करता है:

    - Gateway को बाहरी रिले के ज़रिए `push.test`, वेक संकेत, और रीकनेक्ट वेक भेजने देता है।
    - पेयर किए गए iOS ऐप द्वारा फ़ॉरवर्ड किए गए रजिस्ट्रेशन-स्कोप्ड सेंड ग्रांट का उपयोग करता है। Gateway को डिप्लॉयमेंट-वाइड रिले टोकन की आवश्यकता नहीं होती।
    - प्रत्येक रिले-समर्थित रजिस्ट्रेशन को उस Gateway पहचान से बांधता है जिससे iOS ऐप पेयर हुआ था, ताकि कोई दूसरा gateway संग्रहित रजिस्ट्रेशन का पुनः उपयोग न कर सके।
    - स्थानीय/मैनुअल iOS बिल्ड को सीधे APNs पर रखता है। रिले-समर्थित भेजना केवल उन आधिकारिक वितरित बिल्ड पर लागू होता है जिन्होंने रिले के ज़रिए रजिस्टर किया था।
    - iOS बिल्ड में बेक किए गए रिले बेस URL से मेल खाना चाहिए, ताकि रजिस्ट्रेशन और भेजने का ट्रैफ़िक उसी रिले डिप्लॉयमेंट तक पहुंचे।

    एंड-टू-एंड प्रवाह:

    1. आधिकारिक/TestFlight iOS बिल्ड इंस्टॉल करें।
    2. वैकल्पिक: `gateway.push.apns.relay.baseUrl` को Gateway पर केवल तब कॉन्फ़िगर करें जब जानबूझकर अलग कस्टम रिले बिल्ड का उपयोग कर रहे हों।
    3. iOS ऐप को Gateway से पेयर करें और node तथा ऑपरेटर, दोनों सत्रों को कनेक्ट होने दें।
    4. iOS ऐप Gateway पहचान लाता है, App Attest और ऐप रसीद का उपयोग करके रिले के साथ रजिस्टर करता है, और फिर रिले-समर्थित `push.apns.register` पेलोड को पेयर किए गए Gateway पर प्रकाशित करता है।
    5. Gateway रिले हैंडल और सेंड ग्रांट संग्रहित करता है, फिर उन्हें `push.test`, वेक संकेत, और रीकनेक्ट वेक के लिए उपयोग करता है।

    संचालन संबंधी नोट्स:

    - यदि आप iOS ऐप को किसी अलग Gateway पर स्विच करते हैं, तो ऐप को फिर से कनेक्ट करें ताकि वह उस Gateway से बंधा नया रिले रजिस्ट्रेशन प्रकाशित कर सके।
    - यदि आप नया iOS बिल्ड शिप करते हैं जो किसी अलग रिले डिप्लॉयमेंट की ओर इशारा करता है, तो ऐप पुराने रिले ओरिजिन का पुनः उपयोग करने के बजाय अपना कैश किया गया रिले रजिस्ट्रेशन ताज़ा करता है।

    संगतता नोट:

    - `OPENCLAW_APNS_RELAY_BASE_URL` और `OPENCLAW_APNS_RELAY_TIMEOUT_MS` अब भी अस्थायी env ओवरराइड के रूप में काम करते हैं।
    - कस्टम Gateway रिले URL को iOS बिल्ड में बेक किए गए रिले बेस URL से मेल खाना चाहिए। सार्वजनिक App Store रिलीज़ लेन कस्टम iOS रिले URL ओवरराइड को अस्वीकार करती है।
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` केवल loopback-ओनली विकास एस्केप हैच बना रहता है; HTTP रिले URL को कॉन्फ़िग में स्थायी रूप से न रखें।

    एंड-टू-एंड प्रवाह के लिए [iOS ऐप](/hi/platforms/ios#relay-backed-push-for-official-builds) और रिले सुरक्षा मॉडल के लिए [प्रमाणीकरण और भरोसा प्रवाह](/hi/platforms/ios#authentication-and-trust-flow) देखें।

  </Accordion>

  <Accordion title="Set up heartbeat (periodic check-ins)">
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

    - `every`: अवधि स्ट्रिंग (`30m`, `2h`)। अक्षम करने के लिए `0m` सेट करें।
    - `target`: `last` | `none` | `<channel-id>` (उदाहरण के लिए `discord`, `matrix`, `telegram`, या `whatsapp`)
    - `directPolicy`: DM-शैली Heartbeat लक्ष्यों के लिए `allow` (डिफ़ॉल्ट) या `block`
    - पूरी गाइड के लिए [Heartbeat](/hi/gateway/heartbeat) देखें।

  </Accordion>

  <Accordion title="Configure cron jobs">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: `sessions.json` से पूर्ण हुए अलग-थलग रन सत्रों को छांटें (डिफ़ॉल्ट `24h`; अक्षम करने के लिए `false` सेट करें)।
    - `runLog`: प्रति जॉब रखी गई cron रन-इतिहास पंक्तियों को छांटें। `maxBytes` पुराने फ़ाइल-समर्थित रन लॉग के लिए स्वीकार किया जाता रहता है।
    - फीचर अवलोकन और CLI उदाहरणों के लिए [Cron जॉब](/hi/automation/cron-jobs) देखें।

  </Accordion>

  <Accordion title="Set up webhooks (hooks)">
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

    सुरक्षा नोट:
    - सभी hook/Webhook पेलोड सामग्री को अविश्वसनीय इनपुट मानें।
    - समर्पित `hooks.token` का उपयोग करें; सक्रिय Gateway auth सीक्रेट (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) का पुनः उपयोग न करें।
    - Hook auth केवल हेडर-आधारित है (`Authorization: Bearer ...` या `x-openclaw-token`); query-string टोकन अस्वीकार किए जाते हैं।
    - `hooks.path` `/` नहीं हो सकता; Webhook इनग्रेस को `/hooks` जैसे समर्पित सबपाथ पर रखें।
    - असुरक्षित-सामग्री बायपास फ़्लैग (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) अक्षम रखें, जब तक कि बहुत सीमित दायरे में डीबगिंग न कर रहे हों।
    - यदि आप `hooks.allowRequestSessionKey` सक्षम करते हैं, तो कॉलर-चयनित सत्र कुंजियों को सीमित करने के लिए `hooks.allowedSessionKeyPrefixes` भी सेट करें।
    - Hook-चालित एजेंटों के लिए, मजबूत आधुनिक मॉडल टियर और सख्त टूल नीति को प्राथमिकता दें (उदाहरण के लिए केवल मैसेजिंग और जहां संभव हो सैंडबॉक्सिंग)।

    सभी मैपिंग विकल्पों और Gmail इंटीग्रेशन के लिए [पूरा संदर्भ](/hi/gateway/configuration-reference#hooks) देखें।

  </Accordion>

  <Accordion title="Configure multi-agent routing">
    अलग वर्कस्पेस और सत्रों के साथ कई अलग-थलग एजेंट चलाएं:

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

    बाइंडिंग नियमों और प्रति-एजेंट एक्सेस प्रोफ़ाइल के लिए [Multi-Agent](/hi/concepts/multi-agent) और [पूरा संदर्भ](/hi/gateway/config-agents#multi-agent-routing) देखें।

  </Accordion>

  <Accordion title="Split config into multiple files ($include)">
    बड़े कॉन्फ़िग व्यवस्थित करने के लिए `$include` का उपयोग करें:

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

    - **एकल फ़ाइल**: कंटेनिंग ऑब्जेक्ट को बदल देती है
    - **फ़ाइलों की एरे**: क्रम में डीप-मर्ज की जाती है (बाद वाली जीतती है)
    - **सिब्लिंग कुंजियां**: includes के बाद मर्ज की जाती हैं (शामिल मानों को ओवरराइड करती हैं)
    - **नेस्टेड includes**: 10 स्तर गहराई तक समर्थित
    - **सापेक्ष पथ**: include करने वाली फ़ाइल के सापेक्ष हल किए जाते हैं
    - **पथ फ़ॉर्मैट**: include पथों में null bytes नहीं होने चाहिए और resolution से पहले और बाद में 4096 वर्णों से सख्ती से छोटे होने चाहिए
    - **OpenClaw-स्वामित्व वाले लेखन**: जब कोई लेखन केवल एक शीर्ष-स्तरीय सेक्शन बदलता है
      जो `plugins: { $include: "./plugins.json5" }` जैसे single-file include द्वारा समर्थित हो,
      OpenClaw उस शामिल फ़ाइल को अपडेट करता है और `openclaw.json` को जस का तस छोड़ देता है
    - **असमर्थित write-through**: root includes, include arrays, और sibling overrides
      वाले includes OpenClaw-स्वामित्व वाले लेखन के लिए कॉन्फ़िग को
      flatten करने के बजाय fail closed होते हैं
    - **Confinement**: `$include` पथ उस डायरेक्टरी के अंदर हल होने चाहिए जिसमें
      `openclaw.json` है। मशीनों या उपयोगकर्ताओं के बीच ट्री साझा करने के लिए,
      `OPENCLAW_INCLUDE_ROOTS` को अतिरिक्त डायरेक्टरी की path-list (`:` POSIX पर, `;` Windows पर) पर सेट करें
      जिन्हें includes संदर्भित कर सकते हैं। Symlinks हल किए जाते हैं
      और फिर से जांचे जाते हैं, इसलिए कोई पथ जो लेक्सिकली config dir में रहता है लेकिन जिसका
      वास्तविक लक्ष्य हर अनुमत root से बाहर निकलता है, फिर भी अस्वीकार किया जाता है।
    - **त्रुटि प्रबंधन**: गुम फ़ाइलों, parse errors, circular includes, अमान्य path format, और अत्यधिक लंबाई के लिए स्पष्ट त्रुटियां

  </Accordion>
</AccordionGroup>

## कॉन्फ़िग hot reload

Gateway `~/.openclaw/openclaw.json` को देखता है और बदलावों को स्वतः लागू करता है - अधिकांश सेटिंग्स के लिए मैनुअल restart की आवश्यकता नहीं होती।

सीधे फ़ाइल संपादन को तब तक अविश्वसनीय माना जाता है जब तक वे validate न हो जाएं। watcher editor temp-write/rename churn के शांत होने की प्रतीक्षा करता है, अंतिम फ़ाइल पढ़ता है, और अमान्य बाहरी संपादनों को `openclaw.json` फिर से लिखे बिना अस्वीकार करता है। OpenClaw-स्वामित्व वाले config लेखन, लिखने से पहले उसी schema gate का उपयोग करते हैं; `gateway.mode` हटाने या फ़ाइल को आधे से अधिक छोटा करने जैसे destructive clobbers अस्वीकार किए जाते हैं और निरीक्षण के लिए `.rejected.*` के रूप में सहेजे जाते हैं।

यदि आपको `config reload skipped (invalid config)` दिखता है या startup `Invalid
config` रिपोर्ट करता है, तो config निरीक्षण करें, `openclaw config validate` चलाएं, फिर repair के लिए `openclaw
doctor --fix` चलाएं। चेकलिस्ट के लिए [Gateway troubleshooting](/hi/gateway/troubleshooting#gateway-rejected-invalid-config) देखें।

### Reload मोड

| मोड                    | व्यवहार                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (डिफ़ॉल्ट) | सुरक्षित बदलावों को तुरंत hot-apply करता है। महत्वपूर्ण बदलावों के लिए स्वतः restart करता है। |
| **`hot`**              | केवल सुरक्षित बदलावों को hot-apply करता है। restart आवश्यक होने पर चेतावनी लॉग करता है - आप इसे संभालते हैं। |
| **`restart`**          | किसी भी config बदलाव पर Gateway restart करता है, चाहे सुरक्षित हो या नहीं।             |
| **`off`**              | फ़ाइल watching अक्षम करता है। बदलाव अगले मैनुअल restart पर प्रभावी होते हैं।            |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### क्या hot-apply होता है बनाम किसे restart चाहिए

अधिकांश फ़ील्ड downtime के बिना hot-apply होते हैं। `hybrid` मोड में, restart-आवश्यक बदलाव स्वतः संभाले जाते हैं।

| श्रेणी            | फ़ील्ड                                                            | पुनरारंभ आवश्यक है? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| चैनल            | `channels.*`, `web` (WhatsApp) - सभी अंतर्निहित और plugin चैनल | नहीं              |
| Agent और मॉडल      | `agent`, `agents`, `models`, `routing`                            | नहीं              |
| स्वचालन          | `hooks`, `cron`, `agent.heartbeat`                                | नहीं              |
| सत्र और संदेश | `session`, `messages`                                             | नहीं              |
| टूल और मीडिया       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | नहीं              |
| UI और विविध           | `ui`, `logging`, `identity`, `bindings`                           | नहीं              |
| Gateway सर्वर      | `gateway.*` (पोर्ट, बाइंड, ऑथ, tailscale, TLS, HTTP)              | **हाँ**         |
| इन्फ्रास्ट्रक्चर      | `discovery`, `plugins`                                            | **हाँ**         |

<Note>
`gateway.reload` और `gateway.remote` अपवाद हैं - इन्हें बदलने से पुनरारंभ **नहीं** होता।
</Note>

### रीलोड योजना

जब आप किसी ऐसे स्रोत फ़ाइल को संपादित करते हैं जिसे `$include` के ज़रिए संदर्भित किया गया है, OpenClaw
रीलोड की योजना स्रोत-लेखित लेआउट से बनाता है, समतल इन-मेमोरी दृश्य से नहीं।
इससे हॉट-रीलोड निर्णय (हॉट-अप्लाई बनाम पुनरारंभ) पूर्वानुमेय रहते हैं, भले ही
एक ही शीर्ष-स्तरीय सेक्शन अपनी अलग शामिल फ़ाइल में हो, जैसे
`plugins: { $include: "./plugins.json5" }`। यदि स्रोत लेआउट अस्पष्ट हो, तो रीलोड योजना बंद होकर विफल होती है।

## कॉन्फ़िग RPC (प्रोग्रामेटिक अपडेट)

Gateway API पर कॉन्फ़िग लिखने वाले टूलिंग के लिए, इस प्रवाह को प्राथमिकता दें:

- एक सबट्री देखने के लिए `config.schema.lookup` (उथला स्कीमा नोड + चाइल्ड
  सारांश)
- मौजूदा स्नैपशॉट और `hash` लाने के लिए `config.get`
- आंशिक अपडेट के लिए `config.patch` (JSON मर्ज पैच: ऑब्जेक्ट मर्ज होते हैं, `null`
  हटाता है, ऐरे बदलते हैं जब `replacePaths` के साथ स्पष्ट पुष्टि हो, यदि
  प्रविष्टियाँ हटेंगी)
- `config.apply` केवल तब जब आप पूरा कॉन्फ़िग बदलना चाहते हों
- स्पष्ट स्वयं-अद्यतन और पुनरारंभ के लिए `update.run`; पुनरारंभ के बाद के सत्र में एक फ़ॉलो-अप टर्न चलाना हो तो `continuationMessage` शामिल करें
- नवीनतम अपडेट पुनरारंभ सेंटिनल देखने और पुनरारंभ के बाद चल रहे संस्करण को सत्यापित करने के लिए `update.status`

Agents को सटीक फ़ील्ड-स्तरीय दस्तावेज़ और सीमाओं के लिए `config.schema.lookup` को पहला पड़ाव मानना चाहिए।
जब उन्हें व्यापक कॉन्फ़िग मानचित्र, डिफ़ॉल्ट, या समर्पित
सब-सिस्टम संदर्भों के लिंक चाहिए हों, तो [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) का उपयोग करें।

<Note>
कंट्रोल-प्लेन लेखन (`config.apply`, `config.patch`, `update.run`) प्रति
`deviceId+clientIp` हर 60 सेकंड में 3 अनुरोधों तक दर-सीमित हैं। पुनरारंभ
अनुरोध आपस में मिलाए जाते हैं और फिर पुनरारंभ चक्रों के बीच 30 सेकंड का कूलडाउन लागू करते हैं।
`update.status` केवल-पढ़ने योग्य है, लेकिन व्यवस्थापक-सीमित है क्योंकि पुनरारंभ सेंटिनल
में अपडेट चरण सारांश और कमांड आउटपुट के अंतिम हिस्से शामिल हो सकते हैं।
</Note>

उदाहरण आंशिक पैच:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` और `config.patch` दोनों `raw`, `baseHash`, `sessionKey`,
`note`, और `restartDelayMs` स्वीकार करते हैं। जब कोई कॉन्फ़िग पहले से मौजूद हो, तो दोनों विधियों के लिए `baseHash` आवश्यक है।

`config.patch` `replacePaths` भी स्वीकार करता है, जो उन कॉन्फ़िग पथों की ऐरे है जिनका ऐरे
प्रतिस्थापन जानबूझकर किया जा रहा है। यदि कोई पैच मौजूदा ऐरे को कम प्रविष्टियों वाली ऐरे से बदलता या हटाता है,
तो Gateway लेखन को अस्वीकार करता है जब तक कि वही सटीक पथ
`replacePaths` में मौजूद न हो; ऐरे प्रविष्टियों के नीचे नेस्टेड ऐरे `[]` का उपयोग करते हैं, जैसे
`agents.list[].skills`। यह कटे हुए `config.get` स्नैपशॉट को
रूटिंग या allowlist ऐरे को चुपचाप ओवरराइट करने से रोकता है। जब आप
पूरा कॉन्फ़िग बदलना चाहते हों, तो `config.apply` का उपयोग करें।

## वातावरण वेरिएबल

OpenClaw पैरेंट प्रोसेस और इनके साथ env vars पढ़ता है:

- मौजूदा कार्य निर्देशिका से `.env` (यदि मौजूद हो)
- `~/.openclaw/.env` (वैश्विक फ़ॉलबैक)

कोई भी फ़ाइल मौजूदा env vars को ओवरराइड नहीं करती। आप कॉन्फ़िग में इनलाइन env vars भी सेट कर सकते हैं:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  यदि सक्षम हो और अपेक्षित कुंजियाँ सेट न हों, तो OpenClaw आपका लॉगिन शेल चलाता है और केवल गुम कुंजियाँ आयात करता है:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var समतुल्य: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  किसी भी कॉन्फ़िग स्ट्रिंग मान में `${VAR_NAME}` के साथ env vars संदर्भित करें:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

नियम:

- केवल बड़े अक्षरों वाले नाम मिलाए जाते हैं: `[A-Z_][A-Z0-9_]*`
- गुम/खाली vars लोड समय पर त्रुटि देते हैं
- शाब्दिक आउटपुट के लिए `$${VAR}` से एस्केप करें
- `$include` फ़ाइलों के अंदर काम करता है
- इनलाइन प्रतिस्थापन: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  SecretRef ऑब्जेक्ट का समर्थन करने वाले फ़ील्ड के लिए, आप उपयोग कर सकते हैं:

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

SecretRef विवरण (`env`/`file`/`exec` के लिए `secrets.providers` सहित) [सीक्रेट्स प्रबंधन](/hi/gateway/secrets) में हैं।
समर्थित क्रेडेंशियल पथ [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) में सूचीबद्ध हैं।
</Accordion>

पूर्ण प्राथमिकता क्रम और स्रोतों के लिए [वातावरण](/hi/help/environment) देखें।

## पूर्ण संदर्भ

पूर्ण फ़ील्ड-दर-फ़ील्ड संदर्भ के लिए, **[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)** देखें।

---

_संबंधित: [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) · [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) · [Doctor](/hi/gateway/doctor)_

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples)
- [Gateway रनबुक](/hi/gateway)
