---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อยเฉพาะ
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-02T10:15:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa8aeec6143ae70905e75f1034005c97c3a72fcaa34f14f61294dece561f4ce6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการกำหนดค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมที่เน้นงาน ดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการกำหนดค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ channel และ Plugin เป็นเจ้าของ รวมถึงตัวเลือกเชิงลึกของหน่วยความจำ/QMD อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema แบบสดที่ใช้สำหรับการตรวจสอบความถูกต้องและอินเทอร์เฟซควบคุม โดยรวมเมตาดาต้าของบันเดิล/Plugin/channel เมื่อมี
- `config.schema.lookup` คืนค่าโหนดสคีมาหนึ่งรายการตามขอบเขตพาธสำหรับเครื่องมือเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮช baseline ของเอกสารการกำหนดค่าเทียบกับพื้นผิวสคีมาปัจจุบัน

พาธค้นหา agent: ใช้การกระทำของเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับเอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้ [การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำที่เน้นงาน และใช้หน้านี้สำหรับแผนที่ฟิลด์ที่กว้างขึ้น ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะทาง:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการกำหนดค่า dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้า channel/Plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะ channel

รูปแบบการกำหนดค่าคือ **JSON5** (อนุญาตความคิดเห็น + comma ท้ายรายการ) ทุกฟิลด์เป็นตัวเลือก — OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## Channel

คีย์การกำหนดค่าราย channel ย้ายไปยังหน้าเฉพาะแล้ว — ดู [การกำหนดค่า — channels](/th/gateway/config-channels) สำหรับ `channels.*` ซึ่งรวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และ channel แบบ bundled อื่นๆ (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การกั้นด้วย mention)

## ค่าเริ่มต้นของ agent, multi-agent, session และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว — ดู [การกำหนดค่า — agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, หน่วยความจำ, สื่อ, Skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูก multi-agent)
- `session.*` (วงจรชีวิต session, Compaction, pruning)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: รหัส locale BCP 47 แบบตัวเลือกสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงช่วงเวลาหยุดพูดเริ่มต้นของแพลตฟอร์มก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและ provider แบบกำหนดเอง

นโยบายเครื่องมือ, toggle เชิงทดลอง, การกำหนดค่าเครื่องมือที่มี provider รองรับ และการตั้งค่า provider / base-URL แบบกำหนดเองย้ายไปยังหน้าเฉพาะแล้ว — ดู [การกำหนดค่า — เครื่องมือและ provider แบบกำหนดเอง](/th/gateway/config-tools)

## Model

คำจำกัดความของ provider, allowlist ของ model และการตั้งค่า provider แบบกำหนดเองอยู่ใน [การกำหนดค่า — เครื่องมือและ provider แบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) root `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อก model ระดับ global ด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแค็ตตาล็อก provider (`merge` หรือ `replace`)
- `models.providers`: แผนที่ provider แบบกำหนดเองที่ใช้ provider id เป็นคีย์
- `models.pricing.enabled`: ควบคุมการ bootstrap ราคาพื้นหลัง เมื่อเป็น `false` การเริ่มต้น Gateway จะข้ามการดึงแค็ตตาล็อกราคาของ OpenRouter และ LiteLLM ค่า `models.providers.*.models[].cost` ที่กำหนดไว้ยังคงใช้ได้สำหรับการประมาณต้นทุนแบบ local

## MCP

คำจำกัดความของเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูกใช้โดย Pi แบบฝังและ adapter รันไทม์อื่นๆ คำสั่ง `openclaw mcp list`, `show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อกับเซิร์ฟเวอร์ปลายทางระหว่างการแก้ไขการกำหนดค่า

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

- `mcp.servers`: คำจำกัดความเซิร์ฟเวอร์ MCP แบบ stdio หรือ remote ที่ตั้งชื่อไว้สำหรับรันไทม์ที่เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้ รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`; `type: "http"` เป็น alias ที่เป็น native ของ CLI ซึ่ง `openclaw mcp set` และ `openclaw doctor --fix` จะ normalize ไปยังฟิลด์ `transport` ตาม canonical
- `mcp.sessionIdleTtlMs`: TTL เมื่อ idle สำหรับรันไทม์ MCP แบบ bundled ที่มีขอบเขตตาม session การรันแบบฝัง one-shot ขอ cleanup เมื่อจบการรัน TTL นี้เป็นตัวรองรับสุดท้ายสำหรับ session ที่มีอายุยาวและผู้เรียกในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` hot-apply โดย dispose รันไทม์ MCP ของ session ที่แคชไว้ การค้นพบ/ใช้เครื่องมือครั้งถัดไปจะสร้างใหม่จากการกำหนดค่าใหม่ ดังนั้นรายการ `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ [backend ของ CLI](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรมรันไทม์

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

- `allowBundled`: allowlist แบบตัวเลือกสำหรับ Skills แบบ bundled เท่านั้น (Skills แบบ managed/workspace ไม่ได้รับผลกระทบ)
- `load.extraDirs`: root ของ skill ที่ใช้ร่วมกันเพิ่มเติม (precedence ต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือก installer ของ Homebrew ก่อนเมื่อมี `brew` พร้อมใช้งาน ก่อน fallback ไปยังชนิด installer อื่น
- `install.nodeManager`: ค่ากำหนด installer ของ node สำหรับสเปก `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้จะเป็น bundled/installed
- `entries.<skillKey>.apiKey`: ช่องทางลัดสำหรับ Skills ที่ประกาศ env var หลัก (สตริง plaintext หรือออบเจ็กต์ SecretRef)

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
- การค้นพบรองรับ Plugin ของ OpenClaw แบบ native รวมถึง bundle ของ Codex และ bundle ของ Claude ที่เข้ากันได้ รวมถึง bundle layout เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการกำหนดค่าต้อง restart Gateway**
- `allow`: allowlist แบบตัวเลือก (โหลดเฉพาะ Plugin ที่ระบุ) `deny` ชนะ
- `plugins.entries.<id>.apiKey`: ฟิลด์ช่องทางลัด API key ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แผนที่ env var ที่มีขอบเขตตาม Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไข prompt จาก `before_agent_start` แบบ legacy ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบ legacy ไว้ ใช้กับ hook ของ Plugin แบบ native และไดเรกทอรี hook ที่ bundle ให้มาซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่ไม่ใช่ bundled และเชื่อถือได้อาจอ่านเนื้อหา conversation ดิบจาก hook แบบ typed เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนเพื่อขอ override `provider` และ `model` ต่อการรันสำหรับการรัน subagent พื้นหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบตัวเลือกของเป้าหมาย canonical `provider/model` สำหรับ override ของ subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.config`: ออบเจ็กต์การกำหนดค่าที่ Plugin กำหนด (ตรวจสอบความถูกต้องด้วยสคีมา Plugin ของ OpenClaw แบบ native เมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ channel Plugin อยู่ภายใต้ `channels.<id>` และควรถูกอธิบายโดยเมตาดาต้า `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดย registry ตัวเลือกกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า provider web-fetch ของ Firecrawl
  - `apiKey`: API key ของ Firecrawl (รับ SecretRef) fallback ไปยัง `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบ legacy หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: base URL ของ API Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; override แบบ self-hosted ต้องชี้ไปยัง endpoint private/internal)
  - `onlyMainContent`: แยกเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุ cache สูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นเว็บของ Grok)
  - `enabled`: เปิดใช้ provider X Search
  - `model`: model ของ Grok ที่จะใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phase และ threshold
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ Cron สำหรับการกวาด dreaming เต็มรูปแบบแต่ละครั้ง (`"0 3 * * *"` เป็นค่าเริ่มต้น)
  - `model`: override model ของ subagent Dream Diary แบบตัวเลือก ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาด model-unavailable จะลองใหม่หนึ่งครั้งด้วย model เริ่มต้นของ session; ความล้มเหลวด้าน trust หรือ allowlist จะไม่ fallback แบบเงียบๆ
  - นโยบาย phase และ threshold เป็นรายละเอียดการนำไปใช้งาน (ไม่ใช่คีย์การกำหนดค่าที่เปิดให้ผู้ใช้)
- การกำหนดค่าหน่วยความจำทั้งหมดอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin ของ bundle Claude ที่เปิดใช้ยังสามารถสนับสนุนค่าเริ่มต้น Pi แบบฝังจาก `settings.json`; OpenClaw ใช้ค่านั้นเป็นการตั้งค่า agent ที่ sanitize แล้ว ไม่ใช่ patch การกำหนดค่า OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือก id ของ Plugin หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้งาน Plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือก id ของ Plugin context engine ที่ใช้งานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณจะติดตั้งและเลือก engine อื่น

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
- `tabCleanup` เรียกคืนแท็บเอเจนต์หลักที่ติดตามไว้หลังจากไม่มีการใช้งาน หรือเมื่อเซสชันมีจำนวนแท็บเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อปิดใช้งานโหมดล้างข้อมูลแต่ละรายการ
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางของเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด เอ็นด์พอยต์โปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะชื่อแฝงเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งานการเริ่ม/หยุด/รีเซ็ต)
- `profiles.*.cdpUrl` ยอมรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL WebSocket ของ DevTools โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่จัดการไว้จะยังใช้ค่าเริ่มต้น CDP ภายในเครื่อง
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ที่จัดการในเครื่อง และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` คงข้อจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้:
  การกระทำที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS selector, ฮุกอัปโหลดไฟล์เดียว,
  ไม่มีการเขียนทับเวลาหมดอายุของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การสกัดกั้นการดาวน์โหลด หรือการกระทำแบบชุด
- โปรไฟล์ `openclaw` ที่จัดการในเครื่องจะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ให้ตั้งค่า
  `cdpUrl` โดยชัดเจนเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ที่จัดการในเครื่องสามารถตั้งค่า `executablePath` เพื่อเขียนทับ
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์ใน Brave
- โปรไฟล์ที่จัดการในเครื่องใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ HTTP ของ Chrome CDP
  หลังเริ่มกระบวนการ และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดใช้งาน เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งขันกับการเริ่มต้น ค่าทั้งสองต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  ยอมรับ `~` และ `~/...` สำหรับไดเรกทอรีโฮมของ OS ก่อนเปิด Chromium
  `userDataDir` ต่อโปรไฟล์ในโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วย
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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (สีฟอง Talk Mode เป็นต้น)
- `assistant`: การเขียนทับตัวตน Control UI ย้อนกลับไปใช้ตัวตนเอเจนต์ที่ใช้งานอยู่

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

<Accordion title="Gateway field details">

- `mode`: `local` (รัน Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่เป็น `local`.
- `port`: พอร์ตแบบมัลติเพล็กซ์เดียวสำหรับ WS + HTTP. ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`.
- **นามแฝง bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังบน `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่ายแบบ bridge ของ Docker (`-p 18789:18789`) ทราฟฟิกจะเข้ามาทาง `eth0` ทำให้เข้าถึง Gateway ไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ
- **การตรวจสอบสิทธิ์**: จำเป็นตามค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การตรวจสอบสิทธิ์ของ Gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ด onboarding จะสร้างโทเค็นตามค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` ขั้นตอนเริ่มทำงานและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างและไม่ได้ตั้งค่าโหมด
- `gateway.auth.mode: "none"`: โหมดไม่มีการตรวจสอบสิทธิ์แบบชัดเจน ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; โหมดนี้จงใจไม่ถูกเสนอโดยพรอมป์ onboarding
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการตรวจสอบสิทธิ์ของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือเฮดเดอร์ตัวตนจาก `gateway.trustedProxies` (ดู [การตรวจสอบสิทธิ์ผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งพร็อกซีที่ **ไม่ใช่ loopback** ตามค่าเริ่มต้น; reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็นทางสำรองโดยตรงในเครื่องได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` เฮดเดอร์ตัวตนของ Tailscale Serve สามารถใช้ผ่านการตรวจสอบสิทธิ์ของส่วนติดต่อควบคุม/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) เอนด์พอยต์ HTTP API **ไม่** ใช้การตรวจสอบสิทธิ์ผ่านเฮดเดอร์ Tailscale นี้; แต่จะใช้โหมดการตรวจสอบสิทธิ์ HTTP ปกติของ Gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดความถี่สำหรับการตรวจสอบสิทธิ์ที่ล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการตรวจสอบสิทธิ์ (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`
  - บนเส้นทางส่วนติดต่อควบคุมแบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามผิดพลาดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานที่คำขอที่สอง แทนที่ทั้งสองคำขอจะวิ่งผ่านพร้อมกันเป็นการไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดความถี่ด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีที่เข้มงวด)
- ความพยายามตรวจสอบสิทธิ์ WS ที่มีต้นทางจากเบราว์เซอร์จะถูกจำกัดความถี่เสมอ โดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการเดารหัสผ่านแบบ brute force บน localhost ผ่านเบราว์เซอร์)
- บน loopback การล็อกเอาต์จากต้นทางเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ทำให้เป็นรูปแบบมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่ล็อกเอาต์
  ต้นทางอื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้การตรวจสอบสิทธิ์)
- `controlUi.allowedOrigins`: รายการอนุญาตต้นทางเบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จากต้นทางที่ไม่ใช่ loopback
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้การ fallback ต้นทางจากเฮดเดอร์ Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบายต้นทางจากเฮดเดอร์ Host
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: การแทนที่ฉุกเฉินผ่านสภาพแวดล้อมกระบวนการฝั่งไคลเอนต์
  ที่อนุญาต plaintext `ws://` ไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้;
  ค่าเริ่มต้นยังคงเป็น plaintext เฉพาะ loopback เท่านั้น ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการตั้งค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่มีผลต่อไคลเอนต์ WebSocket
  ของ Gateway
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการตรวจสอบสิทธิ์ของ Gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL ฐาน HTTPS สำหรับรีเลย์ APNs ภายนอกที่ใช้โดยบิลด์ iOS ทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนที่มีรีเลย์รองรับไปยัง Gateway URL นี้ต้องตรงกับ URL รีเลย์ที่คอมไพล์เข้าไปในบิลด์ iOS
- `gateway.push.apns.relay.timeoutMs`: เวลาหมดอายุการส่งจาก Gateway ไปยังรีเลย์ หน่วยเป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`
- การลงทะเบียนที่มีรีเลย์รองรับจะถูกมอบหมายให้ตัวตนของ Gateway ที่เฉพาะเจาะจง แอป iOS ที่จับคู่แล้วจะดึง `gateway.identity.get` รวมตัวตนนั้นในการลงทะเบียนรีเลย์ และส่งต่อสิทธิ์อนุญาตการส่งตามขอบเขตการลงทะเบียนไปยัง Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่เก็บไว้นั้นไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: การแทนที่ env ชั่วคราวสำหรับการตั้งค่ารีเลย์ด้านบน
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL รีเลย์ HTTP แบบ loopback URL รีเลย์สำหรับ production ควรคงอยู่บน HTTPS
- `gateway.handshakeTimeoutMs`: เวลาหมดอายุ handshake ของ WebSocket ของ Gateway ก่อนตรวจสอบสิทธิ์ หน่วยเป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ในเครื่องสามารถเชื่อมต่อได้ขณะการ warmup ตอนเริ่มต้นยังไม่เสถียรเต็มที่
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวเฝ้าดูสุขภาพช่องทาง หน่วยเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ทโดยตัวเฝ้าดูสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ซ็อกเก็ตค้าง หน่วยเป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนรีสตาร์ทสูงสุดโดยตัวเฝ้าดูสุขภาพต่อช่องทาง/บัญชีในช่วงหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การเลือกไม่ใช้การรีสตาร์ทโดยตัวเฝ้าดูสุขภาพรายช่องทาง ขณะที่ยังเปิดตัวเฝ้าดูระดับ global ไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การแทนที่รายบัญชีสำหรับช่องทางหลายบัญชี เมื่อถูกตั้งค่า จะมีลำดับความสำคัญเหนือการแทนที่ระดับช่องทาง
- เส้นทางเรียก Gateway ในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี fallback ระยะไกลมาบังปัญหา)
- `trustedProxies`: IP ของ reverse proxy ที่ยุติ TLS หรือฉีดเฮดเดอร์ forwarded-client ระบุเฉพาะพร็อกซีที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าพร็อกซีบนโฮสต์เดียวกัน/การตรวจจับในเครื่อง (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback เข้าเงื่อนไขสำหรับ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` สำหรับพฤติกรรมแบบ fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: รายการอนุญาต CIDR/IP แบบไม่บังคับสำหรับอนุมัติการจับคู่อุปกรณ์โหนดครั้งแรกโดยอัตโนมัติเมื่อไม่มีขอบเขตที่ร้องขอ ถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/เบราว์เซอร์/ส่วนติดต่อควบคุม/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key โดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ระดับ global สำหรับคำสั่งโหนดที่ประกาศ หลังจากการจับคู่และการประเมินรายการอนุญาตของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกใช้คำสั่งโหนดอันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ค่าเริ่มต้นของแพลตฟอร์มหรือ allow แบบชัดเจนจะรวมคำนั้นไว้ หลังจากโหนดเปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ Gateway เก็บสแนปช็อตคำสั่งที่อัปเดต
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny ค่าเริ่มต้น)
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการ deny HTTP ค่าเริ่มต้น

</Accordion>

### เอนด์พอยต์ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานตามค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความปลอดภัยอินพุต URL ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    รายการอนุญาตว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- เฮดเดอร์เสริมความปลอดภัยของการตอบกลับแบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม; ดู [การตรวจสอบสิทธิ์ผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

รัน Gateway หลายตัวบนโฮสต์เดียวด้วยพอร์ตและไดเรกทอรีสถานะที่ไม่ซ้ำกัน:

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
- `autoGenerate`: สร้างคู่ใบรับรอง/กุญแจแบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; สำหรับการใช้งาน local/dev เท่านั้น
- `certPath`: พาธไฟล์ระบบไปยังไฟล์ใบรับรอง TLS
- `keyPath`: พาธไฟล์ระบบไปยังไฟล์ private key ของ TLS; ควรจำกัดสิทธิ์ไว้
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

- `mode`: ควบคุมวิธีนำการแก้ไขคอนฟิกไปใช้ขณะรันไทม์
  - `"off"`: ไม่สนใจการแก้ไขสด; การเปลี่ยนแปลงต้องรีสตาร์ทอย่างชัดเจน
  - `"restart"`: รีสตาร์ทกระบวนการ Gateway ทุกครั้งเมื่อคอนฟิกเปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ภายในกระบวนการโดยไม่รีสตาร์ท
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไปรีสตาร์ทหากจำเป็น
- `debounceMs`: หน้าต่าง debounce หน่วยเป็น ms ก่อนนำการเปลี่ยนแปลงคอนฟิกไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับ หน่วยเป็น ms เพื่อรอการดำเนินการที่กำลังทำงานอยู่ก่อนบังคับรีสตาร์ท เว้นไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรอไม่จำกัดเวลาและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

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

การตรวจสอบสิทธิ์: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
โทเค็น hook ใน query-string จะถูกปฏิเสธ

หมายเหตุการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ต้องไม่เป็น `/`; ให้ใช้เส้นทางย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หากการแมปหรือพรีเซ็ตใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องเลือกใช้งานตัวเลือกนี้

**เอนด์พอยต์:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก payload ของคำขอจะยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ไขผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่เส้นทางย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ payload สำหรับเส้นทางทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านค่าจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่ส่งคืนการกระทำของ hook
  - `transform.module` ต้องเป็นเส้นทางสัมพัทธ์และต้องอยู่ภายใน `hooks.transformsDir` (เส้นทางสัมบูรณ์และการ traversal จะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี skill ใน workspace จะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าเส้นทางนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform ไปยังไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` กำหนดเส้นทางไปยัง agent เฉพาะ; ID ที่ไม่รู้จักจะย้อนกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบชัดเจน (`*` หรือเว้นไว้ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันแบบคงที่ที่เป็นทางเลือกสำหรับการรัน hook agent ที่ไม่มี `sessionKey` แบบชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันของการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการ prefix ที่อนุญาตแบบเป็นทางเลือกสำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` ค่านี้จะกลายเป็นสิ่งจำเป็นเมื่อการแมปหรือพรีเซ็ตใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` แทนที่ LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้งค่าแค็ตตาล็อกโมเดลไว้)

</Accordion>

### การผสานการทำงานกับ Gmail

- พรีเซ็ต Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางต่อข้อความไว้อย่างนั้น ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องการ `hooks.allowRequestSessionKey: false` ให้แทนที่พรีเซ็ตด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- Gateway จะเริ่ม `gog gmail watch serve` อัตโนมัติเมื่อบูตหากกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
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

- ให้บริการ HTML/CSS/JS ที่ agent แก้ไขได้และ A2UI ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะภายในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การยืนยันตัวตนของ Gateway (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่งส่วนหัว auth; หลังจาก node จับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ URL ความสามารถที่มีขอบเขตตาม node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับเซสชัน WS ของ node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback แบบอิง IP
- ฉีดไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่าง
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต gateway
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
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง และย้อนกลับไปใช้ `openclaw` หากไม่ถูกต้อง แทนที่ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน unicast DNS-SD ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้ร่วมกับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`

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

- ตัวแปร env แบบอินไลน์จะถูกนำไปใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งสองไม่แทนที่ตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ขาดหายจากโปรไฟล์ login shell ของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

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
- ตัวแปรที่ขาดหาย/ว่างจะทำให้เกิดข้อผิดพลาดตอนโหลด config
- escape ด้วย `$${VAR}` สำหรับ `${VAR}` แบบ literal
- ใช้ได้กับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเติม: ค่าข้อความธรรมดายังคงใช้ได้

### `SecretRef`

ใช้รูปแบบอ็อบเจกต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบสัมบูรณ์ (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มี segment ของเส้นทางที่คั่นด้วย slash เป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิว credential ที่รองรับ

- เมทริกซ์ canonical: [พื้นผิว credential ของ SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยังเส้นทาง credential ของ `openclaw.json` ที่รองรับ
- การอ้างอิงใน `auth-profiles.json` รวมอยู่ในการแก้ค่า runtime และความครอบคลุมของ audit

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

- ผู้ให้บริการ `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- เส้นทางผู้ให้บริการ file และ exec จะล้มเหลวแบบปิดเมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับเส้นทางที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้
- ผู้ให้บริการ `exec` ต้องใช้เส้นทาง `command` แบบสัมบูรณ์และใช้ protocol payloads บน stdin/stdout
- โดยค่าเริ่มต้น เส้นทางคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตเส้นทาง symlink พร้อมตรวจสอบเส้นทางเป้าหมายที่แก้ค่าแล้ว
- หากกำหนดค่า `trustedDirs` การตรวจสอบ trusted-dir จะใช้กับเส้นทางเป้าหมายที่แก้ค่าแล้ว
- สภาพแวดล้อมของ child `exec` มีค่าเริ่มต้นเป็นแบบน้อยที่สุด; ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูกแก้ค่าเมื่อ activation เป็น snapshot ในหน่วยความจำ จากนั้นเส้นทางคำขอจะอ่านเฉพาะ snapshot
- การกรอง active-surface จะนำไปใช้ระหว่าง activation: การอ้างอิงที่แก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ใช้งานจะถูกข้ามพร้อม diagnostics

---

## ที่เก็บ Auth

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
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมด credential แบบคงที่
- แมป `auth-profiles.json` แบบ flat เดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` เขียนใหม่เป็นโปรไฟล์ API-key แบบ canonical `provider:default` พร้อมสำรองข้อมูล `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับ credential ของ auth-profile ที่อิง SecretRef
- credential runtime แบบคงที่มาจาก snapshot ที่แก้ค่าแล้วในหน่วยความจำ; รายการ `auth.json` แบบ static เดิมจะถูกล้างเมื่อพบ
- การนำเข้า OAuth เดิมจาก `~/.openclaw/credentials/oauth.json`
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

- `billingBackoffHours`: การหน่วงถอยหลังพื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาดด้านการเรียกเก็บเงินจริงหรือเครดิตไม่เพียงพอ (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนอาจยังเข้าทางนี้ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการยังคงจำกัดอยู่กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` ที่ลองใหม่ได้เกี่ยวกับช่วงเวลาการใช้งานหรือขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซยังคงอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: การแทนที่เวลาหน่วงถอยหลังสำหรับการเรียกเก็บเงินแบบรายผู้ให้บริการที่ไม่บังคับ
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอกซ์โพเนนเชียลของการหน่วงถอยหลังด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: การหน่วงถอยหลังพื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของการหน่วงถอยหลัง `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับการหน่วงถอยหลัง (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียนโปรไฟล์การยืนยันตัวตนของผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดโอเวอร์โหลดก่อนสลับไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) รูปแบบผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะเข้าทางนี้
- `overloadedBackoffMs`: ดีเลย์คงที่ก่อนลองหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่โอเวอร์โหลดอีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียนโปรไฟล์การยืนยันตัวตนของผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดขีดจำกัดอัตราก่อนสลับไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) บักเก็ตขีดจำกัดอัตรานั้นรวมข้อความในรูปแบบของผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- ตั้งค่า `logging.file` สำหรับพาธที่คงที่
- `consoleLevel` จะยกระดับเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์บันทึกที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนการหมุนเวียน (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขไว้ข้างไฟล์ที่ใช้งานอยู่ได้สูงสุดห้าไฟล์
- `redactSensitive` / `redactPatterns`: การปิดบังแบบพยายามให้ดีที่สุดสำหรับเอาต์พุตคอนโซล ไฟล์บันทึก ระเบียนบันทึก OTLP และข้อความทรานสคริปต์เซสชันที่บันทึกถาวร `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบายบันทึก/ทรานสคริปต์ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปกปิดความลับก่อนส่งออก

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
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตบันทึกแบบเจาะจง (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็นมิลลิวินาทีสำหรับจัดประเภทเซสชันการประมวลผลที่รันนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ เครื่องมือ สถานะ บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะหน่วงถอยหลังเมื่อยังไม่เปลี่ยนแปลง
- `otel.enabled`: เปิดใช้ไปป์ไลน์การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าทั้งหมด แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ตัวรวบรวมสำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: ปลายทาง OTLP เฉพาะสัญญาณที่ไม่บังคับ เมื่อตั้งค่าแล้ว จะเขียนทับ `otel.endpoint` เฉพาะสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: ส่วนหัวเมตาดาต้า HTTP/gRPC เพิ่มเติมที่ส่งพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออกเทรซ เมตริก หรือบันทึก
- `otel.sampleRate`: อัตราการสุ่มตัวอย่างเทรซ `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลาการล้างเทเลเมทรีตามรอบเป็นมิลลิวินาที
- `otel.captureContent`: การเก็บเนื้อหาดิบแบบเลือกเปิดสำหรับแอตทริบิวต์สแปน OTEL ค่าเริ่มต้นปิดอยู่ บูลีน `true` จะเก็บเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบออบเจ็กต์ช่วยให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ผู้ให้บริการสแปน GenAI รุ่นทดลองล่าสุด โดยค่าเริ่มต้น สแปนจะเก็บแอตทริบิวต์ `gen_ai.system` แบบเดิมไว้เพื่อความเข้ากันได้; เมตริก GenAI ใช้แอตทริบิวต์เชิงความหมายแบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะยังคงเปิดใช้งานตัวฟังการวินิจฉัย
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อมปลายทางเฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่าที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปชอตเทรซแคชสำหรับการรันแบบฝัง (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ JSONL เทรซแคช (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุตเทรซแคช (ค่าเริ่มต้นทั้งหมด: `true`)

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
- `checkOnStart`: ตรวจหาการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ดีเลย์ขั้นต่ำเป็นชั่วโมงก่อนใช้การอัปเดตอัตโนมัติของช่องทางเสถียร (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างการกระจายการปล่อยเพิ่มเติมของช่องทางเสถียรเป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ที่การตรวจสอบช่องทางเบต้าทำงานเป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

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

- `enabled`: เกตฟีเจอร์ ACP ส่วนกลาง (ค่าเริ่มต้น: `true`; ตั้งค่า `false` เพื่อซ่อนการส่ง ACP และตัวช่วยการสปอว์น)
- `dispatch.enabled`: เกตอิสระสำหรับการส่งเทิร์นเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งานแต่บล็อกการดำเนินการ
- `backend`: id แบ็กเอนด์รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin แบ็กเอนด์ก่อน และหากตั้งค่า `plugins.allow` ให้รวม id ของ Plugin แบ็กเอนด์ (เช่น `acpx`) ไม่เช่นนั้นแบ็กเอนด์ ACP จะไม่โหลด
- `defaultAgent`: id ตัวแทนเป้าหมาย ACP สำรองเมื่อการสปอว์นไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: รายการอนุญาตของ id ตัวแทนที่อนุญาตให้ใช้กับเซสชันรันไทม์ ACP; ว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนเซสชัน ACP ที่ใช้งานพร้อมกันสูงสุด
- `stream.coalesceIdleMs`: หน้าต่างล้างเมื่อว่างเป็นมิลลิวินาทีสำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาดชังก์สูงสุดก่อนแยกการฉายบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์จบเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตผู้ช่วยสูงสุดที่ฉายต่อเทิร์น ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉาย
- `stream.tagVisibility`: ระเบียนของชื่อแท็กเป็นการแทนที่การมองเห็นแบบบูลีนสำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: TTL เมื่อว่างเป็นนาทีสำหรับเวิร์กเกอร์เซสชัน ACP ก่อนมีสิทธิ์ถูกล้าง
- `runtime.installCommand`: คำสั่งติดตั้งที่ไม่บังคับสำหรับรันเมื่อบูตสแตรปสภาพแวดล้อมรันไทม์ ACP

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

- `cli.banner.taglineMode` ควบคุมรูปแบบสโลแกนของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): สโลแกนตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: สโลแกนกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความสโลแกน (ยังคงแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่แค่สโลแกน) ให้ตั้งค่าตัวแปรสภาพแวดล้อม `OPENCLAW_HIDE_BANNER=1`

---

## วิซาร์ด

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

## ข้อมูลประจำตัว

ดูฟิลด์ข้อมูลประจำตัว `agents.list` ใต้ [ค่าเริ่มต้นของตัวแทน](/th/gateway/config-agents#agent-defaults)

---

## บริดจ์ (เดิม, นำออกแล้ว)

บิลด์ปัจจุบันไม่รวมบริดจ์ TCP แล้ว Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสกีมาการกำหนดค่าอีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถตัดคีย์ที่ไม่รู้จักออกได้)

<Accordion title="การกำหนดค่าบริดจ์เดิม (อ้างอิงทางประวัติศาสตร์)">

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

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์ก่อนตัดออกจาก `sessions.json` ยังควบคุมการล้างทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวรด้วย ค่าเริ่มต้น: `24h`; ตั้งค่า `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์บันทึกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดแต่ง ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดใหม่ล่าสุดที่คงไว้เมื่อการตัดแต่งบันทึกการรันถูกทริกเกอร์ ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเคน bearer ที่ใช้สำหรับการส่ง Cron Webhook POST (`delivery.mode = "webhook"`) หากละไว้จะไม่ส่งส่วนหัวการยืนยันตัวตน
- `webhook`: URL Webhook สำรองเดิมที่เลิกใช้แล้ว (http/https) ซึ่งใช้เฉพาะกับงานที่จัดเก็บไว้และยังมี `notify: true`

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
- `backoffMs`: อาร์เรย์ของเวลาหน่วงการถอยกลับเป็น ms สำหรับการลองใหม่แต่ละครั้ง (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทำให้เกิดการลองใหม่ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ไม่ต้องระบุหากต้องการลองใหม่สำหรับประเภทชั่วคราวทั้งหมด

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
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ขั้นต่ำ: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่กระทบการถอยกลับของข้อผิดพลาดในการดำเนินการ
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความของช่อง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: รหัสบัญชีหรือช่องที่ไม่บังคับ เพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `to`: เป้าหมาย announce หรือ URL ของ Webhook แบบชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` รายงานระดับงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและระดับงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะถอยกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- รองรับ `delivery.failureDestination` เฉพาะสำหรับงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกเดี่ยวจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวแทนเทมเพลตที่ถูกขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวครอบประวัติ/ผู้ส่ง)          |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | รหัสข้อความของช่อง                               |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                           |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | URL เสมือนของสื่อขาเข้า                          |
| `{{MediaPath}}`    | เส้นทางสื่อในเครื่อง                             |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)               |
| `{{Transcript}}`   | ข้อความถอดเสียง                                  |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ค่าแล้วสำหรับรายการ CLI          |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ค่าแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                  |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)          |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)         |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)     |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord, ฯลฯ) |

---

## การรวมไฟล์การกำหนดค่า (`$include`)

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

- ไฟล์เดียว: แทนที่อ็อบเจกต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: ผสานเชิงลึกตามลำดับ (รายการหลังแทนที่รายการก่อนหน้า)
- คีย์ระดับเดียวกัน: ผสานหลังจาก includes (แทนที่ค่าที่รวมเข้ามา)
- Includes ซ้อนกัน: ลึกได้สูงสุด 10 ระดับ
- เส้นทาง: แก้ค่าโดยสัมพันธ์กับไฟล์ที่รวม แต่ต้องอยู่ภายในไดเรกทอรีการกำหนดค่าระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบแบบสัมบูรณ์/`../` อนุญาตเฉพาะเมื่อยังแก้ค่าให้อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเพียงหนึ่งส่วนระดับบนสุดที่มี single-file include รองรับ จะเขียนทะลุไปยังไฟล์ที่รวมเข้ามานั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และคง `openclaw.json` ไว้เหมือนเดิม
- Root includes, อาร์เรย์ include และ includes ที่มีการแทนที่ด้วยคีย์ระดับเดียวกันเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนการทำให้การกำหนดค่าแบนลง
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดในการแยกวิเคราะห์ และ includes แบบวนซ้ำ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
