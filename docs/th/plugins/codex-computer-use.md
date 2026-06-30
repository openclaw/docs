---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw โหมด Codex ใช้ Codex Computer Use
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use, PeekabooBridge และ cua-driver MCP โดยตรง
    - คุณกำลังตัดสินใจระหว่าง Codex Computer Use กับการตั้งค่า cua-driver MCP โดยตรง
    - คุณกำลังกำหนดค่า computerUse สำหรับ Plugin Codex ที่รวมมาให้
    - คุณกำลังแก้ปัญหาสถานะหรือการติดตั้ง /codex computer-use
summary: ตั้งค่า Codex Computer Use สำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: การใช้งานคอมพิวเตอร์ของ Codex
x-i18n:
    generated_at: "2026-06-30T14:31:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use เป็น Plugin MCP แบบเนทีฟของ Codex สำหรับควบคุมเดสก์ท็อปภายในเครื่อง OpenClaw
ไม่ได้รวมแอปเดสก์ท็อปไว้ในแพ็กเกจ, ไม่ดำเนินการเดสก์ท็อปเอง, และไม่ข้าม
สิทธิ์ของ Codex Plugin `codex` ที่มาพร้อมกันมีหน้าที่เตรียม Codex app-server เท่านั้น:
เปิดใช้การรองรับ Plugin ของ Codex, ค้นหาหรือติดตั้ง Plugin Codex
Computer Use ที่กำหนดไว้, ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use` พร้อมใช้งาน, แล้ว
ปล่อยให้ Codex เป็นเจ้าของการเรียกเครื่องมือ MCP แบบเนทีฟระหว่างเทิร์นในโหมด Codex

ใช้หน้านี้เมื่อ OpenClaw ใช้ฮาร์เนส Codex แบบเนทีฟอยู่แล้ว สำหรับ
การตั้งค่ารันไทม์เอง ดู [ฮาร์เนส Codex](/th/plugins/codex-harness)

## OpenClaw.app และ Peekaboo

การผสานรวม Peekaboo ของ OpenClaw.app แยกจาก Codex Computer Use แอป
macOS สามารถโฮสต์ซ็อกเก็ต PeekabooBridge เพื่อให้ CLI `peekaboo` ใช้
สิทธิ์ Accessibility และ Screen Recording ภายในเครื่องของแอปซ้ำสำหรับ
เครื่องมืออัตโนมัติของ Peekaboo เอง บริดจ์นั้นไม่ได้ติดตั้งหรือพร็อกซี Codex Computer Use และ
Codex Computer Use ไม่ได้เรียกผ่านซ็อกเก็ต PeekabooBridge

ใช้ [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo) เมื่อคุณต้องการให้ OpenClaw.app เป็น
โฮสต์ที่ตระหนักถึงสิทธิ์สำหรับระบบอัตโนมัติของ Peekaboo CLI ใช้หน้านี้เมื่อ
เอเจนต์ OpenClaw ในโหมด Codex ควรมี Plugin MCP `computer-use` แบบเนทีฟของ Codex
พร้อมใช้งานก่อนเริ่มเทิร์น

## แอป iOS

แอป iOS แยกจาก Codex Computer Use แอปนี้ไม่ได้ติดตั้งหรือพร็อกซี
เซิร์ฟเวอร์ MCP `computer-use` ของ Codex และไม่ใช่แบ็กเอนด์สำหรับควบคุมเดสก์ท็อป
แต่แอป iOS จะเชื่อมต่อเป็นโหนด OpenClaw และเปิดเผยความสามารถของมือถือ
ผ่านคำสั่งโหนด เช่น `canvas.*`, `camera.*`, `screen.*`,
`location.*`, และ `talk.*`

ใช้ [iOS](/th/platforms/ios) เมื่อคุณต้องการให้เอเจนต์ควบคุมโหนด iPhone ผ่าน
Gateway ใช้หน้านี้เมื่อเอเจนต์ในโหมด Codex ควรควบคุมเดสก์ท็อป macOS ภายในเครื่อง
ผ่าน Plugin Computer Use แบบเนทีฟของ Codex

## MCP cua-driver โดยตรง

Codex Computer Use ไม่ใช่วิธีเดียวในการเปิดเผยการควบคุมเดสก์ท็อป หากคุณต้องการให้
รันไทม์ที่ OpenClaw จัดการเรียกไดรเวอร์ของ TryCua โดยตรง ให้ใช้เซิร์ฟเวอร์
`cua-driver mcp` จาก upstream ผ่านรีจิสทรี MCP ของ OpenClaw แทน
โฟลว์มาร์เก็ตเพลสเฉพาะของ Codex

หลังจากติดตั้ง `cua-driver` แล้ว ให้ขอคำสั่ง OpenClaw จากเครื่องมือนั้น:

```bash
cua-driver mcp-config --client openclaw
```

หรือจดทะเบียนเซิร์ฟเวอร์ stdio ด้วยตัวเอง:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

เส้นทางนั้นคงพื้นผิวเครื่องมือ MCP ของ upstream ไว้ครบถ้วน รวมถึงสคีมาของไดรเวอร์
และการตอบกลับ MCP แบบมีโครงสร้าง ใช้เส้นทางนี้เมื่อคุณต้องการให้ไดรเวอร์ CUA
พร้อมใช้งานเป็นเซิร์ฟเวอร์ MCP ปกติของ OpenClaw ใช้การตั้งค่า Codex Computer Use ใน
หน้านี้เมื่อ Codex app-server ควรเป็นเจ้าของการติดตั้ง Plugin, การโหลด MCP ซ้ำ,
และการเรียกเครื่องมือแบบเนทีฟภายในเทิร์นในโหมด Codex

ไดรเวอร์ของ CUA เฉพาะสำหรับ macOS และยังต้องใช้สิทธิ์ macOS ภายในเครื่อง
ที่แอปแจ้งขอ เช่น Accessibility และ Screen Recording OpenClaw
ไม่ได้ติดตั้ง `cua-driver`, ให้สิทธิ์เหล่านั้น, หรือข้ามโมเดลความปลอดภัยของไดรเวอร์
จาก upstream

## การตั้งค่าอย่างรวดเร็ว

ตั้งค่า `plugins.entries.codex.config.computerUse` เมื่อเทิร์นในโหมด Codex ต้องมี
Computer Use พร้อมใช้งานก่อนเริ่มเธรด `autoInstall: true` เลือกใช้
Computer Use และให้ OpenClaw ติดตั้งหรือเปิดใช้ใหม่ก่อนเทิร์น:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

ด้วยการตั้งค่านี้ OpenClaw จะตรวจสอบ Codex app-server ก่อนเทิร์นในโหมด Codex แต่ละครั้ง
หาก Computer Use หายไปแต่ Codex app-server ค้นพบมาร์เก็ตเพลสที่ติดตั้งได้แล้ว
OpenClaw จะขอให้ Codex app-server ติดตั้งหรือเปิดใช้
Plugin อีกครั้งและโหลดเซิร์ฟเวอร์ MCP ซ้ำ บน macOS เมื่อไม่มีมาร์เก็ตเพลสที่ตรงกัน
ถูกจดทะเบียนไว้และมีบันเดิลแอป Codex มาตรฐานอยู่ OpenClaw จะพยายาม
จดทะเบียนมาร์เก็ตเพลส Codex ที่มาพร้อมกันจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ก่อนที่จะ
ล้มเหลว หากการตั้งค่ายังทำให้เซิร์ฟเวอร์ MCP พร้อมใช้งานไม่ได้ เทิร์นจะล้มเหลว
ก่อนเริ่มเธรด

หลังจากเปลี่ยนการตั้งค่า Computer Use ให้ใช้ `/new` หรือ `/reset` ในแชทที่ได้รับผลกระทบ
ก่อนทดสอบ หากเธรด Codex ที่มีอยู่เริ่มไปแล้ว

ในการเริ่มต้น stdio ที่จัดการบน macOS OpenClaw จะเลือกบันเดิลแอปเดสก์ท็อป Codex
ที่ลงนามแล้วที่ `/Applications/Codex.app/Contents/Resources/codex` เมื่อมีอยู่
สิ่งนี้ทำให้ Computer Use อยู่ภายใต้บันเดิลแอปที่เป็นเจ้าของสิทธิ์ควบคุมเดสก์ท็อป
ภายในเครื่อง หากไม่ได้ติดตั้งแอปเดสก์ท็อป OpenClaw จะถอยกลับไปใช้
ไบนารี Codex ที่จัดการซึ่งติดตั้งอยู่ข้าง Plugin หากแอปเดสก์ท็อปที่ติดตั้งไว้
เริ่มต้นด้วยเวอร์ชัน app-server ที่ไม่รองรับ OpenClaw จะปิด child นั้น
และลองตัวเลือกไบนารีที่จัดการถัดไปแทนที่จะปล่อยให้แอปเดสก์ท็อปที่ล้าสมัย
บดบังทางเลือกสำรองภายใน Plugin การตั้งค่า `appServer.command` อย่างชัดเจน
หรือ `OPENCLAW_CODEX_APP_SERVER_BIN` ยังคงแทนที่การเลือกที่จัดการนี้

## คำสั่ง

ใช้คำสั่ง `/codex computer-use` จากช่องทางแชทใดก็ได้ที่มีพื้นผิวคำสั่งของ Plugin `codex`
คำสั่งเหล่านี้เป็นคำสั่งแชท/รันไทม์ของ OpenClaw
ไม่ใช่คำสั่งย่อย CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` เป็นแบบอ่านอย่างเดียว ไม่เพิ่มแหล่งมาร์เก็ตเพลส, ติดตั้ง Plugin, หรือ
เปิดใช้การรองรับ Plugin ของ Codex หากไม่มีการตั้งค่าใดเลือกใช้ Computer Use `status` สามารถ
รายงานว่าปิดใช้งานอยู่ได้แม้หลังจากคำสั่งติดตั้งแบบครั้งเดียว

