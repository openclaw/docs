---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับบันเดิล Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
harness ของเอเจนต์, เครื่องมือ, Skills, เสียงพูด, การถอดเสียงแบบเรียลไทม์,
เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ,
และอื่น ๆ Plugin บางตัวเป็น **แกนหลัก** (มาพร้อมกับ OpenClaw) ส่วนตัวอื่น ๆ
เป็น **ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) npm ยังรองรับสำหรับการติดตั้งโดยตรงและสำหรับ
ชุดแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของชั่วคราว ระหว่างที่การย้ายข้อมูลนั้นเสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้งแบบคัดลอกแล้ววาง, การแสดงรายการ, การถอนการติดตั้ง, การอัปเดต และการเผยแพร่ โปรดดู
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

  <Step title="การจัดการแบบเนทีฟผ่านแชต">
    ใน Gateway ที่กำลังทำงานอยู่ คำสั่งสำหรับเจ้าของเท่านั้น `/plugins enable` และ `/plugins disable`
    จะทริกเกอร์ตัวโหลด config ซ้ำของ Gateway Gateway โหลด runtime surface ของ Plugin
    ใหม่ในโปรเซส และรอบการทำงานใหม่ของเอเจนต์จะสร้างรายการเครื่องมือใหม่จาก
    รีจิสทรีที่รีเฟรชแล้ว `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น
    Gateway จึงขอให้รีสตาร์ทแทนการแสร้งว่าโปรเซสปัจจุบันสามารถ
    โหลดโมดูลที่ import แล้วซ้ำได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ, บริการ, เมธอด gateway,
    hook หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของที่ลงทะเบียนไว้ `inspect` แบบปกติเป็นการตรวจสอบ
    manifest/registry แบบเย็น และจงใจหลีกเลี่ยงการ import runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการควบคุมแบบเนทีฟผ่านแชต ให้เปิดใช้ `commands.plugins: true` และใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: เส้นทาง/ไฟล์เก็บถาวรในเครื่อง, ระบุ
`clawhub:<pkg>` อย่างชัดเจน, ระบุ `npm:<pkg>` อย่างชัดเจน, ระบุ `git:<repo>` อย่างชัดเจน หรือสเปกแพ็กเกจ
เปล่าผ่าน npm

หาก config ไม่ถูกต้อง การติดตั้งตามปกติจะล้มเหลวแบบปิดและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นสำหรับการกู้คืนมีเพียงเส้นทางแคบ ๆ สำหรับติดตั้ง Plugin แบบบันเดิลซ้ำ
สำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway config ของ Plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเหมือน config ที่ไม่ถูกต้องอื่น ๆ
เรียกใช้ `openclaw doctor --fix` เพื่อกัก config ของ Plugin ที่เสียโดย
ปิดใช้งานรายการ Plugin นั้นและลบ payload config ที่ไม่ถูกต้องของมัน; การสำรองข้อมูล
config ตามปกติจะเก็บค่าก่อนหน้าไว้
เมื่อ config ของช่องทางอ้างอิง Plugin ที่ไม่สามารถค้นพบได้อีกต่อไป แต่
id ของ Plugin เดิมที่ค้างอยู่ยังคงอยู่ใน config ของ Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนที่จะบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin ที่ค้างอยู่; key ของช่องทางที่ไม่รู้จัก
โดยไม่มีหลักฐาน Plugin ค้างอยู่ยังคงล้มเหลวในการตรวจสอบความถูกต้องเพื่อให้การพิมพ์ผิดยังเห็นได้ชัด
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin ที่ค้างอยู่จะถือว่าไม่มีผล:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะเก็บ
config ของ Plugin ที่ปิดใช้งานไว้แทนการลบโดยอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
เรียกใช้การล้างข้อมูลด้วย doctor หากคุณต้องการลบ id ของ Plugin ที่ค้างอยู่

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่างขั้นตอนติดตั้ง/อัปเดตที่ระบุชัดเจน หรือ
ขั้นตอนซ่อมแซมของ doctor เท่านั้น การเริ่มต้น Gateway, การโหลด config ซ้ำ และการตรวจสอบ runtime
จะไม่เรียกใช้ package manager หรือซ่อมแซม dependency tree Plugin ในเครื่องต้อง
ติดตั้ง dependency ของตนไว้แล้ว ขณะที่ Plugin จาก npm, git และ ClawHub จะถูก
ติดตั้งภายใต้ราก Plugin ที่ OpenClaw จัดการ dependency ของ npm อาจถูก hoist
ภายในราก npm ที่ OpenClaw จัดการ; install/update จะสแกนรากที่จัดการนั้นก่อน
trust และ uninstall จะลบแพ็กเกจที่ npm จัดการผ่าน npm Plugin ภายนอก
และเส้นทางโหลดแบบกำหนดเองยังต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบคงที่ของ Plugin
ที่มองเห็นได้แต่ละตัวโดยไม่ import โค้ด runtime หรือซ่อมแซม dependency
ดู [การแก้ dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ
วงจรชีวิต ณ เวลาติดตั้ง

สำหรับการติดตั้ง npm selector ที่เปลี่ยนแปลงได้ เช่น `latest` หรือ dist-tag จะถูก resolve
ก่อนการติดตั้ง แล้วจึง pin เป็นเวอร์ชันที่ตรวจสอบแล้วแน่นอนในราก npm
ที่ OpenClaw จัดการ หลังจาก npm ทำงานเสร็จ OpenClaw จะตรวจสอบว่ารายการ
`package-lock.json` ที่ติดตั้งยังตรงกับเวอร์ชันและ integrity ที่ resolve ไว้ หาก
npm เขียน metadata ของแพ็กเกจต่างออกไป การติดตั้งจะล้มเหลวและแพ็กเกจที่จัดการ
จะถูกย้อนกลับแทนการยอมรับ artifact ของ Plugin อื่น

การ checkout ซอร์สเป็น pnpm workspace หากคุณ clone OpenClaw เพื่อแก้ไข
Plugin แบบบันเดิล ให้เรียกใช้ `pnpm install`; จากนั้น OpenClaw จะโหลด Plugin แบบบันเดิลจาก
`extensions/<id>` เพื่อให้ใช้การแก้ไขและ dependency เฉพาะแพ็กเกจโดยตรง
การติดตั้งรากด้วย npm แบบปกติมีไว้สำหรับ OpenClaw แบบแพ็กเกจ ไม่ใช่การพัฒนา
จาก source checkout

## ประเภทของ Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **เนทีฟ** | `openclaw.plugin.json` + โมดูล runtime; ทำงานในโปรเซส       | Plugin ทางการ, แพ็กเกจ npm ของชุมชน               |
| **Bundle** | layout ที่เข้ากันได้กับ Codex/Claude/Cursor; map เป็นฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดู [บันเดิล Plugin](/th/plugins/bundles) สำหรับรายละเอียดของ bundle

หากคุณกำลังเขียน Plugin แบบเนทีฟ ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## entrypoint ของแพ็กเกจ

แพ็กเกจ npm ของ Plugin แบบเนทีฟต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละรายการต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve เป็นไฟล์
runtime ที่อ่านได้ หรือเป็นไฟล์ซอร์ส TypeScript ที่มี peer JavaScript ที่ build แล้วซึ่งอนุมานได้
เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบแพ็กเกจต้องจัดส่ง output runtime ของ JavaScript นั้น fallback ของซอร์ส
TypeScript มีไว้สำหรับ source checkout และเส้นทางพัฒนาในเครื่อง ไม่ใช่สำหรับ
แพ็กเกจ npm ที่ติดตั้งเข้าไปในราก Plugin ที่ OpenClaw จัดการ

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ที่
เส้นทางเดียวกับรายการซอร์ส เมื่อมี `runtimeExtensions` ต้องมี
หนึ่งรายการพอดีสำหรับทุกรายการ `extensions` รายการที่ไม่ตรงกันจะทำให้การติดตั้งและ
การค้นพบ Plugin ล้มเหลว แทนที่จะ fallback ไปยังเส้นทางซอร์สอย่างเงียบ ๆ หากคุณ
เผยแพร่ `openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ peer
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

