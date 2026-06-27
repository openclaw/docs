---
read_when:
    - คุณต้องการการอนุมานที่เน้นความเป็นส่วนตัวใน OpenClaw
    - คุณต้องการคำแนะนำการตั้งค่า Venice AI
summary: ใช้โมเดลที่เน้นความเป็นส่วนตัวของ Venice AI ใน OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-06-27T18:17:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f02885dd7d8dc06fb6a923f504ad515c4b9345507d784bff290d3fcc483ed45
    source_path: providers/venice.md
    workflow: 16
---

Venice AI ให้บริการ **การอนุมาน AI ที่เน้นความเป็นส่วนตัว** พร้อมรองรับโมเดลที่ไม่ถูกเซ็นเซอร์และการเข้าถึงโมเดลกรรมสิทธิ์รายใหญ่ผ่านพร็อกซีแบบทำให้ไม่ระบุตัวตนของพวกเขา การอนุมานทั้งหมดเป็นส่วนตัวโดยค่าเริ่มต้น — ไม่มีการฝึกบนข้อมูลของคุณ ไม่มีการบันทึกล็อก

## ทำไมต้องใช้ Venice ใน OpenClaw

- **การอนุมานแบบส่วนตัว** สำหรับโมเดลโอเพนซอร์ส (ไม่มีการบันทึกล็อก)
- **โมเดลที่ไม่ถูกเซ็นเซอร์** เมื่อคุณต้องการ
- **การเข้าถึงแบบไม่ระบุตัวตน** ไปยังโมเดลกรรมสิทธิ์ (Opus/GPT/Gemini) เมื่อคุณภาพเป็นสิ่งสำคัญ
- เอนด์พอยต์ `/v1` ที่เข้ากันได้กับ OpenAI

## โหมดความเป็นส่วนตัว

Venice มีระดับความเป็นส่วนตัวสองระดับ — การทำความเข้าใจเรื่องนี้เป็นกุญแจสำคัญในการเลือกโมเดลของคุณ:

| โหมด           | คำอธิบาย                                                                                                                       | โมเดล                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **ส่วนตัว**    | เป็นส่วนตัวอย่างสมบูรณ์ พรอมต์/คำตอบจะ **ไม่ถูกจัดเก็บหรือบันทึกล็อกเด็ดขาด** เป็นแบบชั่วคราว                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, ฯลฯ |
| **ทำให้ไม่ระบุตัวตน** | ส่งผ่านพร็อกซีของ Venice พร้อมลบเมทาดาทา ผู้ให้บริการเบื้องหลัง (OpenAI, Anthropic, Google, xAI) จะเห็นคำขอที่ถูกทำให้ไม่ระบุตัวตน | Claude, GPT, Gemini, Grok                                     |

<Warning>
โมเดลแบบทำให้ไม่ระบุตัวตน **ไม่ใช่** แบบส่วนตัวอย่างสมบูรณ์ Venice จะลบเมทาดาทาก่อนส่งต่อ แต่ผู้ให้บริการเบื้องหลัง (OpenAI, Anthropic, Google, xAI) ยังคงประมวลผลคำขอ เลือกโมเดล **ส่วนตัว** เมื่อต้องการความเป็นส่วนตัวอย่างสมบูรณ์
</Warning>

## คุณสมบัติ

