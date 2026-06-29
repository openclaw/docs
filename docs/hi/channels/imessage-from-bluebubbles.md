---
read_when:
    - बंडल किए गए iMessage Plugin पर BlueBubbles से स्थानांतरण की योजना बनाना
    - BlueBubbles कॉन्फ़िगरेशन कुंजियों को iMessage समकक्षों में अनुवाद करना
    - iMessage Plugin सक्षम करने से पहले imsg सत्यापित करना
summary: पुराने BlueBubbles कॉन्फ़िग को बंडल किए गए iMessage Plugin में माइग्रेट करें, बिना पेयरिंग, अनुमति-सूचियाँ, या समूह बाइंडिंग खोए।
title: BlueBubbles से आ रहे हैं
x-i18n:
    generated_at: "2026-06-28T22:35:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

बंडल किया गया `imessage` Plugin अब JSON-RPC पर [`steipete/imsg`](https://github.com/steipete/imsg) चलाकर BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, समूह प्रबंधन, अटैचमेंट) जैसी ही निजी API सतह तक पहुँचता है। अगर आप पहले से `imsg` इंस्टॉल किए हुए Mac चला रहे हैं, तो आप BlueBubbles server हटा सकते हैं और Plugin को सीधे Messages.app से बात करने दे सकते हैं।

BlueBubbles support हटा दिया गया था। OpenClaw केवल `imsg` के माध्यम से iMessage support करता है। यह गाइड पुराने `channels.bluebubbles` configs को `channels.imessage` में migrate करने के लिए है; कोई दूसरा supported migration path नहीं है।

<Note>
संक्षिप्त घोषणा और operator सारांश के लिए, [BlueBubbles removal and the imsg iMessage path](/hi/announcements/bluebubbles-imessage) देखें।
</Note>

## Migration checklist

जब आपको अपनी पुरानी BlueBubbles config पहले से पता हो और आप सबसे छोटा सुरक्षित path चाहते हों, तो इस checklist का उपयोग करें:

1. उस Mac पर सीधे `imsg` verify करें जो Messages.app चलाता है (`imsg chats`, `imsg history`, `imsg send`, और `imsg rpc --help`)।
2. `channels.bluebubbles` से behavior keys को `channels.imessage` में copy करें: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms`, और `actions`।
3. ऐसे transport keys हटाएँ जो अब मौजूद नहीं हैं: `serverUrl`, `password`, webhook URLs, और BlueBubbles server setup।
4. अगर Gateway Messages Mac पर नहीं चल रहा है, तो `channels.imessage.cliPath` को SSH wrapper पर set करें और remote attachment fetches के लिए `remoteHost` set करें।
5. Gateway बंद होने पर, `channels.imessage` enable करें, फिर `openclaw channels status --probe --channel imessage` चलाएँ।
6. एक DM, एक allowed group, enabled होने पर attachments, और हर private API action test करें जिसका agent से उपयोग करवाने की अपेक्षा है।
7. iMessage path verify होने के बाद BlueBubbles server और पुरानी `channels.bluebubbles` config delete करें।

## यह migration कब सही है

- आप उसी Mac पर (या SSH से reachable Mac पर) पहले से `imsg` चला रहे हैं जहाँ Messages.app signed in है।
- आप एक moving part कम चाहते हैं — अलग BlueBubbles server नहीं, authenticate करने के लिए REST endpoint नहीं, webhook plumbing नहीं। server + client app + helper के बजाय एक single CLI binary।
- आप [supported macOS / `imsg` build](/hi/channels/imessage#requirements-and-permissions-macos) पर हैं जहाँ private API probe `available: true` report करता है।

## imsg क्या करता है

`imsg` Messages के लिए एक local macOS CLI है। OpenClaw `imsg rpc` को child process के रूप में start करता है और stdin/stdout पर JSON-RPC से बात करता है। expose करने के लिए कोई HTTP server, webhook URL, background daemon, launch agent, या port नहीं है।

- Reads, read-only SQLite handle का उपयोग करके `~/Library/Messages/chat.db` से आते हैं।
- Live inbound messages `imsg watch` / `watch.subscribe` से आते हैं, जो polling fallback के साथ `chat.db` filesystem events को follow करता है।
- Sends, normal text और file sends के लिए Messages.app automation का उपयोग करते हैं।
- Advanced actions, `imsg` helper को Messages.app में inject करने के लिए `imsg launch` का उपयोग करते हैं। यही read receipts, typing indicators, rich sends, edit, unsend, threaded reply, tapbacks, और group management unlock करता है।
- Linux builds copied `chat.db` inspect कर सकते हैं, लेकिन send नहीं कर सकते, live Mac database watch नहीं कर सकते, या Messages.app drive नहीं कर सकते। OpenClaw iMessage के लिए, signed-in Mac पर या उस Mac तक SSH wrapper के माध्यम से `imsg` चलाएँ।

## शुरू करने से पहले

1. Messages.app चलाने वाले Mac पर `imsg` install करें:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   अगर `imsg chats` `unable to open database file`, empty output, या `authorization denied` के साथ fail होता है, तो उस terminal, editor, Node process, Gateway service, या SSH parent process को Full Disk Access दें जो `imsg` launch करता है, फिर उस parent process को reopen करें।

2. OpenClaw config बदलने से पहले read, watch, send, और RPC surfaces verify करें:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` को `imsg chats` से मिले वास्तविक chat id से replace करें। Sending के लिए Messages.app की Automation permission चाहिए। अगर OpenClaw SSH के through चलेगा, तो ये commands उसी SSH wrapper या user context के through चलाएँ जिसे OpenClaw use करेगा। अगर reads/probes काम करते हैं लेकिन sends AppleEvents `-1743` के साथ fail होते हैं, तो check करें कि Automation `/usr/libexec/sshd-keygen-wrapper` पर landed हुई है या नहीं; [SSH wrapper sends fail with AppleEvents -1743](/hi/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743) देखें।

3. Advanced actions की जरूरत होने पर private API bridge enable करें:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` के लिए SIP disabled होना जरूरी है। Basic send, history, और watch `imsg launch` के बिना काम करते हैं; advanced actions नहीं करते।

4. enabled `channels.imessage` config जोड़ने के बाद, OpenClaw के through bridge verify करें:

   ```bash
   openclaw channels status --probe
   ```

   आपको `imessage.privateApi.available: true` चाहिए। अगर यह `false` report करता है, तो पहले उसे fix करें — [Capability detection](/hi/channels/imessage#private-api-actions) देखें। `channels status --probe` केवल configured, enabled accounts को probe करता है।

5. अपनी config snapshot करें:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Config translation

iMessage और BlueBubbles बहुत सारी channel-level config साझा करते हैं। जो keys बदलती हैं वे अधिकतर transport (REST server बनाम local CLI) हैं। Behavior keys (`dmPolicy`, `groupPolicy`, `allowFrom`, आदि) का meaning वही रहता है।

| BlueBubbles                                                | बंडल किया गया iMessage                    | टिप्पणियाँ                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | वही अर्थ-विन्यास।                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _(हटाया गया)_                             | कोई REST सर्वर नहीं — plugin `imsg rpc` को stdio पर चलाता है।                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _(हटाया गया)_                             | कोई webhook प्रमाणीकरण आवश्यक नहीं।                                                                                                                                                                                                                                                                                                                                                    |
| _(अंतर्निहित)_                                             | `channels.imessage.cliPath`               | `imsg` का पथ (डिफ़ॉल्ट `imsg`); SSH के लिए wrapper script इस्तेमाल करें।                                                                                                                                                                                                                                                                                                               |
| _(अंतर्निहित)_                                             | `channels.imessage.dbPath`                | वैकल्पिक Messages.app `chat.db` ओवरराइड; छोड़े जाने पर स्वतः पता लगाया जाता है।                                                                                                                                                                                                                                                                                                      |
| _(अंतर्निहित)_                                             | `channels.imessage.remoteHost`            | `host` या `user@host` — केवल तब आवश्यक जब `cliPath` एक SSH wrapper हो और आप SCP attachment fetches चाहते हों।                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | वही मान (`pairing` / `allowlist` / `open` / `disabled`)।                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Pairing अनुमोदन handle के आधार पर आगे आते हैं, token के आधार पर नहीं।                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | वही मान (`allowlist` / `open` / `disabled`)।                                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | वही।                                                                                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **इसे ज्यों का त्यों कॉपी करें, किसी भी `groups: { "*": { ... } }` wildcard प्रविष्टि सहित।** प्रति-group `requireMention`, `tools`, `toolsBySender` आगे आते हैं। `groupPolicy: "allowlist"` के साथ, खाली या अनुपस्थित `groups` ब्लॉक हर group message को चुपचाप छोड़ देता है — नीचे "Group registry footgun" देखें।                                                             |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | डिफ़ॉल्ट `true`। बंडल किए गए plugin के साथ यह केवल तब चलता है जब private API probe चालू हो।                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | वही आकार, **वही डिफ़ॉल्ट रूप से बंद**। यदि BlueBubbles पर आपके attachments आ रहे थे, तो आपको iMessage ब्लॉक पर इसे स्पष्ट रूप से फिर सेट करना होगा — यह अंतर्निहित रूप से आगे नहीं आता, और जब तक आप ऐसा नहीं करते, आने वाली photos/media बिना किसी `Inbound message` log line के चुपचाप छोड़ दी जाएँगी।                                                                          |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | स्थानीय roots; वही wildcard नियम।                                                                                                                                                                                                                                                                                                                                                     |
| _(लागू नहीं)_                                              | `channels.imessage.remoteAttachmentRoots` | केवल तब इस्तेमाल होता है जब SCP fetches के लिए `remoteHost` सेट हो।                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage पर डिफ़ॉल्ट 16 MB (BlueBubbles का डिफ़ॉल्ट 8 MB था)। यदि आप निचली सीमा बनाए रखना चाहते हैं, तो स्पष्ट रूप से सेट करें।                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | दोनों पर डिफ़ॉल्ट 4000।                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | वही opt-in। केवल DM — group chats दोनों channels पर तत्काल प्रति-message dispatch रखते हैं। स्पष्ट `messages.inbound.byChannel.imessage` या global `messages.inbound.debounceMs` के बिना सक्षम होने पर डिफ़ॉल्ट inbound debounce को 7000 ms तक बढ़ाता है। [iMessage docs § Coalescing split-send DMs](/hi/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) देखें। |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(लागू नहीं)_                             | iMessage पहले से ही sender display names को `chat.db` से पढ़ता है।                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | प्रति-action toggles: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`।                                                                                                                                                                                                 |

Multi-account configs (`channels.bluebubbles.accounts.*`) एक-से-एक `channels.imessage.accounts.*` में बदलते हैं।

## Group registry footgun

बंडल किया गया iMessage plugin **दो** अलग-अलग group allowlist gates को क्रम से चलाता है। group message के agent तक पहुँचने के लिए दोनों का पास होना आवश्यक है:

1. **Sender / chat-target allowlist** (`channels.imessage.groupAllowFrom`) — `isAllowedIMessageSender` द्वारा जाँचा जाता है। आने वाले messages को sender handle, `chat_guid`, `chat_identifier`, या `chat_id` से match करता है। BlueBubbles जैसा ही आकार।
2. **Group registry** (`channels.imessage.groups`) — `inbound-processing.ts:199` से `resolveChannelGroupPolicy` द्वारा जाँचा जाता है। `groupPolicy: "allowlist"` के साथ, इस gate को इनमें से कोई एक चाहिए:
   - एक `groups: { "*": { ... } }` wildcard प्रविष्टि (`allowAll = true` सेट करती है), या
   - `groups` के अंतर्गत एक स्पष्ट प्रति-`chat_id` प्रविष्टि।

यदि gate 1 पास होता है लेकिन gate 2 fail होता है, तो message छोड़ दिया जाता है। plugin दो `warn`-level संकेत emit करता है, इसलिए यह अब डिफ़ॉल्ट log level पर silent नहीं रहता:

- प्रति account एक बार startup `warn`, जब `groupPolicy: "allowlist"` सेट हो लेकिन `channels.imessage.groups` खाली हो (कोई `"*"` wildcard नहीं, कोई प्रति-`chat_id` प्रविष्टि नहीं) — किसी भी message के आने से पहले fire होता है।
- प्रति-`chat_id` एक बार `warn`, जब runtime पर पहली बार कोई विशिष्ट group छोड़ा जाता है, जिसमें chat_id और उसे allow करने के लिए `groups` में जोड़ने वाली सटीक key बताई जाती है।

DMs काम करना जारी रखते हैं क्योंकि वे अलग code path लेते हैं।

यह सबसे आम BlueBubbles → bundled-iMessage migration failure mode है: ऑपरेटर `groupAllowFrom` और `groupPolicy` कॉपी करते हैं, लेकिन `groups` block छोड़ देते हैं, क्योंकि BlueBubbles का `groups: { "*": { "requireMention": true } }` किसी असंबंधित mention setting जैसा दिखता है। यह असल में registry gate के लिए load-bearing है।

`groupPolicy: "allowlist"` के बाद group messages चालू रखने के लिए न्यूनतम config:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`*` के अंतर्गत `requireMention: true` तब harmless है जब कोई mention patterns configured नहीं हैं: runtime `canDetectMention = false` सेट करता है और `inbound-processing.ts:512` पर mention drop को short-circuit कर देता है। Mention patterns configured होने पर (`agents.list[].groupChat.mentionPatterns`), यह expected तरीके से काम करता है।

अगर gateway logs में `imessage: dropping group message from chat_id=<id>` या startup line `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` दिखे, तो gate 2 drop कर रहा है — `groups` block जोड़ें।

## चरण-दर-चरण

1. मौजूदा BlueBubbles block के साथ एक iMessage block जोड़ें। जब तक Gateway अभी भी BlueBubbles traffic route कर रहा है, इसे disabled रखें:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Traffic महत्वपूर्ण होने से पहले probe करें** — Gateway रोकें, iMessage block को temporarily enable करें, और CLI से confirm करें कि iMessage healthy report करता है:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` केवल configured, enabled accounts को probe करता है। जब तक आप जानबूझकर दोनों channel monitors चलाना नहीं चाहते, BlueBubbles और iMessage दोनों enabled रखकर Gateway restart न करें। अगर आप तुरंत cut over नहीं कर रहे हैं, तो Gateway restart करने से पहले `channels.imessage.enabled` को वापस `false` पर सेट करें। OpenClaw traffic enable करने से पहले Mac validate करने के लिए [शुरू करने से पहले](#before-you-start) में direct `imsg` commands का उपयोग करें।

3. **Cut over करें।** Enabled iMessage account healthy report करने के बाद, BlueBubbles config हटाएं और iMessage enabled रखें:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   gateway restart करें। Inbound iMessage traffic अब bundled plugin से होकर flow करता है।

4. **DMs verify करें।** Agent को direct message भेजें; confirm करें कि reply पहुंचता है।

5. **Groups अलग से verify करें।** DMs और groups अलग code paths लेते हैं — DM success यह prove नहीं करता कि groups route हो रहे हैं। Agent को paired group chat में message भेजें और confirm करें कि reply पहुंचता है। अगर group silent हो जाता है (कोई agent reply नहीं, कोई error नहीं), तो gateway log में `imessage: dropping group message from chat_id=<id>` या startup की `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` line देखें — दोनों default log level पर fire होती हैं। अगर इनमें से कोई दिखे, तो आपका `groups` block missing या empty है — ऊपर "Group registry footgun" देखें।

6. **Action surface verify करें** — paired DM से, agent से react, edit, unsend, reply, photo भेजने, और (group में) group rename करने / participant add या remove करने को कहें। हर action Messages.app में natively land होना चाहिए। अगर कोई "iMessage `<action>` requires the imsg private API bridge" throw करता है, तो `imsg launch` फिर से चलाएं और `channels status --probe` refresh करें।

7. iMessage DMs, groups, और actions verify हो जाने के बाद **BlueBubbles server और config हटाएं**। OpenClaw `channels.bluebubbles` का उपयोग नहीं करेगा।

## Action parity एक नज़र में

| Action                                              | legacy BlueBubbles                  | bundled iMessage                                                              |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Text भेजें / SMS fallback                           | ✅                                  | ✅                                                                            |
| Media भेजें (photo, video, file, voice)             | ✅                                  | ✅                                                                            |
| Threaded reply (`reply_to_guid`)                    | ✅                                  | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) को बंद करता है) |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Edit / unsend (macOS 13+ recipients)                | ✅                                  | ✅                                                                            |
| Screen effect के साथ भेजें                          | ✅                                  | ✅ ([#9394](https://github.com/openclaw/openclaw/issues/9394) का हिस्सा बंद करता है) |
| Rich text bold / italic / underline / strikethrough | ✅                                  | ✅ (attributedBody के जरिए typed-run formatting)                              |
| Group rename करें / group icon set करें             | ✅                                  | ✅                                                                            |
| Participant add / remove करें, group छोड़ें         | ✅                                  | ✅                                                                            |
| Read receipts और typing indicator                   | ✅                                  | ✅ (private API probe पर gated)                                               |
| Same-sender DM coalescing                           | ✅                                  | ✅ (केवल DM; `channels.imessage.coalesceSameSenderDms` के जरिए opt-in)        |
| Restart के बाद inbound recovery                     | ✅ (Webhook replay + history fetch) | ✅ (automatic: since_rowid + dedupe के जरिए missed replay; local पर wider window) |

iMessage gateway down रहने के दौरान missed messages recover करता है: startup पर यह `imsg watch.subscribe` `since_rowid` के जरिए last dispatched rowid से replay करता है और GUID से dedupe करता है, जबकि stale-backlog age fence Push-flush "backlog bomb" को suppress करता है। यह `imsg` RPC connection पर चलता है, इसलिए remote SSH `cliPath` setups के लिए भी काम करता है; local setups को wider recovery window मिलती है क्योंकि वे `chat.db` पढ़ सकते हैं। [Bridge या gateway restart के बाद inbound recovery](/hi/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart) देखें।

## Pairing, sessions, और ACP bindings

- **Pairing approvals** handle के हिसाब से carry over होते हैं। आपको known senders को फिर से approve करने की जरूरत नहीं है — `channels.imessage.allowFrom` वही `+15555550123` / `user@example.com` strings पहचानता है जो BlueBubbles ने उपयोग की थीं।
- **Sessions** per agent + chat scoped रहती हैं। DMs default `session.dmScope=main` के अंतर्गत agent main session में collapse होते हैं; group sessions per `chat_id` isolated रहती हैं। Session keys अलग हैं (`agent:<id>:imessage:group:<chat_id>` बनाम BlueBubbles equivalent) — BlueBubbles session keys के अंतर्गत पुरानी conversation history iMessage sessions में carry नहीं होती।
- **ACP bindings** जो `match.channel: "bluebubbles"` reference करती हैं, उन्हें `"imessage"` पर update करना होगा। `match.peer.id` shapes (`chat_id:`, `chat_guid:`, `chat_identifier:`, bare handle) identical हैं।

## कोई rollback channel नहीं

Switch back करने के लिए कोई supported BlueBubbles runtime नहीं है। अगर iMessage verification fail होता है, तो `channels.imessage.enabled: false` सेट करें, Gateway restart करें, `imsg` blocker fix करें, और cutover retry करें।

Reply cache SQLite plugin state में रहता है। `openclaw doctor --fix` मौजूद होने पर पुराने `imessage/reply-cache.jsonl` sidecar को import और archive करता है।

## संबंधित

- [BlueBubbles removal और imsg iMessage path](/hi/announcements/bluebubbles-imessage) — संक्षिप्त announcement और operator summary।
- [iMessage](/hi/channels/imessage) — पूरा iMessage channel reference, जिसमें `imsg launch` setup और capability detection शामिल हैं।
- `/channels/bluebubbles` — legacy URL जो इस migration guide पर redirect करता है।
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow।
- [Channel Routing](/hi/channels/channel-routing) — gateway outbound replies के लिए channel कैसे चुनता है।
