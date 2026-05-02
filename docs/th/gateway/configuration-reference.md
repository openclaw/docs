---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แม่นยำ
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของระบบย่อย
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-02T22:19:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2963e01c73d1d3dbd218d76d0c0709f58f8b92e4b3d4606105cedd91571b5ed
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการตั้งค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมที่มุ่งตามงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการตั้งค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงปุ่มปรับหน่วยความจำเชิงลึก/QMD จะอยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวมเมทาดาทาของบันเดิล/Plugin/ช่องทางเข้ามาเมื่อมี
- `config.schema.lookup` ส่งคืนโหนดสคีมาหนึ่งรายการที่จำกัดตามพาธสำหรับเครื่องมือเจาะดูรายละเอียด
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮชฐานของเอกสารการตั้งค่าเทียบกับพื้นผิวสคีมาปัจจุบัน

พาธการค้นหาเอเจนต์: ใช้การกระทำเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับเอกสารและข้อจำกัดระดับฟิลด์ที่แน่นอนก่อนแก้ไข ใช้ [การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำที่มุ่งตามงาน และใช้หน้านี้สำหรับแผนที่ฟิลด์โดยรวม ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะ:

- [ข้อมูลอ้างอิงการตั้งค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการตั้งค่า Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งในตัว + คำสั่งที่บันเดิลมาปัจจุบัน
- หน้าของช่องทาง/Plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบการตั้งค่าคือ **JSON5** (อนุญาตให้มีคอมเมนต์ + คอมมาท้ายรายการ) ทุกฟิลด์เป็นทางเลือก — OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## ช่องทาง

คีย์การตั้งค่าต่อช่องทางถูกย้ายไปยังหน้าเฉพาะ — ดู
[การกำหนดค่า — ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางอื่นๆ
ที่บันเดิลมา (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การกั้นด้วยการกล่าวถึง)

## ค่าเริ่มต้นของเอเจนต์, หลายเอเจนต์, เซสชัน และข้อความ

ถูกย้ายไปยังหน้าเฉพาะ — ดู
[การกำหนดค่า — เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (เวิร์กสเปซ, โมเดล, การคิด, heartbeat, หน่วยความจำ, สื่อ, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกหลายเอเจนต์)
- `session.*` (วงจรชีวิตเซสชัน, compaction, การตัดแต่ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: รหัสโลแคล BCP 47 ทางเลือกสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงช่วงหยุดพักเริ่มต้นของแพลตฟอร์มไว้ก่อนส่งทรานสคริปต์ (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายเครื่องมือ สวิตช์ทดลอง การตั้งค่าเครื่องมือที่มีผู้ให้บริการหนุนหลัง และการตั้งค่าผู้ให้บริการแบบกำหนดเอง / base-URL ถูกย้ายไปยังหน้าเฉพาะ — ดู
[การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## โมเดล

นิยามผู้ให้บริการ allowlist ของโมเดล และการตั้งค่าผู้ให้บริการแบบกำหนดเองอยู่ใน
[การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
รูท `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อกโมเดลแบบทั่วทั้งระบบด้วย

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
- `models.pricing.enabled`: ควบคุมการบูตสแตรปราคาเบื้องหลังที่เริ่มหลังจาก sidecar และช่องทางเข้าสู่พาธพร้อมใช้งานของ Gateway เมื่อเป็น `false` Gateway จะข้ามการดึงแค็ตตาล็อกราคาของ OpenRouter และ LiteLLM; ค่า `models.providers.*.models[].cost` ที่ตั้งค่าไว้ยังคงใช้ได้สำหรับการประมาณต้นทุนในเครื่อง

## MCP

นิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการจะอยู่ภายใต้ `mcp.servers` และถูกใช้โดย Pi แบบฝังและอะแดปเตอร์รันไทม์อื่นๆ คำสั่ง `openclaw mcp list`, `show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อกับเซิร์ฟเวอร์เป้าหมายระหว่างแก้ไขการตั้งค่า

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

- `mcp.servers`: นิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือ remote ที่ตั้งชื่อไว้สำหรับรันไทม์ที่เปิดเผยเครื่องมือ MCP ที่ตั้งค่าไว้ รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`; `type: "http"` เป็นนามแฝงแบบ CLI-native ที่ `openclaw mcp set` และ `openclaw doctor --fix` ทำให้เป็นฟิลด์ `transport` มาตรฐาน
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับรันไทม์ MCP ที่บันเดิลมาและจำกัดตามเซสชัน การรันแบบครั้งเดียวที่ฝังอยู่จะขอการล้างข้อมูลเมื่อจบการรัน; TTL นี้เป็นกลไกสำรองสำหรับเซสชันอายุยาวและผู้เรียกในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` จะมีผลแบบ hot-apply โดยกำจัดรันไทม์ MCP ของเซสชันที่แคชไว้ การค้นพบ/ใช้เครื่องมือครั้งถัดไปจะสร้างใหม่จากการตั้งค่าใหม่ ดังนั้นรายการ `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL

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

- `allowBundled`: allowlist ทางเลือกสำหรับ skills ที่บันเดิลมาเท่านั้น (skills แบบจัดการ/เวิร์กสเปซไม่ได้รับผลกระทบ)
- `load.extraDirs`: ราก skill ที่แชร์เพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้ใช้ตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew` พร้อมใช้งาน ก่อนถอยไปใช้ชนิดตัวติดตั้งอื่น
- `install.nodeManager`: การตั้งค่าตัวติดตั้ง node ที่ต้องการสำหรับสเปก `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้จะถูกบันเดิล/ติดตั้งแล้ว
- `entries.<skillKey>.apiKey`: ทางลัดสำหรับ skills ที่ประกาศตัวแปร env หลัก (สตริง plaintext หรือออบเจ็กต์ SecretRef)

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
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
- การค้นพบรองรับ Plugin ของ OpenClaw แบบเนทีฟ รวมถึงบันเดิล Codex และบันเดิล Claude ที่เข้ากันได้ รวมถึงบันเดิลเลย์เอาต์เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการตั้งค่าต้องรีสตาร์ท gateway**
- `allow`: allowlist ทางเลือก (โหลดเฉพาะ Plugin ที่อยู่ในรายการ) `deny` มีผลเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์ทางลัดสำหรับคีย์ API ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แมปตัวแปร env ที่จำกัดขอบเขตตาม Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไขพรอมป์จาก `before_agent_start` แบบดั้งเดิม ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบดั้งเดิมไว้ ใช้กับ hooks ของ Plugin แบบเนทีฟและไดเรกทอรี hook ที่มาจากบันเดิลที่รองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่ไม่ใช่บันเดิลและเชื่อถือได้สามารถอ่านเนื้อหาการสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ override `provider` และ `model` ต่อการรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist ทางเลือกของเป้าหมาย `provider/model` แบบมาตรฐานสำหรับ override ของ subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตทุกโมเดล
- `plugins.entries.<id>.config`: ออบเจ็กต์การตั้งค่าที่ Plugin นิยาม (ตรวจสอบความถูกต้องด้วยสคีมา Plugin ของ OpenClaw แบบเนทีฟเมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ Plugin ช่องทางอยู่ภายใต้ `channels.<id>` และควรถูกอธิบายโดยเมทาดาทา `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดยรีจิสทรีตัวเลือกส่วนกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการดึงเว็บของ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl (รับ SecretRef) ถอยไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบดั้งเดิม หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: base URL ของ API Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; override แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นเว็บ Grok)
  - `enabled`: เปิดใช้ผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและ thresholds
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ cron สำหรับ dreaming sweep แบบเต็มแต่ละครั้ง (ค่าเริ่มต้นคือ `"0 3 * * *"`)
  - `model`: override โมเดล subagent ของ Dream Diary ทางเลือก ต้องใช้ `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชัน; ความล้มเหลวด้านความเชื่อถือหรือ allowlist จะไม่ถอยกลับแบบเงียบๆ
  - นโยบายเฟสและ thresholds เป็นรายละเอียดการใช้งานภายใน (ไม่ใช่คีย์การตั้งค่าที่ผู้ใช้เห็น)
- การตั้งค่าหน่วยความจำทั้งหมดอยู่ใน [ข้อมูลอ้างอิงการตั้งค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้แล้วยังสามารถสนับสนุนค่าเริ่มต้น Pi แบบฝังจาก `settings.json`; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่าเอเจนต์ที่ผ่านการทำให้ปลอดภัย ไม่ใช่เป็นแพตช์การตั้งค่า OpenClaw ดิบ
- `plugins.slots.memory`: เลือกรหัส Plugin หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้งาน Plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือกรหัส Plugin เอนจินบริบทที่ใช้งานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณจะติดตั้งและเลือกเอนจินอื่น

ดู [Plugins](/th/tools/plugin)

---

## Commitments

`commitments` ควบคุมหน่วยความจำการติดตามผลที่อนุมานได้: OpenClaw สามารถตรวจจับ check-in จากรอบการสนทนาและส่งผ่าน heartbeat runs

- `commitments.enabled`: เปิดใช้การดึงข้อมูลด้วย LLM แบบซ่อน การจัดเก็บ และการส่งผ่าน heartbeat สำหรับ commitments การติดตามผลที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวน commitments การติดตามผลที่อนุมานได้สูงสุดที่ส่งต่อเซสชันเอเจนต์ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

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
- `tabCleanup` เรียกคืนแท็บ primary-agent ที่ติดตามไว้หลังจากไม่มีการใช้งาน หรือเมื่อเซสชันเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อปิดใช้งานโหมดล้างข้อมูลแต่ละโหมดเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดโดยค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางของเบราว์เซอร์บนเครือข่ายส่วนตัว
- ในโหมดเข้มงวด ปลายทางโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับเป็น alias เดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบ attach-only (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรงแก่คุณ
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback ที่มีการจัดการ
  จะใช้ค่าเริ่มต้น CDP ภายในเครื่องต่อไป
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ภายในเครื่องที่มีการจัดการ และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตภายในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือก หรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การดำเนินการที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS-selector, ฮุกอัปโหลดไฟล์เดียว,
  ไม่มีการแทนที่ timeout ของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักดาวน์โหลด หรือการดำเนินการแบบ batch
- โปรไฟล์ `openclaw` ภายในเครื่องที่มีการจัดการจะกำหนด `cdpPort` และ `cdpUrl` ให้อัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ภายในเครื่องที่มีการจัดการสามารถตั้งค่า `executablePath` เพื่อแทนที่
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อเรียกใช้โปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ภายในเครื่องที่มีการจัดการใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังจากเริ่มกระบวนการ และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดใช้งาน เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับช่วงเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรีบ้านของ OS ของคุณก่อนเปิด Chromium
  `userDataDir` รายโปรไฟล์บนโปรไฟล์ `existing-session` ก็จะถูกขยาย tilde ด้วย
- บริการควบคุม: loopback เท่านั้น (พอร์ตมาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กเปิดใช้งานเพิ่มเติมให้กับการเริ่มต้น Chromium ภายในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือแฟล็กดีบัก)

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

- `seamColor`: สีเน้นสำหรับ chrome ของ UI แอปเนทีฟ (สีบับเบิล Talk Mode เป็นต้น)
- `assistant`: การแทนที่อัตลักษณ์ Control UI ย้อนกลับไปใช้อัตลักษณ์ agent ที่ใช้งานอยู่

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

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะเป็น `local`.
- `port`: พอร์ตมัลติเพล็กซ์เดี่ยวสำหรับ WS + HTTP. ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale), หรือ `custom`.
- **ชื่อแทน bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่ชื่อแทนของโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะเข้ามาที่ `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ.
- **การยืนยันตัวตน**: ต้องใช้โดยค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องมีการยืนยันตัวตนของ Gateway ในทางปฏิบัติ หมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` ตัวช่วยเริ่มต้นใช้งานจะสร้างโทเค็นให้โดยค่าเริ่มต้น.
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โฟลว์เริ่มต้นและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองไว้และไม่ได้ตั้งค่าโหมด.
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โหมดนี้ตั้งใจไม่ให้เสนอในพรอมป์เริ่มต้นใช้งาน.
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้กับ reverse proxy ที่รู้ตัวตน และเชื่อถือเฮดเดอร์ตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งที่มาของพร็อกซีแบบ **ไม่ใช่ loopback** โดยค่าเริ่มต้น; reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback โดยตรงในเครื่องได้; `gateway.auth.token` ยังคงไม่สามารถใช้ร่วมกับโหมด trusted-proxy ได้.
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` เฮดเดอร์ตัวตนของ Tailscale Serve สามารถใช้ผ่านการยืนยันตัวตนของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) เอนด์พอยต์ HTTP API **ไม่** ใช้การยืนยันตัวตนด้วยเฮดเดอร์ Tailscale นั้น แต่จะทำตามโหมดการยืนยันตัวตน HTTP ปกติของ Gateway แทน โฟลว์แบบไม่ใช้โทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: ตัวจำกัดความล้มเหลวในการยืนยันตัวตนแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token จะถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งกลับ `429` + `Retry-After`.
  - บนเส้นทาง Control UI แบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกทำให้ทำงานตามลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามที่ไม่ถูกต้องพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานตั้งแต่คำขอที่สอง แทนที่ทั้งสองคำขอจะวิ่งผ่านไปเป็นเพียงการไม่ตรงกัน.
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีที่เข้มงวด).
- ความพยายามยืนยันตัวตน WS จาก origin ของเบราว์เซอร์จะถูก throttled เสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost จากเบราว์เซอร์).
- บน loopback การล็อกเอาต์จาก origin ของเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำจาก origin localhost หนึ่งจะไม่
  ล็อก origin อื่นโดยอัตโนมัติ.
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องมีการยืนยันตัวตน).
- `controlUi.allowedOrigins`: รายการอนุญาต origin ของเบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จาก origin ที่ไม่ใช่ loopback.
- `controlUi.chatMessageMaxWidth`: ความกว้างสูงสุดแบบไม่บังคับสำหรับข้อความแชต Control UI ที่จัดกลุ่ม รองรับค่าความกว้าง CSS แบบจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)`, และ `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback ของ origin จากเฮดเดอร์ Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบาย origin จากเฮดเดอร์ Host.
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: การ override แบบ break-glass ของ environment
  ฝั่งกระบวนการไคลเอนต์ ที่อนุญาต `ws://` แบบ plaintext ไปยัง IP เครือข่ายส่วนตัว
  ที่เชื่อถือได้; ค่าเริ่มต้นยังคงเป็น loopback-only สำหรับ plaintext ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการกำหนดค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` จะไม่ส่งผลต่อไคลเอนต์ WebSocket
  ของ Gateway.
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ Gateway ด้วยตัวเอง.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS ฐานสำหรับ APNs relay ภายนอกที่ใช้โดย build iOS ทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนที่อิง relay ไปยัง Gateway URL นี้ต้องตรงกับ URL relay ที่คอมไพล์เข้าไปใน build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก Gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`.
- การลงทะเบียนที่อิง relay จะถูกมอบหมายให้กับตัวตน Gateway เฉพาะ แอป iOS ที่จับคู่แล้วจะดึง `gateway.identity.get` รวมตัวตนนั้นในการลงทะเบียน relay และส่งต่อสิทธิ์การส่งที่จำกัดตามขอบเขตการลงทะเบียนให้กับ Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่เก็บไว้นั้นไปใช้ซ้ำได้.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env ชั่วคราวสำหรับการกำหนดค่า relay ด้านบน.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ทางออกฉุกเฉินสำหรับการพัฒนาเท่านั้นสำหรับ URL relay HTTP แบบ loopback URL relay สำหรับ production ควรคงอยู่บน HTTPS.
- `gateway.handshakeTimeoutMs`: timeout การ handshake WebSocket ของ Gateway ก่อนยืนยันตัวตนเป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` จะมีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือกำลังต่ำ ซึ่งไคลเอนต์ในเครื่องสามารถเชื่อมต่อได้ในขณะที่การ warmup ตอนเริ่มต้นยังไม่เสร็จนิ่ง.
- `gateway.channelHealthCheckMinutes`: ช่วงเวลา health-monitor ของช่องเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ทโดย health-monitor ทั่วทั้งระบบ ค่าเริ่มต้น: `5`.
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ stale-socket เป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`.
- `gateway.channelMaxRestartsPerHour`: จำนวนสูงสุดของการรีสตาร์ทโดย health-monitor ต่อช่อง/บัญชีในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`.
- `channels.<provider>.healthMonitor.enabled`: การ opt-out ต่อช่องสำหรับการรีสตาร์ทโดย health-monitor ขณะที่ยังคงเปิดใช้ monitor ส่วนกลาง.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การ override ต่อบัญชีสำหรับช่องแบบหลายบัญชี เมื่อตั้งค่าแล้ว ค่านี้จะมีลำดับความสำคัญเหนือการ override ระดับช่อง.
- เส้นทางการเรียก Gateway ในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`.
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาบดบัง).
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือ inject เฮดเดอร์ forwarded-client ระบุเฉพาะพร็อกซีที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าพร็อกซี/การตรวจจับในเครื่องบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: เมื่อเป็น `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อพฤติกรรมแบบ fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: รายการอนุญาต CIDR/IP แบบไม่บังคับสำหรับการอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มี scope ที่ร้องขอ จะปิดใช้งานเมื่อไม่ได้ตั้งค่า ค่านี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata, หรือ public-key โดยอัตโนมัติ.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ส่วนกลางสำหรับคำสั่ง node ที่ประกาศ หลังจากการจับคู่และการประเมินรายการอนุญาตของแพลตฟอร์ม ใช้ `allowCommands` เพื่อ opt in คำสั่ง node ที่อันตราย เช่น `camera.snap`, `camera.clip`, และ `screen.record`; `denyCommands` จะลบคำสั่งออก แม้ค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตอย่างชัดเจนจะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ Gateway เก็บ snapshot คำสั่งที่อัปเดตแล้ว.
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny เริ่มต้น).
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการ deny เริ่มต้นของ HTTP.

</Accordion>

### เอนด์พอยต์ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- การเสริมความปลอดภัย URL-input ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    รายการอนุญาตว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL.
- เฮดเดอร์เสริมความปลอดภัยของ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับ HTTPS origins ที่คุณควบคุม; ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ Gateway หลายตัวบนโฮสต์เดียวด้วยพอร์ตและไดเรกทอรีสถานะที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`).

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

