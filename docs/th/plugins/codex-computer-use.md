---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ Codex Computer Use
    - คุณกำลังตัดสินใจเลือกระหว่าง Codex Computer Use, PeekabooBridge และ MCP แบบ cua-driver โดยตรง
    - คุณกำลังกำหนดค่า computerUse สำหรับ Plugin Codex ที่รวมมาให้
    - คุณกำลังแก้ไขปัญหาสถานะหรือการติดตั้งการใช้งานคอมพิวเตอร์ของ /codex
summary: ตั้งค่าการใช้งานคอมพิวเตอร์ของ Codex สำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: การใช้งานคอมพิวเตอร์ด้วย Codex
x-i18n:
    generated_at: "2026-07-12T16:22:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use เป็น Plugin MCP แบบเนทีฟสำหรับ Codex เพื่อควบคุมเดสก์ท็อปภายในเครื่อง OpenClaw
ไม่ได้รวมแอปเดสก์ท็อปไว้ในตัว ไม่ได้ดำเนินการบนเดสก์ท็อปด้วยตัวเอง และไม่ข้าม
สิทธิ์ของ Codex Plugin `codex` ที่มาพร้อมระบบมีหน้าที่เพียงเตรียม Codex app-server:
เปิดใช้การรองรับ Plugin ของ Codex ค้นหาหรือติดตั้ง Plugin Computer Use
ที่กำหนดค่าไว้ ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use` พร้อมใช้งาน แล้วปล่อยให้
Codex เป็นผู้จัดการการเรียกใช้เครื่องมือ MCP แบบเนทีฟระหว่างรอบการทำงานในโหมด Codex

ใช้หน้านี้เมื่อ OpenClaw ใช้ชุดควบคุม Codex แบบเนทีฟอยู่แล้ว สำหรับการตั้งค่า
รันไทม์ โปรดดู [ชุดควบคุม Codex](/th/plugins/codex-harness)

สิ่งนี้แตกต่างจาก [เครื่องมือคอมพิวเตอร์ที่ทำงานผ่าน Node](/th/nodes/computer-use) ซึ่งมีอยู่ใน OpenClaw ใช้เครื่องมือในตัวเมื่อคุณต้องการให้สัญญาเอเจนต์เดียวกันควบคุม Mac ที่จับคู่ไว้ ไม่ว่าเอเจนต์จะทำงานบน Gateway หรือ Node อื่น ใช้ Codex Computer Use เมื่อคุณต้องการให้ Codex app-server เป็นผู้จัดการการติดตั้ง MCP ภายในเครื่อง สิทธิ์ และการเรียกใช้เครื่องมือแบบเนทีฟ

## OpenClaw.app และ Peekaboo

การผสานรวม Peekaboo ของ OpenClaw.app แยกจาก Codex Computer Use
แอป macOS สามารถโฮสต์ซ็อกเก็ต PeekabooBridge เพื่อให้ CLI `peekaboo` ใช้สิทธิ์
Accessibility และ Screen Recording ภายในเครื่องของแอปซ้ำได้ สำหรับเครื่องมือ
ระบบอัตโนมัติของ Peekaboo เอง บริดจ์ดังกล่าวไม่ได้ติดตั้งหรือพร็อกซี Codex Computer Use และ
Codex Computer Use ไม่ได้เรียกผ่านซ็อกเก็ต PeekabooBridge

ใช้ [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo) เมื่อคุณต้องการให้ OpenClaw.app เป็น
โฮสต์ที่รับรู้สิทธิ์สำหรับระบบอัตโนมัติของ CLI Peekaboo ใช้หน้านี้เมื่อ
เอเจนต์ OpenClaw ในโหมด Codex ควรมี Plugin MCP `computer-use` แบบเนทีฟของ Codex
พร้อมใช้งานก่อนเริ่มรอบการทำงาน

## แอป iOS

แอป iOS แยกจาก Codex Computer Use แอปไม่ได้ติดตั้งหรือพร็อกซี
เซิร์ฟเวอร์ MCP `computer-use` ของ Codex และไม่ได้เป็นแบ็กเอนด์สำหรับควบคุมเดสก์ท็อป
แต่แอป iOS จะเชื่อมต่อเป็น Node ของ OpenClaw และเปิดเผยความสามารถบนอุปกรณ์เคลื่อนที่
ผ่านคำสั่งของ Node เช่น `canvas.*`, `camera.*`, `screen.*`,
`location.*` และ `talk.*`

ใช้ [iOS](/th/platforms/ios) เมื่อคุณต้องการให้เอเจนต์ควบคุม Node ของ iPhone
ผ่าน Gateway ใช้หน้านี้เมื่อเอเจนต์ในโหมด Codex ควรควบคุม
เดสก์ท็อป macOS ภายในเครื่องผ่าน Plugin Computer Use แบบเนทีฟของ Codex

## MCP cua-driver โดยตรง

Codex Computer Use ไม่ใช่วิธีเดียวในการเปิดให้ควบคุมเดสก์ท็อป หากคุณต้องการให้
รันไทม์ที่ OpenClaw จัดการเรียกใช้ไดรเวอร์ของ TryCua โดยตรง ให้ใช้เซิร์ฟเวอร์
`cua-driver mcp` ต้นทางผ่านรีจิสทรี MCP ของ OpenClaw แทนโฟลว์มาร์เก็ตเพลส
เฉพาะ Codex

หลังจากติดตั้ง `cua-driver` แล้ว ให้ขอคำสั่ง OpenClaw จากเครื่องมือนั้น:

```bash
cua-driver mcp-config --client openclaw
```

หรือลงทะเบียนเซิร์ฟเวอร์ stdio โดยตรง:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

เส้นทางนี้จะคงพื้นผิวเครื่องมือ MCP ต้นทางไว้ครบถ้วน รวมถึงสคีมาของไดรเวอร์
และการตอบกลับ MCP แบบมีโครงสร้าง ใช้เมื่อคุณต้องการให้ไดรเวอร์ CUA
พร้อมใช้งานในฐานะเซิร์ฟเวอร์ MCP ปกติของ OpenClaw ใช้การตั้งค่า Codex Computer Use ใน
หน้านี้เมื่อคุณต้องการให้ Codex app-server เป็นผู้จัดการการติดตั้ง Plugin การโหลด MCP ใหม่
และการเรียกใช้เครื่องมือแบบเนทีฟภายในรอบการทำงานในโหมด Codex

ไดรเวอร์ของ CUA ใช้ได้เฉพาะกับ macOS และยังคงต้องใช้สิทธิ์ macOS ภายในเครื่อง
ตามที่แอปแจ้งขอ เช่น Accessibility และ Screen Recording OpenClaw ไม่ได้
ติดตั้ง `cua-driver` มอบสิทธิ์เหล่านั้น หรือข้าม
โมเดลความปลอดภัยของไดรเวอร์ต้นทาง

## การตั้งค่าอย่างรวดเร็ว

กำหนด `plugins.entries.codex.config.computerUse` เมื่อรอบการทำงานในโหมด Codex ต้องมี
Computer Use พร้อมใช้งานก่อนเริ่มเธรด `autoInstall: true` จะเลือกเปิดใช้
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

เมื่อใช้การกำหนดค่านี้ OpenClaw จะตรวจสอบ Codex app-server ก่อนแต่ละ
รอบการทำงานในโหมด Codex หากไม่มี Computer Use แต่ Codex app-server ได้ค้นพบ
มาร์เก็ตเพลสที่ติดตั้งได้แล้ว OpenClaw จะขอให้ Codex app-server ติดตั้งหรือ
เปิดใช้ Plugin อีกครั้ง และโหลดเซิร์ฟเวอร์ MCP ใหม่ บน macOS เมื่อไม่มี
มาร์เก็ตเพลสที่ตรงกันลงทะเบียนไว้และมีชุดแอปเดสก์ท็อปมาตรฐานอยู่ OpenClaw
จะพยายามลงทะเบียนมาร์เก็ตเพลส Codex ที่รวมมากับแอปจาก
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` โดยยังคงใช้
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` เป็น
ทางเลือกสำรองสำหรับการติดตั้งแบบแยกเดี่ยวรุ่นเก่า หากการตั้งค่ายังคงไม่สามารถทำให้
เซิร์ฟเวอร์ MCP พร้อมใช้งานได้ รอบการทำงานจะล้มเหลวก่อนเริ่มเธรด

หลังจากเปลี่ยนการกำหนดค่า Computer Use ให้ใช้ `/new` หรือ `/reset` ใน
แชตที่ได้รับผลกระทบก่อนทดสอบ หากเธรด Codex ที่มีอยู่เริ่มทำงานไปแล้ว

บน macOS การเริ่มทำงานที่มีการจัดการสำหรับ Computer Use จะเลือกใช้ไบนารีของแอปเดสก์ท็อปที่
`/Applications/ChatGPT.app/Contents/Resources/codex` ก่อน จากนั้นจึง
ใช้ `/Applications/Codex.app/Contents/Resources/codex` เป็นทางเลือกสำรองสำหรับการติดตั้ง
แบบแยกเดี่ยวรุ่นเก่า หลักการนี้ยังใช้กับคำสั่งตรวจสอบสถานะและติดตั้ง Computer Use
แบบครั้งเดียวซึ่งเริ่มไคลเอนต์ของตัวเองด้วย วิธีนี้ทำให้การควบคุมเดสก์ท็อปยังอยู่ภายใต้
ชุดแอปที่ถือครองสิทธิ์ macOS ภายในเครื่อง หากไม่ได้ติดตั้งแอปเดสก์ท็อป
OpenClaw จะใช้ไบนารี Codex ที่มีการจัดการซึ่งติดตั้งอยู่ข้าง
Plugin เป็นทางเลือกสำรอง รอบการทำงาน Codex แบบมีการจัดการทั่วไปที่ใช้โฮมเอเจนต์แบบแยกตามค่าเริ่มต้นจะเลือก
แพ็กเกจที่ตรึงเวอร์ชันนั้นก่อน เพื่อป้องกันไม่ให้แอปเดสก์ท็อปรุ่นเก่าบดบังการรองรับโมเดล
ปัจจุบัน โฮมที่อยู่ในขอบเขตผู้ใช้ยังคงเลือกเดสก์ท็อปก่อน เพราะสามารถโหลดสถานะ
Computer Use แบบเนทีฟได้ โฮมเอเจนต์แบบแยกซึ่งการกำหนดค่า Codex ที่มีผลเปิดใช้
Computer Use จะยังคงเลือกเดสก์ท็อปก่อนเช่นกัน การกำหนดค่า
`appServer.command` อย่างชัดเจนหรือ `OPENCLAW_CODEX_APP_SERVER_BIN` ยังคงแทนที่
การเลือกแบบมีการจัดการนี้

OpenClaw จะจัดลำดับการอ่านการกำหนดค่า Codex แบบเนทีฟและการติดตั้ง Computer Use
ภายใน Gateway ที่กำลังทำงานหนึ่งอินสแตนซ์ กระบวนการ Codex แยกต่างหากหรือ Gateway อื่น
ไม่อยู่ภายใต้การกั้นดังกล่าว หลังจากเปลี่ยนการกำหนดค่า Plugin Codex แบบเนทีฟภายนอก
Gateway ให้เริ่ม Gateway ใหม่และเริ่มแชตใหม่ก่อนอาศัยการเลือกใหม่

## คำสั่ง

ใช้คำสั่ง `/codex computer-use` จากพื้นผิวแชตใดก็ตามที่มี
พื้นผิวคำสั่งของ Plugin `codex` พร้อมใช้งาน คำสั่งเหล่านี้เป็นคำสั่งแชต/รันไทม์
ของ OpenClaw ไม่ใช่คำสั่งย่อย CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` เป็นการดำเนินการเริ่มต้นและเป็นแบบอ่านอย่างเดียว: จะไม่เพิ่มแหล่ง
มาร์เก็ตเพลส ติดตั้ง Plugin หรือเปิดใช้การรองรับ Plugin ของ Codex หากไม่มีการกำหนดค่าใด
เลือกเปิดใช้ Computer Use `status` อาจรายงานว่าปิดใช้งานอยู่ แม้หลังจากใช้คำสั่ง
ติดตั้งแบบครั้งเดียวแล้ว

