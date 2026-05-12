---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจกฎการค้นพบและการโหลด Plugin
    - การทำงานกับบันเดิล Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:47:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ ได้แก่ ช่องทาง, ผู้ให้บริการโมเดล,
agent harnesses, เครื่องมือ, Skills, คำพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์,
การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ
และอื่น ๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ OpenClaw) ส่วนบางตัวเป็น
**external** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/clawhub) npm ยังคงรองรับสำหรับการติดตั้งโดยตรง และสำหรับชุดชั่วคราวของแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของระหว่างที่การย้ายนี้เสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้งแบบคัดลอกวาง การแสดงรายการ การถอนการติดตั้ง การอัปเดต และการเผยแพร่ โปรดดู
[จัดการ Plugin](/th/plugins/manage-plugins)

<Steps>
  <Step title="ดูว่ามีอะไรโหลดอยู่">
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

  <Step title="การจัดการในแชท">
    ใน Gateway ที่กำลังทำงานอยู่ `/plugins enable` และ `/plugins disable`
    สำหรับเจ้าของเท่านั้นจะเรียกตัวโหลด config ของ Gateway ใหม่ Gateway จะโหลดพื้นผิว runtime ของ Plugin ใหม่ในโปรเซส และรอบการทำงานใหม่ของ agent จะสร้างรายการเครื่องมือใหม่จาก registry ที่รีเฟรชแล้ว `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น Gateway จึงขอให้รีสตาร์ทแทนการแสร้งว่าโปรเซสปัจจุบันสามารถโหลดโมดูลที่ import ไปแล้วใหม่ได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ บริการ เมธอดของ Gateway
    hooks หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของซึ่งลงทะเบียนไว้ `inspect` แบบธรรมดาเป็นการตรวจสอบ manifest/registry แบบเย็น และตั้งใจหลีกเลี่ยงการ import runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการควบคุมในแชท ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: local path/archive, `clawhub:<pkg>` แบบระบุชัดเจน, `npm:<pkg>` แบบระบุชัดเจน, `npm-pack:<path.tgz>` แบบระบุชัดเจน,
`git:<repo>` แบบระบุชัดเจน หรือ bare package spec ผ่าน npm

หาก config ไม่ถูกต้อง การติดตั้งตามปกติจะ fail closed และชี้ให้คุณใช้
`openclaw doctor --fix` ข้อยกเว้นในการกู้คืนมีเพียงเส้นทาง reinstall แบบแคบสำหรับ bundled-plugin
ที่เลือกใช้ `openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config ที่ไม่ถูกต้องอื่น ๆ
เรียกใช้ `openclaw doctor --fix` เพื่อกักกัน config Plugin ที่เสีย โดยปิดใช้ entry ของ Plugin นั้นและลบ payload config ที่ไม่ถูกต้องออก backup config ปกติจะเก็บค่าก่อนหน้าไว้
เมื่อ config ช่องทางอ้างอิงถึง Plugin ที่ค้นพบไม่ได้แล้ว แต่ plugin id เก่าเดียวกันยังคงอยู่ใน config ของ Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway จะบันทึก warnings และข้ามช่องทางนั้นแทนการบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบ entry ช่องทาง/Plugin ที่เก่าออก; key ช่องทางที่ไม่รู้จักโดยไม่มีหลักฐาน stale-plugin จะยังคงไม่ผ่าน validation เพื่อให้เห็นการพิมพ์ผิดชัดเจน
หากตั้งค่า `plugins.enabled: false` ไว้ การอ้างอิง Plugin ที่เก่าจะถูกถือว่าไม่มีผล:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะเก็บ config Plugin ที่ปิดใช้อยู่ไว้แทนการลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อนรัน cleanup ของ doctor หากคุณต้องการลบ plugin ids ที่เก่าออก

