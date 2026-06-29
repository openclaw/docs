---
read_when:
    - आपको OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED चेतावनी दिखाई देती है
    - आपको OPENCLAW_EXTENSION_API_DEPRECATED चेतावनी दिखाई देती है
    - आपने OpenClaw 2026.4.25 से पहले api.registerEmbeddedExtensionFactory का उपयोग किया था
    - आप एक Plugin को आधुनिक Plugin आर्किटेक्चर में अपडेट कर रहे हैं
    - आप एक बाहरी OpenClaw Plugin का रखरखाव करते हैं
sidebarTitle: Migrate to SDK
summary: लेगेसी पिछली-संगतता लेयर से आधुनिक plugin SDK पर माइग्रेट करें
title: Plugin SDK माइग्रेशन
x-i18n:
    generated_at: "2026-06-28T23:52:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw एक व्यापक पिछड़ी-संगतता लेयर से हटकर केंद्रित, दस्तावेजीकृत imports वाली आधुनिक Plugin architecture पर आ गया है। यदि आपका Plugin नई architecture से पहले बनाया गया था, तो यह guide आपको migrate करने में मदद करती है।

## क्या बदल रहा है

पुराना Plugin system दो बहुत खुले surfaces देता था, जिनसे Plugins एक ही entry point से अपनी जरूरत की कोई भी चीज import कर सकते थे:

- **`openclaw/plugin-sdk/compat`** - एक single import जो दर्जनों helpers को re-export करता था। इसे पुराने hook-based Plugins को काम करते रहने के लिए पेश किया गया था, जबकि नई Plugin architecture बनाई जा रही थी।
- **`openclaw/plugin-sdk/infra-runtime`** - एक व्यापक runtime helper barrel, जिसमें system events, heartbeat state, delivery queues, fetch/proxy helpers, file helpers, approval types, और असंबंधित utilities मिले हुए थे।
- **`openclaw/plugin-sdk/config-runtime`** - एक व्यापक config compatibility barrel, जो migration window के दौरान अब भी deprecated direct load/write helpers रखता है।
- **`openclaw/extension-api`** - एक bridge जिसने Plugins को embedded agent runner जैसे host-side helpers तक direct access दिया।
- **`api.registerEmbeddedExtensionFactory(...)`** - एक हटाया गया embedded-runner-only bundled extension hook, जो `tool_result` जैसे embedded-runner events को observe कर सकता था।

व्यापक import surfaces अब **deprecated** हैं। वे runtime पर अब भी काम करते हैं, लेकिन नए Plugins को उनका उपयोग नहीं करना चाहिए, और existing Plugins को अगले major release में इन्हें हटाए जाने से पहले migrate कर लेना चाहिए। embedded-runner-only extension factory registration API हटा दी गई है; इसके बजाय tool-result middleware का उपयोग करें।

OpenClaw replacement पेश करने वाले उसी change में documented Plugin behavior को remove या reinterpret नहीं करता। Breaking contract changes को पहले compatibility adapter, diagnostics, docs, और deprecation window से गुजरना होगा। यह SDK imports, manifest fields, setup APIs, hooks, और runtime registration behavior पर लागू होता है।

<Warning>
  पिछड़ी-संगतता लेयर किसी future major release में हटा दी जाएगी।
  जो Plugins अब भी इन surfaces से import करते हैं, वे ऐसा होने पर टूट जाएंगे।
  Legacy embedded extension factory registrations पहले ही अब load नहीं होते।
</Warning>

## यह क्यों बदला

पुराने approach ने समस्याएं पैदा कीं:

- **Slow startup** - एक helper import करने से दर्जनों असंबंधित modules load हो जाते थे
- **Circular dependencies** - व्यापक re-exports से import cycles बनाना आसान हो गया था
- **Unclear API surface** - यह बताने का कोई तरीका नहीं था कि कौन से exports stable हैं और कौन से internal

आधुनिक Plugin SDK इसे ठीक करता है: हर import path (`openclaw/plugin-sdk/\<subpath\>`) एक छोटा, self-contained module है, जिसका उद्देश्य साफ और contract documented है।

bundled channels के लिए legacy provider convenience seams भी हट गए हैं।
Channel-branded helper seams private mono-repo shortcuts थे, stable Plugin contracts नहीं। इसके बजाय narrow generic SDK subpaths का उपयोग करें। bundled Plugin workspace के अंदर, provider-owned helpers को उसी Plugin के अपने `api.ts` या `runtime-api.ts` में रखें।

Current bundled provider examples:

- Anthropic अपने Claude-specific stream helpers को अपने `api.ts` /
  `contract-api.ts` seam में रखता है
- OpenAI provider builders, default-model helpers, और realtime provider
  builders को अपने `api.ts` में रखता है
- OpenRouter provider builder और onboarding/config helpers को अपने
  `api.ts` में रखता है

## Talk और realtime voice migration plan

Realtime voice, telephony, meeting, और browser Talk code surface-local turn bookkeeping से हटकर `openclaw/plugin-sdk/realtime-voice` द्वारा export किए गए shared Talk session controller पर जा रहा है। नया controller common Talk event envelope, active turn state, capture state, output-audio state, recent event history, और stale-turn rejection का owner है। Provider Plugins को vendor-specific realtime sessions का ownership रखना चाहिए; surface Plugins को capture, playback, telephony, और meeting quirks का ownership रखना चाहिए।

यह Talk migration जानबूझकर breaking-clean है:

1. shared controller/runtime primitives को
   `plugin-sdk/realtime-voice` में रखें।
2. bundled surfaces को shared controller पर move करें: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, और native push-to-talk।
3. पुराने Talk RPC families को final `talk.session.*` और
   `talk.client.*` API से replace करें।
4. Gateway `hello-ok.features.events` में एक live Talk event channel advertise करें:
   `talk.event`।
5. पुराने realtime HTTP endpoint और किसी भी request-time instruction
   override path को delete करें।

नए code को `createTalkEventSequencer(...)` सीधे call नहीं करना चाहिए, जब तक कि वह कोई low-level adapter या test fixture implement न कर रहा हो। shared controller को prefer करें ताकि turn-scoped events बिना turn id के emit न हो सकें, stale `turnEnd` /
`turnCancel` calls किसी नए active turn को clear न कर सकें, और output-audio lifecycle events telephony, meetings, browser relay, managed-room handoff, और native Talk clients में consistent रहें।

Target public API shape यह है:

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

