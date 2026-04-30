---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ให้เป็นสถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแล Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง Plugin SDK สมัยใหม่
title: การย้ายไปใช้ Plugin SDK
x-i18n:
    generated_at: "2026-04-30T10:08:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้างไปสู่สถาปัตยกรรม Plugin สมัยใหม่ที่มีการนำเข้าแบบเจาะจงและมีเอกสารกำกับ หาก Plugin ของคุณถูกสร้างก่อนสถาปัตยกรรมใหม่นี้ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยนแปลง

ระบบ Plugin เดิมมีพื้นผิวแบบเปิดกว้างสองส่วนที่ทำให้ Plugin สามารถนำเข้าทุกอย่างที่ต้องใช้จากจุดเข้าใช้งานเดียวได้:

- **`openclaw/plugin-sdk/compat`** — การนำเข้าเดียวที่ re-export helper หลายสิบรายการ ถูกเพิ่มเข้ามาเพื่อให้ Plugin รุ่นเก่าที่ใช้ hook ยังทำงานได้ระหว่างที่กำลังสร้างสถาปัตยกรรม Plugin ใหม่
- **`openclaw/plugin-sdk/infra-runtime`** — barrel helper ฝั่ง runtime แบบกว้างที่รวม event ของระบบ, สถานะ Heartbeat, คิวการส่งมอบ, helper สำหรับ fetch/proxy, helper ไฟล์, ชนิด approval และ utility ที่ไม่เกี่ยวข้องกัน
- **`openclaw/plugin-sdk/config-runtime`** — barrel ความเข้ากันได้ของ config แบบกว้างที่ยังคงมี helper โหลด/เขียนโดยตรงที่เลิกใช้แล้วในช่วงหน้าต่างการย้ายระบบ
- **`openclaw/extension-api`** — bridge ที่ให้ Plugin เข้าถึง helper ฝั่ง host โดยตรง เช่น embedded agent runner
- **`api.registerEmbeddedExtensionFactory(...)`** — hook ส่วนขยายแบบ bundled เฉพาะ Pi ที่ถูกลบแล้ว ซึ่งเคยสังเกต event ของ embedded-runner ได้ เช่น `tool_result`

พื้นผิวการนำเข้าแบบกว้างเหล่านี้ตอนนี้ **เลิกใช้แล้ว** ยังทำงานได้ใน runtime แต่ Plugin ใหม่ต้องไม่ใช้ และ Plugin ที่มีอยู่ควรย้ายออกก่อนรุ่น major ถัดไปจะลบออก API การลงทะเบียน embedded extension factory เฉพาะ Pi ถูกลบแล้ว ให้ใช้ middleware สำหรับผลลัพธ์เครื่องมือแทน

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารกำกับใหม่ใน change เดียวกับที่เพิ่มสิ่งทดแทน การเปลี่ยนแปลง contract ที่ breaking ต้องผ่าน compatibility adapter, diagnostics, เอกสาร และช่วงเวลาการเลิกใช้ก่อน สิ่งนี้ครอบคลุมการนำเข้า SDK, ฟิลด์ manifest, setup APIs, hooks และพฤติกรรมการลงทะเบียน runtime

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกลบในรุ่น major ในอนาคต
  Plugin ที่ยังนำเข้าจากพื้นผิวเหล่านี้จะใช้งานไม่ได้เมื่อถึงเวลานั้น
  การลงทะเบียน embedded extension factory เฉพาะ Pi ไม่ถูกโหลดอีกต่อไปแล้ว
</Warning>

## เหตุผลที่เปลี่ยนแปลง

แนวทางเดิมก่อให้เกิดปัญหา:

- **การเริ่มต้นช้า** — การนำเข้า helper หนึ่งรายการโหลดโมดูลที่ไม่เกี่ยวข้องหลายสิบรายการ
- **dependency วนเป็นวง** — re-export แบบกว้างทำให้สร้าง import cycle ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** — ไม่มีวิธีบอกว่า export ใดเสถียรและ export ใดเป็น internal

SDK Plugin สมัยใหม่แก้ปัญหานี้: แต่ละ path การนำเข้า (`openclaw/plugin-sdk/\<subpath\>`) เป็นโมดูลขนาดเล็กที่แยกตัวเอง มีจุดประสงค์ชัดเจนและ contract ที่มีเอกสารกำกับ

