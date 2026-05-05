---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แม่นยำ
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าของช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของระบบย่อย
title: คู่มืออ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-05T06:17:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd0b6bf9a77d91bcc240088e4be92e44b6e70910efe00f7ed99534fb70983479
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการกำหนดค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบมุ่งเน้นงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการกำหนดค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงตัวปรับแต่งหน่วยความจำเชิงลึก/QMD จะอยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

ความจริงจากโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema แบบสดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI พร้อมผสานเมตาดาต้าของบันเดิล/Plugin/ช่องทางเมื่อมี
- `config.schema.lookup` คืนค่าโหนดสคีมาหนึ่งรายการที่จำกัดขอบเขตตามพาธสำหรับเครื่องมือเจาะดูรายละเอียด
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮชฐานอ้างอิงของเอกสารการกำหนดค่าเทียบกับพื้นผิวสคีมาปัจจุบัน

พาธค้นหา Agent: ใช้การกระทำเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบมุ่งเน้นงาน และหน้านี้
สำหรับแผนที่ฟิลด์ที่กว้างขึ้น ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะ:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการกำหนดค่า dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งในตัว + บันเดิลปัจจุบัน
- หน้าของช่องทาง/Plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบการกำหนดค่าคือ **JSON5** (อนุญาตให้มีคอมเมนต์ + จุลภาคท้ายรายการได้) ฟิลด์ทั้งหมดเป็นตัวเลือก — OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อเว้นไว้

---

## ช่องทาง

