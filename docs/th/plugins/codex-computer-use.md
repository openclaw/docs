---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ Codex Computer Use
    - คุณกำลังตัดสินใจระหว่าง Codex Computer Use, PeekabooBridge และการใช้ cua-driver MCP โดยตรง
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use กับการตั้งค่า cua-driver MCP โดยตรง
    - คุณกำลังกำหนดค่า computerUse สำหรับ Codex Plugin ที่รวมมาให้
    - คุณกำลังแก้ไขปัญหาสถานะหรือการติดตั้งการใช้งานคอมพิวเตอร์ของ /codex
summary: ตั้งค่า Codex Computer Use สำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: การใช้คอมพิวเตอร์ของ Codex
x-i18n:
    generated_at: "2026-05-10T19:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use เป็น Plugin MCP แบบเนทีฟสำหรับ Codex เพื่อควบคุมเดสก์ท็อปภายในเครื่อง OpenClaw
ไม่ได้รวมแอปเดสก์ท็อปไว้ในแพ็กเกจ ไม่ได้ดำเนินการเดสก์ท็อปเอง หรือข้าม
สิทธิ์ของ Codex Plugin `codex` ที่มาพร้อมกันมีหน้าที่เตรียม Codex app-server เท่านั้น:
โดยเปิดใช้งานการรองรับ Plugin ของ Codex, ค้นหาหรือติดตั้ง Plugin Codex
Computer Use ที่กำหนดค่าไว้, ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use` พร้อมใช้งาน และ
จากนั้นให้ Codex เป็นเจ้าของการเรียกเครื่องมือ MCP แบบเนทีฟระหว่างเทิร์นในโหมด Codex

ใช้หน้านี้เมื่อ OpenClaw ใช้ harness แบบเนทีฟของ Codex อยู่แล้ว สำหรับการตั้งค่า
runtime เอง โปรดดู [Codex harness](/th/plugins/codex-harness)

## OpenClaw.app และ Peekaboo

การผสานรวม Peekaboo ของ OpenClaw.app แยกจาก Codex Computer Use แอป
macOS สามารถโฮสต์ซ็อกเก็ต PeekabooBridge เพื่อให้ CLI `peekaboo` ใช้สิทธิ์
Accessibility และ Screen Recording ภายในเครื่องของแอปซ้ำสำหรับเครื่องมือ
อัตโนมัติของ Peekaboo เองได้ บริดจ์นั้นไม่ได้ติดตั้งหรือพร็อกซี Codex Computer Use และ
Codex Computer Use ไม่ได้เรียกผ่านซ็อกเก็ต PeekabooBridge

ใช้ [Peekaboo bridge](/th/platforms/mac/peekaboo) เมื่อคุณต้องการให้ OpenClaw.app เป็น
โฮสต์ที่รับรู้สิทธิ์สำหรับระบบอัตโนมัติของ Peekaboo CLI ใช้หน้านี้เมื่อ agent ของ OpenClaw
ในโหมด Codex ควรมี Plugin MCP `computer-use` แบบเนทีฟของ Codex
พร้อมใช้งานก่อนเริ่มเทิร์น

## แอป iOS

แอป iOS แยกจาก Codex Computer Use แอปนี้ไม่ได้ติดตั้งหรือพร็อกซี
เซิร์ฟเวอร์ MCP `computer-use` ของ Codex และไม่ใช่แบ็กเอนด์ควบคุมเดสก์ท็อป
แต่แอป iOS จะเชื่อมต่อเป็นโหนด OpenClaw และเปิดเผยความสามารถของมือถือ
ผ่านคำสั่งโหนด เช่น `canvas.*`, `camera.*`, `screen.*`,
`location.*` และ `talk.*`

ใช้ [iOS](/th/platforms/ios) เมื่อคุณต้องการให้ agent ควบคุมโหนด iPhone ผ่าน
Gateway ใช้หน้านี้เมื่อ agent ในโหมด Codex ควรควบคุมเดสก์ท็อป macOS ภายในเครื่อง
ผ่าน Plugin Computer Use แบบเนทีฟของ Codex

## MCP cua-driver โดยตรง

Codex Computer Use ไม่ใช่วิธีเดียวในการเปิดเผยการควบคุมเดสก์ท็อป หากคุณต้องการให้
runtime ที่ OpenClaw จัดการเรียก driver ของ TryCua โดยตรง ให้ใช้เซิร์ฟเวอร์
`cua-driver mcp` ต้นทางผ่านรีจิสทรี MCP ของ OpenClaw แทนโฟลว์
marketplace เฉพาะ Codex

หลังจากติดตั้ง `cua-driver` แล้ว ให้ขอคำสั่ง OpenClaw จากเครื่องมือนั้น:

```bash
cua-driver mcp-config --client openclaw
```

หรือลงทะเบียนเซิร์ฟเวอร์ stdio ด้วยตัวเอง:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

เส้นทางนั้นคงพื้นผิวเครื่องมือ MCP ต้นทางไว้ครบถ้วน รวมถึงสคีมาของ driver
และคำตอบ MCP แบบมีโครงสร้าง ใช้เมื่อคุณต้องการให้ driver CUA
พร้อมใช้งานเป็นเซิร์ฟเวอร์ MCP ปกติของ OpenClaw ใช้การตั้งค่า Codex Computer Use ใน
หน้านี้เมื่อ Codex app-server ควรเป็นเจ้าของการติดตั้ง Plugin, การโหลด MCP ใหม่,
และการเรียกเครื่องมือแบบเนทีฟภายในเทิร์นในโหมด Codex

driver ของ CUA เฉพาะ macOS และยังต้องใช้สิทธิ์ macOS ภายในเครื่อง
ที่แอปแจ้งขอ เช่น Accessibility และ Screen Recording OpenClaw
ไม่ได้ติดตั้ง `cua-driver`, มอบสิทธิ์เหล่านั้น หรือข้ามโมเดลความปลอดภัยของ
driver ต้นทาง

## การตั้งค่าอย่างรวดเร็ว

ตั้งค่า `plugins.entries.codex.config.computerUse` เมื่อเทิร์นในโหมด Codex ต้องมี
Computer Use พร้อมใช้งานก่อนเริ่มเธรด:

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

ด้วยการกำหนดค่านี้ OpenClaw จะตรวจสอบ Codex app-server ก่อนแต่ละเทิร์นในโหมด Codex
หากไม่มี Computer Use แต่ Codex app-server ได้ค้นพบ marketplace ที่ติดตั้งได้แล้ว
OpenClaw จะขอให้ Codex app-server ติดตั้งหรือเปิดใช้งาน Plugin อีกครั้งและโหลด
เซิร์ฟเวอร์ MCP ใหม่ บน macOS เมื่อไม่มี marketplace ที่ตรงกันลงทะเบียนไว้
และมีบันเดิลแอป Codex มาตรฐานอยู่ OpenClaw จะพยายามลงทะเบียน marketplace ของ Codex
ที่มาพร้อมกันจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ก่อนที่จะ
ล้มเหลวด้วย หากการตั้งค่ายังทำให้เซิร์ฟเวอร์ MCP พร้อมใช้งานไม่ได้ เทิร์นจะล้มเหลว
ก่อนเริ่มเธรด

หลังจากเปลี่ยนการกำหนดค่า Computer Use ให้ใช้ `/new` หรือ `/reset` ในแชตที่ได้รับผลกระทบ
ก่อนทดสอบ หากเธรด Codex ที่มีอยู่เริ่มไปแล้ว

## คำสั่ง

ใช้คำสั่ง `/codex computer-use` จากพื้นผิวแชตใดก็ได้ที่พื้นผิวคำสั่งของ Plugin `codex`
พร้อมใช้งาน คำสั่งเหล่านี้เป็นคำสั่งแชต/runtime ของ OpenClaw
ไม่ใช่คำสั่งย่อย CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` เป็นแบบอ่านอย่างเดียว โดยจะไม่เพิ่มแหล่ง marketplace, ติดตั้ง Plugin หรือ
เปิดใช้งานการรองรับ Plugin ของ Codex

