---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ให้ใช้สถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแล Plugin ภายนอกสำหรับ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง SDK ของ Plugin สมัยใหม่
title: การย้ายข้อมูล SDK ของ Plugin
x-i18n:
    generated_at: "2026-07-19T07:23:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50cd42eb7512d223d7693a9dbc99db27392bf2797e409d096bbcf11c59c1fd2b
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw แทนที่เลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้างด้วยสถาปัตยกรรม Plugin
สมัยใหม่ที่สร้างจากการนำเข้าแบบเล็กและเฉพาะเจาะจง หาก Plugin ของคุณมีอยู่ก่อน
การเปลี่ยนแปลงดังกล่าว คู่มือนี้จะช่วยย้ายไปใช้สัญญาปัจจุบัน

## สิ่งที่เปลี่ยนแปลง

เดิมมีพื้นผิวการนำเข้าแบบเปิดกว้างสองรายการที่ทำให้ Plugin เข้าถึงแทบทุกอย่างได้จาก
จุดเข้าใช้งานเดียว:

- **`openclaw/plugin-sdk/compat`** - ส่งออกตัวช่วยหลายสิบรายการซ้ำเพื่อให้
  Plugin รุ่นเก่าที่ใช้ hook ยังคงทำงานได้ระหว่างการสร้างสถาปัตยกรรมใหม่
- **`openclaw/plugin-sdk/infra-runtime`** - barrel แบบกว้างที่รวมเหตุการณ์ของระบบ
  สถานะ Heartbeat, คิวการส่ง, ตัวช่วย fetch/proxy, ตัวช่วยไฟล์
  ชนิดข้อมูลการอนุมัติ และยูทิลิตีที่ไม่เกี่ยวข้องเข้าด้วยกัน
- **`openclaw/plugin-sdk/config-runtime`** - barrel การกำหนดค่าแบบกว้างที่ยังคง
  มีตัวช่วยโหลด/เขียนโดยตรงซึ่งเลิกใช้แล้วในช่วงการย้ายระบบ
