---
read_when:
    - คุณต้องการให้เอเจนต์แสดงการแก้ไขโค้ดหรือ Markdown เป็น diff
    - คุณต้องการ URL ของตัวดูที่พร้อมใช้กับ canvas หรือไฟล์ diff ที่เรนเดอร์แล้ว
    - คุณต้องการอาร์ติแฟกต์ diff แบบชั่วคราวที่ควบคุมได้และมีค่าเริ่มต้นที่ปลอดภัย
sidebarTitle: Diffs
summary: ตัวดู diff แบบอ่านอย่างเดียวและตัวแสดงผลไฟล์สำหรับเอเจนต์ (เครื่องมือ Plugin แบบเลือกได้)
title: Diffs
x-i18n:
    generated_at: "2026-04-26T11:43:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` เป็นเครื่องมือ Plugin แบบเลือกได้ พร้อมคำแนะนำระบบในตัวแบบสั้น และ Skill คู่กันที่เปลี่ยนเนื้อหาการเปลี่ยนแปลงให้เป็นอาร์ติแฟกต์ diff แบบอ่านอย่างเดียวสำหรับเอเจนต์

เครื่องมือนี้รับได้ทั้ง:

- ข้อความ `before` และ `after`
- หรือ `patch` แบบ unified

และสามารถคืนค่าได้เป็น:

- URL ตัวดูผ่าน gateway สำหรับการแสดงผลด้วย canvas
- path ของไฟล์ที่เรนเดอร์แล้ว (PNG หรือ PDF) สำหรับการส่งผ่านข้อความ
- หรือทั้งสองอย่างในคำขอเดียว

เมื่อเปิดใช้งาน Plugin จะเติมคำแนะนำการใช้งานแบบกระชับเข้าไปในพื้นที่ system-prompt ล่วงหน้า และยังเปิดเผย Skill แบบละเอียดสำหรับกรณีที่เอเจนต์ต้องการคำแนะนำที่ครบถ้วนยิ่งขึ้น

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เปิดใช้ Plugin">
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
        โฟลว์ที่เน้น canvas: เอเจนต์เรียก `diffs` ด้วย `mode: "view"` แล้วเปิด `details.viewerUrl` ด้วย `canvas present`
      </Tab>
      <Tab title="file">
        การส่งไฟล์ผ่านแชต: เอเจนต์เรียก `diffs` ด้วย `mode: "file"` แล้วส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`
      </Tab>
      <Tab title="both">
        แบบรวม: เอเจนต์เรียก `diffs` ด้วย `mode: "both"` เพื่อรับทั้งสองอาร์ติแฟกต์ในคำขอเดียว
      </Tab>
    </Tabs>
  </Step>
</Steps>

## ปิดคำแนะนำระบบในตัว

หากคุณต้องการเปิดใช้เครื่องมือ `diffs` ไว้ แต่ปิดคำแนะนำในตัวที่ใส่ใน system-prompt ให้ตั้งค่า `plugins.entries.diffs.hooks.allowPromptInjection` เป็น `false`:

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

ค่านี้จะบล็อก hook `before_prompt_build` ของ plugin diffs ขณะที่ยังคงให้ Plugin, เครื่องมือ และ Skill คู่กันใช้งานได้

หากคุณต้องการปิดทั้งคำแนะนำและตัวเครื่องมือ ให้ปิดใช้ Plugin แทน

## เวิร์กโฟลว์ทั่วไปของเอเจนต์

<Steps>
  <Step title="เรียก diffs">
    เอเจนต์เรียกเครื่องมือ `diffs` พร้อมอินพุต
  </Step>
  <Step title="อ่านรายละเอียด">
    เอเจนต์อ่านฟิลด์ `details` จากผลลัพธ์ที่ตอบกลับ
  </Step>
  <Step title="แสดงผล">
    เอเจนต์จะเปิด `details.viewerUrl` ด้วย `canvas present`, ส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`, หรือทำทั้งสองอย่าง
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

ทุกฟิลด์เป็นแบบเลือกได้ เว้นแต่จะระบุไว้เป็นอย่างอื่น

