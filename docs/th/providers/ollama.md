---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw ด้วยโมเดลบนคลาวด์หรือโมเดลภายในเครื่องผ่าน Ollama
    - คุณต้องการคำแนะนำในการตั้งค่าและกำหนดค่า Ollama
    - คุณต้องการโมเดล vision ของ Ollama สำหรับการทำความเข้าใจรูปภาพ
summary: เรียกใช้ OpenClaw ด้วย Ollama (โมเดลบนคลาวด์และโมเดลภายในเครื่อง)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T10:05:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw ผสานรวมกับ API ดั้งเดิมของ Ollama (`/api/chat`) สำหรับโมเดลคลาวด์แบบโฮสต์และเซิร์ฟเวอร์ Ollama แบบ local/โฮสต์เอง คุณสามารถใช้ Ollama ได้สามโหมด: `Cloud + Local` ผ่านโฮสต์ Ollama ที่เข้าถึงได้, `Cloud only` กับ `https://ollama.com`, หรือ `Local only` กับโฮสต์ Ollama ที่เข้าถึงได้

OpenClaw ยังลงทะเบียน `ollama-cloud` เป็น id ผู้ให้บริการแบบโฮสต์ระดับ first-class สำหรับ
การใช้งาน Ollama Cloud โดยตรง ใช้ ref อย่าง `ollama-cloud/kimi-k2.5:cloud` เมื่อคุณ
ต้องการการกำหนดเส้นทางแบบคลาวด์เท่านั้นโดยไม่แชร์ id ผู้ให้บริการ `ollama` แบบ local

สำหรับหน้าการตั้งค่าเฉพาะแบบคลาวด์เท่านั้น โปรดดู [Ollama Cloud](/th/providers/ollama-cloud)

<Warning>
**ผู้ใช้ Ollama ระยะไกล**: อย่าใช้ URL ที่เข้ากันได้กับ OpenAI แบบ `/v1` (`http://host:11434/v1`) กับ OpenClaw วิธีนี้จะทำให้การเรียกเครื่องมือเสียหาย และโมเดลอาจส่งออก JSON เครื่องมือดิบเป็นข้อความธรรมดา ให้ใช้ URL API ดั้งเดิมของ Ollama แทน: `baseUrl: "http://host:11434"` (ไม่มี `/v1`)
</Warning>

การกำหนดค่า provider ของ Ollama ใช้ `baseUrl` เป็นคีย์มาตรฐาน OpenClaw ยังยอมรับ `baseURL` เพื่อความเข้ากันได้กับตัวอย่างสไตล์ OpenAI SDK แต่ config ใหม่ควรใช้ `baseUrl`

## กฎการยืนยันตัวตน

<AccordionGroup>
  <Accordion title="โฮสต์ local และ LAN">
    โฮสต์ Ollama แบบ local และ LAN ไม่จำเป็นต้องใช้ bearer token จริง OpenClaw ใช้ตัวทำเครื่องหมาย local `ollama-local` เฉพาะกับ URL ฐาน Ollama แบบ loopback, เครือข่ายส่วนตัว, `.local`, และ bare-hostname เท่านั้น
  </Accordion>
  <Accordion title="โฮสต์ระยะไกลและ Ollama Cloud">
    โฮสต์สาธารณะระยะไกลและ Ollama Cloud (`https://ollama.com`) ต้องใช้ข้อมูลรับรองจริงผ่าน `OLLAMA_API_KEY`, โปรไฟล์ auth, หรือ `apiKey` ของ provider สำหรับการใช้งานแบบโฮสต์โดยตรง ควรใช้ provider `ollama-cloud`
  </Accordion>
  <Accordion title="id provider แบบกำหนดเอง">
    id provider แบบกำหนดเองที่ตั้งค่า `api: "ollama"` จะใช้กฎเดียวกัน ตัวอย่างเช่น provider `ollama-remote` ที่ชี้ไปยังโฮสต์ Ollama ใน LAN ส่วนตัวสามารถใช้ `apiKey: "ollama-local"` และ sub-agents จะ resolve ตัวทำเครื่องหมายนั้นผ่าน hook ของ provider Ollama แทนที่จะถือว่าเป็นข้อมูลรับรองที่ขาดหาย การค้นหาหน่วยความจำยังสามารถตั้งค่า `agents.defaults.memorySearch.provider` เป็น id provider แบบกำหนดเองนั้น เพื่อให้ embeddings ใช้ endpoint Ollama ที่ตรงกัน
  </Accordion>
  <Accordion title="โปรไฟล์ auth">
    `auth-profiles.json` เก็บข้อมูลรับรองสำหรับ id provider ใส่การตั้งค่า endpoint (`baseUrl`, `api`, model ids, headers, timeouts) ไว้ใน `models.providers.<id>` ไฟล์ auth-profile แบบ flat รุ่นเก่า เช่น `{ "ollama-windows": { "apiKey": "ollama-local" } }` ไม่ใช่รูปแบบ runtime ให้รัน `openclaw doctor --fix` เพื่อเขียนใหม่เป็นโปรไฟล์ API-key มาตรฐาน `ollama-windows:default` พร้อมข้อมูลสำรอง `baseUrl` ในไฟล์นั้นเป็นสัญญาณรบกวนด้าน compatibility และควรถูกย้ายไปยัง config ของ provider
  </Accordion>
  <Accordion title="ขอบเขต embedding ของหน่วยความจำ">
    เมื่อใช้ Ollama สำหรับ memory embeddings การยืนยันตัวตนแบบ bearer จะถูกจำกัดขอบเขตไว้ที่โฮสต์ที่ประกาศไว้:

    - คีย์ระดับ provider จะถูกส่งไปยังโฮสต์ Ollama ของ provider นั้นเท่านั้น
    - `agents.*.memorySearch.remote.apiKey` จะถูกส่งไปยังโฮสต์ embedding ระยะไกลของมันเท่านั้น
    - ค่า env `OLLAMA_API_KEY` ล้วนจะถูกถือเป็นธรรมเนียมของ Ollama Cloud และโดยค่าเริ่มต้นจะไม่ถูกส่งไปยังโฮสต์ local หรือโฮสต์เอง

  </Accordion>
</AccordionGroup>

## เริ่มต้นใช้งาน

เลือกวิธีตั้งค่าและโหมดที่คุณต้องการ

