---
read_when:
    - Microsoft Teams चैनल की सुविधाओं पर काम करना
summary: Microsoft Teams बॉट समर्थन की स्थिति, क्षमताएँ और कॉन्फ़िगरेशन
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T13:21:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

स्थिति: टेक्स्ट + DM अटैचमेंट समर्थित हैं; चैनल/समूह में फ़ाइल भेजने के लिए `sharePointSiteId` + Graph अनुमतियाँ आवश्यक हैं ([समूह चैट में फ़ाइलें भेजना](#sending-files-in-group-chats) देखें)। पोल Adaptive Cards के माध्यम से भेजे जाते हैं। संदेश क्रियाएँ फ़ाइल-प्रथम प्रेषण के लिए स्पष्ट `upload-file` उपलब्ध कराती हैं।

## बंडल किया गया Plugin

Microsoft Teams वर्तमान OpenClaw रिलीज़ में बंडल किए गए Plugin के रूप में आता है; सामान्य पैकेज्ड बिल्ड में अलग से इंस्टॉल करना आवश्यक नहीं है।

किसी पुराने बिल्ड या बंडल किए गए Teams को बाहर रखने वाले कस्टम इंस्टॉल पर, npm पैकेज को सीधे इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/msteams
```

वर्तमान आधिकारिक रिलीज़ टैग का अनुसरण करने के लिए बिना संस्करण वाला पैकेज उपयोग करें। सटीक संस्करण केवल तभी पिन करें, जब आपको पुनरुत्पाद्य इंस्टॉल चाहिए।

स्थानीय चेकआउट (git रेपो से चलाते समय):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) एक ही कमांड में बॉट पंजीकरण, मैनिफ़ेस्ट निर्माण और क्रेडेंशियल जनरेशन संभालता है।

**1. इंस्टॉल और लॉग इन करें**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # सत्यापित करें कि आप लॉग इन हैं और अपने टेनेंट की जानकारी देखें
```

<Note>
Teams CLI अभी प्रीव्यू में है। रिलीज़ के बीच कमांड और फ़्लैग बदल सकते हैं।
</Note>

**2. टनल शुरू करें** (Teams localhost तक नहीं पहुँच सकता)

यदि आवश्यक हो, तो devtunnel CLI इंस्टॉल करें और उसमें प्रमाणीकरण करें ([आरंभ करने की मार्गदर्शिका](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started))।

```bash
# एक बार का सेटअप (सत्रों के बीच स्थायी URL):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# प्रत्येक डेवलपमेंट सत्र:
devtunnel host my-openclaw-bot
# आपका एंडपॉइंट: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` आवश्यक है, क्योंकि Teams devtunnels के साथ प्रमाणीकरण नहीं कर सकता। प्रत्येक आने वाला बॉट अनुरोध फिर भी Teams SDK द्वारा सत्यापित किया जाता है।
</Note>

विकल्प: `ngrok http 3978` या `tailscale funnel 3978` (प्रत्येक सत्र में URL बदल सकते हैं)।

**3. ऐप बनाएँ**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

यह एक Entra ID (Azure AD) एप्लिकेशन बनाता है, क्लाइंट सीक्रेट जनरेट करता है, Teams ऐप मैनिफ़ेस्ट (आइकनों सहित) बनाकर अपलोड करता है, और Teams द्वारा प्रबंधित बॉट पंजीकृत करता है (Azure सदस्यता आवश्यक नहीं)। आउटपुट में `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, और एक **Teams App ID** शामिल होते हैं; यह ऐप को सीधे Teams में इंस्टॉल करने का विकल्प भी देता है।

**4. OpenClaw कॉन्फ़िगर करें**, आउटपुट से मिले क्रेडेंशियल का उपयोग करके:

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

या सीधे एनवायरनमेंट वेरिएबल उपयोग करें: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`।

**5. ऐप को Teams में इंस्टॉल करें**

`teams app create` आपको ऐप इंस्टॉल करने के लिए संकेत देता है; "Install in Teams" चुनें। बाद में इंस्टॉल लिंक पाने के लिए:

```bash
teams app get <teamsAppId> --install-link
```

**6. सत्यापित करें कि सब कुछ काम करता है**

```bash
teams app doctor <teamsAppId>
```

यह बॉट पंजीकरण, AAD ऐप कॉन्फ़िगरेशन, मैनिफ़ेस्ट वैधता और SSO सेटअप पर डायग्नोस्टिक्स चलाता है।

प्रोडक्शन के लिए, क्लाइंट सीक्रेट के बजाय [फ़ेडरेटेड प्रमाणीकरण](#federated-authentication-certificate-plus-managed-identity) (सर्टिफ़िकेट या मैनेज्ड आइडेंटिटी) पर विचार करें।

<Note>
समूह चैट डिफ़ॉल्ट रूप से अवरुद्ध होती हैं (`channels.msteams.groupPolicy: "allowlist"`)। समूह उत्तरों की अनुमति देने के लिए `channels.msteams.groupAllowFrom` सेट करें, या किसी भी सदस्य को अनुमति देने के लिए `groupPolicy: "open"` उपयोग करें (मेंशन आवश्यक रहेगा)।
</Note>

## लक्ष्य

- Teams DM, समूह चैट या चैनलों के माध्यम से OpenClaw से बात करें।
- रूटिंग को नियतात्मक रखें: उत्तर हमेशा उसी चैनल पर वापस जाते हैं जहाँ से वे आए थे।
- डिफ़ॉल्ट रूप से सुरक्षित चैनल व्यवहार रखें (जब तक अन्यथा कॉन्फ़िगर न किया गया हो, मेंशन आवश्यक हैं)।

## कॉन्फ़िगरेशन लेखन

डिफ़ॉल्ट रूप से, Microsoft Teams `/config set|unset` द्वारा ट्रिगर किए गए कॉन्फ़िगरेशन अपडेट लिख सकता है (`commands.config: true` आवश्यक है)।

इससे अक्षम करें:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## अभिगम नियंत्रण (DM + समूह)

**DM अभिगम**

- डिफ़ॉल्ट: `channels.msteams.dmPolicy = "pairing"`। अज्ञात प्रेषकों को स्वीकृति मिलने तक अनदेखा किया जाता है।
- `channels.msteams.allowFrom` में स्थायी AAD ऑब्जेक्ट ID या `accessGroup:core-team` जैसे स्थिर प्रेषक अभिगम समूह उपयोग किए जाने चाहिए।
- अनुमति-सूचियों के लिए UPN/डिस्प्ले-नाम मिलान पर निर्भर न रहें; वे बदल सकते हैं। OpenClaw सीधे नाम मिलान को डिफ़ॉल्ट रूप से अक्षम करता है; इसे सक्षम करने के लिए `channels.msteams.dangerouslyAllowNameMatching: true` उपयोग करें।
- क्रेडेंशियल की अनुमति होने पर विज़ार्ड Microsoft Graph के माध्यम से नामों को ID में बदल सकता है।

**समूह अभिगम**

- डिफ़ॉल्ट: `channels.msteams.groupPolicy = "allowlist"` (जब तक आप `groupAllowFrom` नहीं जोड़ते, अवरुद्ध)। जब `channels.msteams.groupPolicy` सेट न हो, तो `channels.defaults.groupPolicy` साझा डिफ़ॉल्ट को ओवरराइड कर सकता है।
- `channels.msteams.groupAllowFrom` नियंत्रित करता है कि कौन-से प्रेषक या स्थिर प्रेषक अभिगम समूह, समूह चैट/चैनलों में ट्रिगर कर सकते हैं (`channels.msteams.allowFrom` पर फ़ॉलबैक करता है)।
- किसी भी सदस्य को अनुमति देने के लिए `groupPolicy: "open"` सेट करें (डिफ़ॉल्ट रूप से मेंशन अभी भी आवश्यक है)।
- **सभी** चैनलों को अवरुद्ध करने के लिए `channels.msteams.groupPolicy: "disabled"` सेट करें।

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

**टीम + चैनल अनुमति-सूची**

- `channels.msteams.teams` के अंतर्गत टीमों और चैनलों को सूचीबद्ध करके समूह/चैनल उत्तरों का दायरा निर्धारित करें।
- कुंजियों के रूप में Teams लिंक से प्राप्त स्थायी Teams वार्तालाप ID उपयोग करें, बदल सकने वाले डिस्प्ले नाम नहीं ([टीम और चैनल ID](#team-and-channel-ids-common-gotcha) देखें)।
- जब `groupPolicy="allowlist"` और टीमों की अनुमति-सूची मौजूद हो, तो केवल सूचीबद्ध टीमें/चैनल स्वीकार किए जाते हैं (मेंशन आवश्यक है)।
- कॉन्फ़िगरेशन विज़ार्ड `Team/Channel` प्रविष्टियाँ स्वीकार करता है और उन्हें आपके लिए संग्रहीत करता है।
- स्टार्टअप पर, OpenClaw टीम/चैनल और उपयोगकर्ता अनुमति-सूची के नामों को ID में बदलता है (जब Graph अनुमतियाँ इसकी अनुमति देती हैं) और मैपिंग लॉग करता है। जिन नामों को हल नहीं किया जा सकता, उन्हें टाइप किए गए रूप में रखा जाता है, लेकिन `channels.msteams.dangerouslyAllowNameMatching: true` सेट न होने पर रूटिंग के लिए अनदेखा किया जाता है।

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
<summary><strong>मैन्युअल सेटअप (Teams CLI के बिना)</strong></summary>

### यह कैसे काम करता है

1. सुनिश्चित करें कि Microsoft Teams Plugin उपलब्ध है (वर्तमान रिलीज़ में बंडल किया गया है)।
2. एक **Azure Bot** बनाएँ (App ID + सीक्रेट + टेनेंट ID)।
3. नीचे दी गई RSC अनुमतियों सहित, बॉट को संदर्भित करने वाला **Teams ऐप पैकेज** बनाएँ।
4. Teams ऐप को किसी टीम में अपलोड/इंस्टॉल करें (या DM के लिए व्यक्तिगत दायरे में)।
5. `~/.openclaw/openclaw.json` में `msteams` कॉन्फ़िगर करें (या एनवायरनमेंट वेरिएबल उपयोग करें) और Gateway शुरू करें।
6. Gateway डिफ़ॉल्ट रूप से `/api/messages` पर Bot Framework Webhook ट्रैफ़िक सुनता है।

### चरण 1: Azure Bot बनाएँ

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) पर जाएँ
2. **Basics** टैब भरें:

   | फ़ील्ड              | मान                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | आपके बॉट का नाम, उदाहरण के लिए `openclaw-msteams` (अद्वितीय होना चाहिए) |
   | **Subscription**   | अपनी Azure सदस्यता चुनें                           |
   | **Resource group** | नया बनाएँ या मौजूदा उपयोग करें                               |
   | **Pricing tier**   | डेवलपमेंट/परीक्षण के लिए **Free**                                 |
   | **Type of App**    | **Single Tenant** (अनुशंसित; नीचे दिया नोट देखें)          |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
नए मल्टी-टेनेंट बॉट का निर्माण 2025-07-31 के बाद अप्रचलित कर दिया गया था। नए बॉट के लिए **Single Tenant** उपयोग करें।
</Warning>

3. **Review + create** और फिर **Create** पर क्लिक करें (~1-2 मिनट)।

### चरण 2: क्रेडेंशियल प्राप्त करें

1. Azure Bot संसाधन → **Configuration** → **Microsoft App ID** कॉपी करें (आपका `appId`)।
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → **Value** कॉपी करें (आपका `appPassword`)।
3. **Overview** → **Directory (tenant) ID** कॉपी करें (आपका `tenantId`)।

### चरण 3: मैसेजिंग एंडपॉइंट कॉन्फ़िगर करें

1. Azure Bot → **Configuration**।
2. **Messaging endpoint** सेट करें:
   - प्रोडक्शन: `https://your-domain.com/api/messages`
   - स्थानीय डेवलपमेंट: टनल उपयोग करें ([स्थानीय डेवलपमेंट](#local-development-tunneling) देखें)

### चरण 4: Teams चैनल सक्षम करें

1. Azure Bot → **Channels**।
2. **Microsoft Teams** → Configure → Save पर क्लिक करें।
3. सेवा की शर्तें स्वीकार करें।

### चरण 5: Teams ऐप मैनिफ़ेस्ट बनाएँ

- `botId = <App ID>` के साथ एक `bot` प्रविष्टि शामिल करें।
- दायरे: `personal`, `team`, `groupChat`।
- `supportsFiles: true` (व्यक्तिगत-दायरे में फ़ाइल प्रबंधन के लिए आवश्यक)।
- RSC अनुमतियाँ जोड़ें ([RSC अनुमतियाँ](#current-teams-rsc-permissions-manifest) देखें)।
- आइकन बनाएँ: `outline.png` (32x32) और `color.png` (192x192)।
- `manifest.json`, `outline.png`, और `color.png` को एक साथ Zip करें।

### चरण 6: OpenClaw कॉन्फ़िगर करें

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

एनवायरनमेंट वेरिएबल: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`।

### चरण 7: Gateway चलाएँ

जब Plugin उपलब्ध हो और `msteams` कॉन्फ़िगरेशन में क्रेडेंशियल हों, तो Teams चैनल अपने आप शुरू हो जाता है।

</details>

## फ़ेडरेटेड प्रमाणीकरण (सर्टिफ़िकेट और मैनेज्ड आइडेंटिटी)

प्रोडक्शन के लिए, OpenClaw `channels.msteams.authType: "federated"` के माध्यम से क्लाइंट सीक्रेट के विकल्प के रूप में **फ़ेडरेटेड प्रमाणीकरण** का समर्थन करता है। इसके दो तरीके हैं:

### विकल्प A: सर्टिफ़िकेट-आधारित प्रमाणीकरण

अपने Entra ID ऐप पंजीकरण के साथ पंजीकृत PEM सर्टिफ़िकेट उपयोग करें।

**सेटअप:**

1. एक सर्टिफ़िकेट जनरेट या प्राप्त करें (प्राइवेट कुंजी सहित PEM फ़ॉर्मैट)।
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → सार्वजनिक सर्टिफ़िकेट अपलोड करें।

**कॉन्फ़िगरेशन:**

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

**एनवायरनमेंट वेरिएबल:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### विकल्प B: Azure Managed Identity

Azure इंफ़्रास्ट्रक्चर (AKS, App Service, Azure VM) पर पासवर्ड-रहित प्रमाणीकरण के लिए Azure Managed Identity उपयोग करें।

**यह कैसे काम करता है:**

1. बॉट पॉड/VM की एक मैनेज्ड आइडेंटिटी होती है (सिस्टम या उपयोगकर्ता द्वारा असाइन की गई)।
2. फ़ेडरेटेड आइडेंटिटी क्रेडेंशियल, मैनेज्ड आइडेंटिटी को Entra ID ऐप पंजीकरण से जोड़ता है।
3. रनटाइम पर, OpenClaw Azure IMDS एंडपॉइंट से टोकन प्राप्त करने के लिए `@azure/identity` उपयोग करता है।
4. बॉट प्रमाणीकरण के लिए टोकन Teams SDK को दिया जाता है।

**पूर्वापेक्षाएँ:**

- प्रबंधित पहचान सक्षम वाला Azure अवसंरचना (AKS वर्कलोड पहचान, App Service, VM)।
- Entra ID ऐप पंजीकरण पर फ़ेडरेटेड पहचान क्रेडेंशियल बनाया गया।
- पॉड/VM से IMDS (`169.254.169.254:80`) तक नेटवर्क पहुँच।

**कॉन्फ़िगरेशन (सिस्टम-असाइन की गई प्रबंधित पहचान):**

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

**कॉन्फ़िगरेशन (उपयोगकर्ता-असाइन की गई प्रबंधित पहचान):** ऊपर दिए गए ब्लॉक में `managedIdentityClientId: "<MI_CLIENT_ID>"` जोड़ें।

**पर्यावरण चर:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (केवल उपयोगकर्ता-असाइन की गई)

### AKS वर्कलोड पहचान सेटअप

वर्कलोड पहचान का उपयोग करने वाले AKS परिनियोजनों के लिए:

1. अपने AKS क्लस्टर पर **वर्कलोड पहचान सक्षम करें**।
2. Entra ID ऐप पंजीकरण पर **फ़ेडरेटेड पहचान क्रेडेंशियल बनाएँ**:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. ऐप क्लाइंट ID से **Kubernetes सेवा खाते को एनोटेट करें**:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. वर्कलोड पहचान इंजेक्शन के लिए **पॉड को लेबल करें**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS (`169.254.169.254`) तक **नेटवर्क पहुँच की अनुमति दें**: यदि NetworkPolicy का उपयोग कर रहे हैं, तो पोर्ट 80 पर `169.254.169.254/32` के लिए एक इग्रेस नियम जोड़ें।

### प्रमाणीकरण प्रकार की तुलना

| विधि                  | कॉन्फ़िगरेशन                                  | लाभ                                      | हानियाँ                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **क्लाइंट सीक्रेट**    | `appPassword`                                  | सरल सेटअप                                 | सीक्रेट रोटेशन आवश्यक, कम सुरक्षित             |
| **प्रमाणपत्र**         | `authType: "federated"` + `certificatePath`    | नेटवर्क पर कोई साझा सीक्रेट नहीं           | प्रमाणपत्र प्रबंधन का अतिरिक्त भार              |
| **प्रबंधित पहचान**     | `authType: "federated"` + `useManagedIdentity` | पासवर्ड-रहित, प्रबंधित करने के लिए कोई सीक्रेट नहीं | Azure अवसंरचना आवश्यक                         |

`certificateThumbprint` को `certificatePath` के साथ सेट किया जा सकता है, लेकिन वर्तमान में प्रमाणीकरण पथ इसे नहीं पढ़ता; इसे केवल भविष्य की संगतता के लिए स्वीकार किया जाता है।

**डिफ़ॉल्ट:** जब `authType` सेट नहीं होता, तो OpenClaw क्लाइंट-सीक्रेट प्रमाणीकरण (`appPassword`) का उपयोग करता है। मौजूदा कॉन्फ़िगरेशन बिना किसी बदलाव के काम करते रहते हैं।

## स्थानीय विकास (टनलिंग)

Teams `localhost` तक नहीं पहुँच सकता। एक स्थायी डेवलपमेंट टनल का उपयोग करें, ताकि सत्रों के बीच URL स्थिर रहे:

```bash
# एक बार का सेटअप:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# प्रत्येक डेवलपमेंट सत्र:
devtunnel host my-openclaw-bot
```

विकल्प: `ngrok http 3978` या `tailscale funnel 3978` (प्रत्येक सत्र में URL बदल सकते हैं)।

यदि टनल URL बदलता है, तो एंडपॉइंट अपडेट करें:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## बॉट का परीक्षण

**डायग्नोस्टिक्स चलाएँ:**

```bash
teams app doctor <teamsAppId>
```

एक ही चरण में बॉट पंजीकरण, AAD ऐप, मैनिफ़ेस्ट और SSO कॉन्फ़िगरेशन की जाँच करता है।

**परीक्षण संदेश भेजें:**

1. Teams ऐप इंस्टॉल करें (`teams app get <id> --install-link` से इंस्टॉल लिंक)।
2. Teams में बॉट खोजें और एक DM भेजें।
3. आने वाली गतिविधि के लिए Gateway लॉग जाँचें।

## पर्यावरण चर

इन प्रमाणीकरण-संबंधित कॉन्फ़िगरेशन कुंजियों को `openclaw.json` के बजाय पर्यावरण चरों के माध्यम से सेट किया जा सकता है (अन्य कॉन्फ़िगरेशन कुंजियाँ, जैसे `groupPolicy` या `historyLimit`, केवल कॉन्फ़िगरेशन में सेट की जा सकती हैं):

| पर्यावरण चर                          | कॉन्फ़िगरेशन कुंजी         | टिप्पणियाँ                           |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` या `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | फ़ेडरेटेड + प्रमाणपत्र                |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | स्वीकार्य, प्रमाणीकरण के लिए आवश्यक नहीं |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | फ़ेडरेटेड + प्रबंधित पहचान             |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | केवल उपयोगकर्ता-असाइन की गई प्रबंधित पहचान |

## सदस्य जानकारी कार्रवाई

OpenClaw Microsoft Teams के लिए Graph-समर्थित `member-info` कार्रवाई उपलब्ध कराता है, ताकि एजेंट और स्वचालन किसी कॉन्फ़िगर की गई वार्तालाप के सत्यापित रोस्टर विवरण प्राप्त कर सकें।

आवश्यकताएँ:

- `ChannelSettings.Read.Group` और `TeamMember.Read.Group` RSC अनुमतियाँ (अनुशंसित मैनिफ़ेस्ट में पहले से मौजूद)।

Graph क्रेडेंशियल कॉन्फ़िगर होने पर यह कार्रवाई उपलब्ध रहती है; इसके लिए कोई अलग `channels.msteams.actions.memberInfo` टॉगल नहीं है।
मानक-चैनल लुकअप मेल खाने वाली टीम-रोस्टर पहचान, प्रदर्शन नाम, ईमेल और भूमिकाएँ लौटाते हैं।
वर्तमान DM या समूह चैट में यह कार्रवाई विश्वसनीय प्रेषक की स्थायी उपयोगकर्ता ID लौटा सकती है।
निजी/साझा चैनल और गैर-वर्तमान चैट के सदस्य लुकअप के लिए अतिरिक्त रोस्टर अनुमतियाँ आवश्यक हैं
और डिफ़ॉल्ट अनुमति आधाररेखा उन्हें अस्वीकार कर देती है।

## इतिहास संदर्भ

- `channels.msteams.historyLimit` नियंत्रित करता है कि कितने हालिया चैनल/समूह संदेश प्रॉम्प्ट में समाहित किए जाते हैं। उपलब्ध न होने पर `messages.groupChat.historyLimit` का उपयोग होता है, फिर डिफ़ॉल्ट 50 होता है। अक्षम करने के लिए `0` सेट करें।
- प्राप्त थ्रेड इतिहास को प्रेषक अनुमति-सूचियों (`allowFrom` / `groupAllowFrom`) के आधार पर फ़िल्टर किया जाता है, इसलिए थ्रेड संदर्भ आरंभीकरण में केवल अनुमत प्रेषकों के संदेश शामिल होते हैं।
- उद्धृत अटैचमेंट संदर्भ (उत्तर के अपने अटैचमेंट में Skype Reply-स्कीमा HTML से पार्स किया गया) बिना फ़िल्टर किए भेजा जाता है; वर्तमान में केवल थ्रेड-इतिहास आरंभीकरण पर प्रेषक-अनुमति-सूची फ़िल्टर लागू होता है।
- DM इतिहास को `channels.msteams.dmHistoryLimit` (उपयोगकर्ता टर्न) से सीमित किया जा सकता है। प्रति-उपयोगकर्ता ओवरराइड: `channels.msteams.dms["<user_id>"].historyLimit`।

## वर्तमान Teams RSC अनुमतियाँ (मैनिफ़ेस्ट)

ये हमारे Teams ऐप मैनिफ़ेस्ट में **मौजूदा resourceSpecific अनुमतियाँ** हैं। ये केवल उस टीम/चैट के भीतर लागू होती हैं जहाँ ऐप इंस्टॉल किया गया है।

**चैनलों के लिए (टीम स्कोप):**

- `ChannelMessage.Read.Group` (Application) - @mention के बिना सभी चैनल संदेश प्राप्त करें
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**समूह चैट के लिए:**

- `ChatMessage.Read.Chat` (Application) - @mention के बिना सभी समूह चैट संदेश प्राप्त करें

Teams CLI के माध्यम से RSC अनुमतियाँ जोड़ें:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams मैनिफ़ेस्ट का उदाहरण (संवेदनशील जानकारी हटाई गई)

आवश्यक फ़ील्ड वाला न्यूनतम, मान्य उदाहरण। ID और URL बदलें।

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "आपका संगठन",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "Teams में OpenClaw", full: "Teams में OpenClaw" },
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

### मैनिफ़ेस्ट संबंधी सावधानियाँ (अनिवार्य फ़ील्ड)

- `bots[].botId` का Azure Bot App ID से मेल खाना **अनिवार्य** है।
- `webApplicationInfo.id` का Azure Bot App ID से मेल खाना **अनिवार्य** है।
- `bots[].scopes` में वे सतहें शामिल होनी चाहिए जिनका आप उपयोग करना चाहते हैं (`personal`, `team`, `groupChat`)।
- व्यक्तिगत स्कोप में फ़ाइल प्रबंधन के लिए `bots[].supportsFiles: true` आवश्यक है।
- चैनल ट्रैफ़िक के लिए `authorization.permissions.resourceSpecific` में चैनल पढ़ने/भेजने की अनुमति शामिल होनी चाहिए।

### मौजूदा ऐप अपडेट करना

```bash
# मैनिफ़ेस्ट डाउनलोड करें, संपादित करें और फिर से अपलोड करें
teams app manifest download <teamsAppId> manifest.json
# manifest.json को स्थानीय रूप से संपादित करें...
teams app manifest upload manifest.json <teamsAppId>
# सामग्री बदलने पर संस्करण स्वतः बढ़ जाता है
```

अपडेट करने के बाद, प्रत्येक टीम में ऐप को फिर से इंस्टॉल करें और कैश किया गया ऐप मेटाडेटा साफ़ करने के लिए **Teams को पूरी तरह बंद करके फिर से शुरू करें** (केवल विंडो बंद न करें)।

<details>
<summary>मैन्युअल मैनिफ़ेस्ट अपडेट (CLI के बिना)</summary>

1. नई सेटिंग के साथ `manifest.json` अपडेट करें।
2. **`version` फ़ील्ड बढ़ाएँ** (उदा., `1.0.0` → `1.1.0`)।
3. आइकन सहित मैनिफ़ेस्ट को **फिर से zip करें** (`manifest.json`, `outline.png`, `color.png`)।
4. नई zip फ़ाइल अपलोड करें:
   - **Teams Admin Center:** Teams apps → Manage apps → अपना ऐप खोजें → Upload new version।
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app।

</details>

## क्षमताएँ: केवल RSC बनाम Graph

### **केवल Teams RSC** के साथ (ऐप इंस्टॉल है, Graph API अनुमतियाँ नहीं हैं)

काम करता है:

- चैनल संदेश की **टेक्स्ट** सामग्री पढ़ना।
- चैनल संदेश की **टेक्स्ट** सामग्री भेजना।
- **व्यक्तिगत (DM)** फ़ाइल अटैचमेंट प्राप्त करना।

काम नहीं करता:

- चैनल/समूह की **छवि या फ़ाइल सामग्री** (पेलोड में केवल एक HTML स्टब शामिल होता है)।
- SharePoint/OneDrive में संग्रहीत अटैचमेंट डाउनलोड करना।
- लाइव Webhook ईवेंट से आगे का संदेश इतिहास पढ़ना।

### **Teams RSC + Microsoft Graph Application अनुमतियों** के साथ

ये क्षमताएँ जोड़ता है:

- होस्ट की गई सामग्री डाउनलोड करना (संदेशों में चिपकाई गई छवियाँ)।
- SharePoint/OneDrive में संग्रहीत फ़ाइल अटैचमेंट डाउनलोड करना।
- Graph के माध्यम से चैनल/चैट संदेश इतिहास पढ़ना।

### RSC बनाम Graph API

| क्षमता                    | RSC अनुमतियाँ                | Graph API                                  |
| ------------------------- | ---------------------------- | ------------------------------------------ |
| **रीयल-टाइम संदेश**       | हाँ (Webhook के माध्यम से)   | नहीं (केवल पोलिंग)                         |
| **ऐतिहासिक संदेश**        | नहीं                         | हाँ (इतिहास की क्वेरी की जा सकती है)       |
| **सेटअप की जटिलता**       | केवल ऐप मैनिफ़ेस्ट           | एडमिन सहमति + टोकन फ़्लो आवश्यक            |
| **ऑफ़लाइन काम करता है**   | नहीं (चालू रहना आवश्यक है)   | हाँ (कभी भी क्वेरी करें)                   |

**निष्कर्ष:** RSC रीयल-टाइम में सुनने के लिए है; Graph API ऐतिहासिक पहुँच के लिए है। ऑफ़लाइन रहने के दौरान छूटे संदेश प्राप्त करने के लिए, आपको `ChannelMessage.Read.All` के साथ Graph API की आवश्यकता होती है (एडमिन सहमति आवश्यक है)।

## Graph-सक्षम मीडिया + इतिहास

केवल उन Microsoft Graph ऐप्लिकेशन अनुमतियों को सक्षम करें जो आपके द्वारा उपयोग किए जाने वाले Teams स्कोप और डेटा के लिए आवश्यक हैं:

1. Entra ID (Azure AD) **App Registration** → Graph **Application permissions** जोड़ें:
   - चैनल अटैचमेंट और चैनल इतिहास के लिए `ChannelMessage.Read.All`।
   - ग्रुप-चैट अटैचमेंट और ग्रुप-चैट इतिहास के लिए `Chat.Read.All`।
   - जब अटैचमेंट बाइट्स को SharePoint/OneDrive स्टोरेज से डाउनलोड करना आवश्यक हो, तब `Files.Read.All`; केवल इतिहास वाले सेटअप में इसकी आवश्यकता नहीं होती।
2. टेनेंट के लिए **Grant admin consent**।
3. Teams ऐप का **मैनिफ़ेस्ट संस्करण** बढ़ाएँ, दोबारा अपलोड करें और **Teams में ऐप को फिर से इंस्टॉल करें**।
4. कैश किया गया ऐप मेटाडेटा साफ़ करने के लिए **Teams को पूरी तरह बंद करके फिर से शुरू करें**।

### चैनल/ग्रुप फ़ाइल पुनर्प्राप्ति (`graphMediaFallback`)

Teams किसी बॉट को भेजी गई HTML गतिविधि से फ़ाइल मार्कर हटा सकता है। उस स्थिति में, Bot Framework गतिविधि को किसी सामान्य HTML संदेश से अलग नहीं किया जा सकता; पूरा अटैचमेंट संदर्भ केवल संदेश की Graph कॉपी में मौजूद होता है।

ऊपर दी गई अनुमतियाँ प्रदान करने के बाद फ़ॉलबैक सक्षम करें:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

यह केवल चैनलों और ग्रुप चैट पर लागू होता है। जब भी किसी HTML गतिविधि से सीधे डाउनलोड किया जा सकने वाला कोई मीडिया प्राप्त नहीं होता, यह एक Graph संदेश लुकअप जोड़ता है, जिसमें सामान्य या केवल उल्लेख वाले संदेश भी शामिल हैं। डिफ़ॉल्ट `false` है, ताकि मौजूदा इंस्टॉलेशन में अतिरिक्त Graph ट्रैफ़िक या अनुमति संबंधी त्रुटियाँ स्वतः उत्पन्न न हों।

**उपयोगकर्ता उल्लेख:** बातचीत में पहले से शामिल उपयोगकर्ताओं के लिए @mentions बिना किसी अतिरिक्त सेटअप के काम करते हैं। **वर्तमान बातचीत में शामिल नहीं** उपयोगकर्ताओं को डायनेमिक रूप से खोजने और उनका उल्लेख करने के लिए, `User.Read.All` (Application) अनुमति जोड़ें और एडमिन सहमति प्रदान करें।

## ज्ञात सीमाएँ

### Webhook टाइमआउट

Teams संदेशों को HTTP Webhook के माध्यम से डिलीवर करता है। OpenClaw उस Webhook लिसनर पर निश्चित HTTP सर्वर टाइमआउट लागू करता है: निष्क्रियता के लिए 30s, कुल अनुरोध के लिए 30s और हेडर प्राप्त करने के लिए 15s। वैकल्पिक इनबाउंड मीडिया और संदर्भ संवर्धन के लिए साझा 10-सेकंड का बजट होता है, लेकिन Teams SDK फिर भी Webhook प्रतिक्रिया लौटाने से पहले एजेंट टर्न की प्रतीक्षा करता है। यदि पूरा टर्न Teams की पुनः प्रयास विंडो से अधिक समय लेता है, तो आपको ये दिखाई दे सकते हैं:

- Teams द्वारा संदेश का पुनः प्रयास (जिससे डुप्लिकेट बनते हैं)।
- छूटे हुए उत्तर।

एजेंट के जवाब देते ही उत्तर सक्रिय रूप से भेजे जाते हैं, लेकिन धीमे एजेंट रन के कारण Teams की ओर फिर भी पुनः प्रयास या डुप्लिकेट दिखाई दे सकते हैं।

### Teams क्लाउड और सर्विस URL समर्थन

यह SDK-समर्थित Teams पथ Microsoft Teams सार्वजनिक क्लाउड के लिए लाइव-सत्यापित है।

इनबाउंड उत्तर आने वाले Teams SDK टर्न संदर्भ का उपयोग करते हैं। संदर्भ से बाहर के सक्रिय ऑपरेशन—भेजना, संपादित करना, हटाना, कार्ड, पोल, फ़ाइल-सहमति संदेश और कतारबद्ध लंबे समय तक चलने वाले उत्तर—संग्रहीत बातचीत संदर्भ `serviceUrl` का उपयोग करते हैं। सार्वजनिक क्लाउड डिफ़ॉल्ट रूप से Teams SDK के सार्वजनिक क्लाउड परिवेश का उपयोग करता है और सार्वजनिक Teams Connector होस्ट पर संग्रहीत संदर्भों की अनुमति देता है: `https://smba.trafficmanager.net/`।

सार्वजनिक क्लाउड डिफ़ॉल्ट है। सामान्य सार्वजनिक-क्लाउड बॉट के लिए आपको `channels.msteams.cloud` या `channels.msteams.serviceUrl` सेट करने की आवश्यकता नहीं है।

गैर-सार्वजनिक Teams क्लाउड के लिए, `cloud` और Microsoft द्वारा प्रकाशित किए जाने पर उससे मेल खाने वाली सक्रिय सीमा सेट करें:

- `channels.msteams.cloud` प्रमाणीकरण, JWT सत्यापन, टोकन सेवाओं और Graph स्कोप के लिए Teams SDK क्लाउड प्रीसेट चुनता है।
- `channels.msteams.serviceUrl` सक्रिय रूप से भेजने, संपादित करने, हटाने, कार्ड, पोल, फ़ाइल-सहमति संदेश और कतारबद्ध लंबे समय तक चलने वाले उत्तरों से पहले संग्रहीत बातचीत संदर्भों को सत्यापित करने के लिए उपयोग की जाने वाली Bot Connector एंडपॉइंट सीमा चुनता है। यह USGov और DoD SDK क्लाउड के लिए आवश्यक है। China/21Vianet के लिए, OpenClaw SDK के `China` प्रीसेट का उपयोग करता है और संग्रहीत/कॉन्फ़िगर किए गए सर्विस URL को केवल Azure China Bot Framework चैनल होस्ट पर स्वीकार करता है।

Microsoft, Teams सक्रिय संदेश सेवा दस्तावेज़ों के [बातचीत बनाएँ](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) अनुभाग में वैश्विक सक्रिय Bot Connector एंडपॉइंट प्रकाशित करता है। उपलब्ध होने पर आने वाली गतिविधि के `serviceUrl` का उपयोग करें; अन्यथा नीचे दी गई Microsoft की तालिका का उपयोग करें।

| Teams परिवेश    | OpenClaw कॉन्फ़िगरेशन                                              | सक्रिय `serviceUrl`                                  |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| सार्वजनिक        | किसी cloud/serviceUrl कॉन्फ़िगरेशन की आवश्यकता नहीं               | `https://smba.trafficmanager.net/teams`                                         |
| GCC              | `serviceUrl` सेट करें; अलग Teams SDK क्लाउड प्रीसेट मौजूद नहीं है | `https://smba.infra.gcc.teams.microsoft.com/teams`                                     |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                            | `https://smba.infra.gov.teams.microsoft.us/teams`                                         |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                            | `https://smba.infra.dod.teams.microsoft.us/teams`                                         |
| China/21Vianet   | `cloud: "China"`                                                  | आने वाली गतिविधि के `serviceUrl` का उपयोग करें       |

GCC के लिए उदाहरण, जहाँ Microsoft एक अलग सक्रिय सर्विस URL का दस्तावेज़ीकरण करता है, लेकिन Teams SDK कोई अलग GCC क्लाउड प्रीसेट उपलब्ध नहीं कराता:

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

`channels.msteams.serviceUrl` समर्थित Microsoft Teams Bot Connector होस्ट तक सीमित है। जब कोई सर्विस URL कॉन्फ़िगर किया जाता है, तब सक्रिय रूप से भेजने, संपादित करने, हटाने, कार्ड, पोल या कतारबद्ध लंबे समय तक चलने वाले उत्तर चलाने से पहले OpenClaw जाँचता है कि संग्रहीत बातचीत का `serviceUrl` उसी होस्ट का उपयोग करता है। डिफ़ॉल्ट सार्वजनिक-क्लाउड कॉन्फ़िगरेशन के साथ, यदि कोई संग्रहीत बातचीत सार्वजनिक Teams Connector होस्ट के बाहर इंगित करती है, तो OpenClaw सुरक्षित रूप से विफल हो जाता है। cloud/service URL सेटिंग बदलने के बाद बातचीत से एक नया संदेश प्राप्त करें, ताकि संग्रहीत बातचीत संदर्भ वर्तमान रहे।

Microsoft की Teams सक्रिय एंडपॉइंट तालिका में China/21Vianet के लिए कोई अलग वैश्विक सक्रिय `smba` URL नहीं है। `cloud: "China"` कॉन्फ़िगर करें, ताकि Teams SDK Azure China प्रमाणीकरण, टोकन और JWT एंडपॉइंट का उपयोग करे। इसके बाद सक्रिय प्रेषण के लिए आने वाली China Teams गतिविधि से प्राप्त संग्रहीत बातचीत संदर्भ या Azure China Bot Framework चैनल सीमा (`*.botframework.azure.cn`) पर स्पष्ट रूप से कॉन्फ़िगर किया गया सर्विस URL आवश्यक होता है। `cloud: "China"` के लिए Graph-समर्थित Teams सहायक तब तक अक्षम रहते हैं, जब तक OpenClaw Graph अनुरोधों को Azure China Graph एंडपॉइंट के माध्यम से रूट नहीं करता।

### फ़ॉर्मैटिंग

Teams Markdown, Slack या Discord की तुलना में अधिक सीमित है:

- मूल फ़ॉर्मैटिंग काम करती है: **बोल्ड**, _इटैलिक_, `code`, लिंक।
- जटिल Markdown (तालिकाएँ, नेस्टेड सूचियाँ) सही ढंग से रेंडर नहीं हो सकता।
- पोल और सिमेंटिक प्रेज़ेंटेशन प्रेषण के लिए Adaptive Cards समर्थित हैं (नीचे देखें)।

## कॉन्फ़िगरेशन

मुख्य सेटिंग्स (साझा चैनल पैटर्न के लिए [/gateway/configuration](/hi/gateway/configuration) देखें):

- `channels.msteams.enabled`: चैनल को सक्षम/अक्षम करें।
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: बॉट क्रेडेंशियल।
- `channels.msteams.cloud`: Teams SDK क्लाउड परिवेश (`Public`, `USGov`, `USGovDoD`, या `China`; डिफ़ॉल्ट `Public`)। USGov/DoD SDK क्लाउड के लिए `serviceUrl` से सेट करें; China, SDK प्रीसेट और संग्रहीत Azure China Bot Framework वार्तालाप संदर्भों का उपयोग करता है, और Azure China Graph रूटिंग उपलब्ध होने तक Graph-समर्थित सहायक अक्षम रहते हैं।
- `channels.msteams.serviceUrl`: SDK की सक्रिय संचालन कार्रवाइयों के लिए Bot Connector सेवा URL सीमा। सार्वजनिक क्लाउड SDK डिफ़ॉल्ट का उपयोग करता है; GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High, या DoD के लिए इसे सेट करें। जब संग्रहीत वार्तालाप संदर्भ 21Vianet द्वारा संचालित Teams से आता है, तब China, Azure China Bot Framework चैनल होस्ट स्वीकार करता है।
- `channels.msteams.webhook.port` (डिफ़ॉल्ट `3978`)।
- `channels.msteams.webhook.path` (डिफ़ॉल्ट `/api/messages`)।
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट `pairing`)।
- `channels.msteams.allowFrom`: DM अनुमति-सूची (AAD ऑब्जेक्ट ID अनुशंसित)। Graph पहुँच उपलब्ध होने पर विज़ार्ड सेटअप के दौरान नामों को ID में बदलता है।
- `channels.msteams.dangerouslyAllowNameMatching`: परिवर्तनशील UPN/प्रदर्शन-नाम मिलान और सीधे टीम/चैनल नाम रूटिंग को फिर से सक्षम करने के लिए आपातकालीन टॉगल।
- `channels.msteams.textChunkLimit`: वर्णों में आउटबाउंड टेक्स्ट खंड का आकार (डिफ़ॉल्ट `4000`, और अधिक कॉन्फ़िगर किए गए मान के बावजूद अधिकतम `4000` तक सीमित)।
- `channels.msteams.streaming.chunkMode`: लंबाई के अनुसार खंड बनाने से पहले रिक्त पंक्तियों (अनुच्छेद सीमाओं) पर विभाजित करने के लिए `length` (डिफ़ॉल्ट) या `newline`।
- `channels.msteams.mediaAllowHosts`: इनबाउंड अटैचमेंट होस्ट के लिए अनुमति-सूची (डिफ़ॉल्ट रूप से Microsoft/Teams डोमेन: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services)।
- `channels.msteams.mediaAuthAllowHosts`: मीडिया पुनः प्रयासों पर Authorization हेडर जोड़ने के लिए अनुमति-सूची (डिफ़ॉल्ट रूप से Graph + Bot Framework होस्ट)।
- `channels.msteams.graphMediaFallback`: जब चैनल/समूह HTML में फ़ाइल चिह्न न हों, तब Graph संदेश लुकअप के लिए सहमति दें (डिफ़ॉल्ट `false`; [चैनल/समूह फ़ाइल पुनर्प्राप्ति](#channelgroup-file-recovery-graphmediafallback) देखें)।
- `channels.msteams.mediaMaxMb`: MB में प्रति-चैनल मीडिया आकार सीमा ओवरराइड। सेट न होने पर `agents.defaults.mediaMaxMb` का उपयोग किया जाता है।
- `channels.msteams.requireMention`: चैनलों/समूहों में @mention आवश्यक करें (डिफ़ॉल्ट `true`)।
- `channels.msteams.replyStyle`: `thread | top-level` ([उत्तर शैली](#reply-style-threads-vs-posts) देखें)।
- `channels.msteams.teams.<teamId>.replyStyle`: प्रति-टीम ओवरराइड।
- `channels.msteams.teams.<teamId>.requireMention`: प्रति-टीम ओवरराइड।
- `channels.msteams.teams.<teamId>.tools`: चैनल ओवरराइड अनुपलब्ध होने पर उपयोग किए जाने वाले डिफ़ॉल्ट प्रति-टीम टूल नीति ओवरराइड (`allow`/`deny`/`alsoAllow`)।
- `channels.msteams.teams.<teamId>.toolsBySender`: डिफ़ॉल्ट प्रति-टीम, प्रति-प्रेषक टूल नीति ओवरराइड (`"*"` वाइल्डकार्ड समर्थित)।
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: प्रति-चैनल ओवरराइड।
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: प्रति-चैनल ओवरराइड।
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: प्रति-चैनल टूल नीति ओवरराइड (`allow`/`deny`/`alsoAllow`)।
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: प्रति-चैनल, प्रति-प्रेषक टूल नीति ओवरराइड (`"*"` वाइल्डकार्ड समर्थित)।
- `toolsBySender` कुंजियों में स्पष्ट उपसर्ग होने चाहिए: `channel:`, `id:`, `e164:`, `username:`, `name:` (पुरानी उपसर्ग-रहित कुंजियाँ अब भी केवल `id:` पर मैप होती हैं)।
- `channels.msteams.authType`: प्रमाणीकरण प्रकार - `"secret"` (डिफ़ॉल्ट) या `"federated"`।
- `channels.msteams.certificatePath`: PEM प्रमाणपत्र फ़ाइल का पथ (फ़ेडरेटेड + प्रमाणपत्र प्रमाणीकरण)।
- `channels.msteams.certificateThumbprint`: प्रमाणपत्र थंबप्रिंट; स्वीकार्य है, प्रमाणीकरण के लिए आवश्यक नहीं।
- `channels.msteams.useManagedIdentity`: प्रबंधित पहचान प्रमाणीकरण सक्षम करें (फ़ेडरेटेड मोड)।
- `channels.msteams.managedIdentityClientId`: उपयोगकर्ता-असाइन की गई प्रबंधित पहचान के लिए क्लाइंट ID।
- `channels.msteams.sharePointSiteId`: समूह चैट/चैनलों में फ़ाइल अपलोड के लिए SharePoint साइट ID ([समूह चैट में फ़ाइलें भेजना](#sending-files-in-group-chats) देखें)।
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: पहले DM/समूह संपर्क पर दिखाया जाने वाला स्वागत Adaptive Card और उसके सुझाए गए प्रॉम्प्ट बटन।
- `channels.msteams.responsePrefix`: आउटबाउंड उत्तरों के आगे जोड़ा जाने वाला टेक्स्ट।
- `channels.msteams.feedbackEnabled` (डिफ़ॉल्ट `true`), `channels.msteams.feedbackReflection` (डिफ़ॉल्ट `true`), `channels.msteams.feedbackReflectionCooldownMs`: उत्तरों पर थम्स-अप/डाउन फ़ीडबैक और नकारात्मक फ़ीडबैक पर चिंतनशील फ़ॉलो-अप।
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: SSO-समर्थित प्रवाहों के लिए Bot Framework OAuth कनेक्शन और प्रत्यायोजित Graph स्कोप; `sso.enabled: true` के लिए `sso.connectionName` आवश्यक है।

## रूटिंग और सत्र

- सत्र कुंजियाँ मानक एजेंट प्रारूप का पालन करती हैं ([/concepts/session](/hi/concepts/session) देखें):
  - प्रत्यक्ष संदेश मुख्य सत्र (`agent:<agentId>:<mainKey>`) साझा करते हैं।
  - चैनल/समूह संदेश वार्तालाप ID का उपयोग करते हैं:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## उत्तर शैली: थ्रेड बनाम पोस्ट

एक ही अंतर्निहित डेटा मॉडल पर Teams की दो चैनल UI शैलियाँ हैं:

| शैली                    | विवरण                                               | अनुशंसित `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (क्लासिक)      | संदेश कार्ड के रूप में दिखते हैं और उनके नीचे थ्रेडेड उत्तर होते हैं | `thread` (डिफ़ॉल्ट)       |
| **Threads** (Slack-जैसी) | संदेश रैखिक रूप से प्रवाहित होते हैं, कुछ हद तक Slack की तरह                   | `top-level`              |

**समस्या:** Teams API यह प्रदर्शित नहीं करता कि कोई चैनल किस UI शैली का उपयोग करता है। यदि आप गलत `replyStyle` का उपयोग करते हैं:

- Threads-शैली चैनल में `thread` → उत्तर असहज ढंग से नेस्ट किए हुए दिखते हैं।
- Posts-शैली चैनल में `top-level` → उत्तर थ्रेड के भीतर दिखने के बजाय अलग शीर्ष-स्तरीय पोस्ट के रूप में दिखते हैं।

**समाधान:** चैनल के सेटअप के आधार पर प्रत्येक चैनल के लिए `replyStyle` कॉन्फ़िगर करें:

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

### समाधान की प्राथमिकता

जब बॉट किसी चैनल में उत्तर भेजता है, तो `replyStyle` को सबसे विशिष्ट ओवरराइड से लेकर डिफ़ॉल्ट तक क्रमशः हल किया जाता है। पहला गैर-`undefined` मान प्रभावी होता है:

1. **प्रति-चैनल** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **प्रति-टीम** - `channels.msteams.teams.<teamId>.replyStyle`
3. **वैश्विक** - `channels.msteams.replyStyle`
4. **अंतर्निहित डिफ़ॉल्ट** - `requireMention` से व्युत्पन्न:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

यदि आप स्पष्ट `replyStyle` के बिना वैश्विक रूप से `requireMention: false` सेट करते हैं, तो Posts-शैली चैनलों में उल्लेख शीर्ष-स्तरीय पोस्ट के रूप में दिखाई देते हैं, भले ही इनबाउंड संदेश किसी थ्रेड का उत्तर रहा हो। अप्रत्याशित व्यवहार से बचने के लिए वैश्विक, टीम, या चैनल स्तर पर `replyStyle: "thread"` को निश्चित करें।

संग्रहीत चैनल वार्तालाप में सक्रिय रूप से भेजे जाने वाले संदेशों (कतारबद्ध टूल-कॉल उत्तर, लंबे समय तक चलने वाले एजेंट) पर वही टीम/चैनल समाधान लागू होता है; समूह चैट और व्यक्तिगत (DM) वार्तालाप, `replyStyle` की परवाह किए बिना, सक्रिय भेजने के लिए हमेशा `top-level` पर हल होते हैं।

### थ्रेड संदर्भ का संरक्षण

जब `replyStyle: "thread"` प्रभावी हो और बॉट का उल्लेख किसी चैनल थ्रेड के भीतर से किया गया हो, तब OpenClaw मूल थ्रेड रूट को आउटबाउंड वार्तालाप संदर्भ (`19:...@thread.tacv2;messageid=<root>`) से दोबारा जोड़ता है, ताकि उत्तर उसी थ्रेड के भीतर पहुँचे। यह लाइव (टर्न के दौरान) भेजे गए संदेशों और Bot Framework टर्न संदर्भ की समय-सीमा समाप्त होने के बाद सक्रिय रूप से भेजे गए संदेशों, दोनों पर लागू होता है (उदाहरण के लिए, लंबे समय तक चलने वाले एजेंट, `mcp__openclaw__message` के माध्यम से कतारबद्ध टूल-कॉल उत्तर)।

थ्रेड रूट, वार्तालाप संदर्भ पर संग्रहीत `threadId` से लिया जाता है। `threadId` से पहले के पुराने संग्रहीत संदर्भ `activityId` (जिस भी इनबाउंड गतिविधि ने अंतिम बार वार्तालाप को आरंभ किया था) का उपयोग करते हैं, इसलिए मौजूदा परिनियोजन दोबारा आरंभ किए बिना काम करते रहते हैं।

जब `replyStyle: "top-level"` प्रभावी हो, तो चैनल-थ्रेड इनबाउंड का उत्तर जानबूझकर नई शीर्ष-स्तरीय पोस्ट के रूप में दिया जाता है; कोई थ्रेड प्रत्यय नहीं जोड़ा जाता। Threads-शैली चैनलों के लिए यह सही है; जहाँ थ्रेडेड उत्तर अपेक्षित थे वहाँ शीर्ष-स्तरीय पोस्ट दिखाई देने का अर्थ है कि उस चैनल के लिए `replyStyle` गलत सेट है।

## अटैचमेंट और चित्र

**वर्तमान सीमाएँ:**

- **DM:** चित्र और फ़ाइल अटैचमेंट Teams बॉट फ़ाइल API के माध्यम से काम करते हैं।
- **चैनल/समूह:** अटैचमेंट M365 स्टोरेज (SharePoint/OneDrive) में रहते हैं। Webhook पेलोड में केवल एक HTML स्टब शामिल होता है, वास्तविक फ़ाइल बाइट्स नहीं। चैनल अटैचमेंट डाउनलोड करने के लिए **Graph API अनुमतियाँ आवश्यक हैं**।
- स्पष्ट रूप से पहले फ़ाइल भेजने के लिए, `media` / `filePath` / `path` के साथ `action=upload-file` का उपयोग करें; वैकल्पिक `message` साथ भेजा जाने वाला टेक्स्ट/टिप्पणी बन जाता है, और `filename` (या `title`) अपलोड किए गए नाम को ओवरराइड करता है।

Graph अनुमतियों के बिना, चित्रों वाले चैनल संदेश केवल टेक्स्ट के रूप में आते हैं (चित्र की सामग्री बॉट के लिए सुलभ नहीं होती)।
डिफ़ॉल्ट रूप से, OpenClaw केवल Microsoft/Teams होस्टनाम से मीडिया डाउनलोड करता है। `channels.msteams.mediaAllowHosts` से इसे ओवरराइड करें (किसी भी होस्ट को अनुमति देने के लिए `["*"]` का उपयोग करें)।
Authorization हेडर केवल `channels.msteams.mediaAuthAllowHosts` में शामिल होस्ट के लिए जोड़े जाते हैं (डिफ़ॉल्ट रूप से Graph + Bot Framework होस्ट)। इस सूची को सख्त रखें (बहु-टेनेंट प्रत्ययों से बचें)।

## समूह चैट में फ़ाइलें भेजना

बॉट अंतर्निहित FileConsentCard प्रवाह का उपयोग करके DM में फ़ाइलें भेज सकते हैं। **समूह चैट/चैनलों में फ़ाइलें भेजने** के लिए अतिरिक्त सेटअप आवश्यक है:

| संदर्भ                  | फ़ाइलें कैसे भेजी जाती हैं                           | आवश्यक सेटअप                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → उपयोगकर्ता स्वीकार करता है → बॉट अपलोड करता है | बिना अतिरिक्त सेटअप के काम करता है                            |
| **समूह चैट/चैनल** | SharePoint पर अपलोड → मूल फ़ाइल कार्ड      | `sharePointSiteId` + Graph अनुमतियाँ आवश्यक हैं |
| **चित्र (कोई भी संदर्भ)** | Base64-एन्कोडेड इनलाइन                        | बिना अतिरिक्त सेटअप के काम करता है                            |

### समूह चैट को SharePoint की आवश्यकता क्यों होती है

बॉट एक एप्लिकेशन पहचान का उपयोग करते हैं, जबकि Microsoft Graph के `/me` संसाधन को [साइन-इन किया हुआ उपयोगकर्ता आवश्यक होता है](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0)। समूह चैट/चैनलों में फ़ाइलें भेजने के लिए, बॉट एक **SharePoint साइट** पर अपलोड करता है और एक साझाकरण लिंक बनाता है।

### सेटअप

1. Entra ID (Azure AD) → App Registration में **Graph API अनुमतियाँ जोड़ें**:
   - `Sites.ReadWrite.All` (एप्लिकेशन) - SharePoint पर फ़ाइलें अपलोड करें।
   - `ChatMember.Read.All` (एप्लिकेशन) - समूह-चैट फ़ाइल प्रेषण के लिए न्यूनतम विशेषाधिकार वाली टेनेंट-व्यापी अनुमति। `Chat.Read.All` भी काम करता है और समूह-चैट इतिहास सक्षम होने पर इसे पहले से कवर करता है। प्रति-चैट विकल्प के रूप में, `ChatMember.Read.Chat` [संसाधन-विशिष्ट सहमति अनुमति](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) का उपयोग करें।
2. टेनेंट के लिए **व्यवस्थापक सहमति प्रदान करें**।
3. **अपनी SharePoint साइट ID प्राप्त करें:**

   ```bash
   # मान्य टोकन के साथ Graph Explorer या curl के माध्यम से:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # उदाहरण: "contoso.sharepoint.com/sites/BotFiles" पर स्थित साइट के लिए
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # प्रतिक्रिया में शामिल है: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw कॉन्फ़िगर करें:**

   ```json5
   {
     channels: {
       msteams: {
         // ... अन्य कॉन्फ़िगरेशन ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### साझाकरण व्यवहार

| संदर्भ और अनुमति                                                  | साझाकरण व्यवहार                                          |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| चैनल + `Sites.ReadWrite.All`                                         | संगठन-व्यापी साझाकरण लिंक (संगठन में कोई भी एक्सेस कर सकता है) |
| समूह चैट + `Sites.ReadWrite.All` + समर्थित चैट-सदस्य पठन अनुदान | प्रति-उपयोगकर्ता साझाकरण लिंक (केवल चैट सदस्य एक्सेस कर सकते हैं)      |
| समर्थित चैट-सदस्य पठन अनुदान के बिना समूह चैट                   | भेजना सुरक्षित रूप से विफल होता है                                         |

प्रति-उपयोगकर्ता साझाकरण अधिक सुरक्षित है, क्योंकि केवल चैट प्रतिभागी ही फ़ाइल एक्सेस कर सकते हैं। OpenClaw को समूह चैट के लिए सफल सदस्य लुकअप की आवश्यकता होती है; टाइमआउट, ट्रांसपोर्ट विफलताएँ, खाली परिणाम और Graph API अस्वीकृतियाँ संगठन तक एक्सेस बढ़ाने के बजाय भेजने की प्रक्रिया को विफल कर देती हैं।

### फ़ॉलबैक व्यवहार

| परिदृश्य                                                         | परिणाम                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| समूह चैट + फ़ाइल + SharePoint और सदस्य अनुमतियाँ कॉन्फ़िगर की गई हैं | SharePoint पर अपलोड करें, नेटिव फ़ाइल कार्ड भेजें    |
| समूह चैट + फ़ाइल + SharePoint या सदस्य अनुमतियाँ अनुपलब्ध हैं     | कार्रवाई योग्य कॉन्फ़िगरेशन त्रुटि के साथ विफल हों      |
| चैनल + फ़ाइल + `sharePointSiteId` कॉन्फ़िगर किया गया है                   | SharePoint पर अपलोड करें, नेटिव फ़ाइल कार्ड भेजें    |
| व्यक्तिगत चैट + फ़ाइल                                             | FileConsentCard प्रवाह (SharePoint के बिना काम करता है)  |
| कोई भी संदर्भ + छवि                                              | Base64-एन्कोडेड इनलाइन (SharePoint के बिना काम करता है) |

### फ़ाइलों का संग्रहण स्थान

अपलोड की गई फ़ाइलें कॉन्फ़िगर की गई SharePoint साइट की डिफ़ॉल्ट दस्तावेज़ लाइब्रेरी के `/OpenClawShared/` फ़ोल्डर में संग्रहित होती हैं।

## पोल (Adaptive Cards)

OpenClaw Teams पोल को Adaptive Cards के रूप में भेजता है (कोई नेटिव Teams पोल API नहीं है)।

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`।
- मतों को Gateway द्वारा OpenClaw Plugin-स्टेट SQLite में `state/openclaw.sqlite` के अंतर्गत दर्ज किया जाता है।
- मौजूदा `msteams-polls.json` फ़ाइलों को चल रहे Plugin द्वारा नहीं, बल्कि `openclaw doctor --fix` द्वारा आयात किया जाता है।
- मत दर्ज करने के लिए Gateway का ऑनलाइन रहना आवश्यक है।
- पोल स्वचालित रूप से परिणाम सारांश पोस्ट नहीं करते और अभी तक कोई पोल-परिणाम CLI उपलब्ध नहीं है।

## प्रस्तुति कार्ड

`message` टूल, CLI या सामान्य उत्तर डिलीवरी का उपयोग करके Teams उपयोगकर्ताओं या वार्तालापों को सिमैंटिक प्रस्तुति पेलोड भेजें। OpenClaw उन्हें सामान्य प्रस्तुति अनुबंध से Teams Adaptive Cards के रूप में रेंडर करता है।

`presentation` पैरामीटर सिमैंटिक ब्लॉक स्वीकार करता है। जब `presentation` दिया जाता है, तो संदेश टेक्स्ट वैकल्पिक होता है। बटन Adaptive Card सबमिट या URL कार्रवाइयों के रूप में रेंडर होते हैं। Teams रेंडरर में चयन मेनू नेटिव नहीं हैं, इसलिए OpenClaw डिलीवरी से पहले उन्हें पठनीय टेक्स्ट में डाउनग्रेड कर देता है।

**एजेंट टूल:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "नमस्ते",
    blocks: [{ type: "text", text: "नमस्ते!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"नमस्ते","blocks":[{"type":"text","text":"नमस्ते!"}]}'
```

लक्ष्य प्रारूप के विवरण के लिए नीचे [लक्ष्य प्रारूप](#target-formats) देखें।

## लक्ष्य प्रारूप

MSTeams लक्ष्य उपयोगकर्ताओं और वार्तालापों के बीच अंतर करने के लिए उपसर्गों का उपयोग करते हैं:

| लक्ष्य प्रकार         | प्रारूप                           | उदाहरण                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| उपयोगकर्ता (ID द्वारा)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| उपयोगकर्ता (नाम द्वारा)      | `user:<display-name>`            | `user:John Smith` (Graph API आवश्यक है)                                                                 |
| समूह/चैनल       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| समूह/चैनल (रॉ) | `<conversation-id>`              | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces`, या बिना उपसर्ग वाला `a:`/`8:orgid:`/`29:` Bot Framework ID |

**CLI उदाहरण:**

```bash
# ID द्वारा उपयोगकर्ता को भेजें
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "नमस्ते"

# डिस्प्ले नाम द्वारा उपयोगकर्ता को भेजें (Graph API लुकअप शुरू करता है)
openclaw message send --channel msteams --target "user:John Smith" --message "नमस्ते"

# समूह चैट या चैनल को भेजें
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "नमस्ते"

# किसी वार्तालाप को प्रस्तुति कार्ड भेजें
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"नमस्ते","blocks":[{"type":"text","text":"नमस्ते"}]}'
```

**एजेंट टूल के उदाहरण:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "नमस्ते!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "नमस्ते",
    blocks: [{ type: "text", text: "नमस्ते" }],
  },
}
```

<Note>
`user:` उपसर्ग के बिना, नाम डिफ़ॉल्ट रूप से समूह या टीम रिज़ॉल्यूशन का उपयोग करते हैं। डिस्प्ले नाम से लोगों को लक्षित करते समय हमेशा `user:` का उपयोग करें।
</Note>

## सक्रिय संदेश सेवा

- सक्रिय संदेश केवल उपयोगकर्ता के इंटरैक्ट करने के **बाद** ही संभव हैं, क्योंकि OpenClaw उसी समय वार्तालाप संदर्भ संग्रहित करता है।
- `dmPolicy` और अनुमति-सूची गेटिंग के लिए [/gateway/configuration](/hi/gateway/configuration) देखें।

## टीम और चैनल ID (सामान्य भूल)

Teams URL में `groupId` क्वेरी पैरामीटर कॉन्फ़िगरेशन के लिए उपयोग की जाने वाली टीम ID **नहीं** है। इसके बजाय URL पथ से ID निकालें:

**टीम URL:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    टीम वार्तालाप ID (इसे URL-डीकोड करें)
```

**चैनल URL:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      चैनल ID (इसे URL-डीकोड करें)
```

**कॉन्फ़िगरेशन के लिए:**

- टीम कुंजी = `/team/` के बाद का पथ खंड (URL-डीकोड किया हुआ, उदाहरण के लिए `19:Bk4j...@thread.tacv2`; पुराने टेनेंट में `@thread.skype` दिखाई दे सकता है, जो भी मान्य है)।
- चैनल कुंजी = `/channel/` के बाद का पथ खंड (URL-डीकोड किया हुआ)।
- OpenClaw रूटिंग के लिए `groupId` क्वेरी पैरामीटर को **अनदेखा करें**। यह Microsoft Entra समूह ID है, आने वाली Teams गतिविधियों में उपयोग की जाने वाली Bot Framework वार्तालाप ID नहीं।

## निजी चैनल

निजी चैनलों में बॉट के लिए सीमित समर्थन उपलब्ध है:

| सुविधा                      | मानक चैनल | निजी चैनल       |
| ---------------------------- | ----------------- | ---------------------- |
| बॉट इंस्टॉलेशन             | हाँ               | सीमित                |
| रीयल-टाइम संदेश (Webhook) | हाँ               | शायद काम न करे           |
| RSC अनुमतियाँ              | हाँ               | अलग ढंग से व्यवहार कर सकती हैं |
| @उल्लेख                    | हाँ               | यदि बॉट एक्सेस योग्य है   |
| Graph API इतिहास            | हाँ               | हाँ (अनुमतियों के साथ) |

**यदि निजी चैनल काम न करें, तो वैकल्पिक उपाय:**

1. बॉट इंटरैक्शन के लिए मानक चैनलों का उपयोग करें।
2. DM का उपयोग करें; उपयोगकर्ता हमेशा बॉट को सीधे संदेश भेज सकते हैं।
3. ऐतिहासिक एक्सेस के लिए Graph API का उपयोग करें (`ChannelMessage.Read.All` आवश्यक है)।

## समस्या निवारण

### सामान्य समस्याएँ

- **चैनलों में छवियाँ दिखाई नहीं दे रही हैं:** Graph अनुमतियाँ या एडमिन सहमति अनुपलब्ध है। Teams ऐप को पुनः इंस्टॉल करें और Teams को पूरी तरह बंद करके दोबारा खोलें।
- **चैनल में कोई प्रतिक्रिया नहीं:** डिफ़ॉल्ट रूप से उल्लेख आवश्यक हैं; `channels.msteams.requireMention=false` सेट करें या प्रत्येक टीम/चैनल के लिए कॉन्फ़िगर करें।
- **वर्ज़न बेमेल (Teams अभी भी पुराना मैनिफ़ेस्ट दिखाता है):** ऐप को हटाकर दोबारा जोड़ें और रिफ़्रेश करने के लिए Teams को पूरी तरह बंद करें।
- **Webhook से 401 Unauthorized:** Azure JWT के बिना मैन्युअल परीक्षण करते समय यह अपेक्षित है; इसका अर्थ है कि एंडपॉइंट पहुँच योग्य है, लेकिन प्रमाणीकरण विफल हुआ। सही ढंग से परीक्षण करने के लिए Azure Web Chat का उपयोग करें।

### मैनिफ़ेस्ट अपलोड त्रुटियाँ

- **"Icon file cannot be empty":** मैनिफ़ेस्ट ऐसी आइकन फ़ाइलों का संदर्भ देता है जिनका आकार 0 बाइट है। मान्य PNG आइकन बनाएँ (`outline.png` के लिए 32x32, `color.png` के लिए 192x192)।
- **"webApplicationInfo.Id already in use":** ऐप अभी भी किसी अन्य टीम/चैट में इंस्टॉल है। पहले उसे खोजकर अनइंस्टॉल करें या प्रसार के लिए 5-10 मिनट प्रतीक्षा करें।
- **अपलोड पर "Something went wrong":** इसके बजाय [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) के माध्यम से अपलोड करें, ब्राउज़र DevTools (F12) → Network टैब खोलें और वास्तविक त्रुटि के लिए प्रतिक्रिया बॉडी जाँचें।
- **साइडलोड विफल हो रहा है:** "Upload a custom app" के बजाय "Upload an app to your org's app catalog" आज़माएँ; यह अक्सर साइडलोड प्रतिबंधों को बायपास कर देता है।

### RSC अनुमतियाँ काम नहीं कर रही हैं

1. सत्यापित करें कि `webApplicationInfo.id` आपके बॉट की App ID से बिल्कुल मेल खाता है।
2. ऐप को दोबारा अपलोड करें और टीम/चैट में पुनः इंस्टॉल करें।
3. जाँचें कि आपके संगठन के एडमिन ने RSC अनुमतियाँ अवरुद्ध तो नहीं की हैं।
4. पुष्टि करें कि आप सही स्कोप का उपयोग कर रहे हैं: टीमों के लिए `ChannelMessage.Read.Group`, समूह चैट के लिए `ChatMessage.Read.Chat`।

## संदर्भ

- [Azure Bot बनाएँ](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot सेटअप मार्गदर्शिका
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams ऐप बनाएँ/प्रबंधित करें
- [Teams ऐप मैनिफ़ेस्ट स्कीमा](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC के साथ चैनल संदेश प्राप्त करें](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC अनुमति संदर्भ](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams बॉट फ़ाइल प्रबंधन](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (चैनल/समूह के लिए Graph आवश्यक है)
- [सक्रिय संदेश सेवा](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - बॉट प्रबंधन के लिए Teams CLI

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) - समूह चैट का व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) - पहुँच मॉडल और सुदृढ़ीकरण
