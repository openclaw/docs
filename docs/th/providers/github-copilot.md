---
read_when:
    - คุณต้องการใช้ GitHub Copilot เป็นผู้ให้บริการโมเดล
    - คุณต้องใช้โฟลว์ `openclaw models auth login-github-copilot`
    - คุณกำลังเลือกระหว่างผู้ให้บริการ Copilot ในตัว, ฮาร์เนส Copilot SDK และ Copilot Proxy
summary: ลงชื่อเข้าใช้ GitHub Copilot จาก OpenClaw โดยใช้ขั้นตอนอุปกรณ์หรือการนำเข้าโทเค็นแบบไม่โต้ตอบ
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:13:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot เป็นผู้ช่วยเขียนโค้ดด้วย AI ของ GitHub โดยให้สิทธิ์เข้าถึงโมเดล Copilot
สำหรับบัญชีและแผน GitHub ของคุณ OpenClaw สามารถใช้ Copilot เป็นผู้ให้บริการโมเดล
หรือรันไทม์เอเจนต์ได้สามวิธี

## สามวิธีในการใช้ Copilot ใน OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    ใช้โฟลว์เข้าสู่ระบบบนอุปกรณ์แบบเนทีฟเพื่อรับโทเค็น GitHub แล้วแลกเป็น
    โทเค็น Copilot API เมื่อ OpenClaw ทำงาน นี่คือเส้นทาง **ค่าเริ่มต้น** และเรียบง่ายที่สุด
    เพราะไม่ต้องใช้ VS Code

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        ระบบจะแจ้งให้คุณไปที่ URL และป้อนรหัสแบบใช้ครั้งเดียว เปิด
        เทอร์มินัลค้างไว้จนกว่ากระบวนการจะเสร็จสิ้น
      </Step>
      <Step title="Set a default model">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        หรือในคอนฟิก:

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

  <Tab title="Copilot SDK harness plugin (copilot)">
    ติดตั้ง Plugin ภายนอก `@openclaw/copilot` เมื่อคุณต้องการให้
    Copilot CLI และ SDK ของ GitHub เป็นเจ้าของลูปเอเจนต์ระดับล่างสำหรับโมเดล
    `github-copilot/*` ที่เลือก

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    จากนั้นเลือกให้โมเดลหรือผู้ให้บริการใช้รันไทม์นี้:

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

    เลือกวิธีนี้เมื่อคุณต้องการเซสชัน Copilot CLI แบบเนทีฟ สถานะเธรดที่ SDK จัดการ
    และ Compaction ที่ Copilot เป็นเจ้าของสำหรับเทิร์นเอเจนต์เหล่านั้น ดู
    [Copilot SDK harness](/th/plugins/copilot) สำหรับสัญญารันไทม์ฉบับเต็ม

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    ใช้ส่วนขยาย VS Code **Copilot Proxy** เป็นบริดจ์ในเครื่อง OpenClaw จะคุยกับ
    เอนด์พอยต์ `/v1` ของพร็อกซีและใช้รายการโมเดลที่คุณคอนฟิกไว้ที่นั่น

    <Note>
    เลือกวิธีนี้เมื่อคุณรัน Copilot Proxy ใน VS Code อยู่แล้ว หรือต้องการกำหนดเส้นทาง
    ผ่านมัน คุณต้องเปิดใช้ Plugin และเปิดส่วนขยาย VS Code ค้างไว้
    </Note>

  </Tab>
</Tabs>

## แฟล็กเสริม

| แฟล็ก            | คำอธิบาย                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | ข้ามพรอมป์ยืนยัน                        |
| `--set-default` | ใช้โมเดลค่าเริ่มต้นที่ผู้ให้บริการแนะนำด้วย |

```bash
# ข้ามการยืนยัน
openclaw models auth login-github-copilot --yes

# เข้าสู่ระบบและตั้งค่าโมเดลเริ่มต้นในขั้นตอนเดียว
openclaw models auth login --provider github-copilot --method device --set-default
```

