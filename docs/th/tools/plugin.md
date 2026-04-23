---
read_when:
    - การติดตั้งหรือกำหนดค่า plugins
    - การทำความเข้าใจ discovery ของ Plugin และกฎการโหลด
    - การทำงานกับ plugin bundles ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ plugins ของ OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T10:24:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc944b53654552ca5cf6132c6ef16c71745a7bffc249daccaee40c513e04209c
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins ช่วยขยาย OpenClaw ด้วยความสามารถใหม่: channels, model providers,
tools, Skills, speech, realtime transcription, realtime voice,
media-understanding, image generation, video generation, web fetch, web
search และอื่น ๆ บาง Plugin เป็นแบบ **core** (มาพร้อมกับ OpenClaw) ส่วนบางตัว
เป็นแบบ **external** (เผยแพร่บน npm โดยชุมชน)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ดูว่าอะไรถูกโหลดอยู่">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
    # จาก npm
    openclaw plugins install @openclaw/voice-call

    # จากไดเรกทอรีหรือ archive ภายในเครื่อง
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="รีสตาร์ต Gateway">
    ```bash
    openclaw gateway restart
    ```

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์คอนฟิกของคุณ

  </Step>
</Steps>

หากคุณต้องการควบคุมผ่านแชตแบบเนทีฟ ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: path/archive ในเครื่อง, ระบุ
`clawhub:<pkg>` โดยตรง หรือใช้ package spec เปล่า (ClawHub ก่อน แล้ว fallback ไป npm)

หากคอนฟิกไม่ถูกต้อง โดยปกติการติดตั้งจะล้มเหลวแบบปิดและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นเดียวในการกู้คืนคือเส้นทางติดตั้ง bundled-plugin ใหม่แบบแคบ
สำหรับ plugins ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้ง
runtime dependency tree ของ bundled plugin ทุกตัวอย่าง eager เมื่อ bundled Plugin ที่ OpenClaw เป็นเจ้าของถูกเปิดใช้งานจาก
plugin config, legacy channel config หรือ manifest ที่เปิดใช้งานโดยค่าเริ่มต้น
การเริ่มต้นระบบจะซ่อมเฉพาะ runtime dependencies ที่ plugin นั้นประกาศไว้ก่อน import เท่านั้น
ส่วน external plugins และ custom load paths ยังคงต้องติดตั้งผ่าน
`openclaw plugins install`

## ประเภทของ Plugin

OpenClaw รู้จัก Plugin อยู่สองรูปแบบ:

| Format     | วิธีการทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; รันใน process เดียวกัน       | plugins ทางการ, แพ็กเกจ npm จากชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; ถูกแมปเป็นฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงใน `openclaw plugins list` ดูรายละเอียด bundle ได้ที่ [Plugin Bundles](/th/plugins/bundles)

หากคุณกำลังเขียน native plugin ให้เริ่มที่ [Building Plugins](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Plugins ทางการ

### ติดตั้งได้ (npm)

| Plugin          | Package                | เอกสาร                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/th/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/th/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/th/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/th/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/th/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/th/plugins/zalouser)   |

### Core (มาพร้อมกับ OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้โดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — memory search แบบ bundled (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวแบบติดตั้งเมื่อจำเป็น พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="ผู้ให้บริการ speech (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่น ๆ">
    - `browser` — bundled browser plugin สำหรับ browser tool, CLI `openclaw browser`, gateway method `browser.request`, browser runtime และ browser control service เริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ปิดก่อนหากจะนำตัวอื่นมาแทน)
    - `copilot-proxy` — สะพานเชื่อม VS Code Copilot Proxy (ปิดโดยค่าเริ่มต้น)
  </Accordion>
</AccordionGroup>

กำลังมองหา third-party plugins อยู่หรือไม่ ดู [Community Plugins](/th/plugins/community)

