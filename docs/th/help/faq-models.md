---
read_when:
    - การเลือกหรือสลับโมเดล และการกำหนดค่านามแฝง
    - การดีบักการสลับโมเดลเมื่อเกิดข้อผิดพลาด / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การยืนยันตัวตนและวิธีจัดการโปรไฟล์เหล่านั้น
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ การใช้ระบบสำรองเมื่อเกิดข้อผิดพลาด และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-07-19T07:20:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8c09012db311041fdec6ec4b78104dd720a7e69fdd1ca67ded1a4606cb0a5b3
    source_path: help/faq-models.md
    workflow: 16
---

คำถามและคำตอบเกี่ยวกับโมเดลและโปรไฟล์การยืนยันตัวตน สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และ
การแก้ไขปัญหา โปรดดู [คำถามที่พบบ่อย](/th/help/faq) หลัก

## โมเดล: ค่าเริ่มต้น การเลือก นามแฝง และการสลับ

<AccordionGroup>
  <Accordion title='"โมเดลเริ่มต้น" คืออะไร'>
    ตั้งค่าด้วย:

    ```text
    agents.defaults.model.primary
    ```

    โมเดลคือการอ้างอิง `provider/model` (ตัวอย่าง: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`) ให้ตั้งค่า `provider/model` อย่างชัดเจนเสมอ หาก
    ละเว้นผู้ให้บริการ OpenClaw จะลองจับคู่นามแฝงก่อน จากนั้นจึงจับคู่
    ผู้ให้บริการที่กำหนดค่าไว้ซึ่งไม่ซ้ำกันสำหรับรหัสโมเดลนั้น แล้วจึงย้อนกลับไปใช้
    ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ (เส้นทางความเข้ากันได้ที่เลิกแนะนำแล้ว) หาก
    ผู้ให้บริการนั้นไม่มีโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะย้อนกลับ
    ไปใช้ผู้ให้บริการ/โมเดลแรกที่กำหนดค่าไว้แทนค่าเริ่มต้นที่ล้าสมัย

  </Accordion>

  <Accordion title="แนะนำโมเดลใด">
    ใช้โมเดลรุ่นล่าสุดที่ทรงประสิทธิภาพที่สุดซึ่งสแต็กผู้ให้บริการรองรับ
    โดยเฉพาะสำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ — โมเดลที่
    อ่อนกว่าหรือถูกควอนไทซ์มากเกินไปมีความเสี่ยงต่อการแทรกคำสั่งในพรอมต์และ
    พฤติกรรมที่ไม่ปลอดภัยมากกว่า (ดู [ความปลอดภัย](/th/gateway/security)) กำหนดเส้นทาง
    โมเดลราคาถูกกว่าให้กับการสนทนาทั่วไป/ความเสี่ยงต่ำตามบทบาทของเอเจนต์

    กำหนดเส้นทางโมเดลแยกตามเอเจนต์และใช้เอเจนต์ย่อยเพื่อทำงานที่ใช้เวลานานแบบขนาน (เอเจนต์ย่อย
    แต่ละตัวใช้โทเค็นของตนเอง) ดู [โมเดล](/th/concepts/models),
    [เอเจนต์ย่อย](/th/tools/subagents), [MiniMax](/th/providers/minimax) และ
    [โมเดลภายในเครื่อง](/th/gateway/local-models)

  </Accordion>

  <Accordion title="จะสลับโมเดลโดยไม่ล้างการกำหนดค่าได้อย่างไร">
    เปลี่ยนเฉพาะฟิลด์โมเดล — หลีกเลี่ยงการแทนที่การกำหนดค่าทั้งหมด

    - `/model` ในแชต (ต่อเซสชัน ดู [คำสั่ง Slash](/th/tools/slash-commands))
    - `openclaw models set ...` (อัปเดตเฉพาะการกำหนดค่าโมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json` โดยตรง

    สำหรับการแก้ไข RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน (พาธที่ปรับเป็นมาตรฐานแล้ว
    เอกสารสคีมาแบบย่อ และสรุปองค์ประกอบลูก) จากนั้นควรใช้ `config.patch`
    แทน `config.apply` พร้อมออบเจ็กต์บางส่วน หากเขียนทับการกำหนดค่าไปแล้ว
    ให้กู้คืนจากข้อมูลสำรองหรือเรียกใช้ `openclaw doctor` เพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure),
    [การกำหนดค่า](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ใช้โมเดลที่โฮสต์เอง (llama.cpp, vLLM, Ollama) ได้หรือไม่">
    ได้ — Ollama เป็นวิธีที่ง่ายที่สุด การตั้งค่าด่วน:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลภายในเครื่อง เช่น `ollama pull gemma4`
    3. สำหรับโมเดลคลาวด์ด้วย ให้เรียกใช้ `ollama signin`
    4. เรียกใช้ `openclaw onboard` เลือก `Ollama` จากนั้นเลือก `Local` หรือ `Cloud + Local`

    `Cloud + Local` ช่วยให้ใช้โมเดลคลาวด์ร่วมกับโมเดล Ollama ภายในเครื่องได้
    โมเดลคลาวด์ เช่น `kimi-k2.5:cloud` ไม่จำเป็นต้องดึงลงเครื่อง หากต้องการสลับ
    ด้วยตนเอง: `openclaw models list` จากนั้น `openclaw models set ollama/<model>`

    โมเดลขนาดเล็ก/ที่ถูกควอนไทซ์อย่างหนักมีความเสี่ยงต่อการแทรกคำสั่งในพรอมต์มากกว่า
    ใช้โมเดลขนาดใหญ่สำหรับบอตทุกตัวที่เข้าถึงเครื่องมือได้ หากยังคงใช้โมเดลขนาดเล็ก
    ให้เปิดใช้แซนด์บ็อกซ์และรายการอนุญาตเครื่องมือที่เข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลภายในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="จะสลับโมเดลได้ทันที (โดยไม่รีสตาร์ต) อย่างไร">
    ส่ง `/model <name>` เป็นข้อความแยกเดี่ยว ดู
    [คำสั่ง Slash](/th/tools/slash-commands) สำหรับ
    รายการคำสั่งทั้งหมด รวมถึงตัวเลือกแบบมีหมายเลข (`/model`, `/model
    list`, `/model 3`), `/model default` เพื่อล้างการแทนที่ของเซสชัน และ
    `/model status` สำหรับรายละเอียดเอนด์พอยต์/โหมด API

    บังคับใช้โปรไฟล์การยืนยันตัวตนเฉพาะต่อเซสชันด้วย `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    หากต้องการเลิกตรึงโปรไฟล์ที่ตั้งค่าด้วย `@profile` ให้เรียกใช้ `/model` อีกครั้งโดยไม่มี
    ส่วนต่อท้าย (เช่น `/model anthropic/claude-opus-4-6`) หรือเลือกค่าเริ่มต้นจาก
    `/model` ใช้ `/model status` เพื่อยืนยันโปรไฟล์การยืนยันตัวตนที่ใช้งานอยู่

  </Accordion>

  <Accordion title="หากผู้ให้บริการสองรายมีรหัสโมเดลเดียวกัน /model จะใช้รายใด">
    `/model provider/model` จะเลือกเส้นทางของผู้ให้บริการนั้นโดยตรง ตัวอย่างเช่น
    `qianfan/deepseek-v4-flash` และ `deepseek/deepseek-v4-flash` เป็นการอ้างอิง
    คนละรายการแม้ว่ารหัสโมเดลจะตรงกัน — OpenClaw จะไม่สลับ
    ผู้ให้บริการโดยอัตโนมัติเมื่อจับคู่ด้วยรหัสเพียงอย่างเดียว

    การอ้างอิง `/model` ที่ผู้ใช้เลือกจะใช้กฎเข้มงวดสำหรับการสำรอง: หาก
    ผู้ให้บริการ/โมเดลนั้นไม่พร้อมใช้งาน การตอบกลับจะล้มเหลวอย่างเห็นได้ชัดแทนที่จะ
    สำรองไปยัง `agents.defaults.model.fallbacks` เชนสำรองที่กำหนดค่าไว้
    ยังคงใช้กับค่าเริ่มต้นที่กำหนดค่าไว้ โมเดลหลักของงาน Cron และ
    สถานะสำรองที่เลือกอัตโนมัติ เมื่อการทำงานที่ไม่ได้ใช้การแทนที่ระดับเซสชันได้รับอนุญาต
    ให้ใช้การสำรอง OpenClaw จะลองผู้ให้บริการ/โมเดลที่ร้องขอก่อน จากนั้นจึงลอง
    ตัวสำรองที่กำหนดค่าไว้ แล้วจึงลองโมเดลหลักที่กำหนดค่าไว้ — ดังนั้นรหัส
    โมเดลแบบไม่มีผู้ให้บริการที่ซ้ำกันจะไม่กระโดดกลับไปยังผู้ให้บริการเริ่มต้นโดยตรง

    ดู [โมเดล](/th/concepts/models) และ [การเปลี่ยนไปใช้โมเดลสำรอง](/th/concepts/model-failover)

  </Accordion>

  <Accordion title="ใช้ GPT 5.5 สำหรับงานประจำวันและ Codex 5.5 สำหรับเขียนโค้ดได้หรือไม่">
    ได้ — การเลือกโมเดลและการเลือกรันไทม์แยกจากกัน:

    - **เอเจนต์เขียนโค้ด Codex แบบเนทีฟ:** ตั้งค่า `agents.defaults.model.primary` เป็น
      `openai/gpt-5.5` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider
      openai` สำหรับการยืนยันตัวตนผ่านการสมัครสมาชิก ChatGPT/Codex
    - **งาน OpenAI API โดยตรงนอกลูปของเอเจนต์:** กำหนดค่า
      `OPENAI_API_KEY` สำหรับรูปภาพ เอ็มเบดดิง เสียง เรียลไทม์ และพื้นผิว
      OpenAI API อื่น ๆ ที่ไม่ใช่เอเจนต์
    - **การยืนยันตัวตนด้วยคีย์ API ของเอเจนต์ OpenAI:** `/model openai/gpt-5.5` พร้อมโปรไฟล์
      คีย์ API `openai` ที่จัดลำดับไว้
    - **เอเจนต์ย่อย:** กำหนดเส้นทางงานเขียนโค้ดไปยังเอเจนต์ที่เน้น Codex พร้อม
      โมเดล `openai/gpt-5.5` ของตนเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="จะกำหนดค่าโหมดเร็วสำหรับ GPT 5.5 ได้อย่างไร">
    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะใช้ `openai/gpt-5.5`
    - **ค่าเริ่มต้นต่อโมเดล:** ตั้งค่า
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` เป็น `true`
    - **จุดตัดอัตโนมัติ:** `/fast auto` หรือ `params.fastMode: "auto"` จะเรียก
      โมเดลใหม่ในโหมดเร็วจนถึงจุดตัด จากนั้นการลองใหม่ การสำรอง
      ผลลัพธ์จากเครื่องมือ หรือการเรียกต่อเนื่องภายหลังจะทำงานโดยไม่ใช้โหมดเร็ว จุดตัดเริ่มต้นคือ
      60 วินาที แทนที่ได้ด้วย `params.fastAutoOnSeconds` ในโมเดล

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    โหมดเร็วจะแมปไปยัง `service_tier = "priority"` ในคำขอ OpenAI Responses
    แบบเนทีฟ ค่า `service_tier` ที่มีอยู่จะถูกเก็บไว้ และโหมดเร็วจะไม่
    เขียน `reasoning` หรือ `text.verbosity` ใหม่ การแทนที่ `/fast` ระดับเซสชันมีลำดับความสำคัญเหนือ
    ค่าเริ่มต้นในการกำหนดค่า

    ดู [การคิดและโหมดเร็ว](/th/tools/thinking) และส่วนโหมดเร็ว
    ภายใต้การกำหนดค่าขั้นสูงในหน้าผู้ให้บริการ [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title='เหตุใดจึงเห็น "Model ... is not allowed" แล้วไม่มีการตอบกลับ'>
    หาก `agents.defaults.modelPolicy.allow` ไม่ว่าง ค่านี้จะกลายเป็น
    **รายการอนุญาต** สำหรับ `/model` การแทนที่ระดับเซสชัน และ `--model` การเลือกโมเดลนอก
    รายการดังกล่าวจะส่งคืนข้อความนี้แทนการตอบกลับปกติ:

    ```text
    Model override "provider/model" is not allowed by agents.defaults.modelPolicy.allow.
    ```

    วิธีแก้: เพิ่มโมเดลที่ตรงกันหรือไวลด์การ์ดผู้ให้บริการ เช่น `"provider/*"` ลงใน
    รายการ `modelPolicy.allow` ที่ระบุ ลบ/ทำให้รายการนั้นว่าง หรือเลือกโมเดล
    จาก `/model list` หากคำสั่งมี
    `--runtime codex` ด้วย ให้อัปเดตรายการอนุญาตก่อน แล้วจึงลองใช้
    คำสั่ง `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='เหตุใดจึงเห็น "Unknown model: minimax/MiniMax-M3"'>
    หากใช้ OpenClaw รุ่นเก่า ให้อัปเกรดก่อน (หรือเรียกใช้จากซอร์ส
    `main`) แล้วรีสตาร์ต Gateway — `MiniMax-M3` อาจยังไม่อยู่ใน
    แค็ตตาล็อกของรุ่นที่ติดตั้ง มิฉะนั้นแสดงว่ายังไม่ได้กำหนดค่าผู้ให้บริการ MiniMax
    (ไม่พบรายการผู้ให้บริการหรือโปรไฟล์การยืนยันตัวตน) จึงไม่สามารถ
    แก้ไขโมเดลได้ ดูส่วนการแก้ไขปัญหาในหน้า
    ผู้ให้บริการ [MiniMax](/th/providers/minimax) สำหรับรายการตรวจสอบการแก้ไขทั้งหมด
    ตารางรหัสผู้ให้บริการ/โมเดล และตัวอย่างบล็อกการกำหนดค่า

  </Accordion>

  <Accordion title="ใช้ MiniMax เป็นค่าเริ่มต้นและ OpenAI สำหรับงานซับซ้อนได้หรือไม่">
    ได้ ใช้ MiniMax เป็นค่าเริ่มต้นและสลับโมเดลต่อเซสชัน — ตัวสำรอง
    มีไว้สำหรับข้อผิดพลาด ไม่ใช่ "งานยาก" ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

    **ตัวเลือก A: สลับต่อเซสชัน**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    จากนั้น `/model gpt`

    **ตัวเลือก B: แยกเอเจนต์** — เอเจนต์ A ใช้ MiniMax เป็นค่าเริ่มต้น เอเจนต์ B
    ใช้ OpenAI เป็นค่าเริ่มต้น กำหนดเส้นทางตามเอเจนต์หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [โมเดล](/th/concepts/models), [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent),
    [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็นทางลัดในตัวหรือไม่">
    ใช่ — เป็นชื่อย่อในตัว ซึ่งจะใช้เฉพาะเมื่อโมเดลเป้าหมายมีอยู่ใน
    `agents.defaults.models`:

    | นามแฝง | แก้ไขเป็น |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    นามแฝงที่กำหนดเองซึ่งมีชื่อเดียวกันจะแทนที่นามแฝงในตัว

  </Accordion>

  <Accordion title="จะกำหนด/แทนที่ทางลัดโมเดล (นามแฝง) ได้อย่างไร">
    นามแฝงอยู่ที่ `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะแก้ไขไปยัง
    รหัสโมเดลนั้น

  </Accordion>

  <Accordion title="จะเพิ่มโมเดลจากผู้ให้บริการอื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร">
    OpenRouter (จ่ายตามโทเค็น มีหลายโมเดล):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (โมเดล GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    หากไม่มีคีย์ผู้ให้บริการสำหรับผู้ให้บริการ/โมเดลที่อ้างอิง จะเกิดข้อผิดพลาด
    การยืนยันตัวตนขณะรันไทม์ (เช่น `No API key found for provider "zai"`)

    **ไม่พบคีย์ API สำหรับผู้ให้บริการหลังจากเพิ่มเอเจนต์ใหม่**

    เอเจนต์ใหม่มีที่เก็บข้อมูลการยืนยันตัวตนว่างเปล่า — การยืนยันตัวตนแยกตามเอเจนต์และจัดเก็บไว้ที่:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    วิธีแก้: เรียกใช้ `openclaw agents add <id>` และกำหนดค่าการยืนยันตัวตนในวิซาร์ด หรือ
    คัดลอกเฉพาะโปรไฟล์ `api_key`/`token` แบบคงที่ที่พกพาได้จากพื้นที่จัดเก็บของเอเจนต์
    หลัก สำหรับ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อเอเจนต์นั้นต้องใช้
    บัญชีของตนเอง ดูกฎทั้งหมดเกี่ยวกับการใช้ `agentDir` ซ้ำและการแชร์ข้อมูลประจำตัวได้ที่
    [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) — ห้ามใช้
    `agentDir` ซ้ำระหว่างเอเจนต์โดยเด็ดขาด

  </Accordion>
</AccordionGroup>

## การสลับโมเดลเมื่อขัดข้องและ "โมเดลทั้งหมดล้มเหลว"

<AccordionGroup>
  <Accordion title="การสลับเมื่อขัดข้องทำงานอย่างไร">
    มีสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์การยืนยันตัวตน** ภายในผู้ให้บริการรายเดิม
    2. **การใช้โมเดลสำรอง** โดยเปลี่ยนไปใช้โมเดลถัดไปใน `agents.defaults.model.fallbacks`

    ระบบจะใช้ช่วงพักกับโปรไฟล์ที่ล้มเหลว (การถอยกลับแบบเอ็กซ์โพเนนเชียล) เพื่อให้ OpenClaw
    ยังคงตอบสนองได้เมื่อผู้ให้บริการจำกัดอัตราการใช้งานหรือล้มเหลวชั่วคราว

    กลุ่มการจำกัดอัตราครอบคลุมมากกว่าเพียง `429`: ทั้ง `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` และ
    ขีดจำกัดกรอบเวลาการใช้งานตามรอบ (`weekly/monthly limit reached`) ล้วนถือเป็น
    การจำกัดอัตราที่ควรสลับไปใช้ตัวสำรอง

    การตอบกลับเกี่ยวกับการเรียกเก็บเงินไม่ได้เป็น `402` เสมอไป และ `402` บางรายการยังคงอยู่ใน
    กลุ่มชั่วคราว/จำกัดอัตราแทนที่จะอยู่ในเส้นทางการเรียกเก็บเงิน ข้อความเกี่ยวกับ
    การเรียกเก็บเงินที่ระบุชัดเจนใน `401`/`403` ยังสามารถถูกส่งไปยังเส้นทางการเรียกเก็บเงินได้ ส่วนตัวจับคู่
    ข้อความเฉพาะผู้ให้บริการ (เช่น OpenRouter `Key limit exceeded`) จะยังจำกัดขอบเขตอยู่ที่
    ผู้ให้บริการของตนเอง `402` ที่มีลักษณะเป็นขีดจำกัดกรอบเวลาการใช้งานที่ลองใหม่ได้ หรือ
    ขีดจำกัดค่าใช้จ่ายขององค์กร/พื้นที่ทำงาน (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) จะถูกจัดการเป็น `rate_limit` ไม่ใช่
    การปิดใช้งานเนื่องจากการเรียกเก็บเงินเป็นเวลานาน

    ข้อผิดพลาดจากบริบทล้นจะไม่เข้าสู่เส้นทางการใช้ตัวสำรองเลย — รูปแบบ
    เช่น `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` หรือ `ollama error: context length exceeded` จะไปยัง
    Compaction/การลองใหม่ แทนที่จะเลื่อนไปใช้โมเดลสำรอง

    ข้อความข้อผิดพลาดทั่วไปของเซิร์ฟเวอร์มีขอบเขตแคบกว่า "ทุกข้อความที่มี unknown/error
    อยู่ในนั้น" รูปแบบชั่วคราวที่จำกัดขอบเขตตามผู้ให้บริการและถือเป็นสัญญาณให้สลับไปใช้ตัวสำรอง ได้แก่ `An unknown error occurred` แบบเดี่ยวของ Anthropic, `Provider returned error` แบบเดี่ยวของ
    OpenRouter, ข้อผิดพลาดเหตุผลการหยุด เช่น `Unhandled stop reason:
    error`, เพย์โหลด JSON `api_error` ที่มีข้อความชั่วคราวจากเซิร์ฟเวอร์ (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    และข้อผิดพลาดผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` เมื่อบริบทของผู้ให้บริการ
    ตรงกัน ข้อความตัวสำรองภายในแบบทั่วไป เช่น `LLM request failed
    with an unknown error.` จะยังใช้แนวทางแบบระมัดระวังและไม่เรียกใช้การสลับไปยังตัวสำรอง
    ด้วยตัวเอง

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default" หมายความว่าอย่างไร'>
    รหัสโปรไฟล์การยืนยันตัวตน `anthropic:default` ไม่มีข้อมูลประจำตัวใน
    พื้นที่จัดเก็บการยืนยันตัวตนที่คาดไว้

    **รายการตรวจสอบเพื่อแก้ไข:**

    - ยืนยันตำแหน่งของโปรไฟล์ — ปัจจุบัน:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; เดิม:
      `~/.openclaw/agent/*` (ย้ายข้อมูลโดย `openclaw doctor`)
    - ยืนยันว่า Gateway โหลดตัวแปรสภาพแวดล้อมของคุณ `ANTHROPIC_API_KEY` ที่ตั้งค่าไว้เฉพาะใน
      เชลล์ของคุณจะไม่ส่งไปถึง Gateway ที่เรียกใช้ผ่าน systemd/launchd — ให้ใส่ไว้ใน
      `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - ยืนยันว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง — การตั้งค่าแบบหลายเอเจนต์จะมี
      ไฟล์ `auth-profiles.json` หลายไฟล์
    - เรียกใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และสถานะ
      การยืนยันตัวตนของผู้ให้บริการ

    **สำหรับ "No credentials found for profile anthropic" (ไม่มีส่วนต่อท้ายอีเมล):**

    การเรียกใช้งานถูกตรึงไว้กับโปรไฟล์ Anthropic ที่ Gateway หาไม่พบ

    - ใช้ Claude CLI: เรียกใช้ `openclaw models auth login --provider anthropic
      --method cli --set-default` บนโฮสต์ Gateway
    - หากต้องการใช้คีย์ API แทน: ใส่ `ANTHROPIC_API_KEY` ไว้ใน
      `~/.openclaw/.env` บนโฮสต์ Gateway แล้วล้างลำดับที่ตรึงไว้ซึ่ง
      บังคับให้ใช้โปรไฟล์ที่หายไป:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - โหมดระยะไกล: โปรไฟล์การยืนยันตัวตนอยู่บนเครื่อง Gateway ไม่ใช่
      แล็ปท็อปของคุณ — ยืนยันว่าคุณกำลังเรียกใช้คำสั่งบนเครื่องนั้น

  </Accordion>

  <Accordion title="เหตุใดระบบจึงลองใช้ Google Gemini แล้วล้มเหลวด้วย">
    หากการกำหนดค่าโมเดลของคุณมี Google Gemini เป็นตัวสำรอง (หรือคุณ
    เปลี่ยนไปใช้ชื่อย่อ Gemini) OpenClaw จะลองใช้โมเดลดังกล่าวระหว่างการสลับไปใช้ตัวสำรอง หากไม่ได้
    กำหนดค่าข้อมูลประจำตัว Google ระบบจะแสดง `No API key found for provider
    "google"` วิธีแก้: เพิ่มการยืนยันตัวตน Google หรือนำโมเดล Google ออกจาก
    `agents.defaults.model.fallbacks`/ชื่อแทน

    **คำขอ LLM ถูกปฏิเสธ: ต้องมีลายเซ็นการคิด (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมีบล็อกการคิดที่ไม่มีลายเซ็น (มักเกิดจาก
    สตรีมที่ถูกยกเลิก/ไม่สมบูรณ์) Google Antigravity กำหนดให้บล็อกการคิด
    ต้องมีลายเซ็น OpenClaw จะนำบล็อกการคิดที่ไม่มีลายเซ็นออกสำหรับ Google
    Antigravity Claude หากยังคงปรากฏ ให้เริ่มเซสชันใหม่หรือตั้งค่า
    `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์การยืนยันตัวตน: คืออะไรและจัดการอย่างไร

เนื้อหาที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (ขั้นตอน OAuth, การจัดเก็บโทเค็น, รูปแบบการใช้งานหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์การยืนยันตัวตนคืออะไร">
    ระเบียนข้อมูลประจำตัวที่มีชื่อ (OAuth หรือคีย์ API) ซึ่งเชื่อมโยงกับผู้ให้บริการและจัดเก็บ
    ที่:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่แสดงข้อมูลลับ: `openclaw models auth
    list` (เลือกใช้ `--provider <id>` หรือ `--json` เพิ่มเติมได้) ดู
    [CLI สำหรับโมเดล](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="รหัสโปรไฟล์ทั่วไปมีอะไรบ้าง">
    มีคำนำหน้าผู้ให้บริการ: `anthropic:default` (พบบ่อยเมื่อไม่มีข้อมูลระบุตัวตนแบบอีเมล), `anthropic:<email>` สำหรับข้อมูลระบุตัวตน OAuth หรือรหัสกำหนดเองที่คุณ
    เลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้หรือไม่ว่าจะลองใช้โปรไฟล์การยืนยันตัวตนใดก่อน">
    ได้ การกำหนดค่า `auth.order.<provider>` จะตั้งค่าลำดับการหมุนเวียนแยกตามผู้ให้บริการ
    (เฉพาะข้อมูลเมตา — ไม่มีการจัดเก็บข้อมูลลับ)

    OpenClaw อาจข้ามโปรไฟล์ที่อยู่ใน **ช่วงพัก** ระยะสั้น (การจำกัดอัตรา
    การหมดเวลา ความล้มเหลวของการยืนยันตัวตน) หรือสถานะ **ปิดใช้งาน** ระยะยาว
    (การเรียกเก็บเงิน/เครดิตไม่เพียงพอ) ตรวจสอบด้วย `openclaw models status
    --json` และดู `auth.unusableProfiles` ปรับแต่งด้วย
    `auth.cooldowns.billingBackoffHours*` ช่วงพักจากการจำกัดอัตราสามารถ
    จำกัดขอบเขตเฉพาะโมเดลได้ — โปรไฟล์ที่อยู่ในช่วงพักสำหรับโมเดลหนึ่งยังคงให้บริการ
    โมเดลอื่นในผู้ให้บริการรายเดียวกันได้ ส่วนช่วงการเรียกเก็บเงิน/ปิดใช้งานจะบล็อก
    ทั้งโปรไฟล์

    ตั้งค่าลำดับแทนที่แยกตามเอเจนต์ (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น):

    ```bash
    # ใช้เอเจนต์เริ่มต้นที่กำหนดค่าไว้เป็นค่าเริ่มต้น (ไม่ต้องระบุ --agent)
    openclaw models auth order get --provider anthropic

    # ล็อกการหมุนเวียนไว้ที่โปรไฟล์เดียว
    openclaw models auth order set --provider anthropic anthropic:default

    # หรือตั้งค่าลำดับอย่างชัดเจน (ใช้ตัวสำรองภายในผู้ให้บริการ)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # ล้างการแทนที่ (กลับไปใช้ config auth.order / แบบวนรอบ)
    openclaw models auth order clear --provider anthropic

    # ระบุเอเจนต์ที่ต้องการ
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    ตรวจสอบสิ่งที่จะถูกลองใช้จริง: `openclaw models status --probe` โปรไฟล์
    ที่จัดเก็บไว้แต่ไม่ได้รวมอยู่ในลำดับที่ระบุอย่างชัดเจนจะรายงาน
    `excluded_by_auth_order` แทนที่จะถูกลองใช้อย่างเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth กับคีย์ API แตกต่างกันอย่างไร">
    - **OAuth / การเข้าสู่ระบบผ่าน CLI** มักใช้สิทธิ์การสมัครสมาชิกในกรณีที่
      ผู้ให้บริการรองรับ สำหรับ Anthropic แบ็กเอนด์ Claude CLI ของ OpenClaw
      ใช้ Claude Code `claude -p` ซึ่งปัจจุบัน Anthropic ถือว่าเป็น
      การใช้งาน Agent SDK/เชิงโปรแกรมที่หักจากขีดจำกัดการใช้งานของการสมัครสมาชิก —
      ดูสถานะการระงับการเรียกเก็บเงินปัจจุบันและลิงก์แหล่งข้อมูลได้ที่
      [Anthropic](/th/providers/anthropic)
    - **คีย์ API** ใช้การเรียกเก็บเงินตามจำนวนโทเค็น

    วิซาร์ดรองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์
    API

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

- [คำถามที่พบบ่อย](/th/help/faq) — คำถามที่พบบ่อยหลัก
- [คำถามที่พบบ่อย — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าสำหรับการเรียกใช้ครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)
