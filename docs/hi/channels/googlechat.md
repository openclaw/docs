---
read_when:
    - Google Chat चैनल सुविधाओं पर काम करना
summary: Google Chat ऐप समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Google Chat
x-i18n:
    generated_at: "2026-06-28T22:34:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

स्थिति: DMs + स्पेसेस के लिए Google Chat API Webhooks (केवल HTTP) के माध्यम से डाउनलोड करने योग्य plugin।

## इंस्टॉल करें

चैनल कॉन्फ़िगर करने से पहले Google Chat इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/googlechat
```

लोकल checkout (जब git repo से चला रहे हों):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## त्वरित सेटअप (शुरुआती)

1. Google Cloud प्रोजेक्ट बनाएं और **Google Chat API** सक्षम करें।
   - यहां जाएं: [Google Chat API क्रेडेंशियल](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - अगर API पहले से सक्षम नहीं है, तो उसे सक्षम करें।
2. **Service Account** बनाएं:
   - **Create Credentials** > **Service Account** दबाएं।
   - इसे अपनी पसंद का नाम दें (जैसे, `openclaw-chat`)।
   - अनुमतियां खाली छोड़ें (**Continue** दबाएं)।
   - एक्सेस वाले principals खाली छोड़ें (**Done** दबाएं)।
3. **JSON Key** बनाएं और डाउनलोड करें:
   - service accounts की सूची में, अभी बनाए गए account पर क्लिक करें।
   - **Keys** टैब पर जाएं।
   - **Add Key** > **Create new key** पर क्लिक करें।
   - **JSON** चुनें और **Create** दबाएं।
4. डाउनलोड की गई JSON फ़ाइल को अपने gateway host पर संग्रहीत करें (जैसे, `~/.openclaw/googlechat-service-account.json`)।
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) में Google Chat app बनाएं:
   - **Application info** भरें:
     - **App name**: (जैसे `OpenClaw`)
     - **Avatar URL**: (जैसे `https://openclaw.ai/logo.png`)
     - **Description**: (जैसे `Personal AI Assistant`)
   - **Interactive features** सक्षम करें।
   - **Functionality** के अंतर्गत, **Join spaces and group conversations** चुनें।
   - **Connection settings** के अंतर्गत, **HTTP endpoint URL** चुनें।
   - **Triggers** के अंतर्गत, **Use a common HTTP endpoint URL for all triggers** चुनें और इसे अपने gateway के सार्वजनिक URL के बाद `/googlechat` जोड़कर सेट करें।
     - _सुझाव: अपने gateway का सार्वजनिक URL खोजने के लिए `openclaw status` चलाएं।_
   - **Visibility** के अंतर्गत, **Make this Chat app available to specific people and groups in `<Your Domain>`** चुनें।
   - टेक्स्ट बॉक्स में अपना ईमेल पता दर्ज करें (जैसे `user@example.com`)।
   - नीचे **Save** पर क्लिक करें।
6. **app status सक्षम करें**:
   - सेव करने के बाद, **पेज refresh करें**।
   - **App status** सेक्शन खोजें (आमतौर पर सेव करने के बाद ऊपर या नीचे के पास)।
   - स्थिति को **Live - available to users** में बदलें।
   - फिर से **Save** पर क्लिक करें।
