---
read_when:
    - คุณต้องการกำหนดเส้นทาง OpenClaw ผ่านพร็อกซี LiteLLM
    - คุณต้องการการติดตามต้นทุน การบันทึก log หรือการกำหนดเส้นทางโมเดลผ่าน LiteLLM
summary: รัน OpenClaw ผ่าน LiteLLM Proxy เพื่อการเข้าถึงโมเดลแบบรวมศูนย์และการติดตามต้นทุน
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T10:21:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f9665b204126861a7dbbd426b26a624e60fd219a44756cec6a023df73848cef
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) คือเกตเวย์ LLM แบบโอเพนซอร์สที่ให้ API แบบรวมศูนย์สำหรับผู้ให้บริการโมเดลมากกว่า 100 ราย กำหนดเส้นทาง OpenClaw ผ่าน LiteLLM เพื่อให้ได้การติดตามต้นทุนแบบรวมศูนย์ การบันทึก log และความยืดหยุ่นในการสลับแบ็กเอนด์โดยไม่ต้องเปลี่ยนคอนฟิกของ OpenClaw

<Tip>
**ทำไมจึงควรใช้ LiteLLM กับ OpenClaw?**

- **การติดตามต้นทุน** — ดูได้อย่างชัดเจนว่า OpenClaw ใช้จ่ายเท่าใดในทุกโมเดล
- **การกำหนดเส้นทางโมเดล** — สลับระหว่าง Claude, GPT-4, Gemini, Bedrock ได้โดยไม่ต้องเปลี่ยนคอนฟิก
- **Virtual key** — สร้างคีย์พร้อมขีดจำกัดการใช้จ่ายสำหรับ OpenClaw
- **การบันทึก log** — มี log คำขอ/คำตอบแบบเต็มสำหรับการดีบัก
- **Fallback** — failover อัตโนมัติหาก provider หลักของคุณไม่พร้อมใช้งาน

</Tip>

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="Onboarding (แนะนำ)">
    **เหมาะที่สุดสำหรับ:** เส้นทางที่เร็วที่สุดไปสู่การตั้งค่า LiteLLM ที่ใช้งานได้

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="ตั้งค่าด้วยตนเอง">
    **เหมาะที่สุดสำหรับ:** การควบคุมการติดตั้งและคอนฟิกอย่างเต็มรูปแบบ

    <Steps>
      <Step title="เริ่ม LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="ชี้ OpenClaw ไปยัง LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        เพียงเท่านี้ OpenClaw ก็จะกำหนดเส้นทางผ่าน LiteLLM แล้ว
      </Step>
    </Steps>

  </Tab>
</Tabs>

## การตั้งค่า

### ตัวแปรแวดล้อม

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

## หัวข้อขั้นสูง

<AccordionGroup>
  <Accordion title="Virtual key">
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

  <Accordion title="การกำหนดเส้นทางโมเดล">
    LiteLLM สามารถกำหนดเส้นทางคำขอของโมเดลไปยังแบ็กเอนด์ต่าง ๆ ได้ ให้ตั้งค่าใน `config.yaml` ของ LiteLLM:

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

    OpenClaw จะยังคงร้องขอ `claude-opus-4-6` ต่อไป — LiteLLM จะเป็นผู้จัดการการกำหนดเส้นทาง

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
    - LiteLLM รันบน `http://localhost:4000` เป็นค่าเริ่มต้น
    - OpenClaw เชื่อมต่อผ่านปลายทาง `/v1` ที่เข้ากันได้กับ OpenAI แบบพร็อกซีของ LiteLLM
    - การจัดรูปคำขอแบบ native ที่มีเฉพาะ OpenAI จะไม่ถูกนำมาใช้ผ่าน LiteLLM:
      ไม่มี `service_tier`, ไม่มี `store` ของ Responses, ไม่มี hint ของ prompt-cache และไม่มีการจัดรูป payload เพื่อความเข้ากันได้ของ OpenAI reasoning
    - header แสดงที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`) จะไม่ถูก inject บน base URL แบบกำหนดเองของ LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
สำหรับการตั้งค่า provider ทั่วไปและพฤติกรรม failover โปรดดู [Model Providers](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เอกสาร LiteLLM" href="https://docs.litellm.ai" icon="book">
    เอกสาร LiteLLM อย่างเป็นทางการและเอกสารอ้างอิง API
  </Card>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของ provider ทั้งหมด การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การตั้งค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงคอนฟิกฉบับเต็ม
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและตั้งค่าโมเดล
  </Card>
</CardGroup>