การติดตั้ง dependency ของ Plugin จะเกิดขึ้นเฉพาะระหว่างโฟลว์ install/update หรือ repair ของ doctor ที่สั่งชัดเจนเท่านั้น การเริ่มต้น Gateway, การโหลด config ใหม่ และการตรวจสอบ runtime
จะไม่เรียก package managers หรือซ่อม dependency trees Plugin แบบ local ต้องติดตั้ง dependencies ไว้แล้ว ส่วน Plugin จาก npm, git และ ClawHub จะถูกติดตั้งภายใต้ managed plugin roots ของ OpenClaw dependencies ของ npm อาจถูก hoist ภายใน managed npm root ของ OpenClaw; install/update จะสแกน managed root นั้นก่อน trust และ uninstall จะลบแพ็กเกจที่จัดการโดย npm ผ่าน npm Plugin ภายนอกและ custom load paths ยังต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบ static ของ Plugin ที่มองเห็นแต่ละตัว โดยไม่ import runtime code หรือซ่อม dependencies
ดู [การ resolve dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ lifecycle ช่วง install-time

### ความเป็นเจ้าของ path ของ Plugin ที่ถูกบล็อก

หาก diagnostics ของ Plugin แจ้งว่า
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
และ config validation ตามด้วย `plugin present but blocked` แปลว่า OpenClaw พบไฟล์ Plugin ที่เป็นเจ้าของโดยผู้ใช้ Unix คนละคนกับโปรเซสที่กำลังโหลดไฟล์เหล่านั้น
ให้คง config ของ Plugin ไว้; แก้ไข ownership ของ filesystem หรือรัน
OpenClaw เป็นผู้ใช้เดียวกับที่เป็นเจ้าของ state directory

สำหรับการติดตั้ง Docker official image จะรันเป็น `node` (uid `1000`) ดังนั้น
ไดเรกทอรี config และ workspace ของ OpenClaw ที่ bind-mounted จาก host โดยปกติควรเป็นของ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

หากคุณตั้งใจรัน OpenClaw เป็น root ให้ซ่อม managed plugin root ให้เป็น
ownership ของ root แทน:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

หลังแก้ไข ownership แล้ว ให้รัน `openclaw doctor --fix` หรือ
`openclaw plugins registry --refresh` อีกครั้ง เพื่อให้ persisted plugin registry ตรงกับไฟล์ที่ซ่อมแล้ว

สำหรับการติดตั้ง npm selector ที่เปลี่ยนได้ เช่น `latest` หรือ dist-tag จะถูก resolve
ก่อนการติดตั้ง แล้วจึง pin เป็นเวอร์ชันที่ตรวจสอบแล้วแบบ exact ใน managed npm root ของ OpenClaw หลังจาก npm ทำงานเสร็จ OpenClaw จะตรวจสอบว่า entry ใน
`package-lock.json` ที่ติดตั้งยังตรงกับเวอร์ชันและ integrity ที่ resolve ไว้ หาก
npm เขียน metadata ของแพ็กเกจต่างออกไป การติดตั้งจะล้มเหลวและ managed package
จะถูกย้อนกลับแทนการยอมรับ artifact ของ Plugin ที่แตกต่าง
managed npm roots ยังสืบทอด npm `overrides` ระดับแพ็กเกจของ OpenClaw ดังนั้น
security pins ที่ปกป้อง packaged host จะมีผลกับ dependencies ของ Plugin ภายนอกที่ถูก hoist ด้วย

Source checkouts เป็น pnpm workspaces หากคุณ clone OpenClaw เพื่อแก้ไข bundled
plugins ให้รัน `pnpm install`; จากนั้น OpenClaw จะโหลด bundled plugins จาก
`extensions/<id>` เพื่อให้ใช้การแก้ไขและ dependencies ภายในแพ็กเกจโดยตรง
การติดตั้ง npm root แบบธรรมดามีไว้สำหรับ OpenClaw แบบ packaged ไม่ใช่สำหรับการพัฒนา source checkout

## ประเภทของ Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; ทำงานในโปรเซส       | Plugin ทางการ, แพ็กเกจ npm ของชุมชน               |
| **Bundle** | layout ที่เข้ากันได้กับ Codex/Claude/Cursor; map ไปยังฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียด bundle

หากคุณกำลังเขียน native Plugin ให้เริ่มจาก [การสร้าง Plugins](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Entrypoints ของแพ็กเกจ

แพ็กเกจ npm ของ native Plugin ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละ entry ต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve ไปยังไฟล์ runtime
ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี peer JavaScript ที่ build แล้วซึ่ง infer ได้ เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบ packaged ต้องมาพร้อม output runtime JavaScript นั้น fallback ของซอร์ส TypeScript
มีไว้สำหรับ source checkouts และ local development paths ไม่ใช่สำหรับแพ็กเกจ
npm ที่ติดตั้งลงใน managed plugin root ของ OpenClaw

ไดเรกทอรีที่ไม่ได้ track ซึ่งถูกวางลงใน global extension root จะถูกถือว่าเป็น
local source checkouts และอาจโหลด TypeScript entries ได้โดยตรง ไดเรกทอรีที่ยังคงถูกระบุโดย install record รวมถึง `installPath` หรือ `sourcePath` จะยังคงเป็น managed
และคงข้อกำหนด compiled-output แม้ global scan จะเห็นไดเรกทอรีเหล่านั้น หากคุณตั้งใจแปลง managed install เป็น untracked local
checkout ให้ลบ stale install record ก่อนด้วย uninstall หรือ cleanup ของ doctor

หากคำเตือนของ managed package ระบุว่า `requires compiled runtime output for
TypeScript entry ...` แปลว่าแพ็กเกจถูกเผยแพร่โดยไม่มีไฟล์ JavaScript ที่
OpenClaw ต้องใช้ใน runtime นั่นเป็นปัญหาการจัดแพ็กเกจ Plugin ไม่ใช่ปัญหา config
ในเครื่อง อัปเดตหรือติดตั้ง Plugin ใหม่หลังจาก publisher เผยแพร่ JavaScript
ที่ compile แล้วอีกครั้ง หรือปิดใช้/ถอนการติดตั้ง Plugin นั้นจนกว่าจะมีแพ็กเกจที่แก้ไขแล้ว

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ path
เดียวกับ source entries เมื่อมี `runtimeExtensions` ต้องมี entry หนึ่งรายการพอดีสำหรับทุก entry ของ `extensions` รายการที่ไม่ตรงกันจะทำให้ install และการค้นพบ Plugin ล้มเหลวแทนการ fallback ไปยัง source paths แบบเงียบ ๆ หากคุณเผยแพร่ `openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ peer JavaScript ที่ build แล้วของมัน; ไฟล์นั้นจำเป็นเมื่อประกาศไว้

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

ClawHub เป็นเส้นทางการกระจายหลักสำหรับ Plugin ส่วนใหญ่ OpenClaw รุ่น packaged
ปัจจุบัน bundle Plugin ทางการจำนวนมากไว้แล้ว ดังนั้นจึงไม่จำเป็นต้องติดตั้ง npm
แยกต่างหากในการตั้งค่าปกติ จนกว่า Plugin ที่ OpenClaw เป็นเจ้าของทั้งหมดจะย้ายไป
ClawHub แล้ว OpenClaw ยังจัดส่งแพ็กเกจ Plugin `@openclaw/*` บางรายการบน
npm สำหรับการติดตั้งเก่า/แบบกำหนดเอง และ workflow npm โดยตรง

หาก npm รายงานแพ็กเกจ Plugin `@openclaw/*` ว่า deprecated แปลว่าแพ็กเกจเวอร์ชันนั้นมาจาก external package train ที่เก่ากว่า ใช้ bundled plugin จาก
OpenClaw ปัจจุบันหรือ local checkout จนกว่าจะมีแพ็กเกจ npm ที่ใหม่กว่าเผยแพร่

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
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้งานตามค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` - การค้นหาหน่วยความจำแบบบันเดิล (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` - หน่วยความจำระยะยาวที่รองรับด้วย LanceDB พร้อมการเรียกคืน/จับข้อมูลอัตโนมัติ (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

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
| `allow`            | รายการอนุญาตของ Plugin (ไม่บังคับ)                               |
| `bundledDiscovery` | โหมดการค้นพบ Plugin แบบบันเดิล (`allowlist` ตามค่าเริ่มต้น)    |
| `deny`             | รายการปฏิเสธของ Plugin (ไม่บังคับ; deny มีลำดับความสำคัญสูงกว่า)                     |
| `load.paths`       | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`            | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>`   | สวิตช์เปิด/ปิด + การกำหนดค่าต่อ Plugin                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อไม่ว่าง จะโหลด
หรือเปิดเผยเครื่องมือได้เฉพาะ Plugin ที่ระบุไว้เท่านั้น แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือเฉพาะที่ Plugin เป็นเจ้าของ
ก็ตาม หากรายการอนุญาตเครื่องมืออ้างอิงเครื่องมือของ Plugin ให้เพิ่มรหัส Plugin เจ้าของ
ลงใน `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

`plugins.bundledDiscovery` มีค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้น
อินเวนทอรี `plugins.allow` ที่จำกัดก็จะบล็อก Plugin ผู้ให้บริการแบบบันเดิล
ที่ไม่ได้ระบุไว้ด้วย รวมถึงการค้นพบผู้ให้บริการค้นหาเว็บในรันไทม์ Doctor จะประทับตราการกำหนดค่า
รายการอนุญาตแบบจำกัดรุ่นเก่าด้วย `"compat"` ระหว่างการย้ายข้อมูล เพื่อให้การอัปเกรดยังคง
พฤติกรรมผู้ให้บริการแบบบันเดิลแบบเดิมไว้ จนกว่าผู้ปฏิบัติการจะเลือกใช้โหมดที่เข้มงวดกว่า
`plugins.allow` ที่ว่างยังคงถือว่าไม่ได้ตั้งค่า/เปิดอยู่

การเปลี่ยนแปลงการกำหนดค่าที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์
การโหลด Plugin ของ Gateway ใหม่ภายในโปรเซส เทิร์นใหม่ของเอเจนต์จะสร้างรายการเครื่องมือใหม่จาก
รีจิสทรี Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยนแหล่งที่มา เช่น install,
update และ uninstall ยังคงรีสตาร์ตโปรเซส Gateway เพราะโมดูล
Plugin ที่นำเข้าแล้วไม่สามารถแทนที่ในที่เดิมได้อย่างปลอดภัย

`openclaw plugins list` เป็นสแนปช็อตรีจิสทรี/การกำหนดค่า Plugin ภายในเครื่อง
Plugin ที่ `enabled` อยู่ในนั้นหมายความว่ารีจิสทรีที่คงอยู่และการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังทำงานอยู่
ได้โหลดใหม่หรือรีสตาร์ตเป็นโค้ด Plugin เดียวกันแล้ว ในการตั้งค่า VPS/คอนเทนเนอร์
ที่มีกระบวนการ wrapper ให้ส่งการรีสตาร์ตหรือการเขียนที่ทริกเกอร์การโหลดใหม่ไปยังโปรเซส
`openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ
Gateway ที่กำลังทำงานเมื่อการโหลดใหม่รายงานความล้มเหลว

<Accordion title="สถานะ Plugin: ปิดใช้งาน เทียบกับ ขาดหาย เทียบกับ ไม่ถูกต้อง">
  - **ปิดใช้งาน**: Plugin มีอยู่ แต่กฎการเปิดใช้งานปิดไว้ การกำหนดค่าจะถูกเก็บรักษาไว้
  - **ขาดหาย**: การกำหนดค่าอ้างอิงรหัส Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: Plugin มีอยู่ แต่การกำหนดค่าของมันไม่ตรงกับสคีมาที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักรายการที่ไม่ถูกต้องได้โดยปิดใช้งานและลบเพย์โหลดการกำหนดค่าของรายการนั้น

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงกันจะชนะ):

<Steps>
  <Step title="พาธการกำหนดค่า">
    `plugins.load.paths` - พาธไฟล์หรือไดเรกทอรีแบบชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี Plugin แบบบันเดิลที่แพ็กเกจของ OpenClaw เองจะถูกละเว้น;
    เรียกใช้ `openclaw doctor --fix` เพื่อลบนามแฝงเก่าเหล่านั้น
  </Step>

  <Step title="Plugin ในเวิร์กสเปซ">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบบันเดิล">
    จัดส่งมาพร้อมกับ OpenClaw หลายรายการเปิดใช้งานตามค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะแก้ตำแหน่ง Plugin แบบบันเดิลจาก
ทรี `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin แบบบันเดิลถูก
bind-mounted ทับพาธซอร์สแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรีซอร์สที่เมานต์นั้น
เป็น overlay ซอร์สแบบบันเดิล และค้นพบก่อนบันเดิล
`/app/dist/extensions/synology-chat` แบบแพ็กเกจ วิธีนี้ช่วยให้ลูปคอนเทนเนอร์ของผู้ดูแล
ทำงานต่อได้โดยไม่ต้องสลับ Plugin แบบบันเดิลทุกตัวกลับไปเป็นซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist แบบแพ็กเกจ
แม้เมื่อมีการเมานต์ overlay ซอร์สอยู่

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นพบ/โหลด Plugin
- `plugins.deny` มีลำดับความสำคัญสูงกว่า allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มาจากเวิร์กสเปซจะ **ปิดใช้งานตามค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin แบบบันเดิลทำตามชุดค่าเริ่มต้นที่เปิดอยู่ในตัว เว้นแต่จะถูกแทนที่
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin แบบบันเดิลบางตัวที่ต้องเลือกใช้จะเปิดใช้งานโดยอัตโนมัติเมื่อการกำหนดค่าระบุ
  พื้นผิวที่ Plugin เป็นเจ้าของ เช่น ref โมเดลของผู้ให้บริการ, การกำหนดค่าแชนเนล หรือรันไทม์
  harness
- การกำหนดค่า Plugin เก่าจะถูกเก็บรักษาไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนเรียกใช้การล้างข้อมูลของ doctor หากคุณต้องการลบรหัสเก่า
- เส้นทาง Codex ตระกูล OpenAI คงขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ขณะที่ Plugin app-server Codex แบบบันเดิล
  จะถูกเลือกโดย ref เอเจนต์ `openai/*` แบบมาตรฐาน, provider/model
  `agentRuntime.id: "codex"` แบบชัดเจน หรือ ref โมเดล `codex/*` แบบเดิม

## การแก้ไขปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hook ของ `register(api)`
ไม่ทำงานในการรับส่งข้อมูลแชทจริง ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- เรียกใช้ `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL ของ
  Gateway ที่ใช้งานอยู่, โปรไฟล์, พาธการกำหนดค่า และโปรเซสเป็นรายการที่คุณกำลังแก้ไข
- รีสตาร์ต Gateway จริงหลังจากการเปลี่ยนแปลงการติดตั้ง/การกำหนดค่า/โค้ดของ Plugin ในคอนเทนเนอร์
  wrapper PID 1 อาจเป็นเพียง supervisor; รีสตาร์ตหรือส่งสัญญาณไปยังโปรเซสลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  diagnostics hook การสนทนาที่ไม่ใช่แบบบันเดิล เช่น `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` และ `agent_end` ต้องมี
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ควรใช้ `before_model_resolve` มันทำงานก่อนการแก้โมเดล
  สำหรับเทิร์นของเอเจนต์; `llm_output` ทำงานหลังจากความพยายามใช้โมเดล
  สร้างเอาต์พุตของผู้ช่วยแล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผลจริง ให้ใช้ `openclaw sessions` หรือพื้นผิว
  เซสชัน/สถานะของ Gateway และเมื่อดีบักเพย์โหลดผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หากเทิร์นของเอเจนต์ดูเหมือนค้างระหว่างเตรียมเครื่องมือ ให้เปิดใช้งานการบันทึก trace และ
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
รวมถึงรหัส Plugin, ชื่อเครื่องมือที่ประกาศ, รูปแบบผลลัพธ์ และว่าเครื่องมือเป็น
แบบไม่บังคับหรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory หนึ่งรายการใช้เวลา
อย่างน้อย 1 วินาที หรือการเตรียม factory เครื่องมือ Plugin ทั้งหมดใช้เวลาอย่างน้อย 5 วินาที

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการแก้ซ้ำ
ด้วยบริบทคำขอที่มีผลจริงเหมือนกัน คีย์แคชรวมถึงการกำหนดค่ารันไทม์
ที่มีผลจริง, เวิร์กสเปซ, รหัสเอเจนต์/เซสชัน, นโยบาย sandbox, การตั้งค่าเบราว์เซอร์,
บริบทการส่งมอบ, อัตลักษณ์ผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่
ขึ้นกับฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกเรียกใช้ใหม่เมื่อบริบทเปลี่ยน

หาก Plugin หนึ่งรายการครองเวลาเป็นส่วนใหญ่ ให้ตรวจสอบการลงทะเบียนรันไทม์ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้หลังพาธการเรียกใช้เครื่องมือ แทนที่จะทำภายใน
factory ของเครื่องมือ

### การเป็นเจ้าของแชนเนลหรือเครื่องมือซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้งานมากกว่าหนึ่งรายการพยายามเป็นเจ้าของแชนเนล
โฟลว์การตั้งค่า หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin แชนเนลภายนอก
ถูกติดตั้งไว้ข้าง Plugin แบบบันเดิลที่ตอนนี้ให้รหัสแชนเนลเดียวกัน

ขั้นตอนดีบัก:

- เรียกใช้ `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และแหล่งที่มา
- เรียกใช้ `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- เรียกใช้ `openclaw plugins registry --refresh` หลังจากติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้ metadata ที่คงอยู่สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ต Gateway หลังการเปลี่ยนแปลงการติดตั้ง, รีจิสทรี หรือการกำหนดค่า

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจจะแทนที่อีกตัวสำหรับรหัสแชนเนลเดียวกัน Plugin ที่ต้องการ
  ควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  รหัส Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากความซ้ำกันเกิดขึ้นโดยไม่ตั้งใจ ให้ปิดใช้งานด้านหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin เก่า
- หากคุณเปิดใช้งานทั้งสอง Plugin อย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานข้อขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับแชนเนล หรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
  เพื่อให้พื้นผิวรันไทม์ไม่กำกวม

## สล็อต Plugin (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (ใช้งานได้ครั้งละหนึ่งรายการเท่านั้น):

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
| `contextEngine` | เครื่องมือบริบทที่ใช้งานอยู่ | `legacy` (ในตัว) |

## ข้อมูลอ้างอิง CLI

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

Plugin ที่รวมมาให้มาพร้อมกับ OpenClaw หลายรายการถูกเปิดใช้งานตามค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลที่รวมมาให้ ผู้ให้บริการเสียงพูดที่รวมมาให้ และ Plugin เบราว์เซอร์ที่รวมมาให้)
Plugin ที่รวมมาให้บางรายการยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วแบบแทนที่เดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ Plugin npm
ที่มีการติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งจะนำ path ต้นทางมาใช้ซ้ำแทน
การคัดลอกไปยังเป้าหมายการติดตั้งที่จัดการไว้

เมื่อมีการตั้งค่า `plugins.allow` ไว้อยู่แล้ว `openclaw plugins install` จะเพิ่ม
id ของ Plugin ที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้งาน หาก id ของ Plugin เดียวกัน
อยู่ใน `plugins.deny` การติดตั้งจะลบรายการ deny ที่ค้างอยู่นั้นออก เพื่อให้การติดตั้ง
ที่ระบุชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin ภายในเครื่องแบบ persisted ไว้เป็นโมเดล cold read สำหรับ
คลัง Plugin ความเป็นเจ้าของ contribution และการวางแผนเริ่มต้นระบบ โฟลว์ install, update,
uninstall, enable และ disable จะรีเฟรชรีจิสทรีนั้นหลังจากเปลี่ยนสถานะ Plugin ไฟล์
`plugins/installs.json` เดียวกันจะเก็บ metadata การติดตั้งที่คงทนไว้ใน `installRecords`
ระดับบนสุด และ metadata ของ manifest ที่สร้างใหม่ได้ไว้ใน `plugins` หากรีจิสทรีหายไป
ล้าสมัย หรือไม่ถูกต้อง `openclaw plugins registry --refresh` จะสร้างมุมมอง manifest
ขึ้นใหม่จาก install records, config policy และ metadata ของ manifest/package โดยไม่โหลด
โมดูล runtime ของ Plugin

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวปรับเปลี่ยน lifecycle ของ Plugin จะถูกปิดใช้งาน
ให้จัดการการเลือก package และ config ของ Plugin ผ่านซอร์ส Nix สำหรับการติดตั้งแทน
สำหรับ nix-openclaw ให้เริ่มจาก
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่มีการติดตามอยู่ การส่ง
npm package spec พร้อม dist-tag หรือเวอร์ชันแบบเจาะจงจะ resolve ชื่อ package กลับไปยัง
record ของ Plugin ที่ติดตามอยู่ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต การส่งชื่อ
package โดยไม่มีเวอร์ชันจะย้ายการติดตั้งแบบ pinned เจาะจงกลับไปยัง release line เริ่มต้น
ของรีจิสทรี หาก Plugin npm ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่ resolve แล้วและตัวตนของ artifact
ที่บันทึกไว้ OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่องทาง beta record ของ Plugin npm และ ClawHub ที่อยู่ใน
default-line จะลอง `@beta` ก่อน และ fallback ไปยัง default/latest เมื่อไม่มี beta release
ของ Plugin เวอร์ชันแบบเจาะจงและ tag ที่ระบุชัดเจนจะยังคง pinned อยู่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับการใช้ร่วมกับ `--marketplace` เพราะการติดตั้งจาก
marketplace จะ persist metadata ของซอร์ส marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็น override สำหรับกรณีฉุกเฉินเมื่อ scanner
ตรวจโค้ดอันตรายในตัวให้ผลบวกลวง อนุญาตให้การติดตั้ง Plugin และการอัปเดต Plugin
ดำเนินต่อหลังพบผล `critical` ในตัว แต่ยังไม่ข้ามการบล็อกตาม policy `before_install`
ของ Plugin หรือการบล็อกเมื่อการ scan ล้มเหลว การ scan ตอนติดตั้งจะละเว้นไฟล์และไดเรกทอรี
ทดสอบทั่วไป เช่น `tests/`, `__tests__/`, `*.test.*` และ `*.spec.*` เพื่อเลี่ยงการบล็อก
test mock ที่ถูก package มา แต่ entrypoint runtime ของ Plugin ที่ประกาศไว้จะยังถูก scan
แม้จะใช้ชื่อหนึ่งในรูปแบบเหล่านั้น

flag ของ CLI นี้ใช้กับโฟลว์ install/update ของ Plugin เท่านั้น การติดตั้ง dependency ของ
skill ที่อาศัย Gateway จะใช้ request override `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน
ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill ของ ClawHub ที่แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกจากการ scan ให้เปิดแดชบอร์ด
ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบอีกครั้ง
`--dangerously-force-unsafe-install` มีผลเฉพาะกับการติดตั้งบนเครื่องของคุณเองเท่านั้น
ไม่ได้ขอให้ ClawHub scan Plugin ใหม่ หรือทำให้ release ที่ถูกบล็อกเผยแพร่สู่สาธารณะ

bundle ที่เข้ากันได้จะเข้าร่วมในโฟลว์ list/inspect/enable/disable ของ Plugin เดียวกัน
การรองรับ runtime ปัจจุบันรวมถึง bundle skills, Claude command-skills, ค่าเริ่มต้น
`settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศ
ใน manifest, Cursor command-skills และไดเรกทอรี hook ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของ bundle ที่ตรวจพบ รวมถึงรายการ
MCP และ LSP server ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มี bundle รองรับ

ซอร์ส marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, marketplace root ภายในเครื่องหรือ path
`marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git
สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มา
และใช้ซอร์ส path แบบสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [ข้อมูลอ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Plugin แบบ native จะ export entry object ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
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

OpenClaw โหลด entry object และเรียก `register(api)` ระหว่างการ activation ของ Plugin
loader ยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่รวมมาให้
และ Plugin ภายนอกใหม่ควรมอง `register` เป็นสัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่าทำไม entry ของมันจึงถูกโหลด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การ activation ของ runtime ลงทะเบียน tools, hooks, services, commands, routes และผลข้างเคียงแบบ live อื่น ๆ                              |
| `discovery`     | การค้นพบ capability แบบอ่านอย่างเดียว ลงทะเบียน providers และ metadata; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ให้ข้ามผลข้างเคียงแบบ live |
| `setup-only`    | การโหลด metadata สำหรับการตั้งค่า channel ผ่าน setup entry แบบเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่า channel ที่ต้องใช้ runtime entry ด้วย                                                                         |
| `cli-metadata`  | การรวบรวม metadata ของคำสั่ง CLI เท่านั้น                                                                                            |

entry ของ Plugin ที่เปิด sockets, databases, background workers หรือ clients ที่มีอายุยาว
ควรป้องกันผลข้างเคียงเหล่านั้นด้วย `api.registrationMode === "full"` การโหลด discovery
ถูก cache แยกจากการโหลด activation และไม่แทนที่รีจิสทรี Gateway ที่กำลังทำงานอยู่
Discovery เป็นแบบไม่ activation แต่ไม่ใช่แบบไม่ import: OpenClaw อาจ evaluate entry ของ
Plugin ที่เชื่อถือได้หรือโมดูล Plugin ของ channel เพื่อสร้าง snapshot ให้คง top level
ของโมดูลให้เบาและไม่มีผลข้างเคียง และย้าย network clients, subprocesses, listeners,
การอ่าน credential และการเริ่ม service ไปไว้หลัง path แบบ full-runtime

เมธอด registration ที่พบบ่อย:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)        |
| `registerChannel`                       | ช่องแชท                |
| `registerTool`                          | เครื่องมือของ agent                  |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | เสียงเรียลไทม์แบบ duplex       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Background service          |

พฤติกรรม hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

เซิร์ฟเวอร์แอป Codex แบบเนทีฟจะรันบริดจ์เหตุการณ์เครื่องมือแบบเนทีฟของ Codex กลับเข้าสู่พื้นผิว hook นี้ Plugin สามารถบล็อกเครื่องมือ Codex แบบเนทีฟผ่าน `before_tool_call` สังเกตผลลัพธ์ผ่าน `after_tool_call` และมีส่วนร่วมในการอนุมัติ `PermissionRequest` ของ Codex ได้ บริดจ์ยังไม่เขียนอาร์กิวเมนต์ของเครื่องมือแบบเนทีฟของ Codex ใหม่ ขอบเขตการรองรับรันไทม์ Codex ที่แน่นอนอยู่ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness-runtime#v1-support-contract)

สำหรับพฤติกรรม hook ที่มีชนิดข้อมูลครบถ้วน โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) - ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [manifest ของ Plugin](/th/plugins/manifest) - สคีมา manifest
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) - เพิ่มเครื่องมือเอเจนต์ใน Plugin
- [ภายในของ Plugin](/th/plugins/architecture) - โมเดลความสามารถและไปป์ไลน์การโหลด
- [ClawHub](/th/clawhub) - การค้นพบ Plugin ของบุคคลที่สาม
