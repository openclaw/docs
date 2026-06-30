---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นกับช่องทางที่รองรับโดย OpenClaw
    - กำลังเรียกใช้ `openclaw mcp serve`
    - การจัดการนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw บันทึกไว้
sidebarTitle: MCP
summary: เปิดให้เข้าถึงการสนทนาในช่องทางของ OpenClaw ผ่าน MCP และจัดการนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:40:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` มีหน้าที่สองอย่าง:

- เรียกใช้ OpenClaw เป็นเซิร์ฟเวอร์ MCP ด้วย `openclaw mcp serve`
- จัดการคำจำกัดความเซิร์ฟเวอร์ MCP ขาออกที่ OpenClaw จัดการด้วย `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` และ `unset`

กล่าวอีกอย่างคือ:

- `serve` คือ OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ MCP
- คำสั่งย่อยอื่นคือ OpenClaw ทำหน้าที่เป็นรีจิสทรีฝั่งไคลเอนต์ MCP สำหรับเซิร์ฟเวอร์ MCP ที่รันไทม์ของ OpenClaw อาจใช้ภายหลัง

<Note>
  `list`, `show`, `set` และ `unset` อ่านและเขียนเฉพาะรายการ `mcp.servers` ที่ OpenClaw จัดการในค่ากำหนด OpenClaw เท่านั้น คำสั่งเหล่านี้ไม่รวมเซิร์ฟเวอร์ mcporter จาก `config/mcporter.json`; ใช้ `mcporter list` สำหรับรีจิสทรีนั้น
</Note>

ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชันฮาร์เนสเขียนโค้ดด้วยตัวเองและกำหนดเส้นทางรันไทม์นั้นผ่าน ACP

## เลือกเส้นทาง MCP ที่ถูกต้อง

OpenClaw มีพื้นผิว MCP หลายแบบ เลือกแบบที่ตรงกับว่าใครเป็นเจ้าของรันไทม์เอเจนต์และใครเป็นเจ้าของเครื่องมือ

| เป้าหมาย                                                                | ใช้                                                                  | เหตุผล                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ให้ไคลเอนต์ MCP ภายนอกอ่าน/ส่งบทสนทนาช่องทางของ OpenClaw | `openclaw mcp serve`                                                 | OpenClaw เป็นเซิร์ฟเวอร์ MCP และเปิดเผยบทสนทนาที่หนุนด้วย Gateway ผ่าน stdio                                 |
| บันทึกเซิร์ฟเวอร์ MCP ของบุคคลที่สามสำหรับการรันเอเจนต์ที่ OpenClaw จัดการ        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw เป็นรีจิสทรีฝั่งไคลเอนต์ MCP และภายหลังจะฉายเซิร์ฟเวอร์เหล่านั้นเข้าไปในรันไทม์ที่มีสิทธิ์               |
| ตรวจสอบเซิร์ฟเวอร์ที่บันทึกไว้โดยไม่ต้องรันเทิร์นของเอเจนต์                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` และ `doctor` ตรวจสอบค่ากำหนด; `probe` เปิดการเชื่อมต่อ MCP สดและแสดงรายการความสามารถ               |
| แก้ไขค่ากำหนด MCP จากเบราว์เซอร์                                      | Control UI `/mcp`                                                    | หน้านี้แสดงสินค้าคงคลัง การเปิดใช้งาน สรุป OAuth/ตัวกรอง คำใบ้คำสั่ง และตัวแก้ไข `mcp` แบบจำกัดขอบเขต         |
| ให้ app-server ของ Codex มีเซิร์ฟเวอร์ MCP เนทีฟแบบจำกัดขอบเขต                    | `mcp.servers.<name>.codex`                                           | บล็อก `codex` ส่งผลเฉพาะต่อการฉายเธรด app-server ของ Codex และจะถูกตัดออกก่อนส่งต่อค่ากำหนดเนทีฟ |
| รันเซสชันฮาร์เนสที่โฮสต์ด้วย ACP                                     | [`openclaw acp`](/th/cli/acp) และ [เอเจนต์ ACP](/th/tools/acp-agents-setup) | โหมดบริดจ์ ACP ไม่รับการฉีดเซิร์ฟเวอร์ MCP รายเซสชัน; ให้กำหนดค่าบริดจ์ Gateway/Plugin แทน     |

<Tip>
หากคุณไม่แน่ใจว่าต้องใช้เส้นทางใด ให้เริ่มด้วย `openclaw mcp status --verbose` คำสั่งนี้แสดงสิ่งที่ OpenClaw บันทึกไว้โดยไม่เริ่มเซิร์ฟเวอร์ MCP ใดๆ
</Tip>

## OpenClaw เป็นเซิร์ฟเวอร์ MCP

นี่คือเส้นทาง `openclaw mcp serve`

### เมื่อใดควรใช้ `serve`

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือไคลเอนต์ MCP อื่นควรคุยโดยตรงกับบทสนทนาช่องทางที่หนุนด้วย OpenClaw
- คุณมี OpenClaw Gateway แบบภายในเครื่องหรือระยะไกลพร้อมเซสชันที่กำหนดเส้นทางแล้ว
- คุณต้องการเซิร์ฟเวอร์ MCP เดียวที่ทำงานได้ข้ามแบ็กเอนด์ช่องทางของ OpenClaw แทนการรันบริดจ์แยกตามแต่ละช่องทาง

ใช้ [`openclaw acp`](/th/cli/acp) แทนเมื่อ OpenClaw ควรโฮสต์รันไทม์เขียนโค้ดด้วยตัวเองและเก็บเซสชันเอเจนต์ไว้ภายใน OpenClaw

### วิธีทำงาน

`openclaw mcp serve` เริ่มเซิร์ฟเวอร์ MCP แบบ stdio ไคลเอนต์ MCP เป็นเจ้าของโปรเซสนั้น ขณะที่ไคลเอนต์เปิดเซสชัน stdio ไว้ บริดจ์จะเชื่อมต่อกับ OpenClaw Gateway ภายในเครื่องหรือระยะไกลผ่าน WebSocket และเปิดเผยบทสนทนาช่องทางที่กำหนดเส้นทางผ่าน MCP