`install` จะเปิดใช้การรองรับ Plugin ของ Codex app-server เพิ่ม
แหล่งมาร์เก็ตเพลสที่กำหนดค่าไว้หากระบุ ติดตั้งหรือเปิดใช้ Plugin ที่กำหนดค่าไว้
อีกครั้งผ่าน Codex app-server โหลดเซิร์ฟเวอร์ MCP ใหม่ และตรวจสอบว่าเซิร์ฟเวอร์ MCP
เปิดเผยเครื่องมือ เนื่องจากการติดตั้งเปลี่ยนแปลงทรัพยากรของโฮสต์ที่เชื่อถือได้
มีเพียงเจ้าของหรือไคลเอนต์ Gateway ที่มีสิทธิ์ `operator.admin` เท่านั้นที่เรียกใช้ `install` ได้ ผู้ส่งอื่น
ที่ได้รับอนุญาตยังคงใช้คำสั่ง `status` แบบอ่านอย่างเดียวได้
รวมถึงใช้ร่วมกับค่าที่แทนที่

รุ่นเก่ารองรับค่าที่แทนที่ข้อมูลระบุตัวตนแบบครั้งเดียวผ่าน `--plugin`, `--server` และ `--mcp-server`
ให้กำหนดค่า `computerUse.pluginName` และ
`computerUse.mcpServerName` แบบถาวรแทน เมื่อใช้แฟล็กข้อมูลระบุตัวตนรุ่นเก่า
คำสั่งจะระบุการตั้งค่าที่ต้องบันทึกอย่างชัดเจน และแสดงการดำเนินการที่ร้องขอพร้อม
แฟล็กมาร์เก็ตเพลสที่รองรับอีกครั้งในคำแนะนำการย้ายข้อมูล

