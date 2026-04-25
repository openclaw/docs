---
read_when:
    - คุณต้องการใช้ GitHub Copilot เป็นผู้ให้บริการโมเดล
    - คุณต้องการขั้นตอน `openclaw models auth login-github-copilot`
summary: ลงชื่อเข้าใช้ GitHub Copilot จาก OpenClaw โดยใช้ device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T13:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot คือผู้ช่วยเขียนโค้ดด้วย AI ของ GitHub โดยให้สิทธิ์เข้าถึงโมเดล Copilot ตามบัญชีและแผน GitHub ของคุณ OpenClaw สามารถใช้ Copilot เป็นผู้ให้บริการโมเดลได้ 2 วิธี

## สองวิธีในการใช้ Copilot ใน OpenClaw

<Tabs>
  <Tab title="Provider ในตัว (github-copilot)">
    ใช้ขั้นตอน device-login แบบเนทีฟเพื่อรับ GitHub token แล้วแลกเป็น Copilot API tokens เมื่อ OpenClaw ทำงาน นี่คือเส้นทาง **ค่าเริ่มต้น** และง่ายที่สุด เพราะไม่ต้องใช้ VS Code

    <Steps>
      <Step title="รันคำสั่งเข้าสู่ระบบ">
        ```bash
        openclaw models auth login-github-copilot
        ```

        ระบบจะแจ้งให้คุณไปที่ URL และกรอกรหัสแบบใช้ครั้งเดียว โปรดเปิดเทอร์มินัลค้างไว้จนกว่ากระบวนการจะเสร็จสิ้น
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
    ใช้ส่วนขยาย VS Code **Copilot Proxy** เป็นสะพานภายในเครื่อง OpenClaw จะสื่อสารกับ endpoint `/v1` ของ proxy และใช้รายการโมเดลที่คุณกำหนดค่าไว้ที่นั่น

    <Note>
    เลือกวิธีนี้เมื่อคุณรัน Copilot Proxy อยู่แล้วใน VS Code หรือต้องการกำหนดเส้นทางผ่านมัน คุณต้องเปิดใช้ Plugin และทำให้ส่วนขยาย VS Code ทำงานอยู่ตลอด
    </Note>

  </Tab>
</Tabs>

## ตัวเลือก flags

| Flag            | คำอธิบาย                                        |
| --------------- | ------------------------------------------------ |
| `--yes`         | ข้ามข้อความยืนยัน                               |
| `--set-default` | ใช้โมเดลเริ่มต้นที่แนะนำของ provider ด้วย      |

