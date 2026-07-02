---
read_when:
    - OpenClaw को पहली बार सेट अप करना
    - सामान्य कॉन्फ़िगरेशन पैटर्न खोज रहे हैं
    - विशिष्ट कॉन्फ़िगरेशन अनुभागों पर नेविगेट करना
summary: 'कॉन्फ़िगरेशन अवलोकन: सामान्य कार्य, त्वरित सेटअप, और पूर्ण संदर्भ के लिंक'
title: कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-07-02T08:19:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw वैकल्पिक <Tooltip tip="JSON5 टिप्पणियों और ट्रेलिंग कॉमा का समर्थन करता है">**JSON5**</Tooltip> config को `~/.openclaw/openclaw.json` से पढ़ता है।
सक्रिय config पथ एक सामान्य फ़ाइल होना चाहिए। Symlink किए गए `openclaw.json`
लेआउट OpenClaw-स्वामित्व वाले लिखने के लिए समर्थित नहीं हैं; atomic write symlink को
सुरक्षित रखने के बजाय पथ को बदल सकता है। यदि आप config को default state directory से बाहर रखते हैं, तो
`OPENCLAW_CONFIG_PATH` को सीधे वास्तविक फ़ाइल पर पॉइंट करें।

यदि फ़ाइल अनुपस्थित है, तो OpenClaw सुरक्षित default का उपयोग करता है। config जोड़ने के सामान्य कारण:

- channel कनेक्ट करें और नियंत्रित करें कि bot को कौन message कर सकता है
- model, tool, sandboxing, या automation (cron, hooks) सेट करें
- session, media, networking, या UI को tune करें

हर उपलब्ध field के लिए [पूर्ण संदर्भ](/hi/gateway/configuration-reference) देखें।

Agents और automation को config संपादित करने से पहले सटीक field-स्तरीय
docs के लिए `config.schema.lookup` का उपयोग करना चाहिए। इस पेज का उपयोग task-oriented guidance के लिए और
व्यापक field map और defaults के लिए
[Configuration reference](/hi/gateway/configuration-reference) का उपयोग करें।

<Tip>
**configuration में नए हैं?** interactive setup के लिए `openclaw onboard` से शुरू करें, या पूरी copy-paste configs के लिए [Configuration Examples](/hi/gateway/configuration-examples) guide देखें।
</Tip>

