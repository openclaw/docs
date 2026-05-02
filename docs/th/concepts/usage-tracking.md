---
read_when:
    - คุณกำลังเชื่อมต่อส่วนแสดงการใช้งาน/โควตาของผู้ให้บริการ
    - คุณจำเป็นต้องอธิบายพฤติกรรมการติดตามการใช้งานหรือข้อกำหนดด้านการยืนยันตัวตน
summary: ส่วนที่แสดงการติดตามการใช้งานและข้อกำหนดของข้อมูลประจำตัว
title: การติดตามการใช้งาน
x-i18n:
    generated_at: "2026-05-02T10:14:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## คืออะไร

- ดึงข้อมูลการใช้งาน/โควตาของผู้ให้บริการจากเอนด์พอยต์การใช้งานของผู้ให้บริการโดยตรง
- ไม่มีค่าใช้จ่ายโดยประมาณ มีเฉพาะกรอบเวลาที่ผู้ให้บริการรายงาน
- เอาต์พุตสถานะที่มนุษย์อ่านได้จะถูกปรับให้อยู่ในรูปแบบ `X% left` แม้เมื่อ
  API ต้นทางรายงานโควตาที่ใช้ไปแล้ว โควตาที่เหลืออยู่ หรือมีเพียงจำนวนดิบเท่านั้น
- `/status` และ `session_status` ระดับเซสชันสามารถถอยกลับไปใช้รายการการใช้งานล่าสุด
  ในทรานสคริปต์ได้เมื่อสแนปชอตเซสชันสดมีข้อมูลน้อย การถอยกลับนี้จะเติมตัวนับ token/cache
  ที่ขาดหายไป สามารถกู้คืนป้ายชื่อโมเดล runtime ที่ใช้งานอยู่ และเลือกผลรวมที่เน้น prompt
  ซึ่งมีค่ามากกว่าเมื่อ metadata ของเซสชันขาดหายไปหรือมีค่าน้อยกว่า ค่า live ที่ไม่เป็นศูนย์เดิมยังคงชนะ

## แสดงที่ใด

- `/status` ในแชต: การ์ดสถานะที่มีอีโมจิจำนวนมาก พร้อม token ของเซสชัน + ค่าใช้จ่ายโดยประมาณ (เฉพาะคีย์ API) การใช้งานของผู้ให้บริการจะแสดงสำหรับ **ผู้ให้บริการโมเดลปัจจุบัน** เมื่อมีข้อมูล ในรูปแบบกรอบเวลา `X% left` ที่ปรับให้เป็นมาตรฐานแล้ว
- `/usage off|tokens|full` ในแชต: ส่วนท้ายการใช้งานรายคำตอบ (OAuth แสดงเฉพาะ token)
- `/usage cost` ในแชต: สรุปค่าใช้จ่ายในเครื่องที่รวบรวมจากบันทึกเซสชันของ OpenClaw
- CLI: `openclaw status --usage` พิมพ์รายละเอียดแบบเต็มแยกตามผู้ให้บริการ
- CLI: `openclaw channels list` พิมพ์สแนปชอตการใช้งานเดียวกันควบคู่กับการกำหนดค่าผู้ให้บริการ (ใช้ `--no-usage` เพื่อข้าม)
- แถบเมนู macOS: ส่วน “การใช้งาน” ใต้ Context (เฉพาะเมื่อมีข้อมูล)

## ผู้ให้บริการ + ข้อมูลรับรอง

- **Anthropic (Claude)**: token OAuth ในโปรไฟล์ auth
- **GitHub Copilot**: token OAuth ในโปรไฟล์ auth
- **Gemini CLI**: token OAuth ในโปรไฟล์ auth
  - การใช้งาน JSON จะถอยกลับไปใช้ `stats`; `stats.cached` จะถูกปรับให้เป็น
    `cacheRead`
- **OpenAI Codex**: token OAuth ในโปรไฟล์ auth (ใช้ accountId เมื่อมี)
- **MiniMax**: คีย์ API หรือโปรไฟล์ auth MiniMax OAuth OpenClaw ถือว่า
  `minimax`, `minimax-cn`, และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน
  เลือก MiniMax OAuth ที่จัดเก็บไว้เมื่อมี และมิฉะนั้นจะถอยกลับไปใช้
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, หรือ `MINIMAX_API_KEY`
  การโพลการใช้งานอนุมานโฮสต์ Coding Plan จาก `models.providers.minimax-portal.baseUrl`
  หรือ `models.providers.minimax.baseUrl` เมื่อกำหนดค่าไว้ และมิฉะนั้นจะใช้
  โฮสต์ MiniMax CN
  ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควตา **ที่เหลืออยู่**
  ดังนั้น OpenClaw จะกลับค่าก่อนแสดงผล ฟิลด์แบบอิงจำนวนจะชนะเมื่อมี
  - ป้ายชื่อกรอบเวลา coding-plan มาจากฟิลด์ชั่วโมง/นาทีของผู้ให้บริการเมื่อมี
    จากนั้นจึงถอยกลับไปใช้ช่วง `start_time` / `end_time`
  - หากเอนด์พอยต์ coding-plan ส่งคืน `model_remains` OpenClaw จะเลือกใช้รายการ
    chat-model อนุมานป้ายชื่อกรอบเวลาจาก timestamp เมื่อไม่มีฟิลด์
    `window_hours` / `window_minutes` ที่ระบุชัดเจน และรวมชื่อโมเดลไว้ในป้ายชื่อแผน
- **Xiaomi MiMo**: คีย์ API ผ่าน env/config/auth store (`XIAOMI_API_KEY`)
- **z.ai**: คีย์ API ผ่าน env/config/auth store

การใช้งานจะถูกซ่อนไว้เมื่อไม่สามารถ resolve auth การใช้งานของผู้ให้บริการที่ใช้ได้ ผู้ให้บริการ
สามารถให้ลอจิก auth การใช้งานเฉพาะ Plugin ได้ มิฉะนั้น OpenClaw จะถอยกลับไป
จับคู่ข้อมูลรับรอง OAuth/คีย์ API จากโปรไฟล์ auth, environment variables,
หรือ config

## ที่เกี่ยวข้อง

- [การใช้ token และค่าใช้จ่าย](/th/reference/token-use)
- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
- [การแคช prompt](/th/reference/prompt-caching)
