---
read_when:
    - คุณต้องการให้ Claude Code ใช้เครื่องมือ MCP ของ OpenClaw Gateway
    - คุณต้องมีสิทธิ์อนุญาต MCP ชั่วคราวที่ผูกกับเซสชันสำหรับ harness ภายนอก
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw attach` (เปิดใช้ Claude Code ด้วยสิทธิ์อนุญาต MCP ของ Gateway แบบจำกัดขอบเขต)
title: แนบ CLI
x-i18n:
    generated_at: "2026-07-02T01:20:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` เปิด Claude Code ด้วยการกำหนดค่า MCP ชั่วคราวที่เข้มงวดซึ่งผูกกับ
หนึ่งเซสชันของ Gateway

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

ตัวเลือก:

- `--session <key>` ผูกสิทธิ์อนุญาตกับเซสชันของ Gateway ค่าเริ่มต้นคือเซสชันหลัก
- `--ttl <ms>` ขอ TTL ของสิทธิ์อนุญาตที่เป็นค่าบวกในหน่วยมิลลิวินาที Gateway จะใช้เพดานของตัวเอง
- `--bin <path>` เลือกไบนารี Claude Code ค่าเริ่มต้นคือ `claude`
- `--print-config` เขียน `.mcp.json` ชั่วคราว พิมพ์คำสั่งเปิดใช้งานและ env และปล่อยให้สิทธิ์อนุญาตยังมีผลจนกว่า TTL จะหมดอายุ

โทเค็น bearer ถูกส่งผ่านตัวแปรสภาพแวดล้อม ไม่ใช่ argv OpenClaw
เปิด Claude Code ด้วย `--strict-mcp-config --mcp-config <path>` เพื่อให้เซิร์ฟเวอร์
Claude MCP ในสภาพแวดล้อมโดยรอบไม่เข้าร่วมเซสชันที่แนบอยู่ การเปิดใช้งานตามปกติจะเพิกถอน
สิทธิ์อนุญาตเมื่อกระบวนการ Claude Code ออก

ดูเพิ่มเติม: [Gateway CLI](/th/cli/gateway), [MCP CLI](/th/cli/mcp), และ [ACP CLI](/th/cli/acp).
