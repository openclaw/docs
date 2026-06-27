---
summary: วิธีที่ OpenClaw รันรันไทม์เอเจนต์ในตัว ผู้ให้บริการ เซสชัน เครื่องมือ และส่วนขยาย
title: สถาปัตยกรรมรันไทม์ของเอเจนต์
x-i18n:
    generated_at: "2026-06-27T17:08:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw เป็นเจ้าของรันไทม์เอเจนต์ในตัวโดยตรง โค้ดรันไทม์อยู่ภายใต้ `src/agents/`, ตัวช่วยโมเดล/ผู้ให้บริการอยู่ภายใต้ `src/llm/`, และสัญญาที่เปิดให้ Plugin ใช้งานถูกเปิดเผยผ่าน barrel ของ `openclaw/plugin-sdk/*`

## โครงสร้างรันไทม์

- `src/agents/embedded-agent-runner/`: ลูปความพยายามของเอเจนต์ในตัว, อะแดปเตอร์สตรีมผู้ให้บริการ, Compaction, การเลือกโมเดล, และการเชื่อมต่อเซสชัน
- `src/agents/sessions/`: การคงอยู่ของเซสชัน, การโหลด Plugin, การค้นพบทรัพยากร, Skills, พรอมต์, ธีม, และตัวเรนเดอร์เครื่องมือที่รองรับด้วย TUI
- `packages/agent-core/`: คอร์เอเจนต์ที่ใช้ซ้ำได้, ชนิด harness ระดับล่าง, ข้อความ, ตัวช่วย Compaction, เทมเพลตพรอมต์, และสัญญาเครื่องมือ/เซสชัน
- `src/agents/runtime/`: facade ของ OpenClaw สำหรับ `@openclaw/agent-core` พร้อมยูทิลิตีพร็อกซีภายในเครื่อง
- `src/agents/agent-tools*.ts`: นิยามเครื่องมือ, สคีมา, นโยบาย, อะแดปเตอร์ hook ก่อน/หลัง, และการรองรับการแก้ไขโฮสต์ที่ OpenClaw เป็นเจ้าของ
- `src/agents/agent-hooks/`: hook รันไทม์ในตัว เช่น ตัวป้องกัน Compaction และการตัดแต่งบริบท
- `src/llm/`: registry โมเดล/ผู้ให้บริการ, ตัวช่วยทรานสปอร์ต, และการใช้งานสตรีมเฉพาะผู้ให้บริการ

## ขอบเขต

โค้ดคอร์เรียกรันไทม์ในตัวผ่านโมดูล OpenClaw และ barrel ของ SDK ไม่ใช่ผ่านแพ็กเกจเอเจนต์ภายนอกแบบเก่า Plugin ใช้ entrypoint `openclaw/plugin-sdk/*` ที่มีเอกสารกำกับ และไม่ import ส่วนภายในของ `src/**`

`@earendil-works/pi-tui` ยังคงเป็น dependency TUI ภายนอก ใช้เป็นชุดเครื่องมือคอมโพเนนต์เทอร์มินัลโดย TUI ภายในเครื่องและตัวเรนเดอร์เซสชัน; การทำให้เป็นภายในจะเป็นงาน vendoring แยกต่างหาก

## Manifest

แพ็กเกจทรัพยากรประกาศทรัพยากร OpenClaw ใน metadata ของแพ็กเกจ:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

ตัวจัดการแพ็กเกจยังค้นพบไดเรกทอรีตามแบบแผน `extensions/`, `skills/`, `prompts/`, และ `themes/` ด้วย

## การเลือกรันไทม์

id รันไทม์ในตัวเริ่มต้นคือ `openclaw` harness ของ Plugin สามารถลงทะเบียน id รันไทม์เพิ่มเติมได้ `auto` จะเลือก harness ของ Plugin ที่รองรับเมื่อมีอยู่ มิฉะนั้นจะใช้รันไทม์ OpenClaw ในตัว

## ที่เกี่ยวข้อง

- [เวิร์กโฟลว์รันไทม์เอเจนต์ OpenClaw](/th/openclaw-agent-runtime)
- [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)
