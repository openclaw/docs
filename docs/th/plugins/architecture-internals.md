---
read_when:
    - การอิมพลีเมนต์ฮุกรันไทม์ของผู้ให้บริการ วงจรชีวิตของช่องทาง หรือชุดแพ็กเกจ
    - การดีบักลำดับการโหลด Plugin หรือสถานะรีจิสทรี
    - การเพิ่มความสามารถของ Plugin ใหม่หรือ Plugin เอนจินบริบท
summary: 'กลไกภายในของสถาปัตยกรรม Plugin: ไปป์ไลน์การโหลด, รีจิสทรี, ฮุกรันไทม์, เส้นทาง HTTP และตารางอ้างอิง'
title: กลไกภายในของสถาปัตยกรรม Plugin
x-i18n:
    generated_at: "2026-05-11T20:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

สำหรับโมเดลความสามารถสาธารณะ รูปแบบ Plugin และสัญญาเรื่องความเป็นเจ้าของ/การดำเนินการ
ดู [สถาปัตยกรรม Plugin](/th/plugins/architecture) หน้านี้เป็น
เอกสารอ้างอิงสำหรับกลไกภายใน: ไปป์ไลน์การโหลด รีจิสทรี hook รันไทม์
เส้นทาง HTTP ของ Gateway เส้นทาง import และตาราง schema

## ไปป์ไลน์การโหลด

เมื่อเริ่มต้น OpenClaw จะทำโดยคร่าว ๆ ดังนี้:

1. ค้นพบราก Plugin ที่เป็นตัวเลือก
2. อ่านแมนิเฟสต์บันเดิลแบบเนทีฟหรือเข้ากันได้ และเมทาดาตาแพ็กเกจ
3. ปฏิเสธตัวเลือกที่ไม่ปลอดภัย
4. ทำให้คอนฟิก Plugin เป็นรูปแบบมาตรฐาน (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินใจว่าจะเปิดใช้งานตัวเลือกแต่ละรายการหรือไม่
6. โหลดโมดูลเนทีฟที่เปิดใช้งาน: โมดูลบันเดิลที่สร้างแล้วใช้ตัวโหลดเนทีฟ;
   TypeScript ซอร์สท้องถิ่นของบุคคลที่สามใช้ Jiti fallback ฉุกเฉิน
7. เรียก hook เนทีฟ `register(api)` และรวบรวมการลงทะเบียนเข้าไปในรีจิสทรี Plugin
8. เปิดเผยรีจิสทรีให้กับคำสั่ง/พื้นผิวรันไทม์

<Note>
`activate` เป็น alias แบบเดิมของ `register` — ตัวโหลดจะ resolve ตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกใช้ที่จุดเดียวกัน Plugin ที่บันเดิลมาทั้งหมดใช้ `register`; ควรใช้ `register` สำหรับ Plugin ใหม่
</Note>

เกตความปลอดภัยเกิดขึ้น **ก่อน** การดำเนินการรันไทม์ ตัวเลือกจะถูกบล็อก
เมื่อ entry หลุดออกจากราก Plugin, path เขียนได้โดยทุกคน หรือความเป็นเจ้าของ
path ดูน่าสงสัยสำหรับ Plugin ที่ไม่ได้บันเดิลมา

ตัวเลือกที่ถูกบล็อกยังคงผูกกับ id ของ Plugin สำหรับการวินิจฉัย หากคอนฟิก
ยังอ้างอิง id นั้น การตรวจสอบจะรายงานว่า Plugin มีอยู่แต่ถูกบล็อก
และชี้กลับไปที่คำเตือนเรื่องความปลอดภัยของ path แทนที่จะถือว่า entry คอนฟิก
นั้นล้าสมัย

### พฤติกรรมที่ยึดแมนิเฟสต์ก่อน

แมนิเฟสต์คือแหล่งความจริงของระนาบควบคุม OpenClaw ใช้มันเพื่อ:

- ระบุ Plugin
- ค้นพบช่องทาง/Skills/schema คอนฟิกหรือความสามารถของบันเดิลที่ประกาศไว้
- ตรวจสอบ `plugins.entries.<id>.config`
- เพิ่มป้ายกำกับ/placeholder ของ Control UI
- แสดงเมทาดาตาการติดตั้ง/แค็ตตาล็อก
- เก็บ descriptor การเปิดใช้งานและการตั้งค่าแบบต้นทุนต่ำไว้โดยไม่ต้องโหลดรันไทม์ Plugin

สำหรับ Plugin เนทีฟ โมดูลรันไทม์คือส่วนของระนาบข้อมูล โมดูลนี้ลงทะเบียน
พฤติกรรมจริง เช่น hook, เครื่องมือ, คำสั่ง หรือโฟลว์ของผู้ให้บริการ

บล็อก `activation` และ `setup` แบบไม่บังคับในแมนิเฟสต์จะอยู่บนระนาบควบคุม
บล็อกเหล่านี้เป็น descriptor แบบเมทาดาตาเท่านั้นสำหรับการวางแผนการเปิดใช้งานและการค้นพบการตั้งค่า;
ไม่แทนที่การลงทะเบียนรันไทม์, `register(...)`, หรือ `setupEntry`
ผู้บริโภคการเปิดใช้งานแบบ live กลุ่มแรกตอนนี้ใช้ hint ของคำสั่ง ช่องทาง และผู้ให้บริการจากแมนิเฟสต์
เพื่อจำกัดการโหลด Plugin ก่อนการ materialize รีจิสทรีที่กว้างขึ้น:

- การโหลด CLI จำกัดเหลือ Plugin ที่เป็นเจ้าของคำสั่งหลักที่ร้องขอ
- การตั้งค่าช่องทาง/การ resolve Plugin จำกัดเหลือ Plugin ที่เป็นเจ้าของ
  id ช่องทางที่ร้องขอ
- การตั้งค่า/การ resolve รันไทม์ของผู้ให้บริการแบบชัดเจน จำกัดเหลือ Plugin ที่เป็นเจ้าของ
  id ผู้ให้บริการที่ร้องขอ
- การวางแผนเริ่มต้นของ Gateway ใช้ `activation.onStartup` สำหรับ
  import ตอนเริ่มต้นและการ opt out ตอนเริ่มต้นแบบชัดเจน; Plugin ที่ไม่มีเมทาดาตาตอนเริ่มต้นจะโหลดเฉพาะ
  ผ่านตัวกระตุ้นการเปิดใช้งานที่แคบกว่า

การโหลดรันไทม์ล่วงหน้า ณ เวลาร้องขอที่ขอ scope กว้าง `all` ยังคง derive
ชุด id Plugin ที่มีผลแบบชัดเจนจากคอนฟิก การวางแผนเริ่มต้น ช่องทางที่กำหนดค่าไว้
slot และกฎการเปิดใช้งานอัตโนมัติ หากชุดที่ derive ได้ว่างเปล่า OpenClaw
จะโหลดรีจิสทรีรันไทม์ว่างแทนที่จะขยายไปยัง Plugin ที่ค้นพบได้ทุกตัว

ตัววางแผนการเปิดใช้งานเปิดเผยทั้ง API แบบเฉพาะ ids สำหรับ caller เดิม และ
API แผนสำหรับการวินิจฉัยใหม่ entry ของแผนรายงานเหตุผลที่เลือก Plugin
โดยแยก hint ของตัววางแผน `activation.*` แบบชัดเจนออกจาก fallback ความเป็นเจ้าของ
ในแมนิเฟสต์ เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hook การแยกเหตุผลนี้คือขอบเขตความเข้ากันได้:
เมทาดาตา Plugin เดิมยังทำงานต่อไปได้ ขณะที่โค้ดใหม่สามารถตรวจจับ hint แบบกว้าง
หรือพฤติกรรม fallback ได้โดยไม่เปลี่ยน semantics การโหลดรันไทม์

ตอนนี้การค้นพบการตั้งค่าจะให้ความสำคัญกับ id ที่ descriptor เป็นเจ้าของ เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด Plugin ตัวเลือก ก่อนจะ fallback ไปยัง
`setup-api` สำหรับ Plugin ที่ยังต้องใช้ hook รันไทม์ช่วงตั้งค่า รายการตั้งค่า
ผู้ให้บริการใช้ `providerAuthChoices` ในแมนิเฟสต์ ตัวเลือกการตั้งค่าที่ derive จาก descriptor
และเมทาดาตาแค็ตตาล็อกการติดตั้งโดยไม่โหลดรันไทม์ผู้ให้บริการ
`setup.requiresRuntime: false` แบบชัดเจนเป็นจุดตัดแบบ descriptor-only; หากละเว้น
`requiresRuntime` จะยังคง fallback แบบเดิมไปยัง setup-api เพื่อความเข้ากันได้ หากมี
Plugin ที่ค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์ id ผู้ให้บริการการตั้งค่าหรือ CLI
backend เดียวกันหลัง normalize แล้ว การค้นหาการตั้งค่าจะปฏิเสธเจ้าของที่กำกวมแทนการอาศัย
ลำดับการค้นพบ เมื่อรันไทม์การตั้งค่าดำเนินการจริง การวินิจฉัยของรีจิสทรีจะรายงาน
drift ระหว่าง `setup.providers` / `setup.cliBackends` กับผู้ให้บริการหรือ CLI
backend ที่ลงทะเบียนโดย setup-api โดยไม่บล็อก Plugin เดิม

### ขอบเขตแคชของ Plugin

OpenClaw ไม่แคชผลการค้นพบ Plugin หรือข้อมูลรีจิสทรีแมนิเฟสต์โดยตรง
ไว้หลังหน้าต่างเวลาตามนาฬิกา การติดตั้ง การแก้ไขแมนิเฟสต์ และการเปลี่ยนแปลง load-path
ต้องมองเห็นได้ในการอ่านเมทาดาตาแบบชัดเจนครั้งถัดไปหรือการสร้าง snapshot ใหม่ครั้งถัดไป
ตัว parser ไฟล์แมนิเฟสต์อาจเก็บแคชลายเซ็นไฟล์แบบมีขอบเขต โดย key ตาม
path แมนิเฟสต์ที่เปิด, inode, size และ timestamp; แคชนั้นมีไว้เพียงเพื่อหลีกเลี่ยง
การ parse byte ที่ไม่เปลี่ยนแปลงซ้ำ และต้องไม่แคชคำตอบเรื่องการค้นพบ รีจิสทรี เจ้าของ หรือ
นโยบาย

fast path เมทาดาตาที่ปลอดภัยคือความเป็นเจ้าของ object แบบชัดเจน ไม่ใช่แคชซ่อน
hot path ตอนเริ่มต้นของ Gateway ควรส่ง `PluginMetadataSnapshot` ปัจจุบัน,
`PluginLookUpTable` ที่ derive แล้ว หรือรีจิสทรีแมนิเฟสต์แบบชัดเจนผ่าน call
chain การตรวจสอบคอนฟิก การเปิดใช้งานอัตโนมัติตอนเริ่มต้น การ bootstrap Plugin และการเลือก
ผู้ให้บริการสามารถใช้ object เหล่านั้นซ้ำได้ตราบเท่าที่มันแทนคอนฟิกและ
คลัง Plugin ปัจจุบัน การค้นหาการตั้งค่ายังคงสร้างเมทาดาตาแมนิเฟสต์ขึ้นใหม่ตามต้องการ
เว้นแต่ path การตั้งค่าเฉพาะจะได้รับรีจิสทรีแมนิเฟสต์แบบชัดเจน; ให้คงส่วนนี้
เป็น fallback ของ cold path แทนการเพิ่มแคชการค้นหาแบบซ่อน เมื่อ input
เปลี่ยน ให้สร้าง snapshot ใหม่และแทนที่ แทนการ mutate หรือเก็บ
สำเนาประวัติไว้
view เหนือรีจิสทรี Plugin ที่ active และ helper bootstrap ช่องทางที่บันเดิลมา
ควรถูกคำนวณใหม่จากรีจิสทรี/root ปัจจุบัน map อายุสั้นใช้ได้
ภายใน call เดียวเพื่อ dedupe งานหรือกัน reentry; ต้องไม่กลายเป็นแคช
เมทาดาตาระดับ process

สำหรับการโหลด Plugin ชั้นแคชถาวรคือการโหลดรันไทม์ มันอาจ reuse
สถานะตัวโหลดเมื่อโค้ดหรือ artifact ที่ติดตั้งถูกโหลดจริง เช่น:

- `PluginLoaderCacheState` และรีจิสทรีรันไทม์ active ที่เข้ากันได้
- แคช jiti/module และแคชตัวโหลด public-surface ที่ใช้เพื่อหลีกเลี่ยงการ import
  พื้นผิวรันไทม์เดียวกันซ้ำ
- แคชระบบไฟล์สำหรับ artifact ของ Plugin ที่ติดตั้ง
- map ต่อ call อายุสั้นสำหรับการ normalize path หรือการ resolve รายการซ้ำ

แคชเหล่านั้นเป็นรายละเอียดการ implement ฝั่งระนาบข้อมูล ต้องไม่ตอบ
คำถามของระนาบควบคุม เช่น "Plugin ใดเป็นเจ้าของผู้ให้บริการนี้?" เว้นแต่
caller ตั้งใจขอให้โหลดรันไทม์

อย่าเพิ่มแคชถาวรหรือแคชตามนาฬิกาสำหรับ:

- ผลการค้นพบ
- รีจิสทรีแมนิเฟสต์โดยตรง
- รีจิสทรีแมนิเฟสต์ที่สร้างใหม่จากดัชนี Plugin ที่ติดตั้ง
- การค้นหาเจ้าของผู้ให้บริการ การ suppress โมเดล นโยบายผู้ให้บริการ หรือเมทาดาตา
  public-artifact
- คำตอบอื่นใดที่ derive จากแมนิเฟสต์ ซึ่งแมนิเฟสต์ที่เปลี่ยน ดัชนีที่ติดตั้ง
  หรือ load path ควรมองเห็นได้ในการอ่านเมทาดาตาครั้งถัดไป

caller ที่สร้างเมทาดาตาแมนิเฟสต์ใหม่จากดัชนี Plugin ที่ติดตั้งแบบ persisted
จะสร้างรีจิสทรีนั้นใหม่ตามต้องการ ดัชนีที่ติดตั้งเป็นสถานะ source-plane ที่คงทน;
ไม่ใช่แคชเมทาดาตาใน process แบบซ่อน

## โมเดลรีจิสทรี

Plugin ที่โหลดแล้วไม่ mutate global แบบสุ่มของ core โดยตรง แต่ลงทะเบียนเข้าไปใน
รีจิสทรี Plugin ส่วนกลาง

รีจิสทรีติดตาม:

- record ของ Plugin (ตัวตน แหล่งที่มา origin สถานะ การวินิจฉัย)
- เครื่องมือ
- hook แบบเดิมและ hook ที่มี type
- ช่องทาง
- ผู้ให้บริการ
- handler RPC ของ Gateway
- เส้นทาง HTTP
- registrar ของ CLI
- บริการเบื้องหลัง
- คำสั่งที่ Plugin เป็นเจ้าของ

จากนั้นฟีเจอร์ core จะอ่านจากรีจิสทรีนั้นแทนการคุยกับโมดูล Plugin
โดยตรง สิ่งนี้ทำให้การโหลดเป็นแบบทางเดียว:

- โมดูล Plugin -> การลงทะเบียนรีจิสทรี
- รันไทม์ core -> การใช้รีจิสทรี

การแยกนี้สำคัญต่อการบำรุงรักษา หมายความว่าพื้นผิว core ส่วนใหญ่ต้องการ
จุดผสานเพียงจุดเดียว: "อ่านรีจิสทรี" ไม่ใช่ "ทำ special-case ให้ทุกโมดูล Plugin"

## Callback การผูกการสนทนา

Plugin ที่ผูกการสนทนาสามารถตอบสนองเมื่อการอนุมัติถูก resolve แล้ว

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังจากคำขอ bind
ได้รับการอนุมัติหรือปฏิเสธ:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

ฟิลด์ payload ของ callback:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: binding ที่ resolve แล้วสำหรับคำขอที่ได้รับอนุมัติ
- `request`: สรุปคำขอเดิม, detach hint, sender id และ
  เมทาดาตาการสนทนา

callback นี้เป็นการแจ้งเตือนเท่านั้น ไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ bind
การสนทนา และจะทำงานหลังการจัดการอนุมัติของ core เสร็จสิ้น

## Hook รันไทม์ของผู้ให้บริการ

Plugin ผู้ให้บริการมีสามชั้น:

- **เมทาดาตาแมนิเฟสต์** สำหรับการค้นหาก่อนรันไทม์แบบต้นทุนต่ำ:
  `setup.providers[].envVars`, ความเข้ากันได้ที่ deprecated `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **hook ช่วงคอนฟิก**: `catalog` (`discovery` แบบเดิม) รวมถึง
  `applyConfigDefaults`
- **hook รันไทม์**: hook แบบไม่บังคับ 40+ รายการ ครอบคลุม auth, การ resolve โมเดล,
  การ wrap stream, ระดับ thinking, นโยบาย replay และ endpoint การใช้งาน ดู
  รายการเต็มใน [ลำดับ hook และการใช้งาน](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ loop agent ทั่วไป, failover, การจัดการ transcript และ
นโยบายเครื่องมือ hook เหล่านี้คือพื้นผิวส่วนขยายสำหรับพฤติกรรมเฉพาะผู้ให้บริการ
โดยไม่ต้องมี transport inference แบบกำหนดเองทั้งหมด

ใช้ `setup.providers[].envVars` ในแมนิเฟสต์เมื่อผู้ให้บริการมี credential แบบ env
ที่ path auth/status/model-picker ทั่วไปควรเห็นโดยไม่ต้องโหลดรันไทม์ Plugin
`providerAuthEnvVars` ที่ deprecated ยังคงถูกอ่านโดย adapter ความเข้ากันได้ในช่วง
deprecation window และ Plugin ที่ไม่ได้บันเดิลมาซึ่งใช้มันจะได้รับการวินิจฉัยแมนิเฟสต์
ใช้ `providerAuthAliases` ในแมนิเฟสต์เมื่อ id ผู้ให้บริการหนึ่งควร reuse env vars,
auth profile, auth ที่ backed โดยคอนฟิก และตัวเลือก onboarding API-key ของ id ผู้ให้บริการอีกตัว
ใช้ `providerAuthChoices` ในแมนิเฟสต์เมื่อพื้นผิว CLI สำหรับ onboarding/auth-choice ควรรู้
id ตัวเลือกของผู้ให้บริการ ป้ายกำกับกลุ่ม และการ wiring auth แบบหนึ่ง flag ง่าย ๆ โดยไม่ต้อง
โหลดรันไทม์ผู้ให้บริการ ให้เก็บ `envVars` ของรันไทม์ผู้ให้บริการไว้สำหรับ hint ที่ operator มองเห็น
เช่น ป้ายกำกับ onboarding หรือ setup vars สำหรับ OAuth
client-id/client-secret

ใช้ `channelEnvVars` ในแมนิเฟสต์เมื่อช่องทางมี auth หรือการตั้งค่าที่ขับเคลื่อนด้วย env ซึ่ง
fallback shell-env ทั่วไป การตรวจสอบคอนฟิก/status หรือ prompt การตั้งค่าควรเห็น
โดยไม่ต้องโหลดรันไทม์ช่องทาง

### ลำดับ hook และการใช้งาน

สำหรับ Plugin โมเดล/ผู้ให้บริการ OpenClaw จะเรียก hook ตามลำดับคร่าว ๆ นี้
คอลัมน์ "ควรใช้เมื่อใด" คือคู่มือตัดสินใจอย่างรวดเร็ว
ฟิลด์ผู้ให้บริการเฉพาะความเข้ากันได้ที่ OpenClaw ไม่เรียกอีกต่อไป เช่น
`ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่ถูกระบุไว้ที่นี่โดยเจตนา

| #   | ฮุก                              | ทำอะไร                                                                                                   | ควรใช้เมื่อใด                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่การกำหนดค่าผู้ให้บริการเข้าไปใน `models.providers` ระหว่างการสร้าง `models.json`                                | ผู้ให้บริการเป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้น URL ฐาน                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นการกำหนดค่าส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการทำให้การกำหนดค่าเป็นรูปเป็นร่าง                                      | ค่าเริ่มต้นขึ้นกับโหมดการยืนยันตัวตน, env, หรือความหมายเชิง model-family ของผู้ให้บริการ                                                                         |
| --  | _(การค้นหาโมเดลในตัว)_         | OpenClaw ลองเส้นทาง registry/catalog ปกติก่อน                                                          | _(ไม่ใช่ฮุก Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | ทำให้นามแฝงรหัสโมเดลแบบเดิมหรือแบบพรีวิวเป็นมาตรฐานก่อนค้นหา                                                     | ผู้ให้บริการเป็นเจ้าของการล้างนามแฝงก่อนการแก้ไขโมเดลหลัก                                                                                 |
| 4   | `normalizeTransport`              | ทำให้ `api` / `baseUrl` ของกลุ่มผู้ให้บริการเป็นมาตรฐานก่อนการประกอบโมเดลแบบทั่วไป                                      | ผู้ให้บริการเป็นเจ้าของการล้าง transport สำหรับรหัสผู้ให้บริการแบบกำหนดเองในกลุ่ม transport เดียวกัน                                                          |
| 5   | `normalizeConfig`                 | ทำให้ `models.providers.<id>` เป็นมาตรฐานก่อนการแก้ไข runtime/ผู้ให้บริการ                                           | ผู้ให้บริการต้องการการล้างการกำหนดค่าที่ควรอยู่กับ plugin; ตัวช่วย Google-family ที่ bundled ยังช่วยรองรับรายการการกำหนดค่า Google ที่รองรับ   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียนใหม่เพื่อความเข้ากันได้ของการใช้งานสตรีมแบบเนทีฟกับผู้ให้บริการการกำหนดค่า                                               | ผู้ให้บริการต้องการการแก้ไขเมทาดาทาการใช้งานสตรีมแบบเนทีฟที่ขับเคลื่อนด้วย endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | แก้ไข auth แบบ env-marker สำหรับผู้ให้บริการการกำหนดค่าก่อนโหลด auth ของ runtime                                       | ผู้ให้บริการมีการแก้ไข API-key แบบ env-marker ที่ผู้ให้บริการเป็นเจ้าของ; `amazon-bedrock` ยังมี resolver AWS env-marker ในตัวที่นี่                  |
| 8   | `resolveSyntheticAuth`            | แสดง auth แบบ local/self-hosted หรือที่อิงการกำหนดค่าโดยไม่คงข้อความธรรมดา                                   | ผู้ให้บริการสามารถทำงานด้วยเครื่องหมายข้อมูลรับรอง synthetic/local                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | ซ้อนทับโปรไฟล์ auth ภายนอกที่ผู้ให้บริการเป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับข้อมูลรับรองที่ CLI/แอปเป็นเจ้าของ | ผู้ให้บริการนำข้อมูลรับรอง auth ภายนอกมาใช้ซ้ำโดยไม่คง refresh token ที่คัดลอกไว้; ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของ placeholder โปรไฟล์ synthetic ที่จัดเก็บไว้หลัง auth ที่อิง env/config                                      | ผู้ให้บริการจัดเก็บโปรไฟล์ placeholder แบบ synthetic ที่ไม่ควรชนะลำดับความสำคัญ                                                                 |
| 11  | `resolveDynamicModel`             | fallback แบบซิงค์สำหรับรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของซึ่งยังไม่มีใน registry ภายใน                                       | ผู้ให้บริการยอมรับรหัสโมเดล upstream ตามอำเภอใจ                                                                                                 |
| 12  | `prepareDynamicModel`             | อุ่นเครื่องแบบ async แล้ว `resolveDynamicModel` จะทำงานอีกครั้ง                                                           | ผู้ให้บริการต้องการเมทาดาทาเครือข่ายก่อนแก้ไขรหัสที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | การเขียนใหม่ขั้นสุดท้ายก่อน embedded runner ใช้โมเดลที่แก้ไขแล้ว                                               | ผู้ให้บริการต้องการการเขียน transport ใหม่ แต่ยังใช้ transport ของ core                                                                             |
| 14  | `contributeResolvedModelCompat`   | สนับสนุน flag ความเข้ากันได้สำหรับโมเดลของ vendor ที่อยู่หลัง transport อื่นที่เข้ากันได้                                  | ผู้ให้บริการรู้จักโมเดลของตนเองบน proxy transport โดยไม่เข้าควบคุมผู้ให้บริการ                                                       |
| 15  | `normalizeToolSchemas`            | ทำให้สคีมาเครื่องมือเป็นมาตรฐานก่อน embedded runner เห็น                                                    | ผู้ให้บริการต้องการการล้างสคีมาของกลุ่ม transport                                                                                                |
| 16  | `inspectToolSchemas`              | แสดงการวินิจฉัยสคีมาที่ผู้ให้บริการเป็นเจ้าของหลังการทำให้เป็นมาตรฐาน                                                  | ผู้ให้บริการต้องการคำเตือนคีย์เวิร์ดโดยไม่สอนกฎเฉพาะผู้ให้บริการให้ core                                                                 |
| 17  | `resolveReasoningOutputMode`      | เลือกสัญญาเอาต์พุต reasoning แบบเนทีฟเทียบกับแบบ tagged                                                              | ผู้ให้บริการต้องการ reasoning/เอาต์พุตสุดท้ายแบบ tagged แทนฟิลด์เนทีฟ                                                                         |
| 18  | `prepareExtraParams`              | การทำให้ request-param เป็นมาตรฐานก่อนตัวห่อ option สตรีมทั่วไป                                              | ผู้ให้บริการต้องการพารามิเตอร์คำขอเริ่มต้นหรือการล้างพารามิเตอร์รายผู้ให้บริการ                                                                           |
| 19  | `createStreamFn`                  | แทนที่เส้นทางสตรีมปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                   | ผู้ให้บริการต้องการ wire protocol แบบกำหนดเอง ไม่ใช่แค่ตัวห่อ                                                                                     |
| 20  | `wrapStreamFn`                    | ตัวห่อสตรีมหลังจากใช้ตัวห่อทั่วไปแล้ว                                                              | ผู้ให้บริการต้องการตัวห่อความเข้ากันได้ของส่วนหัว/เนื้อหา/โมเดลของคำขอโดยไม่มี transport แบบกำหนดเอง                                                          |
| 21  | `resolveTransportTurnState`       | แนบส่วนหัวหรือเมทาดาทา transport ต่อรอบแบบเนทีฟ                                                           | ผู้ให้บริการต้องการให้ transport ทั่วไปส่งตัวตนของรอบแบบเนทีฟของผู้ให้บริการ                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | แนบส่วนหัว WebSocket แบบเนทีฟหรือนโยบาย cool-down ของเซสชัน                                                    | ผู้ให้บริการต้องการให้ transport WS ทั่วไปปรับแต่งส่วนหัวเซสชันหรือนโยบาย fallback                                                               |
| 23  | `formatApiKey`                    | ตัวจัดรูปแบบ auth-profile: โปรไฟล์ที่จัดเก็บไว้กลายเป็นสตริง `apiKey` ของ runtime                                     | ผู้ให้บริการจัดเก็บเมทาดาทา auth เพิ่มเติมและต้องการรูปแบบโทเค็น runtime แบบกำหนดเอง                                                                    |
| 24  | `refreshOAuth`                    | การ override การรีเฟรช OAuth สำหรับ endpoint การรีเฟรชแบบกำหนดเองหรือนโยบายเมื่อรีเฟรชล้มเหลว                                  | ผู้ให้บริการไม่เข้ากับ refresher `pi-ai` ที่ใช้ร่วมกัน                                                                                           |
| 25  | `buildAuthDoctorHint`             | คำแนะนำการซ่อมแซมที่ต่อท้ายเมื่อการรีเฟรช OAuth ล้มเหลว                                                                  | ผู้ให้บริการต้องการคำแนะนำการซ่อมแซม auth ที่ผู้ให้บริการเป็นเจ้าของหลังการรีเฟรชล้มเหลว                                                                      |
| 26  | `matchesContextOverflowError`     | ตัวจับคู่ context-window overflow ที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการมีข้อผิดพลาด overflow ดิบที่ heuristic ทั่วไปจะพลาด                                                                                |
| 27  | `classifyFailoverReason`          | การจัดประเภทเหตุผล failover ที่ผู้ให้บริการเป็นเจ้าของ                                                                  | ผู้ให้บริการสามารถแมปข้อผิดพลาด API/transport ดิบไปยัง rate-limit/overload/ฯลฯ                                                                          |
| 28  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับผู้ให้บริการ proxy/backhaul                                                               | ผู้ให้บริการต้องการการควบคุม cache TTL เฉพาะ proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | สิ่งทดแทนข้อความกู้คืน missing-auth ทั่วไป                                                      | ผู้ให้บริการต้องการคำแนะนำการกู้คืน missing-auth เฉพาะผู้ให้บริการ                                                                                 |
| 30  | `augmentModelCatalog`             | แถวแค็ตตาล็อก synthetic/final ที่ต่อท้ายหลังการค้นพบ                                                          | ผู้ให้บริการต้องการแถว synthetic forward-compat ใน `models list` และตัวเลือก                                                                     |
| 31  | `resolveThinkingProfile`          | ชุดระดับ `/think` เฉพาะโมเดล, ป้ายกำกับการแสดงผล, และค่าเริ่มต้น                                                 | ผู้ให้บริการเปิดเผยลำดับขั้น thinking แบบกำหนดเองหรือป้ายกำกับ binary สำหรับโมเดลที่เลือก                                                                 |
| 32  | `isBinaryThinking`                | ฮุกความเข้ากันได้ของ toggle reasoning เปิด/ปิด                                                                     | ผู้ให้บริการเปิดเผยเฉพาะ thinking แบบ binary เปิด/ปิด                                                                                                  |
| 33  | `supportsXHighThinking`           | ฮุกความเข้ากันได้ของการรองรับ reasoning `xhigh`                                                                   | ผู้ให้บริการต้องการ `xhigh` เฉพาะในบางชุดย่อยของโมเดล                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | ฮุกความเข้ากันได้ของระดับ `/think` เริ่มต้น                                                                      | ผู้ให้บริการเป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับกลุ่มโมเดล                                                                                      |
| 35  | `isModernModelRef`                | ตัวจับคู่โมเดลสมัยใหม่สำหรับตัวกรองโปรไฟล์ live และการเลือก smoke                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่โมเดลที่ต้องการสำหรับ live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | แลกเปลี่ยนข้อมูลรับรองที่กำหนดค่าไว้เป็นโทเค็น/คีย์ runtime จริงก่อน inference                       | ผู้ให้บริการต้องการการแลกเปลี่ยนโทเค็นหรือข้อมูลรับรองคำขอที่มีอายุสั้น                                                                             |
| 37  | `resolveUsageAuth`                | แก้ไขข้อมูลรับรองการใช้งาน/การเรียกเก็บเงินสำหรับ `/usage` และส่วนแสดงสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องการการแยกวิเคราะห์โทเค็นการใช้งาน/โควตาแบบกำหนดเอง หรือข้อมูลรับรองการใช้งานแบบอื่น                                                               |
| 38  | `fetchUsageSnapshot`              | ดึงและปรับสแนปช็อตการใช้งาน/โควตาเฉพาะผู้ให้บริการให้เป็นรูปแบบมาตรฐานหลังจากแก้ไขการตรวจสอบสิทธิ์แล้ว                             | ผู้ให้บริการต้องการปลายทางการใช้งานเฉพาะผู้ให้บริการ หรือตัวแยกวิเคราะห์เพย์โหลด                                                                           |
| 39  | `createEmbeddingProvider`         | สร้างอะแดปเตอร์ embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา                                                     | พฤติกรรม embedding ของหน่วยความจำอยู่กับ Plugin ของผู้ให้บริการ                                                                                    |
| 40  | `buildReplayPolicy`               | ส่งคืนนโยบาย replay ที่ควบคุมการจัดการ transcript สำหรับผู้ให้บริการ                                        | ผู้ให้บริการต้องการนโยบาย transcript แบบกำหนดเอง (เช่น การตัดบล็อกความคิดออก)                                                               |
| 41  | `sanitizeReplayHistory`           | เขียนประวัติ replay ใหม่หลังจากการล้าง transcript ทั่วไป                                                        | ผู้ให้บริการต้องการการเขียน replay ใหม่เฉพาะผู้ให้บริการ นอกเหนือจากตัวช่วย Compaction ที่ใช้ร่วมกัน                                                             |
| 42  | `validateReplayTurns`             | ตรวจสอบความถูกต้องหรือปรับรูปทรง replay-turn ขั้นสุดท้ายก่อนตัวรันแบบฝังตัว                                           | ทรานสปอร์ตของผู้ให้บริการต้องการการตรวจสอบความถูกต้องของเทิร์นที่เข้มงวดขึ้นหลังจากการทำความสะอาดทั่วไป                                                                    |
| 43  | `onModelSelected`                 | เรียกใช้ผลข้างเคียงหลังการเลือกที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการต้องการ telemetry หรือสถานะที่ผู้ให้บริการเป็นเจ้าของเมื่อโมเดลเริ่มใช้งาน                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
Plugin ผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงปล่อยต่อไปยัง Plugin ผู้ให้บริการอื่น
ที่มี hook ได้ จนกว่าจะมีตัวใดเปลี่ยน model id หรือ transport/config จริง ๆ วิธีนี้ช่วยให้
shim ของผู้ให้บริการ alias/compat ทำงานได้โดยไม่ต้องให้ผู้เรียกรู้ว่า
Plugin ที่รวมมาตัวใดเป็นเจ้าของการเขียนใหม่ หากไม่มี hook ของผู้ให้บริการใดเขียนใหม่ให้กับ
รายการ config ในตระกูล Google ที่รองรับ ตัว normalize config ของ Google ที่รวมมาก็ยังใช้
การล้างค่าความเข้ากันได้นั้นอยู่

หากผู้ให้บริการต้องใช้โปรโตคอลสายส่งที่กำหนดเองทั้งหมดหรือตัวดำเนินการคำขอที่กำหนดเอง
นั่นเป็น extension คนละประเภทกัน hook เหล่านี้มีไว้สำหรับพฤติกรรมของผู้ให้บริการ
ที่ยังทำงานบน inference loop ปกติของ OpenClaw

### ตัวอย่างผู้ให้บริการ

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### ตัวอย่างในตัว

Plugin ผู้ให้บริการที่รวมมาจะผสาน hook ด้านบนให้เหมาะกับ catalog,
auth, thinking, replay และความต้องการด้าน usage ของแต่ละ vendor ชุด hook ที่เป็นแหล่งอ้างอิงหลักอยู่กับ
แต่ละ Plugin ใต้ `extensions/`; หน้านี้แสดงรูปทรงแทนการสะท้อนรายการแบบตรงตัว

<AccordionGroup>
  <Accordion title="ผู้ให้บริการ catalog แบบส่งผ่าน">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` พร้อม
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้แสดง model id จาก upstream
    ก่อน catalog แบบคงที่ของ OpenClaw ได้
  </Accordion>
  <Accordion title="ผู้ให้บริการปลายทาง OAuth และ usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของการแลก token และการผสาน `/usage`
  </Accordion>
  <Accordion title="ตระกูลการล้าง replay และ transcript">
    ตระกูลชื่อที่ใช้ร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ช่วยให้ผู้ให้บริการ opt in
    นโยบาย transcript ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin
    จะนำการล้างไป implement ใหม่เอง
  </Accordion>
  <Accordion title="ผู้ให้บริการที่มีเฉพาะ catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนแค่ `catalog` และใช้ inference loop ร่วมกัน
  </Accordion>
  <Accordion title="ตัวช่วย stream เฉพาะ Anthropic">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน
    seam สาธารณะ `api.ts` / `contract-api.ts` ของ Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
    SDK ทั่วไป
  </Accordion>
</AccordionGroup>

## ตัวช่วย runtime

Plugin สามารถเข้าถึงตัวช่วย core ที่เลือกไว้ผ่าน `api.runtime` สำหรับ TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

หมายเหตุ:

- `textToSpeech` ส่งคืน payload เอาต์พุต TTS ของ core ปกติสำหรับพื้นผิว file/voice-note
- ใช้ config `messages.tts` ของ core และการเลือกผู้ให้บริการ
- ส่งคืน PCM audio buffer + sample rate Plugin ต้อง resample/encode สำหรับผู้ให้บริการ
- `listVoices` เป็น optional ต่อผู้ให้บริการ ใช้สำหรับตัวเลือกเสียงหรือ flow ตั้งค่าที่ vendor เป็นเจ้าของ
- รายการเสียงอาจมี metadata ที่ละเอียดขึ้น เช่น locale, gender และแท็ก personality สำหรับตัวเลือกที่รับรู้ผู้ให้บริการ
- OpenAI และ ElevenLabs รองรับ telephony ในปัจจุบัน Microsoft ไม่รองรับ

Plugin ยังสามารถลงทะเบียนผู้ให้บริการ speech ผ่าน `api.registerSpeechProvider(...)` ได้ด้วย

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

หมายเหตุ:

- เก็บนโยบาย TTS, fallback และการส่ง reply ไว้ใน core
- ใช้ผู้ให้บริการ speech สำหรับพฤติกรรม synthesis ที่ vendor เป็นเจ้าของ
- อินพุต Microsoft เดิม `edge` ถูก normalize เป็น provider id `microsoft`
- โมเดลความเป็นเจ้าของที่แนะนำคือมุ่งตามบริษัท: Plugin vendor หนึ่งตัวสามารถเป็นเจ้าของ
  text, speech, image และผู้ให้บริการ media ในอนาคตได้เมื่อ OpenClaw เพิ่ม
  capability contract เหล่านั้น

สำหรับความเข้าใจ image/audio/video, Plugin ลงทะเบียนผู้ให้บริการ
media-understanding แบบมี type หนึ่งตัวแทน generic key/value bag:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

หมายเหตุ:

- เก็บ orchestration, fallback, config และการ wiring channel ไว้ใน core
- เก็บพฤติกรรม vendor ไว้ใน Plugin ผู้ให้บริการ
- การขยายแบบ additive ควรยังมี type: เมธอด optional ใหม่, ฟิลด์ผลลัพธ์ optional ใหม่,
  capability optional ใหม่
- การสร้างวิดีโอใช้รูปแบบเดียวกันอยู่แล้ว:
  - core เป็นเจ้าของ capability contract และตัวช่วย runtime
  - Plugin vendor ลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - Plugin feature/channel ใช้ `api.runtime.videoGeneration.*`

สำหรับตัวช่วย runtime ด้าน media-understanding, Plugin สามารถเรียก:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

สำหรับ audio transcription, Plugin สามารถใช้ได้ทั้ง runtime media-understanding
หรือ alias STT แบบเก่า:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` คือพื้นผิวที่ใช้ร่วมกันที่แนะนำสำหรับ
  ความเข้าใจ image/audio/video
- `extractStructuredWithModel(...)` คือ seam ที่หันหน้าให้ Plugin สำหรับการสกัด
  แบบมีขอบเขตและมีผู้ให้บริการเป็นเจ้าของ โดยเน้น image เป็นหลัก ใส่อินพุต image อย่างน้อยหนึ่งรายการ;
  อินพุต text เป็นบริบทเสริม
  Plugin ผลิตภัณฑ์เป็นเจ้าของ route และ schema ของตน ส่วน OpenClaw เป็นเจ้าของ
  ขอบเขต provider/runtime
- ใช้ config audio ด้าน media-understanding ของ core (`tools.media.audio`) และลำดับ fallback ของผู้ให้บริการ
- ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุต transcription ถูกสร้างขึ้น เช่น อินพุตถูกข้าม/ไม่รองรับ
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็น alias เพื่อความเข้ากันได้

Plugin ยังสามารถเปิด background subagent run ผ่าน `api.runtime.subagent` ได้ด้วย:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

หมายเหตุ:

- `provider` และ `model` เป็น override ต่อ run แบบ optional ไม่ใช่การเปลี่ยน session แบบถาวร
- OpenClaw เคารพฟิลด์ override เหล่านั้นเฉพาะกับผู้เรียกที่ trusted เท่านั้น
- สำหรับ fallback run ที่ Plugin เป็นเจ้าของ operator ต้อง opt in ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด Plugin ที่ trusted ให้ใช้เป้าหมาย canonical `provider/model` เฉพาะ หรือ `"*"` เพื่ออนุญาตเป้าหมายใดก็ได้อย่างชัดเจน
- subagent run ของ Plugin ที่ untrusted ยังทำงานได้ แต่คำขอ override จะถูกปฏิเสธแทนที่จะ fallback แบบเงียบ ๆ
- session subagent ที่ Plugin สร้างจะถูกแท็กด้วย plugin id ที่สร้าง Fallback `api.runtime.subagent.deleteSession(...)` อาจลบได้เฉพาะ session ที่เป็นเจ้าของเหล่านั้น; การลบ session ใด ๆ โดยอิสระยังต้องใช้คำขอ Gateway ที่มีขอบเขต admin

สำหรับ web search, Plugin สามารถใช้ตัวช่วย runtime ร่วมกันแทนการ
เข้าไปแตะ wiring ของเครื่องมือ agent:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin ยังสามารถลงทะเบียนผู้ให้บริการ web-search ผ่าน
`api.registerWebSearchProvider(...)` ได้ด้วย

หมายเหตุ:

- เก็บการเลือกผู้ให้บริการ, การ resolve credential และ semantics ของคำขอร่วมกันไว้ใน core
- ใช้ผู้ให้บริการ web-search สำหรับ transport การค้นหาเฉพาะ vendor
- `api.runtime.webSearch.*` คือพื้นผิวที่ใช้ร่วมกันที่แนะนำสำหรับ Plugin feature/channel ที่ต้องใช้พฤติกรรม search โดยไม่ขึ้นกับ wrapper เครื่องมือ agent

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: สร้างรูปภาพโดยใช้ chain ผู้ให้บริการ image-generation ที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการผู้ให้บริการ image-generation ที่พร้อมใช้งานและ capability ของพวกเขา

## route HTTP ของ Gateway

Plugin สามารถเปิดเผยปลายทาง HTTP ด้วย `api.registerHttpRoute(...)`

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

ฟิลด์ของ route:

- `path`: path ของ route ใต้เซิร์ฟเวอร์ HTTP ของ Gateway
- `auth`: ต้องระบุ ใช้ `"gateway"` เพื่อบังคับใช้ auth Gateway ปกติ หรือ `"plugin"` สำหรับ auth/การตรวจสอบ webhook ที่ Plugin จัดการ
- `match`: optional `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: optional อนุญาตให้ Plugin เดียวกันแทนที่การลงทะเบียน route เดิมของตนเอง
- `handler`: ส่งคืน `true` เมื่อ route จัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกนำออกแล้วและจะทำให้เกิดข้อผิดพลาดในการโหลด Plugin ใช้ `api.registerHttpRoute(...)` แทน
- เส้นทางของ Plugin ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` ที่ตรงกันพอดีจะถูกปฏิเสธ เว้นแต่จะระบุ `replaceExisting: true` และ Plugin หนึ่งไม่สามารถแทนที่เส้นทางของอีก Plugin ได้
- เส้นทางที่ทับซ้อนกันและมีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้คงสายโซ่การส่งต่อ `exact`/`prefix` ไว้ที่ระดับ auth เดียวกันเท่านั้น
- เส้นทาง `auth: "plugin"` จะ **ไม่ได้** รับสโคปรันไทม์ของผู้ปฏิบัติงานโดยอัตโนมัติ เส้นทางเหล่านี้มีไว้สำหรับ Webhook/การตรวจสอบลายเซ็นที่ Plugin จัดการ ไม่ใช่การเรียกตัวช่วย Gateway ที่มีสิทธิ์สูง
- เส้นทาง `auth: "gateway"` ทำงานภายในสโคปรันไทม์ของคำขอ Gateway แต่สโคปนั้นตั้งใจให้จำกัดอย่างระมัดระวัง:
  - การยืนยันตัวตนแบบ bearer ด้วยความลับร่วม (`gateway.auth.mode = "token"` / `"password"`) จะตรึงสโคปรันไทม์ของเส้นทาง Plugin ไว้ที่ `operator.write` แม้ว่าผู้เรียกจะส่ง `x-openclaw-scopes` มาก็ตาม
  - โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บนทางเข้าแบบส่วนตัว) จะเคารพ `x-openclaw-scopes` เฉพาะเมื่อมีส่วนหัวนี้อย่างชัดเจนเท่านั้น
  - หากไม่มี `x-openclaw-scopes` ในคำขอเส้นทาง Plugin ที่มีตัวตนเหล่านั้น สโคปรันไทม์จะย้อนกลับไปเป็น `operator.write`
- กฎเชิงปฏิบัติ: อย่าถือว่าเส้นทาง Plugin ที่ยืนยันตัวตนผ่าน Gateway เป็นพื้นผิวผู้ดูแลโดยนัย หากเส้นทางของคุณต้องการพฤติกรรมเฉพาะผู้ดูแล ให้กำหนดให้ใช้โหมด auth ที่มีตัวตน และจัดทำเอกสารสัญญาส่วนหัว `x-openclaw-scopes` อย่างชัดเจน

## เส้นทางนำเข้า Plugin SDK

ใช้เส้นทางย่อย SDK แบบแคบแทน barrel ราก `openclaw/plugin-sdk` แบบรวมศูนย์
เมื่อสร้าง Plugin ใหม่ เส้นทางย่อยหลัก:

| เส้นทางย่อย                         | วัตถุประสงค์                                      |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin              |
| `openclaw/plugin-sdk/channel-core`  | ตัวช่วยการเข้า/สร้างช่องทาง                       |
| `openclaw/plugin-sdk/core`          | ตัวช่วยร่วมทั่วไปและสัญญาครอบคลุม                 |
| `openclaw/plugin-sdk/config-schema` | สคีมา Zod ของราก `openclaw.json` (`OpenClawSchema`) |

Plugin ช่องทางเลือกใช้จากตระกูล seam แบบแคบ ได้แก่ `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรมการอนุมัติควรรวมศูนย์
บนสัญญา `approvalCapability` เดียว แทนที่จะผสมข้ามฟิลด์ Plugin ที่ไม่เกี่ยวข้องกัน
ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

ตัวช่วยรันไทม์และการกำหนดค่าอยู่ใต้เส้นทางย่อย `*-runtime` ที่เจาะจงตรงกัน
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` เป็นต้น) ควรใช้ `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` และ `config-mutation`
แทน barrel ความเข้ากันได้ `config-runtime` แบบกว้าง

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
และ `openclaw/plugin-sdk/infra-runtime` เป็น shim ความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับ
Plugin รุ่นเก่า โค้ดใหม่ควรนำเข้า primitive ทั่วไปที่แคบกว่าแทน
</Info>

