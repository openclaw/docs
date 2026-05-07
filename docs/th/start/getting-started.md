---
read_when:
    - การตั้งค่าครั้งแรกตั้งแต่เริ่มต้น
    - คุณต้องการวิธีที่เร็วที่สุดเพื่อให้แชตใช้งานได้
summary: ติดตั้ง OpenClaw และเริ่มแชตครั้งแรกได้ภายในไม่กี่นาที
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-05-07T13:26:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

ติดตั้ง OpenClaw, รันการตั้งค่าเริ่มต้น และแชตกับผู้ช่วย AI ของคุณ — ทั้งหมดนี้ใช้เวลา
ประมาณ 5 นาที เมื่อจบแล้วคุณจะมี Gateway ที่ทำงานอยู่, auth ที่กำหนดค่าแล้ว,
และเซสชันแชตที่ใช้งานได้

## สิ่งที่คุณต้องมี

- **Node.js** — แนะนำ Node 24 (รองรับ Node 22.16+ ด้วย)
- **คีย์ API** จากผู้ให้บริการโมเดล (Anthropic, OpenAI, Google ฯลฯ) — การตั้งค่าเริ่มต้นจะถามคุณ

<Tip>
ตรวจสอบเวอร์ชัน Node ของคุณด้วย `node --version`
**ผู้ใช้ Windows:** รองรับทั้ง Windows แบบเนทีฟและ WSL2 โดย WSL2 มีความเสถียรมากกว่า
และแนะนำสำหรับประสบการณ์แบบเต็ม ดู [Windows](/th/platforms/windows)
ต้องติดตั้ง Node หรือไม่ ดู [การตั้งค่า Node](/th/install/node)
</Tip>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="กระบวนการสคริปต์ติดตั้ง"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    วิธีติดตั้งอื่น ๆ (Docker, Nix, npm): [ติดตั้ง](/th/install)
    </Note>

  </Step>
  <Step title="รันการตั้งค่าเริ่มต้น">
    ```bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดจะแนะนำคุณตลอดการเลือกผู้ให้บริการโมเดล, การตั้งค่าคีย์ API,
    และการกำหนดค่า Gateway ใช้เวลาประมาณ 2 นาที

    ดูข้อมูลอ้างอิงฉบับเต็มได้ที่ [การตั้งค่าเริ่มต้น (CLI)](/th/start/wizard)

  </Step>
  <Step title="ตรวจสอบว่า Gateway กำลังทำงาน">
    ```bash
    openclaw gateway status
    ```

    คุณควรเห็นว่า Gateway กำลังรับฟังที่พอร์ต 18789

  </Step>
  <Step title="เปิดแดชบอร์ด">
    ```bash
    openclaw dashboard
    ```

    คำสั่งนี้จะเปิด Control UI ในเบราว์เซอร์ของคุณ หากโหลดได้ แสดงว่าทุกอย่างทำงานแล้ว

  </Step>
  <Step title="ส่งข้อความแรกของคุณ">
    พิมพ์ข้อความในแชตของ Control UI แล้วคุณควรได้รับคำตอบจาก AI

    อยากแชตจากโทรศัพท์แทนหรือไม่ ช่องทางที่ตั้งค่าได้เร็วที่สุดคือ
    [Telegram](/th/channels/telegram) (ใช้แค่โทเค็นบอต) ดูตัวเลือกทั้งหมดที่ [ช่องทาง](/th/channels)

  </Step>
</Steps>

<Accordion title="ขั้นสูง: เมาต์บิลด์ Control UI แบบกำหนดเอง">
  หากคุณดูแลบิลด์แดชบอร์ดที่แปลภาษาหรือปรับแต่งเอง ให้ชี้
  `gateway.controlUi.root` ไปยังไดเรกทอรีที่มี static assets ที่บิลด์แล้ว
  และ `index.html` ของคุณ

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

จากนั้นตั้งค่า:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

รีสตาร์ต Gateway แล้วเปิดแดชบอร์ดอีกครั้ง:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## ทำอะไรต่อไป

<Columns>
  <Card title="เชื่อมต่อช่องทาง" href="/th/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่น ๆ
  </Card>
  <Card title="การจับคู่และความปลอดภัย" href="/th/channels/pairing" icon="shield">
    ควบคุมว่าใครสามารถส่งข้อความถึงเอเจนต์ของคุณได้
  </Card>
  <Card title="กำหนดค่า Gateway" href="/th/gateway/configuration" icon="settings">
    โมเดล, เครื่องมือ, แซนด์บ็อกซ์ และการตั้งค่าขั้นสูง
  </Card>
  <Card title="เรียกดูเครื่องมือ" href="/th/tools" icon="wrench">
    เบราว์เซอร์, exec, การค้นหาเว็บ, Skills และ Plugin
  </Card>
</Columns>

<Accordion title="ขั้นสูง: ตัวแปรสภาพแวดล้อม">
  หากคุณรัน OpenClaw เป็นบัญชีบริการหรือต้องการพาธแบบกำหนดเอง:

- `OPENCLAW_HOME` — ไดเรกทอรีหลักสำหรับการแก้ไขพาธภายใน
- `OPENCLAW_STATE_DIR` — แทนที่ไดเรกทอรีสถานะ
- `OPENCLAW_CONFIG_PATH` — แทนที่พาธไฟล์ config

ข้อมูลอ้างอิงฉบับเต็ม: [ตัวแปรสภาพแวดล้อม](/th/help/environment)
</Accordion>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ภาพรวมช่องทาง](/th/channels)
- [การตั้งค่า](/th/start/setup)
