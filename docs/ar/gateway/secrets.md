---
read_when:
    - تكوين SecretRefs لبيانات اعتماد المزوّدين ومراجع `auth-profiles.json`
    - إدارة إعادة تحميل الأسرار وتدقيقها وتكوينها وتطبيقها بأمان في بيئة الإنتاج
    - فهم الفشل السريع عند بدء التشغيل، وتصفية الأسطح غير النشطة، وسلوك آخر حالة صالحة معروفة
sidebarTitle: Secrets management
summary: 'إدارة الأسرار: عقد SecretRef، وسلوك لقطة وقت التشغيل، والتنقيح الآمن أحادي الاتجاه'
title: إدارة الأسرار
x-i18n:
    generated_at: "2026-04-30T08:02:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

يدعم OpenClaw مراجع SecretRefs الإضافية بحيث لا يلزم تخزين بيانات الاعتماد المدعومة كنص صريح في الإعدادات.

<Note>
لا يزال النص الصريح يعمل. مراجع SecretRefs اختيارية لكل بيانات اعتماد.
</Note>

## الأهداف ونموذج وقت التشغيل

تُحلّ الأسرار في لقطة وقت تشغيل داخل الذاكرة.

- يتم الحل مبكرًا أثناء التفعيل، وليس كسولًا في مسارات الطلبات.
- يفشل بدء التشغيل بسرعة عندما يتعذر حل SecretRef فعّال فعليًا.
- تستخدم إعادة التحميل تبديلًا ذريًا: نجاح كامل، أو الاحتفاظ بآخر لقطة سليمة معروفة.
- تؤدي مخالفات سياسة SecretRef (مثل ملفات تعريف المصادقة بوضع OAuth مع إدخال SecretRef) إلى فشل التفعيل قبل تبديل وقت التشغيل.
- تقرأ طلبات وقت التشغيل من اللقطة النشطة داخل الذاكرة فقط.
- بعد أول تفعيل/تحميل ناجح للإعدادات، تستمر مسارات كود وقت التشغيل في قراءة تلك اللقطة النشطة داخل الذاكرة إلى أن تستبدلها إعادة تحميل ناجحة.
- تقرأ مسارات التسليم الصادر أيضًا من تلك اللقطة النشطة (مثل تسليم الردود/السلاسل في Discord وإرسال إجراءات Telegram)؛ ولا تعيد حل مراجع SecretRefs عند كل إرسال.

يبقي هذا انقطاعات مزود الأسرار خارج مسارات الطلبات الساخنة.

## تصفية السطح النشط

لا تُتحقق مراجع SecretRefs إلا على الأسطح النشطة فعليًا.

