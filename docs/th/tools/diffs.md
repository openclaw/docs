---
read_when:
    - คุณต้องการให้เอเจนต์แสดงการแก้ไขโค้ดหรือ Markdown ในรูปแบบ diff
    - คุณต้องการ URL สำหรับโปรแกรมดูที่พร้อมใช้งานบนแคนวาส หรือไฟล์ diff ที่เรนเดอร์แล้ว
    - คุณต้องใช้อาร์ติแฟกต์ diff ชั่วคราวที่ควบคุมได้และมีค่าเริ่มต้นที่ปลอดภัย
sidebarTitle: Diffs
summary: โปรแกรมดู diff แบบอ่านอย่างเดียวและตัวเรนเดอร์ไฟล์สำหรับเอเจนต์ (เครื่องมือ Plugin เสริม)
title: ความแตกต่าง
x-i18n:
    generated_at: "2026-07-16T19:49:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` เป็นเครื่องมือ Plugin แบบรวมมาให้ซึ่งเป็นตัวเลือกเสริม ที่แปลงข้อความก่อน/หลังหรือแพตช์แบบ unified ให้เป็นอาร์ติแฟกต์ diff แบบอ่านอย่างเดียว นอกจากนี้ยังเพิ่มคำแนะนำสั้น ๆ สำหรับเอเจนต์ไว้หน้าพรอมต์ระบบ และมาพร้อม Skills ที่ใช้ร่วมกันสำหรับคำแนะนำฉบับเต็ม

อินพุต: ข้อความ `before` + `after` หรือ `patch` แบบ unified (ใช้ร่วมกันไม่ได้)

