---
read_when:
    - आपने पुराने BlueBubbles चैनल का उपयोग किया था और अब आपको iMessage पर जाना है
    - आप समर्थित OpenClaw iMessage सेटअप चुन रहे हैं
    - आपको BlueBubbles को हटाने का संक्षिप्त स्पष्टीकरण चाहिए
summary: OpenClaw से BlueBubbles समर्थन हटा दिया गया है। नए और माइग्रेट किए गए iMessage सेटअप के लिए imsg के साथ बंडल किए गए iMessage Plugin का उपयोग करें।
title: BlueBubbles को हटाना और imsg iMessage पथ
x-i18n:
    generated_at: "2026-07-19T07:56:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles को हटाना और imsg iMessage पथ

OpenClaw अब BlueBubbles चैनल के साथ नहीं आता। iMessage समर्थन बंडल किए गए `imessage` Plugin के माध्यम से चलता है: Gateway स्थानीय रूप से या SSH रैपर के माध्यम से [`imsg`](https://github.com/steipete/imsg) को चाइल्ड प्रोसेस के रूप में शुरू करता है और stdin/stdout पर JSON-RPC से संचार करता है। कोई सर्वर नहीं, कोई Webhook नहीं, कोई पोर्ट नहीं।

यदि आपके कॉन्फ़िगरेशन में अब भी `channels.bluebubbles` है, तो उसे `channels.imessage` में माइग्रेट करें। पुराना `/channels/bluebubbles` दस्तावेज़ URL [BlueBubbles से माइग्रेट करना](/hi/channels/imessage-from-bluebubbles) पर रीडायरेक्ट होता है, जिसमें पूरी कॉन्फ़िगरेशन रूपांतरण तालिका और कटओवर चेकलिस्ट है।

## क्या बदला

- समर्थित iMessage पथ में कोई BlueBubbles HTTP सर्वर, Webhook रूट, REST पासवर्ड या BlueBubbles Plugin रनटाइम नहीं है।
- OpenClaw उस Mac पर `imsg` के माध्यम से Messages को पढ़ता और मॉनिटर करता है, जहाँ Messages.app में साइन इन किया गया है।
- बुनियादी भेजने, प्राप्त करने, इतिहास और मीडिया की सुविधाएँ सामान्य `imsg` सतहों और macOS अनुमतियों का उपयोग करती हैं।
- उन्नत कार्रवाइयों (थ्रेडेड उत्तर, टैपबैक, संपादन, भेजना रद्द करना, प्रभाव, पढ़ने की पावती, टाइपिंग संकेतक और समूह प्रबंधन) के लिए निजी API ब्रिज आवश्यक है: `imsg launch` चलाएँ, जिसके लिए SIP अक्षम होना चाहिए।
- Linux और Windows Gateway अब भी `channels.imessage.cliPath` को ऐसे SSH रैपर पर निर्देशित करके iMessage का उपयोग कर सकते हैं, जो साइन-इन किए गए Mac पर `imsg` चलाता है।

## क्या करें

1. Messages वाले Mac पर `imsg` इंस्टॉल और सत्यापित करें:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. `imsg` और OpenClaw चलाने वाले प्रोसेस संदर्भ को Full Disk Access और Automation अनुमतियाँ दें।

3. पुराने कॉन्फ़िगरेशन को रूपांतरित करें:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Gateway पुनः आरंभ करें और सत्यापित करें:

   ```bash
   openclaw channels status --probe
   ```

5. अपने पुराने BlueBubbles सर्वर को हटाने से पहले DMs, समूहों, अटैचमेंट और निजी API की उन सभी कार्रवाइयों का परीक्षण करें जिन पर आप निर्भर हैं।

## माइग्रेशन नोट्स

- `channels.bluebubbles.serverUrl` और `channels.bluebubbles.password` का कोई iMessage समकक्ष नहीं है; पहुँचने या प्रमाणित करने के लिए कोई सर्वर नहीं है।
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` और `actions.*`, `channels.imessage` के अंतर्गत अपना अर्थ बनाए रखते हैं।
- `channels.imessage.includeAttachments` अब भी डिफ़ॉल्ट रूप से बंद है। यदि आप चाहते हैं कि आने वाली फ़ोटो, वॉइस मेमो, वीडियो या फ़ाइलें एजेंट तक पहुँचें, तो इसे स्पष्ट रूप से सेट करें।
- `groupPolicy: "allowlist"` के साथ पुराने `groups` ब्लॉक को कॉपी करें, जिसमें कोई भी `"*"` वाइल्डकार्ड प्रविष्टि शामिल हो। समूह प्रेषक अनुमतिसूचियाँ और समूह रजिस्ट्री अलग-अलग नियंत्रण हैं; प्रविष्टियों वाला ऐसा `groups` ब्लॉक, जिसमें मेल खाता `chat_id` नहीं है (या कोई `"*"` नहीं है), रनटाइम पर संदेश को छोड़ देता है, और खाली `groups` ब्लॉक स्टार्टअप चेतावनी लॉग करता है, भले ही प्रेषक फ़िल्टरिंग संदेशों को आने देती हो।
- `match.channel: "bluebubbles"` वाले ACP बाइंडिंग को `"imessage"` में बदलना आवश्यक है।
- पुरानी BlueBubbles सत्र कुंजियाँ iMessage सत्र कुंजियाँ नहीं बनतीं। पेयरिंग स्वीकृतियाँ प्रेषक हैंडल पर आधारित होती हैं, इसलिए कॉपी की गई `allowFrom` प्रविष्टियाँ काम करती रहेंगी, लेकिन BlueBubbles सत्र कुंजियों के अंतर्गत बातचीत का इतिहास स्थानांतरित नहीं होगा।

## यह भी देखें

- [BlueBubbles से माइग्रेट करना](/hi/channels/imessage-from-bluebubbles)
- [iMessage](/hi/channels/imessage)
- [कॉन्फ़िगरेशन संदर्भ - iMessage](/hi/gateway/config-channels#imessage)
