---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับบันเดิล Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugins ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
ชุดควบคุม agent, เครื่องมือ, Skills, เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียง
แบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างรูปภาพ, การสร้างวิดีโอ, การดึงเว็บ,
การค้นหาเว็บ และอื่น ๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ OpenClaw) ส่วนบางตัว
เป็น **ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) ยังรองรับ Npm สำหรับการติดตั้งโดยตรงและสำหรับชุดชั่วคราว
ของแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของระหว่างที่การย้ายนี้เสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้ง คัดลอก-วาง แสดงรายการ ถอนการติดตั้ง อัปเดต และเผยแพร่ ดู
[จัดการ plugins](/th/plugins/manage-plugins)

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    จากนั้นกำหนดค่าใต้ `plugins.entries.\<id\>.config` ในไฟล์ config ของคุณ

  </Step>

  <Step title="Chat-native management">
    ใน Gateway ที่กำลังทำงานอยู่ `/plugins enable` และ `/plugins disable` สำหรับเจ้าของเท่านั้น
    จะทริกเกอร์ตัวโหลด config ใหม่ของ Gateway โดย Gateway จะโหลดพื้นผิว runtime ของ Plugin
    ใหม่ในโปรเซส และ agent turn ใหม่จะสร้างรายการเครื่องมือใหม่จาก registry ที่รีเฟรชแล้ว
    `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น Gateway จะขอให้รีสตาร์ทแทนการแสร้งว่า
    โปรเซสปัจจุบันสามารถโหลดโมดูลที่นำเข้าแล้วใหม่ได้อย่างปลอดภัย

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ บริการ เมธอด gateway,
    hooks หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของซึ่งลงทะเบียนไว้ `inspect` แบบปกติเป็นการตรวจสอบ
    manifest/registry แบบเย็น และจงใจหลีกเลี่ยงการนำเข้า runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการการควบคุมแบบ chat-native ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: path/archive ภายในเครื่อง, `clawhub:<pkg>` แบบระบุชัดเจน,
`npm:<pkg>` แบบระบุชัดเจน, `git:<repo>` แบบระบุชัดเจน หรือ spec แพ็กเกจแบบเปล่าผ่าน npm

หาก config ไม่ถูกต้อง โดยปกติการติดตั้งจะ fail closed และชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นสำหรับการกู้คืนมีเพียงเส้นทาง reinstall ของ bundled-plugin
แบบแคบสำหรับ plugins ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway, config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config ที่ไม่ถูกต้องอื่น ๆ
ให้เรียกใช้ `openclaw doctor --fix` เพื่อ quarantine config ของ Plugin ที่เสีย โดย
ปิดใช้ entry ของ Plugin นั้นและลบ payload config ที่ไม่ถูกต้องออก; backup config ปกติจะเก็บค่าก่อนหน้าไว้
เมื่อ config ของช่องทางอ้างถึง Plugin ที่ค้นพบไม่ได้อีกต่อไป แต่ stale plugin id เดียวกัน
ยังอยู่ใน config ของ Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway จะบันทึกคำเตือนและข้ามช่องทางนั้น
แทนที่จะบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบ entry ของช่องทาง/Plugin ที่ค้างอยู่; key ช่องทางที่ไม่รู้จัก
ซึ่งไม่มีหลักฐาน stale-plugin จะยังคง fail validation เพื่อให้ typo ยังมองเห็นได้
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin ที่ค้างอยู่จะถูกมองว่า inert:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะเก็บ
config ของ Plugin ที่ถูกปิดใช้ไว้แทนการลบอัตโนมัติ เปิดใช้ plugins อีกครั้งก่อน
เรียกใช้ doctor cleanup หากคุณต้องการลบ stale plugin ids

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่าง flow ติดตั้ง/อัปเดตแบบระบุชัดเจน หรือ
การซ่อมด้วย doctor เท่านั้น การเริ่มต้น Gateway, การโหลด config ใหม่ และการตรวจ runtime
จะไม่เรียก package managers หรือซ่อม dependency trees Plugin ภายในเครื่องต้องติดตั้ง
dependencies ไว้แล้ว ส่วน plugins จาก npm, git และ ClawHub จะถูกติดตั้งใต้ managed plugin roots ของ OpenClaw
dependencies ของ npm อาจถูก hoist ภายใน managed npm root ของ OpenClaw; install/update จะสแกน managed root นั้นก่อน
trust และ uninstall จะลบแพ็กเกจที่ npm จัดการผ่าน npm Plugin ภายนอก
และ custom load paths ยังต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบ static สำหรับ Plugin
ที่มองเห็นแต่ละตัว โดยไม่นำเข้า runtime code หรือซ่อม dependencies
ดู [การ resolve dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ
วงจรชีวิตขณะติดตั้ง

สำหรับการติดตั้งผ่าน npm ตัวเลือกแบบเปลี่ยนแปลงได้ เช่น `latest` หรือ dist-tag จะถูก resolve
ก่อนการติดตั้ง แล้วจึง pin ไปยังเวอร์ชันที่ตรวจสอบแล้วแน่นอนใน managed npm root ของ OpenClaw
หลังจาก npm เสร็จ OpenClaw จะตรวจสอบว่า entry ใน
`package-lock.json` ที่ติดตั้งยังตรงกับเวอร์ชันและ integrity ที่ resolve ไว้ หาก
npm เขียน metadata ของแพ็กเกจต่างออกไป การติดตั้งจะล้มเหลวและ managed package
จะถูก rollback แทนที่จะยอมรับ artifact ของ Plugin ที่ต่างออกไป

source checkouts เป็น pnpm workspaces หากคุณ clone OpenClaw เพื่อแก้ไข bundled
plugins ให้เรียกใช้ `pnpm install`; จากนั้น OpenClaw จะโหลด bundled plugins จาก
`extensions/<id>` เพื่อให้ใช้ edits และ dependencies ภายในแพ็กเกจโดยตรง
การติดตั้ง npm root แบบปกติมีไว้สำหรับ OpenClaw แบบแพ็กเกจ ไม่ใช่การพัฒนา
source checkout

## ประเภท Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + โมดูล runtime; ดำเนินการในโปรเซส       | Plugin ทางการ, แพ็กเกจ npm จากชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปเป็นฟีเจอร์ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงใต้ `openclaw plugins list` ดูรายละเอียด bundle ได้ที่ [Plugin Bundles](/th/plugins/bundles)

หากคุณกำลังเขียน Plugin แบบ native ให้เริ่มที่ [การสร้าง Plugins](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Entrypoints ของแพ็กเกจ

แพ็กเกจ npm ของ Plugin แบบ native ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละ entry ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ และ resolve ไปยังไฟล์ runtime
ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี JavaScript peer ที่ build แล้วซึ่ง infer ได้
เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบแพ็กเกจต้องส่งออก runtime JavaScript นั้นมาด้วย fallback ไปยังซอร์ส TypeScript
มีไว้สำหรับ source checkouts และ path การพัฒนาภายในเครื่อง ไม่ใช่สำหรับ
แพ็กเกจ npm ที่ติดตั้งลงใน managed plugin root ของ OpenClaw

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ที่
path เดียวกับ source entries เมื่อมี `runtimeExtensions` ต้องมี
หนึ่ง entry พอดีสำหรับทุก entry ใน `extensions` รายการที่ไม่ตรงกันจะทำให้การติดตั้งและ
การค้นพบ Plugin ล้มเหลว แทนที่จะ fallback ไปยัง source paths อย่างเงียบ ๆ หากคุณ
เผยแพร่ `openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ JavaScript peer
ที่ build แล้วของมัน; ไฟล์นั้นจำเป็นเมื่อประกาศไว้

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

