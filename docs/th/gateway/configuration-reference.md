---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อยเฉพาะ
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-06T17:56:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e5f7c2246b28f801d527437ae6242686998f1e8b75fd3977723d240a760d859
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการกำหนดค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมตามงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการกำหนดค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่เป็นของช่องทางและ Plugin รวมถึงตัวเลือกเชิงลึกของหน่วยความจำ/QMD จะอยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวมเมทาดาทาของบันเดิล/Plugin/ช่องทางเมื่อมี
- `config.schema.lookup` ส่งคืนโหนดสคีมาหนึ่งรายการที่จำกัดตามพาธสำหรับเครื่องมือเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบความถูกต้องของแฮชฐานข้อมูลเอกสารการกำหนดค่าเทียบกับพื้นผิวสคีมาปัจจุบัน

พาธค้นหา Agent: ใช้การทำงานของเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำตามงาน และหน้านี้
สำหรับแผนที่ฟิลด์ที่กว้างขึ้น ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะ:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการกำหนดค่า Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งในตัว + ที่บันเดิลมาปัจจุบัน
- หน้าของช่องทาง/Plugin ที่เป็นเจ้าของสำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบการกำหนดค่าคือ **JSON5** (อนุญาตให้มีคอมเมนต์ + เครื่องหมายจุลภาคท้ายรายการ) ทุกฟิลด์เป็นตัวเลือก - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อเว้นไว้

---

## ช่องทาง

คีย์การกำหนดค่ารายช่องทางย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางอื่นๆ
ที่บันเดิลมา (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การกั้นด้วยการกล่าวถึง)

