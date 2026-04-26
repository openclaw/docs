---
read_when:
    - คุณต้องการกำหนดเส้นทาง OpenClaw ผ่านพร็อกซี LiteLLM
    - คุณต้องการการติดตามค่าใช้จ่าย การบันทึกล็อก หรือการกำหนดเส้นทางโมเดลผ่าน LiteLLM
summary: เรียกใช้ OpenClaw ผ่าน LiteLLM Proxy เพื่อการเข้าถึงโมเดลแบบรวมศูนย์และการติดตามต้นทุน
title: LiteLLM
x-i18n:
    generated_at: "2026-04-26T11:40:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) เป็น LLM gateway แบบโอเพนซอร์สที่มอบ API แบบรวมศูนย์สำหรับผู้ให้บริการโมเดลมากกว่า 100 ราย กำหนดเส้นทาง OpenClaw ผ่าน LiteLLM เพื่อรับการติดตามค่าใช้จ่ายแบบรวมศูนย์ การบันทึกล็อก และความยืดหยุ่นในการสลับแบ็กเอนด์โดยไม่ต้องเปลี่ยนการตั้งค่า OpenClaw ของคุณ

<Tip>
**ทำไมต้องใช้ LiteLLM กับ OpenClaw?**

- **การติดตามค่าใช้จ่าย** — ดูได้อย่างชัดเจนว่า OpenClaw ใช้จ่ายกับทุกโมเดลไปเท่าไร
- **การกำหนดเส้นทางโมเดล** — สลับระหว่าง Claude, GPT-4, Gemini, Bedrock ได้โดยไม่ต้องเปลี่ยนการตั้งค่า
- **คีย์เสมือน** — สร้างคีย์พร้อมขีดจำกัดงบประมาณสำหรับ OpenClaw
- **การบันทึกล็อก** — บันทึกล็อกคำขอ/คำตอบแบบครบถ้วนเพื่อการดีบัก
- **Fallbacks** — สลับไปใช้งานสำรองโดยอัตโนมัติหากผู้ให้บริการหลักของคุณไม่พร้อมใช้งาน

</Tip>

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="การตั้งค่าเริ่มต้น (แนะนำ)">
    **เหมาะสำหรับ:** วิธีที่เร็วที่สุดในการทำให้ LiteLLM ใช้งานได้

    <Steps>
      <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="การตั้งค่าด้วยตนเอง">
    **เหมาะสำหรับ:** การควบคุมการติดตั้งและการตั้งค่าอย่างเต็มรูปแบบ

    <Steps>
      <Step title="เริ่ม LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="ชี้ OpenClaw ไปที่ LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        เท่านี้ก็เรียบร้อย OpenClaw จะกำหนดเส้นทางผ่าน LiteLLM แล้ว
      </Step>
    </Steps>

  </Tab>
</Tabs>

## การกำหนดค่า

### ตัวแปรสภาพแวดล้อม

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### ไฟล์คอนฟิก

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## การกำหนดค่าขั้นสูง

### การสร้างภาพ

LiteLLM ยังสามารถรองรับเครื่องมือ `image_generate` ผ่านเส้นทาง OpenAI-compatible
`/images/generations` และ `/images/edits` ได้ด้วย กำหนดค่าโมเดลภาพของ LiteLLM
ภายใต้ `agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

URL ของ LiteLLM แบบ loopback เช่น `http://localhost:4000` ใช้งานได้โดยไม่ต้องมี
การอนุญาตเครือข่ายส่วนตัวแบบส่วนกลาง สำหรับพร็อกซีที่โฮสต์อยู่บน LAN ให้ตั้งค่า
`models.providers.litellm.request.allowPrivateNetwork: true` เนื่องจาก API key
จะถูกส่งไปยังโฮสต์พร็อกซีที่กำหนดค่าไว้

<AccordionGroup>
  <Accordion title="คีย์เสมือน">
    สร้างคีย์เฉพาะสำหรับ OpenClaw พร้อมขีดจำกัดงบประมาณ:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    ใช้คีย์ที่สร้างขึ้นเป็น `LITELLM_API_KEY`

  </Accordion>

  <Accordion title="การกำหนดเส้นทางโมเดล">
    LiteLLM สามารถกำหนดเส้นทางคำขอโมเดลไปยังแบ็กเอนด์ที่แตกต่างกันได้ กำหนดค่าใน `config.yaml` ของ LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw จะยังคงร้องขอ `claude-opus-4-6` — LiteLLM จะจัดการการกำหนดเส้นทางเอง

  </Accordion>

  <Accordion title="การดูการใช้งาน">
    ตรวจสอบแดชบอร์ดหรือ API ของ LiteLLM:

    ```bash
    # ข้อมูลคีย์
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # บันทึกการใช้จ่าย
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับพฤติกรรมของพร็อกซี">
    - LiteLLM ทำงานบน `http://localhost:4000` โดยค่าเริ่มต้น
    - OpenClaw เชื่อมต่อผ่านเอนด์พอยต์ `/v1` แบบ OpenAI-compatible สไตล์พร็อกซีของ LiteLLM
    - การจัดรูปแบบคำขอแบบเฉพาะ OpenAI ดั้งเดิมจะไม่มีผลเมื่อผ่าน LiteLLM:
      ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มีคำใบ้ prompt-cache และไม่มี
      การจัดรูปแบบ payload เพื่อความเข้ากันได้กับ OpenAI reasoning
    - เฮดเดอร์การระบุที่มาที่ซ่อนอยู่ของ OpenClaw (`originator`, `version`, `User-Agent`)
      จะไม่ถูกแทรกใน base URL ของ LiteLLM แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

<Note>
สำหรับการกำหนดค่าผู้ให้บริการทั่วไปและพฤติกรรม failover โปรดดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เอกสาร LiteLLM" href="https://docs.litellm.ai" icon="book">
    เอกสารอย่างเป็นทางการและข้อมูลอ้างอิง API ของ LiteLLM
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    ข้อมูลอ้างอิงการตั้งค่าแบบเต็ม
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
</CardGroup>
