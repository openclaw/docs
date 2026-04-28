---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugins
    - การทำความเข้าใจกฎการค้นหาและการโหลด Plugin
    - การทำงานกับชุด Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugins ของ OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:44:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Plugins ขยายความสามารถของ OpenClaw ด้วยฟีเจอร์ใหม่ ๆ: channels, model providers,
agent harnesses, tools, skills, speech, realtime transcription, realtime
voice, media-understanding, image generation, video generation, web fetch, web
search และอื่น ๆ อีกมากมาย บาง plugins เป็น **core** (มาพร้อมกับ OpenClaw) ส่วนบางตัว
เป็น **external** (เผยแพร่บน npm โดยชุมชน)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ดูว่ามีอะไรถูกโหลดอยู่บ้าง">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
    # จาก npm
    openclaw plugins install @openclaw/voice-call

    # จากไดเรกทอรีหรือไฟล์ archive ในเครื่อง
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="รีสตาร์ต Gateway">
    ```bash
    openclaw gateway restart
    ```

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์ config ของคุณ

  </Step>
</Steps>

หากคุณต้องการควบคุมจากแชตโดยตรง ให้เปิดใช้ `commands.plugins: true` และใช้:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

พาธการติดตั้งใช้ตัวแก้ไขเดียวกับ CLI: local path/archive, แบบ explicit
`clawhub:<pkg>` หรือ bare package spec (ClawHub ก่อน แล้วค่อย fallback ไป npm)

