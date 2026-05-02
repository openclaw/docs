---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การใช้งานชุด Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-02T21:00:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
agent harness, เครื่องมือ, Skills, เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียง
แบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงเว็บ, การ
ค้นหาเว็บ และอื่น ๆ Plugin บางตัวเป็น **แกนหลัก** (มาพร้อมกับ OpenClaw) ส่วนตัวอื่น
เป็น **ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) npm ยังคงรองรับสำหรับการติดตั้งโดยตรง และสำหรับชุด
แพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของชั่วคราวระหว่างที่การย้ายนี้ยังเสร็จไม่สมบูรณ์

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้งแบบคัดลอกแล้ววาง, การแสดงรายการ, การถอนการติดตั้ง, การอัปเดต และการเผยแพร่ ดู
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
    ใน Gateway ที่กำลังทำงาน `/plugins enable` และ `/plugins disable` สำหรับเจ้าของเท่านั้น
    จะทริกเกอร์ตัวโหลด config ของ Gateway ใหม่ Gateway จะโหลดพื้นผิว runtime ของ Plugin
    ใหม่ในโปรเซส และรอบ agent ใหม่จะสร้างรายการเครื่องมือของตัวเองใหม่จาก registry
    ที่รีเฟรชแล้ว `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น Gateway
    จึงร้องขอให้รีสตาร์ทแทนที่จะทำเหมือนว่าโปรเซสปัจจุบันสามารถโหลดโมดูลที่ import ไปแล้ว
    ใหม่ได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ, บริการ, เมธอด Gateway,
    hook หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของซึ่งลงทะเบียนไว้ `inspect` แบบปกติเป็นการตรวจสอบ
    manifest/registry แบบ cold และตั้งใจหลีกเลี่ยงการ import runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการควบคุมแบบเนทีฟในแชต ให้เปิดใช้ `commands.plugins: true` และใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: พาธ/archive ภายในเครื่อง, `clawhub:<pkg>` แบบชัดเจน,
`npm:<pkg>` แบบชัดเจน, `git:<repo>` แบบชัดเจน หรือสเปกแพ็กเกจเปล่าผ่าน npm

หาก config ไม่ถูกต้อง ปกติการติดตั้งจะล้มเหลวแบบปิดและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นการกู้คืนเพียงอย่างเดียวคือเส้นทางติดตั้ง Plugin ที่มาพร้อมระบบ
ใหม่แบบจำกัดสำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway config ที่ไม่ถูกต้องของ Plugin หนึ่งตัวจะถูกแยกไว้ที่ Plugin นั้น:
การเริ่มต้นจะบันทึกปัญหา `plugins.entries.<id>.config`, ข้าม Plugin นั้นระหว่าง
โหลด และทำให้ Plugin กับช่องทางอื่นยังออนไลน์อยู่ เรียกใช้ `openclaw doctor --fix`
เพื่อกัก config ของ Plugin ที่เสียโดยปิดใช้งานรายการ Plugin นั้นและลบ payload config
ที่ไม่ถูกต้องของมัน; การสำรอง config ตามปกติจะเก็บค่าก่อนหน้าไว้
เมื่อ config ของช่องทางอ้างอิงถึง Plugin ที่ค้นพบไม่ได้อีกต่อไป แต่ stale plugin id
เดียวกันยังคงอยู่ใน config ของ Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนที่จะบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin ที่ค้างอยู่; key
ของช่องทางที่ไม่รู้จักโดยไม่มีหลักฐาน stale-plugin ยังคงทำให้การตรวจสอบล้มเหลว เพื่อให้การพิมพ์ผิดยังมองเห็นได้
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin ที่ค้างอยู่จะถือว่าไม่มีผล:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะเก็บ
config ของ Plugin ที่ปิดใช้งานไว้แทนที่จะลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
เรียกใช้การล้างข้อมูล doctor หากคุณต้องการลบ stale plugin ids

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่าง flow ติดตั้ง/อัปเดตหรือ
ซ่อมแซมด้วย doctor อย่างชัดเจนเท่านั้น การเริ่มต้น Gateway, การโหลด config ใหม่ และการตรวจสอบ runtime
จะไม่เรียกใช้ package manager หรือซ่อมแซม dependency tree Plugin ภายในเครื่องต้อง
ติดตั้ง dependency ของตัวเองไว้แล้ว ส่วน Plugin จาก npm, git และ ClawHub
จะติดตั้งภายใต้ managed plugin roots ของ OpenClaw dependency ของ npm อาจถูก hoist
ภายใน managed npm root ของ OpenClaw; install/update จะสแกน managed root นั้นก่อน
trust และ uninstall จะลบแพ็กเกจที่ npm จัดการผ่าน npm Plugin ภายนอก
และพาธโหลดแบบกำหนดเองยังคงต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบสแตติกของแต่ละ
Plugin ที่มองเห็นได้โดยไม่ต้อง import โค้ด runtime หรือซ่อมแซม dependency
ดู [การ resolve dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ
วงจรชีวิตตอนติดตั้ง

source checkout เป็น pnpm workspaces หากคุณ clone OpenClaw เพื่อแก้ไข Plugin
ที่มาพร้อมระบบ ให้เรียกใช้ `pnpm install`; จากนั้น OpenClaw จะโหลด Plugin ที่มาพร้อมระบบจาก
`extensions/<id>` เพื่อให้ใช้การแก้ไขและ dependency ภายในแพ็กเกจโดยตรง
การติดตั้ง npm root แบบธรรมดามีไว้สำหรับ OpenClaw แบบแพ็กเกจ ไม่ใช่การพัฒนาแบบ source checkout

## ประเภทของ Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **เนทีฟ** | `openclaw.plugin.json` + โมดูล runtime; ทำงานในโปรเซส       | Plugin ทางการ, แพ็กเกจ npm จากชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปเป็นฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียด bundle

หากคุณกำลังเขียน Plugin แบบเนทีฟ ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## entrypoint ของแพ็กเกจ

แพ็กเกจ npm ของ Plugin แบบเนทีฟต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละ entry ต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve ไปยังไฟล์ runtime ที่อ่านได้
หรือไปยังไฟล์ซอร์ส TypeScript ที่มี peer JavaScript ที่ build แล้วซึ่งอนุมานได้
เช่น `src/index.ts` ไปยัง `dist/index.js`

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ที่พาธ
เดียวกับ source entries เมื่อมี `runtimeExtensions` ต้องมี entry
หนึ่งรายการพอดีสำหรับทุก `extensions` entry รายการที่ไม่ตรงกันจะทำให้การติดตั้งและ
การค้นพบ Plugin ล้มเหลวแทนที่จะ fallback ไปยังพาธซอร์สแบบเงียบ ๆ หากคุณเผยแพร่
`openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ peer
JavaScript ที่ build แล้วของมัน; ไฟล์นั้นจำเป็นเมื่อประกาศไว้

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

