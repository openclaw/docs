---
read_when:
    - إعادة حل مراجع الأسرار في وقت التشغيل
    - تدقيق بقايا النصوص الصريحة والمراجع غير المحلولة
    - تكوين SecretRefs وتطبيق تغييرات التنقيح أحادي الاتجاه
summary: مرجع CLI للأمر `openclaw secrets` (إعادة التحميل، التدقيق، التهيئة، التطبيق)
title: الأسرار
x-i18n:
    generated_at: "2026-07-12T05:43:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

أدِر مراجع الأسرار SecretRefs وحافظ على سلامة اللقطة النشطة لوقت التشغيل.

| الأمر       | الدور                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | استدعاء RPC في Gateway ‏(`secrets.reload`): يعيد تحليل المراجع ويستبدل لقطة وقت التشغيل فقط عند النجاح الكامل (من دون كتابة الإعدادات)                                                                      |
| `audit`     | فحص للقراءة فقط لمخازن الإعدادات/المصادقة/النماذج المُنشأة والمخلّفات القديمة بحثًا عن النصوص الصريحة والمراجع غير المحلولة وانحراف الأولوية (تُتخطى مراجع `exec` ما لم يُستخدم `--allow-exec`)                      |
| `configure` | مخطِّط تفاعلي لإعداد المزوّدين وربط الأهداف والفحص المسبق (يتطلب TTY)                                                                                                       |
| `apply`     | ينفّذ خطة محفوظة (يتحقق `--dry-run` فقط ويتخطى فحوصات `exec` افتراضيًا؛ ويرفض وضع الكتابة الخطط التي تتضمن `exec` ما لم يُستخدم `--allow-exec`)، ثم يزيل مخلّفات النصوص الصريحة المستهدفة |

دورة التشغيل الموصى بها:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

إذا كانت خطتك تتضمن مراجع أسرار SecretRefs أو مزوّدين من نوع `exec`، فمرّر `--allow-exec` إلى أمري `apply` في وضع التشغيل التجريبي ووضع الكتابة.

رموز الخروج لعمليات CI/البوابات:

- يُرجع `audit --check` الرمز `1` عند وجود نتائج.
- تُرجع المراجع غير المحلولة الرمز `2` (بغض النظر عن `--check`).

ذو صلة: [إدارة الأسرار](/ar/gateway/secrets) · [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface) · [الأمان](/ar/gateway/security)

## إعادة تحميل لقطة وقت التشغيل

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

يستخدم أسلوب RPC في Gateway المسمى `secrets.reload`. إذا فشل الحل، يحتفظ Gateway بآخر لقطة سليمة معروفة ويُرجع خطأً (من دون تفعيل جزئي). تتضمن استجابة JSON الحقل `warningCount`.

الخيارات: `--url <url>`، و`--token <token>`، و`--timeout <ms>`، و`--json`.

## التدقيق

يفحص حالة OpenClaw بحثًا عن:

- تخزين الأسرار كنص صريح
- المراجع غير المحلولة
- انحراف الأولوية (بيانات الاعتماد في `auth-profiles.json` التي تحجب مراجع `openclaw.json`)
- مخلّفات `agents/*/agent/models.json` المُنشأة (قيم `apiKey` للمزوّد وترويسات المزوّد الحساسة)
- المخلّفات القديمة (إدخالات مخزن المصادقة القديم، وتذكيرات OAuth)

