---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ให้ใช้สถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแล Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง SDK สำหรับ Plugin สมัยใหม่
title: การย้ายข้อมูล Plugin SDK
x-i18n:
    generated_at: "2026-07-20T06:07:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af65ffc5b71e5e2bfd3e54e6cfe80fd02a058dfa33646994386ab08ad583fbb0
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw แทนที่เลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้างด้วยสถาปัตยกรรม Plugin
สมัยใหม่ที่สร้างจากการนำเข้าแบบเล็กและเฉพาะเจาะจง หาก Plugin ของคุณมีอยู่ก่อน
การเปลี่ยนแปลงดังกล่าว คู่มือนี้จะช่วยย้ายไปใช้สัญญาปัจจุบัน

## สิ่งที่เปลี่ยนแปลง

ก่อนหน้านี้ พื้นผิวการนำเข้าแบบเปิดกว้างหลายรายการทำให้ Plugin เข้าถึงแทบทุกอย่าง
ได้จากจุดเข้าเดียว:

- **`openclaw/plugin-sdk`** และ **`openclaw/plugin-sdk/compat`** - ส่งออกซ้ำ
  ตัวช่วยหลายสิบรายการระหว่างที่กำลังสร้าง SDK แบบเฉพาะเจาะจง ขณะนี้รากทั้งสอง
  ถูกนำออกแล้ว ให้ใช้การนำเข้าจากพาธย่อยที่มีเอกสารกำกับแทน
- **`openclaw/plugin-sdk/infra-runtime`** - barrel แบบกว้างที่รวมอีเวนต์ระบบ
  สถานะ Heartbeat คิวการส่ง ตัวช่วย fetch/proxy ตัวช่วยไฟล์
  ชนิดข้อมูลการอนุมัติ และยูทิลิตีที่ไม่เกี่ยวข้องไว้ด้วยกัน
- **`openclaw/plugin-sdk/config-runtime`** - barrel การกำหนดค่าแบบกว้างที่คงไว้
  เฉพาะในช่วงความเข้ากันได้ภายหลัง โดยตัวช่วยโหลด/เขียนรันไทม์โดยตรง
  ถูกนำออกแล้ว
- **`openclaw/extension-api`** - บริดจ์ที่ถูกนำออก ซึ่งเคยให้ Plugin เข้าถึง
  ตัวช่วยฝั่งโฮสต์โดยตรง เช่น ตัวรันเอเจนต์แบบฝัง
