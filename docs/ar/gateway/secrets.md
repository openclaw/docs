---
read_when:
    - تكوين SecretRefs لبيانات اعتماد المزوّد ومراجع `auth-profiles.json`
    - تشغيل إعادة تحميل الأسرار، والتدقيق، والتكوين، والتطبيق بأمان في بيئات الإنتاج
    - فهم الفشل السريع عند بدء التشغيل، وتصفية الأسطح غير النشطة، وسلوك آخر حالة سليمة معروفة
summary: 'إدارة الأسرار: عقد SecretRef، وسلوك لقطة Runtime، والتنظيف الآمن أحادي الاتجاه'
title: إدارة الأسرار
x-i18n:
    generated_at: "2026-04-24T07:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

يدعم OpenClaw إضافة SecretRefs بحيث لا يلزم تخزين بيانات الاعتماد المدعومة كنص صريح في التكوين.

لا يزال النص الصريح يعمل. وتكون SecretRefs اختيارية لكل بيانات اعتماد على حدة.

## الأهداف ونموذج Runtime

تُحل الأسرار إلى لقطة Runtime موجودة في الذاكرة.

- يتم التحليل بشكل eager أثناء التفعيل، وليس lazy ضمن مسارات الطلب.
- يفشل بدء التشغيل بسرعة عندما يتعذر تحليل SecretRef نشط فعليًا.
- تستخدم إعادة التحميل تبديلًا ذريًا: نجاح كامل، أو الاحتفاظ بآخر لقطة سليمة معروفة.
- تؤدي مخالفات سياسة SecretRef (على سبيل المثال ملفات تعريف المصادقة في وضع OAuth مع إدخال SecretRef) إلى فشل التفعيل قبل تبديل Runtime.
- تقرأ طلبات Runtime من اللقطة النشطة داخل الذاكرة فقط.
- بعد أول تفعيل/تحميل ناجح للتكوين، تستمر مسارات كود Runtime في قراءة تلك اللقطة النشطة داخل الذاكرة إلى أن تنجح إعادة تحميل وتستبدلها.
- تقرأ مسارات التسليم الصادر أيضًا من تلك اللقطة النشطة (على سبيل المثال تسليم ردود/خيوط Discord وإرسال إجراءات Telegram)؛ فهي لا تعيد تحليل SecretRefs عند كل إرسال.

وهذا يُبقي انقطاعات مزوّد الأسرار خارج مسارات الطلب الساخنة.

## تصفية الأسطح النشطة

يتم التحقق من SecretRefs فقط على الأسطح النشطة فعليًا.

