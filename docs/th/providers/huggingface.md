---
read_when:
    - คุณต้องการใช้ Hugging Face Inference กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับโทเค็น HF หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Hugging Face Inference (การยืนยันตัวตน + การเลือกโมเดล)
title: Hugging Face (การอนุมาน)
x-i18n:
    generated_at: "2026-07-19T07:28:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 92c400b78c5ad2cc724ad4029560dccc5bc2006fdeae400fc6b58998e727e17c
    source_path: providers/huggingface.md
    workflow: 16
---

[ผู้ให้บริการอนุมานของ Hugging Face](https://huggingface.co/docs/inference-providers) มีเราเตอร์การเติมข้อความแชตที่เข้ากันได้กับ OpenAI อยู่ด้านหน้าโมเดลที่โฮสต์ไว้จำนวนมาก (DeepSeek, Llama และอื่นๆ) โดยใช้โทเค็นเดียว OpenClaw สื่อสารกับ **เอนด์พอยต์การเติมข้อความแชตเท่านั้น** สำหรับการสร้างรูปภาพจากข้อความ เอ็มเบดดิง หรือเสียงพูด ให้ใช้ [ไคลเอนต์การอนุมานของ HF](https://huggingface.co/docs/api-inference/quicktour) โดยตรง

| คุณสมบัติ     | ค่า                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ  | `huggingface`                                                                                                               |
| Plugin       | รวมมาให้แล้ว (เปิดใช้งานโดยค่าเริ่มต้น ไม่ต้องติดตั้ง)                                                                               |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน | `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN` (โทเค็นแบบละเอียด)                                                                  |
| API          | เข้ากันได้กับ OpenAI (`https://router.huggingface.co/v1`)                                                                      |
| การเรียกเก็บเงิน      | โทเค็น HF เดียว; [ราคา](https://huggingface.co/docs/inference-providers/pricing) เป็นไปตามอัตราของผู้ให้บริการและมีระดับใช้งานฟรี |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างโทเค็นแบบละเอียด">
    ไปที่ [การตั้งค่าโทเค็นของ Hugging Face](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) แล้วสร้างโทเค็นแบบละเอียดใหม่

    <Warning>
    ต้องเปิดใช้สิทธิ์ **Make calls to Inference Providers** สำหรับโทเค็น มิฉะนั้นคำขอ API จะถูกปฏิเสธ
    </Warning>

  </Step>
  <Step title="เรียกใช้การเริ่มต้นตั้งค่า">
    เลือก **Hugging Face** ในเมนูแบบเลื่อนลงของผู้ให้บริการ แล้วป้อนคีย์ API เมื่อระบบแจ้ง:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="เลือกโมเดลเริ่มต้น">
    ในเมนูแบบเลื่อนลง **Default Hugging Face model** ให้เลือกโมเดล รายการจะโหลดจาก Inference API เมื่อโทเค็นถูกต้อง มิฉะนั้น OpenClaw จะแสดงแค็ตตาล็อกในตัวด้านล่าง ระบบบันทึกตัวเลือกเป็น `agents.defaults.model.primary`:

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
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
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

การอ้างอิงโมเดลใช้รูปแบบ `huggingface/<org>/<model>` (รหัสแบบ Hub) แค็ตตาล็อกในตัวของ OpenClaw:

| โมเดล         | การอ้างอิง (เติมคำนำหน้าด้วย `huggingface/`) |
| ------------- | -------------------------------- |
| DeepSeek R1   | `deepseek-ai/DeepSeek-R1`        |
| DeepSeek V3.1 | `deepseek-ai/DeepSeek-V3.1`      |
| GPT-OSS 120B  | `openai/gpt-oss-120b`            |

<Tip>
เมื่อโทเค็นถูกต้อง OpenClaw ยังค้นพบโมเดลอื่นๆ จาก **GET** `https://router.huggingface.co/v1/models` ระหว่างการเริ่มต้นตั้งค่าและเมื่อ Gateway เริ่มทำงาน ดังนั้นแค็ตตาล็อกอาจมีโมเดลมากกว่าสามรายการข้างต้นอย่างมาก สามารถเติม `:fastest` หรือ `:cheapest` ต่อท้ายรหัสโมเดลใดก็ได้ โดยเราเตอร์ของ HF จะกำหนดเส้นทางไปยังผู้ให้บริการอนุมานที่ตรงกัน ตั้งค่าลำดับผู้ให้บริการเริ่มต้นใน [การตั้งค่าผู้ให้บริการอนุมาน](https://hf.co/settings/inference-providers)
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การค้นพบโมเดลและเมนูแบบเลื่อนลงในการเริ่มต้นตั้งค่า">
    OpenClaw ค้นพบโมเดลด้วย:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # หรือ $HF_TOKEN
    ```

    การตอบกลับเป็นรูปแบบ OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`

    เมื่อกำหนดค่าคีย์แล้ว (จากการเริ่มต้นตั้งค่า, `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`) เมนูแบบเลื่อนลง **Default Hugging Face model** ระหว่างการตั้งค่าแบบโต้ตอบจะรับข้อมูลจากเอนด์พอยต์นี้ เมื่อ Gateway เริ่มทำงาน จะเรียกเอนด์พอยต์เดิมอีกครั้งเพื่อรีเฟรชแค็ตตาล็อก โมเดลที่ค้นพบจะถูกรวมกับแค็ตตาล็อกในตัวด้านบน (ใช้สำหรับข้อมูลเมตา เช่น ขนาดหน้าต่างบริบทและค่าใช้จ่ายเมื่อรหัสตรงกัน) หากคำขอล้มเหลว ไม่ส่งคืนข้อมูล หรือไม่ได้ตั้งค่าคีย์ OpenClaw จะใช้เฉพาะแค็ตตาล็อกในตัวเป็นทางเลือกสำรอง

    ปิดใช้งานการค้นพบโดยไม่ต้องนำผู้ให้บริการออก:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="ชื่อโมเดล นามแฝง และคำต่อท้ายตามนโยบาย">
    - **ชื่อจาก API:** โมเดลที่ค้นพบจะใช้ `name`, `title` หรือ `display_name` ของ API หากมี มิฉะนั้น OpenClaw จะสร้างชื่อจากรหัสโมเดล (เช่น `deepseek-ai/DeepSeek-R1` จะกลายเป็น "DeepSeek R1")
    - **แทนที่ชื่อที่แสดง:** ตั้งป้ายกำกับที่กำหนดเองสำหรับแต่ละโมเดลในการกำหนดค่า:

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

    - **คำต่อท้ายตามนโยบาย:** `:fastest` และ `:cheapest` เป็นรูปแบบของเราเตอร์ HF ไม่ใช่สิ่งที่ OpenClaw เขียนใหม่ โดยระบบจะส่งคำต่อท้ายตามตัวอักษรทุกประการเป็นส่วนหนึ่งของรหัสโมเดล และเราเตอร์ของ HF จะเลือกผู้ให้บริการอนุมานที่ตรงกัน เพิ่มแต่ละรูปแบบเป็นรายการแยกภายใต้ `models.providers.huggingface.models` (หรือใน `model.primary`) หากต้องการนามแฝงที่แตกต่างกันสำหรับแต่ละคำต่อท้าย
    - **การผสานการกำหนดค่า:** รายการที่มีอยู่ใน `models.providers.huggingface.models` (เช่น ใน `models.json`) จะถูกเก็บไว้เมื่อผสานการกำหนดค่า ดังนั้น `name`, `alias` หรือตัวเลือกโมเดลที่กำหนดเองไว้ในนั้นจะคงอยู่หลังการเริ่มทำงานใหม่

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและดีมอน">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่าโปรเซสนั้นเข้าถึง `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN` ได้ (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Note>
    OpenClaw รองรับทั้ง `HUGGINGFACE_HUB_TOKEN` และ `HF_TOKEN` หากตั้งค่าทั้งสองรายการ `HUGGINGFACE_HUB_TOKEN` จะมีลำดับความสำคัญสูงกว่า
    </Note>

  </Accordion>

  <Accordion title="การกำหนดค่า: DeepSeek R1 พร้อมโมเดลสำรอง">
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

  <Accordion title="การกำหนดค่า: DeepSeek พร้อมรูปแบบที่ถูกที่สุดและเร็วที่สุด">
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

  <Accordion title="การกำหนดค่า: DeepSeek + GPT-OSS พร้อมนามแฝง">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
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
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และลักษณะการทำงานของการสลับเมื่อระบบล้มเหลว
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="เอกสารผู้ให้บริการอนุมาน" href="https://huggingface.co/docs/inference-providers" icon="book">
    เอกสารทางการของผู้ให้บริการอนุมาน Hugging Face
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
</CardGroup>
