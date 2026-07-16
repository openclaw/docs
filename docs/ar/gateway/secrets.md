---
read_when:
    - تكوين SecretRefs لبيانات اعتماد المزوّد ومراجع `auth-profiles.json`
    - إعادة تحميل الأسرار وتدقيقها وتهيئتها وتطبيقها بأمان في بيئة الإنتاج
    - فهم الإخفاق السريع عند بدء التشغيل، وتصفية الأسطح غير النشطة، وسلوك آخر حالة سليمة معروفة
sidebarTitle: Secrets management
summary: 'إدارة الأسرار: عقد SecretRef، وسلوك اللقطة الآنية وقت التشغيل، والتنقية الآمنة أحادية الاتجاه'
title: إدارة الأسرار
x-i18n:
    generated_at: "2026-07-16T14:07:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

يدعم OpenClaw مراجع SecretRefs الإضافية، بحيث لا يلزم تخزين بيانات الاعتماد المدعومة كنص صريح في الإعدادات.

<Note>
يظل النص الصريح مدعومًا. تُفعَّل SecretRefs اختياريًا لكل بيان اعتماد.
</Note>

<Warning>
تظل بيانات الاعتماد النصية الصريحة قابلة للقراءة بواسطة الوكيل إذا كانت موجودة في ملفات يستطيع الوكيل فحصها، بما في ذلك `openclaw.json` أو `auth-profiles.json` أو `.env` أو ملفات `agents/*/agent/models.json` المُنشأة. لا تقلل SecretRefs نطاق التأثير المحلي هذا إلا بعد ترحيل كل بيان اعتماد مدعوم وإبلاغ `openclaw secrets audit --check` بعدم وجود أي بقايا نصية صريحة.
</Warning>

## نموذج وقت التشغيل

- تُحل الأسرار إلى لقطة وقت تشغيل داخل الذاكرة، بشكل استباقي أثناء التنشيط، وليس بشكل كسول في مسارات الطلبات.
- يفشل بدء التشغيل سريعًا عندما يتعذر حل SecretRef نشط فعليًا.
- إعادة التحميل تبديل ذري: إما نجاح كامل، وإما الاحتفاظ بآخر لقطة سليمة معروفة.
- تؤدي انتهاكات السياسة (مثل دمج ملف تعريف مصادقة يعمل بوضع OAuth مع إدخال SecretRef) إلى فشل التنشيط قبل تبديل لقطة وقت التشغيل.
- لا تقرأ طلبات وقت التشغيل إلا اللقطة النشطة داخل الذاكرة. تمر بيانات اعتماد SecretRef الخاصة بموفّر النموذج عبر تخزين المصادقة وخيارات البث في صورة علامات حارسة محلية للعملية حتى الخروج. كما تقرأ مسارات التسليم الصادر (تسليم الردود/سلاسل المحادثات في Discord وعمليات إرسال الإجراءات في Telegram) تلك اللقطة، ولا تعيد حل المراجع عند كل إرسال.

يُبقي هذا انقطاعات موفّري الأسرار خارج مسارات الطلبات الحساسة للأداء.

## الحقن عند الخروج (العلامات الحارسة)

بالنسبة إلى بيانات اعتماد موفّري النماذج المدعومة بواسطة SecretRefs، ينشئ OpenClaw علامة حارسة مبهمة ومحلية للعملية أثناء حل مصادقة النموذج. لذلك ترى عمليات تخزين المصادقة وخيارات البث وإعدادات SDK والسجلات وكائنات الأخطاء ومعظم عمليات فحص وقت التشغيل قيمة مثل `oc-sent-v1-...`، لا بيانات اعتماد الموفّر. يستبدل جلب النموذج المحمي وفحوصات سلامة الموفّر المحلي المُدار العلامات الحارسة المعروفة في قيم عناوين URL والترويسات مباشرة قبل مغادرة كل طلب للعملية.

تُرفض القيم غير المعروفة التي تتخذ شكل علامة حارسة قبل حدوث أي نشاط شبكي. يرفض OpenClaw إرسال الطلب بدلًا من تمرير علامة حارسة غير محلولة إلى موفّر. كما تُسجَّل قيم الأسرار المحلولة لحجبها في السجلات عند التطابق التام، بوصف ذلك إجراءً دفاعيًا متعدد الطبقات.

