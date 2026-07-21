---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ Codex Computer Use
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use, PeekabooBridge และ cua-driver MCP โดยตรง
    - คุณกำลังกำหนดค่า computerUse สำหรับ Plugin Codex ที่รวมมาให้แล้ว
    - คุณกำลังแก้ไขปัญหาสถานะหรือการติดตั้งการใช้งานคอมพิวเตอร์ของ /codex
summary: ตั้งค่า Codex Computer Use สำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: การใช้งานคอมพิวเตอร์ด้วย Codex
x-i18n:
    generated_at: "2026-07-21T15:23:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 268fc5659f776eff4cfb9bec8a95cd7ab5c6cbdf13793914409444da72f9e98e
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use เป็น Plugin MCP แบบเนทีฟของ Codex สำหรับควบคุมเดสก์ท็อปภายในเครื่อง OpenClaw
ไม่ได้รวมแอปเดสก์ท็อปไว้ในผลิตภัณฑ์ ไม่ได้ดำเนินการบนเดสก์ท็อปด้วยตนเอง และไม่ได้หลีกเลี่ยง
สิทธิ์ของ Codex Plugin `codex` ที่รวมมาด้วยมีหน้าที่เพียงเตรียม Codex app-server:
โดยเปิดใช้การรองรับ Plugin ของ Codex ค้นหาหรือติดตั้ง Plugin Computer Use
ที่กำหนดค่าไว้ ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use` พร้อมใช้งาน จากนั้นให้
Codex เป็นผู้จัดการการเรียกใช้เครื่องมือ MCP แบบเนทีฟระหว่างรอบการทำงานในโหมด Codex

ใช้หน้านี้เมื่อ OpenClaw ใช้ชุดควบคุม Codex แบบเนทีฟอยู่แล้ว สำหรับ
การตั้งค่ารันไทม์ โปรดดู [ชุดควบคุม Codex](/th/plugins/codex-harness)

สิ่งนี้แตกต่างจาก [เครื่องมือคอมพิวเตอร์ที่ทำงานผ่าน Node](/th/nodes/computer-use) ซึ่งมีอยู่ใน OpenClaw ใช้เครื่องมือในตัวเมื่อสัญญาของเอเจนต์เดียวกันควรควบคุม Mac ที่จับคู่ไว้ ไม่ว่าเอเจนต์จะทำงานบน Gateway หรือ Node อื่น ใช้ Codex Computer Use เมื่อ Codex app-server ควรเป็นผู้จัดการการติดตั้ง MCP ภายในเครื่อง สิทธิ์ และการเรียกใช้เครื่องมือแบบเนทีฟ

## OpenClaw.app และ Peekaboo

การผสานรวม Peekaboo ของ OpenClaw.app แยกจาก Codex Computer Use
แอป macOS สามารถโฮสต์ซ็อกเก็ต PeekabooBridge เพื่อให้ CLI `peekaboo` ใช้สิทธิ์
Accessibility และ Screen Recording ภายในเครื่องของแอปซ้ำสำหรับเครื่องมือ
อัตโนมัติของ Peekaboo เอง บริดจ์ดังกล่าวไม่ได้ติดตั้งหรือทำหน้าที่เป็นพร็อกซีให้ Codex Computer Use และ
Codex Computer Use ไม่ได้เรียกผ่านซ็อกเก็ต PeekabooBridge

ใช้ [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo) เมื่อต้องการให้ OpenClaw.app เป็น
โฮสต์ที่รับรู้สิทธิ์สำหรับระบบอัตโนมัติของ Peekaboo CLI ใช้หน้านี้เมื่อ
เอเจนต์ OpenClaw ในโหมด Codex ควรมี Plugin MCP `computer-use` แบบเนทีฟของ Codex
พร้อมใช้งานก่อนเริ่มรอบการทำงาน

## แอป iOS

แอป iOS แยกจาก Codex Computer Use โดยไม่ได้ติดตั้งหรือทำหน้าที่เป็นพร็อกซีให้
เซิร์ฟเวอร์ MCP `computer-use` ของ Codex และไม่ได้เป็นแบ็กเอนด์สำหรับควบคุมเดสก์ท็อป
แต่แอป iOS จะเชื่อมต่อในฐานะ Node ของ OpenClaw และเปิดให้ใช้ความสามารถบนอุปกรณ์เคลื่อนที่
ผ่านคำสั่ง Node เช่น `canvas.*`, `camera.*`, `screen.*`,
`location.*` และ `talk.*`

ใช้ [iOS](/th/platforms/ios) เมื่อต้องการให้เอเจนต์ควบคุม Node ของ iPhone
ผ่าน Gateway ใช้หน้านี้เมื่อเอเจนต์ในโหมด Codex ควรควบคุม
เดสก์ท็อป macOS ภายในเครื่องผ่าน Plugin Computer Use แบบเนทีฟของ Codex

## MCP cua-driver โดยตรง

Codex Computer Use ไม่ใช่วิธีเดียวในการเปิดให้ควบคุมเดสก์ท็อป หากต้องการให้
รันไทม์ที่ OpenClaw จัดการเรียกไดรเวอร์ของ TryCua โดยตรง ให้ใช้เซิร์ฟเวอร์ต้นทาง
`cua-driver mcp` ผ่านรีจิสทรี MCP ของ OpenClaw แทนขั้นตอนผ่านมาร์เก็ตเพลส
ที่เฉพาะเจาะจงกับ Codex

หลังจากติดตั้ง `cua-driver` แล้ว ให้ขอคำสั่ง OpenClaw จากโปรแกรมดังกล่าว:

```bash
cua-driver mcp-config --client openclaw
```

หรือลงทะเบียนเซิร์ฟเวอร์ stdio โดยตรง:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

เส้นทางนี้จะคงพื้นผิวเครื่องมือ MCP ต้นทางไว้ครบถ้วน รวมถึงสคีมาของไดรเวอร์
และการตอบกลับ MCP แบบมีโครงสร้าง ใช้เมื่อต้องการให้ไดรเวอร์ CUA
พร้อมใช้งานเป็นเซิร์ฟเวอร์ MCP ปกติของ OpenClaw ใช้การตั้งค่า Codex Computer Use ใน
หน้านี้เมื่อ Codex app-server ควรเป็นผู้จัดการการติดตั้ง Plugin การโหลดเซิร์ฟเวอร์ MCP ใหม่
และการเรียกใช้เครื่องมือแบบเนทีฟภายในรอบการทำงานในโหมด Codex

ไดรเวอร์ของ CUA มีบิลด์ก่อนเผยแพร่สำหรับ macOS, Windows (x64 และ ARM64) และ
Linux (x64 และ ARM64 ระดับพรีวิว) โดยยังคงต้องใช้สิทธิ์ของระบบปฏิบัติการภายในเครื่อง
ตามที่แอปร้องขอ เช่น Accessibility และ Screen Recording บน
macOS OpenClaw ไม่ได้ติดตั้ง `cua-driver` ไม่ได้ให้สิทธิ์ดังกล่าว และไม่ได้
หลีกเลี่ยงโมเดลความปลอดภัยของไดรเวอร์ต้นทาง

## การตั้งค่าด่วน

ตั้งค่า `plugins.entries.codex.config.computerUse` เมื่อรอบการทำงานในโหมด Codex ต้องมี
Computer Use พร้อมใช้งานก่อนเริ่มเธรด `autoInstall: true` จะเลือกใช้
Computer Use และอนุญาตให้ OpenClaw ติดตั้งหรือเปิดใช้อีกครั้งก่อนเริ่มรอบการทำงาน:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

ด้วยการกำหนดค่านี้ OpenClaw จะตรวจสอบ Codex app-server ก่อนแต่ละ
รอบการทำงานในโหมด Codex หากไม่มี Computer Use แต่ Codex app-server ค้นพบ
มาร์เก็ตเพลสที่ติดตั้งได้แล้ว OpenClaw จะขอให้ Codex app-server ติดตั้งหรือ
เปิดใช้ Plugin อีกครั้งและโหลดเซิร์ฟเวอร์ MCP ใหม่ บน macOS เมื่อยังไม่ได้ลงทะเบียน
มาร์เก็ตเพลสที่ตรงกันและมีชุดแอปเดสก์ท็อปมาตรฐานอยู่ OpenClaw
จะพยายามลงทะเบียนมาร์เก็ตเพลส Codex ที่รวมมากับ
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` โดยยังคงใช้
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` เป็นตัวเลือกสำรอง
สำหรับการติดตั้งแบบสแตนด์อโลนรุ่นเก่า หากการตั้งค่ายังไม่สามารถทำให้
เซิร์ฟเวอร์ MCP พร้อมใช้งานได้ รอบการทำงานจะล้มเหลวก่อนเริ่มเธรด

หลังจากเปลี่ยนการกำหนดค่า Computer Use ให้ใช้ `/new` หรือ `/reset` ในแชต
ที่ได้รับผลกระทบก่อนทดสอบ หากเธรด Codex ที่มีอยู่เริ่มทำงานไปแล้ว

บน macOS การเริ่มต้นที่มีการจัดการสำหรับ Computer Use จะเลือกไบนารีของแอปเดสก์ท็อปที่
`/Applications/ChatGPT.app/Contents/Resources/codex` ก่อน จากนั้นจึง
ใช้ `/Applications/Codex.app/Contents/Resources/codex` เป็นตัวเลือกสำรองสำหรับ
การติดตั้งแบบสแตนด์อโลนรุ่นเก่า หลักการนี้ใช้กับคำสั่งสถานะและ
ติดตั้ง Computer Use แบบครั้งเดียวที่เริ่มไคลเอนต์ของตัวเองด้วย ซึ่งช่วยให้การควบคุมเดสก์ท็อปอยู่ภายใต้
ชุดแอปที่เป็นเจ้าของสิทธิ์ macOS ภายในเครื่อง หากไม่ได้ติดตั้งแอปเดสก์ท็อป
OpenClaw จะใช้ไบนารี Codex ที่มีการจัดการซึ่งติดตั้งไว้ข้าง
Plugin เป็นตัวเลือกสำรอง รอบการทำงาน Codex ที่มีการจัดการตามปกติซึ่งใช้โฮมเอเจนต์แบบแยกตามค่าเริ่มต้นจะเลือก
แพ็กเกจที่ตรึงเวอร์ชันนั้นก่อน เพื่อไม่ให้แอปเดสก์ท็อปรุ่นเก่าบดบังการรองรับโมเดล
ปัจจุบัน โฮมในขอบเขตผู้ใช้ยังคงเลือกเดสก์ท็อปก่อน เพราะสามารถโหลดสถานะ
Computer Use แบบเนทีฟได้ โฮมเอเจนต์แบบแยกซึ่งการกำหนดค่า Codex ที่มีผลเปิดใช้
Computer Use จะยังคงเลือกเดสก์ท็อปก่อนเช่นกัน การกำหนดค่า
`appServer.command` หรือ `OPENCLAW_CODEX_APP_SERVER_BIN` แบบชัดเจนยังคงแทนที่
การเลือกที่มีการจัดการนี้

OpenClaw จะทำให้การอ่านการกำหนดค่า Codex แบบเนทีฟและการติดตั้ง Computer Use
ภายใน Gateway ที่กำลังทำงานหนึ่งรายการเกิดขึ้นตามลำดับ โพรเซส Codex แยกต่างหากหรือ Gateway อื่น
ไม่ได้อยู่ภายในขอบเขตการควบคุมดังกล่าว หลังจากเปลี่ยนการกำหนดค่า Plugin Codex แบบเนทีฟภายนอก
Gateway ให้เริ่ม Gateway ใหม่และเริ่มแชตใหม่ก่อนใช้
การเลือกใหม่

## คำสั่ง

ใช้คำสั่ง `/codex computer-use` จากพื้นผิวแชตใดก็ได้ที่มี
พื้นผิวคำสั่ง Plugin `codex` พร้อมใช้งาน คำสั่งเหล่านี้เป็นคำสั่งแชต/รันไทม์
ของ OpenClaw ไม่ใช่คำสั่งย่อย CLI ของ `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` เป็นการดำเนินการเริ่มต้นและเป็นแบบอ่านอย่างเดียว โดยจะไม่เพิ่มแหล่ง
มาร์เก็ตเพลส ติดตั้ง Plugin หรือเปิดใช้การรองรับ Plugin ของ Codex หากไม่มีการกำหนดค่าใดเลือกใช้
Computer Use `status` อาจรายงานว่าปิดใช้งานอยู่แม้หลังจากใช้คำสั่งติดตั้ง
แบบครั้งเดียวแล้ว

`install` จะเปิดใช้การรองรับ Plugin ของ Codex app-server เพิ่ม
แหล่งมาร์เก็ตเพลสที่กำหนดค่าไว้หากระบุ ติดตั้งหรือเปิดใช้ Plugin ที่กำหนดค่าไว้อีกครั้ง
ผ่าน Codex app-server โหลดเซิร์ฟเวอร์ MCP ใหม่ และตรวจสอบว่าเซิร์ฟเวอร์ MCP
เปิดให้ใช้เครื่องมือ เนื่องจากการติดตั้งเปลี่ยนแปลงทรัพยากรโฮสต์ที่เชื่อถือได้
เฉพาะเจ้าของหรือไคลเอนต์ Gateway `operator.admin` เท่านั้นที่สามารถเรียกใช้ `install` ได้ ผู้ส่งอื่น
ที่ได้รับอนุญาตยังคงสามารถใช้คำสั่ง `status` แบบอ่านอย่างเดียวได้
รวมถึงเมื่อระบุค่าที่แทนที่

รุ่นเก่ารองรับการแทนที่ข้อมูลประจำตัวแบบครั้งเดียวผ่าน `--plugin`, `--server` และ `--mcp-server`
ให้กำหนดค่า `computerUse.pluginName` และ
`computerUse.mcpServerName` แบบถาวรแทน เมื่อใช้แฟล็กข้อมูลประจำตัวรุ่นเก่า
คำสั่งจะระบุการตั้งค่าที่ต้องบันทึกอย่างแน่นอน และแสดงการดำเนินการที่ร้องขอ
พร้อมแฟล็กมาร์เก็ตเพลสที่รองรับซ้ำในคำแนะนำการย้ายข้อมูล

## ตัวเลือกมาร์เก็ตเพลส

OpenClaw ใช้ API ของ app-server เดียวกับที่ Codex เปิดให้ใช้
ฟิลด์มาร์เก็ตเพลสใช้เลือกตำแหน่งที่ Codex ควรค้นหา `computer-use`

| ฟิลด์                | ใช้เมื่อ                                                        | การรองรับการติดตั้ง                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| ไม่มีฟิลด์มาร์เก็ตเพลส | ต้องการให้ Codex app-server ใช้มาร์เก็ตเพลสที่รู้จักอยู่แล้ว | ได้ เมื่อ app-server ส่งคืนมาร์เก็ตเพลสภายในเครื่อง        |
| `marketplaceSource`  | มีแหล่งมาร์เก็ตเพลส Codex ที่ app-server สามารถเพิ่มได้         | ได้ สำหรับ `/codex computer-use install` ที่ระบุอย่างชัดเจน         |
| `marketplacePath`    | ทราบพาธไฟล์มาร์เก็ตเพลสภายในเครื่องบนโฮสต์อยู่แล้ว   | ได้ สำหรับการติดตั้งที่ระบุอย่างชัดเจนและการติดตั้งอัตโนมัติเมื่อเริ่มรอบการทำงาน   |
| `marketplaceName`    | ต้องการเลือกมาร์เก็ตเพลสที่ลงทะเบียนไว้แล้วหนึ่งรายการตามชื่อ  | ได้เฉพาะเมื่อมาร์เก็ตเพลสที่เลือกมีพาธภายในเครื่อง |

โฮม Codex ใหม่อาจต้องใช้เวลาสักครู่เพื่อเตรียมมาร์เก็ตเพลส
อย่างเป็นทางการ ระหว่างการติดตั้ง OpenClaw จะสำรวจ `plugin/list` เป็นเวลาสูงสุด
`marketplaceDiscoveryTimeoutMs` มิลลิวินาที (ค่าเริ่มต้น 60 วินาที)

หากมาร์เก็ตเพลสที่รู้จักหลายรายการมี Computer Use อยู่ OpenClaw จะเลือก
`openai-bundled` ก่อน ตามด้วย `openai-curated` และ `local` รายการที่ตรงกัน
แต่ไม่รู้จักและมีความกำกวมจะถูกปฏิเสธเพื่อความปลอดภัย พร้อมขอให้ตั้งค่า `marketplaceName` หรือ
`marketplacePath`

## มาร์เก็ตเพลส macOS ที่รวมมาด้วย

บิลด์เดสก์ท็อป ChatGPT ปัจจุบันรวม Computer Use ไว้ที่นี่ ส่วนบิลด์เดสก์ท็อป
Codex แบบสแตนด์อโลนรุ่นเก่าใช้โครงสร้างเดียวกันภายใต้ `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

