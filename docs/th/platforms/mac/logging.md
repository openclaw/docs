---
read_when:
    - การบันทึกล็อกของ macOS หรือการตรวจสอบการบันทึกข้อมูลส่วนตัว
    - การดีบักปัญหาวงจรชีวิตของการปลุกด้วยเสียงและเซสชัน
summary: 'การบันทึกข้อมูลของ OpenClaw: บันทึกไฟล์การวินิจฉัยแบบหมุนเวียน + แฟล็กความเป็นส่วนตัวแบบรวมสำหรับบันทึกข้อมูล'
title: การบันทึกล็อกของ macOS
x-i18n:
    generated_at: "2026-07-12T16:21:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# การบันทึกล็อก (macOS)

## ล็อกไฟล์การวินิจฉัยแบบหมุนเวียน (แผงดีบัก)

แอป macOS บันทึกล็อกผ่าน swift-log (โดยค่าเริ่มต้นใช้การบันทึกล็อกแบบรวมศูนย์) และยังสามารถเขียนล็อกลงไฟล์ภายในเครื่องแบบหมุนเวียนเพื่อเก็บข้อมูลอย่างถาวรได้ด้วย (`DiagnosticsFileLog`)

- เปิดใช้: **แผงดีบัก -> ล็อก -> การบันทึกล็อกของแอป -> "เขียนล็อกการวินิจฉัยแบบหมุนเวียน (JSONL)"** (ปิดโดยค่าเริ่มต้น)
- ระดับรายละเอียด: ตัวเลือก **แผงดีบัก -> ล็อก -> การบันทึกล็อกของแอป -> ระดับรายละเอียด**
- ตำแหน่ง: `~/Library/Logs/OpenClaw/diagnostics.jsonl`
- การหมุนเวียน: หมุนเวียนเมื่อไฟล์มีขนาด 5 MB โดยเก็บไฟล์สำรองได้สูงสุด 5 ไฟล์ ซึ่งมีส่วนต่อท้าย `.1`...`.5` (ไฟล์เก่าสุดจะถูกลบ)
- ล้าง: **แผงดีบัก -> ล็อก -> การบันทึกล็อกของแอป -> "ล้าง"** จะลบไฟล์ที่กำลังใช้งานและไฟล์สำรองทั้งหมด

ให้ถือว่าไฟล์นี้มีข้อมูลละเอียดอ่อน อย่าแชร์โดยไม่ตรวจสอบก่อน

## ข้อมูลส่วนตัวในการบันทึกล็อกแบบรวมศูนย์บน macOS

การบันทึกล็อกแบบรวมศูนย์จะปกปิดเพย์โหลดส่วนใหญ่ เว้นแต่ระบบย่อยจะเลือกใช้ `privacy -off` การตั้งค่านี้ควบคุมด้วย plist ใน `/Library/Preferences/Logging/Subsystems/` ซึ่งใช้ชื่อระบบย่อยเป็นคีย์ เฉพาะรายการล็อกใหม่เท่านั้นที่จะใช้แฟล็กนี้ ดังนั้นให้เปิดใช้ก่อนจำลองปัญหาอีกครั้ง ข้อมูลพื้นฐาน: [กลไกความเป็นส่วนตัวที่ซับซ้อนของการบันทึกล็อกบน macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans)

## เปิดใช้สำหรับ OpenClaw (`ai.openclaw`)

เขียน plist ลงในไฟล์ชั่วคราวก่อน แล้วจึงติดตั้งแบบอะตอมมิกด้วยสิทธิ์ root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

ไม่จำเป็นต้องรีบูต โดย logd จะโหลดไฟล์อย่างรวดเร็ว แต่เฉพาะบรรทัดล็อกใหม่เท่านั้นที่จะมีเพย์โหลดส่วนตัว ดูผลลัพธ์ที่มีรายละเอียดมากขึ้นด้วย `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` ใช้กำหนดช่วงเวลา โดยค่าเริ่มต้นคือ `5m`; `--category`/`-c` ใช้กรองตามหมวดหมู่)

## ปิดใช้หลังการดีบัก

- ลบการตั้งค่าทับ: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`
- หากต้องการ ให้เรียกใช้ `sudo log config --reload` เพื่อบังคับให้ logd ยกเลิกการตั้งค่าทับทันที
- ส่วนนี้อาจมีหมายเลขโทรศัพท์และเนื้อหาข้อความ ให้คง plist ไว้เฉพาะช่วงที่จำเป็นต้องใช้งานเท่านั้น

## เนื้อหาที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [การบันทึกล็อกของ Gateway](/th/gateway/logging)
