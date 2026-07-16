---
read_when:
    - การเพิ่มหรือแก้ไขการจับภาพจากกล้องบนแพลตฟอร์ม Node
    - การขยายเวิร์กโฟลว์ไฟล์ชั่วคราว MEDIA ที่เอเจนต์เข้าถึงได้
summary: การถ่ายภาพจากกล้องบน Node ของ iOS, Android, macOS และ Linux สำหรับภาพถ่ายและคลิปวิดีโอสั้น
title: การถ่ายภาพจากกล้อง
x-i18n:
    generated_at: "2026-07-16T19:23:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw รองรับการจับภาพจากกล้องสำหรับเวิร์กโฟลว์ของเอเจนต์บน Node **iOS**, **Android**, **macOS** และ **Linux** ที่จับคู่แล้ว: ถ่ายภาพ (`jpg`) หรือคลิปวิดีโอสั้น (`mp4` พร้อมเสียงที่เลือกเปิดได้) ผ่าน Gateway `node.invoke`

การเข้าถึงกล้องทั้งหมดอยู่ภายใต้การควบคุมของการตั้งค่าที่ผู้ใช้กำหนดในแต่ละแพลตฟอร์ม

## Node iOS

### การตั้งค่าผู้ใช้ iOS

- แท็บ iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - ค่าเริ่มต้น: **เปิด** (หากไม่มีคีย์ จะถือว่าเปิดใช้งาน)
  - เมื่อปิด: คำสั่ง `camera.*` จะส่งคืน `CAMERA_DISABLED`

### คำสั่ง iOS (ผ่าน Gateway `node.invoke`)

- `camera.list`
  - เพย์โหลดการตอบกลับ: `devices` — อาร์เรย์ของ `{ id, name, position, deviceType }`

- `camera.snap`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `maxWidth`: ตัวเลข (ไม่บังคับ; ค่าเริ่มต้น `1600`)
    - `quality`: `0..1` (ไม่บังคับ; ค่าเริ่มต้น `0.9` จำกัดให้อยู่ในช่วง `[0.05, 1.0]`)
    - `format`: ปัจจุบันคือ `jpg`
    - `delayMs`: ตัวเลข (ไม่บังคับ; ค่าเริ่มต้น `0` จำกัดภายในสูงสุดที่ `10000`)
    - `deviceId`: สตริง (ไม่บังคับ; จาก `camera.list`)
  - เพย์โหลดการตอบกลับ: `format: "jpg"`, `base64`, `width`, `height`
  - ข้อจำกัดเพย์โหลด: ภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้เพย์โหลดที่เข้ารหัสแบบ base64 มีขนาดต่ำกว่า 5MB

- `camera.clip`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `durationMs`: ตัวเลข (ค่าเริ่มต้น `3000` จำกัดให้อยู่ในช่วง `[250, 60000]`)
    - `includeAudio`: บูลีน (ค่าเริ่มต้น `true`)
    - `format`: ปัจจุบันคือ `mp4`
    - `deviceId`: สตริง (ไม่บังคับ; จาก `camera.list`)
  - เพย์โหลดการตอบกลับ: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`

### ข้อกำหนดให้ iOS อยู่เบื้องหน้า

เช่นเดียวกับ `canvas.*` Node iOS อนุญาตคำสั่ง `camera.*` เฉพาะเมื่อแอปอยู่ใน **เบื้องหน้า** การเรียกใช้ในเบื้องหลังจะส่งคืน `NODE_BACKGROUND_UNAVAILABLE`

### ตัวช่วย CLI

วิธีที่ง่ายที่สุดในการรับไฟล์สื่อคือใช้ตัวช่วย CLI ซึ่งจะเขียนสื่อที่ถอดรหัสแล้วลงในไฟล์ชั่วคราวและแสดงพาธที่บันทึกไว้

```bash
openclaw nodes camera snap --node <id>                 # ค่าเริ่มต้น: ทั้งกล้องหน้าและหลัง (2 บรรทัด MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` มีค่าเริ่มต้นเป็น `--facing both` โดยจับภาพทั้งด้านหน้าและด้านหลังเพื่อให้เอเจนต์เห็นทั้งสองมุมมอง; ส่ง `--device-id` พร้อมทิศทางเดียวที่ระบุอย่างชัดเจน (`both` จะถูกปฏิเสธเมื่อตั้งค่า `--device-id`) ไฟล์เอาต์พุตเป็นไฟล์ชั่วคราว (ในไดเรกทอรีชั่วคราวของระบบปฏิบัติการ) เว้นแต่จะสร้างตัวห่อหุ้มขึ้นเอง

## Node Android

### การตั้งค่าผู้ใช้ Android

