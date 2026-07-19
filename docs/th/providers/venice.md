---
read_when:
    - คุณต้องการการอนุมานที่เน้นความเป็นส่วนตัวใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า Venice AI
summary: ใช้โมเดลที่เน้นความเป็นส่วนตัวของ Venice AI ใน OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-19T07:33:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 13c32b783394eb3092ff94a532b69e34c00624127b0e76e4e2812751d39073a1
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) ให้บริการอนุมานที่เน้นความเป็นส่วนตัว: โมเดลแบบเปิดทำงาน
โดยไม่มีการบันทึกข้อมูล พร้อมการเข้าถึง Claude, GPT, Gemini และ Grok ผ่านพร็อกซีแบบไม่ระบุตัวตน
ปลายทางทั้งหมดเข้ากันได้กับ OpenAI (`/v1`)

## โหมดความเป็นส่วนตัว

| โหมด           | ลักษณะการทำงาน                                                         | โมเดล                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **ส่วนตัว**    | ไม่มีการจัดเก็บหรือบันทึกพรอมต์/คำตอบ มีผลชั่วคราว         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored เป็นต้น |
| **ไม่ระบุตัวตน** | ส่งผ่านพร็อกซีของ Venice โดยลบข้อมูลเมตาก่อนส่งต่อ | Claude, GPT, Gemini, Grok                                     |

