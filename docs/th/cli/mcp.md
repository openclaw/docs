---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นกับช่องทางที่ทำงานผ่าน OpenClaw
    - กำลังเรียกใช้ `openclaw mcp serve`
    - การจัดการข้อกำหนดเซิร์ฟเวอร์ MCP ที่บันทึกโดย OpenClaw
sidebarTitle: MCP
summary: เปิดให้เข้าถึงการสนทนาในช่องทาง OpenClaw ผ่าน MCP และจัดการข้อกำหนดเซิร์ฟเวอร์ MCP ที่บันทึกไว้
title: MCP
x-i18n:
    generated_at: "2026-07-20T16:06:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 07db33cc81d9e307b4bd83e0a3a283aa8a9bb66f9fbedd7f972d59333676b7e9
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` มีหน้าที่สองอย่าง:

- เรียกใช้ OpenClaw เป็นเซิร์ฟเวอร์ MCP ด้วย `openclaw mcp serve`
- จัดการข้อกำหนดเซิร์ฟเวอร์ MCP ขาออกที่ OpenClaw จัดการด้วย `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` และ `unset`

`serve` คือ OpenClaw ที่ทำหน้าที่เป็นเซิร์ฟเวอร์ MCP ส่วนคำสั่งย่อยอื่นๆ คือ OpenClaw ที่ทำหน้าที่เป็นรีจิสทรีฝั่งไคลเอนต์ MCP สำหรับเซิร์ฟเวอร์ที่รันไทม์ของ OpenClaw อาจใช้งานภายหลัง

<Note>
  `list`, `show`, `set` และ `unset` อ่านและเขียนเฉพาะรายการ `mcp.servers` ที่ OpenClaw จัดการในการกำหนดค่า OpenClaw เท่านั้น โดยไม่รวมเซิร์ฟเวอร์ mcporter จาก `config/mcporter.json`; ให้ใช้ `mcporter list` สำหรับรีจิสทรีนั้น
</Note>

ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชันชุดเครื่องมือเขียนโค้ดด้วยตนเองและกำหนดเส้นทางรันไทม์นั้นผ่าน ACP

## เลือกเส้นทาง MCP ที่เหมาะสม

| เป้าหมาย                                                                | ใช้                                                                  | เหตุผล                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| อนุญาตให้ไคลเอนต์ MCP ภายนอกอ่าน/ส่งการสนทนาในช่องทางของ OpenClaw | `openclaw mcp serve`                                                 | OpenClaw เป็นเซิร์ฟเวอร์ MCP และเปิดให้เข้าถึงการสนทนาที่รองรับโดย Gateway ผ่าน stdio                                 |
| บันทึกเซิร์ฟเวอร์ MCP ของบุคคลที่สามสำหรับการทำงานของเอเจนต์ที่ OpenClaw จัดการ        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw เป็นรีจิสทรีฝั่งไคลเอนต์ MCP และจะส่งต่อเซิร์ฟเวอร์เหล่านั้นไปยังรันไทม์ที่เข้าเกณฑ์ในภายหลัง               |
| ตรวจสอบเซิร์ฟเวอร์ที่บันทึกไว้โดยไม่เรียกใช้รอบการทำงานของเอเจนต์                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` และ `doctor` ตรวจสอบการกำหนดค่า; `probe` เปิดการเชื่อมต่อ MCP แบบใช้งานจริงและแสดงความสามารถ               |
| แก้ไขการกำหนดค่า MCP จากเบราว์เซอร์                                      | Control UI `/settings/mcp` (นามแฝง `/mcp`)                            | หน้านี้แสดงรายการทรัพยากร การเปิดใช้งาน สรุป OAuth/ตัวกรอง คำแนะนำคำสั่ง และตัวแก้ไข `mcp` ที่จำกัดขอบเขต         |
| มอบเซิร์ฟเวอร์ MCP แบบเนทีฟที่จำกัดขอบเขตให้ Codex app-server                    | `mcp.servers.<name>.codex`                                           | บล็อก `codex` มีผลเฉพาะต่อการส่งต่อเธรดของ Codex app-server และจะถูกตัดออกก่อนส่งมอบการกำหนดค่าแบบเนทีฟ |
| เรียกใช้เซสชันชุดเครื่องมือที่โฮสต์ด้วย ACP                                     | [`openclaw acp`](/th/cli/acp) และ [เอเจนต์ ACP](/th/tools/acp-agents-setup) | โหมดบริดจ์ ACP ไม่รองรับการแทรกเซิร์ฟเวอร์ MCP แยกตามเซสชัน; ให้กำหนดค่าบริดจ์ Gateway/Plugin แทน     |

<Tip>
หากไม่แน่ใจว่าต้องใช้เส้นทางใด ให้เริ่มจาก `openclaw mcp status --verbose` ซึ่งจะแสดงสิ่งที่ OpenClaw บันทึกไว้โดยไม่เริ่มเซิร์ฟเวอร์ MCP ใดๆ
</Tip>

## OpenClaw ในฐานะเซิร์ฟเวอร์ MCP

นี่คือเส้นทาง `openclaw mcp serve`

### เมื่อใดควรใช้ serve

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือไคลเอนต์ MCP อื่นควรสื่อสารโดยตรงกับการสนทนาในช่องทางที่รองรับโดย OpenClaw
- มี OpenClaw Gateway ภายในเครื่องหรือระยะไกลพร้อมเซสชันที่กำหนดเส้นทางแล้ว
- ต้องการเซิร์ฟเวอร์ MCP เดียวที่ทำงานกับแบ็กเอนด์ช่องทางต่างๆ ของ OpenClaw แทนการเรียกใช้บริดจ์แยกตามแต่ละช่องทาง

ใช้ [`openclaw acp`](/th/cli/acp) แทน เมื่อ OpenClaw ควรโฮสต์รันไทม์การเขียนโค้ดด้วยตนเองและเก็บเซสชันเอเจนต์ไว้ภายใน OpenClaw

### วิธีการทำงาน

`openclaw mcp serve` เริ่มเซิร์ฟเวอร์ MCP แบบ stdio โดยไคลเอนต์ MCP เป็นเจ้าของกระบวนการนั้น ตราบใดที่ไคลเอนต์ยังคงเปิดเซสชัน stdio ไว้ บริดจ์จะเชื่อมต่อกับ OpenClaw Gateway ภายในเครื่องหรือระยะไกลผ่าน WebSocket และเปิดให้เข้าถึงการสนทนาในช่องทางที่กำหนดเส้นทางแล้วผ่าน MCP

<Steps>
  <Step title="ไคลเอนต์เริ่มบริดจ์">
    ไคลเอนต์ MCP เริ่ม `openclaw mcp serve`
  </Step>
  <Step title="บริดจ์เชื่อมต่อกับ Gateway">
    บริดจ์เชื่อมต่อกับ OpenClaw Gateway ผ่าน WebSocket
  </Step>
  <Step title="เซสชันกลายเป็นการสนทนา MCP">
    เซสชันที่กำหนดเส้นทางแล้วจะกลายเป็นการสนทนา MCP และเครื่องมือบันทึกข้อความ/ประวัติ
  </Step>
  <Step title="จัดคิวเหตุการณ์สด">
    เหตุการณ์สดจะถูกจัดคิวไว้ในหน่วยความจำขณะที่บริดจ์เชื่อมต่ออยู่
  </Step>
  <Step title="การพุช Claude ซึ่งเลือกเปิดได้">
    หากเปิดใช้งานโหมดช่องทาง Claude เซสชันเดียวกันจะสามารถรับการแจ้งเตือนแบบพุชเฉพาะของ Claude ได้ด้วย
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พฤติกรรมสำคัญ">
    - สถานะคิวสดเริ่มต้นเมื่อบริดจ์เชื่อมต่อ
    - อ่านประวัติบันทึกข้อความเก่าด้วย `messages_read`
    - การแจ้งเตือนแบบพุชของ Claude มีอยู่เฉพาะขณะที่เซสชัน MCP ยังทำงาน
    - เมื่อไคลเอนต์ตัดการเชื่อมต่อ บริดจ์จะออกและคิวสดจะหายไป
    - จุดเริ่มต้นเอเจนต์แบบครั้งเดียว เช่น `openclaw agent` และ `openclaw infer model run` จะยุติรันไทม์ MCP ที่รวมมาด้วยซึ่งจุดเริ่มต้นดังกล่าวเปิดไว้เมื่อการตอบกลับเสร็จสิ้น เพื่อให้การเรียกใช้สคริปต์ซ้ำไม่สะสมกระบวนการลูก MCP แบบ stdio
    - เซิร์ฟเวอร์ MCP แบบ stdio ที่ OpenClaw เริ่มทำงาน (ไม่ว่าจะรวมมาด้วยหรือผู้ใช้กำหนดค่า) จะถูกยุติทั้งแผนผังกระบวนการเมื่อปิดระบบ เพื่อให้กระบวนการย่อยที่เซิร์ฟเวอร์เริ่มไว้ไม่คงอยู่หลังจากไคลเอนต์ stdio แม่ออก
    - การลบหรือรีเซ็ตเซสชันจะยกเลิกไคลเอนต์ MCP ของเซสชันนั้นผ่านเส้นทางล้างข้อมูลรันไทม์ร่วม จึงไม่มีการเชื่อมต่อ stdio ที่ยังค้างและผูกกับเซสชันที่ถูกลบ

  </Accordion>