`install` เปิดใช้งานการรองรับ Plugin ของ Codex app-server, เพิ่มแหล่ง marketplace
ที่กำหนดค่าไว้ถ้ามี, ติดตั้งหรือเปิดใช้งาน Plugin ที่กำหนดค่าไว้ผ่าน Codex
app-server อีกครั้ง, โหลดเซิร์ฟเวอร์ MCP ใหม่ และตรวจสอบว่าเซิร์ฟเวอร์ MCP เปิดเผยเครื่องมือ

## ตัวเลือก marketplace

OpenClaw ใช้ API ของ app-server เดียวกับที่ Codex เปิดเผยเอง
ฟิลด์ marketplace เลือกตำแหน่งที่ Codex ควรค้นหา `computer-use`

| ฟิลด์                | ใช้เมื่อ                                                        | การรองรับการติดตั้ง                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| ไม่มีฟิลด์ marketplace | คุณต้องการให้ Codex app-server ใช้ marketplace ที่รู้อยู่แล้ว | ใช่ เมื่อ app-server ส่งคืน marketplace ภายในเครื่อง        |
| `marketplaceSource`  | คุณมีแหล่ง marketplace ของ Codex ที่ app-server เพิ่มได้         | ใช่ สำหรับ `/codex computer-use install` แบบระบุชัดเจน         |
| `marketplacePath`    | คุณรู้อยู่แล้วถึงเส้นทางไฟล์ marketplace ภายในเครื่องบนโฮสต์   | ใช่ สำหรับการติดตั้งแบบระบุชัดเจนและการติดตั้งอัตโนมัติเมื่อเริ่มเทิร์น   |
| `marketplaceName`    | คุณต้องการเลือก marketplace ที่ลงทะเบียนแล้วรายการหนึ่งตามชื่อ  | ใช่ เฉพาะเมื่อ marketplace ที่เลือกมีเส้นทางภายในเครื่อง |