## ค่าเริ่มต้นของ Agent, multi-agent, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกของ multi-agent)
- `session.*` (วงจรชีวิตเซสชัน, Compaction, การตัดแต่ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: id locale BCP 47 ที่เป็นตัวเลือกสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มไว้ก่อนส่งทรานสคริปต์ (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายเครื่องมือ สวิตช์ทดลอง การกำหนดค่าเครื่องมือที่หนุนโดยผู้ให้บริการ และการตั้งค่า
ผู้ให้บริการ / base-URL แบบกำหนดเองย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## โมเดล

นิยามผู้ให้บริการ allowlist ของโมเดล และการตั้งค่าผู้ให้บริการแบบกำหนดเองอยู่ใน
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
รูท `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อกโมเดลส่วนกลางด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
- `models.providers`: แผนที่ผู้ให้บริการแบบกำหนดเองที่ใช้ provider id เป็นคีย์
- `models.pricing.enabled`: ควบคุมการบูตสแตรปราคาพื้นหลังที่
  เริ่มหลังจาก sidecars และช่องทางถึงพาธพร้อมใช้งานของ Gateway เมื่อ `false`
  Gateway จะข้ามการดึงแค็ตตาล็อกราคาของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดไว้ยังคงใช้ได้สำหรับการประเมินต้นทุนภายในเครื่อง

## MCP

นิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้โดย Pi แบบฝังและอะแดปเตอร์รันไทม์อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อกับ
เซิร์ฟเวอร์เป้าหมายระหว่างการแก้ไขการกำหนดค่า

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

- `mcp.servers`: นิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือแบบรีโมตที่มีชื่อ สำหรับรันไทม์ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการรีโมตใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` แปลงให้เป็นฟิลด์ `transport` แบบมาตรฐาน
- `mcp.sessionIdleTtlMs`: TTL เมื่อว่างสำหรับรันไทม์ MCP ที่บันเดิลมาตามขอบเขตเซสชัน
  การรันแบบฝังครั้งเดียวจะร้องขอการล้างเมื่อจบการรัน; TTL นี้เป็นตัวกันท้ายสำหรับ
  เซสชันที่มีอายุยาวและผู้เรียกในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` จะปรับใช้แบบร้อนโดยกำจัดรันไทม์ MCP ของเซสชันที่แคชไว้
  การค้นพบ/ใช้เครื่องมือครั้งถัดไปจะสร้างใหม่จากการกำหนดค่าใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ TTL เมื่อว่าง

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[แบ็กเอนด์ CLI](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรมรันไทม์

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

- `allowBundled`: allowlist ที่เป็นตัวเลือกสำหรับ Skills ที่บันเดิลมาเท่านั้น (ไม่กระทบ Skills ที่จัดการ/ใน workspace)
- `load.extraDirs`: ราก Skills แบบใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกใช้ตัวติดตั้ง Homebrew ก่อนเมื่อ `brew`
  พร้อมใช้งาน ก่อนย้อนกลับไปใช้ชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ค่าที่ต้องการสำหรับตัวติดตั้ง node สำหรับสเปก `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน Skill แม้ว่าจะบันเดิลมา/ติดตั้งแล้ว
- `entries.<skillKey>.apiKey`: ทางลัดสำหรับ Skills ที่ประกาศ env var หลัก (สตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef)

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
- การค้นพบรองรับ Plugin OpenClaw แบบเนทีฟ รวมถึงบันเดิล Codex ที่เข้ากันได้และบันเดิล Claude รวมถึงบันเดิลเลย์เอาต์เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการกำหนดค่าต้องรีสตาร์ท gateway**
- `allow`: allowlist ที่เป็นตัวเลือก (โหลดเฉพาะ Plugin ที่อยู่ในรายการ) `deny` ชนะ
- `bundledDiscovery`: ค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้น
  `plugins.allow` ที่ไม่ว่างจะกั้น Plugin ผู้ให้บริการที่บันเดิลมาด้วย รวมถึงผู้ให้บริการรันไทม์
  web-search Doctor เขียน `"compat"` สำหรับการกำหนดค่า allowlist แบบเดิมที่ถูกย้าย
  เพื่อคงพฤติกรรมผู้ให้บริการที่บันเดิลมาเดิมไว้จนกว่าคุณจะเลือกใช้
- `plugins.entries.<id>.apiKey`: ฟิลด์ทางลัดคีย์ API ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แผนที่ env var ที่จำกัดขอบเขตตาม Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่กลาย prompt จาก `before_agent_start` แบบเดิม ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบเดิมไว้ ใช้กับ hooks ของ Plugin แบบเนทีฟและไดเรกทอรี hook ที่บันเดิลให้ซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่ไม่บันเดิลและเชื่อถือได้อาจอ่านเนื้อหาบทสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอการ override `provider` และ `model` รายการต่อการรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist ที่เป็นตัวเลือกของเป้าหมาย `provider/model` มาตรฐานสำหรับการ override subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตทุกโมเดล
- `plugins.entries.<id>.config`: ออบเจ็กต์การกำหนดค่าที่ Plugin กำหนด (ตรวจสอบความถูกต้องด้วยสคีมา Plugin OpenClaw แบบเนทีฟเมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ Plugin ช่องทางอยู่ภายใต้ `channels.<id>` และควรถูกอธิบายด้วยเมทาดาทา `channelConfigs` ของ manifest ของ Plugin ที่เป็นเจ้าของ ไม่ใช่โดยรีจิสทรีตัวเลือกกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการ web-fetch ของ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl (รองรับ SecretRef) ย้อนกลับไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเดิม หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ API Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; การ override แบบ self-hosted ต้องชี้ไปที่ endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: แยกเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: ระยะหมดเวลาของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นหาเว็บ Grok)
  - `enabled`: เปิดใช้ผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและค่าเกณฑ์
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ cron สำหรับแต่ละการกวาด dreaming เต็มรอบ (`"0 3 * * *"` โดยค่าเริ่มต้น)
  - `model`: การ override โมเดล subagent ของ Dream Diary ที่เป็นตัวเลือก ต้องใช้ `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชัน; ความล้มเหลวด้านความเชื่อถือหรือ allowlist จะไม่ย้อนกลับแบบเงียบๆ
  - นโยบายเฟสและค่าเกณฑ์เป็นรายละเอียดการใช้งาน (ไม่ใช่คีย์การกำหนดค่าที่ผู้ใช้เห็น)
- การกำหนดค่าหน่วยความจำเต็มอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้งานยังสามารถร่วมให้ค่าเริ่มต้น Pi แบบฝังจาก `settings.json`; OpenClaw นำค่าเหล่านั้นไปใช้เป็นการตั้งค่า agent ที่ผ่านการทำให้ปลอดภัย ไม่ใช่เป็นแพตช์การกำหนดค่า OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือก id ของ Plugin หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้งาน Plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือก id ของ Plugin context engine ที่ใช้งานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณจะติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

---

## Commitments

`commitments` ควบคุมหน่วยความจำติดตามผลที่อนุมานได้: OpenClaw สามารถตรวจจับการ check-in จากรอบบทสนทนาและส่งผ่านการรัน heartbeat

- `commitments.enabled`: เปิดใช้การสกัดด้วย LLM แบบซ่อน การจัดเก็บ และการส่งผ่าน heartbeat สำหรับ commitments ติดตามผลที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวน commitments ติดตามผลที่อนุมานได้สูงสุดที่ส่งต่อ agent session ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

ดู [Commitments ที่อนุมานได้](/th/concepts/commitments)

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
- `tabCleanup` เรียกคืนแท็บของเอเจนต์หลักที่ติดตามไว้หลังจากไม่มีการใช้งาน หรือเมื่อเซสชันเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อปิดใช้งานโหมดล้างข้อมูลแต่ละโหมดนั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงยังคงเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจไว้วางใจการนำทางของเบราว์เซอร์บนเครือข่ายส่วนตัว
- ในโหมดเข้มงวด ปลายทางของโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะนามแฝงเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งานการเริ่ม/หยุด/รีเซ็ต)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback ที่จัดการไว้
  ยังคงใช้ค่าเริ่มต้นของ CDP ภายในเครื่อง
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ให้กับโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ภายในเครื่องที่จัดการไว้ และอาจรายงานข้อผิดพลาดการเป็นเจ้าของพอร์ตภายในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบบน
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่ได้
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การกระทำที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS-selector, ฮุกอัปโหลดไฟล์เดียว,
  ไม่มีการแทนที่การหมดเวลาของไดอะล็อก, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการกระทำแบบแบตช์
- โปรไฟล์ `openclaw` ภายในเครื่องที่จัดการไว้จะกำหนด `cdpPort` และ `cdpUrl` โดยอัตโนมัติ; ให้ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ภายในเครื่องที่จัดการไว้สามารถตั้งค่า `executablePath` เพื่อแทนที่
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ภายในเครื่องที่จัดการไว้ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังจากเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ websocket CDP หลังการเปิดใช้งาน เพิ่มค่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มสำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ค่าทั้งสองต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรีบ้านของ OS ของคุณก่อนเปิด Chromium
  `userDataDir` รายโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยายเครื่องหมาย tilde ด้วย
- บริการควบคุม: loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดใช้งานเพิ่มเติมให้กับการเริ่มต้น Chromium ภายในเครื่อง (เช่น
  `--disable-gpu`, การปรับขนาดหน้าต่าง หรือแฟล็กดีบัก)

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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (สีอ่อนของฟองโหมดพูดคุย ฯลฯ)
- `assistant`: การแทนที่ตัวตนของ UI ควบคุม ย้อนกลับไปใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่

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

<Accordion title="รายละเอียดฟิลด์ Gateway">

- `mode`: `local` (รัน gateway) หรือ `remote` (เชื่อมต่อกับ remote gateway) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`
- `port`: พอร์ตเดี่ยวแบบ multiplex สำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`
- **นามแฝง bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝง host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้ Docker bridge networking (`-p 18789:18789`) ทราฟฟิกจะเข้ามาทาง `eth0` ดังนั้น gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นตามค่าเริ่มต้น การ bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ gateway ในทางปฏิบัติหมายถึง token/password ที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` onboarding wizard จะสร้าง token ให้ตามค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โฟลว์เริ่มต้นและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างและไม่ได้ตั้งค่า mode
- `gateway.auth.mode: "none"`: โหมดไม่ยืนยันตัวตนแบบชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โดยตั้งใจไม่เสนอในพรอมป์ onboarding
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้กับ reverse proxy ที่รับรู้ตัวตน และเชื่อถือ identity headers จาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่ง proxy ที่ **ไม่ใช่ loopback** ตามค่าเริ่มต้น reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback แบบ local direct ได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` identity headers ของ Tailscale Serve สามารถผ่านการยืนยันตัวตน Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) HTTP API endpoints **ไม่** ใช้การยืนยันตัวตนผ่าน header ของ Tailscale นั้น แต่จะใช้โหมดการยืนยันตัวตน HTTP ปกติของ gateway แทน โฟลว์แบบไม่มี token นี้ถือว่า gateway host เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนที่ล้มเหลวแบบไม่บังคับ ใช้ต่อ client IP และต่อ auth scope (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`
  - บนเส้นทาง Control UI แบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกทำให้เป็นลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามที่ผิดพร้อมกันจาก client เดียวกันอาจทำให้ตัวจำกัดทำงานในคำขอที่สอง แทนที่ทั้งสองจะวิ่งแข่งกันไปเป็นเพียงการไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการ deploy proxy ที่เข้มงวด)
- ความพยายามยืนยันตัวตน WS จาก browser-origin จะถูก throttle เสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost ผ่านเบราว์เซอร์)
- บน loopback การ lockout จาก browser-origin เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำจาก origin localhost หนึ่งจะไม่
  lock out origin อื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องยืนยันตัวตน)