تستخدم محوّلات الموفّرين أحدث نقطة حقن تدعمها حزمة SDK الخاصة بها:

- تتلقى حزم SDK التي توفر خيار جلب مخصص عملية الجلب المحمية من OpenClaw، ولذلك تحتفظ حزمة SDK بالعلامة الحارسة.
- تفك حزم SDK التي لا توفر خيار جلب مخصص العلامة الحارسة مباشرة قبل إنشاء العميل. وتفك تدفقات الموفّرين المملوكة لـ Plugin وأطر تشغيل الوكلاء العلامة عند نقطة التسليم النهائية المملوكة للنواة، لأن وسائل النقل هذه لا تشارك عملية الجلب المحمية الخاصة بـ OpenClaw.

تقلل العلامات الحارسة انكشاف النص الصريح عبر سلسلة استدعاء النموذج، لكنها لا توفر عزلًا للعملية. تظل القيمة الحقيقية موجودة في ذاكرة العملية نفسها، وتظهر عند حد المحوّل النهائي. وتظل بيانات اعتماد البيئة النصية الصريحة التي لم تُضبط عبر SecretRefs نصًا صريحًا وخارج هذه الآلية.

عيّن `OPENCLAW_SECRET_SENTINELS=off` (ويقبل أيضًا `0` أو `false`، دون حساسية لحالة الأحرف) لتعطيل إنشاء العلامات الحارسة أثناء الاستجابة للحوادث أو استكشاف مشكلات التوافق وإصلاحها. لا يعطّل مفتاح الإيقاف تسجيل الحجب عند التطابق التام للقيم.

## حدود وصول الوكيل

تمنع SecretRefs حفظ بيانات الاعتماد بشكل دائم في الإعدادات وملفات النماذج المُنشأة، لكنها لا تمثل حدًا لعزل العملية. يظل بيان الاعتماد النصي الصريح المتروك على القرص ضمن مسار يستطيع الوكيل قراءته قابلًا للقراءة عبر أدوات الملفات أو الصدفة، متجاوزًا الحجب على مستوى API.

بالنسبة إلى عمليات النشر الإنتاجية التي تدخل فيها الملفات القابلة للوصول بواسطة الوكيل ضمن النطاق، لا يُعد الترحيل مكتملًا إلا عند تحقق كل ما يأتي:

- تستخدم بيانات الاعتماد المدعومة SecretRefs بدلًا من القيم النصية الصريحة.
- تُزال بقايا النص الصريح القديمة من `openclaw.json` و`auth-profiles.json` و`.env` وملفات `models.json` المُنشأة.
- يكون `openclaw secrets audit --check` خاليًا من المشكلات بعد الترحيل.
- تُحمى أي بيانات اعتماد متبقية غير مدعومة أو دورية التغيير بواسطة عزل نظام التشغيل أو عزل الحاويات أو وكيل خارجي لبيانات الاعتماد.

لهذا السبب يُعد سير عمل التدقيق/الضبط/التطبيق بوابة ترحيل أمنية، وليس مجرد أداة مساعدة للراحة.

<Warning>
لا تجعل SecretRefs الملفات العشوائية القابلة للقراءة آمنة. تظل النسخ الاحتياطية والإعدادات المنسوخة وكتالوجات النماذج القديمة المُنشأة وفئات بيانات الاعتماد غير المدعومة أسرارًا إنتاجية إلى أن تُحذف أو تُنقل خارج حدود ثقة الوكيل أو تُعزل بشكل منفصل.
</Warning>

## تصفية الأسطح النشطة

لا تُتحقق صلاحية SecretRefs إلا على الأسطح النشطة فعليًا:

- **الأسطح المفعّلة**: تمنع المراجع غير المحلولة بدء التشغيل/إعادة التحميل.
- **الأسطح غير النشطة**: لا تمنع المراجع غير المحلولة بدء التشغيل/إعادة التحميل؛ بل تصدر تشخيص `SECRETS_REF_IGNORED_INACTIVE_SURFACE` غير فادح.

