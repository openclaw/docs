---
read_when:
    - คุณต้องการรัน OpenClaw ด้วยโมเดลบนคลาวด์หรือโมเดลในเครื่องผ่าน Ollama
    - คุณต้องการคำแนะนำในการตั้งค่าและกำหนดค่า Ollama
    - คุณต้องการโมเดลวิชันของ Ollama สำหรับการทำความเข้าใจภาพ
summary: เรียกใช้ OpenClaw ด้วย Ollama (โมเดลบนคลาวด์และโมเดลในเครื่อง)
title: Ollama
x-i18n:
    generated_at: "2026-06-27T18:15:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw ผสานกับ API ดั้งเดิมของ Ollama (`/api/chat`) สำหรับโมเดลคลาวด์แบบโฮสต์และเซิร์ฟเวอร์ Ollama แบบ local/โฮสต์เอง คุณสามารถใช้ Ollama ได้สามโหมด: `Cloud + Local` ผ่านโฮสต์ Ollama ที่เข้าถึงได้, `Cloud only` กับ `https://ollama.com`, หรือ `Local only` กับโฮสต์ Ollama ที่เข้าถึงได้

OpenClaw ยังลงทะเบียน `ollama-cloud` เป็น id ผู้ให้บริการแบบโฮสต์ระดับ first-class สำหรับ
การใช้ Ollama Cloud โดยตรง ใช้ ref เช่น `ollama-cloud/kimi-k2.5:cloud` เมื่อคุณ
ต้องการการกำหนดเส้นทางแบบ cloud-only โดยไม่ใช้ id ผู้ให้บริการ `ollama` แบบ local ร่วมกัน

สำหรับหน้าตั้งค่าเฉพาะแบบ cloud-only โปรดดู [Ollama Cloud](/th/providers/ollama-cloud)

<Warning>
**ผู้ใช้ Ollama ระยะไกล**: อย่าใช้ URL ที่เข้ากันได้กับ OpenAI แบบ `/v1` (`http://host:11434/v1`) กับ OpenClaw เพราะจะทำให้การเรียกใช้เครื่องมือเสียหาย และโมเดลอาจส่งออก JSON ของเครื่องมือดิบเป็นข้อความธรรมดา ให้ใช้ URL API ดั้งเดิมของ Ollama แทน: `baseUrl: "http://host:11434"` (ไม่มี `/v1`)
</Warning>

การกำหนดค่าผู้ให้บริการ Ollama ใช้ `baseUrl` เป็นคีย์มาตรฐาน OpenClaw ยังยอมรับ `baseURL` เพื่อความเข้ากันได้กับตัวอย่างสไตล์ OpenAI SDK แต่การกำหนดค่าใหม่ควรใช้ `baseUrl`

## กฎการยืนยันตัวตน

<AccordionGroup>
  <Accordion title="โฮสต์ Local และ LAN">
    โฮสต์ Ollama แบบ local และ LAN ไม่ต้องใช้ bearer token จริง OpenClaw ใช้เครื่องหมาย `ollama-local` แบบ local เฉพาะกับ URL ฐานของ Ollama ที่เป็น loopback, เครือข่ายส่วนตัว, `.local`, และชื่อโฮสต์เปล่าเท่านั้น
  </Accordion>
  <Accordion title="โฮสต์ระยะไกลและ Ollama Cloud">
    โฮสต์สาธารณะระยะไกลและ Ollama Cloud (`https://ollama.com`) ต้องใช้ข้อมูลรับรองจริงผ่าน `OLLAMA_API_KEY`, โปรไฟล์ยืนยันตัวตน, หรือ `apiKey` ของผู้ให้บริการ สำหรับการใช้แบบโฮสต์โดยตรง ควรใช้ผู้ให้บริการ `ollama-cloud`
  </Accordion>
  <Accordion title="id ผู้ให้บริการแบบกำหนดเอง">
    id ผู้ให้บริการแบบกำหนดเองที่ตั้งค่า `api: "ollama"` จะใช้กฎเดียวกัน ตัวอย่างเช่น ผู้ให้บริการ `ollama-remote` ที่ชี้ไปยังโฮสต์ Ollama บน LAN ส่วนตัวสามารถใช้ `apiKey: "ollama-local"` ได้ และ sub-agent จะ resolve เครื่องหมายนั้นผ่าน hook ของผู้ให้บริการ Ollama แทนที่จะถือว่าเป็นข้อมูลรับรองที่ขาดหาย การค้นหาหน่วยความจำยังสามารถตั้งค่า `agents.defaults.memorySearch.provider` เป็น id ผู้ให้บริการแบบกำหนดเองนั้น เพื่อให้ embeddings ใช้ endpoint Ollama ที่ตรงกัน
  </Accordion>
  <Accordion title="โปรไฟล์ยืนยันตัวตน">
    `auth-profiles.json` เก็บข้อมูลรับรองสำหรับ id ผู้ให้บริการ วางการตั้งค่า endpoint (`baseUrl`, `api`, id โมเดล, headers, timeouts) ไว้ใน `models.providers.<id>` ไฟล์ auth-profile แบบแบนรุ่นเก่า เช่น `{ "ollama-windows": { "apiKey": "ollama-local" } }` ไม่ใช่รูปแบบ runtime ให้รัน `openclaw doctor --fix` เพื่อเขียนใหม่เป็นโปรไฟล์ API key มาตรฐาน `ollama-windows:default` พร้อมไฟล์สำรอง `baseUrl` ในไฟล์นั้นเป็น noise เพื่อความเข้ากันได้และควรถูกย้ายไปยังการกำหนดค่าผู้ให้บริการ
  </Accordion>
  <Accordion title="ขอบเขต embedding หน่วยความจำ">
    เมื่อใช้ Ollama สำหรับ embeddings หน่วยความจำ การยืนยันตัวตนแบบ bearer จะถูกจำกัดขอบเขตไว้ที่โฮสต์ที่ประกาศไว้:

    - คีย์ระดับผู้ให้บริการจะถูกส่งไปยังโฮสต์ Ollama ของผู้ให้บริการนั้นเท่านั้น
    - `agents.*.memorySearch.remote.apiKey` จะถูกส่งไปยังโฮสต์ embedding ระยะไกลของตัวเองเท่านั้น
    - ค่า env `OLLAMA_API_KEY` ล้วนจะถูกถือเป็นธรรมเนียมของ Ollama Cloud และโดยค่าเริ่มต้นจะไม่ส่งไปยังโฮสต์ local หรือโฮสต์เอง

  </Accordion>
</AccordionGroup>

