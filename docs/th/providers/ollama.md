---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับโมเดลบนคลาวด์หรือโมเดลภายในเครื่องผ่าน Ollama
    - คุณต้องการคำแนะนำในการตั้งค่าและกำหนดค่า Ollama
    - คุณต้องการใช้โมเดลวิชันของ Ollama เพื่อทำความเข้าใจรูปภาพ
summary: ใช้งาน OpenClaw กับ Ollama (โมเดลบนคลาวด์และโมเดลภายในเครื่อง)
title: Ollama
x-i18n:
    generated_at: "2026-07-16T19:40:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw สื่อสารกับ API แบบเนทีฟของ Ollama (`/api/chat`) ไม่ใช่ปลายทาง
`/v1` ที่เข้ากันได้กับ OpenAI โดยรองรับสามโหมด:

| โหมด          | สิ่งที่ใช้                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| คลาวด์ + ภายในเครื่อง | โฮสต์ Ollama ที่เข้าถึงได้ ซึ่งให้บริการโมเดลภายในเครื่องและโมเดล `:cloud` (หากลงชื่อเข้าใช้แล้ว) |
| คลาวด์เท่านั้น    | `https://ollama.com` โดยตรง ไม่ใช้ดีมอนภายในเครื่อง                                   |
| ภายในเครื่องเท่านั้น    | โฮสต์ Ollama ที่เข้าถึงได้ เฉพาะโมเดลภายในเครื่อง                                       |

สำหรับการตั้งค่าแบบคลาวด์เท่านั้นด้วยรหัสผู้ให้บริการเฉพาะ `ollama-cloud` โปรดดู
[Ollama Cloud](/th/providers/ollama-cloud) ใช้การอ้างอิง `ollama-cloud/<model>` เมื่อ
ต้องการแยกการกำหนดเส้นทางคลาวด์ออกจากผู้ให้บริการ `ollama` ภายในเครื่อง

<Warning>
อย่าใช้ URL `/v1` ที่เข้ากันได้กับ OpenAI (`http://host:11434/v1`) เนื่องจากทำให้การเรียกใช้เครื่องมือเสียหาย และโมเดลอาจส่ง JSON การเรียกใช้เครื่องมือดิบออกมาเป็นข้อความธรรมดา ให้ใช้ URL แบบเนทีฟ: `baseUrl: "http://host:11434"` (ไม่มี `/v1`)
</Warning>

คีย์การกำหนดค่ามาตรฐานคือ `baseUrl` นอกจากนี้ยังยอมรับ `baseURL` สำหรับ
ตัวอย่างรูปแบบ OpenAI SDK แต่การกำหนดค่าใหม่ควรใช้ `baseUrl`

## กฎการยืนยันตัวตน

<AccordionGroup>
  <Accordion title="โฮสต์ภายในเครื่องและ LAN">
    URL ของ Ollama ที่เป็นลูปแบ็ก เครือข่ายส่วนตัว `.local` และชื่อโฮสต์เปล่า ไม่จำเป็นต้องใช้โทเค็น Bearer จริง OpenClaw ใช้เครื่องหมาย `ollama-local` สำหรับกรณีเหล่านี้
  </Accordion>
  <Accordion title="โฮสต์ระยะไกลและ Ollama Cloud">
    โฮสต์ระยะไกลสาธารณะและ `https://ollama.com` ต้องใช้ข้อมูลประจำตัวจริง ได้แก่ `OLLAMA_API_KEY` โปรไฟล์การยืนยันตัวตน หรือ `apiKey` ของผู้ให้บริการ สำหรับการใช้บริการโฮสต์โดยตรง ควรเลือกผู้ให้บริการ `ollama-cloud`
  </Accordion>
  <Accordion title="รหัสผู้ให้บริการแบบกำหนดเอง">
    ผู้ให้บริการแบบกำหนดเองที่มี `api: "ollama"` จะใช้กฎเดียวกัน ตัวอย่างเช่น ผู้ให้บริการ `ollama-remote` ที่ชี้ไปยังโฮสต์ LAN ส่วนตัวสามารถใช้ `apiKey: "ollama-local"` ได้ โดยเอเจนต์ย่อยจะแก้ไขเครื่องหมายดังกล่าวผ่านฮุกผู้ให้บริการ Ollama แทนที่จะถือว่าเป็นข้อมูลประจำตัวที่ขาดหายไป นอกจากนี้ `agents.defaults.memorySearch.provider` ยังสามารถชี้ไปยังรหัสผู้ให้บริการแบบกำหนดเอง เพื่อให้การฝังเวกเตอร์ใช้ปลายทาง Ollama นั้นได้
  </Accordion>
  <Accordion title="โปรไฟล์การยืนยันตัวตน">
    `auth-profiles.json` จัดเก็บข้อมูลประจำตัวสำหรับรหัสผู้ให้บริการ ส่วนการตั้งค่าปลายทาง (`baseUrl`, `api`, โมเดล, ส่วนหัว, การหมดเวลา) ให้ใส่ไว้ใน `models.providers.<id>` ไฟล์แบบแบนรุ่นเก่า เช่น `{ "ollama-windows": { "apiKey": "ollama-local" } }` ไม่ใช่รูปแบบสำหรับรันไทม์ โดย `openclaw doctor --fix` จะเขียนไฟล์เหล่านั้นใหม่เป็นโปรไฟล์คีย์ API แบบมาตรฐาน `ollama-windows:default` พร้อมสำเนาสำรอง ค่า `baseUrl` ในไฟล์แบบเก่านั้นเป็นข้อมูลรบกวนและควรย้ายไปยังการกำหนดค่าผู้ให้บริการ
  </Accordion>
  <Accordion title="ขอบเขตการฝังเวกเตอร์หน่วยความจำ">
    การยืนยันตัวตนแบบ Bearer สำหรับการฝังเวกเตอร์หน่วยความจำของ Ollama จำกัดขอบเขตไว้ที่โฮสต์ซึ่งประกาศไว้:

    - คีย์ระดับผู้ให้บริการจะส่งไปยังโฮสต์ของผู้ให้บริการนั้นเท่านั้น
    - `agents.*.memorySearch.remote.apiKey` จะส่งไปยังโฮสต์การฝังเวกเตอร์ระยะไกลของตนเท่านั้น
    - ค่า env `OLLAMA_API_KEY` เพียงอย่างเดียวจะถือว่าเป็นรูปแบบของ Ollama Cloud และโดยค่าเริ่มต้นจะไม่ส่งไปยังโฮสต์ภายในเครื่องหรือโฮสต์ที่ให้บริการเอง

  </Accordion>
