---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นอย่างแม่นยำ
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงเฉพาะของระบบย่อย
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-03T21:31:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52fa15e85a41ed5ed39102fb641bd33f0aec2e8f244c9d7b3d12b3a1b6dc62a9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

เอกสารอ้างอิงการตั้งค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบเน้นงาน ดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการตั้งค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีเอกสารอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ channel และ plugin เป็นเจ้าของ รวมถึงตัวปรับแต่งหน่วยความจำเชิงลึก/QMD อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบและ Control UI โดยรวมเมทาดาทาของ bundled/plugin/channel เข้ามาเมื่อมี
- `config.schema.lookup` คืนโหนดสคีมาหนึ่งรายการตามขอบเขตพาธสำหรับเครื่องมือ drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮช baseline ของเอกสาร config เทียบกับพื้นผิวสคีมาปัจจุบัน

พาธค้นหา Agent: ใช้การกระทำเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบเน้นงาน และใช้หน้านี้
สำหรับแผนที่ฟิลด์ที่กว้างกว่า ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อย

เอกสารอ้างอิงเชิงลึกเฉพาะทาง:

- [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และ config ของ dreaming ใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้า channel/plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะ channel

รูปแบบ config คือ **JSON5** (อนุญาตให้มีคอมเมนต์ + จุลภาคท้ายรายการ) ทุกฟิลด์เป็นทางเลือก — OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ระบุ

---

## Channel

คีย์ config ต่อ channel ถูกย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — channel](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และ channel
bundled อื่นๆ (auth, การควบคุมการเข้าถึง, หลายบัญชี, mention gating)

## ค่าเริ่มต้นของ Agent, multi-agent, session และ message

ย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — agent](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและ binding ของ multi-agent)
- `session.*` (วงจรชีวิต session, Compaction, pruning)
- `messages.*` (การส่ง message, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: id locale BCP 47 ทางเลือกสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ตั้งค่า Talk จะคงช่วงหยุดพักตามค่าเริ่มต้นของแพลตฟอร์มก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและ provider แบบกำหนดเอง

นโยบายเครื่องมือ toggle ทดลอง, config เครื่องมือที่หนุนโดย provider และการตั้งค่า
provider / base-URL แบบกำหนดเองย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — เครื่องมือและ provider แบบกำหนดเอง](/th/gateway/config-tools)

## Model

