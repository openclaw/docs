---
read_when:
    - تكوين SecretRefs لبيانات اعتماد المزوّد ومراجع `auth-profiles.json`
    - تشغيل إعادة تحميل الأسرار وتدقيقها وتهيئتها وتطبيقها بأمان في الإنتاج
    - فهم الإخفاق السريع عند بدء التشغيل، وتصفية الأسطح غير النشطة، وسلوك آخر حالة معروفة سليمة
sidebarTitle: Secrets management
summary: 'إدارة الأسرار: عقد SecretRef، وسلوك لقطة وقت التشغيل، والتنقيح الآمن أحادي الاتجاه'
title: إدارة الأسرار
x-i18n:
    generated_at: "2026-06-27T17:43:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

يدعم OpenClaw استخدام SecretRefs الإضافية بحيث لا تحتاج بيانات الاعتماد المدعومة إلى التخزين كنص صريح في التكوين.

<Note>
لا يزال النص الصريح يعمل. SecretRefs اختيارية لكل بيانات اعتماد.
</Note>

<Warning>
تظل بيانات الاعتماد النصية الصريحة قابلة للقراءة من قبل الوكيل إذا كانت مخزنة في ملفات يستطيع
الوكيل فحصها، بما في ذلك `openclaw.json` أو `auth-profiles.json` أو `.env` أو
ملفات `agents/*/agent/models.json` المولدة. تقلل SecretRefs نطاق التأثير المحلي
هذا فقط بعد ترحيل كل بيانات الاعتماد المدعومة وقيام
`openclaw secrets audit --check` بالإبلاغ عن عدم وجود أي بقايا أسرار نصية صريحة.
</Warning>

## الأهداف ونموذج وقت التشغيل

تُحل الأسرار في لقطة وقت تشغيل داخل الذاكرة.

- يتم الحل بشغف أثناء التفعيل، وليس بشكل كسول في مسارات الطلبات.
- يفشل بدء التشغيل سريعًا عندما يتعذر حل SecretRef نشط فعليًا.
- تستخدم إعادة التحميل تبديلًا ذريًا: نجاح كامل، أو الاحتفاظ بآخر لقطة معروفة وسليمة.
- تؤدي انتهاكات سياسة SecretRef (على سبيل المثال ملفات تعريف المصادقة بوضع OAuth المدمجة مع إدخال SecretRef) إلى فشل التفعيل قبل تبديل وقت التشغيل.
- تقرأ طلبات وقت التشغيل من اللقطة النشطة داخل الذاكرة فقط.
- بعد أول تفعيل/تحميل ناجح للتكوين، تستمر مسارات كود وقت التشغيل في قراءة تلك اللقطة النشطة داخل الذاكرة حتى تستبدلها إعادة تحميل ناجحة.
- تقرأ مسارات التسليم الصادرة أيضًا من تلك اللقطة النشطة (على سبيل المثال تسليم الردود/السلاسل في Discord وإرسال إجراءات Telegram)؛ ولا تعيد حل SecretRefs عند كل إرسال.

يبقي هذا انقطاعات مزود الأسرار خارج مسارات الطلبات الساخنة.

## حد وصول الوكيل

تحمي SecretRefs بيانات الاعتماد من الاستمرار في التكوين المدعوم
وأسطح النماذج المولدة، لكنها ليست حدًا لعزل العمليات. إذا بقيت
بيانات اعتماد نصية صريحة على القرص في مسار يستطيع الوكيل قراءته، يمكن للوكيل
تجاوز التنقيح على مستوى API باستخدام أدوات الملفات أو الصدفة لفحص ذلك الملف.

بالنسبة لعمليات النشر الإنتاجية التي تكون فيها الملفات القابلة لوصول الوكيل ضمن النطاق، عُدّ
ترحيل SecretRef مكتملًا فقط عندما تكون كل هذه الشروط صحيحة:

- تستخدم بيانات الاعتماد المدعومة SecretRefs بدلًا من القيم النصية الصريحة
- تمت إزالة بقايا النص الصريح القديمة من `openclaw.json` و
  `auth-profiles.json` و`.env` وملفات `models.json` المولدة
