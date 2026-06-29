---
read_when:
    - OpenClaw के लिए Twitch चैट एकीकरण सेट अप करना
sidebarTitle: Twitch
summary: Twitch चैट बॉट का कॉन्फ़िगरेशन और सेटअप
title: Twitch
x-i18n:
    generated_at: "2026-06-28T22:41:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

IRC कनेक्शन के माध्यम से Twitch चैट समर्थन। OpenClaw चैनलों में संदेश प्राप्त करने और भेजने के लिए Twitch उपयोगकर्ता (bot खाता) के रूप में कनेक्ट होता है।

## बंडल किया गया plugin

<Note>
Twitch मौजूदा OpenClaw रिलीज़ में बंडल किए गए plugin के रूप में आता है, इसलिए सामान्य packaged builds को अलग इंस्टॉल की आवश्यकता नहीं होती।
</Note>

यदि आप पुराने build पर हैं या किसी custom install में Twitch शामिल नहीं है, तो npm package सीधे इंस्टॉल करें:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

मौजूदा आधिकारिक release tag का पालन करने के लिए bare package का उपयोग करें। सटीक
version केवल तब pin करें जब आपको reproducible install चाहिए।

विवरण: [Plugins](/hi/tools/plugin)

## त्वरित setup (शुरुआती)

