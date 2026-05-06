---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin เป็นสถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแลรักษา Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง SDK ของ Plugin สมัยใหม่
title: การย้ายไปใช้ Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:25:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้าง ไปสู่สถาปัตยกรรม Plugin
สมัยใหม่ที่มีการ import แบบเฉพาะเจาะจงและมีเอกสารกำกับ หาก Plugin ของคุณถูกสร้างก่อน
สถาปัตยกรรมใหม่ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยนแปลง

ระบบ Plugin เดิมมีพื้นผิวแบบเปิดกว้างสองแบบที่ให้ Plugin import
ทุกอย่างที่ต้องใช้จาก entry point เดียว:

- **`openclaw/plugin-sdk/compat`** - การ import เดียวที่ re-export helper หลายสิบตัว
  ถูกเพิ่มเข้ามาเพื่อให้ Plugin รุ่นเก่าที่อิง hook ยังทำงานได้ขณะที่
  สถาปัตยกรรม Plugin ใหม่กำลังถูกสร้าง
- **`openclaw/plugin-sdk/infra-runtime`** - barrel ของ helper runtime แบบกว้างที่
  รวม event ของระบบ, สถานะ Heartbeat, คิวการส่ง, helper สำหรับ fetch/proxy,
  helper ไฟล์, type ของ approval และยูทิลิตีที่ไม่เกี่ยวข้องเข้าด้วยกัน
- **`openclaw/plugin-sdk/config-runtime`** - barrel ความเข้ากันได้ของ config แบบกว้าง
  ที่ยังคงมี helper สำหรับ load/write โดยตรงที่เลิกใช้แล้วระหว่างช่วง migration
- **`openclaw/extension-api`** - bridge ที่ให้ Plugin เข้าถึง helper ฝั่ง host ได้โดยตรง
  เช่น embedded agent runner
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ของ extension แบบ bundled สำหรับ Pi เท่านั้น
  ที่ถูกลบแล้ว ซึ่งเคยสามารถสังเกต event ของ embedded-runner เช่น
  `tool_result`

พื้นผิวการ import แบบกว้างเหล่านี้ตอนนี้ **เลิกใช้แล้ว** พวกมันยังทำงานได้ที่ runtime
แต่ Plugin ใหม่ต้องไม่ใช้ และ Plugin ที่มีอยู่ควรย้ายออกก่อน
major release ถัดไปที่จะลบออก API สำหรับลงทะเบียน embedded extension factory
เฉพาะ Pi ถูกลบแล้ว ให้ใช้ middleware ของ tool-result แทน

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารกำกับใหม่ใน change เดียวกัน
กับที่เพิ่ม replacement เข้ามา การเปลี่ยนแปลง contract ที่ทำให้ breaking ต้องผ่าน
compatibility adapter, diagnostics, docs และช่วง deprecation ก่อน
สิ่งนี้ใช้กับ SDK imports, manifest fields, setup APIs, hooks และพฤติกรรม
runtime registration

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกลบใน major release ในอนาคต
  Plugin ที่ยัง import จากพื้นผิวเหล่านี้จะพังเมื่อถึงตอนนั้น
  การลงทะเบียน embedded extension factory เฉพาะ Pi ไม่ถูกโหลดอีกแล้ว
</Warning>

## เหตุผลที่เปลี่ยน

แนวทางเดิมทำให้เกิดปัญหา:

- **เริ่มต้นช้า** - การ import helper หนึ่งตัวโหลดโมดูลที่ไม่เกี่ยวข้องหลายสิบตัว
- **dependency แบบวนรอบ** - การ re-export แบบกว้างทำให้สร้าง import cycle ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** - ไม่มีวิธีบอกว่า export ใด stable และ export ใด internal

Plugin SDK สมัยใหม่แก้ปัญหานี้: แต่ละ import path (`openclaw/plugin-sdk/\<subpath\>`)
เป็นโมดูลขนาดเล็กที่ self-contained มีวัตถุประสงค์ชัดเจนและมี contract ที่มีเอกสารกำกับ

seam อำนวยความสะดวกของ provider รุ่นเก่าสำหรับ channel แบบ bundled ก็ถูกลบแล้วเช่นกัน
seam helper ที่ผูกกับแบรนด์ channel เป็น shortcut ส่วนตัวของ mono-repo ไม่ใช่
contract ของ Plugin ที่ stable ให้ใช้ SDK subpath แบบ generic ที่แคบแทน ภายใน workspace
ของ Plugin แบบ bundled ให้เก็บ helper ที่ provider เป็นเจ้าของไว้ใน `api.ts` หรือ
`runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง provider แบบ bundled ปัจจุบัน:

- Anthropic เก็บ helper stream เฉพาะ Claude ไว้ใน seam `api.ts` /
  `contract-api.ts` ของตนเอง
- OpenAI เก็บ provider builder, helper สำหรับ default-model และ realtime provider
  builder ไว้ใน `api.ts` ของตนเอง
- OpenRouter เก็บ provider builder และ helper onboarding/config ไว้ใน
  `api.ts` ของตนเอง

## แผน migration สำหรับ Talk และเสียง realtime

โค้ดเสียง realtime, โทรศัพท์, การประชุม และ browser Talk กำลังย้ายจาก
การทำ turn bookkeeping แบบเฉพาะพื้นผิว ไปยัง Talk session controller ร่วมที่ export โดย
`openclaw/plugin-sdk/realtime-voice` controller ใหม่เป็นเจ้าของ envelope ของ Talk
event ร่วม, สถานะ active turn, สถานะ capture, สถานะ output-audio, ประวัติ event ล่าสุด
และการปฏิเสธ stale-turn Plugin ของ provider ควรยังเป็นเจ้าของ session realtime
เฉพาะ vendor ต่อไป ส่วน Plugin ของพื้นผิวควรยังเป็นเจ้าของรายละเอียดเฉพาะของ capture,
playback, telephony และ meeting ต่อไป

migration ของ Talk นี้ตั้งใจให้ breaking-clean:

1. เก็บ controller/runtime primitive ร่วมไว้ใน
   `plugin-sdk/realtime-voice`
2. ย้ายพื้นผิวแบบ bundled ไปใช้ controller ร่วม: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime และ native push-to-talk
3. แทนที่กลุ่ม Talk RPC เดิมด้วย API สุดท้าย `talk.session.*` และ
   `talk.client.*`
4. ประกาศ channel event สดของ Talk หนึ่งรายการใน Gateway
   `hello-ok.features.events`: `talk.event`
5. ลบ endpoint HTTP realtime เดิมและ path ใดๆ สำหรับ request-time instruction
   override

โค้ดใหม่ไม่ควรเรียก `createTalkEventSequencer(...)` โดยตรง เว้นแต่กำลัง
implement adapter ระดับต่ำหรือ test fixture ให้ใช้ controller ร่วมเป็นหลัก
เพื่อให้ event ที่ผูกกับ turn ไม่สามารถถูก emit โดยไม่มี turn id, การเรียก stale `turnEnd` /
`turnCancel` ไม่สามารถล้าง active turn ที่ใหม่กว่าได้ และ event lifecycle ของ
output-audio สอดคล้องกันใน telephony, meetings, browser relay, managed-room
handoff และ native Talk clients

รูปร่าง API สาธารณะเป้าหมายคือ:

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
```