</AccordionGroup>

### เลือกโหมดไคลเอนต์

<Tabs>
  <Tab title="ไคลเอนต์ MCP ทั่วไป">
    เฉพาะเครื่องมือ MCP มาตรฐาน ใช้ `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` และเครื่องมืออนุมัติ
  </Tab>
  <Tab title="Claude Code">
    เครื่องมือ MCP มาตรฐานพร้อมอะแดปเตอร์ช่องทางเฉพาะของ Claude เปิดใช้ `--claude-channel-mode on` หรือใช้ค่าเริ่มต้น `auto`
  </Tab>
</Tabs>

<Note>
ขณะนี้ `auto` ทำงานเหมือนกับ `on` และยังไม่มีการตรวจหาความสามารถของไคลเอนต์
</Note>

### สิ่งที่ serve เปิดให้ใช้งาน

บริดจ์ใช้ข้อมูลเมตาเส้นทางเซสชันของ Gateway ที่มีอยู่เพื่อเปิดให้เข้าถึงการสนทนาที่รองรับโดยช่องทาง การสนทนาจะปรากฏเมื่อ OpenClaw มีสถานะเซสชันพร้อมเส้นทางที่ทราบอยู่แล้ว เช่น:

- `channel`
- ข้อมูลเมตาของผู้รับหรือปลายทาง
- `accountId` ซึ่งเลือกมีได้
- `threadId` ซึ่งเลือกมีได้

สิ่งนี้ทำให้ไคลเอนต์ MCP มีจุดเดียวสำหรับ:

- แสดงการสนทนาที่กำหนดเส้นทางล่าสุด
- อ่านประวัติบันทึกข้อความล่าสุด
- รอเหตุการณ์ขาเข้าใหม่
- ส่งการตอบกลับผ่านเส้นทางเดิม
- ดูคำขออนุมัติที่เข้ามาขณะที่บริดจ์เชื่อมต่ออยู่

### การใช้งาน

<Tabs>
  <Tab title="Gateway ภายในเครื่อง">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway ระยะไกล (โทเค็น)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway ระยะไกล (รหัสผ่าน)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="แสดงรายละเอียด / ปิด Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### เครื่องมือบริดจ์

