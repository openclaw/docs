---
x-i18n:
    generated_at: "2026-04-25T13:59:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# การออกแบบการนำเข้าธีมแบบกำหนดเองของ Tweakcn

สถานะ: อนุมัติในเทอร์มินัลเมื่อ 2026-04-22

## สรุป

เพิ่มช่องธีมแบบกำหนดเองของ Control UI ที่อยู่ในเบราว์เซอร์ภายในเครื่องเพียงช่องเดียว ซึ่งสามารถนำเข้าจากลิงก์แชร์ของ tweakcn ได้ กลุ่มธีมแบบ built-in ที่มีอยู่ยังคงเป็น `claw`, `knot` และ `dash` กลุ่มใหม่ `custom` จะทำงานเหมือนกลุ่มธีมปกติของ OpenClaw และรองรับโหมด `light`, `dark` และ `system` เมื่อ payload ของ tweakcn ที่นำเข้ามีชุดโทเค็นทั้งแบบ light และ dark

ธีมที่นำเข้าจะถูกเก็บไว้เฉพาะในโปรไฟล์เบราว์เซอร์ปัจจุบันร่วมกับการตั้งค่าอื่น ๆ ของ Control UI เท่านั้น จะไม่ถูกเขียนลงใน config ของ Gateway และจะไม่ซิงก์ข้ามอุปกรณ์หรือเบราว์เซอร์

## ปัญหา

ระบบธีมของ Control UI ปัจจุบันปิดตายอยู่กับกลุ่มธีมแบบฮาร์ดโค้ด 3 กลุ่ม:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

ผู้ใช้สามารถสลับระหว่างกลุ่ม built-in และตัวแปรโหมดต่าง ๆ ได้ แต่ไม่สามารถนำธีมจาก tweakcn เข้ามาได้โดยไม่แก้ไข CSS ใน repo ผลลัพธ์ที่ต้องการมีขนาดเล็กกว่าระบบธีมทั่วไป: คงสามธีม built-in ไว้ และเพิ่มช่องนำเข้าที่ผู้ใช้ควบคุมได้หนึ่งช่องจากลิงก์ tweakcn

## เป้าหมาย

- คงกลุ่มธีม built-in ที่มีอยู่ไว้โดยไม่เปลี่ยนแปลง
- เพิ่มช่องนำเข้าแบบกำหนดเองเพียงหนึ่งช่อง ไม่ใช่คลังธีม
- รับลิงก์แชร์ของ tweakcn หรือ URL แบบตรง `https://tweakcn.com/r/themes/{id}`
- เก็บธีมที่นำเข้าไว้ใน browser local storage เท่านั้น
- ทำให้ช่องนำเข้าทำงานร่วมกับตัวควบคุมโหมด `light`, `dark` และ `system` ที่มีอยู่
- ทำให้พฤติกรรมเมื่อเกิดข้อผิดพลาดปลอดภัย: การนำเข้าที่ไม่ดีจะต้องไม่ทำให้ธีม UI ที่ใช้งานอยู่พัง

## สิ่งที่ไม่ใช่เป้าหมาย

- ไม่มีคลังธีมหลายรายการหรือรายการนำเข้าหลายรายการในเบราว์เซอร์
- ไม่มีการจัดเก็บฝั่ง Gateway หรือการซิงก์ข้ามอุปกรณ์
- ไม่มีตัวแก้ไข CSS แบบอิสระหรือตัวแก้ไข JSON ของธีมแบบดิบ
- ไม่มีการโหลดทรัพยากรฟอนต์ระยะไกลจาก tweakcn โดยอัตโนมัติ
- ไม่มีความพยายามรองรับ payload ของ tweakcn ที่มีเพียงโหมดเดียว
- ไม่มีการรีแฟกเตอร์ระบบธีมทั้ง repo เกินกว่ารอยต่อที่จำเป็นสำหรับ Control UI

## การตัดสินใจของผู้ใช้ที่ได้ข้อสรุปแล้ว

- คงสามธีม built-in ไว้
- เพิ่มช่องนำเข้าที่ขับเคลื่อนด้วย tweakcn หนึ่งช่อง
- เก็บธีมที่นำเข้าไว้ในเบราว์เซอร์ ไม่ใช่ config ของ Gateway
- รองรับ `light`, `dark` และ `system` สำหรับธีมที่นำเข้า
- การเขียนทับช่อง custom ด้วยการนำเข้าครั้งถัดไปเป็นพฤติกรรมที่ตั้งใจไว้

## แนวทางที่แนะนำ

