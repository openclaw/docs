---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของระบบย่อย
title: เอกสารอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-04-30T09:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fd28b7d6a2e670ab97aac206bb14343bd887da3236c6135d7958cc6e97b735
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการกำหนดค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบมุ่งเน้นงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการกำหนดค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงตัวเลือกเชิงลึกของ memory/QMD จะอยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

ความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวมเมทาดาทาจากชุดที่มาพร้อมระบบ/Plugin/ช่องทางเมื่อมี
- `config.schema.lookup` ส่งคืนโหนด schema หนึ่งรายการตามขอบเขตพาธสำหรับเครื่องมือเจาะรายละเอียด
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮช baseline ของเอกสารการกำหนดค่าเทียบกับพื้นผิว schema ปัจจุบัน

พาธการค้นหา Agent: ใช้การกระทำของเครื่องมือ `gateway` คือ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบมุ่งเน้นงาน และใช้หน้านี้
สำหรับแผนที่ฟิลด์ที่กว้างขึ้น ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะทาง:

- [ข้อมูลอ้างอิงการกำหนดค่า memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการกำหนดค่า dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + ที่มาพร้อมระบบในปัจจุบัน
- หน้าของช่องทาง/Plugin เจ้าของ สำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบการกำหนดค่าคือ **JSON5** (อนุญาตให้มีความคิดเห็นและ comma ท้ายรายการได้) ฟิลด์ทั้งหมดเป็นตัวเลือก — OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อเว้นไว้

---

## ช่องทาง

คีย์การกำหนดค่ารายช่องทางถูกย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางอื่นๆ
ที่มาพร้อมระบบ (auth, การควบคุมการเข้าถึง, หลายบัญชี, mention gating)

## ค่าเริ่มต้นของ Agent, หลาย Agent, session และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — agent](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและ binding หลาย Agent)
- `session.*` (วงจรชีวิต session, Compaction, การตัดทอน)
- `messages.*` (การส่งข้อความ, TTS, การ render markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: id locale BCP 47 แบบไม่บังคับสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงช่วงหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและ provider แบบกำหนดเอง

นโยบายเครื่องมือ, toggle แบบทดลอง, การกำหนดค่าเครื่องมือที่รองรับด้วย provider และการตั้งค่า
provider / base-URL แบบกำหนดเอง ถูกย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — เครื่องมือและ provider แบบกำหนดเอง](/th/gateway/config-tools)

## Models

นิยาม provider, allowlist ของ model และการตั้งค่า provider แบบกำหนดเองอยู่ใน
[การกำหนดค่า — เครื่องมือและ provider แบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรม model-catalog ส่วนกลางด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรม provider catalog (`merge` หรือ `replace`)
- `models.providers`: map provider แบบกำหนดเองที่ใช้ provider id เป็นคีย์
- `models.pricing.enabled`: ควบคุม pricing bootstrap เบื้องหลัง เมื่อ
  `false` การเริ่มต้น Gateway จะข้ามการดึง pricing-catalog ของ OpenRouter และ LiteLLM;
  ค่า `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังใช้ได้สำหรับการประมาณต้นทุนในเครื่อง

## MCP

นิยาม MCP server ที่ OpenClaw จัดการจะอยู่ภายใต้ `mcp.servers` และถูกใช้โดย Pi แบบฝังและ runtime adapter อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อไปยัง
server เป้าหมายระหว่างการแก้ไขการกำหนดค่า

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

- `mcp.servers`: นิยาม MCP server แบบ stdio หรือ remote ที่ตั้งชื่อไว้สำหรับ runtime ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` normalize ให้เป็นฟิลด์ `transport` ตาม canonical
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ runtime MCP ที่มาพร้อมระบบและมีขอบเขตตาม session
  การรันแบบฝังครั้งเดียวจะขอ cleanup ตอนจบการรัน; TTL นี้เป็นตัวรองรับสุดท้ายสำหรับ
  session ที่อยู่ยาวและ caller ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` จะ hot-apply โดย dispose runtime MCP ของ session ที่ cache ไว้
  การค้นพบ/ใช้งานเครื่องมือครั้งถัดไปจะสร้างใหม่จากการกำหนดค่าใหม่ ดังนั้นรายการ
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

- `allowBundled`: allowlist แบบไม่บังคับสำหรับ skills ที่มาพร้อมระบบเท่านั้น (ไม่กระทบ skills แบบ managed/workspace)
- `load.extraDirs`: root skills ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้ใช้ตัวติดตั้ง Homebrew ก่อนเมื่อ `brew`
  พร้อมใช้งาน ก่อน fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: การกำหนดค่าตัวติดตั้ง node ที่ต้องการสำหรับ spec `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้ว่าจะมาพร้อมระบบ/ติดตั้งแล้วก็ตาม
- `entries.<skillKey>.apiKey`: ความสะดวกสำหรับ skills ที่ประกาศ env var หลัก (สตริง plaintext หรือออบเจกต์ SecretRef)

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
- การค้นพบรองรับ Plugin OpenClaw แบบ native รวมถึง bundle Codex และ bundle Claude ที่เข้ากันได้ รวมทั้ง bundle layout เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการกำหนดค่าต้อง restart gateway**
- `allow`: allowlist แบบไม่บังคับ (โหลดเฉพาะ plugins ที่ระบุ) `deny` มีผลเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์ความสะดวกสำหรับ API key ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: map env var ตามขอบเขต Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไข prompt จาก `before_agent_start` แบบ legacy ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบ legacy ไว้ ใช้กับ hook ของ Plugin แบบ native และไดเรกทอรี hook ที่มาจาก bundle ซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่ไม่มาพร้อมระบบและเชื่อถือได้อาจอ่านเนื้อหาการสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ override `provider` และ `model` ต่อการรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` ตาม canonical สำหรับ subagent override ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.config`: ออบเจกต์การกำหนดค่าที่ Plugin กำหนด (ตรวจสอบความถูกต้องโดย schema Plugin OpenClaw แบบ native เมื่อมี)
- การตั้งค่าบัญชี/runtime ของ Channel Plugin อยู่ภายใต้ `channels.<id>` และควรถูกอธิบายด้วยเมทาดาทา `channelConfigs` ของ manifest Plugin เจ้าของ ไม่ใช่โดย registry ตัวเลือกส่วนกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า provider web-fetch ของ Firecrawl
  - `apiKey`: API key ของ Firecrawl (รองรับ SecretRef) fallback ไปยัง `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบ legacy หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: base URL ของ API Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุ cache สูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นหาเว็บ Grok)
  - `enabled`: เปิดใช้งาน provider X Search
  - `model`: model Grok ที่จะใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phase และ threshold
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ Cron สำหรับการ sweep dreaming เต็มแต่ละครั้ง (`"0 3 * * *"` โดยค่าเริ่มต้น)
  - `model`: override model ของ subagent Dream Diary แบบไม่บังคับ ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาด model-unavailable จะลองใหม่หนึ่งครั้งด้วย model เริ่มต้นของ session; ความล้มเหลวด้าน trust หรือ allowlist จะไม่ fallback แบบเงียบๆ
  - นโยบาย phase และ threshold เป็นรายละเอียด implementation (ไม่ใช่คีย์การกำหนดค่าที่แสดงต่อผู้ใช้)
- การกำหนดค่า memory ทั้งหมดอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่า memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle Claude ที่เปิดใช้งานยังสามารถเพิ่มค่าเริ่มต้น Pi แบบฝังจาก `settings.json`; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ผ่านการ sanitize แล้ว ไม่ใช่เป็น patch การกำหนดค่า OpenClaw ดิบ
- `plugins.slots.memory`: เลือก id ของ Plugin memory ที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้งาน Plugin memory
- `plugins.slots.contextEngine`: เลือก id ของ Plugin context engine ที่ใช้งานอยู่; ค่าเริ่มต้นคือ `"legacy"` เว้นแต่คุณติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

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
- `tabCleanup` เรียกคืนแท็บ primary-agent ที่ติดตามไว้หลังจากไม่มีการใช้งานตามระยะเวลาที่กำหนด หรือเมื่อ
  session เกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมด cleanup แต่ละโหมดเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงยังคงเข้มงวดเป็นค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางของเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด endpoint ของโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias เดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบ attach-only (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการตรวจสอบการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่มีการจัดการจะใช้ค่าเริ่มต้นของ CDP ในเครื่อง
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ในเครื่องที่มีการจัดการ และอาจรายงานข้อผิดพลาดการเป็นเจ้าของพอร์ตในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถ attach บน
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่ได้
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อระบุเป้าหมายเป็น
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การดำเนินการที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS selector, hook การอัปโหลดไฟล์เดียว
  ไม่มีการ override timeout ของ dialog, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการดำเนินการแบบ batch
- โปรไฟล์ `openclaw` ในเครื่องที่มีการจัดการจะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกลเท่านั้น
- โปรไฟล์ในเครื่องที่มีการจัดการสามารถตั้งค่า `executablePath` เพื่อ override
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้ค่านี้เพื่อเรียกใช้โปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ในเครื่องที่มีการจัดการใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังจากเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลัง launch เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มทำงานสำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่า config ที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  รับ `~` และ `~/...` สำหรับไดเรกทอรี home ของ OS ก่อนการ launch Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วยเช่นกัน
- บริการควบคุม: loopback เท่านั้น (พอร์ตมาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่ม flag การ launch เพิ่มเติมให้กับการเริ่มต้น Chromium ในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือ flag debug)

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

- `seamColor`: สีเน้นสำหรับ chrome ของ UI แอป native (สี tint ของ Talk Mode bubble เป็นต้น)
- `assistant`: การ override ตัวตนของ Control UI หากไม่ตั้งค่า จะ fallback ไปยังตัวตนของ agent ที่ใช้งานอยู่

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

- `mode`: `local` (เรียกใช้ gateway) หรือ `remote` (เชื่อมต่อกับ gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`
- `port`: พอร์ตแบบมัลติเพล็กซ์พอร์ตเดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ Tailscale IP) หรือ `custom`
- **นามแฝง bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝง host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังบน `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะมาถึงบน `eth0` ดังนั้น gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นตามค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องมีการยืนยันตัวตนของ gateway ในทางปฏิบัติหมายถึง token/password ที่ใช้ร่วมกัน หรือ reverse proxy ที่รู้จักตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ดเริ่มต้นใช้งานจะสร้าง token ตามค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` ขั้นตอน startup และการติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองรายการและไม่ได้ตั้งค่า mode
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบชัดเจน ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; โหมดนี้ตั้งใจไม่เสนอในพรอมป์เริ่มต้นใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของ browser/user ให้ reverse proxy ที่รู้จักตัวตน และเชื่อถือ header ตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนด้วย Trusted Proxy](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่ง proxy ที่ **ไม่ใช่ loopback** ตามค่าเริ่มต้น; reverse proxy แบบ loopback บน host เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบน host เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback โดยตรงแบบ local ได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` header ตัวตนของ Tailscale Serve สามารถผ่านการยืนยันตัวตน Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) endpoint ของ HTTP API **ไม่** ใช้การยืนยันตัวตนผ่าน header Tailscale นั้น; endpoint เหล่านั้นจะใช้โหมดการยืนยันตัวตน HTTP ปกติของ gateway แทน โฟลว์แบบไม่มี token นี้ถือว่า host ของ gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนล้มเหลวแบบเลือกได้ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token จะถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`
  - บนเส้นทาง Control UI ของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกเรียงลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามผิดพลาดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานในคำขอที่สอง แทนที่ทั้งคู่จะวิ่งผ่านเป็นการไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับชุดทดสอบหรือ deployment proxy แบบเข้มงวด)
