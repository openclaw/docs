---
read_when:
    - iMessage समर्थन सेट अप करना
    - iMessage भेजने/प्राप्त करने की डिबगिंग
summary: imsg (`stdio` पर JSON-RPC) के माध्यम से मूल iMessage समर्थन, जिसमें जवाबों, टैपबैक, इफ़ेक्ट्स, अटैचमेंट्स, और समूह प्रबंधन के लिए निजी API क्रियाएँ शामिल हैं। जब होस्ट आवश्यकताएँ उपयुक्त हों, तो नए OpenClaw iMessage सेटअप के लिए पसंदीदा।
title: iMessage
x-i18n:
    generated_at: "2026-06-28T22:35:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage डिप्लॉयमेंट के लिए, साइन-इन किए हुए macOS Messages होस्ट पर `imsg` का उपयोग करें। यदि आपका Gateway Linux या Windows पर चलता है, तो `channels.imessage.cliPath` को ऐसे SSH wrapper पर सेट करें जो Mac पर `imsg` चलाता हो।

**इनबाउंड रिकवरी स्वचालित है।** bridge या gateway पुनरारंभ के बाद, iMessage बंद रहने के दौरान छूटे हुए संदेशों को फिर से चलाता है और Push रिकवरी के बाद Apple द्वारा फ्लश किए जा सकने वाले पुराने "backlog bomb" को दबा देता है, dedupe करके सुनिश्चित करता है कि कोई भी चीज दो बार dispatch न हो। इसे सक्षम करने के लिए कोई config नहीं है — देखें [bridge या gateway पुनरारंभ के बाद इनबाउंड रिकवरी](#inbound-recovery-after-a-bridge-or-gateway-restart)।
</Note>

<Warning>
BlueBubbles समर्थन हटा दिया गया था। `channels.bluebubbles` configs को `channels.imessage` में migrate करें; OpenClaw iMessage को केवल `imsg` के माध्यम से समर्थन देता है। संक्षिप्त घोषणा के लिए [BlueBubbles हटाना और imsg iMessage पथ](/hi/announcements/bluebubbles-imessage) से शुरू करें, या पूर्ण migration तालिका के लिए [BlueBubbles से आ रहे हैं](/hi/channels/imessage-from-bluebubbles) देखें।
</Warning>

स्थिति: native external CLI integration। Gateway `imsg rpc` spawn करता है और stdio पर JSON-RPC के माध्यम से communicate करता है (अलग daemon/port नहीं)। उन्नत actions के लिए `imsg launch` और सफल private API probe आवश्यक है।

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Replies, tapbacks, effects, attachments, और group management।
  </Card>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    iMessage DMs default रूप से pairing mode में होते हैं।
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    जब Gateway Messages Mac पर नहीं चल रहा हो, तो SSH wrapper का उपयोग करें।
  </Card>
  <Card title="Configuration reference" icon="settings" href="/hi/gateway/config-channels#imessage">
    पूर्ण iMessage field reference।
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
    OpenClaw को केवल stdio-compatible `cliPath` चाहिए, इसलिए आप `cliPath` को ऐसे wrapper script पर point कर सकते हैं जो remote Mac पर SSH करके `imsg` चलाता है।

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    attachments enabled होने पर अनुशंसित config:

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

    यदि `remoteHost` set नहीं है, तो OpenClaw SSH wrapper script को parse करके इसे auto-detect करने का प्रयास करता है।
    `remoteHost` `host` या `user@host` होना चाहिए (spaces या SSH options नहीं)।
    OpenClaw SCP के लिए strict host-key checking का उपयोग करता है, इसलिए relay host key पहले से `~/.ssh/known_hosts` में मौजूद होनी चाहिए।
    Attachment paths को allowed roots (`attachmentRoots` / `remoteAttachmentRoots`) के against validate किया जाता है।

<Warning>
`imsg` के सामने रखा गया कोई भी `cliPath` wrapper या SSH proxy long-lived JSON-RPC के लिए transparent stdio pipe की तरह व्यवहार करना ही चाहिए। OpenClaw channel के पूरे lifetime तक wrapper के stdin/stdout पर छोटे newline-framed JSON-RPC messages exchange करता है:

- प्रत्येक stdin chunk/line को **bytes उपलब्ध होते ही** forward करें — EOF की प्रतीक्षा न करें।
- प्रत्येक stdout chunk/line को उल्टी दिशा में तुरंत forward करें।
- newlines सुरक्षित रखें।
- fixed-size blocking reads (`read(4096)`, `cat | buffer`, default shell `read`) से बचें, जो छोटे frames को starve कर सकते हैं।
- stderr को JSON-RPC stdout stream से अलग रखें।

ऐसा wrapper जो stdin को तब तक buffer करता है जब तक कोई बड़ा block भर न जाए, ऐसे symptoms पैदा करेगा जो iMessage outage जैसे दिखते हैं — `imsg rpc timeout (chats.list)` या बार-बार channel restarts — भले ही `imsg rpc` स्वयं स्वस्थ हो। `ssh -T host imsg "$@"` (ऊपर) सुरक्षित है क्योंकि यह OpenClaw के `cliPath` arguments जैसे `rpc` और `--db` forward करता है। `ssh host imsg | grep -v '^DEBUG'` जैसी pipelines सुरक्षित नहीं हैं — line-buffered tools फिर भी frames रोक सकते हैं; यदि आपको filter करना ही हो तो हर stage पर `stdbuf -oL -eL` का उपयोग करें।
</Warning>

  </Tab>
</Tabs>

## आवश्यकताएँ और permissions (macOS)

- `imsg` चलाने वाले Mac पर Messages signed in होना चाहिए।
- OpenClaw/`imsg` चलाने वाले process context के लिए Full Disk Access आवश्यक है (Messages DB access)।
- Messages.app के माध्यम से messages भेजने के लिए Automation permission आवश्यक है।
- उन्नत actions (react / edit / unsend / threaded reply / effects / group ops) के लिए, System Integrity Protection disabled होना चाहिए — नीचे [imsg private API सक्षम करना](#enabling-the-imsg-private-api) देखें। Basic text और media send/receive इसके बिना काम करते हैं।

<Tip>
Permissions per process context grant की जाती हैं। यदि gateway headless (LaunchAgent/SSH) चलता है, तो prompts trigger करने के लिए उसी context में one-time interactive command चलाएँ:

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

signed-in Mac user's TCC database या System Settings > Privacy & Security > Automation देखें। यदि Automation entry `imsg` या local shell process के बजाय `/usr/libexec/sshd-keygen-wrapper` के लिए record है, तो macOS उस SSH server-side client के लिए usable Messages toggle expose नहीं कर सकता:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

उस स्थिति में, `tccutil reset AppleEvents` दोहराना या उसी SSH wrapper के माध्यम से `imsg send` फिर से चलाना fail होता रह सकता है क्योंकि जिस process context को Messages Automation चाहिए वह SSH wrapper है, कोई ऐसा app नहीं जिसे UI grant कर सके।

इसके बजाय समर्थित `imsg` process contexts में से किसी एक का उपयोग करें:

- Gateway, या कम से कम `imsg` bridge, logged-in Messages user's local session में चलाएँ।
- उसी session से Full Disk Access और Automation grant करने के बाद उस user के लिए LaunchAgent के साथ Gateway शुरू करें।
- यदि आप two-user SSH topology रखते हैं, तो channel enable करने से पहले verify करें कि exact wrapper के माध्यम से real outbound `imsg send` सफल होता है। यदि इसे Automation grant नहीं किया जा सकता, तो sends के लिए SSH wrapper पर निर्भर रहने के बजाय single-user `imsg` setup में reconfigure करें।

</Accordion>

## imsg private API सक्षम करना

`imsg` दो operational modes में ship होता है:

- **Basic mode** (default, SIP changes की आवश्यकता नहीं): `send` के माध्यम से outbound text और media, inbound watch/history, chat list। fresh `brew install steipete/tap/imsg` और ऊपर दी गई standard macOS permissions से out of the box यही मिलता है।
- **Private API mode**: `imsg`, internal `IMCore` functions call करने के लिए `Messages.app` में helper dylib inject करता है। यही `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, साथ ही typing indicators और read receipts unlock करता है।

इस channel page में documented advanced action surface तक पहुँचने के लिए आपको Private API mode चाहिए। `imsg` README requirement के बारे में स्पष्ट है:

> `read`, `typing`, `launch`, bridge-backed rich send, message mutation, और chat management जैसी advanced features opt-in हैं। उन्हें SIP disabled होना और `Messages.app` में helper dylib inject होना आवश्यक है। SIP enabled होने पर `imsg launch` inject करने से मना करता है।

helper-injection technique Messages private APIs तक पहुँचने के लिए `imsg` की अपनी dylib का उपयोग करती है। OpenClaw iMessage path में कोई third-party server या BlueBubbles runtime नहीं है।

<Warning>
**SIP disable करना वास्तविक security tradeoff है।** SIP, modified system code चलाने के विरुद्ध macOS की core protections में से एक है; इसे system-wide बंद करने से अतिरिक्त attack surface और side effects खुलते हैं। खास तौर पर, **Apple Silicon Macs पर SIP disable करने से आपके Mac पर iOS apps install और run करने की क्षमता भी disable हो जाती है**।

इसे deliberate operational choice मानें, default नहीं। यदि आपका threat model SIP off होना tolerate नहीं कर सकता, तो bundled iMessage basic mode तक सीमित है — केवल text और media send/receive, reactions / edit / unsend / effects / group ops नहीं।
</Warning>

### Setup

1. Messages.app चलाने वाले Mac पर **`imsg` install (या upgrade) करें**:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` output `bridge_version`, `rpc_methods`, और per-method `selectors` report करता है ताकि start करने से पहले आप देख सकें कि current build क्या support करता है।

2. **System Integrity Protection, और (modern macOS पर) Library Validation disable करें।** Apple-signed `Messages.app` में non-Apple helper dylib inject करने के लिए SIP off **और** library validation relaxed होना चाहिए। Recovery-mode SIP step macOS-version-specific है:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Terminal के माध्यम से Library Validation disable करें, Recovery Mode में reboot करें, `csrutil disable` चलाएँ, restart करें।
   - **macOS 11+ (Big Sur और बाद के), Intel:** Recovery Mode (या Internet Recovery), `csrutil disable`, restart।
   - **macOS 11+, Apple Silicon:** Recovery में enter करने के लिए power-button startup sequence; recent macOS versions पर Continue click करते समय **Left Shift** key दबाए रखें, फिर `csrutil disable`। Virtual-machine setups अलग flow follow करते हैं, इसलिए पहले VM snapshot लें।

   **macOS 11 और बाद में, केवल `csrutil disable` आमतौर पर पर्याप्त नहीं होता।** Apple अभी भी `Messages.app` के against library validation enforce करता है क्योंकि वह platform binary है, इसलिए adhoc-signed helper reject हो जाता है (`Library Validation failed: ... platform binary, but mapped file is not`) भले ही SIP off हो। SIP disable करने के बाद, library validation भी disable करें और reboot करें:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), 26.5.1 पर verified:** SIP off **plus** ऊपर दिया गया `DisableLibraryValidation` command 26.0 से 26.5.x तक helper inject करने के लिए पर्याप्त है। **कोई boot-args required नहीं हैं।** plist निर्णायक factor है और Tahoe पर injection fail होने पर सबसे common missing step है:
   - **plist के साथ:** `imsg launch` inject करता है और `imsg status` `advanced_features: true` report करता है।
   - **plist के बिना (SIP off होने पर भी):** `imsg launch` `Failed to launch: Timeout waiting for Messages.app to initialize` के साथ fail होता है। AMFI adhoc helper को load पर reject करता है, इसलिए bridge कभी ready नहीं होता और launch timeout हो जाता है। वह timeout वह symptom है जिससे Tahoe पर अधिकांश लोग टकराते हैं, और fix ऊपर वाला plist है, कुछ अधिक drastic नहीं।

   macOS 26.5.1 (Apple Silicon) पर controlled before/after के साथ इसकी पुष्टि की गई: plist के साथ, dylib `Messages.app` में map हो जाती है और bridge up हो जाता है; plist remove करके reboot करें, और `imsg launch` ऊपर वाला timeout failure produce करता है, dylib mapped नहीं होती।

   यदि macOS अपग्रेड के बाद `imsg launch` इंजेक्शन या विशिष्ट `selectors` false लौटाने लगें, तो आमतौर पर यही गेट कारण होता है। यह मानने से पहले कि SIP चरण ही विफल हुआ, अपनी SIP और library-validation स्थिति जांचें। यदि ये सेटिंग सही हैं और bridge फिर भी inject नहीं कर पा रहा है, तो `imsg status --json` के साथ `imsg launch` आउटपुट इकट्ठा करें और अतिरिक्त सिस्टम-व्यापी सुरक्षा नियंत्रणों को कमजोर करने के बजाय इसे `imsg` प्रोजेक्ट को रिपोर्ट करें।

   `imsg launch` चलाने से पहले SIP अक्षम करने के लिए अपने Mac के लिए Apple के Recovery-mode flow का पालन करें।

3. **helper inject करें।** SIP अक्षम होने और Messages.app में sign in होने पर:

   ```bash
   imsg launch
   ```

   SIP अभी भी सक्षम होने पर `imsg launch` inject करने से इनकार करता है, इसलिए यह इस बात की पुष्टि भी करता है कि चरण 2 लागू हो गया।

4. **OpenClaw से bridge सत्यापित करें:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage entry को `works` रिपोर्ट करना चाहिए, और `imsg status --json | jq '.selectors'` में `retractMessagePart: true` के साथ वे edit / typing / read selectors दिखने चाहिए जिन्हें आपका macOS build expose करता है। `actions.ts` में OpenClaw Plugin की per-method gating केवल उन्हीं actions को advertise करती है जिनका underlying selector `true` है, इसलिए agent की tool list में दिखने वाला action surface वही दर्शाता है जो bridge वास्तव में इस host पर कर सकता है।

यदि `openclaw channels status --probe` channel को `works` रिपोर्ट करता है लेकिन विशिष्ट actions dispatch time पर "iMessage `<action>` requires the imsg private API bridge" throw करते हैं, तो `imsg launch` फिर चलाएं — helper बाहर हो सकता है (Messages.app restart, OS update, आदि) और cached `available: true` status अगली probe refresh होने तक actions को advertise करता रहेगा।

### जब आप SIP अक्षम नहीं कर सकते

यदि SIP-disabled आपके threat model के लिए स्वीकार्य नहीं है:

- `imsg` basic mode पर fallback करता है — केवल text + media + receive।
- OpenClaw Plugin अभी भी text/media send और inbound monitoring advertise करता है; यह बस action surface से `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, और group ops छिपा देता है (per-method capability gate के अनुसार)।
- आप iMessage workload के लिए SIP off वाला एक अलग non-Apple-Silicon Mac (या dedicated bot Mac) चला सकते हैं, जबकि अपने primary devices पर SIP enabled रख सकते हैं। नीचे [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) देखें।

## Access control और routing

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` direct messages नियंत्रित करता है:

    - `pairing` (default)
    - `allowlist`
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक)
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

    Runtime fallback: यदि `groupAllowFrom` unset है, तो iMessage group sender checks `allowFrom` का उपयोग करते हैं; जब DM और group admission अलग होने चाहिए, तो `groupAllowFrom` set करें।
    Runtime note: यदि `channels.imessage` पूरी तरह missing है, तो runtime `groupPolicy="allowlist"` पर fallback करता है और warning log करता है (भले ही `channels.defaults.groupPolicy` set हो)।

    <Warning>
    Group routing में **दो** allowlist gates लगातार चलते हैं, और दोनों का pass होना आवश्यक है:

    1. **Sender / chat-target allowlist** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, या `chat_id`।
    2. **Group registry** (`channels.imessage.groups`) — `groupPolicy: "allowlist"` के साथ, इस gate को या तो `groups: { "*": { ... } }` wildcard entry चाहिए (`allowAll = true` set करता है), या `groups` के अंतर्गत explicit per-`chat_id` entry।

    यदि gate 2 में कुछ भी नहीं है, तो हर group message drop हो जाता है। Plugin default log level पर दो `warn`-level signals emit करता है:

    - startup पर प्रति account one-time: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - runtime पर प्रति `chat_id` one-time: `imessage: dropping group message from chat_id=<id> ...`

    DMs काम करना जारी रखते हैं क्योंकि वे अलग code path लेते हैं।

    `groupPolicy: "allowlist"` के अंतर्गत groups को चलते रखने के लिए minimum config:

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

    यदि वे `warn` lines gateway log में दिखाई दें, तो gate 2 drop कर रहा है — `groups` block जोड़ें।
    </Warning>

    Groups के लिए mention gating:

    - iMessage में native mention metadata नहीं है
    - mention detection regex patterns (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`) का उपयोग करता है
    - configured patterns न होने पर, mention gating enforce नहीं की जा सकती

    Authorized senders से control commands groups में mention gating bypass कर सकते हैं।

    Per-group `systemPrompt`:

    `channels.imessage.groups.*` के अंतर्गत प्रत्येक entry optional `systemPrompt` string स्वीकार करती है। यह value उस group में message handle करने वाले हर turn पर agent के system prompt में inject की जाती है। Resolution `channels.whatsapp.groups` द्वारा उपयोग किए जाने वाले per-group prompt resolution को mirror करता है:

    1. **Group-specific system prompt** (`groups["<chat_id>"].systemPrompt`): तब उपयोग होता है जब specific group entry map में मौजूद हो **और** उसकी `systemPrompt` key defined हो। यदि `systemPrompt` empty string (`""`) है, तो wildcard suppress हो जाता है और उस group पर कोई system prompt apply नहीं होता।
    2. **Group wildcard system prompt** (`groups["*"].systemPrompt`): तब उपयोग होता है जब specific group entry map से पूरी तरह absent हो, या वह मौजूद हो लेकिन कोई `systemPrompt` key define न करती हो।

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

    Per-group prompts केवल group messages पर apply होते हैं — इस channel में direct messages अप्रभावित रहते हैं।

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMs direct routing का उपयोग करते हैं; groups group routing का उपयोग करते हैं।
    - default `session.dmScope=main` के साथ, iMessage DMs agent main session में collapse हो जाते हैं।
    - Group sessions isolated होते हैं (`agent:<agentId>:imessage:group:<chat_id>`)।
    - Replies originating channel/target metadata का उपयोग करके iMessage पर वापस route होते हैं।

    Group-जैसा thread behavior:

    कुछ multi-participant iMessage threads `is_group=false` के साथ आ सकते हैं।
    यदि वह `chat_id` explicitly `channels.imessage.groups` के अंतर्गत configured है, तो OpenClaw उसे group traffic मानता है (group gating + group session isolation)।

  </Tab>
</Tabs>

## ACP conversation bindings

Legacy iMessage chats को ACP sessions से भी bind किया जा सकता है।

Fast operator flow:

- DM या allowed group chat के अंदर `/acp spawn codex --bind here` चलाएं।
- उसी iMessage conversation में future messages spawned ACP session तक route होंगे।
- `/new` और `/reset` उसी bound ACP session को उसी जगह reset करते हैं।
- `/acp close` ACP session बंद करता है और binding हटाता है।

Configured persistent bindings top-level `bindings[]` entries के माध्यम से supported हैं, जिनमें `type: "acp"` और `match.channel: "imessage"` होता है।

`match.peer.id` इसका उपयोग कर सकता है:

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
    Dedicated Apple ID और macOS user का उपयोग करें ताकि bot traffic आपकी personal Messages profile से isolated रहे।

    Typical flow:

    1. Dedicated macOS user बनाएं/sign in करें।
    2. उस user में bot Apple ID के साथ Messages में sign in करें।
    3. उस user में `imsg` install करें।
    4. SSH wrapper बनाएं ताकि OpenClaw उस user context में `imsg` चला सके।
    5. `channels.imessage.accounts.<id>.cliPath` और `.dbPath` को उस user profile की ओर point करें।

    First run में उस bot user session में GUI approvals (Automation + Full Disk Access) की आवश्यकता हो सकती है।

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Common topology:

    - gateway Linux/VM पर चलता है
    - iMessage + `imsg` आपकी tailnet में Mac पर चलता है
    - `cliPath` wrapper SSH का उपयोग करके `imsg` चलाता है
    - `remoteHost` SCP attachment fetches enable करता है

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
    `channels.imessage.dmHistoryLimit` set करें ताकि नई direct-message sessions को उस conversation की हाल की decoded `imsg` history से seed किया जा सके। Per-sender overrides के लिए `channels.imessage.dms["<sender>"].historyLimit` का उपयोग करें, जिसमें किसी sender के लिए history disable करने हेतु `0` भी शामिल है।

    iMessage DM history मांग पर `imsg` से fetch की जाती है। `dmHistoryLimit` unset छोड़ने से global DM history seeding disable हो जाती है, लेकिन positive per-sender `channels.imessage.dms["<sender>"].historyLimit` फिर भी उस sender के लिए seeding enable करता है।

  </Accordion>
</AccordionGroup>

## Media, chunking, और delivery targets

<AccordionGroup>
  <Accordion title="अटैचमेंट और मीडिया">
    - इनबाउंड अटैचमेंट इनजेशन **डिफ़ॉल्ट रूप से बंद** है — फ़ोटो, वॉइस मेमो, वीडियो और अन्य अटैचमेंट एजेंट को भेजने के लिए `channels.imessage.includeAttachments: true` सेट करें। इसके बंद रहने पर, केवल-अटैचमेंट वाले iMessages एजेंट तक पहुँचने से पहले हटा दिए जाते हैं और हो सकता है कि कोई `Inbound message` लॉग लाइन बिल्कुल न बने।
    - `remoteHost` सेट होने पर रिमोट अटैचमेंट पाथ SCP के ज़रिए फ़ेच किए जा सकते हैं
    - अटैचमेंट पाथ अनुमत रूट से मेल खाने चाहिए:
      - `channels.imessage.attachmentRoots` (लोकल)
      - `channels.imessage.remoteAttachmentRoots` (रिमोट SCP मोड)
      - डिफ़ॉल्ट रूट पैटर्न: `/Users/*/Library/Messages/Attachments`
    - SCP सख्त होस्ट-की जाँच (`StrictHostKeyChecking=yes`) का उपयोग करता है
    - आउटबाउंड मीडिया आकार `channels.imessage.mediaMaxMb` का उपयोग करता है (डिफ़ॉल्ट 16 MB)

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

जब `imsg launch` चल रहा हो और `openclaw channels status --probe` `privateApi.available: true` रिपोर्ट करे, तो संदेश टूल सामान्य टेक्स्ट भेजने के अलावा iMessage-नेटिव कार्रवाइयों का उपयोग कर सकता है।

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="उपलब्ध कार्रवाइयाँ">
    - **react**: iMessage टैपबैक जोड़ें/हटाएँ (`messageId`, `emoji`, `remove`)। समर्थित टैपबैक love, like, dislike, laugh, emphasize और question से मैप होते हैं।
    - **reply**: किसी मौजूदा संदेश पर थ्रेडेड जवाब भेजें (`messageId`, `text` या `message`, साथ में `chatGuid`, `chatId`, `chatIdentifier`, या `to`)।
    - **sendWithEffect**: iMessage इफ़ेक्ट के साथ टेक्स्ट भेजें (`text` या `message`, `effect` या `effectId`)।
    - **edit**: समर्थित macOS/निजी API संस्करणों पर भेजा गया संदेश संपादित करें (`messageId`, `text` या `newText`)।
    - **unsend**: समर्थित macOS/निजी API संस्करणों पर भेजा गया संदेश वापस लें (`messageId`)।
    - **upload-file**: मीडिया/फ़ाइलें भेजें (`buffer` base64 के रूप में या hydrated `media`/`path`/`filePath`, `filename`, वैकल्पिक `asVoice`)। लेगेसी alias: `sendAttachment`।
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: जब मौजूदा लक्ष्य कोई समूह बातचीत हो, तब समूह चैट प्रबंधित करें।

  </Accordion>

  <Accordion title="संदेश ID">
    इनबाउंड iMessage संदर्भ उपलब्ध होने पर छोटे `MessageSid` मान और पूर्ण संदेश GUID, दोनों शामिल करता है। छोटे ID हाल की SQLite-समर्थित reply cache तक सीमित होते हैं और उपयोग से पहले मौजूदा चैट के विरुद्ध जाँचे जाते हैं। यदि कोई छोटा ID समाप्त हो गया है या किसी दूसरी चैट से संबंधित है, तो पूर्ण `MessageSidFull` के साथ फिर प्रयास करें।

  </Accordion>

  <Accordion title="क्षमता पहचान">
    OpenClaw निजी API कार्रवाइयाँ केवल तब छिपाता है जब cached probe status कहता है कि bridge उपलब्ध नहीं है। यदि status अज्ञात है, तो कार्रवाइयाँ दिखाई देती रहती हैं और dispatch lazily probe करता है, ताकि पहली कार्रवाई `imsg launch` के बाद अलग manual status refresh के बिना सफल हो सके।

  </Accordion>

  <Accordion title="Read receipts और typing">
    जब private API bridge चालू हो, तो स्वीकृत इनबाउंड चैट read के रूप में mark की जाती हैं और direct chats में turn स्वीकार होते ही typing bubble दिखता है, जबकि एजेंट context तैयार करता और generate करता है। read-marking बंद करने के लिए:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    पुराने `imsg` builds जो per-method capability list से पहले के हैं, typing/read को चुपचाप gate off कर देंगे; OpenClaw हर restart पर एक बार warning log करता है ताकि missing receipt का कारण पहचाना जा सके।

  </Accordion>

  <Accordion title="इनबाउंड टैपबैक">
    OpenClaw iMessage टैपबैक subscribe करता है और स्वीकृत reactions को सामान्य message text के बजाय system events के रूप में route करता है, इसलिए user tapback सामान्य reply loop trigger नहीं करता।

    Notification mode `channels.imessage.reactionNotifications` से नियंत्रित होता है:

    - `"own"` (डिफ़ॉल्ट): केवल तब notify करें जब user bot-authored messages पर react करें।
    - `"all"`: authorized senders से सभी inbound tapbacks के लिए notify करें।
    - `"off"`: inbound tapbacks अनदेखा करें।

    Per-account overrides `channels.imessage.accounts.<id>.reactionNotifications` का उपयोग करते हैं।

  </Accordion>

  <Accordion title="Approval reactions (👍 / 👎)">
    जब `approvals.exec.enabled` या `approvals.plugin.enabled` true हो और request iMessage तक route हो, तो gateway native approval prompt deliver करता है और उसे resolve करने के लिए tapback स्वीकार करता है:

    - `👍` (Like tapback) → `allow-once`
    - `👎` (Dislike tapback) → `deny`
    - `allow-always` manual fallback बना रहता है: regular reply के रूप में `/approve <id> allow-always` भेजें।

    Reaction handling के लिए reacting user का handle explicit approver होना आवश्यक है। approver list `channels.imessage.allowFrom` (या `channels.imessage.accounts.<id>.allowFrom`) से पढ़ी जाती है; user का phone number E.164 form में या उनका Apple ID email जोड़ें। wildcard entry `"*"` मान्य है, लेकिन किसी भी sender को approve करने की अनुमति देती है। reaction shortcut जानबूझकर `reactionNotifications`, `dmPolicy` और `groupAllowFrom` को bypass करता है क्योंकि explicit-approver allowlist ही approval resolution के लिए मायने रखने वाला एकमात्र gate है।

    **इस रिलीज़ में व्यवहार परिवर्तन:** जब `channels.imessage.allowFrom` खाली नहीं है, तो `/approve <id> <decision>` text command अब उसी approver list के विरुद्ध authorize होती है (विस्तृत DM allowlist के विरुद्ध नहीं)। DM allowlist पर permitted लेकिन `allowFrom` में नहीं मौजूद senders को स्पष्ट denial मिलेगा। पिछले behavior को बनाए रखने के लिए हर उस operator को `allowFrom` में जोड़ें जिसे `/approve` के ज़रिए (और reactions के ज़रिए) approve करने में सक्षम होना चाहिए। जब `allowFrom` खाली है, legacy "same-chat fallback" प्रभाव में रहता है और `/approve` उस किसी भी व्यक्ति को authorize करना जारी रखता है जिसे DM allowlist permit करती है।

    Operator notes:
    - reaction binding memory में (approval expiry से matched TTL के साथ) और gateway के persistent keyed store में, दोनों जगह store होती है, इसलिए gateway restart के थोड़ी देर बाद आने वाला tapback भी approval resolve कर देता है।
    - Cross-device `is_from_me=true` tapbacks (paired Apple device पर operator की अपनी reaction) जानबूझकर ignore किए जाते हैं ताकि bot self-approve न कर सके।
    - Legacy text-style tapbacks (`Liked "…"` बहुत पुराने Apple clients से plain text) approvals resolve नहीं कर सकते क्योंकि वे message GUID नहीं रखते; reaction resolution के लिए structured tapback metadata आवश्यक है जिसे current macOS / iOS clients emit करते हैं।

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

जब user एक command और URL साथ में type करता है — जैसे `Dump https://example.com/article` — Apple का Messages app send को **दो अलग-अलग `chat.db` rows** में split करता है:

1. एक text message (`"Dump"`)।
2. OG-preview images को attachments के रूप में रखने वाला URL-preview balloon (`"https://..."`)।

ज़्यादातर setups पर ये दो rows OpenClaw तक ~0.8-2.0 s के अंतर से पहुँचती हैं। Coalescing के बिना, agent को turn 1 पर केवल command मिलती है, वह reply करता है (अक्सर "मुझे URL भेजें"), और URL केवल turn 2 पर दिखता है — तब तक command context पहले ही खो चुका होता है। यह Apple की send pipeline है, OpenClaw या `imsg` द्वारा जोड़ी गई कोई चीज़ नहीं।

`channels.imessage.coalesceSameSenderDms` किसी DM को consecutive same-sender rows buffer करने में opt करता है। जब `imsg` source rows में से किसी एक पर structural URL-preview marker `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` expose करता है, तो OpenClaw केवल उस वास्तविक split-send को merge करता है और अन्य buffered rows को separate turns के रूप में रखता है। पुराने `imsg` builds पर, जो कोई balloon metadata emit नहीं करते, OpenClaw split-send और separate sends में अंतर नहीं बता सकता, इसलिए वह bucket merge करने पर fallback करता है। इससे `Dump <url>` split-sends को दो turns में regress करने के बजाय pre-metadata behavior सुरक्षित रहता है। Group chats per-message dispatch करना जारी रखते हैं ताकि multi-user turn structure सुरक्षित रहे।

<Tabs>
  <Tab title="कब सक्षम करें">
    सक्षम करें जब:

    - आप ऐसे skills ship करते हैं जो एक message में `command + payload` की अपेक्षा रखते हैं (dump, paste, save, queue, आदि)।
    - आपके users commands के साथ URLs paste करते हैं।
    - आप जोड़ी गई DM turn latency स्वीकार कर सकते हैं (नीचे देखें)।

    बंद रहने दें जब:

    - आपको single-word DM triggers के लिए minimum command latency चाहिए।
    - आपके सभी flows payload follow-ups के बिना one-shot commands हैं।

  </Tab>
  <Tab title="सक्षम करना">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Flag on होने और कोई explicit `messages.inbound.byChannel.imessage` या global `messages.inbound.debounceMs` न होने पर, debounce window **7000 ms** तक widen हो जाती है (legacy default 0 ms है — कोई debouncing नहीं)। Wider window आवश्यक है क्योंकि Apple की URL-preview split-send cadence कई seconds तक stretch हो सकती है, जब Messages.app preview row emit करता है।

    Window खुद tune करने के लिए:

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
  <Tab title="Trade-offs">
    - **सटीक merging के लिए current `imsg` payload metadata चाहिए।** जब URL row में `balloon_bundle_id` शामिल हो, तो केवल वही वास्तविक split-send merge होता है और अन्य buffered rows separate रहते हैं। पुराने `imsg` builds पर, जो कोई balloon metadata expose नहीं करते, OpenClaw buffered bucket merge करने पर fallback करता है ताकि `Dump <url>` split-sends दो turns में regress न हों (interim back-compat, जब `imsg` upstream split-sends coalesce करेगा तब हटाया जाएगा)।
    - **DM messages के लिए जोड़ी गई latency।** Flag on होने पर, हर DM (standalone control commands और single-text follow-ups सहित) dispatch होने से पहले debounce window तक wait करता है, इस संभावना में कि URL-preview row आने वाली है। Group-chat messages instant dispatch रखते हैं।
    - **Merged output bounded है।** Merged text explicit `…[truncated]` marker के साथ 4000 chars पर cap होता है; attachments 20 पर cap होते हैं; source entries 10 पर cap होती हैं (उससे आगे first-plus-latest retained)। हर source GUID downstream telemetry के लिए `coalescedMessageGuids` में track होता है।
    - **केवल DM।** Group chats per-message dispatch पर fall through करते हैं ताकि कई लोग typing कर रहे हों तब bot responsive रहे।
    - **Opt-in, per-channel।** अन्य channels (Telegram, WhatsApp, Slack, …) अप्रभावित हैं। Legacy BlueBubbles configs जो `channels.bluebubbles.coalesceSameSenderDms` set करते हैं, उन्हें वह value `channels.imessage.coalesceSameSenderDms` में migrate करनी चाहिए।

  </Tab>
</Tabs>

### Scenarios और agent क्या देखता है

"फ़्लैग चालू" स्तंभ उस `imsg` बिल्ड पर व्यवहार दिखाता है जो `balloon_bundle_id` उत्सर्जित करता है। पुराने `imsg` बिल्ड पर, जो कोई balloon मेटाडेटा बिल्कुल उत्सर्जित नहीं करते, नीचे "दो टर्न" / "N टर्न" चिह्नित पंक्तियां इसके बजाय legacy merge (एक टर्न) पर लौटती हैं: OpenClaw split-send को अलग-अलग sends से संरचनात्मक रूप से अलग नहीं बता सकता, इसलिए यह pre-metadata merge को सुरक्षित रखता है। बिल्ड के balloon मेटाडेटा उत्सर्जित करने के बाद सटीक अलगाव सक्रिय होता है।

| उपयोगकर्ता लिखता है                                                | `chat.db` उत्पन्न करता है           | फ़्लैग बंद (डिफ़ॉल्ट)                   | फ़्लैग चालू + विंडो (`imsg` balloon मेटाडेटा उत्सर्जित करता है)                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (एक send)                               | 2 पंक्तियां ~1 सेकंड के अंतर पर     | दो agent टर्न: केवल "Dump", फिर URL     | एक टर्न: मर्ज किया गया टेक्स्ट `Dump https://example.com`                                           |
| `Save this 📎image.jpg caption` (अटैचमेंट + टेक्स्ट)               | URL balloon मेटाडेटा के बिना 2 पंक्तियां | दो टर्न                            | मेटाडेटा देखे जाने के बाद दो टर्न; पुराने/pre-latch मेटाडेटा-रहित सेशन पर एक मर्ज किया गया टर्न     |
| `/status` (स्वतंत्र command)                                       | 1 पंक्ति                            | तुरंत dispatch                         | **विंडो तक प्रतीक्षा करें, फिर dispatch करें**                                                       |
| URL अकेले पेस्ट किया गया                                           | 1 पंक्ति                            | तुरंत dispatch                         | विंडो तक प्रतीक्षा करें, फिर dispatch करें                                                          |
| टेक्स्ट + URL जानबूझकर दो अलग संदेशों के रूप में, मिनटों के अंतर पर भेजे गए | विंडो के बाहर 2 पंक्तियां       | दो टर्न                               | दो टर्न (उनके बीच विंडो समाप्त हो जाती है)                                                          |
| तेज़ flood (विंडो के भीतर >10 छोटे DMs)                            | URL balloon मेटाडेटा के बिना N पंक्तियां | N टर्न                            | मेटाडेटा देखे जाने के बाद N टर्न; पुराने/pre-latch मेटाडेटा-रहित सेशन पर एक bounded मर्ज किया गया टर्न |
| समूह चैट में दो लोग टाइप कर रहे हैं                                | M senders से N पंक्तियां            | M+ टर्न (हर sender bucket के लिए एक)   | M+ टर्न — समूह चैट coalesce नहीं की जातीं                                                           |

## bridge या gateway restart के बाद inbound recovery

iMessage उन संदेशों को recover करता है जो Gateway बंद होने के दौरान छूट गए थे, और साथ ही उस पुराने "backlog bomb" को दबाता है जिसे Apple Push recovery के बाद flush कर सकता है। डिफ़ॉल्ट व्यवहार हमेशा चालू रहता है, और inbound dedupe पर बना है।

- **Replay dedupe।** हर dispatched inbound message को persistent Plugin state (`imessage.inbound-dedupe`) में उसके Apple GUID द्वारा रिकॉर्ड किया जाता है, ingestion पर claim किया जाता है और handling के बाद commit किया जाता है (transient failure पर release किया जाता है ताकि retry हो सके)। जो भी पहले ही handle हो चुका है उसे दोबारा dispatch करने के बजाय drop कर दिया जाता है। इसी से recovery per-message bookkeeping के बिना आक्रामक replay कर पाती है।
- **Downtime recovery।** startup पर monitor अंतिम dispatched `chat.db` rowid (एक persisted per-account cursor) याद रखता है और उसे `imsg watch.subscribe` को `since_rowid` के रूप में पास करता है, ताकि Gateway बंद रहने के दौरान आई rows को imsg replay करे, फिर live tail करे। Replay सबसे हालिया rows और ~2 घंटे तक पुराने संदेशों तक bounded है, और dedupe पहले से handle हो चुकी किसी भी चीज़ को drop कर देता है।
- **Stale-backlog age fence।** startup boundary से ऊपर की rows वास्तव में live होती हैं; जिसकी send date उसके arrival से ~15 मिनट से अधिक पुरानी हो, वह Push-flush backlog है और suppressed होती है। Replayed rows (boundary पर या उससे नीचे) इसके बजाय wider recovery window का उपयोग करती हैं, ताकि हाल ही में छूटा message deliver हो जबकि बहुत पुराना इतिहास न हो।

Recovery local और remote दोनों `cliPath` setups पर काम करती है, क्योंकि `since_rowid` replay उसी `imsg` RPC connection पर चलता है। अंतर window का है: जब Gateway `chat.db` पढ़ सकता है (local), तो यह startup rowid boundary anchor करता है, replay span cap करता है, और कुछ घंटे तक पुराने छूटे messages deliver करता है। remote SSH `cliPath` पर यह database नहीं पढ़ सकता, इसलिए replay uncapped होता है और हर row live age fence का उपयोग करती है — यह फिर भी हाल ही में छूटे messages recover करता है और पुराना backlog suppress करता है, बस संकरी live window के साथ। wider recovery window के लिए Gateway को Messages Mac पर चलाएं।

### Operator-visible signal

Suppressed backlog को default level पर log किया जाता है, कभी silently drop नहीं किया जाता (`recovery` flag दिखाता है कि कौन सी window लागू हुई):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migration

`channels.imessage.catchup.*` deprecated है — downtime recovery अब automatic है और नए setups के लिए किसी config की जरूरत नहीं है। `catchup.enabled: true` वाले मौजूदा configs recovery replay window के लिए compatibility profile के रूप में honored रहते हैं। Disabled catchup blocks (`enabled: false` या कोई `enabled: true` नहीं) retired हैं; `openclaw doctor --fix` उन्हें हटाता है।

## Troubleshooting

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    binary और RPC support validate करें:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    अगर probe RPC unsupported report करता है, तो `imsg` update करें। अगर private API actions उपलब्ध नहीं हैं, तो logged-in macOS user session में `imsg launch` चलाएं और फिर से probe करें। अगर Gateway macOS पर नहीं चल रहा है, तो default local `imsg` path के बजाय ऊपर दिया गया Remote Mac over SSH setup उपयोग करें।

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    पहले साबित करें कि message local Mac तक पहुंचा या नहीं। अगर `chat.db` नहीं बदलता, तो OpenClaw message receive नहीं कर सकता, भले ही `imsg status --json` healthy bridge report करे।

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    अगर phone-sent messages कोई नई rows नहीं बनाते, तो OpenClaw config बदलने से पहले macOS Messages और Apple Push layer repair करें। एक one-shot service refresh अक्सर पर्याप्त होता है:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    phone से एक नया iMessage भेजें और OpenClaw sessions debug करने से पहले नई `chat.db` row या `imsg watch` event confirm करें। इसे periodic bridge-relaunch loop के रूप में न चलाएं; active work के दौरान बार-बार `imsg launch` और Gateway restarts deliveries interrupt कर सकते हैं और in-flight channel runs को strand कर सकते हैं।

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    default `cliPath: "imsg"` को Messages में signed in Mac पर चलना चाहिए। Linux या Windows पर, `channels.imessage.cliPath` को ऐसे wrapper script पर set करें जो उस Mac पर SSH करे और `imsg "$@"` चलाए।

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    फिर चलाएं:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    जांचें:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - pairing approvals (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    जांचें:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` allowlist behavior
    - mention pattern configuration (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    जांचें:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway host से SSH/SCP key auth
    - Gateway host पर `~/.ssh/known_hosts` में host key मौजूद है
    - Messages चलाने वाले Mac पर remote path readability

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    उसी user/session context में interactive GUI terminal में फिर से चलाएं और prompts approve करें:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirm करें कि OpenClaw/`imsg` चलाने वाले process context के लिए Full Disk Access + Automation granted हैं।

  </Accordion>
</AccordionGroup>

## Configuration reference pointers

- [Configuration reference - iMessage](/hi/gateway/config-channels#imessage)
- [Gateway configuration](/hi/gateway/configuration)
- [Pairing](/hi/channels/pairing)

## Related

- [Channels Overview](/hi/channels) — सभी supported channels
- [BlueBubbles removal and the imsg iMessage path](/hi/announcements/bluebubbles-imessage) — announcement और migration summary
- [Coming from BlueBubbles](/hi/channels/imessage-from-bluebubbles) — config translation table और step-by-step cutover
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow
- [Groups](/hi/channels/groups) — group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Security](/hi/gateway/security) — access model और hardening