<Steps>
  <Step title="ไคลเอนต์สร้างบริดจ์">
    ไคลเอนต์ MCP สร้าง `openclaw mcp serve`
  </Step>
  <Step title="บริดจ์เชื่อมต่อกับ Gateway">
    บริดจ์เชื่อมต่อกับ OpenClaw Gateway ผ่าน WebSocket
  </Step>
  <Step title="เซสชันกลายเป็นบทสนทนา MCP">
    เซสชันที่กำหนดเส้นทางแล้วกลายเป็นบทสนทนา MCP และเครื่องมือทรานสคริปต์/ประวัติ
  </Step>
  <Step title="คิวเหตุการณ์สด">
    เหตุการณ์สดจะถูกจัดคิวไว้ในหน่วยความจำขณะที่บริดจ์เชื่อมต่ออยู่
  </Step>
  <Step title="การพุช Claude แบบไม่บังคับ">
    หากเปิดใช้งานโหมดช่องทาง Claude เซสชันเดียวกันยังสามารถรับการแจ้งเตือนแบบพุชเฉพาะ Claude ได้ด้วย
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พฤติกรรมสำคัญ">
    - สถานะคิวสดเริ่มเมื่อบริดจ์เชื่อมต่อ
    - ประวัติทรานสคริปต์เก่ากว่าจะถูกอ่านด้วย `messages_read`
    - การแจ้งเตือนแบบพุชของ Claude มีอยู่เฉพาะขณะที่เซสชัน MCP ยังมีชีวิตอยู่
    - เมื่อไคลเอนต์ตัดการเชื่อมต่อ บริดจ์จะออกและคิวสดจะหายไป
    - จุดเข้าเอเจนต์แบบครั้งเดียว เช่น `openclaw agent` และ `openclaw infer model run` จะเลิกใช้รันไทม์ MCP ที่บันเดิลไว้ซึ่งเปิดขึ้นเมื่อการตอบกลับเสร็จสิ้น ดังนั้นการรันสคริปต์ซ้ำจะไม่สะสมโปรเซสลูก MCP แบบ stdio
    - เซิร์ฟเวอร์ MCP แบบ stdio ที่ OpenClaw เปิดใช้ (บันเดิลหรือผู้ใช้กำหนดค่า) จะถูกปิดเป็นแผนผังโปรเซสเมื่อปิดระบบ ดังนั้นซับโปรเซสลูกที่เซิร์ฟเวอร์เริ่มจะไม่คงอยู่หลังไคลเอนต์ stdio แม่ออก
    - การลบหรือรีเซ็ตเซสชันจะกำจัดไคลเอนต์ MCP ของเซสชันนั้นผ่านเส้นทางล้างข้อมูลรันไทม์ร่วม ดังนั้นจะไม่มีการเชื่อมต่อ stdio ค้างอยู่ที่ผูกกับเซสชันที่ถูกลบ

  </Accordion>
</AccordionGroup>

### เลือกโหมดไคลเอนต์

ใช้บริดจ์เดียวกันได้สองวิธี:

<Tabs>
  <Tab title="ไคลเอนต์ MCP ทั่วไป">
    เฉพาะเครื่องมือ MCP มาตรฐาน ใช้ `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` และเครื่องมืออนุมัติ
  </Tab>
  <Tab title="Claude Code">
    เครื่องมือ MCP มาตรฐานพร้อมอะแดปเตอร์ช่องทางเฉพาะ Claude เปิดใช้ `--claude-channel-mode on` หรือปล่อยค่าเริ่มต้นเป็น `auto`
  </Tab>
</Tabs>

<Note>
วันนี้ `auto` ทำงานเหมือนกับ `on` ยังไม่มีการตรวจจับความสามารถของไคลเอนต์
</Note>

### สิ่งที่ `serve` เปิดเผย

บริดจ์ใช้เมทาดาทาเส้นทางเซสชันของ Gateway ที่มีอยู่เพื่อเปิดเผยบทสนทนาที่หนุนด้วยช่องทาง บทสนทนาจะปรากฏเมื่อ OpenClaw มีสถานะเซสชันพร้อมเส้นทางที่รู้จักอยู่แล้ว เช่น:

- `channel`
- เมทาดาทาผู้รับหรือปลายทาง
- `accountId` แบบไม่บังคับ
- `threadId` แบบไม่บังคับ

สิ่งนี้ให้ไคลเอนต์ MCP มีที่เดียวสำหรับ:

- แสดงรายการบทสนทนาล่าสุดที่กำหนดเส้นทางแล้ว
- อ่านประวัติทรานสคริปต์ล่าสุด
- รอเหตุการณ์ขาเข้าใหม่
- ส่งคำตอบกลับผ่านเส้นทางเดียวกัน
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
  <Tab title="ละเอียด / ปิด Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### เครื่องมือบริดจ์

บริดจ์ปัจจุบันเปิดเผยเครื่องมือ MCP เหล่านี้:

<AccordionGroup>
  <Accordion title="conversations_list">
    แสดงรายการบทสนทนาล่าสุดที่หนุนด้วยเซสชันและมีเมทาดาทาเส้นทางในสถานะเซสชัน Gateway อยู่แล้ว

    ตัวกรองที่มีประโยชน์:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    ส่งคืนบทสนทนาหนึ่งรายการตาม `session_key` โดยใช้การค้นหาเซสชัน Gateway โดยตรง
  </Accordion>
  <Accordion title="messages_read">
    อ่านข้อความทรานสคริปต์ล่าสุดสำหรับบทสนทนาที่หนุนด้วยเซสชันหนึ่งรายการ
  </Accordion>
  <Accordion title="attachments_fetch">
    แยกบล็อกเนื้อหาข้อความที่ไม่ใช่ข้อความจากข้อความทรานสคริปต์หนึ่งรายการ นี่เป็นมุมมองเมทาดาทาบนเนื้อหาทรานสคริปต์ ไม่ใช่ที่เก็บบล็อบไฟล์แนบถาวรแบบสแตนด์อโลน
  </Accordion>
  <Accordion title="events_poll">
    อ่านเหตุการณ์สดที่จัดคิวไว้ตั้งแต่เคอร์เซอร์ตัวเลข
  </Accordion>
  <Accordion title="events_wait">
    ลองโพลจนกว่าเหตุการณ์ที่จัดคิวไว้ซึ่งตรงกันรายการถัดไปจะมาถึงหรือหมดเวลา

    ใช้สิ่งนี้เมื่อไคลเอนต์ MCP ทั่วไปต้องการการส่งมอบใกล้เรียลไทม์โดยไม่มีโปรโตคอลพุชเฉพาะ Claude

  </Accordion>
  <Accordion title="messages_send">
    ส่งข้อความกลับผ่านเส้นทางเดียวกันที่บันทึกไว้ในเซสชันแล้ว

    พฤติกรรมปัจจุบัน:

    - ต้องมีเส้นทางบทสนทนาที่มีอยู่
    - ใช้ช่องทาง ผู้รับ รหัสบัญชี และรหัสเธรดของเซสชัน
    - ส่งเฉพาะข้อความ

  </Accordion>
  <Accordion title="permissions_list_open">
    แสดงรายการคำขออนุมัติ exec/Plugin ที่รอดำเนินการซึ่งบริดจ์สังเกตเห็นตั้งแต่เชื่อมต่อกับ Gateway
  </Accordion>
  <Accordion title="permissions_respond">
    แก้ไขคำขออนุมัติ exec/Plugin ที่รอดำเนินการหนึ่งรายการด้วย:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### โมเดลเหตุการณ์

บริดจ์เก็บคิวเหตุการณ์ในหน่วยความจำขณะที่เชื่อมต่ออยู่

ประเภทเหตุการณ์ปัจจุบัน:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- คิวเป็นแบบสดเท่านั้น; เริ่มเมื่อบริดจ์ MCP เริ่ม
- `events_poll` และ `events_wait` ไม่เล่นประวัติ Gateway เก่าซ้ำด้วยตัวเอง
- แบ็กล็อกถาวรควรอ่านด้วย `messages_read`

</Warning>

### การแจ้งเตือนช่องทาง Claude

บริดจ์ยังสามารถเปิดเผยการแจ้งเตือนช่องทางเฉพาะ Claude ได้ด้วย นี่คือสิ่งเทียบเท่าอะแดปเตอร์ช่องทาง Claude Code ของ OpenClaw: เครื่องมือ MCP มาตรฐานยังคงใช้ได้ แต่ข้อความขาเข้าสดสามารถมาถึงเป็นการแจ้งเตือน MCP เฉพาะ Claude ได้ด้วย

<Tabs>
  <Tab title="ปิด">
    `--claude-channel-mode off`: เฉพาะเครื่องมือ MCP มาตรฐาน
  </Tab>
  <Tab title="เปิด">
    `--claude-channel-mode on`: เปิดใช้การแจ้งเตือนช่องทาง Claude
  </Tab>
  <Tab title="auto (ค่าเริ่มต้น)">
    `--claude-channel-mode auto`: ค่าเริ่มต้นปัจจุบัน; พฤติกรรมบริดจ์เดียวกับ `on`
  </Tab>
</Tabs>

เมื่อเปิดใช้โหมดช่องทาง Claude เซิร์ฟเวอร์จะประกาศความสามารถแบบทดลองของ Claude และสามารถปล่อย:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

พฤติกรรมบริดจ์ปัจจุบัน:

- ข้อความทรานสคริปต์ขาเข้า `user` ถูกส่งต่อเป็น `notifications/claude/channel`
- คำขอสิทธิ์ของ Claude ที่ได้รับผ่าน MCP ถูกติดตามในหน่วยความจำ
- หากเจ้าของคำสั่งในบทสนทนาที่เชื่อมโยงส่ง `yes abcde` หรือ `no abcde` ภายหลัง บริดจ์จะแปลงสิ่งนั้นเป็น `notifications/claude/channel/permission`
- การแจ้งเตือนเหล่านี้เป็นแบบเซสชันสดเท่านั้น; หากไคลเอนต์ MCP ตัดการเชื่อมต่อ จะไม่มีเป้าหมายพุช

สิ่งนี้ตั้งใจให้เฉพาะไคลเอนต์ ไคลเอนต์ MCP ทั่วไปควรพึ่งพาเครื่องมือโพลมาตรฐาน

### ค่ากำหนดไคลเอนต์ MCP

ตัวอย่างค่ากำหนดไคลเอนต์ stdio:

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

สำหรับไคลเอนต์ MCP ทั่วไปส่วนใหญ่ ให้เริ่มด้วยพื้นผิวเครื่องมือมาตรฐานและละเว้นโหมด Claude เปิดโหมด Claude เฉพาะสำหรับไคลเอนต์ที่เข้าใจวิธีการแจ้งเตือนเฉพาะ Claude จริงๆ

### ตัวเลือก

`openclaw mcp serve` รองรับ:

<ParamField path="--url" type="string">
  URL WebSocket ของ Gateway
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
  โหมดการแจ้งเตือนของ Claude
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  บันทึกแบบละเอียดบน stderr
</ParamField>

<Tip>
ควรใช้ `--token-file` หรือ `--password-file` แทนความลับแบบอินไลน์เมื่อทำได้
</Tip>

### ความปลอดภัยและขอบเขตความเชื่อถือ

บริดจ์ไม่ได้สร้างการกำหนดเส้นทางขึ้นเอง บริดจ์เปิดเผยเฉพาะการสนทนาที่ Gateway รู้วิธีกำหนดเส้นทางอยู่แล้วเท่านั้น

นั่นหมายความว่า:

- allowlist ของผู้ส่ง การจับคู่ และความเชื่อถือระดับช่องทางยังคงเป็นของการกำหนดค่าช่องทาง OpenClaw พื้นฐาน
- `messages_send` ตอบกลับได้เฉพาะผ่านเส้นทางที่จัดเก็บไว้แล้ว
- สถานะการอนุมัติเป็นแบบสด/อยู่ในหน่วยความจำเท่านั้นสำหรับเซสชันบริดจ์ปัจจุบัน
- การยืนยันตัวตนของบริดจ์ควรใช้การควบคุมโทเค็นหรือรหัสผ่าน Gateway แบบเดียวกับที่คุณไว้วางใจสำหรับไคลเอนต์ Gateway ระยะไกลอื่น ๆ

หากการสนทนาหายไปจาก `conversations_list` สาเหตุปกติมักไม่ใช่การกำหนดค่า MCP แต่เป็นข้อมูลเมตาเส้นทางที่ขาดหายหรือไม่สมบูรณ์ในเซสชัน Gateway พื้นฐาน

### การทดสอบ

OpenClaw มาพร้อม Docker smoke แบบกำหนดผลได้สำหรับบริดจ์นี้:

```bash
pnpm test:docker:mcp-channels
```

smoke นี้:

- เริ่มคอนเทนเนอร์ Gateway ที่ seed ไว้
- เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve`
- ตรวจสอบการค้นพบการสนทนา การอ่านทรานสคริปต์ การอ่านข้อมูลเมตาไฟล์แนบ พฤติกรรมคิวเหตุการณ์สด และการกำหนดเส้นทางการส่งออก
- ตรวจสอบการแจ้งเตือนช่องทางและสิทธิ์สไตล์ Claude ผ่านบริดจ์ stdio MCP จริง

นี่เป็นวิธีที่เร็วที่สุดในการพิสูจน์ว่าบริดจ์ทำงานได้โดยไม่ต้องเชื่อมบัญชี Telegram, Discord หรือ iMessage จริงเข้ากับการรันทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น โปรดดู [การทดสอบ](/th/help/testing)

### การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการส่งคืนการสนทนา">
    โดยปกติหมายถึงเซสชัน Gateway ยังไม่สามารถกำหนดเส้นทางได้อยู่แล้ว ให้ยืนยันว่าเซสชันพื้นฐานมีข้อมูลเมตาเส้นทางช่องทาง/ผู้ให้บริการ ผู้รับ และบัญชี/เธรดที่ไม่บังคับจัดเก็บไว้
  </Accordion>
  <Accordion title="events_poll หรือ events_wait พลาดข้อความเก่า">
    เป็นไปตามที่คาดไว้ คิวสดเริ่มเมื่อบริดจ์เชื่อมต่อ อ่านประวัติทรานสคริปต์เก่าด้วย `messages_read`
  </Accordion>
  <Accordion title="การแจ้งเตือน Claude ไม่ปรากฏ">
    ตรวจสอบทั้งหมดนี้:

    - ไคลเอนต์เปิดเซสชัน stdio MCP ค้างไว้
    - `--claude-channel-mode` เป็น `on` หรือ `auto`
    - ไคลเอนต์เข้าใจเมธอดการแจ้งเตือนเฉพาะของ Claude จริง ๆ
    - ข้อความขาเข้าเกิดขึ้นหลังจากบริดจ์เชื่อมต่อแล้ว

  </Accordion>
  <Accordion title="การอนุมัติหายไป">
    `permissions_list_open` แสดงเฉพาะคำขออนุมัติที่สังเกตเห็นขณะที่บริดจ์เชื่อมต่ออยู่เท่านั้น ไม่ใช่ API ประวัติการอนุมัติแบบคงทน
  </Accordion>
</AccordionGroup>

## OpenClaw ในฐานะรีจิสทรีไคลเอนต์ MCP

นี่คือเส้นทาง `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` และ `unset`

คำสั่งเหล่านี้ไม่ได้เปิดเผย OpenClaw ผ่าน MCP แต่จัดการนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` ในการกำหนดค่า OpenClaw คำสั่งเหล่านี้ไม่อ่านเซิร์ฟเวอร์ mcporter จาก `config/mcporter.json`

นิยามที่บันทึกไว้เหล่านั้นมีไว้สำหรับ runtime ที่ OpenClaw เริ่มหรือกำหนดค่าในภายหลัง เช่น OpenClaw แบบฝังตัวและอะแดปเตอร์ runtime อื่น ๆ OpenClaw จัดเก็บนิยามไว้ส่วนกลางเพื่อให้ runtime เหล่านั้นไม่จำเป็นต้องเก็บรายการเซิร์ฟเวอร์ MCP ซ้ำของตนเอง

