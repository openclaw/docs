---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ Codex Computer Use
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use, PeekabooBridge และ MCP ของ cua-driver โดยตรง
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use กับการตั้งค่า cua-driver MCP โดยตรง
    - คุณกำลังกำหนดค่า computerUse สำหรับ Plugin Codex ที่รวมมา
    - คุณกำลังแก้ไขปัญหาสถานะหรือการติดตั้ง `computer-use` ของ `/codex`
summary: ตั้งค่า Codex Computer Use สำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: การใช้งานคอมพิวเตอร์ของ Codex
x-i18n:
    generated_at: "2026-04-30T10:05:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use เป็น MCP Plugin แบบเนทีฟของ Codex สำหรับควบคุมเดสก์ท็อปภายในเครื่อง OpenClaw
ไม่ได้รวมแอปเดสก์ท็อปไว้ในตัว, ไม่ดำเนินการบนเดสก์ท็อปเอง, หรือข้ามสิทธิ์ของ
Codex Plugin `codex` ที่รวมมาด้วยมีหน้าที่เตรียม Codex app-server เท่านั้น:
โดยเปิดใช้การรองรับ Codex Plugin, ค้นหาหรือติดตั้ง Codex
Computer Use Plugin ที่กำหนดค่าไว้, ตรวจสอบว่า MCP server `computer-use` พร้อมใช้งาน, แล้ว
ปล่อยให้ Codex เป็นเจ้าของการเรียก MCP tool แบบเนทีฟระหว่างเทิร์นในโหมด Codex

ใช้หน้านี้เมื่อ OpenClaw ใช้ native Codex harness อยู่แล้ว สำหรับการตั้งค่า
runtime เอง โปรดดู [Codex harness](/th/plugins/codex-harness)

## OpenClaw.app และ Peekaboo

การผสานรวม Peekaboo ของ OpenClaw.app แยกจาก Codex Computer Use แอป
macOS สามารถโฮสต์ PeekabooBridge socket เพื่อให้ CLI `peekaboo` ใช้ grant
Accessibility และ Screen Recording ภายในเครื่องของแอปซ้ำสำหรับเครื่องมือ
อัตโนมัติของ Peekaboo เองได้ bridge นั้นไม่ได้ติดตั้งหรือพร็อกซี Codex Computer Use และ
Codex Computer Use ไม่ได้เรียกผ่าน PeekabooBridge socket

ใช้ [Peekaboo bridge](/th/platforms/mac/peekaboo) เมื่อคุณต้องการให้ OpenClaw.app เป็น
โฮสต์ที่ตระหนักถึงสิทธิ์สำหรับงานอัตโนมัติของ Peekaboo CLI ใช้หน้านี้เมื่อ
agent OpenClaw ในโหมด Codex ควรมี MCP Plugin `computer-use` แบบเนทีฟของ Codex
พร้อมใช้งานก่อนเริ่มเทิร์น

## แอป iOS

แอป iOS แยกจาก Codex Computer Use แอปไม่ได้ติดตั้งหรือพร็อกซี
MCP server `computer-use` ของ Codex และไม่ใช่ backend สำหรับควบคุมเดสก์ท็อป
แต่แอป iOS เชื่อมต่อเป็นโหนด OpenClaw และเปิดเผยความสามารถบนมือถือ
ผ่านคำสั่งโหนด เช่น `canvas.*`, `camera.*`, `screen.*`,
`location.*`, และ `talk.*`

ใช้ [iOS](/th/platforms/ios) เมื่อคุณต้องการให้ agent ควบคุมโหนด iPhone ผ่าน
Gateway ใช้หน้านี้เมื่อ agent ในโหมด Codex ควรควบคุมเดสก์ท็อป
macOS ภายในเครื่องผ่าน Computer Use Plugin แบบเนทีฟของ Codex

## MCP cua-driver โดยตรง

Codex Computer Use ไม่ใช่วิธีเดียวในการเปิดเผยการควบคุมเดสก์ท็อป หากคุณต้องการให้
runtime ที่ OpenClaw จัดการเรียก driver ของ TryCua โดยตรง ให้ใช้ server
`cua-driver mcp` จาก upstream ผ่าน MCP registry ของ OpenClaw แทน
ขั้นตอน marketplace เฉพาะ Codex