เมื่อ `computerUse.autoInstall` เป็น true และยังไม่ได้ลงทะเบียนมาร์เก็ตเพลสที่มี
`computer-use` OpenClaw จะพยายามเพิ่มรูทมาร์เก็ตเพลส
มาตรฐานที่รวมมาด้วยรายการแรกที่มีอยู่:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

สามารถลงทะเบียนอย่างชัดเจนจากเชลล์ด้วย Codex ได้เช่นกัน:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

หากใช้พาธแอป Codex ที่ไม่เป็นมาตรฐาน ให้เรียกใช้ `/codex computer-use install
--source <marketplace-root>` หนึ่งครั้ง หรือตั้งค่า `computerUse.marketplacePath` เป็น
พาธไฟล์มาร์เก็ตเพลสภายในเครื่อง ใช้ `--marketplace-path` เฉพาะเมื่อมี
พาธไฟล์ JSON ของมาร์เก็ตเพลส ไม่ใช่รูทมาร์เก็ตเพลสที่รวมมาด้วย

### แคช Plugin ที่ใช้ร่วมกัน

ค่าเริ่มต้น `pluginCacheMode: "independent"` จะปล่อยให้แต่ละโฮม Codex และ
แคช Plugin ของโฮมนั้นไม่มีการจัดการ ตั้งค่า `pluginCacheMode: "shared"` เพื่อคัดลอก
Plugin Computer Use ที่รวมมาด้วยไปยังแคช Plugin ที่โฮม Codex ที่ใช้งานอยู่ค้นพบได้
ก่อนเริ่ม app-server โหมดใช้ร่วมกันจะเก็บเวอร์ชันเก่าที่แคชไว้ เพราะ
ไคลเอนต์ Codex ที่กำลังทำงานอาจยังอ้างอิงไดเรกทอรี Plugin ที่มีเวอร์ชันกำกับอยู่
หากการคัดลอกเพื่อแทนที่ล้มเหลว ระบบจะยังคงเก็บแคชที่ใช้งานอยู่ไว้ด้วย การกำหนดค่า
`marketplaceName` หรือ `marketplacePath` แบบชัดเจนจะปิดใช้
การปรับให้สอดคล้องนี้ เพื่อไม่ให้ OpenClaw แทนที่การเลือกดังกล่าว

