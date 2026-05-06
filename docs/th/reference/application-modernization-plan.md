---
read_when:
    - การวางแผนปรับปรุงแอปพลิเคชัน OpenClaw ให้ทันสมัยในวงกว้าง
    - อัปเดตมาตรฐานการพัฒนาส่วนหน้าสำหรับงานแอปหรือ Control UI
    - เปลี่ยนการทบทวนคุณภาพผลิตภัณฑ์ในวงกว้างให้เป็นงานวิศวกรรมแบบแบ่งระยะ
summary: แผนการปรับปรุงแอปพลิเคชันให้ทันสมัยอย่างครอบคลุม พร้อมการอัปเดตทักษะด้านการส่งมอบฟรอนต์เอนด์
title: แผนการปรับปรุงแอปพลิเคชันให้ทันสมัย
x-i18n:
    generated_at: "2026-05-06T09:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## เป้าหมาย

ผลักดันแอปพลิเคชันไปสู่ผลิตภัณฑ์ที่สะอาดขึ้น เร็วขึ้น และบำรุงรักษาง่ายขึ้น โดยไม่ทำให้เวิร์กโฟลว์ปัจจุบันเสียหายหรือซ่อนความเสี่ยงไว้ในรีแฟกเตอร์ขนาดใหญ่ งานควรลงเป็นส่วนเล็ก ๆ ที่ตรวจทานได้ พร้อมหลักฐานสำหรับแต่ละพื้นผิวที่แตะต้อง

## หลักการ

- รักษาสถาปัตยกรรมปัจจุบันไว้ เว้นแต่ขอบเขตใดพิสูจน์ได้ชัดว่าทำให้เกิดงานซ้ำ ต้นทุนด้านประสิทธิภาพ หรือบั๊กที่ผู้ใช้มองเห็น
- เลือกแพตช์ที่ถูกต้องและเล็กที่สุดสำหรับแต่ละปัญหา แล้วทำซ้ำ
- แยกการแก้ไขที่จำเป็นออกจากการขัดเกลาเพิ่มเติม เพื่อให้ผู้ดูแลสามารถลงงานมูลค่าสูงได้โดยไม่ต้องรอการตัดสินใจเชิงอัตวิสัย
- ทำให้พฤติกรรมที่หันหน้าไปยัง Plugin มีเอกสารกำกับและเข้ากันได้ย้อนหลัง
- ตรวจสอบพฤติกรรมที่เผยแพร่แล้ว สัญญาของ dependency และการทดสอบ ก่อนอ้างว่าแก้ regression แล้ว
- ปรับปรุงเส้นทางหลักของผู้ใช้ก่อน: onboarding, auth, แชต, การตั้งค่า provider, การจัดการ Plugin และ diagnostics

## ระยะที่ 1: การตรวจสอบ baseline

ทำรายการแอปพลิเคชันปัจจุบันก่อนเปลี่ยนแปลง

- ระบุเวิร์กโฟลว์ผู้ใช้หลักและพื้นผิวโค้ดที่เป็นเจ้าของเวิร์กโฟลว์เหล่านั้น
- แสดงรายการ affordance ที่ตายแล้ว การตั้งค่าที่ซ้ำกัน สถานะข้อผิดพลาดที่ไม่ชัดเจน และเส้นทาง render ที่มีต้นทุนสูง
- บันทึกคำสั่ง validation ปัจจุบันสำหรับแต่ละพื้นผิว
- ทำเครื่องหมายปัญหาเป็นจำเป็น แนะนำ หรือไม่บังคับ
- จัดทำเอกสาร blocker ที่ทราบซึ่งต้องให้ owner ตรวจทาน โดยเฉพาะการเปลี่ยนแปลง API, security, release และสัญญา Plugin

นิยามของเสร็จสิ้น:

- รายการ issue หนึ่งรายการพร้อมการอ้างอิงไฟล์จาก repo-root
- แต่ละ issue มีความรุนแรง พื้นผิว owner ผลกระทบที่คาดว่าจะเกิดกับผู้ใช้ และเส้นทาง validation ที่เสนอ
- ไม่มีรายการ cleanup เชิงคาดเดาปะปนอยู่ในการแก้ไขที่จำเป็น

## ระยะที่ 2: การ cleanup ผลิตภัณฑ์และ UX

จัดลำดับความสำคัญของเวิร์กโฟลว์ที่มองเห็นได้และลดความสับสน

- กระชับข้อความ onboarding และ empty state รอบ model auth, สถานะ Gateway และการตั้งค่า Plugin
- ลบหรือปิดใช้งาน affordance ที่ตายแล้วเมื่อไม่มี action ที่ทำได้
- ทำให้ action สำคัญยังมองเห็นได้ในความกว้าง responsive ต่าง ๆ แทนการซ่อนไว้หลังสมมติฐาน layout ที่เปราะบาง
- รวมภาษาสถานะที่ซ้ำกัน เพื่อให้ข้อผิดพลาดมีแหล่งความจริงเดียว
- เพิ่ม progressive disclosure สำหรับการตั้งค่าขั้นสูง โดยยังคงให้การตั้งค่าหลักรวดเร็ว

validation ที่แนะนำ:

- happy path แบบ manual สำหรับการตั้งค่าครั้งแรกและการเริ่มต้นของผู้ใช้เดิม
- การทดสอบแบบ focused สำหรับ logic ด้าน routing, config persistence หรือ status derivation
- screenshot ของเบราว์เซอร์สำหรับพื้นผิว responsive ที่เปลี่ยนแปลง

## ระยะที่ 3: การกระชับสถาปัตยกรรม frontend

ปรับปรุงความสามารถในการบำรุงรักษาโดยไม่ rewrite ครั้งใหญ่

- ย้ายการแปลงสถานะ UI ที่ซ้ำกันไปยัง helper แบบ typed ที่แคบ
- แยกความรับผิดชอบด้าน data fetching, persistence และ presentation ออกจากกัน
- เลือกใช้ hook, store และ pattern ของ component ที่มีอยู่แทนการเพิ่ม abstraction ใหม่
- แยก component ที่ใหญ่เกินไปเฉพาะเมื่อช่วยลด coupling หรือทำให้การทดสอบชัดเจนขึ้น
- หลีกเลี่ยงการเพิ่ม global state ขนาดใหญ่สำหรับ interaction ภายใน panel เฉพาะที่

guardrail ที่จำเป็น:

- อย่าเปลี่ยนพฤติกรรมสาธารณะเป็นผลข้างเคียงของการแยกไฟล์
- รักษาพฤติกรรม accessibility สำหรับ menu, dialog, tab และ keyboard navigation
- ตรวจสอบว่า loading, empty, error และ optimistic state ยัง render ได้

## ระยะที่ 4: ประสิทธิภาพและความน่าเชื่อถือ

มุ่งที่ pain ที่วัดได้ แทนการปรับแต่งเชิงทฤษฎีกว้าง ๆ

- วัดต้นทุน startup, route transition, large list และ chat transcript
- แทนที่ derived data ราคาแพงที่ทำซ้ำด้วย memoized selector หรือ cached helper เมื่อ profiling พิสูจน์ว่ามีค่า
- ลด network หรือ filesystem scan ที่หลีกเลี่ยงได้บน hot path
- รักษาลำดับที่ deterministic สำหรับ input ของ prompt, registry, file, Plugin และ network ก่อนสร้าง model payload
- เพิ่ม regression test น้ำหนักเบาสำหรับ hot helper และขอบเขตสัญญา

นิยามของเสร็จสิ้น:

- การเปลี่ยนแปลงด้านประสิทธิภาพแต่ละรายการบันทึก baseline, ผลกระทบที่คาดหวัง, ผลกระทบจริง และช่องว่างที่เหลือ
- ไม่มี perf patch ใดลงโดยอาศัยสัญชาตญาณเพียงอย่างเดียวเมื่อมีการวัดราคาถูกให้ใช้

