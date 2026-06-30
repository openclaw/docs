---
read_when:
    - คุณต้องการความหมายของการตั้งค่าในระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่าของช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงเฉพาะของระบบย่อย
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-06-30T22:38:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงคอนฟิกหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบเน้นงาน ให้ดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวคอนฟิกหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงตัวปรับแต่งเชิงลึกของหน่วยความจำ/QMD อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวม metadata ของบันเดิล/Plugin/ช่องทางเข้ามาเมื่อมี
- `config.schema.lookup` คืนค่าโหนด schema หนึ่งรายการตามขอบเขต path สำหรับเครื่องมือเจาะดูรายละเอียด
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮช baseline ของเอกสารคอนฟิกกับพื้นผิว schema ปัจจุบัน

เส้นทางค้นหาของเอเจนต์: ใช้การกระทำของเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบเน้นงาน และใช้หน้านี้
สำหรับแผนผังฟิลด์ที่กว้างกว่า ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะทาง:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และคอนฟิก dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + บันเดิลปัจจุบัน
- หน้าของช่องทาง/Plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบคอนฟิกคือ **JSON5** (อนุญาตคอมเมนต์ + comma ท้ายรายการ) ทุกฟิลด์เป็นแบบไม่บังคับ - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## ช่องทาง

คีย์คอนฟิกต่อช่องทางย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางบันเดิลอื่นๆ
(การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การกั้น mention)