<AccordionGroup>
  <Accordion title="conversations_list">
    แสดงเซสชันการสนทนาล่าสุดที่มีข้อมูลเมตาเส้นทางอยู่แล้วในสถานะเซสชันของ Gateway

    ตัวกรอง: `limit` (สูงสุด 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    ส่งคืนการสนทนาหนึ่งรายการตาม `session_key` โดยใช้การค้นหาเซสชัน Gateway โดยตรง
  </Accordion>
  <Accordion title="messages_read">
    อ่านข้อความบันทึกล่าสุดสำหรับการสนทนาหนึ่งรายการที่รองรับโดยเซสชัน ค่าเริ่มต้นของ `limit` คือ 20 และสูงสุด 200
  </Accordion>
  <Accordion title="attachments_fetch">
    แยกบล็อกเนื้อหาที่ไม่ใช่ข้อความออกจากข้อความบันทึกหนึ่งรายการ นี่คือมุมมองข้อมูลเมตาของเนื้อหาบันทึกข้อความ ไม่ใช่ที่จัดเก็บข้อมูลไบนารีของไฟล์แนบแบบถาวรที่แยกต่างหาก
  </Accordion>
  <Accordion title="events_poll">
    อ่านเหตุการณ์สดที่จัดคิวไว้นับจากเคอร์เซอร์ตัวเลข ค่า `limit` สูงสุด 200
  </Accordion>
  <Accordion title="events_wait">
    ลองโพลแบบยาวจนกว่าเหตุการณ์ในคิวรายการถัดไปที่ตรงกันจะมาถึงหรือหมดเวลา (ค่าเริ่มต้น 30s, สูงสุด 300s)

    ใช้เมื่อไคลเอนต์ MCP ทั่วไปต้องการการส่งมอบที่เกือบเรียลไทม์โดยไม่มีโปรโตคอลพุชเฉพาะของ Claude

  </Accordion>
  <Accordion title="messages_send">
    ส่งข้อความกลับผ่านเส้นทางเดิมที่บันทึกไว้ในเซสชันแล้ว

    พฤติกรรมปัจจุบัน:

    - ต้องมีเส้นทางการสนทนาอยู่แล้ว
    - ใช้ช่องทาง ผู้รับ รหัสบัญชี และรหัสเธรดของเซสชัน
    - ส่งเฉพาะข้อความ

  </Accordion>
  <Accordion title="permissions_list_open">
    แสดงคำขออนุมัติ exec/Plugin ที่รอดำเนินการซึ่งบริดจ์ตรวจพบตั้งแต่เชื่อมต่อกับ Gateway
  </Accordion>
  <Accordion title="permissions_respond">
    ดำเนินการกับคำขออนุมัติ exec/Plugin ที่รอดำเนินการหนึ่งรายการด้วย:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### โมเดลเหตุการณ์

บริดจ์เก็บคิวเหตุการณ์ไว้ในหน่วยความจำขณะที่เชื่อมต่ออยู่

ประเภทเหตุการณ์ปัจจุบัน:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- คิวนี้ใช้กับข้อมูลสดเท่านั้น และเริ่มทำงานเมื่อบริดจ์ MCP เริ่มทำงาน
- `events_poll` และ `events_wait` จะไม่เล่นประวัติ Gateway เก่าซ้ำด้วยตนเอง
- ควรอ่านรายการค้างแบบถาวรด้วย `messages_read`

</Warning>

### การแจ้งเตือนช่องทาง Claude

บริดจ์ยังสามารถเปิดให้ใช้การแจ้งเตือนช่องทางเฉพาะของ Claude ได้ด้วย นี่คือสิ่งที่เทียบเท่ากับอะแดปเตอร์ช่องทาง Claude Code ใน OpenClaw: เครื่องมือ MCP มาตรฐานยังคงใช้งานได้ แต่ข้อความขาเข้าสดสามารถเข้ามาในรูปแบบการแจ้งเตือน MCP เฉพาะของ Claude ได้ด้วย

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: เฉพาะเครื่องมือ MCP มาตรฐาน
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: เปิดใช้การแจ้งเตือนช่องทาง Claude
  </Tab>
  <Tab title="auto (ค่าเริ่มต้น)">
    `--claude-channel-mode auto`: ค่าเริ่มต้นปัจจุบัน; พฤติกรรมของบริดจ์เหมือนกับ `on`
  </Tab>
</Tabs>

เมื่อเปิดใช้โหมดช่องทาง Claude เซิร์ฟเวอร์จะประกาศความสามารถเชิงทดลองของ Claude และสามารถส่ง:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

พฤติกรรมปัจจุบันของบริดจ์:

- ข้อความบันทึกขาเข้า `user` จะถูกส่งต่อเป็น `notifications/claude/channel`
- คำขอสิทธิ์ของ Claude ที่ได้รับผ่าน MCP จะถูกติดตามในหน่วยความจำ
- หากเจ้าของคำสั่งในการสนทนาที่เชื่อมโยงส่ง `yes <id>` หรือ `no <id>` ในภายหลัง (`<id>` คือรหัสคำขอ 5 ตัวอักษร โดยไม่รวม `l`) บริดจ์จะแปลงเป็น `notifications/claude/channel/permission`
- การแจ้งเตือนเหล่านี้ใช้ได้เฉพาะเซสชันสดเท่านั้น หากไคลเอนต์ MCP ตัดการเชื่อมต่อ จะไม่มีเป้าหมายสำหรับการพุช

พฤติกรรมนี้ตั้งใจให้เฉพาะเจาะจงกับไคลเอนต์ ไคลเอนต์ MCP ทั่วไปควรใช้เครื่องมือโพลมาตรฐาน

### การกำหนดค่าไคลเอนต์ MCP

ตัวอย่างการกำหนดค่าไคลเอนต์ stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

สำหรับไคลเอนต์ MCP ทั่วไปส่วนใหญ่ ให้เริ่มด้วยชุดเครื่องมือมาตรฐานและไม่ต้องสนใจโหมด Claude เปิดโหมด Claude เฉพาะสำหรับไคลเอนต์ที่เข้าใจเมธอดการแจ้งเตือนเฉพาะของ Claude จริง ๆ เท่านั้น

### ตัวเลือก

`openclaw mcp serve` รองรับ:

<ParamField path="--url" type="string">
  URL WebSocket ของ Gateway ค่าเริ่มต้นคือ `gateway.remote.url` เมื่อกำหนดค่าไว้
</ParamField>
<ParamField path="--token" type="string">
  โทเค็นของ Gateway
</ParamField>
<ParamField path="--token-file" type="string">
  อ่านโทเค็นจากไฟล์
</ParamField>
<ParamField path="--password" type="string">
  รหัสผ่านของ Gateway
</ParamField>
<ParamField path="--password-file" type="string">
  อ่านรหัสผ่านจากไฟล์
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  โหมดการแจ้งเตือนของ Claude ค่าเริ่มต้นคือ `auto`
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  บันทึกโดยละเอียดบน stderr
</ParamField>

<Tip>
หากเป็นไปได้ ควรใช้ `--token-file` หรือ `--password-file` แทนข้อมูลลับแบบอินไลน์
</Tip>

### ขอบเขตความปลอดภัยและความไว้วางใจ

บริดจ์จะไม่สร้างการกำหนดเส้นทางขึ้นเอง แต่จะแสดงเฉพาะการสนทนาที่ Gateway ทราบวิธีกำหนดเส้นทางอยู่แล้ว

ซึ่งหมายความว่า:

- รายการอนุญาตผู้ส่ง การจับคู่ และความไว้วางใจระดับช่องทางยังคงเป็นส่วนหนึ่งของการกำหนดค่าช่องทาง OpenClaw ที่อยู่เบื้องหลัง
- `messages_send` ตอบกลับได้เฉพาะผ่านเส้นทางที่จัดเก็บไว้แล้วเท่านั้น
- สถานะการอนุมัติเป็นแบบสด/อยู่ในหน่วยความจำเฉพาะเซสชันบริดจ์ปัจจุบันเท่านั้น
- การยืนยันตัวตนของบริดจ์ควรใช้การควบคุมโทเค็นหรือรหัสผ่าน Gateway แบบเดียวกับที่ไว้วางใจให้ไคลเอนต์ Gateway ระยะไกลอื่น ๆ ใช้

หากการสนทนาไม่ปรากฏใน `conversations_list` สาเหตุโดยทั่วไปไม่ใช่การกำหนดค่า MCP แต่เป็นข้อมูลเมตาของเส้นทางที่ขาดหายหรือไม่สมบูรณ์ในเซสชัน Gateway ที่อยู่เบื้องหลัง

### การทดสอบ

OpenClaw มาพร้อมการทดสอบ smoke บน Docker ที่ให้ผลลัพธ์แน่นอนสำหรับบริดจ์นี้:

```bash
pnpm test:docker:mcp-channels
```

การทดสอบ smoke นี้เรียกใช้คอนเทนเนอร์เดียว โดยเริ่มจากใส่ข้อมูลสถานะการสนทนา เริ่ม Gateway จากนั้นสร้าง `openclaw mcp serve` เป็นโปรเซสลูกแบบ stdio และควบคุมในฐานะไคลเอนต์ MCP โดยตรวจสอบการค้นหาการสนทนา การอ่านทรานสคริปต์ การอ่านข้อมูลเมตาของไฟล์แนบ พฤติกรรมคิวเหตุการณ์สด และการแจ้งเตือนช่องทางกับสิทธิ์แบบ Claude ผ่านบริดจ์ MCP แบบ stdio จริง การกำหนดเส้นทางการส่งออก (`messages_send` ที่ใช้เส้นทางการสนทนาที่จัดเก็บไว้อีกครั้ง) ครอบคลุมแยกต่างหากด้วยการทดสอบหน่วยใน `src/mcp/channel-server.test.ts`

นี่คือวิธีที่เร็วที่สุดในการพิสูจน์ว่าบริดจ์ทำงานได้โดยไม่ต้องเชื่อมต่อบัญชี Telegram, Discord หรือ iMessage จริงเข้ากับการทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น โปรดดู[การทดสอบ](/th/help/testing)

### การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการสนทนาส่งกลับมา">
    โดยทั่วไปหมายความว่าเซสชัน Gateway ยังไม่สามารถกำหนดเส้นทางได้ โปรดยืนยันว่าเซสชันที่อยู่เบื้องหลังมีข้อมูลเมตาของเส้นทางสำหรับช่องทาง/ผู้ให้บริการ ผู้รับ และบัญชี/เธรดที่เป็นตัวเลือกจัดเก็บไว้
  </Accordion>
  <Accordion title="events_poll หรือ events_wait ไม่พบข้อความเก่า">
    เป็นพฤติกรรมที่คาดไว้ คิวสดจะเริ่มทำงานเมื่อบริดจ์เชื่อมต่อ อ่านประวัติทรานสคริปต์เก่าด้วย `messages_read`
  </Accordion>
  <Accordion title="การแจ้งเตือนของ Claude ไม่ปรากฏ">
    ตรวจสอบทั้งหมดดังต่อไปนี้:

    - ไคลเอนต์เปิดเซสชัน MCP แบบ stdio ไว้ตลอด
    - `--claude-channel-mode` เป็น `on` หรือ `auto`
    - ไคลเอนต์เข้าใจเมธอดการแจ้งเตือนเฉพาะของ Claude จริง ๆ
    - ข้อความขาเข้าเกิดขึ้นหลังจากบริดจ์เชื่อมต่อแล้ว

  </Accordion>
  <Accordion title="ไม่มีคำขออนุมัติ">
    `permissions_list_open` แสดงเฉพาะคำขออนุมัติที่ตรวจพบในขณะที่บริดจ์เชื่อมต่ออยู่เท่านั้น ไม่ใช่ API ประวัติการอนุมัติแบบถาวร
  </Accordion>
</AccordionGroup>

## OpenClaw ในฐานะรีจิสทรีไคลเอนต์ MCP

นี่คือเส้นทาง `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` และ `unset`

คำสั่งเหล่านี้ไม่ได้เปิดให้เข้าถึง OpenClaw ผ่าน MCP แต่จะจัดการข้อกำหนดเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` ในการกำหนดค่า OpenClaw โดยจะไม่อ่านเซิร์ฟเวอร์ mcporter จาก `config/mcporter.json`

ข้อกำหนดที่บันทึกไว้เหล่านี้มีไว้สำหรับรันไทม์ที่ OpenClaw จะเปิดหรือกำหนดค่าในภายหลัง เช่น OpenClaw แบบฝังและอะแดปเตอร์รันไทม์อื่น ๆ OpenClaw จัดเก็บข้อกำหนดเหล่านี้ไว้ที่ศูนย์กลางเพื่อให้รันไทม์ดังกล่าวไม่ต้องเก็บรายการเซิร์ฟเวอร์ MCP ซ้ำของตนเอง

<AccordionGroup>
  <Accordion title="พฤติกรรมสำคัญ">
    - คำสั่งเหล่านี้อ่านหรือเขียนเฉพาะการกำหนดค่า OpenClaw
    - `status`, `list`, `show`, `doctor` ที่ไม่มี `--probe`, `set`, `configure`, `tools`, `logout`, `reload` และ `unset` จะไม่เชื่อมต่อกับเซิร์ฟเวอร์ MCP เป้าหมาย
    - `login` ดำเนินขั้นตอนเครือข่าย MCP OAuth สำหรับเซิร์ฟเวอร์ HTTP ที่กำหนดค่าไว้ และบันทึกข้อมูลประจำตัวในเครื่องที่ได้
    - `status --verbose` แสดงคำแนะนำเกี่ยวกับทรานสปอร์ต การยืนยันตัวตน ระยะหมดเวลา ตัวกรอง และการเรียกเครื่องมือแบบขนานที่ผ่านการแก้ค่าแล้ว โดยไม่เชื่อมต่อ
    - `doctor` ตรวจสอบข้อกำหนดที่บันทึกไว้เพื่อค้นหาปัญหาการตั้งค่าในเครื่อง เช่น คำสั่ง stdio ที่ขาดหาย ไดเรกทอรีทำงานที่ไม่ถูกต้อง ไฟล์ TLS ที่ขาดหาย เซิร์ฟเวอร์ที่ปิดใช้งาน ค่าเฮดเดอร์/สภาพแวดล้อมที่ละเอียดอ่อนแบบค่าตรงตัว และการอนุญาต OAuth ที่ไม่สมบูรณ์
    - `doctor --probe` เพิ่มการพิสูจน์การเชื่อมต่อแบบสดเช่นเดียวกับ `probe` หลังจากผ่านการตรวจสอบแบบคงที่
    - `probe` เชื่อมต่อกับเซิร์ฟเวอร์ที่เลือกหรือเซิร์ฟเวอร์ที่กำหนดค่าทั้งหมด แสดงรายการเครื่องมือ และรายงานความสามารถ/การวินิจฉัย
    - `add` สร้างข้อกำหนดจากแฟล็กและตรวจสอบก่อนบันทึก เว้นแต่ตั้งค่า `--no-probe` ไว้หรือต้องดำเนินการอนุญาต OAuth ก่อน
    - อะแดปเตอร์รันไทม์จะตัดสินใจขณะดำเนินการว่ารองรับรูปแบบทรานสปอร์ตใดบ้าง
    - `enabled: false` เก็บเซิร์ฟเวอร์ไว้ในรายการที่บันทึก แต่ไม่นำไปใช้ในการค้นหารันไทม์แบบฝัง
    - `requestTimeoutMs` และ `connectionTimeoutMs` กำหนดระยะหมดเวลาของคำขอและการเชื่อมต่อแยกตามเซิร์ฟเวอร์เป็นมิลลิวินาที
    - `supportsParallelToolCalls: true` ระบุเซิร์ฟเวอร์ที่อะแดปเตอร์สามารถเรียกพร้อมกันได้
    - เซิร์ฟเวอร์ HTTP สามารถใช้เฮดเดอร์แบบคงที่ การเข้าสู่ระบบ OAuth การควบคุมการตรวจสอบ TLS และพาธใบรับรอง/คีย์ mTLS
    - OpenClaw แบบฝังแสดงเครื่องมือ MCP ที่กำหนดค่าไว้ในโปรไฟล์เครื่องมือ `coding` และ `messaging` ตามปกติ ส่วน `minimal` ยังคงซ่อนเครื่องมือเหล่านั้น และ `tools.deny: ["bundle-mcp"]` ปิดใช้งานอย่างชัดเจน
    - `toolFilter.include` และ `toolFilter.exclude` แยกตามเซิร์ฟเวอร์จะกรองเครื่องมือ MCP ที่ค้นพบก่อนจะกลายเป็นเครื่องมือ OpenClaw
    - เซิร์ฟเวอร์ที่ประกาศทรัพยากรหรือพรอมต์จะแสดงเครื่องมืออรรถประโยชน์สำหรับแสดงรายการ/อ่านทรัพยากร และแสดงรายการ/ดึงพรอมต์ด้วย ชื่ออรรถประโยชน์ที่สร้างขึ้นเหล่านั้น (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) ใช้ตัวกรองรวม/ยกเว้นเดียวกัน
    - การเปลี่ยนแปลงรายการเครื่องมือ MCP แบบไดนามิกจะทำให้แค็ตตาล็อกที่แคชไว้สำหรับเซสชันนั้นใช้ไม่ได้ การค้นพบ/ใช้งานครั้งถัดไปจะรีเฟรชจากเซิร์ฟเวอร์
    - ความล้มเหลวของคำขอเครื่องมือ/โปรโตคอล MCP ซ้ำ ๆ จะหยุดเซิร์ฟเวอร์นั้นชั่วครู่ เพื่อไม่ให้เซิร์ฟเวอร์ที่เสียเพียงเครื่องเดียวใช้เวลาในรอบทั้งหมด
    - รันไทม์ MCP แบบรวมในแพ็กเกจที่มีขอบเขตระดับเซสชันจะถูกเก็บกวาดหลังไม่มีการใช้งาน 10 นาที และการทำงานแบบฝังครั้งเดียวจะล้างรันไทม์เหล่านั้นเมื่อสิ้นสุดการทำงาน

  </Accordion>
</AccordionGroup>

อะแดปเตอร์รันไทม์อาจปรับรีจิสทรีที่ใช้ร่วมกันนี้ให้เป็นรูปแบบที่ไคลเอนต์ปลายทางคาดหวัง ตัวอย่างเช่น OpenClaw แบบฝังใช้ค่า `transport` ของ OpenClaw โดยตรง ขณะที่ Claude Code และ Gemini จะได้รับค่า `type` แบบเนทีฟของ CLI เช่น `http`, `sse` หรือ `stdio`

Codex app-server ยังรองรับบล็อก `codex` ที่เป็นตัวเลือกในแต่ละเซิร์ฟเวอร์ด้วย นี่คือ
ข้อมูลเมตาการฉายภาพของ OpenClaw สำหรับเธรด Codex app-server เท่านั้น โดยไม่
เปลี่ยนเซสชัน ACP การกำหนดค่าฮาร์เนส Codex ทั่วไป หรืออะแดปเตอร์รันไทม์อื่น
ใช้ `codex.agents` ที่ไม่ว่างเพื่อฉายเซิร์ฟเวอร์ไปยังเฉพาะรหัสเอเจนต์ OpenClaw
ที่ระบุเท่านั้น รายการเอเจนต์ที่ว่าง มีแต่ช่องว่าง หรือไม่ถูกต้องจะถูกปฏิเสธโดยการตรวจสอบ
ความถูกต้องของการกำหนดค่า และละเว้นโดยพาธการฉายภาพของรันไทม์แทนที่จะกลายเป็น
แบบส่วนกลาง ใช้ `codex.defaultToolsApprovalMode` (`auto`, `prompt` หรือ `approve`)
เพื่อส่งออก `default_tools_approval_mode` แบบเนทีฟของ Codex สำหรับเซิร์ฟเวอร์ที่เชื่อถือได้
OpenClaw จะนำข้อมูลเมตา `codex` ออกก่อนส่งการกำหนดค่า `mcp_servers`
แบบเนทีฟไปยัง Codex

### ข้อกำหนดเซิร์ฟเวอร์ MCP ที่บันทึกไว้

คำสั่ง:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

หมายเหตุ:

- `list` เรียงชื่อเซิร์ฟเวอร์
- `show` ที่ไม่มีชื่อจะแสดงออบเจ็กต์เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ทั้งหมด
- `status` จำแนกทรานสปอร์ตที่กำหนดค่าไว้โดยไม่เชื่อมต่อ `--verbose` รวมรายละเอียดการเปิดทำงาน ระยะหมดเวลา OAuth ตัวกรอง และการเรียกแบบขนานที่ผ่านการแก้ค่าแล้ว รวมถึงกรณีที่โทเค็น OAuth ที่จัดเก็บไว้ต้องได้รับการอนุญาตเพิ่มเติม อาร์กิวเมนต์ stdio ที่มีข้อมูลประจำตัวจะถูกปกปิดในเอาต์พุตข้อความและ JSON
- `doctor` ดำเนินการตรวจสอบแบบคงที่โดยไม่เชื่อมต่อ เพิ่ม `--probe` เมื่อคำสั่งควรตรวจสอบด้วยว่าเซิร์ฟเวอร์ที่เปิดใช้งานเชื่อมต่อได้
- `probe` เชื่อมต่อและรายงานจำนวนเครื่องมือ การรองรับทรัพยากร/พรอมต์ การรองรับการเปลี่ยนแปลงรายการ และการวินิจฉัย
- `add` ยอมรับแฟล็ก stdio เช่น `--command`, `--arg`, `--env` และ `--cwd` หรือแฟล็ก HTTP เช่น `--url`, `--transport`, `--header`, `--auth oauth` รวมถึงแฟล็ก TLS ระยะหมดเวลา และการเลือกเครื่องมือ
- `set` ต้องการค่าออบเจ็กต์ JSON หนึ่งรายการในบรรทัดคำสั่ง
- `configure` อัปเดตสถานะการเปิดใช้งาน ตัวกรองเครื่องมือ ระยะหมดเวลา OAuth, TLS และคำแนะนำการเรียกเครื่องมือแบบขนานโดยไม่แทนที่ข้อกำหนดเซิร์ฟเวอร์ทั้งหมด เพิ่ม `--probe` เพื่อตรวจสอบเซิร์ฟเวอร์ที่อัปเดตก่อนบันทึก
- `tools` อัปเดตตัวกรองเครื่องมือแยกตามเซิร์ฟเวอร์ รายการรวม/ยกเว้นคือชื่อเครื่องมือ MCP และรูปแบบ glob แบบง่าย `*`
- `login` เรียกใช้ขั้นตอน OAuth สำหรับเซิร์ฟเวอร์ HTTP ที่กำหนดค่าด้วย `auth: "oauth"` การเรียกใช้ครั้งแรกจะแสดง URL สำหรับการอนุญาต ให้เรียกใช้อีกครั้งด้วย `--code` หลังจากอนุมัติ
- `logout` ล้างข้อมูลประจำตัว OAuth ที่จัดเก็บไว้สำหรับเซิร์ฟเวอร์ที่ระบุโดยไม่ลบข้อกำหนดเซิร์ฟเวอร์ที่บันทึกไว้
- `reload` กำจัดรันไทม์ MCP ในโปรเซสที่แคชไว้เฉพาะสำหรับโปรเซส CLI ปัจจุบัน โปรเซส Gateway หรือเอเจนต์ในโปรเซสอื่นยังคงต้องใช้พาธการโหลดใหม่หรือเริ่มการทำงานใหม่ของตนเอง
- ใช้ `transport: "streamable-http"` สำหรับเซิร์ฟเวอร์ MCP แบบ Streamable HTTP นอกจากนี้ `openclaw mcp set` ยังปรับ `type: "http"` แบบเนทีฟของ CLI ให้เป็นรูปแบบการกำหนดค่ามาตรฐานเดียวกันเพื่อความเข้ากันได้
- `unset` จะล้มเหลวหากไม่มีเซิร์ฟเวอร์ที่ระบุ

ตัวอย่าง:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### สูตรการตั้งค่าเซิร์ฟเวอร์ที่ใช้บ่อย

ตัวอย่างเหล่านี้บันทึกเฉพาะข้อกำหนดของเซิร์ฟเวอร์เท่านั้น เรียกใช้ `openclaw mcp doctor --probe` หลังจากนั้นเพื่อยืนยันว่าเซิร์ฟเวอร์เริ่มทำงานและเปิดให้ใช้เครื่องมือได้

<Tabs>
  <Tab title="ระบบไฟล์">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    จำกัดขอบเขตเซิร์ฟเวอร์ระบบไฟล์ไว้ที่โครงสร้างไดเรกทอรีขนาดเล็กที่สุดที่เอเจนต์ควรอ่านหรือแก้ไข

  </Tab>
  <Tab title="หน่วยความจำ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    ใช้ตัวกรองเครื่องมือหากเซิร์ฟเวอร์เปิดให้ใช้เครื่องมือเขียนที่ไม่ควรมีให้เอเจนต์ทั่วไปใช้งาน

  </Tab>
  <Tab title="สคริปต์ภายในเครื่อง">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` ตรวจสอบว่ามี `cwd` อยู่ และสามารถแก้ไขคำสั่งจากสภาพแวดล้อมที่กำหนดค่าไว้ได้

  </Tab>
  <Tab title="HTTP ระยะไกล">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    ใช้ OAuth เมื่อเซิร์ฟเวอร์ระยะไกลรองรับ หากเซิร์ฟเวอร์ต้องใช้ส่วนหัวแบบคงที่ ให้หลีกเลี่ยงการคอมมิต bearer token แบบค่าตรงตัว

  </Tab>
  <Tab title="เดสก์ท็อป/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    เซิร์ฟเวอร์ควบคุมเดสก์ท็อปโดยตรงจะสืบทอดสิทธิ์ของโพรเซสที่เซิร์ฟเวอร์เรียกใช้ ใช้ตัวกรองเครื่องมือแบบจำกัดและพรอมต์ขอสิทธิ์ระดับระบบปฏิบัติการ

  </Tab>
</Tabs>

### รูปแบบเอาต์พุต JSON

ใช้ `--json` สำหรับสคริปต์และแดชบอร์ด ชุดฟิลด์อาจเพิ่มขึ้นเมื่อเวลาผ่านไป ดังนั้นผู้ใช้ข้อมูลควรเพิกเฉยต่อคีย์ที่ไม่รู้จัก

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "requiresAuthorization": false,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "ข้อมูลประจำตัว OAuth ยังไม่ได้รับอนุญาต ให้เรียกใช้ openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` ออกจากการทำงานด้วยรหัสที่ไม่ใช่ศูนย์ เมื่อเซิร์ฟเวอร์ที่เปิดใช้งานและได้รับการตรวจสอบเซิร์ฟเวอร์ใดก็ตามมีปัญหาระดับ `error` ระบบจะรายงานปัญหา `warning` และ `info` แต่ปัญหาเหล่านี้เพียงอย่างเดียวจะไม่ทำให้คำสั่งล้มเหลว

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` เปิดเซสชันไคลเอ็นต์ MCP ที่ใช้งานจริงและพิมพ์ผลลัพธ์โดยตรง เอาต์พุตจะไม่มีฟิลด์ระดับบนสุด `path` ซึ่งต่างจาก `status`/`doctor` คีย์ `resources` และ `prompts` จะปรากฏต่อเมื่อเซิร์ฟเวอร์ประกาศความสามารถนั้นจริงเท่านั้น (เซิร์ฟเวอร์ที่ไม่มีพรอมต์จะละคีย์ `prompts` แทนที่จะรายงาน `false`) ใช้ `probe` เพื่อยืนยันการเข้าถึงและความสามารถ ไม่ใช่สำหรับการตรวจสอบการกำหนดค่าแบบคงที่

  </Accordion>
</AccordionGroup>

ตัวอย่างรูปแบบการกำหนดค่า:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "requestTimeoutMs": 20000,
        "connectionTimeoutMs": 5000,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### การขนส่งแบบ Stdio

เรียกใช้โพรเซสลูกภายในเครื่องและสื่อสารผ่าน stdin/stdout

| ฟิลด์                      | คำอธิบาย                       |
| -------------------------- | --------------------------------- |
| `command`                  | ไฟล์ปฏิบัติการที่จะสร้างโพรเซส (จำเป็น)    |
| `args`                     | อาร์เรย์ของอาร์กิวเมนต์บรรทัดคำสั่ง   |
| `env`                      | ตัวแปรสภาพแวดล้อมเพิ่มเติม       |
| `cwd` / `workingDirectory` | ไดเรกทอรีทำงานสำหรับโพรเซส |

<Warning>
**ตัวกรองความปลอดภัยของสภาพแวดล้อม Stdio**

OpenClaw ปฏิเสธคีย์สภาพแวดล้อมสำหรับการเริ่มต้นอินเทอร์พรีเตอร์ การยึดตัวโหลด และการเริ่มต้นเชลล์ก่อนสร้างเซิร์ฟเวอร์ MCP แบบ stdio แม้ว่าคีย์เหล่านั้นจะปรากฏในบล็อก `env` ของเซิร์ฟเวอร์ก็ตาม โดยใช้นโยบายความปลอดภัยของสภาพแวดล้อมโฮสต์เดียวกับโพรเซสอื่นที่ OpenClaw สร้างขึ้น ซึ่งจะบล็อกฮุกเริ่มต้นอินเทอร์พรีเตอร์ที่รู้จัก (เช่น `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`) คำนำหน้าสำหรับการแทรกไลบรารีที่ใช้ร่วมกันและฟังก์ชัน (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) และตัวแปรควบคุมรันไทม์ที่คล้ายกัน ระหว่างเริ่มต้นระบบจะละคีย์เหล่านี้โดยไม่แจ้งข้อผิดพลาดและบันทึกคำเตือน เพื่อไม่ให้คีย์เหล่านี้แทรกบทนำโดยนัย สลับอินเทอร์พรีเตอร์ เปิดใช้ดีบักเกอร์ หรือยึดตัวเชื่อมโยงแบบไดนามิกของโพรเซส stdio รายการที่อนุญาตแบบชัดเจนช่วยให้ยังใช้ตัวแปรสภาพแวดล้อมของข้อมูลประจำตัว MCP ทั่วไปได้ (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`) รวมถึงตัวแปรสภาพแวดล้อมพร็อกซีทั่วไปและตัวแปรเฉพาะเซิร์ฟเวอร์ (`HTTP_PROXY`, `*_API_KEY` แบบกำหนดเอง เป็นต้น) คีย์ `AWS_*` อื่น เช่น `AWS_CONFIG_FILE` และ `AWS_SHARED_CREDENTIALS_FILE` ยังคงถูกบล็อก เนื่องจากชี้ไปยังไฟล์ข้อมูลประจำตัวแทนที่จะเก็บค่าข้อมูลประจำตัวโดยตรง

