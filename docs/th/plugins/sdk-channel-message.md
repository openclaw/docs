---
summary: เปลี่ยนเส้นทางไปยัง /plugins/sdk-channel-outbound
title: API ข้อความของช่องทาง
x-i18n:
    generated_at: "2026-06-27T18:06:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

หน้านี้ย้ายไปที่ [API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound) แล้ว

`openclaw/plugin-sdk/channel-message` และ
`openclaw/plugin-sdk/channel-message-runtime` ยังคงเป็น subpath ความเข้ากันได้ที่เลิกใช้งานแล้ว
สำหรับ Plugin รุ่นเก่า Plugin ช่องทางใหม่ควรใช้
`openclaw/plugin-sdk/channel-outbound` สำหรับ lifecycle ของข้อความ, ใบรับ, การส่งแบบคงทน,
และ helper สำหรับพรีวิวสด subpath ที่เลิกใช้งานแล้วเป็นเพียง alias แบบบางบน
แกนข้อความช่องทางที่ใช้ร่วมกัน และพื้นผิว SDK ขาเข้า/ขาออกที่เจาะจง;
อย่าเพิ่ม helper ใหม่ที่นั่น

แผนการนำออก: เก็บ alias เหล่านี้ไว้ตลอดช่วงการย้าย Plugin ภายนอก
จากนั้นนำออกในการล้าง SDK ครั้งใหญ่ถัดไปหลังจาก caller ย้ายไปใช้
`channel-outbound` แล้ว