หาก config ไม่ถูกต้อง โดยปกติการติดตั้งจะ fail closed และชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นเดียวในการกู้คืนคือพาธ reinstall แบบแคบสำหรับ bundled-plugin
สำหรับ plugins ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้ง
runtime dependency tree ของ bundled plugin ทุกตัวล่วงหน้าแบบ eager เมื่อ bundled plugin ที่เป็นของ OpenClaw ทำงานอยู่จาก
plugin config, legacy channel config หรือ manifest ที่เปิดใช้โดยค่าเริ่มต้น
การเริ่มต้นระบบจะซ่อมแซมเฉพาะ runtime dependencies ที่ประกาศไว้ของ plugin นั้นก่อน import
persisted channel auth state เพียงอย่างเดียวจะไม่เปิดใช้ bundled channel สำหรับการซ่อมแซม runtime-dependency ตอนเริ่มต้น Gateway
การปิดใช้งานแบบ explicit ยังคงมีผลเหนือกว่า: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` และ `channels.<id>.enabled: false`
จะป้องกันการซ่อมแซม bundled runtime-dependency อัตโนมัติสำหรับ plugin/channel นั้น
`plugins.allow` ที่ไม่ว่างก็ยังจำกัดขอบเขตการซ่อมแซม bundled runtime-dependency แบบเปิดใช้โดยค่าเริ่มต้นด้วย; การเปิดใช้ bundled channel แบบ explicit (`channels.<id>.enabled: true`) ยังสามารถ
ซ่อมแซม dependencies ของ plugin ของ channel นั้นได้
External plugins และ custom load paths ยังคงต้องติดตั้งผ่าน
`openclaw plugins install`

## ประเภทของ Plugin

OpenClaw รู้จัก Plugin สองรูปแบบ:

| รูปแบบ     | วิธีการทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; ทำงานใน-process       | Plugins ทางการ, npm packages จากชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; จับคู่กับฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียดของ bundle

หากคุณกำลังเขียน native plugin ให้เริ่มที่ [Building Plugins](/th/plugins/building-plugins)
และ [Plugin SDK Overview](/th/plugins/sdk-overview)

## Package Entrypoints

แพ็กเกจ npm ของ native plugin ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละรายการต้องอยู่ภายในไดเรกทอรีของแพ็กเกจและ resolve ไปยัง
runtime file ที่อ่านได้ หรือไปยังไฟล์ TypeScript source พร้อม built JavaScript
peer ที่อนุมานได้ เช่น `src/index.ts` ไปยัง `dist/index.js`

ใช้ `openclaw.runtimeExtensions` เมื่อ runtime files ที่เผยแพร่อยู่ไม่ได้อยู่ที่
พาธเดียวกับ source entries เมื่อมีการใช้ `runtimeExtensions` ต้องมี
หนึ่งรายการที่ตรงกันพอดีสำหรับทุก `extensions` entry รายการที่ไม่ตรงกันจะทำให้ install ล้มเหลวและ
plugin discovery ล้มเหลว แทนที่จะ fallback ไปยัง source paths แบบเงียบ ๆ

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

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
  <Accordion title="Model providers (เปิดใช้โดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — การค้นหาหน่วยความจำแบบ bundled (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวแบบติดตั้งเมื่อจำเป็น พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

  </Accordion>

  <Accordion title="Speech providers (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่น ๆ">
    - `browser` — bundled browser plugin สำหรับ browser tool, CLI `openclaw browser`, เมธอด Gateway `browser.request`, browser runtime และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ปิดการใช้งานก่อนแทนที่มัน)
    - `copilot-proxy` — สะพานเชื่อม VS Code Copilot Proxy (ปิดใช้โดยค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา plugins จาก third-party อยู่หรือไม่? ดู [Community Plugins](/th/plugins/community)

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

| ฟิลด์            | คำอธิบาย                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                           |
| `allow`          | allowlist ของ Plugin (ไม่บังคับ)                               |
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny มีผลเหนือกว่า)                     |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`          | ตัวเลือก slot แบบ exclusive (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | สวิตช์และ config ต่อ Plugin                               |

การเปลี่ยน config **ต้องรีสตาร์ต gateway** หาก Gateway กำลังทำงานพร้อม
config watch + in-process restart เปิดใช้อยู่ (พาธ `openclaw gateway` เริ่มต้น)
โดยปกติการรีสตาร์ตนั้นจะเกิดขึ้นโดยอัตโนมัติไม่นานหลังจากเขียน config เสร็จ
ไม่มีพาธ hot-reload ที่รองรับสำหรับ native plugin runtime code หรือ lifecycle
hooks; ให้รีสตาร์ต process ของ Gateway ที่ให้บริการ channel แบบ live ก่อน
จึงจะคาดหวังให้ `register(api)` code, `api.on(...)` hooks, tools, services หรือ
provider/runtime hooks ที่อัปเดตแล้วทำงาน

`openclaw plugins list` คือ snapshot ของ local plugin registry/config ค่า
`enabled` ของ plugin ตรงนั้นหมายความว่า persisted registry และ current config อนุญาตให้
plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า remote Gateway child ที่กำลังทำงานอยู่ได้
รีสตาร์ตเข้าสู่ plugin code เดียวกันแล้ว ในการตั้งค่า VPS/container ที่มี
wrapper processes ให้ส่งการรีสตาร์ตไปยัง process `openclaw gateway run` ตัวจริง
หรือใช้ `openclaw gateway restart` กับ Gateway ที่กำลังทำงานอยู่

<Accordion title="สถานะของ Plugin: disabled vs missing vs invalid">
  - **Disabled**: plugin มีอยู่ แต่กฎการเปิดใช้ปิดมันไว้ Config จะถูกเก็บไว้
  - **Missing**: config อ้างถึง plugin id ที่ discovery หาไม่พบ
  - **Invalid**: plugin มีอยู่ แต่ config ของมันไม่ตรงกับ schema ที่ประกาศไว้

</Accordion>

## Discovery และลำดับความสำคัญ

OpenClaw สแกนหา plugins ตามลำดับนี้ (เจออันแรกใช้อันนั้น):

<Steps>
  <Step title="พาธใน config">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี bundled plugin แบบแพ็กเกจของ OpenClaw เองจะถูกละเว้น;
    ให้รัน `openclaw doctor --fix` เพื่อลบ aliases เก่าที่ค้างอยู่เหล่านั้น
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Bundled plugins">
    มาพร้อมกับ OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (model providers, speech)
    ส่วนตัวอื่นต้องเปิดใช้แบบ explicit
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและ Docker images โดยปกติจะ resolve bundled plugins จาก
compiled tree `dist/extensions` หากมีการ bind-mount ไดเรกทอรี source ของ bundled plugin
ทับพาธ source แบบแพ็กเกจที่ตรงกัน ตัวอย่างเช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรี source ที่ mount นี้
เป็น bundled source overlay และค้นพบมันก่อน bundle แบบแพ็กเกจที่
`/app/dist/extensions/synology-chat` ซึ่งช่วยให้ลูปการทำงานของผู้ดูแลในคอนเทนเนอร์ยังทำงานได้
โดยไม่ต้องสลับ bundled plugin ทุกตัวกลับไปใช้ TypeScript source
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้ packaged dist bundles
แม้จะมี source overlay mounts อยู่

### กฎการเปิดใช้

- `plugins.enabled: false` ปิด plugins ทั้งหมด
- `plugins.deny` มีผลเหนือ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิด plugin นั้น
- plugins ที่มาจาก workspace จะ **ปิดไว้โดยค่าเริ่มต้น** (ต้องเปิดใช้แบบ explicit)
- bundled plugins ทำตามชุดค่าเริ่มต้นที่เปิดอยู่ในตัว เว้นแต่จะมีการ override
- exclusive slots สามารถบังคับเปิด plugin ที่ถูกเลือกสำหรับ slot นั้นได้
- bundled opt-in plugins บางตัวจะถูกเปิดใช้อัตโนมัติเมื่อ config ระบุ
  พื้นผิวที่ plugin เป็นเจ้าของ เช่น provider model ref, channel config หรือ harness
  runtime
- เส้นทาง Codex แบบตระกูล OpenAI ยังคงแยกขอบเขต plugin ออกจากกัน:
  `openai-codex/*` เป็นของ OpenAI plugin ขณะที่ bundled Codex
  app-server plugin จะถูกเลือกด้วย `agentRuntime.id: "codex"` หรือ model refs แบบ legacy
  `codex/*`

## การแก้ปัญหา runtime hooks

หาก plugin ปรากฏใน `plugins list` แต่ side effects หรือ hooks จาก `register(api)`
ไม่ทำงานในทราฟฟิกแชตจริง ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า
  Gateway URL, profile, config path และ process ที่ใช้งานอยู่เป็นตัวเดียวกับที่คุณกำลังแก้ไข
- รีสตาร์ต Gateway ที่ใช้งานจริงหลังการติดตั้ง/กำหนดค่า/แก้ไขโค้ด plugin ใน
  wrapper containers, PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ตหรือส่งสัญญาณไปยัง child
  process `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --json` เพื่อยืนยันการลงทะเบียน hooks และ
  diagnostics conversation hooks ที่ไม่ใช่ bundled เช่น `llm_input`,
  `llm_output`, `before_agent_finalize` และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้เลือกใช้ `before_model_resolve` โดยมันจะทำงานก่อน model
  resolution สำหรับ agent turns; `llm_output` จะทำงานหลังจากที่ความพยายามใช้โมเดล
  สร้าง assistant output แล้วเท่านั้น
- สำหรับหลักฐานของ effective session model ให้ใช้ `openclaw sessions` หรือ
  พื้นผิว Gateway session/status และเมื่อดีบัก provider payloads ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การเป็นเจ้าของ channel หรือ tool ซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่ามี plugin ที่เปิดใช้งานมากกว่าหนึ่งตัวกำลังพยายามเป็นเจ้าของ channel,
setup flow หรือชื่อ tool เดียวกัน สาเหตุที่พบบ่อยที่สุดคือมี external channel plugin
ติดตั้งอยู่ข้าง bundled plugin ที่ตอนนี้ให้ channel id เดียวกันอยู่แล้ว

ขั้นตอนการดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู plugin ทุกตัวที่เปิดใช้งาน
  และต้นทาง
- รัน `openclaw plugins inspect <id> --json` สำหรับ plugin แต่ละตัวที่สงสัย และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  plugin packages เพื่อให้ persisted metadata สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ต Gateway หลังการติดตั้ง การเปลี่ยน registry หรือการเปลี่ยน config

ตัวเลือกในการแก้ไข:

- หาก plugin หนึ่งตั้งใจแทนที่อีกตัวหนึ่งสำหรับ channel id เดียวกัน
  plugin ที่ควรเป็นตัวหลักควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  plugin id ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากการซ้ำกันเกิดขึ้นโดยไม่ได้ตั้งใจ ให้ปิดใช้งานฝั่งใดฝั่งหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือเอาการติดตั้ง plugin เก่าที่ค้างอยู่ออก
- หากคุณเปิดใช้ทั้งสอง plugin อย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานความขัดแย้ง ให้เลือกเจ้าของเพียงตัวเดียวสำหรับ channel หรือตั้งชื่อ
  tools ที่ plugin เป็นเจ้าของใหม่เพื่อให้พื้นผิว runtime ไม่มีความกำกวม

## Plugin slots (หมวดหมู่แบบ exclusive)

บางหมวดหมู่เป็นแบบ exclusive (มีได้เพียงหนึ่งตัวที่ active ในแต่ละครั้ง):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // หรือ "none" เพื่อปิดใช้งาน
      contextEngine: "legacy", // หรือ plugin id
    },
  },
}
```

| Slot            | สิ่งที่ควบคุม      | ค่าเริ่มต้น             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory plugin  | `memory-core`       |
| `contextEngine` | context engine ที่ active | `legacy` (built-in) |

## ข้อมูลอ้างอิง CLI

```bash
openclaw plugins list                       # รายการแบบย่อ
openclaw plugins list --enabled            # เฉพาะ plugins ที่เปิดใช้งาน
openclaw plugins list --verbose            # บรรทัดรายละเอียดต่อ plugin
openclaw plugins list --json               # รายการแบบ machine-readable
openclaw plugins inspect <id>              # รายละเอียดเชิงลึก
openclaw plugins inspect <id> --json       # แบบ machine-readable
openclaw plugins inspect --all             # ตารางทั้งชุด
openclaw plugins info <id>                 # alias ของ inspect
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # ตรวจสอบสถานะ persisted registry
openclaw plugins registry --refresh        # สร้าง persisted registry ใหม่
openclaw doctor --fix                      # ซ่อมแซมสถานะ plugin registry

