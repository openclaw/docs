---
read_when:
    - आपको OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED चेतावनी दिखाई देती है
    - आपको OPENCLAW_EXTENSION_API_DEPRECATED चेतावनी दिखाई देती है
    - आपने OpenClaw 2026.4.25 से पहले api.registerEmbeddedExtensionFactory का उपयोग किया था
    - आप एक plugin को आधुनिक plugin आर्किटेक्चर में अपडेट कर रहे हैं
    - आप एक बाहरी OpenClaw Plugin का रखरखाव करते हैं
sidebarTitle: Migrate to SDK
summary: लेगेसी पश्च-संगतता लेयर से आधुनिक plugin SDK पर माइग्रेट करें
title: Plugin SDK माइग्रेशन
x-i18n:
    generated_at: "2026-07-04T10:42:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw व्यापक पश्च-संगतता परत से केंद्रित, दस्तावेजीकृत imports वाली आधुनिक Plugin
आर्किटेक्चर पर आ गया है। यदि आपका Plugin
नई आर्किटेक्चर से पहले बनाया गया था, तो यह मार्गदर्शिका आपको माइग्रेट करने में मदद करती है।

## क्या बदल रहा है

पुराने Plugin सिस्टम ने दो बहुत खुले surfaces दिए थे, जिनसे plugins एक ही entry point से
अपनी ज़रूरत की कोई भी चीज़ import कर सकते थे:

- **`openclaw/plugin-sdk/compat`** - एक single import जो दर्जनों
  helpers को फिर से export करता था। इसे पुराने hook-आधारित plugins को चलते रखने के लिए पेश किया गया था, जबकि
  नई Plugin आर्किटेक्चर बनाई जा रही थी।
- **`openclaw/plugin-sdk/infra-runtime`** - एक व्यापक runtime helper barrel, जिसमें
  system events, heartbeat state, delivery queues, fetch/proxy helpers,
  file helpers, approval types, और असंबंधित utilities मिश्रित थीं।
- **`openclaw/plugin-sdk/config-runtime`** - एक व्यापक config compatibility barrel
  जो migration
  window के दौरान अभी भी deprecated direct load/write helpers रखता है।
- **`openclaw/extension-api`** - एक bridge जिसने plugins को
  embedded agent runner जैसे host-side helpers तक सीधी पहुंच दी।
- **`api.registerEmbeddedExtensionFactory(...)`** - हटाया गया embedded-runner-only bundled
  extension hook, जो
  `tool_result` जैसे embedded-runner events देख सकता था।

व्यापक import surfaces अब **deprecated** हैं। वे अभी भी runtime पर काम करते हैं,
लेकिन नए plugins को उनका उपयोग नहीं करना चाहिए, और मौजूदा plugins को
अगली major release के इन्हें हटाने से पहले migrate करना चाहिए। embedded-runner-only extension factory
registration API हटा दी गई है; इसके बजाय tool-result middleware का उपयोग करें।

OpenClaw किसी replacement को पेश करने वाले उसी
change में दस्तावेजीकृत Plugin व्यवहार को हटाता या फिर से व्याख्यायित नहीं करता। Breaking contract changes को पहले
compatibility adapter, diagnostics, docs, और deprecation window से गुजरना होगा।
यह SDK imports, manifest fields, setup APIs, hooks, और runtime
registration behavior पर लागू होता है।

<Warning>
  पश्च-संगतता परत भविष्य की major release में हटा दी जाएगी।
  जो plugins अभी भी इन surfaces से import करते हैं, वे ऐसा होने पर टूट जाएंगे।
  Legacy embedded extension factory registrations अब पहले से ही load नहीं होते।
</Warning>

## यह क्यों बदला

पुराने approach से समस्याएं हुईं:

- **धीमा startup** - एक helper import करने से दर्जनों असंबंधित modules
  load हो जाते थे
- **Circular dependencies** - व्यापक re-exports ने import cycles बनाना आसान कर दिया
- **अस्पष्ट API surface** - यह बताने का कोई तरीका नहीं था कि कौन से exports stable हैं और कौन से internal

आधुनिक Plugin SDK इसे ठीक करता है: प्रत्येक import path (`openclaw/plugin-sdk/\<subpath\>`)
एक छोटा, self-contained module है, जिसका स्पष्ट उद्देश्य और दस्तावेजीकृत contract है।

bundled channels के लिए legacy provider convenience seams भी हट गए हैं।
Channel-branded helper seams private mono-repo shortcuts थे, stable
Plugin contracts नहीं। इसके बजाय narrow generic SDK subpaths का उपयोग करें। bundled
Plugin workspace के अंदर, provider-owned helpers को उस Plugin के अपने `api.ts` या
`runtime-api.ts` में रखें।

वर्तमान bundled provider उदाहरण:

- Anthropic अपने Claude-specific stream helpers को अपने `api.ts` /
  `contract-api.ts` seam में रखता है
- OpenAI provider builders, default-model helpers, और realtime provider
  builders को अपने `api.ts` में रखता है
- OpenRouter provider builder और onboarding/config helpers को अपने
  `api.ts` में रखता है

## Talk और realtime voice migration plan

Realtime voice, telephony, meeting, और browser Talk code
surface-local turn bookkeeping से `openclaw/plugin-sdk/realtime-voice` द्वारा export किए गए
shared Talk session controller पर जा रहा है। नया controller common Talk
event envelope, active turn state, capture state, output-audio state, recent
event history, और stale-turn rejection का मालिक है। Provider plugins को
vendor-specific realtime sessions का मालिक बने रहना चाहिए; surface plugins को capture,
playback, telephony, और meeting quirks का मालिक बने रहना चाहिए।

यह Talk migration जानबूझकर breaking-clean है:

1. shared controller/runtime primitives को
   `plugin-sdk/realtime-voice` में रखें।
2. bundled surfaces को shared controller पर ले जाएं: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, और native push-to-talk।
3. पुराने Talk RPC families को अंतिम `talk.session.*` और
   `talk.client.*` API से बदलें।
4. Gateway
   `hello-ok.features.events` में एक live Talk event channel advertise करें: `talk.event`।
5. पुराने realtime HTTP endpoint और किसी भी request-time instruction
   override path को हटाएं।

नए code को `createTalkEventSequencer(...)` सीधे call नहीं करना चाहिए, जब तक कि वह
low-level adapter या test fixture implement नहीं कर रहा हो। shared controller को प्राथमिकता दें
ताकि turn-scoped events turn id के बिना emit न हो सकें, stale `turnEnd` /
`turnCancel` calls नए active turn को clear न कर सकें, और output-audio lifecycle
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
क्योंकि browser provider negotiation और media transport का मालिक है, जबकि
Gateway credentials, instructions, और tool policy का मालिक है। `talk.session.*`
gateway-relay realtime, gateway-relay
transcription, और managed-room native STT/TTS sessions के लिए common Gateway-managed surface है।

Legacy configs जिन्होंने realtime selectors को `talk.provider` /
`talk.providers` के पास रखा था, उन्हें `openclaw doctor --fix` से repair किया जाना चाहिए; runtime Talk
speech/TTS provider config को realtime provider config के रूप में फिर से व्याख्यायित नहीं करता।

समर्थित `talk.session.create` combinations जानबूझकर छोटे हैं:

| Mode            | Transport       | Brain           | Owner              | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway के माध्यम से bridged full-duplex provider audio; tool calls agent-consult tool के माध्यम से route किए जाते हैं।      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | केवल streaming STT; callers input audio भेजते हैं और transcript events प्राप्त करते हैं।                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk और walkie-talkie style rooms जहां client capture/playback का मालिक है और Gateway turn state का मालिक है। |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | trusted first-party surfaces के लिए admin-only room mode, जो Gateway tool actions को सीधे execute करते हैं।                  |

