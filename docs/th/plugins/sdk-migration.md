---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ `api.registerEmbeddedExtensionFactory` ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin เป็นสถาปัตยกรรม Plugin แบบสมัยใหม่
    - คุณดูแล Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากชั้นความเข้ากันได้แบบย้อนหลังรุ่นเก่าไปยัง Plugin SDK รุ่นใหม่
title: การย้ายไปใช้ Plugin SDK
x-i18n:
    generated_at: "2026-04-26T11:37:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ได้เปลี่ยนจากชั้นความเข้ากันได้แบบย้อนหลังที่ครอบคลุมกว้าง ไปเป็นสถาปัตยกรรม Plugin แบบสมัยใหม่ที่มี import แบบเจาะจงและมีเอกสารประกอบ หาก Plugin ของคุณถูกสร้างขึ้นก่อนสถาปัตยกรรมใหม่นี้ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยนแปลง

ระบบ Plugin แบบเก่าให้พื้นผิวแบบเปิดกว้างสองส่วนที่ทำให้ Plugin สามารถ import ทุกอย่างที่ต้องการได้จากจุดเข้าใช้งานเพียงจุดเดียว:

- **`openclaw/plugin-sdk/compat`** — import เดียวที่ re-export helper หลายสิบรายการ มีการเพิ่มเข้ามาเพื่อให้ Plugin แบบ hook รุ่นเก่ายังคงทำงานได้ในระหว่างที่กำลังสร้างสถาปัตยกรรม Plugin ใหม่
- **`openclaw/extension-api`** — สะพานเชื่อมที่ให้ Plugin เข้าถึง helper ฝั่ง host ได้โดยตรง เช่น embedded agent runner
- **`api.registerEmbeddedExtensionFactory(...)`** — hook สำหรับ bundled extension แบบ Pi-only ที่ถูกนำออกแล้ว ซึ่งสามารถสังเกตเหตุการณ์จาก embedded runner เช่น `tool_result`

ตอนนี้พื้นผิว import แบบกว้างเหล่านี้ถูกทำเครื่องหมายว่า **deprecated** แล้ว โดยยังคงทำงานได้ในขณะรันไทม์ แต่ Plugin ใหม่ต้องไม่ใช้ และ Plugin ที่มีอยู่ควรย้ายระบบก่อนที่ major release ถัดไปจะนำออก API สำหรับลงทะเบียน embedded extension factory แบบ Pi-only ถูกนำออกแล้ว ให้ใช้ middleware ของผลลัพธ์เครื่องมือแทน

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารรองรับใหม่ใน change เดียวกับที่เพิ่มตัวทดแทน การเปลี่ยนแปลงสัญญาที่ทำให้ใช้งานร่วมกันไม่ได้จะต้องผ่าน compatibility adapter, diagnostics, docs และช่วงเวลา deprecation ก่อนเสมอ หลักการนี้ใช้กับ SDK imports, manifest fields, setup APIs, hooks และพฤติกรรมการลงทะเบียนระหว่างรันไทม์

<Warning>
  ชั้นความเข้ากันได้แบบย้อนหลังจะถูกนำออกใน major release ในอนาคต
  Plugin ที่ยัง import จากพื้นผิวเหล่านี้จะใช้งานไม่ได้เมื่อถึงเวลานั้น
  การลงทะเบียน embedded extension factory แบบ Pi-only ไม่ถูกโหลดอีกต่อไปแล้ว
</Warning>

## เหตุใดจึงมีการเปลี่ยนแปลงนี้

แนวทางแบบเก่าก่อให้เกิดปัญหา:

- **เริ่มต้นทำงานช้า** — การ import helper เพียงหนึ่งตัวจะโหลดโมดูลที่ไม่เกี่ยวข้องอีกหลายสิบตัว
- **การอ้างอิงแบบวนลูป** — การ re-export แบบกว้างทำให้เกิด import cycles ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** — ไม่มีทางแยกได้ว่า export ใดมีความเสถียร และ export ใดเป็นภายใน

SDK ของ Plugin แบบสมัยใหม่แก้ปัญหานี้: แต่ละพาธ import (`openclaw/plugin-sdk/\<subpath\>`) เป็นโมดูลขนาดเล็กที่แยกเป็นอิสระ มีวัตถุประสงค์ชัดเจน และมีสัญญาที่มีเอกสารรองรับ

ช่องทาง convenience seams ของ provider แบบ legacy สำหรับ channels ที่ bundled มาได้ถูกนำออกเช่นกัน import อย่างเช่น `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, helper seams ที่ใช้แบรนด์ของ channel และ `openclaw/plugin-sdk/telegram-core` เป็นทางลัดภายใน mono-repo แบบ private ไม่ใช่สัญญา Plugin ที่เสถียร ให้ใช้ SDK subpaths แบบ generic ที่แคบและเฉพาะเจาะจงแทน ภายใน bundled plugin workspace ให้เก็บ helper ที่ provider เป็นเจ้าของไว้ใน `api.ts` หรือ `runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง provider ที่ bundled อยู่ในปัจจุบัน:

- Anthropic เก็บ helper สำหรับสตรีมที่เฉพาะกับ Claude ไว้ใน seam `api.ts` / `contract-api.ts` ของตนเอง
- OpenAI เก็บ provider builders, helper ของ default-model และ realtime provider builders ไว้ใน `api.ts` ของตนเอง
- OpenRouter เก็บ provider builder และ helper สำหรับ onboarding/config ไว้ใน `api.ts` ของตนเอง

