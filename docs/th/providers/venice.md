---
read_when:
    - คุณต้องการการอนุมานที่เน้นความเป็นส่วนตัวใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า Venice AI
summary: ใช้โมเดลของ Venice AI ที่เน้นความเป็นส่วนตัวใน OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-05-02T10:27:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9b3486dd319661ba27f952e1353fed4364064c2cfb1e5744c018ddbac9dae82
    source_path: providers/venice.md
    workflow: 16
---

Venice AI ให้บริการ **AI inference ที่เน้นความเป็นส่วนตัว** พร้อมรองรับโมเดลแบบไม่ถูกเซ็นเซอร์และการเข้าถึงโมเดล proprietary รายใหญ่ผ่าน proxy แบบไม่ระบุตัวตนของตนเอง inference ทั้งหมดเป็นส่วนตัวตามค่าเริ่มต้น — ไม่มีการฝึกด้วยข้อมูลของคุณ ไม่มีการบันทึก log

## ทำไมจึงใช้ Venice ใน OpenClaw

- **inference แบบส่วนตัว** สำหรับโมเดล open-source (ไม่มีการบันทึก log)
- **โมเดลแบบไม่ถูกเซ็นเซอร์** เมื่อคุณต้องการ
- **การเข้าถึงแบบไม่ระบุตัวตน** ไปยังโมเดล proprietary (Opus/GPT/Gemini) เมื่อคุณภาพเป็นสิ่งสำคัญ
- endpoint `/v1` ที่เข้ากันได้กับ OpenAI

## โหมดความเป็นส่วนตัว

Venice มีระดับความเป็นส่วนตัวสองระดับ — การเข้าใจส่วนนี้เป็นกุญแจสำคัญในการเลือกโมเดลของคุณ:

| โหมด           | คำอธิบาย                                                                                                                       | โมเดล                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **ส่วนตัว**    | เป็นส่วนตัวอย่างสมบูรณ์ prompt/response จะ **ไม่ถูกจัดเก็บหรือบันทึก log โดยเด็ดขาด** เป็นข้อมูลชั่วคราว                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, ฯลฯ |
| **ทำให้ไม่ระบุตัวตน** | ส่งผ่าน proxy ของ Venice โดยตัด metadata ออก provider ต้นทาง (OpenAI, Anthropic, Google, xAI) จะเห็น request แบบไม่ระบุตัวตน | Claude, GPT, Gemini, Grok                                     |

<Warning>
โมเดลแบบไม่ระบุตัวตน **ไม่ใช่** แบบส่วนตัวอย่างสมบูรณ์ Venice ตัด metadata ออกก่อนส่งต่อ แต่ provider ต้นทาง (OpenAI, Anthropic, Google, xAI) ยังคงประมวลผล request เลือกโมเดลแบบ **ส่วนตัว** เมื่อจำเป็นต้องมีความเป็นส่วนตัวอย่างสมบูรณ์
</Warning>

## คุณสมบัติ

