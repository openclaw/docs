---
read_when:
    - चैट कमांड का उपयोग या कॉन्फ़िगर करना
    - Debugging कमांड रूटिंग या अनुमतियाँ
    - skill कमांड कैसे पंजीकृत किए जाते हैं, इसे समझना
sidebarTitle: Slash commands
summary: सभी उपलब्ध स्लैश कमांड, directives, और इनलाइन शॉर्टकट — कॉन्फ़िगरेशन, रूटिंग, और प्रति-सतह व्यवहार।
title: स्लैश कमांड
x-i18n:
    generated_at: "2026-07-01T20:23:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway `/` से शुरू होने वाले standalone संदेशों के रूप में भेजे गए commands को संभालता है।
केवल-host bash commands `! <cmd>` का उपयोग करते हैं (`/bash <cmd>` alias के रूप में)।

जब कोई conversation किसी ACP session से bound होती है, तो सामान्य text ACP
harness तक route होता है। Gateway management commands local रहते हैं: `/acp ...` हमेशा
OpenClaw command handler तक पहुंचता है, और `/status` plus `/unfocus` उस surface के लिए
command handling enabled होने पर local रहते हैं।

## तीन command प्रकार

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Gateway द्वारा handled standalone `/...` messages। इन्हें message में
    केवल content के रूप में भेजा जाना चाहिए।
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — model के देखने से पहले message से हटाए जाते हैं।
    अकेले भेजे जाने पर session settings persist करते हैं; अन्य text के साथ
    भेजे जाने पर inline hints के रूप में काम करते हैं।
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — तुरंत run होते हैं और
    model के बचा हुआ text देखने से पहले हटा दिए जाते हैं। केवल authorized senders।
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - Directives model के देखने से पहले message से हटा दिए जाते हैं।
    - **directive-only** messages में (message केवल directives है), वे
      session में persist होते हैं और acknowledgement के साथ reply करते हैं।
    - अन्य text वाले **normal chat** messages में, वे inline hints के रूप में काम करते हैं और
      session settings persist **नहीं** करते।
    - Directives केवल **authorized senders** के लिए लागू होते हैं। यदि `commands.allowFrom`
      set है, तो वही एकमात्र allowlist used है; अन्यथा authorization
      channel allowlists/pairing plus `commands.useAccessGroups` से आता है। Unauthorized
      senders के लिए directives plain text की तरह treated होते हैं।
  </Accordion>
</AccordionGroup>

