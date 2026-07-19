---
read_when:
    - การตั้งค่าหรือการแก้ไขปัญหาวิดเจ็ต Discord Activity
summary: เปิดใช้งานวิดเจ็ต HTML แบบครบวงจรในตัวของ OpenClaw ภายใน Discord Activities
title: กิจกรรมใน Discord
x-i18n:
    generated_at: "2026-07-19T07:00:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b1bc04443aef89fd514290c3bebdbdd3e9972298b45cae3806bec99344f6d8cd
    source_path: channels/discord-activities.md
    workflow: 16
---

Discord Activities ช่วยให้เอเจนต์โพสต์วิดเจ็ต HTML แบบโต้ตอบที่ทำงานได้ในตัวเองไปยังช่อง Discord ปัจจุบันได้ ข้อความจะมีปุ่ม **Open widget** เมื่อคลิกแล้ว วิดเจ็ตจะเปิดขึ้นภายใน Discord

ฟีเจอร์นี้ปิดไว้โดยค่าเริ่มต้น OpenClaw จะลงทะเบียนเส้นทาง HTTP ของ Activity, เครื่องมือเอเจนต์ `show_widget` และตัวจัดการปุ่มเปิดใช้งาน เฉพาะเมื่อมี `channels.discord.activities` และสามารถหา client secret ได้เท่านั้น นามแฝง `discord_widget` ที่เลิกใช้แล้วจะยังคงใช้งานได้อีกหนึ่งรุ่น

## ข้อกำหนดเบื้องต้น

- [บอต Discord ของ OpenClaw](/th/channels/discord) ที่มีอยู่แล้ว
- ชื่อโฮสต์ HTTPS สาธารณะที่เข้าถึง Gateway ของ OpenClaw ได้
- สิทธิ์ในการกำหนดค่า Activities และ OAuth2 สำหรับแอปพลิเคชัน Discord ของบอต

ใช้ reverse proxy หรือ tunnel แบบ HTTPS ใดก็ได้ Cloudflare Tunnel ที่ตั้งชื่อไว้จะให้ชื่อโฮสต์คงที่โดยไม่เปิดเผยพอร์ต Gateway โดยตรง

```yaml
# ~/.cloudflared/config.yml
tunnel: openclaw-discord
credentials-file: /home/you/.cloudflared/TUNNEL-ID.json
ingress:
  - hostname: openclaw.example.com
    service: http://127.0.0.1:18789
  - service: http_status:404
```

```bash
cloudflared tunnel login
cloudflared tunnel create openclaw-discord
cloudflared tunnel route dns openclaw-discord openclaw.example.com
cloudflared tunnel run openclaw-discord
```

เปิดใช้งานการยืนยันตัวตนตามปกติของ Gateway ไว้ เฉพาะคำนำหน้า Activity เท่านั้นที่เป็นสาธารณะ และ Plugin จะตรวจสอบ OAuth, การเป็นสมาชิกอินสแตนซ์ Activity, การผูกช่อง, เซสชัน และสิทธิ์เข้าถึงเอกสารแบบใช้ครั้งเดียวด้วยตัวเอง

## การตั้งค่า

