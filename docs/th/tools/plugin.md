---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับบันเดิล Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-10T20:01:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่: ช่องทาง, ผู้ให้บริการโมเดล,
agent harness, เครื่องมือ, Skills, speech, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์,
การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ
และอื่นๆ Plugin บางรายการเป็น **core** (มาพร้อมกับ OpenClaw) ส่วนรายการอื่นเป็น
**external** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/clawhub) Npm ยังคงรองรับสำหรับการติดตั้งโดยตรงและสำหรับชุดชั่วคราวของ
แพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของระหว่างที่การย้ายนี้ยังไม่เสร็จสมบูรณ์

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้งแบบคัดลอกวาง การแสดงรายการ การถอนการติดตั้ง การอัปเดต และการเผยแพร่ โปรดดู
[จัดการ Plugin](/th/plugins/manage-plugins)

<Steps>
  <Step title="ดูสิ่งที่โหลดอยู่">
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

  <Step title="รีสตาร์ท Gateway">
    ```bash
    openclaw gateway restart
    ```

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์ config ของคุณ

  </Step>

  <Step title="การจัดการแบบ chat-native">
    ใน Gateway ที่กำลังทำงาน คำสั่งสำหรับเจ้าของเท่านั้นอย่าง `/plugins enable` และ `/plugins disable`
    จะเรียกตัวโหลด config ของ Gateway ใหม่ Gateway จะโหลดพื้นผิว runtime ของ Plugin
    ใหม่ใน process และ turn ใหม่ของ agent จะสร้างรายการเครื่องมือของตนใหม่จาก
    registry ที่รีเฟรชแล้ว `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น
    Gateway จึงขอให้รีสตาร์ทแทนการแสร้งว่า process ปัจจุบันสามารถ
    โหลดโมดูลที่ import ไปแล้วใหม่ได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือที่ลงทะเบียนไว้ บริการ เมธอดของ gateway
    hooks หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของ `inspect` แบบธรรมดาเป็นการตรวจ
    manifest/registry แบบเย็น และตั้งใจหลีกเลี่ยงการ import runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการควบคุมแบบ chat-native ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: path/archive ในเครื่อง, ระบุ
`clawhub:<pkg>` อย่างชัดเจน, ระบุ `npm:<pkg>` อย่างชัดเจน, ระบุ `npm-pack:<path.tgz>`
อย่างชัดเจน, ระบุ `git:<repo>` อย่างชัดเจน หรือ package spec เปล่าผ่าน npm

หาก config ไม่ถูกต้อง โดยปกติการติดตั้งจะ fail closed และชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นสำหรับการกู้คืนเพียงอย่างเดียวคือเส้นทาง reinstall
ของ bundled-plugin แบบแคบสำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือนกับ
config ที่ไม่ถูกต้องอื่นๆ เรียกใช้ `openclaw doctor --fix` เพื่อ quarantine config
ของ Plugin ที่เสียโดยปิดใช้รายการ Plugin นั้นและนำ payload config ที่ไม่ถูกต้องออก
การ backup config ตามปกติจะเก็บค่าก่อนหน้าไว้
เมื่อ config ของช่องทางอ้างถึง Plugin ที่ไม่สามารถค้นพบได้อีกต่อไป แต่ plugin id
เก่าเดิมยังคงอยู่ใน config ของ Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway
จะ log คำเตือนและข้ามช่องทางนั้นแทนที่จะบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อนำรายการช่องทาง/Plugin เก่าออก; key ช่องทาง
ที่ไม่รู้จักซึ่งไม่มีหลักฐาน stale-plugin จะยังคง fail validation เพื่อให้ typo
ยังมองเห็นได้
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin เก่าจะถูกถือว่า inert:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะเก็บ
config ของ Plugin ที่ถูกปิดใช้ไว้แทนการลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
รัน doctor cleanup หากคุณต้องการนำ plugin id เก่าออก

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่าง install/update อย่างชัดเจน
หรือ flow การซ่อมของ doctor เท่านั้น การเริ่มต้น Gateway, การโหลด config ใหม่ และ
runtime inspection จะไม่รัน package manager หรือซ่อม dependency tree Plugin ในเครื่อง
ต้องติดตั้ง dependency ไว้แล้ว ขณะที่ Plugin จาก npm, git และ ClawHub จะถูกติดตั้ง
ภายใต้ managed plugin roots ของ OpenClaw dependency ของ npm อาจถูก hoist ภายใน
managed npm root ของ OpenClaw; install/update จะสแกน managed root นั้นก่อน trust
และ uninstall จะลบแพ็กเกจที่ npm จัดการผ่าน npm Plugin ภายนอกและ custom load paths
ยังคงต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบ static สำหรับแต่ละ
Plugin ที่มองเห็นได้ โดยไม่ต้อง import runtime code หรือซ่อม dependency
ดู [การแก้ไข dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ lifecycle
ระหว่างการติดตั้ง

### ความเป็นเจ้าของ path ของ Plugin ที่ถูกบล็อก

หาก diagnostics ของ Plugin แจ้งว่า
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
และการตรวจสอบ config ตามด้วย `plugin present but blocked` แปลว่า OpenClaw พบไฟล์
Plugin ที่เป็นของ Unix user คนละคนกับ process ที่กำลังโหลดไฟล์เหล่านั้น
ให้คง config ของ Plugin ไว้; แก้ไขความเป็นเจ้าของของ filesystem หรือรัน
OpenClaw ด้วย user เดียวกับที่เป็นเจ้าของ state directory

สำหรับการติดตั้งด้วย Docker image ทางการรันเป็น `node` (uid `1000`) ดังนั้น
directory ของ OpenClaw config และ workspace ที่ bind-mounted จาก host โดยปกติควร
เป็นของ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

หากคุณตั้งใจรัน OpenClaw เป็น root ให้ซ่อม managed plugin root ให้เป็นของ root แทน:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

หลังแก้ไขความเป็นเจ้าของแล้ว ให้รัน `openclaw doctor --fix` อีกครั้ง หรือ
`openclaw plugins registry --refresh` เพื่อให้ registry ของ Plugin ที่ persist อยู่
ตรงกับไฟล์ที่ซ่อมแล้ว

สำหรับการติดตั้งด้วย npm selector ที่เปลี่ยนแปลงได้ เช่น `latest` หรือ dist-tag
จะถูก resolve ก่อนการติดตั้ง จากนั้น pin เป็นเวอร์ชันที่ตรวจสอบแล้วแบบ exact ใน
managed npm root ของ OpenClaw หลัง npm เสร็จสิ้น OpenClaw จะตรวจสอบว่า entry ใน
`package-lock.json` ที่ติดตั้งยังตรงกับเวอร์ชันและ integrity ที่ resolve ไว้
หาก npm เขียน metadata ของแพ็กเกจที่แตกต่างออกไป การติดตั้งจะล้มเหลวและ managed
package จะถูก rollback แทนที่จะยอมรับ artifact ของ Plugin ที่แตกต่าง
managed npm roots ยังสืบทอด npm `overrides` ระดับแพ็กเกจของ OpenClaw ด้วย ดังนั้น
security pins ที่ปกป้อง packaged host จะนำไปใช้กับ dependency ของ Plugin ภายนอก
ที่ถูก hoist ด้วย

source checkout เป็น pnpm workspace หากคุณ clone OpenClaw เพื่อแก้ไข bundled
Plugin ให้รัน `pnpm install`; จากนั้น OpenClaw จะโหลด bundled Plugin จาก
`extensions/<id>` เพื่อให้การแก้ไขและ dependency เฉพาะแพ็กเกจถูกใช้โดยตรง
การติดตั้ง npm root แบบธรรมดามีไว้สำหรับ OpenClaw แบบ packaged ไม่ใช่การพัฒนา
source checkout

## ประเภทของ Plugin

OpenClaw รองรับรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; execute ใน process       | Plugin ทางการ, แพ็กเกจ npm ของชุมชน               |
| **Bundle** | layout ที่เข้ากันได้กับ Codex/Claude/Cursor; map ไปยังฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียด bundle

หากคุณกำลังเขียน Plugin แบบ native ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Package entrypoints

แพ็กเกจ npm ของ Plugin แบบ native ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละ entry ต้องอยู่ภายใน directory ของแพ็กเกจ และ resolve ไปยังไฟล์ runtime
ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี JavaScript peer ที่ build แล้ว
ซึ่ง infer ได้ เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบ packaged ต้องมาพร้อม output runtime JavaScript นั้น fallback ซอร์ส
TypeScript มีไว้สำหรับ source checkout และ path การพัฒนาในเครื่อง ไม่ใช่สำหรับ
แพ็กเกจ npm ที่ติดตั้งเข้าไปใน managed plugin root ของ OpenClaw

หากคำเตือนของ managed package บอกว่า `requires compiled runtime output for
TypeScript entry ...` แพ็กเกจนั้นถูกเผยแพร่โดยไม่มีไฟล์ JavaScript ที่
OpenClaw ต้องใช้ตอน runtime นี่เป็นปัญหาการ packaging ของ Plugin ไม่ใช่ปัญหา
config ในเครื่อง อัปเดตหรือติดตั้ง Plugin ใหม่หลังจาก publisher เผยแพร่
JavaScript ที่ compile แล้วอีกครั้ง หรือปิดใช้/ถอนการติดตั้ง Plugin นั้นจนกว่า
จะมีแพ็กเกจที่แก้ไขแล้ว

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ใน path
เดียวกับ source entries เมื่อมีอยู่ `runtimeExtensions` ต้องมี entry หนึ่งรายการ
พอดีสำหรับทุก `extensions` entry รายการที่ไม่ตรงกันจะทำให้ install และ discovery
ของ Plugin ล้มเหลว แทนที่จะ fallback ไปยัง source paths อย่างเงียบๆ หากคุณเผยแพร่
`openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ JavaScript
peer ที่ build แล้ว; ไฟล์นั้นจำเป็นเมื่อประกาศไว้

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

