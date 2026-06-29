---
read_when:
    - Microsoft Teams चैनल सुविधाओं पर काम करना
summary: Microsoft Teams बॉट समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-28T22:37:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

स्थिति: टेक्स्ट + DM अटैचमेंट समर्थित हैं; चैनल/समूह फ़ाइल भेजने के लिए `sharePointSiteId` + Graph अनुमतियाँ आवश्यक हैं (देखें [समूह चैट में फ़ाइलें भेजना](#sending-files-in-group-chats)). Polls Adaptive Cards के ज़रिए भेजे जाते हैं. संदेश क्रियाएँ फ़ाइल-प्रथम भेजने के लिए स्पष्ट `upload-file` दिखाती हैं.

## बंडल किया गया plugin

Microsoft Teams वर्तमान OpenClaw रिलीज़ में बंडल किए गए plugin के रूप में आता है, इसलिए सामान्य पैकेज्ड बिल्ड में अलग
इंस्टॉल की आवश्यकता नहीं है.

यदि आप किसी पुराने बिल्ड पर हैं या ऐसे कस्टम इंस्टॉल पर हैं जिसमें बंडल किया गया Teams शामिल नहीं है,
तो npm पैकेज सीधे इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/msteams
```

वर्तमान आधिकारिक रिलीज़ टैग का अनुसरण करने के लिए बेयर पैकेज का उपयोग करें. सटीक
वर्ज़न केवल तब पिन करें जब आपको पुनरुत्पादनीय इंस्टॉल चाहिए.

लोकल चेकआउट (जब git repo से चला रहे हों):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) एक ही कमांड में bot रजिस्ट्रेशन, manifest निर्माण, और credential जनरेशन संभालता है.

**1. इंस्टॉल करें और लॉग इन करें**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI अभी preview में है. कमांड और flags रिलीज़ के बीच बदल सकते हैं.
</Note>

**2. एक tunnel शुरू करें** (Teams localhost तक नहीं पहुँच सकता)

यदि आपने अभी तक नहीं किया है तो devtunnel CLI इंस्टॉल और authenticate करें ([शुरुआती मार्गदर्शिका](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` आवश्यक है क्योंकि Teams devtunnels के साथ authenticate नहीं कर सकता. हर आने वाला bot request फिर भी Teams SDK द्वारा अपने-आप validate किया जाता है.
</Note>

विकल्प: `ngrok http 3978` या `tailscale funnel 3978` (लेकिन ये हर session में URL बदल सकते हैं).

**3. ऐप बनाएँ**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

यह एक कमांड:

- एक Entra ID (Azure AD) application बनाता है
- client secret जनरेट करता है
- Teams app manifest बनाता और अपलोड करता है (icons के साथ)
- bot रजिस्टर करता है (डिफ़ॉल्ट रूप से Teams-managed - Azure subscription की आवश्यकता नहीं)

आउटपुट में `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, और एक **Teams App ID** दिखेगा - इन्हें अगले चरणों के लिए नोट करें. यह ऐप को सीधे Teams में इंस्टॉल करने का विकल्प भी देता है.

**4. OpenClaw कॉन्फ़िगर करें** आउटपुट से मिले credentials का उपयोग करके:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

या environment variables सीधे उपयोग करें: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. ऐप को Teams में इंस्टॉल करें**

`teams app create` आपको ऐप इंस्टॉल करने के लिए prompt करेगा - "Install in Teams" चुनें. यदि आपने इसे छोड़ दिया, तो आप बाद में link प्राप्त कर सकते हैं:

```bash
teams app get <teamsAppId> --install-link
```

**6. सत्यापित करें कि सब कुछ काम करता है**

```bash
teams app doctor <teamsAppId>
```

यह bot रजिस्ट्रेशन, AAD app config, manifest validity, और SSO setup पर diagnostics चलाता है.

प्रोडक्शन deployments के लिए, client secrets के बजाय [federated authentication](/hi/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificate या managed identity) उपयोग करने पर विचार करें.

<Note>
Group chats डिफ़ॉल्ट रूप से अवरुद्ध हैं (`channels.msteams.groupPolicy: "allowlist"`). समूह replies की अनुमति देने के लिए, `channels.msteams.groupAllowFrom` सेट करें, या किसी भी member (mention-gated) को अनुमति देने के लिए `groupPolicy: "open"` उपयोग करें.
</Note>

## लक्ष्य

- Teams DMs, group chats, या channels के ज़रिए OpenClaw से बात करें.
- routing deterministic रखें: replies हमेशा उसी channel में वापस जाते हैं जहाँ वे आए थे.
- सुरक्षित channel व्यवहार को default रखें (जब तक अन्यथा configure न किया गया हो, mentions आवश्यक).

## Config writes

डिफ़ॉल्ट रूप से, Microsoft Teams को `/config set|unset` द्वारा trigger किए गए config updates लिखने की अनुमति है (`commands.config: true` आवश्यक).

इसके साथ disable करें:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Access control (DMs + groups)

**DM access**

- Default: `channels.msteams.dmPolicy = "pairing"`. Unknown senders approved होने तक ignore किए जाते हैं.
- `channels.msteams.allowFrom` को स्थिर AAD object IDs या static sender access groups जैसे `accessGroup:core-team` का उपयोग करना चाहिए.
- allowlists के लिए UPN/display-name matching पर निर्भर न रहें - वे बदल सकते हैं. OpenClaw डिफ़ॉल्ट रूप से direct name matching disable करता है; `channels.msteams.dangerouslyAllowNameMatching: true` के साथ स्पष्ट रूप से opt in करें.
- credentials अनुमति दें तो wizard Microsoft Graph के ज़रिए names को IDs में resolve कर सकता है.

**Group access**

- Default: `channels.msteams.groupPolicy = "allowlist"` (जब तक आप `groupAllowFrom` न जोड़ें, blocked). unset होने पर default override करने के लिए `channels.defaults.groupPolicy` उपयोग करें.
- `channels.msteams.groupAllowFrom` नियंत्रित करता है कि group chats/channels में कौन से senders या static sender access groups trigger कर सकते हैं (`channels.msteams.allowFrom` पर fall back करता है).
- किसी भी member को अनुमति देने के लिए `groupPolicy: "open"` सेट करें (फिर भी डिफ़ॉल्ट रूप से mention-gated).
- **कोई channel नहीं** अनुमति देने के लिए, `channels.msteams.groupPolicy: "disabled"` सेट करें.

उदाहरण:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + channel allowlist**

- `channels.msteams.teams` के अंतर्गत teams और channels सूचीबद्ध करके group/channel replies को scope करें.
- Keys को Teams links से स्थिर Teams conversation IDs का उपयोग करना चाहिए, mutable display names का नहीं.
- जब `groupPolicy="allowlist"` हो और teams allowlist मौजूद हो, केवल सूचीबद्ध teams/channels स्वीकार किए जाते हैं (mention-gated).
- configure wizard `Team/Channel` entries स्वीकार करता है और उन्हें आपके लिए store करता है.
- startup पर, OpenClaw team/channel और user allowlist names को IDs में resolve करता है (जब Graph permissions अनुमति दें)
  और mapping log करता है; unresolved team/channel names typed रूप में रखे जाते हैं लेकिन routing के लिए डिफ़ॉल्ट रूप से ignore किए जाते हैं, जब तक `channels.msteams.dangerouslyAllowNameMatching: true` enabled न हो.

उदाहरण:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>Manual setup (Teams CLI के बिना)</strong></summary>

यदि आप Teams CLI उपयोग नहीं कर सकते, तो आप Azure Portal के ज़रिए bot manually सेट अप कर सकते हैं.

### यह कैसे काम करता है

1. सुनिश्चित करें कि Microsoft Teams plugin उपलब्ध है (वर्तमान रिलीज़ में bundled).
2. एक **Azure Bot** बनाएँ (App ID + secret + tenant ID).
3. एक **Teams app package** बनाएँ जो bot को reference करे और नीचे दी गई RSC permissions शामिल करे.
4. Teams app को किसी team में (या DMs के लिए personal scope में) upload/install करें.
5. `~/.openclaw/openclaw.json` (या env vars) में `msteams` configure करें और gateway शुरू करें.
6. gateway डिफ़ॉल्ट रूप से `/api/messages` पर Bot Framework webhook traffic सुनता है.

### चरण 1: Azure Bot बनाएँ

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) पर जाएँ
2. **Basics** tab भरें:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | आपका bot name, जैसे, `openclaw-msteams` (unique होना चाहिए) |
   | **Subscription**   | अपना Azure subscription चुनें                           |
   | **Resource group** | नया बनाएँ या मौजूदा उपयोग करें                               |
   | **Pricing tier**   | dev/testing के लिए **Free**                                 |
   | **Type of App**    | **Single Tenant** (अनुशंसित - नीचे note देखें)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
नए multi-tenant bots का निर्माण 2025-07-31 के बाद deprecated कर दिया गया था. नए bots के लिए **Single Tenant** उपयोग करें.
</Warning>

3. **Review + create** → **Create** पर क्लिक करें (लगभग 1-2 मिनट प्रतीक्षा करें)

### चरण 2: Credentials प्राप्त करें

1. अपने Azure Bot resource → **Configuration** पर जाएँ
2. **Microsoft App ID** copy करें → यह आपका `appId` है
3. **Manage Password** पर क्लिक करें → App Registration पर जाएँ
4. **Certificates & secrets** के अंतर्गत → **New client secret** → **Value** copy करें → यह आपका `appPassword` है
5. **Overview** पर जाएँ → **Directory (tenant) ID** copy करें → यह आपका `tenantId` है

### चरण 3: Messaging Endpoint configure करें

1. Azure Bot → **Configuration** में
2. **Messaging endpoint** को अपने webhook URL पर सेट करें:
   - Production: `https://your-domain.com/api/messages`
   - Local dev: tunnel उपयोग करें (नीचे [Local Development](#local-development-tunneling) देखें)

### चरण 4: Teams Channel enable करें

1. Azure Bot → **Channels** में
2. **Microsoft Teams** पर क्लिक करें → Configure → Save
3. Terms of Service स्वीकार करें

### चरण 5: Teams App Manifest बनाएँ

- `botId = <App ID>` के साथ एक `bot` entry शामिल करें.
- Scopes: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (personal scope file handling के लिए आवश्यक).
- RSC permissions जोड़ें (देखें [RSC Permissions](#current-teams-rsc-permissions-manifest)).
- icons बनाएँ: `outline.png` (32x32) और `color.png` (192x192).
- तीनों files को साथ zip करें: `manifest.json`, `outline.png`, `color.png`.

### चरण 6: OpenClaw configure करें

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Environment variables: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### चरण 7: Gateway चलाएँ

जब plugin उपलब्ध हो और `msteams` config credentials के साथ मौजूद हो, तो Teams channel अपने-आप शुरू हो जाता है.

</details>

## Federated authentication (certificate plus managed identity)

> 2026.4.11 में जोड़ा गया

प्रोडक्शन deployments के लिए, OpenClaw client secrets के अधिक सुरक्षित विकल्प के रूप में **federated authentication** का समर्थन करता है. दो विधियाँ उपलब्ध हैं:

### विकल्प A: Certificate-based authentication

अपने Entra ID app registration के साथ registered PEM certificate उपयोग करें.

**Setup:**

1. certificate generate करें या प्राप्त करें (private key के साथ PEM format).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → public certificate upload करें.

**Config:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### विकल्प B: Azure Managed Identity

passwordless authentication के लिए Azure Managed Identity उपयोग करें. यह Azure infrastructure (AKS, App Service, Azure VMs) पर deployments के लिए आदर्श है जहाँ managed identity उपलब्ध हो.

**यह कैसे काम करता है:**

1. bot pod/VM के पास managed identity होती है (system-assigned या user-assigned).
2. एक **federated identity credential** managed identity को Entra ID app registration से link करता है.
3. runtime पर, OpenClaw Azure IMDS endpoint (`169.254.169.254`) से tokens प्राप्त करने के लिए `@azure/identity` उपयोग करता है.
4. token bot authentication के लिए Teams SDK को pass किया जाता है.

**Prerequisites:**

- managed identity enabled वाला Azure infrastructure (AKS workload identity, App Service, VM)
- Entra ID app registration पर बनाया गया federated identity credential
- pod/VM से IMDS (`169.254.169.254:80`) तक network access

**Config (system-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**कॉन्फ़िग (उपयोगकर्ता-असाइन की गई मैनेज्ड आइडेंटिटी):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (केवल उपयोगकर्ता-असाइन के लिए)

### AKS वर्कलोड आइडेंटिटी सेटअप

वर्कलोड आइडेंटिटी का उपयोग करने वाले AKS डिप्लॉयमेंट के लिए:

1. अपने AKS क्लस्टर पर **वर्कलोड आइडेंटिटी सक्षम करें**।
2. Entra ID ऐप रजिस्ट्रेशन पर **फेडरेटेड आइडेंटिटी क्रेडेंशियल बनाएं**:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. ऐप क्लाइंट ID के साथ **Kubernetes सेवा खाते को एनोटेट करें**:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. वर्कलोड आइडेंटिटी इंजेक्शन के लिए **पॉड को लेबल करें**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS (`169.254.169.254`) तक **नेटवर्क पहुंच सुनिश्चित करें** - यदि NetworkPolicy का उपयोग कर रहे हैं, तो पोर्ट 80 पर `169.254.169.254/32` तक ट्रैफ़िक की अनुमति देने वाला egress नियम जोड़ें।

### प्रमाणीकरण प्रकार की तुलना

| विधि                 | कॉन्फ़िग                                       | लाभ                                  | कमियां                                  |
| -------------------- | ---------------------------------------------- | ------------------------------------ | --------------------------------------- |
| **क्लाइंट सीक्रेट**  | `appPassword`                                  | सरल सेटअप                            | सीक्रेट रोटेशन आवश्यक, कम सुरक्षित      |
| **सर्टिफ़िकेट**      | `authType: "federated"` + `certificatePath`    | नेटवर्क पर कोई साझा सीक्रेट नहीं     | सर्टिफ़िकेट प्रबंधन का अतिरिक्त बोझ     |
| **मैनेज्ड आइडेंटिटी** | `authType: "federated"` + `useManagedIdentity` | पासवर्ड रहित, प्रबंधित करने को कोई सीक्रेट नहीं | Azure इन्फ्रास्ट्रक्चर आवश्यक |

**डिफ़ॉल्ट व्यवहार:** जब `authType` सेट नहीं होता, OpenClaw डिफ़ॉल्ट रूप से क्लाइंट सीक्रेट प्रमाणीकरण का उपयोग करता है। मौजूदा कॉन्फ़िगरेशन बिना बदलाव के काम करते रहेंगे।

## स्थानीय विकास (टनलिंग)

Teams `localhost` तक नहीं पहुंच सकता। एक स्थायी dev tunnel का उपयोग करें ताकि आपका URL सत्रों के बीच वही रहे:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

विकल्प: `ngrok http 3978` या `tailscale funnel 3978` (URL हर सत्र में बदल सकते हैं)।

यदि आपका tunnel URL बदलता है, तो endpoint अपडेट करें:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Bot का परीक्षण

**डायग्नोस्टिक्स चलाएं:**

```bash
teams app doctor <teamsAppId>
```

एक ही बार में bot रजिस्ट्रेशन, AAD ऐप, manifest और SSO कॉन्फ़िगरेशन की जांच करता है।

**टेस्ट संदेश भेजें:**

1. Teams ऐप इंस्टॉल करें (`teams app get <id> --install-link` से इंस्टॉल लिंक का उपयोग करें)
2. Teams में bot ढूंढें और DM भेजें
3. आने वाली activity के लिए Gateway logs जांचें

## पर्यावरण चर

सभी कॉन्फ़िग कुंजियां इसके बजाय पर्यावरण चरों के माध्यम से सेट की जा सकती हैं:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (वैकल्पिक: `"secret"` या `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (वैकल्पिक, auth के लिए आवश्यक नहीं)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (केवल उपयोगकर्ता-असाइन MI)

## सदस्य जानकारी action

OpenClaw Microsoft Teams के लिए Graph-समर्थित `member-info` action उजागर करता है ताकि agent और automation सीधे Microsoft Graph से channel सदस्य विवरण (प्रदर्शित नाम, ईमेल, भूमिका) resolve कर सकें।

आवश्यकताएं:

- `Member.Read.Group` RSC permission (अनुशंसित manifest में पहले से मौजूद)
- क्रॉस-team lookup के लिए: admin consent के साथ `User.Read.All` Graph Application permission

action `channels.msteams.actions.memberInfo` द्वारा gated है (डिफ़ॉल्ट: Graph credentials उपलब्ध होने पर enabled)।

## इतिहास context

- `channels.msteams.historyLimit` नियंत्रित करता है कि कितने हालिया channel/group संदेश prompt में wrap किए जाते हैं।
- `messages.groupChat.historyLimit` पर fallback करता है। बंद करने के लिए `0` सेट करें (डिफ़ॉल्ट 50)।
- fetch किया गया thread इतिहास sender allowlists (`allowFrom` / `groupAllowFrom`) द्वारा filter किया जाता है, इसलिए thread context seeding में केवल allowed senders के संदेश शामिल होते हैं।
- quoted attachment context (`ReplyTo*`, Teams reply HTML से derived) वर्तमान में जैसा प्राप्त होता है वैसा ही पास किया जाता है।
- दूसरे शब्दों में, allowlists यह gate करती हैं कि agent को कौन trigger कर सकता है; आज केवल विशिष्ट supplemental context paths filter किए जाते हैं।
- DM इतिहास को `channels.msteams.dmHistoryLimit` (user turns) से सीमित किया जा सकता है। प्रति-user overrides: `channels.msteams.dms["<user_id>"].historyLimit`।

## वर्तमान Teams RSC permissions (manifest)

ये हमारे Teams ऐप manifest में **मौजूदा resourceSpecific permissions** हैं। ये केवल उस team/chat के अंदर लागू होते हैं जहां ऐप इंस्टॉल है।

**channels के लिए (team scope):**

- `ChannelMessage.Read.Group` (Application) - @mention के बिना सभी channel messages प्राप्त करें
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**group chats के लिए:**

- `ChatMessage.Read.Chat` (Application) - @mention के बिना सभी group chat messages प्राप्त करें

Teams CLI के माध्यम से RSC permissions जोड़ने के लिए:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## उदाहरण Teams manifest (redacted)

आवश्यक fields के साथ न्यूनतम, मान्य उदाहरण। IDs और URLs बदलें।

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Manifest caveats (आवश्यक fields)

- `bots[].botId` Azure Bot App ID से मेल खाना **अनिवार्य** है।
- `webApplicationInfo.id` Azure Bot App ID से मेल खाना **अनिवार्य** है।
- `bots[].scopes` में वे surfaces शामिल होने चाहिए जिन्हें आप उपयोग करने की योजना बना रहे हैं (`personal`, `team`, `groupChat`)।
- personal scope में file handling के लिए `bots[].supportsFiles: true` आवश्यक है।
- यदि आप channel traffic चाहते हैं, तो `authorization.permissions.resourceSpecific` में channel read/send शामिल होना चाहिए।

### मौजूदा ऐप अपडेट करना

पहले से इंस्टॉल Teams ऐप को अपडेट करने के लिए (उदा., RSC permissions जोड़ने हेतु):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

अपडेट करने के बाद, नई permissions लागू करने के लिए हर team में ऐप फिर से इंस्टॉल करें, और cached app metadata साफ़ करने के लिए **Teams को पूरी तरह quit करके फिर से launch करें** (सिर्फ window बंद न करें)।

<details>
<summary>मैनुअल manifest अपडेट (CLI के बिना)</summary>

1. अपने `manifest.json` को नई settings के साथ अपडेट करें
2. **`version` field increment करें** (उदा., `1.0.0` → `1.1.0`)
3. icons (`manifest.json`, `outline.png`, `color.png`) के साथ manifest को **फिर से zip करें**
4. नया zip upload करें:
   - **Teams Admin Center:** Teams apps → Manage apps → अपना ऐप ढूंढें → Upload new version
   - **Sideload:** Teams में → Apps → Manage your apps → Upload a custom app

</details>

## क्षमताएं: केवल RSC बनाम Graph

### **केवल Teams RSC** के साथ (ऐप इंस्टॉल, कोई Graph API permissions नहीं)

काम करता है:

- channel message **text** content पढ़ना।
- channel message **text** content भेजना।
- **personal (DM)** file attachments प्राप्त करना।

काम नहीं करता:

- Channel/group **image या file contents** (payload में केवल HTML stub शामिल होता है)।
- SharePoint/OneDrive में stored attachments download करना।
- message history पढ़ना (live webhook event से आगे)।

### **Teams RSC + Microsoft Graph Application permissions** के साथ

जोड़ता है:

- hosted contents download करना (messages में paste की गई images)।
- SharePoint/OneDrive में stored file attachments download करना।
- Graph के माध्यम से channel/chat message history पढ़ना।

### RSC बनाम Graph API

| क्षमता                 | RSC Permissions      | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **रीयल-time messages** | हां (webhook के माध्यम से) | नहीं (केवल polling)                 |
| **ऐतिहासिक messages** | नहीं                 | हां (history query कर सकते हैं)     |
| **Setup complexity**   | केवल app manifest    | admin consent + token flow आवश्यक   |
| **offline काम करता है** | नहीं (चलना जरूरी)   | हां (कभी भी query करें)             |

**मुख्य बात:** RSC real-time listening के लिए है; Graph API historical access के लिए है। offline रहते हुए missed messages catch up करने के लिए, आपको `ChannelMessage.Read.All` के साथ Graph API चाहिए (admin consent आवश्यक)।

## Graph-enabled media + history (channels के लिए आवश्यक)

यदि आपको **channels** में images/files चाहिए या आप **message history** fetch करना चाहते हैं, तो आपको Microsoft Graph permissions सक्षम करनी होंगी और admin consent देना होगा।

1. Entra ID (Azure AD) **App Registration** में, Microsoft Graph **Application permissions** जोड़ें:
   - `ChannelMessage.Read.All` (channel attachments + history)
   - `Chat.Read.All` या `ChatMessage.Read.All` (group chats)
2. tenant के लिए **admin consent grant करें**।
3. Teams app **manifest version** bump करें, re-upload करें, और **Teams में ऐप reinstall करें**।
4. cached app metadata साफ़ करने के लिए **Teams को पूरी तरह quit करके relaunch करें**।

**user mentions के लिए अतिरिक्त permission:** conversation में मौजूद users के लिए User @mentions अपने आप काम करते हैं। हालांकि, यदि आप उन users को dynamically search और mention करना चाहते हैं जो **current conversation में नहीं हैं**, तो `User.Read.All` (Application) permission जोड़ें और admin consent grant करें।

## ज्ञात सीमाएं

### Webhook timeouts

Teams HTTP webhook के माध्यम से messages deliver करता है। यदि processing में बहुत अधिक समय लगता है (उदा., धीमे LLM responses), तो आपको ये दिख सकते हैं:

- Gateway timeouts
- Teams द्वारा message retry करना (duplicates पैदा करते हुए)
- replies drop होना

OpenClaw इसे जल्दी लौटकर और सक्रिय रूप से जवाब भेजकर संभालता है, लेकिन बहुत धीमी प्रतिक्रियाएं फिर भी समस्याएं पैदा कर सकती हैं।

### Teams क्लाउड और सेवा URL समर्थन

यह SDK-समर्थित Teams पथ Microsoft Teams सार्वजनिक क्लाउड के लिए लाइव-सत्यापित है।

इनबाउंड जवाब आने वाले Teams SDK टर्न कॉन्टेक्स्ट का उपयोग करते हैं। कॉन्टेक्स्ट से बाहर की सक्रिय कार्रवाइयां - भेजना, संपादन, हटाना, कार्ड, पोल, फ़ाइल-सहमति संदेश, और कतारबद्ध लंबे समय तक चलने वाले जवाब - संग्रहीत बातचीत संदर्भ `serviceUrl` का उपयोग करती हैं। सार्वजनिक क्लाउड डिफ़ॉल्ट रूप से Teams SDK सार्वजनिक क्लाउड परिवेश का उपयोग करता है और सार्वजनिक Teams Connector होस्ट पर संग्रहीत संदर्भों की अनुमति देता है: `https://smba.trafficmanager.net/`.

सार्वजनिक क्लाउड डिफ़ॉल्ट है। सामान्य सार्वजनिक-क्लाउड बॉट्स के लिए आपको `channels.msteams.cloud` या `channels.msteams.serviceUrl` सेट करने की आवश्यकता नहीं है।

गैर-सार्वजनिक Teams क्लाउड के लिए, जब Microsoft कोई प्रकाशित करे, तो `cloud` और मिलती-जुलती सक्रिय सीमा सेट करें:

- `channels.msteams.cloud` प्रमाणीकरण, JWT सत्यापन, टोकन सेवाओं, और Graph स्कोप के लिए Teams SDK क्लाउड प्रीसेट चुनता है।
- `channels.msteams.serviceUrl` सक्रिय भेजने, संपादन, हटाने, कार्ड, पोल, फ़ाइल-सहमति संदेशों, और कतारबद्ध लंबे समय तक चलने वाले जवाबों से पहले संग्रहीत बातचीत संदर्भों को सत्यापित करने के लिए उपयोग की जाने वाली Bot Connector एंडपॉइंट सीमा चुनता है। यह USGov और DoD SDK क्लाउड के लिए आवश्यक है। China/21Vianet के लिए, OpenClaw SDK `China` प्रीसेट का उपयोग करता है और केवल Azure China Bot Framework चैनल होस्ट पर संग्रहीत/कॉन्फ़िगर किए गए सेवा URL स्वीकार करता है।

Microsoft Teams सक्रिय मैसेजिंग दस्तावेज़ों के [बातचीत बनाएं](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) अनुभाग में वैश्विक सक्रिय Bot Connector एंडपॉइंट प्रकाशित करता है। उपलब्ध होने पर आने वाली गतिविधि का `serviceUrl` उपयोग करें; यदि आपको वैश्विक सक्रिय एंडपॉइंट चाहिए, तो Microsoft की तालिका का उपयोग करें।

| Teams परिवेश | OpenClaw कॉन्फ़िग                                             | सक्रिय `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | कोई cloud/serviceUrl कॉन्फ़िग आवश्यक नहीं                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | `serviceUrl` सेट करें; अलग Teams SDK क्लाउड प्रीसेट मौजूद नहीं है | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | आने वाली गतिविधि का `serviceUrl` उपयोग करें           |

GCC के लिए उदाहरण, जहां Microsoft एक अलग सक्रिय सेवा URL दस्तावेजीकृत करता है लेकिन Teams SDK अलग GCC क्लाउड प्रीसेट उजागर नहीं करता:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

GCC High के लिए उदाहरण:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` समर्थित Microsoft Teams Bot Connector होस्ट तक सीमित है। जब कोई सेवा URL कॉन्फ़िगर किया जाता है, तो OpenClaw सक्रिय भेजने, संपादन, हटाने, कार्ड, पोल, या कतारबद्ध लंबे समय तक चलने वाले जवाब चलने से पहले जांचता है कि संग्रहीत बातचीत `serviceUrl` वही होस्ट उपयोग करता है। डिफ़ॉल्ट सार्वजनिक-क्लाउड कॉन्फ़िग के साथ, यदि कोई संग्रहीत बातचीत सार्वजनिक Teams Connector होस्ट के बाहर इंगित करती है, तो OpenClaw बंद होकर विफल होता है। क्लाउड/सेवा URL सेटिंग बदलने के बाद बातचीत से एक नया संदेश प्राप्त करें ताकि संग्रहीत बातचीत संदर्भ वर्तमान रहे।

Microsoft की Teams सक्रिय एंडपॉइंट तालिका में China/21Vianet के लिए अलग वैश्विक सक्रिय `smba` URL नहीं है। `cloud: "China"` कॉन्फ़िगर करें ताकि Teams SDK Azure China प्रमाणीकरण, टोकन, और JWT एंडपॉइंट का उपयोग करे। फिर सक्रिय भेजने के लिए आने वाली China Teams गतिविधि से संग्रहीत बातचीत संदर्भ, या Azure China Bot Framework चैनल सीमा (`*.botframework.azure.cn`) पर स्पष्ट रूप से कॉन्फ़िगर किया गया सेवा URL आवश्यक है। Graph-समर्थित Teams सहायक वर्तमान में `cloud: "China"` के लिए अक्षम हैं, जब तक OpenClaw Graph अनुरोधों को Azure China Graph एंडपॉइंट के माध्यम से रूट नहीं करता।

### फ़ॉर्मैटिंग

Teams markdown Slack या Discord की तुलना में अधिक सीमित है:

- बुनियादी फ़ॉर्मैटिंग काम करती है: **bold**, _italic_, `code`, लिंक
- जटिल markdown (तालिकाएं, नेस्टेड सूचियां) सही ढंग से रेंडर नहीं हो सकते
- Adaptive Cards पोल और सिमैंटिक प्रस्तुति भेजने के लिए समर्थित हैं (नीचे देखें)

## कॉन्फ़िगरेशन

मुख्य सेटिंग्स (साझा channel पैटर्न के लिए `/gateway/configuration` देखें):

- `channels.msteams.enabled`: channel को सक्षम/अक्षम करें।
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: बॉट क्रेडेंशियल।
- `channels.msteams.cloud`: Teams SDK cloud environment (`Public`, `USGov`, `USGovDoD`, या `China`; डिफ़ॉल्ट `Public`)। USGov/DoD SDK clouds के लिए इसे `serviceUrl` के साथ सेट करें; China, SDK preset और संग्रहीत Azure China Bot Framework conversation references का उपयोग करता है, और Graph-backed helpers तब तक अक्षम रहते हैं जब तक Azure China Graph routing लागू नहीं हो जाती।
- `channels.msteams.serviceUrl`: SDK proactive operations के लिए Bot Connector service URL boundary। Public cloud SDK डिफ़ॉल्ट का उपयोग करता है; इसे GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High, या DoD के लिए सेट करें। China, Azure China Bot Framework channel hosts स्वीकार करता है जब संग्रहीत conversation reference 21Vianet द्वारा संचालित Teams से आता है।
- `channels.msteams.webhook.port` (डिफ़ॉल्ट `3978`)
- `channels.msteams.webhook.path` (डिफ़ॉल्ट `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट: pairing)
- `channels.msteams.allowFrom`: DM अनुमति-सूची (AAD object IDs अनुशंसित)। Graph access उपलब्ध होने पर सेटअप के दौरान विज़ार्ड नामों को IDs में resolve करता है।
- `channels.msteams.dangerouslyAllowNameMatching`: mutable UPN/display-name matching और सीधे team/channel name routing को फिर से सक्षम करने के लिए आपातकालीन toggle।
- `channels.msteams.textChunkLimit`: outbound text chunk size।
- `channels.msteams.chunkMode`: length chunking से पहले blank lines (paragraph boundaries) पर split करने के लिए `length` (डिफ़ॉल्ट) या `newline`।
- `channels.msteams.mediaAllowHosts`: inbound attachment hosts के लिए अनुमति-सूची (डिफ़ॉल्ट Microsoft/Teams domains)।
- `channels.msteams.mediaAuthAllowHosts`: media retries पर Authorization headers संलग्न करने के लिए अनुमति-सूची (डिफ़ॉल्ट Graph + Bot Framework hosts)।
- `channels.msteams.requireMention`: channels/groups में @mention आवश्यक करें (डिफ़ॉल्ट true)।
- `channels.msteams.replyStyle`: `thread | top-level` ([Reply Style](#reply-style-threads-vs-posts) देखें)।
- `channels.msteams.teams.<teamId>.replyStyle`: प्रति-team override।
- `channels.msteams.teams.<teamId>.requireMention`: प्रति-team override।
- `channels.msteams.teams.<teamId>.tools`: default per-team tool policy overrides (`allow`/`deny`/`alsoAllow`) जो channel override अनुपस्थित होने पर उपयोग होते हैं।
- `channels.msteams.teams.<teamId>.toolsBySender`: default per-team per-sender tool policy overrides (`"*"` wildcard समर्थित)।
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: प्रति-channel override।
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: प्रति-channel override।
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: प्रति-channel tool policy overrides (`allow`/`deny`/`alsoAllow`)।
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: प्रति-channel per-sender tool policy overrides (`"*"` wildcard समर्थित)।
- `toolsBySender` keys को स्पष्ट prefixes का उपयोग करना चाहिए:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (legacy unprefixed keys अभी भी केवल `id:` पर map होते हैं)।
- `channels.msteams.actions.memberInfo`: Graph-backed member info action को सक्षम या अक्षम करें (डिफ़ॉल्ट: Graph credentials उपलब्ध होने पर सक्षम)।
- `channels.msteams.authType`: authentication type - `"secret"` (डिफ़ॉल्ट) या `"federated"`।
- `channels.msteams.certificatePath`: PEM certificate file का path (federated + certificate auth)।
- `channels.msteams.certificateThumbprint`: certificate thumbprint (वैकल्पिक, auth के लिए आवश्यक नहीं)।
- `channels.msteams.useManagedIdentity`: managed identity auth सक्षम करें (federated mode)।
- `channels.msteams.managedIdentityClientId`: user-assigned managed identity के लिए client ID।
- `channels.msteams.sharePointSiteId`: group chats/channels में file uploads के लिए SharePoint site ID ([group chats में files भेजना](#sending-files-in-group-chats) देखें)।

## Routing और sessions

- Session keys standard agent format का पालन करती हैं ([/concepts/session](/hi/concepts/session) देखें):
  - Direct messages मुख्य session साझा करते हैं (`agent:<agentId>:<mainKey>`)।
  - Channel/group messages conversation id का उपयोग करते हैं:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Reply style: threads बनाम posts

Teams ने हाल ही में समान underlying data model पर दो channel UI styles पेश किए हैं:

| Style                    | विवरण                                                   | अनुशंसित `replyStyle` |
| ------------------------ | ------------------------------------------------------- | --------------------- |
| **Posts** (classic)      | Messages cards के रूप में दिखाई देते हैं जिनके नीचे threaded replies होते हैं | `thread` (डिफ़ॉल्ट)   |
| **Threads** (Slack-like) | Messages linear रूप से flow करते हैं, अधिक Slack जैसे   | `top-level`           |

**समस्या:** Teams API यह expose नहीं करता कि कोई channel कौन-सा UI style उपयोग करता है। यदि आप गलत `replyStyle` उपयोग करते हैं:

- Threads-style channel में `thread` → replies असहज रूप से nested दिखाई देते हैं
- Posts-style channel में `top-level` → replies in-thread के बजाय अलग top-level posts के रूप में दिखाई देते हैं

**समाधान:** Channel कैसे set up है, उसके आधार पर प्रति-channel `replyStyle` configure करें:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

### Resolution precedence

जब बॉट किसी channel में reply भेजता है, तो `replyStyle` सबसे specific override से default तक resolve किया जाता है। पहला non-`undefined` value जीतता है:

1. **प्रति-channel** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **प्रति-team** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Implicit default** — `requireMention` से derive किया गया:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

यदि आप explicit `replyStyle` के बिना globally `requireMention: false` सेट करते हैं, तो Posts-style channels में mentions top-level posts के रूप में surface होंगे, भले ही inbound एक thread reply था। अनपेक्षित व्यवहार से बचने के लिए global, team, या channel level पर `replyStyle: "thread"` pin करें।

### Thread context preservation

जब `replyStyle: "thread"` प्रभावी हो और बॉट को channel thread के अंदर से @mentioned किया गया हो, तो OpenClaw original thread root को outbound conversation reference (`19:…@thread.tacv2;messageid=<root>`) से फिर से जोड़ता है ताकि reply उसी thread के अंदर पहुँचे। यह live (in-turn) sends और Bot Framework turn context expire होने के बाद किए गए proactive sends, दोनों पर लागू होता है (जैसे, long-running agents, `mcp__openclaw__message` के माध्यम से queued tool-call replies)।

Thread root stored conversation reference पर संग्रहीत `threadId` से लिया जाता है। पुराने stored references, जो `threadId` से पहले के हैं, `activityId` पर fall back करते हैं (जो भी inbound activity ने आखिरी बार conversation seed किया था), इसलिए मौजूदा deployments re-seed के बिना काम करते रहते हैं।

जब `replyStyle: "top-level"` प्रभावी होता है, तो channel-thread inbound को जानबूझकर नए top-level पोस्ट के रूप में उत्तर दिया जाता है — कोई thread suffix नहीं जोड़ा जाता। Threads-शैली चैनलों के लिए यही सही व्यवहार है; अगर आपको threaded replies की अपेक्षा थी लेकिन top-level पोस्ट दिख रहे हैं, तो उस चैनल के लिए आपका `replyStyle` गलत सेट है।

## अटैचमेंट और इमेज

**वर्तमान सीमाएँ:**

- **DMs:** इमेज और फ़ाइल अटैचमेंट Teams bot file APIs के ज़रिए काम करते हैं।
- **चैनल/ग्रुप:** अटैचमेंट M365 storage (SharePoint/OneDrive) में रहते हैं। Webhook payload में केवल HTML stub शामिल होता है, वास्तविक फ़ाइल bytes नहीं। चैनल अटैचमेंट डाउनलोड करने के लिए **Graph API permissions आवश्यक हैं**।
- स्पष्ट file-first sends के लिए, `media` / `filePath` / `path` के साथ `action=upload-file` का उपयोग करें; वैकल्पिक `message` साथ का टेक्स्ट/कमेंट बन जाता है, और `filename` अपलोड किए गए नाम को override करता है।

Graph permissions के बिना, इमेज वाले चैनल संदेश text-only के रूप में प्राप्त होंगे (इमेज सामग्री bot के लिए उपलब्ध नहीं होती)।
डिफ़ॉल्ट रूप से, OpenClaw केवल Microsoft/Teams hostnames से media डाउनलोड करता है। `channels.msteams.mediaAllowHosts` से override करें (किसी भी host को allow करने के लिए `["*"]` का उपयोग करें)।
Authorization headers केवल `channels.msteams.mediaAuthAllowHosts` में मौजूद hosts के लिए जोड़े जाते हैं (डिफ़ॉल्ट Graph + Bot Framework hosts हैं)। इस सूची को सख्त रखें (multi-tenant suffixes से बचें)।

## ग्रुप चैट में फ़ाइलें भेजना

Bots DMs में FileConsentCard flow (built-in) का उपयोग करके फ़ाइलें भेज सकते हैं। हालांकि, **ग्रुप चैट/चैनलों में फ़ाइलें भेजने** के लिए अतिरिक्त सेटअप आवश्यक है:

| संदर्भ                  | फ़ाइलें कैसे भेजी जाती हैं                           | आवश्यक सेटअप                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → user accepts → bot uploads | बिना अतिरिक्त सेटअप के काम करता है                            |
| **ग्रुप चैट/चैनल** | SharePoint पर अपलोड → share link            | `sharePointSiteId` + Graph permissions आवश्यक |
| **इमेज (कोई भी संदर्भ)** | Base64-encoded inline                        | बिना अतिरिक्त सेटअप के काम करता है                            |

### ग्रुप चैट को SharePoint की आवश्यकता क्यों होती है

Bots के पास personal OneDrive drive नहीं होती (`/me/drive` Graph API endpoint application identities के लिए काम नहीं करता)। ग्रुप चैट/चैनलों में फ़ाइलें भेजने के लिए, bot **SharePoint site** पर अपलोड करता है और sharing link बनाता है।

### सेटअप

1. Entra ID (Azure AD) → App Registration में **Graph API permissions जोड़ें**:
   - `Sites.ReadWrite.All` (Application) - SharePoint पर फ़ाइलें अपलोड करें
   - `Chat.Read.All` (Application) - वैकल्पिक, per-user sharing links सक्षम करता है

2. tenant के लिए **admin consent प्रदान करें**।

3. **अपना SharePoint site ID प्राप्त करें:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw कॉन्फ़िगर करें:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Sharing व्यवहार

| Permission                              | Sharing व्यवहार                                          |
| --------------------------------------- | --------------------------------------------------------- |
| केवल `Sites.ReadWrite.All`              | पूरे संगठन के लिए sharing link (org में कोई भी access कर सकता है) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Per-user sharing link (केवल chat members access कर सकते हैं)      |

Per-user sharing अधिक सुरक्षित है क्योंकि केवल chat participants फ़ाइल access कर सकते हैं। अगर `Chat.Read.All` permission गायब है, तो bot organization-wide sharing पर fallback करता है।

### Fallback व्यवहार

| परिदृश्य                                          | परिणाम                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Group chat + file + `sharePointSiteId` configured | SharePoint पर अपलोड करें, sharing link भेजें            |
| Group chat + file + no `sharePointSiteId`         | OneDrive upload का प्रयास करें (विफल हो सकता है), केवल टेक्स्ट भेजें |
| Personal chat + file                              | FileConsentCard flow (SharePoint के बिना काम करता है)    |
| Any context + image                               | Base64-encoded inline (SharePoint के बिना काम करता है)   |

### फ़ाइलों का संग्रहीत स्थान

अपलोड की गई फ़ाइलें configured SharePoint site की default document library में `/OpenClawShared/` फ़ोल्डर में संग्रहीत होती हैं।

## Polls (Adaptive Cards)

OpenClaw Teams polls को Adaptive Cards के रूप में भेजता है (native Teams poll API नहीं है)।

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Votes को gateway द्वारा OpenClaw plugin-state SQLite में `state/openclaw.sqlite` के अंतर्गत रिकॉर्ड किया जाता है।
- मौजूदा `msteams-polls.json` फ़ाइलें `openclaw doctor --fix` द्वारा import की जाती हैं, running plugin द्वारा नहीं।
- Votes रिकॉर्ड करने के लिए gateway को online रहना चाहिए।
- Polls अभी result summaries auto-post नहीं करते, और अभी कोई supported poll-results CLI नहीं है।

## Presentation cards

`message` tool, CLI, या सामान्य reply delivery का उपयोग करके Teams users या conversations को semantic presentation payloads भेजें। OpenClaw generic presentation contract से उन्हें Teams Adaptive Cards के रूप में render करता है।

`presentation` parameter semantic blocks स्वीकार करता है। जब `presentation` दिया जाता है, तो message text वैकल्पिक होता है। Buttons Adaptive Card submit या URL actions के रूप में render होते हैं। Select menus अभी Teams renderer में native नहीं हैं, इसलिए OpenClaw delivery से पहले उन्हें readable text में downgrade करता है।

**Agent tool:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Target format details के लिए, नीचे [Target formats](#target-formats) देखें।

## Target formats

MSTeams targets users और conversations में अंतर करने के लिए prefixes का उपयोग करते हैं:

| Target type         | Format                           | उदाहरण                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| User (ID से)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| User (नाम से)      | `user:<display-name>`            | `user:John Smith` (Graph API आवश्यक)              |
| Group/channel       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Group/channel (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (अगर `@thread` शामिल है) |

**CLI उदाहरण:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Agent tool उदाहरण:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
`user:` prefix के बिना, names डिफ़ॉल्ट रूप से group या team resolution पर जाते हैं। display name से लोगों को target करते समय हमेशा `user:` का उपयोग करें।
</Note>

## Proactive messaging

- Proactive messages केवल **तभी** संभव हैं जब user ने interact किया हो, क्योंकि उस समय हम conversation references संग्रहीत करते हैं।
- `dmPolicy` और allowlist gating के लिए `/gateway/configuration` देखें।

## Team और Channel IDs (सामान्य Gotcha)

Teams URLs में `groupId` query parameter configuration के लिए उपयोग किया जाने वाला team ID **नहीं** है। इसके बजाय URL path से IDs निकालें:

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Config के लिए:**

- Team key = `/team/` के बाद वाला path segment (URL-decoded, जैसे, `19:Bk4j...@thread.tacv2`; पुराने tenants में `@thread.skype` दिख सकता है, जो भी valid है)
- Channel key = `/channel/` के बाद वाला path segment (URL-decoded)
- OpenClaw routing के लिए `groupId` query parameter को **ignore** करें। यह Microsoft Entra group ID है, incoming Teams activities में उपयोग किया जाने वाला Bot Framework conversation ID नहीं।

## Private channels

Bots को private channels में सीमित support मिलता है:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Bot installation             | हाँ               | सीमित                |
| Real-time messages (webhook) | हाँ               | काम नहीं कर सकता           |
| RSC permissions              | हाँ               | अलग तरह से व्यवहार कर सकता है |
| @mentions                    | हाँ               | अगर bot accessible है   |
| Graph API history            | हाँ               | हाँ (permissions के साथ) |

**अगर private channels काम नहीं करते तो workarounds:**

1. bot interactions के लिए standard channels का उपयोग करें
2. DMs का उपयोग करें - users हमेशा bot को सीधे message कर सकते हैं
3. historical access के लिए Graph API का उपयोग करें (`ChannelMessage.Read.All` आवश्यक)

## Troubleshooting

### सामान्य समस्याएँ

- **चैनलों में इमेज नहीं दिख रहीं:** Graph permissions या admin consent गायब है। Teams app को reinstall करें और Teams को पूरी तरह quit/reopen करें।
- **चैनल में कोई response नहीं:** mentions डिफ़ॉल्ट रूप से आवश्यक हैं; `channels.msteams.requireMention=false` सेट करें या प्रति team/channel configure करें।
- **Version mismatch (Teams अभी भी पुराना manifest दिखाता है):** app को remove + re-add करें और refresh करने के लिए Teams को पूरी तरह quit करें।
- **Webhook से 401 Unauthorized:** Azure JWT के बिना manual testing करते समय अपेक्षित है - इसका मतलब endpoint reachable है लेकिन auth विफल हुआ। ठीक से test करने के लिए Azure Web Chat का उपयोग करें।

### Manifest upload errors

- **"Icon file cannot be empty":** manifest उन icon files को reference करता है जिनका आकार 0 bytes है। valid PNG icons बनाएँ (`outline.png` के लिए 32x32, `color.png` के लिए 192x192)।
- **"webApplicationInfo.Id already in use":** app अभी भी किसी अन्य team/chat में installed है। पहले उसे find और uninstall करें, या propagation के लिए 5-10 मिनट प्रतीक्षा करें।
- **upload पर "Something went wrong":** इसके बजाय [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) के ज़रिए upload करें, browser DevTools (F12) → Network tab खोलें, और वास्तविक error के लिए response body देखें।
- **Sideload विफल हो रहा है:** "Upload a custom app" के बजाय "Upload an app to your org's app catalog" आज़माएँ - यह अक्सर sideload restrictions को bypass कर देता है।

### RSC permissions काम नहीं कर रहीं

1. सत्यापित करें कि `webApplicationInfo.id` आपके बॉट के App ID से बिल्कुल मेल खाता है
2. ऐप को फिर से अपलोड करें और टीम/चैट में फिर से इंस्टॉल करें
3. जांचें कि क्या आपके संगठन के एडमिन ने RSC अनुमतियां ब्लॉक की हैं
4. पुष्टि करें कि आप सही स्कोप का उपयोग कर रहे हैं: टीमों के लिए `ChannelMessage.Read.Group`, ग्रुप चैट के लिए `ChatMessage.Read.Chat`

## संदर्भ

- [Azure Bot बनाएं](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot सेटअप गाइड
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams ऐप बनाएं/प्रबंधित करें
- [Teams ऐप मेनिफेस्ट स्कीमा](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC के साथ चैनल संदेश प्राप्त करें](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC अनुमतियां संदर्भ](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams बॉट फ़ाइल हैंडलिंग](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (चैनल/ग्रुप के लिए Graph आवश्यक है)
- [प्रोएक्टिव मैसेजिंग](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - बॉट प्रबंधन के लिए Teams CLI

## संबंधित

- [चैनल अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग फ्लो
- [ग्रुप](/hi/channels/groups) - ग्रुप चैट व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सेशन रूटिंग
- [सुरक्षा](/hi/gateway/security) - एक्सेस मॉडल और हार्डनिंग
