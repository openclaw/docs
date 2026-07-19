---
read_when:
    - คุณต้องการใช้โมเดล Amazon Bedrock กับ OpenClaw
    - คุณต้องตั้งค่าข้อมูลประจำตัวและภูมิภาคของ AWS สำหรับการเรียกใช้โมเดล
summary: ใช้โมเดล Amazon Bedrock (Converse API) กับ OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-19T07:32:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e5d17e929c303c06985889aa68e7081995fd1ef1211d200a767905d73813e11
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw สามารถใช้โมเดล **Amazon Bedrock** ผ่านผู้ให้บริการสตรีมมิง
**Bedrock Converse** ได้ การยืนยันตัวตนของ Bedrock ใช้ **สายโซ่ข้อมูลประจำตัวเริ่มต้นของ AWS SDK**
ไม่ใช่คีย์ API

| คุณสมบัติ | ค่า                                                       |
| -------- | ----------------------------------------------------------- |
| ผู้ให้บริการ | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| การยืนยันตัวตน     | ข้อมูลประจำตัว AWS (ตัวแปรสภาพแวดล้อม การกำหนดค่าที่ใช้ร่วมกัน หรือบทบาทอินสแตนซ์) |
| ภูมิภาค   | `AWS_REGION` หรือ `AWS_DEFAULT_REGION` (ค่าเริ่มต้น: `us-east-1`) |

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่ต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์การเข้าถึง / ตัวแปรสภาพแวดล้อม">
    **เหมาะที่สุดสำหรับ:** เครื่องของนักพัฒนา, CI หรือโฮสต์ที่คุณจัดการข้อมูลประจำตัว AWS โดยตรง

    <Steps>
      <Step title="ตั้งค่าข้อมูลประจำตัว AWS บนโฮสต์ Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # ไม่บังคับ:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # ไม่บังคับ (คีย์ API/โทเค็น bearer ของ Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="เพิ่มผู้ให้บริการและโมเดล Bedrock ลงในการกำหนดค่า">
        ไม่จำเป็นต้องมี `apiKey` กำหนดค่าผู้ให้บริการด้วย `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    เมื่อใช้การยืนยันตัวตนด้วยเครื่องหมายตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` หรือ `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock โดยปริยายโดยอัตโนมัติสำหรับการค้นหาโมเดลโดยไม่ต้องกำหนดค่าเพิ่มเติม
    </Tip>

  </Tab>

  <Tab title="บทบาทอินสแตนซ์ EC2 (IMDS)">
    **เหมาะที่สุดสำหรับ:** อินสแตนซ์ EC2 ที่แนบบทบาท IAM โดยใช้บริการข้อมูลเมตาของอินสแตนซ์สำหรับการยืนยันตัวตน

    <Steps>
      <Step title="เปิดใช้การค้นหาอย่างชัดเจน">
        เมื่อใช้ IMDS OpenClaw ไม่สามารถตรวจพบการยืนยันตัวตน AWS จากเครื่องหมายตัวแปรสภาพแวดล้อมเพียงอย่างเดียว ดังนั้นจึงต้องเลือกเปิดใช้:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="เพิ่มเครื่องหมายตัวแปรสภาพแวดล้อมสำหรับโหมดอัตโนมัติหากต้องการ">
        หากต้องการให้เส้นทางการตรวจจับอัตโนมัติด้วยเครื่องหมายตัวแปรสภาพแวดล้อมทำงานด้วย (ตัวอย่างเช่น สำหรับพื้นผิว `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        คุณ**ไม่**จำเป็นต้องใช้คีย์ API ปลอม
      </Step>
      <Step title="ตรวจสอบว่าค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    บทบาท IAM ที่แนบกับอินสแตนซ์ EC2 ต้องมีสิทธิ์ต่อไปนี้:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (สำหรับการค้นหาอัตโนมัติ)
    - `bedrock:ListInferenceProfiles` (สำหรับการค้นหาโปรไฟล์การอนุมาน)

    หรือแนบนโยบายที่มีการจัดการ `AmazonBedrockFullAccess`
    </Warning>

    <Note>
    คุณต้องใช้ `AWS_PROFILE=default` เฉพาะเมื่อต้องการเครื่องหมายตัวแปรสภาพแวดล้อมสำหรับโหมดอัตโนมัติหรือพื้นผิวสถานะโดยเฉพาะ เส้นทางการยืนยันตัวตนรันไทม์ Bedrock จริงใช้สายโซ่เริ่มต้นของ AWS SDK ดังนั้นการยืนยันตัวตนด้วยบทบาทอินสแตนซ์ IMDS จึงทำงานได้แม้ไม่มีเครื่องหมายตัวแปรสภาพแวดล้อม
    </Note>

  </Tab>