हटाया गया method map:

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

unified control vocabulary भी जानबूझकर narrow है:

  | विधि                          | इन पर लागू                                              | अनुबंध                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | उसी Gateway कनेक्शन के स्वामित्व वाले प्रदाता सत्र में base64 PCM ऑडियो खंड जोड़ें।                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room उपयोगकर्ता टर्न शुरू करें।                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn सत्यापन के बाद सक्रिय टर्न समाप्त करें।                                                                                                                                         |
  | `talk.session.cancelTurn`       | सभी Gateway-स्वामित्व वाले सत्र                              | किसी टर्न के लिए सक्रिय capture/provider/agent/TTS कार्य रद्द करें।                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | उपयोगकर्ता टर्न को अनिवार्य रूप से समाप्त किए बिना सहायक ऑडियो आउटपुट रोकें।                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | relay द्वारा उत्सर्जित प्रदाता टूल कॉल पूरा करें; अंतरिम आउटपुट के लिए `options.willContinue` पास करें या किसी अन्य सहायक प्रतिक्रिया के बिना कॉल को संतुष्ट करने के लिए `options.suppressResponse` पास करें। |
  | `talk.session.steer`            | एजेंट-समर्थित Talk सत्र                              | Talk सत्र से हल किए गए सक्रिय embedded run को बोले गए `status`, `steer`, `cancel`, या `followup` नियंत्रण भेजें।                                                                |
  | `talk.session.close`            | सभी एकीकृत सत्र                                    | relay सत्र रोकें या managed-room स्थिति रद्द करें, फिर एकीकृत सत्र id भूल जाएं।                                                                                                    |

  इसे काम करने के लिए core में प्रदाता या प्लेटफ़ॉर्म विशेष मामले न जोड़ें।
  core Talk सत्र semantics का स्वामी है। प्रदाता plugins vendor सत्र setup के स्वामी हैं।
  Voice-call और Google Meet telephony/meeting adapters के स्वामी हैं। Browser और native
  apps device capture/playback UX के स्वामी हैं।

  ## संगतता नीति

  बाहरी plugins के लिए, संगतता कार्य इस क्रम का पालन करता है:

  1. नया अनुबंध जोड़ें
  2. पुराने व्यवहार को compatibility adapter के माध्यम से wired रखें
  3. पुराना path और replacement बताने वाला diagnostic या warning उत्सर्जित करें
  4. tests में दोनों paths cover करें
  5. deprecation और migration path का documentation करें
  6. announced migration window के बाद ही हटाएं, आमतौर पर major release में

  Maintainers वर्तमान migration queue का audit
  `pnpm plugins:boundary-report` से कर सकते हैं। compact counts के लिए
  `pnpm plugins:boundary-report:summary`, एक Plugin या compatibility owner के लिए `--owner <id>`, और
  जब CI gate को due compatibility records, cross-owner reserved SDK imports, या unused reserved SDK
  subpaths पर fail होना चाहिए तब
  `pnpm plugins:boundary-report:ci` का उपयोग करें। report deprecated
  compatibility records को removal date के अनुसार group करती है, local code/docs references गिनती है,
  cross-owner reserved SDK imports surface करती है, और private
  memory-host SDK bridge का summary देती है ताकि compatibility cleanup ad hoc searches पर
  निर्भर रहने के बजाय explicit रहे। Reserved SDK subpaths में tracked owner usage होना चाहिए;
  unused reserved helper exports को public SDK से हटा देना चाहिए।

  यदि कोई manifest field अभी भी accepted है, तो Plugin authors इसे तब तक उपयोग कर सकते हैं जब तक
  docs और diagnostics अन्यथा न कहें। New code को documented
  replacement को प्राथमिकता देनी चाहिए, लेकिन existing plugins ordinary minor
  releases के दौरान टूटने नहीं चाहिए।

  ## Migration कैसे करें

  <Steps>
  <Step title="Runtime config load/write helpers migrate करें">
    Bundled plugins को
    `api.runtime.config.loadConfig()` और
    `api.runtime.config.writeConfigFile(...)` को सीधे call करना बंद करना चाहिए। उस config को प्राथमिकता दें जो
    active call path में पहले से pass किया गया था। Long-lived handlers जिन्हें
    current process snapshot चाहिए, वे `api.runtime.config.current()` उपयोग कर सकते हैं। Long-lived
    agent tools को `execute` के अंदर tool context का `ctx.getRuntimeConfig()` उपयोग करना चाहिए
    ताकि config write से पहले बनाया गया tool भी refreshed
    runtime config देख सके।

    Config writes को transactional helpers के माध्यम से जाना होगा और एक
    after-write policy चुननी होगी:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    जब caller जानता है कि change के लिए clean gateway restart चाहिए, तब
    `afterWrite: { mode: "restart", reason: "..." }` उपयोग करें, और
    `afterWrite: { mode: "none", reason: "..." }` केवल तब उपयोग करें जब caller follow-up का स्वामी हो
    और reload planner को जानबूझकर suppress करना चाहता हो।
    Mutation results में tests और logging के लिए typed `followUp` summary शामिल होती है;
    gateway restart लागू करने या schedule करने के लिए जिम्मेदार रहता है।
    `loadConfig` और `writeConfigFile` migration window के दौरान external plugins के लिए deprecated compatibility
    helpers के रूप में रहते हैं और
    `runtime-config-load-write` compatibility code के साथ एक बार warn करते हैं। Bundled plugins और repo
    runtime code को scanner guardrails द्वारा
    `pnpm check:deprecated-api-usage` और
    `pnpm check:no-runtime-action-load-config` में protected रखा जाता है: नया production plugin usage
    सीधे fail होता है, direct config writes fail होते हैं, gateway server methods को
    request runtime snapshot उपयोग करना होगा, runtime channel send/action/client helpers को
    अपनी boundary से config प्राप्त करना होगा, और long-lived runtime modules में
    allowed ambient `loadConfig()` calls शून्य हैं।

    New plugin code को broad
    `openclaw/plugin-sdk/config-runtime` compatibility barrel import करने से भी बचना चाहिए। काम से मेल खाने वाला narrow
    SDK subpath उपयोग करें:

    | आवश्यकता | Import |
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

    Bundled plugins और उनके tests को broad
    barrel के विरुद्ध scanner-guard किया गया है ताकि imports और mocks उस behavior के local रहें जिसकी उन्हें आवश्यकता है। Broad
    barrel external compatibility के लिए अभी भी मौजूद है, लेकिन new code को
    उस पर depend नहीं करना चाहिए।

  </Step>

  <Step title="Embedded tool-result extensions को middleware में migrate करें">
    Bundled plugins को embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlers को
    runtime-neutral middleware से बदलना होगा।

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
    स्पष्ट रूप से enabled हों और
    `contracts.agentToolResultMiddleware` में हर targeted runtime declare करें। Undeclared installed middleware
    registrations reject किए जाते हैं।

  </Step>

  <Step title="Approval-native handlers को capability facts में migrate करें">
    Approval-capable channel plugins अब native approval behavior को
    `approvalCapability.nativeRuntime` और shared runtime-context registry के माध्यम से expose करते हैं।

    मुख्य बदलाव:

    - `approvalCapability.handler.loadRuntime(...)` को
      `approvalCapability.nativeRuntime` से बदलें
    - Approval-specific auth/delivery को legacy `plugin.auth` /
      `plugin.approvals` wiring से हटाकर `approvalCapability` पर ले जाएं
    - `ChannelPlugin.approvals` को public channel-plugin
      contract से हटा दिया गया है; delivery/native/render fields को `approvalCapability` पर ले जाएं
    - `plugin.auth` केवल channel login/logout flows के लिए रहता है; वहां के approval auth
      hooks अब core द्वारा read नहीं किए जाते
    - clients, tokens, या Bolt
      apps जैसे channel-owned runtime objects को `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से register करें
    - native approval handlers से plugin-owned reroute notices न भेजें;
      core अब actual delivery results से routed-elsewhere notices का स्वामी है
    - `channelRuntime` को `createChannelManager(...)` में pass करते समय,
      real `createPluginRuntime().channel` surface दें। Partial stubs reject किए जाते हैं।

    वर्तमान approval capability
    layout के लिए `/plugins/sdk-channel-plugins` देखें।

  </Step>

  <Step title="Windows wrapper fallback behavior audit करें">
    यदि आपका Plugin `openclaw/plugin-sdk/windows-spawn` उपयोग करता है, तो unresolved Windows
    `.cmd`/`.bat` wrappers अब fail closed होते हैं जब तक आप स्पष्ट रूप से
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

    यदि आपका caller shell fallback पर जानबूझकर निर्भर नहीं है, तो
    `allowShellFallback` set न करें और thrown error को handle करें।

  </Step>

  <Step title="Deprecated imports ढूंढें">
    अपने Plugin में किसी भी deprecated surface से imports खोजें:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Focused imports से बदलें">
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

    Host-side helpers के लिए, सीधे import करने के बजाय injected plugin runtime उपयोग करें:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    यही पैटर्न अन्य लेगेसी ब्रिज हेल्पर पर भी लागू होता है:

    | पुराना इम्पोर्ट | आधुनिक समकक्ष |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | सत्र स्टोर हेल्पर | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` बाहरी संगतता के लिए अब भी मौजूद है,
    लेकिन नए कोड को उस केंद्रित हेल्पर सतह को इम्पोर्ट करना चाहिए जिसकी उसे
    वास्तव में जरूरत है:

    | जरूरत | इम्पोर्ट |
    | --- | --- |
    | सिस्टम इवेंट कतार हेल्पर | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat वेक, इवेंट, और दृश्यता हेल्पर | `openclaw/plugin-sdk/heartbeat-runtime` |
    | लंबित डिलीवरी कतार ड्रेन | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | चैनल गतिविधि टेलीमेट्री | `openclaw/plugin-sdk/channel-activity-runtime` |
    | इन-मेमोरी और स्थायी-बैक्ड डीड्यूप कैश | `openclaw/plugin-sdk/dedupe-runtime` |
    | सुरक्षित स्थानीय-फ़ाइल/मीडिया पथ हेल्पर | `openclaw/plugin-sdk/file-access-runtime` |
    | डिस्पैचर-जागरूक fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | प्रॉक्सी और गार्डेड fetch हेल्पर | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF डिस्पैचर नीति प्रकार | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | अनुमोदन अनुरोध/समाधान प्रकार | `openclaw/plugin-sdk/approval-runtime` |
    | अनुमोदन उत्तर पेलोड और कमांड हेल्पर | `openclaw/plugin-sdk/approval-reply-runtime` |
    | त्रुटि फ़ॉर्मैटिंग हेल्पर | `openclaw/plugin-sdk/error-runtime` |
    | ट्रांसपोर्ट तत्परता प्रतीक्षा | `openclaw/plugin-sdk/transport-ready-runtime` |
    | सुरक्षित टोकन हेल्पर | `openclaw/plugin-sdk/secure-random-runtime` |
    | सीमित एसिंक्रोनस कार्य समवर्तीता | `openclaw/plugin-sdk/concurrency-runtime` |
    | संख्यात्मक कोअर्शन | `openclaw/plugin-sdk/number-runtime` |
    | प्रोसेस-लोकल एसिंक्रोनस लॉक | `openclaw/plugin-sdk/async-lock-runtime` |
    | फ़ाइल लॉक | `openclaw/plugin-sdk/file-lock` |

    बंडल किए गए Plugin को `infra-runtime` के विरुद्ध स्कैनर-सुरक्षित किया गया है,
    इसलिए रेपो कोड व्यापक बैरल पर वापस नहीं जा सकता।

  </Step>

  <Step title="Migrate channel route helpers">
    नए चैनल रूट कोड को `openclaw/plugin-sdk/channel-route` का उपयोग करना चाहिए।
    पुराने route-key और comparable-target नाम माइग्रेशन विंडो के दौरान संगतता
    एलियस के रूप में बने रहते हैं, लेकिन नए Plugin को उन रूट नामों का उपयोग
    करना चाहिए जो व्यवहार को सीधे वर्णित करते हैं:

    | पुराना हेल्पर | आधुनिक हेल्पर |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    आधुनिक रूट हेल्पर नेटिव अनुमोदनों, उत्तर दमन, इनबाउंड डीड्यूप,
    Cron डिलीवरी, और सत्र रूटिंग में `{ channel, to, accountId, threadId }`
    को लगातार नॉर्मलाइज़ करते हैं।

    `ChannelMessagingAdapter.parseExplicitTarget` या
    parser-backed loaded-route हेल्पर (`parseExplicitTargetForLoadedChannel`
    या `resolveRouteTargetForLoadedChannel`) या
    `plugin-sdk/channel-route` से `resolveChannelRouteTargetWithParser(...)`
    के नए उपयोग न जोड़ें। ये हुक हटाए जा चुके हैं और माइग्रेशन विंडो के दौरान
    केवल पुराने Plugin के लिए बने रहते हैं। नए चैनल Plugin को लक्ष्य id
    नॉर्मलाइज़ेशन और डायरेक्टरी-मिस फॉलबैक के लिए
    `messaging.targetResolver.resolveTarget(...)`, जब कोर को शुरुआती पीयर प्रकार
    चाहिए तब `messaging.inferTargetChatType(...)`, और provider-native सत्र तथा
    थ्रेड पहचान के लिए `messaging.resolveOutboundSessionRoute(...)` का उपयोग करना
    चाहिए।

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## इम्पोर्ट पथ संदर्भ

  <Accordion title="Common import path table">
  | इम्पोर्ट पथ | उद्देश्य | मुख्य निर्यात |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | कैनॉनिकल Plugin प्रवेश सहायक | `definePluginEntry` |
  | `plugin-sdk/core` | चैनल प्रवेश परिभाषाओं/बिल्डरों के लिए विरासती अंब्रेला री-एक्सपोर्ट | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | रूट कॉन्फ़िग स्कीमा निर्यात | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | एकल-प्रोवाइडर प्रवेश सहायक | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | केंद्रित चैनल प्रवेश परिभाषाएँ और बिल्डर | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | साझा सेटअप विज़ार्ड सहायक | सेटअप अनुवादक, अनुमति-सूची प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
  | `plugin-sdk/setup-runtime` | सेटअप-समय रनटाइम सहायक | `createSetupTranslator`, इम्पोर्ट-सुरक्षित सेटअप पैच अडैप्टर, लुकअप-नोट सहायक, `promptResolvedAllowFrom`, `splitSetupEntries`, प्रत्यायोजित सेटअप प्रॉक्सी |
  | `plugin-sdk/setup-adapter-runtime` | अप्रचलित सेटअप अडैप्टर उपनाम | `plugin-sdk/setup-runtime` उपयोग करें |
  | `plugin-sdk/setup-tools` | सेटअप टूलिंग सहायक | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | बहु-अकाउंट सहायक | अकाउंट सूची/कॉन्फ़िग/एक्शन-गेट सहायक |
  | `plugin-sdk/account-id` | अकाउंट-id सहायक | `DEFAULT_ACCOUNT_ID`, अकाउंट-id सामान्यीकरण |
  | `plugin-sdk/account-resolution` | अकाउंट लुकअप सहायक | अकाउंट लुकअप + डिफ़ॉल्ट-फ़ॉलबैक सहायक |
  | `plugin-sdk/account-helpers` | संकीर्ण अकाउंट सहायक | अकाउंट सूची/अकाउंट-एक्शन सहायक |
  | `plugin-sdk/channel-setup` | सेटअप विज़ार्ड अडैप्टर | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM पेयरिंग प्रिमिटिव | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | उत्तर प्रीफ़िक्स, टाइपिंग, और स्रोत-डिलीवरी वायरिंग | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | कॉन्फ़िग अडैप्टर फ़ैक्टरी और DM एक्सेस सहायक | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | कॉन्फ़िग स्कीमा बिल्डर | साझा चैनल कॉन्फ़िग स्कीमा प्रिमिटिव और केवल जेनेरिक बिल्डर |
  | `plugin-sdk/bundled-channel-config-schema` | बंडल किए गए कॉन्फ़िग स्कीमा | केवल OpenClaw-मेंटेन किए गए बंडल Plugin; नए Plugin को Plugin-स्थानीय स्कीमा परिभाषित करने होंगे |
  | `plugin-sdk/channel-config-schema-legacy` | अप्रचलित बंडल कॉन्फ़िग स्कीमा | केवल संगतता उपनाम; मेंटेन किए गए बंडल Plugin के लिए `plugin-sdk/bundled-channel-config-schema` उपयोग करें |
  | `plugin-sdk/telegram-command-config` | Telegram कमांड कॉन्फ़िग सहायक | कमांड-नाम सामान्यीकरण, विवरण ट्रिमिंग, डुप्लिकेट/कॉन्फ़्लिक्ट सत्यापन |
  | `plugin-sdk/channel-policy` | समूह/DM नीति समाधान | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-outbound` उपयोग करें |
  | `plugin-sdk/inbound-envelope` | इनबाउंड एनवलप सहायक | साझा रूट + एनवलप बिल्डर सहायक |
  | `plugin-sdk/channel-inbound` | इनबाउंड रिसीव सहायक | संदर्भ निर्माण, फ़ॉर्मैटिंग, रूट, रनर, तैयार उत्तर डिस्पैच, और डिस्पैच प्रेडिकेट |
  | `plugin-sdk/messaging-targets` | अप्रचलित लक्ष्य पार्सिंग इम्पोर्ट पथ | जेनेरिक लक्ष्य पार्सिंग सहायकों के लिए `plugin-sdk/channel-targets`, रूट तुलना के लिए `plugin-sdk/channel-route`, और प्रोवाइडर-विशिष्ट लक्ष्य समाधान के लिए Plugin-स्वामित्व वाले `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` उपयोग करें |
  | `plugin-sdk/outbound-media` | आउटबाउंड मीडिया सहायक | साझा आउटबाउंड मीडिया लोडिंग |
  | `plugin-sdk/outbound-send-deps` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-outbound` उपयोग करें |
  | `plugin-sdk/channel-outbound` | आउटबाउंड संदेश जीवनचक्र सहायक | संदेश अडैप्टर, रसीदें, टिकाऊ भेजने के सहायक, लाइव पूर्वावलोकन/स्ट्रीमिंग सहायक, उत्तर विकल्प, जीवनचक्र सहायक, आउटबाउंड पहचान, और पेलोड योजना |
  | `plugin-sdk/channel-streaming` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-outbound` उपयोग करें |
  | `plugin-sdk/outbound-runtime` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-outbound` उपयोग करें |
  | `plugin-sdk/thread-bindings-runtime` | थ्रेड-बाइंडिंग सहायक | थ्रेड-बाइंडिंग जीवनचक्र और अडैप्टर सहायक |
  | `plugin-sdk/agent-media-payload` | विरासती मीडिया पेलोड सहायक | विरासती फ़ील्ड लेआउट के लिए एजेंट मीडिया पेलोड बिल्डर |
  | `plugin-sdk/channel-runtime` | अप्रचलित संगतता शिम | केवल विरासती चैनल रनटाइम उपयोगिताएँ |
  | `plugin-sdk/channel-send-result` | भेजने के परिणाम प्रकार | उत्तर परिणाम प्रकार |
  | `plugin-sdk/runtime-store` | स्थायी Plugin स्टोरेज | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | व्यापक रनटाइम सहायक | रनटाइम/लॉगिंग/बैकअप/Plugin-इंस्टॉल सहायक |
  | `plugin-sdk/runtime-env` | संकीर्ण रनटाइम env सहायक | लॉगर/रनटाइम env, टाइमआउट, रीट्राई, और बैकऑफ़ सहायक |
  | `plugin-sdk/plugin-runtime` | साझा Plugin रनटाइम सहायक | Plugin कमांड/हुक/http/इंटरैक्टिव सहायक |
  | `plugin-sdk/hook-runtime` | हुक पाइपलाइन सहायक | साझा Webhook/आंतरिक हुक पाइपलाइन सहायक |
  | `plugin-sdk/lazy-runtime` | लेज़ी रनटाइम सहायक | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | प्रोसेस सहायक | साझा exec सहायक |
  | `plugin-sdk/cli-runtime` | CLI रनटाइम सहायक | कमांड फ़ॉर्मैटिंग, प्रतीक्षा, संस्करण सहायक |
  | `plugin-sdk/gateway-runtime` | Gateway सहायक | Gateway क्लाइंट, इवेंट-लूप-तैयार स्टार्ट सहायक, विज्ञापित LAN होस्ट समाधान, और चैनल-स्थिति पैच सहायक |
  | `plugin-sdk/config-runtime` | अप्रचलित कॉन्फ़िग संगतता शिम | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, और `config-mutation` को प्राथमिकता दें |
  | `plugin-sdk/telegram-command-config` | Telegram कमांड सहायक | जब बंडल किया गया Telegram अनुबंध सतह अनुपलब्ध हो, तब फ़ॉलबैक-स्थिर Telegram कमांड सत्यापन सहायक |
  | `plugin-sdk/approval-runtime` | अनुमोदन प्रॉम्प्ट सहायक | Exec/Plugin अनुमोदन पेलोड, अनुमोदन क्षमता/प्रोफ़ाइल सहायक, नेटिव अनुमोदन रूटिंग/रनटाइम सहायक, और संरचित अनुमोदन डिस्प्ले पथ फ़ॉर्मैटिंग |
  | `plugin-sdk/approval-auth-runtime` | अनुमोदन auth सहायक | अनुमोदक समाधान, उसी-चैट एक्शन auth |
  | `plugin-sdk/approval-client-runtime` | अनुमोदन क्लाइंट सहायक | नेटिव exec अनुमोदन प्रोफ़ाइल/फ़िल्टर सहायक |
  | `plugin-sdk/approval-delivery-runtime` | अनुमोदन डिलीवरी सहायक | नेटिव अनुमोदन क्षमता/डिलीवरी अडैप्टर |
  | `plugin-sdk/approval-gateway-runtime` | अनुमोदन Gateway सहायक | साझा अनुमोदन Gateway-समाधान सहायक |
  | `plugin-sdk/approval-handler-adapter-runtime` | अनुमोदन अडैप्टर सहायक | हॉट चैनल एंट्रीपॉइंट के लिए हल्के नेटिव अनुमोदन अडैप्टर लोडिंग सहायक |
  | `plugin-sdk/approval-handler-runtime` | अनुमोदन हैंडलर सहायक | व्यापक अनुमोदन हैंडलर रनटाइम सहायक; जब संकरे अडैप्टर/Gateway सीम पर्याप्त हों, उन्हें प्राथमिकता दें |
  | `plugin-sdk/approval-native-runtime` | अनुमोदन लक्ष्य सहायक | नेटिव अनुमोदन लक्ष्य/अकाउंट बाइंडिंग सहायक |
  | `plugin-sdk/approval-reply-runtime` | अनुमोदन उत्तर सहायक | Exec/Plugin अनुमोदन उत्तर पेलोड सहायक |
  | `plugin-sdk/channel-runtime-context` | चैनल रनटाइम-संदर्भ सहायक | जेनेरिक चैनल रनटाइम-संदर्भ रजिस्टर/get/watch सहायक |
  | `plugin-sdk/security-runtime` | सुरक्षा सहायक | साझा ट्रस्ट, DM गेटिंग, रूट-सीमित फ़ाइल/पथ सहायक, बाहरी-सामग्री, और सीक्रेट-संग्रह सहायक |
  | `plugin-sdk/ssrf-policy` | SSRF नीति सहायक | होस्ट अनुमति-सूची और निजी-नेटवर्क नीति सहायक |
  | `plugin-sdk/ssrf-runtime` | SSRF रनटाइम सहायक | पिन्ड-डिस्पैचर, सुरक्षित fetch, SSRF नीति सहायक |
  | `plugin-sdk/system-event-runtime` | सिस्टम इवेंट सहायक | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat सहायक | Heartbeat वेक, इवेंट, और दृश्यता सहायक |
  | `plugin-sdk/delivery-queue-runtime` | डिलीवरी क्यू सहायक | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | चैनल गतिविधि सहायक | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | डीडुप सहायक | इन-मेमोरी और स्थायी-समर्थित डीडुप कैश |
  | `plugin-sdk/file-access-runtime` | फ़ाइल एक्सेस सहायक | सुरक्षित स्थानीय-फ़ाइल/मीडिया पथ सहायक |
  | `plugin-sdk/transport-ready-runtime` | ट्रांसपोर्ट तत्परता सहायक | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec अनुमोदन नीति सहायक | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | सीमित कैश सहायक | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | डायग्नॉस्टिक गेटिंग सहायक | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | त्रुटि फ़ॉर्मैटिंग सहायक | `formatUncaughtError`, `isApprovalNotFoundError`, त्रुटि ग्राफ़ सहायक |
  | `plugin-sdk/fetch-runtime` | रैप्ड fetch/प्रॉक्सी सहायक | `resolveFetch`, प्रॉक्सी सहायक, EnvHttpProxyAgent विकल्प सहायक |
  | `plugin-sdk/host-runtime` | होस्ट सामान्यीकरण सहायक | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | रीट्राई सहायक | `RetryConfig`, `retryAsync`, नीति रनर |
  | `plugin-sdk/allow-from` | अनुमति-सूची फ़ॉर्मैटिंग और इनपुट मैपिंग | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | कमांड गेटिंग और कमांड-सतह सहायक | `resolveControlCommandGate`, प्रेषक-अनुमति सहायक, डायनेमिक आर्ग्युमेंट मेनू फ़ॉर्मैटिंग सहित कमांड रजिस्ट्री सहायक |
  | `plugin-sdk/command-status` | कमांड स्थिति/सहायता रेंडरर | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | सीक्रेट इनपुट पार्सिंग | सीक्रेट इनपुट सहायक |
  | `plugin-sdk/webhook-ingress` | Webhook अनुरोध सहायक | Webhook लक्ष्य उपयोगिताएँ |
  | `plugin-sdk/webhook-request-guards` | Webhook बॉडी गार्ड सहायक | अनुरोध बॉडी पढ़ने/सीमा सहायक |
  | `plugin-sdk/reply-runtime` | साझा उत्तर रनटाइम | इनबाउंड डिस्पैच, Heartbeat, उत्तर प्लानर, चंकिंग |
  | `plugin-sdk/reply-dispatch-runtime` | संकीर्ण उत्तर डिस्पैच सहायक | फ़ाइनलाइज़, प्रोवाइडर डिस्पैच, और बातचीत-लेबल सहायक |
  | `plugin-sdk/reply-history` | उत्तर-इतिहास सहायक | `createChannelHistoryWindow`; अप्रचलित मैप-सहायक संगतता निर्यात, जैसे `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, और `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | उत्तर संदर्भ योजना | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | उत्तर चंक सहायक | टेक्स्ट/मार्कडाउन चंकिंग सहायक |
  | `plugin-sdk/session-store-runtime` | सेशन स्टोर सहायक | स्टोर पथ + updated-at सहायक |
  | `plugin-sdk/state-paths` | स्टेट पथ सहायक | स्टेट और OAuth dir सहायक |
  | `plugin-sdk/routing` | रूटिंग/सेशन-की सहायक | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, सेशन-की सामान्यीकरण सहायक |
  | `plugin-sdk/status-helpers` | चैनल स्थिति सहायक | चैनल/अकाउंट स्थिति सारांश बिल्डर, रनटाइम-स्टेट डिफॉल्ट, समस्या मेटाडेटा सहायक |
  | `plugin-sdk/target-resolver-runtime` | लक्ष्य रिजॉल्वर सहायक | साझा लक्ष्य रिजॉल्वर सहायक |
  | `plugin-sdk/string-normalization-runtime` | स्ट्रिंग सामान्यीकरण सहायक | स्लग/स्ट्रिंग सामान्यीकरण सहायक |
  | `plugin-sdk/request-url` | अनुरोध URL सहायक | अनुरोध-जैसे इनपुट से स्ट्रिंग URL निकालें |
  | `plugin-sdk/run-command` | समयबद्ध कमांड सहायक | सामान्यीकृत stdout/stderr वाला समयबद्ध कमांड रनर |
  | `plugin-sdk/param-readers` | पैरामीटर रीडर | सामान्य टूल/CLI पैरामीटर रीडर |
  | `plugin-sdk/tool-payload` | टूल पेलोड निष्कर्षण | टूल परिणाम ऑब्जेक्ट से सामान्यीकृत पेलोड निकालें |
  | `plugin-sdk/tool-send` | टूल सेंड निष्कर्षण | टूल आर्ग्स से कैनॉनिकल सेंड लक्ष्य फ़ील्ड निकालें |
  | `plugin-sdk/temp-path` | अस्थायी पाथ सहायक | साझा अस्थायी-डाउनलोड पाथ सहायक |
  | `plugin-sdk/logging-core` | लॉगिंग सहायक | सबसिस्टम लॉगर और रिडैक्शन सहायक |
  | `plugin-sdk/markdown-table-runtime` | Markdown-तालिका सहायक | Markdown तालिका मोड सहायक |
  | `plugin-sdk/reply-payload` | संदेश उत्तर प्रकार | उत्तर पेलोड प्रकार |
  | `plugin-sdk/provider-setup` | क्यूरेटेड स्थानीय/सेल्फ-होस्टेड प्रदाता सेटअप सहायक | सेल्फ-होस्टेड प्रदाता डिस्कवरी/कॉन्फिग सहायक |
  | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत सेल्फ-होस्टेड प्रदाता सेटअप सहायक | वही सेल्फ-होस्टेड प्रदाता डिस्कवरी/कॉन्फिग सहायक |
  | `plugin-sdk/provider-auth-runtime` | प्रदाता रनटाइम प्रमाणीकरण सहायक | रनटाइम API-की रिजॉल्यूशन सहायक |
  | `plugin-sdk/provider-auth-api-key` | प्रदाता API-की सेटअप सहायक | API-की ऑनबोर्डिंग/प्रोफ़ाइल-राइट सहायक |
  | `plugin-sdk/provider-auth-result` | प्रदाता auth-result सहायक | मानक OAuth auth-result बिल्डर |
  | `plugin-sdk/provider-selection-runtime` | प्रदाता चयन सहायक | कॉन्फिगर-किए-गए-या-ऑटो प्रदाता चयन और रॉ प्रदाता कॉन्फिग मर्जिंग |
  | `plugin-sdk/provider-env-vars` | प्रदाता env-var सहायक | प्रदाता प्रमाणीकरण env-var लुकअप सहायक |
  | `plugin-sdk/provider-model-shared` | साझा प्रदाता मॉडल/रीप्ले सहायक | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा रीप्ले-पॉलिसी बिल्डर, प्रदाता-एंडपॉइंट सहायक, और model-id सामान्यीकरण सहायक |
  | `plugin-sdk/provider-catalog-shared` | साझा प्रदाता कैटलॉग सहायक | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | प्रदाता ऑनबोर्डिंग पैच | ऑनबोर्डिंग कॉन्फिग सहायक |
  | `plugin-sdk/provider-http` | प्रदाता HTTP सहायक | सामान्य प्रदाता HTTP/एंडपॉइंट क्षमता सहायक, जिनमें ऑडियो ट्रांसक्रिप्शन multipart form सहायक शामिल हैं |
  | `plugin-sdk/provider-web-fetch` | प्रदाता web-fetch सहायक | Web-fetch प्रदाता पंजीकरण/कैश सहायक |
  | `plugin-sdk/provider-web-search-config-contract` | प्रदाता web-search कॉन्फिग सहायक | उन प्रदाताओं के लिए संकीर्ण web-search कॉन्फिग/क्रेडेंशियल सहायक जिन्हें plugin-enable वायरिंग की आवश्यकता नहीं है |
  | `plugin-sdk/provider-web-search-contract` | प्रदाता web-search कॉन्ट्रैक्ट सहायक | संकीर्ण web-search कॉन्फिग/क्रेडेंशियल कॉन्ट्रैक्ट सहायक जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और स्कोप्ड क्रेडेंशियल सेटर/गेटर |
  | `plugin-sdk/provider-web-search` | प्रदाता web-search सहायक | Web-search प्रदाता पंजीकरण/कैश/रनटाइम सहायक |
  | `plugin-sdk/provider-tools` | प्रदाता टूल/स्कीमा संगतता सहायक | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI स्कीमा क्लीनअप + डायग्नोस्टिक्स |
  | `plugin-sdk/provider-usage` | प्रदाता उपयोग सहायक | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, और अन्य प्रदाता उपयोग सहायक |
  | `plugin-sdk/provider-stream` | प्रदाता स्ट्रीम रैपर सहायक | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, स्ट्रीम रैपर प्रकार, और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot रैपर सहायक |
  | `plugin-sdk/provider-transport-runtime` | प्रदाता ट्रांसपोर्ट सहायक | नेटिव प्रदाता ट्रांसपोर्ट सहायक जैसे guarded fetch, tool-result टेक्स्ट निष्कर्षण, ट्रांसपोर्ट संदेश ट्रांसफॉर्म, और लिखने योग्य ट्रांसपोर्ट इवेंट स्ट्रीम |
  | `plugin-sdk/keyed-async-queue` | क्रमबद्ध async कतार | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | साझा मीडिया सहायक | मीडिया fetch/transform/store सहायक, ffprobe-समर्थित वीडियो आयाम प्रोबिंग, और मीडिया पेलोड बिल्डर |
  | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन सहायक | चित्र/वीडियो/संगीत जनरेशन के लिए साझा failover सहायक, उम्मीदवार चयन, और missing-model मैसेजिंग |
  | `plugin-sdk/media-understanding` | मीडिया-अंडरस्टैंडिंग सहायक | मीडिया अंडरस्टैंडिंग प्रदाता प्रकार और प्रदाता-फेसिंग चित्र/ऑडियो सहायक एक्सपोर्ट |
  | `plugin-sdk/text-runtime` | अप्रचलित व्यापक टेक्स्ट संगतता एक्सपोर्ट | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, और `logging-core` का उपयोग करें |
  | `plugin-sdk/text-chunking` | टेक्स्ट चंकिंग सहायक | आउटबाउंड टेक्स्ट चंकिंग सहायक |
  | `plugin-sdk/speech` | स्पीच सहायक | स्पीच प्रदाता प्रकार और प्रदाता-फेसिंग डायरेक्टिव, रजिस्ट्री, सत्यापन सहायक, और OpenAI-संगत TTS बिल्डर |
  | `plugin-sdk/speech-core` | साझा स्पीच कोर | स्पीच प्रदाता प्रकार, रजिस्ट्री, डायरेक्टिव, सामान्यीकरण |
  | `plugin-sdk/realtime-transcription` | रीयलटाइम ट्रांसक्रिप्शन सहायक | प्रदाता प्रकार, रजिस्ट्री सहायक, और साझा WebSocket सेशन सहायक |
  | `plugin-sdk/realtime-voice` | रीयलटाइम वॉइस सहायक | प्रदाता प्रकार, रजिस्ट्री/रिजॉल्यूशन सहायक, ब्रिज सेशन सहायक, साझा एजेंट talk-back कतारें, active-run वॉइस नियंत्रण, transcript/event स्वास्थ्य, echo suppression, consult question matching, forced-consult coordination, turn-context tracking, output activity tracking, और fast context consult सहायक |
  | `plugin-sdk/image-generation` | चित्र-जनरेशन सहायक | चित्र जनरेशन प्रदाता प्रकार और चित्र asset/data URL सहायक तथा OpenAI-संगत चित्र प्रदाता बिल्डर |
  | `plugin-sdk/image-generation-core` | साझा चित्र-जनरेशन कोर | चित्र-जनरेशन प्रकार, failover, प्रमाणीकरण, और रजिस्ट्री सहायक |
  | `plugin-sdk/music-generation` | संगीत-जनरेशन सहायक | संगीत-जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
  | `plugin-sdk/music-generation-core` | साझा संगीत-जनरेशन कोर | संगीत-जनरेशन प्रकार, failover सहायक, प्रदाता लुकअप, और model-ref पार्सिंग |
  | `plugin-sdk/video-generation` | वीडियो-जनरेशन सहायक | वीडियो-जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
  | `plugin-sdk/video-generation-core` | साझा वीडियो-जनरेशन कोर | वीडियो-जनरेशन प्रकार, failover सहायक, प्रदाता लुकअप, और model-ref पार्सिंग |
  | `plugin-sdk/interactive-runtime` | इंटरैक्टिव उत्तर सहायक | इंटरैक्टिव उत्तर पेलोड सामान्यीकरण/रिडक्शन |
  | `plugin-sdk/channel-config-primitives` | चैनल कॉन्फिग प्रिमिटिव | संकीर्ण चैनल कॉन्फिग-स्कीमा प्रिमिटिव |
  | `plugin-sdk/channel-config-writes` | चैनल कॉन्फिग-राइट सहायक | चैनल कॉन्फिग-राइट प्राधिकरण सहायक |
  | `plugin-sdk/channel-plugin-common` | साझा चैनल प्रील्यूड | साझा चैनल Plugin प्रील्यूड एक्सपोर्ट |
  | `plugin-sdk/channel-status` | चैनल स्थिति सहायक | साझा चैनल स्थिति स्नैपशॉट/सारांश सहायक |
  | `plugin-sdk/allowlist-config-edit` | allowlist कॉन्फिग सहायक | allowlist कॉन्फिग edit/read सहायक |
  | `plugin-sdk/group-access` | समूह एक्सेस सहायक | साझा समूह-एक्सेस निर्णय सहायक |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता फसाड | `plugin-sdk/channel-inbound` का उपयोग करें |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM गार्ड सहायक | संकीर्ण pre-crypto गार्ड पॉलिसी सहायक |
  | `plugin-sdk/extension-shared` | साझा एक्सटेंशन सहायक | passive-channel/status और ambient proxy सहायक प्रिमिटिव |
  | `plugin-sdk/webhook-targets` | Webhook लक्ष्य सहायक | Webhook लक्ष्य रजिस्ट्री और route-install सहायक |
  | `plugin-sdk/webhook-path` | अप्रचलित webhook पाथ उपनाम | `plugin-sdk/webhook-ingress` का उपयोग करें |
  | `plugin-sdk/web-media` | साझा वेब मीडिया सहायक | रिमोट/स्थानीय मीडिया लोडिंग सहायक |
  | `plugin-sdk/zod` | अप्रचलित Zod संगतता री-एक्सपोर्ट | `zod` से सीधे `zod` इम्पोर्ट करें |
  | `plugin-sdk/memory-core` | बंडल्ड memory-core सहायक | मेमोरी मैनेजर/कॉन्फिग/फ़ाइल/CLI सहायक सतह |
  | `plugin-sdk/memory-core-engine-runtime` | मेमोरी इंजन रनटाइम फसाड | मेमोरी इंडेक्स/सर्च रनटाइम फसाड |
  | `plugin-sdk/memory-core-host-embedding-registry` | मेमोरी एम्बेडिंग रजिस्ट्री | हल्के मेमोरी एम्बेडिंग प्रदाता रजिस्ट्री सहायक |
  | `plugin-sdk/memory-core-host-engine-foundation` | मेमोरी होस्ट फाउंडेशन इंजन | मेमोरी होस्ट फाउंडेशन इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-engine-embeddings` | मेमोरी होस्ट एम्बेडिंग इंजन | मेमोरी एम्बेडिंग कॉन्ट्रैक्ट, रजिस्ट्री एक्सेस, स्थानीय प्रदाता, और सामान्य batch/remote सहायक; ठोस रिमोट प्रदाता अपने स्वामी plugins में रहते हैं |
  | `plugin-sdk/memory-core-host-engine-qmd` | मेमोरी होस्ट QMD इंजन | मेमोरी होस्ट QMD इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-engine-storage` | मेमोरी होस्ट स्टोरेज इंजन | मेमोरी होस्ट स्टोरेज इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-multimodal` | मेमोरी होस्ट मल्टीमोडल सहायक | मेमोरी होस्ट मल्टीमोडल सहायक |
  | `plugin-sdk/memory-core-host-query` | मेमोरी होस्ट क्वेरी सहायक | मेमोरी होस्ट क्वेरी सहायक |
  | `plugin-sdk/memory-core-host-secret` | मेमोरी होस्ट सीक्रेट सहायक | मेमोरी होस्ट सीक्रेट सहायक |
  | `plugin-sdk/memory-core-host-events` | अप्रचलित मेमोरी इवेंट उपनाम | `plugin-sdk/memory-host-events` का उपयोग करें |
  | `plugin-sdk/memory-core-host-status` | मेमोरी होस्ट स्थिति सहायक | मेमोरी होस्ट स्थिति सहायक |
  | `plugin-sdk/memory-core-host-runtime-cli` | मेमोरी होस्ट CLI रनटाइम | मेमोरी होस्ट CLI रनटाइम सहायक |
  | `plugin-sdk/memory-core-host-runtime-core` | मेमोरी होस्ट कोर रनटाइम | मेमोरी होस्ट कोर रनटाइम सहायक |
  | `plugin-sdk/memory-core-host-runtime-files` | मेमोरी होस्ट फ़ाइल/रनटाइम सहायक | मेमोरी होस्ट फ़ाइल/रनटाइम सहायक |
  | `plugin-sdk/memory-host-core` | मेमोरी होस्ट कोर रनटाइम उपनाम | मेमोरी होस्ट कोर रनटाइम सहायक के लिए vendor-neutral उपनाम |
  | `plugin-sdk/memory-host-events` | मेमोरी होस्ट इवेंट जर्नल उपनाम | मेमोरी होस्ट इवेंट जर्नल सहायक के लिए vendor-neutral उपनाम |
  | `plugin-sdk/memory-host-files` | अप्रचलित मेमोरी फ़ाइल/रनटाइम उपनाम | `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
  | `plugin-sdk/memory-host-markdown` | प्रबंधित markdown सहायक | मेमोरी-सन्निकट plugins के लिए साझा managed-markdown सहायक |
  | `plugin-sdk/memory-host-search` | Active memory सर्च फसाड | लेज़ी active-memory search-manager रनटाइम फसाड |
  | `plugin-sdk/memory-host-status` | अप्रचलित मेमोरी होस्ट स्थिति उपनाम | `plugin-sdk/memory-core-host-status` का उपयोग करें |
  | `plugin-sdk/testing` | टेस्ट उपयोगिताएँ | repo-local अप्रचलित संगतता barrel; केंद्रित repo-local टेस्ट सबपाथ का उपयोग करें जैसे `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, और `plugin-sdk/test-fixtures` |
</Accordion>

यह तालिका जानबूझकर सामान्य माइग्रेशन उपसमुच्चय है, पूरा SDK
सतह नहीं। कंपाइलर entrypoint इन्वेंटरी
`scripts/lib/plugin-sdk-entrypoints.json` में रहती है; पैकेज exports
सार्वजनिक उपसमुच्चय से जनरेट होते हैं।

आरक्षित bundled-plugin helper seams को सार्वजनिक SDK export map से हटा दिया गया है,
सिवाय स्पष्ट रूप से दस्तावेजीकृत compatibility facades के, जैसे प्रकाशित
`@openclaw/discord@2026.3.13` पैकेज के लिए रखी गई deprecated
`plugin-sdk/discord` shim। Owner-specific helpers संबंधित plugin पैकेज के अंदर रहते हैं;
shared host behavior को generic SDK contracts जैसे `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime`, और `plugin-sdk/plugin-config-runtime` के माध्यम से जाना चाहिए।

काम से मेल खाने वाला सबसे संकरा import उपयोग करें। यदि आपको कोई export नहीं मिलता,
तो `src/plugin-sdk/` पर source देखें या maintainers से पूछें कि किस generic contract
को इसका owner होना चाहिए।

## सक्रिय deprecations

Plugin SDK, provider contract, runtime surface, और manifest पर लागू होने वाले
अधिक संकरे deprecations। इनमें से हर एक आज भी काम करता है, लेकिन भविष्य की
major release में हटाया जाएगा। हर item के नीचे की entry पुराने API को उसके
canonical replacement से map करती है।

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **पुराना (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **नया (`openclaw/plugin-sdk/command-status`)**: वही signatures, वही
    exports - बस अधिक संकरे subpath से import किए गए। `command-auth`
    उन्हें compat stubs के रूप में re-export करता है।

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

    **नया**: `resolveInboundMentionDecision({ facts, policy })` - दो विभाजित
    calls के बजाय एक single decision object लौटाता है।

    Downstream channel plugins (Slack, Discord, Matrix, MS Teams) पहले ही
    switch कर चुके हैं।

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` पुराने channel plugins के लिए एक
    compatibility shim है। नए code से इसे import न करें; runtime objects
    register करने के लिए `openclaw/plugin-sdk/channel-runtime-context` का उपयोग करें।

    `openclaw/plugin-sdk/channel-actions` में `channelActions*` helpers,
    raw "actions" channel exports के साथ deprecated हैं। इसके बजाय semantic
    `presentation` surface के माध्यम से capabilities expose करें - channel plugins
    यह declare करते हैं कि वे क्या render करते हैं (cards, buttons, selects),
    न कि वे कौन से raw action names स्वीकार करते हैं।

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **पुराना**: `openclaw/plugin-sdk/provider-web-search` से `tool()` factory।

    **नया**: provider plugin पर सीधे `createTool(...)` implement करें।
    OpenClaw को अब tool wrapper register करने के लिए SDK helper की आवश्यकता नहीं है।

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **पुराना**: inbound channel messages से flat plaintext prompt envelope बनाने के लिए
    `formatInboundEnvelope(...)` (और `ChannelMessageForAgent.channelEnvelope`)।

    **नया**: `BodyForAgent` plus structured user-context blocks। Channel
    plugins routing metadata (thread, topic, reply-to, reactions) को prompt string
    में जोड़ने के बजाय typed fields के रूप में attach करते हैं। Synthesized
    assistant-facing envelopes के लिए `formatAgentEnvelope(...)` helper अभी भी
    supported है, लेकिन inbound plaintext envelopes हटाए जा रहे हैं।

    प्रभावित क्षेत्र: `inbound_claim`, `message_received`, और कोई भी custom
    channel plugin जिसने `channelEnvelope` text को post-process किया हो।

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **पुराना**: `api.on("deactivate", handler)`।

    **नया**: `api.on("gateway_stop", handler)`। Event और context वही shutdown
    cleanup contract हैं; केवल hook name बदलता है।

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

    `deactivate` 2026-08-16 के बाद तक deprecated compatibility alias के रूप में
    wired रहता है।

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **पुराना**: `threadBindingReady` या `deliveryOrigin` लौटाने वाला
    `api.on("subagent_spawning", handler)`।

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

    | पुराना alias              | नया type                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    साथ में legacy `ProviderCapabilities` static bag - provider plugins को
    static object के बजाय explicit provider hooks जैसे `buildReplayPolicy`,
    `normalizeToolSchemas`, और `wrapStreamFn` का उपयोग करना चाहिए।

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **पुराना** (`ProviderThinkingPolicy` पर तीन अलग hooks):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, और
    `resolveDefaultThinkingLevel(ctx)`।

    **नया**: एक single `resolveThinkingProfile(ctx)` जो canonical `id`,
    optional `label`, और ranked level list के साथ `ProviderThinkingProfile`
    लौटाता है। OpenClaw stale stored values को profile rank के अनुसार
    automatically downgrade करता है।

    Context में `provider`, `modelId`, optional merged `reasoning`,
    और optional merged model `compat` facts शामिल हैं। Provider plugins उन
    catalog facts का उपयोग करके model-specific profile केवल तब expose कर सकते हैं
    जब configured request contract इसका समर्थन करता हो।

    तीन के बजाय एक hook implement करें। Legacy hooks deprecation window के दौरान
    काम करते रहेंगे लेकिन profile result के साथ composed नहीं होंगे।

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **पुराना**: plugin manifest में provider declare किए बिना external auth hooks
    implement करना।

    **नया**: plugin manifest में `contracts.externalAuthProviders` declare करें
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
    और केवल env-var lookups का जवाब देने के लिए plugin runtime boot करने से बचाता है।

    `providerAuthEnvVars` deprecation window बंद होने तक compatibility adapter
    के माध्यम से supported रहता है।

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **पुराना**: तीन अलग calls -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`।

    **नया**: memory-state API पर एक call -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`।

    वही slots, single registration call। Additive prompt और corpus helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) प्रभावित नहीं हैं।

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **पुराना**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`।

    **नया**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`।

    Generic embedding provider contract memory के बाहर भी reusable है और नए
    providers के लिए supported path है। Existing providers migrate करते समय
    memory-specific registration API deprecated compatibility के रूप में wired रहता है।
    Plugin inspection non-bundled usage को compatibility debt के रूप में report करता है।

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    `src/plugins/runtime/types.ts` से अभी भी exported दो legacy type aliases:

    | पुराना                        | नया                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime method `readSession`, `getSessionMessages` के पक्ष में deprecated है।
    वही signature; पुराना method नए method को call through करता है।

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **पुराना**: `runtime.tasks.flow` (singular) ने live task-flow accessor लौटाया।

    **नया**: `runtime.tasks.managedFlows` उन plugins के लिए managed TaskFlow mutation
    runtime रखता है जो flow से child tasks create, update, cancel, या run करते हैं।
    जब plugin को केवल DTO-based reads चाहिए हों, तो `runtime.tasks.flows` उपयोग करें।

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ऊपर "How to migrate → Migrate embedded tool-result extensions to
    middleware" में cover किया गया है। Completeness के लिए यहां शामिल: हटाया गया
    embedded-runner-only `api.registerEmbeddedExtensionFactory(...)` path,
    `contracts.agentToolResultMiddleware` में explicit runtime list के साथ
    `api.registerAgentToolResultMiddleware(...)` से replace किया गया है।
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` से re-exported `OpenClawSchemaType` अब `OpenClawConfig`
    के लिए one-line alias है। Canonical name को प्राथमिकता दें।

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` के अंतर्गत bundled channel/provider plugins के अंदर extension-level
deprecations उनके अपने `api.ts` और `runtime-api.ts` barrels में tracked हैं।
वे third-party plugin contracts को प्रभावित नहीं करते और यहां listed नहीं हैं।
यदि आप किसी bundled plugin के local barrel को सीधे consume करते हैं, तो upgrade करने से पहले
उस barrel में deprecation comments पढ़ें।
</Note>

