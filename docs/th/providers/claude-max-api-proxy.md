---
read_when:
    - คุณต้องการใช้การสมัครสมาชิก Claude Max กับเครื่องมือที่เข้ากันได้กับ OpenAI
    - คุณต้องการเซิร์ฟเวอร์ API ภายในเครื่องที่ครอบ Claude Code CLI ไว้
    - คุณต้องการประเมินการเข้าถึง Anthropic แบบสมัครสมาชิกเทียบกับแบบใช้คีย์ API
summary: พร็อกซีจากชุมชนสำหรับเปิดเผยข้อมูลรับรองการสมัครใช้งาน Claude เป็นเอนด์พอยต์ที่เข้ากันได้กับ OpenAI
title: พร็อกซี API ของ Claude Max
x-i18n:
    generated_at: "2026-07-12T16:38:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** คือแพ็กเกจ npm จากชุมชน (ไม่ใช่ Plugin ของ OpenClaw) ที่เปิดให้ใช้การสมัครสมาชิก Claude Max/Pro เป็นปลายทาง API ที่เข้ากันได้กับ OpenAI เพื่อให้คุณเชื่อมต่อเครื่องมือใดๆ ที่เข้ากันได้กับ OpenAI เข้ากับการสมัครสมาชิกของคุณแทนการใช้คีย์ API ของ Anthropic

<Warning>
รองรับเฉพาะในทางเทคนิคเท่านั้น ไม่ใช่วิธีที่ได้รับการรับรองอย่างเป็นทางการ Anthropic เคยบล็อกการใช้การสมัครสมาชิกบางรูปแบบนอก Claude Code มาก่อน โปรดตรวจสอบกฎการเรียกเก็บเงินปัจจุบันของ Anthropic ก่อนพึ่งพาวิธีนี้

เอกสาร Claude Code ของ Anthropic อธิบายว่า `claude -p` เป็นการใช้งาน Agent SDK/แบบโปรแกรม ตั้งแต่การอัปเดตฝ่ายสนับสนุนของ Anthropic เมื่อวันที่ 15 มิถุนายน 2026 เป็นต้นมา การใช้งาน Claude Agent SDK, `claude -p` และแอปของบุคคลที่สามจะหักจากขีดจำกัดการใช้งานของการสมัครสมาชิกที่ลงชื่อเข้าใช้อยู่ (แผนเครดิต Agent SDK แยกต่างหากที่เคยประกาศไว้ถูกระงับแล้ว) โปรดดู[บทความเกี่ยวกับแผน Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) ของ Anthropic, บทความเกี่ยวกับแผน [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) และ [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) รวมถึง[ผู้ให้บริการ Anthropic](/th/providers/anthropic) สำหรับหมายเหตุของ OpenClaw เกี่ยวกับการเรียกเก็บเงินของ Claude CLI
</Warning>

## เหตุผลที่ควรใช้

| วิธีการ                    | ช่องทางค่าใช้จ่าย                                      | เหมาะที่สุดสำหรับ                                      |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| คีย์ API ของ Anthropic         | ชำระเงินตามจำนวนโทเค็นผ่าน Claude Console            | แอปใช้งานจริง ระบบอัตโนมัติที่ใช้ร่วมกัน ปริมาณงานสูง |
| พร็อกซีการสมัครสมาชิก Claude | กฎของแผนและเครดิตสำหรับ Claude Code / `claude -p` | การทดลองส่วนตัวด้วยเครื่องมือที่เข้ากันได้ |

พร็อกซีนี้ช่วยให้การสมัครสมาชิก Claude Max หรือ Pro ทำงานร่วมกับเครื่องมือที่เข้ากันได้กับ OpenAI ได้ วิธีนี้ไม่ใช่การใช้งานแบบเหมาจ่ายไม่จำกัด แต่จะสืบทอดขีดจำกัดการใช้งานของ Claude Code สำหรับการใช้งานจริง คีย์ API ยังคงเป็นช่องทางการเรียกเก็บเงินที่ชัดเจนกว่า

## วิธีการทำงาน

```text
Your App -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI format)                (converts format)              (uses your login)
```

พร็อกซีจะสร้าง Claude Code CLI เป็นกระบวนการย่อยสำหรับแต่ละคำขอ แปลงคำขอแชตในรูปแบบ OpenAI เป็นพรอมต์ CLI และสตรีม (หรือส่งคืน) การตอบกลับในรูปแบบ OpenAI

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้งพร็อกซี">
    ต้องใช้ Node.js 20 ขึ้นไปและ Claude Code CLI ที่ผ่านการยืนยันตัวตนแล้ว

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
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
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="กำหนดค่า OpenClaw">
    กำหนดให้ OpenClaw ใช้พร็อกซีเป็นปลายทางแบบกำหนดเองที่เข้ากันได้กับ OpenAI:

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