คีย์การกำหนดค่าต่อช่องทางย้ายไปยังหน้าเฉพาะแล้ว — โปรดดู
[การกำหนดค่า — ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทาง
แบบบันเดิลอื่น ๆ (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การกั้นการกล่าวถึง)

## ค่าเริ่มต้นของ Agent, หลาย Agent, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว — โปรดดู
[การกำหนดค่า — Agent](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (เวิร์กสเปซ, โมเดล, การคิด, Heartbeat, หน่วยความจำ, สื่อ, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกหลาย Agent)
- `session.*` (วงจรชีวิตเซสชัน, Compaction, การตัดแต่ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: รหัส locale BCP 47 แบบไม่บังคับสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายเครื่องมือ, ตัวสลับเชิงทดลอง, การกำหนดค่าเครื่องมือที่มีผู้ให้บริการรองรับ และการตั้งค่า
ผู้ให้บริการ / base-URL แบบกำหนดเองย้ายไปยังหน้าเฉพาะแล้ว — โปรดดู
[การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## โมเดล

คำจำกัดความผู้ให้บริการ, รายการอนุญาตโมเดล และการตั้งค่าผู้ให้บริการแบบกำหนดเองอยู่ใน
[การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
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
- `models.providers`: แผนที่ผู้ให้บริการแบบกำหนดเองที่มีคีย์เป็นรหัสผู้ให้บริการ
- `models.pricing.enabled`: ควบคุม pricing bootstrap เบื้องหลังที่
  เริ่มหลังจาก sidecar และช่องทางเข้าสู่พาธ Gateway ready เมื่อเป็น `false`
  Gateway จะข้ามการดึงแค็ตตาล็อกราคา OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังคงใช้ได้สำหรับการประมาณต้นทุนในเครื่อง

## MCP

คำจำกัดความเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้โดย Pi แบบฝังตัวและ adapter รันไทม์อื่น ๆ คำสั่ง `openclaw mcp list`,
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

- `mcp.servers`: คำจำกัดความเซิร์ฟเวอร์ MCP แบบ stdio หรือ remote ที่ตั้งชื่อไว้สำหรับรันไทม์ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` ทำให้เป็นฟิลด์ `transport` ตามมาตรฐาน
- `mcp.sessionIdleTtlMs`: TTL เมื่อ idle สำหรับรันไทม์ MCP แบบบันเดิลที่จำกัดขอบเขตตามเซสชัน
  การรันแบบฝังครั้งเดียวร้องขอการล้างข้อมูลเมื่อจบการรัน; TTL นี้เป็นตัวสำรองสำหรับ
  เซสชันที่มีอายุยาวและผู้เรียกในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` จะ hot-apply โดย dispose รันไทม์ MCP ของเซสชันที่แคชไว้
  การค้นพบ/ใช้เครื่องมือครั้งถัดไปจะสร้างใหม่จากการกำหนดค่าใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL

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

- `allowBundled`: รายการอนุญาตแบบไม่บังคับสำหรับ Skills แบบบันเดิลเท่านั้น (Skills ที่จัดการ/ในเวิร์กสเปซไม่ถูกกระทบ)
- `load.extraDirs`: ราก Skills ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อ `brew`
  พร้อมใช้งาน ก่อนย้อนกลับไปใช้ชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ความต้องการตัวติดตั้ง node สำหรับสเปก `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน Skills แม้ว่าจะถูกบันเดิล/ติดตั้งแล้ว
- `entries.<skillKey>.apiKey`: ทางลัดสำหรับ Skills ที่ประกาศตัวแปร env หลัก (สตริง plaintext หรืออ็อบเจกต์ SecretRef)

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
- Discovery รองรับ Plugin OpenClaw แบบ native รวมถึงบันเดิล Codex และบันเดิล Claude ที่เข้ากันได้ รวมถึงบันเดิล layout เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการกำหนดค่าต้องรีสตาร์ท gateway**
- `allow`: รายการอนุญาตแบบไม่บังคับ (โหลดเฉพาะ Plugin ที่ระบุ) `deny` ชนะ
- `bundledDiscovery`: ค่าเริ่มต้นคือ `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้น
  `plugins.allow` ที่ไม่ว่างจะกั้น Plugin ผู้ให้บริการแบบบันเดิลด้วย รวมถึงผู้ให้บริการรันไทม์
  web-search Doctor เขียน `"compat"` สำหรับการกำหนดค่ารายการอนุญาต legacy ที่ย้ายมา
  เพื่อรักษาพฤติกรรมผู้ให้บริการแบบบันเดิลที่มีอยู่จนกว่าคุณจะเลือกใช้
- `plugins.entries.<id>.apiKey`: ฟิลด์ทางลัดคีย์ API ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แผนที่ตัวแปร env ที่จำกัดขอบเขตตาม Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไข prompt จาก legacy `before_agent_start` ขณะยังคงรักษา legacy `modelOverride` และ `providerOverride` ไว้ ใช้กับ hook ของ Plugin native และไดเรกทอรี hook ที่บันเดิลที่รองรับให้มา
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin non-bundled ที่เชื่อถือได้อาจอ่านเนื้อหาบทสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอ override `provider` และ `model` ต่อการรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: รายการอนุญาตแบบไม่บังคับของเป้าหมาย `provider/model` ตามมาตรฐานสำหรับ override ของ subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตทุกโมเดล
- `plugins.entries.<id>.config`: อ็อบเจกต์การกำหนดค่าที่ Plugin กำหนด (ตรวจสอบความถูกต้องโดยสคีมา Plugin OpenClaw แบบ native เมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ Plugin ช่องทางอยู่ภายใต้ `channels.<id>` และควรอธิบายโดยเมตาดาต้า `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดย registry ตัวเลือก OpenClaw กลาง
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการ web-fetch ของ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl (รับ SecretRef) ย้อนกลับไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐาน API ของ Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; override แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: แยกเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้ผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phase และ threshold
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ cron สำหรับการกวาด dreaming เต็มรูปแบบแต่ละครั้ง (ค่าเริ่มต้น `"0 3 * * *"`)
  - `model`: override โมเดล subagent ของ Dream Diary แบบไม่บังคับ ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชัน; ความล้มเหลวด้านความเชื่อถือหรือรายการอนุญาตจะไม่ fallback แบบเงียบ
  - นโยบาย phase และ threshold เป็นรายละเอียดการใช้งานจริง (ไม่ใช่คีย์การกำหนดค่าที่ผู้ใช้เห็น)
- การกำหนดค่าหน่วยความจำแบบเต็มอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้งานยังสามารถมีส่วนร่วมกับค่าเริ่มต้น Pi แบบฝังจาก `settings.json`; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่า Agent ที่ผ่านการทำให้ปลอดภัย ไม่ใช่เป็น patch การกำหนดค่า OpenClaw ดิบ
- `plugins.slots.memory`: เลือกรหัส Plugin หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้งาน Plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือกรหัส Plugin context engine ที่ใช้งานอยู่; ค่าเริ่มต้นคือ `"legacy"` เว้นแต่คุณจะติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

---

## ข้อผูกพัน

`commitments` ควบคุมหน่วยความจำ follow-up ที่อนุมานได้: OpenClaw สามารถตรวจจับ check-in จากรอบบทสนทนาและส่งผ่านการรัน Heartbeat

- `commitments.enabled`: เปิดใช้การสกัดด้วย LLM แบบซ่อน, การจัดเก็บ และการส่งผ่าน Heartbeat สำหรับข้อผูกพัน follow-up ที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวนข้อผูกพัน follow-up ที่อนุมานได้สูงสุดซึ่งส่งต่อเซสชัน Agent ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

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

- `evaluateEnabled: false` จะปิดใช้งาน `act:evaluate` และ `wait --fn`
- `tabCleanup` จะเรียกคืนแท็บของเอเจนต์หลักที่ติดตามไว้หลังจากไม่มีการใช้งาน หรือเมื่อเซสชันมีจำนวนเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อปิดใช้งานโหมดล้างข้อมูลแต่ละแบบ
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด endpoint ของโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นหา
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias เดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุอย่างชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` ยอมรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นหา `/json/version`; ใช้ WS(S)
  เมื่อ provider ของคุณให้ URL ของ DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการตรวจสอบการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่จัดการไว้จะใช้ค่าเริ่มต้น CDP ในเครื่อง
- หากบริการ CDP ที่จัดการภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็นโปรไฟล์เบราว์เซอร์ในเครื่องที่จัดการไว้ และอาจรายงานข้อผิดพลาดการเป็นเจ้าของพอร์ตในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับโฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่ได้
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อชี้ไปยังโปรไฟล์เบราว์เซอร์แบบ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การดำเนินการที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS selector, hook อัปโหลดไฟล์เดียว,
  ไม่มีการ override timeout ของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการดำเนินการแบบ batch
- โปรไฟล์ `openclaw` ในเครื่องที่จัดการไว้จะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ในเครื่องที่จัดการไว้สามารถตั้งค่า `executablePath` เพื่อ override ค่า
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ในเครื่องที่จัดการไว้ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นหา Chrome CDP HTTP
  หลังเริ่มกระบวนการ และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดใช้งาน เพิ่มค่านี้บนโฮสต์ที่ช้ากว่าเมื่อ Chrome
  เริ่มสำเร็จแต่การตรวจสอบความพร้อมเกิดแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นถ้าเป็นแบบ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  ยอมรับ `~` และ `~/...` สำหรับไดเรกทอรี home ของ OS ก่อนเปิด Chromium
  `userDataDir` รายโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde เช่นกัน
- บริการควบคุม: loopback เท่านั้น (พอร์ตมาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดใช้งานเพิ่มเติมในการเริ่มต้น Chromium ในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือแฟล็ก debug)

---

## UI

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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (สีของบับเบิล Talk Mode เป็นต้น)
- `assistant`: override ตัวตนของ Control UI หากไม่มี จะใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่

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

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`.
- `port`: พอร์ตแบบมัลติเพล็กซ์เดี่ยวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`.
- **นามแฝง bind เดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind `loopback` ค่าเริ่มต้นจะฟังบน `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะเข้ามาทาง `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ.
- **การรับรองความถูกต้อง**: จำเป็นตามค่าเริ่มต้น bind ที่ไม่ใช่ลูปแบ็กต้องใช้การรับรองความถูกต้องของ Gateway ในทางปฏิบัติ หมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือพร็อกซีย้อนกลับที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ดเริ่มต้นใช้งานจะสร้างโทเค็นตามค่าเริ่มต้น.
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRef) ให้ตั้งค่า `gateway.auth.mode` เป็น `token` หรือ `password` อย่างชัดเจน โฟลว์การเริ่มทำงานและการติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างแต่ไม่ได้ตั้งค่าโหมด.
- `gateway.auth.mode: "none"`: โหมดไม่มีการรับรองความถูกต้องแบบชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โหมดนี้ตั้งใจไม่เสนอในพรอมป์เริ่มต้นใช้งาน.
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการรับรองความถูกต้องของเบราว์เซอร์/ผู้ใช้ให้พร็อกซีย้อนกลับที่รับรู้ตัวตน และเชื่อถือส่วนหัวตัวตนจาก `gateway.trustedProxies` (ดู [การรับรองความถูกต้องของพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งที่มาของพร็อกซีที่ **ไม่ใช่ลูปแบ็ก** ตามค่าเริ่มต้น พร็อกซีย้อนกลับแบบลูปแบ็กบนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็นทางสำรองโดยตรงภายในเครื่องได้ ส่วน `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้.
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` ส่วนหัวตัวตนของ Tailscale Serve สามารถผ่านการรับรองความถูกต้องของ UI ควบคุม/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) ปลายทาง HTTP API **ไม่** ใช้การรับรองความถูกต้องจากส่วนหัว Tailscale นั้น แต่จะทำตามโหมดการรับรองความถูกต้อง HTTP ปกติของ Gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่าโฮสต์ของ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: ตัวจำกัดการรับรองความถูกต้องที่ล้มเหลวแบบเลือกได้ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการรับรองความถูกต้อง (ความลับที่ใช้ร่วมกันและโทเค็นอุปกรณ์จะถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`.
  - บนเส้นทาง Tailscale Serve แบบอะซิงโครนัสสำหรับ UI ควบคุม ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับให้ทำทีละรายการก่อนเขียนผลล้มเหลว ดังนั้นความพยายามผิดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานที่คำขอที่สอง แทนที่ทั้งสองคำขอจะแข่งกันผ่านไปเป็นความไม่ตรงกันธรรมดา.
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีแบบเข้มงวด).
- ความพยายามรับรองความถูกต้อง WS ที่มีต้นทางจากเบราว์เซอร์จะถูกจำกัดอัตราเสมอโดยปิดการยกเว้นลูปแบ็ก (การป้องกันเชิงลึกต่อการเดารหัส localhost จากเบราว์เซอร์).
- บนลูปแบ็ก การล็อกเอาต์ที่มีต้นทางจากเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ทำให้เป็นรูปแบบมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่ล็อก
  ต้นทางอื่นโดยอัตโนมัติ.
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบลูปแบ็ก) หรือ `funnel` (สาธารณะ, ต้องมีการรับรองความถูกต้อง).
- `controlUi.allowedOrigins`: รายการอนุญาตต้นทางเบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จากต้นทางที่ไม่ใช่ลูปแบ็ก.
- `controlUi.chatMessageMaxWidth`: ความกว้างสูงสุดแบบเลือกได้สำหรับข้อความแชต UI ควบคุมที่จัดกลุ่ม รับค่าความกว้าง CSS ที่จำกัด เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้กลไกสำรองต้นทางจากส่วนหัว Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบายต้นทางจากส่วนหัว Host.
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct` ค่า `remote.url` ต้องเป็น `ws://` หรือ `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: การแทนที่ฉุกเฉินฝั่งไคลเอนต์ผ่านสภาพแวดล้อมของกระบวนการ
  ที่อนุญาตให้ใช้ `ws://` แบบข้อความธรรมดาไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้;
  ค่าเริ่มต้นสำหรับข้อความธรรมดายังคงจำกัดเฉพาะลูปแบ็ก ไม่มีค่าที่เทียบเท่าใน
  `openclaw.json` และการกำหนดค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่มีผลต่อไคลเอนต์
  WebSocket ของ Gateway.
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการรับรองความถูกต้องของ Gateway ด้วยตัวเอง.
- `gateway.push.apns.relay.baseUrl`: URL ฐาน HTTPS สำหรับรีเลย์ APNs ภายนอกที่ใช้โดยบิลด์ iOS ทางการ/TestFlight หลังจากบิลด์เหล่านั้นเผยแพร่การลงทะเบียนที่มีรีเลย์รองรับไปยัง Gateway URL นี้ต้องตรงกับ URL รีเลย์ที่คอมไพล์อยู่ในบิลด์ iOS.
- `gateway.push.apns.relay.timeoutMs`: ระยะหมดเวลาการส่งจาก Gateway ไปยังรีเลย์เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`.
- การลงทะเบียนที่มีรีเลย์รองรับจะถูกมอบหมายให้ตัวตน Gateway เฉพาะ แอป iOS ที่จับคู่จะดึง `gateway.identity.get` รวมตัวตนนั้นในการลงทะเบียนรีเลย์ และส่งต่อสิทธิ์ส่งที่จำกัดขอบเขตตามการลงทะเบียนไปยัง Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้นั้นกลับมาใช้ได้.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: การแทนที่ env ชั่วคราวสำหรับการกำหนดค่ารีเลย์ด้านบน.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL รีเลย์ HTTP แบบลูปแบ็ก URL รีเลย์สำหรับการผลิตควรคงอยู่บน HTTPS.
- `gateway.handshakeTimeoutMs`: ระยะหมดเวลาของ handshake WebSocket ของ Gateway ก่อนการรับรองความถูกต้องเป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีความสำคัญเหนือกว่าเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ภายในเครื่องอาจเชื่อมต่อได้ในขณะที่การวอร์มอัปช่วงเริ่มต้นยังไม่นิ่ง.
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสอบสุขภาพช่องทางเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ตโดยตัวตรวจสอบสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`.
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ซ็อกเก็ตค้างเป็นนาที ค่านี้ควรมากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`.
- `gateway.channelMaxRestartsPerHour`: จำนวนการรีสตาร์ตสูงสุดโดยตัวตรวจสอบสุขภาพต่อช่องทาง/บัญชีในช่วงหนึ่งชั่วโมงแบบเลื่อน ค่าเริ่มต้น: `10`.
- `channels.<provider>.healthMonitor.enabled`: การเลือกไม่ใช้รายช่องทางสำหรับการรีสตาร์ตโดยตัวตรวจสอบสุขภาพ โดยยังคงเปิดตัวตรวจสอบทั่วโลกไว้.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การแทนที่รายบัญชีสำหรับช่องทางหลายบัญชี เมื่อตั้งค่าแล้ว ค่านี้จะมีความสำคัญเหนือกว่าการแทนที่ระดับช่องทาง.
- เส้นทางการเรียก Gateway ภายในเครื่องสามารถใช้ `gateway.remote.*` เป็นทางสำรองได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`.
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มีการสำรองระยะไกลที่บดบังปัญหา).
- `trustedProxies`: IP ของพร็อกซีย้อนกลับที่ยุติ TLS หรือแทรกส่วนหัวไคลเอนต์ที่ส่งต่อมา ระบุเฉพาะพร็อกซีที่คุณควบคุม รายการลูปแบ็กยังคงใช้ได้สำหรับการตั้งค่าพร็อกซีบนโฮสต์เดียวกัน/การตรวจจับภายใน (เช่น Tailscale Serve หรือพร็อกซีย้อนกลับภายในเครื่อง) แต่รายการเหล่านี้ **ไม่ได้** ทำให้คำขอลูปแบ็กมีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: เมื่อเป็น `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นคือ `false` เพื่อพฤติกรรมล้มเหลวแบบปิด.
- `gateway.nodes.pairing.autoApproveCidrs`: รายการอนุญาต CIDR/IP แบบเลือกได้สำหรับการอนุมัติการจับคู่อุปกรณ์ Node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีการขอขอบเขต จะปิดใช้งานเมื่อไม่ได้ตั้งค่า ค่านี้ไม่อนุมัติการจับคู่ผู้ปฏิบัติการ/เบราว์เซอร์/UI ควบคุม/เว็บแชตโดยอัตโนมัติ และไม่อนุมัติการอัปเกรดบทบาท ขอบเขต เมทาดาตา หรือกุญแจสาธารณะโดยอัตโนมัติ.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนดอนุญาต/ปฏิเสธทั่วโลกสำหรับคำสั่ง Node ที่ประกาศไว้หลังจากการจับคู่และการประเมินรายการอนุญาตของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกเปิดใช้คำสั่ง Node อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะนำคำสั่งออก แม้ว่าค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตอย่างชัดเจนจะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก Node เปลี่ยนรายการคำสั่งที่ประกาศไว้ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ Gateway จัดเก็บสแนปชอตคำสั่งที่อัปเดตแล้ว.
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการปฏิเสธเริ่มต้น).
- `gateway.tools.allow`: นำชื่อเครื่องมือออกจากรายการปฏิเสธ HTTP เริ่มต้น.

</Accordion>

### ปลายทางที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานตามค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- การเพิ่มความปลอดภัยของอินพุต URL สำหรับ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    รายการอนุญาตว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL.
- ส่วนหัวเสริมสำหรับเพิ่มความปลอดภัยของการตอบกลับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม; ดู [การรับรองความถูกต้องของพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ Gateway หลายรายการบนโฮสต์เดียวด้วยพอร์ตและไดเรกทอรีสถานะที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`).

ดู [Gateway หลายรายการ](/th/gateway/multiple-gateways).

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

- `enabled`: เปิดใช้การยุติ TLS ที่ตัวรับฟังของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`).
- `autoGenerate`: สร้างคู่ใบรับรอง/กุญแจแบบลงนามเองภายในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; สำหรับการใช้งานภายในเครื่อง/การพัฒนาเท่านั้น.
- `certPath`: เส้นทางระบบไฟล์ไปยังไฟล์ใบรับรอง TLS.
- `keyPath`: เส้นทางระบบไฟล์ไปยังไฟล์กุญแจส่วนตัว TLS; ควรจำกัดสิทธิ์การเข้าถึง.
- `caPath`: เส้นทางชุด CA แบบเลือกได้สำหรับการตรวจสอบไคลเอนต์หรือสายโซ่ความเชื่อถือแบบกำหนดเอง.

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

- `mode`: ควบคุมวิธีนำการแก้ไขการกำหนดค่าไปใช้ขณะรันไทม์.
  - `"off"`: ไม่สนใจการแก้ไขขณะระบบทำงาน; การเปลี่ยนแปลงต้องรีสตาร์ตอย่างชัดเจน.
  - `"restart"`: รีสตาร์ตกระบวนการ Gateway ทุกครั้งเมื่อการกำหนดค่าเปลี่ยน.
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ภายในกระบวนการโดยไม่รีสตาร์ต.
  - `"hybrid"` (ค่าเริ่มต้น): ลองโหลดซ้ำแบบทันใจก่อน; เปลี่ยนไปใช้การรีสตาร์ตหากจำเป็น.
- `debounceMs`: ช่วงดีบาวซ์เป็น ms ก่อนนำการเปลี่ยนแปลงการกำหนดค่าไปใช้ (จำนวนเต็มที่ไม่ติดลบ).
- `deferralTimeoutMs`: เวลาสูงสุดแบบเลือกได้เป็น ms ที่จะรอการดำเนินการที่กำลังทำอยู่ก่อนบังคับรีสตาร์ต ไม่ต้องระบุเพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรออย่างไม่มีกำหนดและบันทึกคำเตือนเป็นระยะว่ายังค้างอยู่.

---

## ฮุก

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

การตรวจสอบสิทธิ์: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`.
โทเค็น hook ใน query-string จะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ต้องไม่เป็น `/`; ให้ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หากการแมปหรือ preset ใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องใช้การเลือกใช้นี้

**เอนด์พอยต์:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก payload ของคำขอจะถูกยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ค่าโดยใช้ `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่มาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่กับ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่กับฟิลด์ payload สำหรับ path ทั่วไป
- เทมเพลต เช่น `{{messages[0].subject}}` อ่านจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่ส่งคืน action ของ hook ได้
  - `transform.module` ต้องเป็น path แบบสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (path แบบสัมบูรณ์และ traversal จะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของ workspace จะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่า path นี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี transforms ของ hooks หรือลบ `hooks.transformsDir`
- `agentId` ส่งต่อไปยังเอเจนต์เฉพาะ; ID ที่ไม่รู้จักจะ fallback ไปยังค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบชัดเจน (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่ที่ไม่บังคับสำหรับการรันเอเจนต์ hook โดยไม่มี `sessionKey` ที่ระบุชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันของการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist คำนำหน้าที่ไม่บังคับสำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อบังคับเมื่อการแมปหรือ preset ใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้งค่าแค็ตตาล็อกโมเดลไว้)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางต่อข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้ override preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- Gateway จะเริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูต หากมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่าเรียกใช้ `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

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

- ให้บริการ HTML/CSS/JS ที่เอเจนต์แก้ไขได้ และ A2UI ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะในเครื่อง: คงค่า `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การตรวจสอบสิทธิ์ Gateway (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews ไม่ส่งส่วนหัวการตรวจสอบสิทธิ์; หลังจากจับคู่และเชื่อมต่อ node แล้ว Gateway จะประกาศ URL ความสามารถแบบจำกัดขอบเขตตาม node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถจะผูกกับเซสชัน WS ของ node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback แบบอิง IP
- แทรกไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่างเปล่า
- ยังให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ท Gateway
- ปิดใช้งาน live reload สำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

---

## การค้นพบ

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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้งาน Plugin `bonjour` ที่บันเดิลมา): ละเว้น `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`; การโฆษณา LAN multicast ยังคงต้องเปิดใช้งาน Plugin `bonjour` ที่บันเดิลมา
- `off`: ระงับการโฆษณา LAN multicast โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่บันเดิลมาจะเริ่มอัตโนมัติบนโฮสต์ macOS และเป็นแบบ opt-in บน Linux, Windows และการปรับใช้ Gateway แบบ containerized
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง โดย fallback เป็น `openclaw` override ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบ unicast ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`.

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกใช้เฉพาะเมื่อสภาพแวดล้อมของโปรเซสไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งคู่ไม่แทนที่ตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังขาดจากโปรไฟล์ login shell ของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญแบบเต็ม

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
- ตัวแปรที่หายไป/ว่างจะทำให้เกิดข้อผิดพลาดเมื่อโหลด config
- escape ด้วย `$${VAR}` สำหรับ `${VAR}` แบบ literal
- ใช้งานได้กับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเติม: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปแบบอ็อบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบสัมบูรณ์ (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มี path segment ที่คั่นด้วย slash เป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์ canonical: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยัง path ข้อมูลรับรองของ `openclaw.json` ที่รองรับ
- การอ้างอิง `auth-profiles.json` รวมอยู่ในการ resolve ระหว่าง runtime และการครอบคลุมของ audit

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
- path ของผู้ให้บริการ file และ exec จะ fail closed เมื่อการตรวจสอบ Windows ACL ไม่พร้อมใช้งาน ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับ path ที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้
- ผู้ให้บริการ `exec` ต้องใช้ path ของ `command` แบบสัมบูรณ์ และใช้ payload ของโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น path ของคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาต path ที่เป็น symlink พร้อมกับตรวจสอบ path เป้าหมายที่ resolve แล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบ trusted-dir จะใช้กับ path เป้าหมายที่ resolve แล้ว
- สภาพแวดล้อมของ child ของ `exec` เป็นแบบขั้นต่ำโดยค่าเริ่มต้น; ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูก resolve ตอน activation เป็น snapshot ในหน่วยความจำ จากนั้น path ของ request จะอ่านเฉพาะ snapshot เท่านั้น
- การกรอง active-surface ใช้ระหว่าง activation: การอ้างอิงที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้การเริ่มต้น/โหลดซ้ำล้มเหลว ส่วนพื้นผิวที่ inactive จะถูกข้ามพร้อม diagnostics

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

- โปรไฟล์ต่อ agent ถูกจัดเก็บที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบแบนเดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key แบบ canonical `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่อิงกับ SecretRef
- ข้อมูลรับรอง runtime แบบคงที่มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่เดิมจะถูกล้างเมื่อพบ
- การนำเข้า OAuth เดิมมาจาก `~/.openclaw/credentials/oauth.json`
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

- `billingBackoffHours`: ค่า backoff ฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวเนื่องจากข้อผิดพลาดด้านการเรียกเก็บเงินจริงหรือเครดิตไม่เพียงพอ (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนอาจยังเข้ามาที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดขอบเขตอยู่กับผู้ให้บริการที่เป็นเจ้าของตัวจับคู่นั้น (ตัวอย่างเช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` แบบ retryable เกี่ยวกับหน้าต่างการใช้งาน หรือข้อความจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซ จะยังอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: ค่าทับแบบรายผู้ให้บริการที่ไม่บังคับสำหรับชั่วโมง backoff ด้านการเรียกเก็บเงิน
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โพเนนเชียลของ backoff ด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ค่า backoff ฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการสลับโปรไฟล์ยืนยันตัวตนภายในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดโหลดเกิน ก่อนสลับไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) รูปแบบผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อนลองสลับผู้ให้บริการ/โปรไฟล์ที่โหลดเกินอีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการสลับโปรไฟล์ยืนยันตัวตนภายในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) บัคเก็ต rate-limit นี้รวมข้อความที่มีรูปแบบของผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## การบันทึกล็อก

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

- ไฟล์ล็อกเริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้งค่า `logging.file` สำหรับพาธที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ล็อกที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนหมุนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขไว้ได้สูงสุดห้าไฟล์ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบพยายามอย่างดีที่สุดสำหรับเอาต์พุตคอนโซล ไฟล์ล็อก ระเบียนล็อก OTLP และข้อความถอดความเซสชันที่บันทึกถาวร `redactSensitive: "off"` จะปิดใช้งานเฉพาะนโยบายล็อก/ข้อความถอดความทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปกปิดความลับก่อนปล่อยออกมา

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

- `enabled`: สวิตช์หลักสำหรับเอาต์พุตเครื่องมือวัด (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตล็อกแบบเจาะจง (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภทเซสชันประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ เครื่องมือ สถานะ บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่ซ้ำจะถอยเวลาเมื่อยังไม่เปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms ก่อนที่งานที่ใช้งานอยู่ซึ่งค้างและเข้าเกณฑ์อาจถูก abort-drain เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่างการรันแบบฝังที่ขยายและปลอดภัยกว่าอย่างน้อย 10 นาที และ 5 เท่าของ `stuckSessionWarnMs`
- `otel.enabled`: เปิดใช้ไปป์ไลน์การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าครบถ้วน แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของ collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: ปลายทาง OTLP เฉพาะสัญญาณที่ไม่บังคับ เมื่อตั้งค่าไว้ จะทับ `otel.endpoint` เฉพาะสัญญาณนั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: ส่วนหัวเมตาดาต้า HTTP/gRPC เพิ่มเติมที่ส่งไปพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลาการ flush เทเลเมทรีตามรอบเป็น ms
- `otel.captureContent`: การจับเนื้อหาดิบแบบเลือกเปิดสำหรับแอตทริบิวต์ span ของ OTEL ค่าเริ่มต้นคือปิด ค่า Boolean `true` จะจับเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบอ็อบเจ็กต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ผู้ให้บริการ span ของ GenAI รุ่นทดลองล่าสุด โดยค่าเริ่มต้น span จะเก็บแอตทริบิวต์เดิม `gen_ai.system` เพื่อความเข้ากันได้; metrics ของ GenAI ใช้แอตทริบิวต์เชิงความหมายแบบจำกัดขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่ม/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะยังคงให้ listener การวินิจฉัยทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อมปลายทางเฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปช็อต cache trace สำหรับการรันแบบฝัง (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่จะรวมในเอาต์พุต cache trace (ค่าเริ่มต้นทั้งหมด: `true`)

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

- `channel`: ช่องทางรีลีสสำหรับการติดตั้งผ่าน npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจหาการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแบบแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: หน่วงเวลาขั้นต่ำเป็นชั่วโมงก่อนนำไปใช้อัตโนมัติในช่องทาง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการ rollout เพิ่มเติมเป็นชั่วโมงสำหรับช่องทาง stable (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
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

- `enabled`: feature gate ส่วนกลางของ ACP (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อนการส่งงาน ACP และ affordance สำหรับ spawn)
- `dispatch.enabled`: gate อิสระสำหรับการส่ง turn ของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งาน แต่บล็อกการดำเนินการ
- `backend`: id แบ็กเอนด์ runtime ACP เริ่มต้น (ต้องตรงกับ Plugin runtime ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin แบ็กเอนด์ก่อน และหากตั้งค่า `plugins.allow` ให้รวม id ของ Plugin แบ็กเอนด์ไว้ด้วย (ตัวอย่างเช่น `acpx`) มิฉะนั้นแบ็กเอนด์ ACP จะไม่โหลด
- `defaultAgent`: id เอเจนต์เป้าหมายสำรองของ ACP เมื่อ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชัน runtime ACP; ว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ทำงานพร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยกการฉายบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์สิ้นสุด turn
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นหลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตผู้ช่วยสูงสุดที่ฉายต่อ turn ของ ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉาย
- `stream.tagVisibility`: ระเบียนของชื่อแท็กไปยังค่าทับการมองเห็นแบบ boolean สำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: TTL เมื่อ idle เป็นนาทีสำหรับ worker เซสชัน ACP ก่อนเข้าเกณฑ์การล้างข้อมูล
- `runtime.installCommand`: คำสั่งติดตั้งที่ไม่บังคับสำหรับรันเมื่อ bootstrap สภาพแวดล้อม runtime ACP

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

- `cli.banner.taglineMode` ควบคุมสไตล์สโลแกนของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): สโลแกนตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: สโลแกนกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความสโลแกน (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่แค่สโลแกน) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

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

ดูฟิลด์ตัวตน `agents.list` ใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## Bridge (เดิม, ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของ schema config อีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถตัดคีย์ที่ไม่รู้จักออกได้)

<Accordion title="Config bridge เดิม (ข้อมูลอ้างอิงทางประวัติศาสตร์)">

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

- `sessionRetention`: ระยะเวลาที่เก็บเซสชันการรัน Cron แบบแยกที่เสร็จแล้วก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้างทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวร ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์บันทึกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดออก ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดล่าสุดที่เก็บไว้เมื่อการตัดบันทึกการรันถูกทริกเกอร์ ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเค็น bearer ที่ใช้สำหรับการส่ง Cron Webhook แบบ POST (`delivery.mode = "webhook"`) หากละไว้ จะไม่ส่งส่วนหัว auth
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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงานแบบครั้งเดียวเมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของดีเลย์ backoff เป็นมิลลิวินาทีสำหรับการลองใหม่แต่ละครั้ง (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ชนิดข้อผิดพลาดที่ทริกเกอร์การลองใหม่ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อลองใหม่กับชนิดชั่วคราวทั้งหมด

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
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่มีผลต่อ backoff ของข้อผิดพลาดการดำเนินการ
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความในช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือ ID ช่องทางที่ไม่บังคับ เพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `delivery.failureDestination` รายงานเฉพาะงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งแบบส่วนกลางและแบบรายงานเฉพาะงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ว่า `delivery.mode` หลักของงานเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวยึดตำแหน่งเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี wrapper ประวัติ/ผู้ส่ง)         |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว              |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | ID ข้อความของช่องทาง                             |
| `{{SessionId}}`    | UUID เซสชันปัจจุบัน                              |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                         |
| `{{MediaPath}}`    | พาธสื่อภายในเครื่อง                              |
| `{{MediaType}}`    | ชนิดสื่อ (รูปภาพ/เสียง/เอกสาร/…)                 |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                 |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ค่าแล้วสำหรับรายการ CLI           |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ค่าแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                  |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)           |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)          |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)      |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (WhatsApp, Telegram, Discord ฯลฯ) |

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
- คีย์ระดับเดียวกัน: ผสานหลัง includes (แทนที่ค่าที่ include มา)
- includes แบบซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: แก้โดยอิงกับไฟล์ที่ include แต่ต้องอยู่ภายในไดเรกทอรีการกำหนดค่าระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ absolute/`../` อนุญาตเฉพาะเมื่อยังแก้แล้วอยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่รองรับด้วย include ไฟล์เดียว จะเขียนผ่านไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- Root includes, อาร์เรย์ include และ includes ที่มีการแทนที่ด้วยคีย์ระดับเดียวกัน เป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนที่จะ flatten การกำหนดค่า
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดการแยกวิเคราะห์ และ includes แบบวนซ้ำ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