- แผง Android Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - **การติดตั้งใหม่จะปิดไว้โดยค่าเริ่มต้น** การติดตั้งเดิมที่มีอยู่ก่อนการตั้งค่านี้จะถูกย้ายให้เป็น **เปิด** เพื่อให้การอัปเกรดไม่ทำให้การเข้าถึงกล้องที่เคยใช้งานได้หายไปโดยไม่มีการแจ้งเตือน
  - เมื่อปิด: คำสั่ง `camera.*` จะส่งคืน `CAMERA_DISABLED: enable Camera in Settings`

### สิทธิ์

- ต้องมี `CAMERA` สำหรับทั้ง `camera.snap` และ `camera.clip`; หากไม่มีหรือถูกปฏิเสธสิทธิ์ จะส่งคืน `CAMERA_PERMISSION_REQUIRED`
- ต้องมี `RECORD_AUDIO` สำหรับ `camera.clip` เมื่อ `includeAudio` เป็น `true`; หากไม่มีหรือถูกปฏิเสธสิทธิ์ จะส่งคืน `MIC_PERMISSION_REQUIRED`

แอปจะแจ้งขอสิทธิ์ขณะรันไทม์เมื่อทำได้

### ข้อกำหนดให้ Android อยู่เบื้องหน้า

เช่นเดียวกับ `canvas.*` Node Android อนุญาตคำสั่ง `camera.*` เฉพาะเมื่อแอปอยู่ใน **เบื้องหน้า** การเรียกใช้ในเบื้องหลังจะส่งคืน `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`

### คำสั่ง Android (ผ่าน Gateway `node.invoke`)

- `camera.list`
  - เพย์โหลดการตอบกลับ: `devices` — อาร์เรย์ของ `{ id, name, position, deviceType }`

- `camera.snap`
  - พารามิเตอร์: `facing` (`front|back` ค่าเริ่มต้น `front`), `quality` (ค่าเริ่มต้น `0.95` จำกัดให้อยู่ในช่วง `[0.1, 1.0]`), `maxWidth` (ค่าเริ่มต้น `1600`), `deviceId` (ไม่บังคับ; รหัสที่ไม่รู้จักจะล้มเหลวด้วย `INVALID_REQUEST`)
  - เพย์โหลดการตอบกลับ: `format: "jpg"`, `base64`, `width`, `height`
  - ข้อจำกัดเพย์โหลด: บีบอัดใหม่เพื่อให้ base64 มีขนาดต่ำกว่า 5MB (ใช้ขีดจำกัดเดียวกับ iOS)

- `camera.clip`
  - พารามิเตอร์: `facing` (ค่าเริ่มต้น `front`), `durationMs` (ค่าเริ่มต้น `3000` จำกัดให้อยู่ในช่วง `[200, 60000]`), `includeAudio` (ค่าเริ่มต้น `true`), `deviceId` (ไม่บังคับ)
  - เพย์โหลดการตอบกลับ: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`
  - ข้อจำกัดเพย์โหลด: MP4 ดิบถูกจำกัดไว้ที่ 18MB ก่อนเข้ารหัสแบบ base64; คลิปที่ใหญ่เกินไปจะล้มเหลวด้วย `PAYLOAD_TOO_LARGE` (ลด `durationMs` แล้วลองใหม่)

## แอป macOS

### การตั้งค่าผู้ใช้ macOS

แอปคู่หู macOS มีช่องทำเครื่องหมายดังนี้:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - ค่าเริ่มต้น: **ปิด**
  - เมื่อปิด: คำขอใช้กล้องจะส่งคืน `CAMERA_DISABLED: enable Camera in Settings`

### ตัวช่วย CLI (เรียกใช้ Node)

ใช้ CLI หลัก `openclaw` เพื่อเรียกใช้คำสั่งกล้องบน Node macOS

```bash
openclaw nodes camera list --node <id>                     # แสดงรายการรหัสกล้อง
openclaw nodes camera snap --node <id>                     # แสดงพาธที่บันทึกไว้
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # แสดงพาธที่บันทึกไว้
openclaw nodes camera clip --node <id> --duration-ms 3000   # แสดงพาธที่บันทึกไว้ (แฟล็กเดิม)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` มีค่าเริ่มต้นเป็น `maxWidth=1600` เว้นแต่จะถูกแทนที่
- `camera.snap` จะรอ `delayMs` (ค่าเริ่มต้น 2000ms จำกัดให้อยู่ในช่วง `[0, 10000]`) หลังจากอุ่นเครื่อง/รอให้การรับแสงคงที่ก่อนจับภาพ
- เพย์โหลดภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้ base64 มีขนาดต่ำกว่า 5MB