- `enabled`: เปิดใช้การ terminate TLS ที่ listener ของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`).
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; สำหรับการใช้งาน local/dev เท่านั้น.
- `certPath`: เส้นทางระบบไฟล์ไปยังไฟล์ใบรับรอง TLS.
- `keyPath`: เส้นทางระบบไฟล์ไปยังไฟล์ private key ของ TLS; จำกัดสิทธิ์การเข้าถึงไว้.
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
  - `"off"`: เพิกเฉยต่อการแก้ไข live; การเปลี่ยนแปลงต้อง restart อย่างชัดเจน.
  - `"restart"`: restart กระบวนการ Gateway เสมอเมื่อ config เปลี่ยน.
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ในกระบวนการโดยไม่ restart.
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไป restart หากจำเป็น.
- `debounceMs`: ช่วง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ).
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็น ms เพื่อรอการดำเนินการที่กำลังทำงานอยู่ก่อนบังคับ restart ละไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรอไม่จำกัดเวลาและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ.

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

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`.
โทเค็น hook ในสตริงคำค้นหาจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ต้อง**แตกต่าง**จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ไม่สามารถเป็น `/` ได้; ใช้พาธย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หากการแมปหรือพรีเซ็ตใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องเลือกใช้ตัวเลือกนั้น

