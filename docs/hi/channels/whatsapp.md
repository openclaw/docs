---
read_when:
    - WhatsApp/वेब चैनल व्यवहार या इनबॉक्स रूटिंग पर काम करना
summary: WhatsApp चैनल समर्थन, एक्सेस नियंत्रण, डिलीवरी व्यवहार, और संचालन
title: WhatsApp
x-i18n:
    generated_at: "2026-06-28T22:41:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

स्थिति: WhatsApp Web (Baileys) के ज़रिए उत्पादन के लिए तैयार। Gateway लिंक किए गए सत्रों का स्वामी होता है।

## इंस्टॉल करें (मांग पर)

- ऑनबोर्डिंग (`openclaw onboard`) और `openclaw channels add --channel whatsapp`
  पहली बार इसे चुनने पर WhatsApp Plugin इंस्टॉल करने का संकेत देते हैं।
- `openclaw channels login --channel whatsapp` भी Plugin अभी मौजूद न होने पर
  इंस्टॉल प्रवाह पेश करता है।
- Dev चैनल + git checkout: स्थानीय Plugin पथ पर डिफ़ॉल्ट करता है।
- Stable/Beta: पहले ClawHub से आधिकारिक `@openclaw/whatsapp` Plugin इंस्टॉल करता है,
  और fallback के रूप में npm का उपयोग करता है।
- WhatsApp रनटाइम core OpenClaw npm पैकेज के बाहर वितरित किया जाता है ताकि
  WhatsApp-विशिष्ट रनटाइम निर्भरताएं बाहरी Plugin के साथ रहें।

मैनुअल इंस्टॉल उपलब्ध रहता है:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

bare npm पैकेज (`@openclaw/whatsapp`) का उपयोग केवल तब करें जब आपको registry
fallback की ज़रूरत हो। exact version केवल तब pin करें जब आपको reproducible install चाहिए।

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    अज्ञात प्रेषकों के लिए डिफ़ॉल्ट DM नीति pairing है।
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल निदान और मरम्मत playbooks।
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/hi/gateway/configuration">
    पूर्ण चैनल config patterns और उदाहरण।
  </Card>
</CardGroup>

## त्वरित सेटअप

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    वर्तमान login QR-आधारित है। remote या headless परिवेशों में, login शुरू करने से
    पहले सुनिश्चित करें कि live QR code को उस phone तक पहुंचाने का विश्वसनीय रास्ता
    है जो उसे scan करेगा।

    किसी विशिष्ट account के लिए:

```bash
openclaw channels login --channel whatsapp --account work
```

    login से पहले मौजूदा/custom WhatsApp Web auth directory attach करने के लिए:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing requests 1 घंटे के बाद expire हो जाती हैं। Pending requests प्रति चैनल 3 तक सीमित हैं।

  </Step>
</Steps>

<Note>
OpenClaw संभव होने पर WhatsApp को अलग नंबर पर चलाने की अनुशंसा करता है। (चैनल metadata और setup flow उस setup के लिए optimized हैं, लेकिन personal-number setups भी समर्थित हैं।)
</Note>

<Warning>
वर्तमान WhatsApp setup flow केवल QR है। Terminal-rendered QRs, screenshots,
PDFs, या chat attachments remote machine से relay होते समय expire हो सकते हैं या
अपठनीय हो सकते हैं। remote/headless hosts के लिए, manual terminal capture की तुलना में direct QR image
handoff path को प्राथमिकता दें।
</Warning>

## परिनियोजन patterns

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    यह सबसे साफ़ operational mode है:

    - OpenClaw के लिए अलग WhatsApp identity
    - अधिक स्पष्ट DM allowlists और routing boundaries
    - self-chat भ्रम की कम संभावना

    न्यूनतम policy pattern:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    ऑनबोर्डिंग personal-number mode का समर्थन करती है और self-chat-friendly baseline लिखती है:

    - `dmPolicy: "allowlist"`
    - `allowFrom` में आपका personal number शामिल होता है
    - `selfChatMode: true`

    रनटाइम में, self-chat protections linked self number और `allowFrom` पर आधारित होती हैं।

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    messaging platform चैनल वर्तमान OpenClaw चैनल architecture में WhatsApp Web-आधारित (`Baileys`) है।

    built-in chat-channel registry में कोई अलग Twilio WhatsApp messaging channel नहीं है।

  </Accordion>
