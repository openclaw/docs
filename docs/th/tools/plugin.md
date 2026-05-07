---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับบันเดิล Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:54:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
agent harnesses, เครื่องมือ, skills, คำพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์,
การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ
และอื่นๆ Plugin บางตัวเป็น **คอร์** (จัดส่งมาพร้อม OpenClaw) ส่วนตัวอื่นๆ
เป็น **ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) npm ยังคงรองรับการติดตั้งโดยตรงและสำหรับ
ชุดแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของชั่วคราวระหว่างที่การย้ายนี้เสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้งแบบคัดลอกวาง, แสดงรายการ, ถอนการติดตั้ง, อัปเดต
และเผยแพร่ โปรดดู
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

  <Step title="การจัดการแบบเนทีฟในแชต">
    ใน Gateway ที่กำลังทำงานอยู่ `/plugins enable` และ `/plugins disable`
    ที่ใช้ได้เฉพาะเจ้าของจะทริกเกอร์ตัวโหลด config ใหม่ของ Gateway Gateway
    จะโหลดพื้นผิว runtime ของ Plugin ใหม่ภายในโปรเซส และรอบใหม่ของเอเจนต์
    จะสร้างรายการเครื่องมือใหม่จากรีจิสทรีที่รีเฟรชแล้ว `/plugins install`
    เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น Gateway จะขอให้รีสตาร์ทแทนการแสร้งว่า
    โปรเซสปัจจุบันสามารถโหลดโมดูลที่ import แล้วใหม่ได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ, บริการ, เมธอด Gateway,
    hooks หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของซึ่งลงทะเบียนไว้ `inspect`
    แบบปกติเป็นการตรวจสอบ manifest/รีจิสทรีแบบ cold และจงใจหลีกเลี่ยงการ import
    runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการควบคุมแบบเนทีฟในแชต ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ตัว resolver เดียวกับ CLI: พาธ/ไฟล์ archive ในเครื่อง,
`clawhub:<pkg>` แบบระบุชัดเจน, `npm:<pkg>` แบบระบุชัดเจน, `npm-pack:<path.tgz>`
แบบระบุชัดเจน, `git:<repo>` แบบระบุชัดเจน หรือ package spec เปล่าผ่าน npm

