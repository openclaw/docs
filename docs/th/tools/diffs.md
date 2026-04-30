---
read_when:
    - คุณต้องการให้เอเจนต์แสดงโค้ดหรือการแก้ไข Markdown เป็น diff
    - คุณต้องการ URL สำหรับตัวแสดงผลที่พร้อมใช้งานบนแคนวาส หรือไฟล์เปรียบเทียบความแตกต่างที่เรนเดอร์แล้ว
    - คุณต้องมีอาร์ติแฟกต์ diff แบบชั่วคราวที่ควบคุมได้ พร้อมค่าเริ่มต้นที่ปลอดภัย
sidebarTitle: Diffs
summary: ตัวดู diff และตัวเรนเดอร์ไฟล์แบบอ่านอย่างเดียวสำหรับเอเจนต์ (เครื่องมือ Plugin เสริม)
title: ส่วนต่าง
x-i18n:
    generated_at: "2026-04-30T10:19:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` เป็นเครื่องมือ Plugin แบบไม่บังคับที่มีคำแนะนำระบบในตัวแบบสั้น และมี Skills คู่กัน ซึ่งเปลี่ยนเนื้อหาการเปลี่ยนแปลงให้เป็นอาร์ติแฟกต์ดิฟฟ์แบบอ่านอย่างเดียวสำหรับเอเจนต์

รองรับอินพุตอย่างใดอย่างหนึ่ง:

- ข้อความ `before` และ `after`
- `patch` แบบ unified

สามารถส่งคืนได้:

- URL ตัวแสดงผลของ Gateway สำหรับการนำเสนอบนแคนวาส
- พาธไฟล์ที่เรนเดอร์แล้ว (PNG หรือ PDF) สำหรับการส่งผ่านข้อความ
- เอาต์พุตทั้งสองแบบในการเรียกครั้งเดียว

เมื่อเปิดใช้งาน Plugin จะเติมคำแนะนำการใช้งานแบบกระชับไว้หน้าพื้นที่พรอมป์ระบบ และยังเปิดเผย Skills แบบละเอียดสำหรับกรณีที่เอเจนต์ต้องการคำแนะนำที่ครบถ้วนกว่า

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        โฟลว์ที่เน้นแคนวาสก่อน: เอเจนต์เรียก `diffs` ด้วย `mode: "view"` และเปิด `details.viewerUrl` ด้วย `canvas present`
      </Tab>
      <Tab title="file">
        การส่งไฟล์ในแชต: เอเจนต์เรียก `diffs` ด้วย `mode: "file"` และส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`
      </Tab>
      <Tab title="both">
        แบบรวม: เอเจนต์เรียก `diffs` ด้วย `mode: "both"` เพื่อรับอาร์ติแฟกต์ทั้งสองแบบในการเรียกครั้งเดียว
      </Tab>
    </Tabs>
  </Step>
</Steps>

## ปิดใช้งานคำแนะนำระบบในตัว

หากคุณต้องการให้เครื่องมือ `diffs` เปิดใช้งานอยู่ แต่ปิดคำแนะนำพรอมป์ระบบในตัว ให้ตั้งค่า `plugins.entries.diffs.hooks.allowPromptInjection` เป็น `false`:

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

การตั้งค่านี้จะบล็อก hook `before_prompt_build` ของ Plugin diffs ขณะที่ยังคงทำให้ Plugin เครื่องมือ และ Skills คู่กันพร้อมใช้งาน

หากคุณต้องการปิดทั้งคำแนะนำและเครื่องมือ ให้ปิดใช้งาน Plugin แทน

## เวิร์กโฟลว์เอเจนต์ทั่วไป

<Steps>
  <Step title="Call diffs">
    เอเจนต์เรียกเครื่องมือ `diffs` พร้อมอินพุต
  </Step>
  <Step title="Read details">
    เอเจนต์อ่านฟิลด์ `details` จากการตอบกลับ
  </Step>
  <Step title="Present">
    เอเจนต์อาจเปิด `details.viewerUrl` ด้วย `canvas present`, ส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`, หรือทำทั้งสองอย่าง
  </Step>
