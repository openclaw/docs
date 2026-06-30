---
read_when:
    - चैट कमांड का उपयोग या कॉन्फ़िगरेशन
    - कमांड रूटिंग या अनुमतियों की डीबगिंग
    - Skill कमांड कैसे पंजीकृत होते हैं, इसे समझना
sidebarTitle: Slash commands
summary: सभी उपलब्ध slash commands, directives, और inline shortcuts — configuration, routing, और हर सतह के व्यवहार।
title: स्लैश कमांड
x-i18n:
    generated_at: "2026-06-30T14:03:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway `/` से शुरू होने वाले स्टैंडअलोन संदेशों के रूप में भेजे गए commands को संभालता है।
केवल-होस्ट bash commands `! <cmd>` का उपयोग करते हैं (`/bash <cmd>` को alias के रूप में लेकर)।

जब कोई conversation किसी ACP session से बंधी होती है, तो सामान्य text ACP
harness तक route होता है। Gateway management commands local रहते हैं: `/acp ...` हमेशा
OpenClaw command handler तक पहुंचता है, और `/status` के साथ `/unfocus` local रहते हैं जब भी
surface के लिए command handling enabled हो।

## तीन command प्रकार

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Gateway द्वारा संभाले जाने वाले स्टैंडअलोन `/...` messages। इन्हें message में
    एकमात्र content के रूप में भेजना होगा।
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — model के देखने से पहले message से हटा दिए जाते हैं।
    अकेले भेजे जाने पर session settings को persist करते हैं; अन्य text के साथ भेजे जाने पर inline hints
    के रूप में काम करते हैं।
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — तुरंत चलते हैं और
    model के remaining text देखने से पहले हटा दिए जाते हैं। केवल authorized senders।
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - Directives model के देखने से पहले message से हटा दिए जाते हैं।
    - **directive-only** messages में (message केवल directives होता है), वे
      session में persist होते हैं और acknowledgement के साथ reply करते हैं।
    - अन्य text वाले **normal chat** messages में, वे inline hints के रूप में काम करते हैं और
      session settings को persist **नहीं** करते।
    - Directives केवल **authorized senders** के लिए apply होते हैं। यदि `commands.allowFrom`
      set है, तो वही उपयोग की जाने वाली एकमात्र allowlist है; अन्यथा authorization
      channel allowlists/pairing और `commands.useAccessGroups` से आता है। Unauthorized
      senders के लिए directives plain text की तरह माने जाते हैं।
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
  chat messages में `/...` parsing enabled करता है। native commands के बिना surfaces
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) पर, text
  commands `false` पर set होने पर भी काम करते हैं।
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  native commands register करता है। Auto: Discord/Telegram के लिए on; Slack के लिए off;
  native support के बिना providers के लिए ignored। Per-channel override
  `channels.<provider>.commands.native` से करें। Discord पर, `false` slash-command
  registration को skip करता है; पहले से registered commands हटाए जाने तक visible रह सकते हैं।
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  supported होने पर skill commands को natively register करता है। Auto:
  Discord/Telegram के लिए on; Slack के लिए off। Override
  `channels.<provider>.commands.nativeSkills` से करें।
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  host shell commands (`/bash <cmd>` alias) चलाने के लिए `! <cmd>` enabled करता है। इसके लिए
  `tools.elevated` allowlists आवश्यक हैं।
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  background mode में switch करने से पहले bash कितनी देर wait करता है (`0` तुरंत
  background करता है)।
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` enabled करता है (`openclaw.json` reads/writes करता है)। केवल owner।
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` enabled करता है (`mcp.servers` के तहत OpenClaw-managed MCP config reads/writes करता है)। केवल owner।
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` enabled करता है (plugin discovery/status और install + enable/disable)। writes के लिए केवल owner।
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` enabled करता है (runtime-only config overrides)। केवल owner।
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` और gateway restart tool actions enabled करता है।
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  owner-only command surfaces के लिए explicit owner allowlist। `commands.allowFrom`
  और DM pairing access से अलग।
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per-channel: owner-only commands के लिए owner identity आवश्यक करता है। जब `true` हो,
  sender को `commands.ownerAllowFrom` से match करना होगा या internal `operator.admin`
  scope रखना होगा। Wildcard `allowFrom` entry **पर्याप्त नहीं** है।
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  system prompt में owner ids कैसे दिखाई दें, इसे control करता है।
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` होने पर उपयोग किया जाने वाला HMAC secret।
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  command authorization के लिए per-provider allowlist। Configure होने पर, यह
  commands और directives के लिए **एकमात्र** authorization source है। Global
  default के लिए `"*"` का उपयोग करें; provider-specific keys इसे override करती हैं।
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  जब `commands.allowFrom` set नहीं है, तब commands के लिए allowlists/policies enforce करता है।
</ParamField>

