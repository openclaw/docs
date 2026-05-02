---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่ถูกต้องแม่นยำ
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงระบบย่อยเฉพาะ
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-02T20:43:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559a52c9ea7428aa0a33b9699eaf144aa114638acf57f813217642319ce77987
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการกำหนดค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบเน้นงาน ดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการกำหนดค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงตัวเลือกเชิงลึกของหน่วยความจำ/QMD อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งอ้างอิงจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ UI ควบคุม พร้อมผสานเมทาดาตาของบันเดิล/Plugin/ช่องทางเข้าไปเมื่อพร้อมใช้งาน
- `config.schema.lookup` ส่งคืนโหนดสคีมาหนึ่งรายการที่จำกัดตามพาธสำหรับเครื่องมือเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮชฐานของเอกสารการกำหนดค่ากับพื้นผิวสคีมาปัจจุบัน

พาธการค้นหาเอเจนต์: ใช้การกระทำเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบเน้นงาน และใช้หน้านี้
สำหรับแผนที่ฟิลด์ที่กว้างกว่า ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะ:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการกำหนดค่า dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่งสแลช](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งในตัว + คำสั่งที่บันเดิลไว้ในปัจจุบัน
- หน้าของช่องทาง/Plugin เจ้าของ สำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบการกำหนดค่าคือ **JSON5** (อนุญาตให้มีคอมเมนต์ + จุลภาคท้ายรายการ) ฟิลด์ทั้งหมดเป็นแบบไม่บังคับ — OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## ช่องทาง

คีย์การกำหนดค่าต่อช่องทางย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางอื่น ๆ
ที่บันเดิลไว้ (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การควบคุมการกล่าวถึง)

## ค่าเริ่มต้นของเอเจนต์, หลายเอเจนต์, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (พื้นที่ทำงาน, โมเดล, การคิด, Heartbeat, หน่วยความจำ, สื่อ, Skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกหลายเอเจนต์)
- `session.*` (วงจรชีวิตเซสชัน, Compaction, การตัดแต่ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์มาร์กดาวน์)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: รหัสโลเคล BCP 47 แบบไม่บังคับสำหรับการรู้จำเสียงพูด Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดพักค่าเริ่มต้นของแพลตฟอร์มไว้ก่อนส่งทรานสคริปต์ (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและผู้ให้บริการกำหนดเอง

นโยบายเครื่องมือ สวิตช์ทดลอง การกำหนดค่าเครื่องมือที่มีผู้ให้บริการหนุนหลัง และการตั้งค่า
ผู้ให้บริการกำหนดเอง / URL ฐาน ย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — เครื่องมือและผู้ให้บริการกำหนดเอง](/th/gateway/config-tools)

## โมเดล

นิยามผู้ให้บริการ รายการอนุญาตของโมเดล และการตั้งค่าผู้ให้บริการกำหนดเองอยู่ใน
[การกำหนดค่า — เครื่องมือและผู้ให้บริการกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
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
- `models.providers`: แมปผู้ให้บริการกำหนดเองที่ใช้รหัสผู้ให้บริการเป็นคีย์
- `models.pricing.enabled`: ควบคุมการบูตสแตรปราคาพื้นหลังที่
  เริ่มหลังจากไซด์คาร์และช่องทางเข้าสู่พาธพร้อมใช้งานของ Gateway เมื่อ `false`
  Gateway จะข้ามการดึงแค็ตตาล็อกราคาของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังใช้ได้กับการประมาณต้นทุนในเครื่อง

## MCP

นิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้โดย Pi แบบฝังและอะแดปเตอร์รันไทม์อื่น ๆ คำสั่ง `openclaw mcp list`,
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

- `mcp.servers`: นิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือระยะไกลที่ตั้งชื่อไว้ สำหรับรันไทม์ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการระยะไกลใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็นนามแฝงแบบเนทีฟของ CLI ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` ปรับให้เป็นฟิลด์ `transport` ตามรูปแบบมาตรฐาน
- `mcp.sessionIdleTtlMs`: TTL เมื่อไม่ได้ใช้งานสำหรับรันไทม์ MCP ที่บันเดิลไว้และจำกัดตามเซสชัน
  การรันแบบฝังครั้งเดียวร้องขอการล้างข้อมูลเมื่อจบรัน; TTL นี้เป็นกลไกสำรองสำหรับ
  เซสชันที่มีอายุยาวและผู้เรียกในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` มีผลแบบ hot-apply โดยทิ้งรันไทม์ MCP ของเซสชันที่แคชไว้
  การค้นพบ/ใช้งานเครื่องมือครั้งถัดไปจะสร้างใหม่จากการกำหนดค่าใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ TTL เมื่อไม่ได้ใช้งาน

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

- `allowBundled`: รายการอนุญาตแบบไม่บังคับสำหรับ Skills ที่บันเดิลไว้เท่านั้น (Skills ที่จัดการ/อยู่ในพื้นที่ทำงานไม่ได้รับผลกระทบ)
- `load.extraDirs`: ราก Skills ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อ `brew`
  พร้อมใช้งาน ก่อนถอยไปใช้ชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ค่ากำหนดตัวติดตั้ง node สำหรับสเปก `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้ว่าจะบันเดิล/ติดตั้งไว้แล้วก็ตาม
- `entries.<skillKey>.apiKey`: ตัวช่วยสำหรับ Skills ที่ประกาศตัวแปรสภาพแวดล้อมหลัก (สตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef)

---

## Plugin

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

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` และ `plugins.load.paths`
- การค้นพบรองรับ Plugin เนทีฟของ OpenClaw รวมถึงบันเดิล Codex และบันเดิล Claude ที่เข้ากันได้ รวมถึงบันเดิลเลย์เอาต์ค่าเริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการกำหนดค่าต้องรีสตาร์ต gateway**
- `allow`: รายการอนุญาตแบบไม่บังคับ (โหลดเฉพาะ Plugin ที่ระบุ) `deny` มีสิทธิ์เหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์ตัวช่วยคีย์ API ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แมปตัวแปรสภาพแวดล้อมที่จำกัดขอบเขตตาม Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` แกนหลักจะบล็อก `before_prompt_build` และเพิกเฉยต่อฟิลด์ที่แก้ไขพรอมป์จาก `before_agent_start` แบบเดิม ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบเดิมไว้ ใช้กับฮุก Plugin เนทีฟและไดเรกทอรีฮุกที่บันเดิลจัดเตรียมให้ซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่ไม่ใช่บันเดิลและเชื่อถือได้อาจอ่านเนื้อหาการสนทนาดิบจากฮุกแบบมีชนิด เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอการแทนที่ `provider` และ `model` ต่อการรันสำหรับการรัน subagent พื้นหลัง
- `plugins.entries.<id>.subagent.allowedModels`: รายการอนุญาตแบบไม่บังคับของเป้าหมาย `provider/model` ตามรูปแบบมาตรฐานสำหรับการแทนที่ subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.config`: ออบเจ็กต์การกำหนดค่าที่ Plugin นิยาม (ตรวจสอบความถูกต้องโดยสคีมา Plugin เนทีฟของ OpenClaw เมื่อพร้อมใช้งาน)
- การตั้งค่าบัญชี/รันไทม์ของ Plugin ช่องทางอยู่ภายใต้ `channels.<id>` และควรอธิบายโดยเมทาดาตา `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดยรีจิสทรีตัวเลือกกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการดึงเว็บ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl (รับ SecretRef) ถอยไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเดิม หรือ ตัวแปรสภาพแวดล้อม `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ Firecrawl API (ค่าเริ่มต้น: `https://api.firecrawl.dev`; การแทนที่แบบโฮสต์เองต้องชี้ไปยังเอนด์พอยต์ส่วนตัว/ภายใน)
  - `onlyMainContent`: แยกเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: หมดเวลาคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นหาเว็บ Grok)
  - `enabled`: เปิดใช้งานผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่จะใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและเกณฑ์
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ cron สำหรับการ sweep dreaming แบบเต็มแต่ละครั้ง (`"0 3 * * *"` เป็นค่าเริ่มต้น)
  - `model`: การแทนที่โมเดล subagent Dream Diary แบบไม่บังคับ ต้องใช้ `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะลองซ้ำหนึ่งครั้งด้วยโมเดลค่าเริ่มต้นของเซสชัน; ความล้มเหลวด้านความเชื่อถือหรือรายการอนุญาตจะไม่ถอยกลับแบบเงียบ
  - นโยบายเฟสและเกณฑ์เป็นรายละเอียดการใช้งานจริง (ไม่ใช่คีย์การกำหนดค่าที่ผู้ใช้เห็น)
- การกำหนดค่าหน่วยความจำฉบับเต็มอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้งานแล้วยังสามารถเพิ่มค่าเริ่มต้นของ Pi แบบฝังจาก `settings.json`; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่าเอเจนต์ที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่เป็นแพตช์การกำหนดค่า OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือกรหัส Plugin หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้งาน Plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือกรหัส Plugin เครื่องมือบริบทที่ใช้งานอยู่; ค่าเริ่มต้นคือ `"legacy"` เว้นแต่คุณติดตั้งและเลือกเครื่องมืออื่น

ดู [Plugin](/th/tools/plugin)

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
- `tabCleanup` เรียกคืนแท็บของเอเจนต์หลักที่ถูกติดตามหลังจากเวลาว่าง หรือเมื่อ
  เซสชันเกินขีดจำกัดของตัวเอง ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมดการล้างข้อมูลแต่ละโหมดเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางเบราว์เซอร์จึงเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางเบราว์เซอร์ผ่านเครือข่ายส่วนตัว
- ในโหมดเข้มงวด เอนด์พอยต์โปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) อยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะนามแฝงเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นแบบชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ loopback ที่จัดการแล้ว
  ยังคงใช้ค่าเริ่มต้น CDP ภายในเครื่อง
- หากบริการ CDP ที่จัดการภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ที่จัดการภายในเครื่อง และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตภายในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อเจาะจง
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การดำเนินการที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS selector, hooks อัปโหลดหนึ่งไฟล์,
  ไม่มีการแทนที่เวลาหมดอายุของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการดำเนินการแบบชุด
- โปรไฟล์ `openclaw` ที่จัดการภายในเครื่องกำหนด `cdpPort` และ `cdpUrl` โดยอัตโนมัติ; ให้
  ตั้งค่า `cdpUrl` อย่างชัดเจนสำหรับ CDP ระยะไกลเท่านั้น
- โปรไฟล์ที่จัดการภายในเครื่องสามารถตั้งค่า `executablePath` เพื่อแทนที่ค่า
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์ใน Brave
- โปรไฟล์ที่จัดการภายในเครื่องใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังเริ่มกระบวนการ และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดตัว เพิ่มค่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ค่าทั้งสองต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ต่างก็
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรีโฮมของ OS ของคุณก่อนเปิด Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` ก็จะถูกขยาย tilde ด้วย
- บริการควบคุม: loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดเพิ่มเติมให้กับการเริ่มต้น Chromium ภายในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือแฟล็กดีบัก)

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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (โทนสีฟอง Talk Mode เป็นต้น)
- `assistant`: การแทนที่ตัวตน Control UI ย้อนกลับไปใช้ตัวตนเอเจนต์ที่ใช้งานอยู่

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

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`
- `port`: พอร์ตมัลติเพล็กซ์เดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`
- **alias bind แบบดั้งเดิม**: ใช้ค่าของโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่ alias ของโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะเข้ามาที่ `eth0` ทำให้เข้าถึง Gateway ไม่ได้ ใช้ `--network host` หรือตั้ง `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นตามค่าเริ่มต้น การ bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ Gateway ในทางปฏิบัติ หมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ดเริ่มต้นใช้งานจะสร้างโทเค็นตามค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้ง `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โฟลว์การเริ่มต้นและการติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งคู่และไม่ได้ตั้งค่าโหมด
- `gateway.auth.mode: "none"`: โหมดไม่ใช้การยืนยันตัวตนแบบระบุชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; ตัวเลือกนี้จงใจไม่เสนอในพรอมป์เริ่มต้นใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้กับ reverse proxy ที่รับรู้ตัวตน และเชื่อถือเฮดเดอร์ข้อมูลประจำตัวจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งที่มาของพร็อกซีที่ **ไม่ใช่ loopback** ตามค่าเริ่มต้น; reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback ภายในโดยตรงได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` เฮดเดอร์ข้อมูลประจำตัวของ Tailscale Serve สามารถใช้ยืนยันตัวตนของ UI ควบคุม/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) ปลายทาง HTTP API **ไม่** ใช้การยืนยันตัวตนจากเฮดเดอร์ Tailscale นี้; แต่จะใช้โหมดการยืนยันตัวตน HTTP ปกติของ Gateway แทน โฟลว์แบบไม่ใช้โทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนที่ล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (ติดตาม shared-secret และ device-token แยกกัน) ความพยายามที่ถูกบล็อกจะคืนค่า `429` + `Retry-After`
  - บนพาธ UI ควบคุมของ Tailscale Serve แบบอะซิงโครนัส ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนค่าความล้มเหลว ดังนั้นความพยายามผิดพลาดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานในคำขอที่สอง แทนที่ทั้งสองคำขอจะแข่งกันผ่านไปเป็นเพียงการไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีที่เข้มงวด)
- ความพยายามยืนยันตัวตน WS ที่มาจาก origin ของเบราว์เซอร์จะถูกจำกัดอัตราเสมอโดยปิดการยกเว้น loopback (การป้องกันหลายชั้นต่อการ brute force localhost ผ่านเบราว์เซอร์)
- บน loopback การล็อกเอาต์ที่มาจาก origin ของเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ทำให้เป็นมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจาก origin หนึ่งบน localhost จะไม่
  ล็อกเอาต์ origin อื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้การยืนยันตัวตน)
- `controlUi.allowedOrigins`: รายการอนุญาต origin ของเบราว์เซอร์แบบระบุชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จาก origin ที่ไม่ใช่ loopback
- `controlUi.chatMessageMaxWidth`: max-width แบบไม่บังคับสำหรับข้อความแชต UI ควบคุมที่จัดกลุ่ม รองรับค่าความกว้าง CSS ที่มีขอบเขต เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback origin จากเฮดเดอร์ Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบาย origin จากเฮดเดอร์ Host
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override สำหรับกรณีฉุกเฉินในสภาพแวดล้อมโปรเซสฝั่งไคลเอนต์
  ที่อนุญาต `ws://` แบบข้อความล้วนไปยัง IP เครือข่ายส่วนตัว
  ที่เชื่อถือได้; ค่าเริ่มต้นยังคงอนุญาตข้อความล้วนเฉพาะ loopback เท่านั้น ไม่มีรายการเทียบเท่าใน `openclaw.json`
  และการตั้งค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่มีผลต่อไคลเอนต์
  WebSocket ของ Gateway
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ Gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL ฐาน HTTPS สำหรับ relay APNs ภายนอกที่บิลด์ iOS อย่างเป็นทางการ/TestFlight ใช้หลังจากเผยแพร่การลงทะเบียนที่มี relay รองรับไปยัง Gateway URL นี้ต้องตรงกับ URL relay ที่คอมไพล์ไว้ในบิลด์ iOS
- `gateway.push.apns.relay.timeoutMs`: ระยะหมดเวลาการส่งจาก Gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`
- การลงทะเบียนที่มี relay รองรับจะถูกมอบหมายให้กับข้อมูลประจำตัว Gateway ที่ระบุ แอป iOS ที่จับคู่จะดึง `gateway.identity.get` รวมข้อมูลประจำตัวนั้นในการลงทะเบียน relay และส่งต่อสิทธิ์ส่งที่มีขอบเขตตามการลงทะเบียนไปยัง Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้นั้นกลับมาใช้ได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: ค่า override ตัวแปรสภาพแวดล้อมชั่วคราวสำหรับการตั้งค่า relay ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL relay HTTP แบบ loopback URL relay สำหรับโปรดักชันควรอยู่บน HTTPS
- `gateway.handshakeTimeoutMs`: ระยะหมดเวลาของการ handshake WebSocket ของ Gateway ก่อนการยืนยันตัวตน เป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ภายในสามารถเชื่อมต่อได้ขณะที่การวอร์มอัปช่วงเริ่มต้นยังไม่เสร็จนิ่ง
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสอบสุขภาพช่องทางเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ตโดยตัวตรวจสอบสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ซ็อกเก็ตค้างเป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนการรีสตาร์ตสูงสุดโดยตัวตรวจสอบสุขภาพต่อช่องทาง/บัญชีในช่วงหนึ่งชั่วโมงแบบเลื่อน ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การเลือกไม่ใช้การรีสตาร์ตโดยตัวตรวจสอบสุขภาพต่อช่องทาง โดยยังคงเปิดตัวตรวจสอบทั่วทั้งระบบไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override ต่อบัญชีสำหรับช่องทางหลายบัญชี เมื่อตั้งค่าไว้ จะมีลำดับความสำคัญเหนือ override ระดับช่องทาง
- พาธการเรียก Gateway ภายในสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิดกั้น (ไม่มี fallback ระยะไกลมาปกปิด)
- `trustedProxies`: IP ของ reverse proxy ที่สิ้นสุด TLS หรือแทรกเฮดเดอร์ไคลเอนต์ที่ส่งต่อ ระบุเฉพาะพร็อกซีที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าพร็อกซี/การตรวจจับภายในบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ภายใน) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นคือ `false` เพื่อพฤติกรรม fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: รายการอนุญาต CIDR/IP แบบไม่บังคับสำหรับอนุมัติการจับคู่อุปกรณ์ Node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีขอบเขตที่ร้องขอ ค่านี้จะปิดใช้งานเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ของผู้ปฏิบัติการ/เบราว์เซอร์/UI ควบคุม/เว็บแชตโดยอัตโนมัติ และไม่อนุมัติ role, scope, metadata หรือการอัปเกรดคีย์สาธารณะโดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนดรูปแบบอนุญาต/ปฏิเสธระดับโกลบอลสำหรับคำสั่ง Node ที่ประกาศไว้หลังการจับคู่และหลังประเมินรายการอนุญาตของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกเปิดใช้คำสั่ง Node อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออก แม้ว่าค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตแบบระบุชัดเจนจะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก Node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ Gateway จัดเก็บสแนปช็อตคำสั่งที่อัปเดตแล้ว
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการปฏิเสธค่าเริ่มต้น)
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการปฏิเสธ HTTP ค่าเริ่มต้น

</Accordion>

### ปลายทางที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานตามค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความปลอดภัยอินพุต URL ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    รายการอนุญาตที่ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- เฮดเดอร์เสริมความปลอดภัยของการตอบกลับแบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งเฉพาะสำหรับ origin HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ Gateway หลายตัวบนโฮสต์เดียวด้วยพอร์ตและไดเรกทอรีสถานะที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

ดู [Gateway หลายตัว](/th/gateway/multiple-gateways)

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

- `enabled`: เปิดใช้การสิ้นสุด TLS ที่ listener ของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ภายในโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์อย่างชัดเจน; สำหรับการใช้งานภายใน/พัฒนาเท่านั้น
- `certPath`: พาธระบบไฟล์ไปยังไฟล์ใบรับรอง TLS
- `keyPath`: พาธระบบไฟล์ไปยังไฟล์คีย์ส่วนตัว TLS; จำกัดสิทธิ์การเข้าถึงไว้
- `caPath`: พาธ bundle CA แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ trust chain แบบกำหนดเอง

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

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ใน runtime
  - `"off"`: ละเว้นการแก้ไขสด; การเปลี่ยนแปลงต้องรีสตาร์ตอย่างชัดเจน
  - `"restart"`: รีสตาร์ตโปรเซส Gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ในโปรเซสโดยไม่รีสตาร์ต
  - `"hybrid"` (ค่าเริ่มต้น): ลองโหลดใหม่แบบ hot ก่อน; fallback เป็นการรีสตาร์ตหากจำเป็น
- `debounceMs`: หน่วงเวลา debounce เป็นมิลลิวินาทีก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็นมิลลิวินาทีที่จะรอการดำเนินการที่กำลังทำงานก่อนบังคับรีสตาร์ต ละไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรอไม่มีกำหนดและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

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

การรับรองความถูกต้อง: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`.
โทเค็นฮุกในสตริงคำค้นหาจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` เป็น `/` ไม่ได้; ใช้เส้นทางย่อยเฉพาะ เช่น `/hooks`
- ถ้า `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- ถ้าการแมปหรือพรีเซ็ตใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องใช้การเลือกเปิดนี้