เอาต์พุต: URL โปรแกรมดูของ Gateway สำหรับการนำเสนอบนแคนวาส, พาธไฟล์ PNG/PDF ที่เรนเดอร์แล้วสำหรับการส่งข้อความ หรือทั้งสองอย่าง

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
        โฟลว์ที่เน้นแคนวาสเป็นหลัก: เอเจนต์เรียก `diffs` ด้วย `mode: "view"` และเปิด `details.viewerUrl` ด้วย `canvas present`
      </Tab>
      <Tab title="file">
        การส่งไฟล์ผ่านแชต: เอเจนต์เรียก `diffs` ด้วย `mode: "file"` และส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`
      </Tab>
      <Tab title="both">
        แบบรวม (ค่าเริ่มต้น): เอเจนต์เรียก `diffs` ด้วย `mode: "both"` เพื่อรับอาร์ติแฟกต์ทั้งสองรายการในการเรียกครั้งเดียว
      </Tab>
    </Tabs>
  </Step>
</Steps>

## ปิดใช้งานคำแนะนำระบบในตัว

หากต้องการเก็บเครื่องมือไว้แต่ตัดคำแนะนำที่เพิ่มไว้หน้าพรอมต์ระบบออก ให้ตั้งค่า `plugins.entries.diffs.hooks.allowPromptInjection` เป็น `false`:

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

การดำเนินการนี้จะบล็อกฮุก `before_prompt_build` ของ Plugin โดยที่เครื่องมือและ Skills ยังคงพร้อมใช้งาน หากต้องการปิดทั้งคำแนะนำและเครื่องมือ ให้ปิดใช้งาน Plugin แทน

## ข้อมูลอ้างอิงอินพุตของเครื่องมือ

ฟิลด์ทั้งหมดเป็นตัวเลือกเสริม เว้นแต่จะระบุไว้เป็นอย่างอื่น

<ParamField path="before" type="string">
  ข้อความต้นฉบับ ต้องระบุพร้อมกับ `after` เมื่อละเว้น `patch`
</ParamField>
<ParamField path="after" type="string">
  ข้อความที่อัปเดตแล้ว ต้องระบุพร้อมกับ `before` เมื่อละเว้น `patch`
</ParamField>
<ParamField path="patch" type="string">
  ข้อความ diff แบบ unified ใช้ร่วมกับ `before` และ `after` ไม่ได้
</ParamField>
<ParamField path="path" type="string">
  ชื่อไฟล์ที่แสดงสำหรับโหมดก่อน/หลัง
</ParamField>
<ParamField path="lang" type="string">
  คำใบ้สำหรับแทนที่ภาษาของโหมดก่อน/หลัง ค่าที่ไม่รู้จักและภาษาที่อยู่นอกชุดเริ่มต้นของโปรแกรมดูจะย้อนกลับไปใช้ข้อความธรรมดา เว้นแต่จะติดตั้ง
  Plugin Diff Viewer Language Pack
</ParamField>
<ParamField path="title" type="string">
  ชื่อโปรแกรมดูที่ใช้แทนค่าเดิม
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  โหมดเอาต์พุต ค่าเริ่มต้นเป็นค่าเริ่มต้นของ Plugin `defaults.mode` (`both`) นามแฝงที่เลิกใช้แล้ว: `"image"` ทำงานเหมือนกับ `"file"` ทุกประการ
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ธีมของโปรแกรมดู ค่าเริ่มต้นเป็นค่าเริ่มต้นของ Plugin `defaults.theme`
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  เค้าโครง diff ค่าเริ่มต้นเป็นค่าเริ่มต้นของ Plugin `defaults.layout`
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  ขยายส่วนที่ไม่เปลี่ยนแปลงเมื่อมีบริบทครบถ้วน เป็นตัวเลือกเฉพาะแต่ละครั้งที่เรียกเท่านั้น (ไม่ใช่คีย์ค่าเริ่มต้นของ Plugin)
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  รูปแบบไฟล์ที่เรนเดอร์แล้ว ค่าเริ่มต้นเป็นค่าเริ่มต้นของ Plugin `defaults.fileFormat`
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  ค่าคุณภาพที่กำหนดไว้ล่วงหน้าสำหรับการเรนเดอร์ PNG/PDF
</ParamField>
<ParamField path="fileScale" type="number">
  ค่ามาตราส่วนอุปกรณ์ที่ใช้แทนค่าเดิม (`1`-`4`)
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  ความกว้างสูงสุดในการเรนเดอร์เป็นพิกเซล CSS (`640`-`2400`)
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL ของอาร์ติแฟกต์ในหน่วยวินาทีสำหรับโปรแกรมดูและเอาต์พุตไฟล์แบบสแตนด์อโลน สูงสุด `21600`
</ParamField>
<ParamField path="baseUrl" type="string">
  ต้นทาง URL ของโปรแกรมดูที่ใช้แทนค่าเดิม แทนที่ `viewerBaseUrl` ของ Plugin ต้องเป็น `http` หรือ `https` และไม่มีคิวรี/แฮช
</ParamField>

<AccordionGroup>
  <Accordion title="การตรวจสอบความถูกต้องและขีดจำกัด">
    - `before`/`after`: สูงสุดรายการละ 512 KiB
    - `patch`: สูงสุด 2 MiB
    - `path`: สูงสุด 2048 ไบต์
    - `lang`: สูงสุด 128 ไบต์
    - `title`: สูงสุด 1024 ไบต์
    - ขีดจำกัดความซับซ้อนของแพตช์: สูงสุด 128 ไฟล์และรวม 120000 บรรทัด
    - ระบบจะปฏิเสธ `patch` ที่ใช้ร่วมกับ `before`/`after`
    - ขีดจำกัดความปลอดภัยของไฟล์ที่เรนเดอร์แล้ว (PNG และ PDF):
      - `fileQuality: "standard"`: สูงสุด 8 MP (8,000,000 พิกเซลที่เรนเดอร์)
      - `fileQuality: "hq"`: สูงสุด 14 MP
      - `fileQuality: "print"`: สูงสุด 24 MP
      - PDF จำกัดสูงสุดที่ 50 หน้าด้วย

  </Accordion>
</AccordionGroup>

## การเน้นไวยากรณ์

ภาษาในตัว:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` และ `toml`

