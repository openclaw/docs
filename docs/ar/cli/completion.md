---
read_when:
    - تريد إكمالات الصدفة لـ zsh/bash/fish/PowerShell
    - تحتاج إلى تخزين نصوص الإكمال مؤقتًا ضمن حالة OpenClaw
summary: مرجع CLI للأمر `openclaw completion` (إنشاء/تثبيت نصوص الإكمال البرمجية للصدفة)
title: الإكمال
x-i18n:
    generated_at: "2026-07-12T05:39:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

أنشئ نصوص الإكمال التلقائي للصدفة، وخزّنها مؤقتًا ضمن حالة OpenClaw، وثبّتها اختياريًا في ملف تعريف الصدفة لديك.

## الاستخدام

```bash
openclaw completion                          # طباعة نص zsh إلى المخرج القياسي
openclaw completion --shell fish             # طباعة نص fish
openclaw completion --write-state            # تخزين النصوص مؤقتًا لجميع الصدفات
openclaw completion --write-state --install  # التخزين المؤقت ثم التثبيت في خطوة واحدة
openclaw completion --shell bash --write-state
```

## الخيارات

- `-s, --shell <shell>`: الصدفة المستهدفة (`zsh`، و`bash`، و`powershell`، و`fish`؛ الافتراضي: `zsh`)
- `-i, --install`: تثبيت الإكمال التلقائي بإضافة سطر تحميل للنص المخزّن مؤقتًا إلى ملف تعريف الصدفة
- `--write-state`: كتابة نص أو نصوص الإكمال التلقائي في `$OPENCLAW_STATE_DIR/completions` (الافتراضي `~/.openclaw/completions`) من دون طباعتها إلى المخرج القياسي؛ عند استخدام `--shell`، يكتب نص تلك الصدفة فقط، وإلا فيكتب نصوص الصدفات الأربع كلها
- `-y, --yes`: تخطي مطالبات تأكيد التثبيت (في الوضع غير التفاعلي)

## مسار التثبيت

يوجّه `--install` ملف تعريفك إلى النص المخزّن مؤقتًا، لذا يجب أن تكون ذاكرة التخزين المؤقت موجودة أولًا: إذا كانت مفقودة، يفشل الأمر ويطلب منك تشغيل `openclaw completion --write-state`. اجمع بين `--write-state --install` لتنفيذ العمليتين في خطوة واحدة. من دون `--shell`، يكتشف `--install` الصدفة من `$SHELL` (مع الرجوع إلى zsh عند تعذر ذلك).

يكتب التثبيت كتلة صغيرة باسم `# OpenClaw Completion` في ملف تعريف الصدفة، ويستبدل أي أسطر بطيئة أقدم من نوع `source <(openclaw completion ...)` بسطر تحميل النص المخزّن مؤقتًا:

| الصدفة     | ملف التعريف                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (يرجع إلى `~/.bash_profile` عند غياب `~/.bashrc`)                                                                                                                             |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (على Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`، أو `Documents/WindowsPowerShell/...` لـ Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## ملاحظات

- من دون `--install` أو `--write-state`، يطبع الأمر النص إلى المخرج القياسي.
- يحمّل إنشاء الإكمال التلقائي شجرة الأوامر الكاملة مسبقًا، بما في ذلك أوامر CLI الخاصة بالـ Plugin، ولذلك تُضمَّن الأوامر الفرعية المتداخلة.
- يحدّث `openclaw update` ذاكرة الإكمال التلقائي المؤقتة آليًا بعد نجاح التحديث؛ ويمكن لـ `openclaw doctor` إصلاح إعدادات الإكمال التلقائي المفقودة أو القديمة.

## ذو صلة

- [مرجع CLI](/ar/cli)