- **เน้นความเป็นส่วนตัว**: เลือกระหว่างโหมด "ส่วนตัว" (ส่วนตัวอย่างสมบูรณ์) และ "ทำให้ไม่ระบุตัวตน" (ผ่านพร็อกซี)
- **โมเดลที่ไม่ถูกเซ็นเซอร์**: เข้าถึงโมเดลที่ไม่มีข้อจำกัดด้านเนื้อหา
- **การเข้าถึงโมเดลรายใหญ่**: ใช้ Claude, GPT, Gemini และ Grok ผ่านพร็อกซีแบบทำให้ไม่ระบุตัวตนของ Venice
- **API ที่เข้ากันได้กับ OpenAI**: เอนด์พอยต์มาตรฐาน `/v1` เพื่อการผสานรวมที่ง่าย
- **การสตรีม**: รองรับในทุกโมเดล
- **การเรียกใช้ฟังก์ชัน**: รองรับในบางโมเดล (ตรวจสอบความสามารถของโมเดล)
- **วิชัน**: รองรับในโมเดลที่มีความสามารถด้านวิชัน
- **ไม่มีขีดจำกัดอัตราแบบตายตัว**: อาจมีการจำกัดความเร็วตามการใช้งานที่สมเหตุสมผลสำหรับการใช้งานหนักมาก

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="รับคีย์ API ของคุณ">
    1. สมัครที่ [venice.ai](https://venice.ai)
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
        1. ขอคีย์ API ของคุณ (หรือใช้ `VENICE_API_KEY` ที่มีอยู่)
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
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## การเลือกโมเดล

หลังจากตั้งค่าแล้ว OpenClaw จะแสดงโมเดล Venice ทั้งหมดที่พร้อมใช้งาน เลือกตามความต้องการของคุณ:

- **โมเดลเริ่มต้น**: `venice/kimi-k2-5` สำหรับการให้เหตุผลแบบส่วนตัวที่แข็งแกร่งพร้อมวิชัน
- **ตัวเลือกความสามารถสูง**: `venice/claude-opus-4-6` สำหรับเส้นทาง Venice แบบทำให้ไม่ระบุตัวตนที่แข็งแกร่งที่สุด
- **ความเป็นส่วนตัว**: เลือกโมเดล "ส่วนตัว" สำหรับการอนุมานแบบส่วนตัวอย่างสมบูรณ์
- **ความสามารถ**: เลือกโมเดล "ทำให้ไม่ระบุตัวตน" เพื่อเข้าถึง Claude, GPT, Gemini ผ่านพร็อกซีของ Venice

เปลี่ยนโมเดลเริ่มต้นของคุณได้ทุกเมื่อ:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

แสดงรายการโมเดลทั้งหมดที่พร้อมใช้งาน:

```bash
openclaw models list --all --provider venice
```

คุณยังสามารถเรียกใช้ `openclaw configure` เลือก **โมเดล/การยืนยันตัวตน** แล้วเลือก **Venice AI**

<Tip>
ใช้ตารางด้านล่างเพื่อเลือกโมเดลที่เหมาะกับกรณีการใช้งานของคุณ

| กรณีการใช้งาน                   | โมเดลที่แนะนำ                | เหตุผล                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **แชตทั่วไป (ค่าเริ่มต้น)** | `kimi-k2-5`                      | การให้เหตุผลแบบส่วนตัวที่แข็งแกร่งพร้อมวิชัน         |
| **คุณภาพโดยรวมดีที่สุด**   | `claude-opus-4-6`                | ตัวเลือก Venice แบบทำให้ไม่ระบุตัวตนที่แข็งแกร่งที่สุด           |
| **ความเป็นส่วนตัว + การเขียนโค้ด**       | `qwen3-coder-480b-a35b-instruct` | โมเดลเขียนโค้ดแบบส่วนตัวพร้อมบริบทขนาดใหญ่      |
| **วิชันแบบส่วนตัว**         | `kimi-k2-5`                      | รองรับวิชันโดยไม่ออกจากโหมดส่วนตัว  |
| **เร็ว + ราคาถูก**           | `qwen3-4b`                       | โมเดลให้เหตุผลน้ำหนักเบา                  |
| **งานส่วนตัวที่ซับซ้อน**  | `deepseek-v3.2`                  | การให้เหตุผลที่แข็งแกร่ง แต่ไม่รองรับเครื่องมือ Venice |
| **ไม่ถูกเซ็นเซอร์**             | `venice-uncensored`              | ไม่มีข้อจำกัดด้านเนื้อหา                      |

</Tip>

## พฤติกรรมการเล่นซ้ำของ DeepSeek V4

หาก Venice เปิดเผยโมเดล DeepSeek V4 เช่น `venice/deepseek-v4-pro` หรือ
`venice/deepseek-v4-flash` OpenClaw จะเติมตัวแทนการเล่นซ้ำ
`reasoning_content` ของ DeepSeek V4 ที่จำเป็นในข้อความของผู้ช่วยเมื่อพร็อกซี
ละเว้นไว้ Venice ปฏิเสธตัวควบคุม `thinking` ระดับบนสุดแบบเนทีฟของ DeepSeek ดังนั้น
OpenClaw จึงแยกการแก้ไขการเล่นซ้ำเฉพาะผู้ให้บริการนั้นออกจากตัวควบคุมการคิดแบบเนทีฟ
ของผู้ให้บริการ DeepSeek

## แคตตาล็อกในตัว (ทั้งหมด 41 รายการ)

<AccordionGroup>
  <Accordion title="โมเดลส่วนตัว (26) — ส่วนตัวอย่างสมบูรณ์ ไม่มีการบันทึกล็อก">
    | ID โมเดล                               | ชื่อ                                | บริบท | คุณสมบัติ                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | ค่าเริ่มต้น, การให้เหตุผล, วิชัน |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | การให้เหตุผล                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | ทั่วไป                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | ทั่วไป                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | ทั่วไป, ปิดใช้งานเครื่องมือ    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | การให้เหตุผล                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | ทั่วไป                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | การเขียนโค้ด                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | การเขียนโค้ด                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | การให้เหตุผล, วิชัน          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | ทั่วไป                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | วิชัน                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | เร็ว, การให้เหตุผล            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | การให้เหตุผล, ปิดใช้งานเครื่องมือ  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | ไม่ถูกเซ็นเซอร์, ปิดใช้งานเครื่องมือ |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | วิชัน                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | วิชัน                     |
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

  <Accordion title="โมเดลแบบทำให้ไม่ระบุตัวตน (12) — ผ่านพร็อกซี Venice">
    | ID โมเดล                        | ชื่อ                           | บริบท | คุณสมบัติ                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (ผ่าน Venice)   | 1M      | การให้เหตุผล, วิชัน         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (ผ่าน Venice) | 1M      | การให้เหตุผล, วิชัน         |
    | `openai-gpt-54`                 | GPT-5.4 (ผ่าน Venice)           | 1M      | การให้เหตุผล, วิชัน         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (ผ่าน Venice)     | 400k    | การให้เหตุผล, วิชัน, การเขียนโค้ด |
    | `openai-gpt-52`                 | GPT-5.2 (ผ่าน Venice)           | 256k    | การให้เหตุผล                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (ผ่าน Venice)     | 256k    | การให้เหตุผล, วิชัน, การเขียนโค้ด |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (ผ่าน Venice)            | 128k    | วิชัน                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (ผ่าน Venice)       | 128k    | วิชัน                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (ผ่าน Venice)    | 1M      | การให้เหตุผล, วิชัน         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (ผ่าน Venice)      | 198k    | การให้เหตุผล, วิชัน         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (ผ่าน Venice)    | 256k    | การให้เหตุผล, วิชัน         |
    | `grok-41-fast`                  | Grok 4.1 Fast (ผ่าน Venice)     | 1M      | การให้เหตุผล, วิชัน         |
  </Accordion>
</AccordionGroup>

## การค้นหาโมเดล

OpenClaw มาพร้อมแคตตาล็อก seed ของ Venice ที่มี manifest รองรับสำหรับการแสดงรายการโมเดลแบบอ่านอย่างเดียว การรีเฟรชขณะรันไทม์ยังสามารถค้นพบโมเดลจาก Venice API ได้ และจะย้อนกลับไปใช้แคตตาล็อก manifest หากเข้าถึง API ไม่ได้

เอนด์พอยต์ `/models` เป็นสาธารณะ (ไม่ต้องใช้การยืนยันตัวตนสำหรับการแสดงรายการ) แต่การอนุมานต้องใช้คีย์ API ที่ถูกต้อง

## การสตรีมและการรองรับเครื่องมือ

| คุณสมบัติ              | การรองรับ                                              |
| -------------------- | ---------------------------------------------------- |
| **การสตรีม**        | ทุกรุ่น                                           |
| **การเรียกใช้ฟังก์ชัน** | รุ่นส่วนใหญ่ (ตรวจสอบ `supportsFunctionCalling` ใน API) |
| **Vision/รูปภาพ**    | รุ่นที่ทำเครื่องหมายด้วยคุณสมบัติ "Vision"                  |
| **โหมด JSON**        | รองรับผ่าน `response_format`                      |

## ราคา

Venice ใช้ระบบแบบเครดิต ตรวจสอบอัตราปัจจุบันได้ที่ [venice.ai/pricing](https://venice.ai/pricing):

- **รุ่นส่วนตัว**: โดยทั่วไปมีต้นทุนต่ำกว่า
- **รุ่นแบบไม่ระบุตัวตน**: ใกล้เคียงกับราคา API โดยตรง + ค่าธรรมเนียม Venice เล็กน้อย

### Venice (แบบไม่ระบุตัวตน) เทียบกับ API โดยตรง

| ด้าน       | Venice (แบบไม่ระบุตัวตน)           | API โดยตรง          |
| ------------ | ----------------------------- | ------------------- |
| **ความเป็นส่วนตัว**  | ตัด metadata ออกและทำให้ไม่ระบุตัวตน | เชื่อมโยงกับบัญชีของคุณ |
| **เวลาแฝง**  | +10-50ms (proxy)              | โดยตรง              |
| **คุณสมบัติ** | รองรับคุณสมบัติส่วนใหญ่       | คุณสมบัติครบถ้วน       |
| **การเรียกเก็บเงิน**  | เครดิต Venice                | การเรียกเก็บเงินของผู้ให้บริการ    |

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

  <Accordion title="รุ่นไม่พร้อมใช้งาน">
    แค็ตตาล็อกรุ่นของ Venice อัปเดตแบบไดนามิก เรียกใช้ `openclaw models list` เพื่อดูรุ่นที่พร้อมใช้งานในปัจจุบัน บางรุ่นอาจออฟไลน์ชั่วคราว
  </Accordion>

  <Accordion title="ปัญหาการเชื่อมต่อ">
    Venice API อยู่ที่ `https://api.venice.ai/api/v1` ตรวจสอบให้แน่ใจว่าเครือข่ายของคุณอนุญาตการเชื่อมต่อ HTTPS
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวอย่างไฟล์กำหนดค่า">
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
  <Card title="การเลือกรุ่น" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงรุ่น และพฤติกรรมการสลับไปใช้สำรองเมื่อเกิดข้อผิดพลาด
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    หน้าแรกของ Venice AI และการสมัครบัญชี
  </Card>
  <Card title="เอกสารประกอบ API" href="https://docs.venice.ai" icon="book">
    เอกสารอ้างอิง Venice API และเอกสารสำหรับนักพัฒนา
  </Card>
  <Card title="ราคา" href="https://venice.ai/pricing" icon="credit-card">
    อัตราเครดิตและแผนของ Venice ในปัจจุบัน
  </Card>
</CardGroup>