### แพ็กเกจ npm ที่ OpenClaw เป็นเจ้าของระหว่างการย้าย

ClawHub เป็นเส้นทางกระจายหลักสำหรับ plugins ส่วนใหญ่ release ของ OpenClaw แบบแพ็กเกจปัจจุบัน
bundle plugins ทางการไว้แล้วจำนวนมาก ดังนั้นจึงไม่จำเป็นต้องติดตั้ง npm แยกต่างหาก
ใน setup ปกติ จนกว่า Plugin ทั้งหมดที่ OpenClaw เป็นเจ้าของจะ
ย้ายไปยัง ClawHub แล้ว OpenClaw ยังส่งบางแพ็กเกจ Plugin `@openclaw/*` บน
npm สำหรับการติดตั้งแบบเก่า/กำหนดเอง และ workflow npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` เป็น deprecated แสดงว่าแพ็กเกจ
เวอร์ชันนั้นมาจาก train แพ็กเกจภายนอกที่เก่ากว่า ใช้ bundled plugin จาก
OpenClaw ปัจจุบัน หรือ checkout ภายในเครื่องจนกว่าจะเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

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
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — การค้นหา memory ที่ bundle มา (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — memory ระยะยาวที่มี LanceDB รองรับ พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI,
    ตัวอย่าง Ollama, ขีดจำกัด recall และการแก้ไขปัญหา

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — Plugin browser ที่ bundle มาสำหรับเครื่องมือ browser, CLI `openclaw browser`, เมธอด gateway `browser.request`, runtime browser และบริการควบคุม browser เริ่มต้น (เปิดใช้ตามค่าเริ่มต้น; ปิดใช้ก่อนแทนที่)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (ปิดใช้ตามค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา plugins จากบุคคลที่สามใช่ไหม ดู [Community Plugins](/th/plugins/community)

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
| `allow`          | รายการอนุญาตของ Plugin (ไม่บังคับ)                               |
| `deny`           | รายการปฏิเสธของ Plugin (ไม่บังคับ; รายการปฏิเสธมีสิทธิ์เหนือกว่า)                     |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`          | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | สวิตช์เปิด/ปิดและการกำหนดค่าต่อ Plugin                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อไม่ว่างเปล่า เฉพาะ Plugin ที่อยู่ในรายการเท่านั้นที่โหลด
หรือเปิดเผยเครื่องมือได้ แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือเฉพาะที่เป็นของ Plugin
ก็ตาม หากรายการอนุญาตเครื่องมืออ้างอิงเครื่องมือของ Plugin ให้เพิ่มรหัส Plugin เจ้าของ
ลงใน `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

การเปลี่ยนแปลงการกำหนดค่าที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์
การโหลด Plugin ของ Gateway ใหม่ภายในโปรเซส เทิร์นใหม่ของเอเจนต์จะสร้างรายการเครื่องมือใหม่จาก
รีจิสทรี Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยนซอร์ส เช่น การติดตั้ง
การอัปเดต และการถอนการติดตั้ง ยังต้องรีสตาร์ตโปรเซส Gateway เพราะโมดูล Plugin
ที่นำเข้าแล้วไม่สามารถแทนที่ในที่เดิมได้อย่างปลอดภัย

`openclaw plugins list` คือสแนปช็อตรีจิสทรี/การกำหนดค่า Plugin ภายในเครื่อง
Plugin ที่เป็น `enabled` ที่นั่นหมายความว่ารีจิสทรีที่คงอยู่และการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังทำงานอยู่
ได้โหลดใหม่หรือรีสตาร์ตเข้าสู่โค้ด Plugin เดียวกันแล้ว บนการตั้งค่า VPS/คอนเทนเนอร์
ที่มีโปรเซสตัวห่อ ให้ส่งการรีสตาร์ตหรือการเขียนที่ทริกเกอร์การโหลดใหม่ไปยังโปรเซส
`openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ
Gateway ที่กำลังทำงานอยู่เมื่อการโหลดใหม่รายงานความล้มเหลว

