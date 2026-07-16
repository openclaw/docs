---
read_when:
    - Slack सेट अप करना या Slack सॉकेट, HTTP अथवा रिले मोड को डीबग करना
summary: Slack सेटअप और रनटाइम व्यवहार (Socket Mode, HTTP Request URLs और रिले मोड)
title: Slack
x-i18n:
    generated_at: "2026-07-16T13:26:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Slack समर्थन, Slack ऐप इंटीग्रेशन के माध्यम से DM और चैनलों को कवर करता है। डिफ़ॉल्ट ट्रांसपोर्ट Socket Mode है; HTTP Request URLs भी समर्थित हैं। रिले मोड उन प्रबंधित डिप्लॉयमेंट के लिए है जहाँ कोई विश्वसनीय राउटर Slack इनग्रेस का स्वामी होता है।

<CardGroup cols={3}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    Slack DM डिफ़ॉल्ट रूप से पेयरिंग मोड का उपयोग करते हैं।
  </Card>
  <Card title="स्लैश कमांड" icon="terminal" href="/hi/tools/slash-commands">
    नेटिव कमांड व्यवहार और कमांड कैटलॉग।
  </Card>
  <Card title="चैनल समस्या निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल निदान और सुधार कार्यविधियाँ।
  </Card>
</CardGroup>

## ट्रांसपोर्ट चुनना

Socket Mode और HTTP Request URLs, मैसेजिंग, स्लैश कमांड, App Home और इंटरैक्टिविटी के लिए समान फ़ीचर उपलब्ध कराते हैं। चयन डिप्लॉयमेंट संरचना के आधार पर करें, फ़ीचर के आधार पर नहीं।

| विचारणीय पहलू                      | Socket Mode (डिफ़ॉल्ट)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| सार्वजनिक Gateway URL           | आवश्यक नहीं                                                                                                                                         | आवश्यक (DNS, TLS, रिवर्स प्रॉक्सी या टनल)                                                                   |
| आउटबाउंड नेटवर्क             | `wss-primary.slack.com` तक आउटबाउंड WSS पहुँच योग्य होना चाहिए                                                                                            | कोई आउटबाउंड WS नहीं; केवल इनबाउंड HTTPS                                                                             |
| आवश्यक टोकन                | बॉट टोकन + `connections:write` वाला App-Level Token                                                                                                 | बॉट टोकन + Signing Secret                                                                                     |
| डेवलपमेंट लैपटॉप / फ़ायरवॉल के पीछे | यथावत काम करता है                                                                                                                                          | सार्वजनिक टनल (ngrok, Cloudflare Tunnel, Tailscale Funnel) या स्टेजिंग Gateway चाहिए                          |
| हॉरिज़ॉन्टल स्केलिंग           | प्रत्येक होस्ट पर प्रत्येक ऐप के लिए एक Socket Mode सत्र; अनेक Gateway के लिए अलग-अलग Slack ऐप चाहिए                                                                 | स्टेटलेस POST हैंडलर; अनेक Gateway प्रतिकृतियाँ लोड बैलेंसर के पीछे एक ऐप साझा कर सकती हैं                     |
| एक Gateway पर अनेक अकाउंट | समर्थित; प्रत्येक अकाउंट अपना WS खोलता है                                                                                                             | समर्थित; प्रत्येक अकाउंट के लिए एक अद्वितीय `webhookPath` (डिफ़ॉल्ट `/slack/events`) चाहिए ताकि पंजीकरण परस्पर न टकराएँ |
| स्लैश कमांड ट्रांसपोर्ट      | WS कनेक्शन पर डिलीवर होता है; `slash_commands[].url` को अनदेखा किया जाता है                                                                                  | Slack, `slash_commands[].url` पर POST करता है; कमांड डिस्पैच करने के लिए यह फ़ील्ड आवश्यक है                           |
| अनुरोध हस्ताक्षर              | उपयोग नहीं होता (प्रमाणीकरण App-Level Token है)                                                                                                               | Slack प्रत्येक अनुरोध पर हस्ताक्षर करता है; OpenClaw `signingSecret` से सत्यापन करता है                                              |
| कनेक्शन टूटने पर रिकवरी  | Slack SDK का स्वचालित पुनः कनेक्शन सक्षम है; OpenClaw विफल Socket Mode सत्रों को सीमित बैकऑफ़ के साथ पुनः आरंभ भी करता है। पॉन्ग-टाइमआउट ट्रांसपोर्ट ट्यूनिंग लागू होती है। | टूटने के लिए कोई स्थायी कनेक्शन नहीं; Slack प्रत्येक अनुरोध के आधार पर पुनः प्रयास करता है                                           |

<Note>
  एकल-Gateway होस्ट, डेवलपमेंट लैपटॉप और ऐसे ऑन-प्रिमाइसेस नेटवर्क के लिए **Socket Mode चुनें**, जो आउटबाउंड `*.slack.com` तक पहुँच सकते हैं लेकिन इनबाउंड HTTPS स्वीकार नहीं कर सकते।

लोड बैलेंसर के पीछे अनेक Gateway प्रतिकृतियाँ चलाते समय, आउटबाउंड WSS अवरुद्ध लेकिन इनबाउंड HTTPS अनुमत होने पर, या जब आप पहले से रिवर्स प्रॉक्सी पर Slack Webhook समाप्त करते हैं, तब **HTTP Request URLs चुनें**।
</Note>

<Warning>
  Slack एक ऐप के लिए कई Socket Mode कनेक्शन बनाए रख सकता है और प्रत्येक पेलोड को किसी भी कनेक्शन पर डिलीवर कर सकता है। इसलिए, Slack ऐप साझा करने वाले अलग-अलग OpenClaw Gateway में समान रूटिंग और प्राधिकरण कॉन्फ़िगरेशन होना चाहिए। अन्यथा, प्रत्येक Gateway के लिए अलग Slack ऐप, एकल रिले इनग्रेस या लोड बैलेंसर के पीछे HTTP Request URLs का उपयोग करें। [Socket Mode का उपयोग](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections) देखें।
</Warning>

### रिले मोड

रिले मोड Slack इनग्रेस को OpenClaw Gateway से अलग करता है। कोई विश्वसनीय राउटर एकल Slack Socket Mode कनेक्शन का स्वामी होता है, गंतव्य Gateway चुनता है और प्रमाणीकृत वेबसॉकेट पर टाइप किया हुआ इवेंट अग्रेषित करता है। आउटबाउंड Slack Web API कॉल के लिए Gateway अब भी अपने बॉट टोकन का उपयोग करता है।

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

रिले URL को `wss://` का उपयोग करना चाहिए, जब तक कि वह localhost को लक्षित न करता हो। बियरर टोकन और राउटर रूट तालिका को Slack प्राधिकरण सीमा का भाग मानें: रूट किए गए इवेंट अधिकृत सक्रियण के रूप में सामान्य Slack संदेश हैंडलर में प्रवेश करते हैं। वेबसॉकेट `hello` फ़्रेम में राउटर द्वारा दिया गया `slack_identity`, डिफ़ॉल्ट आउटबाउंड उपयोगकर्ता नाम और आइकन सेट कर सकता है; कॉलर द्वारा स्पष्ट रूप से दी गई पहचान को फिर भी प्राथमिकता मिलती है। रिले कनेक्शन, Socket Mode जैसी ही सीमित बैकऑफ़ टाइमिंग के साथ पुनः कनेक्ट होता है और डिस्कनेक्ट होने पर राउटर द्वारा दी गई पहचान हटा देता है।

### Enterprise Grid के संगठन-व्यापी इंस्टॉलेशन

एक Slack अकाउंट, Enterprise Grid के संगठन-व्यापी इंस्टॉलेशन द्वारा कवर किए गए प्रत्येक वर्कस्पेस से संदेश प्राप्त कर सकता है। सीधे Socket Mode या HTTP Request URLs चुनें; एंटरप्राइज़ अकाउंट के लिए रिले मोड समर्थित नहीं है। नीचे दिए गए दोनों न्यूनतम-विशेषाधिकार मैनिफ़ेस्ट केवल V1 `message` और `app_mention` इवेंट पथ, तत्काल उत्तर और लिसनर-स्वामित्व वाली स्थिति प्रतिक्रियाएँ सक्षम करते हैं।

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw के लिए Slack कनेक्टर"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

किसी Enterprise Grid Org Admin या Org Owner से ऐप अनुमोदित करवाएँ, उसे संगठन स्तर पर इंस्टॉल करें और वे वर्कस्पेस चुनें जिन्हें इंस्टॉलेशन कवर करता है। OpenClaw शुरू करने से पहले पुष्टि करें कि ऐप प्रत्येक अपेक्षित वर्कस्पेस में उपलब्ध है। Socket Mode के लिए `connections:write` वाला ऐप-स्तरीय टोकन जनरेट करें, फिर संगठन इंस्टॉलेशन से बॉट टोकन कॉपी करें। संगठन में इंस्टॉल किए गए बॉट टोकन का उपयोग करने वाले अकाउंट को कॉन्फ़िगर करें:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

HTTP मोड का उपयोग तब करें जब Gateway के पास सार्वजनिक HTTPS एंडपॉइंट हो और वह Socket Mode कनेक्शन न खोलता हो। उदाहरण URL को Gateway के सार्वजनिक `webhookPath` URL (डिफ़ॉल्ट `/slack/events`) से बदलें:

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw के लिए Slack कनेक्टर"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

किसी Enterprise Grid Org Admin या Org Owner से ऐप अनुमोदित करवाएँ, उसे संगठन स्तर पर इंस्टॉल करें और वे वर्कस्पेस चुनें जिन्हें इंस्टॉलेशन कवर करता है। Slack द्वारा Request URL सत्यापित करने के बाद, संगठन इंस्टॉलेशन का बॉट टोकन और ऐप का **Basic Information -> App Credentials -> Signing Secret** कॉपी करें। उसी Request URL पथ के साथ एंटरप्राइज़ अकाउंट कॉन्फ़िगर करें:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

स्टार्टअप पर, OpenClaw Slack `auth.test` से `enterpriseOrgInstall` सत्यापित करता है। फ़्लैग के बिना संगठन में इंस्टॉल किया गया टोकन या फ़्लैग वाला वर्कस्पेस टोकन, स्टार्टअप विफल कर देता है। किन वर्कस्पेस ने इंस्टॉलेशन की अनुमति दी है, इसके लिए Slack ही सत्य का स्रोत रहता है; इसके बाद OpenClaw प्रत्येक डिलीवर किए गए इवेंट पर कॉन्फ़िगर की गई चैनल, उपयोगकर्ता, DM और उल्लेख नीतियाँ लागू करता है। Enterprise V1, डिस्पैच से पहले बॉट द्वारा बनाए गए सभी `message` और `app_mention` इवेंट अस्वीकार करता है, चाहे `allowBots` कुछ भी हो, क्योंकि संगठन इंस्टॉलेशन लूप रोकथाम के लिए स्थिर, वर्कस्पेस-योग्य बॉट पहचान प्रदान नहीं करते।

Enterprise समर्थन जानबूझकर सीधे Socket Mode या HTTP `message` और `app_mention` इवेंट तथा उनके तत्काल उत्तरों तक सीमित है। एंटरप्राइज़ अकाउंट के लिए रिले मोड, स्लैश कमांड, इंटरैक्शन, App Home, प्रतिक्रिया इवेंट लिसनर, पिन, Slack एक्शन टूल, Slack-नेटिव अनुमोदन, बाइंडिंग, कतारबद्ध या शेड्यूल की गई डिलीवरी और सक्रिय रूप से भेजना उपलब्ध नहीं हैं। आउटबाउंड पावती, टाइपिंग और स्थिति प्रतिक्रियाएँ लिसनर-स्वामित्व वाले Slack क्लाइंट के माध्यम से समर्थित हैं और इनके लिए `reactions:write` आवश्यक है; इनबाउंड प्रतिक्रिया सूचनाएँ और प्रतिक्रिया एक्शन टूल उपलब्ध नहीं रहते।

तात्कालिक उत्तर खंडों, मीडिया, मेटाडेटा, पहचान फ़ॉलबैक, अनफ़र्ल और प्राप्ति-पुष्टियों के लिए मानक Slack डिलीवरी व्यवहार का पुनः उपयोग करते हैं, लेकिन केवल तब तक जब तक सत्यापित, लिसनर-स्वामित्व वाला क्लाइंट सक्रिय इवेंट टर्न में रहता है। इन-मेमोरी प्रेषण कतार और थ्रेड-भागीदारी रिकॉर्ड उस इवेंट के वर्कस्पेस के अनुसार विभाजित होते हैं; स्वयं क्लाइंट को कभी सीरियलाइज़ या स्थायी रूप से संग्रहीत नहीं किया जाता।

