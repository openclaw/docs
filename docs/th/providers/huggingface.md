---
read_when:
    - คุณต้องการใช้ Hugging Face Inference ร่วมกับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับโทเค็น HF หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Hugging Face Inference (การยืนยันตัวตน + การเลือกโมเดล)
title: Hugging Face (การอนุมาน)
x-i18n:
    generated_at: "2026-07-12T16:39:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) มีเราเตอร์สำหรับการเติมข้อความแชตที่เข้ากันได้กับ OpenAI อยู่ด้านหน้าโมเดลที่โฮสต์ไว้จำนวนมาก (DeepSeek, Llama และอื่น ๆ) โดยใช้โทเค็นเดียว OpenClaw สื่อสารกับ **ปลายทางการเติมข้อความแชตเท่านั้น** สำหรับการแปลงข้อความเป็นรูปภาพ เอ็มเบดดิง หรือเสียงพูด ให้ใช้ [ไคลเอนต์การอนุมานของ HF](https://huggingface.co/docs/api-inference/quicktour) โดยตรง

| คุณสมบัติ     | ค่า                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ  | `huggingface`                                                                                                               |
| Plugin       | รวมมาให้แล้ว (เปิดใช้งานโดยค่าเริ่มต้น ไม่ต้องติดตั้ง)                                                                               |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน | `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN` (โทเค็นแบบกำหนดสิทธิ์ละเอียด)                                                                  |
| API          | เข้ากันได้กับ OpenAI (`https://router.huggingface.co/v1`)                                                                      |
| การเรียกเก็บเงิน      | ใช้โทเค็น HF เดียว โดย[ราคา](https://huggingface.co/docs/inference-providers/pricing) เป็นไปตามอัตราของผู้ให้บริการและมีระดับใช้งานฟรี |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Create a fine-grained token">
    ไปที่ [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) แล้วสร้างโทเค็นแบบกำหนดสิทธิ์ละเอียดใหม่

    <Warning>
    ต้องเปิดใช้สิทธิ์ **Make calls to Inference Providers** สำหรับโทเค็น มิฉะนั้นคำขอ API จะถูกปฏิเสธ
    </Warning>

  </Step>
  <Step title="Run onboarding">
    เลือก **Hugging Face** ในรายการแบบเลื่อนลงของผู้ให้บริการ แล้วป้อนคีย์ API เมื่อระบบแจ้ง:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    เลือกโมเดลจากรายการแบบเลื่อนลง **Default Hugging Face model** รายการนี้จะโหลดจาก Inference API เมื่อโทเค็นของคุณถูกต้อง มิฉะนั้น OpenClaw จะแสดงแค็ตตาล็อกในตัวด้านล่าง ตัวเลือกของคุณจะถูกบันทึกเป็น `agents.defaults.model.primary`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

ตั้ง `huggingface/deepseek-ai/DeepSeek-R1` เป็นโมเดลเริ่มต้น

## รหัสโมเดล

การอ้างอิงโมเดลใช้รูปแบบ `huggingface/<org>/<model>` (รหัสรูปแบบ Hub) แค็ตตาล็อกในตัวของ OpenClaw:

| โมเดล                        | การอ้างอิง (เติมคำนำหน้าด้วย `huggingface/`)          |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
เมื่อโทเค็นของคุณถูกต้อง OpenClaw จะค้นพบโมเดลอื่น ๆ จาก **GET** `https://router.huggingface.co/v1/models` ระหว่างการเริ่มต้นใช้งานและเมื่อ Gateway เริ่มทำงานด้วย ดังนั้นแค็ตตาล็อกของคุณจึงอาจมีโมเดลมากกว่าสี่รายการข้างต้นอย่างมาก คุณสามารถเติม `:fastest` หรือ `:cheapest` ต่อท้ายรหัสโมเดลใดก็ได้ แล้วเราเตอร์ของ HF จะกำหนดเส้นทางไปยังผู้ให้บริการอนุมานที่ตรงกัน ตั้งค่าลำดับผู้ให้บริการเริ่มต้นของคุณใน [Inference Provider settings](https://hf.co/settings/inference-providers)
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Model discovery and onboarding dropdown">
    OpenClaw ค้นพบโมเดลด้วย:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    การตอบกลับอยู่ในรูปแบบของ OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`

    เมื่อมีการกำหนดค่าคีย์แล้ว (จากการเริ่มต้นใช้งาน, `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`) รายการแบบเลื่อนลง **Default Hugging Face model** ระหว่างการตั้งค่าแบบโต้ตอบจะรับข้อมูลจากปลายทางนี้ เมื่อ Gateway เริ่มทำงาน ระบบจะเรียกปลายทางเดิมซ้ำเพื่อรีเฟรชแค็ตตาล็อก โมเดลที่ค้นพบจะถูกรวมกับแค็ตตาล็อกในตัวด้านบน (ซึ่งใช้สำหรับข้อมูลเมตา เช่น ขนาดหน้าต่างบริบทและค่าใช้จ่าย เมื่อรหัสตรงกัน) หากคำขอล้มเหลว ไม่ส่งคืนข้อมูล หรือไม่ได้ตั้งค่าคีย์ OpenClaw จะย้อนกลับไปใช้เฉพาะแค็ตตาล็อกในตัว

    ปิดการค้นพบโดยไม่ต้องนำผู้ให้บริการออก:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model names, aliases, and policy suffixes">
    - **ชื่อจาก API:** โมเดลที่ค้นพบจะใช้ `name`, `title` หรือ `display_name` จาก API เมื่อมีค่า มิฉะนั้น OpenClaw จะสร้างชื่อจากรหัสโมเดล (เช่น `deepseek-ai/DeepSeek-R1` จะกลายเป็น "DeepSeek R1")
    - **แทนที่ชื่อที่แสดง:** ตั้งป้ายกำกับแบบกำหนดเองสำหรับแต่ละโมเดลในการกำหนดค่า:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **คำต่อท้ายนโยบาย:** `:fastest` และ `:cheapest` เป็นรูปแบบที่เราเตอร์ของ HF กำหนด ไม่ใช่สิ่งที่ OpenClaw เขียนใหม่ โดยคำต่อท้ายจะถูกส่งตามเดิมเป็นส่วนหนึ่งของรหัสโมเดล และเราเตอร์ของ HF จะเลือกผู้ให้บริการอนุมานที่ตรงกัน เพิ่มแต่ละรูปแบบเป็นรายการแยกของตนเองภายใต้ `models.providers.huggingface.models` (หรือใน `model.primary`) หากคุณต้องการนามแฝงที่แตกต่างกันสำหรับแต่ละคำต่อท้าย
    - **การผสานการกำหนดค่า:** รายการที่มีอยู่ใน `models.providers.huggingface.models` (เช่น ใน `models.json`) จะถูกเก็บไว้เมื่อผสานการกำหนดค่า ดังนั้น `name`, `alias` หรือตัวเลือกโมเดลแบบกำหนดเองที่คุณตั้งไว้จะยังคงอยู่หลังการเริ่มระบบใหม่

  </Accordion>

  <Accordion title="Environment and daemon setup">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่าโปรเซสนั้นเข้าถึง `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN` ได้ (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Note>
    OpenClaw รองรับทั้ง `HUGGINGFACE_HUB_TOKEN` และ `HF_TOKEN` หากตั้งค่าทั้งสองตัว `HUGGINGFACE_HUB_TOKEN` จะมีลำดับความสำคัญสูงกว่า
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 with fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek with cheapest and fastest variants">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS with aliases">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="Model selection" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    เอกสารอย่างเป็นทางการของ Hugging Face Inference Providers
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
</CardGroup>
