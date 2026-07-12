---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับโมเดลบนคลาวด์หรือโมเดลภายในเครื่องผ่าน Ollama
    - คุณต้องการคำแนะนำในการติดตั้งและกำหนดค่า Ollama
    - คุณต้องการใช้โมเดลด้านการมองเห็นของ Ollama เพื่อทำความเข้าใจรูปภาพ
summary: เรียกใช้ OpenClaw ด้วย Ollama (โมเดลบนคลาวด์และโมเดลภายในเครื่อง)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T16:38:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw สื่อสารกับ API แบบเนทีฟของ Ollama (`/api/chat`) ไม่ใช่ปลายทาง
`/v1` ที่เข้ากันได้กับ OpenAI โดยรองรับสามโหมด:

| โหมด          | สิ่งที่ใช้                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| คลาวด์ + ภายในเครื่อง | โฮสต์ Ollama ที่เข้าถึงได้ ซึ่งให้บริการโมเดลภายในเครื่องและโมเดล `:cloud` (หากลงชื่อเข้าใช้แล้ว) |
| คลาวด์เท่านั้น    | ใช้ `https://ollama.com` โดยตรง โดยไม่มีดีมอนภายในเครื่อง                                   |
| ภายในเครื่องเท่านั้น    | โฮสต์ Ollama ที่เข้าถึงได้ เฉพาะโมเดลภายในเครื่อง                                       |

สำหรับการตั้งค่าแบบคลาวด์เท่านั้นด้วยรหัสผู้ให้บริการเฉพาะ `ollama-cloud` โปรดดู
[Ollama Cloud](/th/providers/ollama-cloud) ใช้การอ้างอิง `ollama-cloud/<model>` เมื่อ
คุณต้องการแยกการกำหนดเส้นทางผ่านคลาวด์ออกจากผู้ให้บริการ `ollama` ภายในเครื่อง

<Warning>
อย่าใช้ URL `/v1` ที่เข้ากันได้กับ OpenAI (`http://host:11434/v1`) เพราะจะทำให้การเรียกใช้เครื่องมือเสียหาย และโมเดลอาจแสดง JSON การเรียกใช้เครื่องมือดิบเป็นข้อความธรรมดา ให้ใช้ URL แบบเนทีฟ: `baseUrl: "http://host:11434"` (ไม่มี `/v1`)
</Warning>

คีย์การกำหนดค่ามาตรฐานคือ `baseUrl` นอกจากนี้ยังยอมรับ `baseURL` สำหรับ
ตัวอย่างในรูปแบบ OpenAI SDK แต่การกำหนดค่าใหม่ควรใช้ `baseUrl`

## กฎการยืนยันตัวตน

<AccordionGroup>
  <Accordion title="โฮสต์ภายในเครื่องและ LAN">
    URL ของ Ollama ที่เป็นลูปแบ็ก เครือข่ายส่วนตัว `.local` และชื่อโฮสต์เปล่า ไม่จำเป็นต้องใช้โทเค็น Bearer จริง OpenClaw ใช้เครื่องหมาย `ollama-local` สำหรับโฮสต์เหล่านี้
  </Accordion>
  <Accordion title="โฮสต์ระยะไกลและโฮสต์ Ollama Cloud">
    โฮสต์ระยะไกลสาธารณะและ `https://ollama.com` ต้องใช้ข้อมูลรับรองจริง ได้แก่ `OLLAMA_API_KEY` โปรไฟล์การยืนยันตัวตน หรือ `apiKey` ของผู้ให้บริการ สำหรับการใช้งานบริการโฮสต์โดยตรง ควรเลือกใช้ผู้ให้บริการ `ollama-cloud`
  </Accordion>
  <Accordion title="รหัสผู้ให้บริการแบบกำหนดเอง">
    ผู้ให้บริการแบบกำหนดเองที่มี `api: "ollama"` จะใช้กฎเดียวกัน ตัวอย่างเช่น ผู้ให้บริการ `ollama-remote` ที่ชี้ไปยังโฮสต์ LAN ส่วนตัวสามารถใช้ `apiKey: "ollama-local"` ได้ โดยเอเจนต์ย่อยจะแปลงเครื่องหมายดังกล่าวผ่านฮุกผู้ให้บริการ Ollama แทนที่จะถือว่าเป็นข้อมูลรับรองที่ขาดหายไป นอกจากนี้ `agents.defaults.memorySearch.provider` ยังสามารถชี้ไปยังรหัสผู้ให้บริการแบบกำหนดเอง เพื่อให้การฝังเวกเตอร์ใช้ปลายทาง Ollama นั้นได้
  </Accordion>
  <Accordion title="โปรไฟล์การยืนยันตัวตน">
    `auth-profiles.json` จัดเก็บข้อมูลรับรองสำหรับรหัสผู้ให้บริการ ส่วนการตั้งค่าปลายทาง (`baseUrl`, `api`, โมเดล, ส่วนหัว, การหมดเวลา) ให้ใส่ไว้ใน `models.providers.<id>` ไฟล์แบบแบนรุ่นเก่า เช่น `{ "ollama-windows": { "apiKey": "ollama-local" } }` ไม่ใช่รูปแบบที่ใช้ในรันไทม์ โดย `openclaw doctor --fix` จะเขียนไฟล์เหล่านั้นใหม่เป็นโปรไฟล์คีย์ API มาตรฐาน `ollama-windows:default` พร้อมสร้างข้อมูลสำรอง ค่า `baseUrl` ในไฟล์รุ่นเก่านั้นเป็นข้อมูลรบกวนและควรย้ายไปยังการกำหนดค่าผู้ให้บริการ
  </Accordion>
  <Accordion title="ขอบเขตการฝังเวกเตอร์หน่วยความจำ">
    การยืนยันตัวตนแบบ Bearer สำหรับการฝังเวกเตอร์หน่วยความจำของ Ollama มีขอบเขตจำกัดเฉพาะโฮสต์ที่ประกาศไว้:

    - คีย์ระดับผู้ให้บริการจะถูกส่งไปยังโฮสต์ของผู้ให้บริการนั้นเท่านั้น
    - `agents.*.memorySearch.remote.apiKey` จะถูกส่งไปยังโฮสต์การฝังเวกเตอร์ระยะไกลของรายการนั้นเท่านั้น
    - ค่า env `OLLAMA_API_KEY` เพียงอย่างเดียวจะถือว่าเป็นรูปแบบของ Ollama Cloud และจะไม่ถูกส่งไปยังโฮสต์ภายในเครื่องหรือโฮสต์ที่ให้บริการเองโดยค่าเริ่มต้น

  </Accordion>
