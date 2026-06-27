---
read_when:
    - คุณต้องการรายการทั้งหมดว่า OpenClaw รองรับอะไรบ้าง
summary: ความสามารถของ OpenClaw ครอบคลุมช่องทาง การกำหนดเส้นทาง สื่อ และ UX.
title: ฟีเจอร์
x-i18n:
    generated_at: "2026-06-27T17:26:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## ไฮไลต์

<Columns>
  <Card title="ช่องทาง" icon="message-square" href="/th/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat และอื่น ๆ ด้วย Gateway เดียว
  </Card>
  <Card title="Plugin" icon="plug" href="/th/tools/plugin">
    Plugin ที่รวมมาเพิ่ม Matrix, Nextcloud Talk, Nostr, Twitch, Zalo และอื่น ๆ โดยไม่ต้องติดตั้งแยกในรุ่นปัจจุบันตามปกติ
  </Card>
  <Card title="การกำหนดเส้นทาง" icon="route" href="/th/concepts/multi-agent">
    การกำหนดเส้นทางหลายเอเจนต์พร้อมเซสชันที่แยกจากกัน
  </Card>
  <Card title="สื่อ" icon="image" href="/th/nodes/images">
    รูปภาพ เสียง วิดีโอ เอกสาร และการสร้างรูปภาพ/วิดีโอ
  </Card>
  <Card title="แอปและ UI" icon="monitor" href="/th/platforms">
    Windows Hub, UI ควบคุมบนเว็บ, แอป macOS และโหนดมือถือ
  </Card>
  <Card title="โหนดมือถือ" icon="smartphone" href="/th/nodes">
    โหนด iOS และ Android พร้อมการจับคู่ เสียง/แชท และคำสั่งอุปกรณ์แบบสมบูรณ์
  </Card>
</Columns>

## รายการทั้งหมด

**ช่องทาง:**

- ช่องทางในตัวประกอบด้วย Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat และ WhatsApp
- ช่องทาง Plugin ที่รวมมาประกอบด้วย Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo และ Zalo Personal
- Plugin ช่องทางเสริมที่ติดตั้งแยกได้ประกอบด้วย Voice Call และแพ็กเกจของบุคคลที่สาม เช่น WeChat
- Plugin ช่องทางของบุคคลที่สามสามารถขยาย Gateway เพิ่มเติมได้ เช่น WeChat
- รองรับแชทกลุ่มพร้อมการเปิดใช้งานตามการกล่าวถึง
- ความปลอดภัยของ DM ด้วยรายการอนุญาตและการจับคู่

**เอเจนต์:**

- รันไทม์เอเจนต์แบบฝังพร้อมการสตรีมเครื่องมือ
- การกำหนดเส้นทางหลายเอเจนต์พร้อมเซสชันที่แยกจากกันต่อเวิร์กสเปซหรือผู้ส่ง
- เซสชัน: แชทโดยตรงจะรวมเข้าเป็น `main` ที่ใช้ร่วมกัน; กลุ่มจะแยกจากกัน
- การสตรีมและการแบ่งส่วนสำหรับการตอบกลับที่ยาว

**การยืนยันตัวตนและผู้ให้บริการ:**

- ผู้ให้บริการโมเดลมากกว่า 35 ราย (Anthropic, OpenAI, Google และอื่น ๆ)
- การยืนยันตัวตนแบบสมัครใช้งานผ่าน OAuth (เช่น OpenAI Codex)
- รองรับผู้ให้บริการแบบกำหนดเองและโฮสต์เอง (vLLM, SGLang, Ollama และเอนด์พอยต์ใด ๆ ที่เข้ากันได้กับ OpenAI หรือ Anthropic)

**สื่อ:**

- รับและส่งรูปภาพ เสียง วิดีโอ และเอกสาร
- พื้นผิวความสามารถที่ใช้ร่วมกันสำหรับการสร้างรูปภาพและการสร้างวิดีโอ
- การถอดเสียงบันทึกเสียง
- การแปลงข้อความเป็นเสียงพูดด้วยผู้ให้บริการหลายราย

**แอปและอินเทอร์เฟซ:**

- WebChat และ UI ควบคุมบนเบราว์เซอร์
- แอปคู่หูบนแถบเมนู macOS
- โหนด iOS พร้อมการจับคู่, Canvas, กล้อง, การบันทึกหน้าจอ, ตำแหน่งที่ตั้ง และเสียง
- โหนด Android พร้อมการจับคู่, แชท, เสียง, Canvas, กล้อง และคำสั่งอุปกรณ์

**เครื่องมือและระบบอัตโนมัติ:**

- ระบบอัตโนมัติของเบราว์เซอร์, exec, sandboxing
- การค้นหาเว็บ (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- งาน Cron และการจัดกำหนดการ Heartbeat
- Skills, Plugin และไปป์ไลน์เวิร์กโฟลว์ (Lobster)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ฟีเจอร์ทดลอง" href="/th/concepts/experimental-features" icon="flask">
    ฟีเจอร์แบบเลือกใช้ที่ยังไม่ได้จัดส่งไปยังพื้นผิวเริ่มต้น
  </Card>
  <Card title="รันไทม์เอเจนต์" href="/th/concepts/agent" icon="robot">
    โมเดลรันไทม์เอเจนต์และวิธีส่งรัน
  </Card>
  <Card title="ช่องทาง" href="/th/channels" icon="message-square">
    เชื่อมต่อ Telegram, WhatsApp, Discord, Slack และอื่น ๆ จาก Gateway เดียว
  </Card>
  <Card title="Plugin" href="/th/tools/plugin" icon="plug">
    Plugin ที่รวมมาและ Plugin ของบุคคลที่สามที่ขยาย OpenClaw
  </Card>
</CardGroup>
