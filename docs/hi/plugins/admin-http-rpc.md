---
read_when:
    - ऐसे होस्ट टूलिंग का निर्माण जो Gateway WebSocket RPC क्लाइंट का उपयोग नहीं कर सकती
    - निजी विश्वसनीय इनग्रेस के पीछे Gateway एडमिन ऑटोमेशन को उपलब्ध कराना
    - Gateway विधियों तक HTTP पहुँच के सुरक्षा मॉडल का ऑडिट करना
summary: बंडल किए गए, ऑप्ट-इन admin-http-rpc Plugin के माध्यम से चुनिंदा Gateway कंट्रोल-प्लेन विधियाँ उपलब्ध कराएँ
title: एडमिन HTTP RPC Plugin
x-i18n:
    generated_at: "2026-07-19T09:36:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

बंडल किया गया `admin-http-rpc` Plugin, HTTP पर Gateway कंट्रोल-प्लेन विधियों का अनुमति-सूचीबद्ध सेट उपलब्ध कराता है। यह ऐसे विश्वसनीय होस्ट ऑटोमेशन के लिए है जो Gateway WebSocket कनेक्शन खुला नहीं रख सकता।

यह OpenClaw के साथ आता है, लेकिन डिफ़ॉल्ट रूप से अक्षम रहता है; अक्षम होने पर रूट पंजीकृत नहीं होता। सक्षम होने पर, यह Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`) वाले ही लिसनर पर `POST /api/v1/admin/rpc` जोड़ता है।

इसे केवल निजी होस्ट टूलिंग, टेलनेट ऑटोमेशन या किसी विश्वसनीय आंतरिक इनग्रेस के लिए सक्षम करें। इस रूट को कभी भी सीधे सार्वजनिक इंटरनेट के सामने उजागर न करें।

## इसे सक्षम करने से पहले

Admin HTTP RPC पूर्ण ऑपरेटर कंट्रोल-प्लेन सतह है: Gateway HTTP प्रमाणीकरण पास करने वाला कोई भी कॉलर नीचे दी गई अनुमति-सूचीबद्ध विधियों को लागू कर सकता है। इसे केवल तभी सक्षम करें जब ये सभी शर्तें पूरी हों:

- कॉलर को Gateway संचालित करने के लिए विश्वसनीय माना जाता है।
- कॉलर WebSocket RPC क्लाइंट का उपयोग नहीं कर सकता।
- रूट केवल लूपबैक, टेलनेट या निजी प्रमाणीकृत इनग्रेस पर पहुँच योग्य है।
- आपने अनुमत विधियों की समीक्षा कर ली है और वे आपके द्वारा चलाए जाने वाले ऑटोमेशन से मेल खाती हैं।

ऐसे OpenClaw क्लाइंट और इंटरैक्टिव टूल के लिए, जो Gateway WebSocket कनेक्शन खुला रख सकते हैं, इसके बजाय WebSocket RPC का उपयोग करें।

## सक्षम करें

बंडल किया गया Plugin सक्षम करें:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="कॉन्फ़िगरेशन">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

रूट Plugin शुरू होने के दौरान पंजीकृत होता है, इसलिए Plugin कॉन्फ़िगरेशन बदलने के बाद Gateway पुनः आरंभ करें।

जब HTTP सतह की आवश्यकता न रहे, तो इसे अक्षम कर दें:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## रूट सत्यापित करें

सबसे छोटे सुरक्षित अनुरोध के रूप में `health` का उपयोग करें:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

सफल प्रतिक्रिया में `ok: true` होता है:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Plugin अक्षम होने पर रूट `404` लौटाता है, क्योंकि वह पंजीकृत नहीं होता।

## प्रमाणीकरण

Plugin रूट Gateway HTTP प्रमाणीकरण का उपयोग करता है।

सामान्य प्रमाणीकरण पथ:

- साझा-सीक्रेट प्रमाणीकरण (`gateway.auth.mode="token"` या `"password"`): `Authorization: Bearer <token-or-password>`
- विश्वसनीय पहचान-युक्त HTTP प्रमाणीकरण (`gateway.auth.mode="trusted-proxy"`): कॉन्फ़िगर किए गए पहचान-सजग प्रॉक्सी के माध्यम से रूट करें और उसे आवश्यक पहचान हेडर इंजेक्ट करने दें
- निजी-इनग्रेस खुला प्रमाणीकरण (`gateway.auth.mode="none"`): किसी प्रमाणीकरण हेडर की आवश्यकता नहीं

## सुरक्षा मॉडल

इस Plugin को पूर्ण Gateway ऑपरेटर सतह मानें।

- Plugin को सक्षम करने से जानबूझकर `/api/v1/admin/rpc` पर अनुमति-सूचीबद्ध एडमिन RPC विधियों की पहुँच उपलब्ध होती है।
- Plugin आरक्षित `contracts.gatewayMethodDispatch: ["authenticated-request"]` मेनिफ़ेस्ट अनुबंध घोषित करता है, जिसके कारण इसका Gateway-प्रमाणीकृत HTTP रूट उसी प्रोसेस में कंट्रोल-प्लेन विधियाँ डिस्पैच कर पाता है। यह सैंडबॉक्स नहीं है: अनुबंध आरक्षित SDK सहायकों के आकस्मिक उपयोग को रोकता है, लेकिन विश्वसनीय Plugin फिर भी Gateway प्रोसेस में चलते हैं।
- साझा-सीक्रेट बियरर प्रमाणीकरण (`token`/`password` मोड) Gateway ऑपरेटर सीक्रेट के स्वामित्व को प्रमाणित करता है; उस पथ पर अधिक सीमित `x-openclaw-scopes` हेडर अनदेखे किए जाते हैं और सामान्य पूर्ण ऑपरेटर डिफ़ॉल्ट बहाल कर दिए जाते हैं।
- विश्वसनीय पहचान-युक्त HTTP प्रमाणीकरण (`trusted-proxy` मोड), मौजूद होने पर `x-openclaw-scopes` का सम्मान करता है।
- `gateway.auth.mode="none"` का अर्थ है कि Plugin सक्षम होने पर यह रूट अप्रमाणीकृत है। इसका उपयोग केवल ऐसे निजी इनग्रेस के पीछे करें जिस पर आपको पूर्ण विश्वास हो।
- Plugin रूट का प्रमाणीकरण पास होने के बाद, अनुरोध WebSocket RPC वाले ही Gateway विधि हैंडलर और स्कोप जाँच के माध्यम से डिस्पैच होते हैं।
- तैयार किए गए निलंबन लीज़ के दौरान भी रूट पहुँच योग्य रहता है। सीमित अनुरोध सत्यापन और स्थानीय `commands.list` डिस्कवरी प्रतिक्रिया उपलब्ध रहते हैं। Gateway में डिस्पैच की गई विधियों में से केवल `gateway.suspend.prepare`, `gateway.suspend.status` और `gateway.suspend.resume` ही प्रवेश बंद होने के दौरान चल सकती हैं; अनुमति-सूचीबद्ध अन्य विधियाँ सामान्य पुनः प्रयास योग्य Gateway `UNAVAILABLE` प्रतिक्रिया लौटाती हैं।
- इस रूट को लूपबैक, टेलनेट या निजी विश्वसनीय इनग्रेस पर रखें। इसे सीधे सार्वजनिक इंटरनेट के सामने उजागर न करें। कॉलर के बीच विश्वास-सीमाएँ होने पर अलग-अलग Gateway का उपयोग करें।

## अनुरोध

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

फ़ील्ड:

- `id` (स्ट्रिंग, वैकल्पिक): प्रतिक्रिया में कॉपी किया जाता है। इसे छोड़ने पर UUID जनरेट किया जाता है।
- `method` (स्ट्रिंग, आवश्यक): अनुमत Gateway विधि का नाम।
- `params` (कोई भी, वैकल्पिक): विधि-विशिष्ट पैरामीटर।

अनुरोध बॉडी का डिफ़ॉल्ट अधिकतम आकार 1 MB है।

## प्रतिक्रिया

सफल प्रतिक्रियाएँ Gateway RPC स्वरूप का उपयोग करती हैं:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway विधि त्रुटियाँ इस स्वरूप का उपयोग करती हैं:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

HTTP स्थिति त्रुटि कोड के अनुसार होती है:

| त्रुटि कोड                 | HTTP स्थिति |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| कोई अन्य कोड             | 500         |

## अनुमत विधियाँ

- डिस्कवरी: `commands.list`
  इस Plugin द्वारा अनुमत HTTP RPC विधियों के नाम लौटाता है।
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- कॉन्फ़िगरेशन: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- चैनल: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- वेब: `web.login.start`, `web.login.wait`
- मॉडल: `models.list`, `models.authStatus`
- एजेंट: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- स्वीकृतियाँ: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- डिवाइस: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Node: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- कार्य: `tasks.list`, `tasks.get`, `tasks.cancel`
- निदान: `doctor.memory.status`, `update.status`

अन्य Gateway विधियाँ तब तक अवरुद्ध रहती हैं, जब तक उन्हें जानबूझकर नहीं जोड़ा जाता।

## WebSocket तुलना

सामान्य Gateway WebSocket RPC पथ, OpenClaw क्लाइंट के लिए पसंदीदा कंट्रोल-प्लेन API बना रहता है। Admin HTTP RPC का उपयोग केवल ऐसी होस्ट टूलिंग के लिए करें जिसे अनुरोध/प्रतिक्रिया वाली HTTP सतह चाहिए।

विश्वसनीय डिवाइस पहचान के बिना साझा-टोकन WebSocket क्लाइंट कनेक्ट करते समय एडमिन स्कोप स्वयं घोषित नहीं कर सकते। Admin HTTP RPC जानबूझकर मौजूदा विश्वसनीय HTTP ऑपरेटर मॉडल का अनुसरण करता है: Plugin सक्षम होने पर, इस एडमिन सतह के लिए साझा-सीक्रेट बियरर प्रमाणीकरण को पूर्ण ऑपरेटर पहुँच माना जाता है।

## समस्या निवारण

`404 Not Found`

: Plugin अक्षम है, उसे सक्षम करने के बाद से Gateway पुनः आरंभ नहीं हुआ है या अनुरोध किसी दूसरे Gateway प्रोसेस पर जा रहा है।

`401 Unauthorized`

: अनुरोध ने Gateway HTTP प्रमाणीकरण पूरा नहीं किया। बियरर टोकन या विश्वसनीय-प्रॉक्सी पहचान हेडर जाँचें।

`405 Method Not Allowed`

: अनुरोध में `POST` के अलावा किसी अन्य चीज़ का उपयोग किया गया था।

`413 Payload Too Large`

: अनुरोध बॉडी 1 MB की सीमा से अधिक थी।

`400 INVALID_REQUEST`

: अनुरोध बॉडी मान्य JSON नहीं है, `method` फ़ील्ड अनुपस्थित है, विधि Plugin की अनुमति-सूची में नहीं है या निलंबन रिज़्यूम ID सक्रिय लीज़ से मेल नहीं खाती।

`503 UNAVAILABLE`

: Gateway विधि शुरू हो रही है, दर-सीमित है, निलंबित है या किसी प्रतिस्पर्धी निलंबन/रिज़्यूम कार्रवाई की प्रतीक्षा कर रही है। मौजूद होने पर `error.details` का निरीक्षण करें और पुनः प्रयास करने से पहले `error.retryAfterMs` का पालन करें।

## संबंधित

- [ऑपरेटर स्कोप](/hi/gateway/operator-scopes)
- [Gateway सुरक्षा](/hi/gateway/security)
- [दूरस्थ पहुँच](/hi/gateway/remote)
- [Plugin मेनिफ़ेस्ट](/hi/plugins/manifest#contracts-reference)
- [SDK उपपथ](/hi/plugins/sdk-subpaths)
