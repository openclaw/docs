---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ Codex Computer Use
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use, PeekabooBridge และ MCP cua-driver โดยตรง
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use กับการตั้งค่า cua-driver MCP โดยตรง
    - คุณกำลังกำหนดค่า computerUse สำหรับ Plugin Codex ที่รวมมาด้วย
    - คุณกำลังแก้ไขปัญหาสถานะหรือการติดตั้ง /codex computer-use
summary: ตั้งค่า Codex Computer Use สำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: การใช้คอมพิวเตอร์ของ Codex
x-i18n:
    generated_at: "2026-05-03T10:14:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use เป็น Plugin MCP แบบเนทีฟของ Codex สำหรับควบคุมเดสก์ท็อปภายในเครื่อง OpenClaw
ไม่ได้รวมแอปเดสก์ท็อปไว้ในแพ็กเกจ ไม่ได้ดำเนินการกับเดสก์ท็อปเอง หรือข้าม
สิทธิ์ของ Codex Plugin `codex` ที่ให้มาด้วยจะเตรียม Codex app-server เท่านั้น:
โดยเปิดใช้การรองรับ Plugin ของ Codex, ค้นหาหรือติดตั้ง Plugin Codex
Computer Use ที่กำหนดค่าไว้, ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use` พร้อมใช้งาน และ
จากนั้นให้ Codex เป็นเจ้าของการเรียกเครื่องมือ MCP เนทีฟระหว่างเทิร์นโหมด Codex

ใช้หน้านี้เมื่อ OpenClaw ใช้ harness เนทีฟของ Codex อยู่แล้ว สำหรับการตั้งค่า
runtime เอง ให้ดู [Codex harness](/th/plugins/codex-harness)

## OpenClaw.app และ Peekaboo

การผสานรวม Peekaboo ของ OpenClaw.app แยกจาก Codex Computer Use แอป
macOS สามารถโฮสต์ซ็อกเก็ต PeekabooBridge เพื่อให้ CLI `peekaboo` ใช้ grant
Accessibility และ Screen Recording ภายในเครื่องของแอปซ้ำสำหรับเครื่องมือ
automation ของ Peekaboo เองได้ bridge ดังกล่าวไม่ได้ติดตั้งหรือพร็อกซี Codex Computer Use และ
Codex Computer Use ไม่ได้เรียกผ่านซ็อกเก็ต PeekabooBridge

ใช้ [Peekaboo bridge](/th/platforms/mac/peekaboo) เมื่อคุณต้องการให้ OpenClaw.app เป็น
โฮสต์ที่ตระหนักถึงสิทธิ์สำหรับ automation ของ Peekaboo CLI ใช้หน้านี้เมื่อ
agent ของ OpenClaw ในโหมด Codex ควรมี Plugin MCP `computer-use` เนทีฟของ Codex
พร้อมใช้งานก่อนเทิร์นเริ่มต้น

## แอป iOS

แอป iOS แยกจาก Codex Computer Use แอปนี้ไม่ได้ติดตั้งหรือพร็อกซี
เซิร์ฟเวอร์ MCP `computer-use` ของ Codex และไม่ใช่แบ็กเอนด์สำหรับควบคุมเดสก์ท็อป
แต่แอป iOS จะเชื่อมต่อเป็นโหนด OpenClaw และเปิดเผยความสามารถของอุปกรณ์เคลื่อนที่
ผ่านคำสั่งโหนด เช่น `canvas.*`, `camera.*`, `screen.*`,
`location.*`, และ `talk.*`

ใช้ [iOS](/th/platforms/ios) เมื่อคุณต้องการให้ agent ควบคุมโหนด iPhone ผ่าน
gateway ใช้หน้านี้เมื่อ agent โหมด Codex ควรควบคุมเดสก์ท็อป macOS ภายในเครื่อง
ผ่าน Plugin Computer Use เนทีฟของ Codex

## MCP cua-driver โดยตรง

Codex Computer Use ไม่ใช่วิธีเดียวในการเปิดเผยการควบคุมเดสก์ท็อป หากคุณต้องการให้
runtime ที่ OpenClaw จัดการเรียก driver ของ TryCua โดยตรง ให้ใช้เซิร์ฟเวอร์
`cua-driver mcp` ต้นทางผ่าน registry MCP ของ OpenClaw แทน flow ของ marketplace
เฉพาะ Codex

หลังจากติดตั้ง `cua-driver` แล้ว ให้ขอคำสั่ง OpenClaw จากมัน:

```bash
cua-driver mcp-config --client openclaw
```

หรือลงทะเบียนเซิร์ฟเวอร์ stdio ด้วยตัวเอง:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

เส้นทางนี้รักษาพื้นผิวเครื่องมือ MCP ต้นทางไว้ครบถ้วน รวมถึง schema ของ driver
และการตอบกลับ MCP แบบมีโครงสร้าง ใช้เมื่อคุณต้องการให้ driver CUA
พร้อมใช้งานเป็นเซิร์ฟเวอร์ MCP ปกติของ OpenClaw ใช้การตั้งค่า Codex Computer Use ใน
หน้านี้เมื่อ Codex app-server ควรเป็นเจ้าของการติดตั้ง Plugin, การโหลด MCP ใหม่,
และการเรียกเครื่องมือเนทีฟภายในเทิร์นโหมด Codex

driver ของ CUA เฉพาะ macOS และยังคงต้องมีสิทธิ์ macOS ภายในเครื่อง
ที่แอปแจ้งขอ เช่น Accessibility และ Screen Recording OpenClaw
ไม่ได้ติดตั้ง `cua-driver`, มอบสิทธิ์เหล่านั้น, หรือข้ามโมเดลความปลอดภัยของ
driver ต้นทาง

## การตั้งค่าแบบเร็ว

ตั้งค่า `plugins.entries.codex.config.computerUse` เมื่อเทิร์นโหมด Codex ต้องมี
Computer Use พร้อมใช้งานก่อน thread เริ่มต้น:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

ด้วยการกำหนดค่านี้ OpenClaw จะตรวจสอบ Codex app-server ก่อนเทิร์นโหมด Codex แต่ละเทิร์น
หาก Computer Use หายไปแต่ Codex app-server ค้นพบ marketplace ที่ติดตั้งได้แล้ว
OpenClaw จะขอให้ Codex app-server ติดตั้งหรือเปิดใช้ Plugin อีกครั้งและโหลด
เซิร์ฟเวอร์ MCP ใหม่ บน macOS เมื่อไม่มี marketplace ที่ตรงกันลงทะเบียนไว้
และ bundle แอป Codex มาตรฐานมีอยู่ OpenClaw จะพยายามลงทะเบียน marketplace
Codex ที่ให้มาด้วยจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ก่อนที่จะล้มเหลว
หากการตั้งค่ายังไม่สามารถทำให้เซิร์ฟเวอร์ MCP พร้อมใช้งานได้ เทิร์นจะล้มเหลว
ก่อน thread เริ่มต้น

session ที่มีอยู่จะคง runtime และการผูก thread ของ Codex ไว้ หลังจากเปลี่ยน
`agentRuntime` หรือการกำหนดค่า Computer Use ให้ใช้ `/new` หรือ `/reset` ในแชต
ที่ได้รับผลกระทบก่อนทดสอบ

## คำสั่ง

ใช้คำสั่ง `/codex computer-use` จากพื้นผิวแชตใดก็ได้ที่มีพื้นผิวคำสั่งของ Plugin
`codex` พร้อมใช้งาน คำสั่งเหล่านี้เป็นคำสั่งแชต/runtime ของ OpenClaw
ไม่ใช่คำสั่งย่อย CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` เป็นแบบอ่านอย่างเดียว ไม่ได้เพิ่ม source ของ marketplace, ติดตั้ง Plugin, หรือ
เปิดใช้การรองรับ Plugin ของ Codex

