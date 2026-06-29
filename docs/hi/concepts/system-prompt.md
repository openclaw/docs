---
read_when:
    - सिस्टम प्रॉम्प्ट टेक्स्ट, टूल्स सूची, या समय/Heartbeat अनुभागों को संपादित करना
    - वर्कस्पेस बूटस्ट्रैप या Skills इंजेक्शन व्यवहार बदलना
summary: OpenClaw सिस्टम प्रॉम्प्ट में क्या होता है और इसे कैसे असेंबल किया जाता है
title: सिस्टम प्रॉम्प्ट
x-i18n:
    generated_at: "2026-06-28T23:03:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw हर agent run के लिए एक कस्टम सिस्टम प्रॉम्प्ट बनाता है। प्रॉम्प्ट **OpenClaw-स्वामित्व वाला** है और runtime डिफ़ॉल्ट प्रॉम्प्ट का उपयोग नहीं करता।

प्रॉम्प्ट OpenClaw द्वारा असेंबल किया जाता है और हर agent run में इंजेक्ट किया जाता है।

प्रॉम्प्ट असेंबली की तीन परतें हैं:

- `buildAgentSystemPrompt` स्पष्ट इनपुट से प्रॉम्प्ट रेंडर करता है। इसे
  एक शुद्ध renderer रहना चाहिए और global config को सीधे नहीं पढ़ना चाहिए।
- `resolveAgentSystemPromptConfig` किसी विशिष्ट agent के लिए owner display,
  TTS hints, model aliases, memory citation mode, और sub-agent
  delegation mode जैसे config-backed prompt knobs resolve करता है।
- Runtime adapters (embedded, CLI, command/export previews, compaction) tools,
  sandbox state, channel capabilities, context files, और provider prompt
  contributions जैसे live facts इकट्ठा करते हैं, फिर configured prompt facade
  को कॉल करते हैं।

यह exported/debug prompt surfaces को live runs के साथ aligned रखता है, बिना
हर runtime-specific detail को एक monolithic builder में बदलें।

Provider plugins पूरा OpenClaw-स्वामित्व वाला प्रॉम्प्ट बदले बिना cache-aware
prompt guidance contribute कर सकते हैं। provider runtime यह कर सकता है:

- named core sections (`interaction_style`,
  `tool_call_style`, `execution_bias`) के छोटे set को replace करना
- prompt cache boundary के ऊपर एक **stable prefix** inject करना
- prompt cache boundary के नीचे एक **dynamic suffix** inject करना

model-family-specific tuning के लिए provider-owned contributions का उपयोग करें। legacy
`before_prompt_build` prompt mutation को compatibility या सचमुच global prompt
changes के लिए रखें, सामान्य provider behavior के लिए नहीं।

OpenAI GPT-5 family overlay core execution rule को छोटा रखता है और persona latching, concise output, tool discipline,
parallel lookup, deliverable coverage, verification, missing context, और
terminal-tool hygiene के लिए model-specific guidance जोड़ता है।

## संरचना

प्रॉम्प्ट जानबूझकर compact है और fixed sections का उपयोग करता है:

- **Tooling**: structured-tool source-of-truth reminder और runtime tool-use guidance।
- **Execution Bias**: compact follow-through guidance: actionable requests पर
  उसी turn में act करें, done या blocked होने तक जारी रखें, weak tool
  results से recover करें, mutable state को live check करें, और finalizing से पहले verify करें।
- **Safety**: power-seeking behavior या oversight bypass करने से बचने के लिए छोटा guardrail reminder।
- **Skills** (जब उपलब्ध हों): model को बताता है कि demand पर skill instructions कैसे load करें।
- **OpenClaw Control**: model को config/restart work के लिए `gateway` tool को
  prefer करने और CLI commands invent करने से बचने को कहता है।
- **OpenClaw Self-Update**: `config.schema.lookup` के साथ config safely inspect करने,
  `config.patch` के साथ config patch करने, `config.apply` के साथ पूरा
  config replace करने, और केवल explicit user request पर `update.run` चलाने का तरीका।
  agent-facing `gateway` tool `tools.exec.ask` / `tools.exec.security` को rewrite करने से भी मना करता है,
  जिसमें legacy `tools.bash.*` aliases शामिल हैं जो उन protected exec paths पर normalize होते हैं।
