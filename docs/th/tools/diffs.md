---
read_when:
    - คุณต้องการให้เอเจนต์แสดงการแก้ไขโค้ดหรือ Markdown เป็น diff
    - คุณต้องการ URL สำหรับตัวแสดงผลที่พร้อมใช้งานบนแคนวาส หรือไฟล์ diff ที่เรนเดอร์แล้ว
    - คุณต้องมีอาร์ติแฟกต์ diff แบบชั่วคราวที่ควบคุมได้ พร้อมค่าเริ่มต้นที่ปลอดภัย
sidebarTitle: Diffs
summary: ตัวแสดง diff แบบอ่านอย่างเดียวและตัวเรนเดอร์ไฟล์สำหรับเอเจนต์ (เครื่องมือ Plugin เสริม)
title: Diff
x-i18n:
    generated_at: "2026-06-27T18:26:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` เป็นเครื่องมือ Plugin เสริมที่มีคำแนะนำระบบแบบสั้นในตัว และมี skill คู่กันสำหรับแปลงเนื้อหาการเปลี่ยนแปลงให้เป็นอาร์ติแฟกต์ diff แบบอ่านอย่างเดียวสำหรับเอเจนต์

รับอินพุตได้ทั้ง:

- ข้อความ `before` และ `after`
- `patch` แบบ unified

สามารถส่งคืน:

- URL ตัวแสดงผลของ Gateway สำหรับการนำเสนอผ่าน canvas
- พาธไฟล์ที่เรนเดอร์แล้ว (PNG หรือ PDF) สำหรับการส่งผ่านข้อความ
- เอาต์พุตทั้งสองอย่างในการเรียกครั้งเดียว

เมื่อเปิดใช้งาน Plugin จะเติมคำแนะนำการใช้งานแบบกระชับไว้ในพื้นที่ system prompt และยังเปิดเผย skill แบบละเอียดสำหรับกรณีที่เอเจนต์ต้องการคำแนะนำครบถ้วนกว่า

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
        โฟลว์ที่เน้น Canvas ก่อน: เอเจนต์เรียก `diffs` ด้วย `mode: "view"` และเปิด `details.viewerUrl` ด้วย `canvas present`
      </Tab>
      <Tab title="file">
        การส่งไฟล์ในแชต: เอเจนต์เรียก `diffs` ด้วย `mode: "file"` และส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`
      </Tab>
      <Tab title="both">
        แบบรวม: เอเจนต์เรียก `diffs` ด้วย `mode: "both"` เพื่อรับอาร์ติแฟกต์ทั้งสองอย่างในการเรียกครั้งเดียว
      </Tab>
    </Tabs>
  </Step>
</Steps>

## ปิดใช้งานคำแนะนำระบบในตัว

หากต้องการเปิดใช้เครื่องมือ `diffs` ต่อไป แต่ปิดใช้งานคำแนะนำ system prompt ในตัว ให้ตั้งค่า `plugins.entries.diffs.hooks.allowPromptInjection` เป็น `false`:

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

การตั้งค่านี้จะบล็อก hook `before_prompt_build` ของ Plugin diffs ขณะยังคงให้ Plugin, เครื่องมือ และ skill คู่กันพร้อมใช้งาน

หากต้องการปิดทั้งคำแนะนำและเครื่องมือ ให้ปิดใช้งาน Plugin แทน

## เวิร์กโฟลว์ทั่วไปของเอเจนต์

<Steps>
  <Step title="เรียก diffs">
    เอเจนต์เรียกเครื่องมือ `diffs` พร้อมอินพุต
  </Step>
  <Step title="อ่าน details">
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

## อ้างอิงอินพุตของเครื่องมือ

ฟิลด์ทั้งหมดเป็นทางเลือก เว้นแต่จะระบุไว้

<ParamField path="before" type="string">
  ข้อความต้นฉบับ จำเป็นต้องใช้ร่วมกับ `after` เมื่อไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="after" type="string">
  ข้อความที่อัปเดตแล้ว จำเป็นต้องใช้ร่วมกับ `before` เมื่อไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="patch" type="string">
  ข้อความ unified diff ใช้ร่วมกับ `before` และ `after` ไม่ได้
</ParamField>
<ParamField path="path" type="string">
  ชื่อไฟล์ที่แสดงสำหรับโหมดก่อนและหลัง
</ParamField>
<ParamField path="lang" type="string">
  คำใบ้สำหรับบังคับภาษาในโหมดก่อนและหลัง ค่าที่ไม่รู้จักและภาษาที่อยู่นอกชุดตัวแสดงผลเริ่มต้นจะย้อนกลับไปเป็นข้อความธรรมดา เว้นแต่จะติดตั้ง Plugin
  Diff Viewer Language Pack
</ParamField>

<ParamField path="title" type="string">
  ค่าทับชื่อเรื่องของตัวแสดงผล
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  โหมดเอาต์พุต ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.mode` alias ที่เลิกใช้แล้ว: `"image"` ทำงานเหมือน `"file"` และยังคงรับเพื่อความเข้ากันได้ย้อนหลัง
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ธีมของตัวแสดงผล ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.theme`
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  เลย์เอาต์ diff ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.layout`
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  ขยายส่วนที่ไม่เปลี่ยนแปลงเมื่อมีบริบทครบถ้วน ใช้ได้เฉพาะตัวเลือกต่อการเรียกเท่านั้น (ไม่ใช่คีย์ค่าเริ่มต้นของ Plugin)
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
  ความกว้างเรนเดอร์สูงสุดในพิกเซล CSS (`640`-`2400`)
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL ของอาร์ติแฟกต์เป็นวินาทีสำหรับเอาต์พุตตัวแสดงผลและไฟล์แบบสแตนด์อโลน สูงสุด 21600
</ParamField>
<ParamField path="baseUrl" type="string">
  ค่าทับ origin ของ URL ตัวแสดงผล ทับค่า `viewerBaseUrl` ของ Plugin ต้องเป็น `http` หรือ `https` และไม่มี query/hash
