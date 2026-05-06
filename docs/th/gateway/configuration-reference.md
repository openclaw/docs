---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่ถูกต้องแม่นยำ
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงเฉพาะของระบบย่อย
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-06T09:12:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119194a7e041a7ca35b9dd1575c4f4c4d5c67f412cd3002e65bf5b706b210a90
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการกำหนดค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมเชิงงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการกำหนดค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงตัวปรับแต่งหน่วยความจำเชิงลึก/QMD จะอยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

ความจริงจากโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวมเมทาดาทาจากบันเดิล/Plugin/ช่องทางเข้ามาเมื่อมีให้ใช้งาน
- `config.schema.lookup` ส่งคืนโหนดสคีมาหนึ่งรายการตามขอบเขตพาธสำหรับเครื่องมือเจาะดูรายละเอียด
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮชฐานข้อมูลเอกสารการกำหนดค่าเทียบกับพื้นผิวสคีมาปัจจุบัน

พาธค้นหาเอเจนต์: ใช้การกระทำเครื่องมือ `gateway` ชื่อ `config.schema.lookup` เพื่อดูเอกสารและข้อจำกัดระดับฟิลด์ที่แน่นอนก่อนแก้ไข ใช้ [การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำเชิงงาน และใช้หน้านี้สำหรับแผนที่ฟิลด์ที่กว้างกว่า ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะเรื่อง:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการกำหนดค่า Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่งสแลช](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งในตัว + แบบบันเดิลปัจจุบัน
- หน้าช่องทาง/Plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบการกำหนดค่าคือ **JSON5** (อนุญาตให้มีความคิดเห็น + คอมมาต่อท้ายได้) ทุกฟิลด์เป็นทางเลือก - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## ช่องทาง

คีย์การกำหนดค่าต่อช่องทางย้ายไปยังหน้าเฉพาะแล้ว - ดู [การกำหนดค่า - ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*` รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางแบบบันเดิลอื่นๆ (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การกั้นด้วยการกล่าวถึง)

## ค่าเริ่มต้นเอเจนต์, หลายเอเจนต์, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว - ดู [การกำหนดค่า - เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (พื้นที่ทำงาน, โมเดล, การคิด, Heartbeat, หน่วยความจำ, สื่อ, Skills, แซนด์บ็อกซ์)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกหลายเอเจนต์)
- `session.*` (วงจรชีวิตเซสชัน, Compaction, การตัดแต่ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์มาร์กดาวน์)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: รหัสภาษา BCP 47 แบบทางเลือกสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดพักค่าเริ่มต้นของแพลตฟอร์มก่อนส่งทรานสคริปต์ (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายเครื่องมือ, สวิตช์ทดลอง, การกำหนดค่าเครื่องมือที่รองรับโดยผู้ให้บริการ และการตั้งค่าผู้ให้บริการแบบกำหนดเอง / URL ฐาน ย้ายไปยังหน้าเฉพาะแล้ว - ดู [การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## โมเดล

นิยามผู้ให้บริการ, รายการอนุญาตโมเดล และการตั้งค่าผู้ให้บริการแบบกำหนดเองอยู่ใน [การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
ราก `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อกโมเดลส่วนกลางด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
- `models.providers`: แมปผู้ให้บริการแบบกำหนดเองที่ใช้รหัสผู้ให้บริการเป็นคีย์
- `models.pricing.enabled`: ควบคุมการบูตสแตรปราคาพื้นหลังที่เริ่มหลังจากไซด์คาร์และช่องทางไปถึงพาธพร้อมใช้งานของ Gateway เมื่อเป็น `false` Gateway จะข้ามการดึงแค็ตตาล็อกราคาของ OpenRouter และ LiteLLM; ค่า `models.providers.*.models[].cost` ที่กำหนดไว้ยังใช้ได้สำหรับการประมาณต้นทุนในเครื่อง

## MCP

นิยามเซิร์ฟเวอร์ MCP ที่จัดการโดย OpenClaw อยู่ภายใต้ `mcp.servers` และถูกใช้โดย Pi แบบฝังตัวและอะแดปเตอร์รันไทม์อื่นๆ คำสั่ง `openclaw mcp list`, `show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อไปยังเซิร์ฟเวอร์เป้าหมายระหว่างการแก้ไขการกำหนดค่า

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: นิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือระยะไกลที่มีชื่อ สำหรับรันไทม์ที่เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้ รายการระยะไกลใช้ `transport: "streamable-http"` หรือ `transport: "sse"`; `type: "http"` เป็นนามแฝงแบบ CLI-native ที่ `openclaw mcp set` และ `openclaw doctor --fix` ทำให้อยู่ในฟิลด์ `transport` ตามรูปแบบมาตรฐาน
- `mcp.sessionIdleTtlMs`: TTL เมื่อไม่ได้ใช้งานสำหรับรันไทม์ MCP แบบบันเดิลที่มีขอบเขตตามเซสชัน การรันแบบครั้งเดียวที่ฝังตัวจะร้องขอการล้างข้อมูลเมื่อจบการรัน; TTL นี้เป็นตัวสำรองสำหรับเซสชันระยะยาวและผู้เรียกในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` มีผลแบบร้อนโดยกำจัดรันไทม์ MCP ของเซสชันที่แคชไว้ การค้นหา/ใช้เครื่องมือครั้งถัดไปจะสร้างใหม่จากการกำหนดค่าใหม่ ดังนั้นรายการ `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ TTL เมื่อไม่ได้ใช้งาน

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ [แบ็กเอนด์ CLI](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรมรันไทม์

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: รายการอนุญาตแบบทางเลือกสำหรับ Skills แบบบันเดิลเท่านั้น (Skills ที่จัดการ/ในพื้นที่ทำงานไม่ได้รับผลกระทบ)
- `load.extraDirs`: ราก Skills ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกใช้ตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew` ให้ใช้งาน ก่อนถอยกลับไปใช้ชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ค่ากำหนดตัวติดตั้ง node สำหรับสเปก `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน Skill แม้ว่าจะเป็นแบบบันเดิล/ติดตั้งแล้วก็ตาม
- `entries.<skillKey>.apiKey`: ความสะดวกสำหรับ Skills ที่ประกาศตัวแปรสภาพแวดล้อมหลัก (สตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef)

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` รวมถึง `plugins.load.paths`
- การค้นพบรองรับ Plugin ดั้งเดิมของ OpenClaw รวมถึงบันเดิล Codex ที่เข้ากันได้และบันเดิล Claude รวมถึงบันเดิลเลย์เอาต์ค่าเริ่มต้นของ Claude ที่ไม่มีแมนิเฟสต์
- **การเปลี่ยนแปลงการกำหนดค่าต้องรีสตาร์ท gateway**
- `allow`: รายการอนุญาตแบบทางเลือก (โหลดเฉพาะ Plugins ที่อยู่ในรายการ) `deny` มีสิทธิ์เหนือกว่า
- `bundledDiscovery`: ค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้น `plugins.allow` ที่ไม่ว่างจะกั้น Plugin ผู้ให้บริการแบบบันเดิลด้วย รวมถึงผู้ให้บริการรันไทม์ web-search Doctor เขียน `"compat"` สำหรับการกำหนดค่ารายการอนุญาตเดิมที่ย้ายมา เพื่อรักษาพฤติกรรมผู้ให้บริการแบบบันเดิลที่มีอยู่จนกว่าคุณจะเลือกใช้
- `plugins.entries.<id>.apiKey`: ฟิลด์ความสะดวกสำหรับคีย์ API ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แมปตัวแปรสภาพแวดล้อมที่มีขอบเขตตาม Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และเพิกเฉยฟิลด์ที่แก้ไขพรอมป์จาก `before_agent_start` แบบเดิม ขณะยังรักษา `modelOverride` และ `providerOverride` แบบเดิมไว้ ใช้กับฮุก Plugin ดั้งเดิมและไดเรกทอรีฮุกที่รองรับซึ่งมาจากบันเดิล
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin นอกบันเดิลที่เชื่อถือได้อาจอ่านเนื้อหาการสนทนาดิบจากฮุกแบบมีชนิด เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอการแทนที่ `provider` และ `model` ต่อการรันสำหรับการรันเอเจนต์ย่อยเบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: รายการอนุญาตแบบทางเลือกของเป้าหมาย `provider/model` ตามรูปแบบมาตรฐานสำหรับการแทนที่เอเจนต์ย่อยที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.config`: ออบเจ็กต์การกำหนดค่าที่ Plugin กำหนด (ตรวจสอบความถูกต้องโดยสคีมา Plugin ดั้งเดิมของ OpenClaw เมื่อมีให้ใช้งาน)
- การตั้งค่าบัญชี/รันไทม์ของ Plugin ช่องทางอยู่ภายใต้ `channels.<id>` และควรอธิบายโดยเมทาดาทา `channelConfigs` ในแมนิเฟสต์ของ Plugin เจ้าของ ไม่ใช่โดยรีจิสทรีตัวเลือกส่วนกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการดึงเว็บ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl (รองรับ SecretRef) ถอยกลับไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` เดิม หรือ ตัวแปรสภาพแวดล้อม `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ API Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; การแทนที่แบบโฮสต์เองต้องชี้ไปยังปลายทางส่วนตัว/ภายใน)
  - `onlyMainContent`: แยกเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: ระยะหมดเวลาคำขอสเครปเป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นเว็บ Grok)
  - `enabled`: เปิดใช้ผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า Dreaming ของหน่วยความจำ ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและเกณฑ์
  - `enabled`: สวิตช์หลักของ Dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ cron สำหรับการกวาด Dreaming เต็มรูปแบบแต่ละครั้ง (`"0 3 * * *"` โดยค่าเริ่มต้น)
  - `model`: การแทนที่โมเดลเอเจนต์ย่อย Dream Diary แบบทางเลือก ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะลองอีกครั้งหนึ่งครั้งด้วยโมเดลค่าเริ่มต้นของเซสชัน; ความล้มเหลวด้านความเชื่อถือหรือรายการอนุญาตจะไม่ถอยกลับอย่างเงียบๆ
  - นโยบายเฟสและเกณฑ์เป็นรายละเอียดการใช้งานภายใน (ไม่ใช่คีย์การกำหนดค่าที่ผู้ใช้เห็น)
- การกำหนดค่าหน่วยความจำเต็มอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้งานยังสามารถส่งค่าเริ่มต้น Pi แบบฝังตัวจาก `settings.json`; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่าเอเจนต์ที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่เป็นแพตช์การกำหนดค่า OpenClaw ดิบ
- `plugins.slots.memory`: เลือกรหัส Plugin หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้งาน Plugins หน่วยความจำ
- `plugins.slots.contextEngine`: เลือกรหัส Plugin เอ็นจินบริบทที่ใช้งานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณจะติดตั้งและเลือกเอ็นจินอื่น

ดู [Plugins](/th/tools/plugin)

---

## ข้อผูกพัน

`commitments` ควบคุมหน่วยความจำติดตามผลที่อนุมานได้: OpenClaw สามารถตรวจจับการเช็กอินจากรอบการสนทนาและส่งผ่านการรัน Heartbeat

- `commitments.enabled`: เปิดใช้การสกัดด้วย LLM แบบซ่อน, การจัดเก็บ และการส่งผ่าน Heartbeat สำหรับข้อผูกพันติดตามผลที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวนข้อผูกพันติดตามผลที่อนุมานได้สูงสุดที่ส่งต่อเซสชันเอเจนต์ในหนึ่งวันแบบเลื่อน ค่าเริ่มต้น: `3`

ดู [ข้อผูกพันที่อนุมานได้](/th/concepts/commitments)

---

## เบราว์เซอร์

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` ปิดใช้งาน `act:evaluate` และ `wait --fn`
- `tabCleanup` เรียกคืนแท็บของเอเจนต์หลักที่ติดตามไว้หลังจากไม่มีการใช้งานหรือเมื่อเซสชัน
  เกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมดล้างข้อมูลแต่ละโหมดเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดเป็นค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจไว้วางใจการนำทางเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด ปลายทางโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นหา
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับเป็นชื่อแทนแบบเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นหา `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับคำขอตรวจสอบการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่มีการจัดการจะคงค่าเริ่มต้น CDP ภายในไว้
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ภายในที่มีการจัดการและอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตภายใน
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` คงข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การทำงานที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS-selector, hook อัปโหลดไฟล์เดียว,
  ไม่มีการ override timeout ของ dialog, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการทำงานแบบ batch
- โปรไฟล์ `openclaw` ภายในที่มีการจัดการจะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ตั้งค่า
  `cdpUrl` โดยชัดเจนเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ภายในที่มีการจัดการสามารถตั้งค่า `executablePath` เพื่อ override ค่า
  `browser.executablePath` แบบส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์ใน Brave
- โปรไฟล์ภายในที่มีการจัดการใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นหา Chrome CDP HTTP
  หลังเริ่มกระบวนการ และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดใช้งาน เพิ่มค่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรี home ของ OS คุณก่อนเปิด Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วยเช่นกัน
- บริการควบคุม: loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` ผนวกแฟล็กการเปิดเพิ่มเติมเข้ากับการเริ่มต้น Chromium ภายใน (เช่น
  `--disable-gpu`, ขนาดหน้าต่าง หรือแฟล็ก debug)

---

## ส่วนติดต่อผู้ใช้

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: สีเน้นสำหรับ chrome ของ UI แอปเนทีฟ (สีฟอง Talk Mode เป็นต้น)
- `assistant`: override ตัวตน Control UI ย้อนกลับไปใช้ตัวตนเอเจนต์ที่ใช้งานอยู่

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล). Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะเป็น `local`.
- `port`: พอร์ตแบบมัลติเพล็กซ์เดียวสำหรับ WS + HTTP. ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`.
- **นามแฝง bind เดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝง host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะรับฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะเข้ามาทาง `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อรับฟังบนทุกอินเทอร์เฟซ.
- **การยืนยันตัวตน**: ต้องใช้ตามค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ Gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ดการเริ่มต้นใช้งานจะสร้างโทเค็นตามค่าเริ่มต้น.
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โฟลว์การเริ่มต้นและการติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างและไม่ได้ตั้งค่า mode.
- `gateway.auth.mode: "none"`: โหมดไม่ใช้การยืนยันตัวตนอย่างชัดเจน ใช้เฉพาะสำหรับการตั้งค่า trusted local loopback เท่านั้น; โหมดนี้จงใจไม่ถูกเสนอในพรอมป์การเริ่มต้นใช้งาน.
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้กับ reverse proxy ที่รับรู้ตัวตน และเชื่อถือส่วนหัวตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth)). โหมดนี้คาดหวังแหล่งที่มาของ proxy แบบ **ไม่ใช่ loopback** ตามค่าเริ่มต้น; reverse proxy แบบ loopback บน host เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบน host เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback แบบตรงในเครื่องได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้.
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` ส่วนหัวตัวตนของ Tailscale Serve สามารถผ่านการยืนยันตัวตนของ UI ควบคุม/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`). endpoint ของ HTTP API **ไม่** ใช้การยืนยันตัวตนด้วยส่วนหัวของ Tailscale นั้น; แต่จะใช้โหมดการยืนยันตัวตน HTTP ปกติของ Gateway แทน โฟลว์แบบไม่ใช้โทเค็นนี้สมมติว่า host ของ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนที่ล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ของไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token ถูกติดตามแยกกัน). ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`.
  - บนเส้นทาง UI ควบคุมของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกทำให้เป็นลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามที่ผิดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานตั้งแต่คำขอที่สอง แทนที่จะปล่อยให้ทั้งคู่แข่งขันผ่านไปเป็นเพียงการไม่ตรงกันธรรมดา.
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้ proxy ที่เข้มงวด).
- ความพยายามยืนยันตัวตน WS จากต้นทางเบราว์เซอร์จะถูกหน่วงเสมอโดยปิดการยกเว้น loopback (การป้องกันหลายชั้นต่อการ brute force localhost จากเบราว์เซอร์).
- บน loopback การ lockout จากต้นทางเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่ lock out
  ต้นทางอื่นโดยอัตโนมัติ.
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้การยืนยันตัวตน).
- `controlUi.allowedOrigins`: allowlist ต้นทางเบราว์เซอร์อย่างชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าไคลเอนต์เบราว์เซอร์มาจากต้นทางที่ไม่ใช่ loopback.
- `controlUi.chatMessageMaxWidth`: max-width แบบไม่บังคับสำหรับข้อความแชต UI ควบคุมที่จัดกลุ่มไว้ รับค่าความกว้าง CSS ที่มีข้อจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้การ fallback ต้นทางจากส่วนหัว Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบายต้นทางจากส่วนหัว Host.
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss). สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override ฉุกเฉินของ process-environment ฝั่งไคลเอนต์
  ที่อนุญาต plaintext `ws://` ไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้;
  ค่าเริ่มต้นยังคงเป็น loopback-only สำหรับ plaintext ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการกำหนดค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` จะไม่ส่งผลต่อไคลเอนต์
  WebSocket ของ Gateway.
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ Gateway ด้วยตัวเอง.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS ฐานสำหรับ APNs relay ภายนอกที่ใช้โดย build iOS ทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนที่รองรับ relay ไปยัง Gateway URL นี้ต้องตรงกับ URL relay ที่คอมไพล์เข้าไปใน build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก Gateway ไป relay เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`.
- การลงทะเบียนที่รองรับ relay จะถูกมอบหมายให้กับตัวตนของ Gateway ที่เฉพาะเจาะจง แอป iOS ที่จับคู่แล้วจะดึง `gateway.identity.get`, รวมตัวตนนั้นในการลงทะเบียน relay และส่งต่อ grant การส่งที่จำกัดตามการลงทะเบียนให้ Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่เก็บไว้นั้นกลับมาใช้ซ้ำได้.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env override ชั่วคราวสำหรับการกำหนดค่า relay ข้างต้น.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางหลบสำหรับการพัฒนาเท่านั้นสำหรับ URL relay แบบ HTTP บน loopback URL relay สำหรับ production ควรอยู่บน HTTPS.
- `gateway.handshakeTimeoutMs`: timeout การจับมือ WebSocket ของ Gateway ก่อนยืนยันตัวตน เป็นมิลลิวินาที ค่าเริ่มต้น: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` จะมีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บน host ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ในเครื่องสามารถเชื่อมต่อได้ในขณะที่การอุ่นเครื่องเริ่มต้นยังคงกำลังนิ่งลง.
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสอบสุขภาพ channel เป็นนาที ตั้งค่า `0` เพื่อปิดการรีสตาร์ตตัวตรวจสอบสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`.
- `gateway.channelStaleEventThresholdMinutes`: threshold ของ stale-socket เป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`.
- `gateway.channelMaxRestartsPerHour`: จำนวนการรีสตาร์ตสูงสุดของตัวตรวจสอบสุขภาพต่อ channel/account ในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`.
- `channels.<provider>.healthMonitor.enabled`: การ opt-out ต่อ channel สำหรับการรีสตาร์ตของตัวตรวจสอบสุขภาพ โดยยังคงเปิดใช้ตัวตรวจสอบทั่วทั้งระบบ.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override ต่อ account สำหรับ channel แบบหลาย account เมื่อตั้งค่าแล้ว จะมีลำดับความสำคัญเหนือ override ระดับ channel.
- เส้นทางการเรียก Gateway ในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`.
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่สำเร็จ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาบดบัง).
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือฉีดส่วนหัว forwarded-client ระบุเฉพาะ proxy ที่คุณควบคุม รายการ loopback ยังใช้ได้สำหรับการตั้งค่า proxy/การตรวจจับในเครื่องบน host เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์สำหรับ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: เมื่อเป็น `true`, Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นเป็น `false` เพื่อพฤติกรรมแบบ fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP แบบไม่บังคับสำหรับการอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีขอบเขตที่ร้องขอ จะถูกปิดเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key โดยอัตโนมัติ.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนดรูปแบบ allow/deny ทั่วทั้งระบบสำหรับคำสั่ง node ที่ประกาศไว้หลังการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อ opt in เข้าสู่คำสั่ง node ที่อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตอย่างชัดเจนจะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ Gateway เก็บ snapshot คำสั่งที่อัปเดตแล้ว.
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny ค่าเริ่มต้น).
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการ deny ของ HTTP ค่าเริ่มต้น.

</Accordion>

### endpoint ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดตามค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- การเสริมความแข็งแรงสำหรับอินพุต URL ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL.
- ส่วนหัวเสริมความแข็งแรงสำหรับ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ Gateway หลายตัวบน host เดียวด้วยพอร์ตและ state dir ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flag เพื่อความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`).

