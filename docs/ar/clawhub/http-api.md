---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع واجهة برمجة تطبيقات HTTP (نقاط النهاية العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-05-13T04:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة API عبر HTTP

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

كل مسارات v1 تقع ضمن `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` متاحة للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الكتالوج العام

يمكن للأدلة الخارجية استخدام نقاط النهاية العامة للقراءة لسرد ClawHub skills أو البحث فيها. يُرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وإرجاع المستخدمين إلى قائمة ClawHub الأصلية (`https://clawhub.ai/<owner>/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد الموقع الخارجي. لا تحاول عكس محتوى مخفي أو خاص أو محظور إشرافيًا خارج سطح API العام.

تُحل اختصارات slug على الويب عبر عائلات السجل، لكن يجب على عملاء API استخدام
عناوين URL الأصلية التي تُرجعها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُفرض لكل عنوان IP.
- الطلبات الموثقة (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يرجع السلوك إلى الإنفاذ حسب IP.
- يجب ألا تُرجع نقاط نهاية الكتابة الموثقة `Unauthorized` مجردة عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة،
  والحسابات المحذوفة/المحظورة/المعطلة كل منها على نص قابل للتنفيذ حتى يستطيع عملاء CLI
  إخبار المستخدمين بما منعهم.

- القراءة: 600/دقيقة لكل IP، و2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل IP، و180/دقيقة لكل مفتاح
- التنزيل: 30/دقيقة لكل IP، و180/دقيقة لكل مفتاح (`/api/v1/download`)

الترويسات:

- توافق قديم: `X-RateLimit-Limit`، `X-RateLimit-Remaining`، `X-RateLimit-Reset`
- موحدة: `RateLimit-Limit`، `RateLimit-Remaining`، `RateLimit-Reset`
- عند `429`: `Retry-After`

دلالات الترويسات:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `Retry-After`: الثواني التي يجب انتظارها قبل إعادة المحاولة (تأخير) عند `429`

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
- يستخدم ClawHub ترويسات تمرير موثوقة لتحديد عناوين IP الخاصة بالعملاء عند الحافة.
- إذا لم يتوفر عنوان IP موثوق للعميل، تستخدم طلبات التنزيل المجهولة حاوية احتياطية مقيدة بنقطة النهاية بدلًا من حاوية عامة واحدة `ip:unknown`. لا تزال طلبات القراءة/الكتابة المجهولة تستخدم حاوية غير المعروفة المشتركة بحيث يبقى التوجيه دون IP ظاهرًا ومحافظًا.

## نقاط النهاية العامة (دون مصادقة)

### `GET /api/v1/search`

معاملات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح
- `highlightedOnly` (اختياري): `true` للتصفية إلى skills المميزة
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء skills المشبوهة (`flagged.suspicious`)
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

- تُرجع النتائج بترتيب الصلة (تشابه التضمين + تعزيزات مطابقة رمز slug/الاسم الدقيقة + أسبقية الشعبية من التنزيلات).
- الصلة أقوى من الشعبية. يمكن لمطابقة رمز slug دقيق أو اسم العرض أن تتفوق في الترتيب على مطابقة أوسع لديها تنزيلات أكثر بكثير.
- يُجزأ نص ASCII على حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز مستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك فإن البحث عن `map` يعطي `personal-map` مطابقة معجمية أقوى من `amap-jsapi-skill`.
- تُستخدم التنزيلات كأسبقية صغيرة بمقياس لوغاريتمي وكفاصل تعادل، وليس كإشارة الترتيب الأساسية. يمكن أن تأتي skills كثيرة التنزيلات في ترتيب أدنى عندما يكون نص الاستعلام أضعف مطابقة.
- يمكن لحالة الإشراف المشبوهة أو المخفية إزالة skill من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تغيّر اسم slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا أصليًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأصلي، وslug المعروض، وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على التحليل لعناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يستند إلى بيانات skill الوصفية الأصلية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع skill.
- إذا كانت skill غير مرئية على نحو غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect <slug>` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المتعلقة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم صفحات لأي فرز غير `trending`
- `sort` (اختياري): `updated` (الافتراضي)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، `installsCurrent` (اسم مستعار: `installs`)، `installsAllTime`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

ملاحظات:

- يرتب `trending` حسب عمليات التثبيت في آخر 7 أيام (استنادًا إلى القياس عن بُعد).
- `createdAt` مستقر لزحوفات skills الجديدة؛ يتغير `updated` عندما يُعاد نشر skills الموجودة.
- عند `nonSuspiciousOnly=true`، قد تُرجع عمليات الفرز المستندة إلى المؤشر عناصر أقل من `limit` في الصفحة لأن skills المشبوهة تُرشح بعد استرداد الصفحة.
- استخدم `nextCursor` لمتابعة ترقيم الصفحات عند وجوده. لا تعني الصفحة القصيرة بحد ذاتها نهاية النتائج.

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

- تُحل slugs القديمة التي تنشأ عن تدفقات إعادة تسمية/دمج المالك إلى skill الأصلية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاصة بـ skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى skill بيانات وصفية للمنصة.
- تُدرج `moderation` فقط عندما تكون skill معلّمة أو عندما يعرضها المالك.

### `GET /api/v1/skills/{slug}/moderation`

يُرجع حالة إشراف منظمة.

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

- يمكن للمالكين والمشرفين الوصول إلى تفاصيل الإشراف لـ skills المخفية.
- يحصل المستدعون العامون على `200` فقط لـ skills المرئية المعلّمة مسبقًا.
- تُحجب الأدلة للمستدعين العامين، ولا تتضمن المقاطع الخام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن skill لمراجعة المشرف. التقارير على مستوى skill، ومرتبطة اختياريًا
بإصدار، وتغذي قائمة انتظار تقارير skill.

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

نقطة نهاية المشرف/المدير لاستقبال تقارير skill.

معاملات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `confirmed`، أو `dismissed`، أو `all`
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

نقطة نهاية المشرف/المدير لحل تقارير skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع تقرير مفروز
لإخفاء skill في سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يُرجع البيانات الوصفية للإصدار + قائمة الملفات.

- يتضمن `version.security` حالة تحقق الفحص المعيارية وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يُرجع تفاصيل تحقق الفحص الأمني لإصدار skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يُقدَّم `version` ولا `tag`، يستخدم أحدث إصدار.
- يتضمن حالة التحقق المعيارية بالإضافة إلى تفاصيل خاصة بكل ماسح.
- يتضمن `security.capabilityTags` تسميات قدرة/مخاطر حتمية مثل
  `crypto`، و`requires-wallet`، و`can-make-purchases`، و`can-sign-transactions`،
  و`requires-oauth-token`، و`posts-externally` عند اكتشافها.
- تكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حكمًا نهائيًا (`clean`، أو `suspicious`، أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى skill مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` كسياق الإصدار نفسه.

### `GET /api/v1/skills/{slug}/file`

يُرجع محتوى نصيًا خامًا.

معاملات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية كتالوج موحدة لـ:

- skills
- code plugins
- bundle plugins

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح قدرات لحزم Plugin
- `target` / `hostTarget` (اختياري): اختصار لـ `host:<target>`
- `os`، `arch`، `libc` (اختياري): اختصار لمرشحات قدرات المضيف
- `requiresBrowser`، `requiresDesktop`، `requiresNativeDeps`،
  `requiresExternalService`، `requiresBinary`، `requiresOsPermission`
  (اختياري): اختصار `true`/`1` لوسوم متطلبات البيئة
- `externalService`، `binary`، `osPermission` (اختياري): اختصار لوسوم
  متطلبات البيئة المسماة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` لإظهار إصدارات الحزم المدعومة من ClawPack
  والمتاحة عبر مرآة npm

ملاحظات:

- يظل `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين مستعارين ثابتين للعائلة.
- تبقى إدخالات Skills مدعومة بسجل Skills ولا يزال نشرها ممكنا فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصا فقط لإصدارات code-plugin وbundle-plugin.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحد في الفهرس عبر Skills + حزم Plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح قدرات لحزم Plugin
- `target` / `hostTarget`، `os`، `arch`، `libc`، `requiresBrowser`،
  `requiresDesktop`، `requiresNativeDeps`، `requiresExternalService`،
  `requiresBinary`، `requiresOsPermission`، `externalService`، `binary`، و
  `osPermission` مقبولة كاختصارات لوسوم القدرات الشائعة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` للبحث عن إصدارات الحزم المدعومة من ClawPack
  والمتاحة عبر مرآة npm

ملاحظات:

- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.
- تستند مرشحات القطع الأثرية إلى وسوم قدرات مفهرسة:
  `artifact:legacy-zip`، `artifact:npm-pack`، و`npm-mirror:available`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفصيلية للحزمة.

ملاحظات:

- يمكن أيضا حل Skills عبر هذا المسار في الفهرس الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف الحزمة وجميع الإصدارات حذفا مبدئيا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مشرف ناشر مؤسسة، أو مشرف منصة، أو مسؤول منصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدار حزمة واحدا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والقدرات، والتحقق، وبيانات تعريف القطعة الأثرية، وبيانات الفحص.

ملاحظات:

- تكون `version.artifact.kind` مساوية لـ `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة من ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- يتم تضمين `version.sha256hash` و`version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan` عند وجود بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/security`

يعيد ملخص الأمان والثقة الدقيق لإصدار الحزمة لعملاء التثبيت. هذه هي واجهة الاستهلاك العامة في OpenClaw لتحديد ما إذا كان يمكن تثبيت إصدار محلول.

المصادقة:

- نقطة نهاية قراءة عامة. لا يلزم رمز مالك أو ناشر أو مشرف أو مسؤول.

الاستجابة:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

حقول الاستجابة:

- يحدد `package.name` و`package.displayName` و`package.family` حزمة السجل المحلولة.
- يحدد `release.releaseId` و`release.version` و`release.createdAt` الإصدار الدقيق الذي تم تقييمه.
- توجد `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity` و
  `release.npmShasum` و`release.npmTarballName` عند معرفتها لقطعة الإصدار الأثرية.
- `trust.scanStatus` هي حالة الثقة الفعلية المشتقة من مدخلات الماسح وإشراف الإصدار اليدوي.
- `trust.moderationState` قابلة لأن تكون فارغة. تكون `null` عند عدم وجود إشراف يدوي على الإصدار.
- `trust.blockedFromDownload` هي إشارة حظر التثبيت. يجب على OpenClaw وعملاء التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلا من إعادة اشتقاق قواعد الحظر من حقول الماسح أو الإشراف.
- `trust.reasons` هي قائمة الشرح الموجهة للمستخدم والتدقيق. رموز الأسباب سلاسل مستقرة ومضغوطة مثل `manual:quarantined` و`scan:malicious` و
  `static:malicious` و`vt:suspicious` و`package:malicious`.
- تعني `trust.pending` أن واحدا أو أكثر من مدخلات الثقة لا يزال ينتظر الاكتمال.
- تعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة ويجب التعامل معه كأنه يتطلب تحديثا قبل قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة للإصدار. يجب على العملاء استدعاؤها بعد حل إصدار الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف للحزمة.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدا من نقاط نهاية إشراف المالك/المشرف. فهي تعرض قرار التثبيت والشرح العام، لا هويات المبلغين أو نصوص البلاغات أو الأدلة الخاصة أو الجداول الزمنية الداخلية للمراجعة.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل القطعة الأثرية الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة قطعة أثرية `legacy-zip` و`downloadUrl` خاصا بملف ZIP القديم.
- تعيد إصدارات ClawPack قطعة أثرية `npm-pack`، وحقول تكامل npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذه هي واجهة محلل OpenClaw؛ فهي تتجنب تخمين تنسيق الأرشيف من رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزل قطعة الإصدار الأثرية عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة من npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تغطي فحوص الجاهزية:

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

نقطة نهاية للمشرف لسرد صفوف ترحيل OpenClaw Plugin الرسمية.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned` أو `published` أو `clawpack-ready` أو
  `legacy-zip-only` أو `metadata-ready` أو `blocked` أو `ready-for-openclaw` أو
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

نقطة نهاية للمسؤول لإنشاء أو تحديث صف ترحيل Plugin رسمي.

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
- تتم تسوية `packageName` كاسم npm؛ ويمكن أن تكون الحزمة مفقودة للترحيلات المخطط لها.
- يتتبع هذا جاهزية الترحيل فقط. ولا يعدل OpenClaw أو ينشئ ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرف/المسؤول لقوائم انتظار مراجعة إصدارات الحزم.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالات:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مبلغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
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

أبلِغ عن حزمة لمراجعة المشرفين. تكون البلاغات على مستوى الحزمة، ويمكن
ربطها اختياريًا بإصدار. وهي تغذي قائمة انتظار الإشراف لكنها لا تُخفي التنزيلات
أو تحظرها تلقائيًا بذاتها؛ يجب على المشرفين استخدام إشراف الإصدارات
لاعتماد القطع الأثرية أو عزلها أو إبطالها.

المصادقة:

- يتطلب API token.

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

نقطة نهاية للمشرف/المسؤول لاستقبال بلاغات الحزم.

المصادقة:

- تتطلب API token لمستخدم مشرف أو مسؤول.

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

نقطة نهاية للمالك/المشرف لظهور حالة إشراف الحزمة.

المصادقة:

- تتطلب API token لمالك الحزمة، أو عضو الناشر، أو المشرف، أو
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

نقطة نهاية للمشرف/المسؤول لحسم بلاغات الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` مطلوبة عند `confirmed` و`dismissed`؛ ويمكن حذفها عند
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

نقطة نهاية للمشرف/المسؤول لمراجعة إصدار الحزمة.

الطلب:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

الحالات المدعومة:

- `approved`: تمت مراجعته يدويًا والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقًا سابقًا.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل القطع الأثرية.
تكتب كل عملية تغيير إدخالًا في سجل التدقيق.

### `POST /api/v1/packages/backfill/artifacts`

نقطة نهاية صيانة للمسؤولين فقط لتوسيم إصدارات الحزم الأقدم ببيانات وصفية
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

- الإعداد الافتراضي هو التشغيل التجريبي.
- الإصدارات التي لا تحتوي على تخزين ClawPack تُوسم بأنها `legacy-zip`.
- الصفوف الحالية المدعومة بـ ClawPack والتي ينقصها `artifactKind` تُصلح
  كـ `npm-pack`.
- لا ينشئ هذا ClawPacks ولا يغيّر بايتات القطع الأثرية.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصيًا خامًا لملف حزمة.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم الإصدار الأحدث افتراضيًا.
- يستخدم حاوية معدل القراءة، لا حاوية التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200KB.
- لا تحظر فحوصات VirusTotal المعلقة عمليات القراءة؛ قد تظل الإصدارات الضارة محجوبة في مواضع أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزّل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم الإصدار الأحدث افتراضيًا.
- يعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip ذات جذر `package/` كي يستمر عمل عملاء OpenClaw
  القدامى.
- يبقى هذا المسار مخصصًا لـ ZIP فقط. ولا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات تكامل المحلل.
- لا تُحقن البيانات الوصفية الخاصة بالسجل فقط في الأرشيف الذي تم تنزيله.
- لا تحظر فحوصات VirusTotal المعلقة التنزيلات؛ وتعيد الإصدارات الضارة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقًا مع npm لإصدارات الحزم المدعومة بـ ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي لديها tarballs من نوع ClawPack npm-pack مرفوعة.
- تُحذف عمدًا الإصدارات القديمة التي تدعم ZIP فقط.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولًا متوافقة مع npm
  بحيث يمكن للمستخدمين توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كِلا مساري الطلب `/api/npm/@scope/name` ومسار
  npm المشفر `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات tarball الدقيقة المرفوعة من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 الخاص بـ ClawHub إضافة إلى بيانات metadata الخاصة بتكامل/shasum في npm.
- لا تزال فحوصات الإشراف والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

يستخدمه CLI لمطابقة بصمة محلية بإصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي بطول 64 محرفًا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزّل ملف zip لإصدار مهارة.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يتم توفير `version` ولا `tag`، يُستخدم الإصدار الأحدث.
- تعيد الإصدارات المحذوفة حذفًا مرنًا `410`.
- تُحتسب إحصاءات التنزيل كهويات فريدة لكل ساعة (`userId` عند صلاحية API token، وإلا IP).

## نقاط نهاية المصادقة (Bearer token)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصدارًا جديدًا.

- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات blobs في `files[]`.
- يُقبل أيضًا نص JSON يحتوي على `files` (قائم على storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، يحل API ذلك
  الناشر على جهة الخادم ويتطلب أن يملك الفاعل صلاحية وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عند `true` مع `ownerHandle`، يمكن
  نقل مهارة موجودة إلى ذلك المالك إذا كان الفاعل مسؤولًا/مالكًا لدى كل من
  الناشر الحالي والناشر الهدف. من دون هذا الاشتراك الصريح، تُرفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة Bearer token.
- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات blobs في `files[]`.
- يُقبل أيضًا نص JSON يحتوي على `files` (قائم على storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، يمكن للمسؤولين فقط النشر نيابة عن ذلك المالك.

أبرز نقاط التحقق:

- يجب أن تكون `family` هي `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي رفوعات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب code plugins وجود `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية للالتزام المصدر،
  وبيانات وصفية لمخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` هما بيانات وصفية اختيارية.
- يمكن للناشرين الموثوقين فقط النشر إلى قناة `official`.
- لا تزال عمليات النشر نيابة عن الغير تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف مرن / استعادة مهارة (المالك، أو المشرف، أو المسؤول).

نص JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزن كملاحظة إشراف للمهارة ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف المرن التي يبدأها المالك slug لمدة 30 يومًا، ثم يمكن لناشر
آخر المطالبة به. تتضمن استجابة الحذف `slugReservedUntil` عندما تنطبق مدة الانتهاء هذه.
لا تنتهي عمليات الإخفاء بواسطة المشرف/المسؤول وعمليات الإزالة الأمنية بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسنًا
- `401`: غير مصرح
- `403`: محظور
- `404`: لم تُعثر على المهارة/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمسؤولين فقط. يضمن وجود ناشر مؤسسة لمعرّف. إذا كان المعرّف لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، تنقله نقطة النهاية أولًا إلى ناشر مؤسسة.

- النص: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

للمسؤولين فقط. يحجز slugs الجذر وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزمًا خاصة موضعية بلا صفوف إصدارات، بحيث يمكن للمالك
نفسه نشر إصدار code-plugin أو bundle-plugin الحقيقي لاحقًا إلى ذلك الاسم.

- النص: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط نهاية إدارة slug الخاصة بالمالك

- `POST /api/v1/skills/{slug}/rename`
  - النص: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - النص: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا النقطتين مصادقة API token، وتعملان فقط لمالك المهارة.
- يحافظ `rename` على slug السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` إدراج المصدر ويعيد توجيه slug المصدر إلى إدراج الهدف.

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

احظر مستخدمًا واحذف Skills المملوكة حذفًا نهائيًا (للمشرف/المسؤول فقط).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

or

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Response:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ألغِ حظر مستخدم واستعد Skills المؤهلة (للمسؤول فقط).

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

or

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

غيّر دور مستخدم (للمسؤول فقط).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

or

```json
{ "userId": "users_...", "role": "admin" }
```

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

اعرض المستخدمين أو ابحث عنهم (للمسؤول فقط).

معلمات الاستعلام:

- `q` (اختياري): استعلام البحث
- `query` (اختياري): اسم بديل لـ `q`
- `limit` (اختياري): الحد الأقصى للنتائج (الافتراضي 20، والحد الأقصى 200)

Response:

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

أضف/أزل نجمة (تمييزات). كلتا نقطتي النهاية آمنتان للتكرار.

Responses:

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

راجع `DEPRECATIONS.md` لمعرفة خطة الإزالة.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضّل)
- `/.well-known/clawdhub.json` (قديم)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيًا، فوفّر هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ والمتغير القديم `CLAWDHUB_REGISTRY`).
