---
read_when:
    - การตั้งค่าครั้งแรกตั้งแต่เริ่มต้น
    - คุณต้องการวิธีที่เร็วที่สุดเพื่อให้แชตใช้งานได้
summary: ติดตั้ง OpenClaw และเริ่มแชตครั้งแรกได้ภายในไม่กี่นาที
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-07-16T19:41:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

ติดตั้ง OpenClaw เริ่มกระบวนการตั้งค่าเบื้องต้น และแชตกับผู้ช่วย AI ของคุณได้ภายในประมาณ 5
นาที เมื่อเสร็จสิ้น คุณจะมี Gateway ที่กำลังทำงาน การยืนยันตัวตนที่กำหนดค่าแล้ว และ
เซสชันแชตที่ใช้งานได้

## สิ่งที่ต้องมี

- **Node.js 22.22.3+, 24.15+ หรือ 25.9+** (แนะนำให้ใช้ 24 เป็นค่าเริ่มต้น)
- **คีย์ API** จากผู้ให้บริการโมเดล (Anthropic, OpenAI, Google เป็นต้น) — ระบบตั้งค่าเบื้องต้นจะแจ้งให้คุณป้อน

<Tip>
ตรวจสอบเวอร์ชัน Node ด้วย `node --version`
**ผู้ใช้ Windows:** แอป Windows Hub แบบเนทีฟเป็นวิธีใช้งานบนเดสก์ท็อปที่ง่ายที่สุด
นอกจากนี้ยังรองรับตัวติดตั้ง PowerShell และการใช้ Gateway ผ่าน WSL2 ดูที่ [Windows](/th/platforms/windows)
ต้องการติดตั้ง Node ใช่ไหม ดูที่ [การตั้งค่า Node](/th/install/node)
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
    วิธีติดตั้งอื่นๆ (Docker, Nix, npm): [การติดตั้ง](/th/install)
    </Note>

  </Step>
  <Step title="เริ่มกระบวนการตั้งค่าเบื้องต้น">
    ```bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดจะแนะนำคุณในการเลือกผู้ให้บริการโมเดล ตั้งค่าคีย์ API
    และกำหนดค่า Gateway โดยทั่วไป QuickStart ใช้เวลาเพียงไม่กี่นาที แต่
    การลงชื่อเข้าใช้ผู้ให้บริการ การจับคู่ช่องทาง การติดตั้งดีมอน การดาวน์โหลดผ่านเครือข่าย Skills
    หรือ Plugin เสริม อาจทำให้กระบวนการตั้งค่าเบื้องต้นทั้งหมดใช้เวลานานขึ้น ข้ามขั้นตอนเสริม
    แล้วกลับมาดำเนินการภายหลังด้วย `openclaw configure`

    ดูข้อมูลอ้างอิงฉบับเต็มที่ [การตั้งค่าเบื้องต้น (CLI)](/th/start/wizard)

  </Step>
  <Step title="ตรวจสอบว่า Gateway กำลังทำงาน">
    ```bash
    openclaw gateway status
    ```

    คุณควรเห็น Gateway รอรับการเชื่อมต่ออยู่ที่พอร์ต 18789

  </Step>
  <Step title="เปิดแดชบอร์ด">
    ```bash
    openclaw dashboard
    ```

    คำสั่งนี้จะเปิด Control UI ในเบราว์เซอร์ หากโหลดได้ แสดงว่าทุกอย่างทำงานตามปกติ

  </Step>
  <Step title="ส่งข้อความแรก">
    พิมพ์ข้อความในแชตของ Control UI แล้วคุณควรได้รับคำตอบจาก AI

    ต้องการแชตจากโทรศัพท์แทนใช่ไหม ช่องทางที่ตั้งค่าได้เร็วที่สุดคือ
    [Telegram](/th/channels/telegram) (ใช้เพียงโทเค็นบอต) ดูตัวเลือกทั้งหมดที่ [ช่องทาง](/th/channels)

  </Step>
</Steps>

<Accordion title="ขั้นสูง: เมานต์บิลด์ Control UI แบบกำหนดเอง">
  หากคุณดูแลบิลด์แดชบอร์ดที่แปลเป็นภาษาท้องถิ่นหรือปรับแต่งเอง ให้กำหนด
  `gateway.controlUi.root` ไปยังไดเรกทอรีที่มีแอสเซ็ตแบบสแตติกที่บิลด์แล้ว
  และ `index.html`

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# คัดลอกไฟล์แบบสแตติกที่บิลด์แล้วไปยังไดเรกทอรีนั้น
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

## ขั้นตอนถัดไป

<Columns>
  <Card title="เชื่อมต่อช่องทาง" href="/th/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่นๆ
  </Card>
  <Card title="การจับคู่และความปลอดภัย" href="/th/channels/pairing" icon="shield">
    ควบคุมผู้ที่สามารถส่งข้อความถึงเอเจนต์ของคุณ
  </Card>
  <Card title="กำหนดค่า Gateway" href="/th/gateway/configuration" icon="settings">
    โมเดล เครื่องมือ แซนด์บ็อกซ์ และการตั้งค่าขั้นสูง
  </Card>
  <Card title="เรียกดูเครื่องมือ" href="/th/tools" icon="wrench">
    เบราว์เซอร์ การดำเนินการ การค้นหาเว็บ Skills และ Plugin
  </Card>
</Columns>

<Accordion title="ขั้นสูง: ตัวแปรสภาพแวดล้อม">
  หากคุณเรียกใช้ OpenClaw ด้วยบัญชีบริการหรือต้องการใช้พาธแบบกำหนดเอง:

- `OPENCLAW_HOME` — โฮมไดเรกทอรีสำหรับการกำหนดพาธภายใน
- `OPENCLAW_STATE_DIR` — แทนที่ไดเรกทอรีสถานะ
- `OPENCLAW_CONFIG_PATH` — แทนที่พาธไฟล์กำหนดค่า

ข้อมูลอ้างอิงฉบับเต็ม: [ตัวแปรสภาพแวดล้อม](/th/help/environment)
</Accordion>

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ภาพรวมช่องทาง](/th/channels)
- [การตั้งค่า](/th/start/setup)
