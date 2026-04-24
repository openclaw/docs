---
read_when:
    - إعادة حل مراجع الأسرار في وقت التشغيل
    - تدقيق البقايا النصية الصريحة والمراجع غير المحلولة
    - تهيئة SecretRefs وتطبيق تغييرات التنظيف أحادية الاتجاه
summary: مرجع CLI لـ `openclaw secrets` (إعادة التحميل، والتدقيق، والتهيئة، والتطبيق)
title: الأسرار
x-i18n:
    generated_at: "2026-04-24T07:36:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

استخدم `openclaw secrets` لإدارة SecretRefs والحفاظ على سلامة لقطة وقت التشغيل النشطة.

أدوار الأوامر:

- `reload`: استدعاء Gateway RPC (`secrets.reload`) يعيد حل المراجع ويبدّل لقطة وقت التشغيل فقط عند النجاح الكامل (من دون كتابة إلى الإعدادات).
- `audit`: فحص للقراءة فقط لإعدادات التخزين/المصادقة/النماذج المولدة والبقايا القديمة بحثًا عن النصوص الصريحة، والمراجع غير المحلولة، وانحراف الأولوية (يتم تخطي مراجع exec ما لم يتم ضبط `--allow-exec`).
- `configure`: مخطط تفاعلي لإعداد provider، وربط الأهداف، والتحقق المسبق (يتطلب TTY).
- `apply`: تنفيذ خطة محفوظة (`--dry-run` للتحقق فقط؛ يتخطى التنفيذ التجريبي فحوصات exec افتراضيًا، ويرفض وضع الكتابة الخطط التي تحتوي على exec ما لم يتم ضبط `--allow-exec`)، ثم تنظيف بقايا النصوص الصريحة المستهدفة.

حلقة التشغيل الموصى بها للمشغّل:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

إذا كانت خطتك تتضمن SecretRefs/providers من نوع `exec`، فمرّر `--allow-exec` في كل من أوامر التطبيق التجريبي وأوامر التطبيق الكتابي.

ملاحظة حول رموز الخروج لـ CI/البوابات:

- يعيد `audit --check` القيمة `1` عند وجود نتائج.
- تعيد المراجع غير المحلولة القيمة `2`.

ذو صلة:

- دليل الأسرار: [إدارة الأسرار](/ar/gateway/secrets)
- سطح بيانات الاعتماد: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- دليل الأمان: [الأمان](/ar/gateway/security)

## إعادة تحميل لقطة وقت التشغيل

أعِد حل مراجع الأسرار وبدّل لقطة وقت التشغيل ذرّيًا.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

ملاحظات:

- يستخدم طريقة Gateway RPC ‏`secrets.reload`.
- إذا فشل الحلّ، يحتفظ gateway بآخر لقطة سليمة معروفة ويعيد خطأً (من دون تفعيل جزئي).
- تتضمن استجابة JSON الحقل `warningCount`.

الخيارات:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## التدقيق

افحص حالة OpenClaw بحثًا عن:

- تخزين أسرار بنص صريح
- مراجع غير محلولة
- انحراف الأولوية (حيث تطغى بيانات اعتماد `auth-profiles.json` على مراجع `openclaw.json`)
- بقايا مولّدة في `agents/*/agent/models.json` (قيم `apiKey` الخاصة بالـ provider ورؤوس provider الحساسة)
- بقايا قديمة (إدخالات مخزن المصادقة القديم، وتذكيرات OAuth)

ملاحظة بقايا الرؤوس:

- يعتمد اكتشاف رؤوس provider الحساسة على استدلال قائم على الأسماء (أسماء ومقاطع رؤوس المصادقة/بيانات الاعتماد الشائعة مثل `authorization` و`x-api-key` و`token` و`secret` و`password` و`credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

سلوك الخروج:

- يؤدي `--check` إلى الخروج بقيمة غير صفرية عند وجود نتائج.
- تخرج المراجع غير المحلولة برمز غير صفري ذي أولوية أعلى.

أبرز بنية التقرير:

- `status`: ‏`clean | findings | unresolved`
- `resolution`: ‏`refsChecked` و`skippedExecRefs` و`resolvabilityComplete`
- `summary`: ‏`plaintextCount` و`unresolvedRefCount` و`shadowedRefCount` و`legacyResidueCount`
- رموز النتائج:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## التهيئة (مساعد تفاعلي)

أنشئ تغييرات provider وSecretRef بشكل تفاعلي، وشغّل التحقق المسبق، ثم طبّق اختياريًا:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

التدفق:

- إعداد provider أولًا (`add/edit/remove` لأسماء `secrets.providers` المستعارة).
- ربط بيانات الاعتماد ثانيًا (حدد الحقول وعيّن مراجع `{source, provider, id}`).
- التحقق المسبق والتطبيق الاختياري أخيرًا.

العلامات:

- `--providers-only`: هيّئ `secrets.providers` فقط، وتخطَّ ربط بيانات الاعتماد.
- `--skip-provider-setup`: تخطَّ إعداد provider واربط بيانات الاعتماد بـ providers الموجودة.
- `--agent <id>`: قصر اكتشاف الأهداف والكتابة في `auth-profiles.json` على مخزن وكيل واحد.
- `--allow-exec`: السماح بفحوصات SecretRef من نوع exec أثناء التحقق المسبق/التطبيق (قد يؤدي إلى تنفيذ أوامر provider).

ملاحظات:

- يتطلب TTY تفاعليًا.
- لا يمكنك الجمع بين `--providers-only` و`--skip-provider-setup`.
- يستهدف `configure` الحقول الحاملة للأسرار في `openclaw.json` بالإضافة إلى `auth-profiles.json` ضمن نطاق الوكيل المحدد.
- يدعم `configure` إنشاء عمليات ربط جديدة في `auth-profiles.json` مباشرةً داخل تدفق الاختيار.
- السطح المدعوم الرسمي: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
- ينفّذ حلّ التحقق المسبق قبل التطبيق.
- إذا تضمن التحقق المسبق/التطبيق مراجع exec، فأبقِ `--allow-exec` مضبوطًا لكلا الخطوتين.
- تستخدم الخطط المولّدة افتراضيًا خيارات التنظيف (`scrubEnv` و`scrubAuthProfilesForProviderTargets` و`scrubLegacyAuthJson` كلها مفعّلة).
- يكون مسار التطبيق أحادي الاتجاه بالنسبة إلى قيم النص الصريح التي تم تنظيفها.
- من دون `--apply`، لا يزال CLI يطلب `Apply this plan now?` بعد التحقق المسبق.
- مع `--apply` (ومن دون `--yes`)، يعرض CLI مطالبة تأكيد إضافية لا رجعة فيها.
- يطبع `--json` الخطة + تقرير التحقق المسبق، لكن الأمر لا يزال يتطلب TTY تفاعليًا.

ملاحظة أمان provider من نوع exec:

- كثيرًا ما تكشف تثبيتات Homebrew ملفات تنفيذية مرتبطة رمزيًا تحت `/opt/homebrew/bin/*`.
- اضبط `allowSymlinkCommand: true` فقط عند الحاجة لمسارات مدير حزم موثوقة، واقرن ذلك مع `trustedDirs` (على سبيل المثال `["/opt/homebrew"]`).
- في Windows، إذا لم يكن التحقق من ACL متاحًا لمسار provider، فإن OpenClaw يفشل في وضع مغلق. وبالنسبة إلى المسارات الموثوقة فقط، اضبط `allowInsecurePath: true` على ذلك provider لتجاوز فحوصات أمان المسار.

## تطبيق خطة محفوظة

طبّق أو تحقّق مسبقًا من خطة تم إنشاؤها سابقًا:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

سلوك exec:

- يقوم `--dry-run` بالتحقق من التحقق المسبق من دون كتابة ملفات.
- تُتخطى فحوصات SecretRef من نوع exec افتراضيًا في التنفيذ التجريبي.
- يرفض وضع الكتابة الخطط التي تحتوي على SecretRefs/providers من نوع exec ما لم يتم ضبط `--allow-exec`.
- استخدم `--allow-exec` للاشتراك في فحوصات/تنفيذ provider من نوع exec في أي من الوضعين.

تفاصيل عقد الخطة (مسارات الأهداف المسموح بها، وقواعد التحقق، ودلالات الفشل):

- [عقد خطة تطبيق الأسرار](/ar/gateway/secrets-plan-contract)

ما الذي قد يحدّثه `apply`:

- `openclaw.json` (أهداف SecretRef + عمليات upserts/deletes للـ provider)
- `auth-profiles.json` (تنظيف أهداف provider)
- بقايا `auth.json` القديمة
- مفاتيح الأسرار المعروفة في `~/.openclaw/.env` التي تم ترحيل قيمها

## لماذا لا توجد نسخ احتياطية للتراجع

يتعمد `secrets apply` عدم كتابة نسخ احتياطية للتراجع تحتوي على قيم النص الصريح القديمة.

تأتي السلامة من التحقق المسبق الصارم + التطبيق شبه الذري مع استعادة داخل الذاكرة بأفضل جهد عند الفشل.

## مثال

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

إذا كان `audit --check` لا يزال يبلغ عن نتائج نص صريح، فحدّث مسارات الأهداف المتبقية المُبلَّغ عنها وأعد تشغيل التدقيق.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إدارة الأسرار](/ar/gateway/secrets)