หลังจากติดตั้ง `cua-driver` แล้ว ให้ขอคำสั่ง OpenClaw จากมัน:

```bash
cua-driver mcp-config --client openclaw
```

หรือจดทะเบียน stdio server ด้วยตนเอง:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

เส้นทางนั้นคงพื้นผิวเครื่องมือ MCP จาก upstream ไว้อย่างครบถ้วน รวมถึง schema ของ driver
และการตอบกลับ MCP แบบมีโครงสร้าง ใช้เมื่อคุณต้องการให้ CUA driver
พร้อมใช้งานในฐานะ MCP server ของ OpenClaw ตามปกติ ใช้การตั้งค่า Codex Computer Use ใน
หน้านี้เมื่อ Codex app-server ควรเป็นเจ้าของการติดตั้ง Plugin, การโหลด MCP ใหม่,
และการเรียกเครื่องมือแบบเนทีฟภายในเทิร์นโหมด Codex

driver ของ CUA ใช้ได้เฉพาะ macOS และยังต้องใช้สิทธิ์ macOS ภายในเครื่อง
ที่แอปแจ้งขอ เช่น Accessibility และ Screen Recording OpenClaw
ไม่ได้ติดตั้ง `cua-driver`, ให้สิทธิ์เหล่านั้น, หรือข้ามโมเดลความปลอดภัยของ driver
จาก upstream

## การตั้งค่าอย่างรวดเร็ว

ตั้งค่า `plugins.entries.codex.config.computerUse` เมื่อเทิร์นในโหมด Codex ต้องมี
Computer Use พร้อมใช้งานก่อนเริ่ม thread:

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
        fallback: "none",
      },
    },
  },
}
```

ด้วย config นี้ OpenClaw จะตรวจสอบ Codex app-server ก่อนแต่ละเทิร์นในโหมด Codex
หาก Computer Use หายไป แต่ Codex app-server ค้นพบ marketplace ที่ติดตั้งได้แล้ว
OpenClaw จะขอให้ Codex app-server ติดตั้งหรือเปิดใช้ Plugin อีกครั้งและโหลด
MCP server ใหม่ บน macOS เมื่อไม่มี marketplace ที่ตรงกันถูกจดทะเบียนไว้
และมีชุดแอป Codex มาตรฐานอยู่ OpenClaw จะพยายามจดทะเบียน
Codex marketplace ที่รวมมากับแอปจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ก่อนที่
จะล้มเหลว หากการตั้งค่ายังไม่สามารถทำให้ MCP server พร้อมใช้งานได้ เทิร์นจะล้มเหลว
ก่อนเริ่ม thread

session ที่มีอยู่จะคง runtime และการผูกกับ thread ของ Codex ไว้ หลังเปลี่ยน
`agentRuntime` หรือ config ของ Computer Use ให้ใช้ `/new` หรือ `/reset` ในแชตที่ได้รับผลกระทบ
ก่อนทดสอบ

## คำสั่ง

ใช้คำสั่ง `/codex computer-use` จากพื้นผิวแชตใดก็ได้ที่พื้นผิวคำสั่งของ Plugin `codex`
พร้อมใช้งาน คำสั่งเหล่านี้เป็นคำสั่ง chat/runtime ของ OpenClaw
ไม่ใช่คำสั่งย่อย CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` เป็นแบบอ่านอย่างเดียว ไม่เพิ่มแหล่ง marketplace, ติดตั้ง Plugin, หรือ
เปิดใช้การรองรับ Codex Plugin

`install` เปิดใช้การรองรับ Plugin ของ Codex app-server, เพิ่มแหล่ง
marketplace ที่กำหนดค่าไว้หากมี, ติดตั้งหรือเปิดใช้ Plugin ที่กำหนดค่าไว้ผ่าน Codex
app-server อีกครั้ง, โหลด MCP server ใหม่, และตรวจสอบว่า MCP server เปิดเผยเครื่องมือ

## ตัวเลือก marketplace

OpenClaw ใช้ API app-server เดียวกับที่ Codex เปิดเผยเอง
ช่อง marketplace เลือกตำแหน่งที่ Codex ควรค้นหา `computer-use`

