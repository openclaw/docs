---
read_when:
    - คุณต้องการใช้ GitHub Copilot เป็นผู้ให้บริการโมเดล
    - คุณต้องใช้โฟลว์ `openclaw models auth login-github-copilot`
summary: ลงชื่อเข้าใช้ GitHub Copilot จาก OpenClaw โดยใช้ขั้นตอนการยืนยันผ่านอุปกรณ์หรือการนำเข้าโทเค็นแบบไม่ต้องโต้ตอบ
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-10T19:53:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot คือผู้ช่วยเขียนโค้ดด้วย AI ของ GitHub โดยให้สิทธิ์เข้าถึงโมเดล Copilot สำหรับบัญชีและแผน GitHub ของคุณ OpenClaw สามารถใช้ Copilot เป็นผู้ให้บริการโมเดลได้สองวิธี

## สองวิธีในการใช้ Copilot ใน OpenClaw

<Tabs>
  <Tab title="ผู้ให้บริการในตัว (github-copilot)">
    ใช้ขั้นตอนการเข้าสู่ระบบผ่านอุปกรณ์แบบเนทีฟเพื่อรับโทเค็น GitHub จากนั้นแลกเป็น
    โทเค็น Copilot API เมื่อ OpenClaw ทำงาน เส้นทางนี้เป็นเส้นทาง**เริ่มต้น**และง่ายที่สุด
    เพราะไม่ต้องใช้ VS Code

    <Steps>
      <Step title="เรียกใช้คำสั่งเข้าสู่ระบบ">
        ```bash
        openclaw models auth login-github-copilot
        ```

        คุณจะได้รับแจ้งให้ไปที่ URL และป้อนโค้ดแบบใช้ครั้งเดียว เปิด
        เทอร์มินัลค้างไว้จนกว่าจะเสร็จสมบูรณ์
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        หรือในไฟล์กำหนดค่า:

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

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    ใช้ส่วนขยาย VS Code **Copilot Proxy** เป็นบริดจ์ภายในเครื่อง OpenClaw สื่อสารกับ
    endpoint `/v1` ของพร็อกซีและใช้รายการโมเดลที่คุณกำหนดค่าไว้ที่นั่น

    <Note>
    เลือกวิธีนี้เมื่อคุณรัน Copilot Proxy ใน VS Code อยู่แล้ว หรือต้องกำหนดเส้นทาง
    ผ่านสิ่งนั้น คุณต้องเปิดใช้งาน Plugin และให้ส่วนขยาย VS Code ทำงานต่อเนื่อง
    </Note>

  </Tab>
</Tabs>

## แฟล็กเสริม

| แฟล็ก            | คำอธิบาย                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | ข้ามพรอมป์ยืนยัน                        |
| `--set-default` | ใช้โมเดลเริ่มต้นที่ผู้ให้บริการแนะนำด้วย |

```bash
# ข้ามการยืนยัน
openclaw models auth login-github-copilot --yes

# เข้าสู่ระบบและตั้งค่าโมเดลเริ่มต้นในขั้นตอนเดียว
openclaw models auth login --provider github-copilot --method device --set-default
```

## การเริ่มต้นใช้งานแบบไม่โต้ตอบ