## हटाने की समयरेखा

| कब                     | क्या होता है                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **अभी**                | अवमूल्यित सतहें रनटाइम चेतावनियां उत्सर्जित करती हैं                   |
| **अगली प्रमुख रिलीज़** | अवमूल्यित सतहें हटा दी जाएंगी; जो Plugin अभी भी उनका उपयोग कर रहे हैं वे विफल होंगे |

सभी कोर Plugin पहले ही माइग्रेट किए जा चुके हैं। बाहरी Plugin को अगली
प्रमुख रिलीज़ से पहले माइग्रेट कर लेना चाहिए।

## चेतावनियों को अस्थायी रूप से दबाना

माइग्रेशन पर काम करते समय ये एनवायरनमेंट वेरिएबल सेट करें:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

यह एक अस्थायी बचाव मार्ग है, स्थायी समाधान नहीं।

## संबंधित

- [आरंभ करना](/hi/plugins/building-plugins) - अपना पहला Plugin बनाएं
- [SDK अवलोकन](/hi/plugins/sdk-overview) - पूर्ण सबपाथ इंपोर्ट संदर्भ
- [चैनल Plugin](/hi/plugins/sdk-channel-plugins) - चैनल Plugin बनाना
- [प्रदाता Plugin](/hi/plugins/sdk-provider-plugins) - प्रदाता Plugin बनाना
- [Plugin आंतरिक विवरण](/hi/plugins/architecture) - आर्किटेक्चर की गहन जानकारी
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) - मैनिफेस्ट स्कीमा संदर्भ