หาก config ไม่ถูกต้อง การติดตั้งตามปกติจะ fail closed และชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นในการกู้คืนเพียงอย่างเดียวคือเส้นทาง reinstall
ของ bundled-plugin แบบแคบสำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway config ของ Plugin ที่ไม่ถูกต้องจะ fail closed
เหมือน config ที่ไม่ถูกต้องอื่นๆ เรียกใช้ `openclaw doctor --fix` เพื่อกัก config
ของ Plugin ที่เสียโดยปิดใช้รายการ Plugin นั้นและลบ payload config ที่ไม่ถูกต้องออก;
backup config ตามปกติจะเก็บค่าก่อนหน้าไว้
เมื่อ config ของช่องทางอ้างอิง Plugin ที่ค้นพบไม่ได้อีกต่อไป แต่ id ของ Plugin
ที่ค้างเดิมยังคงอยู่ใน config ของ Plugin หรือระเบียนการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนการบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin ที่ค้าง;
key ช่องทางที่ไม่รู้จักโดยไม่มีหลักฐาน Plugin ที่ค้างจะยังคง fail validation
เพื่อให้มองเห็นการพิมพ์ผิด
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin ที่ค้างจะถือว่าไม่มีผล:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor`
จะเก็บ config ของ Plugin ที่ปิดใช้ไว้แทนการลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
เรียกใช้การล้างข้อมูลของ doctor หากคุณต้องการลบ id ของ Plugin ที่ค้าง

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่าง flow install/update
แบบชัดเจนหรือการซ่อมโดย doctor เท่านั้น การเริ่มต้น Gateway, การโหลด config ใหม่
และการตรวจสอบ runtime จะไม่เรียก package manager หรือซ่อม dependency tree
Plugin ในเครื่องต้องติดตั้ง dependency ไว้แล้ว ส่วน Plugin จาก npm, git และ ClawHub
จะติดตั้งภายใต้ managed plugin roots ของ OpenClaw dependency ของ npm
อาจถูก hoist ภายใน managed npm root ของ OpenClaw; install/update จะสแกน
managed root นั้นก่อน trust และ uninstall จะลบแพ็กเกจที่ npm จัดการผ่าน npm
Plugin ภายนอกและ custom load paths ยังคงต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบคงที่ของ Plugin
ที่มองเห็นแต่ละตัวโดยไม่ import โค้ด runtime หรือซ่อม dependency
ดู [การ resolve dependency ของ Plugin](/th/plugins/dependency-resolution)
สำหรับ lifecycle ระหว่างติดตั้ง

### การเป็นเจ้าของพาธ Plugin ที่ถูกบล็อก

หาก diagnostics ของ Plugin ระบุว่า
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
และ config validation ตามด้วย `plugin present but blocked` แปลว่า OpenClaw
พบไฟล์ Plugin ที่เป็นเจ้าของโดยผู้ใช้ Unix คนละคนกับโปรเซสที่กำลังโหลดไฟล์เหล่านั้น
ให้คง config ของ Plugin ไว้; แก้ ownership ของระบบไฟล์หรือเรียกใช้ OpenClaw
ด้วยผู้ใช้เดียวกับที่เป็นเจ้าของไดเรกทอรี state

สำหรับการติดตั้ง Docker อิมเมจทางการทำงานเป็น `node` (uid `1000`) ดังนั้น
ไดเรกทอรี config และ workspace ของ OpenClaw ที่ bind mount จากโฮสต์โดยปกติควรเป็น
ของ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

หากคุณจงใจเรียกใช้ OpenClaw เป็น root ให้ซ่อม managed plugin root ให้เป็น
ownership ของ root แทน:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

หลังจากแก้ ownership แล้ว ให้เรียกใช้ `openclaw doctor --fix` หรือ
`openclaw plugins registry --refresh` อีกครั้ง เพื่อให้รีจิสทรี Plugin ที่ persist
ไว้ตรงกับไฟล์ที่ซ่อมแล้ว

สำหรับการติดตั้ง npm selector ที่เปลี่ยนได้ เช่น `latest` หรือ dist-tag จะถูก resolve
ก่อนติดตั้ง จากนั้น pin เป็นเวอร์ชันที่ตรวจสอบแล้วแบบแน่นอนใน managed npm root
ของ OpenClaw หลังจาก npm ทำงานเสร็จ OpenClaw จะตรวจสอบว่า entry ใน
`package-lock.json` ที่ติดตั้งแล้วยังคงตรงกับเวอร์ชันและ integrity ที่ resolve
ไว้ หาก npm เขียน metadata ของแพ็กเกจที่ต่างออกไป การติดตั้งจะล้มเหลวและแพ็กเกจ
ที่จัดการอยู่จะถูก rollback แทนการยอมรับ artifact ของ Plugin ที่ต่างออกไป
managed npm roots ยังสืบทอด npm `overrides` ระดับแพ็กเกจของ OpenClaw ด้วย
ดังนั้น security pins ที่ปกป้องโฮสต์แบบแพ็กเกจก็จะมีผลกับ dependency ของ Plugin
ภายนอกที่ถูก hoist ด้วย

ซอร์ส checkout เป็น pnpm workspaces หากคุณ clone OpenClaw เพื่อแก้ไข bundled
plugins ให้เรียกใช้ `pnpm install`; จากนั้น OpenClaw จะโหลด bundled plugins จาก
`extensions/<id>` เพื่อให้ใช้การแก้ไขและ dependency ในแพ็กเกจโดยตรง
การติดตั้ง npm root แบบปกติมีไว้สำหรับ OpenClaw แบบแพ็กเกจ ไม่ใช่การพัฒนา
source checkout

## ประเภทของ Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ | วิธีทำงาน | ตัวอย่าง |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + โมดูล runtime; ทำงานภายในโปรเซส | Plugin ทางการ, แพ็กเกจ npm ของชุมชน |
| **Bundle** | layout ที่เข้ากันได้กับ Codex/Claude/Cursor; map ไปยังความสามารถของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียด bundle

หากคุณกำลังเขียน native Plugin ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Entrypoints ของแพ็กเกจ

แพ็กเกจ native Plugin บน npm ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละ entry ต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve ไปยังไฟล์ runtime
ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี peer JavaScript ที่ build แล้วแบบ infer
ได้ เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบแพ็กเกจต้องจัดส่ง output runtime ของ JavaScript นั้น fallback
ของซอร์ส TypeScript มีไว้สำหรับ source checkouts และพาธพัฒนาในเครื่อง
ไม่ใช่สำหรับแพ็กเกจ npm ที่ติดตั้งใน managed plugin root ของ OpenClaw

หากคำเตือนของ managed package บอกว่ามัน `requires compiled runtime output for
TypeScript entry ...` แพ็กเกจนั้นถูกเผยแพร่โดยไม่มีไฟล์ JavaScript ที่ OpenClaw
ต้องใช้ตอน runtime นี่เป็นปัญหาการแพ็กเกจ Plugin ไม่ใช่ปัญหา config ในเครื่อง
อัปเดตหรือติดตั้ง Plugin ใหม่หลังจากผู้เผยแพร่เผยแพร่ JavaScript ที่ compile แล้ว
อีกครั้ง หรือปิดใช้/ถอนการติดตั้ง Plugin นั้นจนกว่าจะมีแพ็กเกจที่แก้ไขแล้ว

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ในพาธเดียวกับ
entry ของซอร์ส เมื่อมี `runtimeExtensions` ต้องมี entry หนึ่งรายการพอดีสำหรับทุก
entry ใน `extensions` รายการที่ไม่ตรงกันจะทำให้การติดตั้งและการค้นพบ Plugin
ล้มเหลว แทนที่จะ fallback ไปยังพาธซอร์สอย่างเงียบๆ หากคุณเผยแพร่
`openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ peer
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