- يكون `openclaw secrets audit --check` نظيفًا بعد الترحيل
- تكون أي بيانات اعتماد متبقية غير مدعومة أو دورية محمية بعزل نظام
  التشغيل أو عزل الحاوية أو وكيل بيانات اعتماد خارجي

لهذا السبب يُعد سير عمل التدقيق/التكوين/التطبيق بوابة ترحيل أمنية، وليس
مجرد أداة مساعدة للراحة.

<Warning>
لا تجعل SecretRefs الملفات العشوائية القابلة للقراءة آمنة. يجب التعامل مع النسخ الاحتياطية والتكوينات المنسوخة
وكتالوجات النماذج المولدة القديمة وفئات بيانات الاعتماد غير المدعومة
كأسرار إنتاجية إلى أن تُحذف أو تُنقل خارج حد ثقة الوكيل
أو تُحمى بطبقة عزل منفصلة.
</Warning>

## تصفية السطح النشط

تُتحقق SecretRefs فقط على الأسطح النشطة فعليًا.

- الأسطح المفعلة: تمنع المراجع غير المحلولة بدء التشغيل/إعادة التحميل.
- الأسطح غير النشطة: لا تمنع المراجع غير المحلولة بدء التشغيل/إعادة التحميل.
- تصدر المراجع غير النشطة تشخيصات غير قاتلة بالرمز `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="أمثلة على الأسطح غير النشطة">
    - إدخالات القنوات/الحسابات المعطلة.
    - بيانات اعتماد القناة على المستوى الأعلى التي لا يرثها أي حساب مفعل.
    - أسطح الأدوات/الميزات المعطلة.
    - مفاتيح مزود بحث الويب الخاصة بالمزود التي لا يحددها `tools.web.search.provider`. في الوضع التلقائي (عند عدم تعيين المزود)، تُستشار المفاتيح حسب الأولوية لاكتشاف المزود تلقائيًا إلى أن يُحل أحدها. بعد الاختيار، تُعامل مفاتيح المزود غير المختار على أنها غير نشطة إلى أن يتم اختيارها.
    - تكون مواد مصادقة SSH في صندوق الرمل (`agents.defaults.sandbox.ssh.identityData` و`certificateData` و`knownHostsData`، إضافة إلى التجاوزات لكل وكيل) نشطة فقط عندما تكون الواجهة الخلفية الفعلية لصندوق الرمل هي `ssh` للوكيل الافتراضي أو لوكيل مفعل.
    - تكون SecretRefs الخاصة بـ `gateway.remote.token` / `gateway.remote.password` نشطة إذا كان أحد هذه الشروط صحيحًا:
      - `gateway.mode=remote`
      - تم تكوين `gateway.remote.url`
      - `gateway.tailscale.mode` هو `serve` أو `funnel`
      - في الوضع المحلي بدون تلك الأسطح البعيدة:
        - يكون `gateway.remote.token` نشطًا عندما يمكن أن تفوز مصادقة الرمز ولا يكون هناك رمز بيئة/مصادقة مكوّن.
        - يكون `gateway.remote.password` نشطًا فقط عندما يمكن أن تفوز مصادقة كلمة المرور ولا تكون هناك كلمة مرور بيئة/مصادقة مكوّنة.
    - يكون SecretRef الخاص بـ `gateway.auth.token` غير نشط لحل مصادقة بدء التشغيل عندما يتم تعيين `OPENCLAW_GATEWAY_TOKEN`، لأن إدخال رمز البيئة يفوز لذلك وقت التشغيل.

  </Accordion>
</AccordionGroup>

## تشخيصات سطح مصادقة Gateway

عندما يتم تكوين SecretRef على `gateway.auth.token` أو `gateway.auth.password` أو `gateway.remote.token` أو `gateway.remote.password`، تسجل عملية بدء/إعادة تحميل Gateway حالة السطح صراحةً:

- `active`: يكون SecretRef جزءًا من سطح المصادقة الفعلي ويجب حله.
- `inactive`: يتم تجاهل SecretRef لوقت التشغيل هذا لأن سطح مصادقة آخر يفوز، أو لأن المصادقة البعيدة معطلة/غير نشطة.

تُسجل هذه الإدخالات مع `SECRETS_GATEWAY_AUTH_SURFACE` وتتضمن السبب المستخدم بواسطة سياسة السطح النشط، بحيث يمكنك رؤية سبب معاملة بيانات اعتماد على أنها نشطة أو غير نشطة.

## فحص مرجع التهيئة المسبق

عندما تعمل التهيئة في الوضع التفاعلي وتختار تخزين SecretRef، يشغل OpenClaw تحققًا مسبقًا قبل الحفظ:

- مراجع البيئة: تتحقق من اسم متغير البيئة وتؤكد أن قيمة غير فارغة مرئية أثناء الإعداد.
- مراجع المزود (`file` أو `exec`): تتحقق من اختيار المزود، وتحل `id`، وتفحص نوع القيمة المحلولة.
- مسار إعادة استخدام البدء السريع: عندما يكون `gateway.auth.token` هو SecretRef بالفعل، تحله التهيئة قبل تمهيد الفحص/لوحة المعلومات (لمراجع `env` و`file` و`exec`) باستخدام بوابة الفشل السريع نفسها.

إذا فشل التحقق، تعرض التهيئة الخطأ وتتيح لك إعادة المحاولة.

## عقد SecretRef

استخدم شكل كائن واحد في كل مكان:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    تقبل حقول SecretInput المدعومة أيضًا اختصارات نصية مطابقة تمامًا:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    التحقق:

    - يجب أن يطابق `provider` النمط `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يطابق `id` النمط `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    التحقق:

    - يجب أن يطابق `provider` النمط `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يكون `id` مؤشر JSON مطلقًا (`/...`)
    - تهريب RFC6901 في المقاطع: `~` => `~0`، `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    التحقق:

    - يجب أن يطابق `provider` النمط `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يطابق `id` النمط `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (يدعم محددات مثل `secret#json_key`)
    - يجب ألا يحتوي `id` على `.` أو `..` كمقاطع مسار مفصولة بشرطات مائلة (على سبيل المثال يُرفض `a/../b`)

  </Tab>
