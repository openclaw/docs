---
read_when:
    - '`tools.*` नीति, अनुमत-सूचियाँ, या प्रायोगिक सुविधाएँ कॉन्फ़िगर करना'
    - कस्टम प्रदाताओं को पंजीकृत करना या आधार URLs को ओवरराइड करना
    - OpenAI-संगत self-hosted endpoints सेट अप करना
sidebarTitle: Tools and custom providers
summary: टूल्स कॉन्फ़िगरेशन (नीति, प्रायोगिक टॉगल, provider-backed टूल्स) और कस्टम provider/base-URL सेटअप
title: कॉन्फ़िगरेशन — टूल और कस्टम प्रदाता
x-i18n:
    generated_at: "2026-06-28T23:06:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` कॉन्फ़िगरेशन keys और कस्टम provider / base-URL सेटअप। agents, channels, और अन्य शीर्ष-स्तरीय कॉन्फ़िगरेशन keys के लिए, [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## टूल

### टूल प्रोफ़ाइल

`tools.profile`, `tools.allow`/`tools.deny` से पहले एक आधार allowlist सेट करता है:

<Note>
स्थानीय onboarding, unset होने पर नए स्थानीय configs को डिफ़ॉल्ट रूप से `tools.profile: "coding"` पर सेट करता है (मौजूदा explicit profiles संरक्षित रखे जाते हैं)।
</Note>

| प्रोफ़ाइल    | शामिल हैं                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | केवल `session_status`                                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | कोई प्रतिबंध नहीं (unset जैसा ही)                                                                                                                    |

### टूल समूह

| समूह              | टूल                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` को `exec` के alias के रूप में स्वीकार किया जाता है)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | सभी built-in टूल (provider Plugins को छोड़कर)                                                                          |
| `group:plugins`    | loaded Plugins के स्वामित्व वाले टूल, जिनमें `bundle-mcp` के माध्यम से उजागर configured MCP servers शामिल हैं                            |

### sandbox tool policy के अंदर MCP और Plugin टूल

Configured MCP servers को `bundle-mcp` Plugin id के तहत Plugin-स्वामित्व वाले टूल के रूप में उजागर किया जाता है। सामान्य टूल प्रोफ़ाइल उन्हें allow कर सकती हैं, लेकिन sandboxed sessions के लिए `tools.sandbox.tools` एक अतिरिक्त gate है। यदि sandbox mode `"all"` या `"non-main"` है, तो MCP/Plugin टूल दिखने चाहिए होने पर sandbox tool allowlist में इनमें से कोई एक entry शामिल करें:

- `mcp.servers` से OpenClaw-प्रबंधित MCP servers के लिए `bundle-mcp`
- किसी विशिष्ट native Plugin के लिए Plugin id
- सभी loaded Plugin-स्वामित्व वाले टूल के लिए `group:plugins`
- exact MCP server tool names या server globs जैसे `outlook__send_mail` या `outlook__*`, जब आप केवल एक server चाहते हों

Server globs provider-safe MCP server prefix का उपयोग करते हैं, जरूरी नहीं कि raw `mcp.servers` key का। Non-`[A-Za-z0-9_-]` characters `-` बन जाते हैं, जिन names की शुरुआत letter से नहीं होती उन्हें `mcp-` prefix मिलता है, और लंबे या duplicate prefixes truncate या suffix किए जा सकते हैं; उदाहरण के लिए, `mcp.servers["Outlook Graph"]` `outlook-graph__*` जैसा glob उपयोग करता है।

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

उस sandbox-layer entry के बिना, MCP server अभी भी सफलतापूर्वक load हो सकता है जबकि उसके टूल provider request से पहले filtered हो जाते हैं। `mcp.servers` में OpenClaw-प्रबंधित servers के लिए इस shape को पकड़ने के लिए `openclaw doctor` का उपयोग करें। bundled Plugin manifests या Claude `.mcp.json` से loaded MCP servers भी वही sandbox gate उपयोग करते हैं, लेकिन यह diagnostic अभी उन sources को enumerate नहीं करता; यदि sandboxed turns में उनके टूल गायब हो जाएं तो वही allowlist entries उपयोग करें।

### `tools.codeMode`

`tools.codeMode` सामान्य OpenClaw code-mode surface सक्षम करता है। जब tools वाले run के लिए सक्षम किया जाता है, model को केवल `exec` और `wait` दिखते हैं; सामान्य OpenClaw टूल in-sandbox `tools.*` catalog bridge के पीछे चले जाते हैं, और MCP टूल generated `MCP` namespace के माध्यम से उपलब्ध होते हैं।

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

shorthand भी स्वीकार किया जाता है:

```json5
{
  tools: { codeMode: true },
}
```

MCP declarations को code mode में read-only virtual API file surface के माध्यम से उजागर किया जाता है। Guest code, `MCP.<server>.<tool>()` call करने से पहले TypeScript-style signatures inspect करने के लिए `API.list("mcp")` और `API.read("mcp/<server>.d.ts")` call कर सकता है। runtime contract, limits, और debugging steps के लिए [Code mode](/hi/reference/code-mode) देखें।

### `tools.allow` / `tools.deny`

Global tool allow/deny policy (deny wins)। Case-insensitive, `*` wildcards का समर्थन करती है। Docker sandbox off होने पर भी लागू होती है।

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` और `apply_patch` अलग tool ids हैं। `allow: ["write"]` compatible models के लिए `apply_patch` भी सक्षम करता है, लेकिन `deny: ["write"]`, `apply_patch` को deny नहीं करता। सभी file mutation block करने के लिए, `group:fs` deny करें या प्रत्येक mutating tool को स्पष्ट रूप से list करें:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

