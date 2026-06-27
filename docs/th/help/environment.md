---
read_when:
    - คุณจำเป็นต้องรู้ว่า env vars ใดถูกโหลด และโหลดตามลำดับใด
    - คุณกำลังดีบักคีย์ API ที่หายไปใน Gateway
    - คุณกำลังจัดทำเอกสารเกี่ยวกับการยืนยันตัวตนของผู้ให้บริการหรือสภาพแวดล้อมการปรับใช้
summary: ตำแหน่งที่ OpenClaw โหลดตัวแปรสภาพแวดล้อมและลำดับความสำคัญ
title: ตัวแปรสภาพแวดล้อม
x-i18n:
    generated_at: "2026-06-27T17:41:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw ดึงตัวแปรสภาพแวดล้อมจากหลายแหล่ง กฎคือ **ห้ามเขียนทับค่าที่มีอยู่แล้วเด็ดขาด**
ไฟล์ `.env` ของเวิร์กสเปซเป็นแหล่งที่มีความน่าเชื่อถือต่ำกว่า: OpenClaw จะละเว้นข้อมูลรับรองของผู้ให้บริการและตัวควบคุมรันไทม์ที่ได้รับการป้องกันจาก `.env` ของเวิร์กสเปซก่อนนำลำดับความสำคัญมาใช้

## ลำดับความสำคัญ (สูงสุด → ต่ำสุด)

1. **สภาพแวดล้อมของกระบวนการ** (สิ่งที่กระบวนการ Gateway มีอยู่แล้วจากเชลล์/daemon แม่)
2. **`.env` ในไดเรกทอรีทำงานปัจจุบัน** (ค่าเริ่มต้นของ dotenv; ไม่เขียนทับ; ข้อมูลรับรองของผู้ให้บริการและตัวควบคุมรันไทม์ที่ได้รับการป้องกันจะถูกละเว้น)
3. **`.env` ส่วนกลาง** ที่ `~/.openclaw/.env` (หรือที่เรียกว่า `$OPENCLAW_STATE_DIR/.env`; แนะนำสำหรับคีย์ API ของผู้ให้บริการ; ไม่เขียนทับ)
4. **บล็อก `env` ของการกำหนดค่า** ใน `~/.openclaw/openclaw.json` (นำไปใช้เฉพาะเมื่อขาดหาย)
5. **การนำเข้า login-shell แบบไม่บังคับ** (`env.shellEnv.enabled` หรือ `OPENCLAW_LOAD_SHELL_ENV=1`) นำไปใช้เฉพาะกับคีย์ที่คาดไว้ซึ่งขาดหาย

ในการติดตั้งใหม่บน Ubuntu ที่ใช้ไดเรกทอรีสถานะค่าเริ่มต้น OpenClaw ยังถือว่า `~/.config/openclaw/gateway.env` เป็น fallback เพื่อความเข้ากันได้หลังจาก `.env` ส่วนกลาง หากทั้งสองไฟล์มีอยู่และค่าไม่ตรงกัน OpenClaw จะใช้ `~/.openclaw/.env` ต่อไปและพิมพ์คำเตือน

หากไฟล์การกำหนดค่าหายไปทั้งหมด ขั้นตอนที่ 4 จะถูกข้าม; การนำเข้าเชลล์จะยังคงทำงานหากเปิดใช้งานไว้

## ข้อมูลรับรองของผู้ให้บริการและ `.env` ของเวิร์กสเปซ