- **`openclaw/extension-api`** - สะพานที่ให้ Plugin เข้าถึง
  ตัวช่วยฝั่งโฮสต์โดยตรง เช่น ตัวเรียกใช้เอเจนต์แบบฝัง
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ที่ใช้เฉพาะกับตัวเรียกใช้แบบฝังและถูกนำออกแล้ว
  ซึ่งใช้สังเกตเหตุการณ์ของตัวเรียกใช้แบบฝัง เช่น `tool_result` ให้ใช้มิดเดิลแวร์
  ผลลัพธ์ของเครื่องมือเอเจนต์แทน (ดู [ย้ายส่วนขยายผลลัพธ์ของเครื่องมือแบบฝัง
  ไปยังมิดเดิลแวร์](#how-to-migrate))

พื้นผิวเหล่านี้ **เลิกใช้แล้ว** โดยยังคงทำงานได้ แต่ Plugin ใหม่ต้องไม่
ใช้งาน และ Plugin ที่มีอยู่ควรย้ายระบบก่อนรุ่นหลักถัดไป
จะนำพื้นผิวเหล่านี้ออก `registerEmbeddedExtensionFactory` ถูกนำออกแล้ว
และระบบจะไม่โหลดการลงทะเบียนแบบเดิมอีกต่อไป

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกนำออกในรุ่นหลักในอนาคต
  Plugin ที่ยังคงนำเข้าจากพื้นผิวเหล่านี้จะหยุดทำงานเมื่อถึงเวลานั้น
</Warning>

OpenClaw จะไม่นำพฤติกรรมของ Plugin ที่มีเอกสารกำกับออกหรือตีความใหม่ในการเปลี่ยนแปลงเดียวกับ
ที่เพิ่มสิ่งทดแทน การเปลี่ยนแปลงสัญญาที่ทำให้เกิดความไม่เข้ากันจะต้องผ่าน
อะแดปเตอร์ความเข้ากันได้ การวินิจฉัย เอกสาร และช่วงเวลาการประกาศเลิกใช้ก่อน
หลักการนี้ใช้กับการนำเข้า SDK, ฟิลด์ในไฟล์ manifest, API การตั้งค่า, hook และพฤติกรรม
การลงทะเบียนรันไทม์

### เหตุผล

- **การเริ่มทำงานช้า** - การนำเข้าตัวช่วยเพียงรายการเดียวทำให้โหลดโมดูลที่ไม่เกี่ยวข้องหลายสิบรายการ
- **การขึ้นต่อกันแบบวนซ้ำ** - การส่งออกซ้ำแบบกว้างทำให้เกิดวงจรการนำเข้า
  ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** - ไม่มีวิธีแยกการส่งออกที่เสถียรออกจากรายการภายใน

ขณะนี้ `openclaw/plugin-sdk/<subpath>` แต่ละรายการเป็นโมดูลขนาดเล็กที่ทำงานได้ด้วยตัวเอง
และมีสัญญาที่จัดทำเป็นเอกสาร

จุดเชื่อมต่ออำนวยความสะดวกของผู้ให้บริการแบบเดิมสำหรับช่องทางที่รวมมาให้ก็ถูกนำออกแล้วเช่นกัน -
ทางลัดของตัวช่วยที่ใช้ชื่อแบรนด์ช่องทางเป็นเพียงสิ่งอำนวยความสะดวกภายในโมโนรีโพส่วนตัว ไม่ใช่
สัญญา Plugin ที่เสถียร ให้ใช้พาธย่อย SDK ทั่วไปที่เฉพาะเจาะจงแทน ภายใน
พื้นที่ทำงานของ Plugin ที่รวมมาให้ ให้เก็บตัวช่วยที่ผู้ให้บริการเป็นเจ้าของไว้ใน
`api.ts` หรือ `runtime-api.ts` ของ Plugin นั้นเอง:

- Anthropic เก็บตัวช่วยสตรีมเฉพาะ Claude ไว้ในจุดเชื่อมต่อ `api.ts` /
  `contract-api.ts` ของตนเอง
- OpenAI เก็บตัวสร้างผู้ให้บริการ ตัวช่วยโมเดลเริ่มต้น และตัวสร้างผู้ให้บริการ
  แบบเรียลไทม์ไว้ใน `api.ts` ของตนเอง
- OpenRouter เก็บตัวสร้างผู้ให้บริการและตัวช่วยการเริ่มต้นใช้งาน/การกำหนดค่าไว้ใน
  `api.ts` ของตนเอง

## นโยบายความเข้ากันได้

งานด้านความเข้ากันได้ของ Plugin ภายนอกดำเนินตามลำดับนี้:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเดิมไว้โดยเชื่อมผ่านอะแดปเตอร์ความเข้ากันได้
3. แสดงข้อความวินิจฉัยหรือคำเตือนที่ระบุพาธเดิมและสิ่งทดแทน
4. ครอบคลุมทั้งสองพาธในการทดสอบ
5. จัดทำเอกสารการเลิกใช้และพาธการย้ายระบบ
6. นำออกหลังจากช่วงเวลาการย้ายระบบที่ประกาศไว้เท่านั้น โดยปกติจะเป็น
   รุ่นหลัก

หากฟิลด์ในไฟล์ manifest ยังคงได้รับการยอมรับ ให้ใช้งานต่อไปจนกว่าเอกสารและ
การวินิจฉัยจะระบุเป็นอย่างอื่น โค้ดใหม่ควรเลือกใช้สิ่งทดแทนที่จัดทำเป็นเอกสาร
ส่วน Plugin ที่มีอยู่ไม่ควรหยุดทำงานระหว่างการออกรุ่นย่อยตามปกติ

ตรวจสอบคิวการย้ายระบบปัจจุบันด้วย `pnpm plugins:boundary-report`:

| แฟล็ก                                                    | ผล                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (หรือ `pnpm plugins:boundary-report:summary`) | แสดงจำนวนแบบย่อแทนรายละเอียดทั้งหมด                                         |
| `--json`                                                | รายงานที่เครื่องอ่านได้                                                       |
| `--owner <id>`                                          | กรองให้เหลือ Plugin หรือเจ้าของความเข้ากันได้หนึ่งราย                         |
| `--fail-on-cross-owner`                                 | จบการทำงานด้วยสถานะไม่เป็นศูนย์เมื่อพบการนำเข้า SDK ที่สงวนไว้ข้ามเจ้าของ     |
| `--fail-on-eligible-compat`                             | จบการทำงานด้วยสถานะไม่เป็นศูนย์เมื่อวันที่ `removeAfter` ของระเบียนความเข้ากันได้ที่เลิกใช้แล้วผ่านไป |
| `--fail-on-unclassified-unused-reserved`                | จบการทำงานด้วยสถานะไม่เป็นศูนย์เมื่อพบ shim SDK ที่สงวนไว้แต่ไม่ได้ใช้งาน      |

`pnpm plugins:boundary-report:ci` ทำงานโดยเปิดใช้แฟล็กความล้มเหลวทั้งสามรายการ แต่ละ
ระเบียนความเข้ากันได้มีวันที่ `removeAfter` ที่ระบุชัดเจน (ไม่ใช่ข้อความคลุมเครือว่า "รุ่นหลัก
ถัดไป") รายงานจะจัดกลุ่มระเบียนที่เลิกใช้แล้วตามวันที่ดังกล่าว นับ
การอ้างอิงในโค้ด/เอกสารภายใน แสดงการนำเข้า SDK ที่สงวนไว้ข้ามเจ้าของ และ
สรุปสะพาน SDK ของโฮสต์หน่วยความจำส่วนตัว พาธย่อย SDK ที่สงวนไว้ต้องมี
การติดตามการใช้งานโดยเจ้าของ และควรนำการส่งออกที่สงวนไว้แต่ไม่ได้ใช้งานออกจาก
SDK สาธารณะ

## วิธีย้ายระบบ

<Steps>
  <Step title="ย้ายตัวช่วยโหลด/เขียนการกำหนดค่ารันไทม์">
    Plugin ที่รวมมาให้ควรหยุดเรียก `api.runtime.config.loadConfig()` และ
    `api.runtime.config.writeConfigFile(...)` โดยตรง ควรเลือกใช้การกำหนดค่าที่
    ส่งเข้ามาในพาธการเรียกที่ใช้งานอยู่แล้ว ตัวจัดการที่ทำงานระยะยาวและต้องใช้
    สแนปช็อตของกระบวนการปัจจุบันสามารถใช้ `api.runtime.config.current()` เครื่องมือ
    เอเจนต์ที่ทำงานระยะยาวควรอ่าน `ctx.getRuntimeConfig()` ภายใน `execute` เพื่อให้เครื่องมือ
    ที่สร้างก่อนการเขียนการกำหนดค่ายังคงเห็นการกำหนดค่าที่รีเฟรชแล้ว

    การเขียนการกำหนดค่าต้องผ่านตัวช่วยแบบทรานแซกชันพร้อมนโยบาย
    หลังการเขียนที่ระบุอย่างชัดเจน:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    ใช้ `afterWrite: { mode: "restart", reason: "..." }` เมื่อการเปลี่ยนแปลงต้องการ
    เริ่ม Gateway ใหม่ทั้งหมด และใช้ `afterWrite: { mode: "none", reason: "..." }`
    เฉพาะเมื่อผู้เรียกเป็นเจ้าของการดำเนินการต่อและตั้งใจระงับ
    ตัววางแผนการโหลดซ้ำ ผลลัพธ์การแก้ไขมีสรุป `followUp` แบบมีชนิดข้อมูลสำหรับ
    การทดสอบและการบันทึกล็อก โดย Gateway ยังคงรับผิดชอบการนำการเริ่มใหม่ไปใช้หรือ
    กำหนดเวลาเริ่มใหม่

    `loadConfig` และ `writeConfigFile` ยังคงเป็นตัวช่วยความเข้ากันได้ที่
    เลิกใช้แล้วสำหรับ Plugin ภายนอก และจะแจ้งเตือนหนึ่งครั้งด้วย
    รหัสความเข้ากันได้ `runtime-config-load-write` Plugin ที่รวมมาให้และโค้ด
    รันไทม์ของรีโพได้รับการป้องกันด้วย `pnpm check:deprecated-api-usage` และ
    `pnpm check:no-runtime-action-load-config`: การใช้งาน Plugin ใหม่ในระบบจริง
    จะล้มเหลวทันที การเขียนการกำหนดค่าโดยตรงจะล้มเหลว เมธอดเซิร์ฟเวอร์ Gateway ต้องใช้
    สแนปช็อตรันไทม์ของคำขอ ตัวช่วยการส่ง/การดำเนินการ/ไคลเอนต์ของช่องทางรันไทม์
    ต้องรับการกำหนดค่าจากขอบเขตของตน และโมดูลรันไทม์ที่ทำงานระยะยาว
    อนุญาตให้เรียก `loadConfig()` จากบริบทแวดล้อมได้ศูนย์ครั้ง

    โค้ด Plugin ใหม่ควรหลีกเลี่ยง barrel แบบกว้าง `openclaw/plugin-sdk/config-runtime`
    ให้ใช้พาธย่อยที่เฉพาะเจาะจงสำหรับงานนั้น:

    | สิ่งที่ต้องการ | การนำเข้า |
    | --- | --- |
    | ชนิดข้อมูลการกำหนดค่า เช่น `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | การตรวจสอบการกำหนดค่าที่โหลดแล้ว การค้นหาการกำหนดค่าจุดเข้า Plugin และการผสานการกำหนดค่า | `openclaw/plugin-sdk/plugin-config-runtime` |
    | การอ่านสแนปช็อตรันไทม์ปัจจุบัน | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | การเขียนการกำหนดค่า | `openclaw/plugin-sdk/config-mutation` |
    | ตัวช่วยที่เก็บเซสชัน | `openclaw/plugin-sdk/session-store-runtime` |
    | การกำหนดค่าตาราง Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | ตัวช่วยรันไทม์ของนโยบายกลุ่ม | `openclaw/plugin-sdk/runtime-group-policy` |
    | การแก้ไขค่าอินพุตข้อมูลลับ | `openclaw/plugin-sdk/secret-input-runtime` |
    | การแทนที่โมเดล/เซสชัน | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin ที่รวมมาให้และการทดสอบของ Plugin เหล่านั้นได้รับการป้องกันด้วยสแกนเนอร์ไม่ให้ใช้ barrel
    แบบกว้าง เพื่อให้การนำเข้าและ mock ยังคงจำกัดอยู่เฉพาะพฤติกรรมที่ต้องการ
    barrel ยังคงมีอยู่เพื่อความเข้ากันได้กับภายนอก แต่โค้ดใหม่ไม่ควร
    ขึ้นต่อ barrel นี้

  </Step>

  <Step title="ย้ายส่วนขยายผลลัพธ์ของเครื่องมือแบบฝังไปยังมิดเดิลแวร์">
    Plugin ที่รวมมาให้ต้องแทนที่ตัวจัดการผลลัพธ์เครื่องมือ
    `api.registerEmbeddedExtensionFactory(...)` ที่ใช้เฉพาะกับตัวเรียกใช้แบบฝังด้วย
    มิดเดิลแวร์ที่ไม่ขึ้นกับรันไทม์:

    ```typescript
    // เครื่องมือรันไทม์ OpenClaw และเครื่องมือแบบไดนามิกของรันไทม์ Codex (ผลลัพธ์อาจถูก
    // แปลง) ผลลัพธ์ของเครื่องมือเนทีฟ Codex จะถูกส่งต่อเพื่อการสังเกตด้วย
    // แต่เอาต์พุตที่แปลงแล้วจะไม่ไปถึงโมเดล เนื่องจากสัญญา hook
    // PostToolUse ของ Codex ไม่สามารถแทนที่การตอบกลับของเครื่องมือเนทีฟได้
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    อัปเดตไฟล์ manifest ของ Plugin พร้อมกัน:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin ที่ติดตั้งแล้วสามารถลงทะเบียนมิดเดิลแวร์ผลลัพธ์ของเครื่องมือได้เช่นกันเมื่อเปิดใช้
    อย่างชัดเจน และประกาศรันไทม์เป้าหมายทั้งหมดไว้ใน
    `contracts.agentToolResultMiddleware` การลงทะเบียนมิดเดิลแวร์ของ Plugin ที่ติดตั้งแล้ว
    แต่ไม่ได้ประกาศจะถูกปฏิเสธ

  </Step>

  <Step title="ย้ายตัวจัดการการอนุมัติแบบเนทีฟไปใช้ข้อเท็จจริงด้านความสามารถ">
    Plugin ช่องทางที่รองรับการอนุมัติเปิดเผยพฤติกรรมการอนุมัติแบบเนทีฟผ่าน
    `approvalCapability.nativeRuntime` ร่วมกับรีจิสทรีบริบท
    รันไทม์ที่ใช้ร่วมกัน:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้ายการตรวจสอบสิทธิ์/การส่งที่เฉพาะกับการอนุมัติออกจากการเชื่อมต่อแบบเดิม `plugin.auth` /
      `plugin.approvals` ไปยัง `approvalCapability`
    - `ChannelPlugin.approvals` ถูกนำออกจากสัญญา
      Plugin ช่องทางสาธารณะแล้ว ให้ย้ายฟิลด์การส่ง/เนทีฟ/การเรนเดอร์ไปยัง
      `approvalCapability`
    - `plugin.auth` ยังคงใช้สำหรับขั้นตอนการเข้าสู่ระบบ/ออกจากระบบของช่องทางเท่านั้น โดย core จะไม่
      อ่าน hook การตรวจสอบสิทธิ์สำหรับการอนุมัติจากจุดนั้นอีกต่อไป
    - ลงทะเบียนออบเจ็กต์รันไทม์ที่ช่องทางเป็นเจ้าของ (ไคลเอนต์ โทเค็น แอป Bolt)
      ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่งการแจ้งเตือนการเปลี่ยนเส้นทางที่ Plugin เป็นเจ้าของจากตัวจัดการการอนุมัติแบบเนทีฟ
      เพราะ core เป็นเจ้าของการแจ้งเตือนว่าถูกส่งไปที่อื่นจากผลลัพธ์การส่งจริง
    - เมื่อส่ง `channelRuntime` เข้าไปยัง `createChannelManager(...)` ให้ระบุ
      พื้นผิว `createPluginRuntime().channel` จริง โดยระบบจะปฏิเสธ stub
      ที่มีเพียงบางส่วน

    ดูรูปแบบความสามารถด้านการอนุมัติปัจจุบันที่ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

  </Step>

  <Step title="ตรวจสอบพฤติกรรมทางเลือกสำรองของ wrapper บน Windows">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn` wrapper
    `.cmd`/`.bat` บน Windows ที่แก้ไขไม่ได้จะล้มเหลวแบบปิด เว้นแต่คุณส่ง
    `allowShellFallback: true` อย่างชัดเจน:

    ```typescript
    // ก่อน
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // หลัง
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // ตั้งค่านี้เฉพาะสำหรับผู้เรียกด้านความเข้ากันได้ที่เชื่อถือได้ซึ่งตั้งใจ
      // ยอมรับทางเลือกสำรองที่ทำงานผ่านเชลล์
      allowShellFallback: true,
    });
    ```

    หากผู้เรียกของคุณไม่ได้ตั้งใจพึ่งพาทางเลือกสำรองผ่านเชลล์ อย่าตั้งค่า
    `allowShellFallback` และให้จัดการข้อผิดพลาดที่ถูกโยนออกมาแทน

  </Step>

  <Step title="ค้นหาการนำเข้าที่เลิกใช้แล้ว">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="แทนที่ด้วยการนำเข้าแบบเฉพาะเจาะจง">
    การส่งออกแต่ละรายการจากพื้นผิวเดิมจะเชื่อมโยงกับพาธการนำเข้าสมัยใหม่ที่เฉพาะเจาะจง:

    ```typescript
    // ก่อนหน้า (เลเยอร์ความเข้ากันได้ย้อนหลังที่เลิกใช้แล้ว)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // หลังจากนั้น (การนำเข้าแบบเจาะจงสมัยใหม่)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    สำหรับตัวช่วยฝั่งโฮสต์ ให้ใช้รันไทม์ Plugin ที่ฉีดเข้ามาแทน
    การนำเข้าโดยตรง:

    ```typescript
    // ก่อนหน้า (บริดจ์ extension-api ที่เลิกใช้แล้ว)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // หลังจากนั้น (รันไทม์ที่ฉีดเข้ามา)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    ใช้รูปแบบเดียวกันนี้กับตัวช่วยบริดจ์แบบเดิมอื่นๆ:

    | การนำเข้าเดิม | สิ่งที่ใช้แทนในปัจจุบัน |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ตัวช่วยพื้นที่จัดเก็บเซสชัน | `api.runtime.agent.session.*` |

  </Step>

  <Step title="แทนที่การนำเข้า infra-runtime แบบกว้าง">
    `openclaw/plugin-sdk/infra-runtime` ยังคงมีอยู่เพื่อความเข้ากันได้กับภายนอก
    แต่โค้ดใหม่ควรนำเข้าพื้นผิวแบบเจาะจงที่จำเป็นต้องใช้จริง:

    | สิ่งที่ต้องการ | การนำเข้า |
    | --- | --- |
    | ตัวช่วยคิวเหตุการณ์ระบบ | `openclaw/plugin-sdk/system-event-runtime` |
    | ตัวช่วยการปลุก เหตุการณ์ และการมองเห็นของ Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | การระบายคิวการส่งที่รอดำเนินการ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | ข้อมูลเทเลเมทรีกิจกรรมของช่องทาง | `openclaw/plugin-sdk/channel-activity-runtime` |
    | แคชขจัดข้อมูลซ้ำในหน่วยความจำและที่มีพื้นที่จัดเก็บถาวรรองรับ | `openclaw/plugin-sdk/dedupe-runtime` |
    | ตัวช่วยพาธไฟล์ภายในเครื่อง/สื่อที่ปลอดภัย | `openclaw/plugin-sdk/file-access-runtime` |
    | การดึงข้อมูลที่รับรู้ Dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | ตัวช่วยการดึงข้อมูลผ่านพร็อกซีและแบบมีการป้องกัน | `openclaw/plugin-sdk/fetch-runtime` |
    | ชนิดนโยบาย Dispatcher สำหรับ SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | ชนิดคำขอ/ผลการพิจารณาการอนุมัติ | `openclaw/plugin-sdk/approval-runtime` |
    | ตัวช่วยเพย์โหลดการตอบกลับและคำสั่งสำหรับการอนุมัติ | `openclaw/plugin-sdk/approval-reply-runtime` |
    | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `openclaw/plugin-sdk/error-runtime` |
    | การรอความพร้อมของการขนส่ง | `openclaw/plugin-sdk/transport-ready-runtime` |
    | ตัวช่วยโทเค็นที่ปลอดภัย | `openclaw/plugin-sdk/secure-random-runtime` |
    | การทำงานพร้อมกันของงานแบบอะซิงโครนัสที่มีขอบเขต | `openclaw/plugin-sdk/concurrency-runtime` |
    | การยืนยันค่าที่จำเป็นสำหรับอินแวเรียนต์ที่พิสูจน์ได้ | `openclaw/plugin-sdk/expect-runtime` |
    | การบังคับแปลงเป็นตัวเลข | `openclaw/plugin-sdk/number-runtime` |
    | ล็อกอะซิงโครนัสภายในโพรเซส | `openclaw/plugin-sdk/async-lock-runtime` |
    | ล็อกไฟล์ | `openclaw/plugin-sdk/file-lock` |

    Plugin ที่รวมมาในชุดมีตัวสแกนป้องกันการใช้ `infra-runtime` ดังนั้นโค้ดในรีโป
    จึงไม่สามารถถอยกลับไปใช้ barrel แบบกว้างได้

  </Step>

  <Step title="ย้ายตัวช่วยเส้นทางช่องทาง">
    โค้ดเส้นทางช่องทางใหม่ใช้ `openclaw/plugin-sdk/channel-route` ส่วนชื่อ
    คีย์เส้นทางแบบเก่ายังคงอยู่ในฐานะนามแฝงเพื่อความเข้ากันได้:

    | ตัวช่วยเดิม | ตัวช่วยปัจจุบัน |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    ตัวช่วยเส้นทางสมัยใหม่ปรับ `{ channel, to, accountId, threadId }`
    ให้เป็นมาตรฐานอย่างสอดคล้องกันทั้งในการอนุมัติแบบเนทีฟ การระงับการตอบกลับ
    การขจัดข้อมูลขาเข้าซ้ำ การส่งผ่าน Cron และการกำหนดเส้นทางเซสชัน

    อย่าเพิ่มการใช้งานใหม่ของ `ChannelMessagingAdapter.parseExplicitTarget` หรือ
    `resolveChannelRouteTargetWithParser(...)` จาก
    `plugin-sdk/channel-route` เนื่องจากสิ่งเหล่านี้เลิกใช้แล้วและยังคงอยู่เฉพาะสำหรับ
    Plugin รุ่นเก่า Plugin ช่องทางใหม่ควรใช้
    `messaging.targetResolver.resolveTarget(...)` สำหรับการปรับ ID เป้าหมาย
    ให้เป็นมาตรฐานและการสำรองเมื่อไม่พบในไดเรกทอรี
    ใช้ `messaging.inferTargetChatType(...)` เมื่อแกนหลักต้องทราบชนิดของเพียร์ตั้งแต่เนิ่นๆ
    และใช้ `messaging.resolveOutboundSessionRoute(...)` สำหรับอัตลักษณ์
    เซสชันและเธรดแบบเนทีฟของผู้ให้บริการ

  </Step>

  <Step title="บิลด์และทดสอบ">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงพาธการนำเข้า

  <Accordion title="Common import path table">
  | พาธนำเข้า | วัตถุประสงค์ | รายการส่งออกหลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วยจุดเริ่มต้น Plugin มาตรฐาน | `definePluginEntry` |
  | `plugin-sdk/core` | การส่งออกซ้ำแบบรวมดั้งเดิมสำหรับข้อกำหนด/ตัวสร้างจุดเริ่มต้นของช่องทาง | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | การส่งออกสคีมาคอนฟิกราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วยจุดเริ่มต้นสำหรับผู้ให้บริการรายเดียว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | ข้อกำหนดและตัวสร้างจุดเริ่มต้นของช่องทางแบบเฉพาะเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
  | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดการตั้งค่าที่ใช้ร่วมกัน | ตัวแปลการตั้งค่า พรอมต์รายการที่อนุญาต และตัวสร้างสถานะการตั้งค่า |
  | `plugin-sdk/setup-runtime` | ตัวช่วยรันไทม์ระหว่างการตั้งค่า | `createSetupTranslator`, อะแดปเตอร์แพตช์การตั้งค่าที่ปลอดภัยต่อการนำเข้า, ตัวช่วยหมายเหตุการค้นหา, `promptResolvedAllowFrom`, `splitSetupEntries`, พร็อกซีการตั้งค่าแบบมอบหมาย |
  | `plugin-sdk/setup-adapter-runtime` | นามแฝงอะแดปเตอร์การตั้งค่าที่เลิกใช้แล้ว | ใช้ `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | ตัวช่วยเครื่องมือการตั้งค่า | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/คอนฟิก/เกตการดำเนินการ |
  | `plugin-sdk/account-id` | ตัวช่วยรหัสบัญชี | `DEFAULT_ACCOUNT_ID`, การปรับรหัสบัญชีให้เป็นมาตรฐาน |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี | ตัวช่วยค้นหาบัญชีและการใช้ค่าเริ่มต้นสำรอง |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบเฉพาะเจาะจง | ตัวช่วยรายการบัญชี/การดำเนินการกับบัญชี |
  | `plugin-sdk/channel-setup` | อะแดปเตอร์วิซาร์ดการตั้งค่า | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | องค์ประกอบพื้นฐานของการจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเชื่อมต่อคำนำหน้าการตอบกลับ สถานะกำลังพิมพ์ และการส่งจากแหล่งที่มา | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | แฟกทอรีอะแดปเตอร์คอนฟิกและตัวช่วยการเข้าถึง DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้างสคีมาคอนฟิก | เฉพาะองค์ประกอบพื้นฐานของสคีมาคอนฟิกช่องทางที่ใช้ร่วมกันและตัวสร้างทั่วไป |
  | `plugin-sdk/bundled-channel-config-schema` | สคีมาคอนฟิกที่รวมมาให้ | เฉพาะ Plugin ที่รวมมาให้และดูแลโดย OpenClaw เท่านั้น Plugin ใหม่ต้องกำหนดสคีมาภายใน Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | สคีมาคอนฟิกที่รวมมาให้ซึ่งเลิกใช้แล้ว | นามแฝงเพื่อความเข้ากันได้เท่านั้น ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ Plugin ที่รวมมาให้และยังได้รับการดูแล |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคอนฟิกคำสั่ง Telegram | การปรับชื่อคำสั่งให้เป็นมาตรฐาน การตัดคำอธิบาย และการตรวจสอบรายการซ้ำ/ข้อขัดแย้ง |
  | `plugin-sdk/channel-policy` | การกำหนดนโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | ตัวช่วยเอนเวโลปขาเข้า | ตัวช่วยสร้างเส้นทางและเอนเวโลปที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-inbound` | ตัวช่วยรับข้อมูลขาเข้า | การสร้างบริบท การจัดรูปแบบ ราก ตัวรัน การส่งต่อการตอบกลับที่เตรียมไว้ และเพรดิเคตการส่งต่อ |
  | `plugin-sdk/messaging-targets` | พาธนำเข้าการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-targets` สำหรับตัวช่วยแยกวิเคราะห์เป้าหมายทั่วไป, `plugin-sdk/channel-route` สำหรับการเปรียบเทียบเส้นทาง และ `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` ที่ Plugin เป็นเจ้าของสำหรับการกำหนดเป้าหมายเฉพาะผู้ให้บริการ |
  | `plugin-sdk/outbound-media` | ตัวช่วยสื่อขาออก | การโหลดสื่อขาออกที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | ตัวช่วยวงจรชีวิตข้อความขาออก | อะแดปเตอร์ข้อความ ใบรับ การส่งแบบคงทน ตัวช่วยแสดงตัวอย่างสด/สตรีมมิง ตัวเลือกการตอบกลับ ตัวช่วยวงจรชีวิต ข้อมูลประจำตัวขาออก และการวางแผนเพย์โหลด |
  | `plugin-sdk/channel-streaming` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยผูกเธรด | ตัวช่วยวงจรชีวิตและอะแดปเตอร์การผูกเธรด |
  | `plugin-sdk/agent-media-payload` | ตัวช่วยเพย์โหลดสื่อแบบดั้งเดิม | ตัวสร้างเพย์โหลดสื่อของเอเจนต์สำหรับโครงสร้างฟิลด์แบบดั้งเดิม |
  | `plugin-sdk/channel-runtime` | ชิมความเข้ากันได้ที่เลิกใช้แล้ว | เฉพาะยูทิลิตีรันไทม์ช่องทางแบบดั้งเดิม |
  | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การส่ง | ชนิดผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | พื้นที่จัดเก็บ Plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วยรันไทม์แบบกว้าง | ตัวช่วยรันไทม์/การบันทึกล็อก/การสำรองข้อมูล/การติดตั้ง Plugin |
  | `plugin-sdk/runtime-env` | ตัวช่วยสภาพแวดล้อมรันไทม์แบบเฉพาะเจาะจง | ตัวช่วยตัวบันทึกล็อก/สภาพแวดล้อมรันไทม์ การหมดเวลา การลองใหม่ และการหน่วงแบบถอยกลับ |
  | `plugin-sdk/plugin-runtime` | ตัวช่วยรันไทม์ Plugin ที่ใช้ร่วมกัน | ตัวช่วยคำสั่ง/ฮุก/HTTP/การโต้ตอบของ Plugin |
  | `plugin-sdk/hook-runtime` | ตัวช่วยไปป์ไลน์ฮุก | ตัวช่วยไปป์ไลน์ Webhook/ฮุกภายในที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วยรันไทม์แบบโหลดเมื่อใช้ | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วยกระบวนการ | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วยรันไทม์ CLI | การจัดรูปแบบคำสั่ง การรอ และตัวช่วยเวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | ไคลเอนต์ Gateway ตัวช่วยเริ่มทำงานเมื่อวงรอบเหตุการณ์พร้อม การกำหนดโฮสต์ LAN ที่ประกาศ และตัวช่วยแพตช์สถานะช่องทาง |
  | `plugin-sdk/config-runtime` | ชิมความเข้ากันได้ของคอนฟิกที่เลิกใช้แล้ว | ควรใช้ `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` และ `config-mutation` |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram ที่คงเสถียรเมื่อใช้ค่าทดแทน ในกรณีที่พื้นผิวสัญญา Telegram ที่รวมมาให้ไม่พร้อมใช้งาน |
  | `plugin-sdk/approval-runtime` | ตัวช่วยพรอมต์การอนุมัติ | เพย์โหลดการอนุมัติ exec/Plugin ตัวช่วยความสามารถ/โปรไฟล์การอนุมัติ ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติแบบเนทีฟ และการจัดรูปแบบพาธแสดงการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วยการยืนยันสิทธิ์การอนุมัติ | การกำหนดผู้อนุมัติ การยืนยันสิทธิ์การดำเนินการในแชตเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วยไคลเอนต์การอนุมัติ | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบเนทีฟ |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วยส่งมอบการอนุมัติ | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติแบบเนทีฟ |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย Gateway สำหรับการอนุมัติ | ตัวกำหนด Gateway สำหรับการอนุมัติที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-reference-runtime` | การอ้างอิงการขนส่งสำหรับการอนุมัติ | ตัวช่วยตัวระบุแบบถาวรที่ให้ผลลัพธ์แน่นอนสำหรับคอลแบ็กที่ถูกจำกัดโดยการขนส่ง |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยอะแดปเตอร์การอนุมัติ | ตัวช่วยแบบน้ำหนักเบาสำหรับโหลดอะแดปเตอร์การอนุมัติแบบเนทีฟที่จุดเริ่มต้นช่องทางซึ่งใช้งานบ่อย |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วยตัวจัดการการอนุมัติ | ตัวช่วยรันไทม์ตัวจัดการการอนุมัติแบบกว้างกว่า ควรใช้รอยต่ออะแดปเตอร์/Gateway ที่เฉพาะเจาะจงกว่าเมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติ | ตัวช่วยผูกเป้าหมาย/บัญชีสำหรับการอนุมัติแบบเนทีฟ |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วยตอบกลับการอนุมัติ | ตัวช่วยเพย์โหลดตอบกลับการอนุมัติ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วยบริบทรันไทม์ช่องทาง | ตัวช่วยทั่วไปสำหรับลงทะเบียน/รับ/เฝ้าดูบริบทรันไทม์ช่องทาง |
  | `plugin-sdk/security-runtime` | ตัวช่วยความปลอดภัย | ตัวช่วยที่ใช้ร่วมกันสำหรับความเชื่อถือ การควบคุม DM ไฟล์/พาธที่จำกัดอยู่ภายในราก เนื้อหาภายนอก และการรวบรวมข้อมูลลับ |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วยรายการโฮสต์ที่อนุญาตและนโยบายเครือข่ายส่วนตัว |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วยรันไทม์ SSRF | ดิสแพตเชอร์แบบปักหมุด การดึงข้อมูลแบบมีการป้องกัน และตัวช่วยนโยบาย SSRF |
  | `plugin-sdk/system-event-runtime` | ตัวช่วยเหตุการณ์ระบบ | `enqueueSystemEvent` (รวมการแทนที่ตามคีย์), `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | ตัวช่วย Heartbeat | ตัวช่วยปลุก เหตุการณ์ และการมองเห็นของ Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยคิวการส่งมอบ | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | ตัวช่วยกิจกรรมช่องทาง | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | ตัวช่วยขจัดรายการซ้ำ | แคชขจัดรายการซ้ำในหน่วยความจำและแบบมีพื้นที่จัดเก็บถาวรรองรับ |
  | `plugin-sdk/file-access-runtime` | ตัวช่วยเข้าถึงไฟล์ | ตัวช่วยพาธไฟล์/สื่อภายในเครื่องที่ปลอดภัย |
  | `plugin-sdk/transport-ready-runtime` | ตัวช่วยความพร้อมของการขนส่ง | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยนโยบายการอนุมัติ exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | ตัวช่วยแคชแบบมีขอบเขต | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วยควบคุมการวินิจฉัย | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วยข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วยกราฟข้อผิดพลาด, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch/พร็อกซีแบบห่อหุ้ม | `resolveFetch`, ตัวช่วยพร็อกซี, ตัวช่วยตัวเลือก EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | ตัวช่วยปรับโฮสต์ให้เป็นมาตรฐาน | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วยการลองใหม่ | `RetryConfig`, `retryAsync`, ตัวรันนโยบาย |
  | `plugin-sdk/allow-from` | การจัดรูปแบบรายการที่อนุญาตและการแมปอินพุต | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | ตัวช่วยควบคุมคำสั่งและพื้นผิวคำสั่ง | `resolveControlCommandGate`, ตัวช่วยการอนุญาตผู้ส่ง และตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก |
  | `plugin-sdk/command-status` | ตัวเรนเดอร์สถานะ/วิธีใช้คำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์อินพุตข้อมูลลับ | ตัวช่วยอินพุตข้อมูลลับ |
  | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ Webhook | ยูทิลิตีเป้าหมาย Webhook |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วยป้องกันเนื้อหาคำขอ Webhook | ตัวช่วยอ่าน/จำกัดเนื้อหาคำขอ |
  | `plugin-sdk/reply-runtime` | รันไทม์การตอบกลับที่ใช้ร่วมกัน | การส่งต่อขาเข้า Heartbeat ตัววางแผนการตอบกลับ และการแบ่งส่วน |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยส่งต่อการตอบกลับแบบเฉพาะเจาะจง | การดำเนินการขั้นสุดท้าย การส่งต่อของผู้ให้บริการ และตัวช่วยป้ายกำกับการสนทนา |
  | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับ | `createChannelHistoryWindow`; การส่งออกเพื่อความเข้ากันได้ของตัวช่วยแมปที่เลิกใช้แล้ว เช่น `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผนการอ้างอิงการตอบกลับ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งส่วนการตอบกลับ | ตัวช่วยแบ่งส่วนข้อความ/Markdown |
  | `plugin-sdk/session-store-runtime` | ตัวช่วยพื้นที่จัดเก็บเซสชัน | ตัวช่วยแถวเซสชันแบบกำหนดขอบเขต ตัวช่วยพาธพื้นที่จัดเก็บ และการอ่านเวลาที่อัปเดต |
  | `plugin-sdk/state-paths` | ตัวช่วยพาธสถานะ | ตัวช่วยไดเรกทอรีสถานะและ OAuth |
  | `plugin-sdk/routing` | ตัวช่วยการกำหนดเส้นทาง/คีย์เซสชัน | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วยปรับคีย์เซสชันให้เป็นมาตรฐาน |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะช่องทาง | ตัวสร้างสรุปสถานะช่องทาง/บัญชี ค่าเริ่มต้นของสถานะรันไทม์ และตัวช่วยข้อมูลเมตาของปัญหา |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วยกำหนดเป้าหมาย | ตัวช่วยกำหนดเป้าหมายที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วยปรับสตริงให้เป็นมาตรฐาน | ตัวช่วยปรับ slug/สตริงให้เป็นมาตรฐาน |
  | `plugin-sdk/request-url` | ตัวช่วย URL คำขอ | แยก URL แบบสตริงจากอินพุตที่มีลักษณะเป็นคำขอ |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบจับเวลา | ตัวรันคำสั่งแบบจับเวลาพร้อม stdout/stderr ที่ปรับให้เป็นมาตรฐาน |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปของเครื่องมือ/CLI |
  | `plugin-sdk/tool-payload` | การแยกเพย์โหลดเครื่องมือ | แยกเพย์โหลดที่ปรับให้เป็นมาตรฐานจากออบเจ็กต์ผลลัพธ์ของเครื่องมือ |
  | `plugin-sdk/tool-send` | การแยกข้อมูลการส่งของเครื่องมือ | แยกฟิลด์เป้าหมายการส่งมาตรฐานจากอาร์กิวเมนต์ของเครื่องมือ |
  | `plugin-sdk/temp-path` | ตัวช่วยพาธชั่วคราว | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | ตัวช่วยการบันทึกล็อก | ตัวบันทึกล็อกระบบย่อยและตัวช่วยปกปิดข้อมูล |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วยตาราง Markdown | ตัวช่วยโหมดตาราง Markdown |
  | `plugin-sdk/reply-payload` | ชนิดการตอบกลับข้อความ | ชนิดเพย์โหลดการตอบกลับ |
  | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการภายในเครื่อง/โฮสต์เองที่คัดสรรไว้ | ตัวช่วยค้นหา/คอนฟิกผู้ให้บริการแบบโฮสต์เอง |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI ซึ่งเน้นเฉพาะด้าน | ตัวช่วยค้นหา/คอนฟิกผู้ให้บริการแบบโฮสต์เองชุดเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการยืนยันตัวตนรันไทม์ของผู้ให้บริการ | ตัวช่วยกำหนด API key ระหว่างรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วยตั้งค่า API key ของผู้ให้บริการ | ตัวช่วยเริ่มต้นใช้งาน API key/เขียนโปรไฟล์ |
  | `plugin-sdk/provider-auth-result` | ตัวช่วยผลลัพธ์การยืนยันตัวตนของผู้ให้บริการ | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยเลือกผู้ให้บริการ | การเลือกผู้ให้บริการที่คอนฟิกไว้หรือแบบอัตโนมัติ และการผสานคอนฟิกผู้ให้บริการดิบ |
  | `plugin-sdk/provider-env-vars` | ตัวช่วยตัวแปรสภาพแวดล้อมของผู้ให้บริการ | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
  | `plugin-sdk/provider-model-shared` | ตัวช่วยโมเดล/การเล่นซ้ำของผู้ให้บริการที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบายการเล่นซ้ำที่ใช้ร่วมกัน, ตัวช่วยเอนด์พอยต์ของผู้ให้บริการ และตัวช่วยปรับรหัสโมเดลให้เป็นมาตรฐาน |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วยแค็ตตาล็อกผู้ให้บริการที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์การเริ่มต้นใช้งานผู้ให้บริการ | ตัวช่วยการกำหนดค่าการเริ่มต้นใช้งาน |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของผู้ให้บริการ | ตัวช่วยความสามารถ HTTP/เอนด์พอยต์ทั่วไปของผู้ให้บริการ รวมถึงตัวช่วยฟอร์ม multipart สำหรับการถอดเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วยการดึงข้อมูลเว็บของผู้ให้บริการ | ตัวช่วยการลงทะเบียน/แคชผู้ให้บริการดึงข้อมูลเว็บ |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่าการค้นหาเว็บของผู้ให้บริการ | ตัวช่วยการกำหนดค่า/ข้อมูลประจำตัวสำหรับการค้นหาเว็บแบบขอบเขตแคบ สำหรับผู้ให้บริการที่ไม่ต้องเชื่อมโยงการเปิดใช้ Plugin |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญาการค้นหาเว็บของผู้ให้บริการ | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลประจำตัวสำหรับการค้นหาเว็บแบบขอบเขตแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลประจำตัวแบบจำกัดขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วยการค้นหาเว็บของผู้ให้บริการ | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการค้นหาเว็บ |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของเครื่องมือ/สคีมาผู้ให้บริการ | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา + การวินิจฉัยสำหรับ DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานของผู้ให้บริการ | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และตัวช่วยการใช้งานอื่นๆ ของผู้ให้บริการ |
  | `plugin-sdk/provider-stream` | ตัวช่วยตัวห่อหุ้มสตรีมของผู้ให้บริการ | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดตัวห่อหุ้มสตรีม และตัวช่วยตัวห่อหุ้มที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วยการขนส่งของผู้ให้บริการ | ตัวช่วยการขนส่งแบบเนทีฟของผู้ให้บริการ เช่น การดึงข้อมูลที่มีตัวป้องกัน การแยกข้อความผลลัพธ์ของเครื่องมือ การแปลงข้อความการขนส่ง และสตรีมเหตุการณ์การขนส่งที่เขียนได้ |
  | `plugin-sdk/keyed-async-queue` | คิวอะซิงโครนัสแบบเรียงลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วยดึงข้อมูล/แปลง/จัดเก็บสื่อ การตรวจสอบขนาดวิดีโอโดยใช้ ffprobe และตัวสร้างเพย์โหลดสื่อ |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสร้างสื่อที่ใช้ร่วมกัน | ตัวช่วยการสลับสำรองที่ใช้ร่วมกัน การเลือกตัวเลือก และข้อความแจ้งเมื่อไม่มีโมเดลสำหรับการสร้างรูปภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วยการทำความเข้าใจสื่อ | ชนิดผู้ให้บริการสำหรับการทำความเข้าใจสื่อ รวมถึงเอ็กซ์พอร์ตตัวช่วยรูปภาพ/เสียงสำหรับผู้ให้บริการ |
  | `plugin-sdk/text-runtime` | เอ็กซ์พอร์ตความเข้ากันได้แบบกว้างสำหรับข้อความที่เลิกใช้แล้ว | ใช้ `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` และ `logging-core` |
  | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งข้อความเป็นส่วน | ตัวช่วยแบ่งข้อความขาออกและช่วงข้อมูลโดยรักษาออฟเซ็ต |
  | `plugin-sdk/speech` | ตัวช่วยเสียงพูด | ชนิดผู้ให้บริการเสียงพูด รวมถึงตัวช่วยคำสั่งกำกับ รีจิสทรี และการตรวจสอบสำหรับผู้ให้บริการ และตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/speech-core` | แกนเสียงพูดที่ใช้ร่วมกัน | ชนิดผู้ให้บริการเสียงพูด รีจิสทรี คำสั่งกำกับ และการปรับให้เป็นมาตรฐาน |
  | `plugin-sdk/speech-settings` | การตั้งค่าเสียงพูด | พื้นฐานขนาดเบาสำหรับการแก้ไขและปรับการกำหนดค่า TTS ให้เป็นมาตรฐาน โดยไม่มีรีจิสทรีผู้ให้บริการหรือรันไทม์การสังเคราะห์ |
  | `plugin-sdk/realtime-transcription` | ตัวช่วยการถอดเสียงแบบเรียลไทม์ | ชนิดผู้ให้บริการ ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วยเสียงแบบเรียลไทม์ | ชนิดผู้ให้บริการ ตัวช่วยรีจิสทรี/การแก้ไข ตัวช่วยเซสชันบริดจ์ ชุดทดสอบเซสชันที่ไม่ขึ้นกับการขนส่ง เกตพลังงานเสียง/จุดเริ่มต้นเสียงพูด คิวตอบกลับด้วยเสียงของเอเจนต์ที่ใช้ร่วมกัน การควบคุมเสียงของการทำงานที่แอ็กทีฟ สถานะความสมบูรณ์ของบทถอดเสียง/เหตุการณ์ การระงับเสียงสะท้อน การจับคู่คำถามปรึกษา การประสานงานการบังคับปรึกษา การติดตามบริบทของเทิร์น การติดตามกิจกรรมเอาต์พุต และตัวช่วยปรึกษาบริบทอย่างรวดเร็ว |
  | `plugin-sdk/image-generation` | ตัวช่วยการสร้างรูปภาพ | ชนิดผู้ให้บริการสร้างรูปภาพ รวมถึงตัวช่วยแอสเซ็ตรูปภาพ/URL ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/image-generation-core` | แกนการสร้างรูปภาพที่ใช้ร่วมกัน | ชนิดการสร้างรูปภาพ การสลับสำรอง การยืนยันตัวตน และตัวช่วยรีจิสทรี |
  | `plugin-sdk/music-generation` | ตัวช่วยการสร้างเพลง | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
  | `plugin-sdk/music-generation-core` | แกนการสร้างเพลงที่ใช้ร่วมกัน | ชนิดการสร้างเพลง ตัวช่วยการสลับสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
  | `plugin-sdk/video-generation` | ตัวช่วยการสร้างวิดีโอ | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
  | `plugin-sdk/video-generation-core` | แกนการสร้างวิดีโอที่ใช้ร่วมกัน | ชนิดการสร้างวิดีโอ ตัวช่วยการสลับสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
  | `plugin-sdk/interactive-runtime` | ตัวช่วยการตอบกลับแบบโต้ตอบ | การปรับ/ลดรูปเพย์โหลดการตอบกลับแบบโต้ตอบ |
  | `plugin-sdk/channel-config-primitives` | พื้นฐานการกำหนดค่าช่องทาง | พื้นฐานสคีมาการกำหนดค่าช่องทางแบบขอบเขตแคบ |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยเขียนการกำหนดค่าช่องทาง | ตัวช่วยการอนุญาตให้เขียนการกำหนดค่าช่องทาง |
  | `plugin-sdk/channel-plugin-common` | ส่วนเตรียมการช่องทางที่ใช้ร่วมกัน | เอ็กซ์พอร์ตส่วนเตรียมการของ Plugin ช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะช่องทาง | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วยการกำหนดค่ารายการอนุญาต | ตัวช่วยแก้ไข/อ่านการกำหนดค่ารายการอนุญาต |
  | `plugin-sdk/group-access` | ตัวช่วยการเข้าถึงกลุ่ม | ตัวช่วยการตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วยตัวป้องกัน DM โดยตรง | ตัวช่วยนโยบายตัวป้องกันก่อนการเข้ารหัสแบบขอบเขตแคบ |
  | `plugin-sdk/extension-shared` | ตัวช่วยส่วนขยายที่ใช้ร่วมกัน | พื้นฐานตัวช่วยช่องทางแบบพาสซีฟ/สถานะ และพร็อกซีแวดล้อม |
  | `plugin-sdk/webhook-targets` | ตัวช่วยเป้าหมาย Webhook | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
  | `plugin-sdk/webhook-path` | นามแฝงพาธ Webhook ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | ตัวช่วยสื่อเว็บที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่อง |
  | `plugin-sdk/zod` | การเอ็กซ์พอร์ตซ้ำเพื่อความเข้ากันได้กับ Zod ที่เลิกใช้แล้ว | นำเข้า `zod` จาก `zod` โดยตรง |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่รวมมาให้ | พื้นผิวตัวช่วยตัวจัดการ/การกำหนดค่า/ไฟล์/CLI ของหน่วยความจำ |
  | `plugin-sdk/memory-core-engine-runtime` | ฟาซาดรันไทม์เอนจินหน่วยความจำ | ฟาซาดรันไทม์สำหรับดัชนี/การค้นหาหน่วยความจำ |
  | `plugin-sdk/memory-core-host-embedding-registry` | รีจิสทรีการฝังหน่วยความจำ | ตัวช่วยรีจิสทรีผู้ให้บริการการฝังหน่วยความจำขนาดเบา |
  | `plugin-sdk/memory-core-host-engine-foundation` | เอนจินพื้นฐานของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจินพื้นฐานของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | เอนจินการฝังของโฮสต์หน่วยความจำ | สัญญาการฝังหน่วยความจำ การเข้าถึงรีจิสทรี ผู้ให้บริการภายในเครื่อง และตัวช่วยทั่วไปแบบแบตช์/ระยะไกล โดยผู้ให้บริการระยะไกลที่เฉพาะเจาะจงอยู่ใน Plugin ที่เป็นเจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | เอนจิน QMD ของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจิน QMD ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-storage` | เอนจินพื้นที่จัดเก็บของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจินพื้นที่จัดเก็บของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโมดัลของโฮสต์หน่วยความจำ | ตัวช่วยมัลติโมดัลของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วยการสืบค้นของโฮสต์หน่วยความจำ | ตัวช่วยการสืบค้นของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วยข้อมูลลับของโฮสต์หน่วยความจำ | ตัวช่วยข้อมูลลับของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-events` | นามแฝงเหตุการณ์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-cli` | รันไทม์ CLI ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-core` | รันไทม์แกนของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์แกนของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-core` | นามแฝงรันไทม์แกนของโฮสต์หน่วยความจำ | นามแฝงที่เป็นกลางต่อผู้จำหน่ายสำหรับตัวช่วยรันไทม์แกนของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-events` | นามแฝงบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ | นามแฝงที่เป็นกลางต่อผู้จำหน่ายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-files` | นามแฝงไฟล์/รันไทม์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย Markdown ที่มีการจัดการ | ตัวช่วย Markdown ที่มีการจัดการร่วมกันสำหรับ Plugin ที่เกี่ยวข้องกับหน่วยความจำ |
  | `plugin-sdk/memory-host-search` | ฟาซาดการค้นหา Active Memory | ฟาซาดรันไทม์ตัวจัดการการค้นหา Active Memory แบบโหลดเมื่อใช้ |
  | `plugin-sdk/memory-host-status` | นามแฝงสถานะโฮสต์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-status` |
</Accordion>

  ตารางนี้เป็นชุดย่อยการย้ายข้อมูลที่ใช้ร่วมกัน ไม่ใช่พื้นผิว SDK ทั้งหมด รายการ
  entrypoint ของคอมไพเลอร์อยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
  export ของแพ็กเกจสร้างขึ้นจากชุดย่อยสาธารณะ

  seam ของตัวช่วย Plugin แบบรวมชุดที่สงวนไว้ถูกเลิกใช้จากแผนผัง export ของ SDK สาธารณะแล้ว
  ยกเว้น facade ความเข้ากันได้ที่มีเอกสารระบุไว้อย่างชัดเจน เช่น
  shim `plugin-sdk/discord` ที่เลิกใช้แล้วแต่ยังคงไว้สำหรับ Plugin ภายนอกที่ยัง
  นำเข้าแพ็กเกจ `@openclaw/discord` ที่เผยแพร่โดยตรง ตัวช่วยเฉพาะเจ้าของ
  อยู่ภายในแพ็กเกจ Plugin ของเจ้าของนั้น ส่วนพฤติกรรมโฮสต์ที่ใช้ร่วมกันจะส่งผ่าน
  สัญญา SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`,
  `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`

  ใช้ import ที่แคบที่สุดซึ่งตรงกับงาน หากหา export ไม่พบ
  ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือสอบถามผู้ดูแลว่าสัญญา
  ทั่วไปใดควรเป็นเจ้าของรายการนั้น

  ## พื้นผิวความเข้ากันได้ที่นำออกแล้ว

  ### barrel ส่วนตัวสำหรับการทดสอบ

  `openclaw/plugin-sdk/testing` ใช้เฉพาะภายในรีโพและไม่รวมอยู่ในอาร์ติแฟกต์
  แพ็กเกจที่จัดส่ง จึงถูกนำออกก่อนวันที่ `removeAfter` ซึ่งกำหนดไว้เป็น 2026-07-28 การทดสอบในรีโพ
  ใช้ subpath แบบเจาะจง เช่น `plugin-sdk/plugin-test-runtime`,
  `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
  `plugin-sdk/test-env` และ `plugin-sdk/test-fixtures`

  ## รายการเลิกใช้ที่ยังมีผล

  รายการเลิกใช้ที่แคบลงทั่วทั้ง SDK ของ Plugin, สัญญาผู้ให้บริการ, พื้นผิว
  รันไทม์ และ manifest แต่ละรายการยังใช้งานได้ในปัจจุบัน แต่จะถูกนำออกใน
  รุ่นหลักในอนาคต ทุกรายการจับคู่ API เดิมกับตัวแทนมาตรฐาน

  <AccordionGroup>
  <Accordion title="ตัวสร้างวิธีใช้ command-auth -> command-status">
    **เดิม (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม,
    export เดิม เพียงนำเข้าจาก subpath ที่แคบกว่า `command-auth`
    จะ re-export รายการเหล่านี้เป็น stub สำหรับความเข้ากันได้

    ```typescript
    // ก่อน
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // หลัง
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="ตัวช่วยควบคุมการกล่าวถึง -> resolveInboundMentionDecision">
    **เดิม**: `resolveMentionGating(params)` และ
    `resolveMentionGatingWithBypass(params)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` ซึ่งเป็นออบเจ็กต์
    การตัดสินใจหนึ่งรายการแทนรูปแบบการเรียกสองแบบที่แยกกัน

    นำไปใช้แล้วใน Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp และ Zalo โมเดลเหตุการณ์ `app_mention` ของ Slack เอง
    ไม่ใช้ตัวช่วยนี้

  </Accordion>

  <Accordion title="shim รันไทม์ของช่องทางและตัวช่วยการดำเนินการของช่องทาง">
    `openclaw/plugin-sdk/channel-runtime` เป็น shim ความเข้ากันได้สำหรับ
    Plugin ช่องทางรุ่นเก่า อย่านำเข้าในโค้ดใหม่ ให้ใช้
    `openclaw/plugin-sdk/channel-runtime-context` เพื่อลงทะเบียนออบเจ็กต์
    รันไทม์

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions`
    ถูกเลิกใช้พร้อมกับ export ช่องทาง "actions" แบบดิบ ให้เปิดเผยความสามารถ
    ผ่านพื้นผิวเชิงความหมาย `presentation` แทน โดย Plugin ช่องทาง
    จะประกาศสิ่งที่ตนเรนเดอร์ (การ์ด ปุ่ม รายการเลือก) แทนชื่อการดำเนินการ
    แบบดิบที่ตนยอมรับ

  </Accordion>

  <Accordion title="ตัวช่วย tool() ของผู้ให้บริการค้นหาเว็บ -> createTool() บน Plugin">
    **เดิม**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`

    **ใหม่**: implement `createTool(...)` โดยตรงบน Plugin ผู้ให้บริการ
    OpenClaw ไม่ต้องใช้ตัวช่วย SDK เพื่อลงทะเบียน wrapper ของเครื่องมืออีกต่อไป

  </Accordion>

  <Accordion title="envelope ช่องทางแบบข้อความธรรมดา -> BodyForAgent">
    **เดิม**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (และ
    ฟิลด์ `channelEnvelope` บนออบเจ็กต์ข้อความขาเข้า) เพื่อสร้าง envelope
    พรอมต์ข้อความธรรมดาแบบแบนจากข้อความช่องทางขาเข้า

    **ใหม่**: `BodyForAgent` พร้อมบล็อกบริบทผู้ใช้แบบมีโครงสร้าง Plugin
    ช่องทางจะแนบข้อมูลเมตาการกำหนดเส้นทาง (เธรด หัวข้อ การตอบกลับ ปฏิกิริยา) เป็น
    ฟิลด์ที่มีชนิด แทนการต่อข้อมูลเหล่านั้นลงในสตริงพรอมต์ ตัวช่วย
    `formatAgentEnvelope(...)` ยังคงรองรับสำหรับ envelope ที่สังเคราะห์ขึ้น
    สำหรับผู้ช่วย แต่ envelope ขาเข้าแบบข้อความธรรมดากำลังจะถูก
    ยกเลิก

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received` และ Plugin
    ช่องทางแบบกำหนดเองใดๆ ที่ประมวลผลข้อความ envelope แบบเก่าภายหลัง

  </Accordion>

  <Accordion title="ฮุก deactivate -> gateway_stop">
    **เดิม**: `api.on("deactivate", handler)`

    **ใหม่**: `api.on("gateway_stop", handler)` สัญญาการล้างข้อมูล
    เมื่อปิดระบบเหมือนเดิม เปลี่ยนเฉพาะชื่อฮุก

    ```typescript
    // ก่อน
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // หลัง
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` ยังคงเชื่อมต่อเป็นชื่อแทนเพื่อความเข้ากันได้ที่เลิกใช้แล้ว จนกว่าจะ
    ถูกนำออกหลัง 2026-08-16

  </Accordion>

  <Accordion title="ฮุก subagent_spawning -> การผูกเธรดของแกนหลัก">
    **เดิม**: `api.on("subagent_spawning", handler)` ซึ่งคืนค่า
    `threadBindingReady` หรือ `deliveryOrigin`

    **ใหม่**: ให้แกนหลักเตรียมการผูก subagent `thread: true` ผ่าน
    อะแดปเตอร์การผูกเซสชันของช่องทาง ใช้ `api.on("subagent_spawned", handler)`
    เฉพาะเพื่อสังเกตการณ์หลังเริ่มทำงาน

    ```typescript
    // ก่อน
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // หลัง
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` และ
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` ยังคงมีอยู่เฉพาะเป็น
    พื้นผิวความเข้ากันได้ที่เลิกใช้แล้วระหว่างที่ Plugin ภายนอกย้ายระบบ และจะถูกนำออก
    หลัง 2026-08-30

  </Accordion>

  <Accordion title="ชนิดการค้นหาผู้ให้บริการ -> ชนิดแค็ตตาล็อกผู้ให้บริการ">
    alias ชนิดการค้นหาสี่รายการเป็น wrapper แบบบางของชนิดในยุค
    แค็ตตาล็อกแล้ว:

    | alias เดิม                 | ชนิดใหม่                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึงชุดข้อมูล static รุ่นเก่า `ProviderCapabilities` โดย Plugin ผู้ให้บริการ
    ควรใช้ฮุกผู้ให้บริการที่ชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas` และ `wrapStreamFn` แทนออบเจ็กต์ static

  </Accordion>

  <Accordion title="ฮุกนโยบายการคิด -> resolveThinkingProfile">
    **เดิม** (ฮุกแยกกันสามรายการบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` และ
    `resolveDefaultThinkingLevel(ctx)`

    **ใหม่**: `resolveThinkingProfile(ctx)` รายการเดียวที่คืนค่า
    `ProviderThinkingProfile` ซึ่งมี `id` มาตรฐาน, `label` ที่เป็นตัวเลือก และ
    รายการระดับที่จัดอันดับ OpenClaw จะลดระดับค่าที่จัดเก็บซึ่งล้าสมัยตามอันดับโปรไฟล์
    โดยอัตโนมัติ

    บริบทประกอบด้วย `provider`, `modelId`, `reasoning` ที่ผสานแล้วและเป็นตัวเลือก
    และข้อเท็จจริงของโมเดล `compat` ที่ผสานแล้วและเป็นตัวเลือก Plugin ผู้ให้บริการสามารถใช้
    ข้อเท็จจริงจากแค็ตตาล็อกเหล่านั้นเพื่อเปิดเผยโปรไฟล์เฉพาะโมเดล เฉพาะเมื่อสัญญา
    คำขอที่กำหนดค่าไว้รองรับเท่านั้น

    implement ฮุกเดียวแทนสามฮุก ฮุกรุ่นเก่ายังคงทำงานระหว่าง
    ช่วงการเลิกใช้ แต่จะไม่ถูกประกอบร่วมกับผลลัพธ์ของโปรไฟล์

  </Accordion>

  <Accordion title="ผู้ให้บริการการยืนยันตัวตนภายนอก -> contracts.externalAuthProviders">
    **เดิม**: implement ฮุกการยืนยันตัวตนภายนอกโดยไม่ประกาศผู้ให้บริการ
    ใน manifest ของ Plugin

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน manifest ของ Plugin
    **และ** implement `resolveExternalAuthProfiles(...)`

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="การค้นหาตัวแปรสภาพแวดล้อมของผู้ให้บริการ -> setup.providers[].envVars">
    ฟิลด์ manifest **เดิม**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`

    **ใหม่**: ทำสำเนาการค้นหาตัวแปรสภาพแวดล้อมเดียวกันไปยัง `setup.providers[].envVars`
    บน manifest วิธีนี้รวมข้อมูลเมตาตัวแปรสภาพแวดล้อมของการตั้งค่า/สถานะไว้ในที่เดียว
    และหลีกเลี่ยงการบูตรันไทม์ของ Plugin เพียงเพื่อตอบการค้นหาตัวแปรสภาพแวดล้อม

    `providerAuthEnvVars` ยังคงรองรับผ่านอะแดปเตอร์ความเข้ากันได้
    จนกว่าช่วงการเลิกใช้จะสิ้นสุด

  </Accordion>

  <Accordion title="การลงทะเบียน Plugin หน่วยความจำ -> registerMemoryCapability">
    **เดิม**: การเรียกแยกกันสามครั้ง ได้แก่ `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`

    **ใหม่**: การเรียกครั้งเดียวบน API สถานะหน่วยความจำ ได้แก่
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`

    สล็อตเดิม การเรียกลงทะเบียนครั้งเดียว ตัวช่วยพรอมต์และคลังข้อมูลแบบเพิ่มเติม
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="API ผู้ให้บริการ embedding ของหน่วยความจำ">
    **เดิม**: `api.registerMemoryEmbeddingProvider(...)` พร้อม
    `contracts.memoryEmbeddingProviders`

    **ใหม่**: `api.registerEmbeddingProvider(...)` พร้อม
    `contracts.embeddingProviders`

    สัญญาผู้ให้บริการ embedding ทั่วไปนำกลับมาใช้ใหม่นอกหน่วยความจำได้ และเป็น
    แนวทางที่รองรับสำหรับผู้ให้บริการรายใหม่ API การลงทะเบียนเฉพาะหน่วยความจำ
    ยังคงเชื่อมต่อไว้เป็นความเข้ากันได้ที่เลิกใช้แล้วระหว่างที่ผู้ให้บริการเดิม
    ย้ายระบบ การตรวจสอบ Plugin จะรายงานการใช้งานที่ไม่ได้รวมชุดว่าเป็นหนี้
    ด้านความเข้ากันได้

  </Accordion>

  <Accordion title="ผลลัพธ์การส่งช่องทางแบบดิบ -> OutboundDeliveryResult">
    **เดิม**: คืนค่า `{ ok, messageId, error }` ผ่าน
    `ChannelSendRawResult` และทำให้เป็นมาตรฐานด้วย
    `createRawChannelSendResultAdapter(...)`

    **ใหม่**: คืนค่าฟิลด์ `OutboundDeliveryResult` และแนบช่องทางด้วย
    `createAttachedChannelResultAdapter(...)` การส่งที่ล้มเหลวควร throw
    แทนการคืนค่าสตริงข้อผิดพลาด ชนิดผลลัพธ์แบบดิบยังคงใช้งานได้จนถึง
    รุ่นหลักถัดไปของ SDK ของ Plugin

  </Accordion>

  <Accordion title="เปลี่ยนชื่อชนิดข้อความเซสชันของ subagent">
    alias ชนิดรุ่นเก่าสองรายการที่ยัง export จาก `src/plugins/runtime/types.ts`:

    | เดิม                           | ใหม่                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    เมธอดรันไทม์ `readSession` ถูกเลิกใช้เพื่อเปลี่ยนไปใช้
    `getSessionMessages` signature เหมือนเดิม โดยเมธอดเดิมจะเรียกผ่านไปยัง
    เมธอดใหม่

  </Accordion>

  <Accordion title="API ไฟล์เซสชันและทรานสคริปต์ที่นำออกแล้ว">
    การเปลี่ยนเซสชัน/ทรานสคริปต์ไปใช้ SQLite จะนำออกหรือเลิกใช้ API ที่เปิดให้ Plugin
    เข้าถึงที่เก็บ `sessions.json` ที่ใช้งานอยู่, พาธทรานสคริปต์ JSONL หรือรายการ
    ไฟล์เซสชัน Plugin รันไทม์ควรใช้อัตลักษณ์เซสชันและตัวช่วยรันไทม์ของ SDK
    แทนการแก้ไขพาธหรือเปลี่ยนแปลงไฟล์ที่ใช้งานอยู่

    | พื้นผิวที่กำลังย้าย | ตัวแทน |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` และ `resolveSessionStoreEntry(...)` ที่เลิกใช้แล้ว | `getSessionEntry(...)`, `listSessionEntries(...)` และการเปลี่ยนแปลงเซสชันระดับแถว |
    | `resolveSessionFilePath(...)` ที่เลิกใช้แล้ว | อัตลักษณ์เซสชัน (`sessionKey`, `sessionId` และตัวช่วยเป้าหมายรันไทม์ของ SDK) รวมถึงเมธอด Gateway ที่ทำงานกับเซสชันปัจจุบัน |
    | `saveSessionStore(...)` ที่นำออกแล้ว | API รันไทม์เซสชันที่ Gateway เป็นเจ้าของ โดยโค้ด Plugin ควรร้องขอหรือเปลี่ยนแปลงสถานะเซสชันผ่านตัวช่วยรันไทม์/บริบทที่มีเอกสาร แทนการเขียนไฟล์ที่เก็บซึ่งใช้งานอยู่ |
    | `resolveSessionTranscriptPathInDir(...)` และ `resolveAndPersistSessionFile(...)` ที่นำออกแล้ว | อัตลักษณ์เซสชันและเมธอด Gateway ที่ทำงานกับเซสชันปัจจุบัน |
    | `readLatestAssistantTextFromSessionTranscript(...)` | ตัวอ่านทรานสคริปต์ที่อิงอัตลักษณ์ซึ่งเปิดเผยโดยบริบทรันไทม์ปัจจุบัน หรือเมธอดประวัติ/เซสชันของ Gateway เมื่อ Plugin อยู่นอกพาธเจ้าของทรานสคริปต์ |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` พร้อม `agentId`, `sessionKey` และ `sessionId` |
    | อินพุตการซิงค์หน่วยความจำ เช่น `sessionFiles` | แหล่งทรานสคริปต์/เซสชันที่อิงอัตลักษณ์ซึ่งโฮสต์จัดเตรียมให้ อย่าไล่ค้นไฟล์ JSONL ที่ใช้งานอยู่สำหรับเซสชันแบบสด |
    | ตัวเลือกรันไทม์ชื่อ `transcriptPath` หรือ `sessionFile` สำหรับเซสชันที่ใช้งานอยู่ | `sessionTarget`/ออบเจ็กต์เป้าหมายรันไทม์ที่มีอัตลักษณ์เซสชันซึ่งไม่ผูกกับรูปแบบพื้นที่จัดเก็บ |

    ไฟล์บทสนทนา JSONL แบบเดิมยังคงใช้ได้ในฐานะอาร์ติแฟกต์สำหรับการนำเข้า การเก็บถาวร การส่งออก และ
    การสนับสนุน แต่จะไม่ใช่สัญญารันไทม์แบบสถานะคงที่สำหรับ
    เซสชันที่ใช้งานอยู่อีกต่อไป

    Plugin อย่างเป็นทางการที่เผยแพร่พร้อมกับ `v2026.7.1-beta.5` ได้นำเข้าตัวช่วยที่เลิกใช้แล้วทั้งสี่รายการ
    ข้างต้น `openclaw/plugin-sdk/session-store-runtime` จะคงบริดจ์เดิมนี้ไว้อย่างครบถ้วนจนถึง
    2026-10-12 ส่วน Plugin ใหม่ต้องใช้ตัวแทนที่กำหนดไว้
    `resolveStorePath(...)` ยังคงเป็นตัวช่วย SDK ที่รองรับ และไม่อยู่ในการ
    เลิกใช้งานครั้งนี้

    `openclaw plugins inspect --all --runtime` รายงาน Plugin ที่ไม่ได้รวมมาในชุด ซึ่ง
    ข้อผิดพลาดในการโหลดหรือข้อมูลวินิจฉัยยังคงอ้างอิง API ไฟล์ที่ถูกนำออกเหล่านี้
    การตรวจสอบคำแนะนำ `@openclaw/plugin-inspector` ต้องใช้เวอร์ชัน `0.3.17` หรือ
    ใหม่กว่า เพื่อให้การสแกนแพ็กเกจภายนอกทำเครื่องหมายตัวช่วยเซสชันทั้งสโตร์
    ตัวช่วยพาธไฟล์เซสชัน เป้าหมายไฟล์บทสนทนาแบบเดิม และตัวช่วยบทสนทนา
    ระดับล่างก่อนเผยแพร่ด้วย

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **เดิม**: `runtime.tasks.flow` (เอกพจน์) ส่งคืนตัวเข้าถึง TaskFlow
    แบบสด

    **ใหม่**: `runtime.tasks.managedFlows` ยังคงรันไทม์การเปลี่ยนแปลง TaskFlow
    ที่มีการจัดการไว้สำหรับ Plugin ที่สร้าง อัปเดต ยกเลิก หรือเรียกใช้งานงานลูกจาก
    โฟลว์ ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเพียง
    การอ่านที่อิง DTO

    ```typescript
    // ก่อน
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // หลัง
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    นำออกหลังวันที่ 2026-07-26

  </Accordion>

  <Accordion title="แฟกทอรีส่วนขยายแบบฝัง -> มิดเดิลแวร์ผลลัพธ์เครื่องมือของเอเจนต์">
    กล่าวไว้ใน [วิธีย้ายระบบ](#how-to-migrate) ข้างต้น รวมไว้ที่นี่เพื่อ
    ความครบถ้วน: พาธ `api.registerEmbeddedExtensionFactory(...)` ที่ถูกนำออกและใช้เฉพาะกับตัวรันแบบฝัง
    ถูกแทนที่ด้วย `api.registerAgentToolResultMiddleware(...)` พร้อมรายการรันไทม์ที่ระบุอย่างชัดเจน
    ใน `contracts.agentToolResultMiddleware`
  </Accordion>

  <Accordion title="นามแฝง OpenClawSchemaType -> OpenClawConfig">
    `OpenClawSchemaType` ที่ส่งออกซ้ำจาก `openclaw/plugin-sdk` ปัจจุบันเป็น
    นามแฝงบรรทัดเดียวสำหรับ `OpenClawConfig` ควรใช้ชื่อมาตรฐาน

    ```typescript
    // ก่อน
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // หลัง
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกใช้ระดับส่วนขยาย (ภายใน Plugin ช่องทาง/ผู้ให้บริการที่รวมมาในชุดภายใต้
`extensions/`) จะติดตามภายใน barrel `api.ts` และ `runtime-api.ts`
ของแต่ละส่วน การเปลี่ยนแปลงเหล่านี้ไม่กระทบสัญญาของ Plugin จากบุคคลที่สามและไม่ได้แสดงไว้
ที่นี่ หากใช้ barrel ภายในของ Plugin ที่รวมมาในชุดโดยตรง โปรดอ่าน
ความคิดเห็นเกี่ยวกับการเลิกใช้ใน barrel นั้นก่อนอัปเกรด
</Note>

## การย้ายระบบ Talk และเสียงแบบเรียลไทม์

โค้ดเสียงแบบเรียลไทม์ โทรศัพท์ การประชุม และ Talk บนเบราว์เซอร์ใช้ตัวควบคุมเซสชัน Talk
ร่วมกันหนึ่งตัว ซึ่งส่งออกโดย `openclaw/plugin-sdk/realtime-voice`
ตัวควบคุมนี้เป็นเจ้าของ envelope เหตุการณ์ Talk ร่วม สถานะเทิร์นที่ใช้งานอยู่ สถานะการจับข้อมูล
สถานะเสียงขาออก ประวัติเหตุการณ์ล่าสุด และการปฏิเสธเทิร์นที่ล้าสมัย
Plugin ผู้ให้บริการเป็นเจ้าของเซสชันเรียลไทม์เฉพาะของผู้จำหน่าย Plugin การประชุมผ่านเบราว์เซอร์
ใช้ `openclaw/plugin-sdk/meeting-runtime` สำหรับกลไกของเซสชัน เบราว์เซอร์ เสียง โฮสต์ Node
การปรึกษาเอเจนต์ และสายสนทนาด้วยเสียง จากนั้นจึงใช้งาน `MeetingPlatformAdapter`
สำหรับกฎ URL สคริปต์ DOM การแมปการดำเนินการด้วยตนเอง คำบรรยาย การสร้าง และแผน
การโทรเข้า REST API ของแพลตฟอร์ม OAuth อาร์ติแฟกต์ ตัวเลือก และชื่อในโปรโตคอลยังคงอยู่ใน
Plugin แผนสิทธิ์ของเบราว์เซอร์จะได้รับ URL การประชุมที่ร้องขอ เพื่อให้แต่ละ
แพลตฟอร์มอนุญาตเฉพาะต้นทางที่รองรับอย่างเจาะจง รันไทม์เซสชันต้อง
ปรับสถานะความพร้อมใช้งานแบบสดเฉพาะแพลตฟอร์มให้เป็นมาตรฐานหลังยืนยันว่าออกจากเบราว์เซอร์แล้วด้วย
ฟิลด์บทสนทนาในอดีตอาจคงอยู่ได้ แต่ความพร้อมของคำบรรยายและเสียงต้อง
ไม่ยังคงทำงานหลังออกจากการประชุม

พื้นผิวทั้งหมดที่รวมมาในชุดทำงานบนตัวควบคุมร่วม ได้แก่ รีเลย์เบราว์เซอร์
การส่งต่อห้องที่มีการจัดการ เสียงแบบเรียลไทม์ของสายสนทนา STT แบบสตรีมของสายสนทนา Google
Meet แบบเรียลไทม์ และการกดเพื่อพูดแบบเนทีฟ Gateway ประกาศช่องเหตุการณ์ Talk แบบสดหนึ่งช่อง
ใน `hello-ok.features.events`: `talk.event`

โค้ดใหม่ไม่ควรเรียก `createTalkEventSequencer(...)` โดยตรง เว้นแต่
กำลังใช้งานอะแดปเตอร์ระดับล่างหรือฟิกซ์เจอร์ทดสอบ ให้ใช้ตัวควบคุมร่วมเพื่อให้
ไม่สามารถปล่อยเหตุการณ์ที่มีขอบเขตตามเทิร์นโดยไม่มีรหัสเทิร์นได้ การเรียก `turnEnd` /
`turnCancel` ที่ล้าสมัยไม่สามารถล้างเทิร์นที่ใช้งานอยู่ซึ่งใหม่กว่าได้ และเหตุการณ์
วงจรชีวิตเสียงขาออกจะสอดคล้องกันในระบบโทรศัพท์ การประชุม รีเลย์เบราว์เซอร์
การส่งต่อห้องที่มีการจัดการ และไคลเอนต์ Talk แบบเนทีฟ

รูปแบบ API สาธารณะ:

```typescript
// API เซสชัน Talk ที่ Gateway เป็นเจ้าของ
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

// API เซสชันผู้ให้บริการที่ไคลเอนต์เป็นเจ้าของ
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

เซสชัน WebRTC/เว็บซ็อกเก็ตผู้ให้บริการที่เบราว์เซอร์เป็นเจ้าของใช้ `talk.client.create`
เนื่องจากเบราว์เซอร์เป็นเจ้าของการเจรจากับผู้ให้บริการและการขนส่งสื่อ ขณะที่
Gateway เป็นเจ้าของข้อมูลประจำตัว คำสั่ง และนโยบายเครื่องมือ `talk.session.*` คือ
พื้นผิวร่วมที่ Gateway จัดการสำหรับเรียลไทม์ผ่านรีเลย์ Gateway การถอดเสียงผ่านรีเลย์
Gateway และเซสชัน STT/TTS แบบเนทีฟในห้องที่มีการจัดการ

ควรซ่อมแซมการกำหนดค่าแบบเดิมที่วางตัวเลือกเรียลไทม์ไว้ข้าง `talk.provider` /
`talk.providers` ด้วย `openclaw doctor --fix`; รันไทม์ Talk
จะไม่ตีความการกำหนดค่าผู้ให้บริการเสียงพูด/TTS ใหม่ให้เป็นการกำหนดค่าผู้ให้บริการเรียลไทม์

ชุดค่าผสม `talk.session.create` ที่รองรับถูกจำกัดให้มีจำนวนน้อยโดยตั้งใจ:

| โหมด            | การขนส่ง       | สมอง           | เจ้าของ              | หมายเหตุ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | เสียงจากผู้ให้บริการแบบสองทิศทางพร้อมกันที่บริดจ์ผ่าน Gateway; การเรียกเครื่องมือส่งผ่านเครื่องมือปรึกษาเอเจนต์           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT แบบสตรีมเท่านั้น ผู้เรียกส่งเสียงขาเข้าและรับเหตุการณ์บทถอดเสียง                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ห้องแบบเนทีฟ/ไคลเอนต์ | ห้องแบบกดเพื่อพูดและวิทยุสื่อสาร ซึ่งไคลเอนต์เป็นเจ้าของการจับข้อมูล/เล่นกลับ และ Gateway เป็นเจ้าของสถานะเทิร์น |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ห้องแบบเนทีฟ/ไคลเอนต์ | โหมดห้องสำหรับผู้ดูแลระบบเท่านั้น สำหรับพื้นผิวของบุคคลที่หนึ่งที่เชื่อถือได้ ซึ่งดำเนินการเครื่องมือของ Gateway โดยตรง                  |

แผนผังเมธอดสำหรับผู้อ่านที่กำลังย้ายจากตระกูล `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` รุ่นเก่า (นำออกทั้งหมดแล้ว):

| เดิม                              | ใหม่                                                      |
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

คำศัพท์ควบคุมแบบรวมยังถูกจำกัดให้แคบโดยตั้งใจเช่นกัน:

| เมธอด                          | ใช้กับ                                              | สัญญา                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | ผนวกชิ้นข้อมูลเสียง PCM แบบ base64 เข้ากับเซสชันผู้ให้บริการที่เป็นของการเชื่อมต่อ Gateway เดียวกัน                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | เริ่มเทิร์นผู้ใช้ในห้องที่มีการจัดการ                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | จบเทิร์นที่ใช้งานอยู่หลังตรวจสอบเทิร์นที่ล้าสมัย                                                                                                                                                                          |
| `talk.session.cancelTurn`       | เซสชันทั้งหมดที่ Gateway เป็นเจ้าของ                              | ยกเลิกงานจับข้อมูล/ผู้ให้บริการ/เอเจนต์/TTS ที่ใช้งานอยู่สำหรับเทิร์น                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | หยุดเสียงขาออกของผู้ช่วยโดยไม่จำเป็นต้องจบเทิร์นผู้ใช้                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ทำให้การเรียกเครื่องมือของผู้ให้บริการเสร็จสมบูรณ์ หลังการดำเนินการแบบอะซิงโครนัสใด ๆ ที่บริดจ์เปิดเผย ส่ง `options.willContinue` สำหรับผลลัพธ์ระหว่างดำเนินการ หรือเมื่อรองรับ ให้ส่ง `options.suppressResponse` เพื่อหลีกเลี่ยงการตอบกลับจากผู้ช่วยอีกครั้ง |
| `talk.session.steer`            | เซสชัน Talk ที่มีเอเจนต์รองรับ                              | ส่งการควบคุมด้วยเสียง `status`, `steer`, `cancel` หรือ `followup` ไปยังการเรียกใช้แบบฝังที่ใช้งานอยู่ ซึ่งระบุจากเซสชัน Talk                                                                                                 |
| `talk.session.close`            | เซสชันแบบรวมทั้งหมด                                    | หยุดเซสชันรีเลย์หรือเพิกถอนสถานะห้องที่มีการจัดการ จากนั้นลืมรหัสเซสชันแบบรวม                                                                                                                                     |

อย่าเพิ่มกรณีพิเศษสำหรับผู้ให้บริการหรือแพลตฟอร์มในแกนหลักเพื่อให้สิ่งนี้ทำงานได้
แกนหลักเป็นเจ้าของความหมายเชิงพฤติกรรมของเซสชัน Talk ส่วน Plugin ของผู้ให้บริการเป็นเจ้าของการตั้งค่าเซสชันของผู้จำหน่าย
Voice-call และ Google Meet เป็นเจ้าของอะแดปเตอร์โทรศัพท์/การประชุม ส่วนเบราว์เซอร์และแอปแบบเนทีฟ
เป็นเจ้าของ UX สำหรับการจับและเล่นสื่อบนอุปกรณ์

## กำหนดเวลาการนำออก

| เมื่อ                                        | สิ่งที่เกิดขึ้น                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **ขณะนี้**                                     | พื้นผิวที่เลิกใช้งานแล้วและรองรับคำเตือนจะแสดงคำเตือนขณะรันไทม์ ส่วนตัวตรวจสอบของรีโพซิทอรีจะปฏิเสธการนำเข้า SDK ที่เลิกใช้งานแล้วจากแกนหลักและ Plugin ที่รวมมาให้ |
| **วันที่ `removeAfter` ของระเบียนความเข้ากันได้แต่ละรายการ** | พื้นผิวนั้นมีสิทธิ์ถูกนำออกโดยเฉพาะ และ `pnpm plugins:boundary-report --fail-on-eligible-compat` จะทำให้ CI ล้มเหลวเมื่อพ้นวันที่ดังกล่าว    |
| **รุ่นหลักถัดไป**                      | พื้นผิวใดก็ตามที่ยังไม่ได้ย้ายจะถูกนำออก และ Plugin ที่ยังใช้งานพื้นผิวเหล่านั้นจะล้มเหลว                                                          |

พาธย่อยของ SDK สาธารณะด้านล่างมีช่วงเวลาการนำออกหรือลดระดับที่มีรีจิสทรีรองรับ
ขณะนี้พาธเหล่านี้ไม่แสดงคำเตือนขณะรันไทม์เมื่อ Plugin ภายนอกนำเข้า
ตัวตรวจสอบการใช้งานที่เลิกใช้แล้วของรีโพซิทอรีใช้กับเฉพาะระดับ θ1
ที่ไม่มีการใช้งานโดยสมบูรณ์และระดับความเข้ากันได้ก่อนหน้าเท่านั้น ส่วน θ2 ยังคงพร้อมใช้งานสำหรับ Plugin
ที่รวมมาให้ในระหว่างช่วงเวลาดังกล่าว

สำหรับช่วงเวลาที่เริ่มเมื่อ 2026-07-15 นั้น θ1 ไม่มีผู้ใช้งานภายนอกหรือผู้ใช้งานที่รวมมาให้
ที่ทราบ และจะถูกลบหลังสิ้นสุดช่วงเวลา ส่วน θ2 มีผู้ใช้งานที่รวมมาให้ แต่ไม่มี
ผู้ใช้งานภายนอกที่ทราบ โดยจะยุติเฉพาะการส่งออกแพ็กเกจสาธารณะของส่วนนี้เท่านั้น
โมดูลของส่วนนี้จะยังคงพร้อมใช้งานสำหรับ Plugin ที่รวมมาให้ในฐานะพาธย่อย
แบบส่วนตัวและใช้ภายในเครื่องเท่านั้น

| `removeAfter` | ระดับ                                   | พาธย่อยของ SDK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-07-30`  | การเลิกใช้งานเพื่อความเข้ากันได้ก่อนหน้านี้     | `agent-dir-compat`, `channel-envelope`, `channel-inbound-roots`, `channel-location`, `channel-message-runtime`, `channel-pairing-paths`, `channel-reply-options-runtime`, `config-schema`, `config-types`, `direct-dm`, `direct-dm-access`, `mattermost`, `media-generation-runtime-shared`, `memory-core`, `memory-core-engine-runtime`, `memory-core-host-events`, `memory-core-host-multimodal`, `memory-core-host-query`, `memory-host-files`, `memory-host-status`, `music-generation-core`, `outbound-runtime`, `outbound-send-deps`, `provider-auth-login`, `provider-zai-endpoint`, `reply-dedupe`, `runtime-logger`, `runtime-secret-resolution`, `self-hosted-provider-setup`, `setup-adapter-runtime`, `telegram-command-config`, `webhook-path`, `zalouser`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `2026-07-30`  | θ1: ไม่ได้ใช้งานเลย; ลบพาธย่อย       | `command-gating`, `lmstudio`, `lmstudio-runtime`, `secret-provider-integration`, `skills-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `2026-07-30`  | θ2: ใช้เฉพาะแบบรวมมาให้; ยกเลิกการส่งออกสาธารณะ | `access-groups`, `account-resolution-runtime`, `acp-binding-resolve-runtime`, `acp-binding-runtime`, `acp-runtime`, `acp-runtime-backend`, `agent-core`, `agent-harness-exec-review-runtime`, `agent-harness-task-runtime`, `agent-harness-tool-runtime`, `agent-media-payload`, `agent-sessions`, `approval-reaction-runtime`, `approval-reference-runtime`, `async-lock-runtime`, `browser-config`, `bundled-channel-config-schema`, `channel-activity-runtime`, `channel-config-writes`, `channel-mention-gating`, `channel-route`, `channel-secret-tts-runtime`, `channel-targets`, `chat-channel-ids`, `cli-backend`, `cli-runtime`, `codex-mcp-projection`, `command-status-runtime`, `command-surface`, `concurrency-runtime`, `context-visibility-runtime`, `conversation-binding-runtime`, `cron-store-runtime`, `dangerous-name-runtime`, `delivery-queue-runtime`, `direct-dm-guard-policy`, `directory-config-runtime`, `document-extractor`, `embedding-providers`, `exec-approvals-runtime`, `expect-runtime`, `fetch-runtime`, `file-access-runtime`, `file-lock`, `global-singleton`, `group-activation`, `heartbeat-runtime`, `host-runtime`, `html-entity-runtime`, `image-generation`, `image-generation-core`, `image-generation-runtime`, `inline-image-data-url-runtime`, `json-schema-runtime`, `json-unsafe-integers`, `keyed-async-queue`, `llm`, `markdown-table-runtime`, `media-generation-runtime`, `media-understanding`, `memory-core-host-embedding-registry`, `memory-core-host-engine-embeddings`, `memory-core-host-engine-qmd`, `memory-core-host-engine-storage`, `memory-core-host-runtime-cli`, `memory-core-host-runtime-core`, `memory-core-host-runtime-files`, `memory-core-host-secret`, `memory-core-host-status`, `memory-host-core`, `memory-host-events`, `memory-host-markdown`, `memory-host-search`, `message-tool-delivery-hints`, `migration`, `migration-runtime`, `music-generation`, `node-host`, `number-runtime`, `outbound-media`, `pair-loop-guard-runtime`, `plugin-config-runtime`, `plugin-state-runtime`, `poll-runtime`, `process-runtime`, `provider-auth-api-key`, `provider-auth-login-flow-runtime`, `provider-auth-result`, `provider-auth-runtime`, `provider-catalog-live-runtime`, `provider-catalog-shared`, `provider-entry`, `provider-env-vars`, `provider-http`, `provider-model-shared`, `provider-model-types`, `provider-oauth-runtime`, `provider-onboard`, `provider-selection-runtime`, `provider-setup`, `provider-stream`, `provider-stream-family`, `provider-stream-shared`, `provider-tools`, `provider-transport-runtime`, `provider-usage`, `provider-web-fetch`, `provider-web-fetch-contract`, `provider-web-search`, `provider-web-search-config-contract`, `provider-web-search-contract`, `qa-runner-runtime`, `realtime-bootstrap-context`, `realtime-transcription`, `realtime-voice`, `reply-reference`, `request-url`, `response-limit-runtime`, `retry-runtime`, `runtime-doctor`, `runtime-fetch`, `sandbox`, `secret-file-runtime`, `secure-random-runtime`, `session-binding-runtime`, `session-catalog`, `session-key-runtime`, `session-transcript-hit`, `session-transcript-runtime`, `session-visibility`, `simple-completion-runtime`, `speech`, `speech-core`, `sqlite-runtime`, `ssrf-dispatcher`, `string-normalization-runtime`, `system-event-runtime`, `talk-config-runtime`, `target-resolver-runtime`, `text-autolink-runtime`, `text-utility-runtime`, `thread-bindings-runtime`, `thread-bindings-session-runtime`, `time-runtime`, `tool-payload`, `tool-plugin`, `tool-results`, `transcripts`, `transport-ready-runtime`, `tts-runtime`, `types`, `video-generation`, `video-generation-core`, `video-generation-runtime`, `web-content-extractor`, `webhook-targets`, `windows-spawn` |
| `2026-08-15`  | การเลิกใช้เพื่อความเข้ากันได้ก่อนหน้านี้     | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `2026-09-01`  | การเลิกใช้ความเข้ากันได้ก่อนหน้านี้     | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Plugin หลักทั้งหมดได้ย้ายเรียบร้อยแล้ว Plugin ภายนอกควรย้าย
ก่อนรุ่นหลักถัดไป เรียกใช้ `pnpm plugins:boundary-report` เพื่อดูว่า
ระเบียนความเข้ากันได้ใดของพื้นผิวที่ Plugin ของคุณใช้จะครบกำหนดเร็วที่สุด

## ระงับคำเตือนชั่วคราว

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นทางออกฉุกเฉินชั่วคราว ไม่ใช่วิธีแก้ปัญหาถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) - สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) - เอกสารอ้างอิงการนำเข้าพาธย่อยฉบับสมบูรณ์
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้าง Plugin ช่องทาง
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การสร้าง Plugin ผู้ให้บริการ
- [องค์ประกอบภายในของ Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรม
- [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest) - เอกสารอ้างอิงสคีมาของไฟล์ Manifest