- **เน้นความเป็นส่วนตัว**: เลือกระหว่างโหมด "ส่วนตัว" (ส่วนตัวอย่างสมบูรณ์) และ "ทำให้ไม่ระบุตัวตน" (ผ่าน proxy)
- **โมเดลแบบไม่ถูกเซ็นเซอร์**: เข้าถึงโมเดลโดยไม่มีข้อจำกัดด้านเนื้อหา
- **เข้าถึงโมเดลรายใหญ่**: ใช้ Claude, GPT, Gemini และ Grok ผ่าน proxy แบบไม่ระบุตัวตนของ Venice
- **API ที่เข้ากันได้กับ OpenAI**: endpoint `/v1` มาตรฐานเพื่อการผสานรวมที่ง่าย
- **การสตรีม**: รองรับในทุกโมเดล
- **การเรียกใช้ฟังก์ชัน**: รองรับในบางโมเดล (ตรวจสอบความสามารถของโมเดล)
- **วิสัยทัศน์**: รองรับในโมเดลที่มีความสามารถด้าน vision
- **ไม่มี rate limit แบบตายตัว**: อาจมีการจำกัดความเร็วตาม fair-use สำหรับการใช้งานที่สูงมาก

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    1. สมัครที่ [venice.ai](https://venice.ai)
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

        สิ่งนี้จะ:
        1. ถาม API key ของคุณ (หรือใช้ `VENICE_API_KEY` ที่มีอยู่)
        2. แสดงโมเดล Venice ทั้งหมดที่มี
        3. ให้คุณเลือกโมเดลเริ่มต้นของคุณ
        4. กำหนดค่า provider โดยอัตโนมัติ
      </Tab>
      <Tab title="Environment variable">
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
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## การเลือกโมเดล

หลังตั้งค่าแล้ว OpenClaw จะแสดงโมเดล Venice ทั้งหมดที่มี เลือกตามความต้องการของคุณ:

- **โมเดลเริ่มต้น**: `venice/kimi-k2-5` สำหรับการให้เหตุผลแบบส่วนตัวที่แข็งแกร่งพร้อม vision
- **ตัวเลือกความสามารถสูง**: `venice/claude-opus-4-6` สำหรับเส้นทาง Venice แบบไม่ระบุตัวตนที่แข็งแกร่งที่สุด
- **ความเป็นส่วนตัว**: เลือกโมเดล "ส่วนตัว" สำหรับ inference ที่เป็นส่วนตัวอย่างสมบูรณ์
- **ความสามารถ**: เลือกโมเดล "ทำให้ไม่ระบุตัวตน" เพื่อเข้าถึง Claude, GPT, Gemini ผ่าน proxy ของ Venice

เปลี่ยนโมเดลเริ่มต้นของคุณได้ทุกเมื่อ:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

แสดงรายการโมเดลทั้งหมดที่มี:

```bash
openclaw models list --all --provider venice
```

คุณยังสามารถเรียกใช้ `openclaw configure` เลือก **Model/auth** แล้วเลือก **Venice AI**

<Tip>
ใช้ตารางด้านล่างเพื่อเลือกโมเดลที่เหมาะกับกรณีใช้งานของคุณ

| กรณีใช้งาน                   | โมเดลที่แนะนำ                | เหตุผล                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **แชตทั่วไป (ค่าเริ่มต้น)** | `kimi-k2-5`                      | การให้เหตุผลแบบส่วนตัวที่แข็งแกร่งพร้อม vision         |
| **คุณภาพโดยรวมดีที่สุด**   | `claude-opus-4-6`                | ตัวเลือก Venice แบบไม่ระบุตัวตนที่แข็งแกร่งที่สุด           |
| **ความเป็นส่วนตัว + การเขียนโค้ด**       | `qwen3-coder-480b-a35b-instruct` | โมเดลเขียนโค้ดแบบส่วนตัวพร้อม context ขนาดใหญ่      |
| **vision แบบส่วนตัว**         | `kimi-k2-5`                      | รองรับ vision โดยไม่ออกจากโหมดส่วนตัว  |
| **เร็ว + ราคาถูก**           | `qwen3-4b`                       | โมเดลให้เหตุผลน้ำหนักเบา                  |
| **งานส่วนตัวที่ซับซ้อน**  | `deepseek-v3.2`                  | การให้เหตุผลแข็งแกร่ง แต่ไม่รองรับเครื่องมือของ Venice |
| **ไม่ถูกเซ็นเซอร์**             | `venice-uncensored`              | ไม่มีข้อจำกัดด้านเนื้อหา                      |

</Tip>

## พฤติกรรม replay ของ DeepSeek V4

หาก Venice เปิดให้ใช้โมเดล DeepSeek V4 เช่น `venice/deepseek-v4-pro` หรือ
`venice/deepseek-v4-flash` OpenClaw จะเติม placeholder สำหรับ replay
`reasoning_content` ของ DeepSeek V4 ที่จำเป็นในข้อความ assistant เมื่อ proxy
ละไว้ Venice ปฏิเสธการควบคุม `thinking` ระดับบนสุดแบบ native ของ DeepSeek ดังนั้น
OpenClaw จึงแยกการแก้ไข replay เฉพาะ provider นี้ออกจากการควบคุม thinking ของ
provider DeepSeek แบบ native

## catalog ในตัว (รวม 41 รายการ)

<AccordionGroup>
  <Accordion title="โมเดลส่วนตัว (26) — ส่วนตัวอย่างสมบูรณ์ ไม่มีการบันทึก log">
    | Model ID                               | ชื่อ                                | Context | คุณสมบัติ                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | ค่าเริ่มต้น, การให้เหตุผล, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | การให้เหตุผล                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | ทั่วไป                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | ทั่วไป                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | ทั่วไป, ปิดใช้งานเครื่องมือ    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | การให้เหตุผล                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | ทั่วไป                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | การเขียนโค้ด                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | การเขียนโค้ด                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | การให้เหตุผล, vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | ทั่วไป                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | เร็ว, การให้เหตุผล            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | การให้เหตุผล, ปิดใช้งานเครื่องมือ  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | ไม่ถูกเซ็นเซอร์, ปิดใช้งานเครื่องมือ |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | ทั่วไป                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | ทั่วไป                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | การให้เหตุผล                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | ทั่วไป                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | การให้เหตุผล                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | การให้เหตุผล                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | การให้เหตุผล                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | การให้เหตุผล                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | การให้เหตุผล                  |
  </Accordion>

  <Accordion title="โมเดลแบบไม่ระบุตัวตน (15) — ผ่าน proxy ของ Venice">
    | Model ID                        | ชื่อ                           | Context | คุณสมบัติ                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (ผ่าน Venice)   | 1M      | การให้เหตุผล, vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (ผ่าน Venice)   | 198k    | การให้เหตุผล, vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (ผ่าน Venice) | 1M      | การให้เหตุผล, vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (ผ่าน Venice) | 198k    | การให้เหตุผล, vision         |
    | `openai-gpt-54`                 | GPT-5.4 (ผ่าน Venice)           | 1M      | การให้เหตุผล, vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (ผ่าน Venice)     | 400k    | การให้เหตุผล, vision, การเขียนโค้ด |
    | `openai-gpt-52`                 | GPT-5.2 (ผ่าน Venice)           | 256k    | การให้เหตุผล                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (ผ่าน Venice)     | 256k    | การให้เหตุผล, vision, การเขียนโค้ด |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (ผ่าน Venice)            | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (ผ่าน Venice)       | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (ผ่าน Venice)    | 1M      | การให้เหตุผล, vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (ผ่าน Venice)      | 198k    | การให้เหตุผล, vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (ผ่าน Venice)    | 256k    | การให้เหตุผล, vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (ผ่าน Venice)     | 1M      | การให้เหตุผล, vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (ผ่าน Venice)  | 256k    | การให้เหตุผล, การเขียนโค้ด         |
  </Accordion>
</AccordionGroup>

## การค้นหาโมเดล

OpenClaw มาพร้อม seed catalog ของ Venice ที่หนุนด้วย manifest สำหรับการแสดงรายการโมเดลแบบอ่านอย่างเดียว การ refresh ขณะ runtime ยังค้นพบโมเดลจาก Venice API ได้ และจะ fallback ไปยัง manifest catalog หากเข้าถึง API ไม่ได้

endpoint `/models` เป็น public (ไม่ต้องใช้ auth สำหรับการแสดงรายการ) แต่ inference ต้องใช้ API key ที่ถูกต้อง

## การสตรีมและการรองรับเครื่องมือ

| คุณสมบัติ              | การรองรับ                                              |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | ทุกโมเดล                                           |
| **Function calling** | โมเดลส่วนใหญ่ (ตรวจสอบ `supportsFunctionCalling` ใน API) |
| **Vision/Images**    | โมเดลที่มีฟีเจอร์ "Vision"                  |
| **JSON mode**        | รองรับผ่าน `response_format`                      |

## ราคา

Venice ใช้ระบบแบบเครดิต ตรวจสอบ [venice.ai/pricing](https://venice.ai/pricing) สำหรับอัตราปัจจุบัน:

- **โมเดลส่วนตัว**: โดยทั่วไปมีต้นทุนต่ำกว่า
- **โมเดลแบบนิรนาม**: ใกล้เคียงกับราคา API โดยตรง + ค่าธรรมเนียม Venice เล็กน้อย

### Venice (แบบนิรนาม) เทียบกับ API โดยตรง

| ด้าน       | Venice (แบบนิรนาม)           | API โดยตรง          |
| ------------ | ----------------------------- | ------------------- |
| **ความเป็นส่วนตัว**  | ลบข้อมูลเมตาออกแล้ว ทำให้เป็นนิรนาม | เชื่อมโยงกับบัญชีของคุณ |
| **เวลาแฝง**  | +10-50ms (พร็อกซี)              | โดยตรง              |
| **ฟีเจอร์** | รองรับฟีเจอร์ส่วนใหญ่       | ฟีเจอร์ครบถ้วน       |
| **การเรียกเก็บเงิน**  | เครดิต Venice                | การเรียกเก็บเงินจากผู้ให้บริการ    |

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
  <Accordion title="ไม่รู้จักคีย์ API">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    ตรวจสอบให้แน่ใจว่าคีย์ขึ้นต้นด้วย `vapi_`

  </Accordion>

  <Accordion title="โมเดลไม่พร้อมใช้งาน">
    แค็ตตาล็อกโมเดล Venice อัปเดตแบบไดนามิก เรียกใช้ `openclaw models list` เพื่อดูโมเดลที่พร้อมใช้งานในปัจจุบัน บางโมเดลอาจออฟไลน์ชั่วคราว
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
  <Accordion title="ตัวอย่างไฟล์ Config">
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
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานของการสลับระบบเมื่อขัดข้อง
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    หน้าแรกของ Venice AI และการสมัครบัญชี
  </Card>
  <Card title="เอกสาร API" href="https://docs.venice.ai" icon="book">
    เอกสารอ้างอิง Venice API และเอกสารสำหรับนักพัฒนา
  </Card>
  <Card title="ราคา" href="https://venice.ai/pricing" icon="credit-card">
    อัตราเครดิตและแผนปัจจุบันของ Venice
  </Card>
</CardGroup>