## Configuration

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  chat messages में `/...` parsing enabled करता है। native commands के बिना surfaces पर
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), text
  commands `false` set होने पर भी काम करते हैं।
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  native commands register करता है। Auto: Discord/Telegram के लिए on; Slack के लिए off;
  native support के बिना providers के लिए ignored। प्रति-channel override
  `channels.<provider>.commands.native` से करें। Discord पर, `false` slash-command
  registration skip करता है; पहले registered commands हटाए जाने तक visible रह सकते हैं।
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  supported होने पर skill commands natively register करता है। Auto:
  Discord/Telegram के लिए on; Slack के लिए off। Override
  `channels.<provider>.commands.nativeSkills` से करें।
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  host shell commands run करने के लिए `! <cmd>` enabled करता है (`/bash <cmd>` alias)। Requires
  `tools.elevated` allowlists।
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  background mode में switch करने से पहले bash कितनी देर wait करता है (`0` immediately background करता है)।
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` enabled करता है (`openclaw.json` read/write करता है)। केवल-owner।
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` enabled करता है (`mcp.servers` के अंतर्गत OpenClaw-managed MCP config read/write करता है)। केवल-owner।
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` enabled करता है (plugin discovery/status plus install + enable/disable)। writes के लिए केवल-owner।
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` enabled करता है (runtime-only config overrides)। केवल-owner।
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` और gateway restart tool actions enabled करता है।
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  owner-only command surfaces के लिए explicit owner allowlist। `commands.allowFrom`
  और DM pairing access से अलग।
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  प्रति-channel: owner-only commands के लिए owner identity requires करता है। जब `true` हो,
  sender को `commands.ownerAllowFrom` से match होना चाहिए या internal `operator.admin`
  scope hold करना चाहिए। wildcard `allowFrom` entry **पर्याप्त नहीं** है।
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  system prompt में owner ids कैसे appear होते हैं, इसे control करता है।
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` होने पर इस्तेमाल होने वाला HMAC secret।
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  command authorization के लिए per-provider allowlist। configured होने पर, यह commands और directives के लिए
  **only** authorization source है। global default के लिए `"*"` use करें;
  provider-specific keys इसे override करती हैं।
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` set न होने पर commands के लिए allowlists/policies enforce करता है।
</ParamField>

## Command list

Commands तीन sources से आते हैं:

- **Core built-ins:** `src/auto-reply/commands-registry.shared.ts`
- **Generated dock commands:** `src/auto-reply/commands-registry.data.ts`
- **Plugin commands:** plugin `registerCommand()` calls

Availability config flags, channel surface, और installed/enabled
plugins पर depends करती है।

### Core commands

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | Command | Description |
    | --- | --- |
    | `/new [model]` | current session archive करें और fresh one start करें |
    | `/reset [soft [message]]` | current session को in place reset करें। `soft` transcript रखता है, reused CLI backend session ids drop करता है, और startup rerun करता है |
    | `/name <title>` | current session को name या rename करें। current name और suggestion देखने के लिए title omit करें |
    | `/compact [instructions]` | session context compact करें। देखें [Compaction](/hi/concepts/compaction) |
    | `/stop` | current run abort करें |
    | `/session idle <duration\|off>` | thread-binding idle expiry manage करें |
    | `/session max-age <duration\|off>` | thread-binding max-age expiry manage करें |
    | `/export-session [path]` | current session को HTML में export करें। Alias: `/export` |
    | `/export-trajectory [path]` | current session के लिए JSONL trajectory bundle export करें। Alias: `/trajectory` |

    <Note>
      Control UI typed `/new` को intercept करके fresh
      dashboard session create और switch करता है, except जब `session.dmScope: "main"` configured हो
      और current parent agent का main session हो — उस case में `/new`
      main session को in place reset करता है। Typed `/reset` अभी भी Gateway का
      in-place reset run करता है। pinned
      session model selection clear करना हो तो `/model default` use करें।
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | Command | Description |
    | --- | --- |
    | `/think <level\|default>` | thinking level set करें या session override clear करें। Aliases: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | verbose output toggle करें। Alias: `/v` |
    | `/trace on\|off` | current session के लिए plugin trace output toggle करें |
    | `/fast [status\|auto\|on\|off\|default]` | fast mode show, set, या clear करें |
    | `/reasoning [on\|off\|stream]` | reasoning visibility toggle करें। Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | elevated mode toggle करें। Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec defaults show या set करें |
    | `/login [codex\|openai\|openai-codex]` | private chat या Web UI session से Codex/OpenAI login pair करें। केवल-owner/admin |
    | `/model [name\|#\|status]` | model show या set करें |
    | `/models [provider] [page] [limit=<n>\|all]` | configured/auth-available providers या models list करें |
    | `/queue <mode>` | active-run queue behavior manage करें। देखें [Queue](/hi/concepts/queue) और [Queue steering](/hi/concepts/queue-steering) |
    | `/steer <message>` | active run में guidance inject करें। Alias: `/tell`। देखें [Steer](/hi/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` debugging के लिए है — normal use में इसे **off** रखें।
        - `/trace` केवल plugin-owned trace/debug lines reveal करता है; normal verbose chatter off रहता है।
        - `/fast auto|on|off` session override persist करता है; इसे clear करने के लिए Sessions UI `inherit` option use करें।
        - `/fast` provider-specific है: OpenAI/Codex इसे `service_tier=priority` पर map करते हैं; direct Anthropic requests इसे `service_tier=auto` या `standard_only` पर map करते हैं।
        - `/reasoning`, `/verbose`, और `/trace` group settings में risky हैं — वे internal reasoning या plugin diagnostics reveal कर सकते हैं। इन्हें group chats में off रखें।

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` नए model को तुरंत session में persist करता है।
        - यदि agent idle है, तो next run इसे right away use करता है।
        - यदि कोई run active है, तो switch pending mark होता है और next clean retry point पर apply होता है।

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | Command | Description |
    | --- | --- |
    | `/help` | short help summary show करें |
    | `/commands` | generated command catalog show करें |
    | `/tools [compact\|verbose]` | current agent अभी क्या use कर सकता है, show करें |
    | `/status` | execution/runtime status, Gateway और system uptime, plugin health, plus provider usage/quota show करें |
    | `/status plugins` | detailed plugin health show करें: load errors, quarantines, channel failures, dependency issues, compatibility notices |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | current session का durable [goal](/hi/tools/goal) manage करें |
    | `/diagnostics [note]` | owner-only support-report flow। हर बार exec approval मांगता है |
    | `/crestodian <request>` | owner DM से Crestodian setup और repair helper run करें |
    | `/tasks` | current session के लिए active/recent background tasks list करें |
    | `/context [list\|detail\|map\|json]` | context कैसे assembled होता है, explain करें |
    | `/whoami` | आपका sender id show करें। Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | per-response usage footer control करें (`reset`/`inherit`/`clear`/`default` session override को clear करके configured default फिर inherit कराता है) या local cost summary print करें |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | Command | Description |
    | --- | --- |
    | `/skill <name> [input]` | name से skill run करें |
    | `/allowlist [list\|add\|remove] ...` | allowlist entries manage करें। Text-only |
    | `/approve <id> <decision>` | exec या plugin approval prompts resolve करें |
    | `/btw <question>` | session context बदले बिना side question पूछें। Alias: `/side`। देखें [BTW](/hi/tools/btw) |
  </Accordion>

  <Accordion title="सबएजेंट और ACP">
    | कमांड | विवरण |
    | --- | --- |
    | `/subagents list\|log\|info` | वर्तमान सत्र के लिए सब-एजेंट रन देखें |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP सत्र और रनटाइम विकल्प प्रबंधित करें। रनटाइम नियंत्रणों के लिए बाहरी स्वामी या आंतरिक Gateway एडमिन पहचान चाहिए |
    | `/focus <target>` | वर्तमान Discord थ्रेड या Telegram टॉपिक को किसी सत्र लक्ष्य से बांधें |
    | `/unfocus` | वर्तमान थ्रेड बाइंडिंग हटाएं |
    | `/agents` | वर्तमान सत्र के लिए थ्रेड-बाउंड एजेंट सूचीबद्ध करें |
  </Accordion>

  <Accordion title="केवल-स्वामी लिखाई और एडमिन">
    | कमांड | आवश्यक | विवरण |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` पढ़ें या लिखें। केवल स्वामी |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw-प्रबंधित MCP सर्वर कॉन्फिग पढ़ें या लिखें। केवल स्वामी |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin स्थिति देखें या बदलें। लिखाई के लिए केवल स्वामी। उपनाम: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | केवल-रनटाइम कॉन्फिग ओवरराइड। केवल स्वामी |
    | `/restart` | `commands.restart: true` (डिफ़ॉल्ट) | OpenClaw रीस्टार्ट करें |
    | `/send on\|off\|inherit` | स्वामी | भेजने की नीति सेट करें |
  </Accordion>

  <Accordion title="वॉइस, TTS, चैनल नियंत्रण">
    | कमांड | विवरण |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS नियंत्रित करें। [TTS](/hi/tools/tts) देखें |
    | `/activation mention\|always` | समूह सक्रियण मोड सेट करें |
    | `/bash <command>` | होस्ट शेल कमांड चलाएं। उपनाम: `! <command>`। `commands.bash: true` आवश्यक |
    | `!poll [sessionId]` | बैकग्राउंड bash जॉब जांचें |
    | `!stop [sessionId]` | बैकग्राउंड bash जॉब रोकें |
  </Accordion>
</AccordionGroup>

### Dock कमांड

Dock कमांड सक्रिय सत्र के उत्तर रूट को दूसरे लिंक किए गए चैनल पर स्विच करते हैं।
सेटअप और समस्या-निवारण के लिए [चैनल डॉकिंग](/hi/concepts/channel-docking) देखें।

नेटिव-कमांड समर्थन वाले चैनल plugins से जनरेट किया गया:

- `/dock-discord` (उपनाम: `/dock_discord`)
- `/dock-mattermost` (उपनाम: `/dock_mattermost`)
- `/dock-slack` (उपनाम: `/dock_slack`)
- `/dock-telegram` (उपनाम: `/dock_telegram`)

Dock कमांड के लिए `session.identityLinks` आवश्यक है। स्रोत प्रेषक और लक्ष्य पीयर
एक ही पहचान समूह में होने चाहिए।

### बंडल किए गए plugin कमांड

| कमांड                                                                                      | विवरण                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | मेमोरी Dreaming टॉगल करें (स्वामी या Gateway एडमिन)। [Dreaming](/hi/concepts/dreaming) देखें |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | डिवाइस पेयरिंग प्रबंधित करें। [पेयरिंग](/hi/channels/pairing) देखें                             |
| `/phone status\|arm ...\|disarm`                                                             | उच्च-जोखिम फोन नोड कमांड अस्थायी रूप से आर्म करें                                       |
| `/voice status\|list\|set <voiceId>`                                                         | Talk वॉइस कॉन्फिग प्रबंधित करें। Discord नेटिव नाम: `/talkvoice`                         |
| `/card ...`                                                                                  | LINE रिच कार्ड प्रीसेट भेजें। [LINE](/hi/channels/line) देखें                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Codex ऐप-सर्वर हार्नेस नियंत्रित करें। [Codex हार्नेस](/hi/plugins/codex-harness) देखें   |

केवल QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill कमांड

उपयोगकर्ता-द्वारा-चलाए जा सकने वाले skills स्लैश कमांड के रूप में उपलब्ध हैं:

- `/skill <name> [input]` जेनेरिक एंट्रीपॉइंट के रूप में हमेशा काम करता है।
- Skills सीधे कमांड के रूप में रजिस्टर हो सकते हैं (जैसे OpenProse के लिए `/prose`)।
- नेटिव skill-कमांड रजिस्ट्रेशन `commands.nativeSkills` और
  `channels.<provider>.commands.nativeSkills` से नियंत्रित होता है।
- नामों को `a-z0-9_` में सैनिटाइज किया जाता है (अधिकतम 32 वर्ण); टकरावों को संख्यात्मक सफ़िक्स मिलते हैं।

<AccordionGroup>
  <Accordion title="Skill कमांड डिस्पैच">
    डिफ़ॉल्ट रूप से, skill कमांड सामान्य अनुरोध की तरह मॉडल तक रूट होते हैं।

    Skills सीधे किसी टूल तक रूट करने के लिए `command-dispatch: tool` घोषित कर सकते हैं
    (निर्धारित, मॉडल की भागीदारी नहीं)। उदाहरण: `/prose` (OpenProse plugin)
    — [OpenProse](/hi/prose) देखें।

  </Accordion>
  <Accordion title="नेटिव कमांड आर्ग्युमेंट">
    आवश्यक args छोड़े जाने पर Discord डायनेमिक विकल्पों और बटन मेन्यू के लिए ऑटोकंप्लीट का उपयोग करता है।
    Telegram और Slack विकल्पों वाले कमांड के लिए बटन मेन्यू दिखाते हैं।
    डायनेमिक विकल्प लक्ष्य सत्र मॉडल के विरुद्ध रिज़ॉल्व होते हैं, इसलिए मॉडल-
    विशिष्ट विकल्प जैसे `/think` स्तर सत्र के `/model` ओवरराइड का पालन करते हैं।
  </Accordion>
</AccordionGroup>

## `/tools` — एजेंट अभी क्या उपयोग कर सकता है

`/tools` एक रनटाइम प्रश्न का उत्तर देता है: **यह एजेंट अभी इस
बातचीत में क्या उपयोग कर सकता है** — कोई स्थिर कॉन्फिग कैटलॉग नहीं।

```text
/tools         # compact view
/tools verbose # with short descriptions
```

परिणाम सत्र-स्कोप्ड होते हैं। एजेंट, चैनल, थ्रेड, प्रेषक
प्राधिकरण, या मॉडल बदलने से आउटपुट बदल सकता है। प्रोफ़ाइल और ओवरराइड संपादन के लिए,
Control UI Tools पैनल या कॉन्फिग सतहों का उपयोग करें।

## `/model` — मॉडल चयन

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Discord पर, `/model` और `/models` प्रदाता और
मॉडल ड्रॉपडाउन वाला इंटरैक्टिव पिकर खोलते हैं। पिकर `agents.defaults.models` का सम्मान करता है, जिसमें
`provider/*` प्रविष्टियां शामिल हैं।

## `/config` — ऑन-डिस्क कॉन्फिग लिखाई

<Note>
  केवल स्वामी। डिफ़ॉल्ट रूप से अक्षम — `commands.config: true` से सक्षम करें।
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

कॉन्फिग को लिखने से पहले सत्यापित किया जाता है। अमान्य बदलाव अस्वीकार किए जाते हैं। `/config`
अपडेट रीस्टार्ट के बाद भी बने रहते हैं।

## `/mcp` — MCP सर्वर कॉन्फिग

<Note>
  केवल स्वामी। डिफ़ॉल्ट रूप से अक्षम — `commands.mcp: true` से सक्षम करें।
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` कॉन्फिग को OpenClaw कॉन्फिग में संग्रहीत करता है, एम्बेडेड-एजेंट प्रोजेक्ट सेटिंग्स में नहीं।

## `/debug` — केवल-रनटाइम ओवरराइड

<Note>
  केवल स्वामी। डिफ़ॉल्ट रूप से अक्षम — `commands.debug: true` से सक्षम करें।
  ओवरराइड नए कॉन्फिग रीड्स पर तुरंत लागू होते हैं, लेकिन डिस्क पर **नहीं** लिखते।
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — plugin प्रबंधन

<Note>
  लिखाई के लिए केवल स्वामी। डिफ़ॉल्ट रूप से अक्षम — `commands.plugins: true` से सक्षम करें।
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` plugin कॉन्फिग अपडेट करता है और नए एजेंट टर्न के लिए Gateway
plugin रनटाइम को हॉट-रीलोड करता है। `/plugins install` प्रबंधित
Gateways को अपने-आप रीस्टार्ट करता है क्योंकि plugin स्रोत मॉड्यूल बदल गए।

## `/trace` — plugin ट्रेस आउटपुट

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` पूर्ण verbose
मोड के बिना सत्र-स्कोप्ड plugin ट्रेस/डीबग लाइनें दिखाता है। यह `/debug` (रनटाइम ओवरराइड) या `/verbose` (सामान्य
टूल आउटपुट) की जगह नहीं लेता।

## `/btw` — साइड प्रश्न

`/btw` वर्तमान सत्र संदर्भ के बारे में एक त्वरित साइड प्रश्न है। उपनाम: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

सामान्य संदेश के विपरीत:

- वर्तमान सत्र को बैकग्राउंड संदर्भ के रूप में उपयोग करता है।
- Codex हार्नेस सत्रों में, क्षणिक Codex साइड थ्रेड के रूप में चलता है।
- भविष्य के सत्र संदर्भ को **नहीं** बदलता।
- ट्रांसक्रिप्ट इतिहास में नहीं लिखा जाता।

पूर्ण व्यवहार के लिए [BTW साइड प्रश्न](/hi/tools/btw) देखें।

## सतह नोट्स

<AccordionGroup>
  <Accordion title="प्रति सतह सत्र स्कोपिंग">
    - **टेक्स्ट कमांड:** सामान्य चैट सत्र में चलते हैं (DMs `main` साझा करते हैं, समूहों का अपना सत्र होता है)।
    - **नेटिव Discord कमांड:** `agent:<agentId>:discord:slash:<userId>`
    - **नेटिव Slack कमांड:** `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix` के जरिए प्रीफ़िक्स कॉन्फिगर करने योग्य)
    - **नेटिव Telegram कमांड:** `telegram:slash:<userId>` (`CommandTargetSessionKey` के जरिए चैट सत्र को लक्षित करता है)
    - **`/login codex`** डिवाइस पेयरिंग कोड केवल निजी चैट या Web UI प्रतिक्रिया पथों से भेजता है। Telegram समूह/टॉपिक इनवोकेशन स्वामी से इसके बजाय bot को DM करने को कहते हैं।
    - **`/stop`** वर्तमान रन को रोकने के लिए सक्रिय चैट सत्र को लक्षित करता है।

  </Accordion>
  <Accordion title="Slack विशेषताएं">
    `channels.slack.slashCommand` एकल `/openclaw`-शैली कमांड का समर्थन करता है।
    `commands.native: true` के साथ, प्रत्येक बिल्ट-इन
    कमांड के लिए एक Slack स्लैश कमांड बनाएं। `/agentstatus` रजिस्टर करें (`/status` नहीं) क्योंकि Slack
    `/status` आरक्षित रखता है। Slack संदेशों में टेक्स्ट `/status` फिर भी काम करता है।
  </Accordion>
  <Accordion title="फास्ट पाथ और इनलाइन शॉर्टकट">
    - allowlisted प्रेषकों से कमांड-केवल संदेश तुरंत संभाले जाते हैं (क्यू + मॉडल बायपास)।
    - इनलाइन शॉर्टकट (`/help`, `/commands`, `/status`, `/whoami`) सामान्य संदेशों में एम्बेडेड होने पर भी काम करते हैं और मॉडल के बाकी टेक्स्ट देखने से पहले हटाए जाते हैं।
    - अनधिकृत कमांड-केवल संदेश चुपचाप अनदेखे किए जाते हैं; इनलाइन `/...` टोकन सामान्य टेक्स्ट की तरह माने जाते हैं।

  </Accordion>
  <Accordion title="आर्ग्युमेंट नोट्स">
    - कमांड कमांड और args के बीच वैकल्पिक `:` स्वीकार करते हैं (`/think: high`, `/send: on`)।
    - `/new <model>` मॉडल उपनाम, `provider/model`, या प्रदाता नाम (fuzzy match) स्वीकार करता है; यदि कोई मिलान नहीं होता, तो टेक्स्ट को संदेश बॉडी माना जाता है।
    - `/allowlist add|remove` के लिए `commands.config: true` आवश्यक है और यह चैनल `configWrites` का सम्मान करता है।

  </Accordion>
</AccordionGroup>

## प्रदाता उपयोग और स्थिति

- **प्रदाता उपयोग/कोटा** (जैसे, "Claude 80% left") वर्तमान मॉडल प्रदाता के लिए `/status` में दिखता है जब उपयोग ट्रैकिंग सक्षम होती है।
- `/status` में **टोकन/कैश लाइनें** लाइव सत्र स्नैपशॉट sparse होने पर नवीनतम ट्रांसक्रिप्ट उपयोग प्रविष्टि पर fallback कर सकती हैं।
- **Execution बनाम रनटाइम:** `/status` प्रभावी sandbox पाथ के लिए `Execution` और सत्र कौन चला रहा है इसके लिए `Runtime` रिपोर्ट करता है: `OpenClaw Default`, `OpenAI Codex`, CLI बैकएंड, या ACP बैकएंड।
- **प्रति-प्रतिक्रिया टोकन/लागत:** `/usage off|tokens|full` से नियंत्रित।
- `/model status` मॉडल/auth/endpoints के बारे में है, उपयोग के बारे में नहीं।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills" href="/hi/tools/skills" icon="puzzle-piece">
    Skill स्लैश कमांड कैसे रजिस्टर और gated किए जाते हैं।
  </Card>
  <Card title="Skills बनाना" href="/hi/tools/creating-skills" icon="hammer">
    ऐसी skill बनाएं जो अपना स्लैश कमांड रजिस्टर करे।
  </Card>
  <Card title="BTW" href="/hi/tools/btw" icon="comments">
    सत्र संदर्भ बदले बिना साइड प्रश्न।
  </Card>
  <Card title="Steer" href="/hi/tools/steer" icon="compass">
    `/steer` के साथ रन के बीच में एजेंट को मार्गदर्शन दें।
  </Card>
</CardGroup>
