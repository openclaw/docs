---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบการถดถอยสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ gateway + agent
summary: 'ชุดทดสอบ: ชุด unit/e2e/live, ตัวรัน Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-23T10:18:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# การทดสอบ

OpenClaw มีชุด Vitest อยู่ 3 ชุด (unit/integration, e2e, live) และมีตัวรัน Docker ขนาดเล็กอีกชุดหนึ่ง

เอกสารนี้เป็นคู่มือ “วิธีที่เราทดสอบ”:

- แต่ละชุดครอบคลุมอะไรบ้าง (และมีอะไรที่ตั้งใจ _ไม่_ ครอบคลุม)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- การทดสอบ live ค้นหา credentials และเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาจริงของโมเดล/ผู้ให้บริการ

## เริ่มต้นอย่างรวดเร็ว

ในวันทั่วไป:

- เกตเต็มรูปแบบ (คาดหวังให้รันก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันเต็มชุดที่เร็วขึ้นในเครื่องบนเครื่องที่ทรัพยากรพอ: `pnpm test:max`
- วงรอบ watch ของ Vitest โดยตรง: `pnpm test:watch`
- การเจาะจงไฟล์โดยตรงตอนนี้รองรับพาธของ extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มจากการรันแบบเจาะจงก่อนเมื่อคุณกำลังแก้ปัญหาความล้มเหลวจุดเดียว
- ไซต์ QA ที่ใช้ Docker: `pnpm qa:lab:up`
- lane QA ที่ใช้ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแก้ไขการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- เกต coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ credentials จริง):

- ชุด live (โมเดล + การ probe tool/image ของ gateway): `pnpm test:live`
- เจาะจงไฟล์ live ไฟล์เดียวแบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - ความครอบคลุมใน CI: งานประจำวัน `OpenClaw Scheduled Live And E2E Checks` และงานแบบเรียกเอง
    `OpenClaw Release Checks` จะเรียก reusable workflow สำหรับ live/E2E พร้อม
    `include_live_suites: true` ซึ่งรวมถึงงาน Docker live model matrix แยกตามผู้ให้บริการ
  - สำหรับการ rerun ใน CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secrets ใหม่ที่มีสัญญาณสูงลงใน `scripts/ci-hydrate-live-auth.sh`
    พร้อมทั้ง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ callers
    สำหรับ scheduled/release ของมัน
- Moonshot/Kimi cost smoke: เมื่อกำหนด `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  assistant transcript เก็บ `usage.cost` ที่ normalize แล้ว

เคล็ดลับ: เมื่อคุณต้องการเพียงเคสที่ล้มเหลวเคสเดียว ให้จำกัดขอบเขตการทดสอบ live ผ่านตัวแปร env allowlist ที่อธิบายไว้ด้านล่าง

## ตัวรันเฉพาะสำหรับ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลัก เมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflows เฉพาะ `Parity gate` จะรันกับ PR ที่ตรงเงื่อนไขและ
จาก manual dispatch พร้อม mock providers `QA-Lab - All Lanes` จะรันทุกคืนบน
`main` และจาก manual dispatch พร้อม mock parity gate, lane live Matrix และ
lane live Telegram ที่จัดการโดย Convex เป็นงานขนานกัน `OpenClaw Release Checks`
จะรัน lanes เดียวกันก่อนอนุมัติการปล่อยรุ่น

- `pnpm openclaw qa suite`
  - รันสถานการณ์ QA ที่อิงกับ repo โดยตรงบนโฮสต์
  - รันหลายสถานการณ์ที่เลือกแบบขนานตามค่าเริ่มต้นด้วย gateway workers ที่แยกจากกัน
    `qa-channel` ใช้ concurrency ค่าเริ่มต้นเป็น 4 (ถูกจำกัดด้วยจำนวนสถานการณ์ที่เลือก)
    ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker หรือใช้ `--concurrency 1`
    สำหรับ lane แบบอนุกรมรุ่นเก่า
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่ให้ exit code เป็นความล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` จะเริ่มเซิร์ฟเวอร์ผู้ให้บริการที่ใช้ AIMock ภายในเครื่อง สำหรับความครอบคลุมแบบทดลองของ fixture และ protocol-mock โดยไม่แทนที่
    lane `mock-openai` ที่รับรู้สถานการณ์