หากเซิร์ฟเวอร์ MCP จำเป็นต้องใช้ตัวแปรที่ถูกบล็อกตัวใดตัวหนึ่งจริง ๆ ให้ตั้งค่าตัวแปรนั้นในโพรเซสโฮสต์ Gateway แทนการตั้งค่าภายใต้ `env` ของเซิร์ฟเวอร์ stdio
</Warning>

### การขนส่งแบบ SSE / HTTP

เชื่อมต่อกับเซิร์ฟเวอร์ MCP ระยะไกลผ่าน HTTP Server-Sent Events

| ฟิลด์                       | คำอธิบาย                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `url`                       | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)                |
| `headers`                   | แมปคีย์-ค่าของส่วนหัว HTTP ที่ไม่บังคับ (เช่น โทเค็นการยืนยันตัวตน) |
| `connectionTimeoutMs`       | ระยะหมดเวลาการเชื่อมต่อต่อเซิร์ฟเวอร์ในหน่วย ms (ไม่บังคับ)                   |
| `requestTimeoutMs`          | ระยะหมดเวลาคำขอ MCP ต่อเซิร์ฟเวอร์ในหน่วยมิลลิวินาที                   |
| `auth: "oauth"`             | ใช้ข้อมูลประจำตัว MCP OAuth ที่บันทึกโดย `openclaw mcp login`          |
| `sslVerify`                 | ตั้งเป็น false เฉพาะสำหรับปลายทาง HTTPS ส่วนตัวที่เชื่อถืออย่างชัดเจนเท่านั้น    |
| `clientCert` / `clientKey`  | เส้นทางใบรับรองและคีย์ไคลเอ็นต์ mTLS                            |
| `supportsParallelToolCalls` | ระบุเป็นนัยว่าเซิร์ฟเวอร์นี้รองรับการเรียกพร้อมกันได้อย่างปลอดภัย              |

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "requestTimeoutMs": 20000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