- **Workspace**: working directory (`agents.defaults.workspace`)।
- **Documentation**: OpenClaw docs/source का local path और उन्हें कब पढ़ना है।
- **Workspace Files (injected)**: बताता है कि bootstrap files नीचे शामिल हैं।
- **Sandbox** (जब enabled हो): sandboxed runtime, sandbox paths, और elevated exec उपलब्ध है या नहीं, बताता है।
- **Current Date & Time**: केवल time zone (cache-stable; live clock `session_status` से आता है)।
- **Assistant Output Directives**: compact attachment, voice-note, और reply tag syntax।
- **Heartbeats**: default agent के लिए heartbeats enabled होने पर heartbeat prompt और ack behavior।
- **Runtime**: host, OS, node, model, repo root (जब detected हो), thinking level (एक line)।
- **Reasoning**: current visibility level + /reasoning toggle hint।

OpenClaw बड़े stable content, जिसमें **Project Context** शामिल है, को
internal prompt cache boundary के ऊपर रखता है। Control UI embed guidance,
**Messaging**, **Voice**, **Group Chat Context**, **Reactions**, **Heartbeats**, और
**Runtime** जैसे volatile channel/session sections उस boundary के नीचे append किए जाते हैं
ताकि prefix caches वाले local backends stable workspace prefix को
channel turns में reuse कर सकें। Tool descriptions को भी current
channel names embed करने से बचना चाहिए जब accepted schema पहले से वह runtime detail carry करता हो।

Tooling section long-running work के लिए runtime guidance भी शामिल करता है:

- future follow-up (`check back later`, reminders, recurring work) के लिए cron का उपयोग करें,
  `exec` sleep loops, `yieldMs` delay tricks, या repeated `process`
  polling के बजाय
- `exec` / `process` का उपयोग केवल उन commands के लिए करें जो अभी start होती हैं और background में
  running रहती हैं
- जब automatic completion wake enabled हो, command को एक बार start करें और
  output emit होने या fail होने पर push-based wake path पर rely करें
- जब किसी running command को inspect करने की जरूरत हो, logs, status, input, या intervention के लिए
  `process` का उपयोग करें
- यदि task बड़ा है, तो `sessions_spawn` prefer करें; sub-agent completion
  push-based है और requester को auto-announces back करता है
- completion का wait करने के लिए `subagents list` / `sessions_list` को loop में poll न करें

`agents.defaults.subagents.delegationMode` इस guidance को मजबूत कर सकता है। default
`suggest` mode baseline nudge रखता है। `prefer` एक dedicated
**Sub-Agent Delegation** section जोड़ता है, जो main agent को responsive
coordinator की तरह act करने और direct reply से ज्यादा involved किसी भी चीज को
`sessions_spawn` के माध्यम से push करने को कहता है। यह केवल prompt-only है; tool policy अब भी control करती है कि
`sessions_spawn` उपलब्ध है या नहीं।

जब experimental `update_plan` tool enabled हो, Tooling model को यह भी बताता है कि
इसे केवल non-trivial multi-step work के लिए उपयोग करें, ठीक एक
`in_progress` step रखें, और हर update के बाद पूरा plan repeat करने से बचें।

system prompt में Safety guardrails advisory हैं। वे model behavior को guide करते हैं लेकिन policy enforce नहीं करते। hard enforcement के लिए tool policy, exec approvals, sandboxing, और channel allowlists का उपयोग करें; operators इन्हें design के अनुसार disable कर सकते हैं।

native approval cards/buttons वाले channels पर, runtime prompt अब
agent को पहले उस native approval UI पर rely करने को कहता है। इसे manual
`/approve` command केवल तब शामिल करनी चाहिए जब tool result कहे कि chat approvals unavailable हैं या
manual approval ही एकमात्र path है।

## प्रॉम्प्ट modes

OpenClaw sub-agents के लिए छोटे system prompts render कर सकता है। runtime हर run के लिए
`promptMode` set करता है (user-facing config नहीं):

