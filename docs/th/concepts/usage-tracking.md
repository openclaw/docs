---
read_when:
    - คุณกำลังเชื่อมต่อพื้นผิวการใช้งาน/โควตาของผู้ให้บริการ
    - คุณต้องอธิบายพฤติกรรมการติดตามการใช้งานหรือข้อกำหนดด้านการยืนยันตัวตน
summary: ส่วนติดต่อการติดตามการใช้งานและข้อกำหนดด้านข้อมูลประจำตัว
title: การติดตามการใช้งาน
x-i18n:
    generated_at: "2026-06-27T17:30:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## คืออะไร

- ดึงการใช้งาน/โควตาของผู้ให้บริการโดยตรงจาก usage endpoints ของผู้ให้บริการนั้น
- ไม่มีค่าใช้จ่ายโดยประมาณ มีเฉพาะช่วงเวลาโควตาที่ผู้ให้บริการรายงาน หรือสรุปสถานะบัญชี
- เอาต์พุตสถานะช่วงเวลาโควตาที่มนุษย์อ่านได้จะถูกทำให้เป็นรูปแบบเดียวกันเป็น `X% left` แม้เมื่อ API ต้นทางรายงานโควตาที่ใช้ไป โควตาที่เหลือ หรือมีเพียงจำนวนดิบ ผู้ให้บริการที่ไม่มีช่วงเวลาโควตาแบบรีเซ็ตได้สามารถแสดงข้อความสรุปจากผู้ให้บริการแทนได้ เช่น ยอดคงเหลือ
- `/status` ระดับเซสชันและ `session_status` สามารถ fallback ไปยังรายการการใช้งานล่าสุดใน transcript ได้เมื่อสแนปช็อตเซสชันสดมีข้อมูลน้อย fallback นั้นเติมตัวนับ token/cache ที่ขาดหาย สามารถกู้คืนป้ายกำกับโมเดล runtime ที่ใช้งานอยู่ และเลือกผลรวมแบบเน้นพรอมป์ต์ที่มีค่ามากกว่าเมื่อ metadata ของเซสชันขาดหายหรือมีค่าน้อยกว่า ค่าสดที่ไม่เป็นศูนย์ที่มีอยู่ยังคงชนะ

## แสดงที่ไหน

- `/status` ในแชต: การ์ดสถานะที่มีอีโมจิมาก พร้อม token ของเซสชัน + ค่าใช้จ่ายโดยประมาณ (เฉพาะ API key) การใช้งานของผู้ให้บริการจะแสดงสำหรับ **ผู้ให้บริการโมเดลปัจจุบัน** เมื่อมีข้อมูล เป็นช่วงเวลา `X% left` ที่ปรับรูปแบบแล้ว หรือข้อความสรุปจากผู้ให้บริการ
- `/usage off|tokens|full` ในแชต: ส่วนท้ายการใช้งานต่อการตอบกลับ (OAuth แสดงเฉพาะ token)
- `/usage cost` ในแชต: สรุปค่าใช้จ่ายภายในเครื่องที่รวบรวมจากบันทึกเซสชัน OpenClaw
- CLI: `openclaw status --usage` พิมพ์รายละเอียดแบบเต็มรายผู้ให้บริการ
- CLI: `openclaw channels list` พิมพ์สแนปช็อตการใช้งานเดียวกันควบคู่กับการกำหนดค่าผู้ให้บริการ (ใช้ `--no-usage` เพื่อข้าม)
- แถบเมนู macOS: ส่วน "การใช้งาน" ใต้ Context (เฉพาะเมื่อมีข้อมูล)

## โหมดส่วนท้ายการใช้งานเริ่มต้น

`/usage off|tokens|full` ตั้งค่าส่วนท้ายสำหรับเซสชันและจะจดจำไว้สำหรับเซสชันนั้น `messages.responseUsage` ใช้เป็นค่าเริ่มต้นของโหมดนั้นสำหรับเซสชันที่ยังไม่ได้เลือก เพื่อให้ส่วนท้ายเปิดอยู่โดยค่าเริ่มต้นได้โดยไม่ต้องพิมพ์ `/usage` ทุกครั้ง