- الأسطح الممكّنة: تمنع المراجع غير المحلولة بدء التشغيل/إعادة التحميل.
- الأسطح غير النشطة: لا تمنع المراجع غير المحلولة بدء التشغيل/إعادة التحميل.
- تصدر المراجع غير النشطة تشخيصات غير قاتلة بالرمز `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="أمثلة على الأسطح غير النشطة">
    - إدخالات القنوات/الحسابات المعطلة.
    - بيانات اعتماد القناة ذات المستوى الأعلى التي لا يرثها أي حساب ممكّن.
    - أسطح الأدوات/الميزات المعطلة.
    - مفاتيح موفري بحث الويب الخاصة التي لا يحددها `tools.web.search.provider`. في الوضع التلقائي (عند عدم تعيين المزود)، تُستشار المفاتيح حسب الأسبقية لاكتشاف المزود تلقائيًا إلى أن يُحل أحدها. بعد الاختيار، تُعامل مفاتيح المزود غير المحدد على أنها غير نشطة إلى أن تُحدد.
    - تكون مادة مصادقة SSH في صندوق الرمل (`agents.defaults.sandbox.ssh.identityData` و`certificateData` و`knownHostsData`، بالإضافة إلى التجاوزات لكل وكيل) نشطة فقط عندما تكون واجهة صندوق الرمل الخلفية الفعالة هي `ssh` للوكيل الافتراضي أو لوكيل ممكّن.
    - تكون مراجع SecretRefs الخاصة بـ `gateway.remote.token` / `gateway.remote.password` نشطة إذا كان أحد هذه الأمور صحيحًا:
      - `gateway.mode=remote`
      - تم تكوين `gateway.remote.url`
      - يكون `gateway.tailscale.mode` هو `serve` أو `funnel`
      - في الوضع المحلي من دون تلك الأسطح البعيدة:
        - يكون `gateway.remote.token` نشطًا عندما يمكن أن تفوز مصادقة الرمز ولا يكون أي رمز بيئة/مصادقة مكوّنًا.
        - يكون `gateway.remote.password` نشطًا فقط عندما يمكن أن تفوز مصادقة كلمة المرور ولا تكون أي كلمة مرور بيئة/مصادقة مكوّنة.
    - يكون SecretRef الخاص بـ `gateway.auth.token` غير نشط لحل مصادقة بدء التشغيل عندما يكون `OPENCLAW_GATEWAY_TOKEN` معيّنًا، لأن إدخال رمز البيئة يفوز في وقت التشغيل ذاك.

  </Accordion>
</AccordionGroup>

## تشخيصات سطح مصادقة Gateway

عند تكوين SecretRef على `gateway.auth.token` أو `gateway.auth.password` أو `gateway.remote.token` أو `gateway.remote.password`، تسجل عملية بدء تشغيل/إعادة تحميل Gateway حالة السطح صراحة:

- `active`: يكون SecretRef جزءًا من سطح المصادقة الفعال ويجب حله.
- `inactive`: يُتجاهل SecretRef في وقت التشغيل هذا لأن سطح مصادقة آخر يفوز، أو لأن المصادقة البعيدة معطلة/غير نشطة.

تُسجل هذه الإدخالات مع `SECRETS_GATEWAY_AUTH_SURFACE` وتتضمن السبب المستخدم بواسطة سياسة السطح النشط، بحيث يمكنك معرفة سبب معاملة بيانات اعتماد على أنها نشطة أو غير نشطة.

## فحص مسبق لمراجع التهيئة

عند تشغيل التهيئة في الوضع التفاعلي واختيار تخزين SecretRef، يشغل OpenClaw تحققًا مسبقًا قبل الحفظ:

- مراجع البيئة: تتحقق من اسم متغير البيئة وتؤكد أن قيمة غير فارغة مرئية أثناء الإعداد.
- مراجع المزود (`file` أو `exec`): تتحقق من اختيار المزود، وتحل `id`، وتتحقق من نوع القيمة المحلولة.
- مسار إعادة استخدام البدء السريع: عندما يكون `gateway.auth.token` بالفعل SecretRef، تحله التهيئة قبل تمهيد الفحص/لوحة المعلومات (لمراجع `env` و`file` و`exec`) باستخدام بوابة الفشل السريع نفسها.

إذا فشل التحقق، تعرض التهيئة الخطأ وتتيح لك إعادة المحاولة.

## عقد SecretRef

استخدم شكل كائن واحدًا في كل مكان:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
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
    - الهروب وفق RFC6901 في المقاطع: `~` => `~0`، و`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    التحقق:

    - يجب أن يطابق `provider` النمط `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يطابق `id` النمط `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - يجب ألا يحتوي `id` على `.` أو `..` كمقاطع مسار مفصولة بشرطة مائلة (مثلًا يُرفض `a/../b`)

  </Tab>
</Tabs>

## إعداد المزود

عرّف المزودين تحت `secrets.providers`:

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
    - يقرأ ملفًا محليًا من `path`.
    - يتوقع `mode: "json"` حمولة كائن JSON ويحل `id` كمؤشر.
    - يتوقع `mode: "singleValue"` معرف مرجع `"value"` ويعيد محتويات الملف.
    - يجب أن يمر المسار بفحوصات الملكية/الأذونات.
    - ملاحظة الفشل المغلق في Windows: إذا لم يكن التحقق من ACL متاحًا لمسار ما، يفشل الحل. للمسارات الموثوقة فقط، عيّن `allowInsecurePath: true` على ذلك المزود لتجاوز فحوصات أمان المسار.

  </Accordion>
  <Accordion title="مزود exec">
    - يشغّل مسار ملف ثنائي مطلقًا مكوّنًا، بلا shell.
    - افتراضيًا، يجب أن يشير `command` إلى ملف عادي (وليس رابطًا رمزيًا).
    - عيّن `allowSymlinkCommand: true` للسماح بمسارات أوامر الروابط الرمزية (مثل أدوات Homebrew الوسيطة). يتحقق OpenClaw من مسار الهدف المحلول.
    - اقرن `allowSymlinkCommand` مع `trustedDirs` لمسارات مديري الحزم (مثل `["/opt/homebrew"]`).
    - يدعم المهلة، ومهلة عدم وجود إخراج، وحدود بايت الإخراج، وقائمة سماح البيئة، والأدلة الموثوقة.
    - ملاحظة الفشل المغلق في Windows: إذا لم يكن التحقق من ACL متاحًا لمسار الأمر، يفشل الحل. للمسارات الموثوقة فقط، عيّن `allowInsecurePath: true` على ذلك المزود لتجاوز فحوصات أمان المسار.

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

