---
read_when:
    - แนะนำ OpenClaw ให้ผู้ใช้ใหม่รู้จัก
summary: OpenClaw คือ Gateway แบบหลายช่องทางสำหรับเอเจนต์ AI ที่ทำงานได้บนทุกระบบปฏิบัติการ
title: OpenClaw
x-i18n:
    generated_at: "2026-07-12T16:17:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b87c2a9ce06f110bda45709fb6055ed8000f73993793ea7386db2a47a782828
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"ลอกคราบ! ลอกคราบ!"_ — กุ้งล็อบสเตอร์อวกาศสักตัว คงจะใช่

<p align="center">
  <strong>Gateway ที่ใช้ได้กับทุกระบบปฏิบัติการสำหรับเอเจนต์ AI บน Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่น ๆ</strong><br />
  ส่งข้อความแล้วรับคำตอบจากเอเจนต์ได้จากในกระเป๋าของคุณ ใช้ Gateway เดียวร่วมกับ Plugin ช่องทาง, WebChat และโหนดมือถือ
</p>

<Columns>
  <Card title="เริ่มต้นใช้งาน" href="/th/start/getting-started" icon="rocket">
    ติดตั้ง OpenClaw และเปิดใช้งาน Gateway ได้ภายในไม่กี่นาที
  </Card>
  <Card title="ดำเนินการเริ่มต้นระบบ" href="/th/start/wizard" icon="list-checks">
    ตั้งค่าตามคำแนะนำด้วย `openclaw onboard` และขั้นตอนการจับคู่
  </Card>
  <Card title="เชื่อมต่อช่องทาง" href="/th/channels" icon="message-circle">
    เชื่อมโยง Discord, Signal, Telegram, WhatsApp และอื่น ๆ เพื่อแชตได้จากทุกที่
  </Card>
  <Card title="เปิด UI ควบคุม" href="/th/web/control-ui" icon="layout-dashboard">
    เปิดแดชบอร์ดในเบราว์เซอร์สำหรับการแชต การกำหนดค่า และเซสชัน
  </Card>
</Columns>

## เรียกดูเอกสาร

เบราว์เซอร์บนมือถืออาจแสดงเมนูส่วนต่าง ๆ โดยไม่มีแถบแท็บแบบเดสก์ท็อปที่ครบถ้วน ใช้
ลิงก์ศูนย์รวมเหล่านี้เพื่อเข้าถึงพื้นที่เอกสารระดับบนสุดเดียวกันจากเนื้อหาของหน้า

<Columns>
  <Card title="เริ่มต้นใช้งาน" href="/th" icon="rocket">
    ภาพรวม ตัวอย่างผลงาน ขั้นตอนแรก และคู่มือการตั้งค่า
  </Card>
  <Card title="ติดตั้ง" href="/th/install" icon="download">
    วิธีติดตั้ง การอัปเดต คอนเทนเนอร์ การโฮสต์ และการตั้งค่าขั้นสูง
  </Card>
  <Card title="ช่องทาง" href="/th/channels" icon="messages-square">
    ช่องทางรับส่งข้อความ การจับคู่ การกำหนดเส้นทาง กลุ่มการเข้าถึง และการประกันคุณภาพช่องทาง
  </Card>
  <Card title="เอเจนต์" href="/th/concepts/architecture" icon="bot">
    สถาปัตยกรรม เซสชัน บริบท หน่วยความจำ และการกำหนดเส้นทางแบบหลายเอเจนต์
  </Card>
  <Card title="ความสามารถ" href="/th/tools" icon="wand-sparkles">
    เครื่องมือ Skills, Cron, Webhook และความสามารถด้านระบบอัตโนมัติ
  </Card>
  <Card title="ClawHub" href="/th/clawhub" icon="store">
    ตลาด Plugin การเผยแพร่ การคัดสรร และคำแนะนำด้านความน่าเชื่อถือ
  </Card>
  <Card title="โมเดล" href="/th/providers" icon="brain">
    ผู้ให้บริการ การกำหนดค่าโมเดล การสลับเมื่อขัดข้อง และบริการโมเดลภายในเครื่อง
  </Card>
  <Card title="แพลตฟอร์ม" href="/th/platforms" icon="monitor-smartphone">
    macOS, Windows, iOS, Android, โหนด และส่วนติดต่อบนเว็บ
  </Card>
  <Card title="Gateway และการปฏิบัติการ" href="/th/gateway" icon="server">
    การกำหนดค่า Gateway ความปลอดภัย การวินิจฉัย และการปฏิบัติการ
  </Card>
  <Card title="ข้อมูลอ้างอิง" href="/th/cli" icon="terminal">
    ข้อมูลอ้างอิง CLI สคีมา RPC บันทึกประจำรุ่น และแม่แบบ
  </Card>
  <Card title="ความช่วยเหลือ" href="/th/help" icon="life-buoy">
    การแก้ไขปัญหา คำถามที่พบบ่อย การทดสอบ การวินิจฉัย และการตรวจสอบสภาพแวดล้อม
  </Card>
