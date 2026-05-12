---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع واجهة HTTP API (نقاط النهاية العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-05-12T23:28:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP API

عنوان URL الأساسي: `https://clawhub.ai` (افتراضي).

تقع جميع مسارات v1 تحت `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الكتالوج العام

يجوز للأدلة التابعة لجهات خارجية استخدام نقاط نهاية القراءة العامة لسرد Skills الخاصة بـ ClawHub أو البحث فيها. يُرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وإرجاع المستخدمين إلى قائمة ClawHub المعيارية (`https://clawhub.ai/<owner>/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد الموقع التابع لجهة خارجية. لا تحاول عكس المحتوى المخفي أو الخاص أو المحظور رقابيًا خارج سطح API العام.

تُحل اختصارات slug على الويب عبر عائلات السجل، لكن ينبغي لعملاء API استخدام
عناوين URL المعيارية التي تُرجعها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُفرض لكل IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى الإنفاذ حسب IP.
- ينبغي ألا تُرجع نقاط نهاية الكتابة المصادق عليها `Unauthorized` مجردًا عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/المسحوبة، و
  الحسابات المحذوفة/المحظورة/المعطلة كلٌ منها على نص قابل للتصرف حتى يتمكن عملاء CLI
  من إخبار المستخدمين بما منعهم.

- القراءة: 600/دقيقة لكل IP، و2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل IP، و180/دقيقة لكل مفتاح
- التنزيل: 30/دقيقة لكل IP، و180/دقيقة لكل مفتاح (`/api/v1/download`)

الرؤوس:

- التوافق القديم: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- الموحّدة: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني Unix epoch المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة التعيين (تأخير)
- `Retry-After`: الثواني المطلوب انتظارها قبل إعادة المحاولة (تأخير) عند `429`

مثال على استجابة `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

إرشادات العميل:

- إذا وُجد `Retry-After`، فانتظر ذلك العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعًا عشوائيًا لتجنب إعادة المحاولات المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم `cf-connecting-ip` (Cloudflare) لعنوان IP الخاص بالعميل افتراضيًا.
- يستخدم ClawHub رؤوس تمرير موثوقة لتحديد عناوين IP للعملاء عند الحافة.
- إذا لم يتوفر عنوان IP موثوق للعميل، تستخدم طلبات التنزيل المجهولة حاوية بديلة محددة لنقطة النهاية بدلًا من حاوية عالمية واحدة `ip:unknown`. ولا تزال طلبات القراءة/الكتابة المجهولة تستخدم الحاوية المجهولة المشتركة حتى يظل توجيه IP المفقود مرئيًا ومحافظًا.

## نقاط النهاية العامة (بدون مصادقة)

### `GET /api/v1/search`

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح
- `highlightedOnly` (اختياري): `true` للتصفية إلى Skills المميزة
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

الاستجابة:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

ملاحظات:

- تُرجع النتائج بترتيب الصلة (تشابه التضمين + تعزيزات رمز slug/الاسم المطابق بدقة + أولوية الشعبية من التنزيلات).
- الصلة أقوى من الشعبية. يمكن لتطابق رمز slug أو اسم عرض دقيق أن يتقدم على تطابق أوسع لديه تنزيلات أكثر بكثير.
- يُجزّأ نص ASCII على حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز مستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يعطي البحث عن `map` تطابقًا معجميًا أقوى لـ `personal-map` من `amap-jsapi-skill`.
- تُستخدم التنزيلات كأولوية صغيرة بمقياس لوغاريتمي وكعامل كسر تعادل، وليست إشارة الترتيب الأساسية. يمكن أن تحصل Skills ذات تنزيلات عالية على ترتيب أدنى عندما يكون نص الاستعلام تطابقًا أضعف.
- يمكن أن تزيل حالة الإشراف المشبوهة أو المخفية Skill من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تعِد تسمية slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا معياريًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL المعياري وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على حل عناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يعتمد على بيانات Skill الوصفية المعيارية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية بشكل غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect <slug>` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المرتبطة بالترتيب.

### `GET /api/v1/skills`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم صفحات لأي فرز غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، `installsCurrent` (اسم مستعار: `installs`)، `installsAllTime`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

ملاحظات:

- يرتب `trending` حسب عمليات التثبيت في آخر 7 أيام (استنادًا إلى القياسات).
- `createdAt` مستقر لعمليات زحف Skills الجديدة؛ يتغير `updated` عند إعادة نشر Skills الحالية.
- عندما يكون `nonSuspiciousOnly=true`، قد تُرجع عمليات الفرز المستندة إلى المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تُرشح بعد جلب الصفحة.
- استخدم `nextCursor` لمتابعة ترقيم الصفحات عند وجوده. الصفحة القصيرة لا تعني وحدها نهاية النتائج.

الاستجابة:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

الاستجابة:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

ملاحظات:

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill المعيارية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاصة بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى Skill بيانات وصفية للمنصة.
- لا يُضمّن `moderation` إلا عندما تكون Skill معلّمة أو يعرضها المالك.

### `GET /api/v1/skills/{slug}/moderation`

يرجع حالة إشراف منظمة.

الاستجابة:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

ملاحظات:

- يمكن للمالكين والمشرفين الوصول إلى تفاصيل الإشراف الخاصة بـ Skills المخفية.
- لا يحصل المستدعون العامون على `200` إلا لـ Skills المرئية المعلّمة مسبقًا.
- تُحجب الأدلة للمستدعين العامين ولا تتضمن مقتطفات خامًا إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن Skill لمراجعة المشرف. التقارير على مستوى Skill، ويمكن ربطها اختياريًا
بإصدار، وتغذي قائمة انتظار تقارير Skill.

المصادقة:

- تتطلب رمز API.

الطلب:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

الاستجابة:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

نقطة نهاية للمشرف/المسؤول لاستقبال تقارير Skill.

معلمات الاستعلام:

- `status` (اختياري): `open` (افتراضي)، `confirmed`، `dismissed`، أو `all`
- `limit` (اختياري): عدد صحيح (1-200)
- `cursor` (اختياري): مؤشر ترقيم صفحات

الاستجابة:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

نقطة نهاية للمشرف/المسؤول لحل تقارير Skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "hide"` مع تقرير جرى فرزه
لإخفاء Skill ضمن سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم صفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يرجع البيانات الوصفية للإصدار + قائمة الملفات.

- يتضمن `version.security` حالة تحقق فحص موحّدة وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يرجع تفاصيل تحقق الفحص الأمني لإصدار Skill.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يُقدّم `version` ولا `tag`، يستخدم أحدث إصدار.
- يتضمن حالة تحقق موحّدة بالإضافة إلى تفاصيل خاصة بكل ماسح.
- يتضمن `security.capabilityTags` تسميات قدرة/مخاطر حتمية مثل
  `crypto`، و`requires-wallet`، و`can-make-purchases`، و`can-sign-transactions`،
  و`requires-oauth-token`، و`posts-externally` عند اكتشافها.
- يكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حكمًا نهائيًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` لقطة إشراف حالية على مستوى Skill مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل معاملة `moderation` و`security` كسياق الإصدار نفسه.

### `GET /api/v1/skills/{slug}/file`

يرجع محتوى نصيًا خامًا.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- الافتراضي هو أحدث إصدار.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية كتالوج موحدة لـ:

- Skills
- Plugins الشيفرة
- Plugins الحِزم

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح قدرات لحزم Plugin
- `target` / `hostTarget` (اختياري): اختصار لـ `host:<target>`
- `os` و`arch` و`libc` (اختياري): اختصار لمرشحات قدرة المضيف
- `requiresBrowser` و`requiresDesktop` و`requiresNativeDeps`،
  `requiresExternalService` و`requiresBinary` و`requiresOsPermission`
  (اختياري): اختصار `true`/`1` لوسوم متطلبات البيئة
- `externalService` و`binary` و`osPermission` (اختياري): اختصار لوسوم
  متطلبات البيئة المسماة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` لإظهار إصدارات الحزم المدعومة من ClawPack
  المتاحة عبر مرآة npm

ملاحظات:

- يبقى `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` أسماء بديلة ثابتة العائلة.
- تظل إدخالات Skills مدعومة بسجل Skills، ولا يزال يمكن نشرها فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصا فقط لإصدارات code-plugin وbundle-plugin.
- لا يرى المتصلون المجهولون إلا قنوات الحزم العامة.
- يمكن للمتصلين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المتصل المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث كتالوج موحد عبر Skills + حزم Plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح قدرات لحزم Plugin
- `target` / `hostTarget` و`os` و`arch` و`libc` و`requiresBrowser`،
  `requiresDesktop` و`requiresNativeDeps` و`requiresExternalService`،
  `requiresBinary` و`requiresOsPermission` و`externalService` و`binary` و
  `osPermission` مقبولة كاختصارات لوسوم القدرات الشائعة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` للبحث في إصدارات الحزم المدعومة من ClawPack
  المتاحة عبر مرآة npm

ملاحظات:

- لا يرى المتصلون المجهولون إلا قنوات الحزم العامة.
- يمكن للمتصلين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المتصل المصادق عليه قراءتها.
- تستند مرشحات الأثر إلى وسوم قدرات مفهرسة:
  `artifact:legacy-zip` و`artifact:npm-pack` و`npm-mirror:available`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن أيضا حل Skills عبر هذا المسار في الكتالوج الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن المتصل قادرا على قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وكل إصداراتها حذفا ميسرا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة،
  أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن المتصل قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدار حزمة واحدا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والقدرات، والتحقق، وبيانات تعريف الأثر، وبيانات الفحص.

ملاحظات:

- تكون `version.artifact.kind` هي `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة من ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- يتم تضمين `version.sha256hash` و`version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan` عند وجود بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يكن المتصل قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل الأثر الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثر `legacy-zip` و`downloadUrl` لملف ZIP القديم.
- تعيد إصدارات ClawPack أثر `npm-pack` وحقول سلامة npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح المحلل في OpenClaw؛ وهو يتجنب تخمين تنسيق الأرشيف من
  عنوان URL مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة لحزمة npm-pack المرفوعة.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تغطي فحوص الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر npm-pack من ClawPack
- بصمة الأثر
- مصدر مستودع المصدر وإثبات commit
- بيانات تعريف توافق OpenClaw
- أهداف المضيف
- حالة الفحص

الاستجابة:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

نقطة نهاية للمشرفين لعرض صفوف ترحيل Plugin الرسمي في OpenClaw.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned` أو `published` أو `clawpack-ready`،
  أو `legacy-zip-only` أو `metadata-ready` أو `blocked` أو `ready-for-openclaw` أو
  `all` (الافتراضي).
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

الاستجابة:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

نقطة نهاية للمسؤولين لإنشاء أو تحديث صف ترحيل Plugin رسمي.

المصادقة:

- تتطلب رمز API لمستخدم مسؤول.

نص الطلب:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

ملاحظات:

- يتم تطبيع `bundledPluginId` إلى أحرف صغيرة، وهو مفتاح upsert المستقر.
- يتم تطبيع `packageName` كاسم npm؛ يمكن أن تكون الحزمة مفقودة للترحيلات
  المخططة.
- يتتبع هذا جاهزية الترحيل فقط. لا يغير OpenClaw ولا ينشئ
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لطوابير مراجعة إصدارات الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالات:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مبلغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
- `manual`: أي إصدار يتضمن تجاوزا يدويا للإشراف.
- `all`: أي إصدار يتضمن تجاوزا يدويا، أو حالة فحص غير نظيفة، أو بلاغا عن الحزمة.

الاستجابة:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

الإبلاغ عن حزمة لمراجعة المشرف. البلاغات على مستوى الحزمة، وترتبط اختياريا
بإصدار. تغذي طابور الإشراف لكنها لا تخفي التنزيلات أو تحظرها تلقائيا
بحد ذاتها؛ ينبغي للمشرفين استخدام إشراف الإصدارات للموافقة على
الآثار أو عزلها أو إلغائها.

المصادقة:

- تتطلب رمز API.

الطلب:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

الاستجابة:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

نقطة نهاية للمشرفين/المسؤولين لاستقبال بلاغات الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `confirmed`، أو `dismissed`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

الاستجابة:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

نقطة نهاية للمالك/المشرف لرؤية إشراف الحزمة.

المصادقة:

- تتطلب رمز API لمالك الحزمة، أو عضو الناشر، أو المشرف، أو
  مستخدم مسؤول.

الاستجابة:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

نقطة نهاية للمشرفين/المسؤولين لحل بلاغات الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "quarantine"` أو
`finalAction: "revoke"` مع بلاغ مؤكد لتطبيق الإشراف على الإصدار ضمن
نفس سير العمل القابل للتدقيق.

الاستجابة:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

نقطة نهاية للمشرف/المدير لمراجعة إصدار الحزمة.

الطلب:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

الحالات المدعومة:

- `approved`: تمت مراجعته يدويا والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقا سابقا.

تعيد الإصدارات الموضوعة في الحجر أو الملغاة `403` من مسارات تنزيل الآثار.
كل تغيير يكتب إدخالا في سجل التدقيق.

### `POST /api/v1/packages/backfill/artifacts`

نقطة نهاية صيانة للمدير فقط لتوسيم إصدارات الحزم الأقدم
ببيانات وصفية صريحة لنوع الأثر.

جسم الطلب:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

الاستجابة:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

ملاحظات:

- الافتراضي هو التشغيل التجريبي.
- الإصدارات التي لا تحتوي على تخزين ClawPack توسم بـ `legacy-zip`.
- يتم إصلاح الصفوف القائمة المدعومة بـ ClawPack والتي ينقصها `artifactKind` كـ
  `npm-pack`.
- هذا لا ينشئ ClawPacks ولا يغير بايتات الأثر.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصيا خاما لملف حزمة.

معاملات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيا.
- يستخدم حاوية معدل القراءة، وليس حاوية التنزيل.
- الملفات الثنائية تعيد `415`.
- حد حجم الملف: 200KB.
- فحوصات VirusTotal المعلقة لا تحظر القراءات؛ قد تظل الإصدارات الخبيثة محجوبة في مكان آخر.
- الحزم الخاصة تعيد `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معاملات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيا.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip لها جذر `package/` حتى يستمر عمل عملاء OpenClaw
  القدامى.
- يبقى هذا المسار خاصا بـ ZIP فقط. لا يبث ملفات ClawPack بصيغة `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات تكامل المحلل.
- لا يتم حقن البيانات الوصفية الخاصة بالسجل فقط في الأرشيف المنزل.
- فحوصات VirusTotal المعلقة لا تحظر التنزيلات؛ الإصدارات الخبيثة تعيد `403`.
- الحزم الخاصة تعيد `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقا مع npm لإصدارات الحزم المدعومة بـ ClawPack.

ملاحظات:

- تسرد فقط الإصدارات التي تحتوي على tarballs مرفوعة من نوع ClawPack npm-pack.
- يتم إغفال الإصدارات القديمة الخاصة بـ ZIP فقط عمدا.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولا متوافقة مع npm
  حتى يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلا من `/api/npm/@scope/name` ومسار طلب npm
  المرمز `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات tarball المرفوعة بالضبط من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل ClawHub SHA-256 بالإضافة إلى بيانات تكامل/ملخص npm الوصفية.
- ما زالت فحوصات الإشراف والوصول إلى الحزم الخاصة تنطبق.

### `GET /api/v1/resolve`

يستخدمه CLI لربط بصمة محلية بإصدار معروف.

معاملات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي بطول 64 محرفا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزل ملف zip لإصدار مهارة.

معاملات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يقدم أي من `version` أو `tag`، يستخدم أحدث إصدار.
- الإصدارات المحذوفة حذفاً مرناً تعيد `410`.
- تحسب إحصاءات التنزيل كهويات فريدة في الساعة (`userId` عندما يكون رمز API صالحا، وإلا IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصدارا جديدا.

- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات blob في `files[]`.
- يقبل أيضا جسم JSON يحتوي على `files` (مبنية على storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، يحل API ذلك
  الناشر على جانب الخادم ويتطلب أن يكون للفاعل وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عندما يكون `true` مع `ownerHandle`، قد تنتقل
  مهارة موجودة إلى ذلك المالك إذا كان الفاعل مديرا/مالكا لدى كل من
  الناشرين الحالي والهدف. من دون هذا الاشتراك الصريح، ترفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات blob في `files[]`.
- يقبل أيضا جسم JSON يحتوي على `files` (مبنية على storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، لا يجوز النشر نيابة عن ذلك المالك إلا للمديرين.

أبرز نقاط التحقق:

- يجب أن تكون `family` هي `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي رفعيات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب code plugins وجود `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية لتعهد المصدر،
  وبيانات وصفية لمخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يجوز النشر إلى قناة `official` إلا للناشرين الموثوقين.
- النشر بالنيابة ما زال يتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف مرن / استعادة مهارة (المالك أو المشرف أو المدير).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجوده، يخزن `reason` كملاحظة إشراف على المهارة وينسخ إلى سجل التدقيق.
الحذف المرن الذي يبدأه المالك يحجز slug لمدة 30 يوما، ثم يمكن أن يطالب
ناشر آخر بالـ slug. تتضمن استجابة الحذف `slugReservedUntil` عند انطباق هذا الانتهاء.
لا تنتهي إخفاءات المشرف/المدير والإزالات الأمنية بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسن
- `401`: غير مصرح
- `403`: محظور
- `404`: لم يتم العثور على المهارة/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمدير فقط. يضمن وجود ناشر مؤسسة لمعرّف. إذا كان المعرّف لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، ترحله نقطة النهاية أولا إلى ناشر مؤسسة.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

للمدير فقط. يحجز slugs جذرية وأسماء حزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزما نائبة خاصة بلا صفوف إصدارات، بحيث يمكن
للمالك نفسه لاحقا نشر إصدار code-plugin أو bundle-plugin الحقيقي في ذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط نهاية إدارة slug الخاصة بالمالك

- `POST /api/v1/skills/{slug}/rename`
  - الجسم: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - الجسم: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة رمز API ولا تعملان إلا لمالك المهارة.
- يحافظ `rename` على الـ slug السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` إدراج المصدر ويعيد توجيه slug المصدر إلى إدراج الهدف.

### نقاط نهاية نقل الملكية

- `POST /api/v1/skills/{slug}/transfer`
  - الجسم: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - الاستجابة: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - الاستجابة (قبول/رفض/إلغاء): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - شكل الاستجابة: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

يحظر مستخدما ويحذف المهارات المملوكة حذفا نهائيا (للمشرف/المدير فقط).

الجسم:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

أو

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

الاستجابة:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

يرفع حظر مستخدم ويستعيد المهارات المؤهلة (للمدير فقط).

الجسم:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

أو

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

الاستجابة:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

يغير دور مستخدم (للمدير فقط).

الجسم:

```json
{ "handle": "user_handle", "role": "moderator" }
```

أو

```json
{ "userId": "users_...", "role": "admin" }
```

الاستجابة:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

يسرد المستخدمين أو يبحث عنهم (للمدير فقط).

معاملات الاستعلام:

- `q` (اختياري): استعلام البحث
- `query` (اختياري): اسم مستعار لـ `q`
- `limit` (اختياري): الحد الأقصى للنتائج (الافتراضي 20، الحد الأقصى 200)

الاستجابة:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

يضيف/يزيل نجمة (إبرازات). كلتا نقطتي النهاية آمنتان للتكرار.

الاستجابات:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقاط نهاية CLI القديمة (مهملة)

ما زالت مدعومة لإصدارات CLI الأقدم:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

راجع `DEPRECATIONS.md` لخطة الإزالة.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيا، فقدم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحة؛ القديم `CLAWDHUB_REGISTRY`).