อย่าเก็บคีย์ API ของผู้ให้บริการไว้เฉพาะใน `.env` ของเวิร์กสเปซ OpenClaw จะละเว้นตัวแปรสภาพแวดล้อมข้อมูลรับรองของผู้ให้บริการจากไฟล์ `.env` ของเวิร์กสเปซ รวมถึงคีย์ทั่วไป เช่น `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, และ `FIRECRAWL_API_KEY`

ใช้แหล่งที่เชื่อถือได้เหล่านี้สำหรับข้อมูลรับรองของผู้ให้บริการ:

- สภาพแวดล้อมของกระบวนการ Gateway เช่น เชลล์, หน่วย launchd/systemd, secret ของคอนเทนเนอร์ หรือ secret ของ CI
- ไฟล์ dotenv รันไทม์ส่วนกลางที่ `~/.openclaw/.env` หรือ `$OPENCLAW_STATE_DIR/.env`
- บล็อก `env` ของการกำหนดค่าใน `~/.openclaw/openclaw.json`
- การนำเข้า login-shell แบบไม่บังคับเมื่อเปิดใช้งาน `env.shellEnv.enabled` หรือ `OPENCLAW_LOAD_SHELL_ENV=1`

หากก่อนหน้านี้คุณเก็บคีย์ผู้ให้บริการไว้เฉพาะใน `.env` ของเวิร์กสเปซ ให้ย้ายไปยังหนึ่งในแหล่งที่เชื่อถือได้ข้างต้น `.env` ของเวิร์กสเปซยังสามารถให้ตัวแปรโปรเจกต์ทั่วไปที่ไม่ใช่ข้อมูลรับรอง, การเปลี่ยนเส้นทาง endpoint, การ override โฮสต์ หรือการควบคุมรันไทม์ `OPENCLAW_*`

ดู [ไฟล์ `.env` ของเวิร์กสเปซ](/th/gateway/security#workspace-env-files) สำหรับเหตุผลด้านความปลอดภัย

## บล็อก `env` ของการกำหนดค่า

สองวิธีที่เทียบเท่ากันในการตั้งค่า env vars แบบอินไลน์ (ทั้งสองแบบไม่เขียนทับ):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

บล็อก `env` ของการกำหนดค่ารับเฉพาะค่าสตริงตามตัวอักษรเท่านั้น ไม่ขยายค่า
`file:...`; ตัวอย่างเช่น `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
จะถูกส่งให้ผู้ให้บริการเป็นสตริงนั้นตรงตัว

สำหรับคีย์ผู้ให้บริการที่อิงไฟล์ ให้ใช้ SecretRef บนฟิลด์ข้อมูลรับรองที่
รองรับ:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

ดู [การจัดการ Secrets](/th/gateway/secrets) และ
[พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface) สำหรับ
ฟิลด์ที่รองรับ

## การนำเข้า env ของเชลล์

`env.shellEnv` เรียกใช้ login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดไว้ซึ่ง **ขาดหาย**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

ค่าตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## สแนปช็อตของ exec shell

บนโฮสต์ Gateway ที่ไม่ใช่ Windows คำสั่ง `exec` ของ bash และ zsh จะใช้สแนปช็อตเริ่มต้นโดยปริยาย
ตั้งค่า `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` ในสภาพแวดล้อมของกระบวนการ Gateway เพื่อปิดใช้งานเส้นทางนี้
ค่า `false`, `no`, และ `off` ก็ปิดใช้งานได้เช่นกัน ค่า `exec.env` ต่อการเรียกไม่สามารถสลับ
สแนปช็อตหรือเปลี่ยนเส้นทางแคชสแนปช็อตได้

## Env vars ที่รันไทม์ฉีดเข้าไป

OpenClaw ยังฉีดเครื่องหมายบริบทเข้าไปในกระบวนการลูกที่ spawn:

- `OPENCLAW_SHELL=exec`: ตั้งค่าสำหรับคำสั่งที่รันผ่านเครื่องมือ `exec`
- `OPENCLAW_SHELL=acp`: ตั้งค่าสำหรับการ spawn กระบวนการแบ็กเอนด์รันไทม์ ACP (เช่น `acpx`)
- `OPENCLAW_SHELL=acp-client`: ตั้งค่าสำหรับ `openclaw acp client` เมื่อ spawn กระบวนการบริดจ์ ACP
- `OPENCLAW_SHELL=tui-local`: ตั้งค่าสำหรับคำสั่งเชลล์ `!` ของ TUI ภายในเครื่อง
- `OPENCLAW_CLI=1`: ตั้งค่าสำหรับกระบวนการลูกที่ spawn โดย entry point ของ CLI

สิ่งเหล่านี้เป็นเครื่องหมายรันไทม์ (ไม่ใช่การกำหนดค่าผู้ใช้ที่จำเป็น) สามารถใช้ในตรรกะ shell/profile
เพื่อใช้กฎเฉพาะบริบทได้

## Env vars ของ UI

