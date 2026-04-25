---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ `api.registerEmbeddedExtensionFactory` ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ไปยังสถาปัตยกรรม Plugin แบบสมัยใหม่
    - คุณดูแล external Plugin ของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง Plugin SDK แบบสมัยใหม่
title: การย้าย Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:55:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้าง ไปสู่สถาปัตยกรรม Plugin
แบบสมัยใหม่ที่มี imports เฉพาะทางและมีเอกสารรองรับ หาก Plugin ของคุณถูกสร้างก่อน
สถาปัตยกรรมใหม่นี้ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยนไป

ระบบ Plugin แบบเก่าให้พื้นผิวแบบเปิดกว้างสองจุดที่อนุญาตให้ plugins import
ทุกอย่างที่ต้องการจาก entry point เดียว:

- **`openclaw/plugin-sdk/compat`** — import เดียวที่ re-export helpers หลายสิบตัว
  มันถูกเพิ่มเข้ามาเพื่อให้ hook-based plugins รุ่นเก่ายังคงทำงานได้ระหว่างที่
  สถาปัตยกรรม Plugin แบบใหม่กำลังถูกสร้าง
- **`openclaw/extension-api`** — สะพานเชื่อมที่ให้ plugins เข้าถึง
  host-side helpers โดยตรง เช่น embedded agent runner
- **`api.registerEmbeddedExtensionFactory(...)`** — Pi-only bundled
  extension hook ที่ถูกถอดออกแล้ว ซึ่งเคยสังเกตเหตุการณ์จาก embedded-runner เช่น
  `tool_result`

ตอนนี้พื้นผิว import แบบกว้างเหล่านี้ถูก **เลิกใช้งานแล้ว** มันยังคงทำงานได้ใน runtime
แต่ plugins ใหม่ต้องไม่ใช้มัน และ plugins เดิมควรย้ายก่อนที่ major release ถัดไปจะถอดมันออก ส่วน Pi-only embedded extension factory
registration API ถูกถอดออกแล้ว; ให้ใช้ tool-result middleware แทน

OpenClaw จะไม่ถอดหรือเปลี่ยนความหมายของพฤติกรรม Plugin ที่มีเอกสารรองรับใน
การเปลี่ยนแปลงเดียวกันกับที่มีการเพิ่มสิ่งทดแทน การเปลี่ยนสัญญาแบบ breaking ต้อง
ผ่าน compatibility adapter, diagnostics, เอกสาร และช่วง deprecation ก่อน
สิ่งนี้ใช้กับ SDK imports, manifest fields, setup APIs, hooks และ
พฤติกรรมการลงทะเบียนของ runtime

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกถอดออกใน future major release
  Plugins ที่ยัง import จากพื้นผิวเหล่านี้จะใช้งานไม่ได้เมื่อถึงเวลานั้น
  Pi-only embedded extension factory registrations โหลดไม่ได้แล้วในตอนนี้
</Warning>

## เหตุใดจึงเปลี่ยน

แนวทางเดิมก่อให้เกิดปัญหา:

- **เริ่มต้นช้า** — การ import helper ตัวเดียวจะโหลดโมดูลที่ไม่เกี่ยวข้องอีกหลายสิบตัว
- **circular dependencies** — การ re-export แบบกว้างทำให้สร้าง import cycles ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** — ไม่มีวิธีบอกได้ว่า exports ใดเสถียรกับ exports ใดเป็นภายใน

Plugin SDK แบบสมัยใหม่แก้ปัญหานี้: แต่ละ import path (`openclaw/plugin-sdk/\<subpath\>`)
เป็นโมดูลขนาดเล็กแบบแยกตัว มีวัตถุประสงค์ชัดเจน และมีสัญญาที่มีเอกสารรองรับ

legacy provider convenience seams สำหรับ bundled channels ก็ถูกนำออกไปแล้วเช่นกัน Imports
เช่น `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
channel-branded helper seams และ
`openclaw/plugin-sdk/telegram-core` เป็นทางลัดส่วนตัวภายใน mono-repo ไม่ใช่
สัญญา Plugin ที่เสถียร ให้ใช้ generic SDK subpaths แบบแคบแทน ภายใน bundled plugin workspace ให้เก็บ provider-owned helpers ไว้ใน
`api.ts` หรือ `runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง bundled provider ปัจจุบัน:

- Anthropic เก็บ Claude-specific stream helpers ไว้ใน seam `api.ts` /
  `contract-api.ts` ของตัวเอง
- OpenAI เก็บ provider builders, default-model helpers และ realtime provider
  builders ไว้ใน `api.ts` ของตัวเอง
- OpenRouter เก็บ provider builder และ onboarding/config helpers ไว้ใน
  `api.ts` ของตัวเอง

## นโยบายความเข้ากันได้