- ความพยายามยืนยันตัวตน WS ที่มีต้นทางจาก browser จะถูกจำกัดความเร็วเสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost ผ่าน browser)
- บน loopback การล็อกเอาต์จากต้นทาง browser เหล่านั้นจะแยกตามค่า `Origin`
  ที่ทำให้เป็นมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจาก origin localhost หนึ่งจะไม่ล็อก
  origin อื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องมีการยืนยันตัวตน)
- `controlUi.allowedOrigins`: รายการอนุญาต browser-origin อย่างชัดเจนสำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นเมื่อคาดว่าจะมีไคลเอนต์ browser จาก origin ที่ไม่ใช่ loopback
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ origin fallback จาก Host-header สำหรับ deployment ที่ตั้งใจพึ่งพานโยบาย origin จาก Host-header
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override ฉุกเฉินฝั่งไคลเอนต์ผ่านสภาพแวดล้อมของโปรเซส
  ที่อนุญาต plaintext `ws://` ไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้;
  ค่าเริ่มต้นยังคงอนุญาต plaintext เฉพาะ loopback ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการตั้งค่าเครือข่ายส่วนตัวของ browser เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่มีผลต่อไคลเอนต์
  Gateway WebSocket
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL HTTPS พื้นฐานสำหรับ APNs relay ภายนอกที่ใช้โดย build iOS ทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนที่รองรับ relay ไปยัง gateway URL นี้ต้องตรงกับ URL relay ที่คอมไพล์ไว้ใน build iOS
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`
- การลงทะเบียนที่รองรับ relay จะมอบหมายให้ตัวตน gateway เฉพาะ แอป iOS ที่จับคู่แล้วจะดึง `gateway.identity.get`, ใส่ตัวตนนั้นในการลงทะเบียน relay และส่งต่อสิทธิ์ส่งที่จำกัดตามการลงทะเบียนไปยัง gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บนั้นไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env ชั่วคราวสำหรับการตั้งค่า relay ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL relay HTTP แบบ loopback URL relay สำหรับ production ควรอยู่บน HTTPS
- `gateway.handshakeTimeoutMs`: timeout การจับมือ Gateway WebSocket ก่อนยืนยันตัวตน เป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` จะมีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บน host ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ local สามารถเชื่อมต่อได้ขณะที่การอุ่นเครื่อง startup ยังไม่เสถียร
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสอบสุขภาพ channel เป็นนาที ตั้งค่า `0` เพื่อปิดการ restart โดยตัวตรวจสอบสุขภาพทั่วระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ socket ค้างเป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวน restart สูงสุดโดยตัวตรวจสอบสุขภาพต่อ channel/account ในช่วงเวลาหนึ่งชั่วโมงแบบเลื่อน ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การยกเลิกเฉพาะ channel สำหรับการ restart โดยตัวตรวจสอบสุขภาพ ขณะที่ยังเปิดใช้ตัวตรวจสอบทั่วระบบอยู่
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override เฉพาะ account สำหรับ channel แบบหลาย account เมื่อตั้งค่าแล้ว ค่านี้จะมีลำดับความสำคัญเหนือ override ระดับ channel
- เส้นทางการเรียก gateway แบบ local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี remote fallback มาปกปิด)
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือ inject header ไคลเอนต์ที่ส่งต่อมา ระบุเฉพาะ proxy ที่คุณควบคุม รายการ loopback ยังใช้ได้สำหรับการตั้งค่า proxy/การตรวจจับ local บน host เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy local) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นคือ `false` เพื่อพฤติกรรมแบบ fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: รายการอนุญาต CIDR/IP แบบเลือกได้สำหรับการอนุมัติการจับคู่ node device ครั้งแรกโดยอัตโนมัติเมื่อไม่มี scope ที่ร้องขอ จะปิดใช้งานเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat โดยอัตโนมัติ และไม่อนุมัติ role, scope, metadata หรือการอัปเกรด public-key โดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ทั่วระบบสำหรับคำสั่ง node ที่ประกาศไว้หลังจากการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกเปิดใช้คำสั่ง node อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ค่าเริ่มต้นของแพลตฟอร์มหรือ allow ที่ระบุชัดเจนจะรวมคำสั่งนั้นอยู่ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่เพื่อให้ gateway จัดเก็บ snapshot คำสั่งที่อัปเดตแล้ว
- `gateway.tools.deny`: ชื่อ tool เพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny ค่าเริ่มต้น)
- `gateway.tools.allow`: ลบชื่อ tool ออกจากรายการ deny HTTP ค่าเริ่มต้น

