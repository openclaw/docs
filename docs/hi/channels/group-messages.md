---
read_when:
    - WhatsApp समूहों को विशेष रूप से कॉन्फ़िगर करना
    - WhatsApp सक्रियण मोड बदलना (`mention` बनाम `always`)
    - WhatsApp समूह सत्र कुंजियों या लंबित-संदेश संदर्भ को ट्यून करना
sidebarTitle: WhatsApp groups
summary: WhatsApp समूह संदेश प्रबंधन — सक्रियण, अनुमति-सूचियाँ, सत्र, और संदर्भ इंजेक्शन
title: WhatsApp समूह संदेश
x-i18n:
    generated_at: "2026-06-28T22:34:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

क्रॉस-चैनल समूह मॉडल (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo) के लिए, [समूह](/hi/channels/groups) देखें। यह पेज उस मॉडल के ऊपर WhatsApp-विशिष्ट व्यवहार कवर करता है: सक्रियण, समूह allowlists, प्रति-समूह session keys, और pending-message context injection.

लक्ष्य: OpenClaw को WhatsApp समूहों में रहने दें, केवल ping किए जाने पर जगाएं, और उस thread को व्यक्तिगत DM session से अलग रखें।

<Note>
`agents.list[].groupChat.mentionPatterns` का उपयोग Telegram, Discord, Slack, और iMessage भी करते हैं। multi-agent setups के लिए, इसे प्रति agent सेट करें, या global fallback के रूप में `messages.groupChat.mentionPatterns` का उपयोग करें।
</Note>

## व्यवहार

- सक्रियण modes: `mention` (default) या `always`। `mention` के लिए ping चाहिए (वास्तविक WhatsApp @-mentions via `mentionedJids`, safe regex patterns, या text में कहीं भी bot का E.164)। `always` हर message पर agent को जगाता है लेकिन उसे केवल तभी reply करना चाहिए जब वह meaningful value जोड़ सके; अन्यथा यह exact silent token `NO_REPLY` / `no_reply` लौटाता है। Defaults config (`channels.whatsapp.groups`) में सेट किए जा सकते हैं और `/activation` के जरिए प्रति group override किए जा सकते हैं। जब `channels.whatsapp.groups` सेट हो, तो यह group allowlist के रूप में भी काम करता है (सभी को allow करने के लिए `"*"` शामिल करें)।
- समूह नीति: `channels.whatsapp.groupPolicy` नियंत्रित करता है कि group messages स्वीकार किए जाते हैं या नहीं (`open|disabled|allowlist`)। `allowlist` `channels.whatsapp.groupAllowFrom` का उपयोग करता है (fallback: explicit `channels.whatsapp.allowFrom`)। Default `allowlist` है (senders जोड़ने तक blocked)।
- प्रति-समूह sessions: session keys `agent:<agentId>:whatsapp:group:<jid>` जैसी दिखती हैं ताकि `/verbose on`, `/trace on`, या `/think high` जैसे commands (standalone messages के रूप में भेजे गए) उसी group तक scoped रहें; व्यक्तिगत DM state अछूती रहती है। Heartbeat group threads के लिए skip किए जाते हैं।
- Context injection: **pending-only** group messages (default 50) जो run trigger _नहीं_ करते, उन्हें `[Chat messages since your last reply - for context]` के अंतर्गत prefix किया जाता है, और triggering line `[Current message - respond to this]` के अंतर्गत होती है। Session में पहले से मौजूद messages दोबारा inject नहीं किए जाते।
- Sender surfacing: हर group batch अब `[from: Sender Name (+E164)]` के साथ समाप्त होता है ताकि OpenClaw जान सके कि कौन बोल रहा है।
- Ephemeral/view-once: text/mentions निकालने से पहले हम उन्हें unwrap करते हैं, इसलिए उनके अंदर के pings अभी भी trigger करते हैं।
- Group system prompt: group session के पहले turn पर (और जब भी `/activation` mode बदलता है) हम system prompt में एक छोटा blurb inject करते हैं जैसे `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` यदि metadata उपलब्ध नहीं है, तब भी हम agent को बताते हैं कि यह group chat है।

## Config example (WhatsApp)

`~/.openclaw/openclaw.json` में `groupChat` block जोड़ें ताकि display-name pings तब भी काम करें जब WhatsApp text body में visual `@` हटा देता है:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

नोट्स:

- Regexes case-insensitive हैं और अन्य config regex surfaces जैसे ही safe-regex guardrails का उपयोग करते हैं; invalid patterns और unsafe nested repetition ignore किए जाते हैं।
- जब कोई contact tap करता है तो WhatsApp अभी भी canonical mentions `mentionedJids` के जरिए भेजता है, इसलिए number fallback की जरूरत कम पड़ती है लेकिन यह उपयोगी safety net है।

### सक्रियण command (owner-only)

Group chat command का उपयोग करें:

- `/activation mention`
- `/activation always`

केवल owner number (from `channels.whatsapp.allowFrom`, या unset होने पर bot का अपना E.164) इसे बदल सकता है। Current activation mode देखने के लिए group में standalone message के रूप में `/status` भेजें।

## उपयोग कैसे करें

1. अपने WhatsApp account (जो OpenClaw चला रहा है) को group में जोड़ें।
2. `@openclaw …` कहें (या number शामिल करें)। जब तक आप `groupPolicy: "open"` सेट नहीं करते, केवल allowlisted senders इसे trigger कर सकते हैं।
3. Agent prompt में recent group context और trailing `[from: …]` marker शामिल होगा ताकि वह सही व्यक्ति को address कर सके।
4. Session-level directives (`/verbose on`, `/trace on`, `/think high`, `/new` या `/reset`, `/compact`) केवल उस group के session पर लागू होते हैं; उन्हें standalone messages के रूप में भेजें ताकि वे register हों। आपका व्यक्तिगत DM session independent रहता है।

## Testing / verification

- Manual smoke:
  - Group में `@openclaw` ping भेजें और sender name का reference देने वाला reply confirm करें।
  - दूसरा ping भेजें और verify करें कि history block शामिल है और फिर next turn पर clear हो जाता है।
- Gateway logs (`--verbose` के साथ run करें) check करें ताकि `from: <groupJid>` और `[from: …]` suffix दिखाने वाली `inbound web message` entries दिखें।

## ज्ञात विचार

- Groups के लिए Heartbeats जानबूझकर skip किए जाते हैं ताकि noisy broadcasts से बचा जा सके।
- Echo suppression combined batch string का उपयोग करता है; यदि आप mentions के बिना identical text दो बार भेजते हैं, तो केवल पहले को response मिलेगा।
- Session store entries session store (`~/.openclaw/agents/<agentId>/sessions/sessions.json` by default) में `agent:<agentId>:whatsapp:group:<jid>` के रूप में दिखाई देंगी; missing entry का मतलब केवल इतना है कि group ने अभी तक run trigger नहीं किया है।
- Groups में typing indicators `agents.defaults.typingMode` का पालन करते हैं। जब visible replies message-tool-only mode में opt into किए जाते हैं, typing default रूप से तुरंत शुरू हो जाती है ताकि group members देख सकें कि agent काम कर रहा है, भले ही कोई automatic final reply post न हो। Explicit typing-mode config फिर भी wins करता है।

## संबंधित

- [समूह](/hi/channels/groups)
- [Channel routing](/hi/channels/channel-routing)
- [Broadcast groups](/hi/channels/broadcast-groups)
