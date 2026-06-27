---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw โหมด Codex ใช้ Codex Computer Use
    - คุณกำลังตัดสินใจระหว่าง Codex Computer Use, PeekabooBridge และ cua-driver MCP โดยตรง
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use กับการตั้งค่า MCP แบบเชื่อมตรงของ cua-driver
    - คุณกำลังกำหนดค่า computerUse สำหรับ Codex plugin ที่บันเดิลมา
    - คุณกำลังแก้ไขปัญหาสถานะหรือการติดตั้ง /codex computer-use
summary: ตั้งค่า Codex Computer Use สำหรับเอเจนต์ OpenClaw โหมด Codex
title: การใช้งานคอมพิวเตอร์ของ Codex
x-i18n:
    generated_at: "2026-06-27T17:52:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use คือ MCP Plugin แบบเนทีฟของ Codex สำหรับควบคุมเดสก์ท็อปภายในเครื่อง OpenClaw
ไม่ได้รวมแอปเดสก์ท็อปไว้ในแพ็กเกจ, ไม่ได้สั่งทำงานบนเดสก์ท็อปเอง, และไม่ได้ข้าม
สิทธิ์ของ Codex Plugin `codex` ที่มาพร้อมระบบจะเตรียมเฉพาะ Codex app-server:
โดยเปิดใช้การรองรับ Codex Plugin, ค้นหาหรือติดตั้ง Codex
Computer Use Plugin ที่กำหนดค่าไว้, ตรวจสอบว่า MCP server `computer-use` พร้อมใช้งาน, แล้ว
ปล่อยให้ Codex เป็นเจ้าของการเรียกใช้เครื่องมือ MCP แบบเนทีฟระหว่างเทิร์นในโหมด Codex

ใช้หน้านี้เมื่อ OpenClaw ใช้ harness เนทีฟของ Codex อยู่แล้ว สำหรับการตั้งค่า
runtime เอง โปรดดู [Codex harness](/th/plugins/codex-harness)

## OpenClaw.app และ Peekaboo

การผสาน Peekaboo ของ OpenClaw.app แยกจาก Codex Computer Use แอป
macOS สามารถโฮสต์ซ็อกเก็ต PeekabooBridge เพื่อให้ CLI `peekaboo` ใช้สิทธิ์
Accessibility และ Screen Recording ภายในเครื่องของแอปซ้ำได้สำหรับเครื่องมือ
อัตโนมัติของ Peekaboo เอง bridge นั้นไม่ได้ติดตั้งหรือพร็อกซี Codex Computer Use และ
Codex Computer Use ไม่ได้เรียกผ่านซ็อกเก็ต PeekabooBridge

ใช้ [Peekaboo bridge](/th/platforms/mac/peekaboo) เมื่อคุณต้องการให้ OpenClaw.app เป็น
โฮสต์ที่รับรู้สิทธิ์สำหรับการทำงานอัตโนมัติของ Peekaboo CLI ใช้หน้านี้เมื่อ
เอเจนต์ OpenClaw ในโหมด Codex ควรมี MCP Plugin `computer-use` แบบเนทีฟของ Codex
พร้อมใช้งานก่อนเริ่มเทิร์น

## แอป iOS

แอป iOS แยกจาก Codex Computer Use แอปนี้ไม่ได้ติดตั้งหรือพร็อกซี
Codex MCP server `computer-use` และไม่ใช่แบ็กเอนด์ควบคุมเดสก์ท็อป
แต่แอป iOS จะเชื่อมต่อเป็นโหนด OpenClaw และเปิดเผยความสามารถของมือถือ
ผ่านคำสั่งโหนด เช่น `canvas.*`, `camera.*`, `screen.*`,
`location.*`, และ `talk.*`

ใช้ [iOS](/th/platforms/ios) เมื่อคุณต้องการให้เอเจนต์ควบคุมโหนด iPhone ผ่าน
gateway ใช้หน้านี้เมื่อเอเจนต์ในโหมด Codex ควรควบคุมเดสก์ท็อป macOS
ภายในเครื่องผ่าน Computer Use Plugin แบบเนทีฟของ Codex

