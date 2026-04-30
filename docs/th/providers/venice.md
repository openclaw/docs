---
read_when:
    - คุณต้องการการอนุมานที่เน้นความเป็นส่วนตัวใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า Venice AI
summary: ใช้โมเดลที่เน้นความเป็นส่วนตัวของ Venice AI ใน OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-30T10:13:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI ให้บริการ**การอนุมาน AI ที่เน้นความเป็นส่วนตัว** พร้อมรองรับโมเดลที่ไม่ถูกเซ็นเซอร์และการเข้าถึงโมเดลกรรมสิทธิ์หลักผ่านพร็อกซีแบบไม่ระบุตัวตนของพวกเขา การอนุมานทั้งหมดเป็นส่วนตัวตามค่าเริ่มต้น — ไม่มีการฝึกบนข้อมูลของคุณ ไม่มีการบันทึกล็อก

## ทำไมต้องใช้ Venice ใน OpenClaw

- **การอนุมานแบบส่วนตัว** สำหรับโมเดลโอเพนซอร์ส (ไม่มีการบันทึกล็อก)
- **โมเดลที่ไม่ถูกเซ็นเซอร์** เมื่อคุณต้องการใช้
- **การเข้าถึงแบบไม่ระบุตัวตน** ไปยังโมเดลกรรมสิทธิ์ (Opus/GPT/Gemini) เมื่อคุณภาพเป็นสิ่งสำคัญ
- เอนด์พอยต์ `/v1` ที่เข้ากันได้กับ OpenAI

## โหมดความเป็นส่วนตัว

Venice มีระดับความเป็นส่วนตัวสองระดับ — การเข้าใจจุดนี้เป็นกุญแจสำคัญในการเลือกโมเดลของคุณ:

| โหมด           | คำอธิบาย                                                                                                                       | โมเดล                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **ส่วนตัว**    | เป็นส่วนตัวอย่างเต็มรูปแบบ พรอมป์/คำตอบจะ**ไม่ถูกจัดเก็บหรือบันทึกล็อกเด็ดขาด** ชั่วคราวเท่านั้น                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **ไม่ระบุตัวตน** | ส่งผ่านพร็อกซีของ Venice โดยตัดเมตาดาตาออก ผู้ให้บริการเบื้องหลัง (OpenAI, Anthropic, Google, xAI) จะเห็นคำขอแบบไม่ระบุตัวตน | Claude, GPT, Gemini, Grok                                     |

<Warning>
โมเดลแบบไม่ระบุตัวตน**ไม่ได้**เป็นส่วนตัวอย่างเต็มรูปแบบ Venice จะตัดเมตาดาตาออกก่อนส่งต่อ แต่ผู้ให้บริการเบื้องหลัง (OpenAI, Anthropic, Google, xAI) ยังคงประมวลผลคำขอ เลือกโมเดล**ส่วนตัว**เมื่อจำเป็นต้องมีความเป็นส่วนตัวอย่างเต็มรูปแบบ
</Warning>

## คุณสมบัติ