จุดเข้าใช้งานภายในรีโป (ต่อรากแพ็กเกจ Plugin ที่บันเดิลมา):

- `index.js` — จุดเข้า Plugin ที่บันเดิลมา
- `api.js` — barrel สำหรับตัวช่วย/ชนิดข้อมูล
- `runtime-api.js` — barrel เฉพาะรันไทม์
- `setup-entry.js` — จุดเข้า Plugin สำหรับการตั้งค่า

Plugin ภายนอกควรนำเข้าเฉพาะเส้นทางย่อย `openclaw/plugin-sdk/*` เท่านั้น ห้าม
นำเข้า `src/*` ของแพ็กเกจ Plugin อื่นจาก core หรือจาก Plugin อื่น
จุดเข้าใช้งานที่โหลดผ่าน facade จะเลือกสแนปช็อตการกำหนดค่ารันไทม์ที่ใช้งานอยู่ก่อนเมื่อมี
จากนั้นจึงย้อนกลับไปใช้ไฟล์การกำหนดค่าที่ resolve แล้วบนดิสก์

เส้นทางย่อยเฉพาะความสามารถ เช่น `image-generation`, `media-understanding`,
และ `speech` มีอยู่เพราะ Plugin ที่บันเดิลมาใช้อยู่ในปัจจุบัน เส้นทางเหล่านี้ไม่ใช่
สัญญาภายนอกระยะยาวที่ถูกตรึงโดยอัตโนมัติ โปรดตรวจสอบหน้าอ้างอิง SDK ที่เกี่ยวข้อง
เมื่อพึ่งพาเส้นทางเหล่านี้