7. service account path + Webhook audience के साथ OpenClaw कॉन्फ़िगर करें:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - या config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`।
8. Webhook audience type + value सेट करें (आपके Chat app config से मेल खाता है)।
9. Gateway शुरू करें। Google Chat आपके Webhook path पर POST करेगा।

## Google Chat में जोड़ें

जब gateway चल रहा हो और आपका ईमेल visibility list में जोड़ा गया हो:

1. [Google Chat](https://chat.google.com/) पर जाएं।
2. **Direct Messages** के आगे **+** (plus) icon पर क्लिक करें।
3. search bar में (जहां आप आमतौर पर लोगों को जोड़ते हैं), वह **App name** टाइप करें जिसे आपने Google Cloud Console में कॉन्फ़िगर किया था।
   - **नोट**: bot "Marketplace" browse list में _नहीं_ दिखेगा क्योंकि यह private app है। आपको इसे नाम से खोजना होगा।
4. परिणामों में से अपना bot चुनें।
5. 1:1 बातचीत शुरू करने के लिए **Add** या **Chat** पर क्लिक करें।
6. assistant को trigger करने के लिए "Hello" भेजें!

## सार्वजनिक URL (केवल Webhook)

Google Chat Webhooks के लिए सार्वजनिक HTTPS endpoint आवश्यक है। सुरक्षा के लिए, इंटरनेट पर **केवल `/googlechat` path expose करें**। OpenClaw dashboard और अन्य संवेदनशील endpoints को अपने private network पर रखें।

### विकल्प A: Tailscale Funnel (अनुशंसित)

private dashboard के लिए Tailscale Serve और सार्वजनिक Webhook path के लिए Funnel का उपयोग करें। इससे `/` private रहता है जबकि केवल `/googlechat` expose होता है।

1. **जांचें कि आपका gateway किस address से bound है:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP address नोट करें (जैसे, `127.0.0.1`, `0.0.0.0`, या आपका Tailscale IP जैसे `100.x.x.x`)।

2. **dashboard को केवल tailnet पर expose करें (port 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **केवल Webhook path को सार्वजनिक रूप से expose करें:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Funnel access के लिए node authorize करें:**
   अगर पूछा जाए, तो अपने tailnet policy में इस node के लिए Funnel सक्षम करने हेतु output में दिखाए गए authorization URL पर जाएं।

5. **configuration सत्यापित करें:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

आपका सार्वजनिक Webhook URL होगा:
`https://<node-name>.<tailnet>.ts.net/googlechat`

आपका private dashboard केवल tailnet तक सीमित रहता है:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat app config में public URL (बिना `:8443`) का उपयोग करें।

> नोट: यह configuration reboots के बाद भी बना रहता है। इसे बाद में हटाने के लिए, `tailscale funnel reset` और `tailscale serve reset` चलाएं।

### विकल्प B: Reverse Proxy (Caddy)

अगर आप Caddy जैसे reverse proxy का उपयोग करते हैं, तो केवल विशिष्ट path को proxy करें:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

इस config के साथ, `your-domain.com/` पर कोई भी request ignore की जाएगी या 404 के रूप में लौटेगी, जबकि `your-domain.com/googlechat` सुरक्षित रूप से OpenClaw तक route होगी।

### विकल्प C: Cloudflare Tunnel

अपने tunnel के ingress rules को केवल Webhook path route करने के लिए कॉन्फ़िगर करें:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (नहीं मिला)

## यह कैसे काम करता है

1. Google Chat gateway को Webhook POSTs भेजता है। प्रत्येक request में `Authorization: Bearer <token>` header शामिल होता है।
   - header मौजूद होने पर OpenClaw पूरे Webhook bodies को पढ़ने/parse करने से पहले bearer auth सत्यापित करता है।
   - body में `authorizationEventObject.systemIdToken` ले जाने वाली Google Workspace Add-on requests stricter pre-auth body budget के माध्यम से समर्थित हैं।
2. OpenClaw token को configured `audienceType` + `audience` के विरुद्ध सत्यापित करता है:
   - `audienceType: "app-url"` → audience आपका HTTPS Webhook URL है।
   - `audienceType: "project-number"` → audience Cloud project number है।
3. Messages space के अनुसार route होते हैं:
   - DMs session key `agent:<agentId>:googlechat:direct:<spaceId>` का उपयोग करते हैं।
   - Spaces session key `agent:<agentId>:googlechat:group:<spaceId>` का उपयोग करते हैं।
4. DM access default रूप से pairing है। अज्ञात senders को pairing code मिलता है; इससे approve करें:
   - `openclaw pairing approve googlechat <code>`
5. Group spaces के लिए default रूप से @-mention आवश्यक है। अगर mention detection को app के user name की आवश्यकता हो, तो `botUser` का उपयोग करें।
6. जब कोई exec या plugin approval request Google Chat से शुरू होती है और stable `users/<id>` approver configured होता है, तो OpenClaw originating space या thread में native Google Chat approval card post करता है। card buttons opaque callback tokens का उपयोग करते हैं, और manual `/approve <id> <decision>` prompt केवल तब दिखाया जाता है जब native approval delivery उपलब्ध न हो।

## Targets

delivery और allowlists के लिए इन identifiers का उपयोग करें:

- Direct messages: `users/<userId>` (अनुशंसित)।
- Raw email `name@example.com` mutable है और केवल direct allowlist matching के लिए तब उपयोग होता है जब `channels.googlechat.dangerouslyAllowNameMatching: true` हो।
- Deprecated: `users/<email>` को user id माना जाता है, email allowlist नहीं।
- Spaces: `spaces/<spaceId>`।

## Config highlights

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

नोट्स:

- Service account credentials को `serviceAccount` (JSON string) के साथ inline भी pass किया जा सकता है।
- `serviceAccountRef` भी समर्थित है (env/file SecretRef), जिसमें `channels.googlechat.accounts.<id>.serviceAccountRef` के अंतर्गत per-account refs शामिल हैं।
- अगर `webhookPath` सेट नहीं है, तो default Webhook path `/googlechat` है।
- `dangerouslyAllowNameMatching` allowlists के लिए mutable email principal matching फिर से सक्षम करता है (break-glass compatibility mode)।
- Reactions `reactions` tool और `channels action` के माध्यम से उपलब्ध हैं जब `actions.reactions` सक्षम हो।
- Native approval cards Google Chat `cardsV2` button clicks का उपयोग करते हैं, reaction events का नहीं। Approvers `dm.allowFrom` या `defaultTo` से आते हैं और stable numeric `users/<id>` values होने चाहिए।
- Message actions text के लिए `send` और explicit attachment sends के लिए `upload-file` expose करते हैं। `upload-file` `media` / `filePath` / `path` के साथ वैकल्पिक `message`, `filename`, और thread targeting स्वीकार करता है।
- `typingIndicator` `message` (default), `none`, और `reaction` का समर्थन करता है (reaction के लिए user OAuth आवश्यक है)।
- Attachments Chat API के माध्यम से download किए जाते हैं और media pipeline में stored होते हैं (size `mediaMaxMb` से capped होती है)।
- Bot-authored Google Chat messages default रूप से ignore किए जाते हैं। अगर आप जानबूझकर `allowBots: true` सेट करते हैं, तो accepted bot-authored messages shared [bot loop protection](/hi/channels/bot-loop-protection) का उपयोग करते हैं। `channels.defaults.botLoopProtection` कॉन्फ़िगर करें, फिर जब किसी एक space को अलग budget चाहिए हो तो `channels.googlechat.botLoopProtection` या `channels.googlechat.groups.<space>.botLoopProtection` से override करें।

Secrets reference details: [Secrets Management](/hi/gateway/secrets)।

## Troubleshooting

### 405 Method Not Allowed

अगर Google Cloud Logs Explorer में इस तरह की errors दिखती हैं:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

इसका अर्थ है कि Webhook handler registered नहीं है। सामान्य कारण:

1. **Channel configured नहीं है**: आपके config से `channels.googlechat` section missing है। इससे verify करें:

   ```bash
   openclaw config get channels.googlechat
   ```

   अगर यह "Config path not found" लौटाता है, तो configuration जोड़ें ([Config highlights](#config-highlights) देखें)।

2. **Plugin enabled नहीं है**: plugin status जांचें:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   अगर यह "disabled" दिखाता है, तो अपने config में `plugins.entries.googlechat.enabled: true` जोड़ें।

3. **Gateway restarted नहीं हुआ है**: config जोड़ने के बाद, gateway restart करें:

   ```bash
   openclaw gateway restart
   ```

सत्यापित करें कि channel चल रहा है:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### अन्य समस्याएं

- auth errors या missing audience config के लिए `openclaw channels status --probe` जांचें।
- अगर कोई messages नहीं आते, तो Chat app के Webhook URL + event subscriptions की पुष्टि करें।
- अगर mention gating replies block करता है, तो `botUser` को app के user resource name पर सेट करें और `requireMention` verify करें।
- requests gateway तक पहुंच रही हैं या नहीं, यह देखने के लिए test message भेजते समय `openclaw logs --follow` का उपयोग करें।

संबंधित docs:

- [Gateway configuration](/hi/gateway/configuration)
- [Security](/hi/gateway/security)
- [Reactions](/hi/tools/reactions)

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) — DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) — समूह चैट व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) — पहुंच मॉडल और हार्डनिंग
