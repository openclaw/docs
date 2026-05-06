---
read_when:
    - คุณกำลังเชื่อมต่อส่วนต่าง ๆ สำหรับการใช้งาน/โควตาของผู้ให้บริการ
    - คุณต้องอธิบายพฤติกรรมการติดตามการใช้งานหรือข้อกำหนดด้านการยืนยันตัวตน
summary: ส่วนแสดงการติดตามการใช้งานและข้อกำหนดด้านข้อมูลประจำตัว
title: การติดตามการใช้งาน
x-i18n:
    generated_at: "2026-05-06T09:11:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## คืออะไร

- ดึงข้อมูลการใช้งาน/โควตาของผู้ให้บริการโดยตรงจาก endpoint การใช้งานของผู้ให้บริการนั้น ๆ
- ไม่มีต้นทุนโดยประมาณ; มีเฉพาะช่วงเวลาที่ผู้ให้บริการรายงานเท่านั้น
- เอาต์พุตสถานะที่มนุษย์อ่านได้จะถูกทำให้เป็นรูปแบบปกติเป็น `เหลือ X%` แม้เมื่อ
  API ต้นทางรายงานโควตาที่ใช้ไปแล้ว โควตาที่เหลืออยู่ หรือเฉพาะจำนวนดิบเท่านั้น
- `/status` ระดับเซสชันและ `session_status` สามารถ fallback ไปยังรายการการใช้งานล่าสุด
  ใน transcript ได้เมื่อ snapshot ของเซสชันสดมีข้อมูลน้อย fallback นั้นจะเติมตัวนับ token/cache ที่ขาดไป
  สามารถกู้คืนป้ายกำกับโมเดล runtime ที่ใช้งานอยู่ได้ และจะเลือกผลรวมที่เน้น prompt ซึ่งมากกว่าเมื่อ metadata
  ของเซสชันขาดหายไปหรือน้อยกว่า ค่าสดที่ไม่ใช่ศูนย์ซึ่งมีอยู่แล้วยังคงมีสิทธิ์เหนือกว่า

## แสดงที่ไหน

- `/status` ในแชต: การ์ดสถานะที่มี emoji จำนวนมากพร้อม token ของเซสชัน + ต้นทุนโดยประมาณ (เฉพาะคีย์ API) การใช้งานของผู้ให้บริการจะแสดงสำหรับ **ผู้ให้บริการโมเดลปัจจุบัน** เมื่อมีข้อมูล ในรูปแบบหน้าต่าง `เหลือ X%` ที่ถูกทำให้เป็นรูปแบบปกติแล้ว
- `/usage off|tokens|full` ในแชต: ส่วนท้ายการใช้งานต่อคำตอบ (OAuth แสดงเฉพาะ token)
- `/usage cost` ในแชต: สรุปต้นทุนในเครื่องที่รวมจากบันทึกเซสชัน OpenClaw
- CLI: `openclaw status --usage` พิมพ์รายละเอียดแยกตามผู้ให้บริการแบบครบถ้วน
- CLI: `openclaw channels list` พิมพ์ snapshot การใช้งานเดียวกันพร้อมกับ config ของผู้ให้บริการ (ใช้ `--no-usage` เพื่อข้าม)
- แถบเมนู macOS: ส่วน “การใช้งาน” ภายใต้บริบท (เฉพาะเมื่อมีข้อมูล)

## ผู้ให้บริการ + credentials

- **Anthropic (Claude)**: OAuth token ใน auth profiles
- **GitHub Copilot**: OAuth token ใน auth profiles
- **Gemini CLI**: OAuth token ใน auth profiles
  - การใช้งาน JSON fallback ไปที่ `stats`; `stats.cached` จะถูกทำให้เป็นรูปแบบปกติเป็น
    `cacheRead`
- **OpenAI Codex**: OAuth token ใน auth profiles (ใช้ accountId เมื่อมี)
- **MiniMax**: คีย์ API หรือ auth profile OAuth ของ MiniMax OpenClaw ถือว่า
  `minimax`, `minimax-cn`, และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน
  จะเลือก OAuth ของ MiniMax ที่จัดเก็บไว้ก่อนเมื่อมี และมิฉะนั้นจะ fallback
  ไปที่ `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, หรือ `MINIMAX_API_KEY`
  การ polling การใช้งานจะหา host ของ Coding Plan จาก `models.providers.minimax-portal.baseUrl`
  หรือ `models.providers.minimax.baseUrl` เมื่อกำหนดค่าไว้ และมิฉะนั้นจะใช้
  host MiniMax CN
  ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควตาที่ **เหลืออยู่**
  ดังนั้น OpenClaw จะกลับค่าก่อนแสดงผล; ฟิลด์ที่อิงจำนวนมีสิทธิ์เหนือกว่าเมื่อมี
  - ป้ายกำกับหน้าต่างของ coding-plan มาจากฟิลด์ชั่วโมง/นาทีของผู้ให้บริการเมื่อมี
    จากนั้น fallback ไปที่ช่วง `start_time` / `end_time`
  - หาก endpoint ของ coding-plan ส่งคืน `model_remains` OpenClaw จะเลือก
    รายการโมเดลแชตก่อน หา label ของหน้าต่างจาก timestamp เมื่อไม่มีฟิลด์
    `window_hours` / `window_minutes` ที่ระบุชัดเจน และรวมชื่อโมเดลไว้ใน label ของแผน
- **Xiaomi MiMo**: คีย์ API ผ่าน env/config/auth store (`XIAOMI_API_KEY`)
- **z.ai**: คีย์ API ผ่าน env/config/auth store

การใช้งานจะถูกซ่อนเมื่อไม่สามารถ resolve auth สำหรับการใช้งานของผู้ให้บริการที่ใช้ได้ ผู้ให้บริการ
สามารถระบุ logic auth การใช้งานเฉพาะ Plugin ได้; มิฉะนั้น OpenClaw จะ fallback ไปยัง
credential แบบ OAuth/API-key ที่ตรงกันจาก auth profiles, environment variables,
หรือ config

## ที่เกี่ยวข้อง

- [การใช้ token และต้นทุน](/th/reference/token-use)
- [การใช้งาน API และต้นทุน](/th/reference/api-usage-costs)
- [การแคช prompt](/th/reference/prompt-caching)