</AccordionGroup>

## रनटाइम model

- Gateway WhatsApp socket और reconnect loop का स्वामी होता है।
- reconnect watchdog केवल inbound app-message volume नहीं, बल्कि WhatsApp Web transport activity का उपयोग करता है, इसलिए quiet linked-device session को केवल इसलिए restart नहीं किया जाता कि हाल में किसी ने message नहीं भेजा है। लंबा application-silence cap फिर भी reconnect force करता है यदि transport frames आते रहें लेकिन watchdog window के लिए कोई application messages handle न हों; हाल में active session के transient reconnect के बाद, वह application-silence check पहले recovery window के लिए normal message timeout का उपयोग करता है।
- Baileys socket timings `web.whatsapp.*` के अंतर्गत explicit हैं: `keepAliveIntervalMs` WhatsApp Web application pings नियंत्रित करता है, `connectTimeoutMs` opening handshake timeout नियंत्रित करता है, और `defaultQueryTimeoutMs` Baileys query waits के साथ OpenClaw के local outbound send/presence और inbound read-receipt operation bounds नियंत्रित करता है।
- Outbound sends को target account के लिए active WhatsApp listener चाहिए।
- Group sends text और media captions में `@+<digits>` और `@<digits>` tokens के लिए native mention metadata attach करते हैं जब token वर्तमान WhatsApp participant metadata से match करता है, जिसमें LID-backed groups शामिल हैं।
- Status और broadcast chats ignore किए जाते हैं (`@status`, `@broadcast`)।
- reconnect watchdog केवल inbound app-message volume नहीं, बल्कि WhatsApp Web transport activity का पालन करता है: quiet linked-device sessions transport frames जारी रहने तक up रहते हैं, लेकिन transport stall बाद के remote disconnect path से काफी पहले reconnect force करता है।
- Direct chats DM session rules का उपयोग करते हैं (`session.dmScope`; default `main` DMs को agent main session में collapse करता है)।
- Group sessions isolated हैं (`agent:<agentId>:whatsapp:group:<jid>`)।
- WhatsApp Channels/Newsletters अपने native `@newsletter` JID के साथ explicit outbound targets हो सकते हैं। Outbound newsletter sends DM session semantics के बजाय channel session metadata (`agent:<agentId>:whatsapp:channel:<jid>`) का उपयोग करते हैं।
- WhatsApp Web transport gateway host पर standard proxy environment variables (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / lowercase variants) का सम्मान करता है। channel-specific WhatsApp proxy settings की तुलना में host-level proxy config को प्राथमिकता दें।
- जब `messages.removeAckAfterReply` enabled होता है, OpenClaw visible reply deliver होने के बाद WhatsApp ack reaction clear कर देता है।

## Approval prompts