**เอนด์พอยต์:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะถูกรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` เท่านั้น (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → จับคู่ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่ระบุจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่พาธย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ในเพย์โหลดสำหรับพาธทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่าแอ็กชัน hook ได้
  - `transform.module` ต้องเป็นพาธสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (พาธแบบสัมบูรณ์และการไล่ย้อนพาธจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของเวิร์กสเปซจะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` ส่งต่อไปยังเอเจนต์ที่ระบุ; ID ที่ไม่รู้จักจะย้อนกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบชัดเจน (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่ที่เลือกใส่ได้สำหรับการรันเอเจนต์ hook ที่ไม่มี `sessionKey` แบบชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` ได้ (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาตคำนำหน้าที่เลือกใส่ได้สำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` ค่านี้จะกลายเป็นสิ่งจำเป็นเมื่อการแมปหรือพรีเซ็ตใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` ใช้ค่าเริ่มต้นเป็น `last`
- `model` แทนที่ LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้งค่าแคตตาล็อกโมเดลไว้)

</Accordion>

### การผสานรวม Gmail

- พรีเซ็ต Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางต่อข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับเนมสเปซ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้แทนที่พรีเซ็ตด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- Gateway เริ่ม `gog gmail watch serve` อัตโนมัติเมื่อบูต หากมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

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

- ให้บริการ HTML/CSS/JS ที่เอเจนต์แก้ไขได้และ A2UI ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะภายในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การผูกแบบไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การยืนยันตัวตนของ Gateway (โทเค็น/รหัสผ่าน/พร็อกซีที่เชื่อถือได้) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- Node WebViews โดยทั่วไปไม่ส่งส่วนหัวการยืนยันตัวตน; หลังจากจับคู่และเชื่อมต่อ Node แล้ว Gateway จะประกาศ URL ความสามารถแบบจำกัดขอบเขต Node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับเซสชัน WS ของ Node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่ใช้การย้อนกลับตาม IP
- แทรกไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นอัตโนมัติเมื่อว่างเปล่า
- ยังให้บริการ A2UI ที่ `/__openclaw__/a2ui/`
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

- `minimal` (ค่าเริ่มต้น): ละเว้น `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`
- ชื่อโฮสต์ใช้ค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง มิฉะนั้นจะย้อนกลับไปใช้ `openclaw` แทนที่ได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบ unicast ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

ตั้งค่า: `openclaw dns setup --apply`

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกนำไปใช้เฉพาะเมื่อสภาพแวดล้อมของโปรเซสไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งสองไม่แทนที่ตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังไม่มีจากโปรไฟล์เชลล์ล็อกอินของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนค่าตัวแปรสภาพแวดล้อม

อ้างอิงตัวแปรสภาพแวดล้อมในสตริงการกำหนดค่าใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหาย/ว่างเปล่าจะทำให้เกิดข้อผิดพลาดตอนโหลดการกำหนดค่า
- Escape ด้วย `$${VAR}` สำหรับ `${VAR}` แบบตัวอักษร
- ใช้งานได้กับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเข้าไป: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปทรงออบเจ็กต์หนึ่งแบบ:

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

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` มุ่งเป้าไปยังพาธข้อมูลรับรอง `openclaw.json` ที่รองรับ
- การอ้างอิง `auth-profiles.json` รวมอยู่ในการแก้ค่ารันไทม์และความครอบคลุมของการตรวจสอบ

### การกำหนดค่าผู้ให้บริการความลับ

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
- พาธผู้ให้บริการ file และ exec จะปิดแบบล้มเหลวเมื่อการตรวจสอบ ACL ของ Windows ไม่พร้อมใช้งาน ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้ซึ่งตรวจสอบไม่ได้
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์ และใช้เพย์โหลดโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink ขณะตรวจสอบพาธเป้าหมายที่แก้ค่าแล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบไดเรกทอรีที่เชื่อถือได้จะนำไปใช้กับพาธเป้าหมายที่แก้ค่าแล้ว
- สภาพแวดล้อมของโปรเซสลูก `exec` จะมีค่าน้อยที่สุดโดยค่าเริ่มต้น; ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูกแก้ค่าในเวลาเปิดใช้งานเป็นสแนปชอตในหน่วยความจำ จากนั้นพาธคำขอจะอ่านเฉพาะสแนปชอตเท่านั้น
- การกรองพื้นผิวที่ใช้งานจะเกิดขึ้นระหว่างการเปิดใช้งาน: การอ้างอิงที่แก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้การเริ่มต้น/โหลดซ้ำล้มเหลว ขณะที่พื้นผิวที่ไม่ใช้งานจะถูกข้ามพร้อมข้อมูลวินิจฉัย

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

- โปรไฟล์ต่อเอเจนต์จะถูกจัดเก็บที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบแบนรุ่นเก่า เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบรันไทม์; `openclaw doctor --fix` เขียนใหม่เป็นโปรไฟล์ API-key มาตรฐาน `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่มี SecretRef เป็นฐาน
- ข้อมูลรับรองรันไทม์แบบคงที่มาจากสแนปชอตที่แก้ค่าแล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่รุ่นเก่าจะถูกล้างเมื่อพบ
- การนำเข้า OAuth รุ่นเก่ามาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมรันไทม์ของความลับและเครื่องมือ `audit/configure/apply`: [การจัดการความลับ](/th/gateway/secrets)

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

- `billingBackoffHours`: ระยะเวลาถอยกลับพื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวเนื่องจากข้อผิดพลาดด้านการเรียกเก็บเงินจริง
  หรือเครดิตไม่เพียงพอ (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนยังสามารถ
  มาที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการ
  ยังคงจำกัดขอบเขตไว้ที่ผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter
  `Key limit exceeded`) ข้อความ HTTP `402` ที่ลองใหม่ได้สำหรับหน้าต่างการใช้งานหรือ
  ขีดจำกัดค่าใช้จ่ายขององค์กร/พื้นที่ทำงานยังคงอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: การแทนที่ต่อผู้ให้บริการแบบไม่บังคับสำหรับชั่วโมงระยะเวลาถอยกลับด้านการเรียกเก็บเงิน
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โพเนนเชียลของระยะเวลาถอยกลับด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ระยะเวลาถอยกลับพื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของระยะเวลาถอยกลับ `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับระยะเวลาถอยกลับ (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการสลับโปรไฟล์ยืนยันตัวตนในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดโหลดเกิน ก่อนสลับไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) รูปแบบผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะมาที่นี่
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อนลองสลับผู้ให้บริการ/โปรไฟล์ที่โหลดเกินอีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการสลับโปรไฟล์ยืนยันตัวตนในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดขีดจำกัดอัตรา ก่อนสลับไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) บัคเก็ตขีดจำกัดอัตรานั้นรวมข้อความรูปแบบผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- `consoleLevel` เพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดสูงสุดของไฟล์ล็อกที่ใช้งานอยู่เป็นไบต์ก่อนหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขไว้สูงสุดห้าไฟล์ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบพยายามอย่างดีที่สุดสำหรับเอาต์พุตคอนโซล, ไฟล์ล็อก, ระเบียนล็อก OTLP และข้อความทรานสคริปต์เซสชันที่บันทึกไว้ `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบายล็อก/ทรานสคริปต์ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปกปิดความลับก่อนปล่อยข้อมูลออก

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตล็อกแบบเจาะจง (รองรับไวลด์การ์ดอย่าง `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็นมิลลิวินาทีสำหรับจัดประเภทเซสชันประมวลผลที่รันนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ เครื่องมือ สถานะ บล็อก และความคืบหน้า ACP รีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะถอยกลับเมื่อยังไม่เปลี่ยนแปลง
- `otel.enabled`: เปิดใช้ไปป์ไลน์ส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าครบถ้วน แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ตัวรวบรวมสำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: เอ็นด์พอยต์ OTLP เฉพาะสัญญาณแบบไม่บังคับ เมื่อตั้งค่าแล้ว จะเขียนทับ `otel.endpoint` เฉพาะสัญญาณนั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: เฮดเดอร์เมทาดาทา HTTP/gRPC เพิ่มเติมที่ส่งไปกับคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออกเทรซ เมตริก หรือล็อก
- `otel.sampleRate`: อัตราการสุ่มตัวอย่างเทรซ `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลาฟลัชเทเลเมทรีตามรอบเป็นมิลลิวินาที
- `otel.captureContent`: เลือกรับการจับเนื้อหาดิบสำหรับแอตทริบิวต์สแปน OTEL ค่าเริ่มต้นคือปิด บูลีน `true` จับเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบออบเจ็กต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ผู้ให้บริการสแปน GenAI รุ่นทดลองล่าสุด โดยค่าเริ่มต้น สแปนจะเก็บแอตทริบิวต์ `gen_ai.system` รุ่นเดิมไว้เพื่อความเข้ากันได้; เมตริก GenAI ใช้แอตทริบิวต์เชิงความหมายที่มีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะที่ยังคงให้ตัวฟังการวินิจฉัยทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อมเอ็นด์พอยต์เฉพาะสัญญาณที่ใช้เมื่อยังไม่ได้ตั้งค่าคีย์การกำหนดค่าที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปชอตเทรซแคชสำหรับการรันแบบฝังตัว (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ JSONL เทรซแคช (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุตเทรซแคช (ทั้งหมดมีค่าเริ่มต้น: `true`)

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

- `channel`: ช่องทางการเผยแพร่สำหรับการติดตั้ง npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: หน่วงเวลาขั้นต่ำเป็นชั่วโมงก่อนนำอัตโนมัติไปใช้ในช่องทางเสถียร (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการเปิดตัวเพิ่มเติมสำหรับช่องทางเสถียรเป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ในการรันการตรวจสอบช่องทางเบต้าเป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

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

- `enabled`: เกตฟีเจอร์ ACP ส่วนกลาง (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อน ACP dispatch และตัวเลือก spawn)
- `dispatch.enabled`: เกตอิสระสำหรับ ACP session turn dispatch (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งาน แต่บล็อกการดำเนินการ
- `backend`: id แบ็กเอนด์รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin แบ็กเอนด์ก่อน และหากตั้งค่า `plugins.allow` ให้รวม id ของ Plugin แบ็กเอนด์ (เช่น `acpx`) ไม่เช่นนั้นแบ็กเอนด์ ACP จะไม่โหลด
- `defaultAgent`: id เอเจนต์เป้าหมาย ACP สำรองเมื่อ spawn ไม่ได้ระบุเป้าหมายที่ชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชันรันไทม์ ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ใช้งานพร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่างฟลัชเมื่อว่างเป็นมิลลิวินาทีสำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาดชังก์สูงสุดก่อนแยกการฉายบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์สิ้นสุดเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตผู้ช่วยสูงสุดที่ฉายต่อเทิร์น ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉาย
- `stream.tagVisibility`: ระเบียนชื่อแท็กไปยังการแทนที่การมองเห็นแบบบูลีนสำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: TTL เมื่อว่างเป็นนาทีสำหรับเวิร์กเกอร์เซสชัน ACP ก่อนมีสิทธิ์ล้างข้อมูล
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

- `cli.banner.taglineMode` ควบคุมรูปแบบแท็กไลน์ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): แท็กไลน์ตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: แท็กไลน์กลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความแท็กไลน์ (ยังแสดงชื่อ/เวอร์ชันแบนเนอร์)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่แท็กไลน์) ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

---

## วิซาร์ด

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

ดูฟิลด์ข้อมูลประจำตัว `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## บริดจ์ (รุ่นเดิม, ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่มีบริดจ์ TCP อีกต่อไป โหนดเชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมาการกำหนดค่าอีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="การกำหนดค่าบริดจ์รุ่นเดิม (ข้อมูลอ้างอิงทางประวัติ)">

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