</Accordion>

### endpoint ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานตามค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเพิ่มความปลอดภัยสำหรับ URL-input ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ที่ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- header เพิ่มความปลอดภัยสำหรับ response แบบเลือกได้:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับ origin HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตนด้วย Trusted Proxy](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ gateway หลายตัวบน host เดียวด้วยพอร์ตและ state dir ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flag เพื่อความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

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

- `enabled`: เปิดใช้ TLS termination ที่ listener ของ gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed local โดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์อย่างชัดเจน; สำหรับใช้ local/dev เท่านั้น
- `certPath`: path ระบบไฟล์ไปยังไฟล์ใบรับรอง TLS
- `keyPath`: path ระบบไฟล์ไปยังไฟล์ private key ของ TLS; จำกัดสิทธิ์การเข้าถึงไว้
- `caPath`: path ของ CA bundle แบบเลือกได้สำหรับการตรวจสอบไคลเอนต์หรือ trust chain แบบกำหนดเอง

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
  - `"off"`: ไม่สนใจการแก้ไขสด; การเปลี่ยนแปลงต้อง restart อย่างชัดเจน
  - `"restart"`: restart โปรเซส gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: ใช้การเปลี่ยนแปลงภายในโปรเซสโดยไม่ restart
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไป restart หากจำเป็น
- `debounceMs`: ช่วง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบเลือกได้เป็น ms เพื่อรอ operation ที่กำลังทำงานก่อนบังคับ restart ละไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรอไม่มีกำหนดและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

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

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
token ของ hook ใน query string จะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ต้อง**แตกต่าง**จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` เป็น `/` ไม่ได้; ให้ใช้เส้นทางย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หากการแมปหรือค่าที่ตั้งไว้ล่วงหน้าใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องเลือกใช้งานตัวเลือกนั้น

**เอนด์พอยต์:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ค่าได้ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์ด้วยเทมเพลตจะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่เส้นทางย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์เพย์โหลดสำหรับเส้นทางทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านค่าจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่าการกระทำของ hook
  - `transform.module` ต้องเป็นเส้นทางสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (เส้นทางแบบ absolute และการไต่ระดับไดเรกทอรีจะถูกปฏิเสธ)
- `agentId` กำหนดเส้นทางไปยัง agent เฉพาะ; ID ที่ไม่รู้จักจะย้อนกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบชัดเจน (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันแบบคงที่ที่ไม่บังคับ สำหรับการรัน hook agent โดยไม่มี `sessionKey` แบบชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันของการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` ได้ (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาต prefix ที่ไม่บังคับสำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อบังคับเมื่อการแมปหรือค่าที่ตั้งไว้ล่วงหน้าใด ๆ ใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` แทนที่ LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้งค่าแค็ตตาล็อกโมเดลไว้)

</Accordion>

### การผสานรวม Gmail

- ค่าที่ตั้งไว้ล่วงหน้า Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางต่อข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับเนมสเปซ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้แทนที่ค่าที่ตั้งไว้ล่วงหน้าด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- Gateway เริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูต หากมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากพร้อมกับ Gateway

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

- ให้บริการ HTML/CSS/JS และ A2UI ที่ agent แก้ไขได้ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะภายในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การยืนยันตัวตน Gateway (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- Node WebViews โดยทั่วไปไม่ส่งส่วนหัวการยืนยันตัวตน; หลังจากจับคู่และเชื่อมต่อ node แล้ว Gateway จะประกาศ URL ความสามารถแบบกำหนดขอบเขตตาม node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับเซสชัน WS ของ node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- ฉีดไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่างเปล่า
- ยังให้บริการ A2UI ที่ `/__openclaw__/a2ui/`
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

- `minimal` (ค่าเริ่มต้น): ละเว้น `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง และจะย้อนกลับไปใช้ `openclaw` หากไม่ใช่ แทนที่ได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### แบบพื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน unicast DNS-SD ภายใต้ `~/.openclaw/dns/` สำหรับการค้นหาข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

ตั้งค่า: `openclaw dns setup --apply`

---

## สภาพแวดล้อม

### `env` (ตัวแปร env แบบ inline)

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกใช้ต่อเมื่อ env ของกระบวนการไม่มีคีย์นั้นเท่านั้น.
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งสองไม่เขียนทับตัวแปรที่มีอยู่).
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ขาดหายจากโปรไฟล์เชลล์ล็อกอินของคุณ.
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด.