<ParamField path="before" type="string">
  ข้อความต้นฉบับ จำเป็นเมื่อใช้ร่วมกับ `after` และไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="after" type="string">
  ข้อความที่อัปเดตแล้ว จำเป็นเมื่อใช้ร่วมกับ `before` และไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="patch" type="string">
  ข้อความ diff แบบ unified ใช้ร่วมกับ `before` และ `after` ไม่ได้
</ParamField>
<ParamField path="path" type="string">
  ชื่อไฟล์ที่ใช้แสดงผลสำหรับโหมด before และ after
</ParamField>
<ParamField path="lang" type="string">
  คำใบ้สำหรับ override ภาษาในโหมด before และ after ค่าที่ไม่รู้จักจะ fallback เป็นข้อความล้วน
</ParamField>
<ParamField path="title" type="string">
  override ชื่อของตัวดู
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  โหมดเอาต์พุต ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.mode` alias แบบเลิกใช้แล้ว: `"image"` ทำงานเหมือน `"file"` และยังคงรองรับเพื่อความเข้ากันได้ย้อนหลัง
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ธีมของตัวดู ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.theme`
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  รูปแบบการจัดวาง diff ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.layout`
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  ขยายส่วนที่ไม่เปลี่ยนแปลงเมื่อมีบริบทเต็ม ใช้ได้เฉพาะต่อการเรียกหนึ่งครั้งเท่านั้น (ไม่ใช่คีย์ค่าเริ่มต้นของ Plugin)
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  รูปแบบไฟล์ที่เรนเดอร์แล้ว ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.fileFormat`
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  preset คุณภาพสำหรับการเรนเดอร์ PNG หรือ PDF
</ParamField>
<ParamField path="fileScale" type="number">
  override สเกลของอุปกรณ์ (`1`-`4`)
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  ความกว้างสูงสุดในการเรนเดอร์เป็น CSS pixels (`640`-`2400`)
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL ของอาร์ติแฟกต์เป็นวินาทีสำหรับเอาต์พุตแบบ viewer และ standalone file สูงสุด 21600
</ParamField>
<ParamField path="baseUrl" type="string">
  override ต้นทาง URL ของ viewer มีสิทธิ์เหนือกว่า `viewerBaseUrl` ของ Plugin ต้องเป็น `http` หรือ `https` และไม่มี query/hash
</ParamField>

<AccordionGroup>
  <Accordion title="alias ของอินพุตแบบเก่า">
    ยังรองรับอยู่เพื่อความเข้ากันได้ย้อนหลัง:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="การตรวจสอบและขีดจำกัด">
    - `before` และ `after` สูงสุดอย่างละ 512 KiB
    - `patch` สูงสุด 2 MiB
    - `path` สูงสุด 2048 bytes
    - `lang` สูงสุด 128 bytes
    - `title` สูงสุด 1024 bytes
    - ขีดจำกัดความซับซ้อนของ patch: สูงสุด 128 ไฟล์และรวม 120000 บรรทัด
    - การใช้ `patch` ร่วมกับ `before` หรือ `after` จะถูกปฏิเสธ
    - ขีดจำกัดความปลอดภัยของไฟล์ที่เรนเดอร์แล้ว (ใช้กับทั้ง PNG และ PDF):
      - `fileQuality: "standard"`: สูงสุด 8 MP (8,000,000 rendered pixels)
      - `fileQuality: "hq"`: สูงสุด 14 MP (14,000,000 rendered pixels)
      - `fileQuality: "print"`: สูงสุด 24 MP (24,000,000 rendered pixels)
      - PDF ยังมีขีดจำกัดสูงสุด 50 หน้า
  </Accordion>
</AccordionGroup>

## สัญญา details ของเอาต์พุต

เครื่องมือจะคืน metadata แบบมีโครงสร้างภายใต้ `details`

