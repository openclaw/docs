---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ Codex Computer Use
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use, PeekabooBridge และการใช้ cua-driver MCP โดยตรง
    - คุณกำลังตัดสินใจระหว่าง Codex Computer Use กับการตั้งค่า MCP ผ่าน cua-driver โดยตรง
    - คุณกำลังกำหนดค่า computerUse สำหรับ Plugin Codex ที่รวมมาให้
    - คุณกำลังแก้ไขปัญหาเกี่ยวกับสถานะหรือการติดตั้ง /codex computer-use
summary: ตั้งค่าการใช้งานคอมพิวเตอร์ของ Codex สำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: การใช้คอมพิวเตอร์ของ Codex
x-i18n:
    generated_at: "2026-05-06T09:24:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use เป็น MCP Plugin ที่เป็นเนทีฟของ Codex สำหรับควบคุมเดสก์ท็อปในเครื่อง OpenClaw
ไม่ได้รวมแอปเดสก์ท็อปไว้ในแพ็กเกจ ไม่ได้ดำเนินการบนเดสก์ท็อปเอง หรือข้าม
สิทธิ์ของ Codex Plugin `codex` ที่มาพร้อมกันเพียงเตรียม Codex app-server:
โดยเปิดใช้การรองรับ Plugin ของ Codex ค้นหาหรือติดตั้ง Codex
Computer Use plugin ที่กำหนดค่าไว้ ตรวจสอบว่า MCP server `computer-use` พร้อมใช้งาน และ
จากนั้นปล่อยให้ Codex เป็นเจ้าของการเรียก MCP tool แบบเนทีฟในระหว่างเทิร์นโหมด Codex

ใช้หน้านี้เมื่อ OpenClaw ใช้ harness เนทีฟของ Codex อยู่แล้ว สำหรับ
การตั้งค่า runtime เอง โปรดดู [Codex harness](/th/plugins/codex-harness)

## OpenClaw.app และ Peekaboo

การผสานรวม Peekaboo ของ OpenClaw.app แยกจาก Codex Computer Use แอป
macOS สามารถโฮสต์ซ็อกเก็ต PeekabooBridge เพื่อให้ CLI `peekaboo` ใช้สิทธิ์
Accessibility และ Screen Recording ในเครื่องของแอปซ้ำได้สำหรับ
เครื่องมืออัตโนมัติของ Peekaboo เอง บริดจ์นั้นไม่ได้ติดตั้งหรือพร็อกซี Codex Computer Use และ
Codex Computer Use ไม่ได้เรียกผ่านซ็อกเก็ต PeekabooBridge

ใช้ [Peekaboo bridge](/th/platforms/mac/peekaboo) เมื่อคุณต้องการให้ OpenClaw.app เป็น
โฮสต์ที่รับรู้สิทธิ์สำหรับการทำงานอัตโนมัติของ Peekaboo CLI ใช้หน้านี้เมื่อ
เอเจนต์ OpenClaw โหมด Codex ควรมี MCP plugin `computer-use` แบบเนทีฟของ Codex
พร้อมใช้งานก่อนเทิร์นเริ่มต้น

## แอป iOS

แอป iOS แยกจาก Codex Computer Use แอปไม่ได้ติดตั้งหรือพร็อกซี
MCP server `computer-use` ของ Codex และไม่ใช่ backend สำหรับควบคุมเดสก์ท็อป
แต่แอป iOS เชื่อมต่อเป็นโหนด OpenClaw และเปิดเผยความสามารถบนมือถือ
ผ่านคำสั่งโหนด เช่น `canvas.*`, `camera.*`, `screen.*`,
`location.*`, และ `talk.*`

ใช้ [iOS](/th/platforms/ios) เมื่อคุณต้องการให้เอเจนต์ควบคุมโหนด iPhone ผ่าน
gateway ใช้หน้านี้เมื่อเอเจนต์โหมด Codex ควรควบคุมเดสก์ท็อป
macOS ในเครื่องผ่าน Computer Use plugin แบบเนทีฟของ Codex

## MCP cua-driver โดยตรง