चैनल नीति कुंजियों और `dm.groupChannels` प्रविष्टियों में कच्ची, स्थिर Slack चैनल ID या
`channel:<id>` प्रारूप का उपयोग अनिवार्य है। OpenClaw रनटाइम मिलान के लिए दोनों में से किसी भी प्रारूप को कच्ची चैनल ID में सामान्यीकृत करता है; `slack:`, `group:`, और `mpim:` उपसर्ग स्टार्टअप विफल कर देते हैं।
उपयोगकर्ता नीति प्रविष्टियों में स्थिर Slack उपयोगकर्ता ID का उपयोग अनिवार्य है; नाम, स्लग, प्रदर्शन नाम और ईमेल पते स्टार्टअप विफल कर देते हैं। ID में Slack के प्रामाणिक अपरकेस उपसर्ग और मुख्य भाग (उदाहरण के लिए, `C0123456789` या `U0123456789`) का उपयोग अनिवार्य है; लोअरकेस और छोटे मिलते-जुलते रूप स्टार्टअप विफल कर देते हैं। एंटरप्राइज़ खाते
`dangerouslyAllowNameMatching` सक्षम नहीं कर सकते। एंटरप्राइज़ खाते वैश्विक
`mentionPatterns.mode` सेट कर सकते हैं, लेकिन `mentionPatterns.allowIn` और
`mentionPatterns.denyIn` स्टार्टअप विफल कर देते हैं क्योंकि बिना वर्कस्पेस योग्यता वाली Slack चैनल ID का विभिन्न वर्कस्पेस में पुनः उपयोग किया जा सकता है। वर्कस्पेस इंस्टॉलेशन मौजूदा स्कोप किए गए उल्लेख-पैटर्न व्यवहार को बनाए रखते हैं। प्रत्येक स्वीकृत वर्कस्पेस को अलग रूटिंग, सत्र, ट्रांसक्रिप्ट, डीडुप्लिकेशन, इतिहास और कैश पहचान मिलती है, भले ही Slack ID एक-दूसरे से मेल खाती हों। `message` स्ट्रीम के भीतर, सामान्य उपयोगकर्ता संदेश और उपयोगकर्ता द्वारा बनाए गए `file_share` इवेंट समर्थित हैं; अन्य संदेश उपप्रकारों को प्राधिकरण या सिस्टम-इवेंट प्रबंधन से पहले अस्वीकार कर दिया जाता है।

एंटरप्राइज़ DM या तो अक्षम होने चाहिए (`dm.enabled=false` या
`dmPolicy="disabled"`) या `dmPolicy="open"` के साथ स्पष्ट रूप से खुले होने चाहिए और प्रभावी खाता `allowFrom` में शाब्दिक `"*"` शामिल होना चाहिए। `"*"` के बिना खाली अनुमति-सूची या उपयोगकर्ता-विशिष्ट ID स्टार्टअप विफल कर देती हैं। पेयरिंग और प्रति-उपयोगकर्ता DM अनुमति-सूचियाँ अस्वीकार कर दी जाती हैं क्योंकि उन प्राधिकरण स्टोर में Slack उपयोगकर्ता ID वर्कस्पेस-योग्य नहीं होतीं। चैनल और प्रेषक नीति चैनल संदेशों पर लागू रहती है।

