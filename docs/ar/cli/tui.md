---
read_when:
    - تريد واجهة طرفية لـ Gateway (ملائمة للاستخدام عن بُعد)
    - تريد تمرير url/token/session من البرامج النصية
    - تريد تشغيل TUI في وضع محلي مدمج من دون Gateway
    - تريد استخدام `openclaw chat` أو `openclaw tui --local`
summary: مرجع CLI لـ `openclaw tui` (واجهة طرفية مدمجة محلية أو مدعومة بـ Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-24T07:36:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

افتح واجهة الطرفية المتصلة بـ Gateway، أو شغّلها في وضع
محلي مدمج.

ذو صلة:

- دليل TUI: [TUI](/ar/web/tui)

ملاحظات:

- `chat` و`terminal` هما اسمان مستعاران لـ `openclaw tui --local`.
- لا يمكن جمع `--local` مع `--url` أو `--token` أو `--password`.
- يقوم `tui` بحل SecretRefs الخاصة بمصادقة gateway والمهيأة لمصادقة الرمز/كلمة المرور عند الإمكان (المزوّدات `env`/`file`/`exec`).
- عند تشغيله من داخل دليل مساحة عمل وكيل مهيأ، يختار TUI ذلك الوكيل تلقائيًا كقيمة افتراضية لمفتاح الجلسة (ما لم يكن `--session` مضبوطًا صراحةً على `agent:<id>:...`).
- يستخدم الوضع المحلي وقت تشغيل الوكيل المدمج مباشرةً. تعمل معظم الأدوات المحلية، لكن ميزات Gateway فقط غير متاحة.
- يضيف الوضع المحلي الأمر `/auth [provider]` داخل سطح أوامر TUI.
- لا تزال بوابات موافقة Plugin تُطبق في الوضع المحلي. وتطلب الأدوات التي تتطلب موافقة قرارًا داخل الطرفية؛ ولا تتم أي موافقة تلقائية بصمت لأن Gateway غير مشارك.

## أمثلة

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# عند التشغيل داخل مساحة عمل وكيل، يستنتج ذلك الوكيل تلقائيًا
openclaw tui --session bugfix
```

## حلقة إصلاح الإعدادات

استخدم الوضع المحلي عندما تكون الإعدادات الحالية صالحة بالفعل وتريد من
الوكيل المدمج فحصها، ومقارنتها بالمستندات، والمساعدة في إصلاحها
من الطرفية نفسها:

إذا كان `openclaw config validate` يفشل بالفعل، فاستخدم `openclaw configure` أو
`openclaw doctor --fix` أولًا. لا يتجاوز `openclaw chat` حارس
الإعدادات غير الصالحة.

```bash
openclaw chat
```

ثم داخل TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

طبّق إصلاحات مستهدفة باستخدام `openclaw config set` أو `openclaw configure`، ثم
أعد تشغيل `openclaw config validate`. راجع [TUI](/ar/web/tui) و[الإعدادات](/ar/cli/config).

## ذو صلة

- [مرجع CLI](/ar/cli)
- [TUI](/ar/web/tui)