</Steps>

## ตัวอย่างอินพุต

<Tabs>
  <Tab title="Before and after">
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

ฟิลด์ทั้งหมดเป็นแบบไม่บังคับ เว้นแต่จะระบุไว้

<ParamField path="before" type="string">
  ข้อความต้นฉบับ จำเป็นต้องใช้ร่วมกับ `after` เมื่อไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="after" type="string">
  ข้อความที่อัปเดตแล้ว จำเป็นต้องใช้ร่วมกับ `before` เมื่อไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="patch" type="string">
  ข้อความดิฟฟ์แบบ unified ใช้ร่วมกับ `before` และ `after` ไม่ได้
</ParamField>
<ParamField path="path" type="string">
  ชื่อไฟล์ที่จะแสดงสำหรับโหมด before and after
</ParamField>
<ParamField path="lang" type="string">
  คำใบ้สำหรับแทนที่ภาษาสำหรับโหมด before and after ค่าที่ไม่รู้จักจะย้อนกลับไปใช้ข้อความธรรมดา
</ParamField>
<ParamField path="title" type="string">
  ค่าทับชื่อของตัวแสดงผล
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  โหมดเอาต์พุต ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.mode` นามแฝงที่เลิกแนะนำแล้ว: `"image"` ทำงานเหมือน `"file"` และยังยอมรับอยู่เพื่อความเข้ากันได้ย้อนหลัง
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ธีมของตัวแสดงผล ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.theme`
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  เลย์เอาต์ดิฟฟ์ ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.layout`
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  ขยายส่วนที่ไม่เปลี่ยนแปลงเมื่อมีบริบทเต็ม ตัวเลือกเฉพาะต่อการเรียกเท่านั้น (ไม่ใช่คีย์ค่าเริ่มต้นของ Plugin)
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  รูปแบบไฟล์ที่เรนเดอร์แล้ว ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.fileFormat`
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  พรีเซ็ตคุณภาพสำหรับการเรนเดอร์ PNG หรือ PDF
</ParamField>
<ParamField path="fileScale" type="number">
  ค่าทับสเกลอุปกรณ์ (`1`-`4`)
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  ความกว้างสูงสุดของการเรนเดอร์เป็นพิกเซล CSS (`640`-`2400`)
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL ของอาร์ติแฟกต์เป็นวินาทีสำหรับเอาต์พุตตัวแสดงผลและไฟล์แบบสแตนด์อโลน สูงสุด 21600
</ParamField>
<ParamField path="baseUrl" type="string">
  ค่าทับ origin ของ URL ตัวแสดงผล แทนที่ `viewerBaseUrl` ของ Plugin ต้องเป็น `http` หรือ `https` และไม่มี query/hash
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    ยังยอมรับอยู่เพื่อความเข้ากันได้ย้อนหลัง:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` และ `after` แต่ละรายการสูงสุด 512 KiB
    - `patch` สูงสุด 2 MiB
    - `path` สูงสุด 2048 ไบต์
    - `lang` สูงสุด 128 ไบต์
    - `title` สูงสุด 1024 ไบต์
    - ขีดจำกัดความซับซ้อนของแพตช์: สูงสุด 128 ไฟล์ และรวมทั้งหมด 120000 บรรทัด
    - ไม่ยอมรับ `patch` ร่วมกับ `before` หรือ `after`
    - ขีดจำกัดความปลอดภัยของไฟล์ที่เรนเดอร์แล้ว (ใช้กับ PNG และ PDF):
      - `fileQuality: "standard"`: สูงสุด 8 MP (8,000,000 พิกเซลที่เรนเดอร์)
      - `fileQuality: "hq"`: สูงสุด 14 MP (14,000,000 พิกเซลที่เรนเดอร์)
      - `fileQuality: "print"`: สูงสุด 24 MP (24,000,000 พิกเซลที่เรนเดอร์)
      - PDF ยังมีขีดจำกัดสูงสุด 50 หน้า

  </Accordion>
</AccordionGroup>

## สัญญารายละเอียดเอาต์พุต

เครื่องมือจะส่งคืนเมทาดาทาแบบมีโครงสร้างภายใต้ `details`

<AccordionGroup>
  <Accordion title="Viewer fields">
    ฟิลด์ที่ใช้ร่วมกันสำหรับโหมดที่สร้างตัวแสดงผล:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` เมื่อมี)

  </Accordion>
  <Accordion title="File fields">
    ฟิลด์ไฟล์เมื่อมีการเรนเดอร์ PNG หรือ PDF:

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
  <Accordion title="Compatibility aliases">
    ส่งคืนสำหรับตัวเรียกที่มีอยู่ด้วย:

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
| `"view"` | เฉพาะฟิลด์ตัวแสดง                                                                                                    |
| `"file"` | เฉพาะฟิลด์ไฟล์ ไม่มีอาร์ติแฟกต์ของตัวแสดง                                                                                  |
| `"both"` | ฟิลด์ตัวแสดงพร้อมฟิลด์ไฟล์ หากการเรนเดอร์ไฟล์ล้มเหลว ตัวแสดงยังคงส่งคืนพร้อมนามแฝง `fileError` และ `imageError` |

