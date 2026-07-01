---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw ด้วยโมเดลบนคลาวด์หรือโมเดลในเครื่องผ่าน Ollama
    - คุณต้องมีคำแนะนำในการตั้งค่าและกำหนดค่า Ollama
    - คุณต้องการโมเดล vision ของ Ollama สำหรับการทำความเข้าใจภาพ
summary: เรียกใช้ OpenClaw ด้วย Ollama (โมเดลบนคลาวด์และโมเดลในเครื่อง)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T08:47:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw ผสานกับ API ดั้งเดิมของ Ollama (`/api/chat`) สำหรับโมเดลคลาวด์แบบโฮสต์และเซิร์ฟเวอร์ Ollama แบบโลคัล/โฮสต์เอง คุณสามารถใช้ Ollama ได้สามโหมด: `Cloud + Local` ผ่านโฮสต์ Ollama ที่เข้าถึงได้, `Cloud only` กับ `https://ollama.com` หรือ `Local only` กับโฮสต์ Ollama ที่เข้าถึงได้

OpenClaw ยังลงทะเบียน `ollama-cloud` เป็น id ผู้ให้บริการแบบโฮสต์ระดับหลักสำหรับ
การใช้ Ollama Cloud โดยตรง ใช้ ref เช่น `ollama-cloud/kimi-k2.5:cloud` เมื่อคุณ
ต้องการการกำหนดเส้นทางเฉพาะคลาวด์โดยไม่ใช้ id ผู้ให้บริการ `ollama` แบบโลคัลร่วมกัน

สำหรับหน้าการตั้งค่าเฉพาะแบบคลาวด์เท่านั้น โปรดดู [Ollama Cloud](/th/providers/ollama-cloud)

<Warning>
**ผู้ใช้ Ollama ระยะไกล**: อย่าใช้ URL ที่เข้ากันได้กับ OpenAI แบบ `/v1` (`http://host:11434/v1`) กับ OpenClaw สิ่งนี้ทำให้การเรียกใช้เครื่องมือเสียหาย และโมเดลอาจส่งออก JSON ของเครื่องมือดิบเป็นข้อความธรรมดา ใช้ URL ของ API ดั้งเดิมของ Ollama แทน: `baseUrl: "http://host:11434"` (ไม่มี `/v1`)
</Warning>

การกำหนดค่าผู้ให้บริการ Ollama ใช้ `baseUrl` เป็นคีย์มาตรฐาน OpenClaw ยังยอมรับ `baseURL` เพื่อความเข้ากันได้กับตัวอย่างสไตล์ OpenAI SDK แต่การกำหนดค่าใหม่ควรเลือกใช้ `baseUrl`

## กฎการยืนยันตัวตน

<AccordionGroup>
  <Accordion title="โฮสต์โลคัลและ LAN">
    โฮสต์ Ollama แบบโลคัลและ LAN ไม่ต้องใช้ bearer token จริง OpenClaw ใช้เครื่องหมาย `ollama-local` แบบโลคัลเฉพาะกับ URL ฐานของ Ollama แบบ loopback, เครือข่ายส่วนตัว, `.local` และชื่อโฮสต์เปล่าเท่านั้น
  </Accordion>
  <Accordion title="โฮสต์ระยะไกลและ Ollama Cloud">
    โฮสต์สาธารณะระยะไกลและ Ollama Cloud (`https://ollama.com`) ต้องใช้ข้อมูลประจำตัวจริงผ่าน `OLLAMA_API_KEY`, โปรไฟล์การยืนยันตัวตน หรือ `apiKey` ของผู้ให้บริการ สำหรับการใช้งานแบบโฮสต์โดยตรง ให้เลือกผู้ให้บริการ `ollama-cloud`
  </Accordion>
  <Accordion title="id ผู้ให้บริการแบบกำหนดเอง">
    id ผู้ให้บริการแบบกำหนดเองที่ตั้งค่า `api: "ollama"` จะทำตามกฎเดียวกัน ตัวอย่างเช่น ผู้ให้บริการ `ollama-remote` ที่ชี้ไปยังโฮสต์ Ollama บน LAN ส่วนตัวสามารถใช้ `apiKey: "ollama-local"` และเอเจนต์ย่อยจะแก้เครื่องหมายนั้นผ่าน hook ของผู้ให้บริการ Ollama แทนที่จะถือว่าเป็นข้อมูลประจำตัวที่หายไป การค้นหาหน่วยความจำยังสามารถตั้งค่า `agents.defaults.memorySearch.provider` เป็น id ผู้ให้บริการแบบกำหนดเองนั้นเพื่อให้ embeddings ใช้ปลายทาง Ollama ที่ตรงกัน
  </Accordion>
  <Accordion title="โปรไฟล์การยืนยันตัวตน">
    `auth-profiles.json` เก็บข้อมูลประจำตัวสำหรับ id ผู้ให้บริการ ใส่การตั้งค่าปลายทาง (`baseUrl`, `api`, id โมเดล, headers, timeouts) ใน `models.providers.<id>` ไฟล์ auth-profile แบบแบนรุ่นเก่า เช่น `{ "ollama-windows": { "apiKey": "ollama-local" } }` ไม่ใช่รูปแบบรันไทม์ ให้รัน `openclaw doctor --fix` เพื่อเขียนใหม่เป็นโปรไฟล์คีย์ API มาตรฐาน `ollama-windows:default` พร้อมสำรองข้อมูล `baseUrl` ในไฟล์นั้นเป็นข้อมูลรบกวนเพื่อความเข้ากันได้ และควรถูกย้ายไปยังการกำหนดค่าผู้ให้บริการ
  </Accordion>
  <Accordion title="ขอบเขต embedding ของหน่วยความจำ">
    เมื่อใช้ Ollama สำหรับ embeddings ของหน่วยความจำ การยืนยันตัวตนแบบ bearer จะถูกจำกัดขอบเขตไว้ที่โฮสต์ที่ประกาศไว้:

    - คีย์ระดับผู้ให้บริการจะถูกส่งไปยังโฮสต์ Ollama ของผู้ให้บริการนั้นเท่านั้น
    - `agents.*.memorySearch.remote.apiKey` จะถูกส่งไปยังโฮสต์ embedding ระยะไกลของตัวเองเท่านั้น
    - ค่า env `OLLAMA_API_KEY` ล้วนจะถูกถือเป็นข้อตกลงของ Ollama Cloud และจะไม่ถูกส่งไปยังโฮสต์โลคัลหรือโฮสต์เองโดยค่าเริ่มต้น

  </Accordion>
</AccordionGroup>

## เริ่มต้นใช้งาน

เลือกวิธีการตั้งค่าและโหมดที่คุณต้องการ

