---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับโมเดลบนคลาวด์หรือโมเดลภายในเครื่องผ่าน Ollama
    - คุณต้องการคำแนะนำในการติดตั้งและกำหนดค่า Ollama
    - คุณต้องการใช้โมเดลด้านการมองเห็นของ Ollama เพื่อทำความเข้าใจรูปภาพ
summary: เรียกใช้ OpenClaw ด้วย Ollama (โมเดลบนคลาวด์และโมเดลภายในเครื่อง)
title: Ollama
x-i18n:
    generated_at: "2026-07-21T15:24:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0c44c2ad5c0084fa7b93c78a91a4e6edfbccdba00669df218f4f33a2247ce705
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw สื่อสารกับ API เนทีฟของ Ollama (`/api/chat`) ไม่ใช่ปลายทาง
`/v1` ที่เข้ากันได้กับ OpenAI โดยรองรับสามโหมด:

| โหมด          | สิ่งที่ใช้                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| คลาวด์ + ภายในเครื่อง | โฮสต์ Ollama ที่เข้าถึงได้ ซึ่งให้บริการโมเดลภายในเครื่องและโมเดล `:cloud` (หากลงชื่อเข้าใช้แล้ว) |
| คลาวด์เท่านั้น    | ใช้ `https://ollama.com` โดยตรง โดยไม่มีดีมอนภายในเครื่อง                                   |
| ภายในเครื่องเท่านั้น    | โฮสต์ Ollama ที่เข้าถึงได้ และใช้เฉพาะโมเดลภายในเครื่อง                                       |

สำหรับการตั้งค่าเฉพาะคลาวด์ด้วย ID ผู้ให้บริการ `ollama-cloud` โดยเฉพาะ โปรดดู
[Ollama Cloud](/th/providers/ollama-cloud) ใช้การอ้างอิง `ollama-cloud/<model>` เมื่อ
ต้องการแยกการกำหนดเส้นทางคลาวด์ออกจากผู้ให้บริการ `ollama` ภายในเครื่อง

<Warning>
อย่าใช้ URL `/v1` ที่เข้ากันได้กับ OpenAI (`http://host:11434/v1`) เนื่องจากจะทำให้การเรียกใช้เครื่องมือเสียหาย และโมเดลอาจส่ง JSON การเรียกใช้เครื่องมือแบบดิบออกมาเป็นข้อความธรรมดา ให้ใช้ URL เนทีฟ: `baseUrl: "http://host:11434"` (ไม่มี `/v1`)
</Warning>

คีย์การกำหนดค่ามาตรฐานคือ `baseUrl` นอกจากนี้ยังยอมรับ `baseURL` สำหรับ
ตัวอย่างรูปแบบ OpenAI SDK แต่การกำหนดค่าใหม่ควรใช้ `baseUrl`

## กฎการตรวจสอบสิทธิ์

<AccordionGroup>
  <Accordion title="โฮสต์ภายในเครื่องและ LAN">
    URL ของ Ollama ที่เป็นลูปแบ็ก เครือข่ายส่วนตัว `.local` และชื่อโฮสต์เปล่า ไม่จำเป็นต้องใช้ bearer token จริง OpenClaw ใช้เครื่องหมาย `ollama-local` สำหรับกรณีเหล่านี้
  </Accordion>
  <Accordion title="โฮสต์ระยะไกลและ Ollama Cloud">
    โฮสต์ระยะไกลสาธารณะและ `https://ollama.com` ต้องใช้ข้อมูลประจำตัวจริง ได้แก่ `OLLAMA_API_KEY`, โปรไฟล์การตรวจสอบสิทธิ์ หรือ `apiKey` ของผู้ให้บริการ สำหรับการใช้งานแบบโฮสต์โดยตรง แนะนำให้ใช้ผู้ให้บริการ `ollama-cloud`
  </Accordion>
  <Accordion title="ID ผู้ให้บริการแบบกำหนดเอง">
    ผู้ให้บริการแบบกำหนดเองที่มี `api: "ollama"` จะใช้กฎเดียวกัน ตัวอย่างเช่น ผู้ให้บริการ `ollama-remote` ที่ชี้ไปยังโฮสต์ LAN ส่วนตัวสามารถใช้ `apiKey: "ollama-local"` ได้ โดยเอเจนต์ย่อยจะแก้ไขเครื่องหมายดังกล่าวผ่านฮุกผู้ให้บริการ Ollama แทนที่จะถือว่าเป็นข้อมูลประจำตัวที่ขาดหายไป นอกจากนี้ `agents.defaults.memorySearch.provider` ยังสามารถชี้ไปยัง ID ผู้ให้บริการแบบกำหนดเองเพื่อให้งานฝังเวกเตอร์ใช้ปลายทาง Ollama นั้นได้
  </Accordion>
  <Accordion title="โปรไฟล์การตรวจสอบสิทธิ์">
    `auth-profiles.json` จัดเก็บข้อมูลประจำตัวสำหรับ ID ผู้ให้บริการ ให้ใส่การตั้งค่าปลายทาง (`baseUrl`, `api`, โมเดล, ส่วนหัว, ระยะหมดเวลา) ไว้ใน `models.providers.<id>` ไฟล์แบบแบนรุ่นเก่า เช่น `{ "ollama-windows": { "apiKey": "ollama-local" } }` ไม่ใช่รูปแบบรันไทม์ โดย `openclaw doctor --fix` จะเขียนไฟล์เหล่านั้นใหม่เป็นโปรไฟล์คีย์ API `ollama-windows:default` มาตรฐานพร้อมข้อมูลสำรอง ค่า `baseUrl` ในไฟล์เดิมดังกล่าวเป็นข้อมูลรบกวนและควรย้ายไปยังการกำหนดค่าผู้ให้บริการ
  </Accordion>
  <Accordion title="ขอบเขตการฝังเวกเตอร์หน่วยความจำ">
    การตรวจสอบสิทธิ์แบบ bearer สำหรับการฝังเวกเตอร์หน่วยความจำของ Ollama จำกัดขอบเขตไว้เฉพาะโฮสต์ที่ประกาศไว้:

    - คีย์ระดับผู้ให้บริการจะส่งไปยังโฮสต์ของผู้ให้บริการนั้นเท่านั้น
    - `agents.*.memorySearch.remote.apiKey` จะส่งไปยังโฮสต์การฝังเวกเตอร์ระยะไกลของตัวเองเท่านั้น
    - ค่า env `OLLAMA_API_KEY` เพียงอย่างเดียวจะถือเป็นรูปแบบของ Ollama Cloud และโดยค่าเริ่มต้นจะไม่ส่งไปยังโฮสต์ภายในเครื่องหรือโฮสต์ที่จัดการเอง

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

        เลือก **Ollama** จากนั้นเลือกโหมด: **คลาวด์ + ภายในเครื่อง**, **คลาวด์เท่านั้น** หรือ **ภายในเครื่องเท่านั้น**

        ในการตั้งค่าแบบมีคำแนะนำครั้งแรก OpenClaw จะตรวจสอบโฮสต์
        Ollama เริ่มต้นหรือที่กำหนดค่าไว้ก่อน ระบบจะเสนอโมเดลที่ติดตั้งแล้วโดยอัตโนมัติเฉพาะเมื่อ
        `/api/show` ยืนยันการรองรับเครื่องมือและหน้าต่างบริบทอย่างน้อย 16K;
        หากข้อมูลเมตาบริบทขาดหายไปหรือมีขนาดเล็กกว่านี้ ระบบจะใช้เส้นทางการตั้งค่าด้วยตนเอง
        ต่อไป ลำดับการตั้งค่าร่วมกันของ CLI/macOS ยังคงตรวจสอบเส้นทางที่เลือกด้วย
        การตอบกลับจริงก่อนบันทึก การตรวจสอบอัตโนมัตินี้จะไม่ดึง
        โมเดล หากไม่มีโมเดลที่ติดตั้งและเหมาะสม การเริ่มต้นใช้งานจะดำเนินต่อไปยัง
        ตัวเลือก Ollama ตามปกติ
      </Step>
      <Step title="เลือกโมเดล">
        `Cloud only` จะแจ้งให้ระบุ `OLLAMA_API_KEY` และแนะนำค่าเริ่มต้นบนคลาวด์แบบโฮสต์ `Cloud + Local` และ `Local only` จะแจ้งให้ระบุ URL ฐานของ Ollama ค้นหาโมเดลที่พร้อมใช้งาน และดึงโมเดลภายในเครื่องที่เลือกโดยอัตโนมัติหากยังไม่มี แท็ก `:latest` ที่ติดตั้งแล้ว เช่น `gemma4:latest` จะแสดงเพียงครั้งเดียวแทนการทำซ้ำ `gemma4` นอกจากนี้ `Cloud + Local` ยังตรวจสอบว่าโฮสต์ลงชื่อเข้าใช้เพื่อเข้าถึงคลาวด์แล้วหรือไม่
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

    `--custom-base-url` และ `--custom-model-id` เป็นตัวเลือก หากไม่ระบุ ระบบจะใช้โฮสต์เริ่มต้นภายในเครื่องและโมเดลที่แนะนำ `gemma4`

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
      <Step title="ตั้งค่าข้อมูลประจำตัว">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # โฮสต์ภายในเครื่อง/LAN ใช้ค่าใดก็ได้
        export OLLAMA_API_KEY="your-real-key"   # เฉพาะ https://ollama.com
        ```

        หรือในการกำหนดค่า: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`
      </Step>
      <Step title="เลือกโมเดล">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        หรือในการกำหนดค่า:

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
Ollama เดียวที่เข้าถึงได้ ซึ่งเป็นขั้นตอนการทำงานแบบไฮบริดของ Ollama และเป็นโหมดที่ควรเลือกระหว่างการตั้งค่า
เมื่อต้องการใช้ทั้งสองแบบ