นามแฝงที่ใช้ทั่วไป (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` เป็นต้น) จะถูกปรับเป็นภาษาเหล่านั้น

ติดตั้ง Plugin Diff Viewer Language Pack เพื่อรองรับภาษาเพิ่มเติม (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff และอื่น ๆ):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

หากไม่มีแพ็ก ภาษาที่ไม่รองรับจะยังคงเรนเดอร์เป็นข้อความธรรมดาที่อ่านได้ โปรดดู [Plugin Diffs Language Pack](/th/plugins/reference/diffs-language-pack) และ [ภาษาของ Shiki](https://shiki.style/languages) สำหรับแค็ตตาล็อกจากต้นทาง

## สัญญารายละเอียดเอาต์พุต

ผลลัพธ์ที่สำเร็จทั้งหมดมี `changed`: อินพุตก่อน/หลังที่เหมือนกันจะคืนค่า `false` โดยไม่สร้างอาร์ติแฟกต์ ส่วนผลลัพธ์ที่เรนเดอร์แล้วจะคืนค่า `true`

<AccordionGroup>
  <Accordion title="ฟิลด์โปรแกรมดู (โหมด view และ both)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` เมื่อพร้อมใช้งาน)

  </Accordion>
  <Accordion title="ฟิลด์ไฟล์ (โหมด file และ both)">
    - `changed`
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
</AccordionGroup>

| โหมด     | ค่าที่ส่งคืน                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | เฉพาะฟิลด์โปรแกรมดู                                                                             |
| `"file"` | เฉพาะฟิลด์ไฟล์ ไม่มีอาร์ติแฟกต์โปรแกรมดู                                                           |
| `"both"` | ฟิลด์โปรแกรมดูพร้อมฟิลด์ไฟล์ หากการเรนเดอร์ไฟล์ล้มเหลว โปรแกรมดูจะยังคงส่งคืนพร้อม `fileError` |

### ส่วนที่ไม่เปลี่ยนแปลงซึ่งถูกยุบ

โปรแกรมดูแสดงแถวในลักษณะ `N unmodified lines` ตัวควบคุมการขยายจะปรากฏเฉพาะเมื่อ diff ที่เรนเดอร์มีข้อมูลบริบทที่ขยายได้ (โดยทั่วไปสำหรับอินพุตก่อน/หลัง) แพตช์แบบ unified จำนวนมากละเว้นเนื้อหาบริบทภายใน hunk ดังนั้นแถวอาจปรากฏโดยไม่มีตัวควบคุมการขยาย ซึ่งเป็นพฤติกรรมที่คาดไว้ ไม่ใช่ข้อบกพร่อง `expandUnchanged` ใช้เฉพาะเมื่อมีบริบทที่ขยายได้

### การนำทางหลายไฟล์

แพตช์ที่แก้ไขมากกว่าหนึ่งไฟล์จะเริ่มต้นด้วยการ์ดสรุปไฟล์ที่เปลี่ยนแปลง: จำนวนรวมของ `+N` / `-N`, จำนวนแยกตามไฟล์, ป้ายกำกับเพิ่ม/ลบ/เปลี่ยนชื่อ และลิงก์แองเคอร์ที่ข้ามไปยังแต่ละไฟล์ ไฟล์ PNG/PDF ที่เรนเดอร์แล้วจะคงจำนวนในส่วนหัวของแต่ละไฟล์ไว้ แต่ตัดตัวสลับมุมมองแบบโต้ตอบออก เนื่องจากตัวควบคุมเหล่านั้นใช้งานไม่ได้ในไฟล์แบบคงที่

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
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

