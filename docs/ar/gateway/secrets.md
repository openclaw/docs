---
read_when:
    - تهيئة SecretRef لبيانات اعتماد المزوّد ومراجع `auth-profiles.json`
    - تشغيل إعادة تحميل الأسرار والتدقيق والتهيئة والتطبيق بأمان في بيئة الإنتاج
    - فهم الإخفاق السريع عند بدء التشغيل، وتصفية الأسطح غير النشطة، وسلوك آخر حالة سليمة معروفة
sidebarTitle: Secrets management
summary: 'إدارة الأسرار: عقد SecretRef وسلوك لقطة وقت التشغيل والتنقية الآمنة أحادية الاتجاه'
title: إدارة الأسرار
x-i18n:
    generated_at: "2026-04-26T11:31:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

يدعم OpenClaw مراجع SecretRef الإضافية بحيث لا يلزم تخزين بيانات الاعتماد المدعومة كنص صريح في الإعدادات.

<Note>
لا يزال النص الصريح يعمل. ومراجع SecretRef اختيارية لكل بيانات اعتماد على حدة.
</Note>

## الأهداف ونموذج وقت التشغيل

يتم تحليل الأسرار إلى لقطة وقت تشغيل داخل الذاكرة.

- يتم التحليل بشكل مسبق أثناء التفعيل، وليس بشكل كسول على مسارات الطلب.
- يفشل بدء التشغيل سريعًا عندما يتعذر تحليل SecretRef نشط فعليًا.
- تستخدم إعادة التحميل التبديل الذري: نجاح كامل، أو الاحتفاظ بآخر لقطة سليمة معروفة.
- تؤدي انتهاكات سياسة SecretRef (على سبيل المثال، ملفات تعريف مصادقة في وضع OAuth مقترنة بمدخل SecretRef) إلى فشل التفعيل قبل تبديل وقت التشغيل.
- تقرأ طلبات وقت التشغيل من اللقطة النشطة داخل الذاكرة فقط.
- بعد أول تفعيل/تحميل ناجح للإعدادات، تستمر مسارات شيفرة وقت التشغيل في القراءة من تلك اللقطة النشطة داخل الذاكرة إلى أن تُجري إعادة تحميل ناجحة عملية التبديل.
- تقرأ مسارات التسليم الصادرة أيضًا من تلك اللقطة النشطة (على سبيل المثال، تسليم الردود/السلاسل في Discord وإجراءات الإرسال في Telegram)؛ وهي لا تعيد تحليل SecretRef عند كل إرسال.

وهذا يُبقي أعطال موفري الأسرار خارج مسارات الطلب السريعة.

## تصفية الأسطح النشطة

يتم التحقق من مراجع SecretRef فقط على الأسطح النشطة فعليًا.