`install` เปิดใช้การรองรับ Plugin ของ Codex app-server, เพิ่ม
แหล่งมาร์เก็ตเพลสที่กำหนดไว้ได้ตามต้องการ, ติดตั้งหรือเปิดใช้ Plugin ที่กำหนดไว้ใหม่ผ่าน Codex
app-server, โหลดเซิร์ฟเวอร์ MCP ซ้ำ, และตรวจสอบว่าเซิร์ฟเวอร์ MCP เปิดเผยเครื่องมือ
เนื่องจากการติดตั้งเปลี่ยนทรัพยากรโฮสต์ที่เชื่อถือได้ เฉพาะเจ้าของหรือ
ไคลเอนต์ Gateway `operator.admin` เท่านั้นที่เรียกใช้ `install` ได้ ผู้ส่งที่ได้รับอนุญาตรายอื่น
ยังคงใช้คำสั่ง `status` แบบอ่านอย่างเดียวต่อได้ รวมถึงพร้อมการแทนที่

## ตัวเลือกมาร์เก็ตเพลส

OpenClaw ใช้ API app-server เดียวกับที่ Codex เปิดเผยเอง
ฟิลด์มาร์เก็ตเพลสเลือกตำแหน่งที่ Codex ควรค้นหา `computer-use`

| ฟิลด์                | ใช้เมื่อ                                                        | การรองรับการติดตั้ง                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| ไม่มีฟิลด์มาร์เก็ตเพลส | คุณต้องการให้ Codex app-server ใช้มาร์เก็ตเพลสที่รู้อยู่แล้ว | ได้ เมื่อ app-server ส่งคืนมาร์เก็ตเพลสภายในเครื่อง        |
| `marketplaceSource`  | คุณมีแหล่งมาร์เก็ตเพลส Codex ที่ app-server เพิ่มได้         | ได้ สำหรับ `/codex computer-use install` แบบชัดเจน         |
| `marketplacePath`    | คุณรู้พาธไฟล์มาร์เก็ตเพลสภายในเครื่องบนโฮสต์อยู่แล้ว   | ได้ สำหรับการติดตั้งแบบชัดเจนและการติดตั้งอัตโนมัติเมื่อเริ่มเทิร์น   |
| `marketplaceName`    | คุณต้องการเลือกมาร์เก็ตเพลสที่จดทะเบียนไว้แล้วหนึ่งรายการตามชื่อ  | ได้เฉพาะเมื่อมาร์เก็ตเพลสที่เลือกมีพาธภายในเครื่อง |

