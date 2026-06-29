---
read_when:
    - Nextcloud Talk चैनल की सुविधाओं पर काम करना
summary: Nextcloud Talk समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-06-28T22:37:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: बंडल किया गया Plugin (Webhook bot)। प्रत्यक्ष संदेश, कक्ष, प्रतिक्रियाएँ, और markdown संदेश समर्थित हैं।

## बंडल किया गया Plugin

Nextcloud Talk वर्तमान OpenClaw रिलीज़ में बंडल किए गए Plugin के रूप में आता है, इसलिए
सामान्य पैकेज्ड बिल्ड को अलग इंस्टॉल की आवश्यकता नहीं होती।

यदि आप पुराने बिल्ड पर हैं या ऐसे कस्टम इंस्टॉल पर हैं जिसमें Nextcloud Talk शामिल नहीं है,
तो npm पैकेज सीधे इंस्टॉल करें:

CLI के माध्यम से इंस्टॉल करें (npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

वर्तमान आधिकारिक रिलीज़ टैग का अनुसरण करने के लिए bare package का उपयोग करें। सटीक
version तभी पिन करें जब आपको पुनरुत्पाद्य इंस्टॉल की आवश्यकता हो।

लोकल चेकआउट (git repo से चलाते समय):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप (शुरुआती)

1. सुनिश्चित करें कि Nextcloud Talk Plugin उपलब्ध है।
   - वर्तमान पैकेज्ड OpenClaw रिलीज़ इसे पहले से बंडल करती हैं।
   - पुराने/कस्टम इंस्टॉल इसे ऊपर दिए गए कमांड से मैन्युअल रूप से जोड़ सकते हैं।
2. अपने Nextcloud सर्वर पर, एक bot बनाएँ:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. लक्ष्य कक्ष सेटिंग्स में bot सक्षम करें।
4. OpenClaw कॉन्फ़िगर करें:
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - या env: `NEXTCLOUD_TALK_BOT_SECRET` (केवल डिफ़ॉल्ट अकाउंट)

   CLI सेटअप:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   समतुल्य स्पष्ट फ़ील्ड:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   फ़ाइल-आधारित secret:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. gateway रीस्टार्ट करें (या सेटअप पूरा करें)।

न्यूनतम config:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## नोट्स

- Bots DMs शुरू नहीं कर सकते। उपयोगकर्ता को पहले bot को संदेश भेजना होगा।
- Webhook URL Gateway द्वारा पहुँच योग्य होना चाहिए; यदि proxy के पीछे है तो `webhookPublicUrl` सेट करें।
- Media uploads bot API द्वारा समर्थित नहीं हैं; media URLs के रूप में भेजा जाता है।
- Webhook payload DMs और कक्षों में अंतर नहीं करता; room-type lookups सक्षम करने के लिए `apiUser` + `apiPassword` सेट करें (अन्यथा DMs को कक्ष माना जाता है)।

## पहुँच नियंत्रण (DMs)

- डिफ़ॉल्ट: `channels.nextcloud-talk.dmPolicy = "pairing"`। अज्ञात प्रेषकों को pairing code मिलता है।
- इसके माध्यम से स्वीकृत करें:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- सार्वजनिक DMs: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` केवल Nextcloud user IDs से मेल खाता है; display names अनदेखे किए जाते हैं।

## कक्ष (समूह)

- डिफ़ॉल्ट: `channels.nextcloud-talk.groupPolicy = "allowlist"` (mention-gated)।
- `channels.nextcloud-talk.rooms` के साथ कक्षों को allowlist करें:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- कोई कक्ष अनुमति न देने के लिए, allowlist खाली रखें या `channels.nextcloud-talk.groupPolicy="disabled"` सेट करें।

## क्षमताएँ

| सुविधा          | स्थिति          |
| --------------- | ------------- |
| प्रत्यक्ष संदेश | समर्थित        |
| कक्ष            | समर्थित        |
| Threads         | समर्थित नहीं   |
| Media           | केवल URL       |
| प्रतिक्रियाएँ   | समर्थित        |
| Native commands | समर्थित नहीं   |

## कॉन्फ़िगरेशन संदर्भ (Nextcloud Talk)

पूर्ण कॉन्फ़िगरेशन: [Configuration](/hi/gateway/configuration)

प्रदाता विकल्प:

- `channels.nextcloud-talk.enabled`: channel startup सक्षम/अक्षम करें।
- `channels.nextcloud-talk.baseUrl`: Nextcloud instance URL।
- `channels.nextcloud-talk.botSecret`: bot shared secret।
- `channels.nextcloud-talk.botSecretFile`: regular-file secret path। Symlinks अस्वीकार किए जाते हैं।
- `channels.nextcloud-talk.apiUser`: room lookups (DM detection) के लिए API user।
- `channels.nextcloud-talk.apiPassword`: room lookups के लिए API/app password।
- `channels.nextcloud-talk.apiPasswordFile`: API password file path।
- `channels.nextcloud-talk.webhookPort`: webhook listener port (डिफ़ॉल्ट: 8788)।
- `channels.nextcloud-talk.webhookHost`: webhook host (डिफ़ॉल्ट: 0.0.0.0)।
- `channels.nextcloud-talk.webhookPath`: webhook path (डिफ़ॉल्ट: /nextcloud-talk-webhook)।
- `channels.nextcloud-talk.webhookPublicUrl`: बाहरी रूप से पहुँच योग्य webhook URL।
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`।
- `channels.nextcloud-talk.allowFrom`: DM allowlist (user IDs)। `open` के लिए `"*"` आवश्यक है।
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`।
- `channels.nextcloud-talk.groupAllowFrom`: group allowlist (user IDs)।
- `channels.nextcloud-talk.rooms`: प्रति-कक्ष settings और allowlist।
- Static sender access groups को `allowFrom` और `groupAllowFrom` से `accessGroup:<name>` के साथ संदर्भित किया जा सकता है।
- `channels.nextcloud-talk.historyLimit`: group history limit (0 अक्षम करता है)।
- `channels.nextcloud-talk.dmHistoryLimit`: DM history limit (0 अक्षम करता है)।
- `channels.nextcloud-talk.dms`: प्रति-DM overrides (historyLimit)।
- `channels.nextcloud-talk.textChunkLimit`: outbound text chunk size (chars)।
- `channels.nextcloud-talk.chunkMode`: लंबाई chunking से पहले रिक्त पंक्तियों (paragraph boundaries) पर विभाजित करने के लिए `length` (डिफ़ॉल्ट) या `newline`।
- `channels.nextcloud-talk.blockStreaming`: इस channel के लिए block streaming अक्षम करें।
- `channels.nextcloud-talk.blockStreamingCoalesce`: block streaming coalesce tuning।
- `channels.nextcloud-talk.mediaMaxMb`: inbound media cap (MB)।

## संबंधित

- [Channels Overview](/hi/channels) — सभी समर्थित channels
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow
- [Groups](/hi/channels/groups) — group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Security](/hi/gateway/security) — access model और hardening