</ParamField>

<AccordionGroup>
  <Accordion title="alias อินพุตแบบเดิม">
    ยังคงรับเพื่อความเข้ากันได้ย้อนหลัง:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="การตรวจสอบความถูกต้องและขีดจำกัด">
    - `before` และ `after` แต่ละรายการมีขนาดสูงสุด 512 KiB
    - `patch` สูงสุด 2 MiB
    - `path` สูงสุด 2048 ไบต์
    - `lang` สูงสุด 128 ไบต์
    - `title` สูงสุด 1024 ไบต์
    - เพดานความซับซ้อนของ patch: สูงสุด 128 ไฟล์ และรวม 120000 บรรทัด
    - การส่ง `patch` พร้อมกับ `before` หรือ `after` จะถูกปฏิเสธ
    - ขีดจำกัดความปลอดภัยของไฟล์ที่เรนเดอร์แล้ว (ใช้กับ PNG และ PDF):
      - `fileQuality: "standard"`: สูงสุด 8 MP (8,000,000 พิกเซลที่เรนเดอร์)
      - `fileQuality: "hq"`: สูงสุด 14 MP (14,000,000 พิกเซลที่เรนเดอร์)
      - `fileQuality: "print"`: สูงสุด 24 MP (24,000,000 พิกเซลที่เรนเดอร์)
      - PDF ยังมีจำนวนสูงสุด 50 หน้า

  </Accordion>
</AccordionGroup>

## การไฮไลต์ไวยากรณ์

OpenClaw มีการไฮไลต์ไวยากรณ์สำหรับซอร์สโค้ด การกำหนดค่า และภาษาเอกสารที่ใช้ทั่วไป:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, และ `toml`

