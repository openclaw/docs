---
read_when:
    - iMessage समर्थन सेट अप करना
    - iMessage भेजने/प्राप्त करने की डिबगिंग
summary: stdio पर JSON-RPC के जरिए imsg द्वारा नेटिव iMessage समर्थन, जिसमें replies, tapbacks, effects, polls, attachments, और group management के लिए निजी API actions शामिल हैं। जब host आवश्यकताएं अनुकूल हों, तो नए OpenClaw iMessage सेटअप के लिए पसंदीदा।
title: iMessage
x-i18n:
    generated_at: "2026-07-01T12:58:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage परिनियोजनों के लिए, साइन-इन किए हुए macOS Messages होस्ट पर `imsg` का उपयोग करें। यदि आपका Gateway Linux या Windows पर चलता है, तो `channels.imessage.cliPath` को ऐसे SSH wrapper पर इंगित करें जो Mac पर `imsg` चलाता हो।

**इनबाउंड पुनर्प्राप्ति स्वचालित है।** bridge या gateway रीस्टार्ट के बाद, iMessage बंद रहने के दौरान छूटे संदेशों को दोबारा चलाता है और Push पुनर्प्राप्ति के बाद Apple द्वारा फ्लश किए जा सकने वाले पुराने "बैकलॉग बम" को दबा देता है, dedupe करते हुए ताकि कुछ भी दो बार dispatch न हो। इसे सक्षम करने के लिए कोई config नहीं है — देखें [bridge या gateway रीस्टार्ट के बाद इनबाउंड पुनर्प्राप्ति](#inbound-recovery-after-a-bridge-or-gateway-restart)।
</Note>

<Warning>
BlueBubbles समर्थन हटा दिया गया है। `channels.bluebubbles` configs को `channels.imessage` पर migrate करें; OpenClaw iMessage को केवल `imsg` के माध्यम से support करता है। संक्षिप्त घोषणा के लिए [BlueBubbles हटाना और imsg iMessage पथ](/hi/announcements/bluebubbles-imessage) से शुरू करें, या पूरी migration तालिका के लिए [BlueBubbles से आ रहे हैं](/hi/channels/imessage-from-bluebubbles) देखें।
</Warning>

स्थिति: native external CLI integration। Gateway `imsg rpc` spawn करता है और stdio पर JSON-RPC से संवाद करता है (अलग daemon/port नहीं)। उन्नत क्रियाओं के लिए `imsg launch` और सफल private API probe आवश्यक है।

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    उत्तर, tapbacks, effects, polls, attachments, और group management।
  </Card>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    iMessage DMs default रूप से pairing mode में होते हैं।
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    जब Gateway Messages Mac पर नहीं चल रहा हो, तो SSH wrapper का उपयोग करें।
  </Card>
  <Card title="Configuration reference" icon="settings" href="/hi/gateway/config-channels#imessage">
    पूरा iMessage field reference।
  </Card>
</CardGroup>

## त्वरित setup

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Pairing requests 1 घंटे बाद expire हो जाते हैं।
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw को केवल stdio-compatible `cliPath` चाहिए, इसलिए आप `cliPath` को ऐसे wrapper script पर इंगित कर सकते हैं जो remote Mac पर SSH करके `imsg` चलाता है।

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    attachments सक्षम होने पर अनुशंसित config:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    यदि `remoteHost` सेट नहीं है, तो OpenClaw SSH wrapper script को parse करके उसे auto-detect करने का प्रयास करता है।
    `remoteHost` `host` या `user@host` होना चाहिए (कोई spaces या SSH options नहीं)।
    OpenClaw SCP के लिए strict host-key checking का उपयोग करता है, इसलिए relay host key पहले से `~/.ssh/known_hosts` में मौजूद होनी चाहिए।
    Attachment paths को allowed roots (`attachmentRoots` / `remoteAttachmentRoots`) के विरुद्ध validate किया जाता है।

<Warning>
`imsg` के सामने रखा गया कोई भी `cliPath` wrapper या SSH proxy लंबे समय तक चलने वाले JSON-RPC के लिए transparent stdio pipe की तरह व्यवहार करना ही चाहिए। OpenClaw channel के जीवनकाल तक wrapper के stdin/stdout पर छोटे newline-framed JSON-RPC messages का आदान-प्रदान करता है:

- प्रत्येक stdin chunk/line को **bytes उपलब्ध होते ही** forward करें — EOF की प्रतीक्षा न करें।
- प्रत्येक stdout chunk/line को उल्टी दिशा में तुरंत forward करें।
- newlines सुरक्षित रखें।
- fixed-size blocking reads (`read(4096)`, `cat | buffer`, default shell `read`) से बचें, जो छोटे frames को starve कर सकते हैं।
- stderr को JSON-RPC stdout stream से अलग रखें।

ऐसा wrapper जो stdin को बड़े block के भरने तक buffer करता है, iMessage outage जैसे दिखने वाले लक्षण पैदा करेगा — `imsg rpc timeout (chats.list)` या बार-बार channel restarts — भले ही `imsg rpc` स्वयं स्वस्थ हो। `ssh -T host imsg "$@"` (ऊपर) सुरक्षित है क्योंकि यह OpenClaw के `cliPath` arguments जैसे `rpc` और `--db` को forward करता है। `ssh host imsg | grep -v '^DEBUG'` जैसी pipelines सुरक्षित नहीं हैं — line-buffered tools फिर भी frames रोक सकते हैं; यदि आपको filter करना ही हो, तो हर stage पर `stdbuf -oL -eL` का उपयोग करें।
</Warning>

  </Tab>
</Tabs>

## आवश्यकताएं और permissions (macOS)

- Messages को उस Mac पर signed in होना चाहिए जो `imsg` चला रहा है।
- OpenClaw/`imsg` चलाने वाले process context के लिए Full Disk Access आवश्यक है (Messages DB access)।
- Messages.app के माध्यम से messages भेजने के लिए Automation permission आवश्यक है।
- उन्नत क्रियाओं (react / edit / unsend / threaded reply / effects / polls / group ops) के लिए, System Integrity Protection disabled होना चाहिए — नीचे [imsg private API सक्षम करना](#enabling-the-imsg-private-api) देखें। Basic text और media send/receive इसके बिना काम करते हैं।

<Tip>
Permissions प्रति process context दी जाती हैं। यदि gateway headless (LaunchAgent/SSH) चलता है, तो prompts trigger करने के लिए उसी context में एक बार interactive command चलाएं:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  remote-SSH setup chats पढ़ सकता है, `channels status --probe` pass कर सकता है, और inbound messages process कर सकता है, जबकि outbound sends फिर भी AppleEvents authorization error के साथ fail हो सकते हैं:

```text
Not authorized to send Apple events to Messages. (-1743)
```

signed-in Mac user का TCC database या System Settings > Privacy & Security > Automation जांचें। यदि Automation entry `imsg` या local shell process के बजाय `/usr/libexec/sshd-keygen-wrapper` के लिए दर्ज है, तो macOS उस SSH server-side client के लिए usable Messages toggle expose नहीं कर सकता:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

उस स्थिति में, `tccutil reset AppleEvents` दोहराना या उसी SSH wrapper के माध्यम से `imsg send` फिर से चलाना fail होता रह सकता है क्योंकि जिस process context को Messages Automation चाहिए वह SSH wrapper है, कोई ऐसा app नहीं जिसे UI grant कर सके।

इसके बजाय supported `imsg` process contexts में से एक का उपयोग करें:

- Gateway, या कम से कम `imsg` bridge, logged-in Messages user के local session में चलाएं।
- उसी session से Full Disk Access और Automation grant करने के बाद उस user के लिए LaunchAgent के साथ Gateway शुरू करें।
- यदि आप two-user SSH topology रखते हैं, तो channel सक्षम करने से पहले verify करें कि exact wrapper के माध्यम से real outbound `imsg send` सफल होता है। यदि उसे Automation grant नहीं किया जा सकता, तो sends के लिए SSH wrapper पर निर्भर रहने के बजाय single-user `imsg` setup पर reconfigure करें।

</Accordion>

## imsg private API सक्षम करना

`imsg` दो operational modes में ship होता है:

- **Basic mode** (default, SIP changes की आवश्यकता नहीं): `send` के माध्यम से outbound text और media, inbound watch/history, chat list। fresh `brew install steipete/tap/imsg` और ऊपर दी गई standard macOS permissions से आपको यही out of the box मिलता है।
- **Private API mode**: `imsg` internal `IMCore` functions call करने के लिए `Messages.app` में helper dylib inject करता है। यही `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `poll` और `poll-vote` (native Messages polls), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, साथ ही typing indicators और read receipts unlock करता है।

इस channel page में documented advanced action surface तक पहुंचने के लिए, आपको Private API mode चाहिए। `imsg` README requirement के बारे में स्पष्ट है:

> `read`, `typing`, `launch`, bridge-backed rich send, message mutation, और chat management जैसी advanced features opt-in हैं। इनके लिए SIP disabled होना और `Messages.app` में helper dylib inject होना आवश्यक है। SIP enabled होने पर `imsg launch` inject करने से मना कर देता है।

helper-injection technique Messages private APIs तक पहुंचने के लिए `imsg` की अपनी dylib का उपयोग करती है। OpenClaw iMessage path में कोई third-party server या BlueBubbles runtime नहीं है।

<Warning>
**SIP disable करना वास्तविक security tradeoff है।** SIP modified system code चलाने के विरुद्ध macOS की core protections में से एक है; इसे system-wide बंद करने से additional attack surface और side effects खुल जाते हैं। खास तौर पर, **Apple Silicon Macs पर SIP disable करने से आपके Mac पर iOS apps install और run करने की ability भी disabled हो जाती है**।

इसे default नहीं, बल्कि deliberate operational choice मानें। यदि आपका threat model SIP off होना tolerate नहीं कर सकता, तो bundled iMessage basic mode तक सीमित है — केवल text और media send/receive, कोई reactions / edit / unsend / effects / group ops नहीं।
</Warning>

### Setup

1. Messages.app चलाने वाले Mac पर **`imsg` install (या upgrade) करें**:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` output `bridge_version`, `rpc_methods`, और प्रति-method `selectors` report करता है ताकि शुरू करने से पहले आप देख सकें कि current build क्या support करता है।

2. **System Integrity Protection, और (modern macOS पर) Library Validation disable करें।** Apple-signed `Messages.app` में non-Apple helper dylib inject करने के लिए SIP off **और** library validation relaxed होना चाहिए। Recovery-mode SIP step macOS-version-specific है:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Terminal के माध्यम से Library Validation disable करें, Recovery Mode में reboot करें, `csrutil disable` चलाएं, restart करें।
   - **macOS 11+ (Big Sur and later), Intel:** Recovery Mode (या Internet Recovery), `csrutil disable`, restart।
   - **macOS 11+, Apple Silicon:** Recovery में enter करने के लिए power-button startup sequence; recent macOS versions पर Continue click करते समय **Left Shift** key hold करें, फिर `csrutil disable`। Virtual-machine setups अलग flow follow करते हैं, इसलिए पहले VM snapshot लें।

   **macOS 11 और बाद में, केवल `csrutil disable` आम तौर पर पर्याप्त नहीं है।** Apple अभी भी `Messages.app` के विरुद्ध platform binary के रूप में library validation enforce करता है, इसलिए adhoc-signed helper reject हो जाता है (`Library Validation failed: ... platform binary, but mapped file is not`) भले ही SIP off हो। SIP disable करने के बाद, library validation भी disable करें और reboot करें:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), 26.5.1 पर verified:** SIP off **plus** ऊपर दिया गया `DisableLibraryValidation` command 26.0 से 26.5.x तक helper inject करने के लिए पर्याप्त है। **कोई boot-args आवश्यक नहीं हैं।** plist decisive factor है और Tahoe पर injection fail होने पर सबसे common missing step है:
   - **plist के साथ:** `imsg launch` inject करता है और `imsg status` `advanced_features: true` report करता है।
   - **plist के बिना (SIP off होने पर भी):** `imsg launch` `Failed to launch: Timeout waiting for Messages.app to initialize` के साथ fail होता है। AMFI adhoc helper को load पर reject करता है, इसलिए bridge कभी ready नहीं होता और launch timeout हो जाता है। Tahoe पर ज्यादातर लोगों को यही timeout symptom मिलता है, और fix ऊपर वाला plist है, उससे अधिक drastic कुछ नहीं।

   यह macOS 26.5.1 (Apple Silicon) पर controlled before/after के साथ confirm किया गया था: plist के साथ, dylib `Messages.app` में map होता है और bridge up हो जाता है; plist हटाकर reboot करें, और `imsg launch` ऊपर वाला timeout failure produce करता है, जिसमें dylib mapped नहीं होता।

   यदि macOS अपग्रेड के बाद `imsg launch` इंजेक्शन या विशिष्ट `selectors` false लौटाना शुरू कर दें, तो सामान्य कारण यही गेट होता है। यह मानने से पहले कि SIP चरण ही विफल हुआ, अपनी SIP और library-validation स्थिति जांचें। यदि वे सेटिंग सही हैं और bridge फिर भी inject नहीं कर पा रहा है, तो `imsg status --json` के साथ `imsg launch` आउटपुट इकट्ठा करें और अतिरिक्त सिस्टम-व्यापी सुरक्षा नियंत्रणों को कमजोर करने के बजाय इसे `imsg` प्रोजेक्ट को रिपोर्ट करें।

   `imsg launch` चलाने से पहले SIP अक्षम करने के लिए अपने Mac के लिए Apple का Recovery-mode फ्लो अपनाएं।

3. **helper inject करें।** SIP अक्षम होने और Messages.app में साइन इन होने पर:

   ```bash
   imsg launch
   ```

   SIP अभी भी सक्षम होने पर `imsg launch` inject करने से इनकार करता है, इसलिए यह इस बात की पुष्टि भी कर देता है कि चरण 2 लागू हुआ।

4. **OpenClaw से bridge सत्यापित करें:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage एंट्री को `works` रिपोर्ट करना चाहिए, और `imsg status --json | jq '{rpc_methods, selectors}'` को आपके macOS build द्वारा उजागर capabilities दिखानी चाहिए। Poll creation के लिए `selectors.pollPayloadMessage` आवश्यक है; voting के लिए `selectors.pollVoteMessage` और `poll.vote` RPC method दोनों आवश्यक हैं। OpenClaw plugin केवल cached probe द्वारा समर्थित actions को advertise करता है, जबकि खाली cache optimistic रहता है और first dispatch पर probe करता है।

यदि `openclaw channels status --probe` channel को `works` के रूप में रिपोर्ट करता है लेकिन विशिष्ट actions dispatch समय पर "iMessage `<action>` requires the imsg private API bridge" फेंकते हैं, तो `imsg launch` फिर से चलाएं — helper बाहर हो सकता है (Messages.app restart, OS update, आदि) और cached `available: true` status अगले probe refresh होने तक actions advertise करता रहेगा।

### जब आप SIP अक्षम नहीं कर सकते

यदि SIP-disabled आपके threat model के लिए स्वीकार्य नहीं है:

- `imsg` basic mode पर fallback करता है — केवल text + media + receive।
- OpenClaw plugin फिर भी text/media send और inbound monitoring advertise करता है; यह action surface से केवल `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, और group ops छिपाता है (per-method capability gate के अनुसार)।
- आप iMessage workload के लिए SIP off वाला अलग non-Apple-Silicon Mac (या dedicated bot Mac) चला सकते हैं, जबकि अपने primary devices पर SIP enabled रख सकते हैं। नीचे [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) देखें।

## Access control और routing

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` direct messages नियंत्रित करता है:

    - `pairing` (default)
    - `allowlist`
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    Allowlist field: `channels.imessage.allowFrom`.

    Allowlist entries को senders की पहचान करनी होगी: handles या static sender access groups (`accessGroup:<name>`)। `chat_id:*`, `chat_guid:*`, या `chat_identifier:*` जैसे chat targets के लिए `channels.imessage.groupAllowFrom` का उपयोग करें; numeric `chat_id` registry keys के लिए `channels.imessage.groups` का उपयोग करें।

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` group handling नियंत्रित करता है:

    - `allowlist` (configured होने पर default)
    - `open`
    - `disabled`

    Group sender allowlist: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` entries static sender access groups (`accessGroup:<name>`) को भी reference कर सकती हैं।

    Runtime fallback: यदि `groupAllowFrom` unset है, तो iMessage group sender checks `allowFrom` का उपयोग करते हैं; जब DM और group admission अलग होना चाहिए, तब `groupAllowFrom` set करें।
    Runtime note: यदि `channels.imessage` पूरी तरह missing है, तो runtime `groupPolicy="allowlist"` पर fallback करता है और warning log करता है (भले ही `channels.defaults.groupPolicy` set हो)।

    <Warning>
    Group routing में back-to-back चलने वाले **दो** allowlist gates हैं, और दोनों को pass करना आवश्यक है:

    1. **Sender / chat-target allowlist** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, या `chat_id`।
    2. **Group registry** (`channels.imessage.groups`) — `groupPolicy: "allowlist"` के साथ, इस gate को या तो `groups: { "*": { ... } }` wildcard entry (`allowAll = true` set करता है), या `groups` के अंतर्गत स्पष्ट per-`chat_id` entry चाहिए।

    यदि gate 2 में कुछ भी नहीं है, तो हर group message drop हो जाता है। Plugin default log level पर दो `warn`-level signals emit करता है:

    - startup पर प्रति account one-time: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - runtime पर प्रति `chat_id` one-time: `imessage: dropping group message from chat_id=<id> ...`

    DMs काम करते रहते हैं क्योंकि वे अलग code path लेते हैं।

    `groupPolicy: "allowlist"` के अंतर्गत groups flowing रखने के लिए minimum config:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    यदि वे `warn` lines gateway log में दिखें, तो gate 2 drop कर रहा है — `groups` block जोड़ें।
    </Warning>

    Groups के लिए mention gating:

    - iMessage में native mention metadata नहीं होता
    - mention detection regex patterns का उपयोग करता है (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - configured patterns न होने पर, mention gating लागू नहीं की जा सकती

    Authorized senders से control commands groups में mention gating bypass कर सकते हैं।

    Per-group `systemPrompt`:

    `channels.imessage.groups.*` के अंतर्गत प्रत्येक entry optional `systemPrompt` string स्वीकार करती है। Value उस group में message handle करने वाले हर turn पर agent के system prompt में inject की जाती है। Resolution `channels.whatsapp.groups` द्वारा उपयोग किए जाने वाले per-group prompt resolution को mirror करता है:

    1. **Group-specific system prompt** (`groups["<chat_id>"].systemPrompt`): जब specific group entry map में मौजूद हो **और** उसकी `systemPrompt` key defined हो, तब उपयोग किया जाता है। यदि `systemPrompt` empty string (`""`) है, तो wildcard suppress हो जाता है और उस group पर कोई system prompt लागू नहीं होता।
    2. **Group wildcard system prompt** (`groups["*"].systemPrompt`): जब specific group entry map से पूरी तरह absent हो, या जब वह मौजूद हो लेकिन कोई `systemPrompt` key define न करे, तब उपयोग किया जाता है।

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Per-group prompts केवल group messages पर लागू होते हैं — इस channel में direct messages अप्रभावित रहते हैं।

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMs direct routing का उपयोग करते हैं; groups group routing का उपयोग करते हैं।
    - Default `session.dmScope=main` के साथ, iMessage DMs agent main session में collapse हो जाते हैं।
    - Group sessions isolated होते हैं (`agent:<agentId>:imessage:group:<chat_id>`)।
    - Replies originating channel/target metadata का उपयोग करके वापस iMessage पर route होते हैं।

    Group-ish thread behavior:

    कुछ multi-participant iMessage threads `is_group=false` के साथ आ सकते हैं।
    यदि वह `chat_id` स्पष्ट रूप से `channels.imessage.groups` के अंतर्गत configured है, तो OpenClaw उसे group traffic मानता है (group gating + group session isolation)।

  </Tab>
</Tabs>

## ACP conversation bindings

Legacy iMessage chats को ACP sessions से भी bind किया जा सकता है।

Fast operator flow:

- DM या allowed group chat के अंदर `/acp spawn codex --bind here` चलाएं।
- उसी iMessage conversation में future messages spawned ACP session पर route होंगे।
- `/new` और `/reset` उसी bound ACP session को उसी जगह reset करते हैं।
- `/acp close` ACP session को close करता है और binding हटाता है।

Configured persistent bindings top-level `bindings[]` entries के माध्यम से supported हैं, जिनमें `type: "acp"` और `match.channel: "imessage"` होता है।

`match.peer.id` उपयोग कर सकता है:

- normalized DM handle जैसे `+15555550123` या `user@example.com`
- `chat_id:<id>` (stable group bindings के लिए recommended)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Example:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Shared ACP binding behavior के लिए [ACP Agents](/hi/tools/acp-agents) देखें।

## Deployment patterns

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Dedicated Apple ID और macOS user का उपयोग करें ताकि bot traffic आपके personal Messages profile से isolated रहे।

    Typical flow:

    1. Dedicated macOS user बनाएं/sign in करें।
    2. उस user में bot Apple ID के साथ Messages में sign in करें।
    3. उस user में `imsg` install करें।
    4. SSH wrapper बनाएं ताकि OpenClaw उस user context में `imsg` चला सके।
    5. `channels.imessage.accounts.<id>.cliPath` और `.dbPath` को उस user profile पर point करें।

    First run में उस bot user session में GUI approvals (Automation + Full Disk Access) की आवश्यकता हो सकती है।

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Common topology:

    - gateway Linux/VM पर चलता है
    - iMessage + `imsg` आपके tailnet में Mac पर चलता है
    - `cliPath` wrapper SSH का उपयोग करके `imsg` चलाता है
    - `remoteHost` SCP attachment fetches enabled करता है

    Example:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    SSH keys का उपयोग करें ताकि SSH और SCP दोनों non-interactive हों।
    सुनिश्चित करें कि host key पहले trusted है (उदाहरण के लिए `ssh bot@mac-mini.tailnet-1234.ts.net`) ताकि `known_hosts` populated हो।

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage `channels.imessage.accounts` के अंतर्गत per-account config support करता है।

    प्रत्येक account `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, history settings, और attachment root allowlists जैसे fields override कर सकता है।

  </Accordion>

  <Accordion title="Direct-message history">
    नई direct-message sessions को उस conversation के recent decoded `imsg` history से seed करने के लिए `channels.imessage.dmHistoryLimit` set करें। Per-sender overrides के लिए `channels.imessage.dms["<sender>"].historyLimit` का उपयोग करें, जिसमें किसी sender के लिए history disable करने हेतु `0` शामिल है।

    iMessage DM history `imsg` से on demand fetch की जाती है। `dmHistoryLimit` unset छोड़ने से global DM history seeding disabled हो जाती है, लेकिन positive per-sender `channels.imessage.dms["<sender>"].historyLimit` फिर भी उस sender के लिए seeding enabled करता है।

  </Accordion>
</AccordionGroup>

## Media, chunking, और delivery targets

<AccordionGroup>
  <Accordion title="अटैचमेंट और मीडिया">
    - इनबाउंड अटैचमेंट इनजेशन **डिफ़ॉल्ट रूप से बंद** है — फ़ोटो, वॉइस मेमो, वीडियो और अन्य अटैचमेंट एजेंट को फ़ॉरवर्ड करने के लिए `channels.imessage.includeAttachments: true` सेट करें। इसके बंद रहने पर, केवल-अटैचमेंट वाले iMessages एजेंट तक पहुँचने से पहले छोड़ दिए जाते हैं और हो सकता है कोई `Inbound message` लॉग लाइन बिल्कुल न बने।
    - `remoteHost` सेट होने पर रिमोट अटैचमेंट पाथ SCP के ज़रिए प्राप्त किए जा सकते हैं
    - अटैचमेंट पाथ अनुमत रूट्स से मेल खाने चाहिए:
      - `channels.imessage.attachmentRoots` (स्थानीय)
      - `channels.imessage.remoteAttachmentRoots` (रिमोट SCP मोड)
      - डिफ़ॉल्ट रूट पैटर्न: `/Users/*/Library/Messages/Attachments`
    - SCP सख्त होस्ट-की जाँच (`StrictHostKeyChecking=yes`) का उपयोग करता है
    - आउटबाउंड मीडिया आकार `channels.imessage.mediaMaxMb` (डिफ़ॉल्ट 16 MB) का उपयोग करता है

  </Accordion>

  <Accordion title="आउटबाउंड चंकिंग">
    - टेक्स्ट चंक सीमा: `channels.imessage.textChunkLimit` (डिफ़ॉल्ट 4000)
    - चंक मोड: `channels.imessage.chunkMode`
      - `length` (डिफ़ॉल्ट)
      - `newline` (पहले-पैराग्राफ विभाजन)

  </Accordion>

  <Accordion title="एड्रेसिंग फ़ॉर्मैट">
    पसंदीदा स्पष्ट लक्ष्य:

    - `chat_id:123` (स्थिर रूटिंग के लिए अनुशंसित)
    - `chat_guid:...`
    - `chat_identifier:...`

    हैंडल लक्ष्य भी समर्थित हैं:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## निजी API कार्रवाइयाँ

जब `imsg launch` चल रहा हो और `openclaw channels status --probe` `privateApi.available: true` रिपोर्ट करे, तो मैसेज टूल सामान्य टेक्स्ट भेजने के अलावा iMessage-नेटिव कार्रवाइयों का उपयोग कर सकता है।

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="उपलब्ध कार्रवाइयाँ">
    - **react**: iMessage tapbacks जोड़ें/हटाएँ (`messageId`, `emoji`, `remove`)। समर्थित tapbacks प्यार, पसंद, नापसंद, हँसी, ज़ोर देने और प्रश्न से मैप होते हैं।
    - **reply**: किसी मौजूदा संदेश पर थ्रेडेड जवाब भेजें (`messageId`, `text` या `message`, साथ में `chatGuid`, `chatId`, `chatIdentifier`, या `to`)।
    - **sendWithEffect**: iMessage प्रभाव के साथ टेक्स्ट भेजें (`text` या `message`, `effect` या `effectId`)।
    - **edit**: समर्थित macOS/निजी API संस्करणों पर भेजा गया संदेश संपादित करें (`messageId`, `text` या `newText`)।
    - **unsend**: समर्थित macOS/निजी API संस्करणों पर भेजा गया संदेश वापस लें (`messageId`)।
    - **upload-file**: मीडिया/फ़ाइलें भेजें (`buffer` base64 के रूप में या hydrated `media`/`path`/`filePath`, `filename`, वैकल्पिक `asVoice`)। लीगेसी alias: `sendAttachment`।
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: जब मौजूदा लक्ष्य कोई समूह बातचीत हो, तो समूह चैट प्रबंधित करें।
    - **poll**: नेटिव Apple Messages poll बनाएँ (`pollQuestion`, `pollOption` 2 से 12 बार दोहराया गया, साथ में `chatGuid`, `chatId`, `chatIdentifier`, या `to`)। iOS/iPadOS/macOS 26+ पर प्राप्तकर्ता इसे नेटिव रूप से देखते और वोट करते हैं; पुराने OS संस्करणों को `"Sent a poll"` टेक्स्ट fallback मिलता है। `selectors.pollPayloadMessage` आवश्यक है।
    - **poll-vote**: किसी मौजूदा poll पर वोट करें (`pollId` या `messageId`, साथ में `pollOptionIndex`, `pollOptionId`, या `pollOptionText` में से ठीक एक)। `selectors.pollVoteMessage` और `poll.vote` RPC मेथड आवश्यक है।

    स्वीकार किए गए इनबाउंड polls एजेंट के लिए प्रश्न, क्रमांकित विकल्प लेबल, वोट संख्या और `poll-vote` के लिए आवश्यक poll message ID के साथ रेंडर किए जाते हैं।

  </Accordion>

  <Accordion title="Message IDs">
    इनबाउंड iMessage संदर्भ में उपलब्ध होने पर छोटे `MessageSid` मान और पूर्ण message GUIDs, दोनों शामिल होते हैं। छोटे IDs हाल के SQLite-समर्थित reply cache के दायरे में होते हैं और उपयोग से पहले मौजूदा चैट के विरुद्ध जाँचे जाते हैं। यदि कोई छोटा ID समाप्त हो गया है या किसी दूसरी चैट से संबंधित है, तो पूर्ण `MessageSidFull` के साथ फिर कोशिश करें।

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw निजी API कार्रवाइयों को केवल तब छिपाता है जब cached probe status कहता है कि bridge अनुपलब्ध है। यदि स्थिति अज्ञात है, तो कार्रवाइयाँ दिखाई देती रहती हैं और dispatch probes lazy रूप से होते हैं ताकि पहली कार्रवाई `imsg launch` के बाद अलग manual status refresh के बिना सफल हो सके।

  </Accordion>

  <Accordion title="Read receipts और typing">
    जब निजी API bridge चालू हो, तो स्वीकार की गई इनबाउंड चैट read के रूप में चिह्नित की जाती हैं और direct chats में turn स्वीकार होते ही typing bubble दिखता है, जबकि एजेंट संदर्भ तैयार करता और जनरेट करता है। read-marking को इससे बंद करें:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    पुराने `imsg` builds, जो per-method capability list से पहले के हैं, typing/read को चुपचाप gate off कर देंगे; OpenClaw हर restart पर एक बार warning लॉग करता है ताकि missing receipt का कारण समझा जा सके।

  </Accordion>

  <Accordion title="इनबाउंड tapbacks">
    OpenClaw iMessage tapbacks को subscribe करता है और स्वीकार की गई प्रतिक्रियाओं को सामान्य message text के बजाय system events के रूप में route करता है, इसलिए किसी user tapback से सामान्य reply loop trigger नहीं होता।

    Notification mode `channels.imessage.reactionNotifications` से नियंत्रित होता है:

    - `"own"` (डिफ़ॉल्ट): केवल तब notify करें जब users bot-authored messages पर react करें।
    - `"all"`: authorized senders से सभी inbound tapbacks के लिए notify करें।
    - `"off"`: inbound tapbacks को ignore करें।

    Per-account overrides `channels.imessage.accounts.<id>.reactionNotifications` का उपयोग करते हैं।

  </Accordion>

  <Accordion title="Approval reactions (👍 / 👎)">
    जब `approvals.exec.enabled` या `approvals.plugin.enabled` true हो और request iMessage पर route हो, तो gateway approval prompt को natively deliver करता है और उसे resolve करने के लिए tapback स्वीकार करता है:

    - `👍` (Like tapback) → `allow-once`
    - `👎` (Dislike tapback) → `deny`
    - `allow-always` manual fallback बना रहता है: regular reply के रूप में `/approve <id> allow-always` भेजें।

    Reaction handling के लिए reacting user का handle एक explicit approver होना आवश्यक है। approver list `channels.imessage.allowFrom` (या `channels.imessage.accounts.<id>.allowFrom`) से पढ़ी जाती है; user का phone number E.164 रूप में या उनका Apple ID email जोड़ें। wildcard entry `"*"` का सम्मान किया जाता है, लेकिन यह किसी भी sender को approve करने देता है। reaction shortcut जानबूझकर `reactionNotifications`, `dmPolicy`, और `groupAllowFrom` को bypass करता है क्योंकि explicit-approver allowlist ही approval resolution के लिए मायने रखने वाला एकमात्र gate है।

    **इस release के साथ व्यवहार में बदलाव:** जब `channels.imessage.allowFrom` non-empty हो, तो `/approve <id> <decision>` text command अब उसी approver list के विरुद्ध authorize होती है (व्यापक DM allowlist के विरुद्ध नहीं)। DM allowlist पर permitted senders, जो `allowFrom` में नहीं हैं, उन्हें explicit denial मिलेगा। पिछले व्यवहार को बनाए रखने के लिए हर उस operator को `allowFrom` में जोड़ें जिसे `/approve` (और reactions) के ज़रिए approve करने में सक्षम होना चाहिए। जब `allowFrom` empty हो, तो legacy "same-chat fallback" प्रभाव में रहता है और `/approve` DM allowlist द्वारा permitted किसी भी व्यक्ति को authorize करना जारी रखता है।

    Operator notes:
    - reaction binding memory (approval expiry से matched TTL के साथ) और gateway के persistent keyed store, दोनों में stored होती है, इसलिए gateway restart के तुरंत बाद आने वाला tapback अभी भी approval resolve कर देता है।
    - Cross-device `is_from_me=true` tapbacks (paired Apple device पर operator की अपनी reaction) जानबूझकर ignore किए जाते हैं ताकि bot self-approve न कर सके।
    - Legacy text-style tapbacks (बहुत पुराने Apple clients से `Liked "…"` plain text) approvals resolve नहीं कर सकते क्योंकि उनमें message GUID नहीं होता; reaction resolution के लिए current macOS / iOS clients द्वारा emit किया गया structured tapback metadata आवश्यक है।

  </Accordion>
</AccordionGroup>

## Config writes

iMessage डिफ़ॉल्ट रूप से channel-initiated config writes की अनुमति देता है (`/config set|unset` के लिए जब `commands.config: true` हो)।

बंद करें:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Split-send DMs को coalesce करना (एक composition में command + URL)

जब कोई user एक command और URL साथ टाइप करता है — जैसे `Dump https://example.com/article` — Apple का Messages app send को **दो अलग-अलग `chat.db` rows** में split कर देता है:

1. एक text message (`"Dump"`)।
2. attachments के रूप में OG-preview images वाला URL-preview balloon (`"https://..."`)।

अधिकांश setups पर ये दो rows OpenClaw तक ~0.8-2.0 s के अंतर से पहुँचती हैं। Coalescing के बिना, agent को turn 1 पर केवल command मिलती है, वह reply करता है (अक्सर "मुझे URL भेजें"), और URL केवल turn 2 पर दिखता है — उस समय तक command context पहले ही खो चुका होता है। यह Apple की send pipeline है, OpenClaw या `imsg` द्वारा जोड़ी गई कोई चीज़ नहीं।

`channels.imessage.coalesceSameSenderDms` किसी DM को consecutive same-sender rows buffer करने के लिए opt करता है। जब `imsg` source rows में से किसी एक पर structural URL-preview marker `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` expose करता है, तो OpenClaw केवल उस वास्तविक split-send को merge करता है और किसी भी अन्य buffered rows को अलग turns के रूप में रखता है। पुराने `imsg` builds पर, जो कोई balloon metadata बिल्कुल emit नहीं करते, OpenClaw split-send और अलग-अलग sends में अंतर नहीं कर सकता, इसलिए वह bucket merge करने पर fallback करता है। यह `Dump <url>` split-sends को दो turns में regress करने के बजाय pre-metadata behavior को preserve करता है। Group chats per-message dispatch करती रहती हैं ताकि multi-user turn structure preserved रहे।

<Tabs>
  <Tab title="कब enable करें">
    तब enable करें जब:

    - आप ऐसी skills ship करते हैं जो एक message में `command + payload` की अपेक्षा करती हैं (dump, paste, save, queue, आदि)।
    - आपके users commands के साथ URLs paste करते हैं।
    - आप जोड़ी गई DM turn latency स्वीकार कर सकते हैं (नीचे देखें)।

    तब disabled छोड़ें जब:

    - आपको single-word DM triggers के लिए minimum command latency चाहिए।
    - आपके सभी flows payload follow-ups के बिना one-shot commands हैं।

  </Tab>
  <Tab title="Enable करना">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    flag on होने और कोई explicit `messages.inbound.byChannel.imessage` या global `messages.inbound.debounceMs` न होने पर, debounce window **7000 ms** तक चौड़ी हो जाती है (legacy default 0 ms है — कोई debouncing नहीं)। चौड़ी window आवश्यक है क्योंकि Apple की URL-preview split-send cadence कई seconds तक खिंच सकती है, जबकि Messages.app preview row emit करता है।

    window को स्वयं tune करने के लिए:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="ट्रेड-ऑफ़">
    - **सटीक मर्जिंग के लिए वर्तमान `imsg` पेलोड मेटाडेटा चाहिए।** जब URL पंक्ति में `balloon_bundle_id` शामिल होता है, तो केवल वही वास्तविक स्प्लिट-सेंड मर्ज होता है और अन्य बफ़र की गई पंक्तियाँ अलग रहती हैं। पुराने `imsg` बिल्ड पर, जो कोई बैलून मेटाडेटा उजागर नहीं करते, OpenClaw बफ़र बकेट को मर्ज करने पर वापस जाता है ताकि `Dump <url>` स्प्लिट-सेंड दो टर्न में वापस न चले जाएँ (अंतरिम बैक-कॉम्पैट, जब `imsg` अपस्ट्रीम में स्प्लिट-सेंड को कोएल्स कर देगा तब हटाया जाएगा)।
    - **DM संदेशों के लिए अतिरिक्त विलंब।** फ़्लैग चालू होने पर, हर DM (स्टैंडअलोन नियंत्रण कमांड और सिंगल-टेक्स्ट फ़ॉलो-अप सहित) डिस्पैच होने से पहले डीबाउंस विंडो तक प्रतीक्षा करता है, ताकि URL-प्रीव्यू पंक्ति आने की स्थिति संभाली जा सके। ग्रुप-चैट संदेश तुरंत डिस्पैच बने रहते हैं।
    - **मर्ज किया गया आउटपुट सीमित है।** मर्ज किया गया टेक्स्ट स्पष्ट `…[truncated]` मार्कर के साथ 4000 वर्णों तक सीमित है; अटैचमेंट 20 तक सीमित हैं; स्रोत एंट्री 10 तक सीमित हैं (उससे आगे पहला-प्लस-नवीनतम रखा जाता है)। डाउनस्ट्रीम टेलीमेट्री के लिए हर स्रोत GUID `coalescedMessageGuids` में ट्रैक किया जाता है।
    - **केवल DM।** ग्रुप चैट प्रति-संदेश डिस्पैच पर गिरते हैं ताकि कई लोगों के टाइप करते समय बॉट प्रतिक्रियाशील बना रहे।
    - **ऑप्ट-इन, प्रति-चैनल।** अन्य चैनल (Telegram, WhatsApp, Slack, …) प्रभावित नहीं होते। पुराने BlueBubbles कॉन्फ़िग, जो `channels.bluebubbles.coalesceSameSenderDms` सेट करते हैं, उन्हें वह मान `channels.imessage.coalesceSameSenderDms` पर माइग्रेट करना चाहिए।

  </Tab>
</Tabs>

### परिदृश्य और एजेंट क्या देखता है

"फ़्लैग चालू" कॉलम उस `imsg` बिल्ड पर व्यवहार दिखाता है जो `balloon_bundle_id` उत्सर्जित करता है। पुराने `imsg` बिल्ड पर, जो बिल्कुल भी बैलून मेटाडेटा उत्सर्जित नहीं करते, नीचे "दो टर्न" / "N टर्न" चिह्नित पंक्तियाँ इसके बजाय लीगेसी मर्ज (एक टर्न) पर वापस जाती हैं: OpenClaw संरचनात्मक रूप से स्प्लिट-सेंड को अलग-अलग सेंड से नहीं पहचान सकता, इसलिए यह प्री-मेटाडेटा मर्ज को बनाए रखता है। जैसे ही बिल्ड बैलून मेटाडेटा उत्सर्जित करता है, सटीक पृथक्करण सक्रिय हो जाता है।

| उपयोगकर्ता लिखता है                                               | `chat.db` उत्पन्न करता है          | फ़्लैग बंद (डिफ़ॉल्ट)                   | फ़्लैग चालू + विंडो (`imsg` बैलून मेटाडेटा उत्सर्जित करता है)                                     |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (एक सेंड)                               | 2 पंक्तियाँ ~1 सेकंड के अंतर पर    | दो एजेंट टर्न: केवल "Dump", फिर URL     | एक टर्न: मर्ज किया गया टेक्स्ट `Dump https://example.com`                                          |
| `Save this 📎image.jpg caption` (अटैचमेंट + टेक्स्ट)               | URL बैलून मेटाडेटा के बिना 2 पंक्तियाँ | दो टर्न                            | मेटाडेटा देखे जाने के बाद दो टर्न; पुराने/प्री-लैच मेटाडेटा-रहित सेशन पर एक मर्ज किया गया टर्न    |
| `/status` (स्टैंडअलोन कमांड)                                      | 1 पंक्ति                            | तुरंत डिस्पैच                           | **विंडो तक प्रतीक्षा, फिर डिस्पैच**                                                                 |
| केवल URL पेस्ट किया गया                                           | 1 पंक्ति                            | तुरंत डिस्पैच                           | विंडो तक प्रतीक्षा, फिर डिस्पैच                                                                     |
| टेक्स्ट + URL दो जानबूझकर अलग संदेशों के रूप में, मिनटों के अंतर पर भेजे गए | विंडो के बाहर 2 पंक्तियाँ | दो टर्न                               | दो टर्न (विंडो इनके बीच समाप्त हो जाती है)                                                         |
| तेज़ बाढ़ (विंडो के भीतर >10 छोटे DM)                              | URL बैलून मेटाडेटा के बिना N पंक्तियाँ | N टर्न                              | मेटाडेटा देखे जाने के बाद N टर्न; पुराने/प्री-लैच मेटाडेटा-रहित सेशन पर एक सीमित मर्ज किया गया टर्न |
| ग्रुप चैट में दो लोग टाइप कर रहे हैं                              | M सेंडर से N पंक्तियाँ              | M+ टर्न (प्रति सेंडर बकेट एक)           | M+ टर्न — ग्रुप चैट को कोएल्स नहीं किया जाता                                                       |

## ब्रिज या Gateway रीस्टार्ट के बाद इनबाउंड रिकवरी

iMessage उन संदेशों को रिकवर करता है जो Gateway डाउन रहने के दौरान छूट गए थे, और उसी समय उस पुराने "बैकलॉग बम" को दबाता है जिसे Apple Push रिकवरी के बाद फ़्लश कर सकता है। डिफ़ॉल्ट व्यवहार हमेशा चालू रहता है, और इनबाउंड डीड्यूप पर बना है।

- **रीप्ले डीड्यूप।** हर डिस्पैच किया गया इनबाउंड संदेश उसके Apple GUID द्वारा पर्सिस्टेंट Plugin स्टेट (`imessage.inbound-dedupe`) में रिकॉर्ड किया जाता है, इंजेशन पर क्लेम किया जाता है और हैंडलिंग के बाद कमिट किया जाता है (क्षणिक विफलता पर रिलीज़ किया जाता है ताकि यह दोबारा कोशिश कर सके)। जो भी पहले से हैंडल हो चुका है, उसे दोबारा डिस्पैच करने के बजाय ड्रॉप किया जाता है। यही रिकवरी को प्रति-संदेश बहीखाते के बिना आक्रामक रूप से रीप्ले करने देता है।
- **डाउनटाइम रिकवरी।** स्टार्टअप पर मॉनिटर अंतिम डिस्पैच किए गए `chat.db` rowid (एक पर्सिस्ट किया गया प्रति-अकाउंट कर्सर) को याद रखता है और उसे `since_rowid` के रूप में `imsg watch.subscribe` को पास करता है, ताकि imsg Gateway डाउन रहने के दौरान आई पंक्तियों को रीप्ले करे, फिर लाइव टेल करे। रीप्ले सबसे हाल की पंक्तियों और ~2 घंटे तक पुराने संदेशों तक सीमित होता है, और डीड्यूप पहले से हैंडल की गई किसी भी चीज़ को ड्रॉप कर देता है।
- **पुराने-बैकलॉग की उम्र-सीमा।** स्टार्टअप सीमा से ऊपर की पंक्तियाँ सचमुच लाइव होती हैं; जिसकी भेजने की तारीख उसके आगमन से ~15 मिनट से अधिक पुरानी है, वह Push-फ़्लश बैकलॉग है और दबा दी जाती है। रीप्ले की गई पंक्तियाँ (सीमा पर या उससे नीचे) इसके बजाय व्यापक रिकवरी विंडो का उपयोग करती हैं, ताकि हाल में छूटा संदेश डिलीवर हो जबकि बहुत पुराना इतिहास न हो।

रिकवरी स्थानीय और रिमोट दोनों `cliPath` सेटअप पर काम करती है, क्योंकि `since_rowid` रीप्ले उसी `imsg` RPC कनेक्शन पर चलता है। अंतर विंडो का है: जब Gateway `chat.db` पढ़ सकता है (स्थानीय), तो यह स्टार्टअप rowid सीमा को एंकर करता है, रीप्ले स्पैन को सीमित करता है, और कुछ घंटों तक पुराने छूटे संदेश डिलीवर करता है। रिमोट SSH `cliPath` पर यह डेटाबेस नहीं पढ़ सकता, इसलिए रीप्ले अनकैप्ड होता है और हर पंक्ति लाइव उम्र-सीमा का उपयोग करती है — यह फिर भी हाल में छूटे संदेश रिकवर करता है और पुराने बैकलॉग को दबाता है, बस संकरे लाइव विंडो के साथ। व्यापक रिकवरी विंडो के लिए Gateway को Messages Mac पर चलाएँ।

### ऑपरेटर-दृश्यमान संकेत

दबाया गया बैकलॉग डिफ़ॉल्ट स्तर पर लॉग किया जाता है, कभी चुपचाप ड्रॉप नहीं किया जाता (`recovery` फ़्लैग दिखाता है कि कौन-सी विंडो लागू हुई):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### माइग्रेशन

`channels.imessage.catchup.*` डिप्रिकेटेड है — डाउनटाइम रिकवरी अब स्वचालित है और नए सेटअप के लिए किसी कॉन्फ़िग की आवश्यकता नहीं है। `catchup.enabled: true` वाले मौजूदा कॉन्फ़िग रिकवरी रीप्ले विंडो के लिए कॉम्पैटिबिलिटी प्रोफ़ाइल के रूप में अब भी सम्मानित रहते हैं। अक्षम catchup ब्लॉक (`enabled: false` या कोई `enabled: true` नहीं) रिटायर किए गए हैं; `openclaw doctor --fix` इन्हें हटाता है।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="imsg नहीं मिला या RPC असमर्थित है">
    बाइनरी और RPC सपोर्ट सत्यापित करें:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    यदि प्रोब RPC असमर्थित रिपोर्ट करता है, तो `imsg` अपडेट करें। यदि निजी API कार्रवाइयाँ उपलब्ध नहीं हैं, तो लॉग-इन macOS उपयोगकर्ता सेशन में `imsg launch` चलाएँ और फिर से प्रोब करें। यदि Gateway macOS पर नहीं चल रहा है, तो डिफ़ॉल्ट स्थानीय `imsg` पथ के बजाय ऊपर दिया गया Remote Mac over SSH सेटअप उपयोग करें।

  </Accordion>

  <Accordion title="संदेश भेजे जाते हैं लेकिन इनबाउंड iMessages नहीं आते">
    पहले सिद्ध करें कि संदेश स्थानीय Mac तक पहुँचा या नहीं। यदि `chat.db` नहीं बदलता, तो `imsg status --json` के स्वस्थ ब्रिज रिपोर्ट करने पर भी OpenClaw संदेश प्राप्त नहीं कर सकता।

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    यदि फ़ोन से भेजे गए संदेश नई पंक्तियाँ नहीं बनाते, तो OpenClaw कॉन्फ़िग बदलने से पहले macOS Messages और Apple Push लेयर को ठीक करें। एक-बार सेवा रिफ़्रेश अक्सर पर्याप्त होता है:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    फ़ोन से नया iMessage भेजें और OpenClaw सेशन डीबग करने से पहले नई `chat.db` पंक्ति या `imsg watch` इवेंट की पुष्टि करें। इसे आवधिक ब्रिज-रीलॉन्च लूप के रूप में न चलाएँ; सक्रिय काम के दौरान बार-बार `imsg launch` और Gateway रीस्टार्ट डिलीवरी बाधित कर सकते हैं और इन-फ़्लाइट चैनल रन फँसा सकते हैं।

  </Accordion>

  <Accordion title="Gateway macOS पर नहीं चल रहा है">
    डिफ़ॉल्ट `cliPath: "imsg"` उस Mac पर चलना चाहिए जो Messages में साइन इन है। Linux या Windows पर, `channels.imessage.cliPath` को ऐसे रैपर स्क्रिप्ट पर सेट करें जो उस Mac पर SSH करे और `imsg "$@"` चलाए।

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    फिर चलाएँ:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM अनदेखे किए जाते हैं">
    जाँचें:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - पेयरिंग स्वीकृतियाँ (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ग्रुप संदेश अनदेखे किए जाते हैं">
    जाँचें:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` अलाउलिस्ट व्यवहार
    - मेंशन पैटर्न कॉन्फ़िगरेशन (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="रिमोट अटैचमेंट विफल होते हैं">
    जाँचें:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway होस्ट से SSH/SCP कुंजी ऑथ
    - Gateway होस्ट पर `~/.ssh/known_hosts` में होस्ट कुंजी मौजूद है
    - Messages चला रहे Mac पर रिमोट पथ पढ़ने योग्य है

  </Accordion>

  <Accordion title="macOS अनुमति प्रॉम्प्ट छूट गए">
    उसी उपयोगकर्ता/सेशन संदर्भ में इंटरैक्टिव GUI टर्मिनल में फिर से चलाएँ और प्रॉम्प्ट स्वीकार करें:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    पुष्टि करें कि OpenClaw/`imsg` चलाने वाले प्रोसेस संदर्भ को Full Disk Access + Automation प्रदान किए गए हैं।

  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन संदर्भ पॉइंटर

- [कॉन्फ़िगरेशन संदर्भ - iMessage](/hi/gateway/config-channels#imessage)
- [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [पेयरिंग](/hi/channels/pairing)

## संबंधित

- [चैनल अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [BlueBubbles हटाना और imsg iMessage पथ](/hi/announcements/bluebubbles-imessage) — घोषणा और माइग्रेशन सारांश
- [BlueBubbles से आ रहे हैं](/hi/channels/imessage-from-bluebubbles) — कॉन्फ़िग अनुवाद तालिका और चरण-दर-चरण कटओवर
- [पेयरिंग](/hi/channels/pairing) — DM प्रमाणीकरण और पेयरिंग फ़्लो
- [ग्रुप](/hi/channels/groups) — ग्रुप चैट व्यवहार और मेंशन गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सेशन रूटिंग
- [सुरक्षा](/hi/gateway/security) — एक्सेस मॉडल और हार्डनिंग
