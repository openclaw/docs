---
read_when:
    - คุณต้องการใช้ GitHub Copilot เป็นผู้ให้บริการโมเดล
    - คุณต้องใช้โฟลว์ `openclaw models auth login-github-copilot`
summary: ลงชื่อเข้าใช้ GitHub Copilot จาก OpenClaw โดยใช้โฟลว์อุปกรณ์หรือการนำเข้าโทเค็นแบบไม่โต้ตอบ
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T10:11:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot คือผู้ช่วยเขียนโค้ดด้วย AI ของ GitHub โดยให้สิทธิ์เข้าถึงโมเดล Copilot
สำหรับบัญชีและแผน GitHub ของคุณ OpenClaw สามารถใช้ Copilot เป็นผู้ให้บริการโมเดล
ได้สองวิธีแตกต่างกัน

## สองวิธีในการใช้ Copilot ใน OpenClaw

<Tabs>
  <Tab title="ผู้ให้บริการในตัว (github-copilot)">
    ใช้ขั้นตอนเข้าสู่ระบบผ่านอุปกรณ์แบบเนทีฟเพื่อรับโทเค็น GitHub แล้วแลกเป็น
    โทเค็น Copilot API เมื่อ OpenClaw ทำงาน นี่คือเส้นทาง **ค่าเริ่มต้น** และง่ายที่สุด
    เพราะไม่ต้องใช้ VS Code

    <Steps>
      <Step title="เรียกใช้คำสั่งเข้าสู่ระบบ">
        ```bash
        openclaw models auth login-github-copilot
        ```

        ระบบจะแจ้งให้คุณไปที่ URL และกรอกรหัสแบบใช้ครั้งเดียว เปิด
        เทอร์มินัลค้างไว้จนกว่าจะเสร็จสิ้น
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        หรือใน config:

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

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    ใช้ส่วนขยาย VS Code **Copilot Proxy** เป็นบริดจ์ภายในเครื่อง OpenClaw ติดต่อกับ
    endpoint `/v1` ของพร็อกซีและใช้รายการโมเดลที่คุณกำหนดค่าไว้ที่นั่น

    <Note>
    เลือกตัวเลือกนี้เมื่อคุณใช้งาน Copilot Proxy ใน VS Code อยู่แล้ว หรือต้องกำหนดเส้นทาง
    ผ่านตัวเลือกนี้ คุณต้องเปิดใช้งาน Plugin และให้ส่วนขยาย VS Code ทำงานต่อไป
    </Note>

  </Tab>
</Tabs>

## แฟล็กเสริม

| แฟล็ก            | คำอธิบาย                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | ข้ามพรอมป์ยืนยัน                        |
| `--set-default` | ใช้โมเดลเริ่มต้นที่ผู้ให้บริการแนะนำด้วย |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## การเริ่มต้นใช้งานแบบไม่โต้ตอบ