<Accordion title="สถานะ Plugin: ปิดใช้งาน vs ขาดหาย vs ไม่ถูกต้อง">
  - **ปิดใช้งาน**: มี Plugin อยู่ แต่กฎการเปิดใช้งานปิดไว้ การกำหนดค่าถูกเก็บรักษาไว้
  - **ขาดหาย**: การกำหนดค่าอ้างอิงรหัส Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: มี Plugin อยู่ แต่การกำหนดค่าไม่ตรงกับสคีมาที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักรายการที่ไม่ถูกต้องได้โดยปิดใช้งานและลบเพย์โหลดการกำหนดค่าของรายการนั้น

</Accordion>

## การค้นหาและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการที่ตรงกันแรกมีสิทธิ์ก่อน):

<Steps>
  <Step title="เส้นทางการกำหนดค่า">
    `plugins.load.paths` — เส้นทางไฟล์หรือไดเรกทอรีที่ระบุอย่างชัดเจน เส้นทางที่ชี้
    กลับไปยังไดเรกทอรี Plugin แบบบันเดิลที่แพ็กมากับ OpenClaw เองจะถูกละเว้น;
    เรียกใช้ `openclaw doctor --fix` เพื่อลบนามแฝงเก่าเหล่านั้น
  </Step>

  <Step title="Plugin ในเวิร์กสเปซ">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบบันเดิล">
    จัดส่งมากับ OpenClaw หลายรายการเปิดใช้งานตามค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะแก้ตำแหน่ง Plugin แบบบันเดิลจากทรี
`dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin แบบบันเดิลถูก
bind-mounted ทับเส้นทางซอร์สแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat`, OpenClaw จะถือว่าไดเรกทอรีซอร์สที่เมาต์นั้น
เป็นโอเวอร์เลย์ซอร์สแบบบันเดิล และค้นพบก่อนบันเดิลแพ็กเกจ
`/app/dist/extensions/synology-chat` วิธีนี้ทำให้ลูปคอนเทนเนอร์ของผู้ดูแล
ยังทำงานได้โดยไม่ต้องสลับ Plugin แบบบันเดิลทุกตัวกลับไปเป็นซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist ที่แพ็กมา
แม้จะมีการเมาต์โอเวอร์เลย์ซอร์สอยู่

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นหา/โหลด Plugin
- `plugins.deny` มีสิทธิ์เหนือกว่า allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจากเวิร์กสเปซจะ **ปิดใช้งานตามค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin แบบบันเดิลจะทำตามชุดค่าเริ่มต้นเปิดในตัว เว้นแต่ถูกแทนที่
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin แบบบันเดิลบางรายการที่ต้องเลือกใช้จะเปิดใช้งานโดยอัตโนมัติเมื่อการกำหนดค่าระบุ
  พื้นผิวที่เป็นของ Plugin เช่น การอ้างอิงโมเดลผู้ให้บริการ การกำหนดค่าช่องทาง หรือรันไทม์
  harness
- การกำหนดค่า Plugin เก่าจะถูกเก็บรักษาไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนเรียกใช้การล้างข้อมูลของ doctor หากต้องการลบรหัสเก่า
- เส้นทาง Codex ตระกูล OpenAI จะรักษาขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ขณะที่ Plugin app-server Codex แบบบันเดิล
  จะถูกเลือกโดย `agentRuntime.id: "codex"` หรือการอ้างอิงโมเดลเดิม
  `codex/*`