## ข้อจำกัดของแค็ตตาล็อกระยะไกล

Codex app-server สามารถแสดงรายการและอ่านรายการแค็ตตาล็อกที่อยู่ระยะไกลเท่านั้นได้ แต่
ปัจจุบันยังไม่รองรับ `plugin/install` ระยะไกล ซึ่งหมายความว่า `marketplaceName`
สามารถเลือกมาร์เก็ตเพลสที่อยู่ระยะไกลเท่านั้นสำหรับการตรวจสอบสถานะได้ แต่การติดตั้งและ
การเปิดใช้อีกครั้งยังต้องใช้มาร์เก็ตเพลสภายในเครื่องผ่าน `marketplaceSource` หรือ
`marketplacePath`

หากสถานะแจ้งว่า Plugin พร้อมใช้งานในมาร์เก็ตเพลส Codex ระยะไกล แต่
ไม่รองรับการติดตั้งระยะไกล ให้เรียกใช้คำสั่งติดตั้งพร้อมแหล่งหรือพาธภายในเครื่อง:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## ข้อมูลอ้างอิงการกำหนดค่า

| ฟิลด์                           | ค่าเริ่มต้น        | ความหมาย                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | อนุมาน       | กำหนดให้ต้องใช้ Computer Use ค่าเริ่มต้นเป็น true เมื่อมีการตั้งค่าฟิลด์ Computer Use อื่น |
| `autoInstall`                   | false          | ติดตั้งหรือเปิดใช้งานอีกครั้งจาก marketplace ที่ค้นพบแล้วเมื่อเริ่มต้นรอบการทำงาน       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | ระยะเวลาที่การติดตั้งรอให้ Codex app-server ค้นพบ marketplace             |
| `liveTestTimeoutMs`             | 60000          | หมดเวลาสำหรับเธรดตรวจสอบความพร้อมชั่วคราวและคำขอล้างข้อมูลของเธรดนั้น           |
| `toolCallTimeoutMs`             | 60000          | หมดเวลาสำหรับการเรียกเครื่องมือตรวจสอบความพร้อม `list_apps` ของ Computer Use                  |
| `healthCheckEnabled`            | false          | เรียกโพรบตรวจสอบความพร้อมเป็นระยะขณะที่ไคลเอนต์ app-server เจ้าของยังทำงานอยู่    |
| `healthCheckIntervalMinutes`    | 60             | ความถี่ของโพรบ ค่าที่ยอมรับคือ 30, 60, 120 หรือ 240 นาที                |
| `pluginCacheMode`               | `independent`  | ใช้ `shared` เพื่อรีเฟรชแคช Codex-home จาก Plugin เดสก์ท็อปที่รวมมาให้  |
| `strictReadiness`               | false          | หยุดการเริ่มต้นเมื่อโพรบแบบสดล้มเหลว แทนที่จะดำเนินการต่อพร้อมคำเตือน      |
| `autoRepair`                    | false          | ยุติโพรเซสลูก MCP ของ Computer Use ที่อยู่ในขอบเขตและค้างอยู่ แล้วลองโพรบที่ล้มเหลวอีกครั้งหนึ่ง     |
| `marketplaceSource`             | ไม่ได้ตั้งค่า          | สตริงแหล่งที่ส่งไปยัง `marketplace/add` ของ Codex app-server                    |
| `marketplacePath`               | ไม่ได้ตั้งค่า          | พาธไฟล์ marketplace ของ Codex ในเครื่องที่มี Plugin อยู่                       |
| `marketplaceName`               | ไม่ได้ตั้งค่า          | ชื่อ marketplace ของ Codex ที่ลงทะเบียนไว้เพื่อเลือกใช้                                   |
| `pluginName`                    | `computer-use` | ชื่อ Plugin ใน marketplace ของ Codex                                                 |
| `mcpServerName`                 | `computer-use` | ชื่อเซิร์ฟเวอร์ MCP ที่ Plugin ซึ่งติดตั้งแล้วเปิดให้ใช้งาน                               |

