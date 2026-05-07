---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อยเฉพาะ
title: เอกสารอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-07T13:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b279c3e74fd6f7de01d63b642ab17aaaac65c39b855efc745eadc121adbf1fb
    source_path: gateway/configuration-reference.md
    workflow: 16
---

การอ้างอิง config หลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบมุ่งเน้นงาน ดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิว config หลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีเอกสารอ้างอิงเชิงลึกของตัวเอง แคตตาล็อกคำสั่งที่ channel และ Plugin เป็นเจ้าของ รวมถึง knob เชิงลึกของ memory/QMD อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวม metadata ของ bundled/Plugin/channel เข้ามาเมื่อมี
- `config.schema.lookup` คืนค่า node ของ schema แบบจำกัดตาม path หนึ่งรายการสำหรับเครื่องมือ drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบ hash baseline ของ config-doc กับพื้นผิว schema ปัจจุบัน

path สำหรับค้นหา Agent: ใช้ action ของเครื่องมือ `gateway` ชื่อ `config.schema.lookup` เพื่อดูเอกสารและข้อจำกัดระดับ field ที่แม่นยำก่อนแก้ไข ใช้ [การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบมุ่งเน้นงาน และใช้หน้านี้สำหรับแผนที่ field ที่กว้างขึ้น ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อย

เอกสารอ้างอิงเชิงลึกเฉพาะด้าน:

- [เอกสารอ้างอิงการกำหนดค่า memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และ config ของ dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้าของ channel/Plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะ channel

รูปแบบ config คือ **JSON5** (อนุญาต comments + trailing commas) field ทั้งหมดเป็น optional - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## Channels

key config ราย channel ถูกย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - channels](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และ channel แบบ bundled อื่นๆ (auth, access control, multi-account, mention gating)

## ค่าเริ่มต้นของ Agent, multi-agent, sessions และ messages

ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกของ multi-agent)
- `session.*` (วงจรชีวิต session, Compaction, การ pruning)
- `messages.*` (การส่ง message, TTS, การ render markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: locale id แบบ BCP 47 ที่เป็น optional สำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดพักค่าเริ่มต้นของ platform ไว้ก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและ custom providers

ย้าย tool policy, toggle ทดลอง, config เครื่องมือที่มี provider รองรับ และการตั้งค่า custom provider / base-URL ไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - เครื่องมือและ custom providers](/th/gateway/config-tools)

## Models

นิยาม provider, allowlist ของ model และการตั้งค่า custom provider อยู่ใน
[การกำหนดค่า - เครื่องมือและ custom providers](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรม model-catalog แบบ global ด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรม provider catalog (`merge` หรือ `replace`)
- `models.providers`: map ของ custom provider ที่ key ด้วย provider id
- `models.pricing.enabled`: ควบคุม background pricing bootstrap ที่เริ่มหลังจาก sidecars และ channels เข้าสู่ path พร้อมใช้งานของ Gateway เมื่อเป็น `false` Gateway จะข้ามการ fetch pricing-catalog ของ OpenRouter และ LiteLLM ค่า `models.providers.*.models[].cost` ที่กำหนดไว้ยังคงใช้ได้สำหรับการประมาณ cost ในเครื่อง

## MCP

นิยาม MCP server ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูกใช้โดย Pi แบบ embedded และ runtime adapters อื่นๆ คำสั่ง `openclaw mcp list`, `show`, `set` และ `unset` จัดการ block นี้โดยไม่เชื่อมต่อกับ server เป้าหมายระหว่างการแก้ไข config

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

- `mcp.servers`: นิยาม stdio หรือ remote MCP server แบบตั้งชื่อสำหรับ runtime ที่เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` normalize เข้า field canonical `transport`
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ MCP runtime แบบ bundled ที่จำกัดตาม session
  การ run แบบ embedded ครั้งเดียวจะขอ cleanup เมื่อจบ run; TTL นี้เป็น backstop สำหรับ session ที่มีอายุยาวและ caller ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` hot-apply โดยการ dispose runtime MCP ของ session ที่ cache ไว้
  การ discover/use เครื่องมือครั้งถัดไปจะสร้างใหม่จาก config ใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[CLI backends](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรม runtime

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

- `allowBundled`: allowlist optional สำหรับ Skills แบบ bundled เท่านั้น (Skills แบบ managed/workspace ไม่ได้รับผลกระทบ)
- `load.extraDirs`: root ของ skill แบบ shared เพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew` พร้อมใช้งาน ก่อน fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ความต้องการตัวติดตั้ง node สำหรับ spec `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้ว่าจะเป็น bundled/installed แล้ว
- `entries.<skillKey>.apiKey`: ทางลัดสำหรับ Skills ที่ประกาศ env var หลัก (สตริง plaintext หรือ object SecretRef)

---

## Plugin

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
- discovery ยอมรับ Plugin ของ OpenClaw แบบ native รวมถึง bundle ของ Codex และ bundle ของ Claude ที่เข้ากันได้ รวมถึง bundle layout ค่าเริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลง config ต้อง restart gateway**
- `allow`: allowlist optional (โหลดเฉพาะ Plugin ที่ระบุ) `deny` มีผลเหนือกว่า
- `bundledDiscovery`: ค่าเริ่มต้นเป็น `"allowlist"` สำหรับ config ใหม่ ดังนั้น
  `plugins.allow` ที่ไม่ว่างจะ gate provider Plugin แบบ bundled ด้วย รวมถึง runtime provider ของ web-search Doctor เขียน `"compat"` สำหรับ config allowlist แบบ legacy ที่ migrate แล้วเพื่อรักษาพฤติกรรม provider แบบ bundled ที่มีอยู่จนกว่าคุณจะ opt in
- `plugins.entries.<id>.apiKey`: field ทางลัดสำหรับ API key ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: map ของ env var ที่จำกัด scope ตาม Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะ block `before_prompt_build` และเพิกเฉยต่อ field ที่เปลี่ยน prompt จาก legacy `before_agent_start` ขณะยังคงรักษา legacy `modelOverride` และ `providerOverride` ใช้กับ hook ของ Plugin แบบ native และ hook directory ที่ bundle รองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin non-bundled ที่เชื่อถือได้อาจอ่านเนื้อหา conversation ดิบจาก hook แบบ typed เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ override `provider` และ `model` แบบราย run สำหรับ background subagent runs
- `plugins.entries.<id>.subagent.allowedModels`: allowlist optional ของ target `provider/model` แบบ canonical สำหรับ trusted subagent overrides ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.config`: object config ที่ Plugin กำหนด (ตรวจสอบความถูกต้องโดย schema ของ Plugin OpenClaw แบบ native เมื่อมี)
- การตั้งค่า account/runtime ของ channel Plugin อยู่ภายใต้ `channels.<id>` และควรถูกอธิบายโดย metadata `channelConfigs` ของ manifest จาก Plugin เจ้าของ ไม่ใช่โดย option registry กลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า provider web-fetch ของ Firecrawl
  - `apiKey`: API key ของ Firecrawl (รับ SecretRef) fallback ไปที่ `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: base URL ของ Firecrawl API (ค่าเริ่มต้น: `https://api.firecrawl.dev`; override แบบ self-hosted ต้องชี้ไปยัง endpoint แบบ private/internal)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุ cache สูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้งาน provider X Search
  - `model`: model Grok ที่ใช้สำหรับ search (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phase และ threshold
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ cron สำหรับ dreaming sweep เต็มแต่ละครั้ง (ค่าเริ่มต้นคือ `"0 3 * * *"`)
  - `model`: override model optional สำหรับ subagent Dream Diary ต้องใช้ `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัด target error แบบ model-unavailable จะ retry หนึ่งครั้งด้วย model ค่าเริ่มต้นของ session; ความล้มเหลวด้าน trust หรือ allowlist จะไม่ fallback แบบเงียบๆ
  - policy และ threshold ของ phase เป็นรายละเอียด implementation (ไม่ใช่ config key สำหรับผู้ใช้)
- config memory แบบเต็มอยู่ใน [เอกสารอ้างอิงการกำหนดค่า memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle ของ Claude ที่เปิดใช้งานแล้วยังสามารถส่งค่าเริ่มต้น Pi แบบ embedded จาก `settings.json` ได้ด้วย; OpenClaw นำค่าเหล่านั้นไปใช้เป็นการตั้งค่า agent ที่ sanitize แล้ว ไม่ใช่เป็น patch config ดิบของ OpenClaw
- `plugins.slots.memory`: เลือก id ของ memory Plugin ที่ active หรือ `"none"` เพื่อปิดใช้งาน memory Plugin
- `plugins.slots.contextEngine`: เลือก id ของ context engine Plugin ที่ active; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณจะ install และเลือก engine อื่น

ดู [Plugin](/th/tools/plugin)

---

## Commitments

`commitments` ควบคุม memory สำหรับ follow-up ที่ infer ได้: OpenClaw สามารถตรวจจับ check-in จาก turn ของ conversation และส่งผ่าน heartbeat runs ได้

- `commitments.enabled`: เปิดใช้งานการ extract, storage และ delivery ผ่าน heartbeat ของ LLM แบบซ่อนสำหรับ commitment ของ follow-up ที่ infer ได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวน commitment ของ follow-up ที่ infer ได้สูงสุดที่ส่งต่อ agent session ในวันแบบ rolling ค่าเริ่มต้น: `3`

ดู [commitments ที่ infer ได้](/th/concepts/commitments)

---

## Browser

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
- `tabCleanup` เรียกคืนแท็บเอเจนต์หลักที่มีการติดตามหลังจากไม่มีการใช้งาน หรือเมื่อเซสชันเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อปิดใช้งานโหมดล้างข้อมูลแต่ละโหมดเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่าไว้ ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดเป็นค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณจงใจเชื่อถือการนำทางของเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด ปลายทางโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบความสามารถในการเข้าถึง/การค้นหา
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะนามแฝงรุ่นเก่า
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นแบบระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งานการเริ่ม/หยุด/รีเซ็ต)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นหา `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับความสามารถในการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback ที่มีการจัดการ
  จะคงค่าเริ่มต้น CDP ภายในเครื่องไว้
- หากบริการ CDP ที่จัดการภายนอกสามารถเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ที่จัดการในเครื่อง และอาจรายงานข้อผิดพลาดการเป็นเจ้าของพอร์ตภายในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมายไปยัง
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium โดยเฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การทำงานที่ขับเคลื่อนด้วยสแนปช็อต/ref แทนการกำหนดเป้าหมายด้วย CSS-selector, hooks สำหรับอัปโหลดไฟล์เดียว, ไม่มีการแทนที่ timeout ของไดอะล็อก, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการทำงานแบบชุด
- โปรไฟล์ `openclaw` ที่จัดการภายในเครื่องจะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ที่จัดการภายในเครื่องสามารถตั้งค่า `executablePath` เพื่อแทนที่
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ที่จัดการภายในเครื่องใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นหา Chrome CDP HTTP
  หลังเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดตัว เพิ่มค่านี้ในโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` มิลลิวินาที; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นถ้าใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรีโฮมของ OS ของคุณก่อนเปิด Chromium
  `userDataDir` รายโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วยเช่นกัน
- บริการควบคุม: loopback เท่านั้น (พอร์ตมาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดใช้งานเพิ่มเติมให้กับการเริ่ม Chromium ภายในเครื่อง (เช่น
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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (เฉดสีฟอง Talk Mode เป็นต้น)
- `assistant`: การแทนที่ตัวตน Control UI ย้อนกลับไปใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่

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

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะเป็น `local`
- `port`: พอร์ตมัลติเพล็กซ์เดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale), หรือ `custom`
- **นามแฝง bind เดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุ Docker**: ค่า bind เริ่มต้น `loopback` รับฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่ายแบบ bridge ของ Docker (`-p 18789:18789`) ทราฟฟิกจะมาถึงที่ `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อรับฟังทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: ต้องใช้โดยค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ Gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` ตัวช่วยตั้งค่าเริ่มต้นจะสร้างโทเค็นโดยค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` เป็น `token` หรือ `password` อย่างชัดเจน ขั้นตอนเริ่มต้นและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งคู่และไม่ได้ตั้งค่าโหมด
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบชัดเจน ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โดยตั้งใจไม่เสนอค่านี้ในพรอมป์การตั้งค่าเริ่มต้น
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือส่วนหัวตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งพร็อกซีที่ **ไม่ใช่ loopback** โดยค่าเริ่มต้น reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ตัวเรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็นทางเลือกสำรองแบบตรงในเครื่องได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` ส่วนหัวตัวตนของ Tailscale Serve สามารถผ่านการยืนยันตัวตนของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) จุดปลายทาง HTTP API **ไม่** ใช้การยืนยันตัวตนด้วยส่วนหัว Tailscale นั้น แต่จะใช้โหมดการยืนยันตัวตน HTTP ปกติของ Gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนที่ล้มเหลวแบบเลือกได้ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะคืนค่า `429` + `Retry-After`
  - บนเส้นทาง Control UI ของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนความล้มเหลว ดังนั้นความพยายามที่ผิดพร้อมกันจากไคลเอนต์เดียวกันจึงสามารถทำให้ตัวจำกัดทำงานในคำขอที่สอง แทนที่ทั้งคู่จะแข่งกันผ่านไปเป็นเพียงการไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วยเช่นกัน (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีแบบเข้มงวด)
- ความพยายามยืนยันตัวตน WS จากต้นทางเบราว์เซอร์จะถูกจำกัดอัตราเสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost ผ่านเบราว์เซอร์)
- บน loopback การล็อกเอาต์จากต้นทางเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ปรับให้เป็นมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่
  ล็อกต้นทางอื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้การยืนยันตัวตน)
- `controlUi.allowedOrigins`: รายการอนุญาตต้นทางเบราว์เซอร์อย่างชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จากต้นทางที่ไม่ใช่ loopback
- `controlUi.chatMessageMaxWidth`: max-width แบบเลือกได้สำหรับข้อความแชต Control UI ที่จัดกลุ่ม รองรับค่า width ของ CSS ที่มีข้อจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)`, และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้การ fallback ต้นทางจากส่วนหัว Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบายต้นทางจากส่วนหัว Host
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: การแทนที่แบบฉุกเฉินในสภาพแวดล้อมกระบวนการฝั่งไคลเอนต์
  ที่อนุญาตให้ใช้ `ws://` แบบข้อความล้วนไปยัง IP เครือข่ายส่วนตัว
  ที่เชื่อถือได้; ค่าเริ่มต้นยังคงจำกัดข้อความล้วนไว้เฉพาะ loopback ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการกำหนดค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` จะไม่ส่งผลต่อไคลเอนต์ WebSocket
  ของ Gateway
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ Gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL HTTPS ฐานสำหรับรีเลย์ APNs ภายนอกที่ใช้โดยบิลด์ iOS ทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนที่รองรับด้วยรีเลย์ไปยัง Gateway URL นี้ต้องตรงกับ URL รีเลย์ที่คอมไพล์ไว้ในบิลด์ iOS
- `gateway.push.apns.relay.timeoutMs`: ระยะหมดเวลาการส่งจาก Gateway ไปยังรีเลย์ หน่วยเป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`
- การลงทะเบียนที่รองรับด้วยรีเลย์จะถูกมอบหมายให้กับตัวตน Gateway เฉพาะ แอป iOS ที่จับคู่แล้วจะเรียก `gateway.identity.get` รวมตัวตนนั้นในการลงทะเบียนรีเลย์ และส่งต่อสิทธิ์การส่งตามขอบเขตการลงทะเบียนไปยัง Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่เก็บไว้นั้นกลับมาใช้ได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: การแทนที่ env ชั่วคราวสำหรับการกำหนดค่ารีเลย์ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL รีเลย์ HTTP แบบ loopback URL รีเลย์สำหรับการผลิตควรใช้ HTTPS ต่อไป
- `gateway.handshakeTimeoutMs`: ระยะหมดเวลาการจับมือ WebSocket ของ Gateway ก่อนยืนยันตัวตน หน่วยเป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำซึ่งไคลเอนต์ในเครื่องสามารถเชื่อมต่อได้ขณะที่การอุ่นเครื่องช่วงเริ่มต้นยังไม่เสร็จสมบูรณ์
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสอบสุขภาพช่องทาง หน่วยเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ตโดยตัวตรวจสอบสุขภาพทั้งหมด ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ซ็อกเก็ตค้าง หน่วยเป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนการรีสตาร์ตสูงสุดโดยตัวตรวจสอบสุขภาพต่อช่องทาง/บัญชีในหนึ่งชั่วโมงแบบเลื่อน ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การเลือกไม่ใช้ต่อช่องทางสำหรับการรีสตาร์ตโดยตัวตรวจสอบสุขภาพ โดยยังคงเปิดใช้ตัวตรวจสอบระดับรวม
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การแทนที่ต่อบัญชีสำหรับช่องทางหลายบัญชี เมื่อตั้งค่าแล้วจะมีลำดับความสำคัญเหนือการแทนที่ระดับช่องทาง
- เส้นทางเรียก Gateway ในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และยังแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี remote fallback มาบัง)
- `trustedProxies`: IP ของ reverse proxy ที่ยุติ TLS หรือแทรกส่วนหัว forwarded-client ระบุเฉพาะพร็อกซีที่คุณควบคุมเท่านั้น รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าพร็อกซี/การตรวจจับในเครื่องบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true`, Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นคือ `false` สำหรับพฤติกรรมแบบ fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: รายการอนุญาต CIDR/IP แบบเลือกได้สำหรับอนุมัติการจับคู่อุปกรณ์ Node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีขอบเขตที่ร้องขอ ค่านี้จะถูกปิดเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key โดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนดรูปแบบ allow/deny ระดับรวมสำหรับคำสั่ง Node ที่ประกาศไว้หลังจากการจับคู่และการประเมินรายการอนุญาตของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกใช้คำสั่ง Node ที่อันตราย เช่น `camera.snap`, `camera.clip`, และ `screen.record`; `denyCommands` จะลบคำสั่งแม้ค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตอย่างชัดเจนจะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก Node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ Gateway เก็บสแนปช็อตคำสั่งที่อัปเดตแล้ว
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny เริ่มต้น)
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการ deny เริ่มต้นของ HTTP

</Accordion>

### จุดปลายทางที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดโดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความแข็งแรงของอินพุต URL สำหรับ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    รายการอนุญาตว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- ส่วนหัวเสริมความแข็งแรงของการตอบกลับแบบเลือกได้:
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

- `enabled`: เปิดใช้งานการยุติ TLS ที่ตัวรับฟังของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ใบรับรอง/คีย์ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; สำหรับการใช้งานในเครื่อง/การพัฒนาเท่านั้น
- `certPath`: เส้นทางระบบไฟล์ไปยังไฟล์ใบรับรอง TLS
- `keyPath`: เส้นทางระบบไฟล์ไปยังไฟล์คีย์ส่วนตัว TLS; จำกัดสิทธิ์การเข้าถึงไว้
- `caPath`: เส้นทางชุด CA แบบเลือกได้สำหรับการตรวจสอบไคลเอนต์หรือสายโซ่ความเชื่อถือแบบกำหนดเอง

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
  - `"off"`: เพิกเฉยต่อการแก้ไขสด; การเปลี่ยนแปลงต้องรีสตาร์ตอย่างชัดเจน
  - `"restart"`: รีสตาร์ตกระบวนการ Gateway เสมอเมื่อ config เปลี่ยน
  - `"hot"`: ใช้การเปลี่ยนแปลงภายในกระบวนการโดยไม่รีสตาร์ต
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback เป็นการรีสตาร์ตหากจำเป็น
- `debounceMs`: หน่วงเวลา debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบเลือกได้เป็น ms ที่จะรอการดำเนินการที่กำลังค้างอยู่ก่อนบังคับรีสตาร์ตหรือ hot reload ช่องทาง ละไว้เพื่อใช้เวลารอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรอโดยไม่มีกำหนดและบันทึกคำเตือนว่ายังคงค้างอยู่เป็นระยะ

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
โทเค็นของ hook ในสตริงคิวรีจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` เป็น `/` ไม่ได้; ใช้พาธย่อยเฉพาะ เช่น `/hooks`
- ถ้า `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- ถ้า mapping หรือ preset ใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์ mapping แบบคงที่ไม่ต้องเปิดใช้ตัวเลือกนี้

**ปลายทาง:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก payload ของคำขอจะถูกรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่ render จากเทมเพลตจะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่กับพาธย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่กับฟิลด์ใน payload สำหรับพาธทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านค่าจาก payload
- `transform` ชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็นพาธแบบสัมพันธ์และอยู่ภายใน `hooks.transformsDir` (พาธแบบสมบูรณ์และการไล่ย้อนพาธจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ภายใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ใน workspace จะถูกปฏิเสธ ถ้า `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform ไปไว้ในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` route ไปยัง agent ที่ระบุ; ID ที่ไม่รู้จักจะ fallback ไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการ route แบบชัดเจน (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์ session คงที่แบบไม่บังคับสำหรับการรัน hook agent ที่ไม่มี `sessionKey` แบบชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์ session ของ mapping ที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist ของ prefix แบบไม่บังคับสำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + mapping), เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อบังคับเมื่อ mapping หรือ preset ใดๆ ใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยัง channel; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตถ้ามีการตั้งค่า catalog ของโมเดล)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- ถ้าคุณคงการ route ต่อข้อความแบบนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- ถ้าคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้ override preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- Gateway จะเริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูต ถ้ามีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

---

## โฮสต์ Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- ให้บริการ HTML/CSS/JS ที่ agent แก้ไขได้ และ A2UI ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะภายในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind แบบไม่ใช่ loopback: route ของ canvas ต้องใช้การยืนยันตัวตนของ Gateway (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นๆ ของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่ง auth headers; หลังจาก node จับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ URL capability แบบจำกัดขอบเขตตาม node สำหรับการเข้าถึง canvas/A2UI
- URL capability จะผูกกับ session WS ของ node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- inject client สำหรับ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่างเปล่า
- ยังให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้อง restart gateway
- ปิดใช้ live reload สำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้ Plugin `bonjour` ที่ bundled มา): ละเว้น `cliPath` + `sshPort` จาก TXT records
- `full`: รวม `cliPath` + `sshPort`; การประกาศ LAN multicast ยังต้องเปิดใช้ Plugin `bonjour` ที่ bundled มา
- `off`: ระงับการประกาศ LAN multicast โดยไม่เปลี่ยนการเปิดใช้ Plugin
- Plugin `bonjour` ที่ bundled มาจะเริ่มโดยอัตโนมัติบนโฮสต์ macOS และเป็นแบบ opt-in บน Linux, Windows และการ deploy Gateway ใน container
- ค่าเริ่มต้นของ hostname คือ hostname ของระบบเมื่อเป็น DNS label ที่ถูกต้อง และจะ fallback เป็น `openclaw` override ด้วย `OPENCLAW_MDNS_HOSTNAME`

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียน zone unicast DNS-SD ภายใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้จับคู่กับ DNS server (แนะนำ CoreDNS) + Tailscale split DNS

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

- ตัวแปร env แบบอินไลน์จะถูกใช้เฉพาะเมื่อ env ของโปรเซสไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งสองไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังขาดอยู่จากโปรไฟล์เชลล์ล็อกอินของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนที่ตัวแปร Env

อ้างอิงตัวแปร env ในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไป/ว่างเปล่าจะทำให้เกิดข้อผิดพลาดเมื่อโหลด config
- Escape ด้วย `$${VAR}` สำหรับ `${VAR}` แบบลิเทอรัล
- ใช้งานได้กับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเสริม: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปทรงอ็อบเจกต์เดียว:

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
- `secrets apply` กำหนดเป้าหมายพาธข้อมูลรับรอง `openclaw.json` ที่รองรับ
- การอ้างอิงใน `auth-profiles.json` รวมอยู่ในการแก้ค่า runtime และความครอบคลุมของการตรวจสอบ

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
- พาธของผู้ให้บริการ file และ exec จะล้มเหลวแบบปิดเมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะกับพาธที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้เท่านั้น
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์และใช้ payload ของโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink พร้อมตรวจสอบความถูกต้องของพาธเป้าหมายที่แก้ค่าแล้ว
- หากกำหนดค่า `trustedDirs` การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่แก้ค่าแล้ว
- สภาพแวดล้อมของ child ใน `exec` มีค่าเริ่มต้นแบบขั้นต่ำ; ส่งผ่านตัวแปรที่ต้องใช้โดยระบุอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูกแก้ค่าในเวลาที่เปิดใช้งานเป็นสแนปช็อตในหน่วยความจำ จากนั้นพาธคำขอจะอ่านเฉพาะสแนปช็อต
- การกรอง active-surface จะใช้ระหว่างการเปิดใช้งาน: การอ้างอิงที่แก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้การเริ่มต้น/โหลดซ้ำล้มเหลว ขณะที่พื้นผิวที่ไม่ทำงานจะถูกข้ามพร้อม diagnostics

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

- โปรไฟล์ต่อเอเจนต์ถูกจัดเก็บที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบแบนรุ่นเก่า เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key มาตรฐาน `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่หนุนด้วย SecretRef
- ข้อมูลรับรอง runtime แบบคงที่มาจากสแนปช็อตที่แก้ค่าแล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่รุ่นเก่าจะถูกล้างออกเมื่อตรวจพบ
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

- `billingBackoffHours`: backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวเนื่องจากข้อผิดพลาดการเรียกเก็บเงิน/เครดิตไม่เพียงพอที่แท้จริง (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนยังสามารถมาถึงที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการยังคงจำกัดขอบเขตอยู่กับผู้ให้บริการที่เป็นเจ้าของตัวจับคู่นั้น (เช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` แบบลองใหม่ได้เกี่ยวกับหน้าต่างการใช้งานหรือขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซจะอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: การ override จำนวนชั่วโมง backoff สำหรับการเรียกเก็บเงินรายผู้ให้บริการแบบเลือกได้
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โพเนนเชียลของ backoff การเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะมาถึงที่นี่
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อนลองการหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่ overloaded อีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) กลุ่ม rate-limit นั้นรวมข้อความที่มีรูปแบบของผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## การบันทึก Log

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
- ตั้งค่า `logging.file` สำหรับ path ที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ log ที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บ archive แบบมีหมายเลขได้สูงสุดห้าไฟล์ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบพยายามอย่างดีที่สุดสำหรับผลลัพธ์ในคอนโซล, file logs, ระเบียน OTLP log และข้อความ transcript เซสชันที่คงไว้ `redactSensitive: "off"` จะปิดใช้งานเฉพาะนโยบาย log/transcript ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/tool/diagnostic ยังคง redact ความลับก่อนปล่อยออกมา

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

- `enabled`: สวิตช์หลักสำหรับผลลัพธ์ instrumentation (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริง flag ที่เปิดใช้งานผลลัพธ์ log แบบเจาะจง (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุแบบไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภทเซสชันประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, tool, สถานะ, block และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; diagnostics `session.stuck` ที่ซ้ำกันจะ back off ขณะไม่มีการเปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุแบบไม่มีความคืบหน้าเป็น ms ก่อนที่งานที่ใช้งานอยู่ซึ่ง stalled และมีสิทธิ์อาจถูก abort-drained เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่าง embedded-run แบบขยายที่ปลอดภัยกว่าอย่างน้อย 10 นาทีและ 5x `stuckSessionWarnMs`
- `otel.enabled`: เปิดใช้งาน pipeline การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าฉบับเต็ม, แคตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของ collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะสัญญาณแบบเลือกได้ เมื่อตั้งค่าไว้ จะ override `otel.endpoint` เฉพาะสัญญาณนั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: header เมตาดาต้า HTTP/gRPC เพิ่มเติมที่ส่งพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้งานการส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry เป็นระยะใน ms
- `otel.captureContent`: การเลือกเข้าร่วมจับ raw content สำหรับ attributes ของ span OTEL ค่าเริ่มต้นปิดอยู่ Boolean `true` จะจับเนื้อหา message/tool ที่ไม่ใช่ระบบ; รูปแบบ object ให้คุณเปิดใช้งาน `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์ environment สำหรับ attributes ล่าสุดแบบทดลองของผู้ให้บริการ GenAI span โดยค่าเริ่มต้น spans จะคง attribute `gen_ai.system` แบบดั้งเดิมไว้เพื่อความเข้ากันได้; metrics ของ GenAI ใช้ semantic attributes แบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์ environment สำหรับ host ที่ลงทะเบียน OpenTelemetry SDK แบบ global แล้ว OpenClaw จะข้ามการ startup/shutdown SDK ที่ Plugin เป็นเจ้าของ ขณะยังคงให้ diagnostic listeners ทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars ของ endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่า config key ที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปช็อต cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: path ผลลัพธ์สำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในผลลัพธ์ cache trace (ทั้งหมดมีค่าเริ่มต้น: `true`)

---

## อัปเดต

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

- `channel`: release channel สำหรับการติดตั้ง npm/git - `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้งานการอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: หน่วงเวลาขั้นต่ำเป็นชั่วโมงก่อน auto-apply ใน stable-channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจาย rollout เพิ่มเติมของ stable-channel เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ที่การตรวจสอบ beta-channel ทำงานเป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

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

- `enabled`: feature gate ACP ระดับ global (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อน affordance สำหรับ ACP dispatch และ spawn)
- `dispatch.enabled`: gate อิสระสำหรับ ACP session turn dispatch (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังคงพร้อมใช้งานแต่บล็อกการดำเนินการ
- `backend`: id ของ ACP runtime backend เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง backend Plugin ก่อน และถ้าตั้งค่า `plugins.allow` ไว้ ให้รวม id ของ backend Plugin (เช่น `acpx`) มิฉะนั้น ACP backend จะไม่โหลด
- `defaultAgent`: id เอเจนต์เป้าหมาย fallback ของ ACP เมื่อ spawns ไม่ได้ระบุเป้าหมายชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชัน ACP runtime; ว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนเซสชัน ACP ที่ใช้งานพร้อมกันได้สูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแบ่ง projection ของ block ที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/tool ที่ซ้ำกันต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` buffer จนถึงเหตุการณ์ terminal ของ turn
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์ tool ที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระผลลัพธ์ของ assistant สูงสุดที่ project ต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ project
- `stream.tagVisibility`: ระเบียนชื่อ tag เป็นการ override visibility แบบ boolean สำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ workers ของเซสชัน ACP ก่อนมีสิทธิ์ cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบเลือกได้ที่จะรันเมื่อ bootstrapping สภาพแวดล้อม ACP runtime

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
  - `"random"` (ค่าเริ่มต้น): tagline ตลก/ตามฤดูกาลที่หมุนเวียน
  - `"default"`: tagline กลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังแสดง title/version ของ banner)
- หากต้องการซ่อน banner ทั้งหมด (ไม่ใช่แค่ taglines) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

เมตาดาต้าที่เขียนโดย flow การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

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

ดูฟิลด์ identity ของ `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## Bridge (ดั้งเดิม, ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของ config schema อีกต่อไป (validation จะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="การกำหนดค่า bridge ดั้งเดิม (ข้อมูลอ้างอิงทางประวัติศาสตร์)">

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

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์แล้วไว้ก่อนตัดทิ้งจาก `sessions.json` และยังควบคุมการล้าง transcript ของ Cron ที่ถูกลบและเก็บถาวรไว้ ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์บันทึกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดทิ้ง ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดล่าสุดที่คงไว้เมื่อมีการตัดทิ้งบันทึกการรัน ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเคน bearer ที่ใช้สำหรับการส่ง Cron Webhook แบบ POST (`delivery.mode = "webhook"`) หากละไว้จะไม่ส่งส่วนหัวการยืนยันตัวตน
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
- `backoffMs`: อาร์เรย์ของระยะเวลาหน่วง backoff เป็นมิลลิวินาทีสำหรับแต่ละครั้งที่ลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทำให้เกิดการลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อให้ลองใหม่กับข้อผิดพลาดชั่วคราวทุกประเภท

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

- `enabled`: เปิดใช้งานการแจ้งเตือนความล้มเหลวสำหรับงาน Cron (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดการดำเนินการ
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความในช่อง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: ID บัญชีหรือช่องที่ไม่บังคับ เพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องสำหรับการส่งแบบ announce `"last"` ใช้ช่องส่งล่าสุดที่ทราบอีกครั้ง
- `to`: เป้าหมาย announce หรือ URL Webhook ที่ระบุชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` ต่อหนึ่งงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและต่อหนึ่งงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เท่านั้น เว้นแต่ว่า `delivery.mode` หลักของงานคือ `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตของโมเดลสื่อ

placeholder ของเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                     |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวห่อประวัติ/ผู้ส่ง)          |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว            |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                  |
| `{{MessageSid}}`   | ID ข้อความของช่อง                               |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                          |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                   |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                         |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)              |
| `{{Transcript}}`   | transcript เสียง                                 |
| `{{Prompt}}`       | prompt สื่อที่แก้ค่าแล้วสำหรับรายการ CLI        |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ค่าแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                        |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (ตามความสามารถที่ทำได้)             |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (ตามความสามารถที่ทำได้)     |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (ตามความสามารถที่ทำได้)    |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (ตามความสามารถที่ทำได้) |
| `{{Provider}}`     | คำใบ้ provider (whatsapp, telegram, discord เป็นต้น) |

---

## การรวม Config (`$include`)

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

**พฤติกรรมการรวม:**

- ไฟล์เดียว: แทนที่อ็อบเจกต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merged ตามลำดับ (ตัวที่มาทีหลังแทนที่ตัวก่อนหน้า)
- คีย์พี่น้อง: รวมหลัง includes (แทนที่ค่าที่ include เข้ามา)
- Nested includes: ลึกได้สูงสุด 10 ระดับ
- พาธ: แก้เทียบกับไฟล์ที่ include แต่ต้องอยู่ภายในไดเรกทอรี config ระดับบนสุด (`dirname` ของ `openclaw.json`) อนุญาตรูปแบบแบบสัมบูรณ์/`../` เฉพาะเมื่อยังแก้ค่าให้อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่มี single-file include รองรับอยู่ จะเขียนทะลุไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้ตามเดิม
- Root includes, อาร์เรย์ include และ includes ที่มีการแทนที่คีย์พี่น้อง เป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนการ flatten config
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่ขาดหาย ข้อผิดพลาดในการ parse และ include แบบวนซ้ำ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