## การแก้ปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ผลข้างเคียงหรือ hook ของ `register(api)`
ไม่ทำงานในทราฟฟิกแชตสด ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- เรียกใช้ `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL
  Gateway ที่ใช้งานอยู่ โปรไฟล์ เส้นทางการกำหนดค่า และโปรเซสเป็นรายการที่คุณกำลังแก้ไข
- รีสตาร์ต Gateway สดหลังการเปลี่ยนแปลงการติดตั้ง/การกำหนดค่า/โค้ดของ Plugin ในคอนเทนเนอร์
  ตัวห่อ PID 1 อาจเป็นเพียง supervisor; รีสตาร์ตหรือส่งสัญญาณไปยังโปรเซสลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  การวินิจฉัย hook การสนทนาที่ไม่ใช่แบบบันเดิล เช่น `llm_input`,
  `llm_output`, `before_agent_finalize`, และ `agent_end` ต้องมี
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้เลือกใช้ `before_model_resolve` เพราะทำงานก่อนการแก้โมเดล
  สำหรับเทิร์นของเอเจนต์; `llm_output` ทำงานหลังจากความพยายามใช้โมเดล
  สร้างเอาต์พุตผู้ช่วยแล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผล ให้ใช้ `openclaw sessions` หรือพื้นผิว
  เซสชัน/สถานะของ Gateway และเมื่อดีบักเพย์โหลดของผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หากเทิร์นของเอเจนต์ดูเหมือนหยุดค้างขณะเตรียมเครื่องมือ ให้เปิดใช้งานการบันทึกระดับ trace และ
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
รวมถึงรหัส Plugin ชื่อเครื่องมือที่ประกาศ รูปแบบผลลัพธ์ และเครื่องมือนั้นเป็น
แบบไม่บังคับหรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory เดียวใช้เวลา
อย่างน้อย 1 วินาที หรือการเตรียม factory เครื่องมือ Plugin ทั้งหมดใช้เวลาอย่างน้อย 5 วินาที

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการแก้ซ้ำ
ด้วยบริบทคำขอที่มีผลเหมือนกัน คีย์แคชรวมการกำหนดค่ารันไทม์ที่มีผล
เวิร์กสเปซ รหัสเอเจนต์/เซสชัน นโยบาย sandbox การตั้งค่าเบราว์เซอร์
บริบทการส่งมอบ ตัวตนผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่
พึ่งพาฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกเรียกใช้อีกครั้งเมื่อบริบทเปลี่ยน

หาก Plugin หนึ่งครองเวลาเป็นส่วนใหญ่ ให้ตรวจสอบการลงทะเบียนรันไทม์ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้หลังเส้นทางการเรียกใช้เครื่องมือ แทนที่จะทำ
ภายใน factory เครื่องมือ

### ความเป็นเจ้าของช่องทางหรือเครื่องมือซ้ำ

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้งานมากกว่าหนึ่งตัวพยายามเป็นเจ้าของช่องทางเดียวกัน
โฟลว์การตั้งค่าเดียวกัน หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin ช่องทางภายนอก
ถูกติดตั้งไว้ข้าง Plugin แบบบันเดิลที่ตอนนี้ให้รหัสช่องทางเดียวกัน

ขั้นตอนดีบัก:

- เรียกใช้ `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และต้นทาง
- เรียกใช้ `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools`, และการวินิจฉัย
- เรียกใช้ `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้ metadata ที่คงอยู่สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ต Gateway หลังการเปลี่ยนแปลงการติดตั้ง รีจิสทรี หรือการกำหนดค่า

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีกตัวสำหรับรหัสช่องทางเดียวกัน
  Plugin ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` ด้วย
  รหัส Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากความซ้ำซ้อนเกิดขึ้นโดยไม่ตั้งใจ ให้ปิดใช้งานด้านหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin เก่า
- หากคุณเปิดใช้งาน Plugin ทั้งสองอย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานความขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับช่องทาง หรือเปลี่ยนชื่อเครื่องมือที่เป็นของ Plugin
  เพื่อให้พื้นผิวรันไทม์ไม่กำกวม

## สล็อต Plugin (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (เปิดใช้งานได้ครั้งละหนึ่งรายการเท่านั้น):

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
| `memory`        | Plugin Active Memory  | `memory-core`       |
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

Plugin ที่มาพร้อมจะถูกจัดส่งพร้อม OpenClaw หลายรายการเปิดใช้งานเป็นค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลที่มาพร้อม, ผู้ให้บริการเสียงพูดที่มาพร้อม และ Plugin เบราว์เซอร์
ที่มาพร้อม) Plugin ที่มาพร้อมรายการอื่นยังคงต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือแพ็กฮุกที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ Plugin npm
ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งนำพาธซอร์สกลับมาใช้ซ้ำแทน
การคัดลอกทับเป้าหมายการติดตั้งที่จัดการไว้