ดู [หลาย Gateway](/th/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: เปิดใช้ TLS termination ที่ listener ของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`).
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์อย่างชัดเจน; ใช้สำหรับ local/dev เท่านั้น.
- `certPath`: เส้นทาง filesystem ไปยังไฟล์ใบรับรอง TLS.
- `keyPath`: เส้นทาง filesystem ไปยังไฟล์ private key ของ TLS; จำกัดสิทธิ์การเข้าถึงไว้.
- `caPath`: เส้นทาง CA bundle แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ trust chain แบบกำหนดเอง.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ขณะ runtime.
  - `"off"`: เพิกเฉยต่อการแก้ไขแบบ live; การเปลี่ยนแปลงต้อง restart อย่างชัดเจน.
  - `"restart"`: restart กระบวนการ Gateway เสมอเมื่อ config เปลี่ยน.
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ในกระบวนการโดยไม่ restart.
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไป restart หากจำเป็น.
- `debounceMs`: ช่วงเวลา debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ).
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็น ms ที่จะรอการดำเนินการที่กำลังทำงานอยู่ก่อนบังคับ restart ละไว้เพื่อใช้การรอแบบมีขอบเขตตามค่าเริ่มต้น (`300000`); ตั้งค่า `0` เพื่อรอไม่จำกัดเวลาและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ.

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`.
โทเค็นฮุกในสตริงคิวรีจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง**แตกต่าง**จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ต้องไม่เป็น `/`; ให้ใช้เส้นทางย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หากการแมปหรือพรีเซ็ตใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องเปิดใช้ตัวเลือกนี้

**เอนด์พอยต์:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะถูกยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ไขผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียดการแมป">

- `match.path` จับคู่เส้นทางย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ในเพย์โหลดสำหรับเส้นทางทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่าการกระทำของฮุก
  - `transform.module` ต้องเป็นเส้นทางสัมพัทธ์และต้องอยู่ภายใน `hooks.transformsDir` (เส้นทางแบบสัมบูรณ์และการไล่ย้อนเส้นทางจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ภายใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของเวิร์กสเปซจะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าเส้นทางนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` กำหนดเส้นทางไปยังเอเจนต์เฉพาะ; ID ที่ไม่รู้จักจะถอยกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบระบุชัดเจน (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันแบบคงที่ที่เป็นตัวเลือกสำหรับการรันเอเจนต์ฮุกที่ไม่มี `sessionKey` ระบุชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาตคำนำหน้าที่เป็นตัวเลือกสำหรับค่า `sessionKey` แบบระบุชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` รายการนี้จะกลายเป็นข้อกำหนดเมื่อการแมปหรือพรีเซ็ตใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` เขียนทับ LLM สำหรับการรันฮุกนี้ (ต้องได้รับอนุญาตหากมีการตั้งค่าแคตตาล็อกโมเดล)

</Accordion>

### การผสานรวม Gmail

- พรีเซ็ต Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางต่อข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับเนมสเปซ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องการ `hooks.allowRequestSessionKey: false` ให้เขียนทับพรีเซ็ตด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway จะเริ่ม `gog gmail watch serve` อัตโนมัติเมื่อบูต หากมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้
- อย่ารัน `gog gmail watch serve` แยกต่างหากคู่กับ Gateway

---

## โฮสต์ Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- ให้บริการ HTML/CSS/JS ที่เอเจนต์แก้ไขได้ และ A2UI ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะเครื่องภายใน: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การยืนยันตัวตน Gateway (โทเค็น/รหัสผ่าน/trusted-proxy) เหมือนพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่งส่วนหัวการยืนยันตัวตน; หลังจากจับคู่และเชื่อมต่อ Node แล้ว Gateway จะประกาศ URL ความสามารถที่จำกัดขอบเขตตาม Node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับเซสชัน WS ของ Node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ทางเลือกสำรองตาม IP
- ฉีดไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นอัตโนมัติเมื่อว่าง
- ยังให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ท Gateway
- ปิดใช้ live reload สำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

---

## การค้นหา

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้ Plugin `bonjour` ที่บันเดิลมา): ละเว้น `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`; การโฆษณาแบบมัลติแคสต์บน LAN ยังต้องเปิดใช้ Plugin `bonjour` ที่บันเดิลมา
- `off`: ระงับการโฆษณาแบบมัลติแคสต์บน LAN โดยไม่เปลี่ยนการเปิดใช้ Plugin
- Plugin `bonjour` ที่บันเดิลมาจะเริ่มอัตโนมัติบนโฮสต์ macOS และเป็นแบบเลือกเปิดใช้บน Linux, Windows และการปรับใช้ Gateway ในคอนเทนเนอร์
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง และจะถอยกลับเป็น `openclaw` เขียนทับด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน unicast DNS-SD ภายใต้ `~/.openclaw/dns/` สำหรับการค้นหาข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`.

---

## สภาพแวดล้อม

### `env` (ตัวแปร env แบบอินไลน์)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- ตัวแปร env แบบอินไลน์จะถูกใช้ก็ต่อเมื่อ process env ไม่มีคีย์นั้นเท่านั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งคู่ไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ขาดหายจากโปรไฟล์เชลล์ล็อกอินของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนค่าตัวแปร env

อ้างอิงตัวแปร env ในสตริงคอนฟิกใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหายหรือว่างเปล่าจะทำให้เกิดข้อผิดพลาดตอนโหลดคอนฟิก
- เอสเคปด้วย `$${VAR}` เพื่อใช้ค่า literal `${VAR}`
- ใช้งานร่วมกับ `$include` ได้

---

## ข้อมูลลับ

การอ้างอิงข้อมูลลับเป็นแบบเพิ่มเติม: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปทรงอ็อบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบสัมบูรณ์ (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มีเซกเมนต์พาธที่คั่นด้วยสแลชเป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์หลัก: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- เป้าหมาย `secrets apply` รองรับพาธข้อมูลรับรองของ `openclaw.json`
- การอ้างอิงใน `auth-profiles.json` ถูกรวมอยู่ในการ resolve ตอนรันไทม์และขอบเขตการ audit

### คอนฟิกผู้ให้บริการข้อมูลลับ

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

หมายเหตุ:

- ผู้ให้บริการ `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- พาธของผู้ให้บริการ file และ exec จะล้มเหลวแบบปิดเมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้เท่านั้น
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์ และใช้ payload โปรโตคอลผ่าน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink พร้อมตรวจสอบพาธเป้าหมายที่ resolve แล้ว
- หากมีการกำหนดค่า `trustedDirs` การตรวจสอบไดเรกทอรีที่เชื่อถือจะนำไปใช้กับพาธเป้าหมายที่ resolve แล้ว
- สภาพแวดล้อมของ child ใน `exec` จะเป็นแบบขั้นต่ำโดยค่าเริ่มต้น; ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงข้อมูลลับจะถูก resolve ตอนเปิดใช้งานเป็นสแนปช็อตในหน่วยความจำ จากนั้นพาธคำขอจะอ่านเฉพาะสแนปช็อตนั้น
- การกรองพื้นผิวที่ใช้งานอยู่จะมีผลระหว่างการเปิดใช้งาน: การอ้างอิงที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้การเริ่มต้น/โหลดซ้ำล้มเหลว ส่วนพื้นผิวที่ไม่ใช้งานจะถูกข้ามพร้อม diagnostics

---

## ที่เก็บการยืนยันตัวตน

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- โปรไฟล์ต่อ agent ถูกจัดเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบแบนเดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบรันไทม์; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key ตาม canonical `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่หนุนด้วย SecretRef
- ข้อมูลรับรองรันไทม์แบบคงที่มาจากสแนปช็อตที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่เดิมจะถูกล้างเมื่อค้นพบ
- การนำเข้า OAuth เดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมรันไทม์ของข้อมูลลับและเครื่องมือ `audit/configure/apply`: [การจัดการข้อมูลลับ](/th/gateway/secrets)

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: ระยะถอยกลับพื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาดเกี่ยวกับการเรียกเก็บเงิน/เครดิตไม่เพียงพอจริง (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนอาจยังมาถึงส่วนนี้ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังถูกจำกัดขอบเขตไว้กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` ที่ลองใหม่ได้เกี่ยวกับกรอบเวลาการใช้งานหรือขีดจำกัดการใช้จ่ายขององค์กร/เวิร์กสเปซจะยังอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: การเขียนทับรายผู้ให้บริการแบบไม่บังคับสำหรับชั่วโมงการถอยกลับด้านการเรียกเก็บเงิน
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โปเนนเชียลของการถอยกลับด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ระยะถอยกลับพื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของการถอยกลับ `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับการถอยกลับ (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนการสลับโปรไฟล์การยืนยันตัวตนของผู้ให้บริการเดียวกันสูงสุดสำหรับข้อผิดพลาดโอเวอร์โหลดก่อนเปลี่ยนไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) รูปแบบผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะมาถึงส่วนนี้
- `overloadedBackoffMs`: หน่วงเวลาแบบคงที่ก่อนลองสลับผู้ให้บริการ/โปรไฟล์ที่โอเวอร์โหลดอีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนการสลับโปรไฟล์การยืนยันตัวตนของผู้ให้บริการเดียวกันสูงสุดสำหรับข้อผิดพลาดการจำกัดอัตราก่อนเปลี่ยนไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) บัคเก็ตการจำกัดอัตรานี้รวมข้อความที่มีรูปแบบจากผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## การบันทึก

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- ไฟล์บันทึกเริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้งค่า `logging.file` สำหรับเส้นทางที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์บันทึกที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขไว้ข้างไฟล์ที่ใช้งานอยู่ได้สูงสุดห้าไฟล์
- `redactSensitive` / `redactPatterns`: การปกปิดแบบพยายามให้ดีที่สุดสำหรับเอาต์พุตคอนโซล ไฟล์บันทึก ระเบียนบันทึก OTLP และข้อความถอดความเซสชันที่เก็บถาวร `redactSensitive: "off"` จะปิดใช้งานเฉพาะนโยบายบันทึก/ถอดความทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปกปิดความลับก่อนส่งออก

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: สวิตช์หลักสำหรับเอาต์พุตการวัดและติดตาม (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตบันทึกแบบเจาะจง (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุแบบไม่มีความคืบหน้าเป็นมิลลิวินาทีสำหรับจัดประเภทเซสชันการประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ เครื่องมือ สถานะ บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่ซ้ำกันจะถอยกลับเมื่อไม่มีการเปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุแบบไม่มีความคืบหน้าเป็นมิลลิวินาทีก่อนที่งานที่ใช้งานอยู่ซึ่งหยุดชะงักและเข้าเงื่อนไขอาจถูกระบายเพื่อยกเลิกสำหรับการกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้กรอบเวลาการรันแบบฝังที่ขยายและปลอดภัยกว่า อย่างน้อย 10 นาทีและ 5 เท่าของ `stuckSessionWarnMs`
- `otel.enabled`: เปิดใช้ไปป์ไลน์การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าครบถ้วน แคตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL คอลเลกเตอร์สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: ปลายทาง OTLP เฉพาะสัญญาณแบบไม่บังคับ เมื่อตั้งค่าแล้ว จะเขียนทับ `otel.endpoint` สำหรับสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: เฮดเดอร์เมตาดาต้า HTTP/gRPC เพิ่มเติมที่ส่งไปพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออกเทรซ เมตริก หรือบันทึก
- `otel.sampleRate`: อัตราการสุ่มตัวอย่างเทรซ `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลาการล้างข้อมูลเทเลเมทรีเป็นระยะเป็นมิลลิวินาที
- `otel.captureContent`: การจับเนื้อหาดิบแบบเลือกเปิดสำหรับแอตทริบิวต์สแปน OTEL ค่าเริ่มต้นคือปิด บูลีน `true` จะจับเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบอ็อบเจกต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ผู้ให้บริการสแปน GenAI รุ่นทดลองล่าสุด ตามค่าเริ่มต้น สแปนจะคงแอตทริบิวต์เดิม `gen_ai.system` ไว้เพื่อความเข้ากันได้; เมตริก GenAI ใช้แอตทริบิวต์เชิงความหมายแบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ได้ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะที่ยังคงให้ตัวฟังการวินิจฉัยทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อมปลายทางเฉพาะสัญญาณที่ใช้เมื่อคีย์กำหนดค่าที่ตรงกันไม่ได้ตั้งค่าไว้
- `cacheTrace.enabled`: บันทึกสแนปช็อตการติดตามแคชสำหรับการรันแบบฝัง (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: เส้นทางเอาต์พุตสำหรับ JSONL การติดตามแคช (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุตการติดตามแคช (ทั้งหมดค่าเริ่มต้น: `true`)

---

## การอัปเดต

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: ช่องทางเผยแพร่สำหรับการติดตั้ง npm/git - `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: หน่วงเวลาขั้นต่ำเป็นชั่วโมงก่อนปรับใช้ช่องทาง stable โดยอัตโนมัติ (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการทยอยปล่อยช่องทาง stable เพิ่มเติมเป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ที่การตรวจสอบช่องทาง beta ทำงานเป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: ประตูฟีเจอร์ ACP ส่วนกลาง (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อนการส่งงาน ACP และ affordance การสร้าง)
- `dispatch.enabled`: ประตูอิสระสำหรับการส่งรอบเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งาน แต่บล็อกการดำเนินการ
- `backend`: ID แบ็กเอนด์รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin แบ็กเอนด์ก่อน และหากตั้งค่า `plugins.allow` ไว้ ให้รวม ID Plugin แบ็กเอนด์ (เช่น `acpx`) มิฉะนั้นแบ็กเอนด์ ACP จะไม่โหลด
- `defaultAgent`: ID เอเจนต์เป้าหมาย ACP สำรองเมื่อการสร้างไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: รายการอนุญาตของ ID เอเจนต์ที่อนุญาตสำหรับเซสชันรันไทม์ ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนเซสชัน ACP ที่ใช้งานพร้อมกันสูงสุด
- `stream.coalesceIdleMs`: หน้าต่างล้างข้อมูลเมื่อว่างเป็นมิลลิวินาทีสำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาดชังก์สูงสุดก่อนแบ่งการฉายบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำต่อรอบ (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์สิ้นสุดรอบ
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตผู้ช่วยสูงสุดที่ฉายต่อรอบ ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉาย
- `stream.tagVisibility`: ระเบียนของชื่อแท็กไปยังการเขียนทับการมองเห็นแบบบูลีนสำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: TTL เมื่อว่างเป็นนาทีสำหรับเวิร์กเกอร์เซสชัน ACP ก่อนเข้าเงื่อนไขการล้างข้อมูล
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อบูตสแตรปสภาพแวดล้อมรันไทม์ ACP

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` ควบคุมสไตล์แท็กไลน์ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): แท็กไลน์ตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: แท็กไลน์เป็นกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความแท็กไลน์ (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่แค่แท็กไลน์) ให้ตั้งค่าสภาพแวดล้อม `OPENCLAW_HIDE_BANNER=1`

---

## ตัวช่วยตั้งค่า

เมตาดาต้าที่เขียนโดยโฟลว์การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## ตัวตน

ดูฟิลด์ตัวตน `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## บริดจ์ (เดิม, ลบแล้ว)

บิลด์ปัจจุบันไม่มีบริดจ์ TCP อีกต่อไป Node เชื่อมต่อผ่าน WebSocket ของ Gateway คีย์ `bridge.*` ไม่เป็นส่วนหนึ่งของสคีมาการกำหนดค่าอีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถตัดคีย์ที่ไม่รู้จักออกได้)

<Accordion title="การกำหนดค่าบริดจ์เดิม (ข้อมูลอ้างอิงเชิงประวัติ)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์ไว้ก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้างทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวรไว้ด้วย ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์บันทึกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดออก ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดใหม่ล่าสุดที่เก็บไว้เมื่อมีการตัดบันทึกการรัน ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเค็น bearer ที่ใช้สำหรับการส่ง Cron Webhook POST (`delivery.mode = "webhook"`); หากละไว้จะไม่ส่งส่วนหัวการยืนยันตัวตน
- `webhook`: URL Webhook สำรองแบบเดิมที่เลิกใช้แล้ว (http/https) ซึ่งใช้เฉพาะกับงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงานแบบครั้งเดียวเมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`-`10`)
- `backoffMs`: อาร์เรย์ของระยะเวลาหน่วงแบบ backoff หน่วยเป็นมิลลิวินาทีสำหรับความพยายามลองใหม่แต่ละครั้ง (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อลองใหม่กับประเภทชั่วคราวทั้งหมด

ใช้เฉพาะกับงาน Cron แบบครั้งเดียว งานที่เกิดซ้ำใช้การจัดการความล้มเหลวแยกต่างหาก

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับงาน Cron (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่กระทบ backoff ของข้อผิดพลาดในการดำเนินการ
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือรหัสช่องทางที่ไม่บังคับเพื่อกำหนดขอบเขตการส่งการแจ้งเตือน

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- ปลายทางเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ Cron ในทุกงาน
- `mode`: `"announce"` หรือ `"webhook"`; ค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบ announce `"last"` ใช้ช่องทางการส่งล่าสุดที่รู้จักซ้ำ
- `to`: เป้าหมาย announce หรือ URL Webhook แบบระบุชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` ต่อแต่ละงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและต่อแต่ละงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะถอยกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- รองรับ `delivery.failureDestination` เฉพาะสำหรับงาน `sessionTarget="isolated"` เท่านั้น เว้นแต่ว่า `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวแทนข้อความเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวห่อประวัติ/ผู้ส่ง)           |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | รหัสข้อความของช่องทาง                            |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                           |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                         |
| `{{MediaPath}}`    | พาธสื่อภายในเครื่อง                              |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)              |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                 |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ไขแล้วสำหรับรายการ CLI           |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ไขแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                        |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามอย่างดีที่สุด)               |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามอย่างดีที่สุด)       |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามอย่างดีที่สุด)      |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามอย่างดีที่สุด) |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord, ฯลฯ) |

---

## การ include คอนฟิก (`$include`)

แยกคอนฟิกเป็นหลายไฟล์:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**พฤติกรรมการผสาน:**

- ไฟล์เดียว: แทนที่อ็อบเจกต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: ผสานเชิงลึกตามลำดับ (รายการหลังแทนที่รายการก่อน)
- คีย์พี่น้อง: ผสานหลัง include (แทนที่ค่าที่ include มา)
- include ซ้อนกัน: ลึกได้สูงสุด 10 ระดับ
- พาธ: แก้ไขโดยอิงจากไฟล์ที่ include แต่ต้องอยู่ภายในไดเรกทอรีคอนฟิกระดับบนสุด (`dirname` ของ `openclaw.json`) ฟอร์มแบบสัมบูรณ์/`../` อนุญาตเฉพาะเมื่อยังแก้ไขแล้วอยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่รองรับด้วย include แบบไฟล์เดียว จะเขียนทะลุไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- include ที่ราก, อาร์เรย์ include และ include ที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนการแผ่คอนฟิกให้แบน
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดในการแยกวิเคราะห์ และ include แบบวนซ้ำ

---

_ที่เกี่ยวข้อง: [คอนฟิก](/th/gateway/configuration) · [ตัวอย่างคอนฟิก](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [คอนฟิก](/th/gateway/configuration)
- [ตัวอย่างคอนฟิก](/th/gateway/configuration-examples)