ClawHub เป็นเส้นทางหลักในการกระจาย Plugin ส่วนใหญ่ OpenClaw รุ่นแพ็กเกจปัจจุบัน
ได้ bundle Plugin ทางการจำนวนมากไว้แล้ว ดังนั้นโดยปกติในการตั้งค่าทั่วไปไม่จำเป็นต้อง
ติดตั้ง npm แยกต่างหาก จนกว่า Plugin ที่ OpenClaw เป็นเจ้าของทั้งหมดจะย้ายไป
ClawHub เสร็จ OpenClaw ยังคงส่งแพ็กเกจ Plugin `@openclaw/*` บางรายการบน
npm สำหรับการติดตั้งรุ่นเก่า/แบบกำหนดเองและ workflow npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` deprecated แพ็กเกจเวอร์ชันนั้น
มาจากสายแพ็กเกจภายนอกที่เก่ากว่า ใช้ Plugin ที่ bundle มากับ
OpenClaw ปัจจุบันหรือ checkout ภายในเครื่องจนกว่าจะมีแพ็กเกจ npm รุ่นใหม่เผยแพร่

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

### แกนหลัก (มาพร้อมกับ OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้โดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — การค้นหา memory ที่มาพร้อมระบบ (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — long-term memory ที่มี LanceDB เป็น backend พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI,
    ตัวอย่าง Ollama, ขีดจำกัดการ recall และการแก้ไขปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่น ๆ">
    - `browser` — Plugin เบราว์เซอร์ที่มาพร้อมระบบสำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด Gateway `browser.request`, runtime ของเบราว์เซอร์ และบริการควบคุมเบราว์เซอร์ค่าเริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ปิดใช้ก่อนแทนที่)
    - `copilot-proxy` — บริดจ์ VS Code Copilot Proxy (ปิดใช้โดยค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่หรือไม่ ดู [Plugin ชุมชน](/th/plugins/community)

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
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny ชนะ)                     |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`          | ตัวเลือก slot แบบผูกขาด (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | toggle + config ต่อ Plugin                               |

`plugins.allow` เป็นแบบ exclusive เมื่อไม่ว่าง จะโหลดหรือเปิดเผยเครื่องมือได้เฉพาะ Plugin
ที่อยู่ในรายการเท่านั้น แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
แบบเจาะจงก็ตาม หาก tool allowlist อ้างอิงถึงเครื่องมือของ Plugin ให้เพิ่ม plugin ids
เจ้าของลงใน `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

การเปลี่ยนแปลง config ที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์การโหลด Plugin ของ Gateway ใหม่ภายใน process เดียวกัน agent turn ใหม่จะสร้างรายการเครื่องมือของตัวเองขึ้นใหม่จาก plugin registry ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยน source เช่น install, update และ uninstall ยังคง restart process ของ Gateway เพราะโมดูล Plugin ที่ import ไปแล้วไม่สามารถแทนที่ในตำแหน่งเดิมได้อย่างปลอดภัย

`openclaw plugins list` คือ snapshot ของ plugin registry/config ภายในเครื่อง Plugin ที่เป็น `enabled` ตรงนั้นหมายถึง registry ที่บันทึกไว้และ config ปัจจุบันอนุญาตให้ Plugin เข้าร่วมได้ แต่ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังรันอยู่ได้ reload หรือ restart ไปใช้โค้ด Plugin เดียวกันแล้ว ในชุดติดตั้ง VPS/container ที่มี wrapper process ให้ส่ง restart หรือการเขียนที่ทริกเกอร์ reload ไปยัง process `openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ Gateway ที่กำลังรันอยู่เมื่อ reload รายงานความล้มเหลว

<Accordion title="สถานะ Plugin: disabled vs missing vs invalid">
  - **Disabled**: มี Plugin อยู่ แต่กฎ enablement ปิดไว้ config จะถูกเก็บไว้
  - **Missing**: config อ้างถึง plugin id ที่ discovery หาไม่พบ
  - **Invalid**: มี Plugin อยู่ แต่ config ไม่ตรงกับ schema ที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักรายการที่ invalid โดยปิดใช้งานและลบ payload ของ config ออกได้

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงจะชนะ):