</Tabs>

## تكوين المزود

عرّف المزودين ضمن `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
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

<AccordionGroup>
  <Accordion title="مزود البيئة">
    - قائمة سماح اختيارية عبر `allowlist`.
    - تؤدي قيم البيئة المفقودة/الفارغة إلى فشل الحل.

  </Accordion>
  <Accordion title="مزود الملف">
    - يقرأ الملف المحلي من `path`.
    - يتوقع `mode: "json"` حمولة كائن JSON ويحل `id` كمؤشر.
    - يتوقع `mode: "singleValue"` معرف المرجع `"value"` ويعيد محتويات الملف.
    - يجب أن ينجح المسار في فحوصات الملكية/الأذونات.
    - ملاحظة الفشل المغلق في Windows: إذا كان التحقق من ACL غير متاح لمسار، يفشل الحل. للمسارات الموثوقة فقط، عيّن `allowInsecurePath: true` على ذلك المزود لتجاوز فحوصات أمان المسار.

  </Accordion>
  <Accordion title="مزود exec">
    - يشغل مسار ملف ثنائي مطلقًا ومكوّنًا، بدون صدفة.
    - افتراضيًا، يجب أن يشير `command` إلى ملف عادي (وليس رابطًا رمزيًا).
    - عيّن `allowSymlinkCommand: true` للسماح بمسارات أوامر الروابط الرمزية (على سبيل المثال جسور Homebrew). يتحقق OpenClaw من مسار الهدف المحلول.
    - اقرن `allowSymlinkCommand` مع `trustedDirs` لمسارات مديري الحزم (على سبيل المثال `["/opt/homebrew"]`).
    - يدعم المهلة، ومهلة عدم وجود مخرجات، وحدود بايتات المخرجات، وقائمة سماح البيئة، والأدلة الموثوقة.
    - ملاحظة الفشل المغلق في Windows: إذا كان التحقق من ACL غير متاح لمسار الأمر، يفشل الحل. للمسارات الموثوقة فقط، عيّن `allowInsecurePath: true` على ذلك المزود لتجاوز فحوصات أمان المسار.
    - يمكن لمزودي exec المدارين بواسطة Plugin استخدام `pluginIntegration` بدلًا من
      `command`/`args` المنسوخة. يحل OpenClaw تفاصيل الأمر الحالية
      من بيان Plugin المثبت أثناء بدء التشغيل/إعادة التحميل. إذا كان Plugin
      معطلًا أو محذوفًا أو غير موثوق أو لم يعد يعلن التكامل،
      تفشل SecretRefs النشطة التي تستخدم ذلك المزود بإغلاق آمن.

    حمولة الطلب (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    حمولة الاستجابة (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    أخطاء اختيارية لكل معرف:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## مفاتيح API المدعومة بالملفات

لا تضع سلاسل `file:...` في كتلة `env` في التكوين. كتلة `env`
حرفية وغير متجاوزة، لذلك لا يتم حل `file:...`.

استخدم SecretRef ملفيًا في حقل بيانات اعتماد مدعوم بدلًا من ذلك:

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

بالنسبة إلى `mode: "singleValue"`، يكون `id` الخاص بـ SecretRef هو `"value"`. بالنسبة إلى
`mode: "json"`، استخدم مؤشر JSON مطلقًا مثل
`"/providers/xai/apiKey"`.

راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface) لمعرفة
حقول التكوين التي تقبل SecretRefs.

## أمثلة تكامل exec

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    استخدم غلاف محلّل عندما تريد أن ترتبط معرّفات SecretRef بمفاتيح عناصر Bitwarden
    Secrets Manager. يتضمن المستودع
    `scripts/secrets/openclaw-bws-resolver.mjs`؛ ثبّته أو انسخه إلى مسار مطلق
    موثوق على المضيف الذي يشغّل Gateway.

    المتطلبات:

    - تثبيت Bitwarden Secrets Manager CLI (`bws`) على مضيف Gateway.
    - إتاحة `BWS_ACCESS_TOKEN` لخدمة Gateway.
    - تمرير `PATH` إلى المحلّل، أو ضبط `BWS_BIN` على مسار ملف `bws`
      التنفيذي المطلق.
    - يجب ضبط `BWS_SERVER_URL` في البيئة عند استخدام نسخة Bitwarden
      مستضافة ذاتيًا.

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

    يجمع المحلّل المعرّفات المطلوبة في دفعات، ويشغّل `bws secret list`، ويعيد
    القيم لحقول `key` السرية المطابقة. استخدم مفاتيح تستوفي عقد معرّف
    SecretRef من نوع exec، مثل `openclaw/providers/openai/apiKey`؛ أما مفاتيح
    نمط متغيرات البيئة التي تحتوي على شرطات سفلية فيتم رفضها قبل تشغيل المحلّل.
    إذا كان أكثر من سر Bitwarden مرئي واحد يمتلك المفتاح المطلوب نفسه، يفشل
    المحلّل ذلك المعرّف بوصفه ملتبسًا بدلًا من اختيار واحد. بعد تحديث الإعدادات،
    تحقّق من مسار المحلّل:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  <Accordion title="password-store (`pass`)">
    استخدم غلاف محلّل صغير عندما تريد أن ترتبط معرّفات SecretRef مباشرة
    بإدخالات `pass`. احفظ هذا كملف تنفيذي في مسار مطلق يجتاز فحوصات مسار
    مزوّد exec لديك، مثل
    `/usr/local/bin/openclaw-pass-resolver`. يحدد سطر shebang
    `#!/usr/bin/env node` موقع `node` من `PATH` الخاص بعملية المحلّل، لذلك
    ضمّن `PATH` في `passEnv`. إذا لم يكن `pass` موجودًا على ذلك `PATH`، فاضبط
    `PASS_BIN` في البيئة الأصلية وضمّنه في `passEnv` أيضًا:

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
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    ثم اضبط مزوّد exec ووجّه `apiKey` إلى مسار إدخال `pass`:

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

    أبقِ السر في السطر الأول من إدخال `pass`، أو خصّص الغلاف إذا أردت إرجاع
    مخرجات `pass show` كاملة بدلًا من ذلك. بعد تحديث الإعدادات، تحقّق من
    التدقيق الثابت ومسار محلّل exec معًا:

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

