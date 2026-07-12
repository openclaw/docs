---
read_when:
    - คุณต้องการการอนุมานที่เน้นความเป็นส่วนตัวใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า Venice AI
summary: ใช้โมเดลที่เน้นความเป็นส่วนตัวของ Venice AI ใน OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T16:41:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) ให้บริการการอนุมานที่เน้นความเป็นส่วนตัว โดยโมเดลแบบเปิดทำงาน
โดยไม่มีการบันทึกข้อมูล พร้อมการเข้าถึง Claude, GPT, Gemini และ Grok ผ่านพร็อกซีแบบไม่ระบุตัวตน
ปลายทางทั้งหมดเข้ากันได้กับ OpenAI (`/v1`)

## โหมดความเป็นส่วนตัว

| โหมด              | ลักษณะการทำงาน                                                                  | โมเดล                                                         |
| ----------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **ส่วนตัว**       | ไม่มีการจัดเก็บหรือบันทึกพรอมต์/การตอบกลับ และข้อมูลจะคงอยู่เพียงชั่วคราว       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored เป็นต้น |
| **ไม่ระบุตัวตน** | ส่งผ่านพร็อกซีของ Venice โดยลบเมทาดาทาก่อนส่งต่อ                                | Claude, GPT, Gemini, Grok                                     |

