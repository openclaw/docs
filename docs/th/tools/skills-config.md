---
read_when:
    - การเพิ่มหรือแก้ไขการกำหนดค่า Skills
    - การปรับรายการอนุญาตที่บันเดิลมาหรือพฤติกรรมการติดตั้ง
summary: สคีมาการกำหนดค่าของ Skills และตัวอย่าง
title: การกำหนดค่า Skills
x-i18n:
    generated_at: "2026-05-06T09:35:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

การกำหนดค่าส่วนใหญ่ของตัวโหลด/ตัวติดตั้ง Skills อยู่ภายใต้ `skills` ใน
`~/.openclaw/openclaw.json` การมองเห็น Skills เฉพาะเอเจนต์อยู่ภายใต้
`agents.defaults.skills` และ `agents.list[].skills`

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

สำหรับการสร้าง/แก้ไขภาพในตัว ให้ใช้ `agents.defaults.imageGenerationModel`
ร่วมกับเครื่องมือหลัก `image_generate` เป็นหลัก `skills.entries.*` ใช้สำหรับเวิร์กโฟลว์ Skills
แบบกำหนดเองหรือของบุคคลที่สามเท่านั้น

หากคุณเลือกผู้ให้บริการ/โมเดลภาพเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการนั้นด้วย
ตัวอย่างทั่วไป: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ
`google/*`, `OPENAI_API_KEY` สำหรับ `openai/*` และ `FAL_KEY` สำหรับ `fal/*`

ตัวอย่าง:

- การตั้งค่าแบบ Native สไตล์ Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- การตั้งค่าแบบ Native สำหรับ fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## รายการอนุญาต Skills ของเอเจนต์

ใช้การกำหนดค่าเอเจนต์เมื่อคุณต้องการใช้ราก Skills ของเครื่อง/เวิร์กสเปซเดียวกัน แต่มีชุด Skills
ที่มองเห็นได้แตกต่างกันในแต่ละเอเจนต์

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

กฎ:

- `agents.defaults.skills`: รายการอนุญาตพื้นฐานร่วมสำหรับเอเจนต์ที่ละเว้น
  `agents.list[].skills`
