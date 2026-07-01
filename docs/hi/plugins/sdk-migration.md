---
read_when:
    - आपको OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED चेतावनी दिखाई देती है
    - आपको OPENCLAW_EXTENSION_API_DEPRECATED चेतावनी दिखाई देती है
    - आपने OpenClaw 2026.4.25 से पहले api.registerEmbeddedExtensionFactory का उपयोग किया
    - आप एक Plugin को आधुनिक Plugin आर्किटेक्चर में अपडेट कर रहे हैं
    - आप एक बाहरी OpenClaw Plugin का रखरखाव करते हैं
sidebarTitle: Migrate to SDK
summary: लेगेसी पश्चगामी-संगतता परत से आधुनिक Plugin SDK पर माइग्रेट करें
title: Plugin SDK माइग्रेशन
x-i18n:
    generated_at: "2026-07-01T13:01:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw व्यापक पिछली-संगतता परत से हटकर केंद्रित, प्रलेखित imports वाले आधुनिक plugin
आर्किटेक्चर पर आ गया है। यदि आपका plugin नए आर्किटेक्चर से पहले बनाया गया था,
तो यह मार्गदर्शिका आपको migrate करने में मदद करती है।

## क्या बदल रहा है

पुराना plugin सिस्टम दो व्यापक खुले surfaces प्रदान करता था, जिनसे plugins एक ही
entry point से अपनी आवश्यकता की कोई भी चीज import कर सकते थे:

- **`openclaw/plugin-sdk/compat`** - एक single import जो दर्जनों
  helpers को फिर से export करता था। इसे पुराने hook-based plugins को काम करते रखने
  के लिए पेश किया गया था, जबकि नया plugin आर्किटेक्चर बनाया जा रहा था।
- **`openclaw/plugin-sdk/infra-runtime`** - एक व्यापक runtime helper barrel जो
  system events, heartbeat state, delivery queues, fetch/proxy helpers,
  file helpers, approval types, और असंबंधित utilities को मिलाता था।
- **`openclaw/plugin-sdk/config-runtime`** - एक व्यापक config compatibility barrel
  जो migration window के दौरान अभी भी deprecated direct load/write helpers रखता है।
- **`openclaw/extension-api`** - एक bridge जिसने plugins को embedded agent runner
  जैसे host-side helpers तक सीधी पहुंच दी।
- **`api.registerEmbeddedExtensionFactory(...)`** - हटाया गया embedded-runner-only bundled
  extension hook जो `tool_result` जैसे embedded-runner events को observe कर सकता था।

व्यापक import surfaces अब **deprecated** हैं। वे runtime पर अभी भी काम करते हैं,
लेकिन नए plugins को उनका उपयोग नहीं करना चाहिए, और मौजूदा plugins को अगले major
release में इन्हें हटाए जाने से पहले migrate कर लेना चाहिए। embedded-runner-only
extension factory registration API हटा दी गई है; इसके बजाय tool-result middleware
का उपयोग करें।

OpenClaw documented plugin behavior को उसी change में remove या reinterpret नहीं करता
जो replacement पेश करता है। Breaking contract changes को पहले compatibility adapter,
diagnostics, docs, और deprecation window से गुजरना होगा। यह SDK imports, manifest fields,
setup APIs, hooks, और runtime registration behavior पर लागू होता है।

<Warning>
  पिछली-संगतता परत भविष्य के major release में हटा दी जाएगी।
  जो plugins अभी भी इन surfaces से import करते हैं, उस समय टूट जाएंगे।
  Legacy embedded extension factory registrations पहले ही अब load नहीं होते।
</Warning>

## यह क्यों बदला

पुराने approach से समस्याएं हुईं:

- **धीमा startup** - एक helper import करने से दर्जनों असंबंधित modules load हो जाते थे
- **Circular dependencies** - व्यापक re-exports से import cycles बनाना आसान हो गया
- **अस्पष्ट API surface** - यह बताने का कोई तरीका नहीं था कि कौन से exports stable थे और कौन से internal

आधुनिक plugin SDK इसे ठीक करता है: प्रत्येक import path (`openclaw/plugin-sdk/\<subpath\>`)
एक छोटा, self-contained module है जिसका उद्देश्य स्पष्ट और contract documented है।

bundled channels के लिए legacy provider convenience seams भी अब हट गए हैं।
Channel-branded helper seams private mono-repo shortcuts थे, stable
plugin contracts नहीं। इसके बजाय narrow generic SDK subpaths का उपयोग करें। bundled
plugin workspace के अंदर, provider-owned helpers को उस plugin के अपने `api.ts` या
`runtime-api.ts` में रखें।

वर्तमान bundled provider examples:

- Anthropic Claude-specific stream helpers को अपने `api.ts` /
  `contract-api.ts` seam में रखता है
- OpenAI provider builders, default-model helpers, और realtime provider
  builders को अपने `api.ts` में रखता है
- OpenRouter provider builder और onboarding/config helpers को अपने
  `api.ts` में रखता है

## Talk और realtime voice migration योजना

Realtime voice, telephony, meeting, और browser Talk code
surface-local turn bookkeeping से `openclaw/plugin-sdk/realtime-voice` द्वारा
export किए गए shared Talk session controller पर जा रहा है। नया controller common Talk
event envelope, active turn state, capture state, output-audio state, recent
event history, और stale-turn rejection का मालिक है। Provider plugins को
vendor-specific realtime sessions का ownership बनाए रखना चाहिए; surface plugins को capture,
playback, telephony, और meeting quirks का ownership बनाए रखना चाहिए।

यह Talk migration जानबूझकर breaking-clean है:

1. shared controller/runtime primitives को
   `plugin-sdk/realtime-voice` में रखें।
2. bundled surfaces को shared controller पर ले जाएं: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, और native push-to-talk।
3. पुराने Talk RPC families को final `talk.session.*` और
   `talk.client.*` API से replace करें।
4. Gateway `hello-ok.features.events` में एक live Talk event channel advertise करें:
   `talk.event`।
5. पुराने realtime HTTP endpoint और किसी भी request-time instruction
   override path को delete करें।

नए code को `createTalkEventSequencer(...)` सीधे call नहीं करना चाहिए, जब तक कि वह
low-level adapter या test fixture implement न कर रहा हो। shared controller को प्राथमिकता दें
ताकि turn-scoped events turn id के बिना emit न हो सकें, stale `turnEnd` /
`turnCancel` calls किसी नए active turn को clear न कर सकें, और output-audio lifecycle
events telephony, meetings, browser relay, managed-room
handoff, और native Talk clients में consistent रहें।

लक्षित public API shape है:

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
क्योंकि browser provider negotiation और media transport का मालिक है जबकि
Gateway credentials, instructions, और tool policy का मालिक है। `talk.session.*`
gateway-relay realtime, gateway-relay transcription, और managed-room native STT/TTS sessions के लिए
common Gateway-managed surface है।

