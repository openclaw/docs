---
read_when:
    - การตั้งค่าครั้งแรกตั้งแต่เริ่มต้น
    - คุณต้องการวิธีที่รวดเร็วที่สุดในการเริ่มใช้งานแชตได้จริง
summary: ติดตั้ง OpenClaw และเริ่มแชตครั้งแรกได้ภายในไม่กี่นาที
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-07-12T16:43:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

ติดตั้ง OpenClaw เรียกใช้การเริ่มต้นใช้งาน และแชตกับผู้ช่วย AI ของคุณได้ภายในประมาณ 5
นาที เมื่อเสร็จแล้ว คุณจะมี Gateway ที่กำลังทำงาน การยืนยันตัวตนที่กำหนดค่าแล้ว และ
เซสชันแชตที่ใช้งานได้

## สิ่งที่คุณต้องมี

- **Node.js 22.19+, 23.11+ หรือ 24+** (แนะนำให้ใช้ 24 เป็นค่าเริ่มต้น)
- **คีย์ API** จากผู้ให้บริการโมเดล (Anthropic, OpenAI, Google เป็นต้น) — ระบบเริ่มต้นใช้งานจะแจ้งให้คุณป้อน

<Tip>
ตรวจสอบเวอร์ชัน Node ของคุณด้วย `node --version`
**ผู้ใช้ Windows:** แอป Windows Hub แบบเนทีฟเป็นวิธีใช้งานบนเดสก์ท็อปที่ง่ายที่สุด
นอกจากนี้ยังรองรับตัวติดตั้ง PowerShell และการใช้งาน Gateway ผ่าน WSL2 ดูที่ [Windows](/th/platforms/windows)
หากต้องการติดตั้ง Node โปรดดู [การตั้งค่า Node](/th/install/node)
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
  alt="กระบวนการของสคริปต์ติดตั้ง"
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
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --install-daemon
    ```

    ตัวช่วยจะนำคุณผ่านขั้นตอนการเลือกผู้ให้บริการโมเดล การตั้งค่าคีย์ API
    และการกำหนดค่า Gateway โดยปกติ QuickStart ใช้เวลาเพียงไม่กี่นาที แต่
    การลงชื่อเข้าใช้ผู้ให้บริการ การจับคู่ช่องทาง การติดตั้งดีมอน การดาวน์โหลดผ่านเครือข่าย Skills
    หรือ Plugin เสริม อาจทำให้การเริ่มต้นใช้งานทั้งหมดใช้เวลานานขึ้น คุณสามารถข้าม
    ขั้นตอนเสริมและกลับมาดำเนินการภายหลังด้วย `openclaw configure`

    ดูข้อมูลอ้างอิงฉบับเต็มที่ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

  </Step>
  <Step title="ตรวจสอบว่า Gateway กำลังทำงาน">
    ```bash
    openclaw gateway status
    ```

    คุณควรเห็น Gateway รอรับการเชื่อมต่อที่พอร์ต 18789

  </Step>
  <Step title="เปิดแดชบอร์ด">
    ```bash
    openclaw dashboard
    ```

    คำสั่งนี้จะเปิด UI ควบคุมในเบราว์เซอร์ของคุณ หากหน้าเว็บโหลดได้ แสดงว่าทุกอย่างทำงานเรียบร้อย

  </Step>
  <Step title="ส่งข้อความแรกของคุณ">
    พิมพ์ข้อความในแชตของ UI ควบคุม แล้วคุณควรได้รับคำตอบจาก AI

    ต้องการแชตจากโทรศัพท์แทนหรือไม่ ช่องทางที่ตั้งค่าได้เร็วที่สุดคือ
    [Telegram](/th/channels/telegram) (ใช้เพียงโทเค็นบอต) ดูตัวเลือกทั้งหมดที่ [ช่องทาง](/th/channels)

  </Step>
</Steps>

<Accordion title="ขั้นสูง: เมานต์บิลด์ UI ควบคุมแบบกำหนดเอง">
  หากคุณดูแลบิลด์แดชบอร์ดที่แปลเป็นภาษาท้องถิ่นหรือปรับแต่งเอง ให้กำหนด
  `gateway.controlUi.root` ให้ชี้ไปยังไดเรกทอรีที่มีแอสเซตแบบคงที่ซึ่งสร้างแล้ว
  และ `index.html`

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# คัดลอกไฟล์แบบคงที่ที่สร้างแล้วของคุณไปยังไดเรกทอรีนั้น
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

## สิ่งที่ควรทำต่อไป

<Columns>
  <Card title="เชื่อมต่อช่องทาง" href="/th/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่น ๆ
  </Card>
  <Card title="การจับคู่และความปลอดภัย" href="/th/channels/pairing" icon="shield">
    ควบคุมว่าใครสามารถส่งข้อความถึงเอเจนต์ของคุณได้
  </Card>
  <Card title="กำหนดค่า Gateway" href="/th/gateway/configuration" icon="settings">
    โมเดล เครื่องมือ แซนด์บ็อกซ์ และการตั้งค่าขั้นสูง
  </Card>
  <Card title="เรียกดูเครื่องมือ" href="/th/tools" icon="wrench">
    เบราว์เซอร์ การเรียกใช้คำสั่ง การค้นหาเว็บ Skills และ Plugin
  </Card>
</Columns>

<Accordion title="ขั้นสูง: ตัวแปรสภาพแวดล้อม">
  หากคุณเรียกใช้ OpenClaw ด้วยบัญชีบริการหรือต้องการกำหนดพาธเอง:

- `OPENCLAW_HOME` — ไดเรกทอรีหลักสำหรับการแก้ไขพาธภายใน
- `OPENCLAW_STATE_DIR` — แทนที่ไดเรกทอรีสถานะ
- `OPENCLAW_CONFIG_PATH` — แทนที่พาธไฟล์กำหนดค่า

ข้อมูลอ้างอิงฉบับเต็ม: [ตัวแปรสภาพแวดล้อม](/th/help/environment)
</Accordion>

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ภาพรวมช่องทาง](/th/channels)
- [การตั้งค่า](/th/start/setup)