เพิ่มรหัสกลุ่มธีมตัวที่สี่ `custom` ลงในโมเดลธีมของ Control UI กลุ่ม `custom` จะเลือกได้เฉพาะเมื่อมีการนำเข้า tweakcn ที่ถูกต้องอยู่เท่านั้น payload ที่นำเข้าจะถูกทำให้เป็นมาตรฐานเป็นเรคคอร์ดธีมแบบกำหนดเองเฉพาะของ OpenClaw และเก็บไว้ใน browser local storage ร่วมกับการตั้งค่า UI อื่น ๆ

ระหว่าง runtime OpenClaw จะเรนเดอร์แท็ก `<style>` ที่มีการจัดการไว้ ซึ่งกำหนดบล็อกตัวแปร CSS ของธีม custom ที่ resolve แล้ว:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

วิธีนี้ช่วยให้ตัวแปรของธีม custom ถูกจำกัดขอบเขตไว้กับกลุ่ม `custom` และหลีกเลี่ยงการทำให้ตัวแปร CSS แบบ inline รั่วไหลเข้าไปยังกลุ่ม built-in

## สถาปัตยกรรม

### โมเดลธีม

อัปเดต `ui/src/ui/theme.ts`:

- ขยาย `ThemeName` ให้รวม `custom`
- ขยาย `ResolvedTheme` ให้รวม `custom` และ `custom-light`
- ขยาย `VALID_THEME_NAMES`
- อัปเดต `resolveTheme()` เพื่อให้ `custom` สะท้อนพฤติกรรมของกลุ่มที่มีอยู่:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` หรือ `custom-light` ตามค่ากำหนดของระบบปฏิบัติการ

จะไม่มีการเพิ่ม alias แบบ legacy สำหรับ `custom`

### โมเดลการจัดเก็บ

ขยายการจัดเก็บ `UiSettings` ใน `ui/src/ui/storage.ts` ด้วย payload ของ custom-theme แบบไม่บังคับหนึ่งรายการ:

- `customTheme?: ImportedCustomTheme`

รูปแบบที่แนะนำสำหรับการจัดเก็บ:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

หมายเหตุ:

- `sourceUrl` เก็บอินพุตดั้งเดิมของผู้ใช้หลังการทำให้เป็นมาตรฐาน
- `themeId` คือรหัสธีมของ tweakcn ที่แยกออกมาจาก URL
- `label` คือฟิลด์ `name` ของ tweakcn เมื่อมีอยู่ มิฉะนั้นใช้ `Custom`
- `light` และ `dark` เป็นแผนที่โทเค็นของ OpenClaw ที่ทำให้เป็นมาตรฐานแล้ว ไม่ใช่ payload ดิบของ tweakcn
- payload ที่นำเข้าจะอยู่ข้างการตั้งค่าในเบราว์เซอร์อื่น ๆ และถูก serialize ในเอกสาร local-storage เดียวกัน
- หากข้อมูล custom-theme ที่เก็บไว้หายไปหรือไม่ถูกต้องขณะโหลด ให้เพิกเฉยต่อ payload และ fallback ไปที่ `theme: "claw"` เมื่อกลุ่มที่จัดเก็บไว้คือ `custom`

### การใช้ระหว่าง runtime

เพิ่มตัวจัดการ stylesheet สำหรับ custom-theme แบบเฉพาะทางใน runtime ของ Control UI โดยวางใกล้กับ `ui/src/ui/app-settings.ts` และ `ui/src/ui/theme.ts`

หน้าที่รับผิดชอบ:

- สร้างหรืออัปเดตแท็ก `<style id="openclaw-custom-theme">` ที่คงที่เพียงหนึ่งแท็กใน `document.head`
- สร้าง CSS เฉพาะเมื่อมี payload ของ custom theme ที่ถูกต้อง
- ลบเนื้อหาแท็ก style เมื่อมีการล้าง payload
- คง CSS ของกลุ่ม built-in ไว้ใน `ui/src/styles/base.css`; ห้ามแทรกโทเค็นที่นำเข้าเข้าไปใน stylesheet ที่เช็กอินไว้

ตัวจัดการนี้จะทำงานทุกครั้งที่มีการโหลด บันทึก นำเข้า หรือล้างการตั้งค่า

### ตัวเลือกของโหมด light

การติดตั้งควรใช้ `data-theme-mode="light"` สำหรับการจัดสไตล์แบบ light ข้ามทุกกลุ่มมากกว่าการทำกรณีพิเศษสำหรับ `custom-light` หากมี selector เดิมที่ผูกกับ `data-theme="light"` และจำเป็นต้องใช้กับทุกกลุ่มแบบ light ให้ขยาย selector นั้นเป็นส่วนหนึ่งของงานนี้

## UX สำหรับการนำเข้า

อัปเดต `ui/src/ui/views/config.ts` ในส่วน `Appearance`:

- เพิ่มการ์ดธีม `Custom` ข้าง `Claw`, `Knot` และ `Dash`
- แสดงการ์ดเป็น disabled เมื่อยังไม่มีธีม custom ที่นำเข้าไว้
- เพิ่มแผงนำเข้าใต้กริดของธีม โดยมี:
  - ช่องกรอกข้อความหนึ่งช่องสำหรับลิงก์แชร์ของ tweakcn หรือ URL แบบ `/r/themes/{id}`
  - ปุ่ม `Import` หนึ่งปุ่ม
  - เส้นทาง `Replace` หนึ่งทางเมื่อมี payload custom อยู่แล้ว
  - แอ็กชัน `Clear` หนึ่งรายการเมื่อมี payload custom อยู่แล้ว
- แสดงป้ายชื่อธีมที่นำเข้าและโฮสต์ต้นทางเมื่อมี payload อยู่
- หากธีมที่ใช้งานอยู่คือ `custom` การนำเข้าธีมใหม่ทับจะมีผลทันที
- หากธีมที่ใช้งานอยู่ไม่ใช่ `custom` การนำเข้าจะเก็บ payload ใหม่ไว้เท่านั้นจนกว่าผู้ใช้จะเลือกการ์ด `Custom`

ตัวเลือกธีมใน quick settings ที่ `ui/src/ui/views/config-quick.ts` ควรแสดง `Custom` เฉพาะเมื่อมี payload อยู่ด้วย

## การแยก URL และการดึงข้อมูลระยะไกล

เส้นทางการนำเข้าผ่านเบราว์เซอร์รองรับ:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

การติดตั้งควรทำให้ทั้งสองรูปแบบเป็นมาตรฐานไปเป็น:

- `https://tweakcn.com/r/themes/{id}`

