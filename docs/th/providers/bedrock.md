---
read_when:
    - คุณต้องการใช้โมเดล Amazon Bedrock กับ OpenClaw
    - คุณต้องตั้งค่าข้อมูลประจำตัว/ภูมิภาคของ AWS สำหรับการเรียกโมเดล
summary: ใช้โมเดล Amazon Bedrock (Converse API) กับ OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T10:10:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw สามารถใช้โมเดล **Amazon Bedrock** ผ่านผู้ให้บริการสตรีมมิง **Bedrock Converse**
ของ pi-ai ได้ การตรวจสอบสิทธิ์ Bedrock ใช้ **ชุดลำดับข้อมูลรับรองเริ่มต้นของ AWS SDK**
ไม่ใช่ API key

| คุณสมบัติ | ค่า                                                        |
| -------- | ----------------------------------------------------------- |
| ผู้ให้บริการ | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| การตรวจสอบสิทธิ์ | ข้อมูลรับรอง AWS (env vars, shared config หรือ instance role) |
| รีเจียน   | `AWS_REGION` หรือ `AWS_DEFAULT_REGION` (ค่าเริ่มต้น: `us-east-1`) |

## เริ่มต้นใช้งาน

เลือกวิธีตรวจสอบสิทธิ์ที่คุณต้องการแล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Access keys / env vars">
    **เหมาะที่สุดสำหรับ:** เครื่องของนักพัฒนา, CI หรือโฮสต์ที่คุณจัดการข้อมูลรับรอง AWS โดยตรง

    <Steps>
      <Step title="ตั้งค่าข้อมูลรับรอง AWS บนโฮสต์ Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="เพิ่มผู้ให้บริการ Bedrock และโมเดลลงใน config ของคุณ">
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
      <Step title="ตรวจสอบว่ามีโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    ด้วยการตรวจสอบสิทธิ์แบบ env-marker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` หรือ `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock โดยนัยสำหรับการค้นพบโมเดลโดยอัตโนมัติ โดยไม่ต้องมี config เพิ่มเติม
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **เหมาะที่สุดสำหรับ:** อินสแตนซ์ EC2 ที่ผูก IAM role ไว้ โดยใช้บริการเมตาดาต้าของอินสแตนซ์สำหรับการตรวจสอบสิทธิ์

    <Steps>
      <Step title="เปิดใช้การค้นพบอย่างชัดเจน">
        เมื่อใช้ IMDS OpenClaw ไม่สามารถตรวจจับการตรวจสอบสิทธิ์ AWS จาก env markers เพียงอย่างเดียวได้ ดังนั้นคุณต้องเลือกใช้:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="เพิ่ม env marker สำหรับโหมดอัตโนมัติได้ตามต้องการ">
        หากคุณต้องการให้เส้นทางการตรวจจับ env-marker อัตโนมัติทำงานด้วย (เช่น สำหรับพื้นผิว `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        คุณ **ไม่** จำเป็นต้องใช้ API key ปลอม
      </Step>
      <Step title="ตรวจสอบว่าค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    IAM role ที่ผูกกับอินสแตนซ์ EC2 ของคุณต้องมีสิทธิ์ต่อไปนี้:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (สำหรับการค้นพบอัตโนมัติ)
    - `bedrock:ListInferenceProfiles` (สำหรับการค้นพบ inference profile)

    หรือผูก managed policy `AmazonBedrockFullAccess`
    </Warning>

    <Note>
    คุณต้องใช้ `AWS_PROFILE=default` เฉพาะเมื่อคุณต้องการ env marker สำหรับโหมดอัตโนมัติหรือพื้นผิวสถานะโดยเฉพาะเท่านั้น เส้นทางการตรวจสอบสิทธิ์ของรันไทม์ Bedrock จริงใช้ชุดลำดับเริ่มต้นของ AWS SDK ดังนั้นการตรวจสอบสิทธิ์ด้วย instance-role ของ IMDS จึงทำงานได้แม้ไม่มี env markers
    </Note>

  </Tab>
</Tabs>

## การค้นพบโมเดลอัตโนมัติ

OpenClaw สามารถค้นพบโมเดล Bedrock ที่รองรับ **สตรีมมิง**
และ **เอาต์พุตข้อความ** ได้โดยอัตโนมัติ การค้นพบใช้ `bedrock:ListFoundationModels` และ
`bedrock:ListInferenceProfiles` และผลลัพธ์จะถูกแคชไว้ (ค่าเริ่มต้น: 1 ชั่วโมง)

วิธีเปิดใช้ผู้ให้บริการโดยนัย:

- หาก `plugins.entries.amazon-bedrock.config.discovery.enabled` เป็น `true`
  OpenClaw จะพยายามค้นพบแม้ไม่มี AWS env marker
- หากไม่ได้ตั้งค่า `plugins.entries.amazon-bedrock.config.discovery.enabled`
  OpenClaw จะเพิ่มผู้ให้บริการ Bedrock โดยนัยโดยอัตโนมัติก็ต่อเมื่อเห็นหนึ่งในเครื่องหมายการตรวจสอบสิทธิ์ AWS เหล่านี้:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` หรือ `AWS_PROFILE`
- เส้นทางการตรวจสอบสิทธิ์ของรันไทม์ Bedrock จริงยังคงใช้ชุดลำดับเริ่มต้นของ AWS SDK ดังนั้น
  shared config, SSO และการตรวจสอบสิทธิ์ด้วย instance-role ของ IMDS จึงสามารถทำงานได้ แม้เมื่อการค้นพบ
  ต้องใช้ `enabled: true` เพื่อเลือกใช้

<Note>
สำหรับรายการ `models.providers["amazon-bedrock"]` แบบชัดเจน OpenClaw ยังคงสามารถแก้การตรวจสอบสิทธิ์ env-marker ของ Bedrock ได้ตั้งแต่เนิ่นๆ จาก AWS env markers เช่น `AWS_BEARER_TOKEN_BEDROCK` โดยไม่บังคับให้โหลดการตรวจสอบสิทธิ์รันไทม์เต็มรูปแบบ เส้นทางการตรวจสอบสิทธิ์สำหรับการเรียกโมเดลจริงยังคงใช้ชุดลำดับเริ่มต้นของ AWS SDK
</Note>

<AccordionGroup>
  <Accordion title="ตัวเลือก config การค้นพบ">
    ตัวเลือก config อยู่ใต้ `plugins.entries.amazon-bedrock.config.discovery`:

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
    | `enabled` | auto | ในโหมดอัตโนมัติ OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock โดยนัยก็ต่อเมื่อเห็น AWS env marker ที่รองรับ ตั้งค่าเป็น `true` เพื่อบังคับการค้นพบ |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS region ที่ใช้สำหรับการเรียก API การค้นพบ |
    | `providerFilter` | (ทั้งหมด) | จับคู่ชื่อผู้ให้บริการ Bedrock (เช่น `anthropic`, `amazon`) |
    | `refreshInterval` | `3600` | ระยะเวลาแคชเป็นวินาที ตั้งเป็น `0` เพื่อปิดใช้งานการแคช |
    | `defaultContextWindow` | `32000` | Context window ที่ใช้สำหรับโมเดลที่ค้นพบ (แทนที่ได้หากคุณทราบขีดจำกัดของโมเดล) |
    | `defaultMaxTokens` | `4096` | จำนวนโทเค็นเอาต์พุตสูงสุดที่ใช้สำหรับโมเดลที่ค้นพบ (แทนที่ได้หากคุณทราบขีดจำกัดของโมเดล) |

  </Accordion>
</AccordionGroup>

## การตั้งค่าแบบรวดเร็ว (เส้นทาง AWS)

คำแนะนำนี้จะสร้าง IAM role, ผูกสิทธิ์ Bedrock, เชื่อมโยง
instance profile และเปิดใช้การค้นพบของ OpenClaw บนโฮสต์ EC2

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
  <Accordion title="Inference profiles">
    OpenClaw ค้นพบ **regional และ global inference profiles** ควบคู่ไปกับ
    foundation models เมื่อ profile แมปกับ foundation model ที่รู้จัก
    profile จะสืบทอดความสามารถของโมเดลนั้น (context window, max tokens,
    reasoning, vision) และรีเจียนคำขอ Bedrock ที่ถูกต้องจะถูกแทรกให้
    โดยอัตโนมัติ ซึ่งหมายความว่า Claude profiles แบบข้ามรีเจียนทำงานได้โดยไม่ต้องแทนที่
    ผู้ให้บริการด้วยตนเอง

    ID ของ inference profile มีรูปแบบเช่น `us.anthropic.claude-opus-4-6-v1:0` (regional)
    หรือ `anthropic.claude-opus-4-6-v1:0` (global) หากโมเดลเบื้องหลังอยู่ใน
    ผลลัพธ์การค้นพบอยู่แล้ว profile จะสืบทอดชุดความสามารถทั้งหมดของโมเดลนั้น
    มิฉะนั้นจะใช้ค่าเริ่มต้นที่ปลอดภัย

    ไม่จำเป็นต้องกำหนดค่าเพิ่มเติม ตราบใดที่เปิดใช้การค้นพบและ IAM
    principal มี `bedrock:ListInferenceProfiles` profiles จะปรากฏควบคู่กับ
    foundation models ใน `openclaw models list`

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock ปฏิเสธพารามิเตอร์ `temperature` สำหรับ Claude Opus 4.7 OpenClaw
    จะละ `temperature` โดยอัตโนมัติสำหรับ Bedrock ref ของ Opus 4.7 ใดๆ รวมถึง
    foundation model ids, named inference profiles, application inference
    profiles ที่โมเดลเบื้องหลังถูกแก้เป็น Opus 4.7 ผ่าน
    `bedrock:GetInferenceProfile` และรูปแบบ `opus-4.7` แบบมีจุดที่มี
    คำนำหน้ารีเจียนแบบเลือกได้ (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`) ไม่จำเป็นต้องมีปุ่ม config และการละค่านี้มีผลกับทั้ง
    ออบเจ็กต์ตัวเลือกคำขอและฟิลด์เพย์โหลด `inferenceConfig`
  </Accordion>

  <Accordion title="Guardrails">
    คุณสามารถใช้ [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    กับการเรียกโมเดล Bedrock ทั้งหมดได้โดยเพิ่มออบเจ็กต์ `guardrail` ลงใน
    config Plugin `amazon-bedrock` Guardrails ช่วยให้คุณบังคับใช้การกรองเนื้อหา,
    การปฏิเสธหัวข้อ, ตัวกรองคำ, ตัวกรองข้อมูลอ่อนไหว และการตรวจสอบ
    การยึดโยงตามบริบท

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

    | ตัวเลือก | จำเป็น | คำอธิบาย |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | ใช่ | Guardrail ID (เช่น `abc123`) หรือ ARN เต็ม (เช่น `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`) |
    | `guardrailVersion` | ใช่ | หมายเลขเวอร์ชันที่เผยแพร่แล้ว หรือ `"DRAFT"` สำหรับฉบับร่างที่กำลังทำงาน |
    | `streamProcessingMode` | ไม่ | `"sync"` หรือ `"async"` สำหรับการประเมิน guardrail ระหว่างสตรีมมิง หากละไว้ Bedrock จะใช้ค่าเริ่มต้นของตน |
    | `trace` | ไม่ | `"enabled"` หรือ `"enabled_full"` สำหรับการดีบัก; ละไว้หรือตั้งเป็น `"disabled"` สำหรับโปรดักชัน |

    <Warning>
    IAM principal ที่ Gateway ใช้ต้องมีสิทธิ์ `bedrock:ApplyGuardrail` นอกเหนือจากสิทธิ์ invoke มาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="Embeddings สำหรับการค้นหาหน่วยความจำ">
    Bedrock สามารถทำหน้าที่เป็นผู้ให้บริการ embedding สำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้ด้วย ซึ่งกำหนดค่าแยกจาก
    ผู้ให้บริการ inference -- ตั้งค่า `agents.defaults.memorySearch.provider` เป็น `"bedrock"`:

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

    Bedrock embeddings ใช้ credential chain ของ AWS SDK เดียวกับ inference (instance
    roles, SSO, access keys, shared config และ web identity) ไม่จำเป็นต้องใช้ API key
    เมื่อ `provider` เป็น `"auto"` ระบบจะตรวจพบ Bedrock โดยอัตโนมัติหาก
    credential chain ดังกล่าว resolve ได้สำเร็จ

    โมเดล embedding ที่รองรับรวมถึง Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) และ TwelveLabs Marengo ดู
    [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ -- Bedrock](/th/reference/memory-config#bedrock-embedding-config)
    สำหรับรายการโมเดลทั้งหมดและตัวเลือกมิติ

  </Accordion>

  <Accordion title="หมายเหตุและข้อควรระวัง">
    - Bedrock ต้องเปิดใช้ **model access** ในบัญชี/ภูมิภาค AWS ของคุณ
    - การค้นหาอัตโนมัติต้องมีสิทธิ์ `bedrock:ListFoundationModels` และ
      `bedrock:ListInferenceProfiles`
    - หากคุณใช้โหมด auto ให้ตั้งค่าหนึ่งในตัวบ่งชี้ env สำหรับการยืนยันตัวตน AWS ที่รองรับบน
      โฮสต์ gateway หากคุณต้องการใช้การยืนยันตัวตนแบบ IMDS/shared-config โดยไม่มีตัวบ่งชี้ env ให้ตั้งค่า
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`
    - OpenClaw แสดงแหล่งที่มาของข้อมูลรับรองตามลำดับนี้: `AWS_BEARER_TOKEN_BEDROCK`,
      จากนั้น `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, จากนั้น `AWS_PROFILE`, จากนั้น
      chain เริ่มต้นของ AWS SDK
    - การรองรับ reasoning ขึ้นอยู่กับโมเดล ตรวจสอบ model card ของ Bedrock สำหรับ
      ความสามารถปัจจุบัน
    - หากคุณต้องการโฟลว์คีย์ที่มีการจัดการ คุณยังสามารถวางพร็อกซีที่เข้ากันได้กับ OpenAI
      ไว้หน้า Bedrock แล้วกำหนดค่าเป็นผู้ให้บริการ OpenAI แทนได้
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search" icon="magnifying-glass">
    Bedrock embeddings สำหรับการกำหนดค่าการค้นหาหน่วยความจำ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ" href="/th/reference/memory-config#bedrock-embedding-config" icon="database">
    รายการโมเดล embedding ของ Bedrock ทั้งหมดและตัวเลือกมิติ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
