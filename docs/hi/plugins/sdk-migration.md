---
read_when:
    - आपको OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED चेतावनी दिखाई देती है
    - आपको OPENCLAW_EXTENSION_API_DEPRECATED चेतावनी दिखाई देती है
    - आपने OpenClaw 2026.4.25 से पहले api.registerEmbeddedExtensionFactory का उपयोग किया
    - आप किसी Plugin को आधुनिक Plugin आर्किटेक्चर में अपडेट कर रहे हैं
    - आप एक बाहरी OpenClaw Plugin का रखरखाव करते हैं
sidebarTitle: Migrate to SDK
summary: legacy पश्च-संगतता लेयर से आधुनिक plugin SDK पर माइग्रेट करें
title: Plugin SDK माइग्रेशन
x-i18n:
    generated_at: "2026-07-01T08:04:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw एक व्यापक backwards-compatibility layer से केंद्रित, दस्तावेजीकृत imports वाली आधुनिक Plugin
architecture पर चला गया है। यदि आपका Plugin नई architecture से पहले बनाया गया था,
तो यह guide आपको migrate करने में मदद करती है।

## क्या बदल रहा है

पुराना Plugin system दो wide-open surfaces देता था, जिनसे plugins एक ही entry point से
अपनी जरूरत की कोई भी चीज import कर सकते थे:

- **`openclaw/plugin-sdk/compat`** - एक single import जो दर्जनों
  helpers को re-export करता था। इसे पुराने hook-based plugins को चलते रखने के लिए पेश किया गया था, जबकि
  नई Plugin architecture बनाई जा रही थी।
- **`openclaw/plugin-sdk/infra-runtime`** - एक broad runtime helper barrel जिसने
  system events, Heartbeat state, delivery queues, fetch/proxy helpers,
  file helpers, approval types, और असंबंधित utilities को मिला दिया था।
- **`openclaw/plugin-sdk/config-runtime`** - एक broad config compatibility barrel
  जो migration window के दौरान अभी भी deprecated direct load/write helpers रखता है।
- **`openclaw/extension-api`** - एक bridge जिसने plugins को
  embedded agent runner जैसे host-side helpers तक direct access दिया।
- **`api.registerEmbeddedExtensionFactory(...)`** - हटाया गया embedded-runner-only bundled
  extension hook जो `tool_result` जैसे embedded-runner events को observe कर सकता था।

Broad import surfaces अब **deprecated** हैं। वे runtime पर अभी भी काम करते हैं,
लेकिन नए plugins को उनका उपयोग नहीं करना चाहिए, और मौजूदा plugins को अगले major release द्वारा उन्हें हटाए जाने से पहले
migrate कर लेना चाहिए। Embedded-runner-only extension factory
registration API हटा दी गई है; इसके बजाय tool-result middleware का उपयोग करें।

OpenClaw replacement पेश करने वाले उसी change में documented Plugin behavior को
न हटाता है और न reinterpret करता है। Breaking contract changes को पहले
compatibility adapter, diagnostics, docs, और deprecation window से गुजरना होगा।
यह SDK imports, manifest fields, setup APIs, hooks, और runtime
registration behavior पर लागू होता है।

<Warning>
  Backwards-compatibility layer को भविष्य के major release में हटा दिया जाएगा।
  जो plugins अभी भी इन surfaces से import करते हैं, वे ऐसा होने पर टूट जाएंगे।
  Legacy embedded extension factory registrations पहले से ही अब load नहीं होतीं।
</Warning>

## यह क्यों बदला

पुराने approach से समस्याएं हुईं:

- **धीमा startup** - एक helper import करने से दर्जनों असंबंधित modules load होते थे
- **Circular dependencies** - broad re-exports से import cycles बनाना आसान हो गया
- **अस्पष्ट API surface** - यह बताने का कोई तरीका नहीं था कि कौन से exports stable थे और कौन से internal

Modern Plugin SDK इसे ठीक करता है: प्रत्येक import path (`openclaw/plugin-sdk/\<subpath\>`)
एक छोटे, self-contained module के रूप में होता है, जिसका clear purpose और documented contract होता है।

Bundled channels के लिए legacy provider convenience seams भी जा चुके हैं।
Channel-branded helper seams private mono-repo shortcuts थे, stable
Plugin contracts नहीं। इसके बजाय narrow generic SDK subpaths का उपयोग करें। Bundled
Plugin workspace के अंदर, provider-owned helpers को उस Plugin के अपने `api.ts` या
`runtime-api.ts` में रखें।

मौजूदा bundled provider examples:

- Anthropic अपने Claude-specific stream helpers को अपने `api.ts` /
  `contract-api.ts` seam में रखता है
- OpenAI provider builders, default-model helpers, और realtime provider
  builders को अपने `api.ts` में रखता है
- OpenRouter provider builder और onboarding/config helpers को अपने
  `api.ts` में रखता है

## Talk और realtime voice migration plan

Realtime voice, telephony, meeting, और browser Talk code
surface-local turn bookkeeping से `openclaw/plugin-sdk/realtime-voice` द्वारा exported shared Talk session controller में जा रहा है। नया controller common Talk
event envelope, active turn state, capture state, output-audio state, recent
event history, और stale-turn rejection का owner है। Provider plugins को
vendor-specific realtime sessions का ownership बनाए रखना चाहिए; surface plugins को capture,
playback, telephony, और meeting quirks का ownership बनाए रखना चाहिए।

यह Talk migration जानबूझकर breaking-clean है:

1. Shared controller/runtime primitives को
   `plugin-sdk/realtime-voice` में रखें।
2. Bundled surfaces को shared controller पर move करें: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, और native push-to-talk।
3. पुराने Talk RPC families को अंतिम `talk.session.*` और
   `talk.client.*` API से replace करें।
4. Gateway `hello-ok.features.events` में एक live Talk event channel advertise करें:
   `talk.event`।
5. पुराना realtime HTTP endpoint और कोई भी request-time instruction
   override path delete करें।

New code को `createTalkEventSequencer(...)` सीधे call नहीं करना चाहिए, जब तक कि वह
low-level adapter या test fixture implement न कर रहा हो। Shared controller को prefer करें
ताकि turn-scoped events turn id के बिना emit न हो सकें, stale `turnEnd` /
`turnCancel` calls नए active turn को clear न कर सकें, और output-audio lifecycle
events telephony, meetings, browser relay, managed-room
handoff, और native Talk clients में consistent रहें।

Target public API shape है:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Browser-owned WebRTC/provider-websocket sessions `talk.client.create` का उपयोग करते हैं,
क्योंकि browser provider negotiation और media transport का owner होता है, जबकि
Gateway credentials, instructions, और tool policy का owner होता है। `talk.session.*`
gateway-relay realtime, gateway-relay
transcription, और managed-room native STT/TTS sessions के लिए common Gateway-managed surface है।

Legacy configs, जिन्होंने realtime selectors को `talk.provider` /
`talk.providers` के साथ रखा था, उन्हें `openclaw doctor --fix` से repair किया जाना चाहिए; runtime Talk
speech/TTS provider config को realtime provider config के रूप में reinterpret नहीं करता।

Supported `talk.session.create` combinations जानबूझकर छोटी हैं:

| Mode            | Transport       | Brain           | Owner              | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway के माध्यम से bridged full-duplex provider audio; tool calls agent-consult tool के माध्यम से route किए जाते हैं।      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | केवल streaming STT; callers input audio भेजते हैं और transcript events receive करते हैं।                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk और walkie-talkie style rooms जहां client capture/playback का owner होता है और Gateway turn state का owner होता है। |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Trusted first-party surfaces के लिए admin-only room mode जो Gateway tool actions को directly execute करते हैं।                  |

Removed method map:

| पुराना                              | नया                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Unified control vocabulary भी जानबूझकर narrow है:

  | विधि                          | इस पर लागू                                              | अनुबंध                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | उसी Gateway कनेक्शन के स्वामित्व वाले प्रदाता सत्र में base64 PCM ऑडियो खंड जोड़ें।                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room उपयोगकर्ता टर्न शुरू करें।                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn सत्यापन के बाद सक्रिय टर्न समाप्त करें।                                                                                                                                         |
  | `talk.session.cancelTurn`       | सभी Gateway-स्वामित्व वाले सत्र                              | किसी टर्न के लिए सक्रिय कैप्चर/प्रदाता/एजेंट/TTS कार्य रद्द करें।                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | उपयोगकर्ता टर्न को आवश्यक रूप से समाप्त किए बिना सहायक ऑडियो आउटपुट रोकें।                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | relay द्वारा निकाली गई प्रदाता टूल कॉल पूरी करें; अंतरिम आउटपुट के लिए `options.willContinue` या किसी अन्य सहायक प्रतिक्रिया के बिना कॉल को संतुष्ट करने के लिए `options.suppressResponse` पास करें। |
  | `talk.session.steer`            | एजेंट-समर्थित Talk सत्र                              | Talk सत्र से हल किए गए सक्रिय एम्बेडेड रन को बोला गया `status`, `steer`, `cancel`, या `followup` नियंत्रण भेजें।                                                                |
  | `talk.session.close`            | सभी एकीकृत सत्र                                    | relay सत्र रोकें या managed-room स्थिति निरस्त करें, फिर एकीकृत सत्र id भूल जाएँ।                                                                                                    |

  इसे काम करने के लिए core में प्रदाता या प्लेटफ़ॉर्म विशेष मामले न जोड़ें।
  Core Talk सत्र semantics का स्वामी है। Provider plugins vendor सत्र setup के स्वामी हैं।
  Voice-call और Google Meet telephony/meeting adapters के स्वामी हैं। Browser और native
  apps device capture/playback UX के स्वामी हैं।

  ## संगतता नीति

  बाहरी plugins के लिए, संगतता कार्य इस क्रम का पालन करता है:

  1. नया contract जोड़ें
  2. पुराने behavior को compatibility adapter के माध्यम से wired रखें
  3. ऐसा diagnostic या warning emit करें जो पुराना path और replacement बताए
  4. tests में दोनों paths cover करें
  5. deprecation और migration path दस्तावेज़ करें
  6. घोषित migration window के बाद ही हटाएँ, आमतौर पर major release में

  Maintainers मौजूदा migration queue को
  `pnpm plugins:boundary-report` से audit कर सकते हैं। compact counts के लिए `pnpm plugins:boundary-report:summary`, एक Plugin या compatibility owner के लिए `--owner <id>`, और जब CI gate को due
  compatibility records, cross-owner reserved SDK imports, या unused reserved SDK
  subpaths पर fail होना चाहिए, तब
  `pnpm plugins:boundary-report:ci` का उपयोग करें। report deprecated
  compatibility records को removal date के अनुसार group करती है, local code/docs references गिनती है,
  cross-owner reserved SDK imports सतह पर लाती है, और private
  memory-host SDK bridge को summarize करती है ताकि compatibility cleanup ad hoc searches पर
  निर्भर रहने के बजाय explicit रहे। Reserved SDK subpaths में tracked owner usage होना चाहिए;
  unused reserved helper exports को public SDK से हटा दिया जाना चाहिए।

  यदि कोई manifest field अभी भी accepted है, तो Plugin authors उसे तब तक इस्तेमाल कर सकते हैं जब तक
  docs और diagnostics कुछ और न कहें। नए code को documented
  replacement को preference देनी चाहिए, लेकिन existing plugins ordinary minor
  releases के दौरान break नहीं होने चाहिए।

  ## माइग्रेट कैसे करें

  <Steps>
  <Step title="Runtime config load/write helpers माइग्रेट करें">
    Bundled plugins को
    `api.runtime.config.loadConfig()` और
    `api.runtime.config.writeConfigFile(...)` को सीधे call करना बंद करना चाहिए। उस config को प्राथमिकता दें जो
    active call path में पहले ही pass किया गया था। Current process snapshot की जरूरत वाले long-lived handlers
    `api.runtime.config.current()` का उपयोग कर सकते हैं। Long-lived
    agent tools को `execute` के अंदर tool context का `ctx.getRuntimeConfig()` उपयोग करना चाहिए
    ताकि config write से पहले बना tool भी refreshed
    runtime config देख सके।

    Config writes को transactional helpers के माध्यम से जाना चाहिए और एक
    after-write policy चुननी चाहिए:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    जब caller को पता हो कि change के लिए clean gateway restart आवश्यक है, तब `afterWrite: { mode: "restart", reason: "..." }` उपयोग करें, और
    `afterWrite: { mode: "none", reason: "..." }` केवल तब जब caller follow-up का स्वामी हो और जानबूझकर reload planner को suppress करना चाहता हो।
    Mutation results में tests और logging के लिए typed `followUp` summary शामिल होती है;
    gateway restart लागू करने या schedule करने के लिए जिम्मेदार रहता है।
    `loadConfig` और `writeConfigFile` migration window के दौरान external plugins के लिए deprecated compatibility
    helpers के रूप में बने रहते हैं और
    `runtime-config-load-write` compatibility code के साथ एक बार warn करते हैं। Bundled plugins और repo
    runtime code
    `pnpm check:deprecated-api-usage` और
    `pnpm check:no-runtime-action-load-config` में scanner guardrails द्वारा protected हैं: new production plugin usage
    outright fail होता है, direct config writes fail होते हैं, gateway server methods को
    request runtime snapshot का उपयोग करना चाहिए, runtime channel send/action/client helpers को
    अपने boundary से config मिलना चाहिए, और long-lived runtime modules में
    allowed ambient `loadConfig()` calls शून्य हैं।

    नए Plugin code को broad
    `openclaw/plugin-sdk/config-runtime` compatibility barrel import करने से भी बचना चाहिए। उस काम से match करने वाले narrow
    SDK subpath का उपयोग करें:

    | जरूरत | Import |
    | --- | --- |
    | `OpenClawConfig` जैसे Config types | `openclaw/plugin-sdk/config-contracts` |
    | Already-loaded config assertions और plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Current runtime snapshot reads | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config writes | `openclaw/plugin-sdk/config-mutation` |
    | Session store helpers | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helpers | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins और उनके tests broad
    barrel के विरुद्ध scanner-guarded हैं ताकि imports और mocks उसी behavior तक local रहें जिसकी उन्हें जरूरत है। Broad
    barrel अभी भी external compatibility के लिए मौजूद है, लेकिन new code को उस पर
    depend नहीं करना चाहिए।

  </Step>

  <Step title="Embedded tool-result extensions को middleware में माइग्रेट करें">
    Bundled plugins को embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlers को
    runtime-neutral middleware से replace करना होगा।

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    उसी समय Plugin manifest update करें:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Installed plugins भी tool-result middleware register कर सकते हैं जब वे
    explicitly enabled हों और
    `contracts.agentToolResultMiddleware` में हर targeted runtime declare करें। Undeclared installed middleware
    registrations rejected होते हैं।

  </Step>

  <Step title="Approval-native handlers को capability facts में माइग्रेट करें">
    Approval-capable channel plugins अब native approval behavior को
    `approvalCapability.nativeRuntime` और shared runtime-context registry के माध्यम से expose करते हैं।

    मुख्य बदलाव:

    - `approvalCapability.handler.loadRuntime(...)` को
      `approvalCapability.nativeRuntime` से replace करें
    - Approval-specific auth/delivery को legacy `plugin.auth` /
      `plugin.approvals` wiring से हटाकर `approvalCapability` पर ले जाएँ
    - `ChannelPlugin.approvals` को public channel-plugin
      contract से हटा दिया गया है; delivery/native/render fields को `approvalCapability` पर ले जाएँ
    - `plugin.auth` केवल channel login/logout flows के लिए बना रहता है; वहाँ approval auth
      hooks अब core द्वारा read नहीं किए जाते
    - clients, tokens, या Bolt
      apps जैसे channel-owned runtime objects को `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से register करें
    - Native approval handlers से plugin-owned reroute notices न भेजें;
      core अब actual delivery results से routed-elsewhere notices का स्वामी है
    - `createChannelManager(...)` में `channelRuntime` pass करते समय
      real `createPluginRuntime().channel` surface दें। Partial stubs rejected होते हैं।

    मौजूदा approval capability
    layout के लिए `/plugins/sdk-channel-plugins` देखें।

  </Step>

  <Step title="Windows wrapper fallback behavior audit करें">
    यदि आपका Plugin `openclaw/plugin-sdk/windows-spawn` उपयोग करता है, तो unresolved Windows
    `.cmd`/`.bat` wrappers अब fail closed होते हैं जब तक आप explicitly
    `allowShellFallback: true` pass नहीं करते।

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    यदि आपका caller जानबूझकर shell fallback पर rely नहीं करता, तो
    `allowShellFallback` set न करें और इसके बजाय thrown error handle करें।

  </Step>

  <Step title="Deprecated imports खोजें">
    अपने Plugin में किसी भी deprecated surface से imports खोजें:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Focused imports से replace करें">
    पुराने surface से हर export एक specific modern import path पर map होता है:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Host-side helpers के लिए, सीधे import करने के बजाय injected Plugin runtime का उपयोग करें:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    यही पैटर्न अन्य पुराने bridge सहायकों पर भी लागू होता है:

    | पुराना import | आधुनिक समकक्ष |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store सहायक | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` बाहरी संगतता के लिए अभी भी मौजूद है,
    लेकिन नए कोड को उस केंद्रित सहायक सतह को import करना चाहिए जिसकी उसे
    वास्तव में आवश्यकता है:

    | आवश्यकता | Import |
    | --- | --- |
    | सिस्टम इवेंट कतार सहायक | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat wake, event, और visibility सहायक | `openclaw/plugin-sdk/heartbeat-runtime` |
    | लंबित डिलीवरी कतार drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | चैनल गतिविधि telemetry | `openclaw/plugin-sdk/channel-activity-runtime` |
    | इन-मेमरी dedupe cache | `openclaw/plugin-sdk/dedupe-runtime` |
    | सुरक्षित स्थानीय-फ़ाइल/media path सहायक | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy और guarded fetch सहायक | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher नीति प्रकार | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Approval request/resolution प्रकार | `openclaw/plugin-sdk/approval-runtime` |
    | Approval reply payload और command सहायक | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Error formatting सहायक | `openclaw/plugin-sdk/error-runtime` |
    | Transport readiness प्रतीक्षाएं | `openclaw/plugin-sdk/transport-ready-runtime` |
    | सुरक्षित token सहायक | `openclaw/plugin-sdk/secure-random-runtime` |
    | सीमित async task concurrency | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numeric coercion | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | फ़ाइल lock | `openclaw/plugin-sdk/file-lock` |

    Bundled Plugin को `infra-runtime` के विरुद्ध scanner-guarded रखा गया है, इसलिए repo code
    व्यापक barrel पर वापस नहीं जा सकता।

  </Step>

  <Step title="Migrate channel route helpers">
    नए चैनल route code को `openclaw/plugin-sdk/channel-route` का उपयोग करना चाहिए।
    पुराने route-key और comparable-target नाम migration window के दौरान
    compatibility alias के रूप में बने रहते हैं, लेकिन नए Plugin को उन route
    नामों का उपयोग करना चाहिए जो behavior को सीधे वर्णित करते हैं:

    | पुराना सहायक | आधुनिक सहायक |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    आधुनिक route सहायक native approvals, reply suppression, inbound dedupe,
    Cron delivery, और session routing में `{ channel, to, accountId, threadId }`
    को लगातार normalize करते हैं।

    `ChannelMessagingAdapter.parseExplicitTarget` या
    parser-backed loaded-route सहायकों (`parseExplicitTargetForLoadedChannel`
    या `resolveRouteTargetForLoadedChannel`) या
    `plugin-sdk/channel-route` से `resolveChannelRouteTargetWithParser(...)`
    के नए उपयोग न जोड़ें।
    ये hook deprecated हैं और migration window के दौरान केवल पुराने Plugin के लिए बने रहते हैं।
    नए channel Plugin को target id normalization
    और directory-miss fallback के लिए `messaging.targetResolver.resolveTarget(...)`,
    core को early peer kind चाहिए होने पर `messaging.inferTargetChatType(...)`, और
    provider-native session और thread identity के लिए `messaging.resolveOutboundSessionRoute(...)`
    का उपयोग करना चाहिए।

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Import path संदर्भ

  <Accordion title="Common import path table">
  | इम्पोर्ट पथ | उद्देश्य | मुख्य निर्यात |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | कैननिकल Plugin प्रवेश सहायक | `definePluginEntry` |
  | `plugin-sdk/core` | चैनल प्रवेश परिभाषाओं/बिल्डरों के लिए लेगेसी अम्ब्रेला री-एक्सपोर्ट | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | रूट कॉन्फ़िग स्कीमा निर्यात | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | सिंगल-प्रोवाइडर प्रवेश सहायक | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | केंद्रित चैनल प्रवेश परिभाषाएं और बिल्डर | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | साझा सेटअप विज़र्ड सहायक | सेटअप अनुवादक, अनुमति-सूची प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
  | `plugin-sdk/setup-runtime` | सेटअप-समय runtime सहायक | `createSetupTranslator`, इम्पोर्ट-सुरक्षित सेटअप पैच अडैप्टर, लुकअप-नोट सहायक, `promptResolvedAllowFrom`, `splitSetupEntries`, प्रत्यायोजित सेटअप प्रॉक्सी |
  | `plugin-sdk/setup-adapter-runtime` | पदावनत सेटअप अडैप्टर उपनाम | `plugin-sdk/setup-runtime` का उपयोग करें |
  | `plugin-sdk/setup-tools` | सेटअप टूलिंग सहायक | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | मल्टी-अकाउंट सहायक | अकाउंट सूची/कॉन्फ़िग/एक्शन-गेट सहायक |
  | `plugin-sdk/account-id` | अकाउंट-id सहायक | `DEFAULT_ACCOUNT_ID`, अकाउंट-id सामान्यीकरण |
  | `plugin-sdk/account-resolution` | अकाउंट लुकअप सहायक | अकाउंट लुकअप + डिफ़ॉल्ट-फॉलबैक सहायक |
  | `plugin-sdk/account-helpers` | संकीर्ण अकाउंट सहायक | अकाउंट सूची/अकाउंट-एक्शन सहायक |
  | `plugin-sdk/channel-setup` | सेटअप विज़र्ड अडैप्टर | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM पेयरिंग प्रिमिटिव | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | रिप्लाई प्रीफ़िक्स, टाइपिंग, और स्रोत-डिलीवरी वायरिंग | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | कॉन्फ़िग अडैप्टर फ़ैक्टरी और DM एक्सेस सहायक | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | कॉन्फ़िग स्कीमा बिल्डर | साझा चैनल कॉन्फ़िग स्कीमा प्रिमिटिव और केवल जेनेरिक बिल्डर |
  | `plugin-sdk/bundled-channel-config-schema` | बंडल किए गए कॉन्फ़िग स्कीमा | केवल OpenClaw-मेंटेन किए गए बंडल Plugins; नए Plugins को Plugin-स्थानीय स्कीमा परिभाषित करने होंगे |
  | `plugin-sdk/channel-config-schema-legacy` | पदावनत बंडल किए गए कॉन्फ़िग स्कीमा | केवल संगतता उपनाम; मेंटेन किए गए बंडल Plugins के लिए `plugin-sdk/bundled-channel-config-schema` का उपयोग करें |
  | `plugin-sdk/telegram-command-config` | Telegram कमांड कॉन्फ़िग सहायक | कमांड-नाम सामान्यीकरण, विवरण ट्रिमिंग, डुप्लिकेट/संघर्ष सत्यापन |
  | `plugin-sdk/channel-policy` | समूह/DM नीति समाधान | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | पदावनत संगतता facade | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/inbound-envelope` | इनबाउंड एनवलप सहायक | साझा रूट + एनवलप बिल्डर सहायक |
  | `plugin-sdk/channel-inbound` | इनबाउंड रिसीव सहायक | संदर्भ बनाना, फ़ॉर्मैटिंग, रूट, रनर, तैयार रिप्लाई डिस्पैच, और डिस्पैच प्रेडिकेट |
  | `plugin-sdk/messaging-targets` | पदावनत लक्ष्य पार्सिंग इम्पोर्ट पथ | जेनेरिक लक्ष्य पार्सिंग सहायकों के लिए `plugin-sdk/channel-targets`, रूट तुलना के लिए `plugin-sdk/channel-route`, और प्रोवाइडर-विशिष्ट लक्ष्य समाधान के लिए Plugin-स्वामित्व वाले `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` का उपयोग करें |
  | `plugin-sdk/outbound-media` | आउटबाउंड मीडिया सहायक | साझा आउटबाउंड मीडिया लोडिंग |
  | `plugin-sdk/outbound-send-deps` | पदावनत संगतता facade | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/channel-outbound` | आउटबाउंड संदेश lifecycle सहायक | संदेश अडैप्टर, रसीदें, टिकाऊ भेजने के सहायक, लाइव प्रीव्यू/स्ट्रीमिंग सहायक, रिप्लाई विकल्प, lifecycle सहायक, आउटबाउंड पहचान, और पेलोड योजना |
  | `plugin-sdk/channel-streaming` | पदावनत संगतता facade | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/outbound-runtime` | पदावनत संगतता facade | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/thread-bindings-runtime` | थ्रेड-बाइंडिंग सहायक | थ्रेड-बाइंडिंग lifecycle और अडैप्टर सहायक |
  | `plugin-sdk/agent-media-payload` | लेगेसी मीडिया पेलोड सहायक | लेगेसी फ़ील्ड लेआउट के लिए एजेंट मीडिया पेलोड बिल्डर |
  | `plugin-sdk/channel-runtime` | पदावनत संगतता shim | केवल लेगेसी चैनल runtime उपयोगिताएं |
  | `plugin-sdk/channel-send-result` | भेजने के परिणाम प्रकार | रिप्लाई परिणाम प्रकार |
  | `plugin-sdk/runtime-store` | स्थायी Plugin स्टोरेज | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | व्यापक runtime सहायक | runtime/लॉगिंग/बैकअप/Plugin-इंस्टॉल सहायक |
  | `plugin-sdk/runtime-env` | संकीर्ण runtime env सहायक | लॉगर/runtime env, टाइमआउट, रीट्राई, और बैकऑफ़ सहायक |
  | `plugin-sdk/plugin-runtime` | साझा Plugin runtime सहायक | Plugin कमांड/हुक/http/इंटरैक्टिव सहायक |
  | `plugin-sdk/hook-runtime` | हुक पाइपलाइन सहायक | साझा Webhook/आंतरिक हुक पाइपलाइन सहायक |
  | `plugin-sdk/lazy-runtime` | Lazy runtime सहायक | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | प्रोसेस सहायक | साझा exec सहायक |
  | `plugin-sdk/cli-runtime` | CLI runtime सहायक | कमांड फ़ॉर्मैटिंग, प्रतीक्षा, संस्करण सहायक |
  | `plugin-sdk/gateway-runtime` | Gateway सहायक | Gateway क्लाइंट, इवेंट-लूप-तैयार स्टार्ट सहायक, और चैनल-स्थिति पैच सहायक |
  | `plugin-sdk/config-runtime` | पदावनत कॉन्फ़िग संगतता shim | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, और `config-mutation` को प्राथमिकता दें |
  | `plugin-sdk/telegram-command-config` | Telegram कमांड सहायक | बंडल किए गए Telegram अनुबंध सतह के अनुपलब्ध होने पर फॉलबैक-स्थिर Telegram कमांड सत्यापन सहायक |
  | `plugin-sdk/approval-runtime` | स्वीकृति प्रॉम्प्ट सहायक | Exec/Plugin स्वीकृति पेलोड, स्वीकृति क्षमता/प्रोफ़ाइल सहायक, native स्वीकृति रूटिंग/runtime सहायक, और संरचित स्वीकृति डिस्प्ले पथ फ़ॉर्मैटिंग |
  | `plugin-sdk/approval-auth-runtime` | स्वीकृति auth सहायक | स्वीकर्ता समाधान, same-chat एक्शन auth |
  | `plugin-sdk/approval-client-runtime` | स्वीकृति क्लाइंट सहायक | Native exec स्वीकृति प्रोफ़ाइल/फ़िल्टर सहायक |
  | `plugin-sdk/approval-delivery-runtime` | स्वीकृति डिलीवरी सहायक | Native स्वीकृति क्षमता/डिलीवरी अडैप्टर |
  | `plugin-sdk/approval-gateway-runtime` | स्वीकृति Gateway सहायक | साझा स्वीकृति Gateway-समाधान सहायक |
  | `plugin-sdk/approval-handler-adapter-runtime` | स्वीकृति अडैप्टर सहायक | hot चैनल entrypoints के लिए हल्के native स्वीकृति अडैप्टर लोडिंग सहायक |
  | `plugin-sdk/approval-handler-runtime` | स्वीकृति हैंडलर सहायक | व्यापक स्वीकृति हैंडलर runtime सहायक; पर्याप्त होने पर संकरे अडैप्टर/Gateway seams को प्राथमिकता दें |
  | `plugin-sdk/approval-native-runtime` | स्वीकृति लक्ष्य सहायक | Native स्वीकृति लक्ष्य/अकाउंट बाइंडिंग सहायक |
  | `plugin-sdk/approval-reply-runtime` | स्वीकृति रिप्लाई सहायक | Exec/Plugin स्वीकृति रिप्लाई पेलोड सहायक |
  | `plugin-sdk/channel-runtime-context` | चैनल runtime-संदर्भ सहायक | जेनेरिक चैनल runtime-संदर्भ register/get/watch सहायक |
  | `plugin-sdk/security-runtime` | सुरक्षा सहायक | साझा trust, DM gating, root-bounded फ़ाइल/पथ सहायक, external-content, और secret-collection सहायक |
  | `plugin-sdk/ssrf-policy` | SSRF नीति सहायक | होस्ट अनुमति-सूची और private-network नीति सहायक |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime सहायक | pinned-dispatcher, guarded fetch, SSRF नीति सहायक |
  | `plugin-sdk/system-event-runtime` | सिस्टम इवेंट सहायक | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat सहायक | Heartbeat wake, event, और visibility सहायक |
  | `plugin-sdk/delivery-queue-runtime` | डिलीवरी क्यू सहायक | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | चैनल गतिविधि सहायक | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe सहायक | इन-मेमोरी dedupe कैश |
  | `plugin-sdk/file-access-runtime` | फ़ाइल एक्सेस सहायक | सुरक्षित लोकल-फ़ाइल/मीडिया पथ सहायक |
  | `plugin-sdk/transport-ready-runtime` | ट्रांसपोर्ट readiness सहायक | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec स्वीकृति नीति सहायक | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | सीमित कैश सहायक | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | डायग्नॉस्टिक gating सहायक | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | त्रुटि फ़ॉर्मैटिंग सहायक | `formatUncaughtError`, `isApprovalNotFoundError`, त्रुटि ग्राफ सहायक |
  | `plugin-sdk/fetch-runtime` | Wrapped fetch/proxy सहायक | `resolveFetch`, proxy सहायक, EnvHttpProxyAgent विकल्प सहायक |
  | `plugin-sdk/host-runtime` | होस्ट सामान्यीकरण सहायक | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | रीट्राई सहायक | `RetryConfig`, `retryAsync`, नीति रनर |
  | `plugin-sdk/allow-from` | अनुमति-सूची फ़ॉर्मैटिंग और इनपुट मैपिंग | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | कमांड gating और कमांड-सतह सहायक | `resolveControlCommandGate`, प्रेषक-अधिकारीकरण सहायक, डायनेमिक आर्ग्युमेंट मेनू फ़ॉर्मैटिंग सहित कमांड रजिस्ट्री सहायक |
  | `plugin-sdk/command-status` | कमांड स्थिति/सहायता renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | सीक्रेट इनपुट पार्सिंग | सीक्रेट इनपुट सहायक |
  | `plugin-sdk/webhook-ingress` | Webhook अनुरोध सहायक | Webhook लक्ष्य उपयोगिताएं |
  | `plugin-sdk/webhook-request-guards` | Webhook बॉडी guard सहायक | अनुरोध बॉडी read/limit सहायक |
  | `plugin-sdk/reply-runtime` | साझा रिप्लाई runtime | इनबाउंड डिस्पैच, Heartbeat, रिप्लाई planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | संकीर्ण रिप्लाई डिस्पैच सहायक | Finalize, प्रोवाइडर डिस्पैच, और conversation-label सहायक |
  | `plugin-sdk/reply-history` | रिप्लाई-इतिहास सहायक | `createChannelHistoryWindow`; पदावनत map-helper संगतता निर्यात जैसे `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, और `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | रिप्लाई संदर्भ योजना | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | रिप्लाई chunk सहायक | टेक्स्ट/markdown chunking सहायक |
  | `plugin-sdk/session-store-runtime` | सेशन स्टोर सहायक | स्टोर पथ + updated-at सहायक |
  | `plugin-sdk/state-paths` | स्टेट पथ सहायक | स्टेट और OAuth dir सहायक |
  | `plugin-sdk/routing` | रूटिंग/session-key सहायक | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key सामान्यीकरण सहायक |
  | `plugin-sdk/status-helpers` | चैनल स्थिति सहायक | चैनल/खाता स्थिति सारांश बिल्डर, runtime-state डिफॉल्ट, समस्या मेटाडेटा सहायक |
  | `plugin-sdk/target-resolver-runtime` | लक्ष्य रिज़ॉल्वर सहायक | साझा लक्ष्य रिज़ॉल्वर सहायक |
  | `plugin-sdk/string-normalization-runtime` | स्ट्रिंग सामान्यीकरण सहायक | स्लग/स्ट्रिंग सामान्यीकरण सहायक |
  | `plugin-sdk/request-url` | अनुरोध URL सहायक | अनुरोध-जैसे इनपुट से स्ट्रिंग URL निकालें |
  | `plugin-sdk/run-command` | समयबद्ध कमांड सहायक | सामान्यीकृत stdout/stderr वाला समयबद्ध कमांड रनर |
  | `plugin-sdk/param-readers` | पैरामीटर रीडर | सामान्य टूल/CLI पैरामीटर रीडर |
  | `plugin-sdk/tool-payload` | टूल पेलोड निष्कर्षण | टूल परिणाम ऑब्जेक्ट से सामान्यीकृत पेलोड निकालें |
  | `plugin-sdk/tool-send` | टूल भेजने का निष्कर्षण | टूल आर्ग्स से कैनॉनिकल भेजने के लक्ष्य फ़ील्ड निकालें |
  | `plugin-sdk/temp-path` | अस्थायी पथ सहायक | साझा अस्थायी-डाउनलोड पथ सहायक |
  | `plugin-sdk/logging-core` | लॉगिंग सहायक | सबसिस्टम लॉगर और रिडैक्शन सहायक |
  | `plugin-sdk/markdown-table-runtime` | Markdown-तालिका सहायक | Markdown तालिका मोड सहायक |
  | `plugin-sdk/reply-payload` | संदेश उत्तर प्रकार | उत्तर पेलोड प्रकार |
  | `plugin-sdk/provider-setup` | चयनित स्थानीय/स्व-होस्टेड प्रदाता सेटअप सहायक | स्व-होस्टेड प्रदाता खोज/कॉन्फ़िग सहायक |
  | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्व-होस्टेड प्रदाता सेटअप सहायक | वही स्व-होस्टेड प्रदाता खोज/कॉन्फ़िग सहायक |
  | `plugin-sdk/provider-auth-runtime` | प्रदाता रनटाइम प्रमाणीकरण सहायक | रनटाइम API-key रिज़ॉल्यूशन सहायक |
  | `plugin-sdk/provider-auth-api-key` | प्रदाता API-key सेटअप सहायक | API-key ऑनबोर्डिंग/प्रोफ़ाइल-राइट सहायक |
  | `plugin-sdk/provider-auth-result` | प्रदाता auth-result सहायक | मानक OAuth auth-result बिल्डर |
  | `plugin-sdk/provider-selection-runtime` | प्रदाता चयन सहायक | कॉन्फ़िगर-या-स्वचालित प्रदाता चयन और कच्चे प्रदाता कॉन्फ़िग का मर्ज |
  | `plugin-sdk/provider-env-vars` | प्रदाता env-var सहायक | प्रदाता प्रमाणीकरण env-var लुकअप सहायक |
  | `plugin-sdk/provider-model-shared` | साझा प्रदाता मॉडल/रीप्ले सहायक | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा रीप्ले-नीति बिल्डर, प्रदाता-एंडपॉइंट सहायक, और मॉडल-id सामान्यीकरण सहायक |
  | `plugin-sdk/provider-catalog-shared` | साझा प्रदाता कैटलॉग सहायक | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | प्रदाता ऑनबोर्डिंग पैच | ऑनबोर्डिंग कॉन्फ़िग सहायक |
  | `plugin-sdk/provider-http` | प्रदाता HTTP सहायक | सामान्य प्रदाता HTTP/एंडपॉइंट क्षमता सहायक, जिनमें ऑडियो ट्रांसक्रिप्शन multipart form सहायक शामिल हैं |
  | `plugin-sdk/provider-web-fetch` | प्रदाता web-fetch सहायक | Web-fetch प्रदाता पंजीकरण/कैश सहायक |
  | `plugin-sdk/provider-web-search-config-contract` | प्रदाता web-search कॉन्फ़िग सहायक | उन प्रदाताओं के लिए संकीर्ण web-search कॉन्फ़िग/क्रेडेंशियल सहायक जिन्हें plugin-enable वायरिंग की आवश्यकता नहीं है |
  | `plugin-sdk/provider-web-search-contract` | प्रदाता web-search कॉन्ट्रैक्ट सहायक | संकीर्ण web-search कॉन्फ़िग/क्रेडेंशियल कॉन्ट्रैक्ट सहायक जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और स्कोप किए गए क्रेडेंशियल सेटर/गेटर |
  | `plugin-sdk/provider-web-search` | प्रदाता web-search सहायक | Web-search प्रदाता पंजीकरण/कैश/रनटाइम सहायक |
  | `plugin-sdk/provider-tools` | प्रदाता टूल/schema संगतता सहायक | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI schema सफ़ाई + निदान |
  | `plugin-sdk/provider-usage` | प्रदाता उपयोग सहायक | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, और अन्य प्रदाता उपयोग सहायक |
  | `plugin-sdk/provider-stream` | प्रदाता स्ट्रीम रैपर सहायक | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, स्ट्रीम रैपर प्रकार, और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot रैपर सहायक |
  | `plugin-sdk/provider-transport-runtime` | प्रदाता ट्रांसपोर्ट सहायक | मूल प्रदाता ट्रांसपोर्ट सहायक जैसे सुरक्षित fetch, tool-result टेक्स्ट निष्कर्षण, ट्रांसपोर्ट संदेश रूपांतरण, और लिखने योग्य ट्रांसपोर्ट इवेंट स्ट्रीम |
  | `plugin-sdk/keyed-async-queue` | क्रमबद्ध async कतार | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | साझा मीडिया सहायक | मीडिया fetch/transform/store सहायक, ffprobe-समर्थित वीडियो आयाम जांच, और मीडिया पेलोड बिल्डर |
  | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन सहायक | इमेज/वीडियो/संगीत जनरेशन के लिए साझा failover सहायक, उम्मीदवार चयन, और missing-model संदेश |
  | `plugin-sdk/media-understanding` | मीडिया-understanding सहायक | मीडिया understanding प्रदाता प्रकार और प्रदाता-मुखी इमेज/ऑडियो सहायक एक्सपोर्ट |
  | `plugin-sdk/text-runtime` | बहिष्कृत व्यापक टेक्स्ट संगतता एक्सपोर्ट | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, और `logging-core` का उपयोग करें |
  | `plugin-sdk/text-chunking` | टेक्स्ट चंकिंग सहायक | आउटबाउंड टेक्स्ट चंकिंग सहायक |
  | `plugin-sdk/speech` | Speech सहायक | Speech प्रदाता प्रकार और प्रदाता-मुखी निर्देश, रजिस्ट्री, सत्यापन सहायक, और OpenAI-संगत TTS बिल्डर |
  | `plugin-sdk/speech-core` | साझा speech कोर | Speech प्रदाता प्रकार, रजिस्ट्री, निर्देश, सामान्यीकरण |
  | `plugin-sdk/realtime-transcription` | रीयलटाइम ट्रांसक्रिप्शन सहायक | प्रदाता प्रकार, रजिस्ट्री सहायक, और साझा WebSocket सेशन सहायक |
  | `plugin-sdk/realtime-voice` | रीयलटाइम वॉइस सहायक | प्रदाता प्रकार, रजिस्ट्री/रिज़ॉल्यूशन सहायक, ब्रिज सेशन सहायक, साझा एजेंट talk-back कतारें, active-run वॉइस नियंत्रण, transcript/event स्वास्थ्य, echo suppression, consult question matching, forced-consult coordination, turn-context tracking, output activity tracking, और तेज़ context consult सहायक |
  | `plugin-sdk/image-generation` | इमेज-जनरेशन सहायक | इमेज जनरेशन प्रदाता प्रकार और इमेज एसेट/data URL सहायक तथा OpenAI-संगत इमेज प्रदाता बिल्डर |
  | `plugin-sdk/image-generation-core` | साझा इमेज-जनरेशन कोर | इमेज-जनरेशन प्रकार, failover, प्रमाणीकरण, और रजिस्ट्री सहायक |
  | `plugin-sdk/music-generation` | संगीत-जनरेशन सहायक | संगीत-जनरेशन प्रदाता/request/result प्रकार |
  | `plugin-sdk/music-generation-core` | साझा संगीत-जनरेशन कोर | संगीत-जनरेशन प्रकार, failover सहायक, प्रदाता लुकअप, और model-ref पार्सिंग |
  | `plugin-sdk/video-generation` | वीडियो-जनरेशन सहायक | वीडियो-जनरेशन प्रदाता/request/result प्रकार |
  | `plugin-sdk/video-generation-core` | साझा वीडियो-जनरेशन कोर | वीडियो-जनरेशन प्रकार, failover सहायक, प्रदाता लुकअप, और model-ref पार्सिंग |
  | `plugin-sdk/interactive-runtime` | इंटरैक्टिव उत्तर सहायक | इंटरैक्टिव उत्तर पेलोड सामान्यीकरण/कमीकरण |
  | `plugin-sdk/channel-config-primitives` | चैनल कॉन्फ़िग प्रिमिटिव | संकीर्ण चैनल config-schema प्रिमिटिव |
  | `plugin-sdk/channel-config-writes` | चैनल config-write सहायक | चैनल config-write प्राधिकरण सहायक |
  | `plugin-sdk/channel-plugin-common` | साझा चैनल प्रस्तावना | साझा चैनल Plugin प्रस्तावना एक्सपोर्ट |
  | `plugin-sdk/channel-status` | चैनल स्थिति सहायक | साझा चैनल स्थिति snapshot/summary सहायक |
  | `plugin-sdk/allowlist-config-edit` | Allowlist कॉन्फ़िग सहायक | Allowlist कॉन्फ़िग edit/read सहायक |
  | `plugin-sdk/group-access` | समूह एक्सेस सहायक | साझा समूह-एक्सेस निर्णय सहायक |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | बहिष्कृत संगतता facade | `plugin-sdk/channel-inbound` का उपयोग करें |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM गार्ड सहायक | संकीर्ण pre-crypto गार्ड नीति सहायक |
  | `plugin-sdk/extension-shared` | साझा एक्सटेंशन सहायक | passive-channel/status और ambient proxy सहायक प्रिमिटिव |
  | `plugin-sdk/webhook-targets` | Webhook लक्ष्य सहायक | Webhook लक्ष्य रजिस्ट्री और route-install सहायक |
  | `plugin-sdk/webhook-path` | बहिष्कृत webhook पथ alias | `plugin-sdk/webhook-ingress` का उपयोग करें |
  | `plugin-sdk/web-media` | साझा वेब मीडिया सहायक | रिमोट/स्थानीय मीडिया लोडिंग सहायक |
  | `plugin-sdk/zod` | बहिष्कृत Zod संगतता re-export | `zod` को सीधे `zod` से आयात करें |
  | `plugin-sdk/memory-core` | बंडल किए गए memory-core सहायक | Memory मैनेजर/कॉन्फ़िग/फ़ाइल/CLI सहायक सतह |
  | `plugin-sdk/memory-core-engine-runtime` | Memory इंजन रनटाइम facade | Memory इंडेक्स/सर्च रनटाइम facade |
  | `plugin-sdk/memory-core-host-embedding-registry` | Memory embedding रजिस्ट्री | हल्के memory embedding प्रदाता रजिस्ट्री सहायक |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory होस्ट foundation इंजन | Memory होस्ट foundation इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory होस्ट embedding इंजन | Memory embedding कॉन्ट्रैक्ट, रजिस्ट्री एक्सेस, स्थानीय प्रदाता, और सामान्य batch/remote सहायक; ठोस रिमोट प्रदाता अपने स्वामी plugins में रहते हैं |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory होस्ट QMD इंजन | Memory होस्ट QMD इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory होस्ट storage इंजन | Memory होस्ट storage इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-multimodal` | Memory होस्ट multimodal सहायक | Memory होस्ट multimodal सहायक |
  | `plugin-sdk/memory-core-host-query` | Memory होस्ट query सहायक | Memory होस्ट query सहायक |
  | `plugin-sdk/memory-core-host-secret` | Memory होस्ट secret सहायक | Memory होस्ट secret सहायक |
  | `plugin-sdk/memory-core-host-events` | बहिष्कृत memory event alias | `plugin-sdk/memory-host-events` का उपयोग करें |
  | `plugin-sdk/memory-core-host-status` | Memory होस्ट स्थिति सहायक | Memory होस्ट स्थिति सहायक |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory होस्ट CLI रनटाइम | Memory होस्ट CLI रनटाइम सहायक |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory होस्ट कोर रनटाइम | Memory होस्ट कोर रनटाइम सहायक |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory होस्ट फ़ाइल/रनटाइम सहायक | Memory होस्ट फ़ाइल/रनटाइम सहायक |
  | `plugin-sdk/memory-host-core` | Memory होस्ट कोर रनटाइम alias | Memory होस्ट कोर रनटाइम सहायक के लिए vendor-neutral alias |
  | `plugin-sdk/memory-host-events` | Memory होस्ट इवेंट journal alias | Memory होस्ट इवेंट journal सहायक के लिए vendor-neutral alias |
  | `plugin-sdk/memory-host-files` | बहिष्कृत memory फ़ाइल/रनटाइम alias | `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
  | `plugin-sdk/memory-host-markdown` | प्रबंधित markdown सहायक | memory-adjacent plugins के लिए साझा managed-markdown सहायक |
  | `plugin-sdk/memory-host-search` | Active Memory search facade | Lazy active-memory search-manager रनटाइम facade |
  | `plugin-sdk/memory-host-status` | बहिष्कृत memory होस्ट स्थिति alias | `plugin-sdk/memory-core-host-status` का उपयोग करें |
  | `plugin-sdk/testing` | परीक्षण उपयोगिताएँ | Repo-local बहिष्कृत संगतता barrel; केंद्रित repo-local परीक्षण subpaths जैसे `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, और `plugin-sdk/test-fixtures` का उपयोग करें |
</Accordion>

यह तालिका जानबूझकर सामान्य माइग्रेशन उपसमुच्चय है, पूर्ण SDK
सतह नहीं। compiler entrypoint inventory
`scripts/lib/plugin-sdk-entrypoints.json` में रहता है; पैकेज exports
सार्वजनिक उपसमुच्चय से जनरेट किए जाते हैं।

आरक्षित बंडल किए गए Plugin helper seams को सार्वजनिक SDK
export map से हटा दिया गया है, सिवाय स्पष्ट रूप से दस्तावेजीकृत संगतता facades के,
जैसे प्रकाशित `@openclaw/discord@2026.3.13` पैकेज के लिए बनाए रखा गया
पदावनत `plugin-sdk/discord` shim। owner-specific helpers स्वामी Plugin पैकेज के
अंदर रहते हैं; साझा host व्यवहार को `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime`, और `plugin-sdk/plugin-config-runtime` जैसे
generic SDK contracts के माध्यम से जाना चाहिए।

काम से मेल खाने वाला सबसे संकीर्ण import उपयोग करें। यदि आपको कोई export नहीं मिलता,
तो `src/plugin-sdk/` में source देखें या maintainers से पूछें कि कौन सा generic contract
इसका स्वामी होना चाहिए।

## सक्रिय पदावनतियां

संकीर्ण पदावनतियां जो Plugin SDK, provider contract,
runtime surface, और manifest पर लागू होती हैं। हर एक आज भी काम करता है लेकिन
भविष्य की major release में हटाया जाएगा। हर आइटम के नीचे की entry पुराने API को
उसके canonical replacement से map करती है।

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **पुराना (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **नया (`openclaw/plugin-sdk/command-status`)**: वही signatures, वही
    exports - बस संकरे subpath से imported। `command-auth`
    इन्हें compat stubs के रूप में re-export करता है।

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **पुराना**: `openclaw/plugin-sdk/channel-inbound` या
    `openclaw/plugin-sdk/channel-mention-gating` से
    `resolveInboundMentionRequirement({ facts, policy })` और
    `shouldDropInboundForMention(...)`।

    **नया**: `resolveInboundMentionDecision({ facts, policy })` - दो split calls
    के बजाय एक single decision object लौटाता है।

    Downstream channel plugins (Slack, Discord, Matrix, MS Teams) पहले ही
    switch कर चुके हैं।

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` पुराने channel plugins के लिए
    compatibility shim है। नए code से इसे import न करें; runtime
    objects register करने के लिए `openclaw/plugin-sdk/channel-runtime-context`
    उपयोग करें।

    `openclaw/plugin-sdk/channel-actions` में `channelActions*` helpers
    raw "actions" channel exports के साथ पदावनत हैं। इसके बजाय semantic
    `presentation` surface के माध्यम से capabilities expose करें - channel plugins
    बताते हैं कि वे क्या render करते हैं (cards, buttons, selects), न कि वे कौन से raw
    action names accept करते हैं।

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **पुराना**: `openclaw/plugin-sdk/provider-web-search` से `tool()` factory।

    **नया**: provider Plugin पर सीधे `createTool(...)` implement करें।
    OpenClaw को tool wrapper register करने के लिए अब SDK helper की जरूरत नहीं है।

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **पुराना**: inbound channel messages से flat plaintext prompt
    envelope बनाने के लिए `formatInboundEnvelope(...)` (और
    `ChannelMessageForAgent.channelEnvelope`)।

    **नया**: `BodyForAgent` और structured user-context blocks। Channel
    plugins routing metadata (thread, topic, reply-to, reactions) को prompt string में
    जोड़ने के बजाय typed fields के रूप में attach करते हैं। synthesized
    assistant-facing envelopes के लिए `formatAgentEnvelope(...)` helper अभी भी
    supported है, लेकिन inbound plaintext envelopes हटाए जाने की दिशा में हैं।

    प्रभावित क्षेत्र: `inbound_claim`, `message_received`, और कोई भी custom
    channel Plugin जिसने `channelEnvelope` text को post-process किया।

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **पुराना**: `api.on("deactivate", handler)`।

    **नया**: `api.on("gateway_stop", handler)`। event और context वही
    shutdown cleanup contract हैं; केवल hook नाम बदलता है।

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` 2026-08-16 के बाद तक deprecated compatibility alias के रूप में wired रहता है।

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **पुराना**: `api.on("subagent_spawning", handler)` जो
    `threadBindingReady` या `deliveryOrigin` लौटाता था।

    **नया**: core को channel session-binding adapter के माध्यम से
    `thread: true` subagent bindings तैयार करने दें। केवल post-launch observation के लिए
    `api.on("subagent_spawned", handler)` उपयोग करें।

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, और
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` केवल
    deprecated compatibility surfaces के रूप में रहते हैं, जब तक external plugins migrate करते हैं।

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    चार discovery type aliases अब catalog-era types पर thin wrappers हैं:

    | पुराना alias                | नया type                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    साथ ही legacy `ProviderCapabilities` static bag - provider plugins को
    static object के बजाय `buildReplayPolicy`,
    `normalizeToolSchemas`, और `wrapStreamFn` जैसे explicit provider hooks उपयोग करने चाहिए।

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **पुराना** (`ProviderThinkingPolicy` पर तीन अलग hooks):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, और
    `resolveDefaultThinkingLevel(ctx)`।

    **नया**: एक single `resolveThinkingProfile(ctx)` जो canonical `id`,
    optional `label`, और ranked level list के साथ
    `ProviderThinkingProfile` लौटाता है। OpenClaw profile
    rank के आधार पर stale stored values को अपने आप downgrade करता है।

    context में `provider`, `modelId`, optional merged `reasoning`,
    और optional merged model `compat` facts शामिल हैं। Provider plugins उन
    catalog facts का उपयोग करके model-specific profile केवल तब expose कर सकते हैं
    जब configured request contract इसे support करता हो।

    तीन के बजाय एक hook implement करें। legacy hooks deprecation window के दौरान
    काम करते रहेंगे, लेकिन profile result के साथ composed नहीं होते।

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **पुराना**: Plugin manifest में provider declare किए बिना external auth hooks
    implement करना।

    **नया**: Plugin manifest में `contracts.externalAuthProviders` declare करें
    **और** `resolveExternalAuthProfiles(...)` implement करें।

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **पुराना** manifest field: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **नया**: उसी env-var lookup को manifest पर `setup.providers[].envVars`
    में mirror करें। यह setup/status env metadata को एक जगह consolidate करता है
    और सिर्फ env-var lookups का जवाब देने के लिए Plugin runtime boot करने से बचाता है।

    `providerAuthEnvVars` deprecation window बंद होने तक compatibility adapter
    के माध्यम से supported रहता है।

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **पुराना**: तीन अलग calls -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **नया**: memory-state API पर एक call -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    वही slots, single registration call। Additive prompt और corpus helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    प्रभावित नहीं हैं।

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **पुराना**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **नया**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    generic embedding provider contract memory के बाहर भी reusable है और
    नए providers के लिए supported path है। memory-specific registration API
    existing providers के migrate होने तक deprecated compatibility के रूप में wired रहता है।
    Plugin inspection non-bundled usage को compatibility debt के रूप में report करता है।

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    `src/plugins/runtime/types.ts` से अभी भी exported दो legacy type aliases:

    | पुराना                         | नया                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    runtime method `readSession`, `getSessionMessages` के पक्ष में deprecated है।
    वही signature; पुराना method नए method को call through करता है।

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **पुराना**: `runtime.tasks.flow` (singular) ने live task-flow accessor लौटाया।

    **नया**: `runtime.tasks.managedFlows` उन plugins के लिए managed TaskFlow mutation
    runtime रखता है जो flow से child tasks create, update, cancel, या run करते हैं।
    जब Plugin को केवल DTO-based reads चाहिए हों, तो `runtime.tasks.flows` उपयोग करें।

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ऊपर "कैसे migrate करें → embedded tool-result extensions को middleware में migrate करें"
    में covered। completeness के लिए यहां शामिल: हटाया गया embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)` path
    `api.registerAgentToolResultMiddleware(...)` से replace होता है, जिसमें
    `contracts.agentToolResultMiddleware` में explicit runtime list होती है।
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` से re-exported `OpenClawSchemaType` अब
    `OpenClawConfig` के लिए one-line alias है। canonical name को प्राथमिकता दें।

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Extension-level deprecations (`extensions/` के अंतर्गत bundled channel/provider plugins के अंदर)
उनके अपने `api.ts` और `runtime-api.ts` barrels में track की जाती हैं।
वे third-party Plugin contracts को प्रभावित नहीं करतीं और यहां listed नहीं हैं।
यदि आप bundled Plugin के local barrel को सीधे consume करते हैं, तो upgrade करने से पहले
उस barrel में deprecation comments पढ़ें।
</Note>