## สคีมาของเครื่องมือข้อความ

Plugin ควรเป็นเจ้าของการเพิ่มสคีมา `describeMessageTool(...)` เฉพาะช่องทาง
สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น ปฏิกิริยา การอ่าน และโพล
การนำเสนอการส่งแบบร่วมควรใช้สัญญา `MessagePresentation` ทั่วไป
แทนฟิลด์ปุ่ม คอมโพเนนต์ บล็อก หรือการ์ดแบบเนทีฟของ provider
ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) สำหรับสัญญา
กฎ fallback การแมป provider และรายการตรวจสอบสำหรับผู้สร้าง Plugin

Plugin ที่ส่งได้จะประกาศสิ่งที่แสดงผลได้ผ่านความสามารถของข้อความ:

- `presentation` สำหรับบล็อกการนำเสนอเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอการส่งแบบปักหมุด

core เป็นผู้ตัดสินว่าจะเรนเดอร์การนำเสนอแบบเนทีฟหรือปรับลดเป็นข้อความ
อย่าเปิดช่องทางลัด UI แบบเนทีฟของ provider จากเครื่องมือข้อความทั่วไป
ตัวช่วย SDK ที่เลิกแนะนำแล้วสำหรับสคีมาเนทีฟแบบเดิมยังคงถูก export สำหรับ
Plugin บุคคลที่สามที่มีอยู่ แต่ Plugin ใหม่ไม่ควรใช้

