---
read_when:
    - คุณต้องการให้เอเจนต์แสดงการแก้ไขโค้ดหรือ Markdown ในรูปแบบ diff
    - คุณต้องการ URL สำหรับโปรแกรมดูที่พร้อมใช้งานกับ canvas หรือไฟล์ diff ที่เรนเดอร์แล้ว
    - คุณต้องการอาร์ติแฟกต์ diff แบบชั่วคราวที่ควบคุมได้ พร้อมค่าเริ่มต้นที่ปลอดภัย
sidebarTitle: Diffs
summary: โปรแกรมดู diff แบบอ่านอย่างเดียวและตัวเรนเดอร์ไฟล์สำหรับเอเจนต์ (เครื่องมือ Plugin เสริม)
title: ส่วนต่าง
x-i18n:
    generated_at: "2026-07-19T08:03:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baeb5dd1277120e57178f092e3ae1616edd3389a54721c929d8711301535d302
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` เป็นเครื่องมือ Plugin แบบบันเดิลที่เลือกใช้ได้ ซึ่งแปลงข้อความก่อน/หลังหรือแพตช์แบบ unified ให้เป็นอาร์ติแฟกต์ diff แบบอ่านอย่างเดียว นอกจากนี้ยังเพิ่มคำแนะนำสั้นๆ สำหรับเอเจนต์ไว้ด้านหน้าของพรอมต์ระบบ และมาพร้อม Skills คู่กันสำหรับคำแนะนำที่ครบถ้วนยิ่งขึ้น

อินพุต: ข้อความ `before` + `after` หรือ `patch` แบบ unified (ใช้ร่วมกันไม่ได้)

เอาต์พุต: URL ตัวดูของ Gateway สำหรับนำเสนอบนแคนวาส, พาธไฟล์ PNG/PDF ที่เรนเดอร์แล้วสำหรับส่งข้อความ หรือทั้งสองอย่าง

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        โฟลว์ที่ให้ความสำคัญกับแคนวาส: เอเจนต์เรียก `diffs` พร้อม `mode: "view"` และเปิด `details.viewerUrl` ด้วย `canvas present`
      </Tab>
      <Tab title="file">
        การส่งไฟล์ผ่านแชต: เอเจนต์เรียก `diffs` พร้อม `mode: "file"` และส่ง `details.filePath` พร้อม `message` โดยใช้ `path` หรือ `filePath`
      </Tab>
      <Tab title="both">
        แบบรวม (ค่าเริ่มต้น): เอเจนต์เรียก `diffs` พร้อม `mode: "both"` เพื่อรับอาร์ติแฟกต์ทั้งสองรายการในการเรียกครั้งเดียว
      </Tab>
    </Tabs>
  </Step>
</Steps>

## ปิดคำแนะนำระบบในตัว

หากต้องการเก็บเครื่องมือไว้แต่ไม่เพิ่มคำแนะนำไว้ด้านหน้าพรอมต์ระบบ ให้ตั้ง `plugins.entries.diffs.hooks.allowPromptInjection` เป็น `false`:

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

การตั้งค่านี้จะบล็อกฮุก `before_prompt_build` ของ Plugin ขณะที่ยังคงใช้งานเครื่องมือและ Skills ได้ หากต้องการปิดทั้งคำแนะนำและเครื่องมือ ให้ปิด Plugin แทน

## ข้อมูลอ้างอิงอินพุตของเครื่องมือ

ทุกฟิลด์เป็นตัวเลือก เว้นแต่จะระบุไว้เป็นอย่างอื่น

<ParamField path="before" type="string">
  ข้อความต้นฉบับ จำเป็นต้องใช้ร่วมกับ `after` เมื่อไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="after" type="string">
  ข้อความที่อัปเดตแล้ว จำเป็นต้องใช้ร่วมกับ `before` เมื่อไม่ได้ระบุ `patch`
</ParamField>
<ParamField path="patch" type="string">
  ข้อความ diff แบบ unified ใช้ร่วมกับ `before` และ `after` ไม่ได้
</ParamField>
<ParamField path="path" type="string">
  ชื่อไฟล์ที่แสดงสำหรับโหมดก่อน/หลัง
</ParamField>
<ParamField path="lang" type="string">
  คำใบ้สำหรับแทนที่ภาษาของโหมดก่อน/หลัง ค่าที่ไม่รู้จักและภาษาที่อยู่นอกชุดเริ่มต้นของตัวดูจะใช้ข้อความธรรมดาแทน เว้นแต่จะติดตั้ง
  Plugin Diff Viewer Language Pack
</ParamField>
<ParamField path="title" type="string">
  ค่าที่ใช้แทนชื่อเรื่องของตัวดู
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  โหมดเอาต์พุต ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.mode` (`both`) นามแฝงที่เลิกใช้แล้ว: `"image"` ทำงานเหมือนกับ `"file"`
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ธีมของตัวดู ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.theme`
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  เลย์เอาต์ diff ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.layout`
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  ขยายส่วนที่ไม่เปลี่ยนแปลงเมื่อมีบริบทแบบเต็ม เป็นตัวเลือกเฉพาะการเรียกแต่ละครั้งเท่านั้น (ไม่ใช่คีย์ค่าเริ่มต้นของ Plugin)
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  รูปแบบไฟล์ที่เรนเดอร์แล้ว ค่าเริ่มต้นคือค่าเริ่มต้นของ Plugin `defaults.fileFormat`
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  ค่าคุณภาพสำเร็จรูปสำหรับการเรนเดอร์ PNG/PDF
</ParamField>
<ParamField path="fileScale" type="number">
  ค่าที่ใช้แทนสเกลอุปกรณ์ (`1`-`4`)
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  ความกว้างสูงสุดของการเรนเดอร์ในหน่วยพิกเซล CSS (`640`-`2400`)
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL ของอาร์ติแฟกต์ในหน่วยวินาทีสำหรับตัวดูและเอาต์พุตไฟล์แบบสแตนด์อโลน สูงสุด `21600`
</ParamField>
<ParamField path="baseUrl" type="string">
  ค่าที่ใช้แทนต้นทาง URL ของตัวดู โดยแทนที่ `viewerBaseUrl` ของ Plugin ต้องเป็น `http` หรือ `https` และไม่มีคิวรี/แฮช