Browser-owned WebRTC/provider-websocket sessions `talk.client.create` का उपयोग करते हैं, क्योंकि browser provider negotiation और media transport own करता है, जबकि Gateway credentials, instructions, और tool policy own करता है। `talk.session.*` gateway-relay realtime, gateway-relay transcription, और managed-room native STT/TTS sessions के लिए common Gateway-managed surface है।

Legacy configs जिन्होंने realtime selectors को `talk.provider` /
`talk.providers` के पास रखा था, उन्हें `openclaw doctor --fix` से repair किया जाना चाहिए; runtime Talk speech/TTS provider config को realtime provider config के रूप में reinterpret नहीं करता।

Supported `talk.session.create` combinations जानबूझकर छोटे रखे गए हैं:

| Mode            | Transport       | Brain           | Owner              | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway के जरिए bridged full-duplex provider audio; tool calls agent-consult tool के जरिए route होते हैं।      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | केवल Streaming STT; callers input audio भेजते हैं और transcript events receive करते हैं।                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk और walkie-talkie style rooms, जहां client capture/playback own करता है और Gateway turn state own करता है। |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | trusted first-party surfaces के लिए admin-only room mode, जो Gateway tool actions को सीधे execute करते हैं।                  |

Removed method map:

| Old                              | New                                                      |
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
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | उसी Gateway कनेक्शन के स्वामित्व वाले प्रदाता सेशन में base64 PCM ऑडियो चंक जोड़ें।                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room उपयोगकर्ता टर्न शुरू करें।                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn सत्यापन के बाद सक्रिय टर्न समाप्त करें।                                                                                                                                         |
  | `talk.session.cancelTurn`       | सभी Gateway-स्वामित्व वाले सेशन                              | किसी टर्न के लिए सक्रिय capture/provider/agent/TTS कार्य रद्द करें।                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | उपयोगकर्ता टर्न को अनिवार्य रूप से समाप्त किए बिना असिस्टेंट ऑडियो आउटपुट रोकें।                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | relay द्वारा उत्सर्जित प्रदाता टूल कॉल पूरा करें; अंतरिम आउटपुट के लिए `options.willContinue` या किसी अन्य असिस्टेंट प्रतिक्रिया के बिना कॉल पूरा करने के लिए `options.suppressResponse` पास करें। |
  | `talk.session.steer`            | agent-समर्थित Talk सेशन                              | Talk सेशन से resolved सक्रिय embedded run को बोले गए `status`, `steer`, `cancel`, या `followup` नियंत्रण भेजें।                                                                |
  | `talk.session.close`            | सभी एकीकृत सेशन                                    | relay सेशन रोकें या managed-room स्थिति निरस्त करें, फिर एकीकृत सेशन id भूल जाएं।                                                                                                    |

  इसे काम कराने के लिए core में प्रदाता या प्लेटफॉर्म विशेष मामले न जोड़ें।
  core Talk सेशन semantics का स्वामी है। प्रदाता plugins vendor सेशन सेटअप के स्वामी हैं।
  voice-call और Google Meet telephony/meeting adapters के स्वामी हैं। browser और native
  apps device capture/playback UX के स्वामी हैं।

  ## संगतता नीति

  external plugins के लिए, संगतता कार्य इस क्रम का पालन करता है:

  1. नया अनुबंध जोड़ें
  2. पुराने व्यवहार को compatibility adapter के माध्यम से wired रखें
  3. ऐसा diagnostic या warning उत्सर्जित करें जो पुराने पथ और प्रतिस्थापन का नाम बताए
  4. दोनों पथों को tests में cover करें
  5. deprecation और migration path को document करें
  6. announced migration window के बाद ही हटाएं, आम तौर पर major release में

  Maintainers वर्तमान migration queue का audit
  `pnpm plugins:boundary-report` से कर सकते हैं। compact counts के लिए `pnpm plugins:boundary-report:summary`, एक Plugin या compatibility owner के लिए `--owner <id>`, और
  जब CI gate को due compatibility records, cross-owner reserved SDK imports, या unused reserved SDK
  subpaths पर fail होना चाहिए तब
  `pnpm plugins:boundary-report:ci` का उपयोग करें। report deprecated
  compatibility records को removal date के अनुसार group करती है, local code/docs references गिनती है,
  cross-owner reserved SDK imports surface करती है, और private
  memory-host SDK bridge को summarize करती है ताकि compatibility cleanup ad hoc searches पर
  निर्भर रहने के बजाय explicit रहे। Reserved SDK subpaths में tracked owner usage होना चाहिए;
  unused reserved helper exports को public SDK से हटा देना चाहिए।

  यदि कोई manifest field अभी भी स्वीकार किया जाता है, तो plugin authors उसे तब तक use कर सकते हैं जब तक
  docs और diagnostics अन्यथा न कहें। नए code को documented
  replacement को prefer करना चाहिए, लेकिन मौजूदा plugins ordinary minor
  releases के दौरान break नहीं होने चाहिए।

  ## migrate कैसे करें

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Bundled plugins को
    `api.runtime.config.loadConfig()` और
    `api.runtime.config.writeConfigFile(...)` को सीधे call करना बंद कर देना चाहिए। उस config को prefer करें जो
    active call path में पहले से pass किया गया था। Long-lived handlers जिन्हें
    current process snapshot चाहिए, वे `api.runtime.config.current()` का उपयोग कर सकते हैं। Long-lived
    agent tools को `execute` के अंदर tool context के `ctx.getRuntimeConfig()` का उपयोग करना चाहिए
    ताकि config write से पहले बनाया गया tool भी refreshed
    runtime config देख सके।

    Config writes को transactional helpers से गुजरना चाहिए और एक
    after-write policy चुननी चाहिए:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    जब caller जानता है कि change को clean gateway restart चाहिए, तब
    `afterWrite: { mode: "restart", reason: "..." }` का उपयोग करें, और
    `afterWrite: { mode: "none", reason: "..." }` का उपयोग केवल तब करें जब caller follow-up का स्वामी हो और जानबूझकर reload planner को suppress करना चाहता हो।
    Mutation results में tests और logging के लिए typed `followUp` summary शामिल होती है;
    restart लागू करने या schedule करने की जिम्मेदारी gateway की रहती है।
    `loadConfig` और `writeConfigFile` migration window के दौरान external plugins के लिए deprecated compatibility
    helpers के रूप में बने रहते हैं और
    `runtime-config-load-write` compatibility code के साथ एक बार warn करते हैं। Bundled plugins और repo
    runtime code को scanner guardrails द्वारा
    `pnpm check:deprecated-api-usage` और
    `pnpm check:no-runtime-action-load-config` में protect किया जाता है: नया production plugin usage
    सीधे fail होता है, direct config writes fail होते हैं, gateway server methods को
    request runtime snapshot का उपयोग करना चाहिए, runtime channel send/action/client helpers को
    अपने boundary से config receive करना चाहिए, और long-lived runtime modules में
    ambient `loadConfig()` calls की allowed संख्या zero है।

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
    barrel के विरुद्ध scanner-guard किया गया है ताकि imports और mocks उस behavior के local रहें जिसकी उन्हें जरूरत है। Broad
    barrel external compatibility के लिए अभी भी मौजूद है, लेकिन नए code को उस पर
    depend नहीं करना चाहिए।

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

    उसी समय Plugin manifest update करें:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Installed plugins tool-result middleware भी register कर सकते हैं जब वे
    स्पष्ट रूप से enabled हों और
    `contracts.agentToolResultMiddleware` में हर targeted runtime declare करें। Undeclared installed middleware
    registrations reject किए जाते हैं।

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Approval-capable channel plugins अब native approval behavior को
    `approvalCapability.nativeRuntime` और shared runtime-context registry के माध्यम से expose करते हैं।

    मुख्य बदलाव:

    - `approvalCapability.handler.loadRuntime(...)` को
      `approvalCapability.nativeRuntime` से replace करें
    - approval-specific auth/delivery को legacy `plugin.auth` /
      `plugin.approvals` wiring से हटाकर `approvalCapability` पर move करें
    - `ChannelPlugin.approvals` को public channel-plugin
      contract से हटा दिया गया है; delivery/native/render fields को `approvalCapability` पर move करें
    - `plugin.auth` केवल channel login/logout flows के लिए रहता है; core अब वहां approval auth
      hooks नहीं पढ़ता
    - clients, tokens, या Bolt
      apps जैसे channel-owned runtime objects को `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से register करें
    - native approval handlers से plugin-owned reroute notices न भेजें;
      core अब actual delivery results से routed-elsewhere notices का स्वामी है
    - `createChannelManager(...)` में `channelRuntime` pass करते समय,
      real `createPluginRuntime().channel` surface प्रदान करें। Partial stubs reject किए जाते हैं।

    current approval capability
    layout के लिए `/plugins/sdk-channel-plugins` देखें।

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    यदि आपका Plugin `openclaw/plugin-sdk/windows-spawn` का उपयोग करता है, तो unresolved Windows
    `.cmd`/`.bat` wrappers अब fail closed होते हैं, जब तक आप स्पष्ट रूप से
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

    यदि आपका caller जानबूझकर shell fallback पर rely नहीं करता, तो
    `allowShellFallback` set न करें और thrown error को handle करें।

  </Step>

  <Step title="Find deprecated imports">
    अपने Plugin में किसी भी deprecated surface से imports search करें:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    old surface से प्रत्येक export एक specific modern import path से map होता है:

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

    host-side helpers के लिए, सीधे import करने के बजाय injected plugin runtime का उपयोग करें:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    यही पैटर्न अन्य पुराने bridge helpers पर भी लागू होता है:

    | पुराना इम्पोर्ट | आधुनिक समतुल्य |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` बाहरी संगतता के लिए अभी भी मौजूद है,
    लेकिन नए कोड को वही केंद्रित helper surface इम्पोर्ट करना चाहिए जिसकी
    उसे वास्तव में आवश्यकता है:

    | आवश्यकता | इम्पोर्ट |
    | --- | --- |
    | सिस्टम इवेंट queue helpers | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat wake, event, और visibility helpers | `openclaw/plugin-sdk/heartbeat-runtime` |
    | लंबित delivery queue drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | चैनल activity telemetry | `openclaw/plugin-sdk/channel-activity-runtime` |
    | इन-मेमोरी dedupe caches | `openclaw/plugin-sdk/dedupe-runtime` |
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
    | Numeric coercion | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | File locks | `openclaw/plugin-sdk/file-lock` |

    बंडल किए गए Plugin को `infra-runtime` के विरुद्ध scanner-guarded रखा गया है,
    इसलिए repo code व्यापक barrel पर वापस नहीं जा सकता।

  </Step>

  <Step title="Migrate channel route helpers">
    नए channel route code को `openclaw/plugin-sdk/channel-route` का उपयोग करना चाहिए।
    पुराने route-key और comparable-target नाम migration window के दौरान compatibility
    aliases के रूप में बने रहते हैं, लेकिन नए Plugin को वे route नाम उपयोग करने
    चाहिए जो behavior को सीधे वर्णित करते हैं:

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

    `ChannelMessagingAdapter.parseExplicitTarget` या parser-backed loaded-route
    helpers (`parseExplicitTargetForLoadedChannel` या
    `resolveRouteTargetForLoadedChannel`) या `plugin-sdk/channel-route` से
    `resolveChannelRouteTargetWithParser(...)` के नए उपयोग न जोड़ें।
    ये hooks deprecated हैं और migration window के दौरान केवल पुराने Plugin के
    लिए बने रहते हैं। नए channel Plugin को target id normalization और
    directory-miss fallback के लिए `messaging.targetResolver.resolveTarget(...)`,
    जब core को early peer kind चाहिए तब `messaging.inferTargetChatType(...)`,
    और provider-native session और thread identity के लिए
    `messaging.resolveOutboundSessionRoute(...)` का उपयोग करना चाहिए।

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## इम्पोर्ट path reference

  <Accordion title="सामान्य import path तालिका">
  | Import path | उद्देश्य | मुख्य exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | कैननिकल Plugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | channel entry परिभाषाओं/builders के लिए legacy umbrella re-export | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | root config schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | single-provider entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | केंद्रित channel entry परिभाषाएँ और builders | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | साझा setup wizard helpers | Setup translator, allowlist prompts, setup status builders |
  | `plugin-sdk/setup-runtime` | setup-time runtime helpers | `createSetupTranslator`, import-safe setup patch adapters, lookup-note helpers, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | अप्रचलित setup adapter alias | `plugin-sdk/setup-runtime` का उपयोग करें |
  | `plugin-sdk/setup-tools` | setup tooling helpers | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | multi-account helpers | account list/config/action-gate helpers |
  | `plugin-sdk/account-id` | account-id helpers | `DEFAULT_ACCOUNT_ID`, account-id normalization |
  | `plugin-sdk/account-resolution` | account lookup helpers | account lookup + default-fallback helpers |
  | `plugin-sdk/account-helpers` | संकीर्ण account helpers | account list/account-action helpers |
  | `plugin-sdk/channel-setup` | setup wizard adapters | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing primitives | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | reply prefix, typing, और source-delivery wiring | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | config adapter factories और DM access helpers | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | config schema builders | साझा channel config schema primitives और केवल generic builder |
  | `plugin-sdk/bundled-channel-config-schema` | bundled config schemas | केवल OpenClaw-maintained bundled plugins; नए plugins को plugin-local schemas परिभाषित करने होंगे |
  | `plugin-sdk/channel-config-schema-legacy` | अप्रचलित bundled config schemas | केवल compatibility alias; maintained bundled plugins के लिए `plugin-sdk/bundled-channel-config-schema` का उपयोग करें |
  | `plugin-sdk/telegram-command-config` | Telegram command config helpers | command-name normalization, description trimming, duplicate/conflict validation |
  | `plugin-sdk/channel-policy` | group/DM policy resolution | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | अप्रचलित compatibility facade | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/inbound-envelope` | inbound envelope helpers | साझा route + envelope builder helpers |
  | `plugin-sdk/channel-inbound` | inbound receive helpers | context building, formatting, roots, runners, prepared reply dispatch, और dispatch predicates |
  | `plugin-sdk/messaging-targets` | अप्रचलित target parsing import path | generic target parsing helpers के लिए `plugin-sdk/channel-targets`, route comparison के लिए `plugin-sdk/channel-route`, और provider-specific target resolution के लिए plugin-owned `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` का उपयोग करें |
  | `plugin-sdk/outbound-media` | outbound media helpers | साझा outbound media loading |
  | `plugin-sdk/outbound-send-deps` | अप्रचलित compatibility facade | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/channel-outbound` | outbound message lifecycle helpers | message adapters, receipts, durable send helpers, live preview/streaming helpers, reply options, lifecycle helpers, outbound identity, और payload planning |
  | `plugin-sdk/channel-streaming` | अप्रचलित compatibility facade | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/outbound-runtime` | अप्रचलित compatibility facade | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helpers | thread-binding lifecycle और adapter helpers |
  | `plugin-sdk/agent-media-payload` | legacy media payload helpers | legacy field layouts के लिए agent media payload builder |
  | `plugin-sdk/channel-runtime` | अप्रचलित compatibility shim | केवल legacy channel runtime utilities |
  | `plugin-sdk/channel-send-result` | send result types | reply result types |
  | `plugin-sdk/runtime-store` | persistent Plugin storage | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | व्यापक runtime helpers | runtime/logging/backup/plugin-install helpers |
  | `plugin-sdk/runtime-env` | संकीर्ण runtime env helpers | logger/runtime env, timeout, retry, और backoff helpers |
  | `plugin-sdk/plugin-runtime` | साझा Plugin runtime helpers | Plugin commands/hooks/http/interactive helpers |
  | `plugin-sdk/hook-runtime` | hook pipeline helpers | साझा Webhook/internal hook pipeline helpers |
  | `plugin-sdk/lazy-runtime` | lazy runtime helpers | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helpers | साझा exec helpers |
  | `plugin-sdk/cli-runtime` | CLI runtime helpers | command formatting, waits, version helpers |
  | `plugin-sdk/gateway-runtime` | Gateway helpers | Gateway client, event-loop-ready start helper, और channel-status patch helpers |
  | `plugin-sdk/config-runtime` | अप्रचलित config compatibility shim | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, और `config-mutation` को प्राथमिकता दें |
  | `plugin-sdk/telegram-command-config` | Telegram command helpers | bundled Telegram contract surface अनुपलब्ध होने पर fallback-stable Telegram command validation helpers |
  | `plugin-sdk/approval-runtime` | approval prompt helpers | exec/Plugin approval payload, approval capability/profile helpers, native approval routing/runtime helpers, और structured approval display path formatting |
  | `plugin-sdk/approval-auth-runtime` | approval auth helpers | approver resolution, same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client helpers | native exec approval profile/filter helpers |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery helpers | native approval capability/delivery adapters |
  | `plugin-sdk/approval-gateway-runtime` | approval Gateway helpers | साझा approval Gateway-resolution helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval adapter helpers | hot channel entrypoints के लिए हल्के native approval adapter loading helpers |
  | `plugin-sdk/approval-handler-runtime` | approval handler helpers | व्यापक approval handler runtime helpers; पर्याप्त होने पर संकीर्ण adapter/Gateway seams को प्राथमिकता दें |
  | `plugin-sdk/approval-native-runtime` | approval target helpers | native approval target/account binding helpers |
  | `plugin-sdk/approval-reply-runtime` | approval reply helpers | exec/Plugin approval reply payload helpers |
  | `plugin-sdk/channel-runtime-context` | channel runtime-context helpers | generic channel runtime-context register/get/watch helpers |
  | `plugin-sdk/security-runtime` | security helpers | साझा trust, DM gating, root-bounded file/path helpers, external-content, और secret-collection helpers |
  | `plugin-sdk/ssrf-policy` | SSRF policy helpers | host allowlist और private-network policy helpers |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helpers | pinned-dispatcher, guarded fetch, SSRF policy helpers |
  | `plugin-sdk/system-event-runtime` | system event helpers | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat helpers | Heartbeat wake, event, और visibility helpers |
  | `plugin-sdk/delivery-queue-runtime` | delivery queue helpers | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | channel activity helpers | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | dedupe helpers | in-memory dedupe caches |
  | `plugin-sdk/file-access-runtime` | file access helpers | सुरक्षित local-file/media path helpers |
  | `plugin-sdk/transport-ready-runtime` | transport readiness helpers | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | exec approval policy helpers | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | bounded cache helpers | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic gating helpers | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting helpers | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helpers |
  | `plugin-sdk/fetch-runtime` | wrapped fetch/proxy helpers | `resolveFetch`, proxy helpers, EnvHttpProxyAgent option helpers |
  | `plugin-sdk/host-runtime` | host normalization helpers | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helpers | `RetryConfig`, `retryAsync`, policy runners |
  | `plugin-sdk/allow-from` | allowlist formatting और input mapping | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gating और command-surface helpers | `resolveControlCommandGate`, sender-authorization helpers, dynamic argument menu formatting सहित command registry helpers |
  | `plugin-sdk/command-status` | command status/help renderers | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret input parsing | secret input helpers |
  | `plugin-sdk/webhook-ingress` | Webhook request helpers | Webhook target utilities |
  | `plugin-sdk/webhook-request-guards` | Webhook body guard helpers | request body read/limit helpers |
  | `plugin-sdk/reply-runtime` | साझा reply runtime | inbound dispatch, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | संकीर्ण reply dispatch helpers | finalize, provider dispatch, और conversation-label helpers |
  | `plugin-sdk/reply-history` | reply-history helpers | `createChannelHistoryWindow`; deprecated map-helper compatibility exports जैसे `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, और `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helpers | text/markdown chunking helpers |
  | `plugin-sdk/session-store-runtime` | session store helpers | store path + updated-at helpers |
  | `plugin-sdk/state-paths` | state path helpers | state और OAuth dir helpers |
  | `plugin-sdk/routing` | रूटिंग/सेशन-की सहायक | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, सेशन-की सामान्यीकरण सहायक |
  | `plugin-sdk/status-helpers` | चैनल स्थिति सहायक | चैनल/खाता स्थिति सारांश निर्माता, रनटाइम-स्थिति डिफ़ॉल्ट, समस्या मेटाडेटा सहायक |
  | `plugin-sdk/target-resolver-runtime` | लक्ष्य रिज़ॉल्वर सहायक | साझा लक्ष्य रिज़ॉल्वर सहायक |
  | `plugin-sdk/string-normalization-runtime` | स्ट्रिंग सामान्यीकरण सहायक | स्लग/स्ट्रिंग सामान्यीकरण सहायक |
  | `plugin-sdk/request-url` | अनुरोध URL सहायक | अनुरोध-जैसे इनपुट से स्ट्रिंग URL निकालें |
  | `plugin-sdk/run-command` | समयबद्ध कमांड सहायक | सामान्यीकृत stdout/stderr के साथ समयबद्ध कमांड रनर |
  | `plugin-sdk/param-readers` | पैरामीटर रीडर | सामान्य टूल/CLI पैरामीटर रीडर |
  | `plugin-sdk/tool-payload` | टूल पेलोड निष्कर्षण | टूल परिणाम ऑब्जेक्ट से सामान्यीकृत पेलोड निकालें |
  | `plugin-sdk/tool-send` | टूल भेजने का निष्कर्षण | टूल आर्ग्युमेंट से कैननिकल भेजने-लक्ष्य फ़ील्ड निकालें |
  | `plugin-sdk/temp-path` | अस्थायी पथ सहायक | साझा अस्थायी-डाउनलोड पथ सहायक |
  | `plugin-sdk/logging-core` | लॉगिंग सहायक | उपप्रणाली लॉगर और रिडैक्शन सहायक |
  | `plugin-sdk/markdown-table-runtime` | Markdown-तालिका सहायक | Markdown तालिका मोड सहायक |
  | `plugin-sdk/reply-payload` | संदेश उत्तर प्रकार | उत्तर पेलोड प्रकार |
  | `plugin-sdk/provider-setup` | चुने हुए स्थानीय/स्व-होस्टेड प्रदाता सेटअप सहायक | स्व-होस्टेड प्रदाता खोज/कॉन्फ़िगरेशन सहायक |
  | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्व-होस्टेड प्रदाता सेटअप सहायक | वही स्व-होस्टेड प्रदाता खोज/कॉन्फ़िगरेशन सहायक |
  | `plugin-sdk/provider-auth-runtime` | प्रदाता रनटाइम प्रमाणीकरण सहायक | रनटाइम API-की रिज़ॉल्यूशन सहायक |
  | `plugin-sdk/provider-auth-api-key` | प्रदाता API-की सेटअप सहायक | API-की ऑनबोर्डिंग/प्रोफ़ाइल-लेखन सहायक |
  | `plugin-sdk/provider-auth-result` | प्रदाता प्रमाणीकरण-परिणाम सहायक | मानक OAuth प्रमाणीकरण-परिणाम निर्माता |
  | `plugin-sdk/provider-selection-runtime` | प्रदाता चयन सहायक | कॉन्फ़िगर-या-स्वचालित प्रदाता चयन और कच्चे प्रदाता कॉन्फ़िगरेशन मर्जिंग |
  | `plugin-sdk/provider-env-vars` | प्रदाता env-var सहायक | प्रदाता प्रमाणीकरण env-var लुकअप सहायक |
  | `plugin-sdk/provider-model-shared` | साझा प्रदाता मॉडल/रीप्ले सहायक | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा रीप्ले-नीति निर्माता, प्रदाता-एंडपॉइंट सहायक, और मॉडल-id सामान्यीकरण सहायक |
  | `plugin-sdk/provider-catalog-shared` | साझा प्रदाता कैटलॉग सहायक | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | प्रदाता ऑनबोर्डिंग पैच | ऑनबोर्डिंग कॉन्फ़िगरेशन सहायक |
  | `plugin-sdk/provider-http` | प्रदाता HTTP सहायक | सामान्य प्रदाता HTTP/एंडपॉइंट क्षमता सहायक, जिनमें ऑडियो ट्रांसक्रिप्शन मल्टीपार्ट फ़ॉर्म सहायक शामिल हैं |
  | `plugin-sdk/provider-web-fetch` | प्रदाता web-fetch सहायक | Web-fetch प्रदाता पंजीकरण/कैश सहायक |
  | `plugin-sdk/provider-web-search-config-contract` | प्रदाता web-search कॉन्फ़िगरेशन सहायक | उन प्रदाताओं के लिए संकीर्ण web-search कॉन्फ़िगरेशन/क्रेडेंशियल सहायक जिन्हें plugin-enable वायरिंग की आवश्यकता नहीं होती |
  | `plugin-sdk/provider-web-search-contract` | प्रदाता web-search अनुबंध सहायक | संकीर्ण web-search कॉन्फ़िगरेशन/क्रेडेंशियल अनुबंध सहायक जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और स्कोप किए गए क्रेडेंशियल सेटर/गेटर |
  | `plugin-sdk/provider-web-search` | प्रदाता web-search सहायक | Web-search प्रदाता पंजीकरण/कैश/रनटाइम सहायक |
  | `plugin-sdk/provider-tools` | प्रदाता टूल/स्कीमा संगतता सहायक | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI स्कीमा सफ़ाई + निदान |
  | `plugin-sdk/provider-usage` | प्रदाता उपयोग सहायक | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, और अन्य प्रदाता उपयोग सहायक |
  | `plugin-sdk/provider-stream` | प्रदाता स्ट्रीम रैपर सहायक | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, स्ट्रीम रैपर प्रकार, और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot रैपर सहायक |
  | `plugin-sdk/provider-transport-runtime` | प्रदाता ट्रांसपोर्ट सहायक | नेटिव प्रदाता ट्रांसपोर्ट सहायक जैसे guarded fetch, ट्रांसपोर्ट संदेश रूपांतरण, और लिखने योग्य ट्रांसपोर्ट इवेंट स्ट्रीम |
  | `plugin-sdk/keyed-async-queue` | क्रमबद्ध असिंक कतार | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | साझा मीडिया सहायक | मीडिया fetch/transform/store सहायक, ffprobe-समर्थित वीडियो आयाम जांच, और मीडिया पेलोड निर्माता |
  | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन सहायक | छवि/वीडियो/संगीत जनरेशन के लिए साझा failover सहायक, उम्मीदवार चयन, और अनुपलब्ध-मॉडल संदेश |
  | `plugin-sdk/media-understanding` | मीडिया-समझ सहायक | मीडिया समझ प्रदाता प्रकार और प्रदाता-सामने छवि/ऑडियो सहायक एक्सपोर्ट |
  | `plugin-sdk/text-runtime` | अप्रचलित व्यापक पाठ संगतता एक्सपोर्ट | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, और `logging-core` का उपयोग करें |
  | `plugin-sdk/text-chunking` | पाठ खंडन सहायक | आउटबाउंड पाठ खंडन सहायक |
  | `plugin-sdk/speech` | वाक् सहायक | वाक् प्रदाता प्रकार और प्रदाता-सामने निर्देश, रजिस्ट्री, सत्यापन सहायक, और OpenAI-संगत TTS निर्माता |
  | `plugin-sdk/speech-core` | साझा वाक् कोर | वाक् प्रदाता प्रकार, रजिस्ट्री, निर्देश, सामान्यीकरण |
  | `plugin-sdk/realtime-transcription` | रियलटाइम ट्रांसक्रिप्शन सहायक | प्रदाता प्रकार, रजिस्ट्री सहायक, और साझा WebSocket सेशन सहायक |
  | `plugin-sdk/realtime-voice` | रियलटाइम वॉइस सहायक | प्रदाता प्रकार, रजिस्ट्री/रिज़ॉल्यूशन सहायक, ब्रिज सेशन सहायक, साझा एजेंट talk-back कतारें, सक्रिय-run वॉइस नियंत्रण, ट्रांसक्रिप्ट/इवेंट स्वास्थ्य, echo suppression, consult प्रश्न मिलान, forced-consult समन्वय, turn-context ट्रैकिंग, आउटपुट गतिविधि ट्रैकिंग, और तेज़ संदर्भ consult सहायक |
  | `plugin-sdk/image-generation` | छवि-जनरेशन सहायक | छवि जनरेशन प्रदाता प्रकार और छवि एसेट/डेटा URL सहायक तथा OpenAI-संगत छवि प्रदाता निर्माता |
  | `plugin-sdk/image-generation-core` | साझा छवि-जनरेशन कोर | छवि-जनरेशन प्रकार, failover, प्रमाणीकरण, और रजिस्ट्री सहायक |
  | `plugin-sdk/music-generation` | संगीत-जनरेशन सहायक | संगीत-जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
  | `plugin-sdk/music-generation-core` | साझा संगीत-जनरेशन कोर | संगीत-जनरेशन प्रकार, failover सहायक, प्रदाता लुकअप, और model-ref पार्सिंग |
  | `plugin-sdk/video-generation` | वीडियो-जनरेशन सहायक | वीडियो-जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
  | `plugin-sdk/video-generation-core` | साझा वीडियो-जनरेशन कोर | वीडियो-जनरेशन प्रकार, failover सहायक, प्रदाता लुकअप, और model-ref पार्सिंग |
  | `plugin-sdk/interactive-runtime` | इंटरैक्टिव उत्तर सहायक | इंटरैक्टिव उत्तर पेलोड सामान्यीकरण/घटाना |
  | `plugin-sdk/channel-config-primitives` | चैनल कॉन्फ़िगरेशन प्रिमिटिव | संकीर्ण चैनल कॉन्फ़िगरेशन-स्कीमा प्रिमिटिव |
  | `plugin-sdk/channel-config-writes` | चैनल कॉन्फ़िगरेशन-लेखन सहायक | चैनल कॉन्फ़िगरेशन-लेखन प्राधिकरण सहायक |
  | `plugin-sdk/channel-plugin-common` | साझा चैनल प्रस्तावना | साझा चैनल Plugin प्रस्तावना एक्सपोर्ट |
  | `plugin-sdk/channel-status` | चैनल स्थिति सहायक | साझा चैनल स्थिति स्नैपशॉट/सारांश सहायक |
  | `plugin-sdk/allowlist-config-edit` | Allowlist कॉन्फ़िगरेशन सहायक | Allowlist कॉन्फ़िगरेशन संपादन/पठन सहायक |
  | `plugin-sdk/group-access` | समूह पहुंच सहायक | साझा समूह-पहुंच निर्णय सहायक |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-inbound` का उपयोग करें |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM guard सहायक | संकीर्ण pre-crypto guard नीति सहायक |
  | `plugin-sdk/extension-shared` | साझा एक्सटेंशन सहायक | passive-channel/status और ambient proxy सहायक प्रिमिटिव |
  | `plugin-sdk/webhook-targets` | Webhook लक्ष्य सहायक | Webhook लक्ष्य रजिस्ट्री और route-install सहायक |
  | `plugin-sdk/webhook-path` | अप्रचलित Webhook पथ उपनाम | `plugin-sdk/webhook-ingress` का उपयोग करें |
  | `plugin-sdk/web-media` | साझा वेब मीडिया सहायक | रिमोट/स्थानीय मीडिया लोडिंग सहायक |
  | `plugin-sdk/zod` | अप्रचलित Zod संगतता पुनः-एक्सपोर्ट | `zod` से सीधे `zod` आयात करें |
  | `plugin-sdk/memory-core` | बंडल किए गए memory-core सहायक | मेमरी प्रबंधक/कॉन्फ़िगरेशन/फ़ाइल/CLI सहायक सतह |
  | `plugin-sdk/memory-core-engine-runtime` | मेमरी इंजन रनटाइम फ़साड | मेमरी इंडेक्स/खोज रनटाइम फ़साड |
  | `plugin-sdk/memory-core-host-embedding-registry` | मेमरी एम्बेडिंग रजिस्ट्री | हल्के मेमरी एम्बेडिंग प्रदाता रजिस्ट्री सहायक |
  | `plugin-sdk/memory-core-host-engine-foundation` | मेमरी होस्ट फ़ाउंडेशन इंजन | मेमरी होस्ट फ़ाउंडेशन इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-engine-embeddings` | मेमरी होस्ट एम्बेडिंग इंजन | मेमरी एम्बेडिंग अनुबंध, रजिस्ट्री पहुंच, स्थानीय प्रदाता, और सामान्य बैच/रिमोट सहायक; ठोस रिमोट प्रदाता अपने स्वामी plugins में रहते हैं |
  | `plugin-sdk/memory-core-host-engine-qmd` | मेमरी होस्ट QMD इंजन | मेमरी होस्ट QMD इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-engine-storage` | मेमरी होस्ट स्टोरेज इंजन | मेमरी होस्ट स्टोरेज इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-multimodal` | मेमरी होस्ट मल्टीमॉडल सहायक | मेमरी होस्ट मल्टीमॉडल सहायक |
  | `plugin-sdk/memory-core-host-query` | मेमरी होस्ट क्वेरी सहायक | मेमरी होस्ट क्वेरी सहायक |
  | `plugin-sdk/memory-core-host-secret` | मेमरी होस्ट सीक्रेट सहायक | मेमरी होस्ट सीक्रेट सहायक |
  | `plugin-sdk/memory-core-host-events` | अप्रचलित मेमरी इवेंट उपनाम | `plugin-sdk/memory-host-events` का उपयोग करें |
  | `plugin-sdk/memory-core-host-status` | मेमरी होस्ट स्थिति सहायक | मेमरी होस्ट स्थिति सहायक |
  | `plugin-sdk/memory-core-host-runtime-cli` | मेमरी होस्ट CLI रनटाइम | मेमरी होस्ट CLI रनटाइम सहायक |
  | `plugin-sdk/memory-core-host-runtime-core` | मेमरी होस्ट कोर रनटाइम | मेमरी होस्ट कोर रनटाइम सहायक |
  | `plugin-sdk/memory-core-host-runtime-files` | मेमरी होस्ट फ़ाइल/रनटाइम सहायक | मेमरी होस्ट फ़ाइल/रनटाइम सहायक |
  | `plugin-sdk/memory-host-core` | मेमरी होस्ट कोर रनटाइम उपनाम | मेमरी होस्ट कोर रनटाइम सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
  | `plugin-sdk/memory-host-events` | मेमरी होस्ट इवेंट जर्नल उपनाम | मेमरी होस्ट इवेंट जर्नल सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
  | `plugin-sdk/memory-host-files` | अप्रचलित मेमरी फ़ाइल/रनटाइम उपनाम | `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
  | `plugin-sdk/memory-host-markdown` | प्रबंधित markdown सहायक | मेमरी-निकट plugins के लिए साझा प्रबंधित-markdown सहायक |
  | `plugin-sdk/memory-host-search` | Active Memory खोज फ़साड | Lazy active-memory खोज-प्रबंधक रनटाइम फ़साड |
  | `plugin-sdk/memory-host-status` | अप्रचलित मेमरी होस्ट स्थिति उपनाम | `plugin-sdk/memory-core-host-status` का उपयोग करें |
  | `plugin-sdk/testing` | परीक्षण उपयोगिताएं | रेपो-स्थानीय अप्रचलित संगतता barrel; केंद्रित रेपो-स्थानीय परीक्षण उपपथों का उपयोग करें जैसे `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, और `plugin-sdk/test-fixtures` |
</Accordion>

यह तालिका जानबूझकर सामान्य माइग्रेशन उपसमुच्चय है, पूर्ण SDK
सतह नहीं। कंपाइलर एंट्रीपॉइंट इन्वेंटरी
`scripts/lib/plugin-sdk-entrypoints.json` में रहती है; package exports
सार्वजनिक उपसमुच्चय से जनरेट किए जाते हैं।

आरक्षित bundled-plugin helper seams को सार्वजनिक SDK
export map से हटा दिया गया है, सिवाय स्पष्ट रूप से प्रलेखित compatibility facades
जैसे deprecated `plugin-sdk/discord` shim, जिसे प्रकाशित
`@openclaw/discord@2026.3.13` package के लिए बनाए रखा गया है। Owner-specific helpers
स्वामित्व रखने वाले Plugin package के अंदर रहते हैं; साझा host behavior को generic SDK
contracts जैसे `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
और `plugin-sdk/plugin-config-runtime` के माध्यम से जाना चाहिए।

