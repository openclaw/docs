---
read_when:
    - การตั้งค่าครั้งแรกตั้งแต่เริ่มต้น
    - คุณต้องการเส้นทางที่เร็วที่สุดสู่แชทที่ใช้งานได้
summary: ติดตั้ง OpenClaw และเริ่มแชทครั้งแรกได้ภายในไม่กี่นาที
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-06-28T20:45:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

ติดตั้ง OpenClaw, เรียกใช้การเริ่มต้นใช้งาน และแชทกับผู้ช่วย AI ของคุณ ทั้งหมดนี้ใช้เวลา
ประมาณ 5 นาที เมื่อจบแล้วคุณจะมี Gateway ที่ทำงานอยู่, การยืนยันตัวตนที่ตั้งค่าแล้ว,
และเซสชันแชทที่ใช้งานได้

## สิ่งที่คุณต้องมี

- **Node.js** — แนะนำ Node 24 (รองรับ Node 22.19+ ด้วย)
- **API key** จากผู้ให้บริการโมเดล (Anthropic, OpenAI, Google ฯลฯ) — ขั้นตอนเริ่มต้นใช้งานจะถามคุณ

<Tip>
ตรวจสอบเวอร์ชัน Node ของคุณด้วย `node --version`.
**ผู้ใช้ Windows:** แอป Windows Hub แบบเนทีฟคือเส้นทางเดสก์ท็อปที่ง่ายที่สุด นอกจากนี้ยังรองรับ
ตัวติดตั้ง PowerShell และเส้นทาง WSL2 Gateway ด้วย ดู [Windows](/th/platforms/windows).
ต้องติดตั้ง Node ใช่ไหม ดู [การตั้งค่า Node](/th/install/node).
</Tip>

## ตั้งค่าอย่างรวดเร็ว

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
    วิธีติดตั้งอื่นๆ (Docker, Nix, npm): [ติดตั้ง](/th/install).
    </Note>

  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดจะแนะนำคุณตลอดการเลือกผู้ให้บริการโมเดล, ตั้งค่า API key,
    และกำหนดค่า Gateway โดยปกติ QuickStart ใช้เวลาเพียงไม่กี่นาที แต่
    การลงชื่อเข้าใช้ผู้ให้บริการ, การจับคู่ช่องทาง, การติดตั้ง daemon, การดาวน์โหลดผ่านเครือข่าย, Skills,
    หรือ Plugin เสริมแบบไม่บังคับอาจทำให้การเริ่มต้นใช้งานแบบเต็มใช้เวลานานขึ้น คุณสามารถข้าม
    ขั้นตอนที่ไม่บังคับและกลับมาภายหลังด้วย `openclaw configure`.

    ดูข้อมูลอ้างอิงฉบับเต็มที่ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard).

  </Step>
  <Step title="ตรวจสอบว่า Gateway กำลังทำงาน">
    ```bash
    openclaw gateway status
    ```

    คุณควรเห็นว่า Gateway กำลังฟังอยู่บนพอร์ต 18789.

  </Step>
  <Step title="เปิดแดชบอร์ด">
    ```bash
    openclaw dashboard
    ```

    คำสั่งนี้จะเปิด Control UI ในเบราว์เซอร์ของคุณ หากโหลดได้ แสดงว่าทุกอย่างทำงานแล้ว

  </Step>
  <Step title="ส่งข้อความแรกของคุณ">
    พิมพ์ข้อความในแชทของ Control UI แล้วคุณควรได้รับการตอบกลับจาก AI.

    อยากแชทจากโทรศัพท์แทนใช่ไหม ช่องทางที่ตั้งค่าได้เร็วที่สุดคือ
    [Telegram](/th/channels/telegram) (ใช้เพียงโทเค็นบอต) ดูตัวเลือกทั้งหมดได้ที่ [ช่องทาง](/th/channels).

  </Step>
</Steps>

<Accordion title="ขั้นสูง: เมานต์บิลด์ Control UI แบบกำหนดเอง">
  หากคุณดูแลบิลด์แดชบอร์ดที่แปลเป็นภาษาท้องถิ่นหรือปรับแต่งเอง ให้ชี้
  `gateway.controlUi.root` ไปยังไดเรกทอรีที่มีไฟล์สแตติกที่บิลด์แล้ว
  และ `index.html`.

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

## สิ่งที่ควรทำต่อ

<Columns>
  <Card title="เชื่อมต่อช่องทาง" href="/th/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่นๆ.
  </Card>
  <Card title="การจับคู่และความปลอดภัย" href="/th/channels/pairing" icon="shield">
    ควบคุมว่าใครสามารถส่งข้อความถึงเอเจนต์ของคุณได้
  </Card>
  <Card title="กำหนดค่า Gateway" href="/th/gateway/configuration" icon="settings">
    โมเดล, เครื่องมือ, sandbox และการตั้งค่าขั้นสูง
  </Card>
  <Card title="เรียกดูเครื่องมือ" href="/th/tools" icon="wrench">
    เบราว์เซอร์, exec, การค้นหาเว็บ, Skills และ Plugin.
  </Card>
</Columns>

<Accordion title="ขั้นสูง: ตัวแปรสภาพแวดล้อม">
  หากคุณเรียกใช้ OpenClaw เป็นบัญชีบริการหรือต้องการพาธที่กำหนดเอง:

- `OPENCLAW_HOME` — โฮมไดเรกทอรีสำหรับการแก้พาธภายใน
- `OPENCLAW_STATE_DIR` — แทนที่ไดเรกทอรีสถานะ
- `OPENCLAW_CONFIG_PATH` — แทนที่พาธไฟล์ config

ข้อมูลอ้างอิงฉบับเต็ม: [ตัวแปรสภาพแวดล้อม](/th/help/environment).
</Accordion>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ภาพรวมช่องทาง](/th/channels)
- [การตั้งค่า](/th/start/setup)
