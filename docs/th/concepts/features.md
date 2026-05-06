---
read_when:
    - คุณต้องการรายการทั้งหมดของสิ่งที่ OpenClaw รองรับ
summary: ความสามารถของ OpenClaw ในด้านช่องทาง การกำหนดเส้นทาง สื่อ และประสบการณ์ผู้ใช้
title: ฟีเจอร์
x-i18n:
    generated_at: "2026-05-06T09:07:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## จุดเด่น

<Columns>
  <Card title="ช่องทาง" icon="message-square" href="/th/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat และอื่นๆ อีกมากมายด้วย Gateway เดียว
  </Card>
  <Card title="Plugin" icon="plug" href="/th/tools/plugin">
    Plugin ที่บันเดิลมาเพิ่ม Matrix, Nextcloud Talk, Nostr, Twitch, Zalo และอื่นๆ โดยไม่ต้องติดตั้งแยกต่างหากในรีลีสปัจจุบันทั่วไป
  </Card>
  <Card title="การกำหนดเส้นทาง" icon="route" href="/th/concepts/multi-agent">
    การกำหนดเส้นทางหลายเอเจนต์พร้อมเซสชันที่แยกกัน
  </Card>
  <Card title="สื่อ" icon="image" href="/th/nodes/images">
    รูปภาพ เสียง วิดีโอ เอกสาร และการสร้างรูปภาพ/วิดีโอ
  </Card>
  <Card title="แอปและ UI" icon="monitor" href="/th/web/control-ui">
    Control UI บนเว็บและแอปประกอบบน macOS
  </Card>
  <Card title="โหนดมือถือ" icon="smartphone" href="/th/nodes">
    โหนด iOS และ Android พร้อมการจับคู่ เสียง/แชต และคำสั่งอุปกรณ์ที่หลากหลาย
  </Card>
</Columns>

## รายการทั้งหมด

**ช่องทาง:**

- ช่องทางในตัวประกอบด้วย Discord, Google Chat, iMessage (รุ่นเดิม), IRC, Signal, Slack, Telegram, WebChat และ WhatsApp
- ช่องทาง Plugin ที่บันเดิลมาประกอบด้วย BlueBubbles สำหรับ iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo และ Zalo Personal
- Plugin ช่องทางแบบเลือกติดตั้งแยกต่างหากประกอบด้วย Voice Call และแพ็กเกจจากบุคคลที่สาม เช่น WeChat
- Plugin ช่องทางจากบุคคลที่สามสามารถขยาย Gateway ได้เพิ่มเติม เช่น WeChat
- รองรับแชตกลุ่มพร้อมการเปิดใช้งานตามการเมนชัน
- ความปลอดภัยของ DM ด้วยรายการอนุญาตและการจับคู่

**เอเจนต์:**

- รันไทม์เอเจนต์แบบฝังพร้อมการสตรีมเครื่องมือ
- การกำหนดเส้นทางหลายเอเจนต์พร้อมเซสชันที่แยกกันต่อเวิร์กสเปซหรือผู้ส่ง
- เซสชัน: แชตโดยตรงจะถูกรวมเข้าเป็น `main` ที่ใช้ร่วมกัน; กลุ่มจะแยกกัน
- การสตรีมและการแบ่งชิ้นสำหรับคำตอบยาวๆ

**การยืนยันตัวตนและผู้ให้บริการ:**

- ผู้ให้บริการโมเดลมากกว่า 35 ราย (Anthropic, OpenAI, Google และอื่นๆ)
- การยืนยันตัวตนแบบสมัครใช้งานผ่าน OAuth (เช่น OpenAI Codex)
- รองรับผู้ให้บริการแบบกำหนดเองและโฮสต์เอง (vLLM, SGLang, Ollama และเอนด์พอยต์ใดๆ ที่เข้ากันได้กับ OpenAI หรือ Anthropic)

**สื่อ:**

- รับและส่งรูปภาพ เสียง วิดีโอ และเอกสาร
- ส่วนเปิดเผยความสามารถร่วมสำหรับการสร้างรูปภาพและการสร้างวิดีโอ
- การถอดเสียงโน้ตเสียง
- การแปลงข้อความเป็นเสียงด้วยผู้ให้บริการหลายราย

**แอปและอินเทอร์เฟซ:**

- WebChat และ Control UI บนเบราว์เซอร์
- แอปประกอบในแถบเมนู macOS
- โหนด iOS พร้อมการจับคู่ Canvas กล้อง การบันทึกหน้าจอ ตำแหน่ง และเสียง
- โหนด Android พร้อมการจับคู่ แชต เสียง Canvas กล้อง และคำสั่งอุปกรณ์

**เครื่องมือและระบบอัตโนมัติ:**

- การทำงานอัตโนมัติของเบราว์เซอร์, exec, การแยกในแซนด์บ็อกซ์
- การค้นหาเว็บ (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- งาน Cron และการกำหนดเวลา Heartbeat
- Skills, Plugin และไปป์ไลน์เวิร์กโฟลว์ (Lobster)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ฟีเจอร์ทดลอง" href="/th/concepts/experimental-features" icon="flask">
    ฟีเจอร์แบบเลือกเปิดใช้ที่ยังไม่ได้ปล่อยสู่พื้นที่ใช้งานเริ่มต้น
  </Card>
  <Card title="รันไทม์เอเจนต์" href="/th/concepts/agent" icon="robot">
    โมเดลรันไทม์ของเอเจนต์และวิธีกระจายการรัน
  </Card>
  <Card title="ช่องทาง" href="/th/channels" icon="message-square">
    เชื่อมต่อ Telegram, WhatsApp, Discord, Slack และอื่นๆ จาก Gateway เดียว
  </Card>
  <Card title="Plugin" href="/th/tools/plugin" icon="plug">
    Plugin ที่บันเดิลมาและ Plugin จากบุคคลที่สามที่ขยาย OpenClaw
  </Card>
</CardGroup>