## เริ่มต้นใช้งาน

เลือกวิธีตั้งค่าและโหมดที่คุณต้องการ

<Tabs>
  <Tab title="การเริ่มใช้งาน (แนะนำ)">
    **เหมาะสำหรับ:** เส้นทางที่เร็วที่สุดในการตั้งค่า Ollama cloud หรือ local ให้ใช้งานได้

    <Steps>
      <Step title="รันการเริ่มใช้งาน">
        ```bash
        openclaw onboard
        ```

        เลือก **Ollama** จากรายชื่อผู้ให้บริการ
      </Step>
      <Step title="เลือกโหมดของคุณ">
        - **Cloud + Local** — โฮสต์ Ollama แบบ local พร้อมโมเดลคลาวด์ที่กำหนดเส้นทางผ่านโฮสต์นั้น
        - **Cloud only** — โมเดล Ollama แบบโฮสต์ผ่าน `https://ollama.com`
        - **Local only** — โมเดล local เท่านั้น

      </Step>
      <Step title="เลือกโมเดล">
        `Cloud only` จะถามหา `OLLAMA_API_KEY` และแนะนำค่าเริ่มต้นคลาวด์แบบโฮสต์ `Cloud + Local` และ `Local only` จะถามหา URL ฐานของ Ollama, ค้นหาโมเดลที่มีอยู่, และ auto-pull โมเดล local ที่เลือกหากยังไม่มี เมื่อ Ollama รายงาน tag `:latest` ที่ติดตั้งแล้ว เช่น `gemma4:latest` การตั้งค่าจะแสดงโมเดลที่ติดตั้งนั้นครั้งเดียว แทนที่จะแสดงทั้ง `gemma4` และ `gemma4:latest` หรือ pull alias เปล่าอีกครั้ง `Cloud + Local` ยังตรวจสอบด้วยว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้สำหรับการเข้าถึงคลาวด์หรือไม่
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

    ระบุ URL ฐานหรือโมเดลแบบกำหนดเองเพิ่มเติมได้:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="ตั้งค่าด้วยตนเอง">
    **เหมาะสำหรับ:** การควบคุมการตั้งค่าคลาวด์หรือ local อย่างเต็มที่

    <Steps>
      <Step title="เลือกคลาวด์หรือ local">
        - **Cloud + Local**: ติดตั้ง Ollama, ลงชื่อเข้าใช้ด้วย `ollama signin`, และกำหนดเส้นทางคำขอคลาวด์ผ่านโฮสต์นั้น
        - **Cloud only**: ใช้ `https://ollama.com` กับ `OLLAMA_API_KEY`
        - **Local only**: ติดตั้ง Ollama จาก [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull โมเดล local (local only)">
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

        หรือตั้งค่าเริ่มต้นใน config:

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
    `Cloud + Local` ใช้โฮสต์ Ollama ที่เข้าถึงได้เป็นจุดควบคุมสำหรับทั้งโมเดล local และคลาวด์ นี่คือ flow แบบ hybrid ที่ Ollama แนะนำ

    ใช้ **Cloud + Local** ระหว่างการตั้งค่า OpenClaw จะถาม URL ฐานของ Ollama, ค้นหาโมเดล local จากโฮสต์นั้น, และตรวจสอบว่าโฮสต์ลงชื่อเข้าใช้สำหรับการเข้าถึงคลาวด์ด้วย `ollama signin` หรือไม่ เมื่อโฮสต์ลงชื่อเข้าใช้แล้ว OpenClaw ยังแนะนำค่าเริ่มต้นคลาวด์แบบโฮสต์ เช่น `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, และ `glm-5.1:cloud`

    หากโฮสต์ยังไม่ได้ลงชื่อเข้าใช้ OpenClaw จะคงการตั้งค่าเป็น local-only จนกว่าคุณจะรัน `ollama signin`

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` ทำงานกับ API แบบโฮสต์ของ Ollama ที่ `https://ollama.com`

    ใช้ **Cloud only** ระหว่างการตั้งค่า OpenClaw จะถามหา `OLLAMA_API_KEY`, ตั้งค่า `baseUrl: "https://ollama.com"`, และใส่รายการโมเดลคลาวด์แบบโฮสต์เริ่มต้น เส้นทางนี้ **ไม่** ต้องใช้เซิร์ฟเวอร์ Ollama แบบ local หรือ `ollama signin`

    รายการโมเดลคลาวด์ที่แสดงระหว่าง `openclaw onboard` ถูกเติมแบบ live จาก `https://ollama.com/api/tags` โดยจำกัดที่ 500 รายการ ดังนั้นตัวเลือกจะสะท้อน catalog แบบโฮสต์ปัจจุบัน แทนที่จะเป็น seed แบบคงที่ หาก `ollama.com` เข้าถึงไม่ได้หรือไม่ส่งคืนโมเดลระหว่างตั้งค่า OpenClaw จะ fallback ไปยังคำแนะนำแบบ hardcoded ก่อนหน้าเพื่อให้การเริ่มใช้งานยังเสร็จสมบูรณ์

    คุณยังสามารถกำหนดค่าผู้ให้บริการคลาวด์ first-class ได้โดยตรง:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    ในโหมด local-only OpenClaw จะค้นหาโมเดลจาก instance Ollama ที่กำหนดค่าไว้ เส้นทางนี้ใช้สำหรับเซิร์ฟเวอร์ Ollama แบบ local หรือโฮสต์เอง

    ปัจจุบัน OpenClaw แนะนำ `gemma4` เป็นค่าเริ่มต้นแบบ local

  </Tab>
</Tabs>

## การค้นหาโมเดล (ผู้ให้บริการโดยนัย)

เมื่อคุณตั้งค่า `OLLAMA_API_KEY` (หรือโปรไฟล์ยืนยันตัวตน) และ **ไม่ได้** กำหนด `models.providers.ollama` หรือผู้ให้บริการระยะไกลแบบกำหนดเองอื่นที่มี `api: "ollama"` OpenClaw จะค้นหาโมเดลจาก instance Ollama แบบ local ที่ `http://127.0.0.1:11434`

| พฤติกรรม             | รายละเอียด                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การ query catalog        | Query `/api/tags`                                                                                                                                                  |
| การตรวจจับความสามารถ | ใช้การ lookup `/api/show` แบบ best-effort เพื่ออ่าน `contextWindow`, พารามิเตอร์ Modelfile `num_ctx` ที่ขยายแล้ว, และความสามารถรวมถึง vision/tools                       |
| โมเดล vision        | โมเดลที่มีความสามารถ `vision` ซึ่งรายงานโดย `/api/show` จะถูกทำเครื่องหมายว่ารองรับรูปภาพ (`input: ["text", "image"]`) ดังนั้น OpenClaw จะ auto-inject รูปภาพเข้าไปใน prompt  |
| การตรวจจับ reasoning  | ใช้ความสามารถจาก `/api/show` เมื่อมี รวมถึง `thinking`; fallback ไปยัง heuristic จากชื่อโมเดล (`r1`, `reasoning`, `think`) เมื่อ Ollama ละเว้นความสามารถ |
| ขีดจำกัด token         | ตั้งค่า `maxTokens` เป็นขีดจำกัด max-token เริ่มต้นของ Ollama ที่ OpenClaw ใช้                                                                                                |
| ต้นทุน                | ตั้งค่าต้นทุนทั้งหมดเป็น `0`                                                                                                                                                |

วิธีนี้หลีกเลี่ยงรายการโมเดลด้วยตนเอง พร้อมทำให้ catalog สอดคล้องกับ instance Ollama แบบ local คุณสามารถใช้ ref เต็ม เช่น `ollama/<pulled-model>:latest` ใน `infer model run` แบบ local ได้; OpenClaw จะ resolve โมเดลที่ติดตั้งนั้นจาก catalog live ของ Ollama โดยไม่ต้องมีรายการ `models.json` ที่เขียนด้วยมือ

สำหรับโฮสต์ Ollama ที่ลงชื่อเข้าใช้แล้ว โมเดล `:cloud` บางรายการอาจใช้งานได้ผ่าน `/api/chat`
และ `/api/show` ก่อนที่จะปรากฏใน `/api/tags` เมื่อคุณเลือก ref
เต็ม `ollama/<model>:cloud` อย่างชัดเจน OpenClaw จะ validate โมเดลที่หายไปแบบเจาะจงนั้นด้วย
`/api/show` และเพิ่มเข้าไปใน runtime catalog เฉพาะเมื่อ Ollama ยืนยัน metadata
ของโมเดลเท่านั้น การพิมพ์ผิดยังคงล้มเหลวเป็นโมเดลที่ไม่รู้จัก แทนที่จะถูกสร้างอัตโนมัติ

```bash
# See what models are available
ollama list
openclaw models list
```

สำหรับการทดสอบ smoke test การสร้างข้อความแบบแคบที่หลีกเลี่ยงพื้นผิวเครื่องมือ agent เต็มรูปแบบ
ให้ใช้ `infer model run` แบบ local กับ ref โมเดล Ollama แบบเต็ม:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

เส้นทางนั้นยังคงใช้ผู้ให้บริการ, การยืนยันตัวตน, และ transport ดั้งเดิมของ Ollama
ที่ OpenClaw กำหนดค่าไว้ แต่จะไม่เริ่ม turn ของ chat-agent หรือโหลดบริบท MCP/tool หาก
สิ่งนี้สำเร็จขณะที่การตอบกลับของ agent ปกติล้มเหลว ให้แก้ปัญหาความจุของ prompt/tool
สำหรับ agent ของโมเดลเป็นลำดับถัดไป

สำหรับ smoke test โมเดล vision แบบแคบบนเส้นทาง lean เดียวกัน ให้เพิ่มไฟล์รูปภาพหนึ่งไฟล์หรือมากกว่า
ไปยัง `infer model run` วิธีนี้ส่ง prompt และรูปภาพโดยตรงไปยัง
โมเดล vision ของ Ollama ที่เลือก โดยไม่โหลดเครื่องมือแชต, หน่วยความจำ, หรือบริบท session
ก่อนหน้า:

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
สำหรับการรู้จำเสียง ให้ใช้ `openclaw infer audio transcribe` แทน

เมื่อคุณสลับการสนทนาด้วย `/model ollama/<model>` OpenClaw จะถือว่า
เป็นการเลือกของผู้ใช้อย่างเจาะจง หาก Ollama `baseUrl` ที่กำหนดค่าไว้
เข้าถึงไม่ได้ การตอบกลับถัดไปจะล้มเหลวด้วยข้อผิดพลาดของผู้ให้บริการ แทนที่จะตอบ
จากโมเดลสำรองอื่นที่กำหนดค่าไว้แบบเงียบ ๆ

งาน Cron แบบแยกเดี่ยวจะทำการตรวจสอบความปลอดภัยภายในเครื่องเพิ่มอีกหนึ่งครั้งก่อนเริ่ม
เทิร์นของเอเจนต์ หากโมเดลที่เลือก resolve ไปยังผู้ให้บริการ Ollama แบบภายในเครื่อง,
เครือข่ายส่วนตัว หรือ `.local` และเข้าถึง `/api/tags` ไม่ได้ OpenClaw จะบันทึกการรัน Cron นั้น
เป็น `skipped` พร้อม `ollama/<model>` ที่เลือกไว้ในข้อความข้อผิดพลาด endpoint
preflight จะถูกแคชไว้ 5 นาที ดังนั้นงาน Cron หลายงานที่ชี้ไปยัง daemon Ollama เดียวกัน
ที่หยุดอยู่จะไม่ทั้งหมดเริ่มคำขอโมเดลที่ล้มเหลว

ตรวจสอบแบบ live-verify เส้นทางข้อความภายในเครื่อง, เส้นทาง native stream และ embeddings กับ
Ollama ภายในเครื่องด้วย:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

สำหรับการทดสอบ smoke ของ API key สำหรับ Ollama Cloud ให้ชี้ live test ไปที่ `https://ollama.com`
และเลือกโมเดลแบบ hosted จากแค็ตตาล็อกปัจจุบัน:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Cloud smoke จะรันข้อความ, native stream และ web search โดยค่าเริ่มต้นจะข้าม embeddings
สำหรับ `https://ollama.com` เพราะ API key ของ Ollama Cloud อาจไม่มีสิทธิ์ใช้งาน
`/api/embed` ตั้งค่า `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` เมื่อคุณต้องการอย่างชัดเจน
ให้ live test ล้มเหลวหาก cloud key ที่กำหนดค่าไว้ใช้งาน embed endpoint ไม่ได้

หากต้องการเพิ่มโมเดลใหม่ เพียง pull ด้วย Ollama:

```bash
ollama pull mistral
```

โมเดลใหม่จะถูกค้นพบโดยอัตโนมัติและพร้อมใช้งาน

<Note>
หากคุณตั้งค่า `models.providers.ollama` อย่างชัดเจน หรือกำหนดค่าผู้ให้บริการระยะไกลแบบกำหนดเอง เช่น `models.providers.ollama-cloud` พร้อม `api: "ollama"` ระบบจะข้ามการค้นพบอัตโนมัติและคุณต้องกำหนดโมเดลด้วยตนเอง ผู้ให้บริการแบบกำหนดเองที่เป็น loopback เช่น `http://127.0.0.2:11434` จะยังถือว่าเป็นภายในเครื่อง ดูส่วนการกำหนดค่าแบบชัดเจนด้านล่าง
</Note>

## วิสัยทัศน์และคำอธิบายรูปภาพ

Plugin Ollama ที่รวมมาให้จะลงทะเบียน Ollama เป็นผู้ให้บริการความเข้าใจสื่อที่รองรับรูปภาพ ซึ่งทำให้ OpenClaw สามารถ route คำขออธิบายรูปภาพแบบชัดเจนและค่าเริ่มต้นของโมเดลรูปภาพที่กำหนดค่าไว้ผ่านโมเดล vision ของ Ollama ทั้งแบบภายในเครื่องหรือแบบ hosted

สำหรับ vision ภายในเครื่อง ให้ pull โมเดลที่รองรับรูปภาพ:

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

`--model` ต้องเป็น ref เต็มรูปแบบ `<provider/model>` เมื่อกำหนดค่านี้ `openclaw infer image describe` จะรันโมเดลนั้นโดยตรง แทนที่จะข้ามคำอธิบายเพราะโมเดลรองรับ native vision

ใช้ `infer image describe` เมื่อคุณต้องการ flow ผู้ให้บริการความเข้าใจรูปภาพของ OpenClaw, `agents.defaults.imageModel` ที่กำหนดค่าไว้ และรูปแบบเอาต์พุตคำอธิบายรูปภาพ ใช้ `infer model run --file` เมื่อคุณต้องการ probe โมเดล multimodal แบบ raw พร้อม prompt แบบกำหนดเองและรูปภาพหนึ่งรูปหรือมากกว่า

หากต้องการทำให้ Ollama เป็นโมเดลความเข้าใจรูปภาพเริ่มต้นสำหรับสื่อขาเข้า ให้กำหนดค่า `agents.defaults.imageModel`:

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

แนะนำให้ใช้ ref เต็มรูปแบบ `ollama/<model>` หากโมเดลเดียวกันอยู่ในรายการภายใต้ `models.providers.ollama.models` พร้อม `input: ["text", "image"]` และไม่มีผู้ให้บริการรูปภาพอื่นที่กำหนดค่าไว้ expose ID โมเดลแบบ bare เดียวกัน OpenClaw จะ normalize ref `imageModel` แบบ bare เช่น `qwen2.5vl:7b` เป็น `ollama/qwen2.5vl:7b` ด้วย หากมีผู้ให้บริการรูปภาพที่กำหนดค่าไว้มากกว่าหนึ่งรายมี ID แบบ bare เดียวกัน ให้ใช้คำนำหน้าผู้ให้บริการอย่างชัดเจน

โมเดล vision ภายในเครื่องที่ช้าอาจต้องใช้ timeout สำหรับความเข้าใจรูปภาพนานกว่าโมเดล cloud นอกจากนี้ยังอาจ crash หรือหยุดทำงานเมื่อ Ollama พยายามจัดสรร vision context เต็มตามที่ประกาศไว้บนฮาร์ดแวร์ที่มีข้อจำกัด ตั้งค่า capability timeout และจำกัด `num_ctx` ในรายการโมเดลเมื่อคุณต้องการเพียงเทิร์นคำอธิบายรูปภาพปกติ:

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

timeout นี้ใช้กับความเข้าใจรูปภาพขาเข้าและเครื่องมือ `image` แบบชัดเจนที่เอเจนต์เรียกใช้ได้ระหว่างเทิร์น `models.providers.ollama.timeoutSeconds` ระดับผู้ให้บริการยังคงควบคุมตัวป้องกันคำขอ HTTP ของ Ollama ที่อยู่ข้างใต้สำหรับการเรียกโมเดลปกติ

ตรวจสอบแบบ live-verify เครื่องมือรูปภาพแบบชัดเจนกับ Ollama ภายในเครื่องด้วย:

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

OpenClaw จะปฏิเสธคำขอคำอธิบายรูปภาพสำหรับโมเดลที่ไม่ได้ทำเครื่องหมายว่ารองรับรูปภาพ เมื่อใช้การค้นพบแบบ implicit OpenClaw จะอ่านค่านี้จาก Ollama เมื่อ `/api/show` รายงาน capability ด้าน vision

## การกำหนดค่า

<Tabs>
  <Tab title="Basic (implicit discovery)">
    เส้นทางเปิดใช้งานแบบภายในเครื่องเท่านั้นที่ง่ายที่สุดคือผ่านตัวแปรสภาพแวดล้อม:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    หากตั้งค่า `OLLAMA_API_KEY` ไว้ คุณสามารถละ `apiKey` ในรายการผู้ให้บริการได้ และ OpenClaw จะเติมค่านี้สำหรับการตรวจสอบความพร้อมใช้งาน
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    ใช้การกำหนดค่าแบบชัดเจนเมื่อคุณต้องการตั้งค่า cloud แบบ hosted, Ollama รันบน host/port อื่น, ต้องการบังคับ context window หรือรายการโมเดลเฉพาะ หรือคุณต้องการนิยามโมเดลด้วยตนเองทั้งหมด

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

  <Tab title="Custom base URL">
    หาก Ollama รันบน host หรือ port อื่น (การกำหนดค่าแบบชัดเจนจะปิดใช้งานการค้นพบอัตโนมัติ ดังนั้นให้กำหนดโมเดลด้วยตนเอง):

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
    อย่าเพิ่ม `/v1` ใน URL path `/v1` ใช้โหมดที่เข้ากันได้กับ OpenAI ซึ่งการเรียกใช้เครื่องมือไม่น่าเชื่อถือ ใช้ URL ฐานของ Ollama โดยไม่มี path suffix
    </Warning>

  </Tab>
</Tabs>

## สูตรที่พบบ่อย

ใช้รายการเหล่านี้เป็นจุดเริ่มต้นและแทนที่ ID โมเดลด้วยชื่อที่ตรงจาก `ollama list` หรือ `openclaw models list --provider ollama`

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    ใช้ตัวเลือกนี้เมื่อ Ollama รันบนเครื่องเดียวกับ Gateway และคุณต้องการให้ OpenClaw ค้นพบโมเดลที่ติดตั้งไว้โดยอัตโนมัติ

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    เส้นทางนี้ทำให้การกำหนดค่าน้อยที่สุด อย่าเพิ่มบล็อก `models.providers.ollama` เว้นแต่คุณต้องการกำหนดโมเดลด้วยตนเอง

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    ใช้ URL ของ Ollama แบบ native สำหรับ host ใน LAN อย่าเพิ่ม `/v1`

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

    `contextWindow` คือ budget ของ context ฝั่ง OpenClaw `params.num_ctx` จะถูกส่งไปยัง Ollama สำหรับคำขอ จัดให้สอดคล้องกันเมื่อฮาร์ดแวร์ของคุณไม่สามารถรัน context เต็มตามที่โมเดลประกาศไว้ได้

  </Accordion>

  <Accordion title="Ollama Cloud only">
    ใช้ตัวเลือกนี้เมื่อคุณไม่ได้รัน daemon ภายในเครื่องและต้องการใช้โมเดล Ollama แบบ hosted โดยตรง

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

  <Accordion title="Cloud plus local through a signed-in daemon">
    ใช้ตัวเลือกนี้เมื่อ daemon Ollama ภายในเครื่องหรือใน LAN ได้ลงชื่อเข้าใช้ด้วย `ollama signin` และควรให้บริการทั้งโมเดลภายในเครื่องและโมเดล `:cloud`

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
    ใช้ ID ผู้ให้บริการแบบกำหนดเองเมื่อคุณมีเซิร์ฟเวอร์ Ollama มากกว่าหนึ่งเครื่อง ผู้ให้บริการแต่ละรายจะมี host, โมเดล, auth, timeout และ ref โมเดลของตนเอง

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

    เมื่อ OpenClaw ส่งคำขอ คำนำหน้าผู้ให้บริการที่ใช้งานอยู่จะถูกตัดออก ดังนั้น `ollama-large/qwen3.5:27b` จะไปถึง Ollama เป็น `qwen3.5:27b`

  </Accordion>

  <Accordion title="โปรไฟล์โมเดลภายในเครื่องแบบประหยัด">
    โมเดลภายในเครื่องบางตัวสามารถตอบพรอมป์ง่าย ๆ ได้ แต่มีปัญหากับพื้นผิวเครื่องมือตัวแทนแบบเต็มรูปแบบ ให้เริ่มด้วยการจำกัดเครื่องมือและบริบทก่อนเปลี่ยนการตั้งค่ารันไทม์ส่วนกลาง

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

    ใช้ `compat.supportsTools: false` เฉพาะเมื่อโมเดลหรือเซิร์ฟเวอร์ล้มเหลวกับสคีมาเครื่องมืออย่างสม่ำเสมอเท่านั้น ซึ่งเป็นการแลกความสามารถของตัวแทนกับเสถียรภาพ
    `localModelLean` จะลบเครื่องมือเบราว์เซอร์, cron และข้อความออกจากพื้นผิวตัวแทนโดยตรง และตั้งค่าเริ่มต้นให้แค็ตตาล็อกขนาดใหญ่อยู่หลังตัวควบคุม Tool Search แบบมีโครงสร้าง ยกเว้นเมื่อการรันต้องคงความหมายของการส่งข้อความโดยตรงไว้ แต่จะไม่เปลี่ยนบริบทรันไทม์หรือโหมดการคิดของ Ollama จับคู่กับ `params.num_ctx` และ `params.thinking: false` อย่างชัดเจนสำหรับโมเดลคิดแบบ Qwen ขนาดเล็กที่วนซ้ำหรือใช้โควตาการตอบสนองไปกับการให้เหตุผลที่ซ่อนอยู่

  </Accordion>
</AccordionGroup>

### การเลือกโมเดล

เมื่อกำหนดค่าแล้ว โมเดล Ollama ทั้งหมดของคุณจะพร้อมใช้งาน:

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

รองรับ ID ผู้ให้บริการ Ollama แบบกำหนดเองด้วย เมื่อการอ้างอิงโมเดลใช้คำนำหน้าผู้ให้บริการที่ใช้งานอยู่
เช่น `ollama-spark/qwen3:32b` OpenClaw จะตัดเฉพาะคำนำหน้านั้น
ก่อนเรียก Ollama เพื่อให้เซิร์ฟเวอร์ได้รับ `qwen3:32b`

สำหรับโมเดลภายในเครื่องที่ช้า ให้เลือกปรับแต่งคำขอในขอบเขตผู้ให้บริการก่อนเพิ่ม
เวลาหมดเวลารันไทม์ของตัวแทนทั้งหมด:

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
ส่วนหัว การสตรีมเนื้อความ และการยกเลิก guarded-fetch ทั้งหมด `params.keep_alive`
จะถูกส่งต่อไปยัง Ollama เป็น `keep_alive` ระดับบนสุดในคำขอ `/api/chat` แบบเนทีฟ
ให้ตั้งค่าต่อโมเดลเมื่อเวลาโหลดเทิร์นแรกเป็นคอขวด

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

สำหรับโฮสต์ระยะไกล ให้แทนที่ `127.0.0.1` ด้วยโฮสต์ที่ใช้ใน `baseUrl` หาก `curl` ทำงานแต่ OpenClaw ไม่ทำงาน ให้ตรวจสอบว่า Gateway ทำงานอยู่บนเครื่อง คอนเทนเนอร์ หรือบัญชีบริการอื่นหรือไม่

## Ollama Web Search

OpenClaw รองรับ **Ollama Web Search** เป็นผู้ให้บริการ `web_search` ที่รวมมาให้

| คุณสมบัติ    | รายละเอียด                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| โฮสต์        | ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้ (`models.providers.ollama.baseUrl` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `http://127.0.0.1:11434`); `https://ollama.com` ใช้ API ที่โฮสต์โดยตรง |
| การยืนยันตัวตน        | ไม่ต้องใช้คีย์สำหรับโฮสต์ Ollama ภายในเครื่องที่ลงชื่อเข้าใช้แล้ว; ใช้ `OLLAMA_API_KEY` หรือการยืนยันตัวตนผู้ให้บริการที่กำหนดค่าไว้สำหรับการค้นหา `https://ollama.com` โดยตรงหรือโฮสต์ที่ป้องกันด้วยการยืนยันตัวตน               |
| ข้อกำหนด | โฮสต์ภายในเครื่อง/โฮสต์เองต้องทำงานอยู่และลงชื่อเข้าใช้ด้วย `ollama signin`; การค้นหาที่โฮสต์โดยตรงต้องใช้ `baseUrl: "https://ollama.com"` พร้อมคีย์ Ollama API จริง |

เลือก **Ollama Web Search** ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` หรือตั้งค่า:

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

สำหรับการค้นหาที่โฮสต์โดยตรงผ่าน Ollama Cloud:

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

สำหรับดีมอนภายในเครื่องที่ลงชื่อเข้าใช้แล้ว OpenClaw จะใช้พร็อกซี `/api/experimental/web_search` ของดีมอน สำหรับ `https://ollama.com` จะเรียกปลายทาง `/api/web_search` ที่โฮสต์โดยตรง

<Note>
สำหรับรายละเอียดการตั้งค่าและพฤติกรรมทั้งหมด โปรดดู [Ollama Web Search](/th/tools/ollama-search)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเดิมที่เข้ากันได้กับ OpenAI">
    <Warning>
    **การเรียกใช้เครื่องมือไม่น่าเชื่อถือในโหมดที่เข้ากันได้กับ OpenAI** ใช้โหมดนี้เฉพาะเมื่อคุณต้องการรูปแบบ OpenAI สำหรับพร็อกซีและไม่ได้พึ่งพาพฤติกรรมการเรียกใช้เครื่องมือแบบเนทีฟ
    </Warning>

    หากคุณจำเป็นต้องใช้ปลายทางที่เข้ากันได้กับ OpenAI แทน (เช่น อยู่หลังพร็อกซีที่รองรับเฉพาะรูปแบบ OpenAI) ให้ตั้งค่า `api: "openai-completions"` อย่างชัดเจน:

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

    โหมดนี้อาจไม่รองรับการสตรีมและการเรียกใช้เครื่องมือพร้อมกัน คุณอาจต้องปิดการสตรีมด้วย `params: { streaming: false }` ในการกำหนดค่าโมเดล

    เมื่อใช้ `api: "openai-completions"` กับ Ollama OpenClaw จะฉีด `options.num_ctx` ตามค่าเริ่มต้น เพื่อให้ Ollama ไม่ย้อนกลับไปใช้หน้าต่างบริบท 4096 อย่างเงียบ ๆ หากพร็อกซี/อัปสตรีมของคุณปฏิเสธฟิลด์ `options` ที่ไม่รู้จัก ให้ปิดพฤติกรรมนี้:

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
    สำหรับโมเดลที่ค้นพบอัตโนมัติ OpenClaw จะใช้หน้าต่างบริบทที่ Ollama รายงานเมื่อมี รวมถึงค่า `PARAMETER num_ctx` ที่ใหญ่ขึ้นจาก Modelfile แบบกำหนดเอง มิฉะนั้นจะย้อนกลับไปใช้หน้าต่างบริบทเริ่มต้นของ Ollama ที่ OpenClaw ใช้

    คุณสามารถตั้งค่าเริ่มต้น `contextWindow`, `contextTokens` และ `maxTokens` ระดับผู้ให้บริการสำหรับทุกโมเดลภายใต้ผู้ให้บริการ Ollama นั้น แล้วแทนที่เป็นรายโมเดลเมื่อจำเป็น `contextWindow` คือโควตาพรอมป์และ Compaction ของ OpenClaw คำขอ Ollama แบบเนทีฟจะปล่อย `options.num_ctx` ไว้โดยไม่ตั้งค่า เว้นแต่คุณจะกำหนดค่า `params.num_ctx` อย่างชัดเจน เพื่อให้ Ollama ใช้ค่าเริ่มต้นตามโมเดลของตัวเอง, `OLLAMA_CONTEXT_LENGTH` หรือ VRAM ได้ หากต้องการจำกัดหรือบังคับบริบทรันไทม์ต่อคำขอของ Ollama โดยไม่ต้องสร้าง Modelfile ใหม่ ให้ตั้งค่า `params.num_ctx`; ค่าที่ไม่ถูกต้อง เป็นศูนย์ ติดลบ และไม่จำกัดจะถูกละเว้น หากคุณอัปเกรดการกำหนดค่าเก่าที่ใช้เฉพาะ `contextWindow` หรือ `maxTokens` เพื่อบังคับบริบทคำขอ Ollama แบบเนทีฟ ให้รัน `openclaw doctor --fix` เพื่อคัดลอกโควตาผู้ให้บริการหรือโมเดลที่ชัดเจนเหล่านั้นไปยัง `params.num_ctx` อะแดปเตอร์ Ollama ที่เข้ากันได้กับ OpenAI ยังคงฉีด `options.num_ctx` ตามค่าเริ่มต้นจาก `params.num_ctx` หรือ `contextWindow` ที่กำหนดค่าไว้; ปิดด้วย `injectNumCtxForOpenAICompat: false` หากอัปสตรีมของคุณปฏิเสธ `options`

    รายการโมเดล Ollama แบบเนทีฟยังยอมรับตัวเลือกรันไทม์ Ollama ทั่วไปภายใต้ `params` รวมถึง `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` และ `use_mmap` OpenClaw จะส่งต่อเฉพาะคีย์คำขอ Ollama ดังนั้นพารามิเตอร์รันไทม์ OpenClaw เช่น `streaming` จะไม่รั่วไปยัง Ollama ใช้ `params.think` หรือ `params.thinking` เพื่อส่ง `think` ระดับบนสุดของ Ollama; `false` จะปิดการคิดระดับ API สำหรับโมเดลคิดแบบ Qwen

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` ต่อโมเดลก็ใช้ได้เช่นกัน หากกำหนดค่าทั้งสองแบบ รายการโมเดลผู้ให้บริการที่ชัดเจนจะมีผลเหนือกว่าค่าเริ่มต้นของตัวแทน

  </Accordion>

  <Accordion title="การควบคุมการคิด">
    สำหรับโมเดล Ollama แบบเนทีฟ OpenClaw จะส่งต่อการควบคุมการคิดตามที่ Ollama คาดหวัง: `think` ระดับบนสุด ไม่ใช่ `options.think` โมเดลที่ค้นพบอัตโนมัติซึ่งการตอบกลับ `/api/show` มีความสามารถ `thinking` จะแสดง `/think low`, `/think medium`, `/think high` และ `/think max`; โมเดลที่ไม่คิดจะแสดงเฉพาะ `/think off`

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    คุณยังสามารถตั้งค่าเริ่มต้นของโมเดลได้:

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

    `params.think` หรือ `params.thinking` ต่อโมเดลสามารถปิดหรือบังคับการคิดผ่าน Ollama API สำหรับโมเดลที่กำหนดค่าไว้โดยเฉพาะ OpenClaw จะคงพารามิเตอร์โมเดลที่ชัดเจนเหล่านั้นไว้เมื่อการรันที่ใช้งานอยู่มีเพียงค่าเริ่มต้นโดยนัย `off`; คำสั่งรันไทม์ที่ไม่ใช่ off เช่น `/think medium` ยังคงแทนที่การรันที่ใช้งานอยู่

  </Accordion>

  <Accordion title="โมเดลให้เหตุผล">
    OpenClaw ถือว่าโมเดลที่มีชื่ออย่าง `deepseek-r1`, `reasoning` หรือ `think` มีความสามารถในการให้เหตุผลตามค่าเริ่มต้น

    ```bash
    ollama pull deepseek-r1:32b
    ```

    ไม่จำเป็นต้องกำหนดค่าเพิ่มเติม OpenClaw จะทำเครื่องหมายโมเดลเหล่านั้นโดยอัตโนมัติ

  </Accordion>

  <Accordion title="ค่าใช้จ่ายของโมเดล">
    Ollama ฟรีและทำงานภายในเครื่อง ดังนั้นค่าใช้จ่ายโมเดลทั้งหมดจึงถูกตั้งเป็น $0 ซึ่งใช้กับทั้งโมเดลที่ค้นพบอัตโนมัติและโมเดลที่กำหนดด้วยตนเอง
  </Accordion>

  <Accordion title="การฝังเวกเตอร์หน่วยความจำ">
    Plugin Ollama ที่รวมมาด้วยจะลงทะเบียนผู้ให้บริการการฝังเวกเตอร์หน่วยความจำสำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory) โดยใช้ URL ฐานของ Ollama
    และ API key ที่กำหนดค่าไว้ เรียก endpoint `/api/embed` ปัจจุบันของ Ollama และจัดชุด
    ชิ้นส่วนหน่วยความจำหลายรายการไว้ในคำขอ `input` เดียวเมื่อทำได้

    เมื่อ `proxy.enabled=true` คำขอฝังเวกเตอร์หน่วยความจำของ Ollama ไปยังต้นทาง
    host-local loopback ที่ตรงกันทุกประการซึ่งได้มาจาก `baseUrl` ที่กำหนดค่าไว้ จะใช้เส้นทางตรงที่มีการป้องกันของ
    OpenClaw แทน managed forward proxy ชื่อโฮสต์ที่กำหนดค่าไว้ต้องเป็น `localhost`
    หรือ IP literal แบบ loopback เองเท่านั้น ชื่อ DNS ที่เพียงแค่ resolve ไปยัง loopback
    ยังคงใช้เส้นทาง managed proxy โฮสต์ Ollama บน LAN, tailnet, เครือข่ายส่วนตัว
    และสาธารณะก็ยังคงอยู่บนเส้นทาง managed proxy เช่นกัน การเปลี่ยนเส้นทางไปยังโฮสต์หรือพอร์ตอื่น
    จะไม่สืบทอดความน่าเชื่อถือ ผู้ปฏิบัติงานยังสามารถตั้งค่า `proxy.loopbackMode: "proxy"` ระดับ global
    เพื่อส่งทราฟฟิก loopback ผ่าน proxy หรือ `proxy.loopbackMode: "block"`
    เพื่อปฏิเสธการเชื่อมต่อ loopback ก่อนเปิดการเชื่อมต่อได้ ดู
    [Managed proxy](/th/security/network-proxy#gateway-loopback-mode) สำหรับผลกระทบทั่วทั้งกระบวนการ
    ของการตั้งค่านี้

    | คุณสมบัติ      | ค่า               |
    | ------------- | ------------------- |
    | โมเดลเริ่มต้น | `nomic-embed-text`  |
    | ดึงอัตโนมัติ     | ใช่ — โมเดลฝังเวกเตอร์จะถูกดึงโดยอัตโนมัติหากยังไม่มีในเครื่อง |

    การฝังเวกเตอร์ขณะ query ใช้คำนำหน้าการดึงข้อมูลสำหรับโมเดลที่ต้องใช้หรือแนะนำให้ใช้ รวมถึง `nomic-embed-text`, `qwen3-embedding` และ `mxbai-embed-large` ชุดเอกสารหน่วยความจำจะคงเป็น raw เพื่อให้ดัชนีที่มีอยู่ไม่ต้องย้ายรูปแบบ

    หากต้องการเลือก Ollama เป็นผู้ให้บริการการฝังเวกเตอร์สำหรับการค้นหาหน่วยความจำ:

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

    สำหรับโฮสต์ฝังเวกเตอร์ระยะไกล ให้จำกัด auth ให้อยู่เฉพาะโฮสต์นั้น:

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

  <Accordion title="การกำหนดค่า Streaming">
    การผสานรวม Ollama ของ OpenClaw ใช้ **API ดั้งเดิมของ Ollama** (`/api/chat`) เป็นค่าเริ่มต้น ซึ่งรองรับทั้ง streaming และการเรียกใช้เครื่องมือพร้อมกันอย่างสมบูรณ์ ไม่จำเป็นต้องกำหนดค่าพิเศษ

    สำหรับคำขอ `/api/chat` ดั้งเดิม OpenClaw ยังส่งต่อการควบคุม thinking ไปยัง Ollama โดยตรง: `/think off` และ `openclaw agent --thinking off` จะส่ง `think: false` ระดับบนสุด เว้นแต่จะมีการกำหนดค่าโมเดล `params.think`/`params.thinking` ไว้อย่างชัดเจน ส่วน `/think low|medium|high` จะส่งสตริง effort ของ `think` ระดับบนสุดที่ตรงกัน `/think max` จะ map ไปยัง effort ดั้งเดิมสูงสุดของ Ollama คือ `think: "high"`

    <Tip>
    หากคุณต้องใช้ endpoint ที่เข้ากันได้กับ OpenAI ให้ดูส่วน "โหมดเดิมที่เข้ากันได้กับ OpenAI" ด้านบน Streaming และการเรียกใช้เครื่องมืออาจไม่ทำงานพร้อมกันในโหมดนั้น
    </Tip>

  </Accordion>
</AccordionGroup>

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="WSL2 crash loop (รีบูตซ้ำ)">
    บน WSL2 ที่ใช้ NVIDIA/CUDA ตัวติดตั้ง Ollama Linux อย่างเป็นทางการจะสร้าง systemd unit ชื่อ `ollama.service` พร้อม `Restart=always` หากบริการนั้นเริ่มอัตโนมัติและโหลดโมเดลที่ใช้ GPU ระหว่างการ boot ของ WSL2 Ollama อาจตรึงหน่วยความจำของโฮสต์ไว้ขณะโหลดโมเดล Hyper-V memory reclaim อาจไม่สามารถ reclaim หน้าเหล่านั้นที่ถูกตรึงไว้ได้เสมอ ทำให้ Windows อาจหยุด VM ของ WSL2, systemd เริ่ม Ollama อีกครั้ง และเกิดวงจรซ้ำ

    หลักฐานที่พบบ่อย:

    - WSL2 รีบูตหรือถูกหยุดซ้ำจากฝั่ง Windows
    - CPU สูงใน `app.slice` หรือ `ollama.service` ไม่นานหลังจาก WSL2 เริ่มทำงาน
    - SIGTERM จาก systemd แทนที่จะเป็นเหตุการณ์ Linux OOM-killer

    OpenClaw จะบันทึกคำเตือนตอนเริ่มต้นเมื่อพบ WSL2, `ollama.service` ที่เปิดใช้พร้อม `Restart=always` และ marker ของ CUDA ที่มองเห็นได้

    การบรรเทาปัญหา:

    ```bash
    sudo systemctl disable ollama
    ```

    เพิ่มสิ่งนี้ลงใน `%USERPROFILE%\.wslconfig` ที่ฝั่ง Windows แล้วเรียกใช้ `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    ตั้ง keep-alive ที่สั้นลงในสภาพแวดล้อมของบริการ Ollama หรือเริ่ม Ollama ด้วยตนเองเฉพาะเมื่อต้องใช้:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    ดู [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)

  </Accordion>

  <Accordion title="ตรวจไม่พบ Ollama">
    ตรวจสอบว่า Ollama กำลังทำงานอยู่ และคุณตั้งค่า `OLLAMA_API_KEY` แล้ว (หรือมีโปรไฟล์ auth) และคุณ **ไม่ได้** กำหนดรายการ `models.providers.ollama` อย่างชัดเจน:

    ```bash
    ollama serve
    ```

    ตรวจสอบว่า API เข้าถึงได้:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="ไม่มีโมเดลที่พร้อมใช้งาน">
    หากโมเดลของคุณไม่อยู่ในรายการ ให้ดึงโมเดลมาไว้ในเครื่องหรือกำหนดไว้โดยตรงใน `models.providers.ollama`

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

  <Accordion title="โฮสต์ระยะไกลใช้กับ curl ได้แต่ใช้กับ OpenClaw ไม่ได้">
    ตรวจสอบจากเครื่องและ runtime เดียวกันกับที่รัน Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    สาเหตุที่พบบ่อย:

    - `baseUrl` ชี้ไปที่ `localhost` แต่ Gateway รันอยู่ใน Docker หรือบนโฮสต์อื่น
    - URL ใช้ `/v1` ซึ่งเลือกพฤติกรรมที่เข้ากันได้กับ OpenAI แทน Ollama ดั้งเดิม
    - โฮสต์ระยะไกลต้องปรับ firewall หรือการ bind บน LAN ที่ฝั่ง Ollama
    - โมเดลมีอยู่บน daemon ของแล็ปท็อปคุณ แต่ไม่มีบน daemon ระยะไกล

  </Accordion>

  <Accordion title="โมเดลส่งออก tool JSON เป็นข้อความ">
    โดยปกติหมายความว่าผู้ให้บริการกำลังใช้โหมดที่เข้ากันได้กับ OpenAI หรือโมเดลไม่สามารถจัดการ tool schema ได้

    ควรใช้โหมด Ollama ดั้งเดิม:

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

    หากโมเดล local ขนาดเล็กยังล้มเหลวกับ tool schema ให้ตั้ง `compat.supportsTools: false` ในรายการโมเดลนั้นแล้วทดสอบใหม่

  </Accordion>

  <Accordion title="Kimi หรือ GLM ส่งคืนสัญลักษณ์อ่านไม่ออก">
    การตอบกลับ Kimi/GLM แบบ hosted ที่ยาวและเป็นชุดสัญลักษณ์ที่ไม่ใช่ภาษา จะถูกถือเป็น output ของผู้ให้บริการที่ล้มเหลว แทนที่จะเป็นคำตอบ assistant ที่สำเร็จ ซึ่งทำให้ retry, fallback หรือการจัดการข้อผิดพลาดตามปกติรับช่วงต่อได้โดยไม่บันทึกข้อความที่เสียหายลงใน session

    หากเกิดซ้ำ ให้บันทึกชื่อโมเดลดิบ ไฟล์ session ปัจจุบัน และ run นั้นใช้ `Cloud + Local` หรือ `Cloud only` จากนั้นลอง session ใหม่และโมเดล fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="โมเดล local ที่เย็นอยู่ timeout">
    โมเดล local ขนาดใหญ่อาจต้องใช้เวลานานในการโหลดครั้งแรกก่อน streaming จะเริ่ม ให้จำกัด timeout ไว้เฉพาะผู้ให้บริการ Ollama และจะขอให้ Ollama คงโมเดลไว้ในหน่วยความจำระหว่าง turn ก็ได้:

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

    หากตัวโฮสต์เองตอบรับการเชื่อมต่อช้า `timeoutSeconds` ยังขยาย guarded Undici connect timeout สำหรับผู้ให้บริการนี้ด้วย

  </Accordion>

  <Accordion title="โมเดล context ใหญ่ทำงานช้าเกินไปหรือหน่วยความจำไม่พอ">
    โมเดล Ollama จำนวนมากประกาศ context ที่ใหญ่กว่าฮาร์ดแวร์ของคุณจะรันได้อย่างสบาย Ollama ดั้งเดิมใช้ค่าเริ่มต้น context runtime ของ Ollama เอง เว้นแต่คุณจะตั้ง `params.num_ctx` จำกัดทั้ง budget ของ OpenClaw และ request context ของ Ollama เมื่อคุณต้องการ latency ของ token แรกที่คาดเดาได้:

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

    ลด `contextWindow` ก่อนหาก OpenClaw ส่ง prompt มากเกินไป ลด `params.num_ctx` หาก Ollama กำลังโหลด runtime context ที่ใหญ่เกินไปสำหรับเครื่อง ลด `maxTokens` หากการสร้างผลลัพธ์ใช้เวลานานเกินไป

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด model refs และพฤติกรรม failover
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="การค้นหาเว็บด้วย Ollama" href="/th/tools/ollama-search" icon="magnifying-glass">
    รายละเอียดการตั้งค่าและพฤติกรรมทั้งหมดสำหรับการค้นหาเว็บที่ขับเคลื่อนด้วย Ollama
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าทั้งหมด
  </Card>
</CardGroup>
