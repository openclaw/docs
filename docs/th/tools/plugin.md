---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugins
    - การทำความเข้าใจกฎการค้นหาและการโหลด Plugin
    - การทำงานกับชุดรวม Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugins ของ OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T14:01:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Plugins ช่วยขยายความสามารถของ OpenClaw ด้วยฟีเจอร์ใหม่ๆ เช่น ช่องทาง ผู้ให้บริการโมเดล
Agent harnesses เครื่องมือ Skills เสียงพูด การถอดเสียงแบบเรียลไทม์ เสียงแบบเรียลไทม์
การทำความเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ การดึงข้อมูลเว็บ การค้นหาเว็บ
และอื่นๆ อีกมากมาย Plugin บางตัวเป็น **core** (มาพร้อมกับ OpenClaw) ขณะที่บางตัว
เป็น **external** (เผยแพร่บน npm โดยชุมชน)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ดูว่ามีอะไรโหลดอยู่บ้าง">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
    # จาก npm
    openclaw plugins install @openclaw/voice-call

    # จากไดเรกทอรีในเครื่องหรือไฟล์ archive
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

หากคุณต้องการควบคุมผ่านแชตโดยตรง ให้เปิด `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

เส้นทางการติดตั้งใช้ตัว resolver เดียวกับ CLI: local path/archive, ค่า
`clawhub:<pkg>` แบบ explicit หรือ package spec แบบเปล่า (ค้นหาใน ClawHub ก่อน แล้ว fallback ไป npm)

หาก config ไม่ถูกต้อง โดยปกติการติดตั้งจะล้มเหลวแบบ fail-closed และชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นด้านการกู้คืนมีเพียงเส้นทางการติดตั้งใหม่ของ bundled-plugin แบบจำกัด
สำหรับ Plugins ที่เลือกเปิดใช้
`openclaw.install.allowInvalidConfigRecovery`

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้งต้นไม้ dependency ของ runtime ของทุก bundled plugin
แบบ eager เมื่อ bundled plugin ที่ OpenClaw เป็นเจ้าของเปิดใช้งานจาก
plugin config, legacy channel config หรือ manifest ที่เปิดใช้โดยค่าเริ่มต้น ตอนเริ่มระบบ
จะซ่อมแซมเฉพาะ dependency ของ runtime ที่ประกาศไว้ของ Plugin นั้นก่อน import เท่านั้น
การปิดใช้งานแบบ explicit ยังคงมีผลเหนือกว่า: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` และ `channels.<id>.enabled: false`
จะป้องกันการซ่อมแซม dependency ของ bundled runtime แบบอัตโนมัติสำหรับ Plugin/ช่องทางนั้น
External plugins และ custom load paths ยังคงต้องติดตั้งผ่าน
`openclaw plugins install`

## ประเภทของ Plugin

OpenClaw รู้จัก Plugin อยู่สองรูปแบบ:

| รูปแบบ     | วิธีทำงาน                                                           | ตัวอย่าง                                                |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + โมดูล runtime; ทำงานในโปรเซสเดียวกัน       | Plugins ทางการ, แพ็กเกจ npm จากชุมชน                  |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปไปยังฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองรูปแบบจะแสดงภายใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียดของ bundle