โฮม Codex ใหม่อาจต้องใช้เวลาสั้น ๆ เพื่อ seed marketplace ทางการ
ระหว่างติดตั้ง OpenClaw จะ poll `plugin/list` สูงสุด
`marketplaceDiscoveryTimeoutMs` มิลลิวินาที ค่าเริ่มต้นคือ 60 วินาที

หาก marketplace ที่รู้จักหลายรายการมี Computer Use OpenClaw จะเลือก
`openai-bundled` ก่อน ตามด้วย `openai-curated` แล้วจึง `local` การจับคู่ที่คลุมเครือและไม่รู้จัก
จะล้มเหลวแบบปิดและขอให้คุณตั้งค่า `marketplaceName` หรือ `marketplacePath`

## marketplace ของ macOS ที่มาพร้อมกัน

บิลด์ Codex desktop รุ่นล่าสุดรวม Computer Use ไว้ที่นี่:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

เมื่อ `computerUse.autoInstall` เป็น true และไม่มี marketplace ที่มี
`computer-use` ลงทะเบียนไว้ OpenClaw จะพยายามเพิ่มราก marketplace มาตรฐาน
ที่มาพร้อมกันโดยอัตโนมัติ:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

คุณยังสามารถลงทะเบียนอย่างชัดเจนจาก shell ด้วย Codex ได้:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

หากคุณใช้เส้นทางแอป Codex ที่ไม่ใช่มาตรฐาน ให้ตั้งค่า `computerUse.marketplacePath` เป็น
เส้นทางไฟล์ marketplace ภายในเครื่อง หรือเรียกใช้ `/codex computer-use install --source
<marketplace-source>` หนึ่งครั้ง

## ข้อจำกัดของแค็ตตาล็อกระยะไกล

Codex app-server สามารถแสดงรายการและอ่านรายการแค็ตตาล็อกแบบระยะไกลเท่านั้นได้ แต่ในปัจจุบัน
ยังไม่รองรับ `plugin/install` ระยะไกล ซึ่งหมายความว่า `marketplaceName` สามารถ
เลือก marketplace แบบระยะไกลเท่านั้นสำหรับการตรวจสอบสถานะได้ แต่การติดตั้งและการเปิดใช้งานอีกครั้ง
ยังต้องใช้ marketplace ภายในเครื่องผ่าน `marketplaceSource` หรือ `marketplacePath`

หากสถานะบอกว่า Plugin พร้อมใช้งานใน marketplace ระยะไกลของ Codex แต่ไม่รองรับ
การติดตั้งระยะไกล ให้เรียกใช้การติดตั้งด้วยแหล่งหรือเส้นทางภายในเครื่อง:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## อ้างอิงการกำหนดค่า