Codex Computer Use ไม่ใช่วิธีเดียวในการเปิดเผยการควบคุมเดสก์ท็อป หากคุณต้องการให้
runtime ที่ OpenClaw จัดการเรียกไดรเวอร์ของ TryCua โดยตรง ให้ใช้ server
`cua-driver mcp` ต้นทางผ่าน registry MCP ของ OpenClaw แทน
ขั้นตอน marketplace ที่เฉพาะกับ Codex

หลังจากติดตั้ง `cua-driver` แล้ว ให้ขอคำสั่ง OpenClaw จากเครื่องมือนั้น:

```bash
cua-driver mcp-config --client openclaw
```

หรือลงทะเบียน stdio server ด้วยตัวเอง:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

เส้นทางนั้นคงพื้นผิว MCP tool ต้นทางไว้ครบถ้วน รวมถึง schema ของไดรเวอร์
และคำตอบ MCP แบบมีโครงสร้าง ใช้เมื่อคุณต้องการให้ไดรเวอร์ CUA
พร้อมใช้งานเป็น MCP server ปกติของ OpenClaw ใช้การตั้งค่า Codex Computer Use ใน
หน้านี้เมื่อ Codex app-server ควรเป็นเจ้าของการติดตั้ง Plugin, การ reload MCP,
และการเรียก tool แบบเนทีฟภายในเทิร์นโหมด Codex

ไดรเวอร์ของ CUA เฉพาะเจาะจงกับ macOS และยังคงต้องใช้สิทธิ์ macOS ในเครื่อง
ที่แอปของมันขอ เช่น Accessibility และ Screen Recording OpenClaw
ไม่ได้ติดตั้ง `cua-driver`, ให้สิทธิ์เหล่านั้น, หรือข้ามโมเดลความปลอดภัยของ
ไดรเวอร์ต้นทาง

## การตั้งค่าแบบรวดเร็ว

ตั้งค่า `plugins.entries.codex.config.computerUse` เมื่อเทิร์นโหมด Codex ต้องมี
Computer Use พร้อมใช้งานก่อนเธรดเริ่มต้น:

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

ด้วย config นี้ OpenClaw จะตรวจสอบ Codex app-server ก่อนแต่ละเทิร์นโหมด Codex
หาก Computer Use หายไป แต่ Codex app-server ค้นพบ marketplace ที่ติดตั้งได้แล้ว
OpenClaw จะขอให้ Codex app-server ติดตั้งหรือเปิดใช้งาน Plugin อีกครั้งและ reload
MCP servers บน macOS เมื่อไม่มี marketplace ที่ตรงกันลงทะเบียนไว้
และมี bundle แอป Codex มาตรฐานอยู่ OpenClaw จะพยายามลงทะเบียน
marketplace Codex ที่มาพร้อมกันจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ก่อนที่จะ
ล้มเหลว หากการตั้งค่ายังทำให้ MCP server พร้อมใช้งานไม่ได้ เทิร์นจะล้มเหลว
ก่อนเธรดเริ่มต้น

เซสชันที่มีอยู่จะคง runtime และการผูกเธรด Codex ของตัวเองไว้ หลังเปลี่ยน
`agentRuntime` หรือ config ของ Computer Use ให้ใช้ `/new` หรือ `/reset` ในแชต
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

`status` เป็นแบบอ่านอย่างเดียว คำสั่งนี้ไม่เพิ่ม source ของ marketplace, ติดตั้ง Plugin, หรือ
เปิดใช้การรองรับ Plugin ของ Codex

`install` เปิดใช้การรองรับ Plugin ของ Codex app-server, เพิ่ม source ของ
marketplace ที่กำหนดค่าไว้ได้ตามต้องการ, ติดตั้งหรือเปิดใช้งาน Plugin ที่กำหนดค่าไว้
อีกครั้งผ่าน Codex app-server, reload MCP servers, และตรวจสอบว่า MCP server เปิดเผย tools

## ตัวเลือก marketplace

OpenClaw ใช้ API app-server เดียวกับที่ Codex เปิดเผยเอง
ฟิลด์ marketplace เลือกตำแหน่งที่ Codex ควรหา `computer-use`