</AccordionGroup>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="การเริ่มต้นระบบ (แนะนำ)">
    <Steps>
      <Step title="เรียกใช้การเริ่มต้นระบบ">
        ```bash
        openclaw onboard
        ```

        เลือก **Ollama** จากนั้นเลือกโหมด: **คลาวด์ + ภายในเครื่อง**, **คลาวด์เท่านั้น** หรือ **ภายในเครื่องเท่านั้น**
      </Step>
      <Step title="เลือกโมเดล">
        `Cloud only` จะขอ `OLLAMA_API_KEY` และแนะนำค่าเริ่มต้นของคลาวด์ที่ให้บริการแบบโฮสต์ `Cloud + Local` และ `Local only` จะขอ URL ฐานของ Ollama ค้นหาโมเดลที่พร้อมใช้งาน และดึงโมเดลภายในเครื่องที่เลือกโดยอัตโนมัติหากยังไม่มี แท็ก `:latest` ที่ติดตั้งไว้ เช่น `gemma4:latest` จะแสดงเพียงครั้งเดียวแทนการแสดง `gemma4` ซ้ำ นอกจากนี้ `Cloud + Local` ยังตรวจสอบว่าโฮสต์ได้ลงชื่อเข้าใช้เพื่อเข้าถึงคลาวด์แล้วหรือไม่
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

    `--custom-base-url` และ `--custom-model-id` เป็นตัวเลือก หากไม่ระบุ ระบบจะใช้โฮสต์ภายในเครื่องเริ่มต้นและโมเดลแนะนำ `gemma4`

  </Tab>

  <Tab title="การตั้งค่าด้วยตนเอง">
    <Steps>
      <Step title="ติดตั้งและเริ่ม Ollama">
        ดาวน์โหลดจาก [ollama.com/download](https://ollama.com/download) จากนั้นดึงโมเดล:

        ```bash
        ollama pull gemma4
        ```

        สำหรับการเข้าถึงคลาวด์แบบไฮบริด ให้เรียกใช้ `ollama signin` บนโฮสต์เดียวกัน
      </Step>
      <Step title="ตั้งค่าข้อมูลรับรอง">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # local/LAN host, any value works
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com only
        ```

        หรือกำหนดในการตั้งค่า: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`
      </Step>
      <Step title="เลือกโมเดล">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        หรือกำหนดในการตั้งค่า:

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
Ollama หนึ่งรายการที่เข้าถึงได้ ซึ่งเป็นขั้นตอนการทำงานแบบไฮบริดของ Ollama และเป็นโหมดที่ควรเลือกขณะตั้งค่า
เมื่อคุณต้องการใช้ทั้งสองแบบ

OpenClaw จะขอ URL ฐาน ค้นหาโมเดลภายในเครื่อง และตรวจสอบ
สถานะ `ollama signin` เมื่อลงชื่อเข้าใช้แล้ว ระบบจะแนะนำค่าเริ่มต้นที่ให้บริการแบบโฮสต์
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`) หาก
ยังไม่ได้ลงชื่อเข้าใช้ การตั้งค่าจะคงเป็นแบบภายในเครื่องเท่านั้นจนกว่าคุณจะเรียกใช้ `ollama signin`

สำหรับการเข้าถึงแบบคลาวด์เท่านั้นโดยไม่มีดีมอนภายในเครื่อง ให้ใช้ `openclaw onboard --auth-choice ollama-cloud` และดู [Ollama Cloud](/th/providers/ollama-cloud) โดยเส้นทางนี้ไม่จำเป็นต้องใช้ `ollama signin` หรือเซิร์ฟเวอร์ที่กำลังทำงาน:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

รายการโมเดลคลาวด์ที่แสดงระหว่าง `openclaw onboard` จะดึงข้อมูลสดจาก
`https://ollama.com/api/tags` โดยจำกัดไว้ที่ 500 รายการ เพื่อให้ตัวเลือกแสดง
แค็ตตาล็อกบริการโฮสต์ปัจจุบัน หากไม่สามารถเข้าถึง `ollama.com` หรือไม่มี
โมเดลส่งกลับมาในขณะตั้งค่า OpenClaw จะกลับไปใช้รายการแนะนำที่กำหนดไว้ในโค้ด เพื่อให้
การเริ่มต้นระบบยังคงเสร็จสมบูรณ์

## การค้นหาโมเดล (ผู้ให้บริการโดยปริยาย)

เมื่อกำหนด `OLLAMA_API_KEY` (หรือโปรไฟล์การยืนยันตัวตน) แล้ว และไม่ได้กำหนดทั้ง
`models.providers.ollama` หรือผู้ให้บริการแบบกำหนดเองรายอื่นที่มี `api: "ollama"`
OpenClaw จะค้นหาโมเดลจาก `http://127.0.0.1:11434`:

| ลักษณะการทำงาน             | รายละเอียด                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การค้นแค็ตตาล็อก        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| การตรวจหาความสามารถ | การอ่าน `/api/show` แบบพยายามเท่าที่ทำได้จะตรวจสอบ `contextWindow`, พารามิเตอร์ `num_ctx` ของ Modelfile และความสามารถต่าง ๆ (ภาพ/เครื่องมือ/การคิด)                                                                                                                                                                       |
| โมเดลภาพ        | ความสามารถ `vision` จาก `/api/show` จะระบุว่าโมเดลรองรับรูปภาพ (`input: ["text", "image"]`)                                                                                                                                                                                             |
| การตรวจหาการให้เหตุผล  | ใช้ความสามารถ `thinking` จาก `/api/show` เมื่อมี หาก Ollama ไม่ส่งข้อมูลความสามารถมา จะกลับไปใช้การอนุมานจากชื่อ (`r1`, `reason`, `reasoning`, `think`) โดย `glm-5.2:cloud` และ `deepseek-v4-flash\|pro:cloud` จะถือว่าเป็นโมเดลให้เหตุผลเสมอ ไม่ว่าความสามารถที่รายงานจะเป็นอย่างไร |
| ขีดจำกัดโทเค็น         | ค่าเริ่มต้นของ `maxTokens` คือเพดานโทเค็นสูงสุดสำหรับ Ollama ของ OpenClaw                                                                                                                                                                                                                                       |
| ค่าใช้จ่าย                | ค่าใช้จ่ายทั้งหมดเป็น `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

การกำหนด `models.providers.ollama` พร้อมอาร์เรย์ `models` อย่างชัดเจน หรือ
ผู้ให้บริการแบบกำหนดเองที่มี `api: "ollama"` และ `baseUrl` ที่ไม่ใช่ลูปแบ็ก จะปิดใช้งาน
การค้นหาอัตโนมัติ จากนั้นต้องกำหนดโมเดลด้วยตนเอง (ดู
[การกำหนดค่า](#configuration)) รายการ `models.providers.ollama` ที่ชี้ไปยัง
`https://ollama.com` ซึ่งให้บริการแบบโฮสต์จะข้ามการค้นหาเช่นกัน เนื่องจากโมเดล Ollama Cloud
ได้รับการจัดการโดยผู้ให้บริการ ผู้ให้บริการแบบกำหนดเองที่เป็นลูปแบ็ก เช่น
`http://127.0.0.2:11434` ยังคงถือว่าเป็นภายในเครื่องและเปิดใช้การค้นหาอัตโนมัติต่อไป

คุณสามารถใช้การอ้างอิงแบบเต็ม เช่น `ollama/<pulled-model>:latest` ได้โดยไม่ต้องมี
รายการ `models.json` ที่เขียนด้วยตนเอง โดย OpenClaw จะแปลงการอ้างอิงนั้นแบบสด สำหรับโฮสต์ที่ลงชื่อเข้าใช้แล้ว
การเลือกการอ้างอิง `ollama/<model>:cloud` ที่ไม่อยู่ในรายการจะตรวจสอบโมเดลนั้นโดยตรง
ด้วย `/api/show` และเพิ่มลงในแค็ตตาล็อกรันไทม์เฉพาะเมื่อ Ollama
ยืนยันข้อมูลเมตาแล้วเท่านั้น การพิมพ์ผิดจะยังคงล้มเหลวด้วยข้อผิดพลาดว่าไม่รู้จักโมเดล

### การทดสอบควัน

สำหรับการตรวจสอบข้อความแบบจำกัดขอบเขตที่ข้ามพื้นผิวเครื่องมือทั้งหมดของเอเจนต์:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

เพิ่ม `--file` พร้อมรูปภาพเพื่อตรวจสอบโมเดลภาพแบบกระชับ (รองรับ PNG/JPEG/WebP;
ไฟล์ที่ไม่ใช่รูปภาพจะถูกปฏิเสธก่อนเรียก Ollama โดยให้ใช้
`openclaw infer audio transcribe` สำหรับเสียง):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

ทั้งสองเส้นทางจะไม่โหลดเครื่องมือแชต หน่วยความจำ หรือบริบทเซสชัน หากเส้นทางนี้สำเร็จ
แต่การตอบกลับตามปกติของเอเจนต์ล้มเหลว ปัญหาน่าจะอยู่ที่ความสามารถด้านเครื่องมือหรือเอเจนต์
ของโมเดล ไม่ใช่ปลายทาง

การเลือกโมเดลด้วย `/model ollama/<model>` เป็นตัวเลือกที่ผู้ใช้ระบุอย่างแน่นอน หาก
ไม่สามารถเข้าถึง `baseUrl` ที่กำหนดไว้ การตอบกลับครั้งถัดไปจะล้มเหลวพร้อมข้อผิดพลาดจากผู้ให้บริการ
แทนที่จะกลับไปใช้โมเดลอื่นที่กำหนดไว้อย่างเงียบ ๆ

งาน Cron แบบแยกส่วนจะเพิ่มการตรวจสอบความปลอดภัยภายในเครื่องหนึ่งรายการก่อนเริ่มรอบการทำงานของเอเจนต์:
หากโมเดลที่เลือกแปลงไปยังผู้ให้บริการ Ollama แบบภายในเครื่อง/เครือข่ายส่วนตัว/`.local`
และไม่สามารถเข้าถึง `/api/tags` ได้ OpenClaw จะบันทึกการทำงานนั้นเป็น
`skipped` โดยระบุโมเดลไว้ในข้อความข้อผิดพลาด การตรวจสอบปลายทางนี้จะถูกแคชไว้
5 นาทีต่อโฮสต์ เพื่อไม่ให้งาน Cron ที่ทำซ้ำกับดีมอนที่หยุดทำงานแล้ว
ส่งคำขอที่ล้มเหลวพร้อมกันทั้งหมด

การตรวจสอบแบบสด:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

สำหรับ Ollama Cloud ให้กำหนดการทดสอบแบบใช้งานจริงเดียวกันไปยังปลายทางที่โฮสต์ไว้ (โดยค่าเริ่มต้นจะข้าม embeddings; บังคับใช้ด้วย `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` เนื่องจากคีย์ระบบคลาวด์อาจไม่มีสิทธิ์เข้าถึง `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

หากต้องการเพิ่มโมเดล ให้ดึงโมเดลนั้นมา แล้วระบบจะค้นพบโดยอัตโนมัติ:

```bash
ollama pull mistral
```

## การอนุมานภายใน Node

เอเจนต์สามารถมอบหมายงานสั้น ๆ ให้โมเดล Ollama บนเดสก์ท็อปหรือ Node เซิร์ฟเวอร์ที่จับคู่ไว้ได้ พรอมป์และการตอบกลับจะส่งผ่านการเชื่อมต่อ Gateway/Node ที่ผ่านการยืนยันตัวตนอยู่แล้ว โดยคำขอจะทำงานกับปลายทาง Ollama แบบ local loopback ของ Node เอง (`http://127.0.0.1:11434`)

<Steps>
  <Step title="เริ่ม Ollama บน Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="เชื่อมต่อโฮสต์ของ Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    อนุมัติอุปกรณ์และคำสั่ง Node ของอุปกรณ์นั้นบนโฮสต์ Gateway แล้วตรวจสอบ:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    การเชื่อมต่อครั้งแรกหรือการอัปเกรดที่เพิ่มคำสั่ง Ollama อาจกระตุ้นให้ต้องอนุมัติคำสั่ง Node หาก Node เชื่อมต่อโดยไม่ได้ประกาศ `ollama.models` และ `ollama.chat` ให้ตรวจสอบ `openclaw nodes pending` อีกครั้ง

  </Step>
  <Step title="ใช้งานจากเอเจนต์">
    Plugin Ollama ที่รวมมาให้จะเปิดเผยเครื่องมือ `node_inference` เอเจนต์จะเรียก `action: "discover"` ก่อน แล้วจึงเรียก `action: "run"` โดยใช้ Node และโมเดลจากผลลัพธ์นั้น (`run` สามารถละ Node ได้เมื่อมี Node ที่รองรับเชื่อมต่ออยู่เพียงหนึ่งรายการ) ตัวอย่างเช่น: "ค้นหาโมเดล Ollama บน Node ของฉัน แล้วใช้โมเดลที่โหลดไว้ซึ่งเร็วที่สุดเพื่อสรุปข้อความนี้"
  </Step>
</Steps>

การค้นหาจะอ่าน `/api/tags` ตรวจสอบความสามารถผ่าน `/api/show` และใช้ `/api/ps` เมื่อพร้อมใช้งาน เพื่อจัดอันดับโมเดลที่โหลดอยู่แล้วไว้ก่อน ระบบจะส่งคืนเฉพาะโมเดลภายในเครื่องที่ Ollama รายงานว่ารองรับการแชต (ความสามารถ `completion`) โดยไม่รวมรายการ Ollama Cloud และโมเดลที่รองรับเฉพาะ embedding การทำงานแต่ละครั้งจะปิดการคิดของโมเดล และกำหนดเอาต์พุตเริ่มต้นเป็น 512 โทเค็น (จำกัดสูงสุด 8192) เว้นแต่การเรียกเครื่องมือจะระบุ `maxTokens` อื่น โมเดลบางรุ่น (เช่น GPT-OSS) ไม่รองรับการปิดการคิดและอาจยังคงสร้างโทเค็นการให้เหตุผล

หากต้องการให้ Ollama ทำงานบน Node ต่อไปโดยไม่เปิดให้เอเจนต์ใช้งาน:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

เริ่ม Node ใหม่ (`openclaw node restart` หรือหยุดแล้วเรียก `openclaw node run` อีกครั้งสำหรับเซสชันเบื้องหน้า) Node จะหยุดประกาศ `ollama.models` และ `ollama.chat` ส่วนตัว Ollama และผู้ให้บริการ Ollama ของ Gateway จะไม่ได้รับผลกระทบ ตั้งค่ากลับเป็น `true` แล้วเริ่มใหม่เพื่อเปิดใช้งานอีกครั้ง พื้นผิวคำสั่งที่เปลี่ยนแปลงอาจต้องอนุมัติผ่าน `openclaw nodes pending` อีกครั้งหลังเชื่อมต่อใหม่

ตรวจสอบคำสั่ง Node โดยตรงโดยไม่ต้องให้เอเจนต์ทำงานหนึ่งรอบ:

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

`--invoke-timeout` จำกัดระยะเวลาที่ Node ใช้เรียกคำสั่ง ส่วน `--timeout` จำกัดระยะเวลาโดยรวมของการเรียก Gateway และควรมีค่ามากกว่า

การอนุมานภายใน Node จะใช้ปลายทางแบบ local loopback ของ Node เองเสมอ โดยจะไม่นำ `models.providers.ollama.baseUrl` ระยะไกลหรือระบบคลาวด์ที่กำหนดค่าไว้กลับมาใช้ คำสั่ง Node พร้อมใช้งานโดยค่าเริ่มต้นบนโฮสต์ Node ที่ใช้ macOS, Linux และ Windows และยังคงอยู่ภายใต้นโยบายการจับคู่และคำสั่งของ Node ตามปกติ

## วิชันและคำอธิบายรูปภาพ

Plugin Ollama ที่รวมมาให้จะลงทะเบียน Ollama เป็นผู้ให้บริการทำความเข้าใจสื่อที่รองรับรูปภาพ เพื่อให้ OpenClaw สามารถกำหนดเส้นทางคำขออธิบายรูปภาพแบบชัดเจนและค่าเริ่มต้นของโมเดลรูปภาพที่กำหนดค่าไว้ ผ่านโมเดลวิชัน Ollama ภายในเครื่องหรือที่โฮสต์ไว้

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` ต้องเป็นการอ้างอิง `<provider/model>` แบบเต็ม เมื่อกำหนดค่าแล้ว `infer image describe` จะลองใช้โมเดลนั้นก่อน แทนที่จะข้ามการอธิบายสำหรับโมเดลที่รองรับวิชันในตัวอยู่แล้ว หากการเรียกล้มเหลว OpenClaw สามารถดำเนินการต่อผ่าน `agents.defaults.imageModel.fallbacks` ได้ ส่วนข้อผิดพลาดในการเตรียมไฟล์/URL จะล้มเหลวก่อนลองใช้ตัวสำรอง ใช้ `infer image describe` สำหรับโฟลว์การทำความเข้าใจรูปภาพและ `imageModel` ที่กำหนดค่าไว้ของ OpenClaw และใช้ `infer model run --file` สำหรับการทดสอบมัลติโมดัลแบบดิบด้วยพรอมป์ที่กำหนดเอง

หากต้องการกำหนดให้ Ollama เป็นผู้ให้บริการทำความเข้าใจรูปภาพเริ่มต้นสำหรับสื่อขาเข้า:

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

ควรใช้การอ้างอิง `ollama/<model>` แบบเต็ม การอ้างอิง `imageModel` แบบไม่มีคำนำหน้าผู้ให้บริการ เช่น `qwen2.5vl:7b` จะถูกปรับเป็น `ollama/qwen2.5vl:7b` เฉพาะเมื่อโมเดลที่ตรงกันทุกประการอยู่ในรายการ `models.providers.ollama.models` พร้อม `input: ["text", "image"]` และไม่มีผู้ให้บริการรูปภาพรายอื่นที่กำหนดค่าไว้เปิดเผย ID แบบไม่มีคำนำหน้าเดียวกัน มิฉะนั้นให้ระบุคำนำหน้าผู้ให้บริการอย่างชัดเจน

โมเดลวิชันภายในเครื่องที่ทำงานช้าอาจต้องใช้ค่าหมดเวลาสำหรับการทำความเข้าใจรูปภาพที่นานกว่าโมเดลระบบคลาวด์ และอาจหยุดทำงานบนฮาร์ดแวร์ที่มีทรัพยากรจำกัด หาก Ollama พยายามจัดสรรบริบทวิชันเต็มตามที่โมเดลประกาศไว้ ให้กำหนดค่าหมดเวลาของความสามารถและจำกัด `num_ctx`:

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

ค่าหมดเวลานี้ใช้กับการทำความเข้าใจรูปภาพขาเข้าและเครื่องมือ `image` ที่เรียกใช้อย่างชัดเจน ส่วน `models.providers.ollama.timeoutSeconds` ยังคงควบคุมตัวป้องกันคำขอ HTTP ของ Ollama ที่อยู่เบื้องล่างสำหรับการเรียกโมเดลตามปกติ

การตรวจสอบแบบใช้งานจริง:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

หากคุณกำหนด `models.providers.ollama.models` ด้วยตนเอง ให้ระบุโมเดลวิชันอย่างชัดเจน:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw จะปฏิเสธคำขออธิบายรูปภาพสำหรับโมเดลที่ไม่ได้ระบุว่ารองรับรูปภาพ เมื่อใช้การค้นหาโดยนัย ข้อมูลนี้จะมาจากความสามารถด้านวิชันของ `/api/show`

## การกำหนดค่า

<Tabs>
  <Tab title="พื้นฐาน (การค้นหาโดยนัย)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    หากกำหนด `OLLAMA_API_KEY` แล้ว คุณสามารถละ `apiKey` ในรายการผู้ให้บริการได้ โดย OpenClaw จะเติมค่าให้เพื่อใช้ตรวจสอบความพร้อมใช้งาน
    </Tip>

  </Tab>

  <Tab title="แบบชัดเจน (กำหนดโมเดลด้วยตนเอง)">
    ใช้การกำหนดค่าแบบชัดเจนสำหรับการตั้งค่าระบบคลาวด์ที่โฮสต์ไว้ โฮสต์/พอร์ตที่ไม่ใช่ค่าเริ่มต้น การบังคับขนาดหน้าต่างบริบท หรือรายการโมเดลที่กำหนดด้วยตนเองทั้งหมด:

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

  <Tab title="URL ฐานที่กำหนดเอง">
    การกำหนดค่าแบบชัดเจนจะปิดการค้นหาอัตโนมัติ ดังนั้นจึงต้องระบุรายการโมเดล:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    อย่าเพิ่ม `/v1` พาธดังกล่าวจะเลือกโหมดที่เข้ากันได้กับ OpenAI ซึ่งการเรียกเครื่องมือทำงานได้ไม่เสถียร
    </Warning>

  </Tab>
</Tabs>

## สูตรการใช้งานทั่วไป

แทนที่ ID โมเดลด้วยชื่อที่ตรงกันทุกประการจาก `ollama list` หรือ `openclaw models list --provider ollama`

<AccordionGroup>
  <Accordion title="โมเดลภายในเครื่องพร้อมการค้นหาอัตโนมัติ">
    Ollama ทำงานบนเครื่องเดียวกับ Gateway และถูกค้นพบโดยอัตโนมัติ:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    อย่าเพิ่มบล็อก `models.providers.ollama` เว้นแต่คุณต้องการกำหนดโมเดลด้วยตนเอง

  </Accordion>

  <Accordion title="โฮสต์ Ollama บน LAN พร้อมโมเดลที่กำหนดด้วยตนเอง">
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

    `contextWindow` คืองบประมาณบริบทของ OpenClaw ส่วน `params.num_ctx` จะถูกส่งไปยัง Ollama ให้ตั้งค่าทั้งสองให้สอดคล้องกันเมื่อฮาร์ดแวร์ไม่สามารถเรียกใช้บริบทเต็มตามที่โมเดลประกาศไว้ได้

  </Accordion>

  <Accordion title="ใช้เฉพาะ Ollama Cloud">
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

    หากต้องการใช้ ID ผู้ให้บริการ `ollama-cloud` โดยเฉพาะแทนรูปแบบนี้ โปรดดู [Ollama Cloud](/th/providers/ollama-cloud)

  </Accordion>

  <Accordion title="ระบบคลาวด์ร่วมกับเครื่องภายในผ่านดีมอนที่ลงชื่อเข้าใช้แล้ว">
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

  <Accordion title="Multiple Ollama hosts">
    ใช้รหัสผู้ให้บริการแบบกำหนดเองเมื่อใช้งานเซิร์ฟเวอร์ Ollama มากกว่าหนึ่งเครื่อง โดยแต่ละรายการจะมี
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

    OpenClaw จะตัดคำนำหน้าผู้ให้บริการที่ใช้งานอยู่ (และใช้คำนำหน้าเปล่า
    `ollama/` เป็นทางเลือกสำรอง) ก่อนเรียก Ollama ดังนั้น `ollama-large/qwen3.5:27b`
    จะส่งถึง Ollama ในรูป `qwen3.5:27b`

  </Accordion>

  <Accordion title="Lean local model profile">
    โมเดลภายในเครื่องบางรุ่นจัดการพรอมต์แบบง่ายได้ แต่มีปัญหากับ
    ชุดเครื่องมือทั้งหมดของเอเจนต์ ให้จำกัดเครื่องมือและบริบทก่อนแก้ไข
    การตั้งค่ารันไทม์ส่วนกลาง:

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
    ล้มเหลวกับสคีมาเครื่องมืออย่างสม่ำเสมอเท่านั้น เนื่องจากเป็นการแลกความสามารถของเอเจนต์กับเสถียรภาพ
    `localModelLean` จะนำเครื่องมือเบราว์เซอร์ Cron ข้อความ การสร้างสื่อ
    เสียง และ PDF ที่ใช้ทรัพยากรมากออกจากพื้นผิวโดยตรงของเอเจนต์ เว้นแต่มีการกำหนดให้ใช้โดยชัดแจ้ง
    และย้ายแค็ตตาล็อกขนาดใหญ่ไปไว้หลังการค้นหาเครื่องมือ โดยไม่เปลี่ยน
    บริบทรันไทม์หรือโหมดการคิดของ Ollama ใช้ร่วมกับ `params.num_ctx` และ
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

รหัสผู้ให้บริการแบบกำหนดเองทำงานในลักษณะเดียวกัน สำหรับการอ้างอิงที่ใช้คำนำหน้า
ผู้ให้บริการที่ใช้งานอยู่ เช่น `ollama-spark/qwen3:32b` OpenClaw จะตัดคำนำหน้านั้นออกก่อน
เรียก Ollama โดยส่ง `qwen3:32b`

สำหรับโมเดลภายในเครื่องที่ทำงานช้า ควรปรับแต่งในระดับผู้ให้บริการก่อนเพิ่มระยะหมดเวลา
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
การสตรีมเนื้อหา และการยกเลิกการดึงข้อมูลแบบมีการป้องกันทั้งหมด `params.keep_alive` จะถูก
ส่งต่อเป็น `keep_alive` ระดับบนสุดในคำขอเนทีฟ `/api/chat` ให้ตั้งค่าต่อ
แต่ละโมเดลเมื่อเวลาโหลดในการโต้ตอบครั้งแรกเป็นคอขวด

### การตรวจสอบอย่างรวดเร็ว

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

สำหรับโฮสต์ระยะไกล ให้แทนที่ `127.0.0.1` ด้วยโฮสต์จาก `baseUrl` หาก `curl`
ทำงานได้แต่ OpenClaw ไม่ทำงาน ให้ตรวจสอบว่า Gateway ทำงานอยู่บน
เครื่อง คอนเทนเนอร์ หรือบัญชีบริการอื่นหรือไม่

## การค้นหาเว็บด้วย Ollama

OpenClaw รวม **การค้นหาเว็บด้วย Ollama** ไว้เป็นผู้ให้บริการ `web_search`

| คุณสมบัติ    | รายละเอียด                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| โฮสต์        | ใช้ `models.providers.ollama.baseUrl` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `http://127.0.0.1:11434`; `https://ollama.com` ใช้ API ที่โฮสต์ไว้โดยตรง                          |
| การยืนยันตัวตน        | ไม่ต้องใช้คีย์สำหรับโฮสต์ภายในเครื่องที่ลงชื่อเข้าใช้แล้ว; ใช้ `OLLAMA_API_KEY` หรือการยืนยันตัวตนของผู้ให้บริการที่กำหนดค่าไว้สำหรับการค้นหาโดยตรงผ่าน `https://ollama.com` หรือโฮสต์ที่มีการป้องกันด้วยการยืนยันตัวตน           |
| ข้อกำหนด | โฮสต์ภายในเครื่องหรือโฮสต์ที่ดูแลเองต้องทำงานอยู่และลงชื่อเข้าใช้ด้วย `ollama signin`; การค้นหาผ่านบริการที่โฮสต์ไว้โดยตรงต้องใช้ `baseUrl: "https://ollama.com"` พร้อมคีย์ API จริง |

เลือกตัวเลือกนี้ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` หรือตั้งค่า:

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

สำหรับการค้นหาผ่านบริการที่โฮสต์ไว้โดยตรงด้วย Ollama Cloud:

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

สำหรับโฮสต์ที่ดูแลเอง OpenClaw จะลองใช้พร็อกซี `/api/experimental/web_search`
ภายในเครื่องก่อน จากนั้นจึงใช้เส้นทาง `/api/web_search` ที่โฮสต์ไว้บนโฮสต์เดียวกันเป็นทางเลือกสำรอง โดยปกติ
ดีมอนภายในเครื่องที่ลงชื่อเข้าใช้แล้วจะตอบผ่านพร็อกซีภายในเครื่อง การเรียก
`https://ollama.com` โดยตรงจะใช้เอนด์พอยต์ `/api/web_search` ที่โฮสต์ไว้เสมอ

<Note>
สำหรับการตั้งค่าและลักษณะการทำงานทั้งหมด โปรดดู [การค้นหาเว็บด้วย Ollama](/th/tools/ollama-search)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **การเรียกใช้เครื่องมือในโหมดนี้ไม่น่าเชื่อถือ** ใช้เฉพาะเมื่อพร็อกซีต้องการรูปแบบ OpenAI และคุณไม่พึ่งพาการเรียกใช้เครื่องมือแบบเนทีฟ
    </Warning>

    ตั้งค่า `api: "openai-completions"` โดยชัดแจ้งสำหรับพร็อกซีที่อยู่หลัง
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    โหมดนี้อาจไม่รองรับการสตรีมและการเรียกใช้เครื่องมือพร้อมกัน คุณ
    อาจต้องตั้งค่า `params: { streaming: false }` ในโมเดล

    OpenClaw จะแทรก `options.num_ctx` โดยค่าเริ่มต้นในโหมดนี้ เพื่อไม่ให้ Ollama
    ย้อนกลับไปใช้บริบทขนาด 4096 โทเค็นโดยไม่มีการแจ้งเตือน หากพร็อกซีของคุณปฏิเสธ
    ฟิลด์ `options` ที่ไม่รู้จัก ให้ปิดใช้งาน:

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

  <Accordion title="Context windows">
    สำหรับโมเดลที่ค้นพบโดยอัตโนมัติ OpenClaw จะใช้ขนาดหน้าต่างบริบทที่ `/api/show`
    รายงาน รวมถึงค่า `PARAMETER num_ctx` ที่ใหญ่กว่าจาก
    Modelfile แบบกำหนดเอง มิฉะนั้นจะย้อนกลับไปใช้หน้าต่างบริบท Ollama
    เริ่มต้นของ OpenClaw

    `contextWindow`, `contextTokens` และ `maxTokens` ระดับผู้ให้บริการจะกำหนด
    ค่าเริ่มต้นสำหรับทุกโมเดลภายใต้ผู้ให้บริการนั้น และสามารถเขียนทับแยกตาม
    โมเดลได้ `contextWindow` คืองบประมาณพรอมต์และ Compaction ของ OpenClaw เอง คำขอเนทีฟ
    `/api/chat` จะไม่ตั้งค่า `options.num_ctx` เว้นแต่คุณตั้งค่า
    `params.num_ctx` โดยชัดแจ้ง ดังนั้น Ollama จะใช้ค่าเริ่มต้นของโมเดล
    `OLLAMA_CONTEXT_LENGTH` หรือค่าตาม VRAM ของตนเอง ค่า `params.num_ctx`
    ที่ไม่ถูกต้อง เป็นศูนย์ ติดลบ หรือไม่เป็นจำนวนจำกัดจะถูกละเว้น หากการกำหนดค่าเก่าใช้
    เพียง `contextWindow`/`maxTokens` เพื่อบังคับบริบทของคำขอเนทีฟ ให้เรียกใช้
    `openclaw doctor --fix` เพื่อคัดลอกค่าเหล่านั้นไปยัง `params.num_ctx`
    อะแดปเตอร์ที่เข้ากันได้กับ OpenAI ยังคงแทรก `options.num_ctx` โดยค่าเริ่มต้นจาก
    `params.num_ctx` หรือ `contextWindow` ที่กำหนดค่าไว้ ปิดใช้งานด้วย
    `injectNumCtxForOpenAICompat: false` หากระบบต้นทางปฏิเสธ `options`

    รายการโมเดลเนทีฟยังรองรับตัวเลือกรันไทม์ทั่วไปของ Ollama ภายใต้
    `params` ซึ่งจะถูกส่งต่อเป็น `options` ของ `/api/chat` แบบเนทีฟ ได้แก่ `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` และ `num_thread`
    คีย์บางรายการ (`format`, `keep_alive`, `truncate`, `shift`) จะถูกส่งต่อเป็น
    ฟิลด์คำขอระดับบนสุดแทนที่จะซ้อนอยู่ใน `options` OpenClaw จะส่งต่อเฉพาะ
    คีย์คำขอ Ollama เหล่านี้ ดังนั้นพารามิเตอร์เฉพาะรันไทม์ เช่น
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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` รายโมเดลก็
    ใช้งานได้เช่นกัน หากตั้งค่าทั้งสองตำแหน่ง รายการโมเดลของผู้ให้บริการที่ระบุโดยชัดแจ้งจะมีลำดับความสำคัญสูงกว่า

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw จะส่งต่อการคิดตามรูปแบบที่ Ollama คาดไว้ คือ `think` ระดับบนสุด ไม่ใช่
    `options.think` โมเดลที่ค้นพบโดยอัตโนมัติซึ่ง `/api/show` รายงานว่า
    มีความสามารถ `thinking` จะแสดง `/think low`, `/think medium`, `/think high`
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

    `params.think`/`params.thinking` รายโมเดลสามารถปิดใช้งานหรือบังคับการคิดของ API
    สำหรับโมเดลที่ระบุได้ OpenClaw จะคงการกำหนดค่าอย่างชัดเจนนั้นไว้
    เมื่อการทำงานที่ใช้งานอยู่มีเพียงค่าเริ่มต้นโดยนัย `off` เท่านั้น แต่คำสั่งขณะทำงาน
    ที่ไม่ใช่ off เช่น `/think medium` ยังคงมีสิทธิ์แทนที่ คำขอให้คิดที่มีค่าเป็นจริง
    จะไม่ถูกส่งไปยังโมเดลที่ระบุอย่างชัดเจนว่า `reasoning: false` และคำขอ
    `think: false` จะถูกส่งเสมอไม่ว่าในกรณีใด

  </Accordion>

  <Accordion title="Reasoning models">
    โมเดลที่มีชื่อว่า `deepseek-r1`, `reasoning`, `reason` หรือ `think` จะถือว่า
    รองรับการให้เหตุผลโดยค่าเริ่มต้น โดยไม่ต้องกำหนดค่าเพิ่มเติม:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Model costs">
    Ollama ทำงานภายในเครื่องและใช้งานได้ฟรี ดังนั้นค่าใช้จ่ายของโมเดลทั้งหมดจึงเป็น `0`
    ทั้งสำหรับโมเดลที่ค้นพบโดยอัตโนมัติและโมเดลที่กำหนดด้วยตนเอง
  </Accordion>

  <Accordion title="Memory embeddings">
    Plugin Ollama ที่มาพร้อมระบบจะลงทะเบียนผู้ให้บริการเวกเตอร์ฝังหน่วยความจำสำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory) โดยใช้ URL ฐานและคีย์ API ของ Ollama
    ที่กำหนดค่าไว้ เรียก `/api/embed` และรวมส่วนย่อยของหน่วยความจำหลายส่วน
    เป็นคำขอ `input` เดียวเมื่อทำได้

    เมื่อ `proxy.enabled=true` คำขอเวกเตอร์ฝังไปยังต้นทาง local loopback
    ของโฮสต์ที่ตรงกันทุกประการ ซึ่งได้มาจาก `baseUrl` ที่กำหนดค่าไว้ จะใช้เส้นทางตรง
    ที่มีการป้องกันของ OpenClaw แทนพร็อกซีส่งต่อที่มีการจัดการ ชื่อโฮสต์ที่กำหนดค่าไว้
    ต้องเป็น `localhost` หรือค่าตัวอักษร IP แบบลูปแบ็กโดยตรง ชื่อ DNS ที่เพียงแค่
    แปลงค่าไปยังลูปแบ็กจะยังคงใช้เส้นทางพร็อกซีที่มีการจัดการ โฮสต์ Ollama บน LAN,
    tailnet, เครือข่ายส่วนตัว และเครือข่ายสาธารณะจะใช้เส้นทางพร็อกซีที่มีการจัดการเสมอ
    และการเปลี่ยนเส้นทางไปยังโฮสต์/พอร์ตอื่นจะไม่ได้รับความเชื่อถือสืบทอด
    `proxy.loopbackMode: "proxy"` จะกำหนดเส้นทางการรับส่งข้อมูลลูปแบ็กผ่านพร็อกซี
    เช่นเดิม ส่วน `proxy.loopbackMode: "block"` จะปฏิเสธก่อนเชื่อมต่อ โปรดดู
    [พร็อกซีที่มีการจัดการ](/th/security/network-proxy#gateway-loopback-mode)

    | คุณสมบัติ | ค่า |
    | --- | --- |
    | โมเดลเริ่มต้น | `nomic-embed-text` |
    | ดึงโดยอัตโนมัติ | ใช่ หากยังไม่มีในเครื่อง |
    | จำนวนงานพร้อมกันแบบอินไลน์เริ่มต้น | 1 (ผู้ให้บริการอื่นมีค่าเริ่มต้นสูงกว่า เพิ่มด้วย `nonBatchConcurrency` หากโฮสต์รองรับได้) |

    เวกเตอร์ฝังในขณะสืบค้นจะใช้คำนำหน้าสำหรับการดึงข้อมูลกับโมเดลที่กำหนด
    หรือแนะนำให้ใช้ ได้แก่ `nomic-embed-text`, `qwen3-embedding` และ
    `mxbai-embed-large` ชุดเอกสารจะยังคงเป็นข้อมูลดิบ ดังนั้นดัชนีที่มีอยู่
    จึงไม่จำเป็นต้องย้ายรูปแบบ

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    สำหรับโฮสต์เวกเตอร์ฝังระยะไกล ให้จำกัดขอบเขตการยืนยันตัวตนไว้ที่โฮสต์นั้น:

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

  <Accordion title="Streaming configuration">
    โดยค่าเริ่มต้น Ollama ใช้ **API แบบเนทีฟ** (`/api/chat`) ซึ่งรองรับการสตรีม
    และการเรียกใช้เครื่องมือพร้อมกัน โดยไม่ต้องกำหนดค่าพิเศษ

    สำหรับคำขอแบบเนทีฟ การควบคุมการคิดจะถูกส่งต่อโดยตรง: `/think off`
    และ `openclaw agent --thinking off` จะส่ง `think: false` ที่ระดับบนสุด
    เว้นแต่จะกำหนด `params.think`/`params.thinking` ไว้อย่างชัดเจน;
    `/think low|medium|high` จะส่งสตริงระดับความพยายามที่ตรงกัน และ `/think max`
    จะแมปเป็นระดับความพยายามสูงสุดของ Ollama คือ `think: "high"`

    <Tip>
    หากต้องการใช้เอ็นด์พอยต์ที่เข้ากันได้กับ OpenAI แทน โปรดดู "โหมดเดิมที่เข้ากันได้กับ OpenAI" ด้านบน การสตรีมและการเรียกใช้เครื่องมืออาจไม่ทำงานร่วมกันในโหมดดังกล่าว
    </Tip>

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    บน WSL2 ที่ใช้ NVIDIA/CUDA โปรแกรมติดตั้ง Ollama สำหรับ Linux อย่างเป็นทางการ
    จะสร้างหน่วย systemd ชื่อ `ollama.service` พร้อม `Restart=always` หากบริการนั้น
    เริ่มทำงานอัตโนมัติและโหลดโมเดลที่ใช้ GPU ระหว่างการบูต WSL2 Ollama อาจตรึง
    หน่วยความจำของโฮสต์ไว้ระหว่างการโหลด โดยกลไกเรียกคืนหน่วยความจำของ Hyper-V
    อาจไม่สามารถเรียกคืนเพจเหล่านั้นได้เสมอ Windows จึงอาจยุติ VM ของ WSL2,
    systemd เริ่ม Ollama ใหม่ และวงจรดังกล่าวก็เกิดซ้ำ

    หลักฐาน: WSL2 รีบูต/ถูกยุติซ้ำ ๆ, การใช้ CPU สูงใน `app.slice` หรือ
    `ollama.service` ทันทีหลังเริ่ม WSL2 และได้รับ SIGTERM จาก systemd
    แทนที่จะมาจากตัวกำจัด OOM ของ Linux

    OpenClaw จะบันทึกคำเตือนขณะเริ่มต้นเมื่อตรวจพบ WSL2, เปิดใช้งาน
    `ollama.service` พร้อม `Restart=always` และพบตัวบ่งชี้ CUDA

    วิธีบรรเทาปัญหา:

    ```bash
    sudo systemctl disable ollama
    ```

    ฝั่ง Windows ให้เพิ่มข้อมูลต่อไปนี้ลงใน `%USERPROFILE%\.wslconfig` แล้วเรียกใช้
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    หรือกำหนดระยะคงการเชื่อมต่อให้สั้นลง / เริ่ม Ollama ด้วยตนเองเฉพาะเมื่อจำเป็น:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    โปรดดู [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)

  </Accordion>

  <Accordion title="Ollama not detected">
    ตรวจสอบว่า Ollama กำลังทำงาน มีการตั้งค่า `OLLAMA_API_KEY`
    (หรือโปรไฟล์การยืนยันตัวตน) และ **ไม่ได้** กำหนด
    `models.providers.ollama` ไว้อย่างชัดเจน:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    ดึงโมเดลมาไว้ในเครื่อง หรือกำหนดโมเดลอย่างชัดเจนใน
    `models.providers.ollama`:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host works with curl but not OpenClaw">
    ตรวจสอบจากเครื่องและรันไทม์เดียวกับที่เรียกใช้ Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    สาเหตุที่พบบ่อย:

    - `baseUrl` ชี้ไปที่ `localhost` แต่ Gateway ทำงานใน Docker หรือบนโฮสต์อื่น
    - URL ใช้ `/v1` ซึ่งเลือกการทำงานแบบเข้ากันได้กับ OpenAI แทน Ollama แบบเนทีฟ
    - โฮสต์ระยะไกลต้องปรับไฟร์วอลล์หรือการผูกกับ LAN
    - โมเดลอยู่ในดีมอนของแล็ปท็อป แต่ไม่ได้อยู่ในดีมอนระยะไกล

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    โดยทั่วไปผู้ให้บริการกำลังอยู่ในโหมดที่เข้ากันได้กับ OpenAI หรือโมเดล
    ไม่สามารถจัดการสคีมาของเครื่องมือได้ ควรใช้โหมดเนทีฟ:

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

    หากโมเดลขนาดเล็กในเครื่องยังคงล้มเหลวกับสคีมาของเครื่องมือ ให้ตั้งค่า
    `compat.supportsTools: false` ในรายการโมเดลนั้นแล้วทดสอบอีกครั้ง

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    การตอบกลับจาก Kimi/GLM ที่ให้บริการบนโฮสต์ซึ่งเป็นลำดับสัญลักษณ์ยาว ๆ
    ที่ไม่ใช่ภาษา จะถือว่าเป็นการเรียกผู้ให้บริการที่ล้มเหลวแทนการตอบกลับสำเร็จ
    เพื่อให้กระบวนการลองใหม่/สลับสำรอง/จัดการข้อผิดพลาดตามปกติเข้ามาทำงาน
    แทนการบันทึกข้อความที่เสียหายไว้ในเซสชัน

    หากเกิดขึ้นอีก ให้บันทึกชื่อโมเดล ไฟล์เซสชันปัจจุบัน และระบุว่าการทำงานใช้
    `Cloud + Local` หรือ `Cloud only` จากนั้นลองใช้เซสชันใหม่และโมเดลสำรอง:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    โมเดลขนาดใหญ่ในเครื่องอาจใช้เวลานานในการโหลดครั้งแรก ให้จำกัดขอบเขต
    ระยะหมดเวลาไว้ที่ผู้ให้บริการ Ollama และเลือกคงโมเดลไว้ในหน่วยความจำ
    ระหว่างรอบการโต้ตอบได้:

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

    หากตัวโฮสต์เองตอบรับการเชื่อมต่อช้า `timeoutSeconds` จะขยายระยะหมดเวลา
    สำหรับการเชื่อมต่อที่มีการป้องกันของผู้ให้บริการนี้ด้วย

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    หลายโมเดลระบุว่ารองรับบริบทขนาดใหญ่เกินกว่าที่ฮาร์ดแวร์ของคุณจะทำงาน
    ได้อย่างเหมาะสม Ollama แบบเนทีฟจะใช้ค่าเริ่มต้นของรันไทม์ตนเอง เว้นแต่
    จะตั้งค่า `params.num_ctx` ให้จำกัดทั้งงบประมาณของ OpenClaw และบริบทคำขอ
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
    และลด `maxTokens` หากการสร้างผลลัพธ์ใช้เวลานานเกินไป

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
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรมการสลับสำรอง
  </Card>
  <Card title="Model selection" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="Ollama Web Search" href="/th/tools/ollama-search" icon="magnifying-glass">
    รายละเอียดการตั้งค่าและพฤติกรรมทั้งหมดสำหรับการค้นหาเว็บที่ขับเคลื่อนด้วย Ollama
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
</CardGroup>