session WebRTC/provider-websocket ที่ browser เป็นเจ้าของใช้ `talk.client.create`
เพราะ browser เป็นเจ้าของการเจรจากับ provider และ media transport ขณะที่
Gateway เป็นเจ้าของ credentials, instructions และ tool policy `talk.session.*` คือ
พื้นผิวร่วมที่ Gateway จัดการสำหรับ gateway-relay realtime, gateway-relay
transcription และ session native STT/TTS ของ managed-room

config รุ่นเก่าที่วางตัวเลือก realtime ไว้ข้าง `talk.provider` /
`talk.providers` ควรถูกซ่อมด้วย `openclaw doctor --fix`; Talk ที่ runtime
จะไม่ตีความ config ของ provider speech/TTS เป็น config ของ realtime provider

ชุดผสม `talk.session.create` ที่รองรับถูกตั้งใจให้มีขนาดเล็ก:

| โหมด            | Transport       | Brain           | เจ้าของ              | หมายเหตุ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | เสียง provider แบบ full-duplex ถูก bridge ผ่าน Gateway; tool call ถูก route ผ่าน agent-consult tool      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | เฉพาะ streaming STT; caller ส่งเสียง input และรับ transcript event                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | ห้องแบบ push-to-talk และ walkie-talkie ที่ client เป็นเจ้าของ capture/playback และ Gateway เป็นเจ้าของ turn state |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | โหมดห้องสำหรับ admin เท่านั้นสำหรับพื้นผิว first-party ที่เชื่อถือได้ ซึ่ง execute action ของ Gateway tool โดยตรง                  |

แผนที่ method ที่ถูกลบ:

| เก่า                              | ใหม่                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` หรือ `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

คำศัพท์ควบคุมแบบรวมศูนย์ก็ตั้งใจให้แคบเช่นกัน:

| Method                          | ใช้กับ                                              | Contract                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | เพิ่ม chunk เสียง PCM แบบ base64 ต่อท้าย session ของ provider ที่เป็นเจ้าของโดยการเชื่อมต่อ Gateway เดียวกัน |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | เริ่ม turn ของผู้ใช้ใน managed-room                                                               |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | จบ active turn หลังผ่าน stale-turn validation                                              |
| `talk.session.cancelTurn`       | session ทั้งหมดที่ Gateway เป็นเจ้าของ                              | ยกเลิกงาน capture/provider/agent/TTS ที่ active สำหรับ turn หนึ่ง                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | หยุด output เสียงของ assistant โดยไม่จำเป็นต้องจบ turn ของผู้ใช้                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ทำ provider tool call ที่ relay emit ออกมาให้เสร็จ                                           |
| `talk.session.close`            | session แบบ unified ทั้งหมด                                    | หยุด relay session หรือ revoke สถานะ managed-room แล้วลืม unified session id         |

อย่าเพิ่ม special case เฉพาะ provider หรือ platform ใน core เพื่อทำให้สิ่งนี้ทำงาน
Core เป็นเจ้าของ semantics ของ Talk session Plugin ของ provider เป็นเจ้าของการตั้งค่า
session ของ vendor Voice-call และ Google Meet เป็นเจ้าของ adapter สำหรับ telephony/meeting
Browser และ native app เป็นเจ้าของ UX สำหรับ device capture/playback

## นโยบายความเข้ากันได้

สำหรับ Plugin ภายนอก งานด้านความเข้ากันได้จะทำตามลำดับนี้:

