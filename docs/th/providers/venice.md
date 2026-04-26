---
read_when:
    - คุณต้องการการประมวลผลอนุมานที่เน้นความเป็นส่วนตัวใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า Venice AI
summary: ใช้โมเดลที่เน้นความเป็นส่วนตัวของ Venice AI ใน OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-26T11:40:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AI มอบ **การประมวลผลอนุมาน AI ที่เน้นความเป็นส่วนตัว** พร้อมการรองรับโมเดลแบบไม่เซ็นเซอร์และการเข้าถึงโมเดลเชิงกรรมสิทธิ์หลักผ่านพร็อกซีแบบไม่ระบุตัวตนของ Venice การประมวลผลอนุมานทั้งหมดเป็นแบบส่วนตัวโดยค่าเริ่มต้น — ไม่มีการนำข้อมูลของคุณไปฝึก และไม่มีการบันทึกล็อก

## ทำไมต้องใช้ Venice ใน OpenClaw

- **การประมวลผลอนุมานแบบส่วนตัว** สำหรับโมเดลโอเพนซอร์ส (ไม่มีการบันทึกล็อก)
- **โมเดลแบบไม่เซ็นเซอร์** เมื่อคุณต้องการ
- **การเข้าถึงแบบไม่ระบุตัวตน** ไปยังโมเดลเชิงกรรมสิทธิ์ (Opus/GPT/Gemini) เมื่อคุณต้องการคุณภาพสูง
- เอนด์พอยต์ `/v1` ที่เข้ากันได้กับ OpenAI

## โหมดความเป็นส่วนตัว

Venice มีระดับความเป็นส่วนตัว 2 ระดับ — การเข้าใจเรื่องนี้เป็นกุญแจสำคัญในการเลือกโมเดลของคุณ:

| โหมด           | คำอธิบาย                                                                                                                       | โมเดล                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Private**    | เป็นส่วนตัวอย่างสมบูรณ์ Prompt/response จะ **ไม่ถูกจัดเก็บหรือบันทึกล็อก** ไม่คงอยู่ถาวร                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored เป็นต้น |
| **Anonymized** | ส่งผ่านพร็อกซีผ่าน Venice โดยลบข้อมูลเมตาออก ผู้ให้บริการต้นทาง (OpenAI, Anthropic, Google, xAI) จะเห็นคำขอแบบไม่ระบุตัวตน | Claude, GPT, Gemini, Grok                                    |

<Warning>
โมเดลแบบ Anonymized **ไม่ใช่** แบบส่วนตัวอย่างสมบูรณ์ Venice จะลบข้อมูลเมตาก่อนส่งต่อ แต่ผู้ให้บริการต้นทาง (OpenAI, Anthropic, Google, xAI) ยังคงประมวลผลคำขออยู่ เลือกโมเดล **Private** เมื่อจำเป็นต้องมีความเป็นส่วนตัวอย่างเต็มรูปแบบ
</Warning>

## คุณสมบัติ