- `OPENCLAW_THEME=light`: บังคับใช้พาเลต TUI แบบสว่างเมื่อเทอร์มินัลของคุณมีพื้นหลังสว่าง
- `OPENCLAW_THEME=dark`: บังคับใช้พาเลต TUI แบบมืด
- `COLORFGBG`: หากเทอร์มินัลของคุณส่งออกตัวแปรนี้ OpenClaw จะใช้คำใบ้สีพื้นหลังเพื่อเลือกพาเลต TUI อัตโนมัติ

## การแทนที่ env var ในการกำหนดค่า

คุณสามารถอ้างอิง env vars โดยตรงในค่าสตริงการกำหนดค่าโดยใช้ไวยากรณ์ `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

ดู [การกำหนดค่า: การแทนที่ env var](/th/gateway/configuration-reference#env-var-substitution) สำหรับรายละเอียดทั้งหมด

## การอ้างอิง Secret เทียบกับสตริง `${ENV}`

OpenClaw รองรับรูปแบบที่ขับเคลื่อนด้วย env สองแบบ:

- การแทนที่สตริง `${VAR}` ในค่าการกำหนดค่า
- ออบเจ็กต์ SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) สำหรับฟิลด์ที่รองรับการอ้างอิง secrets

ทั้งสองแบบ resolve จาก env ของกระบวนการ ณ เวลาการเปิดใช้งาน รายละเอียด SecretRef มีบันทึกไว้ใน [การจัดการ Secrets](/th/gateway/secrets)
บล็อก `env` ของการกำหนดค่าเองไม่ resolve SecretRefs หรือค่าชอร์ตแฮนด์
`file:...`

## Env vars ที่เกี่ยวข้องกับพาธ

| ตัวแปร                   | วัตถุประสงค์                                                                                                                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Override ไดเรกทอรี home ที่ใช้สำหรับค่าเริ่มต้นพาธภายในของ OpenClaw (`~/.openclaw/`, ไดเรกทอรี agent, sessions, credentials, installer onboarding และ checkout dev ค่าเริ่มต้น) มีประโยชน์เมื่อรัน OpenClaw เป็นผู้ใช้บริการเฉพาะ |
| `OPENCLAW_STATE_DIR`     | Override ไดเรกทอรีสถานะ (ค่าเริ่มต้น `~/.openclaw`)                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Override พาธไฟล์การกำหนดค่า (ค่าเริ่มต้น `~/.openclaw/openclaw.json`)                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | รายการพาธของไดเรกทอรีที่คำสั่ง `$include` สามารถ resolve ไฟล์นอกไดเรกทอรีการกำหนดค่าได้ (ค่าเริ่มต้น: ไม่มี — `$include` ถูกจำกัดไว้ในไดเรกทอรีการกำหนดค่า) ขยาย tilde แล้ว                                                         |

## การบันทึก log

| ตัวแปร                         | วัตถุประสงค์                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Override ระดับ log สำหรับทั้งไฟล์และคอนโซล (เช่น `debug`, `trace`) มีลำดับความสำคัญเหนือ `logging.level` และ `logging.consoleLevel` ในการกำหนดค่า ค่าที่ไม่ถูกต้องจะถูกละเว้นพร้อมคำเตือน |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | ส่งออกการวินิจฉัยเวลา request/response ของโมเดลแบบเจาะจงที่ระดับ `info` โดยไม่ต้องเปิดใช้งาน debug logs ส่วนกลาง                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | การวินิจฉัย payload ของโมเดล: `summary`, `tools`, หรือ `full-redacted` `full-redacted` ถูกจำกัดขนาดและ redact แล้ว แต่อาจมีข้อความ prompt/message                                               |
| `OPENCLAW_DEBUG_SSE`             | การวินิจฉัย streaming: `events` สำหรับเวลาครั้งแรก/เสร็จสิ้น, `peek` เพื่อรวมเหตุการณ์ SSE ที่ redact แล้วห้ารายการแรก                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | การวินิจฉัยพื้นผิวโมเดลโหมดโค้ด รวมถึงการซ่อนเครื่องมือของผู้ให้บริการและการบังคับใช้เฉพาะ exec/wait                                                                                          |

### `OPENCLAW_HOME`

เมื่อตั้งค่าแล้ว `OPENCLAW_HOME` จะแทนที่ไดเรกทอรี home ของระบบ (`$HOME` / `os.homedir()`) สำหรับค่าเริ่มต้นพาธภายในของ OpenClaw ซึ่งรวมถึงไดเรกทอรีสถานะค่าเริ่มต้น, พาธการกำหนดค่า, ไดเรกทอรี agent, credentials, เวิร์กสเปซ installer onboarding และ checkout dev ค่าเริ่มต้นที่ใช้โดย `openclaw update --channel dev`

**ลำดับความสำคัญ:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback home ของ Termux `PREFIX` บน Android > `os.homedir()`

**ตัวอย่าง** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` ยังสามารถตั้งเป็นพาธ tilde ได้ (เช่น `~/svc`) ซึ่งจะถูกขยายโดยใช้ลำดับ fallback ของ home ของ OS เดียวกันก่อนใช้งาน