การติดตั้งอัตโนมัติเมื่อเริ่มรอบการทำงานตั้งใจปฏิเสธค่า `marketplaceSource`
ที่กำหนดค่าไว้ การเพิ่มแหล่งใหม่เป็นการตั้งค่าที่ต้องดำเนินการอย่างชัดเจน ดังนั้นให้ใช้
`/codex computer-use install --source <marketplace-source>` หนึ่งครั้ง จากนั้นปล่อยให้
`autoInstall` จัดการการเปิดใช้งานอีกครั้งในอนาคตจาก marketplace ในเครื่องที่ค้นพบ
การติดตั้งอัตโนมัติเมื่อเริ่มรอบการทำงานสามารถใช้ `marketplacePath` ที่กำหนดค่าไว้ได้ เพราะค่านั้น
เป็นพาธภายในเครื่องบนโฮสต์อยู่แล้ว

แต่ละฟิลด์ยังรองรับการแทนค่าด้วยตัวแปรสภาพแวดล้อม ซึ่งจะตรวจสอบเมื่อ
ไม่ได้ตั้งค่าคีย์การกำหนดค่าที่ตรงกัน:

| ฟิลด์                           | ตัวแปรสภาพแวดล้อม                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## สิ่งที่ OpenClaw ตรวจสอบ