หากคุณกำลังเขียน Native Plugin ให้เริ่มจาก [Building Plugins](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Plugins ทางการ

### ติดตั้งได้ (npm)

| Plugin          | แพ็กเกจ                | เอกสาร                                |
| --------------- | ---------------------- | ------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/th/channels/matrix)            |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/th/channels/msteams)  |
| Nostr           | `@openclaw/nostr`      | [Nostr](/th/channels/nostr)              |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/th/plugins/voice-call)     |
| Zalo            | `@openclaw/zalo`       | [Zalo](/th/channels/zalo)                |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/th/plugins/zalouser)    |

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
    - `memory-core` — การค้นหา memory แบบ bundled (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวแบบ install-on-demand พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` — bundled browser plugin สำหรับ browser tool, CLI `openclaw browser`, เมธอด gateway `browser.request`, browser runtime และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ปิดก่อนหากต้องการแทนที่)
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

| ฟิลด์            | คำอธิบาย                                                   |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                           |
| `allow`          | allowlist ของ Plugin (ไม่บังคับ)                           |
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny มีผลเหนือกว่า)        |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                             |
| `slots`          | ตัวเลือก slot แบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | สวิตช์และ config แบบต่อ Plugin                            |

การเปลี่ยน config **ต้องรีสตาร์ต gateway** หาก Gateway ทำงานพร้อม config
watch + in-process restart (เส้นทาง `openclaw gateway` เริ่มต้น) โดยปกติการ
รีสตาร์ตนั้นจะเกิดขึ้นอัตโนมัติไม่นานหลังจากเขียน config เสร็จ
ไม่มีเส้นทาง hot-reload ที่รองรับสำหรับโค้ด runtime ของ Native Plugin หรือ lifecycle
hooks; ให้รีสตาร์ตโปรเซส Gateway ที่ให้บริการช่องทางจริงก่อน
จึงจะคาดหวังให้โค้ด `register(api)` ที่อัปเดตแล้ว, hooks ของ `api.on(...)`, tools, services หรือ
provider/runtime hooks เริ่มทำงาน

`openclaw plugins list` เป็น snapshot ของ CLI/config ในเครื่อง Plugin สถานะ `loaded`
ตรงนั้นหมายความว่าสามารถค้นพบและโหลด Plugin ได้จาก config/ไฟล์ที่ CLI
invocation นั้นมองเห็นได้ แต่ไม่ได้พิสูจน์ว่า child ของ remote Gateway ที่กำลังรันอยู่
ได้รีสตาร์ตเข้าสู่โค้ด Plugin เดียวกันแล้ว สำหรับการตั้งค่าบน VPS/container ที่มี wrapper
processes ให้ส่งคำสั่งรีสตาร์ตไปยังโปรเซส `openclaw gateway run` ตัวจริง หรือใช้
`openclaw gateway restart` กับ Gateway ที่กำลังรันอยู่

<Accordion title="สถานะของ Plugin: ปิดใช้งาน เทียบกับ ไม่พบ เทียบกับ ไม่ถูกต้อง">
  - **ปิดใช้งาน**: มี Plugin อยู่ แต่กฎการเปิดใช้งานปิดมันไว้ Config ยังคงถูกเก็บไว้
  - **ไม่พบ**: Config อ้างอิง plugin id ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: มี Plugin อยู่ แต่ config ของมันไม่ตรงกับ schema ที่ประกาศไว้
</Accordion>

## การค้นหาและลำดับความสำคัญ

OpenClaw จะสแกนหา Plugins ตามลำดับนี้ (ตรงกันครั้งแรกมีผล):

<Steps>
  <Step title="พาธใน config">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีแบบ explicit
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Bundled plugins">
    มาพร้อมกับ OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    ตัวอื่นต้องเปิดใช้งานแบบ explicit
  </Step>
</Steps>

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิด Plugins ทั้งหมด
- `plugins.deny` มีผลเหนือกว่า allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิด Plugin นั้น
- Plugins ที่มาจาก workspace จะ **ปิดใช้งานโดยค่าเริ่มต้น** (ต้องเปิดแบบ explicit)
- Bundled plugins ทำงานตามชุดที่เปิดใช้โดยค่าเริ่มต้นในตัว เว้นแต่มีการ override
- Exclusive slots อาจบังคับเปิด Plugin ที่ถูกเลือกสำหรับ slot นั้น
- bundled opt-in plugins บางตัวจะเปิดอัตโนมัติเมื่อ config ระบุ
  พื้นผิวที่ Plugin เป็นเจ้าของ เช่น provider model ref, channel config หรือ harness
  runtime
- เส้นทาง Codex ในตระกูล OpenAI ยังคงมีขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ขณะที่ bundled Codex
  app-server plugin ถูกเลือกโดย `embeddedHarness.runtime: "codex"` หรือการอ้างอิงโมเดล `codex/*` แบบเดิม

## การแก้ไขปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ side effects หรือ hooks ของ `register(api)`
ไม่ทำงานกับทราฟฟิกแชตจริง ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า
  URL, profile, พาธ config และโปรเซสของ Gateway ที่ใช้งานอยู่คือสิ่งที่คุณกำลังแก้ไข
- รีสตาร์ต Gateway ที่ให้บริการจริงหลังจากติดตั้ง/กำหนดค่า/แก้โค้ด Plugin ใน wrapper
  containers, PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ตหรือส่งสัญญาณไปยัง child
  process `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --json` เพื่อยืนยันการลงทะเบียน hooks และ
  diagnostics conversation hooks ที่ไม่ใช่ bundled เช่น `llm_input`,
  `llm_output` และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้ใช้ `before_model_resolve` เป็นหลัก มันจะทำงานก่อน model
  resolution สำหรับ agent turns; `llm_output` จะทำงานหลังจากที่ความพยายามใช้โมเดล
  ให้เอาต์พุต assistant แล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผลจริง ให้ใช้ `openclaw sessions` หรือพื้นผิว session/status ของ Gateway และเมื่อดีบัก payload ของผู้ให้บริการ ให้เริ่ม Gateway ด้วย `--raw-stream --raw-stream-path <path>`

## Plugin slots (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (เปิดใช้งานได้ครั้งละหนึ่งตัวเท่านั้น):

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

| Slot            | สิ่งที่ควบคุม              | ค่าเริ่มต้น          |
| --------------- | -------------------------- | -------------------- |
| `memory`        | Active Memory plugin       | `memory-core`        |
| `contextEngine` | Active context engine      | `legacy` (built-in)  |

## เอกสารอ้างอิง CLI

```bash
openclaw plugins list                       # สินค้าคงคลังแบบย่อ
openclaw plugins list --enabled            # เฉพาะ Plugins ที่โหลดอยู่
openclaw plugins list --verbose            # บรรทัดรายละเอียดต่อ Plugin
openclaw plugins list --json               # สินค้าคงคลังแบบอ่านได้ด้วยเครื่อง
openclaw plugins inspect <id>              # รายละเอียดเชิงลึก
openclaw plugins inspect <id> --json       # แบบอ่านได้ด้วยเครื่อง
openclaw plugins inspect --all             # ตารางทั้งชุด
openclaw plugins info <id>                 # ชื่อแทนของ inspect
openclaw plugins doctor                    # การวินิจฉัย

openclaw plugins install <package>         # ติดตั้ง (ClawHub ก่อน แล้วค่อย npm)
openclaw plugins install clawhub:<pkg>     # ติดตั้งจาก ClawHub เท่านั้น
openclaw plugins install <spec> --force    # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <path>            # ติดตั้งจากพาธในเครื่อง
openclaw plugins install -l <path>         # ลิงก์ (ไม่คัดลอก) สำหรับการพัฒนา
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # บันทึก npm spec ที่ resolve แบบตรงตัว
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # อัปเดต Plugin หนึ่งตัว
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # อัปเดตทั้งหมด
openclaw plugins uninstall <id>          # ลบบันทึก config/การติดตั้ง
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled plugins มาพร้อมกับ OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (เช่น
bundled model providers, bundled speech providers และ bundled browser
plugin) bundled plugins อื่นๆ ยังคงต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ npm
plugins ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งจะใช้พาธต้นทางเดิม
แทนการคัดลอกไปยังตำแหน่งติดตั้งที่ถูกจัดการ

เมื่อมีการตั้งค่า `plugins.allow` อยู่แล้ว `openclaw plugins install` จะเพิ่ม
plugin id ที่ติดตั้งเข้าไปใน allowlist นั้นก่อนเปิดใช้งาน เพื่อให้สามารถโหลดได้ทันทีหลังรีสตาร์ต

`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ หากส่ง
npm package spec ที่มี dist-tag หรือเวอร์ชันแบบตรงตัว ระบบจะ resolve ชื่อแพ็กเกจ
กลับไปยังบันทึก Plugin ที่ติดตามอยู่ และบันทึก spec ใหม่ไว้สำหรับการอัปเดตครั้งถัดไป
หากส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชัน ระบบจะย้ายการติดตั้งแบบ pin ตรงตัวกลับไปยัง
สายรีลีสเริ่มต้นของ registry หาก npm plugin ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่ resolve แล้ว
และ identity ของ artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด
ติดตั้งใหม่ หรือเขียน config ใหม่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะ
การติดตั้งจาก marketplace จะบันทึก metadata ของแหล่ง marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็นตัว override แบบ break-glass สำหรับกรณี
false positive จาก dangerous-code scanner ที่มาพร้อมระบบ ช่วยให้การติดตั้ง Plugin
และการอัปเดต Plugin ดำเนินต่อได้แม้จะพบผลลัพธ์ระดับ `critical` จากตัวสแกนในตัว แต่ยังคง
ไม่ข้ามการบล็อกจากนโยบาย `before_install` ของ Plugin หรือการบล็อกจากการสแกนล้มเหลว

แฟลก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ skill ที่ขับเคลื่อนด้วย Gateway
จะใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` แทน ขณะที่ `openclaw skills install`
ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub ที่แยกต่างหาก

Bundles ที่เข้ากันได้จะเข้าร่วมในโฟลว์ list/inspect/enable/disable ของ Plugin แบบเดียวกัน
การรองรับ runtime ในปัจจุบันรวมถึง bundle Skills, Claude command-skills,
ค่าเริ่มต้นของ Claude `settings.json`, ค่าเริ่มต้นของ Claude `.lsp.json` และ `lspServers` ที่ประกาศใน manifest,
Cursor command-skills และไดเรกทอรี hook ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงาน capability ของ bundle ที่ตรวจพบ พร้อมทั้งรายการ MCP และ LSP server
ที่รองรับหรือไม่รองรับสำหรับ Plugins ที่ขับเคลื่อนด้วย bundle

แหล่ง marketplace สามารถเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, รากของ marketplace ในเครื่องหรือพาธ `marketplace.json`,
รูปแบบย่อของ GitHub เช่น `owner/repo`, URL ของ GitHub repo หรือ git URL ก็ได้
สำหรับ marketplaces แบบระยะไกล รายการ Plugin ต้องอยู่ภายใน repo ของ marketplace ที่ clone มา
และใช้เฉพาะแหล่งที่มาแบบพาธ relative เท่านั้น

ดู [`openclaw plugins` CLI reference](/th/cli/plugins) สำหรับรายละเอียดทั้งหมด

## ภาพรวม Plugin API

Native plugins ส่งออก entry object ที่เปิดเผย `register(api)` Plugins รุ่นเก่า
อาจยังใช้ `activate(api)` เป็นชื่อแทนแบบเดิมได้ แต่ Plugins ใหม่ควร
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

OpenClaw จะโหลด entry object และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin
loader ยังคง fallback ไปใช้ `activate(api)` สำหรับ Plugins เก่า
แต่ bundled plugins และ external plugins ใหม่ควรมอง `register` ว่าเป็นสัญญาสาธารณะ

`api.registrationMode` จะบอก Plugin ว่าเหตุใด entry ของมันจึงถูกโหลด:

| โหมด            | ความหมาย                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งาน runtime ลงทะเบียน tools, hooks, services, commands, routes และ side effects สำหรับการทำงานจริงอื่นๆ             |
| `discovery`     | การค้นหา capability แบบอ่านอย่างเดียว ลงทะเบียน providers และ metadata; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจถูกโหลด แต่ให้ข้าม side effects สำหรับการทำงานจริง |
| `setup-only`    | การโหลด metadata สำหรับการตั้งค่าช่องทางผ่าน setup entry แบบเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่าช่องทางที่ต้องใช้ runtime entry ด้วย                                                                          |
| `cli-metadata`  | เก็บเฉพาะ metadata ของคำสั่ง CLI                                                                                                |

Plugin entries ที่เปิด sockets, ฐานข้อมูล, background workers หรือ
clients แบบอายุยาว ควรป้องกัน side effects เหล่านั้นด้วย `api.registrationMode === "full"`
การโหลดแบบ discovery จะถูกแคชแยกจากการโหลดเพื่อเปิดใช้งาน และจะไม่แทนที่ registry
ของ Gateway ที่กำลังรันอยู่ discovery ไม่ได้หมายถึงไม่ import:
OpenClaw อาจประเมิน trusted plugin entry หรือโมดูล channel plugin เพื่อสร้าง
snapshot ให้คง top level ของโมดูลให้เบาและไม่มี side effect และย้าย
network clients, subprocesses, listeners, การอ่าน credential และการเริ่มบริการ
ไปไว้หลังเส้นทาง full-runtime

เมธอดการลงทะเบียนที่ใช้บ่อย:

| เมธอด                                  | สิ่งที่ลงทะเบียน              |
| -------------------------------------- | ----------------------------- |
| `registerProvider`                     | ผู้ให้บริการโมเดล (LLM)       |
| `registerChannel`                      | ช่องทางแชต                    |
| `registerTool`                         | เครื่องมือ Agent              |
| `registerHook` / `on(...)`             | Lifecycle hooks               |
| `registerSpeechProvider`               | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีมมิง              |
| `registerRealtimeVoiceProvider`        | เสียงแบบเรียลไทม์สองทิศทาง    |
| `registerMediaUnderstandingProvider`   | การวิเคราะห์ภาพ/เสียง         |
| `registerImageGenerationProvider`      | การสร้างภาพ                   |
| `registerMusicGenerationProvider`      | การสร้างเพลง                  |
| `registerVideoGenerationProvider`      | การสร้างวิดีโอ                |
| `registerWebFetchProvider`             | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider`            | การค้นหาเว็บ                  |
| `registerHttpRoute`                    | HTTP endpoint                 |
| `registerCommand` / `registerCli`      | คำสั่ง CLI                    |
| `registerContextEngine`                | Context engine                |
| `registerService`                      | บริการเบื้องหลัง              |

พฤติกรรมของ hook guard สำหรับ lifecycle hooks แบบมี type:

- `before_tool_call`: `{ block: true }` เป็นการตัดสินสุดท้าย; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` ไม่มีผลและจะไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็นการตัดสินสุดท้าย; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` ไม่มีผลและจะไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นการตัดสินสุดท้าย; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` ไม่มีผลและจะไม่ล้าง cancel ก่อนหน้า

การรัน Native Codex app-server จะเชื่อมเหตุการณ์เครื่องมือแบบเนทีฟของ Codex กลับมายัง
พื้นผิว hook นี้ Plugins สามารถบล็อกเครื่องมือเนทีฟของ Codex ผ่าน `before_tool_call`
สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมในการอนุมัติ
`PermissionRequest` ของ Codex ได้ สะพานเชื่อมนี้ยังไม่เขียนอาร์กิวเมนต์ของเครื่องมือเนทีฟ Codex ใหม่
ขอบเขตการรองรับ Codex runtime ที่แน่นอนอยู่ใน
[Codex harness v1 support contract](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม hook แบบมี type ฉบับเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [Building plugins](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [Plugin bundles](/th/plugins/bundles) — ความเข้ากันได้ของ bundle สำหรับ Codex/Claude/Cursor
- [Plugin manifest](/th/plugins/manifest) — schema ของ manifest
- [Registering tools](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือ Agent ใน Plugin
- [Plugin internals](/th/plugins/architecture) — โมเดล capability และไปป์ไลน์การโหลด
- [Community plugins](/th/plugins/community) — รายการจากบุคคลที่สาม