ตัวแปรพาธที่ระบุชัดเจน เช่น `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, และ `OPENCLAW_GIT_DIR` ยังคงมีลำดับความสำคัญสูงกว่า งานระดับบัญชี OS เช่น การตรวจหาไฟล์เริ่มต้นของเชลล์, การตั้งค่าตัวจัดการแพ็กเกจ และการขยาย `~` ของโฮสต์ อาจยังใช้ home ระบบจริง

## ผู้ใช้ nvm: ความล้มเหลว TLS ของ web_fetch

หากติดตั้ง Node.js ผ่าน **nvm** (ไม่ใช่ตัวจัดการแพ็กเกจของระบบ) `fetch()` ในตัวจะใช้
CA store ที่มากับ nvm ซึ่งอาจไม่มี root CAs สมัยใหม่ (ISRG Root X1/X2 สำหรับ Let's Encrypt,
DigiCert Global Root G2 เป็นต้น) สิ่งนี้ทำให้ `web_fetch` ล้มเหลวด้วย `"fetch failed"` บนไซต์ HTTPS ส่วนใหญ่

บน Linux OpenClaw จะตรวจหา nvm โดยอัตโนมัติและนำการแก้ไขไปใช้ในสภาพแวดล้อมเริ่มต้นจริง:

- `openclaw gateway install` เขียน `NODE_EXTRA_CA_CERTS` ลงในสภาพแวดล้อมบริการ systemd
- entrypoint ของ CLI `openclaw` จะ re-exec ตัวเองโดยตั้งค่า `NODE_EXTRA_CA_CERTS` ก่อนการเริ่มต้น Node

**การแก้ไขด้วยตนเอง (สำหรับเวอร์ชันเก่าหรือการเรียก `node ...` โดยตรง):**

ส่งออกตัวแปรก่อนเริ่ม OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

อย่าพึ่งพาการเขียนตัวแปรนี้เฉพาะลงใน `~/.openclaw/.env`; Node อ่าน
`NODE_EXTRA_CA_CERTS` เมื่อกระบวนการเริ่มต้น

## ตัวแปรสภาพแวดล้อมรุ่นเก่า

OpenClaw อ่านเฉพาะตัวแปรสภาพแวดล้อม `OPENCLAW_*` เท่านั้น prefix รุ่นเก่า
`CLAWDBOT_*` และ `MOLTBOT_*` จากรีลีสก่อนหน้าจะถูกละเว้นอย่างเงียบ ๆ

หากยังมีตัวแปรใดตั้งอยู่ในกระบวนการ Gateway ตอนเริ่มต้น OpenClaw จะส่งออก
คำเตือนการเลิกใช้ Node หนึ่งรายการ (`OPENCLAW_LEGACY_ENV_VARS`) ที่แสดงรายการ
prefix ที่ตรวจพบและจำนวนรวม เปลี่ยนชื่อแต่ละค่าโดยแทนที่
prefix รุ่นเก่าด้วย `OPENCLAW_` (ตัวอย่าง `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); ชื่อเก่าไม่มีผลใด ๆ

## ที่เกี่ยวข้อง

- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [FAQ: env vars และการโหลด .env](/th/help/faq#env-vars-and-env-loading)
- [ภาพรวมโมเดล](/th/concepts/models)
