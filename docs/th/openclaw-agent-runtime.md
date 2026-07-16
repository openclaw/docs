---
read_when:
    - การทำงานกับโค้ดรันไทม์ของเอเจนต์ OpenClaw หรือการทดสอบ
    - การเรียกใช้โฟลว์การตรวจสอบลินต์ การตรวจสอบชนิด และการทดสอบแบบสดของรันไทม์เอเจนต์
summary: 'เวิร์กโฟลว์สำหรับนักพัฒนารันไทม์เอเจนต์ OpenClaw: การบิลด์ การทดสอบ และการตรวจสอบแบบใช้งานจริง'
title: เวิร์กโฟลว์รันไทม์เอเจนต์ของ OpenClaw
x-i18n:
    generated_at: "2026-07-16T19:17:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

เวิร์กโฟลว์สำหรับนักพัฒนาของรันไทม์เอเจนต์ (`src/agents/`) ในรีโพ OpenClaw

## การตรวจสอบชนิดและการตรวจ lint

- เกตเริ่มต้นสำหรับเครื่องภายใน: `pnpm check` (ตรวจสอบชนิด, lint, ตัวป้องกันนโยบาย)
- เกตการบิลด์: `pnpm build` เมื่อการเปลี่ยนแปลงอาจส่งผลต่อเอาต์พุตการบิลด์ การแพ็กเกจ หรือขอบเขตของการโหลดแบบ lazy/โมดูล
- เกตก่อน push แบบเต็ม: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## การรันการทดสอบรันไทม์เอเจนต์

รันชุดการทดสอบหน่วยของรันไทม์เอเจนต์:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

glob แรกครอบคลุมชุด `agent-tools*`, `agent-settings` และ
`agent-tool-definition-adapter*` ด้วย

การทดสอบแบบสดไม่รวมอยู่ในการกำหนดค่าการทดสอบหน่วย ให้รันผ่าน wrapper
สำหรับการทดสอบแบบสด (ตั้งค่า `OPENCLAW_LIVE_TEST=1` และต้องใช้ข้อมูลประจำตัวของผู้ให้บริการ):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## การทดสอบด้วยตนเอง

- รัน Gateway ในโหมดพัฒนา (ข้ามการเชื่อมต่อช่องทางผ่าน `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- ทริกเกอร์การทำงานของเอเจนต์หนึ่งรอบผ่าน Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- ใช้ TUI สำหรับการดีบักแบบโต้ตอบ: `pnpm tui`

สำหรับพฤติกรรมการเรียกใช้เครื่องมือ ให้พรอมต์เพื่อดำเนินการ `read` หรือ `exec` เพื่อให้สามารถสังเกต
การสตรีมของเครื่องมือและการจัดการเพย์โหลดได้

## การรีเซ็ตเป็นสถานะเริ่มต้น

สถานะอยู่ในไดเรกทอรีสถานะของ OpenClaw: ค่าเริ่มต้นคือ `~/.openclaw` หรือ
`$OPENCLAW_STATE_DIR` เมื่อตั้งค่าไว้ พาธต่อไปนี้สัมพันธ์กับไดเรกทอรีดังกล่าว:

| พาธ                                           | จัดเก็บ                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | การกำหนดค่า                                                             |
| `state/openclaw.sqlite`                        | ฐานข้อมูลสถานะรันไทม์ที่ใช้ร่วมกัน                                      |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | โปรไฟล์การยืนยันตัวตนของโมเดลสำหรับแต่ละเอเจนต์ (คีย์ API + OAuth) และสถานะรันไทม์ |
| `credentials/`                                 | ข้อมูลประจำตัวของผู้ให้บริการ/ช่องทางที่อยู่นอกที่เก็บโปรไฟล์การยืนยันตัวตน        |
| `agents/<agentId>/sessions/`                   | ประวัติทรานสคริปต์และแหล่งข้อมูลสำหรับย้ายเซสชันแบบเดิม            |
| `sessions/`                                    | ที่เก็บเซสชันแบบเอเจนต์เดียวรุ่นเก่า (เฉพาะการติดตั้งเก่า)              |
| `workspace/`                                   | พื้นที่ทำงานเริ่มต้นของเอเจนต์ (เอเจนต์เพิ่มเติมใช้ `workspace-<agentId>`)   |

ลบพาธเหล่านี้เพื่อรีเซ็ตทั้งหมด สำหรับการรีเซ็ตที่เจาะจงยิ่งขึ้น:

- เฉพาะเซสชัน: อย่าลบ `agents/<agentId>/agent/openclaw-agent.sqlite`; แถวข้อมูลเซสชันอยู่ในนั้นร่วมกับสถานะอื่นของแต่ละเอเจนต์ ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่สำหรับแชตหนึ่งรายการ และใช้ `openclaw sessions cleanup` สำหรับการบำรุงรักษาเซสชัน
- เก็บข้อมูลการยืนยันตัวตนไว้: คง `agents/<agentId>/agent/openclaw-agent.sqlite` และ `credentials/` ไว้

ระบบจะไม่อ่านไฟล์ `auth-profiles.json` แบบเดิมในขณะรันไทม์อีกต่อไป;
`openclaw doctor --fix` จะนำเข้าไฟล์เหล่านั้นไปยังที่เก็บ SQLite

## เอกสารอ้างอิง

- [การทดสอบ](/th/help/testing)
- [เริ่มต้นใช้งาน](/th/start/getting-started)

## ที่เกี่ยวข้อง

- [สถาปัตยกรรมรันไทม์เอเจนต์ของ OpenClaw](/th/agent-runtime-architecture)