## ส่วนที่ไม่เปลี่ยนแปลงที่ยุบไว้

- ตัวแสดงสามารถแสดงแถวอย่างเช่น `N unmodified lines`
- ตัวควบคุมการขยายบนแถวเหล่านั้นเป็นแบบมีเงื่อนไข และไม่รับประกันว่าจะมีสำหรับอินพุตทุกชนิด
- ตัวควบคุมการขยายจะปรากฏเมื่อ diff ที่เรนเดอร์มีข้อมูลบริบทที่ขยายได้ ซึ่งเป็นเรื่องปกติสำหรับอินพุตก่อนและหลัง
- สำหรับอินพุตแพตช์แบบรวมหลายกรณี เนื้อหาบริบทที่ละไว้ไม่มีอยู่ในฮังก์ของแพตช์ที่แยกวิเคราะห์แล้ว ดังนั้นแถวอาจปรากฏโดยไม่มีตัวควบคุมการขยาย นี่เป็นพฤติกรรมที่คาดไว้
- `expandUnchanged` ใช้เฉพาะเมื่อมีบริบทที่ขยายได้เท่านั้น

## ค่าเริ่มต้นของ Plugin

ตั้งค่าเริ่มต้นทั้ง Plugin ใน `~/.openclaw/openclaw.json`:

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

พารามิเตอร์ของเครื่องมือที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นเหล่านี้

### การกำหนดค่า URL ตัวแสดงแบบถาวร

<ParamField path="viewerBaseUrl" type="string">
  ค่าทางเลือกสำรองที่ Plugin เป็นเจ้าของสำหรับลิงก์ตัวแสดงที่ส่งคืน เมื่อการเรียกเครื่องมือไม่ได้ส่ง `baseUrl` ต้องเป็น `http` หรือ `https` และไม่มี query/hash
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
  `false`: คำขอที่ไม่ใช่ลูปแบ็กไปยังเส้นทางตัวแสดงจะถูกปฏิเสธ `true`: อนุญาตตัวแสดงระยะไกลหากเส้นทางที่มีโทเค็นถูกต้อง
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

## วงจรชีวิตและพื้นที่จัดเก็บอาร์ติแฟกต์

- อาร์ติแฟกต์ถูกจัดเก็บใต้โฟลเดอร์ย่อยชั่วคราว: `$TMPDIR/openclaw-diffs`
- เมทาดาทาของอาร์ติแฟกต์ตัวแสดงประกอบด้วย:
  - ID อาร์ติแฟกต์แบบสุ่ม (20 อักขระฐานสิบหก)
  - โทเค็นแบบสุ่ม (48 อักขระฐานสิบหก)
  - `createdAt` และ `expiresAt`
  - พาธ `viewer.html` ที่จัดเก็บไว้