ตั้งค่าโหมดเดียวสำหรับทุกช่องทาง หรือแผนที่รายช่องทางพร้อม fallback `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### สถานะเซสชันที่แตกต่างกันสามแบบ

ฟิลด์ `responseUsage` ของเซสชันมีสถานะที่แทนค่าได้สามแบบ โดยแต่ละแบบมีความหมายต่างกัน:

| สถานะ | ค่าที่จัดเก็บ | โหมดที่มีผล |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **ยังไม่ได้ตั้ง / สืบทอด** | `undefined` (ไม่มีอยู่) | ไหลต่อไปยังค่าเริ่มต้น config `messages.responseUsage` แล้วจึงเป็น `off` |
| **ปิดโดยชัดเจน** | `"off"` (จัดเก็บไว้) | ปิดเสมอ — ค่าเริ่มต้น config ที่ไม่ใช่ off ไม่สามารถเปิดส่วนท้ายกลับมาได้ |
| **เปิดโดยชัดเจน** | `"tokens"` หรือ `"full"` (จัดเก็บไว้) | โหมดนั้น โดยไม่ขึ้นกับค่าเริ่มต้น config |

### ลำดับความสำคัญ

โหมดที่มีผล = การ override ของเซสชัน → รายการ config ของช่องทาง → `default` → `off`

`/usage off` ที่ชัดเจนจะถูก **persist** เป็นค่าตรงตัว `"off"` ในเซสชัน ไม่ใช่เหมือนกับ "unset" ซึ่งหมายความว่าค่าเริ่มต้น `messages.responseUsage` ที่ไม่ใช่ off ไม่สามารถเปิดส่วนท้ายกลับมาได้หลังจากผู้ใช้ปิดไว้อย่างชัดเจนแล้ว

### รีเซ็ตเทียบกับปิด

- `/usage off` — บังคับปิดส่วนท้ายและ persist ตัวเลือกนั้น ค่าเริ่มต้นที่กำหนดค่าไว้ซึ่งไม่ใช่ off ไม่สามารถ override ได้
- `/usage reset` (นามแฝง: `inherit`, `clear`, `default`) — ล้างการ override ของเซสชัน จากนั้นเซสชันจะ **สืบทอด** ค่าเริ่มต้น config ที่มีผล (`messages.responseUsage`) หากไม่ได้กำหนดค่าเริ่มต้นไว้ ส่วนท้ายจะปิด (ไม่เปลี่ยนจากเดิม) ใช้สิ่งนี้เพื่อ "กลับไปใช้ค่าเริ่มต้น" โดยไม่เปิดส่วนท้ายอย่างชัดเจน
- การรีเซ็ตเซสชันแบบเต็ม (`/reset` หรือ `/new`) หรือการ rollover เซสชันจะ **รักษา** ค่ากำหนดโหมดการใช้งานที่ตั้งไว้อย่างชัดเจน เพื่อให้ตัวเลือกการแสดงผลของผู้ใช้คงอยู่หลังการ rollover เซสชัน มีเพียง `/usage reset` (และนามแฝงของมัน) เท่านั้นที่ล้างการ override จริง

### พฤติกรรมการสลับ

`/usage` ที่ไม่มีอาร์กิวเมนต์จะวน: off → tokens → full → off จุดเริ่มต้นของวงรอบคือโหมดปัจจุบันที่ **มีผล** (การ override ของเซสชันที่ไหลต่อไปยังค่าเริ่มต้น config เมื่อยังไม่ได้ตั้ง) ดังนั้นวงรอบจึงสอดคล้องกับสิ่งที่ผู้ใช้เห็นในส่วนท้ายเสมอ

### Config

เมื่อไม่มี config พฤติกรรมเดิมยังคงอยู่ (ส่วนท้ายปิดจนกว่าจะใช้ `/usage`) ใช้ `/usage reset` เพื่อล้างการ override ของเซสชันและกลับไปสืบทอดค่าเริ่มต้นที่กำหนดค่าไว้

## ส่วนท้าย `/usage full` แบบกำหนดเอง

`/usage full` แสดงส่วนท้ายขนาดกะทัดรัดในตัวที่มีโมเดล reasoning, fast/slow, context window, token ของ turn, cache และค่าใช้จ่ายเมื่อมีฟิลด์เหล่านั้น ไม่ต้องใช้ไฟล์เทมเพลต

`messages.usageTemplate` มีไว้สำหรับเลย์เอาต์แบบกำหนดเองขั้นสูงเท่านั้น ค่าคือ path ไฟล์ JSON (รองรับ `~`) หรือ object แบบ inline และจะแทนที่ส่วนท้ายในตัวเมื่อถูกต้อง:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

เทมเพลตที่ขาดหายหรือว่างเปล่าจะ fallback ไปยังส่วนท้ายในตัวแบบเงียบ ๆ เทมเพลตที่กำหนดค่าไว้ซึ่งอ่านไม่ได้หรือไม่ถูกต้องก็จะ fallback ไปยังส่วนท้ายในตัวเช่นกัน และ emit คำเตือนสำหรับ operator

เริ่มเทมเพลตแบบกำหนดเองจาก shape ในตัว แล้วแก้ไขส่วนที่ต้องการเปลี่ยน:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Shape

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

แต่ละ surface คือรายการ **ชิ้นส่วน** ที่เรียงลำดับ engine จะ render แต่ละรายการ ทิ้งรายการว่าง และเชื่อมรายการที่เหลือด้วย `sep` surface ที่ไม่มีรายการจะใช้ `output.default`

### Contract Paths

ชิ้นส่วนอ่านค่าจาก contract ราย turn ด้วย dot-path ค่าที่ไม่มีอยู่จะว่างเปล่า (ดังนั้น guard `when` หรือ `|fallback` จะทำให้ชิ้นส่วนนั้นสะอาด)

| Path | ความหมาย |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface` | id ช่องทาง (`discord`/`telegram`/etc.) |
| `model.provider` / `model.display_name` | id ผู้ให้บริการ / id โมเดล |
| `model.reasoning` | effort (`off` ถึง `xhigh`) |
| `model.is_fallback` / `model.is_override` | bool: ใช้ fallback / ปักหมุดโมเดล |
| `state.fast_mode` | bool: fast เทียบกับ slow |
| `context.max_tokens` / `context.pct_used` | งบประมาณ window / ใช้แล้ว 0-100 |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens` | ผลรวมของ turn |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct` | guard การแสดง token และเปอร์เซ็นต์ cache |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | เฉพาะการเรียกโมเดลสุดท้าย |
| `cost.turn_usd` | ค่าใช้จ่ายของ turn โดยประมาณ |
| `identity.name` / `identity.emoji` | ชื่อ agent / อีโมจิที่เลือก |

