---
read_when:
    - आप किसी एजेंट के लिए GitHub Copilot SDK हार्नेस का उपयोग करना चाहते हैं
    - आपको `copilot` रनटाइम के लिए कॉन्फ़िगरेशन उदाहरण चाहिए
    - आप किसी एजेंट को subscription Copilot (github / openclaw / copilot) से जोड़ रहे हैं और चाहते हैं कि यह Copilot CLI के माध्यम से चले
summary: OpenClaw के अंतर्निहित एजेंट चक्रों को बाहरी GitHub Copilot SDK हार्नेस के माध्यम से चलाएँ
title: Copilot SDK हार्नेस
x-i18n:
    generated_at: "2026-06-28T23:35:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

The external `@openclaw/copilot` Plugin OpenClaw को अंतर्निहित PI हार्नेस के बजाय GitHub Copilot CLI (`@github/copilot-sdk`) के माध्यम से एम्बेडेड subscription Copilot एजेंट टर्न चलाने देता है।

Copilot SDK हार्नेस का उपयोग तब करें जब आप चाहते हों कि Copilot CLI सत्र निम्न-स्तरीय एजेंट लूप का स्वामी हो: native tool execution, native Compaction (`infiniteSessions`), और `copilotHome` के अंतर्गत CLI-प्रबंधित thread state।
OpenClaw अब भी चैट channels, session files, model selection, OpenClaw dynamic tools (bridged), approvals, media delivery, visible transcript mirror, `/btw` side questions (in-tree PI fallback द्वारा संभाले गए — देखें [Side questions (`/btw`)](#side-questions-btw)), और `openclaw doctor` का स्वामी रहता है।

व्यापक model/provider/runtime विभाजन के लिए, [Agent runtimes](/hi/concepts/agent-runtimes) से शुरू करें।

## आवश्यकताएँ

- OpenClaw जिसमें `@openclaw/copilot` Plugin स्थापित हो।
- यदि आपका config `plugins.allow` का उपयोग करता है, तो `copilot` शामिल करें (Plugin द्वारा घोषित manifest id)। एक restrictive allowlist जो npm-style `@openclaw/copilot` package name का उपयोग करती है, Plugin को blocked छोड़ देगी और runtime load नहीं होगा, भले ही `agentRuntime.id: "copilot"` हो।
- एक GitHub Copilot subscription जो Copilot CLI को drive कर सके (या headless / cron runs के लिए `gitHubToken` env / auth-profile entry)।
- writable `copilotHome` directory। जब OpenClaw agent directory प्रदान करता है, तो हार्नेस default रूप से `<agentDir>/copilot` का उपयोग करता है, अन्यथा full per-agent isolation के लिए `~/.openclaw/agents/<agentId>/copilot` का।

`openclaw doctor` declarative session-state ownership और भविष्य की compatibility migrations के लिए Plugin [doctor contract](#doctor) चलाता है। यह Copilot CLI environment probes नहीं चलाता।

## Plugin स्थापना

Copilot runtime एक external Plugin है, इसलिए core `openclaw` package `@github/copilot-sdk` dependency या उसकी platform-specific `@github/copilot-<platform>-<arch>` CLI binary नहीं रखता। साथ में वे लगभग 260 MB जोड़ते हैं, इसलिए उन्हें केवल उन agents के लिए install करें जो इस runtime में opt in करते हैं:

```bash
openclaw plugins install @openclaw/copilot
```

Wizard Plugin को पहली बार तब install करता है जब आप कोई `github-copilot/*` model चुनते हैं **और** आपका config model (या उसके provider) को `agentRuntime: { id: "copilot" }` के माध्यम से Copilot agent runtime में opt करता है (नीचे [Quickstart](#quickstart) देखें)। Opt-in के बिना, openclaw अपने built-in GitHub Copilot provider का उपयोग करता है और runtime Plugin कभी install नहीं करता।

Runtime SDK को इस क्रम में resolve करता है:

1. installed `@openclaw/copilot` package से `import("@github/copilot-sdk")`।
2. well-known fallback dir `~/.openclaw/npm-runtime/copilot/` (legacy on-demand install target)।

Missing SDK code `COPILOT_SDK_MISSING` और ऊपर दिए Plugin reinstall command के साथ एक single error surface करता है।

## त्वरित प्रारंभ

एक model (या एक provider) को हार्नेस पर pin करें:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

दोनों routes equivalent हैं। `agentRuntime.id` को single model entry पर तब उपयोग करें जब केवल वही model हार्नेस के माध्यम से route होना चाहिए; किसी provider पर `agentRuntime.id` तब set करें जब उस provider के अंतर्गत हर model इसका उपयोग करे।

`github-copilot/auto` portable starting point है। Named Copilot models account- और organization-policy-dependent होते हैं, इसलिए केवल तब pin करें जब यह पुष्टि हो जाए कि authenticated Copilot CLI उसे expose करता है।

## समर्थित providers

हार्नेस canonical `github-copilot` provider (वही id जो `extensions/github-copilot` के स्वामित्व में है) के लिए support advertise करता है:

- `github-copilot`

यह custom `models.providers` entries को भी support करता है जब selected model में non-empty `baseUrl` हो और इनमें से कोई API shape हो:

- `openai-responses`
- `openai-completions`
- `ollama` (OpenAI-compatible completions)
- `azure-openai-responses`
- `anthropic-messages`

Native provider ids जैसे `openai`, `anthropic`, `google`, और `ollama` अपने native runtimes के स्वामित्व में रहते हैं। Copilot BYOK के माध्यम से endpoint route करते समय अलग custom provider id का उपयोग करें।

Copilot BYOK endpoints public-network HTTPS URLs होने चाहिए। हार्नेस Copilot SDK को per-attempt loopback proxy URL देता है, फिर provider traffic को OpenClaw के guarded fetch path से forward करता है ताकि DNS pinning और SSRF policy OpenClaw के स्वामित्व में रहें। local Ollama, LM Studio, या LAN model servers के लिए native OpenClaw runtime का उपयोग करें।

## BYOK

Copilot BYOK SDK के session-level custom provider contract का उपयोग करता है। OpenClaw resolved model endpoint, API key, bearer-token mode, headers, model id, और context/output limits को provider transport logic को core में ले जाए बिना pass करता है।

उदाहरण के लिए:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK sessions subscription sessions और अन्य endpoints या credential fingerprints से अलग keyed होते हैं। Key, headers, model, या endpoint rotate करने पर incompatible state resume करने के बजाय fresh Copilot SDK session बनता है।

## प्रमाणीकरण

Per-agent precedence, `runCopilotAttempt` के दौरान लागू:

1. Attempt input पर **Explicit `useLoggedInUser: true`**। Agent के `copilotHome` के अंतर्गत resolved Copilot CLI के logged-in user का उपयोग करता है।
2. Attempt input पर **Explicit `gitHubToken`** (`profileId` + `profileVersion` के साथ)। Direct CLI invocations और tests के लिए उपयोगी, जहाँ caller auth-profile resolution को bypass करना चाहता है।
3. `EmbeddedRunAttemptParams` shape से **Contract-resolved `resolvedApiKey` + `authProfileId`**। यह **production main path** है: core, हार्नेस invoke करने से पहले agent के configured `github-copilot` auth profile को (via `src/infra/provider-usage.auth.ts:resolveProviderAuths`) resolve करता है, और हार्नेस दोनों fields को सीधे consume करता है। इससे `github-copilot:<profile>` auth profile headless / cron / multi-profile setups के लिए env vars के बिना end-to-end काम करता है।
4. Direct CLI / dogfood runs के लिए **Env-var fallback** जहाँ कोई auth profile configured नहीं है। Runtime निम्न vars को precedence order में check करता है, shipped `github-copilot` provider (`extensions/github-copilot/auth.ts`) और documented Copilot SDK setup को mirror करते हुए:
   1. `OPENCLAW_GITHUB_TOKEN` -- harness-specific override; इसे OpenClaw हार्नेस के लिए token pin करने हेतु set करें, बिना system-wide `gh` / Copilot CLI config को disturb किए।
   2. `COPILOT_GITHUB_TOKEN` -- standard Copilot SDK / CLI env var।
   3. `GH_TOKEN` -- standard `gh` CLI env var (existing `github-copilot` provider precedence से match करता है)।
   4. `GITHUB_TOKEN` -- generic GitHub token fallback।

   पहला non-empty value जीतता है; empty strings को absent माना जाता है। Synthesised pool profile id `env:<NAME>` है और profileVersion token का non-reversible sha256 fingerprint है, इसलिए env value rotate करने से client pool cleanly bust होता है।

5. कोई token signal उपलब्ध न होने पर **Default `useLoggedInUser`**।

हर agent को dedicated `copilotHome` मिलता है ताकि Copilot CLI tokens, sessions, और config एक ही machine पर agents के बीच leak न हों। Default `<agentDir>/copilot` है जब host हार्नेस को agent directory देता है (उसी directory में OpenClaw के `models.json` / `auth-profiles.json` से SDK state को isolate करते हुए), या अन्यथा `~/.openclaw/agents/<agentId>/copilot`। Custom location की आवश्यकता होने पर attempt input पर `copilotHome: <path>` से override करें (उदाहरण के लिए, migration के लिए shared mount)।

Live harness tests direct token की आवश्यकता होने पर `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` का उपयोग करते हैं। Shared live-test setup isolated test home में real auth profiles stage करने के बाद जानबूझकर `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, और `GITHUB_TOKEN` scrub करता है, इसलिए dedicated live-test variable के माध्यम से `gh auth token` value pass करने से token को unrelated suites में expose किए बिना false skips avoid होते हैं।

## कॉन्फ़िगरेशन सतह

हार्नेस अपना config per-attempt input (`runCopilotAttempt({...})`) और `extensions/copilot/src/` के अंदर env defaults के छोटे set से पढ़ता है:

- `copilotHome` — per-agent CLI state directory (defaults ऊपर documented हैं)।
- `model` — string या `{ provider, id, api?, baseUrl?, headers?, authHeader? }`। Omitted होने पर, OpenClaw agent के normal model selection का उपयोग करता है और हार्नेस verify करता है कि resolved provider supported है।
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`। `auto-reply/thinking.ts` में OpenClaw के `ThinkLevel` / `ReasoningLevel` resolution से map करता है।
- `infiniteSessionConfig` — SDK `infiniteSessions` block के लिए optional override जो `harness.compact` द्वारा driven है। Defaults को as-is छोड़ना safe है।
- `hooksConfig` — tool/MCP, user-prompt, session, और error callbacks के लिए optional native Copilot SDK `SessionHooks` compatibility config। यह OpenClaw के portable lifecycle hooks से अलग है।
- `permissionPolicy` — SDK के `onPermissionRequest` handler के लिए optional override जो built-in SDK tool kinds (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`) के लिए उपयोग होता है। Safety net के रूप में default `rejectAllPolicy` है; व्यवहार में SDK उन kinds में से किसी को भी कभी invoke नहीं करता क्योंकि हर bridged OpenClaw tool `overridesBuiltInTool: true` और `skipPermission: true` के साथ registered है, इसलिए 100% tool calls OpenClaw के wrapped `execute()` से flow करते हैं। देखें [Permissions and ask_user](#permissions-and-ask_user)।
- `enableSessionTelemetry` — optional SDK session telemetry flag।

OpenClaw Plugin hooks को Copilot-specific attempt configuration की आवश्यकता नहीं होती। हार्नेस standard harness helpers के माध्यम से `before_prompt_build` (और legacy `before_agent_start` compatibility hook), `llm_input`, `llm_output`, और `agent_end` चलाता है। Successful SDK compactions `before_compaction` और `after_compaction` भी चलाते हैं। Bridged OpenClaw tools `before_tool_call` चलाते रहते हैं और `after_tool_call` report करते हैं; `hooksConfig` native SDK-only callbacks के लिए रहता है जिनका कोई portable equivalent नहीं है।

OpenClaw के बाकी हिस्से को इन fields के बारे में जानने की आवश्यकता नहीं है। Other plugins, channels, और core code केवल standard `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` shape देखते हैं।

## Compaction

जब `harness.compact` चलता है, Copilot SDK हार्नेस:

1. Pending work continue किए बिना tracked SDK session resume करता है।
2. SDK का session-scoped history compaction RPC call करता है।
3. Workspace के अंतर्गत compatibility marker files लिखे बिना SDK compaction outcome return करता है।

OpenClaw side transcript mirror (नीचे देखें) post-compaction messages receive करता रहता है, इसलिए user-facing chat history consistent रहती है।

## ट्रांसक्रिप्ट मिररिंग

`runCopilotAttempt` हर turn के mirrorable messages को `extensions/copilot/src/dual-write-transcripts.ts` के माध्यम से OpenClaw audit transcript में dual-write करता है। Mirror per-session scoped (`copilot:${sessionId}`) है और per-message identity (`${role}:${sha256_16(role,content)}`) का उपयोग करता है, इसलिए prior-turn entries के re-emits existing on-disk keys से collide करते हैं और duplicate नहीं होते।

Mirror failure containment की दो layers में wrapped है ताकि transcript write failure attempt को fail न कर सके: internal best-effort wrapper और attempt level पर defense-in-depth `.catch(...)`। Failures logged होते हैं लेकिन surfaced नहीं होते।

## पार्श्व प्रश्न (`/btw`)

`/btw` इस harness पर **native** नहीं है। `createCopilotAgentHarness()`
जानबूझकर `harness.runSideQuestion` को undefined छोड़ता है, इसलिए OpenClaw का `/btw`
dispatcher (`src/agents/btw.ts`) उसी in-tree PI fallback
path पर चला जाता है जिसे वह हर non-Codex runtime के लिए उपयोग करता है: configured model provider को
एक छोटे side-question prompt के साथ सीधे call किया जाता है और
`streamSimple` के ज़रिए stream करके वापस भेजा जाता है (कोई CLI session नहीं, कोई अतिरिक्त pool slot नहीं)।

इससे Copilot CLI sessions agent के मुख्य turn loop के लिए reserved रहते हैं, और
`/btw` behavior अन्य PI-backed runtimes जैसा ही रहता है। contract को
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
में `describe("runSideQuestion")` के अंतर्गत assert किया गया है।

## Doctor

`extensions/copilot/doctor-contract-api.ts` को
`src/plugins/doctor-contract-registry.ts` द्वारा auto-loaded किया जाता है। यह योगदान देता है:

- एक empty `legacyConfigRules` (MVP में कोई retired fields नहीं)।
- एक no-op `normalizeCompatibilityConfig` (ताकि future field retirements के लिए
  एक stable in-tree home रहे)।
- एक `sessionRouteStateOwners` entry जो provider `github-copilot`;
  runtime `copilot`; CLI session key `copilot`; auth profile
  prefix `github-copilot:` claim करती है।

## सीमाएँ

- harness `github-copilot` और unowned custom BYOK provider ids को claim करता है।
  Manifest-owned native provider ids अपने owning runtime पर ही रहते हैं, भले ही
  `agentRuntime.id` को `copilot` पर force किया गया हो।
- harness TUI deliver नहीं करता; PI का TUI अप्रभावित है और उन
  runtimes के लिए fallback बना रहता है जिनके पास peer surface नहीं है।
- जब कोई agent `copilot` पर switch करता है, तो PI session state migrate नहीं की जाती।
  चयन per attempt होता है; मौजूदा PI sessions valid रहते हैं।
- `ask_user` वही OpenClaw prompt-and-reply path उपयोग करता है जो Codex
  harness करता है। जब Copilot SDK user input मांगता है, OpenClaw active channel/TUI पर
  blocking prompt post करता है और अगला queued user
  message SDK request को resolve करता है।

## अनुमतियाँ और ask_user

bridged OpenClaw tools के लिए permission enforcement **tool wrapper के अंदर**
होता है, SDK के `onPermissionRequest` callback के ज़रिए नहीं। वही
`wrapToolWithBeforeToolCallHook` जिसे PI उपयोग करता है
(`src/agents/pi-tools.before-tool-call.ts`), `createOpenClawCodingTools` द्वारा
हर coding tool पर लागू किया जाता है: loop detection,
trusted Plugin policies, before-tool-call hooks, और gateway
(`plugin.approval.request`) के ज़रिए two-phase Plugin approvals, सभी native PI attempts जैसे
ठीक उसी code path के साथ चलते हैं।

उस wrapper को decision own करने देने के लिए,
`convertOpenClawToolToSdkTool` द्वारा लौटाया गया SDK Tool इनसे marked होता है:

- `overridesBuiltInTool: true` — समान नाम वाले Copilot CLI के built-in
  tool को replace करता है (edit, read, write, bash, …), ताकि हर tool
  invocation वापस OpenClaw पर route हो।
- `skipPermission: true` — SDK को बताता है कि tool invoke करने से पहले
  `onPermissionRequest({kind: "custom-tool"})` fire न करे।
  wrapped `execute()` internally अधिक समृद्ध OpenClaw policy check करता है;
  SDK-level prompt या तो OpenClaw के enforcement को short-circuit करेगा
  (अगर हम allow-all करें) या हर tool call block करेगा (अगर हम
  reject-all करें) — इनमें से कोई भी PI parity से मेल नहीं खाता।

in-tree codex harness वही split उपयोग करता है: bridged OpenClaw tools
wrapped होते हैं (`extensions/codex/src/app-server/dynamic-tools.ts`) और
codex-app-server के _अपने_ native approval kinds
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) को
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) के ज़रिए route किया जाता है। Copilot SDK
equivalent — किसी भी non-`custom-tool`
kind के लिए fail-closed `rejectAllPolicy`, जो कभी `onPermissionRequest` तक पहुंचे — वही safety net है,
और व्यवहार में यह fire नहीं करता क्योंकि `overridesBuiltInTool: true`
हर built-in को displace कर देता है।

wrapped-tool layer को PI के equivalent policy decisions लेने देने के लिए,
harness पूरा PI attempt-tool context
`createOpenClawCodingTools` को forward करता है — identity (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), channel/routing
(`groupId`, `currentChannelId`, `replyToMode`, message-tool toggles),
auth (`authProfileStore`), run identity
(`sessionKey`/`runSessionKey` derived from `sandboxSessionKey`,
`runId`), model context (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`), और run hooks (`onToolOutcome`,
`onYield`)। उन fields के बिना, owner-only allowlists चुपचाप
deny-by-default जैसा behave करती हैं, Plugin-trust policies सही
scope तक resolve नहीं कर पातीं, और `session_status: "current"` stale
sandbox key पर resolve होता है। bridge builder
`extensions/copilot/src/tool-bridge.ts` में है और PI
authoritative call को mirror करता है:
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`। `runAttempt`
पहले से shared `resolveSandboxContext` seam के ज़रिए sandbox context resolve करता है,
SDK को effective working directory pass करता है, और `sandbox` के साथ subagent-spawn workspace को
tool bridge में forward करता है। bridge bounded tool-construction
controls भी forward करता है जिन्हें वह SDK boundary पर enforce कर सकता है: `includeCoreTools`,
runtime tool allowlist, और `toolConstructionPlan`।

bridge PI parity के लिए
`openclaw/plugin-sdk/agent-harness-tool-runtime` से shared harness tool-surface helper भी उपयोग करता है। जब
tool-search enabled होता है, SDK हर OpenClaw tool schema के बजाय compact control tools और एक hidden
catalog executor देखता है। जब code mode enabled होता है,
helper वही code-mode control surface और catalog
lifecycle बनाता है जिसे दूसरे agent harnesses उपयोग करते हैं। Local-model lean defaults,
runtime-compatible schema filtering, directory hydration, और catalog
cleanup सभी shared helper में रहते हैं ताकि Copilot और Codex-adjacent
harnesses drift न करें।

### Session-level GitHub token

Copilot SDK contract **client-level** GitHub
token (`CopilotClientOptions.gitHubToken`, जिसका उपयोग CLI process को authenticate करने के लिए होता है)
और **session-level** token
(`SessionConfig.gitHubToken`, जो उस session के लिए content exclusion,
model routing, और quota निर्धारित करता है और `createSession` तथा
`resumeSession` दोनों पर honored होता है) में अंतर करता है। harness auth को
`resolveCopilotAuth` के ज़रिए एक बार resolve करता है और जब auth mode
`gitHubToken` हो (explicit `auth.gitHubToken` या configured `github-copilot` auth profile से
contract-resolved `resolvedApiKey`), तब दोनों fields set करता है।
जब resolved mode `useLoggedInUser` होता है, session-level field
omit की जाती है ताकि SDK logged-in
identity से identity derive करता रहे।

`ask_user` `SessionConfig.onUserInputRequest` उपयोग करता है। bridge
fixed-choice requests के लिए choice indexes या labels accept करता है, SDK request द्वारा अनुमति होने पर
free-form answers accept करता है, और OpenClaw attempt aborted होने पर
pending request cancel करता है।

## संबंधित

- [Agent runtimes](/hi/concepts/agent-runtimes)
- [Codex harness](/hi/plugins/codex-harness)
- [Agent harness plugins (SDK reference)](/hi/plugins/sdk-agent-harness)
