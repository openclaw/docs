---
read_when:
    - تريد واجهة مستخدم طرفية لـ Gateway (ملائمة للاستخدام عن بُعد)
    - تريد تمرير عنوان URL/الرمز المميز/الجلسة من البرامج النصية
    - تريد تشغيل TUI في الوضع المحلي المضمّن من دون Gateway
    - تريد استخدام `openclaw chat` أو `openclaw tui --local`
summary: مرجع CLI لـ `openclaw tui` (واجهة مستخدم طرفية مدعومة من Gateway أو مضمّنة محليًا)
title: TUI
x-i18n:
    generated_at: "2026-07-12T05:44:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

افتح واجهة الطرفية المتصلة بـ Gateway، أو شغّلها في الوضع المحلي المضمّن.

الدليل ذو الصلة: [TUI](/ar/web/tui)

## الخيارات

| العلامة                      | القيمة الافتراضية                         | الوصف                                                                                         |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | التشغيل باستخدام بيئة تشغيل الوكيل المحلية المضمّنة بدلًا من Gateway.                        |
| `--url <url>`                | `gateway.remote.url` من الإعدادات          | عنوان URL لاتصال WebSocket الخاص بـ Gateway.                                                  |
| `--token <token>`            | (لا شيء)                                  | رمز Gateway المميز إذا كان مطلوبًا.                                                           |
| `--password <pass>`          | (لا شيء)                                  | كلمة مرور Gateway إذا كانت مطلوبة.                                                            |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | بصمة شهادة TLS المتوقعة لـ Gateway مثبت يستخدم `wss://`.                                      |
| `--session <key>`            | `main` (أو `global` عندما يكون النطاق عامًا) | مفتاح الجلسة. داخل مساحة عمل وكيل، يختار ذلك الوكيل تلقائيًا ما لم تُستخدم بادئة.             |
| `--deliver`                  | `false`                                   | تسليم ردود المساعد عبر القنوات المُعدّة.                                                      |
| `--thinking <level>`         | (القيمة الافتراضية للنموذج)               | تجاوز مستوى التفكير.                                                                         |
| `--message <text>`           | (لا شيء)                                  | إرسال رسالة أولية بعد الاتصال.                                                               |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | مهلة الوكيل. تسجّل القيم غير الصالحة تحذيرًا ويجري تجاهلها.                                   |
| `--history-limit <n>`        | `200`                                     | عدد إدخالات السجل المراد تحميلها عند الاتصال.                                                 |

الاسمان البديلان `openclaw chat` و`openclaw terminal` يستدعيان هذا الأمر مع تضمين
`--local` ضمنيًا.

## ملاحظات

- لا يمكن استخدام `--local` مع `--url` أو `--token` أو `--password` أو `--tls-fingerprint`.
- يحل `tui` مراجع الأسرار المُعدّة لمصادقة Gateway من أجل المصادقة بالرمز المميز أو كلمة المرور
  عندما يكون ذلك ممكنًا (موفرو `env` و`file` و`exec`).
- عند عدم تحديد عنوان URL أو منفذ صراحةً، يتبع `tui` منفذ Gateway المحلي النشط
  الذي سجّله Gateway قيد التشغيل. تحتفظ خيارات `--url` الصريحة و`OPENCLAW_GATEWAY_URL`
  و`OPENCLAW_GATEWAY_PORT` وإعدادات Gateway البعيد بالأولوية.
- عند تشغيل TUI من داخل دليل مساحة عمل وكيل مُعدّ، يختار ذلك الوكيل تلقائيًا
  باعتباره القيمة الافتراضية لمفتاح الجلسة (ما لم يُحدَّد `--session` صراحةً
  بالشكل `agent:<id>:...`).
- لإظهار اسم مضيف Gateway في التذييل للاتصالات غير المحلية المستندة إلى عنوان URL،
  شغّل `openclaw config set tui.footer.showRemoteHost true`. يكون هذا الخيار معطّلًا
  افتراضيًا، ولا يظهر مطلقًا لاتصالات local loopback أو الاتصالات المحلية المضمّنة.
- يستخدم الوضع المحلي بيئة تشغيل الوكيل المضمّنة مباشرةً. تعمل معظم الأدوات المحلية،
  لكن الميزات المتاحة حصريًا عبر Gateway لا تكون متاحة.
- يضيف الوضع المحلي `/auth [provider]` إلى مجموعة أوامر TUI.
- تظل بوابات موافقة Plugin سارية في الوضع المحلي: تطلب الأدوات التي تتطلب موافقة
  اتخاذ قرار في الطرفية، ولا تتم الموافقة التلقائية على أي شيء بصمت.
- تظهر [أهداف](/ar/tools/goal) الجلسة في التذييل، ويمكن إدارتها باستخدام
  `/goal`.

## أمثلة

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "قارن إعداداتي بالوثائق وأخبرني بما يجب إصلاحه"
# عند التشغيل داخل مساحة عمل وكيل، يستنتج ذلك الوكيل تلقائيًا
openclaw tui --session bugfix
```

## حلقة إصلاح الإعدادات

استخدم الوضع المحلي لتمكين الوكيل المضمّن من فحص الإعدادات الحالية ومقارنتها
بالوثائق والمساعدة في إصلاحها من الطرفية نفسها.

إذا كان `openclaw config validate` يفشل بالفعل، فشغّل `openclaw configure` أو
`openclaw doctor --fix` أولًا؛ لا يتجاوز `openclaw chat` حاجز
الإعدادات غير الصالحة.

```bash
openclaw chat
```

ثم من داخل TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

طبّق الإصلاحات المستهدفة باستخدام `openclaw config set` أو `openclaw configure`، ثم
أعد تشغيل `openclaw config validate`. راجع [TUI](/ar/web/tui) و
[الإعدادات](/ar/cli/config).

## ذو صلة

- [مرجع CLI](/ar/cli)
- [TUI](/ar/web/tui)
- [الهدف](/ar/tools/goal)