OpenClaw รายงานเหตุผลของการตั้งค่าที่คงที่ภายในระบบและจัดรูปแบบ
สถานะที่แสดงต่อผู้ใช้สำหรับแชต:

| เหตุผล                       | ความหมาย                                                | ขั้นตอนถัดไป                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` ถูกประเมินเป็น false               | ตั้งค่า `enabled` หรือฟิลด์ Computer Use อื่น  |
| `marketplace_missing`        | ไม่มี marketplace ที่ตรงกันให้ใช้งาน                 | กำหนดค่าแหล่ง พาธ หรือชื่อ marketplace  |
| `plugin_not_installed`       | มี marketplace อยู่ แต่ยังไม่ได้ติดตั้ง Plugin   | เรียกใช้การติดตั้งหรือเปิดใช้งาน `autoInstall`          |
| `plugin_disabled`            | ติดตั้ง Plugin แล้วแต่ปิดใช้งานอยู่ในการกำหนดค่า Codex      | เรียกใช้การติดตั้งเพื่อเปิดใช้งานอีกครั้ง                  |
| `remote_install_unsupported` | marketplace ที่เลือกเป็นแบบระยะไกลเท่านั้น                   | ใช้ `marketplaceSource` หรือ `marketplacePath` |
| `mcp_missing`                | เปิดใช้งาน Plugin แล้ว แต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน  | ตรวจสอบ Computer Use ของ Codex และสิทธิ์ของระบบปฏิบัติการ  |
| `ready`                      | Plugin และเครื่องมือ MCP พร้อมใช้งาน                    | เริ่มรอบการทำงานในโหมด Codex                    |
| `check_failed`               | คำขอ Codex app-server ล้มเหลวระหว่างการตรวจสอบสถานะ | ตรวจสอบการเชื่อมต่อ app-server และบันทึก       |
| `auto_install_blocked`       | การตั้งค่าเมื่อเริ่มรอบการทำงานจำเป็นต้องเพิ่มแหล่งใหม่       | เรียกใช้การติดตั้งอย่างชัดเจนก่อน                   |

ผลลัพธ์แชตประกอบด้วยสถานะ Plugin สถานะเซิร์ฟเวอร์ MCP, marketplace,
เครื่องมือเมื่อพร้อมใช้งาน และข้อความเฉพาะสำหรับขั้นตอนการตั้งค่าที่ล้มเหลว

## สิทธิ์ของ macOS

Computer Use ใช้ได้เฉพาะกับ macOS เซิร์ฟเวอร์ MCP ที่ Codex เป็นเจ้าของอาจต้องใช้
สิทธิ์ของระบบปฏิบัติการภายในเครื่องก่อนจึงจะตรวจสอบหรือควบคุมแอปได้ หาก OpenClaw ระบุว่าติดตั้ง Computer
Use แล้วแต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน ให้ตรวจสอบ
การตั้งค่า Computer Use ฝั่ง Codex ก่อน:

- Codex app-server กำลังทำงานบนโฮสต์เดียวกับที่ควรใช้ควบคุมเดสก์ท็อป
- เปิดใช้งาน Plugin Computer Use ในการกำหนดค่า Codex
- เซิร์ฟเวอร์ MCP `computer-use` ปรากฏในสถานะ MCP ของ Codex app-server
- macOS ได้ให้สิทธิ์ที่จำเป็นแก่แอปควบคุมเดสก์ท็อปแล้ว
- เซสชันปัจจุบันของโฮสต์สามารถเข้าถึงเดสก์ท็อปที่กำลังควบคุมได้

OpenClaw ตั้งใจหยุดการทำงานเมื่อ `computerUse.enabled` เป็น true รอบการทำงาน
ในโหมด Codex ไม่ควรดำเนินการต่อโดยไม่มีการแจ้งเตือน หากไม่มีเครื่องมือเดสก์ท็อปแบบเนทีฟ
ที่การกำหนดค่าระบุว่าต้องใช้

## การแก้ไขปัญหา

**สถานะระบุว่ายังไม่ได้ติดตั้ง** เรียกใช้ `/codex computer-use install` หาก
ไม่พบ marketplace ให้ส่ง `--source` หรือ `--marketplace-path`

**สถานะระบุว่าติดตั้งแล้วแต่ปิดใช้งานอยู่** เรียกใช้ `/codex computer-use install`
อีกครั้ง การติดตั้งผ่าน Codex app-server จะเขียนการกำหนดค่า Plugin กลับเป็นเปิดใช้งาน

**สถานะระบุว่าไม่รองรับการติดตั้งระยะไกล** ใช้แหล่งหรือพาธของ marketplace
ในเครื่อง รายการแค็ตตาล็อกแบบระยะไกลเท่านั้นสามารถตรวจสอบได้ แต่ไม่สามารถ
ติดตั้งผ่าน API ของ app-server ปัจจุบัน

**สถานะระบุว่าเซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน** เรียกใช้การติดตั้งอีกครั้งหนึ่งเพื่อให้เซิร์ฟเวอร์ MCP
โหลดใหม่ หากยังคงไม่พร้อมใช้งาน ให้แก้ไขแอป Computer Use ของ Codex,
สถานะ MCP ของ Codex app-server หรือสิทธิ์ของ macOS

**สถานะหรือโพรบหมดเวลาที่ `computer-use.list_apps`** มี Plugin และ
เซิร์ฟเวอร์ MCP อยู่ แต่บริดจ์ Computer Use ในเครื่องไม่ตอบสนอง
ปิดหรือรีสตาร์ต Codex Computer Use เปิด Codex Desktop ใหม่หากจำเป็น จากนั้น
ลองอีกครั้งในเซสชัน OpenClaw ใหม่ หากก่อนหน้านี้โฮสต์เรียกใช้ Computer Use
ผ่าน Codex app-server รุ่นเก่าที่มีการจัดการ ให้รีเฟรช Plugin ที่ติดตั้งจาก
marketplace ที่รวมมากับเดสก์ท็อป (ใช้พาธ `Codex.app` สำหรับการติดตั้ง
Codex desktop แบบสแตนด์อโลน):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**เครื่องมือ Computer Use แสดง `Native hook relay unavailable`** ฮุกเครื่องมือ
แบบเนทีฟของ Codex ไม่สามารถเข้าถึงรีเลย์ OpenClaw ที่ทำงานอยู่ผ่าน
บริดจ์ในเครื่องหรือ Gateway สำรองได้ เริ่มเซสชัน OpenClaw ใหม่ด้วย `/new`
หรือ `/reset` หากทำงานได้หนึ่งครั้งแล้วล้มเหลวอีกในการเรียกเครื่องมือครั้งถัดไป
`/new` จะล้างเฉพาะความพยายามปัจจุบันเท่านั้น ให้รีสตาร์ต Codex app-server หรือ
OpenClaw Gateway เพื่อให้เธรดเก่าและการลงทะเบียนฮุกถูกลบออก จากนั้น
ลองอีกครั้งในเซสชันใหม่

**การติดตั้งอัตโนมัติเมื่อเริ่มรอบการทำงานปฏิเสธแหล่ง** นี่เป็นพฤติกรรมที่ตั้งใจไว้ ให้เพิ่ม
แหล่งด้วย `/codex computer-use install --source
<marketplace-source>` อย่างชัดเจนก่อน จากนั้นการติดตั้งอัตโนมัติเมื่อเริ่มรอบการทำงานในอนาคตจึงจะใช้
marketplace ในเครื่องที่ค้นพบได้

## ที่เกี่ยวข้อง

- [ชุดควบคุม Codex](/th/plugins/codex-harness)
- [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo)
- [แอป iOS](/th/platforms/ios)