คีย์ `defaults` ที่รองรับ: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds` พารามิเตอร์การเรียกเครื่องมือที่ระบุอย่างชัดเจนจะแทนที่ค่าเหล่านี้

### การกำหนดค่า URL โปรแกรมดูแบบถาวร

<ParamField path="viewerBaseUrl" type="string">
  ค่าสำรองที่ Plugin เป็นเจ้าของสำหรับลิงก์โปรแกรมดูที่ส่งคืน เมื่อการเรียกเครื่องมือไม่ได้ส่ง `baseUrl` ต้องเป็น `http` หรือ `https` และไม่มีคิวรี/แฮช
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
  `false`: คำขอไปยังเส้นทางโปรแกรมดูที่ไม่ได้มาจากลูปแบ็กจะถูกปฏิเสธ `true`: อนุญาตโปรแกรมดูระยะไกลหากพาธที่มีโทเค็นถูกต้อง
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

- อาร์ติแฟกต์อยู่ภายใต้ `$TMPDIR/openclaw-diffs`
- ข้อมูลเมตาของโปรแกรมดูจัดเก็บ ID อาร์ติแฟกต์แบบสุ่มที่มีอักขระฐานสิบหก 20 ตัว, โทเค็นแบบสุ่มที่มีอักขระฐานสิบหก 48 ตัว, `createdAt`/`expiresAt` และพาธ `viewer.html` ที่จัดเก็บไว้
- TTL เริ่มต้นของอาร์ติแฟกต์: 30 นาที TTL สูงสุดที่ยอมรับ: 6 ชั่วโมง
- การล้างข้อมูลทำงานตามโอกาสหลังการเรียกสร้างอาร์ติแฟกต์แต่ละครั้ง โดยอาร์ติแฟกต์ที่หมดอายุจะถูกลบ
- การกวาดสำรองจะลบโฟลเดอร์เก่าที่มีอายุมากกว่า 24 ชั่วโมงเมื่อไม่มีข้อมูลเมตา

## URL โปรแกรมดูและพฤติกรรมเครือข่าย

เส้นทางโปรแกรมดู: `/plugins/diffs/view/{artifactId}/{token}`

แอสเซ็ตของโปรแกรมดู:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (เฉพาะเมื่อ diff ใช้ภาษาของชุดภาษา)

เอกสารตัวแสดงผลจะแก้ไขตำแหน่งของแอสเซ็ตเหล่านี้โดยอ้างอิงจาก URL ของตัวแสดงผล ดังนั้นคำนำหน้าพาธ `baseUrl` ที่เป็นตัวเลือกจึงถูกนำไปใช้กับคำขอแอสเซ็ตด้วย

ลำดับการแก้ไข URL: `baseUrl` จากการเรียกใช้เครื่องมือ (หลังการตรวจสอบอย่างเข้มงวด) -> `viewerBaseUrl` ของ Plugin -> ค่าเริ่มต้นแบบลูปแบ็ก `127.0.0.1` หากโหมดการผูก Gateway เป็น `custom` และมีการตั้งค่า `gateway.customBindHost` ระบบจะใช้โฮสต์นั้นแทนลูปแบ็ก

กฎของ `baseUrl`: ต้องเป็น `http://` หรือ `https://`; ระบบจะปฏิเสธคิวรีและแฮช; อนุญาตให้ใช้ต้นทางพร้อมพาธฐานที่เป็นตัวเลือก

## โมเดลความปลอดภัย