- `pnpm openclaw qa suite --runner multipass`
  - รันชุด QA เดียวกันภายใน Multipass Linux VM แบบใช้ชั่วคราว
  - ใช้พฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
  - ใช้ flags การเลือกผู้ให้บริการ/โมเดลแบบเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่อข้อมูล auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    คีย์ผู้ให้บริการแบบ env, พาธ config ของผู้ให้บริการ live ใน QA และ `CODEX_HOME`
    เมื่อมี
  - ไดเรกทอรีเอาต์พุตต้องอยู่ภายใต้ repo root เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount อยู่ได้
  - เขียน QA report + summary ปกติ พร้อม Multipass logs ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่ใช้ Docker สำหรับงาน QA แบบผู้ปฏิบัติการ
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker รัน onboarding แบบไม่โต้ตอบสำหรับ OpenAI API key ตั้งค่า Telegram
    ตามค่าเริ่มต้น ตรวจสอบว่าการเปิดใช้งาน Plugin จะติดตั้ง runtime dependencies ตามต้องการ
    รัน doctor และรัน agent turn ในเครื่องหนึ่งครั้งกับ mocked OpenAI
    endpoint
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน lane แบบ packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:bundled-channel-deps`
  - pack และติดตั้ง OpenClaw build ปัจจุบันใน Docker เริ่ม Gateway
    โดยกำหนดค่า OpenAI แล้ว จากนั้นเปิดใช้งาน bundled channel/plugins ผ่านการแก้ config
  - ตรวจสอบว่าการค้นพบในการตั้งค่าปล่อยให้ plugin runtime dependencies ที่ยังไม่ถูกกำหนดค่า
    ยังไม่ถูกติดตั้ง การรัน Gateway หรือ doctor ครั้งแรกที่มีการกำหนดค่าจะติดตั้ง
    runtime dependencies ของ bundled plugin แต่ละตัวตามต้องการ และการรีสตาร์ตครั้งที่สองจะไม่ติดตั้ง
    dependencies ที่ถูกเปิดใช้งานแล้วซ้ำอีก
  - นอกจากนี้ยังติดตั้ง npm baseline รุ่นเก่าที่ทราบแน่ชัด เปิด Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า
    post-update doctor ของ candidate ซ่อมแซม bundled channel runtime dependencies ได้โดยไม่ต้องมี
    postinstall repair ฝั่ง harness
- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ในเครื่องสำหรับการทดสอบ protocol smoke โดยตรง
- `pnpm openclaw qa matrix`
  - รัน lane live QA ของ Matrix กับ Tuwunel homeserver แบบใช้ชั่วคราวที่อยู่บน Docker
  - โฮสต์ QA นี้เป็น repo/dev-only ในตอนนี้ การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่มาพร้อม
    `qa-lab` ดังนั้นจะไม่เปิดเผย `openclaw qa`
  - การ checkout จาก repo จะโหลด bundled runner โดยตรง ไม่ต้องมีขั้นตอนติดตั้ง Plugin แยก
  - จัดเตรียมผู้ใช้ Matrix ชั่วคราว 3 ราย (`driver`, `sut`, `observer`) พร้อมห้องส่วนตัวหนึ่งห้อง จากนั้นเริ่ม QA gateway child โดยใช้ Matrix Plugin จริงเป็น SUT transport
  - ใช้อิมเมจ Tuwunel รุ่นเสถียรที่ pin ไว้ `ghcr.io/matrix-construct/tuwunel:v1.5.1` ตามค่าเริ่มต้น เขียนทับด้วย `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` เมื่อต้องการทดสอบอิมเมจอื่น
  - Matrix ไม่เปิดเผย flags แหล่ง credentials ร่วม เพราะ lane นี้จัดเตรียมผู้ใช้ชั่วคราวในเครื่องเอง
  - เขียน Matrix QA report, summary, artifact ของ observed-events และ output log รวม stdout/stderr ไว้ใต้ `.artifacts/qa-e2e/...`
- `pnpm openclaw qa telegram`
  - รัน lane live QA ของ Telegram กับกลุ่มส่วนตัวจริงโดยใช้ driver และ SUT bot tokens จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น Telegram chat id แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับ credentials แบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env ตามค่าเริ่มต้น หรือกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ pooled leases
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่ให้ exit code เป็นความล้มเหลว
  - ต้องใช้บอท 2 ตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอท SUT ต้องมี Telegram username
  - เพื่อให้การสังเกตแบบ bot-to-bot เสถียร ให้เปิด Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับทั้งสองบอท และตรวจสอบให้แน่ใจว่าบอท driver สามารถสังเกตทราฟฟิกของบอทในกลุ่มได้
  - เขียน Telegram QA report, summary และ artifact ของ observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์แบบตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการตอบกลับของ SUT ที่ถูกสังเกตเห็น

lanes ของ live transport ใช้สัญญาเดียวกันเป็นมาตรฐาน เพื่อให้ transports ใหม่ไม่ค่อยๆ เบี่ยงออกจากกัน:

`qa-channel` ยังคงเป็นชุด QA แบบสังเคราะห์ที่ครอบคลุมกว้าง และไม่ถือเป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุมของ live transport

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Telegram credentials แบบใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้งาน `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram`, QA lab จะรับ exclusive lease จาก pool ที่ใช้ Convex เป็นแบ็กเอนด์ ส่ง Heartbeat
ให้ lease นั้นตลอดเวลาที่ lane กำลังทำงาน และปล่อย lease เมื่อปิดตัวลง

โครงร่างโปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก credential role:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจาก env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, ไม่เช่นนั้นเป็น `maintainer`)

ตัวแปร env แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนาในเครื่องเท่านั้น

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่งผู้ดูแลสำหรับการจัดการ pool (เพิ่ม/ลบ/แสดงรายการ) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแล:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `--json` เพื่อให้ได้เอาต์พุตที่อ่านได้โดยเครื่องในสคริปต์และเครื่องมือ CI

สัญญา endpoint เริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - ทรัพยากรหมด/สามารถลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ที่ว่างเปล่า)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ที่ว่างเปล่า)
- `POST /admin/add` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ยังใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่าง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง Telegram chat id แบบตัวเลข
- `admin/add` จะตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

### การเพิ่มช่องทางเข้า QA

การเพิ่มช่องทางเข้าไปในระบบ QA แบบ Markdown ต้องมีอยู่ **2 อย่างเท่านั้น**:

1. transport adapter สำหรับช่องทางนั้น
2. scenario pack ที่ทดสอบสัญญาของช่องทางนั้น

อย่าเพิ่ม top-level QA command root ใหม่ เมื่อโฮสต์ `qa-lab` ที่ใช้ร่วมกันสามารถ
เป็นเจ้าของ flow นี้ได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- command root `openclaw qa`
- การเริ่มต้นและการยุติ suite
- worker concurrency
- การเขียน artifacts
- การสร้างรายงาน
- การรันสถานการณ์
- compatibility aliases สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Runner plugins เป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ใต้ `qa` root ที่ใช้ร่วมกัน
- วิธีตั้งค่า gateway สำหรับ transport นั้น
- วิธีตรวจสอบความพร้อมใช้งาน
- วิธี inject เหตุการณ์ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผย transcripts และ normalized transport state
- วิธีรัน actions ที่อิงกับ transport
- วิธีจัดการ reset หรือ cleanup แบบเฉพาะ transport

เกณฑ์ขั้นต่ำสำหรับการรองรับช่องทางใหม่คือ:

1. ให้ `qa-lab` เป็นเจ้าของ `qa` root ที่ใช้ร่วมกันต่อไป
2. ติดตั้ง transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน runner plugin หรือ channel harness
4. mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งขันกัน
   Runner plugins ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts`
   ให้ `runtime-api.ts` มีขนาดเบา; การรัน CLI และ runner แบบ lazy ควรอยู่หลัง entrypoints ที่แยกจากกัน
5. เขียนหรือดัดแปลงสถานการณ์ Markdown ภายใต้ไดเรกทอรีตามธีมใน `qa/scenarios/`
6. ใช้ scenario helpers แบบทั่วไปสำหรับสถานการณ์ใหม่
7. ให้ compatibility aliases เดิมยังใช้งานได้ เว้นแต่ repo กำลังทำ migration อย่างตั้งใจ

กฎการตัดสินใจนี้เข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นอยู่กับ channel transport ตัวเดียว ให้เก็บไว้ใน runner plugin หรือ plugin harness นั้น
- หากสถานการณ์ต้องใช้ความสามารถใหม่ที่มากกว่าหนึ่งช่องทางใช้ได้ ให้เพิ่ม generic helper แทนการใส่ branch เฉพาะช่องทางใน `suite.ts`
- หากพฤติกรรมนั้นมีความหมายเฉพาะสำหรับ transport ตัวเดียว ให้เก็บสถานการณ์นั้นเป็นแบบ transport-specific และทำให้ชัดเจนในสัญญาของสถานการณ์

ชื่อ generic helper ที่ควรใช้สำหรับสถานการณ์ใหม่คือ:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

compatibility aliases ยังคงมีให้ใช้สำหรับสถานการณ์เดิม รวมถึง:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

งานสำหรับช่องทางใหม่ควรใช้ชื่อ generic helper
compatibility aliases มีไว้เพื่อหลีกเลี่ยงการย้ายแบบ flag day ไม่ใช่เป็นต้นแบบสำหรับ
การเขียนสถานการณ์ใหม่

## ชุดทดสอบ (อะไรถูกรันที่ไหน)