- **`api.registerEmbeddedExtensionFactory(...)`** - ฮุกเฉพาะตัวรันแบบฝังที่ถูกนำออก
  ซึ่งเฝ้าสังเกตอีเวนต์ของตัวรันแบบฝัง เช่น `tool_result` ให้ใช้มิดเดิลแวร์
  ผลลัพธ์เครื่องมือของเอเจนต์แทน (ดู [ย้ายส่วนขยายผลลัพธ์เครื่องมือแบบฝัง
  ไปยังมิดเดิลแวร์](#how-to-migrate))

SDK ราก, compat barrel, บริดจ์ส่วนขยาย และแฟกทอรีส่วนขยายแบบฝัง
ถูกนำออกแล้ว `infra-runtime` และ `config-runtime` ยังคงอยู่เฉพาะสำหรับ
ช่วงเวลาภายหลังที่บันทึกแยกไว้เท่านั้น Plugin ใหม่ควรใช้พาธย่อยแบบเฉพาะเจาะจง

<Warning>
  Plugin ที่นำเข้าพื้นผิวราก, compat หรือส่วนขยายที่ถูกนำออกจะไม่สามารถ
  โหลดได้อีกต่อไป ให้ทำตามการจับคู่ด้านล่างก่อนอัปเกรด
</Warning>

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารกำกับใหม่ในการเปลี่ยนแปลง
เดียวกับที่เปิดตัวสิ่งทดแทน การเปลี่ยนแปลงสัญญาที่ทำลายความเข้ากันได้ต้องผ่าน
อะแดปเตอร์ความเข้ากันได้ การวินิจฉัย เอกสาร และช่วงเลิกใช้งานก่อน ซึ่ง
ใช้กับการนำเข้า SDK ฟิลด์ใน manifest API การตั้งค่า ฮุก และพฤติกรรม
การลงทะเบียนรันไทม์

### เหตุผล

- **เริ่มทำงานช้า** - การนำเข้าตัวช่วยหนึ่งรายการโหลดโมดูลที่ไม่เกี่ยวข้องหลายสิบรายการ
- **การขึ้นต่อกันแบบวนซ้ำ** - การส่งออกซ้ำแบบกว้างทำให้เกิดวงจร
  การนำเข้าได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** - ไม่มีวิธีแยกการส่งออกที่เสถียรออกจากการส่งออกภายใน

ขณะนี้ `openclaw/plugin-sdk/<subpath>` แต่ละรายการเป็นโมดูลขนาดเล็กที่สมบูรณ์ในตัว
พร้อมสัญญาที่มีเอกสารกำกับ

จุดเชื่อมต่ออำนวยความสะดวกแบบเดิมของผู้ให้บริการสำหรับช่องทางแบบรวมถูกนำออกแล้วเช่นกัน -
ทางลัดตัวช่วยที่ใช้แบรนด์ช่องทางเป็นเพียงสิ่งอำนวยความสะดวกส่วนตัวใน mono-repo ไม่ใช่
สัญญา Plugin ที่เสถียร ให้ใช้พาธย่อย SDK ทั่วไปที่แคบแทน ภายใน
พื้นที่ทำงาน Plugin แบบรวม ให้เก็บตัวช่วยที่ผู้ให้บริการเป็นเจ้าของไว้ใน
`api.ts` หรือ `runtime-api.ts` ของ Plugin นั้นเอง:

- Anthropic เก็บตัวช่วยสตรีมเฉพาะ Claude ไว้ในจุดเชื่อมต่อ `api.ts` /
  `contract-api.ts` ของตนเอง
- OpenAI เก็บตัวสร้างผู้ให้บริการ ตัวช่วยโมเดลเริ่มต้น และตัวสร้างผู้ให้บริการ
  แบบเรียลไทม์ไว้ใน `api.ts` ของตนเอง
- OpenRouter เก็บตัวสร้างผู้ให้บริการและตัวช่วยการเริ่มต้นใช้งาน/การกำหนดค่าไว้ใน
  `api.ts` ของตนเอง

## นโยบายความเข้ากันได้

งานด้านความเข้ากันได้ของ Plugin ภายนอกดำเนินการตามลำดับนี้:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเดิมโดยเชื่อมผ่านอะแดปเตอร์ความเข้ากันได้
3. ส่งการวินิจฉัยหรือคำเตือนที่ระบุพาธเดิมและสิ่งทดแทน
4. ครอบคลุมทั้งสองพาธด้วยการทดสอบ
5. จัดทำเอกสารการเลิกใช้งานและพาธการย้าย
6. นำออกหลังสิ้นสุดช่วงการย้ายที่ประกาศไว้เท่านั้น โดยปกติจะอยู่ใน
   รุ่นหลัก

หากฟิลด์ใน manifest ยังคงได้รับการยอมรับ ให้ใช้ต่อไปจนกว่าเอกสารและ
การวินิจฉัยจะระบุเป็นอย่างอื่น โค้ดใหม่ควรเลือกใช้สิ่งทดแทนที่มีเอกสารกำกับ
ส่วน Plugin ที่มีอยู่ไม่ควรเสียหายระหว่างการออกรุ่นย่อยตามปกติ

ตรวจสอบคิวการย้ายปัจจุบันด้วย `pnpm plugins:boundary-report`:

| แฟล็ก                                                    | ผลลัพธ์                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (หรือ `pnpm plugins:boundary-report:summary`) | แสดงจำนวนแบบกระชับแทนรายละเอียดทั้งหมด                                         |
| `--json`                                                | รายงานที่เครื่องอ่านได้                                                       |
| `--owner <id>`                                          | กรองให้เหลือ Plugin หรือเจ้าของความเข้ากันได้หนึ่งราย                         |
| `--fail-on-cross-owner`                                 | ออกด้วยสถานะไม่เป็นศูนย์เมื่อมีการนำเข้า SDK ที่สงวนไว้ข้ามเจ้าของ            |
| `--fail-on-eligible-compat`                             | ออกด้วยสถานะไม่เป็นศูนย์เมื่อวันที่ `removeAfter` ของระเบียน compat ที่เลิกใช้แล้วผ่านไป |
| `--fail-on-unclassified-unused-reserved`                | ออกด้วยสถานะไม่เป็นศูนย์เมื่อมี shim SDK ที่สงวนไว้แต่ไม่ได้ใช้งาน             |

`pnpm plugins:boundary-report:ci` ทำงานโดยเปิดใช้แฟล็กล้มเหลวทั้งสามรายการ
ระเบียนความเข้ากันได้แต่ละรายการมีวันที่ `removeAfter` ที่ชัดเจน (ไม่ใช่ข้อความคลุมเครือว่า "รุ่นหลัก
ถัดไป") - รายงานจะจัดกลุ่มระเบียนที่เลิกใช้ตามวันที่ดังกล่าว นับ
การอ้างอิงในโค้ด/เอกสารภายใน แสดงการนำเข้า SDK ที่สงวนไว้ข้ามเจ้าของ และ
สรุปบริดจ์ SDK ของโฮสต์หน่วยความจำส่วนตัว พาธย่อย SDK ที่สงวนไว้ต้องมี
การติดตามการใช้งานโดยเจ้าของ การส่งออกที่สงวนไว้แต่ไม่ได้ใช้งานควรถูกนำออกจาก
SDK สาธารณะ

## วิธีการย้าย

<Steps>
  <Step title="ย้ายตัวช่วยโหลด/เขียนการกำหนดค่ารันไทม์">
    Plugin แบบรวมควรหยุดเรียก `api.runtime.config.loadConfig()` และ
    `api.runtime.config.writeConfigFile(...)` โดยตรง ควรใช้การกำหนดค่าที่ส่งเข้ามาแล้ว
    ในพาธการเรียกที่กำลังทำงาน ตัวจัดการที่มีอายุยาวซึ่งต้องใช้สแนปช็อต
    กระบวนการปัจจุบันสามารถใช้ `api.runtime.config.current()` เครื่องมือเอเจนต์
    ที่มีอายุยาวควรอ่าน `ctx.getRuntimeConfig()` ภายใน `execute` เพื่อให้เครื่องมือ
    ที่สร้างก่อนการเขียนการกำหนดค่ายังคงเห็นการกำหนดค่าที่รีเฟรชแล้ว

    การเขียนการกำหนดค่าต้องผ่านตัวช่วยแบบทรานแซกชันพร้อมนโยบาย
    หลังการเขียนที่ระบุไว้อย่างชัดเจน:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    ใช้ `afterWrite: { mode: "restart", reason: "..." }` เมื่อการเปลี่ยนแปลงต้องการ
    รีสตาร์ต Gateway ใหม่ทั้งหมด และใช้ `afterWrite: { mode: "none", reason: "..." }`
    เฉพาะเมื่อผู้เรียกเป็นเจ้าของการดำเนินการต่อและตั้งใจระงับ
    ตัววางแผนการโหลดซ้ำ ผลลัพธ์การแก้ไขมีสรุป `followUp` แบบมีชนิดสำหรับ
    การทดสอบและการบันทึกล็อก โดย Gateway ยังคงมีหน้าที่นำการรีสตาร์ตไปใช้หรือ
    กำหนดเวลาให้ดำเนินการ

    `loadConfig` และ `writeConfigFile` ถูกนำออกจากรันไทม์
    Plugin แล้ว Plugin แบบรวมและโค้ดรันไทม์ของรีโปได้รับการป้องกันโดย
    `pnpm check:deprecated-api-usage` และ
    `pnpm check:no-runtime-action-load-config`: การใช้งานใหม่ใน Plugin สำหรับระบบใช้งานจริง
    จะล้มเหลวทันที การเขียนการกำหนดค่าโดยตรงจะล้มเหลว เมธอดเซิร์ฟเวอร์ Gateway ต้องใช้
    สแนปช็อตรันไทม์ของคำขอ ตัวช่วยส่ง/ดำเนินการ/ไคลเอนต์ของช่องทางรันไทม์
    ต้องรับการกำหนดค่าจากขอบเขตของตน และโมดูลรันไทม์ที่มีอายุยาว
    ไม่อนุญาตให้เรียก `loadConfig()` แบบแวดล้อมแม้แต่ครั้งเดียว

    โค้ด Plugin ใหม่ควรหลีกเลี่ยง barrel แบบกว้าง `openclaw/plugin-sdk/config-runtime`
    ให้ใช้พาธย่อยแบบแคบที่เหมาะกับงาน:

    | ความต้องการ | การนำเข้า |
    | --- | --- |
    | ชนิดการกำหนดค่า เช่น `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | การค้นหาการกำหนดค่าที่จุดเข้า Plugin | `api.pluginConfig` |
    | การผสานการกำหนดค่า | ตรรกะภายใน Plugin ที่ขอบเขตการกำหนดค่า |
    | การอ่านสแนปช็อตรันไทม์ปัจจุบัน | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | การเขียนการกำหนดค่า | `openclaw/plugin-sdk/config-mutation` |
    | ตัวช่วยคลังเซสชัน | `openclaw/plugin-sdk/session-store-runtime` |
    | การกำหนดค่าตาราง Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | ตัวช่วยรันไทม์นโยบายกลุ่ม | `openclaw/plugin-sdk/runtime-group-policy` |
    | การแก้ไขอินพุตข้อมูลลับ | `openclaw/plugin-sdk/secret-input-runtime` |
    | การแทนที่โมเดล/เซสชัน | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin แบบรวมและการทดสอบของ Plugin เหล่านั้นได้รับการป้องกันด้วยสแกนเนอร์จาก barrel แบบกว้าง
    เพื่อให้การนำเข้าและ mock ยังคงอยู่เฉพาะกับพฤติกรรมที่ต้องใช้
    barrel ยังคงมีอยู่เพื่อความเข้ากันได้ภายนอก แต่โค้ดใหม่ไม่ควร
    ขึ้นต่อ barrel นี้

  </Step>

  <Step title="ย้ายส่วนขยายผลลัพธ์เครื่องมือแบบฝังไปยังมิดเดิลแวร์">
    Plugin แบบรวมต้องแทนที่ตัวจัดการผลลัพธ์เครื่องมือ `api.registerEmbeddedExtensionFactory(...)`
    ที่ใช้ได้เฉพาะกับตัวรันแบบฝังด้วยมิดเดิลแวร์
    ที่ไม่ขึ้นกับรันไทม์:

    ```typescript
    // เครื่องมือรันไทม์ OpenClaw และเครื่องมือแบบไดนามิกของรันไทม์ Codex (ผลลัพธ์อาจถูก
    // แปลงได้) ผลลัพธ์ของเครื่องมือแบบเนทีฟของ Codex จะถูกส่งต่อเพื่อการสังเกตด้วย
    // แต่เอาต์พุตที่แปลงแล้วจะไม่ไปถึงโมเดล เนื่องจากสัญญาฮุก
    // PostToolUse ของ Codex ไม่สามารถแทนที่การตอบกลับของเครื่องมือแบบเนทีฟได้
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    อัปเดต manifest ของ Plugin พร้อมกัน:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin ที่ติดตั้งแล้วยังสามารถลงทะเบียนมิดเดิลแวร์ผลลัพธ์เครื่องมือได้เมื่อ
    เปิดใช้งานอย่างชัดเจนและประกาศรันไทม์เป้าหมายทั้งหมดไว้ใน
    `contracts.agentToolResultMiddleware` การลงทะเบียนมิดเดิลแวร์ของ Plugin
    ที่ติดตั้งแล้วแต่ไม่ได้ประกาศจะถูกปฏิเสธ

  </Step>

  <Step title="ย้ายตัวจัดการการอนุมัติแบบเนทีฟไปใช้ข้อเท็จจริงด้านความสามารถ">
    Plugin ช่องทางที่รองรับการอนุมัติเปิดเผยพฤติกรรมการอนุมัติแบบเนทีฟผ่าน
    `approvalCapability.nativeRuntime` ร่วมกับรีจิสทรีบริบทรันไทม์
    ที่ใช้ร่วมกัน:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้ายการยืนยันตัวตน/การส่งที่เฉพาะเจาะจงกับการอนุมัติออกจากการเชื่อมต่อเดิม `plugin.auth` /
      `plugin.approvals` ไปยัง `approvalCapability`
    - `ChannelPlugin.approvals` ถูกนำออกจากสัญญา
      Plugin ช่องทางสาธารณะแล้ว ให้ย้ายฟิลด์การส่ง/เนทีฟ/การเรนเดอร์ไปยัง
      `approvalCapability`
    - `plugin.auth` ยังคงใช้เฉพาะกับขั้นตอนเข้าสู่ระบบ/ออกจากระบบของช่องทางเท่านั้น ส่วน core
      จะไม่อ่านฮุกการยืนยันตัวตนสำหรับการอนุมัติจากตำแหน่งนั้นอีกต่อไป
    - ลงทะเบียนออบเจ็กต์รันไทม์ที่ช่องทางเป็นเจ้าของ (ไคลเอนต์ โทเค็น แอป Bolt)
      ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่งการแจ้งเตือนการเปลี่ยนเส้นทางที่ Plugin เป็นเจ้าของจากตัวจัดการการอนุมัติแบบเนทีฟ
      core เป็นเจ้าของการแจ้งเตือนว่าส่งไปยังที่อื่นแล้วจากผลลัพธ์การส่งจริง
    - เมื่อส่ง `channelRuntime` เข้าไปใน `createChannelManager(...)` ให้จัดเตรียม
      พื้นผิว `createPluginRuntime().channel` ที่ใช้งานได้จริง โดย stub ที่ไม่สมบูรณ์จะ
      ถูกปฏิเสธ

    ดูโครงสร้างความสามารถด้านการอนุมัติปัจจุบันได้ที่ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

  </Step>

  <Step title="ตรวจสอบพฤติกรรม fallback ของ wrapper บน Windows">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn` wrapper ของ Windows
    `.cmd`/`.bat` ที่แก้ไขไม่ได้จะล้มเหลวแบบปิด เว้นแต่จะส่ง
    `allowShellFallback: true` อย่างชัดเจน:

    ```typescript
    // ก่อน
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // หลัง
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // ตั้งค่านี้เฉพาะสำหรับผู้เรียกด้านความเข้ากันได้ที่เชื่อถือได้ ซึ่งตั้งใจ
      // ยอมรับ fallback ที่ดำเนินการผ่านเชลล์
      allowShellFallback: true,
    });
    ```

    หากผู้เรียกของคุณไม่ได้ตั้งใจพึ่งพา fallback ของเชลล์ อย่าตั้งค่า
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
    การส่งออกแต่ละรายการจากพื้นผิวเดิมจะจับคู่กับพาธการนำเข้าสมัยใหม่ที่เฉพาะเจาะจง:

    ```typescript
    // ก่อนหน้า (เลเยอร์ความเข้ากันได้ย้อนหลังที่เลิกใช้แล้ว)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // หลังจากเปลี่ยน (การนำเข้าแบบเจาะจงสมัยใหม่)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    สำหรับตัวช่วยฝั่งโฮสต์ ให้ใช้รันไทม์ Plugin ที่แทรกเข้ามาแทนการ
    นำเข้าโดยตรง:

    ```typescript
    // ก่อนหน้า (บริดจ์ extension-api ที่เลิกใช้แล้ว)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // หลังจากเปลี่ยน (รันไทม์ที่แทรกเข้ามา)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    ใช้รูปแบบเดียวกันกับตัวช่วยบริดจ์แบบเดิมอื่นๆ:

    | การนำเข้าเดิม | สิ่งที่ใช้แทนในปัจจุบัน |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ตัวช่วยที่เก็บเซสชัน | `api.runtime.agent.session.*` |

  </Step>

  <Step title="แทนที่การนำเข้า infra-runtime แบบกว้าง">
    `openclaw/plugin-sdk/infra-runtime` ยังคงมีอยู่เพื่อความเข้ากันได้กับภายนอก
    แต่โค้ดใหม่ควรนำเข้าพื้นผิวเฉพาะที่จำเป็นต้องใช้จริง:

    | สิ่งที่ต้องใช้ | การนำเข้า |
    | --- | --- |
    | ตัวช่วยคิวเหตุการณ์ระบบ | `openclaw/plugin-sdk/system-event-runtime` |
    | ตัวช่วยปลุก Heartbeat เหตุการณ์ และการมองเห็น | `openclaw/plugin-sdk/heartbeat-runtime` |
    | การระบายคิวการนำส่งที่รอดำเนินการ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | เทเลเมทรีกิจกรรมของช่องทาง | `openclaw/plugin-sdk/channel-activity-runtime` |
    | แคชขจัดรายการซ้ำในหน่วยความจำและที่มีระบบจัดเก็บถาวรรองรับ | `openclaw/plugin-sdk/dedupe-runtime` |
    | ตัวช่วยพาธไฟล์/สื่อภายในเครื่องที่ปลอดภัย | `openclaw/plugin-sdk/file-access-runtime` |
    | การดึงข้อมูลที่รับรู้ dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | ตัวช่วยการดึงข้อมูลผ่านพร็อกซีและแบบมีการป้องกัน | `openclaw/plugin-sdk/fetch-runtime` |
    | ชนิดนโยบาย dispatcher สำหรับ SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | ชนิดคำขอ/ผลลัพธ์การอนุมัติ | `openclaw/plugin-sdk/approval-runtime` |
    | ตัวช่วยเพย์โหลดการตอบกลับและคำสั่งสำหรับการอนุมัติ | `openclaw/plugin-sdk/approval-reply-runtime` |
    | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `openclaw/plugin-sdk/error-runtime` |
    | การรอความพร้อมของการขนส่ง | `openclaw/plugin-sdk/transport-ready-runtime` |
    | ตัวช่วยโทเค็นที่ปลอดภัย | `openclaw/plugin-sdk/secure-random-runtime` |
    | การทำงานพร้อมกันของงานอะซิงโครนัสแบบมีขอบเขต | `openclaw/plugin-sdk/concurrency-runtime` |
    | การยืนยันค่าที่จำเป็นสำหรับค่าคงที่ที่พิสูจน์ได้ | `openclaw/plugin-sdk/expect-runtime` |
    | การบังคับแปลงเป็นตัวเลข | `openclaw/plugin-sdk/number-runtime` |
    | ล็อกอะซิงโครนัสภายในโปรเซส | `openclaw/plugin-sdk/async-lock-runtime` |
    | ล็อกไฟล์ | `openclaw/plugin-sdk/file-lock` |

    Plugin ที่รวมมากับระบบมีตัวสแกนป้องกันการใช้ `infra-runtime` ดังนั้นโค้ดในรีโพ
    จึงไม่สามารถย้อนกลับไปใช้ barrel แบบกว้างได้

  </Step>

  <Step title="ย้ายตัวช่วยเส้นทางช่องทาง">
    โค้ดเส้นทางช่องทางใหม่ใช้ `openclaw/plugin-sdk/channel-route` ส่วนชื่อ
    คีย์เส้นทางแบบเก่ายังคงอยู่ในฐานะชื่อแทนเพื่อความเข้ากันได้:

    | ตัวช่วยเดิม | ตัวช่วยสมัยใหม่ |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    ตัวช่วยเส้นทางสมัยใหม่ปรับ `{ channel, to, accountId, threadId }` ให้เป็นรูปแบบมาตรฐาน
    อย่างสม่ำเสมอในทุกส่วน ได้แก่ การอนุมัติแบบเนทีฟ การระงับการตอบกลับ การขจัดข้อมูลขาเข้าซ้ำ
    การนำส่ง Cron และการกำหนดเส้นทางเซสชัน

    อย่าเพิ่มการใช้งานใหม่ของ `ChannelMessagingAdapter.parseExplicitTarget` หรือ
    `resolveChannelRouteTargetWithParser(...)` จาก
    `plugin-sdk/channel-route` เนื่องจากเลิกใช้แล้วและยังคงไว้สำหรับ
    Plugin รุ่นเก่าเท่านั้น Plugin ช่องทางใหม่ควรใช้
    `messaging.targetResolver.resolveTarget(...)` สำหรับการปรับ ID เป้าหมายให้เป็นรูปแบบมาตรฐาน
    และการใช้ค่าทดแทนเมื่อไม่พบในไดเรกทอรี
    `messaging.inferTargetChatType(...)` เมื่อแกนหลักต้องทราบชนิดเพียร์ล่วงหน้า
    และ `messaging.resolveOutboundSessionRoute(...)` สำหรับข้อมูลประจำตัว
    เซสชันและเธรดแบบเนทีฟของผู้ให้บริการ

  </Step>

  <Step title="สร้างและทดสอบ">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงพาธการนำเข้า

แผนผังการส่งออกของแพ็กเกจสาธารณะคือแหล่งข้อมูลจริงสำหรับพาธย่อยของ SDK
ที่สามารถนำเข้าได้ ใช้คู่มือ SDK ตามหัวข้อที่ลิงก์จาก [ภาพรวม SDK](/th/plugins/sdk-overview)
และเลือกพาธย่อยสาธารณะที่มีการบันทึกไว้ซึ่งแคบที่สุด รายการคอมไพเลอร์ใน
`scripts/lib/plugin-sdk-entrypoints.json` ยังมีรายการเฉพาะภายในแบบส่วนตัวที่ใช้
สร้าง Plugin ที่รวมมากับระบบ การมีรายการเหล่านั้นอยู่ในนั้นไม่ได้ทำให้เป็นการส่งออกแพ็กเกจสาธารณะ

ตารางนี้เป็นชุดย่อยสำหรับการย้ายที่ใช้กันทั่วไป ไม่ใช่พื้นผิวทั้งหมดของ SDK
รายการจุดเข้าใช้งานของคอมไพเลอร์อยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
การส่งออกแพ็กเกจสร้างขึ้นจากชุดย่อยสาธารณะ

ซีมตัวช่วยที่สงวนไว้สำหรับ Plugin ที่รวมมากับระบบถูกยกเลิกจากแผนผัง
การส่งออก SDK สาธารณะแล้ว ยกเว้น facade เพื่อความเข้ากันได้ที่ระบุไว้อย่างชัดเจน เช่น
ชิม `plugin-sdk/discord` ที่เลิกใช้แล้ว ซึ่งยังคงไว้สำหรับ Plugin ภายนอกที่ยังคง
นำเข้าแพ็กเกจ `@openclaw/discord` ที่เผยแพร่แล้วโดยตรง ตัวช่วยเฉพาะเจ้าของ
อยู่ภายในแพ็กเกจ Plugin ของเจ้าของนั้น ส่วนพฤติกรรมโฮสต์ที่ใช้ร่วมกันจะส่งผ่าน
สัญญา SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` และ API ของ Plugin ที่แทรกเข้ามา

ใช้การนำเข้าที่แคบที่สุดซึ่งตรงกับงาน หากไม่พบการส่งออก
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือสอบถามผู้ดูแลว่าสัญญา
ทั่วไปใดควรเป็นเจ้าของรายการนั้น

## พื้นผิวความเข้ากันได้ที่ถูกนำออก

การปรับปรุงเดือนกรกฎาคม 2026 ได้นำ root SDK และ compat barrel, บริดจ์ extension API,
ชื่อแทนพาธย่อย SDK ที่หมดอายุ, พาธย่อย SDK ที่ไม่ได้ใช้ และการส่งออกสาธารณะ
สำหรับโมดูล SDK ที่ใช้เฉพาะกับ Plugin ที่รวมมากับระบบออกแล้ว โมดูลที่ใช้เฉพาะกับ Plugin ที่รวมมากับระบบยังคงพร้อมใช้งานสำหรับ
เจ้าของภายในรีโพผ่านการแมปการสร้างเฉพาะภายในแบบส่วนตัว แต่ไม่สามารถ
นำเข้าจากแพ็กเกจที่เผยแพร่แล้วได้

### การเผยแพร่ผู้ให้บริการ API ระดับโปรเซสส่วนกลาง

`registerApiProvider(...)` และ `unregisterApiProviders(...)` ถูกนำออกจาก
`openclaw/plugin-sdk/llm` โดยทั้งสองรายการเผยแพร่การขนส่ง API ไปยังสถานะ
ระดับโปรเซสส่วนกลาง ซึ่งรันไทม์โมเดลที่วงจรชีวิตเป็นผู้ดูแลต้องคัดลอกไปยังรีจิสทรี
ที่เตรียมไว้แต่ละรายการในภายหลัง

Plugin ผู้ให้บริการควรลงทะเบียนผู้ให้บริการอนุมานข้อความผ่าน
`api.registerProvider(...)` โค้ดและการทดสอบที่โฮสต์เป็นเจ้าของซึ่งสร้าง
`ApiRegistry` ควรลงทะเบียนบนรีจิสทรีนั้นโดยตรง เพื่อให้ความเป็นเจ้าของ
ผู้ให้บริการและการรื้อถอนยังคงจำกัดขอบเขตอยู่ที่รันไทม์ที่เตรียมไว้

### Barrel การทดสอบแบบส่วนตัว

`openclaw/plugin-sdk/testing` ใช้เฉพาะภายในรีโพและไม่รวมอยู่ในอาร์ติแฟกต์
แพ็กเกจที่เผยแพร่ จึงถูกนำออกก่อนวันที่ `removeAfter` ซึ่งคือ 2026-07-28 การทดสอบ
ของรีโพใช้พาธย่อยแบบเจาะจง เช่น `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env` และ `plugin-sdk/test-fixtures`

## ข้อมูลอ้างอิงการย้าย

การแมปเหล่านี้ครอบคลุมทั้งพื้นผิวที่ถูกนำออกในเดือนกรกฎาคม 2026 และการเลิกใช้
ที่ยังมีผลในกรอบเวลาหลังจากนั้น การแมปเป็นแนวทางการย้าย ไม่ใช่หลักฐานว่า
พื้นผิวเดิมยังคงพร้อมใช้งาน โปรดตรวจสอบรีจิสทรีความเข้ากันได้และไทม์ไลน์
การนำออกเพื่อดูสถานะปัจจุบัน

<AccordionGroup>
  <Accordion title="ตัวย่อยสร้างวิธีใช้ command-auth -> command-status">
    **เดิม (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: ใช้ซิกเนเจอร์เดิม โดยนำเข้า
    จากพาธย่อยที่แคบกว่า การส่งออกซ้ำเพื่อความเข้ากันได้ของ `command-auth`
    ถูกนำออกแล้ว

    ```typescript
    // ก่อนหน้า
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // หลังจากเปลี่ยน
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="ตัวช่วยเกตการกล่าวถึง -> resolveInboundMentionDecision">
    **เดิม**: `resolveMentionGating(params)` และ
    `resolveMentionGatingWithBypass(params)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` ซึ่งใช้ออบเจ็กต์
    การตัดสินใจเดียวแทนรูปแบบการเรียกสองแบบที่แยกกัน

    นำไปใช้แล้วใน Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp และ Zalo ส่วนโมเดลเหตุการณ์ `app_mention` ของ Slack
    ไม่ใช้ตัวช่วยนี้

  </Accordion>

  <Accordion title="ชิมรันไทม์ช่องทางและตัวช่วยการดำเนินการของช่องทาง">
    `openclaw/plugin-sdk/channel-runtime` ถูกนำออกแล้ว ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับลงทะเบียนออบเจ็กต์
    รันไทม์

    ตัวช่วยสคีมาข้อความแบบเนทีฟใน `openclaw/plugin-sdk/channel-actions`
    ถูกนำออกพร้อมกับการส่งออกช่องทาง "actions" แบบดิบ ให้เปิดเผยความสามารถ
    ผ่านพื้นผิวเชิงความหมาย `presentation` แทน โดย Plugin ช่องทาง
    จะประกาศสิ่งที่แสดงผล (การ์ด ปุ่ม รายการเลือก) แทนการประกาศชื่อการดำเนินการ
    แบบดิบที่ยอมรับ

  </Accordion>

  <Accordion title="ตัวช่วย tool() ของผู้ให้บริการค้นหาเว็บ -> createTool() บน Plugin">
    **เดิม**: แฟกทอรี `tool()` จาก `openclaw/plugin-sdk/provider-web-search`

    **ใหม่**: ใช้งาน `createTool(...)` โดยตรงบน Plugin ผู้ให้บริการ
    OpenClaw ไม่จำเป็นต้องใช้ตัวช่วย SDK เพื่อลงทะเบียนตัวห่อหุ้มเครื่องมืออีกต่อไป

  </Accordion>

  <Accordion title="เอนเวโลปช่องทางแบบข้อความธรรมดา -> BodyForAgent">
    **เดิม**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (และฟิลด์
    `channelEnvelope` บนออบเจ็กต์ข้อความขาเข้า) เพื่อสร้างเอนเวโลปพรอมต์
    แบบข้อความธรรมดาแบนจากข้อความขาเข้าของช่องทาง

    **ใหม่**: `BodyForAgent` พร้อมบล็อกบริบทผู้ใช้แบบมีโครงสร้าง Plugin
    ช่องทางจะแนบข้อมูลเมตาการกำหนดเส้นทาง (เธรด หัวข้อ ตอบกลับถึง รีแอ็กชัน) เป็น
    ฟิลด์ที่มีชนิด แทนการเชื่อมต่อข้อมูลเหล่านั้นเข้ากับสตริงพรอมต์ ตัวช่วย
    `formatAgentEnvelope(...)` ยังคงรองรับสำหรับเอนเวโลปที่สร้างขึ้น
    เพื่อส่งให้ผู้ช่วย แต่เอนเวโลปขาเข้าแบบข้อความธรรมดากำลังจะถูกยกเลิก

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received` และ Plugin
    ช่องทางแบบกำหนดเองที่ประมวลผลข้อความเอนเวโลปเดิมภายหลัง

  </Accordion>

  <Accordion title="ฮุก deactivate -> gateway_stop">
    **เดิม**: `api.on("deactivate", handler)`

    **ใหม่**: `api.on("gateway_stop", handler)` ใช้สัญญาการล้างข้อมูล
    เมื่อปิดระบบเหมือนเดิม เปลี่ยนเฉพาะชื่อฮุก

    ```typescript
    // ก่อนหน้า
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // หลังจากเปลี่ยน
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` ยังคงเชื่อมต่อไว้ในฐานะชื่อแทนเพื่อความเข้ากันได้ที่เลิกใช้แล้ว จนกว่าจะ
    ถูกนำออกหลังวันที่ 2026-08-16

  </Accordion>

  <Accordion title="ฮุก subagent_spawning -> การผูกเธรดของแกนหลัก">
    **เดิม**: `api.on("subagent_spawning", handler)` ซึ่งส่งคืน
    `threadBindingReady` หรือ `deliveryOrigin`

    **ใหม่**: ให้แกนหลักเตรียมการผูกเอเจนต์ย่อย `thread: true` ผ่าน
    อะแดปเตอร์การผูกเซสชันของช่องทาง ใช้ `api.on("subagent_spawned", handler)`
    สำหรับการสังเกตการณ์หลังเปิดใช้งานเท่านั้น

    ```typescript
    // ก่อนหน้า
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // หลังจากเปลี่ยน
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` และ
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` ยังคงอยู่เฉพาะในฐานะ
    พื้นผิวความเข้ากันได้ที่เลิกใช้แล้วระหว่างที่ Plugin ภายนอกดำเนินการย้าย และจะถูกนำออก
    หลังวันที่ 2026-08-30

  </Accordion>

  <Accordion title="ชนิดการค้นหาผู้ให้บริการ -> ชนิดแค็ตตาล็อกผู้ให้บริการ">
    ปัจจุบันชื่อแทนชนิดการค้นหาทั้งสี่เป็นเพียงตัวห่อหุ้มแบบบางเหนือชนิด
    ในยุคแค็ตตาล็อก:

    | ชื่อแทนเดิม                 | ชนิดใหม่                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    ชื่อแทนและถุงสแตติกแบบเดิม `ProviderCapabilities` ถูกนำออกแล้ว
    Plugin ผู้ให้บริการ
    ควรใช้ฮุกผู้ให้บริการอย่างชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas` และ `wrapStreamFn` แทนออบเจ็กต์สแตติก

  </Accordion>

  <Accordion title="ฮุกนโยบายการคิด -> resolveThinkingProfile">
    **เดิม** (ฮุกสามรายการแยกกันบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` และ
    `resolveDefaultThinkingLevel(ctx)`

    **ใหม่**: `resolveThinkingProfile(ctx)` หนึ่งรายการที่ส่งคืน
    `ProviderThinkingProfile` พร้อม `id` มาตรฐาน, `label` ที่เป็นทางเลือก และ
    รายการระดับที่จัดอันดับแล้ว OpenClaw จะลดระดับค่าที่จัดเก็บไว้ซึ่งล้าสมัยตามอันดับโปรไฟล์
    โดยอัตโนมัติ

    บริบทประกอบด้วย `provider`, `modelId`, `reasoning` ที่ผสานแล้วซึ่งเป็นทางเลือก
    และข้อเท็จจริง `compat` ของโมเดลที่ผสานแล้วซึ่งเป็นทางเลือก Plugin ของผู้ให้บริการสามารถใช้
    ข้อเท็จจริงจากแค็ตตาล็อกเหล่านั้นเพื่อเปิดเผยโปรไฟล์เฉพาะโมเดลได้เฉพาะเมื่อสัญญาคำขอ
    ที่กำหนดค่าไว้รองรับเท่านั้น

    ใช้ฮุกเดียวแทนสามฮุก ฮุกแบบเดิมถูกนำออกแล้ว

  </Accordion>

  <Accordion title="ผู้ให้บริการการยืนยันตัวตนภายนอก -> contracts.externalAuthProviders">
    **เดิม**: ใช้ฮุกการยืนยันตัวตนภายนอกโดยไม่ประกาศผู้ให้บริการ
    ในไฟล์ manifest ของ Plugin

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ในไฟล์ manifest ของ Plugin
    **และ** ใช้ `resolveExternalAuthProfiles(...)`

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
    ใน manifest การทำเช่นนี้รวมข้อมูลเมตาของตัวแปรสภาพแวดล้อมสำหรับการตั้งค่า/สถานะไว้ในที่เดียว
    และหลีกเลี่ยงการเริ่มรันไทม์ของ Plugin เพียงเพื่อค้นหาตัวแปรสภาพแวดล้อม

    ไม่ยอมรับ `providerAuthEnvVars` อีกต่อไป

  </Accordion>

  <Accordion title="การลงทะเบียน Plugin หน่วยความจำ -> registerMemoryCapability">
    **เดิม**: เรียกแยกกันสามครั้ง ได้แก่ `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`

    **ใหม่**: เรียกเพียงครั้งเดียวบน API สถานะหน่วยความจำ ได้แก่
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`

    สล็อตเดิม การลงทะเบียนเพียงครั้งเดียว ตัวช่วยพรอมต์และคลังข้อมูลแบบเพิ่มเติม
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="API ผู้ให้บริการเวกเตอร์ฝังของหน่วยความจำ">
    **เดิม**: `api.registerMemoryEmbeddingProvider(...)` ร่วมกับ
    `contracts.memoryEmbeddingProviders`

    **ใหม่**: `api.registerEmbeddingProvider(...)` ร่วมกับ
    `contracts.embeddingProviders`

    สัญญาผู้ให้บริการเวกเตอร์ฝังทั่วไปสามารถนำไปใช้ซ้ำนอกหน่วยความจำได้ และเป็น
    แนวทางที่รองรับสำหรับผู้ให้บริการรายใหม่ API การลงทะเบียนเฉพาะหน่วยความจำ
    ยังคงเชื่อมต่อไว้เพื่อรองรับความเข้ากันได้ที่เลิกแนะนำระหว่างที่ผู้ให้บริการเดิม
    ย้ายระบบ การตรวจสอบ Plugin จะรายงานการใช้งานจาก Plugin ที่ไม่ได้รวมมาให้ว่าเป็น
    ภาระด้านความเข้ากันได้

  </Accordion>

  <Accordion title="ผลลัพธ์การส่งช่องทางแบบดิบ -> OutboundDeliveryResult">
    **เดิม**: ส่งคืน `{ ok, messageId, error }` ผ่าน
    `ChannelSendRawResult` และปรับให้อยู่ในรูปแบบมาตรฐานด้วย
    `createRawChannelSendResultAdapter(...)`

    **ใหม่**: ส่งคืนฟิลด์ `OutboundDeliveryResult` และแนบช่องทางด้วย
    `createAttachedChannelResultAdapter(...)` การส่งที่ล้มเหลวควรโยนข้อผิดพลาด
    แทนการส่งคืนสตริงข้อผิดพลาด ชนิดผลลัพธ์แบบดิบจะยังคงใช้งานได้จนถึง
    Plugin SDK รุ่นหลักถัดไป

  </Accordion>

  <Accordion title="เปลี่ยนชื่อชนิดข้อความเซสชันของเอเจนต์ย่อย">
    นามแฝงชนิดแบบเดิมสองรายการยังคงส่งออกจาก `src/plugins/runtime/types.ts`:

    | เดิม                           | ใหม่                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    เลิกแนะนำเมธอดรันไทม์ `readSession` และควรใช้
    `getSessionMessages` แทน โดยมีลายเซ็นเดียวกัน เมธอดเดิมจะเรียกต่อไปยัง
    เมธอดใหม่

  </Accordion>

  <Accordion title="API ไฟล์เซสชันและบทถอดเสียงที่ถูกนำออก">
    การเปลี่ยนเซสชัน/บทถอดเสียงไปใช้ SQLite จะนำออกหรือเลิกแนะนำ API สำหรับ Plugin
    ที่เปิดเผยที่เก็บ `sessions.json` ที่กำลังใช้งาน เส้นทางบทถอดเสียง JSONL หรือรายการ
    ไฟล์เซสชัน Plugin รันไทม์ควรใช้ข้อมูลระบุตัวตนของเซสชันและตัวช่วยรันไทม์ของ SDK
    แทนการระบุหรือแก้ไขไฟล์ที่กำลังใช้งาน

    | พื้นผิวที่ต้องย้าย | สิ่งทดแทน |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` และ `resolveSessionStoreEntry(...)` ที่เลิกแนะนำ | `getSessionEntry(...)`, `listSessionEntries(...)` และการแก้ไขเซสชันระดับแถว |
    | `resolveSessionFilePath(...)` ที่เลิกแนะนำ | ข้อมูลระบุตัวตนของเซสชัน (`sessionKey`, `sessionId` และตัวช่วยเป้าหมายรันไทม์ของ SDK) ร่วมกับเมธอด Gateway ที่ทำงานกับเซสชันปัจจุบัน |
    | `saveSessionStore(...)` ที่ถูกนำออก | API รันไทม์เซสชันที่ Gateway เป็นเจ้าของ โค้ด Plugin ควรร้องขอหรือแก้ไขสถานะเซสชันผ่านตัวช่วยรันไทม์/บริบทที่มีเอกสารกำกับ แทนการเขียนไฟล์ที่เก็บซึ่งกำลังใช้งาน |
    | `resolveSessionTranscriptPathInDir(...)` และ `resolveAndPersistSessionFile(...)` ที่ถูกนำออก | ข้อมูลระบุตัวตนของเซสชันและเมธอด Gateway ที่ทำงานกับเซสชันปัจจุบัน |
    | `readLatestAssistantTextFromSessionTranscript(...)` | ตัวอ่านบทถอดเสียงที่อิงข้อมูลระบุตัวตนซึ่งเปิดเผยโดยบริบทรันไทม์ปัจจุบัน หรือเมธอดประวัติ/เซสชันของ Gateway เมื่อ Plugin อยู่นอกเส้นทางเจ้าของบทถอดเสียง |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` พร้อม `agentId`, `sessionKey` และ `sessionId` |
    | อินพุตการซิงค์หน่วยความจำ เช่น `sessionFiles` | แหล่งบทถอดเสียง/เซสชันที่อิงข้อมูลระบุตัวตนซึ่งโฮสต์จัดเตรียมให้ อย่าไล่อ่านไฟล์ JSONL ที่กำลังใช้งานสำหรับเซสชันสด |
    | ตัวเลือกรันไทม์ชื่อ `transcriptPath` หรือ `sessionFile` สำหรับเซสชันที่กำลังใช้งาน | `sessionTarget`/ออบเจ็กต์เป้าหมายรันไทม์ที่เก็บข้อมูลระบุตัวตนของเซสชันโดยไม่ผูกกับระบบจัดเก็บ |

    ไฟล์บทถอดเสียง JSONL แบบเดิมยังคงใช้ได้ในฐานะอาร์ติแฟกต์สำหรับการนำเข้า การเก็บถาวร การส่งออก และ
    การสนับสนุน แต่ไม่ใช่สัญญารันไทม์ในภาวะปกติสำหรับ
    เซสชันที่กำลังใช้งานอีกต่อไป

    Plugin ทางการที่เผยแพร่พร้อม `v2026.7.1-beta.5` ได้นำเข้าตัวช่วยที่เลิกแนะนำ
    สี่รายการข้างต้น `openclaw/plugin-sdk/session-store-runtime` จะคงบริดจ์ดังกล่าวไว้ตามเดิม
    จนถึง 2026-10-12 ส่วน Plugin ใหม่ต้องใช้สิ่งทดแทน
    `resolveStorePath(...)` ยังคงเป็นตัวช่วย SDK ที่รองรับและไม่รวมอยู่ใน
    การเลิกแนะนำนี้

    `openclaw plugins inspect --all --runtime` จะรายงาน Plugin ที่ไม่ได้รวมมาให้ซึ่ง
    ข้อผิดพลาดในการโหลดหรือข้อมูลวินิจฉัยยังคงอ้างถึง API ไฟล์ที่ถูกนำออกเหล่านี้ การตรวจสอบคำแนะนำ
    `@openclaw/plugin-inspector` ต้องใช้เวอร์ชัน `0.3.17` หรือ
    ใหม่กว่า เพื่อให้การสแกนแพ็กเกจภายนอกทำเครื่องหมายตัวช่วยเซสชันทั้งที่เก็บ
    ตัวช่วยเส้นทางไฟล์เซสชัน เป้าหมายไฟล์บทถอดเสียงแบบเดิม และตัวช่วยบทถอดเสียง
    ระดับล่างก่อนเผยแพร่ด้วย

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **เดิม**: `runtime.tasks.flow` (เอกพจน์) ส่งคืนตัวเข้าถึงโฟลว์งาน
    แบบสด

    **ใหม่**: `runtime.tasks.managedFlows` คงรันไทม์การแก้ไข TaskFlow
    ที่มีการจัดการไว้สำหรับ Plugin ที่สร้าง อัปเดต ยกเลิก หรือเรียกใช้งานย่อยจาก
    โฟลว์ ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเฉพาะ
    การอ่านที่อิง DTO

    ```typescript
    // ก่อน
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // หลัง
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    นามแฝงแบบเดิมถูกนำออกในเดือนกรกฎาคม 2026

  </Accordion>

  <Accordion title="แฟกทอรีส่วนขยายแบบฝัง -> มิดเดิลแวร์ผลลัพธ์เครื่องมือของเอเจนต์">
    กล่าวถึงแล้วใน [วิธีย้ายระบบ](#how-to-migrate) ด้านบน และรวมไว้ที่นี่เพื่อ
    ความครบถ้วน: เส้นทาง `api.registerEmbeddedExtensionFactory(...)`
    ที่ถูกนำออกและใช้ได้เฉพาะตัวเรียกใช้แบบฝัง ถูกแทนที่ด้วย
    `api.registerAgentToolResultMiddleware(...)` พร้อมรายการรันไทม์ที่ระบุอย่างชัดเจน
    ใน `contracts.agentToolResultMiddleware`
  </Accordion>

  <Accordion title="นามแฝง OpenClawSchemaType -> OpenClawConfig">
    นามแฝง SDK ราก `OpenClawSchemaType` ถูกนำออกแล้ว ใช้ชื่อมาตรฐาน
    `OpenClawConfig`

    ```typescript
    // ก่อน
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // หลัง
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกแนะนำระดับส่วนขยาย (ภายใน Plugin ช่องทาง/ผู้ให้บริการที่รวมมาให้ภายใต้
`extensions/`) จะติดตามภายใน barrel `api.ts` และ `runtime-api.ts`
ของแต่ละส่วน การเปลี่ยนแปลงเหล่านี้ไม่กระทบสัญญา Plugin ของบุคคลที่สามและไม่ได้ระบุไว้
ที่นี่ หากใช้งาน barrel ภายในของ Plugin ที่รวมมาให้โดยตรง โปรดอ่าน
ความคิดเห็นเกี่ยวกับการเลิกแนะนำใน barrel นั้นก่อนอัปเกรด
</Note>

## การย้ายระบบ Talk และเสียงแบบเรียลไทม์

โค้ดเสียงแบบเรียลไทม์ โทรศัพท์ การประชุม และ Talk บนเบราว์เซอร์ใช้ตัวควบคุม
เซสชัน Talk เดียวกัน ซึ่งส่งออกโดย `openclaw/plugin-sdk/realtime-voice`
ตัวควบคุมเป็นเจ้าของเอนเวโลปเหตุการณ์ Talk ร่วม สถานะรอบการโต้ตอบที่กำลังใช้งาน สถานะการบันทึก
สถานะเสียงเอาต์พุต ประวัติเหตุการณ์ล่าสุด และการปฏิเสธรอบการโต้ตอบที่ล้าสมัย
Plugin ของผู้ให้บริการเป็นเจ้าของเซสชันเรียลไทม์เฉพาะผู้จำหน่าย Plugin การประชุมบนเบราว์เซอร์
ใช้ `openclaw/plugin-sdk/meeting-runtime` สำหรับกลไกเซสชัน เบราว์เซอร์ เสียง โฮสต์ Node
การปรึกษาเอเจนต์ และการโทรด้วยเสียง จากนั้นใช้ `MeetingPlatformAdapter`
สำหรับกฎ URL สคริปต์ DOM การแมปการดำเนินการด้วยตนเอง คำบรรยาย การสร้าง และแผน
โทรเข้า API REST ของแพลตฟอร์ม, OAuth, อาร์ติแฟกต์, ตัวเลือก และชื่อบนสายสัญญาณยังคงอยู่ใน
Plugin แผนสิทธิ์ของเบราว์เซอร์จะได้รับ URL การประชุมที่ร้องขอ เพื่อให้แต่ละ
แพลตฟอร์มสามารถให้สิทธิ์เฉพาะต้นทางที่รองรับอย่างตรงตัว รันไทม์เซสชันต้อง
ปรับสถานะความสมบูรณ์แบบสดที่เฉพาะเจาะจงต่อแพลตฟอร์มให้เป็นมาตรฐานหลังยืนยันว่าออกจากเบราว์เซอร์แล้วด้วย
ฟิลด์บทถอดเสียงย้อนหลังอาจคงอยู่ได้ แต่ความพร้อมของคำบรรยายและเสียงต้อง
ไม่คงสถานะใช้งานหลังออกจากเซสชัน

พื้นผิวทั้งหมดที่รวมมาให้ทำงานบนตัวควบคุมร่วม ได้แก่ รีเลย์เบราว์เซอร์
การส่งต่อห้องที่มีการจัดการ เสียงเรียลไทม์ของการโทร STT แบบสตรีมของการโทร Google
Meet แบบเรียลไทม์ และการกดเพื่อพูดแบบเนทีฟ Gateway ประกาศช่องเหตุการณ์ Talk สดหนึ่งช่อง
ใน `hello-ok.features.events`: `talk.event`

โค้ดใหม่ไม่ควรเรียก `createTalkEventSequencer(...)` โดยตรง เว้นแต่
กำลังใช้อะแดปเตอร์ระดับล่างหรือฟิกซ์เจอร์ทดสอบ ให้ใช้ตัวควบคุมร่วมเพื่อให้
ไม่สามารถปล่อยเหตุการณ์ที่จำกัดขอบเขตตามรอบการโต้ตอบโดยไม่มีรหัสรอบการโต้ตอบ การเรียก `turnEnd` /
`turnCancel` ที่ล้าสมัยไม่สามารถล้างรอบการโต้ตอบใหม่กว่าที่กำลังใช้งาน และเหตุการณ์
วงจรชีวิตเสียงเอาต์พุตยังคงสอดคล้องกันทั้งในระบบโทรศัพท์ การประชุม รีเลย์เบราว์เซอร์
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

เซสชัน WebRTC/เว็บซ็อกเก็ตของผู้ให้บริการที่เบราว์เซอร์เป็นเจ้าของใช้ `talk.client.create`
เนื่องจากเบราว์เซอร์เป็นเจ้าของการเจรจากับผู้ให้บริการและการขนส่งสื่อ ขณะที่
Gateway เป็นเจ้าของข้อมูลรับรอง คำสั่ง และนโยบายเครื่องมือ `talk.session.*` คือ
พื้นผิวร่วมที่ Gateway จัดการสำหรับเรียลไทม์ผ่านรีเลย์ Gateway การถอดเสียงผ่านรีเลย์
Gateway และเซสชัน STT/TTS แบบเนทีฟของห้องที่มีการจัดการ

การกำหนดค่าแบบเดิมที่วางตัวเลือกเรียลไทม์ไว้ข้าง `talk.provider` /
`talk.providers` ควรซ่อมแซมด้วย `openclaw doctor --fix`; รันไทม์ Talk
จะไม่ตีความการกำหนดค่าผู้ให้บริการเสียงพูด/TTS ใหม่ว่าเป็นการกำหนดค่าผู้ให้บริการเรียลไทม์

ชุดค่าผสม `talk.session.create` ที่รองรับถูกจำกัดให้มีจำนวนน้อยโดยตั้งใจ:

| โหมด            | การขนส่ง       | สมอง           | เจ้าของ              | หมายเหตุ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | เสียงจากผู้ให้บริการแบบสองทิศทางเต็มรูปแบบที่เชื่อมผ่าน Gateway โดยการเรียกใช้เครื่องมือจะกำหนดเส้นทางผ่านเครื่องมือ agent-consult           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | เฉพาะ STT แบบสตรีม โดยผู้เรียกจะส่งเสียงอินพุตและรับเหตุการณ์ข้อความถอดเสียง                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ห้องเนทีฟ/ไคลเอนต์ | ห้องรูปแบบกดเพื่อพูดและวอล์กกีทอล์กกี ซึ่งไคลเอนต์เป็นเจ้าของการบันทึก/เล่นเสียง และ Gateway เป็นเจ้าของสถานะรอบการสนทนา |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ห้องเนทีฟ/ไคลเอนต์ | โหมดห้องสำหรับผู้ดูแลระบบเท่านั้น ใช้กับพื้นผิวของบุคคลที่หนึ่งที่เชื่อถือได้ซึ่งดำเนินการเครื่องมือของ Gateway โดยตรง                  |

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

ชุดคำศัพท์ควบคุมแบบรวมศูนย์ได้รับการกำหนดให้มีขอบเขตแคบเช่นกัน:

| เมธอด                          | ใช้กับ                                              | สัญญา                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | เพิ่มก้อนเสียง PCM แบบ base64 ต่อท้ายเซสชันของผู้ให้บริการซึ่งเป็นของการเชื่อมต่อ Gateway เดียวกัน                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | เริ่มรอบของผู้ใช้ในห้องที่มีการจัดการ                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | สิ้นสุดรอบที่ใช้งานอยู่หลังจากตรวจสอบรอบที่ล้าสมัย                                                                                                                                                                          |
| `talk.session.cancelTurn`       | เซสชันทั้งหมดที่ Gateway เป็นเจ้าของ                              | ยกเลิกงานบันทึก/ผู้ให้บริการ/เอเจนต์/TTS ที่ใช้งานอยู่สำหรับรอบหนึ่ง                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | หยุดเอาต์พุตเสียงของผู้ช่วยโดยไม่จำเป็นต้องสิ้นสุดรอบของผู้ใช้                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ดำเนินการเรียกใช้เครื่องมือของผู้ให้บริการให้เสร็จสิ้นหลังจากการทำงานแบบอะซิงโครนัสใด ๆ ที่บริดจ์เปิดเผย โดยส่ง `options.willContinue` สำหรับเอาต์พุตระหว่างดำเนินการ หรือส่ง `options.suppressResponse` เมื่อรองรับ เพื่อหลีกเลี่ยงการตอบกลับจากผู้ช่วยอีกครั้ง |
| `talk.session.steer`            | เซสชัน Talk ที่มีเอเจนต์รองรับ                              | ส่งการควบคุมด้วยเสียง `status`, `steer`, `cancel` หรือ `followup` ไปยังการทำงานแบบฝังที่ใช้งานอยู่ ซึ่งได้รับการแก้ไขจากเซสชัน Talk                                                                                                 |
| `talk.session.close`            | เซสชันแบบรวมศูนย์ทั้งหมด                                    | หยุดเซสชันรีเลย์หรือเพิกถอนสถานะห้องที่มีการจัดการ จากนั้นลืมรหัสเซสชันแบบรวมศูนย์                                                                                                                                     |

อย่าเพิ่มกรณีพิเศษของผู้ให้บริการหรือแพลตฟอร์มในแกนหลักเพื่อให้การทำงานนี้สำเร็จ
แกนหลักเป็นเจ้าของความหมายของเซสชัน Talk ส่วน Plugin ของผู้ให้บริการเป็นเจ้าของการตั้งค่าเซสชันของผู้จำหน่าย
การโทรด้วยเสียงและ Google Meet เป็นเจ้าของอะแดปเตอร์โทรศัพท์/การประชุม ส่วนเบราว์เซอร์และแอป
เนทีฟเป็นเจ้าของ UX สำหรับการบันทึก/เล่นเสียงของอุปกรณ์

## กำหนดเวลาการนำออก

| เมื่อใด                                        | สิ่งที่จะเกิดขึ้น                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **ขณะนี้**                                     | พื้นผิวที่เลิกใช้แล้วและรองรับคำเตือนจะส่งคำเตือนขณะรันไทม์ ส่วนตัวป้องกันของรีพอซิทอรีจะปฏิเสธการนำเข้า SDK ที่เลิกใช้แล้วจากแกนหลักและ Plugin ที่รวมมา |
| **วันที่ `removeAfter` ของระเบียนความเข้ากันได้แต่ละรายการ** | พื้นผิวนั้นมีสิทธิ์ถูกนำออก โดย `pnpm plugins:boundary-report --fail-on-eligible-compat` จะทำให้ CI ล้มเหลวเมื่อพ้นวันที่ดังกล่าว    |
| **รุ่นหลักถัดไป**                      | พื้นผิวใด ๆ ที่ยังไม่ได้ย้ายจะถูกนำออก และ Plugin ที่ยังใช้งานพื้นผิวเหล่านั้นจะล้มเหลว                                                          |

เส้นทางย่อย SDK สาธารณะที่เหลือด้านล่างมีช่วงเวลาการนำออกที่อ้างอิงรีจิสทรี
แถววันที่ 30 กรกฎาคมถูกนำออกหลังจากการกวาดตรวจช่วงต้นที่ได้รับอนุญาตจากผู้ดูแล:
เส้นทางย่อยที่ไม่ได้ใช้งานถูกลบ นามแฝงความเข้ากันได้ก่อนหน้าถูกลบ และ
โมดูลที่ใช้เฉพาะแบบรวมมาถูกลดระดับเป็นการแมปบิลด์แบบส่วนตัวในเครื่อง

| `removeAfter` | ระดับ                               | เส้นทางย่อย SDK                                                                                                                                                           |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | การเลิกใช้เพื่อความเข้ากันได้ก่อนหน้านี้ | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod` |
| `2026-09-01`  | การเลิกใช้เพื่อความเข้ากันได้ก่อนหน้านี้ | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                    |

Plugin แกนหลักทั้งหมดได้ย้ายแล้ว Plugin ภายนอกควรย้าย
ก่อนรุ่นหลักถัดไป เรียกใช้ `pnpm plugins:boundary-report` เพื่อดูว่า
ระเบียนความเข้ากันได้ใดสำหรับพื้นผิวที่ Plugin ของคุณใช้งานมีกำหนดถึงเร็วที่สุด

## การระงับคำเตือนชั่วคราว

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นช่องทางหลีกเลี่ยงชั่วคราว ไม่ใช่วิธีแก้ปัญหาถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) - สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิงการนำเข้าเส้นทางย่อยฉบับเต็ม
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้าง Plugin ช่องทาง
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การสร้าง Plugin ผู้ให้บริการ
- [กลไกภายในของ Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรม
- [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest) - ข้อมูลอ้างอิงสคีมาไฟล์ Manifest