يعتمد اكتشاف ترويسات المزوّد الحساسة على استدلال الاسم: إذ يضع علامة على الترويسات التي تتطابق أسماؤها مع أجزاء شائعة مرتبطة بالمصادقة أو بيانات الاعتماد (`authorization`، و`x-api-key`، و`token`، و`secret`، و`password`، و`credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

بنية التقرير:

- `status`:‏ `clean | findings | unresolved`
- `resolution`:‏ `refsChecked`، و`skippedExecRefs`، و`resolvabilityComplete`
- `summary`:‏ `plaintextCount`، و`unresolvedRefCount`، و`shadowedRefCount`، و`legacyResidueCount`
- رموز النتائج: `PLAINTEXT_FOUND`، و`REF_UNRESOLVED`، و`REF_SHADOWED`، و`LEGACY_RESIDUE`

## التهيئة (مساعد تفاعلي)

أنشئ تغييرات المزوّد وSecretRef تفاعليًا، وشغّل الفحص المسبق، وطبّقها اختياريًا:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

التدفق: إعداد المزوّد أولًا (إضافة/تعديل/إزالة الأسماء المستعارة في `secrets.providers`)، ثم ربط بيانات الاعتماد (تحديد الحقول وتعيين المراجع `{source, provider, id}`)، ثم الفحص المسبق والتطبيق الاختياري.

العلامات:

- `--providers-only`: هيّئ `secrets.providers` فقط، وتخطَّ ربط بيانات الاعتماد
- `--skip-provider-setup`: تخطَّ إعداد المزوّد، واربط بيانات الاعتماد بالمزوّدين الحاليين
- `--agent <id>`: احصر اكتشاف أهداف `auth-profiles.json` والكتابة فيها في مخزن وكيل واحد
- `--allow-exec`: اسمح بفحوصات مراجع الأسرار SecretRef من نوع `exec` أثناء الفحص المسبق/التطبيق (قد يؤدي ذلك إلى تنفيذ أوامر المزوّد)

لا يمكن الجمع بين `--providers-only` و`--skip-provider-setup`.

ملاحظات:

- يتطلب TTY تفاعليًا.
- يستهدف الحقول المحتوية على أسرار في `openclaw.json` بالإضافة إلى `auth-profiles.json` ضمن نطاق الوكيل المحدد؛ السطح القياسي المدعوم: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
- يدعم إنشاء عمليات ربط جديدة في `auth-profiles.json` مباشرةً ضمن تدفق أداة الاختيار.
- يشغّل تحليل الفحص المسبق قبل التطبيق.
- تفعّل الخطط المُنشأة خيارات التنقية افتراضيًا (`scrubEnv`، و`scrubAuthProfilesForProviderTargets`، و`scrubLegacyAuthJson`). لا يمكن التراجع عن تطبيق قيم النص الصريح بعد تنقيتها.
- من دون `--apply`، يظل CLI يعرض المطالبة `Apply this plan now?` بعد الفحص المسبق.
- مع `--apply` (ومن دون `--yes`)، يعرض CLI مطالبة إضافية لتأكيد الترحيل غير القابل للتراجع.
- يطبع `--json` الخطة مع تقرير الفحص المسبق، لكنه يظل يتطلب TTY تفاعليًا.

### أمان مزوّد `exec`

غالبًا ما تعرض عمليات تثبيت Homebrew ملفات تنفيذية مرتبطة رمزيًا ضمن `/opt/homebrew/bin/*`. اضبط `allowSymlinkCommand: true` فقط عند الحاجة إلى مسارات موثوقة لمدير الحزم، مع إقرانها بـ `trustedDirs` (مثل `["/opt/homebrew"]`). في Windows، إذا تعذر التحقق من ACL لمسار مزوّد، يفشل OpenClaw في الوضع المغلق؛ وللمسارات الموثوقة فقط، اضبط `allowInsecurePath: true` على ذلك المزوّد لتجاوز فحص أمان المسار.

## تطبيق خطة محفوظة

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

يتحقق `--dry-run` من الفحص المسبق من دون كتابة ملفات؛ وتُتخطى فحوصات مراجع الأسرار SecretRef من نوع `exec` افتراضيًا في وضع التشغيل التجريبي. يرفض وضع الكتابة الخطط التي تحتوي على مراجع أسرار SecretRefs أو مزوّدين من نوع `exec` ما لم يُستخدم `--allow-exec`. استخدم `--allow-exec` للاشتراك في فحوصات/تنفيذ مزوّد `exec` في أيٍّ من الوضعين.

ما قد يحدّثه `apply`:

- `openclaw.json` (أهداف SecretRef مع إضافة المزوّدين أو تحديثهم أو حذفهم)
- `auth-profiles.json` (تنقية أهداف المزوّدين)
- مخلّفات `auth.json` القديمة
- مفاتيح الأسرار المعروفة في `~/.openclaw/.env` التي رُحّلت قيمها

تفاصيل عقد الخطة (مسارات الأهداف المسموح بها، وقواعد التحقق، ودلالات الفشل): [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract).

### لماذا لا توجد نسخ احتياطية للتراجع

لا يكتب `secrets apply` عمدًا نسخًا احتياطية للتراجع تحتوي على قيم النص الصريح القديمة. تتحقق السلامة من خلال فحص مسبق صارم وتطبيق شبه ذري، مع محاولة استعادة داخل الذاكرة عند الفشل بأفضل جهد ممكن.

## مثال

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

إذا استمر `audit --check` في الإبلاغ عن نتائج نصوص صريحة، فحدّث مسارات الأهداف المتبقية المُبلّغ عنها وأعد تشغيل التدقيق.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إدارة الأسرار](/ar/gateway/secrets)
- [مراجع أسرار Vault من نوع SecretRefs](/plugins/vault)