</Columns>

## OpenClaw คืออะไร?

OpenClaw คือ **Gateway ที่โฮสต์ด้วยตนเอง** ซึ่งเชื่อมต่อแอปแชตที่คุณชื่นชอบ เช่น Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่น ๆ ผ่าน Plugin ช่องทาง เข้ากับเอเจนต์ AI สำหรับเขียนโค้ด คุณเรียกใช้กระบวนการ Gateway เพียงหนึ่งกระบวนการบนเครื่องของคุณเอง (หรือเซิร์ฟเวอร์) แล้วกระบวนการนี้จะทำหน้าที่เป็นสะพานเชื่อมระหว่างแอปรับส่งข้อความกับผู้ช่วย AI ที่พร้อมใช้งานตลอดเวลา

**เหมาะสำหรับใคร?** นักพัฒนาและผู้ใช้ระดับสูงที่ต้องการผู้ช่วย AI ส่วนตัวซึ่งส่งข้อความหาได้จากทุกที่ โดยไม่ต้องสละการควบคุมข้อมูลของตนหรือพึ่งพาบริการที่มีผู้ให้บริการโฮสต์ให้

**แตกต่างอย่างไร?**

- **โฮสต์ด้วยตนเอง**: ทำงานบนฮาร์ดแวร์ของคุณ ภายใต้กฎของคุณ
- **รองรับหลายช่องทาง**: Gateway เดียวให้บริการ Plugin ช่องทางที่กำหนดค่าไว้ทั้งหมดพร้อมกัน
- **ออกแบบมาเพื่อเอเจนต์โดยตรง**: สร้างขึ้นสำหรับเอเจนต์เขียนโค้ด พร้อมการใช้เครื่องมือ เซสชัน หน่วยความจำ และการกำหนดเส้นทางแบบหลายเอเจนต์
- **โอเพนซอร์ส**: ใช้สิทธิ์อนุญาต MIT และขับเคลื่อนโดยชุมชน

**ต้องใช้อะไรบ้าง?** Node 24 (แนะนำ) หรือ Node 22 LTS (`22.19+`) เพื่อความเข้ากันได้ คีย์ API จากผู้ให้บริการที่คุณเลือก และเวลา 5 นาที เพื่อคุณภาพและความปลอดภัยสูงสุด ให้ใช้โมเดลรุ่นล่าสุดที่ทรงประสิทธิภาพที่สุดซึ่งมีให้ใช้งาน

## วิธีการทำงาน

```mermaid
flowchart LR
  A["แอปแชต + Plugin"] --> B["Gateway"]
  B --> C["เอเจนต์ OpenClaw"]
  B --> D["CLI"]
  B --> E["UI ควบคุมบนเว็บ"]
  B --> F["แอป macOS"]
  B --> G["โหนด iOS และ Android"]
```

Gateway เป็นแหล่งข้อมูลจริงเพียงแห่งเดียวสำหรับเซสชัน การกำหนดเส้นทาง และการเชื่อมต่อช่องทาง

## ความสามารถหลัก

<Columns>
  <Card title="Gateway หลายช่องทาง" icon="network" href="/th/channels">
    รองรับ Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat และอื่น ๆ ด้วยกระบวนการ Gateway เพียงหนึ่งกระบวนการ
  </Card>
  <Card title="ช่องทางแบบ Plugin" icon="plug" href="/th/tools/plugin">
    Plugin ช่องทางเพิ่มการรองรับ Matrix, Nostr, Twitch, Zalo และอื่น ๆ ส่วน Plugin อย่างเป็นทางการสามารถติดตั้งได้เมื่อต้องการ
  </Card>
  <Card title="การกำหนดเส้นทางแบบหลายเอเจนต์" icon="route" href="/th/concepts/multi-agent">
    แยกเซสชันตามเอเจนต์ พื้นที่ทำงาน หรือผู้ส่ง
  </Card>
  <Card title="การรองรับสื่อ" icon="image" href="/th/nodes/images">
    ส่งและรับรูปภาพ เสียง และเอกสาร
  </Card>
  <Card title="UI ควบคุมบนเว็บ" icon="monitor" href="/th/web/control-ui">
    แดชบอร์ดในเบราว์เซอร์สำหรับการแชต การกำหนดค่า เซสชัน และโหนด
  </Card>
  <Card title="โหนดมือถือ" icon="smartphone" href="/th/nodes">
    จับคู่โหนด iOS และ Android สำหรับเวิร์กโฟลว์ที่ใช้ Canvas กล้อง และเสียง
  </Card>