Legacy configs जिन्होंने realtime selectors को `talk.provider` /
`talk.providers` के पास रखा था, उन्हें `openclaw doctor --fix` से repair किया जाना चाहिए; runtime Talk
speech/TTS provider config को realtime provider config के रूप में reinterpret नहीं करता।

समर्थित `talk.session.create` combinations जानबूझकर छोटे हैं:

| Mode            | Transport       | Brain           | Owner              | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway के माध्यम से bridged full-duplex provider audio; tool calls agent-consult tool के माध्यम से route किए जाते हैं।      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | केवल streaming STT; callers input audio भेजते हैं और transcript events प्राप्त करते हैं।                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk और walkie-talkie style rooms जहां client capture/playback का मालिक है और Gateway turn state का मालिक है। |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | trusted first-party surfaces के लिए admin-only room mode जो Gateway tool actions सीधे execute करते हैं।                  |

हटाया गया method map:

| पुराना                              | नया                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` या `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

unified control vocabulary भी जानबूझकर narrow है:

  | विधि                           | लागू होता है                                            | अनुबंध                                                                                                                                                                                  |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | उसी Gateway कनेक्शन के स्वामित्व वाले प्रदाता सत्र में base64 PCM ऑडियो खंड जोड़ें।                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room उपयोगकर्ता टर्न शुरू करें।                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn सत्यापन के बाद सक्रिय टर्न समाप्त करें।                                                                                                                                         |
  | `talk.session.cancelTurn`       | सभी Gateway-स्वामित्व वाले सत्र                              | किसी टर्न के लिए सक्रिय capture/provider/agent/TTS कार्य रद्द करें।                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | उपयोगकर्ता टर्न को अनिवार्य रूप से समाप्त किए बिना सहायक ऑडियो आउटपुट रोकें।                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | relay द्वारा उत्सर्जित प्रदाता टूल कॉल पूरा करें; अंतरिम आउटपुट के लिए `options.willContinue` या किसी अन्य सहायक प्रतिक्रिया के बिना कॉल को पूरा करने के लिए `options.suppressResponse` पास करें। |
  | `talk.session.steer`            | एजेंट-समर्थित Talk सत्र                              | Talk सत्र से resolved सक्रिय embedded run को बोले गए `status`, `steer`, `cancel`, या `followup` नियंत्रण भेजें।                                                                |
  | `talk.session.close`            | सभी एकीकृत सत्र                                    | relay सत्र रोकें या managed-room स्थिति वापस लें, फिर एकीकृत सत्र id भूल जाएं।                                                                                                    |

  इसे काम करने के लिए core में प्रदाता या प्लेटफ़ॉर्म विशेष मामले न जोड़ें।
  core Talk सत्र semantics का स्वामी है। प्रदाता प्लगइन vendor सत्र सेटअप के स्वामी हैं।
  Voice-call और Google Meet telephony/meeting adapters के स्वामी हैं। Browser और native
  apps device capture/playback UX के स्वामी हैं।

  ## संगतता नीति

  बाहरी प्लगइनों के लिए, संगतता कार्य इस क्रम का पालन करता है:

  1. नया अनुबंध जोड़ें
  2. पुराने व्यवहार को compatibility adapter के माध्यम से wired रखें
  3. ऐसा diagnostic या warning उत्सर्जित करें जो पुराने path और replacement का नाम बताए
  4. tests में दोनों paths को cover करें
  5. deprecation और migration path को document करें
  6. घोषित migration window के बाद ही हटाएं, आम तौर पर major release में

  Maintainers वर्तमान migration queue को
  `pnpm plugins:boundary-report` से audit कर सकते हैं। compact counts के लिए
  `pnpm plugins:boundary-report:summary`, एक plugin या compatibility owner के लिए `--owner <id>`, और जब CI gate को due
  compatibility records, cross-owner reserved SDK imports, या unused reserved SDK
  subpaths पर fail होना चाहिए तब
  `pnpm plugins:boundary-report:ci` का उपयोग करें। report deprecated
  compatibility records को removal date के अनुसार group करती है, local code/docs references गिनती है,
  cross-owner reserved SDK imports surface करती है, और private
  memory-host SDK bridge को summarize करती है ताकि compatibility cleanup ad hoc searches पर
  निर्भर होने के बजाय explicit रहे। Reserved SDK subpaths के पास tracked owner usage होना चाहिए;
  unused reserved helper exports को public SDK से हटा दिया जाना चाहिए।

  अगर manifest field अभी भी accepted है, तो plugin authors इसका उपयोग तब तक जारी रख सकते हैं जब तक
  docs और diagnostics कुछ और न कहें। नए code को documented
  replacement को prefer करना चाहिए, लेकिन मौजूदा plugins ordinary minor
  releases के दौरान टूटने नहीं चाहिए।

  ## माइग्रेट कैसे करें

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Bundled plugins को
    `api.runtime.config.loadConfig()` और
    `api.runtime.config.writeConfigFile(...)` को सीधे call करना बंद करना चाहिए। उस config को prefer करें जो
    active call path में पहले ही pass हो चुका था। Long-lived handlers जिन्हें
    current process snapshot चाहिए, वे `api.runtime.config.current()` का उपयोग कर सकते हैं। Long-lived
    agent tools को `execute` के अंदर tool context का `ctx.getRuntimeConfig()` उपयोग करना चाहिए
    ताकि config write से पहले बनाया गया tool भी refreshed
    runtime config देख सके।

    Config writes को transactional helpers से होकर जाना चाहिए और एक
    after-write policy चुननी चाहिए:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    जब caller जानता हो कि change के लिए clean gateway restart आवश्यक है, तब
    `afterWrite: { mode: "restart", reason: "..." }` का उपयोग करें, और
    `afterWrite: { mode: "none", reason: "..." }` केवल तब उपयोग करें जब caller
    follow-up का स्वामी हो और reload planner को जानबूझकर suppress करना चाहता हो।
    Mutation results में tests और logging के लिए typed `followUp` summary शामिल होती है;
    gateway restart को apply या schedule करने के लिए जिम्मेदार रहता है।
    `loadConfig` और `writeConfigFile` migration window के दौरान external plugins के लिए deprecated compatibility
    helpers के रूप में बने रहते हैं और
    `runtime-config-load-write` compatibility code के साथ एक बार warn करते हैं। Bundled plugins और repo
    runtime code को scanner guardrails द्वारा
    `pnpm check:deprecated-api-usage` और
    `pnpm check:no-runtime-action-load-config` में protected किया गया है: नया production plugin usage
    outright fail होता है, direct config writes fail होते हैं, gateway server methods को
    request runtime snapshot का उपयोग करना चाहिए, runtime channel send/action/client helpers को
    अपनी boundary से config मिलना चाहिए, और long-lived runtime modules में
    allowed ambient `loadConfig()` calls शून्य हैं।

    नए plugin code को broad
    `openclaw/plugin-sdk/config-runtime` compatibility barrel import करने से भी बचना चाहिए। job से match करने वाले narrow
    SDK subpath का उपयोग करें:

    | आवश्यकता | Import |
    | --- | --- |
    | `OpenClawConfig` जैसे config types | `openclaw/plugin-sdk/config-contracts` |
    | Already-loaded config assertions और plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Current runtime snapshot reads | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config writes | `openclaw/plugin-sdk/config-mutation` |
    | Session store helpers | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helpers | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins और उनके tests को broad
    barrel के विरुद्ध scanner-guard किया गया है ताकि imports और mocks उस behavior तक local रहें जिसकी उन्हें आवश्यकता है। broad
    barrel अभी भी external compatibility के लिए मौजूद है, लेकिन नए code को इस पर
    निर्भर नहीं होना चाहिए।

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
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

    उसी समय plugin manifest update करें:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Installed plugins tool-result middleware भी register कर सकते हैं जब वे
    explicitly enabled हों और हर targeted runtime को
    `contracts.agentToolResultMiddleware` में declare करें। Undeclared installed middleware
    registrations rejected होते हैं।

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Approval-capable channel plugins अब native approval behavior को
    `approvalCapability.nativeRuntime` plus shared runtime-context registry के माध्यम से expose करते हैं।

    मुख्य बदलाव:

    - `approvalCapability.handler.loadRuntime(...)` को
      `approvalCapability.nativeRuntime` से replace करें
    - approval-specific auth/delivery को legacy `plugin.auth` /
      `plugin.approvals` wiring से हटाकर `approvalCapability` पर ले जाएं
    - `ChannelPlugin.approvals` को public channel-plugin
      contract से हटा दिया गया है; delivery/native/render fields को `approvalCapability` पर move करें
    - `plugin.auth` केवल channel login/logout flows के लिए रहता है; वहां approval auth
      hooks अब core द्वारा read नहीं किए जाते
    - clients, tokens, या Bolt
      apps जैसे channel-owned runtime objects को `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से register करें
    - native approval handlers से plugin-owned reroute notices न भेजें;
      core अब actual delivery results से routed-elsewhere notices का स्वामी है
    - `channelRuntime` को `createChannelManager(...)` में pass करते समय,
      real `createPluginRuntime().channel` surface दें। Partial stubs rejected होते हैं।

    current approval capability
    layout के लिए `/plugins/sdk-channel-plugins` देखें।

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    अगर आपका plugin `openclaw/plugin-sdk/windows-spawn` का उपयोग करता है, unresolved Windows
    `.cmd`/`.bat` wrappers अब fail closed होते हैं, जब तक आप explicitly
    `allowShellFallback: true` pass न करें।

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

    अगर आपका caller जानबूझकर shell fallback पर rely नहीं करता, तो
    `allowShellFallback` set न करें और इसके बजाय thrown error handle करें।

  </Step>

  <Step title="Find deprecated imports">
    अपने plugin में किसी भी deprecated surface से imports खोजें:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    पुराने surface से हर export किसी specific modern import path पर map होता है:

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

    host-side helpers के लिए, directly import करने के बजाय injected plugin runtime का उपयोग करें:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    यही पैटर्न अन्य पुराने bridge helpers पर लागू होता है:

    | पुराना import | आधुनिक समकक्ष |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | सेशन स्टोर helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    बाहरी संगतता के लिए `openclaw/plugin-sdk/infra-runtime` अब भी मौजूद है,
    लेकिन नए कोड को उस केंद्रित helper surface को import करना चाहिए जिसकी उसे
    वास्तव में जरूरत है:

    | जरूरत | Import |
    | --- | --- |
    | सिस्टम इवेंट कतार helpers | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat wake, इवेंट, और दृश्यता helpers | `openclaw/plugin-sdk/heartbeat-runtime` |
    | लंबित डिलीवरी कतार drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | चैनल activity telemetry | `openclaw/plugin-sdk/channel-activity-runtime` |
    | इन-मेमरी dedupe caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | सुरक्षित local-file/media path helpers | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy और guarded fetch helpers | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher policy types | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Approval request/resolution types | `openclaw/plugin-sdk/approval-runtime` |
    | Approval reply payload और command helpers | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Error formatting helpers | `openclaw/plugin-sdk/error-runtime` |
    | Transport readiness waits | `openclaw/plugin-sdk/transport-ready-runtime` |
    | सुरक्षित token helpers | `openclaw/plugin-sdk/secure-random-runtime` |
    | सीमित async task concurrency | `openclaw/plugin-sdk/concurrency-runtime` |
    | संख्यात्मक coercion | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | File locks | `openclaw/plugin-sdk/file-lock` |

    Bundled plugins को `infra-runtime` के विरुद्ध scanner-guarded किया गया है,
    इसलिए repo code broad barrel पर वापस नहीं जा सकता।

  </Step>

  <Step title="Migrate channel route helpers">
    नए channel route code को `openclaw/plugin-sdk/channel-route` का उपयोग करना चाहिए।
    पुराने route-key और comparable-target नाम migration window के दौरान
    संगतता aliases के रूप में बने रहते हैं, लेकिन नए plugins को उन route names
    का उपयोग करना चाहिए जो behavior को सीधे वर्णित करते हैं:

    | पुराना helper | आधुनिक helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    आधुनिक route helpers native approvals, reply suppression, inbound dedupe,
    Cron delivery, और session routing में `{ channel, to, accountId, threadId }`
    को लगातार normalize करते हैं।

    `ChannelMessagingAdapter.parseExplicitTarget` या
    parser-backed loaded-route helpers (`parseExplicitTargetForLoadedChannel`
    या `resolveRouteTargetForLoadedChannel`) या
    `plugin-sdk/channel-route` से
    `resolveChannelRouteTargetWithParser(...)` के नए उपयोग न जोड़ें।
    ये hooks deprecated हैं और migration window के दौरान केवल पुराने plugins
    के लिए बने रहते हैं। नए channel plugins को target id normalization
    और directory-miss fallback के लिए
    `messaging.targetResolver.resolveTarget(...)`, जब core को early peer kind
    चाहिए हो तब `messaging.inferTargetChatType(...)`, और provider-native
    session और thread identity के लिए `messaging.resolveOutboundSessionRoute(...)`
    का उपयोग करना चाहिए।

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Import path reference

  <Accordion title="Common import path table">
  | आयात पथ | उद्देश्य | मुख्य निर्यात |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | आधिकारिक Plugin प्रविष्टि सहायक | `definePluginEntry` |
  | `plugin-sdk/core` | चैनल प्रविष्टि परिभाषाओं/बिल्डरों के लिए लेगेसी अम्ब्रेला पुनः-निर्यात | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | रूट कॉन्फ़िग स्कीमा निर्यात | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | एकल-प्रदाता प्रविष्टि सहायक | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | केंद्रित चैनल प्रविष्टि परिभाषाएँ और बिल्डर | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | साझा सेटअप विज़ार्ड सहायक | सेटअप अनुवादक, अनुमति-सूची प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
  | `plugin-sdk/setup-runtime` | सेटअप-समय रनटाइम सहायक | `createSetupTranslator`, आयात-सुरक्षित सेटअप पैच अडैप्टर, लुकअप-नोट सहायक, `promptResolvedAllowFrom`, `splitSetupEntries`, प्रत्यायोजित सेटअप प्रॉक्सी |
  | `plugin-sdk/setup-adapter-runtime` | पदावनत सेटअप अडैप्टर उपनाम | `plugin-sdk/setup-runtime` का उपयोग करें |
  | `plugin-sdk/setup-tools` | सेटअप टूलिंग सहायक | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | बहु-खाता सहायक | खाता सूची/कॉन्फ़िग/action-gate सहायक |
  | `plugin-sdk/account-id` | खाता-id सहायक | `DEFAULT_ACCOUNT_ID`, खाता-id सामान्यीकरण |
  | `plugin-sdk/account-resolution` | खाता लुकअप सहायक | खाता लुकअप + डिफ़ॉल्ट-फ़ॉलबैक सहायक |
  | `plugin-sdk/account-helpers` | संकीर्ण खाता सहायक | खाता सूची/खाता-क्रिया सहायक |
  | `plugin-sdk/channel-setup` | सेटअप विज़ार्ड अडैप्टर | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM पेयरिंग प्रिमिटिव | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | उत्तर उपसर्ग, टाइपिंग, और स्रोत-डिलीवरी वायरिंग | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | कॉन्फ़िग अडैप्टर फ़ैक्ट्री और DM एक्सेस सहायक | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | कॉन्फ़िग स्कीमा बिल्डर | साझा चैनल कॉन्फ़िग स्कीमा प्रिमिटिव और केवल जेनेरिक बिल्डर |
  | `plugin-sdk/bundled-channel-config-schema` | बंडल किए गए कॉन्फ़िग स्कीमा | केवल OpenClaw द्वारा मेंटेन किए गए बंडल Plugin; नए Plugin को Plugin-स्थानीय स्कीमा परिभाषित करने होंगे |
  | `plugin-sdk/channel-config-schema-legacy` | पदावनत बंडल कॉन्फ़िग स्कीमा | केवल संगतता उपनाम; मेंटेन किए गए बंडल Plugin के लिए `plugin-sdk/bundled-channel-config-schema` का उपयोग करें |
  | `plugin-sdk/telegram-command-config` | Telegram कमांड कॉन्फ़िग सहायक | कमांड-नाम सामान्यीकरण, विवरण ट्रिमिंग, डुप्लिकेट/टकराव सत्यापन |
  | `plugin-sdk/channel-policy` | समूह/DM नीति समाधान | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | पदावनत संगतता फ़साड | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/inbound-envelope` | इनबाउंड एनवेलप सहायक | साझा रूट + एनवेलप बिल्डर सहायक |
  | `plugin-sdk/channel-inbound` | इनबाउंड प्राप्ति सहायक | कॉन्टेक्स्ट निर्माण, फ़ॉर्मैटिंग, रूट, रनर, तैयार उत्तर डिस्पैच, और डिस्पैच प्रेडिकेट |
  | `plugin-sdk/messaging-targets` | पदावनत लक्ष्य पार्सिंग आयात पथ | जेनेरिक लक्ष्य पार्सिंग सहायकों के लिए `plugin-sdk/channel-targets`, रूट तुलना के लिए `plugin-sdk/channel-route`, और प्रदाता-विशिष्ट लक्ष्य समाधान के लिए Plugin-स्वामित्व वाले `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` का उपयोग करें |
  | `plugin-sdk/outbound-media` | आउटबाउंड मीडिया सहायक | साझा आउटबाउंड मीडिया लोडिंग |
  | `plugin-sdk/outbound-send-deps` | पदावनत संगतता फ़साड | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/channel-outbound` | आउटबाउंड संदेश जीवनचक्र सहायक | संदेश अडैप्टर, रसीदें, टिकाऊ भेजने के सहायक, लाइव पूर्वावलोकन/स्ट्रीमिंग सहायक, उत्तर विकल्प, जीवनचक्र सहायक, आउटबाउंड पहचान, और पेलोड योजना |
  | `plugin-sdk/channel-streaming` | पदावनत संगतता फ़साड | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/outbound-runtime` | पदावनत संगतता फ़साड | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/thread-bindings-runtime` | थ्रेड-बाइंडिंग सहायक | थ्रेड-बाइंडिंग जीवनचक्र और अडैप्टर सहायक |
  | `plugin-sdk/agent-media-payload` | लेगेसी मीडिया पेलोड सहायक | लेगेसी फ़ील्ड लेआउट के लिए एजेंट मीडिया पेलोड बिल्डर |
  | `plugin-sdk/channel-runtime` | पदावनत संगतता शिम | केवल लेगेसी चैनल रनटाइम उपयोगिताएँ |
  | `plugin-sdk/channel-send-result` | भेजने के परिणाम प्रकार | उत्तर परिणाम प्रकार |
  | `plugin-sdk/runtime-store` | स्थायी Plugin स्टोरेज | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | व्यापक रनटाइम सहायक | रनटाइम/लॉगिंग/बैकअप/Plugin-इंस्टॉल सहायक |
  | `plugin-sdk/runtime-env` | संकीर्ण रनटाइम env सहायक | लॉगर/रनटाइम env, टाइमआउट, रिट्राई, और बैकऑफ़ सहायक |
  | `plugin-sdk/plugin-runtime` | साझा Plugin रनटाइम सहायक | Plugin कमांड/हुक/http/इंटरैक्टिव सहायक |
  | `plugin-sdk/hook-runtime` | हुक पाइपलाइन सहायक | साझा Webhook/आंतरिक हुक पाइपलाइन सहायक |
  | `plugin-sdk/lazy-runtime` | लेज़ी रनटाइम सहायक | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | प्रक्रिया सहायक | साझा exec सहायक |
  | `plugin-sdk/cli-runtime` | CLI रनटाइम सहायक | कमांड फ़ॉर्मैटिंग, प्रतीक्षा, संस्करण सहायक |
  | `plugin-sdk/gateway-runtime` | Gateway सहायक | Gateway क्लाइंट, इवेंट-लूप-तैयार स्टार्ट सहायक, विज्ञापित LAN होस्ट समाधान, और चैनल-स्थिति पैच सहायक |
  | `plugin-sdk/config-runtime` | पदावनत कॉन्फ़िग संगतता शिम | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, और `config-mutation` को प्राथमिकता दें |
  | `plugin-sdk/telegram-command-config` | Telegram कमांड सहायक | जब बंडल Telegram कॉन्ट्रैक्ट सतह उपलब्ध न हो, तब फ़ॉलबैक-स्थिर Telegram कमांड सत्यापन सहायक |
  | `plugin-sdk/approval-runtime` | अनुमोदन प्रॉम्प्ट सहायक | Exec/Plugin अनुमोदन पेलोड, अनुमोदन क्षमता/प्रोफ़ाइल सहायक, नेटिव अनुमोदन रूटिंग/रनटाइम सहायक, और संरचित अनुमोदन डिस्प्ले पथ फ़ॉर्मैटिंग |
  | `plugin-sdk/approval-auth-runtime` | अनुमोदन auth सहायक | अनुमोदक समाधान, समान-चैट क्रिया auth |
  | `plugin-sdk/approval-client-runtime` | अनुमोदन क्लाइंट सहायक | नेटिव exec अनुमोदन प्रोफ़ाइल/फ़िल्टर सहायक |
  | `plugin-sdk/approval-delivery-runtime` | अनुमोदन डिलीवरी सहायक | नेटिव अनुमोदन क्षमता/डिलीवरी अडैप्टर |
  | `plugin-sdk/approval-gateway-runtime` | अनुमोदन Gateway सहायक | साझा अनुमोदन Gateway-समाधान सहायक |
  | `plugin-sdk/approval-handler-adapter-runtime` | अनुमोदन अडैप्टर सहायक | हॉट चैनल एंट्रीपॉइंट के लिए हल्के नेटिव अनुमोदन अडैप्टर लोडिंग सहायक |
  | `plugin-sdk/approval-handler-runtime` | अनुमोदन हैंडलर सहायक | व्यापक अनुमोदन हैंडलर रनटाइम सहायक; जब संकरे अडैप्टर/Gateway सीम पर्याप्त हों, उन्हें प्राथमिकता दें |
  | `plugin-sdk/approval-native-runtime` | अनुमोदन लक्ष्य सहायक | नेटिव अनुमोदन लक्ष्य/खाता बाइंडिंग सहायक |
  | `plugin-sdk/approval-reply-runtime` | अनुमोदन उत्तर सहायक | Exec/Plugin अनुमोदन उत्तर पेलोड सहायक |
  | `plugin-sdk/channel-runtime-context` | चैनल रनटाइम-कॉन्टेक्स्ट सहायक | जेनेरिक चैनल रनटाइम-कॉन्टेक्स्ट रजिस्टर/get/watch सहायक |
  | `plugin-sdk/security-runtime` | सुरक्षा सहायक | साझा विश्वास, DM गेटिंग, रूट-सीमित फ़ाइल/पथ सहायक, बाहरी-सामग्री, और सीक्रेट-संग्रह सहायक |
  | `plugin-sdk/ssrf-policy` | SSRF नीति सहायक | होस्ट अनुमति-सूची और निजी-नेटवर्क नीति सहायक |
  | `plugin-sdk/ssrf-runtime` | SSRF रनटाइम सहायक | पिन्ड-डिस्पैचर, संरक्षित fetch, SSRF नीति सहायक |
  | `plugin-sdk/system-event-runtime` | सिस्टम इवेंट सहायक | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat सहायक | Heartbeat वेक, इवेंट, और दृश्यता सहायक |
  | `plugin-sdk/delivery-queue-runtime` | डिलीवरी क्यू सहायक | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | चैनल गतिविधि सहायक | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | डीड्यूप सहायक | इन-मेमोरी डीड्यूप कैश |
  | `plugin-sdk/file-access-runtime` | फ़ाइल एक्सेस सहायक | सुरक्षित स्थानीय-फ़ाइल/मीडिया पथ सहायक |
  | `plugin-sdk/transport-ready-runtime` | ट्रांसपोर्ट तैयारी सहायक | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec अनुमोदन नीति सहायक | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | सीमित कैश सहायक | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | डायग्नॉस्टिक गेटिंग सहायक | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | त्रुटि फ़ॉर्मैटिंग सहायक | `formatUncaughtError`, `isApprovalNotFoundError`, त्रुटि ग्राफ़ सहायक |
  | `plugin-sdk/fetch-runtime` | रैप्ड fetch/proxy सहायक | `resolveFetch`, प्रॉक्सी सहायक, EnvHttpProxyAgent विकल्प सहायक |
  | `plugin-sdk/host-runtime` | होस्ट सामान्यीकरण सहायक | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | रिट्राई सहायक | `RetryConfig`, `retryAsync`, नीति रनर |
  | `plugin-sdk/allow-from` | अनुमति-सूची फ़ॉर्मैटिंग और इनपुट मैपिंग | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | कमांड गेटिंग और कमांड-सतह सहायक | `resolveControlCommandGate`, प्रेषक-प्राधिकरण सहायक, डायनेमिक आर्ग्युमेंट मेनू फ़ॉर्मैटिंग सहित कमांड रजिस्ट्री सहायक |
  | `plugin-sdk/command-status` | कमांड स्थिति/सहायता रेंडरर | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | सीक्रेट इनपुट पार्सिंग | सीक्रेट इनपुट सहायक |
  | `plugin-sdk/webhook-ingress` | Webhook अनुरोध सहायक | Webhook लक्ष्य उपयोगिताएँ |
  | `plugin-sdk/webhook-request-guards` | Webhook बॉडी गार्ड सहायक | अनुरोध बॉडी पढ़ने/सीमा सहायक |
  | `plugin-sdk/reply-runtime` | साझा उत्तर रनटाइम | इनबाउंड डिस्पैच, Heartbeat, उत्तर प्लानर, चंकिंग |
  | `plugin-sdk/reply-dispatch-runtime` | संकीर्ण उत्तर डिस्पैच सहायक | अंतिम रूप देना, प्रदाता डिस्पैच, और वार्तालाप-लेबल सहायक |
  | `plugin-sdk/reply-history` | उत्तर-इतिहास सहायक | `createChannelHistoryWindow`; पदावनत मैप-सहायक संगतता निर्यात जैसे `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, और `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | उत्तर संदर्भ योजना | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | उत्तर चंक सहायक | टेक्स्ट/markdown चंकिंग सहायक |
  | `plugin-sdk/session-store-runtime` | सेशन स्टोर सहायक | स्टोर पथ + updated-at सहायक |
  | `plugin-sdk/state-paths` | स्टेट पथ सहायक | स्टेट और OAuth dir सहायक |
  | `plugin-sdk/routing` | रूटिंग/session-key सहायक | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key सामान्यीकरण सहायक |
  | `plugin-sdk/status-helpers` | चैनल स्थिति सहायक | चैनल/खाता स्थिति सारांश बिल्डर, रनटाइम-स्थिति डिफॉल्ट, समस्या metadata सहायक |
  | `plugin-sdk/target-resolver-runtime` | लक्ष्य resolver सहायक | साझा लक्ष्य resolver सहायक |
  | `plugin-sdk/string-normalization-runtime` | स्ट्रिंग सामान्यीकरण सहायक | Slug/स्ट्रिंग सामान्यीकरण सहायक |
  | `plugin-sdk/request-url` | अनुरोध URL सहायक | request-जैसे इनपुट से स्ट्रिंग URL निकालें |
  | `plugin-sdk/run-command` | समयबद्ध कमांड सहायक | सामान्यीकृत stdout/stderr के साथ समयबद्ध कमांड रनर |
  | `plugin-sdk/param-readers` | पैरामीटर रीडर | सामान्य टूल/CLI पैरामीटर रीडर |
  | `plugin-sdk/tool-payload` | टूल payload निष्कर्षण | टूल परिणाम ऑब्जेक्ट से सामान्यीकृत payload निकालें |
  | `plugin-sdk/tool-send` | टूल send निष्कर्षण | टूल args से canonical send target फ़ील्ड निकालें |
  | `plugin-sdk/temp-path` | अस्थायी path सहायक | साझा अस्थायी-download path सहायक |
  | `plugin-sdk/logging-core` | लॉगिंग सहायक | सबसिस्टम logger और redaction सहायक |
  | `plugin-sdk/markdown-table-runtime` | Markdown-table सहायक | Markdown तालिका मोड सहायक |
  | `plugin-sdk/reply-payload` | संदेश उत्तर प्रकार | उत्तर payload प्रकार |
  | `plugin-sdk/provider-setup` | चुने हुए स्थानीय/स्वयं-होस्टेड प्रदाता setup सहायक | स्वयं-होस्टेड प्रदाता discovery/config सहायक |
  | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्वयं-होस्टेड प्रदाता setup सहायक | वही स्वयं-होस्टेड प्रदाता discovery/config सहायक |
  | `plugin-sdk/provider-auth-runtime` | प्रदाता रनटाइम auth सहायक | रनटाइम API-key resolution सहायक |
  | `plugin-sdk/provider-auth-api-key` | प्रदाता API-key setup सहायक | API-key onboarding/profile-write सहायक |
  | `plugin-sdk/provider-auth-result` | प्रदाता auth-result सहायक | मानक OAuth auth-result बिल्डर |
  | `plugin-sdk/provider-selection-runtime` | प्रदाता चयन सहायक | configured-or-auto प्रदाता चयन और raw प्रदाता config merging |
  | `plugin-sdk/provider-env-vars` | प्रदाता env-var सहायक | प्रदाता auth env-var lookup सहायक |
  | `plugin-sdk/provider-model-shared` | साझा प्रदाता model/replay सहायक | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा replay-policy बिल्डर, प्रदाता-endpoint सहायक, और model-id सामान्यीकरण सहायक |
  | `plugin-sdk/provider-catalog-shared` | साझा प्रदाता catalog सहायक | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | प्रदाता onboarding patches | Onboarding config सहायक |
  | `plugin-sdk/provider-http` | प्रदाता HTTP सहायक | सामान्य प्रदाता HTTP/endpoint क्षमता सहायक, जिनमें ऑडियो transcription multipart form सहायक शामिल हैं |
  | `plugin-sdk/provider-web-fetch` | प्रदाता web-fetch सहायक | Web-fetch प्रदाता registration/cache सहायक |
  | `plugin-sdk/provider-web-search-config-contract` | प्रदाता web-search config सहायक | उन प्रदाताओं के लिए सीमित web-search config/credential सहायक जिन्हें plugin-enable wiring की आवश्यकता नहीं है |
  | `plugin-sdk/provider-web-search-contract` | प्रदाता web-search contract सहायक | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और scoped credential setters/getters जैसे सीमित web-search config/credential contract सहायक |
  | `plugin-sdk/provider-web-search` | प्रदाता web-search सहायक | Web-search प्रदाता registration/cache/runtime सहायक |
  | `plugin-sdk/provider-tools` | प्रदाता tool/schema compat सहायक | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI schema cleanup + diagnostics |
  | `plugin-sdk/provider-usage` | प्रदाता उपयोग सहायक | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, और अन्य प्रदाता उपयोग सहायक |
  | `plugin-sdk/provider-stream` | प्रदाता stream wrapper सहायक | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper प्रकार, और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper सहायक |
  | `plugin-sdk/provider-transport-runtime` | प्रदाता transport सहायक | guarded fetch, tool-result text extraction, transport message transforms, और writable transport event streams जैसे native प्रदाता transport सहायक |
  | `plugin-sdk/keyed-async-queue` | क्रमबद्ध async queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | साझा media सहायक | Media fetch/transform/store सहायक, ffprobe-backed वीडियो dimension probing, और media payload बिल्डर |
  | `plugin-sdk/media-generation-runtime` | साझा media-generation सहायक | image/video/music generation के लिए साझा failover सहायक, candidate selection, और missing-model messaging |
  | `plugin-sdk/media-understanding` | Media-understanding सहायक | Media understanding प्रदाता प्रकार और प्रदाता-facing image/audio helper exports |
  | `plugin-sdk/text-runtime` | अप्रचलित व्यापक text compatibility export | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, और `logging-core` का उपयोग करें |
  | `plugin-sdk/text-chunking` | Text chunking सहायक | आउटबाउंड text chunking सहायक |
  | `plugin-sdk/speech` | Speech सहायक | Speech प्रदाता प्रकार और प्रदाता-facing directive, registry, validation सहायक, और OpenAI-संगत TTS बिल्डर |
  | `plugin-sdk/speech-core` | साझा speech core | Speech प्रदाता प्रकार, registry, directives, normalization |
  | `plugin-sdk/realtime-transcription` | Realtime transcription सहायक | प्रदाता प्रकार, registry सहायक, और साझा WebSocket session सहायक |
  | `plugin-sdk/realtime-voice` | Realtime voice सहायक | प्रदाता प्रकार, registry/resolution सहायक, bridge session सहायक, साझा agent talk-back queues, active-run voice control, transcript/event health, echo suppression, consult question matching, forced-consult coordination, turn-context tracking, output activity tracking, और fast context consult सहायक |
  | `plugin-sdk/image-generation` | Image-generation सहायक | Image generation प्रदाता प्रकार और image asset/data URL सहायक तथा OpenAI-संगत image प्रदाता बिल्डर |
  | `plugin-sdk/image-generation-core` | साझा image-generation core | Image-generation प्रकार, failover, auth, और registry सहायक |
  | `plugin-sdk/music-generation` | Music-generation सहायक | Music-generation प्रदाता/request/result प्रकार |
  | `plugin-sdk/music-generation-core` | साझा music-generation core | Music-generation प्रकार, failover सहायक, प्रदाता lookup, और model-ref parsing |
  | `plugin-sdk/video-generation` | Video-generation सहायक | Video-generation प्रदाता/request/result प्रकार |
  | `plugin-sdk/video-generation-core` | साझा video-generation core | Video-generation प्रकार, failover सहायक, प्रदाता lookup, और model-ref parsing |
  | `plugin-sdk/interactive-runtime` | Interactive reply सहायक | Interactive reply payload normalization/reduction |
  | `plugin-sdk/channel-config-primitives` | चैनल config primitives | सीमित चैनल config-schema primitives |
  | `plugin-sdk/channel-config-writes` | चैनल config-write सहायक | चैनल config-write authorization सहायक |
  | `plugin-sdk/channel-plugin-common` | साझा चैनल prelude | साझा चैनल Plugin prelude exports |
  | `plugin-sdk/channel-status` | चैनल स्थिति सहायक | साझा चैनल status snapshot/summary सहायक |
  | `plugin-sdk/allowlist-config-edit` | Allowlist config सहायक | Allowlist config edit/read सहायक |
  | `plugin-sdk/group-access` | समूह access सहायक | साझा group-access decision सहायक |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित compatibility facades | `plugin-sdk/channel-inbound` का उपयोग करें |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM guard सहायक | सीमित pre-crypto guard policy सहायक |
  | `plugin-sdk/extension-shared` | साझा extension सहायक | Passive-channel/status और ambient proxy helper primitives |
  | `plugin-sdk/webhook-targets` | Webhook target सहायक | Webhook target registry और route-install सहायक |
  | `plugin-sdk/webhook-path` | अप्रचलित Webhook path alias | `plugin-sdk/webhook-ingress` का उपयोग करें |
  | `plugin-sdk/web-media` | साझा web media सहायक | Remote/local media loading सहायक |
  | `plugin-sdk/zod` | अप्रचलित Zod compatibility re-export | `zod` को सीधे `zod` से import करें |
  | `plugin-sdk/memory-core` | Bundled memory-core सहायक | Memory manager/config/file/CLI helper surface |
  | `plugin-sdk/memory-core-engine-runtime` | Memory engine runtime facade | Memory index/search runtime facade |
  | `plugin-sdk/memory-core-host-embedding-registry` | Memory embedding registry | हल्के memory embedding प्रदाता registry सहायक |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine | Memory host foundation engine exports |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding engine | Memory embedding contracts, registry access, स्थानीय प्रदाता, और generic batch/remote सहायक; ठोस remote प्रदाता अपने owning plugins में रहते हैं |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine | Memory host QMD engine exports |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine | Memory host storage engine exports |
  | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal सहायक | Memory host multimodal सहायक |
  | `plugin-sdk/memory-core-host-query` | Memory host query सहायक | Memory host query सहायक |
  | `plugin-sdk/memory-core-host-secret` | Memory host secret सहायक | Memory host secret सहायक |
  | `plugin-sdk/memory-core-host-events` | अप्रचलित memory event alias | `plugin-sdk/memory-host-events` का उपयोग करें |
  | `plugin-sdk/memory-core-host-status` | Memory host status सहायक | Memory host status सहायक |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI runtime | Memory host CLI runtime सहायक |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory host core runtime | Memory host core runtime सहायक |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory host file/runtime सहायक | Memory host file/runtime सहायक |
  | `plugin-sdk/memory-host-core` | Memory host core runtime alias | Memory host core runtime सहायक के लिए vendor-neutral alias |
  | `plugin-sdk/memory-host-events` | Memory host event journal alias | Memory host event journal सहायक के लिए vendor-neutral alias |
  | `plugin-sdk/memory-host-files` | अप्रचलित memory file/runtime alias | `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
  | `plugin-sdk/memory-host-markdown` | Managed markdown सहायक | memory-adjacent plugins के लिए साझा managed-markdown सहायक |
  | `plugin-sdk/memory-host-search` | Active Memory search facade | Lazy active-memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | अप्रचलित memory host status alias | `plugin-sdk/memory-core-host-status` का उपयोग करें |
  | `plugin-sdk/testing` | Test utilities | Repo-local अप्रचलित compatibility barrel; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, और `plugin-sdk/test-fixtures` जैसे केंद्रित repo-local test subpaths का उपयोग करें |
