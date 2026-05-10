---
read_when:
    - คุณต้องการรายการทั้งหมดของสิ่งที่ OpenClaw รองรับ
summary: ความสามารถของ OpenClaw ในด้านช่องทาง การกำหนดเส้นทาง สื่อ และประสบการณ์ผู้ใช้.
title: คุณสมบัติ
x-i18n:
    generated_at: "2026-05-10T19:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## ไฮไลต์

<Columns>
  <Card title="ช่องทาง" icon="message-square" href="/th/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat และอื่นๆ ด้วย Gateway เดียว
  </Card>
  <Card title="Plugins" icon="plug" href="/th/tools/plugin">
    Plugins ที่รวมมาให้เพิ่ม Matrix, Nextcloud Talk, Nostr, Twitch, Zalo และอื่นๆ โดยไม่ต้องติดตั้งแยกในรุ่นปัจจุบันปกติ
  </Card>
  <Card title="การกำหนดเส้นทาง" icon="route" href="/th/concepts/multi-agent">
    การกำหนดเส้นทางแบบหลายเอเจนต์พร้อมเซสชันที่แยกจากกัน
  </Card>
  <Card title="สื่อ" icon="image" href="/th/nodes/images">
    รูปภาพ เสียง วิดีโอ เอกสาร และการสร้างรูปภาพ/วิดีโอ
  </Card>
  <Card title="แอปและ UI" icon="monitor" href="/th/web/control-ui">
    UI ควบคุมบนเว็บและแอปคู่หูสำหรับ macOS
  </Card>
  <Card title="โหนดมือถือ" icon="smartphone" href="/th/nodes">
    โหนด iOS และ Android พร้อมการจับคู่ เสียง/แชต และคำสั่งอุปกรณ์แบบสมบูรณ์
  </Card>
</Columns>

## รายการทั้งหมด

**ช่องทาง:**

- ช่องทางในตัวประกอบด้วย Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat และ WhatsApp
- ช่องทาง Plugin ที่รวมมาให้ประกอบด้วย Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo และ Zalo Personal
- Plugins ช่องทางที่ติดตั้งแยกแบบเลือกได้ประกอบด้วย Voice Call และแพ็กเกจจากบุคคลที่สาม เช่น WeChat
- Plugins ช่องทางจากบุคคลที่สามสามารถขยาย Gateway เพิ่มเติมได้ เช่น WeChat
- รองรับแชตกลุ่มด้วยการเปิดใช้งานตามการกล่าวถึง
- ความปลอดภัยของ DM ด้วย allowlists และการจับคู่

**เอเจนต์:**

- รันไทม์เอเจนต์แบบฝังพร้อมการสตรีมเครื่องมือ
- การกำหนดเส้นทางแบบหลายเอเจนต์พร้อมเซสชันที่แยกตามเวิร์กสเปซหรือผู้ส่ง
- เซสชัน: แชตโดยตรงจะรวมเข้าเป็น `main` ที่ใช้ร่วมกัน; กลุ่มจะแยกจากกัน
- การสตรีมและการแบ่งชิ้นสำหรับคำตอบยาว

**การยืนยันตัวตนและผู้ให้บริการ:**

- ผู้ให้บริการโมเดลมากกว่า 35 ราย (Anthropic, OpenAI, Google และอื่นๆ)
- การยืนยันตัวตนแบบสมัครสมาชิกผ่าน OAuth (เช่น OpenAI Codex)
- รองรับผู้ให้บริการแบบกำหนดเองและโฮสต์เอง (vLLM, SGLang, Ollama และปลายทางใดๆ ที่เข้ากันได้กับ OpenAI หรือเข้ากันได้กับ Anthropic)

**สื่อ:**

- รูปภาพ เสียง วิดีโอ และเอกสารทั้งขาเข้าและขาออก
- พื้นผิวความสามารถร่วมสำหรับการสร้างรูปภาพและการสร้างวิดีโอ
- การถอดเสียงโน้ตเสียง
- แปลงข้อความเป็นเสียงด้วยผู้ให้บริการหลายราย

**แอปและอินเทอร์เฟซ:**

- WebChat และ UI ควบคุมบนเบราว์เซอร์
- แอปคู่หูบนแถบเมนู macOS
- โหนด iOS พร้อมการจับคู่ Canvas กล้อง การบันทึกหน้าจอ ตำแหน่งที่ตั้ง และเสียง
- โหนด Android พร้อมการจับคู่ แชต เสียง Canvas กล้อง และคำสั่งอุปกรณ์

**เครื่องมือและระบบอัตโนมัติ:**

- ระบบอัตโนมัติของเบราว์เซอร์, exec, sandboxing
- การค้นหาเว็บ (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- งาน Cron และการกำหนดเวลา Heartbeat
- Skills, plugins และไปป์ไลน์เวิร์กโฟลว์ (Lobster)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ฟีเจอร์ทดลอง" href="/th/concepts/experimental-features" icon="flask">
    ฟีเจอร์แบบเลือกใช้ที่ยังไม่ได้เผยแพร่สู่พื้นผิวเริ่มต้น
  </Card>
  <Card title="รันไทม์เอเจนต์" href="/th/concepts/agent" icon="robot">
    โมเดลรันไทม์เอเจนต์และวิธีการส่งรันไปดำเนินการ
  </Card>
  <Card title="ช่องทาง" href="/th/channels" icon="message-square">
    เชื่อมต่อ Telegram, WhatsApp, Discord, Slack และอื่นๆ จาก Gateway เดียว
  </Card>
  <Card title="Plugins" href="/th/tools/plugin" icon="plug">
    Plugins ที่รวมมาให้และจากบุคคลที่สามซึ่งขยาย OpenClaw
  </Card>
</CardGroup>
