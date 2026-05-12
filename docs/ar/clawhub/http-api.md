---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع API HTTP (نقاط النهاية العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-05-12T12:49:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة API عبر HTTP

عنوان URL الأساسي: `https://clawhub.ai` (افتراضي).

جميع مسارات v1 تقع ضمن `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الفهرس العام

يمكن للأدلة التابعة لجهات خارجية استخدام نقاط النهاية العامة للقراءة لسرد Skills في ClawHub أو البحث فيها. يرجى تخزين النتائج مؤقتا، واحترام `429`/`Retry-After`، وربط المستخدمين مرة أخرى بالقائمة الأساسية في ClawHub (`https://clawhub.ai/<owner>/<slug>`)، وتجنب الإيحاء بتأييد ClawHub للموقع الخارجي. لا تحاول عكس محتوى مخفي أو خاص أو محظور بالإشراف خارج سطح API العام.

تختصر slugs الويب عبر عائلات السجل، لكن يجب على عملاء API استخدام
عناوين URL الأساسية التي تعيدها نقاط نهاية القراءة بدلا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تطبق لكل IP.
- الطلبات المصادقة (رمز Bearer صالح): تطبق لكل حاوية مستخدم.
- إذا كان الرمز مفقودا/غير صالح، يعود السلوك إلى إنفاذ IP.
- يجب ألا تعيد نقاط نهاية الكتابة المصادقة `Unauthorized` مجردة عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة، والحسابات
  المحذوفة/المحظورة/المعطلة، كل منها على نص قابل للتنفيذ حتى يستطيع عملاء CLI
  إخبار المستخدمين بما حظرهم.

- القراءة: 600/دقيقة لكل IP، و2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل IP، و180/دقيقة لكل مفتاح
- التنزيل: 30/دقيقة لكل IP، و180/دقيقة لكل مفتاح (`/api/v1/download`)

الرؤوس:

- التوافق القديم: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- الموحد: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `Retry-After`: الثواني المطلوب انتظارها قبل إعادة المحاولة (تأخير) عند `429`

مثال لاستجابة `429`:

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

- إذا كان `Retry-After` موجودا، فانتظر ذلك العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعا مع عشوائية لتجنب إعادة المحاولات المتزامنة.
- إذا كان `Retry-After` مفقودا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم `cf-connecting-ip` (Cloudflare) لعنوان IP الخاص بالعميل افتراضيا.
- يستخدم ClawHub رؤوس إعادة التوجيه الموثوقة لتحديد عناوين IP للعملاء عند الحافة.
- إذا لم يتوفر عنوان IP موثوق للعميل، تستخدم طلبات التنزيل المجهولة حاوية احتياطية محددة بنقطة النهاية بدلا من حاوية `ip:unknown` عالمية واحدة. لا تزال طلبات القراءة/الكتابة المجهولة تستخدم الحاوية المشتركة للمجهول حتى يبقى توجيه IP المفقود مرئيا ومحافظا.

## نقاط النهاية العامة (بدون مصادقة)

### `GET /api/v1/search`

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح
- `highlightedOnly` (اختياري): `true` للتصفية إلى Skills المميزة
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشتبه بها (`flagged.suspicious`)
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

- تعاد النتائج بترتيب الصلة (تشابه التضمين + تعزيزات رموز slug/الاسم المطابقة تماما + أولوية الشعبية من التنزيلات).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتقدم على مطابقة أوسع لديها تنزيلات أكثر بكثير.
- يجري تقسيم نص ASCII إلى رموز عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز `map` مستقل، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك فإن البحث عن `map` يمنح `personal-map` مطابقة معجمية أقوى من `amap-jsapi-skill`.
- تستخدم التنزيلات كأولوية صغيرة بمقياس لوغاريتمي وكعامل كسر تعادل، وليس كإشارة الترتيب الأساسية. يمكن أن تحصل Skills ذات التنزيلات العالية على ترتيب أدنى عندما يكون نص الاستعلام مطابقة أضعف.
- يمكن أن تزيل حالة الإشراف المشتبه بها أو المخفية Skill من البحث العام بناء على مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلا فقط عندما يكون أيضا هوية مستقرة تريد الاحتفاظ بها.
- لا تعيد تسمية slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسما أساسيا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأساسي، وslug المعروض، وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على حل عناوين URL القديمة والتثبيتات التي تحل عبر السجل، لكن ترتيب البحث يستند إلى بيانات Skill الأساسية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية بشكل غير متوقع، فتحقق أولا من حالة الإشراف باستخدام `clawhub inspect <slug>` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المتعلقة بالترتيب.

### `GET /api/v1/skills`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي فرز غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، `installsCurrent` (اسم مستعار: `installs`)، `installsAllTime`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشتبه بها (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

ملاحظات:

- يرتب `trending` حسب التثبيتات في آخر 7 أيام (بناء على القياسات عن بعد).
- يكون `createdAt` مستقرا لزحف Skills الجديدة؛ يتغير `updated` عند إعادة نشر Skills الحالية.
- عندما تكون `nonSuspiciousOnly=true`، قد تعيد عمليات الفرز القائمة على المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشتبه بها تصفى بعد جلب الصفحة.
- استخدم `nextCursor` لمتابعة ترقيم الصفحات عند وجوده. الصفحة القصيرة لا تعني بحد ذاتها نهاية النتائج.

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

- تحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill الأساسية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاص بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تعلن.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى Skill بيانات وصفية للمنصة.
- يضمن `moderation` فقط عندما تكون Skill معلما عليها أو عندما يعرضها المالك.

### `GET /api/v1/skills/{slug}/moderation`

يعيد حالة الإشراف المنظمة.

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
- يحصل المستدعون العامون على `200` فقط لـ Skills المرئية التي تم تعليمها مسبقا.
- تحجب الأدلة للمستدعين العامين ولا تتضمن المقاطع الخام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن Skill لمراجعة المشرف. التقارير على مستوى Skill، ويمكن ربطها اختياريا
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

نقطة نهاية المشرف/المدير لاستقبال تقارير Skill.

معلمات الاستعلام:

- `status` (اختياري): `open` (افتراضي)، أو `confirmed`، أو `dismissed`، أو `all`
- `limit` (اختياري): عدد صحيح (1-200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

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

نقطة نهاية المشرف/المدير لحل تقارير Skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ يمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع تقرير تم فرزه
لإخفاء Skill في نفس سير العمل القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد بيانات وصفية للإصدار + قائمة الملفات.

- يتضمن `version.security` حالة التحقق المعيارية من الفحص وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل التحقق من الفحص الأمني لإصدار Skill.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يقدم `version` ولا `tag`، يستخدم أحدث إصدار.
- يتضمن حالة تحقق معيارية بالإضافة إلى تفاصيل خاصة بالماسح.
- يتضمن `security.capabilityTags` تسميات قدرات/مخاطر حتمية مثل
  `crypto` و`requires-wallet` و`can-make-purchases` و`can-sign-transactions`
  و`requires-oauth-token` و`posts-externally` عند اكتشافها.
- تكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حكما نهائيا (`clean` أو `suspicious` أو `malicious`).
- `moderation` لقطة حالية للإشراف على مستوى Skill مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` على أنهما في سياق الإصدار نفسه.

### `GET /api/v1/skills/{slug}/file`

يعيد محتوى نصيا خاما.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- الافتراضي هو أحدث إصدار.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية فهرس موحدة لـ:

- Skills
- Plugins برمجية
- Plugins حزم

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح الإمكانات لحزم Plugin
- `target` / `hostTarget` (اختياري): اختصار لـ `host:<target>`
- `os` و`arch` و`libc` (اختياري): اختصار لمرشحات إمكانات المضيف
- `requiresBrowser` و`requiresDesktop` و`requiresNativeDeps`
  و`requiresExternalService` و`requiresBinary` و`requiresOsPermission`
  (اختياري): اختصار `true`/`1` لوسوم متطلبات البيئة
- `externalService` و`binary` و`osPermission` (اختياري): اختصار لوسوم
  متطلبات البيئة المسماة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` لإظهار إصدارات الحزم المدعومة من ClawPack
  والمتاحة عبر مرآة npm

ملاحظات:

- يبقى `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين مستعارين ثابتين للعائلة.
- تظل إدخالات Skills مدعومة بسجل Skills ولا يزال نشرها ممكنا فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصا فقط لإصدارات code-plugin وbundle-plugin.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- يعيد `channel=private` فقط الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحد في الفهرس عبر Skills + حزم Plugin.

معاملات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح الإمكانات لحزم Plugin
- `target` / `hostTarget` و`os` و`arch` و`libc` و`requiresBrowser`
  و`requiresDesktop` و`requiresNativeDeps` و`requiresExternalService`
  و`requiresBinary` و`requiresOsPermission` و`externalService` و`binary` و
  `osPermission` مقبولة كاختصارات لوسوم الإمكانات الشائعة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` للبحث عن إصدارات الحزم المدعومة من ClawPack
  والمتاحة عبر مرآة npm

ملاحظات:

- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- يعيد `channel=private` فقط الحزم التي يستطيع المستدعي المصادق عليه قراءتها.
- تستند مرشحات المصنوعات إلى وسوم الإمكانات المفهرسة:
  `artifact:legacy-zip` و`artifact:npm-pack` و`npm-mirror:available`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن أن تُحل Skills أيضا عبر هذا المسار في الفهرس الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وجميع إصداراتها حذفا ناعما.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدارا واحدا من الحزمة، بما في ذلك بيانات تعريف الملفات، والتوافق،
والإمكانات، والتحقق، وبيانات تعريف المصنوعة، وبيانات الفحص.

ملاحظات:

- يكون `version.artifact.kind` هو `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة من ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- يتم تضمين `version.sha256hash` و`version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan` عندما توجد بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل المصنوعات الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة مصنوعة `legacy-zip` ورابط تنزيل ZIP قديم
  `downloadUrl`.
- تعيد إصدارات ClawPack مصنوعة `npm-pack`، وحقول تكامل npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذه هي واجهة محلل OpenClaw؛ وهي تتجنب تخمين تنسيق الأرشيف من رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزل مصنوعة الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الخاصة بـ npm-pack التي تم رفعها بالضبط.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw مستقبلا.

تغطي فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر مصنوعة ClawPack npm-pack
- بصمة المصنوعة
- مصدر المستودع وإثبات منشأ الالتزام
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

نقطة نهاية للمشرفين لسرد صفوف ترحيل Plugin الرسمية في OpenClaw.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معاملات الاستعلام:

- `phase` (اختياري): `planned` أو `published` أو `clawpack-ready`
  أو `legacy-zip-only` أو `metadata-ready` أو `blocked` أو `ready-for-openclaw` أو
  `all` (افتراضي).
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

- يتطلب رمز API لمستخدم مسؤول.

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

- تتم تسوية `bundledPluginId` إلى أحرف صغيرة وهو مفتاح upsert المستقر.
- تتم تسوية `packageName` كاسم npm؛ وقد تكون الحزمة مفقودة لعمليات الترحيل
  المخططة.
- يتتبع هذا جاهزية الترحيل فقط. ولا يغير OpenClaw أو ينشئ ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لطوابير مراجعة إصدارات الحزم.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معاملات الاستعلام:

- `status` (اختياري): `open` (افتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالات:

- `open`: إصدارات مريبة أو ضارة أو معلقة أو معزولة أو ملغاة أو مبلغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو ضارة.
- `manual`: أي إصدار لديه تجاوز إشراف يدوي.
- `all`: أي إصدار لديه تجاوز يدوي أو حالة فحص غير نظيفة أو بلاغ حزمة.

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

الإبلاغ عن حزمة لمراجعة المشرفين. البلاغات على مستوى الحزمة، ويمكن ربطها
اختياريا بإصدار. وهي تغذي طابور الإشراف لكنها لا تخفي التنزيلات تلقائيا أو
تحظرها بذاتها؛ يجب على المشرفين استخدام إشراف الإصدارات للموافقة على المصنوعات
أو عزلها أو إلغائها.

المصادقة:

- يتطلب رمز API.

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

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معاملات الاستعلام:

- `status` (اختياري): `open` (افتراضي)، أو `confirmed`، أو `dismissed`، أو `all`
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

نقطة نهاية للمالك/المشرف لعرض إشراف الحزمة.

المصادقة:

- يتطلب رمز API لمالك الحزمة، أو عضو الناشر، أو المشرف، أو
  المستخدم المسؤول.

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

`note` مطلوب للحالتين `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "quarantine"` أو
`finalAction: "revoke"` مع بلاغ مؤكد لتطبيق إشراف الإصدار ضمن
سير العمل نفسه القابل للتدقيق.

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

- `approved`: تمت مراجعته يدوياً والسماح به.
- `quarantined`: محظور بانتظار متابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقاً سابقاً.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل الأثر.
يكتب كل تغيير إدخالاً في سجل التدقيق.

### `POST /api/v1/packages/backfill/artifacts`

نقطة نهاية صيانة للمديرين فقط لوسم إصدارات الحزم الأقدم
ببيانات وصفية صريحة لنوع الأثر.

متن الطلب:

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
- الإصدارات التي لا تحتوي على تخزين ClawPack تُوسم بـ`legacy-zip`.
- الصفوف الحالية المدعومة بـClawPack التي تفتقد `artifactKind` تُصلح كـ
  `npm-pack`.
- لا يؤدي هذا إلى إنشاء ClawPacks أو تعديل بايتات الأثر.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى النص الخام لملف حزمة.

معاملات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- الافتراضي هو أحدث إصدار.
- يستخدم حاوية معدل القراءة، لا حاوية التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200 كيلوبايت.
- لا تمنع فحوصات VirusTotal المعلقة عمليات القراءة؛ وقد تظل الإصدارات الخبيثة محجوبة في مواضع أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معاملات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- الافتراضي هو أحدث إصدار.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزمة هي ملفات zip بجذر `package/` بحيث تستمر عملاء OpenClaw
  القديمة في العمل.
- يبقى هذا المسار مخصصاً لـZIP فقط. لا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة المحلل.
- لا تُحقن البيانات الوصفية الخاصة بالسجل فقط في الأرشيف المنزل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقاً مع npm لإصدارات الحزم المدعومة بـClawPack.

ملاحظات:

- تُدرج فقط الإصدارات ذات كرات tarball من نوع ClawPack npm-pack المرفوعة.
- تُحذف عمداً الإصدارات القديمة التي تدعم ZIP فقط.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولاً متوافقة مع npm
  لكي يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلاً من مسار الطلب `/api/npm/@scope/name` ومسار npm
  المرمز `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات كرة tarball الدقيقة المرفوعة من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 من ClawHub بالإضافة إلى بيانات سلامة/shasum الوصفية من npm.
- لا تزال فحوصات الإشراف والوصول إلى الحزم الخاصة سارية.

### `GET /api/v1/resolve`

تستخدمه CLI لربط بصمة محلية بإصدار معروف.

معاملات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي عشري بطول 64 حرفاً لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزل ملف zip لإصدار skill.

معاملات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يُوفَّر `version` ولا `tag`، فسيُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفاً مؤقتاً `410`.
- تُحتسب إحصاءات التنزيل كهويات فريدة في الساعة (`userId` عندما يكون رمز API صالحاً، وإلا عنوان IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرف المستخدم.

### `POST /api/v1/skills`

ينشر إصداراً جديداً.

- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات blob في `files[]`.
- يُقبل أيضاً متن JSON مع `files` (المستند إلى storageId).
- حقل payload اختياري: `ownerHandle`. عند وجوده، تحل API ذلك
  الناشر من جهة الخادم وتتطلب أن يملك الفاعل صلاحية وصول إلى الناشر.
- حقل payload اختياري: `migrateOwner`. عند كونه `true` مع `ownerHandle`، يمكن
  نقل skill موجودة إلى ذلك المالك إذا كان الفاعل مديراً/مالكاً على كل من
  الناشر الحالي والناشر الهدف. من دون هذا الاشتراك الصريح، تُرفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات blob في `files[]`.
- يُقبل أيضاً متن JSON مع `files` (المستند إلى storageId).
- حقل payload اختياري: `ownerHandle`. عند وجوده، لا يجوز إلا للمديرين النشر نيابة عن ذلك المالك.

أبرز نقاط التحقق:

- يجب أن يكون `family` هو `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي رفوعات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب Plugins البرمجية `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية للالتزام المصدر،
  وبيانات وصفية لمخطط الإعداد، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يجوز النشر إلى قناة `official` إلا للناشرين الموثوقين.
- لا تزال عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف مؤقت / استعادة skill (المالك، أو المشرف، أو المدير).

متن JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزن كملاحظة إشراف skill ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف المؤقت التي يبدأها المالك slug لمدة 30 يوماً، ثم يمكن لناشر
آخر المطالبة بذلك slug. تتضمن استجابة الحذف `slugReservedUntil` عند انطباق هذا الانتهاء.
لا تنتهي إخفاءات المشرف/المدير وعمليات الإزالة الأمنية بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسنًا
- `401`: غير مصرح
- `403`: محظور
- `404`: لم يُعثر على skill/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمديرين فقط. يضمن وجود ناشر مؤسسة لمعرف. إذا كان المعرف لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، فتنقله نقطة النهاية أولاً إلى ناشر مؤسسة.

- المتن: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

للمديرين فقط. يحجز جذور slugs وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزماً نائبة خاصة بلا صفوف إصدار، بحيث يستطيع
المالك نفسه لاحقاً نشر إصدار code-plugin أو bundle-plugin الحقيقي إلى ذلك الاسم.

- المتن: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط نهاية إدارة slug للمالك

- `POST /api/v1/skills/{slug}/rename`
  - المتن: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - المتن: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة رمز API ولا تعملان إلا لمالك skill.
- يحافظ `rename` على slug السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` قائمة المصدر ويعيد توجيه slug المصدر إلى القائمة الهدف.

### نقاط نهاية نقل الملكية

- `POST /api/v1/skills/{slug}/transfer`
  - المتن: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - الاستجابة: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - الاستجابة (قبول/رفض/إلغاء): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - شكل الاستجابة: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

يحظر مستخدماً ويحذف نهائياً Skills المملوكة (للمشرفين/المديرين فقط).

المتن:

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

يلغي حظر مستخدم ويستعيد Skills المؤهلة (للمديرين فقط).

المتن:

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

يغير دور مستخدم (للمديرين فقط).

المتن:

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

يسرد المستخدمين أو يبحث فيهم (للمديرين فقط).

معاملات الاستعلام:

- `q` (اختياري): استعلام البحث
- `query` (اختياري): اسم مستعار لـ`q`
- `limit` (اختياري): الحد الأقصى للنتائج (الافتراضي 20، والحد الأقصى 200)

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

يضيف/يزيل نجمة (إبرازات). كلتا نقطتي النهاية متطابقتا الأثر.

الاستجابات:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقاط نهاية CLI القديمة (مهملة)

لا تزال مدعومة لإصدارات CLI الأقدم:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

راجع `DEPRECATIONS.md` لمعرفة خطة الإزالة.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـCLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، المفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتياً، فقدّم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ `CLAWDHUB_REGISTRY` القديم).