</Accordion>

यह तालिका जानबूझकर सामान्य माइग्रेशन उपसमुच्चय है, पूरा SDK
surface नहीं। compiler entrypoint inventory
`scripts/lib/plugin-sdk-entrypoints.json` में रहता है; package exports
सार्वजनिक उपसमुच्चय से generated होते हैं।

आरक्षित bundled-Plugin helper seams को public SDK export map से retire कर दिया गया है,
सिवाय स्पष्ट रूप से documented compatibility facades के, जैसे deprecated
`plugin-sdk/discord` shim जिसे published `@openclaw/discord@2026.3.13`
package के लिए रखा गया है। Owner-specific helpers owning Plugin package के
अंदर रहते हैं; shared host behavior को generic SDK contracts जैसे
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, और
`plugin-sdk/plugin-config-runtime` के माध्यम से जाना चाहिए।

काम से मेल खाने वाला सबसे narrow import इस्तेमाल करें। अगर आपको export नहीं मिलता,
तो `src/plugin-sdk/` पर source देखें या maintainers से पूछें कि कौन-सा generic contract
इसे own करना चाहिए।

## सक्रिय deprecations

Narrower deprecations जो plugin SDK, provider contract,
runtime surface, और manifest पर लागू होते हैं। इनमें से हर एक आज भी काम करता है
लेकिन भविष्य की major release में हटाया जाएगा। हर item के नीचे entry पुराने API को
उसके canonical replacement से map करती है।

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **पुराना (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **नया (`openclaw/plugin-sdk/command-status`)**: वही signatures, वही
    exports - बस narrower subpath से imported। `command-auth`
    उन्हें compat stubs के रूप में re-export करता है।

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **पुराना**: `resolveInboundMentionRequirement({ facts, policy })` और
    `shouldDropInboundForMention(...)`
    `openclaw/plugin-sdk/channel-inbound` या
    `openclaw/plugin-sdk/channel-mention-gating` से।

    **नया**: `resolveInboundMentionDecision({ facts, policy })` - दो split calls के बजाय
    एक single decision object लौटाता है।

    Downstream channel plugins (Slack, Discord, Matrix, MS Teams) पहले ही
    switch कर चुके हैं।

  </Accordion>

  <Accordion title="Channel runtime shim और channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` पुराने channel plugins के लिए compatibility shim है।
    नए code से इसे import न करें; runtime objects register करने के लिए
    `openclaw/plugin-sdk/channel-runtime-context` इस्तेमाल करें।

    `openclaw/plugin-sdk/channel-actions` में `channelActions*` helpers
    raw "actions" channel exports के साथ deprecated हैं। इसके बजाय semantic
    `presentation` surface के माध्यम से capabilities expose करें - channel plugins
    यह declare करते हैं कि वे क्या render करते हैं (cards, buttons, selects), न कि कौन-से raw
    action names accept करते हैं।

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **पुराना**: `openclaw/plugin-sdk/provider-web-search` से `tool()` factory।

    **नया**: provider Plugin पर सीधे `createTool(...)` implement करें।
    OpenClaw को अब tool wrapper register करने के लिए SDK helper की जरूरत नहीं है।

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **पुराना**: inbound channel messages से flat plaintext prompt
    envelope बनाने के लिए `formatInboundEnvelope(...)` (और
    `ChannelMessageForAgent.channelEnvelope`)।

    **नया**: `BodyForAgent` और structured user-context blocks। Channel
    plugins routing metadata (thread, topic, reply-to, reactions) को prompt string में
    concatenate करने के बजाय typed fields के रूप में attach करते हैं। synthesized
    assistant-facing envelopes के लिए `formatAgentEnvelope(...)` helper अभी भी supported है,
    लेकिन inbound plaintext envelopes हटाए जा रहे हैं।

    प्रभावित क्षेत्र: `inbound_claim`, `message_received`, और कोई भी custom
    channel Plugin जिसने `channelEnvelope` text को post-process किया।

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **पुराना**: `api.on("deactivate", handler)`.

    **नया**: `api.on("gateway_stop", handler)`. Event और context वही
    shutdown cleanup contract हैं; केवल hook name बदलता है।

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
    `threadBindingReady` या `deliveryOrigin` लौटाता है।

    **नया**: core को channel session-binding adapter के माध्यम से
    `thread: true` subagent bindings तैयार करने दें। केवल post-launch observation के लिए
    `api.on("subagent_spawned", handler)` इस्तेमाल करें।

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
    static object के बजाय explicit provider hooks जैसे `buildReplayPolicy`,
    `normalizeToolSchemas`, और `wrapStreamFn` इस्तेमाल करने चाहिए।

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **पुराना** (`ProviderThinkingPolicy` पर तीन अलग-अलग hooks):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, और
    `resolveDefaultThinkingLevel(ctx)`.

    **नया**: एक single `resolveThinkingProfile(ctx)` जो canonical `id`,
    optional `label`, और ranked level list के साथ `ProviderThinkingProfile`
    लौटाता है। OpenClaw stale stored values को profile rank के आधार पर अपने-आप downgrade करता है।

    Context में `provider`, `modelId`, optional merged `reasoning`,
    और optional merged model `compat` facts शामिल हैं। Provider plugins उन
    catalog facts का उपयोग model-specific profile expose करने के लिए कर सकते हैं, केवल तब जब configured
    request contract उसे support करता हो।

    तीन के बजाय एक hook implement करें। Legacy hooks deprecation window के दौरान
    काम करते रहते हैं लेकिन profile result के साथ composed नहीं होते।

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

    **नया**: manifest पर वही env-var lookup `setup.providers[].envVars` में mirror करें।
    यह setup/status env metadata को एक जगह consolidate करता है और केवल env-var
    lookups का उत्तर देने के लिए Plugin runtime boot करने से बचाता है।

    `providerAuthEnvVars` compatibility adapter के माध्यम से तब तक supported रहता है
    जब तक deprecation window बंद नहीं हो जाती।

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **पुराना**: तीन अलग-अलग calls -
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
    **पुराना**: `api.registerMemoryEmbeddingProvider(...)` और
    `contracts.memoryEmbeddingProviders`.

    **नया**: `api.registerEmbeddingProvider(...)` और
    `contracts.embeddingProviders`.

    Generic embedding provider contract memory के बाहर भी reusable है और
    नए providers के लिए supported path है। Memory-specific registration API
    deprecated compatibility के रूप में wired रहता है, जब तक मौजूदा providers migrate करते हैं।
    Plugin inspection non-bundled usage को compatibility debt के रूप में report करता है।

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    `src/plugins/runtime/types.ts` से अभी भी exported दो legacy type aliases:

    | पुराना                        | नया                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime method `readSession`, `getSessionMessages` के पक्ष में deprecated है।
    वही signature; पुराना method नए वाले को call through करता है।

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **पुराना**: `runtime.tasks.flow` (singular) ने live task-flow accessor लौटाया।

    **नया**: `runtime.tasks.managedFlows` उन plugins के लिए managed TaskFlow mutation
    runtime रखता है जो flow से child tasks create, update, cancel, या run करते हैं।
    जब Plugin को केवल DTO-based reads की जरूरत हो तो `runtime.tasks.flows` इस्तेमाल करें।

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ऊपर "How to migrate → Migrate embedded tool-result extensions to
    middleware" में covered। Completeness के लिए यहां शामिल: हटाया गया embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)` path
    `api.registerAgentToolResultMiddleware(...)` से replace किया गया है, जिसमें
    `contracts.agentToolResultMiddleware` में explicit runtime
    list है।
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` से re-exported `OpenClawSchemaType` अब
    `OpenClawConfig` के लिए one-line alias है। Canonical name को prefer करें।

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
उनके अपने `api.ts` और `runtime-api.ts`
barrels के अंदर tracked हैं। वे third-party Plugin contracts को affect नहीं करते और यहां listed
नहीं हैं। अगर आप bundled Plugin के local barrel को सीधे consume करते हैं, तो upgrade करने से पहले
उस barrel में deprecation comments पढ़ें।
</Note>

## हटाने की timeline

| कब                    | क्या होता है                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **अभी**                | बहिष्कृत सतहें रनटाइम चेतावनियाँ उत्सर्जित करती हैं                    |
| **अगली प्रमुख रिलीज़** | बहिष्कृत सतहें हटा दी जाएँगी; जो Plugin अभी भी उनका उपयोग कर रहे हैं वे विफल होंगे |

सभी मुख्य Plugin पहले ही माइग्रेट किए जा चुके हैं। बाहरी Plugin को
अगली प्रमुख रिलीज़ से पहले माइग्रेट करना चाहिए।

## चेतावनियों को अस्थायी रूप से दबाना

माइग्रेशन पर काम करते समय ये पर्यावरण चर सेट करें:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

यह एक अस्थायी बचाव मार्ग है, स्थायी समाधान नहीं।

## संबंधित

- [शुरू करना](/hi/plugins/building-plugins) - अपना पहला Plugin बनाएँ
- [SDK अवलोकन](/hi/plugins/sdk-overview) - पूर्ण सबपाथ इंपोर्ट संदर्भ
- [चैनल Plugin](/hi/plugins/sdk-channel-plugins) - चैनल Plugin बनाना
- [प्रोवाइडर Plugin](/hi/plugins/sdk-provider-plugins) - प्रोवाइडर Plugin बनाना
- [Plugin आंतरिक संरचना](/hi/plugins/architecture) - आर्किटेक्चर की गहन जानकारी
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - मैनिफ़ेस्ट स्कीमा संदर्भ
