---
read_when:
    - คุณต้องการใช้โมเดล Amazon Bedrock กับ OpenClaw
    - คุณต้องตั้งค่าข้อมูลรับรองและภูมิภาคของ AWS สำหรับการเรียกใช้โมเดล
summary: ใช้โมเดล Amazon Bedrock (Converse API) กับ OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T16:37:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw สามารถใช้โมเดล **Amazon Bedrock** ผ่านผู้ให้บริการสตรีมมิง
**Bedrock Converse** ได้ การยืนยันตัวตนของ Bedrock ใช้ **สายโซ่ข้อมูลประจำตัวเริ่มต้นของ AWS SDK**
ไม่ใช่คีย์ API

| คุณสมบัติ | ค่า                                                              |
| -------- | ----------------------------------------------------------- |
| ผู้ให้บริการ | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| การยืนยันตัวตน | ข้อมูลประจำตัว AWS (ตัวแปรสภาพแวดล้อม การกำหนดค่าที่ใช้ร่วมกัน หรือบทบาทของอินสแตนซ์) |
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
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="เพิ่มผู้ให้บริการและโมเดล Bedrock ลงในการกำหนดค่า">
        ไม่จำเป็นต้องใช้ `apiKey` กำหนดค่าผู้ให้บริการด้วย `auth: "aws-sdk"`:

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
                    id: "us.anthropic.claude-opus-4-6-v1:0",
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
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
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
    เมื่อใช้การยืนยันตัวตนด้วยตัวบ่งชี้จากสภาพแวดล้อม (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` หรือ `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock โดยนัยโดยอัตโนมัติสำหรับการค้นหาโมเดล โดยไม่ต้องกำหนดค่าเพิ่มเติม
    </Tip>

  </Tab>

  <Tab title="บทบาทของอินสแตนซ์ EC2 (IMDS)">
    **เหมาะที่สุดสำหรับ:** อินสแตนซ์ EC2 ที่ผูกบทบาท IAM ไว้และใช้บริการข้อมูลเมตาของอินสแตนซ์สำหรับการยืนยันตัวตน

    <Steps>
      <Step title="เปิดใช้การค้นหาอย่างชัดเจน">
        เมื่อใช้ IMDS OpenClaw ไม่สามารถตรวจพบการยืนยันตัวตน AWS จากตัวบ่งชี้ในสภาพแวดล้อมเพียงอย่างเดียว ดังนั้นคุณต้องเลือกเปิดใช้:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="เพิ่มตัวบ่งชี้ในสภาพแวดล้อมสำหรับโหมดอัตโนมัติตามต้องการ">
        หากต้องการให้เส้นทางการตรวจหาอัตโนมัติจากตัวบ่งชี้ในสภาพแวดล้อมทำงานด้วย (ตัวอย่างเช่น สำหรับส่วนแสดงผลของ `openclaw status`):

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
    บทบาท IAM ที่ผูกกับอินสแตนซ์ EC2 ของคุณต้องมีสิทธิ์ต่อไปนี้:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (สำหรับการค้นหาอัตโนมัติ)
    - `bedrock:ListInferenceProfiles` (สำหรับการค้นหาโปรไฟล์การอนุมาน)

    หรือผูกนโยบายที่มีการจัดการ `AmazonBedrockFullAccess`
    </Warning>

    <Note>
    คุณต้องใช้ `AWS_PROFILE=default` เฉพาะเมื่อต้องการตัวบ่งชี้ในสภาพแวดล้อมสำหรับโหมดอัตโนมัติหรือส่วนแสดงสถานะโดยเฉพาะ เส้นทางการยืนยันตัวตนของรันไทม์ Bedrock จริงใช้สายโซ่เริ่มต้นของ AWS SDK ดังนั้นการยืนยันตัวตนด้วยบทบาทของอินสแตนซ์ผ่าน IMDS จึงทำงานได้แม้ไม่มีตัวบ่งชี้ในสภาพแวดล้อม
    </Note>

  </Tab>
</Tabs>

## การค้นหาโมเดลอัตโนมัติ

OpenClaw สามารถค้นหาโมเดล Bedrock ที่รองรับ **การสตรีม**
และ **เอาต์พุตข้อความ** ได้โดยอัตโนมัติ การค้นหาใช้ `bedrock:ListFoundationModels` และ
`bedrock:ListInferenceProfiles` และแคชผลลัพธ์ไว้ (ค่าเริ่มต้น: 1 ชั่วโมง)

วิธีเปิดใช้ผู้ให้บริการโดยนัย:

- หาก `plugins.entries.amazon-bedrock.config.discovery.enabled` เป็น `true`
  OpenClaw จะพยายามค้นหาแม้ไม่มีตัวบ่งชี้ AWS ในสภาพแวดล้อม
- หากไม่ได้ตั้งค่า `plugins.entries.amazon-bedrock.config.discovery.enabled`
  OpenClaw จะเพิ่มผู้ให้บริการ Bedrock โดยนัยโดยอัตโนมัติเฉพาะเมื่อพบ
  ตัวบ่งชี้การยืนยันตัวตน AWS อย่างใดอย่างหนึ่งต่อไปนี้:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` หรือ `AWS_PROFILE`
- เส้นทางการยืนยันตัวตนของรันไทม์ Bedrock จริงยังคงใช้สายโซ่เริ่มต้นของ AWS SDK ดังนั้น
  การกำหนดค่าที่ใช้ร่วมกัน, SSO และการยืนยันตัวตนด้วยบทบาทของอินสแตนซ์ผ่าน IMDS
  จึงทำงานได้ แม้ว่าการค้นหาจะต้องใช้ `enabled: true` เพื่อเลือกเปิดใช้ก็ตาม

<Note>
สำหรับรายการ `models.providers["amazon-bedrock"]` ที่กำหนดไว้อย่างชัดเจน OpenClaw ยังสามารถแก้ไขการยืนยันตัวตนของ Bedrock จากตัวบ่งชี้ในสภาพแวดล้อมได้ตั้งแต่เนิ่น ๆ โดยใช้ตัวบ่งชี้ AWS เช่น `AWS_BEARER_TOKEN_BEDROCK` โดยไม่บังคับให้โหลดการยืนยันตัวตนของรันไทม์ทั้งหมด เส้นทางการยืนยันตัวตนสำหรับการเรียกโมเดลจริงยังคงใช้สายโซ่เริ่มต้นของ AWS SDK
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
    | `enabled` | auto | ในโหมดอัตโนมัติ OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock โดยนัยเฉพาะเมื่อพบตัวบ่งชี้ AWS ในสภาพแวดล้อมที่รองรับ ตั้งค่าเป็น `true` เพื่อบังคับให้ค้นหา |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | ภูมิภาค AWS ที่ใช้สำหรับการเรียก API เพื่อค้นหา |
    | `providerFilter` | (ทั้งหมด) | จับคู่ชื่อผู้ให้บริการ Bedrock (ตัวอย่างเช่น `anthropic`, `amazon`) |
    | `refreshInterval` | `3600` | ระยะเวลาแคชเป็นวินาที ตั้งค่าเป็น `0` เพื่อปิดใช้การแคช |
    | `defaultContextWindow` | `32000` | ขนาดหน้าต่างบริบทที่ใช้สำหรับโมเดลที่ค้นพบซึ่งไม่ทราบขีดจำกัดโทเค็น (เขียนทับค่านี้หากคุณทราบขีดจำกัดของโมเดล) |
    | `defaultMaxTokens` | `4096` | จำนวนโทเค็นเอาต์พุตสูงสุดที่ใช้สำหรับโมเดลที่ค้นพบซึ่งไม่ทราบขีดจำกัดโทเค็น (เขียนทับค่านี้หากคุณทราบขีดจำกัดของโมเดล) |

  </Accordion>

  <Accordion title="ขนาดหน้าต่างบริบทและขีดจำกัดโทเค็นสูงสุด">
    API `ListFoundationModels` และ `GetFoundationModel` ของ Bedrock ไม่ส่งคืน
    ข้อมูลเมตาขีดจำกัดโทเค็น แต่ส่งคืนเฉพาะรหัสโมเดล ชื่อ รูปแบบข้อมูล และสถานะ
    วงจรชีวิต OpenClaw มาพร้อมตารางค้นหาขนาดหน้าต่างบริบทและขีดจำกัดเอาต์พุต
    ที่ทราบสำหรับโมเดล Bedrock ยอดนิยม (Claude, Nova, Llama, Mistral, DeepSeek
    และอื่น ๆ) เพื่อให้การจัดการเซสชัน เกณฑ์ Compaction และ
    การตรวจหาบริบทล้นทำงานอย่างถูกต้องสำหรับโมเดลเหล่านั้น

    โมเดลที่ค้นพบแต่ไม่มีอยู่ในตารางจะใช้ `defaultContextWindow`
    และ `defaultMaxTokens` เป็นค่าทดแทน หากโมเดลที่คุณใช้ไม่มีขีดจำกัดที่ถูกต้อง
    ให้เขียนทับด้วยรายการ
    `models.providers["amazon-bedrock"].models` ที่กำหนดไว้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การตั้งค่าแบบรวดเร็ว (เส้นทาง AWS)

คำแนะนำนี้จะสร้างบทบาท IAM ผูกสิทธิ์ Bedrock เชื่อมโยง
โปรไฟล์อินสแตนซ์ และเปิดใช้การค้นหาของ OpenClaw บนโฮสต์ EC2

```bash
# 1. Create IAM role and instance profile
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

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โปรไฟล์การอนุมาน">
    OpenClaw ค้นพบ **โปรไฟล์การอนุมานระดับภูมิภาคและระดับโลก** ควบคู่ไปกับ
    โมเดลพื้นฐาน เมื่อโปรไฟล์เชื่อมโยงกับโมเดลพื้นฐานที่รู้จัก โปรไฟล์จะ
    สืบทอดความสามารถของโมเดลนั้น (ขนาดหน้าต่างบริบท จำนวนโทเค็นสูงสุด
    การให้เหตุผล การมองเห็น) และระบบจะแทรกภูมิภาคคำขอ Bedrock ที่ถูกต้อง
    โดยอัตโนมัติ ซึ่งหมายความว่าโปรไฟล์ Claude แบบข้ามภูมิภาคทำงานได้โดยไม่ต้อง
    เขียนทับผู้ให้บริการด้วยตนเอง โปรไฟล์ข้ามภูมิภาคระดับโลก (`global.*`) จะแสดง
    เป็นอันดับแรกใน `openclaw models list` เนื่องจากโดยทั่วไปให้ความจุที่ดีกว่า
    และมีการสลับระบบเมื่อขัดข้องโดยอัตโนมัติ

    รหัสโปรไฟล์การอนุมานมีรูปแบบเช่น `us.anthropic.claude-opus-4-6-v1:0` (ระดับภูมิภาค)
    หรือ `anthropic.claude-opus-4-6-v1:0` (ระดับโลก) หากโมเดลเบื้องหลังมีอยู่แล้ว
    ในผลลัพธ์การค้นหา โปรไฟล์จะสืบทอดชุดความสามารถทั้งหมดของโมเดลนั้น
    มิฉะนั้นจะใช้ค่าเริ่มต้นที่ปลอดภัย

    ไม่จำเป็นต้องกำหนดค่าเพิ่มเติม ตราบใดที่เปิดใช้การค้นหาและตัวตนหลัก IAM
    มีสิทธิ์ `bedrock:ListInferenceProfiles` โปรไฟล์จะแสดงควบคู่กับ
    โมเดลพื้นฐานใน `openclaw models list`

  </Accordion>

  <Accordion title="ระดับบริการ">
    โมเดล Bedrock บางรุ่นรองรับพารามิเตอร์ `service_tier` เพื่อปรับให้เหมาะสมด้านต้นทุน
    หรือเวลาแฝง ระดับต่อไปนี้พร้อมใช้งาน:

    | ระดับ | คำอธิบาย |
    |------|-------------|
    | `default` | ระดับมาตรฐานของ Bedrock |
    | `flex` | การประมวลผลแบบมีส่วนลดสำหรับภาระงานที่ยอมรับเวลาแฝงยาวนานขึ้นได้ |
    | `priority` | การประมวลผลแบบให้ลำดับความสำคัญสำหรับภาระงานที่ไวต่อเวลาแฝง |
    | `reserved` | ความจุที่สำรองไว้สำหรับภาระงานในสภาวะคงที่ |

    ตั้งค่า `serviceTier` (หรือ `service_tier`) ผ่าน `agents.defaults.params` สำหรับ
    คำขอโมเดล Bedrock หรือตั้งค่าแยกตามโมเดลใน
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    ค่าที่ใช้ได้คือ `default`, `flex`, `priority` และ `reserved` โดย Claude
    Fable 5 และ Sonnet 5 รองรับเฉพาะระดับ `default` เท่านั้น OpenClaw จะแจ้งเตือนและ
    ไม่สนใจ `flex`, `priority` หรือ `reserved` ที่ร้องขอสำหรับโมเดลเหล่านั้น สำหรับ
    โมเดลอื่น ไม่ใช่ทุกโมเดลจะรองรับทุกระดับ -- ระดับที่ไม่รองรับ
    จะทำให้ Bedrock ส่งคืนข้อผิดพลาดในการตรวจสอบความถูกต้อง และข้อความแสดงข้อผิดพลาดอาจ
    ชวนให้เข้าใจผิดได้ (เช่น "ตัวระบุโมเดลที่ระบุไม่ถูกต้อง"
    แทนที่จะระบุว่าปัญหาอยู่ที่ระดับ) หากพบข้อผิดพลาดนี้ ให้ตรวจสอบ
    ว่าโมเดลรองรับระดับที่ร้องขอหรือไม่

  </Accordion>

  <Accordion title="อุณหภูมิของ Claude Opus 4.7 และ 4.8">
    Bedrock ปฏิเสธพารามิเตอร์ `temperature` สำหรับ Claude Opus 4.7 และ Opus
    4.8 OpenClaw จะละเว้น `temperature` โดยอัตโนมัติสำหรับการอ้างอิง Bedrock
    ที่ตรงกันทั้งหมด รวมถึงรหัสโมเดลพื้นฐาน โปรไฟล์การอนุมานที่มีชื่อ โปรไฟล์
    การอนุมานของแอปพลิเคชันซึ่งโมเดลเบื้องหลังถูกแปลงเป็น Opus 4.7/4.8 ผ่าน
    `bedrock:GetInferenceProfile` และรูปแบบ `opus-4.7`/`opus-4.8` ที่ใช้จุดคั่น
    พร้อมคำนำหน้าภูมิภาคซึ่งเป็นทางเลือก (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`) ไม่จำเป็นต้องมีตัวเลือกการกำหนดค่า และการละเว้นนี้ใช้กับทั้ง
    ออบเจ็กต์ตัวเลือกคำขอและฟิลด์เพย์โหลด `inferenceConfig`
  </Accordion>

  <Accordion title="Claude Fable 5">
    ใช้ `amazon-bedrock/anthropic.claude-fable-5` ใน `us-east-1` หรือ
    รหัสการอนุมานระดับภูมิภาค เช่น `us.anthropic.claude-fable-5`
    OpenClaw ใช้หน้าต่างบริบท 1M ของ Fable, ขีดจำกัดเอาต์พุต 128K, การคิดแบบ
    ปรับตัวที่เปิดใช้งานตลอดเวลา และการแมประดับความพยายามที่รองรับ `/think off` และ
    `/think minimal` จะแมปเป็น `low` ส่วนการควบคุมอุณหภูมิและการบังคับเลือกเครื่องมือ
    จะถูกละเว้น ซึ่งสอดคล้องกับเส้นทาง Opus 4.7/4.8 เอาต์พุตแบบสตรีมจะถูกพักไว้
    จนกว่า Bedrock จะส่งคืนสถานะสิ้นสุด เพื่อไม่ให้การปฏิเสธระหว่างสตรีม
    เปิดเผยข้อความบางส่วน

    AWS กำหนดให้ต้องเลือกยินยอมอย่างชัดเจนผ่าน `provider_data_share` สำหรับการเก็บรักษาข้อมูล
    ก่อนจึงจะใช้งาน Fable ได้ พรอมป์และผลลัพธ์จะถูกแชร์กับ Anthropic และ
    เก็บรักษาไว้นานสูงสุด 30 วันเพื่อวัตถุประสงค์ด้านความน่าเชื่อถือและความปลอดภัย โปรดตรวจสอบและกำหนดค่า
    [การเก็บรักษาข้อมูลของ Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    ก่อนเปิดใช้งานโมเดล

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 ใช้งานผ่าน Bedrock ได้เฉพาะบัญชีที่ได้รับ
    การอนุมัติสิทธิ์เข้าถึงแบบจำกัดที่จำเป็น OpenClaw รู้จักโมเดลพื้นฐาน
    `anthropic.claude-mythos-5` และโปรไฟล์การอนุมานระดับภูมิภาคหรือส่วนกลาง เช่น
    `us.anthropic.claude-mythos-5`

    OpenClaw ใช้หน้าต่างบริบท 1,000,000 โทเค็น ขีดจำกัดเอาต์พุต
    128,000 โทเค็น อินพุตรูปภาพ การแคชพรอมป์ การสตรีมที่ปลอดภัยเมื่อเกิดการปฏิเสธ และ
    ระดับความพยายามแบบเนทีฟ การคิดแบบปรับตัวจะเปิดใช้งานเสมอ: `/think off` และ
    `/think minimal` จะแมปเป็น `low` ขณะที่ `xhigh` และ `max` ยังคงใช้ได้
    ค่าการสุ่มตัวอย่างแบบกำหนดเองและการบังคับเลือกเครื่องมือจะถูกละเว้น

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS จัดทำเอกสาร Sonnet 5 สำหรับทั้งเอนด์พอยต์
    [`bedrock-runtime` และ `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html)
    OpenClaw รู้จักโมเดลพื้นฐานของ Bedrock
    `anthropic.claude-sonnet-5` และโปรไฟล์การอนุมานระดับภูมิภาคหรือส่วนกลาง เช่น
    `us.anthropic.claude-sonnet-5` โดยใช้หน้าต่างบริบท 1,000,000 โทเค็น
    ขีดจำกัดเอาต์พุต 128,000 โทเค็น อินพุตรูปภาพ ระดับความพยายามแบบเนทีฟ
    การแคชพรอมป์ และการสตรีมที่ปลอดภัยเมื่อเกิดการปฏิเสธ

    Bedrock เปิดใช้งานการคิดแบบปรับตัวไว้สำหรับ Sonnet 5 โดย OpenClaw ใช้ค่าเริ่มต้นเป็น
    `high` ส่วน `/think off` และ `/think minimal` จะแมปเป็น `low` เนื่องจากเส้นทางนี้
    ไม่สามารถปิดใช้งานการคิดได้ ค่าอุณหภูมิแบบกำหนดเองและค่าการบังคับเลือกเครื่องมือ
    จะถูกละเว้นขณะที่การคิดแบบปรับตัวทำงานอยู่

  </Accordion>

  <Accordion title="มาตรการควบคุม">
    คุณสามารถใช้ [มาตรการควบคุมของ Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    กับการเรียกใช้โมเดล Bedrock ทั้งหมดได้โดยเพิ่มออบเจ็กต์ `guardrail` ลงในการกำหนดค่า
    Plugin `amazon-bedrock` มาตรการควบคุมช่วยให้คุณบังคับใช้การกรองเนื้อหา
    การปฏิเสธหัวข้อ ตัวกรองคำ ตัวกรองข้อมูลละเอียดอ่อน และการตรวจสอบ
    การยึดโยงตามบริบทได้

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
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
    | `guardrailIdentifier` | รหัสมาตรการควบคุม (เช่น `abc123`) หรือ ARN แบบเต็ม (เช่น `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`) |
    | `guardrailVersion` | หมายเลขเวอร์ชันที่เผยแพร่แล้ว หรือ `"DRAFT"` สำหรับฉบับร่างที่กำลังดำเนินการ |
    | `streamProcessingMode` | `"sync"` หรือ `"async"` สำหรับการประเมินมาตรการควบคุมระหว่างการสตรีม หากละเว้น Bedrock จะใช้ค่าเริ่มต้น |
    | `trace` | `"enabled"` หรือ `"enabled_full"` สำหรับการแก้ไขข้อบกพร่อง สำหรับสภาพแวดล้อมจริงให้ละเว้นหรือตั้งเป็น `"disabled"` |

    <Warning>
    ตัวตนหลัก IAM ที่ Gateway ใช้ต้องมีสิทธิ์ `bedrock:ApplyGuardrail` เพิ่มเติมจากสิทธิ์เรียกใช้มาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="Embedding สำหรับการค้นหาหน่วยความจำ">
    Bedrock สามารถทำหน้าที่เป็นผู้ให้บริการ Embedding สำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้เช่นกัน โดยกำหนดค่าแยกจาก
    ผู้ให้บริการอนุมาน -- ตั้งค่า `agents.defaults.memorySearch.provider` เป็น `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Embedding ของ Bedrock ใช้สายโซ่ข้อมูลประจำตัว AWS SDK เดียวกับการอนุมาน (บทบาท
    อินสแตนซ์, SSO, คีย์การเข้าถึง, การกำหนดค่าที่ใช้ร่วมกัน และข้อมูลประจำตัวเว็บ) ไม่จำเป็นต้องใช้
    คีย์ API

    โมเดล Embedding ที่รองรับประกอบด้วย Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) และ TwelveLabs Marengo ดู
    [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ -- Bedrock](/th/reference/memory-config#bedrock-embedding-config)
    สำหรับรายการโมเดลทั้งหมดและตัวเลือกมิติ

  </Accordion>

  <Accordion title="หมายเหตุและข้อควรระวัง">
    - Bedrock กำหนดให้เปิดใช้งาน **สิทธิ์เข้าถึงโมเดล** ในบัญชี/ภูมิภาค AWS ของคุณ
    - การค้นหาอัตโนมัติต้องใช้สิทธิ์ `bedrock:ListFoundationModels` และ
      `bedrock:ListInferenceProfiles`
    - หากใช้โหมดอัตโนมัติ ให้ตั้งค่าตัวบ่งชี้สภาพแวดล้อมการยืนยันตัวตน AWS ที่รองรับรายการใดรายการหนึ่งบน
      โฮสต์ Gateway หากต้องการใช้การยืนยันตัวตนผ่าน IMDS/การกำหนดค่าที่ใช้ร่วมกันโดยไม่มีตัวบ่งชี้สภาพแวดล้อม ให้ตั้งค่า
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`
    - OpenClaw แสดงแหล่งที่มาของข้อมูลประจำตัวตามลำดับดังนี้: `AWS_BEARER_TOKEN_BEDROCK`
      จากนั้น `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` ต่อด้วย `AWS_PROFILE` และ
      สายโซ่ AWS SDK เริ่มต้น
    - การรองรับการให้เหตุผลขึ้นอยู่กับโมเดล โปรดตรวจสอบการ์ดโมเดล Bedrock สำหรับ
      ความสามารถปัจจุบัน
    - หากต้องการกระบวนการคีย์ที่มีการจัดการ คุณยังสามารถวางพร็อกซีที่เข้ากันได้กับ OpenAI
      ไว้หน้า Bedrock และกำหนดค่าเป็นผู้ให้บริการ OpenAI แทนได้
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search" icon="magnifying-glass">
    Embedding ของ Bedrock สำหรับการกำหนดค่าการค้นหาหน่วยความจำ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ" href="/th/reference/memory-config#bedrock-embedding-config" icon="database">
    รายการโมเดล Embedding ของ Bedrock ทั้งหมดและตัวเลือกมิติ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