openclaw plugins install <package>         # ติดตั้ง (ClawHub ก่อน แล้วค่อย npm)
openclaw plugins install clawhub:<pkg>     # ติดตั้งจาก ClawHub เท่านั้น
openclaw plugins install <spec> --force    # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <path>            # ติดตั้งจากพาธในเครื่อง
openclaw plugins install -l <path>         # link (ไม่คัดลอก) สำหรับงานพัฒนา
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # บันทึก npm spec ที่ resolve ได้แบบ exact
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # อัปเดต Plugin เดียว
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # อัปเดตทั้งหมด
openclaw plugins uninstall <id>          # ลบ config และบันทึก plugin index
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

bundled plugins มาพร้อมกับ OpenClaw หลายตัวเปิดใช้งานโดยค่าเริ่มต้น (เช่น
bundled model providers, bundled speech providers และ bundled browser
plugin) ส่วน bundled plugins อื่นยังคงต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ให้ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ npm
plugins ที่ติดตามอยู่ ไม่รองรับร่วมกับ `--link` ซึ่งใช้ source path เดิมซ้ำ
แทนการคัดลอกไปยัง managed install target

เมื่อมีการตั้งค่า `plugins.allow` อยู่แล้ว `openclaw plugins install` จะเพิ่ม
plugin id ที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้งาน หาก plugin id เดียวกัน
อยู่ใน `plugins.deny` การติดตั้งจะลบ deny entry เก่าที่ค้างอยู่นั้นออก เพื่อให้
การติดตั้งแบบ explicit โหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บ persisted local plugin registry ไว้เป็นโมเดลอ่านแบบ cold read สำหรับ
รายการ plugin, ความเป็นเจ้าของ contribution และการวางแผนตอนเริ่มต้น
โฟลว์ install, update, uninstall, enable และ disable จะรีเฟรช registry นั้นหลังจากเปลี่ยนสถานะ plugin
ไฟล์ `plugins/installs.json` เดียวกันยังเก็บ install metadata แบบถาวรไว้ใน
`installRecords` ระดับบนสุด และ manifest metadata ที่สร้างใหม่ได้ไว้ใน `plugins` หาก
registry หายไป เก่า หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จาก install records, นโยบาย config และ
manifest/package metadata โดยไม่โหลด plugin runtime modules
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
npm package spec พร้อม dist-tag หรือ exact version จะ resolve ชื่อ package
กลับไปยัง tracked plugin record และบันทึก spec ใหม่ไว้สำหรับการอัปเดตครั้งต่อไป
การส่งชื่อ package โดยไม่มีเวอร์ชันจะย้าย exact pinned install กลับไปยัง
สาย release เริ่มต้นของ registry หาก npm plugin ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่ resolve ได้
และ identity ของ artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่

