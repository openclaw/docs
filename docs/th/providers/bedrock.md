---
read_when:
    - คุณต้องการใช้โมเดล Amazon Bedrock กับ OpenClaw
    - คุณต้องตั้งค่าข้อมูลประจำตัว/ภูมิภาคของ AWS สำหรับการเรียกโมเดล
summary: ใช้โมเดล Amazon Bedrock (Converse API) กับ OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:11:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw สามารถใช้โมเดล **Amazon Bedrock** ผ่านผู้ให้บริการสตรีมมิง **Bedrock Converse**
ของ OpenClaw ได้ การยืนยันตัวตนของ Bedrock ใช้ **AWS SDK default credential chain**
ไม่ใช่ API key

| คุณสมบัติ | ค่า                                                        |
| -------- | ----------------------------------------------------------- |
| ผู้ให้บริการ | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| การยืนยันตัวตน | ข้อมูลรับรอง AWS (env vars, shared config หรือ instance role) |
| Region   | `AWS_REGION` หรือ `AWS_DEFAULT_REGION` (ค่าเริ่มต้น: `us-east-1`) |

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Access keys / env vars">
    **เหมาะที่สุดสำหรับ:** เครื่องของนักพัฒนา, CI หรือโฮสต์ที่คุณจัดการข้อมูลรับรอง AWS โดยตรง

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
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
      <Step title="Add a Bedrock provider and model to your config">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    เมื่อใช้การยืนยันตัวตนแบบ env-marker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` หรือ `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock แบบแฝงโดยอัตโนมัติสำหรับการค้นพบโมเดล โดยไม่ต้องมีการกำหนดค่าเพิ่มเติม
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **เหมาะที่สุดสำหรับ:** อินสแตนซ์ EC2 ที่ผูก IAM role ไว้ และใช้ instance metadata service สำหรับการยืนยันตัวตน

    <Steps>
      <Step title="Enable discovery explicitly">
        เมื่อใช้ IMDS OpenClaw ไม่สามารถตรวจพบการยืนยันตัวตน AWS จาก env markers เพียงอย่างเดียวได้ คุณจึงต้องเลือกเปิดใช้:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        หากคุณต้องการให้เส้นทางการตรวจจับอัตโนมัติด้วย env-marker ทำงานด้วย (เช่น สำหรับพื้นผิวของ `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        คุณ **ไม่** จำเป็นต้องใช้ API key ปลอม
      </Step>
      <Step title="Verify models are discovered">
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
    คุณต้องใช้ `AWS_PROFILE=default` เฉพาะเมื่อคุณต้องการ env marker สำหรับโหมดอัตโนมัติหรือพื้นผิวสถานะโดยเฉพาะเท่านั้น เส้นทางการยืนยันตัวตนของ runtime Bedrock จริงใช้ AWS SDK default chain ดังนั้นการยืนยันตัวตนด้วย IMDS instance-role จึงทำงานได้แม้ไม่มี env markers
    </Note>

  </Tab>
</Tabs>

## การค้นพบโมเดลอัตโนมัติ

OpenClaw สามารถค้นพบโมเดล Bedrock ที่รองรับ **สตรีมมิง**
และ **เอาต์พุตข้อความ** ได้โดยอัตโนมัติ การค้นพบใช้ `bedrock:ListFoundationModels` และ
`bedrock:ListInferenceProfiles` และผลลัพธ์จะถูกแคชไว้ (ค่าเริ่มต้น: 1 ชั่วโมง)

วิธีเปิดใช้ผู้ให้บริการแบบแฝง:

- หาก `plugins.entries.amazon-bedrock.config.discovery.enabled` เป็น `true`
  OpenClaw จะลองค้นพบแม้ไม่มี AWS env marker
- หากไม่ได้ตั้งค่า `plugins.entries.amazon-bedrock.config.discovery.enabled`
  OpenClaw จะเพิ่มผู้ให้บริการ Bedrock แบบแฝงโดยอัตโนมัติเฉพาะเมื่อพบหนึ่งใน AWS auth markers เหล่านี้:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` หรือ `AWS_PROFILE`
- เส้นทางการยืนยันตัวตนของ runtime Bedrock จริงยังคงใช้ AWS SDK default chain ดังนั้น
  shared config, SSO และการยืนยันตัวตนด้วย IMDS instance-role จึงทำงานได้แม้เมื่อการค้นพบต้องใช้
  `enabled: true` เพื่อเลือกเปิดใช้

<Note>
สำหรับรายการ `models.providers["amazon-bedrock"]` แบบชัดเจน OpenClaw ยังสามารถ resolve การยืนยันตัวตนแบบ Bedrock env-marker ได้ตั้งแต่ต้นจาก AWS env markers เช่น `AWS_BEARER_TOKEN_BEDROCK` โดยไม่บังคับให้โหลดการยืนยันตัวตน runtime เต็มรูปแบบ เส้นทางการยืนยันตัวตนสำหรับการเรียกโมเดลจริงยังคงใช้ AWS SDK default chain
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    ตัวเลือก config อยู่ภายใต้ `plugins.entries.amazon-bedrock.config.discovery`:

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
    | `enabled` | auto | ในโหมด auto OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock แบบแฝงเฉพาะเมื่อพบ AWS env marker ที่รองรับ ตั้งเป็น `true` เพื่อบังคับการค้นพบ |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS region ที่ใช้สำหรับการเรียก discovery API |
    | `providerFilter` | (ทั้งหมด) | จับคู่ชื่อผู้ให้บริการ Bedrock (เช่น `anthropic`, `amazon`) |
    | `refreshInterval` | `3600` | ระยะเวลาแคชเป็นวินาที ตั้งเป็น `0` เพื่อปิดการแคช |
    | `defaultContextWindow` | `32000` | Context window ที่ใช้สำหรับโมเดลที่ค้นพบ (override หากคุณรู้ขีดจำกัดของโมเดลของคุณ) |
    | `defaultMaxTokens` | `4096` | จำนวนโทเค็นเอาต์พุตสูงสุดที่ใช้สำหรับโมเดลที่ค้นพบ (override หากคุณรู้ขีดจำกัดของโมเดลของคุณ) |

  </Accordion>
</AccordionGroup>

## การตั้งค่าแบบเร็ว (เส้นทาง AWS)

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
    OpenClaw ค้นพบ **regional and global inference profiles** ควบคู่ไปกับ
    foundation models เมื่อ profile แมปไปยัง foundation model ที่รู้จัก
    profile จะสืบทอดความสามารถของโมเดลนั้น (context window, max tokens,
    reasoning, vision) และ Bedrock request region ที่ถูกต้องจะถูกใส่ให้
    โดยอัตโนมัติ ซึ่งหมายความว่า Claude profiles แบบข้าม region ทำงานได้โดยไม่ต้อง
    override ผู้ให้บริการด้วยตนเอง

    Inference profile IDs มีรูปแบบเช่น `us.anthropic.claude-opus-4-6-v1:0` (regional)
    หรือ `anthropic.claude-opus-4-6-v1:0` (global) หาก backing model อยู่ใน
    ผลลัพธ์การค้นพบแล้ว profile จะสืบทอดชุดความสามารถทั้งหมดของโมเดลนั้น
    มิฉะนั้นจะใช้ค่าเริ่มต้นที่ปลอดภัย

    ไม่จำเป็นต้องมีการกำหนดค่าเพิ่มเติม ตราบใดที่เปิดใช้การค้นพบและ IAM
    principal มี `bedrock:ListInferenceProfiles` profiles จะปรากฏควบคู่กับ
    foundation models ใน `openclaw models list`

  </Accordion>

  <Accordion title="Service tier">
    โมเดล Bedrock บางรุ่นรองรับพารามิเตอร์ `service_tier` เพื่อปรับให้เหมาะกับต้นทุน
    หรือ latency tier ต่อไปนี้พร้อมใช้งาน:

    | Tier | คำอธิบาย |
    |------|-------------|
    | `default` | tier มาตรฐานของ Bedrock |
    | `flex` | การประมวลผลแบบลดราคาสำหรับ workload ที่ทนต่อ latency ที่นานขึ้นได้ |
    | `priority` | การประมวลผลที่จัดลำดับความสำคัญสำหรับ workload ที่ไวต่อ latency |
    | `reserved` | ความจุที่จองไว้สำหรับ workload สถานะคงที่ |

    ตั้งค่า `serviceTier` (หรือ `service_tier`) ผ่าน `agents.defaults.params` สำหรับ
    คำขอโมเดล Bedrock หรือแบบรายโมเดลใน
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

    ค่าที่ถูกต้องคือ `default`, `flex`, `priority` และ `reserved` ไม่ใช่ทุก
    โมเดลที่จะรองรับทุก tier หากมีการขอ tier ที่ไม่รองรับ Bedrock จะ
    ส่งคืน validation error หมายเหตุ: ข้อความ error ค่อนข้างชวนเข้าใจผิด
    โดยอาจระบุว่า "The provided model identifier is invalid" แทนที่จะบอกว่า
    service tier ไม่รองรับ หากคุณเห็น error นี้ ให้ตรวจสอบว่าโมเดล
    รองรับ tier ที่ร้องขอหรือไม่

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock ปฏิเสธพารามิเตอร์ `temperature` สำหรับ Claude Opus 4.7 OpenClaw
    จะละ `temperature` โดยอัตโนมัติสำหรับ ref ของ Opus 4.7 Bedrock ใดๆ รวมถึง
    foundation model ids, named inference profiles, application inference
    profiles ที่โมเดลเบื้องหลัง resolve เป็น Opus 4.7 ผ่าน
    `bedrock:GetInferenceProfile` และตัวแปร `opus-4.7` แบบมีจุดที่มี
    prefix region แบบเลือกได้ (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`) ไม่จำเป็นต้องมีปุ่ม config และการละนี้ใช้กับทั้ง
    อ็อบเจกต์ request options และฟิลด์ payload `inferenceConfig`
  </Accordion>

  <Accordion title="Claude Fable 5">
    ใช้ `amazon-bedrock/anthropic.claude-fable-5` ใน `us-east-1` หรือ
    รหัส inference ระดับภูมิภาค เช่น `us.anthropic.claude-fable-5`
    OpenClaw ใช้หน้าต่างบริบท 1M ของ Fable, ขีดจำกัดเอาต์พุต 128K, การคิดแบบปรับตัวที่เปิดตลอดเวลา
    และการแมป effort ที่รองรับ `/think off` และ
    `/think minimal` จะแมปเป็น `low`; การควบคุม temperature และการบังคับเลือก tool
    ที่ไม่รองรับจะถูกละไว้ เอาต์พุตแบบสตรีมจะถูกพักไว้จนกว่า Bedrock
    จะส่งคืนสถานะ terminal เพื่อให้การปฏิเสธกลางสตรีมไม่เปิดเผยข้อความบางส่วน
    Fable รองรับเฉพาะ service tier มาตรฐานเท่านั้น; OpenClaw จะไม่ใช้ tier
    `flex`, `priority` และ `reserved` ที่กำหนดค่าสำหรับโมเดลนี้

    AWS ต้องมีการยินยอมเก็บข้อมูล `provider_data_share` อย่างชัดเจนก่อน
    จึงจะใช้งาน Fable ได้ พรอมป์และผลลัพธ์ completions จะถูกแชร์กับ Anthropic และ
    เก็บไว้นานสูงสุด 30 วันเพื่อความน่าเชื่อถือและความปลอดภัย โปรดตรวจทานและกำหนดค่า
    [การเก็บข้อมูลของ Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    ก่อนเปิดใช้งานโมเดล

  </Accordion>

  <Accordion title="Guardrails">
    คุณสามารถใช้ [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    กับการเรียกใช้โมเดล Bedrock ทั้งหมดได้โดยเพิ่มออบเจ็กต์ `guardrail` ลงใน
    การกำหนดค่า Plugin `amazon-bedrock` Guardrails ช่วยให้คุณบังคับใช้การกรองเนื้อหา,
    การปฏิเสธหัวข้อ, ตัวกรองคำ, ตัวกรองข้อมูลอ่อนไหว และการตรวจสอบ
    grounding ตามบริบทได้

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
    | `guardrailIdentifier` | ใช่ | ID ของ Guardrail (เช่น `abc123`) หรือ ARN แบบเต็ม (เช่น `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`) |
    | `guardrailVersion` | ใช่ | หมายเลขเวอร์ชันที่เผยแพร่แล้ว หรือ `"DRAFT"` สำหรับฉบับร่างที่กำลังใช้งาน |
    | `streamProcessingMode` | ไม่ | `"sync"` หรือ `"async"` สำหรับการประเมิน guardrail ระหว่างการสตรีม หากละไว้ Bedrock จะใช้ค่าเริ่มต้นของตน |
    | `trace` | ไม่ | `"enabled"` หรือ `"enabled_full"` สำหรับการดีบัก; ละไว้หรือตั้งเป็น `"disabled"` สำหรับ production |

    <Warning>
    IAM principal ที่ Gateway ใช้ต้องมีสิทธิ์ `bedrock:ApplyGuardrail` นอกเหนือจากสิทธิ์ invoke มาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="Embeddings สำหรับการค้นหาหน่วยความจำ">
    Bedrock ยังสามารถทำหน้าที่เป็นผู้ให้บริการ embedding สำหรับ
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

    Bedrock embeddings ใช้เชน credential ของ AWS SDK เดียวกับ inference (instance
    roles, SSO, access keys, shared config และ web identity) ไม่ต้องใช้ API key
    ตั้งค่า `memorySearch.provider: "bedrock"` อย่างชัดเจนเพื่อใช้ Bedrock
    embeddings

    โมเดล embedding ที่รองรับรวมถึง Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) และ TwelveLabs Marengo ดู
    [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ -- Bedrock](/th/reference/memory-config#bedrock-embedding-config)
    สำหรับรายการโมเดลทั้งหมดและตัวเลือกมิติ

  </Accordion>

  <Accordion title="หมายเหตุและข้อควรระวัง">
    - Bedrock ต้องเปิดใช้งาน **model access** ในบัญชี/ภูมิภาค AWS ของคุณ
    - การค้นพบอัตโนมัติต้องใช้สิทธิ์ `bedrock:ListFoundationModels` และ
      `bedrock:ListInferenceProfiles`
    - หากคุณพึ่งพาโหมด auto ให้ตั้งค่าหนึ่งใน env markers สำหรับการยืนยันตัวตน AWS ที่รองรับบน
      โฮสต์ Gateway หากคุณต้องการการยืนยันตัวตนแบบ IMDS/shared-config โดยไม่มี env markers ให้ตั้งค่า
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`
    - OpenClaw แสดงแหล่งที่มาของ credential ตามลำดับนี้: `AWS_BEARER_TOKEN_BEDROCK`,
      จากนั้น `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, จากนั้น `AWS_PROFILE`, จากนั้น
      เชน AWS SDK เริ่มต้น
    - การรองรับ reasoning ขึ้นอยู่กับโมเดล; ตรวจสอบการ์ดโมเดล Bedrock สำหรับ
      ความสามารถปัจจุบัน
    - หากคุณต้องการโฟลว์คีย์แบบมีการจัดการ คุณยังสามารถวางพร็อกซีที่เข้ากันได้กับ OpenAI
      ไว้หน้า Bedrock และกำหนดค่าเป็นผู้ให้บริการ OpenAI แทนได้
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
  <Card title="เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ" href="/th/reference/memory-config#bedrock-embedding-config" icon="database">
    รายการโมเดล embedding ของ Bedrock ทั้งหมดและตัวเลือกมิติ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