`install` เปิดใช้การรองรับ Plugin ของ Codex app-server, เพิ่ม source ของ marketplace
ที่กำหนดค่าไว้ตามตัวเลือก, ติดตั้งหรือเปิดใช้ Plugin ที่กำหนดค่าไว้ผ่าน Codex
app-server อีกครั้ง, โหลดเซิร์ฟเวอร์ MCP ใหม่, และตรวจสอบว่าเซิร์ฟเวอร์ MCP เปิดเผยเครื่องมือ

## ตัวเลือก marketplace

OpenClaw ใช้ API app-server เดียวกับที่ Codex เปิดเผยเอง ฟิลด์
marketplace จะเลือกตำแหน่งที่ Codex ควรค้นหา `computer-use`

| ฟิลด์                | ใช้เมื่อ                                                        | การรองรับการติดตั้ง                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| ไม่มีฟิลด์ marketplace | คุณต้องการให้ Codex app-server ใช้ marketplace ที่รู้จักอยู่แล้ว | ใช่ เมื่อ app-server ส่งคืน marketplace ภายในเครื่อง        |
| `marketplaceSource`  | คุณมี source marketplace ของ Codex ที่ app-server เพิ่มได้         | ใช่ สำหรับ `/codex computer-use install` แบบชัดเจน         |
| `marketplacePath`    | คุณรู้อยู่แล้วว่า path ไฟล์ marketplace ภายในเครื่องบนโฮสต์อยู่ที่ใด   | ใช่ สำหรับการติดตั้งแบบชัดเจนและ auto-install ตอนเริ่มเทิร์น   |
| `marketplaceName`    | คุณต้องการเลือก marketplace ที่ลงทะเบียนไว้แล้วหนึ่งรายการตามชื่อ  | ใช่ เฉพาะเมื่อ marketplace ที่เลือกมี path ภายในเครื่อง |