- TTL อาร์ติแฟกต์เริ่มต้นคือ 30 นาทีเมื่อไม่ได้ระบุ
- TTL สูงสุดของตัวแสดงที่ยอมรับคือ 6 ชั่วโมง
- การล้างข้อมูลจะทำงานตามโอกาสหลังจากสร้างอาร์ติแฟกต์
- อาร์ติแฟกต์ที่หมดอายุจะถูกลบ
- การล้างข้อมูลสำรองจะลบโฟลเดอร์ค้างที่เก่ากว่า 24 ชั่วโมงเมื่อไม่มีเมทาดาทา

## URL ตัวแสดงและพฤติกรรมเครือข่าย

เส้นทางตัวแสดง:

- `/plugins/diffs/view/{artifactId}/{token}`

แอสเซตของตัวแสดง:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

เอกสารตัวแสดงจะแก้หาแอสเซตเหล่านั้นโดยอิงจาก URL ตัวแสดง ดังนั้นคำนำหน้าพาธ `baseUrl` ที่เป็นตัวเลือกจะถูกคงไว้สำหรับคำขอแอสเซตทั้งสองด้วย

พฤติกรรมการสร้าง URL:

- หากมี `baseUrl` ของการเรียกเครื่องมือ ระบบจะใช้ค่านั้นหลังจากตรวจสอบอย่างเข้มงวด
- มิฉะนั้น หากกำหนดค่า `viewerBaseUrl` ของ Plugin ไว้ ระบบจะใช้ค่านั้น
- หากไม่มีการแทนที่ทั้งสองอย่าง URL ตัวแสดงจะมีค่าเริ่มต้นเป็นลูปแบ็ก `127.0.0.1`
- หากโหมดการผูกของ Gateway เป็น `custom` และตั้งค่า `gateway.customBindHost` ไว้ ระบบจะใช้โฮสต์นั้น

กฎของ `baseUrl`:

- ต้องเป็น `http://` หรือ `https://`
- query และ hash จะถูกปฏิเสธ
- อนุญาต origin พร้อมพาธฐานที่เป็นตัวเลือก

## โมเดลความปลอดภัย

