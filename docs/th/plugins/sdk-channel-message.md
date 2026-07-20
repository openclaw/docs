---
summary: เปลี่ยนเส้นทางไปยัง /plugins/sdk-channel-outbound
title: API ข้อความของช่องทาง
x-i18n:
    generated_at: "2026-07-20T06:04:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bf0d607bd3287233cbb1fe47c15958bf57a81267ae1e37e45a1881f56e1370cb
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

หน้านี้ย้ายไปที่ [API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound) แล้ว

`openclaw/plugin-sdk/channel-message` ยังคงเป็นพาธย่อยสำหรับความเข้ากันได้ที่เลิกแนะนำแล้ว
สำหรับ Plugin รุ่นเก่า Plugin ช่องทางใหม่ควรใช้
`openclaw/plugin-sdk/channel-outbound` สำหรับวงจรชีวิตของข้อความ การตอบรับ
การส่งแบบคงทน และตัวช่วยแสดงตัวอย่างแบบสด แทนการเพิ่มตัวช่วยใหม่ลงใน
พาธย่อยที่เลิกแนะนำแล้ว

แผนการนำออก: เก็บนามแฝงเหล่านี้ไว้ตลอดช่วงเวลาการย้าย Plugin ภายนอก
จากนั้นนำออกในการปรับปรุง SDK ครั้งใหญ่ครั้งถัดไป หลังจากผู้เรียกใช้
ย้ายไปยัง `channel-outbound` แล้ว