</Tabs>

## การค้นหาโมเดลอัตโนมัติ

OpenClaw สามารถค้นหาโมเดล Bedrock ที่รองรับ **การสตรีม**
และ **เอาต์พุตข้อความ** โดยอัตโนมัติ การค้นหาใช้ `bedrock:ListFoundationModels` และ
`bedrock:ListInferenceProfiles` และผลลัพธ์จะถูกแคชไว้ (ค่าเริ่มต้น: 1 ชั่วโมง)

วิธีเปิดใช้ผู้ให้บริการโดยปริยาย:

- หาก `plugins.entries.amazon-bedrock.config.discovery.enabled` เป็น `true`
  OpenClaw จะลองค้นหาแม้ไม่มีเครื่องหมายตัวแปรสภาพแวดล้อม AWS
- หากไม่ได้ตั้งค่า `plugins.entries.amazon-bedrock.config.discovery.enabled`
  OpenClaw จะเพิ่มผู้ให้บริการ Bedrock โดยปริยายโดยอัตโนมัติ
  เฉพาะเมื่อตรวจพบเครื่องหมายการยืนยันตัวตน AWS รายการใดรายการหนึ่งต่อไปนี้:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` หรือ `AWS_PROFILE`
- เส้นทางการยืนยันตัวตนรันไทม์ Bedrock จริงยังคงใช้สายโซ่เริ่มต้นของ AWS SDK ดังนั้น
  การกำหนดค่าที่ใช้ร่วมกัน, SSO และการยืนยันตัวตนด้วยบทบาทอินสแตนซ์ IMDS จึงทำงานได้ แม้ว่าการค้นหา
  จะต้องใช้ `enabled: true` เพื่อเลือกเปิดใช้ก็ตาม

<Note>
สำหรับรายการ `models.providers["amazon-bedrock"]` ที่กำหนดอย่างชัดเจน OpenClaw ยังสามารถแก้ไขการยืนยันตัวตนด้วยเครื่องหมายตัวแปรสภาพแวดล้อมของ Bedrock ได้ตั้งแต่เนิ่นๆ จากเครื่องหมายตัวแปรสภาพแวดล้อม AWS เช่น `AWS_BEARER_TOKEN_BEDROCK` โดยไม่บังคับให้โหลดการยืนยันตัวตนรันไทม์ทั้งหมด เส้นทางการยืนยันตัวตนสำหรับการเรียกโมเดลจริงยังคงใช้สายโซ่เริ่มต้นของ AWS SDK
</Note>

<AccordionGroup>
  <Accordion title="ตัวเลือกการกำหนดค่าการค้นหา">
    ตัวเลือกการกำหนดค่าอยู่ภายใต้ `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | ตัวเลือก | ค่าเริ่มต้น | คำอธิบาย |
    | ------ | ------- | ----------- |
    | `enabled` | อัตโนมัติ | ในโหมดอัตโนมัติ OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock โดยปริยายเฉพาะเมื่อตรวจพบเครื่องหมายตัวแปรสภาพแวดล้อม AWS ที่รองรับ ตั้งค่า `true` เพื่อบังคับการค้นหา |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | ภูมิภาค AWS ที่ใช้สำหรับการเรียก API การค้นหา |
    | `providerFilter` | (ทั้งหมด) | จับคู่ชื่อผู้ให้บริการ Bedrock (ตัวอย่างเช่น `anthropic`, `amazon`) |
    | `refreshInterval` | `3600` | ระยะเวลาแคชเป็นวินาที ตั้งค่าเป็น `0` เพื่อปิดใช้การแคช |
    | `defaultContextWindow` | `32000` | หน้าต่างบริบทที่ใช้สำหรับโมเดลที่ค้นพบซึ่งไม่มีขีดจำกัดโทเค็นที่ทราบ (เขียนทับหากทราบขีดจำกัดของโมเดล) |
    | `defaultMaxTokens` | `4096` | จำนวนโทเค็นเอาต์พุตสูงสุดที่ใช้สำหรับโมเดลที่ค้นพบซึ่งไม่มีขีดจำกัดโทเค็นที่ทราบ (เขียนทับหากทราบขีดจำกัดของโมเดล) |

  </Accordion>

  <Accordion title="หน้าต่างบริบทและขีดจำกัดโทเค็นสูงสุด">
    API `ListFoundationModels` และ `GetFoundationModel` ของ Bedrock ไม่ส่งคืน
    ข้อมูลเมตาขีดจำกัดโทเค็น แต่ส่งคืนเฉพาะรหัสโมเดล ชื่อ รูปแบบข้อมูล และสถานะ
    วงจรชีวิต OpenClaw มาพร้อมตารางค้นหาของหน้าต่างบริบทและขีดจำกัด
    เอาต์พุตที่ทราบสำหรับโมเดล Bedrock ยอดนิยม (Claude, Nova, Llama, Mistral, DeepSeek
    และอื่นๆ) เพื่อให้การจัดการเซสชัน เกณฑ์ Compaction และ
    การตรวจจับบริบทล้นทำงานอย่างถูกต้องสำหรับโมเดลเหล่านั้น

    โมเดลที่ค้นพบแต่ไม่อยู่ในตารางจะย้อนกลับไปใช้ `defaultContextWindow`
    และ `defaultMaxTokens` หากโมเดลที่ใช้ไม่มีขีดจำกัดที่ถูกต้อง
    ให้เขียนทับด้วยรายการ
    `models.providers["amazon-bedrock"].models` ที่กำหนดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การตั้งค่าด่วน (เส้นทาง AWS)