โฮม Codex ใหม่อาจต้องใช้เวลาสั้น ๆ เพื่อ seed มาร์เก็ตเพลสทางการ
ระหว่างการติดตั้ง OpenClaw จะ poll `plugin/list` เป็นเวลาสูงสุด
`marketplaceDiscoveryTimeoutMs` มิลลิวินาที ค่าเริ่มต้นคือ 60 วินาที

หากมาร์เก็ตเพลสที่รู้จักหลายรายการมี Computer Use OpenClaw จะเลือก
`openai-bundled` ก่อน จากนั้น `openai-curated` แล้วจึง `local` การจับคู่ที่ไม่รู้จักและกำกวม
จะล้มเหลวแบบปิดและขอให้คุณตั้งค่า `marketplaceName` หรือ `marketplacePath`

## มาร์เก็ตเพลส macOS ที่มาพร้อมกัน

บิลด์เดสก์ท็อป Codex รุ่นล่าสุดรวม Computer Use ไว้ที่นี่:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

เมื่อ `computerUse.autoInstall` เป็น true และไม่มีมาร์เก็ตเพลสที่มี
`computer-use` ถูกจดทะเบียนไว้ OpenClaw จะพยายามเพิ่ม root มาร์เก็ตเพลสที่มาพร้อมกันตามมาตรฐาน
โดยอัตโนมัติ:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

