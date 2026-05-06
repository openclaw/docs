---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจกฎการค้นพบและการโหลด Plugin
    - การทำงานกับชุด Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-06T10:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3000dbd6dd660f4dbab9a25c476e4c4e3fba0a9781ae344ea3cc147598d0b0
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
agent harness, เครื่องมือ, Skills, เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์,
การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ
และอื่น ๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ OpenClaw) ส่วนบางตัว
เป็น **external** Plugin ภายนอกส่วนใหญ่ถูกเผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) Npm ยังคงรองรับสำหรับการติดตั้งโดยตรงและสำหรับ
ชุดชั่วคราวของแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของระหว่างที่การย้ายนี้เสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการคัดลอกแล้ววางเพื่อติดตั้ง แสดงรายการ ถอนการติดตั้ง อัปเดต และเผยแพร่ โปรดดู
[จัดการ Plugin](/th/plugins/manage-plugins)

<Steps>
  <Step title="ดูว่ามีอะไรถูกโหลดอยู่">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
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

  <Step title="การจัดการแบบเนทีฟในแชต">
    ใน Gateway ที่กำลังทำงาน คำสั่งสำหรับเจ้าของเท่านั้น `/plugins enable` และ `/plugins disable`
    จะเรียกตัวโหลด config ใหม่ของ Gateway Gateway จะโหลดพื้นผิว runtime ของ Plugin
    ใหม่ในกระบวนการ และรอบการทำงานใหม่ของ agent จะสร้างรายการเครื่องมือใหม่จาก
    registry ที่รีเฟรชแล้ว `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น
    Gateway จะร้องขอการรีสตาร์ตแทนการแสร้งว่ากระบวนการปัจจุบันสามารถ
    โหลดโมดูลที่ถูก import แล้วใหม่ได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องการพิสูจน์เครื่องมือ บริการ เมธอด Gateway
    hook หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของซึ่งถูกลงทะเบียนแล้ว `inspect` ธรรมดาเป็นการตรวจสอบ
    manifest/registry แบบ cold และจงใจหลีกเลี่ยงการ import runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการการควบคุมแบบเนทีฟในแชต ให้เปิดใช้ `commands.plugins: true` และใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: local path/archive, `clawhub:<pkg>` แบบ explicit,
`npm:<pkg>` แบบ explicit, `npm-pack:<path.tgz>` แบบ explicit,
`git:<repo>` แบบ explicit หรือ bare package spec ผ่าน npm

หาก config ไม่ถูกต้อง โดยปกติการติดตั้งจะ fail closed และชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นเดียวสำหรับการกู้คืนคือเส้นทางติดตั้งซ้ำแบบจำกัดสำหรับ bundled-plugin
ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config ที่ไม่ถูกต้องอื่น ๆ
รัน `openclaw doctor --fix` เพื่อกักกัน config ของ Plugin ที่เสียโดย
ปิดใช้งานรายการ Plugin นั้นและลบ payload config ที่ไม่ถูกต้องออก ส่วน backup config ปกติจะเก็บค่าก่อนหน้าไว้
เมื่อ config ของช่องทางอ้างถึง Plugin ที่ไม่สามารถค้นพบได้อีกต่อไป แต่
id ของ Plugin เก่าตัวเดิมยังอยู่ใน config ของ Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนการบล็อกช่องทางอื่นทั้งหมด
รัน `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin เก่า รายการ
channel key ที่ไม่รู้จักโดยไม่มีหลักฐาน stale-plugin จะยังคง fail validation เพื่อให้ typo
ยังมองเห็นได้
หากตั้งค่า `plugins.enabled: false` ไว้ การอ้างอิง Plugin เก่าจะถูกถือว่า inert:
การเริ่มต้น Gateway จะข้ามงานค้นหา/โหลด Plugin และ `openclaw doctor` จะเก็บ
config ของ Plugin ที่ถูกปิดใช้งานไว้แทนการลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
รันการ cleanup ของ doctor หากคุณต้องการลบ id ของ Plugin เก่า

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่าง flow การ install/update หรือ
doctor repair แบบ explicit เท่านั้น การเริ่มต้น Gateway การโหลด config ใหม่ และ runtime inspection
จะไม่รัน package manager หรือซ่อม dependency tree Plugin ในเครื่องต้อง
ติดตั้ง dependency ไว้แล้ว ส่วน Plugin จาก npm, git และ ClawHub จะ
ติดตั้งภายใต้ managed plugin roots ของ OpenClaw dependency ของ npm อาจถูก hoist
ภายใน managed npm root ของ OpenClaw; install/update จะสแกน managed root นั้นก่อน
trust และ uninstall จะลบแพ็กเกจที่ npm จัดการผ่าน npm Plugin ภายนอก
และ custom load path ยังคงต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบ static สำหรับแต่ละ
Plugin ที่มองเห็นได้โดยไม่ import runtime code หรือซ่อม dependency
ดู [การแก้ dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ
lifecycle ตอนติดตั้ง

### ความเป็นเจ้าของ path ของ Plugin ที่ถูกบล็อก

หากการวินิจฉัย Plugin แจ้งว่า
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
และการตรวจสอบ config ตามด้วย `plugin present but blocked` แสดงว่า OpenClaw พบ
ไฟล์ Plugin ที่เป็นของผู้ใช้ Unix คนละรายกับกระบวนการที่กำลังโหลดไฟล์เหล่านั้น
เก็บ config ของ Plugin ไว้; แก้ความเป็นเจ้าของ filesystem หรือรัน
OpenClaw เป็นผู้ใช้เดียวกับที่เป็นเจ้าของ state directory

สำหรับการติดตั้ง Docker image ทางการจะรันเป็น `node` (uid `1000`) ดังนั้น
โดยปกติไดเรกทอรี OpenClaw config และ workspace ที่ bind-mounted จาก host ควรเป็น
ของ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

หากคุณตั้งใจรัน OpenClaw เป็น root ให้ซ่อม managed plugin root ให้เป็น
root ownership แทน:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

หลังจากแก้ความเป็นเจ้าของแล้ว ให้รัน `openclaw doctor --fix` อีกครั้ง หรือ
`openclaw plugins registry --refresh` เพื่อให้ plugin registry ที่ persisted ตรงกับ
ไฟล์ที่ซ่อมแล้ว

สำหรับการติดตั้ง npm selector ที่เปลี่ยนได้ เช่น `latest` หรือ dist-tag จะถูก resolve
ก่อนติดตั้ง แล้วจึง pin เป็นเวอร์ชันที่ตรวจสอบแล้วแบบ exact ใน
managed npm root ของ OpenClaw หลังจาก npm เสร็จสิ้น OpenClaw จะตรวจสอบว่า entry
`package-lock.json` ที่ติดตั้งแล้วยังคงตรงกับเวอร์ชันและ integrity ที่ resolve ไว้ หาก
npm เขียน package metadata ต่างออกไป การติดตั้งจะล้มเหลวและ managed package
จะถูก rollback แทนการยอมรับ artifact ของ Plugin ที่ต่างออกไป
Managed npm roots ยังสืบทอด npm `overrides` ระดับแพ็กเกจของ OpenClaw ดังนั้น
security pin ที่ปกป้อง packaged host จะถูกนำไปใช้กับ dependency ของ Plugin ภายนอก
ที่ถูก hoist ด้วย

Source checkout เป็น pnpm workspace หากคุณ clone OpenClaw เพื่อแก้ไข bundled
plugins ให้รัน `pnpm install`; จากนั้น OpenClaw จะโหลด bundled plugins จาก
`extensions/<id>` เพื่อให้ใช้การแก้ไขและ dependency ภายในแพ็กเกจโดยตรง
การติดตั้ง root ผ่าน npm ธรรมดามีไว้สำหรับ OpenClaw แบบแพ็กเกจ ไม่ใช่สำหรับ
การพัฒนาจาก source checkout

## ประเภท Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; ทำงานใน process       | Plugin ทางการ, แพ็กเกจ npm ของชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; map เป็นฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงใน `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียด bundle

หากคุณกำลังเขียน native plugin ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Entrypoint ของแพ็กเกจ

แพ็กเกจ npm ของ native plugin ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละ entry ต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve เป็นไฟล์
runtime ที่อ่านได้ หรือเป็นไฟล์ซอร์ส TypeScript ที่มี peer JavaScript ที่ build แล้วแบบอนุมาน
เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบแพ็กเกจต้องมี output runtime JavaScript นั้นมาด้วย fallback ไปยังซอร์ส
TypeScript มีไว้สำหรับ source checkout และ local development path ไม่ใช่สำหรับ
แพ็กเกจ npm ที่ติดตั้งใน managed plugin root ของ OpenClaw

หากคำเตือนของ managed package แจ้งว่า `requires compiled runtime output for
TypeScript entry ...` แสดงว่าแพ็กเกจถูกเผยแพร่โดยไม่มีไฟล์ JavaScript
ที่ OpenClaw ต้องใช้ตอน runtime นั่นเป็นปัญหา packaging ของ Plugin ไม่ใช่ปัญหา config
ในเครื่อง อัปเดตหรือติดตั้ง Plugin ใหม่หลังจากผู้เผยแพร่เผยแพร่ JavaScript
ที่ compile แล้วอีกครั้ง หรือปิดใช้งาน/ถอนการติดตั้ง Plugin นั้นจนกว่าจะมีแพ็กเกจที่แก้แล้ว

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ที่
path เดียวกับ source entries เมื่อมี `runtimeExtensions` ต้องมี
entry ตรงกันหนึ่งรายการสำหรับทุก `extensions` entry รายการที่ไม่ตรงกันจะทำให้ install และ
plugin discovery ล้มเหลวแทนการ fallback ไปยัง source paths แบบเงียบ ๆ หากคุณยัง
เผยแพร่ `openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ peer
JavaScript ที่ build แล้ว; ไฟล์นั้นจำเป็นเมื่อประกาศไว้

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugin ทางการ

### แพ็กเกจ npm ที่ OpenClaw เป็นเจ้าของระหว่างการย้าย

ClawHub เป็นเส้นทางการกระจายหลักสำหรับ Plugin ส่วนใหญ่ OpenClaw release แบบแพ็กเกจปัจจุบัน
bundle Plugin ทางการจำนวนมากอยู่แล้ว ดังนั้นโดยปกติ setup เหล่านั้นไม่จำเป็นต้อง
ติดตั้ง npm แยกต่างหาก จนกว่า Plugin ที่ OpenClaw เป็นเจ้าของทุกตัวจะ
ย้ายไป ClawHub แล้ว OpenClaw ยังจัดส่งแพ็กเกจ Plugin `@openclaw/*` บางตัวบน
npm สำหรับการติดตั้งเก่า/แบบกำหนดเองและ workflow npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` deprecated แสดงว่าเวอร์ชันแพ็กเกจนั้น
มาจาก external package train รุ่นเก่า ใช้ Plugin ที่ bundled มากับ
OpenClaw ปัจจุบันหรือ local checkout จนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

| Plugin          | แพ็กเกจ                    | เอกสาร                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/th/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/th/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/th/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/th/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/th/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/th/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/th/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/th/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/th/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/th/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/th/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/th/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/th/plugins/zalouser)         |

### Core (มาพร้อมกับ OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้ตามค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` - การค้นหาหน่วยความจำแบบบันเดิล (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` - หน่วยความจำระยะยาวที่รองรับด้วย LanceDB พร้อมการเรียกคืน/จับภาพอัตโนมัติ (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI,
    ตัวอย่าง Ollama, ขีดจำกัดการเรียกคืน และการแก้ไขปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้งานตามค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` - Plugin เบราว์เซอร์แบบบันเดิลสำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด Gateway `browser.request`, รันไทม์เบราว์เซอร์ และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้งานตามค่าเริ่มต้น; ปิดใช้งานก่อนแทนที่)
    - `copilot-proxy` - บริดจ์ VS Code Copilot Proxy (ปิดใช้งานตามค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่ใช่ไหม? ดู [Plugin ชุมชน](/th/plugins/community)

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

| ฟิลด์              | คำอธิบาย                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                           |
| `allow`            | รายการอนุญาต Plugin (ไม่บังคับ)                               |
| `bundledDiscovery` | โหมดการค้นพบ Plugin แบบบันเดิล (ค่าเริ่มต้นคือ `allowlist`)    |
| `deny`             | รายการปฏิเสธ Plugin (ไม่บังคับ; การปฏิเสธมีผลเหนือกว่า)                     |
| `load.paths`       | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`            | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>`   | การสลับเปิด/ปิด + การกำหนดค่าราย Plugin                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อมีค่าไม่ว่าง เฉพาะ Plugin ที่ระบุเท่านั้นที่โหลด
หรือเปิดเผยเครื่องมือได้ แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือเฉพาะที่
Plugin เป็นเจ้าของก็ตาม หากรายการอนุญาตเครื่องมืออ้างถึงเครื่องมือของ Plugin ให้เพิ่ม id ของ Plugin เจ้าของ
ใน `plugins.allow` หรือนำ `plugins.allow` ออก; `openclaw doctor` จะเตือนเกี่ยวกับรูปแบบนี้

`plugins.bundledDiscovery` มีค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้นคลังรายการ
`plugins.allow` ที่จำกัดสิทธิ์จะบล็อก Plugin ผู้ให้บริการแบบบันเดิลที่ไม่ได้ระบุไว้ด้วย
รวมถึงการค้นพบผู้ให้บริการ web-search ระดับรันไทม์ Doctor จะประทับค่า `"compat"` ให้กับ
การกำหนดค่ารายการอนุญาตเก่าที่จำกัดสิทธิ์ระหว่างการย้ายข้อมูล เพื่อให้การอัปเกรดยังคง
พฤติกรรมผู้ให้บริการแบบบันเดิลเดิมไว้จนกว่าผู้ดำเนินการจะเลือกใช้โหมดที่เข้มงวดกว่า
`plugins.allow` ที่ว่างยังคงถือว่าไม่ได้ตั้งค่า/เปิดอยู่

การเปลี่ยนแปลงการกำหนดค่าที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์การโหลด Plugin
ของ Gateway ใหม่ภายในโปรเซส เทิร์นเอเจนต์ใหม่จะสร้างรายการเครื่องมือใหม่จาก
รีจิสทรี Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยนซอร์ส เช่น ติดตั้ง
อัปเดต และถอนการติดตั้ง ยังคงรีสตาร์ตโปรเซส Gateway เพราะโมดูล Plugin
ที่ถูกอิมพอร์ตแล้วไม่สามารถแทนที่ในที่เดิมได้อย่างปลอดภัย

`openclaw plugins list` คือสแนปช็อตรีจิสทรี/การกำหนดค่า Plugin แบบโลคัล
Plugin ที่เป็น `enabled` ในรายการนั้นหมายความว่ารีจิสทรีที่บันทึกไว้และการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่รันอยู่แล้ว
โหลดใหม่หรือรีสตาร์ตไปใช้โค้ด Plugin เดียวกันแล้ว ในการตั้งค่า VPS/คอนเทนเนอร์
ที่มีโปรเซสตัวครอบ ให้ส่งการรีสตาร์ตหรือการเขียนที่ทริกเกอร์การโหลดใหม่ไปยังโปรเซส
`openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ
Gateway ที่กำลังรันเมื่อการโหลดใหม่รายงานความล้มเหลว

<Accordion title="สถานะ Plugin: ปิดใช้งาน เทียบกับขาดหาย เทียบกับไม่ถูกต้อง">
  - **ปิดใช้งาน**: Plugin มีอยู่แต่กฎการเปิดใช้งานปิดมันไว้ การกำหนดค่าถูกเก็บรักษาไว้
  - **ขาดหาย**: การกำหนดค่าอ้างถึง id ของ Plugin ที่การค้นพบไม่พบ
  - **ไม่ถูกต้อง**: Plugin มีอยู่แต่การกำหนดค่าของมันไม่ตรงกับ schema ที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักกันรายการที่ไม่ถูกต้องได้โดยปิดใช้งานและลบ payload การกำหนดค่าของรายการนั้น

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงกันมีผล):

<Steps>
  <Step title="เส้นทางการกำหนดค่า">
    `plugins.load.paths` - เส้นทางไฟล์หรือไดเรกทอรีที่ระบุชัดเจน เส้นทางที่ชี้
    กลับไปยังไดเรกทอรี Plugin แบบบันเดิลที่แพ็กมากับ OpenClaw เองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบนามแฝงเก่าเหล่านั้น
  </Step>

  <Step title="Plugin ในเวิร์กสเปซ">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบบันเดิล">
    จัดส่งมาพร้อม OpenClaw หลายรายการเปิดใช้งานตามค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะแก้ตำแหน่ง Plugin แบบบันเดิลจาก
ทรี `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin แบบบันเดิลถูก
bind-mounted ทับเส้นทางซอร์สที่แพ็กเกจตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรีซอร์สที่เมานต์นั้น
เป็น overlay ซอร์สแบบบันเดิลและค้นพบก่อนบันเดิล
`/app/dist/extensions/synology-chat` ที่แพ็กมา วิธีนี้ทำให้ลูปคอนเทนเนอร์สำหรับผู้ดูแล
ทำงานต่อได้โดยไม่ต้องสลับทุก Plugin แบบบันเดิลกลับไปใช้ซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist ที่แพ็กมา
แม้มีการเมานต์ source overlay อยู่ก็ตาม

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นพบ/โหลด Plugin
- `plugins.deny` มีผลเหนือกว่า allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจากเวิร์กสเปซจะ **ปิดใช้งานตามค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin แบบบันเดิลทำตามชุดค่าเริ่มต้นแบบเปิดในตัว เว้นแต่จะถูก override
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin แบบบันเดิลบางรายการที่ต้อง opt-in จะเปิดใช้งานโดยอัตโนมัติเมื่อการกำหนดค่าระบุชื่อ
  พื้นผิวที่ Plugin เป็นเจ้าของ เช่น provider model ref, การกำหนดค่าช่องทาง หรือรันไทม์
  harness
- การกำหนดค่า Plugin เก่าจะถูกเก็บรักษาไว้ขณะ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนรันการล้างข้อมูลของ doctor หากต้องการลบ id เก่าออก
- เส้นทาง Codex ตระกูล OpenAI แยกขอบเขต Plugin ออกจากกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ในขณะที่ Plugin app-server Codex
  แบบบันเดิลจะถูกเลือกโดย `agentRuntime.id: "codex"` หรือ model refs แบบเดิม
  `codex/*`

## การแก้ไขปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ side effects หรือ hooks ของ `register(api)`
ไม่ทำงานในทราฟฟิกแชตจริง ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL ของ Gateway ที่ใช้งานอยู่
  โปรไฟล์ เส้นทางการกำหนดค่า และโปรเซสเป็นรายการที่คุณกำลังแก้ไข
- รีสตาร์ต Gateway จริงหลังการเปลี่ยนแปลงการติดตั้ง/การกำหนดค่า/โค้ดของ Plugin ในคอนเทนเนอร์ตัวครอบ
  PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ตหรือส่งสัญญาณไปยังโปรเซสลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  การวินิจฉัย hooks การสนทนาที่ไม่ใช่แบบบันเดิล เช่น `llm_input`,
  `llm_output`, `before_agent_finalize` และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้ใช้ `before_model_resolve` เป็นหลัก มันทำงานก่อนการแก้โมเดล
  สำหรับเทิร์นเอเจนต์; `llm_output` ทำงานหลังจากความพยายามใช้โมเดล
  สร้างเอาต์พุตผู้ช่วยแล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผล ให้ใช้ `openclaw sessions` หรือ
  พื้นผิวเซสชัน/สถานะของ Gateway และเมื่อดีบัก payload ของผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หากเทิร์นเอเจนต์ดูเหมือนค้างขณะเตรียมเครื่องมือ ให้เปิดใช้การบันทึก trace และ
ตรวจสอบบรรทัด timing ของ factory เครื่องมือ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลารวมของ factory และ factory เครื่องมือ Plugin ที่ช้าที่สุด
รวมถึง id ของ Plugin, ชื่อเครื่องมือที่ประกาศ, รูปร่างผลลัพธ์ และเครื่องมือนั้นเป็น
optional หรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory เดียวใช้เวลา
อย่างน้อย 1s หรือการเตรียม factory เครื่องมือ Plugin ทั้งหมดใช้เวลาอย่างน้อย 5s

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการ resolve ซ้ำ
ด้วยบริบทคำขอที่มีผลเหมือนกัน คีย์แคชรวมการกำหนดค่ารันไทม์ที่มีผล
เวิร์กสเปซ, id ของเอเจนต์/เซสชัน, นโยบาย sandbox, การตั้งค่าเบราว์เซอร์,
บริบทการส่งมอบ, ตัวตนผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่
พึ่งพาฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกรันใหม่เมื่อบริบทเปลี่ยน

หาก Plugin หนึ่งครองเวลาเป็นหลัก ให้ตรวจสอบการลงทะเบียนรันไทม์ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่ใช้ต้นทุนสูงไปไว้หลังเส้นทางการทำงานของเครื่องมือแทนที่จะทำ
ภายใน factory ของเครื่องมือ

### การเป็นเจ้าของช่องทางหรือเครื่องมือซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้งานมากกว่าหนึ่งรายการพยายามเป็นเจ้าของช่องทางเดียวกัน
setup flow เดียวกัน หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin ช่องทางภายนอก
ถูกติดตั้งข้าง Plugin แบบบันเดิลที่ตอนนี้ให้ channel id เดียวกัน

ขั้นตอนดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และต้นทาง
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัวและ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และการวินิจฉัย
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้ metadata ที่บันทึกไว้สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ต Gateway หลังการเปลี่ยนแปลงการติดตั้ง รีจิสทรี หรือการกำหนดค่า

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีกตัวสำหรับ channel id เดียวกัน
  Plugin ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` ด้วย
  id ของ Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากรายการซ้ำเกิดโดยไม่ตั้งใจ ให้ปิดใช้งานฝั่งหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin
  เก่า
- หากคุณเปิดใช้งานทั้งสอง Plugin อย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานความขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับช่องทางหรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
  เพื่อให้พื้นผิวรันไทม์ไม่กำกวม

## สล็อต Plugin (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (มีได้เพียงหนึ่งรายการที่ active ในแต่ละครั้ง):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| สล็อต            | สิ่งที่ควบคุม      | ค่าเริ่มต้น             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin หน่วยความจำที่ active  | `memory-core`       |
| `contextEngine` | เอนจินบริบทที่ active | `legacy` (ในตัว) |

## อ้างอิง CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin ที่รวมมากับ OpenClaw จะจัดส่งพร้อม OpenClaw หลายรายการถูกเปิดใช้งานตามค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลที่รวมมาให้ ผู้ให้บริการเสียงพูดที่รวมมาให้ และ Plugin เบราว์เซอร์ที่รวมมาให้) Plugin ที่รวมมาให้อื่น ๆ ยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin หรือชุด hook ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรด Plugin npm ที่ติดตามอยู่ตามปกติ
ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งจะใช้พาธต้นทางซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

เมื่อมีการตั้งค่า `plugins.allow` อยู่แล้ว `openclaw plugins install` จะเพิ่ม
id ของ Plugin ที่ติดตั้งเข้าไปใน allowlist นั้นก่อนเปิดใช้งาน หาก id ของ Plugin เดียวกัน
มีอยู่ใน `plugins.deny` การติดตั้งจะลบรายการ deny ที่ค้างอยู่นั้น เพื่อให้
การติดตั้งแบบชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin ภายในเครื่องแบบคงอยู่ไว้เป็นโมเดลการอ่านแบบ cold สำหรับ
รายการ Plugin ความเป็นเจ้าของ contribution และการวางแผนเริ่มต้นระบบ โฟลว์ install, update,
uninstall, enable และ disable จะ refresh รีจิสทรีนั้นหลังเปลี่ยนสถานะ Plugin
ไฟล์ `plugins/installs.json` เดียวกันเก็บ metadata การติดตั้งที่คงทนใน
`installRecords` ระดับบนสุด และ metadata ของ manifest ที่สร้างใหม่ได้ใน `plugins` หาก
รีจิสทรีหายไป ล้าสมัย หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จาก install records, config policy และ
manifest/package metadata โดยไม่โหลดโมดูล runtime ของ Plugin
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
spec ของแพ็กเกจ npm พร้อม dist-tag หรือเวอร์ชันแบบเจาะจงจะแปลงชื่อแพ็กเกจ
กลับไปยังระเบียน Plugin ที่ติดตามอยู่ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งที่ pin ไว้แบบเจาะจงกลับไปยัง
สาย release เริ่มต้นของรีจิสทรี หาก Plugin npm ที่ติดตั้งอยู่ตรงกับ
เวอร์ชันที่ resolve ได้และอัตลักษณ์ artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่อง beta ระเบียน Plugin npm และ ClawHub
ที่อยู่บนสายเริ่มต้นจะลอง `@beta` ก่อน และ fallback ไปยัง default/latest เมื่อไม่มี release beta
ของ Plugin นั้น เวอร์ชันแบบเจาะจงและ tag แบบชัดเจนจะยังคงถูก pin ไว้

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับกับ `--marketplace` เพราะ
การติดตั้งจาก marketplace จะคง metadata แหล่งที่มาของ marketplace แทน spec ของ npm

`--dangerously-force-unsafe-install` เป็น override แบบ break-glass สำหรับ false positive
จากตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้ง Plugin
และการอัปเดต Plugin ดำเนินต่อผ่านผลตรวจ `critical` ในตัวได้ แต่ยังคง
ไม่ข้ามการบล็อกตาม policy `before_install` ของ Plugin หรือการบล็อกเมื่อการสแกนล้มเหลว
การสแกนตอนติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`,
`__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก test mock ที่แพ็กมา;
entrypoint runtime ของ Plugin ที่ประกาศไว้จะยังถูกสแกนแม้ใช้ชื่อใดชื่อหนึ่ง
เหล่านั้น

แฟล็ก CLI นี้ใช้กับโฟลว์ install/update ของ Plugin เท่านั้น การติดตั้ง dependency ของ skill
ที่รองรับด้วย Gateway ใช้ request override `dangerouslyForceUnsafeInstall`
ที่ตรงกันแทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill
จาก ClawHub แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิด
แดชบอร์ด ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบ
อีกครั้ง `--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเอง;
มันไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้ release ที่ถูกบล็อกเป็นสาธารณะ

bundle ที่เข้ากันได้เข้าร่วมในโฟลว์ list/inspect/enable/disable ของ Plugin เดียวกัน
การรองรับ runtime ปัจจุบันรวมถึง bundle skills, command-skills ของ Claude,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook
ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของ bundle ที่ตรวจพบ รวมถึง
รายการเซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่รองรับด้วย bundle

แหล่งที่มาของ marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, ราก marketplace ภายในเครื่องหรือ
พาธ `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL ของ GitHub repo,
หรือ URL ของ git สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน
repo marketplace ที่ clone มา และใช้เฉพาะแหล่งที่มาแบบ relative path เท่านั้น

ดูรายละเอียดทั้งหมดที่ [อ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Plugin แบบ native export entry object ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias แบบ legacy ได้ แต่ Plugin ใหม่ควร
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

OpenClaw โหลด entry object และเรียก `register(api)` ระหว่างการ activate Plugin
loader ยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า
แต่ Plugin ที่รวมมาให้และ Plugin ภายนอกใหม่ควรมองว่า `register` เป็น
สัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่า entry ของมันถูกโหลดด้วยเหตุผลใด:

| โหมด | ความหมาย |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การ activate runtime ลงทะเบียนเครื่องมือ hook บริการ คำสั่ง route และ side effect แบบ live อื่น ๆ |
| `discovery`     | การค้นหาความสามารถแบบอ่านอย่างเดียว ลงทะเบียนผู้ให้บริการและ metadata; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ให้ข้าม side effect แบบ live |
| `setup-only`    | การโหลด metadata การตั้งค่าช่องทางผ่าน setup entry แบบ lightweight |
| `setup-runtime` | การโหลดการตั้งค่าช่องทางที่ต้องใช้ runtime entry ด้วย |
| `cli-metadata`  | การรวบรวม metadata ของคำสั่ง CLI เท่านั้น |

entry ของ Plugin ที่เปิด socket, database, background worker หรือ client ที่มีอายุยาว
ควร guard side effect เหล่านั้นด้วย `api.registrationMode === "full"`
การโหลด discovery ถูก cache แยกจากการโหลดเพื่อ activate และไม่แทนที่
รีจิสทรี Gateway ที่กำลังทำงานอยู่ Discovery เป็นแบบไม่ activate แต่ไม่ใช่ import-free:
OpenClaw อาจ evaluate entry ของ Plugin ที่เชื่อถือได้หรือโมดูล Plugin ของช่องทางเพื่อสร้าง
snapshot ให้ top level ของโมดูล lightweight และปราศจาก side effect และย้าย
network client, subprocess, listener, การอ่าน credential และการเริ่มบริการ
ไปไว้หลังพาธ full-runtime

วิธีลงทะเบียนทั่วไป:

| วิธี | สิ่งที่ลงทะเบียน |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM) |
| `registerChannel`                       | ช่องทางแชต |
| `registerTool`                          | เครื่องมือ agent |
| `registerHook` / `on(...)`              | hook วงจรชีวิต |
| `registerSpeechProvider`                | Text-to-speech / STT |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีม |
| `registerRealtimeVoiceProvider`         | เสียง realtime แบบ duplex |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง |
| `registerImageGenerationProvider`       | การสร้างภาพ |
| `registerMusicGenerationProvider`       | การสร้างเพลง |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ |
| `registerWebFetchProvider`              | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ |
| `registerHttpRoute`                     | endpoint HTTP |
| `registerCommand` / `registerCli`       | คำสั่ง CLI |
| `registerContextEngine`                 | context engine |
| `registerService`                       | บริการเบื้องหลัง |

พฤติกรรม guard ของ hook สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handler ที่ priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handler ที่ priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handler ที่ priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

app-server แบบ native ของ Codex bridge เหตุการณ์เครื่องมือแบบ Codex-native กลับเข้าสู่
พื้นผิว hook นี้ Plugin สามารถบล็อกเครื่องมือ Codex แบบ native ผ่าน `before_tool_call`,
สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมการอนุมัติ
`PermissionRequest` ของ Codex bridge ยังไม่เขียน arguments ของเครื่องมือแบบ Codex-native ใหม่
ขอบเขตการรองรับ runtime ของ Codex ที่แน่ชัดอยู่ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม typed hook แบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) - ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) - สคีมาแมนิเฟสต์
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) - เพิ่มเครื่องมือเอเจนต์ใน Plugin
- [โครงสร้างภายในของ Plugin](/th/plugins/architecture) - โมเดลความสามารถและไปป์ไลน์การโหลด
- [Plugin จากชุมชน](/th/plugins/community) - รายการจากบุคคลที่สาม