- `full` (default): ऊपर के सभी sections शामिल करता है।
- `minimal`: sub-agents के लिए उपयोग होता है; **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Assistant Output Directives**,
  **Messaging**, **Silent Replies**, और **Heartbeats** छोड़ देता है। Tooling, **Safety**,
  **Skills** जब supplied हों, Workspace, Sandbox, Current Date & Time (जब
  known हो), Runtime, और injected context उपलब्ध रहते हैं।
- `none`: केवल base identity line लौटाता है।

जब `promptMode=minimal` हो, extra injected prompts को **Group Chat Context** के बजाय **Subagent
Context** label किया जाता है।

channel auto-reply runs के लिए, OpenClaw generic **Silent Replies**
section को छोड़ देता है जब direct, group, या message-tool-only context visible-reply
contract own करता है। केवल old automatic group/channel mode को `NO_REPLY` दिखाना चाहिए; direct
chats और message-tool-only replies को silent-token guidance नहीं मिलती।

## प्रॉम्प्ट snapshots

OpenClaw Codex runtime happy path के लिए committed prompt snapshots
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` के अंतर्गत रखता है। वे
selected app-server thread/turn params और Telegram direct, Discord group, और heartbeat turns के लिए
reconstructed model-bound prompt layer stack render करते हैं। उस stack में
Codex के model catalog/cache shape से generated pinned Codex `gpt-5.5` model prompt fixture,
Codex happy-path permission developer text,
OpenClaw developer instructions, turn-scoped collaboration-mode instructions
जब OpenClaw उन्हें provide करता है, user turn input, और dynamic tool
specs के references शामिल हैं।

pinned Codex model prompt fixture को
`pnpm prompt:snapshots:sync-codex-model` के साथ refresh करें। default रूप से, script
Codex के runtime cache को `$CODEX_HOME/models_cache.json`, फिर
`~/.codex/models_cache.json`, और उसके बाद ही maintainer Codex
checkout convention `~/code/codex/codex-rs/models-manager/models.json` पर खोजता है। यदि
इनमें से कोई source मौजूद नहीं है, command committed
fixture बदले बिना exit करता है। किसी specific `models_cache.json`
या `models.json` file से refresh करने के लिए `--catalog <path>` pass करें।

ये snapshots अभी भी byte-for-byte raw OpenAI request capture नहीं हैं। OpenClaw द्वारा
thread और turn params भेजने के बाद Codex runtime के अंदर Codex
`AGENTS.md`, environment context, memories, app/plugin instructions, और built-in Default
collaboration-mode instructions जैसे runtime-owned workspace context जोड़ सकता है।

उन्हें `pnpm prompt:snapshots:gen` के साथ regenerate करें और drift को
`pnpm prompt:snapshots:check` के साथ verify करें। CI additional
boundary shard में drift check चलाता है ताकि prompt changes और snapshot updates उसी
PR से attached रहें।

## Workspace bootstrap injection

Bootstrap files active workspace से resolve होती हैं, फिर उनके lifetime से match करने वाली
prompt surface पर route होती हैं:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (केवल brand-new workspaces पर)
- `MEMORY.md` जब present हो

native Codex harness पर, OpenClaw हर user turn में stable workspace files
repeat करने से बचता है। Codex `AGENTS.md` को अपनी project-doc
discovery के माध्यम से load करता है। `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, और `USER.md` को
Codex developer instructions के रूप में forward किया जाता है। compact OpenClaw skills list भी
turn-scoped collaboration developer instructions के रूप में forward की जाती है। `HEARTBEAT.md` content
inject नहीं होता; heartbeat turns को file की ओर इशारा करता collaboration-mode note मिलता है
जब वह मौजूद हो और non-empty हो। configured agent
workspace से `MEMORY.md` content हर native Codex turn में paste नहीं किया जाता; जब memory tools
उस workspace के लिए available हों, Codex turns को turn-scoped collaboration developer instructions में
एक छोटा workspace-memory note मिलता है और durable memory relevant होने पर `memory_search`
या `memory_get` का उपयोग करना चाहिए। यदि tools disabled हों, memory
search unavailable हो, या active workspace agent memory
workspace से अलग हो, तो `MEMORY.md` normal bounded turn-context path पर fallback करता है। Active
`BOOTSTRAP.md` content अभी के लिए normal turn-context role रखता है।

