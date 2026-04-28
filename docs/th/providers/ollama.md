---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับโมเดลบนคลาวด์หรือในเครื่องผ่าน Ollama
    - คุณต้องการคำแนะนำในการตั้งค่าและกำหนดค่า Ollama
    - คุณต้องการโมเดล vision ของ Ollama สำหรับการทำความเข้าใจภาพ
summary: เรียกใช้ OpenClaw กับ Ollama (โมเดลบนคลาวด์และในเครื่อง)
title: Ollama
x-i18n:
    generated_at: "2026-04-24T09:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw เชื่อมต่อกับ API แบบเนทีฟของ Ollama (`/api/chat`) สำหรับโมเดลคลาวด์แบบโฮสต์และเซิร์ฟเวอร์ Ollama ในเครื่อง/ที่โฮสต์เอง คุณสามารถใช้ Ollama ได้สามโหมด: `Cloud + Local` ผ่านโฮสต์ Ollama ที่เข้าถึงได้, `Cloud only` กับ `https://ollama.com` หรือ `Local only` กับโฮสต์ Ollama ที่เข้าถึงได้

<Warning>
**ผู้ใช้ Ollama ระยะไกล**: อย่าใช้ URL แบบเข้ากันได้กับ OpenAI ของ `/v1` (`http://host:11434/v1`) กับ OpenClaw เพราะจะทำให้การเรียกใช้เครื่องมือเสีย และโมเดลอาจส่ง JSON ของเครื่องมือแบบดิบออกมาเป็นข้อความธรรมดา ให้ใช้ URL ของ Ollama API แบบเนทีฟแทน: `baseUrl: "http://host:11434"` (ไม่มี `/v1`)
</Warning>

## เริ่มต้นใช้งาน

เลือกวิธีตั้งค่าและโหมดที่คุณต้องการ