คำแนะนำนี้จะสร้างบทบาท IAM แนบสิทธิ์ Bedrock เชื่อมโยง
โปรไฟล์อินสแตนซ์ และเปิดใช้การค้นหาของ OpenClaw บนโฮสต์ EC2

```bash
# 1. สร้างบทบาท IAM และโปรไฟล์อินสแตนซ์
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. แนบกับอินสแตนซ์ EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. บนอินสแตนซ์ EC2 ให้เปิดใช้การค้นหาอย่างชัดเจน
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. ไม่บังคับ: เพิ่มเครื่องหมายตัวแปรสภาพแวดล้อมหากต้องการใช้โหมดอัตโนมัติโดยไม่เปิดใช้อย่างชัดเจน
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. ตรวจสอบว่าค้นพบโมเดลแล้ว
openclaw models list
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โปรไฟล์การอนุมาน">
    OpenClaw ค้นพบ **โปรไฟล์การอนุมานระดับภูมิภาคและระดับโลก** ควบคู่ไปกับ
    โมเดลพื้นฐาน เมื่อโปรไฟล์แมปกับโมเดลพื้นฐานที่รู้จัก
    โปรไฟล์จะสืบทอดความสามารถของโมเดลนั้น (หน้าต่างบริบท โทเค็นสูงสุด
    การให้เหตุผล การมองเห็น) และระบบจะแทรกภูมิภาคคำขอ Bedrock ที่ถูกต้อง
    โดยอัตโนมัติ ซึ่งหมายความว่าโปรไฟล์ Claude ข้ามภูมิภาคจะทำงานโดยไม่ต้อง
    เขียนทับผู้ให้บริการด้วยตนเอง โปรไฟล์ข้ามภูมิภาคระดับโลก (`global.*`) จะแสดง
    เป็นอันดับแรกใน `openclaw models list` เนื่องจากโดยทั่วไปให้ความจุที่ดีกว่า
    และการสลับเมื่อเกิดข้อผิดพลาดโดยอัตโนมัติ

    รหัสโปรไฟล์การอนุมานมีลักษณะเช่น `us.anthropic.claude-opus-4-6-v1` (ระดับภูมิภาค)
    หรือ `anthropic.claude-opus-4-6-v1` (ระดับโลก) หากโมเดลเบื้องหลังอยู่ใน
    ผลลัพธ์การค้นหาแล้ว โปรไฟล์จะสืบทอดชุดความสามารถทั้งหมดของโมเดลนั้น
    มิฉะนั้นจะใช้ค่าเริ่มต้นที่ปลอดภัย

    ไม่จำเป็นต้องกำหนดค่าเพิ่มเติม ตราบใดที่เปิดใช้การค้นหาและตัวตน IAM
    มี `bedrock:ListInferenceProfiles` โปรไฟล์จะแสดงควบคู่ไปกับ
    โมเดลพื้นฐานใน `openclaw models list`

  </Accordion>

  <Accordion title="ระดับบริการ">
    โมเดล Bedrock บางรุ่นรองรับพารามิเตอร์ `service_tier` เพื่อปรับให้เหมาะสมด้านต้นทุน
    หรือเวลาแฝง โดยมีระดับต่อไปนี้ให้เลือกใช้:

    | ระดับ | คำอธิบาย |
    |------|-------------|
    | `default` | ระดับมาตรฐานของ Bedrock |
    | `flex` | การประมวลผลที่มีส่วนลดสำหรับเวิร์กโหลดที่ยอมรับเวลาแฝงที่นานขึ้นได้ |
    | `priority` | การประมวลผลแบบมีลำดับความสำคัญสำหรับเวิร์กโหลดที่ไวต่อเวลาแฝง |
    | `reserved` | ความจุที่สำรองไว้สำหรับเวิร์กโหลดในสภาวะคงที่ |

    ตั้งค่า `serviceTier` (หรือ `service_tier`) ผ่าน `agents.defaults.params` สำหรับ
    คำขอโมเดล Bedrock หรือตั้งค่าแยกตามโมเดลใน
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // ใช้กับทุกโมเดล
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // เขียนทับแยกตามโมเดล
              },
            },
          },
        },
      },
    }
    ```

    ค่าที่ใช้ได้คือ `default`, `flex`, `priority` และ `reserved` Claude
    Fable 5 และ Sonnet 5 รองรับเฉพาะระดับ `default`; OpenClaw จะแจ้งเตือนและ
    เพิกเฉยต่อ `flex`, `priority` หรือ `reserved` ที่ร้องขอสำหรับโมเดลเหล่านั้น สำหรับ
    โมเดลอื่น โมเดลแต่ละรายการอาจไม่รองรับทุกระดับ -- ระดับที่ไม่รองรับ
    จะส่งคืนข้อผิดพลาดการตรวจสอบความถูกต้องจาก Bedrock และข้อความข้อผิดพลาดอาจ
    ทำให้เข้าใจผิดได้ (เช่น "The provided model identifier is invalid"
    แทนที่จะระบุว่าระดับเป็นสาเหตุของปัญหา) หากพบข้อผิดพลาดนี้ ให้ตรวจสอบ
    ว่าโมเดลรองรับระดับที่ร้องขอหรือไม่

  </Accordion>

  <Accordion title="อุณหภูมิของ Claude Opus 4.7 และ 4.8">
    Bedrock ปฏิเสธพารามิเตอร์ `temperature` สำหรับ Claude Opus 4.7 และ Opus
    4.8 OpenClaw จะละเว้น `temperature` โดยอัตโนมัติสำหรับการอ้างอิง Bedrock
    ที่ตรงกันทั้งหมด รวมถึง ID โมเดลพื้นฐาน โปรไฟล์การอนุมานที่มีชื่อ โปรไฟล์
    การอนุมานของแอปพลิเคชันซึ่งโมเดลเบื้องหลังได้รับการระบุเป็น Opus 4.7/4.8 ผ่าน
    `bedrock:GetInferenceProfile` และรูปแบบ `opus-4.7`/`opus-4.8` ที่คั่นด้วยจุด
    พร้อมคำนำหน้าภูมิภาคที่เลือกใส่ได้ (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`) ไม่จำเป็นต้องใช้ตัวเลือกการกำหนดค่า และการละเว้นนี้มีผลทั้งกับ
    ออบเจ็กต์ตัวเลือกคำขอและฟิลด์เพย์โหลด `inferenceConfig`
  </Accordion>

  <Accordion title="Claude Fable 5">
    ใช้ `amazon-bedrock/anthropic.claude-fable-5` ใน `us-east-1` หรือ
    ID การอนุมานระดับภูมิภาค เช่น `us.anthropic.claude-fable-5`
    OpenClaw ใช้หน้าต่างบริบท 1M ของ Fable, ขีดจำกัดเอาต์พุต 128K, การคิดแบบปรับตัว
    ที่เปิดใช้งานตลอดเวลา และการแมประดับความพยายามที่รองรับ `/think off` และ
    `/think minimal` จะแมปเป็น `low`; ระบบจะละเว้นตัวควบคุมอุณหภูมิและการบังคับเลือกเครื่องมือ
    ให้ตรงกับเส้นทาง Opus 4.7/4.8 เอาต์พุตแบบสตรีมจะถูกพักไว้
    จนกว่า Bedrock จะส่งคืนสถานะสิ้นสุด เพื่อให้การปฏิเสธระหว่างสตรีมไม่
    เปิดเผยข้อความบางส่วน

    AWS กำหนดให้ยินยอมอย่างชัดแจ้งต่อการเก็บรักษาข้อมูลด้วย `provider_data_share` ก่อน
    จึงจะใช้ Fable ได้ พรอมต์และผลลัพธ์ที่สร้างจะถูกแชร์กับ Anthropic และ
    เก็บรักษาไว้นานสูงสุด 30 วันเพื่อความน่าเชื่อถือและความปลอดภัย โปรดตรวจสอบและกำหนดค่า
    [การเก็บรักษาข้อมูลของ Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    ก่อนเปิดใช้งานโมเดล

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 พร้อมใช้งานผ่าน Bedrock เฉพาะบัญชีที่ได้รับ
    การอนุมัติการเข้าถึงแบบจำกัดตามที่กำหนด OpenClaw รู้จักโมเดลพื้นฐาน
    `anthropic.claude-mythos-5` และโปรไฟล์การอนุมานระดับภูมิภาคหรือส่วนกลาง เช่น
    `us.anthropic.claude-mythos-5`

    OpenClaw ใช้หน้าต่างบริบท 1,000,000 โทเค็น, ขีดจำกัดเอาต์พุต
    128,000 โทเค็น, อินพุตรูปภาพ, การแคชพรอมต์, การสตรีมที่ปลอดภัยเมื่อเกิดการปฏิเสธ และ
    ระดับความพยายามแบบเนทีฟ การคิดแบบปรับตัวจะเปิดใช้งานอยู่เสมอ: `/think off` และ
    `/think minimal` จะแมปเป็น `low` ขณะที่ `xhigh` และ `max` ยังคงพร้อมใช้งาน
    ระบบจะละเว้นค่าการสุ่มตัวอย่างแบบกำหนดเองและการบังคับเลือกเครื่องมือ

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS จัดทำเอกสาร Sonnet 5 สำหรับทั้งเอนด์พอยต์
    [`bedrock-runtime` และ `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html)
    OpenClaw รู้จักโมเดลพื้นฐานของ Bedrock
    `anthropic.claude-sonnet-5` และโปรไฟล์การอนุมานระดับภูมิภาคหรือส่วนกลาง เช่น
    `us.anthropic.claude-sonnet-5` โดยใช้หน้าต่างบริบท 1,000,000 โทเค็น,
    ขีดจำกัดเอาต์พุต 128,000 โทเค็น, อินพุตรูปภาพ, ระดับความพยายามแบบเนทีฟ,
    การแคชพรอมต์ และการสตรีมที่ปลอดภัยเมื่อเกิดการปฏิเสธ

    Bedrock เปิดใช้งานการคิดแบบปรับตัวไว้สำหรับ Sonnet 5 โดยค่าเริ่มต้น OpenClaw ใช้
    `high`; `/think off` และ `/think minimal` จะแมปเป็น `low` เนื่องจากเส้นทางนี้
    ไม่สามารถปิดใช้งานการคิดได้ ระบบจะละเว้นค่าอุณหภูมิแบบกำหนดเองและการบังคับเลือกเครื่องมือ
    ขณะที่การคิดแบบปรับตัวยังทำงานอยู่

  </Accordion>

  <Accordion title="กลไกควบคุมความปลอดภัย">
    สามารถใช้ [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    กับการเรียกใช้โมเดล Bedrock ทั้งหมดได้โดยเพิ่มออบเจ็กต์ `guardrail` ลงในการกำหนดค่า
    Plugin `amazon-bedrock` กลไกควบคุมความปลอดภัยช่วยบังคับใช้การกรองเนื้อหา,
    การปฏิเสธหัวข้อ, ตัวกรองคำ, ตัวกรองข้อมูลที่ละเอียดอ่อน และการตรวจสอบ
    การยึดโยงตามบริบท

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // ID กลไกควบคุมความปลอดภัยหรือ ARN แบบเต็ม
                guardrailVersion: "1", // หมายเลขเวอร์ชันหรือ "DRAFT"
                streamProcessingMode: "sync", // ไม่บังคับ: "sync" หรือ "async"
                trace: "enabled", // ไม่บังคับ: "enabled", "disabled" หรือ "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    ต้องระบุ `guardrailIdentifier` และ `guardrailVersion`

    | ตัวเลือก | คำอธิบาย |
    | ------ | ----------- |
    | `guardrailIdentifier` | ID กลไกควบคุมความปลอดภัย (เช่น `abc123`) หรือ ARN แบบเต็ม (เช่น `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`) |
    | `guardrailVersion` | หมายเลขเวอร์ชันที่เผยแพร่แล้ว หรือ `"DRAFT"` สำหรับฉบับร่างที่กำลังดำเนินการ |
    | `streamProcessingMode` | `"sync"` หรือ `"async"` สำหรับการประเมินกลไกควบคุมความปลอดภัยระหว่างการสตรีม หากละเว้น Bedrock จะใช้ค่าเริ่มต้น |
    | `trace` | `"enabled"` หรือ `"enabled_full"` สำหรับการดีบัก; ให้ละเว้นหรือตั้งเป็น `"disabled"` สำหรับการใช้งานจริง |

    <Warning>
    IAM principal ที่ Gateway ใช้ต้องมีสิทธิ์ `bedrock:ApplyGuardrail` เพิ่มเติมจากสิทธิ์เรียกใช้มาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="การฝังข้อมูลสำหรับการค้นหาหน่วยความจำ">
    Bedrock ยังทำหน้าที่เป็นผู้ให้บริการการฝังข้อมูลสำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้ด้วย โดยกำหนดค่านี้แยกจาก
    ผู้ให้บริการการอนุมาน -- ตั้งค่า `agents.defaults.memorySearch.provider` เป็น `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // ค่าเริ่มต้น
          },
        },
      },
    }
    ```

    การฝังข้อมูลของ Bedrock ใช้สายโซ่ข้อมูลรับรอง AWS SDK เดียวกับการอนุมาน (บทบาท
    อินสแตนซ์, SSO, คีย์การเข้าถึง, การกำหนดค่าที่ใช้ร่วมกัน และเว็บไอเดนทิตี) โดยไม่
    ต้องใช้คีย์ API

    โมเดลการฝังข้อมูลที่รองรับประกอบด้วย Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) และ TwelveLabs Marengo โปรดดู
    [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ -- Bedrock](/th/reference/memory-config#bedrock-embedding-config)
    สำหรับรายการโมเดลทั้งหมดและตัวเลือกมิติ

  </Accordion>

  <Accordion title="หมายเหตุและข้อควรระวัง">
    - Bedrock กำหนดให้เปิดใช้งาน **การเข้าถึงโมเดล** ในบัญชี/ภูมิภาค AWS
    - การค้นหาอัตโนมัติต้องใช้สิทธิ์ `bedrock:ListFoundationModels` และ
      `bedrock:ListInferenceProfiles`
    - หากใช้โหมดอัตโนมัติ ให้ตั้งค่าหนึ่งในตัวบ่งชี้สภาพแวดล้อมการตรวจสอบสิทธิ์ AWS ที่รองรับบน
      โฮสต์ Gateway หากต้องการใช้การตรวจสอบสิทธิ์ด้วย IMDS/การกำหนดค่าที่ใช้ร่วมกันโดยไม่มีตัวบ่งชี้สภาพแวดล้อม ให้ตั้งค่า
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`
    - OpenClaw แสดงแหล่งที่มาของข้อมูลรับรองตามลำดับนี้: `AWS_BEARER_TOKEN_BEDROCK`,
      จากนั้น `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, ตามด้วย `AWS_PROFILE` และสุดท้าย
      สายโซ่ AWS SDK เริ่มต้น
    - การรองรับการใช้เหตุผลขึ้นอยู่กับโมเดล โปรดตรวจสอบการ์ดโมเดล Bedrock สำหรับ
      ความสามารถปัจจุบัน
    - หากต้องการขั้นตอนคีย์แบบมีการจัดการ สามารถวางพร็อกซีที่เข้ากันได้กับ OpenAI
      ไว้หน้า Bedrock และกำหนดค่าเป็นผู้ให้บริการ OpenAI แทนได้
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search" icon="magnifying-glass">
    การฝังข้อมูลของ Bedrock สำหรับการกำหนดค่าการค้นหาหน่วยความจำ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ" href="/th/reference/memory-config#bedrock-embedding-config" icon="database">
    รายการโมเดลการฝังข้อมูล Bedrock ทั้งหมดและตัวเลือกมิติ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