काम से मेल खाने वाला सबसे संकीर्ण import उपयोग करें। अगर आपको कोई export नहीं मिलता,
तो `src/plugin-sdk/` पर source देखें या maintainers से पूछें कि कौन सा generic contract
उसका स्वामी होना चाहिए।

## सक्रिय deprecations

Plugin SDK, provider contract, runtime surface, और manifest पर लागू होने वाली संकरी deprecations।
इनमें से हर एक आज भी काम करता है, लेकिन भविष्य की major release में हटाया जाएगा।
हर item के नीचे दी गई entry पुराने API को उसके canonical replacement से map करती है।

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

    **नया**: `resolveInboundMentionDecision({ facts, policy })` - दो अलग calls
    के बजाय एक single decision object लौटाता है।

    Downstream channel plugins (Slack, Discord, Matrix, MS Teams) पहले ही
    switch कर चुके हैं।

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` पुराने channel plugins के लिए compatibility shim है।
    नए code से इसे import न करें; runtime objects register करने के लिए
    `openclaw/plugin-sdk/channel-runtime-context` उपयोग करें।

    `openclaw/plugin-sdk/channel-actions` में `channelActions*` helpers
    raw "actions" channel exports के साथ deprecated हैं। इसके बजाय semantic
    `presentation` surface के माध्यम से capabilities expose करें - channel plugins
    यह declare करते हैं कि वे क्या render करते हैं (cards, buttons, selects), न कि वे कौन से raw
    action names स्वीकार करते हैं।

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
    plugins routing metadata (thread, topic, reply-to, reactions) को
    prompt string में जोड़ने के बजाय typed fields के रूप में attach करते हैं।
    `formatAgentEnvelope(...)` helper synthesized assistant-facing envelopes के लिए
    अभी भी supported है, लेकिन inbound plaintext envelopes हटाए जा रहे हैं।

    प्रभावित क्षेत्र: `inbound_claim`, `message_received`, और कोई भी custom
    channel Plugin जिसने `channelEnvelope` text को post-process किया।

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **पुराना**: `api.on("deactivate", handler)`।

    **नया**: `api.on("gateway_stop", handler)`। event और context वही
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

    **नया**: core को channel session-binding adapter के माध्यम से `thread: true`
    subagent bindings तैयार करने दें। केवल post-launch observation के लिए
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` केवल deprecated
    compatibility surfaces के रूप में रहते हैं, जब तक external plugins migrate करते हैं।

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    चार discovery type aliases अब catalog-era types पर thin wrappers हैं:

    | पुराना alias                 | नया type                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    साथ ही legacy `ProviderCapabilities` static bag - provider plugins
    को static object के बजाय explicit provider hooks जैसे `buildReplayPolicy`,
    `normalizeToolSchemas`, और `wrapStreamFn` उपयोग करने चाहिए।

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **पुराना** (`ProviderThinkingPolicy` पर तीन अलग hooks):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, और
    `resolveDefaultThinkingLevel(ctx)`।

    **नया**: एक single `resolveThinkingProfile(ctx)` जो canonical `id`,
    optional `label`, और ranked level list के साथ `ProviderThinkingProfile`
    लौटाता है। OpenClaw stale stored values को profile rank के आधार पर
    automatically downgrade करता है।

    context में `provider`, `modelId`, optional merged `reasoning`,
    और optional merged model `compat` facts शामिल हैं। Provider plugins उन
    catalog facts का उपयोग model-specific profile expose करने के लिए केवल तब कर सकते हैं
    जब configured request contract इसका समर्थन करता हो।

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

    **नया**: manifest पर उसी env-var lookup को `setup.providers[].envVars`
    में mirror करें। यह setup/status env metadata को एक जगह consolidate करता है
    और env-var lookups का जवाब देने के लिए Plugin runtime boot करने से बचाता है।

    `providerAuthEnvVars` compatibility adapter के माध्यम से तब तक supported रहता है
    जब तक deprecation window बंद नहीं होती।

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **पुराना**: तीन अलग calls -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **नया**: memory-state API पर एक call -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    वही slots, single registration call। Additive prompt और corpus helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) प्रभावित नहीं हैं।

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **पुराना**: `api.registerMemoryEmbeddingProvider(...)` और
    `contracts.memoryEmbeddingProviders`।

    **नया**: `api.registerEmbeddingProvider(...)` और
    `contracts.embeddingProviders`।

    generic embedding provider contract memory के बाहर भी reusable है और
    नए providers के लिए supported path है। memory-specific registration API
    deprecated compatibility के रूप में wired रहता है, जब तक existing providers migrate करते हैं।
    Plugin inspection non-bundled usage को compatibility debt के रूप में report करता है।

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    `src/plugins/runtime/types.ts` से अब भी exported दो legacy type aliases:

    | पुराना                           | नया                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    runtime method `readSession` को `getSessionMessages` के पक्ष में deprecated किया गया है।
    वही signature; पुराना method नए method को call through करता है।

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **पुराना**: `runtime.tasks.flow` (singular) ने live task-flow accessor लौटाया।

    **नया**: `runtime.tasks.managedFlows` उन plugins के लिए managed TaskFlow mutation
    runtime रखता है जो flow से child tasks create, update, cancel, या run करते हैं।
    जब Plugin को केवल DTO-based reads चाहिए हों, तब `runtime.tasks.flows` उपयोग करें।

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ऊपर "How to migrate → Migrate embedded tool-result extensions to
    middleware" में covered है। पूर्णता के लिए यहां शामिल: हटाया गया embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)` path
    `api.registerAgentToolResultMiddleware(...)` से replace किया गया है, जिसमें
    `contracts.agentToolResultMiddleware` में explicit runtime list होती है।
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` से re-export किया गया `OpenClawSchemaType` अब
    `OpenClawConfig` के लिए one-line alias है। canonical name को prefer करें।

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` के अंतर्गत bundled channel/provider plugins के अंदर extension-level deprecations
उनके अपने `api.ts` और `runtime-api.ts` barrels में track की जाती हैं।
वे third-party Plugin contracts को प्रभावित नहीं करतीं और यहां listed नहीं हैं।
अगर आप bundled Plugin का local barrel सीधे consume करते हैं, तो upgrade करने से पहले
उस barrel में deprecation comments पढ़ें।
</Note>