สำหรับ external plugins งานด้านความเข้ากันได้จะเป็นไปตามลำดับนี้:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเดิมไว้โดยเชื่อมผ่าน compatibility adapter
3. ปล่อย diagnostic หรือคำเตือนที่ระบุ path เดิมและสิ่งทดแทน
4. ครอบคลุมทั้งสองเส้นทางใน tests
5. บันทึก deprecation และเส้นทางการย้ายไว้ในเอกสาร
6. ถอดออกหลังจากช่วงย้ายที่ประกาศไว้แล้วเท่านั้น ซึ่งโดยทั่วไปคือใน major release

หาก manifest field ยังคงยอมรับอยู่ ผู้เขียน Plugin ก็ยังสามารถใช้มันต่อไปได้จนกว่า
เอกสารและ diagnostics จะระบุเป็นอย่างอื่น โค้ดใหม่ควรใช้สิ่งทดแทนที่มีเอกสารรองรับ
แต่ plugins เดิมไม่ควรพังระหว่าง minor releases ปกติ

## วิธีการย้าย

<Steps>
  <Step title="ย้าย Pi tool-result extensions ไปเป็น middleware">
    Bundled plugins ต้องแทนที่
    ตัวจัดการ `api.registerEmbeddedExtensionFactory(...)` สำหรับ tool-result ที่เป็น Pi-only ด้วย
    middleware ที่เป็นกลางต่อ runtime

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    อัปเดต plugin manifest ไปพร้อมกัน:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    External plugins ไม่สามารถลงทะเบียน tool-result middleware ได้ เพราะมันสามารถ
    เขียนเอาต์พุตของ tool ที่มีความเชื่อถือสูงใหม่ก่อนที่ model จะเห็น

  </Step>

  <Step title="ย้าย approval-native handlers ไปใช้ capability facts">
    approval-capable channel plugins ตอนนี้เปิดเผยพฤติกรรม native approval ผ่าน
    `approvalCapability.nativeRuntime` ร่วมกับ shared runtime-context registry

    การเปลี่ยนแปลงสำคัญ:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery ที่เกี่ยวกับ approval ออกจากการเชื่อมต่อแบบเดิม `plugin.auth` /
      `plugin.approvals` ไปไว้ที่ `approvalCapability`
    - `ChannelPlugin.approvals` ถูกถอดออกจาก public channel-plugin
      contract แล้ว; ให้ย้ายฟิลด์ delivery/native/render ไปไว้ที่ `approvalCapability`
    - `plugin.auth` ยังคงใช้สำหรับโฟลว์ login/logout ของ channel เท่านั้น; approval auth
      hooks ที่นั่นจะไม่ถูกอ่านโดย core อีกต่อไป
    - ลงทะเบียน channel-owned runtime objects เช่น clients, tokens หรือ Bolt
      apps ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่ง plugin-owned reroute notices จาก native approval handlers;
      ตอนนี้ core เป็นเจ้าของ notices แบบ routed-elsewhere จากผลลัพธ์การส่งจริง
    - เมื่อส่ง `channelRuntime` เข้าไปใน `createChannelManager(...)` ให้ระบุ
      พื้นผิว `createPluginRuntime().channel` ที่สมบูรณ์จริง Partial stubs จะถูกปฏิเสธ

    ดูรูปแบบ approval capability ปัจจุบันได้ที่ `/plugins/sdk-channel-plugins`

  </Step>

  <Step title="ตรวจสอบพฤติกรรม Windows wrapper fallback">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn`, Windows
    `.cmd`/`.bat` wrappers ที่ resolve ไม่ได้จะล้มเหลวแบบ fail-closed เว้นแต่คุณจะส่ง
    `allowShellFallback: true` อย่างชัดเจน

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

    หาก caller ของคุณไม่ได้ตั้งใจพึ่งพา shell fallback อย่าตั้ง
    `allowShellFallback` และให้จัดการข้อผิดพลาดที่ถูกโยนขึ้นมาแทน

  </Step>

  <Step title="ค้นหา imports ที่เลิกใช้แล้ว">
    ค้นหาใน Plugin ของคุณสำหรับ imports จากพื้นผิวที่เลิกใช้แล้วทั้งสองแบบ:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="แทนที่ด้วย imports แบบเฉพาะทาง">
    export แต่ละตัวจากพื้นผิวเก่าจะจับคู่กับ modern import path แบบเฉพาะ:

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

    สำหรับ host-side helpers ให้ใช้ injected plugin runtime แทนการ import
    โดยตรง:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    รูปแบบเดียวกันนี้ใช้กับ legacy bridge helpers ตัวอื่นด้วย:

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

  <Step title="build และทดสอบ">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## เอกสารอ้างอิง import path

  <Accordion title="ตาราง import path ที่ใช้บ่อย">
  | Import path | วัตถุประสงค์ | exports หลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วย entry ของ Plugin แบบ canonical | `definePluginEntry` |
  | `plugin-sdk/core` | umbrella re-export แบบเดิมสำหรับคำจำกัดความ/ตัวสร้าง channel entry | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | การ export config schema ระดับราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วย entry สำหรับ provider เดียว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | คำจำกัดความและตัวสร้าง channel entry แบบเฉพาะทาง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | ตัวช่วย setup wizard ที่ใช้ร่วมกัน | พรอมป์ต allowlist, ตัวสร้างสถานะ setup |
  | `plugin-sdk/setup-runtime` | ตัวช่วยรันไทม์ระหว่าง setup | ตัวปรับ setup patch ที่ import ได้อย่างปลอดภัย, ตัวช่วย lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | ตัวช่วย setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | ตัวช่วย tooling สำหรับ setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/config/action-gate |
  | `plugin-sdk/account-id` | ตัวช่วย account-id | `DEFAULT_ACCOUNT_ID`, การ normalize account-id |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหา account | ตัวช่วยค้นหา account + fallback ค่าเริ่มต้น |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบแคบ | ตัวช่วยรายการบัญชี/account-action |
  | `plugin-sdk/channel-setup` | ตัวปรับ setup wizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, พร้อม `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับ DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเชื่อมต่อ reply prefix + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | โรงงานตัวปรับ config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้าง config schema | primitive ของ shared channel config schema; การ export schema แบบตั้งชื่อตาม bundled-channel เป็นเพียงความเข้ากันได้แบบเดิมเท่านั้น |
  | `plugin-sdk/telegram-command-config` | ตัวช่วย config คำสั่ง Telegram | การ normalize ชื่อคำสั่ง, การตัดคำอธิบาย, การตรวจสอบค่าซ้ำ/ชนกัน |
  | `plugin-sdk/channel-policy` | การ resolve นโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | ตัวช่วยวงจรชีวิตสำหรับสถานะบัญชีและ draft stream | `createAccountStatusSink`, ตัวช่วยสรุปผล draft preview |
  | `plugin-sdk/inbound-envelope` | ตัวช่วย inbound envelope | ตัวช่วยสร้าง route + envelope ที่ใช้ร่วมกัน |
  | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วย inbound reply | ตัวช่วยบันทึกและ dispatch ที่ใช้ร่วมกัน |
  | `plugin-sdk/messaging-targets` | การแยกวิเคราะห์ messaging target | ตัวช่วยแยกวิเคราะห์/จับคู่ target |
  | `plugin-sdk/outbound-media` | ตัวช่วย outbound media | การโหลด outbound media ที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-runtime` | ตัวช่วย outbound runtime | ตัวช่วยการส่งขาออก, identity/send delegate, session, formatting และการวางแผน payload |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วย thread-binding | ตัวช่วยวงจรชีวิตและ adapter ของ thread-binding |
  | `plugin-sdk/agent-media-payload` | ตัวช่วย media payload แบบเดิม | ตัวสร้าง agent media payload สำหรับโครงสร้างฟิลด์แบบเดิม |
  | `plugin-sdk/channel-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว | utility ของ channel runtime แบบเดิมเท่านั้น |
  | `plugin-sdk/channel-send-result` | ชนิดของ send result | ชนิดผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | ที่เก็บ Plugin แบบคงทน | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วย runtime แบบกว้าง | ตัวช่วย runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | ตัวช่วย runtime env แบบแคบ | ตัวช่วย logger/runtime env, timeout, retry และ backoff |
  | `plugin-sdk/plugin-runtime` | ตัวช่วย plugin runtime ที่ใช้ร่วมกัน | ตัวช่วย plugin commands/hooks/http/interactive |
  | `plugin-sdk/hook-runtime` | ตัวช่วย hook pipeline | ตัวช่วย pipeline ของ webhook/internal hook ที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วย lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วย process | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วย CLI runtime | ตัวช่วยจัดรูปแบบคำสั่ง, waits, เวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | ตัวช่วย Gateway client และ channel-status patch |
  | `plugin-sdk/config-runtime` | ตัวช่วย Config | ตัวช่วยโหลด/เขียน config |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram แบบ fallback ที่เสถียร เมื่อพื้นผิวสัญญา Telegram แบบ bundled ไม่พร้อมใช้งาน |
  | `plugin-sdk/approval-runtime` | ตัวช่วย approval prompt | payload การอนุมัติ exec/plugin, ตัวช่วย approval capability/profile, native approval routing/runtime และการจัดรูป path สำหรับแสดงผลการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วย approval auth | การ resolve approver, same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วย approval client | ตัวช่วย profile/filter สำหรับ native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วย approval delivery | native approval capability/delivery adapters |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย approval gateway | ตัวช่วย shared approval gateway-resolution |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วย approval adapter | ตัวช่วยโหลด native approval adapter แบบ lightweight สำหรับ hot channel entrypoints |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วย approval handler | ตัวช่วย approval handler runtime ที่กว้างกว่า; ควรใช้ seams แบบ adapter/gateway ที่แคบกว่านี้เมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วย approval target | ตัวช่วย native approval target/account binding |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วย approval reply | ตัวช่วย payload การตอบกลับการอนุมัติ exec/plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วย channel runtime-context | ตัวช่วย register/get/watch สำหรับ generic channel runtime-context |
  | `plugin-sdk/security-runtime` | ตัวช่วย Security | ตัวช่วย trust, DM gating, external-content และ secret-collection ที่ใช้ร่วมกัน |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วย host allowlist และนโยบาย private-network |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วย SSRF runtime | ตัวช่วย pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/collection-runtime` | ตัวช่วย bounded cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วย diagnostic gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วย error graph |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย wrapped fetch/proxy | `resolveFetch`, ตัวช่วย proxy |
  | `plugin-sdk/host-runtime` | ตัวช่วย normalize โฮสต์ | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วย Retry | `RetryConfig`, `retryAsync`, ตัวรันนโยบาย |
  | `plugin-sdk/allow-from` | การจัดรูปแบบ allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | การแมปอินพุต allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | การควบคุมคำสั่งและตัวช่วยพื้นผิวคำสั่ง | `resolveControlCommandGate`, ตัวช่วยการอนุญาตผู้ส่ง, ตัวช่วย command registry รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก |
  | `plugin-sdk/command-status` | ตัวเรนเดอร์สถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์ secret input | ตัวช่วย secret input |
  | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ Webhook | utility ของ webhook target |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วยป้องกัน body ของ Webhook | ตัวช่วยอ่าน/จำกัด request body |
  | `plugin-sdk/reply-runtime` | shared reply runtime | inbound dispatch, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย reply dispatch แบบแคบ | ตัวช่วย finalize, provider dispatch และ conversation-label |
  | `plugin-sdk/reply-history` | ตัวช่วย reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reply reference | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วย reply chunk | ตัวช่วยแบ่งข้อความ/markdown เป็น chunk |
  | `plugin-sdk/session-store-runtime` | ตัวช่วย session store | ตัวช่วย path ของ store + updated-at |
  | `plugin-sdk/state-paths` | ตัวช่วย state path | ตัวช่วยไดเรกทอรี state และ OAuth |
  | `plugin-sdk/routing` | ตัวช่วย routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วย normalize session-key |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะ channel | ตัวสร้างสรุปสถานะ channel/account, ค่าเริ่มต้นของ runtime-state, ตัวช่วยข้อมูลเมตาของ issue |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วย string normalization | ตัวช่วย normalize slug/string |
  | `plugin-sdk/request-url` | ตัวช่วย request URL | ดึง string URL จากอินพุตลักษณะ request |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบมีเวลา | ตัวรันคำสั่งแบบมีเวลาพร้อม stdout/stderr ที่ normalize แล้ว |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับ tool/CLI |
  | `plugin-sdk/tool-payload` | การดึง tool payload | ดึง payload ที่ normalize แล้วจาก tool result objects |
  | `plugin-sdk/tool-send` | การดึง tool send | ดึงฟิลด์ send target แบบ canonical จาก tool args |
  | `plugin-sdk/temp-path` | ตัวช่วย temp path | ตัวช่วย shared temp-download path |
  | `plugin-sdk/logging-core` | ตัวช่วย Logging | ตัวช่วย subsystem logger และ redaction |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วย markdown-table | ตัวช่วยโหมดตาราง markdown |
  | `plugin-sdk/reply-payload` | ชนิดของ message reply | ชนิดของ reply payload |
  | `plugin-sdk/provider-setup` | ตัวช่วย curated local/self-hosted provider setup | ตัวช่วยการค้นหา/กำหนดค่า self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วย focused OpenAI-compatible self-hosted provider setup | ตัวช่วยการค้นหา/กำหนดค่า self-hosted provider แบบเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วย provider runtime auth | ตัวช่วย resolve API key ของ runtime |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วย setup API key ของ provider | ตัวช่วย onboarding/profile-write สำหรับ API key |
  | `plugin-sdk/provider-auth-result` | ตัวช่วย provider auth-result | ตัวสร้าง OAuth auth-result มาตรฐาน |
  | `plugin-sdk/provider-auth-login` | ตัวช่วย interactive login ของ provider | ตัวช่วย interactive login ที่ใช้ร่วมกัน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยเลือก provider | การเลือก provider แบบ configured-or-auto และการ merge raw provider config |
  | `plugin-sdk/provider-env-vars` | ตัวช่วย env-var ของ provider | ตัวช่วยค้นหา auth env-var ของ provider |
  | `plugin-sdk/provider-model-shared` | ตัวช่วย model/replay ของ provider ที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง shared replay-policy, ตัวช่วย provider-endpoint และตัวช่วย normalize model-id |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วย catalog ของ provider ที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์ onboarding ของ provider | ตัวช่วย config สำหรับ onboarding |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของ provider | ตัวช่วยทั่วไปสำหรับความสามารถของ HTTP/เอ็นด์พอยต์ของ provider รวมถึงตัวช่วย multipart form สำหรับการถอดเสียงเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วย web-fetch ของ provider | ตัวช่วยลงทะเบียน/แคช web-fetch provider |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config web-search ของ provider | ตัวช่วย config/credential สำหรับ web-search แบบแคบ สำหรับ providers ที่ไม่ต้องใช้การเชื่อมต่อ plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา web-search ของ provider | ตัวช่วยสัญญา config/credential สำหรับ web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่าน credential แบบกำหนดขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วย web-search ของ provider | ตัวช่วยลงทะเบียน/แคช/runtime ของ web-search provider |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของ tool/schema ของ provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้าง schema ของ Gemini + diagnostics และตัวช่วยความเข้ากันได้ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานของ provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และตัวช่วยการใช้งานของ provider อื่น ๆ |
  | `plugin-sdk/provider-stream` | ตัวช่วยห่อ provider stream | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดของ stream wrapper และตัวช่วย wrapper แบบใช้ร่วมกันสำหรับ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ของ provider | ตัวช่วย native provider transport เช่น guarded fetch, การแปลง transport message และ writable transport event streams |
  | `plugin-sdk/keyed-async-queue` | คิว async แบบมีลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วย fetch/transform/store ของสื่อ พร้อมตัวสร้าง media payload |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสร้างสื่อที่ใช้ร่วมกัน | ตัวช่วย failover ที่ใช้ร่วมกัน การเลือก candidate และข้อความ missing-model สำหรับการสร้างภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วย media-understanding | ชนิดของ media understanding provider พร้อม exports ของตัวช่วยรูปภาพ/เสียงฝั่ง provider |
  | `plugin-sdk/text-runtime` | ตัวช่วยข้อความที่ใช้ร่วมกัน | การตัดข้อความที่มองเห็นได้โดย assistant, ตัวช่วยเรนเดอร์/chunking/ตาราง markdown, ตัวช่วย redaction, ตัวช่วย directive-tag, utility ข้อความที่ปลอดภัย และตัวช่วยข้อความ/logging ที่เกี่ยวข้อง |
  | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งข้อความเป็น chunk | ตัวช่วย chunking ข้อความขาออก |
  | `plugin-sdk/speech` | ตัวช่วย Speech | ชนิดของ speech provider พร้อมตัวช่วย directive, registry และ validation ฝั่ง provider |
  | `plugin-sdk/speech-core` | speech core ที่ใช้ร่วมกัน | ชนิดของ speech provider, registry, directives, normalization |
  | `plugin-sdk/realtime-transcription` | ตัวช่วย realtime transcription | ชนิดของ provider, ตัวช่วย registry และตัวช่วย WebSocket session ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วย realtime voice | ชนิดของ provider, ตัวช่วย registry/resolution และตัวช่วย bridge session |
  | `plugin-sdk/image-generation-core` | image-generation core ที่ใช้ร่วมกัน | ชนิดของ image-generation, ตัวช่วย failover, auth และ registry |
  | `plugin-sdk/music-generation` | ตัวช่วย music-generation | ชนิดของ music-generation provider/request/result |
  | `plugin-sdk/music-generation-core` | music-generation core ที่ใช้ร่วมกัน | ชนิดของ music-generation, ตัวช่วย failover, การค้นหา provider และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | ตัวช่วย video-generation | ชนิดของ video-generation provider/request/result |
  | `plugin-sdk/video-generation-core` | video-generation core ที่ใช้ร่วมกัน | ชนิดของ video-generation, ตัวช่วย failover, การค้นหา provider และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | ตัวช่วย interactive reply | การ normalize/reduction ของ interactive reply payload |
  | `plugin-sdk/channel-config-primitives` | primitive ของ channel config | primitive ของ channel config-schema แบบแคบ |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยเขียน channel config | ตัวช่วยการอนุญาตการเขียน channel config |
  | `plugin-sdk/channel-plugin-common` | prelude ของ channel ที่ใช้ร่วมกัน | exports ของ shared channel plugin prelude |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะ channel | ตัวช่วย snapshot/summary ของสถานะ channel ที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วย allowlist config | ตัวช่วยแก้ไข/อ่าน allowlist config |
  | `plugin-sdk/group-access` | ตัวช่วย group access | ตัวช่วยตัดสินใจ group-access ที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm` | ตัวช่วย direct-DM | ตัวช่วย auth/guard ของ direct-DM ที่ใช้ร่วมกัน |
  | `plugin-sdk/extension-shared` | ตัวช่วย extension ที่ใช้ร่วมกัน | primitive ของ passive-channel/status และ ambient proxy helper |
  | `plugin-sdk/webhook-targets` | ตัวช่วย webhook target | ตัวช่วย registry ของ webhook target และ route-install |
  | `plugin-sdk/webhook-path` | ตัวช่วย webhook path | ตัวช่วย normalize webhook path |
  | `plugin-sdk/web-media` | ตัวช่วย web media ที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อแบบ remote/local |
  | `plugin-sdk/zod` | re-export ของ Zod | `zod` ที่ re-export สำหรับผู้ใช้ Plugin SDK |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่รวมมาให้ | พื้นผิวตัวช่วยสำหรับ memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | facade รันไทม์ของ memory engine | facade รันไทม์สำหรับ memory index/search |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | exports ของ memory host foundation engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | สัญญา embedding ของ memory, การเข้าถึง registry, local provider และตัวช่วยทั่วไปสำหรับ batch/remote; remote providers แบบ concrete อยู่ใน plugins เจ้าของของมัน |
  | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD engine | exports ของ memory host QMD engine |
  | `plugin-sdk/memory-core-host-engine-storage` | memory host storage engine | exports ของ memory host storage engine |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของ memory host | ตัวช่วย multimodal ของ memory host |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของ memory host | ตัวช่วย query ของ memory host |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของ memory host | ตัวช่วย secret ของ memory host |
  | `plugin-sdk/memory-core-host-events` | ตัวช่วย event journal ของ memory host | ตัวช่วย event journal ของ memory host |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของ memory host | ตัวช่วยสถานะของ memory host |
  | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI runtime | ตัวช่วย memory host CLI runtime |
  | `plugin-sdk/memory-core-host-runtime-core` | memory host core runtime | ตัวช่วย memory host core runtime |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/runtime ของ memory host | ตัวช่วยไฟล์/runtime ของ memory host |
  | `plugin-sdk/memory-host-core` | alias ของ memory host core runtime | alias ที่เป็นกลางต่อผู้ขายสำหรับตัวช่วย memory host core runtime |
  | `plugin-sdk/memory-host-events` | alias ของ memory host event journal | alias ที่เป็นกลางต่อผู้ขายสำหรับตัวช่วย memory host event journal |
  | `plugin-sdk/memory-host-files` | alias ของ memory host file/runtime | alias ที่เป็นกลางต่อผู้ขายสำหรับตัวช่วย memory host file/runtime |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed markdown | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ plugins ที่เกี่ยวเนื่องกับ memory |
  | `plugin-sdk/memory-host-search` | facade ของ Active Memory search | facade รันไทม์แบบ lazy ของ active-memory search-manager |
  | `plugin-sdk/memory-host-status` | alias ของสถานะ memory host | alias ที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยสถานะของ memory host |
  | `plugin-sdk/memory-lancedb` | ตัวช่วย memory-lancedb ที่รวมมาให้ | พื้นผิวตัวช่วยของ memory-lancedb |
  | `plugin-sdk/testing` | utility สำหรับการทดสอบ | ตัวช่วยทดสอบและ mocks |
