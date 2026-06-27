---
read_when:
    - การทำงานกับโค้ดหรือการทดสอบรันไทม์เอเจนต์ของ OpenClaw
    - กำลังเรียกใช้โฟลว์ lint, typecheck และการทดสอบสดของ agent-runtime
summary: 'เวิร์กโฟลว์สำหรับนักพัฒนาสำหรับรันไทม์เอเจนต์ของ OpenClaw: การบิลด์ การทดสอบ และการตรวจสอบยืนยันแบบไลฟ์'
title: เวิร์กโฟลว์รันไทม์ของเอเจนต์ OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:47:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

เวิร์กโฟลว์ที่สมเหตุสมผลสำหรับการทำงานกับรันไทม์เอเจนต์ของ OpenClaw ใน OpenClaw

## การตรวจสอบชนิดและการ lint

- เกตในเครื่องตามค่าเริ่มต้น: `pnpm check`
- เกตการ build: `pnpm build` เมื่อการเปลี่ยนแปลงอาจส่งผลต่อผลลัพธ์การ build, การจัดแพ็กเกจ, หรือขอบเขต lazy-loading/module
- เกตเต็มรูปแบบก่อน landing สำหรับการเปลี่ยนแปลงรันไทม์เอเจนต์: `pnpm check && pnpm test`

## การรันการทดสอบ Agent Runtime

รันชุดการทดสอบ agent-runtime โดยตรงด้วย Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

หากต้องการรวมการทดสอบผู้ให้บริการแบบ live:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

ส่วนนี้ครอบคลุมชุด unit หลักของรันไทม์เอเจนต์:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## การทดสอบด้วยตนเอง

โฟลว์ที่แนะนำ:

- รัน Gateway ในโหมด dev:
  - `pnpm gateway:dev`
- ทริกเกอร์เอเจนต์โดยตรง:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- ใช้ TUI สำหรับการดีบักแบบโต้ตอบ:
  - `pnpm tui`

สำหรับพฤติกรรมการเรียกเครื่องมือ ให้พรอมป์ให้ทำ action แบบ `read` หรือ `exec` เพื่อให้คุณเห็น tool streaming และการจัดการ payload

## การรีเซ็ตเป็นสถานะสะอาด

สถานะอยู่ภายใต้ไดเรกทอรีสถานะของ OpenClaw ค่าเริ่มต้นคือ `~/.openclaw` หากตั้งค่า `OPENCLAW_STATE_DIR` ไว้ ให้ใช้ไดเรกทอรีนั้นแทน

หากต้องการรีเซ็ตทุกอย่าง:

- `openclaw.json` สำหรับ config
- `agents/<agentId>/agent/auth-profiles.json` สำหรับโปรไฟล์ auth ของโมเดล (API keys + OAuth)
- `credentials/` สำหรับสถานะของผู้ให้บริการ/ช่องทางที่ยังอยู่นอกที่เก็บโปรไฟล์ auth
- `agents/<agentId>/sessions/` สำหรับประวัติเซสชันของเอเจนต์
- `agents/<agentId>/sessions/sessions.json` สำหรับดัชนีเซสชัน
- `sessions/` หากมีพาธ legacy อยู่
- `workspace/` หากคุณต้องการ workspace ว่าง

หากคุณต้องการรีเซ็ตเฉพาะเซสชัน ให้ลบ `agents/<agentId>/sessions/` สำหรับเอเจนต์นั้น หากคุณต้องการเก็บ auth ไว้ ให้คง `agents/<agentId>/agent/auth-profiles.json` และสถานะผู้ให้บริการใด ๆ ภายใต้ `credentials/` ไว้ตามเดิม

## อ้างอิง

- [การทดสอบ](/th/help/testing)
- [เริ่มต้นใช้งาน](/th/start/getting-started)

## ที่เกี่ยวข้อง

- [สถาปัตยกรรมรันไทม์เอเจนต์ของ OpenClaw](/th/agent-runtime-architecture)
