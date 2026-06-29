---
read_when:
    - Slack सेट अप करना या Slack socket, HTTP, या relay mode को डीबग करना
summary: Slack सेटअप और रनटाइम व्यवहार (Socket Mode, HTTP Request URLs, और relay mode)
title: Slack
x-i18n:
    generated_at: "2026-06-28T22:39:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

DM और चैनलों के लिए Slack ऐप इंटीग्रेशन के माध्यम से प्रोडक्शन-तैयार। डिफ़ॉल्ट मोड Socket Mode है; HTTP अनुरोध URL भी समर्थित हैं। रिले मोड उन प्रबंधित डिप्लॉयमेंट के लिए है जहां Slack इनग्रेस का स्वामित्व किसी विश्वसनीय राउटर के पास होता है।

<CardGroup cols={3}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    Slack DM डिफ़ॉल्ट रूप से पेयरिंग मोड का उपयोग करते हैं।
  </Card>
  <Card title="स्लैश कमांड" icon="terminal" href="/hi/tools/slash-commands">
    नेटिव कमांड व्यवहार और कमांड कैटलॉग।
  </Card>
  <Card title="चैनल समस्या-निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल डायग्नॉस्टिक्स और मरम्मत प्लेबुक।
  </Card>
</CardGroup>

## Socket Mode या HTTP अनुरोध URL चुनना

दोनों ट्रांसपोर्ट प्रोडक्शन-तैयार हैं और मैसेजिंग, स्लैश कमांड, App Home और इंटरैक्टिविटी के लिए फीचर समानता तक पहुंचते हैं। फीचर नहीं, बल्कि डिप्लॉयमेंट आकार के आधार पर चुनें।

| चिंता                         | Socket Mode (डिफ़ॉल्ट)                                                                                                                               | HTTP अनुरोध URL                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| सार्वजनिक Gateway URL         | आवश्यक नहीं                                                                                                                                          | आवश्यक (DNS, TLS, रिवर्स प्रॉक्सी या टनल)                                                                       |
| आउटबाउंड नेटवर्क              | `wss-primary.slack.com` तक आउटबाउंड WSS पहुंच योग्य होना चाहिए                                                                                       | आउटबाउंड WS नहीं; केवल इनबाउंड HTTPS                                                                            |
| आवश्यक टोकन                  | Bot टोकन + `connections:write` वाला App-Level Token                                                                                                  | Bot टोकन + Signing Secret                                                                                       |
| डेव लैपटॉप / फ़ायरवॉल के पीछे | जैसे है वैसे काम करता है                                                                                                                             | सार्वजनिक टनल (ngrok, Cloudflare Tunnel, Tailscale Funnel) या स्टेजिंग Gateway चाहिए                           |
| क्षैतिज स्केलिंग              | प्रति ऐप प्रति होस्ट एक Socket Mode सेशन; कई Gateway को अलग-अलग Slack ऐप चाहिए                                                                       | स्टेटलेस POST हैंडलर; कई Gateway रेप्लिका एक लोड बैलेंसर के पीछे एक ऐप साझा कर सकती हैं                       |
| एक Gateway पर कई अकाउंट       | समर्थित; हर अकाउंट अपना WS खोलता है                                                                                                                   | समर्थित; हर अकाउंट को अद्वितीय `webhookPath` चाहिए (डिफ़ॉल्ट `/slack/events`) ताकि रजिस्ट्रेशन टकराएं नहीं |
| स्लैश कमांड ट्रांसपोर्ट       | WS कनेक्शन पर डिलीवर होता है; `slash_commands[].url` अनदेखा किया जाता है                                                                              | Slack `slash_commands[].url` पर POST करता है; कमांड डिस्पैच होने के लिए फ़ील्ड आवश्यक है                       |
| अनुरोध साइनिंग               | उपयोग नहीं होती (ऑथ App-Level Token है)                                                                                                              | Slack हर अनुरोध को साइन करता है; OpenClaw `signingSecret` से सत्यापित करता है                                  |
| कनेक्शन ड्रॉप पर रिकवरी       | Slack SDK ऑटो-रीकनेक्ट सक्षम है; OpenClaw विफल Socket Mode सेशन को सीमित बैकऑफ़ के साथ फिर शुरू भी करता है। Pong-timeout ट्रांसपोर्ट ट्यूनिंग लागू होती है। | ड्रॉप होने वाला कोई स्थायी कनेक्शन नहीं; Slack से प्रति-अनुरोध रिट्राई होते हैं                               |

<Note>
  **Socket Mode चुनें** सिंगल-Gateway होस्ट, डेव लैपटॉप और ऑन-प्रेम नेटवर्क के लिए, जो `*.slack.com` तक आउटबाउंड पहुंच सकते हैं लेकिन इनबाउंड HTTPS स्वीकार नहीं कर सकते।

**HTTP अनुरोध URL चुनें** जब कई Gateway रेप्लिका लोड बैलेंसर के पीछे चल रहे हों, जब आउटबाउंड WSS ब्लॉक हो लेकिन इनबाउंड HTTPS अनुमत हो, या जब आप पहले से ही Slack Webhook को रिवर्स प्रॉक्सी पर टर्मिनेट करते हों।
</Note>

### रिले मोड

रिले मोड Slack इनग्रेस को OpenClaw Gateway से अलग करता है। एक विश्वसनीय राउटर एकल Slack Socket Mode कनेक्शन का स्वामी होता है, गंतव्य Gateway चुनता है, और प्रमाणित WebSocket पर टाइप किया हुआ इवेंट अग्रेषित करता है। Gateway आउटबाउंड Slack Web API कॉल के लिए अपने bot टोकन का उपयोग जारी रखता है।

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

रिले URL को `wss://` का उपयोग करना चाहिए, जब तक कि वह localhost को लक्ष्य न करे। बेयरर टोकन और राउटर रूट टेबल को Slack प्राधिकरण सीमा का हिस्सा मानें: रूट किए गए इवेंट सामान्य Slack संदेश हैंडलर में अधिकृत सक्रियण के रूप में प्रवेश करते हैं। WebSocket `hello` फ़्रेम में राउटर-प्रदान किया गया `slack_identity` डिफ़ॉल्ट आउटबाउंड उपयोगकर्ता नाम और आइकन सेट कर सकता है; कॉलर द्वारा दी गई स्पष्ट पहचान फिर भी प्राथमिक रहती है। रिले कनेक्शन Socket Mode द्वारा उपयोग किए जाने वाले उसी सीमित बैकऑफ़ टाइमिंग के साथ फिर से कनेक्ट होता है और डिस्कनेक्ट होने पर राउटर-प्रदान की गई पहचान साफ़ कर देता है।

## इंस्टॉल करें

चैनल कॉन्फ़िगर करने से पहले Slack इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` Plugin को रजिस्टर और सक्षम करता है। Plugin तब तक कुछ नहीं करता जब तक आप नीचे दिए गए Slack ऐप और चैनल सेटिंग कॉन्फ़िगर नहीं करते। सामान्य Plugin व्यवहार और इंस्टॉल नियमों के लिए [Plugins](/hi/tools/plugin) देखें।

## त्वरित सेटअप

<Tabs>
  <Tab title="Socket Mode (डिफ़ॉल्ट)">
    <Steps>
      <Step title="नया Slack ऐप बनाएं">
        [api.slack.com/apps](https://api.slack.com/apps/new) खोलें → **Create New App** → **From a manifest** → अपना वर्कस्पेस चुनें → नीचे दिए गए मैनिफ़ेस्ट में से एक पेस्ट करें → **Next** → **Create**।

        <CodeGroup>

```json अनुशंसित
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