<Accordion title="أمثلة على الأسطح غير النشطة">
- إدخالات القنوات/الحسابات المعطّلة.
- بيانات اعتماد القناة ذات المستوى الأعلى التي لا يرثها أي حساب مفعّل.
- أسطح الأدوات/الميزات المعطّلة.
- المفاتيح الخاصة بموفّري بحث الويب الذين لم يحددهم `tools.web.search.provider`. في الوضع التلقائي (عندما لا يكون الموفّر معينًا)، تُفحص المفاتيح وفق ترتيب الأولوية للاكتشاف التلقائي حتى يُحل أحدها؛ وبعد الاختيار، تصبح مفاتيح الموفّرين غير المحددين غير نشطة.
- تكون مواد مصادقة SSH لصندوق العزل (`agents.defaults.sandbox.ssh.identityData` و`certificateData` و`knownHostsData`، إضافة إلى التجاوزات الخاصة بكل وكيل) نشطة فقط عندما تكون الواجهة الخلفية الفعلية لصندوق العزل هي `ssh` ولا يكون وضع صندوق العزل هو `off`، وذلك للوكيل الافتراضي أو لوكيل مفعّل.
- تكون SecretRefs الخاصة بـ `gateway.remote.token` / `gateway.remote.password` نشطة إذا تحقق أي مما يأتي:
  - `gateway.mode=remote`
  - يكون `gateway.remote.url` مضبوطًا
  - يكون `gateway.tailscale.mode` هو `serve` أو `funnel`
  - في الوضع المحلي من دون تلك الأسطح البعيدة: يكون `gateway.remote.token` نشطًا عندما يمكن لمصادقة الرمز أن تكون الغالبة ولا يكون أي رمز بيئة/مصادقة مضبوطًا؛ ولا يكون `gateway.remote.password` نشطًا إلا عندما يمكن لمصادقة كلمة المرور أن تكون الغالبة ولا تكون أي كلمة مرور بيئة/مصادقة مضبوطة.
- يكون SecretRef الخاص بـ `gateway.auth.token` غير نشط لحل مصادقة بدء التشغيل عندما يكون `OPENCLAW_GATEWAY_TOKEN` معينًا، لأن إدخال رمز البيئة تكون له الغلبة في وقت التشغيل ذاك.

</Accordion>

## تشخيصات سطح مصادقة Gateway

عند تعيين SecretRef على `gateway.auth.token` أو `gateway.auth.password` أو `gateway.remote.token` أو `gateway.remote.password`، يسجل بدء تشغيل Gateway/إعادة تحميله حالة السطح تحت الرمز `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: يشكل SecretRef جزءًا من سطح المصادقة الفعلي ويجب حله.
- `inactive`: تكون الغلبة لسطح مصادقة آخر، أو تكون المصادقة البعيدة معطّلة/غير نشطة.

يتضمن إدخال السجل السبب الذي استخدمته سياسة السطح النشط.

## الفحص المسبق لمراجع الإعداد الأولي

في الإعداد الأولي التفاعلي، يؤدي اختيار تخزين SecretRef إلى تشغيل تحقق مسبق قبل الحفظ:

- مراجع البيئة: تتحقق من اسم متغير البيئة وتؤكد ظهور قيمة غير فارغة أثناء الإعداد.
- مراجع الموفّر (`file` أو `exec`): تتحقق من اختيار الموفّر، وتحل `id`، وتفحص نوع القيمة المحلولة.
- مسار البدء السريع: عندما يكون `gateway.auth.token` بالفعل SecretRef، يحله الإعداد الأولي قبل تشغيل المسبار/لوحة المعلومات (بالنسبة إلى مراجع `env` و`file` و`exec`) باستخدام بوابة الفشل السريع نفسها.

يُظهر فشل التحقق الخطأ ويتيح إعادة المحاولة.

## عقد SecretRef

شكل كائن واحد في كل المواضع:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    تُقبل أيضًا السلاسل المختصرة في حقول SecretInput:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    التحقق:

    - يجب أن يطابق `provider` القيمة `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يطابق `id` القيمة `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    التحقق:

    - يجب أن يطابق `provider` القيمة `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يكون `id` مؤشر JSON مطلقًا (`/...`) أو القيمة الحرفية `value` لموفّري `singleValue`
    - تهريب RFC 6901 في المقاطع: يصبح `~` هو `~0`، ويصبح `/` هو `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    التحقق:

    - يجب أن يطابق `provider` القيمة `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يطابق `id` القيمة `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (يدعم محددات مثل `secret#json_key`)
    - يجب ألا يحتوي `id` على `.` أو `..` بوصفهما مقطعي مسار محددين بشرطات مائلة (على سبيل المثال، يُرفض `a/../b`)

  </Tab>