คุณยังสามารถจดทะเบียนอย่างชัดเจนจากเชลล์ด้วย Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

หากคุณใช้พาธแอป Codex ที่ไม่เป็นมาตรฐาน ให้เรียก `/codex computer-use install
--source <marketplace-root>` หนึ่งครั้ง หรือตั้งค่า `computerUse.marketplacePath` เป็น
พาธไฟล์มาร์เก็ตเพลสภายในเครื่อง ใช้ `--marketplace-path` เฉพาะเมื่อคุณมี
พาธไฟล์ JSON ของมาร์เก็ตเพลส ไม่ใช่ root มาร์เก็ตเพลสที่มาพร้อมกัน

## ขีดจำกัดแค็ตตาล็อกระยะไกล

Codex app-server สามารถแสดงรายการและอ่านรายการแค็ตตาล็อกแบบระยะไกลเท่านั้นได้ แต่ปัจจุบัน
ยังไม่รองรับ `plugin/install` ระยะไกล นั่นหมายความว่า `marketplaceName` สามารถ
เลือกมาร์เก็ตเพลสแบบระยะไกลเท่านั้นสำหรับการตรวจสอบสถานะได้ แต่การติดตั้งและการเปิดใช้ใหม่
ยังต้องใช้มาร์เก็ตเพลสภายในเครื่องผ่าน `marketplaceSource` หรือ `marketplacePath`

หากสถานะบอกว่า Plugin พร้อมใช้งานในมาร์เก็ตเพลส Codex ระยะไกล แต่ไม่รองรับการติดตั้ง
ระยะไกล ให้เรียกติดตั้งด้วยแหล่งหรือพาธภายในเครื่อง:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## อ้างอิงการกำหนดค่า

| ฟิลด์                           | ค่าเริ่มต้น        | ความหมาย                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | อนุมาน       | ต้องใช้ Computer Use ค่าเริ่มต้นเป็น true เมื่อมีการตั้งค่าฟิลด์ Computer Use อื่น |
| `autoInstall`                   | false          | ติดตั้งหรือเปิดใช้ใหม่จากมาร์เก็ตเพลสที่ค้นพบแล้วเมื่อเริ่มเทิร์น       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | ระยะเวลาที่การติดตั้งรอการค้นพบมาร์เก็ตเพลสของ Codex app-server             |
| `marketplaceSource`             | ไม่ได้ตั้งค่า          | สตริงแหล่งที่ส่งไปยัง `marketplace/add` ของ Codex app-server                    |
| `marketplacePath`               | ไม่ได้ตั้งค่า          | พาธไฟล์มาร์เก็ตเพลส Codex ภายในเครื่องที่มี Plugin                       |
| `marketplaceName`               | ไม่ได้ตั้งค่า          | ชื่อมาร์เก็ตเพลส Codex ที่จดทะเบียนไว้เพื่อเลือก                                   |
| `pluginName`                    | `computer-use` | ชื่อ Plugin ในมาร์เก็ตเพลส Codex                                                 |
| `mcpServerName`                 | `computer-use` | ชื่อเซิร์ฟเวอร์ MCP ที่ Plugin ที่ติดตั้งเปิดเผย                               |

การติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นตั้งใจปฏิเสธค่า `marketplaceSource`
ที่กำหนดไว้ การเพิ่มแหล่งใหม่เป็นการดำเนินการตั้งค่าอย่างชัดเจน ดังนั้นให้ใช้
`/codex computer-use install --source <marketplace-source>` หนึ่งครั้ง แล้วปล่อยให้
`autoInstall` จัดการการเปิดใช้ใหม่ในอนาคตจากมาร์เก็ตเพลสภายในเครื่องที่ค้นพบ
การติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นสามารถใช้ `marketplacePath` ที่กำหนดไว้ได้ เพราะนั่นเป็น
พาธภายในเครื่องบนโฮสต์อยู่แล้ว

## สิ่งที่ OpenClaw ตรวจสอบ

OpenClaw รายงานเหตุผลการตั้งค่าที่เสถียรภายในและจัดรูปแบบสถานะที่ผู้ใช้เห็น
สำหรับแชท:

| เหตุผล                       | ความหมาย                                                | ขั้นตอนถัดไป                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` ถูกประเมินเป็น false.               | ตั้งค่า `enabled` หรือฟิลด์ Computer Use อื่น  |
| `marketplace_missing`        | ไม่มี marketplace ที่ตรงกันพร้อมใช้งาน                 | กำหนดค่าแหล่งที่มา พาธ หรือชื่อ marketplace  |
| `plugin_not_installed`       | มี marketplace อยู่ แต่ยังไม่ได้ติดตั้ง plugin   | เรียกใช้การติดตั้งหรือเปิดใช้ `autoInstall`          |
| `plugin_disabled`            | ติดตั้ง Plugin แล้วแต่ถูกปิดใช้งานในคอนฟิก Codex      | เรียกใช้การติดตั้งเพื่อเปิดใช้งานอีกครั้ง                  |
| `remote_install_unsupported` | marketplace ที่เลือกเป็นแบบรีโมตเท่านั้น                   | ใช้ `marketplaceSource` หรือ `marketplacePath` |
| `mcp_missing`                | เปิดใช้งาน Plugin แล้ว แต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน  | ตรวจสอบ Codex Computer Use และสิทธิ์ของ OS  |
| `ready`                      | Plugin และเครื่องมือ MCP พร้อมใช้งาน                    | เริ่มเทิร์นโหมด Codex                    |
| `check_failed`               | คำขอ Codex app-server ล้มเหลวระหว่างการตรวจสอบสถานะ | ตรวจสอบการเชื่อมต่อและบันทึกของ app-server       |
| `auto_install_blocked`       | การตั้งค่าเมื่อเริ่มเทิร์นจำเป็นต้องเพิ่มแหล่งที่มาใหม่       | เรียกใช้การติดตั้งแบบชัดเจนก่อน                   |

เอาต์พุตของแชตมีสถานะของ Plugin, สถานะเซิร์ฟเวอร์ MCP, marketplace, เครื่องมือ
เมื่อพร้อมใช้งาน และข้อความเฉพาะสำหรับขั้นตอนการตั้งค่าที่ล้มเหลว

## สิทธิ์ของ macOS

Computer Use ใช้ได้เฉพาะ macOS เซิร์ฟเวอร์ MCP ที่ Codex เป็นเจ้าของอาจต้องมี
สิทธิ์ OS ภายในเครื่องก่อนจึงจะตรวจสอบหรือควบคุมแอปได้ หาก OpenClaw แจ้งว่า Computer Use
ติดตั้งแล้วแต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน ให้ตรวจสอบการตั้งค่า Computer Use ฝั่ง Codex
ก่อน:

- Codex app-server กำลังทำงานบนโฮสต์เดียวกับที่ควรเกิดการควบคุมเดสก์ท็อป
- เปิดใช้งาน Plugin Computer Use ในคอนฟิก Codex แล้ว
- เซิร์ฟเวอร์ MCP `computer-use` ปรากฏในสถานะ MCP ของ Codex app-server
- macOS ให้สิทธิ์ที่จำเป็นสำหรับแอปควบคุมเดสก์ท็อปแล้ว
- เซสชันโฮสต์ปัจจุบันเข้าถึงเดสก์ท็อปที่กำลังถูกควบคุมได้

OpenClaw ตั้งใจให้ล้มเหลวแบบปิดเมื่อ `computerUse.enabled` เป็น true เทิร์นโหมด
Codex ไม่ควรดำเนินต่ออย่างเงียบๆ โดยไม่มีเครื่องมือเดสก์ท็อปเนทีฟ
ที่คอนฟิกกำหนดไว้

## การแก้ไขปัญหา

**สถานะแจ้งว่ายังไม่ได้ติดตั้ง** เรียกใช้ `/codex computer-use install` หากไม่พบ
marketplace ให้ส่ง `--source` หรือ `--marketplace-path`

**สถานะแจ้งว่าติดตั้งแล้วแต่ปิดใช้งานอยู่** เรียกใช้ `/codex computer-use install` อีกครั้ง
การติดตั้งของ Codex app-server จะเขียนคอนฟิก Plugin กลับเป็นเปิดใช้งาน

**สถานะแจ้งว่าไม่รองรับการติดตั้งแบบรีโมต** ใช้แหล่งที่มาหรือพาธ marketplace ภายในเครื่อง
รายการแค็ตตาล็อกแบบรีโมตเท่านั้นสามารถตรวจดูได้ แต่ติดตั้งผ่าน API ของ app-server
ปัจจุบันไม่ได้

**สถานะแจ้งว่าเซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน** เรียกใช้การติดตั้งอีกครั้งหนึ่งเพื่อให้เซิร์ฟเวอร์
MCP โหลดซ้ำ หากยังไม่พร้อมใช้งาน ให้แก้ไขแอป Codex Computer Use,
สถานะ MCP ของ Codex app-server หรือสิทธิ์ macOS

**สถานะหรือโพรบหมดเวลาที่ `computer-use.list_apps`** Plugin และเซิร์ฟเวอร์ MCP
มีอยู่แล้ว แต่บริดจ์ Computer Use ภายในเครื่องไม่ตอบสนอง ออกจากหรือรีสตาร์ต
Codex Computer Use เปิด Codex Desktop ใหม่หากจำเป็น แล้วลองอีกครั้งในเซสชัน
OpenClaw ใหม่ หากโฮสต์เคยเรียกใช้ Computer Use ผ่าน Codex app-server แบบจัดการ
รุ่นเก่า ให้รีเฟรช Plugin ที่ติดตั้งจาก marketplace ที่บันเดิลมากับเดสก์ท็อป:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**เครื่องมือ Computer Use แจ้งว่า `Native hook relay unavailable`** ฮุกเครื่องมือเนทีฟของ Codex
ติดต่อรีเลย์ OpenClaw ที่ใช้งานอยู่ผ่านบริดจ์ภายในเครื่องหรือทางสำรอง Gateway ไม่ได้
เริ่มเซสชัน OpenClaw ใหม่ด้วย `/new` หรือ `/reset` หากใช้งานได้ครั้งหนึ่งแล้วล้มเหลวอีกครั้ง
ในการเรียกเครื่องมือภายหลัง แปลว่า `/new` เพียงล้างความพยายามปัจจุบันเท่านั้น ให้รีสตาร์ต
Codex app-server หรือ OpenClaw Gateway เพื่อให้เธรดเก่า
และการลงทะเบียนฮุกถูกทิ้งไป จากนั้นลองอีกครั้งในเซสชันใหม่

**การติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นปฏิเสธแหล่งที่มา** นี่เป็นพฤติกรรมโดยตั้งใจ เพิ่ม
แหล่งที่มาด้วยคำสั่ง `/codex computer-use install --source <marketplace-source>` แบบชัดเจน
ก่อน จากนั้นการติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นในอนาคตจะใช้ marketplace ภายในเครื่อง
ที่ค้นพบได้

## ที่เกี่ยวข้อง

- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo)
- [แอป iOS](/th/platforms/ios)