</AccordionGroup>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="การเริ่มต้นใช้งาน (แนะนำ)">
    <Steps>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard
        ```

        เลือก **Ollama** แล้วเลือกโหมด: **คลาวด์ + ภายในเครื่อง**, **คลาวด์เท่านั้น** หรือ **ภายในเครื่องเท่านั้น**

        ในการตั้งค่าแบบมีคำแนะนำครั้งแรก OpenClaw จะตรวจสอบโฮสต์
        Ollama เริ่มต้นหรือที่กำหนดค่าไว้ก่อน หากโมเดลที่ติดตั้งประกาศว่ารองรับเครื่องมือ ลำดับการตั้งค่า
        CLI/macOS ที่ใช้ร่วมกันจะเสนอโมเดลดังกล่าวทันทีและตรวจสอบด้วยการเติมข้อความจริง
        การตรวจสอบอัตโนมัตินี้จะไม่ดึงโมเดลมา หากไม่มีโมเดลที่ติดตั้งซึ่งเหมาะสม
        การเริ่มต้นใช้งานจะดำเนินต่อไปยังตัวเลือก Ollama ตามปกติ
      </Step>
      <Step title="เลือกโมเดล">
        `Cloud only` จะถามหา `OLLAMA_API_KEY` และแนะนำค่าเริ่มต้นของคลาวด์ที่โฮสต์ไว้ `Cloud + Local` และ `Local only` จะถามหา URL ฐานของ Ollama ค้นหาโมเดลที่พร้อมใช้งาน และดึงโมเดลภายในเครื่องที่เลือกโดยอัตโนมัติหากยังไม่มี แท็ก `:latest` ที่ติดตั้งแล้ว เช่น `gemma4:latest` จะแสดงเพียงครั้งเดียวแทนการแสดง `gemma4` ซ้ำ นอกจากนี้ `Cloud + Local` ยังตรวจสอบว่าโฮสต์ลงชื่อเข้าใช้เพื่อเข้าถึงคลาวด์แล้วหรือไม่
      </Step>
      <Step title="ตรวจสอบ">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    แบบไม่โต้ตอบ:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` และ `--custom-model-id` เป็นตัวเลือกเสริม หากละเว้น จะใช้โฮสต์เริ่มต้นภายในเครื่องและโมเดลที่แนะนำ `gemma4`

  </Tab>

  <Tab title="การตั้งค่าด้วยตนเอง">
    <Steps>
      <Step title="ติดตั้งและเริ่ม Ollama">
        ดาวน์โหลดจาก [ollama.com/download](https://ollama.com/download) แล้วดึงโมเดล:

        ```bash
        ollama pull gemma4
        ```

        สำหรับการเข้าถึงคลาวด์แบบไฮบริด ให้เรียกใช้ `ollama signin` บนโฮสต์เดียวกัน
      </Step>
      <Step title="ตั้งค่าข้อมูลประจำตัว">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # โฮสต์ภายในเครื่อง/LAN ใช้ค่าใดก็ได้
        export OLLAMA_API_KEY="your-real-key"   # เฉพาะ https://ollama.com
        ```

        หรือในไฟล์การกำหนดค่า: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`
      </Step>
      <Step title="เลือกโมเดล">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        หรือในไฟล์การกำหนดค่า:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## โมเดลคลาวด์ผ่านโฮสต์ภายในเครื่อง

`Cloud + Local` กำหนดเส้นทางทั้งโมเดลภายในเครื่องและโมเดล `:cloud` ผ่านโฮสต์
Ollama หนึ่งแห่งที่เข้าถึงได้ ซึ่งเป็นโฟลว์ไฮบริดของ Ollama และเป็นโหมดที่ควรเลือกระหว่างการตั้งค่า
เมื่อต้องการใช้ทั้งสองแบบ

OpenClaw จะถามหา URL ฐาน ค้นหาโมเดลภายในเครื่อง และตรวจสอบสถานะ
`ollama signin` เมื่อลงชื่อเข้าใช้แล้ว ระบบจะแนะนำค่าเริ่มต้นที่โฮสต์ไว้
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`) หาก
ยังไม่ได้ลงชื่อเข้าใช้ การตั้งค่าจะคงเป็นแบบภายในเครื่องเท่านั้นจนกว่าจะเรียกใช้ `ollama signin`

สำหรับการเข้าถึงแบบคลาวด์เท่านั้นโดยไม่มีดีมอนภายในเครื่อง ให้ใช้ `openclaw onboard --auth-choice ollama-cloud` และดู [Ollama Cloud](/th/providers/ollama-cloud) — เส้นทางนี้ไม่ต้องใช้ `ollama signin` หรือเซิร์ฟเวอร์ที่กำลังทำงาน:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

รายการโมเดลคลาวด์ที่แสดงระหว่าง `openclaw onboard` จะดึงข้อมูลแบบสดจาก
`https://ollama.com/api/tags` โดยจำกัดไว้ที่ 500 รายการ ดังนั้นตัวเลือกจึงสะท้อน
แค็ตตาล็อกที่โฮสต์อยู่ในปัจจุบัน หากไม่สามารถเข้าถึง `ollama.com` หรือไม่มี
โมเดลส่งกลับมาในขณะตั้งค่า OpenClaw จะย้อนกลับไปใช้รายการแนะนำที่กำหนดไว้ในโค้ด เพื่อให้
การเริ่มต้นใช้งานยังคงเสร็จสมบูรณ์

## การค้นหาโมเดล (ผู้ให้บริการโดยนัย)

เมื่อตั้งค่า `OLLAMA_API_KEY` (หรือโปรไฟล์การยืนยันตัวตน) และไม่ได้กำหนด
`models.providers.ollama` หรือผู้ให้บริการแบบกำหนดเองรายอื่นที่มี `api: "ollama"`
OpenClaw จะค้นหาโมเดลจาก `http://127.0.0.1:11434`:

| ลักษณะการทำงาน             | รายละเอียด                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การค้นหาแค็ตตาล็อก        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| การตรวจหาความสามารถ | `/api/show` แบบพยายามอย่างดีที่สุดจะอ่าน `contextWindow`, พารามิเตอร์ Modelfile `num_ctx` และความสามารถต่าง ๆ (ภาพ/เครื่องมือ/การคิด)                                                                                                                                                                       |
| โมเดลภาพ        | ความสามารถ `vision` จาก `/api/show` ระบุว่าโมเดลรองรับรูปภาพ (`input: ["text", "image"]`)                                                                                                                                                                                             |
| การตรวจหาการให้เหตุผล  | ใช้ความสามารถ `thinking` จาก `/api/show` เมื่อพร้อมใช้งาน และย้อนกลับไปใช้ฮิวริสติกจากชื่อ (`r1`, `reason`, `reasoning`, `think`) เมื่อ Ollama ไม่ระบุความสามารถ โดย `glm-5.2:cloud` และ `deepseek-v4-flash\|pro:cloud` จะถือว่าเป็นโมเดลการให้เหตุผลเสมอไม่ว่าความสามารถที่รายงานจะเป็นอย่างไร |
| ขีดจำกัดโทเค็น         | `maxTokens` ใช้ค่าเริ่มต้นเป็นขีดจำกัดโทเค็นสูงสุดสำหรับ Ollama ของ OpenClaw                                                                                                                                                                                                                                       |
| ค่าใช้จ่าย                | ค่าใช้จ่ายทั้งหมดเป็น `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

การตั้งค่า `models.providers.ollama` พร้อมอาร์เรย์ `models` ที่ระบุไว้อย่างชัดเจน หรือ
ผู้ให้บริการแบบกำหนดเองที่มี `api: "ollama"` และ `baseUrl` ที่ไม่ใช่ลูปแบ็ก จะปิดใช้งาน
การค้นหาอัตโนมัติ จากนั้นต้องกำหนดโมเดลด้วยตนเอง (ดู
[การกำหนดค่า](#configuration)) รายการ `models.providers.ollama` ที่ชี้ไปยัง
`https://ollama.com` ซึ่งโฮสต์ไว้จะข้ามการค้นหาด้วย เนื่องจากโมเดล Ollama Cloud
ได้รับการจัดการโดยผู้ให้บริการ ผู้ให้บริการแบบกำหนดเองที่เป็นลูปแบ็ก เช่น
`http://127.0.0.2:11434` ยังคงถือว่าเป็นภายในเครื่องและเปิดการค้นหาอัตโนมัติไว้

สามารถใช้การอ้างอิงแบบเต็ม เช่น `ollama/<pulled-model>:latest` โดยไม่ต้องมี
รายการ `models.json` ที่เขียนด้วยตนเอง OpenClaw จะแก้ไขการอ้างอิงดังกล่าวแบบสด สำหรับโฮสต์
ที่ลงชื่อเข้าใช้แล้ว การเลือกการอ้างอิง `ollama/<model>:cloud` ที่ไม่อยู่ในรายการจะตรวจสอบโมเดลนั้นโดยตรง
ด้วย `/api/show` และเพิ่มลงในแค็ตตาล็อกรันไทม์เฉพาะเมื่อ Ollama
ยืนยันข้อมูลเมตาแล้วเท่านั้น การพิมพ์ผิดยังคงล้มเหลวในฐานะโมเดลที่ไม่รู้จัก

### การทดสอบเบื้องต้น

สำหรับการตรวจสอบข้อความแบบจำกัดขอบเขตที่ข้ามพื้นผิวเครื่องมือทั้งหมดของเอเจนต์:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "ตอบด้วยข้อความนี้เท่านั้น: pong" \
    --json
```

เพิ่ม `--file` พร้อมรูปภาพสำหรับตรวจสอบโมเดลภาพแบบเบา (รองรับ PNG/JPEG/WebP;
ไฟล์ที่ไม่ใช่รูปภาพจะถูกปฏิเสธก่อนเรียก Ollama — ใช้
`openclaw infer audio transcribe` สำหรับเสียง):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "อธิบายรูปภาพนี้ในหนึ่งประโยค" \
    --file ./photo.jpg \
    --json
```

ทั้งสองเส้นทางจะไม่โหลดเครื่องมือแชต หน่วยความจำ หรือบริบทเซสชัน หากเส้นทางนี้สำเร็จ
แต่การตอบกลับตามปกติของเอเจนต์ล้มเหลว ปัญหาน่าจะอยู่ที่ความสามารถด้านเครื่องมือ/เอเจนต์
ของโมเดล ไม่ใช่ปลายทาง

การเลือกโมเดลด้วย `/model ollama/<model>` เป็นตัวเลือกที่ผู้ใช้ระบุอย่างชัดเจน หากไม่สามารถเข้าถึง
`baseUrl` ที่กำหนดค่าไว้ การตอบกลับครั้งถัดไปจะล้มเหลวพร้อมข้อผิดพลาดจากผู้ให้บริการ
แทนที่จะย้อนกลับไปใช้โมเดลอื่นที่กำหนดค่าไว้อย่างเงียบ ๆ

งาน Cron แบบแยกส่วนจะเพิ่มการตรวจสอบความปลอดภัยภายในเครื่องหนึ่งครั้งก่อนเริ่มรอบการทำงานของเอเจนต์:
หากโมเดลที่เลือกถูกแก้ไขไปยังผู้ให้บริการ Ollama บนเครือข่ายภายใน/ส่วนตัว/`.local`
และไม่สามารถเข้าถึง `/api/tags` ได้ OpenClaw จะบันทึกการทำงานนั้นเป็น
`skipped` พร้อมระบุโมเดลไว้ในข้อความข้อผิดพลาด การตรวจสอบปลายทางนี้จะถูกแคชไว้
5 นาทีต่อโฮสต์ ดังนั้นงาน Cron ที่ทำซ้ำกับดีมอนที่หยุดทำงานจะไม่
ส่งคำขอที่ล้มเหลวทั้งหมด

การตรวจสอบแบบสด:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

สำหรับ Ollama Cloud ให้กำหนดให้การทดสอบแบบสดเดียวกันชี้ไปยังปลายทางที่โฮสต์ไว้ (ข้าม
การฝังข้อมูลโดยค่าเริ่มต้น; บังคับด้วย `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` เนื่องจาก
คีย์คลาวด์อาจไม่มีสิทธิ์ใช้ `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

หากต้องการเพิ่มโมเดล ให้ดึงโมเดลมาแล้วระบบจะค้นพบโดยอัตโนมัติ:

```bash
ollama pull mistral
```

## การอนุมานภายใน Node

เอเจนต์สามารถมอบหมายงานสั้นๆ ให้โมเดล Ollama บนเดสก์ท็อปหรือ
Node เซิร์ฟเวอร์ที่จับคู่ไว้ได้ พรอมต์และการตอบกลับจะส่งผ่านการเชื่อมต่อ
Gateway/Node ที่ยืนยันตัวตนแล้วซึ่งมีอยู่เดิม โดยคำขอจะทำงานผ่านปลายทาง Ollama
แบบลูปแบ็กของ Node เอง (`http://127.0.0.1:11434`)

<Steps>
  <Step title="เริ่ม Ollama บน Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="เชื่อมต่อโฮสต์ Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    อนุมัติอุปกรณ์และคำสั่ง Node ของอุปกรณ์นั้นบนโฮสต์ Gateway จากนั้นตรวจสอบ:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    การเชื่อมต่อครั้งแรก หรือการอัปเกรดที่เพิ่มคำสั่ง Ollama อาจเรียกให้
    อนุมัติคำสั่ง Node หาก Node เชื่อมต่อโดยไม่ได้ประกาศ
    `ollama.models` และ `ollama.chat` ให้ตรวจสอบ `openclaw nodes pending` อีกครั้ง

  </Step>
  <Step title="ใช้งานจากเอเจนต์">
    Plugin Ollama ที่รวมมาให้เปิดเผยเครื่องมือ `node_inference` เอเจนต์จะเรียก
    `action: "discover"` ก่อน จากนั้นเรียก `action: "run"` โดยใช้ Node และโมเดลจาก
    ผลลัพธ์นั้น (`run` สามารถละ Node ได้เมื่อมี Node ที่รองรับเชื่อมต่ออยู่
    เพียงหนึ่งรายการ) ตัวอย่างเช่น: "ค้นหาโมเดล Ollama บน Node ของฉัน แล้วใช้
    โมเดลที่โหลดไว้ซึ่งเร็วที่สุดเพื่อสรุปข้อความนี้"
  </Step>
</Steps>

การค้นพบจะอ่าน `/api/tags` ตรวจสอบความสามารถของ `/api/show` และใช้
`/api/ps` เมื่อพร้อมใช้งานเพื่อจัดอันดับโมเดลที่โหลดอยู่แล้วไว้ก่อน โดยจะส่งคืนเฉพาะ
โมเดลภายในเครื่องที่ Ollama รายงานว่ารองรับการแชต (ความสามารถ `completion`) —
ไม่รวมรายการ Ollama Cloud และโมเดลที่ใช้สำหรับการฝังข้อมูลเท่านั้น การทำงานแต่ละครั้งจะปิด
การคิดของโมเดลและกำหนดเอาต์พุตเริ่มต้นเป็น 512 โทเค็น (ขีดจำกัดตายตัว 8192) เว้นแต่
การเรียกเครื่องมือจะขอ `maxTokens` ที่แตกต่างออกไป; บางโมเดล (เช่น GPT-OSS)
ไม่รองรับการปิดการคิดและอาจยังคงส่งโทเค็นการให้เหตุผลออกมา

หากต้องการให้ Ollama ทำงานต่อบน Node โดยไม่เปิดให้เอเจนต์ใช้งาน:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

เริ่ม Node ใหม่ (`openclaw node restart` หรือหยุด/เรียกใช้ `openclaw node run` ใหม่
สำหรับเซสชันเบื้องหน้า) Node จะหยุดประกาศ `ollama.models` และ
`ollama.chat`; ตัว Ollama เองและผู้ให้บริการ Ollama ของ Gateway จะไม่ได้รับผลกระทบ
ตั้งค่ากลับเป็น `true` แล้วเริ่มใหม่เพื่อเปิดใช้งานอีกครั้ง; พื้นผิวคำสั่งที่เปลี่ยนไป
อาจต้องอนุมัติ `openclaw nodes pending` อีกครั้งหลังเชื่อมต่อใหม่

ตรวจสอบคำสั่ง Node โดยตรงโดยไม่ผ่านรอบการทำงานของเอเจนต์:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` จำกัดระยะเวลาที่ Node สามารถใช้เรียกคำสั่ง;
`--timeout` จำกัดการเรียก Gateway โดยรวมและควรมีค่ามากกว่า

การอนุมานภายใน Node จะใช้ปลายทางลูปแบ็กของ Node เองเสมอ — โดยจะ
ไม่ใช้ `models.providers.ollama.baseUrl` ระยะไกล/คลาวด์ที่กำหนดค่าไว้ซ้ำ
คำสั่ง Node พร้อมใช้งานโดยค่าเริ่มต้นบนโฮสต์ Node ของ macOS, Linux และ Windows
และยังคงอยู่ภายใต้นโยบายการจับคู่/คำสั่ง Node ตามปกติ

## การมองเห็นและคำอธิบายรูปภาพ

Plugin Ollama ที่รวมมาให้จะลงทะเบียน Ollama เป็นผู้ให้บริการ
การทำความเข้าใจสื่อที่รองรับรูปภาพ เพื่อให้ OpenClaw สามารถกำหนดเส้นทางคำขอ
คำอธิบายรูปภาพที่ระบุชัดเจนและค่าเริ่มต้นของโมเดลรูปภาพที่กำหนดค่าไว้ผ่านโมเดล
การมองเห็น Ollama ภายในเครื่องหรือที่โฮสต์ไว้

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` ต้องเป็นการอ้างอิง `<provider/model>` แบบเต็ม; เมื่อตั้งค่าแล้ว `infer image
describe` จะลองใช้โมเดลนั้นก่อน แทนที่จะข้ามคำอธิบายสำหรับโมเดล
ที่รองรับการมองเห็นแบบเนทีฟอยู่แล้ว หากการเรียกล้มเหลว OpenClaw สามารถดำเนินการต่อ
ผ่าน `agents.defaults.imageModel.fallbacks`; ข้อผิดพลาดในการเตรียมไฟล์/URL
จะล้มเหลวก่อนพยายามใช้ตัวสำรอง ใช้ `infer image describe` สำหรับโฟลว์
การทำความเข้าใจรูปภาพของ OpenClaw และ `imageModel` ที่กำหนดค่าไว้; ใช้ `infer model run
--file` สำหรับการตรวจสอบมัลติโมดัลโดยตรงด้วยพรอมต์ที่กำหนดเอง

หากต้องการกำหนดให้ Ollama เป็นผู้ให้บริการเริ่มต้นสำหรับการทำความเข้าใจรูปภาพของสื่อขาเข้า:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

ควรใช้การอ้างอิง `ollama/<model>` แบบเต็ม การอ้างอิง `imageModel` แบบไม่มีคำนำหน้า เช่น
`qwen2.5vl:7b` จะถูกปรับรูปแบบเป็น `ollama/qwen2.5vl:7b` เฉพาะเมื่อโมเดลที่ตรงกันทุกประการ
แสดงอยู่ภายใต้ `models.providers.ollama.models` พร้อม
`input: ["text", "image"]` และไม่มีผู้ให้บริการรูปภาพอื่นที่กำหนดค่าไว้เปิดเผย
รหัสแบบไม่มีคำนำหน้าเดียวกัน; มิฉะนั้นให้ระบุคำนำหน้าผู้ให้บริการอย่างชัดเจน

โมเดลการมองเห็นภายในเครื่องที่ทำงานช้าอาจต้องใช้ระยะหมดเวลาสำหรับการทำความเข้าใจรูปภาพนานกว่า
โมเดลคลาวด์ และอาจหยุดทำงานบนฮาร์ดแวร์ที่มีข้อจำกัดหาก Ollama พยายาม
จัดสรรบริบทการมองเห็นที่โมเดลประกาศไว้ทั้งหมด ตั้งค่าระยะหมดเวลาของความสามารถ
และจำกัด `num_ctx`:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

ระยะหมดเวลานี้ใช้กับการทำความเข้าใจรูปภาพขาเข้าและเครื่องมือ
`image` ที่เรียกใช้อย่างชัดเจน ส่วน `models.providers.ollama.timeoutSeconds` ยังคงควบคุม
ตัวป้องกันคำขอ HTTP ของ Ollama ที่อยู่เบื้องหลังสำหรับการเรียกโมเดลตามปกติ

การตรวจสอบแบบสด:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

หากกำหนด `models.providers.ollama.models` ด้วยตนเอง ให้ระบุโมเดลการมองเห็น
อย่างชัดเจน:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw จะปฏิเสธคำขอคำอธิบายรูปภาพสำหรับโมเดลที่ไม่ได้ระบุว่า
รองรับรูปภาพ เมื่อใช้การค้นพบโดยนัย ค่านี้จะมาจากความสามารถด้านการมองเห็นของ `/api/show`

## การกำหนดค่า

<Tabs>
  <Tab title="พื้นฐาน (การค้นพบโดยนัย)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    หากตั้งค่า `OLLAMA_API_KEY` ไว้ สามารถละ `apiKey` ในรายการผู้ให้บริการได้; OpenClaw จะเติมค่านี้เพื่อใช้ตรวจสอบความพร้อมใช้งาน
    </Tip>

  </Tab>

  <Tab title="แบบชัดเจน (โมเดลที่กำหนดเอง)">
    ใช้การกำหนดค่าแบบชัดเจนสำหรับการตั้งค่าคลาวด์ที่โฮสต์ไว้ โฮสต์/พอร์ตที่ไม่ใช่ค่าเริ่มต้น หน้าต่าง
    บริบทแบบบังคับ หรือรายการโมเดลที่กำหนดเองทั้งหมด:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="URL ฐานแบบกำหนดเอง">
    การกำหนดค่าแบบชัดเจนจะปิดการค้นพบอัตโนมัติ ดังนั้นต้องระบุรายการโมเดล:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // ไม่มี /v1 - URL ของ Ollama API แบบเนทีฟ
            api: "ollama", // ระบุชัดเจน: รับประกันลักษณะการเรียกเครื่องมือแบบเนทีฟ
            timeoutSeconds: 300, // ไม่บังคับ: เพิ่มงบเวลาการเชื่อมต่อ/สตรีมสำหรับโมเดลภายในเครื่องที่ยังไม่ถูกโหลด
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // ไม่บังคับ: โหลดโมเดลค้างไว้ระหว่างรอบการทำงาน
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    อย่าเพิ่ม `/v1` พาธนั้นจะเลือกโหมดที่เข้ากันได้กับ OpenAI ซึ่งการเรียกเครื่องมือไม่น่าเชื่อถือ
    </Warning>

  </Tab>
</Tabs>

## สูตรการใช้งานทั่วไป

แทนที่รหัสโมเดลด้วยชื่อที่ตรงกันทุกประการจาก `ollama list` หรือ
`openclaw models list --provider ollama`

<AccordionGroup>
  <Accordion title="โมเดลภายในเครื่องพร้อมการค้นพบอัตโนมัติ">
    Ollama บนเครื่องเดียวกับ Gateway ซึ่งค้นพบโดยอัตโนมัติ:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    อย่าเพิ่มบล็อก `models.providers.ollama` เว้นแต่ต้องการกำหนดโมเดลด้วยตนเอง

  </Accordion>

  <Accordion title="โฮสต์ Ollama บน LAN พร้อมโมเดลที่กำหนดเอง">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` คืองบบริบทของ OpenClaw; `params.num_ctx` จะถูกส่งไปยัง
    Ollama ให้รักษาค่าทั้งสองให้สอดคล้องกันเมื่อฮาร์ดแวร์ไม่สามารถเรียกใช้บริบททั้งหมด
    ที่โมเดลประกาศไว้ได้

  </Accordion>

  <Accordion title="Ollama Cloud เท่านั้น">
    ไม่มีดีมอนภายในเครื่อง ใช้โมเดลที่โฮสต์ไว้โดยตรง:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
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
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    สำหรับรหัสผู้ให้บริการเฉพาะ `ollama-cloud` แทนรูปแบบนี้ โปรดดู
    [Ollama Cloud](/th/providers/ollama-cloud)

  </Accordion>

  <Accordion title="คลาวด์ร่วมกับระบบภายในเครื่องผ่านดีมอนที่ลงชื่อเข้าใช้แล้ว">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="โฮสต์ Ollama หลายโฮสต์">
    ใช้รหัสผู้ให้บริการแบบกำหนดเองเมื่อเรียกใช้เซิร์ฟเวอร์ Ollama มากกว่าหนึ่งเซิร์ฟเวอร์ โดยแต่ละรายการมี
    โฮสต์ โมเดล การยืนยันตัวตน และระยะหมดเวลาของตนเอง

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw จะตัดคำนำหน้าผู้ให้บริการที่ใช้งานอยู่ (โดยใช้คำนำหน้าเปล่า
    `ollama/` เป็นทางเลือกสำรอง) ก่อนเรียก Ollama ดังนั้น `ollama-large/qwen3.5:27b`
    จึงไปถึง Ollama ในรูป `qwen3.5:27b`

  </Accordion>

  <Accordion title="โปรไฟล์โมเดลภายในเครื่องแบบประหยัด">
    โมเดลภายในเครื่องบางรุ่นรองรับพรอมต์ง่าย ๆ ได้ แต่มีปัญหากับพื้นผิวเครื่องมือทั้งหมด
    ของเอเจนต์ ให้จำกัดเครื่องมือและบริบทก่อนปรับการตั้งค่ารันไทม์ส่วนกลาง:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    ใช้ `compat.supportsTools: false` เฉพาะเมื่อโมเดลหรือเซิร์ฟเวอร์
    ล้มเหลวกับสคีมาเครื่องมืออย่างสม่ำเสมอเท่านั้น เพราะเป็นการแลกความสามารถของเอเจนต์กับความเสถียร
    `localModelLean` จะนำเครื่องมือเบราว์เซอร์, Cron, ข้อความ, การสร้างสื่อ,
    เสียง และ PDF ที่ใช้ทรัพยากรมากออกจากพื้นผิวโดยตรงของเอเจนต์ เว้นแต่จะระบุว่าจำเป็นอย่างชัดเจน
    และย้ายแค็ตตาล็อกขนาดใหญ่ไว้หลังการค้นหาเครื่องมือ โดยไม่เปลี่ยนบริบทรันไทม์
    หรือโหมดการคิดของ Ollama ใช้ร่วมกับ `params.num_ctx` และ
    `params.thinking: false` สำหรับโมเดลการคิดขนาดเล็กแบบ Qwen ที่วนซ้ำหรือ
    ใช้งบประมาณไปกับการให้เหตุผลที่ซ่อนอยู่

  </Accordion>
</AccordionGroup>

### การเลือกโมเดล

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

รหัสผู้ให้บริการแบบกำหนดเองทำงานในลักษณะเดียวกัน สำหรับการอ้างอิงที่ใช้คำนำหน้าผู้ให้บริการ
ที่ใช้งานอยู่ เช่น `ollama-spark/qwen3:32b` OpenClaw จะตัดคำนำหน้านั้นออกก่อน
เรียก Ollama และส่ง `qwen3:32b`

สำหรับโมเดลภายในเครื่องที่ทำงานช้า ควรปรับแต่งเฉพาะขอบเขตผู้ให้บริการก่อนเพิ่มระยะหมดเวลา
ของรันไทม์เอเจนต์ทั้งหมด:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` ครอบคลุมคำขอ HTTP ของโมเดล ได้แก่ การตั้งค่าการเชื่อมต่อ ส่วนหัว
การสตรีมเนื้อหา และการยกเลิก guarded-fetch โดยรวม `params.keep_alive` จะถูก
ส่งต่อเป็น `keep_alive` ระดับบนสุดในคำขอ `/api/chat` แบบเนทีฟ ให้ตั้งค่าต่อ
โมเดลเมื่อเวลาโหลดในเทิร์นแรกเป็นคอขวด

### การตรวจสอบอย่างรวดเร็ว

```bash
# ดีมอน Ollama ที่เครื่องนี้มองเห็นได้
curl http://127.0.0.1:11434/api/tags

# แค็ตตาล็อก OpenClaw และโมเดลที่เลือก
openclaw models list --provider ollama
openclaw models status

# การทดสอบพื้นฐานของโมเดลโดยตรง
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: ok"
```

สำหรับโฮสต์ระยะไกล ให้แทนที่ `127.0.0.1` ด้วยโฮสต์ `baseUrl` หาก `curl`
ทำงานได้แต่ OpenClaw ไม่ทำงาน ให้ตรวจสอบว่า Gateway ทำงานอยู่บนเครื่อง
คอนเทนเนอร์ หรือบัญชีบริการอื่นหรือไม่

## การค้นหาเว็บของ Ollama

OpenClaw รวม **การค้นหาเว็บของ Ollama** ไว้เป็นผู้ให้บริการ `web_search`

| คุณสมบัติ    | รายละเอียด                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| โฮสต์        | `models.providers.ollama.baseUrl` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `http://127.0.0.1:11434`; `https://ollama.com` ใช้ API ที่โฮสต์โดยตรง                          |
| การยืนยันตัวตน        | ไม่ต้องใช้คีย์สำหรับโฮสต์ภายในเครื่องที่ลงชื่อเข้าใช้แล้ว; ใช้ `OLLAMA_API_KEY` หรือการยืนยันตัวตนของผู้ให้บริการที่กำหนดค่าไว้สำหรับการค้นหา `https://ollama.com` โดยตรงหรือโฮสต์ที่ป้องกันด้วยการยืนยันตัวตน           |
| ข้อกำหนด | โฮสต์ภายในเครื่อง/ที่โฮสต์เองต้องทำงานอยู่และลงชื่อเข้าใช้ด้วย `ollama signin`; การค้นหาผ่านโฮสต์โดยตรงต้องใช้ `baseUrl: "https://ollama.com"` พร้อมคีย์ API จริง |

เลือกรายการนี้ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` หรือตั้งค่า:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

สำหรับการค้นหาผ่านโฮสต์โดยตรงด้วย Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

สำหรับโฮสต์ที่โฮสต์เอง OpenClaw จะลองใช้พร็อกซี `/api/experimental/web_search`
ภายในเครื่องก่อน แล้วจึงใช้เส้นทาง `/api/web_search` ที่โฮสต์บนโฮสต์เดียวกันเป็นทางเลือกสำรอง โดยปกติ
ดีมอนภายในเครื่องที่ลงชื่อเข้าใช้แล้วจะตอบผ่านพร็อกซีภายในเครื่อง การเรียก
`https://ollama.com` โดยตรงจะใช้ปลายทาง `/api/web_search` ที่โฮสต์เสมอ

<Note>
สำหรับการตั้งค่าและลักษณะการทำงานทั้งหมด โปรดดู [การค้นหาเว็บของ Ollama](/th/tools/ollama-search)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดที่เข้ากันได้กับ OpenAI แบบเดิม">
    <Warning>
    **การเรียกใช้เครื่องมือในโหมดนี้ไม่น่าเชื่อถือ** ใช้เฉพาะเมื่อพร็อกซีต้องใช้รูปแบบ OpenAI และไม่ได้พึ่งพาการเรียกใช้เครื่องมือแบบเนทีฟ
    </Warning>

    ตั้งค่า `api: "openai-completions"` อย่างชัดเจนสำหรับพร็อกซีที่อยู่หลัง
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // ค่าเริ่มต้น: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    โหมดนี้อาจไม่รองรับการสตรีมและการเรียกใช้เครื่องมือพร้อมกัน คุณ
    อาจต้องใช้ `params: { streaming: false }` กับโมเดล

    OpenClaw จะแทรก `options.num_ctx` เป็นค่าเริ่มต้นในโหมดนี้ เพื่อไม่ให้ Ollama
    ย้อนกลับไปใช้บริบท 4096 โทเค็นโดยไม่มีการแจ้งเตือน หากพร็อกซีปฏิเสธฟิลด์
    `options` ที่ไม่รู้จัก ให้ปิดใช้งาน:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="หน้าต่างบริบท">
    สำหรับโมเดลที่ค้นพบโดยอัตโนมัติ OpenClaw จะใช้หน้าต่างบริบทที่ `/api/show`
    รายงาน ซึ่งรวมถึงค่า `PARAMETER num_ctx` ที่มากกว่าจาก
    Modelfile แบบกำหนดเอง มิฉะนั้นจะใช้หน้าต่างบริบท Ollama เริ่มต้นของ OpenClaw

    `contextWindow`, `contextTokens` และ `maxTokens` ระดับผู้ให้บริการจะตั้ง
    ค่าเริ่มต้นสำหรับทุกโมเดลภายใต้ผู้ให้บริการนั้น และสามารถแทนที่แยกตาม
    โมเดลได้ `contextWindow` คืองบประมาณพรอมต์/Compaction ของ OpenClaw เอง คำขอ
    `/api/chat` แบบเนทีฟจะไม่ตั้งค่า `options.num_ctx` เว้นแต่จะตั้งค่า
    `params.num_ctx` อย่างชัดเจน ดังนั้น Ollama จะใช้ค่าเริ่มต้นตามโมเดล
    `OLLAMA_CONTEXT_LENGTH` หรือ VRAM ของตนเอง โดยจะละเว้นค่า `params.num_ctx`
    ที่ไม่ถูกต้อง เป็นศูนย์ เป็นค่าลบ หรือไม่เป็นจำนวนจำกัด หากการกำหนดค่าเก่าใช้
    เฉพาะ `contextWindow`/`maxTokens` เพื่อบังคับบริบทคำขอแบบเนทีฟ ให้เรียกใช้
    `openclaw doctor --fix` เพื่อคัดลอกค่าเหล่านั้นไปยัง `params.num_ctx` ส่วน
    อะแดปเตอร์ที่เข้ากันได้กับ OpenAI ยังคงแทรก `options.num_ctx` เป็นค่าเริ่มต้นจาก
    `params.num_ctx` หรือ `contextWindow` ที่กำหนดค่าไว้ ให้ปิดใช้งานด้วย
    `injectNumCtxForOpenAICompat: false` หากต้นทางปฏิเสธ `options`

    รายการโมเดลแบบเนทีฟยังรองรับตัวเลือกรันไทม์ Ollama ทั่วไปภายใต้
    `params` ซึ่งส่งต่อเป็น `/api/chat` `options` แบบเนทีฟ ได้แก่ `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` และ `num_thread`
    คีย์บางรายการ (`format`, `keep_alive`, `truncate`, `shift`) จะถูกส่งต่อเป็น
    ฟิลด์คำขอระดับบนสุดแทนที่จะซ้อนอยู่ใน `options` OpenClaw จะส่งต่อ
    เฉพาะคีย์คำขอ Ollama เหล่านี้ ดังนั้นพารามิเตอร์สำหรับรันไทม์เท่านั้น เช่น
    `streaming` จะไม่ถูกส่งไปยัง Ollama ใช้ `params.think` (หรือ
    `params.thinking`) เพื่อตั้งค่า `think` ระดับบนสุด โดย `false` จะปิดใช้งาน
    การคิดระดับ API สำหรับโมเดลการคิดแบบ Qwen

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` ต่อโมเดลก็
    ใช้งานได้เช่นกัน โดยรายการโมเดลของผู้ให้บริการที่ระบุอย่างชัดเจนจะมีลำดับความสำคัญหากตั้งค่าทั้งสองรายการ

  </Accordion>

  <Accordion title="การควบคุมการคิด">
    OpenClaw จะส่งต่อการคิดตามที่ Ollama คาดไว้ คือ `think` ระดับบนสุด ไม่ใช่
    `options.think` โมเดลที่ค้นพบโดยอัตโนมัติซึ่ง `/api/show` รายงาน
    ความสามารถ `thinking` จะแสดง `/think low`, `/think medium`, `/think high`
    และ `/think max` ส่วนโมเดลที่ไม่มีการคิดจะแสดงเฉพาะ `/think off`

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    หรือตั้งค่าเริ่มต้นของโมเดล:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think`/`params.thinking` แบบรายโมเดลสามารถปิดใช้งานหรือบังคับการคิดผ่าน API
    สำหรับโมเดลที่ระบุได้ OpenClaw จะคงการกำหนดค่าที่ระบุอย่างชัดเจนนั้นไว้
    เมื่อการเรียกใช้ปัจจุบันมีเพียงค่าเริ่มต้นโดยนัย `off`; คำสั่งรันไทม์
    ที่ไม่ใช่ปิด เช่น `/think medium` ยังคงมีผลแทนที่ จะไม่มีการส่งคำขอ
    ให้คิดที่มีค่าเป็นจริงไปยังโมเดลที่ทำเครื่องหมายอย่างชัดเจนเป็น
    `reasoning: false`; ส่วนคำขอ `think: false` จะถูกส่งเสมอไม่ว่าอย่างไรก็ตาม

  </Accordion>

  <Accordion title="โมเดลการให้เหตุผล">
    โมเดลที่มีชื่อ `deepseek-r1`, `reasoning`, `reason` หรือ `think` จะถือว่า
    รองรับการให้เหตุผลโดยค่าเริ่มต้น โดยไม่ต้องกำหนดค่าเพิ่มเติม:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="ค่าใช้จ่ายของโมเดล">
    Ollama ทำงานในเครื่องและไม่มีค่าใช้จ่าย ดังนั้นค่าใช้จ่ายของโมเดลทั้งหมดจึงเป็น `0` ทั้งสำหรับ
    โมเดลที่ค้นพบอัตโนมัติและโมเดลที่กำหนดด้วยตนเอง
  </Accordion>

  <Accordion title="เวกเตอร์ฝังตัวของหน่วยความจำ">
    Plugin Ollama ที่มาพร้อมกันจะลงทะเบียนผู้ให้บริการเวกเตอร์ฝังตัวของหน่วยความจำสำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory) โดยใช้ URL ฐานและคีย์ API ของ Ollama
    ที่กำหนดค่าไว้ เรียก `/api/embed` และรวมส่วนย่อยของหน่วยความจำหลายส่วนไว้ใน
    คำขอ `input` เดียวเมื่อทำได้

    เมื่อ `proxy.enabled=true` คำขอเวกเตอร์ฝังตัวไปยังต้นทางลูปแบ็ก
    ภายในโฮสต์ที่ตรงกันทุกประการ ซึ่งได้มาจาก `baseUrl` ที่กำหนดค่าไว้ จะใช้เส้นทางตรง
    ที่มีการป้องกันของ OpenClaw แทนพร็อกซีส่งต่อที่มีการจัดการ ชื่อโฮสต์ที่กำหนดค่า
    ต้องเป็น `localhost` หรือที่อยู่ IP ลูปแบ็กแบบลิเทอรัลเท่านั้น ชื่อ DNS
    ที่เพียงแค่แปลงค่าไปยังลูปแบ็กจะยังคงใช้เส้นทางพร็อกซีที่มีการจัดการ โฮสต์ Ollama
    บน LAN, tailnet, เครือข่ายส่วนตัว และสาธารณะจะใช้เส้นทางพร็อกซี
    ที่มีการจัดการเสมอ และการเปลี่ยนเส้นทางไปยังโฮสต์/พอร์ตอื่นจะไม่ได้รับ
    ความเชื่อถือสืบทอดมา `proxy.loopbackMode: "proxy"` จะกำหนดเส้นทางการรับส่งข้อมูลลูปแบ็กผ่าน
    พร็อกซีเช่นเดิม ส่วน `proxy.loopbackMode: "block"` จะปฏิเสธก่อนเชื่อมต่อ —
    ดู[พร็อกซีที่มีการจัดการ](/th/security/network-proxy#gateway-loopback-mode)

    | คุณสมบัติ | ค่า |
    | --- | --- |
    | โมเดลเริ่มต้น | `nomic-embed-text` |
    | ดึงอัตโนมัติ | ใช่ หากยังไม่มีในเครื่อง |
    | จำนวนงานพร้อมกันแบบอินไลน์เริ่มต้น | 1 (ผู้ให้บริการอื่นมีค่าเริ่มต้นสูงกว่า; เพิ่มด้วย `nonBatchConcurrency` หากโฮสต์รองรับได้) |

    เวกเตอร์ฝังตัวขณะสืบค้นจะใช้คำนำหน้าสำหรับการดึงข้อมูลกับโมเดลที่กำหนดให้ใช้หรือ
    แนะนำให้ใช้ ได้แก่ `nomic-embed-text`, `qwen3-embedding` และ
    `mxbai-embed-large` ชุดเอกสารจะยังคงเป็นข้อมูลดิบ ดังนั้นดัชนีที่มีอยู่
    จึงไม่ต้องย้ายรูปแบบ

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // ค่าเริ่มต้นสำหรับ Ollama เพิ่มค่านี้บนโฮสต์ขนาดใหญ่หากการทำดัชนีใหม่ช้าเกินไป
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    สำหรับโฮสต์เวกเตอร์ฝังตัวระยะไกล ให้จำกัดขอบเขตการตรวจสอบสิทธิ์ไว้ที่โฮสต์นั้น:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การกำหนดค่าสตรีมมิง">
    Ollama ใช้ **API แบบเนทีฟ** (`/api/chat`) โดยค่าเริ่มต้น ซึ่งรองรับ
    สตรีมมิงและการเรียกใช้เครื่องมือพร้อมกัน โดยไม่ต้องกำหนดค่าพิเศษ

    สำหรับคำขอแบบเนทีฟ การควบคุมการคิดจะถูกส่งต่อโดยตรง: `/think off`
    และ `openclaw agent --thinking off` จะส่ง `think: false` ระดับบนสุด เว้นแต่
    จะกำหนด `params.think`/`params.thinking` อย่างชัดเจน; `/think
    low|medium|high` จะส่งสตริงระดับความพยายามที่ตรงกัน; `/think max` จะแมปไปยัง
    ระดับความพยายามสูงสุดของ Ollama คือ `think: "high"`

    <Tip>
    หากต้องการใช้ปลายทางที่เข้ากันได้กับ OpenAI แทน โปรดดู "โหมดดั้งเดิมที่เข้ากันได้กับ OpenAI" ด้านบน — สตรีมมิงและการเรียกใช้เครื่องมืออาจทำงานร่วมกันไม่ได้ในโหมดนั้น
    </Tip>

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="วงจรการขัดข้องของ WSL2 (รีบูตซ้ำ)">
    บน WSL2 ที่ใช้ NVIDIA/CUDA โปรแกรมติดตั้ง Ollama สำหรับ Linux อย่างเป็นทางการจะสร้าง
    หน่วย systemd `ollama.service` พร้อม `Restart=always` หากบริการนั้น
    เริ่มทำงานอัตโนมัติและโหลดโมเดลที่ใช้ GPU ระหว่างการบูต WSL2 Ollama อาจตรึง
    หน่วยความจำของโฮสต์ไว้ขณะโหลด; การเรียกคืนหน่วยความจำของ Hyper-V อาจไม่สามารถเรียกคืน
    หน้าเหล่านั้นได้เสมอ Windows จึงอาจยุติ VM ของ WSL2 จากนั้น systemd จะเริ่ม
    Ollama ใหม่ และวงจรจะเกิดซ้ำ

    หลักฐาน: WSL2 รีบูต/ถูกยุติซ้ำ มีการใช้ CPU สูงใน `app.slice` หรือ
    `ollama.service` ทันทีหลังเริ่มต้น WSL2 และได้รับ SIGTERM จาก systemd
    แทนที่จะเป็นตัวจัดการ OOM ของ Linux

    OpenClaw จะบันทึกคำเตือนเมื่อเริ่มต้น หากตรวจพบ WSL2, เปิดใช้ `ollama.service`
    พร้อม `Restart=always` และพบตัวบ่งชี้ CUDA ที่มองเห็นได้

    แนวทางบรรเทา:

    ```bash
    sudo systemctl disable ollama
    ```

    ฝั่ง Windows ให้เพิ่มข้อมูลนี้ใน `%USERPROFILE%\.wslconfig` แล้วเรียกใช้
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    หรือย่นระยะเวลาคงการทำงาน / เริ่ม Ollama ด้วยตนเองเฉพาะเมื่อจำเป็น:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    ดู [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)

  </Accordion>

  <Accordion title="ตรวจไม่พบ Ollama">
    ยืนยันว่า Ollama กำลังทำงาน มีการตั้งค่า `OLLAMA_API_KEY` (หรือโปรไฟล์การตรวจสอบสิทธิ์)
    และ **ไม่ได้** กำหนด `models.providers.ollama` อย่างชัดเจน:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="ไม่มีโมเดลที่พร้อมใช้งาน">
    ดึงโมเดลมาไว้ในเครื่อง หรือกำหนดอย่างชัดเจนใน
    `models.providers.ollama`:

    ```bash
    ollama list  # ดูว่าติดตั้งอะไรไว้บ้าง
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # หรือโมเดลอื่น
    ```

  </Accordion>

  <Accordion title="การเชื่อมต่อถูกปฏิเสธ">
    ```bash
    # ตรวจสอบว่า Ollama กำลังทำงานหรือไม่
    ps aux | grep ollama

    # หรือเริ่ม Ollama ใหม่
    ollama serve
    ```

  </Accordion>

  <Accordion title="โฮสต์ระยะไกลใช้ได้กับ curl แต่ใช้กับ OpenClaw ไม่ได้">
    ตรวจสอบจากเครื่องและรันไทม์เดียวกับที่เรียกใช้ Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    สาเหตุที่พบบ่อย:

    - `baseUrl` ชี้ไปที่ `localhost` แต่ Gateway ทำงานใน Docker หรือบนโฮสต์อื่น
    - URL ใช้ `/v1` ซึ่งเลือกพฤติกรรมที่เข้ากันได้กับ OpenAI แทน Ollama แบบเนทีฟ
    - โฮสต์ระยะไกลต้องเปลี่ยนการตั้งค่าไฟร์วอลล์หรือการผูกกับ LAN
    - โมเดลอยู่ในดีมอนบนแล็ปท็อปของคุณ แต่ไม่ได้อยู่ในดีมอนระยะไกล

  </Accordion>

  <Accordion title="โมเดลแสดงผล JSON ของเครื่องมือเป็นข้อความ">
    โดยทั่วไปผู้ให้บริการอยู่ในโหมดที่เข้ากันได้กับ OpenAI หรือโมเดลไม่สามารถ
    จัดการสคีมาเครื่องมือได้ ควรใช้โหมดเนทีฟ:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    หากโมเดลภายในเครื่องขนาดเล็กยังคงล้มเหลวกับสคีมาเครื่องมือ ให้ตั้งค่า
    `compat.supportsTools: false` ในรายการของโมเดลนั้นแล้วทดสอบอีกครั้ง

  </Accordion>

  <Accordion title="Kimi หรือ GLM ส่งคืนสัญลักษณ์ที่อ่านไม่ออก">
    การตอบกลับของ Kimi/GLM ที่โฮสต์ไว้ซึ่งเป็นลำดับสัญลักษณ์ยาวและไม่ใช่ภาษา
    จะถือเป็นการเรียกผู้ให้บริการที่ล้มเหลว แทนที่จะเป็นการตอบกลับที่สำเร็จ เพื่อให้
    กลไกลองใหม่/สำรอง/จัดการข้อผิดพลาดตามปกติทำงานแทนการเก็บ
    ข้อความเสียหายไว้ในเซสชัน

    หากเกิดซ้ำ ให้บันทึกชื่อโมเดล ไฟล์เซสชันปัจจุบัน และ
    การเรียกใช้นั้นใช้ `Cloud + Local` หรือ `Cloud only` จากนั้นลองใช้เซสชันใหม่
    และโมเดลสำรอง:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="โมเดลภายในเครื่องที่ยังไม่อุ่นเครื่องหมดเวลา">
    โมเดลภายในเครื่องขนาดใหญ่อาจต้องใช้เวลาโหลดครั้งแรกนาน ให้จำกัดขอบเขตระยะหมดเวลาไว้ที่
    ผู้ให้บริการ Ollama และเลือกให้โมเดลคงอยู่ในหน่วยความจำระหว่างรอบการโต้ตอบ:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    หากตัวโฮสต์เองตอบรับการเชื่อมต่อช้า `timeoutSeconds` จะ
    ขยายระยะหมดเวลาการเชื่อมต่อที่มีการป้องกันสำหรับผู้ให้บริการนี้ด้วย

  </Accordion>

  <Accordion title="โมเดลบริบทยาวช้าเกินไปหรือหน่วยความจำไม่พอ">
    โมเดลจำนวนมากประกาศขนาดบริบทที่ใหญ่กว่าที่ฮาร์ดแวร์ของคุณจะเรียกใช้
    ได้อย่างราบรื่น Ollama แบบเนทีฟจะใช้ค่าเริ่มต้นของรันไทม์เอง เว้นแต่
    จะตั้งค่า `params.num_ctx` จำกัดทั้งงบประมาณของ OpenClaw และบริบทคำขอ
    ของ Ollama เพื่อให้เวลาแฝงก่อนโทเค็นแรกคาดการณ์ได้:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    ลด `contextWindow` หาก OpenClaw ส่งพรอมต์มากเกินไป ลด
    `params.num_ctx` หากบริบทของรันไทม์ Ollama ใหญ่เกินไปสำหรับเครื่อง
    ลด `maxTokens` หากการสร้างผลลัพธ์ใช้เวลานานเกินไป

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/th/providers/ollama-cloud" icon="cloud">
    การตั้งค่าเฉพาะระบบคลาวด์ด้วยผู้ให้บริการ `ollama-cloud` โดยเฉพาะ
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อขัดข้อง
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="การค้นหาเว็บด้วย Ollama" href="/th/tools/ollama-search" icon="magnifying-glass">
    รายละเอียดทั้งหมดเกี่ยวกับการตั้งค่าและพฤติกรรมของการค้นหาเว็บที่ขับเคลื่อนด้วย Ollama
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
</CardGroup>