## ตัวเลือกมาร์เก็ตเพลส

OpenClaw ใช้ API app-server เดียวกับที่ Codex เปิดเผย
ฟิลด์มาร์เก็ตเพลสใช้เลือกตำแหน่งที่ Codex ควรค้นหา `computer-use`

| ฟิลด์                 | ใช้เมื่อ                                                            | การรองรับการติดตั้ง                                           |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| ไม่มีฟิลด์มาร์เก็ตเพลส | คุณต้องการให้ Codex app-server ใช้มาร์เก็ตเพลสที่รู้จักอยู่แล้ว       | ได้ เมื่อ app-server ส่งคืนมาร์เก็ตเพลสภายในเครื่อง           |
| `marketplaceSource`  | คุณมีแหล่งมาร์เก็ตเพลส Codex ที่ app-server สามารถเพิ่มได้            | ได้ สำหรับ `/codex computer-use install` ที่ระบุอย่างชัดเจน    |
| `marketplacePath`    | คุณทราบเส้นทางไฟล์มาร์เก็ตเพลสภายในเครื่องบนโฮสต์อยู่แล้ว             | ได้ สำหรับการติดตั้งแบบระบุชัดเจนและการติดตั้งอัตโนมัติเมื่อเริ่มรอบการทำงาน |
| `marketplaceName`    | คุณต้องการเลือกมาร์เก็ตเพลสที่ลงทะเบียนไว้แล้วตามชื่อ                  | ได้เฉพาะเมื่อมาร์เก็ตเพลสที่เลือกมีเส้นทางภายในเครื่อง         |

