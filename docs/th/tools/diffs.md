---
read_when:
    - คุณต้องการให้เอเจนต์แสดงการแก้ไขโค้ดหรือ Markdown ในรูปแบบส่วนต่าง
    - คุณต้องการ URL สำหรับโปรแกรมดูที่พร้อมใช้กับแคนวาส หรือไฟล์ diff ที่เรนเดอร์แล้ว
    - คุณต้องมีอาร์ติแฟกต์ diff ชั่วคราวที่ควบคุมได้ พร้อมค่าเริ่มต้นที่ปลอดภัย
sidebarTitle: Diffs
summary: ตัวดู diff แบบอ่านอย่างเดียวและตัวแสดงผลไฟล์สำหรับเอเจนต์ (เครื่องมือ Plugin แบบไม่บังคับ)
title: ความแตกต่าง
x-i18n:
    generated_at: "2026-05-02T10:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` เป็นเครื่องมือ Plugin แบบไม่บังคับ พร้อมคำแนะนำระบบในตัวแบบสั้น และ Skill คู่กันที่เปลี่ยนเนื้อหาการเปลี่ยนแปลงให้เป็นอาร์ติแฟกต์ diff แบบอ่านอย่างเดียวสำหรับเอเจนต์

รองรับอินพุตได้ทั้ง:

- ข้อความ `before` และ `after`
- `patch` แบบ unified

สามารถส่งคืนได้:

- URL ตัวแสดงผลของ Gateway สำหรับการนำเสนอผ่าน canvas
- พาธไฟล์ที่เรนเดอร์แล้ว (PNG หรือ PDF) สำหรับการส่งผ่านข้อความ
- เอาต์พุตทั้งสองแบบในการเรียกครั้งเดียว

เมื่อเปิดใช้งาน Plugin จะเพิ่มคำแนะนำการใช้งานแบบกระชับไว้ในพื้นที่ system-prompt และยังเปิดเผย Skill แบบละเอียดสำหรับกรณีที่เอเจนต์ต้องการคำแนะนำที่ครบถ้วนกว่า

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="เปิดใช้งาน Plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="เลือกโหมด">
    <Tabs>
      <Tab title="view">
        โฟลว์ที่เน้น canvas เป็นหลัก: เอเจนต์เรียก `diffs` ด้วย `mode: "view"` และเปิด `details.viewerUrl` ด้วย `canvas present`
      </Tab>
      <Tab title="file">
        การส่งไฟล์ผ่านแชต: เอเจนต์เรียก `diffs` ด้วย `mode: "file"` และส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`
      </Tab>
      <Tab title="both">
        แบบรวม: เอเจนต์เรียก `diffs` ด้วย `mode: "both"` เพื่อรับอาร์ติแฟกต์ทั้งสองแบบในการเรียกครั้งเดียว
      </Tab>
    </Tabs>
  </Step>
</Steps>

## ปิดใช้งานคำแนะนำระบบในตัว

หากต้องการเปิดใช้เครื่องมือ `diffs` ต่อไป แต่ปิดคำแนะนำ system-prompt ในตัว ให้ตั้งค่า `plugins.entries.diffs.hooks.allowPromptInjection` เป็น `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

การตั้งค่านี้บล็อก hook `before_prompt_build` ของ Plugin diffs ขณะที่ยังคงให้ Plugin, เครื่องมือ และ Skill คู่กันพร้อมใช้งาน

หากต้องการปิดทั้งคำแนะนำและเครื่องมือ ให้ปิดใช้งาน Plugin แทน

## เวิร์กโฟลว์เอเจนต์ทั่วไป

