---
read_when:
    - คุณต้องการใช้โมเดล OSS ที่โฮสต์บน Bedrock Mantle กับ OpenClaw
    - คุณต้องใช้เอ็นด์พอยต์ของ Mantle ที่เข้ากันได้กับ OpenAI สำหรับ GPT-OSS, Qwen, Kimi หรือ GLM
    - คุณต้องการใช้ Claude Sonnet 5 หรือ Mythos 5 ผ่าน Amazon Bedrock Mantle
summary: ใช้โมเดล Amazon Bedrock Mantle ที่เข้ากันได้กับ OpenAI และโมเดล Claude Messages ร่วมกับ OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T16:33:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw มีผู้ให้บริการ **Amazon Bedrock Mantle** ที่รวมมาให้ ซึ่งเชื่อมต่อกับ
ตำแหน่งข้อมูล Mantle ที่เข้ากันได้กับ OpenAI โดย Mantle ให้บริการโมเดลโอเพนซอร์สและ
โมเดลจากบุคคลที่สาม (GPT-OSS, Qwen, Kimi, GLM และโมเดลที่คล้ายกัน) ผ่านอินเทอร์เฟซมาตรฐาน
`/v1/chat/completions` ที่ทำงานบนโครงสร้างพื้นฐานของ Bedrock นอกจากนี้ Mantle ยัง
ให้บริการโมเดล Anthropic Claude ผ่านเส้นทาง Anthropic Messages

| คุณสมบัติ       | ค่า                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ    | `amazon-bedrock-mantle`                                                                |
| API            | `openai-completions` สำหรับโมเดล OSS ที่ค้นพบ และ `anthropic-messages` สำหรับโมเดล Claude |
| การยืนยันตัวตน           | `AWS_BEARER_TOKEN_BEDROCK` ที่ระบุอย่างชัดเจน หรือการสร้าง bearer token จากสายโซ่ข้อมูลประจำตัว IAM    |
| รีเจียนเริ่มต้น | `us-east-1` (เขียนทับได้ด้วย `AWS_REGION` หรือ `AWS_DEFAULT_REGION`)                       |

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่ต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Bearer token ที่ระบุโดยตรง">
    **เหมาะที่สุดสำหรับ:** สภาพแวดล้อมที่คุณมี Mantle bearer token อยู่แล้ว

    <Steps>
      <Step title="ตั้งค่า bearer token บนโฮสต์ Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        คุณสามารถตั้งค่ารีเจียนเพิ่มเติมได้ (ค่าเริ่มต้นคือ `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="ตรวจสอบว่าค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        โมเดลที่ค้นพบจะปรากฏภายใต้ผู้ให้บริการ `amazon-bedrock-mantle` โดยไม่จำเป็นต้อง
        กำหนดค่าเพิ่มเติม เว้นแต่คุณต้องการเขียนทับค่าเริ่มต้น
      </Step>
    </Steps>

  </Tab>

  <Tab title="ข้อมูลประจำตัว IAM">
    **เหมาะที่สุดสำหรับ:** การใช้ข้อมูลประจำตัวที่เข้ากันได้กับ AWS SDK (การกำหนดค่าที่ใช้ร่วมกัน, SSO, web identity, instance role หรือ task role)

    <Steps>
      <Step title="กำหนดค่าข้อมูลประจำตัว AWS บนโฮสต์ Gateway">
        สามารถใช้แหล่งการยืนยันตัวตนใดก็ได้ที่เข้ากันได้กับ AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="ตรวจสอบว่าค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        OpenClaw จะสร้าง Mantle bearer token จากสายโซ่ข้อมูลประจำตัวโดยอัตโนมัติ
      </Step>
    </Steps>

    <Tip>
    เมื่อไม่ได้ตั้งค่า `AWS_BEARER_TOKEN_BEDROCK` OpenClaw จะออก bearer token ให้คุณจากสายโซ่ข้อมูลประจำตัวเริ่มต้นของ AWS ซึ่งรวมถึงข้อมูลประจำตัว/โปรไฟล์การกำหนดค่าที่ใช้ร่วมกัน, SSO, web identity และ instance role หรือ task role
    </Tip>

  </Tab>
</Tabs>

## การค้นพบโมเดลโดยอัตโนมัติ

เมื่อตั้งค่า `AWS_BEARER_TOKEN_BEDROCK` แล้ว OpenClaw จะใช้ค่านั้นโดยตรง มิฉะนั้น
OpenClaw จะพยายามสร้าง Mantle bearer token จากสายโซ่ข้อมูลประจำตัวเริ่มต้นของ
AWS จากนั้นจะค้นพบโมเดล Mantle ที่พร้อมใช้งานด้วยการเรียกตำแหน่งข้อมูล
`/v1/models` ของรีเจียนนั้น

| ลักษณะการทำงาน          | รายละเอียด                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| แคชการค้นพบ   | แคชผลลัพธ์เป็นเวลา 1 ชั่วโมงต่อรีเจียน หากการดึงข้อมูลล้มเหลว ระบบจะคืนผลลัพธ์ล่าสุดในแคช |
| การรีเฟรชโทเค็น IAM | ทุก 2 ชั่วโมง โดยแยกแคชตามรีเจียน                                                     |

หากต้องการเปิดใช้งาน Plugin Mantle ต่อไป แต่ระงับการค้นพบอัตโนมัติและการสร้าง
IAM bearer token ให้ปิดสวิตช์การค้นพบที่ Plugin เป็นเจ้าของ:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer token นี้คือ `AWS_BEARER_TOKEN_BEDROCK` เดียวกับที่ผู้ให้บริการมาตรฐาน [Amazon Bedrock](/th/providers/bedrock) ใช้
</Note>