## การเริ่มใช้งานแบบไม่โต้ตอบ

หากคุณมีโทเค็นเข้าถึง GitHub OAuth สำหรับ Copilot อยู่แล้ว ให้นำเข้าโทเค็นระหว่าง
การตั้งค่าแบบ headless ด้วย `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

คุณยังสามารถละ `--auth-choice` ได้ การส่ง `--github-copilot-token` จะอนุมานตัวเลือก
การยืนยันตัวตนของผู้ให้บริการ GitHub Copilot หากละแฟล็กนี้ การเริ่มใช้งานจะถอยกลับไปใช้
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` แล้วจึงเป็น `GITHUB_TOKEN` ใช้
`--secret-input-mode ref` โดยตั้งค่า `COPILOT_GITHUB_TOKEN` เพื่อจัดเก็บ
`tokenRef` ที่อ้างอิง env แทนข้อความธรรมดาใน `auth-profiles.json`

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    โฟลว์เข้าสู่ระบบบนอุปกรณ์ต้องใช้ TTY แบบโต้ตอบ ให้รันโดยตรงใน
    เทอร์มินัล ไม่ใช่ในสคริปต์แบบไม่โต้ตอบหรือไปป์ไลน์ CI
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    ความพร้อมใช้งานของโมเดล Copilot ขึ้นอยู่กับแผน GitHub ของคุณ หากโมเดลถูก
    ปฏิเสธ ให้ลอง ID อื่น (เช่น `github-copilot/gpt-5.5`) ดู
    [โมเดลที่รองรับต่อแผน Copilot ของ GitHub](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    สำหรับรายการโมเดลปัจจุบัน
  </Accordion>

  <Accordion title="Live catalog refresh from the Copilot API">
    เมื่อเส้นทางยืนยันตัวตนด้วยการเข้าสู่ระบบบนอุปกรณ์ (หรือ env-var) แก้ค่าเป็นโทเค็น GitHub ได้แล้ว
    OpenClaw จะรีเฟรชแคตตาล็อกโมเดลตามต้องการจาก `${baseUrl}/models`
    (เอนด์พอยต์เดียวกับที่ VS Code Copilot ใช้) เพื่อให้รันไทม์ติดตาม
    สิทธิ์ต่อบัญชีและหน้าต่างบริบทที่ถูกต้องได้โดยไม่ต้องเปลี่ยนแมนิเฟสต์
    โมเดล Copilot ที่เผยแพร่ใหม่จะแสดงได้โดยไม่ต้องอัปเกรด OpenClaw
    และหน้าต่างบริบทจะสะท้อนขีดจำกัดจริงต่อโมเดล
    (เช่น 400k สำหรับซีรีส์ gpt-5.x, 1M สำหรับตัวแปรภายใน
    `claude-opus-*-1m`)

    แคตตาล็อกสแตติกที่บันเดิลมาจะยังเป็นตัวสำรองที่มองเห็นได้เมื่อปิดการค้นพบ
    ผู้ใช้ไม่มีโปรไฟล์ยืนยันตัวตน GitHub การแลกโทเค็น
    ล้มเหลว หรือการเรียก HTTPS ไปยัง `/models` เกิดข้อผิดพลาด หากต้องการเลือกไม่ใช้และพึ่งพา
    แคตตาล็อกแมนิเฟสต์แบบสแตติกทั้งหมด (สถานการณ์ออฟไลน์ / air-gapped):

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

  <Accordion title="Transport selection">
    ID โมเดล Claude ใช้ทรานสปอร์ต Anthropic Messages โดยอัตโนมัติ โมเดล GPT,
    o-series และ Gemini ยังคงใช้ทรานสปอร์ต OpenAI Responses OpenClaw
    เลือกทรานสปอร์ตที่ถูกต้องตามการอ้างอิงโมเดล
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw ส่งส่วนหัวคำขอสไตล์ Copilot IDE บนทรานสปอร์ต Copilot
    รวมถึงเทิร์นติดตามผลสำหรับ Compaction ในตัว ผลลัพธ์เครื่องมือ และรูปภาพ
    โดยจะไม่เปิดใช้ Responses continuation ระดับผู้ให้บริการสำหรับ Copilot เว้นแต่
    พฤติกรรมนั้นได้รับการตรวจสอบกับ API ของ Copilot แล้ว
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw แก้ค่าการยืนยันตัวตน Copilot จากตัวแปรสภาพแวดล้อมตามลำดับ
    ความสำคัญต่อไปนี้:

    | ลำดับความสำคัญ | ตัวแปร              | หมายเหตุ                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | ความสำคัญสูงสุด เฉพาะ Copilot |
    | 2        | `GH_TOKEN`            | โทเค็น GitHub CLI (ตัวสำรอง)      |
    | 3        | `GITHUB_TOKEN`        | โทเค็น GitHub มาตรฐาน (ต่ำสุด)   |

    เมื่อมีการตั้งค่าหลายตัวแปร OpenClaw จะใช้ตัวที่มีลำดับความสำคัญสูงสุด
    โฟลว์เข้าสู่ระบบบนอุปกรณ์ (`openclaw models auth login-github-copilot`) จะจัดเก็บ
    โทเค็นไว้ในที่เก็บโปรไฟล์ยืนยันตัวตน และมีลำดับเหนือกว่าตัวแปรสภาพแวดล้อมทั้งหมด

  </Accordion>

  <Accordion title="Token storage">
    การเข้าสู่ระบบจะจัดเก็บโทเค็น GitHub ในที่เก็บโปรไฟล์ยืนยันตัวตน และแลกเป็น
    โทเค็น Copilot API เมื่อ OpenClaw ทำงาน คุณไม่จำเป็นต้องจัดการ
    โทเค็นด้วยตนเอง
  </Accordion>
</AccordionGroup>

<Warning>
คำสั่งเข้าสู่ระบบบนอุปกรณ์ต้องใช้ TTY แบบโต้ตอบ ใช้การเริ่มใช้งานแบบไม่โต้ตอบ
เมื่อคุณต้องตั้งค่าแบบ headless
</Warning>

## เอ็มเบดดิงสำหรับการค้นหาหน่วยความจำ

GitHub Copilot ยังสามารถทำหน้าที่เป็นผู้ให้บริการเอ็มเบดดิงสำหรับ
[การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้ หากคุณมีการสมัครใช้งาน Copilot และ
เข้าสู่ระบบแล้ว OpenClaw สามารถใช้สำหรับเอ็มเบดดิงได้โดยไม่ต้องมีคีย์ API แยกต่างหาก

### คอนฟิก

ตั้งค่า `memorySearch.provider` อย่างชัดเจนเพื่อใช้เอ็มเบดดิง GitHub Copilot หากมี
โทเค็น GitHub พร้อมใช้งาน OpenClaw จะค้นหาโมเดลเอ็มเบดดิงที่พร้อมใช้จาก
Copilot API และเลือกโมเดลที่ดีที่สุดโดยอัตโนมัติ

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### วิธีทำงาน

1. OpenClaw แก้ค่าโทเค็น GitHub ของคุณ (จาก env vars หรือโปรไฟล์ยืนยันตัวตน)
2. แลกเป็นโทเค็น Copilot API อายุสั้น
3. สอบถามเอนด์พอยต์ Copilot `/models` เพื่อค้นหาโมเดลเอ็มเบดดิงที่พร้อมใช้
4. เลือกโมเดลที่ดีที่สุด (ให้ความสำคัญกับ `text-embedding-3-small`)
5. ส่งคำขอเอ็มเบดดิงไปยังเอนด์พอยต์ Copilot `/embeddings`

ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผน GitHub ของคุณ หากไม่มีโมเดลเอ็มเบดดิง
ที่พร้อมใช้ OpenClaw จะข้าม Copilot และลองผู้ให้บริการถัดไป

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อเกิดความล้มเหลว
  </Card>
  <Card title="OAuth and auth" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
