---
read_when:
    - WhatsApp/वेब चैनल व्यवहार या इनबॉक्स रूटिंग पर काम करना
summary: WhatsApp चैनल समर्थन, अभिगम नियंत्रण, डिलीवरी व्यवहार, और संचालन
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:38:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

स्थिति: WhatsApp Web (Baileys) के माध्यम से production-ready। Gateway linked session(s) का स्वामी है।

## इंस्टॉल (मांग पर)

- Onboarding (`openclaw onboard`) और `openclaw channels add --channel whatsapp`
  पहली बार इसे चुनने पर WhatsApp Plugin इंस्टॉल करने का prompt देते हैं।
- `openclaw channels login --channel whatsapp` भी तब install flow प्रदान करता है जब
  Plugin अभी मौजूद नहीं होता।
- Dev channel + git checkout: local Plugin path पर डिफ़ॉल्ट होता है।
- Stable/Beta: पहले ClawHub से आधिकारिक `@openclaw/whatsapp` Plugin इंस्टॉल करता है,
  fallback के रूप में npm के साथ।
- WhatsApp runtime core OpenClaw npm package के बाहर वितरित किया जाता है ताकि
  WhatsApp-specific runtime dependencies external Plugin के साथ रहें।

Manual install उपलब्ध रहता है:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

bare npm package (`@openclaw/whatsapp`) का उपयोग केवल तब करें जब आपको registry
fallback चाहिए। exact version को केवल तब pin करें जब आपको reproducible install चाहिए।

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    अज्ञात senders के लिए default DM policy pairing है।
  </Card>
  <Card title="Channel समस्या-निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    Cross-channel diagnostics और repair playbooks।
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/hi/gateway/configuration">
    पूर्ण channel config patterns और examples।
  </Card>
</CardGroup>

## त्वरित setup

<Steps>
  <Step title="WhatsApp access policy configure करें">

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

  <Step title="WhatsApp link करें (QR)">

```bash
openclaw channels login --channel whatsapp
```

    वर्तमान login QR-based है। remote या headless environments में, login शुरू करने से
    पहले सुनिश्चित करें कि live QR code को उस phone तक पहुंचाने का reliable path है
    जो इसे scan करेगा।

    specific account के लिए:

```bash
openclaw channels login --channel whatsapp --account work
```

    login से पहले existing/custom WhatsApp Web auth directory attach करने के लिए:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="gateway शुरू करें">

```bash
openclaw gateway
```

  </Step>

  <Step title="पहली pairing request approve करें (यदि pairing mode का उपयोग कर रहे हैं)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing requests 1 घंटे बाद expire हो जाती हैं। Pending requests प्रति channel 3 तक सीमित हैं।

  </Step>
</Steps>

<Note>
OpenClaw संभव होने पर WhatsApp को एक अलग number पर चलाने की सिफारिश करता है। (channel metadata और setup flow इस setup के लिए optimized हैं, लेकिन personal-number setups भी समर्थित हैं।)
</Note>

<Warning>
वर्तमान WhatsApp setup flow केवल QR है। Terminal-rendered QRs, screenshots,
PDFs, या chat attachments remote machine से relay होते समय expire हो सकते हैं या unreadable हो सकते हैं।
remote/headless hosts के लिए, manual terminal capture के बजाय direct QR image
handoff path को प्राथमिकता दें।
</Warning>

## वर्तमान requester को MeowCaller से call करें (experimental)