โฮม Codex ใหม่อาจต้องใช้เวลาสักครู่เพื่อเติมข้อมูลมาร์เก็ตเพลส
อย่างเป็นทางการ ระหว่างการติดตั้ง OpenClaw จะสำรวจ `plugin/list` เป็นเวลาสูงสุด
`marketplaceDiscoveryTimeoutMs` มิลลิวินาที (ค่าเริ่มต้น 60 วินาที)

หากมีมาร์เก็ตเพลสที่รู้จักหลายแห่งซึ่งมี Computer Use OpenClaw จะเลือก
`openai-bundled` ก่อน ตามด้วย `openai-curated` และ `local` รายการที่ตรงกัน
ซึ่งไม่รู้จักและคลุมเครือจะล้มเหลวแบบปิด และขอให้คุณกำหนด `marketplaceName` หรือ
`marketplacePath`

## มาร์เก็ตเพลส macOS ที่รวมมากับแอป

บิลด์เดสก์ท็อป ChatGPT ปัจจุบันรวม Computer Use ไว้ที่นี่ ส่วนบิลด์เดสก์ท็อป
Codex แบบแยกเดี่ยวรุ่นเก่าใช้โครงสร้างเดียวกันภายใต้ `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

เมื่อ `computerUse.autoInstall` เป็น true และไม่มีมาร์เก็ตเพลสที่มี
`computer-use` ลงทะเบียนไว้ OpenClaw จะพยายามเพิ่มรากมาร์เก็ตเพลส
มาตรฐานที่รวมมากับแอปและมีอยู่เป็นรายการแรก:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

คุณยังสามารถลงทะเบียนอย่างชัดเจนจากเชลล์ด้วย Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

หากคุณใช้เส้นทางแอป Codex ที่ไม่เป็นมาตรฐาน ให้เรียกใช้ `/codex computer-use install
--source <marketplace-root>` หนึ่งครั้ง หรือตั้งค่า `computerUse.marketplacePath` เป็น
เส้นทางไฟล์มาร์เก็ตเพลสภายในเครื่อง ใช้ `--marketplace-path` เฉพาะเมื่อคุณมี
เส้นทางไฟล์ JSON ของมาร์เก็ตเพลส ไม่ใช่รากมาร์เก็ตเพลสที่รวมมากับแอป

### แคช Plugin ที่ใช้ร่วมกัน

ค่าเริ่มต้น `pluginCacheMode: "independent"` จะปล่อยให้โฮม Codex แต่ละโฮมและ
แคช Plugin ของโฮมนั้นไม่ได้รับการจัดการ ตั้งค่า `pluginCacheMode: "shared"` เพื่อคัดลอก
Plugin Computer Use ที่รวมมากับแอปไปยังแคช Plugin ที่ค้นพบได้ของโฮม Codex ที่ใช้งานอยู่
ก่อนเริ่ม app-server โหมดใช้ร่วมกันจะเก็บเวอร์ชันเก่าที่แคชไว้ เพราะ
ไคลเอนต์ Codex ที่กำลังทำงานอาจยังอ้างอิงไดเรกทอรี Plugin ที่แยกตามเวอร์ชันอยู่ และ
การคัดลอกเพื่อแทนที่ที่ล้มเหลวจะยังคงเก็บแคชที่ใช้งานอยู่ไว้ การกำหนดค่า
`marketplaceName` หรือ `marketplacePath` อย่างชัดเจนจะปิดการทำงานของกระบวนการปรับให้สอดคล้องนี้
เพื่อไม่ให้ OpenClaw แทนที่ตัวเลือกดังกล่าว

## ข้อจำกัดของแค็ตตาล็อกระยะไกล

Codex app-server สามารถแสดงรายการและอ่านรายการแค็ตตาล็อกที่อยู่ระยะไกลเท่านั้นได้ แต่ในปัจจุบัน
ยังไม่รองรับ `plugin/install` ระยะไกล ซึ่งหมายความว่า `marketplaceName`
สามารถเลือกมาร์เก็ตเพลสที่อยู่ระยะไกลเท่านั้นสำหรับการตรวจสอบสถานะได้ แต่การติดตั้งและ
การเปิดใช้อีกครั้งยังคงต้องใช้มาร์เก็ตเพลสภายในเครื่องผ่าน `marketplaceSource` หรือ
`marketplacePath`

หากสถานะระบุว่า Plugin พร้อมใช้งานในมาร์เก็ตเพลส Codex ระยะไกล แต่
ไม่รองรับการติดตั้งระยะไกล ให้เรียกใช้การติดตั้งโดยระบุแหล่งหรือเส้นทางภายในเครื่อง:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## ข้อมูลอ้างอิงการกำหนดค่า

| ฟิลด์                           | ค่าเริ่มต้น     | ความหมาย                                                                                         |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `enabled`                       | อนุมาน         | กำหนดให้ต้องใช้ Computer Use ค่าเริ่มต้นเป็น true เมื่อตั้งค่าฟิลด์ Computer Use อื่นไว้         |
| `autoInstall`                   | false          | ติดตั้งหรือเปิดใช้งานอีกครั้งจาก marketplace ที่ค้นพบแล้วเมื่อเริ่มต้นรอบการทำงาน                 |
| `marketplaceDiscoveryTimeoutMs` | 60000          | ระยะเวลาที่การติดตั้งรอให้ Codex app-server ค้นพบ marketplace                                    |
| `liveTestTimeoutMs`             | 60000          | ระยะหมดเวลาสำหรับเธรดตรวจสอบความพร้อมชั่วคราวและคำขอล้างข้อมูลของเธรดนั้น                         |
| `toolCallTimeoutMs`             | 60000          | ระยะหมดเวลาสำหรับการเรียกเครื่องมือตรวจสอบความพร้อม `list_apps` ของ Computer Use                  |
| `healthCheckEnabled`            | false          | เรียกใช้การตรวจสอบความพร้อมเป็นระยะขณะที่ไคลเอนต์ app-server เจ้าของยังทำงานอยู่                  |
| `healthCheckIntervalMinutes`    | 60             | ความถี่ในการตรวจสอบ ค่าที่ยอมรับคือ 30, 60, 120 หรือ 240 นาที                                    |
| `pluginCacheMode`               | `independent`  | ใช้ `shared` เพื่อรีเฟรชแคช Codex-home จาก Plugin เดสก์ท็อปที่รวมมาให้                            |
| `strictReadiness`               | false          | หยุดการเริ่มต้นเมื่อการตรวจสอบแบบสดล้มเหลว แทนที่จะดำเนินการต่อพร้อมคำเตือน                       |
| `autoRepair`                    | false          | ยุติโพรเซสลูก MCP ของ Computer Use ที่ค้างอยู่ภายในขอบเขต แล้วลองการตรวจสอบที่ล้มเหลวอีกหนึ่งครั้ง |
| `marketplaceSource`             | ไม่ได้ตั้งค่า  | สตริงแหล่งที่ส่งให้ `marketplace/add` ของ Codex app-server                                       |
| `marketplacePath`               | ไม่ได้ตั้งค่า  | พาธไฟล์ marketplace ของ Codex ภายในเครื่องที่มี Plugin อยู่                                      |
| `marketplaceName`               | ไม่ได้ตั้งค่า  | ชื่อ marketplace ของ Codex ที่ลงทะเบียนไว้เพื่อเลือกใช้งาน                                       |
| `pluginName`                    | `computer-use` | ชื่อ Plugin ใน marketplace ของ Codex                                                             |
| `mcpServerName`                 | `computer-use` | ชื่อเซิร์ฟเวอร์ MCP ที่ Plugin ซึ่งติดตั้งแล้วเปิดให้ใช้งาน                                       |

การติดตั้งอัตโนมัติเมื่อเริ่มต้นรอบการทำงานจงใจปฏิเสธค่า
`marketplaceSource` ที่กำหนดค่าไว้ การเพิ่มแหล่งใหม่เป็นการดำเนินการตั้งค่าที่
ต้องทำอย่างชัดเจน ดังนั้นให้ใช้
`/codex computer-use install --source <marketplace-source>` หนึ่งครั้ง แล้วปล่อยให้
`autoInstall` จัดการการเปิดใช้งานอีกครั้งในอนาคตจาก marketplace ภายในเครื่องที่ค้นพบ
การติดตั้งอัตโนมัติเมื่อเริ่มต้นรอบการทำงานสามารถใช้ `marketplacePath` ที่กำหนดค่าไว้ได้
เนื่องจากค่านี้เป็นพาธภายในเครื่องบนโฮสต์อยู่แล้ว

แต่ละฟิลด์ยังรองรับการเขียนทับด้วยตัวแปรสภาพแวดล้อม ซึ่งจะตรวจสอบเมื่อไม่ได้ตั้งค่า
คีย์การกำหนดค่าที่ตรงกัน:

| ฟิลด์                           | ตัวแปรสภาพแวดล้อม                                             |
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

OpenClaw รายงานเหตุผลการตั้งค่าที่คงที่ภายในระบบ และจัดรูปแบบสถานะที่ผู้ใช้เห็น
สำหรับแชต:

| เหตุผล                       | ความหมาย                                                       | ขั้นตอนถัดไป                                          |
| ---------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` ถูกประเมินเป็น false                     | ตั้งค่า `enabled` หรือฟิลด์ Computer Use อื่น         |
| `marketplace_missing`        | ไม่มี marketplace ที่ตรงกันพร้อมใช้งาน                         | กำหนดค่าแหล่ง พาธ หรือชื่อ marketplace                |
| `plugin_not_installed`       | มี marketplace อยู่ แต่ยังไม่ได้ติดตั้ง Plugin                 | เรียกใช้การติดตั้งหรือเปิดใช้ `autoInstall`           |
| `plugin_disabled`            | ติดตั้ง Plugin แล้วแต่ปิดใช้งานอยู่ในการกำหนดค่า Codex         | เรียกใช้การติดตั้งเพื่อเปิดใช้งานอีกครั้ง              |
| `remote_install_unsupported` | marketplace ที่เลือกใช้งานได้จากระยะไกลเท่านั้น                | ใช้ `marketplaceSource` หรือ `marketplacePath`         |
| `mcp_missing`                | เปิดใช้งาน Plugin แล้ว แต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน       | ตรวจสอบ Computer Use ของ Codex และสิทธิ์ของระบบปฏิบัติการ |
| `ready`                      | Plugin และเครื่องมือ MCP พร้อมใช้งาน                           | เริ่มรอบการทำงานในโหมด Codex                          |
| `check_failed`               | คำขอ Codex app-server ล้มเหลวระหว่างตรวจสอบสถานะ               | ตรวจสอบการเชื่อมต่อ app-server และบันทึก              |
| `auto_install_blocked`       | การตั้งค่าเมื่อเริ่มต้นรอบการทำงานจำเป็นต้องเพิ่มแหล่งใหม่     | เรียกใช้การติดตั้งแบบชัดเจนก่อน                        |