| ฟิลด์                | ใช้เมื่อ                                                        | การรองรับการติดตั้ง                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| ไม่มีฟิลด์ marketplace | คุณต้องการให้ Codex app-server ใช้ marketplace ที่รู้จักอยู่แล้ว | ได้ เมื่อ app-server ส่งคืน marketplace ในเครื่อง        |
| `marketplaceSource`  | คุณมี source ของ Codex marketplace ที่ app-server เพิ่มได้         | ได้ สำหรับ `/codex computer-use install` แบบระบุชัดเจน         |
| `marketplacePath`    | คุณรู้ file path ของ marketplace ในเครื่องบนโฮสต์อยู่แล้ว   | ได้ สำหรับการติดตั้งแบบระบุชัดเจนและ auto-install ตอนเริ่มเทิร์น   |
| `marketplaceName`    | คุณต้องการเลือก marketplace ที่ลงทะเบียนไว้แล้วรายการหนึ่งตามชื่อ  | ได้เฉพาะเมื่อ marketplace ที่เลือกมี path ในเครื่อง |

home ของ Codex ที่สร้างใหม่อาจต้องใช้เวลาสั้น ๆ เพื่อ seed marketplace ทางการ
ระหว่างการติดตั้ง OpenClaw จะ poll `plugin/list` เป็นเวลาสูงสุด
`marketplaceDiscoveryTimeoutMs` มิลลิวินาที ค่าเริ่มต้นคือ 60 วินาที

หาก marketplace ที่รู้จักหลายรายการมี Computer Use อยู่ OpenClaw จะเลือก
`openai-bundled` ก่อน จากนั้น `openai-curated` แล้วจึง `local` การจับคู่ที่ไม่รู้จัก
และกำกวมจะล้มเหลวแบบปิด และขอให้คุณตั้งค่า `marketplaceName` หรือ `marketplacePath`

## marketplace macOS ที่มาพร้อมกัน

บิลด์เดสก์ท็อป Codex รุ่นล่าสุดรวม Computer Use ไว้ที่นี่:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

เมื่อ `computerUse.autoInstall` เป็น true และไม่มี marketplace ที่มี
`computer-use` ลงทะเบียนไว้ OpenClaw จะพยายามเพิ่ม root ของ marketplace ที่มาพร้อมกัน
มาตรฐานโดยอัตโนมัติ:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

คุณยังสามารถลงทะเบียนอย่างชัดเจนจาก shell ด้วย Codex ได้:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

หากคุณใช้ path แอป Codex ที่ไม่เป็นมาตรฐาน ให้ตั้งค่า `computerUse.marketplacePath` เป็น
file path ของ marketplace ในเครื่อง หรือรัน `/codex computer-use install --source
<marketplace-source>` หนึ่งครั้ง

## ขีดจำกัด catalog ระยะไกล

Codex app-server สามารถแสดงรายการและอ่าน entry ของ catalog ที่เป็นระยะไกลเท่านั้นได้ แต่ปัจจุบัน
ยังไม่รองรับ `plugin/install` ระยะไกล นั่นหมายความว่า `marketplaceName` สามารถ
เลือก marketplace ที่เป็นระยะไกลเท่านั้นสำหรับการตรวจสอบสถานะได้ แต่การติดตั้งและการเปิดใช้งานอีกครั้ง
ยังต้องใช้ marketplace ในเครื่องผ่าน `marketplaceSource` หรือ `marketplacePath`

หากสถานะบอกว่า Plugin พร้อมใช้งานใน marketplace Codex ระยะไกล แต่ไม่รองรับ
การติดตั้งระยะไกล ให้รัน install ด้วย source หรือ path ในเครื่อง:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## อ้างอิงการกำหนดค่า

