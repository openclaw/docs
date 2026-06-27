---
read_when:
    - คุณต้องการใช้โมเดล OSS ที่โฮสต์บน Bedrock Mantle กับ OpenClaw
    - คุณต้องใช้เอนด์พอยต์ที่เข้ากันได้กับ OpenAI ของ Mantle สำหรับ GPT-OSS, Qwen, Kimi หรือ GLM
summary: ใช้โมเดล Amazon Bedrock Mantle (เข้ากันได้กับ OpenAI) กับ OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T18:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw มี provider **Amazon Bedrock Mantle** ที่รวมมาให้ ซึ่งเชื่อมต่อกับ
endpoint ที่เข้ากันได้กับ OpenAI ของ Mantle Mantle โฮสต์โมเดลโอเพนซอร์สและ
โมเดลของบุคคลที่สาม (GPT-OSS, Qwen, Kimi, GLM และโมเดลลักษณะคล้ายกัน) ผ่านพื้นผิว
`/v1/chat/completions` มาตรฐานที่รองรับด้วยโครงสร้างพื้นฐานของ Bedrock

| คุณสมบัติ       | ค่า                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Provider ID    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (เข้ากันได้กับ OpenAI) หรือ `anthropic-messages` (เส้นทาง Anthropic Messages) |
| การรับรองตัวตน           | `AWS_BEARER_TOKEN_BEDROCK` แบบระบุชัดเจน หรือการสร้าง bearer-token จากเชนข้อมูลประจำตัว IAM         |
| region เริ่มต้น | `us-east-1` (แทนที่ได้ด้วย `AWS_REGION` หรือ `AWS_DEFAULT_REGION`)                            |

## เริ่มต้นใช้งาน

เลือกวิธีการรับรองตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Bearer token แบบระบุชัดเจน">
    **เหมาะที่สุดสำหรับ:** สภาพแวดล้อมที่คุณมี Mantle bearer token อยู่แล้ว

    <Steps>
      <Step title="ตั้งค่า bearer token บนโฮสต์ Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        เลือกตั้งค่า region ได้ (ค่าเริ่มต้นคือ `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="เลือกเข้าร่วมการแชร์ข้อมูล provider สำหรับ Claude Fable 5">
        Claude Fable 5 และโมเดล Bedrock ระดับ Claude Mythos ต้องใช้โหมด Mantle Data Retention API `provider_data_share` ก่อนเรียกใช้งาน การเลือกเข้าร่วมนี้อนุญาตให้ Bedrock แชร์พรอมป์และผลลัพธ์การเติมเต็มกับ Anthropic และเก็บรักษาไว้ได้นานสูงสุด 30 วันเพื่อการตรวจสอบความน่าเชื่อถือและความปลอดภัย

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        ใช้โมเดล Bedrock อื่นใน config หากคุณไม่สามารถยอมรับโหมดการเก็บรักษานั้นได้
      </Step>
      <Step title="ตรวจสอบว่าค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        โมเดลที่ค้นพบจะแสดงภายใต้ provider `amazon-bedrock-mantle` ไม่จำเป็นต้องมี
        config เพิ่มเติม เว้นแต่คุณต้องการแทนที่ค่าเริ่มต้น
      </Step>
    </Steps>

  </Tab>

  <Tab title="ข้อมูลประจำตัว IAM">
    **เหมาะที่สุดสำหรับ:** การใช้ข้อมูลประจำตัวที่เข้ากันได้กับ AWS SDK (config ที่แชร์, SSO, web identity, instance หรือ task roles)

    <Steps>
      <Step title="กำหนดค่าข้อมูลประจำตัว AWS บนโฮสต์ Gateway">
        แหล่งการรับรองตัวตนใด ๆ ที่เข้ากันได้กับ AWS SDK สามารถใช้ได้:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="ตรวจสอบว่าค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        OpenClaw สร้าง Mantle bearer token จากเชนข้อมูลประจำตัวโดยอัตโนมัติ
      </Step>
    </Steps>

    <Tip>
    เมื่อไม่ได้ตั้งค่า `AWS_BEARER_TOKEN_BEDROCK` OpenClaw จะออก bearer token ให้คุณจากเชนข้อมูลประจำตัวเริ่มต้นของ AWS รวมถึง shared credentials/config profiles, SSO, web identity และ instance หรือ task roles
    </Tip>

  </Tab>