OpenClaw จะแจ้งให้ระบุ URL ฐาน ค้นหาโมเดลภายในเครื่อง และตรวจสอบสถานะ
`ollama signin` เมื่อลงชื่อเข้าใช้แล้ว ระบบจะแนะนำค่าเริ่มต้นแบบโฮสต์
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`) หาก
ยังไม่ได้ลงชื่อเข้าใช้ การตั้งค่าจะยังคงเป็นแบบภายในเครื่องเท่านั้นจนกว่าจะเรียกใช้ `ollama signin`

สำหรับการเข้าถึงเฉพาะคลาวด์โดยไม่มีดีมอนภายในเครื่อง ให้ใช้ `openclaw onboard --auth-choice ollama-cloud` และดู [Ollama Cloud](/th/providers/ollama-cloud) เส้นทางนี้ไม่ต้องใช้ `ollama signin` หรือเซิร์ฟเวอร์ที่กำลังทำงาน:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

รายการโมเดลคลาวด์ที่แสดงระหว่าง `openclaw onboard` จะดึงข้อมูลแบบสดจาก
`https://ollama.com/api/tags` โดยจำกัดไว้ที่ 500 รายการ เพื่อให้ตัวเลือกสะท้อน
แค็ตตาล็อกที่โฮสต์อยู่ในปัจจุบัน หากไม่สามารถเข้าถึง `ollama.com` หรือไม่มี
โมเดลตอบกลับระหว่างการตั้งค่า OpenClaw จะย้อนกลับไปใช้รายการแนะนำที่เขียนไว้ตายตัว เพื่อให้
การเริ่มต้นใช้งานยังคงเสร็จสมบูรณ์

## การค้นหาโมเดล (ผู้ให้บริการโดยนัย)

เมื่อตั้งค่า `OLLAMA_API_KEY` (หรือโปรไฟล์การตรวจสอบสิทธิ์) และไม่ได้กำหนดทั้ง
`models.providers.ollama` หรือผู้ให้บริการแบบกำหนดเองรายอื่นที่มี `api: "ollama"`
OpenClaw จะค้นหาโมเดลจาก `http://127.0.0.1:11434`:

| ลักษณะการทำงาน             | รายละเอียด                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การค้นแค็ตตาล็อก        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| การตรวจหาความสามารถ | `/api/show` แบบพยายามเท่าที่ทำได้จะอ่าน `contextWindow`, พารามิเตอร์ Modelfile `num_ctx` และความสามารถต่าง ๆ (การมองเห็น/เครื่องมือ/การคิด)                                                                                                                                                                       |
| โมเดลการมองเห็น        | ความสามารถ `vision` จาก `/api/show` จะระบุว่าโมเดลรองรับรูปภาพ (`input: ["text", "image"]`)                                                                                                                                                                                             |
| การตรวจหาการใช้เหตุผล  | ใช้ความสามารถ `thinking` จาก `/api/show` เมื่อมี มิฉะนั้นจะใช้การอนุมานจากชื่อ (`r1`, `reason`, `reasoning`, `think`) เมื่อ Ollama ไม่ระบุความสามารถ โดย `glm-5.2:cloud` และ `deepseek-v4-flash\|pro:cloud` จะถือว่าเป็นโมเดลใช้เหตุผลเสมอ ไม่ว่าความสามารถที่รายงานจะเป็นอย่างไร |
| ขีดจำกัดโทเค็น         | `maxTokens` มีค่าเริ่มต้นเป็นขีดจำกัดโทเค็นสูงสุดสำหรับ Ollama ของ OpenClaw                                                                                                                                                                                                                                       |
| ค่าใช้จ่าย                | ค่าใช้จ่ายทั้งหมดเป็น `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

การตั้งค่า `models.providers.ollama` ด้วยอาร์เรย์ `models` ที่ระบุชัดเจน หรือ
ผู้ให้บริการแบบกำหนดเองที่มี `api: "ollama"` และ `baseUrl` ที่ไม่ใช่ลูปแบ็ก จะปิดใช้งาน
การค้นหาอัตโนมัติ จากนั้นต้องกำหนดโมเดลด้วยตนเอง (ดู
[การกำหนดค่า](#configuration)) รายการ `models.providers.ollama` ที่ชี้ไปยัง
`https://ollama.com` แบบโฮสต์จะข้ามการค้นหาด้วย เนื่องจากโมเดล Ollama Cloud
ได้รับการจัดการโดยผู้ให้บริการ ผู้ให้บริการแบบกำหนดเองที่เป็นลูปแบ็ก เช่น
`http://127.0.0.2:11434` ยังคงถือว่าเป็นแบบภายในเครื่องและเปิดใช้การค้นหาอัตโนมัติต่อไป

