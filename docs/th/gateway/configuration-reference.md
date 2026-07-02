---
read_when:
    - คุณต้องการความหมายเชิงคอนฟิกหรือค่าเริ่มต้นในระดับฟิลด์อย่างแม่นยำ
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อยเฉพาะ
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-07-02T08:58:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

เอกสารอ้างอิงการกำหนดค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบเน้นงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการกำหนดค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีเอกสารอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงปุ่มปรับแต่งหน่วยความจำเชิงลึก/QMD อยู่ในหน้าของตัวเอง ไม่ได้อยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวม metadata ของบันเดิล/Plugin/ช่องทางเมื่อมี
- `config.schema.lookup` ส่งคืนโหนด schema แบบจำกัดขอบเขตตาม path หนึ่งรายการสำหรับเครื่องมือเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบ hash baseline ของเอกสาร config เทียบกับพื้นผิว schema ปัจจุบัน

เส้นทางค้นหาของเอเจนต์: ใช้ action ของเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบเน้นงาน และใช้หน้านี้
สำหรับแผนที่ฟิลด์ที่กว้างกว่า ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อย

เอกสารอ้างอิงเชิงลึกเฉพาะ:

- [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และ config ของ dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + บันเดิลปัจจุบัน
- หน้าของช่องทาง/Plugin เจ้าของ สำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบ config คือ **JSON5** (อนุญาต comment + comma ท้ายรายการ) ทุกฟิลด์เป็น optional - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ระบุ

---

## ช่องทาง

คีย์ config รายช่องทางย้ายไปยังหน้าเฉพาะแล้ว - โปรดดู
[การกำหนดค่า - ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางบันเดิลอื่นๆ
(auth, การควบคุมการเข้าถึง, หลายบัญชี, การ gate การ mention)

## ค่าเริ่มต้นของเอเจนต์, multi-agent, session และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว - โปรดดู
[การกำหนดค่า - เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (การ routing และ binding แบบ multi-agent)
- `session.*` (วงจรชีวิต session, Compaction, pruning)
- `messages.*` (การส่งข้อความ, TTS, การ render markdown)
- `talk.*` (โหมด Talk)
  - `talk.consultThinkingLevel`: การ override ระดับ thinking สำหรับการรันเอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลัง realtime consult ของ Control UI Talk
  - `talk.consultFastMode`: การ override fast-mode แบบ one-shot สำหรับ realtime consult ของ Control UI Talk
  - `talk.speechLocale`: id locale BCP 47 แบบ optional สำหรับการรู้จำเสียงของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ตั้งค่า Talk จะคงช่วงหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มไว้ก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback ของ relay ใน Gateway สำหรับ transcript Talk แบบ realtime ที่ finalized แล้วซึ่งข้าม `openclaw_agent_consult`

## เครื่องมือและผู้ให้บริการ custom

นโยบายเครื่องมือ, toggle แบบทดลอง, config เครื่องมือที่หนุนโดย provider และการตั้งค่า
provider / base-URL แบบ custom ย้ายไปยังหน้าเฉพาะแล้ว - โปรดดู
[การกำหนดค่า - เครื่องมือและผู้ให้บริการ custom](/th/gateway/config-tools)

## โมเดล

คำนิยาม provider, allowlist ของโมเดล และการตั้งค่า provider แบบ custom อยู่ใน
[การกำหนดค่า - เครื่องมือและผู้ให้บริการ custom](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อกโมเดลแบบ global ด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแค็ตตาล็อก provider (`merge` หรือ `replace`)
- `models.providers`: map ของ provider แบบ custom ที่ key ด้วย provider id
- `models.providers.*.localService`: process manager แบบ on-demand ที่เป็น optional สำหรับ
  เซิร์ฟเวอร์โมเดล local OpenClaw probe health endpoint ที่กำหนดค่าไว้ เริ่ม
  `command` แบบ absolute เมื่อจำเป็น รอความพร้อม แล้วจึงส่งคำขอโมเดล
  โปรดดู [บริการโมเดล local](/th/gateway/local-model-services)
- `models.pricing.enabled`: ควบคุม pricing bootstrap เบื้องหลังที่
  เริ่มหลังจาก sidecar และช่องทางเข้าสู่เส้นทาง ready ของ Gateway เมื่อเป็น `false`
  Gateway จะข้ามการ fetch แค็ตตาล็อก pricing ของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังใช้ได้สำหรับการประเมิน cost แบบ local

## MCP

คำนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้โดย OpenClaw แบบ embedded และ runtime adapter อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการ block นี้โดยไม่เชื่อมต่อกับ
เซิร์ฟเวอร์เป้าหมายระหว่างการแก้ไข config

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: คำนิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือ remote ที่ตั้งชื่อไว้สำหรับ runtime ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` normalize เข้าไปในฟิลด์ canonical `transport`
- `mcp.servers.<name>.enabled`: ตั้งเป็น `false` เพื่อเก็บคำนิยามเซิร์ฟเวอร์ที่บันทึกไว้
  พร้อมตัดออกจากการค้นพบ MCP และการ project เครื่องมือของ OpenClaw แบบ embedded
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout คำขอ MCP รายเซิร์ฟเวอร์
  เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout การเชื่อมต่อรายเซิร์ฟเวอร์
  เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.supportsParallelToolCalls`: hint concurrency แบบ optional สำหรับ
  adapter ที่เลือกได้ว่าจะส่ง MCP tool call แบบ parallel หรือไม่
- `mcp.servers.<name>.auth`: ตั้งเป็น `"oauth"` สำหรับเซิร์ฟเวอร์ HTTP MCP ที่ต้องใช้
  OAuth รัน `openclaw mcp login <name>` เพื่อเก็บ token ภายใต้ state ของ OpenClaw
- `mcp.servers.<name>.oauth`: scope ของ OAuth, redirect URL และการ override URL metadata ของ client แบบ optional
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: ตัวควบคุม HTTP TLS
  สำหรับ endpoint ส่วนตัวและ mutual TLS
- `mcp.servers.<name>.toolFilter`: การเลือกเครื่องมือรายเซิร์ฟเวอร์แบบ optional `include`
  จำกัดเครื่องมือ MCP ที่ค้นพบให้เหลือชื่อที่ match; `exclude` ซ่อนชื่อที่ match
  รายการคือชื่อเครื่องมือ MCP แบบ exact หรือ glob `*` แบบง่าย เซิร์ฟเวอร์ที่มี
  resource หรือ prompt ยังสร้างชื่อเครื่องมือ utility (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) และชื่อเหล่านั้นใช้
  filter เดียวกัน
- `mcp.servers.<name>.codex`: ตัวควบคุมการ project app-server ของ Codex แบบ optional
  block นี้เป็น metadata ของ OpenClaw สำหรับ thread app-server ของ Codex เท่านั้น; ไม่
  ส่งผลต่อ session ACP, config harness Codex แบบ generic หรือ runtime adapter อื่นๆ
  `codex.agents` ที่ไม่ว่างจะจำกัดเซิร์ฟเวอร์ให้ใช้กับ id เอเจนต์ OpenClaw ที่ระบุไว้เท่านั้น
  รายการเอเจนต์ที่จำกัดขอบเขตซึ่งว่างเปล่า เป็นช่องว่าง หรือไม่ถูกต้อง จะถูก config validation ปฏิเสธ
  และถูกละเว้นโดยเส้นทาง runtime projection แทนที่จะกลายเป็น global
  `codex.defaultToolsApprovalMode` emit ค่า native ของ Codex
  `default_tools_approval_mode` สำหรับเซิร์ฟเวอร์นั้น OpenClaw จะลบ block `codex`
  ก่อนส่ง config native `mcp_servers` ให้ Codex ละ block นี้เพื่อ
  ให้เซิร์ฟเวอร์ถูก project สำหรับเอเจนต์ app-server ของ Codex ทุกตัวด้วย
  พฤติกรรม approval MCP เริ่มต้นของ Codex
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ runtime MCP แบบบันเดิลที่จำกัดขอบเขตตาม session
  การรัน embedded แบบ one-shot ขอ cleanup เมื่อ run-end; TTL นี้เป็น backstop สำหรับ
  session ที่มีอายุยาวและ caller ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` hot-apply โดย dispose runtime MCP ของ session ที่ cache ไว้
  การค้นพบ/ใช้เครื่องมือครั้งถัดไปจะสร้างใหม่จาก config ใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL
- การค้นพบ runtime ยังเคารพการแจ้งเตือนการเปลี่ยนแปลงรายการเครื่องมือ MCP โดย drop
  catalog ที่ cache ไว้สำหรับ session นั้น เซิร์ฟเวอร์ที่ประกาศ resource หรือ
  prompt จะได้เครื่องมือ utility สำหรับ list/read resource และ list/fetch
  prompt ความล้มเหลวของ tool-call ที่เกิดซ้ำจะ pause เซิร์ฟเวอร์ที่ได้รับผลกระทบชั่วครู่ก่อน
  พยายาม call อีกครั้ง

โปรดดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[แบ็กเอนด์ CLI](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรม runtime

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: allowlist แบบ optional สำหรับ Skills ที่บันเดิลเท่านั้น (Skills แบบ managed/workspace ไม่ได้รับผลกระทบ)
- `load.extraDirs`: root ของ skill ที่แชร์เพิ่มเติม (precedence ต่ำสุด)
- `load.allowSymlinkTargets`: root เป้าหมายจริงที่ trusted ซึ่ง symlink ของ skill อาจ
  resolve เข้าไปได้เมื่อ link อยู่นอก source root ที่กำหนดค่าไว้
- `workshop.allowSymlinkTargetWrites`: อนุญาตให้ Skill Workshop apply เขียน
  ผ่านเป้าหมาย symlink ที่ trusted อยู่แล้ว (ค่าเริ่มต้น: false)
- `install.preferBrew`: เมื่อเป็น true ให้เลือก installer ของ Homebrew ก่อนเมื่อมี `brew`
  ก่อน fallback ไปยัง installer ชนิดอื่น
- `install.nodeManager`: preference ของ node installer สำหรับ spec `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `install.allowUploadedArchives`: อนุญาตให้ client Gateway ที่ trusted `operator.admin`
  ติดตั้ง archive zip ส่วนตัวที่ stage ผ่าน `skills.upload.*`
  (ค่าเริ่มต้น: false) สิ่งนี้เปิดใช้เฉพาะเส้นทาง uploaded-archive; การติดตั้ง ClawHub
  ปกติไม่ต้องใช้ค่านี้
- `entries.<skillKey>.enabled: false` ปิดใช้ skill แม้ว่าจะบันเดิล/ติดตั้งแล้วก็ตาม
- `entries.<skillKey>.apiKey`: ความสะดวกสำหรับ Skills ที่ประกาศ env var หลัก (สตริง plaintext หรือ object SecretRef)

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

- โหลดจากไดเรกทอรีแพ็กเกจหรือบันเดิลภายใต้ `~/.openclaw/extensions` และ `<workspace>/.openclaw/extensions` รวมถึงไฟล์หรือไดเรกทอรีที่ระบุใน `plugins.load.paths`
- วางไฟล์ Plugin แบบสแตนด์อโลนไว้ใน `plugins.load.paths`; รากส่วนขยายที่ค้นพบอัตโนมัติจะละเว้นไฟล์ `.js`, `.mjs` และ `.ts` ระดับบนสุด เพื่อไม่ให้สคริปต์ตัวช่วยในรากเหล่านั้นบล็อกการเริ่มต้น
- การค้นพบรองรับ Plugin OpenClaw แบบเนทีฟ รวมถึงบันเดิล Codex และบันเดิล Claude ที่เข้ากันได้ รวมทั้งบันเดิลเลย์เอาต์เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการตั้งค่าต้องรีสตาร์ท Gateway**
- `allow`: allowlist ทางเลือก (โหลดเฉพาะ Plugin ที่ระบุ) `deny` มีผลเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกระดับ Plugin สำหรับคีย์ API (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แมปตัวแปรสภาพแวดล้อมเฉพาะขอบเขต Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` แกนหลักจะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไข prompt จาก `before_agent_start` แบบ legacy ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบ legacy ไว้ ใช้กับ hook ของ Plugin แบบเนทีฟและไดเรกทอรี hook ที่บันเดิลจัดเตรียมให้ซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่เชื่อถือได้และไม่ใช่บันเดิลอาจอ่านเนื้อหาการสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ override `provider` และ `model` ต่อการรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist ทางเลือกของเป้าหมาย `provider/model` แบบ canonical สำหรับ override ของ subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ override โมเดลสำหรับ `api.runtime.llm.complete`
- `plugins.entries.<id>.llm.allowedModels`: allowlist ทางเลือกของเป้าหมาย `provider/model` แบบ canonical สำหรับ override การ completion ของ LLM จาก Plugin ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowAgentIdOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้รัน `api.runtime.llm.complete` กับ id ของ agent ที่ไม่ใช่ค่าเริ่มต้น
- `plugins.entries.<id>.config`: อ็อบเจกต์การตั้งค่าที่ Plugin กำหนด (ตรวจสอบความถูกต้องโดย schema ของ Plugin OpenClaw แบบเนทีฟเมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ Plugin ช่องทางอยู่ภายใต้ `channels.<id>` และควรอธิบายโดยเมทาดาทา `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดย registry ตัวเลือกกลางของ OpenClaw

### การตั้งค่า Plugin ฮาร์เนส Codex

Plugin `codex` ที่รวมมาเป็นเจ้าของการตั้งค่าฮาร์เนส app-server ของ Codex แบบเนทีฟภายใต้
`plugins.entries.codex.config` ดูพื้นผิวการตั้งค่าทั้งหมดได้ที่
[ข้อมูลอ้างอิงฮาร์เนส Codex](/th/plugins/codex-harness-reference) และดูโมเดลรันไทม์ได้ที่ [ฮาร์เนส Codex](/th/plugins/codex-harness)

`codexPlugins` ใช้กับเซสชันที่เลือกฮาร์เนส Codex แบบเนทีฟเท่านั้น
ไม่ได้เปิดใช้ Plugin Codex สำหรับการรันผู้ให้บริการ OpenClaw, การผูกการสนทนา
ACP หรือฮาร์เนสที่ไม่ใช่ Codex ใดๆ

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: เปิดใช้การรองรับ
  Plugin/แอป Codex แบบเนทีฟสำหรับฮาร์เนส Codex ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  นโยบายค่าเริ่มต้นสำหรับ action ทำลายล้างของการขอ elicitation จากแอป Plugin ที่ย้ายมา
  ใช้ `true` เพื่อยอมรับ schema การอนุมัติของ Codex ที่ปลอดภัยโดยไม่ต้องถาม, `false`
  เพื่อปฏิเสธ, `"auto"` เพื่อกำหนดเส้นทางการอนุมัติที่ Codex ต้องการผ่านการอนุมัติ
  Plugin ของ OpenClaw หรือ `"ask"` เพื่อถามทุกครั้งสำหรับการเขียน/การกระทำทำลายล้างของ Plugin
  โดยไม่มีการอนุมัติถาวร โหมด `"ask"` จะล้าง override การอนุมัติ
  ต่อเครื่องมือของ Codex แบบถาวรสำหรับแอปที่ได้รับผลกระทบ และเลือกผู้ตรวจทาน
  การอนุมัติที่เป็นมนุษย์สำหรับแอปนั้นก่อนที่ thread ของ Codex จะเริ่ม
  ค่าเริ่มต้น: `true`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: เปิดใช้
  รายการ Plugin ที่ย้ายมาเมื่อ `codexPlugins.enabled` ส่วนกลางเป็น true ด้วย
  ค่าเริ่มต้น: `true` สำหรับรายการที่ระบุชัดเจน
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  ตัวตน marketplace ที่เสถียร V1 รองรับเฉพาะ `"openai-curated"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: ตัวตน
  Plugin Codex ที่เสถียรจากการย้ายข้อมูล เช่น `"google-calendar"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override การกระทำทำลายล้างราย Plugin เมื่อไม่ระบุ จะใช้ค่า
  `allow_destructive_actions` ส่วนกลาง ค่าราย Plugin รองรับนโยบาย
  `true`, `false`, `"auto"` หรือ `"ask"` เดียวกัน

แต่ละแอป Plugin ที่ได้รับอนุญาตซึ่งใช้ `"ask"` จะกำหนดเส้นทางคำขออนุมัติของแอปนั้น
ไปยังผู้ตรวจทานที่เป็นมนุษย์ แอปอื่นๆ และการอนุมัติ thread ที่ไม่ใช่แอปยังคงใช้
ผู้ตรวจทานที่ตั้งค่าไว้ ดังนั้นนโยบาย Plugin แบบผสมจะไม่สืบทอดพฤติกรรม `"ask"`

`codexPlugins.enabled` คือคำสั่งเปิดใช้ส่วนกลาง รายการ Plugin ที่ระบุชัดเจน
ซึ่งเขียนโดยการย้ายข้อมูลคือชุดการติดตั้งถาวรและสิทธิ์สำหรับการซ่อมแซม
ไม่รองรับ `plugins["*"]` ไม่มีสวิตช์ `install` และค่า
`marketplacePath` แบบ local ไม่ได้เป็นฟิลด์การตั้งค่าโดยตั้งใจ เพราะเป็นค่าเฉพาะ host

การตรวจ readiness ของ `app/list` จะถูกแคชไว้หนึ่งชั่วโมงและรีเฟรช
แบบอะซิงโครนัสเมื่อเก่า การตั้งค่าแอปของ thread Codex จะถูกคำนวณเมื่อสร้างเซสชัน
ฮาร์เนส Codex ไม่ใช่ทุก turn; ใช้ `/new`, `/reset` หรือรีสตาร์ท Gateway
หลังจากเปลี่ยนการตั้งค่า Plugin แบบเนทีฟ

- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการดึงเว็บของ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl ทางเลือกสำหรับขีดจำกัดที่สูงขึ้น (รองรับ SecretRef) ถอยกลับไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ API Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; override แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: เวลาหมดอายุคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นเว็บ Grok)
  - `enabled`: เปิดใช้ผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่จะใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดูเฟสและ threshold ได้ที่ [Dreaming](/th/concepts/dreaming)
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ cron สำหรับการ sweep dreaming เต็มรูปแบบแต่ละครั้ง (`"0 3 * * *"` โดยค่าเริ่มต้น)
  - `model`: override โมเดล subagent Dream Diary ทางเลือก ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะลองอีกครั้งหนึ่งครั้งด้วยโมเดลค่าเริ่มต้นของเซสชัน; ความล้มเหลวด้านความเชื่อถือหรือ allowlist จะไม่ถอยกลับแบบเงียบๆ
  - นโยบายเฟสและ threshold เป็นรายละเอียดการนำไปใช้ (ไม่ใช่คีย์การตั้งค่าสำหรับผู้ใช้)
- การตั้งค่า memory ทั้งหมดอยู่ใน [ข้อมูลอ้างอิงการตั้งค่า Memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้แล้วยังสามารถเพิ่มค่าเริ่มต้น OpenClaw แบบฝังตัวจาก `settings.json` ได้ด้วย; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ผ่านการ sanitize แล้ว ไม่ใช่แพตช์การตั้งค่า OpenClaw ดิบ
- `plugins.slots.memory`: เลือก id ของ Plugin memory ที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้ Plugin memory
- `plugins.slots.contextEngine`: เลือก id ของ Plugin context engine ที่ใช้งานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

---

## Commitments

`commitments` ควบคุม memory ติดตามผลที่อนุมานได้: OpenClaw สามารถตรวจจับ check-in จาก turn การสนทนาและส่งผ่านการรัน Heartbeat ได้

- `commitments.enabled`: เปิดใช้การสกัดด้วย LLM แบบซ่อน, การจัดเก็บ และการส่งผ่าน Heartbeat สำหรับ commitment ติดตามผลที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวน commitment ติดตามผลที่อนุมานได้สูงสุดที่ส่งต่อเซสชัน agent ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

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
- `tabCleanup` เรียกคืนแท็บของ primary-agent ที่ติดตามไว้หลังจากไม่มีการใช้งาน หรือเมื่อ
  เซสชันเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมด cleanup แต่ละแบบเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดโดยค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางของเบราว์เซอร์ผ่านเครือข่ายส่วนตัวเท่านั้น
- ในโหมดเข้มงวด endpoint โปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบความสามารถในการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias เดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับความสามารถในการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ loopback ที่จัดการโดยระบบ
  ยังคงใช้ค่าเริ่มต้น CDP ภายในเครื่อง
- หากบริการ CDP ที่จัดการจากภายนอกสามารถเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ภายในเครื่องที่จัดการโดยระบบ และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตภายในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบบน
  โฮสต์ที่เลือกหรือผ่าน Node เบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมายไปยัง
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` สามารถตั้งค่า `cdpUrl` เมื่อ Chrome กำลังทำงานอยู่
  เบื้องหลัง endpoint การค้นพบ DevTools HTTP(S) หรือ endpoint WS(S) โดยตรง ใน
  โหมดนั้น OpenClaw จะส่ง endpoint ให้ Chrome MCP แทนการใช้ auto-connect;
  `userDataDir` จะถูกละเว้นสำหรับอาร์กิวเมนต์การเปิด Chrome MCP
- โปรไฟล์ `existing-session` ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การกระทำที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS-selector, hook อัปโหลดไฟล์เดียว,
  ไม่มีการแทนที่ timeout ของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการกระทำแบบ batch
- โปรไฟล์ `openclaw` ภายในเครื่องที่จัดการโดยระบบจะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับโปรไฟล์ CDP ระยะไกลหรือการแนบ endpoint ของ existing-session
- โปรไฟล์ภายในเครื่องที่จัดการโดยระบบสามารถตั้งค่า `executablePath` เพื่อแทนที่ค่า
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ภายในเครื่องที่จัดการโดยระบบใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังจากเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังการเปิด เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  รับ `~` และ `~/...` สำหรับไดเรกทอรีบ้านของ OS ก่อนเปิด Chromium
  `userDataDir` รายโปรไฟล์บนโปรไฟล์ `existing-session` จะขยายเครื่องหมาย tilde ด้วยเช่นกัน
- บริการควบคุม: เฉพาะ loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดเพิ่มเติมให้การเริ่มต้น Chromium ภายในเครื่อง (เช่น
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

- `seamColor`: สีเน้นสำหรับ chrome ของ UI แอปเนทีฟ (เฉดสีบับเบิล Talk Mode เป็นต้น)
- `assistant`: การแทนที่ตัวตนของ Control UI ถอยกลับไปใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มต้น เว้นแต่จะเป็น `local`.
- `port`: พอร์ตแบบ multiplexed เดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ Tailscale IP) หรือ `custom`.
- **นามแฝง bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงของโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะมาถึงที่ `eth0` ดังนั้น Gateway จึงเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ.
- **Auth**: จำเป็นโดยค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้ Gateway auth ในทางปฏิบัติหมายถึง token/password ที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` ตัวช่วย onboarding จะสร้าง token เป็นค่าเริ่มต้น.
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` เป็น `token` หรือ `password` อย่างชัดเจน โฟลว์การเริ่มต้นและการติดตั้ง/ซ่อมแซม service จะล้มเหลวเมื่อกำหนดค่าทั้งสองรายการและไม่ได้ตั้ง mode.
- `gateway.auth.mode: "none"`: โหมดไม่มี auth แบบชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โดยตั้งใจไม่เสนอผ่านพรอมป์ onboarding.
- `gateway.auth.mode: "trusted-proxy"`: มอบหมาย browser/user auth ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือ identity headers จาก `gateway.trustedProxies` (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่ง proxy ที่ **ไม่ใช่ loopback** โดยค่าเริ่มต้น reverse proxy แบบ same-host loopback ต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ตัวเรียกภายใน same-host สามารถใช้ `gateway.auth.password` เป็น fallback แบบ direct local ได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้.
- `gateway.auth.allowTailscale`: เมื่อเป็น `true`, identity headers ของ Tailscale Serve สามารถใช้ผ่าน Control UI/WebSocket auth ได้ (ตรวจสอบผ่าน `tailscale whois`) endpoints ของ HTTP API จะ **ไม่** ใช้ header auth ของ Tailscale นั้น แต่จะทำตามโหมด HTTP auth ปกติของ Gateway แทน โฟลว์แบบไม่มี token นี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: ตัวจำกัด failed-auth แบบเลือกได้ ใช้ต่อ client IP และต่อ auth scope (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะคืนค่า `429` + `Retry-After`.
  - บนพาธ async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูก serialize ก่อนเขียน failure ดังนั้นความพยายามที่ผิดพร้อมกันจาก client เดียวกันจึงอาจทำให้ตัวจำกัดทำงานที่คำขอที่สอง แทนที่ทั้งคู่จะแข่งผ่านไปเป็น mismatch ธรรมดา.
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูก rate-limit ด้วย (สำหรับการตั้งค่าทดสอบหรือการติดตั้ง proxy แบบเข้มงวด).
- ความพยายาม auth ของ WS จาก browser-origin จะถูก throttle เสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost จากเบราว์เซอร์).
- บน loopback การ lockout จาก browser-origin เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้น failure ซ้ำจาก origin localhost หนึ่งจะไม่
  lockout origin อื่นโดยอัตโนมัติ.
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้ auth).
- `tailscale.serviceName`: ชื่อ Tailscale Service แบบเลือกได้สำหรับโหมด Serve เช่น
  `svc:openclaw` เมื่อตั้งค่าแล้ว OpenClaw จะส่งต่อให้ `tailscale serve
--service` เพื่อให้ Control UI เปิดเผยผ่าน Service ที่มีชื่อแทน
  hostname ของอุปกรณ์ ค่าต้องใช้รูปแบบชื่อ Service ของ Tailscale คือ `svc:<dns-label>`;
  การเริ่มต้นจะรายงาน URL ของ Service ที่ได้มา.
- `tailscale.preserveFunnel`: เมื่อเป็น `true` และ `tailscale.mode = "serve"`, OpenClaw
  จะตรวจสอบ `tailscale funnel status` ก่อนนำ Serve ไปใช้ซ้ำเมื่อเริ่มต้น และข้าม
  หาก route ของ Funnel ที่กำหนดค่าจากภายนอกครอบคลุมพอร์ต Gateway อยู่แล้ว
  ค่าเริ่มต้น `false`.
- `controlUi.allowedOrigins`: allowlist ของ browser-origin แบบชัดเจนสำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นสำหรับ browser origins สาธารณะที่ไม่ใช่ loopback การโหลด UI แบบ private same-origin LAN/Tailnet จาก loopback, RFC1918/link-local, `.local`, `.ts.net` หรือโฮสต์ Tailscale CGNAT จะได้รับการยอมรับโดยไม่ต้องเปิดใช้ Host-header fallback.
- `controlUi.chatMessageMaxWidth`: max-width แบบเลือกได้สำหรับข้อความแชท Control UI ที่จัดกลุ่ม รองรับค่า CSS width ที่มีขอบเขต เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ Host-header origin fallback สำหรับการติดตั้งที่ตั้งใจพึ่งพานโยบาย Host-header origin.
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `wss://` สำหรับโฮสต์สาธารณะ; plaintext `ws://` จะยอมรับเฉพาะ loopback, LAN, link-local, `.local`, `.ts.net` และโฮสต์ Tailscale CGNAT.
- `remote.remotePort`: พอร์ต Gateway บนโฮสต์ SSH ระยะไกล ค่าเริ่มต้นเป็น `18789`; ใช้ค่านี้เมื่อพอร์ต tunnel ฝั่ง local ต่างจากพอร์ต Gateway ระยะไกล.
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวของ remote-client ฟิลด์เหล่านี้ไม่ได้กำหนดค่า Gateway auth ด้วยตัวเอง.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS พื้นฐานสำหรับ APNs relay ภายนอกที่ใช้หลังจาก build iOS แบบ relay-backed เผยแพร่การลงทะเบียนไปยัง Gateway build สาธารณะบน App Store ใช้ relay ที่โฮสต์โดย OpenClaw URL relay แบบกำหนดเองต้องตรงกับพาธ build/deployment ของ iOS ที่แยกต่างหากโดยตั้งใจ ซึ่ง URL relay ชี้ไปยัง relay นั้น.
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก Gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นเป็น `10000`.
- การลงทะเบียนแบบ relay-backed จะถูกมอบหมายให้ identity ของ Gateway เฉพาะตัว แอป iOS ที่จับคู่กันจะดึง `gateway.identity.get`, รวม identity นั้นในการลงทะเบียน relay และส่งต่อ grant การส่งที่ scoped ตามการลงทะเบียนให้ Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้นั้นไปใช้ซ้ำได้.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env override ชั่วคราวสำหรับ config relay ข้างต้น.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL relay แบบ HTTP loopback URL relay สำหรับ production ควรอยู่บน HTTPS.
- `gateway.handshakeTimeoutMs`: timeout ของ pre-auth Gateway WebSocket handshake เป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่ง client local สามารถเชื่อมต่อได้ขณะที่ warmup ตอนเริ่มต้นยังคงนิ่งตัวอยู่.
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของ channel health-monitor เป็นนาที ตั้ง `0` เพื่อปิด health-monitor restarts ทั่วทั้งระบบ ค่าเริ่มต้น: `5`.
- `gateway.channelStaleEventThresholdMinutes`: threshold ของ stale-socket เป็นนาที ควรให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`.
- `gateway.channelMaxRestartsPerHour`: จำนวน health-monitor restarts สูงสุดต่อ channel/account ในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out ราย channel สำหรับ health-monitor restarts ขณะที่ยังเปิด monitor ส่วนกลางไว้.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override ราย account สำหรับ channel แบบหลาย account เมื่อตั้งค่าแล้ว จะมีลำดับความสำคัญเหนือ override ระดับ channel.
- พาธการเรียก Gateway แบบ local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`.
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาปิดบัง).
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือ inject forwarded-client headers ระบุเฉพาะ proxy ที่คุณควบคุมเท่านั้น รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่า proxy/local-detection แบบ same-host (เช่น Tailscale Serve หรือ reverse proxy local) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: เมื่อเป็น `true`, Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อพฤติกรรม fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP แบบเลือกได้สำหรับอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มี scopes ที่ร้องขอ ปิดใช้งานเมื่อไม่ได้ตั้งค่า รายการนี้ไม่ auto-approve การจับคู่ operator/browser/Control UI/WebChat และไม่ auto-approve การอัปเกรด role, scope, metadata หรือ public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การปรับรูปแบบ allow/deny ส่วนกลางสำหรับคำสั่ง node ที่ประกาศไว้หลังการจับคู่และการประเมิน platform allowlist ใช้ `allowCommands` เพื่อ opt into คำสั่ง node อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ว่า platform default หรือ explicit allow จะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ reject และ re-approve การจับคู่อุปกรณ์นั้นเพื่อให้ Gateway จัดเก็บ snapshot คำสั่งที่อัปเดตแล้ว.
- `gateway.tools.deny`: ชื่อ tool เพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยาย deny list ค่าเริ่มต้น).
- `gateway.tools.allow`: ลบชื่อ tool ออกจาก deny list ของ HTTP ค่าเริ่มต้นสำหรับ
  ตัวเรียก owner/admin การตั้งค่านี้ไม่ได้ยกระดับตัวเรียก `operator.write`
  ที่มี identity ให้เป็นสิทธิ์ owner/admin; `cron`, `gateway` และ `nodes` ยังคง
  ไม่พร้อมใช้งานสำหรับตัวเรียกที่ไม่ใช่ owner แม้จะอยู่ใน allowlist.

</Accordion>

### endpoints ที่เข้ากันได้กับ OpenAI

- Admin HTTP RPC: ปิดโดยค่าเริ่มต้นในฐานะ Plugin `admin-http-rpc` เปิดใช้ Plugin เพื่อ register `POST /api/v1/admin/rpc` ดู [Admin HTTP RPC](/th/plugins/admin-http-rpc).
- Chat Completions: ปิดโดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- การเสริมความแข็งแรงของ URL-input สำหรับ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlists ว่างจะถือว่ายังไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการ fetch URL.
- header เสริมความแข็งแรงของ response แบบเลือกได้:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับ HTTPS origins ที่คุณควบคุม; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลาย instance

เรียกใช้ Gateway หลายตัวบนโฮสต์เดียวด้วยพอร์ตและ state dirs ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flags อำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`).

ดู [Multiple Gateways](/th/gateway/multiple-gateways).

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
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed local โดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; สำหรับการใช้งาน local/dev เท่านั้น.
- `certPath`: พาธ filesystem ไปยังไฟล์ TLS certificate.
- `keyPath`: พาธ filesystem ไปยังไฟล์ TLS private key; จำกัด permission ไว้.
- `caPath`: พาธ CA bundle แบบเลือกได้สำหรับ client verification หรือ custom trust chains.

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
  - `"off"`: ไม่สนใจการแก้ไขสด; การเปลี่ยนแปลงต้อง restart อย่างชัดเจน
  - `"restart"`: restart กระบวนการ gateway เสมอเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ภายในกระบวนการโดยไม่ต้อง restart
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไป restart หากจำเป็น
- `debounceMs`: ช่วง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดที่ไม่บังคับเป็น ms สำหรับรอการดำเนินการที่กำลังทำงานอยู่ก่อนบังคับ restart หรือ hot reload ช่องทาง ละไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้งเป็น `0` เพื่อรอไม่มีกำหนดและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

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

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
โทเค็น hook ใน query string จะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ควรแตกต่างจากการยืนยันตัวตน shared-secret ของ Gateway ที่ใช้งานอยู่ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); startup จะบันทึกคำเตือนด้านความปลอดภัยแบบไม่ร้ายแรงเมื่อตรวจพบการใช้ซ้ำ
- `openclaw security audit` จะระบุการใช้การยืนยันตัวตน hook/Gateway ซ้ำเป็นผลการตรวจพบระดับวิกฤต รวมถึงการยืนยันตัวตนด้วยรหัสผ่านของ Gateway ที่ให้เฉพาะตอน audit (`--auth password --password <password>`) เรียกใช้ `openclaw doctor --fix` เพื่อหมุนเวียน `hooks.token` ที่คงอยู่และถูกใช้ซ้ำ จากนั้นอัปเดตตัวส่ง hook ภายนอกให้ใช้โทเค็น hook ใหม่
- `hooks.path` เป็น `/` ไม่ได้; ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบ template ให้ตั้ง `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์ mapping แบบคงที่ไม่ต้อง opt-in นี้

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก payload ของคำขอจะถูกยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่ render จาก template จะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียด mapping">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ payload สำหรับพาธทั่วไป
- Template เช่น `{{messages[0].subject}}` อ่านจาก payload
- `transform` ชี้ไปยังโมดูล JS/TS ที่คืนค่า action ของ hook ได้
  - `transform.module` ต้องเป็นพาธแบบ relative และต้องอยู่ภายใน `hooks.transformsDir` (พาธแบบ absolute และการไต่พาธจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของ workspace จะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` route ไปยัง agent เฉพาะ; ID ที่ไม่รู้จักจะ fallback ไปยัง agent ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการ route agent ที่มีผล รวมถึงพาธ agent ค่าเริ่มต้นเมื่อไม่ระบุ `agentId` (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์ session แบบคงที่ที่ไม่บังคับสำหรับการรัน hook agent โดยไม่มี `sessionKey` ชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ caller ของ `/hooks/agent` และคีย์ session ของ mapping ที่ขับเคลื่อนด้วย template ตั้ง `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist prefix ที่ไม่บังคับสำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + mapping) เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อกำหนดเมื่อ mapping หรือ preset ใดใช้ `sessionKey` แบบ template
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้งค่า model catalog)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการ route ต่อข้อความแบบนั้นไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องการ `hooks.allowRequestSessionKey: false` ให้ override preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบ template

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

- Gateway เริ่ม `gog gmail watch serve` อัตโนมัติเมื่อ boot หากมีการตั้งค่าไว้ ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่าเรียกใช้ `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

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

- ให้บริการ HTML/CSS/JS ที่ agent แก้ไขได้และ A2UI ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะ local: คง `gateway.bind: "loopback"` (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: route ของ canvas ต้องใช้การยืนยันตัวตน Gateway (token/password/trusted-proxy) เหมือนพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews ไม่ส่งส่วนหัวการยืนยันตัวตน; หลังจากจับคู่และเชื่อมต่อ Node แล้ว Gateway จะประกาศ capability URL ที่มีขอบเขตตาม Node สำหรับการเข้าถึง canvas/A2UI
- capability URL ผูกกับ session WS ของ Node ที่ใช้งานอยู่และหมดอายุเร็ว ไม่มีการใช้ fallback ตาม IP
- inject client live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นอัตโนมัติเมื่อว่าง
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้อง restart gateway
- ปิด live reload สำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

---

## Discovery

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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้งาน Plugin `bonjour` ที่ bundled มา): ละ `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`; การโฆษณา multicast บน LAN ยังต้องเปิดใช้งาน Plugin `bonjour` ที่ bundled มา
- `off`: ระงับการโฆษณา multicast บน LAN โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่ bundled มาจะเริ่มอัตโนมัติบนโฮสต์ macOS และเป็นแบบ opt-in บน Linux, Windows และการ deploy Gateway แบบ containerized
- hostname มีค่าเริ่มต้นเป็น hostname ของระบบเมื่อเป็น label DNS ที่ถูกต้อง และ fallback เป็น `openclaw` Override ด้วย `OPENCLAW_MDNS_HOSTNAME`

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบยูนิคาสต์ไว้ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้คู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

ตั้งค่า: `openclaw dns setup --apply`.

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
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งสองไฟล์ไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดว่าจะมีแต่ยังขาดอยู่จากโปรไฟล์เชลล์ล็อกอินของคุณ
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
- ตัวแปรที่ไม่มีหรือว่างจะทำให้เกิดข้อผิดพลาดเมื่อโหลดการกำหนดค่า
- เอสเคปด้วย `$${VAR}` เพื่อให้ได้ลิเทอรัล `${VAR}`
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
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (รองรับตัวเลือกแบบ AWS เช่น `secret#json_key`)
- id ของ `source: "exec"` ต้องไม่มีเซกเมนต์พาธที่คั่นด้วยสแลชเป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- เป้าหมาย `secrets apply` รองรับพาธข้อมูลรับรองใน `openclaw.json`
- การอ้างอิงใน `auth-profiles.json` รวมอยู่ในการแก้ค่าเวลารันไทม์และความครอบคลุมของการตรวจสอบ

### การกำหนดค่าผู้ให้บริการข้อมูลลับ

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
- พาธของผู้ให้บริการไฟล์และ exec จะล้มเหลวแบบปิดเมื่อไม่สามารถตรวจสอบ ACL ของ Windows ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้และไม่สามารถตรวจสอบได้เท่านั้น
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์และใช้เพย์โหลดโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็นซิมลิงก์จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธซิมลิงก์ พร้อมตรวจสอบพาธเป้าหมายที่แก้ค่าแล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบไดเรกทอรีที่เชื่อถือได้จะใช้กับพาธเป้าหมายที่แก้ค่าแล้ว
- สภาพแวดล้อมของโปรเซสลูก `exec` จะมีค่าน้อยที่สุดโดยค่าเริ่มต้น; ส่งตัวแปรที่ต้องใช้โดยชัดเจนด้วย `passEnv`
- การอ้างอิงข้อมูลลับจะถูกแก้ค่าในเวลาที่เปิดใช้งานเป็นสแนปช็อตในหน่วยความจำ จากนั้นพาธคำขอจะอ่านเฉพาะสแนปช็อตนั้น
- การกรองพื้นผิวที่ใช้งานจะมีผลระหว่างการเปิดใช้งาน: การอ้างอิงที่แก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้จะทำให้การเริ่มต้น/โหลดซ้ำล้มเหลว ส่วนพื้นผิวที่ไม่ใช้งานจะถูกข้ามพร้อมการวินิจฉัย

---

## ที่เก็บข้อมูลการยืนยันตัวตน

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- โปรไฟล์ต่อเอเจนต์ถูกเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลประจำตัวแบบคงที่
- แมป `auth-profiles.json` แบบแบนเดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบรันไทม์; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key แบบมาตรฐาน `provider:default` พร้อมสำรองข้อมูลเป็น `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลประจำตัว auth-profile ที่อ้างอิงผ่าน SecretRef
- ข้อมูลประจำตัวรันไทม์แบบคงที่มาจากสแนปช็อตที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่เดิมจะถูกล้างเมื่อพบ
- การนำเข้า OAuth เดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมรันไทม์ของ Secrets และเครื่องมือ `audit/configure/apply`: [การจัดการ Secrets](/th/gateway/secrets)

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

- `billingBackoffHours`: ค่า backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาดด้านการเรียกเก็บเงินจริงหรือเครดิตไม่เพียงพอ (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินแบบชัดเจนอาจยังเข้ามาในเส้นทางนี้ได้แม้บนการตอบกลับ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดอยู่กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` ที่ลองใหม่ได้เกี่ยวกับกรอบการใช้งาน หรือขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซ จะยังอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: การ override จำนวนชั่วโมง backoff ด้านการเรียกเก็บเงินแบบรายผู้ให้บริการที่เป็นทางเลือก
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ backoff ด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ค่า backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบ rolling เป็นชั่วโมงที่ใช้กับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ภายในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะเข้ามาในเส้นทางนี้
- `overloadedBackoffMs`: ดีเลย์คงที่ก่อนลองหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่ overloaded อีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ภายในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) กลุ่ม rate-limit นั้นรวมข้อความที่มีรูปแบบตามผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- ตั้งค่า `logging.file` สำหรับพาธที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดสูงสุดของไฟล์ log ที่ใช้งานอยู่เป็นไบต์ก่อนหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw จะเก็บไฟล์ archive แบบมีหมายเลขไว้สูงสุดห้าไฟล์ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบ best-effort สำหรับเอาต์พุตคอนโซล, ไฟล์ log, ระเบียน log ของ OTLP และข้อความ transcript ของเซสชันที่ถูกเก็บถาวร `redactSensitive: "off"` จะปิดเฉพาะนโยบาย log/transcript ทั่วไปนี้เท่านั้น; พื้นผิวด้านความปลอดภัยของ UI/tool/diagnostic จะยังคง redact secrets ก่อนส่งออก

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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
- `flags`: อาร์เรย์ของสตริง flag ที่เปิดใช้เอาต์พุต log แบบเจาะจง (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภทเซสชันประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, tool, สถานะ, บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; diagnostic `session.stuck` ที่ซ้ำจะ back off ขณะไม่มีการเปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms ก่อนที่งาน active ที่ stalled และเข้าเกณฑ์อาจถูก abort-drain เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่าง embedded-run ที่ยาวขึ้นและปลอดภัยกว่าอย่างน้อย 5 นาทีและ 3 เท่าของ `stuckSessionWarnMs`
- `memoryPressureSnapshot`: จับสแนปช็อตเสถียรภาพก่อน OOM แบบ redacted เมื่อแรงกดดันหน่วยความจำถึงระดับ `critical` (ค่าเริ่มต้น: `false`) ตั้งเป็น `true` เพื่อเพิ่มการสแกน/เขียนไฟล์ชุดเสถียรภาพ ขณะที่ยังคงเก็บเหตุการณ์แรงกดดันหน่วยความจำตามปกติ
- `otel.enabled`: เปิดใช้ pipeline ส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าครบถ้วน แคตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะสัญญาณที่เป็นทางเลือก เมื่อตั้งค่าไว้ จะ override `otel.endpoint` เฉพาะสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: header metadata HTTP/gRPC เพิ่มเติมที่ส่งไปกับคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.logsExporter`: sink สำหรับส่งออก log: `"otlp"` (ค่าเริ่มต้น), `"stdout"` สำหรับ JSON object หนึ่งรายการต่อบรรทัด stdout หรือ `"both"`
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry ตามรอบเป็น ms
- `otel.captureContent`: การจับเนื้อหาดิบแบบ opt-in สำหรับ attributes ของ span OTEL ค่าเริ่มต้นคือปิด Boolean `true` จะจับเนื้อหา message/tool ที่ไม่ใช่ system; รูปแบบ object ช่วยให้เปิด `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` และ `toolDefinitions` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์ environment สำหรับรูปแบบ span inference ของ GenAI รุ่นทดลองล่าสุด รวมถึงชื่อ span `{gen_ai.operation.name} {gen_ai.request.model}`, ชนิด span `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` เดิม โดยค่าเริ่มต้น span จะคง `openclaw.model.call` และ `gen_ai.system` ไว้เพื่อความเข้ากันได้; metrics ของ GenAI ใช้ semantic attributes แบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์ environment สำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น OpenClaw จะข้ามการ startup/shutdown ของ SDK ที่ Plugin เป็นเจ้าของ ขณะที่ยังคงให้ diagnostic listeners ทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars endpoint เฉพาะสัญญาณที่ใช้เมื่อ config key ที่ตรงกันไม่ได้ตั้งค่า
- `cacheTrace.enabled`: บันทึกสแนปช็อต cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
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

- `channel`: release channel สำหรับการติดตั้ง npm/git - `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจหาการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้ auto-update เบื้องหลังสำหรับการติดตั้ง package (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ดีเลย์ขั้นต่ำเป็นชั่วโมงก่อน auto-apply ใน stable-channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
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

- `enabled`: feature gate ของ ACP แบบ global (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อน ACP dispatch และ affordance สำหรับ spawn)
- `dispatch.enabled`: gate แยกต่างหากสำหรับการ dispatch turn ของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังคงพร้อมใช้งาน แต่บล็อกการดำเนินการ
- `backend`: id ของ backend รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง backend Plugin ก่อน และหากตั้งค่า `plugins.allow` ไว้ ให้รวม id ของ backend Plugin (เช่น `acpx`) ไม่เช่นนั้น backend ACP จะไม่ถูกโหลด
- `defaultAgent`: id ของเอเจนต์เป้าหมาย ACP สำรองเมื่อ spawns ไม่ได้ระบุเป้าหมายชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชันรันไทม์ ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ active พร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่าง flush เมื่อ idle เป็น ms สำหรับข้อความแบบ streamed
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยก projection ของบล็อกแบบ streamed
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/tool ที่ซ้ำต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` stream แบบเพิ่มทีละส่วน; `"final_only"` buffer จนถึงเหตุการณ์ terminal ของ turn
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์ tool ที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุต assistant สูงสุดที่ project ต่อ turn ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ project
- `stream.tagVisibility`: ระเบียนของชื่อ tag ไปยังค่า override การมองเห็นแบบ boolean สำหรับเหตุการณ์ streamed
- `runtime.ttlMinutes`: TTL เมื่อ idle เป็นนาทีสำหรับ worker ของเซสชัน ACP ก่อนเข้าเกณฑ์ cleanup
- `runtime.installCommand`: คำสั่งติดตั้งที่เป็นทางเลือกให้รันเมื่อ bootstrap สภาพแวดล้อมรันไทม์ ACP

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

- `cli.banner.taglineMode` ควบคุมรูปแบบคำโปรยของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): คำโปรยตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: คำโปรยเป็นกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความคำโปรย (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่แค่คำโปรย) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## วิซาร์ด

เมตาดาทาที่เขียนโดยโฟลว์การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## ข้อมูลประจำตัว

ดูฟิลด์ข้อมูลประจำตัวของ `agents.list` ใต้ [ค่าเริ่มต้นของ Agent](/th/gateway/config-agents#agent-defaults)

---

## บริดจ์ (เดิม, ถูกลบแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมาคอนฟิกอีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถตัดคีย์ที่ไม่รู้จักออกได้)

<Accordion title="คอนฟิกบริดจ์เดิม (อ้างอิงทางประวัติศาสตร์)">

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์ก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้างทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวรแล้ว ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ยอมรับเพื่อความเข้ากันได้กับบันทึกการรัน Cron แบบอิงไฟล์รุ่นเก่า ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: แถวประวัติการรัน SQLite ล่าสุดที่เก็บไว้ต่อหนึ่งงาน ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง Cron Webhook POST (`delivery.mode = "webhook"`), หากละไว้จะไม่ส่งส่วนหัว auth
- `webhook`: URL Webhook สำรองแบบเดิมที่เลิกใช้แล้ว (http/https) ซึ่ง `openclaw doctor --fix` ใช้เพื่อย้ายงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`; การส่งใน runtime ใช้ `delivery.mode="webhook"` ต่อแต่ละงานร่วมกับ `delivery.to`, หรือ `delivery.completionDestination` เมื่อรักษาการส่งแบบประกาศไว้

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

- `maxAttempts`: จำนวนครั้งสูงสุดที่ลองใหม่สำหรับงาน Cron เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`-`10`)
- `backoffMs`: อาร์เรย์ของความล่าช้าแบบ backoff หน่วย ms สำหรับแต่ละครั้งที่ลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่กระตุ้นให้ลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อลองใหม่กับประเภทชั่วคราวทั้งหมด

งานแบบครั้งเดียวจะยังเปิดใช้งานอยู่จนกว่าการลองใหม่จะหมด จากนั้นจะปิดใช้งานพร้อมเก็บสถานะข้อผิดพลาดสุดท้ายไว้ งานแบบเกิดซ้ำใช้นโยบายการลองใหม่สำหรับข้อผิดพลาดชั่วคราวเดียวกันเพื่อรันอีกครั้งหลัง backoff ก่อนช่วงเวลาที่กำหนดถัดไป; ข้อผิดพลาดถาวรหรือการลองใหม่สำหรับข้อผิดพลาดชั่วคราวที่หมดแล้วจะกลับไปใช้กำหนดการแบบเกิดซ้ำปกติพร้อม error backoff

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
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมเข้ากับเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดในการดำเนินการ
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือรหัสช่องทางแบบเลือกได้เพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบประกาศ `"last"` ใช้ช่องทางการส่งที่รู้จักล่าสุดซ้ำ
- `to`: เป้าหมายการประกาศหรือ URL Webhook แบบชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีแบบเลือกได้สำหรับการส่ง
- `delivery.failureDestination` ต่อแต่ละงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและต่อแต่ละงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมายการประกาศหลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวยึดตำแหน่งเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี wrapper ประวัติ/ผู้ส่ง)        |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                     |
| `{{To}}`           | ตัวระบุปลายทาง                                    |
| `{{MessageSid}}`   | รหัสข้อความของช่องทาง                            |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                           |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                         |
| `{{MediaPath}}`    | พาธสื่อภายในเครื่อง                              |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)               |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                  |
| `{{Prompt}}`       | พรอมป์สื่อที่ resolve แล้วสำหรับรายการ CLI       |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่ resolve แล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (best effort)                         |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (best effort)                 |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (best effort)                |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (best effort)           |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord, ฯลฯ) |

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

**พฤติกรรมการรวม:**

- ไฟล์เดียว: แทนที่ออบเจ็กต์ที่บรรจุอยู่
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (รายการหลังแทนที่รายการก่อน)
- คีย์พี่น้อง: รวมหลัง include (แทนที่ค่าที่ include มา)
- include ซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve เทียบกับไฟล์ที่ include แต่ต้องอยู่ภายในไดเรกทอรีคอนฟิกระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ absolute/`../` อนุญาตเฉพาะเมื่อยัง resolve อยู่ภายในขอบเขตนั้น พาธต้องไม่มี null byte และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการ resolve
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะหนึ่งส่วนระดับบนสุดที่รองรับโดย include แบบไฟล์เดียวจะเขียนต่อไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- root include, อาร์เรย์ include, และ include ที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะ fail closed แทนการ flatten คอนฟิก
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดการ parse, include แบบวนซ้ำ, รูปแบบพาธไม่ถูกต้อง, และความยาวเกินกำหนด

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