| ฟิลด์                           | ค่าเริ่มต้น        | ความหมาย                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | อนุมาน       | กำหนดให้ต้องใช้ Computer Use ค่าเริ่มต้นเป็น true เมื่อมีการตั้งค่าฟิลด์ Computer Use อื่น |
| `autoInstall`                   | false          | ติดตั้งหรือเปิดใช้งานอีกครั้งจาก marketplace ที่ค้นพบแล้วเมื่อเริ่มเทิร์น       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | ระยะเวลาที่การติดตั้งรอให้ Codex app-server ค้นพบ marketplace             |
| `marketplaceSource`             | ไม่ได้ตั้งค่า          | สตริงแหล่งที่ส่งไปยัง `marketplace/add` ของ Codex app-server                    |
| `marketplacePath`               | ไม่ได้ตั้งค่า          | เส้นทางไฟล์ marketplace ภายในเครื่องของ Codex ที่มี Plugin                       |
| `marketplaceName`               | ไม่ได้ตั้งค่า          | ชื่อ marketplace ของ Codex ที่ลงทะเบียนไว้เพื่อเลือก                                   |
| `pluginName`                    | `computer-use` | ชื่อ Plugin ใน marketplace ของ Codex                                                 |
| `mcpServerName`                 | `computer-use` | ชื่อเซิร์ฟเวอร์ MCP ที่ Plugin ที่ติดตั้งเปิดเผย                               |

การติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นตั้งใจปฏิเสธค่า `marketplaceSource` ที่กำหนดค่าไว้
การเพิ่มแหล่งใหม่เป็นการดำเนินการตั้งค่าแบบชัดเจน ดังนั้นให้ใช้
`/codex computer-use install --source <marketplace-source>` หนึ่งครั้ง แล้วปล่อยให้
`autoInstall` จัดการการเปิดใช้งานอีกครั้งในอนาคตจาก marketplace ภายในเครื่องที่ค้นพบ
การติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นสามารถใช้ `marketplacePath` ที่กำหนดค่าไว้ได้ เพราะนั่นเป็น
เส้นทางภายในเครื่องบนโฮสต์อยู่แล้ว

## สิ่งที่ OpenClaw ตรวจสอบ

OpenClaw รายงานเหตุผลการตั้งค่าที่เสถียรภายในและจัดรูปแบบสถานะที่ผู้ใช้เห็น
สำหรับแชต:

| เหตุผล                       | ความหมาย                                                | ขั้นตอนถัดไป                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` resolve เป็น false               | ตั้งค่า `enabled` หรือฟิลด์ Computer Use อื่น  |
| `marketplace_missing`        | ไม่มี marketplace ที่ตรงกันพร้อมใช้งาน                 | กำหนดค่าแหล่ง, เส้นทาง หรือชื่อ marketplace  |
| `plugin_not_installed`       | มี marketplace แต่ยังไม่ได้ติดตั้ง Plugin   | เรียกใช้การติดตั้งหรือเปิดใช้ `autoInstall`          |
| `plugin_disabled`            | ติดตั้ง Plugin แล้วแต่ถูกปิดใช้งานในการกำหนดค่า Codex      | เรียกใช้การติดตั้งเพื่อเปิดใช้งานอีกครั้ง                  |
| `remote_install_unsupported` | marketplace ที่เลือกเป็นแบบระยะไกลเท่านั้น                   | ใช้ `marketplaceSource` หรือ `marketplacePath` |
| `mcp_missing`                | เปิดใช้งาน Plugin แล้ว แต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน  | ตรวจสอบ Codex Computer Use และสิทธิ์ของ OS  |
| `ready`                      | Plugin และเครื่องมือ MCP พร้อมใช้งาน                    | เริ่มเทิร์นในโหมด Codex                    |
| `check_failed`               | คำขอ Codex app-server ล้มเหลวระหว่างตรวจสอบสถานะ | ตรวจสอบการเชื่อมต่อ app-server และบันทึก       |
| `auto_install_blocked`       | การตั้งค่าเมื่อเริ่มเทิร์นจำเป็นต้องเพิ่มแหล่งใหม่       | เรียกใช้การติดตั้งแบบระบุชัดเจนก่อน                   |

เอาต์พุตแชตรวมสถานะ Plugin, สถานะเซิร์ฟเวอร์ MCP, marketplace, เครื่องมือ
เมื่อพร้อมใช้งาน และข้อความเฉพาะสำหรับขั้นตอนการตั้งค่าที่ล้มเหลว

## สิทธิ์ macOS

Computer Use เฉพาะ macOS เซิร์ฟเวอร์ MCP ที่ Codex เป็นเจ้าของอาจต้องใช้สิทธิ์ OS
ภายในเครื่องก่อนที่จะตรวจสอบหรือควบคุมแอปได้ หาก OpenClaw บอกว่า Computer Use
ติดตั้งแล้วแต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน ให้ตรวจสอบการตั้งค่า Computer Use
ฝั่ง Codex ก่อน:

- Codex app-server กำลังทำงานบนโฮสต์เดียวกับที่ควรเกิดการควบคุมเดสก์ท็อป
- Plugin Computer Use เปิดใช้งานอยู่ในการกำหนดค่า Codex
- เซิร์ฟเวอร์ MCP `computer-use` ปรากฏในสถานะ MCP ของ Codex app-server
- macOS ได้ให้สิทธิ์ที่จำเป็นสำหรับแอปควบคุมเดสก์ท็อปแล้ว
- เซสชันโฮสต์ปัจจุบันสามารถเข้าถึงเดสก์ท็อปที่กำลังถูกควบคุมได้

OpenClaw ตั้งใจให้ปิดกั้นโดยค่าเริ่มต้นเมื่อ `computerUse.enabled` เป็น true รอบการทำงานในโหมด Codex ไม่ควรดำเนินต่อไปแบบเงียบ ๆ โดยไม่มีเครื่องมือเดสก์ท็อปแบบเนทีฟที่การกำหนดค่ากำหนดไว้

## การแก้ไขปัญหา

**สถานะบอกว่ายังไม่ได้ติดตั้ง** เรียกใช้ `/codex computer-use install` หากไม่พบ marketplace ให้ส่ง `--source` หรือ `--marketplace-path`

**สถานะบอกว่าติดตั้งแล้วแต่ปิดใช้งานอยู่** เรียกใช้ `/codex computer-use install` อีกครั้ง การติดตั้ง Codex app-server จะเขียนการกำหนดค่า Plugin กลับเป็นเปิดใช้งาน

**สถานะบอกว่าไม่รองรับการติดตั้งระยะไกล** ใช้แหล่งที่มาหรือพาธ marketplace แบบภายในเครื่อง รายการแค็ตตาล็อกที่มีเฉพาะระยะไกลสามารถตรวจสอบได้ แต่ติดตั้งผ่าน API ของ app-server ปัจจุบันไม่ได้

**สถานะบอกว่าเซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน** เรียกใช้การติดตั้งซ้ำหนึ่งครั้งเพื่อให้เซิร์ฟเวอร์ MCP โหลดใหม่ หากยังไม่พร้อมใช้งาน ให้แก้ไขแอป Codex Computer Use, สถานะ MCP ของ Codex app-server หรือสิทธิ์ของ macOS

**สถานะหรือ probe หมดเวลาที่ `computer-use.list_apps`** Plugin และเซิร์ฟเวอร์ MCP มีอยู่แล้ว แต่บริดจ์ Computer Use ภายในเครื่องไม่ตอบสนอง ออกจากหรือรีสตาร์ท Codex Computer Use, เปิด Codex Desktop ใหม่หากจำเป็น แล้วลองอีกครั้งในเซสชัน OpenClaw ใหม่

**เครื่องมือ Computer Use แจ้งว่า `Native hook relay unavailable`** hook เครื่องมือแบบเนทีฟของ Codex ไม่สามารถเข้าถึงรีเลย์ OpenClaw ที่ใช้งานอยู่ผ่านบริดจ์ภายในเครื่องหรือ Gateway fallback ได้ เริ่มเซสชัน OpenClaw ใหม่ด้วย `/new` หรือ `/reset` หากยังเกิดขึ้นอีก ให้รีสตาร์ท Gateway เพื่อให้เธรด app-server เก่าและการลงทะเบียน hook ถูกล้างออก แล้วลองใหม่อีกครั้ง

**การติดตั้งอัตโนมัติเมื่อเริ่มรอบการทำงานปฏิเสธแหล่งที่มา** นี่เป็นพฤติกรรมโดยตั้งใจ ให้เพิ่มแหล่งที่มาด้วยคำสั่งที่ชัดเจน `/codex computer-use install --source <marketplace-source>` ก่อน จากนั้นการติดตั้งอัตโนมัติเมื่อเริ่มรอบการทำงานในอนาคตจะใช้ marketplace ภายในเครื่องที่ค้นพบได้

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [Peekaboo bridge](/th/platforms/mac/peekaboo)
- [แอป iOS](/th/platforms/ios)