(window rate-limit ของผู้ให้บริการ **ไม่** อยู่ใน contract นี้)

### Verbs

ส่งค่าผ่าน verbs จากซ้ายไปขวา segment ที่ไม่ใช่ verb คือ fallback

| Verb | ผลลัพธ์ | ตัวอย่าง |
| --------------- | ------------------------------------- | --------------------------------- |
| `num` | จำนวนแบบกะทัดรัด | `272000 -> 272k` |
| `fixed:N` | ทศนิยม N ตำแหน่ง (ค่าเริ่มต้น 2) | `0.0377` |
| `dur` | วินาทีเป็นระยะเวลา | `14820 -> 4h07m` |
| `pct` | เติม `%` ต่อท้าย | `96 -> 96%` |
| `inv` | `100 - x` | สำหรับใช้แล้วเป็นคงเหลือ |
| `alias:TABLE` | lookup ใน `aliases`, echo หากไม่มีในรายการ | `medium -> 🌗` |
| `meter:W:SCALE` | แถบ glyph กว้าง W ช่องบนค่า 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = หนึ่ง glyph) |

### รูปแบบชิ้นส่วน

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolation
- `{ "when": "<path>", "text": "..." }`: render เฉพาะเมื่อ path เป็น truthy
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: ค่าเป็น glyph
- `{ "each": "limits.windows", "item": "{label}" }`: วนซ้ำ array