</Tabs>

## إعداد الموفّر

عرّف الموفّرين ضمن `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // أو "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<Accordion title="موفّر البيئة">
- قائمة سماح اختيارية للأسماء المطابقة تمامًا عبر `allowlist`.
- يؤدي غياب قيم البيئة أو فراغها إلى فشل الحل.

</Accordion>

<Accordion title="موفّر الملفات">
- يقرأ الملف المحلي في `path`.
- يتوقع `mode: "json"` (الافتراضي) حمولة كائن JSON ويحل `id` بوصفه مؤشر JSON.
- يتوقع `mode: "singleValue"` معرّف المرجع `"value"` ويعيد محتويات الملف الخام (مع إزالة السطر الجديد اللاحق).
- يجب أن يجتاز المسار فحوصات الملكية/الأذونات؛ ويحد `timeoutMs` (القيمة الافتراضية 5000) و`maxBytes` (القيمة الافتراضية 1 MiB) من القراءة.
- الإغلاق الآمن في Windows: إذا تعذر التحقق من ACL للمسار، يفشل الحل. بالنسبة إلى المسارات الموثوقة فقط، عيّن `allowInsecurePath: true` على ذلك الموفّر لتجاوز الفحص.

</Accordion>

<Accordion title="موفّر التنفيذ">
- يشغّل مسار الملف التنفيذي المطلق المُعدّ مباشرةً، من دون shell.
- افتراضيًا، يجب أن يكون `command` ملفًا عاديًا، وليس رابطًا رمزيًا. اضبط `allowSymlinkCommand: true` للسماح بمسارات الأوامر ذات الروابط الرمزية (مثل واجهات Homebrew الوسيطة)، واقرنه بـ `trustedDirs` (مثل `["/opt/homebrew"]`) بحيث لا تتأهل إلا مسارات مدير الحزم.
- يدعم `timeoutMs` (القيمة الافتراضية 5000)، و`noOutputTimeoutMs` (القيمة الافتراضية تساوي `timeoutMs`)، و`maxOutputBytes` (القيمة الافتراضية 1 MiB)، وقائمة السماح `env`/`passEnv`، و`trustedDirs`.
- تكون القيمة الافتراضية لـ `jsonOnly` هي `true`. عند استخدام `jsonOnly: false` وطلب معرّف واحد، يُقبل الخرج النصي العادي غير المنسّق بصيغة JSON من stdout بوصفه قيمة ذلك المعرّف.
- إغلاق آمن عند الفشل على Windows: إذا تعذّر التحقق من ACL لمسار الأمر، يفشل الحل. للمسارات الموثوقة فقط، اضبط `allowInsecurePath: true` على ذلك الموفّر لتجاوز الفحص.
- يمكن لموفّري التنفيذ الذين تديرهم Plugin استخدام `pluginIntegration` بدلًا من `command`/`args` منسوخَين. يحلّ OpenClaw تفاصيل الأمر الحالية من بيان Plugin المثبّت أثناء بدء التشغيل/إعادة التحميل؛ وإذا كانت Plugin معطّلة أو محذوفة أو غير موثوقة أو لم تعد تعلن عن التكامل، تفشل مراجع SecretRef النشطة لدى ذلك الموفّر بإغلاق آمن.

حمولة الطلب (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

حمولة الاستجابة (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

أخطاء اختيارية لكل معرّف:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

يمثّل `code` تشخيصًا اختياريًا قابلًا للقراءة آليًا. يعرض OpenClaw
الرمزين المعروفين `NOT_FOUND` و`AMBIGUOUS_DUPLICATE_KEY` مع الموفّر ومعرّف المرجع. تُقبل الرموز
الأخرى والحقول حرة التنسيق مثل `message` للتوافق مع الإصدار الأول من البروتوكول،
لكنها لا تُعرض لأن خرج أداة الحل قد يحتوي على مواد اعتماد.

</Accordion>

## مفاتيح API المدعومة بملفات

لا تضع سلاسل `file:...` في كتلة `env` ضمن الإعداد. هذه الكتلة حرفية ولا تتجاوز القيم، لذلك لا يُحلّ `file:...` فيها مطلقًا.

استخدم بدلًا من ذلك SecretRef لملف في حقل بيانات اعتماد مدعوم:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

بالنسبة إلى `mode: "singleValue"`، يكون `id` الخاص بـ SecretRef هو `"value"`. وبالنسبة إلى `mode: "json"`، استخدم مؤشر JSON مطلقًا مثل `"/providers/xai/apiKey"`.

راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface) لمعرفة الحقول التي تقبل مراجع SecretRef.

## أمثلة على تكامل التنفيذ

للحصول على دليل مخصص لـ 1Password يغطي حسابات الخدمة وSkills الوكيل المضمّنة واستكشاف الأخطاء وإصلاحها، راجع [1Password](/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI لـ 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // مطلوب للملفات التنفيذية المرتبطة رمزيًا بواسطة Homebrew
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
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager ‏(`bws`)">
    استخدم غلاف أداة حل لربط معرّفات SecretRef بمفاتيح عناصر Bitwarden Secrets Manager. يتضمن المستودع `scripts/secrets/openclaw-bws-resolver.mjs`؛ ثبّته أو انسخه إلى مسار مطلق موثوق على المضيف الذي يشغّل Gateway.

    المتطلبات:

    - تثبيت CLI لـ Bitwarden Secrets Manager ‏(`bws`) على مضيف Gateway.
    - إتاحة `BWS_ACCESS_TOKEN` لخدمة Gateway.
    - تمرير `PATH` إلى أداة الحل، أو ضبط `BWS_BIN` على المسار المطلق لملف `bws` التنفيذي.
    - ضبط `BWS_SERVER_URL` في البيئة عند استخدام مثيل Bitwarden مستضاف ذاتيًا.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    تجمع أداة الحل معرّفات الطلبات في دفعات، وتشغّل `bws secret list`، وتعيد قيم حقول `key` السرية المطابقة. استخدم مفاتيح تستوفي عقد معرّف SecretRef للتنفيذ، مثل `openclaw/providers/openai/apiKey`؛ أما المفاتيح بنمط متغيرات البيئة التي تحتوي على شرطات سفلية فتُرفض قبل تشغيل أداة الحل. إذا اشترك أكثر من سر ظاهر في Bitwarden في المفتاح المطلوب، تفشل أداة الحل لذلك المعرّف لكونه ملتبسًا بدلًا من التخمين. بعد تحديث الإعداد، تحقق من مسار أداة الحل:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="CLI لـ HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // مطلوب للملفات التنفيذية المرتبطة رمزيًا بواسطة Homebrew
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store ‏(`pass`)">
    استخدم غلاف أداة حل صغيرًا لربط معرّفات SecretRef مباشرةً بإدخالات `pass`. احفظه كملف تنفيذي في مسار مطلق يجتاز فحوصات مسار موفّر التنفيذ لديك، مثل `/usr/local/bin/openclaw-pass-resolver`. يحلّ سطر التوجيه `#!/usr/bin/env node` الملف `node` من `PATH` الخاص بعملية أداة الحل، لذا ضمّن `PATH` في `passEnv`. إذا لم يكن `pass` موجودًا في `PATH` ذاك، فاضبط `PASS_BIN` في البيئة الأصلية وضمّنه أيضًا في `passEnv`:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`تعذّر تحليل الطلب: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `خرج pass بالحالة ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    ثم أعدّ موفّر التنفيذ ووجّه `apiKey` إلى مسار إدخال `pass`:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    احتفظ بالسر في السطر الأول من إدخال `pass`، أو خصّص الغلاف لإعادة خرج `pass show` كاملًا بدلًا من ذلك. بعد تحديث الإعداد، تحقق من كل من التدقيق الثابت ومسار أداة حل التنفيذ:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // مطلوب للملفات التنفيذية المرتبطة رمزيًا بواسطة Homebrew
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## متغيرات بيئة خادم MCP