<AccordionGroup>
  <Accordion title="การเพิ่มความปลอดภัยให้ตัวแสดง">
    - จำกัดเฉพาะลูปแบ็กตามค่าเริ่มต้น
    - เส้นทางตัวแสดงที่มีโทเค็น พร้อมการตรวจสอบ ID และโทเค็นอย่างเข้มงวด
    - CSP ของการตอบกลับตัวแสดง:
      - `default-src 'none'`
      - สคริปต์และแอสเซตจากตัวเองเท่านั้น
      - ไม่มี `connect-src` ขาออก
    - การจำกัดอัตราการพลาดจากระยะไกลเมื่อเปิดใช้งานการเข้าถึงระยะไกล:
      - ล้มเหลว 40 ครั้งต่อ 60 วินาที
      - ล็อกเอาต์ 60 วินาที (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="การเพิ่มความปลอดภัยในการเรนเดอร์ไฟล์">
    - การกำหนดเส้นทางคำขอของเบราว์เซอร์สำหรับภาพหน้าจอเป็นแบบปฏิเสธโดยค่าเริ่มต้น
    - อนุญาตเฉพาะแอสเซ็ตตัวแสดงผลในเครื่องจาก `http://127.0.0.1/plugins/diffs/assets/*`
    - คำขอเครือข่ายภายนอกจะถูกบล็อก

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
  <Step title="ทางเลือกสำรองของแพลตฟอร์ม">
    ทางเลือกสำรองสำหรับการค้นหาคำสั่ง/พาธของแพลตฟอร์ม
  </Step>
</Steps>

ข้อความความล้มเหลวที่พบบ่อย:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

แก้ไขโดยติดตั้ง Chrome, Chromium, Edge หรือ Brave หรือตั้งค่าหนึ่งในตัวเลือกพาธไฟล์ปฏิบัติการด้านบน

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดในการตรวจสอบอินพุต">
    - `Provide patch or both before and after text.` — ใส่ทั้ง `before` และ `after` หรือระบุ `patch`
    - `Provide either patch or before/after input, not both.` — อย่าผสมโหมดอินพุต
    - `Invalid baseUrl: ...` — ใช้ต้นทาง `http(s)` พร้อมพาธแบบไม่บังคับ โดยไม่มีคิวรี/แฮช
    - `{field} exceeds maximum size (...)` — ลดขนาดเพย์โหลด
    - การปฏิเสธแพตช์ขนาดใหญ่ — ลดจำนวนไฟล์แพตช์หรือจำนวนบรรทัดรวม

  </Accordion>
  <Accordion title="การเข้าถึงตัวแสดงผล">
    - URL ของตัวแสดงผลจะแก้เป็น `127.0.0.1` โดยค่าเริ่มต้น
    - สำหรับสถานการณ์การเข้าถึงระยะไกล ให้เลือกอย่างใดอย่างหนึ่ง:
      - ตั้งค่า `viewerBaseUrl` ของ Plugin หรือ
      - ส่ง `baseUrl` ในแต่ละการเรียกเครื่องมือ หรือ
      - ใช้ `gateway.bind=custom` และ `gateway.customBindHost`
    - หาก `gateway.trustedProxies` รวม loopback สำหรับพร็อกซีโฮสต์เดียวกัน (เช่น Tailscale Serve) คำขอตัวแสดงผลผ่าน loopback แบบดิบที่ไม่มีส่วนหัว client-IP ที่ส่งต่อมาจะล้มเหลวแบบปิดตามการออกแบบ
    - สำหรับโทโพโลยีพร็อกซีนั้น:
      - ควรใช้ `mode: "file"` หรือ `mode: "both"` เมื่อคุณต้องการเฉพาะไฟล์แนบ หรือ
      - เปิดใช้ `security.allowRemoteViewer` โดยตั้งใจ และตั้งค่า `viewerBaseUrl` ของ Plugin หรือส่ง `baseUrl` แบบพร็อกซี/สาธารณะเมื่อคุณต้องการ URL ตัวแสดงผลที่แชร์ได้
    - เปิดใช้ `security.allowRemoteViewer` เฉพาะเมื่อคุณตั้งใจให้มีการเข้าถึงตัวแสดงผลจากภายนอก

  </Accordion>
  <Accordion title="แถวบรรทัดที่ไม่ได้แก้ไขไม่มีปุ่มขยาย">
    สิ่งนี้อาจเกิดขึ้นกับอินพุตแพตช์เมื่อแพตช์ไม่มีบริบทที่ขยายได้ ซึ่งเป็นพฤติกรรมที่คาดไว้และไม่ได้บ่งชี้ว่าตัวแสดงผลล้มเหลว
  </Accordion>
  <Accordion title="ไม่พบอาร์ติแฟกต์">
    - อาร์ติแฟกต์หมดอายุเนื่องจาก TTL
    - โทเค็นหรือพาธเปลี่ยนไป
    - การล้างข้อมูลนำข้อมูลเก่าออก

  </Accordion>
</AccordionGroup>

## คำแนะนำด้านการปฏิบัติงาน

- ควรใช้ `mode: "view"` สำหรับการรีวิวแบบโต้ตอบในเครื่องบนแคนวาส
- ควรใช้ `mode: "file"` สำหรับช่องแชตขาออกที่ต้องมีไฟล์แนบ
- ปิดใช้งาน `allowRemoteViewer` ไว้ เว้นแต่การปรับใช้ของคุณต้องใช้ URL ตัวแสดงผลระยะไกล
- ตั้งค่า `ttlSeconds` แบบสั้นอย่างชัดเจนสำหรับ diff ที่ละเอียดอ่อน
- หลีกเลี่ยงการส่งความลับในอินพุต diff เมื่อไม่จำเป็น
- หากช่องของคุณบีบอัดรูปภาพอย่างหนัก (เช่น Telegram หรือ WhatsApp) ควรใช้เอาต์พุต PDF (`fileFormat: "pdf"`)

<Note>
เอนจินเรนเดอร์ diff ขับเคลื่อนโดย [Diffs](https://diffs.com)
</Note>

## ที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [Plugin](/th/tools/plugin)
- [ภาพรวมเครื่องมือ](/th/tools)