alias ทั่วไป เช่น `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, และ `ps1` จะถูกทำให้เป็นภาษาค่าเริ่มต้นเหล่านั้นตามมาตรฐาน

ติดตั้ง Plugin Diff Viewer Language Pack เพื่อไฮไลต์ภาษาอื่น ๆ:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

เมื่อมีแพ็กภาษาแล้ว OpenClaw จะไฮไลต์ภาษาได้มากขึ้นมาก หากไม่ได้ติดตั้งแพ็กนี้ ไฟล์ที่อยู่นอกรายการเริ่มต้นยังคงแสดงเป็นข้อความธรรมดาที่อ่านได้ ตัวอย่างได้แก่ Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI และไฟล์ diff

ดูรายละเอียดได้ที่ [Plugin Diffs Language Pack](/th/plugins/reference/diffs-language-pack) และดูแค็ตตาล็อกภาษาและชื่อแทนต้นทางของ Shiki ได้ที่ [ภาษา Shiki](https://shiki.style/languages)

## สัญญารายละเอียดเอาต์พุต

เครื่องมือส่งคืนเมทาดาทาแบบมีโครงสร้างภายใต้ `details`

<AccordionGroup>
  <Accordion title="Viewer fields">
    ฟิลด์ที่ใช้ร่วมกันสำหรับโหมดที่สร้างตัวแสดง:

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
    ส่งคืนให้ผู้เรียกเดิมด้วย:

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
| `"file"` | เฉพาะฟิลด์ไฟล์ ไม่มีอาร์ติแฟกต์ตัวแสดง                                                                                  |
| `"both"` | ฟิลด์ตัวแสดงพร้อมฟิลด์ไฟล์ หากการเรนเดอร์ไฟล์ล้มเหลว ตัวแสดงยังคงถูกส่งคืนพร้อม alias `fileError` และ `imageError` |

## ส่วนที่ไม่เปลี่ยนแปลงซึ่งถูกยุบ

- ตัวแสดงสามารถแสดงแถวอย่าง `N unmodified lines` ได้
- ตัวควบคุมการขยายบนแถวเหล่านั้นเป็นแบบมีเงื่อนไขและไม่รับประกันว่าจะมีสำหรับอินพุตทุกชนิด
- ตัวควบคุมการขยายจะปรากฏเมื่อ diff ที่เรนเดอร์มีข้อมูลบริบทที่ขยายได้ ซึ่งเป็นเรื่องปกติสำหรับอินพุตก่อนและหลัง
- สำหรับอินพุตแพตช์แบบ unified จำนวนมาก เนื้อหาบริบทที่ถูกละไว้จะไม่มีอยู่ใน hunk ของแพตช์ที่แยกวิเคราะห์แล้ว ดังนั้นแถวจึงอาจปรากฏโดยไม่มีตัวควบคุมการขยายได้ ซึ่งเป็นพฤติกรรมที่คาดไว้
- `expandUnchanged` จะมีผลเฉพาะเมื่อมีบริบทที่ขยายได้

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
            ttlSeconds: 21600,
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
- `ttlSeconds`

พารามิเตอร์เครื่องมือที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นเหล่านี้

### การกำหนดค่า URL ตัวแสดงแบบถาวร

<ParamField path="viewerBaseUrl" type="string">
  ทางเลือกสำรองที่ Plugin เป็นเจ้าของสำหรับลิงก์ตัวแสดงที่ส่งคืนเมื่อการเรียกเครื่องมือไม่ได้ส่ง `baseUrl` ต้องเป็น `http` หรือ `https` และไม่มี query/hash
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
  `false`: ปฏิเสธคำขอที่ไม่ใช่ loopback ไปยังเส้นทางตัวแสดง `true`: อนุญาตตัวแสดงระยะไกลหากเส้นทางที่มีโทเค็นถูกต้อง
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

- อาร์ติแฟกต์ถูกเก็บไว้ใต้โฟลเดอร์ย่อยชั่วคราว: `$TMPDIR/openclaw-diffs`.
- เมทาดาทาของอาร์ติแฟกต์ตัวแสดงผลประกอบด้วย:
  - ID อาร์ติแฟกต์แบบสุ่ม (อักขระฐานสิบหก 20 ตัว)
  - โทเคนแบบสุ่ม (อักขระฐานสิบหก 48 ตัว)
  - `createdAt` และ `expiresAt`
  - พาธ `viewer.html` ที่จัดเก็บไว้
- TTL เริ่มต้นของอาร์ติแฟกต์คือ 30 นาทีเมื่อไม่ได้ระบุ
- TTL สูงสุดที่ยอมรับสำหรับตัวแสดงผลคือ 6 ชั่วโมง
- การล้างข้อมูลจะทำงานตามโอกาสหลังจากสร้างอาร์ติแฟกต์
- อาร์ติแฟกต์ที่หมดอายุจะถูกลบ
- การล้างข้อมูลสำรองจะลบโฟลเดอร์เก่าที่มีอายุมากกว่า 24 ชั่วโมงเมื่อไม่มีเมทาดาทา

## URL ของตัวแสดงผลและพฤติกรรมเครือข่าย

เส้นทางของตัวแสดงผล:

- `/plugins/diffs/view/{artifactId}/{token}`

แอสเซ็ตของตัวแสดงผล:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` เมื่อ diff ใช้ภาษาจาก Diff Viewer Language Pack