تدعم متغيرات بيئة خادم MCP المضبوطة عبر `plugins.entries.acpx.config.mcpServers` استخدام SecretInput. يُبقي هذا مفاتيح API والرموز خارج الإعدادات النصية الصريحة:

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

لا تزال قيم السلاسل النصية الصريحة تعمل. تُحل مراجع قوالب البيئة مثل `${MCP_SERVER_API_KEY}` وكائنات SecretRef أثناء تفعيل Gateway قبل إنشاء عملية خادم MCP. وكما هو الحال مع أسطح SecretRef الأخرى، لا تمنع المراجع غير المحلولة التفعيل إلا عندما يكون Plugin `acpx` نشطًا فعليًا.

## مواد مصادقة SSH لبيئة العزل

تدعم الواجهة الخلفية الأساسية لبيئة العزل `ssh` أيضًا SecretRefs لمواد مصادقة SSH:

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

- يحل OpenClaw هذه المراجع أثناء تفعيل بيئة العزل، لا بشكل كسول أثناء كل استدعاء SSH.
- تُكتب القيم المحلولة إلى ملفات مؤقتة بأذونات مقيّدة وتُستخدم في إعدادات SSH المولّدة.
- إذا لم تكن الواجهة الخلفية الفعالة لبيئة العزل هي `ssh`، تبقى هذه المراجع غير نشطة ولا تمنع بدء التشغيل.

