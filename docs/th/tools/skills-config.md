---
read_when:
    - การเพิ่มหรือแก้ไข config ของ Skills
    - การปรับ allowlist แบบ bundled หรือพฤติกรรมการติดตั้ง
summary: schema และตัวอย่างของ config สำหรับ Skills
title: การตั้งค่า Skills
x-i18n:
    generated_at: "2026-04-23T10:24:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# การตั้งค่า Skills

การกำหนดค่าส่วนใหญ่สำหรับตัวโหลด/ตัวติดตั้ง Skills จะอยู่ภายใต้ `skills` ใน
`~/.openclaw/openclaw.json` ส่วนการมองเห็น Skills เฉพาะ agent จะอยู่ภายใต้
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime ยังเป็น Node; ไม่แนะนำ bun)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือเป็นสตริง plaintext
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

สำหรับการสร้าง/แก้ไขภาพในตัว ให้เลือกใช้ `agents.defaults.imageGenerationModel`
ร่วมกับเครื่องมือ core `image_generate` ส่วน `skills.entries.*` ใช้เฉพาะสำหรับเวิร์กโฟลว์ Skills แบบกำหนดเองหรือของ third-party

หากคุณเลือก provider/model สำหรับภาพแบบเฉพาะเจาะจง ให้กำหนดค่า
auth/API key ของ provider นั้นด้วย ตัวอย่างทั่วไป: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ
`google/*`, `OPENAI_API_KEY` สำหรับ `openai/*` และ `FAL_KEY` สำหรับ `fal/*`

ตัวอย่าง:

- การตั้งค่าแบบ native สไตล์ Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- การตั้งค่า native ของ fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## allowlists ของ Skills สำหรับ agent

ใช้ config ของ agent เมื่อคุณต้องการใช้ราก Skills ของเครื่อง/workspace เดียวกัน แต่มี
ชุด Skills ที่มองเห็นได้แตกต่างกันสำหรับแต่ละ agent

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // สืบทอดค่าเริ่มต้น -> github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

กฎ:

- `agents.defaults.skills`: baseline allowlist แบบใช้ร่วมกันสำหรับ agents ที่ละ
  `agents.list[].skills`
- หากละ `agents.defaults.skills` ไว้ จะถือว่า Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- `agents.list[].skills`: ชุด Skills สุดท้ายแบบชัดเจนสำหรับ agent นั้น; จะไม่
  merge กับค่าเริ่มต้น
- `agents.list[].skills: []`: ไม่เปิดเผย Skills ใด ๆ สำหรับ agent นั้น

## ฟิลด์

- ราก Skills ในตัวจะรวม `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` และ `<workspace>/skills` เสมอ
- `allowBundled`: allowlist แบบไม่บังคับสำหรับ Skills แบบ **bundled** เท่านั้น เมื่อตั้งค่าไว้ จะมีเพียง
  bundled Skills ที่อยู่ในรายการเท่านั้นที่มีสิทธิ์ (ไม่กระทบ managed, agent และ workspace Skills)
- `load.extraDirs`: ไดเรกทอรี Skills เพิ่มเติมที่จะสแกน (มีลำดับความสำคัญต่ำสุด)
- `load.watch`: เฝ้าดูโฟลเดอร์ Skills และรีเฟรช snapshot ของ Skills (ค่าเริ่มต้น: true)
- `load.watchDebounceMs`: ค่า debounce สำหรับเหตุการณ์ของตัวเฝ้าดู Skills หน่วยเป็นมิลลิวินาที (ค่าเริ่มต้น: 250)
- `install.preferBrew`: เลือกใช้ตัวติดตั้ง brew เมื่อมีให้ใช้ (ค่าเริ่มต้น: true)
- `install.nodeManager`: ค่าที่ต้องการสำหรับตัวติดตั้ง node (`npm` | `pnpm` | `yarn` | `bun`, ค่าเริ่มต้น: npm)
  สิ่งนี้มีผลเฉพาะกับ **การติดตั้ง Skills** เท่านั้น; Gateway runtime ควรยังคงเป็น Node
  (ไม่แนะนำ Bun สำหรับ WhatsApp/Telegram)
  - `openclaw setup --node-manager` มีขอบเขตแคบกว่าและปัจจุบันยอมรับ `npm`,
    `pnpm` หรือ `bun` หากคุณต้องการการติดตั้ง Skills ที่อิง Yarn ให้ตั้ง `skills.install.nodeManager: "yarn"` ด้วยตนเอง
- `entries.<skillKey>`: การ override ราย Skill
- `agents.defaults.skills`: allowlist เริ่มต้นของ Skills แบบไม่บังคับที่สืบทอดโดย agents
  ที่ละ `agents.list[].skills`
- `agents.list[].skills`: allowlist สุดท้ายแบบไม่บังคับของ Skills ราย agent; รายการแบบชัดเจน
  จะแทนที่ค่าเริ่มต้นที่สืบทอดมา แทนที่จะ merge

ฟิลด์ราย Skill:

- `enabled`: ตั้ง `false` เพื่อปิดใช้งาน Skill แม้ว่าจะเป็น bundled/installed อยู่ก็ตาม
- `env`: environment variables ที่ถูกฉีดให้กับการรันของ agent (เฉพาะเมื่อยังไม่ได้ตั้งค่าไว้)
- `apiKey`: ตัวช่วยแบบไม่บังคับสำหรับ Skills ที่ประกาศ primary env var ไว้
  รองรับทั้งสตริง plaintext หรือออบเจ็กต์ SecretRef (`{ source, provider, id }`)

## หมายเหตุ

- คีย์ภายใต้ `entries` จะจับคู่กับชื่อ Skill โดยค่าเริ่มต้น หาก Skill ใดกำหนด
  `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นแทน
- ลำดับความสำคัญของการโหลดคือ `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → bundled Skills →
  `skills.load.extraDirs`
- การเปลี่ยนแปลงของ Skills จะถูกนำมาใช้ในเทิร์นถัดไปของ agent เมื่อเปิดใช้งาน watcher

### Skills แบบ sandboxed + env vars

เมื่อ session เป็นแบบ **sandboxed** processes ของ Skill จะรันภายใน
sandbox backend ที่ตั้งค่าไว้ โดย sandbox จะ **ไม่** สืบทอด `process.env` ของโฮสต์

ให้ใช้วิธีใดวิธีหนึ่งต่อไปนี้:

- `agents.defaults.sandbox.docker.env` สำหรับ Docker backend (หรือ `agents.list[].sandbox.docker.env` ราย agent)
- ฝัง env ลงใน custom sandbox image หรือสภาพแวดล้อม sandbox ระยะไกลของคุณ

`env` แบบ global และ `skills.entries.<skill>.env/apiKey` ใช้กับการรันบน **โฮสต์** เท่านั้น