## Command list

Commands तीन sources से आते हैं:

- **Core built-ins:** `src/auto-reply/commands-registry.shared.ts`
- **Generated dock commands:** `src/auto-reply/commands-registry.data.ts`
- **Plugin commands:** plugin `registerCommand()` calls

Availability config flags, channel surface, और installed/enabled
plugins पर निर्भर करती है।

### Core commands

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | Command | Description |
    | --- | --- |
    | `/new [model]` | Current session को archive करें और एक fresh one शुरू करें |
    | `/reset [soft [message]]` | Current session को जगह पर reset करें। `soft` transcript रखता है, reused CLI backend session ids हटाता है, और startup फिर से चलाता है |
    | `/name <title>` | Current session को name या rename करें। Current name और suggestion देखने के लिए title omit करें |
    | `/compact [instructions]` | Session context को compact करें। [Compaction](/hi/concepts/compaction) देखें |
    | `/stop` | Current run abort करें |
    | `/session idle <duration\|off>` | thread-binding idle expiry manage करें |
    | `/session max-age <duration\|off>` | thread-binding max-age expiry manage करें |
    | `/export-session [path]` | Current session को HTML में export करें। Alias: `/export` |
    | `/export-trajectory [path]` | Current session के लिए JSONL trajectory bundle export करें। Alias: `/trajectory` |

    <Note>
      Control UI typed `/new` को intercept करके fresh
      dashboard session बनाता और switch करता है, सिवाय तब जब `session.dmScope: "main"` configured हो
      और current parent agent का main session हो — उस case में `/new`
      main session को जगह पर reset करता है। Typed `/reset` फिर भी Gateway का
      in-place reset चलाता है। Pinned session model selection clear करने के लिए
      `/model default` उपयोग करें।
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | Command | Description |
    | --- | --- |
    | `/think <level\|default>` | thinking level set करें या session override clear करें। Aliases: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | verbose output toggle करें। Alias: `/v` |
    | `/trace on\|off` | current session के लिए plugin trace output toggle करें |
    | `/fast [status\|auto\|on\|off\|default]` | fast mode दिखाएं, set करें, या clear करें |
    | `/reasoning [on\|off\|stream]` | reasoning visibility toggle करें। Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | elevated mode toggle करें। Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec defaults दिखाएं या set करें |
    | `/model [name\|#\|status]` | model दिखाएं या set करें |
    | `/models [provider] [page] [limit=<n>\|all]` | configured/auth-available providers या models list करें |
    | `/queue <mode>` | active-run queue behavior manage करें। [Queue](/hi/concepts/queue) और [Queue steering](/hi/concepts/queue-steering) देखें |
    | `/steer <message>` | active run में guidance inject करें। Alias: `/tell`। [Steer](/hi/tools/steer) देखें |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` debugging के लिए है — normal use में इसे **off** रखें।
        - `/trace` केवल plugin-owned trace/debug lines reveal करता है; normal verbose chatter off रहता है।
        - `/fast auto|on|off` session override persist करता है; इसे clear करने के लिए Sessions UI `inherit` option उपयोग करें।
        - `/fast` provider-specific है: OpenAI/Codex इसे `service_tier=priority` में map करते हैं; direct Anthropic requests इसे `service_tier=auto` या `standard_only` में map करते हैं।
        - `/reasoning`, `/verbose`, और `/trace` group settings में risky हैं — वे internal reasoning या plugin diagnostics reveal कर सकते हैं। Group chats में इन्हें off रखें।

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` नए model को तुरंत session में persist करता है।
        - यदि agent idle है, तो next run उसे तुरंत use करता है।
        - यदि कोई run active है, तो switch pending marked होता है और next clean retry point पर applied होता है।

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | Command | Description |
    | --- | --- |
    | `/help` | short help summary दिखाएं |
    | `/commands` | generated command catalog दिखाएं |
    | `/tools [compact\|verbose]` | दिखाएं कि current agent अभी क्या use कर सकता है |
    | `/status` | execution/runtime status, Gateway और system uptime, plugin health, plus provider usage/quota दिखाएं |
    | `/status plugins` | detailed plugin health दिखाएं: load errors, quarantines, channel failures, dependency issues, compatibility notices |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | current session का durable [goal](/hi/tools/goal) manage करें |
    | `/diagnostics [note]` | Owner-only support-report flow। हर बार exec approval मांगता है |
    | `/crestodian <request>` | owner DM से Crestodian setup और repair helper चलाएं |
    | `/tasks` | current session के लिए active/recent background tasks list करें |
    | `/context [list\|detail\|map\|json]` | context कैसे assembled होता है, explain करें |
    | `/whoami` | अपना sender id दिखाएं। Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | per-response usage footer control करें (`reset`/`inherit`/`clear`/`default` session override को clear करके configured default फिर से inherit करता है) या local cost summary print करें |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | Command | Description |
    | --- | --- |
    | `/skill <name> [input]` | name से skill चलाएं |
    | `/allowlist [list\|add\|remove] ...` | allowlist entries manage करें। Text-only |
    | `/approve <id> <decision>` | exec या plugin approval prompts resolve करें |
    | `/btw <question>` | session context बदले बिना side question पूछें। Alias: `/side`। [BTW](/hi/tools/btw) देखें |
  </Accordion>

  <Accordion title="उप-एजेंट और ACP">
    | कमांड | विवरण |
    | --- | --- |
    | `/subagents list\|log\|info` | मौजूदा सत्र के लिए उप-एजेंट रन जांचें |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP सत्र और रनटाइम विकल्प प्रबंधित करें। रनटाइम नियंत्रणों के लिए बाहरी स्वामी या आंतरिक Gateway व्यवस्थापक पहचान चाहिए |
    | `/focus <target>` | मौजूदा Discord थ्रेड या Telegram विषय को किसी सत्र लक्ष्य से बांधें |
    | `/unfocus` | मौजूदा थ्रेड बाइंडिंग हटाएं |
    | `/agents` | मौजूदा सत्र के लिए थ्रेड-बाउंड एजेंट सूचीबद्ध करें |
  </Accordion>

  <Accordion title="केवल-स्वामी लेखन और प्रशासन">
    | कमांड | आवश्यक | विवरण |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` पढ़ें या लिखें। केवल-स्वामी |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw-प्रबंधित MCP सर्वर कॉन्फिग पढ़ें या लिखें। केवल-स्वामी |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin स्थिति जांचें या बदलें। लेखन के लिए केवल-स्वामी। उपनाम: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | केवल-रनटाइम कॉन्फिग ओवरराइड। केवल-स्वामी |
    | `/restart` | `commands.restart: true` (डिफॉल्ट) | OpenClaw पुनः शुरू करें |
    | `/send on\|off\|inherit` | स्वामी | भेजने की नीति सेट करें |
  </Accordion>

  <Accordion title="वॉइस, TTS, चैनल नियंत्रण">
    | कमांड | विवरण |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS नियंत्रित करें। [TTS](/hi/tools/tts) देखें |
    | `/activation mention\|always` | समूह सक्रियण मोड सेट करें |
    | `/bash <command>` | होस्ट शेल कमांड चलाएं। उपनाम: `! <command>`। `commands.bash: true` आवश्यक |
    | `!poll [sessionId]` | पृष्ठभूमि bash जॉब जांचें |
    | `!stop [sessionId]` | पृष्ठभूमि bash जॉब रोकें |
  </Accordion>
</AccordionGroup>

### Dock कमांड

Dock कमांड सक्रिय सत्र के उत्तर मार्ग को दूसरे लिंक किए गए चैनल पर स्विच करते हैं।
सेटअप और समस्या-निवारण के लिए [चैनल डॉकिंग](/hi/concepts/channel-docking) देखें।

नेटिव-कमांड समर्थन वाले चैनल Plugin से जनरेट किए गए:

- `/dock-discord` (उपनाम: `/dock_discord`)
- `/dock-mattermost` (उपनाम: `/dock_mattermost`)
- `/dock-slack` (उपनाम: `/dock_slack`)
- `/dock-telegram` (उपनाम: `/dock_telegram`)

Dock कमांड के लिए `session.identityLinks` आवश्यक है। स्रोत भेजने वाला और लक्ष्य पीयर
एक ही पहचान समूह में होने चाहिए।

### बंडल किए गए Plugin कमांड

| कमांड                                                                                       | विवरण                                                                                 |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | मेमोरी Dreaming टॉगल करें (स्वामी या Gateway व्यवस्थापक)। [Dreaming](/hi/concepts/dreaming) देखें |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | डिवाइस पेयरिंग प्रबंधित करें। [पेयरिंग](/hi/channels/pairing) देखें                       |
| `/phone status\|arm ...\|disarm`                                                             | उच्च-जोखिम फोन नोड कमांड अस्थायी रूप से आर्म करें                                      |
| `/voice status\|list\|set <voiceId>`                                                         | Talk वॉइस कॉन्फिग प्रबंधित करें। Discord नेटिव नाम: `/talkvoice`                       |
| `/card ...`                                                                                  | LINE रिच कार्ड प्रीसेट भेजें। [LINE](/hi/channels/line) देखें                              |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Codex ऐप-सर्वर हार्नेस नियंत्रित करें। [Codex हार्नेस](/hi/plugins/codex-harness) देखें   |

केवल QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill कमांड

उपयोगकर्ता-द्वारा चलाए जा सकने वाले Skills स्लैश कमांड के रूप में उपलब्ध कराए जाते हैं:

- `/skill <name> [input]` हमेशा जेनेरिक एंट्रीपॉइंट के रूप में काम करता है।
- Skills सीधे कमांड के रूप में रजिस्टर हो सकते हैं (जैसे OpenProse के लिए `/prose`)।
- नेटिव Skill-कमांड रजिस्ट्रेशन `commands.nativeSkills` और
  `channels.<provider>.commands.nativeSkills` से नियंत्रित होता है।
- नामों को `a-z0-9_` में सैनिटाइज किया जाता है (अधिकतम 32 अक्षर); टकरावों को संख्यात्मक प्रत्यय मिलते हैं।

<AccordionGroup>
  <Accordion title="Skill कमांड डिस्पैच">
    डिफॉल्ट रूप से, Skill कमांड सामान्य अनुरोध की तरह मॉडल पर रूट होते हैं।

    Skills सीधे किसी टूल पर रूट करने के लिए `command-dispatch: tool` घोषित कर सकते हैं
    (नियतात्मक, मॉडल की भागीदारी नहीं)। उदाहरण: `/prose` (OpenProse Plugin)
    — [OpenProse](/hi/prose) देखें।

  </Accordion>
  <Accordion title="नेटिव कमांड आर्ग्युमेंट">
    आवश्यक आर्ग्युमेंट छोड़े जाने पर Discord डायनेमिक विकल्पों और बटन मेन्यू के लिए ऑटोकंप्लीट का उपयोग करता है।
    Telegram और Slack विकल्पों वाले कमांड के लिए बटन मेन्यू दिखाते हैं।
    डायनेमिक विकल्प लक्ष्य सत्र मॉडल के विरुद्ध रिजॉल्व होते हैं, इसलिए मॉडल-
    विशेष विकल्प जैसे `/think` स्तर सत्र के `/model` ओवरराइड का पालन करते हैं।
  </Accordion>
</AccordionGroup>

## `/tools` — एजेंट अभी क्या उपयोग कर सकता है

`/tools` एक रनटाइम प्रश्न का उत्तर देता है: **यह एजेंट अभी इस
बातचीत में क्या उपयोग कर सकता है** — कोई स्थिर कॉन्फिग कैटलॉग नहीं।

```text
/tools         # संक्षिप्त दृश्य
/tools verbose # छोटे विवरणों के साथ
```

परिणाम सत्र-स्कोप्ड होते हैं। एजेंट, चैनल, थ्रेड, भेजने वाले का
प्राधिकरण, या मॉडल बदलने से आउटपुट बदल सकता है। प्रोफाइल और ओवरराइड संपादन के लिए,
Control UI Tools पैनल या कॉन्फिग सतहों का उपयोग करें।

## `/model` — मॉडल चयन

```text
/model             # मॉडल पिकर दिखाएं
/model list        # वही
/model 3           # पिकर से संख्या द्वारा चुनें
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # सत्र मॉडल चयन साफ करें
/model status      # एंडपॉइंट और API मोड के साथ विस्तृत दृश्य
```

Discord पर, `/model` और `/models` प्रदाता और
मॉडल ड्रॉपडाउन के साथ एक इंटरैक्टिव पिकर खोलते हैं। पिकर `agents.defaults.models` का सम्मान करता है, जिसमें
`provider/*` प्रविष्टियां शामिल हैं।

## `/config` — ऑन-डिस्क कॉन्फिग लेखन

<Note>
  केवल-स्वामी। डिफॉल्ट रूप से अक्षम — `commands.config: true` से सक्षम करें।
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

लिखने से पहले कॉन्फिग सत्यापित किया जाता है। अमान्य परिवर्तन अस्वीकार किए जाते हैं। `/config`
अपडेट पुनः शुरू होने के बाद भी बने रहते हैं।

## `/mcp` — MCP सर्वर कॉन्फिग

<Note>
  केवल-स्वामी। डिफॉल्ट रूप से अक्षम — `commands.mcp: true` से सक्षम करें।
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
  केवल-स्वामी। डिफॉल्ट रूप से अक्षम — `commands.debug: true` से सक्षम करें।
  ओवरराइड नए कॉन्फिग रीड पर तुरंत लागू होते हैं लेकिन डिस्क पर **नहीं** लिखते।
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — Plugin प्रबंधन

<Note>
  लेखन के लिए केवल-स्वामी। डिफॉल्ट रूप से अक्षम — `commands.plugins: true` से सक्षम करें।
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` Plugin कॉन्फिग अपडेट करता है और नए एजेंट टर्न के लिए Gateway
Plugin रनटाइम को हॉट-रीलोड करता है। `/plugins install` प्रबंधित
Gateways को स्वतः पुनः शुरू करता है क्योंकि Plugin स्रोत मॉड्यूल बदल गए हैं।

## `/trace` — Plugin ट्रेस आउटपुट

```text
/trace          # मौजूदा ट्रेस स्थिति दिखाएं
/trace on
/trace off
```

`/trace` पूर्ण वर्बोज़ मोड के बिना सत्र-स्कोप्ड Plugin ट्रेस/डीबग लाइनें दिखाता है।
यह `/debug` (रनटाइम ओवरराइड) या `/verbose` (सामान्य
टूल आउटपुट) को प्रतिस्थापित नहीं करता।

## `/btw` — साइड प्रश्न

`/btw` मौजूदा सत्र संदर्भ के बारे में एक त्वरित साइड प्रश्न है। उपनाम: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

सामान्य संदेश के विपरीत:

- मौजूदा सत्र को पृष्ठभूमि संदर्भ के रूप में उपयोग करता है।
- Codex हार्नेस सत्रों में, अस्थायी Codex साइड थ्रेड के रूप में चलता है।
- भविष्य के सत्र संदर्भ को **नहीं** बदलता।
- ट्रांसक्रिप्ट इतिहास में नहीं लिखा जाता।

पूर्ण व्यवहार के लिए [BTW साइड प्रश्न](/hi/tools/btw) देखें।

## सतह नोट्स

<AccordionGroup>
  <Accordion title="प्रति सतह सत्र स्कोपिंग">
    - **टेक्स्ट कमांड:** सामान्य चैट सत्र में चलते हैं (DMs `main` साझा करते हैं, समूहों का अपना सत्र होता है)।
    - **नेटिव Discord कमांड:** `agent:<agentId>:discord:slash:<userId>`
    - **नेटिव Slack कमांड:** `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix` के माध्यम से प्रीफिक्स कॉन्फिगर करने योग्य)
    - **नेटिव Telegram कमांड:** `telegram:slash:<userId>` (`CommandTargetSessionKey` के माध्यम से चैट सत्र को लक्षित करते हैं)
    - **`/stop`** मौजूदा रन को रोकने के लिए सक्रिय चैट सत्र को लक्षित करता है।

  </Accordion>
  <Accordion title="Slack विशिष्टताएं">
    `channels.slack.slashCommand` एकल `/openclaw`-शैली कमांड का समर्थन करता है।
    `commands.native: true` के साथ, हर बिल्ट-इन
    कमांड के लिए एक Slack स्लैश कमांड बनाएं। `/agentstatus` रजिस्टर करें (`/status` नहीं) क्योंकि Slack
    `/status` आरक्षित रखता है। टेक्स्ट `/status` अब भी Slack संदेशों में काम करता है।
  </Accordion>
  <Accordion title="फास्ट पाथ और इनलाइन शॉर्टकट">
    - allowlisted भेजने वालों के केवल-कमांड संदेश तुरंत संभाले जाते हैं (क्यू + मॉडल को बायपास करके)।
    - इनलाइन शॉर्टकट (`/help`, `/commands`, `/status`, `/whoami`) सामान्य संदेशों में एम्बेड होकर भी काम करते हैं और मॉडल के बाकी टेक्स्ट देखने से पहले हटा दिए जाते हैं।
    - अनधिकृत केवल-कमांड संदेश चुपचाप अनदेखे किए जाते हैं; इनलाइन `/...` टोकन सादे टेक्स्ट के रूप में माने जाते हैं।

  </Accordion>
  <Accordion title="आर्ग्युमेंट नोट्स">
    - कमांड और आर्ग्युमेंट के बीच वैकल्पिक `:` स्वीकार करते हैं (`/think: high`, `/send: on`)।
    - `/new <model>` मॉडल उपनाम, `provider/model`, या प्रदाता नाम (फज़ी मैच) स्वीकार करता है; यदि कोई मैच नहीं, तो टेक्स्ट को संदेश बॉडी माना जाता है।
    - `/allowlist add|remove` के लिए `commands.config: true` आवश्यक है और यह चैनल `configWrites` का सम्मान करता है।

  </Accordion>
</AccordionGroup>

## प्रदाता उपयोग और स्थिति

- **प्रदाता उपयोग/कोटा** (जैसे, "Claude 80% left") मौजूदा मॉडल प्रदाता के लिए `/status` में दिखता है जब उपयोग ट्रैकिंग सक्षम हो।
- **टोकन/कैश लाइनें** `/status` में नवीनतम ट्रांसक्रिप्ट उपयोग प्रविष्टि पर वापस जा सकती हैं जब लाइव सत्र स्नैपशॉट विरल हो।
- **निष्पादन बनाम रनटाइम:** `/status` प्रभावी सैंडबॉक्स पाथ के लिए `Execution` और सत्र कौन चला रहा है इसके लिए `Runtime` रिपोर्ट करता है: `OpenClaw Default`, `OpenAI Codex`, कोई CLI बैकएंड, या कोई ACP बैकएंड।
- **प्रति-उत्तर टोकन/लागत:** `/usage off|tokens|full` से नियंत्रित।
- `/model status` मॉडल/ऑथ/एंडपॉइंट के बारे में है, उपयोग के बारे में नहीं।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills" href="/hi/tools/skills" icon="puzzle-piece">
    Skill स्लैश कमांड कैसे रजिस्टर और गेट किए जाते हैं।
  </Card>
  <Card title="Skills बनाना" href="/hi/tools/creating-skills" icon="hammer">
    ऐसा Skill बनाएं जो अपना स्लैश कमांड रजिस्टर करता हो।
  </Card>
  <Card title="BTW" href="/hi/tools/btw" icon="comments">
    सत्र संदर्भ बदले बिना साइड प्रश्न।
  </Card>
  <Card title="Steer" href="/hi/tools/steer" icon="compass">
    `/steer` के साथ रन के बीच में एजेंट का मार्गदर्शन करें।
  </Card>
</CardGroup>