## سطح بيانات الاعتماد المدعوم

بيانات الاعتماد الأساسية المدعومة وغير المدعومة مدرجة في:

- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)

<Note>
تُستبعد بيانات الاعتماد التي ينشئها وقت التشغيل أو التي تتغير دوريًا ومواد تحديث OAuth عمدًا من حل SecretRef للقراءة فقط.
</Note>

## السلوك المطلوب والأسبقية

- حقل بدون مرجع: بلا تغيير.
- حقل مع مرجع: مطلوب على الأسطح النشطة أثناء التفعيل.
- إذا وُجد كل من النص الصريح والمرجع، تكون الأسبقية للمرجع على مسارات الأسبقية المدعومة.
- قيمة التنقيح الحارسة `__OPENCLAW_REDACTED__` محجوزة لتنقيح/استعادة الإعدادات داخليًا وتُرفض كبيانات إعدادات حرفية مُرسلة.

إشارات التحذير والتدقيق:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (تحذير وقت التشغيل)
- `REF_SHADOWED` (نتيجة تدقيق عندما تكون لبيانات اعتماد `auth-profiles.json` الأسبقية على مراجع `openclaw.json`)

سلوك توافق Google Chat:

- تكون الأسبقية لـ `serviceAccountRef` على `serviceAccount` النصي الصريح.
- تُتجاهل القيمة النصية الصريحة عند ضبط المرجع المجاور.

## محفزات التفعيل

يعمل تفعيل الأسرار عند:

- بدء التشغيل (فحص تمهيدي إضافة إلى التفعيل النهائي)
- مسار تطبيق إعادة تحميل الإعدادات الساخن
- مسار فحص إعادة التشغيل عند إعادة تحميل الإعدادات
- إعادة التحميل اليدوية عبر `secrets.reload`
- الفحص التمهيدي لـ RPC كتابة إعدادات Gateway (`config.set` / `config.apply` / `config.patch`) للتحقق من قابلية حل SecretRef على السطح النشط ضمن حمولة الإعدادات المُرسلة قبل حفظ التعديلات

عقد التفعيل:

- يستبدل النجاح اللقطة بشكل ذري.
- يؤدي فشل بدء التشغيل إلى إيقاف بدء Gateway.
- يُبقي فشل إعادة التحميل في وقت التشغيل آخر لقطة سليمة معروفة.
- يرفض فشل الفحص التمهيدي لـ Write-RPC الإعدادات المُرسلة ويُبقي إعدادات القرص ولقطة وقت التشغيل النشطة بلا تغيير.
- لا يؤدي تقديم رمز قناة صريح لكل استدعاء إلى استدعاء مساعد/أداة صادرة إلى تشغيل تفعيل SecretRef؛ تبقى نقاط التفعيل هي بدء التشغيل، وإعادة التحميل، و`secrets.reload` الصريح.