Codex home ใหม่อาจต้องใช้เวลาสั้น ๆ เพื่อ seed marketplace ทางการของตน
ระหว่างการติดตั้ง OpenClaw จะ poll `plugin/list` สูงสุด
`marketplaceDiscoveryTimeoutMs` มิลลิวินาที ค่าเริ่มต้นคือ 60 วินาที

หาก marketplace ที่รู้จักหลายรายการมี Computer Use OpenClaw จะเลือก
`openai-bundled` ก่อน จากนั้น `openai-curated` แล้วจึง `local` รายการที่ตรงกันแบบคลุมเครือ
ซึ่งไม่รู้จักจะล้มเหลวแบบปิดและขอให้คุณตั้งค่า `marketplaceName` หรือ `marketplacePath`

## marketplace macOS ที่ให้มาด้วย

build เดสก์ท็อป Codex รุ่นใหม่ ๆ รวม Computer Use ไว้ที่นี่:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

เมื่อ `computerUse.autoInstall` เป็น true และไม่มี marketplace ที่มี
`computer-use` ลงทะเบียนไว้ OpenClaw จะพยายามเพิ่ม root marketplace ที่ให้มาด้วย
มาตรฐานโดยอัตโนมัติ:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

คุณยังสามารถลงทะเบียนอย่างชัดเจนจาก shell ด้วย Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

หากคุณใช้ path แอป Codex ที่ไม่เป็นมาตรฐาน ให้ตั้งค่า `computerUse.marketplacePath` เป็น
path ไฟล์ marketplace ภายในเครื่อง หรือรัน `/codex computer-use install --source
<marketplace-source>` หนึ่งครั้ง

## ข้อจำกัดของ catalog ระยะไกล

Codex app-server สามารถแสดงรายการและอ่าน entry catalog แบบ remote-only ได้ แต่ในปัจจุบัน
ยังไม่รองรับ `plugin/install` ระยะไกล นั่นหมายความว่า `marketplaceName` สามารถ
เลือก marketplace แบบ remote-only สำหรับการตรวจสอบสถานะได้ แต่การติดตั้งและการเปิดใช้อีกครั้ง
ยังต้องใช้ marketplace ภายในเครื่องผ่าน `marketplaceSource` หรือ `marketplacePath`

หากสถานะบอกว่า Plugin พร้อมใช้งานใน marketplace Codex ระยะไกล แต่ไม่รองรับ
การติดตั้งระยะไกล ให้รัน install ด้วย source หรือ path ภายในเครื่อง:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## ข้อมูลอ้างอิงการกำหนดค่า