- ละเว้น `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- `agents.list[].skills`: ชุด Skills สุดท้ายแบบชัดเจนสำหรับเอเจนต์นั้น โดยจะไม่
  ผสานกับค่าเริ่มต้น
- `agents.list[].skills: []`: ไม่เปิดเผย Skills ใด ๆ สำหรับเอเจนต์นั้น

## ฟิลด์

- ราก Skills ในตัวจะรวม `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` และ `<workspace>/skills` เสมอ
- `allowBundled`: รายการอนุญาตทางเลือกสำหรับ Skills **ที่บันเดิลมา** เท่านั้น เมื่อตั้งค่าแล้ว เฉพาะ
  Skills ที่บันเดิลมาในรายการเท่านั้นที่มีสิทธิ์ใช้งาน (Skills แบบ managed, agent และ workspace ไม่ได้รับผลกระทบ)
- `load.extraDirs`: ไดเรกทอรี Skills เพิ่มเติมที่จะสแกน (ลำดับความสำคัญต่ำสุด)
- `load.watch`: เฝ้าดูโฟลเดอร์ Skills และรีเฟรช snapshot ของ Skills (ค่าเริ่มต้น: true)
- `load.watchDebounceMs`: debounce สำหรับอีเวนต์ตัวเฝ้าดู Skills เป็นมิลลิวินาที (ค่าเริ่มต้น: 250)
- `install.preferBrew`: เลือกใช้ตัวติดตั้ง brew เมื่อมีให้ใช้งาน (ค่าเริ่มต้น: true)
- `install.nodeManager`: ค่ากำหนดตัวติดตั้ง node (`npm` | `pnpm` | `yarn` | `bun`, ค่าเริ่มต้น: npm)
  สิ่งนี้มีผลต่อ **การติดตั้ง Skills** เท่านั้น; Gateway runtime ยังควรเป็น Node
  (ไม่แนะนำให้ใช้ Bun สำหรับ WhatsApp/Telegram)
  - `openclaw setup --node-manager` มีขอบเขตแคบกว่า และปัจจุบันรับ `npm`,
    `pnpm` หรือ `bun` ตั้งค่า `skills.install.nodeManager: "yarn"` ด้วยตนเองหากคุณ
    ต้องการการติดตั้ง Skills ที่รองรับด้วย Yarn
- `entries.<skillKey>`: การ override ต่อ Skill
- `agents.defaults.skills`: รายการอนุญาต Skills ค่าเริ่มต้นแบบทางเลือกที่เอเจนต์รับสืบทอด
  เมื่อเอเจนต์นั้นละเว้น `agents.list[].skills`
- `agents.list[].skills`: รายการอนุญาต Skills สุดท้ายแบบทางเลือกต่อเอเจนต์; รายการแบบชัดเจน
  จะแทนที่ค่าเริ่มต้นที่รับสืบทอด แทนที่จะผสานเข้าด้วยกัน

ฟิลด์ต่อ Skill:

- `enabled`: ตั้งค่าเป็น `false` เพื่อปิดใช้งาน Skill แม้ว่าจะถูกบันเดิล/ติดตั้งไว้แล้วก็ตาม
- `env`: ตัวแปรสภาพแวดล้อมที่ฉีดเข้าไปสำหรับการรันเอเจนต์ (เฉพาะเมื่อยังไม่ได้ตั้งค่าไว้)
- `apiKey`: ทางลัดทางเลือกสำหรับ Skills ที่ประกาศตัวแปรสภาพแวดล้อมหลัก
  รองรับสตริง plaintext หรือออบเจ็กต์ SecretRef (`{ source, provider, id }`)

## หมายเหตุ

- คีย์ภายใต้ `entries` จะ map ไปยังชื่อ Skill ตามค่าเริ่มต้น หาก Skill กำหนด
  `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นแทน
- ลำดับความสำคัญในการโหลดคือ `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills ที่บันเดิลมา →
  `skills.load.extraDirs`
- การเปลี่ยนแปลง Skills จะถูกนำมาใช้ในรอบเอเจนต์ถัดไปเมื่อเปิดใช้งานตัวเฝ้าดู

### Skills แบบ sandbox และตัวแปรสภาพแวดล้อม

เมื่อเซสชันเป็นแบบ **sandboxed** กระบวนการ Skills จะรันภายในแบ็กเอนด์ sandbox ที่กำหนดค่าไว้ sandbox จะ **ไม่** รับ `process.env` จากโฮสต์

<Warning>
  `env` ส่วนกลางและ `skills.entries.<skill>.env`/`apiKey` ใช้กับการรันบน **โฮสต์** เท่านั้น ภายใน sandbox สิ่งเหล่านี้ไม่มีผล ดังนั้น Skill ที่ขึ้นกับ `GEMINI_API_KEY` จะล้มเหลวด้วย `apiKey not configured` เว้นแต่ sandbox จะได้รับตัวแปรแยกต่างหาก
</Warning>

ใช้หนึ่งในวิธีต่อไปนี้:

- `agents.defaults.sandbox.docker.env` สำหรับแบ็กเอนด์ Docker (หรือ `agents.list[].sandbox.docker.env` ต่อเอเจนต์)
- ฝัง env เข้าไปในอิมเมจ sandbox แบบกำหนดเองหรือสภาพแวดล้อม sandbox ระยะไกลของคุณ

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills" href="/th/tools/skills" icon="puzzle-piece">
    Skills คืออะไรและโหลดอย่างไร
  </Card>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    การเขียนแพ็ก Skills แบบกำหนดเอง
  </Card>
  <Card title="คำสั่ง Slash" href="/th/tools/slash-commands" icon="terminal">
    แค็ตตาล็อกคำสั่งแบบ Native และคำสั่งกำกับในแชต
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมา `skills` และ `agents.skills` ฉบับเต็ม
  </Card>
</CardGroup>
