---
read_when:
    - คุณต้องการใช้ GitHub Copilot เป็นผู้ให้บริการโมเดล
    - คุณต้องใช้โฟลว์ `openclaw models auth login-github-copilot`
    - คุณกำลังเลือกระหว่างผู้ให้บริการ Copilot ในตัว ชุดควบคุม Copilot SDK และพร็อกซี Copilot
summary: ลงชื่อเข้าใช้ GitHub Copilot จาก OpenClaw โดยใช้ขั้นตอนการยืนยันผ่านอุปกรณ์หรือการนำเข้าโทเค็นแบบไม่โต้ตอบ
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T16:37:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot คือผู้ช่วยเขียนโค้ดด้วย AI ของ GitHub ซึ่งให้สิทธิ์เข้าถึงโมเดล Copilot
สำหรับบัญชีและแผน GitHub ของคุณ OpenClaw สามารถใช้ Copilot เป็นผู้ให้บริการโมเดล
หรือรันไทม์ของเอเจนต์ได้สามวิธี

## สามวิธีในการใช้ Copilot ใน OpenClaw

<Tabs>
  <Tab title="ผู้ให้บริการในตัว (github-copilot)">
    ใช้ขั้นตอนการเข้าสู่ระบบผ่านอุปกรณ์แบบเนทีฟเพื่อรับโทเค็น GitHub จากนั้นแลกเป็น
    โทเค็น Copilot API เมื่อ OpenClaw ทำงาน วิธีนี้เป็นเส้นทาง**ค่าเริ่มต้น**และง่ายที่สุด
    เนื่องจากไม่ต้องใช้ VS Code

    <Steps>
      <Step title="เรียกใช้คำสั่งเข้าสู่ระบบ">
        ```bash
        openclaw models auth login-github-copilot
        ```

        ระบบจะแจ้งให้คุณไปยัง URL และป้อนรหัสแบบใช้ครั้งเดียว เปิด
        เทอร์มินัลค้างไว้จนกว่ากระบวนการจะเสร็จสมบูรณ์
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        หรือกำหนดในการตั้งค่า:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin ชุดควบคุม Copilot SDK (copilot)">
    ติดตั้ง Plugin ภายนอก `@openclaw/copilot` เมื่อต้องการให้
    Copilot CLI และ SDK ของ GitHub จัดการลูปเอเจนต์ระดับล่างสำหรับโมเดล
    `github-copilot/*` ที่เลือก

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    จากนั้นเลือกให้โมเดลหรือผู้ให้บริการใช้รันไทม์ดังกล่าว:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    เลือกวิธีนี้เมื่อต้องการเซสชัน Copilot CLI แบบเนทีฟ สถานะเธรดที่จัดการโดย SDK
    และ Compaction ที่ Copilot จัดการสำหรับรอบการทำงานของเอเจนต์เหล่านั้น หากไม่ได้
    เลือกใช้ `agentRuntime` อย่างชัดเจน โมเดล `github-copilot/*` จะยังคงใช้
    ผู้ให้บริการในตัว ดูสัญญารันไทม์ฉบับเต็มได้ที่ [ชุดควบคุม Copilot SDK](/th/plugins/copilot)

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    ใช้ส่วนขยาย **Copilot Proxy** ของ VS Code เป็นบริดจ์ภายในเครื่อง OpenClaw จะสื่อสารกับ
    ปลายทาง `/v1` ของพร็อกซี (ค่าเริ่มต้นคือ `http://localhost:3000/v1`) และใช้
    รายการโมเดลที่คุณกำหนดค่า

    Plugin `copilot-proxy` มาพร้อมกับ OpenClaw และเปิดใช้งานเป็นค่าเริ่มต้น
    กำหนด URL ฐานและรหัสโมเดลด้วย:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    เลือกวิธีนี้เมื่อคุณใช้งาน Copilot Proxy ใน VS Code อยู่แล้ว หรือต้องการกำหนดเส้นทาง
    ผ่านพร็อกซีดังกล่าว ส่วนขยาย VS Code ต้องทำงานอยู่ตลอดเวลา
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (ถิ่นที่อยู่ของข้อมูล)

หากองค์กรของคุณใช้ผู้เช่า GitHub Enterprise แบบกำหนดถิ่นที่อยู่ของข้อมูล (โฮสต์
`*.ghe.com` เช่น `your-org.ghe.com`) Copilot จะอยู่บนปลายทางภายในผู้เช่า
แทน `github.com` สาธารณะ OpenClaw เปิดเผยตัวเลือกนี้เป็น
ตัวเลือกการยืนยันตัวตนโดยตรง คุณจึงไม่ต้องแก้ไข URL ด้วยตนเอง