- `sessionRetention`: ระยะเวลาที่เก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์ก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้างข้อมูลทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวรแล้ว ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ล็อกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดออก ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดใหม่สุดที่เก็บไว้เมื่อการตัดล็อกการรันถูกทริกเกอร์ ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเค็น bearer ที่ใช้สำหรับการส่ง Cron Webhook POST (`delivery.mode = "webhook"`) หากละไว้จะไม่ส่งเฮดเดอร์ยืนยันตัวตน
- `webhook`: URL Webhook สำรองรุ่นเดิมที่เลิกใช้แล้ว (http/https) ใช้เฉพาะสำหรับงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`

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
- `backoffMs`: อาร์เรย์ของระยะเวลาหน่วงแบบ backoff เป็นมิลลิวินาทีสำหรับการลองใหม่แต่ละครั้ง (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองใหม่ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ไม่ต้องระบุเพื่อลองใหม่กับประเภทชั่วคราวทั้งหมด

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
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ค่าต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับรอบการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) รอบการรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดการดำเนินการ
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือ id ช่องทางที่ไม่บังคับ เพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบ announce `"last"` ใช้ช่องทางการส่งล่าสุดที่ทราบซ้ำ
- `to`: เป้าหมาย announce หรือ URL ของ Webhook แบบระบุชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` รายงานต่องานจะแทนที่ค่าเริ่มต้นระดับสากลนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งระดับสากลและรายงานต่องาน งานที่ส่งผ่าน `announce` อยู่แล้วจะถอยกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- รองรับ `delivery.failureDestination` เฉพาะสำหรับงาน `sessionTarget="isolated"` เว้นแต่ว่า `delivery.mode` หลักของงานเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