ค่าที่ละเอียดอ่อนใน `url` (ข้อมูลผู้ใช้) และ `headers` จะถูกปกปิดในบันทึกและเอาต์พุตสถานะ `openclaw mcp doctor` จะแจ้งเตือนเมื่อรายการ `headers` หรือ `env` ที่ดูเหมือนมีข้อมูลละเอียดอ่อนมีค่าตรงตัว เพื่อให้ผู้ดูแลระบบย้ายค่าเหล่านั้นออกจากการกำหนดค่าที่คอมมิตไว้ได้

### ขั้นตอนการทำงาน OAuth

OAuth ใช้สำหรับเซิร์ฟเวอร์ MCP แบบ HTTP ที่ประกาศขั้นตอนการทำงาน MCP OAuth ส่วนหัว `Authorization` แบบคงที่จะถูกเพิกเฉยสำหรับเซิร์ฟเวอร์ขณะที่เปิดใช้งาน `auth: "oauth"` ข้อมูลประจำตัวที่บันทึกโดย `openclaw mcp login` ใช้งานได้กับ MCP แบบฝัง ตัวเรียกใช้ CLI และเซิร์ฟเวอร์แอป Codex ภายในเครื่อง

เซสชัน MCP OAuth แบบเนทีฟอยู่ในฐานข้อมูล SQLite ที่ใช้ร่วมกันและอนุญาตให้เจ้าของเข้าถึงเท่านั้น ณ `<state-dir>/state/openclaw.sqlite` (`mcp_oauth_stores`) แถวข้อมูลอาจมี access token และ refresh token, secret สำหรับการลงทะเบียนไคลเอ็นต์แบบไดนามิก, เมทาดาทาการค้นหา และตัวตรวจสอบ PKCE ชั่วคราว การรีเฟรช การเข้าสู่ระบบ และการออกจากระบบใช้ lease ของ SQLite เดียวกัน เพื่อไม่ให้โพรเซส OpenClaw ที่ทำงานขนานกันใช้ refresh token เดียวกันหรือคืนชีพเซสชันที่ออกจากระบบแล้ว