تدعم متغيرات بيئة خادم MCP المكوّنة عبر `plugins.entries.acpx.config.mcpServers` إدخال SecretInput. يبقي هذا مفاتيح API والرموز خارج إعدادات النص الصريح:

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

لا تزال قيم السلاسل النصية الصريحة تعمل. تُحل مراجع قوالب البيئة مثل `${MCP_SERVER_API_KEY}` وكائنات SecretRef أثناء تفعيل Gateway قبل إنشاء عملية خادم MCP. كما هو الحال مع أسطح SecretRef الأخرى، لا تمنع المراجع غير المحلولة التفعيل إلا عندما يكون Plugin `acpx` نشطًا فعليًا.

## مادة مصادقة SSH في صندوق الرمل

تدعم واجهة صندوق الرمل الخلفية الأساسية `ssh` أيضًا مراجع SecretRefs لمادة مصادقة SSH:

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

- يحل OpenClaw هذه المراجع أثناء تفعيل وضع الحماية، وليس بشكل كسول أثناء كل استدعاء SSH.
- تُكتب القيم المحلولة إلى ملفات مؤقتة بأذونات مقيّدة وتُستخدم في إعدادات SSH المُولَّدة.
- إذا لم تكن واجهة وضع الحماية الفعالة هي `ssh`، فتبقى هذه المراجع غير نشطة ولا تمنع بدء التشغيل.

## سطح بيانات الاعتماد المدعوم

تُسرد بيانات الاعتماد المدعومة وغير المدعومة المعتمدة في:

- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)

<Note>
بيانات الاعتماد المُنشأة في وقت التشغيل أو الدوّارة ومواد تحديث OAuth مستبعدة عمدًا من حل SecretRef للقراءة فقط.
</Note>

## السلوك المطلوب والأسبقية

- حقل بدون مرجع: دون تغيير.
- حقل مع مرجع: مطلوب على الأسطح النشطة أثناء التفعيل.
- إذا وُجد كل من النص الصريح والمرجع، تكون الأولوية للمرجع في مسارات الأسبقية المدعومة.
- علامة التنقيح `__OPENCLAW_REDACTED__` محجوزة لتنقيح/استعادة الإعدادات داخليًا، وتُرفض كبيانات إعدادات مُرسلة حرفية.

إشارات التحذير والتدقيق:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (تحذير وقت التشغيل)
- `REF_SHADOWED` (نتيجة تدقيق عندما تكون لبيانات اعتماد `auth-profiles.json` أسبقية على مراجع `openclaw.json`)

سلوك التوافق مع Google Chat:

- تكون لـ `serviceAccountRef` أسبقية على `serviceAccount` بالنص الصريح.
- تُتجاهل قيمة النص الصريح عندما يكون مرجع شقيق معيّنًا.

## محفزات التفعيل

يعمل تفعيل الأسرار عند:

- بدء التشغيل (الفحص المسبق بالإضافة إلى التفعيل النهائي)
- مسار التطبيق الساخن لإعادة تحميل الإعدادات
- مسار التحقق من إعادة التشغيل لإعادة تحميل الإعدادات
- إعادة التحميل اليدوية عبر `secrets.reload`
- الفحص المسبق لكتابة إعدادات Gateway عبر RPC (`config.set` / `config.apply` / `config.patch`) لقابلية حل SecretRef على السطح النشط داخل حمولة الإعدادات المُرسلة قبل حفظ التعديلات

عقد التفعيل:

- النجاح يستبدل اللقطة ذريًا.
- فشل بدء التشغيل يوقف بدء تشغيل Gateway.
- فشل إعادة التحميل في وقت التشغيل يُبقي آخر لقطة سليمة معروفة.
- فشل الفحص المسبق لـ RPC الكتابة يرفض الإعدادات المُرسلة ويُبقي كلًا من إعدادات القرص ولقطة وقت التشغيل النشطة دون تغيير.
- لا يؤدي تقديم رمز قناة صريح لكل استدعاء إلى استدعاء مساعد/أداة صادرة إلى تفعيل SecretRef؛ تظل نقاط التفعيل هي بدء التشغيل وإعادة التحميل و`secrets.reload` الصريح.

## إشارات التدهور والاسترداد

عندما يفشل التفعيل وقت إعادة التحميل بعد حالة سليمة، يدخل OpenClaw في حالة أسرار متدهورة.

أكواد حدث النظام والسجل لمرة واحدة:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

السلوك:

- متدهور: وقت التشغيل يُبقي آخر لقطة سليمة معروفة.
- مسترد: يُرسل مرة واحدة بعد التفعيل الناجح التالي.
- حالات الفشل المتكررة أثناء التدهور بالفعل تُسجل تحذيرات لكنها لا تُغرق الأحداث.
- الفشل السريع عند بدء التشغيل لا يرسل أحداث تدهور لأن وقت التشغيل لم يصبح نشطًا قط.

## حل مسار الأوامر

يمكن لمسارات الأوامر الاشتراك في حل SecretRef المدعوم عبر RPC لقطة Gateway.

هناك سلوكان عامان:

<Tabs>
  <Tab title="مسارات الأوامر الصارمة">
    على سبيل المثال مسارات الذاكرة البعيدة `openclaw memory` و`openclaw qr --remote` عندما تحتاج إلى مراجع السر المشترك البعيد. تقرأ من اللقطة النشطة وتفشل سريعًا عندما لا يتوفر SecretRef مطلوب.
  </Tab>
  <Tab title="مسارات أوامر القراءة فقط">
    على سبيل المثال `openclaw status`، و`openclaw status --all`، و`openclaw channels status`، و`openclaw channels resolve`، و`openclaw security audit`، وتدفقات الإصلاح للقراءة فقط الخاصة بالطبيب/الإعدادات. تفضل أيضًا اللقطة النشطة، لكنها تتدهور بدلًا من الإيقاف عندما لا يتوفر SecretRef مستهدف في مسار الأمر هذا.

    سلوك القراءة فقط:

    - عندما يكون Gateway قيد التشغيل، تقرأ هذه الأوامر من اللقطة النشطة أولًا.
    - إذا كان حل Gateway غير مكتمل أو كان Gateway غير متاح، تحاول الرجوع محليًا بشكل مستهدف لسطح الأمر المحدد.
    - إذا بقي SecretRef مستهدف غير متاح، يستمر الأمر بمخرجات قراءة فقط متدهورة وتشخيصات صريحة مثل "مُعد لكنه غير متاح في مسار الأمر هذا".
    - هذا السلوك المتدهور محلي للأمر فقط. لا يضعف بدء تشغيل وقت التشغيل أو إعادة التحميل أو مسارات الإرسال/المصادقة.

  </Tab>
</Tabs>

ملاحظات أخرى:

- يتولى `openclaw secrets reload` تحديث اللقطة بعد تدوير سر الواجهة الخلفية.
- طريقة Gateway RPC التي تستخدمها مسارات الأوامر هذه: `secrets.resolve`.

## سير عمل التدقيق والإعداد

تدفق المشغل الافتراضي:

<Steps>
  <Step title="تدقيق الحالة الحالية">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="إعداد SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="إعادة التدقيق">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    تشمل النتائج:

    - قيم النص الصريح في حالة السكون (`openclaw.json`، و`auth-profiles.json`، و`.env`، و`agents/*/agent/models.json` المُولَّد)
    - بقايا ترويسات المزوّد الحساسة بالنص الصريح في إدخالات `models.json` المُولَّدة
    - مراجع غير محلولة
    - حجب الأسبقية (`auth-profiles.json` يأخذ الأولوية على مراجع `openclaw.json`)
    - بقايا قديمة (`auth.json`، وتذكيرات OAuth)

    ملاحظة التنفيذ:

    - افتراضيًا، يتخطى التدقيق فحوصات قابلية حل SecretRef الخاصة بالتنفيذ لتجنب الآثار الجانبية للأوامر.
    - استخدم `openclaw secrets audit --allow-exec` لتنفيذ مزوّدي التنفيذ أثناء التدقيق.

    ملاحظة بقايا الترويسات:

    - يعتمد اكتشاف ترويسات المزوّد الحساسة على استدلالات الاسم (أسماء وأجزاء ترويسات المصادقة/بيانات الاعتماد الشائعة مثل `authorization`، و`x-api-key`، و`token`، و`secret`، و`password`، و`credential`).

  </Accordion>
  <Accordion title="secrets configure">
    مساعد تفاعلي يقوم بما يلي:

    - يضبط `secrets.providers` أولًا (`env`/`file`/`exec`، إضافة/تحرير/إزالة)
    - يتيح لك تحديد الحقول المدعومة الحاملة للأسرار في `openclaw.json` بالإضافة إلى `auth-profiles.json` لنطاق وكيل واحد
    - يمكنه إنشاء تعيين `auth-profiles.json` جديد مباشرة في منتقي الهدف
    - يلتقط تفاصيل SecretRef (`source`، و`provider`، و`id`)
    - يشغّل حل الفحص المسبق
    - يمكنه التطبيق فورًا

    ملاحظة التنفيذ:

    - يتخطى الفحص المسبق فحوصات SecretRef الخاصة بالتنفيذ ما لم يتم تعيين `--allow-exec`.
    - إذا طبقت مباشرة من `configure --apply` وكانت الخطة تتضمن مراجع/مزوّدي تنفيذ، فأبقِ `--allow-exec` معيّنًا لخطوة التطبيق أيضًا.

    أوضاع مفيدة:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    افتراضيات تطبيق `configure`:

    - تنظيف بيانات الاعتماد الثابتة المطابقة من `auth-profiles.json` للمزوّدين المستهدفين
    - تنظيف إدخالات `api_key` الثابتة القديمة من `auth.json`
    - تنظيف أسطر الأسرار المعروفة المطابقة من `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    تطبيق خطة محفوظة:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    ملاحظة التنفيذ:

    - يتخطى dry-run فحوصات التنفيذ ما لم يتم تعيين `--allow-exec`.
    - يرفض وضع الكتابة الخطط التي تحتوي على SecretRefs/مزوّدين للتنفيذ ما لم يتم تعيين `--allow-exec`.

    لتفاصيل عقد الهدف/المسار الصارمة وقواعد الرفض الدقيقة، راجع [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## سياسة السلامة أحادية الاتجاه

<Warning>
لا يكتب OpenClaw عمدًا نسخًا احتياطية للتراجع تحتوي على قيم أسرار تاريخية بالنص الصريح.
</Warning>

نموذج السلامة:

- يجب أن ينجح الفحص المسبق قبل وضع الكتابة
- يتم التحقق من تفعيل وقت التشغيل قبل الالتزام
- يحدّث التطبيق الملفات باستخدام استبدال ملفات ذري واستعادة بأفضل جهد عند الفشل

## ملاحظات توافق المصادقة القديمة

بالنسبة إلى بيانات الاعتماد الثابتة، لم يعد وقت التشغيل يعتمد على تخزين المصادقة القديم بالنص الصريح.

- مصدر بيانات اعتماد وقت التشغيل هو اللقطة المحلولة في الذاكرة.
- تُنظَّف إدخالات `api_key` الثابتة القديمة عند اكتشافها.
- يبقى سلوك التوافق المتعلق بـ OAuth منفصلًا.

## ملاحظة واجهة الويب

بعض اتحادات SecretInput أسهل إعدادًا في وضع المحرر الخام منها في وضع النموذج.

## ذو صلة

- [المصادقة](/ar/gateway/authentication) — إعداد المصادقة
- [CLI: الأسرار](/ar/cli/secrets) — أوامر CLI
- [متغيرات البيئة](/ar/help/environment) — أسبقية البيئة
- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface) — سطح بيانات الاعتماد
- [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract) — تفاصيل عقد الخطة
- [الأمان](/ar/gateway/security) — وضع الأمان