<Tabs>
  <Tab title="Onboarding (แนะนำ)">
    **เหมาะที่สุดสำหรับ:** เส้นทางที่เร็วที่สุดเพื่อให้การตั้งค่า Ollama บนคลาวด์หรือโลคัลใช้งานได้

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard
        ```

        เลือก **Ollama** จากรายชื่อผู้ให้บริการ
      </Step>
      <Step title="เลือกโหมดของคุณ">
        - **Cloud + Local** — โฮสต์ Ollama แบบโลคัลพร้อมโมเดลคลาวด์ที่กำหนดเส้นทางผ่านโฮสต์นั้น
        - **Cloud only** — โมเดล Ollama แบบโฮสต์ผ่าน `https://ollama.com`
        - **Local only** — โมเดลโลคัลเท่านั้น

      </Step>
      <Step title="เลือกโมเดล">
        `Cloud only` จะแจ้งให้ป้อน `OLLAMA_API_KEY` และแนะนำค่าเริ่มต้นคลาวด์แบบโฮสต์ `Cloud + Local` และ `Local only` จะขอ URL ฐานของ Ollama, ค้นหาโมเดลที่มี และดึงโมเดลโลคัลที่เลือกโดยอัตโนมัติหากยังไม่มี เมื่อ Ollama รายงานแท็ก `:latest` ที่ติดตั้งแล้ว เช่น `gemma4:latest` การตั้งค่าจะแสดงโมเดลที่ติดตั้งนั้นครั้งเดียวแทนที่จะแสดงทั้ง `gemma4` และ `gemma4:latest` หรือดึง alias เปล่าอีกครั้ง `Cloud + Local` ยังตรวจสอบว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้เพื่อเข้าถึงคลาวด์แล้วหรือไม่
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### โหมดไม่โต้ตอบ

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    ระบุ URL ฐานหรือโมเดลแบบกำหนดเองได้ตามต้องการ:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="ตั้งค่าด้วยตนเอง">
    **เหมาะที่สุดสำหรับ:** การควบคุมการตั้งค่าคลาวด์หรือโลคัลอย่างเต็มที่

    <Steps>
      <Step title="เลือกคลาวด์หรือโลคัล">
        - **Cloud + Local**: ติดตั้ง Ollama, ลงชื่อเข้าใช้ด้วย `ollama signin` และกำหนดเส้นทางคำขอคลาวด์ผ่านโฮสต์นั้น
        - **Cloud only**: ใช้ `https://ollama.com` พร้อม `OLLAMA_API_KEY`
        - **Local only**: ติดตั้ง Ollama จาก [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="ดึงโมเดลโลคัล (เฉพาะโลคัล)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="เปิดใช้ Ollama สำหรับ OpenClaw">
        สำหรับ `Cloud only` ให้ใช้ `OLLAMA_API_KEY` จริงของคุณ สำหรับการตั้งค่าที่มีโฮสต์รองรับ ค่า placeholder ใดก็ใช้ได้:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบและตั้งค่าโมเดลของคุณ">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        หรือตั้งค่าเริ่มต้นในการกำหนดค่า:

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

## โมเดลคลาวด์

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` ใช้โฮสต์ Ollama ที่เข้าถึงได้เป็นจุดควบคุมสำหรับทั้งโมเดลโลคัลและโมเดลคลาวด์ นี่คือโฟลว์ไฮบริดที่ Ollama แนะนำ

    ใช้ **Cloud + Local** ระหว่างการตั้งค่า OpenClaw จะแจ้งให้ป้อน URL ฐานของ Ollama, ค้นหาโมเดลโลคัลจากโฮสต์นั้น และตรวจสอบว่าโฮสต์ลงชื่อเข้าใช้เพื่อเข้าถึงคลาวด์ด้วย `ollama signin` แล้วหรือไม่ เมื่อโฮสต์ลงชื่อเข้าใช้แล้ว OpenClaw ยังแนะนำค่าเริ่มต้นคลาวด์แบบโฮสต์ เช่น `kimi-k2.5:cloud`, `minimax-m2.7:cloud` และ `glm-5.1:cloud`

    หากโฮสต์ยังไม่ได้ลงชื่อเข้าใช้ OpenClaw จะคงการตั้งค่าเป็นโลคัลเท่านั้นจนกว่าคุณจะรัน `ollama signin`

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` ทำงานกับ API แบบโฮสต์ของ Ollama ที่ `https://ollama.com`

    ใช้ **Cloud only** ระหว่างการตั้งค่า OpenClaw จะแจ้งให้ป้อน `OLLAMA_API_KEY`, ตั้งค่า `baseUrl: "https://ollama.com"` และใส่รายการโมเดลคลาวด์แบบโฮสต์เริ่มต้น เส้นทางนี้ **ไม่** ต้องใช้เซิร์ฟเวอร์ Ollama แบบโลคัลหรือ `ollama signin`

    รายการโมเดลคลาวด์ที่แสดงระหว่าง `openclaw onboard` จะถูกเติมแบบสดจาก `https://ollama.com/api/tags` โดยจำกัดที่ 500 รายการ ดังนั้นตัวเลือกจึงสะท้อนแคตตาล็อกแบบโฮสต์ปัจจุบันแทน seed แบบคงที่ หากเข้าถึง `ollama.com` ไม่ได้หรือไม่ส่งคืนโมเดลในช่วงตั้งค่า OpenClaw จะย้อนกลับไปใช้คำแนะนำที่ hardcode ไว้ก่อนหน้าเพื่อให้ onboarding ยังเสร็จสมบูรณ์

    คุณยังสามารถกำหนดค่าผู้ให้บริการคลาวด์ระดับหลักได้โดยตรง:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    ในโหมดโลคัลเท่านั้น OpenClaw จะค้นหาโมเดลจากอินสแตนซ์ Ollama ที่กำหนดค่าไว้ เส้นทางนี้มีไว้สำหรับเซิร์ฟเวอร์ Ollama แบบโลคัลหรือโฮสต์เอง

    ปัจจุบัน OpenClaw แนะนำ `gemma4` เป็นค่าเริ่มต้นแบบโลคัล

  </Tab>
</Tabs>

## การค้นหาโมเดล (ผู้ให้บริการโดยปริยาย)

เมื่อคุณตั้งค่า `OLLAMA_API_KEY` (หรือโปรไฟล์การยืนยันตัวตน) และ **ไม่ได้** กำหนด `models.providers.ollama` หรือผู้ให้บริการระยะไกลแบบกำหนดเองอื่นที่มี `api: "ollama"` OpenClaw จะค้นหาโมเดลจากอินสแตนซ์ Ollama แบบโลคัลที่ `http://127.0.0.1:11434`

| พฤติกรรม             | รายละเอียด                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การค้นหาแคตตาล็อก        | ค้นหา `/api/tags`                                                                                                                                                  |
| การตรวจจับความสามารถ | ใช้การค้นหา `/api/show` แบบ best-effort เพื่ออ่าน `contextWindow`, พารามิเตอร์ Modelfile `num_ctx` แบบขยาย และความสามารถรวมถึง vision/tools                       |
| โมเดล vision        | โมเดลที่มีความสามารถ `vision` ที่รายงานโดย `/api/show` จะถูกทำเครื่องหมายว่ารองรับรูปภาพ (`input: ["text", "image"]`) ดังนั้น OpenClaw จะแทรกรูปภาพเข้าใน prompt โดยอัตโนมัติ  |
| การตรวจจับ reasoning  | ใช้ความสามารถจาก `/api/show` เมื่อมี รวมถึง `thinking`; ย้อนกลับไปใช้ heuristic จากชื่อโมเดล (`r1`, `reasoning`, `think`) เมื่อ Ollama ไม่ระบุความสามารถ |
| ขีดจำกัดโทเค็น         | ตั้งค่า `maxTokens` เป็นเพดานโทเค็นสูงสุดเริ่มต้นของ Ollama ที่ OpenClaw ใช้                                                                                                |
| ค่าใช้จ่าย                | ตั้งค่าใช้จ่ายทั้งหมดเป็น `0`                                                                                                                                                |

สิ่งนี้ช่วยหลีกเลี่ยงรายการโมเดลแบบแมนนวลในขณะที่ยังทำให้แคตตาล็อกตรงกับอินสแตนซ์ Ollama แบบโลคัล คุณสามารถใช้ ref เต็ม เช่น `ollama/<pulled-model>:latest` ใน `infer model run` แบบโลคัลได้; OpenClaw จะแก้โมเดลที่ติดตั้งนั้นจากแคตตาล็อกสดของ Ollama โดยไม่ต้องมีรายการ `models.json` ที่เขียนเอง

สำหรับโฮสต์ Ollama ที่ลงชื่อเข้าใช้แล้ว โมเดล `:cloud` บางตัวอาจใช้งานผ่าน `/api/chat`
และ `/api/show` ได้ก่อนที่จะปรากฏใน `/api/tags` เมื่อคุณเลือก ref
เต็ม `ollama/<model>:cloud` อย่างชัดเจน OpenClaw จะตรวจสอบโมเดลที่หายไปนั้นด้วย
`/api/show` และเพิ่มลงในแคตตาล็อกรันไทม์เฉพาะเมื่อ Ollama ยืนยัน metadata ของโมเดล
เท่านั้น การพิมพ์ผิดจะยังคงล้มเหลวเป็นโมเดลที่ไม่รู้จัก แทนที่จะถูกสร้างโดยอัตโนมัติ

```bash
# See what models are available
ollama list
openclaw models list
```

สำหรับ smoke test การสร้างข้อความแบบแคบที่หลีกเลี่ยงพื้นผิวเครื่องมือเอเจนต์เต็ม
ให้ใช้ `infer model run` แบบโลคัลพร้อม ref โมเดล Ollama แบบเต็ม:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

เส้นทางนั้นยังคงใช้ผู้ให้บริการที่กำหนดค่าไว้ของ OpenClaw, การยืนยันตัวตน และการส่งผ่าน Ollama
ดั้งเดิม แต่ไม่เริ่ม turn ของ chat-agent หรือโหลดบริบท MCP/เครื่องมือ หาก
สิ่งนี้สำเร็จขณะที่การตอบกลับของเอเจนต์ปกติล้มเหลว ให้แก้ปัญหาความจุด้าน prompt/เครื่องมือของเอเจนต์
ของโมเดลถัดไป

สำหรับ smoke test โมเดล vision แบบแคบบนเส้นทางแบบ lean เดียวกัน ให้เพิ่มไฟล์รูปภาพหนึ่งไฟล์ขึ้นไปใน `infer model run` สิ่งนี้จะส่ง prompt และรูปภาพโดยตรงไปยังโมเดล vision ของ Ollama ที่เลือกโดยไม่โหลดเครื่องมือแชท, หน่วยความจำ หรือบริบทเซสชันก่อนหน้า:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` รับไฟล์ที่ตรวจพบเป็น `image/*` รวมถึงอินพุต PNG,
JPEG และ WebP ทั่วไป ไฟล์ที่ไม่ใช่รูปภาพจะถูกปฏิเสธก่อนเรียก Ollama
สำหรับการรู้จำเสียงพูด ให้ใช้ `openclaw infer audio transcribe` แทน

เมื่อคุณสลับการสนทนาด้วย `/model ollama/<model>` OpenClaw จะถือว่า
นั่นเป็นการเลือกโดยผู้ใช้อย่างเจาะจง หาก Ollama `baseUrl` ที่กำหนดค่าไว้
เข้าถึงไม่ได้ การตอบกลับถัดไปจะล้มเหลวด้วยข้อผิดพลาดของผู้ให้บริการ แทนที่จะ
ตอบจากโมเดลสำรองอื่นที่กำหนดค่าไว้อย่างเงียบๆ

งาน cron แบบแยกโดดเดี่ยวจะทำการตรวจสอบความปลอดภัยในเครื่องเพิ่มเติมอีกหนึ่งครั้งก่อนเริ่ม
รอบการทำงานของ agent หากโมเดลที่เลือก resolve ไปยังผู้ให้บริการ Ollama แบบ local,
private-network หรือ `.local` และเข้าถึง `/api/tags` ไม่ได้ OpenClaw จะบันทึกการรัน cron นั้น
เป็น `skipped` โดยมี `ollama/<model>` ที่เลือกอยู่ในข้อความข้อผิดพลาด endpoint
preflight จะถูกแคชไว้ 5 นาที ดังนั้นงาน cron หลายงานที่ชี้ไปยัง daemon Ollama ตัวเดียวกัน
ที่หยุดทำงานอยู่จะไม่เปิดคำขอโมเดลที่ล้มเหลวทั้งหมดพร้อมกัน

ตรวจสอบแบบ live สำหรับเส้นทางข้อความ local, เส้นทาง native stream และ embeddings กับ
Ollama local ด้วย:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

สำหรับ smoke test ของ Ollama Cloud ด้วย API key ให้ชี้ live test ไปที่ `https://ollama.com`
และเลือกโมเดล hosted จาก catalog ปัจจุบัน:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

cloud smoke จะรันข้อความ, native stream และ web search โดยค่าเริ่มต้นจะข้าม embeddings
สำหรับ `https://ollama.com` เพราะ API key ของ Ollama Cloud อาจไม่ได้อนุญาต
`/api/embed` ตั้งค่า `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` เมื่อคุณต้องการอย่างชัดเจน
ให้ live test ล้มเหลวหาก key ของ cloud ที่กำหนดค่าไว้ไม่สามารถใช้ embed endpoint ได้

หากต้องการเพิ่มโมเดลใหม่ เพียง pull ด้วย Ollama:

```bash
ollama pull mistral
```

โมเดลใหม่จะถูกค้นพบโดยอัตโนมัติและพร้อมใช้งาน

<Note>
หากคุณตั้งค่า `models.providers.ollama` อย่างชัดเจน หรือกำหนดค่าผู้ให้บริการ remote แบบกำหนดเอง เช่น `models.providers.ollama-cloud` ด้วย `api: "ollama"` การค้นพบอัตโนมัติจะถูกข้าม และคุณต้องกำหนดโมเดลเอง ผู้ให้บริการแบบกำหนดเองบน loopback เช่น `http://127.0.0.2:11434` จะยังถือว่าเป็น local ดูส่วนการกำหนดค่าแบบชัดเจนด้านล่าง
</Note>

## Vision และคำอธิบายรูปภาพ

Plugin Ollama ที่รวมมาให้จะลงทะเบียน Ollama เป็นผู้ให้บริการ media-understanding ที่รองรับรูปภาพ ซึ่งทำให้ OpenClaw สามารถ route คำขอคำอธิบายรูปภาพแบบชัดเจนและค่าเริ่มต้นของโมเดลรูปภาพที่กำหนดค่าไว้ผ่านโมเดล vision ของ Ollama ทั้งแบบ local หรือ hosted ได้

สำหรับ vision แบบ local ให้ pull โมเดลที่รองรับรูปภาพ:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

จากนั้นตรวจสอบด้วย infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` ต้องเป็น ref `<provider/model>` แบบเต็ม เมื่อตั้งค่าไว้ `openclaw infer image describe` จะลองโมเดลนั้นก่อน แทนที่จะข้ามคำอธิบายเพราะโมเดลรองรับ native vision หากการเรียกโมเดลล้มเหลว OpenClaw สามารถดำเนินต่อผ่าน `agents.defaults.imageModel.fallbacks` ที่กำหนดค่าไว้ได้ ข้อผิดพลาดในการเตรียมไฟล์หรือ URL จะยังล้มเหลวก่อนความพยายามใช้ fallback

ใช้ `infer image describe` เมื่อคุณต้องการ flow ผู้ให้บริการ image-understanding ของ OpenClaw, `agents.defaults.imageModel` ที่กำหนดค่าไว้ และรูปแบบเอาต์พุตคำอธิบายรูปภาพ ใช้ `infer model run --file` เมื่อคุณต้องการ probe โมเดล multimodal แบบ raw ด้วย prompt แบบกำหนดเองและรูปภาพหนึ่งรูปขึ้นไป

หากต้องการให้ Ollama เป็นโมเดล image-understanding เริ่มต้นสำหรับสื่อขาเข้า ให้กำหนดค่า `agents.defaults.imageModel`:

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

แนะนำให้ใช้ ref `ollama/<model>` แบบเต็ม หากโมเดลเดียวกันถูกระบุภายใต้ `models.providers.ollama.models` พร้อม `input: ["text", "image"]` และไม่มีผู้ให้บริการรูปภาพอื่นที่กำหนดค่าไว้เปิดเผย ID โมเดลแบบ bare เดียวกัน OpenClaw จะ normalize ref `imageModel` แบบ bare เช่น `qwen2.5vl:7b` เป็น `ollama/qwen2.5vl:7b` ด้วย หากมีผู้ให้บริการรูปภาพที่กำหนดค่าไว้มากกว่าหนึ่งรายมี ID แบบ bare เดียวกัน ให้ใช้ prefix ของผู้ให้บริการอย่างชัดเจน

โมเดล vision แบบ local ที่ช้าอาจต้องใช้ timeout สำหรับ image-understanding ที่นานกว่าโมเดล cloud และยังอาจ crash หรือหยุดเมื่อ Ollama พยายามจัดสรร vision context ตามที่ประกาศไว้เต็มรูปแบบบนฮาร์ดแวร์ที่มีข้อจำกัด ตั้งค่า capability timeout และจำกัด `num_ctx` บนรายการโมเดลเมื่อคุณต้องการเพียงรอบการทำงานคำอธิบายรูปภาพปกติ:

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

timeout นี้ใช้กับการทำความเข้าใจรูปภาพขาเข้าและเครื่องมือ `image` แบบชัดเจนที่ agent สามารถเรียกได้ระหว่างรอบการทำงาน `models.providers.ollama.timeoutSeconds` ระดับผู้ให้บริการยังควบคุมตัวป้องกันคำขอ HTTP ของ Ollama ที่อยู่เบื้องหลังสำหรับการเรียกโมเดลปกติ

ตรวจสอบเครื่องมือรูปภาพแบบชัดเจนกับ Ollama local แบบ live ด้วย:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

หากคุณกำหนด `models.providers.ollama.models` ด้วยตนเอง ให้ทำเครื่องหมายโมเดล vision ว่ารองรับอินพุตรูปภาพ:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw จะปฏิเสธคำขอคำอธิบายรูปภาพสำหรับโมเดลที่ไม่ได้ทำเครื่องหมายว่ารองรับรูปภาพ เมื่อใช้การค้นพบโดยนัย OpenClaw จะอ่านค่านี้จาก Ollama เมื่อ `/api/show` รายงาน capability ของ vision

## การกำหนดค่า

<Tabs>
  <Tab title="พื้นฐาน (การค้นพบโดยนัย)">
    เส้นทางเปิดใช้งานแบบ local-only ที่ง่ายที่สุดคือผ่าน environment variable:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    หากตั้งค่า `OLLAMA_API_KEY` ไว้ คุณสามารถละเว้น `apiKey` ในรายการผู้ให้บริการได้ และ OpenClaw จะเติมให้สำหรับการตรวจสอบความพร้อมใช้งาน
    </Tip>

  </Tab>

  <Tab title="ชัดเจน (โมเดลด้วยตนเอง)">
    ใช้การกำหนดค่าแบบชัดเจนเมื่อคุณต้องการตั้งค่า hosted cloud, Ollama รันบน host/port อื่น, ต้องการบังคับ context window หรือรายการโมเดลเฉพาะ หรือคุณต้องการนิยามโมเดลด้วยตนเองทั้งหมด

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
    หาก Ollama กำลังรันบน host หรือ port อื่น (การกำหนดค่าแบบชัดเจนจะปิดการค้นพบอัตโนมัติ ดังนั้นให้กำหนดโมเดลด้วยตนเอง):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
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
    อย่าเพิ่ม `/v1` ลงใน URL path `/v1` ใช้โหมดที่เข้ากันได้กับ OpenAI ซึ่งการเรียก tool ไม่น่าเชื่อถือ ให้ใช้ URL ฐานของ Ollama โดยไม่มี path suffix
    </Warning>

  </Tab>
</Tabs>

## สูตรทั่วไป

ใช้สิ่งเหล่านี้เป็นจุดเริ่มต้นและแทนที่ ID โมเดลด้วยชื่อที่ตรงกันจาก `ollama list` หรือ `openclaw models list --provider ollama`

<AccordionGroup>
  <Accordion title="โมเดล local พร้อมการค้นพบอัตโนมัติ">
    ใช้สิ่งนี้เมื่อ Ollama รันบนเครื่องเดียวกับ Gateway และคุณต้องการให้ OpenClaw ค้นพบโมเดลที่ติดตั้งไว้โดยอัตโนมัติ

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    เส้นทางนี้ทำให้การกำหนดค่าน้อยที่สุด อย่าเพิ่มบล็อก `models.providers.ollama` เว้นแต่คุณต้องการกำหนดโมเดลด้วยตนเอง

  </Accordion>

  <Accordion title="host Ollama บน LAN พร้อมโมเดลด้วยตนเอง">
    ใช้ URL ของ Ollama แบบ native สำหรับ host บน LAN อย่าเพิ่ม `/v1`

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

    `contextWindow` คือ context budget ฝั่ง OpenClaw ส่วน `params.num_ctx` จะถูกส่งไปยัง Ollama สำหรับคำขอ ให้คงค่าเหล่านี้ให้สอดคล้องกันเมื่อฮาร์ดแวร์ของคุณไม่สามารถรัน context เต็มตามที่โมเดลประกาศไว้ได้

  </Accordion>

  <Accordion title="Ollama Cloud เท่านั้น">
    ใช้สิ่งนี้เมื่อคุณไม่ได้รัน daemon local และต้องการใช้โมเดล hosted ของ Ollama โดยตรง

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

  </Accordion>

  <Accordion title="Cloud ร่วมกับ local ผ่าน daemon ที่ลงชื่อเข้าใช้แล้ว">
    ใช้สิ่งนี้เมื่อ daemon Ollama แบบ local หรือ LAN ลงชื่อเข้าใช้ด้วย `ollama signin` แล้ว และควรให้บริการทั้งโมเดล local และโมเดล `:cloud`

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
    ใช้ ID ผู้ให้บริการแบบกำหนดเองเมื่อคุณมีเซิร์ฟเวอร์ Ollama มากกว่าหนึ่งเครื่อง ผู้ให้บริการแต่ละรายจะมี host, models, auth, timeout และ model refs ของตนเอง

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

    เมื่อ OpenClaw ส่งคำขอ prefix ของผู้ให้บริการที่ใช้งานอยู่จะถูกตัดออก ดังนั้น `ollama-large/qwen3.5:27b` จะไปถึง Ollama เป็น `qwen3.5:27b`

  </Accordion>

  <Accordion title="Lean local model profile">
    โมเดลในเครื่องบางตัวตอบ prompt แบบง่ายได้ แต่มีปัญหากับพื้นผิวเครื่องมือ agent แบบเต็ม เริ่มด้วยการจำกัดเครื่องมือและบริบทก่อนเปลี่ยนการตั้งค่า runtime ส่วนกลาง

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

    ใช้ `compat.supportsTools: false` เฉพาะเมื่อโมเดลหรือเซิร์ฟเวอร์ล้มเหลวกับ schema ของเครื่องมืออย่างสม่ำเสมอเท่านั้น ตัวเลือกนี้แลกความสามารถของ agent กับเสถียรภาพ
    `localModelLean` จะลบเครื่องมือเบราว์เซอร์ Cron และข้อความออกจากพื้นผิว agent โดยตรง และตั้งค่า catalog ขนาดใหญ่กว่าไว้หลังตัวควบคุมการค้นหาเครื่องมือแบบมีโครงสร้างโดยค่าเริ่มต้น ยกเว้นเมื่อการรันต้องรักษาความหมายของการส่งข้อความโดยตรงไว้ แต่จะไม่เปลี่ยนบริบท runtime หรือโหมดคิดของ Ollama ใช้คู่กับ `params.num_ctx` และ `params.thinking: false` แบบระบุชัดเจนสำหรับโมเดลคิดขนาดเล็กแบบ Qwen ที่วนลูปหรือใช้ budget การตอบไปกับการให้เหตุผลที่ซ่อนอยู่

  </Accordion>
</AccordionGroup>

### การเลือกโมเดล

เมื่อตั้งค่าแล้ว โมเดล Ollama ทั้งหมดของคุณจะพร้อมใช้งาน:

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

รองรับ ID ผู้ให้บริการ Ollama แบบกำหนดเองด้วย เมื่อ model ref ใช้ prefix
ของผู้ให้บริการที่ใช้งานอยู่ เช่น `ollama-spark/qwen3:32b` OpenClaw จะตัดเฉพาะ
prefix นั้นก่อนเรียก Ollama เพื่อให้เซิร์ฟเวอร์ได้รับ `qwen3:32b`

สำหรับโมเดลในเครื่องที่ช้า ให้ปรับแต่งคำขอในขอบเขตผู้ให้บริการก่อนเพิ่ม
timeout ของ runtime agent ทั้งหมด:

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

`timeoutSeconds` ใช้กับคำขอ HTTP ของโมเดล รวมถึงการตั้งค่าการเชื่อมต่อ
headers, body streaming และการ abort แบบ guarded-fetch ทั้งหมด `params.keep_alive`
จะถูกส่งต่อไปยัง Ollama เป็น `keep_alive` ระดับบนสุดในคำขอ `/api/chat` แบบ native;
ตั้งค่าต่อโมเดลเมื่อเวลาโหลดใน turn แรกเป็นคอขวด

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

สำหรับ host ระยะไกล ให้แทนที่ `127.0.0.1` ด้วย host ที่ใช้ใน `baseUrl` หาก `curl` ใช้งานได้แต่ OpenClaw ใช้งานไม่ได้ ให้ตรวจสอบว่า Gateway รันอยู่บนเครื่อง container หรือ service account อื่นหรือไม่

## การค้นหาเว็บของ Ollama

OpenClaw รองรับ **การค้นหาเว็บของ Ollama** เป็นผู้ให้บริการ `web_search` ที่มาพร้อมชุดติดตั้ง

| คุณสมบัติ    | รายละเอียด                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | ใช้ Ollama host ที่คุณตั้งค่าไว้ (`models.providers.ollama.baseUrl` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `http://127.0.0.1:11434`); `https://ollama.com` ใช้ hosted API โดยตรง |
| Auth        | ไม่ต้องใช้ key สำหรับ Ollama host ในเครื่องที่ลงชื่อเข้าใช้แล้ว; ใช้ `OLLAMA_API_KEY` หรือ auth ของผู้ให้บริการที่ตั้งค่าไว้สำหรับการค้นหาโดยตรงผ่าน `https://ollama.com` หรือ host ที่ป้องกันด้วย auth               |
| ข้อกำหนด | host ในเครื่อง/host เองต้องกำลังรันและลงชื่อเข้าใช้ด้วย `ollama signin`; การค้นหา hosted โดยตรงต้องใช้ `baseUrl: "https://ollama.com"` พร้อม Ollama API key จริง |

เลือก **การค้นหาเว็บของ Ollama** ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` หรือตั้งค่า:

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

สำหรับการค้นหา hosted โดยตรงผ่าน Ollama Cloud:

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

สำหรับ daemon ในเครื่องที่ลงชื่อเข้าใช้แล้ว OpenClaw จะใช้ proxy `/api/experimental/web_search` ของ daemon สำหรับ `https://ollama.com` จะเรียก endpoint hosted `/api/web_search` โดยตรง

<Note>
สำหรับรายละเอียดการตั้งค่าและพฤติกรรมฉบับเต็ม โปรดดู [การค้นหาเว็บของ Ollama](/th/tools/ollama-search)
</Note>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **การเรียกเครื่องมือไม่เสถียรในโหมดที่เข้ากันได้กับ OpenAI** ใช้โหมดนี้เฉพาะเมื่อคุณต้องการรูปแบบ OpenAI สำหรับ proxy และไม่ได้พึ่งพาพฤติกรรมการเรียกเครื่องมือแบบ native
    </Warning>

    หากคุณต้องใช้ endpoint ที่เข้ากันได้กับ OpenAI แทน (เช่น อยู่หลัง proxy ที่รองรับเฉพาะรูปแบบ OpenAI) ให้ตั้งค่า `api: "openai-completions"` อย่างชัดเจน:

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

    โหมดนี้อาจไม่รองรับ streaming และการเรียกเครื่องมือพร้อมกัน คุณอาจต้องปิดใช้งาน streaming ด้วย `params: { streaming: false }` ใน config ของโมเดล

    เมื่อใช้ `api: "openai-completions"` กับ Ollama OpenClaw จะ inject `options.num_ctx` โดยค่าเริ่มต้น เพื่อให้ Ollama ไม่ fallback กลับไปใช้ context window 4096 อย่างเงียบ ๆ หาก proxy/upstream ของคุณปฏิเสธฟิลด์ `options` ที่ไม่รู้จัก ให้ปิดใช้งานพฤติกรรมนี้:

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
    สำหรับโมเดลที่ค้นพบอัตโนมัติ OpenClaw จะใช้ context window ที่ Ollama รายงานเมื่อมีให้ใช้ รวมถึงค่า `PARAMETER num_ctx` ที่ใหญ่กว่าจาก Modelfile แบบกำหนดเอง มิฉะนั้นจะ fallback ไปใช้ context window เริ่มต้นของ Ollama ที่ OpenClaw ใช้

    คุณสามารถตั้งค่า default ระดับผู้ให้บริการ `contextWindow`, `contextTokens` และ `maxTokens` สำหรับทุกโมเดลภายใต้ผู้ให้บริการ Ollama นั้น แล้ว override ต่อโมเดลเมื่อจำเป็น `contextWindow` คือ prompt และ budget สำหรับ Compaction ของ OpenClaw คำขอ Ollama แบบ native จะปล่อย `options.num_ctx` ว่างไว้ เว้นแต่คุณตั้งค่า `params.num_ctx` อย่างชัดเจน เพื่อให้ Ollama ใช้ค่า default ของโมเดลเอง `OLLAMA_CONTEXT_LENGTH` หรือค่าตาม VRAM ได้ หากต้องการจำกัดหรือบังคับบริบท runtime ต่อคำขอของ Ollama โดยไม่ต้องสร้าง Modelfile ใหม่ ให้ตั้งค่า `params.num_ctx`; ค่าที่ไม่ถูกต้อง ศูนย์ ติดลบ และไม่สิ้นสุดจะถูกละเว้น หากคุณอัปเกรด config เก่าที่ใช้เฉพาะ `contextWindow` หรือ `maxTokens` เพื่อบังคับบริบทคำขอ Ollama แบบ native ให้รัน `openclaw doctor --fix` เพื่อคัดลอก budget ระดับผู้ให้บริการหรือโมเดลที่ระบุชัดเจนเหล่านั้นไปยัง `params.num_ctx` adapter Ollama ที่เข้ากันได้กับ OpenAI ยังคง inject `options.num_ctx` โดยค่าเริ่มต้นจาก `params.num_ctx` หรือ `contextWindow` ที่ตั้งค่าไว้; ปิดใช้งานด้วย `injectNumCtxForOpenAICompat: false` หาก upstream ของคุณปฏิเสธ `options`

    รายการโมเดล Ollama แบบ native ยังรับตัวเลือก runtime ของ Ollama ทั่วไปภายใต้ `params` รวมถึง `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` และ `use_mmap` OpenClaw จะส่งต่อเฉพาะ key ของคำขอ Ollama ดังนั้น params ของ runtime OpenClaw เช่น `streaming` จะไม่รั่วไปยัง Ollama ใช้ `params.think` หรือ `params.thinking` เพื่อส่ง `think` ระดับบนสุดของ Ollama; `false` จะปิดการคิดระดับ API สำหรับโมเดลคิดแบบ Qwen

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` ต่อโมเดลก็ใช้ได้เช่นกัน หากตั้งค่าทั้งสองที่ รายการโมเดลของผู้ให้บริการที่ระบุชัดเจนจะชนะ default ของ agent

  </Accordion>

  <Accordion title="Thinking control">
    สำหรับโมเดล Ollama แบบ native OpenClaw จะส่งต่อการควบคุมการคิดตามที่ Ollama คาดไว้: `think` ระดับบนสุด ไม่ใช่ `options.think` โมเดลที่ค้นพบอัตโนมัติซึ่งการตอบกลับ `/api/show` มี capability `thinking` จะแสดง `/think low`, `/think medium`, `/think high` และ `/think max`; โมเดลที่ไม่คิดจะแสดงเฉพาะ `/think off`

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    คุณยังสามารถตั้งค่า default ของโมเดลได้ด้วย:

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

    `params.think` หรือ `params.thinking` ต่อโมเดลสามารถปิดใช้งานหรือบังคับการคิดของ Ollama API สำหรับโมเดลที่ตั้งค่าไว้เฉพาะได้ OpenClaw จะรักษา params ของโมเดลที่ระบุชัดเจนเหล่านั้นไว้เมื่อการรันที่ใช้งานอยู่มีเพียงค่า default แฝง `off`; คำสั่ง runtime ที่ไม่ใช่ off เช่น `/think medium` ยังคง override การรันที่ใช้งานอยู่

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw ถือว่าโมเดลที่มีชื่ออย่าง `deepseek-r1`, `reasoning` หรือ `think` รองรับการให้เหตุผลโดยค่าเริ่มต้น

    ```bash
    ollama pull deepseek-r1:32b
    ```

    ไม่ต้องตั้งค่าเพิ่มเติม OpenClaw จะทำเครื่องหมายโมเดลเหล่านี้โดยอัตโนมัติ

  </Accordion>

  <Accordion title="ค่าใช้จ่ายของโมเดล">
    Ollama ฟรีและรันภายในเครื่อง ดังนั้นค่าใช้จ่ายของโมเดลทั้งหมดจึงถูกตั้งเป็น $0 กรณีนี้ใช้กับทั้งโมเดลที่ค้นพบอัตโนมัติและโมเดลที่กำหนดด้วยตนเอง
  </Accordion>

  <Accordion title="เอ็มเบดดิงหน่วยความจำ">
    Plugin Ollama ที่รวมมาให้ลงทะเบียนผู้ให้บริการเอ็มเบดดิงหน่วยความจำสำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory) โดยใช้ URL ฐานของ Ollama
    และคีย์ API ที่กำหนดค่าไว้ เรียกเอนด์พอยต์ `/api/embed` ปัจจุบันของ Ollama และรวม
    ชิ้นส่วนหน่วยความจำหลายรายการเป็นคำขอ `input` เดียวเมื่อทำได้

    เมื่อ `proxy.enabled=true` คำขอเอ็มเบดดิงหน่วยความจำของ Ollama ไปยัง
    ต้นทาง local loopback ของโฮสต์ที่ตรงกันทุกประการซึ่งได้มาจาก `baseUrl` ที่กำหนดค่าไว้ จะใช้
    เส้นทางตรงที่มีการป้องกันของ OpenClaw แทนพร็อกซีส่งต่อที่จัดการไว้
    ชื่อโฮสต์ที่กำหนดค่าไว้ต้องเป็น `localhost` หรือค่าลิเทอรัล IP แบบ loopback เอง;
    ชื่อ DNS ที่เพียงแค่ resolve ไปยัง loopback จะยังใช้เส้นทางพร็อกซีที่จัดการไว้
    โฮสต์ Ollama บน LAN, tailnet, เครือข่ายส่วนตัว และสาธารณะก็ยังอยู่บน
    เส้นทางพร็อกซีที่จัดการไว้เช่นกัน การเปลี่ยนเส้นทางไปยังโฮสต์หรือพอร์ตอื่นจะไม่ได้รับความเชื่อถือสืบทอด
    ผู้ดูแลระบบยังสามารถตั้งค่า `proxy.loopbackMode: "proxy"` แบบส่วนกลางเพื่อ
    ส่งทราฟฟิก loopback ผ่านพร็อกซี หรือ `proxy.loopbackMode: "block"`
    เพื่อปฏิเสธการเชื่อมต่อ loopback ก่อนเปิดการเชื่อมต่อได้; ดู
    [พร็อกซีที่จัดการไว้](/th/security/network-proxy#gateway-loopback-mode) สำหรับ
    ผลของการตั้งค่านี้ทั้งกระบวนการ

    | คุณสมบัติ      | ค่า               |
    | ------------- | ------------------- |
    | โมเดลเริ่มต้น | `nomic-embed-text`  |
    | ดึงอัตโนมัติ     | ใช่ — โมเดลเอ็มเบดดิงจะถูกดึงโดยอัตโนมัติหากยังไม่มีภายในเครื่อง |

    เอ็มเบดดิงขณะคิวรีใช้คำนำหน้าการดึงข้อมูลสำหรับโมเดลที่ต้องใช้หรือแนะนำให้ใช้ รวมถึง `nomic-embed-text`, `qwen3-embedding` และ `mxbai-embed-large` ชุดเอกสารหน่วยความจำจะคงเป็นข้อมูลดิบเพื่อให้ดัชนีที่มีอยู่ไม่ต้องย้ายรูปแบบ

    หากต้องการเลือก Ollama เป็นผู้ให้บริการเอ็มเบดดิงสำหรับการค้นหาหน่วยความจำ:

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

    สำหรับโฮสต์เอ็มเบดดิงระยะไกล ให้จำกัดขอบเขตการยืนยันตัวตนไว้ที่โฮสต์นั้น:

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
    การผสานรวม Ollama ของ OpenClaw ใช้ **API ดั้งเดิมของ Ollama** (`/api/chat`) เป็นค่าเริ่มต้น ซึ่งรองรับสตรีมมิงและการเรียกเครื่องมือพร้อมกันได้อย่างสมบูรณ์ ไม่จำเป็นต้องกำหนดค่าพิเศษ

    สำหรับคำขอ `/api/chat` แบบดั้งเดิม OpenClaw ยังส่งต่อการควบคุมการคิดไปยัง Ollama โดยตรงด้วย: `/think off` และ `openclaw agent --thinking off` จะส่ง `think: false` ระดับบนสุด เว้นแต่จะกำหนดค่า `params.think`/`params.thinking` ของโมเดลไว้อย่างชัดเจน ขณะที่ `/think low|medium|high` จะส่งสตริงระดับความพยายาม `think` ระดับบนสุดที่ตรงกัน `/think max` จะจับคู่กับระดับความพยายามดั้งเดิมสูงสุดของ Ollama คือ `think: "high"`

    <Tip>
    หากคุณจำเป็นต้องใช้เอนด์พอยต์ที่เข้ากันได้กับ OpenAI ให้ดูส่วน "โหมดเดิมที่เข้ากันได้กับ OpenAI" ด้านบน สตรีมมิงและการเรียกเครื่องมืออาจไม่ทำงานพร้อมกันในโหมดนั้น
    </Tip>

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ลูปการล่มของ WSL2 (รีบูตซ้ำ)">
    บน WSL2 พร้อม NVIDIA/CUDA ตัวติดตั้ง Ollama สำหรับ Linux อย่างเป็นทางการจะสร้างยูนิต systemd `ollama.service` พร้อม `Restart=always` หากบริการนั้นเริ่มอัตโนมัติและโหลดโมเดลที่ใช้ GPU ระหว่างการบูต WSL2 Ollama อาจยึดหน่วยความจำของโฮสต์ไว้ขณะโหลดโมเดล การเรียกคืนหน่วยความจำของ Hyper-V ไม่สามารถเรียกคืนเพจที่ถูกยึดเหล่านั้นได้เสมอไป ดังนั้น Windows อาจยุติ VM ของ WSL2, systemd เริ่ม Ollama อีกครั้ง และลูปก็เกิดซ้ำ

    หลักฐานที่พบบ่อย:

    - WSL2 รีบูตหรือถูกยุติซ้ำจากฝั่ง Windows
    - CPU สูงใน `app.slice` หรือ `ollama.service` ไม่นานหลังจาก WSL2 เริ่มทำงาน
    - SIGTERM จาก systemd แทนเหตุการณ์ OOM-killer ของ Linux

    OpenClaw บันทึกคำเตือนขณะเริ่มต้นเมื่อตรวจพบ WSL2, เปิดใช้งาน `ollama.service` พร้อม `Restart=always` และมีเครื่องหมาย CUDA ที่มองเห็นได้

    การบรรเทาปัญหา:

    ```bash
    sudo systemctl disable ollama
    ```

    เพิ่มสิ่งนี้ใน `%USERPROFILE%\.wslconfig` บนฝั่ง Windows จากนั้นรัน `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    ตั้งค่า keep-alive ให้สั้นลงในสภาพแวดล้อมของบริการ Ollama หรือเริ่ม Ollama ด้วยตนเองเฉพาะเมื่อคุณต้องการใช้:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    ดู [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)

  </Accordion>

  <Accordion title="ตรวจไม่พบ Ollama">
    ตรวจสอบให้แน่ใจว่า Ollama กำลังทำงาน และคุณตั้งค่า `OLLAMA_API_KEY` (หรือโปรไฟล์การยืนยันตัวตน) แล้ว และคุณ **ไม่ได้** กำหนดรายการ `models.providers.ollama` ไว้อย่างชัดเจน:

    ```bash
    ollama serve
    ```

    ตรวจสอบว่า API เข้าถึงได้:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="ไม่มีโมเดลพร้อมใช้งาน">
    หากโมเดลของคุณไม่อยู่ในรายการ ให้ดึงโมเดลมาไว้ภายในเครื่องหรือกำหนดโมเดลนั้นอย่างชัดเจนใน `models.providers.ollama`

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="การเชื่อมต่อถูกปฏิเสธ">
    ตรวจสอบว่า Ollama กำลังทำงานบนพอร์ตที่ถูกต้อง:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="โฮสต์ระยะไกลใช้กับ curl ได้ แต่ใช้กับ OpenClaw ไม่ได้">
    ตรวจสอบจากเครื่องและ runtime เดียวกันกับที่รัน Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    สาเหตุที่พบบ่อย:

    - `baseUrl` ชี้ไปที่ `localhost` แต่ Gateway รันใน Docker หรือบนโฮสต์อื่น
    - URL ใช้ `/v1` ซึ่งเลือกพฤติกรรมที่เข้ากันได้กับ OpenAI แทน Ollama แบบดั้งเดิม
    - โฮสต์ระยะไกลต้องเปลี่ยนการผูกไฟร์วอลล์หรือ LAN ทางฝั่ง Ollama
    - โมเดลมีอยู่ใน daemon บนแล็ปท็อปของคุณ แต่ไม่มีบน daemon ระยะไกล

  </Accordion>

  <Accordion title="โมเดลส่งออก JSON ของเครื่องมือเป็นข้อความ">
    โดยทั่วไปหมายความว่าผู้ให้บริการกำลังใช้โหมดที่เข้ากันได้กับ OpenAI หรือโมเดลไม่สามารถจัดการสคีมาเครื่องมือได้

    ควรใช้โหมด Ollama แบบดั้งเดิม:

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

    หากโมเดลภายในเครื่องขนาดเล็กยังล้มเหลวกับสคีมาเครื่องมือ ให้ตั้งค่า `compat.supportsTools: false` ในรายการโมเดลนั้นแล้วทดสอบอีกครั้ง

  </Accordion>

  <Accordion title="Kimi หรือ GLM ส่งคืนสัญลักษณ์เพี้ยน">
    การตอบกลับ Kimi/GLM ที่โฮสต์ไว้ซึ่งยาวและเป็นชุดสัญลักษณ์ที่ไม่ใช่ภาษา จะถูกถือว่าเป็นเอาต์พุตผู้ให้บริการที่ล้มเหลวแทนคำตอบผู้ช่วยที่สำเร็จ ซึ่งทำให้การลองใหม่ การ fallback หรือการจัดการข้อผิดพลาดตามปกติเข้ามารับช่วงได้ โดยไม่บันทึกข้อความที่เสียหายไว้ในเซสชัน

    หากเกิดขึ้นซ้ำ ให้บันทึกชื่อโมเดลดิบ ไฟล์เซสชันปัจจุบัน และว่าการรันใช้ `Cloud + Local` หรือ `Cloud only` จากนั้นลองเซสชันใหม่และโมเดล fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="โมเดลภายในเครื่องที่เย็นหมดเวลา">
    โมเดลภายในเครื่องขนาดใหญ่อาจต้องโหลดครั้งแรกนานก่อนที่สตรีมมิงจะเริ่ม ให้จำกัด timeout ไว้ที่ผู้ให้บริการ Ollama และอาจขอให้ Ollama โหลดโมเดลค้างไว้ระหว่างรอบการสนทนา:

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

    หากโฮสต์เองตอบรับการเชื่อมต่อช้า `timeoutSeconds` จะขยาย timeout การเชื่อมต่อ Undici ที่มีการป้องกันสำหรับผู้ให้บริการนี้ด้วย

  </Accordion>

  <Accordion title="โมเดลบริบทขนาดใหญ่ช้าเกินไปหรือหน่วยความจำหมด">
    โมเดล Ollama หลายตัวประกาศบริบทที่ใหญ่กว่าที่ฮาร์ดแวร์ของคุณจะรันได้อย่างสะดวก Ollama แบบดั้งเดิมใช้ค่าเริ่มต้นบริบท runtime ของ Ollama เอง เว้นแต่คุณจะตั้งค่า `params.num_ctx` จำกัดทั้งงบประมาณของ OpenClaw และบริบทคำขอของ Ollama เมื่อต้องการเวลาแฝงของโทเค็นแรกที่คาดเดาได้:

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

    ลด `contextWindow` ก่อนหาก OpenClaw ส่งพรอมป์มากเกินไป ลด `params.num_ctx` หาก Ollama กำลังโหลดบริบท runtime ที่ใหญ่เกินไปสำหรับเครื่อง ลด `maxTokens` หากการสร้างคำตอบใช้เวลานานเกินไป

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="การค้นหาเว็บด้วย Ollama" href="/th/tools/ollama-search" icon="magnifying-glass">
    รายละเอียดการตั้งค่าและพฤติกรรมทั้งหมดสำหรับการค้นหาเว็บที่ขับเคลื่อนโดย Ollama
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าทั้งหมด
  </Card>
</CardGroup>