```json न्यूनतम
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **अनुशंसित** Slack Plugin के पूर्ण फीचर सेट से मेल खाता है: App Home, स्लैश कमांड, फ़ाइलें, प्रतिक्रियाएं, पिन, समूह DM और emoji/usergroup रीड। जब वर्कस्पेस नीति स्कोप प्रतिबंधित करती है तब **न्यूनतम** चुनें — यह DM, चैनल/समूह इतिहास, मेंशन और स्लैश कमांड कवर करता है, लेकिन फ़ाइलें, प्रतिक्रियाएं, पिन, समूह-DM (`mpim:*`), `emoji:read` और `usergroups:read` छोड़ देता है। प्रति-स्कोप कारण और अतिरिक्त स्लैश कमांड जैसे एडिटिव विकल्पों के लिए [मैनिफ़ेस्ट और स्कोप चेकलिस्ट](#manifest-and-scope-checklist) देखें।
        </Note>

        Slack द्वारा ऐप बनाने के बाद:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write` जोड़ें, सेव करें, App-Level Token कॉपी करें।
        - **Install App -> Install to Workspace**: Bot User OAuth Token कॉपी करें।

      </Step>

      <Step title="OpenClaw कॉन्फ़िगर करें">

        अनुशंसित SecretRef सेटअप:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Env फ़ॉलबैक (केवल डिफ़ॉल्ट अकाउंट):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Gateway शुरू करें">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="एक नया Slack ऐप बनाएं">
        [api.slack.com/apps](https://api.slack.com/apps/new) खोलें → **नया ऐप बनाएं** → **मैनिफ़ेस्ट से** → अपना वर्कस्पेस चुनें → नीचे दिए गए मैनिफ़ेस्ट में से एक पेस्ट करें → `https://gateway-host.example.com/slack/events` को अपने सार्वजनिक Gateway URL से बदलें → **अगला** → **बनाएं**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          **अनुशंसित** Slack plugin के पूरे फीचर सेट से मेल खाता है; **न्यूनतम** प्रतिबंधात्मक वर्कस्पेस के लिए फ़ाइलें, रिएक्शन, पिन, ग्रुप-DM (`mpim:*`), `emoji:read`, और `usergroups:read` हटा देता है। प्रति-स्कोप कारण के लिए [मैनिफ़ेस्ट और स्कोप चेकलिस्ट](#manifest-and-scope-checklist) देखें।
        </Note>

        <Info>
          तीनों URL फ़ील्ड (`slash_commands[].url`, `event_subscriptions.request_url`, और `interactivity.request_url` / `message_menu_options_url`) एक ही OpenClaw endpoint की ओर इंगित करते हैं। Slack के मैनिफ़ेस्ट स्कीमा में इन्हें अलग-अलग नाम देना आवश्यक है, लेकिन OpenClaw पेलोड प्रकार के आधार पर रूट करता है, इसलिए एक ही `webhookPath` (डिफ़ॉल्ट `/slack/events`) पर्याप्त है। HTTP मोड में `slash_commands[].url` के बिना Slash commands चुपचाप कोई कार्रवाई नहीं करेंगे।
        </Info>

        Slack द्वारा ऐप बनाए जाने के बाद:

        - **बुनियादी जानकारी → ऐप क्रेडेंशियल्स**: अनुरोध सत्यापन के लिए **Signing Secret** कॉपी करें।
        - **ऐप इंस्टॉल करें -> वर्कस्पेस में इंस्टॉल करें**: Bot User OAuth Token कॉपी करें।

      </Step>

      <Step title="OpenClaw कॉन्फ़िगर करें">

        अनुशंसित SecretRef सेटअप:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        बहु-अकाउंट HTTP के लिए अद्वितीय Webhook पाथ का उपयोग करें

        प्रत्येक अकाउंट को अलग `webhookPath` (डिफ़ॉल्ट `/slack/events`) दें ताकि रजिस्ट्रेशन आपस में न टकराएं।
        </Note>

      </Step>

      <Step title="Gateway शुरू करें">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode ट्रांसपोर्ट ट्यूनिंग

OpenClaw Socket Mode के लिए Slack SDK क्लाइंट pong timeout को डिफ़ॉल्ट रूप से 15 सेकंड पर सेट करता है। ट्रांसपोर्ट सेटिंग्स को केवल तब ओवरराइड करें जब आपको वर्कस्पेस- या होस्ट-विशिष्ट ट्यूनिंग की आवश्यकता हो:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

इसे केवल उन Socket Mode वर्कस्पेस के लिए उपयोग करें जो Slack websocket pong/server-ping timeout लॉग करते हैं या ऐसे होस्ट पर चलते हैं जिनमें ज्ञात event-loop starvation है। `clientPingTimeout` SDK द्वारा client ping भेजे जाने के बाद pong प्रतीक्षा है; `serverPingTimeout` Slack server ping की प्रतीक्षा है। ऐप संदेश और events application state बने रहते हैं, transport liveness signals नहीं।

नोट्स:

- HTTP Request URL मोड में `socketMode` अनदेखा किया जाता है।
- मूल `channels.slack.socketMode` सेटिंग्स सभी Slack अकाउंट पर लागू होती हैं, जब तक कि उन्हें ओवरराइड न किया गया हो। प्रति-अकाउंट ओवरराइड `channels.slack.accounts.<accountId>.socketMode` का उपयोग करते हैं; क्योंकि यह एक object override है, उस अकाउंट के लिए हर वह socket tuning फ़ील्ड शामिल करें जिसे आप चाहते हैं।
- केवल `clientPingTimeout` का OpenClaw डिफ़ॉल्ट (`15000`) है। `serverPingTimeout` और `pingPongLoggingEnabled` केवल कॉन्फ़िगर होने पर Slack SDK को पास किए जाते हैं।
- Socket Mode restart backoff लगभग 2 सेकंड से शुरू होता है और लगभग 30 सेकंड पर कैप होता है। Recoverable start, start-wait, और disconnect failures चैनल रुकने तक retry करते हैं। invalid auth, revoked tokens, या missing scopes जैसी स्थायी account और credential errors हमेशा retry करने के बजाय तुरंत fail होती हैं।

## मैनिफ़ेस्ट और स्कोप चेकलिस्ट

मूल Slack app manifest Socket Mode और HTTP Request URLs दोनों के लिए समान है। केवल `settings` ब्लॉक (और slash command `url`) अलग होता है।

मूल मैनिफ़ेस्ट (Socket Mode डिफ़ॉल्ट):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

**HTTP Request URLs मोड** के लिए, `settings` को HTTP वेरिएंट से बदलें और प्रत्येक slash command में `url` जोड़ें। सार्वजनिक URL आवश्यक है:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### अतिरिक्त मैनिफ़ेस्ट सेटिंग्स

ऊपर दिए गए डिफ़ॉल्ट को विस्तारित करने वाली अलग-अलग सुविधाएं सतह पर लाएं।

डिफॉल्ट मैनिफेस्ट Slack App Home **Home** टैब सक्षम करता है और `app_home_opened` को सब्सक्राइब करता है। जब कोई वर्कस्पेस सदस्य Home टैब खोलता है, तो OpenClaw `views.publish` के साथ एक सुरक्षित डिफॉल्ट Home दृश्य प्रकाशित करता है; कोई बातचीत पेलोड या निजी कॉन्फ़िगरेशन शामिल नहीं होता। Slack DMs के लिए **Messages** टैब सक्षम रहता है। मैनिफेस्ट `features.assistant_view`, `assistant:write`, `assistant_thread_started`, और `assistant_thread_context_changed` के साथ Slack असिस्टेंट थ्रेड भी सक्षम करता है; असिस्टेंट थ्रेड अपने OpenClaw थ्रेड सेशन में रूट होते हैं और Slack द्वारा दिया गया थ्रेड संदर्भ एजेंट के लिए उपलब्ध रखते हैं।

<AccordionGroup>
  <Accordion title="वैकल्पिक नेटिव slash commands">

    थोड़े अंतर के साथ, एकल कॉन्फ़िगर किए गए कमांड के बजाय कई [नेटिव slash commands](#commands-and-slash-behavior) उपयोग किए जा सकते हैं:

    - `/status` के बजाय `/agentstatus` उपयोग करें क्योंकि `/status` कमांड आरक्षित है।
    - एक साथ 25 से अधिक slash commands उपलब्ध नहीं कराए जा सकते।

    अपने मौजूदा `features.slash_commands` सेक्शन को [उपलब्ध कमांड](/hi/tools/slash-commands#command-list) के किसी उपसमुच्चय से बदलें:

    <Tabs>
      <Tab title="Socket Mode (डिफॉल्ट)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reset the current session"
    },
    {
      "command": "/compact",
      "description": "Compact the session context",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Stop the current run"
    },
    {
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP अनुरोध URLs">
        ऊपर दिए गए Socket Mode जैसी ही `slash_commands` सूची उपयोग करें, और हर एंट्री में `"url": "https://gateway-host.example.com/slack/events"` जोड़ें। उदाहरण:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        सूची के हर कमांड पर वही `url` मान दोहराएँ।

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="वैकल्पिक लेखकत्व स्कोप (लिखने के ऑपरेशन)">
    यदि आप चाहते हैं कि बाहर जाने वाले संदेश डिफॉल्ट Slack ऐप पहचान के बजाय सक्रिय एजेंट पहचान (कस्टम उपयोगकर्ता नाम और आइकन) का उपयोग करें, तो `chat:write.customize` bot scope जोड़ें।

    यदि आप emoji आइकन उपयोग करते हैं, तो Slack `:emoji_name:` सिंटैक्स अपेक्षित करता है।

  </Accordion>
  <Accordion title="वैकल्पिक उपयोगकर्ता-टोकन स्कोप (पढ़ने के ऑपरेशन)">
    यदि आप `channels.slack.userToken` कॉन्फ़िगर करते हैं, तो सामान्य पढ़ने वाले स्कोप हैं:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (यदि आप Slack खोज रीड्स पर निर्भर हैं)

  </Accordion>
</AccordionGroup>

## टोकन मॉडल

- Socket Mode के लिए `botToken` + `appToken` आवश्यक हैं।
- HTTP मोड के लिए `botToken` + `signingSecret` आवश्यक है।
- Relay मोड के लिए `botToken` के साथ `relay.url`, `relay.authToken`, और `relay.gatewayId` आवश्यक हैं; यह ऐप टोकन या साइनिंग सीक्रेट उपयोग नहीं करता।
- `botToken`, `appToken`, `signingSecret`, `relay.authToken`, और `userToken` प्लेनटेक्स्ट
  स्ट्रिंग या SecretRef ऑब्जेक्ट स्वीकार करते हैं।
- कॉन्फ़िग टोकन env फॉलबैक को ओवरराइड करते हैं।
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env फॉलबैक केवल डिफॉल्ट अकाउंट पर लागू होता है।
- `userToken` केवल-कॉन्फ़िग है (कोई env फॉलबैक नहीं) और डिफॉल्ट रूप से केवल-पढ़ने के व्यवहार (`userTokenReadOnly: true`) पर रहता है।

स्टेटस स्नैपशॉट व्यवहार:

- Slack अकाउंट निरीक्षण प्रति-क्रेडेंशियल `*Source` और `*Status`
  फ़ील्ड (`botToken`, `appToken`, `signingSecret`, `userToken`) ट्रैक करता है।
- स्टेटस `available`, `configured_unavailable`, या `missing` होता है।
- `configured_unavailable` का अर्थ है कि अकाउंट SecretRef
  या किसी अन्य नॉन-इनलाइन सीक्रेट स्रोत के माध्यम से कॉन्फ़िगर है, लेकिन मौजूदा कमांड/रनटाइम पथ
  वास्तविक मान हल नहीं कर सका।
- HTTP मोड में, `signingSecretStatus` शामिल होता है; Socket Mode में,
  आवश्यक जोड़ी `botTokenStatus` + `appTokenStatus` है।

<Tip>
एक्शन्स/डायरेक्टरी रीड्स के लिए, कॉन्फ़िगर होने पर user token को प्राथमिकता दी जा सकती है। राइट्स के लिए, bot token प्राथमिक रहता है; user-token राइट्स केवल तब अनुमत हैं जब `userTokenReadOnly: false` हो और bot token उपलब्ध न हो।
</Tip>

## एक्शन्स और गेट्स

Slack एक्शन्स `channels.slack.actions.*` द्वारा नियंत्रित होते हैं।

मौजूदा Slack टूलिंग में उपलब्ध एक्शन समूह:

| समूह      | डिफॉल्ट |
| ---------- | ------- |
| messages   | सक्षम |
| reactions  | सक्षम |
| pins       | सक्षम |
| memberInfo | सक्षम |
| emojiList  | सक्षम |

मौजूदा Slack संदेश एक्शन्स में `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, और `emoji-list` शामिल हैं। `download-file` इनबाउंड फ़ाइल प्लेसहोल्डर्स में दिखाए गए Slack फ़ाइल IDs स्वीकार करता है और इमेज के लिए इमेज प्रीव्यू या अन्य फ़ाइल प्रकारों के लिए स्थानीय फ़ाइल मेटाडेटा लौटाता है।

## एक्सेस नियंत्रण और रूटिंग

  <Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` DM पहुंच नियंत्रित करता है। `channels.slack.allowFrom` कैननिकल DM अनुमति सूची है।

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    DM फ़्लैग:

    - `dm.enabled` (डिफ़ॉल्ट true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (लीगेसी)
    - `dm.groupEnabled` (ग्रुप DM डिफ़ॉल्ट false)
    - `dm.groupChannels` (वैकल्पिक MPIM अनुमति सूची)

    बहु-खाता प्राथमिकता:

    - `channels.slack.accounts.default.allowFrom` केवल `default` खाते पर लागू होता है।
    - नामित खाते अपनी `allowFrom` सेट न होने पर `channels.slack.allowFrom` इनहेरिट करते हैं।
    - नामित खाते `channels.slack.accounts.default.allowFrom` इनहेरिट नहीं करते।

    लीगेसी `channels.slack.dm.policy` और `channels.slack.dm.allowFrom` अभी भी संगतता के लिए पढ़े जाते हैं। `openclaw doctor --fix` जब पहुंच बदले बिना ऐसा कर सकता है, तो उन्हें `dmPolicy` और `allowFrom` में माइग्रेट करता है।

    DM में पेयरिंग `openclaw pairing approve slack <code>` का उपयोग करती है।

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` चैनल हैंडलिंग नियंत्रित करता है:

    - `open`
    - `allowlist`
    - `disabled`

    चैनल अनुमति सूची `channels.slack.channels` के अंतर्गत रहती है और कॉन्फ़िग कुंजियों के रूप में **स्थिर Slack चैनल ID** (उदाहरण के लिए `C12345678`) का उपयोग करना **आवश्यक है**।

    रनटाइम नोट: यदि `channels.slack` पूरी तरह गायब है (केवल-env सेटअप), तो रनटाइम `groupPolicy="allowlist"` पर वापस जाता है और चेतावनी लॉग करता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

    नाम/ID समाधान:

    - चैनल अनुमति सूची प्रविष्टियां और DM अनुमति सूची प्रविष्टियां स्टार्टअप पर तब हल की जाती हैं जब टोकन पहुंच अनुमति देती है
    - अनसुलझी चैनल-नाम प्रविष्टियां कॉन्फ़िग के अनुसार रखी जाती हैं, लेकिन डिफ़ॉल्ट रूप से रूटिंग के लिए अनदेखी की जाती हैं
    - इनबाउंड प्राधिकरण और चैनल रूटिंग डिफ़ॉल्ट रूप से ID-प्रथम हैं; सीधे यूज़रनेम/स्लग मिलान के लिए `channels.slack.dangerouslyAllowNameMatching: true` आवश्यक है

    <Warning>
    नाम-आधारित कुंजियां (`#channel-name` या `channel-name`) `groupPolicy: "allowlist"` के अंतर्गत मेल नहीं खातीं। चैनल लुकअप डिफ़ॉल्ट रूप से ID-प्रथम है, इसलिए नाम-आधारित कुंजी कभी सफलतापूर्वक रूट नहीं होगी और उस चैनल के सभी संदेश चुपचाप ब्लॉक हो जाएंगे। यह `groupPolicy: "open"` से अलग है, जहां रूटिंग के लिए चैनल कुंजी आवश्यक नहीं होती और नाम-आधारित कुंजी काम करती हुई दिखती है।

    हमेशा Slack चैनल ID को कुंजी के रूप में उपयोग करें। इसे खोजने के लिए: Slack में चैनल पर राइट-क्लिक करें → **Copy link** — ID (`C...`) URL के अंत में दिखाई देती है।

    सही:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    गलत (`groupPolicy: "allowlist"` के अंतर्गत चुपचाप ब्लॉक):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    चैनल संदेश डिफ़ॉल्ट रूप से मेंशन द्वारा नियंत्रित होते हैं।

    मेंशन स्रोत:

    - स्पष्ट ऐप मेंशन (`<@botId>`)
    - Slack उपयोगकर्ता-ग्रुप मेंशन (`<!subteam^S...>`) जब बॉट उपयोगकर्ता उस उपयोगकर्ता ग्रुप का सदस्य हो; `usergroups:read` आवश्यक है
    - मेंशन regex पैटर्न (`agents.list[].groupChat.mentionPatterns`, फ़ॉलबैक `messages.groupChat.mentionPatterns`)
    - अंतर्निहित reply-to-bot थ्रेड व्यवहार (`thread.requireExplicitMention` के `true` होने पर अक्षम)

    प्रति-चैनल नियंत्रण (`channels.slack.channels.<id>`; नाम केवल स्टार्टअप समाधान या `dangerouslyAllowNameMatching` के माध्यम से):

    - `requireMention`
    - `users` (अनुमति सूची)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` कुंजी प्रारूप: `channel:`, `id:`, `e164:`, `username:`, `name:`, या `"*"` वाइल्डकार्ड
      (लीगेसी बिना-प्रिफ़िक्स कुंजियां अभी भी केवल `id:` पर मैप होती हैं)

    `allowBots` चैनलों और निजी चैनलों के लिए सावधानीपूर्ण है: bot द्वारा लिखे गए रूम संदेश केवल तब स्वीकार किए जाते हैं जब भेजने वाला bot उस रूम की `users` allowlist में स्पष्ट रूप से सूचीबद्ध हो, या जब `channels.slack.allowFrom` से कम से कम एक स्पष्ट Slack owner ID वर्तमान में रूम सदस्य हो। वाइल्डकार्ड और display-name owner प्रविष्टियां owner की उपस्थिति को पूरा नहीं करतीं। owner उपस्थिति Slack `conversations.members` का उपयोग करती है; सुनिश्चित करें कि ऐप के पास रूम प्रकार के लिए मेल खाता read scope हो (`channels:read` सार्वजनिक चैनलों के लिए, `groups:read` निजी चैनलों के लिए)। यदि member lookup विफल होता है, तो OpenClaw bot द्वारा लिखे गए रूम संदेश को छोड़ देता है।

    स्वीकार किए गए bot द्वारा लिखे गए Slack संदेश साझा [bot loop protection](/hi/channels/bot-loop-protection) का उपयोग करते हैं। डिफ़ॉल्ट budget के लिए `channels.defaults.botLoopProtection` कॉन्फ़िगर करें, फिर जब किसी workspace या channel को अलग सीमा चाहिए, तो `channels.slack.botLoopProtection` या `channels.slack.channels.<id>.botLoopProtection` से override करें।

  </Tab>
</Tabs>

## Threading, sessions, और reply tags

- DMs `direct` के रूप में route होते हैं; channels `channel` के रूप में; MPIMs `group` के रूप में।
- Slack route bindings raw peer IDs और Slack target forms जैसे `channel:C12345678`, `user:U12345678`, और `<@U12345678>` स्वीकार करते हैं।
- डिफ़ॉल्ट `session.dmScope=main` के साथ, Slack DMs agent main session में collapse हो जाते हैं।
- Channel sessions: `agent:<agentId>:slack:channel:<channelId>`।
- सामान्य top-level channel messages per-channel session पर रहते हैं, भले ही `replyToMode` non-`off` हो।
- Slack thread replies session suffixes के लिए parent Slack `thread_ts` का उपयोग करते हैं (`:thread:<threadTs>`), भले ही outbound reply threading `replyToMode="off"` से disabled हो।
- OpenClaw किसी eligible top-level channel root को `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` में seed करता है जब उस root से visible Slack thread शुरू होने की अपेक्षा हो, ताकि root और बाद के thread replies एक OpenClaw session साझा करें। यह `app_mention` events, स्पष्ट bot या configured mention-pattern matches, और non-`off` `replyToMode` वाले `requireMention: false` channels पर लागू होता है।
- `channels.slack.thread.historyScope` डिफ़ॉल्ट `thread` है; `thread.inheritParent` डिफ़ॉल्ट `false` है।
- `channels.slack.thread.initialHistoryLimit` नियंत्रित करता है कि नया thread session शुरू होने पर कितने मौजूदा thread messages fetch किए जाते हैं (डिफ़ॉल्ट `20`; disable करने के लिए `0` सेट करें)।
- `channels.slack.thread.requireExplicitMention` (डिफ़ॉल्ट `false`): जब `true` हो, implicit thread mentions दबाता है ताकि bot केवल threads के अंदर स्पष्ट `@bot` mentions पर respond करे, भले ही bot पहले से thread में सहभागी रहा हो। इसके बिना, bot-participated thread में replies `requireMention` gating को bypass करती हैं।

Reply threading controls:

- `channels.slack.replyToMode`: `off|first|all|batched` (डिफ़ॉल्ट `off`)
- `channels.slack.replyToModeByChatType`: प्रति `direct|group|channel`
- direct chats के लिए legacy fallback: `channels.slack.dm.replyToMode`

Manual reply tags समर्थित हैं:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` tool से स्पष्ट Slack thread replies के लिए, `action: "send"` और `threadId` या `replyTo` के साथ `replyBroadcast: true` सेट करें ताकि Slack से thread reply को parent channel पर भी broadcast करने को कहा जा सके। यह Slack के `chat.postMessage` `reply_broadcast` flag से map होता है और केवल text या Block Kit sends के लिए समर्थित है, media uploads के लिए नहीं।

जब कोई `message` tool call Slack thread के अंदर चलती है और उसी channel को target करती है, OpenClaw सामान्यतः `replyToMode` के अनुसार वर्तमान Slack thread inherit करता है। इसके बजाय नया parent-channel message force करने के लिए `action: "send"` या `action: "upload-file"` पर `topLevel: true` सेट करें। `threadId: null` भी उसी top-level opt-out के रूप में स्वीकार किया जाता है।

<Note>
`replyToMode="off"` outbound Slack reply threading को disable करता है, जिसमें स्पष्ट `[[reply_to_*]]` tags भी शामिल हैं। यह inbound Slack thread sessions को flatten नहीं करता: Slack thread के अंदर पहले से post किए गए messages अभी भी `:thread:<threadTs>` session पर route होते हैं। यह Telegram से अलग है, जहां explicit tags अभी भी `"off"` mode में honor किए जाते हैं। Slack threads messages को channel से छिपाते हैं, जबकि Telegram replies inline visible रहते हैं।
</Note>

## Ack reactions

`ackReaction` एक acknowledgement emoji भेजता है जब OpenClaw inbound message process कर रहा होता है। `ackReactionScope` तय करता है कि वह emoji वास्तव में _कब_ भेजा जाए।

### Emoji (`ackReaction`)

Resolution order:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- agent identity emoji fallback (`agents.list[].identity.emoji`, अन्यथा `"eyes"` / 👀)

Notes:

- Slack shortcodes अपेक्षित करता है (उदाहरण के लिए `"eyes"`)।
- Slack account या globally reaction disable करने के लिए `""` का उपयोग करें।

### Scope (`messages.ackReactionScope`)

Slack provider scope को `messages.ackReactionScope` से पढ़ता है (डिफ़ॉल्ट `"group-mentions"`)। आज Slack-account या Slack-channel-level override नहीं है; value gateway के लिए global है।

Values:

- `"all"`: DMs और groups में react करें।
- `"direct"`: केवल DMs में react करें।
- `"group-all"`: हर group message पर react करें (DMs नहीं)।
- `"group-mentions"` (डिफ़ॉल्ट): groups में react करें, लेकिन केवल जब bot mentioned हो (या group mentionables में जिन्होंने opt in किया हो)। **DMs excluded हैं।**
- `"off"` / `"none"`: कभी react न करें।

<Note>
डिफ़ॉल्ट scope (`"group-mentions"`) direct messages में ack reactions fire नहीं करता। inbound Slack DMs पर configured `ackReaction` (उदाहरण के लिए `"eyes"`) देखने के लिए, `messages.ackReactionScope` को `"direct"` या `"all"` पर सेट करें। `messages.ackReactionScope` Slack provider startup पर पढ़ा जाता है, इसलिए change प्रभावी होने के लिए gateway restart आवश्यक है।
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Text streaming

`channels.slack.streaming` live preview behavior नियंत्रित करता है:

- `off`: live preview streaming disable करें।
- `partial` (डिफ़ॉल्ट): preview text को latest partial output से replace करें।
- `block`: chunked preview updates append करें।
- `progress`: generate करते समय progress status text दिखाएं, फिर final text भेजें।
- `streaming.preview.toolProgress`: जब draft preview active हो, tool/progress updates को उसी edited preview message में route करें (डिफ़ॉल्ट: `true`)। अलग tool/progress messages रखने के लिए `false` सेट करें।
- `streaming.preview.commandText` / `streaming.progress.commandText`: raw command/exec text छिपाते हुए compact tool-progress lines रखने के लिए `status` पर सेट करें (डिफ़ॉल्ट: `raw`)।

compact progress lines रखते हुए raw command/exec text छिपाएं:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

जब `channels.slack.streaming.mode` `partial` हो, `channels.slack.streaming.nativeTransport` Slack native text streaming नियंत्रित करता है (डिफ़ॉल्ट: `true`)।

Slack native progress task cards progress mode के लिए opt-in हैं। काम चलने के दौरान Slack-native plan/task card भेजने और completion पर उसी task card को update करने के लिए `channels.slack.streaming.mode="progress"` के साथ `channels.slack.streaming.progress.nativeTaskCards` को `true` पर सेट करें। इस flag के बिना, progress mode portable draft-preview behavior रखता है।

- native text streaming और Slack assistant thread status दिखने के लिए reply thread उपलब्ध होना चाहिए। Thread selection फिर भी `replyToMode` का पालन करता है।
- Channel, group-chat, और top-level DM roots तब भी normal draft preview का उपयोग कर सकते हैं जब native streaming unavailable हो या कोई reply thread मौजूद न हो।
- Top-level Slack DMs डिफ़ॉल्ट रूप से off-thread रहते हैं, इसलिए वे Slack का thread-style native stream/status preview नहीं दिखाते; OpenClaw इसके बजाय DM में draft preview post और edit करता है।
- Media और non-text payloads normal delivery पर fallback करते हैं।
- Media/error finals pending preview edits cancel करते हैं; eligible text/block finals केवल तब flush होते हैं जब वे preview को in place edit कर सकें।
- यदि streaming mid-reply fail होती है, तो OpenClaw remaining payloads के लिए normal delivery पर fallback करता है।

Slack native text streaming के बजाय draft preview उपयोग करें:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Slack native progress task cards में opt in करें:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Legacy keys:

- `channels.slack.streamMode` (`replace | status_final | append`) `channels.slack.streaming.mode` के लिए legacy runtime alias है।
- boolean `channels.slack.streaming` `channels.slack.streaming.mode` और `channels.slack.streaming.nativeTransport` के लिए legacy runtime alias है।
- legacy `channels.slack.nativeStreaming` `channels.slack.streaming.nativeTransport` के लिए runtime alias है।
- persisted Slack streaming config को canonical keys में rewrite करने के लिए `openclaw doctor --fix` चलाएं।

## Typing reaction fallback

`typingReaction` inbound Slack message में temporary reaction जोड़ता है जब OpenClaw reply process कर रहा होता है, फिर run finish होने पर इसे remove करता है। यह thread replies के बाहर सबसे उपयोगी है, जो डिफ़ॉल्ट "is typing..." status indicator का उपयोग करते हैं।

Resolution order:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notes:

- Slack shortcodes अपेक्षित करता है (उदाहरण के लिए `"hourglass_flowing_sand"`)।
- Reaction best-effort है और reply या failure path complete होने के बाद cleanup automatically attempt किया जाता है।

## Media, chunking, और delivery

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack file attachments Slack-hosted private URLs (token-authenticated request flow) से download किए जाते हैं और fetch सफल होने तथा size limits अनुमति देने पर media store में लिखे जाते हैं। File placeholders में Slack `fileId` शामिल होता है ताकि agents original file को `download-file` से fetch कर सकें।

    Downloads bounded idle और total timeouts का उपयोग करते हैं। यदि Slack file retrieval stall या fail होती है, OpenClaw message process करता रहता है और file placeholder पर fallback करता है।

    Runtime inbound size cap डिफ़ॉल्ट रूप से `20MB` है जब तक `channels.slack.mediaMaxMb` से override न किया जाए।

  </Accordion>

  <Accordion title="Outbound text and files">
    - text chunks `channels.slack.textChunkLimit` का उपयोग करते हैं (डिफ़ॉल्ट 4000)
    - `channels.slack.chunkMode="newline"` paragraph-first splitting enable करता है
    - file sends Slack upload APIs का उपयोग करते हैं और thread replies (`thread_ts`) शामिल कर सकते हैं
    - outbound media cap configured होने पर `channels.slack.mediaMaxMb` का पालन करता है; अन्यथा channel sends media pipeline से MIME-kind defaults का उपयोग करते हैं

  </Accordion>

  <Accordion title="Delivery targets">
    Preferred explicit targets:

    - DMs के लिए `user:<id>`
    - channels के लिए `channel:<id>`

    Text/block-only Slack DMs सीधे user IDs पर post कर सकते हैं; file uploads और threaded sends पहले Slack conversation APIs के माध्यम से DM खोलते हैं क्योंकि उन paths को concrete conversation ID चाहिए।

  </Accordion>
</AccordionGroup>

## Commands और slash behavior

Slash commands Slack में या तो single configured command या multiple native commands के रूप में दिखाई देते हैं। command defaults बदलने के लिए `channels.slack.slashCommand` configure करें:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native commands को आपके Slack app में [additional manifest settings](#additional-manifest-settings) चाहिए और इसके बजाय global configurations में `channels.slack.commands.native: true` या `commands.native: true` से enable होते हैं।

- Slack के लिए native command auto-mode **off** है, इसलिए `commands.native: "auto"` Slack native commands enable नहीं करता।

```txt
/help
```

Native argument menus adaptive rendering strategy का उपयोग करते हैं, जो selected option value dispatch करने से पहले confirmation modal दिखाती है:

- 5 options तक: button blocks
- 6-100 options: static select menu
- 100 से अधिक options: जब interactivity options handlers available हों तो async option filtering के साथ external select
- Slack limits exceeded: encoded option values buttons पर fallback करते हैं

```txt
/think
```

Slash sessions `agent:<agentId>:slack:slash:<userId>` जैसी पृथक कुंजियों का उपयोग करते हैं और फिर भी `CommandTargetSessionKey` का उपयोग करके कमांड निष्पादन को लक्षित वार्तालाप सत्र तक रूट करते हैं।

## इंटरैक्टिव उत्तर

Slack एजेंट-लेखित इंटरैक्टिव उत्तर नियंत्रण रेंडर कर सकता है, लेकिन यह सुविधा डिफ़ॉल्ट रूप से अक्षम होती है।
नए एजेंट, CLI, और Plugin आउटपुट के लिए, साझा
`presentation` बटन या select blocks को प्राथमिकता दें। वे वही Slack interaction
पथ उपयोग करते हैं, साथ ही अन्य चैनलों पर भी graceful degradation देते हैं।

इसे वैश्विक रूप से सक्षम करें:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

या इसे केवल एक Slack खाते के लिए सक्षम करें:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

सक्षम होने पर, एजेंट अब भी deprecated Slack-only reply directives emit कर सकते हैं:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

ये directives Slack Block Kit में compile होते हैं और clicks या selections को
मौजूदा Slack interaction event path के माध्यम से वापस route करते हैं। इन्हें पुराने
prompts और Slack-specific escape hatches के लिए रखें; नए
portable controls के लिए shared presentation का उपयोग करें।

directive compiler APIs भी नए producer code के लिए deprecated हैं:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

नए Slack-rendered controls के लिए `presentation` payloads और `buildSlackPresentationBlocks(...)` का उपयोग करें।

टिप्पणियाँ:

- यह Slack-specific legacy UI है। अन्य चैनल Slack Block
  Kit directives को अपने button systems में translate नहीं करते।
- interactive callback values OpenClaw-generated opaque tokens हैं, raw agent-authored values नहीं।
- यदि generated interactive blocks Slack Block Kit limits से अधिक हो जाएंगे, तो OpenClaw invalid blocks payload भेजने के बजाय original text reply पर वापस आ जाता है।

### Plugin-स्वामित्व वाले modal submissions

interactive handler register करने वाले Slack plugins, OpenClaw द्वारा
payload को agent-visible system event के लिए compact करने से पहले modal
`view_submission` और `view_closed` lifecycle events भी प्राप्त कर सकते हैं। Slack modal खोलते समय इन routing
patterns में से एक का उपयोग करें:

- `callback_id` को `openclaw:<namespace>:<payload>` पर set करें।
- या मौजूदा `callback_id` रखें और modal `private_metadata` में `pluginInteractiveData:
"<namespace>:<payload>"` डालें।

handler को `ctx.interaction.kind` `view_submission` या
`view_closed` के रूप में, normalized `inputs`, और Slack से पूरा raw `stateValues` object मिलता है।
Callback-id-only routing Plugin handler को invoke करने के लिए पर्याप्त है; जब
modal को agent-visible system event भी produce करना हो, तो मौजूदा modal `private_metadata` user/session routing fields शामिल करें। एजेंट को
compact, redacted `Slack interaction: ...` system event मिलता है। यदि handler
`systemEvent.summary`, `systemEvent.reference`, या `systemEvent.data` लौटाता है, तो वे
fields उस compact event में शामिल होते हैं ताकि एजेंट complete form payload देखे बिना
Plugin-owned storage का reference कर सके।

## Slack में native approvals

Slack Web UI या terminal पर fallback करने के बजाय interactive buttons और interactions के साथ native approval client के रूप में काम कर सकता है।

- Exec और Plugin approvals Slack-native Block Kit prompts के रूप में render हो सकते हैं।
- `channels.slack.execApprovals.*` native exec approval client enablement और DM/channel routing config बना रहता है।
- Exec approval DMs `channels.slack.execApprovals.approvers` या `commands.ownerAllowFrom` का उपयोग करते हैं।
- Plugin approvals Slack-native buttons का उपयोग करते हैं जब originating session के लिए Slack native approval client के रूप में सक्षम हो, या जब `approvals.plugin` originating Slack session या Slack target पर route करता हो।
- Plugin approval DMs `channels.slack.allowFrom`, named-account `allowFrom`, या account default route से Slack Plugin approvers का उपयोग करते हैं।
- Approver authorization अब भी लागू होता है: exec-only approvers Plugin requests को approve नहीं कर सकते जब तक वे Plugin approvers भी न हों।

यह अन्य चैनलों जैसी वही shared approval button surface उपयोग करता है। जब आपके Slack app settings में `interactivity` सक्षम हो, approval prompts सीधे conversation में Block Kit buttons के रूप में render होते हैं।
जब ये buttons मौजूद हों, वे primary approval UX होते हैं; OpenClaw को
manual `/approve` command केवल तब शामिल करनी चाहिए जब tool result कहे कि chat
approvals unavailable हैं या manual approval ही एकमात्र path है।

Config path:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (वैकल्पिक; जब संभव हो `commands.ownerAllowFrom` पर fallback करता है)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack native exec approvals को auto-enable करता है जब `enabled` unset या `"auto"` हो और कम से कम एक
exec approver resolve हो। Slack इस native-client
path के माध्यम से native Plugin approvals भी handle कर सकता है जब Slack Plugin approvers resolve हों और request native-client filters से match करे। Slack को native approval client के रूप में explicit रूप से disable करने के लिए
`enabled: false` set करें। approvers resolve होने पर native approvals force on करने के लिए `enabled: true` set करें। Slack exec approvals disable करने से
`approvals.plugin` के माध्यम से enabled native Slack Plugin approval delivery disable नहीं होती; Plugin approval
delivery इसके बजाय Slack Plugin approvers का उपयोग करती है।

बिना explicit Slack exec approval config के default behavior:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Explicit Slack-native config केवल तब चाहिए जब आप approvers override करना, filters जोड़ना, या
origin-chat delivery opt into करना चाहते हों:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Shared `approvals.exec` forwarding अलग है। इसका उपयोग केवल तब करें जब exec approval prompts को अन्य chats या explicit out-of-band targets पर भी
route करना जरूरी हो। Shared `approvals.plugin` forwarding भी
अलग है; Slack native delivery उस fallback को केवल तब suppress करती है जब Slack Plugin
approval request को natively handle कर सके।

Same-chat `/approve` Slack channels और DMs में भी काम करता है जो पहले से commands support करते हैं। पूरे approval forwarding model के लिए [Exec approvals](/hi/tools/exec-approvals) देखें।

## Events और operational behavior

- Message edits/deletes को system events में map किया जाता है।
- Thread broadcasts ("Also send to channel" thread replies) को normal user messages के रूप में process किया जाता है।
- Reaction add/remove events को system events में map किया जाता है।
- Member join/leave, channel created/renamed, और pin add/remove events को system events में map किया जाता है।
- `channel_id_changed` `configWrites` enabled होने पर channel config keys migrate कर सकता है।
- Channel topic/purpose metadata को untrusted context माना जाता है और routing context में inject किया जा सकता है।
- Thread starter और initial thread-history context seeding को लागू होने पर configured sender allowlists द्वारा filter किया जाता है।
- Block actions, shortcuts, और modal interactions rich payload fields के साथ structured `Slack interaction: ...` system events emit करते हैं:
  - block actions: selected values, labels, picker values, और `workflow_*` metadata
  - global shortcuts: callback और actor metadata, actor के direct session पर routed
  - message shortcuts: callback, actor, channel, thread, और selected-message context
  - routed channel metadata और form inputs के साथ modal `view_submission` और `view_closed` events

अपने Slack app configuration में global या message shortcuts define करें और कोई भी non-empty callback ID उपयोग करें। OpenClaw matching shortcut payloads acknowledge करता है, अन्य Slack interactions जैसी ही DM/channel sender policy apply करता है, और routed agent session के लिए sanitized event queue करता है। Trigger IDs और response URLs को agent context से redact किया जाता है।

## Configuration reference

Primary reference: [Configuration reference - Slack](/hi/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM access: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibility toggle: `dangerouslyAllowNameMatching` (break-glass; जरूरत न हो तो off रखें)
- channel access: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks` (default: `false`), `chat.postMessage` link/media preview control के लिए `unfurlMedia`; link previews में वापस opt करने के लिए `unfurlLinks: true` set करें
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Channels में कोई replies नहीं">
    क्रम से जाँचें:

    - `groupPolicy`
    - channel allowlist (`channels.slack.channels`) — **keys channel IDs होनी चाहिए** (`C12345678`), names (`#channel-name`) नहीं। Name-based keys `groupPolicy: "allowlist"` के तहत silently fail होती हैं क्योंकि channel routing default रूप से ID-first है। ID खोजने के लिए: Slack में channel पर right-click करें → **Copy link** — URL के अंत में `C...` value channel ID है।
    - `requireMention`
    - per-channel `users` allowlist
    - `messages.groupChat.visibleReplies`: normal group/channel requests default रूप से `"automatic"` होते हैं। यदि आपने `"message_tool"` opt into किया है और logs में बिना `message(action=send)` call के assistant text दिखता है, तो model visible message-tool path चूक गया। इस mode में final text private रहता है; suppressed payload metadata के लिए gateway verbose log inspect करें, या यदि आप चाहते हैं कि हर normal assistant final reply legacy path के माध्यम से post हो तो इसे `"automatic"` पर set करें।
    - `messages.groupChat.unmentionedInbound`: यदि यह `"room_event"` है, तो unmentioned allowed channel chatter ambient context है और तब तक silent रहता है जब तक agent `message` tool call नहीं करता। [Ambient room events](/hi/channels/ambient-room-events) देखें।

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    उपयोगी commands:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    जाँचें:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (या legacy `channels.slack.dm.policy`)
    - pairing approvals / allowlist entries (`dmPolicy: "open"` को अब भी `channels.slack.allowFrom: ["*"]` चाहिए)
    - group DMs MPIM handling उपयोग करते हैं; `channels.slack.dm.groupEnabled` enable करें और, यदि configured हो, MPIM को `channels.slack.dm.groupChannels` में शामिल करें
    - Slack Assistant DM events: `drop message_changed` का उल्लेख करने वाले verbose logs
      आमतौर पर मतलब है कि Slack ने message metadata में recoverable human sender के बिना edited Assistant-thread event भेजा

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode connect नहीं हो रहा">
    Slack app settings में bot + app tokens और Socket Mode enablement validate करें।
    App-Level Token को `connections:write` चाहिए, और Bot User OAuth Token
    bot token उसी Slack app/workspace से संबंधित होना चाहिए जिससे app token है।

    यदि `openclaw channels status --probe --json` `botTokenStatus` या
    `appTokenStatus: "configured_unavailable"` दिखाता है, तो Slack account
    configured है लेकिन current runtime SecretRef-backed
    value resolve नहीं कर सका।

    `slack socket mode failed to start; retry ...` जैसे लॉग पुनर्प्राप्त किए जा सकने वाले
    स्टार्ट विफलताएं हैं। अनुपलब्ध स्कोप, रद्द किए गए टोकन, और अमान्य auth तेज़ी से विफल होते हैं
    इसके बजाय। `slack token mismatch ...` लॉग का मतलब है कि bot token और app token
    अलग-अलग Slack apps से संबंधित प्रतीत होते हैं; Slack app credentials ठीक करें।

  </Accordion>

  <Accordion title="HTTP मोड में इवेंट प्राप्त नहीं हो रहे">
    सत्यापित करें:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - प्रत्येक HTTP account के लिए अद्वितीय `webhookPath`
    - public URL TLS समाप्त करता है और requests को Gateway path पर forward करता है
    - Slack app `request_url` path बिल्कुल `channels.slack.webhookPath` से मेल खाता है (default `/slack/events`)

    यदि account snapshots में `signingSecretStatus: "configured_unavailable"` दिखाई देता है,
    तो HTTP account configured है लेकिन current runtime SecretRef-backed signing secret को
    resolve नहीं कर सका।

    बार-बार दिखने वाला `slack: webhook path ... already registered` लॉग का मतलब है कि दो HTTP
    accounts वही `webhookPath` इस्तेमाल कर रहे हैं; प्रत्येक account को अलग path दें।

  </Accordion>

  <Accordion title="Native/slash commands नहीं चल रहे">
    सत्यापित करें कि आपका इरादा क्या था:

    - Slack में registered matching slash commands के साथ native command mode (`channels.slack.commands.native: true`)
    - या single slash command mode (`channels.slack.slashCommand.enabled: true`)

    Slack slash commands को automatically create या remove नहीं करता। `commands.native: "auto"` Slack native commands को enable नहीं करता; `true` इस्तेमाल करें और Slack app में matching commands बनाएं। HTTP mode में, हर Slack slash command में Gateway URL शामिल होना चाहिए। Socket Mode में, command payloads websocket पर आते हैं और Slack `slash_commands[].url` को ignore करता है।

    `commands.useAccessGroups`, DM authorization, channel allowlists,
    और per-channel `users` allowlists भी जांचें। Slack blocked slash-command senders के लिए
    ephemeral errors लौटाता है, जिनमें शामिल हैं:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## अटैचमेंट विज़न संदर्भ

जब Slack file downloads सफल होते हैं और size limits अनुमति देती हैं, तो Slack downloaded media को agent turn से attach कर सकता है। Image files को media understanding path से pass through किया जा सकता है या सीधे vision-capable reply model को दिया जा सकता है; अन्य files को image input मानने के बजाय downloadable file context के रूप में रखा जाता है।

### समर्थित मीडिया प्रकार

| मीडिया प्रकार                    | स्रोत                | वर्तमान व्यवहार                                                                  | नोट्स                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP images | Slack file URL       | Downloaded और vision-capable handling के लिए turn से attached                   | Per-file cap: `channels.slack.mediaMaxMb` (default 20 MB)                 |
| PDF files                      | Slack file URL       | Downloaded और `download-file` या `pdf` जैसे tools के लिए file context के रूप में exposed | Slack inbound PDFs को automatically image-vision input में convert नहीं करता |
| Other files                    | Slack file URL       | संभव होने पर downloaded और file context के रूप में exposed                              | Binary files को image input नहीं माना जाता                               |
| Thread replies                 | Thread starter files | जब reply में direct media न हो, तब Root-message files को context के रूप में hydrated किया जा सकता है  | File-only starters attachment placeholder का उपयोग करते हैं                          |
| Multi-image messages           | Multiple Slack files | हर file का independently मूल्यांकन किया जाता है                                              | Slack processing प्रति message आठ files तक capped है                     |

### इनबाउंड पाइपलाइन

जब file attachments वाला Slack message आता है:

1. OpenClaw bot token का उपयोग करके Slack के private URL से file download करता है।
2. सफलता पर file media store में लिखी जाती है।
3. Downloaded media paths और content types inbound context में जोड़े जाते हैं।
4. Image-capable model/tool paths उस context से image attachments का उपयोग कर सकते हैं।
5. Non-image files उन्हें handle कर सकने वाले tools के लिए file metadata या media references के रूप में उपलब्ध रहती हैं।

### Thread-root attachment inheritance

जब thread में कोई message आता है (जिसका `thread_ts` parent होता है):

- यदि reply में खुद direct media नहीं है और included root message में files हैं, तो Slack root files को thread-starter context के रूप में hydrate कर सकता है।
- Direct reply attachments को root-message attachments पर प्राथमिकता मिलती है।
- ऐसा root message जिसमें केवल files हैं और text नहीं है, attachment placeholder के साथ दर्शाया जाता है ताकि fallback फिर भी उसकी files शामिल कर सके।

### Multi-attachment handling

जब एक Slack message में कई file attachments होते हैं:

- हर attachment media pipeline के माध्यम से स्वतंत्र रूप से process किया जाता है।
- Downloaded media references message context में aggregate किए जाते हैं।
- Processing order event payload में Slack की file order का अनुसरण करता है।
- किसी एक attachment के download में failure दूसरों को block नहीं करता।

### Size, download, और model limits

- **Size cap**: प्रति file default 20 MB। `channels.slack.mediaMaxMb` के ज़रिए configurable।
- **Download failures**: ऐसी files जिन्हें Slack serve नहीं कर सकता, expired URLs, inaccessible files, oversize files, और Slack auth/login HTML responses को unsupported formats के रूप में report करने के बजाय skip किया जाता है।
- **Vision model**: Image analysis active reply model का उपयोग करता है जब वह vision support करता है, या `agents.defaults.imageModel` पर configured image model का।

### ज्ञात सीमाएं

| परिदृश्य                               | वर्तमान व्यवहार                                                             | समाधान                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Expired Slack file URL                 | File skipped; कोई error नहीं दिखाया गया                                                 | Slack में file फिर से upload करें                                                |
| Vision model not configured            | Image attachments media references के रूप में stored हैं, लेकिन images के रूप में analyzed नहीं | `agents.defaults.imageModel` configure करें या vision-capable reply model इस्तेमाल करें |
| बहुत बड़ी images (> 20 MB by default) | size cap के अनुसार skipped                                                         | यदि Slack अनुमति देता है, तो `channels.slack.mediaMaxMb` बढ़ाएं                       |
| Forwarded/shared attachments           | Text और Slack-hosted image/file media best-effort हैं                       | OpenClaw thread में directly re-share करें                                   |
| PDF attachments                        | file/media context के रूप में stored, automatically image vision के माध्यम से routed नहीं  | file metadata के लिए `download-file` या PDF analysis के लिए `pdf` tool इस्तेमाल करें   |

### संबंधित दस्तावेज़

- [Media understanding pipeline](/hi/nodes/media-understanding)
- [PDF tool](/hi/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack attachment vision enablement
- Regression tests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live verification: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## संबंधित

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Slack user को gateway से pair करें।
  </Card>
  <Card title="Groups" icon="users" href="/hi/channels/groups">
    Channel और group DM behavior।
  </Card>
  <Card title="Channel routing" icon="route" href="/hi/channels/channel-routing">
    इनबाउंड messages को agents तक route करें।
  </Card>
  <Card title="Security" icon="shield" href="/hi/gateway/security">
    Threat model और hardening।
  </Card>
  <Card title="Configuration" icon="sliders" href="/hi/gateway/configuration">
    Config layout और precedence।
  </Card>
  <Card title="Slash commands" icon="terminal" href="/hi/tools/slash-commands">
    Command catalog और behavior।
  </Card>
</CardGroup>