เอกสารตัวแสดงผลจะ resolve แอสเซ็ตเหล่านั้นแบบสัมพันธ์กับ URL ของตัวแสดงผล ดังนั้นคำนำหน้าพาธ `baseUrl` ที่เป็นตัวเลือกจะถูกคงไว้สำหรับคำขอแอสเซ็ตทั้งสองรายการด้วย

พฤติกรรมการสร้าง URL:

- หากมี `baseUrl` ของ tool-call ให้มา จะใช้ค่านั้นหลังจากผ่านการตรวจสอบอย่างเข้มงวด
- มิฉะนั้น หากตั้งค่า Plugin `viewerBaseUrl` ไว้ จะใช้ค่านั้น
- หากไม่มี override ใด ๆ URL ของตัวแสดงผลจะใช้ค่าเริ่มต้นเป็น loopback `127.0.0.1`
- หากโหมด bind ของ gateway เป็น `custom` และตั้งค่า `gateway.customBindHost` ไว้ จะใช้โฮสต์นั้น

กฎของ `baseUrl`:

- ต้องเป็น `http://` หรือ `https://`
- ไม่ยอมรับ query และ hash
- อนุญาตให้ใช้ origin พร้อมพาธฐานที่เป็นตัวเลือกได้

## โมเดลความปลอดภัย