ให้คิดถึงชุดต่างๆ ว่าเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น)

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันที่ไม่เจาะจงใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย multi-project shards เป็น per-project configs เพื่อจัดตารางแบบขนาน
- ไฟล์: รายการ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` และการทดสอบ `ui` ฝั่ง node ที่อยู่ใน allowlist ซึ่งครอบคลุมโดย `vitest.unit.config.ts`
- ขอบเขต:
  - การทดสอบ unit แบบบริสุทธิ์
  - การทดสอบ integration ภายใน process (gateway auth, routing, tooling, parsing, config)
  - regressions แบบกำหนดแน่นอนสำหรับบั๊กที่ทราบแล้ว
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
- หมายเหตุเรื่อง Projects:
  - `pnpm test` แบบไม่เจาะจงตอนนี้รัน shard configs ที่เล็กลง 12 ชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนหนึ่ง giant native root-project process วิธีนี้ลด peak RSS บนเครื่องที่มีภาระ และหลีกเลี่ยงไม่ให้งาน auto-reply/extension แย่งทรัพยากรจากชุดอื่นที่ไม่เกี่ยวข้อง
  - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์จาก root `vitest.config.ts` แบบเนทีฟ เพราะวงรอบ watch แบบหลาย shard ไม่ใช่สิ่งที่ใช้งานได้จริง
  - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะกำหนดเส้นทาง target แบบไฟล์/ไดเรกทอรีอย่างชัดเจนผ่าน scoped lanes ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องจ่ายค่าต้นทุนการเริ่ม root project เต็มรูปแบบ
  - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนเป็น scoped lanes แบบเดียวกันเมื่อ diff แตะเฉพาะไฟล์ source/test ที่กำหนดเส้นทางได้; การแก้ไข config/setup จะยัง fallback ไปยังการ rerun root-project แบบกว้าง
  - `pnpm check:changed` คือ smart local gate ปกติสำหรับงานแคบๆ มันจะแยกประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata และ tooling แล้วรัน lanes ของ typecheck/lint/test ที่ตรงกัน การเปลี่ยนแปลงของ Plugin SDK สาธารณะและ plugin-contract จะรวมการตรวจสอบ extensions ด้วย เพราะ extensions พึ่งพาสัญญา core เหล่านั้น การเพิ่มเวอร์ชันแบบ release metadata-only จะรัน targeted version/config/root-dependency checks แทนทั้งชุด พร้อมตัวป้องกันที่ปฏิเสธการเปลี่ยนแปลง package นอกเหนือจากฟิลด์เวอร์ชันระดับบนสุด
  - การทดสอบ unit ที่เบาในด้าน import จาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และส่วน utility ล้วนที่คล้ายกัน จะถูกกำหนดเส้นทางไปยัง lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ส่วนไฟล์ที่มี stateful/runtime-heavy จะยังอยู่ใน lanes เดิม
  - ไฟล์ source ตัวช่วยที่เลือกไว้ใน `plugin-sdk` และ `commands` ยังแมปการรันในโหมด changed ไปยังการทดสอบพี่น้องอย่างชัดเจนใน light lanes เหล่านั้น ดังนั้นการแก้ helper จะไม่ต้อง rerun ชุดหนักทั้งไดเรกทอรี
  - ตอนนี้ `auto-reply` มี 3 bucket เฉพาะ: top-level core helpers, top-level `reply.*` integration tests และ subtree `src/auto-reply/reply/**` วิธีนี้ช่วยให้งาน reply harness ที่หนักที่สุดไม่ไปอยู่บนการทดสอบ status/chunk/token ราคาถูก
- หมายเหตุเกี่ยวกับ Embedded runner:
  - เมื่อคุณเปลี่ยนอินพุตการค้นพบ message-tool หรือบริบท runtime ของ Compaction
    ให้คงความครอบคลุมทั้งสองระดับไว้
  - เพิ่ม helper regressions ที่เจาะจงสำหรับขอบเขต routing/normalization แบบบริสุทธิ์
  - และต้องรักษา integration suites ของ embedded runner ให้แข็งแรงด้วย:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
  - ชุดเหล่านี้ตรวจสอบว่า scoped ids และพฤติกรรมของ Compaction ยังไหลผ่าน
    เส้นทาง `run.ts` / `compact.ts` จริง helper-only tests ไม่ใช่ตัวแทน
    ที่เพียงพอสำหรับเส้นทาง integration เหล่านั้น
- หมายเหตุเรื่อง Pool:
  - Config พื้นฐานของ Vitest ตอนนี้ใช้ค่าเริ่มต้นเป็น `threads`
  - Config Vitest ที่ใช้ร่วมกันยังตรึง `isolate: false` และใช้ non-isolated runner กับ root projects, e2e และ live configs
  - lane UI หลักยังคงการตั้งค่า `jsdom` และ optimizer ของตัวเอง แต่ตอนนี้รันบน shared non-isolated runner ด้วย
  - shard ทุกชุดของ `pnpm test` รับค่าเริ่มต้น `threads` + `isolate: false` แบบเดียวกันจาก shared Vitest config
  - launcher `scripts/run-vitest.mjs` ที่ใช้ร่วมกันตอนนี้ยังเพิ่ม `--no-maglev` ให้กับ child Node processes ของ Vitest ตามค่าเริ่มต้น เพื่อลด V8 compile churn ระหว่างการรันในเครื่องขนาดใหญ่ ตั้ง `OPENCLAW_VITEST_ENABLE_MAGLEV=1` หากคุณต้องการเปรียบเทียบกับพฤติกรรม V8 มาตรฐาน
- หมายเหตุเรื่องการวนซ้ำในเครื่องอย่างรวดเร็ว:
  - `pnpm changed:lanes` แสดงว่า diff หนึ่งจะกระทบ architectural lanes ใดบ้าง
  - pre-commit hook จะรัน `pnpm check:changed --staged` หลัง staged formatting/linting ดังนั้น commit ที่แตะเฉพาะ core จะไม่ต้องจ่ายค่าการทดสอบ extension เว้นแต่จะไปแตะสัญญาสาธารณะที่เผชิญกับ extension โดยตรง release metadata-only commits จะยังอยู่ใน targeted version/config/root-dependency lane
  - หากชุดการเปลี่ยนแปลงที่ stage ไว้แบบตรงตัวได้รับการตรวจสอบด้วย gates ที่เท่ากันหรือเข้มกว่ามาแล้ว ให้ใช้ `scripts/committer --fast "<message>" <files...>` เพื่อข้ามเฉพาะการ rerun changed-scope hook เท่านั้น staged format/lint จะยังรันอยู่ กล่าวถึง gates ที่เสร็จแล้วไว้ใน handoff ด้วย วิธีนี้ยอมรับได้เช่นกันหลังจาก rerun isolated flaky hook failure แล้วผ่านพร้อมหลักฐานที่มีขอบเขตชัดเจน
  - `pnpm test:changed` จะกำหนดเส้นทางผ่าน scoped lanes เมื่อพาธที่เปลี่ยนสามารถแมปไปยังชุดที่เล็กกว่าได้อย่างชัดเจน
  - `pnpm test:max` และ `pnpm test:changed:max` ใช้พฤติกรรมการกำหนดเส้นทางแบบเดียวกัน เพียงแต่มี worker cap สูงกว่า
  - การปรับขนาด worker อัตโนมัติในเครื่องตอนนี้ตั้งใจให้อนุรักษ์นิยม และยังลดจำนวนลงเมื่อ host load average สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายชุดพร้อมกันจะส่งผลเสียลดลงตามค่าเริ่มต้น
  - Config พื้นฐานของ Vitest ทำเครื่องหมาย project/config files เป็น `forceRerunTriggers` เพื่อให้ changed-mode reruns ยังถูกต้องเมื่อการเชื่อมต่อของการทดสอบเปลี่ยนไป
  - Config ยังคงเปิด `OPENCLAW_VITEST_FS_MODULE_CACHE` บนโฮสต์ที่รองรับ; ตั้ง `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการตำแหน่ง cache แบบชัดเจนเพียงตำแหน่งเดียวสำหรับการทำ profiling โดยตรง
- หมายเหตุเรื่องการดีบักประสิทธิภาพ:
  - `pnpm test:perf:imports` จะเปิดรายงานระยะเวลา import ของ Vitest พร้อมเอาต์พุต import-breakdown
  - `pnpm test:perf:imports:changed` จะจำกัดมุมมองการทำ profiling เดียวกันนี้ไว้เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ `test:changed` ที่ถูกกำหนดเส้นทางกับเส้นทาง native root-project สำหรับ diff ที่ commit แล้วนั้น และพิมพ์ wall time พร้อม macOS max RSS
- `pnpm test:perf:changed:bench -- --worktree` จะ benchmark ต้นไม้ที่ยังสกปรกอยู่ในปัจจุบันโดยกำหนดเส้นทางรายการไฟล์ที่เปลี่ยนผ่าน `scripts/test-projects.mjs` และ root Vitest config
  - `pnpm test:perf:profile:main` จะเขียน main-thread CPU profile สำหรับ overhead ของ Vitest/Vite startup และ transform
  - `pnpm test:perf:profile:runner` จะเขียน runner CPU+heap profiles สำหรับ unit suite โดยปิด file parallelism

### Stability (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, บังคับให้ใช้หนึ่ง worker
- ขอบเขต:
  - เริ่ม loopback Gateway จริงพร้อมเปิด diagnostics ตามค่าเริ่มต้น
  - ขับ churn ของข้อความ gateway, memory และ large-payload แบบสังเคราะห์ผ่านเส้นทาง diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วย persistence ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังถูกจำกัดขอบเขต, ตัวอย่าง RSS แบบสังเคราะห์ยังต่ำกว่างบแรงกดดัน และความลึกของคิวต่อเซสชันลดกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เป็น lane แคบสำหรับติดตาม stability-regression ไม่ใช่ตัวแทนของ Gateway suite เต็มรูปแบบ

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และ bundled-plugin E2E tests ภายใต้ `extensions/`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` เหมือนกับส่วนอื่นของ repo
  - ใช้ workers แบบปรับตัวได้ (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมดเงียบตามค่าเริ่มต้นเพื่อลด console I/O overhead
- การเขียนทับที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุต console แบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP, node pairing และงานเครือข่ายที่หนักขึ้น
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้งานใน pipeline)
  - ไม่ต้องใช้คีย์จริง
  - มีชิ้นส่วนเคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบแยกบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ชั่วคราวในเครื่อง
  - ทดสอบแบ็กเอนด์ OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ใช้เมื่อเลือกเองเท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ตามค่าเริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องและ Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยก จากนั้นทำลาย test gateway และ sandbox
- การเขียนทับที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้งานการทดสอบเมื่อรัน broader e2e suite ด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง CLI binary หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และ bundled-plugin live tests ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _ในวันนี้_ ด้วย credentials จริงหรือไม่?”
  - จับการเปลี่ยนแปลงรูปแบบของผู้ให้บริการ, พฤติกรรมแปลกของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่เสถียรสำหรับ CI โดยตั้งใจ (เครือข่ายจริง, นโยบายผู้ให้บริการจริง, quotas, outages)
  - มีค่าใช้จ่าย / ใช้ rate limits
  - ควรรันเป็นชุดย่อยที่จำกัดขอบเขตแทน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อดึง API keys ที่ขาดหาย
- ตามค่าเริ่มต้น การรัน live ยังคงแยก `HOME` และคัดลอก config/auth material ไปยัง test home ชั่วคราว เพื่อให้ unit fixtures ไม่สามารถแก้ไข `~/.openclaw` จริงของคุณได้
- ตั้ง `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบขึ้นตามค่าเริ่มต้น: ยังคงแสดงความคืบหน้า `[live] ...` แต่ซ่อน notice เพิ่มเติมจาก `~/.profile` และปิดเสียง gateway bootstrap logs/Bonjour chatter ตั้ง `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ startup logs แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะผู้ให้บริการ): ตั้ง `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือใช้การเขียนทับต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อเจอการตอบกลับแบบ rate limit
- เอาต์พุตความคืบหน้า/Heartbeat:
  - ตอนนี้ live suites จะส่งบรรทัดความคืบหน้าไปที่ stderr เพื่อให้เห็นว่าการเรียกผู้ให้บริการที่ใช้เวลานานยังทำงานอยู่ แม้ Vitest console capture จะเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/gateway สตรีมออกทันทีระหว่างการรัน live
  - ปรับ heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดไหน?

ใช้ตารางตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนเยอะ)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอทของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## Live: การกวาดความสามารถของ Android node

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียก **ทุกคำสั่งที่โหนด Android ที่เชื่อมต่ออยู่ประกาศไว้ในปัจจุบัน** และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - มีการเตรียมเงื่อนไขล่วงหน้า/ตั้งค่าด้วยตนเอง (ชุดนี้จะไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ gateway ทีละคำสั่งสำหรับโหนด Android ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - คงแอปไว้ที่ foreground
  - ให้สิทธิ์/ยอมรับการจับภาพสำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การเขียนทับเป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [Android App](/th/platforms/android)

## Live: model smoke (profile keys)

การทดสอบ live ถูกแบ่งเป็น 2 ชั้น เพื่อให้เราแยกความล้มเหลวได้:

- “Direct model” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้หรือไม่ด้วยคีย์ที่กำหนด
- “Gateway smoke” บอกเราว่า pipeline เต็มของ gateway+agent ทำงานสำหรับโมเดลนั้นได้หรือไม่ (sessions, history, tools, sandbox policy ฯลฯ)

### ชั้นที่ 1: Direct model completion (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แสดงรายการโมเดลที่ค้นพบได้
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมี credentials
  - รัน completion ขนาดเล็กต่อโมเดลหนึ่งรายการ (และ regressions แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้ง `OPENCLAW_LIVE_MODELS=modern` (หรือ `all`, ซึ่งเป็น alias ของ modern) เพื่อให้รันชุดนี้จริง; หากไม่ตั้งจะข้ามเพื่อให้ `pnpm test:live` มุ่งเน้นที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias ของ modern allowlist
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (comma allowlist)
  - โดยค่าเริ่มต้น modern/all sweeps จะใช้ curated high-signal cap; ตั้ง `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับ modern sweep แบบครบถ้วน หรือค่าบวกเพื่อกำหนด cap ที่เล็กลง
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma allowlist)
- คีย์มาจากที่ใด:
  - ค่าเริ่มต้น: profile store และ env fallbacks
  - ตั้ง `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **profile store**
- เหตุผลที่มีชุดนี้:
  - แยก “provider API พัง / คีย์ไม่ถูกต้อง” ออกจาก “gateway agent pipeline พัง”
  - บรรจุ regressions ขนาดเล็กแบบแยกเฉพาะ (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + tool-call flows)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - หมุน gateway ภายใน process
  - สร้าง/แพตช์เซสชัน `agent:dev:*` (เขียนทับโมเดลต่อการรัน)
  - วนผ่าน models-with-keys และยืนยันว่า:
    - ตอบกลับได้อย่าง “มีความหมาย” (ไม่มี tools)
    - มีการเรียกใช้ tool จริงได้ (read probe)
    - มี tool probes เพิ่มเติมแบบไม่บังคับ (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียดของ probe (เพื่อให้คุณอธิบายความล้มเหลวได้เร็ว):
  - `read` probe: การทดสอบจะเขียนไฟล์ nonce ใน workspace แล้วขอให้เอเจนต์ `read` ไฟล์นั้นและสะท้อน nonce กลับ
  - `exec+read` probe: การทดสอบจะขอให้เอเจนต์ใช้ `exec` เขียน nonce ลงในไฟล์ชั่วคราว จากนั้น `read` กลับมา
  - image probe: การทดสอบจะแนบ PNG ที่สร้างขึ้น (cat + โค้ดสุ่ม) และคาดหวังให้โมเดลตอบ `cat <CODE>`
  - อ้างอิงการติดตั้งใช้งาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias ของ modern allowlist
  - หรือกำหนด `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือ comma list) เพื่อจำกัดขอบเขต
  - โดยค่าเริ่มต้น modern/all gateway sweeps จะใช้ curated high-signal cap; ตั้ง `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับ modern sweep แบบครบถ้วน หรือค่าบวกเพื่อกำหนด cap ที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “OpenRouter ทุกอย่าง”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma allowlist)
- tool + image probes เปิดตลอดเวลาใน live test นี้:
  - `read` probe + `exec+read` probe (ความเครียดของ tool)
  - image probe จะรันเมื่อโมเดลประกาศว่ารองรับ image input
  - Flow (ระดับสูง):
    - การทดสอบจะสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent ส่งต่อข้อความผู้ใช้แบบหลายสื่อไปยังโมเดล
    - การยืนยัน: คำตอบมี `cat` + โค้ดนั้น (ยอมรับ OCR ที่ผิดเล็กน้อยได้)

เคล็ดลับ: หากต้องการดูว่าคุณทดสอบอะไรได้บ้างบนเครื่องของคุณ (และ `provider/model` ids ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini หรือ CLIs ภายในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline ของ Gateway + agent โดยใช้แบ็กเอนด์ CLI ภายในเครื่อง โดยไม่แตะ config ค่าเริ่มต้นของคุณ
- ค่า smoke defaults เฉพาะแบ็กเอนด์จะอยู่กับคำจำกัดความ `cli-backend.ts` ของส่วนขยายเจ้าของนั้น
- การเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - provider/model ค่าเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ Plugin แบ็กเอนด์ CLI เจ้าของนั้น
- การเขียนทับ (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (พาธจะถูก inject ลงใน prompt)
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์รูปภาพเป็น CLI args แทนการ inject ลง prompt
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อมีการตั้ง `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งรอบที่สองและตรวจสอบ flow การ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` เพื่อปิด default continuity probe แบบ Claude Sonnet -> Opus ภายในเซสชันเดียวกัน (ตั้งเป็น `1` เพื่อบังคับเปิดเมื่อโมเดลที่เลือกมีเป้าหมายสำหรับสลับโมเดล)

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker แบบผู้ให้บริการเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรัน live CLI-backend smoke ภายในอิมเมจ Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จากส่วนขยายเจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมี cache ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่านทั้ง `~/.claude/.credentials.json` พร้อม `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` มันจะพิสูจน์ `claude -p` โดยตรงใน Docker ก่อน จากนั้นจึงรัน Gateway CLI-backend สองรอบโดยไม่คงตัวแปร env ของ Anthropic API key ไว้ lane แบบ subscription นี้จะปิด Claude MCP/tool และ image probes ตามค่าเริ่มต้น เพราะปัจจุบัน Claude กำหนดเส้นทางการใช้งานแอปของบุคคลที่สามผ่านการคิดค่าบริการ extra-usage แทนข้อจำกัดของแผน subscription ปกติ
- ตอนนี้ live CLI-backend smoke ทดสอบ flow แบบ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: รอบข้อความ, รอบจำแนกรูปภาพ จากนั้นเรียก MCP tool `cron` และตรวจสอบผ่าน gateway CLI
- smoke ค่าเริ่มต้นของ Claude ยังแพตช์เซสชันจาก Sonnet ไปเป็น Opus และตรวจสอบว่าเซสชันที่ resume แล้วยังคงจำบันทึกก่อนหน้าได้

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบ flow การ bind การสนทนา ACP จริงกับ ACP agent แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind การสนทนาแบบ synthetic message-channel ไว้กับที่
  - ส่งข้อความติดตามผลปกติบนการสนทนาเดิมนั้น
  - ตรวจสอบว่าข้อความติดตามผลไปลงใน transcript ของ ACP session ที่ bind ไว้
- การเปิดใช้งาน:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - ACP agents ใน Docker: `claude,codex,gemini`
  - ACP agent สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - ช่องทางสังเคราะห์: บริบทการสนทนาแบบ Slack DM
  - ACP backend: `acpx`
- การเขียนทับ:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- หมายเหตุ:
  - lane นี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route แบบ synthetic ที่สงวนไว้สำหรับผู้ดูแล เพื่อให้การทดสอบแนบบริบทของ message-channel ได้โดยไม่ต้องแสร้งทำเป็นส่งออกจริงภายนอก
  - เมื่อไม่ได้ตั้ง `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรี agent ในตัวของ Plugin `acpx` แบบฝังสำหรับ ACP harness agent ที่เลือก

ตัวอย่าง:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

สูตร Docker:

```bash
pnpm test:docker:live-acp-bind
```

สูตร Docker แบบเอเจนต์เดี่ยว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

หมายเหตุเกี่ยวกับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- ตามค่าเริ่มต้น มันจะรัน ACP bind smoke กับ live CLI agents ที่รองรับทั้งหมดตามลำดับ: `claude`, `codex`, แล้ว `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` เพื่อจำกัดเมทริกซ์
- มันจะ source `~/.profile`, เตรียม CLI auth material ที่ตรงกันเข้า container, ติดตั้ง `acpx` ลงใน npm prefix ที่เขียนได้ จากนั้นติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) หากยังไม่มี
- ภายใน Docker ตัวรันจะตั้ง `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` เพื่อให้ acpx คงตัวแปร env ของผู้ให้บริการจากโปรไฟล์ที่ source ไว้ให้พร้อมใช้งานกับ child harness CLI

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ Codex harness ที่ Plugin เป็นเจ้าของผ่าน
  เมธอด `agent` ของ gateway ตามปกติ:
  - โหลด Plugin `codex` ที่มากับระบบ
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่ง gateway agent turn แรกไปยัง `codex/gpt-5.4`
  - ส่ง turn ที่สองไปยัง OpenClaw session เดิมและตรวจสอบว่า app-server
    thread สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่งของ gateway
    เดียวกัน
  - เลือกรัน escalated shell probes ที่ผ่านการทบทวนโดย Guardian สองรายการ:
    คำสั่งที่ไม่เป็นอันตรายหนึ่งรายการซึ่งควรได้รับการอนุมัติ และคำสั่งอัปโหลดความลับปลอมหนึ่งรายการที่ควรถูก
    ปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- การเปิดใช้งาน: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลค่าเริ่มต้น: `codex/gpt-5.4`
- image probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke นี้ตั้งค่า `OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อให้ Codex
  harness ที่เสียไม่สามารถผ่านได้ด้วยการ fallback ไป PI แบบเงียบๆ
- Auth: `OPENAI_API_KEY` จาก shell/profile พร้อมตัวเลือกคัดลอก
  `~/.codex/auth.json` และ `~/.codex/config.toml`

สูตรในเครื่อง:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

สูตร Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

หมายเหตุเกี่ยวกับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- มันจะ source `~/.profile` ที่ถูก mount, ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์
  auth ของ Codex CLI เมื่อมี ติดตั้ง `@openai/codex` ลงใน npm
  prefix แบบ mount ที่เขียนได้ จัดเตรียม source tree แล้วรันเฉพาะการทดสอบ live ของ Codex-harness
- Docker จะเปิด image, MCP/tool และ Guardian probes ตามค่าเริ่มต้น ตั้ง
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อต้องการการรันดีบักที่แคบลง
- Docker ยัง export `OPENCLAW_AGENT_HARNESS_FALLBACK=none` เหมือนกับ
  config ของ live test ดังนั้น fallback ไป `openai-codex/*` หรือ PI จะไม่สามารถซ่อน
  regression ของ Codex harness ได้

### สูตร live ที่แนะนำ

allowlists ที่แคบและชัดเจนจะเร็วที่สุดและมีความไม่เสถียรน้อยที่สุด:

- โมเดลเดี่ยว แบบตรง (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดี่ยว gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกใช้ tools ข้ามหลายผู้ให้บริการ:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ Antigravity OAuth bridge (agent endpoint แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (มีความแปลกเฉพาะด้าน auth + tooling แยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API แบบโฮสต์ของ Google ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่มักหมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw เรียกไบนารี `gemini` ในเครื่อง; มันมี auth ของตัวเองและอาจมีพฤติกรรมต่างออกไป (การสตรีม/การรองรับ tools/version skew)

## Live: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดลของ CI” แบบตายตัว (live เป็นแบบเลือกใช้เอง) แต่ต่อไปนี้คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่องนักพัฒนาที่มีคีย์

### ชุด smoke สมัยใหม่ (tool calling + image)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดว่าจะต้องยังทำงานได้:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.4` (ตัวเลือก: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x รุ่นเก่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### พื้นฐาน: tool calling (Read + Exec แบบไม่บังคับ)

เลือกอย่างน้อยหนึ่งรายการต่อ family ของผู้ให้บริการ:

- OpenAI: `openai/gpt-5.4` (หรือ `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบไม่บังคับ (มีก็ดี):

- xAI: `xai/grok-4` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกหนึ่งโมเดลที่รองรับ tools ที่คุณเปิดใช้งานไว้)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (ในเครื่อง; tool calling ขึ้นอยู่กับโหมด API)

### Vision: การส่งรูปภาพ (ไฟล์แนบ → ข้อความหลายสื่อ)

ใส่อย่างน้อยหนึ่งโมเดลที่รองรับรูปภาพไว้ใน `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI รุ่นที่รองรับ vision เป็นต้น) เพื่อทดสอบ image probe

### Aggregators / alternate gateways

หากคุณเปิดใช้งานคีย์ไว้ เราก็รองรับการทดสอบผ่านสิ่งต่อไปนี้ด้วย:

- OpenRouter: `openrouter/...` (มีโมเดลหลายร้อยรายการ; ใช้ `openclaw models scan` เพื่อหา candidates ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณสามารถรวมไว้ใน live matrix ได้ (หากคุณมี creds/config):

- แบบ built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (custom endpoints): `minimax` (cloud/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic ทุกชนิด (LM Studio, vLLM, LiteLLM เป็นต้น)

เคล็ดลับ: อย่าพยายามฮาร์ดโค้ด “ทุกโมเดล” ลงในเอกสาร รายการอ้างอิงที่แท้จริงคืออะไรก็ตามที่ `discoverModels(...)` ส่งคืนบนเครื่องของคุณ + คีย์ที่มีอยู่

## Credentials (ห้าม commit)

การทดสอบ live ค้นหา credentials แบบเดียวกับที่ CLI ใช้ ผลในทางปฏิบัติคือ:

- หาก CLI ใช้งานได้ การทดสอบ live ก็ควรหาคีย์เดียวกันได้
- หากการทดสอบ live บอกว่า “ไม่มี creds” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์ auth ต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “profile keys” ในการทดสอบ live)
- Config: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะแบบเดิม: `~/.openclaw/credentials/` (ถูกคัดลอกเข้า staged live home เมื่อมี แต่ไม่ใช่ที่เก็บ profile-key หลัก)
- การรัน live ในเครื่องจะคัดลอก config ที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` ต่อเอเจนต์, `credentials/` แบบเดิม และ external CLI auth dirs ที่รองรับ ไปยัง test home ชั่วคราวตามค่าเริ่มต้น; staged live homes จะข้าม `workspace/` และ `sandboxes/` และจะลบการเขียนทับพาธ `agents.*.workspace` / `agentDir` เพื่อให้ probes อยู่ห่างจาก workspace จริงของโฮสต์

หากคุณต้องการพึ่งพาคีย์จาก env (เช่น export ไว้ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลัง `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (สามารถ mount `~/.profile` เข้า container ได้)

## Deepgram live (การถอดเสียงจากเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- การเปิดใช้งาน: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- การทดสอบ: `extensions/byteplus/live.test.ts`
- การเปิดใช้งาน: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การเขียนทับโมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- การเปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทาง image, video และ `music_generate` ของ comfy ที่มากับระบบ
  - ข้ามแต่ละความสามารถ เว้นแต่จะมีการกำหนด `models.providers.comfy.<capability>`
  - มีประโยชน์หลังจากเปลี่ยน workflow submission, polling, downloads หรือการลงทะเบียน Plugin ของ comfy

## Image generation live

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - แสดงรายการทุก Plugin ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้
  - โหลดตัวแปร env ของผู้ให้บริการที่ขาดจาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API keys แบบ live/env ก่อน stored auth profiles ตามค่าเริ่มต้น เพื่อไม่ให้ test keys เก่าที่ค้างใน `auth-profiles.json` มาบดบัง credentials จริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้ได้
  - รัน variants การสร้างภาพมาตรฐานผ่าน runtime capability ที่ใช้ร่วมกัน:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- ผู้ให้บริการแบบ bundled ที่ครอบคลุมอยู่ในปัจจุบัน:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่สนใจการเขียนทับแบบ env-only

## Music generation live

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- การเปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงแบบ bundled ที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลดตัวแปร env ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API keys แบบ live/env ก่อน stored auth profiles ตามค่าเริ่มต้น เพื่อไม่ให้ test keys เก่าที่ค้างใน `auth-profiles.json` มาบดบัง credentials จริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันทั้งสอง runtime modes ที่ประกาศไว้เมื่อมี:
    - `generate` พร้อมอินพุตแบบ prompt-only
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมใน shared-lane ปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ใช้ไฟล์ live ของ Comfy แยกต่างหาก ไม่ใช่ sweep ร่วมนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่สนใจการเขียนทับแบบ env-only

## Video generation live

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- การเปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอแบบ bundled ที่ใช้ร่วมกัน
  - ใช้เส้นทาง smoke ที่ปลอดภัยสำหรับการปล่อยรุ่นตามค่าเริ่มต้น: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งรายการต่อผู้ให้บริการ, prompt กุ้งมังกรยาวหนึ่งวินาที และ per-provider operation cap จาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` ตามค่าเริ่มต้น)
  - ข้าม FAL ตามค่าเริ่มต้นเพราะเวลาแฝงในคิวฝั่งผู้ให้บริการอาจครอบงำเวลาในการปล่อยรุ่น; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันโดยชัดเจน
  - โหลดตัวแปร env ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API keys แบบ live/env ก่อน stored auth profiles ตามค่าเริ่มต้น เพื่อไม่ให้ test keys เก่าที่ค้างใน `auth-profiles.json` มาบดบัง credentials จริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันเฉพาะ `generate` ตามค่าเริ่มต้น
  - ตั้ง `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรัน transform modes ที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับ local image input แบบ buffer-backed ใน shared sweep
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับ local video input แบบ buffer-backed ใน shared sweep
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `vydra` เพราะ `veo3` ที่มากับระบบรองรับเฉพาะข้อความ และ `kling` ที่มากับระบบต้องใช้ remote image URL
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นจะรัน `veo3` แบบ text-to-video พร้อม lane `kling` ที่ใช้ fixture แบบ remote image URL ตามค่าเริ่มต้น
  - ความครอบคลุม `videoToVideo` แบบ live ในปัจจุบัน:
    - `runway` เท่านั้น เมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `alibaba`, `qwen`, `xai` เพราะปัจจุบันเส้นทางเหล่านั้นต้องใช้ reference URLs แบบ remote `http(s)` / MP4
    - `google` เพราะ lane Gemini/Veo ร่วมในปัจจุบันใช้ local input แบบ buffer-backed และเส้นทางนั้นไม่ถูกรับรองใน shared sweep
    - `openai` เพราะ shared lane ปัจจุบันยังไม่มีการรับประกันสิทธิ์เข้าถึง video inpaint/remix แบบเฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวไว้ใน sweep ค่าเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลด per-provider operation cap สำหรับ smoke run แบบเข้มข้น
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่สนใจการเขียนทับแบบ env-only

## Media live harness

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุด live สำหรับ image, music และ video ที่ใช้ร่วมกันผ่าน entrypoint แบบ native ของ repo เพียงจุดเดียว
  - โหลดตัวแปร env ของผู้ให้บริการที่ขาดจาก `~/.profile` โดยอัตโนมัติ
  - จำกัดแต่ละชุดไปยังผู้ให้บริการที่มี auth ใช้งานได้ในขณะนั้นโดยอัตโนมัติตามค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ร่วมกัน ดังนั้นพฤติกรรม heartbeat และ quiet-mode จึงคงสม่ำเสมอ
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ตัวรัน Docker (ทางเลือกสำหรับการตรวจสอบแบบ "ใช้งานได้บน Linux")

ตัวรัน Docker เหล่านี้แยกเป็น 2 กลุ่ม:

- ตัวรัน live-model: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ที่ตรงกันภายในอิมเมจ Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount local config dir และ workspace ของคุณ (และ source `~/.profile` หากมีการ mount) entrypoints ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรัน Docker live ใช้ smoke cap ที่เล็กกว่าตามค่าเริ่มต้น เพื่อให้การ sweep Docker เต็มรูปแบบยังใช้งานได้จริง:
  `test:docker:live-models` ใช้ค่าเริ่มต้น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` ใช้ค่าเริ่มต้น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` เขียนทับตัวแปร env เหล่านั้นเมื่อคุณ
  ต้องการการสแกนแบบ exhaustive ที่ใหญ่กว่านั้นอย่างชัดเจน
- `test:docker:all` จะ build live Docker image หนึ่งครั้งผ่าน `test:docker:live-build` จากนั้นใช้ซ้ำสำหรับ 2 live Docker lanes นั้น นอกจากนี้ยัง build shared image หนึ่งตัวจาก `scripts/e2e/Dockerfile` ผ่าน `test:docker:e2e-build` และใช้ซ้ำกับ E2E container smoke runners ที่ทดสอบแอปที่ build แล้ว

ตัวรัน Docker ของ live-model ยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทุกตัวที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้า container home ก่อนรัน เพื่อให้ external-CLI OAuth รีเฟรช tokens ได้โดยไม่แก้ไข auth store บนโฮสต์:

- Direct models: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, full scaffolding): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` จะติดตั้ง OpenClaw tarball ที่ pack แล้วแบบ global ใน Docker กำหนดค่า OpenAI ผ่าน onboarding แบบ env-ref พร้อม Telegram ตามค่าเริ่มต้น ตรวจสอบว่าการเปิดใช้งาน Plugin จะติดตั้ง runtime deps ตามต้องการ รัน doctor และรัน mocked OpenAI agent turn หนึ่งครั้ง ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- Gateway networking (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) จะรัน mocked OpenAI server ผ่าน Gateway ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ provider schema ปฏิเสธและตรวจสอบว่า raw detail ปรากฏใน Gateway logs
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (stdio MCP server จริง + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (Gateway จริง + stdio MCP child teardown หลังการรัน cron แบบแยกและ one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke + alias `/plugin` + Claude-bundle restart semantics): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Bundled plugin runtime deps: `pnpm test:docker:bundled-channel-deps` จะ build Docker runner image ขนาดเล็กตามค่าเริ่มต้น build และ pack OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้น mount tarball นั้นเข้าไปในแต่ละสถานการณ์การติดตั้งบน Linux ใช้อิมเมจเดิมซ้ำด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการ rebuild บนโฮสต์หลังจาก build ในเครื่องใหม่ด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปยัง tarball ที่มีอยู่ด้วย `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`
- จำกัด bundled plugin runtime deps ระหว่างการวนซ้ำโดยปิดสถานการณ์ที่ไม่เกี่ยวข้อง เช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

หากต้องการ build และใช้ shared built-app image ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การเขียนทับอิมเมจแบบเฉพาะชุด เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` จะยังมีลำดับความสำคัญสูงกว่าเมื่อมีการตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปที่อิมเมจ shared แบบ remote สคริปต์จะ pull ลงมาหากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และ installer ยังคงใช้ Dockerfiles ของตัวเอง เพราะมันทดสอบพฤติกรรมของแพ็กเกจ/การติดตั้ง ไม่ใช่ shared built-app runtime

ตัวรัน Docker ของ live-model ยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียว และ
จัดเตรียมมันเข้าไปยัง workdir ชั่วคราวภายใน container วิธีนี้ช่วยให้ runtime
image มีขนาดเล็ก ขณะเดียวกันก็ยังรัน Vitest กับ source/config ในเครื่องของคุณได้ตรงตามจริง
ขั้นตอนการจัดเตรียมจะข้าม local-only caches ขนาดใหญ่และ app build outputs เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และ app-local `.build` หรือ
ไดเรกทอรีเอาต์พุตของ Gradle เพื่อไม่ให้ Docker live runs ใช้เวลาหลายนาทีในการคัดลอก
artifacts ที่เฉพาะกับเครื่อง
นอกจากนี้ยังตั้ง `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ gateway live probes ไม่เริ่ม
channel workers จริงของ Telegram/Discord/อื่นๆ ภายใน container
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดขอบเขตหรือยกเว้น gateway
live coverage จาก Docker lane นั้น
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่ม
OpenClaw gateway container พร้อมเปิดใช้งาน HTTP endpoints ที่เข้ากันได้กับ OpenAI,
เริ่ม Open WebUI container ที่ pin ไว้ให้ชี้ไปยัง gateway นั้น ลงชื่อเข้าใช้ผ่าน
Open WebUI ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` จากนั้นส่ง
คำขอแชตจริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
อิมเมจ Open WebUI และ Open WebUI อาจต้องทำ cold-start setup ของตัวเองให้เสร็จ
lane นี้คาดว่าจะมี live model key ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` ตามค่าเริ่มต้น) เป็นวิธีหลักในการส่งให้ในการรันแบบ Dockerized
การรันที่สำเร็จจะพิมพ์ JSON payload ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกตั้งใจให้มีความกำหนดแน่นอนและไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันจะบูต seeded Gateway
container เริ่ม container ที่สองซึ่งสร้าง `openclaw mcp serve` จากนั้น
ตรวจสอบ routed conversation discovery, transcript reads, attachment metadata,
พฤติกรรมของ live event queue, การกำหนดเส้นทางการส่งขาออก และ Claude-style channel +
permission notifications ผ่าน stdio MCP bridge จริง การตรวจสอบ notification
จะตรวจสอบ raw stdio MCP frames โดยตรง ดังนั้น smoke นี้จึงยืนยันสิ่งที่
bridge ปล่อยออกมาจริง ไม่ใช่แค่สิ่งที่ SDK ของไคลเอนต์ตัวใดตัวหนึ่งบังเอิญแสดงให้เห็น
`test:docker:pi-bundle-mcp-tools` มีความกำหนดแน่นอนและไม่ต้องใช้
live model key มันจะ build repo Docker image เริ่ม stdio MCP probe server จริง
ภายใน container ทำให้เซิร์ฟเวอร์นั้นปรากฏผ่าน embedded Pi bundle
MCP runtime รัน tool จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงมี
tools แบบ `bundle-mcp` ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองมันออก
`test:docker:cron-mcp-cleanup` มีความกำหนดแน่นอนและไม่ต้องใช้ live model
key มันจะเริ่ม seeded Gateway พร้อม stdio MCP probe server จริง รัน
isolated cron turn และ `/subagents spawn` child turn แบบ one-shot จากนั้นตรวจสอบว่า
MCP child process ออกจากระบบหลังการรันแต่ละครั้ง

Manual ACP plain-language thread smoke (ไม่อยู่ใน CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- ให้เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug อาจจำเป็นอีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบออก

ตัวแปร env ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI แบบ cache ภายใน Docker
- external CLI auth dirs/files ภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวใต้ `/host-auth...` จากนั้นคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีค่าเริ่มต้น: `.minimax`
  - ไฟล์ค่าเริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรันแบบจำกัดผู้ให้บริการจะ mount เฉพาะ dirs/files ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - เขียนทับด้วยตนเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือ comma list เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรองผู้ให้บริการภายใน container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้อิมเมจ `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการรันซ้ำที่ไม่ต้อง build ใหม่
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway เปิดเผยให้กับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อเขียนทับ nonce-check prompt ที่ใช้โดย Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อเขียนทับแท็กอิมเมจ Open WebUI ที่ pin ไว้

## การตรวจสอบความถูกต้องของเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไข docs: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจสอบหัวข้อในหน้าไปด้วย: `pnpm docs:check-links:anchors`

## Offline regression (ปลอดภัยสำหรับ CI)

สิ่งเหล่านี้คือ regressions แบบ “pipeline จริง” โดยไม่ใช้ผู้ให้บริการจริง:

- Gateway tool calling (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts` (เคส: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, บังคับการเขียน config + auth): `src/gateway/gateway.test.ts` (เคส: "runs wizard over ws and writes auth token config")

## Agent reliability evals (Skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งทำหน้าที่คล้าย “agent reliability evals”:

- การเรียกใช้ mock tool ผ่าน real gateway + agent loop (`src/gateway/gateway.test.ts`)
- โฟลว์ wizard แบบ end-to-end ที่ตรวจสอบการเชื่อมต่อของเซสชันและผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **Decisioning:** เมื่อ Skills ถูกแสดงใน prompt เอเจนต์เลือก Skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยง Skills ที่ไม่เกี่ยวข้องได้หรือไม่)
- **Compliance:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/args ที่จำเป็นหรือไม่
- **Workflow contracts:** สถานการณ์หลายรอบที่ยืนยันลำดับของ tools, การคงต่อของประวัติเซสชัน และขอบเขตของ sandbox

evals ในอนาคตควรคงความกำหนดแน่นอนก่อน:

- scenario runner ที่ใช้ mock providers เพื่อยืนยัน tool calls + ลำดับ, การอ่านไฟล์ Skill และการเชื่อมต่อเซสชัน
- ชุดสถานการณ์ขนาดเล็กที่โฟกัสเรื่อง Skill (ใช้ vs หลีกเลี่ยง, gating, prompt injection)
- live evals แบบไม่บังคับ (opt-in, กำกับด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract tests (รูปร่างของ Plugin และช่องทาง)

Contract tests ตรวจสอบว่า Plugin และช่องทางที่ลงทะเบียนไว้ทุกตัวเป็นไปตาม
สัญญาของอินเทอร์เฟซของมัน มันจะวนผ่าน Plugins ที่ค้นพบทั้งหมดและรันชุดการยืนยัน
ทั้งด้านรูปร่างและพฤติกรรม `pnpm test` ใน unit lane ตามค่าเริ่มต้นตั้งใจข้ามไฟล์ seam และ smoke ที่ใช้ร่วมกันเหล่านี้; ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะพื้นผิวช่องทางหรือผู้ให้บริการที่ใช้ร่วมกัน

### คำสั่ง

- Contracts ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ที่ `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ Plugin (id, name, capabilities)
- **setup** - สัญญาของ setup wizard
- **session-binding** - พฤติกรรมการผูกเซสชัน
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ channel action
- **threading** - การจัดการ thread ID
- **directory** - API ของ directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`

- **status** - การ probe สถานะของช่องทาง
- **registry** - รูปร่างของรีจิสทรี Plugin

### Provider contracts

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญาของ auth flow
- **auth-choice** - การเลือก/คัดเลือก auth
- **catalog** - API แค็ตตาล็อกโมเดล
- **discovery** - การค้นหา Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของผู้ให้บริการ
- **shape** - รูปร่าง/อินเทอร์เฟซของ Plugin
- **wizard** - setup wizard

### เมื่อใดควรรัน

- หลังเปลี่ยน plugin-sdk exports หรือ subpaths
- หลังเพิ่มหรือแก้ไข channel หรือ provider plugin
- หลัง refactor การลงทะเบียนหรือการค้นหา Plugin

Contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (แนวทาง)

เมื่อคุณแก้ปัญหาของผู้ให้บริการ/โมเดลที่ค้นพบในการทดสอบ live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub ผู้ให้บริการ หรือจับการแปลงรูปร่างคำขอที่แน่นอน)
- หากโดยธรรมชาติเป็น live-only (rate limits, auth policies) ให้คง live test ให้แคบและเป็นแบบ opt-in ผ่านตัวแปร env
- ควรเจาะจงที่เลเยอร์ที่เล็กที่สุดซึ่งจับบั๊กได้:
  - บั๊กในการแปลง/เล่นซ้ำคำขอของผู้ให้บริการ → direct models test
  - บั๊กใน gateway session/history/tool pipeline → gateway live smoke หรือ gateway mock test ที่ปลอดภัยสำหรับ CI
- รั้วป้องกัน SecretRef traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` จะอนุมาน sampled target หนึ่งรายการต่อ SecretRef class จาก registry metadata (`listSecretTargetRegistryEntries()`), จากนั้นยืนยันว่ามีการปฏิเสธ exec ids แบบ traversal-segment
  - หากคุณเพิ่มตระกูลเป้าหมาย SecretRef ใหม่ที่ใช้ `includeInPlan` ใน `src/secrets/target-registry-data.ts` ให้ปรับ `classifyTargetClass` ในการทดสอบนั้น การทดสอบนี้ตั้งใจให้ล้มเหลวเมื่อพบ target ids ที่ยังไม่ถูกจัดหมวดหมู่ เพื่อไม่ให้คลาสใหม่ถูกข้ามไปอย่างเงียบๆ