สามารถใช้การอ้างอิงแบบเต็ม เช่น `ollama/<pulled-model>:latest` ได้โดยไม่ต้องมี
รายการ `models.json` ที่เขียนด้วยตนเอง โดย OpenClaw จะแก้ไขรายการดังกล่าวแบบสด สำหรับโฮสต์ที่ลงชื่อเข้าใช้แล้ว
การเลือกการอ้างอิง `ollama/<model>:cloud` ที่ไม่อยู่ในรายการจะตรวจสอบโมเดลนั้นโดยตรง
ด้วย `/api/show` และเพิ่มลงในแค็ตตาล็อกรันไทม์เฉพาะเมื่อ Ollama
ยืนยันข้อมูลเมตาแล้วเท่านั้น ส่วนการพิมพ์ผิดจะยังคงล้มเหลวเนื่องจากเป็นโมเดลที่ไม่รู้จัก

### การทดสอบควัน

สำหรับการตรวจสอบข้อความแบบจำกัดที่ข้ามพื้นผิวเครื่องมือทั้งหมดของเอเจนต์:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

เพิ่ม `--file` พร้อมรูปภาพสำหรับการตรวจสอบโมเดลการมองเห็นแบบเบา (รองรับ PNG/JPEG/WebP;
ไฟล์ที่ไม่ใช่รูปภาพจะถูกปฏิเสธก่อนเรียก Ollama ให้ใช้
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
แต่การตอบกลับของเอเจนต์ตามปกติล้มเหลว ปัญหาน่าจะอยู่ที่ความสามารถด้านเครื่องมือ/เอเจนต์
ของโมเดล ไม่ใช่ปลายทาง

การเลือกโมเดลด้วย `/model ollama/<model>` เป็นตัวเลือกที่ผู้ใช้ระบุอย่างชัดเจน: หาก
`baseUrl` ที่กำหนดค่าไว้ไม่สามารถเข้าถึงได้ การตอบกลับครั้งถัดไปจะล้มเหลวพร้อมข้อผิดพลาดจากผู้ให้บริการ
แทนที่จะสลับไปใช้โมเดลอื่นที่กำหนดค่าไว้อย่างเงียบ ๆ

งาน Cron แบบแยกสภาพแวดล้อมจะเพิ่มการตรวจสอบความปลอดภัยภายในเครื่องหนึ่งรายการก่อนเริ่มรอบการทำงานของเอเจนต์:
หากโมเดลที่เลือกชี้ไปยังผู้ให้บริการ Ollama แบบภายในเครื่อง/เครือข่ายส่วนตัว/`.local`
และไม่สามารถเข้าถึง `/api/tags` ได้ OpenClaw จะบันทึกการทำงานนั้นเป็น
`skipped` โดยระบุโมเดลไว้ในข้อความข้อผิดพลาด การตรวจสอบปลายทางนี้จะถูกแคชไว้
5 นาทีต่อโฮสต์ เพื่อให้งาน Cron ที่ทำซ้ำกับดีมอนที่หยุดทำงานไม่ส่ง
คำขอที่ล้มเหลวทั้งหมด

การตรวจสอบแบบสด:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

สำหรับ Ollama Cloud ให้ชี้การทดสอบแบบสดเดียวกันไปยังปลายทางที่โฮสต์ไว้ (โดยค่าเริ่มต้นจะข้าม
การฝังข้อมูล; บังคับใช้ด้วย `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` เนื่องจาก
คีย์คลาวด์อาจไม่มีสิทธิ์ใช้งาน `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

หากต้องการเพิ่มโมเดล ให้ดึงโมเดลมา แล้วระบบจะค้นพบโดยอัตโนมัติ:

```bash
ollama pull mistral
```

## การอนุมานภายใน Node

เอเจนต์สามารถมอบหมายงานสั้น ๆ ให้โมเดล Ollama บนเดสก์ท็อปหรือ
Node เซิร์ฟเวอร์ที่จับคู่ไว้ พรอมต์และการตอบกลับจะส่งผ่านการเชื่อมต่อ
Gateway/Node ที่ยืนยันตัวตนแล้วซึ่งมีอยู่เดิม โดยคำขอจะทำงานบนปลายทาง Ollama
แบบลูปแบ็กของ Node เอง (`http://127.0.0.1:11434`)

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

    อนุมัติอุปกรณ์และคำสั่ง Node ของอุปกรณ์บนโฮสต์ Gateway จากนั้นตรวจสอบ:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    การเชื่อมต่อครั้งแรก หรือการอัปเกรดที่เพิ่มคำสั่ง Ollama อาจทำให้ต้อง
    อนุมัติคำสั่ง Node หาก Node เชื่อมต่อโดยไม่ประกาศ
    `ollama.models` และ `ollama.chat` ให้ตรวจสอบ `openclaw nodes pending` อีกครั้ง

  </Step>
  <Step title="ใช้งานจากเอเจนต์">
    Plugin Ollama ที่รวมมาให้จะเปิดเผยเครื่องมือ `node_inference` เอเจนต์จะเรียก
    `action: "discover"` ก่อน แล้วจึงเรียก `action: "run"` โดยใช้ Node และโมเดลจาก
    ผลลัพธ์นั้น (`run` สามารถละเว้น Node ได้เมื่อมี Node ที่รองรับ
    เชื่อมต่ออยู่เพียงหนึ่งรายการ) ตัวอย่างเช่น: "ค้นหาโมเดล Ollama บน Node ของฉัน แล้วใช้
    โมเดลที่โหลดไว้ซึ่งเร็วที่สุดเพื่อสรุปข้อความนี้"
  </Step>
</Steps>

การค้นพบจะอ่าน `/api/tags` ตรวจสอบความสามารถของ `/api/show` และใช้
`/api/ps` เมื่อพร้อมใช้งาน เพื่อจัดอันดับโมเดลที่โหลดไว้แล้วเป็นลำดับแรก โดยจะส่งคืนเฉพาะ
โมเดลภายในเครื่องที่ Ollama รายงานว่ารองรับการแชต (ความสามารถ `completion`) —
ไม่รวมรายการ Ollama Cloud และโมเดลที่ใช้สำหรับการฝังข้อมูลเท่านั้น การทำงานแต่ละครั้งจะปิดใช้งาน
การคิดของโมเดล และตั้งค่าเริ่มต้นของผลลัพธ์เป็น 512 โทเค็น (ขีดจำกัดสูงสุด 8192) เว้นแต่
การเรียกเครื่องมือจะขอ `maxTokens` อื่น โมเดลบางรุ่น (เช่น GPT-OSS)
ไม่รองรับการปิดใช้งานการคิดและอาจยังคงส่งโทเค็นการให้เหตุผลออกมา

หากต้องการให้ Ollama ทำงานอยู่บน Node โดยไม่เปิดให้เอเจนต์เข้าถึง:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

รีสตาร์ต Node (`openclaw node restart` หรือหยุดแล้วเรียกใช้ `openclaw node run` อีกครั้ง
สำหรับเซสชันเบื้องหน้า) Node จะหยุดประกาศ `ollama.models` และ
`ollama.chat` ส่วน Ollama เองและผู้ให้บริการ Ollama ของ Gateway จะไม่ได้รับผลกระทบ
ตั้งค่ากลับเป็น `true` แล้วรีสตาร์ตเพื่อเปิดใช้งานอีกครั้ง พื้นผิวคำสั่งที่เปลี่ยนแปลง
อาจต้องได้รับการอนุมัติ `openclaw nodes pending` อีกครั้งหลังเชื่อมต่อใหม่

ตรวจสอบคำสั่ง Node โดยตรงโดยไม่ต้องเริ่มรอบการทำงานของเอเจนต์:

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

`--invoke-timeout` จำกัดระยะเวลาที่ Node สามารถใช้เพื่อเรียกใช้คำสั่ง;
`--timeout` จำกัดระยะเวลารวมของการเรียก Gateway และควรมีค่ามากกว่า

การอนุมานภายใน Node จะใช้ปลายทางลูปแบ็กของ Node เองเสมอ — โดยจะ
ไม่นำ `models.providers.ollama.baseUrl` ระยะไกล/คลาวด์ที่กำหนดค่าไว้มาใช้ซ้ำ
คำสั่ง Node พร้อมใช้งานโดยค่าเริ่มต้นบนโฮสต์ Node ที่เป็น macOS, Linux และ Windows
และยังคงอยู่ภายใต้นโยบายการจับคู่/คำสั่งของ Node ตามปกติ

## การมองเห็นและคำอธิบายรูปภาพ

Plugin Ollama ที่รวมมาให้จะลงทะเบียน Ollama เป็นผู้ให้บริการด้าน
การทำความเข้าใจสื่อที่รองรับรูปภาพ เพื่อให้ OpenClaw สามารถกำหนดเส้นทางคำขอ
คำอธิบายรูปภาพที่ระบุอย่างชัดเจนและค่าเริ่มต้นของโมเดลรูปภาพที่กำหนดค่าไว้ ผ่านโมเดลการมองเห็น
ของ Ollama แบบภายในเครื่องหรือแบบโฮสต์

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` ต้องเป็นการอ้างอิง `<provider/model>` แบบเต็ม เมื่อกำหนดค่าแล้ว `infer image
describe` จะลองใช้โมเดลนั้นก่อน แทนที่จะข้ามการสร้างคำอธิบายสำหรับโมเดล
ที่รองรับการมองเห็นแบบเนทีฟอยู่แล้ว หากการเรียกล้มเหลว OpenClaw สามารถดำเนินการต่อ
ผ่าน `agents.defaults.imageModel.fallbacks` ได้ ส่วนข้อผิดพลาดในการเตรียมไฟล์/URL
จะทำให้ล้มเหลวก่อนพยายามใช้ทางเลือกสำรอง ใช้ `infer image describe` สำหรับขั้นตอน
การทำความเข้าใจรูปภาพของ OpenClaw และ `imageModel` ที่กำหนดค่าไว้ ใช้ `infer model run
--file` สำหรับการทดสอบมัลติโหมดแบบดิบด้วยพรอมต์ที่กำหนดเอง

หากต้องการกำหนดให้ Ollama เป็นผู้ให้บริการเริ่มต้นสำหรับการทำความเข้าใจรูปภาพจากสื่อขาเข้า:

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
`qwen2.5vl:7b` จะถูกปรับเป็น `ollama/qwen2.5vl:7b` เฉพาะเมื่อโมเดลที่ตรงกันทุกประการ
แสดงอยู่ภายใต้ `models.providers.ollama.models` พร้อม
`input: ["text", "image"]` และไม่มีผู้ให้บริการรูปภาพอื่นที่กำหนดค่าไว้เปิดเผย
ID แบบไม่มีคำนำหน้าเดียวกัน มิฉะนั้นให้ระบุคำนำหน้าผู้ให้บริการอย่างชัดเจน

โมเดลการมองเห็นภายในเครื่องที่ทำงานช้าอาจต้องใช้ระยะหมดเวลาสำหรับการทำความเข้าใจรูปภาพนานกว่า
โมเดลคลาวด์ และอาจหยุดทำงานบนฮาร์ดแวร์ที่มีทรัพยากรจำกัดหาก Ollama พยายาม
จัดสรรบริบทการมองเห็นทั้งหมดที่โมเดลประกาศไว้ ให้ตั้งค่าระยะหมดเวลาของความสามารถ
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

ระยะหมดเวลานี้มีผลกับการทำความเข้าใจรูปภาพขาเข้าและเครื่องมือ
`image` ที่เรียกใช้อย่างชัดเจน ส่วน `models.providers.ollama.timeoutSeconds` ยังคงควบคุม
ตัวป้องกันคำขอ HTTP ของ Ollama ที่อยู่เบื้องหลังสำหรับการเรียกโมเดลตามปกติ

การตรวจสอบแบบสด:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

หากกำหนด `models.providers.ollama.models` ด้วยตนเอง ให้ทำเครื่องหมายโมเดลการมองเห็น
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

OpenClaw จะปฏิเสธคำขอคำอธิบายรูปภาพสำหรับโมเดลที่ไม่ได้ทำเครื่องหมายว่า
รองรับรูปภาพ เมื่อใช้การค้นพบโดยนัย ค่านี้จะมาจากความสามารถด้านการมองเห็น
ของ `/api/show`

## การกำหนดค่า

<Tabs>
  <Tab title="พื้นฐาน (การค้นพบโดยนัย)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    หากตั้งค่า `OLLAMA_API_KEY` ไว้ สามารถละเว้น `apiKey` ในรายการผู้ให้บริการได้ โดย OpenClaw จะเติมค่าให้สำหรับการตรวจสอบความพร้อมใช้งาน
    </Tip>

  </Tab>

  <Tab title="ระบุอย่างชัดเจน (โมเดลแบบกำหนดเอง)">
    ใช้การกำหนดค่าแบบระบุอย่างชัดเจนสำหรับการตั้งค่าคลาวด์ที่โฮสต์ไว้ โฮสต์/พอร์ตที่ไม่ใช่ค่าเริ่มต้น การบังคับ
    หน้าต่างบริบท หรือรายการโมเดลแบบกำหนดเองทั้งหมด:

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
    การกำหนดค่าแบบระบุอย่างชัดเจนจะปิดใช้งานการค้นพบอัตโนมัติ ดังนั้นจึงต้องระบุรายการโมเดล:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // ไม่มี /v1 - URL ของ API Ollama แบบเนทีฟ
            api: "ollama", // ระบุอย่างชัดเจน: รับประกันพฤติกรรมการเรียกเครื่องมือแบบเนทีฟ
            timeoutSeconds: 300, // ไม่บังคับ: เพิ่มเวลาสำหรับการเชื่อมต่อ/สตรีมของโมเดลภายในเครื่องที่ยังไม่โหลด
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
    อย่าเพิ่ม `/v1` พาธดังกล่าวจะเลือกโหมดที่เข้ากันได้กับ OpenAI ซึ่งการเรียกเครื่องมือไม่มีความน่าเชื่อถือ
    </Warning>

  </Tab>
</Tabs>

## สูตรใช้งานทั่วไป

แทนที่ ID โมเดลด้วยชื่อที่ตรงกันทุกประการจาก `ollama list` หรือ
`openclaw models list --provider ollama`

<AccordionGroup>
  <Accordion title="โมเดลภายในเครื่องพร้อมการค้นพบอัตโนมัติ">
    Ollama อยู่บนเครื่องเดียวกับ Gateway และระบบค้นพบโดยอัตโนมัติ:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    อย่าเพิ่มบล็อก `models.providers.ollama` เว้นแต่ต้องการใช้โมเดลแบบกำหนดเอง

  </Accordion>

  <Accordion title="โฮสต์ Ollama บน LAN พร้อมโมเดลแบบกำหนดเอง">
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

    `contextWindow` คืองบประมาณบริบทของ OpenClaw ส่วน `params.num_ctx` จะถูกส่งไปยัง
    Ollama ให้ตั้งค่าทั้งสองให้สอดคล้องกันเมื่อฮาร์ดแวร์ไม่สามารถเรียกใช้บริบททั้งหมด
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

    สำหรับรหัสผู้ให้บริการเฉพาะ `ollama-cloud` แทนโครงสร้างนี้ โปรดดู
    [Ollama Cloud](/th/providers/ollama-cloud)

  </Accordion>

  <Accordion title="ระบบคลาวด์ร่วมกับระบบภายในเครื่องผ่านดีมอนที่ลงชื่อเข้าใช้แล้ว">
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

  <Accordion title="โฮสต์ Ollama หลายรายการ">
    ใช้รหัสผู้ให้บริการที่กำหนดเองเมื่อเรียกใช้เซิร์ฟเวอร์ Ollama มากกว่าหนึ่งเซิร์ฟเวอร์ โดยแต่ละรายการจะมี
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

    OpenClaw จะตัดคำนำหน้าผู้ให้บริการที่ใช้งานอยู่ (และใช้คำนำหน้า
    `ollama/` แบบไม่มีส่วนขยายเป็นทางเลือกสำรอง) ก่อนเรียก Ollama ดังนั้น `ollama-large/qwen3.5:27b`
    จึงไปถึง Ollama ในรูป `qwen3.5:27b`

  </Accordion>

  <Accordion title="โปรไฟล์โมเดลภายในเครื่องแบบเบา">
    โมเดลภายในเครื่องบางรุ่นจัดการพรอมต์ง่าย ๆ ได้ แต่มีปัญหากับพื้นผิวเครื่องมือทั้งหมดของเอเจนต์
    ให้จำกัดเครื่องมือและบริบทก่อนปรับการตั้งค่ารันไทม์ส่วนกลาง:

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
    ล้มเหลวกับสคีมาเครื่องมืออย่างสม่ำเสมอเท่านั้น เนื่องจากเป็นการแลกความสามารถของเอเจนต์กับความเสถียร
    `localModelLean` จะนำเครื่องมือเบราว์เซอร์, cron, ข้อความ, การสร้างสื่อ,
    เสียง และ PDF ที่ใช้ทรัพยากรมากออกจากพื้นผิวโดยตรงของเอเจนต์ เว้นแต่จะระบุว่าจำเป็นอย่างชัดเจน
    และย้ายแค็ตตาล็อกขนาดใหญ่ไปไว้หลัง Tool Search การตั้งค่านี้ไม่เปลี่ยนบริบทรันไทม์หรือโหมดการคิด
    ของ Ollama ใช้ร่วมกับ `params.num_ctx` และ
    `params.thinking: false` สำหรับโมเดลการคิดขนาดเล็กแบบ Qwen ที่วนซ้ำหรือ
    ใช้งบประมาณไปกับการใช้เหตุผลที่ซ่อนอยู่

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

รหัสผู้ให้บริการที่กำหนดเองทำงานในลักษณะเดียวกัน: สำหรับการอ้างอิงที่ใช้คำนำหน้า
ของผู้ให้บริการที่ใช้งานอยู่ เช่น `ollama-spark/qwen3:32b` OpenClaw จะตัดคำนำหน้านั้นออกก่อน
เรียก Ollama และส่ง `qwen3:32b`

สำหรับโมเดลภายในเครื่องที่ทำงานช้า ให้ปรับแต่งในขอบเขตผู้ให้บริการก่อนเพิ่มระยะหมดเวลา
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
ส่งต่อเป็น `keep_alive` ระดับบนสุดในคำขอ `/api/chat` แบบเนทีฟ ให้ตั้งค่าแยกตาม
โมเดลเมื่อเวลาโหลดในเทิร์นแรกเป็นคอขวด

### การตรวจสอบอย่างรวดเร็ว

```bash
# ดีมอน Ollama ที่เครื่องนี้มองเห็นได้
curl http://127.0.0.1:11434/api/tags

# แค็ตตาล็อก OpenClaw และโมเดลที่เลือก
openclaw models list --provider ollama
openclaw models status

# การทดสอบควันของโมเดลโดยตรง
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "ตอบกลับด้วยข้อความนี้ทุกประการ: ok"
```

สำหรับโฮสต์ระยะไกล ให้แทนที่ `127.0.0.1` ด้วยโฮสต์ `baseUrl` หาก `curl`
ทำงานได้แต่ OpenClaw ทำงานไม่ได้ ให้ตรวจสอบว่า Gateway ทำงานอยู่บนเครื่อง
คอนเทนเนอร์ หรือบัญชีบริการอื่นหรือไม่

## การค้นหาเว็บของ Ollama

OpenClaw มี **การค้นหาเว็บของ Ollama** รวมมาให้ในฐานะผู้ให้บริการ `web_search`

| คุณสมบัติ    | รายละเอียด                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| โฮสต์        | `models.providers.ollama.baseUrl` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `http://127.0.0.1:11434`; `https://ollama.com` ใช้ API ที่โฮสต์ไว้โดยตรง                          |
| การยืนยันตัวตน        | ไม่ต้องใช้คีย์สำหรับโฮสต์ภายในเครื่องที่ลงชื่อเข้าใช้แล้ว; ใช้ `OLLAMA_API_KEY` หรือการยืนยันตัวตนของผู้ให้บริการที่กำหนดค่าไว้สำหรับการค้นหา `https://ollama.com` โดยตรงหรือโฮสต์ที่ป้องกันด้วยการยืนยันตัวตน           |
| ข้อกำหนด | โฮสต์ภายในเครื่อง/โฮสต์ด้วยตนเองต้องทำงานอยู่และลงชื่อเข้าใช้ด้วย `ollama signin`; การค้นหาบนโฮสต์โดยตรงต้องใช้ `baseUrl: "https://ollama.com"` พร้อมคีย์ API จริง |

เลือกระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` หรือตั้งค่า:

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

สำหรับการค้นหาบนโฮสต์โดยตรงผ่าน Ollama Cloud:

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

สำหรับโฮสต์ที่โฮสต์ด้วยตนเอง OpenClaw จะลองใช้พร็อกซี `/api/experimental/web_search`
ภายในเครื่องก่อน จากนั้นจึงเปลี่ยนไปใช้เส้นทาง `/api/web_search` ที่โฮสต์ไว้บนโฮสต์เดียวกันเป็นทางเลือกสำรอง โดยปกติ
ดีมอนภายในเครื่องที่ลงชื่อเข้าใช้แล้วจะตอบผ่านพร็อกซีภายในเครื่อง การเรียก
`https://ollama.com` โดยตรงจะใช้ปลายทาง `/api/web_search` ที่โฮสต์ไว้เสมอ

<Note>
สำหรับการตั้งค่าและลักษณะการทำงานทั้งหมด โปรดดู [การค้นหาเว็บของ Ollama](/th/tools/ollama-search)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเดิมที่เข้ากันได้กับ OpenAI">
    <Warning>
    **การเรียกใช้เครื่องมือในโหมดนี้ไม่เสถียร** ใช้เฉพาะเมื่อพร็อกซีต้องการรูปแบบ OpenAI และไม่ได้พึ่งพาการเรียกใช้เครื่องมือแบบเนทีฟ
    </Warning>

    ตั้งค่า `api: "openai-completions"` อย่างชัดเจนสำหรับพร็อกซีที่อยู่เบื้องหลัง
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
    อาจต้องตั้งค่า `params: { streaming: false }` บนโมเดล

    OpenClaw จะแทรก `options.num_ctx` ตามค่าเริ่มต้นในโหมดนี้ เพื่อไม่ให้ Ollama
    ย้อนกลับไปใช้บริบท 4096 โทเค็นโดยไม่แจ้งเตือน หากพร็อกซีของคุณปฏิเสธ
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

  <Accordion title="หน้าต่างบริบท">
    สำหรับโมเดลที่ค้นพบโดยอัตโนมัติ OpenClaw จะใช้หน้าต่างบริบทที่ `/api/show`
    รายงาน รวมถึงค่า `PARAMETER num_ctx` ที่มากขึ้นจาก
    Modelfile ที่กำหนดเอง มิฉะนั้นจะย้อนกลับไปใช้หน้าต่างบริบท Ollama เริ่มต้นของ OpenClaw

    `contextWindow`, `contextTokens` และ `maxTokens` ระดับผู้ให้บริการจะกำหนด
    ค่าเริ่มต้นให้ทุกโมเดลภายใต้ผู้ให้บริการนั้น และสามารถแทนที่แยกตาม
    โมเดลได้ `contextWindow` คืองบประมาณพรอมต์/Compaction ของ OpenClaw เอง คำขอ
    `/api/chat` แบบเนทีฟจะไม่ตั้งค่า `options.num_ctx` เว้นแต่จะตั้งค่า
    `params.num_ctx` อย่างชัดเจน ดังนั้น Ollama จึงใช้ค่าเริ่มต้นของโมเดล
    `OLLAMA_CONTEXT_LENGTH` หรือค่าเริ่มต้นตาม VRAM ของตนเอง ส่วนค่า `params.num_ctx` ที่ไม่ถูกต้อง เป็นศูนย์ เป็นลบ
    หรือไม่เป็นจำนวนจำกัดจะถูกละเว้น หากการกำหนดค่ารุ่นเก่าใช้เพียง
    `contextWindow`/`maxTokens` เพื่อบังคับบริบทคำขอแบบเนทีฟ ให้เรียกใช้
    `openclaw doctor --fix` เพื่อคัดลอกค่าเหล่านั้นไปยัง `params.num_ctx` อะแดปเตอร์
    ที่เข้ากันได้กับ OpenAI ยังคงแทรก `options.num_ctx` ตามค่าเริ่มต้นจาก
    `params.num_ctx` หรือ `contextWindow` ที่กำหนดค่าไว้ ให้ปิดใช้งานด้วย
    `injectNumCtxForOpenAICompat: false` หากระบบต้นทางปฏิเสธ `options`

    รายการโมเดลแบบเนทีฟยังยอมรับตัวเลือกรันไทม์ทั่วไปของ Ollama ภายใต้
    `params` ซึ่งส่งต่อเป็น `/api/chat` `options` แบบเนทีฟ ได้แก่ `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` และ `num_thread`
    คีย์บางรายการ (`format`, `keep_alive`, `truncate`, `shift`) จะถูกส่งต่อเป็น
    ฟิลด์คำขอระดับบนสุดแทนที่จะซ้อนอยู่ใน `options` OpenClaw จะ
    ส่งต่อเฉพาะคีย์คำขอ Ollama เหล่านี้ ดังนั้นพารามิเตอร์สำหรับรันไทม์เท่านั้น เช่น
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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` แบบต่อโมเดลก็
    ใช้งานได้เช่นกัน หากตั้งค่าทั้งสองแบบ รายการโมเดลของผู้ให้บริการที่ระบุไว้อย่างชัดเจนจะมีผลก่อน

  </Accordion>

  <Accordion title="การควบคุมการคิด">
    OpenClaw ส่งต่อการคิดตามรูปแบบที่ Ollama คาดไว้: ใช้ `think` ที่ระดับบนสุด ไม่ใช่
    `options.think` โมเดลที่ค้นพบโดยอัตโนมัติซึ่ง `/api/show` รายงาน
    ความสามารถ `thinking` จะแสดง `/think low`, `/think medium`, `/think high`
    และ `/think max` ส่วนโมเดลที่ไม่รองรับการคิดจะแสดงเฉพาะ `/think off`

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

    `params.think`/`params.thinking` แบบต่อโมเดลสามารถปิดใช้งานหรือบังคับ
    การคิดผ่าน API สำหรับโมเดลที่ระบุได้ OpenClaw จะคงการกำหนดค่าที่ระบุไว้อย่างชัดเจนนั้น
    เมื่อการเรียกใช้งานปัจจุบันมีเพียงค่าเริ่มต้น `off` โดยนัย แต่คำสั่งรันไทม์
    ที่ไม่ใช่การปิด เช่น `/think medium` จะยังคงแทนที่ค่านี้ ระบบจะไม่ส่งคำขอการคิด
    ที่มีค่าเป็นจริงไปยังโมเดลที่ทำเครื่องหมายอย่างชัดเจนว่า
    `reasoning: false` และจะส่งคำขอ `think: false` เสมอไม่ว่าในกรณีใด

  </Accordion>

  <Accordion title="โมเดลการให้เหตุผล">
    โมเดลที่ชื่อ `deepseek-r1`, `reasoning`, `reason` หรือ `think` จะถือว่า
    รองรับการให้เหตุผลโดยค่าเริ่มต้น โดยไม่ต้องกำหนดค่าเพิ่มเติม:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="ค่าใช้จ่ายของโมเดล">
    Ollama ทำงานภายในเครื่องและใช้งานได้ฟรี ดังนั้นค่าใช้จ่ายของโมเดลทั้งหมดจึงเป็น `0` ทั้งสำหรับ
    โมเดลที่ค้นพบโดยอัตโนมัติและโมเดลที่กำหนดด้วยตนเอง
  </Accordion>

  <Accordion title="เวกเตอร์ฝังตัวของหน่วยความจำ">
    Plugin Ollama ที่รวมมาให้จะลงทะเบียนผู้ให้บริการเวกเตอร์ฝังตัวของหน่วยความจำสำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory) โดยใช้ URL ฐานและคีย์ API ของ Ollama
    ที่กำหนดไว้ เรียก `/api/embed` และรวมส่วนย่อยของหน่วยความจำหลายส่วนไว้ใน
    คำขอ `input` เดียวเมื่อทำได้

    เมื่อ `proxy.enabled=true` คำขอเวกเตอร์ฝังตัวที่ส่งไปยังต้นทางลูปแบ็ก
    ภายในโฮสต์ที่ตรงกันทุกประการ ซึ่งได้มาจาก `baseUrl` ที่กำหนดไว้ จะใช้เส้นทางตรง
    ที่มีการป้องกันของ OpenClaw แทนพร็อกซีส่งต่อที่ได้รับการจัดการ ชื่อโฮสต์ที่กำหนดไว้
    ต้องเป็น `localhost` หรือค่าลิเทอรัล IP ลูปแบ็กเท่านั้น ชื่อ DNS
    ที่เพียงแค่แปลงค่าเป็นลูปแบ็กจะยังคงใช้เส้นทางพร็อกซีที่ได้รับการจัดการ โฮสต์ Ollama
    บน LAN, tailnet, เครือข่ายส่วนตัว และเครือข่ายสาธารณะจะอยู่บนเส้นทางพร็อกซี
    ที่ได้รับการจัดการเสมอ และการเปลี่ยนเส้นทางไปยังโฮสต์/พอร์ตอื่นจะไม่ได้รับ
    ความเชื่อถือสืบทอดมา `proxy.loopbackMode: "proxy"` จะกำหนดเส้นทางทราฟฟิกลูปแบ็กผ่าน
    พร็อกซีอยู่ดี ส่วน `proxy.loopbackMode: "block"` จะปฏิเสธก่อนเชื่อมต่อ
    โปรดดู [พร็อกซีที่ได้รับการจัดการ](/th/security/network-proxy#gateway-loopback-mode)

    | คุณสมบัติ | ค่า |
    | --- | --- |
    | โมเดลเริ่มต้น | `nomic-embed-text` |
    | ดึงโดยอัตโนมัติ | ใช่ หากยังไม่มีในเครื่อง |
    | การทำงานพร้อมกันแบบอินไลน์เริ่มต้น | 1 (ผู้ให้บริการรายอื่นมีค่าเริ่มต้นสูงกว่า เพิ่มด้วย `nonBatchConcurrency` หากโฮสต์รองรับได้) |

    เวกเตอร์ฝังตัวขณะค้นหาใช้คำนำหน้าสำหรับการดึงข้อมูลกับโมเดลที่จำเป็นต้องใช้หรือ
    แนะนำให้ใช้ ได้แก่ `nomic-embed-text`, `qwen3-embedding` และ
    `mxbai-embed-large` ส่วนชุดเอกสารจะคงข้อมูลดิบไว้ ดังนั้นดัชนีที่มีอยู่จึง
    ไม่ต้องย้ายรูปแบบ

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // ค่าเริ่มต้นสำหรับ Ollama เพิ่มค่านี้บนโฮสต์ขนาดใหญ่หากการสร้างดัชนีใหม่ช้าเกินไป
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    สำหรับโฮสต์เวกเตอร์ฝังตัวระยะไกล ให้จำกัดขอบเขตการยืนยันตัวตนไว้ที่โฮสต์นั้น:

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

  <Accordion title="การกำหนดค่าการสตรีม">
    Ollama ใช้ **API แบบเนทีฟ** (`/api/chat`) โดยค่าเริ่มต้น ซึ่งรองรับ
    การสตรีมและการเรียกใช้เครื่องมือพร้อมกัน โดยไม่ต้องกำหนดค่าพิเศษ

    สำหรับคำขอแบบเนทีฟ การควบคุมการคิดจะถูกส่งต่อโดยตรง: `/think off`
    และ `openclaw agent --thinking off` จะส่ง `think: false` ที่ระดับบนสุด เว้นแต่จะกำหนด
    `params.think`/`params.thinking` ไว้อย่างชัดเจน ส่วน `/think
    low|medium|high` จะส่งสตริงระดับความพยายามที่ตรงกัน และ `/think max` จะแมปเป็น
    ระดับความพยายามสูงสุดของ Ollama คือ `think: "high"`

    <Tip>
    หากต้องการใช้เอ็นด์พอยต์ที่เข้ากันได้กับ OpenAI แทน โปรดดู "โหมดเดิมที่เข้ากันได้กับ OpenAI" ด้านบน การสตรีมและการเรียกใช้เครื่องมืออาจไม่ทำงานพร้อมกันในโหมดนั้น
    </Tip>

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ลูปการขัดข้องของ WSL2 (รีบูตซ้ำ)">
    บน WSL2 ที่ใช้ NVIDIA/CUDA โปรแกรมติดตั้ง Ollama อย่างเป็นทางการสำหรับ Linux จะสร้าง
    หน่วย systemd `ollama.service` พร้อม `Restart=always` หากบริการนั้น
    เริ่มทำงานอัตโนมัติและโหลดโมเดลที่ใช้ GPU ระหว่างการบูต WSL2 ตัว Ollama อาจตรึง
    หน่วยความจำของโฮสต์ขณะโหลด โดยการเรียกคืนหน่วยความจำของ Hyper-V อาจไม่สามารถเรียกคืน
    หน้าเหล่านั้นได้เสมอ Windows จึงอาจยุติ VM ของ WSL2 จากนั้น systemd จะเริ่ม
    Ollama ใหม่ และลูปจะเกิดซ้ำ

    หลักฐาน: WSL2 รีบูต/ถูกยุติซ้ำ มีการใช้ CPU สูงใน `app.slice` หรือ
    `ollama.service` ทันทีหลังเริ่ม WSL2 และได้รับ SIGTERM จาก systemd แทนที่จะเป็น
    Linux OOM killer

    OpenClaw จะบันทึกคำเตือนเมื่อเริ่มต้น หากตรวจพบ WSL2, เปิดใช้งาน `ollama.service`
    พร้อม `Restart=always` และพบเครื่องหมาย CUDA ที่มองเห็นได้

    วิธีบรรเทาปัญหา:

    ```bash
    sudo systemctl disable ollama
    ```

    ในฝั่ง Windows ให้เพิ่มข้อมูลต่อไปนี้ใน `%USERPROFILE%\.wslconfig` แล้วเรียกใช้
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    หรือลดระยะเวลาคงการทำงาน / เริ่ม Ollama ด้วยตนเองเฉพาะเมื่อจำเป็น:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    โปรดดู [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)

  </Accordion>

  <Accordion title="ตรวจไม่พบ Ollama">
    ยืนยันว่า Ollama กำลังทำงาน มีการตั้งค่า `OLLAMA_API_KEY` (หรือโปรไฟล์การยืนยันตัวตน)
    และ **ไม่ได้** กำหนด `models.providers.ollama` ไว้อย่างชัดเจน:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="ไม่มีโมเดลให้ใช้งาน">
    ดึงโมเดลมาไว้ภายในเครื่อง หรือกำหนดไว้อย่างชัดเจนใน
    `models.providers.ollama`:

    ```bash
    ollama list  # ดูว่าติดตั้งอะไรไว้แล้ว
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

  <Accordion title="โฮสต์ระยะไกลทำงานกับ curl แต่ไม่ทำงานกับ OpenClaw">
    ตรวจสอบจากเครื่องและรันไทม์เดียวกันกับที่เรียกใช้ Gateway:

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

  <Accordion title="โมเดลแสดง JSON ของเครื่องมือเป็นข้อความ">
    โดยทั่วไปผู้ให้บริการอยู่ในโหมดที่เข้ากันได้กับ OpenAI หรือโมเดลไม่สามารถ
    จัดการสคีมาของเครื่องมือได้ ควรใช้โหมดเนทีฟ:

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

    หากโมเดลภายในเครื่องขนาดเล็กยังคงล้มเหลวกับสคีมาของเครื่องมือ ให้ตั้งค่า
    `compat.supportsTools: false` ในรายการโมเดลนั้นแล้วทดสอบอีกครั้ง

  </Accordion>

  <Accordion title="Kimi หรือ GLM ส่งคืนสัญลักษณ์ที่อ่านไม่ออก">
    การตอบกลับจาก Kimi/GLM ที่โฮสต์ไว้ซึ่งเป็นชุดสัญลักษณ์ยาวและไม่ใช่ภาษา
    จะถือว่าเป็นการเรียกผู้ให้บริการที่ล้มเหลว ไม่ใช่การตอบกลับที่สำเร็จ ดังนั้น
    ระบบจะใช้การลองใหม่/การสำรอง/การจัดการข้อผิดพลาดตามปกติ แทนที่จะบันทึก
    ข้อความที่เสียหายลงในเซสชัน

    หากเกิดขึ้นอีก ให้บันทึกชื่อโมเดล ไฟล์เซสชันปัจจุบัน และ
    การเรียกใช้งานนั้นใช้ `Cloud + Local` หรือ `Cloud only` จากนั้นลองใช้
    เซสชันใหม่และโมเดลสำรอง:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="โมเดลภายในเครื่องที่ยังไม่วอร์มหมดเวลา">
    โมเดลภายในเครื่องขนาดใหญ่อาจต้องใช้เวลานานในการโหลดครั้งแรก ให้จำกัดขอบเขตการหมดเวลาไว้ที่
    ผู้ให้บริการ Ollama และเลือกคงโมเดลไว้ในหน่วยความจำระหว่างรอบได้:

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
    ขยายระยะหมดเวลาการเชื่อมต่อแบบมีการป้องกันสำหรับผู้ให้บริการนี้ด้วย

  </Accordion>

  <Accordion title="โมเดลบริบทขนาดใหญ่ช้าเกินไปหรือหน่วยความจำหมด">
    หลายโมเดลประกาศขนาดบริบทที่ใหญ่เกินกว่าฮาร์ดแวร์ของคุณจะเรียกใช้
    ได้อย่างราบรื่น Ollama แบบเนทีฟจะใช้ค่าเริ่มต้นของรันไทม์ของตัวเอง เว้นแต่
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

    ลด `contextWindow` หาก OpenClaw ส่งพรอมป์มากเกินไป ลด
    `params.num_ctx` หากบริบทรันไทม์ของ Ollama ใหญ่เกินไปสำหรับเครื่อง
    ลด `maxTokens` หากการสร้างผลลัพธ์ใช้เวลานานเกินไป

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

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
    รายละเอียดการตั้งค่าและพฤติกรรมทั้งหมดสำหรับการค้นหาเว็บที่ขับเคลื่อนด้วย Ollama
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
</CardGroup>
