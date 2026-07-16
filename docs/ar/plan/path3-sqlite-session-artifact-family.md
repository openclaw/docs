---
read_when:
    - أنت تنفّذ clawdbot-d63.2 / clawdbot-04b
    - أنت تتعامل مع الاحتفاظ بجلسات SQLite أو إعادة تعيينها أو حذفها أو أرشفتها عند حذف الوكيل
    - تحتاج إلى التمييز بين مجموعات العناصر الأثرية العائدة إلى حقبة SQLite وملفات JSONL الجانبية القديمة
summary: خطة المسار 3 لأرشفة جميع عناصر نصوص المحادثات في SQLite التي تنتمي إلى جلسة ما
title: عائلة عناصر جلسة SQLite للمسار 3
x-i18n:
    generated_at: "2026-07-16T14:33:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# عائلة آثار جلسات SQLite للمسار 3

تحدد هذه الملاحظة نطاق `clawdbot-d63.2` بينما يتولى `clawdbot-d63.1` مساعد
أرشفة إعادة التعيين/الحذف المتداخل في `src/config/sessions/session-accessor.sqlite.ts`.
كان ملف التنفيذ يحتوي على تغييرات غير مثبتة أثناء هذه الجولة، لذا يسجل هذا الأثر
العقد الدقيق ونقاط التصحيح دون التعارض مع العامل الآخر.

## العائلة المرجعية

بعد التحويل إلى SQLite، تصبح نصوص الجلسات النشطة صفوفًا في SQLite. عائلة أرشيف
الجلسة هي:

- صفوف `transcript_events` و`transcript_event_identities` و`sessions`
  الخاصة بـ `sessionId` الحالي للإدخال.
- مجموعة صفوف نص SQLite نفسها لكل `sessionId` مشار إليه بواسطة
  `entry.compactionCheckpoints[*].preCompaction.sessionId`.
- مجموعة صفوف نص SQLite نفسها لكل `sessionId` مشار إليه بواسطة
  `entry.compactionCheckpoints[*].postCompaction.sessionId`.
- مجموعة صفوف نص SQLite نفسها لكل `sessionId` في
  `entry.usageFamilySessionIds`.

لا تؤرشف إلا الصفوف التي لم يعد يشير إليها أي صف متبقٍ من
`session_entries` أو بيانات التعريف الخاصة بعائلة Compaction أو الاستخدام لأي إدخال متبقٍ.
يحافظ هذا على حالة تفرع/استعادة نقطة التحقق وتجميع الاستخدام حتى يزول
آخر مرجع نشط.

## الآثار غير التابعة للعائلة بعد التحويل

ليست متغيرات ملفات نصوص الموضوع المُنشأة والملفات الجانبية للمسار حالة تشغيل
نشطة في SQLite. بل هي آثار ملفات قديمة:

- لا توجد متغيرات الموضوع مثل `<sessionId>-topic-<thread>.jsonl` إلا
  لتنسيق النصوص المدعوم بالملفات. يستخدم SQLite معرّف الجلسة الأساسي بالإضافة إلى
  بيانات تعريف تسليم `session_routes`/الإدخال بدلًا من ملفات JSONL منفصلة لكل موضوع.
- تُسمّى الملفات الجانبية للمسار مثل `.trajectory.jsonl` و`.trajectory-path.json`
  استنادًا إلى مسارات `sessionFile` حقيقية لملفات JSONL. قيم `sessionFile` في SQLite هي
  علامات `sqlite:<agentId>:<sessionId>:<storePath>` ولا تسمّي ملفات
  جانبية.
- يجب أن تواصل قارئات طبقة الأرشيف قراءة ملفات JSONL القديمة المؤرشفة، لكن
  يجب ألا تفحص عملية الاحتفاظ وقت التشغيل أدلة الجلسات النشطة أو تعيد فتح ملفات نصوص
  JSONL لجلسات SQLite.

يظل استيراد Doctor هو مالك ترحيل ملفات JSONL الأساسية القديمة
وملفات المسار الجانبية المجاورة لها. يجب ألا تضيف عملية الاحتفاظ في SQLite وقت التشغيل
مستوردًا ثانيًا أو مسارًا احتياطيًا للملفات.

## نقاط التصحيح

وسّع مساعد أرشفة SQLite الذي قدمه `clawdbot-d63.1` بدلًا من
إضافة مسار موازٍ.

1. أضف جامعًا محليًا بالقرب من `deleteSqliteSessionStateIfUnreferenced`:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - ضمّن `entry.sessionId`، ومعرّفات الجلسات السابقة/اللاحقة لنقطة التحقق، و
     `usageFamilySessionIds`.
   - رشّح السلاسل الفارغة وأزل التكرارات بطريقة حتمية.

2. أضف جامع مراجع للمخزن بعد الإزالة:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - كرّر على `session_entries` الحالية، وحلّل كل `entry_json`، واجمع
     معرّفات العائلة نفسها من كل إدخال باقٍ.

3. غيّر مستدعي إعادة التعيين/الحذف/الصيانة الذين يؤرشفون حاليًا
   `sessionId` واحدًا تمت إزالته لتمرير العائلة الكاملة للإدخال المُزال.

4. لكل معرّف عائلة، أرشف صفوف نص SQLite باستخدام سبب المستدعي
   (`reset` أو `deleted`)، ثم احذف صف `sessions` فقط عندما يكون
   معرّف العائلة غائبًا عن مجموعة المراجع بعد الإزالة.

5. أبقِ حذف أحداث النص مركزيًا عبر مسار تنظيف صفوف جلسة SQLite
   الحالي. لا تضف قراءات JSONL نشطة.

## الاختبارات المركزة

أضف اختبارات خاصة بـ SQLite فقط إلى `src/config/sessions/session-accessor.conformance.test.ts`
أو اختبار دورة الحياة الآخر بعد أن يثبّت `clawdbot-d63.1` تغييراته:

- يؤدي حذف إدخال له نص سابق لعملية Compaction إلى أرشفة كل من الجلسة الحالية
  والجلسة السابقة لعملية Compaction، ثم إزالة مجموعتي صفوف SQLite كلتيهما.
- لا يؤدي حذف أحد إدخالين يشتركان في جلسة سابقة لعملية Compaction إلى أرشفة
  أي شيء للجلسة السابقة المشتركة حتى تتم إزالة آخر إدخال يشير
  إليها.
- يؤدي حذف إدخال يحتوي على `usageFamilySessionIds` إلى أرشفة صفوف نص SQLite
  السابقة عندما لا يشير أي إدخال آخر إلى عائلة الاستخدام تلك.
- لا يتسبب مفتاح جلسة بهيئة موضوع مع علامة SQLite في أي قراءة لملف JSONL
  مُنشأ للموضوع أو بحث عن ملف جانبي.

يجب أن يستخدم الإثبات المركّز:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

إذا كانت الاختبارات النهائية موجودة في `store.session-lifecycle-mutation.test.ts`، فشغّل ذلك
الملف صراحةً باستخدام الغلاف نفسه. يجب أن تبقى بوابات `pnpm` العامة على
Crabbox/Testbox لشجرة عمل Codex هذه.
