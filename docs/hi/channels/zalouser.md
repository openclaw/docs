---
read_when:
    - OpenClaw के लिए Zalo Personal सेट अप करना
    - Zalo Personal लॉगिन या संदेश प्रवाह की डीबगिंग
summary: मूल zca-js (QR लॉगिन) के माध्यम से Zalo व्यक्तिगत खाते का समर्थन, क्षमताएँ, और कॉन्फ़िगरेशन
title: Zalo व्यक्तिगत
x-i18n:
    generated_at: "2026-06-28T22:42:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

स्थिति: प्रायोगिक। यह इंटीग्रेशन OpenClaw के अंदर नेटिव `zca-js` के ज़रिए एक **निजी Zalo खाते** को स्वचालित करता है।

<Warning>
यह एक अनौपचारिक इंटीग्रेशन है और इससे खाता निलंबित या प्रतिबंधित हो सकता है। अपने जोखिम पर उपयोग करें।
</Warning>

## बंडल किया गया Plugin

Zalo Personal मौजूदा OpenClaw रिलीज़ में बंडल किए गए Plugin के रूप में आता है, इसलिए सामान्य
पैकेज्ड बिल्ड के लिए अलग इंस्टॉल की आवश्यकता नहीं होती।

यदि आप किसी पुराने बिल्ड पर हैं या किसी कस्टम इंस्टॉल पर हैं जिसमें Zalo Personal शामिल नहीं है,
तो npm पैकेज सीधे इंस्टॉल करें:

- CLI के ज़रिए इंस्टॉल करें: `openclaw plugins install @openclaw/zalouser`
- पिन किया गया संस्करण: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- या सोर्स चेकआउट से: `openclaw plugins install ./path/to/local/zalouser-plugin`
- विवरण: [Plugins](/hi/tools/plugin)

किसी बाहरी `zca`/`openzca` CLI बाइनरी की आवश्यकता नहीं है।

## त्वरित सेटअप (आरंभिक)

1. सुनिश्चित करें कि Zalo Personal Plugin उपलब्ध है।
   - मौजूदा पैकेज्ड OpenClaw रिलीज़ में यह पहले से बंडल होता है।
   - पुराने/कस्टम इंस्टॉल इसे ऊपर दिए गए कमांड से मैन्युअल रूप से जोड़ सकते हैं।
2. लॉगिन करें (QR, Gateway मशीन पर):
   - `openclaw channels login --channel zalouser`
   - Zalo मोबाइल ऐप से QR कोड स्कैन करें।
3. चैनल सक्षम करें:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Gateway पुनः प्रारंभ करें (या सेटअप पूरा करें)।
5. DM एक्सेस डिफ़ॉल्ट रूप से पेयरिंग पर रहता है; पहले संपर्क पर पेयरिंग कोड स्वीकृत करें।

## यह क्या है

- पूरी तरह `zca-js` के ज़रिए इन-प्रोसेस चलता है।
- आने वाले संदेश प्राप्त करने के लिए नेटिव इवेंट लिस्नर का उपयोग करता है।
- JS API (टेक्स्ट/मीडिया/लिंक) के ज़रिए सीधे उत्तर भेजता है।
- उन "निजी खाते" उपयोग मामलों के लिए बनाया गया है जहाँ Zalo Bot API उपलब्ध नहीं है।

## नामकरण

चैनल id `zalouser` है ताकि यह स्पष्ट रहे कि यह एक **निजी Zalo उपयोगकर्ता खाते** (अनौपचारिक) को स्वचालित करता है। हम `zalo` को संभावित भविष्य के आधिकारिक Zalo API इंटीग्रेशन के लिए आरक्षित रखते हैं।

## ID ढूँढना (डायरेक्टरी)

Peers/groups और उनके ID खोजने के लिए डायरेक्टरी CLI का उपयोग करें:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## सीमाएँ

- बाहर जाने वाला टेक्स्ट ~2000 वर्णों के हिस्सों में बाँटा जाता है (Zalo क्लाइंट सीमाएँ)।
- स्ट्रीमिंग डिफ़ॉल्ट रूप से अवरुद्ध है।

## एक्सेस नियंत्रण (DMs)

`channels.zalouser.dmPolicy` समर्थन करता है: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट: `pairing`)।

`channels.zalouser.allowFrom` में स्थिर Zalo उपयोगकर्ता ID उपयोग होने चाहिए। यह स्थिर sender access groups (`accessGroup:<name>`) को भी संदर्भित कर सकता है। इंटरैक्टिव सेटअप के दौरान, दर्ज किए गए नामों को Plugin के इन-प्रोसेस contact lookup का उपयोग करके ID में बदला जा सकता है।