## ระยะที่ 5: การเสริมความแข็งแรงของ type, contract และ test

ยกระดับความถูกต้องที่จุดขอบเขตที่ผู้ใช้และผู้เขียน Plugin พึ่งพา

- แทนที่ runtime string แบบหลวมด้วย discriminated union หรือรายการ code แบบปิด
- ตรวจสอบ external input ด้วย schema helper ที่มีอยู่หรือ zod
- เพิ่ม contract test รอบ manifest ของ Plugin, catalog ของ provider, ข้อความ protocol ของ Gateway และพฤติกรรม config migration
- เก็บเส้นทาง compatibility ไว้ใน doctor หรือ repair flow แทน migration ที่ซ่อนอยู่ตอน startup
- หลีกเลี่ยง coupling สำหรับการทดสอบเท่านั้นกับ internals ของ Plugin; ใช้ facade ของ SDK และ barrel ที่มีเอกสารกำกับ

validation ที่แนะนำ:

- `pnpm check:changed`
- การทดสอบแบบ targeted สำหรับทุกขอบเขตที่เปลี่ยนแปลง
- `pnpm build` เมื่อ lazy boundary, packaging หรือพื้นผิวที่เผยแพร่เปลี่ยนแปลง

## ระยะที่ 6: เอกสารและความพร้อม release

ทำให้เอกสารที่หันหน้าไปยังผู้ใช้สอดคล้องกับพฤติกรรม

- อัปเดตเอกสารตามการเปลี่ยนแปลงพฤติกรรม, API, config, onboarding หรือ Plugin
- เพิ่มรายการ changelog เฉพาะการเปลี่ยนแปลงที่ผู้ใช้มองเห็น
- ใช้คำศัพท์ Plugin ในส่วนที่หันหน้าไปยังผู้ใช้; ใช้ชื่อ package ภายในเฉพาะจุดที่จำเป็นสำหรับ contributor
- ยืนยันว่าคำแนะนำ release และ install ยังตรงกับพื้นผิวคำสั่งปัจจุบัน

นิยามของเสร็จสิ้น:

- เอกสารที่เกี่ยวข้องได้รับการอัปเดตใน branch เดียวกับการเปลี่ยนแปลงพฤติกรรม
- การตรวจ generated docs หรือ API drift ผ่านเมื่อมีการแตะต้อง
- handoff ระบุ validation ใดที่ข้ามไปและเหตุผลที่ข้าม

## ส่วนแรกที่แนะนำ

เริ่มด้วย pass ที่จำกัดขอบเขตบน Control UI และ onboarding:

- ตรวจสอบพื้นผิวการตั้งค่าครั้งแรก ความพร้อมของ provider auth สถานะ Gateway และการตั้งค่า Plugin
- ลบ action ที่ตายแล้วและทำให้สถานะ failure ชัดเจนขึ้น
- เพิ่มหรืออัปเดตการทดสอบแบบ focused สำหรับ status derivation และ config persistence
- รัน `pnpm check:changed`

สิ่งนี้ให้คุณค่าต่อผู้ใช้สูงโดยมีความเสี่ยงด้านสถาปัตยกรรมจำกัด

## การอัปเดต Skills สำหรับ frontend

ใช้ส่วนนี้เพื่ออัปเดต `SKILL.md` ที่เน้น frontend ซึ่งมาพร้อมกับงาน modernization หากนำแนวทางนี้ไปใช้เป็น Skills ของ OpenClaw ภายใน repo ให้สร้าง `.agents/skills/openclaw-frontend/SKILL.md` ก่อน รักษา frontmatter ที่เป็นของ Skills เป้าหมายนั้นไว้ จากนั้นเพิ่มหรือแทนที่คำแนะนำส่วน body ด้วยเนื้อหาต่อไปนี้

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
