---
read_when:
    - تريد واجهة مستخدم طرفية لـ Gateway (مناسبة للاستخدام عن بُعد)
    - تريد تمرير url/token/session من السكربتات
    - تريد تشغيل TUI في وضع مضمّن محلي دون Gateway
    - تريد استخدام openclaw chat أو openclaw tui --local
summary: مرجع CLI لـ `openclaw tui` (واجهة مستخدم طرفية مدعومة من Gateway أو محلية مضمّنة)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:25:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

افتح واجهة الطرفية المتصلة بـ Gateway، أو شغّلها في وضع محلي مضمّن.

ذات صلة:

- دليل TUI: [TUI](/ar/web/tui)

## الخيارات

| العلم                  | الافتراضي                                   | الوصف                                                                        |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | التشغيل مقابل وقت تشغيل الوكيل المحلي المضمّن بدلًا من Gateway.                 |
| `--url <url>`         | `gateway.remote.url` من الإعدادات          | عنوان URL لـ Gateway WebSocket.                                                             |
| `--token <token>`     | (لا شيء)                                    | رمز Gateway إذا كان مطلوبًا.                                                         |
| `--password <pass>`   | (لا شيء)                                    | كلمة مرور Gateway إذا كانت مطلوبة.                                                      |
| `--session <key>`     | `main` (أو `global` عندما يكون النطاق عامًا) | مفتاح الجلسة. داخل مساحة عمل وكيل، يحدد ذلك الوكيل تلقائيًا ما لم تُستخدم بادئة. |
| `--deliver`           | `false`                                   | تسليم ردود المساعد عبر القنوات المضبوطة.                             |
| `--thinking <level>`  | (افتراضي النموذج)                           | تجاوز مستوى التفكير.                                                           |
| `--message <text>`    | (لا شيء)                                    | إرسال رسالة أولية بعد الاتصال.                                          |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | مهلة الوكيل. تسجل القيم غير الصالحة تحذيرًا ويتم تجاهلها.                       |
| `--history-limit <n>` | `200`                                     | إدخالات السجل المراد تحميلها عند الإرفاق.                                                 |

الأسماء المستعارة: يستدعي `openclaw chat` و`openclaw terminal` الأمر نفسه مع تضمين `--local` ضمنيًا.

ملاحظات:

- `chat` و`terminal` اسمان مستعاران لـ `openclaw tui --local`.
- لا يمكن دمج `--local` مع `--url` أو `--token` أو `--password`.
- يحل `tui` مراجع SecretRefs الخاصة بمصادقة Gateway المضبوطة لمصادقة الرمز/كلمة المرور عندما يكون ذلك ممكنًا (موفرو `env`/`file`/`exec`).
- عند التشغيل من داخل دليل مساحة عمل وكيل مضبوط، يحدد TUI ذلك الوكيل تلقائيًا كافتراضي لمفتاح الجلسة (ما لم يكن `--session` صريحًا بصيغة `agent:<id>:...`).
- لإظهار اسم مضيف Gateway في التذييل للاتصالات غير المحلية المدعومة بعنوان URL، شغّل `openclaw config set tui.footer.showRemoteHost true`. يكون وسم المضيف معطلًا افتراضيًا ولا يظهر أبدًا لاتصالات loopback أو الاتصالات المحلية المضمّنة.
- يستخدم الوضع المحلي وقت تشغيل الوكيل المضمّن مباشرة. تعمل معظم الأدوات المحلية، لكن ميزات Gateway فقط غير متاحة.
- يضيف الوضع المحلي `/auth [provider]` داخل سطح أوامر TUI.
- تظل بوابات موافقة Plugin مطبقة في الوضع المحلي. الأدوات التي تتطلب موافقة تطلب قرارًا في الطرفية؛ لا تتم الموافقة على أي شيء تلقائيًا بصمت لأن Gateway غير مشارك.
- تظهر [أهداف](/ar/tools/goal) الجلسة في التذييل ويمكن إدارتها باستخدام `/goal`.

## أمثلة

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## حلقة إصلاح الإعدادات

استخدم الوضع المحلي عندما تكون الإعدادات الحالية صالحة بالفعل وتريد من
الوكيل المضمّن فحصها ومقارنتها بالوثائق والمساعدة في إصلاحها
من الطرفية نفسها:

إذا كان `openclaw config validate` يفشل بالفعل، فاستخدم `openclaw configure` أو
`openclaw doctor --fix` أولًا. لا يتجاوز `openclaw chat` حارس الإعدادات
غير الصالحة.

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

## ذات صلة

- [مرجع CLI](/ar/cli)
- [TUI](/ar/web/tui)
- [الهدف](/ar/tools/goal)