## การกำหนดค่า

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | คำอธิบาย                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                           |
| `allow`          | allowlist ของ Plugin (ไม่บังคับ)                               |
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny มีผลเหนือกว่า)                     |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`          | ตัวเลือก slot แบบ exclusive (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | สวิตช์ต่อ Plugin + คอนฟิก                               |

การเปลี่ยนคอนฟิก **ต้องรีสตาร์ต gateway** หาก Gateway กำลังทำงานพร้อม config
watch + in-process restart (ซึ่งเป็นค่าเริ่มต้นของเส้นทาง `openclaw gateway`)
โดยปกติการรีสตาร์ตนั้นจะเกิดขึ้นโดยอัตโนมัติไม่นานหลังจากเขียนคอนฟิกเสร็จ

<Accordion title="สถานะของ Plugin: disabled vs missing vs invalid">
  - **Disabled**: มี plugin อยู่ แต่กฎการเปิดใช้ทำให้มันถูกปิด คอนฟิกยังคงถูกเก็บไว้
  - **Missing**: คอนฟิกอ้างถึง plugin id ที่ discovery หาไม่เจอ
  - **Invalid**: มี plugin อยู่ แต่คอนฟิกไม่ตรงกับ schema ที่ประกาศไว้
</Accordion>

## Discovery และลำดับความสำคัญ

OpenClaw สแกนหา plugins ตามลำดับนี้ (ตัวแรกที่ตรงจะชนะ):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — paths ของไฟล์หรือไดเรกทอรีที่ระบุชัดเจน
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Bundled plugins">
    มาพร้อมกับ OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (model providers, speech)
    ส่วนตัวอื่นต้องเปิดใช้แบบชัดเจน
  </Step>
</Steps>

### กฎการเปิดใช้

- `plugins.enabled: false` ปิด plugins ทั้งหมด
- `plugins.deny` มีผลเหนือกว่า `allow` เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิด plugin นั้น
- plugins ที่มาจาก workspace จะ **ปิดโดยค่าเริ่มต้น** (ต้องเปิดใช้อย่างชัดเจน)
- bundled plugins เป็นไปตามชุด default-on ที่มีมาให้ เว้นแต่จะมีการ override
- exclusive slots สามารถบังคับเปิด plugin ที่ถูกเลือกสำหรับ slot นั้นได้

## slots ของ Plugin (หมวดหมู่แบบ exclusive)

บางหมวดหมู่เป็นแบบ exclusive (มีตัวที่ทำงานได้เพียงตัวเดียวในเวลาเดียวกัน):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // หรือ "none" เพื่อปิด
      contextEngine: "legacy", // หรือ plugin id
    },
  },
}
```

| Slot            | ควบคุมอะไร      | ค่าเริ่มต้น             |
| --------------- | --------------------- | ------------------- |
| `memory`        | memory plugin ที่ใช้งานอยู่  | `memory-core`       |
| `contextEngine` | context engine ที่ใช้งานอยู่ | `legacy` (built-in) |

## เอกสารอ้างอิง CLI