## إشارات التدهور والتعافي

عندما يفشل التفعيل وقت إعادة التحميل بعد حالة سليمة، يدخل OpenClaw حالة أسرار متدهورة.

أكواد حدث النظام والسجل أحادية الإرسال:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

السلوك:

- متدهور: يحتفظ وقت التشغيل بآخر لقطة سليمة معروفة.
- متعافٍ: يُصدر مرة واحدة بعد التفعيل الناجح التالي.
- تسجل الإخفاقات المتكررة أثناء التدهور تحذيرات لكنها لا تغرق الأحداث.
- لا يصدر فشل بدء التشغيل السريع أحداث تدهور لأن وقت التشغيل لم يصبح نشطًا قط.

## حل مسار الأوامر

يمكن لمسارات الأوامر اختيار الدخول في حل SecretRef المدعوم عبر RPC لقطة Gateway.

هناك سلوكان عامان:

<Tabs>
  <Tab title="مسارات الأوامر الصارمة">
    على سبيل المثال مسارات الذاكرة البعيدة في `openclaw memory` و`openclaw qr --remote` عندما تحتاج إلى مراجع السر المشترك البعيد. تقرأ من اللقطة النشطة وتفشل سريعًا عندما لا يتوفر SecretRef مطلوب.
  </Tab>
  <Tab title="مسارات الأوامر للقراءة فقط">
    على سبيل المثال `openclaw status` و`openclaw status --all` و`openclaw channels status` و`openclaw channels resolve` و`openclaw security audit` وتدفقات إصلاح doctor/config للقراءة فقط. تفضّل هذه أيضًا اللقطة النشطة، لكنها تتدهور بدل الإنهاء عندما لا يتوفر SecretRef مستهدف في مسار الأمر ذلك.

    سلوك القراءة فقط:

    - عندما يكون Gateway قيد التشغيل، تقرأ هذه الأوامر من اللقطة النشطة أولًا.
    - إذا كان حل Gateway غير مكتمل أو كان Gateway غير متاح، فإنها تحاول رجوعًا محليًا مستهدفًا لسطح الأمر المحدد.
    - إذا ظل SecretRef مستهدف غير متاح، يستمر الأمر بمخرجات قراءة فقط متدهورة وتشخيصات صريحة مثل "configured but unavailable in this command path".
    - هذا السلوك المتدهور محلي للأمر فقط. ولا يضعف مسارات بدء تشغيل وقت التشغيل أو إعادة التحميل أو الإرسال/المصادقة.

  </Tab>
</Tabs>

ملاحظات أخرى:

- يتولى `openclaw secrets reload` تحديث اللقطة بعد تدوير أسرار الواجهة الخلفية.
- طريقة Gateway RPC المستخدمة بواسطة مسارات الأوامر هذه: `secrets.resolve`.

## سير عمل التدقيق والتهيئة

تدفق المشغل الافتراضي:

<Steps>
  <Step title="تدقيق الحالة الحالية">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="تهيئة SecretRefs وتطبيقها">
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

لا تتعامل مع الترحيل على أنه مكتمل حتى تكون إعادة التدقيق نظيفة. إذا كان التدقيق
ما يزال يبلغ عن قيم نصية صريحة في حالة السكون، فإن خطر وصول الوكيل ما يزال قائمًا
حتى عندما تعيد APIs وقت التشغيل قيمًا منقحة.

إذا حفظت خطة بدلًا من تطبيقها أثناء `configure`، فطبّق تلك الخطة المحفوظة
باستخدام `openclaw secrets apply --from <plan-path>` قبل إعادة التدقيق.