### แพ็กเกจ npm ที่ OpenClaw เป็นเจ้าของระหว่างการย้ายข้อมูล

ClawHub เป็นเส้นทางการแจกจ่ายหลักสำหรับ Plugin ส่วนใหญ่ OpenClaw รุ่นแพ็กเกจปัจจุบัน
มาพร้อมกับ Plugin ทางการจำนวนมากแล้ว ดังนั้น Plugin เหล่านั้นไม่จำเป็นต้อง
ติดตั้ง npm แยกต่างหากในการตั้งค่าปกติ จนกว่า Plugin ที่ OpenClaw เป็นเจ้าของทุกตัวจะ
ย้ายไป ClawHub เสร็จ OpenClaw ยังจัดส่งแพ็กเกจ Plugin `@openclaw/*` บางส่วนบน
npm สำหรับการติดตั้งแบบเก่า/กำหนดเอง และ workflow ของ npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` ถูก deprecate แล้ว เวอร์ชันแพ็กเกจนั้น
มาจากชุดแพ็กเกจภายนอกที่เก่ากว่า ใช้ Plugin แบบบันเดิลจาก
OpenClaw ปัจจุบัน หรือ checkout ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

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

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` — การค้นหาหน่วยความจำแบบบันเดิล (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวที่รองรับด้วย LanceDB พร้อมการเรียกคืน/บันทึกอัตโนมัติ (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI,
    ตัวอย่าง Ollama, ขีดจำกัดการเรียกคืน และการแก้ไขปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่น ๆ">
    - `browser` — Plugin เบราว์เซอร์แบบบันเดิลสำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด gateway `browser.request`, runtime ของเบราว์เซอร์ และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ปิดใช้ก่อนแทนที่)
    - `copilot-proxy` — สะพาน VS Code Copilot Proxy (ปิดใช้โดยค่าเริ่มต้น)

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

| ฟิลด์              | คำอธิบาย                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                           |
| `allow`            | รายการอนุญาตของ Plugin (ไม่บังคับ)                               |
| `bundledDiscovery` | โหมดการค้นพบ Plugin ที่มาพร้อมระบบ (ค่าเริ่มต้นคือ `allowlist`)    |
| `deny`             | รายการปฏิเสธของ Plugin (ไม่บังคับ; ปฏิเสธชนะ)                     |
| `load.paths`       | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`            | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>`   | สวิตช์เปิด/ปิดและการตั้งค่าต่อ Plugin                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อมีค่าไม่ว่าง จะโหลดหรือเปิดเผยเครื่องมือได้เฉพาะ Plugin ที่ระบุไว้เท่านั้น แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือที่ Plugin นั้นเป็นเจ้าของโดยเฉพาะก็ตาม หากรายการอนุญาตของเครื่องมืออ้างถึงเครื่องมือของ Plugin ให้เพิ่ม id ของ Plugin เจ้าของไปที่ `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับรูปแบบนี้

`plugins.bundledDiscovery` มีค่าเริ่มต้นเป็น `"allowlist"` สำหรับ config ใหม่ ดังนั้นบัญชีรายการ `plugins.allow` ที่เข้มงวดจะบล็อก Plugin ผู้ให้บริการที่มาพร้อมระบบซึ่งไม่ได้ระบุไว้ด้วย รวมถึงการค้นพบผู้ให้บริการ web-search ใน runtime ด้วย Doctor จะประทับตรา config รายการอนุญาตแบบเข้มงวดรุ่นเก่าด้วย `"compat"` ระหว่างการย้ายข้อมูล เพื่อให้การอัปเกรดยังคงพฤติกรรมผู้ให้บริการที่มาพร้อมระบบแบบเดิมไว้จนกว่าผู้ปฏิบัติงานจะเลือกใช้โหมดที่เข้มงวดกว่า ค่า `plugins.allow` ที่ว่างยังถือว่าไม่ได้ตั้งค่า/เปิดอยู่

การเปลี่ยนแปลง config ผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์การโหลด Plugin ของ Gateway ใหม่ภายใน process เทิร์นใหม่ของ agent จะสร้างรายการเครื่องมือจาก registry ของ Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยน source เช่น install, update และ uninstall ยังรีสตาร์ท process ของ Gateway เพราะโมดูล Plugin ที่ import แล้วไม่สามารถแทนที่ในที่เดิมได้อย่างปลอดภัย

`openclaw plugins list` เป็นสแนปช็อต registry/config ของ Plugin ในเครื่อง Plugin ที่ `enabled` ตรงนั้นหมายความว่า registry ที่บันทึกถาวรและ config ปัจจุบันอนุญาตให้ Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังทำงานอยู่ได้โหลดใหม่หรือรีสตาร์ทเข้าสู่โค้ด Plugin เดียวกันแล้ว ในการตั้งค่าแบบ VPS/container ที่มี wrapper process ให้ส่งการรีสตาร์ทหรือการเขียนที่ทริกเกอร์การโหลดใหม่ไปยัง process `openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ Gateway ที่กำลังทำงานอยู่เมื่อการโหลดใหม่รายงานความล้มเหลว

<Accordion title="สถานะ Plugin: ปิดใช้งาน vs ขาดหาย vs ไม่ถูกต้อง">
  - **ปิดใช้งาน**: มี Plugin อยู่ แต่กฎการเปิดใช้งานปิดไว้ Config จะถูกเก็บไว้
  - **ขาดหาย**: config อ้างถึง id ของ Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: มี Plugin อยู่ แต่ config ไม่ตรงกับ schema ที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักกันรายการที่ไม่ถูกต้องได้โดยปิดใช้งานและลบ payload config ของรายการนั้น

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการที่ตรงกันรายการแรกชนะ):