| ฟิลด์                           | ค่าเริ่มต้น        | ความหมาย                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | อนุมาน       | บังคับใช้ Computer Use ค่าเริ่มต้นเป็น true เมื่อมีการตั้งค่าฟิลด์ Computer Use อื่น |
| `autoInstall`                   | false          | ติดตั้งหรือเปิดใช้อีกครั้งจาก marketplace ที่ค้นพบแล้วตอนเริ่มเทิร์น       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | ระยะเวลาที่ install รอการค้นพบ marketplace ของ Codex app-server             |
| `marketplaceSource`             | ไม่ได้ตั้งค่า          | สตริง source ที่ส่งให้ `marketplace/add` ของ Codex app-server                    |
| `marketplacePath`               | ไม่ได้ตั้งค่า          | path ไฟล์ marketplace ของ Codex ภายในเครื่องที่มี Plugin                       |
| `marketplaceName`               | ไม่ได้ตั้งค่า          | ชื่อ marketplace ของ Codex ที่ลงทะเบียนไว้เพื่อเลือก                                   |
| `pluginName`                    | `computer-use` | ชื่อ Plugin marketplace ของ Codex                                                 |
| `mcpServerName`                 | `computer-use` | ชื่อเซิร์ฟเวอร์ MCP ที่ Plugin ที่ติดตั้งเปิดเผย                               |

auto-install ตอนเริ่มเทิร์นจงใจปฏิเสธค่า `marketplaceSource`
ที่กำหนดค่าไว้ การเพิ่ม source ใหม่เป็นการดำเนินการตั้งค่าแบบชัดเจน ดังนั้นให้ใช้
`/codex computer-use install --source <marketplace-source>` หนึ่งครั้ง จากนั้นให้
`autoInstall` จัดการการเปิดใช้อีกครั้งในอนาคตจาก marketplace ภายในเครื่องที่ค้นพบแล้ว
auto-install ตอนเริ่มเทิร์นสามารถใช้ `marketplacePath` ที่กำหนดค่าไว้ได้ เพราะนั่นเป็น
path ภายในเครื่องบนโฮสต์อยู่แล้ว

## สิ่งที่ OpenClaw ตรวจสอบ

OpenClaw รายงานเหตุผลการตั้งค่าที่เสถียรภายในและจัดรูปแบบสถานะที่แสดงต่อผู้ใช้
สำหรับแชต:

| เหตุผล                       | ความหมาย                                                | ขั้นตอนถัดไป                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` resolve เป็น false               | ตั้งค่า `enabled` หรือฟิลด์ Computer Use อื่น  |
| `marketplace_missing`        | ไม่มี marketplace ที่ตรงกันพร้อมใช้งาน                 | กำหนดค่า source, path, หรือชื่อ marketplace  |
| `plugin_not_installed`       | มี marketplace แต่ยังไม่ได้ติดตั้ง Plugin   | รัน install หรือเปิดใช้ `autoInstall`          |
| `plugin_disabled`            | Plugin ติดตั้งแล้วแต่ถูกปิดใช้งานในการกำหนดค่า Codex      | รัน install เพื่อเปิดใช้อีกครั้ง                  |
| `remote_install_unsupported` | marketplace ที่เลือกเป็น remote-only                   | ใช้ `marketplaceSource` หรือ `marketplacePath` |
| `mcp_missing`                | Plugin เปิดใช้งานแล้ว แต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน  | ตรวจสอบ Codex Computer Use และสิทธิ์ของ OS  |
| `ready`                      | Plugin และเครื่องมือ MCP พร้อมใช้งาน                    | เริ่มเทิร์นโหมด Codex                    |
| `check_failed`               | คำขอ Codex app-server ล้มเหลวระหว่างการตรวจสอบสถานะ | ตรวจสอบการเชื่อมต่อ app-server และ log       |
| `auto_install_blocked`       | การตั้งค่าตอนเริ่มเทิร์นต้องเพิ่ม source ใหม่       | รัน install แบบชัดเจนก่อน                   |

เอาต์พุตแชตประกอบด้วยสถานะ Plugin, สถานะเซิร์ฟเวอร์ MCP, marketplace, เครื่องมือ
เมื่อพร้อมใช้งาน, และข้อความเฉพาะสำหรับขั้นตอนการตั้งค่าที่ล้มเหลว

## สิทธิ์ macOS

Computer Use เฉพาะ macOS เซิร์ฟเวอร์ MCP ที่ Codex เป็นเจ้าของอาจต้องใช้
สิทธิ์ OS ภายในเครื่องก่อนจึงจะตรวจสอบหรือควบคุมแอปได้ หาก OpenClaw บอกว่า Computer Use
ติดตั้งแล้วแต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน ให้ตรวจสอบการตั้งค่า Computer
Use ฝั่ง Codex ก่อน:

- Codex app-server กำลังทำงานบนโฮสต์เดียวกับที่ควรเกิดการควบคุมเดสก์ท็อป
- เปิดใช้งาน Plugin Computer Use ในการกำหนดค่า Codex แล้ว
- เซิร์ฟเวอร์ MCP `computer-use` ปรากฏในสถานะ MCP ของ Codex app-server
- macOS ได้ให้สิทธิ์ที่จำเป็นสำหรับแอปควบคุมเดสก์ท็อปแล้ว
- เซสชันโฮสต์ปัจจุบันสามารถเข้าถึงเดสก์ท็อปที่กำลังถูกควบคุมได้

OpenClaw ตั้งใจให้ล้มเหลวแบบปิดเมื่อ `computerUse.enabled` เป็นจริง เทิร์นในโหมด
Codex ไม่ควรดำเนินต่อไปแบบเงียบ ๆ โดยไม่มีเครื่องมือเดสก์ท็อปแบบเนทีฟ
ที่การกำหนดค่ากำหนดไว้

## การแก้ไขปัญหา

**สถานะแจ้งว่ายังไม่ได้ติดตั้ง** เรียกใช้ `/codex computer-use install` หากไม่พบ
มาร์เก็ตเพลส ให้ส่ง `--source` หรือ `--marketplace-path`

**สถานะแจ้งว่าติดตั้งแล้วแต่ถูกปิดใช้งาน** เรียกใช้ `/codex computer-use install` อีกครั้ง
การติดตั้ง Codex app-server จะเขียนการกำหนดค่า Plugin กลับเป็นเปิดใช้งาน

**สถานะแจ้งว่าไม่รองรับการติดตั้งระยะไกล** ใช้แหล่งที่มาหรือพาธมาร์เก็ตเพลสภายในเครื่อง
รายการแค็ตตาล็อกแบบระยะไกลเท่านั้นสามารถตรวจสอบได้ แต่ติดตั้งผ่าน API ของ
app-server ปัจจุบันไม่ได้

**สถานะแจ้งว่าเซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน** เรียกใช้การติดตั้งซ้ำหนึ่งครั้งเพื่อให้เซิร์ฟเวอร์ MCP
โหลดใหม่ หากยังไม่พร้อมใช้งาน ให้แก้ไขแอป Codex Computer Use,
สถานะ MCP ของ Codex app-server หรือสิทธิ์ของ macOS

**สถานะหรือการโพรบหมดเวลาที่ `computer-use.list_apps`** มี Plugin และเซิร์ฟเวอร์ MCP
อยู่แล้ว แต่บริดจ์ Computer Use ภายในเครื่องไม่ตอบสนอง ออกจากหรือรีสตาร์ท
Codex Computer Use เปิด Codex Desktop ใหม่หากจำเป็น แล้วลองอีกครั้งใน
เซสชัน OpenClaw ใหม่

**เครื่องมือ Computer Use แจ้งว่า `Native hook relay unavailable`** ฮุกเครื่องมือแบบเนทีฟของ Codex
ไม่สามารถเข้าถึงรีเลย์ OpenClaw ที่ใช้งานอยู่ผ่านบริดจ์ภายในเครื่องหรือ
Gateway สำรองได้ เริ่มเซสชัน OpenClaw ใหม่ด้วย `/new` หรือ `/reset` หากยัง
เกิดขึ้นซ้ำ ให้รีสตาร์ท Gateway เพื่อทิ้งเธรด app-server และการลงทะเบียนฮุกเก่า
จากนั้นลองอีกครั้ง

**การติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นปฏิเสธแหล่งที่มา** นี่เป็นพฤติกรรมโดยตั้งใจ เพิ่ม
แหล่งที่มาด้วย `/codex computer-use install --source <marketplace-source>` อย่างชัดเจน
ก่อน จากนั้นการติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นในอนาคตจะสามารถใช้มาร์เก็ตเพลสภายในเครื่อง
ที่ค้นพบได้