<Tabs>
  <Tab title="Onboarding (แนะนำ)">
    **เหมาะที่สุดสำหรับ:** เส้นทางที่เร็วที่สุดในการตั้งค่า Ollama แบบคลาวด์หรือในเครื่องให้ใช้งานได้

    <Steps>
      <Step title="รันการตั้งค่าเริ่มต้น">
        ```bash
        openclaw onboard
        ```

        เลือก **Ollama** จากรายการผู้ให้บริการ
      </Step>
      <Step title="เลือกโหมดของคุณ">
        - **Cloud + Local** — โฮสต์ Ollama ในเครื่องพร้อมโมเดลคลาวด์ที่ถูกกำหนดเส้นทางผ่านโฮสต์นั้น
        - **Cloud only** — โมเดล Ollama แบบโฮสต์ผ่าน `https://ollama.com`
        - **Local only** — ใช้เฉพาะโมเดลในเครื่อง

      </Step>
      <Step title="เลือกโมเดล">
        `Cloud only` จะถามหา `OLLAMA_API_KEY` และแนะนำค่าเริ่มต้นของโมเดลคลาวด์แบบโฮสต์ `Cloud + Local` และ `Local only` จะถามหา base URL ของ Ollama, ค้นหาโมเดลที่พร้อมใช้งาน และดึงโมเดลในเครื่องที่เลือกให้อัตโนมัติหากยังไม่มี `Cloud + Local` จะตรวจสอบด้วยว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้สำหรับการเข้าถึงคลาวด์แล้วหรือยัง
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

    สามารถระบุ base URL หรือโมเดลแบบกำหนดเองเพิ่มเติมได้:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="การตั้งค่าด้วยตนเอง">
    **เหมาะที่สุดสำหรับ:** การควบคุมการตั้งค่าแบบคลาวด์หรือในเครื่องได้เต็มรูปแบบ

    <Steps>
      <Step title="เลือกคลาวด์หรือในเครื่อง">
        - **Cloud + Local**: ติดตั้ง Ollama, ลงชื่อเข้าใช้ด้วย `ollama signin` และกำหนดเส้นทางคำขอคลาวด์ผ่านโฮสต์นั้น
        - **Cloud only**: ใช้ `https://ollama.com` กับ `OLLAMA_API_KEY`
        - **Local only**: ติดตั้ง Ollama จาก [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="ดึงโมเดลในเครื่อง (เฉพาะในเครื่อง)">
        ```bash
        ollama pull gemma4
        # หรือ
        ollama pull gpt-oss:20b
        # หรือ
        ollama pull llama3.3
        ```
      </Step>
      <Step title="เปิดใช้ Ollama สำหรับ OpenClaw">
        สำหรับ `Cloud only` ให้ใช้ `OLLAMA_API_KEY` จริงของคุณ สำหรับการตั้งค่าแบบใช้โฮสต์ ค่า placeholder ใดๆ ก็ใช้ได้:

        ```bash
        # คลาวด์
        export OLLAMA_API_KEY="your-ollama-api-key"

        # เฉพาะในเครื่อง
        export OLLAMA_API_KEY="ollama-local"

        # หรือกำหนดค่าในไฟล์ config ของคุณ
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบและตั้งค่าโมเดลของคุณ">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        หรือกำหนดค่าเริ่มต้นใน config:

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
    `Cloud + Local` ใช้โฮสต์ Ollama ที่เข้าถึงได้เป็นจุดควบคุมสำหรับทั้งโมเดลในเครื่องและโมเดลคลาวด์ นี่คือโฟลว์ไฮบริดที่ Ollama แนะนำ

    ใช้ **Cloud + Local** ระหว่างการตั้งค่า OpenClaw จะถามหา base URL ของ Ollama, ค้นหาโมเดลในเครื่องจากโฮสต์นั้น และตรวจสอบว่าโฮสต์ได้ลงชื่อเข้าใช้สำหรับการเข้าถึงคลาวด์ด้วย `ollama signin` แล้วหรือยัง เมื่อโฮสต์ลงชื่อเข้าใช้แล้ว OpenClaw จะแนะนำค่าเริ่มต้นของโมเดลคลาวด์แบบโฮสต์ เช่น `kimi-k2.5:cloud`, `minimax-m2.7:cloud` และ `glm-5.1:cloud`

    หากโฮสต์ยังไม่ได้ลงชื่อเข้าใช้ OpenClaw จะคงการตั้งค่าไว้เป็นแบบเฉพาะในเครื่องจนกว่าคุณจะรัน `ollama signin`

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` ทำงานกับ API แบบโฮสต์ของ Ollama ที่ `https://ollama.com`

    ใช้ **Cloud only** ระหว่างการตั้งค่า OpenClaw จะถามหา `OLLAMA_API_KEY`, ตั้งค่า `baseUrl: "https://ollama.com"` และเติมรายการโมเดลคลาวด์แบบโฮสต์เริ่มต้น เส้นทางนี้ **ไม่** ต้องใช้เซิร์ฟเวอร์ Ollama ในเครื่องหรือ `ollama signin`

    รายการโมเดลคลาวด์ที่แสดงระหว่าง `openclaw onboard` จะถูกเติมแบบสดจาก `https://ollama.com/api/tags` โดยจำกัดไว้ที่ 500 รายการ ดังนั้นตัวเลือกจะแสดงแค็ตตาล็อกแบบโฮสต์ปัจจุบันแทนที่จะเป็นรายการคงที่ หาก `ollama.com` ไม่สามารถเข้าถึงได้หรือไม่คืนค่าโมเดลในเวลาตั้งค่า OpenClaw จะ fallback ไปใช้รายการแนะนำแบบ hardcoded เดิม เพื่อให้ onboarding เสร็จสมบูรณ์ได้

  </Tab>

  <Tab title="Local only">
    ในโหมดเฉพาะในเครื่อง OpenClaw จะค้นหาโมเดลจากอินสแตนซ์ Ollama ที่ตั้งค่าไว้ เส้นทางนี้มีไว้สำหรับเซิร์ฟเวอร์ Ollama ในเครื่องหรือที่โฮสต์เอง

    ปัจจุบัน OpenClaw แนะนำ `gemma4` เป็นค่าเริ่มต้นในเครื่อง

  </Tab>
</Tabs>

## การค้นหาโมเดล (ผู้ให้บริการแบบ implicit)

เมื่อคุณตั้งค่า `OLLAMA_API_KEY` (หรือ auth profile) และ **ไม่ได้** กำหนด `models.providers.ollama` OpenClaw จะค้นหาโมเดลจากอินสแตนซ์ Ollama ในเครื่องที่ `http://127.0.0.1:11434`

| พฤติกรรม | รายละเอียด |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การค้นหาแค็ตตาล็อก | คิวรี `/api/tags` |
| การตรวจจับความสามารถ | ใช้การค้นหา `/api/show` แบบ best-effort เพื่ออ่าน `contextWindow` และตรวจจับความสามารถ (รวมถึง vision) |
| โมเดล vision | โมเดลที่มีความสามารถ `vision` ตามที่ `/api/show` รายงาน จะถูกทำเครื่องหมายว่ารองรับภาพ (`input: ["text", "image"]`) ดังนั้น OpenClaw จะใส่ภาพเข้าไปใน prompt ให้อัตโนมัติ |
| การตรวจจับ reasoning | ทำเครื่องหมาย `reasoning` ด้วย heuristic จากชื่อโมเดล (`r1`, `reasoning`, `think`) |
| ขีดจำกัดโทเค็น | ตั้งค่า `maxTokens` เป็นเพดานโทเค็นสูงสุดของ Ollama ตามค่าเริ่มต้นที่ OpenClaw ใช้ |
| ค่าใช้จ่าย | ตั้งค่าค่าใช้จ่ายทั้งหมดเป็น `0` |

วิธีนี้ช่วยหลีกเลี่ยงการต้องระบุรายการโมเดลด้วยตนเอง ขณะเดียวกันก็ทำให้แค็ตตาล็อกสอดคล้องกับอินสแตนซ์ Ollama ในเครื่อง

```bash
# ดูว่ามีโมเดลใดบ้าง
ollama list
openclaw models list
```

หากต้องการเพิ่มโมเดลใหม่ เพียงดึงด้วย Ollama:

```bash
ollama pull mistral
```

โมเดลใหม่จะถูกค้นหาโดยอัตโนมัติและพร้อมใช้งาน

<Note>
หากคุณตั้งค่า `models.providers.ollama` อย่างชัดเจน การค้นหาอัตโนมัติจะถูกข้าม และคุณต้องกำหนดโมเดลด้วยตนเอง ดูส่วน config แบบ explicit ด้านล่าง
</Note>

## Vision และการอธิบายภาพ

ปลั๊กอิน Ollama แบบ bundled ลงทะเบียน Ollama เป็นผู้ให้บริการ media-understanding ที่รองรับภาพ ซึ่งช่วยให้ OpenClaw สามารถกำหนดเส้นทางคำขออธิบายภาพแบบ explicit และค่าเริ่มต้นของโมเดลภาพที่ตั้งค่าไว้ผ่านโมเดล vision ของ Ollama แบบในเครื่องหรือแบบโฮสต์ได้

สำหรับ vision ในเครื่อง ให้ดึงโมเดลที่รองรับภาพ:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

จากนั้นตรวจสอบด้วย CLI สำหรับ infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` ต้องเป็น ref แบบเต็มของ `<provider/model>` เมื่อมีการตั้งค่านี้ `openclaw infer image describe` จะรันโมเดลดังกล่าวโดยตรง แทนที่จะข้ามการอธิบายเพราะโมเดลรองรับ vision แบบเนทีฟ

หากต้องการให้ Ollama เป็นโมเดลเริ่มต้นสำหรับการทำความเข้าใจภาพของสื่อขาเข้า ให้ตั้งค่า `agents.defaults.imageModel`:

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

หากคุณกำหนด `models.providers.ollama.models` ด้วยตนเอง ให้ทำเครื่องหมายโมเดล vision ว่ารองรับอินพุตภาพ:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw จะปฏิเสธคำขออธิบายภาพสำหรับโมเดลที่ไม่ได้ถูกทำเครื่องหมายว่ารองรับภาพ สำหรับการค้นหาแบบ implicit นั้น OpenClaw จะอ่านข้อมูลนี้จาก Ollama เมื่อ `/api/show` รายงานความสามารถ vision

## การกำหนดค่า

<Tabs>
  <Tab title="พื้นฐาน (การค้นหาแบบ implicit)">
    เส้นทางที่ง่ายที่สุดในการเปิดใช้แบบเฉพาะในเครื่องคือผ่านตัวแปรสภาพแวดล้อม:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    หากมีการตั้งค่า `OLLAMA_API_KEY` คุณสามารถละ `apiKey` ในรายการผู้ให้บริการได้ และ OpenClaw จะเติมค่าให้เองสำหรับการตรวจสอบความพร้อมใช้งาน
    </Tip>

  </Tab>

  <Tab title="Explicit (กำหนดโมเดลด้วยตนเอง)">
    ใช้ config แบบ explicit เมื่อคุณต้องการการตั้งค่าแบบคลาวด์ที่โฮสต์ไว้, Ollama ทำงานบนโฮสต์/พอร์ตอื่น, ต้องการบังคับ context window หรือรายการโมเดลเฉพาะ หรือคุณต้องการกำหนดโมเดลทั้งหมดด้วยตนเอง

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
    หาก Ollama ทำงานบนโฮสต์หรือพอร์ตอื่น (config แบบ explicit จะปิดการค้นหาอัตโนมัติ ดังนั้นต้องกำหนดโมเดลด้วยตนเอง):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // ไม่มี /v1 - ใช้ URL ของ Ollama API แบบเนทีฟ
            api: "ollama", // ระบุอย่างชัดเจนเพื่อรับประกันพฤติกรรมการเรียกใช้เครื่องมือแบบเนทีฟ
          },
        },
      },
    }
    ```

    <Warning>
    อย่าเติม `/v1` ต่อท้าย URL พาธ `/v1` ใช้โหมดที่เข้ากันได้กับ OpenAI ซึ่งการเรียกใช้เครื่องมือจะไม่เสถียร ให้ใช้ base URL ของ Ollama โดยไม่มี path suffix
    </Warning>

  </Tab>
</Tabs>

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

## Ollama Web Search

OpenClaw รองรับ **Ollama Web Search** เป็นผู้ให้บริการ `web_search` แบบ bundled

| คุณสมบัติ | รายละเอียด |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| โฮสต์ | ใช้โฮสต์ Ollama ที่คุณตั้งค่าไว้ (`models.providers.ollama.baseUrl` เมื่อมีการตั้งค่า มิฉะนั้นใช้ `http://127.0.0.1:11434`) |
| การยืนยันตัวตน | ไม่ต้องใช้คีย์ |
| ข้อกำหนด | Ollama ต้องกำลังทำงานและลงชื่อเข้าใช้ด้วย `ollama signin` |

เลือก **Ollama Web Search** ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` หรือกำหนดค่า:

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

<Note>
สำหรับรายละเอียดการตั้งค่าและพฤติกรรมทั้งหมด ดู [Ollama Web Search](/th/tools/ollama-search)
</Note>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดแบบเดิมที่เข้ากันได้กับ OpenAI">
    <Warning>
    **การเรียกใช้เครื่องมือไม่เสถียรในโหมดที่เข้ากันได้กับ OpenAI** ใช้โหมดนี้เฉพาะเมื่อคุณต้องการรูปแบบ OpenAI สำหรับพร็อกซี และไม่ได้พึ่งพาพฤติกรรมการเรียกใช้เครื่องมือแบบเนทีฟ
    </Warning>

    หากคุณจำเป็นต้องใช้ endpoint แบบเข้ากันได้กับ OpenAI แทน (เช่น อยู่หลังพร็อกซีที่รองรับเฉพาะรูปแบบ OpenAI) ให้ตั้งค่า `api: "openai-completions"` อย่างชัดเจน:

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

    โหมดนี้อาจไม่รองรับทั้งการสตรีมและการเรียกใช้เครื่องมือพร้อมกัน คุณอาจต้องปิดการสตรีมด้วย `params: { streaming: false }` ใน config ของโมเดล

    เมื่อใช้ `api: "openai-completions"` กับ Ollama นั้น OpenClaw จะใส่ `options.num_ctx` ให้โดยค่าเริ่มต้น เพื่อไม่ให้ Ollama fallback ไปใช้ context window ขนาด 4096 แบบเงียบๆ หากพร็อกซี/ต้นทางของคุณปฏิเสธฟิลด์ `options` ที่ไม่รู้จัก ให้ปิดพฤติกรรมนี้:

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
    สำหรับโมเดลที่ค้นหาอัตโนมัติ OpenClaw จะใช้ context window ที่ Ollama รายงานเมื่อมีอยู่ มิฉะนั้นจะ fallback ไปใช้ context window ของ Ollama ตามค่าเริ่มต้นที่ OpenClaw ใช้

    คุณสามารถ override `contextWindow` และ `maxTokens` ใน config ของผู้ให้บริการแบบ explicit ได้:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="โมเดล reasoning">
    OpenClaw จะถือว่าโมเดลที่มีชื่อเช่น `deepseek-r1`, `reasoning` หรือ `think` รองรับ reasoning โดยค่าเริ่มต้น

    ```bash
    ollama pull deepseek-r1:32b
    ```

    ไม่จำเป็นต้องมีการตั้งค่าเพิ่มเติม -- OpenClaw จะทำเครื่องหมายให้อัตโนมัติ

  </Accordion>

  <Accordion title="ค่าใช้จ่ายของโมเดล">
    Ollama ใช้งานฟรีและทำงานในเครื่อง ดังนั้นค่าใช้จ่ายของโมเดลทั้งหมดจึงถูกตั้งเป็น $0 ซึ่งใช้กับทั้งโมเดลที่ค้นหาอัตโนมัติและโมเดลที่กำหนดด้วยตนเอง
  </Accordion>

  <Accordion title="Memory embeddings">
    ปลั๊กอิน Ollama แบบ bundled ลงทะเบียนผู้ให้บริการ embedding ของหน่วยความจำสำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory) โดยใช้ base URL
    และ API key ของ Ollama ที่ตั้งค่าไว้

    | คุณสมบัติ | ค่า |
    | ------------- | ------------------- |
    | โมเดลเริ่มต้น | `nomic-embed-text` |
    | ดึงอัตโนมัติ | ใช่ — โมเดล embedding จะถูกดึงอัตโนมัติหากยังไม่มีอยู่ในเครื่อง |

    หากต้องการเลือก Ollama เป็นผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำ:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การตั้งค่าการสตรีม">
    การเชื่อมต่อ Ollama ของ OpenClaw ใช้ **Ollama API แบบเนทีฟ** (`/api/chat`) โดยค่าเริ่มต้น ซึ่งรองรับทั้งการสตรีมและการเรียกใช้เครื่องมือพร้อมกันได้อย่างสมบูรณ์ ไม่จำเป็นต้องมีการตั้งค่าพิเศษ

    สำหรับคำขอ `/api/chat` แบบเนทีฟ OpenClaw จะส่งต่อการควบคุมการคิดไปยัง Ollama โดยตรงด้วย: `/think off` และ `openclaw agent --thinking off` จะส่ง `think: false` ที่ระดับบนสุด ส่วนระดับการคิดที่ไม่ใช่ `off` จะส่ง `think: true`

    <Tip>
    หากคุณจำเป็นต้องใช้ endpoint แบบเข้ากันได้กับ OpenAI ให้ดูส่วน "โหมดแบบเดิมที่เข้ากันได้กับ OpenAI" ด้านบน การสตรีมและการเรียกใช้เครื่องมืออาจไม่ทำงานพร้อมกันในโหมดนั้น
    </Tip>

  </Accordion>
</AccordionGroup>

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ Ollama">
    ตรวจสอบให้แน่ใจว่า Ollama กำลังทำงานอยู่ และคุณได้ตั้งค่า `OLLAMA_API_KEY` (หรือ auth profile) แล้ว และคุณ **ไม่ได้** กำหนดรายการ `models.providers.ollama` แบบ explicit:

    ```bash
    ollama serve
    ```

    ตรวจสอบว่า API เข้าถึงได้:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="ไม่มีโมเดลพร้อมใช้งาน">
    หากโมเดลของคุณไม่ปรากฏในรายการ ให้ดึงโมเดลนั้นในเครื่องหรือกำหนดมันอย่างชัดเจนใน `models.providers.ollama`

    ```bash
    ollama list  # ดูว่าติดตั้งอะไรไว้บ้าง
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # หรือโมเดลอื่น
    ```

  </Accordion>

  <Accordion title="การเชื่อมต่อถูกปฏิเสธ">
    ตรวจสอบว่า Ollama ทำงานอยู่บนพอร์ตที่ถูกต้อง:

    ```bash
    # ตรวจสอบว่า Ollama กำลังทำงานอยู่หรือไม่
    ps aux | grep ollama

    # หรือเริ่ม Ollama ใหม่
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด, model refs และพฤติกรรม failover
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="Ollama Web Search" href="/th/tools/ollama-search" icon="magnifying-glass">
    รายละเอียดการตั้งค่าและพฤติกรรมทั้งหมดสำหรับการค้นหาเว็บที่ขับเคลื่อนด้วย Ollama
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config ฉบับเต็ม
  </Card>
</CardGroup>