นิยาม provider, allowlist ของ model และการตั้งค่า provider แบบกำหนดเองอยู่ใน
[การกำหนดค่า — เครื่องมือและ provider แบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อก model ระดับสากลด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแค็ตตาล็อก provider (`merge` หรือ `replace`)
- `models.providers`: map provider แบบกำหนดเองที่ key ด้วย provider id
- `models.pricing.enabled`: ควบคุม bootstrap ราคาเบื้องหลังที่
  เริ่มหลังจาก sidecar และ channel ถึงพาธ Gateway ready เมื่อเป็น `false`
  Gateway จะข้ามการ fetch แค็ตตาล็อกราคาของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่ตั้งค่าไว้ยังคงใช้ได้สำหรับการประมาณต้นทุนภายในเครื่อง

## MCP

นิยาม MCP server ที่ OpenClaw จัดการอยู่ใต้ `mcp.servers` และถูก
ใช้โดย Pi แบบฝังตัวและ runtime adapter อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการ block นี้โดยไม่เชื่อมต่อกับ
target server ระหว่างแก้ไข config

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

- `mcp.servers`: นิยาม MCP server แบบ stdio หรือ remote ที่มีชื่อ สำหรับ runtime ที่
  เปิดเผยเครื่องมือ MCP ที่ตั้งค่าไว้
  รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` ทำให้เป็นฟิลด์ `transport` มาตรฐาน
- `mcp.sessionIdleTtlMs`: TTL เมื่อ idle สำหรับ runtime MCP แบบ bundled ที่มีขอบเขต session
  การรันแบบฝังตัวครั้งเดียวร้องขอการ cleanup เมื่อจบการรัน; TTL นี้เป็น backstop สำหรับ
  session ที่อยู่ยาวและ caller ในอนาคต
- การเปลี่ยนแปลงใต้ `mcp.*` hot-apply โดย dispose runtime MCP ของ session ที่แคชไว้
  การค้นพบ/ใช้เครื่องมือครั้งถัดไปจะสร้างใหม่จาก config ใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[CLI backend](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรม runtime

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

- `allowBundled`: allowlist ทางเลือกสำหรับ bundled skills เท่านั้น (ไม่กระทบ managed/workspace skills)
- `load.extraDirs`: root ของ skill ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
  ก่อน fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ค่ากำหนดตัวติดตั้ง node สำหรับสเปก `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้จะ bundled/installed อยู่
- `entries.<skillKey>.apiKey`: ความสะดวกสำหรับ skill ที่ประกาศ env var หลัก (สตริง plaintext หรือออบเจ็กต์ SecretRef)

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

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` รวมถึง `plugins.load.paths`
- การค้นพบรองรับ OpenClaw plugins แบบ native รวมถึง bundle ของ Codex และ Claude ที่เข้ากันได้ รวมถึง bundle layout เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยน config ต้อง restart gateway**
- `allow`: allowlist ทางเลือก (โหลดเฉพาะ plugin ที่อยู่ในรายการ) `deny` มีผลเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์ความสะดวก API key ระดับ plugin (เมื่อ plugin รองรับ)
- `plugins.entries.<id>.env`: map env var ที่มีขอบเขต plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ prompt จาก `before_agent_start` แบบ legacy ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบ legacy ไว้ ใช้กับ hook ของ plugin แบบ native และไดเรกทอรี hook ที่ bundle ที่รองรับจัดให้
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` plugin ที่ไม่ใช่ bundled และเชื่อถือได้อาจอ่านเนื้อหาการสนทนา raw จาก typed hook เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ร้องขอ override `provider` และ `model` ต่อการรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist ทางเลือกของเป้าหมาย `provider/model` มาตรฐานสำหรับ subagent override ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.config`: ออบเจ็กต์ config ที่ plugin กำหนด (ตรวจสอบด้วยสคีมา OpenClaw plugin แบบ native เมื่อมี)
- การตั้งค่าบัญชี/runtime ของ channel plugin อยู่ใต้ `channels.<id>` และควรถูกอธิบายโดยเมทาดาทา `channelConfigs` ใน manifest ของ plugin เจ้าของ ไม่ใช่โดย registry option ส่วนกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า provider web-fetch ของ Firecrawl
  - `apiKey`: API key ของ Firecrawl (รับ SecretRef) fallback ไปที่ `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐาน API ของ Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; override แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: แยกเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุสูงสุดของ cache เป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้ provider X Search
  - `model`: model Grok ที่ใช้สำหรับค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phase และ threshold
  - `enabled`: สวิตช์ dreaming หลัก (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ cron สำหรับ dreaming sweep เต็มแต่ละครั้ง (`"0 3 * * *"` โดยค่าเริ่มต้น)
  - `model`: override model ของ subagent Dream Diary ทางเลือก ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาด model-unavailable จะ retry หนึ่งครั้งด้วย model เริ่มต้นของ session; ความล้มเหลวด้าน trust หรือ allowlist จะไม่ fallback อย่างเงียบๆ
  - นโยบาย phase และ threshold เป็นรายละเอียดการ implement (ไม่ใช่คีย์ config ที่ผู้ใช้เห็น)
- config หน่วยความจำทั้งหมดอยู่ใน [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- plugin bundle ของ Claude ที่เปิดใช้แล้วสามารถเพิ่มค่าเริ่มต้น Pi แบบฝังตัวจาก `settings.json` ได้ด้วย; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ sanitize แล้ว ไม่ใช่เป็น patch config ดิบของ OpenClaw
- `plugins.slots.memory`: เลือก id ของ plugin หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิด plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือก id ของ plugin context engine ที่ใช้งานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณติดตั้งและเลือก engine อื่น

ดู [Plugin](/th/tools/plugin)

---

## Commitment

`commitments` ควบคุมหน่วยความจำ follow-up ที่อนุมานได้: OpenClaw สามารถตรวจจับ check-in จาก turn ของการสนทนาและส่งมอบผ่านการรัน heartbeat

- `commitments.enabled`: เปิดใช้การสกัดด้วย LLM แบบซ่อน การจัดเก็บ และการส่งมอบ heartbeat สำหรับ commitment follow-up ที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวน commitment follow-up ที่อนุมานได้สูงสุดซึ่งส่งมอบต่อ session agent ในวันแบบ rolling ค่าเริ่มต้น: `3`

ดู [Commitment ที่อนุมานได้](/th/concepts/commitments)

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
- `tabCleanup` เรียกคืนแท็บของตัวแทนหลักที่ติดตามไว้หลังจากไม่มีการใช้งาน หรือเมื่อเซสชันเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อปิดใช้งานโหมดล้างข้อมูลแต่ละโหมดนั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดโดยค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางของเบราว์เซอร์ในเครือข่ายส่วนตัวเท่านั้น
- ในโหมดเข้มงวด จุดปลายทางโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นหา
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะชื่อแฝงแบบเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุอย่างชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อต้องการให้ OpenClaw ค้นหา `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback ที่จัดการไว้
  จะคงค่าเริ่มต้น CDP ในเครื่องไว้
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ในเครื่องที่จัดการไว้ และอาจรายงานข้อผิดพลาดเรื่องความเป็นเจ้าของพอร์ตในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` คงขีดจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้:
  การดำเนินการที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วยตัวเลือก CSS, ฮุกอัปโหลดไฟล์เดียว,
  ไม่มีการแทนที่เวลาหมดของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การสกัดกั้นการดาวน์โหลด หรือการดำเนินการแบบชุด
- โปรไฟล์ `openclaw` ที่จัดการในเครื่องจะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ให้ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกลเท่านั้น
- โปรไฟล์ที่จัดการในเครื่องสามารถตั้งค่า `executablePath` เพื่อแทนที่ค่า
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้ตัวเลือกนี้เพื่อเรียกใช้โปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ที่จัดการในเครื่องใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นหา Chrome CDP HTTP
  หลังจากเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังการเปิดใช้งาน เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มสำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` มิลลิวินาที; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- ทั้ง `browser.executablePath` และ `browser.profiles.<name>.executablePath`
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรีหลักของระบบปฏิบัติการของคุณก่อนเปิด Chromium
  `userDataDir` รายโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วยเช่นกัน
- บริการควบคุม: loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดใช้งานเพิ่มเติมให้กับการเริ่มต้น Chromium ในเครื่อง (เช่น
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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (สีฟองโหมดสนทนา เป็นต้น)
- `assistant`: การแทนที่อัตลักษณ์ Control UI ย้อนกลับไปใช้ตัวตนของตัวแทนที่ใช้งานอยู่

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

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`.
- `port`: พอร์ตเดียวแบบมัลติเพล็กซ์สำหรับ WS + HTTP. ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale), หรือ `custom`.
- **นามแฝง bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังบน `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะมาถึงบน `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นตามค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ Gateway ในทางปฏิบัติ หมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ดเริ่มต้นใช้งานจะสร้างโทเค็นตามค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` เป็น `token` หรือ `password` อย่างชัดเจน โฟลว์เริ่มทำงานและติดตั้ง/ซ่อมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างแต่ไม่ได้ตั้งค่าโหมด
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบชัดเจน ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; ตั้งใจไม่ให้มีตัวเลือกนี้ในพรอมป์เริ่มต้นใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือเฮดเดอร์ตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่ง proxy ที่ **ไม่ใช่ loopback** ตามค่าเริ่มต้น; reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องกำหนด `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ตัวเรียกภายในโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็นทางสำรองโดยตรงในเครื่องได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` เฮดเดอร์ตัวตนของ Tailscale Serve สามารถผ่านการยืนยันตัวตนของ UI ควบคุม/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) ปลายทาง HTTP API **ไม่** ใช้การยืนยันตัวตนด้วยเฮดเดอร์ Tailscale นั้น; แต่จะทำตามโหมดการยืนยันตัวตน HTTP ปกติของ Gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`
  - บนพาธ UI ควบคุมของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนความล้มเหลว ดังนั้นความพยายามผิดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานในคำขอที่สอง แทนที่ทั้งคู่จะแข่งผ่านไปเป็นแค่การไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้ proxy ที่เข้มงวด)
- ความพยายามยืนยันตัวตน WS จากต้นทางเบราว์เซอร์จะถูกควบคุมอัตราเสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการเดารหัส localhost จากเบราว์เซอร์)
- บน loopback การล็อกเอาต์จากต้นทางเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ปรับให้อยู่ในรูปปกติ ดังนั้นความล้มเหลวซ้ำ ๆ จากต้นทาง localhost หนึ่งจะไม่ล็อก
  ต้นทางอื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้การยืนยันตัวตน)