- الأسطح المفعلة: تمنع المراجع غير المحللة بدء التشغيل/إعادة التحميل.
- الأسطح غير النشطة: لا تمنع المراجع غير المحللة بدء التشغيل/إعادة التحميل.
- تصدر المراجع غير النشطة تشخيصات غير قاتلة بالرمز `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="أمثلة على الأسطح غير النشطة">
    - إدخالات القنوات/الحسابات المعطلة.
    - بيانات اعتماد القنوات على المستوى الأعلى التي لا يرثها أي حساب مفعّل.
    - أسطح الأدوات/الميزات المعطلة.
    - المفاتيح الخاصة بمزوّد بحث الويب التي لا يحددها `tools.web.search.provider`. في وضع auto (عندما لا يكون المزوّد مضبوطًا)، تتم مراجعة المفاتيح حسب الأسبقية من أجل الاكتشاف التلقائي للمزوّد إلى أن يتم تحليل واحد منها. وبعد الاختيار، تُعامل مفاتيح المزوّدات غير المختارة كأسطح غير نشطة حتى يتم اختيارها.
    - مواد مصادقة Sandbox SSH ‏(`agents.defaults.sandbox.ssh.identityData` و`certificateData` و`knownHostsData`، بالإضافة إلى التجاوزات لكل وكيل) تكون نشطة فقط عندما تكون الواجهة الخلفية الفعلية لـ sandbox هي `ssh` للوكيل الافتراضي أو لوكيل مفعّل.
    - تكون مراجع SecretRef الخاصة بـ `gateway.remote.token` / `gateway.remote.password` نشطة إذا تحقق أحد ما يلي:
      - `gateway.mode=remote`
      - تم تهيئة `gateway.remote.url`
      - `gateway.tailscale.mode` هي `serve` أو `funnel`
      - في الوضع المحلي من دون تلك الأسطح البعيدة:
        - تكون `gateway.remote.token` نشطة عندما يمكن أن تفوز مصادقة token ولا يكون هناك env/auth token مهيأ.
        - تكون `gateway.remote.password` نشطة فقط عندما يمكن أن تفوز مصادقة password ولا يكون هناك env/auth password مهيأ.
    - يكون SecretRef الخاص بـ `gateway.auth.token` غير نشط لتحليل مصادقة بدء التشغيل عندما تكون `OPENCLAW_GATEWAY_TOKEN` مضبوطة، لأن مدخل token من env يفوز في وقت التشغيل هذا.
  </Accordion>
</AccordionGroup>

## تشخيصات سطح مصادقة Gateway

عندما تتم تهيئة SecretRef على `gateway.auth.token` أو `gateway.auth.password` أو `gateway.remote.token` أو `gateway.remote.password`، تسجل سجلات بدء التشغيل/إعادة التحميل في Gateway حالة السطح بشكل صريح:

- `active`: يكون SecretRef جزءًا من سطح المصادقة الفعلي ويجب تحليله.
- `inactive`: يتم تجاهل SecretRef في وقت التشغيل هذا لأن سطح مصادقة آخر يفوز، أو لأن المصادقة البعيدة معطلة/غير نشطة.

تُسجَّل هذه الإدخالات باستخدام `SECRETS_GATEWAY_AUTH_SURFACE` وتتضمن السبب المستخدم بواسطة سياسة السطح النشط، بحيث يمكنك معرفة سبب التعامل مع بيانات الاعتماد على أنها نشطة أو غير نشطة.

## فحص ما قبل الحفظ لمراجع التهيئة الأولى

عندما تعمل التهيئة الأولى في الوضع التفاعلي وتختار تخزين SecretRef، يقوم OpenClaw بإجراء تحقق مسبق قبل الحفظ:

- مراجع Env: يتحقق من اسم متغير البيئة ويؤكد أن قيمة غير فارغة مرئية أثناء الإعداد.
- مراجع المزوّد (`file` أو `exec`): يتحقق من اختيار المزوّد، ويحل `id`، ويفحص نوع القيمة المحللة.
- مسار إعادة استخدام Quickstart: عندما تكون `gateway.auth.token` بالفعل SecretRef، يقوم الإعداد الأولي بتحليلها قبل تهيئة probe/dashboard (لمراجع `env` و`file` و`exec`) باستخدام بوابة الإخفاق السريع نفسها.

إذا فشل التحقق، تعرض التهيئة الأولى الخطأ وتسمح لك بإعادة المحاولة.

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

    التحقق:

    - يجب أن يطابق `provider` التعبير `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يطابق `id` التعبير `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    التحقق:

    - يجب أن يطابق `provider` التعبير `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يكون `id` مؤشر JSON مطلقًا (`/...`)
    - تهريب RFC6901 في المقاطع: `~` => `~0`، و`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    التحقق:

    - يجب أن يطابق `provider` التعبير `^[a-z][a-z0-9_-]{0,63}$`
    - يجب أن يطابق `id` التعبير `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - يجب ألا يحتوي `id` على `.` أو `..` كمقاطع مسار مفصولة بشرطة مائلة (على سبيل المثال، يتم رفض `a/../b`)

  </Tab>
</Tabs>

## إعدادات المزوّد

