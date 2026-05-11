---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع واجهة برمجة تطبيقات HTTP (العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-05-11T22:19:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP API

عنوان URL الأساسي: `https://clawhub.ai` (افتراضي).

كل مسارات v1 تقع تحت `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الفهرس العام

يجوز للأدلة الخارجية استخدام نقاط نهاية القراءة العامة لسرد Skills الخاصة بـ ClawHub أو البحث فيها. يُرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وربط المستخدمين مرة أخرى بقائمة ClawHub الأساسية (`https://clawhub.ai/<owner>/<slug>`)، وتجنّب الإيحاء بأن ClawHub يؤيد الموقع الخارجي. لا تحاول عكس المحتوى المخفي أو الخاص أو المحظور بالرقابة خارج سطح API العام.

تُحلّ اختصارات slug على الويب عبر عائلات السجل، لكن يجب على عملاء API استخدام
عناوين URL الأساسية التي تعيدها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الفرض:

- الطلبات المجهولة: تُفرض لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى الفرض حسب IP.
- يجب ألا تعيد نقاط نهاية الكتابة المصادق عليها `Unauthorized` مجردًا عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة،
  والحسابات المحذوفة/المحظورة/المعطلة على نص قابل للتنفيذ حتى يستطيع عملاء CLI
  إخبار المستخدمين بما منعهم.

- القراءة: 600/دقيقة لكل IP، و2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل IP، و180/دقيقة لكل مفتاح
- التنزيل: 30/دقيقة لكل IP، و180/دقيقة لكل مفتاح (`/api/v1/download`)

الرؤوس:

- توافق قديم: `X-RateLimit-Limit`، `X-RateLimit-Remaining`، `X-RateLimit-Reset`
- موحّد: `RateLimit-Limit`، `RateLimit-Remaining`، `RateLimit-Reset`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `Retry-After`: الثواني الواجب انتظارها قبل إعادة المحاولة (تأخير) عند `429`

مثال استجابة `429`:

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

- إذا كان `Retry-After` موجودًا، فانتظر ذلك العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعًا عشوائي الاهتزاز لتجنّب عمليات إعادة المحاولة المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم `cf-connecting-ip` (Cloudflare) لعنوان IP العميل افتراضيًا.
- يستخدم ClawHub رؤوس التمرير الموثوقة لتحديد عناوين IP العملاء عند الحافة.
- إذا لم يتوفر عنوان IP عميل موثوق، تستخدم طلبات التنزيل المجهولة حاوية احتياطية محددة لنقطة النهاية بدلًا من حاوية `ip:unknown` عالمية واحدة. لا تزال طلبات القراءة/الكتابة المجهولة تستخدم الحاوية المجهولة المشتركة حتى يبقى توجيه IP المفقود ظاهرًا ومحافظًا.

## نقاط النهاية العامة (بلا مصادقة)

### `GET /api/v1/search`

معاملات الاستعلام:

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

- تُعاد النتائج بترتيب الصلة (تشابه التضمين + تعزيزات رمز slug/الاسم المطابقة تمامًا + أسبقية الشعبية من التنزيلات).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتقدم على مطابقة أوسع لديها تنزيلات أكثر بكثير.
- يُقسّم نص ASCII إلى رموز عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز مستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يمنح البحث عن `map` مطابقة معجمية أقوى لـ `personal-map` مقارنة بـ `amap-jsapi-skill`.
- تُستخدم التنزيلات كأسبقية صغيرة بمقياس لوغاريتمي وكعامل كسر تعادل، لا كإشارة الترتيب الأساسية. يمكن أن تحتل Skills كثيرة التنزيلات ترتيبًا أدنى عندما يكون نص الاستعلام أضعف مطابقة.
- قد تُزيل حالة الرقابة المشبوهة أو المخفية Skill من البحث العام بحسب فلاتر المستدعي وحالة الرقابة الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تُعد تسمية slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا أساسيًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأساسي وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على الحل لعناوين URL القديمة والتثبيتات التي تُحل عبر السجل، لكن ترتيب البحث يستند إلى بيانات Skill الوصفية الأساسية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية بشكل غير متوقع، فتحقق أولًا من حالة الرقابة باستخدام `clawhub inspect <slug>` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المتعلقة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي فرز غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، `installsCurrent` (اسم مستعار: `installs`)، `installsAllTime`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

ملاحظات:

- يرتّب `trending` حسب التثبيتات في آخر 7 أيام (استنادًا إلى القياسات).
- يكون `createdAt` مستقرًا لعمليات زحف Skills الجديدة؛ يتغير `updated` عندما يُعاد نشر Skills موجودة.
- عندما يكون `nonSuspiciousOnly=true`، قد تعيد عمليات الفرز المعتمدة على المؤشر عناصر أقل من `limit` في صفحة ما لأن Skills المشبوهة تُرشح بعد استرجاع الصفحة.
- استخدم `nextCursor` لمتابعة ترقيم الصفحات عندما يكون موجودًا. لا تعني الصفحة القصيرة بحد ذاتها نهاية النتائج.

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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill الأساسية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاص بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى Skill أي بيانات وصفية للمنصة.
- تُضمّن `moderation` فقط عندما تكون Skill معلّمة أو عندما يعرضها المالك.

### `GET /api/v1/skills/{slug}/moderation`

يعيد حالة رقابة منظمة.

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

- يستطيع المالكون والمشرفون الوصول إلى تفاصيل الرقابة الخاصة بـ Skills المخفية.
- لا يحصل المستدعون العامون على `200` إلا لـ Skills المرئية والمعلّمة مسبقًا.
- تُنقّح الأدلة للمستدعين العامين ولا تتضمن المقاطع الخام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن Skill لمراجعة المشرفين. تكون البلاغات على مستوى Skill، وترتبط
اختياريًا بإصدار، وتغذي قائمة انتظار بلاغات Skills.

المصادقة:

- يتطلب رمز API.

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

نقطة نهاية للمشرف/المدير لاستقبال بلاغات Skills.

معاملات الاستعلام:

- `status` (اختياري): `open` (افتراضي)، `confirmed`، `dismissed`، أو `all`
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

نقطة نهاية للمشرف/المدير لحل بلاغات Skills أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "hide"` مع بلاغ
تم فرزه لإخفاء Skill في سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد بيانات الإصدار الوصفية + قائمة الملفات.

- يتضمن `version.security` حالة تحقق الفحص الموحّدة وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل تحقق الفحص الأمني لإصدار Skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (مثل `latest`).

ملاحظات:

- إذا لم يُقدّم لا `version` ولا `tag`، يستخدم أحدث إصدار.
- يتضمن حالة تحقق موحّدة إضافة إلى تفاصيل خاصة بكل ماسح.
- يتضمن `security.capabilityTags` تسميات قدرة/مخاطر حتمية مثل
  `crypto` و`requires-wallet` و`can-make-purchases` و`can-sign-transactions`
  و`requires-oauth-token` و`posts-externally` عند اكتشافها.
- يكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حكمًا نهائيًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` لقطة رقابة حالية على مستوى Skill مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` كسياق الإصدار نفسه.

### `GET /api/v1/skills/{slug}/file`

يعيد محتوى نصيًا خامًا.

معاملات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية فهرس موحدة لـ:

- Skills
- Plugins برمجية
- Plugins الحِزم

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح إمكانات لحزم Plugin
- `target` / `hostTarget` (اختياري): اختصار لـ `host:<target>`
- `os` و`arch` و`libc` (اختياري): اختصار لمرشحات إمكانات المضيف
- `requiresBrowser` و`requiresDesktop` و`requiresNativeDeps`،
  و`requiresExternalService` و`requiresBinary` و`requiresOsPermission`
  (اختياري): اختصار `true`/`1` لوسوم متطلبات البيئة
- `externalService` و`binary` و`osPermission` (اختياري): اختصار لوسوم متطلبات
  البيئة المسماة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` لإظهار إصدارات الحزم المدعومة من ClawPack
  المتاحة عبر مرآة npm

ملاحظات:

- يظل `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` أسماء بديلة ثابتة العائلة.
- تبقى إدخالات Skill مدعومة بسجل Skill، ولا يزال يمكن نشرها فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصا فقط لإصدارات code-plugin وbundle-plugin.
- يرى المتصلون المجهولون قنوات الحزم العامة فقط.
- يمكن للمتصلين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج السرد/البحث.
- يعيد `channel=private` فقط الحزم التي يمكن للمتصل المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحد في الفهرس عبر Skills + حزم Plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح إمكانات لحزم Plugin
- `target` / `hostTarget` و`os` و`arch` و`libc` و`requiresBrowser`،
  و`requiresDesktop` و`requiresNativeDeps` و`requiresExternalService`،
  و`requiresBinary` و`requiresOsPermission` و`externalService` و`binary` و
  `osPermission` مقبولة كاختصارات لوسوم الإمكانات الشائعة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` للبحث في إصدارات الحزم المدعومة من ClawPack
  المتاحة عبر مرآة npm

ملاحظات:

- يرى المتصلون المجهولون قنوات الحزم العامة فقط.
- يمكن للمتصلين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- يعيد `channel=private` فقط الحزم التي يمكن للمتصل المصادق عليه قراءتها.
- تستند مرشحات القطع الأثرية إلى وسوم إمكانات مفهرسة:
  `artifact:legacy-zip` و`artifact:npm-pack` و`npm-mirror:available`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن أيضا حل Skills عبر هذا المسار في الفهرس الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المتصل قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف الحزمة وجميع الإصدارات حذفا ناعما.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المتصل قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدار حزمة واحدا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والإمكانات، والتحقق، وبيانات تعريف القطعة الأثرية، وبيانات الفحص.

ملاحظات:

- يكون `version.artifact.kind` هو `legacy-zip` لأرشيفات حزم العالم القديم أو
  `npm-pack` للإصدارات المدعومة من ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- يتم تضمين `version.sha256hash` و`version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan` عند وجود بيانات الفحص.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المتصل قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل القطعة الأثرية الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة قطعة أثرية `legacy-zip` و`downloadUrl` لملف ZIP
  قديم.
- تعيد إصدارات ClawPack قطعة أثرية `npm-pack`، وحقول تكامل npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح محلل OpenClaw؛ فهو يتجنب تخمين تنسيق الأرشيف من
  رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزل قطعة أثرية للإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة بصيغة npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تغطي فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر قطعة ClawPack npm-pack الأثرية
- ملخص القطعة الأثرية
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

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned` أو `published` أو `clawpack-ready`،
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

- يتم تطبيع `bundledPluginId` إلى أحرف صغيرة وهو مفتاح upsert المستقر.
- يتم تطبيع `packageName` كاسم npm؛ قد تكون الحزمة غير موجودة للترحيلات
  المخططة.
- يتتبع هذا جاهزية الترحيل فقط. لا يغير OpenClaw ولا ينشئ
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لقوائم انتظار مراجعة إصدارات الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (افتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالات:

- `open`: إصدارات مشبوهة، أو خبيثة، أو معلقة، أو محجورة، أو ملغاة، أو مبلغ عنها.
- `blocked`: إصدارات محجورة، أو ملغاة، أو خبيثة.
- `manual`: أي إصدار لديه تجاوز إشراف يدوي.
- `all`: أي إصدار لديه تجاوز يدوي، أو حالة فحص غير نظيفة، أو بلاغ حزمة.

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

يبلغ عن حزمة لمراجعة المشرف. البلاغات على مستوى الحزمة، وترتبط اختياريا
بإصدار. تغذي قائمة انتظار الإشراف لكنها لا تخفي التنزيلات تلقائيا ولا
تحظرها بذاتها؛ ينبغي للمشرفين استخدام إشراف الإصدارات
لاعتماد القطع الأثرية، أو حجرها، أو إلغائها.

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

`note` مطلوب مع `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "quarantine"` أو
`finalAction: "revoke"` مع تقرير مؤكد لتطبيق ضبط الإصدار ضمن
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

نقطة نهاية للمشرفين/المديرين لمراجعة إصدار الحزمة.

الطلب:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

الحالات المدعومة:

- `approved`: تمت مراجعته يدوياً ومسموح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقاً سابقاً.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل القطع الأثرية.
يكتب كل تغيير إدخالاً في سجل التدقيق.

### `POST /api/v1/packages/backfill/artifacts`

نقطة نهاية صيانة للمديرين فقط لوضع وسم على إصدارات الحزم الأقدم ببيانات
صريحة لنوع القطعة الأثرية.

نص الطلب:

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
- الإصدارات التي لا تحتوي على تخزين ClawPack توسم باسم `legacy-zip`.
- الصفوف الموجودة المدعومة من ClawPack التي تفتقد `artifactKind` يتم إصلاحها كـ
  `npm-pack`.
- هذا لا ينشئ ClawPacks ولا يعدل بايتات القطع الأثرية.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصياً خاماً لملف حزمة.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار بشكل افتراضي.
- يستخدم حاوية معدل القراءة، وليس حاوية التنزيل.
- الملفات الثنائية تعيد `415`.
- حد حجم الملف: 200KB.
- لا تمنع فحوصات VirusTotal المعلقة القراءة؛ وقد تظل الإصدارات الخبيثة محجوبة في مواضع أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار بشكل افتراضي.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip بجذر `package/` حتى يظل عملاء OpenClaw
  القدامى يعملون.
- يبقى هذا المسار مخصصاً لـ ZIP فقط. ولا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة محلل الحزم.
- لا تُحقن بيانات السجل الوصفية فقط في الأرشيف المنزل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ وتعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقاً مع npm لإصدارات الحزم المدعومة من ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي تحتوي على ملفات tarball من نوع ClawPack npm-pack مرفوعة.
- تُحذف عمداً الإصدارات القديمة التي تقتصر على ZIP.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولاً متوافقة مع npm
  حتى يستطيع المستخدمون توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلاً من `/api/npm/@scope/name` ومسار طلب npm
  المشفر `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات tarball المرفوعة من ClawPack كما هي لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 من ClawHub إضافة إلى بيانات npm integrity/shasum الوصفية.
- لا تزال فحوصات الضبط والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

يستخدمه CLI لمطابقة بصمة محلية مع إصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي بطول 64 محرفاً لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزل ملف zip لإصدار Skill.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثلاً `latest`)

ملاحظات:

- إذا لم يُقدّم لا `version` ولا `tag`، يُستخدم أحدث إصدار.
- الإصدارات المحذوفة حذفاً ليناً تعيد `410`.
- تُحتسب إحصاءات التنزيل كهويات فريدة لكل ساعة (`userId` عندما يكون رمز API صالحاً، وإلا عنوان IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد مقبض المستخدم.

### `POST /api/v1/skills`

ينشر إصداراً جديداً.

- مفضل: `multipart/form-data` مع JSON في `payload` + كتل `files[]`.
- يُقبل أيضاً نص JSON يحتوي على `files` (مبنية على storageId).
- حقل اختياري في الحمولة: `ownerHandle`. عند وجوده، يحل API ذلك
  الناشر من جهة الخادم ويتطلب أن يكون لدى الفاعل وصول إلى الناشر.
- حقل اختياري في الحمولة: `migrateOwner`. عندما يكون `true` مع `ownerHandle`، قد تنتقل
  Skill موجودة إلى ذلك المالك إذا كان الفاعل مديراً/مالكاً لدى كل من
  الناشرين الحالي والهدف. ومن دون هذا الاشتراك الصريح، تُرفض تغييرات المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- مفضل: `multipart/form-data` مع JSON في `payload` + كتل `files[]`.
- يُقبل أيضاً نص JSON يحتوي على `files` (مبنية على storageId).
- حقل اختياري في الحمولة: `ownerHandle`. عند وجوده، لا يجوز النشر نيابة عن ذلك المالك إلا للمديرين.

أبرز نقاط التحقق:

- يجب أن تكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي رفوعات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب Plugins الشيفرة `package.json` وبيانات وصفية لمستودع المصدر وبيانات وصفية
  لالتزام المصدر وبيانات وصفية لمخطط الإعداد و`openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يجوز النشر إلى قناة `official` إلا للناشرين الموثوقين.
- لا تزال عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف لين / استعادة Skill (المالك أو المشرف أو المدير).

نص JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزن كملاحظة ضبط Skill ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف اللين التي يبدأها المالك `slug` لمدة 30 يوماً، ثم يمكن لناشر
آخر المطالبة بـ `slug`. تتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانتهاء.
عمليات الإخفاء من المشرف/المدير وعمليات الإزالة الأمنية لا تنتهي بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسن
- `401`: غير مصرح
- `403`: محظور
- `404`: لم يُعثر على Skill/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمديرين فقط. يضمن وجود ناشر مؤسسة لمقبض. إذا كان المقبض لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، تنقله نقطة النهاية إلى ناشر مؤسسة أولاً.

- النص: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

للمديرين فقط. يحجز الجذور `slug` وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزماً نائبة خاصة بلا صفوف إصدارات، بحيث يستطيع المالك نفسه
لاحقاً نشر إصدار code-plugin أو bundle-plugin الحقيقي بذلك الاسم.

- النص: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط نهاية إدارة `slug` للمالك

- `POST /api/v1/skills/{slug}/rename`
  - النص: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - النص: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة رمز API ولا تعملان إلا لمالك Skill.
- يحافظ `rename` على `slug` السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` إدراج المصدر ويعيد توجيه `slug` المصدر إلى إدراج الهدف.

### نقاط نهاية نقل الملكية

- `POST /api/v1/skills/{slug}/transfer`
  - النص: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - الاستجابة: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - الاستجابة (قبول/رفض/إلغاء): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - شكل الاستجابة: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

يحظر مستخدماً ويحذف Skills المملوكة حذفاً نهائياً (للمشرف/المدير فقط).

النص:

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

النص:

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

النص:

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

يسرد المستخدمين أو يبحث عنهم (للمديرين فقط).

معلمات الاستعلام:

- `q` (اختياري): استعلام البحث
- `query` (اختياري): اسم بديل لـ `q`
- `limit` (اختياري): الحد الأقصى للنتائج (الافتراضي 20، الأقصى 200)

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

إضافة/إزالة نجمة (إبرازات). كلتا نقطتي النهاية idempotent.

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

راجع `DEPRECATIONS.md` لخطة الإزالة.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يستطيع CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتياً، فقدم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ القديم `CLAWDHUB_REGISTRY`).
