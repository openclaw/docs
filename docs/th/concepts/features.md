---
read_when:
    - คุณต้องการรายการทั้งหมดของสิ่งที่ OpenClaw รองรับ
summary: ความสามารถของ OpenClaw ครอบคลุมช่องทาง การกำหนดเส้นทาง สื่อ และประสบการณ์ผู้ใช้
title: ฟีเจอร์
x-i18n:
    generated_at: "2026-05-07T01:51:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
    source_path: concepts/features.md
    workflow: 16
---

## ไฮไลต์

<Columns>
  <Card title="ช่องทาง" icon="message-square" href="/th/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat และอื่นๆ ด้วย Gateway เดียว
  </Card>
  <Card title="Plugin" icon="plug" href="/th/tools/plugin">
    Plugin ที่รวมมาให้เพิ่ม Matrix, Nextcloud Talk, Nostr, Twitch, Zalo และอื่นๆ โดยไม่ต้องติดตั้งแยกต่างหากในรีลีสปัจจุบันตามปกติ
  </Card>
  <Card title="การกำหนดเส้นทาง" icon="route" href="/th/concepts/multi-agent">
    การกำหนดเส้นทางแบบหลายเอเจนต์พร้อมเซสชันที่แยกจากกัน
  </Card>
  <Card title="สื่อ" icon="image" href="/th/nodes/images">
    รูปภาพ เสียง วิดีโอ เอกสาร และการสร้างรูปภาพ/วิดีโอ
  </Card>
  <Card title="แอปและ UI" icon="monitor" href="/th/web/control-ui">
    Web Control UI และแอปคู่หูบน macOS
  </Card>
  <Card title="โหนดมือถือ" icon="smartphone" href="/th/nodes">
    โหนด iOS และ Android พร้อมการจับคู่ เสียง/แชต และคำสั่งอุปกรณ์แบบสมบูรณ์
  </Card>
</Columns>

## รายการทั้งหมด

**ช่องทาง:**

- ช่องทางในตัวประกอบด้วย Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat และ WhatsApp
- ช่องทางจาก Plugin ที่รวมมาให้ประกอบด้วย BlueBubbles ในฐานะบริดจ์ iMessage แบบเดิม, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo และ Zalo Personal
- Plugin ช่องทางที่ติดตั้งแยกต่างหากได้แบบเลือกใช้ประกอบด้วย Voice Call และแพ็กเกจจากบุคคลที่สาม เช่น WeChat
- Plugin ช่องทางจากบุคคลที่สามสามารถขยาย Gateway เพิ่มเติมได้ เช่น WeChat
- รองรับแชตกลุ่มด้วยการเปิดใช้งานตามการเมนชัน
- ความปลอดภัยของ DM ด้วย allowlist และการจับคู่

**เอเจนต์:**

- รันไทม์เอเจนต์แบบฝังพร้อมการสตรีมเครื่องมือ
- การกำหนดเส้นทางแบบหลายเอเจนต์พร้อมเซสชันที่แยกจากกันต่อพื้นที่ทำงานหรือผู้ส่ง
- เซสชัน: แชตโดยตรงจะรวมเป็น `main` ที่ใช้ร่วมกัน; กลุ่มจะแยกจากกัน
- การสตรีมและการแบ่งชิ้นสำหรับคำตอบยาว

**การยืนยันตัวตนและผู้ให้บริการ:**

- ผู้ให้บริการโมเดลมากกว่า 35 ราย (Anthropic, OpenAI, Google และอื่นๆ)
- การยืนยันตัวตนแบบสมัครสมาชิกผ่าน OAuth (เช่น OpenAI Codex)
- รองรับผู้ให้บริการแบบกำหนดเองและโฮสต์เอง (vLLM, SGLang, Ollama และเอนด์พอยต์ใดๆ ที่เข้ากันได้กับ OpenAI หรือเข้ากันได้กับ Anthropic)

**สื่อ:**

- รูปภาพ เสียง วิดีโอ และเอกสาร ทั้งขาเข้าและขาออก
- พื้นผิวความสามารถร่วมสำหรับการสร้างรูปภาพและการสร้างวิดีโอ
- การถอดความข้อความเสียง
- การแปลงข้อความเป็นเสียงด้วยผู้ให้บริการหลายราย

**แอปและอินเทอร์เฟซ:**

- WebChat และ Control UI บนเบราว์เซอร์
- แอปคู่หูบนแถบเมนู macOS
- โหนด iOS พร้อมการจับคู่ Canvas กล้อง การบันทึกหน้าจอ ตำแหน่ง และเสียง
- โหนด Android พร้อมการจับคู่ แชต เสียง Canvas กล้อง และคำสั่งอุปกรณ์

**เครื่องมือและระบบอัตโนมัติ:**

- ระบบอัตโนมัติของเบราว์เซอร์, exec, sandboxing
- การค้นหาเว็บ (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- งาน Cron และการกำหนดตารางเวลา Heartbeat
- Skills, Plugin และไปป์ไลน์เวิร์กโฟลว์ (Lobster)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ฟีเจอร์ทดลอง" href="/th/concepts/experimental-features" icon="flask">
    ฟีเจอร์แบบเลือกเปิดใช้ที่ยังไม่ได้จัดส่งไปยังพื้นผิวเริ่มต้น
  </Card>
  <Card title="รันไทม์เอเจนต์" href="/th/concepts/agent" icon="robot">
    โมเดลรันไทม์ของเอเจนต์และวิธีจัดส่งการรัน
  </Card>
  <Card title="ช่องทาง" href="/th/channels" icon="message-square">
    เชื่อมต่อ Telegram, WhatsApp, Discord, Slack และอื่นๆ จาก Gateway เดียว
  </Card>
  <Card title="Plugin" href="/th/tools/plugin" icon="plug">
    Plugin ที่รวมมาให้และ Plugin จากบุคคลที่สามที่ขยาย OpenClaw
  </Card>
</CardGroup>