`--pin` ใช้ได้เฉพาะกับ npm ไม่รองรับร่วมกับ `--marketplace` เพราะ
การติดตั้งจาก marketplace จะเก็บ marketplace source metadata แทน npm spec

`--dangerously-force-unsafe-install` เป็นตัวเลือก override แบบ break-glass สำหรับ false
positives จาก dangerous-code scanner ในตัว มันอนุญาตให้การติดตั้ง plugin
และการอัปเดต plugin ดำเนินต่อไปได้แม้จะมีผลการค้นหา `critical` จากในตัว แต่ก็ยัง
ไม่ข้าม plugin `before_install` policy blocks หรือการบล็อกจาก scan-failure

flag CLI นี้ใช้กับโฟลว์ install/update ของ plugin เท่านั้น การติดตั้ง dependency ของ Skill ที่ทำผ่าน Gateway
จะใช้ request override `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills ของ ClawHub ที่แยกออกมา

bundles ที่เข้ากันได้จะเข้าร่วมในโฟลว์ plugin list/inspect/enable/disable เดียวกัน
runtime support ปัจจุบันรวมถึง bundle Skills, Claude command-skills,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศใน manifest, Cursor command-skills และ
ไดเรกทอรี Codex hook ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงาน capabilities ของ bundle ที่ตรวจพบ รวมถึง
รายการ MCP และ LSP server ที่รองรับหรือไม่รองรับสำหรับ plugins ที่มี bundle รองรับ

แหล่ง marketplace สามารถเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, local marketplace root หรือ
พาธ `marketplace.json`, รูปแบบย่อ GitHub เช่น `owner/repo`, URL ของ GitHub repo
หรือ git URL สำหรับ remote marketplaces รายการ plugin ต้องอยู่ภายใน
repo ของ marketplace ที่ clone มา และใช้เฉพาะ source แบบ relative path

ดู [`openclaw plugins` CLI reference](/th/cli/plugins) สำหรับรายละเอียดทั้งหมด

## ภาพรวม Plugin API

Native plugins จะ export entry object ที่มี `register(api)` Plugins รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น legacy alias ได้ แต่ plugins ใหม่ควร
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

OpenClaw จะโหลด entry object และเรียก `register(api)` ระหว่างการเปิดใช้งาน plugin
loader ยังคง fallback ไปใช้ `activate(api)` สำหรับ plugins รุ่นเก่า
แต่ bundled plugins และ external plugins ใหม่ควรมอง `register` เป็น public contract

`api.registrationMode` จะบอก plugin ว่าเหตุใด entry ของมันจึงถูกโหลด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งาน runtime ลงทะเบียน tools, hooks, services, commands, routes และ side effects แบบ live อื่น ๆ                              |
| `discovery`     | การค้นพบ capabilities แบบอ่านอย่างเดียว ลงทะเบียน providers และ metadata; trusted plugin entry code อาจถูกโหลด แต่ให้ข้าม side effects แบบ live |
| `setup-only`    | การโหลด metadata ของการตั้งค่า channel ผ่าน lightweight setup entry                                                                |
| `setup-runtime` | การโหลดการตั้งค่า channel ที่ต้องใช้ runtime entry ด้วย                                                                         |
| `cli-metadata`  | การเก็บ metadata ของคำสั่ง CLI เท่านั้น                                                                                            |

Plugin entries ที่เปิด sockets, databases, background workers หรือ
clients อายุยาว ควรป้องกัน side effects เหล่านั้นด้วย `api.registrationMode === "full"`
discovery loads จะถูกแคชแยกจาก activating loads และไม่แทนที่ running Gateway registry
discovery ไม่ใช่ non-activating แบบไม่ import อะไรเลย: OpenClaw อาจประเมิน trusted plugin entry หรือ channel plugin module เพื่อสร้าง
snapshot ควรทำให้ module top levels เบาและไม่มี side effects และย้าย
network clients, subprocesses, listeners, การอ่าน credentials และการเริ่ม service
ไปไว้หลังพาธ full-runtime

เมธอดการลงทะเบียนที่พบบ่อย:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model provider (LLM)        |
| `registerChannel`                       | Chat channel                |
| `registerTool`                          | Agent tool                  |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | Web fetch / scrape provider |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | บริการเบื้องหลัง          |

พฤติกรรมของ hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็นจุดสิ้นสุด; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` ไม่มีผลใด ๆ และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็นจุดสิ้นสุด; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` ไม่มีผลใด ๆ และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นจุดสิ้นสุด; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` ไม่มีผลใด ๆ และไม่ล้าง cancel ก่อนหน้า

การรัน native Codex app-server จะ bridge เหตุการณ์ tool แบบ Codex-native กลับเข้าสู่
พื้นผิว hook นี้ Plugins สามารถบล็อก native Codex tools ผ่าน `before_tool_call`,
สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมในการอนุมัติ `PermissionRequest` ของ Codex
ได้ ขณะนี้ bridge ยังไม่เขียนอาร์กิวเมนต์ของ tool แบบ Codex-native ใหม่ ขอบเขตการรองรับ runtime ของ Codex ที่แน่นอนอยู่ใน
[Codex harness v1 support contract](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม typed hook แบบเต็ม ดู [SDK overview](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [Building plugins](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [Plugin bundles](/th/plugins/bundles) — ความเข้ากันได้ของ bundle แบบ Codex/Claude/Cursor
- [Plugin manifest](/th/plugins/manifest) — schema ของ manifest
- [Registering tools](/th/plugins/building-plugins#registering-agent-tools) — เพิ่ม agent tools ใน Plugin
- [Plugin internals](/th/plugins/architecture) — โมเดล capability และ load pipeline
- [Community plugins](/th/plugins/community) — รายการจาก third-party