non-Codex harnesses पर, bootstrap files अपने existing gates के अनुसार
OpenClaw prompt में compose होती रहती हैं। `HEARTBEAT.md` normal runs पर तब omit होता है
जब default agent के लिए heartbeats disabled हों या
`agents.defaults.heartbeat.includeSystemPromptSection` false हो। injected
files concise रखें, खासकर non-Codex `MEMORY.md`। `MEMORY.md` को
curated long-term summary बने रहने के लिए intended है; detailed daily notes `memory/*.md` में belong करते हैं जहाँ
`memory_search` और `memory_get` उन्हें demand पर retrieve कर सकते हैं। Oversized
non-Codex `MEMORY.md` files prompt usage बढ़ाती हैं और नीचे दिए गए bootstrap file limits के कारण
partially injected हो सकती हैं।

<Note>
`memory/*.md` daily files normal bootstrap Project Context का हिस्सा **नहीं** हैं। ordinary turns पर वे `memory_search` और `memory_get` tools के माध्यम से demand पर access की जाती हैं, इसलिए वे context window में count नहीं होतीं जब तक model उन्हें explicitly read न करे। Bare `/new` और `/reset` turns exception हैं: runtime उस first turn के लिए recent daily memory को one-shot startup-context block के रूप में prepend कर सकता है।
</Note>

बड़ी फ़ाइलें एक मार्कर के साथ काट दी जाती हैं। प्रति-फ़ाइल अधिकतम आकार
`agents.defaults.bootstrapMaxChars` (डिफ़ॉल्ट: 20000) द्वारा नियंत्रित होता है। फ़ाइलों में कुल injected bootstrap
सामग्री `agents.defaults.bootstrapTotalMaxChars`
(डिफ़ॉल्ट: 60000) तक सीमित है। गुम फ़ाइलें एक छोटा missing-file marker inject करती हैं। जब truncation
होता है, OpenClaw एक संक्षिप्त system-prompt चेतावनी सूचना inject कर सकता है; इसे
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
डिफ़ॉल्ट: `always`) से नियंत्रित करें। विस्तृत raw/injected counts diagnostics जैसे
`/context`, `/status`, doctor, और logs में रहते हैं।

memory फ़ाइलों के लिए, truncation डेटा हानि नहीं है: फ़ाइल डिस्क पर सही-सलामत रहती है।
native Codex पर, `MEMORY.md` उपलब्ध होने पर memory tools के माध्यम से on demand पढ़ी जाती है, और जब tools नहीं चल सकते तब bounded prompt fallback होता है। अन्य
harnesses पर, model केवल छोटी की गई injected copy देखता है, जब तक वह memory को सीधे पढ़ता या
खोजता नहीं। यदि `MEMORY.md` वहाँ बार-बार truncate हो रही है, तो उसे
एक छोटे durable summary में distill करें और detailed history को `memory/*.md` में ले जाएँ,
या जानबूझकर bootstrap limits बढ़ाएँ।

Sub-agent sessions केवल `AGENTS.md` और `TOOLS.md` inject करते हैं (अन्य bootstrap files
sub-agent context छोटा रखने के लिए filter out की जाती हैं)।

Internal hooks इस चरण को `agent:bootstrap` के माध्यम से intercept करके injected bootstrap files को mutate या replace कर सकते हैं (उदाहरण के लिए `SOUL.md` को किसी alternate persona से swap करना)।

यदि आप agent को कम generic sounding बनाना चाहते हैं, तो
[SOUL.md Personality Guide](/hi/concepts/soul) से शुरू करें।

यह देखने के लिए कि प्रत्येक injected file कितना योगदान देती है (raw बनाम injected, truncation, और tool schema overhead), `/context list` या `/context detail` का उपयोग करें। [Context](/hi/concepts/context) देखें।

## समय प्रबंधन

जब user timezone ज्ञात हो, system prompt में एक समर्पित **Current Date & Time** अनुभाग शामिल होता है। prompt cache-stable रखने के लिए, अब इसमें केवल
**time zone** शामिल होता है (कोई dynamic clock या time format नहीं)।

जब agent को current time चाहिए, `session_status` का उपयोग करें; status card में
timestamp line शामिल होती है। वही tool वैकल्पिक रूप से per-session model
override set कर सकता है (`model=default` इसे clear करता है)।