## MCP cua-driver โดยตรง

Codex Computer Use ไม่ใช่วิธีเดียวในการเปิดเผยการควบคุมเดสก์ท็อป หากคุณต้องการให้
runtime ที่ OpenClaw จัดการเรียกไดรเวอร์ของ TryCua โดยตรง ให้ใช้
MCP server `cua-driver mcp` ต้นทางผ่านรีจิสทรี MCP ของ OpenClaw แทน
โฟลว์ marketplace เฉพาะของ Codex

หลังติดตั้ง `cua-driver` แล้ว ให้ขอคำสั่ง OpenClaw จากมัน:

```bash
cua-driver mcp-config --client openclaw
```

หรือลงทะเบียน stdio server ด้วยตนเอง:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

เส้นทางนั้นจะคงพื้นผิวเครื่องมือ MCP ต้นทางไว้ครบถ้วน รวมถึงสคีมาของไดรเวอร์
และการตอบกลับ MCP แบบมีโครงสร้าง ใช้เมื่อคุณต้องการให้ไดรเวอร์ CUA
พร้อมใช้งานเป็น MCP server ปกติของ OpenClaw ใช้การตั้งค่า Codex Computer Use
ในหน้านี้เมื่อ Codex app-server ควรเป็นเจ้าของการติดตั้ง Plugin, การโหลด MCP ใหม่,
และการเรียกใช้เครื่องมือเนทีฟภายในเทิร์นโหมด Codex

ไดรเวอร์ของ CUA เฉพาะกับ macOS และยังต้องใช้สิทธิ์ macOS ภายในเครื่อง
ที่แอปขอ เช่น Accessibility และ Screen Recording OpenClaw
ไม่ได้ติดตั้ง `cua-driver`, ให้สิทธิ์เหล่านั้น, หรือข้ามโมเดลความปลอดภัยของไดรเวอร์ต้นทาง

## การตั้งค่าอย่างรวดเร็ว

ตั้งค่า `plugins.entries.codex.config.computerUse` เมื่อเทิร์นโหมด Codex ต้องมี
Computer Use พร้อมใช้งานก่อน thread จะเริ่ม `autoInstall: true` เลือกใช้
Computer Use และให้ OpenClaw ติดตั้งหรือเปิดใช้อีกครั้งก่อนเทิร์น:

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

ด้วยคอนฟิกนี้ OpenClaw จะตรวจสอบ Codex app-server ก่อนทุกเทิร์นโหมด Codex
หาก Computer Use หายไปแต่ Codex app-server ค้นพบ marketplace ที่ติดตั้งได้แล้ว
OpenClaw จะขอให้ Codex app-server ติดตั้งหรือเปิดใช้ Plugin อีกครั้งและโหลด
MCP servers ใหม่ บน macOS เมื่อไม่มี marketplace ที่ตรงกันลงทะเบียนไว้
และมีชุดแอป Codex มาตรฐานอยู่ OpenClaw จะพยายามลงทะเบียน marketplace ของ Codex
ที่มาพร้อมชุดแอปจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ก่อนที่จะ
ล้มเหลว หากการตั้งค่ายังทำให้ MCP server พร้อมใช้งานไม่ได้ เทิร์นจะล้มเหลว
ก่อน thread จะเริ่ม

หลังเปลี่ยนคอนฟิก Computer Use ให้ใช้ `/new` หรือ `/reset` ในแชตที่ได้รับผลกระทบ
ก่อนทดสอบ หาก thread ของ Codex ที่มีอยู่เริ่มไปแล้ว

