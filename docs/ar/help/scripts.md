---
read_when:
    - تشغيل البرامج النصية من المستودع
    - إضافة أو تغيير البرامج النصية ضمن ./scripts
summary: 'برامج المستودع النصية: الغرض والنطاق وملاحظات السلامة'
title: البرامج النصية
x-i18n:
    generated_at: "2026-07-12T05:57:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` يحتوي على نصوص برمجية مساعدة لسير العمل المحلي ومهام التشغيل. استخدمها عندما تكون المهمة مرتبطة بوضوح بنص برمجي؛ وإلا ففضّل CLI.

## الاصطلاحات

- النصوص البرمجية **اختيارية** ما لم تُذكر في الوثائق أو قوائم تحقق الإصدار.
- فضّل واجهات CLI عند توفرها (مثال: `openclaw models status --check`).
- افترض أن النصوص البرمجية خاصة بالنظام المضيف؛ اقرأها قبل تشغيلها على جهاز جديد.

## نصوص مراقبة المصادقة

تتناول صفحة [المصادقة](/ar/gateway/authentication) مصادقة النماذج العامة. أما النصوص البرمجية أدناه فهي نظام منفصل واختياري لمراقبة **رمز اشتراك Claude Code CLI** على مضيف بعيد/بلا واجهة، وإعادة المصادقة من هاتف:

- `scripts/setup-auth-system.sh` - إعداد لمرة واحدة: يتحقق من المصادقة الحالية، ويساعد على إنشاء `claude setup-token` طويل الأجل، ويطبع خطوات تثبيت systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` - يتحقق من حالة مصادقة Claude Code وOpenClaw.
- `scripts/auth-monitor.sh` - يستطلع الحالة ويرسل إشعارًا (عبر إرسال OpenClaw و/أو ntfy.sh) عندما يقترب الرمز من انتهاء الصلاحية. متغيرات البيئة: `WARN_HOURS` (القيمة الافتراضية `2`)، و`NOTIFY_PHONE`، و`NOTIFY_NTFY`. شغّله وفق جدول زمني عبر `scripts/systemd/openclaw-auth-monitor.{service,timer}` المضمّن (كل 30 دقيقة).
- `scripts/mobile-reauth.sh` - يعيد تشغيل `claude setup-token` ويطبع عناوين URL لفتحها على هاتف، لاستخدامه عبر SSH من Termux.
- `scripts/termux-quick-auth.sh`، و`scripts/termux-auth-widget.sh`، و`scripts/termux-sync-widget.sh` - نصوص Termux:Widget تتصل بالمضيف عبر SSH، وتعرض إشعار حالة منبثقًا، وتفتح وحدة تحكم/تعليمات إعادة المصادقة عند انتهاء صلاحية المصادقة.

## أداة GitHub المساعدة للقراءة

استخدم `scripts/gh-read` عندما تريد أن يستخدم `gh` رمز تثبيت GitHub App لإجراء استدعاءات قراءة مقتصرة على المستودع، مع إبقاء `gh` العادي مسجّلًا بحسابك الشخصي لإجراءات الكتابة.

متغيرات البيئة المطلوبة:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

متغيرات البيئة الاختيارية:

- `OPENCLAW_GH_READ_INSTALLATION_ID` عندما تريد تخطي البحث عن التثبيت المستند إلى المستودع
- `OPENCLAW_GH_READ_PERMISSIONS` كتجاوز مفصول بفواصل لمجموعة أذونات القراءة الفرعية المطلوب طلبها

ترتيب تحديد المستودع:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

أمثلة:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## عند إضافة نصوص برمجية

- اجعل النصوص البرمجية مركّزة وموثّقة.
- أضف إدخالًا موجزًا في الوثيقة ذات الصلة (أو أنشئ واحدة إذا كانت غير موجودة).

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