## โฮสต์ Node Linux

Plugin Linux Node ที่รวมมาให้จะเพิ่มความสามารถจับภาพจากกล้องแก่บริการ CLI `openclaw node` โดยทำงานบนโฮสต์แบบไม่มีจอภาพได้และไม่ต้องใช้แอปเดสก์ท็อป Linux

การเข้าถึงกล้องจะปิดไว้โดยค่าเริ่มต้น เปิดใช้งานภายใต้รายการ Plugin แล้วเริ่มบริการ Node ใหม่เพื่อสร้างการประกาศ Gateway ขึ้นใหม่:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

ข้อกำหนด:

- FFmpeg ที่รองรับอินพุต V4L2, `libx264` และ AAC
- อุปกรณ์ `/dev/video*` ที่ผู้ใช้ซึ่งรันบริการ Node สามารถอ่านได้; ในดิสทริบิวชันทั่วไป ให้เพิ่มผู้ใช้นั้นลงในกลุ่ม `video`
- สำหรับคลิปที่ใช้ค่าเริ่มต้น `includeAudio: true` ต้องมีเซิร์ฟเวอร์ PulseAudio ที่ทำงานได้หรือเลเยอร์ความเข้ากันได้ของ PipeWire PulseAudio พร้อมแหล่งเสียงเริ่มต้น

Linux จะส่งคืนพาธอุปกรณ์ V4L2 ที่สามารถจับภาพและอ่านได้จาก `camera.list`; FFmpeg จะตรวจสอบอุปกรณ์ที่เป็นไปได้แต่ละรายการใน `/dev/video*` และละเว้น Node ที่เป็นเมทาดาทาหรือเอาต์พุตเท่านั้น `position` ของอุปกรณ์คือ `unknown` ดังนั้นคำขอทิศทางที่ไม่มี `deviceId` จะสร้างภาพถ่ายหรือคลิปตำแหน่ง `unknown` หนึ่งรายการ แทนที่จะอ้างว่าเป็นกล้องหน้าหรือกล้องหลัง ใช้ `deviceId` เมื่อโฮสต์มีกล้องหลายตัว `camera.snap` ใช้การอุ่นอินพุตของ FFmpeg เป็นเวลา `delayMs` และรักษาอัตราส่วนภาพพร้อมจำกัดความกว้าง `camera.clip` จะบันทึกเสียงไมโครโฟนเป็นแทร็กเสียง MP4; OpenClaw ตั้งใจไม่เปิดให้ใช้คำสั่งไมโครโฟนแบบแยกต่างหาก

Plugin ใช้ `libx264` สำหรับวิดีโอ MP4 และจะไม่เปลี่ยนโคเดกโดยไม่แจ้งให้ทราบ FFmpeg รุ่นที่ไม่มีอินพุตหรือตัวเข้ารหัสที่จำเป็นจะส่งคืน `CAMERA_UNAVAILABLE` ภาพถ่ายและคลิปที่จะเกินขีดจำกัดเพย์โหลด base64 ที่ 25MB จะล้มเหลวด้วย `PAYLOAD_TOO_LARGE`

`camera.snap` และ `camera.clip` ยังคงเป็นคำสั่งอันตราย เพิ่มคำสั่งเหล่านี้ลงใน `gateway.nodes.allowCommands` เฉพาะเมื่อตั้งใจเปิดความพร้อมสำหรับการจับภาพ; การเปิดใช้ Plugin เพียงอย่างเดียวไม่ได้ข้ามนโยบาย Gateway

## ความปลอดภัยและข้อจำกัดในการใช้งานจริง

- การเข้าถึงกล้องและไมโครโฟนจะเรียกข้อความแจ้งขอสิทธิ์ตามปกติของระบบปฏิบัติการ (และต้องมีสตริงคำอธิบายการใช้งานใน `Info.plist`)
- คลิปวิดีโอถูกจำกัดไว้ที่ 60s เพื่อหลีกเลี่ยงเพย์โหลด Node ที่มีขนาดใหญ่เกินไป (โอเวอร์เฮดจาก base64 รวมกับขีดจำกัดข้อความ)

## วิดีโอหน้าจอ macOS (ระดับระบบปฏิบัติการ)

สำหรับวิดีโอ_หน้าจอ_ (ไม่ใช่กล้อง) ให้ใช้แอปคู่หู macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # แสดงพาธที่บันทึกไว้
```

ต้องมีสิทธิ์ **Screen Recording** ของ macOS (TCC)

## เนื้อหาที่เกี่ยวข้อง

- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [คำสั่งตำแหน่งที่ตั้ง](/th/nodes/location-command)