จากนั้นเบราว์เซอร์จะดึง endpoint `/r/themes/{id}` ที่ทำให้เป็นมาตรฐานแล้วโดยตรง

ใช้ตัวตรวจสอบ schema แบบเฉพาะทางสำหรับ payload ภายนอก ควรใช้ zod เพราะนี่เป็นขอบเขตภายนอกที่ไม่น่าเชื่อถือ

ฟิลด์ระยะไกลที่จำเป็น:

- `name` ระดับบนสุดเป็นสตริงแบบไม่บังคับ
- `cssVars.theme` เป็นอ็อบเจ็กต์แบบไม่บังคับ
- `cssVars.light` เป็นอ็อบเจ็กต์
- `cssVars.dark` เป็นอ็อบเจ็กต์

หากไม่มี `cssVars.light` หรือ `cssVars.dark` ให้ปฏิเสธการนำเข้า นี่เป็นการตั้งใจ: พฤติกรรมของผลิตภัณฑ์ที่ได้รับอนุมัติคือรองรับทุกโหมดอย่างครบถ้วน ไม่ใช่พยายามสร้างด้านที่ขาดหายไปแบบ best-effort

## การจับคู่โทเค็น

ห้ามสะท้อนตัวแปรของ tweakcn แบบตาบอด ให้ทำให้ชุดย่อยที่มีขอบเขตเป็นมาตรฐานไปเป็นโทเค็นของ OpenClaw และอนุมานส่วนที่เหลือในตัวช่วยหนึ่งตัว

### โทเค็นที่นำเข้าโดยตรง

จากบล็อกโหมดของ tweakcn แต่ละบล็อก:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

จาก `cssVars.theme` ที่ใช้ร่วมกันเมื่อมีอยู่:

- `font-sans`
- `font-mono`

หากบล็อกโหมดใดเขียนทับ `font-sans`, `font-mono` หรือ `radius` ให้ใช้ค่าระดับโหมดนั้นก่อน

### โทเค็นที่อนุมานสำหรับ OpenClaw

ตัวนำเข้าจะอนุมานตัวแปรเฉพาะของ OpenClaw จากสีพื้นฐานที่นำเข้า:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

กฎการอนุมานจะอยู่ในตัวช่วยแบบ pure เพื่อให้ทดสอบแยกกันได้ สูตรการผสมสีที่แน่นอนเป็นรายละเอียดของการติดตั้ง แต่ตัวช่วยต้องเป็นไปตามข้อกำหนดสองข้อ:

- คงความต่างของสีที่อ่านได้ใกล้เคียงกับเจตนาของธีมที่นำเข้า
- ให้ผลลัพธ์ที่คงที่สำหรับ payload ที่นำเข้าเดียวกัน

### โทเค็นที่ละเว้นใน v1

โทเค็น tweakcn เหล่านี้จะถูกละเว้นโดยตั้งใจในเวอร์ชันแรก:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

วิธีนี้ช่วยคงขอบเขตให้อยู่กับโทเค็นที่ Control UI ปัจจุบันต้องใช้จริง

### ฟอนต์