### การแทนค่าตัวแปรสภาพแวดล้อม

อ้างอิงตัวแปรสภาพแวดล้อมในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`.
- ตัวแปรที่ขาดหายหรือว่างจะทำให้เกิดข้อผิดพลาดเมื่อโหลด config.
- Escape ด้วย `$${VAR}` เพื่อให้ได้ `${VAR}` แบบตัวอักษรจริง.
- ใช้งานได้กับ `$include`.

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเสริม: ค่าข้อความธรรมดายังใช้งานได้.

### `SecretRef`

ใช้รูปทรงอ็อบเจกต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: ตัวชี้ JSON แบบสัมบูรณ์ (ตัวอย่างเช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มีเซกเมนต์พาธที่คั่นด้วยสแลชเป็น `.` หรือ `..` (ตัวอย่างเช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลประจำตัวที่รองรับ

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลประจำตัวของ SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายพาธข้อมูลประจำตัว `openclaw.json` ที่รองรับ.
- refs ของ `auth-profiles.json` รวมอยู่ในการแก้ค่า runtime และขอบเขตการ audit.

### Config ของผู้ให้บริการความลับ

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

- ผู้ให้บริการ `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue).
- พาธของผู้ให้บริการ file และ exec จะ fail closed เมื่อการตรวจสอบ Windows ACL ใช้งานไม่ได้. ตั้งค่า `allowInsecurePath: true` เฉพาะกับพาธที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้.
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์ และใช้ payload โปรโตคอลผ่าน stdin/stdout.
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ. ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink พร้อมตรวจสอบพาธเป้าหมายที่ resolve แล้ว.
- หากกำหนดค่า `trustedDirs` การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่ resolve แล้ว.
- สภาพแวดล้อมของ child ของ `exec` เป็นแบบขั้นต่ำตามค่าเริ่มต้น; ส่งตัวแปรที่ต้องใช้โดยระบุอย่างชัดเจนด้วย `passEnv`.
- การอ้างอิงความลับจะถูก resolve ตอน activation เป็น snapshot ในหน่วยความจำ จากนั้นพาธคำขอจะอ่านเฉพาะ snapshot.
- การกรอง active-surface จะใช้ระหว่าง activation: refs ที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้จะทำให้ startup/reload ล้มเหลว ขณะที่พื้นผิวที่ไม่ active จะถูกข้ามพร้อม diagnostics.