เมื่อกำหนด `plugins.allow` ไว้แล้ว `openclaw plugins install` จะเพิ่มรหัส
Plugin ที่ติดตั้งลงในรายการอนุญาตนั้นก่อนเปิดใช้งาน หากรหัส Plugin เดียวกัน
มีอยู่ใน `plugins.deny` การติดตั้งจะลบรายการปฏิเสธที่ค้างอยู่นั้นออก เพื่อให้
การติดตั้งที่ระบุชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin แบบโลคัลที่บันทึกถาวรไว้เป็นโมเดลอ่านแบบเริ่มเย็น
สำหรับคลัง Plugin, ความเป็นเจ้าของการร่วมเพิ่มความสามารถ และการวางแผนตอนเริ่มต้น
โฟลว์การติดตั้ง อัปเดต ถอนการติดตั้ง เปิดใช้งาน และปิดใช้งานจะรีเฟรชรีจิสทรีนั้น
หลังเปลี่ยนสถานะ Plugin ไฟล์ `plugins/installs.json` เดียวกันเก็บเมตาดาต้าการติดตั้ง
ที่คงทนไว้ใน `installRecords` ระดับบนสุด และเก็บเมตาดาต้าแมนิเฟสต์ที่สร้างใหม่ได้ไว้ใน
`plugins` หากรีจิสทรีหายไป เก่าเกินไป หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมองแมนิเฟสต์ใหม่จากบันทึกการติดตั้ง นโยบายคอนฟิก และ
เมตาดาต้าแมนิเฟสต์/แพ็กเกจ โดยไม่โหลดโมดูลรันไทม์ของ Plugin
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
สเปกแพ็กเกจ npm พร้อม dist-tag หรือเวอร์ชันที่แน่นอนจะ resolve ชื่อแพ็กเกจ
กลับไปยังระเบียน Plugin ที่ติดตามอยู่ และบันทึกสเปกใหม่สำหรับการอัปเดตในอนาคต
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งที่ปักหมุดแบบแน่นอนกลับไปยัง
สายรุ่นเริ่มต้นของรีจิสทรี หาก Plugin npm ที่ติดตั้งตรงกับเวอร์ชันที่ resolve แล้ว
และตัวตนอาร์ติแฟกต์ที่บันทึกไว้ OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด
ติดตั้งใหม่ หรือเขียนคอนฟิกใหม่
เมื่อ `openclaw update` ทำงานบนช่องเบต้า ระเบียน Plugin npm และ ClawHub ในสายเริ่มต้น
จะลอง `@beta` ก่อน และถอยกลับไปยังค่าเริ่มต้น/latest เมื่อไม่มีรุ่นเบต้าของ Plugin
เวอร์ชันที่แน่นอนและแท็กที่ระบุชัดเจนยังคงถูกปักหมุดไว้

`--pin` ใช้กับ npm เท่านั้น ไม่รองรับการใช้ร่วมกับ `--marketplace` เพราะการติดตั้ง
จาก marketplace จะบันทึกเมตาดาต้าแหล่งที่มาของ marketplace แทนสเปก npm

`--dangerously-force-unsafe-install` เป็นตัว override ฉุกเฉินสำหรับผลบวกลวงจาก
ตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้ง Plugin และการอัปเดต Plugin ดำเนินต่อ
ผ่านผลการตรวจ `critical` ในตัวได้ แต่ยังไม่ข้ามการบล็อกตามนโยบาย `before_install`
ของ Plugin หรือการบล็อกเมื่อสแกนล้มเหลว การสแกนตอนติดตั้งจะละเว้นไฟล์และไดเรกทอรี
ทดสอบทั่วไป เช่น `tests/`, `__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยง
การบล็อก mock ทดสอบที่แพ็กมา แต่ entrypoint รันไทม์ของ Plugin ที่ประกาศไว้ยังคงถูกสแกน
แม้ใช้ชื่ออย่างใดอย่างหนึ่งเหล่านั้น

แฟล็ก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ Skills
ที่หนุนด้วย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall`
แทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub
ที่แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิดแดชบอร์ด
ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบอีกครั้ง
`--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเองเท่านั้น
มันไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้รุ่นที่ถูกบล็อกเผยแพร่ต่อสาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วมในโฟลว์รายการ/ตรวจสอบ/เปิดใช้งาน/ปิดใช้งาน Plugin
เดียวกัน การรองรับรันไทม์ปัจจุบันรวมถึง Skills ของบันเดิล, command-skills ของ Claude,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` และ `lspServers`
ที่ประกาศในแมนิเฟสต์ของ Claude, command-skills ของ Cursor และไดเรกทอรีฮุก Codex
ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึงรายการ
เซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่หนุนด้วยบันเดิล

แหล่งที่มาของ marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, ราก marketplace แบบโลคัลหรือพาธ
`marketplace.json`, รูปย่อ GitHub เช่น `owner/repo`, URL รีโป GitHub หรือ URL git
สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายในรีโป marketplace ที่โคลนมา
และใช้เฉพาะแหล่งที่มาแบบพาธสัมพัทธ์