<Steps>
  <Step title="เลือกตัวเลือกการยืนยันตัวตน Enterprise">
    ในขั้นตอนเริ่มต้นใช้งานหรือ `openclaw models auth` ให้เลือก
    **GitHub Copilot (Enterprise / data residency)** ระบบจะแจ้งให้คุณป้อน
    โดเมน Enterprise (เช่น `your-org.ghe.com`) จากนั้นกระบวนการเข้าสู่ระบบ
    ผ่านอุปกรณ์จะทำงานกับผู้เช่านั้น

    ป้อนเฉพาะรากของผู้เช่า (`your-org.ghe.com`) ระบบไม่ยอมรับโฮสต์บริการที่อนุมานมา
    เช่น `api.your-org.ghe.com` หรือ `copilot-api.your-org.ghe.com`
    OpenClaw จะอนุมานปลายทางเหล่านั้นจากรากของผู้เช่าโดยอัตโนมัติ

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="บันทึกโดเมนไว้ในการตั้งค่า">
    โฮสต์ที่เลือกจะถูกจัดเก็บไว้ภายใต้พารามิเตอร์ของผู้ให้บริการ เพื่อให้การรีเฟรชโทเค็น
    และการเติมข้อความในภายหลังมุ่งไปยังผู้เช่านั้นโดยอัตโนมัติ:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

กระบวนการผ่านอุปกรณ์ การแลกโทเค็น และการเติมข้อความจะชี้ไปยัง
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` และ
`https://copilot-api.your-org.ghe.com` ตามลำดับ โทเค็นแบบกำหนดถิ่นที่อยู่ของข้อมูลจะมี
ตราประทับผู้เช่าและไม่มีคำใบ้พร็อกซี ดังนั้น URL ฐานสำหรับการเติมข้อความจะย้อนกลับไปใช้
โฮสต์ Copilot ของผู้เช่าแทนปลายทางสาธารณะ

<Note>
การสลับโดเมนจะเรียกใช้การเข้าสู่ระบบผ่านอุปกรณ์ใหม่เสมอ หากคุณมี
โทเค็น Copilot ที่จัดเก็บไว้อยู่แล้วและเลือกโดเมนอื่น (สลับระหว่าง `github.com` สาธารณะกับ
ผู้เช่า `*.ghe.com` หรือสลับจากผู้เช่าหนึ่งไปยังอีกผู้เช่าหนึ่ง) OpenClaw จะไม่ใช้โทเค็นเดิมซ้ำ —
ระบบจะบังคับให้เข้าสู่ระบบใหม่ เพื่อให้ขอบเขตของโทเค็นตรงกับโดเมนที่กำลังเขียนลงใน
การตั้งค่า การเข้าสู่ระบบซ้ำสำหรับโดเมน*เดียวกัน*จะยังคงเสนอตัวเลือกให้ใช้โทเค็นปัจจุบันซ้ำ
การสลับกลับไปยัง `github.com` สาธารณะจะล้างค่า `githubDomain` ที่บันทึกไว้
เพื่อให้การตั้งค่ากลับเป็นค่าเริ่มต้น
</Note>

<Note>
ตัวแปรสภาพแวดล้อม `COPILOT_GITHUB_DOMAIN` จะเขียนทับโดเมนที่ระบบแก้ไขได้
สำหรับทุกเส้นทางของ Copilot ที่ต้องแก้ไขโดเมน ได้แก่ การเข้าสู่ระบบผ่านอุปกรณ์ของ Enterprise
(`--method device-enterprise`), คำสั่งลัด
`openclaw models auth login-github-copilot` แบบแยกเดี่ยว, การรีเฟรชโทเค็น, เอ็มเบดดิง
และการเติมข้อความ ตั้งค่าเป็นโฮสต์ `*.ghe.com` ของคุณสำหรับการตั้งค่าแบบไม่มีส่วนติดต่อ
หรือ CI อย่างสมบูรณ์ หากต้องการใช้ `github.com` สาธารณะ ให้เว้นค่านี้ไว้โดยไม่ตั้งค่า
(และไม่มีพารามิเตอร์นี้ในการตั้งค่า) การเข้าสู่ระบบจะบันทึกโดเมนที่ใช้สร้างโทเค็น
(และล้างค่าเมื่อเข้าสู่ระบบกับ `github.com` สาธารณะ) ดังนั้นการกำหนดเส้นทางจะยังคงถูกต้อง
แม้จะยกเลิกการตั้งค่าตัวแปรสภาพแวดล้อมแล้ว
</Note>

## แฟล็กเสริม

| คำสั่ง                                                                 | แฟล็ก          | คำอธิบาย                                                        |
| ---------------------------------------------------------------------- | --------------- | --------------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | เขียนทับโปรไฟล์การยืนยันตัวตนที่มีอยู่โดยไม่แสดงข้อความถามยืนยัน |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | ใช้โมเดลเริ่มต้นที่ผู้ให้บริการแนะนำด้วย                         |