## การ resolve เป้าหมายช่องทาง

Plugin ช่องทางควรเป็นเจ้าของความหมายของเป้าหมายเฉพาะช่องทาง ให้โฮสต์
ขาออกแบบร่วมยังคงเป็นแบบทั่วไป และใช้พื้นผิวอะแดปเตอร์การส่งข้อความสำหรับกฎของ provider:

- `messaging.inferTargetChatType({ to })` ตัดสินว่าเป้าหมายที่ปรับให้อยู่ในรูปมาตรฐานแล้ว
  ควรถูกมองเป็น `direct`, `group` หรือ `channel` ก่อนค้นหาไดเรกทอรี
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่า
  อินพุตควรข้ามตรงไปยังการ resolve แบบคล้าย id แทนการค้นหาไดเรกทอรีหรือไม่
- `messaging.targetResolver.resolveTarget(...)` เป็น fallback ของ Plugin เมื่อ
  core ต้องการการ resolve ขั้นสุดท้ายที่ provider เป็นเจ้าของ หลังการทำให้เป็นมาตรฐานหรือหลัง
  ค้นหาไดเรกทอรีไม่พบ
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้างเส้นทางเซสชัน
  เฉพาะ provider เมื่อ resolve เป้าหมายแล้ว

การแบ่งงานที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจหมวดหมู่ที่ควรเกิดก่อน
  การค้นหา peer/group
