---
read_when:
    - คุณต้องการใช้การสมัครสมาชิก Claude Max กับเครื่องมือที่เข้ากันได้กับ OpenAI
    - คุณต้องการเซิร์ฟเวอร์ API ภายในเครื่องที่ครอบ Claude Code CLI
    - คุณต้องการประเมินการเข้าถึง Anthropic แบบสมัครสมาชิกเทียบกับแบบใช้คีย์ API
summary: พร็อกซีชุมชนสำหรับเปิดเผยข้อมูลประจำตัวการสมัครสมาชิก Claude เป็นปลายทางที่เข้ากันได้กับ OpenAI
title: พร็อกซี API ของ Claude Max
x-i18n:
    generated_at: "2026-06-27T18:12:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** เป็นเครื่องมือชุมชนที่เปิดเผยการสมัครสมาชิก Claude Max/Pro ของคุณเป็นปลายทาง API ที่เข้ากันได้กับ OpenAI ซึ่งช่วยให้คุณใช้การสมัครสมาชิกกับเครื่องมือใดก็ได้ที่รองรับรูปแบบ OpenAI API

<Warning>
เส้นทางนี้มีไว้เพื่อความเข้ากันได้ทางเทคนิคเท่านั้น Anthropic เคยบล็อกการใช้งานการสมัครสมาชิก
บางส่วนภายนอก Claude Code มาก่อน คุณต้องตัดสินใจเองว่าจะใช้
เส้นทางนี้หรือไม่ และตรวจสอบกฎการเรียกเก็บเงินปัจจุบันของ Anthropic ก่อนพึ่งพาเส้นทางนี้

เอกสารสนับสนุนปัจจุบันของ Anthropic ระบุว่า `claude -p` เป็นการใช้งาน Agent SDK/แบบโปรแกรม
ตั้งแต่วันที่ 15 มิถุนายน 2026 การใช้งาน `claude -p` ในแผนการสมัครสมาชิกจะดึงจากเครดิต
Agent SDK รายเดือนแยกต่างหากก่อน จากนั้นจึงดึงจากเครดิตการใช้งานตามอัตรา API มาตรฐานหาก
เปิดใช้งานเครดิตการใช้งานไว้
</Warning>

## ทำไมจึงใช้สิ่งนี้?

| แนวทาง | เส้นทางค่าใช้จ่าย | เหมาะที่สุดสำหรับ |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API | จ่ายตามโทเค็นผ่าน Claude Console หรือคลาวด์ | แอปโปรดักชัน ระบบอัตโนมัติที่ใช้ร่วมกัน ปริมาณมาก |
| พร็อกซีการสมัครสมาชิก Claude | กฎแผนและเครดิตของ Claude Code / `claude -p` | การทดลองส่วนตัวกับเครื่องมือที่เข้ากันได้ |

หากคุณมีการสมัครสมาชิก Claude Max หรือ Pro และต้องการใช้กับ
เครื่องมือที่เข้ากันได้กับ OpenAI พร็อกซีนี้อาจเหมาะกับเวิร์กโฟลว์ส่วนตัวบางอย่างได้ เส้นทางนี้ไม่ใช่
เส้นทางแบบเหมาจ่ายไม่จำกัด API keys ยังคงเป็นเส้นทางด้านนโยบายและการเรียกเก็บเงินที่ชัดเจนกว่า
สำหรับการใช้งานโปรดักชัน

## วิธีการทำงาน

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

พร็อกซี:

1. รับคำขอรูปแบบ OpenAI ที่ `http://localhost:3456/v1/chat/completions`
2. แปลงคำขอเป็นคำสั่ง Claude Code CLI
3. ส่งคืนการตอบกลับในรูปแบบ OpenAI (รองรับการสตรีม)

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
    ชี้ OpenClaw ไปยังพร็อกซีเป็นปลายทางแบบกำหนดเองที่เข้ากันได้กับ OpenAI:

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

## แคตตาล็อกในตัว

| ID โมเดล | แมปไปยัง |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="หมายเหตุแบบพร็อกซีที่เข้ากันได้กับ OpenAI">
    เส้นทางนี้ใช้เส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI เดียวกับแบ็กเอนด์ `/v1`
    แบบกำหนดเองอื่นๆ:

    - ไม่มีการใช้การจัดรูปคำขอเฉพาะ OpenAI แบบเนทีฟ
    - ไม่มี `service_tier` ไม่มี Responses `store` ไม่มีคำใบ้ prompt-cache และไม่มี
      การจัดรูปเพย์โหลดความเข้ากันได้ด้านการใช้เหตุผลของ OpenAI
    - ไม่มีการแทรกส่วนหัวการระบุที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`)
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

- นี่คือ **เครื่องมือชุมชน** ไม่ได้รับการสนับสนุนอย่างเป็นทางการจาก Anthropic หรือ OpenClaw
- ต้องมีการสมัครสมาชิก Claude Max/Pro ที่ใช้งานอยู่พร้อม Claude Code CLI ที่ยืนยันตัวตนแล้ว
- สืบทอดพฤติกรรมการเรียกเก็บเงิน เครดิตการใช้งาน และขีดจำกัดอัตราของ Claude Code `claude -p`
- พร็อกซีทำงานในเครื่องและไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์ของบุคคลที่สามใดๆ
- รองรับการตอบกลับแบบสตรีมอย่างเต็มรูปแบบ

<Note>
สำหรับการผสานรวม Anthropic แบบเนทีฟกับ Claude CLI หรือ API keys โปรดดู [ผู้ให้บริการ Anthropic](/th/providers/anthropic) สำหรับการสมัครสมาชิก OpenAI/Codex โปรดดู [ผู้ให้บริการ OpenAI](/th/providers/openai)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการ Anthropic" href="/th/providers/anthropic" icon="bolt">
    การผสานรวม OpenClaw แบบเนทีฟกับ Claude CLI หรือ API keys
  </Card>
  <Card title="ผู้ให้บริการ OpenAI" href="/th/providers/openai" icon="robot">
    สำหรับการสมัครสมาชิก OpenAI/Codex
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรมเฟลโอเวอร์
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าแบบครบถ้วน
  </Card>
</CardGroup>
