---
read_when:
    - تثبيت تطبيق macOS
    - تحديد الاختيار بين وضع Gateway المحلي والبعيد على macOS
    - البحث عن تنزيلات إصدار تطبيق macOS
summary: ثبّت واستخدم تطبيق OpenClaw لشريط القوائم في macOS
title: تطبيق macOS
x-i18n:
    generated_at: "2026-07-04T06:34:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

تطبيق macOS هو **رفيق شريط القوائم** في OpenClaw. استخدمه عندما تريد
واجهة علبة أصلية، أو مطالبات أذونات macOS، أو إشعارات، أو WebChat، أو إدخالًا صوتيًا،
أو Canvas، أو أدوات عقد مستضافة على Mac مثل `system.run`.

إذا كنت تحتاج فقط إلى CLI وGateway، فابدأ بـ [بدء الاستخدام](/ar/start/getting-started).

## التنزيل

نزّل إصدارات تطبيق macOS من
[إصدارات OpenClaw على GitHub](https://github.com/openclaw/openclaw/releases).
عندما يتضمن الإصدار أصول تطبيق macOS، ابحث عن:

- `OpenClaw-<version>.dmg` (مفضّل)
- `OpenClaw-<version>.zip`

تتضمن بعض الإصدارات فقط أصول CLI أو أدلة إثبات أو Windows. إذا لم يتضمن أحدث
إصدار أصل تطبيق macOS، فاستخدم أحدث إصدار يتضمنه، أو ابنِ التطبيق
من المصدر باستخدام [إعداد تطوير macOS](/ar/platforms/mac/dev-setup).

## التشغيل الأول

1. ثبّت وشغّل **OpenClaw.app**.
2. اختر **هذا الـ Mac** من أجل Gateway محلي، أو اتصل بـ Gateway بعيد.
3. في الوضع المحلي، انتظر بينما يثبّت التطبيق وقت التشغيل وGateway في مساحة المستخدم.
4. أكمل إعداد المزوّد وقائمة تحقق أذونات macOS.
5. أرسل رسالة اختبار الإعداد الأولي.

لمسار إعداد CLI/Gateway، استخدم [بدء الاستخدام](/ar/start/getting-started).
لاستعادة الأذونات، استخدم [أذونات macOS](/ar/platforms/mac/permissions).

## اختيار وضع Gateway

| الوضع | استخدمه عندما | صفحة التفاصيل |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| محلي | يجب أن يشغّل هذا الـ Mac الـ Gateway ويبقيه حيًا باستخدام launchd. | [Gateway على macOS](/ar/platforms/mac/bundled-gateway) |
| بعيد | يشغّل مضيف آخر الـ Gateway ويجب أن يتحكم به هذا الـ Mac عبر SSH أو LAN أو Tailnet. | [التحكم عن بُعد](/ar/platforms/mac/remote) |

يتطلب الوضع المحلي CLI مثبتًا باسم `openclaw`. على جهاز Mac جديد، يثبّت التطبيق
CLI ووقت التشغيل المطابقين تلقائيًا قبل بدء معالج Gateway.
راجع [Gateway على macOS](/ar/platforms/mac/bundled-gateway) للاستعادة اليدوية.

## ما يملكه التطبيق

- حالة شريط القوائم، والإشعارات، والصحة، وWebChat.
- مطالبات أذونات macOS للشاشة والميكروفون والكلام والأتمتة وإمكانية الوصول.
- أدوات عقد محلية مثل Canvas والتقاط الكاميرا/الشاشة والإشعارات و`system.run`.
- مطالبات موافقة التنفيذ للأوامر المستضافة على Mac.
- أنفاق SSH في الوضع البعيد أو اتصالات Gateway المباشرة.

لا يستبدل التطبيق وثائق OpenClaw Gateway أو وثائق CLI العامة. توجد إعدادات
Gateway الأساسية والمزوّدون والـ plugins والقنوات والأدوات والأمان في
وثائقها الخاصة.

## صفحات تفاصيل macOS

| المهمة | اقرأ |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| تثبيت خدمة CLI/Gateway أو تصحيحها | [Gateway على macOS](/ar/platforms/mac/bundled-gateway) |
| إبقاء الحالة خارج المجلدات المتزامنة مع السحابة | [Gateway على macOS](/ar/platforms/mac/bundled-gateway#state-directory-on-macos) |
| تصحيح اكتشاف التطبيق والاتصال | [Gateway على macOS](/ar/platforms/mac/bundled-gateway#debug-app-connectivity) |
| فهم سلوك launchd | [دورة حياة Gateway](/ar/platforms/mac/child-process) |
| إصلاح الأذونات أو مشكلات التوقيع/TCC | [أذونات macOS](/ar/platforms/mac/permissions) |
| الاتصال بـ Gateway بعيد | [التحكم عن بُعد](/ar/platforms/mac/remote) |
| قراءة حالة شريط القوائم وفحوصات الصحة | [شريط القوائم](/ar/platforms/mac/menu-bar)، [فحوصات الصحة](/ar/platforms/mac/health) |
| استخدام واجهة الدردشة المضمنة | [WebChat](/ar/platforms/mac/webchat) |
| استخدام التنبيه الصوتي أو اضغط للتحدث | [التنبيه الصوتي](/ar/platforms/mac/voicewake) |
| استخدام Canvas والروابط العميقة لـ Canvas | [Canvas](/ar/platforms/mac/canvas) |
| استضافة PeekabooBridge لأتمتة الواجهة | [جسر Peekaboo](/ar/platforms/mac/peekaboo) |
| إعداد موافقات الأوامر | [موافقات التنفيذ](/ar/tools/exec-approvals)، [تفاصيل متقدمة](/ar/tools/exec-approvals-advanced) |
| فحص أوامر عقد Mac وIPC للتطبيق | [IPC في macOS](/ar/platforms/mac/xpc) |
| التقاط السجلات | [تسجيل macOS](/ar/platforms/mac/logging) |
| البناء من المصدر | [إعداد تطوير macOS](/ar/platforms/mac/dev-setup) |

## ذات صلة

- [المنصات](/ar/platforms)
- [بدء الاستخدام](/ar/start/getting-started)
- [Gateway](/ar/gateway)
- [موافقات التنفيذ](/ar/tools/exec-approvals)