หากคุณมีโทเค็นการเข้าถึง GitHub OAuth สำหรับ Copilot อยู่แล้ว ให้นำเข้าในระหว่าง
การตั้งค่าแบบ headless ด้วย `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

คุณยังสามารถละเว้น `--auth-choice` ได้ การส่ง `--github-copilot-token` จะอนุมาน
ตัวเลือกการยืนยันตัวตนของผู้ให้บริการ GitHub Copilot หากละเว้นแฟล็กนี้ การเริ่มต้นใช้งานจะ
ย้อนกลับไปใช้ `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` แล้วจึง `GITHUB_TOKEN` ใช้
`--secret-input-mode ref` โดยตั้งค่า `COPILOT_GITHUB_TOKEN` เพื่อจัดเก็บ
`tokenRef` ที่อ้างอิงจาก env แทนข้อความธรรมดาใน `auth-profiles.json`

<AccordionGroup>
  <Accordion title="ต้องใช้ TTY แบบโต้ตอบ">
    ขั้นตอนการเข้าสู่ระบบผ่านอุปกรณ์ต้องใช้ TTY แบบโต้ตอบ เรียกใช้โดยตรงใน
    เทอร์มินัล ไม่ใช่ในสคริปต์แบบไม่โต้ตอบหรือไปป์ไลน์ CI
  </Accordion>

  <Accordion title="ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผนของคุณ">
    ความพร้อมใช้งานของโมเดล Copilot ขึ้นอยู่กับแผน GitHub ของคุณ หากโมเดลถูก
    ปฏิเสธ ให้ลองใช้ ID อื่น (เช่น `github-copilot/gpt-4.1`)
  </Accordion>

  <Accordion title="รีเฟรชแค็ตตาล็อกสดจาก Copilot API">
    เมื่อเส้นทางการยืนยันตัวตนด้วยการเข้าสู่ระบบผ่านอุปกรณ์ (หรือ env-var) ได้แก้ไขโทเค็น GitHub แล้ว
    OpenClaw จะรีเฟรชแค็ตตาล็อกโมเดลตามต้องการจาก `${baseUrl}/models`
    (endpoint เดียวกับที่ VS Code Copilot ใช้) เพื่อให้ runtime ติดตาม
    สิทธิ์ต่อบัญชีและหน้าต่างบริบทที่แม่นยำได้โดยไม่ต้องมีการเปลี่ยนแปลง manifest
    โมเดล Copilot ที่เผยแพร่ใหม่จะมองเห็นได้โดยไม่ต้องอัปเกรด OpenClaw
    และหน้าต่างบริบทจะสะท้อนขีดจำกัดจริงต่อโมเดล
    (เช่น 400k สำหรับซีรีส์ gpt-5.x, 1M สำหรับตัวแปรภายใน
    `claude-opus-*-1m`)

    แค็ตตาล็อกแบบคงที่ที่รวมมาด้วยจะยังคงเป็น fallback ที่มองเห็นได้เมื่อปิดใช้การค้นพบ
    ผู้ใช้ไม่มีโปรไฟล์การยืนยันตัวตน GitHub การแลกเปลี่ยนโทเค็น
    ล้มเหลว หรือการเรียก HTTPS `/models` เกิดข้อผิดพลาด หากต้องการยกเลิกและพึ่งพา
    แค็ตตาล็อก manifest แบบคงที่ทั้งหมด (สถานการณ์ออฟไลน์ / air-gapped):

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

  <Accordion title="การเลือกทรานสปอร์ต">
    ID โมเดล Claude ใช้ทรานสปอร์ต Anthropic Messages โดยอัตโนมัติ โมเดล GPT,
    o-series และ Gemini ยังคงใช้ทรานสปอร์ต OpenAI Responses OpenClaw
    เลือกทรานสปอร์ตที่ถูกต้องตาม model ref
  </Accordion>

  <Accordion title="ความเข้ากันได้ของคำขอ">
    OpenClaw ส่งส่วนหัวคำขอแบบ IDE ของ Copilot บนทรานสปอร์ต Copilot
    รวมถึงรอบติดตามผลของ Compaction ในตัว, ผลลัพธ์เครื่องมือ และรูปภาพ OpenClaw
    จะไม่เปิดใช้งาน Responses continuation ระดับผู้ให้บริการสำหรับ Copilot เว้นแต่
    พฤติกรรมนั้นได้รับการยืนยันกับ API ของ Copilot แล้ว
  </Accordion>

  <Accordion title="ลำดับการแก้ไขตัวแปรสภาพแวดล้อม">
    OpenClaw แก้ไขการยืนยันตัวตน Copilot จากตัวแปรสภาพแวดล้อมตาม
    ลำดับความสำคัญต่อไปนี้:

    | ลำดับความสำคัญ | ตัวแปร              | หมายเหตุ                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | ลำดับความสำคัญสูงสุด เฉพาะ Copilot |
    | 2        | `GH_TOKEN`            | โทเค็น GitHub CLI (fallback)      |
    | 3        | `GITHUB_TOKEN`        | โทเค็น GitHub มาตรฐาน (ต่ำสุด)   |

    เมื่อตั้งค่าหลายตัวแปร OpenClaw จะใช้ตัวแปรที่มีลำดับความสำคัญสูงสุด
    ขั้นตอนการเข้าสู่ระบบผ่านอุปกรณ์ (`openclaw models auth login-github-copilot`) จะจัดเก็บ
    โทเค็นไว้ในที่เก็บโปรไฟล์การยืนยันตัวตน และมีลำดับความสำคัญเหนือกว่าตัวแปรสภาพแวดล้อมทั้งหมด

  </Accordion>

  <Accordion title="การจัดเก็บโทเค็น">
    การเข้าสู่ระบบจะจัดเก็บโทเค็น GitHub ในที่เก็บโปรไฟล์การยืนยันตัวตนและแลกเปลี่ยนเป็น
    โทเค็น Copilot API เมื่อ OpenClaw ทำงาน คุณไม่จำเป็นต้องจัดการ
    โทเค็นด้วยตนเอง
  </Accordion>
</AccordionGroup>

<Warning>
คำสั่งเข้าสู่ระบบผ่านอุปกรณ์ต้องใช้ TTY แบบโต้ตอบ ใช้การเริ่มต้นใช้งานแบบไม่โต้ตอบ
เมื่อคุณต้องตั้งค่าแบบ headless
</Warning>

## embedding สำหรับการค้นหาหน่วยความจำ

GitHub Copilot ยังสามารถทำหน้าที่เป็นผู้ให้บริการ embedding สำหรับ
[การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้ หากคุณมีการสมัครใช้งาน Copilot และ
เข้าสู่ระบบแล้ว OpenClaw สามารถใช้สิ่งนี้สำหรับ embedding ได้โดยไม่ต้องใช้คีย์ API แยกต่างหาก

### การตรวจจับอัตโนมัติ

เมื่อ `memorySearch.provider` เป็น `"auto"` (ค่าเริ่มต้น) GitHub Copilot จะถูกลองใช้
ที่ลำดับความสำคัญ 15 -- หลัง embedding ภายในเครื่อง แต่ก่อน OpenAI และผู้ให้บริการแบบชำระเงินอื่นๆ
หากมีโทเค็น GitHub OpenClaw จะค้นพบ
โมเดล embedding ที่พร้อมใช้งานจาก Copilot API และเลือกโมเดลที่ดีที่สุดโดยอัตโนมัติ

### การกำหนดค่าแบบชัดเจน

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // ไม่บังคับ: แทนที่โมเดลที่ค้นพบอัตโนมัติ
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### วิธีทำงาน

1. OpenClaw แก้ไขโทเค็น GitHub ของคุณ (จาก env vars หรือโปรไฟล์การยืนยันตัวตน)
2. แลกเปลี่ยนเป็นโทเค็น Copilot API ที่มีอายุสั้น
3. คิวรี endpoint `/models` ของ Copilot เพื่อค้นพบโมเดล embedding ที่พร้อมใช้งาน
4. เลือกโมเดลที่ดีที่สุด (ชอบ `text-embedding-3-small`)
5. ส่งคำขอ embedding ไปยัง endpoint `/embeddings` ของ Copilot

ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผน GitHub ของคุณ หากไม่มีโมเดล embedding
พร้อมใช้งาน OpenClaw จะข้าม Copilot และลองผู้ให้บริการถัดไป

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
</CardGroup>