विशिष्ट providers या models के लिए टूल को और restrict करता है। क्रम: base profile → provider profile → allow/deny।

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

किसी विशिष्ट requester identity के लिए टूल restrict करता है। यह channel access control के ऊपर defense-in-depth है; sender values channel adapter से आने चाहिए, message text से नहीं।

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Keys explicit prefixes उपयोग करती हैं: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, या `"*"`। Channel ids canonical OpenClaw ids हैं; `teams` जैसे aliases `msteams` में normalize होते हैं। Legacy unprefixed keys केवल `id:` के रूप में स्वीकार की जाती हैं। Matching order है channel+id, id, e164, username, name, फिर wildcard।

Per-agent `agents.list[].tools.toolsBySender`, match होने पर global sender match को override करता है, खाली `{}` policy के साथ भी।

### `tools.elevated`

sandbox के बाहर elevated exec access नियंत्रित करता है:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Per-agent override (`agents.list[].tools.elevated`) केवल और restrict कर सकता है।
- `/elevated on|off|ask|full` प्रति session state store करता है; inline directives single message पर लागू होते हैं।
- Elevated `exec` sandboxing bypass करता है और configured escape path का उपयोग करता है (डिफ़ॉल्ट रूप से `gateway`, या exec target `node` होने पर `node`)।

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Tool-loop safety checks **डिफ़ॉल्ट रूप से disabled** हैं। detection activate करने के लिए `enabled: true` set करें। Settings को globally `tools.loopDetection` में define किया जा सकता है और per-agent `agents.list[].tools.loopDetection` पर override किया जा सकता है।

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  loop analysis के लिए retained अधिकतम tool-call history।
</ParamField>
<ParamField path="warningThreshold" type="number">
  warnings के लिए repeating no-progress pattern threshold।
</ParamField>
<ParamField path="criticalThreshold" type="number">
  critical loops block करने के लिए उच्चतर repeating threshold।
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  किसी भी no-progress run के लिए hard stop threshold।
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  repeated same-tool/same-args calls पर warn करें।
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  ज्ञात poll tools (`process.poll`, `command_status`, आदि) पर warn/block करें।
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  alternating no-progress pair patterns पर warn/block करें।
</ParamField>