ClawHub เป็นเส้นทางหลักสำหรับการเผยแพร่ Plugin ส่วนใหญ่ OpenClaw release แบบ
packaged ในปัจจุบัน bundle Plugin ทางการไว้แล้วจำนวนมาก ดังนั้นโดยปกติการตั้งค่า
ทั่วไปไม่จำเป็นต้องติดตั้ง npm แยกต่างหาก จนกว่า Plugin ทุกตัวที่ OpenClaw
เป็นเจ้าของจะย้ายไปยัง ClawHub เสร็จ OpenClaw ยังคงเผยแพร่แพ็กเกจ Plugin
`@openclaw/*` บางรายการบน npm สำหรับการติดตั้งแบบเก่า/กำหนดเองและ workflow
npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` deprecated แสดงว่าเวอร์ชันแพ็กเกจนั้น
มาจากชุดแพ็กเกจภายนอกที่เก่ากว่า ให้ใช้ bundled Plugin จาก OpenClaw ปัจจุบันหรือ
checkout ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

| Plugin          | แพ็กเกจ                    | เอกสาร                                       |
| --------------- | -------------------------- | ------------------------------------------ |
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
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้เป็นค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` - การค้นหาหน่วยความจำแบบบันเดิล (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` - หน่วยความจำระยะยาวที่มี LanceDB เป็นแบ็กเอนด์ พร้อมการเรียกคืน/จับภาพอัตโนมัติ (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI,
    ตัวอย่าง Ollama, ขีดจำกัดการเรียกคืน และการแก้ไขปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้งานโดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` - Plugin เบราว์เซอร์แบบบันเดิลสำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด Gateway `browser.request`, รันไทม์เบราว์เซอร์ และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้งานโดยค่าเริ่มต้น; ปิดใช้งานก่อนแทนที่)
    - `copilot-proxy` - บริดจ์ VS Code Copilot Proxy (ปิดใช้งานโดยค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่ใช่ไหม? ดู [ClawHub](/th/clawhub)

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
| `bundledDiscovery` | โหมดการค้นพบ Plugin แบบบันเดิล (`allowlist` โดยค่าเริ่มต้น)    |
| `deny`             | รายการปฏิเสธ Plugin (ไม่บังคับ; deny ชนะ)                     |
| `load.paths`       | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`            | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>`   | สวิตช์และการกำหนดค่าราย Plugin                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อไม่ว่างเปล่า จะมีเพียง Plugin ที่ระบุไว้เท่านั้นที่โหลด
หรือเปิดเผยเครื่องมือได้ แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือเฉพาะที่
Plugin เป็นเจ้าของก็ตาม หากรายการอนุญาตเครื่องมืออ้างอิงเครื่องมือของ Plugin ให้เพิ่ม id ของ Plugin เจ้าของ
ลงใน `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

`plugins.bundledDiscovery` มีค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้น
อินเวนทอรี `plugins.allow` ที่จำกัดจะบล็อก Plugin ผู้ให้บริการแบบบันเดิลที่ไม่ได้ระบุไว้ด้วย
รวมถึงการค้นพบผู้ให้บริการค้นหาเว็บขณะรันไทม์ Doctor จะประทับตราการกำหนดค่า
รายการอนุญาตแบบจำกัดรุ่นเก่าด้วย `"compat"` ระหว่างการย้ายข้อมูล เพื่อให้การอัปเกรดยังคง
พฤติกรรมผู้ให้บริการแบบบันเดิลเดิมไว้จนกว่าผู้ปฏิบัติการจะเลือกใช้โหมดที่เข้มงวดยิ่งขึ้น
`plugins.allow` ที่ว่างเปล่ายังคงถูกปฏิบัติเหมือนไม่ได้ตั้งค่า/เปิดอยู่

การเปลี่ยนแปลงการกำหนดค่าที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์การโหลด
Plugin ของ Gateway ใหม่ภายในโปรเซส เทิร์นใหม่ของ agent จะสร้างรายการเครื่องมือใหม่จาก
รีจิสทรี Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยนซอร์ส เช่น การติดตั้ง,
อัปเดต และถอนการติดตั้ง ยังคงรีสตาร์ตโปรเซส Gateway เพราะโมดูล Plugin ที่นำเข้าแล้ว
ไม่สามารถแทนที่ในที่เดิมได้อย่างปลอดภัย

`openclaw plugins list` เป็นสแนปช็อตรีจิสทรี/การกำหนดค่า Plugin ในเครื่อง
Plugin ที่เป็น `enabled` ที่นั่นหมายความว่ารีจิสทรีที่บันทึกถาวรและการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังรันอยู่ได้โหลดใหม่หรือรีสตาร์ต
เข้าสู่โค้ด Plugin เดียวกันแล้ว บนการตั้งค่า VPS/คอนเทนเนอร์ที่มีโปรเซส wrapper
ให้ส่งการรีสตาร์ตหรือการเขียนที่ทริกเกอร์การโหลดใหม่ไปยังโปรเซส
`openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ
Gateway ที่กำลังรันอยู่เมื่อการโหลดใหม่รายงานความล้มเหลว

<Accordion title="สถานะ Plugin: ปิดใช้งาน เทียบกับ สูญหาย เทียบกับ ไม่ถูกต้อง">
  - **ปิดใช้งาน**: Plugin มีอยู่แต่กฎการเปิดใช้งานปิดไว้ การกำหนดค่าจะถูกเก็บรักษาไว้
  - **สูญหาย**: การกำหนดค่าอ้างอิง id ของ Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: Plugin มีอยู่แต่การกำหนดค่าไม่ตรงกับสคีมาที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักกันรายการที่ไม่ถูกต้องได้โดยปิดใช้งานและลบ payload การกำหนดค่าของรายการนั้น

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงกันชนะ):