<Steps>
  <Step title="เปิดให้เข้าถึง Gateway ผ่าน HTTPS">
    เริ่ม tunnel หรือ reverse proxy แล้วตรวจสอบว่า `https://openclaw.example.com/discord/activity/` เข้าถึง Gateway ได้หลังจากเพิ่มการกำหนดค่า Activities แล้ว แทนที่ชื่อโฮสต์ตัวอย่างด้วยชื่อโฮสต์ของคุณเอง
  </Step>

  <Step title="เปิดใช้งาน Activities ใน Discord">
    เปิดแอปพลิเคชันบอตที่มีอยู่ใน [Discord Developer Portal](https://discord.com/developers/applications) เปิด **Activities** เปิดใช้งาน Activities และสร้างการแมป URL ดังนี้:

    - คำนำหน้า: `ROOT` (`/`)
    - ปลายทาง: `openclaw.example.com/discord/activity`

    ปลายทางคือชื่อโฮสต์สาธารณะต่อท้ายด้วย `/discord/activity` โดยไม่มีเครื่องหมายทับท้าย

  </Step>

  <Step title="คัดลอก OAuth2 client secret">
    เปิด **OAuth2** ใน Developer Portal Discord กำหนดให้มี redirect URI อย่างน้อยหนึ่งรายการ ดังนั้นหากแอปพลิเคชันยังไม่มี ให้เพิ่มค่าตัวแทนภายในเครื่อง เช่น ที่อยู่ loopback โดย Embedded App SDK จะจัดการขั้นตอนการส่งค่ากลับของ Activity คัดลอกหรือรีเซ็ต client secret ของแอปพลิเคชัน ให้ปฏิบัติต่อค่านี้ในฐานะข้อมูลรับรอง: อย่าวางลงในแชต บันทึก หรือไฟล์การกำหนดค่าที่คอมมิตไว้
  </Step>

  <Step title="กำหนดค่า OpenClaw">
    เพิ่มบล็อกหนึ่งบล็อกในบัญชี Discord ที่ควรให้บริการวิดเจ็ต:

    ```json5
    {
      channels: {
        discord: {
          token: "${DISCORD_BOT_TOKEN}",
          activities: {
            clientSecret: "${DISCORD_CLIENT_SECRET}",
            // ไม่บังคับ ค่าเริ่มต้นคือ ID แอปพลิเคชันบอตที่ได้รับเมื่อเริ่มทำงาน
            applicationId: "YOUR_DISCORD_APPLICATION_ID",
          },
        },
      },
    }
    ```

    คุณสามารถละ `clientSecret` จากบล็อกได้เมื่อตั้งค่า `DISCORD_CLIENT_SECRET` ไว้ แต่ตัวบล็อกเองต้องยังคงอยู่เพื่อเลือกเปิดใช้

    การตั้งค่าการเข้าถึง Discord ตามปกติยังคงแยกจากกัน ตัวอย่างเช่น `allowFrom` ยังคงควบคุมว่าใครส่ง DM ถึงเอเจนต์ได้ แต่ไม่ได้ควบคุมว่าใครเปิดวิดเจ็ตที่โพสต์ไว้ในช่องแล้วได้

  </Step>

  <Step title="เริ่มใหม่และทดสอบ">
    เริ่ม Gateway ใหม่ ในการสนทนา Discord ให้ขอเอเจนต์แสดงวิดเจ็ตแบบโต้ตอบ เอเจนต์จะเรียก `show_widget` จากนั้นคลิก **Open widget** บนข้อความที่โพสต์
  </Step>
</Steps>

## โมเดลความปลอดภัย

- OAuth จะระบุผู้ใช้ Discord ก่อนส่งคืนข้อมูลเมตาของวิดเจ็ต
- Get Activity Instance API ของ Discord ต้องยืนยันว่าผู้ใช้ OAuth อยู่ในอินสแตนซ์ Activity ปัจจุบัน ช่องของอินสแตนซ์ต้องตรงกับช่องที่โพสต์วิดเจ็ต
- ทุกคนที่ Discord อนุญาตให้เข้าช่องนั้นสามารถเปิดวิดเจ็ตในช่องได้ หากต้องการจำกัดกลุ่มผู้ชม ให้ใช้สิทธิ์ของช่อง Discord รายการอนุญาตสำหรับคำสั่งและ DM ของ OpenClaw จะไม่ให้หรือเพิกถอนสิทธิ์เข้าถึงเนื้อหาของช่องที่โพสต์ไว้แล้ว
- เซสชัน OAuth จะหมดอายุหลังจาก 15 นาที สิทธิ์เข้าถึงเอกสารวิดเจ็ตจะหมดอายุหลังจาก 60 วินาทีและใช้ได้หนึ่งครั้ง
- วิดเจ็ตจะหมดอายุหลังจากเจ็ดวัน โดยเก็บไว้ได้สูงสุด 64 รายการต่ออินสแตนซ์ Plugin Discord
- HTML ของวิดเจ็ตเขียนขึ้นโดยเอเจนต์ของคุณและควรถือเป็นเนื้อหาที่เชื่อถือได้ อย่าฝังข้อมูลลับที่คุณไม่ต้องการให้วิดเจ็ตที่มีข้อผิดพลาดเปิดเผย
- วิดเจ็ตสามารถนำทางภายในเฟรมซ้อนของตัวเองได้ iframe `sandbox="allow-scripts"` จะบล็อกการนำทางระดับบนสุด หน้าต่างป๊อปอัป และการเข้าถึงต้นทางเดียวกัน ขณะที่ Content Security Policy จะบล็อกการเชื่อมต่อเครือข่ายและทรัพยากรภายนอก การควบคุมเหล่านี้เป็นการป้องกันหลายชั้น ไม่ใช่ขอบเขตความปลอดภัยเพื่อป้องกันเอเจนต์ที่เขียนวิดเจ็ต
- เมื่อปิดใช้งาน Activities ระบบจะไม่ลงทะเบียน `/discord/activity` เลย

เชลล์ Activity สาธารณะและเส้นทางแลกเปลี่ยนโทเค็นจะเข้าถึงได้ผ่าน tunnel ของคุณเมื่อเปิดใช้งาน โดยจะไม่เปิดเผย HTML ของวิดเจ็ตหากไม่มีเซสชัน OAuth ที่ถูกต้องและสิทธิ์เข้าถึงเอกสารแบบใช้ครั้งเดียว

## การแก้ไขปัญหา

### Activity แสดงข้อความ “Gateway offline”

- ยืนยันว่า tunnel กำลังทำงานและกำหนดเส้นทางไปยังพอร์ต bind จริงของ Gateway
- ยืนยันว่าปลายทางใน Developer Portal มี `/discord/activity`
- เริ่ม Gateway ใหม่หลังจากเปลี่ยนการกำหนดค่า Discord หรือ OpenClaw
- ตรวจสอบบันทึก Gateway เพื่อหาคำเตือนหนึ่งบรรทัดเกี่ยวกับ Activities client secret ที่ขาดหายไป

### Discord เปิดหน้าว่างหรือรายงาน `blocked:csp`

- ตรวจสอบว่าการแมป URL ใช้ `ROOT` และไม่ได้เพิ่มส่วน `/discord/activity` ซ้ำอีกส่วน
- ยืนยันว่าเชลล์, `shell.js` และโมดูล SDK ส่งคืนผ่านพร็อกซี Discord ทั้งหมด
- ตรวจสอบบันทึก Gateway เพื่อหาคำขอภายใต้ `/discord/activity/`

คำขอเครือข่ายของวิดเจ็ตถูกบล็อกโดยเจตนา ให้ฝัง CSS, JavaScript, รูปภาพ และข้อมูลทั้งหมดที่วิดเจ็ตต้องใช้ไว้ภายใน

### “วิดเจ็ตไม่พร้อมใช้งาน”

เปิดใช้งานปุ่มจากช่องที่เอเจนต์โพสต์ไว้ OpenClaw ติดตามการเปิดใช้งานที่ฝั่งเซิร์ฟเวอร์เมื่อมีการคลิก ดังนั้นระเบียนการเปิดใช้งานใหม่จึงสามารถระบุวิดเจ็ตที่ถูกต้องได้ แม้ว่า Discord จะละเว้นหรือทำให้ custom ID ของปุ่มผิดเพี้ยน เมื่อไม่สามารถระบุจากทั้ง custom ID และระเบียนการเปิดใช้งานได้ OpenClaw จะเปิดวิดเจ็ตที่ยังใช้งานได้ซึ่งโพสต์ล่าสุดในช่องนั้น วิดเจ็ตรุ่นเก่ายังคงเข้าถึงได้ผ่านปุ่มที่รักษา custom ID ไว้

### “คุณไม่สามารถเปิดใช้งาน Activities ในช่องนี้ได้”

Discord ไม่เปิดใช้งาน Activities จากเธรดโพสต์ในฟอรัม OpenClaw สามารถโพสต์ข้อความวิดเจ็ตและปุ่มที่นั่นได้ แต่ให้เปิดใช้งาน Activity จากช่องข้อความปกติแทน ข้อจำกัดนี้มาจาก Discord ไม่ใช่ OpenClaw