- ใช้ `looksLikeId` สำหรับการตรวจสอบ "ให้ถือค่านี้เป็น id เป้าหมายแบบชัดเจน/เนทีฟ"
- ใช้ `resolveTarget` สำหรับ fallback การทำให้เป็นมาตรฐานเฉพาะ provider ไม่ใช่สำหรับ
  การค้นหาไดเรกทอรีแบบกว้าง
- เก็บ id แบบเนทีฟของ provider เช่น chat id, thread id, JID, handle และ room
  id ไว้ภายในค่า `target` หรือพารามิเตอร์เฉพาะ provider ไม่ใช่ในฟิลด์ SDK ทั่วไป

## ไดเรกทอรีที่มีการกำหนดค่าเป็นแหล่งข้อมูล

Plugin ที่สร้างรายการไดเรกทอรีจากการกำหนดค่าควรเก็บตรรกะนั้นไว้ใน
Plugin และใช้ตัวช่วยร่วมจาก
`openclaw/plugin-sdk/directory-runtime` ซ้ำ

ใช้สิ่งนี้เมื่อช่องทางต้องการ peer/group ที่มีการกำหนดค่าเป็นแหล่งข้อมูล เช่น:

- peer DM ที่ขับเคลื่อนด้วย allowlist
- แผนที่ช่องทาง/กลุ่มที่กำหนดค่าไว้
- fallback ไดเรกทอรีแบบคงที่ที่จำกัดตามบัญชี

ตัวช่วยร่วมใน `directory-runtime` จัดการเฉพาะการดำเนินการทั่วไป:

- การกรองคิวรี
- การใช้ limit
- ตัวช่วยการตัดรายการซ้ำ/การทำให้เป็นมาตรฐาน
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีเฉพาะช่องทางและการทำให้ id เป็นมาตรฐานควรอยู่ใน
การใช้งานของ Plugin