| ช่อง                 | ใช้เมื่อ                                                        | การรองรับการติดตั้ง                                      |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| ไม่มีช่อง marketplace | คุณต้องการให้ Codex app-server ใช้ marketplace ที่มันรู้จักอยู่แล้ว | ใช่ เมื่อ app-server ส่งคืน marketplace ภายในเครื่อง        |
| `marketplaceSource`  | คุณมีแหล่ง Codex marketplace ที่ app-server สามารถเพิ่มได้       | ใช่ สำหรับ `/codex computer-use install` แบบชัดเจน         |
| `marketplacePath`    | คุณทราบ path ไฟล์ marketplace ภายในเครื่องบน host อยู่แล้ว       | ใช่ สำหรับการติดตั้งแบบชัดเจนและ auto-install ตอนเริ่มเทิร์น |
| `marketplaceName`    | คุณต้องการเลือก marketplace ที่จดทะเบียนแล้วหนึ่งรายการตามชื่อ    | ใช่ เฉพาะเมื่อ marketplace ที่เลือกมี path ภายในเครื่อง     |

Codex homes ใหม่อาจต้องใช้เวลาสั้น ๆ เพื่อ seed marketplace ทางการ
ระหว่างติดตั้ง OpenClaw จะ poll `plugin/list` นานสูงสุด
`marketplaceDiscoveryTimeoutMs` มิลลิวินาที ค่าเริ่มต้นคือ 60 วินาที

หาก marketplace ที่รู้จักหลายรายการมี Computer Use OpenClaw จะเลือก
`openai-bundled` ก่อน จากนั้น `openai-curated` แล้วจึง `local` การจับคู่ที่คลุมเครือและไม่รู้จัก
จะล้มเหลวแบบปิดและขอให้คุณตั้งค่า `marketplaceName` หรือ `marketplacePath`

## marketplace macOS ที่รวมมา

Codex desktop build รุ่นล่าสุดรวม Computer Use ไว้ที่นี่:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

เมื่อ `computerUse.autoInstall` เป็น true และไม่มี marketplace ที่มี
`computer-use` ถูกจดทะเบียนไว้ OpenClaw จะพยายามเพิ่ม root ของ marketplace
ที่รวมมาตามมาตรฐานโดยอัตโนมัติ:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

คุณยังสามารถจดทะเบียนอย่างชัดเจนจาก shell ด้วย Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

หากคุณใช้ path แอป Codex ที่ไม่เป็นมาตรฐาน ให้ตั้งค่า `computerUse.marketplacePath` เป็น
path ไฟล์ marketplace ภายในเครื่อง หรือเรียกใช้ `/codex computer-use install --source
<marketplace-source>` หนึ่งครั้ง

## ขีดจำกัด catalog ระยะไกล

Codex app-server สามารถแสดงรายการและอ่าน entry ของ catalog แบบ remote-only ได้ แต่ยังไม่
รองรับ `plugin/install` ระยะไกลในปัจจุบัน นั่นหมายความว่า `marketplaceName` สามารถ
เลือก marketplace แบบ remote-only สำหรับการตรวจสอบสถานะได้ แต่การติดตั้งและการเปิดใช้ใหม่
ยังต้องใช้ marketplace ภายในเครื่องผ่าน `marketplaceSource` หรือ `marketplacePath`

หากสถานะบอกว่า Plugin พร้อมใช้งานใน Codex marketplace ระยะไกล แต่ไม่รองรับการติดตั้ง
ระยะไกล ให้เรียกใช้ install พร้อมแหล่งหรือ path ภายในเครื่อง:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## อ้างอิงการกำหนดค่า

