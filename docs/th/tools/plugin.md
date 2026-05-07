---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับบันเดิล Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-07T13:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
ฮาร์เนสของ Agent, เครื่องมือ, Skills, เสียงพูด, การถอดเสียงแบบเรียลไทม์,
เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ
และอื่นๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ OpenClaw) ส่วนบางตัว
เป็น **ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบได้ผ่าน
[ClawHub](/th/tools/clawhub) Npm ยังคงรองรับสำหรับการติดตั้งโดยตรงและสำหรับ
ชุดชั่วคราวของแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของ ระหว่างที่การย้ายนี้เสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้ง คัดลอกแล้ววาง, การแสดงรายการ, การถอนการติดตั้ง, การอัปเดต และการเผยแพร่ โปรดดู
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

    จากนั้นกำหนดค่าใต้ `plugins.entries.\<id\>.config` ในไฟล์กำหนดค่าของคุณ

  </Step>

  <Step title="การจัดการแบบเนทีฟในแชต">
    ใน Gateway ที่กำลังทำงาน คำสั่งสำหรับเจ้าของเท่านั้น `/plugins enable` และ `/plugins disable`
    จะเรียกตัวโหลดซ้ำของการกำหนดค่า Gateway Gateway จะโหลดพื้นผิวรันไทม์ของ Plugin
    ใหม่ในโปรเซส และเทิร์น Agent ใหม่จะสร้างรายการเครื่องมือใหม่จาก
    รีจิสทรีที่รีเฟรชแล้ว `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น
    Gateway จะขอให้รีสตาร์ทแทนการแสร้งว่าโปรเซสปัจจุบันสามารถ
    โหลดโมดูลที่นำเข้าแล้วซ้ำได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อต้องพิสูจน์เครื่องมือที่ลงทะเบียนไว้, บริการ, เมธอดของ Gateway,
    hooks หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของ `inspect` ธรรมดาเป็นการตรวจสอบ
    manifest/registry แบบเย็น และตั้งใจหลีกเลี่ยงการนำเข้ารันไทม์ของ Plugin

  </Step>
</Steps>

หากคุณต้องการการควบคุมแบบเนทีฟในแชต ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ตัวแก้ไขเดียวกับ CLI: local path/archive, แบบระบุชัด
`clawhub:<pkg>`, แบบระบุชัด `npm:<pkg>`, แบบระบุชัด `npm-pack:<path.tgz>`,
แบบระบุชัด `git:<repo>` หรือสเป็กแพ็กเกจเปล่าผ่าน npm

หากการกำหนดค่าไม่ถูกต้อง การติดตั้งตามปกติจะล้มเหลวแบบปิดและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นเดียวสำหรับการกู้คืนคือเส้นทางติดตั้งซ้ำของ bundled-plugin
ที่แคบ สำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway การกำหนดค่า Plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเหมือนกับการกำหนดค่าอื่นที่ไม่ถูกต้อง
เรียกใช้ `openclaw doctor --fix` เพื่อกักกันการกำหนดค่า Plugin ที่เสียโดย
ปิดใช้งานรายการ Plugin นั้นและลบ payload การกำหนดค่าที่ไม่ถูกต้องออก; การสำรองข้อมูล
การกำหนดค่าปกติจะเก็บค่าก่อนหน้าไว้
เมื่อการกำหนดค่าช่องทางอ้างอิง Plugin ที่ค้นหาไม่พบอีกต่อไป แต่
id Plugin ที่ค้างเดิมยังคงอยู่ในการกำหนดค่า Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้น แทนที่จะบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin ที่ค้าง; คีย์
ช่องทางที่ไม่รู้จักซึ่งไม่มีหลักฐาน stale-plugin จะยังคงทำให้การตรวจสอบความถูกต้องล้มเหลว เพื่อให้การพิมพ์ผิด
ยังมองเห็นได้
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin ที่ค้างจะถือว่าไม่ทำงาน:
การเริ่มต้น Gateway จะข้ามงานค้นหา/โหลด Plugin และ `openclaw doctor` จะคง
การกำหนดค่า Plugin ที่ปิดใช้งานไว้แทนการลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
เรียกใช้การล้างข้อมูลของ doctor หากคุณต้องการลบ id Plugin ที่ค้าง

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่างโฟลว์ติดตั้ง/อัปเดตที่ระบุชัดหรือ
โฟลว์ซ่อมแซมของ doctor เท่านั้น การเริ่มต้น Gateway, การโหลดการกำหนดค่าซ้ำ และการตรวจสอบรันไทม์
จะไม่เรียกใช้ตัวจัดการแพ็กเกจหรือซ่อมแซม dependency tree Plugin ภายในเครื่องต้อง
มี dependency ของตนติดตั้งไว้แล้ว ส่วน Plugin จาก npm, git และ ClawHub จะ
ติดตั้งใต้ managed plugin roots ของ OpenClaw dependency ของ npm อาจถูก hoist
ภายใน managed npm root ของ OpenClaw; install/update จะสแกน managed root นั้นก่อน
trust และ uninstall จะลบแพ็กเกจที่จัดการโดย npm ผ่าน npm Plugin ภายนอก
และ custom load paths ยังคงต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบคงที่สำหรับ Plugin
ที่มองเห็นแต่ละตัว โดยไม่ต้องนำเข้าโค้ดรันไทม์หรือซ่อมแซม dependency
ดู [การแก้ไข dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ
วงจรชีวิตช่วงติดตั้ง

### ความเป็นเจ้าของเส้นทาง Plugin ที่ถูกบล็อก

หากการวินิจฉัย Plugin แจ้งว่า
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
และการตรวจสอบความถูกต้องของการกำหนดค่าตามด้วย `plugin present but blocked` แปลว่า OpenClaw พบ
ไฟล์ Plugin ที่เป็นของผู้ใช้ Unix คนละคนกับโปรเซสที่กำลังโหลด
ไฟล์เหล่านั้น เก็บการกำหนดค่า Plugin ไว้ตามเดิม; แก้ไขความเป็นเจ้าของในระบบไฟล์ หรือเรียกใช้
OpenClaw เป็นผู้ใช้เดียวกับเจ้าของไดเรกทอรีสถานะ

สำหรับการติดตั้ง Docker อิมเมจทางการจะทำงานเป็น `node` (uid `1000`) ดังนั้น
ไดเรกทอรีการกำหนดค่าและพื้นที่ทำงานของ OpenClaw ที่ bind-mounted จาก host ควร
เป็นของ uid `1000` ตามปกติ:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

หากคุณตั้งใจเรียกใช้ OpenClaw เป็น root ให้ซ่อมแซม managed plugin root ให้เป็น
ความเป็นเจ้าของของ root แทน:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

หลังแก้ไขความเป็นเจ้าของแล้ว ให้เรียกใช้ `openclaw doctor --fix` อีกครั้ง หรือ
`openclaw plugins registry --refresh` เพื่อให้รีจิสทรี Plugin ที่บันทึกไว้ตรงกับ
ไฟล์ที่ซ่อมแซมแล้ว

สำหรับการติดตั้ง npm ตัวเลือกที่เปลี่ยนแปลงได้ เช่น `latest` หรือ dist-tag จะถูกแก้ไข
ก่อนการติดตั้ง แล้วจึง pin ไปยังเวอร์ชันที่ตรวจสอบแล้วแบบชัดเจนใน managed npm root ของ OpenClaw
หลัง npm ทำงานเสร็จ OpenClaw จะตรวจสอบว่ารายการ
`package-lock.json` ที่ติดตั้งไว้ยังตรงกับเวอร์ชันและ integrity ที่แก้ไขแล้ว หาก
npm เขียน metadata ของแพ็กเกจที่แตกต่างกัน การติดตั้งจะล้มเหลวและแพ็กเกจที่จัดการอยู่
จะถูกย้อนกลับ แทนที่จะยอมรับ artifact ของ Plugin ที่แตกต่างกัน
managed npm roots ยังสืบทอด `overrides` ระดับแพ็กเกจ npm ของ OpenClaw ดังนั้น
security pins ที่ปกป้อง packaged host จะมีผลกับ dependency ของ Plugin ภายนอก
ที่ถูก hoist ด้วย

Source checkouts เป็น pnpm workspaces หากคุณ clone OpenClaw เพื่อแก้ไข bundled
plugins ให้เรียกใช้ `pnpm install`; จากนั้น OpenClaw จะโหลด bundled plugins จาก
`extensions/<id>` เพื่อให้การแก้ไขและ dependency เฉพาะแพ็กเกจถูกใช้โดยตรง
การติดตั้ง npm root ธรรมดามีไว้สำหรับ OpenClaw แบบแพ็กเกจ ไม่ใช่การพัฒนา
source checkout

## ประเภท Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + โมดูลรันไทม์; ทำงานในโปรเซส       | Plugin ทางการ, แพ็กเกจ npm ของชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปเป็นฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองจะแสดงใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียดของ bundle

หากคุณกำลังเขียน Plugin แบบ native ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Entry point ของแพ็กเกจ

แพ็กเกจ npm ของ Plugin แบบ native ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละรายการต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve ไปยัง
ไฟล์รันไทม์ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี JavaScript peer ที่ build แล้วแบบอนุมาน
เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบแพ็กเกจต้องส่งออก JavaScript runtime output นั้น fallback ไปยังซอร์ส TypeScript
มีไว้สำหรับ source checkouts และเส้นทางการพัฒนาภายในเครื่อง ไม่ใช่สำหรับ
แพ็กเกจ npm ที่ติดตั้งเข้า managed plugin root ของ OpenClaw

หากคำเตือนของ managed package บอกว่า `requires compiled runtime output for
TypeScript entry ...` แปลว่าแพ็กเกจถูกเผยแพร่โดยไม่มีไฟล์ JavaScript
ที่ OpenClaw ต้องใช้ในรันไทม์ นั่นเป็นปัญหาการแพ็กเกจของ Plugin ไม่ใช่ปัญหาการกำหนดค่า
ภายในเครื่อง อัปเดตหรือติดตั้ง Plugin ใหม่หลังผู้เผยแพร่เผยแพร่ JavaScript
ที่คอมไพล์แล้วอีกครั้ง หรือปิดใช้งาน/ถอนการติดตั้ง Plugin นั้นจนกว่าแพ็กเกจที่แก้ไขแล้วจะพร้อมใช้งาน

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์รันไทม์ที่เผยแพร่ไม่ได้อยู่ที่
เส้นทางเดียวกับรายการซอร์ส เมื่อมี `runtimeExtensions` ต้องมี
หนึ่งรายการพอดีสำหรับทุก `extensions` entry รายการที่ไม่ตรงกันจะทำให้การติดตั้งและ
การค้นพบ Plugin ล้มเหลว แทนที่จะ fallback กลับไปยังเส้นทางซอร์สอย่างเงียบๆ หากคุณยัง
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

## Plugin ทางการ

### แพ็กเกจ npm ที่ OpenClaw เป็นเจ้าของระหว่างการย้าย

ClawHub เป็นเส้นทางการกระจายหลักสำหรับ Plugin ส่วนใหญ่ รุ่น OpenClaw แบบแพ็กเกจปัจจุบัน
bundle Plugin ทางการจำนวนมากไว้แล้ว ดังนั้นจึงไม่จำเป็นต้อง
ติดตั้ง npm แยกต่างหากในการตั้งค่าปกติ จนกว่า Plugin ทุกตัวที่ OpenClaw เป็นเจ้าของจะ
ย้ายไปยัง ClawHub เสร็จ OpenClaw ยังคงส่งแพ็กเกจ Plugin `@openclaw/*` บางส่วนบน
npm สำหรับการติดตั้งแบบเก่า/กำหนดเองและ workflow npm โดยตรง

หาก npm รายงานแพ็กเกจ Plugin `@openclaw/*` ว่า deprecated แพ็กเกจ
เวอร์ชันนั้นมาจาก external package train ที่เก่ากว่า ใช้ bundled plugin จาก
OpenClaw ปัจจุบันหรือ local checkout จนกว่าจะมีแพ็กเกจ npm ใหม่กว่าเผยแพร่

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
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้โดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` - การค้นหาหน่วยความจำที่รวมมาในชุด (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` - หน่วยความจำระยะยาวที่ใช้ LanceDB เป็นแบ็กเอนด์ พร้อมการเรียกคืน/บันทึกอัตโนมัติ (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding
    ที่เข้ากันได้กับ OpenAI, ตัวอย่าง Ollama, ขีดจำกัดการเรียกคืน และการแก้ไขปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` - Plugin เบราว์เซอร์ที่รวมมาในชุดสำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด Gateway `browser.request`, รันไทม์เบราว์เซอร์ และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ปิดใช้งานก่อนแทนที่)
    - `copilot-proxy` - บริดจ์ VS Code Copilot Proxy (ปิดใช้งานโดยค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่ใช่ไหม ดู [Plugin ชุมชน](/th/plugins/community)

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
| `bundledDiscovery` | โหมดการค้นหา Plugin ที่รวมมาในชุด (`allowlist` โดยค่าเริ่มต้น)    |
| `deny`             | รายการปฏิเสธ Plugin (ไม่บังคับ; deny ชนะ)                     |
| `load.paths`       | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`            | ตัวเลือกสล็อตแบบผูกขาด (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>`   | การเปิด/ปิดและการกำหนดค่าสำหรับแต่ละ Plugin                               |

`plugins.allow` เป็นแบบผูกขาด เมื่อไม่ว่าง จะโหลดหรือเปิดเผยเครื่องมือได้เฉพาะ
Plugin ที่อยู่ในรายการเท่านั้น แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือ
ที่ Plugin ใด Plugin หนึ่งเป็นเจ้าของก็ตาม หากรายการอนุญาตเครื่องมืออ้างถึงเครื่องมือของ Plugin ให้เพิ่ม id ของ Plugin
เจ้าของลงใน `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

`plugins.bundledDiscovery` มีค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้น
คลัง `plugins.allow` ที่จำกัดสิทธิ์จะบล็อก Plugin ผู้ให้บริการที่รวมมาในชุดแต่ไม่ได้ระบุไว้ด้วย
รวมถึงการค้นหาผู้ให้บริการ web-search ของรันไทม์ Doctor จะประทับตราการกำหนดค่า
รายการอนุญาตแบบจำกัดสิทธิ์รุ่นเก่าด้วย `"compat"` ระหว่างการย้ายข้อมูล เพื่อให้การอัปเกรดยังคง
พฤติกรรมผู้ให้บริการที่รวมมาในชุดแบบเดิมไว้จนกว่าผู้ปฏิบัติงานจะเลือกใช้โหมดที่เข้มงวดกว่า
`plugins.allow` ที่ว่างยังคงถือว่าไม่ได้ตั้งค่า/เปิดอยู่

การเปลี่ยนแปลงการกำหนดค่าที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์การโหลด Plugin
Gateway ใหม่ภายในโปรเซส เทิร์นใหม่ของเอเจนต์จะสร้างรายการเครื่องมือใหม่จาก
รีจิสทรี Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยนซอร์ส เช่น install,
update และ uninstall ยังคงรีสตาร์ตโปรเซส Gateway เพราะโมดูล Plugin
ที่นำเข้าไปแล้วไม่สามารถแทนที่ในตำแหน่งเดิมได้อย่างปลอดภัย

`openclaw plugins list` เป็นสแนปช็อตรีจิสทรี/การกำหนดค่า Plugin ในเครื่อง Plugin ที่
`enabled` ในรายการนั้นหมายความว่ารีจิสทรีที่บันทึกไว้และการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังรันอยู่ได้โหลดใหม่หรือรีสตาร์ต
ไปใช้โค้ด Plugin เดียวกันแล้ว ในการตั้งค่า VPS/container ที่มีโปรเซส wrapper
ให้ส่งการรีสตาร์ตหรือการเขียนที่ทริกเกอร์การโหลดใหม่ไปยังโปรเซส
`openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ
Gateway ที่กำลังรันอยู่เมื่อรายงานการโหลดใหม่ล้มเหลว

<Accordion title="สถานะ Plugin: ปิดใช้งาน เทียบกับหายไป เทียบกับไม่ถูกต้อง">
  - **ปิดใช้งาน**: มี Plugin อยู่ แต่กฎการเปิดใช้ปิดไว้ การกำหนดค่าจะถูกเก็บรักษาไว้
  - **หายไป**: การกำหนดค่าอ้างถึง id ของ Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: มี Plugin อยู่ แต่การกำหนดค่าของมันไม่ตรงกับสคีมาที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักกันรายการที่ไม่ถูกต้องได้โดยปิดใช้งานและลบ payload การกำหนดค่าของรายการนั้น

</Accordion>

## การค้นหาและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงจะชนะ):

<Steps>
  <Step title="พาธการกำหนดค่า">
    `plugins.load.paths` - พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี Plugin ที่รวมมาในแพ็กเกจของ OpenClaw เองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบนามแฝงที่ค้างอยู่เหล่านั้น
  </Step>

  <Step title="Plugin ของเวิร์กสเปซ">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ที่รวมมาในชุด">
    จัดส่งมาพร้อม OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    ตัวอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะ resolve Plugin ที่รวมมาในชุดจาก
ทรี `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin ที่รวมมาในชุดถูก
bind-mounted ทับพาธซอร์สแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรีซอร์สที่เมานต์นั้น
เป็น source overlay ที่รวมมาในชุด และค้นพบก่อนบันเดิล
`/app/dist/extensions/synology-chat` ที่อยู่ในแพ็กเกจ วิธีนี้ช่วยให้ลูปคอนเทนเนอร์ของผู้ดูแล
ทำงานได้โดยไม่ต้องสลับ Plugin ที่รวมมาในชุดทุกตัวกลับไปเป็นซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist ในแพ็กเกจ
แม้จะมีเมานต์ source overlay อยู่ก็ตาม

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นหา/โหลด Plugin
- `plugins.deny` ชนะ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจากเวิร์กสเปซจะ **ปิดใช้งานโดยค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin ที่รวมมาในชุดจะทำตามชุดค่าเริ่มต้นในตัวที่เปิดไว้ เว้นแต่จะถูก override
- สล็อตแบบผูกขาดสามารถบังคับเปิดใช้ Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin แบบ opt-in บางตัวที่รวมมาในชุดจะถูกเปิดใช้โดยอัตโนมัติเมื่อการกำหนดค่าระบุ
  พื้นผิวที่ Plugin เป็นเจ้าของ เช่น ref โมเดลของผู้ให้บริการ, การกำหนดค่าช่องทาง หรือรันไทม์
  harness
- การกำหนดค่า Plugin ที่ค้างอยู่จะถูกเก็บรักษาไว้ขณะ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้ Plugin อีกครั้งก่อนรันการล้างข้อมูลของ doctor หากต้องการลบ id ที่ค้างอยู่
- เส้นทาง Codex ตระกูล OpenAI รักษาขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ขณะที่ Plugin app-server Codex
  ที่รวมมาในชุดถูกเลือกโดย `agentRuntime.id: "codex"` หรือ ref โมเดล
  `codex/*` แบบเดิม

## การแก้ไขปัญหา runtime hook

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hook ของ `register(api)`
ไม่ทำงานในการรับส่งแชตสด ให้ตรวจสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL ของ
  Gateway ที่ใช้งานอยู่, โปรไฟล์, พาธการกำหนดค่า และโปรเซสเป็นรายการที่คุณกำลังแก้ไข
- รีสตาร์ต Gateway สดหลังการเปลี่ยนแปลงการติดตั้ง/การกำหนดค่า/โค้ดของ Plugin ในคอนเทนเนอร์
  wrapper PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ตหรือส่งสัญญาณไปยังโปรเซสลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  diagnostics hook การสนทนาที่ไม่ได้รวมมาในชุด เช่น `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้ใช้ `before_model_resolve` เป็นหลัก มันทำงานก่อนการ resolve โมเดล
  สำหรับเทิร์นเอเจนต์; `llm_output` จะทำงานหลังความพยายามใช้โมเดล
  สร้างผลลัพธ์ผู้ช่วยแล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผล ให้ใช้ `openclaw sessions` หรือพื้นผิว
  เซสชัน/สถานะของ Gateway และเมื่อดีบัก payload ของผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หากเทิร์นเอเจนต์ดูเหมือนหยุดค้างขณะเตรียมเครื่องมือ ให้เปิดใช้ trace logging และ
ตรวจบรรทัดเวลาของ factory เครื่องมือ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลารวมของ factory และ factory เครื่องมือ Plugin ที่ช้าที่สุด
รวมถึง id ของ Plugin, ชื่อเครื่องมือที่ประกาศ, รูปทรงผลลัพธ์ และเครื่องมือนั้นเป็น
แบบไม่บังคับหรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory เดียวใช้เวลา
อย่างน้อย 1 วินาที หรือการเตรียม factory เครื่องมือ Plugin รวมใช้เวลาอย่างน้อย 5 วินาที

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการ resolve ซ้ำ
ด้วยบริบทคำขอที่มีผลเดียวกัน คีย์แคชรวมการกำหนดค่ารันไทม์ที่มีผล,
เวิร์กสเปซ, id เอเจนต์/เซสชัน, นโยบาย sandbox, การตั้งค่าเบราว์เซอร์,
บริบทการส่งมอบ, ตัวตนผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่
ขึ้นกับฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกรันใหม่เมื่อบริบทเปลี่ยน

หาก Plugin หนึ่งครองเวลาส่วนใหญ่ ให้ตรวจการลงทะเบียนรันไทม์ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้หลังเส้นทางการเรียกใช้เครื่องมือ แทนที่จะทำ
ภายใน factory เครื่องมือ

### การเป็นเจ้าของช่องทางหรือเครื่องมือซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้อยู่มากกว่าหนึ่งตัวพยายามเป็นเจ้าของช่องทางเดียวกัน
โฟลว์ตั้งค่าเดียวกัน หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin ช่องทางภายนอก
ถูกติดตั้งอยู่ข้าง Plugin ที่รวมมาในชุดซึ่งตอนนี้ให้ id ช่องทางเดียวกัน

ขั้นตอนดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้อยู่ทุกตัว
  และต้นทาง
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้เมทาดาทาที่บันทึกไว้สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ต Gateway หลังการเปลี่ยนแปลงการติดตั้ง รีจิสทรี หรือการกำหนดค่า

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจจะแทนที่อีกตัวสำหรับ id ช่องทางเดียวกัน Plugin
  ที่ต้องการใช้ควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  id ของ Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากรายการซ้ำเกิดโดยไม่ตั้งใจ ให้ปิดใช้งานฝั่งหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin
  ที่ค้างอยู่
- หากคุณเปิดใช้ Plugin ทั้งสองอย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานข้อขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับช่องทางหรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
  เพื่อให้พื้นผิวรันไทม์ไม่คลุมเครือ

## สล็อต Plugin (หมวดหมู่แบบผูกขาด)

บางหมวดหมู่เป็นแบบผูกขาด (ใช้งานได้ครั้งละหนึ่งรายการเท่านั้น):

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

Plugin ที่บันเดิลมาจะมาพร้อมกับ OpenClaw หลายรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่บันเดิลมา ผู้ให้บริการเสียงพูดที่บันเดิลมา และ Plugin เบราว์เซอร์ที่บันเดิลมา) Plugin ที่บันเดิลมาอื่น ๆ ยังต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือชุด hook ที่ติดตั้งไว้แล้วในตำแหน่งเดิม ใช้ `openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรด Plugin npm ที่ติดตามอยู่ตามปกติ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งใช้พาธต้นทางซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการไว้

เมื่อมีการตั้งค่า `plugins.allow` ไว้แล้ว `openclaw plugins install` จะเพิ่ม id ของ Plugin ที่ติดตั้งเข้าไปใน allowlist นั้นก่อนเปิดใช้งาน หาก id ของ Plugin เดียวกันมีอยู่ใน `plugins.deny` การติดตั้งจะลบรายการ deny ที่ค้างอยู่นั้นออก เพื่อให้การติดตั้งแบบชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin ภายในเครื่องแบบถาวรไว้เป็นโมเดลอ่านแบบ cold read สำหรับรายการ Plugin ความเป็นเจ้าของ contribution และการวางแผนตอนเริ่มต้น โฟลว์ติดตั้ง อัปเดต ถอนการติดตั้ง เปิดใช้งาน และปิดใช้งานจะรีเฟรชรีจิสทรีนั้นหลังเปลี่ยนสถานะ Plugin ไฟล์ `plugins/installs.json` เดียวกันเก็บเมทาดาทาการติดตั้งแบบคงทนไว้ใน `installRecords` ระดับบนสุด และเก็บเมทาดาทา manifest ที่สร้างใหม่ได้ไว้ใน `plugins` หากรีจิสทรีหายไป ล้าสมัย หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จากเรคคอร์ดการติดตั้ง นโยบาย config และเมทาดาทา manifest/package โดยไม่โหลดโมดูลรันไทม์ของ Plugin

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยนแปลง lifecycle ของ Plugin จะถูกปิดใช้งาน ให้จัดการการเลือกแพ็กเกจ Plugin และ config ผ่านซอร์ส Nix สำหรับการติดตั้งแทน สำหรับ nix-openclaw ให้เริ่มจาก [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง spec แพ็กเกจ npm ที่มี dist-tag หรือเวอร์ชันแบบ exact จะ resolve ชื่อแพ็กเกจกลับไปยังเรคคอร์ด Plugin ที่ติดตามอยู่ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งแบบ exact pinned กลับไปยังสายรีลีสค่าเริ่มต้นของรีจิสทรี หาก Plugin npm ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่ resolve ได้และตัวตนของ artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่อง beta เรคคอร์ด Plugin npm และ ClawHub ในสายค่าเริ่มต้นจะลอง `@beta` ก่อน และ fallback ไปยัง default/latest เมื่อไม่มีรีลีส beta ของ Plugin เวอร์ชันแบบ exact และ tag ที่ระบุชัดเจนจะยังคง pinned อยู่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับการใช้ร่วมกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะเก็บเมทาดาทาแหล่งที่มาของ marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็น override แบบ break-glass สำหรับ false positive จากตัวสแกน dangerous-code ในตัว มันทำให้การติดตั้ง Plugin และการอัปเดต Plugin ดำเนินต่อได้แม้พบผลลัพธ์ `critical` ในตัว แต่ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อสแกนล้มเหลว การสแกนการติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`, `__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก mock ทดสอบที่แพ็กมาด้วย แต่ entrypoint รันไทม์ของ Plugin ที่ประกาศไว้ยังคงถูกสแกน แม้ว่าจะใช้ชื่อใดชื่อหนึ่งเหล่านั้นก็ตาม

แฟล็ก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ skill ที่มี Gateway รองรับใช้ override คำขอ `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิดแดชบอร์ด ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบอีกครั้ง `--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเองเท่านั้น ไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้รีลีสที่ถูกบล็อกเป็นสาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วมในโฟลว์ list/inspect/enable/disable ของ Plugin เดียวกัน การรองรับรันไทม์ปัจจุบันรวมถึง bundle skills, Claude command-skills, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศใน manifest, Cursor command-skills และไดเรกทอรี hook ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึงรายการเซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มีบันเดิลรองรับ

แหล่งที่มาของ Marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ภายในเครื่องหรือพาธ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มา และใช้เฉพาะแหล่งที่มาแบบพาธสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [อ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม Plugin API

Native Plugin export อ็อบเจกต์ entry ที่เปิดเผย `register(api)` Plugin รุ่นเก่าอาจยังใช้ `activate(api)` เป็น alias แบบ legacy ได้ แต่ Plugin ใหม่ควรใช้ `register`

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

OpenClaw โหลดอ็อบเจกต์ entry และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin loader ยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่บันเดิลมาและ Plugin ภายนอกใหม่ควรมองว่า `register` เป็นสัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่า entry ของมันถูกโหลดด้วยเหตุผลใด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งานรันไทม์ ลงทะเบียนเครื่องมือ hook บริการ คำสั่ง route และ side effect สดอื่น ๆ                              |
| `discovery`     | การค้นหาความสามารถแบบอ่านอย่างเดียว ลงทะเบียนผู้ให้บริการและเมทาดาทา โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ให้ข้าม side effect สด |
| `setup-only`    | การโหลดเมทาดาทาการตั้งค่า channel ผ่าน entry การตั้งค่าแบบเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่า channel ที่ต้องใช้ entry รันไทม์ด้วย                                                                         |
| `cli-metadata`  | เก็บรวบรวมเมทาดาทาคำสั่ง CLI เท่านั้น                                                                                            |

entry ของ Plugin ที่เปิด socket, database, worker เบื้องหลัง หรือ client ที่มีอายุยาว ควรป้องกัน side effect เหล่านั้นด้วย `api.registrationMode === "full"` การโหลด discovery ถูกแคชแยกจากการโหลดเพื่อ activate และไม่แทนที่รีจิสทรี Gateway ที่กำลังทำงานอยู่ Discovery เป็นแบบไม่ activate แต่ไม่ใช่ import-free: OpenClaw อาจประเมิน entry ของ Plugin ที่เชื่อถือได้หรือโมดูล channel Plugin เพื่อสร้าง snapshot ให้รักษาระดับบนสุดของโมดูลให้เบาและไม่มี side effect และย้าย network client, subprocess, listener, การอ่าน credential และการเริ่มบริการไปไว้หลังพาธ full-runtime

เมธอดลงทะเบียนทั่วไป:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)        |
| `registerChannel`                       | Chat channel                |
| `registerTool`                          | เครื่องมือ Agent                  |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | เสียง realtime แบบ duplex       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์รูปภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างรูปภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | ผู้ให้บริการ Web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | บริการเบื้องหลัง          |

พฤติกรรม guard ของ hook สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

แอปเซิร์ฟเวอร์ Codex แบบเนทีฟจะรัน bridge เพื่อนำเหตุการณ์เครื่องมือแบบเนทีฟของ Codex กลับเข้าสู่พื้นผิว hook นี้ Plugin สามารถบล็อกเครื่องมือ Codex แบบเนทีฟผ่าน `before_tool_call`, สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมในการอนุมัติ `PermissionRequest` ของ Codex ได้ bridge ยังไม่เขียนอาร์กิวเมนต์ของเครื่องมือแบบเนทีฟของ Codex ใหม่ในตอนนี้ ขอบเขตการรองรับรันไทม์ Codex ที่แน่นอนอยู่ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม hook แบบ typed ทั้งหมด โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) - ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) - สคีมาแมนิเฟสต์
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) - เพิ่มเครื่องมือเอเจนต์ใน Plugin
- [ภายในของ Plugin](/th/plugins/architecture) - โมเดลความสามารถและไปป์ไลน์การโหลด
- [Plugin ชุมชน](/th/plugins/community) - รายการจากบุคคลที่สาม