यदि config में कोई कच्चा नाम बचा रहता है, तो startup उसे केवल तब resolve करता है जब `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम हो। उस opt-in के बिना, runtime sender checks केवल ID-आधारित होते हैं और authorization के लिए कच्चे नाम अनदेखे किए जाते हैं।

इसके ज़रिए स्वीकृत करें:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## ग्रुप एक्सेस (वैकल्पिक)

- डिफ़ॉल्ट: `channels.zalouser.groupPolicy = "open"` (groups अनुमति प्राप्त)। unset होने पर डिफ़ॉल्ट override करने के लिए `channels.defaults.groupPolicy` का उपयोग करें।
- allowlist तक सीमित करें:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (keys स्थिर group IDs होने चाहिए; names startup पर केवल तब ID में resolve किए जाते हैं जब `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम हो)
  - `channels.zalouser.groupAllowFrom` (नियंत्रित करता है कि अनुमति प्राप्त groups में कौन से senders bot को trigger कर सकते हैं; static sender access groups को `accessGroup:<name>` से reference किया जा सकता है)
- सभी groups अवरुद्ध करें: `channels.zalouser.groupPolicy = "disabled"`।
- configure wizard group allowlists के लिए prompt कर सकता है।
- startup पर, OpenClaw allowlists में group/user names को ID में resolve करता है और mapping को केवल तब log करता है जब `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम हो।
- Group allowlist matching डिफ़ॉल्ट रूप से केवल ID-आधारित है। Unresolved names auth के लिए अनदेखे किए जाते हैं, जब तक `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम न हो।
- `channels.zalouser.dangerouslyAllowNameMatching: true` एक break-glass compatibility mode है जो mutable startup name resolution और runtime group-name matching को फिर से सक्षम करता है।
- यदि `groupAllowFrom` unset है, तो runtime group sender checks के लिए `allowFrom` पर fallback करता है।
- Sender checks सामान्य group messages और control commands (उदाहरण के लिए `/new`, `/reset`) दोनों पर लागू होते हैं।

उदाहरण:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Group mention gating

- `channels.zalouser.groups.<group>.requireMention` नियंत्रित करता है कि group replies के लिए mention आवश्यक है या नहीं।
- Resolution order: exact group id/name -> normalized group slug -> `*` -> default (`true`)।
- यह allowlisted groups और open group mode, दोनों पर लागू होता है।
- bot message को quote करना group activation के लिए implicit mention माना जाता है।
- Authorized control commands (उदाहरण के लिए `/new`) mention gating को bypass कर सकते हैं।
- जब कोई group message इसलिए छोड़ा जाता है क्योंकि mention आवश्यक है, OpenClaw उसे pending group history के रूप में store करता है और अगले processed group message में शामिल करता है।
- Group history limit डिफ़ॉल्ट रूप से `messages.groupChat.historyLimit` (fallback `50`) होती है। आप `channels.zalouser.historyLimit` से प्रति account override कर सकते हैं।

उदाहरण:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## मल्टी-अकाउंट

Accounts OpenClaw state में `zalouser` profiles से map होते हैं। उदाहरण:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Environment variables

Zalo Personal Plugin environment variables से profile selection भी पढ़ सकता है:

- `ZALOUSER_PROFILE`: जब channel या account config में कोई `profile` set न हो, तब उपयोग किया जाने वाला profile name।
- `ZCA_PROFILE`: legacy fallback profile name, केवल तब उपयोग होता है जब `ZALOUSER_PROFILE` set नहीं है।

Profile names OpenClaw state में सहेजे गए Zalo login credentials चुनते हैं। Resolution order है:

1. config में स्पष्ट `profile`।
2. `ZALOUSER_PROFILE`।
3. `ZCA_PROFILE`।
4. non-default accounts के लिए account id, या default account के लिए `default`।

Multi-account setups के लिए, config में प्रत्येक account पर `profile` set करना बेहतर है ताकि
एक environment variable कई accounts को वही login
session share न कराए।

## Typing, reactions, और delivery acknowledgements

- OpenClaw reply dispatch करने से पहले typing event भेजता है (best-effort)।
- Message reaction action `react` channel actions में `zalouser` के लिए समर्थित है।
  - किसी message से विशिष्ट reaction emoji हटाने के लिए `remove: true` का उपयोग करें।
  - Reaction semantics: [Reactions](/hi/tools/reactions)
- जिन inbound messages में event metadata शामिल होता है, उनके लिए OpenClaw delivered + seen acknowledgements भेजता है (best-effort)।

## समस्या निवारण

**Login टिकता नहीं है:**

- `openclaw channels status --probe`
- फिर से login करें: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/group name resolve नहीं हुआ:**

- `allowFrom`/`groupAllowFrom` में numeric IDs और `groups` में stable group IDs का उपयोग करें। यदि आपको जानबूझकर exact friend/group names की आवश्यकता है, तो `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम करें।

**पुराने CLI-आधारित setup से upgrade किया है:**

- किसी भी पुराने external `zca` process assumptions को हटाएँ।
- चैनल अब external CLI binaries के बिना पूरी तरह OpenClaw में चलता है।

## संबंधित

- [Channels Overview](/hi/channels) — सभी समर्थित channels
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow
- [Groups](/hi/channels/groups) — group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Security](/hi/gateway/security) — access model और hardening