## นโยบายความเข้ากันได้

สำหรับ Plugin ภายนอก งานด้านความเข้ากันได้จะเป็นไปตามลำดับดังนี้:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเก่าไว้โดยเชื่อมผ่าน compatibility adapter
3. แสดง diagnostic หรือ warning ที่ระบุพาธเก่าและตัวทดแทน
4. ครอบคลุมทั้งสองพาธด้วยการทดสอบ
5. จัดทำเอกสาร deprecation และเส้นทางการย้ายระบบ
6. นำออกหลังจากช่วงเวลาการย้ายระบบที่ประกาศไว้แล้วเท่านั้น โดยปกติจะเป็นใน major release

หากยังยอมรับ manifest field ใดอยู่ ผู้เขียน Plugin ก็ยังสามารถใช้ต่อไปได้จนกว่า docs และ diagnostics จะระบุเป็นอย่างอื่น โค้ดใหม่ควรเลือกใช้ตัวทดแทนที่มีเอกสารรองรับ แต่ Plugin ที่มีอยู่ไม่ควรพังระหว่าง minor release ปกติ

## วิธีการย้ายระบบ

<Steps>
  <Step title="ย้ายส่วนขยายผลลัพธ์เครื่องมือของ Pi ไปเป็น middleware">
    Bundled plugins ต้องแทนที่ตัวจัดการผลลัพธ์เครื่องมือแบบ Pi-only ของ
    `api.registerEmbeddedExtensionFactory(...)`
    ด้วย middleware ที่ไม่ผูกกับ runtime ใด runtime หนึ่ง

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    อัปเดต manifest ของ Plugin พร้อมกันด้วย:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin ภายนอกไม่สามารถลงทะเบียน middleware ของผลลัพธ์เครื่องมือได้ เพราะมันสามารถเขียนผลลัพธ์เครื่องมือที่มีความไว้วางใจสูงใหม่ก่อนที่โมเดลจะมองเห็นได้

  </Step>

  <Step title="ย้ายตัวจัดการแบบ approval-native ไปเป็น capability facts">
    ตอนนี้ channel plugins ที่รองรับการอนุมัติจะแสดงพฤติกรรมการอนุมัติแบบ native ผ่าน
    `approvalCapability.nativeRuntime` ร่วมกับ shared runtime-context registry

    การเปลี่ยนแปลงสำคัญ:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery ที่เฉพาะกับการอนุมัติออกจากการเชื่อมต่อแบบ legacy ของ `plugin.auth` /
      `plugin.approvals` ไปไว้บน `approvalCapability`
    - `ChannelPlugin.approvals` ถูกนำออกจากสัญญา channel-plugin สาธารณะแล้ว
      ให้ย้ายฟิลด์ delivery/native/render ไปไว้บน `approvalCapability`
    - `plugin.auth` ยังคงมีไว้สำหรับ flow login/logout ของ channel เท่านั้น; core
      จะไม่อ่าน approval auth hooks ที่อยู่ตรงนั้นอีกต่อไป
    - ลงทะเบียนออบเจ็กต์ runtime ที่ channel เป็นเจ้าของ เช่น clients, tokens หรือ Bolt
      apps ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่ง reroute notices ที่ Plugin เป็นเจ้าของจาก native approval handlers;
      ตอนนี้ core เป็นเจ้าของ notices แบบ routed-elsewhere จากผลลัพธ์การส่งจริง
    - เมื่อส่ง `channelRuntime` ไปยัง `createChannelManager(...)` ให้จัดเตรียม
      พื้นผิว `createPluginRuntime().channel` ที่สมบูรณ์จริง การ stub เพียงบางส่วนจะถูกปฏิเสธ

    ดู `/plugins/sdk-channel-plugins` สำหรับเลย์เอาต์ capability การอนุมัติปัจจุบัน

  </Step>

  <Step title="ตรวจสอบพฤติกรรม fallback ของ Windows wrapper">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn`, Windows
    wrappers แบบ `.cmd`/`.bat` ที่ไม่สามารถ resolve ได้จะล้มเหลวแบบ fail closed เว้นแต่คุณจะส่ง
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

    หาก caller ของคุณไม่ได้ตั้งใจพึ่งพา shell fallback ก็ไม่ต้องตั้งค่า
    `allowShellFallback` และให้จัดการ error ที่ถูก throw แทน

  </Step>

  <Step title="ค้นหา imports ที่ deprecated">
    ค้นหาใน Plugin ของคุณสำหรับ imports จากพื้นผิวที่ deprecated อย่างใดอย่างหนึ่ง:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="แทนที่ด้วย imports แบบเจาะจง">
    แต่ละ export จากพื้นผิวเก่าจะจับคู่กับพาธ import แบบสมัยใหม่ที่เฉพาะเจาะจง:

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

    สำหรับ helper ฝั่ง host ให้ใช้ runtime ของ Plugin ที่ถูก inject แทนการ import
    โดยตรง:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    รูปแบบเดียวกันนี้ใช้กับ legacy bridge helpers อื่น ๆ ด้วย:

    | import เก่า | ตัวเทียบเท่าแบบสมัยใหม่ |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build และทดสอบ">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงพาธ import

  <Accordion title="Common import path table">
  | พาธ import | วัตถุประสงค์ | export หลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | helper ทางเข้าของ Plugin แบบ canonical | `definePluginEntry` |
  | `plugin-sdk/core` | umbrella re-export แบบ legacy สำหรับคำจำกัดความ/builders ของ channel entry | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export ของ schema การตั้งค่าระดับราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | helper ทางเข้าของ provider เดี่ยว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | คำจำกัดความและ builders ของ channel entry แบบเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | helper ของตัวช่วยตั้งค่าที่ใช้ร่วมกัน | prompts ของ allowlist, ตัวสร้างสถานะการตั้งค่า |
  | `plugin-sdk/setup-runtime` | helper runtime ในช่วงตั้งค่า | adapters สำหรับ patch การตั้งค่าที่ import-safe, helper ของ lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | helper ของ setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | helper เครื่องมือสำหรับการตั้งค่า | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | helper สำหรับหลายบัญชี | helper สำหรับรายการบัญชี/การตั้งค่า/action-gate |
  | `plugin-sdk/account-id` | helper สำหรับ account-id | `DEFAULT_ACCOUNT_ID`, การทำ normalization ของ account-id |
  | `plugin-sdk/account-resolution` | helper สำหรับค้นหาบัญชี | helper สำหรับค้นหาบัญชี + fallback ค่าเริ่มต้น |
  | `plugin-sdk/account-helpers` | helper บัญชีแบบเจาะจง | helper สำหรับรายการบัญชี/การดำเนินการกับบัญชี |
  | `plugin-sdk/channel-setup` | adapters ของตัวช่วยตั้งค่า | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับการจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเชื่อมต่อคำนำหน้าการตอบกลับ + การพิมพ์ | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | factories ของ config adapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | builders ของ config schema | primitive ของ schema การตั้งค่า channel แบบใช้ร่วมกัน; schema exports ที่ตั้งชื่อตาม bundled channel มีไว้เพื่อความเข้ากันได้แบบ legacy เท่านั้น |
  | `plugin-sdk/telegram-command-config` | helper การตั้งค่า command ของ Telegram | การทำ normalization ของชื่อคำสั่ง, การตัดแต่งคำอธิบาย, การตรวจสอบรายการซ้ำ/ความขัดแย้ง |
  | `plugin-sdk/channel-policy` | การตัดสินนโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | helper วงจรชีวิตของสถานะบัญชีและ draft stream | `createAccountStatusSink`, helper สำหรับ finalization ของ draft preview |
  | `plugin-sdk/inbound-envelope` | helper สำหรับ inbound envelope | helper สำหรับ route + envelope builder แบบใช้ร่วมกัน |
  | `plugin-sdk/inbound-reply-dispatch` | helper สำหรับ inbound reply | helper สำหรับ record-and-dispatch แบบใช้ร่วมกัน |
  | `plugin-sdk/messaging-targets` | การแยกวิเคราะห์เป้าหมายการส่งข้อความ | helper สำหรับแยกวิเคราะห์/จับคู่เป้าหมาย |
  | `plugin-sdk/outbound-media` | helper สำหรับ outbound media | การโหลด outbound media แบบใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | helper ของ dependency สำหรับ outbound send | การค้นหา `resolveOutboundSendDep` แบบ lightweight โดยไม่ import outbound runtime เต็มรูปแบบ |
  | `plugin-sdk/outbound-runtime` | helper สำหรับ outbound runtime | helper สำหรับ outbound delivery, identity/send delegate, session, formatting และการวางแผน payload |
  | `plugin-sdk/thread-bindings-runtime` | helper สำหรับ thread-binding | helper สำหรับวงจรชีวิตและ adapter ของ thread-binding |
  | `plugin-sdk/agent-media-payload` | helper payload ของ media แบบ legacy | agent media payload builder สำหรับเลย์เอาต์ฟิลด์แบบ legacy |
  | `plugin-sdk/channel-runtime` | compatibility shim ที่ deprecated | utility ของ channel runtime แบบ legacy เท่านั้น |
  | `plugin-sdk/channel-send-result` | types ของผลลัพธ์การส่ง | types ของผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | ที่เก็บข้อมูล Plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | helper runtime แบบกว้าง | helper สำหรับ runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | helper runtime env แบบเจาะจง | helper สำหรับ logger/runtime env, timeout, retry และ backoff |
  | `plugin-sdk/plugin-runtime` | helper runtime ของ Plugin แบบใช้ร่วมกัน | helper สำหรับคำสั่ง/hooks/http/interactive ของ Plugin |
  | `plugin-sdk/hook-runtime` | helper สำหรับ hook pipeline | helper สำหรับ pipeline ของ Webhook/internal hook แบบใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | helper สำหรับ lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | helper สำหรับ process | helper สำหรับ exec แบบใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | helper CLI runtime | helper สำหรับการจัดรูปแบบคำสั่ง, waits, version |
  | `plugin-sdk/gateway-runtime` | helper สำหรับ Gateway | helper สำหรับ Gateway client และ channel-status patch |
  | `plugin-sdk/config-runtime` | helper การตั้งค่า | helper สำหรับโหลด/เขียน config |
  | `plugin-sdk/telegram-command-config` | helper คำสั่งของ Telegram | helper ตรวจสอบคำสั่ง Telegram ที่ fallback-stable เมื่อไม่สามารถใช้พื้นผิวสัญญา Telegram แบบ bundled ได้ |
  | `plugin-sdk/approval-runtime` | helper prompt สำหรับการอนุมัติ | helper สำหรับ exec/plugin approval payload, approval capability/profile, native approval routing/runtime และการจัดรูปแบบเส้นทางแสดงผล structured approval |
  | `plugin-sdk/approval-auth-runtime` | helper auth สำหรับการอนุมัติ | การค้นหา approver, same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | helper client สำหรับการอนุมัติ | helper สำหรับโปรไฟล์/ตัวกรอง native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | helper delivery สำหรับการอนุมัติ | adapters สำหรับ native approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | helper Gateway สำหรับการอนุมัติ | helper สำหรับ approval gateway-resolution แบบใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | helper approval adapter | helper แบบ lightweight สำหรับโหลด native approval adapter สำหรับ hot channel entrypoints |
  | `plugin-sdk/approval-handler-runtime` | helper approval handler | helper runtime ของ approval handler ที่ครอบคลุมกว่า; ให้เลือกใช้ seams ของ adapter/gateway ที่แคบกว่านี้เมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | helper เป้าหมายการอนุมัติ | helper สำหรับ native approval target/account binding |
  | `plugin-sdk/approval-reply-runtime` | helper approval reply | helper สำหรับ exec/plugin approval reply payload |
  | `plugin-sdk/channel-runtime-context` | helper channel runtime-context | helper สำหรับ register/get/watch ของ generic channel runtime-context |
  | `plugin-sdk/security-runtime` | helper ด้านความปลอดภัย | helper แบบใช้ร่วมกันสำหรับ trust, DM gating, external-content และ secret-collection |
  | `plugin-sdk/ssrf-policy` | helper นโยบาย SSRF | helper สำหรับ host allowlist และนโยบายเครือข่ายส่วนตัว |
  | `plugin-sdk/ssrf-runtime` | helper SSRF runtime | Pinned-dispatcher, guarded fetch, helper นโยบาย SSRF |
  | `plugin-sdk/collection-runtime` | helper bounded cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | helper gating สำหรับ diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | helper จัดรูปแบบข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, helper สำหรับ error graph |
  | `plugin-sdk/fetch-runtime` | helper wrapped fetch/proxy | `resolveFetch`, helper สำหรับ proxy |
  | `plugin-sdk/host-runtime` | helper สำหรับ normalization ของ host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | helper สำหรับ retry | `RetryConfig`, `retryAsync`, policy runners |
  | `plugin-sdk/allow-from` | การจัดรูปแบบ allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | การแมปอินพุต allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | helper สำหรับ command gating และ command-surface | `resolveControlCommandGate`, helper สำหรับการอนุญาตผู้ส่ง, helper สำหรับ command registry รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบ dynamic |
  | `plugin-sdk/command-status` | renderers ของสถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์ secret input | helper สำหรับ secret input |
  | `plugin-sdk/webhook-ingress` | helper สำหรับคำขอ Webhook | utility สำหรับเป้าหมาย Webhook |
  | `plugin-sdk/webhook-request-guards` | helper สำหรับป้องกัน Webhook body | helper สำหรับการอ่าน/จำกัดขนาด request body |
  | `plugin-sdk/reply-runtime` | reply runtime แบบใช้ร่วมกัน | Inbound dispatch, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | helper สำหรับ reply dispatch แบบเจาะจง | Finalize, provider dispatch และ helper สำหรับ conversation-label |
  | `plugin-sdk/reply-history` | helper สำหรับ reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reply reference | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | helper สำหรับ reply chunk | helper สำหรับ text/markdown chunking |
  | `plugin-sdk/session-store-runtime` | helper session store | helper สำหรับ store path + updated-at |
  | `plugin-sdk/state-paths` | helper สำหรับ state path | helper สำหรับ state และไดเรกทอรี OAuth |
  | `plugin-sdk/routing` | helper สำหรับ routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper สำหรับการทำ normalization ของ session-key |
  | `plugin-sdk/status-helpers` | helper สำหรับสถานะ channel | builders สำหรับสรุปสถานะ channel/account, ค่าเริ่มต้นของ runtime-state, helper สำหรับ issue metadata |
  | `plugin-sdk/target-resolver-runtime` | helper target resolver | helper target resolver แบบใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | helper สำหรับ string normalization | helper สำหรับ slug/string normalization |
  | `plugin-sdk/request-url` | helper สำหรับ request URL | ดึง URL แบบสตริงจากอินพุตที่คล้าย request |
  | `plugin-sdk/run-command` | helper สำหรับคำสั่งที่มีเวลา | ตัวรันคำสั่งแบบมีเวลา พร้อม stdout/stderr ที่ทำ normalization แล้ว |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับ tool/CLI |
  | `plugin-sdk/tool-payload` | การดึง tool payload | ดึง payload ที่ทำ normalization แล้วจากออบเจ็กต์ผลลัพธ์ของ tool |
  | `plugin-sdk/tool-send` | การดึงข้อมูล tool send | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
  | `plugin-sdk/temp-path` | helper temp path | helper สำหรับ shared temp-download path |
  | `plugin-sdk/logging-core` | helper สำหรับ logging | helper สำหรับ subsystem logger และ redaction |
  | `plugin-sdk/markdown-table-runtime` | helper สำหรับ markdown-table | helper สำหรับโหมด markdown table |
  | `plugin-sdk/reply-payload` | types ของ message reply | types ของ reply payload |
  | `plugin-sdk/provider-setup` | helper ที่คัดสรรแล้วสำหรับการตั้งค่า provider แบบ local/self-hosted | helper สำหรับการค้นหา/การตั้งค่า self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | helper แบบเจาะจงสำหรับการตั้งค่า OpenAI-compatible self-hosted provider | helper เดียวกันสำหรับการค้นหา/การตั้งค่า self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | helper provider runtime auth | helper สำหรับค้นหา API key ระหว่างรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | helper สำหรับการตั้งค่า API key ของ provider | helper สำหรับ onboarding/profile-write ของ API key |
  | `plugin-sdk/provider-auth-result` | helper provider auth-result | standard OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | helper สำหรับ interactive login ของ provider | helper สำหรับ interactive login แบบใช้ร่วมกัน |
  | `plugin-sdk/provider-selection-runtime` | helper สำหรับการเลือก provider | การเลือก provider แบบ configured-or-auto และการรวม raw provider config |
  | `plugin-sdk/provider-env-vars` | helper สำหรับ env-var ของ provider | helper สำหรับค้นหา env-var ของ provider auth |
  | `plugin-sdk/provider-model-shared` | helper ที่ใช้ร่วมกันสำหรับโมเดล/การเล่นซ้ำของ provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, shared replay-policy builders, helper สำหรับ provider-endpoint และ helper สำหรับการทำ normalization ของ model-id |
  | `plugin-sdk/provider-catalog-shared` | helper ที่ใช้ร่วมกันสำหรับแคตตาล็อกของ provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | patches สำหรับ onboarding ของ provider | helper สำหรับการตั้งค่า onboarding |
  | `plugin-sdk/provider-http` | helper HTTP ของ provider | helper ทั่วไปสำหรับ HTTP/endpoint capability ของ provider รวมถึง helper สำหรับ multipart form ของ audio transcription |
  | `plugin-sdk/provider-web-fetch` | helper web-fetch ของ provider | helper สำหรับการลงทะเบียน/แคช provider แบบ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | helper การตั้งค่า web-search ของ provider | helper แบบเจาะจงสำหรับการตั้งค่า/credentials ของ web-search สำหรับ provider ที่ไม่ต้องใช้การเชื่อมต่อ plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | helper สัญญา web-search ของ provider | helper สัญญาแบบเจาะจงสำหรับการตั้งค่า/credentials ของ web-search เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และ setters/getters ของ credentials แบบมีขอบเขต |
  | `plugin-sdk/provider-web-search` | helper web-search ของ provider | helper สำหรับการลงทะเบียน/แคช/runtime ของ provider แบบ web-search |
  | `plugin-sdk/provider-tools` | helper compat ของ tool/schema ของ provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้าง schema ของ Gemini + diagnostics และ helper compat ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | helper การใช้งานของ provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และ helper การใช้งานของ provider อื่น ๆ |
  | `plugin-sdk/provider-stream` | helper wrapper ของสตรีม provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types ของ stream wrapper และ helper wrapper ที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | helper transport ของ provider | helper transport แบบ native ของ provider เช่น guarded fetch, transport message transforms และ writable transport event streams |
  | `plugin-sdk/keyed-async-queue` | async queue แบบมีลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | helper media แบบใช้ร่วมกัน | helper สำหรับ media fetch/transform/store รวมถึง media payload builders |
  | `plugin-sdk/media-generation-runtime` | helper สำหรับการสร้าง media แบบใช้ร่วมกัน | helper แบบใช้ร่วมกันสำหรับ failover, การเลือก candidate และข้อความเมื่อไม่มีโมเดลสำหรับการสร้างภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | helper สำหรับ media-understanding | types ของ provider สำหรับ media understanding รวมถึง provider-facing image/audio helper exports |
  | `plugin-sdk/text-runtime` | helper ข้อความแบบใช้ร่วมกัน | การตัดข้อความที่ผู้ช่วยมองเห็น, helper สำหรับ render/chunking/table ของ markdown, helper สำหรับ redaction, helper สำหรับ directive-tag, utility ของข้อความที่ปลอดภัย และ helper ด้านข้อความ/logging ที่เกี่ยวข้อง |
  | `plugin-sdk/text-chunking` | helper สำหรับ text chunking | helper สำหรับ outbound text chunking |
  | `plugin-sdk/speech` | helper สำหรับ speech | types ของ speech provider รวมถึง helper สำหรับ directive, registry และ validation ที่แสดงให้ provider ใช้ |
  | `plugin-sdk/speech-core` | speech core แบบใช้ร่วมกัน | types ของ speech provider, registry, directives, normalization |
  | `plugin-sdk/realtime-transcription` | helper สำหรับ realtime transcription | types ของ provider, helper สำหรับ registry และ helper สำหรับเซสชัน WebSocket แบบใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | helper สำหรับ realtime voice | types ของ provider, helper สำหรับ registry/resolution และ helper สำหรับ bridge session |
  | `plugin-sdk/image-generation-core` | image-generation core แบบใช้ร่วมกัน | helper สำหรับ types, failover, auth และ registry ของ image-generation |
  | `plugin-sdk/music-generation` | helper สำหรับ music-generation | types ของ provider/request/result สำหรับ music-generation |
  | `plugin-sdk/music-generation-core` | music-generation core แบบใช้ร่วมกัน | types ของ music-generation, helper สำหรับ failover, การค้นหา provider และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | helper สำหรับ video-generation | types ของ provider/request/result สำหรับ video-generation |
  | `plugin-sdk/video-generation-core` | video-generation core แบบใช้ร่วมกัน | types ของ video-generation, helper สำหรับ failover, การค้นหา provider และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | helper สำหรับ interactive reply | การทำ normalization/reduction ของ interactive reply payload |
  | `plugin-sdk/channel-config-primitives` | primitive ของการตั้งค่า channel | primitive แบบเจาะจงของ channel config-schema |
  | `plugin-sdk/channel-config-writes` | helper สำหรับเขียนการตั้งค่า channel | helper สำหรับการอนุญาตในการเขียนการตั้งค่า channel |
  | `plugin-sdk/channel-plugin-common` | prelude ของ channel แบบใช้ร่วมกัน | shared channel plugin prelude exports |
  | `plugin-sdk/channel-status` | helper สำหรับสถานะ channel | helper แบบใช้ร่วมกันสำหรับ snapshot/summary ของสถานะ channel |
  | `plugin-sdk/allowlist-config-edit` | helper สำหรับการตั้งค่า allowlist | helper สำหรับแก้ไข/อ่านการตั้งค่า allowlist |
  | `plugin-sdk/group-access` | helper สำหรับการเข้าถึงกลุ่ม | helper แบบใช้ร่วมกันสำหรับการตัดสินสิทธิ์เข้าถึงกลุ่ม |
  | `plugin-sdk/direct-dm` | helper สำหรับ Direct-DM | helper แบบใช้ร่วมกันสำหรับ auth/guard ของ Direct-DM |
  | `plugin-sdk/extension-shared` | helper extension แบบใช้ร่วมกัน | primitive helper สำหรับ passive-channel/status และ ambient proxy |
  | `plugin-sdk/webhook-targets` | helper สำหรับเป้าหมาย Webhook | helper สำหรับ registry ของเป้าหมาย Webhook และการติดตั้ง route |
  | `plugin-sdk/webhook-path` | helper สำหรับพาธ Webhook | helper สำหรับการทำ normalization ของพาธ Webhook |
  | `plugin-sdk/web-media` | helper web media แบบใช้ร่วมกัน | helper สำหรับโหลด media แบบ remote/local |
  | `plugin-sdk/zod` | re-export ของ Zod | `zod` ที่ re-export สำหรับผู้ใช้ plugin SDK |
  | `plugin-sdk/memory-core` | helper memory-core แบบ bundled | พื้นผิว helper สำหรับตัวจัดการหน่วยความจำ/การตั้งค่า/ไฟล์/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | façade runtime ของ memory engine | façade runtime สำหรับการทำดัชนี/การค้นหาในหน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-foundation` | foundation engine ของ memory host | exports ของ foundation engine ของ memory host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | embedding engine ของ memory host | สัญญา embeddings ของหน่วยความจำ, การเข้าถึง registry, provider แบบ local และ helper ทั่วไปสำหรับ batch/remote; provider แบบ remote ที่เป็นรูปธรรมจะอยู่ใน Plugins ที่เป็นเจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine ของ memory host | exports ของ QMD engine ของ memory host |
  | `plugin-sdk/memory-core-host-engine-storage` | storage engine ของ memory host | exports ของ storage engine ของ memory host |
  | `plugin-sdk/memory-core-host-multimodal` | helper multimodal ของ memory host | helper multimodal ของ memory host |
  | `plugin-sdk/memory-core-host-query` | helper query ของ memory host | helper query ของ memory host |
  | `plugin-sdk/memory-core-host-secret` | helper secret ของ memory host | helper secret ของ memory host |
  | `plugin-sdk/memory-core-host-events` | helper event journal ของ memory host | helper event journal ของ memory host |
  | `plugin-sdk/memory-core-host-status` | helper สถานะของ memory host | helper สถานะของ memory host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime ของ memory host | helper CLI runtime ของ memory host |
  | `plugin-sdk/memory-core-host-runtime-core` | core runtime ของ memory host | helper core runtime ของ memory host |
  | `plugin-sdk/memory-core-host-runtime-files` | helper ไฟล์/runtime ของ memory host | helper ไฟล์/runtime ของ memory host |
  | `plugin-sdk/memory-host-core` | alias ของ core runtime สำหรับ memory host | alias ที่ไม่ผูกกับผู้ขายสำหรับ helper core runtime ของ memory host |
  | `plugin-sdk/memory-host-events` | alias ของ event journal สำหรับ memory host | alias ที่ไม่ผูกกับผู้ขายสำหรับ helper event journal ของ memory host |
  | `plugin-sdk/memory-host-files` | alias ของไฟล์/runtime สำหรับ memory host | alias ที่ไม่ผูกกับผู้ขายสำหรับ helper ไฟล์/runtime ของ memory host |
  | `plugin-sdk/memory-host-markdown` | helper markdown ที่มีการจัดการ | helper managed-markdown แบบใช้ร่วมกันสำหรับ Plugins ที่เกี่ยวข้องกับหน่วยความจำ |
  | `plugin-sdk/memory-host-search` | façade การค้นหา Active Memory | façade runtime แบบ lazy สำหรับ active-memory search-manager |
  | `plugin-sdk/memory-host-status` | alias สถานะของ memory host | alias ที่ไม่ผูกกับผู้ขายสำหรับ helper สถานะของ memory host |
  | `plugin-sdk/memory-lancedb` | helper memory-lancedb แบบ bundled | พื้นผิว helper ของ memory-lancedb |
  | `plugin-sdk/testing` | utility สำหรับการทดสอบ | helper และ mocks สำหรับการทดสอบ |