<Warning>
โมเดลแบบไม่ระบุตัวตนไม่ได้เป็นส่วนตัวอย่างสมบูรณ์ Venice จะลบเมทาดาทาก่อนส่งต่อ แต่ผู้ให้บริการเบื้องหลัง (OpenAI, Anthropic, Google, xAI) ยังคงประมวลผลคำขออยู่ ให้ใช้โมเดลแบบส่วนตัวเมื่อต้องการความเป็นส่วนตัวอย่างสมบูรณ์
</Warning>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="รับคีย์ API">
    1. สมัครที่ [venice.ai](https://venice.ai)
    2. ไปที่ **Settings > API Keys > Create new key**
    3. คัดลอกคีย์ API ของคุณ (รูปแบบ: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="กำหนดค่า OpenClaw">
    <Tabs>
      <Tab title="แบบโต้ตอบ (แนะนำ)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        ระบบจะขอคีย์ API (หรือนำ `VENICE_API_KEY` ที่มีอยู่มาใช้ซ้ำ) แสดงรายการโมเดล Venice ที่พร้อมใช้งาน และตั้งค่าโมเดลเริ่มต้นของคุณ
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

- **ค่าเริ่มต้น**: `venice/kimi-k2-5` (ส่วนตัว, ใช้เหตุผล, รองรับการมองเห็น)
- **ตัวเลือกแบบไม่ระบุตัวตนที่มีประสิทธิภาพสูงสุด**: `venice/claude-opus-4-6`

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

คุณยังสามารถเรียกใช้ `openclaw configure` แล้วเลือก **ผู้ให้บริการโมเดล/การยืนยันตัวตน > Venice AI**

<Tip>
| กรณีการใช้งาน                    | โมเดล                              | เหตุผล                                                |
| --------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| การสนทนาทั่วไป (ค่าเริ่มต้น)     | `kimi-k2-5`                        | การใช้เหตุผลแบบส่วนตัวที่มีประสิทธิภาพและรองรับการมองเห็น |
| คุณภาพโดยรวมดีที่สุด             | `claude-opus-4-6`                  | ตัวเลือก Venice แบบไม่ระบุตัวตนที่มีประสิทธิภาพสูงสุด |
| ความเป็นส่วนตัว + การเขียนโค้ด   | `qwen3-coder-480b-a35b-instruct`   | โมเดลเขียนโค้ดแบบส่วนตัวที่มีบริบทขนาดใหญ่             |
| รวดเร็ว + ราคาประหยัด            | `qwen3-4b`                         | โมเดลใช้เหตุผลน้ำหนักเบา                              |
| งานส่วนตัวที่ซับซ้อน             | `deepseek-v3.2`                    | ใช้เหตุผลได้ดี แต่ปิดใช้การเรียกเครื่องมือ             |
| ไม่มีการเซ็นเซอร์                | `venice-uncensored`                | ไม่มีข้อจำกัดด้านเนื้อหา                               |
</Tip>

## แค็ตตาล็อกในตัว (38 โมเดล)

<AccordionGroup>
  <Accordion title="โมเดลส่วนตัว (26) — เป็นส่วนตัวอย่างสมบูรณ์ ไม่มีการบันทึกข้อมูล">
    | รหัสโมเดล                              | ชื่อ                                  | บริบท   | หมายเหตุ                              |
    | -------------------------------------- | ------------------------------------- | ------- | ------------------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | ค่าเริ่มต้น, ใช้เหตุผล, รองรับการมองเห็น |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k    | ใช้เหตุผล                              |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | ใช้งานทั่วไป                           |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | ใช้งานทั่วไป                           |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | ใช้งานทั่วไป, ปิดใช้เครื่องมือ         |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | ใช้เหตุผล                              |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | ใช้งานทั่วไป                           |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k    | การเขียนโค้ด                           |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | การเขียนโค้ด                           |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | ใช้เหตุผล, รองรับการมองเห็น            |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | ใช้งานทั่วไป                           |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k    | รองรับการมองเห็น                       |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k     | รวดเร็ว, ใช้เหตุผล                     |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | ใช้เหตุผล, ปิดใช้เครื่องมือ            |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k     | ไม่มีการเซ็นเซอร์, ปิดใช้เครื่องมือ    |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k    | รองรับการมองเห็น                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | รองรับการมองเห็น                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | ใช้งานทั่วไป                           |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | ใช้งานทั่วไป                           |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | ใช้เหตุผล                              |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | ใช้งานทั่วไป                           |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | ใช้เหตุผล                              |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | ใช้เหตุผล                              |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | ใช้เหตุผล                              |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k    | ใช้เหตุผล                              |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | ใช้เหตุผล                              |
  </Accordion>

  <Accordion title="โมเดลแบบไม่ระบุตัวตน (12) — ผ่านพร็อกซีของ Venice">
    | รหัสโมเดล                       | ชื่อ                              | บริบท   | หมายเหตุ                                  |
    | -------------------------------- | -------------------------------- | ------- | ----------------------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (ผ่าน Venice)    | 1M      | ใช้เหตุผล, รองรับการมองเห็น               |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (ผ่าน Venice)  | 1M      | ใช้เหตุผล, รองรับการมองเห็น               |
    | `openai-gpt-54`                 | GPT-5.4 (ผ่าน Venice)            | 1M      | ใช้เหตุผล, รองรับการมองเห็น               |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (ผ่าน Venice)      | 400k    | ใช้เหตุผล, รองรับการมองเห็น, การเขียนโค้ด |
    | `openai-gpt-52`                 | GPT-5.2 (ผ่าน Venice)            | 256k    | ใช้เหตุผล                                  |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (ผ่าน Venice)      | 256k    | ใช้เหตุผล, รองรับการมองเห็น, การเขียนโค้ด |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (ผ่าน Venice)             | 128k    | รองรับการมองเห็น                           |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (ผ่าน Venice)        | 128k    | รองรับการมองเห็น                           |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (ผ่าน Venice)     | 1M      | ใช้เหตุผล, รองรับการมองเห็น               |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (ผ่าน Venice)       | 198k    | ใช้เหตุผล, รองรับการมองเห็น               |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (ผ่าน Venice)     | 256k    | ใช้เหตุผล, รองรับการมองเห็น               |
    | `grok-41-fast`                  | Grok 4.1 Fast (ผ่าน Venice)      | 1M      | ใช้เหตุผล, รองรับการมองเห็น               |
  </Accordion>
</AccordionGroup>

โมเดล Venice ที่ใช้ Grok เป็นระบบเบื้องหลัง (`grok-41-fast` และโมเดลที่คล้ายกัน) จะได้รับแพตช์
ความเข้ากันได้ของสคีมาเครื่องมือแบบเดียวกับผู้ให้บริการ xAI โดยตรง เนื่องจากใช้รูปแบบ
การเรียกเครื่องมือจากระบบต้นทางแบบเดียวกัน

## การค้นหาโมเดล

แค็ตตาล็อกที่รวมมาให้ข้างต้นเป็นรายการเริ่มต้นที่อ้างอิงจากไฟล์ manifest ขณะทำงาน OpenClaw
จะรีเฟรชรายการจาก API `/models` ของ Venice และย้อนกลับไปใช้รายการเริ่มต้นหาก
ไม่สามารถเข้าถึง API ได้ ปลายทาง `/models` เป็นแบบสาธารณะ (ไม่ต้องยืนยันตัวตนเพื่อ
แสดงรายการ) แต่การอนุมานต้องใช้คีย์ API ที่ถูกต้อง

## พฤติกรรมการเล่นซ้ำของ DeepSeek V4

หาก Venice เปิดให้ใช้โมเดล DeepSeek V4 เช่น `deepseek-v4-pro` หรือ
`deepseek-v4-flash` OpenClaw จะเติมฟิลด์เล่นซ้ำ `reasoning_content` ที่จำเป็น
ในข้อความของผู้ช่วยเมื่อ Venice ไม่ได้ส่งฟิลด์นี้มา และจะนำ `thinking`/
`reasoning`/`reasoning_effort` ออกจากเพย์โหลดคำขอ (Venice ปฏิเสธ
การควบคุม `thinking` แบบเนทีฟของ DeepSeek สำหรับโมเดลเหล่านี้) การแก้ไขการเล่นซ้ำนี้
แยกจากการควบคุมการคิดของผู้ให้บริการ DeepSeek แบบเนทีฟ

## การสตรีมและการรองรับเครื่องมือ

| คุณสมบัติ            | การรองรับ                                                   |
| -------------------- | ----------------------------------------------------------- |
| การสตรีม             | ทุกโมเดล                                                     |
| การเรียกฟังก์ชัน     | โมเดลส่วนใหญ่ โดยปิดใช้เป็นรายโมเดลตามที่ระบุไว้ข้างต้น     |
| การมองเห็น/รูปภาพ    | โมเดลที่ระบุว่า "รองรับการมองเห็น" ข้างต้น                  |
| โหมด JSON            | ผ่าน `response_format`                                      |

## ราคา

Venice ใช้ระบบเครดิต โมเดลแบบไม่ระบุตัวตนมีค่าใช้จ่ายใกล้เคียงกับ
ราคา API โดยตรง บวกค่าธรรมเนียมเล็กน้อยของ Venice โปรดดู
[venice.ai/pricing](https://venice.ai/pricing) สำหรับอัตราปัจจุบัน

## ตัวอย่างการใช้งาน

```bash
# Default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ระบบไม่รู้จักคีย์ API">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    ตรวจสอบว่าคีย์ขึ้นต้นด้วย `vapi_`

  </Accordion>

  <Accordion title="โมเดลไม่พร้อมใช้งาน">
    เรียกใช้ `openclaw models list --all --provider venice` เพื่อดูโมเดลที่
    พร้อมใช้งานในปัจจุบัน แค็ตตาล็อกจะเปลี่ยนแปลงเมื่อ Venice เพิ่มหรือเลิกให้บริการโมเดล
  </Accordion>

  <Accordion title="ปัญหาการเชื่อมต่อ">
    API ของ Venice อยู่ที่ `https://api.venice.ai/api/v1` ตรวจสอบว่าเครือข่ายของคุณอนุญาตการเชื่อมต่อ HTTPS ไปยังโฮสต์ดังกล่าว
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวอย่างไฟล์การกำหนดค่า">
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

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    หน้าแรกของ Venice AI และการลงทะเบียนบัญชี
  </Card>
  <Card title="เอกสารประกอบ API" href="https://docs.venice.ai" icon="book">
    เอกสารอ้างอิง Venice API และเอกสารสำหรับนักพัฒนา
  </Card>
  <Card title="ราคา" href="https://venice.ai/pricing" icon="credit-card">
    อัตราเครดิตและแผนบริการปัจจุบันของ Venice
  </Card>
</CardGroup>