<Steps>
  <Step title="พาธ Config">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน พาธที่ชี้กลับไปยังไดเรกทอรี Plugin ที่มาพร้อมแพ็กเกจของ OpenClaw เองจะถูกละเว้น; เรียกใช้ `openclaw doctor --fix` เพื่อลบ alias เก่าเหล่านั้น
  </Step>

  <Step title="Plugin ใน workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ระดับ global">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ที่มาพร้อมระบบ">
    จัดส่งมาพร้อม OpenClaw หลายรายการเปิดใช้งานโดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, speech)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและ Docker images โดยปกติจะ resolve Plugin ที่มาพร้อมระบบจาก tree `dist/extensions` ที่ compile แล้ว หากไดเรกทอรี source ของ Plugin ที่มาพร้อมระบบถูก bind-mounted ทับพาธ source ที่ตรงกันในแพ็กเกจ เช่น `/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรี source ที่ mount นั้นเป็น bundled source overlay และค้นพบก่อน bundle `/app/dist/extensions/synology-chat` ที่อยู่ในแพ็กเกจ วิธีนี้ทำให้ลูป container ของ maintainer ทำงานได้โดยไม่ต้องสลับ Plugin ที่มาพร้อมระบบทุกตัวกลับไปเป็น TypeScript source ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้ dist bundle ที่อยู่ในแพ็กเกจแม้ว่าจะมี source overlay mount อยู่ก็ตาม

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นพบ/โหลด Plugin
- `plugins.deny` ชนะ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจาก workspace จะ **ปิดใช้งานโดยค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin ที่มาพร้อมระบบทำตามชุดค่าเริ่มต้นแบบเปิดในตัว เว้นแต่จะถูก override
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin ที่มาพร้อมระบบบางรายการซึ่งต้อง opt-in จะเปิดใช้งานโดยอัตโนมัติเมื่อ config ระบุ surface ที่ Plugin เป็นเจ้าของ เช่น provider model ref, channel config หรือ harness runtime
- config ของ Plugin ที่ค้างอยู่จะถูกเก็บไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่; เปิดใช้งาน Plugin อีกครั้งก่อนเรียกใช้การ cleanup ของ doctor หากคุณต้องการลบ id ที่ค้างอยู่
- เส้นทาง Codex ตระกูล OpenAI จะคงขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ OpenAI Plugin ส่วน Codex app-server Plugin ที่มาพร้อมระบบจะถูกเลือกโดย `agentRuntime.id: "codex"` หรือ model refs แบบเดิม `codex/*`

## การแก้ปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ผลข้างเคียงหรือ hooks ของ `register(api)` ไม่ทำงานในทราฟฟิกแชทสด ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- เรียกใช้ `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL, profile, พาธ config และ process ของ Gateway ที่ active เป็นรายการที่คุณกำลังแก้ไข
- รีสตาร์ท Gateway สดหลังจากเปลี่ยนแปลงการติดตั้ง/config/โค้ดของ Plugin ใน wrapper containers, PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ทหรือส่งสัญญาณไปยัง process ลูก `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ diagnostics hook การสนทนาที่ไม่ได้มาพร้อมระบบ เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end` ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้ใช้ `before_model_resolve` เป็นหลัก มันทำงานก่อนการ resolve โมเดลสำหรับเทิร์นของ agent; `llm_output` จะทำงานหลังจากความพยายามใช้โมเดลสร้าง output ของ assistant แล้วเท่านั้น
- สำหรับหลักฐานของโมเดล session ที่มีผล ให้ใช้ `openclaw sessions` หรือ surface session/status ของ Gateway และเมื่อ debug payload ของ provider ให้เริ่ม Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ที่ช้า

หากเทิร์นของ agent ดูเหมือนหยุดค้างขณะเตรียมเครื่องมือ ให้เปิดใช้งาน trace logging และตรวจสอบบรรทัด timing ของ plugin tool factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลา factory รวมและ factory เครื่องมือ Plugin ที่ช้าที่สุด รวมถึง id ของ Plugin, ชื่อเครื่องมือที่ประกาศ, รูปแบบผลลัพธ์ และระบุว่าเครื่องมือนั้นเป็น optional หรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็น warnings เมื่อ factory รายเดียวใช้เวลาอย่างน้อย 1s หรือการเตรียม plugin tool factory ทั้งหมดใช้เวลาอย่างน้อย 5s

OpenClaw cache ผลลัพธ์ plugin tool factory ที่สำเร็จสำหรับการ resolve ซ้ำด้วย context คำขอที่มีผลเหมือนกัน cache key รวมถึง runtime config ที่มีผล, workspace, id ของ agent/session, นโยบาย sandbox, การตั้งค่า browser, delivery context, ตัวตนของ requester และสถานะ ownership ดังนั้น factory ที่ขึ้นกับฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกเรียกซ้ำเมื่อ context เปลี่ยน

หาก Plugin หนึ่งครองเวลาส่วนใหญ่ ให้ตรวจสอบการลงทะเบียน runtime ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้น update, reinstall หรือ disable Plugin นั้น ผู้เขียน Plugin ควรย้ายการโหลด dependency ที่แพงไปไว้หลังเส้นทางการ execution ของเครื่องมือ แทนที่จะทำภายใน tool factory

### channel หรือ ownership ของเครื่องมือซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

ข้อความเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้งานมากกว่าหนึ่งรายการกำลังพยายามเป็นเจ้าของ channel, setup flow หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือมี Plugin channel ภายนอกติดตั้งอยู่ข้าง Plugin ที่มาพร้อมระบบซึ่งตอนนี้มี channel id เดียวกันแล้ว

ขั้นตอน debug:

- เรียกใช้ `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัวและต้นทาง
- เรียกใช้ `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และเปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- เรียกใช้ `openclaw plugins registry --refresh` หลังจากติดตั้งหรือลบแพ็กเกจ Plugin เพื่อให้ metadata ที่บันทึกถาวรสะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ท Gateway หลังจากเปลี่ยนแปลง install, registry หรือ config

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจจะแทนที่อีกตัวสำหรับ channel id เดียวกัน Plugin ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม id ของ Plugin ที่มีความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากรายการซ้ำเกิดขึ้นโดยไม่ตั้งใจ ให้ปิดใช้งานฝั่งหนึ่งด้วย `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin ที่ค้างอยู่
- หากคุณเปิดใช้งาน Plugin ทั้งสองอย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และรายงาน conflict เลือก owner หนึ่งรายสำหรับ channel หรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของเพื่อให้ runtime surface ไม่กำกวม

## สล็อต Plugin (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (active ได้ครั้งละหนึ่งเท่านั้น):

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
| `memory`        | Active memory plugin  | `memory-core`       |
| `contextEngine` | Active context engine | `legacy` (built-in) |

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

Plugin ที่รวมมาในตัวจะมาพร้อมกับ OpenClaw หลายรายการถูกเปิดใช้ตามค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลที่รวมมาในตัว ผู้ให้บริการเสียงพูดที่รวมมาในตัว และ Plugin เบราว์เซอร์ที่รวมมาในตัว) Plugin อื่นที่รวมมาในตัวยังต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือแพ็ก hook ที่ติดตั้งไว้เดิมในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ Plugin npm
ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งจะใช้เส้นทางต้นทางซ้ำแทน
การคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

เมื่อกำหนด `plugins.allow` ไว้แล้ว `openclaw plugins install` จะเพิ่ม id ของ
Plugin ที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้ หาก id ของ Plugin เดียวกัน
อยู่ใน `plugins.deny` การติดตั้งจะลบรายการ deny ที่ค้างอยู่นั้น เพื่อให้
การติดตั้งแบบชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin ภายในเครื่องแบบคงอยู่ไว้เป็นโมเดลอ่านแบบ cold สำหรับ
คลังรายการ Plugin ความเป็นเจ้าของ contribution และการวางแผนตอนเริ่มต้นระบบ โฟลว์ install, update,
uninstall, enable และ disable จะรีเฟรชรีจิสทรีนั้นหลังเปลี่ยนสถานะ Plugin
ไฟล์ `plugins/installs.json` เดียวกันจะเก็บเมทาดาทาการติดตั้งแบบคงทนไว้ใน
`installRecords` ระดับบนสุด และเก็บเมทาดาทา manifest ที่สร้างใหม่ได้ไว้ใน `plugins` หาก
รีจิสทรีหายไป ล้าสมัย หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จากระเบียนการติดตั้ง นโยบาย config และ
เมทาดาทา manifest/package โดยไม่โหลดโมดูล runtime ของ Plugin
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่งผ่าน
spec แพ็กเกจ npm พร้อม dist-tag หรือเวอร์ชันที่แน่นอนจะ resolve ชื่อแพ็กเกจ
กลับไปยังระเบียน Plugin ที่ติดตามอยู่ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต
การส่งผ่านชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งที่ pin แบบแน่นอนกลับไปยัง
สาย release เริ่มต้นของรีจิสทรี หาก Plugin npm ที่ติดตั้งไว้ตรงกับ
เวอร์ชันที่ resolve แล้วและตัวตน artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่อง beta ระเบียน Plugin npm และ ClawHub
บนสายค่าเริ่มต้นจะลอง `@beta` ก่อน แล้ว fallback กลับไปยัง default/latest เมื่อไม่มี
release beta ของ Plugin เวอร์ชันที่แน่นอนและแท็กที่ระบุอย่างชัดเจนจะยังคงถูก pin ไว้

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับการใช้ร่วมกับ `--marketplace` เพราะ
การติดตั้งจาก marketplace จะคงเมทาดาทาแหล่งที่มาของ marketplace แทน spec ของ npm

`--dangerously-force-unsafe-install` เป็น override ฉุกเฉินสำหรับ false positive
จากสแกนเนอร์ dangerous-code ในตัว มันอนุญาตให้การติดตั้ง Plugin
และการอัปเดต Plugin ดำเนินต่อหลังพบรายการ `critical` ในตัวได้ แต่ยังคง
ไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อสแกนล้มเหลว
การสแกนระหว่างติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`,
`__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก test mock ที่แพ็กมาด้วย
entrypoint runtime ของ Plugin ที่ประกาศไว้จะยังถูกสแกนแม้จะใช้ชื่อเหล่านั้นก็ตาม

แฟล็ก CLI นี้ใช้กับโฟลว์ install/update ของ Plugin เท่านั้น การติดตั้ง dependency ของ Skills
ที่มี Gateway รองรับจะใช้ request override `dangerouslyForceUnsafeInstall`
ที่ตรงกันแทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills
จาก ClawHub แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิด
แดชบอร์ด ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบ
อีกครั้ง `--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเอง
เท่านั้น ไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้ release ที่ถูกบล็อกเป็นสาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วมในโฟลว์ list/inspect/enable/disable ของ Plugin เดียวกัน
การรองรับ runtime ปัจจุบันรวมถึง bundle skills, command-skills ของ Claude,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook
ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึง
รายการเซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มีบันเดิลรองรับ

แหล่งที่มา marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ภายในเครื่องหรือ
เส้นทาง `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL repo ของ GitHub
หรือ URL git สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน
repo marketplace ที่ clone มา และใช้เฉพาะแหล่งที่มาแบบเส้นทางสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [อ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Plugin แบบ native จะ export entry object ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias legacy แต่ Plugin ใหม่ควรใช้
`register`

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

OpenClaw โหลด entry object และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin
loader ยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่รวมมาในตัว
และ Plugin ภายนอกใหม่ควรถือว่า `register` เป็นสัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่าทำไม entry ของมันจึงถูกโหลด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งาน runtime ลงทะเบียน tools, hooks, services, commands, routes และ side effects แบบ live อื่นๆ                              |
| `discovery`     | การค้นพบความสามารถแบบอ่านอย่างเดียว ลงทะเบียน providers และเมทาดาทา โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ให้ข้าม side effects แบบ live |
| `setup-only`    | การโหลดเมทาดาทาการตั้งค่า Channel ผ่าน setup entry แบบเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่า Channel ที่ต้องใช้ runtime entry ด้วย                                                                         |
| `cli-metadata`  | การรวบรวมเมทาดาทา command ของ CLI เท่านั้น                                                                                            |

entry ของ Plugin ที่เปิด sockets, databases, background workers หรือ clients
ที่มีอายุยาวควรป้องกัน side effects เหล่านั้นด้วย `api.registrationMode === "full"`
โหลด discovery จะถูก cache แยกจากโหลด activation และไม่แทนที่
รีจิสทรี Gateway ที่กำลังทำงานอยู่ Discovery เป็นแบบไม่เปิดใช้งาน ไม่ใช่แบบ import-free:
OpenClaw อาจประเมิน entry ของ Plugin ที่เชื่อถือได้หรือโมดูล Plugin ของ Channel เพื่อสร้าง
snapshot ให้รักษาระดับบนสุดของโมดูลให้เบาและปราศจาก side effect และย้าย
network clients, subprocesses, listeners, credential reads และ service startup
ไปไว้หลังเส้นทาง full-runtime

เมธอดลงทะเบียนทั่วไป:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)        |
| `registerChannel`                       | Channel แชต                |
| `registerTool`                          | tool ของ Agent                  |
| `registerHook` / `on(...)`              | lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีม               |
| `registerRealtimeVoiceProvider`         | เสียง realtime แบบ duplex       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์รูปภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างรูปภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | context engine              |
| `registerService`                       | background service          |

พฤติกรรม guard ของ hook สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

app-server ของ Codex แบบ native จะ bridge เหตุการณ์ tool แบบ Codex-native กลับเข้าสู่
พื้นผิว hook นี้ Plugin สามารถบล็อก tool ของ Codex แบบ native ผ่าน `before_tool_call`,
สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมการอนุมัติ
`PermissionRequest` ของ Codex bridge ยังไม่ rewrite อาร์กิวเมนต์ tool แบบ Codex-native
ขอบเขตการรองรับ runtime ของ Codex ที่แน่นอนอยู่ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

ดูพฤติกรรม typed hook ทั้งหมดได้ที่ [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [ชุดรวม Plugin](/th/plugins/bundles) — ความเข้ากันได้ของชุดรวม Codex/Claude/Cursor
- [แมนิเฟสต์ของ Plugin](/th/plugins/manifest) — สคีมาของแมนิเฟสต์
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือของเอเจนต์ใน Plugin
- [กลไกภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและไปป์ไลน์การโหลด
- [Plugin จากชุมชน](/th/plugins/community) — รายการของบุคคลที่สาม