ดูรายละเอียดทั้งหมดได้ที่ [ข้อมูลอ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Plugin แบบเนทีฟส่งออกออบเจ็กต์ entry ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias เดิมได้ แต่ Plugin ใหม่ควรใช้ `register`

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

OpenClaw โหลดออบเจ็กต์ entry และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin
ตัวโหลดจะยังถอยกลับไปใช้ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่มาพร้อม
และ Plugin ภายนอกใหม่ควรมองว่า `register` เป็นสัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่าเหตุใด entry ของมันจึงถูกโหลด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งานรันไทม์ ลงทะเบียนเครื่องมือ ฮุก บริการ คำสั่ง route และผลข้างเคียงที่ทำงานจริงอื่น ๆ                              |
| `discovery`     | การค้นพบความสามารถแบบอ่านอย่างเดียว ลงทะเบียนผู้ให้บริการและเมตาดาต้า โค้ด entry ของ Plugin ที่เชื่อถืออาจถูกโหลด แต่ข้ามผลข้างเคียงที่ทำงานจริง |
| `setup-only`    | การโหลดเมตาดาต้าการตั้งค่าช่องทางผ่าน entry ตั้งค่าขนาดเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่าช่องทางที่ต้องใช้ entry รันไทม์ด้วย                                                                         |
| `cli-metadata`  | การรวบรวมเมตาดาต้าคำสั่ง CLI เท่านั้น                                                                                            |

entry ของ Plugin ที่เปิดซ็อกเก็ต ฐานข้อมูล worker เบื้องหลัง หรือไคลเอนต์ที่มีอายุยืน
ควรป้องกันผลข้างเคียงเหล่านั้นด้วย `api.registrationMode === "full"` การโหลด discovery
ถูกแคชแยกจากการโหลดเพื่อเปิดใช้งาน และไม่ได้แทนที่รีจิสทรี Gateway ที่กำลังทำงานอยู่
Discovery เป็นแบบไม่เปิดใช้งาน ไม่ใช่แบบไร้การ import: OpenClaw อาจประเมิน entry ของ
Plugin ที่เชื่อถือหรือโมดูล Plugin ช่องทางเพื่อสร้าง snapshot ให้ระดับบนสุดของโมดูล
เบาและไร้ผลข้างเคียง และย้ายไคลเอนต์เครือข่าย subprocess, listener, การอ่าน credential
และการเริ่มบริการไปอยู่หลังพาธรันไทม์เต็ม

เมธอดลงทะเบียนทั่วไป:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)        |
| `registerChannel`                       | ช่องทางแชต                |
| `registerTool`                          | เครื่องมือเอเจนต์                  |
| `registerHook` / `on(...)`              | ฮุกวงจรชีวิต             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีม               |
| `registerRealtimeVoiceProvider`         | เสียงเรียลไทม์แบบสองทาง       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | ผู้ให้บริการดึงข้อมูลเว็บ / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | endpoint HTTP               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | เอนจินบริบท              |
| `registerService`                       | บริการเบื้องหลัง          |

พฤติกรรม guard ของฮุกสำหรับฮุกวงจรชีวิตแบบมีชนิด:

- `before_tool_call`: `{ block: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้างการบล็อกก่อนหน้า
- `before_install`: `{ block: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้างการบล็อกก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้างการยกเลิกก่อนหน้า

app-server ของ Native Codex รันสะพานเชื่อมเหตุการณ์เครื่องมือแบบ Codex-native
กลับเข้าสู่พื้นผิวฮุกนี้ Plugin สามารถบล็อกเครื่องมือ Codex แบบเนทีฟผ่าน
`before_tool_call`, สังเกตผลลัพธ์ผ่าน `after_tool_call` และมีส่วนร่วมในการอนุมัติ
`PermissionRequest` ของ Codex สะพานยังไม่เขียนอาร์กิวเมนต์เครื่องมือแบบ Codex-native
ใหม่ ขอบเขตการรองรับรันไทม์ Codex ที่แน่นอนอยู่ใน
[สัญญารองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

ดูพฤติกรรมฮุกแบบมีชนิดทั้งหมดได้ที่ [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) — ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) — schema แมนิเฟสต์
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือเอเจนต์ใน Plugin
- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและไปป์ไลน์การโหลด
- [Plugin ชุมชน](/th/plugins/community) — รายการจากบุคคลที่สาม