ผลลัพธ์ในแชตประกอบด้วยสถานะ Plugin สถานะเซิร์ฟเวอร์ MCP, marketplace,
เครื่องมือเมื่อพร้อมใช้งาน และข้อความเฉพาะสำหรับขั้นตอนการตั้งค่าที่ล้มเหลว

## สิทธิ์บน macOS

Computer Use ใช้ได้เฉพาะบน macOS เซิร์ฟเวอร์ MCP ที่ Codex เป็นเจ้าของอาจต้องใช้
สิทธิ์ของระบบปฏิบัติการภายในเครื่องก่อนจึงจะตรวจสอบหรือควบคุมแอปได้ หาก OpenClaw
ระบุว่าติดตั้ง Computer Use แล้วแต่เซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน ให้ตรวจสอบ
การตั้งค่า Computer Use ฝั่ง Codex ก่อน:

- Codex app-server กำลังทำงานบนโฮสต์เดียวกับที่ต้องการควบคุมเดสก์ท็อป
- เปิดใช้งาน Plugin Computer Use ในการกำหนดค่า Codex
- เซิร์ฟเวอร์ MCP `computer-use` ปรากฏในสถานะ MCP ของ Codex app-server
- macOS ได้ให้สิทธิ์ที่จำเป็นแก่แอปควบคุมเดสก์ท็อปแล้ว
- เซสชันปัจจุบันของโฮสต์สามารถเข้าถึงเดสก์ท็อปที่กำลังควบคุมได้