บน macOS ที่เริ่มต้น stdio แบบจัดการโดยระบบ OpenClaw จะเลือกใช้ชุดแอป Codex
เดสก์ท็อปที่ลงนามแล้วที่ `/Applications/Codex.app/Contents/Resources/codex` เมื่อมีอยู่
ซึ่งทำให้ Computer Use อยู่ใต้ชุดแอปที่เป็นเจ้าของสิทธิ์ควบคุมเดสก์ท็อปภายในเครื่อง
หากไม่ได้ติดตั้งแอปเดสก์ท็อป OpenClaw จะย้อนกลับไปใช้ไบนารี Codex แบบจัดการ
ที่ติดตั้งอยู่ข้าง Plugin หากแอปเดสก์ท็อปที่ติดตั้งไว้เริ่มทำงานด้วยเวอร์ชัน
app-server ที่ไม่รองรับ OpenClaw จะปิด child นั้นและลองตัวเลือกไบนารีแบบจัดการถัดไป
แทนที่จะปล่อยให้แอปเดสก์ท็อปที่ล้าสมัยมาบัง fallback ภายใน Plugin
คอนฟิก `appServer.command` ที่ระบุชัดเจนหรือ `OPENCLAW_CODEX_APP_SERVER_BIN`
ยังคง override การเลือกแบบจัดการนี้

## คำสั่ง