<Steps>
  <Step title="सुनिश्चित करें कि plugin उपलब्ध है">
    मौजूदा packaged OpenClaw रिलीज़ इसे पहले से bundle करती हैं। पुराने/custom installs ऊपर दिए गए commands से इसे मैन्युअल रूप से जोड़ सकते हैं।
  </Step>
  <Step title="Twitch bot खाता बनाएं">
    bot के लिए एक dedicated Twitch खाता बनाएं (या मौजूदा खाते का उपयोग करें)।
  </Step>
  <Step title="credentials जनरेट करें">
    [Twitch Token Generator](https://twitchtokengenerator.com/) का उपयोग करें:

    - **Bot Token** चुनें
    - सत्यापित करें कि scopes `chat:read` और `chat:write` चुने गए हैं
    - **Client ID** और **Access Token** कॉपी करें

  </Step>
  <Step title="अपना Twitch user ID खोजें">
    username को Twitch user ID में बदलने के लिए [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) का उपयोग करें।
  </Step>
  <Step title="token configure करें">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (केवल default account)
    - या config: `channels.twitch.accessToken`

    यदि दोनों सेट हैं, तो config को प्राथमिकता मिलती है (env fallback केवल default-account के लिए है)।

  </Step>
  <Step title="gateway शुरू करें">
    configured channel के साथ gateway शुरू करें।
  </Step>
</Steps>

<Warning>
अनधिकृत users को bot trigger करने से रोकने के लिए access control (`allowFrom` या `allowedRoles`) जोड़ें। `requireMention` का default `true` है।
</Warning>

न्यूनतम config:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## यह क्या है

- Gateway के स्वामित्व वाला Twitch channel।
- Deterministic routing: replies हमेशा Twitch पर वापस जाते हैं।
- प्रत्येक account एक isolated session key `agent:<agentId>:twitch:<accountName>` से map होता है।
- `username` bot का account है (जो authenticate करता है), `channel` वह chat room है जिसमें शामिल होना है।

## Setup (विस्तृत)

### credentials जनरेट करें

[Twitch Token Generator](https://twitchtokengenerator.com/) का उपयोग करें:

- **Bot Token** चुनें
- सत्यापित करें कि scopes `chat:read` और `chat:write` चुने गए हैं
- **Client ID** और **Access Token** कॉपी करें

<Note>
मैन्युअल app registration की आवश्यकता नहीं है। Tokens कई घंटों के बाद expire हो जाते हैं।
</Note>

### bot configure करें

<Tabs>
  <Tab title="Env var (केवल default account)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

यदि env और config दोनों सेट हैं, तो config को प्राथमिकता मिलती है।

### Access control (अनुशंसित)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

कड़े allowlist के लिए `allowFrom` को प्राथमिकता दें। यदि आप role-based access चाहते हैं, तो इसके बजाय `allowedRoles` का उपयोग करें।

**उपलब्ध roles:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**user IDs क्यों?** Usernames बदल सकते हैं, जिससे impersonation संभव हो जाता है। User IDs स्थायी होते हैं।

अपना Twitch user ID खोजें: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (अपने Twitch username को ID में बदलें)
</Note>

## Token refresh (वैकल्पिक)

[Twitch Token Generator](https://twitchtokengenerator.com/) के tokens अपने आप refresh नहीं किए जा सकते - expire होने पर regenerate करें।

automatic token refresh के लिए, [Twitch Developer Console](https://dev.twitch.tv/console) पर अपना Twitch application बनाएं और config में जोड़ें:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

bot expiration से पहले अपने आप tokens refresh करता है और refresh events log करता है।

## Multi-account support

प्रत्येक account के tokens के साथ `channels.twitch.accounts` का उपयोग करें। shared pattern के लिए [Configuration](/hi/gateway/configuration) देखें।

उदाहरण (दो channels में एक bot account):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
प्रत्येक account को अपना token चाहिए (प्रति channel एक token)।
</Note>

## Access control

<Tabs>
  <Tab title="User ID allowlist (सबसे सुरक्षित)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Role-based">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` एक कड़ा allowlist है। सेट होने पर, केवल वे user IDs allowed होते हैं। यदि आप role-based access चाहते हैं, तो `allowFrom` को unset छोड़ें और इसके बजाय `allowedRoles` configure करें।

  </Tab>
  <Tab title="@mention requirement disable करें">
    default रूप से, `requireMention` `true` है। disable करने और सभी messages का जवाब देने के लिए:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Troubleshooting

पहले, diagnostic commands चलाएं:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot messages का जवाब नहीं देता">
    - **Access control जांचें:** सुनिश्चित करें कि आपका user ID `allowFrom` में है, या test करने के लिए अस्थायी रूप से `allowFrom` हटाएं और `allowedRoles: ["all"]` सेट करें।
    - **जांचें कि bot channel में है:** bot को `channel` में निर्दिष्ट channel से जुड़ना होगा।

  </Accordion>
  <Accordion title="Token समस्याएं">
    "Failed to connect" या authentication errors:

    - सत्यापित करें कि `accessToken` OAuth access token value है (आमतौर पर `oauth:` prefix से शुरू होता है)
    - जांचें कि token में `chat:read` और `chat:write` scopes हैं
    - यदि token refresh का उपयोग कर रहे हैं, तो सत्यापित करें कि `clientSecret` और `refreshToken` सेट हैं

  </Accordion>
  <Accordion title="Token refresh काम नहीं कर रहा">
    refresh events के लिए logs जांचें:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    यदि आपको "token refresh disabled (no refresh token)" दिखता है:

    - सुनिश्चित करें कि `clientSecret` दिया गया है
    - सुनिश्चित करें कि `refreshToken` दिया गया है

  </Accordion>
</AccordionGroup>

## Config

### Account config

<ParamField path="username" type="string">
  Bot username.
</ParamField>
<ParamField path="accessToken" type="string">
  `chat:read` और `chat:write` के साथ OAuth access token.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (Token Generator या आपके app से).
</ParamField>
<ParamField path="channel" type="string" required>
  जुड़ने वाला channel.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  इस account को enable करें.
</ParamField>
<ParamField path="clientSecret" type="string">
  वैकल्पिक: automatic token refresh के लिए.
</ParamField>
<ParamField path="refreshToken" type="string">
  वैकल्पिक: automatic token refresh के लिए.
</ParamField>
<ParamField path="expiresIn" type="number">
  seconds में token expiry.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Token प्राप्त होने का timestamp.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  User ID allowlist.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Role-based access control.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention आवश्यक करें.
</ParamField>

### Provider options

- `channels.twitch.enabled` - channel startup enable/disable करें
- `channels.twitch.username` - Bot username (simplified single-account config)
- `channels.twitch.accessToken` - OAuth access token (simplified single-account config)
- `channels.twitch.clientId` - Twitch Client ID (simplified single-account config)
- `channels.twitch.channel` - जुड़ने वाला channel (simplified single-account config)
- `channels.twitch.accounts.<accountName>` - Multi-account config (ऊपर दिए गए सभी account fields)

पूर्ण उदाहरण:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Tool actions

agent `twitch` को action के साथ call कर सकता है:

- `send` - channel को message भेजें

उदाहरण:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## सुरक्षा और ops

- **tokens को passwords की तरह मानें** — tokens को कभी git में commit न करें।
- लंबे समय तक चलने वाले bots के लिए **automatic token refresh का उपयोग करें**।
- access control के लिए usernames के बजाय **user ID allowlists का उपयोग करें**।
- token refresh events और connection status के लिए **logs monitor करें**।
- **tokens को न्यूनतम scope दें** — केवल `chat:read` और `chat:write` request करें।
- **यदि अटके हों**: यह पुष्टि करने के बाद gateway restart करें कि कोई अन्य process session का स्वामी नहीं है।

## सीमाएं

- प्रति message **500 characters** (word boundaries पर auto-chunked).
- chunking से पहले Markdown हटा दिया जाता है।
- कोई rate limiting नहीं (Twitch की built-in rate limits का उपयोग करता है).

## संबंधित

- [Channel Routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Channels Overview](/hi/channels) — सभी supported channels
- [Groups](/hi/channels/groups) — group chat behavior और mention gating
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow
- [Security](/hi/gateway/security) — access model और hardening
