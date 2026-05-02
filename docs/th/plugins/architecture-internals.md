---
read_when:
    - การนำ hook ของ runtime สำหรับผู้ให้บริการ, วงจรชีวิตของช่องทาง, หรือชุดแพ็กเกจไปใช้งาน
    - การดีบักลำดับการโหลด Plugin หรือสถานะรีจิสทรี
    - การเพิ่มความสามารถใหม่ของ Plugin หรือ Plugin สำหรับเอนจินบริบท
summary: 'ข้อมูลภายในสถาปัตยกรรม Plugin: กระบวนการโหลด, รีจิสทรี, ฮุกขณะทำงาน, เส้นทาง HTTP และตารางอ้างอิง'
title: รายละเอียดภายในของสถาปัตยกรรม Plugin
x-i18n:
    generated_at: "2026-05-02T20:46:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

สำหรับโมเดลความสามารถสาธารณะ รูปแบบ Plugin และสัญญาการเป็นเจ้าของ/การดำเนินการ โปรดดู [สถาปัตยกรรม Plugin](/th/plugins/architecture) หน้านี้เป็นเอกสารอ้างอิงสำหรับกลไกภายใน: ไปป์ไลน์การโหลด, รีจิสทรี, ฮุกขณะรัน, เส้นทาง HTTP ของ Gateway, พาธนำเข้า และตารางสคีมา

## ไปป์ไลน์การโหลด

เมื่อเริ่มทำงาน OpenClaw จะทำโดยคร่าว ๆ ดังนี้:

1. ค้นหารากของ Plugin ที่เป็นตัวเลือก
2. อ่านไฟล์กำกับบันเดิลแบบเนทีฟหรือแบบเข้ากันได้ และเมทาดาทาของแพ็กเกจ
3. ปฏิเสธตัวเลือกที่ไม่ปลอดภัย
4. ปรับการกำหนดค่า Plugin ให้เป็นมาตรฐาน (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินการเปิดใช้งานสำหรับแต่ละตัวเลือก
6. โหลดโมดูลเนทีฟที่เปิดใช้งาน: โมดูลบันเดิลที่สร้างแล้วใช้ตัวโหลดเนทีฟ;
   ซอร์ส TypeScript ภายในเครื่องของบุคคลที่สามใช้กลไกสำรองฉุกเฉิน Jiti
7. เรียกฮุกเนทีฟ `register(api)` และรวบรวมการลงทะเบียนเข้าไปยังรีจิสทรีของ Plugin
8. เปิดเผยรีจิสทรีให้คำสั่ง/พื้นผิวขณะรันใช้งาน

<Note>
`activate` เป็นนามแฝงเดิมของ `register` — ตัวโหลดจะเลือกตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกที่จุดเดียวกัน Plugin ที่รวมมาในบันเดิลทั้งหมดใช้ `register`; สำหรับ Plugin ใหม่ให้ใช้ `register`
</Note>

ด่านความปลอดภัยเกิดขึ้น **ก่อน** การดำเนินการขณะรัน ตัวเลือกจะถูกบล็อกเมื่อรายการออกนอกขอบเขตรากของ Plugin, พาธเขียนได้โดยทุกคน หรือความเป็นเจ้าของพาธดูน่าสงสัยสำหรับ Plugin ที่ไม่ได้รวมมากับบันเดิล

### พฤติกรรมที่ยึดไฟล์กำกับเป็นหลัก

ไฟล์กำกับคือแหล่งความจริงของระนาบควบคุม OpenClaw ใช้ไฟล์นี้เพื่อ:

- ระบุ Plugin
- ค้นหาช่องทาง/Skills/สคีมาการกำหนดค่า หรือความสามารถของบันเดิลที่ประกาศไว้
- ตรวจสอบ `plugins.entries.<id>.config`
- เติมป้ายกำกับ/ข้อความกำกับใน Control UI
- แสดงเมทาดาทาการติดตั้ง/แค็ตตาล็อก
- เก็บตัวบรรยายการเปิดใช้งานและการตั้งค่าที่ต้นทุนต่ำโดยไม่ต้องโหลดขณะรันของ Plugin

สำหรับ Plugin เนทีฟ โมดูลขณะรันคือส่วนของระนาบข้อมูล โมดูลนี้ลงทะเบียนพฤติกรรมจริง เช่น ฮุก เครื่องมือ คำสั่ง หรือโฟลว์ผู้ให้บริการ

บล็อก `activation` และ `setup` ที่ไม่บังคับในไฟล์กำกับจะยังอยู่บนระนาบควบคุม บล็อกเหล่านี้เป็นตัวบรรยายแบบเมทาดาทาเท่านั้นสำหรับการวางแผนการเปิดใช้งานและการค้นหาการตั้งค่า; บล็อกเหล่านี้ไม่ได้แทนที่การลงทะเบียนขณะรัน, `register(...)` หรือ `setupEntry` ผู้บริโภคการเปิดใช้งานจริงกลุ่มแรกตอนนี้ใช้คำใบ้คำสั่ง ช่องทาง และผู้ให้บริการจากไฟล์กำกับเพื่อจำกัดการโหลด Plugin ก่อนการสร้างรีจิสทรีที่กว้างกว่า:

- การโหลด CLI จำกัดเฉพาะ Plugin ที่เป็นเจ้าของคำสั่งหลักที่ร้องขอ
- การตั้งค่า/การแก้ไข Plugin ของช่องทางจำกัดเฉพาะ Plugin ที่เป็นเจ้าของรหัสช่องทางที่ร้องขอ
- การแก้ไขการตั้งค่า/ขณะรันของผู้ให้บริการแบบชัดเจนจำกัดเฉพาะ Plugin ที่เป็นเจ้าของรหัสผู้ให้บริการที่ร้องขอ
- การวางแผนเริ่มต้น Gateway ใช้ `activation.onStartup` สำหรับการนำเข้าเมื่อเริ่มต้นและการยกเว้นเมื่อเริ่มต้นแบบชัดเจน; Plugin ที่ไม่มีเมทาดาทาเมื่อเริ่มต้นจะโหลดผ่านตัวกระตุ้นการเปิดใช้งานที่แคบกว่าเท่านั้น

การพรีโหลดขณะรันในเวลารับคำขอที่ขอสโคปกว้าง `all` ยังคงอนุมานชุดรหัส Plugin ที่มีผลอย่างชัดเจนจากการกำหนดค่า, การวางแผนเริ่มต้น, ช่องทางที่กำหนดค่าไว้, สล็อต และกฎเปิดใช้งานอัตโนมัติ หากชุดที่อนุมานได้นั้นว่าง OpenClaw จะโหลดรีจิสทรีขณะรันว่างแทนการขยายไปยัง Plugin ทุกตัวที่ค้นพบได้

ตัววางแผนการเปิดใช้งานเปิดเผยทั้ง API แบบมีเฉพาะรหัสสำหรับผู้เรียกเดิม และ API แผนสำหรับการวินิจฉัยใหม่ รายการแผนจะรายงานว่าทำไม Plugin จึงถูกเลือก โดยแยกคำใบ้ตัววางแผน `activation.*` แบบชัดเจนออกจากทางสำรองความเป็นเจ้าของในไฟล์กำกับ เช่น `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` และฮุก การแยกเหตุผลนี้คือขอบเขตความเข้ากันได้: เมทาดาทา Plugin เดิมยังทำงานต่อไป ขณะที่โค้ดใหม่สามารถตรวจพบคำใบ้แบบกว้างหรือพฤติกรรมสำรองโดยไม่เปลี่ยนความหมายของการโหลดขณะรัน

ตอนนี้การค้นหาการตั้งค่าจะเลือกใช้รหัสที่ตัวบรรยายเป็นเจ้าของ เช่น `setup.providers` และ `setup.cliBackends` ก่อน เพื่อจำกัด Plugin ตัวเลือก ก่อนจะถอยกลับไปใช้ `setup-api` สำหรับ Plugin ที่ยังต้องใช้ฮุกขณะรันในเวลาตั้งค่า รายการตั้งค่าผู้ให้บริการใช้ `providerAuthChoices` จากไฟล์กำกับ, ตัวเลือกการตั้งค่าที่อนุมานจากตัวบรรยาย และเมทาดาทาแค็ตตาล็อกการติดตั้ง โดยไม่โหลดขณะรันของผู้ให้บริการ `setup.requiresRuntime: false` แบบชัดเจนเป็นจุดตัดแบบตัวบรรยายเท่านั้น; การละ `requiresRuntime` ไว้จะคงทางสำรอง `setup-api` แบบเดิมเพื่อความเข้ากันได้ หาก Plugin ที่ค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์รหัสผู้ให้บริการการตั้งค่าหรือรหัสแบ็กเอนด์ CLI ที่ปรับเป็นมาตรฐานเดียวกัน การค้นหาการตั้งค่าจะปฏิเสธเจ้าของที่กำกวมแทนการพึ่งลำดับการค้นพบ เมื่อขณะรันของการตั้งค่าทำงานจริง การวินิจฉัยรีจิสทรีจะรายงานความคลาดเคลื่อนระหว่าง `setup.providers` / `setup.cliBackends` กับผู้ให้บริการหรือแบ็กเอนด์ CLI ที่ลงทะเบียนโดย `setup-api` โดยไม่บล็อก Plugin เดิม

### ขอบเขตแคชของ Plugin

OpenClaw ไม่แคชผลการค้นพบ Plugin หรือข้อมูลรีจิสทรีไฟล์กำกับโดยตรงไว้หลังหน้าต่างเวลาตามนาฬิกา การติดตั้ง การแก้ไขไฟล์กำกับ และการเปลี่ยนแปลงพาธโหลดต้องมองเห็นได้ในการอ่านเมทาดาทาแบบชัดเจนครั้งถัดไปหรือการสร้างสแนปช็อตใหม่ครั้งถัดไป ตัวแยกวิเคราะห์ไฟล์กำกับอาจเก็บแคชลายเซ็นไฟล์แบบมีขอบเขตโดยใช้พาธไฟล์กำกับที่เปิด, inode, ขนาด และเวลาเป็นคีย์; แคชนั้นหลีกเลี่ยงการแยกวิเคราะห์ไบต์ที่ไม่เปลี่ยนแปลงซ้ำเท่านั้น และต้องไม่แคชคำตอบเกี่ยวกับการค้นพบ รีจิสทรี เจ้าของ หรือนโยบาย

เส้นทางด่วนของเมทาดาทาที่ปลอดภัยคือความเป็นเจ้าของออบเจ็กต์แบบชัดเจน ไม่ใช่แคชที่ซ่อนอยู่ เส้นทางร้อนของการเริ่มต้น Gateway ควรส่ง `PluginMetadataSnapshot` ปัจจุบัน, `PluginLookUpTable` ที่อนุมานได้ หรือรีจิสทรีไฟล์กำกับแบบชัดเจนผ่านสายการเรียก การตรวจสอบการกำหนดค่า, การเปิดใช้งานอัตโนมัติเมื่อเริ่มต้น, การบูตสแตรป Plugin และการเลือกผู้ให้บริการสามารถใช้ออบเจ็กต์เหล่านั้นซ้ำได้ขณะออบเจ็กต์เหล่านั้นแทนการกำหนดค่าและรายการ Plugin ปัจจุบัน การค้นหาการตั้งค่ายังสร้างเมทาดาทาไฟล์กำกับใหม่ตามต้องการ เว้นแต่เส้นทางการตั้งค่าเฉพาะจะได้รับรีจิสทรีไฟล์กำกับแบบชัดเจน; ให้คงสิ่งนั้นเป็นทางสำรองของเส้นทางเย็นแทนการเพิ่มแคชค้นหาที่ซ่อนอยู่ เมื่ออินพุตเปลี่ยน ให้สร้างสแนปช็อตใหม่และแทนที่ แทนการกลายพันธุ์หรือเก็บสำเนาประวัติไว้
มุมมองเหนือรีจิสทรี Plugin ที่ใช้งานอยู่และตัวช่วยบูตสแตรปช่องทางที่รวมมาในบันเดิลควรถูกคำนวณใหม่จากรีจิสทรี/รากปัจจุบัน แผนที่อายุสั้นใช้ได้ภายในการเรียกหนึ่งครั้งเพื่อขจัดงานซ้ำหรือกันการเข้าใหม่; แผนที่เหล่านั้นต้องไม่กลายเป็นแคชเมทาดาทาระดับโปรเซส

สำหรับการโหลด Plugin ชั้นแคชถาวรคือการโหลดขณะรัน มันอาจใช้สถานะตัวโหลดซ้ำเมื่อโค้ดหรืออาร์ติแฟกต์ที่ติดตั้งถูกโหลดจริง เช่น:

- `PluginLoaderCacheState` และรีจิสทรีขณะรันที่ใช้งานอยู่และเข้ากันได้
- แคช jiti/โมดูล และแคชตัวโหลดพื้นผิวสาธารณะที่ใช้หลีกเลี่ยงการนำเข้าพื้นผิวขณะรันเดิมซ้ำ
- แคชระบบไฟล์สำหรับอาร์ติแฟกต์ Plugin ที่ติดตั้ง
- แผนที่อายุสั้นรายครั้งสำหรับการปรับพาธให้เป็นมาตรฐานหรือการแก้ไขรายการซ้ำ

แคชเหล่านั้นเป็นรายละเอียดการใช้งานของระนาบข้อมูล แคชเหล่านั้นต้องไม่ตอบคำถามระนาบควบคุม เช่น "Plugin ใดเป็นเจ้าของผู้ให้บริการนี้?" เว้นแต่ผู้เรียกตั้งใจขอการโหลดขณะรัน

อย่าเพิ่มแคชถาวรหรือแคชตามนาฬิกาสำหรับ:

- ผลการค้นพบ
- รีจิสทรีไฟล์กำกับโดยตรง
- รีจิสทรีไฟล์กำกับที่สร้างใหม่จากดัชนี Plugin ที่ติดตั้ง
- การค้นหาเจ้าของผู้ให้บริการ, การระงับโมเดล, นโยบายผู้ให้บริการ หรือเมทาดาทาอาร์ติแฟกต์สาธารณะ
- คำตอบอื่นใดที่อนุมานจากไฟล์กำกับ ซึ่งไฟล์กำกับ ดัชนีที่ติดตั้ง หรือพาธโหลดที่เปลี่ยนไปควรมองเห็นได้ในการอ่านเมทาดาทาครั้งถัดไป

ผู้เรียกที่สร้างเมทาดาทาไฟล์กำกับใหม่จากดัชนี Plugin ที่ติดตั้งซึ่งคงอยู่ จะสร้างรีจิสทรีนั้นใหม่ตามต้องการ ดัชนีที่ติดตั้งคือสถานะระนาบแหล่งที่คงทน; มันไม่ใช่แคชเมทาดาทาในโปรเซสที่ซ่อนอยู่

## โมเดลรีจิสทรี

Plugin ที่โหลดแล้วไม่ได้กลายพันธุ์โกลบอลแกนหลักแบบสุ่มโดยตรง แต่ลงทะเบียนเข้าไปยังรีจิสทรี Plugin ส่วนกลาง

รีจิสทรีติดตาม:

- ระเบียน Plugin (อัตลักษณ์, แหล่งที่มา, ต้นทาง, สถานะ, การวินิจฉัย)
- เครื่องมือ
- ฮุกเดิมและฮุกแบบมีชนิด
- ช่องทาง
- ผู้ให้บริการ
- ตัวจัดการ RPC ของ Gateway
- เส้นทาง HTTP
- ตัวลงทะเบียน CLI
- บริการเบื้องหลัง
- คำสั่งที่ Plugin เป็นเจ้าของ

จากนั้นฟีเจอร์แกนหลักจะอ่านจากรีจิสทรีนั้นแทนการคุยกับโมดูล Plugin โดยตรง สิ่งนี้ทำให้การโหลดเป็นทางเดียว:

- โมดูล Plugin -> การลงทะเบียนรีจิสทรี
- ขณะรันของแกนหลัก -> การใช้งานรีจิสทรี

การแยกนี้สำคัญต่อความสามารถในการบำรุงรักษา หมายความว่าพื้นผิวแกนหลักส่วนใหญ่ต้องการจุดผสานรวมเดียวเท่านั้น: "อ่านรีจิสทรี" ไม่ใช่ "จัดการโมดูล Plugin ทุกตัวเป็นกรณีพิเศษ"

## คอลแบ็กการผูกบทสนทนา

Plugin ที่ผูกบทสนทนาสามารถตอบสนองเมื่อมีการตัดสินการอนุมัติแล้ว

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับคอลแบ็กหลังคำขอผูกได้รับการอนุมัติหรือปฏิเสธ:

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

ฟิลด์เพย์โหลดคอลแบ็ก:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: การผูกที่แก้ไขแล้วสำหรับคำขอที่ได้รับอนุมัติ
- `request`: สรุปคำขอเดิม, คำใบ้การแยกออก, รหัสผู้ส่ง และเมทาดาทาบทสนทนา

คอลแบ็กนี้เป็นการแจ้งเตือนเท่านั้น ไม่เปลี่ยนว่าใครได้รับอนุญาตให้ผูกบทสนทนา และจะทำงานหลังจากการจัดการการอนุมัติของแกนหลักเสร็จสิ้น

## ฮุกขณะรันของผู้ให้บริการ

Plugin ผู้ให้บริการมีสามชั้น:

- **เมทาดาทาไฟล์กำกับ** สำหรับการค้นหาก่อนขณะรันที่ต้นทุนต่ำ:
  `setup.providers[].envVars`, ความเข้ากันได้เดิมที่เลิกใช้แล้ว `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **ฮุกเวลาการกำหนดค่า**: `catalog` (`discovery` เดิม) และ
  `applyConfigDefaults`
- **ฮุกขณะรัน**: ฮุกที่ไม่บังคับมากกว่า 40 รายการ ครอบคลุมการยืนยันตัวตน, การแก้ไขโมเดล,
  การห่อสตรีม, ระดับการคิด, นโยบายเล่นซ้ำ และจุดปลายการใช้งาน ดูรายการทั้งหมดใน [ลำดับฮุกและการใช้งาน](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของลูปเอเจนต์ทั่วไป, เฟลโอเวอร์, การจัดการทรานสคริปต์ และนโยบายเครื่องมือ ฮุกเหล่านี้คือพื้นผิวส่วนขยายสำหรับพฤติกรรมเฉพาะผู้ให้บริการโดยไม่ต้องมีทรานสปอร์ตการอนุมานแบบกำหนดเองทั้งชุด

ใช้ `setup.providers[].envVars` ในไฟล์กำกับเมื่อผู้ให้บริการมีข้อมูลรับรองตาม env ที่เส้นทางการยืนยันตัวตน/สถานะ/ตัวเลือกโมเดลทั่วไปควรเห็นโดยไม่ต้องโหลดขณะรันของ Plugin `providerAuthEnvVars` ที่เลิกใช้แล้วจะยังถูกอ่านโดยอะแดปเตอร์ความเข้ากันได้ในช่วงเลิกใช้งาน และ Plugin ที่ไม่ได้รวมมากับบันเดิลซึ่งใช้สิ่งนี้จะได้รับการวินิจฉัยไฟล์กำกับ ใช้ `providerAuthAliases` ในไฟล์กำกับเมื่อรหัสผู้ให้บริการหนึ่งควรใช้ env vars, โปรไฟล์การยืนยันตัวตน, การยืนยันตัวตนที่หนุนด้วยการกำหนดค่า และตัวเลือกเริ่มต้นใช้งาน API-key ของรหัสผู้ให้บริการอื่นซ้ำ ใช้ `providerAuthChoices` ในไฟล์กำกับเมื่อพื้นผิว CLI สำหรับการเริ่มต้นใช้งาน/ตัวเลือกการยืนยันตัวตนควรรู้รหัสตัวเลือกของผู้ให้บริการ, ป้ายกำกับกลุ่ม และการผูกการยืนยันตัวตนแบบธงเดียวอย่างง่ายโดยไม่ต้องโหลดขณะรันของผู้ให้บริการ เก็บ `envVars` ขณะรันของผู้ให้บริการไว้สำหรับคำใบ้ที่หันเข้าหาผู้ปฏิบัติการ เช่น ป้ายกำกับการเริ่มต้นใช้งาน หรือตัวแปรตั้งค่า OAuth client-id/client-secret

ใช้ `channelEnvVars` ในไฟล์กำกับเมื่อช่องทางมีการยืนยันตัวตนหรือการตั้งค่าที่ขับเคลื่อนด้วย env ซึ่งทางสำรอง shell-env ทั่วไป, การตรวจสอบการกำหนดค่า/สถานะ หรือพรอมป์การตั้งค่าควรเห็นโดยไม่ต้องโหลดขณะรันของช่องทาง

### ลำดับฮุกและการใช้งาน

สำหรับ Plugin โมเดล/ผู้ให้บริการ OpenClaw จะเรียกฮุกตามลำดับคร่าว ๆ นี้
คอลัมน์ "ควรใช้เมื่อใด" คือคู่มือช่วยตัดสินใจแบบเร็ว
ฟิลด์ผู้ให้บริการที่มีไว้เพื่อความเข้ากันได้เท่านั้น ซึ่ง OpenClaw ไม่เรียกใช้อีกต่อไป เช่น `ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะตั้งใจไม่แสดงไว้ที่นี่

| #   | ฮุก                              | หน้าที่                                                                                                   | ควรใช้เมื่อ                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่การกำหนดค่าผู้ให้บริการเข้าไปใน `models.providers` ระหว่างการสร้าง `models.json`                                | ผู้ให้บริการเป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ URL ฐาน                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นการกำหนดค่าส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการ materialize การกำหนดค่า                                      | ค่าเริ่มต้นขึ้นอยู่กับโหมด auth, env หรือซีแมนติกส์ตระกูลโมเดลของผู้ให้บริการ                                                                         |
| --  | _(การค้นหาโมเดลในตัว)_         | OpenClaw ลองใช้พาธ registry/catalog ปกติก่อน                                                          | _(ไม่ใช่ฮุกของ Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | ทำให้อะเลียส model-id แบบ legacy หรือ preview เป็นรูปแบบมาตรฐานก่อนค้นหา                                                     | ผู้ให้บริการเป็นเจ้าของการล้างอะเลียสก่อนการ resolve โมเดล canonical                                                                                 |
| 4   | `normalizeTransport`              | ทำให้ `api` / `baseUrl` ของตระกูลผู้ให้บริการเป็นรูปแบบมาตรฐานก่อนประกอบโมเดลแบบทั่วไป                                      | ผู้ให้บริการเป็นเจ้าของการล้าง transport สำหรับ id ผู้ให้บริการแบบกำหนดเองในตระกูล transport เดียวกัน                                                          |
| 5   | `normalizeConfig`                 | ทำให้ `models.providers.<id>` เป็นรูปแบบมาตรฐานก่อนการ resolve runtime/provider                                           | ผู้ให้บริการต้องการการล้างการกำหนดค่าที่ควรอยู่กับ Plugin; ตัวช่วยตระกูล Google ที่บันเดิลมาด้วยยังเป็นตัวสำรองให้รายการกำหนดค่า Google ที่รองรับ   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียน compat ของการใช้งานสตรีมมิงแบบ native ใหม่กับผู้ให้บริการการกำหนดค่า                                               | ผู้ให้บริการต้องการการแก้ไขเมตาดาต้าการใช้งานสตรีมมิงแบบ native ที่ขับเคลื่อนด้วย endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Resolve auth แบบ env-marker สำหรับผู้ให้บริการการกำหนดค่าก่อนโหลด runtime auth                                       | ผู้ให้บริการมีการ resolve API-key แบบ env-marker ที่ผู้ให้บริการเป็นเจ้าของ; `amazon-bedrock` ยังมีตัว resolve AWS env-marker ในตัวที่นี่                  |
| 8   | `resolveSyntheticAuth`            | แสดง auth แบบ local/self-hosted หรือที่หนุนด้วยการกำหนดค่าโดยไม่คง plaintext                                   | ผู้ให้บริการสามารถทำงานกับมาร์กเกอร์ข้อมูลประจำตัวแบบ synthetic/local                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | ซ้อนทับโปรไฟล์ auth ภายนอกที่ผู้ให้บริการเป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับข้อมูลประจำตัวที่ CLI/app เป็นเจ้าของ | ผู้ให้บริการนำข้อมูลประจำตัว auth ภายนอกกลับมาใช้โดยไม่คง refresh token ที่คัดลอกไว้; ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของ placeholder โปรไฟล์ synthetic ที่จัดเก็บไว้หลัง auth ที่หนุนด้วย env/config                                      | ผู้ให้บริการจัดเก็บโปรไฟล์ placeholder แบบ synthetic ที่ไม่ควรชนะลำดับความสำคัญ                                                                 |
| 11  | `resolveDynamicModel`             | fallback แบบซิงก์สำหรับ id โมเดลที่ผู้ให้บริการเป็นเจ้าของซึ่งยังไม่อยู่ใน registry ภายใน                                       | ผู้ให้บริการยอมรับ id โมเดล upstream ใดก็ได้                                                                                                 |
| 12  | `prepareDynamicModel`             | วอร์มอัปแบบ async แล้ว `resolveDynamicModel` จะทำงานอีกครั้ง                                                           | ผู้ให้บริการต้องการเมตาดาต้าจากเครือข่ายก่อน resolve id ที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | เขียนใหม่ขั้นสุดท้ายก่อนที่ runner แบบฝังตัวจะใช้โมเดลที่ resolve แล้ว                                               | ผู้ให้บริการต้องการการเขียน transport ใหม่แต่ยังใช้ transport หลัก                                                                             |
| 14  | `contributeResolvedModelCompat`   | สนับสนุนแฟล็ก compat สำหรับโมเดล vendor ที่อยู่หลัง transport อื่นที่เข้ากันได้                                  | ผู้ให้บริการจำโมเดลของตนเองบน proxy transport ได้โดยไม่เข้าควบคุมผู้ให้บริการ                                                       |
| 15  | `normalizeToolSchemas`            | ทำให้สคีมาของเครื่องมือเป็นรูปแบบมาตรฐานก่อนที่ runner แบบฝังตัวจะเห็น                                                    | ผู้ให้บริการต้องการการล้างสคีมาตามตระกูล transport                                                                                                |
| 16  | `inspectToolSchemas`              | แสดง diagnostics ของสคีมาที่ผู้ให้บริการเป็นเจ้าของหลังการ normalize                                                  | ผู้ให้บริการต้องการคำเตือนคีย์เวิร์ดโดยไม่สอนกฎเฉพาะผู้ให้บริการให้ core                                                                 |
| 17  | `resolveReasoningOutputMode`      | เลือกสัญญาเอาต์พุต reasoning แบบ native หรือ tagged                                                              | ผู้ให้บริการต้องการ reasoning/final output แบบ tagged แทนฟิลด์ native                                                                         |
| 18  | `prepareExtraParams`              | ทำให้ request-param เป็นรูปแบบมาตรฐานก่อน wrapper ตัวเลือกสตรีมแบบทั่วไป                                              | ผู้ให้บริการต้องการพารามิเตอร์ request เริ่มต้นหรือการล้างพารามิเตอร์รายผู้ให้บริการ                                                                           |
| 19  | `createStreamFn`                  | แทนที่พาธสตรีมปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                   | ผู้ให้บริการต้องการโปรโตคอล wire แบบกำหนดเอง ไม่ใช่แค่ wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper สตรีมหลังใช้ wrapper ทั่วไปแล้ว                                                              | ผู้ให้บริการต้องการ wrapper compat ของ request headers/body/model โดยไม่มี transport แบบกำหนดเอง                                                          |
| 21  | `resolveTransportTurnState`       | แนบ header หรือเมตาดาต้า transport ต่อ turn แบบ native                                                           | ผู้ให้บริการต้องการให้ transport ทั่วไปส่งตัวตน turn แบบ native ของผู้ให้บริการ                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | แนบ header WebSocket แบบ native หรือนโยบาย cool-down ของเซสชัน                                                    | ผู้ให้บริการต้องการให้ transport WS ทั่วไปปรับ header ของเซสชันหรือนโยบาย fallback                                                               |
| 23  | `formatApiKey`                    | ตัวจัดรูปแบบ auth-profile: โปรไฟล์ที่จัดเก็บไว้กลายเป็นสตริง `apiKey` ของ runtime                                     | ผู้ให้บริการจัดเก็บเมตาดาต้า auth เพิ่มเติมและต้องการรูปทรง token ของ runtime แบบกำหนดเอง                                                                    |
| 24  | `refreshOAuth`                    | การ override refresh ของ OAuth สำหรับ endpoint refresh แบบกำหนดเองหรือนโยบาย refresh-failure                                  | ผู้ให้บริการไม่เข้ากับ refresher `pi-ai` ที่ใช้ร่วมกัน                                                                                           |
| 25  | `buildAuthDoctorHint`             | คำใบ้การซ่อมแซมที่ต่อท้ายเมื่อ OAuth refresh ล้มเหลว                                                                  | ผู้ให้บริการต้องการคำแนะนำการซ่อม auth ที่ผู้ให้บริการเป็นเจ้าของหลัง refresh ล้มเหลว                                                                      |
| 26  | `matchesContextOverflowError`     | matcher สำหรับ context-window overflow ที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการมีข้อผิดพลาด overflow ดิบที่ฮิวริสติกทั่วไปจะพลาด                                                                                |
| 27  | `classifyFailoverReason`          | การจัดประเภทเหตุผล failover ที่ผู้ให้บริการเป็นเจ้าของ                                                                  | ผู้ให้บริการสามารถ map ข้อผิดพลาด API/transport ดิบเป็น rate-limit/overload/etc                                                                          |
| 28  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับผู้ให้บริการ proxy/backhaul                                                               | ผู้ให้บริการต้องการการควบคุม cache TTL เฉพาะ proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | การแทนที่ข้อความกู้คืน missing-auth แบบทั่วไป                                                      | ผู้ให้บริการต้องการคำใบ้การกู้คืน missing-auth เฉพาะผู้ให้บริการ                                                                                 |
| 30  | `augmentModelCatalog`             | แถวแค็ตตาล็อก synthetic/final ที่ต่อท้ายหลังการค้นพบ                                                          | ผู้ให้บริการต้องการแถว forward-compat แบบ synthetic ใน `models list` และตัวเลือก                                                                     |
| 31  | `resolveThinkingProfile`          | ชุดระดับ `/think` เฉพาะโมเดล ป้ายแสดงผล และค่าเริ่มต้น                                                 | ผู้ให้บริการเปิดเผยลำดับชั้น thinking แบบกำหนดเองหรือป้ายแบบ binary สำหรับโมเดลที่เลือก                                                                 |
| 32  | `isBinaryThinking`                | ฮุก compatibility สำหรับสวิตช์ reasoning เปิด/ปิด                                                                     | ผู้ให้บริการเปิดเผยเฉพาะ thinking แบบ binary เปิด/ปิด                                                                                                  |
| 33  | `supportsXHighThinking`           | ฮุก compatibility สำหรับการรองรับ reasoning `xhigh`                                                                   | ผู้ให้บริการต้องการ `xhigh` เฉพาะในโมเดลบางส่วน                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | ฮุก compatibility สำหรับระดับ `/think` เริ่มต้น                                                                      | ผู้ให้บริการเป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับตระกูลโมเดล                                                                                      |
| 35  | `isModernModelRef`                | matcher โมเดลสมัยใหม่สำหรับตัวกรองโปรไฟล์ live และการเลือก smoke                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่โมเดลที่แนะนำสำหรับ live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | แลกเปลี่ยนข้อมูลประจำตัวที่กำหนดค่าไว้เป็น token/key ของ runtime จริงก่อน inference                       | ผู้ให้บริการต้องการการแลกเปลี่ยน token หรือข้อมูลประจำตัว request อายุสั้น                                                                             |
| 37  | `resolveUsageAuth`                | แก้ไขข้อมูลประจำตัวสำหรับการใช้งาน/การเรียกเก็บเงินของ `/usage` และส่วนแสดงสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องการการแยกวิเคราะห์โทเคนการใช้งาน/โควตาแบบกำหนดเอง หรือข้อมูลประจำตัวการใช้งานแบบอื่น                                                               |
| 38  | `fetchUsageSnapshot`              | ดึงและทำให้สแนปชอตการใช้งาน/โควตาเฉพาะผู้ให้บริการเป็นมาตรฐานหลังจากแก้ไขการยืนยันตัวตนแล้ว                             | ผู้ให้บริการต้องการจุดปลายทางการใช้งานเฉพาะผู้ให้บริการ หรือตัวแยกวิเคราะห์เพย์โหลด                                                                           |
| 39  | `createEmbeddingProvider`         | สร้างอะแดปเตอร์การฝังที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา                                                     | พฤติกรรมการฝังหน่วยความจำเป็นความรับผิดชอบของ Plugin ผู้ให้บริการ                                                                                    |
| 40  | `buildReplayPolicy`               | ส่งคืนนโยบายการเล่นซ้ำที่ควบคุมการจัดการทรานสคริปต์สำหรับผู้ให้บริการ                                        | ผู้ให้บริการต้องการนโยบายทรานสคริปต์แบบกำหนดเอง (เช่น การตัดบล็อกการคิดออก)                                                               |
| 41  | `sanitizeReplayHistory`           | เขียนประวัติการเล่นซ้ำใหม่หลังจากล้างทรานสคริปต์ทั่วไป                                                        | ผู้ให้บริการต้องการการเขียนการเล่นซ้ำใหม่เฉพาะผู้ให้บริการ นอกเหนือจากตัวช่วย Compaction ที่ใช้ร่วมกัน                                                             |
| 42  | `validateReplayTurns`             | ตรวจสอบความถูกต้องหรือปรับรูปแบบเทิร์นการเล่นซ้ำขั้นสุดท้ายก่อนรันเนอร์แบบฝังตัว                                           | การขนส่งของผู้ให้บริการต้องการการตรวจสอบเทิร์นที่เข้มงวดยิ่งขึ้นหลังจากการทำความสะอาดทั่วไป                                                                    |
| 43  | `onModelSelected`                 | เรียกใช้ผลข้างเคียงหลังการเลือกที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการต้องการโทรมาตรหรือสถานะที่ผู้ให้บริการเป็นเจ้าของเมื่อโมเดลเริ่มใช้งาน                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
Plugin ผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงไล่ไปยัง Plugin ผู้ให้บริการอื่นที่รองรับ hook
จนกว่าจะมีรายการหนึ่งเปลี่ยน model id หรือ transport/config จริง วิธีนี้ช่วยให้
shim ผู้ให้บริการแบบ alias/compat ทำงานได้โดยไม่บังคับให้ผู้เรียกต้องรู้ว่า
Plugin ที่รวมมาใดเป็นเจ้าของการเขียนค่าใหม่ หากไม่มี hook ของผู้ให้บริการใดเขียนค่าใหม่ให้
รายการ config ในตระกูล Google ที่รองรับ ตัว normalizer ของ Google ที่รวมมากับระบบ
จะยังใช้การล้างค่าความเข้ากันได้นั้นอยู่

หากผู้ให้บริการต้องใช้ wire protocol แบบกำหนดเองทั้งหมด หรือตัวดำเนินการคำขอแบบกำหนดเอง
นั่นเป็น extension คนละประเภท hook เหล่านี้มีไว้สำหรับพฤติกรรมของผู้ให้บริการ
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

### ตัวอย่างที่มีในตัว

Plugin ผู้ให้บริการที่รวมมาจะผสาน hook ข้างต้นเพื่อให้เข้ากับ catalog,
auth, thinking, replay และความต้องการด้าน usage ของผู้จำหน่ายแต่ละราย ชุด hook ที่เป็นแหล่งอ้างอิงหลักอยู่กับ
แต่ละ Plugin ใต้ `extensions/`; หน้านี้แสดงรูปแบบแทนการ
สะท้อนรายการทั้งหมด

<AccordionGroup>
  <Accordion title="ผู้ให้บริการ catalog แบบส่งผ่าน">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` พร้อม
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้สามารถแสดง
    model id จากต้นทางก่อน catalog แบบคงที่ของ OpenClaw ได้
  </Accordion>
  <Accordion title="ผู้ให้บริการ OAuth และปลายทาง usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของการแลกเปลี่ยนโทเคนและการผสาน `/usage`
  </Accordion>
  <Accordion title="ตระกูลการทำความสะอาด replay และ transcript">
    ตระกูลที่มีชื่อร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ช่วยให้ผู้ให้บริการเลือกใช้
    นโยบาย transcript ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin
    จะต้องสร้างการล้างค่าซ้ำเอง
  </Accordion>
  <Accordion title="ผู้ให้บริการเฉพาะ catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนเพียง `catalog` และใช้ inference loop ร่วมกัน
  </Accordion>
  <Accordion title="ตัวช่วย stream เฉพาะ Anthropic">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน
    seam `api.ts` / `contract-api.ts` สาธารณะของ Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
    SDK ทั่วไป
  </Accordion>
</AccordionGroup>

## ตัวช่วย runtime

Plugin สามารถเข้าถึงตัวช่วยหลักที่เลือกไว้ผ่าน `api.runtime` สำหรับ TTS:

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

- `textToSpeech` ส่งคืน payload เอาต์พุต TTS หลักตามปกติสำหรับพื้นผิวไฟล์/โน้ตเสียง
- ใช้ config `messages.tts` หลักและการเลือกผู้ให้บริการ
- ส่งคืนบัฟเฟอร์เสียง PCM + sample rate Plugin ต้อง resample/encode สำหรับผู้ให้บริการ
- `listVoices` เป็นรายการเสริมตามแต่ละผู้ให้บริการ ใช้สำหรับตัวเลือกเสียงหรือขั้นตอนการตั้งค่าที่ผู้จำหน่ายเป็นเจ้าของ
- รายการเสียงสามารถรวม metadata ที่ละเอียดขึ้น เช่น locale, gender และแท็ก personality สำหรับตัวเลือกที่รับรู้ผู้ให้บริการ
- ปัจจุบัน OpenAI และ ElevenLabs รองรับ telephony Microsoft ไม่รองรับ

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

- เก็บนโยบาย TTS, fallback และการส่งมอบการตอบกลับไว้ใน core
- ใช้ผู้ให้บริการ speech สำหรับพฤติกรรม synthesis ที่ผู้จำหน่ายเป็นเจ้าของ
- อินพุต Microsoft `edge` แบบเดิมถูก normalize เป็น provider id `microsoft`
- โมเดลความเป็นเจ้าของที่แนะนำคือเน้นตามบริษัท: Plugin ผู้จำหน่ายหนึ่งรายการสามารถเป็นเจ้าของ
  ผู้ให้บริการข้อความ, speech, image และสื่อในอนาคตได้เมื่อ OpenClaw เพิ่ม
  capability contract เหล่านั้น

สำหรับการทำความเข้าใจ image/audio/video Plugin จะลงทะเบียนผู้ให้บริการ
media-understanding แบบมี type หนึ่งรายการแทน generic key/value bag:

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

- เก็บ orchestration, fallback, config และการเชื่อมสาย channel ไว้ใน core
- เก็บพฤติกรรมของผู้จำหน่ายไว้ใน Plugin ผู้ให้บริการ
- การขยายแบบเพิ่มได้ควรยังคงมี type: เมธอดเสริมใหม่, result field เสริมใหม่,
  capability เสริมใหม่
- การสร้างวิดีโอใช้รูปแบบเดียวกันอยู่แล้ว:
  - core เป็นเจ้าของ capability contract และตัวช่วย runtime
  - Plugin ผู้จำหน่ายลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - Plugin ฟีเจอร์/channel ใช้ `api.runtime.videoGeneration.*`

สำหรับตัวช่วย runtime ของ media-understanding Plugin สามารถเรียก:

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
```

สำหรับการถอดเสียง audio Plugin สามารถใช้ runtime ของ media-understanding
หรือนามแฝง STT แบบเก่าก็ได้:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` เป็นพื้นผิวร่วมที่แนะนำสำหรับ
  การทำความเข้าใจ image/audio/video
- ใช้ config audio ของ media-understanding หลัก (`tools.media.audio`) และลำดับ fallback ของผู้ให้บริการ
- ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตการถอดเสียงถูกสร้างขึ้น (เช่น อินพุตถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็นนามแฝงเพื่อความเข้ากันได้

Plugin ยังสามารถเปิดงาน subagent เบื้องหลังผ่าน `api.runtime.subagent` ได้ด้วย:

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

- `provider` และ `model` เป็น override แบบต่อการรันที่เป็นทางเลือก ไม่ใช่การเปลี่ยน session แบบถาวร
- OpenClaw จะเคารพ field override เหล่านั้นเฉพาะสำหรับผู้เรียกที่เชื่อถือได้เท่านั้น
- สำหรับการรัน fallback ที่ Plugin เป็นเจ้าของ ผู้ปฏิบัติงานต้องเลือกใช้ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ให้อยู่ใน target `provider/model` แบบ canonical ที่ระบุ หรือ `"*"` เพื่ออนุญาต target ใดก็ได้อย่างชัดเจน
- การรัน subagent ของ Plugin ที่ไม่เชื่อถือยังทำงานได้ แต่คำขอ override จะถูกปฏิเสธแทนการ fallback อย่างเงียบ ๆ
- session subagent ที่ Plugin สร้างจะถูกแท็กด้วย plugin id ที่สร้าง Fallback `api.runtime.subagent.deleteSession(...)` อาจลบเฉพาะ session ที่เป็นเจ้าของเหล่านั้นเท่านั้น; การลบ session ใด ๆ ยังคงต้องใช้คำขอ Gateway ที่มีขอบเขต admin

สำหรับ web search Plugin สามารถใช้ตัวช่วย runtime ร่วมแทนการ
เข้าถึงการเชื่อมสายเครื่องมือ agent โดยตรง:

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

- เก็บการเลือกผู้ให้บริการ, การแก้ไข credential และ semantics ของคำขอร่วมไว้ใน core
- ใช้ผู้ให้บริการ web-search สำหรับ transport การค้นหาเฉพาะผู้จำหน่าย
- `api.runtime.webSearch.*` เป็นพื้นผิวร่วมที่แนะนำสำหรับ Plugin ฟีเจอร์/channel ที่ต้องใช้พฤติกรรมการค้นหาโดยไม่พึ่งพา wrapper เครื่องมือ agent

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
- `listProviders(...)`: แสดงรายการผู้ให้บริการ image-generation ที่พร้อมใช้และ capability ของแต่ละราย

## route HTTP ของ Gateway

Plugin สามารถเปิดเผย endpoint HTTP ด้วย `api.registerHttpRoute(...)`

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

field ของ route:

- `path`: path ของ route ใต้เซิร์ฟเวอร์ HTTP ของ gateway
- `auth`: จำเป็น ใช้ `"gateway"` เพื่อกำหนดให้ต้องใช้ auth ปกติของ gateway หรือ `"plugin"` สำหรับการตรวจสอบ auth/webhook ที่ Plugin จัดการ
- `match`: เป็นทางเลือก `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: เป็นทางเลือก อนุญาตให้ Plugin เดียวกันแทนที่การลงทะเบียน route เดิมของตนเอง
- `handler`: ส่งคืน `true` เมื่อ route จัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกนำออกแล้วและจะทำให้เกิดข้อผิดพลาดขณะโหลด plugin ให้ใช้ `api.registerHttpRoute(...)` แทน.
- เส้นทางของ Plugin ต้องประกาศ `auth` อย่างชัดเจน.
- ความขัดแย้งแบบตรงกันทุกประการของ `path + match` จะถูกปฏิเสธ เว้นแต่มี `replaceExisting: true` และ plugin หนึ่งไม่สามารถแทนที่เส้นทางของ plugin อื่นได้.
- เส้นทางที่ทับซ้อนกันซึ่งมีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้ใช้เชน fallthrough ของ `exact`/`prefix` เฉพาะในระดับ auth เดียวกันเท่านั้น.
- เส้นทาง `auth: "plugin"` จะ **ไม่ได้** รับสโคปรันไทม์ของผู้ปฏิบัติการโดยอัตโนมัติ เส้นทางเหล่านี้มีไว้สำหรับ webhooks/การตรวจสอบลายเซ็นที่ plugin จัดการเอง ไม่ใช่การเรียก helper ของ Gateway ที่มีสิทธิ์สูง.
- เส้นทาง `auth: "gateway"` ทำงานภายในสโคปรันไทม์คำขอของ Gateway แต่สโคปนั้นตั้งใจให้ค่อนข้างจำกัด:
  - bearer auth แบบ shared-secret (`gateway.auth.mode = "token"` / `"password"`) จะตรึงสโคปรันไทม์ของเส้นทาง plugin ไว้ที่ `operator.write` แม้ผู้เรียกจะส่ง `x-openclaw-scopes`
  - โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน ingress ส่วนตัว) จะเคารพ `x-openclaw-scopes` เฉพาะเมื่อมี header นี้อย่างชัดเจน
  - หากไม่มี `x-openclaw-scopes` ในคำขอเส้นทาง plugin ที่มีตัวตนเหล่านั้น สโคปรันไทม์จะ fallback ไปเป็น `operator.write`
- กฎปฏิบัติ: อย่าสันนิษฐานว่าเส้นทาง plugin ที่ใช้ gateway-auth เป็นพื้นผิวผู้ดูแลโดยปริยาย หากเส้นทางของคุณต้องใช้พฤติกรรมสำหรับผู้ดูแลเท่านั้น ให้กำหนดให้ใช้โหมด auth ที่มีตัวตน และจัดทำเอกสารสัญญา header `x-openclaw-scopes` อย่างชัดเจน.

## พาธ import ของ Plugin SDK

ใช้ subpath ของ SDK ที่แคบแทน barrel ราก `openclaw/plugin-sdk` แบบรวมศูนย์
เมื่อสร้าง plugin ใหม่ subpath หลัก:

| Subpath                             | วัตถุประสงค์                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | helper สำหรับ entry/build ของ channel                        |
| `openclaw/plugin-sdk/core`          | helper ที่ใช้ร่วมกันทั่วไปและสัญญารวม       |
| `openclaw/plugin-sdk/config-schema` | schema Zod รากของ `openclaw.json` (`OpenClawSchema`) |

Plugin ของ channel เลือกจากชุด seam แบบแคบ ได้แก่ `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรมการอนุมัติควรรวมศูนย์
ที่สัญญา `approvalCapability` เดียว แทนการผสมข้ามฟิลด์ plugin ที่ไม่เกี่ยวข้องกัน.
ดู [Plugin ของ channel](/th/plugins/sdk-channel-plugins).

helper สำหรับรันไทม์และ config อยู่ใต้ subpath `*-runtime` ที่เจาะจงสอดคล้องกัน
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` ฯลฯ) ให้เลือกใช้ `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` และ `config-mutation`
แทน barrel compatibility กว้างอย่าง `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
และ `openclaw/plugin-sdk/infra-runtime` เป็น shim compatibility ที่เลิกแนะนำแล้วสำหรับ
plugin รุ่นเก่า โค้ดใหม่ควร import primitive ทั่วไปที่แคบกว่าแทน.
</Info>

entry point ภายใน repo (ต่อรากแพ็กเกจ plugin ที่บันเดิลมา):

- `index.js` — entry ของ plugin ที่บันเดิลมา
- `api.js` — barrel helper/ชนิด
- `runtime-api.js` — barrel เฉพาะรันไทม์
- `setup-entry.js` — entry ของ setup plugin

plugin ภายนอกควร import เฉพาะ subpath `openclaw/plugin-sdk/*` เท่านั้น ห้าม
import `src/*` ของแพ็กเกจ plugin อื่นจาก core หรือจาก plugin อื่น.
entry point ที่โหลดผ่าน facade จะเลือกใช้ snapshot config รันไทม์ที่ active เมื่อมี
ก่อน แล้วจึง fallback ไปยังไฟล์ config ที่ resolve แล้วบนดิสก์.

subpath เฉพาะ capability เช่น `image-generation`, `media-understanding`,
และ `speech` มีอยู่เพราะ plugin ที่บันเดิลมาใช้ในปัจจุบัน สิ่งเหล่านี้ไม่ได้เป็น
สัญญาภายนอกที่ freeze ระยะยาวโดยอัตโนมัติ โปรดตรวจหน้าการอ้างอิง SDK
ที่เกี่ยวข้องเมื่อพึ่งพา subpath เหล่านี้.

## schema ของเครื่องมือข้อความ

Plugin ควรเป็นเจ้าของ contribution schema `describeMessageTool(...)` เฉพาะ channel
สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reaction, read และ poll.
การนำเสนอการส่งที่ใช้ร่วมกันควรใช้สัญญา `MessagePresentation` ทั่วไป
แทนฟิลด์ button, component, block หรือ card แบบ native ของ provider.
ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) สำหรับสัญญา,
กฎ fallback, การแมป provider และ checklist สำหรับผู้เขียน plugin.

Plugin ที่ส่งได้ประกาศสิ่งที่ตนสามารถ render ผ่าน capability ของข้อความ:

- `presentation` สำหรับบล็อกการนำเสนอเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอ pinned-delivery

Core ตัดสินว่าจะ render การนำเสนอแบบ native หรือลดระดับเป็นข้อความ.
อย่าเปิดช่อง escape hatch ของ UI แบบ native ของ provider จากเครื่องมือข้อความทั่วไป.
helper ของ SDK ที่เลิกแนะนำแล้วสำหรับ schema native แบบ legacy ยังคง export สำหรับ
plugin บุคคลที่สามที่มีอยู่ แต่ plugin ใหม่ไม่ควรใช้.

## การ resolve เป้าหมายของ channel

Plugin ของ channel ควรเป็นเจ้าของ semantics ของเป้าหมายเฉพาะ channel ให้ host outbound
ที่ใช้ร่วมกันยังคงเป็นแบบทั่วไป และใช้พื้นผิว messaging adapter สำหรับกฎของ provider:

- `messaging.inferTargetChatType({ to })` ตัดสินใจว่าเป้าหมายที่ normalize แล้ว
  ควรถูกถือเป็น `direct`, `group` หรือ `channel` ก่อน lookup directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่า input
  ควรข้ามไปยังการ resolve แบบ id-like โดยตรงแทนการค้นหา directory หรือไม่.
- `messaging.targetResolver.resolveTarget(...)` คือ fallback ของ plugin เมื่อ
  core ต้องการการ resolve สุดท้ายที่ provider เป็นเจ้าของหลังการ normalize หรือหลัง
  directory miss.
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้างเส้นทาง session
  เฉพาะ provider เมื่อ resolve เป้าหมายแล้ว.

การแบ่งที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจหมวดหมู่ที่ควรเกิดก่อน
  การค้นหา peer/group.
- ใช้ `looksLikeId` สำหรับการตรวจสอบ "ถือสิ่งนี้เป็น id เป้าหมายแบบชัดเจน/native".
- ใช้ `resolveTarget` สำหรับ fallback การ normalize เฉพาะ provider ไม่ใช่สำหรับ
  การค้นหา directory แบบกว้าง.
- เก็บ id แบบ native ของ provider เช่น chat id, thread id, JID, handle และ room
  id ไว้ในค่า `target` หรือพารามิเตอร์เฉพาะ provider ไม่ใช่ในฟิลด์ SDK ทั่วไป.

## directory ที่อิง config

Plugin ที่สร้าง entry ของ directory จาก config ควรเก็บตรรกะนั้นไว้ใน
plugin และใช้ helper ที่ใช้ร่วมกันจาก
`openclaw/plugin-sdk/directory-runtime`.

ใช้สิ่งนี้เมื่อ channel ต้องการ peer/group ที่อิง config เช่น:

- peer แบบ DM ที่ขับเคลื่อนด้วย allowlist
- แผนที่ channel/group ที่กำหนดค่าไว้
- fallback directory แบบคงที่ตามขอบเขตบัญชี

helper ที่ใช้ร่วมกันใน `directory-runtime` จัดการเฉพาะการดำเนินการทั่วไป:

- การกรอง query
- การใช้ limit
- helper สำหรับ dedupe/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีเฉพาะ channel และการ normalize id ควรอยู่ใน
การใช้งานของ plugin.

## catalog ของ provider

Plugin ของ provider สามารถกำหนด catalog ของ model สำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` คืนค่า shape เดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับ entry provider หนึ่งรายการ
- `{ providers }` สำหรับ entry provider หลายรายการ

ใช้ `catalog` เมื่อ plugin เป็นเจ้าของ id ของ model เฉพาะ provider, ค่าเริ่มต้นของ base URL
หรือ metadata ของ model ที่ถูกกั้นด้วย auth.

`catalog.order` ควบคุมว่า catalog ของ plugin merge เมื่อใดเมื่อเทียบกับ
provider โดยปริยายในตัวของ OpenClaw:

- `simple`: provider แบบ API key ธรรมดาหรือขับเคลื่อนด้วย env
- `profile`: provider ที่ปรากฏเมื่อมี auth profile
- `paired`: provider ที่สังเคราะห์ entry provider ที่เกี่ยวข้องกันหลายรายการ
- `late`: pass สุดท้าย หลัง provider โดยปริยายอื่น

provider ที่มาทีหลังชนะเมื่อ key collision ดังนั้น plugin สามารถ override
entry provider ในตัวที่มี provider id เดียวกันโดยเจตนาได้.

Compatibility:

- `discovery` ยังทำงานเป็น alias แบบ legacy
- หากลงทะเบียนทั้ง `catalog` และ `discovery` แล้ว OpenClaw จะใช้ `catalog`

## การตรวจสอบ channel แบบ read-only

หาก plugin ของคุณลงทะเบียน channel ให้เลือก implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`.

เหตุผล:

- `resolveAccount(...)` คือพาธรันไทม์ อนุญาตให้สันนิษฐานว่า credential
  ถูก materialize ครบถ้วนแล้ว และสามารถ fail fast เมื่อ secret ที่จำเป็นหายไป.
- พาธคำสั่งแบบ read-only เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และ flow การซ่อม
  doctor/config ไม่ควรต้อง materialize credential รันไทม์เพียงเพื่อ
  อธิบายการกำหนดค่า.

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนเฉพาะสถานะบัญชีเชิงอธิบาย.
- รักษา `enabled` และ `configured`.
- รวมฟิลด์แหล่งที่มา/สถานะของ credential เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืนค่า token ดิบเพียงเพื่อรายงานความพร้อมใช้งานแบบ read-only.
  การคืน `tokenStatus: "available"` (และฟิลด์แหล่งที่มาที่ตรงกัน)
  ก็เพียงพอสำหรับคำสั่งรูปแบบ status.
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดค่าผ่าน SecretRef แต่
  ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน.

สิ่งนี้ช่วยให้คำสั่ง read-only รายงานว่า "กำหนดค่าแล้วแต่ไม่พร้อมใช้งานในพาธ
คำสั่งนี้" แทนการ crash หรือรายงานบัญชีผิดว่าไม่ได้กำหนดค่า.

## pack ของแพ็กเกจ

directory ของ plugin อาจมี `package.json` พร้อม `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น plugin หาก pack ระบุ extension หลายรายการ id ของ plugin
จะกลายเป็น `name/<fileBase>`.

หาก plugin ของคุณ import npm deps ให้ติดตั้งไว้ใน directory นั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`).

guardrail ด้านความปลอดภัย: entry ทุกตัวใน `openclaw.extensions` ต้องอยู่ภายใน directory ของ plugin
หลังการ resolve symlink แล้ว entry ที่หลุดออกนอก directory ของแพ็กเกจจะถูก
ปฏิเสธ.

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependency ของ plugin ด้วย
`npm install --omit=dev --ignore-scripts` แบบ project-local (ไม่มี lifecycle script,
ไม่มี dev dependency ในรันไทม์) โดยไม่สนใจการตั้งค่า npm install ระดับ global ที่สืบทอดมา.
ให้คง dependency tree ของ plugin เป็น "pure JS/TS" และหลีกเลี่ยงแพ็กเกจที่ต้องใช้
build แบบ `postinstall`.

ตัวเลือก: `openclaw.setupEntry` สามารถชี้ไปยังโมดูลแบบ setup-only ที่เบาได้.
เมื่อ OpenClaw ต้องการพื้นผิว setup สำหรับ plugin ของ channel ที่ปิดใช้งาน หรือ
เมื่อ plugin ของ channel เปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า ระบบจะโหลด `setupEntry`
แทน entry ของ plugin แบบเต็ม สิ่งนี้ทำให้การเริ่มต้นและ setup เบาลง
เมื่อ entry หลักของ plugin ของคุณยัง wiring tools, hooks หรือโค้ดเฉพาะรันไทม์อื่น.

ตัวเลือก: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถให้ plugin ของ channel เลือกใช้พาธ `setupEntry` เดียวกันระหว่างเฟสเริ่มต้น
pre-listen ของ gateway ได้ แม้ channel จะกำหนดค่าไว้แล้วก็ตาม.

ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิว startup ที่ต้องมีอยู่
ก่อน gateway เริ่ม listen ได้ครบถ้วนแล้ว ในทางปฏิบัติ หมายความว่า setup entry
ต้องลงทะเบียน capability ทั้งหมดที่ channel เป็นเจ้าของซึ่ง startup พึ่งพา เช่น:

- การลงทะเบียน channel เอง
- เส้นทาง HTTP ใด ๆ ที่ต้องพร้อมใช้งานก่อน gateway เริ่ม listen
- gateway methods, tools หรือ services ใด ๆ ที่ต้องมีอยู่ระหว่างช่วงเวลาเดียวกันนั้น

หาก entry แบบเต็มของคุณยังเป็นเจ้าของ capability สำหรับ startup ที่จำเป็นใด ๆ อย่าเปิดใช้
flag นี้ ให้ plugin คงอยู่บนพฤติกรรมเริ่มต้นและให้ OpenClaw โหลด
entry แบบเต็มระหว่าง startup.

channel ที่บันเดิลมายังสามารถเผยแพร่ helper พื้นผิวสัญญาแบบ setup-only ที่ core
สามารถปรึกษาก่อนรันไทม์ channel แบบเต็มจะถูกโหลด พื้นผิวการ promote setup
ปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core ใช้พื้นผิวนั้นเมื่อจำเป็นต้องเลื่อนระดับคอนฟิกช่องทางบัญชีเดียวแบบเดิมเข้าไปใน `channels.<id>.accounts.*` โดยไม่ต้องโหลดรายการ Plugin เต็มรูปแบบ Matrix เป็นตัวอย่างที่บันเดิลอยู่ในปัจจุบัน: โดยจะย้ายเฉพาะคีย์ auth/bootstrap เข้าไปยังบัญชีที่เลื่อนระดับแบบมีชื่อเมื่อมีบัญชีแบบมีชื่ออยู่แล้ว และสามารถรักษาคีย์บัญชีเริ่มต้นที่คอนฟิกไว้แบบไม่ใช่ canonical ไว้ได้ แทนที่จะสร้าง `accounts.default` เสมอ

อะแดปเตอร์แพตช์การตั้งค่าเหล่านั้นทำให้การค้นพบพื้นผิวสัญญาที่บันเดิลไว้ยังคงเป็นแบบ lazy เวลา import ยังเบาอยู่; พื้นผิวการเลื่อนระดับจะโหลดเฉพาะเมื่อใช้งานครั้งแรก แทนที่จะย้อนกลับเข้าไปเริ่มต้นช่องทางที่บันเดิลไว้ตอน import โมดูล

เมื่อพื้นผิวเริ่มต้นเหล่านั้นรวมเมธอด RPC ของ Gateway ให้เก็บไว้บน prefix เฉพาะ Plugin namespace ผู้ดูแลระบบของ Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และ resolve เป็น `operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

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

### metadata แคตตาล็อกช่องทาง

Plugin ช่องทางสามารถประกาศ metadata สำหรับการตั้งค่า/การค้นพบผ่าน `openclaw.channel` และคำใบ้การติดตั้งผ่าน `openclaw.install` วิธีนี้ทำให้แคตตาล็อกของ Core ไม่มีข้อมูลฝังอยู่

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

- `detailLabel`: ป้ายรองสำหรับพื้นผิวแคตตาล็อก/สถานะที่สมบูรณ์ขึ้น
- `docsLabel`: แทนที่ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: id ของ Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งรายการแคตตาล็อกนี้ควรอยู่เหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความบนพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายว่าช่องทางรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนช่องทางจากพื้นผิวรายการช่องทางที่คอนฟิกแล้วเมื่อตั้งค่าเป็น `false`
- `exposure.setup`: ซ่อนช่องทางจากตัวเลือกตั้งค่า/คอนฟิกแบบโต้ตอบเมื่อตั้งค่าเป็น `false`
- `exposure.docs`: ทำเครื่องหมายช่องทางเป็นภายใน/ส่วนตัวสำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: alias แบบเดิมที่ยังยอมรับเพื่อความเข้ากันได้; แนะนำให้ใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้ช่องทางเข้าร่วมโฟลว์ `allowFrom` ของ quickstart มาตรฐาน
- `forceAccountBinding`: บังคับให้ผูกบัญชีอย่างชัดเจนแม้ว่าจะมีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ให้ความสำคัญกับการค้นหา session เมื่อ resolve เป้าหมายประกาศ

OpenClaw ยังสามารถ merge **แคตตาล็อกช่องทางภายนอก** ได้ด้วย (เช่น export จาก registry ของ MPM) วางไฟล์ JSON ไว้ที่หนึ่งในตำแหน่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยังไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วยจุลภาค/อัฒภาค/`PATH`) แต่ละไฟล์ควรมี `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังยอมรับ `"packages"` หรือ `"plugins"` เป็น alias แบบเดิมสำหรับคีย์ `"entries"` ด้วย

รายการแคตตาล็อกช่องทางที่สร้างขึ้นและรายการแคตตาล็อกติดตั้ง provider เปิดเผยข้อเท็จจริงแหล่งติดตั้งที่ normalize แล้วไว้ถัดจากบล็อก `openclaw.install` แบบดิบ ข้อเท็จจริงที่ normalize แล้วระบุว่า npm spec เป็นเวอร์ชันแบบ exact หรือ selector แบบ floating, มี metadata integrity ที่คาดไว้หรือไม่, และมี path แหล่งภายในเครื่องพร้อมใช้งานด้วยหรือไม่ เมื่อรู้ตัวตนของแคตตาล็อก/package ข้อเท็จจริงที่ normalize แล้วจะเตือนหากชื่อ npm package ที่ parse ได้คลาดเคลื่อนจากตัวตนนั้น นอกจากนี้ยังเตือนเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยังแหล่งที่ไม่มีอยู่ และเมื่อมี metadata integrity ของ npm โดยไม่มีแหล่ง npm ที่ถูกต้อง consumer ควรมอง `installSource` เป็นฟิลด์ optional แบบ additive เพื่อให้รายการที่สร้างด้วยมือและ shim ของแคตตาล็อกไม่ต้องสังเคราะห์ฟิลด์นี้ วิธีนี้ทำให้ onboarding และ diagnostics อธิบายสถานะ source-plane ได้โดยไม่ต้อง import runtime ของ Plugin

รายการ npm ภายนอกอย่างเป็นทางการควรใช้ `npmSpec` แบบ exact ร่วมกับ `expectedIntegrity` เป็นหลัก ชื่อ package เปล่าและ dist-tag ยังใช้งานได้เพื่อความเข้ากันได้ แต่จะแสดงคำเตือน source-plane เพื่อให้แคตตาล็อกค่อยๆ เคลื่อนไปสู่การติดตั้งแบบ pin และตรวจสอบ integrity โดยไม่ทำให้ Plugin ที่มีอยู่เสียหาย เมื่อ onboarding ติดตั้งจาก path แคตตาล็อกภายในเครื่อง จะบันทึกรายการดัชนี Plugin ที่จัดการแล้วด้วย `source: "path"` และ `sourcePath` แบบสัมพันธ์กับ workspace เมื่อทำได้ path โหลดใช้งานจริงแบบ absolute จะยังอยู่ใน `plugins.load.paths`; ระเบียนการติดตั้งหลีกเลี่ยงการทำซ้ำ path ของ workstation ภายในเครื่องลงในคอนฟิกระยะยาว วิธีนี้ทำให้การติดตั้งสำหรับการพัฒนาภายในเครื่องมองเห็นได้ใน diagnostics ของ source-plane โดยไม่เพิ่มพื้นผิวเปิดเผย raw filesystem path ที่สอง ดัชนี Plugin ที่ persist ไว้ใน `plugins/installs.json` คือแหล่งความจริงของแหล่งติดตั้ง และสามารถ refresh ได้โดยไม่ต้องโหลดโมดูล runtime ของ Plugin map `installRecords` ของมันคงทนแม้ manifest ของ Plugin จะหายไปหรือไม่ถูกต้อง; array `plugins` ของมันเป็นมุมมอง manifest ที่สร้างใหม่ได้

## Plugin เอนจินบริบท

Plugin เอนจินบริบทเป็นเจ้าของการ orchestration บริบท session สำหรับ ingest, assembly, และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย `api.registerContextEngine(id, factory)` จากนั้นเลือกเอนจินที่ใช้งานอยู่ด้วย `plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ Plugin ของคุณจำเป็นต้องแทนที่หรือขยาย pipeline บริบทเริ่มต้น แทนที่จะเพียงเพิ่มการค้นหา memory หรือ hook

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

factory `ctx` เปิดเผยค่า optional `config`, `agentDir`, และ `workspaceDir` สำหรับการเริ่มต้นตอน construction

หากเอนจินของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึม Compaction ให้ยังคง implement `compact()` ไว้และ delegate อย่างชัดเจน:

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

## การเพิ่ม capability ใหม่

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าเลี่ยงระบบ Plugin ด้วยการเข้าถึงส่วน private โดยตรง ให้เพิ่ม capability ที่ขาดอยู่

ลำดับที่แนะนำ:

1. กำหนดสัญญาของ Core
   ตัดสินใจว่า Core ควรเป็นเจ้าของพฤติกรรมร่วมใด: policy, fallback, การ merge คอนฟิก, lifecycle, semantics ที่หันหน้าไปยังช่องทาง, และรูปทรงของ runtime helper
2. เพิ่มพื้นผิวการลงทะเบียน/runtime ของ Plugin ที่มี type
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิว capability แบบมี type ที่เล็กที่สุดแต่มีประโยชน์
3. เชื่อม Core + consumer ของช่องทาง/ฟีเจอร์
   ช่องทางและ Plugin ฟีเจอร์ควร consume capability ใหม่ผ่าน Core ไม่ใช่โดย import implementation ของ vendor โดยตรง
4. ลงทะเบียน implementation ของ vendor
   จากนั้น Plugin ของ vendor ลงทะเบียน backend ของตนกับ capability
5. เพิ่ม coverage ของสัญญา
   เพิ่มการทดสอบเพื่อให้ ownership และรูปทรงการลงทะเบียนยังคงชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw คงความมีจุดยืนไว้โดยไม่ hardcode เข้ากับโลกทัศน์ของ provider รายเดียว ดู [Capability Cookbook](/th/plugins/architecture) สำหรับ checklist ไฟล์ที่เป็นรูปธรรมและตัวอย่างที่ทำให้ดู

### checklist ของ capability

เมื่อคุณเพิ่ม capability ใหม่ โดยปกติ implementation ควรแตะพื้นผิวเหล่านี้พร้อมกัน:

- type สัญญาของ Core ใน `src/<capability>/types.ts`
- runner/runtime helper ของ Core ใน `src/<capability>/runtime.ts`
- พื้นผิวการลงทะเบียน API ของ Plugin ใน `src/plugins/types.ts`
- การเดินสาย registry ของ Plugin ใน `src/plugins/registry.ts`
- การเปิดเผย runtime ของ Plugin ใน `src/plugins/runtime/*` เมื่อ Plugin ฟีเจอร์/ช่องทางต้อง consume
- helper สำหรับ capture/test ใน `src/test-utils/plugin-registration.ts`
- assertion ownership/สัญญาใน `src/plugins/contracts/registry.ts`
- เอกสาร operator/Plugin ใน `docs/`

หากพื้นผิวหนึ่งในนั้นขาดไป โดยปกติเป็นสัญญาณว่า capability ยังผสานรวมไม่ครบ

### template ของ capability

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

รูปแบบการทดสอบสัญญา:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

นั่นทำให้กฎเรียบง่าย:

- Core เป็นเจ้าของสัญญา capability + orchestration
- Plugin ของ vendor เป็นเจ้าของ implementation ของ vendor
- Plugin ฟีเจอร์/ช่องทาง consume runtime helper
- การทดสอบสัญญาทำให้ ownership ชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — โมเดลและรูปทรง capability สาธารณะ
- [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