</ParamField>

<AccordionGroup>
  <Accordion title="การตรวจสอบและขีดจำกัด">
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
      - PDF ยังจำกัดสูงสุดที่ 50 หน้า

  </Accordion>
</AccordionGroup>

## การเน้นไวยากรณ์

ภาษาในตัว:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` และ `toml`

นามแฝงทั่วไป (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` เป็นต้น) จะถูกทำให้เป็นมาตรฐานตามภาษาเหล่านั้น

ติดตั้ง Plugin Diff Viewer Language Pack เพื่อรองรับภาษาเพิ่มเติม (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff และอื่นๆ):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

หากไม่มีแพ็ก ภาษาที่ไม่รองรับจะยังคงเรนเดอร์เป็นข้อความธรรมดาที่อ่านได้ ดูแค็ตตาล็อกจากต้นทางได้ที่ [Plugin Diffs Language Pack](/th/plugins/reference/diffs-language-pack) และ [ภาษาของ Shiki](https://shiki.style/languages)

## สัญญารายละเอียดเอาต์พุต

ผลลัพธ์ที่สำเร็จทั้งหมดมี `changed`: อินพุตก่อน/หลังที่เหมือนกันจะคืนค่า `false` โดยไม่สร้างอาร์ติแฟกต์ ส่วนผลลัพธ์ที่เรนเดอร์แล้วจะคืนค่า `true`

<AccordionGroup>
  <Accordion title="ฟิลด์ตัวดู (โหมด view และ both)">
    - `changed`
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
  <Accordion title="ฟิลด์ไฟล์ (โหมด file และ both)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (ค่าเดียวกับ `filePath` เพื่อให้เข้ากันได้กับเครื่องมือส่งข้อความ)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| โหมด     | ส่งคืน                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | เฉพาะฟิลด์ตัวดู                                                                             |
| `"file"` | เฉพาะฟิลด์ไฟล์ ไม่มีอาร์ติแฟกต์ตัวดู                                                           |
| `"both"` | ฟิลด์ตัวดูพร้อมฟิลด์ไฟล์ หากการเรนเดอร์ไฟล์ล้มเหลว ตัวดูจะยังคงส่งคืนพร้อม `fileError` |

### ส่วนที่ไม่เปลี่ยนแปลงซึ่งถูกยุบ

ตัวดูแสดงแถวในลักษณะ `N unmodified lines` ตัวควบคุมการขยายจะปรากฏเฉพาะเมื่อ diff ที่เรนเดอร์มีข้อมูลบริบทที่ขยายได้ (โดยทั่วไปสำหรับอินพุตก่อน/หลัง) แพตช์แบบ unified จำนวนมากละเว้นเนื้อหาบริบทภายในฮังก์ ดังนั้นแถวอาจปรากฏโดยไม่มีตัวควบคุมการขยาย ซึ่งเป็นพฤติกรรมที่คาดไว้ ไม่ใช่บั๊ก `expandUnchanged` ใช้ได้เฉพาะเมื่อมีบริบทที่ขยายได้

### การนำทางแบบหลายไฟล์

แพตช์ที่แก้ไขมากกว่าหนึ่งไฟล์จะเริ่มด้วยการ์ดสรุปไฟล์ที่เปลี่ยนแปลง: จำนวนรวม `+N` / `-N`, จำนวนต่อไฟล์, ป้ายเพิ่ม/ลบ/เปลี่ยนชื่อ และลิงก์แองเคอร์ที่ข้ามไปยังแต่ละไฟล์ ไฟล์ PNG/PDF ที่เรนเดอร์แล้วจะคงจำนวนในส่วนหัวต่อไฟล์ไว้ แต่ตัดตัวสลับมุมมองแบบโต้ตอบออก เนื่องจากตัวควบคุมเหล่านั้นใช้งานไม่ได้ในไฟล์แบบคงที่

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

คีย์ `defaults` ที่รองรับ: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds` พารามิเตอร์ที่ระบุอย่างชัดเจนในการเรียกเครื่องมือจะแทนที่ค่าเหล่านี้

### การกำหนดค่า URL ตัวดูแบบถาวร

<ParamField path="viewerBaseUrl" type="string">
  ค่าสำรองที่ Plugin เป็นเจ้าของสำหรับลิงก์ตัวดูที่ส่งคืน เมื่อการเรียกเครื่องมือไม่ได้ส่ง `baseUrl` ต้องเป็น `http` หรือ `https` และไม่มีคิวรี/แฮช
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
  `false`: คำขอไปยังเส้นทางตัวดูที่ไม่ได้มาจากลูปแบ็กจะถูกปฏิเสธ `true`: อนุญาตตัวดูระยะไกลหากพาธที่มีโทเค็นถูกต้อง
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

- HTML และข้อมูลเมตาของ Viewer อยู่ในฐานข้อมูล `state/openclaw.sqlite` ที่ใช้ร่วมกันภายใต้เนมสเปซ Blob ของ Plugin Diffs โดย HTML จะถูกบีบอัดด้วย gzip ส่วน SQLite จะจัดเก็บเฉพาะแฮช SHA-256 ของโทเค็น URL แบบสุ่ม ไม่ได้จัดเก็บตัวโทเค็นเอง
- ไฟล์ PNG/PDF ที่เรนเดอร์แล้วยังคงเป็นไฟล์ชั่วคราวภายใต้ `$TMPDIR/openclaw-diffs` เนื่องจากการส่งผ่านช่องทางต้องใช้พาธไฟล์ SQLite เป็นผู้จัดการข้อมูลเมตาการหมดอายุของไฟล์เหล่านี้ และไม่มีการเขียนไฟล์ JSON ประกอบ
- TTL เริ่มต้นของอาร์ติแฟกต์: 30 นาที TTL สูงสุดที่ยอมรับ: 6 ชั่วโมง
- การล้างข้อมูลจะทำงานตามโอกาสหลังการเรียกสร้างอาร์ติแฟกต์แต่ละครั้ง โดยลบแถว SQLite ที่หมดอายุก่อน แล้วจึงลบไดเรกทอรี PNG/PDF ที่เกี่ยวข้อง
- การกวาดข้อมูลสำรองจะลบโฟลเดอร์ชั่วคราวที่ไม่มีแถวข้อมูลและมีอายุเกิน 24 ชั่วโมง โดยจะไม่นำเข้าหรืออ่านแคชเดิม `meta.json`, `file-meta.json` และ `viewer.html`

## URL ของ Viewer และลักษณะการทำงานของเครือข่าย

เส้นทาง Viewer: `/plugins/diffs/view/{artifactId}/{token}`

แอสเซ็ตของ Viewer:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (เฉพาะเมื่อ diff ใช้ภาษาของชุดภาษา)

เอกสาร Viewer จะอ้างอิงแอสเซ็ตเหล่านี้โดยสัมพันธ์กับ URL ของ Viewer ดังนั้นคำนำหน้าพาธ `baseUrl` ซึ่งเป็นตัวเลือกจะถูกใช้กับคำขอแอสเซ็ตด้วย

ลำดับการแก้ไข URL: `baseUrl` จากการเรียกเครื่องมือ (หลังผ่านการตรวจสอบอย่างเข้มงวด) -> `viewerBaseUrl` ของ Plugin -> ค่าเริ่มต้นแบบลูปแบ็ก `127.0.0.1` หากโหมดการผูก Gateway เป็น `custom` และมีการตั้งค่า `gateway.customBindHost` ระบบจะใช้โฮสต์นั้นแทนลูปแบ็ก

กฎของ `baseUrl`: ต้องเป็น `http://` หรือ `https://`; ระบบจะปฏิเสธคิวรีและแฮช; อนุญาตให้ใช้ต้นทางพร้อมพาธฐานซึ่งเป็นตัวเลือก

## โมเดลความปลอดภัย

<AccordionGroup>
  <Accordion title="การเสริมความปลอดภัยของ Viewer">
    - ค่าเริ่มต้นอนุญาตเฉพาะลูปแบ็ก
    - พาธ Viewer ที่ใช้โทเค็น พร้อมการตรวจสอบรูปแบบ ID และโทเค็นอย่างเข้มงวด
    - CSP ของการตอบกลับ Viewer: `default-src 'none'`; สคริปต์/แอสเซ็ตมาจากต้นทางเดียวกันเท่านั้น; ไม่มี `connect-src` ขาออก
    - การจำกัดคำขอเมื่อค้นหาจากระยะไกลไม่พบและเปิดใช้การเข้าถึงจากระยะไกล: ความล้มเหลว 40 ครั้งภายใน 60 วินาทีจะทำให้ถูกล็อกเป็นเวลา 60 วินาที (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="การเสริมความปลอดภัยของการเรนเดอร์ไฟล์">
    - การกำหนดเส้นทางคำขอของเบราว์เซอร์สำหรับจับภาพหน้าจอจะปฏิเสธโดยค่าเริ่มต้น
    - อนุญาตเฉพาะแอสเซ็ต Viewer ภายในเครื่องจาก `http://127.0.0.1/plugins/diffs/assets/*`
    - คำขอเครือข่ายภายนอกจะถูกบล็อก

  </Accordion>
</AccordionGroup>

## ข้อกำหนดของเบราว์เซอร์สำหรับโหมดไฟล์

`mode: "file"` และ `mode: "both"` ต้องใช้เบราว์เซอร์ที่เข้ากันได้กับ Chromium

ลำดับการค้นหา:

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

ข้อความแสดงความล้มเหลวทั่วไป: `Diff PNG/PDF rendering requires a Chromium-compatible browser...` แก้ไขโดยติดตั้ง Chrome, Chromium, Edge หรือ Brave หรือตั้งค่าตัวเลือกพาธไฟล์ปฏิบัติการรายการใดรายการหนึ่งข้างต้น

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดในการตรวจสอบอินพุต">
    - `Provide patch or both before and after text.` -- ระบุทั้ง `before` และ `after` หรือระบุ `patch`
    - `Provide either patch or before/after input, not both.` -- ห้ามใช้โหมดอินพุตร่วมกัน
    - `Invalid baseUrl: ...` -- ใช้ต้นทาง `http(s)` พร้อมพาธซึ่งเป็นตัวเลือก โดยไม่มีคิวรี/แฮช
    - `{field} exceeds maximum size (...)` -- ลดขนาดเพย์โหลด
    - การปฏิเสธแพตช์ขนาดใหญ่ -- ลดจำนวนไฟล์แพตช์หรือจำนวนบรรทัดทั้งหมด

  </Accordion>
  <Accordion title="การเข้าถึง Viewer">
    - URL ของ Viewer จะอ้างอิงเป็น `127.0.0.1` โดยค่าเริ่มต้น
    - สำหรับการเข้าถึงจากระยะไกล ให้ตั้งค่า `viewerBaseUrl` ของ Plugin, ส่ง `baseUrl` ในแต่ละครั้งที่เรียก หรือใช้ `gateway.bind=custom` ร่วมกับ `gateway.customBindHost`
    - หาก `gateway.trustedProxies` มีลูปแบ็กสำหรับพร็อกซีบนโฮสต์เดียวกัน (เช่น Tailscale Serve) คำขอ Viewer แบบลูปแบ็กโดยตรงที่ไม่มีส่วนหัว IP ของไคลเอ็นต์ซึ่งพร็อกซีส่งต่อมาจะถูกปฏิเสธโดยค่าเริ่มต้นตามการออกแบบ
    - สำหรับโทโพโลยีพร็อกซีนี้ ควรใช้ `mode: "file"`/`"both"` สำหรับไฟล์แนบ หรือเปิดใช้ `security.allowRemoteViewer` พร้อม `viewerBaseUrl` ของ Plugin/พร็อกซี `baseUrl` โดยเจตนา เพื่อสร้างลิงก์ Viewer ที่แชร์ได้
    - เปิดใช้ `security.allowRemoteViewer` เฉพาะเมื่อต้องการให้เข้าถึง Viewer จากภายนอก

  </Accordion>
  <Accordion title="แถวบรรทัดที่ไม่มีการแก้ไขไม่มีปุ่มขยาย">
    เป็นลักษณะที่คาดไว้สำหรับอินพุตแพตช์ที่ไม่มีบริบทซึ่งขยายได้ ไม่ใช่ความล้มเหลวของ Viewer
  </Accordion>
  <Accordion title="ไม่พบอาร์ติแฟกต์">
    - อาร์ติแฟกต์หมดอายุเนื่องจาก TTL
    - โทเค็นหรือพาธมีการเปลี่ยนแปลง
    - การล้างข้อมูลได้ลบข้อมูลที่ล้าสมัยแล้ว

  </Accordion>
</AccordionGroup>

## แนวทางการดำเนินงาน

- ควรใช้ `mode: "view"` สำหรับการรีวิวแบบโต้ตอบภายในเครื่องบนแคนวาส
- ควรใช้ `mode: "file"` สำหรับช่องทางแชตขาออกที่ต้องใช้ไฟล์แนบ
- ปิดใช้ `allowRemoteViewer` ไว้ เว้นแต่การนำไปใช้งานของคุณจำเป็นต้องใช้ URL ของ Viewer จากระยะไกล
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