تقبل متغيرات بيئة خادم MCP المُعدّة عبر `plugins.entries.acpx.config.mcpServers` النوع SecretInput، مما يُبقي مفاتيح API والرموز المميزة خارج الإعداد ذي النص الصريح:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

تظل القيم النصية الصريحة صالحة. تُحلّ مراجع قوالب البيئة مثل `${MCP_SERVER_API_KEY}` وكائنات SecretRef أثناء تنشيط Gateway، قبل إنشاء عملية خادم MCP. وكما هو الحال مع أسطح SecretRef الأخرى، لا تمنع المراجع غير المحلولة التنشيط إلا عندما تكون Plugin ‏`acpx` نشطة فعليًا.

## مواد مصادقة SSH لصندوق العزل

يدعم أيضًا برنامج الواجهة الخلفية الأساسي لصندوق العزل `ssh` مراجع SecretRef لمواد مصادقة SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

سلوك وقت التشغيل:

- يحل OpenClaw هذه المراجع أثناء تفعيل بيئة العزل، وليس بصورة كسولة عند كل استدعاء SSH.
- تُكتب القيم المحلولة في دليل مؤقت بأذونات ملفات مقيّدة (`0o600`)، وتُستخدم في إعداد SSH المُنشأ.
- إذا لم تكن الواجهة الخلفية الفعلية لبيئة العزل هي `ssh` (أو كان وضع بيئة العزل هو `off`)، فتبقى هذه المراجع غير نشطة ولا تعوق بدء التشغيل.