WhatsApp `👍` / `👎` reactions के साथ exec और plugin approval prompts render कर सकता है। Delivery
top-level approval forwarding config द्वारा नियंत्रित होती है:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` और `approvals.plugin` independent हैं। WhatsApp को channel के रूप में enable करना केवल
transport link करता है; यह approval prompts तब तक नहीं भेजता जब तक matching approval family enabled न हो
और WhatsApp पर route न करे। Session mode native emoji approvals केवल उन approvals के लिए deliver करता है जो
WhatsApp से originate होती हैं। Target mode explicit WhatsApp targets के लिए shared forwarding pipeline का उपयोग करता है
और अलग approver-DM fanout create नहीं करता।

WhatsApp approval reactions को `allowFrom` या `"*"` से explicit WhatsApp approvers चाहिए।
`defaultTo` ordinary default message targets नियंत्रित करता है; यह approval approver नहीं है। Manual
`/approve` commands approval resolution से पहले अभी भी normal WhatsApp sender authorization path से गुजरती हैं।

## Plugin hooks और गोपनीयता

WhatsApp inbound messages में personal message content, phone numbers,
group identifiers, sender names, और session correlation fields हो सकते हैं। इसी कारण,
WhatsApp inbound `message_received` hook payloads को plugins तक broadcast नहीं करता
जब तक आप explicit opt in न करें:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

आप opt-in को एक account तक scope कर सकते हैं:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

इसे केवल उन plugins के लिए enable करें जिन पर आप inbound WhatsApp message
content और identifiers receive करने के लिए भरोसा करते हैं।

## Access control और activation

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` direct chat access नियंत्रित करता है:

    - `pairing` (default)
    - `allowlist`
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    `allowFrom` E.164-style numbers स्वीकार करता है (internally normalized)।

    `allowFrom` DM sender access-control list है। यह WhatsApp group JIDs या `@newsletter` channel JIDs को explicit outbound sends gate नहीं करता।

    Multi-account override: `channels.whatsapp.accounts.<id>.dmPolicy` (और `allowFrom`) उस account के लिए channel-level defaults पर precedence लेते हैं।

    रनटाइम behavior details:

    - pairings channel allow-store में persisted होती हैं और configured `allowFrom` के साथ merge की जाती हैं
    - scheduled automation और Heartbeat recipient fallback explicit delivery targets या configured `allowFrom` का उपयोग करते हैं; DM pairing approvals implicit Cron या Heartbeat recipients नहीं हैं
    - यदि कोई allowlist configured नहीं है, linked self number default रूप से allowed होता है
    - OpenClaw outbound `fromMe` DMs (linked device से खुद को भेजे गए messages) को कभी auto-pair नहीं करता

  </Tab>

  <Tab title="Group policy + allowlists">
    Group access की दो layers हैं:

    1. **Group membership allowlist** (`channels.whatsapp.groups`)
       - यदि `groups` omitted है, तो सभी groups eligible हैं
       - यदि `groups` present है, तो यह group allowlist की तरह कार्य करता है (`"*"` allowed)

    2. **Group sender policy** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: sender allowlist bypassed
       - `allowlist`: sender को `groupAllowFrom` (या `*`) से match करना होगा
       - `disabled`: सभी group inbound block करें

    Sender allowlist fallback:

    - यदि `groupAllowFrom` unset है, runtime उपलब्ध होने पर `allowFrom` पर fallback करता है
    - sender allowlists mention/reply activation से पहले evaluated होती हैं

    नोट: यदि कोई `channels.whatsapp` block बिल्कुल मौजूद नहीं है, runtime group-policy fallback `allowlist` है (warning log के साथ), भले ही `channels.defaults.groupPolicy` set हो।

  </Tab>

  <Tab title="Mentions + /activation">
    Group replies को default रूप से mention चाहिए।

    Mention detection में शामिल हैं:

    - bot identity के explicit WhatsApp mentions
    - configured mention regex patterns (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - authorized group messages के inbound voice-note transcripts
    - implicit reply-to-bot detection (reply sender bot identity से match करता है)

    Security note:

    - quote/reply केवल mention gating satisfy करता है; यह sender authorization grant **नहीं** करता
    - `groupPolicy: "allowlist"` के साथ, non-allowlisted senders अभी भी blocked होते हैं, भले ही वे allowlisted user के message का reply करें

    Session-level activation command:

    - `/activation mention`
    - `/activation always`

    `activation` session state update करता है (global config नहीं)। यह owner-gated है।

  </Tab>
</Tabs>

## Configured ACP bindings

WhatsApp top-level `bindings[]` entries के साथ persistent ACP bindings support करता है:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- सीधे चैट `+15555550123` जैसे E.164 नंबरों से मेल खाते हैं।
- समूह `120363424282127706@g.us` जैसे WhatsApp समूह JID से मेल खाते हैं।
- OpenClaw द्वारा कॉन्फ़िगर किया गया ACP सत्र मौजूद है यह सुनिश्चित करने से पहले समूह allowlist, प्रेषक नीति, और mention या activation gating चलते हैं।
- मेल खाई हुई कॉन्फ़िगर की गई ACP binding route की स्वामी होती है। WhatsApp broadcast समूह उस turn को सामान्य WhatsApp sessions में fan out नहीं करते।

## निजी-नंबर और self-chat व्यवहार

जब लिंक किया गया self number `allowFrom` में भी मौजूद होता है, तो WhatsApp self-chat safeguards सक्रिय होते हैं:

- self-chat turns के लिए read receipts छोड़ें
- mention-JID auto-trigger व्यवहार को अनदेखा करें, जो अन्यथा आपको ही ping करता
- यदि `messages.responsePrefix` unset है, तो self-chat replies डिफ़ॉल्ट रूप से `[{identity.name}]` या `[openclaw]` होते हैं

## संदेश normalization और context

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    आने वाले WhatsApp संदेश shared inbound envelope में wrap किए जाते हैं।

    यदि quoted reply मौजूद है, तो context इस रूप में जोड़ा जाता है:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    उपलब्ध होने पर reply metadata fields भी भरे जाते हैं (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)।
    जब quoted reply target downloadable media होता है, OpenClaw उसे सामान्य inbound media store के माध्यम से सहेजता है और उसे `MediaPath`/`MediaType` के रूप में expose करता है ताकि agent केवल `<media:image>` देखने के बजाय संदर्भित image inspect कर सके।

  </Accordion>

  <Accordion title="Media placeholders और location/contact extraction">
    केवल-media वाले inbound messages को इन जैसे placeholders के साथ normalize किया जाता है:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Authorized group voice notes को mention gating से पहले transcribe किया जाता है जब body केवल `<media:audio>` होती है, ताकि voice note में bot mention कहना reply trigger कर सके। यदि transcript अब भी bot का mention नहीं करता, तो raw placeholder के बजाय transcript pending group history में रखा जाता है।

    Location bodies संक्षिप्त coordinate text का उपयोग करती हैं। Location labels/comments और contact/vCard details fenced untrusted metadata के रूप में render किए जाते हैं, inline prompt text के रूप में नहीं।

  </Accordion>

  <Accordion title="Pending group history injection">
    समूहों के लिए, unprocessed messages को buffer किया जा सकता है और bot के अंततः trigger होने पर context के रूप में inject किया जा सकता है।

    - default limit: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disables

    Injection markers:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Accepted inbound WhatsApp messages के लिए read receipts डिफ़ॉल्ट रूप से enabled होते हैं।

    globally disable करें:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Per-account override:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Self-chat turns read receipts छोड़ देते हैं, भले ही globally enabled हों।

  </Accordion>
</AccordionGroup>

## Delivery, chunking, और media

<AccordionGroup>
  <Accordion title="Text chunking">
    - default chunk limit: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` mode paragraph boundaries (blank lines) को प्राथमिकता देता है, फिर length-safe chunking पर fallback करता है

  </Accordion>

  <Accordion title="Outbound media behavior">
    - image, video, audio (PTT voice-note), और document payloads का समर्थन करता है
    - audio media Baileys `audio` payload के माध्यम से `ptt: true` के साथ भेजा जाता है, ताकि WhatsApp clients उसे push-to-talk voice note के रूप में render करें
    - reply payloads `audioAsVoice` को preserve करते हैं; WhatsApp के लिए TTS voice-note output इसी PTT path पर रहता है, भले ही provider MP3 या WebM लौटाए
    - native Ogg/Opus audio voice-note compatibility के लिए `audio/ogg; codecs=opus` के रूप में भेजा जाता है
    - Microsoft Edge TTS MP3/WebM output सहित non-Ogg audio को PTT delivery से पहले `ffmpeg` से 48 kHz mono Ogg/Opus में transcode किया जाता है
    - `/tts latest` latest assistant reply को एक voice note के रूप में भेजता है और उसी reply के लिए repeat sends suppress करता है; `/tts chat on|off|default` current WhatsApp chat के लिए auto-TTS नियंत्रित करता है
    - animated GIF playback video sends पर `gifPlayback: true` के माध्यम से supported है
    - `forceDocument` / `asDocument` outbound images, GIFs, और videos को Baileys document payload के माध्यम से भेजता है ताकि resolved filename और MIME type preserve करते हुए WhatsApp media compression से बचा जा सके
    - multi-media reply payloads भेजते समय captions पहले media item पर apply किए जाते हैं, लेकिन PTT voice notes audio पहले और visible text अलग से भेजते हैं क्योंकि WhatsApp clients voice-note captions को consistently render नहीं करते
    - media source HTTP(S), `file://`, या local paths हो सकता है

  </Accordion>

  <Accordion title="Media size limits और fallback behavior">
    - inbound media save cap: `channels.whatsapp.mediaMaxMb` (default `50`)
    - outbound media send cap: `channels.whatsapp.mediaMaxMb` (default `50`)
    - per-account overrides `channels.whatsapp.accounts.<accountId>.mediaMaxMb` का उपयोग करते हैं
    - images को limits में fit करने के लिए auto-optimized (resize/quality sweep) किया जाता है, जब तक `forceDocument` / `asDocument` document delivery का अनुरोध न करे
    - media send failure पर, first-item fallback response को silently drop करने के बजाय text warning भेजता है

  </Accordion>
</AccordionGroup>

## Reply quoting

WhatsApp native reply quoting का समर्थन करता है, जहाँ outbound replies inbound message को visibly quote करते हैं। इसे `channels.whatsapp.replyToMode` से नियंत्रित करें।

| मान       | व्यवहार                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | कभी उद्धृत न करें; सादे संदेश के रूप में भेजें                                  |
| `"first"`   | केवल पहले आउटबाउंड उत्तर खंड को उद्धृत करें                             |
| `"all"`     | हर आउटबाउंड उत्तर खंड को उद्धृत करें                                      |
| `"batched"` | तुरंत दिए गए उत्तरों को बिना उद्धरण छोड़े, कतारबद्ध बैच किए गए उत्तरों को उद्धृत करें |

डिफ़ॉल्ट `"off"` है। प्रति-खाता ओवरराइड `channels.whatsapp.accounts.<id>.replyToMode` का उपयोग करते हैं।

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## प्रतिक्रिया स्तर

`channels.whatsapp.reactionLevel` नियंत्रित करता है कि एजेंट WhatsApp पर emoji प्रतिक्रियाओं का कितना व्यापक उपयोग करता है:

| स्तर         | स्वीकृति प्रतिक्रियाएँ | एजेंट-आरंभित प्रतिक्रियाएँ | विवरण                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | नहीं            | नहीं                        | कोई प्रतिक्रिया नहीं                              |
| `"ack"`       | हाँ           | नहीं                        | केवल स्वीकृति प्रतिक्रियाएँ (उत्तर से पहले प्राप्ति)           |
| `"minimal"`   | हाँ           | हाँ (सावधानीपूर्ण)        | सावधानीपूर्ण मार्गदर्शन के साथ स्वीकृति + एजेंट प्रतिक्रियाएँ |
| `"extensive"` | हाँ           | हाँ (प्रोत्साहित)          | प्रोत्साहित मार्गदर्शन के साथ स्वीकृति + एजेंट प्रतिक्रियाएँ   |

डिफ़ॉल्ट: `"minimal"`।

प्रति-खाता ओवरराइड `channels.whatsapp.accounts.<id>.reactionLevel` का उपयोग करते हैं।

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## स्वीकृति प्रतिक्रियाएँ

WhatsApp `channels.whatsapp.ackReaction` के माध्यम से इनबाउंड प्राप्ति पर तुरंत स्वीकृति प्रतिक्रियाओं का समर्थन करता है।
स्वीकृति प्रतिक्रियाएँ `reactionLevel` से नियंत्रित होती हैं — जब `reactionLevel` `"off"` होता है, तो वे दबा दी जाती हैं।

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

व्यवहार नोट्स:

- इनबाउंड स्वीकार होने के तुरंत बाद भेजा जाता है (उत्तर से पहले)
- यदि `ackReaction` बिना `emoji` के मौजूद है, तो WhatsApp रूट किए गए एजेंट की पहचान emoji का उपयोग करता है, और उपलब्ध न होने पर "👀" पर लौटता है; कोई स्वीकृति प्रतिक्रिया न भेजने के लिए `ackReaction` छोड़ दें या `emoji: ""` सेट करें
- विफलताएँ लॉग की जाती हैं, लेकिन सामान्य उत्तर डिलीवरी को ब्लॉक नहीं करतीं
- समूह मोड `mentions`, उल्लेख से ट्रिगर हुए टर्न पर प्रतिक्रिया देता है; समूह सक्रियण `always` इस जाँच के लिए bypass की तरह काम करता है
- WhatsApp `channels.whatsapp.ackReaction` का उपयोग करता है (legacy `messages.ackReaction` यहाँ उपयोग नहीं होता)

## जीवनचक्र स्थिति प्रतिक्रियाएँ

`messages.statusReactions.enabled: true` सेट करें ताकि WhatsApp किसी टर्न के दौरान स्थिर प्राप्ति emoji छोड़ने के बजाय स्वीकृति प्रतिक्रिया को बदल सके। सक्षम होने पर, OpenClaw कतारबद्ध, सोच रहा है, टूल गतिविधि, Compaction, पूर्ण, और त्रुटि जैसी जीवनचक्र स्थितियों के लिए उसी इनबाउंड संदेश प्रतिक्रिया स्लॉट का उपयोग करता है।

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

व्यवहार नोट्स:

- `channels.whatsapp.ackReaction` अब भी नियंत्रित करता है कि स्थिति प्रतिक्रियाएँ सीधे संदेशों और समूहों के लिए पात्र हैं या नहीं।
- कतारबद्ध स्थिति प्रतिक्रिया, सादी स्वीकृति प्रतिक्रियाओं वाले उसी प्रभावी स्वीकृति emoji का उपयोग करती है।
- WhatsApp में प्रति संदेश एक bot प्रतिक्रिया स्लॉट होता है, इसलिए जीवनचक्र अपडेट वर्तमान प्रतिक्रिया को उसी स्थान पर बदल देते हैं।
- `messages.removeAckAfterReply: true` कॉन्फ़िगर किए गए पूर्ण/त्रुटि होल्ड के बाद अंतिम स्थिति प्रतिक्रिया साफ़ करता है।
- टूल emoji श्रेणियों में `tool`, `coding`, `web`, `deploy`, `build`, और `concierge` शामिल हैं।

## बहु-खाता और क्रेडेंशियल

<AccordionGroup>
  <Accordion title="खाता चयन और डिफ़ॉल्ट">
    - खाता ids `channels.whatsapp.accounts` से आते हैं
    - डिफ़ॉल्ट खाता चयन: यदि मौजूद हो तो `default`, अन्यथा पहला कॉन्फ़िगर किया गया खाता id (क्रमबद्ध)
    - lookup के लिए खाता ids आंतरिक रूप से सामान्यीकृत किए जाते हैं

  </Accordion>

  <Accordion title="क्रेडेंशियल पथ और legacy संगतता">
    - वर्तमान auth पथ: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - backup फ़ाइल: `creds.json.bak`
    - `~/.openclaw/credentials/` में legacy डिफ़ॉल्ट auth अब भी डिफ़ॉल्ट-खाता flows के लिए पहचाना/माइग्रेट किया जाता है

  </Accordion>

  <Accordion title="लॉगआउट व्यवहार">
    `openclaw channels logout --channel whatsapp [--account <id>]` उस खाते के लिए WhatsApp auth स्थिति साफ़ करता है।

    जब Gateway पहुँच योग्य हो, तो logout पहले चुने गए खाते के लिए लाइव WhatsApp listener रोकता है, ताकि लिंक किया गया session अगले restart तक संदेश प्राप्त करता न रहे। `openclaw channels remove --channel whatsapp` खाता config अक्षम करने या हटाने से पहले लाइव listener भी रोकता है।

    legacy auth directories में, Baileys auth files हटाई जाती हैं जबकि `oauth.json` संरक्षित रहता है।

  </Accordion>
</AccordionGroup>

## टूल, कार्रवाइयाँ, और config writes

- एजेंट टूल समर्थन में WhatsApp reaction action (`react`) शामिल है।
- Action gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Channel-initiated config writes डिफ़ॉल्ट रूप से सक्षम हैं (`channels.whatsapp.configWrites=false` के माध्यम से अक्षम करें)।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="लिंक नहीं है (QR आवश्यक)">
    लक्षण: channel status लिंक नहीं होने की रिपोर्ट करता है।

    समाधान:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="लिंक है लेकिन disconnected / reconnect loop">
    लक्षण: बार-बार disconnects या reconnect attempts वाला लिंक किया गया खाता।

    शांत खाते सामान्य message timeout के बाद भी connected रह सकते हैं; watchdog
    तब restart करता है जब WhatsApp Web transport activity रुक जाती है, socket बंद हो जाता है, या
    application-level activity लंबे safety window से अधिक समय तक शांत रहती है।

    यदि लॉग बार-बार `status=408 Request Time-out Connection was lost` दिखाते हैं, तो `web.whatsapp` के अंतर्गत Baileys सॉकेट टाइमिंग को समायोजित करें। पहले `keepAliveIntervalMs` को अपने नेटवर्क के idle timeout से कम करें और धीमे या lossy लिंक पर `connectTimeoutMs` बढ़ाएं:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    सुधार:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    यदि host connectivity और timing ठीक करने के बाद भी loop जारी रहता है, तो account auth directory का backup लें और उस account को फिर से link करें:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    यदि `~/.openclaw/logs/whatsapp-health.log` में `Gateway inactive` लिखा है लेकिन
    `openclaw gateway status` और `openclaw channels status --probe` दिखाते हैं कि
    gateway और WhatsApp स्वस्थ हैं, तो `openclaw doctor` चलाएं। Linux पर, doctor
    legacy crontab entries के बारे में चेतावनी देता है जो अभी भी
    `~/.openclaw/bin/ensure-whatsapp.sh` को invoke करती हैं; उन stale entries को
    `crontab -e` से हटाएं क्योंकि cron में systemd user-bus environment नहीं हो सकता और
    वह पुराने script को gateway health गलत report करवाता है।

    जरूरत हो तो, `channels login` से फिर से link करें।

  </Accordion>

  <Accordion title="QR लॉगिन proxy के पीछे timeout हो जाता है">
    लक्षण: `openclaw channels login --channel whatsapp` उपयोग योग्य QR code दिखाने से पहले `status=408 Request Time-out` या TLS socket disconnect के साथ fail हो जाता है।

    WhatsApp Web login gateway host के standard proxy environment (`HTTPS_PROXY`, `HTTP_PROXY`, lowercase variants, और `NO_PROXY`) का उपयोग करता है। सत्यापित करें कि gateway process proxy env inherit करता है और `NO_PROXY` `mmg.whatsapp.net` से match नहीं करता।

  </Accordion>

  <Accordion title="भेजते समय कोई active listener नहीं">
    target account के लिए कोई active gateway listener न होने पर outbound sends तुरंत fail हो जाते हैं।

    सुनिश्चित करें कि gateway चल रहा है और account linked है।

  </Accordion>

  <Accordion title="Reply transcript में दिखता है लेकिन WhatsApp में नहीं">
    Transcript rows record करती हैं कि agent ने क्या generate किया। WhatsApp delivery अलग से check की जाती है: OpenClaw auto-reply को sent तभी मानता है जब Baileys कम-से-कम एक visible text या media send के लिए outbound message id लौटाता है।

    Ack reactions स्वतंत्र pre-reply receipts हैं। सफल reaction यह साबित नहीं करता कि बाद का text या media reply WhatsApp द्वारा स्वीकार कर लिया गया था।

    `auto-reply delivery failed` या `auto-reply was not accepted by WhatsApp provider` के लिए gateway logs check करें।

  </Accordion>

  <Accordion title="Group messages अप्रत्याशित रूप से ignore हो रहे हैं">
    इस क्रम में जांचें:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist entries
    - mention gating (`requireMention` + mention patterns)
    - `openclaw.json` (JSON5) में duplicate keys: बाद की entries पहले वाली को override करती हैं, इसलिए हर scope में एक ही `groupPolicy` रखें

    यदि `channels.whatsapp.groups` मौजूद है, तो WhatsApp दूसरे groups के messages अभी भी observe कर सकता है, लेकिन OpenClaw उन्हें session routing से पहले drop कर देता है। group JID को `channels.whatsapp.groups` में जोड़ें या सभी groups को admit करने के लिए `groups["*"]` जोड़ें, जबकि sender authorization को `groupPolicy` और `groupAllowFrom` के अंतर्गत रखें।

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp gateway runtime को Node का उपयोग करना चाहिए। स्थिर WhatsApp/Telegram gateway संचालन के लिए Bun को incompatible के रूप में flag किया गया है।
  </Accordion>
</AccordionGroup>

## System prompts

WhatsApp `groups` और `direct` maps के जरिए groups और direct chats के लिए Telegram-style system prompts support करता है।

group messages के लिए resolution hierarchy:

प्रभावी `groups` map पहले निर्धारित किया जाता है: यदि account अपने `groups` परिभाषित करता है, तो यह root `groups` map को पूरी तरह replace करता है (कोई deep merge नहीं)। Prompt lookup फिर resulting single map पर चलता है:

1. **Group-specific system prompt** (`groups["<groupId>"].systemPrompt`): तब उपयोग किया जाता है जब specific group entry map में मौजूद हो **और** उसकी `systemPrompt` key परिभाषित हो। यदि `systemPrompt` empty string (`""`) है, तो wildcard दबा दिया जाता है और कोई system prompt apply नहीं होता।
2. **Group wildcard system prompt** (`groups["*"].systemPrompt`): तब उपयोग किया जाता है जब specific group entry map से पूरी तरह absent हो, या वह मौजूद हो लेकिन कोई `systemPrompt` key define न करती हो।

direct messages के लिए resolution hierarchy:

प्रभावी `direct` map पहले निर्धारित किया जाता है: यदि account अपना `direct` परिभाषित करता है, तो यह root `direct` map को पूरी तरह replace करता है (कोई deep merge नहीं)। Prompt lookup फिर resulting single map पर चलता है:

1. **Direct-specific system prompt** (`direct["<peerId>"].systemPrompt`): तब उपयोग किया जाता है जब specific peer entry map में मौजूद हो **और** उसकी `systemPrompt` key परिभाषित हो। यदि `systemPrompt` empty string (`""`) है, तो wildcard दबा दिया जाता है और कोई system prompt apply नहीं होता।
2. **Direct wildcard system prompt** (`direct["*"].systemPrompt`): तब उपयोग किया जाता है जब specific peer entry map से पूरी तरह absent हो, या वह मौजूद हो लेकिन कोई `systemPrompt` key define न करती हो।

<Note>
`dms` lightweight per-DM history override bucket (`dms.<id>.historyLimit`) बना रहता है। Prompt overrides `direct` के अंतर्गत रहते हैं।
</Note>

**Telegram multi-account behavior से अंतर:** Telegram में, multi-account setup में सभी accounts के लिए root `groups` जानबूझकर दबा दिया जाता है — उन accounts के लिए भी जो अपने `groups` define नहीं करते — ताकि bot उन groups के group messages receive न करे जिनका वह सदस्य नहीं है। WhatsApp यह guard apply नहीं करता: root `groups` और root `direct` हमेशा उन accounts द्वारा inherit किए जाते हैं जो कोई account-level override define नहीं करते, चाहे कितने भी accounts configured हों। multi-account WhatsApp setup में, यदि आप per-account group या direct prompts चाहते हैं, तो root-level defaults पर निर्भर रहने के बजाय हर account के अंतर्गत full map स्पष्ट रूप से define करें।

महत्वपूर्ण behavior:

- `channels.whatsapp.groups` per-group config map और chat-level group allowlist दोनों है। root या account scope में, `groups["*"]` का मतलब उस scope के लिए "सभी groups admit किए जाते हैं" है।
- wildcard group `systemPrompt` केवल तब जोड़ें जब आप पहले से चाहते हों कि वह scope सभी groups को admit करे। यदि आप अब भी केवल group IDs के fixed set को eligible रखना चाहते हैं, तो prompt default के लिए `groups["*"]` का उपयोग न करें। इसके बजाय, हर explicitly allowlisted group entry पर prompt दोहराएं।
- Group admission और sender authorization अलग-अलग checks हैं। `groups["*"]` उन groups के set को widen करता है जो group handling तक पहुंच सकते हैं, लेकिन यह अपने आप उन groups में हर sender को authorize नहीं करता। Sender access अब भी `channels.whatsapp.groupPolicy` और `channels.whatsapp.groupAllowFrom` द्वारा अलग से नियंत्रित होता है।
- `channels.whatsapp.direct` का DMs के लिए वही side effect नहीं है। `direct["*"]` केवल तब default direct-chat config प्रदान करता है जब कोई DM पहले से `dmPolicy` plus `allowFrom` या pairing-store rules द्वारा admit हो चुका हो।

उदाहरण:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Configuration reference pointers

Primary reference:

- [Configuration reference - WhatsApp](/hi/gateway/config-channels#whatsapp)

High-signal WhatsApp fields:

- access: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- delivery: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, account-level overrides
- operations: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- session behavior: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Related

- [Pairing](/hi/channels/pairing)
- [Groups](/hi/channels/groups)
- [Security](/hi/gateway/security)
- [Channel routing](/hi/channels/channel-routing)
- [Multi-agent routing](/hi/concepts/multi-agent)
- [Troubleshooting](/hi/channels/troubleshooting)