<AccordionGroup>
  <Accordion title="พฤติกรรมสำคัญ">
    - คำสั่งเหล่านี้อ่านหรือเขียนเฉพาะการกำหนดค่า OpenClaw
    - `status`, `list`, `show`, `doctor` ที่ไม่มี `--probe`, `set`, `configure`, `tools`, `logout`, `reload` และ `unset` ไม่เชื่อมต่อไปยังเซิร์ฟเวอร์ MCP เป้าหมาย
    - `login` ดำเนินการโฟลว์เครือข่าย MCP OAuth สำหรับเซิร์ฟเวอร์ HTTP ที่กำหนดค่าไว้ และบันทึกข้อมูลประจำตัวในเครื่องที่ได้
    - `status --verbose` พิมพ์ transport, auth, timeout, filter และคำใบ้ parallel-tool-call ที่ resolve แล้วโดยไม่เชื่อมต่อ
    - `doctor` ตรวจสอบนิยามที่บันทึกไว้เพื่อหาปัญหาการตั้งค่าในเครื่อง เช่น คำสั่ง stdio ที่หายไป ไดเรกทอรีทำงานที่ไม่ถูกต้อง ไฟล์ TLS ที่หายไป เซิร์ฟเวอร์ที่ปิดใช้งาน ค่า header/env ที่อ่อนไหวแบบ literal และการอนุญาต OAuth ที่ไม่สมบูรณ์
    - `doctor --probe` เพิ่มหลักฐานการเชื่อมต่อสดแบบเดียวกับ `probe` หลังจากการตรวจสอบแบบ static ผ่าน
    - `probe` เชื่อมต่อกับเซิร์ฟเวอร์ที่เลือกหรือเซิร์ฟเวอร์ที่กำหนดค่าทั้งหมด แสดงรายการเครื่องมือ และรายงานความสามารถ/การวินิจฉัย
    - `add` สร้างนิยามจากแฟล็กและ probe ก่อนบันทึก เว้นแต่จะตั้งค่า `--no-probe` หรือจำเป็นต้องอนุญาต OAuth ก่อน
    - อะแดปเตอร์ runtime ตัดสินใจว่า transport shape ใดที่รองรับจริงในเวลารัน
    - `enabled: false` เก็บเซิร์ฟเวอร์ไว้ แต่แยกออกจากการค้นพบ runtime แบบฝังตัว
    - `timeout` และ `connectTimeout` ตั้ง timeout คำขอและการเชื่อมต่อรายเซิร์ฟเวอร์เป็นวินาที
    - `supportsParallelToolCalls: true` ทำเครื่องหมายเซิร์ฟเวอร์ที่อะแดปเตอร์สามารถเรียกพร้อมกันได้
    - เซิร์ฟเวอร์ HTTP ใช้ header แบบ static, การเข้าสู่ระบบ OAuth, การควบคุมการตรวจสอบ TLS และเส้นทางใบรับรอง/คีย์ mTLS ได้
    - OpenClaw แบบฝังตัวเปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้ในโปรไฟล์เครื่องมือ `coding` และ `messaging` ปกติ; `minimal` ยังซ่อนเครื่องมือเหล่านั้น และ `tools.deny: ["bundle-mcp"]` ปิดใช้งานอย่างชัดเจน
    - `toolFilter.include` และ `toolFilter.exclude` รายเซิร์ฟเวอร์กรองเครื่องมือ MCP ที่ค้นพบก่อนจะกลายเป็นเครื่องมือ OpenClaw
    - เซิร์ฟเวอร์ที่ประกาศ resources หรือ prompts ยังเปิดเผยเครื่องมืออรรถประโยชน์สำหรับการแสดงรายการ/อ่าน resources และการแสดงรายการ/ดึง prompts; ชื่ออรรถประโยชน์ที่สร้างขึ้นเหล่านั้น (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) ใช้ include/exclude filter เดียวกัน
    - การเปลี่ยนแปลงรายการเครื่องมือ MCP แบบ dynamic ทำให้แค็ตตาล็อกที่แคชไว้สำหรับเซสชันนั้นไม่ถูกต้อง; การค้นพบ/ใช้งานครั้งถัดไปจะรีเฟรชจากเซิร์ฟเวอร์
    - ความล้มเหลวของคำขอ/โปรโตคอลเครื่องมือ MCP ที่เกิดซ้ำจะพักเซิร์ฟเวอร์นั้นชั่วครู่ เพื่อไม่ให้เซิร์ฟเวอร์เสียเพียงตัวเดียวใช้ทั้งเทิร์น
    - runtime MCP แบบบันเดิลที่มีขอบเขตตามเซสชันจะถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10 นาที; ตั้ง `0` เพื่อปิดใช้งาน) และการรันแบบฝังตัวครั้งเดียวจะล้าง runtime เหล่านั้นเมื่อจบการรัน

  </Accordion>
</AccordionGroup>

อะแดปเตอร์ runtime อาจ normalize รีจิสทรีที่ใช้ร่วมกันนี้ให้เป็น shape ที่ไคลเอนต์ปลายทางคาดหวัง ตัวอย่างเช่น OpenClaw แบบฝังตัวใช้ค่า `transport` ของ OpenClaw โดยตรง ขณะที่ Claude Code และ Gemini รับค่า `type` แบบ native ของ CLI เช่น `http`, `sse` หรือ `stdio`

Codex app-server ยังรองรับบล็อก `codex` ที่ไม่บังคับในแต่ละเซิร์ฟเวอร์ด้วย นี่คือข้อมูลเมตาการ projection ของ OpenClaw สำหรับเธรด Codex app-server เท่านั้น; ไม่ได้เปลี่ยนเซสชัน ACP, การกำหนดค่าฮาร์เนส Codex ทั่วไป หรืออะแดปเตอร์ runtime อื่น ๆ ใช้ `codex.agents` ที่ไม่ว่างเพื่อ project เซิร์ฟเวอร์เข้าไปเฉพาะใน id เอเจนต์ OpenClaw ที่ระบุ รายการเอเจนต์ที่ว่าง เปล่า หรือไม่ถูกต้องจะถูกปฏิเสธโดยการตรวจสอบความถูกต้องของการกำหนดค่า และถูกละเว้นโดยเส้นทาง runtime projection แทนที่จะกลายเป็น global ใช้ `codex.defaultToolsApprovalMode` (`auto`, `prompt` หรือ `approve`) เพื่อส่งออก `default_tools_approval_mode` แบบ native ของ Codex สำหรับเซิร์ฟเวอร์ที่เชื่อถือได้ OpenClaw จะตัดข้อมูลเมตา `codex` ออกก่อนส่งมอบการกำหนดค่า `mcp_servers` แบบ native ให้ Codex

### นิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้