## نطاق بيانات الاعتماد المدعوم

ترد بيانات الاعتماد الأساسية المدعومة وغير المدعومة في [نطاق بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).

<Note>
تُستثنى عمدًا بيانات الاعتماد المُنشأة في وقت التشغيل أو المتغيرة، ومواد تحديث OAuth، من تحليل SecretRef للقراءة فقط.
</Note>

## السلوك المطلوب والأسبقية

- الحقل من دون مرجع: لا يتغير.
- الحقل المزود بمرجع: مطلوب على الأسطح النشطة أثناء التفعيل.
- إذا وُجد كل من النص الصريح والمرجع، تكون الأسبقية للمرجع في مسارات الأسبقية المدعومة.
- القيمة الحارسة للتنقيح `__OPENCLAW_REDACTED__` محجوزة للتنقيح والاستعادة الداخليين للإعداد، وتُرفض إذا أُرسلت بوصفها بيانات إعداد حرفية.

إشارات التحذير والتدقيق:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (تحذير وقت التشغيل)
- `REF_SHADOWED` (نتيجة تدقيق عندما تكون لبيانات اعتماد `auth-profiles.json` الأسبقية على مراجع `openclaw.json`)

توافق Google Chat: تكون الأسبقية لـ `serviceAccountRef` على `serviceAccount` ذي النص الصريح؛ وتُتجاهل قيمة النص الصريح بمجرد تعيين المرجع الشقيق.

## مشغلات التفعيل

يُنفّذ تفعيل الأسرار عند:

- بدء التشغيل (الفحص المسبق ثم التفعيل النهائي)
- مسار التطبيق الفوري لإعادة تحميل الإعداد
- مسار التحقق من إعادة التشغيل عند إعادة تحميل الإعداد
- إعادة التحميل اليدوية عبر `secrets.reload`
- الفحص المسبق لاستدعاء RPC لكتابة إعداد Gateway (`config.set` / `config.apply` / `config.patch`)؛ إذ يتحقق من قابلية حل SecretRef على الأسطح النشطة ضمن حمولة الإعداد المُرسلة قبل حفظ التعديلات

عقد التفعيل:

- يستبدل النجاح اللقطة ذريًا.
- يؤدي فشل بدء التشغيل إلى إلغاء بدء تشغيل Gateway.
- يُبقي فشل إعادة التحميل في وقت التشغيل آخر لقطة سليمة معروفة.
- يرفض فشل الفحص المسبق لاستدعاء RPC الخاص بالكتابة الإعداد المُرسل؛ ويظل كل من إعداد القرص ولقطة وقت التشغيل النشطة من دون تغيير.
- لا يؤدي توفير رمز قناة صريح لكل استدعاء إلى دالة مساعدة أو أداة صادرة إلى تشغيل تفعيل SecretRef؛ وتظل نقاط التفعيل هي بدء التشغيل، وإعادة التحميل، و`secrets.reload` الصريح.

## إشارات التدهور والتعافي

عند فشل التفعيل في وقت إعادة التحميل بعد حالة سليمة، يدخل OpenClaw حالة أسرار متدهورة، ويصدر أحداث نظام لمرة واحدة ورموز سجل:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

السلوك:

- متدهور: يحتفظ وقت التشغيل بآخر لقطة سليمة معروفة.
- متعافٍ: يُصدر مرة واحدة بعد التفعيل الناجح التالي.
- تُسجّل حالات الفشل المتكررة أثناء وجود حالة التدهور بالفعل تحذيرات، لكنها لا تعيد إصدار الحدث.
- لا يصدر الإخفاق السريع عند بدء التشغيل حدث تدهور أبدًا، لأن وقت التشغيل لم يصبح نشطًا أصلًا.

## حل مسارات الأوامر

يمكن لمسارات الأوامر الاشتراك في حل SecretRef المدعوم عبر استدعاء RPC للقطة Gateway. وينطبق سلوكان عامان:

<Tabs>
  <Tab title="مسارات الأوامر الصارمة">
    على سبيل المثال، مسارات الذاكرة البعيدة `openclaw memory` و`openclaw qr --remote` عندما تحتاج إلى مراجع أسرار مشتركة بعيدة. تقرأ هذه المسارات من اللقطة النشطة وتُخفق سريعًا عندما لا يتوفر SecretRef مطلوب.
  </Tab>
  <Tab title="مسارات أوامر القراءة فقط">
    على سبيل المثال، `openclaw status`، و`openclaw status --all`، و`openclaw channels status`، و`openclaw channels resolve`، و`openclaw security audit`، وتدفقات إصلاح الطبيب/الإعداد المخصصة للقراءة فقط. وهي تفضّل أيضًا اللقطة النشطة، لكنها تتدهور بدلًا من الإلغاء عندما لا يتوفر SecretRef مستهدف.

    سلوك القراءة فقط:

    - عندما يكون Gateway قيد التشغيل، تقرأ هذه الأوامر من اللقطة النشطة أولًا.
    - إذا كان حل Gateway غير مكتمل أو لم يكن Gateway متاحًا، فإنها تحاول إجراء تراجع محلي مستهدف لسطح الأمر ذاك.
    - إذا ظل SecretRef المستهدف غير متاح، يستمر الأمر بمخرجات قراءة فقط متدهورة وتشخيص صريح يفيد بأن المرجع مُعدّ لكنه غير متاح في مسار الأمر هذا.
    - يقتصر هذا السلوك المتدهور على الأمر محليًا؛ ولا يُضعف مسارات بدء التشغيل أو إعادة التحميل أو الإرسال/المصادقة في وقت التشغيل.

  </Tab>
</Tabs>

ملاحظات أخرى:

- تتولى `openclaw secrets reload` تحديث اللقطة بعد تدوير سر الواجهة الخلفية.
- طريقة RPC في Gateway التي تستخدمها مسارات الأوامر هذه: `secrets.resolve`.

## سير عمل التدقيق والإعداد

التدفق الافتراضي للمشغّل:

<Steps>
  <Step title="تدقيق الحالة الحالية">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="إعداد SecretRefs وتطبيقها">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="إعادة التدقيق">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

لا تعتبر الترحيل مكتملًا حتى تكون إعادة التدقيق نظيفة. إذا ظل التدقيق يبلغ عن قيم نص صريح مخزّنة، فستظل مخاطر وصول الوكيل قائمة حتى عندما تعيد واجهات برمجة تطبيقات وقت التشغيل قيمًا منقّحة.

إذا حفظت خطة بدلًا من تطبيقها أثناء `configure`، فطبّق تلك الخطة المحفوظة باستخدام `openclaw secrets apply --from <plan-path>` قبل إعادة التدقيق.

