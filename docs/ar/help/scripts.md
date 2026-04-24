---
read_when:
    - تشغيل السكربتات من المستودع
    - إضافة سكربتات أو تغييرها تحت ./scripts
summary: 'نصوص المستودع: الغرض والنطاق وملاحظات السلامة'
title: السكربتات
x-i18n:
    generated_at: "2026-04-24T07:46:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

يحتوي الدليل `scripts/` على سكربتات مساعدة لسير العمل المحلي ومهام التشغيل.
استخدمها عندما تكون المهمة مرتبطة بوضوح بسكربت؛ وإلا ففضّل CLI.

## الاصطلاحات

- السكربتات **اختيارية** ما لم تتم الإشارة إليها في الوثائق أو قوائم التحقق الخاصة بالإصدارات.
- فضّل أسطح CLI عندما تكون موجودة (مثال: تستخدم مراقبة المصادقة `openclaw models status --check`).
- افترض أن السكربتات خاصة بالمضيف؛ واقرأها قبل تشغيلها على جهاز جديد.

## سكربتات مراقبة المصادقة

تتم تغطية مراقبة المصادقة في [المصادقة](/ar/gateway/authentication). السكربتات الموجودة تحت `scripts/` هي إضافات اختيارية لسير عمل systemd/Termux على الهاتف.

## مساعد قراءة GitHub

استخدم `scripts/gh-read` عندما تريد أن يستخدم `gh` رمز تثبيت GitHub App لاستدعاءات القراءة ضمن نطاق المستودع مع الإبقاء على `gh` العادي مسجلًا بحسابك الشخصي لإجراءات الكتابة.

متغيرات البيئة المطلوبة:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

متغيرات البيئة الاختيارية:

- `OPENCLAW_GH_READ_INSTALLATION_ID` عندما تريد تخطي البحث عن التثبيت المعتمد على المستودع
- `OPENCLAW_GH_READ_PERMISSIONS` كتجاوز مفصول بفواصل لمجموعة أذونات القراءة المطلوبة

ترتيب حل المستودع:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

أمثلة:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## عند إضافة سكربتات

- اجعل السكربتات مركزة وموثقة.
- أضف إدخالًا قصيرًا في الوثيقة ذات الصلة (أو أنشئ واحدة إذا كانت مفقودة).

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