- الأسطح المفعلة: تمنع المراجع غير المحللة بدء التشغيل/إعادة التحميل.
- الأسطح غير النشطة: لا تمنع المراجع غير المحللة بدء التشغيل/إعادة التحميل.
- تصدر المراجع غير النشطة تشخيصات غير قاتلة بالرمز `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

أمثلة على الأسطح غير النشطة:

- إدخالات القناة/الحساب المعطلة.
- بيانات اعتماد القناة ذات المستوى الأعلى التي لا يرثها أي حساب مفعّل.
- أسطح الأدوات/الميزات المعطلة.
- المفاتيح الخاصة بمزوّدي البحث على الويب التي لا يحددها `tools.web.search.provider`.
  في الوضع التلقائي (عند عدم ضبط المزوّد)، تتم استشارة المفاتيح حسب الأسبقية لاكتشاف المزوّد تلقائيًا إلى أن ينجح أحدها.
  وبعد الاختيار، تُعامل مفاتيح المزوّدين غير المحددين على أنها غير نشطة إلى أن يتم اختيارها.
- مواد مصادقة SSH الخاصة بـ sandbox (`agents.defaults.sandbox.ssh.identityData`,
  و`certificateData`، و`knownHostsData`، بالإضافة إلى تجاوزات كل وكيل) تكون نشطة فقط
  عندما تكون الواجهة الخلفية الفعلية لـ sandbox هي `ssh` للوكيل الافتراضي أو لوكيل مفعّل.
- تكون SecretRefs الخاصة بـ `gateway.remote.token` / `gateway.remote.password` نشطة إذا تحقق أحد ما يلي:
  - `gateway.mode=remote`
  - تم تكوين `gateway.remote.url`
  - كان `gateway.tailscale.mode` يساوي `serve` أو `funnel`
  - في الوضع المحلي من دون تلك الأسطح البعيدة:
    - يكون `gateway.remote.token` نشطًا عندما يمكن أن تفوز مصادقة الرمز المميز ولا يكون هناك رمز مميز مكوّن في env/auth.
    - يكون `gateway.remote.password` نشطًا فقط عندما يمكن أن تفوز مصادقة كلمة المرور ولا تكون هناك كلمة مرور مكوّنة في env/auth.
- تكون SecretRef الخاصة بـ `gateway.auth.token` غير نشطة لتحليل مصادقة بدء التشغيل عندما يكون `OPENCLAW_GATEWAY_TOKEN` مضبوطًا، لأن إدخال الرمز المميز من env يفوز في ذلك Runtime.

## تشخيصات سطح مصادقة Gateway

عندما يتم تكوين SecretRef على `gateway.auth.token` أو `gateway.auth.password` أو
`gateway.remote.token` أو `gateway.remote.password`، تسجل عملية بدء تشغيل/إعادة تحميل Gateway
حالة السطح بشكل صريح:

- `active`: SecretRef جزء من سطح المصادقة الفعلي ويجب تحليلها.
- `inactive`: يتم تجاهل SecretRef في هذا Runtime لأن سطح مصادقة آخر يفوز، أو
  لأن المصادقة البعيدة معطلة/غير نشطة.

تُسجل هذه الإدخالات بالرمز `SECRETS_GATEWAY_AUTH_SURFACE` وتتضمن السبب المستخدم في
سياسة السطح النشط، بحيث يمكنك معرفة سبب اعتبار بيانات الاعتماد نشطة أو غير نشطة.

## فحص preflight المرجعي أثناء الإعداد الأولي

عندما يعمل الإعداد الأولي في الوضع التفاعلي وتختار تخزين SecretRef، يجري OpenClaw تحقق preflight قبل الحفظ:

- مراجع env: يتحقق من اسم متغير البيئة ويؤكد أن قيمة غير فارغة مرئية أثناء الإعداد.
- مراجع المزوّد (`file` أو `exec`): يتحقق من اختيار المزوّد، ويحل `id`، ويفحص نوع القيمة المحللة.
- مسار إعادة استخدام quickstart: عندما تكون `gateway.auth.token` بالفعل SecretRef، يحللها الإعداد الأولي قبل probe/dashboard bootstrap (لمراجع `env` و`file` و`exec`) باستخدام حاجز الفشل السريع نفسه.

إذا فشل التحقق، يعرض الإعداد الأولي الخطأ ويتيح لك إعادة المحاولة.

## عقد SecretRef

استخدم صيغة كائن واحدة في كل مكان:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

التحقق:

- يجب أن يطابق `provider` التعبير `^[a-z][a-z0-9_-]{0,63}$`
- يجب أن يطابق `id` التعبير `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

التحقق:

- يجب أن يطابق `provider` التعبير `^[a-z][a-z0-9_-]{0,63}$`
- يجب أن يكون `id` مؤشر JSON مطلقًا (`/...`)
- تهريب RFC6901 في المقاطع: `~` => `~0`، `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

التحقق:

- يجب أن يطابق `provider` التعبير `^[a-z][a-z0-9_-]{0,63}$`
- يجب أن يطابق `id` التعبير `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا يحتوي `id` على `.` أو `..` كمقاطع مسار مفصولة بشرطة مائلة (على سبيل المثال يتم رفض `a/../b`)

## تكوين المزوّد

عرّف المزوّدين تحت `secrets.providers`:

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

### مزوّد Env

- قائمة سماح اختيارية عبر `allowlist`.
- تؤدي قيم env المفقودة/الفارغة إلى فشل التحليل.

### مزوّد File

- يقرأ الملف المحلي من `path`.
- يتوقع `mode: "json"` حمولة كائن JSON ويحل `id` كمؤشر.
- يتوقع `mode: "singleValue"` أن يكون معرّف المرجع `"value"` ويعيد محتويات الملف.
- يجب أن يجتاز المسار فحوصات الملكية/الأذونات.
- ملاحظة فشل مغلق على Windows: إذا تعذر التحقق من ACL لمسار ما، يفشل التحليل. وبالنسبة إلى المسارات الموثوقة فقط، اضبط `allowInsecurePath: true` على ذلك المزوّد لتجاوز فحوصات أمان المسار.

### مزوّد Exec