## ค่าเริ่มต้นของเอเจนต์, หลายเอเจนต์, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, โมเดล, การคิด, heartbeat, หน่วยความจำ, สื่อ, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกหลายเอเจนต์)
- `session.*` (วงจรชีวิตเซสชัน, Compaction, การตัดแต่ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.consultThinkingLevel`: การ override ระดับการคิดสำหรับการรันเอเจนต์ OpenClaw เต็มรูปแบบที่อยู่เบื้องหลังการปรึกษาแบบ realtime ของ Control UI Talk
  - `talk.consultFastMode`: การ override fast-mode แบบครั้งเดียวสำหรับการปรึกษาแบบ realtime ของ Control UI Talk
  - `talk.speechLocale`: id locale BCP 47 ที่ไม่บังคับสำหรับการรู้จำคำพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดพูดค่าเริ่มต้นของแพลตฟอร์มไว้ก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback ของ Gateway relay สำหรับ transcript ของ Talk แบบ realtime ที่สรุปแล้วซึ่งข้าม `openclaw_agent_consult`

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายเครื่องมือ, toggle ทดลอง, คอนฟิกเครื่องมือที่รองรับโดยผู้ให้บริการ และการตั้งค่า
ผู้ให้บริการแบบกำหนดเอง / base-URL ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## โมเดล

นิยามผู้ให้บริการ, allowlist ของโมเดล และการตั้งค่าผู้ให้บริการแบบกำหนดเองอยู่ใน
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อกโมเดลส่วนกลางด้วย

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
- `models.providers.*.localService`: ตัวจัดการ process แบบ on-demand ที่ไม่บังคับสำหรับ
  เซิร์ฟเวอร์โมเดลในเครื่อง OpenClaw probe health endpoint ที่กำหนดค่าไว้, เริ่ม
  `command` แบบ absolute เมื่อจำเป็น, รอจนพร้อม แล้วจึงส่งคำขอโมเดล
  ดู [บริการโมเดลในเครื่อง](/th/gateway/local-model-services)
- `models.pricing.enabled`: ควบคุม pricing bootstrap เบื้องหลังที่
  เริ่มหลังจาก sidecar และช่องทางเข้าสู่ path พร้อมของ Gateway เมื่อเป็น `false`
  Gateway จะข้ามการ fetch แค็ตตาล็อก pricing ของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังคงใช้ได้สำหรับการประมาณค่าใช้จ่ายในเครื่อง

## MCP

นิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้โดย OpenClaw แบบ embedded และ runtime adapter อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อไปยัง
เซิร์ฟเวอร์เป้าหมายระหว่างแก้ไขคอนฟิก

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

- `mcp.servers`: นิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือ remote ที่มีชื่อ สำหรับ runtime ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` normalize เข้าเป็นฟิลด์ `transport` ตาม canonical
- `mcp.servers.<name>.enabled`: ตั้งเป็น `false` เพื่อเก็บนิยามเซิร์ฟเวอร์ที่บันทึกไว้
  ขณะตัดออกจากการค้นพบ MCP และการ project เครื่องมือของ OpenClaw แบบ embedded
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout ของคำขอ MCP ต่อเซิร์ฟเวอร์
  เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout การเชื่อมต่อต่อเซิร์ฟเวอร์
  เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.supportsParallelToolCalls`: hint ด้าน concurrency ที่ไม่บังคับสำหรับ
  adapter ที่เลือกได้ว่าจะออกคำสั่งเรียกเครื่องมือ MCP แบบขนานหรือไม่
- `mcp.servers.<name>.auth`: ตั้งเป็น `"oauth"` สำหรับเซิร์ฟเวอร์ HTTP MCP ที่ต้องใช้
  OAuth รัน `openclaw mcp login <name>` เพื่อเก็บ token ภายใต้ state ของ OpenClaw
- `mcp.servers.<name>.oauth`: การ override scope ของ OAuth, redirect URL และ client
  metadata URL ที่ไม่บังคับ
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: ตัวควบคุม HTTP TLS
  สำหรับ endpoint ส่วนตัวและ mutual TLS
- `mcp.servers.<name>.toolFilter`: การเลือกเครื่องมือต่อเซิร์ฟเวอร์ที่ไม่บังคับ `include`
  จำกัดเครื่องมือ MCP ที่ค้นพบให้เหลือชื่อที่ตรงกัน; `exclude` ซ่อนชื่อที่ตรงกัน
  รายการเป็นชื่อเครื่องมือ MCP แบบตรงตัวหรือ glob `*` อย่างง่าย เซิร์ฟเวอร์ที่มี
  resources หรือ prompts จะสร้างชื่อเครื่องมือ utility ด้วย (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) และชื่อเหล่านั้นใช้
  filter เดียวกัน
- `mcp.servers.<name>.codex`: ตัวควบคุมการ project ของ Codex app-server ที่ไม่บังคับ
  บล็อกนี้เป็น metadata ของ OpenClaw สำหรับ thread ของ Codex app-server เท่านั้น; ไม่ได้
  ส่งผลต่อเซสชัน ACP, คอนฟิก Codex harness ทั่วไป หรือ runtime adapter อื่น
  `codex.agents` ที่ไม่ว่างจะจำกัดเซิร์ฟเวอร์ไว้กับ OpenClaw agent id ที่ระบุ
  รายการเอเจนต์ตามขอบเขตที่ว่าง, เป็นช่องว่าง หรือไม่ถูกต้องจะถูกปฏิเสธโดยการตรวจสอบคอนฟิก
  และถูกละเว้นโดย path การ project ของ runtime แทนที่จะกลายเป็น global
  `codex.defaultToolsApprovalMode` ปล่อยค่า native ของ Codex
  `default_tools_approval_mode` สำหรับเซิร์ฟเวอร์นั้น OpenClaw จะลบบล็อก `codex`
  ออกก่อนส่งคอนฟิก native `mcp_servers` ให้ Codex ละเว้นบล็อกนี้เพื่อ
  ให้เซิร์ฟเวอร์ถูก project สำหรับเอเจนต์ Codex app-server ทุกตัวพร้อมพฤติกรรมอนุมัติ MCP
  ค่าเริ่มต้นของ Codex
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ runtime MCP แบบบันเดิลตามขอบเขตเซสชัน
  การรัน embedded แบบครั้งเดียวร้องขอการ cleanup เมื่อจบรัน; TTL นี้เป็น backstop สำหรับ
  เซสชันที่มีอายุยาวและ caller ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` hot-apply โดย dispose runtime MCP ของเซสชันที่ cache ไว้
  การค้นพบ/ใช้งานเครื่องมือครั้งถัดไปจะสร้างใหม่จากคอนฟิกใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL
- การค้นพบ runtime ยังเคารพ notification การเปลี่ยนแปลงรายการเครื่องมือ MCP โดย drop
  แค็ตตาล็อกที่ cache ไว้สำหรับเซสชันนั้น เซิร์ฟเวอร์ที่ advertise resources หรือ
  prompts จะได้เครื่องมือ utility สำหรับแสดงรายการ/อ่าน resources และแสดงรายการ/ดึง
  prompts ความล้มเหลวของการเรียกเครื่องมือซ้ำๆ จะ pause เซิร์ฟเวอร์ที่ได้รับผลกระทบช่วงสั้นๆ ก่อน
  พยายามเรียกอีกครั้ง

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[CLI backend](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรม runtime

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

- `allowBundled`: allowlist ที่ไม่บังคับสำหรับ skills แบบบันเดิลเท่านั้น (ไม่มีผลต่อ skills แบบ managed/workspace)
- `load.extraDirs`: root ของ skill ที่แชร์เพิ่มเติม (precedence ต่ำสุด)
- `load.allowSymlinkTargets`: root เป้าหมายจริงที่เชื่อถือได้ซึ่ง symlink ของ skill อาจ
  resolve เข้าไปได้เมื่อ link อยู่นอก source root ที่กำหนดค่าไว้
- `workshop.allowSymlinkTargetWrites`: อนุญาตให้ Skill Workshop apply เขียน
  ผ่านเป้าหมาย symlink ที่เชื่อถือแล้ว (ค่าเริ่มต้น: false)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อ `brew`
  พร้อมใช้งาน ก่อน fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: preference ของตัวติดตั้ง node สำหรับ spec `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `install.allowUploadedArchives`: อนุญาตให้ client Gateway `operator.admin` ที่เชื่อถือได้
  ติดตั้ง zip archive ส่วนตัวที่ staged ผ่าน `skills.upload.*`
  (ค่าเริ่มต้น: false) ค่านี้เปิดใช้เฉพาะ path uploaded-archive; การติดตั้ง ClawHub ปกติ
  ไม่ต้องใช้ค่านี้
- `entries.<skillKey>.enabled: false` ปิดใช้ skill แม้ว่าจะเป็นบันเดิล/ติดตั้งแล้ว
- `entries.<skillKey>.apiKey`: ทางลัดสำหรับ skills ที่ประกาศ env var หลัก (สตริง plaintext หรือออบเจ็กต์ SecretRef)

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
- วางไฟล์ Plugin แบบสแตนด์อโลนใน `plugins.load.paths`; รากส่วนขยายที่ค้นพบอัตโนมัติจะละเว้นไฟล์ `.js`, `.mjs` และ `.ts` ระดับบนสุด เพื่อไม่ให้สคริปต์ช่วยเหลือในรากเหล่านั้นขัดขวางการเริ่มต้น
- การค้นพบรองรับ Plugin แบบเนทีฟของ OpenClaw รวมถึงบันเดิล Codex และบันเดิล Claude ที่เข้ากันได้ รวมถึงบันเดิลเลย์เอาต์เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการกำหนดค่าต้องรีสตาร์ท gateway**
- `allow`: รายการอนุญาตแบบไม่บังคับ (โหลดเฉพาะ Plugin ที่ระบุไว้) `deny` มีผลเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับคีย์ API ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แผนที่ตัวแปร env ที่จำกัดขอบเขตกับ Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` แกนหลักจะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่เปลี่ยน prompt จาก `before_agent_start` แบบเดิม ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบเดิมไว้ ใช้กับ hook ของ Plugin แบบเนทีฟและไดเรกทอรี hook ที่มาจากบันเดิลที่รองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่ไม่ได้บันเดิลและเชื่อถือได้สามารถอ่านเนื้อหาบทสนทนาดิบจาก hook แบบมีชนิด เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอการเขียนทับ `provider` และ `model` รายการต่อการรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: รายการอนุญาตแบบไม่บังคับของเป้าหมาย `provider/model` แบบบัญญัติสำหรับการเขียนทับ subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอการเขียนทับโมเดลสำหรับ `api.runtime.llm.complete`
- `plugins.entries.<id>.llm.allowedModels`: รายการอนุญาตแบบไม่บังคับของเป้าหมาย `provider/model` แบบบัญญัติสำหรับการเขียนทับการเติมเต็ม LLM ของ Plugin ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowAgentIdOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้รัน `api.runtime.llm.complete` กับ agent id ที่ไม่ใช่ค่าเริ่มต้น
- `plugins.entries.<id>.config`: อ็อบเจกต์การกำหนดค่าที่กำหนดโดย Plugin (ตรวจสอบความถูกต้องโดย schema ของ Plugin แบบเนทีฟของ OpenClaw เมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ Plugin ช่องทางอยู่ภายใต้ `channels.<id>` และควรอธิบายโดย metadata `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดยรีจิสทรีตัวเลือกส่วนกลางของ OpenClaw

### การกำหนดค่า Plugin ฮาร์เนส Codex

Plugin `codex` ที่บันเดิลมาด้วยเป็นเจ้าของการตั้งค่าฮาร์เนส app-server แบบเนทีฟของ Codex ภายใต้
`plugins.entries.codex.config` ดู
[ข้อมูลอ้างอิงฮาร์เนส Codex](/th/plugins/codex-harness-reference) สำหรับพื้นผิวการกำหนดค่าทั้งหมด
และ [ฮาร์เนส Codex](/th/plugins/codex-harness) สำหรับโมเดลรันไทม์

`codexPlugins` ใช้เฉพาะกับเซสชันที่เลือกฮาร์เนส Codex แบบเนทีฟเท่านั้น
ไม่ได้เปิดใช้ Plugin ของ Codex สำหรับการรัน provider ของ OpenClaw, การผูกบทสนทนา ACP
หรือฮาร์เนสใดๆ ที่ไม่ใช่ Codex

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
  Plugin/แอปแบบเนทีฟของ Codex สำหรับฮาร์เนส Codex ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  นโยบายค่าเริ่มต้นสำหรับการกระทำแบบทำลายต่อ elicitations ของแอป Plugin ที่ย้ายมา
  ใช้ `true` เพื่อยอมรับ schema การอนุมัติของ Codex ที่ปลอดภัยโดยไม่ถาม, `false`
  เพื่อปฏิเสธ, `"auto"` เพื่อส่งต่อการอนุมัติที่ Codex ต้องการผ่านการอนุมัติ
  Plugin ของ OpenClaw หรือ `"always"` เพื่อถามทุกครั้งสำหรับการเขียน/การกระทำแบบทำลายของ Plugin
  โดยไม่มีการอนุมัติถาวร โหมด `"always"` จะล้างการเขียนทับการอนุมัติต่อเครื่องมือแบบถาวรของ Codex
  สำหรับแอปที่ได้รับผลกระทบก่อนเริ่มเธรด
  ค่าเริ่มต้น: `true`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: เปิดใช้รายการ
  Plugin ที่ย้ายมาเมื่อ `codexPlugins.enabled` ส่วนกลางเป็น true ด้วย
  ค่าเริ่มต้น: `true` สำหรับรายการที่ระบุชัดเจน
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  ตัวตน marketplace ที่เสถียร V1 รองรับเฉพาะ `"openai-curated"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: ตัวตน
  Plugin ของ Codex ที่เสถียรจากการย้ายข้อมูล เช่น `"google-calendar"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  การเขียนทับการกระทำแบบทำลายราย Plugin เมื่อไม่ระบุ จะใช้ค่า
  `allow_destructive_actions` ส่วนกลาง ค่าราย Plugin รองรับนโยบาย
  `true`, `false`, `"auto"` หรือ `"always"` เดียวกัน

`codexPlugins.enabled` คือคำสั่งเปิดใช้ส่วนกลาง รายการ Plugin ที่ระบุชัดเจน
ซึ่งเขียนโดยการย้ายข้อมูลคือชุดการติดตั้งถาวรและสิทธิ์การซ่อมแซม
ไม่รองรับ `plugins["*"]`, ไม่มีสวิตช์ `install` และค่า
`marketplacePath` ภายในเครื่องจงใจไม่เป็นฟิลด์การกำหนดค่า เพราะค่าเหล่านี้
เฉพาะกับโฮสต์

การตรวจสอบความพร้อมของ `app/list` ถูกแคชไว้หนึ่งชั่วโมงและรีเฟรช
แบบอะซิงโครนัสเมื่อหมดอายุ การกำหนดค่าแอปของเธรด Codex ถูกคำนวณเมื่อสร้าง
เซสชันฮาร์เนส Codex ไม่ใช่ทุก turn; ใช้ `/new`, `/reset` หรือรีสตาร์ท gateway
หลังเปลี่ยนการกำหนดค่า Plugin แบบเนทีฟ

- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า provider สำหรับ web-fetch ของ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl แบบไม่บังคับสำหรับขีดจำกัดที่สูงขึ้น (รองรับ SecretRef) สำรองไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเดิม หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ API Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; การเขียนทับแบบโฮสต์เองต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: หมดเวลาคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นเว็บ Grok)
  - `enabled`: เปิดใช้ provider X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและเกณฑ์
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ cron สำหรับการกวาด dreaming เต็มรูปแบบแต่ละครั้ง (ค่าเริ่มต้นคือ `"0 3 * * *"`)
  - `model`: การเขียนทับโมเดล subagent ของ Dream Diary แบบไม่บังคับ ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะลองใหม่หนึ่งครั้งด้วยโมเดลค่าเริ่มต้นของเซสชัน; ความล้มเหลวด้านความเชื่อถือหรือรายการอนุญาตจะไม่ fallback แบบเงียบๆ
  - นโยบายเฟสและเกณฑ์เป็นรายละเอียดการใช้งานภายใน (ไม่ใช่คีย์การกำหนดค่าที่ผู้ใช้เห็น)
- การกำหนดค่า memory ทั้งหมดอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้แล้วยังสามารถให้ค่าเริ่มต้น OpenClaw แบบฝังจาก `settings.json`; OpenClaw จะใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่แพตช์การกำหนดค่า OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือก id ของ Plugin memory ที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้ Plugin memory
- `plugins.slots.contextEngine`: เลือก id ของ Plugin context engine ที่ใช้งานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

---

## คำมั่น

`commitments` ควบคุม memory การติดตามผลที่อนุมานได้: OpenClaw สามารถตรวจจับการเช็กอินจาก turn ของบทสนทนาและส่งผ่านการรัน Heartbeat ได้

- `commitments.enabled`: เปิดใช้การดึงข้อมูลด้วย LLM แบบซ่อน การจัดเก็บ และการส่งผ่าน Heartbeat สำหรับคำมั่นติดตามผลที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวนคำมั่นติดตามผลที่อนุมานได้สูงสุดที่ส่งต่อเซสชัน agent ในหนึ่งวันแบบเลื่อน ค่าเริ่มต้น: `3`

ดู [คำมั่นที่อนุมานได้](/th/concepts/commitments)

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
- `tabCleanup` เรียกคืนแท็บ primary-agent ที่ติดตามไว้หลังจากไม่มีการใช้งานช่วงหนึ่ง หรือเมื่อ
  เซสชันเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมดล้างข้อมูลแต่ละแบบเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงยังเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจไว้วางใจการนำทางของเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด ปลายทางโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังรองรับต่อไปในฐานะนามแฝงเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นแบบระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่จัดการอยู่จะคงค่าเริ่มต้น CDP ภายในเครื่องไว้
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ภายในเครื่องที่จัดการอยู่ และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตภายในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือก หรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมายโปรไฟล์เบราว์เซอร์
  ที่ใช้ Chromium โดยเฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` สามารถตั้งค่า `cdpUrl` เมื่อ Chrome ทำงานอยู่แล้ว
  หลังปลายทางค้นพบ DevTools HTTP(S) หรือปลายทาง WS(S) โดยตรง ใน
  โหมดนั้น OpenClaw จะส่งปลายทางให้ Chrome MCP แทนการใช้การเชื่อมต่ออัตโนมัติ;
  `userDataDir` จะถูกละเว้นสำหรับอาร์กิวเมนต์เปิดใช้ Chrome MCP
- โปรไฟล์ `existing-session` คงข้อจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้:
  การดำเนินการที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS-selector, ฮุกอัปโหลด
  ไฟล์เดียว, ไม่มีการแทนที่ timeout ของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักดาวน์โหลด หรือการดำเนินการแบบกลุ่ม
- โปรไฟล์ `openclaw` ภายในเครื่องที่จัดการอยู่จะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ตั้งค่า
  `cdpUrl` แบบชัดเจนเฉพาะสำหรับโปรไฟล์ CDP ระยะไกล หรือการแนบปลายทาง existing-session
- โปรไฟล์ภายในเครื่องที่จัดการอยู่สามารถตั้งค่า `executablePath` เพื่อแทนที่
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อเรียกใช้โปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ภายในเครื่องที่จัดการอยู่ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดใช้ เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- ทั้ง `browser.executablePath` และ `browser.profiles.<name>.executablePath`
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรีโฮมของ OS ของคุณก่อนเปิดใช้ Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยายเครื่องหมายทิลด์ด้วย
- บริการควบคุม: loopback เท่านั้น (พอร์ตได้จาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` ต่อท้ายแฟล็กการเปิดใช้เพิ่มเติมให้กับการเริ่มต้น Chromium ภายในเครื่อง (เช่น
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
- `assistant`: การแทนที่ตัวตน Control UI ถอยกลับไปใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่

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
- `port`: พอร์ตมัลติเพล็กซ์พอร์ตเดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`
- **นามแฝง bind แบบเก่า**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะเข้ามาทาง `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือกำหนด `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นโดยค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ Gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รู้จักตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` ตัวช่วยตั้งค่าเริ่มต้นจะสร้างโทเค็นให้โดยค่าเริ่มต้น
- หากกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` เป็น `token` หรือ `password` อย่างชัดเจน ขั้นตอนเริ่มต้นและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดทั้งสองอย่างและไม่ได้ตั้งค่าโหมด
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบชัดเจน ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โดยตั้งใจไม่เสนอผ่านพรอมป์ของการเริ่มใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รู้จักตัวตน และเชื่อถือส่วนหัวตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งพร็อกซีที่ **ไม่ใช่ loopback** โดยค่าเริ่มต้น; reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback โดยตรงในเครื่องได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` ส่วนหัวตัวตนของ Tailscale Serve สามารถผ่านการยืนยันตัวตนของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) ปลายทาง HTTP API **ไม่** ใช้การยืนยันตัวตนจากส่วนหัว Tailscale นี้ แต่จะทำตามโหมดการยืนยันตัวตน HTTP ปกติของ Gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะคืน `429` + `Retry-After`
  - บนเส้นทาง Control UI แบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามผิดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานที่คำขอที่สอง แทนที่ทั้งคู่จะแข่งผ่านไปเป็นเพียงการไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีที่เข้มงวด)
- ความพยายามยืนยันตัวตน WS จากต้นทางเบราว์เซอร์จะถูกจำกัดอัตราเสมอโดยปิดข้อยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost จากเบราว์เซอร์)
- บน loopback การล็อกเอาต์จากต้นทางเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ทำให้เป็นรูปแบบมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่ล็อกเอาต์
  ต้นทางอื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องมีการยืนยันตัวตน)
- `tailscale.serviceName`: ชื่อ Tailscale Service แบบไม่บังคับสำหรับโหมด Serve เช่น
  `svc:openclaw` เมื่อตั้งค่าแล้ว OpenClaw จะส่งต่อให้ `tailscale serve
--service` เพื่อให้ Control UI เปิดเผยผ่าน Service ที่มีชื่อแทน
  ชื่อโฮสต์ของอุปกรณ์ ค่าต้องใช้รูปแบบชื่อ Service ของ Tailscale แบบ `svc:<dns-label>`;
  การเริ่มต้นจะรายงาน URL ของ Service ที่ได้มา
- `tailscale.preserveFunnel`: เมื่อเป็น `true` และ `tailscale.mode = "serve"` OpenClaw
  จะตรวจสอบ `tailscale funnel status` ก่อนนำ Serve ไปใช้อีกครั้งตอนเริ่มต้น และข้าม
  หากเส้นทาง Funnel ที่กำหนดค่าจากภายนอกครอบคลุมพอร์ต Gateway อยู่แล้ว
  ค่าเริ่มต้น `false`
- `controlUi.allowedOrigins`: รายการอนุญาตต้นทางเบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นสำหรับต้นทางเบราว์เซอร์สาธารณะที่ไม่ใช่ loopback การโหลด UI แบบ private same-origin จาก LAN/Tailnet ผ่าน loopback, RFC1918/link-local, `.local`, `.ts.net` หรือโฮสต์ Tailscale CGNAT จะได้รับการยอมรับโดยไม่ต้องเปิดใช้ fallback ส่วนหัว Host
- `controlUi.chatMessageMaxWidth`: ความกว้างสูงสุดแบบไม่บังคับสำหรับข้อความแชท Control UI ที่จัดกลุ่ม รับค่าความกว้าง CSS ที่จำกัด เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback ของต้นทางจากส่วนหัว Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบายต้นทางจากส่วนหัว Host
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `wss://` สำหรับโฮสต์สาธารณะ; plaintext `ws://` ยอมรับเฉพาะสำหรับ loopback, LAN, link-local, `.local`, `.ts.net` และโฮสต์ Tailscale CGNAT
- `remote.remotePort`: พอร์ต Gateway บนโฮสต์ SSH ระยะไกล ค่าเริ่มต้นเป็น `18789`; ใช้ค่านี้เมื่อพอร์ต tunnel ในเครื่องต่างจากพอร์ต Gateway ระยะไกล
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของไคลเอนต์ระยะไกล ไม่ได้กำหนดค่าการยืนยันตัวตนของ Gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL HTTPS ฐานสำหรับ APNs relay ภายนอกที่ใช้หลังจากบิลด์ iOS ที่รองรับ relay เผยแพร่การลงทะเบียนไปยัง Gateway บิลด์สาธารณะบน App Store/TestFlight ใช้ relay ที่โฮสต์โดย OpenClaw URL relay แบบกำหนดเองต้องตรงกับเส้นทางบิลด์/ปรับใช้ iOS ที่แยกไว้โดยตั้งใจ ซึ่ง URL relay ชี้ไปยัง relay นั้น
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก Gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นเป็น `10000`
- การลงทะเบียนที่รองรับ relay จะถูกมอบหมายให้ตัวตน Gateway เฉพาะ แอป iOS ที่จับคู่จะดึง `gateway.identity.get` รวมตัวตนนั้นในการลงทะเบียน relay และส่งต่อสิทธิ์การส่งที่จำกัดตามการลงทะเบียนไปยัง Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่เก็บไว้นั้นไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env override ชั่วคราวสำหรับการตั้งค่า relay ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL relay HTTP แบบ loopback URL relay สำหรับโปรดักชันควรอยู่บน HTTPS
- `gateway.handshakeTimeoutMs`: timeout การ handshake ของ Gateway WebSocket ก่อนยืนยันตัวตน เป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อกำหนดค่าไว้ เพิ่มค่านี้บนโฮสต์ที่มีโหลดหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ในเครื่องสามารถเชื่อมต่อได้ขณะที่การอุ่นเครื่องตอนเริ่มต้นยังไม่เสถียร
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาตัวตรวจสุขภาพช่องทางเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ตจากตัวตรวจสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ stale-socket เป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนรีสตาร์ตสูงสุดจากตัวตรวจสุขภาพต่อช่องทาง/บัญชีในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การเลือกไม่ใช้รายช่องทางสำหรับการรีสตาร์ตจากตัวตรวจสุขภาพ ขณะที่ยังเปิดใช้ตัวตรวจทั่วทั้งระบบ
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override รายบัญชีสำหรับช่องทางหลายบัญชี เมื่อตั้งค่าแล้ว จะมีลำดับความสำคัญเหนือ override ระดับช่องทาง
- เส้นทางการเรียก Gateway ในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนด `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี remote fallback มาปิดบัง)
- `trustedProxies`: IP ของ reverse proxy ที่สิ้นสุด TLS หรือแทรกส่วนหัว forwarded-client ระบุเฉพาะพร็อกซีที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าพร็อกซี/การตรวจจับในเครื่องบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่จะ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อพฤติกรรมล้มเหลวแบบปิด
- `gateway.nodes.pairing.autoApproveCidrs`: รายการอนุญาต CIDR/IP แบบไม่บังคับสำหรับอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกอัตโนมัติโดยไม่มีขอบเขตที่ร้องขอ จะปิดใช้เมื่อไม่ได้ตั้งค่า ค่านี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat อัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key อัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนดรูปทรง allow/deny ทั่วทั้งระบบสำหรับคำสั่ง node ที่ประกาศไว้หลังการจับคู่และการประเมินรายการอนุญาตแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกใช้คำสั่ง node ที่อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ว่าค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตอย่างชัดเจนจะรวมไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ Gateway เก็บ snapshot คำสั่งที่อัปเดตแล้ว
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการปฏิเสธค่าเริ่มต้น)
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการปฏิเสธ HTTP ค่าเริ่มต้นสำหรับ
  ผู้เรียก owner/admin ค่านี้ไม่ได้ยกระดับผู้เรียกที่มีตัวตน `operator.write`
  ให้เป็นสิทธิ์ owner/admin; `cron`, `gateway` และ `nodes` ยังคง
  ใช้ไม่ได้กับผู้เรียกที่ไม่ใช่ owner แม้จะอยู่ในรายการอนุญาต

</Accordion>

### ปลายทางที่เข้ากันได้กับ OpenAI

- Admin HTTP RPC: ปิดโดยค่าเริ่มต้นในฐานะ Plugin `admin-http-rpc` เปิดใช้ Plugin เพื่อลงทะเบียน `POST /api/v1/admin/rpc` ดู [Admin HTTP RPC](/th/plugins/admin-http-rpc)
- Chat Completions: ปิดใช้โดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความแข็งแรงสำหรับอินพุต URL ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    รายการอนุญาตว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- ส่วนหัวเสริมความแข็งแรงของการตอบกลับแบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: เปิดใช้การสิ้นสุด TLS ที่ตัวฟังของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์อย่างชัดเจน; ใช้สำหรับ local/dev เท่านั้น
- `certPath`: เส้นทางระบบไฟล์ไปยังไฟล์ใบรับรอง TLS
- `keyPath`: เส้นทางระบบไฟล์ไปยังไฟล์ private key ของ TLS; ควรจำกัดสิทธิ์การเข้าถึง
- `caPath`: เส้นทาง CA bundle แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ custom trust chains

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
  - `"off"`: ไม่สนใจการแก้ไขแบบสด การเปลี่ยนแปลงต้อง restart อย่างชัดเจน
  - `"restart"`: restart โปรเซส Gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ภายในโปรเซสโดยไม่ต้อง restart
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน แล้วค่อยถอยกลับไป restart หากจำเป็น
- `debounceMs`: ช่วง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็น ms ที่จะรอการดำเนินการที่กำลังทำงานอยู่ก่อนบังคับ restart หรือ hot reload ของช่องทาง ละไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้งเป็น `0` เพื่อรอไม่จำกัดและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

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
โทเค็นของ hook ใน query string จะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ควรแตกต่างจาก shared-secret auth ของ Gateway ที่ใช้งานอยู่ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); เมื่อเริ่มทำงาน ระบบจะบันทึกคำเตือนด้านความปลอดภัยที่ไม่ทำให้ล้มเหลวเมื่อตรวจพบการใช้ซ้ำ
- `openclaw security audit` จะแจ้งการใช้ auth ของ hook/Gateway ซ้ำเป็นผลตรวจระดับวิกฤต รวมถึง auth รหัสผ่านของ Gateway ที่ระบุเฉพาะตอน audit (`--auth password --password <password>`) รัน `openclaw doctor --fix` เพื่อหมุนเวียน `hooks.token` ที่ persisted และถูกใช้ซ้ำ จากนั้นอัปเดตผู้ส่ง hook ภายนอกให้ใช้โทเค็น hook ใหม่
- `hooks.path` เป็น `/` ไม่ได้ ให้ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบ template ให้ตั้ง `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์ mapping แบบคงที่ไม่ต้อง opt in นี้

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก request payload จะรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ค่าโดยใช้ `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่เรนเดอร์จาก template จะถือว่าเป็นค่าที่ระบุจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ payload สำหรับ path ทั่วไป
- Template อย่าง `{{messages[0].subject}}` อ่านจาก payload
- `transform` ชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็น path แบบ relative และอยู่ภายใน `hooks.transformsDir` (path แบบ absolute และการ traversal จะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี skill ของ workspace จะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่า path นี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` ส่งต่อไปยัง agent เฉพาะ ID ที่ไม่รู้จักจะถอยกลับไปยัง agent ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการ route ไปยัง agent ที่มีผลจริง รวมถึง path ของ agent ค่าเริ่มต้นเมื่อไม่ระบุ `agentId` (`*` หรือละไว้ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์ session แบบคงที่ที่ไม่บังคับสำหรับการรัน agent จาก hook โดยไม่มี `sessionKey` ที่ชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์ session ของ mapping ที่ขับเคลื่อนด้วย template ตั้ง `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist prefix แบบไม่บังคับสำหรับค่า `sessionKey` ที่ชัดเจน (request + mapping) เช่น `["hook:"]` จะกลายเป็นค่าบังคับเมื่อ mapping หรือ preset ใดใช้ `sessionKey` แบบ template
- `deliver: true` ส่งการตอบกลับสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากมีการตั้ง model catalog)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการ route แบบต่อข้อความนั้นไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้ override preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบ template

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

- Gateway เริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูตหากมีการกำหนดค่าไว้ ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้
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

- ให้บริการ HTML/CSS/JS และ A2UI ที่ agent แก้ไขได้ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: route ของ canvas ต้องใช้ auth ของ Gateway (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่ง auth headers; หลังจาก node ถูกจับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ URL ความสามารถที่จำกัดขอบเขตตาม node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับ session WS ของ node ที่ใช้งานอยู่และหมดอายุเร็ว ไม่ใช้ fallback ตาม IP
- แทรกไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่าง
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้อง restart gateway
- ปิด live reload สำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้ Plugin `bonjour` ที่ bundled): ละ `cliPath` + `sshPort` จาก TXT records
- `full`: รวม `cliPath` + `sshPort`; การโฆษณา LAN multicast ยังคงต้องเปิดใช้ Plugin `bonjour` ที่ bundled
- `off`: ระงับการโฆษณา LAN multicast โดยไม่เปลี่ยนการเปิดใช้ Plugin
- Plugin `bonjour` ที่ bundled จะเริ่มโดยอัตโนมัติบนโฮสต์ macOS และเป็นแบบ opt-in บน Linux, Windows และการปรับใช้ Gateway ใน container
- hostname มีค่าเริ่มต้นเป็น hostname ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง และถอยกลับเป็น `openclaw` override ด้วย `OPENCLAW_MDNS_HOSTNAME`

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบ unicast ไว้ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้คู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

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
- ไฟล์ `.env`: `.env` ใน CWD + `~/.openclaw/.env` (ทั้งคู่จะไม่เขียนทับตัวแปรที่มีอยู่แล้ว)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังขาดอยู่จากโปรไฟล์ login shell ของคุณ
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
- ตัวแปรที่ขาดหายหรือว่างเปล่าจะทำให้เกิดข้อผิดพลาดเมื่อโหลด config
- Escape ด้วย `$${VAR}` สำหรับ `${VAR}` แบบ literal
- ใช้ได้กับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเติม: ค่าข้อความธรรมดายังคงใช้ได้

### `SecretRef`

ใช้รูปแบบออบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบ:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบ absolute (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (รองรับตัวเลือกแบบ AWS เช่น `secret#json_key`)
- id ของ `source: "exec"` ต้องไม่มีเซ็กเมนต์พาธที่คั่นด้วย slash เป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลประจำตัวที่รองรับ

- เมทริกซ์หลัก: [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายพาธข้อมูลประจำตัว `openclaw.json` ที่รองรับ
- การอ้างอิง `auth-profiles.json` รวมอยู่ในการแก้ค่า runtime และการครอบคลุมการ audit

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
- พาธของผู้ให้บริการ file และ exec จะล้มเหลวแบบปิดเมื่อการตรวจสอบ Windows ACL ไม่พร้อมใช้งาน ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้และตรวจสอบไม่ได้เท่านั้น
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบ absolute และใช้ payload ของโปรโตคอลผ่าน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink พร้อมตรวจสอบพาธเป้าหมายที่แก้ค่าแล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่แก้ค่าแล้ว
- สภาพแวดล้อมของ child สำหรับ `exec` เป็นแบบขั้นต่ำโดยค่าเริ่มต้น ให้ส่งตัวแปรที่ต้องใช้โดยชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูกแก้ค่าในช่วง activation เป็น snapshot ในหน่วยความจำ จากนั้นพาธ request จะอ่านเฉพาะ snapshot
- การกรอง active-surface จะใช้ในช่วง activation: การอ้างอิงที่แก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ active จะถูกข้ามพร้อม diagnostics

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

- โปรไฟล์ต่อเอเจนต์ถูกเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบแบนรุ่นเก่า เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key มาตรฐาน `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่หนุนด้วย SecretRef
- ข้อมูลรับรอง runtime แบบคงที่มาจากสแนปช็อตที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่รุ่นเก่าจะถูกล้างเมื่อพบ
- การนำเข้า OAuth รุ่นเก่ามาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรม runtime ของ secrets และเครื่องมือ `audit/configure/apply`: [การจัดการ Secrets](/th/gateway/secrets)

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

- `billingBackoffHours`: backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาด
  ด้าน billing/เครดิตไม่พอที่เป็นจริง (ค่าเริ่มต้น: `5`) ข้อความ billing ที่ชัดเจนยังอาจ
  เข้ามาที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการ
  จะยังถูกจำกัดขอบเขตไว้กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter
  `Key limit exceeded`) ข้อความ HTTP `402` แบบลองใหม่ได้สำหรับ usage-window หรือ
  ขีดจำกัดค่าใช้จ่ายของ organization/workspace จะยังอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: การ override รายผู้ให้บริการแบบไม่บังคับสำหรับจำนวนชั่วโมง billing backoff
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ billing backoff (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่าง rolling เป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุน auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: ดีเลย์คงที่ก่อนลองใหม่ในการหมุนผู้ให้บริการ/โปรไฟล์ที่ overloaded (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุน auth-profile ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) บัคเก็ต rate-limit นั้นรวมข้อความที่มีรูปแบบของผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- `maxFileBytes`: ขนาดสูงสุดของไฟล์ล็อกที่ใช้งานอยู่เป็นไบต์ก่อน rotation (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์ archive แบบมีหมายเลขไว้ข้างไฟล์ที่ใช้งานอยู่ได้สูงสุดห้าไฟล์
- `redactSensitive` / `redactPatterns`: การปิดบังแบบ best-effort สำหรับเอาต์พุตคอนโซล, ไฟล์ล็อก, ระเบียนล็อก OTLP และข้อความ transcript ของเซสชันที่ persist ไว้ `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบายล็อก/transcript ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/tool/diagnostic ยังจะ redact secrets ก่อนปล่อยออกเสมอ

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
- `flags`: อาร์เรย์ของสตริง flag ที่เปิดใช้เอาต์พุตล็อกแบบเจาะจง (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุแบบไม่มีความคืบหน้าเป็น ms สำหรับจำแนกเซสชันประมวลผลที่ใช้เวลานานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, tool, สถานะ, block และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; diagnostic `session.stuck` ที่ซ้ำกันจะ back off ขณะยังไม่เปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุแบบไม่มีความคืบหน้าเป็น ms ก่อนที่งาน active ที่ stalled และเข้าเกณฑ์อาจถูก abort-drained เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่าง embedded-run แบบขยายที่ปลอดภัยกว่าอย่างน้อย 5 นาทีและ 3 เท่าของ `stuckSessionWarnMs`
- `memoryPressureSnapshot`: จับสแนปช็อตเสถียรภาพก่อน OOM ที่ถูก redact เมื่อแรงกดดันหน่วยความจำถึง `critical` (ค่าเริ่มต้น: `false`) ตั้งเป็น `true` เพื่อเพิ่มการสแกน/เขียนไฟล์ stability bundle โดยยังคงเหตุการณ์แรงกดดันหน่วยความจำตามปกติ
- `otel.enabled`: เปิดใช้ pipeline การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม, แคตตาล็อก signal และโมเดลความเป็นส่วนตัว ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะ signal แบบไม่บังคับ เมื่อตั้งค่าแล้ว จะ override `otel.endpoint` สำหรับ signal นั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: header metadata HTTP/gRPC เพิ่มเติมที่ส่งพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.logsExporter`: sink การส่งออก log: `"otlp"` (ค่าเริ่มต้น), `"stdout"` สำหรับออบเจ็กต์ JSON หนึ่งรายการต่อบรรทัด stdout หรือ `"both"`
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry ตามรอบเป็น ms
- `otel.captureContent`: การจับเนื้อหาดิบแบบ opt-in สำหรับ attributes ของ OTEL span ค่าเริ่มต้นคือปิด Boolean `true` จะจับเนื้อหาข้อความ/tool ที่ไม่ใช่ระบบ; รูปแบบออบเจ็กต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` และ `toolDefinitions` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์ environment สำหรับรูปแบบ span การ inference ของ GenAI รุ่นทดลองล่าสุด รวมถึงชื่อ span `{gen_ai.operation.name} {gen_ai.request.model}`, span kind `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` รุ่นเก่า โดยค่าเริ่มต้น spans จะคง `openclaw.model.call` และ `gen_ai.system` ไว้เพื่อความเข้ากันได้; metrics ของ GenAI ใช้ semantic attributes แบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์ environment สำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น OpenClaw จะข้าม startup/shutdown ของ SDK ที่ Plugin เป็นเจ้าของ ขณะยังคง diagnostic listeners active ไว้
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars ของ endpoint เฉพาะ signal ที่ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปช็อต cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
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

- `channel`: release channel สำหรับการติดตั้ง npm/git - `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้ auto-update แบบเบื้องหลังสำหรับการติดตั้ง package (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ดีเลย์ขั้นต่ำเป็นชั่วโมงก่อน auto-apply ใน stable-channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการ rollout ของ stable-channel เพิ่มเติมเป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
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

- `enabled`: feature gate ระดับ global ของ ACP (ค่าเริ่มต้น: `true`; ตั้ง `false` เพื่อซ่อน ACP dispatch และ affordances การ spawn)
- `dispatch.enabled`: gate อิสระสำหรับการ dispatch turn ของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้ง `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งานแต่บล็อกการดำเนินการ
- `backend`: id ของ backend runtime ACP เริ่มต้น (ต้องตรงกับ Plugin runtime ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin backend ก่อน และถ้าตั้งค่า `plugins.allow` ให้รวม id ของ Plugin backend (เช่น `acpx`) มิฉะนั้น backend ACP จะไม่โหลด
- `defaultAgent`: id เอเจนต์เป้าหมายสำรองของ ACP เมื่อ spawns ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชัน runtime ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ active พร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่ streamed
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยก block projection ที่ streamed
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/tool ที่ซ้ำกันต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` stream แบบเพิ่มทีละส่วน; `"final_only"` buffer จนถึงเหตุการณ์ terminal ของ turn
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์ tool ที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุต assistant สูงสุดที่ project ต่อ turn ของ ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ project
- `stream.tagVisibility`: ระเบียนของชื่อ tag ไปยัง visibility overrides แบบ boolean สำหรับเหตุการณ์ที่ streamed
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ workers ของเซสชัน ACP ก่อนเข้าเกณฑ์ cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับสำหรับรันเมื่อ bootstrap สภาพแวดล้อม runtime ACP

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
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่สโลแกน) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## วิซาร์ด

เมตาดาตาที่เขียนโดยโฟลว์การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

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

## อัตลักษณ์

ดูฟิลด์อัตลักษณ์ของ `agents.list` ใต้ [ค่าเริ่มต้นของ Agent](/th/gateway/config-agents#agent-defaults)

---

## Bridge (เดิม, ถูกลบแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node ต่าง ๆ เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมาคอนฟิกอีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถตัดคีย์ที่ไม่รู้จักออกได้)

<Accordion title="คอนฟิก bridge เดิม (อ้างอิงทางประวัติศาสตร์)">

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

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์แล้วก่อนตัดออกจาก `sessions.json` รวมถึงควบคุมการล้างทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวรไว้ด้วย ค่าเริ่มต้น: `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ยอมรับเพื่อความเข้ากันได้กับบันทึกการรัน Cron แบบเก่าที่ใช้ไฟล์เป็นแบ็กเอนด์ ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: แถวประวัติการรัน SQLite ล่าสุดที่เก็บไว้ต่อหนึ่งงาน ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเคน bearer ที่ใช้สำหรับการส่ง Cron Webhook POST (`delivery.mode = "webhook"`), หากละไว้จะไม่ส่งเฮดเดอร์ auth
- `webhook`: URL Webhook ทางเลือกสำรองเดิมที่เลิกใช้แล้ว (http/https) ซึ่ง `openclaw doctor --fix` ใช้เพื่อย้ายงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`; การส่งขณะรันไทม์ใช้ `delivery.mode="webhook"` ต่อหนึ่งงานร่วมกับ `delivery.to` หรือ `delivery.completionDestination` เมื่อคงการส่งแบบประกาศไว้

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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงาน Cron เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`-`10`)
- `backoffMs`: อาร์เรย์ของดีเลย์ backoff เป็น ms สำหรับแต่ละครั้งที่ลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อให้ลองใหม่กับประเภทชั่วคราวทั้งหมด

งานแบบครั้งเดียวจะยังเปิดใช้งานอยู่จนกว่าความพยายามลองใหม่จะหมด จากนั้นจึงปิดใช้งานโดยเก็บสถานะข้อผิดพลาดสุดท้ายไว้ งานแบบเกิดซ้ำใช้นโยบายการลองใหม่สำหรับข้อผิดพลาดชั่วคราวเดียวกันเพื่อรันอีกครั้งหลัง backoff ก่อนช่องเวลาตามกำหนดถัดไป; ข้อผิดพลาดถาวรหรือการลองใหม่สำหรับข้อผิดพลาดชั่วคราวที่หมดจำนวนครั้งจะย้อนกลับไปใช้ตารางเวลาเกิดซ้ำตามปกติพร้อม backoff ข้อผิดพลาด

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
- `after`: จำนวนความล้มเหลวต่อเนื่องก่อนยิงการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดการดำเนินการ
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความของช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือ ID ช่องทางที่ไม่บังคับเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบประกาศ `"last"` ใช้ช่องทางการส่งที่ทราบล่าสุดซ้ำ
- `to`: เป้าหมายการประกาศหรือ URL Webhook แบบระบุชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` ต่อหนึ่งงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งแบบส่วนกลางและต่อหนึ่งงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมายการประกาศหลักนั้นเมื่อเกิดความล้มเหลว
- รองรับ `delivery.failureDestination` เฉพาะสำหรับงาน `sessionTarget="isolated"` เท่านั้น เว้นแต่ว่า `delivery.mode` หลักของงานเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

เพลซโฮลเดอร์เทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวห่อประวัติ/ผู้ส่ง)          |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                     |
| `{{To}}`           | ตัวระบุปลายทาง                                    |
| `{{MessageSid}}`   | ID ข้อความของช่องทาง                              |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                            |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                          |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                  |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)               |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                  |
| `{{Prompt}}`       | พรอมป์สื่อที่ resolve แล้วสำหรับรายการ CLI        |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่ resolve แล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวเรื่องของกลุ่ม (พยายามอย่างดีที่สุด)          |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามอย่างดีที่สุด)         |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามอย่างดีที่สุด)        |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามอย่างดีที่สุด)    |
| `{{Provider}}`     | คำใบ้ provider (whatsapp, telegram, discord ฯลฯ) |

---

## การ include คอนฟิก (`$include`)

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

- ไฟล์เดียว: แทนที่ออบเจ็กต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (รายการหลังแทนที่รายการก่อน)
- คีย์พี่น้อง: merge หลัง include (แทนที่ค่าที่ include มา)
- include ซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve สัมพันธ์กับไฟล์ที่ include แต่ต้องอยู่ภายในไดเรกทอรีคอนฟิกระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ Absolute/`../` อนุญาตเฉพาะเมื่อยัง resolve อยู่ภายในขอบเขตนั้น พาธต้องไม่มี null byte และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการ resolve
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะเซกชันระดับบนสุดหนึ่งเซกชันที่รองรับด้วย include แบบไฟล์เดียว จะเขียนทะลุไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และคง `openclaw.json` ไว้เหมือนเดิม
- root includes, อาร์เรย์ include และ include ที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะ fail closed แทนที่จะ flatten คอนฟิก
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดการ parse, include แบบวงกลม, รูปแบบพาธไม่ถูกต้อง และความยาวมากเกินไป

---

_เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
