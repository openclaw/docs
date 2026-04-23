---
read_when:
    - คุณต้องการใช้โมเดล OSS ที่โฮสต์บน Bedrock Mantle กับ OpenClaw
    - คุณต้องการปลายทางที่เข้ากันได้กับ OpenAI ของ Mantle สำหรับ GPT-OSS, Qwen, Kimi หรือ GLM
summary: ใช้โมเดล Amazon Bedrock Mantle (ที่เข้ากันได้กับ OpenAI) กับ OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T10:21:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw มี provider **Amazon Bedrock Mantle** แบบ bundled ซึ่งเชื่อมต่อกับ
ปลายทาง Mantle ที่เข้ากันได้กับ OpenAI โดย Mantle โฮสต์โมเดลโอเพนซอร์สและ
โมเดลของบุคคลที่สาม (GPT-OSS, Qwen, Kimi, GLM และลักษณะใกล้เคียง) ผ่านพื้นผิว
`/v1/chat/completions` มาตรฐานที่ทำงานอยู่บนโครงสร้างพื้นฐานของ Bedrock

| คุณสมบัติ     | ค่า                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------- |
| Provider ID   | `amazon-bedrock-mantle`                                                                     |
| API           | `openai-completions` (เข้ากันได้กับ OpenAI) หรือ `anthropic-messages` (เส้นทาง Anthropic Messages) |
| Auth          | `AWS_BEARER_TOKEN_BEDROCK` แบบ explicit หรือการสร้าง bearer token จาก IAM credential chain |
| ภูมิภาคเริ่มต้น | `us-east-1` (override ได้ด้วย `AWS_REGION` หรือ `AWS_DEFAULT_REGION`)                      |

## เริ่มต้นใช้งาน

เลือกวิธี auth ที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Bearer token แบบ explicit">
    **เหมาะที่สุดสำหรับ:** สภาพแวดล้อมที่คุณมี Mantle bearer token อยู่แล้ว

    <Steps>
      <Step title="ตั้งค่า bearer token บนโฮสต์ของ gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        จะตั้งค่าภูมิภาคด้วยก็ได้ (ค่าเริ่มต้นคือ `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="ตรวจสอบว่าพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        โมเดลที่ค้นพบจะปรากฏภายใต้ provider `amazon-bedrock-mantle` โดยไม่
        ต้องมีคอนฟิกเพิ่มเติม เว้นแต่คุณต้องการ override ค่าเริ่มต้น
      </Step>
    </Steps>

  </Tab>

  <Tab title="ข้อมูลรับรอง IAM">
    **เหมาะที่สุดสำหรับ:** การใช้ข้อมูลรับรองที่เข้ากันได้กับ AWS SDK (shared config, SSO, web identity, instance role หรือ task role)

    <Steps>
      <Step title="ตั้งค่าข้อมูลรับรอง AWS บนโฮสต์ของ gateway">
        แหล่ง auth ใด ๆ ที่เข้ากันได้กับ AWS SDK ใช้งานได้ทั้งหมด:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="ตรวจสอบว่าพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        OpenClaw จะสร้าง Mantle bearer token จาก credential chain โดยอัตโนมัติ
      </Step>
    </Steps>

    <Tip>
    เมื่อไม่ได้ตั้งค่า `AWS_BEARER_TOKEN_BEDROCK` OpenClaw จะสร้าง bearer token ให้คุณจาก AWS default credential chain รวมถึง shared credentials/config profiles, SSO, web identity และ instance role หรือ task role
    </Tip>

  </Tab>
</Tabs>

## การค้นหาโมเดลอัตโนมัติ

เมื่อมีการตั้งค่า `AWS_BEARER_TOKEN_BEDROCK` OpenClaw จะใช้ค่านั้นโดยตรง มิฉะนั้น
OpenClaw จะพยายามสร้าง Mantle bearer token จาก AWS default
credential chain จากนั้นจะค้นหาโมเดล Mantle ที่พร้อมใช้งานโดย query ไปยัง
ปลายทาง `/v1/models` ของภูมิภาคนั้น

| พฤติกรรม            | รายละเอียด              |
| ------------------- | ---------------------- |
| แคชการค้นหา         | แคชผลลัพธ์ไว้ 1 ชั่วโมง |
| การรีเฟรช IAM token | ทุก 1 ชั่วโมง           |

<Note>
bearer token นี้คือ `AWS_BEARER_TOKEN_BEDROCK` ตัวเดียวกันกับที่ใช้ใน provider [Amazon Bedrock](/th/providers/bedrock) มาตรฐาน
</Note>

### ภูมิภาคที่รองรับ

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`

## การตั้งค่าด้วยตนเอง

หากคุณต้องการใช้คอนฟิกแบบ explicit แทนการค้นหาอัตโนมัติ:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="การรองรับ reasoning">
    การรองรับ reasoning จะถูกอนุมานจาก model ID ที่มีรูปแบบอย่าง
    `thinking`, `reasoner` หรือ `gpt-oss-120b` OpenClaw จะตั้งค่า `reasoning: true`
    ให้กับโมเดลที่ตรงเงื่อนไขโดยอัตโนมัติระหว่างการค้นหา
  </Accordion>

  <Accordion title="ปลายทางไม่พร้อมใช้งาน">
    หากปลายทาง Mantle ไม่พร้อมใช้งานหรือไม่ส่งคืนโมเดลใด ๆ provider นี้จะ
    ถูกข้ามแบบเงียบ ๆ OpenClaw จะไม่แสดงข้อผิดพลาด; provider อื่นที่ตั้งค่าไว้
    จะยังคงทำงานตามปกติ
  </Accordion>

  <Accordion title="Claude Opus 4.7 ผ่านเส้นทาง Anthropic Messages">
    Mantle ยังเปิดเผยเส้นทาง Anthropic Messages ซึ่งส่งโมเดล Claude ผ่านเส้นทางสตรีมมิงที่ยืนยันตัวตนด้วย bearer เดียวกัน Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) สามารถเรียกใช้ผ่านเส้นทางนี้ได้ด้วยสตรีมมิงที่ provider เป็นเจ้าของ ดังนั้น AWS bearer token จะไม่ถูกปฏิบัติเสมือนเป็น Anthropic API key

    เมื่อคุณปักหมุดโมเดล Anthropic Messages บน provider Mantle, OpenClaw จะใช้พื้นผิว API แบบ `anthropic-messages` แทน `openai-completions` สำหรับโมเดลนั้น Auth ยังคงมาจาก `AWS_BEARER_TOKEN_BEDROCK` (หรือ IAM bearer token ที่สร้างขึ้น)

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ความสัมพันธ์กับ provider Amazon Bedrock">
    Bedrock Mantle เป็น provider ที่แยกจาก provider
    [Amazon Bedrock](/th/providers/bedrock) มาตรฐาน โดย Mantle ใช้พื้นผิว
    `/v1` ที่เข้ากันได้กับ OpenAI ขณะที่ provider Bedrock มาตรฐานใช้
    Bedrock API แบบ native

    ทั้งสอง provider ใช้ข้อมูลรับรอง `AWS_BEARER_TOKEN_BEDROCK` ร่วมกันเมื่อ
    มีการตั้งค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/th/providers/bedrock" icon="cloud">
    Provider Bedrock แบบ native สำหรับ Anthropic Claude, Titan และโมเดลอื่น ๆ
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้ไข
  </Card>
</CardGroup>