</Accordion>

ตารางนี้ตั้งใจให้เป็นชุดย่อยการย้ายที่ใช้ร่วมกัน ไม่ใช่พื้นผิว
SDK ทั้งหมด รายการเต็มของจุดเริ่มต้นมากกว่า 200 รายการอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`

รายการนั้นยังคงรวมส่วนเชื่อมตัวช่วยของ bundled-plugin บางรายการ เช่น
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` และ `plugin-sdk/matrix*` รายการเหล่านี้ยังคงถูก export ไว้เพื่อ
การบำรุงรักษา bundled-plugin และความเข้ากันได้ย้อนหลัง แต่ตั้งใจ
ไม่รวมไว้ในตารางการย้ายที่ใช้ร่วมกัน และไม่ใช่เป้าหมายที่แนะนำสำหรับ
โค้ด Plugin ใหม่

กฎเดียวกันนี้ใช้กับตระกูลตัวช่วย bundled อื่น ๆ เช่น:

- ตัวช่วยรองรับเบราว์เซอร์: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- พื้นผิวตัวช่วย/Plugin แบบ bundled เช่น `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` และ `plugin-sdk/voice-call`

ขณะนี้ `plugin-sdk/github-copilot-token` เปิดเผยพื้นผิว
ตัวช่วยโทเค็นแบบแคบ ได้แก่ `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` และ `resolveCopilotApiToken`