## न्यूनतम config

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## config संपादित करना

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
    [http://127.0.0.1:18789](http://127.0.0.1:18789) खोलें और **Config** tab का उपयोग करें।
    Control UI live config schema से एक form render करता है, जिसमें field
    `title` / `description` docs metadata के साथ plugin और channel schemas भी
    उपलब्ध होने पर शामिल होते हैं, और escape hatch के रूप में **Raw JSON** editor होता है। Drill-down
    UIs और अन्य tooling के लिए, gateway `config.schema.lookup` भी expose करता है ताकि
    एक path-scoped schema node और immediate child summaries fetch किए जा सकें।
  </Tab>
  <Tab title="Direct edit">
    `~/.openclaw/openclaw.json` को सीधे संपादित करें। Gateway फ़ाइल को watch करता है और changes अपने-आप apply करता है ([hot reload](#config-hot-reload) देखें)।
  </Tab>
</Tabs>

## Strict validation

<Warning>
OpenClaw केवल उन configurations को स्वीकार करता है जो schema से पूरी तरह match करती हैं। Unknown keys, malformed types, या invalid values के कारण Gateway **start करने से इंकार** कर देता है। Root-level पर केवल `$schema` (string) exception है, ताकि editors JSON Schema metadata attach कर सकें।
</Warning>

`openclaw config schema` Control UI और validation द्वारा उपयोग किया जाने वाला canonical JSON Schema print करता है।
`config.schema.lookup` drill-down tooling के लिए एक path-scoped node और
child summaries fetch करता है। Field `title`/`description` docs metadata
nested objects, wildcard (`*`), array-item (`[]`), और `anyOf`/
`oneOf`/`allOf` branches तक carry through होता है। Runtime plugin और channel schemas तब merge होते हैं जब
manifest registry load होती है।

जब validation fail होता है:

- Gateway boot नहीं करता
- केवल diagnostic commands काम करते हैं (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- सटीक issues देखने के लिए `openclaw doctor` चलाएँ
- repairs apply करने के लिए `openclaw doctor --fix` (या `--yes`) चलाएँ

Gateway हर successful startup के बाद एक trusted last-known-good copy रखता है,
लेकिन startup और hot reload इसे automatically restore नहीं करते। यदि `openclaw.json`
validation में fail होता है (plugin-local validation सहित), तो Gateway startup fail होता है या
reload skip हो जाता है और current runtime last accepted config रखता है।
prefixed/clobbered config repair करने या last-known-good copy restore करने के लिए
`openclaw doctor --fix` (या `--yes`) चलाएँ। जब candidate में `***` जैसे
redacted secret placeholders होते हैं, तो last-known-good में promotion skip हो जाता है।

## सामान्य tasks

<AccordionGroup>
  <Accordion title="channel सेट करें (WhatsApp, Telegram, Discord, आदि)">
    प्रत्येक channel का अपना config section `channels.<provider>` के अंतर्गत होता है। setup steps के लिए dedicated channel page देखें:

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

  <Accordion title="models चुनें और configure करें">
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

    - `agents.defaults.models` model catalog define करता है और `/model` के लिए allowlist की तरह काम करता है; `provider/*` entries dynamic model discovery का उपयोग जारी रखते हुए `/model`, `/models`, और model pickers को selected providers तक filter करती हैं।
    - existing models हटाए बिना allowlist entries जोड़ने के लिए `openclaw config set agents.defaults.models '<json>' --strict-json --merge` का उपयोग करें। Plain replacements जो entries हटाएँगे, reject कर दिए जाते हैं जब तक आप `--replace` pass नहीं करते।
    - Model refs `provider/model` format का उपयोग करते हैं (जैसे `anthropic/claude-opus-4-6`)।
    - `agents.defaults.imageMaxDimensionPx` transcript/tool image downscaling नियंत्रित करता है (default `1200`); कम values आम तौर पर screenshot-heavy runs में vision-token usage घटाती हैं।
    - chat में models switch करने के लिए [Models CLI](/hi/concepts/models) और auth rotation तथा fallback behavior के लिए [Model Failover](/hi/concepts/model-failover) देखें।
    - custom/self-hosted providers के लिए, reference में [Custom providers](/hi/gateway/config-tools#custom-providers-and-base-urls) देखें।

  </Accordion>

  <Accordion title="नियंत्रित करें कि bot को कौन message कर सकता है">
    DM access प्रति channel `dmPolicy` के माध्यम से नियंत्रित होता है:

    - `"pairing"` (default): unknown senders को approve करने के लिए one-time pairing code मिलता है
    - `"allowlist"`: केवल `allowFrom` (या paired allow store) में मौजूद senders
    - `"open"`: सभी inbound DMs allow करें (`allowFrom: ["*"]` आवश्यक)
    - `"disabled"`: सभी DMs ignore करें

    groups के लिए, `groupPolicy` + `groupAllowFrom` या channel-specific allowlists का उपयोग करें।

    per-channel details के लिए [full reference](/hi/gateway/config-channels#dm-and-group-access) देखें।

  </Accordion>

  <Accordion title="group chat mention gating सेट करें">
    Group messages default रूप से **mention require** करते हैं। प्रति agent trigger patterns configure करें। सामान्य group/channel replies automatically post होते हैं; shared rooms के लिए message-tool path में opt in करें जहाँ agent को तय करना चाहिए कि कब बोलना है:

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
    - visible reply modes, per-channel overrides, और self-chat mode के लिए [full reference](/hi/gateway/config-channels#group-chat-mention-gating) देखें।

  </Accordion>

  <Accordion title="प्रति agent skills restrict करें">
    shared baseline के लिए `agents.defaults.skills` का उपयोग करें, फिर specific
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
      [Configuration Reference](/hi/gateway/config-agents#agents-defaults-skills) देखें।

  </Accordion>

  <Accordion title="gateway channel health monitoring tune करें">
    नियंत्रित करें कि stale दिखने वाले channels को gateway कितनी aggressively restart करता है:

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

    - health-monitor restarts globally disable करने के लिए `gateway.channelHealthCheckMinutes: 0` सेट करें।
    - `channelStaleEventThresholdMinutes` check interval से greater than or equal होना चाहिए।
    - global monitor disable किए बिना किसी एक channel या account के लिए auto-restarts disable करने हेतु `channels.<provider>.healthMonitor.enabled` या `channels.<provider>.accounts.<id>.healthMonitor.enabled` का उपयोग करें।
    - operational debugging के लिए [Health Checks](/hi/gateway/health) और सभी fields के लिए [full reference](/hi/gateway/configuration-reference#gateway) देखें।

  </Accordion>

  <Accordion title="gateway WebSocket handshake timeout tune करें">
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
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` अभी भी one-off service या shell overrides के लिए precedence लेता है।
    - पहले startup/event-loop stalls ठीक करना prefer करें; यह knob उन hosts के लिए है जो healthy हैं लेकिन warmup के दौरान slow हैं।

  </Accordion>

  <Accordion title="sessions और resets configure करें">
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
    - सभी फ़ील्ड के लिए [पूर्ण संदर्भ](/hi/gateway/config-agents#session) देखें।

  </Accordion>

  <Accordion title="सैंडबॉक्सिंग सक्षम करें">
    एजेंट सत्रों को अलग-थलग सैंडबॉक्स रनटाइम में चलाएँ:

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

    पहले इमेज बनाएँ - स्रोत checkout से `scripts/sandbox-setup.sh` चलाएँ, या npm इंस्टॉल से [सैंडबॉक्सिंग § इमेज और सेटअप](/hi/gateway/sandboxing#images-and-setup) में दिया गया इनलाइन `docker build` कमांड देखें।

    पूर्ण गाइड के लिए [सैंडबॉक्सिंग](/hi/gateway/sandboxing) और सभी विकल्पों के लिए [पूर्ण संदर्भ](/hi/gateway/config-agents#agentsdefaultssandbox) देखें।

  </Accordion>

  <Accordion title="आधिकारिक iOS बिल्ड के लिए रिले-समर्थित पुश सक्षम करें">
    सार्वजनिक App Store बिल्ड के लिए रिले-समर्थित पुश होस्ट किए गए OpenClaw रिले का उपयोग करता है: `https://ios-push-relay.openclaw.ai`।

    कस्टम रिले डिप्लॉयमेंट के लिए जानबूझकर अलग iOS बिल्ड/डिप्लॉयमेंट पथ आवश्यक है, जिसका रिले URL Gateway रिले URL से मेल खाता हो। यदि आप कस्टम रिले बिल्ड का उपयोग कर रहे हैं, तो इसे Gateway कॉन्फ़िग में सेट करें:

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

    - Gateway को बाहरी रिले के माध्यम से `push.test`, जगाने वाले संकेत, और पुनः-कनेक्ट जगाने वाले संकेत भेजने देता है।
    - जोड़ी गई iOS ऐप द्वारा फ़ॉरवर्ड किए गए पंजीकरण-स्कोप वाले भेजने के अनुदान का उपयोग करता है। Gateway को डिप्लॉयमेंट-व्यापी रिले टोकन की आवश्यकता नहीं होती।
    - प्रत्येक रिले-समर्थित पंजीकरण को उस Gateway पहचान से बाँधता है जिससे iOS ऐप जोड़ी गई थी, ताकि कोई दूसरा Gateway संग्रहीत पंजीकरण का पुनः उपयोग न कर सके।
    - स्थानीय/मैनुअल iOS बिल्ड को सीधे APNs पर रखता है। रिले-समर्थित भेजना केवल उन आधिकारिक वितरित बिल्ड पर लागू होता है जिन्होंने रिले के माध्यम से पंजीकरण किया।
    - iOS बिल्ड में बेक किए गए रिले बेस URL से मेल खाना चाहिए, ताकि पंजीकरण और भेजने वाला ट्रैफ़िक उसी रिले डिप्लॉयमेंट तक पहुँचे।

    एंड-टू-एंड प्रवाह:

    1. आधिकारिक iOS ऐप इंस्टॉल करें।
    2. वैकल्पिक: `gateway.push.apns.relay.baseUrl` को Gateway पर केवल तब कॉन्फ़िगर करें जब जानबूझकर अलग कस्टम रिले बिल्ड का उपयोग कर रहे हों।
    3. iOS ऐप को Gateway से पेयर करें और Node तथा ऑपरेटर सत्रों को कनेक्ट होने दें।
    4. iOS ऐप Gateway पहचान प्राप्त करता है, App Attest और ऐप रसीद का उपयोग करके रिले के साथ पंजीकरण करता है, और फिर रिले-समर्थित `push.apns.register` पेलोड को पेयर किए गए Gateway पर प्रकाशित करता है।
    5. Gateway रिले हैंडल और भेजने का अनुदान संग्रहीत करता है, फिर उन्हें `push.test`, जगाने वाले संकेत, और पुनः-कनेक्ट जगाने वाले संकेतों के लिए उपयोग करता है।

    संचालन संबंधी नोट्स:

    - यदि आप iOS ऐप को किसी अलग Gateway पर स्विच करते हैं, तो ऐप को पुनः कनेक्ट करें ताकि वह उस Gateway से बँधा नया रिले पंजीकरण प्रकाशित कर सके।
    - यदि आप नया iOS बिल्ड शिप करते हैं जो किसी अलग रिले डिप्लॉयमेंट की ओर संकेत करता है, तो ऐप पुराने रिले ओरिजिन का पुनः उपयोग करने के बजाय अपने कैश किए गए रिले पंजीकरण को रीफ़्रेश करता है।

    संगतता नोट:

    - `OPENCLAW_APNS_RELAY_BASE_URL` और `OPENCLAW_APNS_RELAY_TIMEOUT_MS` अभी भी अस्थायी env ओवरराइड के रूप में काम करते हैं।
    - कस्टम Gateway रिले URL को iOS बिल्ड में बेक किए गए रिले बेस URL से मेल खाना चाहिए। सार्वजनिक App Store रिलीज़ लेन कस्टम iOS रिले URL ओवरराइड को अस्वीकार करती है।
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` केवल loopback विकास के लिए बचाव मार्ग बना रहता है; HTTP रिले URL को कॉन्फ़िग में स्थायी न रखें।

    एंड-टू-एंड प्रवाह के लिए [iOS ऐप](/hi/platforms/ios#relay-backed-push-for-official-builds) और रिले सुरक्षा मॉडल के लिए [प्रमाणीकरण और भरोसा प्रवाह](/hi/platforms/ios#authentication-and-trust-flow) देखें।

  </Accordion>

  <Accordion title="Heartbeat सेट अप करें (आवधिक चेक-इन)">
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
    - पूर्ण गाइड के लिए [Heartbeat](/hi/gateway/heartbeat) देखें।

  </Accordion>

  <Accordion title="Cron जॉब कॉन्फ़िगर करें">
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

    - `sessionRetention`: `sessions.json` से पूर्ण हुए अलग-थलग रन सत्र हटाएँ (डिफ़ॉल्ट `24h`; अक्षम करने के लिए `false` सेट करें)।
    - `runLog`: प्रति जॉब बनाए रखी गई Cron रन-इतिहास पंक्तियाँ हटाएँ। पुराने फ़ाइल-समर्थित रन लॉग के लिए `maxBytes` अभी भी स्वीकार किया जाता है।
    - फ़ीचर अवलोकन और CLI उदाहरणों के लिए [Cron जॉब](/hi/automation/cron-jobs) देखें।

  </Accordion>

  <Accordion title="Webhook सेट अप करें (हुक)">
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
    - सभी हुक/Webhook पेलोड सामग्री को अविश्वसनीय इनपुट मानें।
    - समर्पित `hooks.token` का उपयोग करें; सक्रिय Gateway auth secrets (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) का पुनः उपयोग न करें।
    - हुक auth केवल हेडर-आधारित है (`Authorization: Bearer ...` या `x-openclaw-token`); query-string टोकन अस्वीकार किए जाते हैं।
    - `hooks.path` `/` नहीं हो सकता; Webhook इनग्रेस को `/hooks` जैसे समर्पित सबपाथ पर रखें।
    - असुरक्षित-सामग्री बायपास फ़्लैग (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) को अक्षम रखें, जब तक कि सीमित दायरे में डिबगिंग न कर रहे हों।
    - यदि आप `hooks.allowRequestSessionKey` सक्षम करते हैं, तो कॉलर-चयनित सत्र कुंजियों को सीमित करने के लिए `hooks.allowedSessionKeyPrefixes` भी सेट करें।
    - हुक-चालित एजेंटों के लिए, मजबूत आधुनिक मॉडल tiers और सख्त टूल नीति को प्राथमिकता दें (उदाहरण के लिए केवल मैसेजिंग, और जहाँ संभव हो वहाँ सैंडबॉक्सिंग)।

    सभी मैपिंग विकल्पों और Gmail इंटीग्रेशन के लिए [पूर्ण संदर्भ](/hi/gateway/configuration-reference#hooks) देखें।

  </Accordion>

  <Accordion title="मल्टी-एजेंट रूटिंग कॉन्फ़िगर करें">
    अलग-अलग वर्कस्पेस और सत्रों के साथ कई अलग-थलग एजेंट चलाएँ:

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

    बाइंडिंग नियमों और प्रति-एजेंट एक्सेस प्रोफ़ाइल के लिए [मल्टी-एजेंट](/hi/concepts/multi-agent) और [पूर्ण संदर्भ](/hi/gateway/config-agents#multi-agent-routing) देखें।

  </Accordion>

  <Accordion title="कॉन्फ़िग को कई फ़ाइलों में विभाजित करें ($include)">
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

    - **एकल फ़ाइल**: शामिल ऑब्जेक्ट को बदल देती है
    - **फ़ाइलों की ऐरे**: क्रम में डीप-मर्ज की जाती है (बाद वाली जीतती है)
    - **सिब्लिंग कुंजियाँ**: includes के बाद मर्ज की जाती हैं (शामिल मानों को ओवरराइड करती हैं)
    - **नेस्टेड includes**: 10 स्तरों की गहराई तक समर्थित
    - **सापेक्ष पथ**: शामिल करने वाली फ़ाइल के सापेक्ष रिज़ॉल्व किए जाते हैं
    - **पथ फ़ॉर्मेट**: include पथों में null bytes नहीं होने चाहिए और रिज़ॉल्यूशन से पहले और बाद में 4096 वर्णों से सख्ती से छोटे होने चाहिए
    - **OpenClaw-स्वामित्व वाले लेखन**: जब कोई लेखन केवल एक top-level सेक्शन बदलता है
      जो `plugins: { $include: "./plugins.json5" }` जैसे single-file include द्वारा समर्थित हो,
      OpenClaw उस शामिल फ़ाइल को अपडेट करता है और `openclaw.json` को जस का तस छोड़ देता है
    - **असमर्थित write-through**: root includes, include arrays, और sibling overrides
      वाले includes OpenClaw-स्वामित्व वाले लेखन के लिए कॉन्फ़िग को flatten करने के बजाय
      fail closed करते हैं
    - **सीमाबद्धता**: `$include` पथों को उस डायरेक्टरी के अंतर्गत रिज़ॉल्व होना चाहिए जिसमें
      `openclaw.json` है। मशीनों या उपयोगकर्ताओं के बीच tree साझा करने के लिए,
      `OPENCLAW_INCLUDE_ROOTS` को अतिरिक्त डायरेक्टरियों की path-list (`:` POSIX पर, `;` Windows पर) पर सेट करें
      जिन्हें includes संदर्भित कर सकते हैं। Symlinks को रिज़ॉल्व करके
      फिर से जाँचा जाता है, इसलिए जो पथ शाब्दिक रूप से config dir में रहता है लेकिन जिसका
      वास्तविक target हर allowed root से बाहर निकलता है, वह फिर भी अस्वीकार किया जाता है।
    - **त्रुटि प्रबंधन**: गुम फ़ाइलों, parse errors, circular includes, अमान्य पथ फ़ॉर्मेट, और अत्यधिक लंबाई के लिए स्पष्ट त्रुटियाँ

  </Accordion>
</AccordionGroup>

## कॉन्फ़िग hot reload

Gateway `~/.openclaw/openclaw.json` को देखता है और बदलावों को अपने-आप लागू करता है - अधिकांश सेटिंग्स के लिए मैनुअल restart की आवश्यकता नहीं होती।

सीधे फ़ाइल संपादन तब तक अविश्वसनीय माने जाते हैं जब तक वे validate न हो जाएँ। watcher
editor temp-write/rename churn के शांत होने की प्रतीक्षा करता है, अंतिम फ़ाइल पढ़ता है, और
अमान्य बाहरी संपादनों को `openclaw.json` दोबारा लिखे बिना अस्वीकार करता है। OpenClaw-स्वामित्व वाले config
writes लिखने से पहले वही schema gate उपयोग करते हैं; `gateway.mode` हटाने या
फ़ाइल को आधे से अधिक छोटा करने जैसे destructive clobbers अस्वीकार किए जाते हैं और
निरीक्षण के लिए `.rejected.*` के रूप में सहेजे जाते हैं।

यदि आपको `config reload skipped (invalid config)` दिखाई दे या startup `Invalid
config` रिपोर्ट करे, तो config की जाँच करें, `openclaw config validate` चलाएँ, फिर मरम्मत के लिए `openclaw
doctor --fix` चलाएँ। चेकलिस्ट के लिए [Gateway समस्या निवारण](/hi/gateway/troubleshooting#gateway-rejected-invalid-config)
देखें।

### Reload मोड

| मोड                   | व्यवहार                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (डिफ़ॉल्ट) | सुरक्षित बदलावों को तुरंत hot-apply करता है। महत्वपूर्ण बदलावों के लिए अपने-आप restart करता है।           |
| **`hot`**              | केवल सुरक्षित बदलावों को hot-apply करता है। restart की आवश्यकता होने पर चेतावनी लॉग करता है - आप उसे संभालते हैं। |
| **`restart`**          | किसी भी config बदलाव पर Gateway को restart करता है, चाहे वह सुरक्षित हो या नहीं।                                 |
| **`off`**              | फ़ाइल watching अक्षम करता है। बदलाव अगले मैनुअल restart पर प्रभावी होते हैं।                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### क्या hot-apply होता है बनाम किसे restart चाहिए

अधिकांश फ़ील्ड downtime के बिना hot-apply होते हैं। `hybrid` मोड में, restart-आवश्यक बदलाव अपने-आप संभाले जाते हैं।

| श्रेणी              | फ़ील्ड                                                            | पुनरारंभ आवश्यक? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| चैनल                | `channels.*`, `web` (WhatsApp) - सभी अंतर्निहित और Plugin चैनल | नहीं              |
| एजेंट और मॉडल      | `agent`, `agents`, `models`, `routing`                            | नहीं              |
| ऑटोमेशन            | `hooks`, `cron`, `agent.heartbeat`                                | नहीं              |
| सत्र और संदेश      | `session`, `messages`                                             | नहीं              |
| टूल और मीडिया      | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | नहीं              |
| UI और विविध        | `ui`, `logging`, `identity`, `bindings`                           | नहीं              |
| Gateway सर्वर      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **हाँ**         |
| इन्फ्रास्ट्रक्चर   | `discovery`, `plugins`                                            | **हाँ**         |

<Note>
`gateway.reload` और `gateway.remote` अपवाद हैं - इन्हें बदलने से पुनरारंभ **नहीं** होता।
</Note>

### रीलोड योजना

जब आप `$include` के माध्यम से संदर्भित किसी स्रोत फ़ाइल को संपादित करते हैं, OpenClaw
रीलोड की योजना स्रोत-लिखित लेआउट से बनाता है, न कि समतल किए गए इन-मेमोरी दृश्य से।
इससे हॉट-रीलोड निर्णय (हॉट-अप्लाई बनाम पुनरारंभ) पूर्वानुमेय रहते हैं, भले ही कोई
एकल शीर्ष-स्तरीय सेक्शन अपनी अलग शामिल फ़ाइल में हो, जैसे
`plugins: { $include: "./plugins.json5" }`। यदि स्रोत लेआउट अस्पष्ट हो, तो रीलोड योजना सुरक्षित रूप से विफल होती है।

## कॉन्फ़िग RPC (प्रोग्रामेटिक अपडेट)

Gateway API के ऊपर कॉन्फ़िग लिखने वाले टूलिंग के लिए, इस प्रवाह को प्राथमिकता दें:

- एक सबट्री का निरीक्षण करने के लिए `config.schema.lookup` (उथला स्कीमा नोड + चाइल्ड
  सारांश)
- मौजूदा स्नैपशॉट और `hash` लाने के लिए `config.get`
- आंशिक अपडेट के लिए `config.patch` (JSON मर्ज पैच: ऑब्जेक्ट मर्ज होते हैं, `null`
  हटाता है, ऐरे तभी बदलते हैं जब `replacePaths` के साथ स्पष्ट रूप से पुष्टि की गई हो, यदि
  प्रविष्टियाँ हटाई जाएँगी)
- `config.apply` केवल तब जब आप पूरा कॉन्फ़िग बदलना चाहते हों
- स्पष्ट सेल्फ़-अपडेट और पुनरारंभ के लिए `update.run`; जब पुनरारंभ के बाद वाले सत्र को एक फ़ॉलो-अप टर्न चलाना हो, तो `continuationMessage` शामिल करें
- नवीनतम अपडेट पुनरारंभ सेंटिनल देखने और पुनरारंभ के बाद चल रहे संस्करण की पुष्टि करने के लिए `update.status`

एजेंटों को सटीक फ़ील्ड-स्तरीय दस्तावेज़ और सीमाओं के लिए `config.schema.lookup` को
पहला पड़ाव मानना चाहिए। जब उन्हें व्यापक कॉन्फ़िग मैप, डिफ़ॉल्ट, या समर्पित
सब-सिस्टम संदर्भों के लिंक चाहिए हों, तो [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
का उपयोग करें।

<Note>
कंट्रोल-प्लेन लिखाइयाँ (`config.apply`, `config.patch`, `update.run`) प्रति
`deviceId+clientIp` हर 60 सेकंड में 3 अनुरोधों तक सीमित हैं। पुनरारंभ
अनुरोध एक साथ मिल जाते हैं और फिर पुनरारंभ चक्रों के बीच 30-सेकंड का कूलडाउन लागू करते हैं।
`update.status` केवल-पढ़ने योग्य है, लेकिन एडमिन-स्कोप्ड है क्योंकि पुनरारंभ सेंटिनल
अपडेट चरण सारांश और कमांड आउटपुट के अंतिम हिस्से शामिल कर सकता है।
</Note>

आंशिक पैच का उदाहरण:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` और `config.patch` दोनों `raw`, `baseHash`, `sessionKey`,
`note`, और `restartDelayMs` स्वीकार करते हैं। जब कोई कॉन्फ़िग पहले से मौजूद हो,
तो दोनों विधियों के लिए `baseHash` आवश्यक है।

`config.patch` `replacePaths` भी स्वीकार करता है, जो उन कॉन्फ़िग पथों की ऐरे है जिनका ऐरे
प्रतिस्थापन जानबूझकर किया गया है। यदि कोई पैच मौजूदा ऐरे को कम प्रविष्टियों के साथ बदल या हटा देगा,
तो Gateway लिखाई को अस्वीकार कर देता है, जब तक कि वही सटीक पथ
`replacePaths` में न हो; ऐरे प्रविष्टियों के अंतर्गत नेस्टेड ऐरे `[]` का उपयोग करते हैं, जैसे
`agents.list[].skills`। यह कटे हुए `config.get` स्नैपशॉट को
रूटिंग या अनुमति-सूची ऐरे को चुपचाप मिटाने से रोकता है। जब आप
पूरा कॉन्फ़िग बदलना चाहते हों, तो `config.apply` का उपयोग करें।

## पर्यावरण चर

OpenClaw पैरेंट प्रक्रिया से env vars पढ़ता है, साथ ही:

- मौजूदा कार्यशील डायरेक्टरी से `.env` (यदि मौजूद हो)
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
  यदि सक्षम हो और अपेक्षित कुंजियाँ सेट न हों, तो OpenClaw आपका लॉगिन शेल चलाता है और केवल अनुपलब्ध कुंजियाँ आयात करता है:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var समकक्ष: `OPENCLAW_LOAD_SHELL_ENV=1`
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

- केवल अपरकेस नाम मेल खाते हैं: `[A-Z_][A-Z0-9_]*`
- अनुपलब्ध/खाली vars लोड समय पर त्रुटि फेंकते हैं
- शाब्दिक आउटपुट के लिए `$${VAR}` से एस्केप करें
- `$include` फ़ाइलों के अंदर काम करता है
- इनलाइन प्रतिस्थापन: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  SecretRef ऑब्जेक्ट का समर्थन करने वाले फ़ील्डों के लिए, आप उपयोग कर सकते हैं:

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

SecretRef विवरण (`env`/`file`/`exec` के लिए `secrets.providers` सहित) [सीक्रेट प्रबंधन](/hi/gateway/secrets) में हैं।
समर्थित क्रेडेंशियल पथ [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) में सूचीबद्ध हैं।
</Accordion>

पूर्ण प्राथमिकता क्रम और स्रोतों के लिए [पर्यावरण](/hi/help/environment) देखें।

## पूर्ण संदर्भ

पूर्ण फ़ील्ड-दर-फ़ील्ड संदर्भ के लिए, **[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)** देखें।

---

_संबंधित: [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) · [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) · [Doctor](/hi/gateway/doctor)_

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples)
- [Gateway रनबुक](/hi/gateway)