OpenClaw ยังจัดเก็บรีจิสทรีเซิร์ฟเวอร์ MCP แบบเบาไว้ในการกำหนดค่าสำหรับพื้นผิวที่ต้องการนิยาม MCP ที่ OpenClaw จัดการ

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
- `show` ที่ไม่มีชื่อจะพิมพ์อ็อบเจกต์เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ทั้งหมด
- `status` จัดประเภท transport ที่กำหนดค่าไว้โดยไม่เชื่อมต่อ `--verbose` รวมรายละเอียด launch, timeout, OAuth, filter และ parallel-call ที่ resolve แล้ว
- `doctor` ทำการตรวจสอบแบบ static โดยไม่เชื่อมต่อ เพิ่ม `--probe` เมื่อคำสั่งควรตรวจสอบด้วยว่าเซิร์ฟเวอร์ที่เปิดใช้งานเชื่อมต่อได้
- `probe` เชื่อมต่อและรายงานจำนวนเครื่องมือ การรองรับ resources/prompts การรองรับ list-change และการวินิจฉัย
- `add` รับแฟล็ก stdio เช่น `--command`, `--arg`, `--env` และ `--cwd` หรือแฟล็ก HTTP เช่น `--url`, `--transport`, `--header`, `--auth oauth`, TLS, timeout และแฟล็กการเลือกเครื่องมือ
- `set` คาดหวังค่าอ็อบเจกต์ JSON หนึ่งค่าบนบรรทัดคำสั่ง
- `configure` อัปเดตการเปิดใช้งาน ตัวกรองเครื่องมือ timeout, OAuth, TLS และคำใบ้ parallel-tool-call โดยไม่แทนที่นิยามเซิร์ฟเวอร์ทั้งหมด
- `tools` อัปเดตตัวกรองเครื่องมือรายเซิร์ฟเวอร์ รายการ include/exclude คือชื่อเครื่องมือ MCP และ glob `*` แบบง่าย
- `login` รันโฟลว์ OAuth สำหรับเซิร์ฟเวอร์ HTTP ที่กำหนดค่าด้วย `auth: "oauth"` การรันครั้งแรกพิมพ์ URL การอนุญาต; รันซ้ำด้วย `--code` หลังอนุมัติ
- `logout` ล้างข้อมูลประจำตัว OAuth ที่จัดเก็บไว้สำหรับเซิร์ฟเวอร์ที่ระบุ โดยไม่ลบนิยามเซิร์ฟเวอร์ที่บันทึกไว้
- `reload` dispose runtime MCP ในกระบวนการที่แคชไว้ กระบวนการ Gateway หรือเอเจนต์ในอีกกระบวนการหนึ่งยังต้องมีเส้นทาง reload หรือ restart ของตัวเอง
- ใช้ `transport: "streamable-http"` สำหรับเซิร์ฟเวอร์ Streamable HTTP MCP `openclaw mcp set` ยัง normalize `type: "http"` แบบ native ของ CLI ให้เป็น shape การกำหนดค่า canonical เดียวกันเพื่อความเข้ากันได้
- `unset` ล้มเหลวหากไม่มีเซิร์ฟเวอร์ที่ระบุ

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

### สูตรเซิร์ฟเวอร์ทั่วไป

ตัวอย่างเหล่านี้บันทึกเฉพาะนิยามเซิร์ฟเวอร์เท่านั้น รัน `openclaw mcp doctor --probe` หลังจากนั้นเพื่อพิสูจน์ว่าเซิร์ฟเวอร์เริ่มทำงานและเปิดเผยเครื่องมือ

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

    จำกัดขอบเขตเซิร์ฟเวอร์ระบบไฟล์ให้อยู่ในต้นไม้ไดเรกทอรีที่เล็กที่สุดที่เอเจนต์ควรอ่านหรือแก้ไข

  </Tab>
  <Tab title="หน่วยความจำ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    ใช้ตัวกรองเครื่องมือหากเซิร์ฟเวอร์เปิดเผยเครื่องมือเขียนที่ไม่ควรพร้อมใช้งานสำหรับเอเจนต์ปกติ

  </Tab>
  <Tab title="สคริปต์ในเครื่อง">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` ตรวจสอบว่า `cwd` มีอยู่และคำสั่ง resolve ได้จากสภาพแวดล้อมที่กำหนดค่าไว้

  </Tab>
  <Tab title="Remote HTTP">
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

    ใช้ OAuth เมื่อเซิร์ฟเวอร์ระยะไกลรองรับ หากเซิร์ฟเวอร์ต้องใช้ส่วนหัวแบบคงที่ ให้หลีกเลี่ยงการ commit โทเค็น bearer แบบตรงตัว

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    เซิร์ฟเวอร์ควบคุมเดสก์ท็อปโดยตรงจะรับสิทธิ์ของกระบวนการที่เซิร์ฟเวอร์เปิดใช้ ใช้ตัวกรองเครื่องมือที่แคบและพร้อมต์สิทธิ์ระดับระบบปฏิบัติการ

  </Tab>
</Tabs>

### รูปแบบเอาต์พุต JSON

ใช้ `--json` สำหรับสคริปต์และแดชบอร์ด ชุดฟิลด์อาจเพิ่มขึ้นได้ตามเวลา ดังนั้นผู้บริโภคควรละเว้นคีย์ที่ไม่รู้จัก

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
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` จะจบด้วยสถานะไม่เป็นศูนย์เมื่อเซิร์ฟเวอร์ที่เปิดใช้งานและถูกตรวจสอบมีข้อผิดพลาด คำเตือนจะถูกรายงาน แต่ไม่ทำให้คำสั่งล้มเหลวด้วยตัวเอง

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
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

    `probe` เปิดเซสชันไคลเอนต์ MCP แบบสด ใช้สำหรับพิสูจน์การเข้าถึงและความสามารถ ไม่ใช่สำหรับการตรวจสอบการกำหนดค่าแบบคงที่

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
        "timeout": 20,
        "connectTimeout": 5,
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

### การขนส่ง Stdio

เปิดใช้กระบวนการลูกในเครื่องและสื่อสารผ่าน stdin/stdout

| ฟิลด์                       | คำอธิบาย                         |
| -------------------------- | --------------------------------- |
| `command`                  | ไฟล์ปฏิบัติการที่จะ spawn (จำเป็น) |
| `args`                     | อาร์เรย์ของอาร์กิวเมนต์บรรทัดคำสั่ง |
| `env`                      | ตัวแปรสภาพแวดล้อมเพิ่มเติม       |
| `cwd` / `workingDirectory` | ไดเรกทอรีทำงานสำหรับกระบวนการ    |

<Warning>
**ตัวกรองความปลอดภัยของ env สำหรับ Stdio**