OpenClaw จงใจหยุดอย่างปลอดภัยเมื่อ `computerUse.enabled` เป็น true รอบการทำงาน
ในโหมด Codex ต้องไม่ดำเนินการต่อโดยไม่มีการแจ้งเตือน หากไม่มีเครื่องมือเดสก์ท็อป
แบบเนทีฟที่การกำหนดค่าระบุว่าจำเป็น

## การแก้ไขปัญหา

**สถานะระบุว่ายังไม่ได้ติดตั้ง** เรียกใช้ `/codex computer-use install` หากไม่พบ
marketplace ให้ส่ง `--source` หรือ `--marketplace-path`

**สถานะระบุว่าติดตั้งแล้วแต่ปิดใช้งานอยู่** เรียกใช้ `/codex computer-use install`
อีกครั้ง การติดตั้งผ่าน Codex app-server จะเขียนการกำหนดค่า Plugin กลับเป็นเปิดใช้งาน

**สถานะระบุว่าไม่รองรับการติดตั้งระยะไกล** ใช้แหล่งหรือพาธ marketplace ภายในเครื่อง
รายการแค็ตตาล็อกที่ใช้ได้จากระยะไกลเท่านั้นสามารถตรวจสอบได้ แต่ไม่สามารถติดตั้งผ่าน
API ของ app-server ปัจจุบันได้

