---
read_when:
    - การตั้งค่าครั้งแรกตั้งแต่ศูนย์
    - คุณต้องการวิธีที่เร็วที่สุดในการทำให้แชตใช้งานได้
summary: ติดตั้ง OpenClaw และเริ่มแชตครั้งแรกได้ภายในไม่กี่นาที.
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-06-27T18:23:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

ติดตั้ง OpenClaw, รัน onboarding และแชตกับผู้ช่วย AI ของคุณ ทั้งหมดนี้ใช้เวลา
ประมาณ 5 นาที เมื่อจบแล้วคุณจะมี Gateway ที่กำลังทำงาน, auth ที่กำหนดค่าแล้ว,
และเซสชันแชตที่ใช้งานได้

## สิ่งที่คุณต้องมี

- **Node.js** — แนะนำ Node 24 (รองรับ Node 22.19+ เช่นกัน)
- **API key** จากผู้ให้บริการโมเดล (Anthropic, OpenAI, Google ฯลฯ) — onboarding จะถามคุณ

<Tip>
ตรวจสอบเวอร์ชัน Node ของคุณด้วย `node --version`
**ผู้ใช้ Windows:** แอป Windows Hub แบบเนทีฟคือเส้นทางเดสก์ท็อปที่ง่ายที่สุด
นอกจากนี้ยังรองรับตัวติดตั้ง PowerShell และเส้นทาง WSL2 Gateway ดู [Windows](/th/platforms/windows)
ต้องติดตั้ง Node หรือไม่ ดู [การตั้งค่า Node](/th/install/node)
</Tip>

## การตั้งค่าแบบรวดเร็ว

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
    วิธีติดตั้งอื่นๆ (Docker, Nix, npm): [ติดตั้ง](/th/install)
    </Note>

  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดจะแนะนำคุณตลอดการเลือกผู้ให้บริการโมเดล, ตั้งค่า API key,
    และกำหนดค่า Gateway ใช้เวลาประมาณ 2 นาที

    ดูข้อมูลอ้างอิงฉบับเต็มที่ [Onboarding (CLI)](/th/start/wizard)

  </Step>
  <Step title="ตรวจสอบว่า Gateway กำลังทำงาน">
    ```bash
    openclaw gateway status
    ```

    คุณควรเห็นว่า Gateway กำลัง listen อยู่บนพอร์ต 18789

  </Step>
  <Step title="เปิดแดชบอร์ด">
    ```bash
    openclaw dashboard
    ```

    คำสั่งนี้จะเปิด Control UI ในเบราว์เซอร์ของคุณ หากโหลดได้ แสดงว่าทุกอย่างทำงานแล้ว

  </Step>
  <Step title="ส่งข้อความแรกของคุณ">
    พิมพ์ข้อความในแชต Control UI แล้วคุณควรได้รับคำตอบจาก AI

    ต้องการแชตจากโทรศัพท์แทนหรือไม่ ช่องทางที่ตั้งค่าได้เร็วที่สุดคือ
    [Telegram](/th/channels/telegram) (ใช้เพียง bot token) ดูตัวเลือกทั้งหมดได้ที่ [ช่องทาง](/th/channels)

  </Step>
</Steps>

<Accordion title="ขั้นสูง: เมานต์บิลด์ Control UI แบบกำหนดเอง">
  หากคุณดูแลบิลด์แดชบอร์ดที่แปลเป็นภาษาท้องถิ่นหรือปรับแต่งเอง ให้ชี้
  `gateway.controlUi.root` ไปยังไดเรกทอรีที่มี static
  assets ที่บิลด์แล้วและ `index.html`

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

รีสตาร์ท gateway แล้วเปิดแดชบอร์ดอีกครั้ง:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## สิ่งที่ควรทำต่อ

<Columns>
  <Card title="เชื่อมต่อช่องทาง" href="/th/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่นๆ
  </Card>
  <Card title="การจับคู่และความปลอดภัย" href="/th/channels/pairing" icon="shield">
    ควบคุมว่าใครสามารถส่งข้อความถึง agent ของคุณได้
  </Card>
  <Card title="กำหนดค่า Gateway" href="/th/gateway/configuration" icon="settings">
    โมเดล, เครื่องมือ, sandbox และการตั้งค่าขั้นสูง
  </Card>
  <Card title="เรียกดูเครื่องมือ" href="/th/tools" icon="wrench">
    เบราว์เซอร์, exec, การค้นหาเว็บ, Skills และ Plugin
  </Card>
</Columns>

<Accordion title="ขั้นสูง: ตัวแปรสภาพแวดล้อม">
  หากคุณรัน OpenClaw เป็นบัญชีบริการหรือต้องการ path แบบกำหนดเอง:

- `OPENCLAW_HOME` — โฮมไดเรกทอรีสำหรับการ resolve path ภายใน
- `OPENCLAW_STATE_DIR` — override ไดเรกทอรี state
- `OPENCLAW_CONFIG_PATH` — override path ของไฟล์ config

ข้อมูลอ้างอิงฉบับเต็ม: [ตัวแปรสภาพแวดล้อม](/th/help/environment)
</Accordion>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ภาพรวมช่องทาง](/th/channels)
- [การตั้งค่า](/th/start/setup)