```bash
# ข้ามการยืนยัน
openclaw models auth login-github-copilot --yes

# เข้าสู่ระบบและตั้งค่าโมเดลเริ่มต้นในขั้นตอนเดียว
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="ต้องใช้ TTY แบบโต้ตอบ">
    ขั้นตอน device-login ต้องใช้ TTY แบบโต้ตอบ ให้รันโดยตรงในเทอร์มินัล ไม่ใช่ในสคริปต์แบบไม่โต้ตอบหรือ CI pipeline
  </Accordion>

  <Accordion title="ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผนของคุณ">
    ความพร้อมใช้งานของโมเดล Copilot ขึ้นอยู่กับแผน GitHub ของคุณ หากโมเดลถูกปฏิเสธ ให้ลองใช้อีก ID หนึ่ง (เช่น `github-copilot/gpt-4.1`)
  </Accordion>

  <Accordion title="การเลือก transport">
    Claude model IDs จะใช้ Anthropic Messages transport โดยอัตโนมัติ ส่วนโมเดล GPT, o-series และ Gemini จะยังคงใช้ OpenAI Responses transport OpenClaw จะเลือก transport ที่ถูกต้องตาม model ref
  </Accordion>

  <Accordion title="ความเข้ากันได้ของคำขอ">
    OpenClaw จะส่ง request headers แบบ IDE ของ Copilot บน Copilot transports รวมถึงรอบติดตามผลของ Compaction, tool-result และรูปภาพที่มีอยู่ในตัว โดยจะไม่เปิดใช้การต่อเนื่อง Responses ระดับ provider สำหรับ Copilot เว้นแต่จะมีการยืนยันพฤติกรรมนั้นกับ API ของ Copilot แล้ว
  </Accordion>

  <Accordion title="ลำดับการ resolve ตัวแปร environment">
    OpenClaw จะ resolve การยืนยันตัวตน Copilot จากตัวแปร environment ตามลำดับความสำคัญต่อไปนี้:

    | Priority | Variable              | หมายเหตุ                          |
    | -------- | --------------------- | --------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | ลำดับสูงสุด เฉพาะสำหรับ Copilot   |
    | 2        | `GH_TOKEN`            | token ของ GitHub CLI (fallback)   |
    | 3        | `GITHUB_TOKEN`        | GitHub token มาตรฐาน (ต่ำสุด)     |

    เมื่อมีการตั้งค่าหลายตัวแปร OpenClaw จะใช้ตัวที่มีลำดับความสำคัญสูงสุด ขั้นตอน device-login (`openclaw models auth login-github-copilot`) จะจัดเก็บ token ไว้ใน auth profile store และมีลำดับความสำคัญเหนือกว่าตัวแปร environment ทั้งหมด

  </Accordion>

  <Accordion title="การจัดเก็บ token">
    การเข้าสู่ระบบจะจัดเก็บ GitHub token ไว้ใน auth profile store และแลกเป็น Copilot API token เมื่อ OpenClaw ทำงาน คุณไม่จำเป็นต้องจัดการ token ด้วยตนเอง
  </Accordion>
</AccordionGroup>

<Warning>
ต้องใช้ TTY แบบโต้ตอบ ให้รันคำสั่งเข้าสู่ระบบโดยตรงในเทอร์มินัล ไม่ใช่ภายในสคริปต์แบบ headless หรือ CI job
</Warning>

## embeddings สำหรับ memory search

GitHub Copilot ยังสามารถทำหน้าที่เป็นผู้ให้บริการ embeddings สำหรับ
[memory search](/th/concepts/memory-search) ได้อีกด้วย หากคุณมีการสมัครใช้งาน Copilot และได้เข้าสู่ระบบแล้ว OpenClaw สามารถใช้มันสำหรับ embeddings ได้โดยไม่ต้องมี API key แยกต่างหาก

### การตรวจจับอัตโนมัติ

เมื่อ `memorySearch.provider` เป็น `"auto"` (ค่าเริ่มต้น) ระบบจะลอง GitHub Copilot ที่ลำดับความสำคัญ 15 -- หลัง local embeddings แต่ก่อน OpenAI และผู้ให้บริการแบบเสียเงินรายอื่น หากมี GitHub token ให้ใช้งาน OpenClaw จะค้นหา embedding models ที่พร้อมใช้งานจาก Copilot API และเลือกตัวที่ดีที่สุดโดยอัตโนมัติ

### config แบบระบุชัดเจน

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // ไม่บังคับ: override โมเดลที่ตรวจพบโดยอัตโนมัติ
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### วิธีการทำงาน

1. OpenClaw resolve GitHub token ของคุณ (จากตัวแปร env หรือ auth profile)
2. แลกเป็น Copilot API token แบบอายุสั้น
3. query endpoint `/models` ของ Copilot เพื่อค้นหา embedding models ที่พร้อมใช้งาน
4. เลือกโมเดลที่ดีที่สุด (ให้ความสำคัญกับ `text-embedding-3-small`)
5. ส่งคำขอ embeddings ไปยัง endpoint `/embeddings` ของ Copilot

ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผน GitHub ของคุณ หากไม่มี embedding models ที่พร้อมใช้งาน OpenClaw จะข้าม Copilot และลอง provider ถัดไป

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการนำข้อมูลรับรองกลับมาใช้ซ้ำ
  </Card>
</CardGroup>