### รีเจียนที่รองรับ

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`

## การกำหนดค่าด้วยตนเอง

หากคุณต้องการระบุการกำหนดค่าอย่างชัดเจนแทนการค้นพบอัตโนมัติ:

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

รายการ `models` ที่ระบุอย่างชัดเจนและไม่ว่างจะถือเป็นข้อมูลหลัก และแทนที่
ทุกรายการที่ค้นพบ รวมถึงรายการ Claude ด้านล่าง ละเว้น `models` เพื่อคง
แค็ตตาล็อก Mantle อัตโนมัติไว้ หรือระบุรายการโมเดล Claude ทั้งหมดที่คุณ
ต้องการใช้

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การรองรับการให้เหตุผล">
    ระบบจะอนุมานการรองรับการให้เหตุผลจากรหัสโมเดลที่มีรูปแบบ เช่น
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` หรือ
    `gpt-oss-safeguard-120b` โดย OpenClaw จะตั้งค่า `reasoning: true` โดยอัตโนมัติ
    สำหรับโมเดลที่ตรงกันระหว่างการค้นพบ
  </Accordion>

  <Accordion title="ตำแหน่งข้อมูลไม่พร้อมใช้งาน">
    หากตำแหน่งข้อมูล Mantle ไม่พร้อมใช้งาน ไม่ส่งคืนโมเดล หรือการแก้ไข
    bearer token ล้มเหลว การค้นพบจะคืนผลลัพธ์ว่างและข้ามผู้ให้บริการ
    โดยนัย OpenClaw จะไม่แสดงข้อผิดพลาด และผู้ให้บริการอื่นที่กำหนดค่าไว้
    จะยังคงทำงานตามปกติ
  </Accordion>

  <Accordion title="Claude ผ่านเส้นทาง Anthropic Messages">
    เมื่อการค้นพบอัตโนมัติเป็นเจ้าของรายการโมเดล OpenClaw จะเพิ่มโมเดล Claude
    สี่รายการหลังจากค้นหาสำเร็จ ไม่ว่า `/v1/models` จะส่งคืนอะไร:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) และ
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5) รวมถึง
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview) โมเดลเหล่านี้ใช้อินเทอร์เฟซ API `anthropic-messages` และสตรีมผ่าน
    ตำแหน่งข้อมูลที่เข้ากันได้กับ Anthropic ซึ่งยืนยันตัวตนด้วย bearer token เดียวกัน
    (`<mantle-base>/anthropic`) ดังนั้น bearer token ของ AWS จึงไม่ถูกใช้เสมือนเป็น
    คีย์ API ของ Anthropic

    Claude Sonnet 5 ใช้การคิดแบบปรับตัวเสมอ และมีค่าเริ่มต้นของระดับความพยายามเป็น `high`
    `/think off` และ `/think minimal` จะถูกแมปเป็น `low` เนื่องจากเส้นทาง Mantle
    ไม่สามารถปิดการคิดได้ นอกจากนี้ OpenClaw ยังละเว้นค่า temperature แบบกำหนดเองสำหรับ
    คำขอของ Sonnet 5

    Claude Mythos 5 จำกัดการเข้าถึง โดยเผยแพร่หน้าต่างบริบทขนาด 1,000,000 โทเค็น
    และขีดจำกัดเอาต์พุต 128,000 โทเค็น ใช้การคิดแบบปรับตัวเสมอ แมป
    `/think off` และ `/think minimal` เป็น `low` และละเว้น
    พารามิเตอร์การสุ่มตัวอย่างที่ผู้เรียกเลือก

    Claude Mythos Preview ขอใช้การให้เหตุผลเสมอ โดยมีค่าเริ่มต้นของระดับความพยายามเป็น `high`
    เมื่อไม่ได้ตั้งค่าระดับ `/think` (แมป `xhigh`/`max` ลงเป็น
    `high` และ `minimal` ขึ้นเป็น `low`) Opus 4.7 บน Mantle สตรีมโดยไม่มี
    การให้เหตุผลที่โมเดลส่งมา และ OpenClaw จะละเว้นพารามิเตอร์ `temperature`
    เนื่องจาก Opus 4.7 ไม่ยอมรับการเขียนทับการสุ่มตัวอย่างบนเส้นทางนี้ ส่วน Mythos
    Preview ยอมรับการเขียนทับ `temperature` ตามปกติ

    รายการ `models.providers["amazon-bedrock-mantle"].models` ที่ระบุอย่างชัดเจน
    และไม่ว่างจะแทนที่แค็ตตาล็อกที่ค้นพบทั้งหมด ละเว้นรายการดังกล่าวเมื่อคุณ
    ต้องการใช้รายการ Claude ในตัวเหล่านี้

  </Accordion>

  <Accordion title="ความสัมพันธ์กับผู้ให้บริการ Amazon Bedrock">
    Bedrock Mantle เป็นผู้ให้บริการที่แยกจากผู้ให้บริการมาตรฐาน
    [Amazon Bedrock](/th/providers/bedrock) โดย Mantle ใช้อินเทอร์เฟซ `/v1`
    ที่เข้ากันได้กับ OpenAI สำหรับแค็ตตาล็อก OSS ขณะที่ผู้ให้บริการ Bedrock
    มาตรฐานใช้ Bedrock Converse API แบบเนทีฟ

    ผู้ให้บริการทั้งสองใช้ข้อมูลประจำตัว `AWS_BEARER_TOKEN_BEDROCK` เดียวกัน
    เมื่อมีการตั้งค่าไว้

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/th/providers/bedrock" icon="cloud">
    ผู้ให้บริการ Bedrock แบบเนทีฟสำหรับ Anthropic Claude, Titan และโมเดลอื่น
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการนำข้อมูลประจำตัวกลับมาใช้ซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้ไข
  </Card>
</CardGroup>
