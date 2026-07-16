---
read_when:
    - تريد إخراج مفاتيح API من openclaw.json ووضعها داخل 1Password
    - تشغّل Gateway بلا واجهة رسومية وتحتاج إلى مصادقة حساب خدمة لـ op
    - تريد أن تقرأ الوكلاء الأسرار أو تحقنها باستخدام op CLI
summary: حلّ أسرار Gateway باستخدام CLI ‏1Password، وأتِح للوكلاء استخدام Skill ‏1password المضمّنة
title: 1Password
x-i18n:
    generated_at: "2026-07-16T14:02:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

يتكامل OpenClaw مع **1Password** بطريقتين مستقلتين:

- **أسرار الإعداد:** يمكن لأي حقل [SecretRef](/ar/gateway/secrets) في `openclaw.json` أن يُحل عبر CLI الخاص بـ `op` في وقت التشغيل، بحيث لا تُخزَّن مفاتيح API مطلقًا في ملف الإعداد.
- **سير عمل الوكلاء:** تعلّم مهارة `1password` المضمّنة الوكلاء كيفية تسجيل الدخول وقراءة الأسرار أو حقنها باستخدام `op` لتنفيذ مهامهم الخاصة.

## المتطلبات

- تثبيت [CLI الخاص بـ 1Password](https://developer.1password.com/docs/cli/get-started/)‏ (`op`) على مضيف Gateway ‏(`brew install 1password-cli` على macOS).
- وضع مصادقة لـ `op`:
  - **حساب خدمة** (موصى به لبوابات Gateway غير المزودة بواجهة): صدّر `OP_SERVICE_ACCOUNT_TOKEN` في بيئة خدمة Gateway. لا حاجة إلى تطبيق سطح المكتب أو تسجيل دخول تفاعلي.
  - **التكامل مع تطبيق سطح المكتب**: يعمل تطبيق 1Password على الجهاز نفسه مع تمكين تكامل CLI. قد تؤدي الاستدعاءات الأولى إلى طلب Touch ID أو مصادقة النظام.
  - **تسجيل دخول مستقل**: يطلب `op signin` المصادقة في كل جلسة. وهو مناسب للوكلاء عبر المهارة، لكنه غير ملائم لحل أسرار الإعداد على Gateway غير مزود بواجهة.

## حل أسرار الإعداد باستخدام op

عرّف موفّر أسرار تنفيذيًا يشغّل `op read` باستخدام مرجع `op://vault/item/field`، ثم وجّه إليه أي حقل يدعم SecretRef:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // مطلوب للملفات التنفيذية المرتبطة رمزيًا التي يثبتها Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

كيفية ترابط الأجزاء:

- يجب أن يكون `command` مسارًا مطلقًا؛ ويحدّد `trustedDirs` دليله بوصفه موثوقًا، ويلزم `allowSymlinkCommand` لأن Homebrew يثبّت `op` كرابط رمزي.
- ينقل `args` مرجع `op://vault/item/field` حرفيًا. لا يحلّل OpenClaw مخطط `op://` بنفسه؛ بل يحلّه الملف التنفيذي `op`.
- يمرّر `passEnv` المتغيرات المدرجة من بيئة Gateway. يحتاج التكامل مع تطبيق سطح المكتب إلى `HOME`؛ وتحتاج حسابات الخدمة أيضًا إلى وجود `OP_SERVICE_ACCOUNT_TOKEN` في بيئة خدمة Gateway (أضفه إلى `passEnv`، أو عيّنه عبر `env` فقط إذا كنت تقبل أن يكون الرمز المميز قابلًا للقراءة في ملف الإعداد).
- للمخرجات ذات القيمة الواحدة، أبقِ `id: "value"`. وعند استخدام `jsonOnly: true` وحمولة JSON، حدّد الحقول بدلًا من ذلك بواسطة معرّف مؤشر JSON.
- يؤدي تخصيص إدخال موفّر واحد لكل سر إلى إبقاء المراجع قابلة للتدقيق؛ وسمِّ الموفّرين باسم الجهة التي تستهلكهم (`onepassword_openai`، `onepassword_telegram`).

راجع [أسرار Gateway](/ar/gateway/secrets) لمعرفة ترتيب الحل والتخزين المؤقت ودلالات الفشل، و[سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface) للاطلاع على كل حقل يقبل SecretRefs.

## إعداد حساب خدمة لبوابات Gateway غير المزودة بواجهة

1. أنشئ حساب خدمة في حسابك على 1Password وامنحه حق الوصول للقراءة فقط إلى عناصر الخزنة التي يحتاج إليها Gateway.
2. وفّر `OP_SERVICE_ACCOUNT_TOKEN` لخدمة Gateway (ملف plist الخاص بـ launchd أو وحدة systemd أو بيئة الحاوية).
3. أضف `"OP_SERVICE_ACCOUNT_TOKEN"` إلى قائمة `passEnv` الخاصة بالموفّر.
4. تحقّق من بيئة مضيف Gateway: ينبغي أن يطبع `op whoami` حساب الخدمة من دون مطالبة.

تتطلب عمليات القراءة عبر حساب الخدمة تسمية الخزنة صراحةً في مرجع `op://`. قيّد نطاق الحساب بإحكام؛ فهو بيانات اعتماد لحاملها.

## مهارة 1password للوكلاء

يتضمن OpenClaw مهارة `1password` التي تجعل الوكلاء مشغّلين أكفاء لـ `op`: فهي تكتشف وضع المصادقة المتاح (حساب خدمة أو تكامل تطبيق سطح المكتب أو تسجيل دخول مستقل)، وتتحقق من الوصول باستخدام `op whoami` قبل قراءة أي شيء، وتفضّل `op run` / `op inject` على كتابة قيم الأسرار إلى القرص. تتطلب المهارة الملف التنفيذي `op` وتعرض تثبيته عبر Homebrew عند فقدانه.

يستخدمها الوكلاء في سير عملهم الخاص، مثل قراءة رمز نشر في أثناء المهمة أو حقن متغيرات البيئة في أمر. وهي مستقلة عن حل أسرار الإعداد؛ إذ يحل Gateway مراجع SecretRef من دون تدخل أي مهارة.

## ملاحظات أمنية

- تبقى قيم الأسرار التي تُحل عبر الموفّرين التنفيذيين في ذاكرة Gateway؛ وتحجب لقطات الإعداد واستجابات `config.get` حقول SecretRef.
- لا تضع قيم الأسرار مطلقًا في `openclaw.json` أو السجلات أو المحادثة. احتفظ بأسماء العناصر في الإعداد، وبالقيم في 1Password.
- يعرض سجل تدقيق 1Password كل عملية قراءة يجريها حساب الخدمة، مما يجعل تدوير المفاتيح ومراجعة الحوادث أمرين عمليين.

## استكشاف الأخطاء وإصلاحها

- `command not found` أو أخطاء إنشاء العملية: استخدم المسار المطلق لـ `op` وأدرج دليله في `trustedDirs`.
- يُحل `op` ولكن تفشل عمليات القراءة بسبب أخطاء الروابط الرمزية: عيّن `allowSymlinkCommand: true` لتثبيتات Homebrew.
- `account is not signed in`: بالنسبة إلى حسابات الخدمة، تأكد من وصول `OP_SERVICE_ACCOUNT_TOKEN` إلى خدمة Gateway وإدراجه في `passEnv`؛ وبالنسبة إلى تكامل سطح المكتب، تأكد من أن التطبيق قيد التشغيل وغير مقفل.
- بطء عمليات القراءة الأولى: ارفع `timeoutMs` لدى الموفّر؛ إذ يمكن أن تتجاوز عمليات البدء البارد لـ `op` حدود المهلة الصارمة على المضيفين المشغولين.