</Accordion>

ตารางนี้ตั้งใจให้เป็นชุดย่อยสำหรับการย้ายระบบที่พบบ่อย ไม่ใช่พื้นผิว SDK ทั้งหมด รายการเต็มของ entrypoints มากกว่า 200 รายการอยู่ที่
`scripts/lib/plugin-sdk-entrypoints.json`

รายการนั้นยังคงมี bundled-plugin helper seams บางส่วน เช่น
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` และ `plugin-sdk/matrix*` โดยยังคง export ไว้เพื่อการดูแล bundled-plugin และความเข้ากันได้ แต่ตั้งใจละไว้จากตารางการย้ายระบบที่พบบ่อย และไม่ใช่เป้าหมายที่แนะนำสำหรับโค้ด Plugin ใหม่

กฎเดียวกันนี้ใช้กับตระกูล bundled-helper อื่น ๆ เช่น:

- helper สำหรับรองรับเบราว์เซอร์: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- พื้นผิว helper/plugin แบบ bundled เช่น `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  และ `plugin-sdk/voice-call`

ขณะนี้ `plugin-sdk/github-copilot-token` แสดงพื้นผิว token-helper แบบเจาะจง
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` และ `resolveCopilotApiToken`

ให้ใช้ import ที่แคบที่สุดซึ่งตรงกับงาน หากคุณหา export ไม่พบ
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือสอบถามใน Discord

## รายการ deprecated ที่ยังใช้งานอยู่

การ deprecation แบบเจาะจงกว่าซึ่งใช้กับ plugin SDK, provider contract,
runtime surface และ manifest แต่ละรายการยังคงใช้งานได้ในปัจจุบัน แต่จะถูกนำออก
ใน major release ในอนาคต รายการใต้แต่ละหัวข้อจะจับคู่ API เก่ากับ
ตัวทดแทนแบบ canonical

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **เดิม (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม,
    exports เดิม — เพียงแค่ import จาก subpath ที่แคบกว่า `command-auth`
    re-export รายการเหล่านี้เป็น compat stubs

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **เดิม**: `resolveInboundMentionRequirement({ facts, policy })` และ
    `shouldDropInboundForMention(...)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` — คืนค่าเป็น
    decision object เดียวแทนการเรียกแยกสองครั้ง

    downstream channel plugins (Slack, Discord, Matrix, Microsoft Teams) ได้เปลี่ยนมาใช้แบบใหม่นี้แล้ว

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` เป็น compatibility shim สำหรับ
    channel plugins รุ่นเก่า อย่า import จากที่นี่ในโค้ดใหม่; ให้ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับลงทะเบียน runtime
    objects

    helper ตระกูล `channelActions*` ใน `openclaw/plugin-sdk/channel-actions`
    ถูกทำเครื่องหมาย deprecated พร้อมกับ raw "actions" channel exports ให้แสดง capabilities
    ผ่านพื้นผิว `presentation` เชิงความหมายแทน — channel plugins
    ประกาศสิ่งที่แสดงผลได้ (cards, buttons, selects) แทนการระบุว่ารับชื่อ raw
    action ใดได้บ้าง

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **เดิม**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`

    **ใหม่**: ติดตั้ง `createTool(...)` โดยตรงบน provider plugin
    OpenClaw ไม่จำเป็นต้องใช้ SDK helper เพื่อลงทะเบียน tool wrapper อีกต่อไป

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **เดิม**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) ใช้สร้าง prompt
    envelope แบบ plaintext แบนจากข้อความขาเข้าของ channel

    **ใหม่**: `BodyForAgent` ร่วมกับ structured user-context blocks
    channel plugins จะแนบ routing metadata (thread, topic, reply-to, reactions) เป็น
    typed fields แทนการต่อรวมเข้าไปใน prompt string
    helper `formatAgentEnvelope(...)` ยังคงรองรับสำหรับ
    envelopes แบบสังเคราะห์ที่หันหน้าเข้าหาผู้ช่วย แต่ inbound plaintext envelopes กำลังจะถูกยกเลิก

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received` และ custom
    channel plugin ใด ๆ ที่ post-process ข้อความ `channelEnvelope`

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    type alias สำหรับ discovery ทั้งสี่รายการตอนนี้เป็นเพียง thin wrappers ของ
    types ยุค catalog:

    | alias เดิม               | type ใหม่                  |
    | ------------------------ | -------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึง `ProviderCapabilities` static bag แบบ legacy — provider plugins
    ควรแนบ capability facts ผ่าน provider runtime contract
    แทน static object

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **เดิม** (สาม hooks แยกกันบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` และ
    `resolveDefaultThinkingLevel(ctx)`

    **ใหม่**: `resolveThinkingProfile(ctx)` เพียงรายการเดียว ซึ่งคืนค่า
    `ProviderThinkingProfile` พร้อม `id` แบบ canonical, `label` แบบ optional และ
    ranked level list OpenClaw จะลดระดับค่าที่เก็บไว้ซึ่งล้าสมัยตาม profile
    rank โดยอัตโนมัติ

    ให้ติดตั้งเพียง hook เดียวแทนสามตัว legacy hooks ยังใช้งานได้ในช่วง
    deprecation window แต่จะไม่ถูก compose เข้ากับผลลัพธ์ของ profile

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **เดิม**: ติดตั้ง `resolveExternalOAuthProfiles(...)` โดยไม่
    ประกาศ provider ใน plugin manifest

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน plugin manifest
    **และ** ติดตั้ง `resolveExternalAuthProfiles(...)` เส้นทาง "auth
    fallback" แบบเก่าจะปล่อย warning ระหว่างรันไทม์และจะถูกนำออก

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    ฟิลด์ manifest **เดิม**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`

    **ใหม่**: สะท้อนการค้นหา env-var เดียวกันไปยัง `setup.providers[].envVars`
    ใน manifest ด้วย วิธีนี้รวม metadata ของ setup/status env ไว้ในที่เดียว
    และหลีกเลี่ยงการบูต plugin runtime เพียงเพื่อตอบคำถามการค้นหา env-var

    `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility adapter
    จนกว่าช่วง deprecation จะสิ้นสุด

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **เดิม**: แยกเรียกสามครั้ง —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`

    **ใหม่**: เรียกครั้งเดียวบน memory-state API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`

    slot เดิม แต่เป็นการลงทะเบียนครั้งเดียว helper ด้านหน่วยความจำแบบ additive
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    ยังมี legacy type aliases อยู่สองรายการที่ export จาก `src/plugins/runtime/types.ts`:

    | เดิม                          | ใหม่                             |
    | ----------------------------- | -------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    runtime method `readSession` ถูกทำเครื่องหมาย deprecated โดยให้ใช้
    `getSessionMessages` แทน signature เดิม; method เก่าจะเรียกผ่านไปยัง
    method ใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **เดิม**: `runtime.tasks.flow` (เอกพจน์) คืนค่า live task-flow accessor

    **ใหม่**: `runtime.tasks.flows` (พหูพจน์) คืนค่า TaskFlow access แบบ DTO
    ซึ่ง import-safe และไม่ต้องโหลด task runtime ทั้งชุด

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ครอบคลุมไว้แล้วใน "วิธีการย้ายระบบ → ย้ายส่วนขยายผลลัพธ์เครื่องมือของ Pi ไปเป็น
    middleware" ด้านบน รวมไว้ที่นี่เพื่อความครบถ้วน: เส้นทาง
    `api.registerEmbeddedExtensionFactory(...)` แบบ Pi-only ที่ถูกนำออก
    ถูกแทนที่ด้วย `api.registerAgentToolResultMiddleware(...)` พร้อมรายการ runtime
    แบบชัดเจนใน `contracts.agentToolResultMiddleware`
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` ที่ re-export จาก `openclaw/plugin-sdk` ตอนนี้เป็น
    alias แบบบรรทัดเดียวสำหรับ `OpenClawConfig` ให้เลือกใช้ชื่อ canonical แทน

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
deprecations ระดับ extension (ภายใน bundled channel/provider plugins ใต้
`extensions/`) จะถูกติดตามภายใน barrels `api.ts` และ `runtime-api.ts`
ของตนเอง ไม่ส่งผลต่อสัญญา Plugin ของ third-party และจึงไม่ได้แสดงไว้
ที่นี่ หากคุณใช้งาน local barrel ของ bundled plugin โดยตรง ให้อ่าน
คอมเมนต์ deprecation ใน barrel นั้นก่อนอัปเกรด
</Note>

## กำหนดเวลาการนำออก

| เมื่อใด | สิ่งที่เกิดขึ้น |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้** | พื้นผิวที่ deprecated จะแสดง runtime warnings |
| **major release ถัดไป** | พื้นผิวที่ deprecated จะถูกนำออก; Plugins ที่ยังใช้งานอยู่จะล้มเหลว |

ขณะนี้ core plugins ทั้งหมดได้ย้ายระบบเรียบร้อยแล้ว External plugins ควรย้ายระบบ
ก่อน major release ถัดไป

## การระงับ warnings ชั่วคราว

ตั้งค่า environment variables เหล่านี้ระหว่างที่คุณกำลังย้ายระบบ:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นช่องทางหลีกเลี่ยงชั่วคราว ไม่ใช่วิธีแก้ถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) — สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง import subpath แบบเต็ม
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้าง channel plugins
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง provider plugins
- [รายละเอียดภายในของ Plugin](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรม
- [Plugin Manifest](/th/plugins/manifest) — ข้อมูลอ้างอิง schema ของ manifest
