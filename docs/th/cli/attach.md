---
read_when:
    - คุณต้องการให้ Claude Code ใช้เครื่องมือ MCP ของ OpenClaw Gateway
    - คุณต้องมีสิทธิ์อนุญาต MCP ชั่วคราวที่ผูกกับเซสชันสำหรับชุดทดสอบภายนอก
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw attach` (เปิดใช้ Claude Code พร้อมสิทธิ์อนุญาต Gateway MCP ที่จำกัดขอบเขต)
title: แนบ CLI
x-i18n:
    generated_at: "2026-07-12T15:59:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` เปิด Claude Code ด้วยการกำหนดค่า MCP ชั่วคราวแบบเข้มงวดซึ่งผูกกับเซสชัน Gateway หนึ่งเซสชัน

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

ตัวเลือก:

- `--session <key>` ผูกสิทธิ์อนุญาตกับเซสชัน Gateway โดยมีค่าเริ่มต้นเป็นเซสชันหลัก
- `--ttl <ms>` ร้องขอ TTL ของสิทธิ์อนุญาตที่เป็นค่าบวกในหน่วยมิลลิวินาที โดย Gateway จะใช้เพดานที่กำหนดไว้เอง
- `--bin <path>` เลือกไฟล์ไบนารี Claude Code ค่าเริ่มต้น: `claude`
- `--print-config` เขียนไฟล์ `.mcp.json` ชั่วคราว แสดงคำสั่งเปิดใช้งานและตัวแปรสภาพแวดล้อม และคงสิทธิ์อนุญาตไว้จนกว่า TTL จะหมดอายุ (ตัวเลือกนี้จะไม่เปิดกระบวนการ Claude Code หรือเพิกถอนสิทธิ์อนุญาต)

โทเค็นแบบ bearer จะถูกส่งผ่านตัวแปรสภาพแวดล้อม ไม่ใช่ argv OpenClaw เปิด Claude Code ด้วย `--strict-mcp-config --mcp-config <path>` เพื่อไม่ให้เซิร์ฟเวอร์ Claude MCP ที่มีอยู่ในสภาพแวดล้อมเข้าร่วมเซสชันที่แนบ การเปิดใช้งานตามปกติ (โดยไม่มี `--print-config`) จะเพิกถอนสิทธิ์อนุญาตเมื่อกระบวนการ Claude Code สิ้นสุดลง

ดูเพิ่มเติม: [CLI ของ Gateway](/th/cli/gateway), [CLI ของ MCP](/th/cli/mcp) และ [CLI ของ ACP](/th/cli/acp)