## हटाने की समयरेखा

| कब                   | क्या होता है                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **अब**                | पदावनत सतहें रनटाइम चेतावनियाँ जारी करती हैं                               |
| **अगला प्रमुख रिलीज़** | पदावनत सतहें हटा दी जाएँगी; जो Plugin अब भी उनका उपयोग कर रहे होंगे वे विफल होंगे |

सभी core Plugin पहले ही माइग्रेट किए जा चुके हैं। बाहरी Plugin को अगले
प्रमुख रिलीज़ से पहले माइग्रेट कर लेना चाहिए।

## चेतावनियों को अस्थायी रूप से दबाना

माइग्रेशन पर काम करते समय ये environment variables सेट करें:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

यह एक अस्थायी निकास उपाय है, स्थायी समाधान नहीं।

## संबंधित

- [शुरू करें](/hi/plugins/building-plugins) - अपना पहला Plugin बनाएँ
- [SDK अवलोकन](/hi/plugins/sdk-overview) - पूरा subpath import संदर्भ
- [Channel Plugins](/hi/plugins/sdk-channel-plugins) - channel Plugin बनाना
- [Provider Plugins](/hi/plugins/sdk-provider-plugins) - provider Plugin बनाना
- [Plugin Internals](/hi/plugins/architecture) - आर्किटेक्चर की गहरी जानकारी
- [Plugin Manifest](/hi/plugins/manifest) - manifest schema संदर्भ