1. เพิ่ม contract ใหม่
2. คงพฤติกรรมเดิมไว้โดยเชื่อมผ่าน compatibility adapter
3. emit diagnostic หรือ warning ที่ระบุ path เดิมและ replacement
4. ครอบคลุมทั้งสอง path ใน tests
5. จัดทำเอกสาร deprecation และ migration path
6. ลบออกหลังจากช่วง migration ที่ประกาศไว้เท่านั้น โดยปกติอยู่ใน major release

  Maintainers can audit the current migration queue with
  `pnpm plugins:boundary-report`. Use `pnpm plugins:boundary-report:summary` for
  compact counts, `--owner <id>` for one plugin or compatibility owner, and
  `pnpm plugins:boundary-report:ci` when a CI gate should fail on due
  compatibility records, cross-owner reserved SDK imports, or unused reserved SDK
  subpaths. The report groups deprecated
  compatibility records by removal date, counts local code/docs references,
  surfaces cross-owner reserved SDK imports, and summarizes the private
  memory-host SDK bridge so compatibility cleanup stays explicit instead of
  relying on ad hoc searches. Reserved SDK subpaths must have tracked owner usage;
  unused reserved helper exports should be removed from the public SDK.

  If a manifest field is still accepted, plugin authors can keep using it until
  the docs and diagnostics say otherwise. New code should prefer the documented
  replacement, but existing plugins should not break during ordinary minor
  releases.

  ## How to migrate

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Bundled plugins should stop calling
    `api.runtime.config.loadConfig()` and
    `api.runtime.config.writeConfigFile(...)` directly. Prefer config that was
    already passed into the active call path. Long-lived handlers that need the
    current process snapshot can use `api.runtime.config.current()`. Long-lived
    agent tools should use the tool context's `ctx.getRuntimeConfig()` inside
    `execute` so a tool created before a config write still sees the refreshed
    runtime config.

    Config writes must go through the transactional helpers and choose an
    after-write policy:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Use `afterWrite: { mode: "restart", reason: "..." }` when the caller knows
    the change requires a clean gateway restart, and
    `afterWrite: { mode: "none", reason: "..." }` only when the caller owns the
    follow-up and deliberately wants to suppress the reload planner.
    Mutation results include a typed `followUp` summary for tests and logging;
    the gateway remains responsible for applying or scheduling the restart.
    `loadConfig` and `writeConfigFile` remain as deprecated compatibility
    helpers for external plugins during the migration window and warn once with
    the `runtime-config-load-write` compatibility code. Bundled plugins and repo
    runtime code are protected by scanner guardrails in
    `pnpm check:deprecated-internal-config-api` and
    `pnpm check:no-runtime-action-load-config`: new production plugin usage
    fails outright, direct config writes fail, gateway server methods must use
    the request runtime snapshot, runtime channel send/action/client helpers
    must receive config from their boundary, and long-lived runtime modules have
    zero allowed ambient `loadConfig()` calls.

    New plugin code should also avoid importing the broad
    `openclaw/plugin-sdk/config-runtime` compatibility barrel. Use the narrow
    SDK subpath that matches the job:

    | Need | Import |
    | --- | --- |
    | Config types such as `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Already-loaded config assertions and plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Current runtime snapshot reads | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config writes | `openclaw/plugin-sdk/config-mutation` |
    | Session store helpers | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helpers | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins and their tests are scanner-guarded against the broad
    barrel so imports and mocks stay local to the behavior they need. The broad
    barrel still exists for external compatibility, but new code should not
    depend on it.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    Bundled plugins must replace Pi-only
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlers with
    runtime-neutral middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Update the plugin manifest at the same time:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    External plugins cannot register tool-result middleware because it can
    rewrite high-trust tool output before the model sees it.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Approval-capable channel plugins now expose native approval behavior through
    `approvalCapability.nativeRuntime` plus the shared runtime-context registry.

    Key changes:

    - Replace `approvalCapability.handler.loadRuntime(...)` with
      `approvalCapability.nativeRuntime`
    - Move approval-specific auth/delivery off legacy `plugin.auth` /
      `plugin.approvals` wiring and onto `approvalCapability`
    - `ChannelPlugin.approvals` has been removed from the public channel-plugin
      contract; move delivery/native/render fields onto `approvalCapability`
    - `plugin.auth` remains for channel login/logout flows only; approval auth
      hooks there are no longer read by core
    - Register channel-owned runtime objects such as clients, tokens, or Bolt
      apps through `openclaw/plugin-sdk/channel-runtime-context`
    - Do not send plugin-owned reroute notices from native approval handlers;
      core now owns routed-elsewhere notices from actual delivery results
    - When passing `channelRuntime` into `createChannelManager(...)`, provide a
      real `createPluginRuntime().channel` surface. Partial stubs are rejected.

    See `/plugins/sdk-channel-plugins` for the current approval capability
    layout.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    If your plugin uses `openclaw/plugin-sdk/windows-spawn`, unresolved Windows
    `.cmd`/`.bat` wrappers now fail closed unless you explicitly pass
    `allowShellFallback: true`.

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

    If your caller does not intentionally rely on shell fallback, do not set
    `allowShellFallback` and handle the thrown error instead.

  </Step>

  <Step title="Find deprecated imports">
    Search your plugin for imports from either deprecated surface:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Each export from the old surface maps to a specific modern import path:

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

    For host-side helpers, use the injected plugin runtime instead of importing
    directly:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    The same pattern applies to other legacy bridge helpers:

    | Old import | Modern equivalent |
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
    `openclaw/plugin-sdk/infra-runtime` still exists for external
    compatibility, but new code should import the focused helper surface it
    actually needs:

    | Need | Import |
    | --- | --- |
    | System event queue helpers | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat event and visibility helpers | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pending delivery queue drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Channel activity telemetry | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory dedupe caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Safe local-file/media path helpers | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy and guarded fetch helpers | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher policy types | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Approval request/resolution types | `openclaw/plugin-sdk/approval-runtime` |
    | Approval reply payload and command helpers | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Error formatting helpers | `openclaw/plugin-sdk/error-runtime` |
    | Transport readiness waits | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Secure token helpers | `openclaw/plugin-sdk/secure-random-runtime` |
    | Bounded async task concurrency | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numeric coercion | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | File locks | `openclaw/plugin-sdk/file-lock` |

    Bundled plugins are scanner-guarded against `infra-runtime`, so repo code
    cannot regress to the broad barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    New channel route code should use `openclaw/plugin-sdk/channel-route`.
    The older route-key and comparable-target names remain as compatibility
    aliases during the migration window, but new plugins should use the route
    names that describe the behavior directly:

    | Old helper | Modern helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    ตัวช่วยเส้นทางสมัยใหม่ทำให้ `{ channel, to, accountId, threadId }` เป็นมาตรฐาน
    อย่างสม่ำเสมอทั้งในคำอนุมัติแบบเนทีฟ การระงับการตอบกลับ การตัดรายการซ้ำขาเข้า
    การส่ง Cron และการกำหนดเส้นทางเซสชัน หาก Plugin ของคุณมีไวยากรณ์เป้าหมาย
    แบบกำหนดเอง ให้ใช้ `resolveChannelRouteTargetWithParser(...)` เพื่อปรับ
    parser นั้นให้เข้ากับสัญญาเป้าหมายเส้นทางเดียวกัน

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงเส้นทาง import

  <Accordion title="Common import path table">
  | เส้นทางการ import | วัตถุประสงค์ | exports หลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วยรายการเข้า Plugin มาตรฐาน | `definePluginEntry` |
  | `plugin-sdk/core` | umbrella re-export แบบเดิมสำหรับนิยาม/ตัวสร้างรายการเข้าของช่องทาง | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export สคีมา config ราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วยรายการเข้าสำหรับ provider เดี่ยว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | นิยามและตัวสร้างรายการเข้าช่องทางแบบเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | ตัวช่วยตัวช่วยสร้างการตั้งค่าที่ใช้ร่วมกัน | พรอมป์รายการอนุญาต, ตัวสร้างสถานะการตั้งค่า |
  | `plugin-sdk/setup-runtime` | ตัวช่วย runtime ระหว่างการตั้งค่า | อะแดปเตอร์แพตช์การตั้งค่าที่ import ได้อย่างปลอดภัย, ตัวช่วย lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, พร็อกซีการตั้งค่าที่มอบหมาย |
  | `plugin-sdk/setup-adapter-runtime` | ตัวช่วยอะแดปเตอร์การตั้งค่า | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | ตัวช่วยเครื่องมือการตั้งค่า | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/config/action-gate |
  | `plugin-sdk/account-id` | ตัวช่วย account-id | `DEFAULT_ACCOUNT_ID`, การ normalize account-id |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี | ตัวช่วยค้นหาบัญชี + default-fallback |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบแคบ | ตัวช่วยรายการบัญชี/account-action |
  | `plugin-sdk/channel-setup` | อะแดปเตอร์ตัวช่วยสร้างการตั้งค่า | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับการจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเชื่อมต่อ prefix การตอบกลับ, การพิมพ์, และการส่งจากแหล่งที่มา | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | factory อะแดปเตอร์ config และตัวช่วยการเข้าถึง DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้างสคีมา config | primitive สคีมา config ช่องทางที่ใช้ร่วมกันและตัวสร้างทั่วไปเท่านั้น |
  | `plugin-sdk/bundled-channel-config-schema` | สคีมา config แบบ bundled | เฉพาะ bundled plugins ที่ดูแลโดย OpenClaw เท่านั้น; plugins ใหม่ต้องกำหนดสคีมาเฉพาะ Plugin เอง |
  | `plugin-sdk/channel-config-schema-legacy` | สคีมา config แบบ bundled ที่เลิกใช้แล้ว | alias สำหรับความเข้ากันได้เท่านั้น; ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ bundled plugins ที่ยังดูแลอยู่ |
  | `plugin-sdk/telegram-command-config` | ตัวช่วย config คำสั่ง Telegram | การ normalize ชื่อคำสั่ง, การตัดคำอธิบาย, การตรวจสอบรายการซ้ำ/ข้อขัดแย้ง |
  | `plugin-sdk/channel-policy` | การ resolve นโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | ตัวช่วยสถานะบัญชีและ lifecycle ของ draft stream | `createAccountStatusSink`, ตัวช่วย finalization ของ draft preview |
  | `plugin-sdk/inbound-envelope` | ตัวช่วย envelope ขาเข้า | ตัวช่วย route + ตัวสร้าง envelope ที่ใช้ร่วมกัน |
  | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วยการตอบกลับขาเข้า | ตัวช่วย record-and-dispatch ที่ใช้ร่วมกัน |
  | `plugin-sdk/messaging-targets` | การ parse เป้าหมายการส่งข้อความ | ตัวช่วย parse/matching เป้าหมาย |
  | `plugin-sdk/outbound-media` | ตัวช่วย media ขาออก | การโหลด media ขาออกที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | ตัวช่วย dependency การส่งขาออก | lookup `resolveOutboundSendDep` แบบเบาโดยไม่ import runtime ขาออกทั้งหมด |
  | `plugin-sdk/outbound-runtime` | ตัวช่วย runtime ขาออก | ตัวช่วยการส่งขาออก, identity/send delegate, session, formatting, และการวางแผน payload |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วย thread-binding | lifecycle และตัวช่วยอะแดปเตอร์ของ thread-binding |
  | `plugin-sdk/agent-media-payload` | ตัวช่วย payload media แบบเดิม | ตัวสร้าง payload media ของ agent สำหรับเลย์เอาต์ field แบบเดิม |
  | `plugin-sdk/channel-runtime` | compatibility shim ที่เลิกใช้แล้ว | เฉพาะยูทิลิตี้ runtime ช่องทางแบบเดิม |
  | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์การส่ง | ประเภทผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | พื้นที่จัดเก็บ Plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วย runtime แบบกว้าง | ตัวช่วย runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | ตัวช่วย env ของ runtime แบบแคบ | Logger/runtime env, timeout, retry, และตัวช่วย backoff |
  | `plugin-sdk/plugin-runtime` | ตัวช่วย runtime ของ Plugin ที่ใช้ร่วมกัน | ตัวช่วยคำสั่ง/hooks/http/interactive ของ Plugin |
  | `plugin-sdk/hook-runtime` | ตัวช่วย pipeline ของ hook | ตัวช่วย pipeline Webhook/ภายในสำหรับ hook ที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วย lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วย process | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วย runtime ของ CLI | การจัดรูปแบบคำสั่ง, การรอ, ตัวช่วยเวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | client ของ Gateway, ตัวช่วยเริ่มแบบ event-loop-ready, และตัวช่วยแพตช์ channel-status |
  | `plugin-sdk/config-runtime` | compatibility shim ของ config ที่เลิกใช้แล้ว | ควรใช้ `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, และ `config-mutation` |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram แบบ fallback-stable เมื่อพื้นผิวสัญญา Telegram แบบ bundled ไม่พร้อมใช้งาน |
  | `plugin-sdk/approval-runtime` | ตัวช่วยพรอมป์การอนุมัติ | payload การอนุมัติ exec/Plugin, ตัวช่วย capability/profile การอนุมัติ, ตัวช่วย routing/runtime การอนุมัติแบบ native, และการจัดรูปแบบ path สำหรับการแสดงผลการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วย auth การอนุมัติ | การ resolve ผู้อนุมัติ, auth การกระทำในแชตเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วย client การอนุมัติ | ตัวช่วย profile/filter การอนุมัติ exec แบบ native |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วยการส่งการอนุมัติ | อะแดปเตอร์ capability/delivery การอนุมัติแบบ native |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย Gateway การอนุมัติ | ตัวช่วย resolve Gateway การอนุมัติที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยอะแดปเตอร์การอนุมัติ | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบ native น้ำหนักเบาสำหรับ entrypoint ช่องทางแบบ hot |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วย handler การอนุมัติ | ตัวช่วย runtime ของ handler การอนุมัติที่กว้างกว่า; ควรใช้ seam adapter/Gateway ที่แคบกว่าเมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติ | ตัวช่วย target/account binding การอนุมัติแบบ native |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วยการตอบกลับการอนุมัติ | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วย runtime-context ของช่องทาง | ตัวช่วย register/get/watch runtime-context ของช่องทางทั่วไป |
  | `plugin-sdk/security-runtime` | ตัวช่วยความปลอดภัย | ตัวช่วย trust, การกั้น DM, ไฟล์/path แบบ root-bounded, external-content, และ secret-collection ที่ใช้ร่วมกัน |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วยนโยบายรายการอนุญาตของ host และ private-network |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วย runtime SSRF | ตัวช่วย pinned-dispatcher, guarded fetch, นโยบาย SSRF |
  | `plugin-sdk/system-event-runtime` | ตัวช่วยเหตุการณ์ระบบ | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | ตัวช่วย Heartbeat | ตัวช่วยเหตุการณ์และ visibility ของ Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยคิวการส่ง | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | ตัวช่วยกิจกรรมช่องทาง | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | ตัวช่วย dedupe | แคช dedupe ในหน่วยความจำ |
  | `plugin-sdk/file-access-runtime` | ตัวช่วยการเข้าถึงไฟล์ | ตัวช่วย path ไฟล์/media ภายในเครื่องที่ปลอดภัย |
  | `plugin-sdk/transport-ready-runtime` | ตัวช่วยความพร้อมของ transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | ตัวช่วยแคชแบบจำกัดขอบเขต | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วยการกั้น diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วยกราฟข้อผิดพลาด |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch/proxy แบบ wrapper | `resolveFetch`, ตัวช่วย proxy, ตัวช่วย option ของ EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | ตัวช่วย normalize host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วย retry | `RetryConfig`, `retryAsync`, policy runners |
  | `plugin-sdk/allow-from` | การจัดรูปแบบรายการอนุญาต | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | การ mapping อินพุตรายการอนุญาต | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | การกั้นคำสั่งและตัวช่วยพื้นผิวคำสั่ง | `resolveControlCommandGate`, ตัวช่วย sender-authorization, ตัวช่วย registry คำสั่งรวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก |
  | `plugin-sdk/command-status` | renderer สถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การ parse อินพุต secret | ตัวช่วยอินพุต secret |
  | `plugin-sdk/webhook-ingress` | ตัวช่วย request ของ Webhook | ยูทิลิตี้เป้าหมาย Webhook |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วย guard body ของ Webhook | ตัวช่วยอ่าน/จำกัด body ของ request |
  | `plugin-sdk/reply-runtime` | runtime การตอบกลับที่ใช้ร่วมกัน | dispatch ขาเข้า, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch การตอบกลับแบบแคบ | ตัวช่วย finalize, provider dispatch, และ conversation-label |
  | `plugin-sdk/reply-history` | ตัวช่วย reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reference การตอบกลับ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วย chunk การตอบกลับ | ตัวช่วย chunking ข้อความ/markdown |
  | `plugin-sdk/session-store-runtime` | ตัวช่วย session store | ตัวช่วย path ของ store + updated-at |
  | `plugin-sdk/state-paths` | ตัวช่วย path ของ state | ตัวช่วย dir ของ state และ OAuth |
  | `plugin-sdk/routing` | ตัวช่วย routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วย normalize session-key |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะช่องทาง | ตัวสร้างสรุปสถานะช่องทาง/บัญชี, ค่าเริ่มต้น runtime-state, ตัวช่วย metadata ของ issue |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วย normalize สตริง | ตัวช่วย normalize slug/สตริง |
  | `plugin-sdk/request-url` | ตัวช่วย URL ของ request | ดึง URL แบบสตริงจากอินพุตที่คล้าย request |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบจับเวลา | runner คำสั่งแบบจับเวลาพร้อม stdout/stderr ที่ normalize แล้ว |
  | `plugin-sdk/param-readers` | ตัวอ่าน param | ตัวอ่าน param ทั่วไปของ tool/CLI |
  | `plugin-sdk/tool-payload` | การแยกเพย์โหลดของเครื่องมือ | แยกเพย์โหลดที่ปรับให้อยู่ในรูปแบบมาตรฐานจากออบเจ็กต์ผลลัพธ์ของเครื่องมือ |
  | `plugin-sdk/tool-send` | การแยกการส่งของเครื่องมือ | แยกฟิลด์เป้าหมายการส่งมาตรฐานจากอาร์กิวเมนต์ของเครื่องมือ |
  | `plugin-sdk/temp-path` | ตัวช่วยพาธชั่วคราว | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | ตัวช่วยการบันทึกล็อก | ตัวบันทึกล็อกของระบบย่อยและตัวช่วยการปกปิดข้อมูล |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วยตาราง Markdown | ตัวช่วยโหมดตาราง Markdown |
  | `plugin-sdk/reply-payload` | ประเภทการตอบกลับข้อความ | ประเภทเพย์โหลดการตอบกลับ |
  | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการแบบ local/โฮสต์เองที่คัดสรรไว้ | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการแบบโฮสต์เอง |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI โดยเฉพาะ | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการแบบโฮสต์เองชุดเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการยืนยันตัวตนรันไทม์ของผู้ให้บริการ | ตัวช่วยแก้ค่า API key ในรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วยการตั้งค่า API key ของผู้ให้บริการ | ตัวช่วย onboarding/เขียนโปรไฟล์สำหรับ API key |
  | `plugin-sdk/provider-auth-result` | ตัวช่วยผลลัพธ์การยืนยันตัวตนของผู้ให้บริการ | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
  | `plugin-sdk/provider-auth-login` | ตัวช่วยการเข้าสู่ระบบแบบโต้ตอบของผู้ให้บริการ | ตัวช่วยการเข้าสู่ระบบแบบโต้ตอบที่ใช้ร่วมกัน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยการเลือกผู้ให้บริการ | การเลือกผู้ให้บริการแบบกำหนดค่าไว้หรืออัตโนมัติ และการรวมค่ากำหนดผู้ให้บริการดิบ |
  | `plugin-sdk/provider-env-vars` | ตัวช่วยตัวแปรสภาพแวดล้อมของผู้ให้บริการ | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
  | `plugin-sdk/provider-model-shared` | ตัวช่วยโมเดล/รีเพลย์ของผู้ให้บริการที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบายรีเพลย์ที่ใช้ร่วมกัน, ตัวช่วยเอนด์พอยต์ของผู้ให้บริการ และตัวช่วยปรับรหัสโมเดลให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วยแค็ตตาล็อกผู้ให้บริการที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์ onboarding ของผู้ให้บริการ | ตัวช่วยกำหนดค่า onboarding |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของผู้ให้บริการ | ตัวช่วยความสามารถ HTTP/เอนด์พอยต์ทั่วไปของผู้ให้บริการ รวมถึงตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วย web-fetch ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่า web-search ของผู้ให้บริการ | ตัวช่วยการกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องใช้การเดินสายเปิดใช้ Plugin |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา web-search ของผู้ให้บริการ | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลรับรองตามขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วย web-search ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคช/รันไทม์ผู้ให้บริการ web-search |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของเครื่องมือ/สคีมาผู้ให้บริการ | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้างสคีมา Gemini + การวินิจฉัย และตัวช่วยความเข้ากันได้ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานของผู้ให้บริการ | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และตัวช่วยการใช้งานผู้ให้บริการอื่น ๆ |
  | `plugin-sdk/provider-stream` | ตัวช่วยตัวครอบสตรีมของผู้ให้บริการ | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภทตัวครอบสตรีม และตัวช่วยตัวครอบ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ที่ใช้ร่วมกัน |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วยทรานสปอร์ตของผู้ให้บริการ | ตัวช่วยทรานสปอร์ตผู้ให้บริการแบบเนทีฟ เช่น guarded fetch, การแปลงข้อความทรานสปอร์ต และสตรีมเหตุการณ์ทรานสปอร์ตที่เขียนได้ |
  | `plugin-sdk/keyed-async-queue` | คิว async แบบมีลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วยดึง/แปลง/จัดเก็บสื่อ, การตรวจวัดมิติวิดีโอที่อิง ffprobe และตัวสร้างเพย์โหลดสื่อ |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสร้างสื่อที่ใช้ร่วมกัน | ตัวช่วย failover ที่ใช้ร่วมกัน, การเลือกตัวเลือกผู้สมัคร และข้อความเมื่อขาดโมเดลสำหรับการสร้างภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วยความเข้าใจสื่อ | ประเภทผู้ให้บริการความเข้าใจสื่อ พร้อมเอ็กซ์พอร์ตตัวช่วยภาพ/เสียงสำหรับผู้ให้บริการ |
  | `plugin-sdk/text-runtime` | ตัวช่วยข้อความที่ใช้ร่วมกัน | การลบข้อความที่ผู้ช่วยมองเห็น, ตัวช่วยเรนเดอร์/แบ่งชิ้น/ตาราง Markdown, ตัวช่วยการปกปิดข้อมูล, ตัวช่วยแท็กคำสั่ง, ยูทิลิตีข้อความปลอดภัย และตัวช่วยข้อความ/การบันทึกล็อกที่เกี่ยวข้อง |
  | `plugin-sdk/text-chunking` | ตัวช่วยการแบ่งชิ้นข้อความ | ตัวช่วยแบ่งชิ้นข้อความขาออก |
  | `plugin-sdk/speech` | ตัวช่วยคำพูด | ประเภทผู้ให้บริการคำพูด พร้อมตัวช่วยคำสั่ง, รีจิสทรี, การตรวจสอบความถูกต้องสำหรับผู้ให้บริการ และตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/speech-core` | แกนคำพูดที่ใช้ร่วมกัน | ประเภทผู้ให้บริการคำพูด, รีจิสทรี, คำสั่ง, การปรับให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/realtime-transcription` | ตัวช่วยการถอดเสียงแบบเรียลไทม์ | ประเภทผู้ให้บริการ, ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วยเสียงแบบเรียลไทม์ | ประเภทผู้ให้บริการ, ตัวช่วยรีจิสทรี/การแก้ค่า, ตัวช่วยเซสชันบริดจ์, คิวพูดกลับของเอเจนต์ที่ใช้ร่วมกัน, สุขภาพทรานสคริปต์/เหตุการณ์, การระงับเสียงสะท้อน และตัวช่วยปรึกษาบริบทแบบรวดเร็ว |
  | `plugin-sdk/image-generation` | ตัวช่วยการสร้างภาพ | ประเภทผู้ให้บริการการสร้างภาพ พร้อมตัวช่วย URL สินทรัพย์/ข้อมูลภาพ และตัวสร้างผู้ให้บริการภาพที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/image-generation-core` | แกนการสร้างภาพที่ใช้ร่วมกัน | ประเภทการสร้างภาพ, failover, การยืนยันตัวตน และตัวช่วยรีจิสทรี |
  | `plugin-sdk/music-generation` | ตัวช่วยการสร้างเพลง | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
  | `plugin-sdk/music-generation-core` | แกนการสร้างเพลงที่ใช้ร่วมกัน | ประเภทการสร้างเพลง, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | ตัวช่วยการสร้างวิดีโอ | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
  | `plugin-sdk/video-generation-core` | แกนการสร้างวิดีโอที่ใช้ร่วมกัน | ประเภทการสร้างวิดีโอ, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | ตัวช่วยการตอบกลับแบบโต้ตอบ | การปรับ/ย่อเพย์โหลดการตอบกลับแบบโต้ตอบให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/channel-config-primitives` | primitive การกำหนดค่าช่องทาง | primitive สคีมาการกำหนดค่าช่องทางแบบแคบ |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยการเขียนการกำหนดค่าช่องทาง | ตัวช่วยการอนุญาตการเขียนการกำหนดค่าช่องทาง |
  | `plugin-sdk/channel-plugin-common` | prelude ช่องทางที่ใช้ร่วมกัน | เอ็กซ์พอร์ต prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะช่องทาง | ตัวช่วย snapshot/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วยการกำหนดค่า allowlist | ตัวช่วยแก้ไข/อ่านการกำหนดค่า allowlist |
  | `plugin-sdk/group-access` | ตัวช่วยการเข้าถึงกลุ่ม | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm` | ตัวช่วย DM โดยตรง | ตัวช่วยการยืนยันตัวตน/การป้องกัน DM โดยตรงที่ใช้ร่วมกัน |
  | `plugin-sdk/extension-shared` | ตัวช่วยส่วนขยายที่ใช้ร่วมกัน | primitive ตัวช่วยสำหรับช่องทางแบบพาสซีฟ/สถานะ และพร็อกซีแวดล้อม |
  | `plugin-sdk/webhook-targets` | ตัวช่วยเป้าหมาย Webhook | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
  | `plugin-sdk/webhook-path` | ตัวช่วยพาธ Webhook | ตัวช่วยปรับพาธ Webhook ให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/web-media` | ตัวช่วยสื่อเว็บที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อระยะไกล/local |
  | `plugin-sdk/zod` | การส่งออกซ้ำ Zod | `zod` ที่ส่งออกซ้ำสำหรับผู้ใช้ plugin SDK |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่บันเดิลมา | พื้นผิวตัวช่วยตัวจัดการหน่วยความจำ/การกำหนดค่า/ไฟล์/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | ฟาซาดรันไทม์เอนจินหน่วยความจำ | ฟาซาดรันไทม์ดัชนี/การค้นหาหน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-foundation` | เอนจิน foundation ของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจิน foundation ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | เอนจิน embedding ของโฮสต์หน่วยความจำ | สัญญา embedding หน่วยความจำ, การเข้าถึงรีจิสทรี, ผู้ให้บริการ local และตัวช่วยแบตช์/ระยะไกลทั่วไป; ผู้ให้บริการระยะไกลแบบเจาะจงอยู่ใน Plugin ที่เป็นเจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | เอนจิน QMD ของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจิน QMD ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-storage` | เอนจินพื้นที่จัดเก็บของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจินพื้นที่จัดเก็บของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยหลายโมดัลของโฮสต์หน่วยความจำ | ตัวช่วยหลายโมดัลของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วยคิวรีของโฮสต์หน่วยความจำ | ตัวช่วยคิวรีของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วยความลับของโฮสต์หน่วยความจำ | ตัวช่วยความลับของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-events` | ตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ | ตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-cli` | รันไทม์ CLI ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-core` | รันไทม์แกนของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์แกนของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-core` | นามแฝงรันไทม์แกนของโฮสต์หน่วยความจำ | นามแฝงที่ไม่ผูกกับผู้ขายสำหรับตัวช่วยรันไทม์แกนของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-events` | นามแฝงบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ | นามแฝงที่ไม่ผูกกับผู้ขายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-files` | นามแฝงไฟล์/รันไทม์ของโฮสต์หน่วยความจำ | นามแฝงที่ไม่ผูกกับผู้ขายสำหรับตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย Markdown ที่จัดการแล้ว | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้เคียงกับหน่วยความจำ |
  | `plugin-sdk/memory-host-search` | ฟาซาดการค้นหา Active Memory | ฟาซาดรันไทม์ตัวจัดการการค้นหา active-memory แบบ lazy |
  | `plugin-sdk/memory-host-status` | นามแฝงสถานะของโฮสต์หน่วยความจำ | นามแฝงที่ไม่ผูกกับผู้ขายสำหรับตัวช่วยสถานะของโฮสต์หน่วยความจำ |
  | `plugin-sdk/testing` | ยูทิลิตีการทดสอบ | barrel ความเข้ากันได้แบบกว้างรุ่นเดิม; ควรใช้ซับพาธทดสอบเฉพาะทาง เช่น `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` และ `plugin-sdk/test-fixtures` |