<Tabs>
  <Tab title="Onboarding (แนะนำ)">
    **เหมาะสำหรับ:** เส้นทางที่เร็วที่สุดเพื่อให้การตั้งค่า Ollama cloud หรือ local ใช้งานได้

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard
        ```

        เลือก **Ollama** จากรายการ provider
      </Step>
      <Step title="เลือกโหมดของคุณ">
        - **Cloud + Local** — โฮสต์ Ollama แบบ local พร้อมโมเดลคลาวด์ที่ route ผ่านโฮสต์นั้น
        - **Cloud only** — โมเดล Ollama แบบโฮสต์ผ่าน `https://ollama.com`
        - **Local only** — เฉพาะโมเดล local

      </Step>
      <Step title="เลือกโมเดล">
        `Cloud only` จะแจ้งให้ใส่ `OLLAMA_API_KEY` และแนะนำค่าเริ่มต้นของคลาวด์แบบโฮสต์ `Cloud + Local` และ `Local only` จะถาม URL ฐานของ Ollama, ค้นพบโมเดลที่พร้อมใช้งาน, และ auto-pull โมเดล local ที่เลือกถ้ายังไม่มี เมื่อ Ollama รายงานแท็ก `:latest` ที่ติดตั้งแล้ว เช่น `gemma4:latest` การตั้งค่าจะแสดงโมเดลที่ติดตั้งนั้นเพียงครั้งเดียว แทนที่จะแสดงทั้ง `gemma4` และ `gemma4:latest` หรือ pull alias แบบ bare อีกครั้ง `Cloud + Local` ยังตรวจสอบด้วยว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้สำหรับการเข้าถึงคลาวด์แล้วหรือไม่
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### โหมด non-interactive

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

  <Tab title="การตั้งค่าด้วยตนเอง">
    **เหมาะสำหรับ:** การควบคุมการตั้งค่า cloud หรือ local อย่างเต็มที่

    <Steps>
      <Step title="เลือก cloud หรือ local">
        - **Cloud + Local**: ติดตั้ง Ollama, ลงชื่อเข้าใช้ด้วย `ollama signin`, และ route คำขอ cloud ผ่านโฮสต์นั้น
        - **Cloud only**: ใช้ `https://ollama.com` พร้อม `OLLAMA_API_KEY`
        - **Local only**: ติดตั้ง Ollama จาก [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull โมเดล local (เฉพาะ local)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="เปิดใช้ Ollama สำหรับ OpenClaw">
        สำหรับ `Cloud only` ให้ใช้ `OLLAMA_API_KEY` จริงของคุณ สำหรับการตั้งค่าที่รองรับด้วยโฮสต์ ค่า placeholder ใดก็ใช้ได้:

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

## โมเดล Cloud

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` ใช้โฮสต์ Ollama ที่เข้าถึงได้เป็นจุดควบคุมสำหรับทั้งโมเดล local และ cloud นี่คือ flow แบบ hybrid ที่ Ollama แนะนำ

    ใช้ **Cloud + Local** ระหว่างการตั้งค่า OpenClaw จะแจ้งให้ใส่ URL ฐาน Ollama, ค้นพบโมเดล local จากโฮสต์นั้น, และตรวจสอบว่าโฮสต์ลงชื่อเข้าใช้สำหรับการเข้าถึง cloud ด้วย `ollama signin` แล้วหรือไม่ เมื่อโฮสต์ลงชื่อเข้าใช้แล้ว OpenClaw ยังแนะนำค่าเริ่มต้นของ cloud แบบโฮสต์ เช่น `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, และ `glm-5.1:cloud`

    ถ้าโฮสต์ยังไม่ได้ลงชื่อเข้าใช้ OpenClaw จะคงการตั้งค่าไว้เป็น local-only จนกว่าคุณจะรัน `ollama signin`

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` ทำงานกับ API แบบโฮสต์ของ Ollama ที่ `https://ollama.com`

    ใช้ **Cloud only** ระหว่างการตั้งค่า OpenClaw จะแจ้งให้ใส่ `OLLAMA_API_KEY`, ตั้งค่า `baseUrl: "https://ollama.com"`, และ seed รายการโมเดล cloud แบบโฮสต์ เส้นทางนี้ **ไม่** ต้องใช้เซิร์ฟเวอร์ Ollama แบบ local หรือ `ollama signin`

    รายการโมเดล cloud ที่แสดงระหว่าง `openclaw onboard` จะถูกเติมแบบ live จาก `https://ollama.com/api/tags` จำกัดที่ 500 รายการ ดังนั้นตัวเลือกจะสะท้อน catalog แบบโฮสต์ปัจจุบันแทนที่จะเป็น seed แบบ static ถ้า `ollama.com` เข้าถึงไม่ได้หรือไม่ส่งคืนโมเดลในเวลาตั้งค่า OpenClaw จะ fallback ไปยังคำแนะนำที่ hardcoded ก่อนหน้าเพื่อให้ onboarding ยังเสร็จสมบูรณ์

    คุณยังสามารถกำหนดค่า cloud provider ระดับ first-class ได้โดยตรง:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    ในโหมด local-only OpenClaw จะค้นพบโมเดลจากอินสแตนซ์ Ollama ที่กำหนดค่าไว้ เส้นทางนี้มีไว้สำหรับเซิร์ฟเวอร์ Ollama แบบ local หรือโฮสต์เอง

    ปัจจุบัน OpenClaw แนะนำ `gemma4` เป็นค่าเริ่มต้นแบบ local

  </Tab>
</Tabs>

## การค้นพบโมเดล (provider โดยนัย)

เมื่อคุณตั้งค่า `OLLAMA_API_KEY` (หรือโปรไฟล์ auth) และ **ไม่ได้** กำหนด `models.providers.ollama` หรือ provider ระยะไกลแบบกำหนดเองอื่นที่มี `api: "ollama"` OpenClaw จะค้นพบโมเดลจากอินสแตนซ์ Ollama แบบ local ที่ `http://127.0.0.1:11434`

| ลักษณะการทำงาน             | รายละเอียด                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การ query catalog        | Query `/api/tags`                                                                                                                                                  |
| การตรวจจับ capability | ใช้การ lookup `/api/show` แบบ best-effort เพื่ออ่าน `contextWindow`, พารามิเตอร์ Modelfile `num_ctx` ที่ขยายแล้ว, และ capabilities รวมถึง vision/tools                       |
| โมเดล Vision        | โมเดลที่มี capability `vision` ซึ่งรายงานโดย `/api/show` จะถูกทำเครื่องหมายว่ารองรับรูปภาพ (`input: ["text", "image"]`) ดังนั้น OpenClaw จะ auto-inject รูปภาพเข้าไปใน prompt  |
| การตรวจจับ reasoning  | ใช้ capabilities จาก `/api/show` เมื่อพร้อมใช้งาน รวมถึง `thinking`; fallback ไปยัง heuristic จากชื่อโมเดล (`r1`, `reasoning`, `think`) เมื่อ Ollama ไม่ระบุ capabilities |
| ขีดจำกัด token         | ตั้งค่า `maxTokens` เป็นขีดจำกัด max-token เริ่มต้นของ Ollama ที่ OpenClaw ใช้                                                                                                |
| ค่าใช้จ่าย                | ตั้งค่า cost ทั้งหมดเป็น `0`                                                                                                                                                |

วิธีนี้หลีกเลี่ยงรายการโมเดลแบบ manual ขณะยังทำให้ catalog ตรงกับอินสแตนซ์ Ollama แบบ local คุณสามารถใช้ ref แบบเต็ม เช่น `ollama/<pulled-model>:latest` ใน local `infer model run`; OpenClaw จะ resolve โมเดลที่ติดตั้งนั้นจาก catalog live ของ Ollama โดยไม่ต้องใช้ entry `models.json` ที่เขียนด้วยมือ

สำหรับโฮสต์ Ollama ที่ลงชื่อเข้าใช้แล้ว โมเดล `:cloud` บางตัวอาจใช้งานได้ผ่าน `/api/chat`
และ `/api/show` ก่อนที่จะปรากฏใน `/api/tags` เมื่อคุณเลือก
ref แบบเต็ม `ollama/<model>:cloud` อย่างชัดเจน OpenClaw จะตรวจสอบโมเดลที่ขาดหายเฉพาะนั้นด้วย
`/api/show` และเพิ่มลงใน catalog runtime เฉพาะเมื่อ Ollama ยืนยัน metadata ของโมเดล
การพิมพ์ผิดยังคงล้มเหลวเป็นโมเดลที่ไม่รู้จัก แทนที่จะถูกสร้างโดยอัตโนมัติ

```bash
# See what models are available
ollama list
openclaw models list
```

สำหรับ smoke test การสร้างข้อความแบบแคบที่หลีกเลี่ยง surface เครื่องมือ agent เต็มรูปแบบ
ให้ใช้ local `infer model run` พร้อม ref โมเดล Ollama แบบเต็ม:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

เส้นทางนั้นยังคงใช้ provider, auth, และ transport ดั้งเดิมของ Ollama
ที่กำหนดค่าไว้ใน OpenClaw แต่จะไม่เริ่ม turn ของ chat-agent หรือโหลดบริบท MCP/tool ถ้า
สิ่งนี้สำเร็จขณะที่การตอบกลับ agent ปกติล้มเหลว ให้ troubleshoot ความจุด้าน
prompt/tool ของ agent ของโมเดลเป็นลำดับถัดไป

สำหรับ smoke test โมเดล vision แบบแคบบนเส้นทาง lean เดียวกัน ให้เพิ่มไฟล์รูปภาพหนึ่งไฟล์หรือมากกว่า
ไปยัง `infer model run` วิธีนี้จะส่ง prompt และรูปภาพโดยตรงไปยัง
โมเดล vision ของ Ollama ที่เลือก โดยไม่โหลด chat tools, memory, หรือบริบท
session ก่อนหน้า:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` ยอมรับไฟล์ที่ตรวจพบเป็น `image/*` รวมถึงอินพุต PNG,
JPEG และ WebP ทั่วไป ไฟล์ที่ไม่ใช่ภาพจะถูกปฏิเสธก่อนเรียก Ollama
สำหรับการรู้จำเสียง ให้ใช้ `openclaw infer audio transcribe` แทน

เมื่อคุณสลับการสนทนาด้วย `/model ollama/<model>` OpenClaw จะถือว่า
นั่นเป็นการเลือกของผู้ใช้อย่างเจาะจง หาก Ollama `baseUrl` ที่กำหนดค่าไว้
เข้าถึงไม่ได้ การตอบกลับถัดไปจะล้มเหลวด้วยข้อผิดพลาดของผู้ให้บริการแทนที่จะ
ตอบจากโมเดลสำรองอื่นที่กำหนดค่าไว้โดยเงียบๆ

งาน cron แบบแยกส่วนจะทำการตรวจสอบความปลอดภัยภายในเครื่องเพิ่มอีกหนึ่งครั้งก่อนเริ่มเทิร์นของเอเจนต์
หากโมเดลที่เลือก resolve ไปยังผู้ให้บริการ Ollama แบบ local, เครือข่ายส่วนตัว หรือ `.local`
และเข้าถึง `/api/tags` ไม่ได้ OpenClaw จะบันทึกการรัน cron นั้น
เป็น `skipped` พร้อม `ollama/<model>` ที่เลือกไว้ในข้อความข้อผิดพลาด ปลายทาง
preflight จะถูกแคชไว้ 5 นาที ดังนั้นงาน cron หลายงานที่ชี้ไปยัง
daemon Ollama ตัวเดียวกันที่หยุดอยู่จะไม่เปิดคำขอโมเดลที่ล้มเหลวทั้งหมด

ตรวจสอบแบบสดสำหรับเส้นทางข้อความภายในเครื่อง เส้นทางสตรีม native และ embeddings กับ
Ollama ภายในเครื่องด้วย:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

สำหรับการทดสอบ smoke ของ Ollama Cloud API key ให้ชี้การทดสอบสดไปที่ `https://ollama.com`
และเลือกโมเดล hosted จากแคตตาล็อกปัจจุบัน:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

smoke บนคลาวด์จะรันข้อความ สตรีม native และการค้นหาเว็บ โดยจะข้าม embeddings
เป็นค่าเริ่มต้นสำหรับ `https://ollama.com` เพราะ Ollama Cloud API keys อาจไม่มีสิทธิ์
สำหรับ `/api/embed` ตั้งค่า `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` เมื่อคุณต้องการอย่างชัดเจน
ให้การทดสอบสดล้มเหลวหากคีย์คลาวด์ที่กำหนดค่าไว้ใช้ปลายทาง embed ไม่ได้

หากต้องการเพิ่มโมเดลใหม่ เพียง pull ด้วย Ollama:

```bash
ollama pull mistral
```

โมเดลใหม่จะถูกค้นพบโดยอัตโนมัติและพร้อมใช้งาน

<Note>
หากคุณตั้งค่า `models.providers.ollama` อย่างชัดเจน หรือกำหนดค่าผู้ให้บริการ remote แบบกำหนดเอง เช่น `models.providers.ollama-cloud` พร้อม `api: "ollama"` การค้นพบอัตโนมัติจะถูกข้าม และคุณต้องกำหนดโมเดลเอง ผู้ให้บริการกำหนดเองแบบ loopback เช่น `http://127.0.0.2:11434` จะยังถือว่าเป็น local ดูส่วนการกำหนดค่าแบบชัดเจนด้านล่าง
</Note>

## การอนุมานภายใน Node

เอเจนต์สามารถมอบหมายงานสั้นๆ ให้กับโมเดล Ollama ที่ติดตั้งบน desktop หรือ server node
ที่จับคู่ไว้ prompt และ response จะข้ามการเชื่อมต่อ Gateway/node ที่ผ่านการยืนยันตัวตนแล้ว
ที่มีอยู่; คำขอโมเดลจะรันบน node ที่เลือกกับปลายทาง Ollama แบบ loopback มาตรฐาน
ของ node นั้น (`http://127.0.0.1:11434`)

<Steps>
  <Step title="เริ่ม Ollama บน node">
    Pull โมเดลแชตอย่างน้อยหนึ่งตัวและให้ Ollama ทำงานอยู่:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="เชื่อมต่อโฮสต์ node">
    บนเครื่องเดียวกับ Ollama ให้เชื่อมต่อโฮสต์ node กับ Gateway:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    อนุมัติอุปกรณ์ใหม่และคำสั่ง node ที่ประกาศไว้บนโฮสต์ Gateway
    จากนั้นตรวจสอบ node:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    การเชื่อมต่อครั้งแรกและการอัปเกรดที่เพิ่มคำสั่ง Ollama ทั้งคู่สามารถ
    ทริกเกอร์การอนุมัติคำสั่ง node ได้ หาก node เชื่อมต่อโดยไม่โฆษณา
    `ollama.models` และ `ollama.chat` ให้ตรวจสอบ `openclaw nodes pending` อีกครั้ง

  </Step>
  <Step title="ขอให้เอเจนต์ใช้การอนุมานภายในเครื่อง">
    Plugin Ollama ที่รวมมาด้วยจะเปิดเผยเครื่องมือ `node_inference` เอเจนต์จะ
    ใช้ `action: "discover"` ก่อน จากนั้นใช้ `action: "run"` พร้อม node และ
    โมเดลที่ส่งคืนมา หากมี node ที่มีความสามารถเชื่อมต่ออยู่เพียงหนึ่งตัว `run` สามารถละ node ได้

    ตัวอย่างเช่น: “ค้นพบโมเดล Ollama บน node ของฉัน จากนั้นใช้โมเดลที่โหลดอยู่ที่เร็วที่สุด
    เพื่อสรุปข้อความนี้”

  </Step>
</Steps>

Discovery จะอ่าน `/api/tags` ตรวจสอบความสามารถของ `/api/show` และใช้ `/api/ps`
เมื่อมีให้ใช้ เพื่อจัดอันดับโมเดลที่โหลดอยู่แล้วก่อน โดยจะส่งคืนเฉพาะโมเดลแชตภายในเครื่อง
ที่ใช้งานได้: แถว Ollama Cloud และโมเดลแบบ embedding-only จะถูกตัดออก
การรันแต่ละครั้งจะขอให้ Ollama ปิดการคิดของโมเดลและจำกัดเอาต์พุตไว้ที่ 512 tokens
เว้นแต่การเรียกเครื่องมือจะขอค่า `maxTokens` อื่น โมเดลบางตัว เช่น
GPT-OSS ไม่รองรับการปิดการคิดและอาจยังใช้ reasoning tokens

หากต้องการให้ Ollama ทำงานบน node โดยไม่ทำให้เอเจนต์ใช้ได้ ให้ตั้งค่า
ต่อไปนี้ในการกำหนดค่าที่โฮสต์ node นั้นใช้:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

หาก node ใช้คำสั่ง foreground `openclaw node run` จากการตั้งค่า
ด้านบน ให้หยุด process นั้นแล้วรันคำสั่งอีกครั้ง หากใช้บริการ node ที่ติดตั้งไว้
ให้รัน `openclaw node restart`

node จะหยุดโฆษณา `ollama.models` และ `ollama.chat`; Ollama เองและ
ผู้ให้บริการ Ollama ของ Gateway จะไม่เปลี่ยนแปลง ตั้งค่าเป็น `true` และ
รีสตาร์ท node เพื่อโฆษณาการอนุมานภายในเครื่องอีกครั้ง พื้นผิวคำสั่งที่เปลี่ยนไป
อาจต้องได้รับการอนุมัติผ่าน `openclaw nodes pending` หลังเชื่อมต่อใหม่

คุณสามารถตรวจสอบคำสั่ง node เดียวกันโดยไม่ต้องมีเทิร์นของเอเจนต์:

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

การอนุมานภายใน Node ตั้งใจไม่ใช้ `models.providers.ollama.baseUrl` แบบ remote หรือ cloud
ซ้ำ ให้เริ่ม Ollama บนปลายทาง loopback มาตรฐานของ node คำสั่ง node
พร้อมใช้งานตามค่าเริ่มต้นบนโฮสต์ node macOS, Linux และ Windows และยังอยู่ภายใต้
นโยบายการจับคู่ node และคำสั่งตามปกติ

## วิชันและคำอธิบายภาพ

Plugin Ollama ที่รวมมาด้วยจะลงทะเบียน Ollama เป็นผู้ให้บริการทำความเข้าใจสื่อที่รองรับภาพ ซึ่งทำให้ OpenClaw route คำขออธิบายภาพอย่างชัดเจนและค่าเริ่มต้นของ image-model ที่กำหนดค่าไว้ผ่านโมเดลวิชัน Ollama แบบ local หรือ hosted ได้

สำหรับวิชันภายในเครื่อง ให้ pull โมเดลที่รองรับภาพ:

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

`--model` ต้องเป็น ref แบบเต็ม `<provider/model>` เมื่อตั้งค่านี้ `openclaw infer image describe` จะลองโมเดลนั้นก่อน แทนที่จะข้ามคำอธิบายเพราะโมเดลรองรับวิชัน native หากการเรียกโมเดลล้มเหลว OpenClaw สามารถดำเนินต่อผ่าน `agents.defaults.imageModel.fallbacks` ที่กำหนดค่าไว้ได้; ข้อผิดพลาดในการเตรียมไฟล์หรือ URL จะยังล้มเหลวก่อนการลอง fallback

ใช้ `infer image describe` เมื่อคุณต้องการ flow ผู้ให้บริการทำความเข้าใจภาพของ OpenClaw, `agents.defaults.imageModel` ที่กำหนดค่าไว้ และรูปแบบเอาต์พุตคำอธิบายภาพ ใช้ `infer model run --file` เมื่อคุณต้องการ probe โมเดล multimodal แบบ raw พร้อม prompt กำหนดเองและภาพหนึ่งภาพหรือมากกว่า

หากต้องการให้ Ollama เป็นโมเดลทำความเข้าใจภาพเริ่มต้นสำหรับสื่อขาเข้า ให้กำหนดค่า `agents.defaults.imageModel`:

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

ควรใช้ ref แบบเต็ม `ollama/<model>` หากโมเดลเดียวกันถูกระบุไว้ใต้ `models.providers.ollama.models` พร้อม `input: ["text", "image"]` และไม่มีผู้ให้บริการภาพที่กำหนดค่าไว้อื่นเปิดเผย bare model ID เดียวกัน OpenClaw จะ normalize ref `imageModel` แบบ bare เช่น `qwen2.5vl:7b` เป็น `ollama/qwen2.5vl:7b` ด้วย หากมีผู้ให้บริการภาพที่กำหนดค่าไว้มากกว่าหนึ่งรายมี bare ID เดียวกัน ให้ใช้คำนำหน้าผู้ให้บริการอย่างชัดเจน

โมเดลวิชัน local ที่ช้าอาจต้องใช้ timeout การทำความเข้าใจภาพนานกว่าโมเดล cloud นอกจากนี้ยังอาจ crash หรือหยุดเมื่อ Ollama พยายามจัดสรรบริบทวิชันที่ประกาศไว้เต็มบนฮาร์ดแวร์ที่มีข้อจำกัด ตั้งค่า capability timeout และจำกัด `num_ctx` บนรายการโมเดลเมื่อคุณต้องการเพียงเทิร์นคำอธิบายภาพตามปกติ:

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

timeout นี้ใช้กับการทำความเข้าใจภาพขาเข้าและกับเครื่องมือ `image` แบบชัดเจนที่เอเจนต์สามารถเรียกระหว่างเทิร์นได้ `models.providers.ollama.timeoutSeconds` ระดับผู้ให้บริการยังควบคุม guard คำขอ HTTP ของ Ollama พื้นฐานสำหรับการเรียกโมเดลปกติ

ตรวจสอบแบบสดสำหรับเครื่องมือภาพแบบชัดเจนกับ Ollama ภายในเครื่องด้วย:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

หากคุณกำหนด `models.providers.ollama.models` เอง ให้ทำเครื่องหมายโมเดลวิชันว่ารองรับอินพุตภาพ:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw จะปฏิเสธคำขอคำอธิบายภาพสำหรับโมเดลที่ไม่ได้ทำเครื่องหมายว่ารองรับภาพ เมื่อใช้การค้นพบโดยนัย OpenClaw จะอ่านค่านี้จาก Ollama เมื่อ `/api/show` รายงาน capability ด้านวิชัน

## การกำหนดค่า

<Tabs>
  <Tab title="พื้นฐาน (การค้นพบโดยนัย)">
    เส้นทางเปิดใช้งานแบบ local-only ที่ง่ายที่สุดคือผ่านตัวแปรสภาพแวดล้อม:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    หากตั้งค่า `OLLAMA_API_KEY` แล้ว คุณสามารถละ `apiKey` ในรายการผู้ให้บริการได้ และ OpenClaw จะเติมให้สำหรับการตรวจสอบความพร้อมใช้งาน
    </Tip>

  </Tab>

  <Tab title="ชัดเจน (โมเดลแบบกำหนดเอง)">
    ใช้การกำหนดค่าแบบชัดเจนเมื่อคุณต้องการตั้งค่า hosted cloud, Ollama ทำงานบนโฮสต์/พอร์ตอื่น, ต้องการบังคับ context windows หรือรายการโมเดลเฉพาะ, หรือต้องการคำจำกัดความโมเดลแบบ manual ทั้งหมด

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
    หาก Ollama ทำงานบนโฮสต์หรือพอร์ตอื่น (การกำหนดค่าแบบชัดเจนจะปิดการค้นพบอัตโนมัติ ดังนั้นให้กำหนดโมเดลเอง):

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
    อย่าเพิ่ม `/v1` ลงใน URL path `/v1` ใช้โหมดที่เข้ากันได้กับ OpenAI ซึ่งการเรียกเครื่องมือไม่น่าเชื่อถือ ให้ใช้ URL ฐานของ Ollama โดยไม่มี path suffix
    </Warning>

  </Tab>
</Tabs>

## สูตรทั่วไป

ใช้รายการเหล่านี้เป็นจุดเริ่มต้น และแทนที่ ID โมเดลด้วยชื่อที่ตรงกันจาก `ollama list` หรือ `openclaw models list --provider ollama`

<AccordionGroup>
  <Accordion title="โมเดลภายในเครื่องพร้อมการค้นพบอัตโนมัติ">
    ใช้วิธีนี้เมื่อ Ollama รันอยู่บนเครื่องเดียวกับ Gateway และคุณต้องการให้ OpenClaw ค้นพบโมเดลที่ติดตั้งไว้โดยอัตโนมัติ

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    เส้นทางนี้ทำให้การกำหนดค่าน้อยที่สุด อย่าเพิ่มบล็อก `models.providers.ollama` เว้นแต่คุณต้องการกำหนดโมเดลด้วยตนเอง

  </Accordion>

  <Accordion title="โฮสต์ Ollama บน LAN พร้อมโมเดลแบบกำหนดเอง">
    ใช้ URL Ollama แบบเนทีฟสำหรับโฮสต์ LAN อย่าเพิ่ม `/v1`

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

    `contextWindow` คือโควตาบริบทฝั่ง OpenClaw ส่วน `params.num_ctx` จะถูกส่งไปยัง Ollama สำหรับคำขอ ให้ทั้งสองค่านี้สอดคล้องกันเมื่อฮาร์ดแวร์ของคุณไม่สามารถรันบริบทเต็มตามที่โมเดลประกาศไว้ได้

  </Accordion>

  <Accordion title="Ollama Cloud เท่านั้น">
    ใช้วิธีนี้เมื่อคุณไม่ได้รันดีมอนภายในเครื่อง และต้องการใช้โมเดล Ollama แบบโฮสต์โดยตรง

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

  <Accordion title="Cloud พร้อมภายในเครื่องผ่านดีมอนที่ลงชื่อเข้าใช้แล้ว">
    ใช้วิธีนี้เมื่อดีมอน Ollama ภายในเครื่องหรือบน LAN ลงชื่อเข้าใช้ด้วย `ollama signin` แล้ว และควรให้บริการทั้งโมเดลภายในเครื่องและโมเดล `:cloud`

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
    ใช้ ID ผู้ให้บริการแบบกำหนดเองเมื่อคุณมีเซิร์ฟเวอร์ Ollama มากกว่าหนึ่งรายการ ผู้ให้บริการแต่ละรายการมีโฮสต์ โมเดล การตรวจสอบสิทธิ์ ค่า timeout และการอ้างอิงโมเดลของตนเอง

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

  <Accordion title="โปรไฟล์โมเดลภายในเครื่องแบบเบา">
    โมเดลภายในเครื่องบางตัวสามารถตอบพรอมป์ง่าย ๆ ได้ แต่ทำงานกับพื้นผิวเครื่องมือเอเจนต์แบบเต็มได้ยาก เริ่มจากการจำกัดเครื่องมือและบริบทก่อนเปลี่ยนการตั้งค่ารันไทม์ส่วนกลาง

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

    ใช้ `compat.supportsTools: false` เฉพาะเมื่อโมเดลหรือเซิร์ฟเวอร์ล้มเหลวกับสคีมาเครื่องมืออย่างสม่ำเสมอ ตัวเลือกนี้แลกความสามารถของเอเจนต์กับความเสถียร
    `localModelLean` จะนำเบราว์เซอร์, cron และเครื่องมือข้อความออกจากพื้นผิวเอเจนต์โดยตรง และตั้งค่าเริ่มต้นให้แค็ตตาล็อกขนาดใหญ่กว่าอยู่หลังตัวควบคุม Tool Search แบบมีโครงสร้าง ยกเว้นเมื่อการรันต้องคงความหมายของการส่งข้อความโดยตรงไว้ แต่จะไม่เปลี่ยนบริบทรันไทม์หรือโหมดคิดของ Ollama จับคู่ตัวเลือกนี้กับ `params.num_ctx` และ `params.thinking: false` ที่ระบุชัดเจนสำหรับโมเดลคิดแบบ Qwen ขนาดเล็กที่วนซ้ำหรือใช้โควตาการตอบกับการให้เหตุผลที่ซ่อนอยู่

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

รองรับ ID ผู้ให้บริการ Ollama แบบกำหนดเองด้วย เมื่อการอ้างอิงโมเดลใช้คำนำหน้าผู้ให้บริการที่ใช้งานอยู่ เช่น `ollama-spark/qwen3:32b` OpenClaw จะตัดเฉพาะคำนำหน้านั้นออกก่อนเรียก Ollama เพื่อให้เซิร์ฟเวอร์ได้รับ `qwen3:32b`

สำหรับโมเดลภายในเครื่องที่ช้า ให้ปรับแต่งคำขอในขอบเขตผู้ให้บริการก่อนเพิ่ม timeout ของรันไทม์เอเจนต์ทั้งหมด:

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

`timeoutSeconds` ใช้กับคำขอ HTTP ของโมเดล รวมถึงการตั้งค่าการเชื่อมต่อ headers การสตรีม body และการยกเลิก guarded-fetch ทั้งหมด `params.keep_alive` จะถูกส่งต่อไปยัง Ollama เป็น `keep_alive` ระดับบนสุดในคำขอ `/api/chat` แบบเนทีฟ ให้ตั้งค่าต่อโมเดลเมื่อเวลาโหลดรอบแรกคือคอขวด

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

สำหรับโฮสต์ระยะไกล ให้แทนที่ `127.0.0.1` ด้วยโฮสต์ที่ใช้ใน `baseUrl` หาก `curl` ทำงานแต่ OpenClaw ไม่ทำงาน ให้ตรวจสอบว่า Gateway รันอยู่บนเครื่อง คอนเทนเนอร์ หรือบัญชีบริการอื่นหรือไม่

## Ollama Web Search

OpenClaw รองรับ **Ollama Web Search** เป็นผู้ให้บริการ `web_search` ที่รวมมาให้

| คุณสมบัติ | รายละเอียด                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| โฮสต์        | ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้ (`models.providers.ollama.baseUrl` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `http://127.0.0.1:11434`); `https://ollama.com` ใช้ API แบบโฮสต์โดยตรง |
| การตรวจสอบสิทธิ์        | ไม่ต้องใช้คีย์สำหรับโฮสต์ Ollama ภายในเครื่องที่ลงชื่อเข้าใช้แล้ว; ใช้ `OLLAMA_API_KEY` หรือการตรวจสอบสิทธิ์ผู้ให้บริการที่กำหนดค่าไว้สำหรับการค้นหาโดยตรงผ่าน `https://ollama.com` หรือโฮสต์ที่ป้องกันด้วยการตรวจสอบสิทธิ์               |
| ข้อกำหนด | โฮสต์ภายในเครื่องหรือโฮสต์เองต้องกำลังรันและลงชื่อเข้าใช้ด้วย `ollama signin`; การค้นหาแบบโฮสต์โดยตรงต้องใช้ `baseUrl: "https://ollama.com"` พร้อมคีย์ Ollama API จริง |

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

สำหรับการค้นหาแบบโฮสต์โดยตรงผ่าน Ollama Cloud:

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

สำหรับดีมอนภายในเครื่องที่ลงชื่อเข้าใช้แล้ว OpenClaw ใช้พร็อกซี `/api/experimental/web_search` ของดีมอน สำหรับ `https://ollama.com` จะเรียก endpoint `/api/web_search` แบบโฮสต์โดยตรง

<Note>
สำหรับรายละเอียดการตั้งค่าและพฤติกรรมทั้งหมด โปรดดู [Ollama Web Search](/th/tools/ollama-search)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเดิมที่เข้ากันได้กับ OpenAI">
    <Warning>
    **การเรียกเครื่องมือไม่น่าเชื่อถือในโหมดที่เข้ากันได้กับ OpenAI** ใช้โหมดนี้เฉพาะเมื่อคุณต้องการรูปแบบ OpenAI สำหรับพร็อกซีและไม่ได้พึ่งพาพฤติกรรมการเรียกเครื่องมือแบบเนทีฟ
    </Warning>

    หากคุณจำเป็นต้องใช้ endpoint ที่เข้ากันได้กับ OpenAI แทน เช่น อยู่หลังพร็อกซีที่รองรับเฉพาะรูปแบบ OpenAI ให้ตั้งค่า `api: "openai-completions"` อย่างชัดเจน:

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

    โหมดนี้อาจไม่รองรับการสตรีมและการเรียกเครื่องมือพร้อมกัน คุณอาจต้องปิดการสตรีมด้วย `params: { streaming: false }` ในการกำหนดค่าโมเดล

    เมื่อใช้ `api: "openai-completions"` กับ Ollama OpenClaw จะฉีด `options.num_ctx` ตามค่าเริ่มต้น เพื่อให้ Ollama ไม่ย้อนกลับไปใช้ context window 4096 อย่างเงียบ ๆ หากพร็อกซีหรือ upstream ของคุณปฏิเสธฟิลด์ `options` ที่ไม่รู้จัก ให้ปิดพฤติกรรมนี้:

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
    สำหรับโมเดลที่ค้นพบอัตโนมัติ OpenClaw ใช้ context window ที่ Ollama รายงานเมื่อมี รวมถึงค่า `PARAMETER num_ctx` ที่ใหญ่กว่าจาก Modelfile แบบกำหนดเอง มิฉะนั้นจะย้อนกลับไปใช้ context window เริ่มต้นของ Ollama ที่ OpenClaw ใช้

    คุณสามารถตั้งค่าดีฟอลต์ระดับผู้ให้บริการ `contextWindow`, `contextTokens` และ `maxTokens` สำหรับทุกโมเดลภายใต้ผู้ให้บริการ Ollama นั้น แล้วค่อย override เป็นรายโมเดลเมื่อจำเป็นได้ `contextWindow` คือ budget สำหรับ prompt และ Compaction ของ OpenClaw คำขอ Ollama แบบ native จะปล่อย `options.num_ctx` ไว้โดยไม่ตั้งค่า เว้นแต่คุณจะกำหนดค่า `params.num_ctx` อย่างชัดเจน เพื่อให้ Ollama ใช้ดีฟอลต์ของโมเดลเอง, `OLLAMA_CONTEXT_LENGTH` หรือดีฟอลต์ตาม VRAM ได้ หากต้องการจำกัดหรือบังคับ runtime context ต่อคำขอของ Ollama โดยไม่ต้อง rebuild Modelfile ให้ตั้งค่า `params.num_ctx`; ค่าที่ไม่ถูกต้อง เป็นศูนย์ ติดลบ และไม่เป็นค่าจำกัดจะถูกละเว้น หากคุณอัปเกรด config เก่าที่ใช้เฉพาะ `contextWindow` หรือ `maxTokens` เพื่อบังคับ context ของคำขอ Ollama แบบ native ให้รัน `openclaw doctor --fix` เพื่อคัดลอก budget ระดับผู้ให้บริการหรือโมเดลที่ตั้งไว้อย่างชัดเจนเหล่านั้นไปยัง `params.num_ctx` adapter Ollama แบบเข้ากันได้กับ OpenAI ยังคง inject `options.num_ctx` ตามดีฟอลต์จาก `params.num_ctx` หรือ `contextWindow` ที่กำหนดค่าไว้; ปิดการทำงานนี้ด้วย `injectNumCtxForOpenAICompat: false` หาก upstream ของคุณปฏิเสธ `options`

    รายการโมเดล Ollama แบบ native ยังรับตัวเลือก runtime ทั่วไปของ Ollama ภายใต้ `params` ด้วย รวมถึง `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` และ `use_mmap` OpenClaw forward เฉพาะ key ของคำขอ Ollama ดังนั้น runtime params ของ OpenClaw เช่น `streaming` จะไม่รั่วไปยัง Ollama ใช้ `params.think` หรือ `params.thinking` เพื่อส่ง `think` ระดับบนสุดของ Ollama; `false` จะปิดการคิดระดับ API สำหรับโมเดล thinking แบบ Qwen

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` รายโมเดลก็ใช้ได้เช่นกัน หากกำหนดค่าทั้งสองที่ รายการโมเดลระดับผู้ให้บริการที่ระบุอย่างชัดเจนจะชนะดีฟอลต์ของ agent

  </Accordion>

  <Accordion title="การควบคุมการคิด">
    สำหรับโมเดล Ollama แบบ native OpenClaw จะ forward การควบคุมการคิดตามที่ Ollama คาดไว้: `think` ระดับบนสุด ไม่ใช่ `options.think` โมเดลที่ค้นพบอัตโนมัติซึ่ง response `/api/show` มี capability `thinking` จะแสดง `/think low`, `/think medium`, `/think high` และ `/think max`; โมเดลที่ไม่ใช่ thinking จะแสดงเฉพาะ `/think off`

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    คุณยังตั้งค่าดีฟอลต์ของโมเดลได้ด้วย:

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

    `params.think` หรือ `params.thinking` รายโมเดลสามารถปิดหรือบังคับการคิดของ Ollama API สำหรับโมเดลที่กำหนดค่าไว้เฉพาะได้ OpenClaw จะคง model params ที่ตั้งไว้อย่างชัดเจนเหล่านั้นไว้เมื่อ run ที่ใช้งานอยู่มีเพียงดีฟอลต์โดยนัย `off`; คำสั่ง runtime ที่ไม่ใช่ off เช่น `/think medium` ยังคง override run ที่ใช้งานอยู่

  </Accordion>

  <Accordion title="โมเดลให้เหตุผล">
    OpenClaw ถือว่าโมเดลที่มีชื่ออย่าง `deepseek-r1`, `reasoning` หรือ `think` มีความสามารถด้าน reasoning โดยดีฟอลต์

    ```bash
    ollama pull deepseek-r1:32b
    ```

    ไม่จำเป็นต้องกำหนดค่าเพิ่มเติม OpenClaw จะทำเครื่องหมายให้โดยอัตโนมัติ

  </Accordion>

  <Accordion title="ต้นทุนโมเดล">
    Ollama ใช้งานฟรีและรันในเครื่อง ดังนั้นต้นทุนโมเดลทั้งหมดจึงตั้งเป็น $0 สิ่งนี้ใช้กับทั้งโมเดลที่ค้นพบอัตโนมัติและโมเดลที่กำหนดเองด้วยมือ
  </Accordion>

  <Accordion title="Memory embeddings">
    Plugin Ollama ที่รวมมาให้ลงทะเบียนผู้ให้บริการ memory embedding สำหรับ
    [การค้นหา memory](/th/concepts/memory) โดยใช้ base URL ของ Ollama
    และ API key ที่กำหนดค่าไว้ เรียก endpoint `/api/embed` ปัจจุบันของ Ollama และจัดกลุ่ม
    memory chunk หลายรายการเป็นคำขอ `input` เดียวเมื่อทำได้

    เมื่อ `proxy.enabled=true` คำขอ memory embedding ของ Ollama ไปยัง
    origin host-local loopback ที่ตรงกันทุกประการซึ่งได้มาจาก `baseUrl` ที่กำหนดไว้ จะใช้
    guarded direct path ของ OpenClaw แทน managed forward proxy
    hostname ที่กำหนดค่าต้องเป็น `localhost` หรือ loopback IP literal เองเท่านั้น;
    ชื่อ DNS ที่เพียง resolve ไปยัง loopback ยังคงใช้ managed proxy path
    host Ollama บน LAN, tailnet, private-network และ public ก็ยังคงอยู่บน
    managed proxy path เช่นกัน redirect ไปยัง host หรือ port อื่นจะไม่สืบทอด trust
    ผู้ดูแลระบบยังสามารถตั้งค่า global `proxy.loopbackMode: "proxy"` เพื่อ
    ส่ง traffic loopback ผ่าน proxy หรือ `proxy.loopbackMode: "block"`
    เพื่อปฏิเสธการเชื่อมต่อ loopback ก่อนเปิดการเชื่อมต่อ; ดู
    [Managed proxy](/th/security/network-proxy#gateway-loopback-mode) สำหรับ
    ผลระดับทั้ง process ของการตั้งค่านี้

    | คุณสมบัติ      | ค่า               |
    | ------------- | ------------------- |
    | โมเดลดีฟอลต์ | `nomic-embed-text`  |
    | ดึงอัตโนมัติ     | ใช่ — โมเดล embedding จะถูกดึงโดยอัตโนมัติหากยังไม่มีในเครื่อง |

    embeddings ขณะ query ใช้ prefix สำหรับ retrieval กับโมเดลที่ต้องใช้หรือแนะนำให้ใช้ รวมถึง `nomic-embed-text`, `qwen3-embedding` และ `mxbai-embed-large` batch เอกสาร memory จะคงเป็น raw เพื่อให้ index ที่มีอยู่ไม่ต้อง migration รูปแบบ

    หากต้องการเลือก Ollama เป็นผู้ให้บริการ embedding สำหรับการค้นหา memory:

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

    สำหรับ host embedding ระยะไกล ให้จำกัด auth ไว้กับ host นั้น:

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
    การผสานรวม Ollama ของ OpenClaw ใช้ **Ollama API แบบ native** (`/api/chat`) เป็นดีฟอลต์ ซึ่งรองรับ streaming และ tool calling พร้อมกันได้อย่างสมบูรณ์ ไม่จำเป็นต้องกำหนดค่าพิเศษ

    สำหรับคำขอ `/api/chat` แบบ native OpenClaw ยัง forward การควบคุมการคิดไปยัง Ollama โดยตรงด้วย: `/think off` และ `openclaw agent --thinking off` จะส่ง `think: false` ระดับบนสุด เว้นแต่จะกำหนดค่า model `params.think`/`params.thinking` ไว้อย่างชัดเจน ส่วน `/think low|medium|high` จะส่ง string effort ของ `think` ระดับบนสุดที่ตรงกัน `/think max` จะ map ไปยัง effort แบบ native สูงสุดของ Ollama คือ `think: "high"`

    <Tip>
    หากคุณจำเป็นต้องใช้ endpoint ที่เข้ากันได้กับ OpenAI ให้ดูส่วน "โหมดเข้ากันได้กับ OpenAI แบบเดิม" ด้านบน Streaming และ tool calling อาจใช้งานพร้อมกันไม่ได้ในโหมดนั้น
    </Tip>

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    บน WSL2 ที่มี NVIDIA/CUDA ตัวติดตั้ง Ollama Linux อย่างเป็นทางการจะสร้าง systemd unit `ollama.service` พร้อม `Restart=always` หาก service นั้น autostart และโหลดโมเดลที่ใช้ GPU ระหว่าง boot ของ WSL2 Ollama อาจ pin memory ของ host ระหว่างโหลดโมเดล Hyper-V memory reclaim อาจไม่สามารถ reclaim page ที่ถูก pin เหล่านั้นได้เสมอไป ทำให้ Windows terminate VM ของ WSL2, systemd เริ่ม Ollama อีกครั้ง และ loop ก็เกิดซ้ำ

    หลักฐานที่พบบ่อย:

    - WSL2 reboot หรือ terminate ซ้ำจากฝั่ง Windows
    - CPU สูงใน `app.slice` หรือ `ollama.service` ไม่นานหลัง WSL2 startup
    - SIGTERM จาก systemd แทนที่จะเป็น event Linux OOM-killer

    OpenClaw จะบันทึก startup warning เมื่อตรวจพบ WSL2, เปิดใช้ `ollama.service` พร้อม `Restart=always` และเห็น marker ของ CUDA

    การบรรเทา:

    ```bash
    sudo systemctl disable ollama
    ```

    เพิ่มสิ่งนี้ลงใน `%USERPROFILE%\.wslconfig` ฝั่ง Windows แล้วรัน `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    ตั้งค่า keep-alive ให้สั้นลงใน environment ของ service Ollama หรือเริ่ม Ollama ด้วยมือเฉพาะเมื่อคุณต้องการใช้:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    ดู [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)

  </Accordion>

  <Accordion title="ตรวจไม่พบ Ollama">
    ตรวจสอบให้แน่ใจว่า Ollama กำลังรันอยู่ และคุณตั้งค่า `OLLAMA_API_KEY` (หรือ auth profile) แล้ว และคุณ **ไม่ได้** กำหนดรายการ `models.providers.ollama` อย่างชัดเจน:

    ```bash
    ollama serve
    ```

    ตรวจสอบว่า API เข้าถึงได้:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="ไม่มีโมเดลที่พร้อมใช้งาน">
    หากโมเดลของคุณไม่อยู่ในรายการ ให้ดึงโมเดลลงเครื่องหรือกำหนดไว้ชัดเจนใน `models.providers.ollama`

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="การเชื่อมต่อถูกปฏิเสธ">
    ตรวจสอบว่า Ollama กำลังรันบน port ที่ถูกต้อง:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host ใช้กับ curl ได้แต่ใช้กับ OpenClaw ไม่ได้">
    ตรวจสอบจากเครื่องและ runtime เดียวกันกับที่รัน Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    สาเหตุที่พบบ่อย:

    - `baseUrl` ชี้ไปที่ `localhost` แต่ Gateway รันใน Docker หรือบน host อื่น
    - URL ใช้ `/v1` ซึ่งเลือกพฤติกรรมที่เข้ากันได้กับ OpenAI แทน Ollama แบบ native
    - remote host ต้องเปลี่ยน firewall หรือ LAN binding ฝั่ง Ollama
    - โมเดลมีอยู่ใน daemon บน laptop ของคุณ แต่ไม่มีใน daemon ระยะไกล

  </Accordion>

  <Accordion title="โมเดลส่งออก tool JSON เป็นข้อความ">
    โดยปกติหมายความว่าผู้ให้บริการกำลังใช้โหมดเข้ากันได้กับ OpenAI หรือโมเดลไม่สามารถจัดการ tool schemas ได้

    ควรใช้โหมด Ollama แบบ native:

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

    หากโมเดล local ขนาดเล็กยังล้มเหลวกับ tool schemas ให้ตั้งค่า `compat.supportsTools: false` ในรายการโมเดลนั้นแล้วทดสอบซ้ำ

  </Accordion>

  <Accordion title="Kimi หรือ GLM ส่งคืนสัญลักษณ์ผิดเพี้ยน">
    response จาก Kimi/GLM แบบ hosted ที่ยาวและเป็นลำดับสัญลักษณ์ที่ไม่ใช่ภาษา จะถูกถือเป็น output ของผู้ให้บริการที่ล้มเหลว แทนที่จะเป็นคำตอบ assistant ที่สำเร็จ วิธีนี้ทำให้ retry, fallback หรือ error handling ตามปกติเข้ามาจัดการต่อได้ โดยไม่ persist ข้อความที่เสียหายลงใน session

    หากเกิดซ้ำ ให้เก็บชื่อโมเดล raw, ไฟล์ session ปัจจุบัน และดูว่า run ใช้ `Cloud + Local` หรือ `Cloud only` จากนั้นลอง session ใหม่และโมเดล fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="โมเดล local ที่เย็นอยู่ timeout">
    โมเดล local ขนาดใหญ่อาจต้องใช้เวลาโหลดครั้งแรกนานก่อนที่ streaming จะเริ่ม ให้จำกัด timeout ไว้กับผู้ให้บริการ Ollama และอาจขอให้ Ollama คงโมเดลไว้ในสถานะโหลดระหว่าง turn:

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

    หากโฮสต์เองตอบรับการเชื่อมต่อช้า `timeoutSeconds` จะขยายระยะหมดเวลาการเชื่อมต่อ Undici ที่มีการป้องกันสำหรับผู้ให้บริการนี้ด้วย

  </Accordion>

  <Accordion title="โมเดลบริบทขนาดใหญ่ช้าเกินไปหรือหน่วยความจำไม่พอ">
    โมเดล Ollama หลายตัวประกาศบริบทที่ใหญ่กว่าที่ฮาร์ดแวร์ของคุณจะรันได้อย่างสบาย Ollama แบบเนทีฟใช้ค่าเริ่มต้นบริบทรันไทม์ของ Ollama เอง เว้นแต่คุณจะตั้งค่า `params.num_ctx` จำกัดทั้งงบประมาณของ OpenClaw และบริบทคำขอของ Ollama เมื่อต้องการเวลาแฝงของโทเค็นแรกที่คาดเดาได้:

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

    ลด `contextWindow` ก่อนหาก OpenClaw ส่งพรอมป์มากเกินไป ลด `params.num_ctx` หาก Ollama กำลังโหลดบริบทรันไทม์ที่ใหญ่เกินไปสำหรับเครื่อง ลด `maxTokens` หากการสร้างใช้เวลานานเกินไป

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="Ollama Web Search" href="/th/tools/ollama-search" icon="magnifying-glass">
    รายละเอียดการตั้งค่าและพฤติกรรมฉบับเต็มสำหรับการค้นหาเว็บที่ขับเคลื่อนโดย Ollama
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
</CardGroup>