placeholder ของเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี wrapper ประวัติ/ผู้ส่ง)         |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | id ข้อความช่องทาง                                |
| `{{SessionId}}`    | UUID ของ session ปัจจุบัน                        |
| `{{IsNewSession}}` | `"true"` เมื่อสร้าง session ใหม่                 |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                         |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                 |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)              |
| `{{Transcript}}`   | ข้อความถอดเสียง                                  |
| `{{Prompt}}`       | prompt สื่อที่ resolve แล้วสำหรับรายการ CLI      |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่ resolve แล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                        |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                  |
| `{{GroupMembers}}` | ตัวอย่างรายชื่อสมาชิกกลุ่ม (พยายามให้ดีที่สุด)   |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)         |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)     |
| `{{Provider}}`     | คำใบ้ Provider (whatsapp, telegram, discord, ฯลฯ) |

---

## การ include ค่า config (`$include`)

แยก config ออกเป็นหลายไฟล์:

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

**พฤติกรรมการ merge:**

- ไฟล์เดียว: แทนที่ object ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (ไฟล์หลังแทนที่ไฟล์ก่อน)
- key ระดับเดียวกัน: merge หลัง include (แทนที่ค่าที่ include มา)
- include แบบซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve แบบสัมพัทธ์กับไฟล์ที่ include แต่ต้องยังอยู่ภายในไดเรกทอรี config ระดับบนสุด (`dirname` ของ `openclaw.json`) อนุญาตรูปแบบ absolute/`../` เฉพาะเมื่อยัง resolve อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะ section ระดับบนสุดหนึ่งรายการที่หนุนด้วย single-file include จะเขียนทะลุไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- root include, include array และ include ที่มี sibling override เป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนที่จะ flatten config
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดการ parse และ include แบบวนรอบ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
