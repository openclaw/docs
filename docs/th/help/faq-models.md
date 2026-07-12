---
read_when:
    - การเลือกหรือสลับโมเดล และการกำหนดค่านามแฝง
    - การดีบักการสลับไปใช้โมเดลสำรอง / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การตรวจสอบสิทธิ์และวิธีจัดการโปรไฟล์เหล่านั้น
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ การสลับไปใช้ระบบสำรอง และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-07-12T16:14:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
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

    โมเดลอ้างอิงในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`) ให้ระบุ `provider/model` อย่างชัดเจนเสมอ หาก
    ไม่ระบุผู้ให้บริการ OpenClaw จะลองจับคู่นามแฝงก่อน จากนั้นจับคู่โมเดลไอดีกับ
    ผู้ให้บริการที่กำหนดค่าไว้ซึ่งตรงกันเพียงรายเดียว แล้วจึงย้อนกลับไปใช้
    ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ (เส้นทางความเข้ากันได้ที่เลิกแนะนำแล้ว) หาก
    ผู้ให้บริการนั้นไม่มีโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะย้อนกลับ
    ไปใช้ผู้ให้บริการ/โมเดลคู่แรกที่กำหนดค่าไว้แทนค่าเริ่มต้นที่ล้าสมัย

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลใด">
    ใช้โมเดลรุ่นล่าสุดที่ทรงประสิทธิภาพที่สุดซึ่งชุดผู้ให้บริการของคุณมีให้
    โดยเฉพาะสำหรับเอเจนต์ที่ใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ — โมเดลที่
    อ่อนกว่าหรือถูกควอนไทซ์มากเกินไปมีความเสี่ยงต่อการแทรกคำสั่งในพรอมต์และ
    พฤติกรรมที่ไม่ปลอดภัยมากกว่า (ดู [ความปลอดภัย](/th/gateway/security)) กำหนดเส้นทาง
    โมเดลที่ราคาถูกกว่าให้กับการสนทนาทั่วไป/ความเสี่ยงต่ำตามบทบาทของเอเจนต์

    กำหนดเส้นทางโมเดลแยกตามเอเจนต์ และใช้เอเจนต์ย่อยเพื่อประมวลผลงานที่ใช้เวลานาน
    แบบขนาน (เอเจนต์ย่อยแต่ละตัวใช้โทเค็นของตนเอง) ดู [โมเดล](/th/concepts/models),
    [เอเจนต์ย่อย](/th/tools/subagents), [MiniMax](/th/providers/minimax) และ
    [โมเดลภายในเครื่อง](/th/gateway/local-models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้างการกำหนดค่าได้อย่างไร">
    เปลี่ยนเฉพาะฟิลด์โมเดล — หลีกเลี่ยงการแทนที่การกำหนดค่าทั้งหมด

    - `/model` ในแชต (แยกตามเซสชัน ดู [คำสั่งเครื่องหมายทับ](/th/tools/slash-commands))
    - `openclaw models set ...` (อัปเดตเฉพาะการกำหนดค่าโมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json` โดยตรง

    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน (พาธที่
    ปรับเป็นมาตรฐานแล้ว เอกสารสคีมาแบบตื้น และสรุปรายการย่อย) จากนั้นควรใช้
    `config.patch` กับออบเจ็กต์บางส่วนแทน `config.apply` หากคุณเขียนทับการกำหนดค่า
    ไปแล้ว ให้กู้คืนจากข้อมูลสำรองหรือเรียกใช้ `openclaw doctor` เพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [การกำหนดค่า](/th/cli/configure),
    [การกำหนดค่า](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันสามารถใช้โมเดลที่โฮสต์เอง (llama.cpp, vLLM, Ollama) ได้หรือไม่">
    ได้ — Ollama เป็นวิธีที่ง่ายที่สุด การตั้งค่าอย่างรวดเร็ว:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลภายในเครื่อง เช่น `ollama pull gemma4`
    3. หากต้องการใช้โมเดลคลาวด์ด้วย ให้เรียกใช้ `ollama signin`
    4. เรียกใช้ `openclaw onboard` เลือก `Ollama` แล้วเลือก `Local` หรือ `Cloud + Local`

    `Cloud + Local` ให้คุณใช้ทั้งโมเดลคลาวด์และโมเดล Ollama ภายในเครื่อง
    โมเดลคลาวด์อย่าง `kimi-k2.5:cloud` ไม่จำเป็นต้องดึงลงเครื่อง หากต้องการสลับ
    ด้วยตนเอง: `openclaw models list` แล้วตามด้วย `openclaw models set ollama/<model>`

    โมเดลขนาดเล็ก/ถูกควอนไทซ์อย่างหนักมีความเสี่ยงต่อการแทรกคำสั่งในพรอมต์มากกว่า
    ใช้โมเดลขนาดใหญ่สำหรับบอตทุกตัวที่เข้าถึงเครื่องมือได้ หากยังคงใช้โมเดลขนาดเล็ก
    ให้เปิดใช้แซนด์บ็อกซ์และรายการอนุญาตเครื่องมือที่เข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลภายในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [แซนด์บ็อกซ์](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลขณะทำงาน (โดยไม่รีสตาร์ต) ได้อย่างไร">
    ส่ง `/model <name>` เป็นข้อความเดี่ยว ดู
    [คำสั่งเครื่องหมายทับ](/th/tools/slash-commands) สำหรับ
    รายการคำสั่งทั้งหมด รวมถึงตัวเลือกแบบระบุหมายเลข (`/model`, `/model
    list`, `/model 3`), `/model default` สำหรับล้างการแทนที่ระดับเซสชัน และ
    `/model status` สำหรับรายละเอียดปลายทาง/โหมด API

    บังคับใช้โปรไฟล์การยืนยันตัวตนที่ระบุในแต่ละเซสชันด้วย `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    หากต้องการยกเลิกการปักหมุดโปรไฟล์ที่ตั้งด้วย `@profile` ให้เรียกใช้ `/model`
    อีกครั้งโดยไม่มีส่วนต่อท้าย (เช่น `/model anthropic/claude-opus-4-6`) หรือเลือก
    ค่าเริ่มต้นจาก `/model` ใช้ `/model status` เพื่อยืนยันโปรไฟล์การยืนยันตัวตน
    ที่ใช้งานอยู่

  </Accordion>

  <Accordion title="หากผู้ให้บริการสองรายมีโมเดลไอดีเดียวกัน /model จะใช้รายใด">
    `/model provider/model` จะเลือกเส้นทางผู้ให้บริการนั้นอย่างเจาะจง ตัวอย่างเช่น
    `qianfan/deepseek-v4-flash` และ `deepseek/deepseek-v4-flash` เป็นการอ้างอิง
    คนละรายการ แม้โมเดลไอดีจะตรงกัน — OpenClaw จะไม่สลับผู้ให้บริการโดยไม่แจ้ง
    เพียงเพราะไอดีเปล่าตรงกัน

    การอ้างอิง `/model` ที่ผู้ใช้เลือกจะใช้กฎการย้อนกลับอย่างเข้มงวด: หาก
    ผู้ให้บริการ/โมเดลนั้นใช้งานไม่ได้ การตอบกลับจะแสดงความล้มเหลวอย่างชัดเจนแทน
    การย้อนกลับไปใช้ `agents.defaults.model.fallbacks` สายโซ่การย้อนกลับที่
    กำหนดค่าไว้ยังคงใช้กับค่าเริ่มต้นที่กำหนดค่าไว้ โมเดลหลักของงาน cron และ
    สถานะการย้อนกลับที่เลือกโดยอัตโนมัติ เมื่อการทำงานที่ไม่มีการแทนที่ระดับเซสชัน
    ได้รับอนุญาตให้ใช้การย้อนกลับ OpenClaw จะลองผู้ให้บริการ/โมเดลที่ร้องขอก่อน
    จากนั้นจึงลองตัวเลือกย้อนกลับที่กำหนดค่าไว้ แล้วจึงลองโมเดลหลักที่กำหนดค่าไว้ —
    ดังนั้นโมเดลไอดีเปล่าที่ซ้ำกันจะไม่กระโดดกลับไปยังผู้ให้บริการเริ่มต้นทันที

    ดู [โมเดล](/th/concepts/models) และ [การสลับสำรองเมื่อโมเดลล้มเหลว](/th/concepts/model-failover)

  </Accordion>

  <Accordion title="ฉันสามารถใช้ GPT 5.5 สำหรับงานประจำวันและ Codex 5.5 สำหรับเขียนโค้ดได้หรือไม่">
    ได้ — การเลือกโมเดลและการเลือกรันไทม์แยกออกจากกัน:

    - **เอเจนต์เขียนโค้ด Codex แบบเนทีฟ:** ตั้ง `agents.defaults.model.primary` เป็น
      `openai/gpt-5.5` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider
      openai` สำหรับการยืนยันตัวตนผ่านการสมัครสมาชิก ChatGPT/Codex
    - **งาน OpenAI API โดยตรงนอกลูปเอเจนต์:** กำหนดค่า
      `OPENAI_API_KEY` สำหรับรูปภาพ เอ็มเบดดิง เสียง เรียลไทม์ และส่วนติดต่อ
      OpenAI API อื่น ๆ ที่ไม่ใช่เอเจนต์
    - **การยืนยันตัวตนด้วยคีย์ API สำหรับเอเจนต์ OpenAI:** `/model openai/gpt-5.5`
      พร้อมโปรไฟล์คีย์ API ของ `openai` ที่จัดลำดับไว้
    - **เอเจนต์ย่อย:** กำหนดเส้นทางงานเขียนโค้ดไปยังเอเจนต์ที่เน้น Codex ซึ่งมี
      โมเดล `openai/gpt-5.5` ของตนเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่งเครื่องหมายทับ](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่าโหมดเร็วสำหรับ GPT 5.5 ได้อย่างไร">
    - **แยกตามเซสชัน:** ส่ง `/fast on` ขณะใช้ `openai/gpt-5.5`
    - **ค่าเริ่มต้นแยกตามโมเดล:** ตั้ง
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` เป็น `true`
    - **จุดตัดอัตโนมัติ:** `/fast auto` หรือ `params.fastMode: "auto"` จะเรียก
      โมเดลใหม่ในโหมดเร็วจนถึงจุดตัด จากนั้นเรียกการลองใหม่ การย้อนกลับ
      ผลลัพธ์จากเครื่องมือ หรือการทำงานต่อเนื่องในภายหลังโดยไม่ใช้โหมดเร็ว
      จุดตัดเริ่มต้นคือ 60 วินาที แทนที่ได้ด้วย `params.fastAutoOnSeconds`
      บนโมเดล

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

    โหมดเร็วจะจับคู่กับ `service_tier = "priority"` ในคำขอ OpenAI Responses
    แบบเนทีฟ โดยจะคงค่า `service_tier` ที่มีอยู่ไว้ และโหมดเร็วจะไม่เขียน
    `reasoning` หรือ `text.verbosity` ใหม่ การแทนที่ `/fast` ระดับเซสชันมีลำดับ
    ความสำคัญเหนือค่าเริ่มต้นในการกำหนดค่า

    ดู [การคิดและโหมดเร็ว](/th/tools/thinking) และส่วนโหมดเร็ว
    ภายใต้การกำหนดค่าขั้นสูงในหน้าผู้ให้บริการ [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title='เหตุใดฉันจึงเห็น "Model ... is not allowed" แล้วไม่มีการตอบกลับ'>
    หากตั้งค่า `agents.defaults.models` รายการนี้จะกลายเป็น **รายการอนุญาต** สำหรับ
    `/model` และการแทนที่ระดับเซสชัน การเลือกโมเดลนอกเหนือจากรายการนั้นจะส่งคืน
    ข้อความนี้แทนการตอบกลับตามปกติ:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    วิธีแก้: เพิ่มโมเดลที่ตรงกันทุกประการลงใน `agents.defaults.models` เพิ่ม
    ไวลด์การ์ดผู้ให้บริการ เช่น `"provider/*": {}` สำหรับแค็ตตาล็อกแบบไดนามิก
    นำรายการอนุญาตออก หรือเลือกโมเดลจาก `/model list` หากคำสั่งมี
    `--runtime codex` ด้วย ให้อัปเดตรายการอนุญาตก่อน แล้วลองใช้คำสั่ง
    `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='เหตุใดฉันจึงเห็น "Unknown model: minimax/MiniMax-M3"'>
    หากคุณใช้ OpenClaw รุ่นเก่า ให้อัปเกรดก่อน (หรือเรียกใช้จากซอร์ส
    `main`) แล้วรีสตาร์ต Gateway — `MiniMax-M3` อาจยังไม่อยู่ในแค็ตตาล็อกของ
    รุ่นที่ติดตั้ง มิฉะนั้นแสดงว่ายังไม่ได้กำหนดค่าผู้ให้บริการ MiniMax (ไม่พบรายการ
    ผู้ให้บริการหรือโปรไฟล์การยืนยันตัวตน) จึงไม่สามารถแก้ไขการอ้างอิงโมเดลได้
    ดูส่วนการแก้ไขปัญหาในหน้าผู้ให้บริการ
    [MiniMax](/th/providers/minimax) สำหรับรายการตรวจสอบวิธีแก้ฉบับเต็ม
    ตารางไอดีผู้ให้บริการ/โมเดล และตัวอย่างบล็อกการกำหนดค่า

  </Accordion>

  <Accordion title="ฉันสามารถใช้ MiniMax เป็นค่าเริ่มต้นและใช้ OpenAI สำหรับงานซับซ้อนได้หรือไม่">
    ได้ ใช้ MiniMax เป็นค่าเริ่มต้นและสลับโมเดลแยกตามเซสชัน — ตัวเลือกย้อนกลับ
    มีไว้สำหรับข้อผิดพลาด ไม่ใช่ "งานยาก" ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

    **ตัวเลือก A: สลับแยกตามเซสชัน**

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

    จากนั้นใช้ `/model gpt`

    **ตัวเลือก B: แยกเอเจนต์** — เอเจนต์ A ใช้ MiniMax เป็นค่าเริ่มต้น ส่วนเอเจนต์ B
    ใช้ OpenAI เป็นค่าเริ่มต้น กำหนดเส้นทางตามเอเจนต์หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [โมเดล](/th/concepts/models), [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent),
    [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็นทางลัดในตัวหรือไม่">
    ใช่ — เป็นชื่อย่อในตัว ซึ่งจะใช้เฉพาะเมื่อโมเดลเป้าหมายมีอยู่ใน
    `agents.defaults.models`:

    | นามแฝง | อ้างอิงไปยัง |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    นามแฝงของคุณเองที่ใช้ชื่อเดียวกันจะมีลำดับความสำคัญเหนือรายการในตัว

  </Accordion>

  <Accordion title="ฉันจะกำหนด/แทนที่ทางลัดของโมเดล (นามแฝง) ได้อย่างไร">
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

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะอ้างอิงไปยัง
    โมเดลไอดีนั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจากผู้ให้บริการอื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร">
    OpenRouter (ชำระเงินตามโทเค็น มีหลายโมเดล):

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

    เอเจนต์ใหม่จะมีที่เก็บการยืนยันตัวตนว่างเปล่า — การยืนยันตัวตนแยกตามเอเจนต์
    และจัดเก็บไว้ที่:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    วิธีแก้: รัน `openclaw agents add <id>` และกำหนดค่าการยืนยันตัวตนในตัวช่วยสร้าง หรือ
    คัดลอกเฉพาะโปรไฟล์ `api_key`/`token` แบบคงที่ที่พกพาได้จากที่เก็บของเอเจนต์
    หลัก สำหรับ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อเอเจนต์นั้นต้องใช้
    บัญชีของตนเอง ดูกฎทั้งหมดเกี่ยวกับการใช้ `agentDir` ซ้ำและการแชร์ข้อมูลรับรองได้ที่
    [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) — ห้ามใช้
    `agentDir` ซ้ำระหว่างเอเจนต์โดยเด็ดขาด

  </Accordion>
</AccordionGroup>

## การสลับโมเดลเมื่อเกิดข้อผิดพลาดและ "โมเดลทั้งหมดล้มเหลว"

<AccordionGroup>
  <Accordion title="การสลับเมื่อเกิดข้อผิดพลาดทำงานอย่างไร?">
    มีสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์การยืนยันตัวตน** ภายในผู้ให้บริการเดียวกัน
    2. **การใช้โมเดลสำรอง** โดยเปลี่ยนไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    ระบบจะใช้ช่วงพักกับโปรไฟล์ที่ล้มเหลว (เพิ่มระยะเวลาแบบเอ็กซ์โพเนนเชียล) เพื่อให้ OpenClaw
    ยังคงตอบสนองได้เมื่อผู้ให้บริการจำกัดอัตราการใช้งานหรือล้มเหลวชั่วคราว

    กลุ่มข้อผิดพลาดจากการจำกัดอัตราครอบคลุมมากกว่าเพียง `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` และขีดจำกัดตามรอบ
    การใช้งาน (`weekly/monthly limit reached`) ล้วนถือเป็นการจำกัดอัตราที่ควร
    สลับไปใช้ตัวสำรอง

    การตอบกลับเกี่ยวกับการเรียกเก็บเงินไม่ได้เป็น `402` เสมอไป และ `402` บางรายการยังคงอยู่ใน
    กลุ่มข้อผิดพลาดชั่วคราว/การจำกัดอัตราแทนที่จะอยู่ในกลุ่มการเรียกเก็บเงิน ข้อความเกี่ยวกับ
    การเรียกเก็บเงินที่ชัดเจนใน `401`/`403` ยังสามารถส่งไปยังกลุ่มการเรียกเก็บเงินได้ ส่วนตัวจับคู่
    ข้อความเฉพาะผู้ให้บริการ (เช่น `Key limit exceeded` ของ OpenRouter) จะใช้เฉพาะกับ
    ผู้ให้บริการนั้นเท่านั้น `402` ที่มีลักษณะเป็นขีดจำกัดรอบการใช้งานที่ลองใหม่ได้ หรือ
    ขีดจำกัดค่าใช้จ่ายขององค์กร/พื้นที่ทำงาน (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) จะถือเป็น `rate_limit` ไม่ใช่
    การปิดใช้งานระยะยาวเนื่องจากการเรียกเก็บเงิน

    ข้อผิดพลาดจากบริบทเกินขนาดจะไม่เข้าสู่เส้นทางการใช้ตัวสำรองเลย — รูปแบบข้อความ
    เช่น `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` หรือ `ollama error: context length exceeded` จะเข้าสู่
    Compaction/การลองใหม่แทนที่จะเปลี่ยนไปยังโมเดลสำรอง

    ข้อความข้อผิดพลาดทั่วไปจากเซิร์ฟเวอร์มีขอบเขตแคบกว่า "ข้อความใดก็ตามที่มีคำว่า unknown/error
    อยู่" รูปแบบข้อผิดพลาดชั่วคราวที่จำกัดขอบเขตตามผู้ให้บริการและถือเป็นสัญญาณให้สลับ
    ไปใช้ตัวสำรอง ได้แก่ `An unknown error occurred` แบบไม่มีข้อความอื่นของ Anthropic,
    `Provider returned error` แบบไม่มีข้อความอื่นของ OpenRouter, ข้อผิดพลาดจากเหตุผลการหยุด
    เช่น `Unhandled stop reason: error`, เพย์โหลด JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์
    ชั่วคราว (`internal server error`, `unknown error, 520`, `upstream error`,
    `backend error`) และข้อผิดพลาดจากผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException`
    เมื่อบริบทของผู้ให้บริการตรงกัน ข้อความตัวสำรองภายในทั่วไป เช่น `LLM request failed
    with an unknown error.` จะยังคงใช้แนวทางระมัดระวังและไม่เรียกใช้ตัวสำรอง
    ด้วยตัวเอง

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default" หมายความว่าอย่างไร?'>
    รหัสโปรไฟล์การยืนยันตัวตน `anthropic:default` ไม่มีข้อมูลรับรองในที่เก็บ
    การยืนยันตัวตนที่คาดไว้

    **รายการตรวจสอบเพื่อแก้ไข:**

    - ยืนยันตำแหน่งที่เก็บโปรไฟล์ — ปัจจุบัน:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; แบบเดิม:
      `~/.openclaw/agent/*` (ย้ายข้อมูลโดย `openclaw doctor`)
    - ยืนยันว่า Gateway โหลดตัวแปรสภาพแวดล้อมของคุณ `ANTHROPIC_API_KEY` ที่ตั้งค่าไว้เฉพาะใน
      เชลล์ของคุณจะไม่ถูกส่งไปถึง Gateway ที่รันผ่าน systemd/launchd — ให้ใส่ไว้ใน
      `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - ยืนยันว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง — การตั้งค่าแบบหลายเอเจนต์มีไฟล์
      `auth-profiles.json` หลายไฟล์
    - รัน `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และสถานะ
      การยืนยันตัวตนของผู้ให้บริการ

    **สำหรับ "No credentials found for profile anthropic" (ไม่มีส่วนต่อท้ายเป็นอีเมล):**

    การรันถูกตรึงไว้กับโปรไฟล์ Anthropic ที่ Gateway หาไม่พบ

    - ใช้ Claude CLI: รัน `openclaw models auth login --provider anthropic
      --method cli --set-default` บนโฮสต์ของ Gateway
    - หากต้องการใช้คีย์ API แทน: ใส่ `ANTHROPIC_API_KEY` ใน
      `~/.openclaw/.env` บนโฮสต์ของ Gateway จากนั้นล้างลำดับที่ตรึงไว้
      ซึ่งบังคับให้ใช้โปรไฟล์ที่หายไป:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - โหมดระยะไกล: โปรไฟล์การยืนยันตัวตนอยู่บนเครื่อง Gateway ไม่ใช่
      แล็ปท็อปของคุณ — ยืนยันว่าคุณกำลังรันคำสั่งบนเครื่องนั้น

  </Accordion>

  <Accordion title="เหตุใดระบบจึงลองใช้ Google Gemini แล้วล้มเหลวด้วย?">
    หากการกำหนดค่าโมเดลของคุณมี Google Gemini เป็นตัวสำรอง (หรือคุณ
    เปลี่ยนไปใช้ชื่อย่อของ Gemini) OpenClaw จะลองใช้ระหว่างการสลับไปยังตัวสำรอง หากไม่ได้
    กำหนดค่าข้อมูลรับรอง Google จะพบ `No API key found for provider
    "google"` วิธีแก้: เพิ่มการยืนยันตัวตนของ Google หรือนำโมเดล Google ออกจาก
    `agents.defaults.model.fallbacks`/ชื่อแทน

    **คำขอ LLM ถูกปฏิเสธ: ต้องมีลายเซ็นการคิด (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมีบล็อกการคิดที่ไม่มีลายเซ็น (มักเกิด
    จากสตรีมที่ถูกยกเลิก/ไม่สมบูรณ์) Google Antigravity กำหนดให้บล็อกการคิด
    ต้องมีลายเซ็น OpenClaw จะนำบล็อกการคิดที่ไม่มีลายเซ็นออกสำหรับ Google
    Antigravity Claude หากยังคงพบปัญหา ให้เริ่มเซสชันใหม่หรือตั้งค่า
    `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์การยืนยันตัวตน: คืออะไรและจัดการอย่างไร

เนื้อหาที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (ขั้นตอน OAuth, การจัดเก็บโทเค็น, รูปแบบการใช้หลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์การยืนยันตัวตนคืออะไร?">
    ระเบียนข้อมูลรับรองที่มีชื่อ (OAuth หรือคีย์ API) ซึ่งเชื่อมโยงกับผู้ให้บริการและจัดเก็บ
    ที่:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่แสดงข้อมูลลับ: `openclaw models auth
    list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดู
    [CLI สำหรับโมเดล](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="รหัสโปรไฟล์ทั่วไปมีอะไรบ้าง?">
    ขึ้นต้นด้วยชื่อผู้ให้บริการ: `anthropic:default` (มักใช้เมื่อไม่มีข้อมูลประจำตัว
    แบบอีเมล), `anthropic:<email>` สำหรับข้อมูลประจำตัว OAuth หรือรหัสที่กำหนดเองตามที่คุณ
    เลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้หรือไม่ว่าจะลองใช้โปรไฟล์การยืนยันตัวตนใดก่อน?">
    ได้ การกำหนดค่า `auth.order.<provider>` ระบุลำดับการหมุนเวียนสำหรับผู้ให้บริการแต่ละราย
    (เป็นเพียงข้อมูลเมตา — ไม่มีการจัดเก็บข้อมูลลับ)

    OpenClaw อาจข้ามโปรไฟล์ที่อยู่ในช่วง **พักชั่วคราว** ระยะสั้น (การจำกัดอัตรา,
    การหมดเวลา, การยืนยันตัวตนล้มเหลว) หรือสถานะ **ปิดใช้งาน** ที่ยาวนานกว่า
    (การเรียกเก็บเงิน/เครดิตไม่เพียงพอ) ตรวจสอบด้วย `openclaw models status
    --json` และดู `auth.unusableProfiles` ปรับแต่งด้วย
    `auth.cooldowns.billingBackoffHours*` ช่วงพักจากการจำกัดอัตราสามารถจำกัดขอบเขต
    ตามโมเดลได้ — โปรไฟล์ที่อยู่ในช่วงพักสำหรับโมเดลหนึ่งยังสามารถให้บริการ
    โมเดลอื่นของผู้ให้บริการเดียวกันได้ ส่วนช่วงเวลาการเรียกเก็บเงิน/ปิดใช้งานจะบล็อก
    ทั้งโปรไฟล์

    ตั้งค่าการแทนที่ลำดับสำหรับแต่ละเอเจนต์ (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    ตรวจสอบสิ่งที่จะถูกลองใช้จริง: `openclaw models status --probe` โปรไฟล์ที่จัดเก็บไว้
    แต่ไม่รวมอยู่ในลำดับที่ระบุอย่างชัดเจนจะรายงาน
    `excluded_by_auth_order` แทนที่จะถูกลองใช้อย่างเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth กับคีย์ API แตกต่างกันอย่างไร?">
    - **การเข้าสู่ระบบด้วย OAuth / CLI** มักใช้สิทธิ์การเข้าถึงจากการสมัครสมาชิกในกรณีที่
      ผู้ให้บริการรองรับ สำหรับ Anthropic แบ็กเอนด์ Claude CLI ของ OpenClaw
      ใช้ `claude -p` ของ Claude Code ซึ่งปัจจุบัน Anthropic ถือว่าเป็น
      การใช้งาน Agent SDK/แบบเขียนโปรแกรมที่หักจากขีดจำกัดการใช้งานของการสมัครสมาชิก —
      ดูสถานะการระงับการเรียกเก็บเงินปัจจุบันและลิงก์แหล่งข้อมูลที่
      [Anthropic](/th/providers/anthropic)
    - **คีย์ API** ใช้การเรียกเก็บเงินตามจำนวนโทเค็น

    ตัวช่วยสร้างรองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์
    API

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

- [คำถามที่พบบ่อย](/th/help/faq) — คำถามที่พบบ่อยหลัก
- [คำถามที่พบบ่อย — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าเมื่อใช้งานครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover)