</Tabs>

## การค้นพบโมเดลอัตโนมัติ

เมื่อมีการตั้งค่า `AWS_BEARER_TOKEN_BEDROCK` OpenClaw จะใช้ค่านั้นโดยตรง มิฉะนั้น
OpenClaw จะพยายามสร้าง Mantle bearer token จากเชนข้อมูลประจำตัวเริ่มต้นของ AWS
จากนั้นจะค้นพบโมเดล Mantle ที่พร้อมใช้งานโดย query endpoint `/v1/models`
ของ region

| พฤติกรรม          | รายละเอียด                    |
| ----------------- | ------------------------- |
| แคชการค้นพบ   | แคชผลลัพธ์ไว้ 1 ชั่วโมง |
| การรีเฟรช token IAM | ทุกชั่วโมง                    |

หากต้องการเปิดใช้งาน Mantle plugin ไว้ แต่ปิดการค้นพบอัตโนมัติและการสร้าง
IAM bearer-token ให้ปิด toggle การค้นพบที่ plugin เป็นเจ้าของ:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer token เป็น `AWS_BEARER_TOKEN_BEDROCK` ตัวเดียวกับที่ provider [Amazon Bedrock](/th/providers/bedrock) มาตรฐานใช้
</Note>

### Region ที่รองรับ

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## การกำหนดค่าด้วยตนเอง

หากคุณต้องการ config แบบระบุชัดเจนแทนการค้นพบอัตโนมัติ:

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

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การรองรับ reasoning">
    การรองรับ reasoning จะอนุมานจาก ID โมเดลที่มีรูปแบบอย่างเช่น
    `thinking`, `reasoner` หรือ `gpt-oss-120b` OpenClaw ตั้งค่า `reasoning: true`
    โดยอัตโนมัติสำหรับโมเดลที่ตรงกันระหว่างการค้นพบ
  </Accordion>

  <Accordion title="Endpoint ไม่พร้อมใช้งาน">
    หาก endpoint ของ Mantle ไม่พร้อมใช้งานหรือไม่ส่งคืนโมเดล provider จะถูก
    ข้ามไปแบบเงียบ ๆ OpenClaw จะไม่แสดงข้อผิดพลาด; provider อื่นที่กำหนดค่าไว้
    จะยังทำงานได้ตามปกติ
  </Accordion>

  <Accordion title="Claude Opus 4.7 ผ่านเส้นทาง Anthropic Messages">
    Mantle ยังเปิดเผยเส้นทาง Anthropic Messages ที่ส่งผ่านโมเดล Claude ผ่านเส้นทาง streaming ที่รับรองตัวตนด้วย bearer เดียวกัน Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) สามารถเรียกผ่านเส้นทางนี้ด้วย streaming ที่ provider เป็นเจ้าของ ดังนั้น AWS bearer token จะไม่ถูกปฏิบัติเหมือน Anthropic API keys

    เมื่อคุณ pin โมเดล Anthropic Messages บน Mantle provider OpenClaw จะใช้พื้นผิว API `anthropic-messages` แทน `openai-completions` สำหรับโมเดลนั้น การรับรองตัวตนยังคงมาจาก `AWS_BEARER_TOKEN_BEDROCK` (หรือ IAM bearer token ที่ออกให้)

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

  <Accordion title="ความสัมพันธ์กับ Amazon Bedrock provider">
    Bedrock Mantle เป็น provider แยกต่างหากจาก provider
    [Amazon Bedrock](/th/providers/bedrock) มาตรฐาน Mantle ใช้พื้นผิว `/v1`
    ที่เข้ากันได้กับ OpenAI ขณะที่ provider Bedrock มาตรฐานใช้
    API ของ Bedrock แบบ native

    provider ทั้งสองใช้ข้อมูลประจำตัว `AWS_BEARER_TOKEN_BEDROCK` ร่วมกันเมื่อ
    มีอยู่

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/th/providers/bedrock" icon="cloud">
    provider Bedrock แบบ native สำหรับ Anthropic Claude, Titan และโมเดลอื่น ๆ
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model refs และพฤติกรรม failover
  </Card>
  <Card title="OAuth และการรับรองตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการรับรองตัวตนและกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและวิธีแก้ไข
  </Card>
</CardGroup>
