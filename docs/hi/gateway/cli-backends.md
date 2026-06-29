---
read_when:
    - जब API प्रदाता विफल हों, तो आपको एक विश्वसनीय फ़ॉलबैक चाहिए
    - आप स्थानीय AI CLI चला रहे हैं और उन्हें फिर से उपयोग करना चाहते हैं
    - आप CLI बैकएंड उपकरण पहुँच के लिए MCP लूपबैक ब्रिज को समझना चाहते हैं
summary: 'CLI बैकएंड: वैकल्पिक MCP टूल ब्रिज के साथ स्थानीय AI CLI फ़ॉलबैक'
title: CLI बैकएंड
x-i18n:
    generated_at: "2026-06-28T23:05:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw API प्रदाताओं के डाउन, rate-limited, या अस्थायी रूप से गलत व्यवहार करने पर **local AI CLIs** को **केवल-पाठ fallback** के रूप में चला सकता है। यह जानबूझकर रूढ़िवादी है:

- **OpenClaw tools सीधे inject नहीं किए जाते**, लेकिन `bundleMcp: true` वाले backends
  loopback MCP bridge के जरिए gateway tools प्राप्त कर सकते हैं।
- इसे support करने वाले CLIs के लिए **JSONL streaming**।
- **Sessions समर्थित हैं** (ताकि follow-up turns सुसंगत रहें)।
- **Images को pass through किया जा सकता है** अगर CLI image paths स्वीकार करता है।

यह primary path के बजाय **safety net** के रूप में डिजाइन किया गया है। इसका उपयोग तब करें जब आप
external APIs पर निर्भर हुए बिना "हमेशा काम करे" वाले text responses चाहते हैं।

अगर आप ACP session controls, background tasks,
thread/conversation binding, और persistent external coding sessions के साथ पूरा harness runtime चाहते हैं, तो इसके बजाय
[ACP Agents](/hi/tools/acp-agents) का उपयोग करें। CLI backends ACP नहीं हैं।

<Tip>
  नया backend plugin बना रहे हैं? 
  [CLI backend plugins](/hi/plugins/cli-backend-plugins) का उपयोग करें। यह पेज उन users के लिए है
  जो पहले से registered backend को configure और operate कर रहे हैं।
</Tip>

## शुरुआती लोगों के लिए आसान quick start