- `controlUi.allowedOrigins`: allowlist ของ browser-origin อย่างชัดเจนสำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นเมื่อคาดว่าจะมี browser clients จาก origins ที่ไม่ใช่ loopback
- `controlUi.chatMessageMaxWidth`: max-width แบบไม่บังคับสำหรับข้อความแชท Control UI ที่จัดกลุ่ม รองรับค่า CSS width แบบจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback origin จาก Host-header สำหรับการ deploy ที่ตั้งใจพึ่งพานโยบาย origin จาก Host-header
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override แบบฉุกเฉินใน process-environment ฝั่ง client
  ที่อนุญาต plaintext `ws://` ไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้;
  ค่าเริ่มต้นสำหรับ plaintext ยังคงเป็น loopback-only ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการกำหนดค่า private-network ของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่มีผลกับ clients ของ Gateway
  WebSocket
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของ remote-client ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL ฐาน HTTPS สำหรับ APNs relay ภายนอกที่ใช้โดย official/TestFlight iOS builds หลังจากเผยแพร่ registrations ที่รองรับ relay ไปยัง gateway URL นี้ต้องตรงกับ relay URL ที่ compile เข้าไปใน iOS build
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก gateway ไป relay เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`
- registrations ที่รองรับ relay จะถูกมอบหมายให้ gateway identity เฉพาะตัว แอป iOS ที่จับคู่แล้วจะดึง `gateway.identity.get`, ใส่ identity นั้นในการลงทะเบียน relay และส่งต่อ grant สำหรับการส่งที่มีขอบเขตตาม registration ให้ gateway gateway อื่นไม่สามารถใช้ stored registration นั้นซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env overrides ชั่วคราวสำหรับการกำหนดค่า relay ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางหลบเฉพาะการพัฒนาสำหรับ URL relay แบบ HTTP บน loopback URL relay สำหรับ production ควรใช้ HTTPS ต่อไป
- `gateway.handshakeTimeoutMs`: timeout ของ pre-auth Gateway WebSocket handshake เป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่ง local clients สามารถเชื่อมต่อได้ขณะที่ startup warmup ยังนิ่งตัวไม่เสร็จ
- `gateway.channelHealthCheckMinutes`: ช่วงเวลา health-monitor ของช่องทางเป็นนาที ตั้ง `0` เพื่อปิดใช้งานการรีสตาร์ทโดย health-monitor ทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: threshold ของ stale-socket เป็นนาที ค่านี้ควรมากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนรีสตาร์ทสูงสุดโดย health-monitor ต่อช่องทาง/account ในช่วงหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การยกเลิกใช้รายช่องทางสำหรับการรีสตาร์ทโดย health-monitor โดยยังคงเปิดใช้ monitor ทั่วระบบไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override ราย account สำหรับช่องทางหลาย account เมื่อตั้งค่าไว้ จะมีลำดับความสำคัญเหนือ override ระดับช่องทาง
- เส้นทางการเรียก local gateway สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่สำเร็จ การ resolve จะ fail closed (ไม่มี remote fallback มาปิดบัง)
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือ inject forwarded-client headers ระบุเฉพาะ proxies ที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่า proxy/local-detection บนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ local reverse proxy) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อพฤติกรรมแบบ fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist แบบ CIDR/IP ที่ไม่บังคับสำหรับการอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มี scopes ที่ร้องขอ จะปิดใช้งานเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key โดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ทั่วระบบสำหรับคำสั่ง node ที่ประกาศไว้หลังจากการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกเปิดใช้คำสั่ง node อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ว่า platform default หรือ explicit allow จะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศไว้ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่เพื่อให้ gateway เก็บ snapshot คำสั่งที่อัปเดตแล้ว
- `gateway.tools.deny`: ชื่อ tool เพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny ค่าเริ่มต้น)
- `gateway.tools.allow`: ลบชื่อ tool ออกจากรายการ deny ค่าเริ่มต้นของ HTTP

</Accordion>

### endpoints ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานตามค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความแข็งแรงของ URL-input สำหรับ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlists ที่ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดใช้งานการดึง URL
- header เสริมความแข็งแรงของ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับ HTTPS origins ที่คุณควบคุม; ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยก multi-instance

รัน gateways หลายตัวบนโฮสต์เดียวด้วยพอร์ตและ state dirs ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

ดู [หลาย Gateway](/th/gateway/multiple-gateways)

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

- `enabled`: เปิดใช้การ terminate TLS ที่ listener ของ gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ภายในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์อย่างชัดเจน; สำหรับการใช้ local/dev เท่านั้น
- `certPath`: path ใน filesystem ไปยังไฟล์ TLS certificate
- `keyPath`: path ใน filesystem ไปยังไฟล์ TLS private key; ควรจำกัด permission
- `caPath`: path ของ CA bundle แบบไม่บังคับสำหรับการตรวจสอบ client หรือ custom trust chains

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

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ขณะ runtime
  - `"off"`: เพิกเฉยต่อการแก้ไขแบบ live; การเปลี่ยนแปลงต้อง restart อย่างชัดเจน
  - `"restart"`: restart กระบวนการ gateway เสมอเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ใน process โดยไม่ restart
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback เป็น restart หากจำเป็น
- `debounceMs`: หน้าต่าง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็น ms เพื่อรอ operations ที่กำลังทำงานก่อนบังคับ restart เว้นไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรอไม่จำกัดและบันทึกคำเตือน still-pending เป็นระยะ

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

การรับรองตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
โทเค็นของ hook ในสตริงคำสั่งจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ไม่สามารถเป็น `/`; ใช้พาธย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (ตัวอย่างเช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์ mapping แบบคงที่ไม่ต้อง opt-in นี้

**ปลายทาง:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะถูกรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ค่าโดยใช้ `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่มาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียด mapping">