ใช้คำสั่ง `/codex computer-use` จากพื้นผิวแชตใดก็ได้ที่มีพื้นผิวคำสั่งของ Plugin `codex`
พร้อมใช้งาน คำสั่งเหล่านี้คือคำสั่งแชต/runtime ของ OpenClaw
ไม่ใช่คำสั่งย่อย CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` เป็นแบบอ่านอย่างเดียว ไม่เพิ่มแหล่ง marketplace, ไม่ติดตั้ง Plugin, หรือ
เปิดใช้การรองรับ Codex Plugin หากไม่มีคอนฟิกใดเลือกใช้ Computer Use `status`
อาจรายงานว่า disabled แม้หลังจากคำสั่งติดตั้งครั้งเดียวแล้ว

`install` เปิดใช้การรองรับ Plugin ของ Codex app-server, เพิ่มแหล่ง marketplace ที่กำหนดค่าไว้ถ้ามี,
ติดตั้งหรือเปิดใช้ Plugin ที่กำหนดค่าไว้อีกครั้งผ่าน Codex app-server, โหลด
MCP servers ใหม่, และตรวจสอบว่า MCP server เปิดเผยเครื่องมือ

## ตัวเลือก marketplace

OpenClaw ใช้ app-server API เดียวกับที่ Codex เปิดเผยเอง ฟิลด์
marketplace จะเลือกตำแหน่งที่ Codex ควรค้นหา `computer-use`

| ฟิลด์                | ใช้เมื่อ                                                        | การรองรับการติดตั้ง                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| ไม่มีฟิลด์ marketplace | คุณต้องการให้ Codex app-server ใช้ marketplace ที่รู้จักอยู่แล้ว | ใช่ เมื่อ app-server ส่งคืน marketplace ภายในเครื่อง        |
| `marketplaceSource`  | คุณมีแหล่ง marketplace ของ Codex ที่ app-server เพิ่มได้         | ใช่ สำหรับ `/codex computer-use install` ที่ระบุชัดเจน         |
| `marketplacePath`    | คุณรู้เส้นทางไฟล์ marketplace ภายในเครื่องบนโฮสต์อยู่แล้ว   | ใช่ สำหรับการติดตั้งแบบชัดเจนและ auto-install ตอนเริ่มเทิร์น   |
| `marketplaceName`    | คุณต้องการเลือก marketplace ที่ลงทะเบียนไว้แล้วหนึ่งรายการตามชื่อ  | ใช่ เฉพาะเมื่อ marketplace ที่เลือกมีเส้นทางภายในเครื่อง |

Codex home ใหม่อาจต้องใช้เวลาสั้น ๆ เพื่อ seed marketplace ทางการของตน
ระหว่างติดตั้ง OpenClaw จะ poll `plugin/list` เป็นเวลาสูงสุด
`marketplaceDiscoveryTimeoutMs` มิลลิวินาที ค่าเริ่มต้นคือ 60 วินาที

หาก marketplace ที่รู้จักหลายรายการมี Computer Use OpenClaw จะเลือก
`openai-bundled` ก่อน จากนั้น `openai-curated` แล้วจึง `local` การจับคู่ที่ไม่รู้จักและกำกวม
จะ fail closed และขอให้คุณตั้งค่า `marketplaceName` หรือ `marketplacePath`

## marketplace macOS ที่มาพร้อมระบบ

บิลด์เดสก์ท็อป Codex รุ่นใหม่รวม Computer Use ไว้ที่นี่:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

เมื่อ `computerUse.autoInstall` เป็น true และไม่มี marketplace ที่มี
`computer-use` ลงทะเบียนไว้ OpenClaw จะพยายามเพิ่มราก marketplace ที่มาพร้อมระบบมาตรฐาน
โดยอัตโนมัติ:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

คุณสามารถลงทะเบียนอย่างชัดเจนจาก shell ด้วย Codex ได้เช่นกัน:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

หากคุณใช้เส้นทางแอป Codex ที่ไม่มาตรฐาน ให้รัน `/codex computer-use install
--source <marketplace-root>` หนึ่งครั้ง หรือตั้งค่า `computerUse.marketplacePath` เป็น
เส้นทางไฟล์ marketplace ภายในเครื่อง ใช้ `--marketplace-path` เฉพาะเมื่อคุณมี
เส้นทางไฟล์ JSON ของ marketplace ไม่ใช่ราก marketplace ที่มาพร้อมระบบ

## ขีดจำกัดแค็ตตาล็อกระยะไกล

Codex app-server สามารถแสดงรายการและอ่านรายการแค็ตตาล็อกแบบระยะไกลเท่านั้นได้ แต่ปัจจุบัน
ยังไม่รองรับ `plugin/install` ระยะไกล นั่นหมายความว่า `marketplaceName` สามารถ
เลือก marketplace แบบระยะไกลเท่านั้นสำหรับการตรวจสอบสถานะได้ แต่การติดตั้งและการเปิดใช้อีกครั้ง
ยังต้องใช้ marketplace ภายในเครื่องผ่าน `marketplaceSource` หรือ `marketplacePath`

หากสถานะแจ้งว่า Plugin พร้อมใช้งานใน marketplace ระยะไกลของ Codex แต่ไม่รองรับ
การติดตั้งระยะไกล ให้รัน install ด้วยแหล่งหรือเส้นทางภายในเครื่อง:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## อ้างอิงการกำหนดค่า

| ฟิลด์                           | ค่าเริ่มต้น        | ความหมาย                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | บังคับใช้ Computer Use ค่าเริ่มต้นเป็น true เมื่อมีการตั้งค่าฟิลด์ Computer Use อื่น |
| `autoInstall`                   | false          | ติดตั้งหรือเปิดใช้อีกครั้งจาก marketplace ที่ค้นพบแล้วตอนเริ่มเทิร์น       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | ระยะเวลาที่ install รอให้ Codex app-server ค้นพบ marketplace             |
| `marketplaceSource`             | unset          | สตริงแหล่งที่ส่งให้ Codex app-server `marketplace/add`                    |
| `marketplacePath`               | unset          | เส้นทางไฟล์ marketplace ภายในเครื่องของ Codex ที่มี Plugin                       |
| `marketplaceName`               | unset          | ชื่อ marketplace ของ Codex ที่ลงทะเบียนไว้เพื่อเลือก                                   |
| `pluginName`                    | `computer-use` | ชื่อ Plugin ใน marketplace ของ Codex                                                 |
| `mcpServerName`                 | `computer-use` | ชื่อ MCP server ที่ Plugin ที่ติดตั้งเปิดเผย                               |

auto-install ตอนเริ่มเทิร์นจงใจปฏิเสธค่า `marketplaceSource` ที่กำหนดไว้
การเพิ่มแหล่งใหม่เป็นการตั้งค่าแบบชัดเจน ดังนั้นให้ใช้
`/codex computer-use install --source <marketplace-source>` หนึ่งครั้ง แล้วให้
`autoInstall` จัดการการเปิดใช้อีกครั้งในอนาคตจาก marketplace ภายในเครื่องที่ค้นพบแล้ว
auto-install ตอนเริ่มเทิร์นสามารถใช้ `marketplacePath` ที่กำหนดไว้ได้ เพราะนั่นคือ
เส้นทางภายในเครื่องบนโฮสต์อยู่แล้ว

## สิ่งที่ OpenClaw ตรวจสอบ

OpenClaw รายงานเหตุผลการตั้งค่าที่เสถียรภายในและจัดรูปแบบสถานะที่ผู้ใช้เห็น
สำหรับแชต:

| เหตุผล                       | ความหมาย                                                | ขั้นตอนถัดไป                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` ถูกแปลงผลเป็น false.               | ตั้งค่า `enabled` หรือฟิลด์ Computer Use อื่น  |
| `marketplace_missing`        | ไม่มีมาร์เก็ตเพลสที่ตรงกันพร้อมใช้งาน                 | กำหนดค่าแหล่งที่มา พาธ หรือชื่อมาร์เก็ตเพลส  |
| `plugin_not_installed`       | มีมาร์เก็ตเพลสอยู่ แต่ยังไม่ได้ติดตั้ง Plugin   | รันการติดตั้งหรือเปิดใช้ `autoInstall`          |
| `plugin_disabled`            | ติดตั้ง Plugin แล้ว แต่ถูกปิดใช้งานในคอนฟิก Codex      | รันการติดตั้งเพื่อเปิดใช้งานอีกครั้ง                  |
| `remote_install_unsupported` | มาร์เก็ตเพลสที่เลือกเป็นแบบรีโมตเท่านั้น                   | ใช้ `marketplaceSource` หรือ `marketplacePath` |
| `mcp_missing`                | เปิดใช้ Plugin แล้ว แต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน  | ตรวจสอบ Codex Computer Use และสิทธิ์ของ OS  |
| `ready`                      | Plugin และเครื่องมือ MCP พร้อมใช้งาน                    | เริ่มเทิร์นโหมด Codex                    |
| `check_failed`               | คำขอไปยังเซิร์ฟเวอร์แอป Codex ล้มเหลวระหว่างตรวจสอบสถานะ | ตรวจสอบการเชื่อมต่อและล็อกของเซิร์ฟเวอร์แอป       |
| `auto_install_blocked`       | การตั้งค่าเมื่อเริ่มเทิร์นจำเป็นต้องเพิ่มแหล่งที่มาใหม่       | รันการติดตั้งแบบชัดเจนก่อน                   |

