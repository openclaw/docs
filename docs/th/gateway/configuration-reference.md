---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อยเฉพาะ
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-07-03T23:46:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการตั้งค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมตามงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการตั้งค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตนเอง แค็ตตาล็อกคำสั่งที่ channel และ plugin เป็นเจ้าของ รวมถึงตัวปรับแต่ง memory/QMD เชิงลึก อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

ความจริงจากโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema แบบสดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวม metadata ของ bundled/plugin/channel เข้าไปเมื่อพร้อมใช้งาน
- `config.schema.lookup` ส่งคืนโหนด schema หนึ่งรายการที่มีขอบเขตตาม path สำหรับเครื่องมือ drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบ hash baseline ของ config-doc เทียบกับพื้นผิว schema ปัจจุบัน

เส้นทาง lookup ของ agent: ใช้ tool action `config.schema.lookup` ของ `gateway` สำหรับ
เอกสารและข้อจำกัดระดับ field ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำตามงาน และใช้หน้านี้
สำหรับแผนที่ field ที่กว้างขึ้น ค่า default และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะทาง:

- [ข้อมูลอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการตั้งค่า dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้า channel/plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะ channel

รูปแบบ config คือ **JSON5** (อนุญาตให้มี comments + trailing commas) ทุก field เป็น optional - OpenClaw ใช้ค่า default ที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## Channels

คีย์ config ต่อ channel ถูกย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - channels](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และ
bundled channels อื่นๆ (auth, access control, multi-account, mention gating)

## ค่า default ของ agent, multi-agent, sessions และ messages

ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและ bindings ของ multi-agent)
- `session.*` (วงจรชีวิต session, Compaction, pruning)
- `messages.*` (การส่ง message, TTS, การ render markdown)
- `talk.*` (โหมด Talk)
  - `talk.consultThinkingLevel`: override ระดับ thinking สำหรับการรัน agent ของ OpenClaw เต็มรูปแบบที่อยู่เบื้องหลัง realtime consults ของ Control UI Talk
  - `talk.consultFastMode`: override fast-mode แบบครั้งเดียวสำหรับ realtime consults ของ Control UI Talk
  - `talk.speechLocale`: id locale แบบ BCP 47 ที่ optional สำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดชั่วคราว default ของแพลตฟอร์มไว้ก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: Gateway relay fallback สำหรับ transcript ของ realtime Talk ที่ finalized แล้วซึ่งข้าม `openclaw_agent_consult`

## Tools และ custom providers

นโยบาย tool, toggles แบบ experimental, การตั้งค่า tool ที่มี provider รองรับ และการตั้งค่า
custom provider / base-URL ถูกย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - tools และ custom providers](/th/gateway/config-tools)

## Models