<Warning>
यदि `warningThreshold >= criticalThreshold` या `criticalThreshold >= globalCircuitBreakerThreshold`, validation fail होता है।
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

inbound media understanding (image/audio/video) configure करता है:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // अप्रचलित: completions एजेंट-मध्यस्थित रहते हैं
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="मीडिया मॉडल एंट्री फ़ील्ड">
    **प्रदाता एंट्री** (`type: "provider"` या छोड़ा गया):

    - `provider`: API प्रदाता id (`openai`, `anthropic`, `google`/`gemini`, `groq`, आदि)
    - `model`: मॉडल id ओवरराइड
    - `profile` / `preferredProfile`: `auth-profiles.json` प्रोफ़ाइल चयन

    **CLI एंट्री** (`type: "cli"`):

    - `command`: चलाने योग्य executable
    - `args`: templated args (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, आदि का समर्थन करता है; `openclaw doctor --fix` अप्रचलित `{input}` placeholders को `{{MediaPath}}` में माइग्रेट करता है)

    **सामान्य फ़ील्ड:**

    - `capabilities`: वैकल्पिक सूची (`image`, `audio`, `video`). डिफ़ॉल्ट: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: प्रति-एंट्री ओवरराइड.
    - `tools.media.image.timeoutSeconds` और मिलती-जुलती image मॉडल `timeoutSeconds` एंट्रियां तब भी लागू होती हैं जब एजेंट स्पष्ट `image` टूल को कॉल करता है. इमेज समझने के लिए, यह timeout अनुरोध पर ही लागू होता है और पहले की तैयारी के काम से कम नहीं किया जाता.
    - विफलताएं अगली एंट्री पर fallback करती हैं.

    प्रदाता auth मानक क्रम का पालन करता है: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

    **Async completion फ़ील्ड:**

    - `asyncCompletion.directSend`: अप्रचलित compatibility flag. पूर्ण async मीडिया कार्य requester-session मध्यस्थित रहते हैं ताकि एजेंट परिणाम प्राप्त करे, तय करे कि उपयोगकर्ता को कैसे बताना है, और स्रोत delivery की आवश्यकता होने पर message tool का उपयोग करे.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

नियंत्रित करता है कि session tools (`sessions_list`, `sessions_history`, `sessions_send`) द्वारा किन sessions को target किया जा सकता है.