เอาต์พุตแชตจะแสดงสถานะ Plugin, สถานะเซิร์ฟเวอร์ MCP, มาร์เก็ตเพลส, เครื่องมือ
เมื่อพร้อมใช้งาน และข้อความเฉพาะสำหรับขั้นตอนการตั้งค่าที่ล้มเหลว

## สิทธิ์บน macOS

Computer Use มีเฉพาะบน macOS เซิร์ฟเวอร์ MCP ที่ Codex เป็นเจ้าของอาจต้องมี
สิทธิ์ OS ในเครื่องก่อนจึงจะตรวจสอบหรือควบคุมแอปได้ หาก OpenClaw แจ้งว่าติดตั้ง
Computer Use แล้ว แต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน ให้ตรวจสอบการตั้งค่า
Computer Use ฝั่ง Codex ก่อน:

- เซิร์ฟเวอร์แอป Codex กำลังทำงานบนโฮสต์เดียวกับที่ควรเกิดการควบคุมเดสก์ท็อป
- เปิดใช้ Plugin Computer Use ในคอนฟิก Codex แล้ว
- เซิร์ฟเวอร์ MCP `computer-use` ปรากฏในสถานะ MCP ของเซิร์ฟเวอร์แอป Codex
- macOS ได้ให้สิทธิ์ที่จำเป็นสำหรับแอปควบคุมเดสก์ท็อปแล้ว
- เซสชันโฮสต์ปัจจุบันสามารถเข้าถึงเดสก์ท็อปที่กำลังถูกควบคุมได้