<AccordionGroup>
  <Accordion title="ฟิลด์ของ Viewer">
    ฟิลด์ที่ใช้ร่วมกันสำหรับโหมดที่สร้าง viewer:

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
  <Accordion title="ฟิลด์ของไฟล์">
    ฟิลด์ของไฟล์เมื่อมีการเรนเดอร์ PNG หรือ PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (ค่าเดียวกับ `filePath` เพื่อความเข้ากันได้กับเครื่องมือ message)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="alias เพื่อความเข้ากันได้">
    ยังส่งคืนค่าต่อไปนี้สำหรับผู้เรียกเดิมด้วย:

    - `format` (ค่าเดียวกับ `fileFormat`)
    - `imagePath` (ค่าเดียวกับ `filePath`)
    - `imageBytes` (ค่าเดียวกับ `fileBytes`)
    - `imageQuality` (ค่าเดียวกับ `fileQuality`)
    - `imageScale` (ค่าเดียวกับ `fileScale`)
    - `imageMaxWidth` (ค่าเดียวกับ `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

สรุปพฤติกรรมของโหมด:

| โหมด      | สิ่งที่ส่งคืน                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| `"view"`  | เฉพาะฟิลด์ของ viewer                                                                                           |
| `"file"`  | เฉพาะฟิลด์ของไฟล์ ไม่มี viewer artifact                                                                        |
| `"both"`  | ฟิลด์ของ viewer พร้อมฟิลด์ของไฟล์ หากการเรนเดอร์ไฟล์ล้มเหลว viewer จะยังคงส่งคืนพร้อม `fileError` และ alias `imageError` |

## ส่วนที่ไม่เปลี่ยนแปลงที่ถูกย่อ

- ตัวดูสามารถแสดงแถวแบบ `N unmodified lines` ได้
- ปุ่มขยายบนแถวเหล่านั้นเป็นแบบมีเงื่อนไข และไม่ได้รับประกันว่าจะมีสำหรับทุกชนิดอินพุต
- ปุ่มขยายจะปรากฏเมื่อ diff ที่เรนเดอร์มีข้อมูลบริบทที่ขยายได้ ซึ่งเป็นกรณีทั่วไปสำหรับอินพุตแบบ before และ after
- สำหรับอินพุต unified patch จำนวนมาก เนื้อหาบริบทที่ถูกละไว้จะไม่มีอยู่ใน patch hunk ที่ parse แล้ว ดังนั้นแถวอาจปรากฏโดยไม่มีปุ่มขยาย ซึ่งเป็นพฤติกรรมที่คาดไว้
- `expandUnchanged` มีผลเฉพาะเมื่อมีบริบทที่ขยายได้อยู่จริง

## ค่าเริ่มต้นของ Plugin

ตั้งค่าค่าเริ่มต้นทั้ง Plugin ใน `~/.openclaw/openclaw.json`:

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

พารามิเตอร์ของเครื่องมือที่ระบุอย่างชัดเจนจะมีสิทธิ์เหนือกว่าค่าเริ่มต้นเหล่านี้

### การตั้งค่า URL ของ viewer แบบคงอยู่

<ParamField path="viewerBaseUrl" type="string">
  fallback ที่ Plugin เป็นเจ้าของสำหรับลิงก์ viewer ที่ส่งคืน เมื่อการเรียกใช้เครื่องมือไม่ได้ส่ง `baseUrl` มา ต้องเป็น `http` หรือ `https` และไม่มี query/hash
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

## การตั้งค่าด้านความปลอดภัย

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: คำขอที่ไม่ใช่ loopback ไปยังเส้นทาง viewer จะถูกปฏิเสธ `true`: อนุญาต viewer ระยะไกลได้ หากเส้นทางแบบ tokenized ถูกต้อง
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

## วงจรชีวิตและการจัดเก็บอาร์ติแฟกต์

- อาร์ติแฟกต์ถูกเก็บไว้ภายใต้โฟลเดอร์ย่อยชั่วคราว: `$TMPDIR/openclaw-diffs`
- metadata ของ viewer artifact มี:
  - artifact ID แบบสุ่ม (20 อักขระฐานสิบหก)
  - token แบบสุ่ม (48 อักขระฐานสิบหก)
  - `createdAt` และ `expiresAt`
  - path ของ `viewer.html` ที่จัดเก็บไว้
- ค่าเริ่มต้นของ TTL ของอาร์ติแฟกต์คือ 30 นาทีเมื่อไม่ได้ระบุ
- TTL สูงสุดของ viewer ที่ยอมรับได้คือ 6 ชั่วโมง
- ระบบจะทำ cleanup แบบฉวยโอกาสหลังจากสร้างอาร์ติแฟกต์
- อาร์ติแฟกต์ที่หมดอายุจะถูกลบ
- cleanup แบบ fallback จะลบโฟลเดอร์เก่าที่ค้างนานกว่า 24 ชั่วโมงเมื่อไม่มี metadata

## พฤติกรรมของ URL viewer และเครือข่าย

เส้นทางของ viewer:

- `/plugins/diffs/view/{artifactId}/{token}`

asset ของ viewer:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

เอกสารของ viewer จะ resolve asset เหล่านั้นโดยสัมพันธ์กับ URL ของ viewer ดังนั้น path prefix ของ `baseUrl` แบบเลือกได้จะถูกคงไว้สำหรับคำขอ asset ทั้งสองรายการด้วย

พฤติกรรมการสร้าง URL:

- หากมี `baseUrl` ในการเรียกใช้เครื่องมือ ระบบจะใช้ค่านั้นหลังจากตรวจสอบอย่างเข้มงวด
- มิฉะนั้น หากมีการตั้งค่า `viewerBaseUrl` ของ Plugin จะใช้ค่านั้น
- หากไม่มี override อย่างใดอย่างหนึ่ง URL ของ viewer จะใช้ loopback `127.0.0.1` เป็นค่าเริ่มต้น
- หากโหมด bind ของ gateway เป็น `custom` และมีการตั้ง `gateway.customBindHost` ระบบจะใช้โฮสต์นั้น

กฎของ `baseUrl`:

- ต้องขึ้นต้นด้วย `http://` หรือ `https://`
- ไม่อนุญาต query และ hash
- อนุญาต origin พร้อม base path แบบเลือกได้

## โมเดลความปลอดภัย

<AccordionGroup>
  <Accordion title="การเสริมความแข็งแรงของ Viewer">
    - ค่าเริ่มต้นเป็น loopback-only
    - ใช้เส้นทาง viewer แบบมี token พร้อมการตรวจสอบ ID และ token อย่างเข้มงวด
    - CSP ของการตอบกลับ viewer:
      - `default-src 'none'`
      - scripts และ assets จาก self เท่านั้น
      - ไม่มี `connect-src` ขาออก
    - จำกัดอัตราการ miss จากระยะไกลเมื่อเปิดใช้การเข้าถึงระยะไกล:
      - ล้มเหลวได้ 40 ครั้งต่อ 60 วินาที
      - lockout 60 วินาที (`429 Too Many Requests`)
  </Accordion>
  <Accordion title="การเสริมความแข็งแรงของการเรนเดอร์ไฟล์">
    - การกำหนดเส้นทางคำขอของเบราว์เซอร์สำหรับ screenshot เป็นแบบ deny-by-default
    - อนุญาตเฉพาะ asset ของ viewer ในเครื่องจาก `http://127.0.0.1/plugins/diffs/assets/*`
    - บล็อกคำขอเครือข่ายภายนอก
  </Accordion>
</AccordionGroup>

## ข้อกำหนดของเบราว์เซอร์สำหรับโหมดไฟล์

`mode: "file"` และ `mode: "both"` ต้องใช้เบราว์เซอร์ที่เข้ากันได้กับ Chromium

ลำดับการ resolve:

<Steps>
  <Step title="คอนฟิก">
    `browser.executablePath` ในคอนฟิกของ OpenClaw
  </Step>
  <Step title="ตัวแปรแวดล้อม">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  </Step>
  <Step title="Fallback ของแพลตฟอร์ม">
    fallback สำหรับการค้นหาคำสั่ง/path ตามแพลตฟอร์ม
  </Step>
</Steps>

ข้อความล้มเหลวที่พบบ่อย:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

แก้ไขโดยติดตั้ง Chrome, Chromium, Edge หรือ Brave หรือกำหนดตัวเลือก executable path ข้างต้นอย่างใดอย่างหนึ่ง

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดจากการตรวจสอบอินพุต">
    - `Provide patch or both before and after text.` — ต้องระบุทั้ง `before` และ `after` หรือระบุ `patch`
    - `Provide either patch or before/after input, not both.` — อย่าผสมโหมดอินพุต
    - `Invalid baseUrl: ...` — ใช้ origin แบบ `http(s)` พร้อม path แบบเลือกได้ และไม่มี query/hash
    - `{field} exceeds maximum size (...)` — ลดขนาด payload
    - การปฏิเสธ patch ขนาดใหญ่ — ลดจำนวนไฟล์ใน patch หรือจำนวนบรรทัดรวม
  </Accordion>
  <Accordion title="การเข้าถึง Viewer">
    - ค่าเริ่มต้นของ URL ของ viewer จะ resolve เป็น `127.0.0.1`
    - สำหรับสถานการณ์ที่ต้องเข้าถึงจากระยะไกล ให้ทำอย่างใดอย่างหนึ่ง:
      - ตั้งค่า `viewerBaseUrl` ของ Plugin หรือ
      - ส่ง `baseUrl` ต่อการเรียกใช้เครื่องมือแต่ละครั้ง หรือ
      - ใช้ `gateway.bind=custom` และ `gateway.customBindHost`
    - หาก `gateway.trustedProxies` รวม loopback ไว้สำหรับ proxy บนโฮสต์เดียวกัน (เช่น Tailscale Serve) คำขอ viewer แบบ loopback ดิบที่ไม่มี forwarded client-IP headers จะล้มเหลวแบบ fail closed โดยตั้งใจ
    - สำหรับ topology ของ proxy แบบนั้น:
      - ควรใช้ `mode: "file"` หรือ `mode: "both"` หากคุณต้องการเพียงไฟล์แนบ หรือ
      - เปิด `security.allowRemoteViewer` อย่างตั้งใจ และตั้งค่า `viewerBaseUrl` ของ Plugin หรือส่ง `baseUrl` ของ proxy/public เมื่อคุณต้องการ URL ของ viewer ที่แชร์ได้
    - เปิด `security.allowRemoteViewer` เฉพาะเมื่อคุณตั้งใจให้มีการเข้าถึง viewer จากภายนอก
  </Accordion>
  <Accordion title="แถวของบรรทัดที่ไม่เปลี่ยนแปลงไม่มีปุ่มขยาย">
    สิ่งนี้อาจเกิดขึ้นได้กับอินพุตแบบ patch เมื่อ patch ไม่ได้มีบริบทที่ขยายได้ติดมาด้วย นี่เป็นพฤติกรรมที่คาดไว้และไม่ได้บ่งชี้ว่า viewer มีปัญหา
  </Accordion>
  <Accordion title="ไม่พบอาร์ติแฟกต์">
    - อาร์ติแฟกต์หมดอายุเพราะ TTL
    - token หรือ path ถูกเปลี่ยน
    - cleanup ลบข้อมูลเก่าทิ้งแล้ว
  </Accordion>
</AccordionGroup>

## แนวทางการใช้งานเชิงปฏิบัติการ

- ควรใช้ `mode: "view"` สำหรับการรีวิวแบบโต้ตอบใน canvas บนเครื่อง
- ควรใช้ `mode: "file"` สำหรับ channel แชตขาออกที่ต้องการไฟล์แนบ
- ควรปิด `allowRemoteViewer` ไว้ เว้นแต่การติดตั้งใช้งานของคุณจำเป็นต้องใช้ URL ของ viewer แบบระยะไกล
- กำหนด `ttlSeconds` แบบสั้นอย่างชัดเจนสำหรับ diff ที่มีข้อมูลอ่อนไหว
- หลีกเลี่ยงการส่ง secret เข้าไปในอินพุตของ diff หากไม่จำเป็น
- หาก channel ของคุณบีบอัดภาพอย่างมาก (เช่น Telegram หรือ WhatsApp) ให้เลือกเอาต์พุตแบบ PDF (`fileFormat: "pdf"`)

<Note>
เอนจินการเรนเดอร์ diff ขับเคลื่อนโดย [Diffs](https://diffs.com)
</Note>

## ที่เกี่ยวข้อง

- [Browser](/th/tools/browser)
- [Plugins](/th/tools/plugin)
- [ภาพรวมของเครื่องมือ](/th/tools)