- **เน้นความเป็นส่วนตัว**: เลือกระหว่างโหมด "ส่วนตัว" (เป็นส่วนตัวเต็มรูปแบบ) และ "ไม่ระบุตัวตน" (ผ่านพร็อกซี)
- **โมเดลที่ไม่ถูกเซ็นเซอร์**: เข้าถึงโมเดลที่ไม่มีข้อจำกัดด้านเนื้อหา
- **การเข้าถึงโมเดลหลัก**: ใช้ Claude, GPT, Gemini และ Grok ผ่านพร็อกซีแบบไม่ระบุตัวตนของ Venice
- **API ที่เข้ากันได้กับ OpenAI**: เอนด์พอยต์มาตรฐาน `/v1` เพื่อการผสานรวมที่ง่าย
- **การสตรีม**: รองรับในทุกโมเดล
- **การเรียกใช้ฟังก์ชัน**: รองรับในบางโมเดล (ตรวจสอบความสามารถของโมเดล)
- **วิชัน**: รองรับในโมเดลที่มีความสามารถด้านวิชัน
- **ไม่มีขีดจำกัดอัตราแบบตายตัว**: อาจมีการจำกัดความเร็วตามการใช้งานที่เหมาะสมสำหรับการใช้งานที่สูงมาก

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    1. ลงทะเบียนที่ [venice.ai](https://venice.ai)
    2. ไปที่ **การตั้งค่า > คีย์ API > สร้างคีย์ใหม่**
    3. คัดลอกคีย์ API ของคุณ (รูปแบบ: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="กำหนดค่า OpenClaw">
    เลือกวิธีตั้งค่าที่คุณต้องการ:

    <Tabs>
      <Tab title="แบบโต้ตอบ (แนะนำ)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        คำสั่งนี้จะ:
        1. แจ้งให้ป้อนคีย์ API ของคุณ (หรือใช้ `VENICE_API_KEY` ที่มีอยู่)
        2. แสดงโมเดล Venice ทั้งหมดที่พร้อมใช้งาน
        3. ให้คุณเลือกโมเดลเริ่มต้นของคุณ
        4. กำหนดค่าผู้ให้บริการโดยอัตโนมัติ
      </Tab>
      <Tab title="ตัวแปรสภาพแวดล้อม">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="ไม่โต้ตอบ">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="ยืนยันการตั้งค่า">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## การเลือกโมเดล

หลังจากตั้งค่าแล้ว OpenClaw จะแสดงโมเดล Venice ทั้งหมดที่พร้อมใช้งาน เลือกตามความต้องการของคุณ:

- **โมเดลเริ่มต้น**: `venice/kimi-k2-5` สำหรับการใช้เหตุผลแบบส่วนตัวที่แข็งแกร่ง พร้อมวิชัน
- **ตัวเลือกความสามารถสูง**: `venice/claude-opus-4-6` สำหรับเส้นทาง Venice แบบไม่ระบุตัวตนที่แข็งแกร่งที่สุด
- **ความเป็นส่วนตัว**: เลือกโมเดล "ส่วนตัว" สำหรับการอนุมานที่เป็นส่วนตัวอย่างเต็มรูปแบบ
- **ความสามารถ**: เลือกโมเดล "ไม่ระบุตัวตน" เพื่อเข้าถึง Claude, GPT, Gemini ผ่านพร็อกซีของ Venice

เปลี่ยนโมเดลเริ่มต้นของคุณได้ทุกเมื่อ:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

แสดงรายการโมเดลทั้งหมดที่พร้อมใช้งาน:

```bash
openclaw models list | grep venice
```

คุณยังสามารถเรียกใช้ `openclaw configure` เลือก **โมเดล/การยืนยันตัวตน** แล้วเลือก **Venice AI**

<Tip>
ใช้ตารางด้านล่างเพื่อเลือกโมเดลที่เหมาะกับกรณีการใช้งานของคุณ

| กรณีการใช้งาน                   | โมเดลที่แนะนำ                | เหตุผล                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **แชตทั่วไป (ค่าเริ่มต้น)** | `kimi-k2-5`                      | การใช้เหตุผลแบบส่วนตัวที่แข็งแกร่ง พร้อมวิชัน         |
| **คุณภาพโดยรวมดีที่สุด**   | `claude-opus-4-6`                | ตัวเลือก Venice แบบไม่ระบุตัวตนที่แข็งแกร่งที่สุด           |
| **ความเป็นส่วนตัว + การเขียนโค้ด**       | `qwen3-coder-480b-a35b-instruct` | โมเดลเขียนโค้ดแบบส่วนตัวที่มีบริบทขนาดใหญ่      |
| **วิชันแบบส่วนตัว**         | `kimi-k2-5`                      | รองรับวิชันโดยไม่ออกจากโหมดส่วนตัว  |
| **เร็ว + ประหยัด**           | `qwen3-4b`                       | โมเดลใช้เหตุผลน้ำหนักเบา                  |
| **งานส่วนตัวที่ซับซ้อน**  | `deepseek-v3.2`                  | การใช้เหตุผลที่แข็งแกร่ง แต่ไม่รองรับเครื่องมือ Venice |
| **ไม่ถูกเซ็นเซอร์**             | `venice-uncensored`              | ไม่มีข้อจำกัดด้านเนื้อหา                      |

</Tip>

## พฤติกรรมการเล่นซ้ำของ DeepSeek V4

หาก Venice เปิดให้ใช้โมเดล DeepSeek V4 เช่น `venice/deepseek-v4-pro` หรือ
`venice/deepseek-v4-flash` OpenClaw จะเติมตัวแทนการเล่นซ้ำ
`reasoning_content` ของ DeepSeek V4 ที่จำเป็นในข้อความของผู้ช่วย เมื่อพร็อกซี
ละไว้ Venice จะปฏิเสธการควบคุม `thinking` ระดับบนสุดแบบเนทีฟของ DeepSeek ดังนั้น
OpenClaw จึงแยกการแก้ไขการเล่นซ้ำเฉพาะผู้ให้บริการนั้นออกจากการควบคุมการคิดแบบเนทีฟ
ของผู้ให้บริการ DeepSeek

## แคตตาล็อกในตัว (รวม 41)

<AccordionGroup>
  <Accordion title="โมเดลส่วนตัว (26) — เป็นส่วนตัวเต็มรูปแบบ ไม่มีการบันทึกล็อก">
    | รหัสโมเดล                               | ชื่อ                                | บริบท | คุณสมบัติ                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | ค่าเริ่มต้น, การใช้เหตุผล, วิชัน |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | การใช้เหตุผล                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | ทั่วไป                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | ทั่วไป                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | ทั่วไป, ปิดใช้งานเครื่องมือ    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | การใช้เหตุผล                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | ทั่วไป                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | การเขียนโค้ด                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | การเขียนโค้ด                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | การใช้เหตุผล, วิชัน          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | ทั่วไป                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | วิชัน                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | เร็ว, การใช้เหตุผล            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | การใช้เหตุผล, ปิดใช้งานเครื่องมือ  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | ไม่ถูกเซ็นเซอร์, ปิดใช้งานเครื่องมือ |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | วิชัน                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | วิชัน                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | ทั่วไป                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | ทั่วไป                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | การใช้เหตุผล                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | ทั่วไป                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | การใช้เหตุผล                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | การใช้เหตุผล                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | การใช้เหตุผล                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | การใช้เหตุผล                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | การใช้เหตุผล                  |
  </Accordion>

  <Accordion title="โมเดลแบบไม่ระบุตัวตน (15) — ผ่านพร็อกซี Venice">
    | รหัสโมเดล                        | ชื่อ                           | บริบท | คุณสมบัติ                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | การใช้เหตุผล, วิชัน         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | การใช้เหตุผล, วิชัน         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | การใช้เหตุผล, วิชัน         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | การใช้เหตุผล, วิชัน         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | การใช้เหตุผล, วิชัน         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | การใช้เหตุผล, วิชัน, การเขียนโค้ด |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | การใช้เหตุผล                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | การใช้เหตุผล, วิชัน, การเขียนโค้ด |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | วิชัน                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | วิชัน                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | การใช้เหตุผล, วิชัน         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | การใช้เหตุผล, วิชัน         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | การใช้เหตุผล, วิชัน         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | การใช้เหตุผล, วิชัน         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | การใช้เหตุผล, การเขียนโค้ด         |
  </Accordion>
</AccordionGroup>

## การค้นพบโมเดล

OpenClaw จะค้นหาโมเดลจาก Venice API โดยอัตโนมัติเมื่อมีการตั้งค่า `VENICE_API_KEY` หากไม่สามารถเข้าถึง API ได้ จะย้อนกลับไปใช้แคตตาล็อกแบบคงที่

เอนด์พอยต์ `/models` เป็นสาธารณะ (ไม่ต้องยืนยันตัวตนสำหรับการแสดงรายการ) แต่การอนุมานต้องใช้คีย์ API ที่ถูกต้อง

## การสตรีมและการรองรับเครื่องมือ

| ฟีเจอร์             | การรองรับ                                             |
| -------------------- | ---------------------------------------------------- |
| **การสตรีม**        | ทุกรุ่น                                              |
| **การเรียกใช้ฟังก์ชัน** | รุ่นส่วนใหญ่ (ตรวจสอบ `supportsFunctionCalling` ใน API) |
| **วิชัน/รูปภาพ**    | รุ่นที่ทำเครื่องหมายว่ามีฟีเจอร์ "Vision"             |
| **โหมด JSON**       | รองรับผ่าน `response_format`                         |

## ราคา

Venice ใช้ระบบแบบเครดิต ตรวจสอบอัตราปัจจุบันได้ที่ [venice.ai/pricing](https://venice.ai/pricing):

- **รุ่นส่วนตัว**: โดยทั่วไปมีต้นทุนต่ำกว่า
- **รุ่นแบบไม่ระบุตัวตน**: ใกล้เคียงกับราคา API โดยตรง + ค่าธรรมเนียมเล็กน้อยของ Venice

### Venice (แบบไม่ระบุตัวตน) เทียบกับ API โดยตรง

| ด้าน         | Venice (แบบไม่ระบุตัวตน)      | API โดยตรง          |
| ------------ | ----------------------------- | ------------------- |
| **ความเป็นส่วนตัว** | ลบเมตาดาตา ทำให้ไม่ระบุตัวตน | เชื่อมโยงกับบัญชีของคุณ |
| **เวลาแฝง** | +10-50ms (พร็อกซี)            | โดยตรง              |
| **ฟีเจอร์** | รองรับฟีเจอร์ส่วนใหญ่          | ฟีเจอร์ครบถ้วน      |
| **การเรียกเก็บเงิน** | เครดิต Venice                | ผู้ให้บริการเรียกเก็บเงิน |

## ตัวอย่างการใช้งาน

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    ตรวจสอบให้แน่ใจว่าคีย์ขึ้นต้นด้วย `vapi_`

  </Accordion>

  <Accordion title="Model not available">
    แคตตาล็อกรุ่นของ Venice อัปเดตแบบไดนามิก เรียกใช้ `openclaw models list` เพื่อดูรุ่นที่พร้อมใช้งานในปัจจุบัน บางรุ่นอาจออฟไลน์ชั่วคราว
  </Accordion>

  <Accordion title="Connection issues">
    Venice API อยู่ที่ `https://api.venice.ai/api/v1` ตรวจสอบให้แน่ใจว่าเครือข่ายของคุณอนุญาตการเชื่อมต่อ HTTPS
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Config file example">
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
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงรุ่น และพฤติกรรมการสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    หน้าแรกของ Venice AI และการสมัครบัญชี
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    เอกสารอ้างอิง Venice API และเอกสารสำหรับนักพัฒนา
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    อัตราเครดิตและแผนปัจจุบันของ Venice
  </Card>
</CardGroup>
