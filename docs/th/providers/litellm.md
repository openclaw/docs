---
read_when:
    - คุณต้องการกำหนดเส้นทางให้ OpenClaw ผ่านพร็อกซี LiteLLM
    - คุณต้องการการติดตามค่าใช้จ่าย การบันทึกล็อก หรือการกำหนดเส้นทางโมเดลผ่าน LiteLLM
summary: เรียกใช้ OpenClaw ผ่าน LiteLLM Proxy เพื่อรวมศูนย์การเข้าถึงโมเดลและติดตามค่าใช้จ่าย
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T16:35:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) คือเกตเวย์ LLM แบบโอเพนซอร์สที่มี API แบบรวมศูนย์สำหรับผู้ให้บริการโมเดลมากกว่า 100 ราย
กำหนดเส้นทาง OpenClaw ผ่าน LiteLLM เพื่อรวมศูนย์การติดตามค่าใช้จ่าย การบันทึกล็อก คีย์เสมือนพร้อม
ขีดจำกัดการใช้จ่าย และการสลับไปใช้แบ็กเอนด์สำรอง โดยไม่ต้องเปลี่ยนการกำหนดค่า OpenClaw

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="การเริ่มต้นใช้งาน (แนะนำ)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    สำหรับการตั้งค่าแบบไม่โต้ตอบกับพร็อกซีระยะไกล ให้ระบุ URL ของพร็อกซีอย่างชัดเจน:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="การตั้งค่าด้วยตนเอง">
    <Steps>
      <Step title="เริ่ม LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="เชื่อมต่อ OpenClaw กับ LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## การกำหนดค่า

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

โมเดลเริ่มต้นที่การเริ่มต้นใช้งานเขียนลงในการกำหนดค่าคือ `litellm/claude-opus-4-6`

## การสร้างรูปภาพ

LiteLLM สามารถรองรับเครื่องมือ `image_generate` ผ่านเส้นทาง `/images/generations` และ
`/images/edits` ที่เข้ากันได้กับ OpenAI โมเดลรูปภาพเริ่มต้นคือ `gpt-image-2`; หากต้องการใช้โมเดลอื่น ให้กำหนดค่าภายใต้
`agents.defaults.imageGenerationModel`:

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

URL ของ LiteLLM แบบ local loopback (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) ใช้งานได้
โดยไม่ต้องตั้งค่าการอนุญาตเครือข่ายส่วนตัวแบบส่วนกลาง สำหรับพร็อกซีที่โฮสต์บน LAN ให้ตั้งค่า
`models.providers.litellm.request.allowPrivateNetwork: true` เนื่องจากระบบจะส่งคีย์ API ไปยังโฮสต์นั้น

## ขั้นสูง

<AccordionGroup>
  <Accordion title="คีย์เสมือน">
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
    LiteLLM สามารถกำหนดเส้นทางคำขอโมเดลไปยังแบ็กเอนด์ต่าง ๆ ได้ กำหนดค่าใน `config.yaml` ของ LiteLLM:

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

    OpenClaw ยังคงส่งคำขอไปยัง `claude-opus-4-6`; LiteLLM จะจัดการการกำหนดเส้นทาง

  </Accordion>

  <Accordion title="การดูข้อมูลการใช้งาน">
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
    - โดยค่าเริ่มต้น LiteLLM ทำงานที่ `http://localhost:4000`
    - OpenClaw เชื่อมต่อผ่านปลายทาง `/v1` ที่เข้ากันได้กับ OpenAI ในรูปแบบพร็อกซีของ LiteLLM
    - การจัดรูปแบบคำขอที่ใช้เฉพาะกับ OpenAI โดยตรงจะไม่มีผลเมื่อเชื่อมต่อผ่าน URL ฐานของ LiteLLM ที่กำหนดค่าไว้:
      ไม่มี `service_tier`, ไม่มี `store` ของ Responses, ไม่มีคำแนะนำสำหรับแคชพรอมต์ และไม่มีการจัดรูปแบบเพย์โหลด
      ระดับความพยายามในการให้เหตุผลของ OpenAI
    - ส่วนหัวระบุที่มาของ OpenClaw ที่ซ่อนไว้ (`originator`, `version`, `User-Agent`) จะส่งไปยัง
      ปลายทาง OpenAI โดยตรงที่ผ่านการตรวจสอบแล้วเท่านั้น จึงไม่มีการแทรกส่วนหัวเหล่านี้เมื่อใช้ URL ฐาน LiteLLM แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

<Note>
สำหรับการกำหนดค่าผู้ให้บริการทั่วไปและพฤติกรรมการสลับไปใช้ระบบสำรอง โปรดดู[ผู้ให้บริการโมเดล](/th/concepts/model-providers)
</Note>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เอกสาร LiteLLM" href="https://docs.litellm.ai" icon="book">
    เอกสารอย่างเป็นทางการและเอกสารอ้างอิง API ของ LiteLLM
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
  <Card title="โมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
</CardGroup>