OpenClaw ปฏิเสธคีย์ env สำหรับการเริ่มต้น interpreter ที่สามารถเปลี่ยนวิธีเริ่มต้นเซิร์ฟเวอร์ stdio MCP ก่อน RPC แรก แม้คีย์เหล่านั้นจะปรากฏในบล็อก `env` ของเซิร์ฟเวอร์ คีย์ที่ถูกบล็อกรวมถึง `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` และตัวแปรควบคุม runtime ที่คล้ายกัน การเริ่มต้นจะปฏิเสธคีย์เหล่านี้ด้วยข้อผิดพลาดการกำหนดค่า เพื่อไม่ให้คีย์เหล่านี้แทรก prelude โดยนัย สลับ interpreter เปิดใช้ debugger หรือเปลี่ยนเส้นทางเอาต์พุต runtime ต่อกระบวนการ stdio ได้ ตัวแปร env สำหรับข้อมูลรับรอง พร็อกซี และตัวแปรเฉพาะเซิร์ฟเวอร์ทั่วไป (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` แบบกำหนดเอง เป็นต้น) จะไม่ได้รับผลกระทบ

หากเซิร์ฟเวอร์ MCP ของคุณต้องใช้ตัวแปรที่ถูกบล็อกจริง ๆ ให้ตั้งค่าบนกระบวนการโฮสต์ Gateway แทนการตั้งใต้ `env` ของเซิร์ฟเวอร์ stdio
</Warning>

### การขนส่ง SSE / HTTP

เชื่อมต่อกับเซิร์ฟเวอร์ MCP ระยะไกลผ่าน HTTP Server-Sent Events

| ฟิลด์                         | คำอธิบาย                                                        |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)              |
| `headers`                      | แผนที่คีย์-ค่าเพิ่มเติมของส่วนหัว HTTP (เช่น โทเค็น auth)       |
| `connectionTimeoutMs`          | การหมดเวลาการเชื่อมต่อต่อเซิร์ฟเวอร์ หน่วย ms (ไม่บังคับ)       |
| `connectTimeout`               | การหมดเวลาการเชื่อมต่อต่อเซิร์ฟเวอร์ หน่วยวินาที (ไม่บังคับ)   |
| `timeout` / `requestTimeoutMs` | การหมดเวลาคำขอ MCP ต่อเซิร์ฟเวอร์ หน่วยวินาทีหรือ ms            |
| `auth: "oauth"`                | ใช้ที่เก็บโทเค็น MCP OAuth และ `openclaw mcp login`              |
| `sslVerify`                    | ตั้งเป็น false เฉพาะ endpoint HTTPS ส่วนตัวที่เชื่อถืออย่างชัดเจน |
| `clientCert` / `clientKey`     | เส้นทางใบรับรองและคีย์ไคลเอนต์ mTLS                             |
| `supportsParallelToolCalls`    | คำใบ้ว่าการเรียกพร้อมกันปลอดภัยสำหรับเซิร์ฟเวอร์นี้             |

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

ค่าที่ละเอียดอ่อนใน `url` (userinfo) และ `headers` จะถูกปกปิดในบันทึกและเอาต์พุตสถานะ `openclaw mcp doctor` จะเตือนเมื่อรายการ `headers` หรือ `env` ที่ดูเหมือนมีความละเอียดอ่อนมีค่าแบบตรงตัว เพื่อให้ผู้ปฏิบัติงานย้ายค่าเหล่านั้นออกจากการกำหนดค่าที่ commit แล้วได้

### เวิร์กโฟลว์ OAuth

OAuth ใช้สำหรับเซิร์ฟเวอร์ HTTP MCP ที่ประกาศรองรับโฟลว์ MCP OAuth ส่วนหัว `Authorization` แบบคงที่จะถูกละเว้นสำหรับเซิร์ฟเวอร์ขณะที่เปิดใช้ `auth: "oauth"`

<Steps>
  <Step title="Save the server">
    เพิ่มหรืออัปเดตเซิร์ฟเวอร์ด้วย `auth: "oauth"` และเมตาดาต้า OAuth เพิ่มเติมใด ๆ

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    เรียกใช้ login เพื่อสร้างคำขออนุญาต

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw พิมพ์ URL การอนุญาตและจัดเก็บสถานะตัวตรวจสอบ OAuth ชั่วคราวไว้ใต้ไดเรกทอรีสถานะของ OpenClaw

  </Step>
  <Step title="Finish with the code">
    หลังจากอนุมัติในเบราว์เซอร์แล้ว ให้ส่งโค้ดที่ได้รับกลับไปยัง OpenClaw

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    ใช้ status หรือ doctor เพื่อยืนยันว่ามีโทเค็นอยู่

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout ลบข้อมูลรับรอง OAuth ที่จัดเก็บไว้ แต่ยังคงคำจำกัดความเซิร์ฟเวอร์ที่บันทึกไว้

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

หากผู้ให้บริการหมุนเวียนโทเค็นหรือสถานะการอนุญาตค้างอยู่ ให้เรียกใช้ `openclaw mcp logout <name>` แล้วทำ `login` ซ้ำ `logout` สามารถล้างข้อมูลรับรองสำหรับเซิร์ฟเวอร์ HTTP ที่บันทึกไว้ได้ แม้หลังจากลบ `auth: "oauth"` ออกจากการกำหนดค่าแล้ว ตราบใดที่ชื่อเซิร์ฟเวอร์และ URL ยังระบุรายการที่เก็บข้อมูลรับรองได้

### การขนส่ง Streamable HTTP

`streamable-http` เป็นตัวเลือกการขนส่งเพิ่มเติมควบคู่กับ `sse` และ `stdio` โดยใช้การสตรีม HTTP สำหรับการสื่อสารสองทางกับเซิร์ฟเวอร์ MCP ระยะไกล

| ฟิลด์                         | คำอธิบาย                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `url`                          | URL HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)                                 |
| `transport`                    | ตั้งเป็น `"streamable-http"` เพื่อเลือกการขนส่งนี้; เมื่อละไว้ OpenClaw จะใช้ `sse` |
| `headers`                      | แผนที่คีย์-ค่าเพิ่มเติมของส่วนหัว HTTP (เช่น โทเค็น auth)                          |
| `connectionTimeoutMs`          | การหมดเวลาการเชื่อมต่อต่อเซิร์ฟเวอร์ หน่วย ms (ไม่บังคับ)                          |
| `connectTimeout`               | การหมดเวลาการเชื่อมต่อต่อเซิร์ฟเวอร์ หน่วยวินาที (ไม่บังคับ)                      |
| `timeout` / `requestTimeoutMs` | การหมดเวลาคำขอ MCP ต่อเซิร์ฟเวอร์ หน่วยวินาทีหรือ ms                               |
| `auth: "oauth"`                | ใช้ที่เก็บโทเค็น MCP OAuth และ `openclaw mcp login`                                 |
| `sslVerify`                    | ตั้งเป็น false เฉพาะ endpoint HTTPS ส่วนตัวที่เชื่อถืออย่างชัดเจน                  |
| `clientCert` / `clientKey`     | เส้นทางใบรับรองและคีย์ไคลเอนต์ mTLS                                                |
| `supportsParallelToolCalls`    | คำใบ้ว่าการเรียกพร้อมกันปลอดภัยสำหรับเซิร์ฟเวอร์นี้                                |

การกำหนดค่า OpenClaw ใช้ `transport: "streamable-http"` เป็นการสะกดแบบมาตรฐาน ค่า MCP แบบ CLI-native `type: "http"` จะถูกรับเมื่อบันทึกผ่าน `openclaw mcp set` และได้รับการซ่อมแซมโดย `openclaw doctor --fix` ในการกำหนดค่าที่มีอยู่ แต่ `transport` คือสิ่งที่ OpenClaw แบบฝังตัวใช้โดยตรง

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
คำสั่ง registry ไม่ได้เริ่ม channel bridge มีเพียง `probe` และ `doctor --probe` เท่านั้นที่เปิดเซสชันไคลเอนต์ MCP แบบสดเพื่อพิสูจน์ว่าเซิร์ฟเวอร์เป้าหมายเข้าถึงได้
</Note>

## Control UI

Control UI ในเบราว์เซอร์มีหน้าการตั้งค่า MCP เฉพาะที่ `/mcp` หน้านี้แสดงจำนวนเซิร์ฟเวอร์ที่กำหนดค่าไว้ สรุปการเปิดใช้งาน/OAuth/ตัวกรอง แถวการขนส่งต่อเซิร์ฟเวอร์ ตัวควบคุมเปิด/ปิด คำสั่ง CLI ทั่วไป และตัวแก้ไขแบบจำกัดขอบเขตสำหรับส่วนการกำหนดค่า `mcp`

ใช้หน้านี้สำหรับการแก้ไขโดยผู้ปฏิบัติงานและการทำรายการสินทรัพย์อย่างรวดเร็ว ใช้ `openclaw mcp doctor --probe` หรือ `openclaw mcp probe` เมื่อต้องการหลักฐานเซิร์ฟเวอร์แบบสด

เวิร์กโฟลว์ผู้ปฏิบัติงาน:

1. เปิด UI ควบคุม แล้วเลือก **MCP**
2. ตรวจสอบการ์ดสรุปสำหรับเซิร์ฟเวอร์ทั้งหมด เซิร์ฟเวอร์ที่เปิดใช้งาน OAuth และเซิร์ฟเวอร์ที่ถูกกรอง
3. ใช้แต่ละแถวของเซิร์ฟเวอร์เพื่อดูคำใบ้เกี่ยวกับ transport, auth, filter, timeout และคำสั่ง
4. สลับการเปิดใช้งานเมื่อคุณต้องการเก็บคำนิยามไว้ แต่ไม่รวมไว้ในการค้นพบตอนรันไทม์
5. แก้ไขส่วนการกำหนดค่า `mcp` ที่มีขอบเขตสำหรับการเปลี่ยนแปลงเชิงโครงสร้าง เช่น เซิร์ฟเวอร์ใหม่, headers, TLS, metadata ของ OAuth หรือ tool filters
6. เลือก **บันทึก** เพื่อคงการกำหนดค่าไว้เท่านั้น หรือ **บันทึกและเผยแพร่** เพื่อปรับใช้ผ่านเส้นทางการกำหนดค่า Gateway
7. รัน `openclaw mcp doctor --probe` เมื่อคุณต้องการหลักฐานแบบสดว่าเซิร์ฟเวอร์ที่แก้ไขแล้วเริ่มทำงานและแสดงรายการเครื่องมือได้

หมายเหตุ:

- ส่วนย่อยคำสั่งจะครอบชื่อเซิร์ฟเวอร์ด้วยเครื่องหมายอัญประกาศ เพื่อให้ชื่อที่ไม่ปกติยังคัดลอกไปใช้ในเชลล์ได้
- ค่าที่แสดงซึ่งมีลักษณะคล้าย URL จะถูกปกปิดก่อนเรนเดอร์เมื่อมีข้อมูลรับรองฝังอยู่
- หน้านี้ไม่ได้เริ่ม MCP transports ด้วยตัวเอง
- รันไทม์ที่ใช้งานอยู่อาจต้องใช้ `openclaw mcp reload`, การเผยแพร่การกำหนดค่า Gateway หรือการรีสตาร์ทโปรเซส ขึ้นอยู่กับว่าโปรเซสใดเป็นเจ้าของ MCP clients

## ข้อจำกัดปัจจุบัน

หน้านี้บันทึกบริดจ์ตามที่จัดส่งในปัจจุบัน

ข้อจำกัดปัจจุบัน:

- การค้นพบการสนทนาขึ้นอยู่กับ metadata ของเส้นทางเซสชัน Gateway ที่มีอยู่
- ยังไม่มีโปรโตคอล push ทั่วไปนอกเหนือจากอะแดปเตอร์เฉพาะ Claude
- ยังไม่มีเครื่องมือแก้ไขข้อความหรือรีแอ็กต์
- transport แบบ HTTP/SSE/streamable-http เชื่อมต่อกับเซิร์ฟเวอร์ระยะไกลตัวเดียว ยังไม่มี upstream แบบ multiplexed
- `permissions_list_open` รวมเฉพาะการอนุมัติที่พบเห็นขณะบริดจ์เชื่อมต่ออยู่เท่านั้น

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin](/th/cli/plugins)