## แค็ตตาล็อก provider

Plugin provider สามารถกำหนดแค็ตตาล็อกโมเดลสำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` คืนรูปแบบเดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับรายการ provider หนึ่งรายการ
- `{ providers }` สำหรับรายการ provider หลายรายการ

ใช้ `catalog` เมื่อ Plugin เป็นเจ้าของ id โมเดลเฉพาะ provider ค่าเริ่มต้น
base URL หรือเมตาดาต้าโมเดลที่ถูกควบคุมด้วย auth

`catalog.order` ควบคุมว่าแค็ตตาล็อกของ Plugin จะรวมสัมพันธ์กับ provider โดยนัย
ในตัวของ OpenClaw เมื่อใด:

- `simple`: provider แบบ API key หรือขับเคลื่อนด้วย env ธรรมดา
- `profile`: provider ที่ปรากฏเมื่อมีโปรไฟล์ auth
- `paired`: provider ที่สังเคราะห์รายการ provider ที่เกี่ยวข้องกันหลายรายการ
- `late`: รอบสุดท้าย หลัง provider โดยนัยอื่น

provider ที่มาทีหลังจะชนะเมื่อ key ชนกัน ดังนั้น Plugin จึงสามารถตั้งใจ override
รายการ provider ในตัวด้วย id provider เดียวกันได้

Plugin ยังสามารถเผยแพร่แถวโมเดลแบบอ่านอย่างเดียวผ่าน
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` นี่คือเส้นทางข้างหน้าสำหรับพื้นผิวรายการ/ความช่วยเหลือ/ตัวเลือก และรองรับแถว
`text`, `image_generation`, `video_generation` และ `music_generation`
Plugin provider ยังคงเป็นเจ้าของการเรียก endpoint สด การแลกเปลี่ยน token และการแมป
การตอบกลับของ vendor ส่วน core เป็นเจ้าของรูปแบบแถวร่วม ป้ายกำกับแหล่งที่มา และ
การจัดรูปแบบความช่วยเหลือของเครื่องมือสื่อ การลงทะเบียน provider สำหรับการสร้างสื่อจะสังเคราะห์แถว
แค็ตตาล็อกแบบคงที่โดยอัตโนมัติจาก `defaultModel`, `models` และ `capabilities`

ความเข้ากันได้:

- `discovery` ยังทำงานเป็น alias แบบเดิม แต่จะส่งคำเตือนการเลิกใช้งาน
- หากลงทะเบียนทั้ง `catalog` และ `discovery` OpenClaw จะใช้ `catalog`
- `augmentModelCatalog` เลิกแนะนำแล้ว provider ที่บันเดิลมาควรเผยแพร่
  แถวเสริมผ่าน `registerModelCatalogProvider`

## การตรวจสอบช่องทางแบบอ่านอย่างเดียว

หาก Plugin ของคุณลงทะเบียนช่องทาง ควร implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือเส้นทางรันไทม์ เส้นทางนี้ได้รับอนุญาตให้สมมติว่า credential
  ถูก materialize ครบถ้วนแล้ว และสามารถล้มเหลวทันทีเมื่อ secret ที่จำเป็นหายไป
- เส้นทางคำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และ flow การซ่อมแซม doctor/config
  ไม่ควรต้อง materialize credential รันไทม์เพียงเพื่อ
  อธิบายการกำหนดค่า

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนเฉพาะสถานะบัญชีแบบอธิบายได้
- รักษา `enabled` และ `configured`
- รวมฟิลด์แหล่งที่มา/สถานะของ credential เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืนค่า token ดิบเพียงเพื่อรายงานความพร้อมใช้งาน
  แบบอ่านอย่างเดียว การคืน `tokenStatus: "available"` (และฟิลด์แหล่งที่มาที่ตรงกัน)
  ก็เพียงพอสำหรับคำสั่งแบบสถานะ
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดค่าผ่าน SecretRef แต่
  ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน

สิ่งนี้ช่วยให้คำสั่งแบบอ่านอย่างเดียวรายงานว่า "กำหนดค่าแล้วแต่ไม่พร้อมใช้งานในเส้นทางคำสั่งนี้"
แทนที่จะล้มเหลวหรือรายงานบัญชีผิดว่าไม่ได้กำหนดค่า

## แพ็กแพ็กเกจ