**ปลายทาง:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะถูกรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ค่าโดยผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่เส้นทางย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์เพย์โหลดสำหรับเส้นทางทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่าการกระทำของฮุกได้
  - `transform.module` ต้องเป็นเส้นทางสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (เส้นทางแบบสัมบูรณ์และการไต่เส้นทางจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของเวิร์กสเปซจะถูกปฏิเสธ ถ้า `openclaw doctor` รายงานว่าเส้นทางนี้ไม่ถูกต้อง ให้ย้ายโมดูลทรานส์ฟอร์มไปยังไดเรกทอรีทรานส์ฟอร์มของฮุก หรือลบ `hooks.transformsDir`
- `agentId` กำหนดเส้นทางไปยังเอเจนต์เฉพาะ; ID ที่ไม่รู้จักจะย้อนกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบชัดเจน (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่แบบไม่บังคับสำหรับการรันเอเจนต์ฮุกที่ไม่มี `sessionKey` แบบชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันของการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาตคำนำหน้าแบบไม่บังคับสำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อบังคับเมื่อการแมปหรือพรีเซ็ตใด ๆ ใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; ค่าเริ่มต้นของ `channel` คือ `last`
- `model` แทนที่ LLM สำหรับการรันฮุกนี้ (ต้องได้รับอนุญาตถ้าตั้งค่าแคตตาล็อกโมเดลไว้)

</Accordion>

### การผสานรวม Gmail

- พรีเซ็ต Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- ถ้าคุณคงการกำหนดเส้นทางรายข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับเนมสเปซ Gmail เช่น `["hook:", "hook:gmail:"]`
- ถ้าคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้แทนที่พรีเซ็ตด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- Gateway เริ่ม `gog gmail watch serve` อัตโนมัติเมื่อบูตหากมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
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

- ให้บริการ HTML/CSS/JS ที่เอเจนต์แก้ไขได้และ A2UI ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ local loopback: เส้นทาง canvas ต้องใช้การรับรองความถูกต้องของ Gateway (โทเค็น/รหัสผ่าน/พร็อกซีที่เชื่อถือ) เหมือนพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews ไม่ส่งส่วนหัวการรับรองความถูกต้อง; หลังจากจับคู่และเชื่อมต่อโหนดแล้ว Gateway จะประกาศ URL ความสามารถที่อยู่ในขอบเขตโหนดสำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับเซสชัน WS ของโหนดที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ทางเลือกสำรองตาม IP
- ฉีดไคลเอนต์โหลดซ้ำสดเข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่าง
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต Gateway
- ปิดใช้งานการโหลดซ้ำสดสำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

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
- ค่าเริ่มต้นของชื่อโฮสต์คือชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง มิฉะนั้นจะย้อนกลับไปใช้ `openclaw` แทนที่ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบยูนิแคสต์ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

ตั้งค่า: `openclaw dns setup --apply`

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

- ตัวแปร env แบบอินไลน์จะถูกใช้เฉพาะเมื่อ env ของกระบวนการไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งคู่ไม่แทนที่ตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดหวังซึ่งหายไปจากโปรไฟล์เชลล์ล็อกอินของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนที่ตัวแปร Env

อ้างอิงตัวแปร env ในสตริงการกำหนดค่าใด ๆ ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไป/ว่างจะทำให้เกิดข้อผิดพลาดเมื่อโหลดการกำหนดค่า
- เอสเคปด้วย `$${VAR}` สำหรับ `${VAR}` แบบลิเทอรัล
- ใช้ได้กับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มได้: ค่าข้อความธรรมดายังคงใช้ได้

### `SecretRef`

ใช้รูปร่างออบเจ็กต์หนึ่งแบบ:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: ตัวชี้ JSON แบบสัมบูรณ์ (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มีเซกเมนต์เส้นทางที่คั่นด้วยสแลชเป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลประจำตัวที่รองรับ

- เมทริกซ์บัญญัติ: [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
- เป้าหมาย `secrets apply` รองรับเส้นทางข้อมูลประจำตัวของ `openclaw.json`
- การอ้างอิง `auth-profiles.json` รวมอยู่ในการแก้ค่ารันไทม์และความครอบคลุมการตรวจสอบ

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
- เส้นทางของผู้ให้บริการ file และ exec จะล้มเหลวแบบปิดเมื่อการตรวจสอบ Windows ACL ไม่พร้อมใช้งาน ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับเส้นทางที่เชื่อถือซึ่งตรวจสอบไม่ได้
- ผู้ให้บริการ `exec` ต้องใช้เส้นทาง `command` แบบสัมบูรณ์และใช้เพย์โหลดโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น เส้นทางคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตเส้นทาง symlink พร้อมตรวจสอบเส้นทางเป้าหมายที่แก้ค่าแล้ว
- ถ้ากำหนดค่า `trustedDirs` ไว้ การตรวจสอบไดเรกทอรีที่เชื่อถือจะใช้กับเส้นทางเป้าหมายที่แก้ค่าแล้ว
- สภาพแวดล้อมลูกของ `exec` เป็นแบบขั้นต่ำโดยค่าเริ่มต้น; ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูกแก้ค่า ณ เวลาเปิดใช้งานเป็นสแนปช็อตในหน่วยความจำ จากนั้นเส้นทางคำขอจะอ่านเฉพาะสแนปช็อต
- การกรองพื้นผิวที่ใช้งานอยู่จะใช้ระหว่างการเปิดใช้งาน: การอ้างอิงที่แก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้การเริ่มต้น/โหลดซ้ำล้มเหลว ขณะที่พื้นผิวที่ไม่ใช้งานจะถูกข้ามพร้อมการวินิจฉัย

---

## ที่เก็บการรับรองความถูกต้อง

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
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลประจำตัวแบบคงที่
- การแมป `auth-profiles.json` แบบแฟลตดั้งเดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบรันไทม์; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์คีย์ API แบบบัญญัติ `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลประจำตัว auth-profile ที่หนุนด้วย SecretRef
- ข้อมูลประจำตัวรันไทม์แบบคงที่มาจากสแนปช็อตที่แก้ค่าแล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่ดั้งเดิมจะถูกล้างเมื่อพบ
- การนำเข้า OAuth ดั้งเดิมมาจาก `~/.openclaw/credentials/oauth.json`
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

- `billingBackoffHours`: ระยะหน่วงถอยกลับพื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาดด้านการเรียกเก็บเงิน/เครดิตไม่เพียงพอจริง (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนอาจยังเข้ามาที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดขอบเขตอยู่กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` ที่ลองใหม่ได้เกี่ยวกับช่วงเวลาการใช้งานหรือขีดจำกัดการใช้จ่ายขององค์กร/พื้นที่ทำงานจะอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: การแทนที่ระยะหน่วงถอยกลับด้านการเรียกเก็บเงินเป็นชั่วโมงแบบรายผู้ให้บริการ ซึ่งไม่บังคับ
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โปเนนเชียลของระยะหน่วงถอยกลับด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ระยะหน่วงถอยกลับพื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของระยะหน่วงถอยกลับ `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับระยะหน่วงถอยกลับ (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดโหลดเกิน ก่อนสลับไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) รูปแบบผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อนลองการหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่โหลดเกินอีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดขีดจำกัดอัตรา ก่อนสลับไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) บัคเก็ตขีดจำกัดอัตรานี้รวมข้อความที่มีรูปแบบของผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- ตั้งค่า `logging.file` เพื่อใช้เส้นทางคงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดสูงสุดของไฟล์ล็อกที่ใช้งานอยู่เป็นไบต์ก่อนหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขไว้สูงสุดห้าไฟล์ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปกปิดแบบพยายามอย่างดีที่สุดสำหรับเอาต์พุตคอนโซล ล็อกไฟล์ ระเบียนล็อก OTLP และข้อความ transcript ของเซสชันที่บันทึกไว้ `redactSensitive: "off"` จะปิดใช้งานเฉพาะนโยบายล็อก/transcript ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยจะยังปกปิดความลับก่อนปล่อยออก

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

- `enabled`: สวิตช์หลักสำหรับเอาต์พุต instrumentation (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตล็อกแบบเจาะจง (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็นมิลลิวินาทีสำหรับจัดประเภทเซสชันประมวลผลที่รันนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ เครื่องมือ สถานะ บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่ซ้ำกันจะถอยกลับในขณะที่ยังไม่เปลี่ยนแปลง
- `otel.enabled`: เปิดใช้ไปป์ไลน์ส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของตัวรวบรวมสำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะสัญญาณที่ไม่บังคับ เมื่อตั้งค่าแล้ว จะเขียนทับ `otel.endpoint` สำหรับสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: เฮดเดอร์เมทาดาทา HTTP/gRPC เพิ่มเติมที่ส่งไปกับคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลาการ flush telemetry เป็นมิลลิวินาทีแบบเป็นระยะ
- `otel.captureContent`: การเลือกเปิดใช้การจับเนื้อหาดิบสำหรับแอตทริบิวต์ของ OTEL span ค่าเริ่มต้นคือปิด บูลีน `true` จะจับเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบออบเจ็กต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ผู้ให้บริการ span ของ GenAI รุ่นทดลองล่าสุด โดยค่าเริ่มต้น span จะคงแอตทริบิวต์ `gen_ai.system` แบบเก่าไว้เพื่อความเข้ากันได้; metrics ของ GenAI ใช้แอตทริบิวต์เชิงความหมายที่มีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะที่ยังคงให้ตัวรับฟังการวินิจฉัยทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อม endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปช็อต trace ของแคชสำหรับการรันแบบฝังตัว (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: เส้นทางเอาต์พุตสำหรับ JSONL ของ trace แคช (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
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

- `channel`: ช่องทางการปล่อยสำหรับการติดตั้ง npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ระยะหน่วงขั้นต่ำเป็นชั่วโมงก่อนนำไปใช้อัตโนมัติในช่องทาง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการ rollout เพิ่มเติมของช่องทาง stable เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ในการตรวจสอบช่องทาง beta เป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

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

- `enabled`: เกตฟีเจอร์ ACP ส่วนกลาง (ค่าเริ่มต้น: `true`; ตั้งค่า `false` เพื่อซ่อน dispatch ของ ACP และ affordance สำหรับการ spawn)
- `dispatch.enabled`: เกตอิสระสำหรับ dispatch เทิร์นเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อให้คำสั่ง ACP ยังคงใช้ได้ แต่บล็อกการดำเนินการ
- `backend`: id แบ็กเอนด์ runtime ACP เริ่มต้น (ต้องตรงกับ runtime Plugin ของ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin แบ็กเอนด์ก่อน และถ้าตั้งค่า `plugins.allow` ไว้ ให้รวม id ของ Plugin แบ็กเอนด์ (เช่น `acpx`) มิฉะนั้นแบ็กเอนด์ ACP จะไม่โหลด
- `defaultAgent`: id เอเจนต์เป้าหมาย ACP สำรองเมื่อการ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: รายการอนุญาตของ id เอเจนต์ที่ได้รับอนุญาตสำหรับเซสชัน runtime ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ใช้งานพร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่าง flush ขณะ idle เป็นมิลลิวินาทีสำหรับข้อความแบบสตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยกการฉายบล็อกแบบสตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` จะสตรีมแบบเพิ่มทีละส่วน; `"final_only"` จะบัฟเฟอร์จนถึงเหตุการณ์ปลายทางของเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นหลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุต assistant สูงสุดที่ฉายต่อเทิร์น ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉาย
- `stream.tagVisibility`: ระเบียนของชื่อแท็กเป็นการแทนที่การมองเห็นแบบบูลีนสำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: TTL ขณะ idle เป็นนาทีสำหรับ worker เซสชัน ACP ก่อนมีสิทธิ์ล้างข้อมูล
- `runtime.installCommand`: คำสั่งติดตั้งที่ไม่บังคับเพื่อรันเมื่อ bootstrap สภาพแวดล้อม runtime ACP

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
  - `"random"` (ค่าเริ่มต้น): tagline ตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: tagline กลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่แค่ tagline) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

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

## ข้อมูลระบุตัวตน

ดูฟิลด์ข้อมูลระบุตัวตน `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## Bridge (เดิม, ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge แล้ว Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมา config อีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="Config ของ bridge เดิม (ข้อมูลอ้างอิงเชิงประวัติ)">

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

- `sessionRetention`: ระยะเวลาที่เก็บเซสชันการรัน Cron แบบแยกที่เสร็จแล้วไว้ก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้าง transcript ของ Cron ที่ถูกลบและเก็บถาวร ค่าเริ่มต้น: `24h`; ตั้งค่า `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ล็อกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดออก ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดล่าสุดที่เก็บไว้เมื่อมีการทริกเกอร์การตัดล็อกการรัน ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง Webhook POST ของ Cron (`delivery.mode = "webhook"`) หากละไว้ จะไม่ส่งเฮดเดอร์ auth
- `webhook`: URL Webhook สำรองเดิมที่เลิกใช้แล้ว (http/https) ใช้เฉพาะกับงานที่บันทึกไว้ซึ่งยังมี `notify: true`

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
- `retryOn`: ประเภทข้อผิดพลาดที่ทำให้เกิดการลองใหม่ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ไม่ต้องระบุหากต้องการลองใหม่กับประเภทชั่วคราวทั้งหมด

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
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนที่จะส่งการแจ้งเตือน (จำนวนเต็มบวก, ขั้นต่ำ: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มที่ไม่ติดลบ)
- `includeSkipped`: นับรอบการทำงานที่ถูกข้ามติดต่อกันรวมกับเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) รอบที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดในการดำเนินการ
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความของช่อง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือรหัสช่องที่ไม่บังคับสำหรับจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องสำหรับการส่งแบบ announce `"last"` ใช้ช่องส่งล่าสุดที่ทราบซ้ำ
- `to`: เป้าหมาย announce หรือ URL ของ Webhook ที่ระบุโดยตรง จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` ต่อหนึ่งงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่มีการตั้งค่าปลายทางความล้มเหลวทั้งแบบส่วนกลางและต่อหนึ่งงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบ isolated จะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตของโมเดลสื่อ

ตัวแทนที่เทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร           | คำอธิบาย                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                         |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี history/sender wrappers)             |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว                 |
| `{{From}}`         | ตัวระบุผู้ส่ง                                 |
| `{{To}}`           | ตัวระบุปลายทาง                            |
| `{{MessageSid}}`   | รหัสข้อความของช่อง                                |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                              |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                 |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                          |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                  |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)               |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                  |
| `{{Prompt}}`       | พรอมป์สื่อที่ resolve แล้วสำหรับรายการ CLI             |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่ resolve แล้วสำหรับรายการ CLI         |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                           |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามดีที่สุด)                       |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามดีที่สุด)               |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามดีที่สุด)                 |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามดีที่สุด)                 |
| `{{Provider}}`     | คำใบ้ Provider (whatsapp, telegram, discord, ฯลฯ) |

---

## การ include คอนฟิก (`$include`)

แยกคอนฟิกออกเป็นหลายไฟล์:

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

- ไฟล์เดียว: แทนที่ออบเจ็กต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (รายการหลังแทนที่รายการก่อนหน้า)
- คีย์ระดับพี่น้อง: merge หลัง includes (แทนที่ค่าที่ include มา)
- includes ที่ซ้อนกัน: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve สัมพัทธ์กับไฟล์ที่ include แต่ต้องอยู่ภายในไดเรกทอรีคอนฟิกระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ absolute/`../` อนุญาตเฉพาะเมื่อยัง resolve อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะหนึ่งส่วนระดับบนสุดที่รองรับด้วย include แบบไฟล์เดียว จะเขียนผ่านไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- root includes, อาร์เรย์ include และ includes ที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนที่จะ flatten คอนฟิก
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดการ parse และ includes แบบวนซ้ำ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
