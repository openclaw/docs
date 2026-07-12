---
summary: เปลี่ยนเส้นทางไปยัง /plugins/sdk-channel-outbound
title: API ข้อความช่องทาง
x-i18n:
    generated_at: "2026-07-12T16:35:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

หน้านี้ย้ายไปที่ [API การส่งออกของช่องทาง](/th/plugins/sdk-channel-outbound) แล้ว

`openclaw/plugin-sdk/channel-message` และ
`openclaw/plugin-sdk/channel-message-runtime` ยังคงเป็นพาธย่อยสำหรับความเข้ากันได้ที่เลิกแนะนำให้ใช้แล้ว
สำหรับ Plugin รุ่นเก่า โดยทั้งสองเป็นเพียงนามแฝงแบบบางที่ครอบแกนกลางข้อความของช่องทางที่ใช้ร่วมกัน
Plugin ช่องทางใหม่ควรใช้
`openclaw/plugin-sdk/channel-outbound` สำหรับวงจรชีวิตของข้อความ การตอบรับ
การส่งแบบคงทน และตัวช่วยแสดงตัวอย่างแบบสด แทนการเพิ่มตัวช่วยใหม่ลงใน
พาธย่อยที่เลิกแนะนำให้ใช้แล้ว

แผนการนำออก: คงนามแฝงเหล่านี้ไว้ตลอดช่วงเวลาการย้าย Plugin ภายนอก
จากนั้นนำออกในการปรับปรุง SDK ครั้งใหญ่รอบถัดไป หลังจากผู้เรียกใช้งาน
ย้ายไปใช้ `channel-outbound` แล้ว