การอัปเกรดจากที่เก็บ `<state-dir>/mcp-oauth/*.json` ที่เลิกใช้แล้วจะดำเนินการโดย `openclaw doctor --fix` เท่านั้น โค้ดรันไทม์จะไม่อ่าน เขียน หรือย้อนกลับไปใช้ไฟล์เหล่านั้น

จนกว่าจะมีข้อมูลประจำตัว OpenClaw จะละเฉพาะเซิร์ฟเวอร์ MCP นั้นออกจากรันไทม์ของเอเจนต์ แทนที่จะทำให้รอบการทำงานของเอเจนต์ล้มเหลว จากนั้นผู้ดูแลระบบหรือเอเจนต์ที่มีสิทธิ์เข้าถึงเชลล์สามารถเรียกใช้ `openclaw mcp login <name>` และใช้เซิร์ฟเวอร์ในรอบถัดไปได้

หากเซิร์ฟเวอร์ปฏิเสธโทเค็นด้วย `insufficient_scope` OpenClaw จะรักษาขอบเขตที่ร้องขอไว้และขอให้ใช้ `openclaw mcp login <name>` แทนการรีเฟรชซ้ำซึ่งไม่สามารถให้ขอบเขตใหม่ได้ การเข้าสู่ระบบดังกล่าวจะเริ่มคำขออนุญาตใหม่ โดยเก็บโทเค็นเดิมไว้จนกว่าจะบันทึกข้อมูลประจำตัวชุดใหม่

เมื่อบริการ MCP ระยะไกลมีโปรไฟล์การยืนยันตัวตน OpenClaw แยกต่างหากที่รองรับการรีเฟรชอยู่แล้ว สามารถตั้งค่า `oauth.authProfileId` เพิ่มเติมได้ OpenClaw จะรีเฟรชแหล่งข้อมูลประจำตัวแหล่งใดแหล่งหนึ่งก่อนฉายข้อมูลไปยังรันไทม์ และส่งต่อเฉพาะ access token ปัจจุบันไปยังไคลเอ็นต์ MCP ปลายทาง