<AccordionGroup>
  <Accordion title="Viewer hardening">
    - ค่าเริ่มต้นเป็น loopback เท่านั้น
    - พาธตัวแสดงผลแบบมีโทเคน พร้อมการตรวจสอบ ID และโทเคนอย่างเข้มงวด
    - CSP ของการตอบกลับตัวแสดงผล:
      - `default-src 'none'`
      - สคริปต์และแอสเซ็ตมาจาก self เท่านั้น
      - ไม่มี `connect-src` ขาออก
    - จำกัดความถี่ของ remote miss เมื่อเปิดใช้การเข้าถึงจากระยะไกล:
      - ล้มเหลว 40 ครั้งต่อ 60 วินาที
      - ล็อกเอาต์ 60 วินาที (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="File rendering hardening">
    - การกำหนดเส้นทางคำขอของเบราว์เซอร์สำหรับสกรีนช็อตเป็นแบบปฏิเสธโดยค่าเริ่มต้น
    - อนุญาตเฉพาะแอสเซ็ตตัวแสดงผลในเครื่องจาก `http://127.0.0.1/plugins/diffs/assets/*`
    - คำขอเครือข่ายภายนอกจะถูกบล็อก

  </Accordion>
</AccordionGroup>

## ข้อกำหนดของเบราว์เซอร์สำหรับโหมดไฟล์

`mode: "file"` และ `mode: "both"` ต้องใช้เบราว์เซอร์ที่เข้ากันได้กับ Chromium

ลำดับการ resolve:

<Steps>
  <Step title="Config">
    `browser.executablePath` ในการกำหนดค่า OpenClaw
  </Step>
  <Step title="Environment variables">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform fallback">
    การค้นพบคำสั่ง/พาธของแพลตฟอร์มเป็น fallback
  </Step>
</Steps>

ข้อความล้มเหลวที่พบบ่อย:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

แก้ไขโดยติดตั้ง Chrome, Chromium, Edge หรือ Brave หรือตั้งค่าหนึ่งในตัวเลือกพาธ executable ด้านบน

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Input validation errors">
    - `Provide patch or both before and after text.` — ใส่ทั้ง `before` และ `after` หรือระบุ `patch`
    - `Provide either patch or before/after input, not both.` — อย่าผสมโหมดอินพุต
    - `Invalid baseUrl: ...` — ใช้ origin แบบ `http(s)` พร้อมพาธที่เป็นตัวเลือก โดยไม่มี query/hash
    - `{field} exceeds maximum size (...)` — ลดขนาด payload
    - การปฏิเสธ patch ขนาดใหญ่ — ลดจำนวนไฟล์ patch หรือจำนวนบรรทัดรวม

  </Accordion>
  <Accordion title="Viewer accessibility">
    - URL ของตัวแสดงผลจะ resolve เป็น `127.0.0.1` โดยค่าเริ่มต้น
    - สำหรับสถานการณ์การเข้าถึงจากระยะไกล ให้ทำอย่างใดอย่างหนึ่ง:
      - ตั้งค่า Plugin `viewerBaseUrl` หรือ
      - ส่ง `baseUrl` ต่อการเรียกเครื่องมือ หรือ
      - ใช้ `gateway.bind=custom` และ `gateway.customBindHost`
    - หาก `gateway.trustedProxies` รวม loopback สำหรับพร็อกซีโฮสต์เดียวกัน (เช่น Tailscale Serve) คำขอตัวแสดงผลผ่าน loopback โดยตรงที่ไม่มีส่วนหัว client-IP ที่ส่งต่อมาจะล้มเหลวแบบปิดโดยออกแบบไว้
    - สำหรับโทโพโลยีพร็อกซีนั้น:
      - แนะนำให้ใช้ `mode: "file"` หรือ `mode: "both"` เมื่อคุณต้องการเพียงไฟล์แนบ หรือ
      - ตั้งใจเปิดใช้ `security.allowRemoteViewer` และตั้งค่า Plugin `viewerBaseUrl` หรือส่ง `baseUrl` ของพร็อกซี/สาธารณะเมื่อคุณต้องการ URL ตัวแสดงผลที่แชร์ได้
    - เปิดใช้ `security.allowRemoteViewer` เฉพาะเมื่อคุณตั้งใจให้มีการเข้าถึงตัวแสดงผลจากภายนอก

  </Accordion>
  <Accordion title="Unmodified-lines row has no expand button">
    กรณีนี้อาจเกิดขึ้นกับอินพุต patch เมื่อ patch ไม่มีบริบทที่ขยายได้ ซึ่งเป็นสิ่งที่คาดไว้และไม่ได้บ่งชี้ว่าตัวแสดงผลล้มเหลว
  </Accordion>
  <Accordion title="Artifact not found">
    - อาร์ติแฟกต์หมดอายุเนื่องจาก TTL
    - โทเคนหรือพาธเปลี่ยนไป
    - การล้างข้อมูลลบข้อมูลเก่าออกแล้ว

  </Accordion>
</AccordionGroup>

## แนวทางการปฏิบัติงาน

- แนะนำให้ใช้ `mode: "view"` สำหรับการตรวจทานแบบโต้ตอบในเครื่องบน canvas
- แนะนำให้ใช้ `mode: "file"` สำหรับช่องแชตขาออกที่ต้องการไฟล์แนบ
- ปิดใช้ `allowRemoteViewer` ไว้ เว้นแต่การปรับใช้ของคุณต้องการ URL ตัวแสดงผลจากระยะไกล
- ตั้งค่า `ttlSeconds` แบบสั้นอย่างชัดเจนสำหรับ diff ที่ละเอียดอ่อน
- หลีกเลี่ยงการส่งความลับในอินพุต diff เมื่อไม่จำเป็น
- หากช่องของคุณบีบอัดรูปภาพอย่างรุนแรง (เช่น Telegram หรือ WhatsApp) แนะนำให้ใช้เอาต์พุต PDF (`fileFormat: "pdf"`)

<Note>
เอนจินเรนเดอร์ diff ขับเคลื่อนโดย [Diffs](https://diffs.com)
</Note>

## ที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [Plugins](/th/tools/plugin)
- [ภาพรวมเครื่องมือ](/th/tools)
