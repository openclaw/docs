---
read_when:
    - การเพิ่มหรือแก้ไขการกำหนดค่า Skills
    - การปรับ allowlist ที่รวมมาให้หรือพฤติกรรมการติดตั้ง
summary: สคีมาและตัวอย่างการกำหนดค่า Skills
title: การกำหนดค่า Skills
x-i18n:
    generated_at: "2026-05-10T20:01:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

การกำหนดค่าการโหลด/ติดตั้ง Skills ส่วนใหญ่อยู่ภายใต้ `skills` ใน
`~/.openclaw/openclaw.json` การมองเห็น skill เฉพาะ agent อยู่ภายใต้
`agents.defaults.skills` และ `agents.list[].skills`

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
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
ร่วมกับเครื่องมือหลัก `image_generate` เป็นหลัก `skills.entries.*` ใช้เฉพาะสำหรับเวิร์กโฟลว์ skill แบบกำหนดเองหรือของบุคคลที่สามเท่านั้น

หากคุณเลือกผู้ให้บริการ/โมเดลภาพเฉพาะ ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นด้วย ตัวอย่างทั่วไป: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ
`google/*`, `OPENAI_API_KEY` สำหรับ `openai/*` และ `FAL_KEY` สำหรับ `fal/*`

ตัวอย่าง:

- การตั้งค่าสไตล์ Native Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- การตั้งค่า native fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## allowlist ของ agent skill

ใช้การกำหนดค่า agent เมื่อคุณต้องการ root ของ skill สำหรับเครื่อง/เวิร์กสเปซเดียวกัน แต่ต้องการชุด skill ที่มองเห็นได้แตกต่างกันในแต่ละ agent

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

- `agents.defaults.skills`: allowlist พื้นฐานร่วมสำหรับ agent ที่ละเว้น
  `agents.list[].skills`
- ละเว้น `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดตามค่าเริ่มต้น
- `agents.list[].skills`: ชุด skill สุดท้ายที่ระบุอย่างชัดเจนสำหรับ agent นั้น โดยจะไม่รวมกับค่าเริ่มต้น
- `agents.list[].skills: []`: ไม่เปิดเผย skill ใด ๆ สำหรับ agent นั้น

## ฟิลด์

- root ของ skill ในตัวจะรวม `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` และ `<workspace>/skills` เสมอ
- `allowBundled`: allowlist ทางเลือกสำหรับ Skills แบบ **bundled** เท่านั้น เมื่อตั้งค่าแล้ว จะมีเพียง Skills แบบ bundled ในรายการเท่านั้นที่มีสิทธิ์ใช้งาน (Skills แบบ managed, agent และ workspace ไม่ได้รับผลกระทบ)
- `load.extraDirs`: ไดเรกทอรี skill เพิ่มเติมสำหรับสแกน (ลำดับความสำคัญต่ำสุด)
- `load.allowSymlinkTargets`: ไดเรกทอรีเป้าหมายจริงที่เชื่อถือ ซึ่งโฟลเดอร์ skill ที่เป็น symlink สามารถ resolve เข้าไปได้ แม้ symlink จะอยู่นอก root เป้าหมายนั้น ใช้สิ่งนี้สำหรับเลย์เอาต์ repo ข้างเคียงที่ตั้งใจไว้ เช่น
  `~/.agents/skills/manager -> ~/Projects/manager/skills`
- `load.watch`: เฝ้าดูโฟลเดอร์ skill และรีเฟรช snapshot ของ Skills (ค่าเริ่มต้น: true)
- `load.watchDebounceMs`: debounce สำหรับเหตุการณ์ watcher ของ skill เป็นมิลลิวินาที (ค่าเริ่มต้น: 250)
- `install.preferBrew`: ใช้ตัวติดตั้ง brew เป็นหลักเมื่อมีให้ใช้ (ค่าเริ่มต้น: true)
- `install.nodeManager`: การตั้งค่าตัวติดตั้ง node ที่ต้องการ (`npm` | `pnpm` | `yarn` | `bun`, ค่าเริ่มต้น: npm)
  สิ่งนี้มีผลเฉพาะกับ **การติดตั้ง skill** เท่านั้น; runtime ของ Gateway ยังควรเป็น Node
  (ไม่แนะนำ Bun สำหรับ WhatsApp/Telegram)
  - `openclaw setup --node-manager` มีขอบเขตแคบกว่าและปัจจุบันรับ `npm`,
    `pnpm` หรือ `bun` ตั้งค่า `skills.install.nodeManager: "yarn"` ด้วยตนเองหากคุณต้องการการติดตั้ง skill ที่ใช้ Yarn เป็นฐาน
- `install.allowUploadedArchives`: อนุญาตให้ Gateway clients ที่เชื่อถือได้ระดับ `operator.admin` ติดตั้ง zip archive ส่วนตัวที่ staged ผ่าน `skills.upload.*`
  (ค่าเริ่มต้น: false) สิ่งนี้เปิดใช้เฉพาะเส้นทาง uploaded-archive; การติดตั้ง ClawHub ปกติไม่ต้องใช้
- `entries.<skillKey>`: การ override ราย skill
- `agents.defaults.skills`: allowlist ของ skill เริ่มต้นทางเลือกที่ agent ที่ละเว้น
  `agents.list[].skills` จะสืบทอด
- `agents.list[].skills`: allowlist สุดท้ายราย agent ทางเลือก; รายการที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นที่สืบทอดมาแทนที่จะรวมกัน

## repo ข้างเคียงที่เป็น symlink

ตามค่าเริ่มต้น root ของ skill แต่ละรายการเป็นขอบเขตการกักกัน หากโฟลเดอร์ skill ภายใต้
`~/.agents/skills` เป็น symlink ที่ resolve ออกนอก `~/.agents/skills`,
OpenClaw จะข้ามรายการนั้นและบันทึก `Skipping escaped skill path outside its configured
root`

คงเลย์เอาต์ symlink ไว้และอนุญาตเฉพาะ root เป้าหมายที่เชื่อถือได้:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

ด้วยการกำหนดค่านี้ symlink เช่น
`~/.agents/skills/manager -> ~/Projects/manager/skills` จะได้รับการยอมรับหลังจาก
realpath resolution นอกจากนี้ `extraDirs` ยังสแกน repo ข้างเคียงโดยตรง ขณะที่
`allowSymlinkTargets` รักษา path ที่เป็น symlink สำหรับเลย์เอาต์ agent-skill ที่มีอยู่ไว้ ให้กำหนด target entry ให้แคบ; อย่าชี้ไปที่ root กว้าง ๆ เช่น `~` หรือ
`~/Projects` เว้นแต่ skill tree ทุกชุดภายใต้ root นั้นจะเชื่อถือได้

ฟิลด์ราย skill:

- `enabled`: ตั้งค่าเป็น `false` เพื่อปิดใช้งาน skill แม้ว่าจะเป็น bundled/installed อยู่ก็ตาม
- `env`: environment variables ที่ inject สำหรับการรัน agent (เฉพาะเมื่อยังไม่ได้ตั้งค่าไว้)
- `apiKey`: ความสะดวกทางเลือกสำหรับ Skills ที่ประกาศ env var หลัก
  รองรับสตริง plaintext หรืออ็อบเจ็กต์ SecretRef (`{ source, provider, id }`)

## หมายเหตุ

- key ภายใต้ `entries` จะ map ไปยังชื่อ skill ตามค่าเริ่มต้น หาก skill กำหนด
  `metadata.openclaw.skillKey` ให้ใช้ key นั้นแทน
- ลำดับความสำคัญในการโหลดคือ `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills แบบ bundled →
  `skills.load.extraDirs`