- **เน้นความเป็นส่วนตัว**: เลือกระหว่างโหมด "private" (เป็นส่วนตัวเต็มรูปแบบ) และ "anonymized" (ผ่านพร็อกซี)
- **โมเดลแบบไม่เซ็นเซอร์**: เข้าถึงโมเดลที่ไม่มีข้อจำกัดด้านเนื้อหา
- **การเข้าถึงโมเดลหลัก**: ใช้ Claude, GPT, Gemini และ Grok ผ่านพร็อกซีแบบไม่ระบุตัวตนของ Venice
- **API ที่เข้ากันได้กับ OpenAI**: เอนด์พอยต์ `/v1` มาตรฐานเพื่อการผสานรวมที่ง่าย
- **การสตรีม**: รองรับในทุกโมเดล
- **การเรียกใช้ฟังก์ชัน**: รองรับในบางโมเดล (ตรวจสอบความสามารถของโมเดล)
- **Vision**: รองรับในโมเดลที่มีความสามารถด้าน Vision
- **ไม่มีขีดจำกัดอัตราแบบตายตัว**: อาจมีการจำกัดแบบ fair-use หากใช้งานหนักผิดปกติ

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    1. สมัครใช้งานที่ [venice.ai](https://venice.ai)
    2. ไปที่ **Settings > API Keys > Create new key**
    3. คัดลอก API key ของคุณ (รูปแบบ: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="กำหนดค่า OpenClaw">
    เลือกวิธีตั้งค่าที่คุณต้องการ:

    <Tabs>
      <Tab title="แบบโต้ตอบ (แนะนำ)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        การทำเช่นนี้จะ:
        1. ขอให้คุณกรอก API key (หรือใช้ `VENICE_API_KEY` ที่มีอยู่)
        2. แสดงโมเดล Venice ที่พร้อมใช้งานทั้งหมด
        3. ให้คุณเลือกโมเดลเริ่มต้น
        4. กำหนดค่าผู้ให้บริการโดยอัตโนมัติ
      </Tab>
      <Tab title="ตัวแปรสภาพแวดล้อม">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="แบบไม่โต้ตอบ">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## การเลือกโมเดล

หลังจากตั้งค่าแล้ว OpenClaw จะแสดงโมเดล Venice ที่พร้อมใช้งานทั้งหมด เลือกตามความต้องการของคุณ:

- **โมเดลเริ่มต้น**: `venice/kimi-k2-5` สำหรับการให้เหตุผลแบบส่วนตัวที่แข็งแกร่งพร้อม Vision
- **ตัวเลือกความสามารถสูง**: `venice/claude-opus-4-6` สำหรับเส้นทาง Venice แบบ anonymized ที่ทรงพลังที่สุด
- **ความเป็นส่วนตัว**: เลือกโมเดล "private" สำหรับการประมวลผลอนุมานแบบเป็นส่วนตัวอย่างเต็มรูปแบบ
- **ความสามารถ**: เลือกโมเดล "anonymized" เพื่อเข้าถึง Claude, GPT, Gemini ผ่านพร็อกซีของ Venice

เปลี่ยนโมเดลเริ่มต้นของคุณได้ทุกเมื่อ:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

แสดงรายการโมเดลที่พร้อมใช้งานทั้งหมด:

```bash
openclaw models list | grep venice
```

คุณยังสามารถรัน `openclaw configure` เลือก **Model/auth** แล้วเลือก **Venice AI**

<Tip>
ใช้ตารางด้านล่างเพื่อเลือกโมเดลที่เหมาะสมกับกรณีใช้งานของคุณ

| กรณีใช้งาน                 | โมเดลที่แนะนำ                    | เหตุผล                                      |
| -------------------------- | -------------------------------- | ------------------------------------------- |
| **แชตทั่วไป (ค่าเริ่มต้น)** | `kimi-k2-5`                      | การให้เหตุผลแบบส่วนตัวที่แข็งแกร่งพร้อม Vision |
| **คุณภาพโดยรวมดีที่สุด**    | `claude-opus-4-6`                | ตัวเลือก Venice แบบ anonymized ที่ดีที่สุด      |
| **ความเป็นส่วนตัว + การเขียนโค้ด** | `qwen3-coder-480b-a35b-instruct` | โมเดลเขียนโค้ดแบบส่วนตัวพร้อมบริบทขนาดใหญ่ |
| **Vision แบบส่วนตัว**      | `kimi-k2-5`                      | รองรับ Vision โดยไม่ออกจากโหมด private     |
| **เร็ว + ประหยัด**         | `qwen3-4b`                       | โมเดลการให้เหตุผลขนาดเล็ก                  |
| **งานส่วนตัวที่ซับซ้อน**   | `deepseek-v3.2`                  | การให้เหตุผลแข็งแกร่ง แต่ไม่รองรับเครื่องมือ Venice |
| **ไม่เซ็นเซอร์**           | `venice-uncensored`              | ไม่มีข้อจำกัดด้านเนื้อหา                    |

</Tip>

## พฤติกรรมการ replay ของ DeepSeek V4

หาก Venice เปิดให้ใช้โมเดล DeepSeek V4 เช่น `venice/deepseek-v4-pro` หรือ
`venice/deepseek-v4-flash` OpenClaw จะเติม placeholder สำหรับ replay ของ
`reasoning_content` ที่ DeepSeek V4 ต้องการในเทิร์น assistant tool-call เมื่อ
พร็อกซีไม่ได้ส่งมาให้ Venice ปฏิเสธตัวควบคุม `thinking` ระดับบนสุดแบบ native ของ DeepSeek
ดังนั้น OpenClaw จึงแยกการแก้ไข replay เฉพาะผู้ให้บริการนั้นออกจากตัวควบคุม thinking
ของผู้ให้บริการ DeepSeek แบบ native

## แค็ตตาล็อกในตัว (รวม 41 รายการ)

<AccordionGroup>
  <Accordion title="โมเดล Private (26) — เป็นส่วนตัวเต็มรูปแบบ ไม่มีการบันทึกล็อก">
    | Model ID                               | ชื่อ                                | บริบท | คุณสมบัติ                   |
    | -------------------------------------- | ----------------------------------- | ----- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k  | ค่าเริ่มต้น, reasoning, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k  | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k  | ทั่วไป                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k  | ทั่วไป                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k  | ทั่วไป, ปิดใช้งานเครื่องมือ    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k  | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k  | ทั่วไป                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k  | การเขียนโค้ด                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k  | การเขียนโค้ด                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k  | Reasoning, vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k  | ทั่วไป                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k  | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k   | เร็ว, reasoning            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k  | Reasoning, ปิดใช้งานเครื่องมือ  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k   | ไม่เซ็นเซอร์, ปิดใช้งานเครื่องมือ |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k  | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k  | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k  | ทั่วไป                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k  | ทั่วไป                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k  | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k  | ทั่วไป                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k  | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k  | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k  | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k  | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k  | Reasoning                  |
  </Accordion>

  <Accordion title="โมเดล Anonymized (15) — ผ่านพร็อกซี Venice">
    | Model ID                        | ชื่อ                           | บริบท | คุณสมบัติ                  |
    | ------------------------------- | ------------------------------ | ----- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (ผ่าน Venice)   | 1M    | Reasoning, vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (ผ่าน Venice)   | 198k  | Reasoning, vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (ผ่าน Venice) | 1M    | Reasoning, vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (ผ่าน Venice) | 198k  | Reasoning, vision         |
    | `openai-gpt-54`                 | GPT-5.4 (ผ่าน Venice)           | 1M    | Reasoning, vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (ผ่าน Venice)     | 400k  | Reasoning, vision, การเขียนโค้ด |
    | `openai-gpt-52`                 | GPT-5.2 (ผ่าน Venice)           | 256k  | Reasoning                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (ผ่าน Venice)     | 256k  | Reasoning, vision, การเขียนโค้ด |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (ผ่าน Venice)            | 128k  | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (ผ่าน Venice)       | 128k  | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (ผ่าน Venice)    | 1M    | Reasoning, vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (ผ่าน Venice)      | 198k  | Reasoning, vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (ผ่าน Venice)    | 256k  | Reasoning, vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (ผ่าน Venice)     | 1M    | Reasoning, vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (ผ่าน Venice)  | 256k  | Reasoning, การเขียนโค้ด         |
  </Accordion>
</AccordionGroup>

## การค้นหาโมเดล

OpenClaw จะค้นหาโมเดลจาก Venice API โดยอัตโนมัติเมื่อมีการตั้งค่า `VENICE_API_KEY` หากไม่สามารถเข้าถึง API ได้ ระบบจะกลับไปใช้แค็ตตาล็อกแบบคงที่

เอนด์พอยต์ `/models` เป็นสาธารณะ (ไม่ต้องใช้การยืนยันตัวตนในการแสดงรายการ) แต่การประมวลผลอนุมานต้องใช้ API key ที่ถูกต้อง

## การสตรีมและการรองรับเครื่องมือ

| คุณสมบัติ              | การรองรับ                                              |
| ---------------------- | ------------------------------------------------------ |
| **การสตรีม**           | ทุกโมเดล                                               |
| **การเรียกใช้ฟังก์ชัน** | โมเดลส่วนใหญ่ (ตรวจสอบ `supportsFunctionCalling` ใน API) |
| **Vision/Images**      | โมเดลที่มีเครื่องหมายคุณสมบัติ "Vision"                  |
| **โหมด JSON**          | รองรับผ่าน `response_format`                           |

## ราคา

Venice ใช้ระบบแบบเครดิต โปรดตรวจสอบอัตราปัจจุบันที่ [venice.ai/pricing](https://venice.ai/pricing):

- **โมเดล Private**: โดยทั่วไปมีค่าใช้จ่ายต่ำกว่า
- **โมเดล Anonymized**: ใกล้เคียงกับการคิดราคา API โดยตรง + ค่าธรรมเนียมเล็กน้อยของ Venice

### Venice (anonymized) เทียบกับ API โดยตรง

| ด้าน         | Venice (Anonymized)           | API โดยตรง          |
| ------------ | ----------------------------- | ------------------- |
| **ความเป็นส่วนตัว** | ลบข้อมูลเมตาออก ไม่ระบุตัวตน | เชื่อมโยงกับบัญชีของคุณ |
| **ความหน่วง**      | +10-50ms (พร็อกซี)            | โดยตรง              |
| **คุณสมบัติ**      | รองรับคุณสมบัติส่วนใหญ่        | คุณสมบัติครบถ้วน     |
| **การเรียกเก็บเงิน** | เครดิต Venice                | การเรียกเก็บเงินของผู้ให้บริการ |

## ตัวอย่างการใช้งาน

```bash
# ใช้โมเดล private เริ่มต้น
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# ใช้ Claude Opus ผ่าน Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# ใช้โมเดลแบบไม่เซ็นเซอร์
openclaw agent --model venice/venice-uncensored --message "Draft options"

# ใช้โมเดล vision กับภาพ
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# ใช้โมเดลสำหรับการเขียนโค้ด
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="API key ไม่ได้รับการยอมรับ">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    ตรวจสอบให้แน่ใจว่าคีย์ขึ้นต้นด้วย `vapi_`

  </Accordion>

  <Accordion title="ไม่มีโมเดลนี้ให้ใช้งาน">
    แค็ตตาล็อกโมเดลของ Venice อัปเดตแบบไดนามิก รัน `openclaw models list` เพื่อดูโมเดลที่พร้อมใช้งานในขณะนี้ โมเดลบางรายการอาจออฟไลน์ชั่วคราว
  </Accordion>

  <Accordion title="ปัญหาการเชื่อมต่อ">
    Venice API อยู่ที่ `https://api.venice.ai/api/v1` ตรวจสอบให้แน่ใจว่าเครือข่ายของคุณอนุญาตการเชื่อมต่อ HTTPS
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวอย่างไฟล์คอนฟิก">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    หน้าแรกของ Venice AI และการสมัครบัญชี
  </Card>
  <Card title="เอกสาร API" href="https://docs.venice.ai" icon="book">
    ข้อมูลอ้างอิง Venice API และเอกสารสำหรับนักพัฒนา
  </Card>
  <Card title="ราคา" href="https://venice.ai/pricing" icon="credit-card">
    อัตราเครดิตและแพ็กเกจปัจจุบันของ Venice
  </Card>
</CardGroup>