</Columns>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="เริ่มต้นระบบและติดตั้งบริการ">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="แชต">
    เปิด UI ควบคุมในเบราว์เซอร์แล้วส่งข้อความ:

    ```bash
    openclaw dashboard
    ```

    หรือเชื่อมต่อช่องทาง ([Telegram](/th/channels/telegram) เร็วที่สุด) แล้วแชตจากโทรศัพท์ของคุณ

  </Step>
</Steps>

ต้องการรายละเอียดการติดตั้งและการตั้งค่าสำหรับการพัฒนาทั้งหมดหรือไม่? ดู [การเริ่มต้นใช้งาน](/th/start/getting-started)

## แดชบอร์ด

เปิด UI ควบคุมในเบราว์เซอร์หลังจาก Gateway เริ่มทำงาน

- ค่าเริ่มต้นภายในเครื่อง: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- การเข้าถึงจากระยะไกล: [ส่วนติดต่อบนเว็บ](/th/web) และ [Tailscale](/th/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## การกำหนดค่า (ไม่บังคับ)

ไฟล์กำหนดค่าอยู่ที่ `~/.openclaw/openclaw.json`

- หากคุณ **ไม่ดำเนินการใด ๆ** OpenClaw จะใช้รันไทม์เอเจนต์ OpenClaw ที่รวมมาให้ ข้อความส่วนตัวจะใช้เซสชันหลักของเอเจนต์ร่วมกัน และแชตกลุ่มแต่ละกลุ่มจะมีเซสชันของตนเอง
- หากต้องการจำกัดการเข้าถึง ให้เริ่มจาก `channels.whatsapp.allowFrom` และกฎการกล่าวถึงสำหรับกลุ่ม

ตัวอย่าง:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## เริ่มจากที่นี่

<Columns>
  <Card title="ศูนย์รวมเอกสาร" href="/th/start/hubs" icon="book-open">
    เอกสารและคู่มือทั้งหมด จัดหมวดหมู่ตามกรณีการใช้งาน
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="settings">
    การตั้งค่าหลักของ Gateway โทเค็น และการกำหนดค่าผู้ให้บริการ
  </Card>
  <Card title="การเข้าถึงจากระยะไกล" href="/th/gateway/remote" icon="globe">
    รูปแบบการเข้าถึงผ่าน SSH และ tailnet
  </Card>
  <Card title="ช่องทาง" href="/th/channels/telegram" icon="message-square">
    การตั้งค่าเฉพาะช่องทางสำหรับ Discord, Feishu, Microsoft Teams, Telegram, WhatsApp และอื่น ๆ
  </Card>
  <Card title="โหนด" href="/th/nodes" icon="smartphone">
    โหนด iOS และ Android พร้อมการจับคู่ Canvas กล้อง และการดำเนินการกับอุปกรณ์
  </Card>
  <Card title="ความช่วยเหลือ" href="/th/help" icon="life-buoy">
    จุดเริ่มต้นสำหรับวิธีแก้ไขทั่วไปและการแก้ไขปัญหา
  </Card>
</Columns>

## เรียนรู้เพิ่มเติม

<Columns>
  <Card title="รายการคุณสมบัติทั้งหมด" href="/th/concepts/features" icon="list">
    ความสามารถด้านช่องทาง การกำหนดเส้นทาง และสื่อทั้งหมด
  </Card>
  <Card title="การกำหนดเส้นทางแบบหลายเอเจนต์" href="/th/concepts/multi-agent" icon="route">
    การแยกพื้นที่ทำงานและเซสชันเฉพาะเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security" icon="shield">
    โทเค็น รายการที่อนุญาต และการควบคุมความปลอดภัย
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/gateway/troubleshooting" icon="wrench">
    การวินิจฉัย Gateway และข้อผิดพลาดที่พบบ่อย
  </Card>
  <Card title="เกี่ยวกับโครงการและผู้มีส่วนร่วม" href="/th/reference/credits" icon="info">
    จุดเริ่มต้นของโครงการ ผู้มีส่วนร่วม และสิทธิ์อนุญาต
  </Card>
</Columns>