seam อำนวยความสะดวกของ provider รุ่นเก่าสำหรับ channel ที่ bundled อยู่ก็ถูกลบแล้วเช่นกัน
seam helper ที่ผูกกับชื่อ channel เป็น shortcut ภายใน mono-repo แบบ private ไม่ใช่ contract ของ Plugin ที่เสถียร ให้ใช้ subpath SDK ทั่วไปแบบแคบแทน ภายใน workspace ของ Plugin ที่ bundled อยู่ ให้เก็บ helper ที่ provider เป็นเจ้าของไว้ใน `api.ts` หรือ `runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง provider ที่ bundled อยู่ปัจจุบัน:

- Anthropic เก็บ helper stream เฉพาะ Claude ไว้ใน seam `api.ts` /
  `contract-api.ts` ของตัวเอง
- OpenAI เก็บ provider builders, helper โมเดลเริ่มต้น และ realtime provider
  builders ไว้ใน `api.ts` ของตัวเอง
- OpenRouter เก็บ provider builder และ helper onboarding/config ไว้ใน
  `api.ts` ของตัวเอง

## นโยบายความเข้ากันได้

สำหรับ Plugin ภายนอก งานความเข้ากันได้ทำตามลำดับนี้:

1. เพิ่ม contract ใหม่
2. คงพฤติกรรมเดิมไว้โดยเชื่อมผ่าน compatibility adapter
3. ส่ง diagnostic หรือ warning ที่ระบุ path เดิมและสิ่งทดแทน
4. ครอบคลุมทั้งสอง path ใน test
5. จัดทำเอกสารการเลิกใช้และ path การย้ายระบบ
6. ลบเฉพาะหลังจากหน้าต่างการย้ายระบบที่ประกาศไว้ โดยปกติในรุ่น major

maintainer สามารถ audit คิวการย้ายระบบปัจจุบันได้ด้วย
`pnpm plugins:boundary-report` ใช้ `pnpm plugins:boundary-report:summary` สำหรับจำนวนสรุปแบบกระชับ, `--owner <id>` สำหรับ Plugin หนึ่งตัวหรือเจ้าของความเข้ากันได้หนึ่งราย และ
`pnpm plugins:boundary-report:ci` เมื่อ gate ของ CI ควร fail จาก record ความเข้ากันได้ที่ครบกำหนด, การนำเข้า SDK reserved ข้ามเจ้าของ หรือ subpath SDK reserved ที่ไม่ได้ใช้ รายงานจะจัดกลุ่ม record ความเข้ากันได้ที่เลิกใช้แล้วตามวันที่ลบออก นับ reference ใน code/docs ภายใน แสดงการนำเข้า SDK reserved ข้ามเจ้าของ และสรุป bridge SDK memory-host แบบ private เพื่อให้การ cleanup ความเข้ากันได้ชัดเจนแทนที่จะพึ่งพาการค้นหาเฉพาะกิจ subpath SDK reserved ต้องมีการติดตามการใช้งานของเจ้าของ export helper reserved ที่ไม่ได้ใช้ควรถูกลบออกจาก SDK สาธารณะ

หากฟิลด์ manifest ยังถูกยอมรับอยู่ ผู้เขียน Plugin สามารถใช้งานต่อได้จนกว่าเอกสารและ diagnostics จะระบุเป็นอย่างอื่น code ใหม่ควรใช้สิ่งทดแทนที่มีเอกสารกำกับ แต่ Plugin ที่มีอยู่ไม่ควรแตกในระหว่างรุ่น minor ปกติ

## วิธีการย้ายระบบ

<Steps>
  <Step title="ย้าย helper โหลด/เขียน runtime config">
    Plugin ที่ bundled อยู่ควรหยุดเรียก
    `api.runtime.config.loadConfig()` และ
    `api.runtime.config.writeConfigFile(...)` โดยตรง ให้ใช้ config ที่ถูกส่งเข้ามาใน active call path อยู่แล้ว ตัวจัดการระยะยาวที่ต้องการ snapshot ของ process ปัจจุบันสามารถใช้ `api.runtime.config.current()` เครื่องมือ agent ระยะยาวควรใช้ `ctx.getRuntimeConfig()` ของ tool context ภายใน
    `execute` เพื่อให้เครื่องมือที่ถูกสร้างก่อนการเขียน config ยังเห็น runtime config ที่ refresh แล้ว

    การเขียน config ต้องผ่าน helper แบบ transactional และเลือกนโยบายหลังเขียน:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    ใช้ `afterWrite: { mode: "restart", reason: "..." }` เมื่อ caller รู้ว่าการเปลี่ยนแปลงต้องใช้ gateway restart แบบสะอาด และใช้
    `afterWrite: { mode: "none", reason: "..." }` เฉพาะเมื่อ caller เป็นเจ้าของ follow-up เองและตั้งใจจะระงับ reload planner
    ผลลัพธ์ mutation มีสรุป `followUp` แบบมีชนิดสำหรับ test และ logging;
    gateway ยังคงรับผิดชอบการนำ restart ไปใช้หรือจัดตารางเวลา
    `loadConfig` และ `writeConfigFile` ยังคงเป็น helper ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ Plugin ภายนอกในช่วงหน้าต่างการย้ายระบบ และ warning หนึ่งครั้งด้วย compatibility code
    `runtime-config-load-write` Plugin ที่ bundled อยู่และ code runtime ใน repo ได้รับการป้องกันด้วย scanner guardrails ใน
    `pnpm check:deprecated-internal-config-api` และ
    `pnpm check:no-runtime-action-load-config`: การใช้งาน Plugin production ใหม่จะ fail ทันที, การเขียน config โดยตรงจะ fail, method ของ gateway server ต้องใช้ request runtime snapshot, helper runtime channel send/action/client ต้องรับ config จาก boundary ของตัวเอง และโมดูล runtime ระยะยาวมีการเรียก ambient `loadConfig()` ที่อนุญาตเป็นศูนย์รายการ

    code Plugin ใหม่ควรหลีกเลี่ยงการนำเข้า compatibility barrel แบบกว้าง
    `openclaw/plugin-sdk/config-runtime` ด้วย ใช้ subpath SDK แบบแคบที่ตรงกับงาน:

    | ความต้องการ | การนำเข้า |
    | --- | --- |
    | ชนิด config เช่น `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | assertion สำหรับ config ที่โหลดแล้วและการค้นหา config ของ plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | การอ่าน snapshot runtime ปัจจุบัน | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | การเขียน config | `openclaw/plugin-sdk/config-mutation` |
    | helper session store | `openclaw/plugin-sdk/session-store-runtime` |
    | config ตาราง Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helper runtime ของ group policy | `openclaw/plugin-sdk/runtime-group-policy` |
    | การ resolve secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | override model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin ที่ bundled อยู่และ test ของ Plugin เหล่านั้นได้รับการป้องกันด้วย scanner จาก barrel แบบกว้าง เพื่อให้การนำเข้าและ mock อยู่เฉพาะที่พฤติกรรมต้องใช้ barrel แบบกว้างยังคงมีอยู่เพื่อความเข้ากันได้ภายนอก แต่ code ใหม่ไม่ควรพึ่งพา

  </Step>

  <Step title="ย้ายส่วนขยายผลลัพธ์เครื่องมือของ Pi ไปเป็น middleware">
    Plugin ที่ bundled อยู่ต้องแทนที่ตัวจัดการผลลัพธ์เครื่องมือ
    `api.registerEmbeddedExtensionFactory(...)` เฉพาะ Pi ด้วย middleware ที่ไม่ผูกกับ runtime

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    อัปเดต manifest ของ Plugin พร้อมกัน:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin ภายนอกไม่สามารถลงทะเบียน middleware สำหรับผลลัพธ์เครื่องมือได้ เพราะมันสามารถเขียน output ของเครื่องมือที่มีความเชื่อถือสูงใหม่ก่อนที่โมเดลจะเห็น

  </Step>

  <Step title="ย้ายตัวจัดการที่รองรับ approval-native ไปเป็น capability facts">
    Plugin channel ที่รองรับ approval ตอนนี้เปิดเผยพฤติกรรม approval แบบ native ผ่าน
    `approvalCapability.nativeRuntime` พร้อมกับ registry runtime-context ที่ใช้ร่วมกัน

    การเปลี่ยนแปลงสำคัญ:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery เฉพาะ approval ออกจาก wiring รุ่นเก่า `plugin.auth` /
      `plugin.approvals` และไปไว้บน `approvalCapability`
    - `ChannelPlugin.approvals` ถูกลบออกจาก contract channel-plugin สาธารณะแล้ว ให้ย้ายฟิลด์ delivery/native/render ไปไว้บน `approvalCapability`
    - `plugin.auth` ยังคงมีไว้สำหรับ flow login/logout ของ channel เท่านั้น; hook auth สำหรับ approval ที่อยู่ตรงนั้น core จะไม่อ่านอีกต่อไป
    - ลงทะเบียน object runtime ที่ channel เป็นเจ้าของ เช่น client, token หรือ Bolt
      app ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่ง notice reroute ที่ Plugin เป็นเจ้าของจากตัวจัดการ approval แบบ native;
      ตอนนี้ core เป็นเจ้าของ notice routed-elsewhere จากผลลัพธ์การส่งมอบจริง
    - เมื่อส่ง `channelRuntime` เข้าไปใน `createChannelManager(...)` ให้ระบุ surface `createPluginRuntime().channel` จริง stub บางส่วนจะถูกปฏิเสธ

    ดู `/plugins/sdk-channel-plugins` สำหรับ layout approval capability ปัจจุบัน

  </Step>

  <Step title="Audit พฤติกรรม fallback ของ Windows wrapper">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn` ตอนนี้ Windows wrapper
    `.cmd`/`.bat` ที่ resolve ไม่ได้จะ fail closed เว้นแต่คุณจะส่ง
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

    หาก caller ของคุณไม่ได้ตั้งใจพึ่งพา shell fallback อย่าตั้งค่า
    `allowShellFallback` และให้จัดการ error ที่ throw แทน

  </Step>

  <Step title="ค้นหาการนำเข้าที่เลิกใช้แล้ว">
    ค้นหา Plugin ของคุณสำหรับการนำเข้าจากพื้นผิวที่เลิกใช้แล้ว:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="แทนที่ด้วยการนำเข้าแบบเจาะจง">
    แต่ละ export จากพื้นผิวเดิมจะ map ไปยัง path การนำเข้าสมัยใหม่ที่เจาะจง:

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

    สำหรับ helper ฝั่ง host ให้ใช้ plugin runtime ที่ inject เข้ามาแทนการนำเข้าโดยตรง:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    รูปแบบเดียวกันนี้ใช้กับตัวช่วยบริดจ์เดิมอื่น ๆ ด้วย:

    | การอิมพอร์ตเดิม | สิ่งที่เทียบเท่าในปัจจุบัน |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ตัวช่วยที่เก็บ session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="แทนที่การอิมพอร์ต infra-runtime แบบกว้าง">
    `openclaw/plugin-sdk/infra-runtime` ยังคงมีอยู่เพื่อความเข้ากันได้กับภายนอก
    แต่โค้ดใหม่ควรอิมพอร์ตพื้นผิวตัวช่วยที่เจาะจงซึ่งต้องใช้จริง:

    | ความต้องการ | อิมพอร์ต |
    | --- | --- |
    | ตัวช่วยคิวเหตุการณ์ของระบบ | `openclaw/plugin-sdk/system-event-runtime` |
    | ตัวช่วยเหตุการณ์ Heartbeat และการมองเห็น | `openclaw/plugin-sdk/heartbeat-runtime` |
    | การระบายคิวการส่งมอบที่ค้างอยู่ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | เทเลเมทรีกิจกรรมของช่องทาง | `openclaw/plugin-sdk/channel-activity-runtime` |
    | แคช dedupe ในหน่วยความจำ | `openclaw/plugin-sdk/dedupe-runtime` |
    | ตัวช่วยพาธไฟล์/สื่อภายในเครื่องที่ปลอดภัย | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch ที่รับรู้ dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | ตัวช่วยพร็อกซีและ fetch ที่มีการป้องกัน | `openclaw/plugin-sdk/fetch-runtime` |
    | ชนิดนโยบาย dispatcher สำหรับ SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | ชนิดคำขอ/การแก้ไขการอนุมัติ | `openclaw/plugin-sdk/approval-runtime` |
    | ตัวช่วยเพย์โหลดและคำสั่งตอบกลับการอนุมัติ | `openclaw/plugin-sdk/approval-reply-runtime` |
    | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `openclaw/plugin-sdk/error-runtime` |
    | การรอความพร้อมของ transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | ตัวช่วยโทเค็นที่ปลอดภัย | `openclaw/plugin-sdk/secure-random-runtime` |
    | การทำงานพร้อมกันของงาน async แบบมีขอบเขต | `openclaw/plugin-sdk/concurrency-runtime` |
    | การบังคับแปลงเป็นตัวเลข | `openclaw/plugin-sdk/number-runtime` |
    | ล็อก async ภายในโปรเซส | `openclaw/plugin-sdk/async-lock-runtime` |
    | ล็อกไฟล์ | `openclaw/plugin-sdk/file-lock` |

    Plugin ที่บันเดิลมาพร้อมกันถูกป้องกันด้วยสแกนเนอร์ไม่ให้ใช้ `infra-runtime` ดังนั้นโค้ดในรีโปจึงไม่สามารถถดถอยกลับไปใช้ barrel แบบกว้างได้

  </Step>

  <Step title="ย้ายตัวช่วย route ของช่องทาง">
    โค้ด route ของช่องทางใหม่ควรใช้ `openclaw/plugin-sdk/channel-route`
    ชื่อ route-key และ comparable-target แบบเก่ายังคงอยู่ในฐานะ alias เพื่อความเข้ากันได้
    ระหว่างช่วงการย้าย แต่ Plugin ใหม่ควรใช้ชื่อ route
    ที่อธิบายพฤติกรรมโดยตรง:

    | ตัวช่วยเดิม | ตัวช่วยปัจจุบัน |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    ตัวช่วย route แบบปัจจุบัน normalize `{ channel, to, accountId, threadId }`
    อย่างสอดคล้องกันใน native approvals, reply suppression, inbound dedupe,
    การส่งมอบ cron และการกำหนดเส้นทาง session หาก Plugin ของคุณเป็นเจ้าของ
    grammar ของเป้าหมายแบบกำหนดเอง ให้ใช้ `resolveChannelRouteTargetWithParser(...)` เพื่อปรับ
    parser นั้นให้เข้ากับสัญญา route target เดียวกัน

  </Step>

  <Step title="บิลด์และทดสอบ">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงพาธการอิมพอร์ต

  <Accordion title="ตารางเส้นทาง import ที่ใช้บ่อย">
  | เส้นทาง import | วัตถุประสงค์ | export หลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วยรายการ Plugin แบบมาตรฐาน | `definePluginEntry` |
  | `plugin-sdk/core` | umbrella re-export แบบเดิมสำหรับการกำหนด/ตัวสร้างรายการ channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export สคีมา config ระดับราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วยรายการแบบ provider เดียว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | การกำหนดและตัวสร้างรายการ channel แบบเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | ตัวช่วย setup wizard ที่ใช้ร่วมกัน | prompt allowlist, ตัวสร้างสถานะ setup |
  | `plugin-sdk/setup-runtime` | ตัวช่วย runtime ช่วง setup | adapter patch setup ที่ import ได้อย่างปลอดภัย, ตัวช่วย lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup แบบมอบหมาย |
  | `plugin-sdk/setup-adapter-runtime` | ตัวช่วย adapter สำหรับ setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | ตัวช่วยเครื่องมือ setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/config/action-gate |
  | `plugin-sdk/account-id` | ตัวช่วย account-id | `DEFAULT_ACCOUNT_ID`, การทำ account-id ให้เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี | ตัวช่วยค้นหาบัญชี + default-fallback |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบแคบ | ตัวช่วยรายการบัญชี/account-action |
  | `plugin-sdk/channel-setup` | adapter สำหรับ setup wizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การต่อสาย prefix การตอบกลับ, typing, และ source-delivery | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | factory สำหรับ adapter config และตัวช่วยการเข้าถึง DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้างสคีมา config | primitive สคีมา config ของ channel ที่ใช้ร่วมกัน และตัวสร้างทั่วไปเท่านั้น |
  | `plugin-sdk/bundled-channel-config-schema` | สคีมา config ที่ bundled มา | เฉพาะ Plugin ที่ bundled และดูแลโดย OpenClaw เท่านั้น; Plugin ใหม่ต้องกำหนดสคีมาใน Plugin เอง |
  | `plugin-sdk/channel-config-schema-legacy` | สคีมา config ที่ bundled แบบเลิกใช้แล้ว | alias สำหรับความเข้ากันได้เท่านั้น; ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ Plugin ที่ bundled และยังดูแลอยู่ |
  | `plugin-sdk/telegram-command-config` | ตัวช่วย config คำสั่ง Telegram | การทำชื่อคำสั่งให้เป็นรูปแบบมาตรฐาน, การตัดคำอธิบาย, การตรวจสอบรายการซ้ำ/ข้อขัดแย้ง |
  | `plugin-sdk/channel-policy` | การ resolve นโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | ตัวช่วยสถานะบัญชีและ lifecycle ของ draft stream | `createAccountStatusSink`, ตัวช่วย finalization ของ draft preview |
  | `plugin-sdk/inbound-envelope` | ตัวช่วย envelope ขาเข้า | ตัวช่วย route + ตัวสร้าง envelope ที่ใช้ร่วมกัน |
  | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วยการตอบกลับขาเข้า | ตัวช่วย record-and-dispatch ที่ใช้ร่วมกัน |
  | `plugin-sdk/messaging-targets` | การ parse เป้าหมายการส่งข้อความ | ตัวช่วย parse/match เป้าหมาย |
  | `plugin-sdk/outbound-media` | ตัวช่วยสื่อขาออก | การโหลดสื่อขาออกที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | ตัวช่วย dependency การส่งขาออก | การค้นหา `resolveOutboundSendDep` แบบเบาโดยไม่ import runtime ขาออกทั้งหมด |
  | `plugin-sdk/outbound-runtime` | ตัวช่วย runtime ขาออก | ตัวช่วยการส่งขาออก, delegate identity/send, session, formatting และการวางแผน payload |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วย thread-binding | ตัวช่วย lifecycle และ adapter ของ thread-binding |
  | `plugin-sdk/agent-media-payload` | ตัวช่วย payload สื่อแบบเดิม | ตัวสร้าง payload สื่อของ agent สำหรับ layout field แบบเดิม |
  | `plugin-sdk/channel-runtime` | compatibility shim ที่เลิกใช้แล้ว | utility ของ runtime channel แบบเดิมเท่านั้น |
  | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การส่ง | ชนิดผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | พื้นที่จัดเก็บ Plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วย runtime แบบกว้าง | ตัวช่วย runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | ตัวช่วย runtime env แบบแคบ | Logger/runtime env, timeout, retry และ backoff |
  | `plugin-sdk/plugin-runtime` | ตัวช่วย runtime ของ Plugin ที่ใช้ร่วมกัน | ตัวช่วยคำสั่ง/hook/http/interactive ของ Plugin |
  | `plugin-sdk/hook-runtime` | ตัวช่วย hook pipeline | ตัวช่วย pipeline ของ webhook/hook ภายในที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วย lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วย process | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วย runtime ของ CLI | การ format คำสั่ง, การรอ, ตัวช่วยเวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | client ของ Gateway, ตัวช่วยเริ่มต้นแบบ event-loop-ready และตัวช่วย patch สถานะ channel |
  | `plugin-sdk/config-runtime` | compatibility shim ของ config ที่เลิกใช้แล้ว | ควรใช้ `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` และ `config-mutation` |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram แบบ fallback-stable เมื่อพื้นผิว contract ของ Telegram ที่ bundled ไม่พร้อมใช้งาน |
  | `plugin-sdk/approval-runtime` | ตัวช่วย prompt การอนุมัติ | payload การอนุมัติ exec/Plugin, ตัวช่วย capability/profile สำหรับการอนุมัติ, ตัวช่วย routing/runtime การอนุมัติแบบ native และการ format path การแสดงผลการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วย auth การอนุมัติ | การ resolve ผู้อนุมัติ, auth การกระทำในแชทเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วย client การอนุมัติ | ตัวช่วย profile/filter การอนุมัติ exec แบบ native |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วย delivery การอนุมัติ | adapter capability/delivery สำหรับการอนุมัติแบบ native |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย gateway การอนุมัติ | ตัวช่วย resolve gateway การอนุมัติที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วย adapter การอนุมัติ | ตัวช่วยโหลด adapter การอนุมัติแบบ native ที่เบาสำหรับ entrypoint ของ channel ที่ร้อน |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วย handler การอนุมัติ | ตัวช่วย runtime ของ handler การอนุมัติที่กว้างกว่า; ควรใช้ adapter/gateway seam ที่แคบกว่าเมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติ | ตัวช่วย binding เป้าหมาย/บัญชีสำหรับการอนุมัติแบบ native |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วยการตอบกลับการอนุมัติ | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วย runtime-context ของ channel | ตัวช่วย register/get/watch runtime-context ของ channel แบบทั่วไป |
  | `plugin-sdk/security-runtime` | ตัวช่วยด้านความปลอดภัย | trust, DM gating, external-content และ secret-collection ที่ใช้ร่วมกัน |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วย host allowlist และนโยบาย private-network |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วย runtime SSRF | pinned-dispatcher, guarded fetch, ตัวช่วยนโยบาย SSRF |
  | `plugin-sdk/system-event-runtime` | ตัวช่วย event ระบบ | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | ตัวช่วย Heartbeat | ตัวช่วย event และ visibility ของ Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยคิว delivery | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | ตัวช่วย activity ของ channel | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | ตัวช่วย dedupe | cache dedupe ในหน่วยความจำ |
  | `plugin-sdk/file-access-runtime` | ตัวช่วยการเข้าถึงไฟล์ | ตัวช่วย path ไฟล์/สื่อภายในเครื่องที่ปลอดภัย |
  | `plugin-sdk/transport-ready-runtime` | ตัวช่วยความพร้อมของ transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | ตัวช่วย cache แบบมีขอบเขต | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วย gating ของ diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วย format ข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วย error graph |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch/proxy แบบ wrapper | `resolveFetch`, ตัวช่วย proxy, ตัวช่วยตัวเลือก EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | ตัวช่วยการทำ host ให้เป็นรูปแบบมาตรฐาน | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วย retry | `RetryConfig`, `retryAsync`, runner นโยบาย |
  | `plugin-sdk/allow-from` | การ format allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | การ mapping input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | ตัวช่วย command gating และ command-surface | `resolveControlCommandGate`, ตัวช่วย sender-authorization, ตัวช่วย registry คำสั่ง รวมถึงการ format เมนู argument แบบ dynamic |
  | `plugin-sdk/command-status` | renderer สถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การ parse input ลับ | ตัวช่วย input ลับ |
  | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ Webhook | utility เป้าหมาย Webhook |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วย guard body ของ Webhook | ตัวช่วยอ่าน/จำกัด body ของคำขอ |
  | `plugin-sdk/reply-runtime` | runtime การตอบกลับที่ใช้ร่วมกัน | การ dispatch ขาเข้า, heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch การตอบกลับแบบแคบ | finalize, dispatch provider และตัวช่วย conversation-label |
  | `plugin-sdk/reply-history` | ตัวช่วย reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reference การตอบกลับ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วย chunk การตอบกลับ | ตัวช่วย chunk ข้อความ/markdown |
  | `plugin-sdk/session-store-runtime` | ตัวช่วย session store | path ของ store + ตัวช่วย updated-at |
  | `plugin-sdk/state-paths` | ตัวช่วย path สถานะ | ตัวช่วย state และไดเรกทอรี OAuth |
  | `plugin-sdk/routing` | ตัวช่วย routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วยการทำ session-key ให้เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะ channel | ตัวสร้างสรุปสถานะ channel/บัญชี, ค่าเริ่มต้น runtime-state, ตัวช่วย metadata ของ issue |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วย resolver เป้าหมาย | ตัวช่วย resolver เป้าหมายที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วยการทำ string ให้เป็นรูปแบบมาตรฐาน | ตัวช่วยการทำ slug/string ให้เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/request-url` | ตัวช่วย URL คำขอ | ดึง URL แบบ string จาก input ที่คล้ายคำขอ |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบกำหนดเวลา | runner คำสั่งแบบกำหนดเวลาพร้อม stdout/stderr ที่ทำให้เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/param-readers` | ตัวอ่าน param | ตัวอ่าน param ทั่วไปสำหรับ tool/CLI |
  | `plugin-sdk/tool-payload` | การแยกเพย์โหลดของเครื่องมือ | แยกเพย์โหลดที่ปรับมาตรฐานจากออบเจ็กต์ผลลัพธ์ของเครื่องมือ |
  | `plugin-sdk/tool-send` | การแยกการส่งของเครื่องมือ | แยกฟิลด์เป้าหมายการส่งแบบมาตรฐานจากอาร์กิวเมนต์ของเครื่องมือ |
  | `plugin-sdk/temp-path` | ตัวช่วยพาธชั่วคราว | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | ตัวช่วยการบันทึกล็อก | ตัวช่วยตัวบันทึกล็อกของระบบย่อยและการปกปิดข้อมูล |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วยตาราง Markdown | ตัวช่วยโหมดตาราง Markdown |
  | `plugin-sdk/reply-payload` | ประเภทการตอบกลับข้อความ | ประเภทเพย์โหลดการตอบกลับ |
  | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการในเครื่อง/โฮสต์เองที่คัดสรรแล้ว | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการที่โฮสต์เอง |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการที่โฮสต์เองและเข้ากันได้กับ OpenAI โดยเฉพาะ | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการที่โฮสต์เองแบบเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วยยืนยันตัวตนรันไทม์ของผู้ให้บริการ | ตัวช่วยแก้ไขคีย์ API ขณะรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วยตั้งค่าคีย์ API ของผู้ให้บริการ | ตัวช่วยเริ่มต้นใช้งานคีย์ API/เขียนโปรไฟล์ |
  | `plugin-sdk/provider-auth-result` | ตัวช่วยผลลัพธ์การยืนยันตัวตนของผู้ให้บริการ | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
  | `plugin-sdk/provider-auth-login` | ตัวช่วยเข้าสู่ระบบแบบโต้ตอบของผู้ให้บริการ | ตัวช่วยเข้าสู่ระบบแบบโต้ตอบที่ใช้ร่วมกัน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยเลือกผู้ให้บริการ | การเลือกผู้ให้บริการที่กำหนดค่าแล้วหรืออัตโนมัติ และการผสานการกำหนดค่าผู้ให้บริการแบบดิบ |
  | `plugin-sdk/provider-env-vars` | ตัวช่วยตัวแปรสภาพแวดล้อมของผู้ให้บริการ | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
  | `plugin-sdk/provider-model-shared` | ตัวช่วยโมเดล/รีเพลย์ของผู้ให้บริการที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบายรีเพลย์ที่ใช้ร่วมกัน, ตัวช่วยเอนด์พอยต์ของผู้ให้บริการ และตัวช่วยปรับมาตรฐานรหัสโมเดล |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วยแค็ตตาล็อกผู้ให้บริการที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์การเริ่มต้นใช้งานผู้ให้บริการ | ตัวช่วยกำหนดค่าการเริ่มต้นใช้งาน |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของผู้ให้บริการ | ตัวช่วยความสามารถ HTTP/เอนด์พอยต์ทั่วไปของผู้ให้บริการ รวมถึงตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วย web-fetch ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยกำหนดค่า web-search ของผู้ให้บริการ | ตัวช่วยกำหนดค่า/ข้อมูลประจำตัว web-search แบบเฉพาะสำหรับผู้ให้บริการที่ไม่ต้องใช้การเชื่อม Plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา web-search ของผู้ให้บริการ | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลประจำตัว web-search แบบเฉพาะ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลประจำตัวแบบจำกัดขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วย web-search ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคช/รันไทม์ผู้ให้บริการ web-search |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของเครื่องมือ/สคีมาผู้ให้บริการ | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้างสคีมา Gemini + การวินิจฉัย และตัวช่วยความเข้ากันได้ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานผู้ให้บริการ | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และตัวช่วยการใช้งานผู้ให้บริการอื่นๆ |
  | `plugin-sdk/provider-stream` | ตัวช่วยตัวห่อสตรีมของผู้ให้บริการ | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภทตัวห่อสตรีม และตัวช่วยตัวห่อ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ที่ใช้ร่วมกัน |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วยทรานสปอร์ตของผู้ให้บริการ | ตัวช่วยทรานสปอร์ตผู้ให้บริการแบบเนทีฟ เช่น guarded fetch, การแปลงข้อความทรานสปอร์ต และสตรีมเหตุการณ์ทรานสปอร์ตที่เขียนได้ |
  | `plugin-sdk/keyed-async-queue` | คิวอะซิงก์ตามลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วยดึง/แปลง/จัดเก็บสื่อ, การตรวจสอบมิติวิดีโอด้วย ffprobe และตัวสร้างเพย์โหลดสื่อ |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสร้างสื่อที่ใช้ร่วมกัน | ตัวช่วยเฟลโอเวอร์ที่ใช้ร่วมกัน, การเลือกแคนดิเดต และข้อความเมื่อไม่มีโมเดลสำหรับการสร้างรูปภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วยความเข้าใจสื่อ | ประเภทผู้ให้บริการความเข้าใจสื่อ พร้อมเอ็กซ์พอร์ตตัวช่วยรูปภาพ/เสียงสำหรับผู้ให้บริการ |
  | `plugin-sdk/text-runtime` | ตัวช่วยข้อความที่ใช้ร่วมกัน | การลบข้อความที่ผู้ช่วยมองเห็น, ตัวช่วยเรนเดอร์/แบ่งชังก์/ตาราง Markdown, ตัวช่วยการปกปิดข้อมูล, ตัวช่วยแท็กคำสั่ง, ยูทิลิตีข้อความปลอดภัย และตัวช่วยข้อความ/การบันทึกล็อกที่เกี่ยวข้อง |
  | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งชังก์ข้อความ | ตัวช่วยแบ่งชังก์ข้อความขาออก |
  | `plugin-sdk/speech` | ตัวช่วยคำพูด | ประเภทผู้ให้บริการคำพูด พร้อมตัวช่วยคำสั่ง, รีจิสทรี, การตรวจสอบความถูกต้องสำหรับผู้ให้บริการ และตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/speech-core` | แกนคำพูดที่ใช้ร่วมกัน | ประเภทผู้ให้บริการคำพูด, รีจิสทรี, คำสั่ง, การปรับมาตรฐาน |
  | `plugin-sdk/realtime-transcription` | ตัวช่วยการถอดเสียงแบบเรียลไทม์ | ประเภทผู้ให้บริการ, ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วยเสียงแบบเรียลไทม์ | ประเภทผู้ให้บริการ, ตัวช่วยรีจิสทรี/การแก้ไข และตัวช่วยเซสชันบริดจ์ |
  | `plugin-sdk/image-generation` | ตัวช่วยการสร้างรูปภาพ | ประเภทผู้ให้บริการการสร้างรูปภาพ พร้อมตัวช่วย URL ของแอสเซ็ตรูปภาพ/ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/image-generation-core` | แกนการสร้างรูปภาพที่ใช้ร่วมกัน | ประเภทการสร้างรูปภาพ, เฟลโอเวอร์, การยืนยันตัวตน และตัวช่วยรีจิสทรี |
  | `plugin-sdk/music-generation` | ตัวช่วยการสร้างเพลง | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
  | `plugin-sdk/music-generation-core` | แกนการสร้างเพลงที่ใช้ร่วมกัน | ประเภทการสร้างเพลง, ตัวช่วยเฟลโอเวอร์, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | ตัวช่วยการสร้างวิดีโอ | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
  | `plugin-sdk/video-generation-core` | แกนการสร้างวิดีโอที่ใช้ร่วมกัน | ประเภทการสร้างวิดีโอ, ตัวช่วยเฟลโอเวอร์, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | ตัวช่วยการตอบกลับแบบโต้ตอบ | การปรับมาตรฐาน/ลดรูปเพย์โหลดการตอบกลับแบบโต้ตอบ |
  | `plugin-sdk/channel-config-primitives` | พื้นฐานการกำหนดค่าช่องทาง | พื้นฐานสคีมาการกำหนดค่าช่องทางแบบเฉพาะ |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยเขียนการกำหนดค่าช่องทาง | ตัวช่วยอนุญาตการเขียนการกำหนดค่าช่องทาง |
  | `plugin-sdk/channel-plugin-common` | พรีลูดช่องทางที่ใช้ร่วมกัน | เอ็กซ์พอร์ตพรีลูด Plugin ช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะช่องทาง | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วยกำหนดค่า allowlist | ตัวช่วยแก้ไข/อ่านการกำหนดค่า allowlist |
  | `plugin-sdk/group-access` | ตัวช่วยการเข้าถึงกลุ่ม | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm` | ตัวช่วย DM โดยตรง | ตัวช่วยการยืนยันตัวตน/การ์ดสำหรับ DM โดยตรงที่ใช้ร่วมกัน |
  | `plugin-sdk/extension-shared` | ตัวช่วยส่วนขยายที่ใช้ร่วมกัน | พื้นฐานตัวช่วย passive-channel/status และ ambient proxy |
  | `plugin-sdk/webhook-targets` | ตัวช่วยเป้าหมาย Webhook | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
  | `plugin-sdk/webhook-path` | ตัวช่วยพาธ Webhook | ตัวช่วยปรับมาตรฐานพาธ Webhook |
  | `plugin-sdk/web-media` | ตัวช่วยสื่อเว็บที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อระยะไกล/ในเครื่อง |
  | `plugin-sdk/zod` | การเอ็กซ์พอร์ต Zod ซ้ำ | `zod` ที่เอ็กซ์พอร์ตซ้ำสำหรับผู้ใช้ Plugin SDK |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่มาพร้อมกัน | พื้นผิวตัวช่วยตัวจัดการหน่วยความจำ/การกำหนดค่า/ไฟล์/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | เฟซาดรันไทม์เอนจินหน่วยความจำ | เฟซาดรันไทม์ดัชนี/การค้นหาหน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-foundation` | เอนจินพื้นฐานโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจินพื้นฐานโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | เอนจินเอ็มเบดดิงโฮสต์หน่วยความจำ | สัญญาเอ็มเบดดิงหน่วยความจำ, การเข้าถึงรีจิสทรี, ผู้ให้บริการในเครื่อง และตัวช่วยแบตช์/ระยะไกลทั่วไป; ผู้ให้บริการระยะไกลแบบเฉพาะอยู่ใน Plugin ที่เป็นเจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | เอนจิน QMD โฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจิน QMD โฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-storage` | เอนจินพื้นที่จัดเก็บโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจินพื้นที่จัดเก็บโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโหมดโฮสต์หน่วยความจำ | ตัวช่วยมัลติโหมดโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วยคิวรีโฮสต์หน่วยความจำ | ตัวช่วยคิวรีโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วยความลับโฮสต์หน่วยความจำ | ตัวช่วยความลับโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-events` | ตัวช่วยบันทึกเหตุการณ์โฮสต์หน่วยความจำ | ตัวช่วยบันทึกเหตุการณ์โฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะโฮสต์หน่วยความจำ | ตัวช่วยสถานะโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-cli` | รันไทม์ CLI โฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ CLI โฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-core` | รันไทม์แกนโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์แกนโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์โฮสต์หน่วยความจำ | ตัวช่วยไฟล์/รันไทม์โฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-core` | นามแฝงรันไทม์แกนโฮสต์หน่วยความจำ | นามแฝงที่เป็นกลางต่อผู้จัดจำหน่ายสำหรับตัวช่วยรันไทม์แกนโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-events` | นามแฝงบันทึกเหตุการณ์โฮสต์หน่วยความจำ | นามแฝงที่เป็นกลางต่อผู้จัดจำหน่ายสำหรับตัวช่วยบันทึกเหตุการณ์โฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-files` | นามแฝงไฟล์/รันไทม์โฮสต์หน่วยความจำ | นามแฝงที่เป็นกลางต่อผู้จัดจำหน่ายสำหรับตัวช่วยไฟล์/รันไทม์โฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย Markdown ที่จัดการแล้ว | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้กับหน่วยความจำ |
  | `plugin-sdk/memory-host-search` | เฟซาดค้นหา Active memory | เฟซาดรันไทม์ตัวจัดการค้นหา active-memory แบบโหลดภายหลัง |
  | `plugin-sdk/memory-host-status` | นามแฝงสถานะโฮสต์หน่วยความจำ | นามแฝงที่เป็นกลางต่อผู้จัดจำหน่ายสำหรับตัวช่วยสถานะโฮสต์หน่วยความจำ |
  | `plugin-sdk/testing` | ยูทิลิตีทดสอบ | Barrel ความเข้ากันได้แบบกว้างรุ่นเก่า; แนะนำให้ใช้พาธย่อยทดสอบแบบเฉพาะ เช่น `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` และ `plugin-sdk/test-fixtures` |