```bash
openclaw plugins list                       # รายการแบบย่อ
openclaw plugins list --enabled            # เฉพาะ plugins ที่ถูกโหลด
openclaw plugins list --verbose            # บรรทัดรายละเอียดต่อ plugin
openclaw plugins list --json               # รายการแบบ machine-readable
openclaw plugins inspect <id>              # รายละเอียดเชิงลึก
openclaw plugins inspect <id> --json       # แบบ machine-readable
openclaw plugins inspect --all             # ตารางทั้งระบบ
openclaw plugins info <id>                 # alias ของ inspect
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # ติดตั้ง (ClawHub ก่อน แล้ว npm)
openclaw plugins install clawhub:<pkg>     # ติดตั้งจาก ClawHub เท่านั้น
openclaw plugins install <spec> --force    # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <path>            # ติดตั้งจาก path ในเครื่อง
openclaw plugins install -l <path>         # ลิงก์ (ไม่คัดลอก) สำหรับ dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # บันทึก npm spec ที่ resolve แบบตรงตัว
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # อัปเดต plugin เดียว
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # อัปเดตทั้งหมด
openclaw plugins uninstall <id>          # ลบคอนฟิก/ระเบียนการติดตั้ง
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

bundled plugins มาพร้อมกับ OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (เช่น
bundled model providers, bundled speech providers และ bundled browser
plugin) ส่วน bundled plugins ตัวอื่นยังคงต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ installed plugin หรือ hook pack ที่มีอยู่ในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ tracked npm
plugins โดยไม่รองรับร่วมกับ `--link` ซึ่งจะใช้ source path เดิมซ้ำ
แทนการคัดลอกไปยัง managed install target

`openclaw plugins update <id-or-npm-spec>` ใช้กับ tracked installs การส่ง
npm package spec ที่มี dist-tag หรือเวอร์ชันแบบตรงตัวจะ resolve ชื่อแพ็กเกจ
กลับไปยัง tracked plugin record และบันทึก spec ใหม่ไว้สำหรับการอัปเดตในอนาคต
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้าย exact pinned install กลับไปสู่
release line เริ่มต้นของ registry หาก installed npm plugin ตรงกับเวอร์ชันที่ resolve แล้ว
และ identity ของ artifact ที่บันทึกไว้ OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียนคอนฟิกซ้ำ

`--pin` ใช้ได้กับ npm เท่านั้น และไม่รองรับร่วมกับ `--marketplace` เพราะ
การติดตั้งผ่าน marketplace จะเก็บ metadata ของแหล่ง marketplace แทน npm spec

`--dangerously-force-unsafe-install` คือ override แบบ break-glass สำหรับ false
positives จาก dangerous-code scanner ที่มีมาในระบบ มันอนุญาตให้การติดตั้ง plugin
และการอัปเดต plugin ดำเนินต่อไปแม้มีผลการตรวจพบระดับ `critical` จากระบบ แต่ยังคง
ไม่ข้ามการบล็อกจากนโยบาย `before_install` ของ plugin หรือการบล็อกจาก scan-failure

แฟล็ก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต plugin เท่านั้น การติดตั้ง dependency ของ Skills ที่รองรับผ่าน Gateway
จะใช้ request override `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน ส่วน `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub แยกต่างหาก

bundle ที่เข้ากันได้จะเข้าร่วมในโฟลว์ list/inspect/enable/disable ของ plugin เดียวกัน
ปัจจุบันรองรับ runtime ของ bundle skills, Claude command-skills,
ค่าเริ่มต้นจาก Claude `settings.json`, ค่าเริ่มต้นจาก Claude `.lsp.json` และ
`lspServers` ที่ประกาศใน manifest, Cursor command-skills และไดเรกทอรี hook ของ Codex
ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงาน bundle capabilities ที่ตรวจพบ พร้อมทั้ง
รายการ MCP และ LSP server entries ที่รองรับหรือไม่รองรับสำหรับ bundle-backed plugins

แหล่ง marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ในเครื่องหรือ path ของ
`marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL ของ GitHub repo
หรือ git URL สำหรับ remote marketplaces รายการ plugin ต้องอยู่ภายใน
repo ของ marketplace ที่ถูก clone และใช้เฉพาะแหล่งที่มาแบบ relative path เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [เอกสารอ้างอิง CLI ของ `openclaw plugins`](/th/cli/plugins)

## ภาพรวม Plugin API

native plugins จะ export entry object ที่เปิดเผย `register(api)` ส่วน plugins
รุ่นเก่าอาจยังใช้ `activate(api)` เป็น alias แบบ legacy ได้ แต่ plugins ใหม่ควร
ใช้ `register`

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw จะโหลด entry object และเรียก `register(api)` ระหว่างการ
เปิดใช้งาน plugin loader ยังคง fallback ไปใช้ `activate(api)` สำหรับ plugins รุ่นเก่า
แต่ bundled plugins และ external plugins ใหม่ควรมองว่า `register` คือสัญญาสาธารณะ

วิธีการลงทะเบียนที่ใช้บ่อย:

| Method                                  | สิ่งที่มันลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)        |
| `registerChannel`                       | ช่องแชต                |
| `registerTool`                          | tool ของเอเจนต์                  |
| `registerHook` / `on(...)`              | lifecycle hooks             |
| `registerSpeechProvider`                | text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีม               |
| `registerRealtimeVoiceProvider`         | เสียงเรียลไทม์แบบสองทาง       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | context engine              |
| `registerService`                       | background service          |

พฤติกรรมของ hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็นคำตัดสินสุดท้าย; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` ไม่ทำอะไร และไม่ยกเลิก block ก่อนหน้า
- `before_install`: `{ block: true }` เป็นคำตัดสินสุดท้าย; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` ไม่ทำอะไร และไม่ยกเลิก block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นคำตัดสินสุดท้าย; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` ไม่ทำอะไร และไม่ยกเลิก cancel ก่อนหน้า

สำหรับพฤติกรรมเต็มของ typed hook ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [Building Plugins](/th/plugins/building-plugins) — สร้าง plugin ของคุณเอง
- [Plugin Bundles](/th/plugins/bundles) — ความเข้ากันได้ของ bundle สำหรับ Codex/Claude/Cursor
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest
- [Registering Tools](/th/plugins/building-plugins#registering-agent-tools) — เพิ่ม tools ของเอเจนต์ใน plugin
- [Plugin Internals](/th/plugins/architecture) — โมเดล capability และไปป์ไลน์การโหลด
- [Community Plugins](/th/plugins/community) — รายการ third-party