- `match.path` ตรงกับพาธย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` ตรงกับฟิลด์เพย์โหลดสำหรับพาธทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่ส่งคืนการกระทำของ hook ได้
  - `transform.module` ต้องเป็นพาธสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (พาธแบบสัมบูรณ์และการไต่พาธจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของ workspace จะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform ไปไว้ในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` ส่งต่อไปยัง agent เฉพาะ; ID ที่ไม่รู้จักจะย้อนกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบระบุชัด (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่แบบไม่บังคับสำหรับการรัน hook agent ที่ไม่มี `sessionKey` ระบุชัด
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันของ mapping ที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการ allowlist ของ prefix แบบไม่บังคับสำหรับค่า `sessionKey` ที่ระบุชัด (คำขอ + mapping) เช่น `["hook:"]` ค่านี้จะกลายเป็นค่าบังคับเมื่อ mapping หรือ preset ใดก็ตามใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` แทนที่ LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้งค่าแคตตาล็อกโมเดลไว้)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางแบบต่อข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้แทนที่ preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- Gateway จะเริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูต หากกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

---

## โฮสต์แคนวาส

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- ให้บริการ HTML/CSS/JS ที่ agent แก้ไขได้และ A2UI ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะเครื่องภายใน: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ local loopback: เส้นทางแคนวาสต้องใช้การรับรองตัวตนของ Gateway (โทเค็น/รหัสผ่าน/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- WebView ของ Node มักไม่ส่งส่วนหัวการรับรองตัวตน; หลังจากจับคู่และเชื่อมต่อ node แล้ว Gateway จะประกาศ URL ความสามารถที่มีขอบเขตเฉพาะ node สำหรับการเข้าถึงแคนวาส/A2UI
- URL ความสามารถถูกผูกกับเซสชัน WS ของ node ที่ทำงานอยู่ และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- ฉีดไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่าง
- ยังให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ท Gateway
- ปิดใช้งาน live reload สำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้ Plugin `bonjour` ที่รวมมา): ละเว้น `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`; การประกาศ multicast บน LAN ยังต้องเปิดใช้ Plugin `bonjour` ที่รวมมา
- `off`: ระงับการประกาศ multicast บน LAN โดยไม่เปลี่ยนการเปิดใช้ Plugin
- Plugin `bonjour` ที่รวมมาจะเริ่มอัตโนมัติบนโฮสต์ macOS และต้อง opt-in บน Linux, Windows และการปรับใช้ Gateway แบบคอนเทนเนอร์
- ค่า hostname เริ่มต้นจะใช้ hostname ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง และจะ fallback เป็น `openclaw` แทน ปรับทับได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบ unicast ใต้ `~/.openclaw/dns/` สำหรับการค้นหาข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + split DNS ของ Tailscale

การตั้งค่า: `openclaw dns setup --apply`

---

## สภาพแวดล้อม

### `env` (ตัวแปรสภาพแวดล้อมแบบอินไลน์)

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งคู่ไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังขาดอยู่จากโปรไฟล์ login shell ของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนค่าตัวแปรสภาพแวดล้อม

อ้างอิงตัวแปรสภาพแวดล้อมในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหายหรือว่างจะทำให้เกิดข้อผิดพลาดเมื่อโหลด config
- escape ด้วย `$${VAR}` สำหรับ `${VAR}` แบบ literal
- ทำงานร่วมกับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเติม: ค่าข้อความธรรมดายังใช้ได้

### `SecretRef`

ใช้รูปทรงออบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบ absolute (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มี path segment ที่คั่นด้วย slash เป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิว credential ที่รองรับ

- เมทริกซ์หลัก: [พื้นผิว Credential ของ SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยัง path ของ credential ใน `openclaw.json` ที่รองรับ
- refs ใน `auth-profiles.json` จะถูกรวมอยู่ในการ resolve ระหว่าง runtime และความครอบคลุมของ audit

### config ของผู้ให้บริการความลับ

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
- path ของผู้ให้บริการ file และ exec จะ fail closed เมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับ path ที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้
- ผู้ให้บริการ `exec` ต้องใช้ path ของ `command` แบบ absolute และใช้ protocol payloads บน stdin/stdout
- ตามค่าเริ่มต้น path ของคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาต path ที่เป็น symlink ขณะตรวจสอบ path เป้าหมายที่ resolve แล้ว
- หากกำหนดค่า `trustedDirs` การตรวจสอบ trusted-dir จะใช้กับ path เป้าหมายที่ resolve แล้ว
- child environment ของ `exec` จะมีค่าขั้นต่ำตามค่าเริ่มต้น; ส่งผ่านตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูก resolve ณ เวลา activation เป็น snapshot ในหน่วยความจำ จากนั้น path ของคำขอจะอ่านเฉพาะ snapshot เท่านั้น
- การกรอง active-surface จะใช้ระหว่าง activation: refs ที่ยัง resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ขณะที่พื้นผิวที่ไม่ได้ใช้งานจะถูกข้ามพร้อม diagnostics

---

## พื้นที่จัดเก็บ auth

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

- โปรไฟล์ต่อ agent จะถูกเก็บที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมด credential แบบคงที่
- แผนที่ `auth-profiles.json` แบบแบนรุ่นเก่า เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key แบบ canonical `provider:default` พร้อมสำรองข้อมูล `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับ credential ของ auth-profile ที่อิงกับ SecretRef
- credential runtime แบบคงที่มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ static `auth.json` รุ่นเก่าจะถูกล้างเมื่อพบ
- การนำเข้า OAuth รุ่นเก่ามาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรม runtime ของความลับและเครื่องมือ `audit/configure/apply`: [การจัดการความลับ](/th/gateway/secrets)

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

- `billingBackoffHours`: ค่า backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาดด้านการเรียกเก็บเงินจริงหรือเครดิตไม่เพียงพอ (ค่าเริ่มต้น: `5`) ข้อความเกี่ยวกับการเรียกเก็บเงินที่ชัดเจนยังคงมาถึงที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดอยู่กับผู้ให้บริการที่เป็นเจ้าของตัวจับคู่นั้น (เช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` ที่ลองใหม่ได้เกี่ยวกับหน้าต่างการใช้งานหรือขีดจำกัดการใช้จ่ายขององค์กร/พื้นที่ทำงานจะยังอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: การแทนที่ต่อผู้ให้บริการแบบไม่บังคับสำหรับจำนวนชั่วโมง backoff ด้านการเรียกเก็บเงิน
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โพเนนเชียลของ backoff ด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ค่า backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการสลับ auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดโหลดเกินก่อนเปลี่ยนไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) รูปแบบผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะมาถึงที่นี่
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อนลองการสลับผู้ให้บริการ/โปรไฟล์ที่โหลดเกินอีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการสลับ auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดการจำกัดอัตราก่อนเปลี่ยนไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) กลุ่มการจำกัดอัตรานั้นรวมข้อความที่มีรูปแบบของผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## การบันทึก log

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

- ไฟล์ log เริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้งค่า `logging.file` สำหรับพาธที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดสูงสุดของไฟล์ log ที่ใช้งานอยู่เป็นไบต์ก่อนหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรที่มีหมายเลขไว้ได้สูงสุดห้าไฟล์ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบ best-effort สำหรับเอาต์พุตคอนโซล, ไฟล์ log, ระเบียน log ของ OTLP และข้อความทรานสคริปต์เซสชันที่บันทึกไว้ `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบาย log/ทรานสคริปต์ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปกปิดความลับก่อนส่งออก

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

- `enabled`: สวิตช์หลักสำหรับเอาต์พุตการวัดและสังเกตการณ์ (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุต log แบบเจาะจง (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภทเซสชันประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, เครื่องมือ, สถานะ, บล็อก และความคืบหน้าของ ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่ซ้ำกันจะ back off ขณะที่ยังไม่เปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms ก่อนที่งานที่ยังทำงานอยู่ซึ่งชะงักและเข้าเงื่อนไขอาจถูก abort-drain เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่าง embedded-run ที่ขยายและปลอดภัยกว่าอย่างน้อย 10 นาทีและ 5 เท่าของ `stuckSessionWarnMs`
- `otel.enabled`: เปิดใช้ไปป์ไลน์ส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าฉบับเต็ม แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของ collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint ของ OTLP เฉพาะสัญญาณแบบไม่บังคับ เมื่อตั้งค่าแล้ว จะเขียนทับ `otel.endpoint` เฉพาะสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: header เมทาดาทา HTTP/gRPC เพิ่มเติมที่ส่งไปพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลาการ flush telemetry เป็นระยะใน ms
- `otel.captureContent`: การเลือกเปิดจับเนื้อหาดิบสำหรับแอตทริบิวต์ span ของ OTEL ค่าเริ่มต้นปิดอยู่ บูลีน `true` จะจับเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบออบเจ็กต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ผู้ให้บริการ span ของ GenAI แบบทดลองล่าสุด โดยค่าเริ่มต้น span จะคงแอตทริบิวต์เดิม `gen_ai.system` เพื่อความเข้ากันได้; metrics ของ GenAI ใช้แอตทริบิวต์เชิงความหมายแบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะที่ยังคงเปิดตัวรับฟังการวินิจฉัยไว้
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env var ของ endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปชอต trace ของแคชสำหรับ embedded runs (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ JSONL ของ trace แคช (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุต trace แคช (ทั้งหมดมีค่าเริ่มต้น: `true`)

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
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติแบบเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: หน่วงเวลาขั้นต่ำเป็นชั่วโมงก่อนปรับใช้โดยอัตโนมัติในช่องทาง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการ rollout เพิ่มเติมของช่องทาง stable เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
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

- `enabled`: เกตฟีเจอร์ ACP แบบ global (ค่าเริ่มต้น: `true`; ตั้งค่าเป็น `false` เพื่อซ่อน affordance สำหรับการ dispatch และ spawn ของ ACP)
- `dispatch.enabled`: เกตอิสระสำหรับการ dispatch เทิร์นของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งค่าเป็น `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งานแต่บล็อกการดำเนินการ
- `backend`: id แบ็กเอนด์รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin แบ็กเอนด์ก่อน และถ้าตั้งค่า `plugins.allow` ให้รวม id ของ Plugin แบ็กเอนด์ (เช่น `acpx`) มิฉะนั้นแบ็กเอนด์ ACP จะไม่โหลด
- `defaultAgent`: id ของเอเจนต์เป้าหมาย ACP สำรองเมื่อการ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชันรันไทม์ ACP; ว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ active พร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่ stream
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยก projection ของบล็อกที่ stream
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` stream แบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์จบเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นหลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตของผู้ช่วยสูงสุดที่ project ต่อเทิร์น ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ project
- `stream.tagVisibility`: ระเบียนของชื่อแท็กไปยังการแทนที่การมองเห็นแบบบูลีนสำหรับเหตุการณ์ที่ stream
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ worker ของเซสชัน ACP ก่อนเข้าเงื่อนไข cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะเรียกใช้เมื่อ bootstrap สภาพแวดล้อมรันไทม์ ACP

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

- `cli.banner.taglineMode` ควบคุมสไตล์ tagline ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): tagline ตลก/ตามฤดูกาลที่หมุนเปลี่ยน
  - `"default"`: tagline กลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่แค่ tagline) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## ตัวช่วยตั้งค่า

เมทาดาทาที่เขียนโดยโฟลว์การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

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

## ข้อมูลประจำตัว

ดูฟิลด์ข้อมูลประจำตัวของ `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## Bridge (เดิม, นำออกแล้ว)

บิลด์ปัจจุบันไม่รวม TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน WebSocket ของ Gateway คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของ schema config อีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="การกำหนดค่า bridge เดิม (ข้อมูลอ้างอิงทางประวัติศาสตร์)">

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

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบแยกที่เสร็จสิ้นแล้วไว้ก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้างทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวรไว้ด้วย ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์บันทึกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดข้อมูล ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดใหม่ล่าสุดที่เก็บไว้เมื่อการตัดบันทึกการรันถูกเรียกใช้ ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเคน bearer ที่ใช้สำหรับการส่ง Cron Webhook แบบ POST (`delivery.mode = "webhook"`); หากไม่ระบุ จะไม่ส่งส่วนหัวการยืนยันตัวตน
- `webhook`: URL Webhook สำรองแบบเดิมที่เลิกใช้แล้ว (http/https) ใช้เฉพาะกับงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`

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
- `backoffMs`: อาร์เรย์ของระยะหน่วงแบบ backoff หน่วยมิลลิวินาทีสำหรับการลองใหม่แต่ละครั้ง (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่เรียกให้ลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อให้ลองใหม่กับประเภทชั่วคราวทั้งหมด

ใช้กับงาน Cron แบบครั้งเดียวเท่านั้น งานที่เกิดซ้ำใช้การจัดการความล้มเหลวแยกต่างหาก

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
- `after`: จำนวนความล้มเหลวต่อเนื่องก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก ขั้นต่ำ: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามต่อเนื่องเข้าในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดในการดำเนินการ
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือรหัสช่องทางที่ไม่บังคับสำหรับจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบประกาศ `"last"` ใช้ช่องทางการส่งล่าสุดที่ทราบซ้ำ
- `to`: เป้าหมายประกาศหรือ URL Webhook แบบชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` รายงานระดับงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและระดับงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมายประกาศหลักนั้นเมื่อเกิดความล้มเหลว
- รองรับ `delivery.failureDestination` เฉพาะงาน `sessionTarget="isolated"` เว้นแต่ว่า `delivery.mode` หลักของงานคือ `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวแทนค่าของเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร           | คำอธิบาย                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                         |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวห่อประวัติ/ผู้ส่ง)             |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว                 |
| `{{From}}`         | ตัวระบุผู้ส่ง                                 |
| `{{To}}`           | ตัวระบุปลายทาง                            |
| `{{MessageSid}}`   | รหัสข้อความของช่องทาง                                |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                              |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                 |
| `{{MediaUrl}}`     | URL เทียมของสื่อขาเข้า                          |
| `{{MediaPath}}`    | เส้นทางสื่อในเครื่อง                                  |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)               |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                  |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ค่าแล้วสำหรับรายการ CLI             |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ค่าแล้วสำหรับรายการ CLI         |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                           |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (อย่างเต็มความสามารถ)                       |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (อย่างเต็มความสามารถ)               |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (อย่างเต็มความสามารถ)                 |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (อย่างเต็มความสามารถ)                 |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord ฯลฯ) |

---

## การรวมการกำหนดค่า (`$include`)

แยกการกำหนดค่าออกเป็นหลายไฟล์:

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
- อาร์เรย์ของไฟล์: ผสานแบบลึกตามลำดับ (รายการหลังแทนที่รายการก่อน)
- คีย์ระดับเดียวกัน: ผสานหลังการรวม (แทนที่ค่าที่ถูกรวมเข้ามา)
- การรวมซ้อนกัน: ลึกได้สูงสุด 10 ระดับ
- เส้นทาง: แก้ค่าโดยอิงจากไฟล์ที่รวม แต่ต้องคงอยู่ภายในไดเรกทอรีการกำหนดค่าระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบสัมบูรณ์/`../` อนุญาตเฉพาะเมื่อยังแก้ค่าให้อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่มีการรวมแบบไฟล์เดียวรองรับ จะเขียนผ่านไปยังไฟล์ที่ถูกรวมนั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และคง `openclaw.json` ไว้เหมือนเดิม
- การรวมที่ราก อาร์เรย์การรวม และการรวมที่มีการแทนที่ด้วยคีย์ระดับเดียวกันเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนที่จะทำให้การกำหนดค่าแบนลง
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดการแยกวิเคราะห์ และการรวมแบบวนรอบ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
