---
read_when:
    - आपने पुराना BlueBubbles चैनल इस्तेमाल किया था और अब iMessage पर जाना है
    - आप समर्थित OpenClaw iMessage सेटअप चुन रहे हैं
    - आपको BlueBubbles हटाने का एक छोटा स्पष्टीकरण चाहिए
summary: OpenClaw से BlueBubbles समर्थन हटा दिया गया था। नए और माइग्रेट किए गए iMessage सेटअप के लिए imsg के साथ बंडल किए गए iMessage Plugin का उपयोग करें।
title: BlueBubbles हटाना और imsg iMessage पथ
x-i18n:
    generated_at: "2026-06-28T22:32:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles हटाना और imsg iMessage पथ

OpenClaw अब BlueBubbles चैनल के साथ शिप नहीं होता। iMessage समर्थन अब बंडल किए गए `imessage` Plugin के ज़रिए चलता है, जो [`imsg`](https://github.com/steipete/imsg) को स्थानीय रूप से या SSH wrapper के ज़रिए शुरू करता है और stdin/stdout पर JSON-RPC से बात करता है।

यदि आपकी कॉन्फ़िग में अभी भी `channels.bluebubbles` है, तो उसे `channels.imessage` में माइग्रेट करें। विरासत `/channels/bluebubbles` डॉक्स URL [BlueBubbles से आ रहे हैं](/hi/channels/imessage-from-bluebubbles) पर रीडायरेक्ट करता है, जिसमें पूरी कॉन्फ़िग अनुवाद तालिका और कटओवर चेकलिस्ट है।

## क्या बदला

- समर्थित OpenClaw iMessage पथ में कोई BlueBubbles HTTP सर्वर, Webhook route, REST password, या BlueBubbles Plugin runtime नहीं है।
- OpenClaw उस Mac पर `imsg` के ज़रिए Messages को पढ़ता और देखता है जहाँ Messages.app साइन इन है।
- बुनियादी send, receive, history, और media सामान्य `imsg` surfaces और macOS permissions का उपयोग करते हैं।
- threaded replies, tapbacks, edit, unsend, effects, read receipts, typing indicators, और group management जैसी उन्नत कार्रवाइयों के लिए private API bridge उपलब्ध होने के साथ `imsg launch` आवश्यक है।
- Linux और Windows Gateway अब भी signed-in Mac पर `imsg` चलाने वाले SSH wrapper पर `channels.imessage.cliPath` सेट करके iMessage का उपयोग कर सकते हैं।

## क्या करें

1. Messages Mac पर `imsg` इंस्टॉल और सत्यापित करें:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. `imsg` और OpenClaw चलाने वाले process context को Full Disk Access और Automation permissions दें।

3. पुरानी कॉन्फ़िग का अनुवाद करें:

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

4. Gateway को फिर से शुरू करें और सत्यापित करें:

   ```bash
   openclaw channels status --probe
   ```

5. अपना पुराना BlueBubbles सर्वर हटाने से पहले DMs, groups, attachments, और जिन private API actions पर आप निर्भर हैं, उनका परीक्षण करें।

## माइग्रेशन नोट्स

- `channels.bluebubbles.serverUrl` और `channels.bluebubbles.password` का कोई iMessage समतुल्य नहीं है।
- `channels.bluebubbles.allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, attachment roots, media size limits, chunking, और action toggles के iMessage समतुल्य हैं।
- `channels.imessage.includeAttachments` अभी भी डिफ़ॉल्ट रूप से बंद है। यदि आप चाहते हैं कि inbound photos, voice memos, videos, या files agent तक पहुँचें, तो इसे स्पष्ट रूप से सेट करें।
- `groupPolicy: "allowlist"` के साथ, पुराने `groups` block को कॉपी करें, जिसमें कोई भी `"*"` wildcard entry शामिल हो। Group sender allowlists और group registry अलग-अलग gates हैं।
- `channel: "bluebubbles"` से मेल खाने वाली ACP bindings को `channel: "imessage"` में बदलना होगा।
- पुरानी BlueBubbles session keys iMessage session keys नहीं बनतीं। Pairing approvals handle के आधार पर carry over होती हैं, लेकिन BlueBubbles session keys के अंतर्गत conversation history नहीं होती।

## यह भी देखें

- [BlueBubbles से आ रहे हैं](/hi/channels/imessage-from-bluebubbles)
- [iMessage](/hi/channels/imessage)
- [कॉन्फ़िगरेशन संदर्भ - iMessage](/hi/gateway/config-channels#imessage)