<Steps>
  <Step title="พาธการกำหนดค่า">
    `plugins.load.paths` - พาธไฟล์หรือไดเรกทอรีแบบระบุชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี Plugin แบบบันเดิลที่บรรจุแพ็กเกจของ OpenClaw เองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบ alias เก่าเหล่านั้น
  </Step>

  <Step title="Plugin ในเวิร์กสเปซ">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบบันเดิล">
    จัดส่งมาพร้อม OpenClaw หลายรายการเปิดใช้งานโดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะ resolve Plugin แบบบันเดิลจาก
ต้นไม้ `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์ส Plugin แบบบันเดิลถูก
bind-mounted ทับพาธซอร์สที่บรรจุแพ็กเกจที่ตรงกัน ตัวอย่างเช่น
`/app/extensions/synology-chat`, OpenClaw จะปฏิบัติต่อไดเรกทอรีซอร์สที่ mount นั้น
เป็นโอเวอร์เลย์ซอร์สแบบบันเดิล และค้นพบก่อนบันเดิล
`/app/dist/extensions/synology-chat` ที่บรรจุแพ็กเกจไว้ วิธีนี้ช่วยให้ลูปคอนเทนเนอร์ของผู้ดูแล
ทำงานได้โดยไม่ต้องสลับทุก Plugin แบบบันเดิลกลับไปเป็นซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist ที่บรรจุแพ็กเกจ
แม้ว่าจะมี source overlay mount อยู่ก็ตาม

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นพบ/โหลด Plugin
- `plugins.deny` ชนะ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจากเวิร์กสเปซจะ **ปิดใช้งานโดยค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin แบบบันเดิลทำตามชุดค่าเริ่มต้นแบบเปิดโดยดีฟอลต์ในตัว เว้นแต่จะถูก override
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin แบบบันเดิลที่เป็น opt-in บางรายการจะถูกเปิดใช้งานโดยอัตโนมัติเมื่อการกำหนดค่าระบุ
  พื้นผิวที่ Plugin เป็นเจ้าของ เช่น ref โมเดลของผู้ให้บริการ, การกำหนดค่าช่องทาง หรือรันไทม์
  harness
- การกำหนดค่า Plugin เก่าจะถูกเก็บรักษาไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนรันการล้างข้อมูลด้วย doctor หากคุณต้องการลบ id เก่า
- เส้นทาง Codex ตระกูล OpenAI จะรักษาขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ส่วน Plugin app-server Codex แบบบันเดิล
  จะถูกเลือกโดย ref agent แบบมาตรฐาน `openai/*`, `agentRuntime.id: "codex"` แบบระบุ
  ผู้ให้บริการ/โมเดลชัดเจน หรือ ref โมเดล `codex/*` แบบเก่า

## การแก้ไขปัญหา hook ขณะรันไทม์

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hook ของ `register(api)`
ไม่ทำงานในทราฟฟิกแชทสด ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL ของ
  Gateway ที่ใช้งานอยู่, โปรไฟล์, พาธการกำหนดค่า และโปรเซสเป็นรายการที่คุณกำลังแก้ไข
- รีสตาร์ต Gateway สดหลังการติดตั้ง/กำหนดค่า/เปลี่ยนโค้ด Plugin ในคอนเทนเนอร์ wrapper
  PID 1 อาจเป็นเพียง supervisor; รีสตาร์ตหรือส่งสัญญาณไปยังโปรเซสลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  diagnostics hook บทสนทนาที่ไม่ใช่แบบบันเดิล เช่น `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้ใช้ `before_model_resolve` เป็นหลัก มันทำงานก่อนการ resolve โมเดล
  สำหรับเทิร์นของ agent; `llm_output` จะทำงานหลังจากความพยายามใช้โมเดล
  สร้างเอาต์พุต assistant แล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผลจริง ให้ใช้ `openclaw sessions` หรือ
  พื้นผิวเซสชัน/สถานะของ Gateway และเมื่อดีบัก payload ของผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หากเทิร์นของ agent ดูเหมือนหยุดค้างขณะเตรียมเครื่องมือ ให้เปิดใช้การบันทึก trace และ
ตรวจสอบบรรทัดเวลาของ factory เครื่องมือ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลารวมของ factory และ factory เครื่องมือ Plugin ที่ช้าที่สุด
รวมถึง id ของ Plugin, ชื่อเครื่องมือที่ประกาศไว้, รูปแบบผลลัพธ์ และระบุว่าเครื่องมือนั้น
เป็น optional หรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory เดียวใช้เวลา
อย่างน้อย 1 วินาที หรือการเตรียม factory เครื่องมือ Plugin ทั้งหมดใช้เวลาอย่างน้อย 5 วินาที

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการ resolve ซ้ำ
ด้วยบริบทคำขอที่มีผลจริงเดียวกัน คีย์แคชรวมการกำหนดค่ารันไทม์ที่มีผลจริง,
เวิร์กสเปซ, id agent/เซสชัน, นโยบาย sandbox, การตั้งค่าเบราว์เซอร์,
บริบทการส่งมอบ, ตัวตนของผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่
พึ่งพาฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกรันใหม่เมื่อบริบทเปลี่ยน

หาก Plugin หนึ่งครองเวลาส่วนใหญ่ ให้ตรวจสอบการลงทะเบียนรันไทม์ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้หลังเส้นทางการเรียกใช้เครื่องมือ แทนที่จะทำ
ภายใน factory เครื่องมือ

### ความเป็นเจ้าของช่องทางหรือเครื่องมือซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่า Plugin ที่เปิดใช้งานมากกว่าหนึ่งรายการกำลังพยายามเป็นเจ้าของช่องทางเดียวกัน,
โฟลว์การตั้งค่าเดียวกัน หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin ช่องทางภายนอก
ที่ติดตั้งอยู่ข้าง Plugin แบบบันเดิลที่ตอนนี้ให้ id ช่องทางเดียวกัน

ขั้นตอนการดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทั้งหมด
  และต้นทาง
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละรายการ และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้ metadata ที่บันทึกถาวรสะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ต Gateway หลังการติดตั้ง, รีจิสทรี หรือการเปลี่ยนแปลงการกำหนดค่า

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีก Plugin สำหรับ id ช่องทางเดียวกัน
  Plugin ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  id ของ Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากความซ้ำกันเกิดขึ้นโดยไม่ได้ตั้งใจ ให้ปิดใช้งานฝั่งหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin เก่า
- หากคุณเปิดใช้งานทั้งสอง Plugin อย่างชัดเจน OpenClaw จะรักษาคำขอนั้นไว้และ
  รายงานความขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับช่องทาง หรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
  เพื่อให้พื้นผิวรันไทม์ไม่กำกวม

## สล็อต Plugin (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (เปิดใช้งานได้ทีละหนึ่งรายการเท่านั้น):

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
| `memory`        | Plugin หน่วยความจำที่ใช้งานอยู่  | `memory-core`       |
| `contextEngine` | เอนจินบริบทที่ใช้งานอยู่ | `legacy` (ในตัว) |

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

Plugin ที่มาพร้อมชุดจัดส่งมากับ OpenClaw หลายรายการถูกเปิดใช้งานตามค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลที่มาพร้อมชุด ผู้ให้บริการเสียงพูดที่มาพร้อมชุด และ Plugin เบราว์เซอร์
ที่มาพร้อมชุด) Plugin ที่มาพร้อมชุดรายการอื่นยังต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือแพ็ก hook ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ Plugin npm
ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งนำพาธต้นทางกลับมาใช้แทน
การคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

เมื่อมีการตั้งค่า `plugins.allow` อยู่แล้ว `openclaw plugins install` จะเพิ่ม
id ของ Plugin ที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้งาน หาก id ของ Plugin เดียวกัน
อยู่ใน `plugins.deny` การติดตั้งจะลบรายการปฏิเสธที่ค้างอยู่นั้นออก เพื่อให้
การติดตั้งแบบชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin ภายในเครื่องแบบคงอยู่ไว้เป็นโมเดลอ่านแบบ cold สำหรับ
คลังรายการ Plugin ความเป็นเจ้าของ contribution และการวางแผนเริ่มต้นระบบ โฟลว์ติดตั้ง
อัปเดต ถอนการติดตั้ง เปิดใช้งาน และปิดใช้งานจะรีเฟรชรีจิสทรีนั้นหลังเปลี่ยนสถานะ
Plugin ไฟล์ `plugins/installs.json` เดียวกันเก็บเมตาดาต้าการติดตั้งที่คงทนใน
`installRecords` ระดับบนสุด และเมตาดาต้า manifest ที่สร้างใหม่ได้ใน `plugins` หาก
รีจิสทรีหายไป เก่าเกินไป หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จากระเบียนการติดตั้ง นโยบาย config และ
เมตาดาต้า manifest/package โดยไม่โหลดโมดูล runtime ของ Plugin

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยน lifecycle ของ Plugin จะถูกปิดใช้งาน
ให้จัดการการเลือกแพ็กเกจ Plugin และ config ผ่านซอร์ส Nix ของการติดตั้งแทน สำหรับ
nix-openclaw ให้เริ่มจาก [เริ่มต้นใช้งานด่วน](https://github.com/openclaw/nix-openclaw#quick-start)
แบบ agent-first `openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่
การส่ง spec แพ็กเกจ npm พร้อม dist-tag หรือเวอร์ชันแบบแน่นอนจะ resolve ชื่อแพ็กเกจ
กลับไปยังระเบียน Plugin ที่ติดตามอยู่ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งที่ปักหมุดแบบแน่นอนกลับไปยัง
สายรีลีสเริ่มต้นของรีจิสทรี หาก Plugin npm ที่ติดตั้งตรงกับเวอร์ชันที่ resolve แล้ว
และตัวตนอาร์ติแฟกต์ที่บันทึกไว้ OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่
หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่อง beta ระเบียน Plugin npm และ ClawHub บนสายเริ่มต้น
จะลอง `@beta` ก่อน แล้ว fallback ไปยังค่าเริ่มต้น/latest เมื่อไม่มีรีลีส beta ของ Plugin
เวอร์ชันแบบแน่นอนและแท็กแบบชัดเจนจะยังคงถูกปักหมุดไว้

`--pin` ใช้กับ npm เท่านั้น ไม่รองรับการใช้ร่วมกับ `--marketplace` เพราะการติดตั้ง
จากมาร์เก็ตเพลสจะคงเมตาดาต้าซอร์สมาร์เก็ตเพลสไว้แทน spec ของ npm

`--dangerously-force-unsafe-install` เป็น override แบบ break-glass สำหรับผลบวกลวง
จากตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งและการอัปเดต Plugin ดำเนินต่อหลังจาก
การพบค่า `critical` ในตัว แต่ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin
หรือการบล็อกเมื่อสแกนล้มเหลว การสแกนการติดตั้งจะไม่สนใจไฟล์และไดเรกทอรีทดสอบทั่วไป
เช่น `tests/`, `__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก mock
ทดสอบที่ถูกแพ็กมาด้วย entrypoint runtime ของ Plugin ที่ประกาศไว้จะยังถูกสแกนแม้ใช้ชื่อ
อย่างใดอย่างหนึ่งเหล่านั้น

แฟล็ก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ Skills
ที่มี Gateway หนุนหลังใช้ override คำขอ `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน
ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub
แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิดแดชบอร์ด
ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบอีกครั้ง
`--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเองเท่านั้น
ไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้รีลีสที่ถูกบล็อกเปิดเผยต่อสาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วมในโฟลว์รายการ/ตรวจสอบ/เปิดใช้งาน/ปิดใช้งาน Plugin เดียวกัน
การรองรับ runtime ปัจจุบันรวมถึง Skills ของบันเดิล, command-skills ของ Claude,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex
ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึงรายการ
เซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มีบันเดิลหนุนหลัง

ซอร์สมาร์เก็ตเพลสอาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root มาร์เก็ตเพลสภายในเครื่องหรือพาธ
`marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git
สำหรับมาร์เก็ตเพลสระยะไกล รายการ Plugin ต้องอยู่ภายใน repo มาร์เก็ตเพลสที่ clone มา
และใช้เฉพาะซอร์สพาธแบบสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [เอกสารอ้างอิง CLI ของ `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Plugin แบบเนทีฟ export อ็อบเจ็กต์ entry ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias แบบ legacy ได้ แต่ Plugin ใหม่ควรใช้ `register`

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

OpenClaw โหลดอ็อบเจ็กต์ entry และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin
loader ยังคง fallback ไปยัง `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่มาพร้อมชุด
และ Plugin ภายนอกใหม่ควรมองว่า `register` เป็นสัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่าทำไม entry ของมันจึงถูกโหลด:

| โหมด | ความหมาย |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | การเปิดใช้งาน runtime ลงทะเบียนเครื่องมือ hooks บริการ คำสั่ง routes และ side effect แบบสดอื่นๆ |
| `discovery` | การค้นพบความสามารถแบบอ่านอย่างเดียว ลงทะเบียนผู้ให้บริการและเมตาดาต้า; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ให้ข้าม side effect แบบสด |
| `setup-only` | การโหลดเมตาดาต้าการตั้งค่าช่องทางผ่าน entry ตั้งค่าแบบเบา |
| `setup-runtime` | การโหลดการตั้งค่าช่องทางที่ต้องใช้ entry runtime ด้วย |
| `cli-metadata` | การรวบรวมเมตาดาต้าคำสั่ง CLI เท่านั้น |

entry ของ Plugin ที่เปิด socket, database, worker พื้นหลัง หรือ client อายุยาว
ควรป้องกัน side effect เหล่านั้นด้วย `api.registrationMode === "full"`
การโหลด discovery จะถูก cache แยกจากการโหลดเพื่อเปิดใช้งาน และไม่ได้แทนที่
รีจิสทรี Gateway ที่กำลังทำงานอยู่ discovery เป็นแบบไม่เปิดใช้งาน แต่ไม่ใช่แบบ
ปลอด import: OpenClaw อาจ evaluate entry ของ Plugin ที่เชื่อถือได้หรือโมดูล Plugin
ช่องทางเพื่อสร้าง snapshot ให้รักษาระดับบนสุดของโมดูลให้เบาและไม่มี side effect
และย้าย client เครือข่าย subprocess, listener, การอ่าน credential และการเริ่มบริการ
ไปไว้หลังพาธ full-runtime

เมธอดลงทะเบียนที่พบบ่อย:

| เมธอด | สิ่งที่ลงทะเบียน |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ผู้ให้บริการโมเดล (LLM) |
| `registerChannel` | ช่องทางแชต |
| `registerTool` | เครื่องมือ agent |
| `registerHook` / `on(...)` | hooks ของ lifecycle |
| `registerSpeechProvider` | แปลงข้อความเป็นเสียง / STT |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีมมิง |
| `registerRealtimeVoiceProvider` | เสียง realtime แบบดูเพล็กซ์ |
| `registerMediaUnderstandingProvider` | การวิเคราะห์รูปภาพ/เสียง |
| `registerImageGenerationProvider` | การสร้างรูปภาพ |
| `registerMusicGenerationProvider` | การสร้างเพลง |
| `registerVideoGenerationProvider` | การสร้างวิดีโอ |
| `registerWebFetchProvider` | ผู้ให้บริการดึงข้อมูลเว็บ / scrape |
| `registerWebSearchProvider` | การค้นหาเว็บ |
| `registerHttpRoute` | endpoint HTTP |
| `registerCommand` / `registerCli` | คำสั่ง CLI |
| `registerContextEngine` | context engine |
| `registerService` | บริการพื้นหลัง |

พฤติกรรม guard ของ hook สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handler ที่ priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handler ที่ priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handler ที่ priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

แอปเซิร์ฟเวอร์ Native Codex รันเหตุการณ์เครื่องมือแบบเนทีฟของ Codex ผ่านบริดจ์กลับเข้าสู่พื้นผิว hook นี้ Plugin สามารถบล็อกเครื่องมือเนทีฟของ Codex ผ่าน `before_tool_call`, สังเกตผลลัพธ์ผ่าน `after_tool_call` และมีส่วนร่วมในการอนุมัติ `PermissionRequest` ของ Codex บริดจ์ยังไม่เขียนอาร์กิวเมนต์ของเครื่องมือเนทีฟของ Codex ใหม่ ขอบเขตการรองรับ runtime ของ Codex ที่แน่นอนอยู่ใน [สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness-runtime#v1-support-contract)

สำหรับพฤติกรรม hook แบบมีชนิดครบถ้วน โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) - ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [manifest ของ Plugin](/th/plugins/manifest) - สคีมา manifest
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) - เพิ่มเครื่องมือ agent ใน Plugin
- [ภายใน Plugin](/th/plugins/architecture) - โมเดลความสามารถและไปป์ไลน์การโหลด
- [ClawHub](/th/clawhub) - การค้นพบ Plugin ของบุคคลที่สาม