<AccordionGroup>
  <Accordion title="การเสริมความปลอดภัยให้ตัวแสดงผล">
    - โดยค่าเริ่มต้นให้ใช้ลูปแบ็กเท่านั้น
    - พาธตัวแสดงผลที่ใช้โทเค็น พร้อมการตรวจสอบรูปแบบ ID และโทเค็นอย่างเข้มงวด
    - CSP ของการตอบกลับจากตัวแสดงผล: `default-src 'none'`; สคริปต์/แอสเซ็ตมาจากต้นทางเดียวกันเท่านั้น; ไม่มี `connect-src` ขาออก
    - จำกัดอัตราคำขอที่ไม่พบจากระยะไกลเมื่อเปิดใช้งานการเข้าถึงจากระยะไกล: ความล้มเหลว 40 ครั้งภายใน 60 วินาทีจะทำให้ระบบล็อกเป็นเวลา 60 วินาที (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="การเสริมความปลอดภัยให้การเรนเดอร์ไฟล์">
    - การกำหนดเส้นทางคำขอของเบราว์เซอร์สำหรับภาพหน้าจอจะปฏิเสธโดยค่าเริ่มต้น
    - อนุญาตเฉพาะแอสเซ็ตตัวแสดงผลภายในจาก `http://127.0.0.1/plugins/diffs/assets/*`
    - คำขอเครือข่ายภายนอกถูกบล็อก

  </Accordion>
</AccordionGroup>

## ข้อกำหนดของเบราว์เซอร์สำหรับโหมดไฟล์

`mode: "file"` และ `mode: "both"` ต้องใช้เบราว์เซอร์ที่เข้ากันได้กับ Chromium

ลำดับการแก้ไข:

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
    พาธการติดตั้งทั่วไปและการค้นหา `PATH` สำหรับ Chrome, Chromium, Edge และ Brave
  </Step>
</Steps>

ข้อความข้อผิดพลาดที่พบบ่อย: `Diff PNG/PDF rendering requires a Chromium-compatible browser...` แก้ไขโดยติดตั้ง Chrome, Chromium, Edge หรือ Brave หรือตั้งค่าหนึ่งในตัวเลือกพาธไฟล์ปฏิบัติการข้างต้น

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดในการตรวจสอบอินพุต">
    - `Provide patch or both before and after text.` -- ระบุทั้ง `before` และ `after` หรือระบุ `patch`
    - `Provide either patch or before/after input, not both.` -- ห้ามใช้โหมดอินพุตร่วมกัน
    - `Invalid baseUrl: ...` -- ใช้ต้นทาง `http(s)` พร้อมพาธที่เป็นตัวเลือก โดยไม่มีคิวรี/แฮช
    - `{field} exceeds maximum size (...)` -- ลดขนาดเพย์โหลด
    - แพตช์ขนาดใหญ่ถูกปฏิเสธ -- ลดจำนวนไฟล์แพตช์หรือจำนวนบรรทัดทั้งหมด

  </Accordion>
  <Accordion title="การเข้าถึงตัวแสดงผล">
    - โดยค่าเริ่มต้น URL ของตัวแสดงผลจะแก้ไขเป็น `127.0.0.1`
    - สำหรับการเข้าถึงจากระยะไกล ให้ตั้งค่า `viewerBaseUrl` ของ Plugin, ส่ง `baseUrl` ในแต่ละครั้ง หรือใช้ `gateway.bind=custom` ร่วมกับ `gateway.customBindHost`
    - หาก `gateway.trustedProxies` มีลูปแบ็กสำหรับพร็อกซีบนโฮสต์เดียวกัน (เช่น Tailscale Serve) คำขอตัวแสดงผลแบบลูปแบ็กโดยตรงที่ไม่มีส่วนหัว IP ไคลเอ็นต์ที่ส่งต่อมาจะถูกปฏิเสธโดยการออกแบบ
    - สำหรับโทโพโลยีพร็อกซีดังกล่าว ควรใช้ `mode: "file"`/`"both"` สำหรับไฟล์แนบ หรือเปิดใช้งาน `security.allowRemoteViewer` พร้อมกับ `viewerBaseUrl` ของ Plugin/พร็อกซี `baseUrl` โดยตั้งใจ เพื่อสร้างลิงก์ตัวแสดงผลที่แชร์ได้
    - เปิดใช้งาน `security.allowRemoteViewer` เฉพาะเมื่อต้องการให้เข้าถึงตัวแสดงผลจากภายนอก

  </Accordion>
  <Accordion title="แถวบรรทัดที่ไม่มีการแก้ไขไม่มีปุ่มขยาย">
    เป็นพฤติกรรมที่คาดไว้สำหรับอินพุตแพตช์ที่ไม่มีบริบทให้ขยาย ไม่ใช่ความล้มเหลวของตัวแสดงผล
  </Accordion>
  <Accordion title="ไม่พบอาร์ติแฟกต์">
    - อาร์ติแฟกต์หมดอายุเนื่องจาก TTL
    - โทเค็นหรือพาธมีการเปลี่ยนแปลง
    - การล้างข้อมูลนำข้อมูลเก่าออกแล้ว

  </Accordion>
</AccordionGroup>

## แนวทางการดำเนินงาน

- ควรใช้ `mode: "view"` สำหรับการตรวจสอบแบบโต้ตอบภายในแคนวาส
- ควรใช้ `mode: "file"` สำหรับช่องทางแชตขาออกที่ต้องใช้ไฟล์แนบ
- ปิดใช้งาน `allowRemoteViewer` ไว้ เว้นแต่การติดตั้งใช้งานของคุณต้องใช้ URL ตัวแสดงผลจากระยะไกล
- ตั้งค่า `ttlSeconds` แบบสั้นอย่างชัดเจนสำหรับ diff ที่มีข้อมูลละเอียดอ่อน
- หลีกเลี่ยงการส่งข้อมูลลับในอินพุต diff เมื่อไม่จำเป็น
- หากช่องทางของคุณบีบอัดรูปภาพอย่างมาก (เช่น Telegram หรือ WhatsApp) ควรใช้เอาต์พุต PDF (`fileFormat: "pdf"`)

<Note>
เอนจินเรนเดอร์ diff ขับเคลื่อนโดย [Diffs](https://diffs.com)
</Note>

## เนื้อหาที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [Plugin](/th/tools/plugin)
- [ภาพรวมเครื่องมือ](/th/tools)