ClawHub เป็นเส้นทางการแจกจ่ายหลักสำหรับ Plugin ส่วนใหญ่ OpenClaw release
แบบแพ็กเกจปัจจุบัน bundle Plugin ทางการไว้แล้วหลายตัว ดังนั้น Plugin เหล่านั้น
ไม่จำเป็นต้องติดตั้ง npm แยกในการตั้งค่าปกติ จนกว่า Plugin ทุกตัวที่ OpenClaw
เป็นเจ้าของจะย้ายไป ClawHub เสร็จ OpenClaw ยังคงจัดส่งแพ็กเกจ Plugin
`@openclaw/*` บางตัวบน npm สำหรับการติดตั้งรุ่นเก่า/แบบกำหนดเอง และ workflow
npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` deprecated แปลว่าเวอร์ชันแพ็กเกจนั้น
มาจากชุดแพ็กเกจภายนอกเก่า ใช้ bundled plugin จาก OpenClaw ปัจจุบันหรือ checkout
ในเครื่องจนกว่าจะมีแพ็กเกจ npm รุ่นใหม่เผยแพร่

| Plugin | แพ็กเกจ | เอกสาร |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles | `@openclaw/bluebubbles` | [BlueBubbles](/th/channels/bluebubbles) |
| Discord | `@openclaw/discord` | [Discord](/th/channels/discord) |
| Feishu | `@openclaw/feishu` | [Feishu](/th/channels/feishu) |
| Matrix | `@openclaw/matrix` | [Matrix](/th/channels/matrix) |
| Mattermost | `@openclaw/mattermost` | [Mattermost](/th/channels/mattermost) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/th/channels/msteams) |
| Nextcloud Talk | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/th/channels/nextcloud-talk) |
| Nostr | `@openclaw/nostr` | [Nostr](/th/channels/nostr) |
| Synology Chat | `@openclaw/synology-chat` | [Synology Chat](/th/channels/synology-chat) |
| Tlon | `@openclaw/tlon` | [Tlon](/th/channels/tlon) |
| WhatsApp | `@openclaw/whatsapp` | [WhatsApp](/th/channels/whatsapp) |
| Zalo | `@openclaw/zalo` | [Zalo](/th/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/th/plugins/zalouser) |

### Core (จัดส่งมาพร้อม OpenClaw)

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

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI
    ตัวอย่าง Ollama ขีดจำกัดการเรียกคืน และการแก้ไขปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้งานโดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` - Plugin เบราว์เซอร์แบบบันเดิลสำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด Gateway `browser.request`, รันไทม์เบราว์เซอร์ และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้งานโดยค่าเริ่มต้น; ปิดใช้งานก่อนแทนที่)
    - `copilot-proxy` - บริดจ์ VS Code Copilot Proxy (ปิดใช้งานโดยค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่หรือไม่? ดู [Plugin ชุมชน](/th/plugins/community)

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
| `deny`             | รายการปฏิเสธ Plugin (ไม่บังคับ; การปฏิเสธมีผลเหนือกว่า)                     |
| `load.paths`       | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`            | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>`   | สวิตช์ต่อ Plugin + การกำหนดค่า                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อไม่ว่าง เฉพาะ Plugin ที่ระบุเท่านั้นที่โหลด
หรือเปิดเผยเครื่องมือได้ แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือที่
Plugin เป็นเจ้าของแบบเจาะจง หากรายการอนุญาตเครื่องมืออ้างถึงเครื่องมือของ Plugin ให้เพิ่ม id ของ Plugin เจ้าของ
ลงใน `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

`plugins.bundledDiscovery` มีค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้นคลัง
`plugins.allow` ที่เข้มงวดจะบล็อก Plugin ผู้ให้บริการแบบบันเดิลที่ไม่ได้ระบุด้วย
รวมถึงการค้นพบผู้ให้บริการค้นหาเว็บในรันไทม์ Doctor จะประทับตราการกำหนดค่า
รายการอนุญาตที่เข้มงวดแบบเก่าด้วย `"compat"` ระหว่างการย้ายข้อมูล เพื่อให้การอัปเกรดยังคง
พฤติกรรมผู้ให้บริการแบบบันเดิลเดิมไว้จนกว่าผู้ดูแลระบบจะเลือกใช้โหมดที่เข้มงวดขึ้น
`plugins.allow` ที่ว่างเปล่ายังคงถือว่าไม่ได้ตั้งค่า/เปิดอยู่

การเปลี่ยนแปลงการกำหนดค่าที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์การโหลด
Plugin ของ Gateway ใหม่ภายในกระบวนการ เทิร์นใหม่ของเอเจนต์จะสร้างรายการเครื่องมือใหม่จาก
รีจิสทรี Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยนซอร์ส เช่น install,
update และ uninstall ยังคงรีสตาร์ทกระบวนการ Gateway เพราะโมดูล
Plugin ที่นำเข้าแล้วไม่สามารถแทนที่ในที่เดิมได้อย่างปลอดภัย

`openclaw plugins list` เป็นสแนปชอตรีจิสทรี/การกำหนดค่า Plugin ในเครื่อง
Plugin ที่ `enabled` ที่นั่นหมายความว่ารีจิสทรีที่คงอยู่และการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังทำงานอยู่ได้โหลดใหม่หรือรีสตาร์ท
เข้าสู่โค้ด Plugin เดียวกันแล้ว ในการตั้งค่า VPS/คอนเทนเนอร์
ที่มีกระบวนการ wrapper ให้ส่งการรีสตาร์ทหรือการเขียนที่ทริกเกอร์การโหลดใหม่ไปยังกระบวนการ
`openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ
Gateway ที่กำลังทำงานอยู่เมื่อการโหลดใหม่รายงานความล้มเหลว

<Accordion title="สถานะ Plugin: ปิดใช้งาน เทียบกับ หายไป เทียบกับ ไม่ถูกต้อง">
  - **ปิดใช้งาน**: Plugin มีอยู่ แต่กฎการเปิดใช้งานปิดไว้ การกำหนดค่าจะถูกเก็บรักษาไว้
  - **หายไป**: การกำหนดค่าอ้างถึง id ของ Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: Plugin มีอยู่ แต่การกำหนดค่าไม่ตรงกับสคีมาที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักรายการที่ไม่ถูกต้องโดยปิดใช้งานและลบเพย์โหลดการกำหนดค่าออก

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงกันมีผล):

