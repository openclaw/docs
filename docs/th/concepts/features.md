---
read_when:
    - คุณต้องการรายการทั้งหมดของสิ่งที่ OpenClaw รองรับ
summary: ความสามารถของ OpenClaw ในช่องทางต่าง ๆ การกำหนดเส้นทาง สื่อ และประสบการณ์ผู้ใช้
title: คุณสมบัติ
x-i18n:
    generated_at: "2026-07-12T15:57:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## จุดเด่น

<Columns>
  <Card title="ช่องทาง" icon="message-square" href="/th/channels">
    เชื่อมต่อ Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat และอื่น ๆ ด้วย Gateway เดียว
  </Card>
  <Card title="Plugin" icon="plug" href="/th/tools/plugin">
    Plugin อย่างเป็นทางการเพิ่ม Matrix, Nextcloud Talk, Nostr, Twitch, Zalo และบริการอื่นอีกหลายสิบรายการได้ด้วยคำสั่งติดตั้งเพียงคำสั่งเดียว
  </Card>
  <Card title="การกำหนดเส้นทาง" icon="route" href="/th/concepts/multi-agent">
    การกำหนดเส้นทางแบบหลายเอเจนต์พร้อมเซสชันที่แยกจากกัน
  </Card>
  <Card title="สื่อ" icon="image" href="/th/nodes/images">
    รูปภาพ เสียง วิดีโอ เอกสาร และการสร้างรูปภาพ/วิดีโอ
  </Card>
  <Card title="แอปและส่วนติดต่อผู้ใช้" icon="monitor" href="/th/platforms">
    Windows Hub, Control UI บนเบราว์เซอร์, แอปแถบเมนู macOS และ Node บนอุปกรณ์เคลื่อนที่
  </Card>
  <Card title="Node บนอุปกรณ์เคลื่อนที่" icon="smartphone" href="/th/nodes">
    Node สำหรับ iOS และ Android ที่รองรับการจับคู่ เสียง/แชต และคำสั่งควบคุมอุปกรณ์ที่หลากหลาย
  </Card>
</Columns>

## รายการทั้งหมด

**ช่องทาง:**

- iMessage, Telegram และ WebChat มาพร้อมกับการติดตั้งส่วนหลัก ส่วนช่องทางอื่นทั้งหมดเป็น
  Plugin อย่างเป็นทางการที่ติดตั้งด้วย `openclaw plugins install @openclaw/<id>` (หรือติดตั้งเมื่อต้องการ
  ระหว่าง `openclaw onboard` / `openclaw channels add`)
- ช่องทาง Plugin อย่างเป็นทางการ: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo และ Zalo Personal
- ช่องทาง Plugin ภายนอกที่ดูแลนอกคลัง OpenClaw: WeChat, Yuanbao และ Zalo ClawBot
- รองรับแชตกลุ่มพร้อมการเปิดใช้งานเมื่อมีการกล่าวถึง
- ความปลอดภัยของข้อความส่วนตัวด้วยรายการที่อนุญาตและการจับคู่

**เอเจนต์:**

- รันไทม์เอเจนต์แบบฝังตัวพร้อมการสตรีมเครื่องมือ
- การกำหนดเส้นทางแบบหลายเอเจนต์พร้อมเซสชันที่แยกตามพื้นที่ทำงานหรือผู้ส่ง
- เซสชัน: แชตโดยตรงจะรวมอยู่ใน `main` ที่ใช้ร่วมกัน ส่วนกลุ่มจะแยกจากกัน
- การสตรีมและแบ่งส่วนสำหรับการตอบกลับขนาดยาว

**การยืนยันตัวตนและผู้ให้บริการ:**

- ผู้ให้บริการโมเดลมากกว่า 35 ราย (Anthropic, OpenAI, Google และอื่น ๆ)
- การยืนยันตัวตนสำหรับการสมัครสมาชิกผ่าน OAuth (เช่น OpenAI Codex)
- รองรับผู้ให้บริการแบบกำหนดเองและโฮสต์เอง (vLLM, SGLang, Ollama, llama.cpp, LM Studio และ
  ปลายทางใด ๆ ที่เข้ากันได้กับ OpenAI หรือ Anthropic)

**สื่อ:**

- รับและส่งรูปภาพ เสียง วิดีโอ และเอกสาร
- พื้นผิวความสามารถที่ใช้ร่วมกันสำหรับการสร้างรูปภาพและวิดีโอ
- การถอดเสียงบันทึกเสียง
- การแปลงข้อความเป็นเสียงด้วยผู้ให้บริการหลายราย

**แอปและส่วนติดต่อ:**

- WebChat และ Control UI บนเบราว์เซอร์
- แอปผู้ช่วยบนแถบเมนู macOS
- Node สำหรับ iOS พร้อมการจับคู่ Canvas กล้อง การบันทึกหน้าจอ ตำแหน่งที่ตั้ง และเสียง
- Node สำหรับ Android พร้อมการจับคู่ แชต เสียง Canvas กล้อง และคำสั่งควบคุมอุปกรณ์

**เครื่องมือและระบบอัตโนมัติ:**

- ระบบอัตโนมัติสำหรับเบราว์เซอร์ การเรียกใช้คำสั่ง และการแยกสภาพแวดล้อม
- การค้นหาเว็บ (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- งาน Cron และการจัดกำหนดการ Heartbeat
- Skills, Plugin และไปป์ไลน์เวิร์กโฟลว์ (Lobster)

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ฟีเจอร์ทดลอง" href="/th/concepts/experimental-features" icon="flask">
    ฟีเจอร์แบบเลือกเปิดใช้ที่ยังไม่ได้เผยแพร่ในพื้นผิวเริ่มต้น
  </Card>
  <Card title="รันไทม์เอเจนต์" href="/th/concepts/agent" icon="robot">
    โมเดลรันไทม์เอเจนต์และวิธีส่งงานการทำงาน
  </Card>
  <Card title="ช่องทาง" href="/th/channels" icon="message-square">
    เชื่อมต่อ Telegram, WhatsApp, Discord, Slack และอื่น ๆ จาก Gateway เดียว
  </Card>
  <Card title="Plugin" href="/th/tools/plugin" icon="plug">
    Plugin อย่างเป็นทางการและภายนอกที่ช่วยขยายความสามารถของ OpenClaw
  </Card>
</CardGroup>