| ช่อง                            | ค่าเริ่มต้น      | ความหมาย                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | บังคับใช้ Computer Use ค่าเริ่มต้นเป็น true เมื่อมีการตั้งค่าช่อง Computer Use อื่น |
| `autoInstall`                   | false          | ติดตั้งหรือเปิดใช้ใหม่จาก marketplace ที่ค้นพบแล้วตอนเริ่มเทิร์น               |
| `marketplaceDiscoveryTimeoutMs` | 60000          | ระยะเวลาที่ install รอการค้นพบ marketplace ของ Codex app-server                |
| `marketplaceSource`             | unset          | สตริงแหล่งที่ส่งให้ `marketplace/add` ของ Codex app-server                     |
| `marketplacePath`               | unset          | path ไฟล์ Codex marketplace ภายในเครื่องที่มี Plugin                           |
| `marketplaceName`               | unset          | ชื่อ Codex marketplace ที่จดทะเบียนแล้วเพื่อเลือก                               |
| `pluginName`                    | `computer-use` | ชื่อ Plugin ใน Codex marketplace                                                |
| `mcpServerName`                 | `computer-use` | ชื่อ MCP server ที่ Plugin ที่ติดตั้งเปิดเผย                                    |

auto-install ตอนเริ่มเทิร์นปฏิเสธค่า `marketplaceSource` ที่กำหนดค่าไว้โดยเจตนา
การเพิ่มแหล่งใหม่เป็นการดำเนินการตั้งค่าแบบชัดเจน ดังนั้นให้ใช้
`/codex computer-use install --source <marketplace-source>` หนึ่งครั้ง จากนั้นปล่อยให้
`autoInstall` จัดการการเปิดใช้ใหม่ในอนาคตจาก marketplace ภายในเครื่องที่ค้นพบแล้ว
auto-install ตอนเริ่มเทิร์นสามารถใช้ `marketplacePath` ที่กำหนดค่าไว้ได้ เพราะนั่นเป็น
path ภายในเครื่องบน host อยู่แล้ว

## สิ่งที่ OpenClaw ตรวจสอบ

OpenClaw รายงานเหตุผลการตั้งค่าที่เสถียรภายในและจัดรูปแบบสถานะที่ผู้ใช้เห็น
สำหรับแชต:

| เหตุผล                       | ความหมาย                                                | ขั้นตอนถัดไป                                   |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` แปลงค่าได้เป็น false              | ตั้งค่า `enabled` หรือช่อง Computer Use อื่น   |
| `marketplace_missing`        | ไม่มี marketplace ที่ตรงกันพร้อมใช้งาน                  | กำหนดค่าแหล่ง, path, หรือชื่อ marketplace       |
| `plugin_not_installed`       | มี marketplace แต่ยังไม่ได้ติดตั้ง Plugin               | เรียกใช้ install หรือเปิดใช้ `autoInstall`      |
| `plugin_disabled`            | ติดตั้ง Plugin แล้วแต่ถูกปิดใช้ใน config ของ Codex      | เรียกใช้ install เพื่อเปิดใช้อีกครั้ง          |
| `remote_install_unsupported` | marketplace ที่เลือกเป็น remote-only                    | ใช้ `marketplaceSource` หรือ `marketplacePath` |
| `mcp_missing`                | เปิดใช้ Plugin แล้ว แต่ MCP server ไม่พร้อมใช้งาน       | ตรวจสอบ Codex Computer Use และสิทธิ์ OS        |
| `ready`                      | Plugin และเครื่องมือ MCP พร้อมใช้งาน                    | เริ่มเทิร์นโหมด Codex                         |
| `check_failed`               | request ไปยัง Codex app-server ล้มเหลวระหว่างตรวจสถานะ | ตรวจสอบการเชื่อมต่อและ log ของ app-server      |
| `auto_install_blocked`       | การตั้งค่าตอนเริ่มเทิร์นจำเป็นต้องเพิ่มแหล่งใหม่        | เรียกใช้ install แบบชัดเจนก่อน                 |

ผลลัพธ์ในแชตประกอบด้วยสถานะ Plugin, สถานะ MCP server, marketplace, เครื่องมือ
เมื่อพร้อมใช้งาน, และข้อความเฉพาะสำหรับขั้นตอนการตั้งค่าที่ล้มเหลว

## สิทธิ์ macOS

Computer Use ใช้ได้เฉพาะ macOS MCP server ที่ Codex เป็นเจ้าของอาจต้องใช้สิทธิ์ OS
ภายในเครื่องก่อนจึงจะตรวจสอบหรือควบคุมแอปได้ หาก OpenClaw บอกว่า Computer Use
ติดตั้งแล้วแต่ MCP server ไม่พร้อมใช้งาน ให้ตรวจสอบการตั้งค่า Computer Use ฝั่ง Codex
ก่อน:

- Codex app-server กำลังทำงานบนโฮสต์เดียวกับที่ควรเกิดการควบคุมเดสก์ท็อป
- เปิดใช้งาน Plugin Computer Use ในการกำหนดค่า Codex แล้ว
- เซิร์ฟเวอร์ MCP `computer-use` ปรากฏในสถานะ MCP ของ Codex app-server
- macOS ได้อนุญาตสิทธิ์ที่จำเป็นสำหรับแอปควบคุมเดสก์ท็อปแล้ว
- เซสชันโฮสต์ปัจจุบันสามารถเข้าถึงเดสก์ท็อปที่ถูกควบคุมได้

OpenClaw ตั้งใจให้ล้มเหลวแบบปิดเมื่อ `computerUse.enabled` เป็น true เทิร์นในโหมด Codex
ไม่ควรดำเนินต่ออย่างเงียบ ๆ โดยไม่มีเครื่องมือเดสก์ท็อปแบบเนทีฟ
ที่การกำหนดค่ากำหนดไว้

## การแก้ไขปัญหา

**สถานะบอกว่ายังไม่ได้ติดตั้ง** เรียกใช้ `/codex computer-use install` หากไม่พบ
marketplace ให้ส่ง `--source` หรือ `--marketplace-path`

**สถานะบอกว่าติดตั้งแล้วแต่ถูกปิดใช้งาน** เรียกใช้ `/codex computer-use install` อีกครั้ง
การติดตั้งของ Codex app-server จะเขียนการกำหนดค่า Plugin กลับเป็นเปิดใช้งาน

**สถานะบอกว่าไม่รองรับการติดตั้งระยะไกล** ใช้แหล่งที่มาหรือ
พาธ marketplace แบบภายในเครื่อง รายการแค็ตตาล็อกที่เป็นระยะไกลเท่านั้นสามารถตรวจสอบได้ แต่ติดตั้งผ่าน
API app-server ปัจจุบันไม่ได้

**สถานะบอกว่าเซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน** เรียกใช้การติดตั้งอีกครั้งหนึ่งครั้งเพื่อให้เซิร์ฟเวอร์ MCP
โหลดซ้ำ หากยังไม่พร้อมใช้งาน ให้แก้ไขแอป Codex Computer Use,
สถานะ MCP ของ Codex app-server หรือสิทธิ์ของ macOS

**สถานะหรือการ probe หมดเวลาที่ `computer-use.list_apps`** มี Plugin และเซิร์ฟเวอร์ MCP
อยู่แล้ว แต่ bridge ของ Computer Use ภายในเครื่องไม่ตอบสนอง ออกจากแอปหรือ
รีสตาร์ต Codex Computer Use, เปิด Codex Desktop ใหม่หากจำเป็น แล้วลองอีกครั้งใน
เซสชัน OpenClaw ใหม่

**เครื่องมือ Computer Use บอกว่า `Native hook relay unavailable`** hook เครื่องมือแบบเนทีฟของ Codex
ไม่สามารถเข้าถึง relay ของ OpenClaw ที่ทำงานอยู่ผ่าน bridge ภายในเครื่องหรือ
Gateway fallback ได้ เริ่มเซสชัน OpenClaw ใหม่ด้วย `/new` หรือ `/reset` หากยัง
เกิดขึ้นต่อเนื่อง ให้รีสตาร์ต gateway เพื่อทิ้งเธรด app-server เก่าและการลงทะเบียน
hook แล้วลองอีกครั้ง

**การติดตั้งอัตโนมัติตอนเริ่มเทิร์นปฏิเสธแหล่งที่มา** นี่เป็นความตั้งใจ เพิ่ม
แหล่งที่มาด้วย `/codex computer-use install --source <marketplace-source>` อย่างชัดเจน
ก่อน จากนั้นการติดตั้งอัตโนมัติตอนเริ่มเทิร์นในอนาคตจึงจะใช้
marketplace ภายในเครื่องที่ค้นพบได้