## इंस्टॉल करें

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` Plugin को पंजीकृत और सक्षम करता है। जब तक आप नीचे दिए गए Slack ऐप और चैनल सेटिंग कॉन्फ़िगर नहीं करते, यह कुछ नहीं करता। सामान्य Plugin इंस्टॉलेशन नियमों के लिए [Plugins](/hi/tools/plugin) देखें।

## त्वरित सेटअप

इस अनुभाग के मैनिफ़ेस्ट वर्कस्पेस-स्कोप वाला इंस्टॉलेशन बनाते हैं। Enterprise Grid संगठन इंस्टॉलेशन के लिए इसके बजाय समर्पित
[संगठन-व्यापी मैनिफ़ेस्ट और कार्यप्रवाह](#enterprise-grid-org-wide-installs) का उपयोग करें।

<Tabs>
  <Tab title="सॉकेट मोड (डिफ़ॉल्ट)">
    <Steps>
      <Step title="नया Slack ऐप बनाएँ">
        [api.slack.com/apps](https://api.slack.com/apps/new) खोलें → **Create New App** → **From a manifest** → अपना वर्कस्पेस चुनें → नीचे दिए गए मैनिफ़ेस्ट में से एक पेस्ट करें → **Next** → **Create**।

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw के लिए Slack कनेक्टर"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack सहायक थ्रेड को OpenClaw एजेंटों से जोड़ता है।",
      "suggested_prompts": [
        { "title": "आप क्या कर सकते हैं?", "message": "आप किसमें मेरी सहायता कर सकते हैं?" },
        {
          "title": "इस चैनल का सारांश बनाएँ",
          "message": "इस चैनल की हाल की गतिविधि का सारांश बनाएँ।"
        },
        { "title": "उत्तर का मसौदा बनाएँ", "message": "उत्तर का मसौदा बनाने में मेरी सहायता करें।" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw को संदेश भेजें",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw के लिए Slack कनेक्टर"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack सहायक थ्रेड को OpenClaw एजेंटों से जोड़ता है।",
      "suggested_prompts": [
        { "title": "आप क्या कर सकते हैं?", "message": "आप किसमें मेरी सहायता कर सकते हैं?" },
        {
          "title": "इस चैनल का सारांश बनाएँ",
          "message": "इस चैनल की हाल की गतिविधि का सारांश बनाएँ।"
        },
        { "title": "उत्तर का मसौदा बनाएँ", "message": "उत्तर का मसौदा बनाने में मेरी सहायता करें।" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw को संदेश भेजें",
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
          **अनुशंसित** Slack Plugin के पूर्ण फ़ीचर सेट से मेल खाता है: App Home, स्लैश कमांड, फ़ाइलें, प्रतिक्रियाएँ, पिन, समूह DM और इमोजी/उपयोगकर्ता-समूह रीड। जब वर्कस्पेस नीति स्कोप सीमित करती है, तब **न्यूनतम** चुनें—यह DM, चैनल/समूह इतिहास, उल्लेख और स्लैश कमांड को शामिल करता है, लेकिन फ़ाइलें, प्रतिक्रियाएँ, पिन, समूह-DM (`mpim:*`), `emoji:read`, और `usergroups:read` को हटा देता है। प्रत्येक स्कोप के औचित्य और अतिरिक्त स्लैश कमांड जैसे योगात्मक विकल्पों के लिए [मैनिफ़ेस्ट और स्कोप जाँच-सूची](#manifest-and-scope-checklist) देखें।
        </Note>

        Slack द्वारा ऐप बनाने के बाद:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write` जोड़ें, सहेजें और App-Level Token कॉपी करें।
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

        एन्वायरनमेंट फ़ॉलबैक (केवल डिफ़ॉल्ट खाता):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Gateway प्रारंभ करें">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP अनुरोध URL">
    <Steps>
      <Step title="नया Slack ऐप बनाएँ">
        [api.slack.com/apps](https://api.slack.com/apps/new) खोलें → **Create New App** → **From a manifest** → अपना वर्कस्पेस चुनें → नीचे दिए गए मैनिफ़ेस्ट में से एक पेस्ट करें → `https://gateway-host.example.com/slack/events` को अपने सार्वजनिक Gateway URL से बदलें → **Next** → **Create**।

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw के लिए Slack कनेक्टर"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack सहायक थ्रेड को OpenClaw एजेंटों से जोड़ता है।",
      "suggested_prompts": [
        { "title": "आप क्या कर सकते हैं?", "message": "आप किसमें मेरी सहायता कर सकते हैं?" },
        {
          "title": "इस चैनल का सारांश बनाएँ",
          "message": "इस चैनल की हाल की गतिविधि का सारांश बनाएँ।"
        },
        { "title": "उत्तर का मसौदा बनाएँ", "message": "उत्तर का मसौदा बनाने में मेरी सहायता करें।" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw को संदेश भेजें",
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
    "description": "OpenClaw के लिए Slack कनेक्टर"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack सहायक थ्रेड को OpenClaw एजेंट से जोड़ता है।",
      "suggested_prompts": [
        { "title": "आप क्या कर सकते हैं?", "message": "आप मेरी किसमें सहायता कर सकते हैं?" },
        {
          "title": "इस चैनल का सारांश दें",
          "message": "इस चैनल की हाल की गतिविधि का सारांश दें।"
        },
        { "title": "उत्तर का मसौदा बनाएँ", "message": "उत्तर का मसौदा बनाने में मेरी सहायता करें।" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw को संदेश भेजें",
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
          **अनुशंसित** Slack Plugin के पूर्ण फ़ीचर सेट से मेल खाता है; **न्यूनतम** प्रतिबंधात्मक वर्कस्पेस के लिए फ़ाइलें, प्रतिक्रियाएँ, पिन, समूह-DM (`mpim:*`), `emoji:read`, और `usergroups:read` हटा देता है। प्रत्येक स्कोप के औचित्य के लिए [मैनिफ़ेस्ट और स्कोप जाँच-सूची](#manifest-and-scope-checklist) देखें।
        </Note>

        <Info>
          तीनों URL फ़ील्ड (`slash_commands[].url`, `event_subscriptions.request_url`, और `interactivity.request_url` / `message_menu_options_url`) एक ही OpenClaw एंडपॉइंट की ओर संकेत करते हैं। Slack की मैनिफ़ेस्ट स्कीमा में उनके अलग-अलग नाम होना आवश्यक है, लेकिन OpenClaw पेलोड प्रकार के अनुसार रूट करता है, इसलिए एक `webhookPath` (डिफ़ॉल्ट `/slack/events`) पर्याप्त है। `slash_commands[].url` के बिना स्लैश कमांड HTTP मोड में बिना किसी सूचना के कोई कार्रवाई नहीं करते।
        </Info>

        Slack द्वारा ऐप बनाए जाने के बाद:

        - **Basic Information → App Credentials**: अनुरोध सत्यापन के लिए **Signing Secret** कॉपी करें।
        - **Install App -> Install to Workspace**: Bot User OAuth Token कॉपी करें।

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
        बहु-अकाउंट HTTP के लिए अद्वितीय Webhook पथों का उपयोग करें

        प्रत्येक अकाउंट को एक अलग `webhookPath` (डिफ़ॉल्ट `/slack/events`) दें, ताकि पंजीकरण परस्पर न टकराएँ।
        </Note>

      </Step>

      <Step title="Gateway प्रारंभ करें">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode ट्रांसपोर्ट ट्यूनिंग

OpenClaw, Socket Mode के लिए Slack SDK क्लाइंट का पोंग टाइमआउट डिफ़ॉल्ट रूप से 15 सेकंड पर सेट करता है। ट्रांसपोर्ट सेटिंग केवल तभी ओवरराइड करें, जब आपको वर्कस्पेस- या होस्ट-विशिष्ट ट्यूनिंग की आवश्यकता हो:

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

इसका उपयोग केवल उन Socket Mode वर्कस्पेस के लिए करें जो Slack वेबसॉकेट पोंग/सर्वर-पिंग टाइमआउट लॉग करते हैं या ऐसे होस्ट पर चलते हैं जहाँ इवेंट-लूप की ज्ञात भुखमरी होती है। SDK द्वारा क्लाइंट पिंग भेजे जाने के बाद `clientPingTimeout` पोंग की प्रतीक्षा अवधि है; `serverPingTimeout` Slack सर्वर पिंग की प्रतीक्षा अवधि है। ऐप संदेश और इवेंट अनुप्रयोग की स्थिति बने रहते हैं, ट्रांसपोर्ट सक्रियता के संकेत नहीं।

टिप्पणियाँ:

- `socketMode` को HTTP Request URL मोड में अनदेखा किया जाता है।
- मूल `channels.slack.socketMode` सेटिंग सभी Slack अकाउंट पर लागू होती हैं, जब तक उन्हें ओवरराइड न किया जाए। प्रत्येक अकाउंट के ओवरराइड `channels.slack.accounts.<accountId>.socketMode` का उपयोग करते हैं; क्योंकि यह एक ऑब्जेक्ट ओवरराइड है, उस अकाउंट के लिए आवश्यक प्रत्येक सॉकेट ट्यूनिंग फ़ील्ड शामिल करें।
- केवल `clientPingTimeout` का OpenClaw डिफ़ॉल्ट (`15000`) है। `serverPingTimeout` और `pingPongLoggingEnabled` केवल कॉन्फ़िगर किए जाने पर Slack SDK को दिए जाते हैं।
- Socket Mode पुनः प्रारंभ बैकऑफ़ लगभग 2 सेकंड से शुरू होता है और लगभग 30 सेकंड पर सीमित हो जाता है। पुनर्प्राप्ति योग्य प्रारंभ, प्रारंभ-प्रतीक्षा और डिस्कनेक्ट विफलताओं पर चैनल के रुकने तक पुनः प्रयास किया जाता है। अमान्य प्रमाणीकरण, निरस्त टोकन या अनुपलब्ध स्कोप जैसी स्थायी अकाउंट और क्रेडेंशियल त्रुटियाँ हमेशा पुनः प्रयास करने के बजाय तुरंत विफल हो जाती हैं।

## मैनिफ़ेस्ट और स्कोप जाँच-सूची

मूल Slack ऐप मैनिफ़ेस्ट Socket Mode और HTTP Request URLs के लिए समान है। केवल `settings` ब्लॉक (और स्लैश कमांड `url`) अलग है।

मूल मैनिफ़ेस्ट (Socket Mode डिफ़ॉल्ट):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw के लिए Slack कनेक्टर"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack सहायक थ्रेड को OpenClaw एजेंट से जोड़ता है।",
      "suggested_prompts": [
        { "title": "आप क्या कर सकते हैं?", "message": "आप मेरी किसमें सहायता कर सकते हैं?" },
        {
          "title": "इस चैनल का सारांश दें",
          "message": "इस चैनल की हाल की गतिविधि का सारांश दें।"
        },
        { "title": "उत्तर का मसौदा बनाएँ", "message": "उत्तर का मसौदा बनाने में मेरी सहायता करें।" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw को संदेश भेजें",
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

**HTTP Request URLs मोड** के लिए, `settings` को HTTP संस्करण से बदलें और प्रत्येक स्लैश कमांड में `url` जोड़ें। सार्वजनिक URL आवश्यक है:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw को संदेश भेजें",
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

### अतिरिक्त मैनिफ़ेस्ट सेटिंग

उपरोक्त डिफ़ॉल्ट का विस्तार करने वाले विभिन्न फ़ीचर उपलब्ध कराएँ।

डिफ़ॉल्ट मैनिफ़ेस्ट Slack App Home के **Home** टैब को सक्षम करता है और `app_home_opened` की सदस्यता लेता है। जब कोई वर्कस्पेस सदस्य Home टैब खोलता है, तो OpenClaw `views.publish` वाला एक सुरक्षित डिफ़ॉल्ट Home दृश्य प्रकाशित करता है; इसमें कोई वार्तालाप पेलोड या निजी कॉन्फ़िगरेशन शामिल नहीं होता। एकल स्लैश कमांड मोड सक्षम होने पर, कमांड संकेत `channels.slack.slashCommand.name` का उपयोग करता है; नेटिव कमांड या बिना स्लैश कमांड वाले इंस्टॉलेशन उस संकेत को छोड़ देते हैं। Slack DM के लिए **Messages** टैब सक्षम रहता है। मैनिफ़ेस्ट `features.assistant_view`, `assistant:write`, `assistant_thread_started`, और `assistant_thread_context_changed` के साथ Slack सहायक थ्रेड भी सक्षम करता है; सहायक थ्रेड अपने अलग OpenClaw थ्रेड सत्रों पर रूट होते हैं और Slack द्वारा प्रदान किया गया थ्रेड संदर्भ एजेंट के लिए उपलब्ध रखते हैं।

<AccordionGroup>
  <Accordion title="वैकल्पिक नेटिव स्लैश कमांड">

    सूक्ष्म अंतर के साथ एकल कॉन्फ़िगर किए गए कमांड के बजाय एकाधिक [नेटिव स्लैश कमांड](#commands-and-slash-behavior) का उपयोग किया जा सकता है:

    - `/status` के बजाय `/agentstatus` का उपयोग करें, क्योंकि `/status` कमांड आरक्षित है।
    - किसी Slack ऐप पर एक साथ 25 से अधिक स्लैश कमांड पंजीकृत नहीं किए जा सकते (Slack प्लेटफ़ॉर्म सीमा)।

    अपने मौजूदा `features.slash_commands` अनुभाग को [उपलब्ध कमांड](/hi/tools/slash-commands#command-list) के एक उपसमुच्चय से बदलें:

    <Tabs>
      <Tab title="Socket Mode (डिफ़ॉल्ट)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "नया सत्र शुरू करें",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "वर्तमान सत्र रीसेट करें"
    },
    {
      "command": "/compact",
      "description": "सत्र संदर्भ को संक्षिप्त करें",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "वर्तमान रन रोकें"
    },
    {
      "command": "/session",
      "description": "थ्रेड-बाइंडिंग की समाप्ति प्रबंधित करें",
      "usage_hint": "idle <duration|off> या max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "चिंतन स्तर सेट करें",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "विस्तृत आउटपुट टॉगल करें",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "तेज़ मोड दिखाएँ या सेट करें",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "तर्क की दृश्यता टॉगल करें",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "उन्नत मोड टॉगल करें",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "exec के डिफ़ॉल्ट दिखाएँ या सेट करें",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "लंबित अनुमोदन अनुरोध स्वीकार या अस्वीकार करें",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "मॉडल दिखाएँ या सेट करें",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "प्रदाताओं/मॉडलों की सूची दिखाएँ",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "संक्षिप्त सहायता सारांश दिखाएँ"
    },
    {
      "command": "/commands",
      "description": "जनरेट की गई कमांड सूची दिखाएँ"
    },
    {
      "command": "/tools",
      "description": "दिखाएँ कि वर्तमान एजेंट अभी क्या उपयोग कर सकता है",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "रनटाइम स्थिति दिखाएँ, जिसमें उपलब्ध होने पर प्रदाता का उपयोग/कोटा शामिल हो"
    },
    {
      "command": "/tasks",
      "description": "वर्तमान सत्र के सक्रिय/हाल के बैकग्राउंड कार्यों की सूची दिखाएँ"
    },
    {
      "command": "/context",
      "description": "समझाएँ कि संदर्भ कैसे संयोजित किया जाता है",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "अपनी प्रेषक पहचान दिखाएँ"
    },
    {
      "command": "/skill",
      "description": "नाम से कोई स्किल चलाएँ",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "सत्र संदर्भ बदले बिना कोई सहायक प्रश्न पूछें",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "सत्र संदर्भ बदले बिना कोई सहायक प्रश्न पूछें",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "उपयोग पादलेख नियंत्रित करें या लागत सारांश दिखाएँ",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP अनुरोध URL">
        ऊपर दिए गए Socket Mode वाली समान `slash_commands` सूची का उपयोग करें और प्रत्येक प्रविष्टि में `"url": "https://gateway-host.example.com/slack/events"` जोड़ें। उदाहरण:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "नया सत्र शुरू करें",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "संक्षिप्त सहायता सारांश दिखाएँ",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        सूची की प्रत्येक कमांड पर वही `url` मान दोहराएँ।

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="वैकल्पिक लेखकीय स्कोप (लेखन क्रियाएँ)">
    यदि आप चाहते हैं कि आउटगोइंग संदेश डिफ़ॉल्ट Slack ऐप पहचान के बजाय सक्रिय एजेंट पहचान (कस्टम उपयोगकर्ता नाम और आइकन) का उपयोग करें, तो `chat:write.customize` बॉट स्कोप जोड़ें।

    यदि आप इमोजी आइकन का उपयोग करते हैं, तो Slack को `:emoji_name:` सिंटैक्स अपेक्षित है।

  </Accordion>
  <Accordion title="वैकल्पिक उपयोगकर्ता-टोकन स्कोप (पठन क्रियाएँ)">
    यदि आप `channels.slack.userToken` कॉन्फ़िगर करते हैं, तो सामान्य पठन स्कोप हैं:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (यदि आप Slack खोज पठन पर निर्भर हैं)

  </Accordion>
</AccordionGroup>

## टोकन मॉडल

- Socket Mode के लिए `botToken` + `appToken` आवश्यक हैं।
- HTTP मोड के लिए `botToken` + `signingSecret` आवश्यक हैं।
- Relay मोड के लिए `botToken` के साथ `relay.url`, `relay.authToken`, और `relay.gatewayId` आवश्यक हैं; यह ऐप टोकन या हस्ताक्षर गोपनीय मान का उपयोग नहीं करता।
- `botToken`, `appToken`, `signingSecret`, `relay.authToken`, और `userToken` सादे टेक्स्ट
  स्ट्रिंग या SecretRef ऑब्जेक्ट स्वीकार करते हैं।
- कॉन्फ़िगरेशन टोकन परिवेश फ़ॉलबैक को ओवरराइड करते हैं।
- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, और `SLACK_USER_TOKEN` परिवेश फ़ॉलबैक में से प्रत्येक केवल डिफ़ॉल्ट खाते पर लागू होता है।
- `userToken` का डिफ़ॉल्ट केवल-पठन व्यवहार (`userTokenReadOnly: true`) है।

स्थिति स्नैपशॉट का व्यवहार:

- Slack खाता निरीक्षण प्रत्येक क्रेडेंशियल के `*Source` और `*Status`
  फ़ील्ड ट्रैक करता है (`botToken`, `appToken`, `signingSecret`, `userToken`)।
- स्थिति `available`, `configured_unavailable`, या `missing` होती है।
- `configured_unavailable` का अर्थ है कि खाता SecretRef
  या किसी अन्य गैर-इनलाइन गोपनीय स्रोत के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वर्तमान कमांड/रनटाइम पथ
  वास्तविक मान को हल नहीं कर सका।
- HTTP मोड में, `signingSecretStatus` शामिल होता है; Socket Mode में
  आवश्यक युग्म `botTokenStatus` + `appTokenStatus` है।

<Tip>
क्रियाओं/डायरेक्टरी पठन के लिए, कॉन्फ़िगर होने पर उपयोगकर्ता टोकन को प्राथमिकता दी जा सकती है। लेखन के लिए, बॉट टोकन को प्राथमिकता मिलती रहती है; उपयोगकर्ता-टोकन से लेखन केवल तभी अनुमत है जब `userTokenReadOnly: false` और बॉट टोकन अनुपलब्ध हो।
</Tip>

## क्रियाएँ और नियंत्रण

Slack क्रियाएँ `channels.slack.actions.*` द्वारा नियंत्रित होती हैं।

वर्तमान Slack टूलिंग में उपलब्ध क्रिया समूह:

| समूह       | डिफ़ॉल्ट |
| ---------- | ------- |
| messages   | सक्षम |
| reactions  | सक्षम |
| pins       | सक्षम |
| memberInfo | सक्षम |
| emojiList  | सक्षम |

वर्तमान Slack संदेश क्रियाओं में `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, और `emoji-list` शामिल हैं। `download-file` इनबाउंड फ़ाइल प्लेसहोल्डर में दिखाए गए Slack फ़ाइल ID स्वीकार करता है और छवियों के लिए छवि पूर्वावलोकन या अन्य फ़ाइल प्रकारों के लिए स्थानीय फ़ाइल मेटाडेटा लौटाता है।

## अभिगम नियंत्रण और रूटिंग

<Tabs>
  <Tab title="DM नीति">
    `channels.slack.dmPolicy` DM अभिगम नियंत्रित करता है। `channels.slack.allowFrom` प्रामाणिक DM अनुमति-सूची है।

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist`
    - `open` (इसके लिए `channels.slack.allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    DM फ़्लैग:

    - `dm.enabled` (डिफ़ॉल्ट true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (विरासती)
    - `dm.groupEnabled` (समूह DM का डिफ़ॉल्ट false)
    - `dm.groupChannels` (वैकल्पिक MPIM अनुमति-सूची)

    एकाधिक खातों की प्राथमिकता:

    - `channels.slack.accounts.default.allowFrom` केवल `default` खाते पर लागू होता है।
    - नामित खाते अपना `allowFrom` सेट न होने पर `channels.slack.allowFrom` को इनहेरिट करते हैं।
    - नामित खाते `channels.slack.accounts.default.allowFrom` को इनहेरिट नहीं करते।

    विरासती `channels.slack.dm.policy` और `channels.slack.dm.allowFrom` अब भी संगतता के लिए पढ़े जाते हैं। जब अभिगम बदले बिना ऐसा करना संभव होता है, तो `openclaw doctor --fix` उन्हें `dmPolicy` और `allowFrom` में माइग्रेट करता है।

    DM में पेयरिंग `openclaw pairing approve slack <code>` का उपयोग करती है।

  </Tab>

  <Tab title="चैनल नीति">
    `channels.slack.groupPolicy` चैनल प्रबंधन नियंत्रित करता है:

    - `open`
    - `allowlist`
    - `disabled`

    चैनल अनुमति-सूची `channels.slack.channels` के अंतर्गत रहती है और कॉन्फ़िगरेशन कुंजियों के रूप में **स्थिर Slack चैनल ID का उपयोग करना अनिवार्य है** (उदाहरण के लिए `C12345678`)।

    रनटाइम नोट: यदि `channels.slack` पूरी तरह अनुपस्थित है (केवल-परिवेश सेटअप), तो रनटाइम `groupPolicy="allowlist"` पर फ़ॉलबैक करता है और चेतावनी लॉग करता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

    नाम/ID समाधान:

    - टोकन अभिगम की अनुमति होने पर चैनल अनुमति-सूची प्रविष्टियाँ और DM अनुमति-सूची प्रविष्टियाँ स्टार्टअप पर हल की जाती हैं
    - अनसुलझी चैनल-नाम प्रविष्टियाँ कॉन्फ़िगर किए गए रूप में रखी जाती हैं, लेकिन डिफ़ॉल्ट रूप से रूटिंग के लिए अनदेखी की जाती हैं
    - इनबाउंड प्राधिकरण और चैनल रूटिंग डिफ़ॉल्ट रूप से ID-प्रथम हैं; सीधे उपयोगकर्ता नाम/स्लग मिलान के लिए `channels.slack.dangerouslyAllowNameMatching: true` आवश्यक है

    <Warning>
    नाम-आधारित कुंजियाँ (`#channel-name` या `channel-name`) `groupPolicy: "allowlist"` के अंतर्गत **मेल नहीं खातीं**। चैनल लुकअप डिफ़ॉल्ट रूप से ID-प्रथम है, इसलिए नाम-आधारित कुंजी कभी सफलतापूर्वक रूट नहीं होगी और उस चैनल के सभी संदेश बिना सूचना के अवरुद्ध हो जाएँगे। यह `groupPolicy: "open"` से अलग है, जहाँ रूटिंग के लिए चैनल कुंजी आवश्यक नहीं होती और नाम-आधारित कुंजी काम करती हुई प्रतीत होती है।

    कुंजी के रूप में हमेशा Slack चैनल ID का उपयोग करें। इसे खोजने के लिए: Slack में चैनल पर राइट-क्लिक करें → **Copy link** — ID (`C...`) URL के अंत में दिखाई देती है।

    सही:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    गलत (`groupPolicy: "allowlist"` के अंतर्गत बिना सूचना के अवरुद्ध):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="उल्लेख और चैनल उपयोगकर्ता">
    चैनल संदेश डिफ़ॉल्ट रूप से उल्लेख द्वारा नियंत्रित होते हैं।

    उल्लेख स्रोत:

    - स्पष्ट ऐप उल्लेख (`<@botId>`)
    - Slack उपयोगकर्ता-समूह उल्लेख (`<!subteam^S...>`), जब बॉट उपयोगकर्ता उस उपयोगकर्ता समूह का सदस्य हो; इसके लिए `usergroups:read` आवश्यक है
    - उल्लेख रेगेक्स पैटर्न (`agents.list[].groupChat.mentionPatterns`, फ़ॉलबैक `messages.groupChat.mentionPatterns`)
    - बॉट थ्रेड को अप्रत्यक्ष उत्तर देने का व्यवहार (जब `thread.requireExplicitMention`, `true` हो तो अक्षम)

    प्रति-चैनल नियंत्रण (`channels.slack.channels.<id>`; नाम केवल स्टार्टअप समाधान या `dangerouslyAllowNameMatching` के माध्यम से):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; इस चैनल के लिए खाता/चैट-प्रकार उत्तर मोड को ओवरराइड करता है)
    - `users` (अनुमति-सूची)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` कुंजी प्रारूप: `channel:`, `id:`, `e164:`, `username:`, `name:`, या `"*"` वाइल्डकार्ड
      (विरासती उपसर्ग-रहित कुंजियाँ अब भी केवल `id:` पर मैप होती हैं)

    `ignoreOtherMentions` (डिफ़ॉल्ट `false`) उन चैनल संदेशों को छोड़ देता है जो किसी अन्य उपयोगकर्ता या उपयोगकर्ता समूह का उल्लेख करते हैं, लेकिन इस बॉट का नहीं। DMs और समूह DMs (MPIMs) अप्रभावित रहते हैं। फ़िल्टर को `auth.test` से समाधान किया गया बॉट उपयोगकर्ता ID चाहिए; यदि वह पहचान उपलब्ध नहीं है (उदाहरण के लिए, केवल उपयोगकर्ता-टोकन वाली पहचान), तो गेट खुला रह जाता है और संदेश बिना बदलाव के आगे बढ़ जाते हैं।

    `allowBots` चैनलों और निजी चैनलों के लिए रूढ़िवादी है: बॉट द्वारा लिखे गए रूम संदेश केवल तभी स्वीकार किए जाते हैं, जब भेजने वाला बॉट उस रूम की `users` अनुमति-सूची में स्पष्ट रूप से सूचीबद्ध हो, या जब `channels.slack.allowFrom` से कम-से-कम एक स्पष्ट Slack स्वामी ID वर्तमान में रूम का सदस्य हो। वाइल्डकार्ड और प्रदर्शन-नाम वाली स्वामी प्रविष्टियाँ स्वामी की उपस्थिति की शर्त पूरी नहीं करतीं। स्वामी की उपस्थिति Slack `conversations.members` का उपयोग करती है; सुनिश्चित करें कि ऐप के पास रूम प्रकार के अनुरूप पढ़ने का स्कोप हो (सार्वजनिक चैनलों के लिए `channels:read`, निजी चैनलों के लिए `groups:read`)। यदि सदस्य लुकअप विफल होता है, तो OpenClaw बॉट द्वारा लिखा गया रूम संदेश छोड़ देता है।

    स्वीकार किए गए, बॉट द्वारा लिखे गए Slack संदेश साझा [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection) का उपयोग करते हैं। डिफ़ॉल्ट बजट के लिए `channels.defaults.botLoopProtection` कॉन्फ़िगर करें, फिर जब किसी वर्कस्पेस या चैनल को अलग सीमा चाहिए, तो `channels.slack.botLoopProtection` या `channels.slack.channels.<id>.botLoopProtection` से ओवरराइड करें।

  </Tab>
</Tabs>

## थ्रेडिंग, सत्र और उत्तर टैग

- DMs को `direct` के रूप में रूट किया जाता है; चैनलों को `channel` के रूप में; MPIMs को `group` के रूप में।
- Slack रूट बाइंडिंग कच्ची पीयर IDs के साथ-साथ `channel:C12345678`, `user:U12345678`, और `<@U12345678>` जैसे Slack लक्ष्य रूप स्वीकार करती हैं।
- डिफ़ॉल्ट `session.dmScope=main` के साथ, Slack DMs एजेंट के मुख्य सत्र में समाहित हो जाते हैं।
- चैनल सत्र: `agent:<agentId>:slack:channel:<channelId>`।
- सामान्य शीर्ष-स्तरीय चैनल संदेश प्रति-चैनल सत्र में बने रहते हैं, भले ही `replyToMode`, `off` से अलग हो।
- Slack थ्रेड उत्तर सत्र प्रत्ययों (`:thread:<threadTs>`) के लिए पैरेंट Slack `thread_ts` का उपयोग करते हैं, भले ही आउटबाउंड उत्तर थ्रेडिंग को `replyToMode="off"` से अक्षम किया गया हो।
- जब किसी योग्य शीर्ष-स्तरीय चैनल रूट से दृश्यमान Slack थ्रेड शुरू होने की अपेक्षा होती है, तो OpenClaw उसे `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` में सीड करता है, ताकि रूट और बाद के थ्रेड उत्तर एक ही OpenClaw सत्र साझा करें। यह `app_mention` ईवेंट, स्पष्ट बॉट या कॉन्फ़िगर किए गए उल्लेख-पैटर्न मिलान, और गैर-`off` `replyToMode` वाले `requireMention: false` चैनलों पर लागू होता है।
- `channels.slack.thread.historyScope` का डिफ़ॉल्ट `thread` है; `thread.inheritParent` का डिफ़ॉल्ट `false` है।
- `channels.slack.thread.initialHistoryLimit` नियंत्रित करता है कि नया थ्रेड सत्र शुरू होने पर कितने मौजूदा थ्रेड संदेश प्राप्त किए जाएँ (डिफ़ॉल्ट `20`; अक्षम करने के लिए `0` सेट करें)।
- `channels.slack.thread.requireExplicitMention` (डिफ़ॉल्ट `false`): जब `true` हो, तो अंतर्निहित थ्रेड उल्लेखों को दबाएँ, ताकि बॉट थ्रेड के भीतर केवल स्पष्ट `@bot` उल्लेखों का उत्तर दे, भले ही बॉट पहले से उस थ्रेड में भाग ले चुका हो। इसके बिना, बॉट की भागीदारी वाले थ्रेड के उत्तर `requireMention` गेटिंग को बायपास करते हैं।

उत्तर थ्रेडिंग नियंत्रण:

- `channels.slack.channels.<id>.replyToMode`: Slack चैनल/निजी-चैनल संदेशों के लिए प्रति-चैनल ओवरराइड
- `channels.slack.replyToMode`: `off|first|all|batched` (डिफ़ॉल्ट `off`)
- `channels.slack.replyToModeByChatType`: प्रति `direct|group|channel`
- प्रत्यक्ष चैट के लिए लीगेसी फ़ॉलबैक: `channels.slack.dm.replyToMode`

मैन्युअल उत्तर टैग समर्थित हैं:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` टूल से स्पष्ट Slack थ्रेड उत्तरों के लिए, `replyBroadcast: true` को `action: "send"` और `threadId` या `replyTo` के साथ सेट करें, ताकि Slack से थ्रेड उत्तर को पैरेंट चैनल पर भी प्रसारित करने को कहा जा सके। यह Slack के `chat.postMessage` `reply_broadcast` फ़्लैग से मैप होता है और केवल टेक्स्ट या Block Kit प्रेषणों के लिए समर्थित है, मीडिया अपलोड के लिए नहीं।

जब कोई `message` टूल कॉल Slack थ्रेड के भीतर चलता है और उसी चैनल को लक्षित करता है, तो OpenClaw सामान्यतः प्रभावी अकाउंट, चैट-प्रकार या प्रति-चैनल `replyToMode` के अनुसार वर्तमान Slack थ्रेड को इनहेरिट करता है। स्वचालित उत्तर और समान-चैनल `send` या `upload-file` कॉल उसी प्रति-चैनल ओवरराइड का उपयोग करते हैं। इसके बजाय नया पैरेंट-चैनल संदेश बाध्य करने के लिए `action: "send"` या `action: "upload-file"` पर `topLevel: true` सेट करें। `threadId: null` को समान शीर्ष-स्तरीय ऑप्ट-आउट के रूप में स्वीकार किया जाता है।

<Note>
`replyToMode="off"` स्पष्ट `[[reply_to_*]]` टैग सहित आउटबाउंड Slack उत्तर थ्रेडिंग को अक्षम करता है। यह इनबाउंड Slack थ्रेड सत्रों को समतल नहीं करता: Slack थ्रेड के भीतर पहले से पोस्ट किए गए संदेश अब भी `:thread:<threadTs>` सत्र में रूट होते हैं। यह Telegram से अलग है, जहाँ `"off"` मोड में भी स्पष्ट टैग का पालन किया जाता है। Slack थ्रेड संदेशों को चैनल से छिपाते हैं, जबकि Telegram उत्तर इनलाइन दिखाई देते रहते हैं।
</Note>

## अभिस्वीकृति प्रतिक्रियाएँ

OpenClaw द्वारा इनबाउंड संदेश संसाधित किए जाते समय `ackReaction` एक अभिस्वीकृति इमोजी भेजता है। `ackReactionScope` निर्धारित करता है कि वह इमोजी वास्तव में _कब_ भेजा जाए।

डिफ़ॉल्ट रूप से, अभिस्वीकृति स्थिर रहती है, जबकि Slack की नेटिव सहायक थ्रेड स्थिति बदलते लोडिंग संदेशों के साथ प्रगति दिखाती है। इसके बजाय कतारबद्ध/सोचने/टूल/पूर्ण/त्रुटि प्रतिक्रिया जीवनचक्र चुनने के लिए `messages.statusReactions.enabled: true` सेट करें।

### इमोजी (`ackReaction`)

समाधान क्रम:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- एजेंट पहचान इमोजी फ़ॉलबैक (`agents.list[].identity.emoji`, अन्यथा `"eyes"` / 👀)

टिप्पणियाँ:

- Slack शॉर्टकोड की अपेक्षा करता है (उदाहरण के लिए `"eyes"`)।
- Slack अकाउंट या वैश्विक स्तर पर प्रतिक्रिया अक्षम करने के लिए `""` का उपयोग करें।

### स्कोप (`messages.ackReactionScope`)

Slack प्रदाता `messages.ackReactionScope` से स्कोप पढ़ता है (डिफ़ॉल्ट `"group-mentions"`)। वर्तमान में Slack-अकाउंट या Slack-चैनल-स्तरीय ओवरराइड नहीं है; यह मान Gateway के लिए वैश्विक है।

मान:

- `"all"`: परिवेशी रूम ईवेंट सहित DMs और समूहों में प्रतिक्रिया दें।
- `"direct"`: केवल DMs में प्रतिक्रिया दें।
- `"group-all"`: परिवेशी रूम ईवेंट को छोड़कर प्रत्येक समूह संदेश पर प्रतिक्रिया दें (DMs नहीं)।
- `"group-mentions"` (डिफ़ॉल्ट): समूहों में प्रतिक्रिया दें, लेकिन केवल तभी जब बॉट का उल्लेख हो (या ऑप्ट-इन करने वाले समूह उल्लेखनीयों में हो)। **DMs शामिल नहीं हैं।**
- `"off"` / `"none"`: कभी प्रतिक्रिया न दें।

<Note>
डिफ़ॉल्ट स्कोप (`"group-mentions"`) प्रत्यक्ष संदेशों या परिवेशी रूम ईवेंट में अभिस्वीकृति प्रतिक्रियाएँ सक्रिय नहीं करता। इनबाउंड Slack DMs और शांत रूम ईवेंट पर कॉन्फ़िगर किया गया `ackReaction` (उदाहरण के लिए `"eyes"`) देखने के लिए, `messages.ackReactionScope` को `"all"` पर सेट करें। `messages.ackReactionScope` को Slack प्रदाता के स्टार्टअप पर पढ़ा जाता है, इसलिए बदलाव प्रभावी करने के लिए Gateway को पुनः आरंभ करना आवश्यक है।
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // DMs और समूहों में प्रतिक्रिया दें
  },
}
```

## टेक्स्ट स्ट्रीमिंग

`channels.slack.streaming` लाइव पूर्वावलोकन व्यवहार नियंत्रित करता है:

- `off`: लाइव पूर्वावलोकन स्ट्रीमिंग अक्षम करें।
- `partial` (डिफ़ॉल्ट): पूर्वावलोकन टेक्स्ट को नवीनतम आंशिक आउटपुट से बदलें।
- `block`: खंडित पूर्वावलोकन अपडेट जोड़ें।
- `progress`: जनरेट करते समय प्रगति स्थिति टेक्स्ट दिखाएँ, फिर अंतिम टेक्स्ट भेजें।
- `streaming.preview.toolProgress`: ड्राफ़्ट पूर्वावलोकन सक्रिय होने पर, टूल/प्रगति अपडेट को उसी संपादित पूर्वावलोकन संदेश में रूट करें (डिफ़ॉल्ट: `true`)। अलग टूल/प्रगति संदेश बनाए रखने के लिए `false` सेट करें।
- `streaming.preview.commandText` / `streaming.progress.commandText`: कच्चे कमांड/निष्पादन टेक्स्ट को छिपाते हुए संक्षिप्त टूल-प्रगति पंक्तियाँ बनाए रखने के लिए `status` पर सेट करें (डिफ़ॉल्ट: `raw`)।

संक्षिप्त प्रगति पंक्तियाँ बनाए रखते हुए कच्चा कमांड/निष्पादन टेक्स्ट छिपाएँ:

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

जब `channels.slack.streaming.mode`, `partial` हो, तब `channels.slack.streaming.nativeTransport` Slack की नेटिव टेक्स्ट स्ट्रीमिंग को नियंत्रित करता है (डिफ़ॉल्ट: `true`)।

Slack के नेटिव प्रगति टास्क कार्ड प्रगति मोड के लिए ऑप्ट-इन हैं। कार्य चलने के दौरान Slack-नेटिव योजना/टास्क कार्ड भेजने और पूर्ण होने पर उसी टास्क कार्ड को अपडेट करने के लिए `channels.slack.streaming.progress.nativeTaskCards` को `true` तथा `channels.slack.streaming.mode="progress"` के साथ सेट करें। इस फ़्लैग के बिना, प्रगति मोड पोर्टेबल ड्राफ़्ट-पूर्वावलोकन व्यवहार बनाए रखता है।

- नेटिव टेक्स्ट स्ट्रीमिंग और Slack सहायक थ्रेड स्थिति दिखने के लिए उत्तर थ्रेड उपलब्ध होना चाहिए। थ्रेड चयन अब भी `replyToMode` का पालन करता है।
- नेटिव स्ट्रीमिंग अनुपलब्ध होने या उत्तर थ्रेड न होने पर भी चैनल, समूह-चैट और शीर्ष-स्तरीय DM रूट सामान्य ड्राफ़्ट पूर्वावलोकन का उपयोग कर सकते हैं।
- शीर्ष-स्तरीय Slack DMs डिफ़ॉल्ट रूप से थ्रेड से बाहर रहते हैं, इसलिए वे Slack का थ्रेड-शैली नेटिव स्ट्रीम/स्थिति पूर्वावलोकन नहीं दिखाते; इसके बजाय OpenClaw DM में ड्राफ़्ट पूर्वावलोकन पोस्ट और संपादित करता है।
- मीडिया और गैर-टेक्स्ट पेलोड सामान्य डिलीवरी पर फ़ॉलबैक करते हैं।
- मीडिया/त्रुटि अंतिम संदेश लंबित पूर्वावलोकन संपादनों को रद्द करते हैं; योग्य टेक्स्ट/ब्लॉक अंतिम संदेश केवल तभी फ़्लश होते हैं, जब वे पूर्वावलोकन को उसी स्थान पर संपादित कर सकें।
- यदि उत्तर के बीच में स्ट्रीमिंग विफल होती है, तो OpenClaw शेष पेलोड के लिए सामान्य डिलीवरी पर फ़ॉलबैक करता है।

Slack नेटिव टेक्स्ट स्ट्रीमिंग के बजाय ड्राफ़्ट पूर्वावलोकन का उपयोग करें:

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

Slack नेटिव प्रगति टास्क कार्ड के लिए ऑप्ट-इन करें:

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

लीगेसी कुंजियाँ:

- `channels.slack.streamMode` (`replace | status_final | append`), `channels.slack.streaming.mode` का लीगेसी उपनाम है।
- बूलियन `channels.slack.streaming`, `channels.slack.streaming.mode` और `channels.slack.streaming.nativeTransport` का लीगेसी उपनाम है।
- शीर्ष-स्तरीय `channels.slack.chunkMode` और `channels.slack.nativeStreaming`, `channels.slack.streaming.chunkMode` और `channels.slack.streaming.nativeTransport` के लीगेसी उपनाम हैं।
- लीगेसी उपनाम रनटाइम पर नहीं पढ़े जाते; स्थायी Slack स्ट्रीमिंग कॉन्फ़िगरेशन को कैननिकल कुंजियों में फिर से लिखने के लिए `openclaw doctor --fix` चलाएँ।

## टाइपिंग प्रतिक्रिया फ़ॉलबैक

जब OpenClaw किसी उत्तर को संसाधित कर रहा होता है, तब `typingReaction` इनबाउंड Slack संदेश में अस्थायी प्रतिक्रिया जोड़ता है और रन पूरा होने पर उसे हटा देता है। यह थ्रेड उत्तरों के बाहर सबसे अधिक उपयोगी है, क्योंकि थ्रेड उत्तर डिफ़ॉल्ट "टाइप कर रहा है..." स्थिति संकेतक का उपयोग करते हैं।

समाधान क्रम:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

टिप्पणियाँ:

- Slack शॉर्टकोड की अपेक्षा करता है (उदाहरण के लिए `"hourglass_flowing_sand"`)।
- प्रतिक्रिया सर्वोत्तम-प्रयास के आधार पर होती है और उत्तर या विफलता पथ पूरा होने के बाद स्वचालित रूप से सफ़ाई का प्रयास किया जाता है।

## वॉइस इनपुट

आज Slack में OpenClaw से बोलने के लिए, OpenClaw ऐप को Slack ऑडियो क्लिप भेजें। Slackbot का डिक्टेशन माइक्रोफ़ोन Slack के स्वामित्व वाली एक अलग सुविधा है, ऐप API नहीं।

- **[Slackbot ध्वनि श्रुतलेखन](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** उपयोगकर्ता की निजी Slackbot बातचीत के भीतर उपलब्ध होता है। Slack रिकॉर्डिंग को Slackbot प्रॉम्प्ट में बदलता है, लेकिन Events API के माध्यम से तृतीय-पक्ष Slack ऐप्स को कोई ऑडियो फ़ाइल, श्रुतलेखन इवेंट, प्रॉम्प्ट या इनपुट-स्रोत मार्कर जारी नहीं करता। OpenClaw Slack plugin इसे सक्षम या प्राप्त नहीं कर सकता।
- **[Slack ऑडियो क्लिप](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** संग्रहित Slack फ़ाइलें हैं, जिन्हें OpenClaw DM, चैनल या थ्रेड में पोस्ट किया जा सकता है। OpenClaw bot token से सुलभ क्लिप डाउनलोड करता है, Slack के क्लिप MIME मेटाडेटा को सामान्यीकृत करता है और उसे साझा [ऑडियो ट्रांसक्रिप्शन पाइपलाइन](/hi/nodes/audio) से भेजता है। अनुशंसित ऐप मैनिफ़ेस्ट में आवश्यक `files:read` स्कोप शामिल है।

ऑडियो क्लिप और Slackbot श्रुतलेखन की गोपनीयता संबंधी अर्थवत्ता अलग-अलग है: क्लिप Slack की फ़ाइल-प्रतिधारण नीति का पालन करती हैं और OpenClaw उन्हें ट्रांसक्रिप्शन के लिए डाउनलोड करता है, जबकि Slack के अनुसार श्रुतलेखन ऑडियो संग्रहित नहीं किया जाता।

`requireMention: true` वाले चैनल में, बिना कैप्शन वाली ऑडियो क्लिप कॉन्फ़िगर किए गए उल्लेख पैटर्न को बोलकर गेट की शर्त पूरी कर सकती है (`agents.list[].groupChat.mentionPatterns`, जो अनुपलब्ध होने पर `messages.groupChat.mentionPatterns` का उपयोग करता है)। OpenClaw क्लिप डाउनलोड या ट्रांसक्राइब करने से पहले प्रेषक को अधिकृत करता है, फिर उसे केवल तभी स्वीकार करता है जब ट्रांसक्रिप्ट मेल खाता हो। विफल या मेल न खाने वाला अनुमानित ट्रांसक्रिप्ट डाउनलोड की गई क्लिप के साथ हटा दिया जाता है; उसे चैनल इतिहास में बनाए नहीं रखा जाता। मूल Slack `@bot` पहचान का अनुमान वाणी से नहीं लगाया जा सकता, इसलिए बोले गए नाम का पैटर्न कॉन्फ़िगर करें या टाइप किया हुआ उल्लेख शामिल करें। यदि ट्रांसक्रिप्ट प्रतिध्वनि सक्षम है, तो प्रतिध्वनि केवल स्वीकार किए जाने के बाद भेजी जाती है।

## मीडिया, खंडन और डिलीवरी

<AccordionGroup>
  <Accordion title="इनबाउंड अटैचमेंट">
    Slack फ़ाइल अटैचमेंट Slack द्वारा होस्ट किए गए निजी URL से डाउनलोड किए जाते हैं (token-प्रमाणित अनुरोध प्रवाह) और फ़ेच सफल होने तथा आकार सीमाओं द्वारा अनुमति मिलने पर मीडिया स्टोर में लिखे जाते हैं। फ़ाइल प्लेसहोल्डर में Slack `fileId` शामिल होता है, ताकि एजेंट `download-file` से मूल फ़ाइल प्राप्त कर सकें।

    डाउनलोड सीमित निष्क्रियता और कुल टाइमआउट का उपयोग करते हैं। यदि Slack फ़ाइल प्राप्ति रुक जाती है या विफल होती है, तो OpenClaw संदेश संसाधित करना जारी रखता है और फ़ाइल प्लेसहोल्डर का उपयोग करता है।

    रनटाइम इनबाउंड आकार सीमा डिफ़ॉल्ट रूप से `20MB` होती है, जब तक कि `channels.slack.mediaMaxMb` से इसे ओवरराइड न किया जाए।

  </Accordion>

  <Accordion title="आउटबाउंड टेक्स्ट और फ़ाइलें">
    - टेक्स्ट खंड `channels.slack.textChunkLimit` का उपयोग करते हैं (डिफ़ॉल्ट `8000`, Slack की अपनी संदेश-लंबाई सीमा तक सीमित)
    - `channels.slack.streaming.chunkMode="newline"` पहले पैराग्राफ के आधार पर विभाजन सक्षम करता है
    - फ़ाइल प्रेषण Slack अपलोड API का उपयोग करते हैं और उनमें थ्रेड उत्तर (`thread_ts`) शामिल हो सकते हैं
    - लंबे फ़ाइल कैप्शन पहले Slack-सुरक्षित टेक्स्ट खंड को अपलोड टिप्पणी के रूप में उपयोग करते हैं और शेष खंडों को अनुवर्ती संदेशों के रूप में भेजते हैं
    - कॉन्फ़िगर होने पर आउटबाउंड मीडिया सीमा `channels.slack.mediaMaxMb` का पालन करती है; अन्यथा चैनल प्रेषण मीडिया पाइपलाइन से MIME-प्रकार के डिफ़ॉल्ट का उपयोग करते हैं

  </Accordion>

  <Accordion title="डिलीवरी लक्ष्य">
    पसंदीदा स्पष्ट लक्ष्य:

    - DM के लिए `user:<id>`
    - चैनलों के लिए `channel:<id>`

    केवल टेक्स्ट/ब्लॉक वाले Slack DM सीधे उपयोगकर्ता ID पर पोस्ट कर सकते हैं; फ़ाइल अपलोड और थ्रेड वाले प्रेषण पहले Slack conversation API के माध्यम से DM खोलते हैं, क्योंकि उन पथों को एक ठोस conversation ID की आवश्यकता होती है।

  </Accordion>
</AccordionGroup>

## कमांड और स्लैश व्यवहार

स्लैश कमांड Slack में या तो एकल कॉन्फ़िगर किए गए कमांड या कई मूल कमांड के रूप में दिखाई देते हैं। कमांड के डिफ़ॉल्ट बदलने के लिए `channels.slack.slashCommand` कॉन्फ़िगर करें:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

मूल कमांड के लिए आपके Slack ऐप में [अतिरिक्त मैनिफ़ेस्ट सेटिंग](#additional-manifest-settings) आवश्यक हैं और इसके बजाय वैश्विक कॉन्फ़िगरेशन में `channels.slack.commands.native: true` या `commands.native: true` से सक्षम किए जाते हैं।

- Slack के लिए मूल कमांड का स्वचालित मोड **बंद** है, इसलिए `commands.native: "auto"` Slack के मूल कमांड सक्षम नहीं करता।

```txt
/help
```

मूल आर्ग्युमेंट मेनू प्राथमिकता क्रम में निम्न में से किसी एक रूप में रेंडर होते हैं:

- 3-5 पर्याप्त रूप से छोटे विकल्प: एक ओवरफ़्लो ("...") मेनू
- 100 से अधिक विकल्प, जब एसिंक्रोनस विकल्प फ़िल्टरिंग उपलब्ध हो: बाहरी चयन
- 1-2 विकल्प, या ऐसा कोई विकल्प जिसका एन्कोड किया गया मान चयन के लिए बहुत लंबा हो: बटन ब्लॉक
- अन्यथा (6-100 विकल्प, या एसिंक्रोनस फ़िल्टरिंग के बिना 100 से अधिक): स्थिर चयन मेनू, प्रत्येक मेनू में 100 विकल्पों के खंडों में विभाजित

```txt
/think
```

स्लैश सत्र `agent:<agentId>:slack:slash:<userId>` जैसी पृथक कुंजियों का उपयोग करते हैं और फिर भी `CommandTargetSessionKey` का उपयोग करके कमांड निष्पादन को लक्ष्य बातचीत सत्र में रूट करते हैं।

## मूल चार्ट

Slack का सार्वजनिक [`data_visualization` Block Kit ब्लॉक](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
संदेशों में रेखा, बार, क्षेत्र और पाई चार्ट रेंडर करता है। OpenClaw पोर्टेबल
`presentation` `chart` ब्लॉक को उस मूल आकार में मैप करता है; सामान्य
`chat:write` संदेश एक्सेस के अतिरिक्त किसी OAuth स्कोप,
फ़ाइल अपलोड, इमेज रेंडरर या Slack कॉन्फ़िगरेशन की आवश्यकता नहीं होती।

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "तिमाही राजस्व",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "राजस्व", "values": [120, 145] }],
      "xLabel": "तिमाही"
    }
  ]
}
```

मूल रेंडरिंग से पहले Slack की सीमाएँ लागू की जाती हैं:

- शीर्षक और वैकल्पिक अक्ष लेबल: 50 वर्ण
- पाई: 1-12 धनात्मक खंड
- रेखा/बार/क्षेत्र: विशिष्ट नाम वाली 1-12 शृंखलाएँ और 1-20 साझा श्रेणियाँ
- खंड, श्रेणी और शृंखला लेबल: 20 वर्ण
- हर शृंखला में प्रत्येक श्रेणी के लिए एक सीमित मान होना आवश्यक है; गैर-पाई मान
  ऋणात्मक हो सकते हैं

प्रत्येक मूल चार्ट में स्क्रीन रीडर, सूचनाओं, सत्र मिररिंग और उन क्लाइंट के लिए
शीर्ष-स्तरीय टेक्स्ट निरूपण भी होता है जो ब्लॉक रेंडर नहीं कर सकते।
अन्य OpenClaw चैनलों को भेजी गई मानक प्रस्तुतियों को वही नियतात्मक चार्ट डेटा
टेक्स्ट के रूप में प्राप्त होता है, जब तक कि वे मूल चार्ट समर्थन घोषित न करें। यदि
चरणबद्ध रोलआउट के दौरान Slack चार्ट को `invalid_blocks` के साथ अस्वीकार करता है, तो OpenClaw
अस्वीकृत मूल डेटा ब्लॉक हटाता है, सहोदर नियंत्रणों को बनाए रखता है और
चार्ट का पूरा निरूपण दृश्यमान टेक्स्ट के रूप में भेजता है।

Slack वर्तमान में प्रत्येक संदेश में अधिकतम दो `data_visualization` ब्लॉक स्वीकार करता है। जब
किसी प्रस्तुति में दो से अधिक मान्य चार्ट होते हैं, तो OpenClaw उनका क्रम बनाए रखता है
और अनुवर्ती संदेशों में मूल रेंडरिंग जारी रखता है, जिसमें प्रत्येक संदेश में
दो से अधिक चार्ट नहीं होते।

Slack का [डेवलपर लॉन्च](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
इस ब्लॉक को ऐप-संबंधी Block Kit सुविधा के रूप में दस्तावेज़ित करता है और किसी सशुल्क
प्लान प्रतिबंध को प्रकाशित नहीं करता। Business+/Enterprise पात्रता संबंधी भाषा
Slackbot के स्वचालित AI चार्ट निर्माण पर लागू होती है, जो पहले से संरचित
Block Kit चार्ट भेजने वाले ऐप से अलग है। चार्ट केवल संदेश ब्लॉक हैं, App
Home, मोडल या Canvas सामग्री नहीं।

## मूल तालिकाएँ

Slack का वर्तमान [`data_table` Block Kit ब्लॉक](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
संदेशों में संरचित पंक्तियाँ और स्तंभ रेंडर करता है। OpenClaw एक स्पष्ट
पोर्टेबल `presentation` `table` ब्लॉक को `data_table` पर मैप करता है; यह Slack के
पुराने [`table` ब्लॉक](https://docs.slack.dev/reference/block-kit/blocks/table-block/) का उपयोग नहीं करता।
सामान्य `chat:write` संदेश एक्सेस के अतिरिक्त किसी OAuth स्कोप या Slack
कॉन्फ़िगरेशन की आवश्यकता नहीं होती।

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "खुली पाइपलाइन",
      "headers": ["खाता", "चरण", "ARR"],
      "rows": [
        ["Acme", "जीता गया", 125000],
        ["Globex", "समीक्षा", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw हेडर और स्ट्रिंग सेल को Slack `raw_text` सेल पर मैप करता है। संख्यात्मक सेल
`raw_number` पर मैप होते हैं, जिसमें मूल सॉर्टिंग और फ़िल्टरिंग के लिए सीमित संख्यात्मक मान
सुरक्षित रहता है। मौजूद होने पर `rowHeaderColumnIndex` उस शून्य-आधारित
स्तंभ को Slack पंक्ति हेडर के रूप में चिह्नित करता है।

Slack की प्रकाशित `data_table` सीमाएँ मूल रेंडरिंग से पहले लागू की जाती हैं:

- 1-20 स्तंभ
- 1-100 डेटा पंक्तियाँ, साथ में हेडर पंक्ति
- हर पंक्ति में सेल की समान संख्या
- एक संदेश की सभी तालिका सेल में कुल अधिकतम 10,000 वर्ण

जब संदेश कुल वर्ण सीमा के भीतर रहता है, तो कई मान्य तालिका ब्लॉक मूल रूप से
रेंडर हो सकते हैं। मूल सीमा के भीतर रेंडर न हो सकने वाली तालिका पंक्तियाँ या
सेल खोने के बजाय पूर्ण नियतात्मक टेक्स्ट बन जाती है। यदि वह टेक्स्ट एक Slack
संदेश की सीमा से अधिक हो जाता है, तो प्रेषण और स्लैश प्रतिक्रियाएँ क्रमबद्ध
टेक्स्ट खंडों का उपयोग करती हैं। तालिका संपादन किसी मौजूदा संदेश से पंक्तियों को
चुपचाप काटने के बजाय स्पष्ट आकार त्रुटि के साथ विफल होते हैं।

पोर्टेबल प्रस्तुति से बनी प्रत्येक मूल तालिका में स्क्रीन रीडर, सूचनाओं, सत्र
मिररिंग और उन क्लाइंट के लिए शीर्ष-स्तरीय टेक्स्ट निरूपण भी होता है जो ब्लॉक
रेंडर नहीं कर सकते। फ़ॉलबैक में कच्चे चार्ट और तालिका मान अक्षरशः बने रहते हैं,
ताकि `<@U123>` जैसा सेल डेटा Slack उल्लेख न बन जाए।
यदि Slack मूल चार्ट या तालिका ब्लॉक को `invalid_blocks` के साथ अस्वीकार करता है, तो OpenClaw
एक सीमित पुनर्प्राप्ति चरण में प्रत्येक मूल डेटा ब्लॉक हटाता है, बटन और चयन जैसे
मान्य सहोदर ब्लॉक बनाए रखता है और Slack फ़ॉर्मेटिंग अक्षम करके पूर्ण दृश्यमान
चार्ट और तालिका टेक्स्ट भेजता है। स्लैश-कमांड डिलीवरी पूरे कमांड में Slack के
पाँच-कॉल `response_url` बजट को ट्रैक करती है। प्रत्येक उत्तर बैच से पहले,
यह ऐसी पूर्ण योजना चुनती है जो शेष कॉल में समा जाए या उस बैच को पोस्ट करने से
पहले विफल हो जाती है।

केवल स्पष्ट `presentation` तालिका ब्लॉक मूल तालिकाओं में उन्नत किए जाते हैं।
Markdown पाइप तालिकाएँ रचित टेक्स्ट ही रहती हैं; OpenClaw तालिका संरचना या
सेल प्रकारों का अनुमान नहीं लगाता। मौजूदा विश्वसनीय Slack-मूल उत्पादक
`channelData.slack.blocks` के माध्यम से कच्चे ब्लॉक भेजना जारी रख सकते हैं; OpenClaw मान्य कच्चे
`data_table` सेल से फ़ॉलबैक टेक्स्ट प्राप्त करता है, जबकि विकृत कस्टम ब्लॉक
अपने कैप्शन या सामान्य Block Kit फ़ॉलबैक तक सीमित हो सकते हैं। पोर्टेबल एजेंट,
CLI और plugin आउटपुट को `presentation` का उपयोग करना चाहिए।

## इंटरैक्टिव उत्तर

Slack एजेंट द्वारा रचित इंटरैक्टिव उत्तर नियंत्रण रेंडर कर सकता है, लेकिन यह सुविधा डिफ़ॉल्ट रूप से अक्षम है।
नए एजेंट, CLI और plugin आउटपुट के लिए साझा
`presentation` बटन या चयन ब्लॉक को प्राथमिकता दें। वे उसी Slack इंटरैक्शन
पथ का उपयोग करते हैं और अन्य चैनलों पर भी वैकल्पिक रूप में प्रस्तुत होते हैं।

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

सक्षम होने पर भी एजेंट अप्रचलित, केवल Slack वाले उत्तर निर्देश जारी कर सकते हैं:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

ये निर्देश Slack Block Kit में संकलित होते हैं और क्लिक या चयन को
मौजूदा Slack इंटरैक्शन इवेंट पथ के माध्यम से वापस रूट करते हैं। इन्हें पुराने
प्रॉम्प्ट और Slack-विशिष्ट वैकल्पिक उपायों के लिए बनाए रखें; नए पोर्टेबल
नियंत्रणों के लिए साझा प्रस्तुति का उपयोग करें।

नए उत्पादक कोड के लिए निर्देश कंपाइलर API भी अप्रचलित हैं:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

नए Slack-रेंडर किए गए नियंत्रणों के लिए `presentation` पेलोड और
`buildSlackPresentationBlocks(...)` का उपयोग करें।

टिप्पणियाँ:

- यह Slack-विशिष्ट पुराना UI है। अन्य चैनल Slack Block
  Kit निर्देशों को अपने बटन सिस्टम में रूपांतरित नहीं करते।
- इंटरैक्टिव कॉलबैक मान OpenClaw द्वारा जनरेट किए गए अपारदर्शी टोकन हैं, न कि एजेंट द्वारा लिखे गए मूल मान।
- यदि जनरेट किए गए इंटरैक्टिव ब्लॉक Slack Block Kit की सीमाओं से अधिक हो जाएँ, तो OpenClaw अमान्य ब्लॉक पेलोड भेजने के बजाय मूल टेक्स्ट उत्तर पर वापस आ जाता है।

### Plugin के स्वामित्व वाले मोडल सबमिशन

इंटरैक्टिव हैंडलर पंजीकृत करने वाले Slack plugins, OpenClaw द्वारा
एजेंट को दिखाई देने वाले सिस्टम इवेंट के लिए पेलोड को संक्षिप्त करने से पहले, मोडल
`view_submission` और `view_closed` लाइफ़साइकल इवेंट भी प्राप्त कर सकते हैं। Slack मोडल खोलते समय इनमें से किसी एक रूटिंग
पैटर्न का उपयोग करें:

- `callback_id` को `openclaw:<namespace>:<payload>` पर सेट करें।
- या मौजूदा `callback_id` को बनाए रखें और मोडल `private_metadata` में `pluginInteractiveData:
"<namespace>:<payload>"` रखें।

हैंडलर को `ctx.interaction.kind`, `view_submission` या
`view_closed` के रूप में, सामान्यीकृत `inputs`, और Slack से पूर्ण मूल `stateValues` ऑब्जेक्ट
प्राप्त होता है। Plugin हैंडलर को सक्रिय करने के लिए केवल कॉलबैक-ID रूटिंग पर्याप्त है; जब
मोडल को एजेंट को दिखाई देने वाला सिस्टम इवेंट भी उत्पन्न करना हो, तो मौजूदा मोडल
`private_metadata` उपयोगकर्ता/सेशन रूटिंग फ़ील्ड शामिल करें। एजेंट को एक
संक्षिप्त, संशोधित `Slack interaction: ...` सिस्टम इवेंट प्राप्त होता है। यदि हैंडलर
`systemEvent.summary`, `systemEvent.reference`, या `systemEvent.data` लौटाता है, तो वे
फ़ील्ड उस संक्षिप्त इवेंट में शामिल होते हैं, ताकि एजेंट पूर्ण फ़ॉर्म पेलोड देखे बिना
Plugin के स्वामित्व वाले स्टोरेज का संदर्भ दे सके।

## Slack में नेटिव अनुमोदन

Slack, Web UI या टर्मिनल पर वापस जाने के बजाय, इंटरैक्टिव बटन और इंटरैक्शन के साथ नेटिव अनुमोदन क्लाइंट के रूप में कार्य कर सकता है।

- Exec और Plugin अनुमोदन Slack-नेटिव Block Kit प्रॉम्प्ट के रूप में रेंडर हो सकते हैं।
- `channels.slack.execApprovals.*` नेटिव exec अनुमोदन क्लाइंट को सक्षम करने और DM/चैनल रूटिंग का कॉन्फ़िगरेशन बना रहता है।
- Exec अनुमोदन DM, `channels.slack.execApprovals.approvers` या `commands.ownerAllowFrom` का उपयोग करते हैं।
- Plugin अनुमोदन Slack-नेटिव बटन का उपयोग करते हैं, जब मूल सेशन के लिए Slack को नेटिव अनुमोदन क्लाइंट के रूप में सक्षम किया गया हो, या जब `approvals.plugin` मूल Slack सेशन या किसी Slack लक्ष्य पर रूट करता हो।
- Plugin अनुमोदन DM, `channels.slack.allowFrom` से Slack Plugin अनुमोदकों, नामित-अकाउंट `allowFrom`, या अकाउंट के डिफ़ॉल्ट रूट का उपयोग करते हैं।
- अनुमोदक प्राधिकरण अभी भी लागू रहता है: केवल exec के अनुमोदक Plugin अनुरोधों को तब तक अनुमोदित नहीं कर सकते, जब तक वे Plugin अनुमोदक भी न हों।

यह अन्य चैनलों वाली समान साझा अनुमोदन बटन सतह का उपयोग करता है। जब आपकी Slack ऐप सेटिंग में `interactivity` सक्षम होता है, तो अनुमोदन प्रॉम्प्ट सीधे बातचीत में Block Kit बटन के रूप में रेंडर होते हैं।
जब ये बटन मौजूद हों, तो वे प्राथमिक अनुमोदन UX होते हैं; OpenClaw को मैन्युअल
`/approve` कमांड केवल तभी शामिल करनी चाहिए, जब टूल परिणाम बताए कि चैट
अनुमोदन अनुपलब्ध हैं या मैन्युअल अनुमोदन ही एकमात्र मार्ग है।

कॉन्फ़िगरेशन पथ:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (वैकल्पिक; संभव होने पर `commands.ownerAllowFrom` पर वापस जाता है)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, डिफ़ॉल्ट: `dm`)
- `agentFilter`, `sessionFilter`

जब `enabled` सेट न हो या `"auto"` हो और कम-से-कम एक
exec अनुमोदक मिल जाए, तब Slack नेटिव exec अनुमोदन स्वतः सक्षम करता है। जब Slack Plugin अनुमोदक मिल जाएँ और अनुरोध नेटिव-क्लाइंट फ़िल्टर से मेल खाए, तो Slack इस नेटिव-क्लाइंट
पथ के माध्यम से नेटिव Plugin अनुमोदन भी संभाल सकता है। Slack को नेटिव अनुमोदन क्लाइंट के रूप में स्पष्ट रूप से अक्षम करने के लिए
`enabled: false` सेट करें। अनुमोदक मिलने पर नेटिव अनुमोदन बलपूर्वक चालू करने के लिए `enabled: true` सेट करें।
Slack exec अनुमोदन अक्षम करने से `approvals.plugin` के माध्यम से सक्षम नेटिव Slack Plugin अनुमोदन
डिलीवरी अक्षम नहीं होती; Plugin अनुमोदन डिलीवरी इसके बजाय Slack Plugin अनुमोदकों का उपयोग करती है।

बिना स्पष्ट Slack exec अनुमोदन कॉन्फ़िगरेशन वाला डिफ़ॉल्ट व्यवहार:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

स्पष्ट Slack-नेटिव कॉन्फ़िगरेशन की आवश्यकता केवल तब होती है, जब आप अनुमोदकों को ओवरराइड करना, फ़िल्टर जोड़ना, या
मूल-चैट डिलीवरी चुनना चाहते हों:

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

साझा `approvals.exec` फ़ॉरवर्डिंग अलग है। इसका उपयोग केवल तभी करें, जब exec अनुमोदन प्रॉम्प्ट को अन्य
चैट या स्पष्ट आउट-ऑफ़-बैंड लक्ष्यों पर भी रूट करना आवश्यक हो। साझा `approvals.plugin` फ़ॉरवर्डिंग भी
अलग है; Slack नेटिव डिलीवरी उस फ़ॉलबैक को केवल तभी रोकती है, जब Slack Plugin
अनुमोदन अनुरोध को नेटिव रूप से संभाल सके।

समान-चैट `/approve` उन Slack चैनलों और DM में भी काम करता है, जो पहले से कमांड का समर्थन करते हैं। पूर्ण अनुमोदन फ़ॉरवर्डिंग मॉडल के लिए [Exec अनुमोदन](/hi/tools/exec-approvals) देखें।

## इवेंट और परिचालन व्यवहार

- संदेश संपादन/हटाने को सिस्टम इवेंट में मैप किया जाता है।
- थ्रेड ब्रॉडकास्ट ("Also send to channel" थ्रेड उत्तर) सामान्य उपयोगकर्ता संदेशों की तरह संसाधित किए जाते हैं।
- प्रतिक्रिया जोड़ने/हटाने के इवेंट सिस्टम इवेंट में मैप किए जाते हैं।
- सदस्य के शामिल होने/छोड़ने, चैनल बनने/नाम बदलने, और पिन जोड़ने/हटाने के इवेंट सिस्टम इवेंट में मैप किए जाते हैं।
- वैकल्पिक उपस्थिति पोलिंग, देखे गए मानव प्रतिभागी के `away` से `active` में संक्रमण को उस प्रतिभागी के सबसे हाल में सक्रिय पात्र Slack सेशन में मैप कर सकती है। डिफ़ॉल्ट रूप से यह बंद है।
- `configWrites` सक्षम होने पर `channel_id_changed` चैनल कॉन्फ़िगरेशन कुंजियों को माइग्रेट कर सकता है।
- चैनल विषय/उद्देश्य मेटाडेटा को अविश्वसनीय संदर्भ माना जाता है और इसे रूटिंग संदर्भ में इंजेक्ट किया जा सकता है।
- जहाँ लागू हो, थ्रेड प्रारंभकर्ता और आरंभिक थ्रेड-इतिहास संदर्भ सीडिंग को कॉन्फ़िगर की गई प्रेषक अनुमति-सूचियों द्वारा फ़िल्टर किया जाता है।
- ब्लॉक क्रियाएँ, शॉर्टकट और मोडल इंटरैक्शन समृद्ध पेलोड फ़ील्ड वाले संरचित `Slack interaction: ...` सिस्टम इवेंट उत्सर्जित करते हैं:
  - ब्लॉक क्रियाएँ: चयनित मान, लेबल, पिकर मान और `workflow_*` मेटाडेटा
  - ग्लोबल शॉर्टकट: कॉलबैक और अभिकर्ता मेटाडेटा, अभिकर्ता के सीधे सेशन पर रूट किया गया
  - संदेश शॉर्टकट: कॉलबैक, अभिकर्ता, चैनल, थ्रेड और चयनित-संदेश संदर्भ
  - रूट किए गए चैनल मेटाडेटा और फ़ॉर्म इनपुट वाले मोडल `view_submission` और `view_closed` इवेंट

अपने Slack ऐप कॉन्फ़िगरेशन में ग्लोबल या संदेश शॉर्टकट परिभाषित करें और किसी भी गैर-रिक्त कॉलबैक ID का उपयोग करें। OpenClaw मेल खाने वाले शॉर्टकट पेलोड को स्वीकार करता है, अन्य Slack इंटरैक्शन जैसी ही DM/चैनल प्रेषक नीति लागू करता है, और स्वच्छ किए गए इवेंट को रूट किए गए एजेंट सेशन के लिए कतारबद्ध करता है। ट्रिगर ID और प्रतिक्रिया URL को एजेंट संदर्भ से संशोधित कर दिया जाता है।

### उपस्थिति इवेंट

Slack, Events API या Socket Mode के माध्यम से उपस्थिति परिवर्तन नहीं भेजता। इसके बजाय OpenClaw उन मानव प्रतिभागियों के लिए [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) को पोल कर सकता है, जिनके संदेश सामान्य Slack पहुँच और रूटिंग जाँचों में सफल रहे हों।

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (डिफ़ॉल्ट): कोई उपस्थिति टाइमर या Slack API कॉल नहीं।
- `auto`: पिछले 24 घंटों में सक्रिय DM, MPIM और Slack थ्रेड की निगरानी करें, जिनमें अधिकतम 8 देखे गए मानव प्रतिभागी हों। शीर्ष-स्तरीय चैनल सेशन शामिल नहीं होते।
- `on`: प्रतिभागी सीमा के बिना समान बातचीत की निगरानी करें और शीर्ष-स्तरीय चैनल सेशन शामिल करें। किसी एक चैनल को बलपूर्वक शामिल करने या रोकने के लिए प्रति-चैनल ओवरराइड का उपयोग करें।

OpenClaw प्रत्येक Slack अकाउंट के लिए प्रति मिनट अधिकतम 45 अद्वितीय उपयोगकर्ताओं को पोल करता है, एजेंट को जगाए बिना पहले परिणाम को सीड करता है, और केवल देखे गए `away` से `active` संक्रमण पर जगाता है। प्रत्येक Slack अकाउंट और उपयोगकर्ता पर स्थायी 8 घंटे की कूलडाउन अवधि लागू होती है, भले ही वह व्यक्ति कई थ्रेड में भाग लेता हो। इवेंट केवल उस व्यक्ति की सबसे हाल में सक्रिय पात्र बातचीत पर रूट होता है और एजेंट को एक छोटा अभिवादन भेजने का निर्णय लेने से पहले मेमोरी/विकी तथा ज्ञात समय-क्षेत्र संदर्भ देखने के लिए कहता है। एजेंट मौन रह सकता है।

बॉट टोकन को `users:read` की आवश्यकता होती है, जो अनुशंसित मैनिफ़ेस्ट में पहले से शामिल है। Enterprise Grid के संगठन-व्यापी इंस्टॉल के लिए उपस्थिति इवेंट उपलब्ध नहीं हैं।

## कॉन्फ़िगरेशन संदर्भ

प्राथमिक संदर्भ: [कॉन्फ़िगरेशन संदर्भ - Slack](/hi/gateway/config-channels#slack)।

<Accordion title="उच्च-संकेत वाले Slack फ़ील्ड">

- मोड/प्रमाणीकरण: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM पहुँच: `dm.enabled`, `dmPolicy`, `allowFrom` (पुराना: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- संगतता टॉगल: `dangerouslyAllowNameMatching` (आपातकालीन उपयोग; आवश्यकता न होने पर बंद रखें)
- चैनल पहुँच: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- थ्रेडिंग/इतिहास: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- उपस्थिति जागरण: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; डिफ़ॉल्ट `off`)
- डिलीवरी: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- अनफ़र्ल: `unfurlLinks` (डिफ़ॉल्ट: `false`), `chat.postMessage` लिंक/मीडिया पूर्वावलोकन नियंत्रण के लिए `unfurlMedia`; लिंक पूर्वावलोकन फिर से सक्षम करने के लिए `unfurlLinks: true` सेट करें
- संचालन/सुविधाएँ: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="चैनलों में कोई उत्तर नहीं">
    इस क्रम में जाँचें:

    - `groupPolicy`
    - चैनल अनुमति-सूची (`channels.slack.channels`) — **कुंजियाँ चैनल ID होनी चाहिए** (`C12345678`), नाम नहीं (`#channel-name`)। `groupPolicy: "allowlist"` के अंतर्गत नाम-आधारित कुंजियाँ बिना सूचना के विफल होती हैं, क्योंकि चैनल रूटिंग डिफ़ॉल्ट रूप से ID-प्रथम है। ID खोजने के लिए: Slack में चैनल पर राइट-क्लिक करें → **Copy link** — URL के अंत में मौजूद `C...` मान चैनल ID है।
    - `requireMention`
    - प्रति-चैनल `users` अनुमति-सूची
    - `messages.groupChat.visibleReplies`: सामान्य समूह/चैनल अनुरोध डिफ़ॉल्ट रूप से `"automatic"` होते हैं। यदि आपने `"message_tool"` चुना है और लॉग में बिना `message(action=send)` कॉल के सहायक टेक्स्ट दिखाई देता है, तो मॉडल दृश्य संदेश-टूल पथ से चूक गया। इस मोड में अंतिम टेक्स्ट निजी रहता है; रोके गए पेलोड मेटाडेटा के लिए Gateway का विस्तृत लॉग देखें, या यदि आप चाहते हैं कि प्रत्येक सामान्य सहायक अंतिम उत्तर पुराने पथ से पोस्ट हो, तो इसे `"automatic"` पर सेट करें।
    - `messages.groupChat.unmentionedInbound`: यदि यह `"room_event"` है, तो बिना उल्लेख वाली अनुमत चैनल बातचीत परिवेशी संदर्भ होती है और तब तक मौन रहती है, जब तक एजेंट `message` टूल को कॉल न करे। [परिवेशी कक्ष इवेंट](/hi/channels/ambient-room-events) देखें।

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    उपयोगी कमांड:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM संदेशों की अनदेखी">
    जाँचें:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (या पुराना `channels.slack.dm.policy`)
    - पेयरिंग स्वीकृतियाँ / अनुमतिसूची प्रविष्टियाँ (`dmPolicy: "open"` के लिए अब भी `channels.slack.allowFrom: ["*"]` आवश्यक है)
    - समूह DM में MPIM प्रबंधन का उपयोग होता है; `channels.slack.dm.groupEnabled` सक्षम करें और, यदि कॉन्फ़िगर किया गया हो, तो MPIM को `channels.slack.dm.groupChannels` में शामिल करें
    - Slack Assistant DM ईवेंट: `drop message_changed` का उल्लेख करने वाले विस्तृत लॉग का
      सामान्यतः अर्थ है कि Slack ने संदेश मेटाडेटा में पुनर्प्राप्त किए जा सकने वाले
      मानव प्रेषक के बिना संपादित Assistant-थ्रेड ईवेंट भेजा है

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode कनेक्ट नहीं हो रहा है">
    Slack ऐप सेटिंग में बॉट + ऐप टोकन और Socket Mode के सक्षम होने की पुष्टि करें।
    App-Level Token को `connections:write` चाहिए, और Bot User OAuth Token
    बॉट टोकन उसी Slack ऐप/वर्कस्पेस का होना चाहिए जिसका ऐप टोकन है।

    यदि `openclaw channels status --probe --json` में `botTokenStatus` या
    `appTokenStatus: "configured_unavailable"` दिखाई देता है, तो Slack खाता
    कॉन्फ़िगर है, लेकिन वर्तमान रनटाइम SecretRef-समर्थित मान का समाधान नहीं कर सका।

    `slack socket mode failed to start; retry ...` जैसे लॉग पुनर्प्राप्त किए जा सकने वाले
    आरंभ विफलता संकेत हैं। इसके बजाय अनुपलब्ध स्कोप, निरस्त टोकन और अमान्य प्रमाणीकरण तुरंत
    विफल होते हैं। `slack token mismatch ...` लॉग का अर्थ है कि बॉट टोकन और ऐप टोकन
    अलग-अलग Slack ऐप से संबंधित प्रतीत होते हैं; Slack ऐप क्रेडेंशियल ठीक करें।

  </Accordion>

  <Accordion title="HTTP मोड को ईवेंट प्राप्त नहीं हो रहे हैं">
    इनकी पुष्टि करें:

    - साइनिंग सीक्रेट
    - Webhook पथ
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - प्रत्येक HTTP खाते के लिए अद्वितीय `webhookPath`
    - सार्वजनिक URL TLS समाप्त करता है और अनुरोधों को Gateway पथ पर अग्रेषित करता है
    - Slack ऐप का `request_url` पथ `channels.slack.webhookPath` (डिफ़ॉल्ट `/slack/events`) से सटीक मेल खाता है

    यदि खाता स्नैपशॉट में `signingSecretStatus: "configured_unavailable"` दिखाई देता है,
    तो HTTP खाता कॉन्फ़िगर है, लेकिन वर्तमान रनटाइम SecretRef-समर्थित
    साइनिंग सीक्रेट का समाधान नहीं कर सका।

    बार-बार आने वाले `slack: webhook path ... already registered` लॉग का अर्थ है कि दो HTTP
    खाते समान `webhookPath` का उपयोग कर रहे हैं; प्रत्येक खाते को अलग पथ दें।

  </Accordion>

  <Accordion title="नेटिव/स्लैश कमांड सक्रिय नहीं हो रहे हैं">
    पुष्टि करें कि आपका अभिप्राय इनमें से किससे था:

    - Slack में पंजीकृत मेल खाते स्लैश कमांड के साथ नेटिव कमांड मोड (`channels.slack.commands.native: true`)
    - या एकल स्लैश कमांड मोड (`channels.slack.slashCommand.enabled: true`)

    Slack स्लैश कमांड स्वचालित रूप से बनाता या हटाता नहीं है। `commands.native: "auto"` Slack नेटिव कमांड सक्षम नहीं करता; `true` का उपयोग करें और Slack ऐप में मेल खाते कमांड बनाएँ। HTTP मोड में, प्रत्येक Slack स्लैश कमांड में Gateway URL शामिल होना चाहिए। Socket Mode में, कमांड पेलोड websocket पर आते हैं और Slack `slash_commands[].url` को अनदेखा करता है।

    `commands.useAccessGroups`, DM प्राधिकरण, चैनल अनुमतिसूचियाँ,
    और प्रति-चैनल `users` अनुमतिसूचियाँ भी जाँचें। Slack अवरुद्ध
    स्लैश-कमांड प्रेषकों के लिए अस्थायी त्रुटियाँ लौटाता है, जिनमें शामिल हैं:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## अटैचमेंट मीडिया संदर्भ

Slack फ़ाइल डाउनलोड सफल होने और आकार सीमाओं की अनुमति होने पर, Slack डाउनलोड किए गए मीडिया को एजेंट टर्न से संलग्न कर सकता है। ऑडियो क्लिप का लिप्यंतरण किया जा सकता है, इमेज फ़ाइलें मीडिया-बोध पथ से या सीधे विज़न-सक्षम उत्तर मॉडल तक भेजी जा सकती हैं, और अन्य फ़ाइलें डाउनलोड करने योग्य फ़ाइल संदर्भ के रूप में उपलब्ध रहती हैं।

### समर्थित मीडिया प्रकार

| मीडिया प्रकार                     | स्रोत               | वर्तमान व्यवहार                                                                  | टिप्पणियाँ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack ऑडियो क्लिप              | Slack फ़ाइल URL       | डाउनलोड करके साझा ऑडियो लिप्यंतरण से रूट किया जाता है                          | `files:read` और कार्यशील `tools.media.audio` मॉडल या CLI आवश्यक है      |
| JPEG / PNG / GIF / WebP इमेज | Slack फ़ाइल URL       | डाउनलोड करके विज़न-सक्षम प्रबंधन हेतु टर्न से संलग्न किया जाता है                   | प्रति-फ़ाइल सीमा: `channels.slack.mediaMaxMb` (डिफ़ॉल्ट 20 MB)                 |
| PDF फ़ाइलें                      | Slack फ़ाइल URL       | डाउनलोड करके `download-file` या `pdf` जैसे टूल के लिए फ़ाइल संदर्भ के रूप में उपलब्ध कराया जाता है | Slack इनबाउंड PDF को स्वचालित रूप से इमेज-विज़न इनपुट में परिवर्तित नहीं करता |
| अन्य फ़ाइलें                    | Slack फ़ाइल URL       | संभव होने पर डाउनलोड करके फ़ाइल संदर्भ के रूप में उपलब्ध कराया जाता है                              | बाइनरी फ़ाइलों को इमेज इनपुट नहीं माना जाता                               |
| थ्रेड उत्तर                 | थ्रेड आरंभकर्ता फ़ाइलें | जब उत्तर में कोई प्रत्यक्ष मीडिया न हो, तब मूल संदेश की फ़ाइलों को संदर्भ के रूप में भरा जा सकता है  | केवल-फ़ाइल आरंभकर्ता अटैचमेंट प्लेसहोल्डर का उपयोग करते हैं                          |
| बहु-फ़ाइल संदेश            | एकाधिक Slack फ़ाइलें | प्रत्येक फ़ाइल का स्वतंत्र रूप से मूल्यांकन किया जाता है                                              | Slack प्रसंस्करण प्रति संदेश आठ फ़ाइलों तक सीमित है                     |

### इनबाउंड पाइपलाइन

जब फ़ाइल अटैचमेंट वाला Slack संदेश आता है:

1. OpenClaw बॉट टोकन का उपयोग करके Slack के निजी URL से फ़ाइल डाउनलोड करता है।
2. सफलता मिलने पर फ़ाइल मीडिया स्टोर में लिखी जाती है।
3. डाउनलोड किए गए मीडिया पथ और सामग्री प्रकार इनबाउंड संदर्भ में जोड़े जाते हैं।
4. ऑडियो क्लिप साझा लिप्यंतरण पाइपलाइन को भेजे जाते हैं; इमेज-सक्षम मॉडल/टूल पथ उसी संदर्भ से इमेज अटैचमेंट का उपयोग कर सकते हैं।
5. अन्य फ़ाइलें उन्हें संभाल सकने वाले टूल के लिए फ़ाइल मेटाडेटा या मीडिया संदर्भ के रूप में उपलब्ध रहती हैं।

### थ्रेड-मूल अटैचमेंट का उत्तराधिकार

जब कोई संदेश किसी थ्रेड में आता है (उसका `thread_ts` पैरेंट होता है):

- यदि उत्तर में स्वयं कोई प्रत्यक्ष मीडिया नहीं है और शामिल मूल संदेश में फ़ाइलें हैं, तो Slack मूल फ़ाइलों को थ्रेड-आरंभकर्ता संदर्भ के रूप में भर सकता है।
- मूल फ़ाइलें केवल नया या रीसेट किया गया थ्रेड सत्र आरंभ करते समय भरी जाती हैं। बाद के केवल-पाठ उत्तर मौजूदा सत्र संदर्भ का पुनः उपयोग करते हैं और मूल फ़ाइलों को नए मीडिया के रूप में दोबारा संलग्न नहीं करते।
- प्रत्यक्ष उत्तर अटैचमेंट को मूल-संदेश अटैचमेंट पर प्राथमिकता मिलती है।
- जिस मूल संदेश में केवल फ़ाइलें हों और कोई पाठ न हो, उसे अटैचमेंट प्लेसहोल्डर से दर्शाया जाता है ताकि फ़ॉलबैक में उसकी फ़ाइलें फिर भी शामिल हो सकें।

### बहु-अटैचमेंट प्रबंधन

जब किसी एक Slack संदेश में एकाधिक फ़ाइल अटैचमेंट होते हैं:

- प्रत्येक अटैचमेंट मीडिया पाइपलाइन के माध्यम से स्वतंत्र रूप से संसाधित होता है।
- डाउनलोड किए गए मीडिया संदर्भ संदेश संदर्भ में एकत्र किए जाते हैं।
- प्रसंस्करण क्रम ईवेंट पेलोड में Slack के फ़ाइल क्रम का अनुसरण करता है।
- एक अटैचमेंट का डाउनलोड विफल होने पर अन्य अटैचमेंट अवरुद्ध नहीं होते।

### आकार, डाउनलोड और मॉडल सीमाएँ

- **आकार सीमा**: डिफ़ॉल्ट रूप से प्रति फ़ाइल 20 MB। `channels.slack.mediaMaxMb` के माध्यम से कॉन्फ़िगर किया जा सकता है।
- **ऑडियो लिप्यंतरण सीमा**: डाउनलोड की गई फ़ाइल किसी लिप्यंतरण प्रदाता या CLI को भेजे जाने पर भी `tools.media.audio.maxBytes` लागू होता है।
- **डाउनलोड विफलताएँ**: Slack द्वारा उपलब्ध न कराई जा सकने वाली फ़ाइलें, समय-सीमा समाप्त URL, अप्राप्य फ़ाइलें, सीमा से बड़ी फ़ाइलें और Slack प्रमाणीकरण/लॉगिन HTML प्रतिक्रियाएँ असमर्थित प्रारूप के रूप में रिपोर्ट किए जाने के बजाय छोड़ दी जाती हैं।
- **विज़न मॉडल**: इमेज विश्लेषण सक्रिय उत्तर मॉडल का उपयोग करता है, यदि वह विज़न का समर्थन करता है, या `agents.defaults.imageModel` पर कॉन्फ़िगर किए गए इमेज मॉडल का उपयोग करता है।

### ज्ञात सीमाएँ

| परिदृश्य                                      | वर्तमान व्यवहार                                                                   | समाधान                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| समय-सीमा समाप्त Slack फ़ाइल URL                        | फ़ाइल छोड़ दी जाती है; कोई त्रुटि नहीं दिखाई जाती                                                       | फ़ाइल को Slack में फिर से अपलोड करें                                                   |
| ऑडियो लिप्यंतरण अनुपलब्ध               | क्लिप संलग्न रहती है, लेकिन कोई लिप्यंतरण तैयार नहीं होता                                | `tools.media.audio` कॉन्फ़िगर करें या समर्थित स्थानीय लिप्यंतरण CLI इंस्टॉल करें  |
| कैप्शन-रहित क्लिप उल्लेख गेट से नहीं गुजरती | निजी अनुमानित लिप्यंतरण के बाद छोड़ दी जाती है; लिप्यंतरण और डाउनलोड हटा दिए जाते हैं | बोले गए नाम के उल्लेख का पैटर्न कॉन्फ़िगर करें, टाइप किया हुआ बॉट उल्लेख जोड़ें, या DM का उपयोग करें |
| विज़न मॉडल कॉन्फ़िगर नहीं है                   | इमेज अटैचमेंट मीडिया संदर्भ के रूप में संग्रहीत होते हैं, लेकिन इमेज के रूप में उनका विश्लेषण नहीं होता       | `agents.defaults.imageModel` कॉन्फ़िगर करें या विज़न-सक्षम उत्तर मॉडल का उपयोग करें    |
| बहुत बड़ी इमेज (> 20 MB डिफ़ॉल्ट रूप से)        | आकार सीमा के अनुसार छोड़ दी जाती हैं                                                               | यदि Slack अनुमति देता है, तो `channels.slack.mediaMaxMb` बढ़ाएँ                          |
| अग्रेषित/साझा अटैचमेंट                  | पाठ और Slack-होस्टेड इमेज/फ़ाइल मीडिया सर्वोत्तम प्रयास के आधार पर संसाधित होते हैं                             | सीधे OpenClaw थ्रेड में फिर से साझा करें                                      |
| PDF अटैचमेंट                               | फ़ाइल/मीडिया संदर्भ के रूप में संग्रहीत होते हैं, इमेज विज़न के माध्यम से स्वचालित रूप से रूट नहीं होते        | फ़ाइल मेटाडेटा के लिए `download-file` या PDF विश्लेषण के लिए `pdf` टूल का उपयोग करें      |

### संबंधित दस्तावेज़

- [मीडिया-बोध पाइपलाइन](/hi/nodes/media-understanding)
- [ऑडियो और वॉइस नोट्स](/hi/nodes/audio)
- [PDF टूल](/hi/tools/pdf)

## संबंधित

<CardGroup cols={2}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    किसी Slack उपयोगकर्ता को Gateway से पेयर करें।
  </Card>
  <Card title="समूह" icon="users" href="/hi/channels/groups">
    चैनल और समूह DM का व्यवहार।
  </Card>
  <Card title="चैनल रूटिंग" icon="route" href="/hi/channels/channel-routing">
    इनबाउंड संदेशों को एजेंटों तक रूट करें।
  </Card>
  <Card title="सुरक्षा" icon="shield" href="/hi/gateway/security">
    खतरा मॉडल और सुदृढ़ीकरण।
  </Card>
  <Card title="कॉन्फ़िगरेशन" icon="sliders" href="/hi/gateway/configuration">
    कॉन्फ़िगरेशन संरचना और प्राथमिकता।
  </Card>
  <Card title="स्लैश कमांड" icon="terminal" href="/hi/tools/slash-commands">
    कमांड सूची और व्यवहार।
  </Card>
</CardGroup>