<Note>
รหัสโมเดลด้านล่างเป็นแค็ตตาล็อกของพร็อกซีเอง ไม่ใช่การอ้างอิงโมเดล Anthropic ของ OpenClaw แต่ละรหัสเชื่อมโยงกับนามแฝงโมเดลของ Claude Code CLI (`opus`, `sonnet`, `haiku`) ดังนั้นโมเดลเบื้องหลังจะเปลี่ยนทุกครั้งที่ Anthropic อัปเดตนามแฝงนั้นใน CLI โปรดตรวจสอบ README ปัจจุบันของพร็อกซีก่อนพึ่งพาการเชื่อมโยงใดโดยเฉพาะ
</Note>

| รหัสโมเดล          | นามแฝง CLI | การเชื่อมโยงปัจจุบัน |
| ----------------- | --------- | --------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับพร็อกซีที่เข้ากันได้กับ OpenAI">
    วิธีนี้ใช้เส้นทาง `/v1` แบบกำหนดเองทั่วไปของ OpenClaw ที่เข้ากันได้กับ OpenAI ซึ่งเป็นเส้นทางเดียวกับแบ็กเอนด์แบบโฮสต์เองอื่นๆ ที่เข้ากันได้กับ OpenAI:

    - ไม่มีการปรับรูปแบบคำขอเฉพาะของ OpenAI แบบเนทีฟ
    - `/fast` และ `service_tier` ใช้ได้เฉพาะกับการรับส่งข้อมูลโดยตรงไปยัง `api.anthropic.com` เท่านั้น เส้นทางพร็อกซีจะไม่แก้ไข `service_tier` (ดู[โหมดเร็วของผู้ให้บริการ Anthropic](/th/providers/anthropic#advanced-configuration))
    - ไม่มี `store` ของ Responses, คำแนะนำเกี่ยวกับแคชพรอมต์ หรือการปรับรูปแบบเพย์โหลดสำหรับความเข้ากันได้ด้านการให้เหตุผลของ OpenAI
    - ส่วนหัวการระบุแหล่งที่มาของ OpenAI/Codex ของ OpenClaw (`originator`, `version`, `User-Agent`) จะถูกส่งเฉพาะกับการรับส่งข้อมูล OAuth แบบเนทีฟไปยัง `api.openai.com` เท่านั้น โดยจะไม่ส่งไปยังเป้าหมาย `OPENAI_BASE_URL` แบบกำหนดเอง เช่น พร็อกซีนี้

  </Accordion>

  <Accordion title="เริ่มอัตโนมัติบน macOS ด้วย LaunchAgent">
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

- สืบทอดลักษณะการเรียกเก็บเงิน เครดิตการใช้งาน และขีดจำกัดอัตราของ `claude -p` ใน Claude Code
- ผูกกับ `127.0.0.1` เท่านั้น และไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์ของบุคคลที่สามใดๆ นอกเหนือจากการเรียกไปยัง Anthropic ของ CLI เอง
- รองรับการตอบกลับแบบสตรีม
- ระบบจะไม่ตรวจสอบความล้มเหลวในการยืนยันตัวตนเมื่อเริ่มต้น และจะแสดงข้อผิดพลาดเมื่อมีการเรียกใช้คำขอแชตจริงเท่านั้น หาก CLI ยังไม่ได้ยืนยันตัวตน คำขอแรกจะล้มเหลว แทนที่เซิร์ฟเวอร์จะปฏิเสธการเริ่มทำงาน

<Note>
สำหรับการผสานรวม Anthropic แบบเนทีฟด้วย Claude CLI หรือคีย์ API โปรดดู[ผู้ให้บริการ Anthropic](/th/providers/anthropic) สำหรับการสมัครสมาชิก OpenAI/Codex โปรดดู[ผู้ให้บริการ OpenAI](/th/providers/openai)
</Note>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการ Anthropic" href="/th/providers/anthropic" icon="bolt">
    การผสานรวม OpenClaw แบบเนทีฟด้วย Claude CLI หรือคีย์ API
  </Card>
  <Card title="ผู้ให้บริการ OpenAI" href="/th/providers/openai" icon="robot">
    สำหรับการสมัครสมาชิก OpenAI/Codex
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
</CardGroup>