ใช้ import ที่แคบที่สุดที่ตรงกับงาน หากคุณหา export ไม่พบ
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือถามใน Discord

## การเลิกใช้งานที่กำลังมีผล

การเลิกใช้งานแบบแคบที่ใช้กับ plugin SDK, สัญญา provider,
พื้นผิวรันไทม์ และ manifest แต่ละรายการยังคงใช้งานได้ในปัจจุบัน
แต่จะถูกนำออกในรุ่นหลักถัดไป รายการใต้แต่ละหัวข้อจะจับคู่ API เดิม
กับตัวแทนมาตรฐานที่ใช้แทน

<AccordionGroup>
  <Accordion title="ตัวสร้างข้อความช่วยเหลือ command-auth → command-status">
    **เดิม (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: ลายเซ็นเหมือนเดิม,
    export เหมือนเดิม — เพียงแค่ import จาก subpath ที่แคบกว่า `command-auth`
    re-export สิ่งเหล่านี้เป็น compat stubs

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="ตัวช่วยการควบคุม Mention → resolveInboundMentionDecision">
    **เดิม**: `resolveInboundMentionRequirement({ facts, policy })` และ
    `shouldDropInboundForMention(...)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` — คืนค่า
    decision object เดียวแทนการเรียกแยกสองครั้ง

    Plugin ช่องทาง downstream (Slack, Discord, Matrix, MS Teams) ได้
    เปลี่ยนมาใช้แล้ว

  </Accordion>

  <Accordion title="shim รันไทม์ช่องทางและตัวช่วย channel actions">
    `openclaw/plugin-sdk/channel-runtime` เป็น compatibility shim สำหรับ
    Plugin ช่องทางรุ่นเก่า อย่า import จากโค้ดใหม่; ให้ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับลงทะเบียนออบเจ็กต์รันไทม์

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions` ถูก
    เลิกใช้งานพร้อมกับ export ช่องทางแบบ "actions" ดิบ เปิดเผยความสามารถ
    ผ่านพื้นผิว `presentation` เชิงความหมายแทน — Plugin ช่องทาง
    ประกาศสิ่งที่เรนเดอร์ได้ (cards, buttons, selects) แทนการระบุ
    ชื่อ action ดิบที่ยอมรับ

  </Accordion>

  <Accordion title="ตัวช่วย tool() ของ provider การค้นหาเว็บ → createTool() บน Plugin">
    **เดิม**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`

    **ใหม่**: ติดตั้ง `createTool(...)` โดยตรงบน provider plugin
    OpenClaw ไม่จำเป็นต้องใช้ตัวช่วย SDK เพื่อลงทะเบียนตัวห่อเครื่องมืออีกต่อไป

  </Accordion>

  <Accordion title="ซองข้อความช่องทางแบบข้อความล้วน → BodyForAgent">
    **เดิม**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) เพื่อสร้างซองพรอมป์ต์
    แบบข้อความล้วนแบน ๆ จากข้อความช่องทางขาเข้า

    **ใหม่**: `BodyForAgent` พร้อมบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
    Plugin ช่องทางแนบเมทาดาทาการกำหนดเส้นทาง (thread, topic, reply-to, reactions) เป็น
    ฟิลด์แบบมีชนิดแทนการนำมาต่อกันเป็นสตริงพรอมป์ต์
    ตัวช่วย `formatAgentEnvelope(...)` ยังคงรองรับสำหรับซองข้อความ
    แบบสังเคราะห์ที่หันหน้าไปทาง assistant แต่ซองข้อความล้วนขาเข้า
    กำลังจะถูกเลิกใช้

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received` และ
    channel plugin แบบกำหนดเองใด ๆ ที่ post-process ข้อความ `channelEnvelope`

  </Accordion>

  <Accordion title="ชนิดการค้นหา provider → ชนิดแค็ตตาล็อก provider">
    type alias สำหรับการค้นหาทั้งสี่รายการตอนนี้เป็นเพียงตัวห่อบาง ๆ ของ
    ชนิดยุคแค็ตตาล็อก:

    | เดิม                      | ชนิดใหม่                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึง `ProviderCapabilities` แบบ static bag รุ่นเก่า — provider plugin
    ควรแนบข้อเท็จจริงด้านความสามารถผ่านสัญญารันไทม์ของ provider
    แทนออบเจ็กต์แบบ static

  </Accordion>

  <Accordion title="ฮุกนโยบาย Thinking → resolveThinkingProfile">
    **เดิม** (สามฮุกแยกกันบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` และ
    `resolveDefaultThinkingLevel(ctx)`

    **ใหม่**: `resolveThinkingProfile(ctx)` เพียงรายการเดียว ซึ่งคืนค่า
    `ProviderThinkingProfile` ที่มี `id` มาตรฐาน, `label` แบบไม่บังคับ และ
    รายการระดับที่จัดลำดับแล้ว OpenClaw จะลดระดับค่าที่เก็บไว้ซึ่งล้าสมัย
    ตามอันดับของโปรไฟล์โดยอัตโนมัติ

    ติดตั้งฮุกเดียวแทนสามฮุก ฮุกแบบเดิมยังคงใช้งานได้ในช่วง
    การเลิกใช้งาน แต่จะไม่ถูกประกอบรวมกับผลลัพธ์ของโปรไฟล์

  </Accordion>

  <Accordion title="fallback ของ provider External OAuth → contracts.externalAuthProviders">
    **เดิม**: ติดตั้ง `resolveExternalOAuthProfiles(...)` โดยไม่
    ประกาศ provider ใน plugin manifest

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน plugin manifest
    **และ** ติดตั้ง `resolveExternalAuthProfiles(...)` เส้นทาง "auth
    fallback" แบบเดิมจะปล่อยคำเตือนในรันไทม์และจะถูกนำออก

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="การค้นหา env var ของ provider → setup.providers[].envVars">
    **ฟิลด์ manifest เดิม**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`

    **ใหม่**: สะท้อนการค้นหา env var เดียวกันไปยัง `setup.providers[].envVars`
    บน manifest วิธีนี้รวมเมทาดาทา env ของ setup/status ไว้ในที่เดียว
    และหลีกเลี่ยงการบูตรันไทม์ของ Plugin เพียงเพื่อตอบคำถาม
    การค้นหา env var

    `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility adapter
    จนกว่าช่วงการเลิกใช้งานจะสิ้นสุด

  </Accordion>

  <Accordion title="การลงทะเบียน memory plugin → registerMemoryCapability">
    **เดิม**: เรียกแยกกันสามครั้ง —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`

    **ใหม่**: เรียกเพียงครั้งเดียวบน memory-state API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`

    สล็อตเดิมเหมือนเดิม แต่เหลือการลงทะเบียนครั้งเดียว ตัวช่วย memory
    แบบเพิ่มเติม (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="ชนิดข้อความเซสชันของ subagent ถูกเปลี่ยนชื่อ">
    ยังมี type alias แบบเดิมสองรายการที่ export จาก `src/plugins/runtime/types.ts`:

    | เดิม                        | ใหม่                            |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    เมธอดรันไทม์ `readSession` ถูกเลิกใช้งานและแทนที่ด้วย
    `getSessionMessages` ลายเซ็นเหมือนเดิม; เมธอดเดิมจะเรียกผ่านไปยัง
    เมธอดใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **เดิม**: `runtime.tasks.flow` (เอกพจน์) คืนค่า accessor ของ TaskFlow แบบสด

    **ใหม่**: `runtime.tasks.flows` (พหูพจน์) คืนค่าการเข้าถึง TaskFlow แบบ DTO
    ซึ่งปลอดภัยต่อการ import และไม่จำเป็นต้องโหลด task runtime
    ทั้งหมด

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="factory ของ extension แบบฝังตัว → middleware ผลลัพธ์เครื่องมือของ agent">
    อธิบายไว้ใน "วิธีย้าย → ย้าย Pi tool-result extensions ไปเป็น
    middleware" ด้านบน รวมไว้ที่นี่เพื่อความครบถ้วน: เส้นทาง
    `api.registerEmbeddedExtensionFactory(...)` แบบ Pi-only ที่ถูกนำออก
    ถูกแทนที่ด้วย `api.registerAgentToolResultMiddleware(...)` พร้อม
    รายการรันไทม์แบบชัดเจนใน `contracts.agentToolResultMiddleware`
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` ที่ re-export จาก `openclaw/plugin-sdk` ตอนนี้เป็น
    alias บรรทัดเดียวสำหรับ `OpenClawConfig` ให้ใช้ชื่อมาตรฐานแทน

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกใช้งานระดับ extension (ภายใน channel/provider plugin แบบ bundled ภายใต้
`extensions/`) ถูกติดตามไว้ภายใน barrel `api.ts` และ `runtime-api.ts`
ของแต่ละตัวเอง สิ่งเหล่านี้ไม่กระทบต่อสัญญาของ third-party plugin และไม่ได้แสดง
ไว้ที่นี่ หากคุณใช้ local barrel ของ bundled plugin โดยตรง
ให้อ่านคอมเมนต์การเลิกใช้งานใน barrel นั้นก่อนอัปเกรด
</Note>

## กำหนดเวลาการนำออก

| เมื่อใด                  | สิ่งที่เกิดขึ้น                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**               | พื้นผิวที่เลิกใช้งานจะปล่อยคำเตือนในรันไทม์                              |
| **รุ่นหลักถัดไป**        | พื้นผิวที่เลิกใช้งานจะถูกนำออก; Plugin ที่ยังใช้อยู่จะล้มเหลว              |

core plugin ทั้งหมดได้ย้ายเสร็จแล้ว External plugin ควรย้าย
ก่อนรุ่นหลักถัดไป

## การระงับคำเตือนชั่วคราว

ตั้งค่าตัวแปรสภาพแวดล้อมเหล่านี้ระหว่างที่คุณกำลังย้าย:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นทางหนีชั่วคราว ไม่ใช่วิธีแก้ถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) — สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง subpath import แบบเต็ม
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้าง channel plugin
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง provider plugin
- [Plugin Internals](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรม
- [Plugin Manifest](/th/plugins/manifest) — ข้อมูลอ้างอิงสคีมา manifest