<AccordionGroup>
  <Accordion title="تدقيق الأسرار">
    تتضمن النتائج:

    - قيم النص الصريح المخزّنة (`openclaw.json`، و`auth-profiles.json`، و`.env`، و`agents/*/agent/models.json` المُنشأ).
    - بقايا ترويسات المزوّد الحساسة ذات النص الصريح في إدخالات `models.json` المُنشأة.
    - المراجع غير المحلولة.
    - حجب الأسبقية (تكون لـ `auth-profiles.json` الأولوية على مراجع `openclaw.json`).
    - البقايا القديمة (`auth.json`، وتذكيرات OAuth).

    ملاحظة التنفيذ: يتجاوز التدقيق افتراضيًا عمليات التحقق من قابلية حل SecretRef الخاصة بالتنفيذ لتجنب الآثار الجانبية للأوامر. استخدم `openclaw secrets audit --allow-exec` لتنفيذ مزوّدي التنفيذ أثناء التدقيق.

    ملاحظة بقايا الترويسات: يعتمد اكتشاف ترويسات المزوّد الحساسة على استدلال أسماء الترويسات (أسماء وأجزاء ترويسات المصادقة/بيانات الاعتماد الشائعة مثل `authorization`، و`x-api-key`، و`token`، و`secret`، و`password`، و`credential`).

  </Accordion>
  <Accordion title="إعداد الأسرار">
    أداة مساعدة تفاعلية تقوم بما يلي:

    - تُعدّ `secrets.providers` أولًا (`env`/`file`/`exec`، إضافة/تحرير/إزالة).
    - تتيح تحديد الحقول المدعومة الحاملة للأسرار في `openclaw.json` بالإضافة إلى `auth-profiles.json` لنطاق وكيل واحد.
    - يمكنها إنشاء تعيين `auth-profiles.json` جديد مباشرةً في منتقي الهدف.
    - تلتقط تفاصيل SecretRef (`source`، و`provider`، و`id`).
    - تُشغّل الحل المسبق ويمكنها التطبيق فورًا.

    ملاحظة التنفيذ: يتجاوز الفحص المسبق عمليات التحقق من SecretRef الخاصة بالتنفيذ ما لم يُعيَّن `--allow-exec`. إذا طبّقت مباشرةً من `configure --apply` وكانت الخطة تتضمن مراجع/مزوّدي تنفيذ، فأبقِ `--allow-exec` معيّنًا لخطوة التطبيق أيضًا.

    أوضاع مفيدة:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    الإعدادات الافتراضية لتطبيق `configure`:

    - إزالة بيانات الاعتماد الثابتة المطابقة من `auth-profiles.json` للمزوّدين المستهدفين.
    - إزالة إدخالات `api_key` الثابتة القديمة من `auth.json`.
    - إزالة أسطر الأسرار المعروفة المطابقة من `<config-dir>/.env`.

  </Accordion>
  <Accordion title="تطبيق الأسرار">
    تطبيق خطة محفوظة:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    ملاحظة التنفيذ: يتجاوز التشغيل التجريبي عمليات التحقق من التنفيذ ما لم يُعيَّن `--allow-exec`؛ ويرفض وضع الكتابة الخطط التي تحتوي على SecretRefs/مزوّدي تنفيذ ما لم يُعيَّن `--allow-exec`.

    للاطلاع على تفاصيل عقد الهدف/المسار الصارم وقواعد الرفض الدقيقة، راجع [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## سياسة الأمان أحادية الاتجاه

<Warning>
لا يكتب OpenClaw عمدًا نسخًا احتياطية للتراجع تحتوي على قيم أسرار تاريخية بنص صريح.
</Warning>

نموذج الأمان:

- يجب أن ينجح الفحص المسبق قبل وضع الكتابة.
- يُتحقق من تفعيل وقت التشغيل قبل الاعتماد.
- يحدّث التطبيق الملفات باستخدام الاستبدال الذري للملفات والاستعادة بأفضل جهد عند الفشل.

## ملاحظات توافق المصادقة القديمة

بالنسبة إلى بيانات الاعتماد الثابتة، لم يعد وقت التشغيل يعتمد على تخزين المصادقة القديم بنص صريح.

- مصدر بيانات اعتماد وقت التشغيل هو اللقطة المحلولة في الذاكرة.
- تُزال إدخالات `api_key` الثابتة القديمة عند اكتشافها.
- يظل سلوك التوافق المرتبط بـ OAuth منفصلًا.

## ملاحظة واجهة الويب

يسهل إعداد بعض اتحادات SecretInput في وضع المحرر الخام مقارنةً بوضع النموذج.

## ذو صلة

- [المصادقة](/ar/gateway/authentication) - إعداد المصادقة
- [CLI: الأسرار](/ar/cli/secrets) - أوامر CLI
- [مراجع أسرار Vault](/ar/plugins/vault) - إعداد مزوّد HashiCorp Vault
- [متغيرات البيئة](/ar/help/environment) - أسبقية البيئة
- [نطاق بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface) - نطاق بيانات الاعتماد
- [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract) - تفاصيل عقد الخطة
- [الأمان](/ar/gateway/security) - الوضع الأمني