- การเปลี่ยนแปลงของ Skills จะถูกนำไปใช้ใน turn ถัดไปของ agent เมื่อ watcher เปิดใช้งานอยู่

### Skills แบบ sandboxed และ env vars

เมื่อ session เป็นแบบ **sandboxed** กระบวนการ skill จะรันภายใน sandbox backend ที่กำหนดค่าไว้ sandbox จะ **ไม่** สืบทอด `process.env` ของ host

<Warning>
  `env` แบบ global และ `skills.entries.<skill>.env`/`apiKey` ใช้กับการรันบน **host** เท่านั้น ภายใน sandbox สิ่งเหล่านี้ไม่มีผล ดังนั้น skill ที่ขึ้นกับ `GEMINI_API_KEY` จะล้มเหลวด้วย `apiKey not configured` เว้นแต่จะให้ตัวแปรกับ sandbox แยกต่างหาก
</Warning>

ใช้หนึ่งในตัวเลือกต่อไปนี้:

- `agents.defaults.sandbox.docker.env` สำหรับ Docker backend (หรือ `agents.list[].sandbox.docker.env` ราย agent)
- ฝัง env ลงใน image sandbox ที่กำหนดเองหรือสภาพแวดล้อม sandbox ระยะไกลของคุณ

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills" href="/th/tools/skills" icon="puzzle-piece">
    Skills คืออะไรและโหลดอย่างไร
  </Card>
  <Card title="Creating skills" href="/th/tools/creating-skills" icon="hammer">
    การสร้างแพ็ก skill แบบกำหนดเอง
  </Card>
  <Card title="Slash commands" href="/th/tools/slash-commands" icon="terminal">
    แคตตาล็อกคำสั่ง native และคำสั่งกำกับในแชต
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    schema ของ `skills` และ `agents.skills` แบบเต็ม
  </Card>
</CardGroup>