<Warning>
โมเดลแบบไม่ระบุตัวตนไม่ได้เป็นส่วนตัวอย่างสมบูรณ์ Venice จะลบข้อมูลเมตาก่อนส่งต่อ แต่ผู้ให้บริการเบื้องหลัง (OpenAI, Anthropic, Google, xAI) ยังคงประมวลผลคำขอ ใช้โมเดลส่วนตัวเมื่อต้องการความเป็นส่วนตัวอย่างสมบูรณ์
</Warning>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="รับคีย์ API">
    1. ลงทะเบียนที่ [venice.ai](https://venice.ai)
    2. ไปที่ **Settings > API Keys > Create new key**
    3. คัดลอกคีย์ API (รูปแบบ: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="กำหนดค่า OpenClaw">
    <Tabs>
      <Tab title="แบบโต้ตอบ (แนะนำ)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        ระบบจะขอคีย์ API (หรือนำ `VENICE_API_KEY` ที่มีอยู่มาใช้ซ้ำ) แสดงรายการโมเดล Venice ที่พร้อมใช้งาน และตั้งค่าโมเดลเริ่มต้น
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
    openclaw agent --model venice/kimi-k2-5 --message "สวัสดี คุณทำงานอยู่หรือไม่"
    ```
  </Step>
</Steps>

## การเลือกโมเดล

- **ค่าเริ่มต้น**: `venice/kimi-k2-5` (ส่วนตัว, การให้เหตุผล, การมองเห็น)
- **ตัวเลือกแบบไม่ระบุตัวตนที่ทรงประสิทธิภาพที่สุด**: `venice/claude-opus-4-6`

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

นอกจากนี้ยังสามารถเรียกใช้ `openclaw configure` แล้วเลือก **ผู้ให้บริการโมเดล/การยืนยันตัวตน > Venice AI**

<Tip>
| กรณีใช้งาน              | โมเดล                                        | เหตุผล                                    |
| --------------------- | -------------------------------------------- | -------------------------------------- |
| แชตทั่วไป (ค่าเริ่มต้น) | `kimi-k2-5`                                  | การให้เหตุผลแบบส่วนตัวที่มีประสิทธิภาพพร้อมการมองเห็น   |
| คุณภาพโดยรวมดีที่สุด   | `claude-opus-4-6`                            | ตัวเลือก Venice แบบไม่ระบุตัวตนที่ทรงประสิทธิภาพที่สุด     |
| ความเป็นส่วนตัว + การเขียนโค้ด       | `qwen3-coder-480b-a35b-instruct-turbo`       | โมเดลเขียนโค้ดแบบส่วนตัวที่มีบริบทขนาดใหญ่ |
| รวดเร็ว + ประหยัด           | `llama-3.2-3b`                               | โมเดลส่วนตัวขนาดกะทัดรัด                  |
| งานส่วนตัวที่ซับซ้อน  | `deepseek-v3.2`                              | การให้เหตุผลที่มีประสิทธิภาพ; ปิดใช้งานการเรียกเครื่องมือ |
| ไม่เซ็นเซอร์             | `venice-uncensored-1-2`                      | โมเดล Venice แบบไม่เซ็นเซอร์รุ่นปัจจุบัน        |
</Tip>

## แค็ตตาล็อกในตัว (30 โมเดล)

<AccordionGroup>
  <Accordion title="โมเดลส่วนตัว (20) — เป็นส่วนตัวอย่างสมบูรณ์ ไม่มีการบันทึกข้อมูล">
    | ID โมเดล                               | ชื่อ                                 | บริบท | หมายเหตุ                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | ค่าเริ่มต้น, การให้เหตุผล, การมองเห็น  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | ทั่วไป                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | ทั่วไป                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | ทั่วไป, ปิดใช้งานเครื่องมือ     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | การให้เหตุผล                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | ทั่วไป                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | การเขียนโค้ด                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | การให้เหตุผล, การมองเห็น           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | ทั่วไป                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k    | การมองเห็น                      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | การให้เหตุผล, ปิดใช้งานเครื่องมือ    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | การมองเห็น                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | ทั่วไป                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | ทั่วไป                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | การให้เหตุผล                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | ทั่วไป                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | การให้เหตุผล                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | การให้เหตุผล                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | การให้เหตุผล                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | การให้เหตุผล                    |
  </Accordion>

  <Accordion title="โมเดลแบบไม่ระบุตัวตน (10) — ผ่านพร็อกซี Venice">
    | ID โมเดล                        | ชื่อ                           | บริบท | หมายเหตุ                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (ผ่าน Venice)    | 1M      | การให้เหตุผล, การมองเห็น            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (ผ่าน Venice)  | 1M      | การให้เหตุผล, การมองเห็น            |
    | `openai-gpt-54`                 | GPT-5.4 (ผ่าน Venice)            | 1M      | การให้เหตุผล, การมองเห็น            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (ผ่าน Venice)      | 400k    | การให้เหตุผล, การมองเห็น, การเขียนโค้ด     |
    | `openai-gpt-52`                 | GPT-5.2 (ผ่าน Venice)            | 256k    | การให้เหตุผล                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (ผ่าน Venice)      | 256k    | การให้เหตุผล, การมองเห็น, การเขียนโค้ด     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (ผ่าน Venice)             | 128k    | การมองเห็น                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (ผ่าน Venice)        | 128k    | การมองเห็น                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (ผ่าน Venice)     | 1M      | การให้เหตุผล, การมองเห็น             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (ผ่าน Venice)     | 256k    | การให้เหตุผล, การมองเห็น             |
  </Accordion>
</AccordionGroup>

โมเดล Venice ที่มี Grok เป็นระบบเบื้องหลัง (`grok-4-3` และรุ่นที่คล้ายกัน) จะได้รับแพตช์ความเข้ากันได้ของสคีมาเครื่องมือ
แบบเดียวกับผู้ให้บริการ xAI แบบเนทีฟ เนื่องจากใช้รูปแบบ
การเรียกเครื่องมือจากระบบต้นทางเดียวกัน

## การค้นหาโมเดล

แค็ตตาล็อกแบบรวมชุดข้างต้นเป็นรายการตั้งต้นที่อ้างอิงจากไฟล์แมนิเฟสต์ ขณะรันไทม์ OpenClaw
จะรีเฟรชรายการจาก API `/models` ของ Venice และย้อนกลับไปใช้รายการตั้งต้นหาก
ไม่สามารถเข้าถึง API ได้ ปลายทาง `/models` เป็นสาธารณะ (ไม่ต้องยืนยันตัวตนสำหรับ
การแสดงรายการ) แต่การอนุมานต้องใช้คีย์ API ที่ถูกต้อง

Venice อาจยังคงยอมรับ ID โมเดลที่เลิกใช้แล้วในฐานะนามแฝงที่ผู้ให้บริการเป็นเจ้าของ
แค็ตตาล็อก OpenClaw ประกาศเฉพาะ ID โมเดลมาตรฐานที่ `/models` ส่งคืน

## ลักษณะการทำงานของการเล่นซ้ำ DeepSeek V4

หาก Venice เปิดให้ใช้โมเดล DeepSeek V4 เช่น `deepseek-v4-pro` หรือ
`deepseek-v4-flash` OpenClaw จะเติมฟิลด์การเล่นซ้ำ `reasoning_content` ที่จำเป็น
ในข้อความของผู้ช่วยเมื่อ Venice ละเว้นฟิลด์ดังกล่าว และนำ `thinking`/
`reasoning`/`reasoning_effort` ออกจากเพย์โหลดคำขอ (Venice ปฏิเสธ
การควบคุม `thinking` แบบเนทีฟของ DeepSeek สำหรับโมเดลเหล่านี้) การแก้ไขการเล่นซ้ำนี้
แยกจากการควบคุมการคิดของผู้ให้บริการ DeepSeek แบบเนทีฟ

## การรองรับสตรีมมิงและเครื่องมือ

| คุณสมบัติ          | การรองรับ                                           |
| ---------------- | ------------------------------------------------- |
| สตรีมมิง        | ทุกโมเดล                                        |
| การเรียกฟังก์ชัน | โมเดลส่วนใหญ่; ปิดใช้งานเป็นรายโมเดลตามที่ระบุข้างต้น |
| การมองเห็น/รูปภาพ    | โมเดลที่ระบุว่า "การมองเห็น" ข้างต้น                      |
| โหมด JSON        | ผ่าน `response_format`                             |

## ราคา

Venice ใช้ระบบแบบเครดิต โมเดลแบบไม่ระบุตัวตนมีค่าใช้จ่ายใกล้เคียงกับ
ราคา API โดยตรง บวกค่าธรรมเนียม Venice เล็กน้อย ดูอัตราปัจจุบันได้ที่
[venice.ai/pricing](https://venice.ai/pricing)

## ตัวอย่างการใช้งาน

```bash
# โมเดลส่วนตัวเริ่มต้น
openclaw agent --model venice/kimi-k2-5 --message "ตรวจสอบสถานะอย่างรวดเร็ว"

# Claude Opus ผ่าน Venice (ไม่ระบุตัวตน)
openclaw agent --model venice/claude-opus-4-6 --message "สรุปงานนี้"

# โมเดลไม่เซ็นเซอร์
openclaw agent --model venice/venice-uncensored-1-2 --message "ร่างตัวเลือก"

# โมเดลการมองเห็นพร้อมรูปภาพ
openclaw agent --model venice/qwen3-vl-235b-a22b --message "ตรวจสอบรูปภาพที่แนบมา"

# โมเดลเขียนโค้ด
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct-turbo --message "ปรับโครงสร้างฟังก์ชันนี้"
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ระบบไม่รู้จักคีย์ API">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    ยืนยันว่าคีย์ขึ้นต้นด้วย `vapi_`

  </Accordion>

  <Accordion title="โมเดลไม่พร้อมใช้งาน">
    เรียกใช้ `openclaw models list --all --provider venice` เพื่อดูโมเดลที่
    พร้อมใช้งานในขณะนี้; แค็ตตาล็อกจะเปลี่ยนแปลงเมื่อ Venice เพิ่มหรือเลิกใช้โมเดล
  </Accordion>

  <Accordion title="ปัญหาการเชื่อมต่อ">
    API ของ Venice อยู่ที่ `https://api.venice.ai/api/v1` ยืนยันว่าเครือข่ายอนุญาตการเชื่อมต่อ HTTPS ไปยังโฮสต์นั้น
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
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

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานของระบบสำรองเมื่อเกิดข้อขัดข้อง
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    หน้าแรกของ Venice AI และการสมัครบัญชี
  </Card>
  <Card title="เอกสาร API" href="https://docs.venice.ai" icon="book">
    เอกสารอ้างอิง Venice API และเอกสารสำหรับนักพัฒนา
  </Card>
  <Card title="ราคา" href="https://venice.ai/pricing" icon="credit-card">
    อัตราเครดิตและแพ็กเกจปัจจุบันของ Venice
  </Card>
</CardGroup>
