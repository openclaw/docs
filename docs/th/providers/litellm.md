---
read_when:
    - คุณต้องการกำหนดเส้นทาง OpenClaw ผ่านพร็อกซี LiteLLM
    - คุณต้องการการติดตามค่าใช้จ่าย การบันทึกล็อก หรือการกำหนดเส้นทางโมเดลผ่าน LiteLLM
summary: เรียกใช้ OpenClaw ผ่าน LiteLLM Proxy เพื่อการเข้าถึงโมเดลแบบรวมศูนย์และการติดตามค่าใช้จ่าย
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T10:12:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) คือ Gateway LLM แบบโอเพนซอร์สที่มี API แบบรวมศูนย์สำหรับผู้ให้บริการโมเดลมากกว่า 100 ราย เชื่อม OpenClaw ผ่าน LiteLLM เพื่อให้ได้การติดตามค่าใช้จ่าย การบันทึก log และความยืดหยุ่นในการสลับ backend โดยไม่ต้องเปลี่ยน config ของ OpenClaw

<Tip>
**ทำไมต้องใช้ LiteLLM กับ OpenClaw?**

- **การติดตามค่าใช้จ่าย** — ดูได้อย่างชัดเจนว่า OpenClaw ใช้จ่ายกับโมเดลทั้งหมดเท่าไร
- **การกำหนดเส้นทางโมเดล** — สลับระหว่าง Claude, GPT-4, Gemini, Bedrock โดยไม่ต้องเปลี่ยน config
- **คีย์เสมือน** — สร้างคีย์พร้อมขีดจำกัดการใช้จ่ายสำหรับ OpenClaw
- **การบันทึก log** — log คำขอ/คำตอบแบบเต็มสำหรับการ debug
- **Fallback** — failover อัตโนมัติหากผู้ให้บริการหลักของคุณล่ม

</Tip>

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="Onboarding (recommended)">
    **เหมาะที่สุดสำหรับ:** เส้นทางที่เร็วที่สุดในการตั้งค่า LiteLLM ให้ใช้งานได้

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        สำหรับการตั้งค่าแบบไม่โต้ตอบกับ proxy ระยะไกล ให้ส่ง URL ของ proxy อย่างชัดเจน:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **เหมาะที่สุดสำหรับ:** การควบคุมการติดตั้งและ config อย่างเต็มรูปแบบ

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        เท่านี้ก็เรียบร้อย ตอนนี้ OpenClaw จะกำหนดเส้นทางผ่าน LiteLLM
      </Step>
    </Steps>

  </Tab>
</Tabs>

## การกำหนดค่า

### ตัวแปรสภาพแวดล้อม

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### ไฟล์ config

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

LiteLLM ยังสามารถรองรับเครื่องมือ `image_generate` ผ่านเส้นทางที่เข้ากันได้กับ OpenAI
อย่าง `/images/generations` และ `/images/edits` กำหนดค่าโมเดลภาพของ LiteLLM
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

URL ของ LiteLLM แบบ loopback เช่น `http://localhost:4000` ใช้งานได้โดยไม่ต้องมีการแทนที่
เครือข่ายส่วนตัวแบบ global สำหรับ proxy ที่โฮสต์บน LAN ให้ตั้งค่า
`models.providers.litellm.request.allowPrivateNetwork: true` เพราะ API key
จะถูกส่งไปยังโฮสต์ proxy ที่กำหนดค่าไว้

<AccordionGroup>
  <Accordion title="Virtual keys">
    สร้างคีย์เฉพาะสำหรับ OpenClaw พร้อมขีดจำกัดการใช้จ่าย:

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

  <Accordion title="Model routing">
    LiteLLM สามารถกำหนดเส้นทางคำขอโมเดลไปยัง backend ต่าง ๆ ได้ กำหนดค่าใน `config.yaml` ของ LiteLLM:

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

    OpenClaw ยังคงขอ `claude-opus-4-6` — LiteLLM จะจัดการการกำหนดเส้นทางให้

  </Accordion>

  <Accordion title="Viewing usage">
    ตรวจสอบ dashboard หรือ API ของ LiteLLM:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - LiteLLM ทำงานบน `http://localhost:4000` ตามค่าเริ่มต้น
    - OpenClaw เชื่อมต่อผ่าน endpoint `/v1` ของ LiteLLM ที่เข้ากันได้กับ OpenAI
      ในรูปแบบ proxy
    - การปรับรูปแบบคำขอสำหรับ OpenAI แบบ native เท่านั้นจะไม่มีผลผ่าน LiteLLM:
      ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี hint ของ prompt-cache และไม่มี
      การปรับ payload ให้เข้ากันได้กับ reasoning ของ OpenAI
    - header แสดงที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`)
      จะไม่ถูกฉีดเข้าไปใน URL ฐานของ LiteLLM แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

<Note>
สำหรับการกำหนดค่าผู้ให้บริการทั่วไปและพฤติกรรม failover โปรดดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    เอกสารทางการของ LiteLLM และข้อมูลอ้างอิง API
  </Card>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    ข้อมูลอ้างอิง config แบบเต็ม
  </Card>
  <Card title="Model selection" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
</CardGroup>