<Steps>
  <Step title="บันทึกเซิร์ฟเวอร์">
    เพิ่มหรืออัปเดตเซิร์ฟเวอร์ด้วย `auth: "oauth"` และเมทาดาทา OAuth ที่ไม่บังคับ

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    สำหรับ bearer ที่รองรับด้วยโปรไฟล์การยืนยันตัวตน ให้บันทึกการผูกโปรไฟล์:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="เริ่มเข้าสู่ระบบ">
    เรียกใช้คำสั่งเข้าสู่ระบบเพื่อสร้างคำขอการอนุญาต

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw จะแสดง URL สำหรับการอนุญาตและจัดเก็บสถานะตัวตรวจสอบ OAuth ชั่วคราวไว้ใน SQLite ที่ใช้ร่วมกัน

  </Step>
  <Step title="ดำเนินการให้เสร็จด้วยรหัส">
    หลังจากอนุมัติในเบราว์เซอร์แล้ว ให้ส่งรหัสที่ได้รับกลับไปยัง OpenClaw

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="ตรวจสอบการอนุญาต">
    ใช้ status หรือ doctor เพื่อยืนยันว่ามีโทเค็นอยู่และไม่ต้องมีการอนุญาตเพิ่มเติม หาก status รายงาน `authorization-required` หรือ doctor ขอการอนุญาตเพิ่มเติม ให้เรียกใช้ `openclaw mcp login <name>` อีกครั้ง

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="ล้างข้อมูลประจำตัว">
    การออกจากระบบจะลบข้อมูลประจำตัว OAuth ที่จัดเก็บไว้ แต่ยังคงเก็บข้อกำหนดเซิร์ฟเวอร์ที่บันทึกไว้

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

หากผู้ให้บริการหมุนเวียนโทเค็นหรือสถานะการอนุญาตค้าง ให้เรียกใช้ `openclaw mcp logout <name>` แล้วทำ `login` ซ้ำ `logout` สามารถล้างข้อมูลประจำตัวของเซิร์ฟเวอร์ HTTP ที่บันทึกไว้ได้ แม้ว่า `auth: "oauth"` จะถูกนำออกจากการกำหนดค่าแล้ว ตราบใดที่ชื่อและ URL ของเซิร์ฟเวอร์ยังระบุรายการในที่เก็บข้อมูลประจำตัวได้

### การรับส่งข้อมูล HTTP แบบสตรีมได้

`streamable-http` เป็นตัวเลือกการรับส่งข้อมูลเพิ่มเติมนอกเหนือจาก `sse` และ `stdio` โดยใช้การสตรีม HTTP เพื่อสื่อสารแบบสองทิศทางกับเซิร์ฟเวอร์ MCP ระยะไกล

| ฟิลด์                       | คำอธิบาย                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `url`                       | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)                                      |
| `transport`                 | ตั้งค่าเป็น `"streamable-http"` เพื่อเลือกการรับส่งข้อมูลนี้ หากละไว้ OpenClaw จะใช้ `sse` |
| `headers`                   | แมปคีย์-ค่าของส่วนหัว HTTP ที่ระบุหรือไม่ก็ได้ (ตัวอย่างเช่น โทเค็นการยืนยันตัวตน)                       |
| `connectionTimeoutMs`       | ระยะหมดเวลาการเชื่อมต่อต่อเซิร์ฟเวอร์เป็น ms (ระบุหรือไม่ก็ได้)                                         |
| `requestTimeoutMs`          | ระยะหมดเวลาคำขอ MCP ต่อเซิร์ฟเวอร์เป็นมิลลิวินาที                                         |
| `auth: "oauth"`             | ใช้ข้อมูลประจำตัว MCP OAuth ที่บันทึกโดย `openclaw mcp login`                                |
| `sslVerify`                 | ตั้งค่าเป็น false เฉพาะสำหรับปลายทาง HTTPS ส่วนตัวที่เชื่อถืออย่างชัดเจนเท่านั้น                          |
| `clientCert` / `clientKey`  | พาธใบรับรองและคีย์ไคลเอนต์ mTLS                                                  |
| `supportsParallelToolCalls` | ระบุว่าการเรียกพร้อมกันสำหรับเซิร์ฟเวอร์นี้มีความปลอดภัย                                    |

การกำหนดค่า OpenClaw ใช้ `transport: "streamable-http"` เป็นรูปแบบการสะกดมาตรฐาน ค่า MCP `type: "http"` แบบเนทีฟของ CLI จะได้รับการยอมรับเมื่อบันทึกผ่าน `openclaw mcp set` และจะได้รับการซ่อมแซมโดย `openclaw doctor --fix` ในการกำหนดค่าที่มีอยู่ แต่ `transport` คือค่าที่ OpenClaw แบบฝังใช้โดยตรง

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "requestTimeoutMs": 30000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
คำสั่งรีจิสทรีจะไม่เริ่มบริดจ์ช่องทาง เฉพาะ `probe` และ `doctor --probe` เท่านั้นที่เปิดเซสชันไคลเอนต์ MCP สดเพื่อพิสูจน์ว่าสามารถเข้าถึงเซิร์ฟเวอร์เป้าหมายได้
</Note>

## UI ควบคุม

UI ควบคุมบนเบราว์เซอร์มีหน้าการตั้งค่า MCP โดยเฉพาะที่ `/settings/mcp`; พาธเดิม `/mcp` ยังคงเป็นนามแฝง หน้านี้แสดงจำนวนเซิร์ฟเวอร์ที่กำหนดค่า สรุปสถานะเปิดใช้งาน/OAuth/ตัวกรอง แถวการรับส่งข้อมูลของแต่ละเซิร์ฟเวอร์ ตัวควบคุมการเปิด/ปิดใช้งาน คำสั่ง CLI ที่ใช้บ่อย และตัวแก้ไขแบบกำหนดขอบเขตสำหรับส่วนการกำหนดค่า `mcp`

ใช้หน้านี้สำหรับการแก้ไขโดยผู้ปฏิบัติงานและการตรวจสอบรายการอย่างรวดเร็ว ใช้ `openclaw mcp doctor --probe` หรือ `openclaw mcp probe` เมื่อต้องการหลักฐานเซิร์ฟเวอร์สด

ขั้นตอนการทำงานของผู้ปฏิบัติงาน:

1. เปิด UI ควบคุมและเลือก **MCP**
2. ตรวจสอบการ์ดสรุปสำหรับเซิร์ฟเวอร์ทั้งหมด เซิร์ฟเวอร์ที่เปิดใช้งาน เซิร์ฟเวอร์ OAuth และเซิร์ฟเวอร์ที่กรอง
3. ใช้แต่ละแถวของเซิร์ฟเวอร์เพื่อดูคำแนะนำเกี่ยวกับการรับส่งข้อมูล การยืนยันตัวตน ตัวกรอง ระยะหมดเวลา และคำสั่ง
4. สลับการเปิดใช้งานเมื่อต้องการเก็บข้อกำหนดไว้แต่ไม่รวมไว้ในการค้นพบขณะรันไทม์
5. แก้ไขส่วนการกำหนดค่า `mcp` แบบกำหนดขอบเขตสำหรับการเปลี่ยนแปลงโครงสร้าง เช่น เซิร์ฟเวอร์ใหม่ ส่วนหัว TLS ข้อมูลเมตา OAuth หรือตัวกรองเครื่องมือ
6. เลือก **Save** เพื่อคงการกำหนดค่าไว้เท่านั้น หรือ **Save & Publish** เพื่อนำไปใช้ผ่านพาธการกำหนดค่า Gateway
7. เรียกใช้ `openclaw mcp doctor --probe` เมื่อต้องการหลักฐานสดว่าเซิร์ฟเวอร์ที่แก้ไขสามารถเริ่มทำงานและแสดงรายการเครื่องมือได้

หมายเหตุ:

- ส่วนย่อยคำสั่งจะใส่เครื่องหมายอัญประกาศรอบชื่อเซิร์ฟเวอร์ เพื่อให้ชื่อที่ไม่ปกติยังคงคัดลอกไปใช้ในเชลล์ได้
- ค่าที่แสดงซึ่งมีลักษณะคล้าย URL จะถูกปกปิดก่อนเรนเดอร์เมื่อมีข้อมูลประจำตัวฝังอยู่
- หน้านี้ไม่เริ่มการรับส่งข้อมูล MCP ด้วยตัวเอง
- รันไทม์ที่ทำงานอยู่อาจต้องใช้ `openclaw mcp reload` การเผยแพร่การกำหนดค่า Gateway หรือการเริ่มกระบวนการใหม่ ทั้งนี้ขึ้นอยู่กับว่ากระบวนการใดเป็นเจ้าของไคลเอนต์ MCP

## แอป MCP