นิยาม provider, allowlists ของ model และการตั้งค่า custom provider อยู่ใน
[การกำหนดค่า - tools และ custom providers](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรม global model-catalog ด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแค็ตตาล็อก provider (`merge` หรือ `replace`)
- `models.providers`: แผนที่ custom provider ที่ keyed ด้วย provider id
- `models.providers.*.localService`: process manager แบบ on-demand ที่ optional สำหรับ
  local model servers OpenClaw จะ probe endpoint สุขภาพที่กำหนดค่าไว้, เริ่ม
  `command` แบบ absolute เมื่อจำเป็น, รอจนพร้อมใช้งาน แล้วส่งคำขอ model
  ดู [Local model services](/th/gateway/local-model-services)
- `models.pricing.enabled`: ควบคุม background pricing bootstrap ที่
  เริ่มหลังจาก sidecars และ channels ถึงเส้นทางพร้อมของ Gateway เมื่อเป็น `false`
  Gateway จะข้ามการ fetch pricing-catalog ของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังทำงานสำหรับการประมาณต้นทุน local

## MCP

นิยาม MCP server ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูกใช้โดย
OpenClaw แบบ embedded และ runtime adapters อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการ block นี้โดยไม่เชื่อมต่อกับ
target server ระหว่างการแก้ไข config

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

- `mcp.servers`: นิยาม stdio หรือ remote MCP server ที่ตั้งชื่อไว้สำหรับ runtimes ที่
  เปิดเผย MCP tools ที่กำหนดค่าไว้
  entries แบบ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` normalize เป็น field `transport` แบบ canonical
- `mcp.servers.<name>.enabled`: ตั้งค่าเป็น `false` เพื่อเก็บนิยาม server ที่บันทึกไว้
  ขณะตัดออกจากการค้นพบ MCP และการฉาย tool ของ OpenClaw แบบ embedded
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout ของคำขอ MCP ต่อ server
  เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout การเชื่อมต่อ
  ต่อ server เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.supportsParallelToolCalls`: concurrency hint ที่ optional สำหรับ
  adapters ที่เลือกได้ว่าจะส่ง MCP tool calls แบบ parallel หรือไม่
- `mcp.servers.<name>.auth`: ตั้งค่าเป็น `"oauth"` สำหรับ HTTP MCP servers ที่ต้องใช้
  OAuth รัน `openclaw mcp login <name>` เพื่อเก็บ tokens ภายใต้ state ของ OpenClaw
- `mcp.servers.<name>.oauth`: override ของ OAuth scope, redirect URL และ client
  metadata URL ที่ optional
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: การควบคุม HTTP TLS
  สำหรับ private endpoints และ mutual TLS
- `mcp.servers.<name>.toolFilter`: การเลือก tool ต่อ server ที่ optional `include`
  จำกัด MCP tools ที่ค้นพบให้เป็นชื่อที่ match; `exclude` ซ่อนชื่อที่ match
  Entries คือชื่อ MCP tool แบบ exact หรือ globs `*` แบบง่าย Servers ที่มี
  resources หรือ prompts ยังสร้างชื่อ utility tool (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) และชื่อเหล่านั้นใช้
  filter เดียวกัน
- `mcp.servers.<name>.codex`: การควบคุมการฉาย Codex app-server ที่ optional
  Block นี้คือ metadata ของ OpenClaw สำหรับ threads ของ Codex app-server เท่านั้น; ไม่
  ส่งผลต่อ ACP sessions, config ของ generic Codex harness หรือ runtime adapters อื่นๆ
  `codex.agents` ที่ไม่ว่างจะจำกัด server ไว้กับ OpenClaw agent ids ที่ระบุ
  รายการ agent scoped ที่ว่าง, blank หรือ invalid จะถูกปฏิเสธโดยการตรวจสอบ config
  และถูกละเว้นโดยเส้นทาง runtime projection แทนที่จะกลายเป็น global
  `codex.defaultToolsApprovalMode` emits ค่า native ของ Codex
  `default_tools_approval_mode` สำหรับ server นั้น OpenClaw จะ strip block `codex`
  ก่อนส่ง config `mcp_servers` แบบ native ไปยัง Codex ละเว้น block นี้เพื่อ
  ให้ server ถูกฉายสำหรับ agent ของ Codex app-server ทุกตัวพร้อมพฤติกรรมการอนุมัติ MCP default ของ Codex
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ bundled MCP runtimes ที่มีขอบเขตตาม session
  การรัน embedded แบบ one-shot ขอ cleanup เมื่อ run จบ; TTL นี้คือ backstop สำหรับ
  sessions ที่มีอายุยาวและ callers ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` hot-apply โดย dispose cached session MCP runtimes
  การค้นพบ/ใช้งาน tool ครั้งถัดไปจะสร้างใหม่จาก config ใหม่ ดังนั้น entries
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL
- Runtime discovery ยังเคารพการแจ้งเตือนการเปลี่ยนแปลง tool-list ของ MCP โดย drop
  cached catalog สำหรับ session นั้น Servers ที่ advertise resources หรือ
  prompts จะได้รับ utility tools สำหรับ listing/reading resources และ listing/fetching
  prompts ความล้มเหลวของ tool-call ซ้ำๆ จะ pause server ที่ได้รับผลกระทบชั่วครู่ก่อน
  พยายาม call อีกครั้ง

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[CLI backends](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรม runtime

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

- `allowBundled`: allowlist ที่ optional สำหรับ bundled skills เท่านั้น (ไม่กระทบ managed/workspace skills)
- `load.extraDirs`: roots ของ skill แบบ shared เพิ่มเติม (precedence ต่ำสุด)
- `load.allowSymlinkTargets`: roots ของ real target ที่เชื่อถือได้ซึ่ง symlinks ของ skill อาจ
  resolve เข้าไปเมื่อ link อยู่ภายนอก source root ที่กำหนดค่าไว้
- `workshop.allowSymlinkTargetWrites`: อนุญาตให้ Skill Workshop apply เขียน
  ผ่าน symlink targets ที่เชื่อถือแล้ว (default: false)
- `install.preferBrew`: เมื่อเป็น true ให้ prefer installers ของ Homebrew เมื่อ `brew`
  พร้อมใช้งาน ก่อน fallback ไปยัง installer kinds อื่น
- `install.nodeManager`: preference ของ node installer สำหรับ specs `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `install.allowUploadedArchives`: อนุญาตให้ Gateway clients แบบ trusted `operator.admin`
  ติดตั้ง private zip archives ที่ staged ผ่าน `skills.upload.*`
  (default: false) สิ่งนี้เปิดใช้งานเฉพาะเส้นทาง uploaded-archive; การติดตั้ง ClawHub
  ปกติไม่ต้องใช้ค่านี้
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้ว่าจะ bundled/installed อยู่ก็ตาม
- `entries.<skillKey>.apiKey`: convenience สำหรับ skills ที่ประกาศ env var หลัก (plaintext string หรือ SecretRef object)

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

- โหลดจากไดเรกทอรี package หรือ bundle ภายใต้ `~/.openclaw/extensions` และ `<workspace>/.openclaw/extensions` รวมถึงไฟล์หรือไดเรกทอรีที่ระบุใน `plugins.load.paths`
- วางไฟล์ Plugin แบบ standalone ไว้ใน `plugins.load.paths`; ราก extension ที่ค้นพบอัตโนมัติจะละเว้นไฟล์ `.js`, `.mjs` และ `.ts` ระดับบนสุด เพื่อไม่ให้สคริปต์ช่วยเหลือในรากเหล่านั้นบล็อกการเริ่มต้น
- การค้นพบรองรับ Plugin ของ OpenClaw แบบ native รวมถึง Codex bundle และ Claude bundle ที่เข้ากันได้ รวมถึง Claude bundle แบบเลย์เอาต์เริ่มต้นที่ไม่มี manifest
- **การเปลี่ยนแปลง config ต้องรีสตาร์ท gateway**
- `allow`: allowlist แบบไม่บังคับ (โหลดเฉพาะ Plugin ที่ระบุไว้) `deny` มีผลเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับ API key ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แมป env var ที่มีขอบเขตเฉพาะ Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไข prompt จาก `before_agent_start` แบบ legacy ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบ legacy ไว้ ใช้กับ hook ของ native plugin และไดเรกทอรี hook ที่ bundle ซึ่งรองรับจัดหาให้
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่เชื่อถือได้และไม่ใช่แบบ bundled สามารถอ่านเนื้อหาบทสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ override `provider` และ `model` ต่อรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับ subagent override ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ model override สำหรับ `api.runtime.llm.complete`
- `plugins.entries.<id>.llm.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับ completion override ของ Plugin LLM ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowAgentIdOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้รัน `api.runtime.llm.complete` กับ agent id ที่ไม่ใช่ค่าเริ่มต้น
- `plugins.entries.<id>.config`: ออบเจ็กต์ config ที่ Plugin กำหนด (ตรวจสอบโดย schema ของ native OpenClaw plugin เมื่อมี)
- การตั้งค่าบัญชี/runtime ของ channel plugin อยู่ภายใต้ `channels.<id>` และควรอธิบายด้วยเมทาดาทา `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่ด้วย registry ตัวเลือกกลางของ OpenClaw

### Config ของ Codex harness plugin

Plugin `codex` ที่ bundled เป็นเจ้าของการตั้งค่า native Codex app-server harness ภายใต้
`plugins.entries.codex.config` ดู
[เอกสารอ้างอิง Codex harness](/th/plugins/codex-harness-reference) สำหรับพื้นผิว config ทั้งหมด
และ [Codex harness](/th/plugins/codex-harness) สำหรับโมเดล runtime

`codexPlugins` ใช้เฉพาะกับ session ที่เลือก native Codex harness
ไม่เปิดใช้ Codex plugins สำหรับ OpenClaw provider runs, ACP
conversation bindings หรือ harness ใด ๆ ที่ไม่ใช่ Codex

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
  Plugin/app แบบ native Codex สำหรับ Codex harness ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  นโยบาย destructive-action เริ่มต้นสำหรับ plugin app elicitation ที่ย้ายมา
  ใช้ `true` เพื่อยอมรับ schema การอนุมัติ Codex ที่ปลอดภัยโดยไม่ต้อง prompt, `false`
  เพื่อปฏิเสธ, `"auto"` เพื่อ route การอนุมัติที่ Codex ต้องการผ่านการอนุมัติ
  Plugin ของ OpenClaw หรือ `"ask"` เพื่อ prompt สำหรับทุกการเขียน/destructive
  action ของ Plugin โดยไม่มีการอนุมัติถาวร โหมด `"ask"` จะล้าง durable Codex
  per-tool approval override สำหรับ app ที่ได้รับผลกระทบ และเลือกผู้ตรวจสอบ
  การอนุมัติที่เป็นมนุษย์สำหรับ app นั้นก่อนที่ thread ของ Codex จะเริ่มต้น
  ค่าเริ่มต้น: `true`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: เปิดใช้
  รายการ Plugin ที่ย้ายมาเมื่อ global `codexPlugins.enabled` เป็น true ด้วย
  ค่าเริ่มต้น: `true` สำหรับรายการที่ระบุชัดเจน
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  ตัวตน marketplace ที่เสถียร V1 รองรับเฉพาะ `"openai-curated"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: ตัวตน
  Codex plugin ที่เสถียรจากการย้าย เช่น `"google-calendar"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  destructive-action override ต่อ Plugin เมื่อละไว้ จะใช้ค่า global
  `allow_destructive_actions` ค่าแบบต่อ Plugin รองรับนโยบาย
  `true`, `false`, `"auto"` หรือ `"ask"` แบบเดียวกัน

แต่ละ plugin app ที่ได้รับอนุญาตซึ่งใช้ `"ask"` จะ route คำขออนุมัติของ app นั้น
ไปยังผู้ตรวจสอบที่เป็นมนุษย์ app อื่นและการอนุมัติ thread ที่ไม่ใช่ app จะคง
ผู้ตรวจสอบที่กำหนดค่าไว้ ดังนั้นนโยบาย Plugin แบบผสมจะไม่สืบทอดพฤติกรรม `"ask"`

`codexPlugins.enabled` คือคำสั่งเปิดใช้ระดับ global รายการ Plugin ที่เขียนโดยการย้ายอย่างชัดเจน
คือชุดการติดตั้งถาวรและสิทธิ์ในการ repair
ไม่รองรับ `plugins["*"]`, ไม่มีสวิตช์ `install` และค่า local
`marketplacePath` ตั้งใจไม่ให้เป็นฟิลด์ config เพราะเป็นค่าเฉพาะ host

การตรวจ readiness ของ `app/list` จะถูกแคชไว้หนึ่งชั่วโมงและรีเฟรช
แบบอะซิงโครนัสเมื่อ stale config ของ app สำหรับ thread ของ Codex จะถูกคำนวณเมื่อสร้าง
session ของ Codex harness ไม่ใช่ทุก turn; ใช้ `/new`, `/reset` หรือรีสตาร์ท gateway
หลังเปลี่ยน native plugin config

- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า provider web-fetch ของ Firecrawl
  - `apiKey`: Firecrawl API key แบบไม่บังคับสำหรับขีดจำกัดที่สูงขึ้น (รองรับ SecretRef) fallback ไปยัง `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ Firecrawl API (ค่าเริ่มต้น: `https://api.firecrawl.dev`; override แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้ provider X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phase และ threshold
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ cron สำหรับการ sweep dreaming เต็มแต่ละครั้ง (`"0 3 * * *"` เป็นค่าเริ่มต้น)
  - `model`: override โมเดล Dream Diary subagent แบบไม่บังคับ ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาด model-unavailable จะ retry หนึ่งครั้งด้วยโมเดลเริ่มต้นของ session; ความล้มเหลวด้าน trust หรือ allowlist จะไม่ fallback แบบเงียบ
  - นโยบาย phase และ threshold เป็นรายละเอียดการนำไปใช้ (ไม่ใช่คีย์ config ที่ผู้ใช้เห็น)
- config memory แบบเต็มอยู่ใน [เอกสารอ้างอิงการตั้งค่า Memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle plugins ที่เปิดใช้ยังสามารถมอบค่าเริ่มต้นของ OpenClaw แบบฝังจาก `settings.json`; OpenClaw จะใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ sanitize แล้ว ไม่ใช่เป็น raw OpenClaw config patch
- `plugins.slots.memory`: เลือก id ของ active memory plugin หรือ `"none"` เพื่อปิดใช้ memory plugins
- `plugins.slots.contextEngine`: เลือก id ของ active context engine plugin; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

---

## Commitments

`commitments` ควบคุม memory ติดตามผลที่อนุมาน: OpenClaw สามารถตรวจจับ check-in จาก conversation turn และส่งมอบผ่าน heartbeat runs

- `commitments.enabled`: เปิดใช้การสกัด LLM แบบซ่อน, การจัดเก็บ และการส่งมอบ heartbeat สำหรับ commitment ติดตามผลที่อนุมาน ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวน commitment ติดตามผลที่อนุมานสูงสุดที่ส่งมอบต่อ agent session ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

ดู [Inferred commitments](/th/concepts/commitments)

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
- `tabCleanup` เรียกคืนแท็บเอเจนต์หลักที่ติดตามไว้หลังจากไม่มีการใช้งานตามเวลาที่กำหนด หรือเมื่อ
  เซสชันเกินขีดจำกัดของตน ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมดล้างข้อมูลแต่ละรายการเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดโดยค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจไว้วางใจการนำทางของเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด เอนด์พอยต์โปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะนามแฝงแบบเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุอย่างชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` ยอมรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับ CDP ระยะไกลและ
  `attachOnly` สำหรับการตรวจสอบการเข้าถึง รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่จัดการไว้จะคงค่าเริ่มต้น CDP ภายในไว้
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ภายในที่จัดการไว้ และอาจรายงานข้อผิดพลาดการครอบครองพอร์ตภายใน
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบบน
  โฮสต์ที่เลือก หรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่ได้
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` สามารถตั้งค่า `cdpUrl` เมื่อ Chrome กำลังทำงานอยู่แล้ว
  หลังเอนด์พอยต์การค้นพบ DevTools HTTP(S) หรือเอนด์พอยต์ WS(S) โดยตรง ใน
  โหมดนั้น OpenClaw จะส่งเอนด์พอยต์ไปยัง Chrome MCP แทนการใช้การเชื่อมต่ออัตโนมัติ;
  `userDataDir` จะถูกละเว้นสำหรับอาร์กิวเมนต์เปิดใช้งาน Chrome MCP
- โปรไฟล์ `existing-session` ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การกระทำที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS-selector, ฮุกอัปโหลดไฟล์เดียว,
  ไม่มีการแทนที่ timeout ของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการกระทำแบบชุด
- โปรไฟล์ `openclaw` ภายในที่จัดการไว้จะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับโปรไฟล์ CDP ระยะไกลหรือการแนบเอนด์พอยต์ existing-session
- โปรไฟล์ภายในที่จัดการไว้สามารถตั้งค่า `executablePath` เพื่อแทนที่
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ภายในที่จัดการไว้ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดใช้งาน เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  ยอมรับ `~` และ `~/...` สำหรับไดเรกทอรี home ของ OS ของคุณก่อนเปิดใช้งาน Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วยเช่นกัน
- บริการควบคุม: เฉพาะ loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กเปิดใช้งานเพิ่มเติมให้กับการเริ่มต้น Chromium ภายใน (เช่น
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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (สีของบับเบิล Talk Mode เป็นต้น)
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

<Accordion title="Gateway field details">

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`
- `port`: พอร์ตเดียวแบบ multiplexed สำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`
- **นามแฝง bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงของโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่ายแบบ Docker bridge (`-p 18789:18789`) ทราฟฟิกจะเข้ามาที่ `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นโดยค่าเริ่มต้น การ bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ Gateway ในทางปฏิบัติ หมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` ตัวช่วยเริ่มต้นใช้งานจะสร้างโทเค็นให้โดยค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โฟลว์เริ่มต้นและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างไว้แต่ไม่ได้ตั้งค่า mode
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โดยตั้งใจไม่เสนอผ่านพรอมป์เริ่มต้นใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือส่วนหัวตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนผ่าน Proxy ที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่ง proxy ที่ **ไม่ใช่ loopback** โดยค่าเริ่มต้น reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องกำหนด `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback โดยตรงในเครื่องได้ ส่วน `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` ส่วนหัวตัวตนของ Tailscale Serve สามารถผ่านการยืนยันตัวตนของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) endpoint ของ HTTP API **ไม่** ใช้การยืนยันตัวตนผ่านส่วนหัว Tailscale นี้ แต่จะทำตามโหมดการยืนยันตัวตน HTTP ปกติของ Gateway แทน โฟลว์แบบไม่ใช้โทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะคืนค่า `429` + `Retry-After`
  - บนพาธ Control UI แบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามผิดพลาดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานที่คำขอที่สอง แทนที่ทั้งคู่จะแข่งผ่านไปเป็นเพียงการไม่ตรงกัน
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับชุดทดสอบหรือการปรับใช้ proxy แบบเข้มงวด)
- ความพยายามยืนยันตัวตน WS จากต้นทางเบราว์เซอร์จะถูก throttle เสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost จากเบราว์เซอร์)
- บน loopback การ lockout จากต้นทางเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่ทำให้
  ต้นทางอื่นถูก lock out โดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องมีการยืนยันตัวตน)
- `tailscale.serviceName`: ชื่อ Tailscale Service แบบไม่บังคับสำหรับโหมด Serve เช่น
  `svc:openclaw` เมื่อตั้งค่าแล้ว OpenClaw จะส่งค่านี้ให้ `tailscale serve
--service` เพื่อให้ Control UI เปิดเผยผ่าน Service ที่มีชื่อแทน
  hostname ของอุปกรณ์ ค่าต้องใช้รูปแบบชื่อ Service ของ Tailscale คือ `svc:<dns-label>`;
  การเริ่มทำงานจะรายงาน Service URL ที่ได้มา
- `tailscale.preserveFunnel`: เมื่อเป็น `true` และ `tailscale.mode = "serve"` OpenClaw
  จะตรวจสอบ `tailscale funnel status` ก่อนนำ Serve มาใช้ซ้ำตอนเริ่มทำงาน และข้าม
  หาก route ของ Funnel ที่กำหนดค่าจากภายนอกครอบคลุมพอร์ต Gateway อยู่แล้ว
  ค่าเริ่มต้นคือ `false`
- `controlUi.allowedOrigins`: allowlist ต้นทางเบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นสำหรับต้นทางเบราว์เซอร์สาธารณะที่ไม่ใช่ loopback การโหลด UI แบบ same-origin ส่วนตัวบน LAN/Tailnet จาก loopback, RFC1918/link-local, `.local`, `.ts.net` หรือโฮสต์ Tailscale CGNAT จะได้รับการยอมรับโดยไม่ต้องเปิดใช้ fallback จากส่วนหัว Host
- `controlUi.chatMessageMaxWidth`: ความกว้างสูงสุดแบบไม่บังคับสำหรับข้อความแชท Control UI ที่จัดกลุ่ม รองรับค่า CSS width ที่มีขอบเขต เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback ของ origin จากส่วนหัว Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบาย origin จากส่วนหัว Host
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `wss://` สำหรับโฮสต์สาธารณะ; plaintext `ws://` ยอมรับเฉพาะสำหรับ loopback, LAN, link-local, `.local`, `.ts.net` และโฮสต์ Tailscale CGNAT
- `remote.remotePort`: พอร์ต Gateway บนโฮสต์ SSH ระยะไกล ค่าเริ่มต้นคือ `18789`; ใช้ค่านี้เมื่อพอร์ต tunnel ภายในเครื่องต่างจากพอร์ต Gateway ระยะไกล
- `remote.sshHostKeyPolicy`: นโยบาย host-key ของ tunnel SSH บน macOS `strict` เป็นค่าเริ่มต้นและต้องมีคีย์ที่เชื่อถืออยู่แล้ว `openssh` เป็นการเลือกใช้การกำหนดค่า OpenSSH ที่มีผลอย่างชัดเจนสำหรับ alias ที่จัดการไว้; ตรวจสอบการตั้งค่า SSH ของผู้ใช้และระบบที่ตรงกันก่อนใช้งาน แอป macOS และ `configure-remote` จะรีเซ็ตนโยบายนี้เป็น `strict` เมื่อเปลี่ยนเป้าหมาย เว้นแต่เลือกใช้อย่างชัดเจนอีกครั้ง
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของไคลเอนต์ระยะไกล ไม่ได้กำหนดค่าการยืนยันตัวตนของ Gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL ฐาน HTTPS สำหรับรีเลย์ APNs ภายนอกที่ใช้หลังจาก build iOS ที่รองรับ relay เผยแพร่การลงทะเบียนไปยัง Gateway build สาธารณะบน App Store ใช้รีเลย์ OpenClaw ที่โฮสต์ไว้ URL รีเลย์แบบกำหนดเองต้องตรงกับพาธ build/ปรับใช้ iOS ที่แยกไว้โดยตั้งใจ ซึ่ง URL รีเลย์ชี้ไปยังรีเลย์นั้น
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก Gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`
- การลงทะเบียนที่รองรับ relay จะถูกมอบหมายให้ตัวตน Gateway เฉพาะ แอป iOS ที่จับคู่กันจะดึง `gateway.identity.get`, รวมตัวตนนั้นไว้ในการลงทะเบียน relay และส่งต่อสิทธิ์ส่งที่จำกัดตามการลงทะเบียนไปยัง Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้นั้นไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env override ชั่วคราวสำหรับการกำหนดค่า relay ด้านบน
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL relay HTTP แบบ loopback URL relay สำหรับ production ควรอยู่บน HTTPS
- `gateway.handshakeTimeoutMs`: timeout การจับมือ Gateway WebSocket ก่อนยืนยันตัวตนเป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อกำหนดไว้ เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ภายในเครื่องอาจเชื่อมต่อขณะที่การ warmup ตอนเริ่มทำงานยังไม่เสถียร
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสอบสุขภาพช่องทางเป็นนาที ตั้ง `0` เพื่อปิดการ restart จาก health-monitor ทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: threshold ของ stale-socket เป็นนาที ควรให้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวน restart สูงสุดจาก health-monitor ต่อช่องทาง/บัญชีภายในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การเลือกไม่ใช้ restart จาก health-monitor ต่อช่องทาง โดยยังคงเปิด monitor ทั่วทั้งระบบไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override ต่อบัญชีสำหรับช่องทางหลายบัญชี เมื่อตั้งค่าไว้ จะมีลำดับความสำคัญเหนือ override ระดับช่องทาง
- พาธการเรียก Gateway ภายในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี fallback ระยะไกลมาบัง)
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือแทรก forwarded-client headers ระบุเฉพาะ proxy ที่คุณควบคุม รายการ loopback ยังใช้ได้สำหรับการตั้งค่า proxy/การตรวจจับภายในบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ภายในเครื่อง) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นคือ `false` เพื่อพฤติกรรมแบบ fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP แบบไม่บังคับสำหรับอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มี scopes ที่ร้องขอ จะถูกปิดเมื่อไม่ได้ตั้งค่า ค่านี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key โดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ทั่วทั้งระบบสำหรับคำสั่ง node ที่ประกาศไว้หลังการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกใช้คำสั่ง node ที่อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ค่าเริ่มต้นของแพลตฟอร์มหรือ allow แบบชัดเจนจะรวมคำสั่งนั้นไว้ หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่เพื่อให้ Gateway จัดเก็บ snapshot คำสั่งที่อัปเดต
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยาย deny list ค่าเริ่มต้น)
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจาก deny list ค่าเริ่มต้นของ HTTP สำหรับ
  ผู้เรียก owner/admin ค่านี้ไม่ยกระดับผู้เรียกที่มีตัวตน `operator.write`
  ให้เป็นสิทธิ์ owner/admin; `cron`, `gateway` และ `nodes` ยังคง
  ไม่พร้อมใช้งานสำหรับผู้เรียกที่ไม่ใช่ owner แม้จะอยู่ใน allowlist

</Accordion>

### endpoint ที่เข้ากันได้กับ OpenAI

- Admin HTTP RPC: ปิดโดยค่าเริ่มต้นในฐานะ Plugin `admin-http-rpc` เปิดใช้ Plugin เพื่อลงทะเบียน `POST /api/v1/admin/rpc` ดู [Admin HTTP RPC](/th/plugins/admin-http-rpc)
- Chat Completions: ปิดโดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความปลอดภัยสำหรับ URL-input ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- ส่วนหัวเสริมความปลอดภัยของ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตนผ่าน Proxy ที่เชื่อถือได้](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ Gateway หลายตัวบนโฮสต์เดียวด้วยพอร์ตและไดเรกทอรีสถานะที่ไม่ซ้ำกัน:

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

- `enabled`: เปิดใช้การ terminate TLS ที่ listener ของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ภายในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์อย่างชัดเจน; สำหรับการใช้งาน local/dev เท่านั้น
- `certPath`: พาธระบบไฟล์ไปยังไฟล์ใบรับรอง TLS
- `keyPath`: พาธระบบไฟล์ไปยังไฟล์ private key ของ TLS; จำกัดสิทธิ์การเข้าถึงไว้
- `caPath`: พาธ bundle ของ CA แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ custom trust chains

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
  - `"off"`: ไม่สนใจการแก้ไขแบบสด การเปลี่ยนแปลงต้องรีสตาร์ตอย่างชัดเจน
  - `"restart"`: รีสตาร์ตกระบวนการ Gateway ทุกครั้งเมื่อคอนฟิกเปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ในกระบวนการโดยไม่รีสตาร์ต
  - `"hybrid"` (ค่าเริ่มต้น): ลองโหลดซ้ำแบบ hot ก่อน หากจำเป็นจึงถอยกลับไปรีสตาร์ต
- `debounceMs`: หน้าต่าง debounce เป็นมิลลิวินาทีก่อนนำการเปลี่ยนแปลงคอนฟิกไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็นมิลลิวินาทีสำหรับรอการดำเนินการที่กำลังทำงานอยู่ ก่อนบังคับรีสตาร์ตหรือโหลดช่องทางซ้ำแบบ hot ไม่ต้องระบุเพื่อใช้เวลารอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้งเป็น `0` เพื่อรอไม่มีกำหนดและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

---

## Hook

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
โทเค็น Hook ในสตริงคำค้นจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ควรแตกต่างจากการตรวจสอบสิทธิ์แบบ shared-secret ของ Gateway ที่ใช้งานอยู่ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); เมื่อเริ่มต้นระบบจะบันทึกคำเตือนด้านความปลอดภัยที่ไม่ทำให้ล้มเหลวหากตรวจพบการใช้ซ้ำ
- `openclaw security audit` จะรายงานการใช้การตรวจสอบสิทธิ์ Hook/Gateway ซ้ำเป็นข้อค้นพบระดับวิกฤต รวมถึงการตรวจสอบสิทธิ์ด้วยรหัสผ่าน Gateway ที่ระบุเฉพาะตอน audit (`--auth password --password <password>`) เรียกใช้ `openclaw doctor --fix` เพื่อหมุนเวียน `hooks.token` ที่จัดเก็บไว้และถูกใช้ซ้ำ จากนั้นอัปเดตตัวส่ง Hook ภายนอกให้ใช้โทเค็น Hook ใหม่
- `hooks.path` เป็น `/` ไม่ได้ ให้ใช้พาธย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หากการแมปหรือ preset ใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้อง opt-in นี้

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ค่าได้ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถูกถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียดการแมป">

- `match.path` จับคู่พาธย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์เพย์โหลดสำหรับพาธทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านค่าจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่าแอ็กชัน Hook
  - `transform.module` ต้องเป็นพาธแบบสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (พาธสัมบูรณ์และการไล่ย้อนพาธจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของเวิร์กสเปซจะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี transforms ของ Hook หรือลบ `hooks.transformsDir`
- `agentId` กำหนดเส้นทางไปยัง agent เฉพาะ ID ที่ไม่รู้จักจะถอยกลับไปยัง agent ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทาง agent ที่มีผล รวมถึงพาธ agent ค่าเริ่มต้นเมื่อไม่ได้ระบุ `agentId` (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่แบบไม่บังคับสำหรับการรัน agent ของ Hook ที่ไม่มี `sessionKey` ชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันของการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาต prefix แบบไม่บังคับสำหรับค่า `sessionKey` ที่ระบุชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อบังคับเมื่อมีการแมปหรือ preset ใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; ค่าเริ่มต้นของ `channel` คือ `last`
- `model` แทนที่ LLM สำหรับการรัน Hook นี้ (ต้องได้รับอนุญาตหากตั้งค่าแคตตาล็อกโมเดลไว้)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางรายข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
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

- Gateway จะเริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูตหากมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

---

## โฮสต์ Canvas Plugin

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

- ให้บริการ HTML/CSS/JS และ A2UI ที่ agent แก้ไขได้ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะเครื่องภายใน: คง `gateway.bind: "loopback"` (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การตรวจสอบสิทธิ์ Gateway (โทเค็น/รหัสผ่าน/trusted-proxy) เหมือนพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebView จะไม่ส่ง header ตรวจสอบสิทธิ์ หลังจาก node จับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ URL ความสามารถที่ scoped ตาม node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับเซสชัน WS ของ node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- ฉีดไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่าง
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต Gateway
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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้งาน Plugin `bonjour` ที่บันเดิลมา): ละ `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`; การโฆษณา multicast บน LAN ยังต้องเปิดใช้งาน Plugin `bonjour` ที่บันเดิลมา
- `off`: ระงับการโฆษณา multicast บน LAN โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่บันเดิลมาจะเริ่มโดยอัตโนมัติบนโฮสต์ macOS และเป็นแบบ opt-in บน Linux, Windows และการปรับใช้ Gateway แบบคอนเทนเนอร์
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็น label DNS ที่ถูกต้อง มิฉะนั้นจะถอยกลับเป็น `openclaw` แทนที่ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน unicast DNS-SD ไว้ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้ร่วมกับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกใช้เฉพาะเมื่อสภาพแวดล้อมของโปรเซสไม่มีคีย์นั้น
- ไฟล์ `.env`: `.env` ใน CWD + `~/.openclaw/.env` (ทั้งสองไฟล์ไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดว่าจะมีแต่ยังขาดจากโปรไฟล์เชลล์ล็อกอินของคุณ
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
- ตัวแปรที่หายไปหรือว่างเปล่าจะทำให้เกิดข้อผิดพลาดเมื่อโหลดการกำหนดค่า
- Escape ด้วย `$${VAR}` เพื่อให้ได้ค่า literal `${VAR}`
- ใช้งานได้กับ `$include`

---

## ข้อมูลลับ

การอ้างอิงข้อมูลลับเป็นแบบเพิ่มเสริม: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปแบบออบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบสัมบูรณ์ (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (รองรับตัวเลือกแบบ AWS เช่น `secret#json_key`)
- id ของ `source: "exec"` ต้องไม่มีเซกเมนต์พาธที่คั่นด้วยเครื่องหมายทับเป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลประจำตัวที่รองรับ

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
- เป้าหมาย `secrets apply` รองรับพาธข้อมูลประจำตัวของ `openclaw.json`
- การอ้างอิงใน `auth-profiles.json` รวมอยู่ในการ resolve ขณะรันไทม์และการครอบคลุมของการตรวจสอบ audit

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
- พาธของผู้ให้บริการ file และ exec จะ fail closed เมื่อการตรวจสอบ Windows ACL ไม่พร้อมใช้งาน ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้และไม่สามารถตรวจสอบได้
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์ และใช้ protocol payloads ผ่าน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink พร้อมตรวจสอบความถูกต้องของพาธเป้าหมายที่ resolve แล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่ resolve แล้ว
- สภาพแวดล้อมของ child ของ `exec` จะเป็นแบบขั้นต่ำโดยค่าเริ่มต้น ให้ส่งตัวแปรที่ต้องใช้โดยระบุอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงข้อมูลลับจะถูก resolve ณ เวลา activation ให้เป็น snapshot ในหน่วยความจำ จากนั้นพาธคำขอจะอ่านเฉพาะ snapshot เท่านั้น
- การกรอง active-surface จะใช้ระหว่าง activation: การอ้างอิงที่ยัง resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ active จะถูกข้ามพร้อม diagnostics

---

## ที่เก็บข้อมูลการตรวจสอบสิทธิ์

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

- โปรไฟล์ต่อเอเจนต์จัดเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบแบนเดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key ตามแบบแผน `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่อิงกับ SecretRef
- ข้อมูลรับรอง runtime แบบคงที่มาจากสแนปชอตที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่เดิมจะถูกล้างออกเมื่อตรวจพบ
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

- `billingBackoffHours`: ค่า backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวเพราะข้อผิดพลาดเกี่ยวกับการเรียกเก็บเงินจริง
  หรือเครดิตไม่เพียงพอ (ค่าเริ่มต้น: `5`) ข้อความเกี่ยวกับการเรียกเก็บเงินที่ชัดเจนยังสามารถ
  เข้ามาที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการ
  จะยังจำกัดขอบเขตอยู่กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (ตัวอย่างเช่น OpenRouter
  `Key limit exceeded`) ข้อความ HTTP `402` ที่ retry ได้เกี่ยวกับ usage-window หรือ
  spend-limit ขององค์กร/พื้นที่ทำงานจะยังอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: การ override ชั่วโมง backoff สำหรับการเรียกเก็บเงินแบบเลือกได้ต่อผู้ให้บริการ
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ billing backoff (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ค่า backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ `auth_permanent` backoff (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่าง rolling เป็นชั่วโมงที่ใช้กับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: เวลาหน่วงคงที่ก่อน retry การหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่ overloaded (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) บักเก็ต rate-limit นั้นรวมข้อความที่มีรูปแบบตามผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์บันทึกที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนหมุนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บ archive แบบมีหมายเลขไว้ได้สูงสุดห้าชุดข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบ best-effort สำหรับเอาต์พุตคอนโซล, ไฟล์บันทึก, ระเบียนบันทึก OTLP และข้อความ transcript เซสชันที่คงอยู่ `redactSensitive: "off"` ปิดเฉพาะนโยบายบันทึก/transcript ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคง redact ความลับก่อนปล่อยออก

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
- `flags`: อาร์เรย์ของสตริง flag ที่เปิดใช้เอาต์พุตบันทึกแบบเจาะจง (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภทเซสชันประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, เครื่องมือ, สถานะ, บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่ซ้ำกันจะ back off ขณะไม่มีการเปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms ก่อนที่งาน active ที่ stalled และเข้าเงื่อนไขอาจถูก abort-drain เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่าง embedded-run แบบขยายที่ปลอดภัยกว่าอย่างน้อย 5 นาทีและ 3 เท่าของ `stuckSessionWarnMs`
- `memoryPressureSnapshot`: บันทึกสแนปชอตเสถียรภาพก่อน OOM ที่ redact แล้วเมื่อแรงกดดันหน่วยความจำถึงระดับ `critical` (ค่าเริ่มต้น: `false`) ตั้งเป็น `true` เพื่อเพิ่มการสแกน/เขียนไฟล์ stability bundle โดยยังคงเหตุการณ์แรงกดดันหน่วยความจำปกติไว้
- `otel.enabled`: เปิดใช้ pipeline การ export ของ OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าแบบเต็ม แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว ดู [การ export OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของ collector สำหรับการ export OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะสัญญาณแบบเลือกได้ เมื่อตั้งค่า จะ override `otel.endpoint` สำหรับสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: header metadata HTTP/gRPC เพิ่มเติมที่ส่งพร้อมคำขอ export OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การ export trace, metrics หรือ log
- `otel.logsExporter`: ปลายทาง export บันทึก: `"otlp"` (ค่าเริ่มต้น), `"stdout"` สำหรับออบเจ็กต์ JSON หนึ่งรายการต่อบรรทัด stdout หรือ `"both"`
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry เป็นระยะใน ms
- `otel.captureContent`: การบันทึกเนื้อหาดิบแบบ opt-in สำหรับแอตทริบิวต์ span ของ OTEL ค่าเริ่มต้นปิดอยู่ บูลีน `true` จะบันทึกเนื้อหา message/tool ที่ไม่ใช่ system; รูปแบบออบเจ็กต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` และ `toolDefinitions` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับรูปแบบ span การอนุมาน GenAI รุ่นทดลองล่าสุด รวมถึงชื่อ span `{gen_ai.operation.name} {gen_ai.request.model}`, span kind `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` แบบเดิม โดยค่าเริ่มต้น span จะคง `openclaw.model.call` และ `gen_ai.system` เพื่อความเข้ากันได้; metrics ของ GenAI ใช้แอตทริบิวต์เชิง semantic แบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่ม/ปิด SDK ที่ Plugin เป็นเจ้าของ แต่ยังคงเปิด listener การวินิจฉัยไว้
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env var endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปชอต cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุต cache trace (ทั้งหมดมีค่าเริ่มต้น: `true`)

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

- `channel`: ช่องทาง release สำหรับการติดตั้ง npm/git - `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: เวลาหน่วงขั้นต่ำเป็นชั่วโมงก่อน auto-apply ของช่องทาง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจาย rollout ของช่องทาง stable เพิ่มเติมเป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
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

- `enabled`: feature gate ส่วนกลางของ ACP (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อน dispatch และ affordance การ spawn ของ ACP)
- `dispatch.enabled`: gate อิสระสำหรับการ dispatch เทิร์นของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งานแต่บล็อกการดำเนินการ
- `backend`: id ของ backend runtime ACP เริ่มต้น (ต้องตรงกับ Plugin runtime ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin backend ก่อน และหากตั้งค่า `plugins.allow` ให้รวม id ของ Plugin backend (เช่น `acpx`) มิฉะนั้น backend ACP จะไม่โหลด
- `defaultAgent`: id ของเอเจนต์เป้าหมาย ACP สำรองเมื่อ spawns ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชัน runtime ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนเซสชัน ACP ที่ active พร้อมกันได้สูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่ stream
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยกการ projection ของบล็อกที่ stream
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` stream แบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์ terminal ของเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุต assistant สูงสุดที่ project ต่อเทิร์น ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ project
- `stream.tagVisibility`: ระเบียนของชื่อ tag ไปยังการ override การมองเห็นแบบบูลีนสำหรับเหตุการณ์ที่ stream
- `runtime.ttlMinutes`: TTL เมื่อ idle เป็นนาทีสำหรับ session workers ของ ACP ก่อนเข้าเงื่อนไข cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบเลือกได้สำหรับเรียกเมื่อ bootstrap สภาพแวดล้อม runtime ACP

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
  - `"default"`: คำโปรยกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความคำโปรย (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์อยู่)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่แค่คำโปรย) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

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
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## ตัวตน

ดูฟิลด์ตัวตน `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## บริดจ์ (เดิม, ถูกลบแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่เป็นส่วนหนึ่งของสคีมาคอนฟิกอีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="คอนฟิกบริดจ์เดิม (อ้างอิงเชิงประวัติ)">

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

- `sessionRetention`: ระยะเวลาที่เก็บเซสชันการรัน cron แบบแยกที่เสร็จแล้วไว้ก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้างทรานสคริปต์ cron ที่ถูกลบและเก็บถาวรด้วย ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: รองรับเพื่อความเข้ากันได้กับล็อกการรัน cron รุ่นเก่าที่มีไฟล์เป็นฐาน ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: แถวประวัติการรัน SQLite ล่าสุดที่เก็บไว้ต่อหนึ่งงาน ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง cron Webhook แบบ POST (`delivery.mode = "webhook"`), หากไม่ระบุ จะไม่ส่งส่วนหัว auth
- `webhook`: URL Webhook สำรองแบบ legacy ที่เลิกใช้แล้ว (http/https) ซึ่ง `openclaw doctor --fix` ใช้เพื่อย้ายงานที่เก็บไว้ซึ่งยังมี `notify: true`; การส่งใน runtime ใช้ `delivery.mode="webhook"` พร้อม `delivery.to` ต่อแต่ละงาน หรือ `delivery.completionDestination` เมื่อรักษาการส่งประกาศไว้

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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงาน cron เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`-`10`)
- `backoffMs`: อาร์เรย์ของดีเลย์ backoff เป็น ms สำหรับแต่ละครั้งที่ลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ไม่ต้องระบุเพื่อลองใหม่กับประเภทชั่วคราวทั้งหมด

งานแบบครั้งเดียวจะยังเปิดใช้งานอยู่จนกว่าการลองใหม่จะหมด จากนั้นจึงปิดใช้งานโดยยังเก็บสถานะข้อผิดพลาดสุดท้ายไว้ งานแบบเกิดซ้ำใช้ policy การลองใหม่เมื่อเกิดข้อผิดพลาดชั่วคราวแบบเดียวกันเพื่อรันอีกครั้งหลัง backoff ก่อนช่องเวลาที่กำหนดถัดไป; ข้อผิดพลาดถาวรหรือการลองใหม่ชั่วคราวที่หมดแล้วจะย้อนกลับไปใช้ตารางเวลาเกิดซ้ำปกติพร้อม error backoff

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

- `enabled`: เปิดใช้งานการแจ้งเตือนความล้มเหลวสำหรับงาน cron (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ขั้นต่ำ: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่กระทบ execution-error backoff
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความของช่อง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: account หรือ channel id ที่ไม่บังคับเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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

- ปลายทางเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ cron ในทุกงาน
- `mode`: `"announce"` หรือ `"webhook"`; ค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: การแทนที่ช่องสำหรับการส่งแบบ announce `"last"` ใช้ช่องการส่งที่ทราบล่าสุดซ้ำ
- `to`: เป้าหมาย announce หรือ URL Webhook แบบชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่ account ที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` ต่อแต่ละงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและต่อแต่ละงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เท่านั้น เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ cron แบบแยกถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวแทนที่เทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี wrapper ประวัติ/ผู้ส่ง)        |
| `{{BodyStripped}}` | เนื้อหาที่ลบการ mention กลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                     |
| `{{To}}`           | ตัวระบุปลายทาง                                    |
| `{{MessageSid}}`   | id ข้อความของช่อง                                 |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                            |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                          |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                  |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)               |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                  |
| `{{Prompt}}`       | prompt สื่อที่แก้ค่าแล้วสำหรับรายการ CLI         |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ค่าแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                  |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)          |
| `{{SenderName}}`   | ชื่อแสดงผลของผู้ส่ง (พยายามให้ดีที่สุด)          |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)     |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord, ฯลฯ) |

---

## การรวมคอนฟิก (`$include`)

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

**พฤติกรรมการ merge:**

- ไฟล์เดียว: แทนที่อ็อบเจกต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (รายการที่มาทีหลังจะแทนที่รายการก่อนหน้า)
- คีย์ sibling: merge หลัง includes (แทนที่ค่าที่ include มา)
- includes ซ้อนกัน: ได้ลึกสูงสุด 10 ระดับ
- พาธ: แก้ค่าโดยอิงกับไฟล์ที่ include แต่ต้องอยู่ภายในไดเรกทอรีคอนฟิกระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบแบบ absolute/`../` อนุญาตเฉพาะเมื่อยัง resolve อยู่ภายในขอบเขตนั้น พาธต้องไม่มี null byte และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการ resolve
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่มี single-file include รองรับ จะเขียนผ่านไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- Root includes, include arrays และ includes ที่มี sibling overrides เป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะ fail closed แทนการ flatten คอนฟิก
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, parse errors, circular includes, รูปแบบพาธไม่ถูกต้อง และความยาวเกินกำหนด

---

_เกี่ยวข้อง: [คอนฟิก](/th/gateway/configuration) · [ตัวอย่างคอนฟิก](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## เกี่ยวข้อง

- [คอนฟิก](/th/gateway/configuration)
- [ตัวอย่างคอนฟิก](/th/gateway/configuration-examples)