| ฟิลด์                           | ค่าเริ่มต้น        | ความหมาย                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | กำหนดให้ต้องมี Computer Use ค่าเริ่มต้นเป็น true เมื่อมีการตั้งค่าฟิลด์ Computer Use อื่น |
| `autoInstall`                   | false          | ติดตั้งหรือเปิดใช้งานอีกครั้งจาก marketplace ที่ค้นพบแล้วตอนเริ่มเทิร์น       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | ระยะเวลาที่ install รอให้ Codex app-server ค้นพบ marketplace             |
| `marketplaceSource`             | unset          | สตริง source ที่ส่งให้ Codex app-server `marketplace/add`                    |
| `marketplacePath`               | unset          | file path ของ Codex marketplace ในเครื่องที่มี Plugin                       |
| `marketplaceName`               | unset          | ชื่อ Codex marketplace ที่ลงทะเบียนไว้เพื่อเลือก                                   |
| `pluginName`                    | `computer-use` | ชื่อ Codex marketplace plugin                                                 |
| `mcpServerName`                 | `computer-use` | ชื่อ MCP server ที่ Plugin ที่ติดตั้งเปิดเผย                               |

auto-install ตอนเริ่มเทิร์นตั้งใจปฏิเสธค่า `marketplaceSource` ที่กำหนดค่าไว้
การเพิ่ม source ใหม่เป็นการตั้งค่าแบบระบุชัดเจน ดังนั้นให้ใช้
`/codex computer-use install --source <marketplace-source>` หนึ่งครั้ง จากนั้นปล่อยให้
`autoInstall` จัดการการเปิดใช้งานอีกครั้งในอนาคตจาก marketplace ในเครื่องที่ค้นพบ
auto-install ตอนเริ่มเทิร์นสามารถใช้ `marketplacePath` ที่กำหนดค่าไว้ได้ เพราะนั่นเป็น
path ในเครื่องบนโฮสต์อยู่แล้ว

## สิ่งที่ OpenClaw ตรวจสอบ

OpenClaw รายงานเหตุผลการตั้งค่าที่เสถียรภายใน และจัดรูปแบบสถานะที่ผู้ใช้เห็น
สำหรับแชต:

| เหตุผล                       | ความหมาย                                                | ขั้นตอนถัดไป                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` resolve เป็น false               | ตั้งค่า `enabled` หรือฟิลด์ Computer Use อื่น  |
| `marketplace_missing`        | ไม่มี marketplace ที่ตรงกันพร้อมใช้งาน                 | กำหนดค่า source, path, หรือชื่อ marketplace  |
| `plugin_not_installed`       | มี marketplace แต่ยังไม่ได้ติดตั้ง Plugin   | รัน install หรือเปิดใช้ `autoInstall`          |
| `plugin_disabled`            | ติดตั้ง Plugin แล้ว แต่ถูกปิดใช้ใน config ของ Codex      | รัน install เพื่อเปิดใช้งานอีกครั้ง                  |
| `remote_install_unsupported` | marketplace ที่เลือกเป็นแบบระยะไกลเท่านั้น                   | ใช้ `marketplaceSource` หรือ `marketplacePath` |
| `mcp_missing`                | เปิดใช้ Plugin แล้ว แต่ MCP server ไม่พร้อมใช้งาน  | ตรวจสอบ Codex Computer Use และสิทธิ์ของ OS  |
| `ready`                      | Plugin และ MCP tools พร้อมใช้งาน                    | เริ่มเทิร์นโหมด Codex                    |
| `check_failed`               | คำขอ Codex app-server ล้มเหลวระหว่างตรวจสอบสถานะ | ตรวจสอบการเชื่อมต่อและ logs ของ app-server       |
| `auto_install_blocked`       | การตั้งค่าตอนเริ่มเทิร์นจำเป็นต้องเพิ่ม source ใหม่       | รัน install แบบระบุชัดเจนก่อน                   |

เอาต์พุตแชตรวมสถานะของ Plugin, สถานะ MCP server, marketplace, tools
เมื่อพร้อมใช้งาน และข้อความเฉพาะสำหรับขั้นตอนการตั้งค่าที่ล้มเหลว

## สิทธิ์ macOS

Computer Use เฉพาะเจาะจงกับ macOS MCP server ที่ Codex เป็นเจ้าของอาจต้องใช้สิทธิ์ OS
ในเครื่องก่อนที่จะตรวจสอบหรือควบคุมแอปได้ หาก OpenClaw บอกว่า Computer Use
ติดตั้งแล้ว แต่ MCP server ไม่พร้อมใช้งาน ให้ตรวจสอบการตั้งค่า Computer
Use ฝั่ง Codex ก่อน

- Codex app-server กำลังทำงานบนโฮสต์เดียวกับที่ควรเกิดการควบคุมเดสก์ท็อป
- เปิดใช้งาน Plugin Computer Use ในการกำหนดค่า Codex แล้ว
- เซิร์ฟเวอร์ MCP `computer-use` ปรากฏในสถานะ MCP ของ Codex app-server
- macOS ได้ให้สิทธิ์ที่จำเป็นแก่แอปควบคุมเดสก์ท็อปแล้ว
- เซสชันโฮสต์ปัจจุบันสามารถเข้าถึงเดสก์ท็อปที่กำลังควบคุมได้

OpenClaw ตั้งใจให้ล้มเหลวแบบปิดเมื่อ `computerUse.enabled` เป็นจริง เทิร์นในโหมด
Codex ไม่ควรดำเนินต่อไปอย่างเงียบ ๆ หากไม่มีเครื่องมือเดสก์ท็อปแบบเนทีฟ
ที่การกำหนดค่ากำหนดไว้

## การแก้ไขปัญหา

**สถานะบอกว่ายังไม่ได้ติดตั้ง** เรียกใช้ `/codex computer-use install` หากค้นพบ
marketplace ไม่พบ ให้ส่ง `--source` หรือ `--marketplace-path`

**สถานะบอกว่าติดตั้งแล้วแต่ปิดใช้งานอยู่** เรียกใช้ `/codex computer-use install` อีกครั้ง
การติดตั้ง Codex app-server จะเขียนการกำหนดค่า Plugin กลับเป็นเปิดใช้งาน

**สถานะบอกว่าไม่รองรับการติดตั้งระยะไกล** ใช้ซอร์สหรือพาธ marketplace ภายในเครื่อง
รายการแค็ตตาล็อกที่มีเฉพาะระยะไกลสามารถตรวจสอบได้ แต่ติดตั้งผ่าน API
ของ app-server ปัจจุบันไม่ได้

**สถานะบอกว่าเซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน** เรียกใช้การติดตั้งซ้ำหนึ่งครั้งเพื่อให้
เซิร์ฟเวอร์ MCP โหลดใหม่ หากยังไม่พร้อมใช้งาน ให้แก้ไขแอป Codex Computer Use,
สถานะ MCP ของ Codex app-server หรือสิทธิ์ของ macOS

**สถานะหรือโพรบหมดเวลาบน `computer-use.list_apps`** Plugin และเซิร์ฟเวอร์ MCP
มีอยู่แล้ว แต่บริดจ์ Computer Use ภายในเครื่องไม่ตอบสนอง ออกจากหรือเริ่ม
Codex Computer Use ใหม่ เปิด Codex Desktop ใหม่หากจำเป็น แล้วลองอีกครั้งใน
เซสชัน OpenClaw ใหม่

**เครื่องมือ Computer Use แจ้งว่า `Native hook relay unavailable`** ฮุกเครื่องมือ
แบบเนทีฟของ Codex ไม่สามารถเข้าถึงรีเลย์ OpenClaw ที่ใช้งานอยู่ผ่านบริดจ์
ภายในเครื่องหรือทางสำรอง Gateway ได้ เริ่มเซสชัน OpenClaw ใหม่ด้วย `/new` หรือ `/reset`
หากยังเกิดขึ้นต่อเนื่อง ให้เริ่ม Gateway ใหม่เพื่อให้เธรด app-server เก่าและการลงทะเบียนฮุก
ถูกทิ้งไป แล้วลองอีกครั้ง

**การติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นปฏิเสธซอร์ส** นี่เป็นพฤติกรรมที่ตั้งใจไว้ เพิ่ม
ซอร์สด้วย `/codex computer-use install --source <marketplace-source>` อย่างชัดเจนก่อน
จากนั้นการติดตั้งอัตโนมัติเมื่อเริ่มเทิร์นในอนาคตจึงจะใช้ marketplace ภายในเครื่อง
ที่ค้นพบได้

## ที่เกี่ยวข้อง

- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo)
- [แอป iOS](/th/platforms/ios)