OpenClaw ตั้งใจให้ล้มเหลวแบบปิดเมื่อ `computerUse.enabled` เป็น true เทิร์นโหมด
Codex ไม่ควรดำเนินต่อโดยเงียบ ๆ หากไม่มีเครื่องมือเดสก์ท็อปแบบเนทีฟที่คอนฟิกกำหนดไว้

## การแก้ไขปัญหา

**สถานะระบุว่ายังไม่ได้ติดตั้ง** รัน `/codex computer-use install` หากค้นพบ
มาร์เก็ตเพลสไม่ได้ ให้ส่ง `--source` หรือ `--marketplace-path`

**สถานะระบุว่าติดตั้งแล้วแต่ถูกปิดใช้งาน** รัน `/codex computer-use install` อีกครั้ง
การติดตั้งผ่านเซิร์ฟเวอร์แอป Codex จะเขียนคอนฟิก Plugin กลับไปเป็นเปิดใช้งาน

**สถานะระบุว่าไม่รองรับการติดตั้งแบบรีโมต** ใช้แหล่งที่มาหรือพาธมาร์เก็ตเพลสในเครื่อง
รายการแคตตาล็อกแบบรีโมตเท่านั้นสามารถตรวจสอบได้ แต่ไม่สามารถติดตั้งผ่าน API
เซิร์ฟเวอร์แอปปัจจุบันได้

**สถานะระบุว่าเซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน** รันการติดตั้งอีกครั้งหนึ่งเพื่อให้เซิร์ฟเวอร์
MCP โหลดใหม่ หากยังไม่พร้อมใช้งาน ให้แก้แอป Codex Computer Use, สถานะ MCP
ของเซิร์ฟเวอร์แอป Codex หรือสิทธิ์บน macOS

**สถานะหรือโพรบหมดเวลาบน `computer-use.list_apps`** Plugin และเซิร์ฟเวอร์ MCP
มีอยู่แล้ว แต่บริดจ์ Computer Use ในเครื่องไม่ตอบสนอง ออกจากหรือรีสตาร์ท
Codex Computer Use, เปิด Codex Desktop ใหม่หากจำเป็น แล้วลองอีกครั้งในเซสชัน
OpenClaw ใหม่ หากโฮสต์เคยรัน Computer Use ผ่านเซิร์ฟเวอร์แอป Codex แบบมีการจัดการ
รุ่นเก่า ให้รีเฟรช Plugin ที่ติดตั้งจากมาร์เก็ตเพลสที่บันเดิลมากับเดสก์ท็อป:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**เครื่องมือ Computer Use แจ้งว่า `Native hook relay unavailable`** ฮุกเครื่องมือ
แบบเนทีฟของ Codex ติดต่อรีเลย์ OpenClaw ที่ทำงานอยู่ผ่านบริดจ์ในเครื่องหรือ
Gateway fallback ไม่ได้ เริ่มเซสชัน OpenClaw ใหม่ด้วย `/new` หรือ `/reset` หากใช้ได้
หนึ่งครั้งแล้วล้มเหลวอีกในการเรียกเครื่องมือครั้งถัดไป แสดงว่า `/new` กำลังล้างเฉพาะ
ความพยายามปัจจุบันเท่านั้น ให้รีสตาร์ทเซิร์ฟเวอร์แอป Codex หรือ OpenClaw Gateway
เพื่อให้เธรดเก่าและการลงทะเบียนฮุกถูกทิ้ง จากนั้นลองอีกครั้งในเซสชันใหม่

**การติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นปฏิเสธแหล่งที่มา** นี่เป็นพฤติกรรมที่ตั้งใจไว้ ให้เพิ่ม
แหล่งที่มาด้วย `/codex computer-use install --source <marketplace-source>` แบบชัดเจน
ก่อน จากนั้นการติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นในอนาคตจึงจะใช้มาร์เก็ตเพลสในเครื่อง
ที่ค้นพบได้

## ที่เกี่ยวข้อง

- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo)
- [แอป iOS](/th/platforms/ios)