<Steps>
  <Step title="เรียก diffs">
    เอเจนต์เรียกเครื่องมือ `diffs` พร้อมอินพุต
  </Step>
  <Step title="อ่านรายละเอียด">
    เอเจนต์อ่านฟิลด์ `details` จากการตอบกลับ
  </Step>
  <Step title="นำเสนอ">
    เอเจนต์เปิด `details.viewerUrl` ด้วย `canvas present`, ส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`, หรือทำทั้งสองอย่าง
  </Step>
</Steps>

## ตัวอย่างอินพุต

<Tabs>
  <Tab title="ก่อนและหลัง">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## ข้อมูลอ้างอิงอินพุตของเครื่องมือ

ทุกฟิลด์เป็นแบบไม่บังคับ เว้นแต่จะระบุไว้

<ParamField path="before" type="string">
  ข้อความต้นฉบับ ต้องระบุพร้อม `after` เมื่อไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="after" type="string">
  ข้อความที่อัปเดต ต้องระบุพร้อม `before` เมื่อไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="patch" type="string">
  ข้อความ unified diff ใช้ร่วมกับ `before` และ `after` ไม่ได้
</ParamField>
<ParamField path="path" type="string">
  ชื่อไฟล์ที่แสดงสำหรับโหมดก่อนและหลัง
</ParamField>
<ParamField path="lang" type="string">
  คำใบ้สำหรับแทนที่ภาษาในโหมดก่อนและหลัง ค่าที่ไม่รู้จักจะย้อนกลับไปใช้ข้อความธรรมดา
</ParamField>
<ParamField path="title" type="string">
  การแทนที่ชื่อเรื่องของตัวแสดงผล
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  โหมดเอาต์พุต ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.mode` ชื่อแทนที่เลิกใช้แล้ว: `"image"` ทำงานเหมือน `"file"` และยังยอมรับอยู่เพื่อความเข้ากันได้ย้อนหลัง
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ธีมของตัวแสดงผล ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.theme`
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  เลย์เอาต์ diff ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.layout`
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  ขยายส่วนที่ไม่เปลี่ยนแปลงเมื่อมีบริบทเต็มให้ใช้ได้ ตัวเลือกเฉพาะการเรียกเท่านั้น (ไม่ใช่คีย์ค่าเริ่มต้นของ Plugin)
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  รูปแบบไฟล์ที่เรนเดอร์ ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.fileFormat`
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  พรีเซ็ตคุณภาพสำหรับการเรนเดอร์ PNG หรือ PDF
</ParamField>
<ParamField path="fileScale" type="number">
  การแทนที่สเกลอุปกรณ์ (`1`-`4`)
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  ความกว้างสูงสุดในการเรนเดอร์เป็นพิกเซล CSS (`640`-`2400`)
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL ของอาร์ติแฟกต์เป็นวินาทีสำหรับเอาต์พุตตัวแสดงผลและไฟล์แบบสแตนด์อโลน สูงสุด 21600
</ParamField>
<ParamField path="baseUrl" type="string">
  การแทนที่ origin ของ URL ตัวแสดงผล แทนที่ค่า Plugin `viewerBaseUrl` ต้องเป็น `http` หรือ `https` ไม่มี query/hash
</ParamField>

<AccordionGroup>
  <Accordion title="ชื่อแทนอินพุตเดิม">
    ยังยอมรับอยู่เพื่อความเข้ากันได้ย้อนหลัง:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="การตรวจสอบความถูกต้องและขีดจำกัด">
    - `before` และ `after` แต่ละรายการสูงสุด 512 KiB
    - `patch` สูงสุด 2 MiB
    - `path` สูงสุด 2048 ไบต์
    - `lang` สูงสุด 128 ไบต์
    - `title` สูงสุด 1024 ไบต์
    - เพดานความซับซ้อนของ patch: สูงสุด 128 ไฟล์และรวม 120000 บรรทัด
    - การใช้ `patch` พร้อมกับ `before` หรือ `after` จะถูกปฏิเสธ
    - ขีดจำกัดความปลอดภัยของไฟล์ที่เรนเดอร์ (ใช้กับ PNG และ PDF):
      - `fileQuality: "standard"`: สูงสุด 8 MP (8,000,000 พิกเซลที่เรนเดอร์)
      - `fileQuality: "hq"`: สูงสุด 14 MP (14,000,000 พิกเซลที่เรนเดอร์)
      - `fileQuality: "print"`: สูงสุด 24 MP (24,000,000 พิกเซลที่เรนเดอร์)
      - PDF ยังมีเพดานสูงสุด 50 หน้า

  </Accordion>
</AccordionGroup>

## สัญญารายละเอียดเอาต์พุต

เครื่องมือส่งคืนเมตาดาต้าแบบมีโครงสร้างภายใต้ `details`

<AccordionGroup>
  <Accordion title="ฟิลด์ตัวแสดงผล">
    ฟิลด์ร่วมสำหรับโหมดที่สร้างตัวแสดงผล:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` เมื่อมีให้ใช้)

  </Accordion>
  <Accordion title="ฟิลด์ไฟล์">
    ฟิลด์ไฟล์เมื่อเรนเดอร์ PNG หรือ PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (ค่าเดียวกับ `filePath` เพื่อความเข้ากันได้กับเครื่องมือข้อความ)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="ชื่อแทนเพื่อความเข้ากันได้">
    ส่งคืนด้วยสำหรับผู้เรียกที่มีอยู่:

    - `format` (ค่าเดียวกับ `fileFormat`)
    - `imagePath` (ค่าเดียวกับ `filePath`)
    - `imageBytes` (ค่าเดียวกับ `fileBytes`)
    - `imageQuality` (ค่าเดียวกับ `fileQuality`)
    - `imageScale` (ค่าเดียวกับ `fileScale`)
    - `imageMaxWidth` (ค่าเดียวกับ `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

สรุปพฤติกรรมของโหมด:

| โหมด     | สิ่งที่ส่งคืน                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | ฟิลด์ตัวแสดงผลเท่านั้น                                                                                                    |
| `"file"` | ฟิลด์ไฟล์เท่านั้น ไม่มีอาร์ติแฟกต์ตัวแสดงผล                                                                                  |
| `"both"` | ฟิลด์ตัวแสดงผลพร้อมฟิลด์ไฟล์ หากการเรนเดอร์ไฟล์ล้มเหลว ตัวแสดงผลยังคงส่งคืนพร้อมชื่อแทน `fileError` และ `imageError` |

## ส่วนที่ไม่เปลี่ยนแปลงแบบยุบไว้

- ตัวแสดงผลสามารถแสดงแถวอย่าง `N unmodified lines`
- ปุ่มควบคุมการขยายในแถวเหล่านั้นเป็นแบบมีเงื่อนไข และไม่รับประกันว่าจะมีสำหรับอินพุตทุกชนิด
- ปุ่มควบคุมการขยายจะปรากฏเมื่อ diff ที่เรนเดอร์มีข้อมูลบริบทที่ขยายได้ ซึ่งพบได้ทั่วไปสำหรับอินพุตก่อนและหลัง
- สำหรับอินพุต unified patch จำนวนมาก เนื้อหาบริบทที่ละไว้ไม่มีอยู่ใน patch hunks ที่แยกวิเคราะห์แล้ว ดังนั้นแถวอาจปรากฏโดยไม่มีปุ่มควบคุมการขยาย นี่เป็นพฤติกรรมที่คาดไว้
- `expandUnchanged` ใช้เฉพาะเมื่อมีบริบทที่ขยายได้เท่านั้น

## ค่าเริ่มต้นของ Plugin

ตั้งค่าเริ่มต้นทั่วทั้ง Plugin ใน `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

ค่าเริ่มต้นที่รองรับ:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

พารามิเตอร์เครื่องมือที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นเหล่านี้

### การกำหนดค่า URL ตัวแสดงผลแบบถาวร

<ParamField path="viewerBaseUrl" type="string">
  ค่าทางเลือกสำรองที่ Plugin เป็นเจ้าของสำหรับลิงก์ตัวแสดงผลที่ส่งคืนเมื่อการเรียกเครื่องมือไม่ได้ส่ง `baseUrl` ต้องเป็น `http` หรือ `https` ไม่มี query/hash
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## การกำหนดค่าความปลอดภัย

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: คำขอที่ไม่ใช่ loopback ไปยังเส้นทางตัวแสดงผลจะถูกปฏิเสธ `true`: อนุญาตตัวแสดงผลระยะไกลหากพาธที่มีโทเค็นถูกต้อง
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## วงจรชีวิตและที่จัดเก็บอาร์ติแฟกต์

- อาร์ติแฟกต์ถูกเก็บไว้ภายใต้โฟลเดอร์ย่อยชั่วคราว: `$TMPDIR/openclaw-diffs`
- เมตาดาต้าอาร์ติแฟกต์ของตัวแสดงผลประกอบด้วย:
  - ID อาร์ติแฟกต์แบบสุ่ม (20 อักขระ hex)
  - โทเค็นแบบสุ่ม (48 อักขระ hex)
  - `createdAt` และ `expiresAt`
  - พาธ `viewer.html` ที่จัดเก็บไว้
- TTL อาร์ติแฟกต์เริ่มต้นคือ 30 นาทีเมื่อไม่ได้ระบุ
- TTL ตัวแสดงผลสูงสุดที่ยอมรับคือ 6 ชั่วโมง
- การล้างข้อมูลทำงานแบบตามโอกาสหลังสร้างอาร์ติแฟกต์
- อาร์ติแฟกต์ที่หมดอายุจะถูกลบ
- การล้างข้อมูลสำรองจะลบโฟลเดอร์เก่าที่มีอายุมากกว่า 24 ชั่วโมงเมื่อเมตาดาต้าหายไป

## URL ตัวแสดงผลและพฤติกรรมเครือข่าย

เส้นทางตัวแสดงผล:

- `/plugins/diffs/view/{artifactId}/{token}`

แอสเซ็ตตัวแสดงผล:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

เอกสารตัวแสดงผลจะ resolve แอสเซ็ตเหล่านั้นโดยอิงจาก URL ตัวแสดงผล ดังนั้นคำนำหน้าพาธ `baseUrl` แบบไม่บังคับจึงถูกคงไว้สำหรับคำขอแอสเซ็ตทั้งสองด้วย

พฤติกรรมการสร้าง URL:

- หากระบุ `baseUrl` ในการเรียกเครื่องมือ จะใช้ค่านั้นหลังผ่านการตรวจสอบอย่างเข้มงวด
- มิฉะนั้น หากกำหนดค่า `viewerBaseUrl` ของ Plugin ไว้ จะใช้ค่านั้น
- หากไม่มีการแทนที่ทั้งสองแบบ URL ตัวแสดงผลจะใช้ค่าเริ่มต้นเป็น loopback `127.0.0.1`
- หากโหมด bind ของ Gateway เป็น `custom` และตั้งค่า `gateway.customBindHost` ไว้ จะใช้โฮสต์นั้น

กฎของ `baseUrl`:

- ต้องเป็น `http://` หรือ `https://`
- Query และ hash จะถูกปฏิเสธ
- อนุญาต origin พร้อมพาธฐานแบบไม่บังคับ

## โมเดลความปลอดภัย

<AccordionGroup>
  <Accordion title="การเสริมความปลอดภัยของ Viewer">
    - ค่าเริ่มต้นจำกัดเฉพาะลูปแบ็กเท่านั้น
    - เส้นทาง Viewer แบบมีโทเค็น พร้อมการตรวจสอบ ID และโทเค็นอย่างเข้มงวด
    - CSP การตอบกลับของ Viewer:
      - `default-src 'none'`
      - สคริปต์และแอสเซตจากต้นทางเดียวกันเท่านั้น
      - ไม่มี `connect-src` ขาออก
    - จำกัดอัตราเมื่อไม่พบปลายทางระยะไกล หากเปิดใช้งานการเข้าถึงระยะไกล:
      - ล้มเหลว 40 ครั้งต่อ 60 วินาที
      - ล็อกเอาต์ 60 วินาที (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="การเสริมความปลอดภัยของการเรนเดอร์ไฟล์">
    - การกำหนดเส้นทางคำขอเบราว์เซอร์สำหรับสกรีนช็อตเป็นแบบปฏิเสธโดยค่าเริ่มต้น
    - อนุญาตเฉพาะแอสเซต Viewer ภายในเครื่องจาก `http://127.0.0.1/plugins/diffs/assets/*`
    - คำขอเครือข่ายภายนอกถูกบล็อก

  </Accordion>
</AccordionGroup>

## ข้อกำหนดของเบราว์เซอร์สำหรับโหมดไฟล์

`mode: "file"` และ `mode: "both"` ต้องใช้เบราว์เซอร์ที่เข้ากันได้กับ Chromium

ลำดับการแก้ไขค่า:

<Steps>
  <Step title="การกำหนดค่า">
    `browser.executablePath` ในการกำหนดค่า OpenClaw
  </Step>
  <Step title="ตัวแปรสภาพแวดล้อม">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="ตัวเลือกสำรองของแพลตฟอร์ม">
    ตัวเลือกสำรองสำหรับการค้นหาคำสั่ง/เส้นทางของแพลตฟอร์ม
  </Step>
</Steps>

ข้อความข้อผิดพลาดที่พบบ่อย:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

แก้ไขโดยติดตั้ง Chrome, Chromium, Edge หรือ Brave หรือตั้งค่าหนึ่งในตัวเลือกเส้นทางไฟล์ปฏิบัติการด้านบน

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดการตรวจสอบอินพุต">
    - `Provide patch or both before and after text.` — ใส่ทั้ง `before` และ `after` หรือระบุ `patch`
    - `Provide either patch or before/after input, not both.` — อย่าผสมโหมดอินพุต
    - `Invalid baseUrl: ...` — ใช้ origin แบบ `http(s)` พร้อมเส้นทางที่เป็นทางเลือกได้ ไม่มี query/hash
    - `{field} exceeds maximum size (...)` — ลดขนาด payload
    - การปฏิเสธแพตช์ขนาดใหญ่ — ลดจำนวนไฟล์แพตช์หรือจำนวนบรรทัดทั้งหมด

  </Accordion>
  <Accordion title="การเข้าถึง Viewer">
    - URL ของ Viewer จะ resolve เป็น `127.0.0.1` โดยค่าเริ่มต้น
    - สำหรับสถานการณ์การเข้าถึงระยะไกล ให้ทำอย่างใดอย่างหนึ่ง:
      - ตั้งค่า `viewerBaseUrl` ของ Plugin หรือ
      - ส่ง `baseUrl` ในแต่ละการเรียกเครื่องมือ หรือ
      - ใช้ `gateway.bind=custom` และ `gateway.customBindHost`
    - หาก `gateway.trustedProxies` รวมลูปแบ็กสำหรับพร็อกซีบนโฮสต์เดียวกัน (เช่น Tailscale Serve) คำขอ Viewer แบบลูปแบ็กดิบที่ไม่มีส่วนหัว client-IP ที่ส่งต่อมาจะล้มเหลวแบบปิดตามการออกแบบ
    - สำหรับโทโพโลยีพร็อกซีนี้:
      - แนะนำให้ใช้ `mode: "file"` หรือ `mode: "both"` เมื่อคุณต้องการเพียงไฟล์แนบ หรือ
      - ตั้งใจเปิดใช้ `security.allowRemoteViewer` และตั้งค่า `viewerBaseUrl` ของ Plugin หรือส่ง `baseUrl` ของพร็อกซี/สาธารณะ เมื่อคุณต้องการ URL ของ Viewer ที่แชร์ได้
    - เปิดใช้ `security.allowRemoteViewer` เฉพาะเมื่อคุณต้องการให้เข้าถึง Viewer จากภายนอก

  </Accordion>
  <Accordion title="แถวบรรทัดที่ไม่ได้แก้ไขไม่มีปุ่มขยาย">
    กรณีนี้อาจเกิดขึ้นกับอินพุตแพตช์เมื่อแพตช์ไม่มีบริบทที่ขยายได้ นี่เป็นพฤติกรรมที่คาดไว้และไม่ได้บ่งชี้ว่า Viewer ล้มเหลว
  </Accordion>
  <Accordion title="ไม่พบอาร์ติแฟกต์">
    - อาร์ติแฟกต์หมดอายุเนื่องจาก TTL
    - โทเค็นหรือเส้นทางเปลี่ยนไป
    - การล้างข้อมูลลบข้อมูลเก่าที่ค้างไว้

  </Accordion>
</AccordionGroup>

## คำแนะนำด้านการปฏิบัติงาน

- แนะนำให้ใช้ `mode: "view"` สำหรับการรีวิวแบบโต้ตอบภายในเครื่องในแคนวาส
- แนะนำให้ใช้ `mode: "file"` สำหรับช่องทางแชตขาออกที่ต้องใช้ไฟล์แนบ
- ปิดใช้งาน `allowRemoteViewer` ไว้ เว้นแต่ว่าการปรับใช้ของคุณต้องใช้ URL ของ Viewer ระยะไกล
- ตั้งค่า `ttlSeconds` ให้สั้นอย่างชัดเจนสำหรับ diff ที่มีความอ่อนไหว
- หลีกเลี่ยงการส่งความลับในอินพุต diff เมื่อไม่จำเป็น
- หากช่องทางของคุณบีบอัดรูปภาพอย่างหนัก (เช่น Telegram หรือ WhatsApp) แนะนำให้ใช้เอาต์พุต PDF (`fileFormat: "pdf"`)

<Note>
เอนจินการเรนเดอร์ diff ขับเคลื่อนโดย [Diffs](https://diffs.com)
</Note>

## ที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [Plugins](/th/tools/plugin)
- [ภาพรวมเครื่องมือ](/th/tools)