عرّف المزوّدين تحت `secrets.providers`:

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
  <Accordion title="موفّر Env">
    - قائمة سماح اختيارية عبر `allowlist`.
    - تؤدي قيم env المفقودة/الفارغة إلى فشل التحليل.
  </Accordion>
  <Accordion title="موفّر File">
    - يقرأ ملفًا محليًا من `path`.
    - يتوقع `mode: "json"` حمولة كائن JSON ويحل `id` كمؤشر.
    - يتوقع `mode: "singleValue"` أن يكون معرّف المرجع هو `"value"` ويعيد محتويات الملف.
    - يجب أن يجتاز المسار فحوصات الملكية/الأذونات.
    - ملاحظة الإخفاق المغلق في Windows: إذا لم يكن تحقق ACL متاحًا لمسار ما، يفشل التحليل. وبالنسبة إلى المسارات الموثوقة فقط، اضبط `allowInsecurePath: true` على ذلك المزوّد لتجاوز فحوصات أمان المسار.
  </Accordion>
  <Accordion title="موفّر Exec">
    - يشغّل مسار binary مطلقًا مهيأ، من دون shell.
    - افتراضيًا، يجب أن يشير `command` إلى ملف عادي (وليس symlink).
    - اضبط `allowSymlinkCommand: true` للسماح بمسارات أوامر symlink (على سبيل المثال، Homebrew shims). ويتحقق OpenClaw من مسار الهدف المحلول.
    - قرّن `allowSymlinkCommand` مع `trustedDirs` لمسارات مديري الحزم (على سبيل المثال `["/opt/homebrew"]`).
    - يدعم timeout ومهلة عدم وجود مخرجات وحدود بايتات الإخراج وقائمة سماح env والأدلة الموثوقة.
    - ملاحظة الإخفاق المغلق في Windows: إذا لم يكن تحقق ACL متاحًا لمسار الأمر، يفشل التحليل. وبالنسبة إلى المسارات الموثوقة فقط، اضبط `allowInsecurePath: true` على ذلك المزوّد لتجاوز فحوصات أمان المسار.

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
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## أمثلة على تكامل Exec

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

تدعم متغيرات env الخاصة بخادم MCP المهيأة عبر `plugins.entries.acpx.config.mcpServers` نوع SecretInput. وهذا يُبقي مفاتيح API والرموز المميزة خارج الإعدادات النصية الصريحة:

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

لا تزال قيم السلاسل النصية الصريحة تعمل. ويتم تحليل مراجع قوالب env مثل `${MCP_SERVER_API_KEY}` وكائنات SecretRef أثناء تفعيل Gateway قبل تشغيل عملية خادم MCP. وكما هو الحال مع أسطح SecretRef الأخرى، لا تمنع المراجع غير المحللة التفعيل إلا عندما يكون Plugin ‏`acpx` نشطًا فعليًا.

## مواد مصادقة Sandbox SSH

تدعم الواجهة الخلفية الأساسية `ssh` الخاصة بـ sandbox أيضًا مراجع SecretRef لمواد مصادقة SSH:

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

- يقوم OpenClaw بتحليل هذه المراجع أثناء تفعيل sandbox، وليس بشكل كسول أثناء كل استدعاء SSH.
- تُكتب القيم المحللة إلى ملفات مؤقتة بأذونات مقيّدة وتُستخدم في إعدادات SSH المُولدة.
- إذا لم تكن الواجهة الخلفية الفعلية لـ sandbox هي `ssh`، فستبقى هذه المراجع غير نشطة ولن تمنع بدء التشغيل.

## سطح بيانات الاعتماد المدعوم

تُدرج بيانات الاعتماد المدعومة وغير المدعومة الرسمية في:

- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)

<Note>
يتم استبعاد بيانات الاعتماد المُنشأة وقت التشغيل أو المتغيرة، ومواد تحديث OAuth عمدًا من تحليل SecretRef للقراءة فقط.
</Note>

## السلوك المطلوب والأسبقية

- الحقل بدون مرجع: لا يتغير.
- الحقل مع مرجع: مطلوب على الأسطح النشطة أثناء التفعيل.
- إذا وُجد كل من النص الصريح والمرجع، فإن المرجع يأخذ الأسبقية على مسارات الأسبقية المدعومة.
- إن القيمة الحارسة للتنقيح `__OPENCLAW_REDACTED__` مخصصة للتنقيح/الاستعادة الداخلية للإعدادات، ويُرفض استخدامها كبيانات إعدادات مُدخلة حرفيًا.

إشارات التحذير والتدقيق:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (تحذير وقت التشغيل)
- `REF_SHADOWED` (نتيجة تدقيق عندما تأخذ بيانات اعتماد `auth-profiles.json` الأسبقية على مراجع `openclaw.json`)

سلوك التوافق مع Google Chat:

- يأخذ `serviceAccountRef` الأسبقية على `serviceAccount` النصي الصريح.
- تُتجاهل القيمة النصية الصريحة عند ضبط المرجع المجاور.

## مشغلات التفعيل

يعمل تفعيل الأسرار عند:

- بدء التشغيل (فحص مسبق + التفعيل النهائي)
- مسار التطبيق السريع لإعادة تحميل الإعدادات
- مسار فحص إعادة التشغيل لإعادة تحميل الإعدادات
- إعادة التحميل اليدوية عبر `secrets.reload`
- الفحص المسبق عبر RPC لكتابة إعدادات Gateway ‏(`config.set` / `config.apply` / `config.patch`) لقابلية تحليل SecretRef على الأسطح النشطة ضمن حمولة الإعدادات المُرسلة قبل حفظ التعديلات