<Steps>
  <Step title="เส้นทาง config">
    `plugins.load.paths` — เส้นทางไฟล์หรือไดเรกทอรีแบบระบุชัดเจน เส้นทางที่ชี้กลับไปยังไดเรกทอรี bundled plugin ที่แพ็กมากับ OpenClaw เองจะถูกละเว้น; รัน `openclaw doctor --fix` เพื่อลบ alias เก่าที่ค้างอยู่เหล่านั้น
  </Step>

  <Step title="Plugin ใน workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Bundled plugins">
    จัดส่งมาพร้อม OpenClaw หลายตัวถูกเปิดใช้งานตามค่าเริ่มต้น (model provider, speech) ตัวอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

โดยปกติ การติดตั้งแบบแพ็กเกจและอิมเมจ Docker จะ resolve bundled plugins จาก tree `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรี source ของ bundled plugin ถูก bind-mount ทับเส้นทาง source ที่แพ็กเกจไว้ซึ่งตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรี source ที่ mount นั้นเป็น bundled source overlay และค้นพบก่อน bundle `/app/dist/extensions/synology-chat` ที่แพ็กเกจไว้ วิธีนี้ช่วยให้ loop ของ container สำหรับ maintainer ทำงานได้โดยไม่ต้องสลับทุก bundled plugin กลับไปเป็น TypeScript source ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้ packaged dist bundles แม้มี source overlay mounts อยู่

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นพบ/โหลด Plugin
- `plugins.deny` ชนะ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจาก workspace จะถูก **ปิดใช้งานตามค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Bundled plugins ทำตามชุดค่าเริ่มต้น built-in ที่เปิดไว้ เว้นแต่ถูก override
- exclusive slots สามารถ force-enable Plugin ที่เลือกสำหรับ slot นั้นได้
- bundled opt-in plugins บางตัวจะถูกเปิดใช้งานโดยอัตโนมัติเมื่อ config ระบุ surface ที่ Plugin เป็นเจ้าของ เช่น provider model ref, channel config หรือ harness runtime
- config ของ Plugin ที่เก่าค้างจะถูกเก็บไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่; เปิดใช้งาน Plugin อีกครั้งก่อนรัน doctor cleanup หากต้องการลบ id ที่เก่าค้าง
- route ของตระกูล OpenAI Codex จะรักษาขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ OpenAI plugin ขณะที่ bundled Codex
  app-server plugin จะถูกเลือกด้วย `agentRuntime.id: "codex"` หรือ model ref แบบ legacy
  `codex/*`

## การแก้ปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hook ของ `register(api)` ไม่ทำงานใน traffic แชทจริง ให้ตรวจสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL, profile, เส้นทาง config และ process ของ Gateway ที่ active อยู่คือสิ่งที่คุณกำลังแก้ไข
- Restart Gateway ที่ใช้งานจริงหลังการเปลี่ยนแปลง install/config/code ของ Plugin ใน wrapper containers PID 1 อาจเป็นเพียง supervisor; restart หรือ signal process ลูก `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยัน hook registrations และ diagnostics conversation hooks ที่ไม่ใช่ bundled เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end` ต้องมี `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับ model ให้เลือกใช้ `before_model_resolve` มันทำงานก่อนการ resolve model สำหรับ agent turns; `llm_output` ทำงานหลังจาก model attempt สร้าง assistant output แล้วเท่านั้น
- สำหรับหลักฐานของ session model ที่มีผล ให้ใช้ `openclaw sessions` หรือ surface session/status ของ Gateway และเมื่อ debug provider payloads ให้เริ่ม Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หาก agent turns ดูเหมือนหยุดค้างระหว่างเตรียมเครื่องมือ ให้เปิด trace logging และตรวจบรรทัด timing ของ plugin tool factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลารวมของ factory และ plugin tool factories ที่ช้าที่สุด รวมถึง plugin id, ชื่อเครื่องมือที่ประกาศไว้, รูปแบบผลลัพธ์ และเครื่องมือนั้นเป็น optional หรือไม่ บรรทัดที่ช้าจะถูกเลื่อนเป็นคำเตือนเมื่อ factory เดียวใช้เวลาอย่างน้อย 1 วินาที หรือการเตรียม plugin tool factory ทั้งหมดใช้เวลาอย่างน้อย 5 วินาที

OpenClaw cache ผลลัพธ์ plugin tool factory ที่สำเร็จสำหรับการ resolve ซ้ำด้วย effective request context เดียวกัน cache key รวม effective runtime config, workspace, agent/session ids, sandbox policy, browser settings, delivery context, requester identity และ ownership state ดังนั้น factory ที่ขึ้นกับ trusted fields เหล่านั้นจะถูกรันใหม่เมื่อ context เปลี่ยน

หาก Plugin ตัวหนึ่งครองเวลา timing ให้ตรวจ runtime registrations ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้น update, reinstall หรือ disable Plugin นั้น ผู้เขียน Plugin ควรย้ายการโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้หลังเส้นทางการ execute เครื่องมือ แทนที่จะทำภายใน tool factory

### channel หรือ tool ownership ซ้ำ

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่า Plugin ที่เปิดใช้งานมากกว่าหนึ่งตัวกำลังพยายามเป็นเจ้าของ channel, setup flow หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ external channel plugin ถูกติดตั้งไว้ข้าง bundled plugin ที่ตอนนี้ให้ channel id เดียวกัน

ขั้นตอน debug:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัวและต้นทาง
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และเปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ package ของ Plugin เพื่อให้ metadata ที่บันทึกไว้สะท้อนการติดตั้งปัจจุบัน
- Restart Gateway หลังการเปลี่ยนแปลง install, registry หรือ config

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีกตัวสำหรับ channel id เดียวกัน Plugin ที่ควรใช้เป็นหลักควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม plugin id ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากรายการซ้ำเกิดโดยไม่ตั้งใจ ให้ปิดใช้งานฝ่ายหนึ่งด้วย `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin ที่เก่าค้าง
- หากคุณเปิดใช้งาน Plugin ทั้งสองอย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และรายงาน conflict ให้เลือก owner หนึ่งสำหรับ channel หรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของเพื่อให้ runtime surface ไม่กำกวม

## Plugin slots (หมวดหมู่เฉพาะ)

บางหมวดหมู่เป็นแบบเฉพาะ (active ได้ครั้งละหนึ่งตัวเท่านั้น):

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

| Slot            | สิ่งที่ควบคุม         | ค่าเริ่มต้น          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory plugin  | `memory-core`       |
| `contextEngine` | active context engine | `legacy` (built-in) |

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

Bundled plugins จัดส่งมาพร้อม OpenClaw หลายตัวถูกเปิดใช้งานตามค่าเริ่มต้น (ตัวอย่างเช่น bundled model providers, bundled speech providers และ bundled browser plugin) bundled plugins อื่นยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้ `openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ Plugin จาก npm ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งนำเส้นทาง source กลับมาใช้แทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

เมื่อ `plugins.allow` ถูกตั้งค่าไว้แล้ว `openclaw plugins install` จะเพิ่ม plugin id ที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้งาน หาก plugin id เดียวกันอยู่ใน `plugins.deny` การ install จะลบรายการ deny เก่าที่ค้างอยู่นั้น เพื่อให้การติดตั้งที่ระบุอย่างชัดเจนโหลดได้ทันทีหลัง restart

OpenClaw เก็บรีจิสทรี Plugin แบบภายในเครื่องที่บันทึกถาวรไว้เป็นโมเดลการอ่านแบบเย็นสำหรับ
คลัง Plugin, ความเป็นเจ้าของการมีส่วนร่วม และการวางแผนตอนเริ่มต้น โฟลว์ติดตั้ง อัปเดต
ถอนการติดตั้ง เปิดใช้ และปิดใช้จะรีเฟรชรีจิสทรีนั้นหลังจากเปลี่ยนสถานะ Plugin ไฟล์
`plugins/installs.json` เดียวกันเก็บเมทาดาทาการติดตั้งถาวรไว้ใน `installRecords`
ระดับบนสุด และเก็บเมทาดาทา manifest ที่สร้างใหม่ได้ไว้ใน `plugins` หากรีจิสทรีหายไป
ล้าสมัย หรือไม่ถูกต้อง `openclaw plugins registry --refresh` จะสร้างมุมมอง manifest
ใหม่จากบันทึกการติดตั้ง นโยบาย config และเมทาดาทา manifest/package โดยไม่โหลดโมดูล
รันไทม์ของ Plugin
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามไว้ การส่ง spec
แพ็กเกจ npm พร้อม dist-tag หรือเวอร์ชันแบบเจาะจงจะแก้ชื่อแพ็กเกจกลับไปยังระเบียน
Plugin ที่ติดตามไว้ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต การส่งชื่อแพ็กเกจโดยไม่มี
เวอร์ชันจะย้ายการติดตั้งที่ปักหมุดเวอร์ชันแน่นอนกลับไปยังไลน์รีลีสเริ่มต้นของรีจิสทรี
หาก Plugin npm ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่แก้ได้และอัตลักษณ์อาร์ติแฟกต์ที่บันทึกไว้แล้ว
OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่อง beta ระเบียน Plugin แบบ npm และ ClawHub ในไลน์
เริ่มต้นจะลอง `@beta` ก่อน แล้วถอยกลับไปใช้ default/latest เมื่อไม่มีรีลีส beta ของ
Plugin เวอร์ชันแบบเจาะจงและแท็กที่ระบุชัดเจนจะยังคงถูกปักหมุดไว้

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับกับ `--marketplace` เพราะการติดตั้งจาก
marketplace จะบันทึกเมทาดาทาแหล่งที่มาของ marketplace แทน spec ของ npm

`--dangerously-force-unsafe-install` เป็นตัวเลือก override ฉุกเฉินสำหรับผลบวกลวงจาก
ตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้ง Plugin และการอัปเดต Plugin ดำเนินต่อหลังจาก
พบรายการ `critical` จากตัวสแกนในตัว แต่ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ
Plugin หรือการบล็อกเมื่อการสแกนล้มเหลว การสแกนการติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป
เช่น `tests/`, `__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก mock
ทดสอบที่แพ็กมาด้วย แต่ entrypoint รันไทม์ของ Plugin ที่ประกาศไว้จะยังถูกสแกนแม้ใช้ชื่อ
หนึ่งในเหล่านั้น

แฟล็ก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ Skills
ที่มี Gateway รองรับจะใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall`
แทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub
ที่แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิดแดชบอร์ด
ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจอีกครั้ง
`--dangerously-force-unsafe-install` มีผลเฉพาะกับการติดตั้งบนเครื่องของคุณเองเท่านั้น
มันไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่ หรือทำให้รีลีสที่ถูกบล็อกเผยแพร่สู่สาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วมโฟลว์รายการ/ตรวจสอบ/เปิดใช้/ปิดใช้ Plugin เดียวกัน
การรองรับรันไทม์ปัจจุบันรวมถึง Skills แบบบันเดิล, command-skills ของ Claude,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook ของ
Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึงรายการ
เซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มีบันเดิลรองรับ

แหล่งที่มา marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, ราก marketplace ภายในเครื่องหรือพาธ
`marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git
สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มา
และใช้แหล่งที่มาแบบพาธสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [เอกสารอ้างอิง CLI ของ `openclaw plugins`](/th/cli/plugins)

## ภาพรวม Plugin API

Plugin แบบ native ส่งออกอ็อบเจกต์ entry ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
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

OpenClaw โหลดอ็อบเจกต์ entry และเรียก `register(api)` ระหว่างการ activate Plugin
ตัวโหลดจะยังถอยกลับไปใช้ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่ bundled
มากับระบบและ Plugin ภายนอกใหม่ควรมอง `register` เป็นสัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่าทำไม entry ของมันจึงถูกโหลด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การ activate รันไทม์ ลงทะเบียนเครื่องมือ hook บริการ คำสั่ง route และ side effect แบบ live อื่นๆ                              |
| `discovery`     | การค้นพบความสามารถแบบอ่านอย่างเดียว ลงทะเบียน provider และเมทาดาทา; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจถูกโหลด แต่ให้ข้าม side effect แบบ live |
| `setup-only`    | การโหลดเมทาดาทาการตั้งค่า channel ผ่าน setup entry แบบเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่า channel ที่ต้องใช้ runtime entry ด้วย                                                                         |
| `cli-metadata`  | การรวบรวมเมทาดาทาคำสั่ง CLI เท่านั้น                                                                                            |

Plugin entry ที่เปิด socket, database, background worker หรือ client ที่อยู่ได้นาน
ควรป้องกัน side effect เหล่านั้นด้วย `api.registrationMode === "full"` การโหลดเพื่อ
discovery ถูกแคชแยกจากการโหลดเพื่อ activate และไม่แทนที่รีจิสทรี Gateway ที่กำลังทำงาน
Discovery เป็นแบบไม่ activate แต่ไม่ใช่แบบปลอด import: OpenClaw อาจประเมิน entry ของ
Plugin ที่เชื่อถือได้หรือโมดูล Plugin ของ channel เพื่อสร้าง snapshot ให้รักษา top level
ของโมดูลให้เบาและไม่มี side effect และย้าย client เครือข่าย, subprocess, listener,
การอ่าน credential และการเริ่มบริการไปไว้หลังพาธ full-runtime

เมธอดลงทะเบียนทั่วไป:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider โมเดล (LLM)        |
| `registerChannel`                       | Channel แชต                |
| `registerTool`                          | เครื่องมือ agent                  |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | เสียงเรียลไทม์แบบสองทาง       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | Provider สำหรับ Web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | บริการเบื้องหลัง          |

พฤติกรรม guard ของ hook สำหรับ lifecycle hook แบบ typed:

- `before_tool_call`: `{ block: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้างการบล็อกก่อนหน้า
- `before_install`: `{ block: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้างการบล็อกก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้างการยกเลิกก่อนหน้า

app-server ของ Codex แบบ native จะ bridge เหตุการณ์เครื่องมือแบบ Codex-native กลับเข้า
พื้นผิว hook นี้ Plugin สามารถบล็อกเครื่องมือ Codex แบบ native ผ่าน `before_tool_call`,
สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมการอนุมัติ `PermissionRequest` ของ Codex
ได้ bridge ยังไม่เขียน argument ของเครื่องมือแบบ Codex-native ใหม่ ขอบเขตการรองรับรันไทม์
Codex ที่แน่นอนอยู่ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม hook แบบ typed ทั้งหมด ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) — ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [Manifest ของ Plugin](/th/plugins/manifest) — schema ของ manifest
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือ agent ใน Plugin
- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและ pipeline การโหลด
- [Plugin ชุมชน](/th/plugins/community) — รายการจากบุคคลที่สาม