<AccordionGroup>
  <Accordion title="secrets audit">
    تتضمن النتائج:

    - قيمًا نصية صريحة في حالة السكون (`openclaw.json` و`auth-profiles.json` و`.env` و`agents/*/agent/models.json` المولّد)
    - بقايا ترويسات مزود حساسة بنص صريح في إدخالات `models.json` المولّدة
    - مراجع غير محلولة
    - حجب الأسبقية (`auth-profiles.json` يأخذ الأولوية على مراجع `openclaw.json`)
    - بقايا قديمة (`auth.json` وتذكيرات OAuth)

    ملاحظة Exec:

    - افتراضيًا، يتخطى التدقيق فحوصات قابلية حل SecretRef من نوع exec لتجنب الآثار الجانبية للأوامر.
    - استخدم `openclaw secrets audit --allow-exec` لتنفيذ مزودي exec أثناء التدقيق.

    ملاحظة بقايا الترويسات:

    - يعتمد اكتشاف ترويسات المزود الحساسة على استدلال الأسماء (أسماء وأجزاء ترويسات المصادقة/بيانات الاعتماد الشائعة مثل `authorization` و`x-api-key` و`token` و`secret` و`password` و`credential`).

  </Accordion>
  <Accordion title="secrets configure">
    مساعد تفاعلي يقوم بما يلي:

    - يهيئ `secrets.providers` أولًا (`env`/`file`/`exec`، إضافة/تحرير/إزالة)
    - يتيح لك تحديد الحقول المدعومة الحاملة للأسرار في `openclaw.json` بالإضافة إلى `auth-profiles.json` لنطاق وكيل واحد
    - يمكنه إنشاء ربط `auth-profiles.json` جديد مباشرة في منتقي الهدف
    - يلتقط تفاصيل SecretRef (`source` و`provider` و`id`)
    - يشغّل حل ما قبل التنفيذ
    - يمكنه التطبيق فورًا

    ملاحظة Exec:

    - يتخطى فحص ما قبل التنفيذ فحوصات SecretRef من نوع exec ما لم يتم تعيين `--allow-exec`.
    - إذا طبقت مباشرة من `configure --apply` وكانت الخطة تتضمن مراجع/مزودين من نوع exec، فأبقِ `--allow-exec` معينًا لخطوة التطبيق أيضًا.

    أوضاع مفيدة:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    افتراضيات تطبيق `configure`:

    - تنقيح بيانات الاعتماد الثابتة المطابقة من `auth-profiles.json` للمزودين المستهدفين
    - تنقيح إدخالات `api_key` الثابتة القديمة من `auth.json`
    - تنقيح أسطر الأسرار المعروفة المطابقة من `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    تطبيق خطة محفوظة:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    ملاحظة Exec:

    - يتخطى dry-run فحوصات exec ما لم يتم تعيين `--allow-exec`.
    - يرفض وضع الكتابة الخطط التي تحتوي على SecretRefs/مزودين من نوع exec ما لم يتم تعيين `--allow-exec`.

    للحصول على تفاصيل عقد الهدف/المسار الصارمة وقواعد الرفض الدقيقة، راجع [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## سياسة السلامة أحادية الاتجاه

<Warning>
لا يكتب OpenClaw عمدًا نسخًا احتياطية للتراجع تحتوي على قيم أسرار نصية صريحة تاريخية.
</Warning>

نموذج السلامة:

- يجب أن ينجح فحص ما قبل التنفيذ قبل وضع الكتابة
- يتم التحقق من تنشيط وقت التشغيل قبل الالتزام
- يحدّث التطبيق الملفات باستخدام استبدال ملف ذري واستعادة بأفضل جهد عند الفشل

## ملاحظات توافق المصادقة القديمة

بالنسبة إلى بيانات الاعتماد الثابتة، لم يعد وقت التشغيل يعتمد على تخزين المصادقة القديم بنص صريح.

- مصدر بيانات اعتماد وقت التشغيل هو اللقطة المحلولة في الذاكرة.
- يتم تنقيح إدخالات `api_key` الثابتة القديمة عند اكتشافها.
- يظل سلوك التوافق المرتبط بـ OAuth منفصلًا.

## ملاحظة Web UI

بعض اتحادات SecretInput أسهل في تهيئتها في وضع المحرر الخام منها في وضع النموذج.

## ذات صلة

- [المصادقة](/ar/gateway/authentication) — إعداد المصادقة
- [CLI: الأسرار](/ar/cli/secrets) — أوامر CLI
- [متغيرات البيئة](/ar/help/environment) — أسبقية البيئة
- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface) — سطح بيانات الاعتماد
- [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract) — تفاصيل عقد الخطة
- [الأمان](/ar/gateway/security) — الوضع الأمني