สตริงของ font stack จะถูกนำเข้าหากมีอยู่ แต่ OpenClaw จะไม่โหลดทรัพยากรฟอนต์ระยะไกลใน v1 หาก stack ที่นำเข้าอ้างถึงฟอนต์ที่ไม่มีในเบราว์เซอร์ ก็จะใช้พฤติกรรม fallback ปกติ

## พฤติกรรมเมื่อเกิดข้อผิดพลาด

การนำเข้าที่ไม่ดีต้องล้มเหลวแบบปิด

- รูปแบบ URL ไม่ถูกต้อง: แสดงข้อผิดพลาดการตรวจสอบแบบ inline และไม่ดึงข้อมูล
- โฮสต์หรือรูปแบบ path ไม่รองรับ: แสดงข้อผิดพลาดการตรวจสอบแบบ inline และไม่ดึงข้อมูล
- เครือข่ายล้มเหลว, การตอบกลับไม่เป็น OK หรือ JSON ผิดรูปแบบ: แสดงข้อผิดพลาดแบบ inline และคง payload ที่เก็บไว้ปัจจุบันไว้ไม่เปลี่ยน
- schema ไม่ผ่านหรือตัวบล็อก light/dark หายไป: แสดงข้อผิดพลาดแบบ inline และคง payload ที่เก็บไว้ปัจจุบันไว้ไม่เปลี่ยน
- แอ็กชัน Clear:
  - ลบ payload custom ที่เก็บไว้
  - ลบเนื้อหาแท็ก style ของ custom ที่มีการจัดการไว้
  - หาก `custom` กำลังใช้งานอยู่ ให้สลับกลุ่มธีมกลับไปเป็น `claw`
- payload custom ที่เก็บไว้ไม่ถูกต้องในการโหลดครั้งแรก:
  - เพิกเฉยต่อ payload ที่เก็บไว้
  - ไม่สร้าง custom CSS
  - หากกลุ่มธีมที่บันทึกไว้คือ `custom` ให้ fallback ไปเป็น `claw`

ไม่ว่ากรณีใด การนำเข้าที่ล้มเหลวต้องไม่ทำให้เอกสารที่กำลังใช้งานอยู่เหลือตัวแปร CSS แบบ custom ที่ถูกใช้เพียงบางส่วน

## ไฟล์ที่คาดว่าจะเปลี่ยนในการติดตั้ง

ไฟล์หลัก:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

ตัวช่วยใหม่ที่เป็นไปได้:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

การทดสอบ:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- การทดสอบแบบเจาะจงใหม่สำหรับการแยก URL และการทำ payload ให้เป็นมาตรฐาน

## การทดสอบ

ความครอบคลุมขั้นต่ำของการติดตั้ง:

- แยก URL แบบ share-link ไปเป็นรหัสธีม tweakcn
- ทำให้ `/themes/{id}` และ `/r/themes/{id}` เป็นมาตรฐานไปเป็น URL สำหรับดึงข้อมูล
- ปฏิเสธโฮสต์ที่ไม่รองรับและรหัสที่ผิดรูปแบบ
- ตรวจสอบรูปร่างของ payload จาก tweakcn
- จับคู่ payload tweakcn ที่ถูกต้องไปเป็นแผนที่โทเค็น light และ dark ของ OpenClaw ที่ทำให้เป็นมาตรฐาน
- โหลดและบันทึก payload custom ในการตั้งค่า local ของเบราว์เซอร์
- resolve `custom` สำหรับ `light`, `dark` และ `system`
- ปิดการเลือก `Custom` เมื่อไม่มี payload
- ใช้ธีมที่นำเข้าทันทีเมื่อ `custom` กำลังใช้งานอยู่แล้ว
- fallback ไปเป็น `claw` เมื่อมีการล้างธีม custom ที่กำลังใช้งานอยู่

เป้าหมายการตรวจสอบด้วยตนเอง:

- นำเข้าธีม tweakcn ที่ทราบแน่ชัดจาก Settings
- สลับระหว่าง `light`, `dark` และ `system`
- สลับระหว่าง `custom` กับกลุ่ม built-in
- โหลดหน้าใหม่และยืนยันว่าธีม custom ที่นำเข้ายังคงอยู่ภายในเครื่อง

## หมายเหตุการทยอยเปิดใช้

ฟีเจอร์นี้ตั้งใจให้มีขนาดเล็ก หากผู้ใช้ต้องการธีมที่นำเข้าหลายรายการ การเปลี่ยนชื่อ การส่งออก หรือการซิงก์ข้ามอุปกรณ์ในภายหลัง ให้ถือว่าเป็นงานออกแบบต่อยอด อย่าสร้าง abstraction ระดับคลังธีมไว้ล่วงหน้าในการติดตั้งครั้งนี้