- يشغّل مسار الملف الثنائي المطلق المكوّن، من دون shell.
- افتراضيًا، يجب أن يشير `command` إلى ملف عادي (وليس symlink).
- اضبط `allowSymlinkCommand: true` للسماح بمسارات أوامر symlink (مثل Homebrew shims). ويتحقق OpenClaw من المسار الهدف بعد التحليل.
- اجمع `allowSymlinkCommand` مع `trustedDirs` لمسارات مدير الحزم (مثل `["/opt/homebrew"]`).
- يدعم المهلة الزمنية، ومهلة عدم وجود مخرجات، وحدود بايتات المخرجات، وقائمة سماح env، والأدلة الموثوقة.
- ملاحظة فشل مغلق على Windows: إذا تعذر التحقق من ACL لمسار الأمر، يفشل التحليل. وبالنسبة إلى المسارات الموثوقة فقط، اضبط `allowInsecurePath: true` على ذلك المزوّد لتجاوز فحوصات أمان المسار.

حمولة الطلب (`stdin`):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

حمولة الاستجابة (`stdout`):

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

## أمثلة تكامل Exec

### CLI الخاص بـ 1Password

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // مطلوب لملفات Homebrew الثنائية المرتبطة بـ symlink
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

### CLI الخاص بـ HashiCorp Vault

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // مطلوب لملفات Homebrew الثنائية المرتبطة بـ symlink
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

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // مطلوب لملفات Homebrew الثنائية المرتبطة بـ symlink
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

## متغيرات البيئة الخاصة بخادم MCP

تدعم متغيرات env الخاصة بخادم MCP المكوّنة عبر `plugins.entries.acpx.config.mcpServers` إدخال SecretInput. وهذا يُبقي مفاتيح API والرموز المميزة خارج التكوين النصي الصريح:

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

لا تزال قيم السلاسل النصية الصريحة تعمل. يتم تحليل المراجع من نوع قالب env مثل `${MCP_SERVER_API_KEY}` وكائنات SecretRef أثناء تفعيل Gateway قبل إنشاء عملية خادم MCP. وكما في أسطح SecretRef الأخرى، تمنع المراجع غير المحللة التفعيل فقط عندما يكون Plugin ‏`acpx` نشطًا فعليًا.

## مواد مصادقة SSH الخاصة بـ Sandbox

تدعم الواجهة الخلفية الأساسية `ssh` لـ sandbox أيضًا SecretRefs لمواد مصادقة SSH:

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

سلوك Runtime:

- يحلل OpenClaw هذه المراجع أثناء تفعيل sandbox، وليس lazy أثناء كل استدعاء SSH.
- تُكتب القيم المحللة إلى ملفات مؤقتة بأذونات تقييدية وتُستخدم في تكوين SSH المُولَّد.
- إذا لم تكن الواجهة الخلفية الفعلية لـ sandbox هي `ssh`، تبقى هذه المراجع غير نشطة ولا تمنع بدء التشغيل.

## سطح بيانات الاعتماد المدعوم

تُسرد بيانات الاعتماد المدعومة وغير المدعومة الأساسية في:

- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)

يتم استبعاد بيانات الاعتماد المُنشأة في Runtime أو الدوّارة ومواد تحديث OAuth عمدًا من التحليل للقراءة فقط الخاص بـ SecretRef.

## السلوك المطلوب والأسبقية

- الحقل من دون مرجع: من دون تغيير.
- الحقل الذي يحتوي على مرجع: مطلوب على الأسطح النشطة أثناء التفعيل.
- إذا وُجد كل من النص الصريح والمرجع، يفوز المرجع على مسارات الأسبقية المدعومة.
- إن قيمة التنقيح `__OPENCLAW_REDACTED__` محجوزة للتنقيح/الاستعادة الداخلية للتكوين ويتم رفضها كبيانات تكوين مقدمة حرفيًا.

إشارات التحذير والتدقيق:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (تحذير Runtime)
- `REF_SHADOWED` (نتيجة تدقيق عندما تكون بيانات الاعتماد في `auth-profiles.json` أعلى أولوية من المراجع في `openclaw.json`)

سلوك التوافق مع Google Chat:

- تكون `serviceAccountRef` أعلى أولوية من `serviceAccount` النصية الصريحة.
- يتم تجاهل القيمة النصية الصريحة عندما يكون المرجع الشقيق مضبوطًا.

## محفزات التفعيل

يعمل تفعيل الأسرار عند:

- بدء التشغيل (preflight بالإضافة إلى التفعيل النهائي)
- مسار التطبيق السريع لإعادة تحميل التكوين
- مسار فحص إعادة التشغيل لإعادة تحميل التكوين
- إعادة التحميل اليدوية عبر `secrets.reload`
- Gateway config write RPC preflight (`config.set` / `config.apply` / `config.patch`) من أجل قابلية تحليل SecretRef على الأسطح النشطة داخل حمولة التكوين المقدمة قبل حفظ التعديلات

عقد التفعيل:

- يبدّل النجاح اللقطة بشكل ذري.
- يؤدي فشل بدء التشغيل إلى إجهاض بدء تشغيل Gateway.
- يؤدي فشل إعادة التحميل أثناء Runtime إلى الاحتفاظ بآخر لقطة سليمة معروفة.
- يؤدي فشل preflight في Write-RPC إلى رفض التكوين المقدم مع إبقاء كل من التكوين على القرص ولقطة Runtime النشطة من دون تغيير.
- لا يؤدي تقديم رمز مميز صريح خاص بالقناة لكل استدعاء إلى مساعد/أداة صادرة إلى تشغيل تفعيل SecretRef؛ إذ تبقى نقاط التفعيل عند بدء التشغيل، وإعادة التحميل، و`secrets.reload` الصريح.

## إشارات الحالة المتدهورة والمستعادة

عندما يفشل التفعيل وقت إعادة التحميل بعد حالة سليمة، يدخل OpenClaw في حالة أسرار متدهورة.

أكواد حدث النظام والسجل لمرة واحدة:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

السلوك:

- متدهور: يحتفظ Runtime بآخر لقطة سليمة معروفة.
- مستعاد: يُصدر مرة واحدة بعد التفعيل الناجح التالي.
- تسجّل الإخفاقات المتكررة أثناء الحالة المتدهورة بالفعل تحذيرات لكنها لا تغمر الأحداث.
- لا يصدر الفشل السريع عند بدء التشغيل أحداث التدهور لأن Runtime لم يصبح نشطًا أصلًا.

## التحليل في مسار الأوامر

يمكن لمسارات الأوامر الاشتراك في تحليل SecretRef المدعوم عبر Gateway snapshot RPC.

هناك سلوكان عامان:

- مسارات أوامر صارمة (على سبيل المثال مسارات الذاكرة البعيدة في `openclaw memory` و`openclaw qr --remote` عندما يحتاج إلى مراجع الأسرار المشتركة البعيدة) تقرأ من اللقطة النشطة وتفشل سريعًا عندما لا تكون SecretRef المطلوبة متاحة.
- مسارات الأوامر للقراءة فقط (على سبيل المثال `openclaw status` و`openclaw status --all` و`openclaw channels status` و`openclaw channels resolve` و`openclaw security audit` وتدفقات doctor/config repair للقراءة فقط) تفضّل أيضًا اللقطة النشطة، لكنها تتدهور بدلًا من الإجهاض عندما لا تكون SecretRef المستهدفة متاحة في مسار الأمر هذا.

سلوك القراءة فقط:

- عندما يكون Gateway قيد التشغيل، تقرأ هذه الأوامر من اللقطة النشطة أولًا.
- إذا كان تحليل Gateway غير مكتمل أو كان Gateway غير متاح، فإنها تحاول احتياطًا محليًا مستهدفًا لسطح الأمر المحدد.
- إذا ظلت SecretRef المستهدفة غير متاحة، يستمر الأمر مع خرج قراءة فقط متدهور وتشخيصات صريحة مثل “configured but unavailable in this command path”.
- هذا السلوك المتدهور محلي على مستوى الأمر فقط. وهو لا يضعف مسارات بدء التشغيل، أو إعادة التحميل، أو الإرسال/المصادقة في Runtime.

ملاحظات أخرى:

- تتم معالجة تحديث اللقطة بعد تدوير السر في الواجهة الخلفية عبر `openclaw secrets reload`.
- طريقة Gateway RPC المستخدمة بواسطة مسارات الأوامر هذه هي: `secrets.resolve`.

## سير عمل التدقيق والتكوين

تدفق التشغيل الافتراضي:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

تتضمن النتائج:

- قيمًا نصية صريحة مخزنة (`openclaw.json` و`auth-profiles.json` و`.env` وملفات `agents/*/agent/models.json` المولدة)
- بقايا ترويسات مزوّد حساسة نصية صريحة في إدخالات `models.json` المولدة
- مراجع غير محللة
- تظليل الأسبقية (`auth-profiles.json` يأخذ أولوية على المراجع في `openclaw.json`)
- بقايا قديمة (`auth.json` وتذكيرات OAuth)

ملاحظة حول Exec:

- افتراضيًا، يتخطى التدقيق فحوصات قابلية تحليل SecretRef الخاصة بـ exec لتجنب الآثار الجانبية للأوامر.
- استخدم `openclaw secrets audit --allow-exec` لتنفيذ مزوّدي exec أثناء التدقيق.

ملاحظة حول بقايا الترويسات:

- يعتمد اكتشاف ترويسات المزوّد الحساسة على استدلال قائم على الأسماء (أسماء وأجزاء شائعة لترويسات المصادقة/بيانات الاعتماد مثل `authorization` و`x-api-key` و`token` و`secret` و`password` و`credential`).

### `secrets configure`

مساعد تفاعلي يقوم بما يلي:

- يكوّن `secrets.providers` أولًا (`env`/`file`/`exec`، إضافة/تعديل/إزالة)
- يتيح لك تحديد الحقول المدعومة الحاملة للأسرار في `openclaw.json` بالإضافة إلى `auth-profiles.json` لنطاق وكيل واحد
- يمكنه إنشاء ربط `auth-profiles.json` جديد مباشرةً داخل محدد الهدف
- يلتقط تفاصيل SecretRef (`source` و`provider` و`id`)
- يجري تحليل preflight
- يمكنه التطبيق فورًا

ملاحظة حول Exec:

- يتخطى preflight فحوصات SecretRef الخاصة بـ exec ما لم يتم ضبط `--allow-exec`.
- إذا طبّقت مباشرةً من `configure --apply` وكانت الخطة تتضمن مراجع/مزوّدين من نوع exec، فأبقِ `--allow-exec` مضبوطًا لخطوة التطبيق أيضًا.

أوضاع مفيدة:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

الافتراضيات في تطبيق `configure`:

- تنظيف بيانات الاعتماد الثابتة المطابقة من `auth-profiles.json` للمزوّدين المستهدفين
- تنظيف إدخالات `api_key` الثابتة القديمة من `auth.json`
- تنظيف أسطر الأسرار المعروفة المطابقة من `<config-dir>/.env`

### `secrets apply`

طبّق خطة محفوظة:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

ملاحظة حول Exec:

- يتخطى dry-run فحوصات exec ما لم يتم ضبط `--allow-exec`.
- يرفض وضع الكتابة الخطط التي تحتوي على SecretRefs/مزوّدين من نوع exec ما لم يتم ضبط `--allow-exec`.

للحصول على تفاصيل عقد الهدف/المسار الصارم وقواعد الرفض الدقيقة، راجع:

- [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract)

## سياسة الأمان أحادية الاتجاه

لا يكتب OpenClaw عمدًا نسخًا احتياطية للاستعادة تحتوي على قيم أسرار نصية صريحة تاريخية.

نموذج الأمان:

- يجب أن ينجح preflight قبل وضع الكتابة
- يتم التحقق من تفعيل Runtime قبل الالتزام
- يقوم apply بتحديث الملفات باستخدام استبدال ذري للملفات مع استعادة بأفضل جهد عند الفشل

## ملاحظات التوافق مع المصادقة القديمة

بالنسبة إلى بيانات الاعتماد الثابتة، لم يعد Runtime يعتمد على التخزين القديم النصي الصريح للمصادقة.

- مصدر بيانات الاعتماد في Runtime هو اللقطة المحللة داخل الذاكرة.
- يتم تنظيف إدخالات `api_key` الثابتة القديمة عند اكتشافها.
- يبقى سلوك التوافق المتعلق بـ OAuth منفصلًا.

## ملاحظة حول Web UI

بعض أنواع الاتحاد في SecretInput يسهل تكوينها في وضع المحرر الخام أكثر من وضع النموذج.

## وثائق ذات صلة

- أوامر CLI: [secrets](/ar/cli/secrets)
- تفاصيل عقد الخطة: [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract)
- سطح بيانات الاعتماد: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- إعداد المصادقة: [المصادقة](/ar/gateway/authentication)
- الوضعية الأمنية: [الأمان](/ar/gateway/security)
- أسبقية البيئة: [متغيرات البيئة](/ar/help/environment)