आप Claude Code CLI को **बिना किसी config** के उपयोग कर सकते हैं (bundled Anthropic plugin
default backend register करता है):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` default agent id है जब कोई explicit agent list configure नहीं की गई हो। अगर
आप multiple agents उपयोग करते हैं, तो इसे उस agent id से बदलें जिसे आप चलाना चाहते हैं।

अगर आपका gateway launchd/systemd के तहत चलता है और PATH न्यूनतम है, तो केवल
command path जोड़ें:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

बस इतना ही। CLI के अलावा कोई keys या extra auth config आवश्यक नहीं है।

अगर आप gateway host पर bundled CLI backend को **primary message provider** के रूप में उपयोग करते हैं, तो OpenClaw अब owning bundled plugin को auto-load करता है जब आपका config
model ref में या `agents.defaults.cliBackends` के तहत उस backend को explicit रूप से reference करता है।

## इसे fallback के रूप में उपयोग करना

अपनी fallback list में CLI backend जोड़ें ताकि यह केवल primary models fail होने पर चले:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

नोट्स:

- अगर आप `agents.defaults.models` (allowlist) उपयोग करते हैं, तो आपको अपने CLI backend models भी वहाँ शामिल करने होंगे।
- अगर primary provider fail होता है (auth, rate limits, timeouts), तो OpenClaw
  अगला CLI backend आजमाएगा।

## Configuration overview

सभी CLI backends यहाँ रहते हैं:

```
agents.defaults.cliBackends
```

हर entry एक **provider id** से keyed होती है (जैसे `claude-cli`, `my-cli`)।
provider id आपके model ref का बायाँ हिस्सा बनता है:

```
<provider>/<model>
```

### Example configuration

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## यह कैसे काम करता है

1. provider prefix (`claude-cli/...`) के आधार पर **backend चुनता है**।
2. उसी OpenClaw prompt + workspace context का उपयोग करके **system prompt बनाता है**।
3. session id (अगर supported हो) के साथ **CLI execute करता है** ताकि history consistent रहे।
   bundled `claude-cli` backend हर OpenClaw session के लिए Claude stdio process alive रखता है
   और follow-up turns को stream-json stdin पर भेजता है।
4. **output parse करता है** (JSON या plain text) और final text लौटाता है।
5. प्रति backend **session ids persist करता है**, ताकि follow-ups उसी CLI session को reuse करें।

<Note>
bundled Anthropic `claude-cli` backend फिर से supported है। Anthropic staff ने
हमें बताया कि OpenClaw-style Claude CLI usage फिर से allowed है, इसलिए OpenClaw इस integration के लिए
`claude -p` usage को sanctioned मानता है, जब तक Anthropic कोई नई policy publish न करे।
</Note>

bundled Anthropic `claude-cli` backend OpenClaw skills के लिए Claude Code के native skill
resolver को prefer करता है। जब current skills snapshot में materialized path वाला कम से कम
एक selected skill शामिल हो, OpenClaw `--plugin-dir` के साथ temporary Claude
Code plugin pass करता है और appended system prompt से duplicate OpenClaw skills catalog
हटा देता है। अगर snapshot में कोई materialized plugin
skill नहीं है, तो OpenClaw prompt catalog को fallback के रूप में रखता है। Skill env/API key
overrides अभी भी run के लिए child process environment में OpenClaw द्वारा apply किए जाते हैं।

Claude CLI का अपना noninteractive permission mode भी है। OpenClaw Claude-specific policy config जोड़ने के बजाय
इसे existing exec policy से map करता है।
OpenClaw-managed Claude live sessions के लिए, effective OpenClaw exec policy
authoritative है: YOLO (`tools.exec.security: "full"` और
`tools.exec.ask: "off"`) Claude को
`--permission-mode bypassPermissions` के साथ launch करता है, जबकि restrictive effective exec policy
Claude को `--permission-mode default` के साथ launch करती है। Per-agent
`agents.list[].tools.exec` settings उस
agent के लिए global `tools.exec` को override करती हैं। Raw Claude backend args में अभी भी `--permission-mode` शामिल हो सकता है, लेकिन live
Claude launches उस flag को effective OpenClaw exec policy से match करने के लिए normalize करते हैं।

bundled Anthropic `claude-cli` backend OpenClaw `/think` levels को
non-off levels के लिए Claude Code के native `--effort` flag से भी map करता है। `minimal` और
`low` `low` पर map होते हैं, `adaptive` और `medium` `medium` पर map होते हैं, और `high`,
`xhigh`, और `max` सीधे map होते हैं। अन्य CLI backends को `/think` spawned CLI को affect कर सके उससे पहले
अपने owning plugin से equivalent argv mapper declare कराना होगा।

OpenClaw bundled `claude-cli` backend उपयोग कर सके उससे पहले, Claude Code स्वयं
उसी host पर पहले से logged in होना चाहिए:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker installs में Claude Code persisted
container home के अंदर installed और logged in होना चाहिए, केवल host पर नहीं। देखें
[Docker में Claude CLI backend](/hi/install/docker#claude-cli-backend-in-docker)।

`agents.defaults.cliBackends.claude-cli.command` का उपयोग केवल तब करें जब `claude`
binary पहले से `PATH` पर न हो।

## Sessions

- अगर CLI sessions support करता है, तो `sessionArg` (जैसे `--session-id`) या
  `sessionArgs` (placeholder `{sessionId}`) set करें जब ID को multiple flags में insert करना हो।
- अगर CLI अलग flags के साथ **resume subcommand** उपयोग करता है, तो
  `resumeArgs` (resuming के समय `args` को replace करता है) और वैकल्पिक रूप से `resumeOutput`
  (non-JSON resumes के लिए) set करें।
- `sessionMode`:
  - `always`: हमेशा session id भेजें (अगर कोई stored न हो तो नया UUID)।
  - `existing`: session id केवल तभी भेजें जब पहले से कोई stored हो।
  - `none`: कभी session id न भेजें।
- `claude-cli` defaults `liveSession: "claude-stdio"`, `output: "jsonl"`,
  और `input: "stdin"` पर हैं, ताकि follow-up turns active रहते समय live Claude process को reuse करें।
  Warm stdio अब default है, उन custom configs के लिए भी
  जो transport fields omit करते हैं। अगर Gateway restart होता है या idle process
  exit होता है, OpenClaw stored Claude session id से resume करता है। Stored session
  ids resume से पहले existing readable project transcript के विरुद्ध verified होते हैं,
  इसलिए phantom bindings `--resume` के तहत चुपचाप fresh Claude CLI session शुरू करने के बजाय
  `reason=transcript-missing` के साथ cleared होते हैं।
- Claude live sessions bounded JSONL output guards रखते हैं। Defaults हर turn में
  8 MiB और 20,000 raw JSONL lines तक allow करते हैं। Tool-heavy Claude turns इन्हें
  प्रति backend
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  और `maxTurnLines` के साथ बढ़ा सकते हैं; OpenClaw उन settings को 64 MiB और 100,000
  lines तक clamp करता है।
- Stored CLI sessions provider-owned continuity हैं। implicit daily session
  reset उन्हें cut नहीं करता; `/reset` और explicit `session.reset` policies अभी भी
  ऐसा करते हैं।
- Fresh CLI sessions सामान्यतः केवल OpenClaw के Compaction summary
  और post-compaction tail से reseed होते हैं। Compaction से पहले invalidated
  short sessions को recover करने के लिए, backend
  `reseedFromRawTranscriptWhenUncompacted: true` के साथ opt in कर सकता है। OpenClaw फिर भी raw
  transcript reseed bounded रखता है और उसे missing
  CLI transcripts, system-prompt/MCP changes, या session-expired retry जैसी safe invalidations तक सीमित करता है; auth
  profile या credential-epoch changes कभी raw transcript history reseed नहीं करते।

Serialization notes:

- `serialize: true` same-lane runs को ordered रखता है।
- अधिकांश CLIs एक provider lane पर serialize करते हैं।
- selected auth identity बदलने पर OpenClaw stored CLI session reuse drop कर देता है,
  जिसमें changed auth profile id, static API key, static token, या CLI द्वारा expose की गई OAuth
  account identity शामिल है। OAuth access और refresh token
  rotation stored CLI session को cut नहीं करता। अगर CLI stable OAuth account id expose नहीं करता है, तो OpenClaw उस CLI को resume permissions enforce करने देता है।

## claude-cli sessions से fallback prelude

जब कोई `claude-cli` attempt
[`agents.defaults.model.fallbacks`](/hi/concepts/model-failover) में non-CLI candidate पर fail over करता है, OpenClaw अगले attempt को Claude Code के local
JSONL transcript से harvested context prelude से seed करता है, जो `~/.claude/projects/` पर होता है। इस seed के बिना, fallback
provider cold start करेगा क्योंकि OpenClaw का अपना session transcript
`claude-cli` runs के लिए empty होता है।

- prelude latest `/compact` summary या `compact_boundary`
  marker को prefer करता है, फिर char
  budget तक सबसे हाल के post-boundary turns append करता है। Pre-boundary turns drop किए जाते हैं क्योंकि summary पहले से
  उन्हें represent करता है।
- Tool blocks को compact `(tool call: name)` और
  `(tool result: …)` hints में coalesce किया जाता है ताकि prompt budget ईमानदार रहे। Overflow होने पर summary को
  `(truncated)` label किया जाता है।
- Same-provider `claude-cli` से `claude-cli` fallbacks Claude के अपने
  `--resume` पर rely करते हैं और prelude skip करते हैं।
- seed existing Claude session-file path validation reuse करता है, इसलिए
  arbitrary paths read नहीं किए जा सकते।

## Images (pass-through)

अगर आपका CLI image paths स्वीकार करता है, तो `imageArg` set करें:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 images को temp files में लिखेगा। अगर `imageArg` set है, तो वे
paths CLI args के रूप में pass किए जाते हैं। अगर `imageArg` missing है, तो OpenClaw
file paths को prompt में append करता है (path injection), जो उन CLIs के लिए पर्याप्त है जो plain paths से local files auto-
load करते हैं।

## Inputs / outputs

- `output: "json"` (default) JSON parse करने और text + session id extract करने की कोशिश करता है।
- Gemini CLI JSON output के लिए, OpenClaw reply text को `response` से और usage को
  `stats` से पढ़ता है जब `usage` missing या empty हो। bundled Gemini CLI default
  `stream-json` उपयोग करता है, लेकिन पुराने `--output-format json` overrides अभी भी
  JSON parser उपयोग करते हैं।
- `output: "jsonl"` JSONL streams parse करता है और final agent message plus session
  identifiers extract करता है जब present हों।
- `output: "text"` stdout को final response मानता है।

Input modes:

- `input: "arg"` (डिफ़ॉल्ट) प्रॉम्प्ट को अंतिम CLI arg के रूप में पास करता है।
- `input: "stdin"` प्रॉम्प्ट को stdin के ज़रिए भेजता है।
- यदि प्रॉम्प्ट बहुत लंबा है और `maxPromptArgChars` सेट है, तो stdin उपयोग किया जाता है।

## डिफ़ॉल्ट (Plugin-स्वामित्व वाले)

बंडल किए गए CLI बैकएंड डिफ़ॉल्ट उनके स्वामी Plugin के साथ रहते हैं। उदाहरण के लिए,
Anthropic `claude-cli` का स्वामी है और Google `google-gemini-cli` का स्वामी है। OpenAI Codex
एजेंट रन `openai/*` के माध्यम से Codex app-server harness का उपयोग करते हैं; OpenClaw अब
बंडल किए गए `codex-cli` बैकएंड को पंजीकृत नहीं करता।

बंडल किया गया Anthropic Plugin `claude-cli` के लिए डिफ़ॉल्ट पंजीकृत करता है:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

बंडल किया गया Google Plugin भी `google-gemini-cli` के लिए डिफ़ॉल्ट पंजीकृत करता है:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

पूर्वापेक्षा: स्थानीय Gemini CLI इंस्टॉल होना चाहिए और `PATH` पर
`gemini` के रूप में उपलब्ध होना चाहिए (`brew install gemini-cli` या
`npm install -g @google/gemini-cli`)।

Gemini CLI आउटपुट नोट्स:

- डिफ़ॉल्ट `stream-json` पार्सर सहायक `message` इवेंट, टूल इवेंट,
  अंतिम `result` उपयोग, और घातक Gemini त्रुटि इवेंट पढ़ता है।
- यदि आप Gemini args को `--output-format json` पर ओवरराइड करते हैं, तो OpenClaw उस
  बैकएंड को वापस `output: "json"` में सामान्यीकृत करता है और JSON `response`
  फ़ील्ड से उत्तर टेक्स्ट पढ़ता है।
- जब `usage` अनुपस्थित या खाली हो, तो उपयोग `stats` पर वापस जाता है।
- `stats.cached` को OpenClaw `cacheRead` में सामान्यीकृत किया जाता है।
- यदि `stats.input` गायब है, तो OpenClaw इनपुट टोकन
  `stats.input_tokens - stats.cached` से निकालता है।

केवल आवश्यकता होने पर ओवरराइड करें (सामान्य: पूर्ण `command` पथ)।

## Plugin-स्वामित्व वाले डिफ़ॉल्ट

CLI बैकएंड डिफ़ॉल्ट अब Plugin सतह का हिस्सा हैं:

- Plugins उन्हें `api.registerCliBackend(...)` के साथ पंजीकृत करते हैं।
- बैकएंड `id` मॉडल refs में provider prefix बन जाता है।
- `agents.defaults.cliBackends.<id>` में उपयोगकर्ता कॉन्फ़िगरेशन अब भी Plugin डिफ़ॉल्ट को ओवरराइड करता है।
- बैकएंड-विशिष्ट कॉन्फ़िगरेशन सफ़ाई वैकल्पिक
  `normalizeConfig` hook के माध्यम से Plugin-स्वामित्व में रहती है।

जिन Plugins को छोटे प्रॉम्प्ट/संदेश संगतता shims चाहिए, वे provider या CLI बैकएंड को बदले बिना
द्विदिश टेक्स्ट रूपांतरण घोषित कर सकते हैं:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` CLI को पास किए गए सिस्टम प्रॉम्प्ट और उपयोगकर्ता प्रॉम्प्ट को फिर से लिखता है। `output`
स्ट्रीम किए गए सहायक डेल्टा और पार्स किए गए अंतिम टेक्स्ट को OpenClaw द्वारा
अपने नियंत्रण मार्कर और चैनल डिलीवरी संभालने से पहले फिर से लिखता है।

उन CLIs के लिए जो provider-विशिष्ट JSONL इवेंट उत्सर्जित करते हैं, उस
बैकएंड के कॉन्फ़िगरेशन पर `jsonlDialect` सेट करें। समर्थित dialects Claude
Code-संगत streams के लिए `claude-stream-json` और Gemini CLI `stream-json`
इवेंट के लिए `gemini-stream-json` हैं।

## नेटिव Compaction स्वामित्व

कुछ CLI बैकएंड ऐसा एजेंट चलाते हैं जो अपनी **स्वयं की** transcript को compact करता है, इसलिए OpenClaw को
उनके विरुद्ध अपना safeguard summarizer नहीं चलाना चाहिए - ऐसा करना बैकएंड के अपने
Compaction से टकराता है और turn को hard-fail कर सकता है।

`claude-cli` के पास कोई harness endpoint नहीं है - Claude Code आंतरिक रूप से compact करता है - इसलिए यह
`ownsNativeCompaction: true` घोषित करता है, और OpenClaw compaction path से no-op लौटाता है।
Codex जैसे native-harness sessions इसके बजाय अपने harness compaction endpoint
पर route होते रहते हैं।

क्योंकि बैकएंड Compaction का स्वामी है, केवल OpenClaw के safeguard को
claude-cli session पर चलने से रोकने के लिए `contextTokens: 1_000_000` सेट करने वाला पुराना अस्थायी उपाय
**अब आवश्यक नहीं है** - opt-out उसकी जगह लेता है।

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` केवल ऐसे बैकएंड के लिए घोषित करें जो सचमुच अपने Compaction का स्वामी हो: उसे
अपने context window के निकट आते समय अपनी transcript को भरोसेमंद रूप से सीमित करना चाहिए और
resumable session persist करना चाहिए (जैसे `--resume` / `--session-id`); अन्यथा deferred session
बजट से ऊपर रह सकता है। मेल खाते `agentHarnessId` sessions अब भी harness endpoint पर route होते हैं।

## बंडल MCP ओवरले

CLI बैकएंड OpenClaw tool calls सीधे प्राप्त **नहीं** करते, लेकिन कोई बैकएंड
`bundleMcp: true` के साथ generate किए गए MCP config overlay में opt in कर सकता है।

वर्तमान बंडल व्यवहार:

- `claude-cli`: generate की गई strict MCP config file
- `google-gemini-cli`: generate की गई Gemini system settings file

जब bundle MCP सक्षम होता है, OpenClaw:

- एक loopback HTTP MCP server spawn करता है जो gateway tools को CLI process के सामने expose करता है
- per-session token (`OPENCLAW_MCP_TOKEN`) के साथ bridge को authenticate करता है
- tool access को वर्तमान session, account, और channel context तक scope करता है
- वर्तमान workspace के लिए enabled bundle-MCP servers load करता है
- उन्हें किसी भी मौजूदा बैकएंड MCP config/settings shape के साथ merge करता है
- owning extension से बैकएंड-स्वामित्व वाले integration mode का उपयोग करके launch config को फिर से लिखता है

यदि कोई MCP server enabled नहीं है, तो OpenClaw तब भी strict config inject करता है जब कोई
बैकएंड bundle MCP में opt in करता है ताकि background runs isolated रहें।

Session-scoped bundled MCP runtimes को session के भीतर reuse के लिए cache किया जाता है, फिर
idle time के `mcp.sessionIdleTtlMs` milliseconds के बाद reap किया जाता है (डिफ़ॉल्ट 10
मिनट; disable करने के लिए `0` सेट करें)। Auth probes,
slug generation, और active-memory recall जैसे one-shot embedded runs run end पर cleanup request करते हैं ताकि stdio
children और Streamable HTTP/SSE streams run से अधिक समय तक जीवित न रहें।

## Reseed history cap

जब किसी नए CLI session को पूर्व OpenClaw transcript से seed किया जाता है (उदाहरण के लिए
`session_expired` retry के बाद), rendered
`<conversation_history>` block को cap किया जाता है ताकि reseed prompts
बहुत बड़े न हो जाएँ। डिफ़ॉल्ट `12288` अक्षर है (लगभग 3000 tokens)।

Claude CLI बैकएंड resolved
Claude context tier से निकले बड़े cap का अपने-आप उपयोग करते हैं। Standard 200K-token Claude runs बड़ा transcript
slice रखते हैं, और 1M-token Claude runs उससे भी बड़ा slice रखते हैं, जबकि अन्य CLI
बैकएंड conservative default रखते हैं।

- cap केवल reseed prompt के prior-history block को नियंत्रित करता है। Live-session
  output limits को `reliability.outputLimits` के अंतर्गत अलग से tune किया जाता है
  ([Sessions](#sessions) देखें)।

## सीमाएँ

- **कोई direct OpenClaw tool calls नहीं।** OpenClaw
  CLI बैकएंड protocol में tool calls inject नहीं करता। बैकएंड केवल gateway tools देखते हैं जब वे
  `bundleMcp: true` में opt in करते हैं।
- **Streaming बैकएंड-विशिष्ट है।** कुछ बैकएंड JSONL stream करते हैं; अन्य exit तक
  buffer करते हैं।
- **Structured outputs** CLI के JSON format पर निर्भर करते हैं।

## समस्या निवारण

- **CLI नहीं मिला**: `command` को पूर्ण path पर सेट करें।
- **गलत model name**: `provider/model` → CLI model को map करने के लिए `modelAliases` का उपयोग करें।
- **कोई session continuity नहीं**: सुनिश्चित करें कि `sessionArg` सेट है और `sessionMode`
  `none` नहीं है।
- **Images ignored**: `imageArg` सेट करें (और सत्यापित करें कि CLI file paths को support करता है)।

## संबंधित

- [Gateway runbook](/hi/gateway)
- [Local models](/hi/gateway/local-models)
