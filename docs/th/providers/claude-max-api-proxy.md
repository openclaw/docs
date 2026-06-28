---
read_when:
    - คุณต้องการใช้การสมัครสมาชิก Claude Max กับเครื่องมือที่เข้ากันได้กับ OpenAI
    - คุณต้องการเซิร์ฟเวอร์ API ภายในเครื่องที่ครอบ Claude Code CLI
    - คุณต้องการประเมินการเข้าถึง Anthropic แบบสมัครสมาชิกเทียบกับแบบใช้คีย์ API
summary: พร็อกซีชุมชนสำหรับเปิดเผยข้อมูลประจำตัวการสมัครใช้งาน Claude เป็น endpoint ที่เข้ากันได้กับ OpenAI
title: พร็อกซี API ของ Claude Max
x-i18n:
    generated_at: "2026-06-28T20:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** เป็นเครื่องมือชุมชนที่เปิดให้ใช้การสมัครใช้งาน Claude Max/Pro ของคุณเป็นปลายทาง API ที่เข้ากันได้กับ OpenAI ซึ่งทำให้คุณใช้การสมัครใช้งานกับเครื่องมือใดก็ได้ที่รองรับรูปแบบ OpenAI API

<Warning>
เส้นทางนี้มีไว้เพื่อความเข้ากันได้ทางเทคนิคเท่านั้น Anthropic เคยบล็อกการใช้งานการสมัครใช้งานบางส่วน
นอก Claude Code ในอดีต คุณต้องตัดสินใจเองว่าจะใช้หรือไม่
และตรวจสอบกฎการเรียกเก็บเงินปัจจุบันของ Anthropic ก่อนพึ่งพาเส้นทางนี้

เอกสารสนับสนุนปัจจุบันของ Anthropic ระบุว่า `claude -p` เป็นการใช้งาน Agent SDK/แบบโปรแกรม
อัปเดตฝ่ายสนับสนุนของ Anthropic เมื่อวันที่ 15 มิถุนายน 2026 ได้ระงับแผนเครดิต Agent SDK
แยกต่างหากที่เคยประกาศไว้ สำหรับตอนนี้ Claude Agent SDK, `claude -p` และการใช้งานแอปภายนอก
ยังคงหักจากขีดจำกัดการใช้งานของการสมัครใช้งานที่ลงชื่อเข้าใช้อยู่

ก่อนพึ่งพาเส้นทางนี้ ให้ตรวจสอบ [บทความแผน Agent SDK
ของ Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
รวมถึงบทความสนับสนุน Claude Code สำหรับบัญชี
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
หรือ
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
</Warning>

## ทำไมจึงใช้สิ่งนี้?

| แนวทาง | เส้นทางค่าใช้จ่าย | เหมาะที่สุดสำหรับ |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API | จ่ายต่อโทเคนผ่าน Claude Console หรือคลาวด์ | แอปโปรดักชัน ระบบอัตโนมัติที่ใช้ร่วมกัน ปริมาณงานสูง |
| พร็อกซีการสมัครใช้งาน Claude | กฎแผนและเครดิตของ Claude Code / `claude -p` | การทดลองส่วนตัวกับเครื่องมือที่เข้ากันได้ |

หากคุณมีการสมัครใช้งาน Claude Max หรือ Pro และต้องการใช้กับ
เครื่องมือที่เข้ากันได้กับ OpenAI พร็อกซีนี้อาจเหมาะกับเวิร์กโฟลว์ส่วนตัวบางแบบ
นี่ไม่ใช่เส้นทางแบบเหมาจ่ายไม่จำกัด คีย์ API ยังคงเป็นเส้นทางนโยบายและการเรียกเก็บเงินที่ชัดเจนกว่า
สำหรับการใช้งานโปรดักชัน

## วิธีทำงาน

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

พร็อกซีจะ:

1. รับคำขอรูปแบบ OpenAI ที่ `http://localhost:3456/v1/chat/completions`
2. แปลงคำขอเป็นคำสั่ง Claude Code CLI
3. ส่งคืนคำตอบในรูปแบบ OpenAI (รองรับการสตรีม)

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้งพร็อกซี">
    ต้องใช้ Node.js 22+ และ Claude Code CLI

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="เริ่มเซิร์ฟเวอร์">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="ทดสอบพร็อกซี">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="กำหนดค่า OpenClaw">
    ชี้ OpenClaw ไปที่พร็อกซีเป็นปลายทางแบบกำหนดเองที่เข้ากันได้กับ OpenAI:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## แค็ตตาล็อกในตัว

| ID โมเดล | แมปไปยัง |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="หมายเหตุ OpenAI-compatible แบบพร็อกซี">
    เส้นทางนี้ใช้เส้นทาง OpenAI-compatible แบบพร็อกซีเดียวกับแบ็กเอนด์ `/v1`
    แบบกำหนดเองอื่นๆ:

    - ไม่มีการปรับรูปคำขอแบบเฉพาะ OpenAI ดั้งเดิม
    - ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มีคำใบ้ prompt-cache และไม่มี
      การปรับรูปเพย์โหลดที่เข้ากันได้กับ reasoning ของ OpenAI
    - ไม่ฉีดส่วนหัวการระบุแหล่งที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`)
      บน URL พร็อกซี

  </Accordion>

  <Accordion title="เริ่มอัตโนมัติบน macOS ด้วย LaunchAgent">
    สร้าง LaunchAgent เพื่อเรียกใช้พร็อกซีโดยอัตโนมัติ:

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## หมายเหตุ

- นี่เป็น**เครื่องมือชุมชน** ไม่ได้รับการสนับสนุนอย่างเป็นทางการจาก Anthropic หรือ OpenClaw
- ต้องมีการสมัครใช้งาน Claude Max/Pro ที่ใช้งานอยู่พร้อม Claude Code CLI ที่ยืนยันตัวตนแล้ว
- สืบทอดพฤติกรรมการเรียกเก็บเงิน เครดิตการใช้งาน และขีดจำกัดอัตราของ Claude Code `claude -p`
- พร็อกซีทำงานภายในเครื่องและไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์ภายนอกใดๆ
- รองรับคำตอบแบบสตรีมอย่างเต็มรูปแบบ

<Note>
สำหรับการผสานรวม Anthropic แบบเนทีฟด้วย Claude CLI หรือคีย์ API โปรดดู [ผู้ให้บริการ Anthropic](/th/providers/anthropic) สำหรับการสมัครใช้งาน OpenAI/Codex โปรดดู [ผู้ให้บริการ OpenAI](/th/providers/openai)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการ Anthropic" href="/th/providers/anthropic" icon="bolt">
    การผสานรวม OpenClaw แบบเนทีฟกับ Claude CLI หรือคีย์ API
  </Card>
  <Card title="ผู้ให้บริการ OpenAI" href="/th/providers/openai" icon="robot">
    สำหรับการสมัครใช้งาน OpenAI/Codex
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรมเฟลโอเวอร์
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
</CardGroup>
