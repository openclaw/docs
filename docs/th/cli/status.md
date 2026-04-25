---
read_when:
    - คุณต้องการการวินิจฉัยอย่างรวดเร็วเกี่ยวกับสุขภาพของช่องทาง + ผู้รับเซสชันล่าสุด
    - คุณต้องการสถานะ “all” ที่คัดลอกไปวางได้สำหรับการดีบัก
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw status` (การวินิจฉัย, probes, snapshots การใช้งาน)
title: สถานะ
x-i18n:
    generated_at: "2026-04-25T13:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

การวินิจฉัยสำหรับช่องทาง + เซสชัน

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

หมายเหตุ:

- `--deep` จะรัน live probes (WhatsApp Web + Telegram + Discord + Slack + Signal)
- `--usage` จะแสดงหน้าต่างการใช้งานของผู้ให้บริการที่ทำให้เป็นมาตรฐานแล้วในรูปแบบ `X% left`
- เอาต์พุตสถานะเซสชันแยก `Execution:` ออกจาก `Runtime:` `Execution` คือพาธของ sandbox (`direct`, `docker/*`) ส่วน `Runtime` จะบอกคุณว่าเซสชันกำลังใช้ `OpenClaw Pi Default`, `OpenAI Codex`, backend แบบ CLI หรือ backend แบบ ACP เช่น `codex (acp/acpx)` ดู [Agent runtimes](/th/concepts/agent-runtimes) สำหรับความแตกต่างระหว่าง provider/model/runtime
- ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax คือโควตาที่เหลืออยู่ ดังนั้น OpenClaw จะกลับค่าก่อนแสดงผล; หากมีฟิลด์แบบนับจำนวน ระบบจะใช้ฟิลด์เหล่านั้นก่อน การตอบกลับ `model_remains` จะเลือกใช้รายการ chat-model, อนุมานป้ายกำกับหน้าต่างจาก timestamps เมื่อจำเป็น และรวมชื่อโมเดลไว้ในป้ายกำกับแผน
- เมื่อ snapshot ของเซสชันปัจจุบันมีข้อมูลน้อย `/status` สามารถเติมตัวนับโทเค็นและแคชกลับจาก usage log ของ transcript ล่าสุดได้ หากมีค่าจริงแบบ live ที่ไม่เป็นศูนย์อยู่แล้ว ค่าดังกล่าวจะมีความสำคัญกว่าค่าที่เติมกลับจาก transcript
- การเติมกลับจาก transcript ยังสามารถกู้คืนป้ายชื่อโมเดล runtime ที่กำลังใช้งานอยู่ได้เมื่อรายการเซสชันแบบ live ไม่มีข้อมูลนี้ หากโมเดลจาก transcript นั้นแตกต่างจากโมเดลที่เลือกไว้ status จะ resolve context window เทียบกับโมเดล runtime ที่กู้คืนมา แทนที่จะใช้โมเดลที่เลือกไว้
- สำหรับการคำนวณขนาด prompt การเติมกลับจาก transcript จะเลือกยอดรวมที่เน้น prompt และมีค่ามากกว่าเมื่อ metadata ของเซสชันหายไปหรือมีค่าน้อยกว่า เพื่อไม่ให้เซสชันของ custom-provider แสดงโทเค็นเป็น `0`
- เอาต์พุตรวม session stores แยกตาม agent เมื่อมีการกำหนดค่าหลาย agent
- ภาพรวมรวมสถานะการติดตั้ง/การทำงานของ Gateway + node host service เมื่อมีข้อมูล
- ภาพรวมรวม update channel + git SHA (สำหรับ source checkouts)
- ข้อมูลการอัปเดตจะแสดงใน Overview; หากมีอัปเดต available สถานะจะแสดงคำแนะนำให้รัน `openclaw update` (ดู [Updating](/th/install/updating))
- พื้นผิวสถานะแบบอ่านอย่างเดียว (`status`, `status --json`, `status --all`) จะ resolve SecretRefs ที่รองรับสำหรับพาธ config เป้าหมายเมื่อเป็นไปได้
- หากมีการกำหนดค่า SecretRef ของช่องทางที่รองรับไว้ แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน status จะยังคงเป็นแบบอ่านอย่างเดียว และรายงานเอาต์พุตแบบ degraded แทนที่จะล้มเหลว เอาต์พุตสำหรับมนุษย์จะมีคำเตือน เช่น “configured token unavailable in this command path” และเอาต์พุต JSON จะมี `secretDiagnostics`
- เมื่อการ resolve SecretRef ในระดับคำสั่งสำเร็จ status จะเลือกใช้ snapshot ที่ resolve แล้ว และล้างตัวทำเครื่องหมายช่องทาง “secret unavailable” แบบชั่วคราวออกจากเอาต์พุตสุดท้าย
- `status --all` จะรวมแถวภาพรวมของ Secrets และส่วนการวินิจฉัยที่สรุป secret diagnostics (ตัดให้สั้นเพื่อให้อ่านง่าย) โดยไม่หยุดการสร้างรายงาน

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Doctor](/th/gateway/doctor)