ไดเรกทอรี Plugin อาจมี `package.json` ที่มี `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น Plugin หาก pack ระบุ extension หลายรายการ id ของ Plugin
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณนำเข้า npm deps ให้ติดตั้งไว้ในไดเรกทอรีนั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

แนวป้องกันด้านความปลอดภัย: ทุก entry ของ `openclaw.extensions` ต้องคงอยู่ภายในไดเรกทอรี Plugin
หลังจาก resolve symlink แล้ว entry ที่หลุดออกจากไดเรกทอรีแพ็กเกจจะถูก
ปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependency ของ Plugin ด้วย
`npm install --omit=dev --ignore-scripts` แบบภายในโปรเจกต์ (ไม่มี lifecycle script,
ไม่มี dev dependency ในรันไทม์) โดยไม่ใช้การตั้งค่า npm install ส่วนกลางที่สืบทอดมา
ควรรักษาต้นไม้ dependency ของ Plugin ให้เป็น "JS/TS ล้วน" และหลีกเลี่ยงแพ็กเกจที่ต้องใช้
การ build ผ่าน `postinstall`

ตัวเลือก: `openclaw.setupEntry` สามารถชี้ไปยังโมดูลขนาดเบาสำหรับการตั้งค่าเท่านั้น
เมื่อ OpenClaw ต้องการพื้นผิวการตั้งค่าสำหรับ Plugin ช่องทางที่ปิดใช้งานอยู่ หรือ
เมื่อ Plugin ช่องทางเปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า OpenClaw จะโหลด `setupEntry`
แทนจุดเข้า Plugin แบบเต็ม วิธีนี้ทำให้การเริ่มต้นและการตั้งค่าเบาลง
เมื่อจุดเข้า Plugin หลักของคุณยังเชื่อมเครื่องมือ hook หรือโค้ดอื่นที่ใช้เฉพาะรันไทม์

ตัวเลือก: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถให้ Plugin ช่องทางเลือกเข้าสู่เส้นทาง `setupEntry` เดียวกันในระหว่างเฟสเริ่มต้นก่อน listen
ของ Gateway ได้ แม้ว่าช่องทางจะถูกกำหนดค่าไว้แล้วก็ตาม

ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิวการเริ่มต้นที่ต้องมีอยู่ก่อน Gateway เริ่มรับฟังอย่างครบถ้วนเท่านั้น ในทางปฏิบัติ หมายความว่า setup entry ต้องลงทะเบียนความสามารถทั้งหมดที่ช่องทางเป็นเจ้าของซึ่งการเริ่มต้นพึ่งพา เช่น:

- การลงทะเบียนช่องทางเอง
- HTTP routes ใดๆ ที่ต้องพร้อมใช้งานก่อน Gateway เริ่มรับฟัง
- gateway methods, tools หรือ services ใดๆ ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หาก full entry ของคุณยังคงเป็นเจ้าของความสามารถสำหรับการเริ่มต้นที่จำเป็นใดๆ อย่าเปิดใช้ flag นี้ ให้คง Plugin ไว้ตามพฤติกรรมเริ่มต้นและให้ OpenClaw โหลด full entry ระหว่างการเริ่มต้น

ช่องทางที่บันเดิลมาด้วยยังสามารถเผยแพร่ helpers สำหรับพื้นผิวสัญญาแบบ setup-only ที่ core สามารถตรวจสอบก่อนโหลด runtime ของช่องทางแบบเต็มได้ พื้นผิวการเลื่อนระดับการตั้งค่าปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core ใช้พื้นผิวนั้นเมื่อจำเป็นต้องเลื่อนระดับ config ช่องทางแบบ single-account เดิมไปเป็น `channels.<id>.accounts.*` โดยไม่ต้องโหลด full plugin entry
Matrix เป็นตัวอย่างที่บันเดิลอยู่ในปัจจุบัน: จะย้ายเฉพาะคีย์ auth/bootstrap ไปยังบัญชีที่ถูกเลื่อนระดับแบบมีชื่อเมื่อมี named accounts อยู่แล้ว และสามารถรักษาคีย์ default-account ที่กำหนดค่าไว้ซึ่งไม่ใช่ canonical ไว้ได้ แทนที่จะสร้าง `accounts.default` เสมอ

setup patch adapters เหล่านั้นทำให้การค้นพบพื้นผิวสัญญาที่บันเดิลมาเป็นแบบ lazy เวลา import จึงยังเบาอยู่; พื้นผิวการเลื่อนระดับจะถูกโหลดเฉพาะเมื่อใช้งานครั้งแรก แทนที่จะกลับเข้าสู่การเริ่มต้นช่องทางที่บันเดิลมาระหว่าง module import

เมื่อพื้นผิวการเริ่มต้นเหล่านั้นรวม gateway RPC methods ไว้ ให้เก็บไว้ภายใต้ prefix เฉพาะ Plugin namespaces สำหรับ core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และ resolve เป็น `operator.admin` เสมอ แม้ว่า Plugin จะร้องขอ scope ที่แคบกว่า

ตัวอย่าง:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata ของ catalog ช่องทาง

Channel plugins สามารถประกาศ metadata สำหรับ setup/discovery ผ่าน `openclaw.channel` และคำแนะนำการติดตั้งผ่าน `openclaw.install` ได้ วิธีนี้ทำให้ข้อมูล catalog ของ core ว่างเปล่าจากข้อมูลเฉพาะ

ตัวอย่าง:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

ฟิลด์ `openclaw.channel` ที่มีประโยชน์นอกเหนือจากตัวอย่างขั้นต่ำ:

- `detailLabel`: label รองสำหรับพื้นผิว catalog/status ที่สมบูรณ์ขึ้น
- `docsLabel`: override ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: ids ของ Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่ง catalog entry นี้ควรมีอันดับเหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controls สำหรับข้อความบน selection-surface
- `markdownCapable`: ทำเครื่องหมายว่าช่องทางรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนช่องทางจากพื้นผิวรายการ configured-channel เมื่อตั้งค่าเป็น `false`
- `exposure.setup`: ซ่อนช่องทางจากตัวเลือก interactive setup/configure เมื่อตั้งค่าเป็น `false`
- `exposure.docs`: ทำเครื่องหมายช่องทางเป็น internal/private สำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: aliases แบบ legacy ที่ยังยอมรับเพื่อความเข้ากันได้; แนะนำให้ใช้ `exposure`
- `quickstartAllowFrom`: opt ช่องทางเข้าสู่ flow `allowFrom` ของ quickstart มาตรฐาน
- `forceAccountBinding`: บังคับให้ bind บัญชีอย่างชัดเจนแม้มีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: แนะนำให้ใช้ session lookup เมื่อ resolve announce targets

OpenClaw ยังสามารถ merge **external channel catalogs** ได้ด้วย (เช่น export จาก MPM registry) วางไฟล์ JSON ไว้ที่ตำแหน่งใดตำแหน่งหนึ่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยังไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วย comma/semicolon/`PATH`) แต่ละไฟล์ควรมี `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` ตัว parser ยังยอมรับ `"packages"` หรือ `"plugins"` เป็น aliases แบบ legacy สำหรับคีย์ `"entries"` ด้วย

รายการ channel catalog ที่สร้างขึ้นและรายการ provider install catalog จะเปิดเผยข้อเท็จจริง install-source ที่ทำให้เป็นมาตรฐานแล้วถัดจาก block `openclaw.install` ดิบ ข้อเท็จจริงที่ทำให้เป็นมาตรฐานจะระบุว่า npm spec เป็น exact version หรือ floating selector, มี expected integrity metadata อยู่หรือไม่ และมี local source path พร้อมใช้งานด้วยหรือไม่ เมื่อรู้ identity ของ catalog/package แล้ว ข้อเท็จจริงที่ทำให้เป็นมาตรฐานจะเตือนหากชื่อ npm package ที่ parse ได้คลาดจาก identity นั้น นอกจากนี้ยังเตือนเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยัง source ที่ไม่พร้อมใช้งาน และเมื่อมี npm integrity metadata โดยไม่มี npm source ที่ถูกต้อง Consumers ควรมอง `installSource` เป็นฟิลด์ optional แบบ additive เพื่อให้ entries ที่สร้างด้วยมือและ catalog shims ไม่จำเป็นต้องสังเคราะห์ฟิลด์นี้
สิ่งนี้ทำให้ onboarding และ diagnostics อธิบายสถานะ source-plane ได้โดยไม่ต้อง import plugin runtime

รายการ npm ภายนอกอย่างเป็นทางการควรเลือกใช้ `npmSpec` แบบ exact พร้อม `expectedIntegrity` เป็นหลัก ชื่อ package แบบเปล่าและ dist-tags ยังคงใช้งานได้เพื่อความเข้ากันได้ แต่จะแสดงคำเตือน source-plane เพื่อให้ catalog สามารถขยับไปสู่การติดตั้งที่ปักหมุดและตรวจสอบ integrity แล้วโดยไม่ทำให้ Plugin ที่มีอยู่เสียหาย เมื่อ onboarding ติดตั้งจาก local catalog path จะบันทึก managed plugin plugin index entry พร้อม `source: "path"` และ `sourcePath` ที่ relative กับ workspace เมื่อทำได้ absolute operational load path ยังคงอยู่ใน `plugins.load.paths`; install record หลีกเลี่ยงการทำซ้ำ local workstation paths ลงใน config ที่มีอายุยาว วิธีนี้ทำให้การติดตั้งเพื่อพัฒนา local มองเห็นได้สำหรับ source-plane diagnostics โดยไม่เพิ่มพื้นผิวการเปิดเผย raw filesystem-path อีกชั้น persisted plugin index `plugins/installs.json` เป็น source of truth สำหรับการติดตั้ง และสามารถ refresh ได้โดยไม่ต้องโหลด plugin runtime modules map `installRecords` ของมันคงทนแม้เมื่อ plugin manifest หายไปหรือไม่ถูกต้อง; array `plugins` ของมันเป็น manifest view ที่สร้างใหม่ได้

## Context engine plugins

Context engine plugins เป็นเจ้าของการประสาน session context สำหรับ ingest, assembly และ compaction ลงทะเบียนจาก Plugin ของคุณด้วย `api.registerContextEngine(id, factory)` จากนั้นเลือก active engine ด้วย `plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ Plugin ของคุณต้องแทนที่หรือขยาย context pipeline เริ่มต้น แทนที่จะเพียงเพิ่ม memory search หรือ hooks

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

factory `ctx` เปิดเผยค่า `config`, `agentDir` และ `workspaceDir` แบบ optional สำหรับการเริ่มต้นในช่วง construction-time

หาก engine ของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึม Compaction ให้คง `compact()` ไว้และ delegate อย่างชัดเจน:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## การเพิ่มความสามารถใหม่

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าข้ามระบบ Plugin ด้วยการเข้าถึง private reach-in ให้เพิ่มความสามารถที่ขาดอยู่

ลำดับที่แนะนำ:

1. กำหนด core contract
   ตัดสินใจว่า shared behavior ใดที่ core ควรเป็นเจ้าของ: policy, fallback, config merge,
   lifecycle, semantics ที่ channel-facing และรูปแบบ runtime helper
2. เพิ่มพื้นผิว plugin registration/runtime ที่มี type
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิวความสามารถที่ typed ขนาดเล็กที่สุดที่มีประโยชน์
3. ต่อสาย core + channel/feature consumers
   Channels และ feature plugins ควรใช้ความสามารถใหม่ผ่าน core ไม่ใช่โดย import vendor implementation โดยตรง
4. ลงทะเบียน vendor implementations
   จากนั้น vendor plugins ลงทะเบียน backends ของตนกับความสามารถนั้น
5. เพิ่ม contract coverage
   เพิ่ม tests เพื่อให้ ownership และ registration shape ยังชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw ยังคงมีจุดยืนของตัวเองโดยไม่ hardcode ไปกับ worldview ของ provider รายเดียว ดู [Capability Cookbook](/th/plugins/adding-capabilities) สำหรับ checklist ไฟล์และตัวอย่างแบบลงมือทำที่เป็นรูปธรรม

### Checklist ความสามารถ

เมื่อคุณเพิ่มความสามารถใหม่ implementation ควรแตะพื้นผิวเหล่านี้ร่วมกันโดยทั่วไป:

- core contract types ใน `src/<capability>/types.ts`
- core runner/runtime helper ใน `src/<capability>/runtime.ts`
- พื้นผิว plugin API registration ใน `src/plugins/types.ts`
- การต่อสาย plugin registry ใน `src/plugins/registry.ts`
- การเปิดเผย plugin runtime ใน `src/plugins/runtime/*` เมื่อ feature/channel plugins ต้องใช้
- capture/test helpers ใน `src/test-utils/plugin-registration.ts`
- assertions ด้าน ownership/contract ใน `src/plugins/contracts/registry.ts`
- operator/plugin docs ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งขาดหายไป นั่นมักเป็นสัญญาณว่าความสามารถยังไม่ได้ผสานรวมอย่างครบถ้วน

### Template ความสามารถ

รูปแบบขั้นต่ำ:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

รูปแบบ contract test:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

สิ่งนั้นทำให้กฎเรียบง่าย:

- core เป็นเจ้าของ capability contract + orchestration
- vendor plugins เป็นเจ้าของ vendor implementations
- feature/channel plugins ใช้ runtime helpers
- contract tests ทำให้ ownership ชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — โมเดลและรูปทรงความสามารถสาธารณะ
- [Plugin SDK subpaths](/th/plugins/sdk-subpaths)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง plugins](/th/plugins/building-plugins)