**สถานะระบุว่าเซิร์ฟเวอร์ MCP ไม่พร้อมใช้งาน** เรียกใช้การติดตั้งอีกครั้งหนึ่งครั้งเพื่อให้
เซิร์ฟเวอร์ MCP โหลดใหม่ หากยังไม่พร้อมใช้งาน ให้แก้ไขแอป Computer Use ของ Codex,
สถานะ MCP ของ Codex app-server หรือสิทธิ์บน macOS

**สถานะหรือการตรวจสอบหมดเวลาที่ `computer-use.list_apps`** Plugin และเซิร์ฟเวอร์
MCP มีอยู่ แต่บริดจ์ Computer Use ภายในเครื่องไม่ตอบสนอง ปิดหรือเริ่ม Computer Use
ของ Codex ใหม่ เปิด Codex Desktop ใหม่หากจำเป็น แล้วลองอีกครั้งในเซสชัน OpenClaw
ใหม่ หากก่อนหน้านี้โฮสต์เคยเรียกใช้ Computer Use ผ่าน Codex app-server แบบมีการจัดการ
รุ่นเก่า ให้รีเฟรช Plugin ที่ติดตั้งจาก marketplace ซึ่งรวมมากับเดสก์ท็อป (ใช้พาธ
`Codex.app` สำหรับการติดตั้ง Codex บนเดสก์ท็อปแบบสแตนด์อโลน):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**เครื่องมือ Computer Use แสดง `Native hook relay unavailable`** ฮุกเครื่องมือ
แบบเนทีฟของ Codex ไม่สามารถเข้าถึงรีเลย์ OpenClaw ที่ทำงานอยู่ผ่านบริดจ์ภายในเครื่อง
หรือ Gateway สำรองได้ เริ่มเซสชัน OpenClaw ใหม่ด้วย `/new` หรือ `/reset` หากทำงานได้
หนึ่งครั้งแล้วล้มเหลวอีกในการเรียกเครื่องมือครั้งถัดไป `/new` เป็นเพียงการล้าง
ความพยายามปัจจุบันเท่านั้น ให้เริ่ม Codex app-server หรือ OpenClaw Gateway ใหม่
เพื่อทิ้งเธรดและการลงทะเบียนฮุกเก่า แล้วลองอีกครั้งในเซสชันใหม่

**การติดตั้งอัตโนมัติเมื่อเริ่มต้นรอบการทำงานปฏิเสธแหล่ง** ลักษณะนี้เป็นไปโดยเจตนา
ให้เพิ่มแหล่งด้วยคำสั่ง `/codex computer-use install --source
<marketplace-source>` แบบชัดเจนก่อน จากนั้นการติดตั้งอัตโนมัติเมื่อเริ่มต้น
รอบการทำงานในอนาคตจึงจะสามารถใช้ marketplace ภายในเครื่องที่ค้นพบได้

## ที่เกี่ยวข้อง

- [ชุดควบคุม Codex](/th/plugins/codex-harness)
- [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo)
- [แอป iOS](/th/platforms/ios)