</Accordion>

ตารางนี้ตั้งใจให้เป็นชุดย่อยการย้ายระบบที่ใช้ร่วมกัน ไม่ใช่พื้นผิว SDK
ทั้งหมด รายการ entrypoint ทั้งหมดกว่า 200 รายการอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`

seam ตัวช่วยของ bundled-plugin ที่สงวนไว้ถูกเลิกใช้จาก export map ของ SDK
สาธารณะแล้ว ยกเว้น facade ความเข้ากันได้ที่มีเอกสารกำกับไว้อย่างชัดเจน เช่น shim
`plugin-sdk/discord` ที่เลิกใช้แล้วแต่ยังคงไว้สำหรับแพ็กเกจ
`@openclaw/discord@2026.3.13` ที่เผยแพร่แล้ว ตัวช่วยเฉพาะเจ้าของอยู่ภายในแพ็กเกจ Plugin
ที่เป็นเจ้าของ พฤติกรรม host ที่ใช้ร่วมกันควรย้ายผ่านสัญญา SDK ทั่วไป เช่น
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
และ `plugin-sdk/plugin-config-runtime`

ใช้อิมพอร์ตที่แคบที่สุดซึ่งตรงกับงาน หากหา export ไม่พบ
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือถามผู้ดูแลว่า generic contract ใด
ควรเป็นเจ้าของสิ่งนั้น

## การเลิกใช้ที่มีผลอยู่

การเลิกใช้ที่แคบลงซึ่งใช้กับ plugin SDK, provider contract,
runtime surface และ manifest แต่ละรายการยังทำงานได้ในวันนี้ แต่จะถูกนำออก
ใน major release ในอนาคต รายการใต้แต่ละหัวข้อจะจับคู่ API เดิมกับ
ตัวแทนที่เป็น canonical

<AccordionGroup>
  <Accordion title="ตัวสร้างข้อความช่วยเหลือ command-auth → command-status">
    **เดิม (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม export เดิม
    เพียงอิมพอร์ตจาก subpath ที่แคบกว่า `command-auth`
    re-export รายการเหล่านี้เป็น stub เพื่อความเข้ากันได้

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="ตัวช่วยการกั้น mention → resolveInboundMentionDecision">
    **เดิม**: `resolveInboundMentionRequirement({ facts, policy })` และ
    `shouldDropInboundForMention(...)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` - คืนอ็อบเจ็กต์
    การตัดสินใจเดียวแทนการเรียกที่แยกเป็นสองครั้ง

    Plugin ช่องทางปลายน้ำ (Slack, Discord, Matrix, MS Teams) ได้เปลี่ยนไปแล้ว

  </Accordion>

  <Accordion title="shim runtime ของช่องทางและตัวช่วย action ของช่องทาง">
    `openclaw/plugin-sdk/channel-runtime` เป็น shim ความเข้ากันได้สำหรับ
    Plugin ช่องทางรุ่นเก่า อย่าอิมพอร์ตจากโค้ดใหม่ ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับลงทะเบียนอ็อบเจ็กต์
    runtime

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions`
    ถูกเลิกใช้พร้อมกับ export ช่องทางแบบ raw "actions" ให้เปิดเผย capability
    ผ่าน surface เชิงความหมาย `presentation` แทน - Plugin ช่องทาง
    ประกาศสิ่งที่เรนเดอร์ (การ์ด ปุ่ม select) แทนชื่อ action raw
    ที่ยอมรับ

  </Accordion>

  <Accordion title="ตัวช่วย tool() ของผู้ให้บริการค้นหาเว็บ → createTool() บน Plugin">
    **เดิม**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`

    **ใหม่**: implement `createTool(...)` โดยตรงบน Plugin ผู้ให้บริการ
    OpenClaw ไม่ต้องใช้ตัวช่วย SDK เพื่อลงทะเบียน wrapper ของเครื่องมืออีกต่อไป

  </Accordion>

  <Accordion title="envelope ช่องทางแบบ plaintext → BodyForAgent">
    **เดิม**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) เพื่อสร้าง prompt envelope
    plaintext แบบแบนจากข้อความช่องทางขาเข้า

    **ใหม่**: `BodyForAgent` พร้อมบล็อก user-context แบบมีโครงสร้าง
    Plugin ช่องทางแนบ metadata การกำหนดเส้นทาง (thread, topic, reply-to, reactions)
    เป็นฟิลด์ที่มีชนิด แทนการต่อรวมเป็นสตริง prompt ตัวช่วย
    `formatAgentEnvelope(...)` ยังรองรับสำหรับ envelope ที่สังเคราะห์ขึ้น
    เพื่อส่งให้ assistant แต่ envelope plaintext ขาเข้ากำลังจะถูกเลิกใช้

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received` และ Plugin
    ช่องทางกำหนดเองใด ๆ ที่ post-process ข้อความ `channelEnvelope`

  </Accordion>

  <Accordion title="ชนิดการค้นพบผู้ให้บริการ → ชนิดแคตตาล็อกผู้ให้บริการ">
    type alias สำหรับการค้นพบสี่รายการตอนนี้เป็น wrapper บาง ๆ เหนือชนิด
    ยุคแคตตาล็อก:

    | alias เดิม                 | ชนิดใหม่                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึง static bag `ProviderCapabilities` แบบ legacy - Plugin ผู้ให้บริการ
    ควรใช้ hook ผู้ให้บริการแบบชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas` และ `wrapStreamFn` แทนอ็อบเจ็กต์แบบ static

  </Accordion>

  <Accordion title="hook นโยบาย thinking → resolveThinkingProfile">
    **เดิม** (hook แยกสามรายการบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` และ
    `resolveDefaultThinkingLevel(ctx)`

    **ใหม่**: `resolveThinkingProfile(ctx)` รายการเดียวที่คืน
    `ProviderThinkingProfile` พร้อม `id` แบบ canonical, `label` ที่เป็นทางเลือก และ
    รายการระดับที่จัดอันดับแล้ว OpenClaw จะ downgrade ค่าที่จัดเก็บไว้ซึ่งล้าสมัย
    ตามอันดับของ profile โดยอัตโนมัติ

    implement hook เดียวแทนสามรายการ hook แบบ legacy ยังทำงานในช่วงเวลา
    การเลิกใช้ แต่จะไม่ถูก compose กับผลลัพธ์ของ profile

  </Accordion>

  <Accordion title="fallback ผู้ให้บริการ OAuth ภายนอก → contracts.externalAuthProviders">
    **เดิม**: implement `resolveExternalOAuthProfiles(...)` โดยไม่
    ประกาศผู้ให้บริการใน manifest ของ Plugin

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน manifest ของ Plugin
    **และ** implement `resolveExternalAuthProfiles(...)` path "auth
    fallback" แบบเดิมจะปล่อยคำเตือนที่ runtime และจะถูกนำออก

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="การค้นหา env-var ของผู้ให้บริการ → setup.providers[].envVars">
    ฟิลด์ manifest **เดิม**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`

    **ใหม่**: mirror การค้นหา env-var เดียวกันไปยัง `setup.providers[].envVars`
    บน manifest สิ่งนี้รวม metadata env สำหรับ setup/status ไว้ในที่เดียว
    และหลีกเลี่ยงการบูต runtime ของ Plugin เพียงเพื่อตอบการค้นหา env-var

    `providerAuthEnvVars` ยังรองรับผ่าน adapter ความเข้ากันได้
    จนกว่าช่วงเวลาการเลิกใช้จะปิดลง

  </Accordion>

  <Accordion title="การลงทะเบียน Plugin หน่วยความจำ → registerMemoryCapability">
    **เดิม**: การเรียกสามรายการแยกกัน -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`

    **ใหม่**: การเรียกเดียวบน API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`

    slot เดิม การเรียกลงทะเบียนครั้งเดียว ตัวช่วยหน่วยความจำแบบ additive
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="เปลี่ยนชื่อชนิดข้อความ session ของ subagent">
    type alias แบบ legacy สองรายการยัง export จาก `src/plugins/runtime/types.ts`:

    | เดิม                           | ใหม่                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    เมธอด runtime `readSession` ถูกเลิกใช้ โดยให้ใช้
    `getSessionMessages` แทน signature เดิม เมธอดเดิมเรียกต่อไปยังเมธอดใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **เดิม**: `runtime.tasks.flow` (เอกพจน์) คืน accessor ของ task-flow แบบ live

    **ใหม่**: `runtime.tasks.managedFlows` เก็บ runtime การเปลี่ยนแปลง TaskFlow
    แบบ managed สำหรับ Plugin ที่สร้าง อัปเดต ยกเลิก หรือรันงานลูกจาก flow
    ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเพียงการอ่านแบบ DTO

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factory ส่วนขยายแบบฝัง → middleware ผลลัพธ์เครื่องมือของเอเจนต์">
    ครอบคลุมใน "วิธีย้ายระบบ → ย้ายส่วนขยายผลลัพธ์เครื่องมือของ Pi ไปยัง
    middleware" ด้านบน รวมไว้ที่นี่เพื่อความครบถ้วน: path เฉพาะ Pi ที่ถูกลบ
    `api.registerEmbeddedExtensionFactory(...)` ถูกแทนที่ด้วย
    `api.registerAgentToolResultMiddleware(...)` พร้อมรายการ runtime ที่ชัดเจน
    ใน `contracts.agentToolResultMiddleware`
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` ที่ re-export จาก `openclaw/plugin-sdk` ตอนนี้เป็น
    alias บรรทัดเดียวสำหรับ `OpenClawConfig` ให้ใช้ชื่อ canonical

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกใช้ระดับส่วนขยาย (ภายใน Plugin ช่องทาง/ผู้ให้บริการที่ bundled อยู่ใต้
`extensions/`) ถูกติดตามภายใน barrel `api.ts` และ `runtime-api.ts`
ของตนเอง สิ่งเหล่านี้ไม่กระทบสัญญา Plugin ของบุคคลที่สาม และไม่ได้แสดงไว้
ที่นี่ หากคุณ consume barrel ภายในของ Plugin ที่ bundled โดยตรง ให้อ่าน
คอมเมนต์การเลิกใช้ใน barrel นั้นก่อนอัปเกรด
</Note>

## ไทม์ไลน์การนำออก

| เมื่อใด                   | สิ่งที่จะเกิดขึ้น                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**                | surface ที่เลิกใช้แล้วจะปล่อยคำเตือนที่ runtime                               |
| **major release ถัดไป** | surface ที่เลิกใช้แล้วจะถูกนำออก Plugin ที่ยังใช้อยู่จะล้มเหลว |

Plugin หลักทั้งหมดถูกย้ายระบบแล้ว Plugin ภายนอกควรย้ายระบบ
ก่อน major release ถัดไป

## การระงับคำเตือนชั่วคราว

ตั้ง environment variable เหล่านี้ขณะทำงานย้ายระบบ:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นทางออกชั่วคราว ไม่ใช่วิธีแก้ถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) - สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) - อ้างอิงการอิมพอร์ต subpath ทั้งหมด
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้าง Plugin ช่องทาง
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การสร้าง Plugin ผู้ให้บริการ
- [ภายใน Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรม
- [Manifest ของ Plugin](/th/plugins/manifest) - อ้างอิง schema ของ manifest