</Accordion>

ตารางนี้ตั้งใจให้เป็นชุดย่อยสำหรับการย้ายโดยทั่วไป ไม่ใช่พื้นผิว SDK
ทั้งหมด รายการ entrypoint ทั้งหมดกว่า 200 รายการอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`.

seam ตัวช่วยของ bundled-plugin ที่สงวนไว้ถูกเลิกใช้จาก export map ของ SDK
สาธารณะแล้ว ยกเว้น compatibility facade ที่มีเอกสารระบุไว้อย่างชัดเจน เช่น
shim `plugin-sdk/discord` ที่เลิกใช้แล้วแต่ยังคงไว้สำหรับแพ็กเกจ
`@openclaw/discord@2026.3.13` ที่เผยแพร่แล้ว ตัวช่วยเฉพาะ owner อยู่ภายใน
แพ็กเกจ Plugin ที่เป็นเจ้าของ พฤติกรรม host ที่ใช้ร่วมกันควรย้ายผ่านสัญญา SDK
ทั่วไป เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
และ `plugin-sdk/plugin-config-runtime`.

ใช้อิมพอร์ตที่แคบที่สุดซึ่งตรงกับงาน หากคุณหา export ไม่พบ
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือถาม maintainers ว่าสัญญาทั่วไปใด
ควรเป็นเจ้าของสิ่งนั้น

## การเลิกใช้งานที่มีผลอยู่

การเลิกใช้งานที่แคบลงซึ่งใช้ครอบคลุม plugin SDK, สัญญา provider,
พื้นผิว runtime และ manifest แต่ละรายการยังใช้งานได้ในวันนี้
แต่จะถูกนำออกใน major release ในอนาคต รายการใต้แต่ละหัวข้อจะแมป API เก่า
ไปยังตัวแทนมาตรฐานของมัน

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **เก่า (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม,
    export เดิม — เพียงอิมพอร์ตจาก subpath ที่แคบกว่า `command-auth`
    re-export สิ่งเหล่านี้เป็น compat stubs

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **เก่า**: `resolveInboundMentionRequirement({ facts, policy })` และ
    `shouldDropInboundForMention(...)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`.

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` — คืนค่า
    object การตัดสินใจเดี่ยว แทนการเรียกแบบแยกสองครั้ง

    Plugin ช่องทาง downstream (Slack, Discord, Matrix, MS Teams) ได้เปลี่ยนแล้ว

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` เป็น compatibility shim สำหรับ
    Plugin ช่องทางรุ่นเก่า อย่าอิมพอร์ตจากโค้ดใหม่ ให้ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับการลงทะเบียน object
    runtime

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions`
    ถูกเลิกใช้พร้อมกับ export ช่องทาง "actions" แบบดิบ ให้เปิดเผย capability
    ผ่านพื้นผิว `presentation` เชิงความหมายแทน — Plugin ช่องทางประกาศสิ่งที่
    มัน render (cards, buttons, selects) แทนชื่อ action ดิบที่มันยอมรับ

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **เก่า**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`.

    **ใหม่**: implement `createTool(...)` โดยตรงบน provider Plugin
    OpenClaw ไม่ต้องใช้ตัวช่วย SDK เพื่อลงทะเบียน tool wrapper อีกต่อไป

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **เก่า**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) เพื่อสร้าง prompt envelope
    แบบข้อความล้วนชนิดแบนจากข้อความช่องทางขาเข้า

    **ใหม่**: `BodyForAgent` พร้อมบล็อก user-context แบบมีโครงสร้าง
    Plugin ช่องทางแนบ routing metadata (thread, topic, reply-to, reactions)
    เป็นฟิลด์ที่มี type แทนการต่อสิ่งเหล่านี้เข้าไปใน prompt string
    ตัวช่วย `formatAgentEnvelope(...)` ยังคงรองรับสำหรับ envelope ที่สังเคราะห์
    เพื่อส่งให้ assistant แต่ envelope ขาเข้าแบบข้อความล้วนกำลังจะถูกเลิกใช้

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received`,
    และ Plugin ช่องทางแบบกำหนดเองใดๆ ที่ post-process ข้อความ
    `channelEnvelope`

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    type alias สำหรับ discovery สี่รายการตอนนี้เป็น wrapper บางๆ เหนือ type
    ยุค catalog:

    | Alias เก่า                | Type ใหม่                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึง static bag `ProviderCapabilities` แบบ legacy — provider Plugin
    ควรใช้ provider hooks ที่ชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas`, และ `wrapStreamFn` แทน object แบบ static

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **เก่า** (hooks แยกกันสามตัวบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, และ
    `resolveDefaultThinkingLevel(ctx)`.

    **ใหม่**: `resolveThinkingProfile(ctx)` ตัวเดียวที่คืนค่า
    `ProviderThinkingProfile` พร้อม `id` มาตรฐาน, `label` แบบ optional,
    และรายการ level ที่จัดอันดับแล้ว OpenClaw ลดระดับค่าที่บันทึกไว้ซึ่งล้าสมัย
    ตามอันดับของ profile โดยอัตโนมัติ

    implement hook เดียวแทนสามตัว hook legacy ยังทำงานได้ในช่วง deprecation
    window แต่จะไม่ถูก compose ร่วมกับผลลัพธ์ของ profile

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **เก่า**: implement `resolveExternalOAuthProfiles(...)` โดยไม่ประกาศ
    provider ใน manifest ของ Plugin

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน manifest ของ Plugin
    **และ** implement `resolveExternalAuthProfiles(...)` path "auth
    fallback" เก่าจะแสดงคำเตือนตอน runtime และจะถูกนำออก

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    ฟิลด์ manifest **เก่า**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **ใหม่**: mirror การ lookup env-var เดิมเข้าไปใน `setup.providers[].envVars`
    บน manifest สิ่งนี้รวม metadata env สำหรับ setup/status ไว้ในที่เดียว
    และหลีกเลี่ยงการบูต runtime ของ Plugin เพียงเพื่อตอบการ lookup env-var

    `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility adapter จนกว่า
    deprecation window จะปิดลง

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **เก่า**: การเรียกแยกกันสามครั้ง —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **ใหม่**: การเรียกครั้งเดียวบน memory-state API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    slot เดิมทั้งหมด การเรียกลงทะเบียนเดียว ตัวช่วย memory แบบ additive
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    type alias legacy สองรายการยัง export จาก `src/plugins/runtime/types.ts`:

    | เก่า                          | ใหม่                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    method runtime `readSession` ถูกเลิกใช้ โดยให้ใช้
    `getSessionMessages` แทน signature เดิม method เก่าจะเรียกต่อไปยัง
    method ใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **เก่า**: `runtime.tasks.flow` (เอกพจน์) คืนค่า accessor ของ task-flow
    แบบ live

    **ใหม่**: `runtime.tasks.managedFlows` เก็บ runtime สำหรับการ mutate
    TaskFlow แบบ managed สำหรับ Plugin ที่สร้าง อัปเดต ยกเลิก หรือรัน
    child tasks จาก flow ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเพียง
    การอ่านแบบ DTO-based

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ครอบคลุมไว้แล้วใน "วิธีย้าย → ย้าย extension สำหรับ tool-result ของ Pi
    ไปเป็น middleware" ด้านบน ใส่ไว้ที่นี่เพื่อความครบถ้วน: path เฉพาะ Pi
    ที่ถูกนำออก `api.registerEmbeddedExtensionFactory(...)` ถูกแทนที่ด้วย
    `api.registerAgentToolResultMiddleware(...)` พร้อมรายการ runtime
    ที่ชัดเจนใน `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` ที่ re-export จาก `openclaw/plugin-sdk` ตอนนี้เป็น
    alias บรรทัดเดียวสำหรับ `OpenClawConfig` ควรใช้ชื่อมาตรฐาน

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกใช้งานระดับ extension (ภายใน bundled channel/provider plugins ใต้
`extensions/`) ถูกติดตามภายใน barrel `api.ts` และ `runtime-api.ts`
ของแต่ละตัว สิ่งเหล่านี้ไม่กระทบสัญญา Plugin บุคคลที่สาม และไม่ได้แสดงรายการ
ไว้ที่นี่ หากคุณ consume local barrel ของ bundled Plugin โดยตรง
ให้อ่านคอมเมนต์การเลิกใช้งานใน barrel นั้นก่อนอัปเกรด
</Note>

## ไทม์ไลน์การนำออก

| เมื่อใด                | สิ่งที่จะเกิดขึ้น                                                       |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**             | พื้นผิวที่เลิกใช้แล้วแสดงคำเตือนตอน runtime                            |
| **major release ถัดไป** | พื้นผิวที่เลิกใช้แล้วจะถูกนำออก Plugin ที่ยังใช้อยู่จะล้มเหลว          |

Plugin หลักทั้งหมดถูกย้ายแล้ว Plugin ภายนอกควรย้ายก่อน major release ถัดไป

## การระงับคำเตือนชั่วคราว

ตั้งค่า environment variables เหล่านี้ระหว่างที่คุณทำงานย้าย:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นทางออกชั่วคราว ไม่ใช่วิธีแก้ถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) — สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) — reference การอิมพอร์ต subpath ทั้งหมด
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) — การสร้าง Plugin ช่องทาง
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง provider Plugin
- [Plugin Internals](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรม
- [Plugin Manifest](/th/plugins/manifest) — reference schema ของ manifest