इसके साथ configure करें:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

पूर्ण behavior details के लिए [Date & Time](/hi/date-time) देखें।

## Skills

जब eligible skills मौजूद हों, OpenClaw एक compact **available skills list**
(`formatSkillsForPrompt`) inject करता है, जिसमें प्रत्येक skill के लिए **file path** और content-derived
`<version>` marker शामिल होता है। prompt model को listed location (workspace, managed, या bundled) पर SKILL.md load करने के लिए `read`
का उपयोग करने का निर्देश देता है, और जब उसका `<version>` पिछले turn से अलग हो तो skill को फिर से पढ़ने के लिए कहता है। यदि कोई
skills eligible नहीं हैं, तो Skills section omitted रहती है।

Native Codex turns को यह list per-turn user input के बजाय turn-scoped collaboration developer
instructions के रूप में मिलती है, उन lightweight cron turns को छोड़कर जो
exact scheduled prompt preserve करते हैं। अन्य harnesses normal prompt
section रखते हैं।

location किसी nested skill की ओर point कर सकती है, जैसे
`skills/personal/foo/SKILL.md`। Nesting केवल organizational है; prompt फिर भी
`SKILL.md` frontmatter से flat skill name का उपयोग करता है।

Eligibility में skill metadata gates, runtime environment/config checks,
और effective agent skill allowlist शामिल होती है जब `agents.defaults.skills` या
`agents.list[].skills` configured हो।

Plugin-bundled skills केवल तब eligible होती हैं जब उनका owning plugin enabled हो।
इससे tool plugins हर tool description में सारी guidance embed किए बिना
deeper operating guides expose कर सकते हैं।

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

यह base prompt को छोटा रखता है, फिर भी targeted skill usage enable करता है।

skills list budget skills subsystem के ownership में है:

- Global default: `skills.limits.maxSkillsPromptChars`
- Per-agent override: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generic bounded runtime excerpts एक अलग surface का उपयोग करते हैं:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

यह split skills sizing को runtime read/injection sizing से अलग रखता है, जैसे
`memory_get`, live tool results, और post-compaction AGENTS.md refreshes।

## दस्तावेज़ीकरण

system prompt में एक **Documentation** section शामिल होता है। जब local docs available हों, तो यह
local OpenClaw docs directory (`docs/` Git checkout में या bundled npm
package docs) की ओर point करता है। यदि local docs unavailable हैं, तो यह
[https://docs.openclaw.ai](https://docs.openclaw.ai) पर fallback करता है।

वही section OpenClaw source location भी शामिल करता है। Git checkouts local
source root expose करते हैं ताकि agent सीधे code inspect कर सके। Package installs में GitHub
source URL शामिल होता है और agent को बताता है कि जब docs incomplete या
stale हों तो वहाँ source review करे। prompt public docs mirror, community Discord, और ClawHub
([https://clawhub.ai](https://clawhub.ai)) को skills discovery के लिए भी note करता है। यह docs को
OpenClaw self-knowledge की authority के रूप में frame करता है, इससे पहले कि model समझे कि OpenClaw कैसे काम करता है,
जिसमें memory/daily notes, sessions, tools, Gateway, config, commands, या project
context शामिल हैं। prompt model को local docs (या local docs
unavailable होने पर docs mirror) पहले उपयोग करने के लिए कहता है, और AGENTS.md, project context, workspace/profile/memory
notes, और `memory_search` को OpenClaw
design या implementation knowledge के बजाय instruction context या user memory मानने के लिए कहता है। यदि docs silent या stale हों, तो model को ऐसा कहना चाहिए
और source inspect करना चाहिए। prompt model को संभव होने पर स्वयं `openclaw status` run करने के लिए भी कहता है, और केवल access न होने पर user से पूछने के लिए कहता है।
configuration के लिए विशेष रूप से, यह agents को exact field-level docs और constraints के लिए `gateway` tool action
`config.schema.lookup` की ओर point करता है, फिर broader guidance के लिए
`docs/gateway/configuration.md` और `docs/gateway/configuration-reference.md`
की ओर।

## संबंधित

- [Agent runtime](/hi/concepts/agent)
- [Agent workspace](/hi/concepts/agent-workspace)
- [Context engine](/hi/concepts/context-engine)