डिफ़ॉल्ट: `tree` (वर्तमान session + इससे spawned sessions, जैसे subagents).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="दृश्यता scopes">
    - `self`: केवल वर्तमान session key.
    - `tree`: वर्तमान session + वर्तमान session द्वारा spawned sessions (subagents).
    - `agent`: वर्तमान agent id से संबंधित कोई भी session (यदि आप एक ही agent id के तहत per-sender sessions चलाते हैं तो अन्य उपयोगकर्ता शामिल हो सकते हैं).
    - `all`: कोई भी session. Cross-agent targeting के लिए अभी भी `tools.agentToAgent` आवश्यक है.
    - Sandbox clamp: जब वर्तमान session sandboxed हो और `agents.defaults.sandbox.sessionToolsVisibility="spawned"` हो, तो visibility को `tree` पर बाध्य किया जाता है, भले ही `tools.sessions.visibility="all"` हो.
    - जब `all` नहीं होता, `sessions_list` एक compact `visibility` फ़ील्ड शामिल करता है
      जो effective mode का वर्णन करता है और चेतावनी देता है कि कुछ sessions वर्तमान scope के बाहर
      छोड़े जा सकते हैं.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn` के लिए inline attachment समर्थन नियंत्रित करता है.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: inline file attachments की अनुमति देने के लिए true सेट करें
        maxTotalBytes: 5242880, // सभी files में कुल 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // प्रति file 1 MB
        retainOnSessionKeep: false, // cleanup="keep" होने पर attachments रखें
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment नोट्स">
    - Attachments के लिए `enabled: true` आवश्यक है.
    - Subagent attachments को child workspace में `.openclaw/attachments/<uuid>/` पर `.manifest.json` के साथ materialize किया जाता है.
    - ACP attachments केवल image-only होते हैं और समान file count, per-file byte, और total byte limits pass होने के बाद ACP runtime को inline forward किए जाते हैं.
    - Attachment content को transcript persistence से स्वचालित रूप से redact किया जाता है.
    - Base64 inputs को strict alphabet/padding checks और pre-decode size guard के साथ validate किया जाता है.
    - Subagent attachment file permissions directories के लिए `0700` और files के लिए `0600` हैं.
    - Subagent cleanup `cleanup` policy का पालन करता है: `delete` हमेशा attachments हटाता है; `keep` उन्हें केवल तब retain करता है जब `retainOnSessionKeep: true` हो.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimental built-in tool flags. डिफ़ॉल्ट रूप से off, जब तक strict-agentic GPT-5 auto-enable rule लागू न हो.

```json5
{
  tools: {
    experimental: {
      planTool: true, // experimental update_plan सक्षम करें
    },
  },
}
```

- `planTool`: non-trivial multi-step work tracking के लिए structured `update_plan` tool सक्षम करता है.
- डिफ़ॉल्ट: `false` जब तक `agents.defaults.embeddedAgent.executionContract` (या per-agent override) OpenAI या OpenAI Codex GPT-5-family run के लिए `"strict-agentic"` पर सेट न हो. उस scope से बाहर tool को force on करने के लिए `true` सेट करें, या strict-agentic GPT-5 runs के लिए भी इसे off रखने के लिए `false` सेट करें.
- सक्षम होने पर, system prompt usage guidance भी जोड़ता है ताकि model इसे केवल substantial work के लिए उपयोग करे और अधिकतम एक step `in_progress` रखे.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: spawned sub-agents के लिए डिफ़ॉल्ट model. यदि छोड़ा गया है, तो sub-agents caller के model को inherit करते हैं.
- `allowAgents`: `sessions_spawn` के लिए configured target agent ids की डिफ़ॉल्ट allowlist, जब requester agent अपना `subagents.allowAgents` सेट नहीं करता (`["*"]` = कोई भी configured target; डिफ़ॉल्ट: केवल वही agent). जिन stale entries का agent config delete हो चुका है, उन्हें `sessions_spawn` reject करता है और `agents_list` से omit करता है; उन्हें clean up करने के लिए `openclaw doctor --fix` चलाएं.
- `runTimeoutSeconds`: `sessions_spawn` के लिए डिफ़ॉल्ट timeout (seconds). `0` का अर्थ है कोई timeout नहीं.
- `announceTimeoutMs`: Gateway `agent` announce delivery attempts के लिए per-call timeout (milliseconds). डिफ़ॉल्ट: `120000`. Transient retries कुल announce wait को एक configured timeout से लंबा बना सकते हैं.
- Per-subagent tool policy: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Custom providers और base URLs

Provider plugins अपने model catalog rows प्रकाशित करते हैं. Custom providers को config में `models.providers` के ज़रिए या `~/.openclaw/agents/<agentId>/agent/models.json` में जोड़ें.

Custom/local provider `baseUrl` configure करना model HTTP requests के लिए narrow network trust decision भी है: OpenClaw उसी exact `scheme://host:port` origin को guarded fetch path से allow करता है, बिना अलग config option जोड़ने या अन्य private origins पर trust किए.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Auth और merge precedence">
    - Custom auth ज़रूरतों के लिए `authHeader: true` + `headers` का उपयोग करें.
    - Agent config root को `OPENCLAW_AGENT_DIR` से override करें.
    - Matching provider IDs के लिए merge precedence:
      - Non-empty agent `models.json` `baseUrl` values जीतती हैं.
      - Non-empty agent `apiKey` values केवल तब जीतती हैं जब वह provider वर्तमान config/auth-profile context में SecretRef-managed नहीं है.
      - SecretRef-managed provider `apiKey` values resolved secrets persist करने के बजाय source markers (env refs के लिए `ENV_VAR_NAME`, file/exec refs के लिए `secretref-managed`) से refresh की जाती हैं.
      - SecretRef-managed provider header values source markers (env refs के लिए `secretref-env:ENV_VAR_NAME`, file/exec refs के लिए `secretref-managed`) से refresh की जाती हैं.
      - Empty या missing agent `apiKey`/`baseUrl` config में `models.providers` पर fall back करते हैं.
      - Matching model `contextWindow`/`maxTokens` explicit config और implicit catalog values के बीच higher value का उपयोग करते हैं.
      - Matching model `contextTokens` मौजूद होने पर explicit runtime cap को preserve करता है; native model metadata बदले बिना effective context limit करने के लिए इसका उपयोग करें.
      - Provider-plugin catalogs agent के plugin state के तहत generated plugin-owned catalog shards के रूप में stored होते हैं.
      - जब आप चाहते हैं कि config `models.json` और active plugin catalog shards को पूरी तरह rewrite करे, तो `models.mode: "replace"` का उपयोग करें.
      - Marker persistence source-authoritative है: markers active source config snapshot (pre-resolution) से लिखे जाते हैं, resolved runtime secret values से नहीं.

  </Accordion>