WhatsApp Plugin WhatsApp-originated agent turns में `whatsapp_call` expose कर सकता है। tool
वर्तमान authorized requester को WhatsApp voice call करने के लिए [MeowCaller](https://github.com/purpshell/meowcaller) का उपयोग करता है
और उनके answer करने के बाद OpenClaw TTS message चलाता है। tool
destination number स्वीकार नहीं करता, इसलिए prompt call को third party पर redirect नहीं कर सकता।
यह experimental capability default रूप से disabled है।

<Warning>
MeowCaller experimental है, इसका कोई tagged release नहीं है, और यह अलग से paired whatsmeow
linked-device session का उपयोग करता है। यह WhatsApp Plugin के Baileys credentials reuse नहीं कर सकता। Pairing उसी WhatsApp account में
एक और linked device जोड़ती है। OpenClaw द्वारा उपयोग की गई WhatsApp identity से scan करें।
Personal-number/self-chat mode खुद को call नहीं कर सकता; अपने personal number को call करने के लिए dedicated OpenClaw number
का उपयोग करें।
</Warning>

<Steps>
  <Step title="experimental calls enable करें">

    `openclaw.json` में WhatsApp channel में `actions.calls: true` जोड़ें:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    इसे अपनी existing WhatsApp configuration में merge करें, फिर gateway restart करें। जब
    setting absent या `false` होती है, OpenClaw agent को `whatsapp_call` tool expose नहीं करता।

  </Step>

  <Step title="reviewed MeowCaller CLI इंस्टॉल करें">

    adapter gateway host के `PATH` पर `meowcaller` नाम का executable अपेक्षित करता है।
    जब तक [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) merge नहीं होता, commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f` पर
    reviewed branch build करें:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    सुनिश्चित करें कि `$HOME/.local/bin` gateway service के `PATH` पर भी है। यह revision
    explicit `pair` और send-only `notify` commands प्रदान करता है। `notify` कोई microphone, speaker,
    video device, inbound audio sink, या diagnostic capture नहीं खोलता। example
    CLI के `play` command से substitute न करें।

  </Step>

  <Step title="MeowCaller linked device pair करें">

    WhatsApp agent से call setup check करने को कहें। `whatsapp_call` status action
    account-specific state directory और pairing command report करता है। default account के लिए:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    command को interactive terminal में run करें। इसका QR **WhatsApp > Linked devices** से scan करें
    और `MeowCaller linked device ready` की प्रतीक्षा करें। फिर command exit हो जाता है। `wa-voip.db`
    private रखें; यह MeowCaller linked-device session है। non-default account का उपयोग करने पर
    `whatsapp_call` status action account-specific command और shell return करता है। Windows पर,
    इसका PowerShell command run करें; MeowCaller store directory बनाता है।

  </Step>

  <Step title="TTS configure करें और WhatsApp से call करें">

    telephony-capable [TTS provider](/hi/tools/tts) configure करें, gateway restart करें, फिर
    WhatsApp request भेजें जैसे `Call me and say the build finished.` tool trusted inbound context से sender
    resolve करता है, temporary private WAV file synthesize करता है, bounded call window के लिए MeowCaller run करता है,
    और बाद में audio file delete कर देता है। OpenClaw account का
    store explicitly pass करता है, answer, playback, और hangup के बाद zero exit status की प्रतीक्षा करता है, और
    timeout या nonzero exit को failed tool call मानता है।

  </Step>
</Steps>

वर्तमान सीमाएं:

- केवल one-to-one outbound audio calls
- arbitrary destination numbers नहीं
- chat connection के साथ shared auth नहीं
- personal-number/self-chat mode से self-calls नहीं
- synthesized audio 60 seconds तक सीमित है
- MeowCaller के answer/playback/hangup completion से आगे handset-side audibility receipt नहीं
- OpenClaw companion process को bounded 115–175 second window के बाद stop करता है, जिसमें
  MeowCaller की connection, answer, playback, और shutdown phases शामिल हैं

## Deployment patterns

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    यह सबसे साफ operational mode है:

    - OpenClaw के लिए अलग WhatsApp identity
    - अधिक स्पष्ट DM allowlists और routing boundaries
    - self-chat confusion की कम संभावना

    Minimal policy pattern:

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
    Onboarding personal-number mode का समर्थन करता है और self-chat-friendly baseline लिखता है:

    - `dmPolicy: "allowlist"`
    - `allowFrom` में आपका personal number शामिल होता है
    - `selfChatMode: true`

    runtime में, self-chat protections linked self number और `allowFrom` पर key off करती हैं।

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    messaging platform channel वर्तमान OpenClaw channel architecture में WhatsApp Web-based (`Baileys`) है।

    built-in chat-channel registry में कोई अलग Twilio WhatsApp messaging channel नहीं है।

  </Accordion>
</AccordionGroup>

## Runtime model

- Gateway WhatsApp socket और reconnect loop का स्वामी है।
- reconnect watchdog WhatsApp Web transport activity का उपयोग करता है, केवल inbound app-message volume का नहीं, इसलिए quiet linked-device session को केवल इसलिए restart नहीं किया जाता क्योंकि हाल में किसी ने message नहीं भेजा। longer application-silence cap फिर भी reconnect force करता है यदि transport frames आते रहते हैं लेकिन watchdog window के लिए कोई application messages handle नहीं होते; recently active session के transient reconnect के बाद, वह application-silence check first recovery window के लिए normal message timeout का उपयोग करता है।
- Baileys socket timings `web.whatsapp.*` के अंतर्गत explicit हैं: `keepAliveIntervalMs` WhatsApp Web application pings control करता है, `connectTimeoutMs` opening handshake timeout control करता है, और `defaultQueryTimeoutMs` Baileys query waits plus OpenClaw के local outbound send/presence और inbound read-receipt operation bounds control करता है।
- Outbound sends के लिए target account के लिए active WhatsApp listener आवश्यक है।
- Group sends text और media captions में `@+<digits>` और `@<digits>` tokens के लिए native mention metadata attach करते हैं जब token current WhatsApp participant metadata से match करता है, जिसमें LID-backed groups शामिल हैं।
- Status और broadcast chats ignore किए जाते हैं (`@status`, `@broadcast`)।
- reconnect watchdog WhatsApp Web transport activity का पालन करता है, केवल inbound app-message volume का नहीं: quiet linked-device sessions transport frames जारी रहने तक up रहते हैं, लेकिन transport stall बाद के remote disconnect path से काफी पहले reconnect force करता है।
- Direct chats DM session rules (`session.dmScope`; default `main` DMs को agent main session में collapse करता है) का उपयोग करते हैं।
- Group sessions isolated हैं (`agent:<agentId>:whatsapp:group:<jid>`)।
- WhatsApp Channels/Newsletters अपने native `@newsletter` JID के साथ explicit outbound targets हो सकते हैं। Outbound newsletter sends DM session semantics के बजाय channel session metadata (`agent:<agentId>:whatsapp:channel:<jid>`) का उपयोग करते हैं।
- WhatsApp Web transport gateway host पर standard proxy environment variables (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / lowercase variants) का सम्मान करता है। channel-specific WhatsApp proxy settings के बजाय host-level proxy config को प्राथमिकता दें।
- जब `messages.removeAckAfterReply` enabled होता है, OpenClaw visible reply deliver होने के बाद WhatsApp ack reaction clear करता है।

## Approval prompts

WhatsApp exec और Plugin approval prompts को `👍` / `👎` reactions के साथ render कर सकता है। Delivery
top-level approval forwarding config से controlled है:

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
transport link करता है; यह approval prompts नहीं भेजता जब तक matching approval family enabled न हो
और WhatsApp को route न करे। Session mode native emoji approvals केवल उन approvals के लिए deliver करता है
जो WhatsApp से originate होते हैं। Target mode explicit WhatsApp
targets के लिए shared forwarding pipeline का उपयोग करता है और अलग approver-DM fanout create नहीं करता।

WhatsApp approval reactions के लिए `allowFrom` या `"*"` से explicit WhatsApp approvers आवश्यक हैं।
`defaultTo` ordinary default message targets control करता है; यह approval approver नहीं है। Manual
`/approve` commands approval resolution से पहले अब भी normal WhatsApp sender authorization path से गुजरते हैं।

## Plugin hooks और privacy

WhatsApp इनबाउंड संदेशों में निजी संदेश सामग्री, फोन नंबर,
समूह पहचानकर्ता, प्रेषक नाम, और सत्र सहसंबंध फ़ील्ड हो सकते हैं। इस कारण,
WhatsApp इनबाउंड `message_received` hook payloads को plugins पर प्रसारित नहीं करता
जब तक आप स्पष्ट रूप से opt in न करें:

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

आप opt-in को एक खाते तक सीमित कर सकते हैं:

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

इसे केवल उन plugins के लिए सक्षम करें जिन पर आप इनबाउंड WhatsApp संदेश
सामग्री और पहचानकर्ता प्राप्त करने के लिए भरोसा करते हैं।

## एक्सेस नियंत्रण और सक्रियण

<Tabs>
  <Tab title="DM नीति">
    `channels.whatsapp.dmPolicy` प्रत्यक्ष चैट एक्सेस नियंत्रित करता है:

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist`
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    `allowFrom` E.164-शैली के नंबर स्वीकार करता है (आंतरिक रूप से सामान्यीकृत)।

    `allowFrom` एक DM प्रेषक एक्सेस-नियंत्रण सूची है। यह WhatsApp समूह JIDs या `@newsletter` चैनल JIDs पर स्पष्ट आउटबाउंड भेजने को gate नहीं करता।

    मल्टी-खाता override: `channels.whatsapp.accounts.<id>.dmPolicy` (और `allowFrom`) उस खाते के लिए चैनल-स्तरीय डिफ़ॉल्ट से प्राथमिकता लेते हैं।

    Runtime व्यवहार विवरण:

    - pairings चैनल allow-store में स्थायी रखे जाते हैं और कॉन्फ़िगर किए गए `allowFrom` के साथ merge किए जाते हैं
    - scheduled automation और Heartbeat प्राप्तकर्ता fallback स्पष्ट delivery targets या कॉन्फ़िगर किए गए `allowFrom` का उपयोग करते हैं; DM pairing approvals implicit Cron या Heartbeat recipients नहीं हैं
    - यदि कोई allowlist कॉन्फ़िगर नहीं है, तो linked self number डिफ़ॉल्ट रूप से allowed है
    - OpenClaw कभी भी आउटबाउंड `fromMe` DMs को auto-pair नहीं करता (वे संदेश जो आप linked device से स्वयं को भेजते हैं)

  </Tab>

  <Tab title="समूह नीति + अनुमति-सूचियां">
    समूह एक्सेस की दो परतें हैं:

    1. **समूह सदस्यता allowlist** (`channels.whatsapp.groups`)
       - यदि `groups` छोड़ा गया है, तो सभी समूह पात्र हैं
       - यदि `groups` मौजूद है, तो यह समूह allowlist की तरह काम करता है (`"*"` allowed)

    2. **समूह प्रेषक नीति** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: sender allowlist bypassed
       - `allowlist`: प्रेषक को `groupAllowFrom` (या `*`) से match करना होगा
       - `disabled`: सभी समूह inbound block करें

    प्रेषक allowlist fallback:

    - यदि `groupAllowFrom` unset है, तो runtime उपलब्ध होने पर `allowFrom` पर fallback करता है
    - sender allowlists mention/reply activation से पहले evaluate की जाती हैं

    नोट: यदि कोई `channels.whatsapp` block बिल्कुल मौजूद नहीं है, तो runtime group-policy fallback `allowlist` है (warning log के साथ), भले ही `channels.defaults.groupPolicy` set हो।

  </Tab>

  <Tab title="Mentions + /activation">
    समूह replies को डिफ़ॉल्ट रूप से mention की आवश्यकता होती है।

    Mention detection में शामिल है:

    - bot identity के स्पष्ट WhatsApp mentions
    - कॉन्फ़िगर किए गए mention regex patterns (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - अधिकृत समूह messages के लिए inbound voice-note transcripts
    - implicit reply-to-bot detection (reply sender bot identity से match करता है)

    सुरक्षा नोट:

    - quote/reply केवल mention gating को satisfy करता है; यह sender authorization grant **नहीं** करता
    - `groupPolicy: "allowlist"` के साथ, non-allowlisted senders अब भी block किए जाते हैं, भले ही वे allowlisted user के संदेश का reply करें

    Session-level activation command:

    - `/activation mention`
    - `/activation always`

    `activation` session state update करता है (global config नहीं)। यह owner-gated है।

  </Tab>
</Tabs>

## कॉन्फ़िगर किए गए ACP bindings

WhatsApp top-level `bindings[]` entries के साथ persistent ACP bindings का समर्थन करता है:

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

- Direct chats `+15555550123` जैसे E.164 numbers से match करती हैं।
- Groups `120363424282127706@g.us` जैसे WhatsApp group JIDs से match करते हैं।
- Group allowlists, sender policy, और mention या activation gating OpenClaw द्वारा configured ACP session मौजूद है यह सुनिश्चित करने से पहले चलते हैं।
- Matched configured ACP binding route का owner होता है। WhatsApp broadcast groups उस turn को ordinary WhatsApp sessions तक fan out नहीं करते।

## निजी-नंबर और self-chat व्यवहार

जब linked self number `allowFrom` में भी मौजूद होता है, तो WhatsApp self-chat safeguards activate होते हैं:

- self-chat turns के लिए read receipts skip करें
- mention-JID auto-trigger behavior ignore करें जो अन्यथा आपको स्वयं ping करता
- यदि `messages.responsePrefix` unset है, तो self-chat replies डिफ़ॉल्ट रूप से `[{identity.name}]` या `[openclaw]` होते हैं

## संदेश normalization और context

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    आने वाले WhatsApp messages shared inbound envelope में wrap किए जाते हैं।

    यदि quoted reply मौजूद है, तो context इस रूप में append किया जाता है:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Reply metadata fields भी उपलब्ध होने पर populate किए जाते हैं (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)।
    जब quoted reply target downloadable media होता है, OpenClaw उसे normal inbound media store के माध्यम से save करता है और उसे `MediaPath`/`MediaType` के रूप में expose करता है ताकि
    agent केवल `<media:image>` देखने के बजाय referenced image inspect कर सके।

  </Accordion>

  <Accordion title="Media placeholders और location/contact extraction">
    Media-only inbound messages इन जैसे placeholders के साथ normalize किए जाते हैं:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Authorized group voice notes को mention gating से पहले transcribe किया जाता है जब
    body केवल `<media:audio>` होती है, इसलिए voice note में bot mention बोलने से
    reply trigger हो सकता है। यदि transcript फिर भी bot का mention नहीं करता, तो
    transcript raw placeholder के बजाय pending group history में रखा जाता है।

    Location bodies संक्षिप्त coordinate text का उपयोग करते हैं। Location labels/comments और contact/vCard details fenced untrusted metadata के रूप में render किए जाते हैं, inline prompt text के रूप में नहीं।

  </Accordion>

  <Accordion title="Pending group history injection">
    Groups के लिए, unprocessed messages buffer किए जा सकते हैं और context के रूप में inject किए जा सकते हैं जब bot अंततः trigger होता है।

    - default limit: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disables

    Injection markers:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Accepted inbound WhatsApp messages के लिए read receipts डिफ़ॉल्ट रूप से enabled हैं।

    Globally disable करें:

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

    Self-chat turns read receipts skip करते हैं, भले ही वे globally enabled हों।

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
    - audio media Baileys `audio` payload के माध्यम से `ptt: true` के साथ भेजा जाता है, इसलिए WhatsApp clients इसे push-to-talk voice note के रूप में render करते हैं
    - reply payloads `audioAsVoice` preserve करते हैं; WhatsApp के लिए TTS voice-note output इस PTT path पर ही रहता है, भले ही provider MP3 या WebM लौटाए
    - native Ogg/Opus audio voice-note compatibility के लिए `audio/ogg; codecs=opus` के रूप में भेजा जाता है
    - Microsoft Edge TTS MP3/WebM output सहित non-Ogg audio, PTT delivery से पहले `ffmpeg` के साथ 48 kHz mono Ogg/Opus में transcode किया जाता है
    - `/tts latest` latest assistant reply को एक voice note के रूप में भेजता है और उसी reply के लिए repeat sends suppress करता है; `/tts chat on|off|default` current WhatsApp chat के लिए auto-TTS नियंत्रित करता है
    - animated GIF playback video sends पर `gifPlayback: true` के माध्यम से supported है
    - `forceDocument` / `asDocument` outbound images, GIFs, और videos को Baileys document payload के माध्यम से भेजता है ताकि resolved filename और MIME type preserve रखते हुए WhatsApp media compression से बचा जा सके
    - multi-media reply payloads भेजते समय captions पहले media item पर apply किए जाते हैं, सिवाय इसके कि PTT voice notes audio पहले और visible text अलग से भेजते हैं क्योंकि WhatsApp clients voice-note captions को consistently render नहीं करते
    - media source HTTP(S), `file://`, या local paths हो सकता है

  </Accordion>

  <Accordion title="Media size limits और fallback behavior">
    - inbound media save cap: `channels.whatsapp.mediaMaxMb` (default `50`)
    - outbound media send cap: `channels.whatsapp.mediaMaxMb` (default `50`)
    - per-account overrides `channels.whatsapp.accounts.<accountId>.mediaMaxMb` का उपयोग करते हैं
    - images limits में fit होने के लिए auto-optimized (resize/quality sweep) होती हैं, जब तक `forceDocument` / `asDocument` document delivery request न करे
    - media send failure पर, first-item fallback response को चुपचाप drop करने के बजाय text warning भेजता है

  </Accordion>
</AccordionGroup>

## Reply quoting

WhatsApp native reply quoting का समर्थन करता है, जहाँ outbound replies inbound message को visibly quote करते हैं। इसे `channels.whatsapp.replyToMode` से नियंत्रित करें।

| मान         | व्यवहार                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | कभी quote न करें; plain message के रूप में भेजें                      |
| `"first"`   | केवल first outbound reply chunk quote करें                            |
| `"all"`     | हर outbound reply chunk quote करें                                    |
| `"batched"` | queued batched replies quote करें, immediate replies unquoted छोड़ें |

Default `"off"` है। Per-account overrides `channels.whatsapp.accounts.<id>.replyToMode` का उपयोग करते हैं।

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Reaction level

`channels.whatsapp.reactionLevel` नियंत्रित करता है कि agent WhatsApp पर emoji reactions कितनी व्यापकता से उपयोग करता है:

| स्तर          | Ack reactions | Agent-initiated reactions | विवरण                                             |
| ------------- | ------------- | ------------------------- | ------------------------------------------------- |
| `"off"`       | नहीं          | नहीं                      | कोई reactions नहीं                               |
| `"ack"`       | हाँ           | नहीं                      | केवल Ack reactions (pre-reply receipt)            |
| `"minimal"`   | हाँ           | हाँ (conservative)        | conservative guidance के साथ Ack + agent reactions |
| `"extensive"` | हाँ           | हाँ (encouraged)          | encouraged guidance के साथ Ack + agent reactions  |

Default: `"minimal"`।

Per-account overrides `channels.whatsapp.accounts.<id>.reactionLevel` का उपयोग करते हैं।

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Acknowledgment reactions

WhatsApp `channels.whatsapp.ackReaction` के माध्यम से inbound receipt पर immediate ack reactions का समर्थन करता है।
Ack reactions `reactionLevel` द्वारा gated हैं — जब `reactionLevel` `"off"` होता है, तो वे suppress किए जाते हैं।

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
- अगर `ackReaction` `emoji` के बिना मौजूद है, तो WhatsApp रूट किए गए एजेंट के पहचान इमोजी का उपयोग करता है, और fallback के रूप में "👀" इस्तेमाल करता है; कोई ack प्रतिक्रिया न भेजने के लिए `ackReaction` छोड़ दें या `emoji: ""` सेट करें
- विफलताएं लॉग की जाती हैं लेकिन सामान्य उत्तर डिलीवरी को ब्लॉक नहीं करतीं
- समूह मोड `mentions` उल्लेख से ट्रिगर हुए turns पर प्रतिक्रिया देता है; समूह सक्रियण `always` इस जांच के लिए bypass की तरह काम करता है
- WhatsApp `channels.whatsapp.ackReaction` का उपयोग करता है (legacy `messages.ackReaction` यहां इस्तेमाल नहीं होता)

## Lifecycle स्थिति प्रतिक्रियाएं

WhatsApp को एक turn के दौरान स्थिर receipt इमोजी छोड़ने के बजाय ack प्रतिक्रिया बदलने देने के लिए `messages.statusReactions.enabled: true` सेट करें। सक्षम होने पर, OpenClaw queued, thinking, tool activity, compaction, done, और error जैसी lifecycle स्थितियों के लिए उसी inbound message reaction slot का उपयोग करता है।

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

- `channels.whatsapp.ackReaction` अभी भी नियंत्रित करता है कि status reactions direct messages और groups के लिए पात्र हैं या नहीं।
- queued status reaction वही प्रभावी ack emoji इस्तेमाल करती है जो plain ack reactions करती हैं।
- WhatsApp में प्रति message एक bot reaction slot होता है, इसलिए lifecycle updates मौजूदा reaction को उसी जगह बदल देते हैं।
- `messages.removeAckAfterReply: true` configured done/error hold के बाद final status reaction साफ कर देता है।
- Tool emoji categories में `tool`, `coding`, `web`, `deploy`, `build`, और `concierge` शामिल हैं।

## Multi-account और credentials

<AccordionGroup>
  <Accordion title="Account selection और defaults">
    - account ids `channels.whatsapp.accounts` से आते हैं
    - default account selection: `default` अगर मौजूद हो, नहीं तो पहला configured account id (sorted)
    - lookup के लिए account ids internally normalized होते हैं

  </Accordion>

  <Accordion title="Credential paths और legacy compatibility">
    - वर्तमान auth path: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - backup file: `creds.json.bak`
    - `~/.openclaw/credentials/` में legacy default auth अब भी default-account flows के लिए पहचाना/migrate किया जाता है

  </Accordion>

  <Accordion title="Logout व्यवहार">
    `openclaw channels logout --channel whatsapp [--account <id>]` उस account के लिए WhatsApp auth state साफ करता है।

    जब Gateway reachable हो, तो logout पहले selected account के लिए live WhatsApp listener रोकता है ताकि linked session अगले restart तक messages प्राप्त करता न रहे। `openclaw channels remove --channel whatsapp` भी account config disable या delete करने से पहले live listener रोकता है।

    legacy auth directories में, `oauth.json` संरक्षित रहता है जबकि Baileys auth files हटाई जाती हैं।

  </Accordion>
</AccordionGroup>

## Tools, actions, और config writes

- Agent tool support में WhatsApp reaction action (`react`) शामिल है।
- Action gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Channel-initiated config writes default रूप से enabled हैं (`channels.whatsapp.configWrites=false` के माध्यम से disable करें)।

## Troubleshooting

<AccordionGroup>
  <Accordion title="Linked नहीं है (QR आवश्यक)">
    लक्षण: channel status linked नहीं बताता।

    Fix:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked है लेकिन disconnected / reconnect loop">
    लक्षण: repeated disconnects या reconnect attempts वाला linked account।

    शांत accounts सामान्य message timeout से आगे connected रह सकते हैं; watchdog
    तब restart होता है जब WhatsApp Web transport activity रुकती है, socket बंद होता है, या
    application-level activity लंबे safety window से आगे silent रहती है।

    अगर logs में repeated `status=408 Request Time-out Connection was lost` दिखे, तो
    `web.whatsapp` के तहत Baileys socket timings tune करें। अपने network के idle timeout से कम
    `keepAliveIntervalMs` करने और slow या lossy links पर
    `connectTimeoutMs` बढ़ाने से शुरू करें:

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

    Fix:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    अगर host connectivity और timing ठीक होने के बाद भी loop जारी रहे, तो
    account auth directory का backup लें और उस account को दोबारा link करें:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    अगर `~/.openclaw/logs/whatsapp-health.log` में `Gateway inactive` लिखा हो लेकिन
    `openclaw gateway status` और `openclaw channels status --probe` gateway और WhatsApp को healthy दिखाएं, तो `openclaw doctor` चलाएं। Linux पर, doctor
    legacy crontab entries के बारे में चेतावनी देता है जो अभी भी
    `~/.openclaw/bin/ensure-whatsapp.sh` invoke करती हैं; उन stale entries को
    `crontab -e` से हटाएं क्योंकि cron में systemd user-bus environment नहीं हो सकता और
    वह पुरानी script gateway health को गलत report कर सकती है।

    जरूरत हो तो `channels login` से दोबारा link करें।

  </Accordion>

  <Accordion title="Proxy के पीछे QR login timeout हो जाता है">
    लक्षण: `openclaw channels login --channel whatsapp` usable QR code दिखाने से पहले `status=408 Request Time-out` या TLS socket disconnect के साथ विफल होता है।

    WhatsApp Web login gateway host के standard proxy environment (`HTTPS_PROXY`, `HTTP_PROXY`, lowercase variants, और `NO_PROXY`) का उपयोग करता है। सत्यापित करें कि gateway process proxy env inherit करता है और `NO_PROXY` `mmg.whatsapp.net` से match नहीं करता।

  </Accordion>

  <Accordion title="भेजते समय कोई active listener नहीं">
    जब target account के लिए कोई active gateway listener मौजूद नहीं होता, तो outbound sends जल्दी fail हो जाते हैं।

    सुनिश्चित करें कि gateway चल रहा है और account linked है।

  </Accordion>

  <Accordion title="Reply transcript में दिखता है लेकिन WhatsApp में नहीं">
    Transcript rows record करती हैं कि agent ने क्या generate किया। WhatsApp delivery अलग से checked होती है: OpenClaw auto-reply को sent तभी मानता है जब Baileys कम से कम एक visible text या media send के लिए outbound message id लौटाता है।

    Ack reactions स्वतंत्र pre-reply receipts हैं। सफल reaction यह साबित नहीं करती कि बाद वाला text या media reply WhatsApp ने स्वीकार कर लिया।

    `auto-reply delivery failed` या `auto-reply was not accepted by WhatsApp provider` के लिए gateway logs जांचें।

  </Accordion>

  <Accordion title="Group messages अप्रत्याशित रूप से ignored हैं">
    इस क्रम में जांचें:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist entries
    - mention gating (`requireMention` + mention patterns)
    - `openclaw.json` (JSON5) में duplicate keys: बाद की entries पहले वाली को override करती हैं, इसलिए प्रति scope एक ही `groupPolicy` रखें

    अगर `channels.whatsapp.groups` मौजूद है, तो WhatsApp अब भी अन्य groups से messages observe कर सकता है, लेकिन OpenClaw उन्हें session routing से पहले drop कर देता है। group JID को `channels.whatsapp.groups` में जोड़ें या सभी groups को admit करने के लिए `groups["*"]` जोड़ें, जबकि sender authorization को `groupPolicy` और `groupAllowFrom` के तहत रखें।

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp gateway runtime को Node इस्तेमाल करना चाहिए। stable WhatsApp/Telegram gateway operation के लिए Bun को incompatible के रूप में flagged किया गया है।
  </Accordion>
</AccordionGroup>

## System prompts

WhatsApp `groups` और `direct` maps के माध्यम से groups और direct chats के लिए Telegram-style system prompts support करता है।

Group messages के लिए resolution hierarchy:

प्रभावी `groups` map पहले निर्धारित होता है: अगर account अपना `groups` define करता है, तो वह root `groups` map को पूरी तरह replace करता है (कोई deep merge नहीं)। Prompt lookup फिर resulting single map पर चलता है:

1. **Group-specific system prompt** (`groups["<groupId>"].systemPrompt`): तब इस्तेमाल होता है जब specific group entry map में मौजूद हो **और** उसकी `systemPrompt` key defined हो। अगर `systemPrompt` empty string (`""`) है, तो wildcard suppress हो जाता है और कोई system prompt लागू नहीं होता।
2. **Group wildcard system prompt** (`groups["*"].systemPrompt`): तब इस्तेमाल होता है जब specific group entry map से पूरी तरह absent हो, या जब वह मौजूद हो लेकिन कोई `systemPrompt` key define न करे।

Direct messages के लिए resolution hierarchy:

प्रभावी `direct` map पहले निर्धारित होता है: अगर account अपना `direct` define करता है, तो वह root `direct` map को पूरी तरह replace करता है (कोई deep merge नहीं)। Prompt lookup फिर resulting single map पर चलता है:

1. **Direct-specific system prompt** (`direct["<peerId>"].systemPrompt`): तब इस्तेमाल होता है जब specific peer entry map में मौजूद हो **और** उसकी `systemPrompt` key defined हो। अगर `systemPrompt` empty string (`""`) है, तो wildcard suppress हो जाता है और कोई system prompt लागू नहीं होता।
2. **Direct wildcard system prompt** (`direct["*"].systemPrompt`): तब इस्तेमाल होता है जब specific peer entry map से पूरी तरह absent हो, या जब वह मौजूद हो लेकिन कोई `systemPrompt` key define न करे।

<Note>
`dms` lightweight per-DM history override bucket (`dms.<id>.historyLimit`) बना रहता है। Prompt overrides `direct` के तहत रहते हैं।
</Note>

**Telegram multi-account behavior से अंतर:** Telegram में, multi-account setup में सभी accounts के लिए root `groups` को जानबूझकर suppress किया जाता है — यहां तक कि उन accounts के लिए भी जो अपना `groups` define नहीं करते — ताकि bot उन groups के group messages प्राप्त न करे जिनका वह सदस्य नहीं है। WhatsApp यह guard लागू नहीं करता: root `groups` और root `direct` हमेशा उन accounts द्वारा inherited होते हैं जो account-level override define नहीं करते, चाहे कितने भी accounts configured हों। Multi-account WhatsApp setup में, अगर आप per-account group या direct prompts चाहते हैं, तो root-level defaults पर निर्भर रहने के बजाय हर account के तहत full map explicitly define करें।

महत्वपूर्ण व्यवहार:

- `channels.whatsapp.groups` per-group config map और chat-level group allowlist, दोनों है। root या account scope में, `groups["*"]` का मतलब उस scope के लिए "all groups are admitted" है।
- Wildcard group `systemPrompt` केवल तब जोड़ें जब आप पहले से चाहते हों कि वह scope सभी groups को admit करे। अगर आप अभी भी चाहते हैं कि केवल group IDs का fixed set eligible हो, तो prompt default के लिए `groups["*"]` का उपयोग न करें। इसके बजाय, हर explicitly allowlisted group entry पर prompt दोहराएं।
- Group admission और sender authorization अलग checks हैं। `groups["*"]` उन groups के set को बढ़ाता है जो group handling तक पहुंच सकते हैं, लेकिन यह अपने आप उन groups में हर sender को authorize नहीं करता। Sender access अब भी `channels.whatsapp.groupPolicy` और `channels.whatsapp.groupAllowFrom` द्वारा अलग से controlled है।
- `channels.whatsapp.direct` का DMs के लिए वही side effect नहीं है। `direct["*"]` केवल तब default direct-chat config प्रदान करता है जब DM पहले ही `dmPolicy` plus `allowFrom` या pairing-store rules द्वारा admitted हो चुका हो।

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

## कॉन्फ़िगरेशन संदर्भ संकेतक

प्राथमिक संदर्भ:

- [कॉन्फ़िगरेशन संदर्भ - WhatsApp](/hi/gateway/config-channels#whatsapp)

उच्च-संकेत WhatsApp फ़ील्ड:

- पहुंच: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- डिलीवरी: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- बहु-खाता: `accounts.<id>.enabled`, `accounts.<id>.authDir`, खाता-स्तरीय ओवरराइड
- संचालन: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- सत्र व्यवहार: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- प्रॉम्प्ट: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## संबंधित

- [पेयरिंग](/hi/channels/pairing)
- [समूह](/hi/channels/groups)
- [सुरक्षा](/hi/gateway/security)
- [चैनल रूटिंग](/hi/channels/channel-routing)
- [मल्टी-एजेंट रूटिंग](/hi/concepts/multi-agent)
- [समस्या निवारण](/hi/channels/troubleshooting)