## हटाने की समयरेखा

| कब                    | क्या होता है                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **अभी**                | पदावनत सतहें runtime चेतावनियाँ उत्सर्जित करती हैं                               |
| **अगली major release** | पदावनत सतहें हटा दी जाएँगी; जो plugins अब भी उनका उपयोग कर रहे होंगे वे विफल होंगे |

सभी core plugins पहले ही माइग्रेट किए जा चुके हैं। बाहरी plugins को
अगली major release से पहले माइग्रेट करना चाहिए।

## चेतावनियों को अस्थायी रूप से दबाना

माइग्रेशन पर काम करते समय ये environment variables सेट करें:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

यह एक अस्थायी escape hatch है, स्थायी समाधान नहीं।

## संबंधित

- [शुरुआत करें](/hi/plugins/building-plugins) - अपना पहला plugin बनाएँ
- [SDK अवलोकन](/hi/plugins/sdk-overview) - पूरा subpath import संदर्भ
- [चैनल Plugins](/hi/plugins/sdk-channel-plugins) - channel plugins बनाना
- [प्रदाता Plugins](/hi/plugins/sdk-provider-plugins) - provider plugins बनाना
- [Plugin आंतरिक विवरण](/hi/plugins/architecture) - architecture की गहन जानकारी
- [Plugin Manifest](/hi/plugins/manifest) - manifest schema संदर्भ