</AccordionGroup>

### Provider field details

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: provider catalog behavior (`merge` या `replace`).
    - `models.providers`: provider id से keyed custom provider map.
      - Safe edits: additive updates के लिए `openclaw config set models.providers.<id> '<json>' --strict-json --merge` या `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` का उपयोग करें. `config set` destructive replacements से इनकार करता है, जब तक आप `--replace` pass नहीं करते.

  </Accordion>
  <Accordion title="प्रदाता कनेक्शन और प्रमाणीकरण">
    - `models.providers.*.api`: अनुरोध अडैप्टर (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, आदि)। MLX, vLLM, SGLang, और अधिकांश OpenAI-संगत स्थानीय सर्वर जैसे स्वयं-होस्ट किए गए `/v1/chat/completions` बैकएंड के लिए, `openai-completions` का उपयोग करें। `baseUrl` वाला लेकिन `api` के बिना कस्टम प्रदाता डिफ़ॉल्ट रूप से `openai-completions` का उपयोग करता है; `openai-responses` केवल तब सेट करें जब बैकएंड `/v1/responses` का समर्थन करता हो।
    - `models.providers.*.apiKey`: प्रदाता क्रेडेंशियल (SecretRef/env प्रतिस्थापन को प्राथमिकता दें)।
    - `models.providers.*.auth`: प्रमाणीकरण रणनीति (`api-key`, `token`, `oauth`, `aws-sdk`)।
    - `models.providers.*.contextWindow`: इस प्रदाता के अंतर्गत मॉडलों के लिए डिफ़ॉल्ट नेटिव संदर्भ विंडो, जब मॉडल प्रविष्टि `contextWindow` सेट नहीं करती।
    - `models.providers.*.contextTokens`: इस प्रदाता के अंतर्गत मॉडलों के लिए डिफ़ॉल्ट प्रभावी रनटाइम संदर्भ सीमा, जब मॉडल प्रविष्टि `contextTokens` सेट नहीं करती।
    - `models.providers.*.maxTokens`: इस प्रदाता के अंतर्गत मॉडलों के लिए डिफ़ॉल्ट आउटपुट-टोकन सीमा, जब मॉडल प्रविष्टि `maxTokens` सेट नहीं करती।
    - `models.providers.*.timeoutSeconds`: वैकल्पिक प्रति-प्रदाता मॉडल HTTP अनुरोध टाइमआउट सेकंड में, जिसमें कनेक्ट, हेडर, बॉडी, और कुल अनुरोध निरस्त प्रबंधन शामिल है।
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` के लिए, अनुरोधों में `options.num_ctx` इंजेक्ट करें (डिफ़ॉल्ट: `true`)।
    - `models.providers.*.authHeader`: आवश्यकता होने पर `Authorization` हेडर में क्रेडेंशियल ट्रांसपोर्ट को बाध्य करें।
    - `models.providers.*.baseUrl`: अपस्ट्रीम API बेस URL।
    - `models.providers.*.headers`: प्रॉक्सी/टेनेंट रूटिंग के लिए अतिरिक्त स्थिर हेडर।

  </Accordion>
  <Accordion title="अनुरोध ट्रांसपोर्ट ओवरराइड">
    `models.providers.*.request`: मॉडल-प्रदाता HTTP अनुरोधों के लिए ट्रांसपोर्ट ओवरराइड।

    - `request.headers`: अतिरिक्त हेडर (प्रदाता डिफ़ॉल्ट के साथ मर्ज किए जाते हैं)। मान SecretRef स्वीकार करते हैं।
    - `request.auth`: प्रमाणीकरण रणनीति ओवरराइड। मोड: `"provider-default"` (प्रदाता का बिल्ट-इन प्रमाणीकरण उपयोग करें), `"authorization-bearer"` (`token` के साथ), `"header"` (`headerName`, `value`, वैकल्पिक `prefix` के साथ)।
    - `request.proxy`: HTTP प्रॉक्सी ओवरराइड। मोड: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` env vars का उपयोग करें), `"explicit-proxy"` (`url` के साथ)। दोनों मोड वैकल्पिक `tls` उप-ऑब्जेक्ट स्वीकार करते हैं।
    - `request.tls`: प्रत्यक्ष कनेक्शन के लिए TLS ओवरराइड। फ़ील्ड: `ca`, `cert`, `key`, `passphrase` (सभी SecretRef स्वीकार करते हैं), `serverName`, `insecureSkipVerify`।
    - `request.allowPrivateNetwork`: जब `true` हो, तो मॉडल-प्रदाता HTTP अनुरोधों को प्रदाता HTTP fetch गार्ड के माध्यम से निजी, CGNAT, या समान रेंज तक जाने दें। कस्टम/स्थानीय प्रदाता बेस URL पहले से ही ठीक-ठीक कॉन्फ़िगर किए गए ओरिजिन पर भरोसा करते हैं, सिवाय metadata/link-local ओरिजिन के, जो स्पष्ट opt-in के बिना अवरुद्ध रहते हैं। ठीक-ठीक ओरिजिन भरोसे से बाहर निकलने के लिए इसे `false` पर सेट करें। WebSocket हेडर/TLS के लिए वही `request` उपयोग करता है, लेकिन उस fetch SSRF गेट का उपयोग नहीं करता। डिफ़ॉल्ट `false`।

  </Accordion>
  <Accordion title="मॉडल कैटलॉग प्रविष्टियाँ">
    - `models.providers.*.models`: स्पष्ट प्रदाता मॉडल कैटलॉग प्रविष्टियाँ।
    - `models.providers.*.models.*.input`: मॉडल इनपुट मोडैलिटी। केवल-टेक्स्ट मॉडलों के लिए `["text"]` और नेटिव image/vision मॉडलों के लिए `["text", "image"]` का उपयोग करें। इमेज अटैचमेंट एजेंट टर्न में केवल तब इंजेक्ट किए जाते हैं जब चुना गया मॉडल image-capable के रूप में चिह्नित हो।
    - `models.providers.*.models.*.contextWindow`: नेटिव मॉडल संदर्भ विंडो मेटाडेटा। यह उस मॉडल के लिए प्रदाता-स्तर `contextWindow` को ओवरराइड करता है।
    - `models.providers.*.models.*.contextTokens`: वैकल्पिक रनटाइम संदर्भ सीमा। यह प्रदाता-स्तर `contextTokens` को ओवरराइड करता है; इसका उपयोग तब करें जब आप मॉडल की नेटिव `contextWindow` से छोटा प्रभावी संदर्भ बजट चाहते हों; `openclaw models list` दोनों मान अलग होने पर दिखाता है।
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: वैकल्पिक संगतता संकेत। `api: "openai-completions"` के लिए, गैर-खाली गैर-नेटिव `baseUrl` (होस्ट `api.openai.com` नहीं) के साथ, OpenClaw रनटाइम पर इसे `false` करने के लिए बाध्य करता है। खाली/छोड़ा गया `baseUrl` डिफ़ॉल्ट OpenAI व्यवहार रखता है।
    - `models.providers.*.models.*.compat.requiresStringContent`: केवल-स्ट्रिंग OpenAI-संगत चैट एंडपॉइंट के लिए वैकल्पिक संगतता संकेत। जब `true` हो, OpenClaw अनुरोध भेजने से पहले शुद्ध टेक्स्ट `messages[].content` ऐरे को साधारण स्ट्रिंग में फ्लैट कर देता है।
    - `models.providers.*.models.*.compat.strictMessageKeys`: सख्त OpenAI-संगत चैट एंडपॉइंट के लिए वैकल्पिक संगतता संकेत। जब `true` हो, OpenClaw अनुरोध भेजने से पहले आउटगोइंग Chat Completions संदेश ऑब्जेक्ट को `role` और `content` तक सीमित कर देता है।
    - `models.providers.*.models.*.compat.thinkingFormat`: वैकल्पिक thinking payload संकेत। Together-शैली `reasoning.enabled` के लिए `"together"`, शीर्ष-स्तरीय `enable_thinking` के लिए `"qwen"`, या request-level chat-template kwargs का समर्थन करने वाले Qwen-family OpenAI-संगत सर्वरों, जैसे vLLM, पर `chat_template_kwargs.enable_thinking` के लिए `"qwen-chat-template"` का उपयोग करें। कॉन्फ़िगर किए गए vLLM Qwen मॉडल इन फ़ॉर्मैट के लिए बाइनरी `/think` विकल्प (`off`, `on`) उजागर करते हैं।
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: DeepSeek-शैली Chat Completions बैकएंड के लिए वैकल्पिक संगतता संकेत, जिन्हें replay पर पिछले assistant संदेशों में `reasoning_content` रखना आवश्यक होता है। जब `true` हो, OpenClaw आउटगोइंग assistant संदेशों पर उस फ़ील्ड को सुरक्षित रखता है। इसका उपयोग तब करें जब ऐसा कस्टम DeepSeek-संगत प्रॉक्सी जोड़ रहे हों जो reasoning हटाए जाने के बाद अनुरोधों को अस्वीकार करता हो। डिफ़ॉल्ट `false`।

  </Accordion>
  <Accordion title="Amazon Bedrock डिस्कवरी">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock ऑटो-डिस्कवरी सेटिंग्स रूट।
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: implicit discovery चालू/बंद करें।
    - `plugins.entries.amazon-bedrock.config.discovery.region`: discovery के लिए AWS region।
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: लक्षित discovery के लिए वैकल्पिक provider-id फ़िल्टर।
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: discovery refresh के लिए polling interval।
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: खोजे गए मॉडलों के लिए fallback context window।
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: खोजे गए मॉडलों के लिए fallback max output tokens।

  </Accordion>