OpenClaw สามารถเรนเดอร์เครื่องมือที่ใช้งาน [ส่วนขยาย MCP Apps](https://modelcontextprotocol.io/extensions/apps) ที่เสถียรได้ แอปเป็นแบบเลือกใช้ เนื่องจาก HTML มาจากเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้และสามารถขอเครื่องมือหรือทรัพยากรที่แอปมองเห็นได้จากเซิร์ฟเวอร์เดียวกัน

เปิดใช้งานบริดจ์โฮสต์:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

เริ่ม Gateway ใหม่หลังจากเปลี่ยนการตั้งค่านี้ เมื่อเปิดใช้งาน OpenClaw จะเริ่มตัวรับฟัง HTTP(S) สำหรับแซนด์บ็อกซ์เท่านั้นบนพอร์ต Gateway บวกหนึ่ง (สำหรับ Gateway เริ่มต้นคือ `18790`) UI ควบคุมจะโหลดแอปจากต้นทางแยกต่างหากนั้น ตัวรับฟังจะไม่ให้บริการ UI ควบคุม เส้นทาง Gateway ที่ผ่านการยืนยันตัวตน หรือข้อมูลผู้ใช้

การเชื่อมต่อ Gateway โดยตรงจำเป็นต้องเข้าถึงทั้งสองพอร์ต หากพร็อกซีย้อนกลับหรือตัวยุติ TLS เปิดเผย UI ควบคุม ให้กำหนดต้นทางสาธารณะเฉพาะสำหรับแอปและพร็อกซีเฉพาะต้นทางนั้นไปยังตัวรับฟังแซนด์บ็อกซ์:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

ต้นทางแซนด์บ็อกซ์ต้องแตกต่างจากต้นทางของ UI ควบคุม อย่าโฮสต์เนื้อหาอื่นที่ผ่านการยืนยันตัวตนหรือมีความละเอียดอ่อนบนต้นทางนั้น

ตัวอย่างเช่น สามารถกำหนดค่าเดโม React พื้นฐานอย่างเป็นทางการได้ดังนี้:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

พฤติกรรมและขอบเขตความปลอดภัย:

- OpenClaw ประกาศส่วนขยาย `io.modelcontextprotocol/ui` เฉพาะเมื่อเปิดใช้งานแอปเท่านั้น
- เรนเดอร์เฉพาะทรัพยากร `ui://` ที่มีชนิด MIME ตรงกับ `text/html;profile=mcp-app` เท่านั้น
- ทรัพยากร UI จำกัดไว้ที่ 2 MiB วางไว้หลังพร็อกซี iframe สองชั้นบนต้นทางภายนอกโดยเฉพาะ โหลดลงในต้นทางแอปภายในแบบทึบ และถูกจำกัดด้วย CSP ที่ได้มาจากข้อมูลเมตาของทรัพยากร
- เครื่องมือสำหรับแอปเท่านั้น (`_meta.ui.visibility: ["app"]`) จะไม่ปรากฏในรายการเครื่องมือของโมเดล แอปสามารถเรียกได้เฉพาะเครื่องมือที่แอปมองเห็นได้บนเซิร์ฟเวอร์เจ้าของ ซึ่งผ่านนโยบายเครื่องมือ OpenClaw ที่มีผลสำหรับการทำงานที่สร้างมุมมองนั้นด้วย
- สิทธิ์ของแอปที่ผูกกับต้นทาง เช่น กล้อง ไมโครโฟน และตำแหน่งทางภูมิศาสตร์ จะไม่ได้รับอนุญาตขณะที่เอกสารแอปภายในใช้ต้นทางแบบทึบเพื่อแยกแอปออกจากกัน
- HTML ของแอป อาร์กิวเมนต์เครื่องมือแบบสมบูรณ์ และผลลัพธ์ดิบจะอยู่ในสัญญาเช่ามุมมองในหน่วยความจำที่มีขอบเขตเป็นเวลา 10 นาที และจะไม่ถูกเขียนลงดิสก์หรือคัดลอกไปยังข้อมูลเมตาตัวอย่างทรานสคริปต์ ทรานสคริปต์จัดเก็บเฉพาะตัวอธิบายเซิร์ฟเวอร์/เครื่องมือ/ทรัพยากรที่มีขอบเขตและผูกกับ ID การเรียกเครื่องมือเดิม หลังจาก Gateway เริ่มใหม่ UI ควบคุมสามารถตรวจสอบตัวอธิบายนั้นกับทรานสคริปต์เซสชันที่ผ่านการยืนยันตัวตน และดึงทรัพยากร `ui://` อีกครั้ง มุมมองที่สร้างขึ้นใหม่จะเป็นแบบอ่านอย่างเดียวจนกว่าการทำงานใหม่จะกำหนดสิทธิ์เครื่องมือปัจจุบัน
- ในการสนทนาผ่านช่องทาง มุมมองแอปที่สำเร็จล่าสุดในแต่ละเทิร์นจะเพิ่มการดำเนินการลักษณะ **เปิดแอป** หนึ่งรายการลงในการตอบกลับสุดท้ายของผู้ช่วย DM ของ Telegram ใช้ปุ่ม Mini App แบบเนทีฟ ส่วน Slack และ Discord เรนเดอร์การดำเนินการแบบพกพาเดียวกันเป็นลิงก์ ช่องทางอื่นจะคงข้อความตอบกลับเดิมและต่อท้ายด้วยลิงก์ HTTPS ที่เข้าใจได้
- ลิงก์เปิดผ่านช่องทางพร้อมใช้งานเฉพาะเมื่อการเปิดเผย Gateway ผ่าน Tailscale ได้เตรียมต้นทาง HTTPS ที่เผยแพร่แล้ว `gateway.tailscale.mode: "serve"` เข้าถึงได้เฉพาะจาก tailnet ส่วน `"funnel"` เข้าถึงได้จากอินเทอร์เน็ตสาธารณะ Funnel ที่จัดการจากภายนอกและเก็บรักษาโดย `gateway.tailscale.preserveFunnel` จะถือว่าเข้าถึงได้จากอินเทอร์เน็ตเช่นกัน ดู [Tailscale](/th/gateway/tailscale)
- ตั๋วเปิดเป็นแบบทึบ สร้างขึ้นเฉพาะขณะจัดทำการตอบกลับสุดท้ายของช่องทาง และหมดอายุภายในไม่เกิน 2 นาทีหรือเมื่อสัญญาเช่ามุมมองพื้นฐานหมดอายุ แล้วแต่ว่าอย่างใดจะเกิดขึ้นก่อน URL ไม่มีข้อมูลประจำตัว bearer ของ Gateway คีย์เซสชัน ข้อมูลเมตามุมมอง HTML ของแอป อินพุตเครื่องมือ หรือผลลัพธ์เครื่องมือ
- หากไม่มีต้นทางที่เผยแพร่หรือความจุสำหรับตั๋ว มุมมองหรือตั๋วหมดอายุ หรือการรับส่งข้อมูลไม่สามารถเรนเดอร์ตัวควบคุมแบบเนทีฟได้ ข้อความเดิมของผู้ช่วยจะยังคงพร้อมใช้งาน UI ควบคุมจะคงแคนวาสแอปแบบอินไลน์ที่มีอยู่และจะไม่ได้รับการดำเนินการเปิดที่ซ้ำกัน
- `openclaw security audit` จะแสดงคำเตือนขณะที่บริดจ์เปิดใช้งานอยู่ ปิดใช้งานด้วย `openclaw config set mcp.apps.enabled false --strict-json` เมื่อไม่จำเป็น

## ขีดจำกัดปัจจุบัน

หน้านี้จัดทำเอกสารเกี่ยวกับบริดจ์ตามที่เผยแพร่ในปัจจุบัน

ขีดจำกัดปัจจุบัน:

- การค้นพบการสนทนาขึ้นอยู่กับข้อมูลเมตาเส้นทางเซสชัน Gateway ที่มีอยู่
- ยังไม่มีโปรโตคอลพุชทั่วไปนอกเหนือจากอะแดปเตอร์เฉพาะ Claude
- ยังไม่มีเครื่องมือแก้ไขข้อความหรือแสดงปฏิกิริยา
- การรับส่งข้อมูล HTTP/SSE/streamable-http เชื่อมต่อกับเซิร์ฟเวอร์ระยะไกลเพียงเครื่องเดียว ยังไม่มีอัปสตรีมแบบมัลติเพล็กซ์
- `permissions_list_open` รวมเฉพาะการอนุมัติที่ตรวจพบขณะที่บริดจ์เชื่อมต่ออยู่

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin](/th/cli/plugins)