<Steps>
  <Step title="พาธการกำหนดค่า">
    `plugins.load.paths` - พาธไฟล์หรือไดเรกทอรีแบบชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี Plugin แบบบันเดิลที่แพ็กมากับ OpenClaw เองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบ alias เก่าพวกนั้น
  </Step>

  <Step title="Plugin ในเวิร์กสเปซ">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ระดับโกลบอล">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบบันเดิล">
    มาพร้อมกับ OpenClaw หลายรายการเปิดใช้งานโดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะแก้ตำแหน่ง Plugin แบบบันเดิลจาก
ต้นไม้ `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin แบบบันเดิลถูก
bind-mounted ทับพาธซอร์สแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรีซอร์สที่เมานต์นั้น
เป็น overlay ซอร์สแบบบันเดิล และค้นพบก่อนบันเดิล
`/app/dist/extensions/synology-chat` ที่แพ็กไว้ สิ่งนี้ช่วยให้ลูปคอนเทนเนอร์ของผู้ดูแล
ทำงานได้โดยไม่ต้องสลับ Plugin แบบบันเดิลทุกตัวกลับไปใช้ซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist ที่แพ็กไว้
แม้เมื่อมีการเมานต์ source overlay อยู่

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นพบ/โหลด Plugin
- `plugins.deny` มีผลเหนือ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มาจากเวิร์กสเปซจะ **ปิดใช้งานโดยค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin แบบบันเดิลทำตามชุดค่าเริ่มต้นที่เปิดไว้ในตัว เว้นแต่จะถูกแทนที่
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin แบบบันเดิลที่ต้องเลือกใช้บางรายการจะเปิดใช้งานโดยอัตโนมัติเมื่อการกำหนดค่าระบุ
  พื้นผิวที่ Plugin เป็นเจ้าของ เช่น การอ้างอิงโมเดลผู้ให้บริการ การกำหนดค่าช่องทาง หรือรันไทม์
  harness
- การกำหนดค่า Plugin เก่าจะถูกเก็บรักษาไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนรันการล้างข้อมูลของ doctor หากคุณต้องการลบ id เก่า
- เส้นทาง Codex ตระกูล OpenAI จะแยกขอบเขต Plugin ออกจากกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ในขณะที่ Plugin app-server Codex
  แบบบันเดิลถูกเลือกโดย `agentRuntime.id: "codex"` หรือการอ้างอิงโมเดล
  `codex/*` แบบเดิม

## การแก้ไขปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hooks ของ `register(api)`
ไม่ทำงานในทราฟฟิกแชทจริง ให้ตรวจสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL ของ Gateway
  ที่ใช้งานอยู่ โปรไฟล์ พาธการกำหนดค่า และกระบวนการเป็นสิ่งที่คุณกำลังแก้ไข
- รีสตาร์ท Gateway จริงหลังการเปลี่ยนแปลงการติดตั้ง/การกำหนดค่า/โค้ดของ Plugin ในคอนเทนเนอร์
  wrapper PID 1 อาจเป็นเพียง supervisor; รีสตาร์ทหรือส่งสัญญาณไปยังกระบวนการลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  การวินิจฉัย hooks การสนทนาที่ไม่ใช่แบบบันเดิล เช่น `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้ใช้ `before_model_resolve` เป็นหลัก มันทำงานก่อนการแก้โมเดล
  สำหรับเทิร์นเอเจนต์; `llm_output` ทำงานหลังจากความพยายามใช้โมเดล
  สร้างเอาต์พุตผู้ช่วยแล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผล ให้ใช้ `openclaw sessions` หรือพื้นผิว
  เซสชัน/สถานะของ Gateway และเมื่อดีบักเพย์โหลดผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หากเทิร์นเอเจนต์ดูเหมือนค้างขณะเตรียมเครื่องมือ ให้เปิดใช้งานการบันทึก trace และ
ตรวจบรรทัดเวลาของ factory เครื่องมือ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุประบุเวลา factory รวมและ factory เครื่องมือ Plugin ที่ช้าที่สุด
รวมถึง id ของ Plugin ชื่อเครื่องมือที่ประกาศ รูปร่างผลลัพธ์ และเครื่องมือนั้นเป็น
ตัวเลือกหรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory เดี่ยวใช้เวลา
อย่างน้อย 1 วินาที หรือการเตรียม factory เครื่องมือ Plugin รวมใช้เวลาอย่างน้อย 5 วินาที

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการแก้ซ้ำ
ด้วยบริบทคำขอที่มีผลเดียวกัน คีย์แคชรวมถึงการกำหนดค่า
รันไทม์ที่มีผล เวิร์กสเปซ id เอเจนต์/เซสชัน นโยบาย sandbox การตั้งค่าเบราว์เซอร์
บริบทการส่งมอบ ตัวตนผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่
ขึ้นกับฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกรันใหม่เมื่อบริบทเปลี่ยน

หาก Plugin หนึ่งครองเวลาส่วนใหญ่ ให้ตรวจการลงทะเบียนรันไทม์ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้หลังพาธการดำเนินการของเครื่องมือ แทนที่จะทำ
ภายใน factory เครื่องมือ

### ความเป็นเจ้าของช่องทางหรือเครื่องมือซ้ำ

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่า Plugin ที่เปิดใช้งานมากกว่าหนึ่งตัวกำลังพยายามเป็นเจ้าของช่องทางเดียวกัน
โฟลว์การตั้งค่า หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin ช่องทางภายนอก
ติดตั้งอยู่ข้าง Plugin แบบบันเดิลที่ตอนนี้ให้ id ช่องทางเดียวกัน

ขั้นตอนดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และแหล่งที่มา
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และการวินิจฉัย
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้ metadata ที่คงอยู่สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ท Gateway หลังการเปลี่ยนแปลงการติดตั้ง รีจิสทรี หรือการกำหนดค่า

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีกตัวสำหรับ id ช่องทางเดียวกัน
  Plugin ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  id ของ Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากการซ้ำเกิดขึ้นโดยไม่ตั้งใจ ให้ปิดใช้งานด้านหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin
  เก่า
- หากคุณเปิดใช้งานทั้งสอง Plugin อย่างชัดเจน OpenClaw จะรักษาคำขอนั้นไว้และ
  รายงานความขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับช่องทาง หรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
  เพื่อให้พื้นผิวรันไทม์ไม่กำกวม

## สล็อต Plugin (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (มีได้เพียงหนึ่งรายการที่ใช้งานอยู่ในแต่ละครั้ง):

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

Plugin ที่มาพร้อมชุดติดตั้งถูกจัดส่งพร้อม OpenClaw หลายตัวถูกเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่มาพร้อมชุดติดตั้ง ผู้ให้บริการเสียงพูดที่มาพร้อมชุดติดตั้ง และ Plugin เบราว์เซอร์ที่มาพร้อมชุดติดตั้ง) Plugin อื่นๆ ที่มาพร้อมชุดติดตั้งยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้ `openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ Plugin npm ที่มีการติดตามไว้ ไม่รองรับร่วมกับ `--link` ซึ่งใช้พาธต้นทางซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการไว้

เมื่อกำหนด `plugins.allow` ไว้แล้ว `openclaw plugins install` จะเพิ่ม id ของ Plugin ที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้งาน หาก id ของ Plugin เดียวกันมีอยู่ใน `plugins.deny` การติดตั้งจะลบรายการ deny เก่าที่ค้างอยู่นั้น เพื่อให้การติดตั้งที่ระบุชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin ภายในเครื่องแบบถาวรไว้เป็นโมเดลอ่านแบบ cold read สำหรับคลังรายการ Plugin ความเป็นเจ้าของ contribution และการวางแผนตอนเริ่มต้น โฟลว์ install, update, uninstall, enable และ disable จะรีเฟรชรีจิสทรีนั้นหลังเปลี่ยนสถานะ Plugin ไฟล์ `plugins/installs.json` เดียวกันเก็บเมตาดาต้าการติดตั้งแบบทนทานไว้ใน `installRecords` ระดับบนสุด และเมตาดาต้า manifest ที่สร้างใหม่ได้ไว้ใน `plugins` หากรีจิสทรีขาดหาย ล้าสมัย หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จาก install records, config policy และเมตาดาต้า manifest/package โดยไม่โหลดโมดูล runtime ของ Plugin

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยนแปลง lifecycle ของ Plugin จะถูกปิดใช้งาน ให้จัดการการเลือกแพ็กเกจ Plugin และ config ผ่านซอร์ส Nix สำหรับการติดตั้งแทน สำหรับ nix-openclaw ให้เริ่มจาก [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่มีการติดตามไว้ การส่ง npm package spec พร้อม dist-tag หรือเวอร์ชันแบบเจาะจงจะแก้ชื่อแพ็กเกจกลับไปยังเรคคอร์ด Plugin ที่ติดตามไว้ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งแบบปักหมุดเจาะจงกลับไปยังสายรีลีสเริ่มต้นของรีจิสทรี หาก Plugin npm ที่ติดตั้งไว้ตรงกับเวอร์ชันที่แก้ได้และตัวตน artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่อง beta เรคคอร์ด Plugin npm และ ClawHub ที่อยู่บนสายเริ่มต้นจะลอง `@beta` ก่อน และ fallback ไปยัง default/latest เมื่อไม่มีรีลีส beta ของ Plugin เวอร์ชันแบบเจาะจงและแท็กที่ระบุชัดเจนจะยังคงถูกปักหมุดไว้

OpenClaw ยังไม่เปิดเผยช่อง Plugin แบบ LTS หรือรายเดือน งานสายซัพพอร์ตรายเดือนที่วางแผนไว้จะต้องให้แท็ก Plugin npm และ ClawHub ตามสายซัพพอร์ตเดียวกับแพ็กเกจหลัก แทนการใช้ `latest` อย่างเงียบๆ

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะคงเมตาดาต้าซอร์ส marketplace ไว้แทน npm spec

`--dangerously-force-unsafe-install` เป็นตัว override สำหรับกรณีฉุกเฉินเมื่อสแกนเนอร์ dangerous-code ในตัวแจ้งผลบวกลวง ช่วยให้การติดตั้งและการอัปเดต Plugin ดำเนินต่อผ่านผลการตรวจพบระดับ `critical` ในตัวได้ แต่ยังคงไม่ข้ามการบล็อกตาม policy `before_install` ของ Plugin หรือการบล็อกเมื่อการสแกนล้มเหลว การสแกนการติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`, `__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก mock ทดสอบที่ถูกแพ็กเกจมา entrypoint runtime ของ Plugin ที่ประกาศไว้ยังคงถูกสแกนแม้ว่าจะใช้ชื่อเหล่านั้นก็ตาม

แฟล็ก CLI นี้ใช้กับโฟลว์ install/update ของ Plugin เท่านั้น การติดตั้ง dependency ของ Skills ที่รองรับโดย Gateway ใช้ request override `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน ส่วน `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills ของ ClawHub แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิดแดชบอร์ด ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบอีกครั้ง `--dangerously-force-unsafe-install` มีผลเฉพาะกับการติดตั้งบนเครื่องของคุณเองเท่านั้น ไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้รีลีสที่ถูกบล็อกเป็นสาธารณะ

บันเดิลที่เข้ากันได้เข้าร่วมในโฟลว์ list/inspect/enable/disable ของ Plugin เดียวกัน การรองรับ runtime ปัจจุบันรวมถึง Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึงรายการเซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่รองรับด้วยบันเดิล

ซอร์ส marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`, ราก marketplace ภายในเครื่องหรือพาธ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มา และใช้เฉพาะซอร์สพาธแบบ relative เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [คู่มืออ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Plugin แบบเนทีฟส่งออก entry object ที่เปิดเผย `register(api)` Plugin รุ่นเก่าอาจยังใช้ `activate(api)` เป็น alias เดิมได้ แต่ Plugin ใหม่ควรใช้ `register`

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

OpenClaw โหลด entry object และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin loader ยังคง fallback ไปยัง `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่มาพร้อมชุดติดตั้งและ Plugin ภายนอกใหม่ควรมอง `register` เป็นสัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่า entry ของตนถูกโหลดเพราะอะไร:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งาน runtime ลงทะเบียนเครื่องมือ, hooks, services, commands, routes และ side effects ที่ทำงานจริงอื่นๆ                              |
| `discovery`     | การค้นพบความสามารถแบบอ่านอย่างเดียว ลงทะเบียน providers และเมตาดาต้า โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ให้ข้าม side effects ที่ทำงานจริง |
| `setup-only`    | การโหลดเมตาดาต้า setup ของช่องผ่าน setup entry แบบเบา                                                                |
| `setup-runtime` | การโหลด setup ของช่องที่ต้องใช้ runtime entry ด้วย                                                                         |
| `cli-metadata`  | การรวบรวมเมตาดาต้า command ของ CLI เท่านั้น                                                                                            |

entry ของ Plugin ที่เปิด sockets, databases, background workers หรือ clients ที่มีอายุยาวควรป้องกัน side effects เหล่านั้นด้วย `api.registrationMode === "full"` โหลด discovery ถูกแคชแยกจากโหลดการเปิดใช้งาน และไม่แทนที่รีจิสทรี Gateway ที่กำลังทำงานอยู่ Discovery เป็นแบบไม่เปิดใช้งาน ไม่ใช่แบบไม่ import: OpenClaw อาจประเมิน entry ของ Plugin ที่เชื่อถือได้หรือโมดูล Plugin ของช่องเพื่อสร้าง snapshot ทำให้ระดับบนสุดของโมดูลเบาและไม่มี side effect และย้าย network clients, subprocesses, listeners, credential reads และ service startup ไปไว้หลังพาธ full-runtime

เมธอดลงทะเบียนทั่วไป:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)        |
| `registerChannel`                       | ช่องแชต                |
| `registerTool`                          | เครื่องมือของ Agent                  |
| `registerHook` / `on(...)`              | hooks ของ Lifecycle             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | เสียงเรียลไทม์แบบ duplex       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์รูปภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างรูปภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | endpoint HTTP               |
| `registerCommand` / `registerCli`       | commands ของ CLI                |
| `registerContextEngine`                 | context engine              |
| `registerService`                       | service เบื้องหลัง          |

พฤติกรรม hook guard สำหรับ lifecycle hooks แบบมีชนิด:

- `before_tool_call`: `{ block: true }` เป็นสถานะสิ้นสุด; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็นสถานะสิ้นสุด; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นสถานะสิ้นสุด; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

แอปเซิร์ฟเวอร์ Codex แบบเนทีฟจะเชื่อมเหตุการณ์เครื่องมือแบบ Codex-native กลับเข้ามายังพื้นผิว hook นี้ Plugins สามารถบล็อกเครื่องมือ Codex แบบเนทีฟผ่าน `before_tool_call`, สังเกตผลลัพธ์ผ่าน `after_tool_call`, และมีส่วนร่วมในการอนุมัติ `PermissionRequest` ของ Codex ได้ bridge ยังไม่ได้เขียนอาร์กิวเมนต์ของเครื่องมือ Codex-native ใหม่ ขอบเขตการรองรับ runtime ของ Codex ที่แน่นอนอยู่ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม hook แบบมีชนิดเต็มรูปแบบ โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง plugins](/th/plugins/building-plugins) - สร้าง plugin ของคุณเอง
- [ชุด Plugin](/th/plugins/bundles) - ความเข้ากันได้ของชุด Codex/Claude/Cursor
- [manifest ของ Plugin](/th/plugins/manifest) - สคีมา manifest
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) - เพิ่มเครื่องมือ agent ใน plugin
- [ภายใน Plugin](/th/plugins/architecture) - โมเดลความสามารถและกระบวนการโหลด
- [plugins ชุมชน](/th/plugins/community) - รายการจากบุคคลที่สาม