```bash
# ข้ามการยืนยันการเข้าสู่ระบบใหม่
openclaw models auth login-github-copilot --yes

# เข้าสู่ระบบและตั้งค่าโมเดลเริ่มต้นในขั้นตอนเดียว
openclaw models auth login --provider github-copilot --method device --set-default
```

## การเริ่มต้นใช้งานแบบไม่โต้ตอบ

กระบวนการเข้าสู่ระบบผ่านอุปกรณ์ต้องใช้ TTY แบบโต้ตอบ สำหรับการตั้งค่าแบบไม่มีส่วนติดต่อ
ให้นำเข้าโทเค็นการเข้าถึง GitHub OAuth ที่มีอยู่ด้วย `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

คุณสามารถละ `--auth-choice` ได้เช่นกัน การส่ง `--github-copilot-token` จะอนุมาน
ตัวเลือกการยืนยันตัวตนของผู้ให้บริการ GitHub Copilot หากละแฟล็กนี้ ขั้นตอนเริ่มต้นใช้งานจะ
ย้อนกลับไปใช้ `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` และ `GITHUB_TOKEN` ตามลำดับ ใช้
`--secret-input-mode ref` โดยตั้งค่า `COPILOT_GITHUB_TOKEN` เพื่อจัดเก็บ `tokenRef`
ที่อ้างอิงตัวแปรสภาพแวดล้อมแทนข้อความธรรมดาใน `auth-profiles.json`

<AccordionGroup>
  <Accordion title="ต้องใช้ TTY แบบโต้ตอบ">
    กระบวนการเข้าสู่ระบบผ่านอุปกรณ์ต้องใช้ TTY แบบโต้ตอบ ให้เรียกใช้โดยตรงใน
    เทอร์มินัล ไม่ใช่ในสคริปต์แบบไม่โต้ตอบหรือไปป์ไลน์ CI
  </Accordion>

  <Accordion title="ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผนของคุณ">
    ความพร้อมใช้งานของโมเดล Copilot ขึ้นอยู่กับแผน GitHub ของคุณ หากโมเดล
    ถูกปฏิเสธ ให้ลองใช้รหัสอื่น (เช่น `github-copilot/gpt-5.5`) ดู
    [โมเดลที่รองรับในแต่ละแผน Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    ของ GitHub สำหรับรายการโมเดลปัจจุบัน
  </Accordion>

  <Accordion title="รีเฟรชแค็ตตาล็อกแบบสดจาก Copilot API">
    เมื่อเส้นทางการยืนยันตัวตนผ่านอุปกรณ์ (หรือตัวแปรสภาพแวดล้อม) แก้ไขโทเค็น GitHub ได้แล้ว
    OpenClaw จะรีเฟรชแค็ตตาล็อกโมเดลตามต้องการจาก `${baseUrl}/models`
    (ปลายทางเดียวกับที่ VS Code Copilot ใช้) เพื่อให้รันไทม์ติดตาม
    สิทธิ์ของแต่ละบัญชีและขนาดหน้าต่างบริบทที่ถูกต้องโดยไม่ต้องปรับเปลี่ยน
    แมนิเฟสต์ โมเดล Copilot ที่เผยแพร่ใหม่จะปรากฏโดยไม่ต้องอัปเกรด OpenClaw
    และหน้าต่างบริบทจะแสดงขีดจำกัดจริงของแต่ละโมเดล
    (เช่น 400k สำหรับชุด gpt-5.x และ 1M สำหรับตัวแปรภายใน
    `claude-opus-*-1m`)

    แค็ตตาล็อกแบบคงที่ที่รวมมาให้จะยังคงเป็นทางเลือกสำรองที่มองเห็นได้ เมื่อปิดใช้การค้นหา
    ผู้ใช้ไม่มีโปรไฟล์การยืนยันตัวตน GitHub การแลกโทเค็นล้มเหลว
    หรือการเรียก HTTPS ไปยัง `/models` เกิดข้อผิดพลาด หากต้องการยกเลิกการใช้ฟังก์ชันนี้
    และพึ่งพาแค็ตตาล็อกแมนิเฟสต์แบบคงที่ทั้งหมด (กรณีออฟไลน์/แยกขาดจากเครือข่าย):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การเลือกการขนส่ง">
    รหัสโมเดล Claude จะใช้การขนส่ง Anthropic Messages โดยอัตโนมัติ
    โมเดล Gemini ใช้การขนส่ง OpenAI Chat Completions ส่วนโมเดล GPT และชุด o
    จะยังคงใช้การขนส่ง OpenAI Responses OpenClaw เลือก
    การขนส่งที่ถูกต้องตามการอ้างอิงโมเดล
  </Accordion>

  <Accordion title="ความเข้ากันได้ของคำขอ">
    OpenClaw ส่งส่วนหัวคำขอแบบ Copilot IDE ผ่านการขนส่งของ Copilot
    (เวอร์ชันตัวแก้ไข/Plugin ของ VS Code และรหัสการผสานรวม `vscode-chat`)
    ทำเครื่องหมายรอบการติดตามผลลัพธ์ของเครื่องมือว่าเริ่มต้นโดยเอเจนต์ และตั้งค่าส่วนหัว
    ด้านภาพของ Copilot เมื่อรอบการทำงานมีข้อมูลเข้าประเภทรูปภาพ
  </Accordion>

  <Accordion title="ลำดับการแก้ไขตัวแปรสภาพแวดล้อม">
    OpenClaw แก้ไขข้อมูลยืนยันตัวตน Copilot จากตัวแปรสภาพแวดล้อมตาม
    ลำดับความสำคัญต่อไปนี้:

    | ลำดับความสำคัญ | ตัวแปร                 | หมายเหตุ                                  |
    | --------------- | ---------------------- | ----------------------------------------- |
    | 1               | `COPILOT_GITHUB_TOKEN` | ความสำคัญสูงสุด ใช้เฉพาะกับ Copilot      |
    | 2               | `GH_TOKEN`             | โทเค็น GitHub CLI (ทางเลือกสำรอง)         |
    | 3               | `GITHUB_TOKEN`         | โทเค็น GitHub มาตรฐาน (ความสำคัญต่ำที่สุด) |

    เมื่อตั้งค่าหลายตัวแปร OpenClaw จะใช้ตัวแปรที่มีความสำคัญสูงสุด
    กระบวนการเข้าสู่ระบบผ่านอุปกรณ์ (`openclaw models auth login-github-copilot`) จะจัดเก็บ
    โทเค็นไว้ในที่จัดเก็บโปรไฟล์การยืนยันตัวตน และมีลำดับความสำคัญเหนือกว่าตัวแปรสภาพแวดล้อม
    ทั้งหมด

  </Accordion>

  <Accordion title="การจัดเก็บโทเค็น">
    การเข้าสู่ระบบจะจัดเก็บโทเค็น GitHub ไว้ในที่จัดเก็บโปรไฟล์การยืนยันตัวตน (รหัสโปรไฟล์
    `github-copilot:github`) และแลกเป็นโทเค็น Copilot API อายุสั้น
    เมื่อ OpenClaw ทำงาน คุณไม่จำเป็นต้องจัดการโทเค็นด้วยตนเอง
  </Accordion>
</AccordionGroup>

## เอ็มเบดดิงสำหรับการค้นหาหน่วยความจำ

GitHub Copilot สามารถทำหน้าที่เป็นผู้ให้บริการเอ็มเบดดิงสำหรับ
[การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้เช่นกัน หากคุณสมัครใช้ Copilot และ
เข้าสู่ระบบแล้ว OpenClaw สามารถใช้บริการนี้สำหรับเอ็มเบดดิงได้โดยไม่ต้องมีคีย์ API แยกต่างหาก

### การตั้งค่า

ตั้งค่า `memorySearch.provider` เป็น GitHub Copilot อย่างชัดเจนเพื่อใช้เอ็มเบดดิงของ GitHub Copilot หากมี
โทเค็น GitHub อยู่ OpenClaw จะค้นหาโมเดลเอ็มเบดดิงที่พร้อมใช้งานจาก
Copilot API และเลือกโมเดลที่ดีที่สุดโดยอัตโนมัติ

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // ไม่บังคับ: เขียนทับโมเดลที่ค้นพบโดยอัตโนมัติ
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### วิธีการทำงาน

1. OpenClaw แก้ไขโทเค็น GitHub ของคุณ (จากตัวแปรสภาพแวดล้อมหรือโปรไฟล์การยืนยันตัวตน)
2. แลกโทเค็นดังกล่าวเป็นโทเค็น Copilot API อายุสั้น
3. สอบถามปลายทาง `/models` ของ Copilot เพื่อค้นหาโมเดลเอ็มเบดดิงที่พร้อมใช้งาน
4. เลือกโมเดลที่ดีที่สุด (ลำดับความต้องการ: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`)
5. ส่งคำขอเอ็มเบดดิงไปยังปลายทาง `/embeddings` ของ Copilot

ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผน GitHub ของคุณ หากไม่มีโมเดลเอ็มเบดดิง
ที่พร้อมใช้งาน OpenClaw จะข้าม Copilot และลองใช้ผู้ให้บริการรายถัดไป

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการนำข้อมูลรับรองกลับมาใช้ซ้ำ
  </Card>
</CardGroup>
