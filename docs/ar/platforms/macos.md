---
read_when:
    - تثبيت تطبيق macOS
    - تحديد الاختيار بين وضع Gateway المحلي والبعيد على macOS
    - البحث عن تنزيلات إصدار تطبيق macOS
summary: تثبيت واستخدام تطبيق OpenClaw لشريط قوائم macOS
title: تطبيق macOS
x-i18n:
    generated_at: "2026-06-28T00:14:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

تطبيق macOS هو **رفيق شريط القوائم** في OpenClaw. استخدمه عندما تريد
واجهة علبة نظام أصلية، أو مطالبات أذونات macOS، أو إشعارات، أو WebChat، أو إدخالًا صوتيًا،
أو Canvas، أو أدوات Node مستضافة على Mac مثل `system.run`.

إذا كنت تحتاج فقط إلى CLI وGateway، فابدأ بـ [بدء الاستخدام](/ar/start/getting-started).

## التنزيل

نزّل إصدارات تطبيق macOS من
[إصدارات OpenClaw على GitHub](https://github.com/openclaw/openclaw/releases).
عندما يتضمن الإصدار أصول تطبيق macOS، ابحث عن:

- `OpenClaw-<version>.dmg` (المفضل)
- `OpenClaw-<version>.zip`

تتضمن بعض الإصدارات أصول CLI أو أدلة إثبات أو Windows فقط. إذا لم يتضمن أحدث
إصدار أصل تطبيق macOS، فاستخدم أحدث إصدار يتضمنه، أو ابنِ التطبيق
من المصدر باستخدام [إعداد تطوير macOS](/ar/platforms/mac/dev-setup).

## التشغيل الأول

1. ثبّت **OpenClaw.app** وشغّله.
2. أكمل قائمة تحقق أذونات macOS.
3. اختر وضع **محلي** أو **بعيد**.
4. ثبّت CLI `openclaw` إذا طلب التطبيق ذلك.
5. افتح WebChat من شريط القوائم وأرسل رسالة اختبار.

لمسار إعداد CLI/Gateway، استخدم [بدء الاستخدام](/ar/start/getting-started).
لاسترداد الأذونات، استخدم [أذونات macOS](/ar/platforms/mac/permissions).

## اختيار وضع Gateway

| الوضع   | استخدمه عندما                                                                             | صفحة التفاصيل                                        |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| محلي  | يجب أن يشغّل هذا الـ Mac الـ Gateway وأن يبقيه قيد التشغيل باستخدام launchd.                         | [Gateway على macOS](/ar/platforms/mac/bundled-gateway) |
| بعيد | يشغّل مضيف آخر الـ Gateway، ويجب أن يتحكم به هذا الـ Mac عبر SSH أو LAN أو Tailnet. | [التحكم عن بُعد](/ar/platforms/mac/remote)            |

يتطلب الوضع المحلي تثبيت CLI `openclaw`. يمكن للتطبيق تثبيته، أو يمكنك
اتباع [Gateway على macOS](/ar/platforms/mac/bundled-gateway).

## ما يملكه التطبيق

- حالة شريط القوائم، والإشعارات، والصحة، وWebChat.
- مطالبات أذونات macOS للشاشة، والميكروفون، والكلام، والأتمتة، وإمكانية الوصول.
- أدوات Node المحلية مثل Canvas، والتقاط الكاميرا/الشاشة، والإشعارات، و`system.run`.
- مطالبات موافقة التنفيذ للأوامر المستضافة على Mac.
- أنفاق SSH في الوضع البعيد أو اتصالات Gateway المباشرة.

لا يستبدل التطبيق Gateway الخاص بـ OpenClaw أو وثائق CLI العامة. توجد إعدادات
Gateway الأساسية، والموفرون، وplugins، والقنوات، والأدوات، والأمان في
وثائقها الخاصة.

## صفحات تفاصيل macOS

| المهمة                                     | اقرأ                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| تثبيت خدمة CLI/Gateway أو تصحيحها | [Gateway على macOS](/ar/platforms/mac/bundled-gateway)                                          |
| إبقاء الحالة خارج المجلدات المتزامنة مع السحابة   | [Gateway على macOS](/ar/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| تصحيح اكتشاف التطبيق والاتصال     | [Gateway على macOS](/ar/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| فهم سلوك launchd              | [دورة حياة Gateway](/ar/platforms/mac/child-process)                                           |
| إصلاح الأذونات أو مشكلات التوقيع/TCC    | [أذونات macOS](/ar/platforms/mac/permissions)                                             |
| الاتصال بـ Gateway بعيد              | [التحكم عن بُعد](/ar/platforms/mac/remote)                                                     |
| قراءة حالة شريط القوائم وفحوصات الصحة   | [شريط القوائم](/ar/platforms/mac/menu-bar), [فحوصات الصحة](/ar/platforms/mac/health)                 |
| استخدام واجهة الدردشة المضمنة                 | [WebChat](/ar/platforms/mac/webchat)                                                           |
| استخدام التنبيه الصوتي أو اضغط للتحدث           | [التنبيه الصوتي](/ar/platforms/mac/voicewake)                                                      |
| استخدام Canvas وروابط Canvas العميقة         | [Canvas](/ar/platforms/mac/canvas)                                                             |
| استضافة PeekabooBridge لأتمتة واجهة المستخدم    | [جسر Peekaboo](/ar/platforms/mac/peekaboo)                                                  |
| تكوين موافقات الأوامر              | [موافقات التنفيذ](/ar/tools/exec-approvals), [تفاصيل متقدمة](/ar/tools/exec-approvals-advanced) |
| فحص أوامر Node على Mac وIPC التطبيق    | [IPC في macOS](/ar/platforms/mac/xpc)                                                             |
| التقاط السجلات                             | [تسجيل macOS](/ar/platforms/mac/logging)                                                     |
| البناء من المصدر                        | [إعداد تطوير macOS](/ar/platforms/mac/dev-setup)                                                 |

## ذو صلة

- [المنصات](/ar/platforms)
- [بدء الاستخدام](/ar/start/getting-started)
- [Gateway](/ar/gateway)
- [موافقات التنفيذ](/ar/tools/exec-approvals)