### ตัวอย่าง

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

แสดงผล เช่น `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`

## ผู้ให้บริการ + ข้อมูลประจำตัว

- **Anthropic (Claude)**: โทเค็น OAuth ในโปรไฟล์การยืนยันตัวตน
- **GitHub Copilot**: โทเค็น OAuth ในโปรไฟล์การยืนยันตัวตน
- **Gemini CLI**: โทเค็น OAuth ในโปรไฟล์การยืนยันตัวตน
  - การใช้งาน JSON จะถอยกลับไปใช้ `stats`; `stats.cached` จะถูกปรับให้เป็น
    `cacheRead`
- **OpenAI Codex**: โทเค็น OAuth ในโปรไฟล์การยืนยันตัวตน (ใช้ accountId เมื่อมี)
- **MiniMax**: คีย์ API หรือโปรไฟล์การยืนยันตัวตน OAuth ของ MiniMax OpenClaw ถือว่า
  `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน
  จะเลือกใช้ OAuth ของ MiniMax ที่จัดเก็บไว้เมื่อมี และหากไม่มีจะถอยกลับไปใช้
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` หรือ `MINIMAX_API_KEY`
  การสำรวจการใช้งานจะอนุมานโฮสต์ของแผนการเขียนโค้ดจาก `models.providers.minimax-portal.baseUrl`
  หรือ `models.providers.minimax.baseUrl` เมื่อกำหนดค่าไว้ มิฉะนั้นจะใช้
  โฮสต์ MiniMax CN
  ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควตาที่
  **เหลืออยู่** ดังนั้น OpenClaw จึงกลับค่าก่อนแสดงผล; ฟิลด์แบบนับจำนวนจะมีลำดับความสำคัญเมื่อมี
  - ป้ายกำกับช่วงเวลาของแผนการเขียนโค้ดมาจากฟิลด์ชั่วโมง/นาทีของผู้ให้บริการเมื่อมี
    จากนั้นจึงถอยกลับไปใช้ช่วง `start_time` / `end_time`
  - หากเอนด์พอยต์ของแผนการเขียนโค้ดส่งคืน `model_remains` OpenClaw จะเลือก
    รายการโมเดลแชตก่อน อนุมานป้ายกำกับช่วงเวลาจากการประทับเวลาเมื่อไม่มีฟิลด์
    `window_hours` / `window_minutes` แบบชัดเจน และรวมชื่อโมเดลไว้ในป้ายกำกับแผน
- **Xiaomi MiMo**: คีย์ API ผ่าน env/config/auth store (`XIAOMI_API_KEY`)
- **z.ai**: คีย์ API ผ่าน env/config/auth store
- **DeepSeek**: คีย์ API ผ่าน env/config/auth store (`DEEPSEEK_API_KEY`)
  OpenClaw เรียกเอนด์พอยต์ยอดคงเหลือของ DeepSeek และแสดงยอดคงเหลือที่ผู้ให้บริการรายงาน
  เป็นข้อความแทนหน้าต่างโควตาเปอร์เซ็นต์ที่เหลือ

การใช้งานจะถูกซ่อนเมื่อไม่สามารถระบุข้อมูลยืนยันตัวตนสำหรับการใช้งานของผู้ให้บริการที่ใช้งานได้ ผู้ให้บริการ
สามารถระบุตรรกะข้อมูลยืนยันตัวตนการใช้งานเฉพาะ Plugin ได้; มิฉะนั้น OpenClaw จะถอยกลับไปใช้
ข้อมูลประจำตัว OAuth/คีย์ API ที่ตรงกันจากโปรไฟล์การยืนยันตัวตน ตัวแปรสภาพแวดล้อม
หรือการกำหนดค่า

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
- [การแคชพรอมป์](/th/reference/prompt-caching)