</AccordionGroup>

इंटरैक्टिव custom-provider onboarding सामान्य vision model IDs जैसे GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V, और GLM-4V के लिए image input का अनुमान लगाता है, और ज्ञात text-only families के लिए अतिरिक्त प्रश्न छोड़ देता है। अज्ञात model IDs अभी भी image support के लिए पूछते हैं। Non-interactive onboarding वही inference उपयोग करता है; image-capable metadata बाध्य करने के लिए `--custom-image-input` या text-only metadata बाध्य करने के लिए `--custom-text-input` पास करें।

### प्रदाता उदाहरण

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    आधिकारिक बाहरी `cerebras` provider plugin इसे `openclaw onboard --auth-choice cerebras-api-key` के माध्यम से कॉन्फ़िगर कर सकता है। स्पष्ट provider config का उपयोग केवल डिफ़ॉल्ट ओवरराइड करते समय करें।

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebras के लिए `cerebras/zai-glm-4.7`; Z.AI direct के लिए `zai/glm-4.7` का उपयोग करें।

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic-संगत, बिल्ट-इन प्रदाता। शॉर्टकट: `openclaw onboard --auth-choice kimi-code-api-key`।

  </Accordion>
  <Accordion title="स्थानीय मॉडल (LM Studio)">
    [स्थानीय मॉडल](/hi/gateway/local-models) देखें। TL;DR: गंभीर हार्डवेयर पर LM Studio Responses API के माध्यम से बड़ा स्थानीय मॉडल चलाएँ; fallback के लिए hosted models को merged रखें।
  </Accordion>
  <Accordion title="MiniMax M3 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY` सेट करें। शॉर्टकट: `openclaw onboard --auth-choice minimax-global-api` या `openclaw onboard --auth-choice minimax-cn-api`। मॉडल कैटलॉग डिफ़ॉल्ट रूप से M3 का उपयोग करता है और M2.7 variants भी शामिल करता है। Anthropic-संगत streaming path पर, OpenClaw डिफ़ॉल्ट रूप से MiniMax M2.x thinking को बंद करता है, जब तक कि आप स्वयं स्पष्ट रूप से `thinking` सेट न करें; MiniMax-M3 (और M3.x) डिफ़ॉल्ट रूप से प्रदाता के omitted/adaptive thinking path पर रहता है। `/fast on` या `params.fastMode: true` `MiniMax-M2.7` को `MiniMax-M2.7-highspeed` में फिर से लिखता है।

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    China endpoint के लिए: `baseUrl: "https://api.moonshot.cn/v1"` या `openclaw onboard --auth-choice moonshot-api-key-cn`।

    Native Moonshot endpoints साझा `openai-completions` transport पर streaming usage compatibility का विज्ञापन करते हैं, और OpenClaw इसे केवल built-in provider id के बजाय endpoint capabilities के आधार पर तय करता है।

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`) सेट करें। Zen catalog के लिए `opencode/...` refs या Go catalog के लिए `opencode-go/...` refs उपयोग करें। शॉर्टकट: `openclaw onboard --auth-choice opencode-zen` या `openclaw onboard --auth-choice opencode-go`।

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    आधार URL में `/v1` नहीं होना चाहिए (Anthropic क्लाइंट इसे जोड़ता है)। शॉर्टकट: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    `ZAI_API_KEY` सेट करें। मॉडल रेफ canonical `zai/*` प्रदाता ID का उपयोग करते हैं। शॉर्टकट: `openclaw onboard --auth-choice zai-api-key`.

    - सामान्य endpoint: `https://api.z.ai/api/paas/v4`
    - कोडिंग endpoint (डिफ़ॉल्ट): `https://api.z.ai/api/coding/paas/v4`
    - सामान्य endpoint के लिए, आधार URL ओवरराइड के साथ एक कस्टम प्रदाता परिभाषित करें।

  </Accordion>
</AccordionGroup>

---

## संबंधित

- [कॉन्फ़िगरेशन — agents](/hi/gateway/config-agents)
- [कॉन्फ़िगरेशन — channels](/hi/gateway/config-channels)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) — अन्य शीर्ष-स्तरीय कुंजियाँ
- [टूल और plugins](/hi/tools)