หากคุณมีโทเค็นเข้าถึง GitHub OAuth สำหรับ Copilot อยู่แล้ว ให้นำเข้าในระหว่าง
การตั้งค่าแบบไม่มีส่วนหัวด้วย `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

คุณสามารถละ `--auth-choice` ได้เช่นกัน การส่ง `--github-copilot-token` จะอนุมาน
ตัวเลือกการตรวจสอบสิทธิ์ของผู้ให้บริการ GitHub Copilot หากไม่ได้ระบุแฟล็กนี้ การเริ่มต้นใช้งานจะ
ถอยกลับไปใช้ `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` แล้วจึง `GITHUB_TOKEN` ใช้
`--secret-input-mode ref` พร้อมตั้งค่า `COPILOT_GITHUB_TOKEN` เพื่อจัดเก็บ
`tokenRef` ที่อ้างอิง env แทนข้อความธรรมดาใน `auth-profiles.json`

<AccordionGroup>
  <Accordion title="ต้องใช้ TTY แบบโต้ตอบ">
    ขั้นตอนเข้าสู่ระบบผ่านอุปกรณ์ต้องใช้ TTY แบบโต้ตอบ ให้เรียกใช้โดยตรงใน
    เทอร์มินัล ไม่ใช่ในสคริปต์แบบไม่โต้ตอบหรือไปป์ไลน์ CI
  </Accordion>

  <Accordion title="ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผนของคุณ">
    ความพร้อมใช้งานของโมเดล Copilot ขึ้นอยู่กับแผน GitHub ของคุณ หากโมเดลถูก
    ปฏิเสธ ให้ลองใช้ ID อื่น (เช่น `github-copilot/gpt-4.1`)
  </Accordion>

  <Accordion title="การเลือกทรานสปอร์ต">
    ID โมเดล Claude ใช้ทรานสปอร์ต Anthropic Messages โดยอัตโนมัติ ส่วนโมเดล GPT,
    o-series และ Gemini จะใช้ทรานสปอร์ต OpenAI Responses ต่อไป OpenClaw
    เลือกทรานสปอร์ตที่ถูกต้องตาม model ref
  </Accordion>

  <Accordion title="ความเข้ากันได้ของคำขอ">
    OpenClaw ส่งส่วนหัวคำขอสไตล์ Copilot IDE บนทรานสปอร์ต Copilot
    รวมถึงรอบ built-in compaction, tool-result และ image follow-up โดย
    จะไม่เปิดใช้งานการดำเนินต่อระดับผู้ให้บริการของ Responses สำหรับ Copilot เว้นแต่
    พฤติกรรมนั้นได้รับการตรวจสอบกับ API ของ Copilot แล้ว
  </Accordion>

  <Accordion title="ลำดับการแก้ไขตัวแปรสภาพแวดล้อม">
    OpenClaw แก้ไขการตรวจสอบสิทธิ์ Copilot จากตัวแปรสภาพแวดล้อมตาม
    ลำดับความสำคัญต่อไปนี้:

    | ลำดับความสำคัญ | ตัวแปร              | หมายเหตุ                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | ลำดับความสำคัญสูงสุด เฉพาะ Copilot |
    | 2        | `GH_TOKEN`            | โทเค็น GitHub CLI (fallback)      |
    | 3        | `GITHUB_TOKEN`        | โทเค็น GitHub มาตรฐาน (ต่ำสุด)   |

    เมื่อมีการตั้งค่าหลายตัวแปร OpenClaw จะใช้ตัวแปรที่มีลำดับความสำคัญสูงสุด
    ขั้นตอนเข้าสู่ระบบผ่านอุปกรณ์ (`openclaw models auth login-github-copilot`) จะจัดเก็บ
    โทเค็นไว้ในที่เก็บโปรไฟล์การตรวจสอบสิทธิ์ และมีลำดับความสำคัญเหนือกว่าตัวแปรสภาพแวดล้อม
    ทั้งหมด

  </Accordion>

  <Accordion title="การจัดเก็บโทเค็น">
    การเข้าสู่ระบบจะจัดเก็บโทเค็น GitHub ไว้ในที่เก็บโปรไฟล์การตรวจสอบสิทธิ์ และแลกเป็น
    โทเค็น Copilot API เมื่อ OpenClaw ทำงาน คุณไม่จำเป็นต้องจัดการ
    โทเค็นด้วยตนเอง
  </Accordion>
</AccordionGroup>

<Warning>
คำสั่งเข้าสู่ระบบผ่านอุปกรณ์ต้องใช้ TTY แบบโต้ตอบ ใช้การเริ่มต้นใช้งานแบบไม่โต้ตอบ
เมื่อคุณต้องตั้งค่าแบบไม่มีส่วนหัว
</Warning>

## embeddings สำหรับการค้นหาหน่วยความจำ

GitHub Copilot ยังสามารถทำหน้าที่เป็นผู้ให้บริการ embedding สำหรับ
[การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้ด้วย หากคุณมีการสมัครใช้งาน Copilot และ
เข้าสู่ระบบแล้ว OpenClaw สามารถใช้บริการนี้สำหรับ embeddings ได้โดยไม่ต้องใช้ API key แยกต่างหาก

### การตรวจจับอัตโนมัติ

เมื่อ `memorySearch.provider` เป็น `"auto"` (ค่าเริ่มต้น) GitHub Copilot จะถูกลองใช้
ที่ลำดับความสำคัญ 15 -- หลัง embeddings ภายในเครื่อง แต่ก่อน OpenAI และผู้ให้บริการแบบชำระเงินอื่นๆ
หากมีโทเค็น GitHub พร้อมใช้งาน OpenClaw จะค้นหา
โมเดล embedding ที่พร้อมใช้งานจาก Copilot API และเลือกโมเดลที่ดีที่สุดโดยอัตโนมัติ

### config แบบระบุชัดเจน

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

### วิธีการทำงาน

1. OpenClaw แก้ไขโทเค็น GitHub ของคุณ (จาก env vars หรือโปรไฟล์การตรวจสอบสิทธิ์)
2. แลกเป็นโทเค็น Copilot API อายุสั้น
3. สืบค้น endpoint `/models` ของ Copilot เพื่อค้นหาโมเดล embedding ที่พร้อมใช้งาน
4. เลือกโมเดลที่ดีที่สุด (ให้ความสำคัญกับ `text-embedding-3-small`)
5. ส่งคำขอ embedding ไปยัง endpoint `/embeddings` ของ Copilot

ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผน GitHub ของคุณ หากไม่มีโมเดล embedding
พร้อมใช้งาน OpenClaw จะข้าม Copilot และลองผู้ให้บริการถัดไป

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="OAuth และการตรวจสอบสิทธิ์" href="/th/gateway/authentication" icon="key">
    รายละเอียดการตรวจสอบสิทธิ์และกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
</CardGroup>