عقد التفعيل:

- يؤدي النجاح إلى تبديل اللقطة ذريًا.
- يؤدي فشل بدء التشغيل إلى إلغاء بدء Gateway.
- يؤدي فشل إعادة التحميل وقت التشغيل إلى الاحتفاظ بآخر لقطة سليمة معروفة.
- يؤدي فشل الفحص المسبق عبر Write-RPC إلى رفض الإعدادات المُرسلة وإبقاء كل من إعدادات القرص ولقطة وقت التشغيل النشطة دون تغيير.
- لا يؤدي توفير token صريح لكل استدعاء في استدعاء أداة/مساعد صادر للقناة إلى تشغيل تفعيل SecretRef؛ إذ تبقى نقاط التفعيل هي بدء التشغيل وإعادة التحميل و`secrets.reload` الصريح.

## إشارات التدهور والتعافي

عندما يفشل التفعيل وقت إعادة التحميل بعد حالة سليمة، يدخل OpenClaw في حالة أسرار متدهورة.

أكواد حدث النظام والسجل أحادية الإطلاق:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

السلوك:

- التدهور: يحتفظ وقت التشغيل بآخر لقطة سليمة معروفة.
- التعافي: يُصدر مرة واحدة بعد التفعيل الناجح التالي.
- تسجل الإخفاقات المتكررة أثناء كون الحالة متدهورة بالفعل تحذيرات ولكنها لا تُغرق الأحداث.
- لا يؤدي الإخفاق السريع عند بدء التشغيل إلى إصدار أحداث تدهور لأن وقت التشغيل لم يصبح نشطًا أصلًا.

## التحليل في مسار الأوامر

يمكن لمسارات الأوامر الاشتراك في تحليل SecretRef المدعوم عبر RPC للّقطة الخاصة بـ Gateway.

هناك سلوكان عامّان:

<Tabs>
  <Tab title="مسارات أوامر صارمة">
    على سبيل المثال، مسارات الذاكرة البعيدة في `openclaw memory` و`openclaw qr --remote` عندما يحتاج إلى مراجع أسرار مشتركة بعيدة. وهي تقرأ من اللقطة النشطة وتفشل سريعًا عندما لا يكون SecretRef المطلوب متاحًا.
  </Tab>
  <Tab title="مسارات أوامر للقراءة فقط">
    على سبيل المثال، `openclaw status` و`openclaw status --all` و`openclaw channels status` و`openclaw channels resolve` و`openclaw security audit` وتدفقات doctor/config repair للقراءة فقط. وهي تفضّل أيضًا اللقطة النشطة، لكنها تتدهور بدلًا من الإلغاء عندما لا يكون SecretRef المستهدف متاحًا في مسار الأمر ذلك.

    سلوك القراءة فقط:

    - عندما تكون Gateway قيد التشغيل، تقرأ هذه الأوامر من اللقطة النشطة أولًا.
    - إذا كان تحليل Gateway غير مكتمل أو كانت Gateway غير متاحة، فإنها تحاول احتياطًا محليًا مستهدفًا لسطح الأمر المحدد.
    - إذا ظل SecretRef المستهدف غير متاح، يستمر الأمر مع مخرجات قراءة فقط متدهورة وتشخيصات صريحة مثل "مهيأ لكنه غير متاح في مسار الأمر هذا".
    - هذا السلوك المتدهور محلي للأمر فقط. وهو لا يضعف بدء التشغيل أو إعادة التحميل أو مسارات الإرسال/المصادقة في وقت التشغيل.

  </Tab>
</Tabs>

ملاحظات أخرى:

- تتم معالجة تحديث اللقطة بعد تدوير الأسرار في الواجهة الخلفية بواسطة `openclaw secrets reload`.
- طريقة Gateway RPC التي تستخدمها مسارات الأوامر هذه: `secrets.resolve`.

## سير عمل التدقيق والتهيئة

التدفق الافتراضي للمشغّل:

<Steps>
  <Step title="تدقيق الحالة الحالية">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="تهيئة SecretRefs">
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
    تتضمن النتائج ما يلي:

    - القيم النصية الصريحة المخزنة (`openclaw.json` و`auth-profiles.json` و`.env` و`agents/*/agent/models.json` المُولدة)
    - بقايا ترويسات المزوّد الحساسة النصية الصريحة في إدخالات `models.json` المُولدة
    - المراجع غير المحللة
    - تظليل الأسبقية (`auth-profiles.json` يأخذ الأولوية على مراجع `openclaw.json`)
    - البقايا القديمة (`auth.json` وتذكيرات OAuth)

    ملاحظة Exec:

    - افتراضيًا، يتخطى التدقيق فحوصات قابلية تحليل Exec SecretRef لتجنب الآثار الجانبية للأوامر.
    - استخدم `openclaw secrets audit --allow-exec` لتنفيذ موفري exec أثناء التدقيق.

    ملاحظة بقايا الترويسات:

    - يعتمد اكتشاف ترويسات المزوّد الحساسة على أسلوب استدلالي قائم على الاسم (أسماء وأجزاء ترويسات المصادقة/بيانات الاعتماد الشائعة مثل `authorization` و`x-api-key` و`token` و`secret` و`password` و`credential`).

  </Accordion>
  <Accordion title="secrets configure">
    مساعد تفاعلي يقوم بما يلي:

    - يهيّئ `secrets.providers` أولًا (`env`/`file`/`exec`، إضافة/تعديل/إزالة)
    - يتيح لك اختيار الحقول المدعومة الحاملة للأسرار في `openclaw.json` بالإضافة إلى `auth-profiles.json` لنطاق وكيل واحد
    - يمكنه إنشاء ربط `auth-profiles.json` جديد مباشرةً في أداة اختيار الهدف
    - يلتقط تفاصيل SecretRef ‏(`source` و`provider` و`id`)
    - يجري تحليلًا مسبقًا
    - يمكنه التطبيق فورًا

    ملاحظة Exec:

    - يتخطى الفحص المسبق فحوصات Exec SecretRef ما لم يتم ضبط `--allow-exec`.
    - إذا طبقت مباشرةً من `configure --apply` وكانت الخطة تتضمن مراجع/موفري exec، فأبقِ `--allow-exec` مضبوطًا لخطوة التطبيق أيضًا.

    أوضاع مفيدة:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    الإعدادات الافتراضية لتطبيق `configure`:

    - تنقية بيانات الاعتماد الثابتة المطابقة من `auth-profiles.json` للمزوّدين المستهدفين
    - تنقية إدخالات `api_key` الثابتة القديمة من `auth.json`
    - تنقية أسطر الأسرار المعروفة المطابقة من `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    طبّق خطة محفوظة:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    ملاحظة Exec:

    - يتخطى dry-run فحوصات exec ما لم يتم ضبط `--allow-exec`.
    - يرفض وضع الكتابة الخطط التي تحتوي على مراجع/موفري exec ما لم يتم ضبط `--allow-exec`.

    للحصول على تفاصيل عقد الهدف/المسار الصارمة وقواعد الرفض الدقيقة، راجع [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## سياسة الأمان أحادية الاتجاه

<Warning>
لا يكتب OpenClaw عمدًا نسخًا احتياطية للاسترجاع تحتوي على قيم أسرار تاريخية نصية صريحة.
</Warning>

نموذج الأمان:

- يجب أن ينجح الفحص المسبق قبل وضع الكتابة
- يتم التحقق من تفعيل وقت التشغيل قبل الالتزام
- يقوم apply بتحديث الملفات باستخدام استبدال ملفات ذري واستعادة بأفضل جهد عند الفشل

## ملاحظات التوافق مع المصادقة القديمة

بالنسبة إلى بيانات الاعتماد الثابتة، لم يعد وقت التشغيل يعتمد على تخزين المصادقة القديمة بالنص الصريح.

- مصدر بيانات الاعتماد في وقت التشغيل هو اللقطة المحللة داخل الذاكرة.
- تتم تنقية إدخالات `api_key` الثابتة القديمة عند اكتشافها.
- يظل سلوك التوافق المرتبط بـ OAuth منفصلًا.

## ملاحظة حول Web UI

بعض اتحادات SecretInput أسهل في التهيئة في وضع المحرر الخام مقارنةً بوضع النموذج.

## ذو صلة

- [المصادقة](/ar/gateway/authentication) — إعداد المصادقة
- [CLI: secrets](/ar/cli/secrets) — أوامر CLI
- [متغيرات البيئة](/ar/help/environment) — أسبقية البيئة
- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface) — سطح بيانات الاعتماد
- [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract) — تفاصيل عقد الخطة
- [الأمان](/ar/gateway/security) — الوضع الأمني