---

## การจัดเก็บการยืนยันตัวตน

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

- โปรไฟล์ต่อเอเจนต์ถูกจัดเก็บที่ `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลประจำตัวแบบคงที่.
- แมป `auth-profiles.json` แบบ flat รุ่นเก่า เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key แบบมาตรฐาน `provider:default` พร้อมสำรองข้อมูลเป็น `.legacy-flat.*.bak`.
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลประจำตัว auth-profile ที่มี SecretRef หนุนหลัง.
- ข้อมูลประจำตัว runtime แบบคงที่มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่รุ่นเก่าจะถูกล้างเมื่อพบ.
- การนำเข้า OAuth รุ่นเก่ามาจาก `~/.openclaw/credentials/oauth.json`.
- ดู [OAuth](/th/concepts/oauth).
- พฤติกรรม runtime ของความลับและเครื่องมือ `audit/configure/apply`: [การจัดการความลับ](/th/gateway/secrets).

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

- `billingBackoffHours`: backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวเพราะข้อผิดพลาด
  billing/เครดิตไม่เพียงพอจริง (ค่าเริ่มต้น: `5`). ข้อความ billing ที่ชัดเจนยัง
  อาจเข้ามาที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการ
  จะยังจำกัดขอบเขตอยู่กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (ตัวอย่างเช่น OpenRouter
  `Key limit exceeded`). HTTP `402` แบบ retryable สำหรับ usage-window หรือ
  ข้อความ spend-limit ของ organization/workspace จะยังอยู่ในพาธ `rate_limit`
  แทน.
- `billingBackoffHoursByProvider`: overrides ต่อผู้ให้บริการแบบไม่บังคับสำหรับชั่วโมง backoff ของ billing.
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ billing backoff (ค่าเริ่มต้น: `24`).
- `authPermanentBackoffMinutes`: backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`).
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`).
- `failureWindowHours`: rolling window เป็นชั่วโมงที่ใช้กับตัวนับ backoff (ค่าเริ่มต้น: `24`).
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ของผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`). รูปแบบ provider-busy เช่น `ModelNotReadyException` จะเข้ามาที่นี่.
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อน retry การหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่ overloaded (ค่าเริ่มต้น: `0`).
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ของผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`). bucket rate-limit นั้นรวมข้อความที่มีรูปทรงจากผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, และ `resource exhausted`.

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

- ไฟล์บันทึกเริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้งค่า `logging.file` สำหรับพาธคงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดสูงสุดของไฟล์บันทึกที่ใช้งานอยู่เป็นไบต์ก่อนหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์ถาวรแบบมีหมายเลขไว้ได้สูงสุดห้าไฟล์ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบพยายามเต็มที่สำหรับเอาต์พุตคอนโซล, ไฟล์บันทึก, ระเบียนบันทึก OTLP และข้อความถอดความเซสชันที่บันทึกไว้ `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบายบันทึก/ถอดความทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปิดบังความลับก่อนส่งออก

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
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตบันทึกแบบเจาะจง (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุเป็น ms สำหรับส่งคำเตือนเซสชันค้างขณะที่เซสชันยังอยู่ในสถานะประมวลผล
- `otel.enabled`: เปิดใช้ไปป์ไลน์การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของตัวรวบรวมสำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: ปลายทาง OTLP เฉพาะสัญญาณแบบไม่บังคับ เมื่อตั้งค่าแล้ว จะเขียนทับ `otel.endpoint` เฉพาะสำหรับสัญญาณนั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: ส่วนหัวเมทาดาทา HTTP/gRPC เพิ่มเติมที่ส่งไปกับคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลาล้างข้อมูล telemetry ตามคาบเป็น ms
- `otel.captureContent`: การบันทึกเนื้อหาดิบสำหรับแอตทริบิวต์ span ของ OTEL แบบเลือกเปิด ค่าเริ่มต้นคือปิด บูลีน `true` จะบันทึกเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบออบเจ็กต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ provider span ของ GenAI รุ่นทดลองล่าสุด โดยค่าเริ่มต้น span จะเก็บแอตทริบิวต์ `gen_ai.system` แบบเดิมไว้เพื่อความเข้ากันได้; metrics ของ GenAI ใช้แอตทริบิวต์เชิงความหมายแบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK ระดับโกลบอลไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะที่ยังคงให้ listener การวินิจฉัยทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อมปลายทางเฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปช็อต cache trace สำหรับการรันแบบฝัง (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุต cache trace (ค่าเริ่มต้นทั้งหมด: `true`)

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

- `channel`: ช่องทางเผยแพร่สำหรับการติดตั้ง npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ความล่าช้าขั้นต่ำเป็นชั่วโมงก่อนใช้การอัปเดตอัตโนมัติในช่องทาง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการปล่อยอัปเดตเพิ่มเติมสำหรับช่องทาง stable เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
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

- `enabled`: เกตฟีเจอร์ ACP ระดับโกลบอล (ค่าเริ่มต้น: `true`; ตั้งค่า `false` เพื่อซ่อน ACP dispatch และ affordance สำหรับ spawn)
- `dispatch.enabled`: เกตแยกต่างหากสำหรับ ACP session turn dispatch (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อให้คำสั่ง ACP ยังคงพร้อมใช้งานขณะบล็อกการดำเนินการ
- `backend`: id ของแบ็กเอนด์ runtime ACP เริ่มต้น (ต้องตรงกับ Plugin runtime ACP ที่ลงทะเบียนไว้)
  หากตั้งค่า `plugins.allow` ให้รวม id ของ Plugin แบ็กเอนด์ (เช่น `acpx`) มิฉะนั้น Plugin เริ่มต้นที่รวมมาในชุดจะไม่โหลด
- `defaultAgent`: id เอเจนต์เป้าหมาย ACP สำรองเมื่อ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: รายการอนุญาตของ id เอเจนต์ที่อนุญาตสำหรับเซสชัน runtime ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนเซสชัน ACP ที่ใช้งานพร้อมกันได้สูงสุด
- `stream.coalesceIdleMs`: หน้าต่างล้างข้อมูลเมื่อว่างเป็น ms สำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยก projection ของบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนกว่าจะถึงเหตุการณ์สิ้นสุดของ turn
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นหลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตผู้ช่วยสูงสุดที่ project ต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ project
- `stream.tagVisibility`: ระเบียนชื่อแท็กไปยังการเขียนทับการมองเห็นแบบบูลีนสำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: TTL เมื่อว่างเป็นนาทีสำหรับ worker เซสชัน ACP ก่อนมีสิทธิ์ล้างข้อมูล
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อบูตสแตรปสภาพแวดล้อม runtime ACP

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

- `cli.banner.taglineMode` ควบคุมรูปแบบ tagline ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): tagline ตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: tagline กลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังคงแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่ tagline) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## วิซาร์ด

เมทาดาทาที่เขียนโดยโฟลว์การตั้งค่าแบบนำทางของ CLI (`onboard`, `configure`, `doctor`):

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

## บริดจ์ (แบบเดิม, ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่รวม TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมา config อีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน cron แบบแยกที่เสร็จสิ้นแล้วก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้างข้อความถอดความ cron ที่ถูกลบและเก็บถาวร ค่าเริ่มต้น: `24h`; ตั้งค่า `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์บันทึกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดข้อมูล ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดล่าสุดที่คงไว้เมื่อการตัดบันทึกการรันถูกทริกเกอร์ ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง cron Webhook แบบ POST (`delivery.mode = "webhook"`) หากละไว้จะไม่ส่งส่วนหัว auth
- `webhook`: URL Webhook สำรองแบบเดิมที่เลิกใช้แล้ว (http/https) ใช้เฉพาะสำหรับงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`

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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงาน one-shot เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของความล่าช้า backoff เป็น ms สำหรับแต่ละครั้งที่ลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองใหม่ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อให้ลองใหม่กับประเภทชั่วคราวทั้งหมด

ใช้กับงาน cron แบบ one-shot เท่านั้น งานที่เกิดซ้ำใช้การจัดการความล้มเหลวแยกต่างหาก

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

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับงาน cron (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันเข้ากับเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่กระทบ backoff ของข้อผิดพลาดการดำเนินการ
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: id บัญชีหรือช่องทางแบบไม่บังคับเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบ announce `"last"` จะใช้ช่องทางส่งล่าสุดที่ทราบซ้ำ
- `to`: เป้าหมาย announce แบบระบุชัดเจนหรือ URL ของ Webhook จำเป็นสำหรับโหมด webhook
- `accountId`: การแทนที่บัญชีแบบไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` รายงานระดับงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งแบบส่วนกลางและระดับงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การรัน Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวแทนเทมเพลตที่ถูกขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                     |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวครอบประวัติ/ผู้ส่ง)          |
| `{{BodyStripped}}` | เนื้อหาที่ลบการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                  |
| `{{MessageSid}}`   | ID ข้อความของช่องทาง                            |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                          |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                   |
| `{{MediaUrl}}`     | URL เทียมของสื่อขาเข้า                          |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)              |
| `{{Transcript}}`   | ข้อความถอดเสียง                                 |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ไขแล้วสำหรับรายการ CLI          |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ไขแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                        |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                 |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)         |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)        |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)    |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (WhatsApp, Telegram, Discord ฯลฯ) |

---

## การ include การกำหนดค่า (`$include`)

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

- ไฟล์เดียว: แทนที่ออบเจ็กต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: ผสานแบบลึกตามลำดับ (รายการหลังแทนที่รายการก่อนหน้า)
- คีย์พี่น้อง: ผสานหลังจาก include (แทนที่ค่าที่ include มา)
- include แบบซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: แก้ไขโดยอิงกับไฟล์ที่ทำการ include แต่ต้องอยู่ภายในไดเรกทอรีการกำหนดค่าระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบแบบ absolute/`../` อนุญาตเฉพาะเมื่อยังแก้ไขแล้วอยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่หนุนด้วย include แบบไฟล์เดียว จะเขียนผ่านไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อยให้ `openclaw.json` คงเดิม
- include ที่ราก, อาร์เรย์ include, และ include ที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนการทำให้การกำหนดค่าแบนลง
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดการแยกวิเคราะห์ และ include แบบวนซ้ำ

---

_เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