- `controlUi.allowedOrigins`: allowlist ต้นทางเบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จากต้นทางที่ไม่ใช่ loopback
- `controlUi.chatMessageMaxWidth`: ความกว้างสูงสุดแบบไม่บังคับสำหรับข้อความแชต UI ควบคุมที่จัดกลุ่ม ยอมรับค่า width ของ CSS ที่มีขอบเขต เช่น `960px`, `82%`, `min(1280px, 82%)`, และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback ต้นทางจากเฮดเดอร์ Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบายต้นทางจากเฮดเดอร์ Host
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: การแทนที่ฉุกเฉินในสภาพแวดล้อมกระบวนการฝั่งไคลเอนต์
  ที่อนุญาต plaintext `ws://` ไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้;
  ค่าเริ่มต้นยังคงเป็นเฉพาะ loopback สำหรับ plaintext ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการกำหนดค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่มีผลต่อไคลเอนต์ WebSocket ของ Gateway
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ Gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL HTTPS ฐานสำหรับรีเลย์ APNs ภายนอกที่ใช้โดยบิลด์ iOS ทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนที่รองรับรีเลย์ไปยัง Gateway แล้ว URL นี้ต้องตรงกับ URL รีเลย์ที่คอมไพล์ไว้ในบิลด์ iOS
- `gateway.push.apns.relay.timeoutMs`: เวลาหมดเวลาในการส่งจาก Gateway ไปยังรีเลย์เป็นมิลลิวินาที ค่าเริ่มต้นเป็น `10000`
- การลงทะเบียนที่รองรับรีเลย์จะถูกมอบหมายให้ตัวตน Gateway เฉพาะ แอป iOS ที่จับคู่แล้วจะดึง `gateway.identity.get` รวมตัวตนนั้นไว้ในการลงทะเบียนรีเลย์ และส่งต่อสิทธิ์ส่งที่จำกัดตามการลงทะเบียนไปยัง Gateway Gateway อื่นไม่สามารถใช้การลงทะเบียนที่จัดเก็บนั้นซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: การแทนที่ env ชั่วคราวสำหรับการกำหนดค่ารีเลย์ด้านบน
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL รีเลย์ HTTP แบบ loopback URL รีเลย์สำหรับโปรดักชันควรใช้ HTTPS ต่อไป
- `gateway.handshakeTimeoutMs`: เวลาหมดเวลาการจับมือ WebSocket ของ Gateway ก่อนการยืนยันตัวตนเป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อกำหนดไว้ เพิ่มค่านี้บนโฮสต์ที่โหลดหนักหรือพลังงานต่ำ ซึ่งไคลเอนต์ในเครื่องอาจเชื่อมต่อได้ในขณะที่การอุ่นเครื่องช่วงเริ่มต้นยังไม่เสถียร
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาตรวจสอบสุขภาพช่องทางเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ทโดยตัวตรวจสอบสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ซ็อกเก็ตค้างเป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนสูงสุดของการรีสตาร์ทโดยตัวตรวจสอบสุขภาพต่อช่องทาง/บัญชีในหนึ่งชั่วโมงแบบเลื่อน ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การเลือกไม่ใช้ต่อช่องทางสำหรับการรีสตาร์ทโดยตัวตรวจสอบสุขภาพ ขณะที่ยังเปิดใช้ตัวตรวจสอบส่วนกลาง
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การแทนที่ต่อบัญชีสำหรับช่องทางหลายบัญชี เมื่อกำหนดไว้ จะมีลำดับความสำคัญเหนือการแทนที่ระดับช่องทาง
- พาธการเรียก Gateway ในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี remote fallback มาบดบัง)
- `trustedProxies`: IP ของ reverse proxy ที่ยุติ TLS หรือฉีดเฮดเดอร์ไคลเอนต์ที่ส่งต่อมา ระบุเฉพาะ proxy ที่คุณควบคุมเท่านั้น รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่า proxy/การตรวจจับในเครื่องบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่รายการเหล่านั้น **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` สำหรับพฤติกรรมล้มเหลวแบบปิด
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP แบบไม่บังคับสำหรับอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีขอบเขตที่ร้องขอ ถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/เบราว์เซอร์/UI ควบคุม/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรดบทบาท ขอบเขต เมตาดาต้า หรือ public-key โดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ระดับส่วนกลางสำหรับคำสั่ง node ที่ประกาศ หลังการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกใช้คำสั่ง node ที่อันตราย เช่น `camera.snap`, `camera.clip`, และ `screen.record`; `denyCommands` จะนำคำสั่งออก แม้ว่าค่าเริ่มต้นของแพลตฟอร์มหรือ allow แบบชัดเจนจะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นอีกครั้ง เพื่อให้ Gateway จัดเก็บสแนปช็อตคำสั่งที่อัปเดตแล้ว
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny ค่าเริ่มต้น)
- `gateway.tools.allow`: นำชื่อเครื่องมือออกจากรายการ deny ค่าเริ่มต้นของ HTTP

</Accordion>

### ปลายทางที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานตามค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความแข็งแรงของอินพุต URL สำหรับ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- เฮดเดอร์เสริมความแข็งแรงของ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: เปิดใช้การยุติ TLS ที่ listener ของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์อย่างชัดเจน; สำหรับการใช้ในเครื่อง/การพัฒนาเท่านั้น
- `certPath`: พาธระบบไฟล์ไปยังไฟล์ใบรับรอง TLS
- `keyPath`: พาธระบบไฟล์ไปยังไฟล์ private key ของ TLS; จำกัดสิทธิ์การเข้าถึงไว้
- `caPath`: พาธ bundle ของ CA แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ trust chain แบบกำหนดเอง

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

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ขณะรันไทม์
  - `"off"`: ละเว้นการแก้ไขแบบ live; การเปลี่ยนแปลงต้องรีสตาร์ทอย่างชัดเจน
  - `"restart"`: รีสตาร์ทกระบวนการ Gateway เสมอเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ในกระบวนการโดยไม่รีสตาร์ท
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback เป็นการรีสตาร์ทหากจำเป็น
- `debounceMs`: หน้าต่าง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็น ms สำหรับรอการดำเนินการที่กำลังทำงานก่อนบังคับรีสตาร์ท ละไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรอไม่มีกำหนดและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

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
โทเค็นฮุกในสตริงคำค้นจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ต้องไม่เป็น `/`; ใช้เส้นทางย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หากการแมปหรือพรีเซ็ตใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องเลือกใช้ตัวเลือกนี้

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะถูกรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ค่าโดยใช้ `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่เส้นทางย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์เพย์โหลดสำหรับเส้นทางทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่ส่งคืนการกระทำของฮุกได้
  - `transform.module` ต้องเป็นเส้นทางสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (เส้นทางแบบสัมบูรณ์และการไล่ย้อนเส้นทางจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ในเวิร์กสเปซจะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าเส้นทางนี้ไม่ถูกต้อง ให้ย้ายโมดูลแปลงเข้าไปในไดเรกทอรีการแปลงของฮุก หรือลบ `hooks.transformsDir`
- `agentId` กำหนดเส้นทางไปยังเอเจนต์เฉพาะ; ID ที่ไม่รู้จักจะย้อนกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบชัดเจน (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่ที่เป็นตัวเลือกสำหรับการรันเอเจนต์ฮุกโดยไม่มี `sessionKey` แบบชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันของการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist คำนำหน้าแบบเป็นตัวเลือกสำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` ค่านี้จะกลายเป็นสิ่งจำเป็นเมื่อการแมปหรือพรีเซ็ตใดๆ ใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` แทนที่ LLM สำหรับการรันฮุกนี้ (ต้องได้รับอนุญาตหากตั้งค่าแค็ตตาล็อกโมเดลไว้)

</Accordion>

### การผสานรวม Gmail

- พรีเซ็ต Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณเก็บการกำหนดเส้นทางต่อข้อความแบบนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับเนมสเปซ Gmail เช่น `["hook:", "hook:gmail:"]`
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

- Gateway เริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูตเมื่อมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
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

- ให้บริการ HTML/CSS/JS ที่เอเจนต์แก้ไขได้และ A2UI ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะเครื่องภายใน: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การผูกแบบไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การยืนยันตัวตนของ Gateway (โทเค็น/รหัสผ่าน/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นๆ ของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่งส่วนหัวการยืนยันตัวตน; หลังจากจับคู่และเชื่อมต่อโหนดแล้ว Gateway จะประกาศ URL ความสามารถที่จำกัดตามโหนดสำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถจะผูกกับเซสชัน WS ของโหนดที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- แทรกไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต Gateway
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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้งาน Plugin `bonjour` ที่รวมมา): ละ `cliPath` + `sshPort` ออกจากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`; การโฆษณา LAN multicast ยังต้องเปิดใช้งาน Plugin `bonjour` ที่รวมมา
- `off`: ระงับการโฆษณา LAN multicast โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่รวมมาจะเริ่มโดยอัตโนมัติบนโฮสต์ macOS และเป็นแบบเลือกใช้บน Linux, Windows และการปรับใช้ Gateway แบบคอนเทนเนอร์
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง และจะย้อนกลับไปใช้ `openclaw` แทนที่ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบยูนิคาสต์ไว้ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

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

- ตัวแปร env แบบอินไลน์จะถูกนำไปใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้นอยู่
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งคู่ไม่ override ตัวแปรที่มีอยู่แล้ว)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังขาดอยู่จากโปรไฟล์เชลล์ล็อกอินของคุณ
- ดูลำดับความสำคัญทั้งหมดได้ที่ [สภาพแวดล้อม](/th/help/environment)

### การแทนค่าตัวแปร Env

อ้างอิงตัวแปร env ในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหาย/ว่างเปล่าจะทำให้เกิดข้อผิดพลาดตอนโหลด config
- escape ด้วย `$${VAR}` สำหรับค่า literal `${VAR}`
- ใช้งานได้กับ `$include`

---

## ข้อมูลลับ

การอ้างอิงข้อมูลลับเป็นแบบเพิ่มเข้าไป: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปแบบ object แบบเดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบ:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบ absolute (ตัวอย่างเช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มี segment ของ path ที่คั่นด้วย slash เป็น `.` หรือ `..` (ตัวอย่างเช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลประจำตัวที่รองรับ

- ตาราง canonical: [พื้นผิวข้อมูลประจำตัวของ SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยัง path ข้อมูลประจำตัวของ `openclaw.json` ที่รองรับ
- การอ้างอิงใน `auth-profiles.json` ถูกรวมไว้ในการ resolve ขณะรันไทม์และความครอบคลุมของ audit

### Config ของผู้ให้บริการข้อมูลลับ

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
- path ของผู้ให้บริการ file และ exec จะ fail closed เมื่อการตรวจสอบ Windows ACL ไม่พร้อมใช้งาน ตั้งค่า `allowInsecurePath: true` เฉพาะกับ path ที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้เท่านั้น
- ผู้ให้บริการ `exec` ต้องใช้ path ของ `command` แบบ absolute และใช้ payload ของโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น path คำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาต path ที่เป็น symlink พร้อมตรวจสอบ path เป้าหมายที่ resolve แล้ว
- หากกำหนดค่า `trustedDirs` การตรวจสอบ trusted-dir จะใช้กับ path เป้าหมายที่ resolve แล้ว
- environment ของ child จาก `exec` มีค่าเริ่มต้นแบบขั้นต่ำ; ส่งตัวแปรที่ต้องใช้ให้ชัดเจนด้วย `passEnv`
- การอ้างอิงข้อมูลลับจะถูก resolve ตอน activation เป็น snapshot ในหน่วยความจำ จากนั้น path ของคำขอจะอ่านเฉพาะ snapshot เท่านั้น
- การกรอง active-surface จะใช้ระหว่าง activation: การอ้างอิงที่ยัง resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานอยู่จะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ active จะถูกข้ามพร้อม diagnostics

---

## ที่จัดเก็บ Auth

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
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลประจำตัวแบบ static
- map แบบ flat เดิมของ `auth-profiles.json` เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบขณะรันไทม์; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key แบบ canonical `provider:default` พร้อม backup `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลประจำตัวของ auth-profile ที่อิงกับ SecretRef
- ข้อมูลประจำตัวขณะรันไทม์แบบ static มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบ static เดิมจะถูกล้างเมื่อตรวจพบ
- การนำเข้า OAuth เดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมขณะรันไทม์ของข้อมูลลับและเครื่องมือ `audit/configure/apply`: [การจัดการข้อมูลลับ](/th/gateway/secrets)

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

- `billingBackoffHours`: base backoff เป็นชั่วโมงเมื่อ profile ล้มเหลวจากข้อผิดพลาด billing/เครดิตไม่พอจริง (ค่าเริ่มต้น: `5`) ข้อความ billing ที่ชัดเจนยังสามารถเข้ามาที่นี่ได้แม้ใน response `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะ provider จะยังจำกัดอยู่ใน provider ที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` usage-window ที่ retry ได้ หรือข้อความ organization/workspace spend-limit จะยังอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: override จำนวนชั่วโมง billing backoff แยกตาม provider แบบไม่บังคับ
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ billing backoff (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: base backoff เป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: rolling window เป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ใน provider เดียวกันสำหรับข้อผิดพลาด overloaded ก่อนสลับไป model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อน retry การหมุนเวียน provider/profile ที่ overloaded (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ใน provider เดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไป model fallback (ค่าเริ่มต้น: `1`) กลุ่ม rate-limit นี้รวมข้อความที่มีรูปแบบจาก provider เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- ตั้งค่า `logging.file` เพื่อใช้ path ที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดสูงสุดของไฟล์ log ที่ใช้งานอยู่เป็นไบต์ก่อน rotation (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บ archive แบบมีหมายเลขไว้สูงสุดห้ารายการข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การ masking แบบ best-effort สำหรับ console output, file logs, OTLP log records และข้อความ transcript ของ session ที่บันทึกไว้ `redactSensitive: "off"` จะปิดเฉพาะนโยบาย log/transcript ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/tool/diagnostic ยังคง redact secrets ก่อนส่งออก

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

- `enabled`: สวิตช์หลักสำหรับ output ของ instrumentation (ค่าเริ่มต้น: `true`)
- `flags`: array ของสตริง flag ที่เปิดใช้งาน log output แบบเจาะจง (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: threshold อายุที่ไม่มี progress เป็น ms สำหรับจัดประเภท session ประมวลผลที่รันนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, tool, status, block และ ACP progress จะรีเซ็ต timer; diagnostic `session.stuck` ที่เกิดซ้ำจะ back off เมื่อยังไม่เปลี่ยนแปลง
- `otel.enabled`: เปิดใช้งาน pipeline ส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม, signal catalog และ privacy model ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของ collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะ signal แบบไม่บังคับ เมื่อตั้งค่าแล้ว จะ override `otel.endpoint` เฉพาะ signal นั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: HTTP/gRPC metadata headers เพิ่มเติมที่ส่งพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อ service สำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้งานการส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตรา sampling ของ trace `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry เป็นระยะใน ms
- `otel.captureContent`: เลือกเปิดการจับ raw content สำหรับ OTEL span attributes ค่าเริ่มต้นคือปิด Boolean `true` จะจับเนื้อหา message/tool ที่ไม่ใช่ระบบ; รูปแบบ object ให้คุณเปิดใช้งาน `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: toggle environment สำหรับ attributes ของ provider สำหรับ GenAI span รุ่น experimental ล่าสุด โดยค่าเริ่มต้น span จะคง attribute เดิม `gen_ai.system` ไว้เพื่อความเข้ากันได้; GenAI metrics ใช้ bounded semantic attributes
- `OPENCLAW_OTEL_PRELOADED=1`: toggle environment สำหรับ host ที่ลงทะเบียน OpenTelemetry SDK ระดับ global ไว้แล้ว จากนั้น OpenClaw จะข้ามการ startup/shutdown ของ SDK ที่ Plugin เป็นเจ้าของ โดยยังคง diagnostic listeners ไว้
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars ของ endpoint เฉพาะ signal ที่ใช้เมื่อยังไม่ได้ตั้งค่า config key ที่ตรงกัน
- `cacheTrace.enabled`: บันทึก snapshot ของ cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: path output สำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ใน output ของ cache trace (ค่าเริ่มต้นทั้งหมด: `true`)

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

- `channel`: release channel สำหรับการติดตั้ง npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบ npm updates เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้งาน auto-update เบื้องหลังสำหรับ package installs (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: delay ขั้นต่ำเป็นชั่วโมงก่อน auto-apply สำหรับ stable-channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจาย rollout เพิ่มเติมเป็นชั่วโมงสำหรับ stable-channel (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ในการรันการตรวจสอบ beta-channel เป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

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

- `enabled`: global ACP feature gate (ค่าเริ่มต้น: `true`; ตั้งค่า `false` เพื่อซ่อน ACP dispatch และ spawn affordances)
- `dispatch.enabled`: gate อิสระสำหรับ dispatch ของ ACP session turn (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งาน แต่บล็อกการ execution
- `backend`: id ของ backend รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin backend ก่อน และถ้าตั้งค่า `plugins.allow` ไว้ ให้รวม id ของ Plugin backend (เช่น `acpx`) ไม่เช่นนั้น backend ACP จะไม่โหลด
- `defaultAgent`: id ของ agent เป้าหมาย ACP fallback เมื่อ spawns ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id agent ที่อนุญาตสำหรับ session รันไทม์ ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของ ACP sessions ที่ active พร้อมกัน
- `stream.coalesceIdleMs`: idle flush window เป็น ms สำหรับ streamed text
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแบ่ง streamed block projection
- `stream.repeatSuppression`: ระงับบรรทัด status/tool ที่ซ้ำกันต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` stream แบบเพิ่มทีละส่วน; `"final_only"` buffer จนถึง turn terminal events
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลัง hidden tool events (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระ output สูงสุดของ assistant ที่ project ต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัด status/update ของ ACP ที่ project
- `stream.tagVisibility`: record ของชื่อ tag เป็น boolean visibility overrides สำหรับ streamed events
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ ACP session workers ก่อนมีสิทธิ์ cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่ใช้รันเมื่อ bootstrapping environment รันไทม์ ACP

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

- `cli.banner.taglineMode` ควบคุมสไตล์ tagline ของ banner:
  - `"random"` (ค่าเริ่มต้น): tagline ตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: tagline กลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังแสดงชื่อ/version ของ banner)
- หากต้องการซ่อน banner ทั้งหมด (ไม่ใช่แค่ taglines) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

Metadata ที่เขียนโดย flow การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

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

## Identity

ดู field identity ของ `agents.list` ภายใต้ [ค่าเริ่มต้นของ Agent](/th/gateway/config-agents#agent-defaults)

---

## Bridge (legacy, ถูกลบแล้ว)

Build ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน Gateway WebSocket keys `bridge.*` ไม่เป็นส่วนหนึ่งของ config schema อีกต่อไป (validation จะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบ unknown keys ได้)

<Accordion title="การกำหนดค่า bridge legacy (อ้างอิงทางประวัติ)">

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

- `sessionRetention`: ระยะเวลาที่เก็บ session ของ isolated cron run ที่เสร็จแล้วก่อน prune จาก `sessions.json` และยังควบคุม cleanup ของ transcript cron ที่ถูกลบและ archive ไว้ ค่าเริ่มต้น: `24h`; ตั้งค่า `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ run log (`cron/runs/<jobId>.jsonl`) ก่อน pruning ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดใหม่ล่าสุดที่จะเก็บไว้เมื่อมีการ trigger run-log pruning ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง POST ของ cron Webhook (`delivery.mode = "webhook"`) หากละไว้จะไม่ส่ง auth header
- `webhook`: URL Webhook fallback legacy ที่เลิกใช้แล้ว (http/https) ใช้เฉพาะกับงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`

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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองซ้ำสำหรับงานแบบครั้งเดียวเมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของระยะหน่วง backoff เป็นมิลลิวินาทีสำหรับการลองซ้ำแต่ละครั้ง (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทำให้เกิดการลองซ้ำ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อให้ลองซ้ำกับประเภทชั่วคราวทั้งหมด

มีผลเฉพาะกับงาน Cron แบบครั้งเดียวเท่านั้น งานที่เกิดซ้ำใช้การจัดการความล้มเหลวแยกต่างหาก

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
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนให้ส่งการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันเข้ากับเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดในการดำเนินการ
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: รหัสบัญชีหรือช่องทางที่เป็นทางเลือกเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบ announce `"last"` ใช้ช่องทางส่งล่าสุดที่ทราบซ้ำ
- `to`: เป้าหมาย announce หรือ URL ของ Webhook ที่ระบุชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่เป็นทางเลือกสำหรับการส่ง
- `delivery.failureDestination` ต่อแต่ละงานจะแทนที่ค่าเริ่มต้นระดับโกลบอลนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งระดับโกลบอลและต่อแต่งาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- รองรับ `delivery.failureDestination` เฉพาะสำหรับงาน `sessionTarget="isolated"` เท่านั้น เว้นแต่ `delivery.mode` หลักของงานเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตของโมเดลสื่อ

ตัวแทนเทมเพลตที่ถูกขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                     |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวครอบประวัติ/ผู้ส่ง)          |
| `{{BodyStripped}}` | เนื้อหาที่ลบการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                     |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | รหัสข้อความของช่องทาง                            |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                           |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                         |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                 |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)              |
| `{{Transcript}}`   | ถอดเสียงเป็นข้อความ                              |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ไขแล้วสำหรับรายการ CLI           |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ไขแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                  |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)          |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)         |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)    |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord ฯลฯ) |

---

## การรวมไฟล์กำหนดค่า (`$include`)

แยกการกำหนดค่าเป็นหลายไฟล์:

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

- ไฟล์เดียว: แทนที่ออบเจกต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merged ตามลำดับ (รายการหลังแทนที่รายการก่อนหน้า)
- คีย์พี่น้อง: ผสานหลัง includes (แทนที่ค่าที่ include มา)
- includes ซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: แก้ไขโดยอิงจากไฟล์ที่ include แต่ต้องยังอยู่ภายในไดเรกทอรีการกำหนดค่าระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบแบบสัมบูรณ์/`../` อนุญาตเฉพาะเมื่อยัง resolve อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่หนุนด้วย include แบบไฟล์เดียว จะเขียนทะลุไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- includes ที่ราก, อาร์เรย์ include และ includes ที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนที่จะ flatten การกำหนดค่า
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดในการแยกวิเคราะห์ และ includes แบบวนซ้ำ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
