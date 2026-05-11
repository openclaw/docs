---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع واجهة برمجة تطبيقات HTTP (نقاط النهاية العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-05-11T20:25:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP API

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

جميع مسارات v1 تقع تحت `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الفهرس العام

يجوز للأدلة الخارجية استخدام نقاط نهاية القراءة العامة لسرد Skills في ClawHub أو البحث فيها. يرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وإرجاع المستخدمين إلى قائمة ClawHub القانونية (`https://clawhub.ai/<owner>/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد الموقع الخارجي. لا تحاول نسخ المحتوى المخفي أو الخاص أو المحظور إشرافيًا خارج سطح API العام.

تُحل اختصارات slug الويب عبر عائلات السجل، لكن على عملاء API استخدام
عناوين URL القانونية التي تعيدها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُنفذ لكل عنوان IP.
- الطلبات الموثقة (رمز Bearer صالح): تُنفذ لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يرجع السلوك إلى إنفاذ IP.
- يجب ألا تعيد نقاط نهاية الكتابة الموثقة `Unauthorized` مجردة عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة، و
  الحسابات المحذوفة/المحظورة/المعطلة كل منها على نص قابل للتنفيذ حتى يستطيع عملاء CLI
  إخبار المستخدمين بما منعهم.

- القراءة: 600/دقيقة لكل IP، 2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل IP، 180/دقيقة لكل مفتاح
- التنزيل: 30/دقيقة لكل IP، 180/دقيقة لكل مفتاح (`/api/v1/download`)

الرؤوس:

- توافق قديم: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- موحد: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- عند `429`: `Retry-After`

دلالات الرؤوس:

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

- إذا كان `Retry-After` موجودًا، فانتظر هذا العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعًا عشوائيًا لتجنب إعادة المحاولات المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسب من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم `cf-connecting-ip` (Cloudflare) لعنوان IP الخاص بالعميل افتراضيًا.
- يستخدم ClawHub رؤوس التمرير الموثوقة لتحديد عناوين IP الخاصة بالعملاء عند الحافة.
- إذا لم يتوفر عنوان IP موثوق للعميل، تستخدم طلبات التنزيل المجهولة حاوية احتياطية مقيّدة بنقطة النهاية بدلًا من حاوية عامة واحدة `ip:unknown`. لا تزال طلبات القراءة/الكتابة المجهولة تستخدم حاوية المجهول المشتركة بحيث يظل توجيه IP المفقود مرئيًا ومحافظًا.

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

- تُعاد النتائج بترتيب الصلة (تشابه التضمين + تعزيزات مطابقة رمز slug/الاسم الدقيقة + أولوية شعبية من التنزيلات).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتفوق على مطابقة أوسع ذات تنزيلات أكثر بكثير.
- يُجزأ نص ASCII على حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز مستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يعطي البحث عن `map` مطابقة معجمية أقوى لـ `personal-map` من `amap-jsapi-skill`.
- تُستخدم التنزيلات كأولوية صغيرة بمقياس لوغاريتمي وكعامل كسر تعادل، وليس كإشارة الترتيب الأساسية. يمكن أن تحصل Skills ذات التنزيلات العالية على ترتيب أدنى عندما يكون نص الاستعلام أضعف مطابقة.
- يمكن لحالة الإشراف المشبوهة أو المخفية إزالة Skill من البحث العام بناءً على مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية ثابتة تريد الاحتفاظ بها.
- لا تغيّر اسم slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا قانونيًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL القانوني وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على الحل لعناوين URL القديمة والتثبيتات التي تُحل عبر السجل، لكن ترتيب البحث يعتمد على بيانات تعريف Skill القانونية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية على نحو غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect <slug>` أثناء تسجيل الدخول قبل تغيير بيانات التعريف المتعلقة بالترتيب.

### `GET /api/v1/skills`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم صفحات لأي ترتيب غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، `installsCurrent` (اسم مستعار: `installs`)، `installsAllTime`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

ملاحظات:

- يرتب `trending` حسب التثبيتات في آخر 7 أيام (مستند إلى القياسات عن بُعد).
- `createdAt` ثابت لعمليات زحف Skills الجديدة؛ يتغير `updated` عند إعادة نشر Skills الحالية.
- عندما يكون `nonSuspiciousOnly=true`، قد تعيد الترتيبات القائمة على المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تُصفى بعد جلب الصفحة.
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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill القانونية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاص بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى Skill بيانات تعريف منصة.
- لا تُضمّن `moderation` إلا عندما تكون Skill معلّمة أو عندما يكون المالك يعرضها.

### `GET /api/v1/skills/{slug}/moderation`

يعيد حالة إشراف منظمة.

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
- يحصل المستدعون العامون على `200` فقط لـ Skills المرئية المعلّمة مسبقًا.
- تُحجب الأدلة عن المستدعين العامين ولا تتضمن مقتطفات خامًا إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن Skill لمراجعة المشرف. التقارير على مستوى Skill، وترتبط اختياريًا
بإصدار، وتغذي قائمة انتظار تقارير Skills.

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

### `POST /api/v1/skills/{slug}/appeal`

نقطة نهاية مالك/ناشر Skill لاستئناف الإشراف على Skill.

المصادقة:

- تتطلب رمز API لمالك Skill أو عضو الناشر.

الطلب:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

تُقبل الاستئنافات لنتائج Skills المخفية أو المزالة أو المشبوهة أو الخبيثة أو
المعلّمة بواسطة الماسح. يحتفظ ClawHub باستئناف مفتوح واحد لكل Skill.

الاستجابة:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

يطلب إعادة فحص أمني لأحدث إصدار منشور من Skill.

المصادقة:

- تتطلب رمز API لمالك Skill أو مسؤول الناشر أو مشرف المنصة
  أو مسؤول المنصة.
- يخضع المالكون ومسؤولو الناشر لحد استرداد المالك لكل إصدار.
  لا يخضع مشرفو المنصة ومسؤولوها لذلك، لكن ClawHub لا يزال يسمح بطلب
  إعادة فحص نشط واحد فقط لكل إصدار.

الاستجابة:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

نقطة نهاية المشرف/المسؤول لاستقبال تقارير Skills.

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

نقطة نهاية المشرف/المسؤول لحل تقارير Skills أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوبة لـ `confirmed` و`dismissed`؛ يمكن حذفها عند
إعادة ضبط `status` إلى `open`. مرر `finalAction: "hide"` مع تقرير مفروز
لإخفاء Skill في سير العمل القابل للتدقيق نفسه.

### `GET /api/v1/skills/-/appeals`

نقطة نهاية المشرف/المسؤول لاستقبال استئنافات Skills.

معلمات الاستعلام:

- `status` (اختياري): `open` (افتراضي)، `accepted`، `rejected`، أو `all`
- `limit` (اختياري): عدد صحيح (1-200)
- `cursor` (اختياري): مؤشر ترقيم صفحات

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

نقطة نهاية المشرف/المسؤول لقبول استئناف Skill أو رفضه أو إعادة فتحه.
`note` مطلوبة لـ `accepted` و`rejected`؛ يمكن حذفها عند ضبط
`status` مرة أخرى إلى `open`. مرر `finalAction: "restore"` مع استئناف مقبول
لإتاحة Skill مرة أخرى.

### `GET /api/v1/skills/{slug}/versions`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم صفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد بيانات تعريف الإصدار + قائمة الملفات.

- يتضمن `version.security` حالة التحقق من الفحص الموحّدة وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل التحقق من الفحص الأمني لإصدار skill.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يتم توفير `version` ولا `tag`، يستخدم أحدث إصدار.
- يتضمن حالة التحقق الموحّدة بالإضافة إلى التفاصيل الخاصة بكل ماسح.
- يتضمن `security.capabilityTags` تسميات قدرات/مخاطر حتمية مثل
  `crypto` و`requires-wallet` و`can-make-purchases` و`can-sign-transactions`
  و`requires-oauth-token` و`posts-externally` عند اكتشافها.
- يكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حكمًا نهائيًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى skill مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` على أنهما في سياق الإصدار نفسه.

### `GET /api/v1/skills/{slug}/file`

يعيد محتوى نصيًا خامًا.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- الافتراضي هو أحدث إصدار.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية كتالوج موحّدة لـ:

- Skills
- plugins برمجية
- plugins حزمية

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم صفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح قدرات لحزم plugin
- `target` / `hostTarget` (اختياري): اختصار لـ `host:<target>`
- `os` و`arch` و`libc` (اختياري): اختصار لمرشحات قدرة المضيف
- `requiresBrowser` و`requiresDesktop` و`requiresNativeDeps`
  و`requiresExternalService` و`requiresBinary` و`requiresOsPermission`
  (اختياري): اختصار `true`/`1` لوسوم متطلبات البيئة
- `externalService` و`binary` و`osPermission` (اختياري): اختصار لوسوم
  متطلبات البيئة المسماة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` لإظهار إصدارات الحزم المدعومة من ClawPack
  والمتاحة عبر مرآة npm

ملاحظات:

- يظل `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين مستعارين لعائلة ثابتة.
- تبقى إدخالات Skills مدعومة بسجل Skills ولا يزال يمكن نشرها فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصًا فقط لإصدارات code-plugin وbundle-plugin.
- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- لا يعيد `channel=private` إلا الحزم التي يمكن للمستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث كتالوج موحّد عبر Skills + حزم plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح قدرات لحزم plugin
- يتم قبول `target` / `hostTarget` و`os` و`arch` و`libc` و`requiresBrowser`
  و`requiresDesktop` و`requiresNativeDeps` و`requiresExternalService`
  و`requiresBinary` و`requiresOsPermission` و`externalService` و`binary` و
  `osPermission` كاختصارات لوسوم القدرات الشائعة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` للبحث في إصدارات الحزم المدعومة من ClawPack
  والمتاحة عبر مرآة npm

ملاحظات:

- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يمكن للمستدعي المصادق عليه قراءتها.
- تستند مرشحات الأثر إلى وسوم قدرات مفهرسة:
  `artifact:legacy-zip` و`artifact:npm-pack` و`npm-mirror:available`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن أيضًا حل Skills عبر هذا المسار في الكتالوج الموحّد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وكل الإصدارات حذفًا مبدئيًا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة،
  أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم صفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدار حزمة واحدًا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والقدرات، والتحقق، وبيانات تعريف الأثر، وبيانات الفحص.

ملاحظات:

- يكون `version.artifact.kind` بقيمة `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة من ClawPack.
- تتضمن إصدارات ClawPack حقولًا متوافقة مع npm هي `npmIntegrity` و`npmShasum` و
  `npmTarballName`.
- يتم تضمين `version.sha256hash` و`version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan` عند وجود بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف حالّ الأثر الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثر `legacy-zip` ورابط تنزيل ZIP قديمًا
  `downloadUrl`.
- تعيد إصدارات ClawPack أثر `npm-pack`، وحقول سلامة npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح حالّ OpenClaw؛ فهو يتجنب تخمين تنسيق الأرشيف من
  رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزّل أثر الإصدار عبر مسار الحالّ الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة لـ npm-pack المرفوع.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw مستقبلًا.

تغطي فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر ClawPack npm-pack
- ملخص الأثر
- مصدر المستودع وأصلية الالتزام
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

نقطة نهاية للمشرفين لسرد صفوف ترحيل plugins الرسمية لـ OpenClaw.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned` أو `published` أو `clawpack-ready`
  أو `legacy-zip-only` أو `metadata-ready` أو `blocked` أو `ready-for-openclaw` أو
  `all` (افتراضي).
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم صفحات

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

نقطة نهاية للمسؤولين لإنشاء أو تحديث صف ترحيل plugin رسمي.

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
- يتم تطبيع `packageName` كاسم npm؛ ويمكن أن تكون الحزمة مفقودة للترحيلات
  المخططة.
- يتتبع هذا جاهزية الترحيل فقط. لا يغيّر OpenClaw ولا ينشئ
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لطوابير مراجعة إصدارات الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (افتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم صفحات

معاني الحالة:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مُبلّغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
- `manual`: أي إصدار لديه تجاوز إشراف يدوي.
- `all`: أي إصدار لديه تجاوز يدوي، أو حالة فحص غير نظيفة، أو بلاغ عن الحزمة.

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

الإبلاغ عن حزمة لمراجعة المشرف. تكون البلاغات على مستوى الحزمة، ويمكن ربطها
اختياريًا بإصدار. تغذي هذه البلاغات طابور الإشراف لكنها لا تخفي التنزيلات تلقائيًا أو
تحظرها بحد ذاتها؛ ينبغي للمشرفين استخدام إشراف الإصدارات
للموافقة على الآثار أو عزلها أو إلغائها.

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

### `POST /api/v1/packages/{name}/appeal`

نقطة نهاية لمالك الحزمة/ناشرها لاستئناف الإشراف على إصدار.

المصادقة:

- تتطلب رمز API لمالك الحزمة أو عضو الناشر.

الطلب:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

تُقبل الاستئنافات فقط للإصدارات المعزولة أو الملغاة
أو المشبوهة أو الخبيثة. يحتفظ ClawHub باستئناف مفتوح واحد لكل إصدار.

الاستجابة:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

يطلب إعادة فحص أمني لأحدث إصدار منشور من الحزمة.

المصادقة:

- يتطلب رمز API لمالك الحزمة، أو مسؤول الناشر، أو مشرف المنصة،
  أو مسؤول المنصة.
- يخضع المالكون ومسؤولو الناشرين لحد استرداد المالك لكل إصدار.
  لا يخضع مشرفو المنصة ومسؤولوها لذلك، لكن ClawHub لا يزال يسمح
  بإعادة فحص نشطة واحدة فقط لكل إصدار.

الاستجابة:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

نقطة نهاية للمشرف/المسؤول لاستقبال طلبات استئناف الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `accepted`، أو `rejected`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

الاستجابة:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

نقطة نهاية للمشرف/المسؤول لقبول استئناف أو رفضه أو إعادة فتحه.

الطلب:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` مطلوبة عند `accepted` و`rejected`؛ ويمكن حذفها عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "approve"` مع استئناف مقبول
لاعتماد الإصدار المتأثر ضمن سير العمل نفسه القابل للتدقيق.

الاستجابة:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

نقطة نهاية للمشرف/المسؤول لاستقبال بلاغات الحزم.

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

نقطة نهاية للمالك/المشرف لإظهار حالة إشراف الحزمة.

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

نقطة نهاية للمشرف/المسؤول لحل بلاغات الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` مطلوبة عند `confirmed` و`dismissed`؛ ويمكن حذفها عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "quarantine"` أو
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

- `approved`: تمت مراجعته يدويا والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقا به سابقا.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل القطع الأثرية.
يكتب كل تغيير إدخالا في سجل التدقيق.

### `POST /api/v1/packages/backfill/artifacts`

نقطة نهاية صيانة للمسؤولين فقط لتسمية إصدارات الحزم الأقدم
ببيانات وصفية صريحة لنوع القطعة الأثرية.

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

- الوضع الافتراضي هو التشغيل التجريبي.
- الإصدارات التي لا تملك تخزين ClawPack تسمى `legacy-zip`.
- الصفوف الحالية المدعومة من ClawPack التي ينقصها `artifactKind` تصلح
  كـ `npm-pack`.
- هذا لا ينشئ ClawPacks ولا يعدل بايتات القطع الأثرية.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصيا خاما لملف حزمة.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيا.
- يستخدم حاوية معدل القراءة، لا حاوية التنزيل.
- الملفات الثنائية تعيد `415`.
- حد حجم الملف: 200KB.
- لا تحظر فحوصات VirusTotal المعلقة عمليات القراءة؛ قد تظل الإصدارات الخبيثة محجوبة في مواضع أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيا.
- يعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip بجذر `package/` لكي تستمر عملاء OpenClaw
  القديمة في العمل.
- يبقى هذا المسار مخصصا لـ ZIP فقط. لا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة المحلل.
- لا تحقن البيانات الوصفية الموجودة في السجل فقط داخل الأرشيف المنزل.
- لا تحظر فحوصات VirusTotal المعلقة عمليات التنزيل؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقا مع npm لإصدارات الحزم المدعومة من ClawPack.

ملاحظات:

- تسرد فقط الإصدارات التي تملك tarballs من نوع ClawPack npm-pack مرفوعة.
- تحذف الإصدارات القديمة التي تملك ZIP فقط عمدا.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولا متوافقة مع npm
  لكي يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments للحزم ذات النطاق كلا من `/api/npm/@scope/name` ومسار طلب npm
  المشفر `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات tarball الدقيقة المرفوعة من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 الخاص بـ ClawHub إضافة إلى بيانات سلامة/ shasum الوصفية الخاصة بـ npm.
- لا تزال فحوصات الإشراف والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

يستخدمه CLI لربط بصمة محلية بإصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي عشري بطول 64 حرفا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزل ملف zip لإصدار skill.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثلا `latest`)

ملاحظات:

- إذا لم يتم توفير `version` ولا `tag`، يستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفًا ناعمًا `410`.
- تحسب إحصاءات التنزيل كهويات فريدة في الساعة (`userId` عندما يكون رمز API صالحا، وإلا IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد مقبض المستخدم.

### `POST /api/v1/skills`

ينشر إصدارا جديدا.

- المفضل: `multipart/form-data` مع `payload` بصيغة JSON + كائنات blob في `files[]`.
- يقبل أيضا نص JSON يحتوي على `files` (مستندة إلى storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، تحل API ذلك
  الناشر من جانب الخادم وتتطلب أن يمتلك الفاعل صلاحية وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عند ضبطه على `true` مع `ownerHandle`، يمكن
  نقل skill موجودة إلى ذلك المالك إذا كان الفاعل مسؤولا/مالكا لدى كل من
  الناشر الحالي والناشر المستهدف. بدون هذا الاشتراك، ترفض تغييرات المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- المفضل: `multipart/form-data` مع `payload` بصيغة JSON + كائنات blob في `files[]`.
- يقبل أيضا نص JSON يحتوي على `files` (مستندة إلى storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، لا يجوز إلا للمسؤولين النشر نيابة عن ذلك المالك.

أبرز نقاط التحقق:

- يجب أن تكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي عمليات رفع ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب إضافات الكود `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية
  لالتزام المصدر، وبيانات وصفية لمخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يجوز النشر إلى قناة `official` إلا للناشرين الموثوقين.
- لا تزال عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك المستهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف ناعم / استعادة skill (المالك، أو المشرف، أو المسؤول).

نص JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يخزن كملاحظة إشراف على skill وينسخ إلى سجل التدقيق.
تحجز عمليات الحذف الناعم التي يبدأها المالك `slug` لمدة 30 يوما، ثم يمكن لناشر
آخر المطالبة بـ `slug`. تتضمن استجابة الحذف `slugReservedUntil` عندما تنطبق هذه المهلة.
لا تنتهي إخفاءات المشرف/المسؤول وعمليات الإزالة الأمنية بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسنًا
- `401`: غير مصرح
- `403`: ممنوع
- `404`: لم يتم العثور على skill/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمسؤولين فقط. يضمن وجود ناشر مؤسسة لمقبض. إذا كان المقبض لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، تنقله نقطة النهاية إلى ناشر مؤسسة أولا.

- النص: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

للمشرفين فقط. يحجز المسارات الجذرية وأسماء الحزم للمالك المستحق من دون نشر
إصدار. تصبح أسماء الحزم حزماً placeholder خاصة من دون صفوف إصدارات، بحيث يمكن
للمالك نفسه لاحقاً نشر الإصدار الحقيقي من code-plugin أو bundle-plugin داخل ذلك الاسم.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط نهاية إدارة slug الخاصة بالمالك

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة رمز API، ولا تعملان إلا لمالك Skills.
- يحافظ `rename` على slug السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` قائمة المصدر ويعيد توجيه slug المصدر إلى قائمة الهدف.

### نقاط نهاية نقل الملكية

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Response: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Response (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - شكل الاستجابة: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

يحظر مستخدماً ويحذف Skills المملوكة له نهائياً (للمشرف/المسؤول فقط).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

أو

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Response:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

يلغي حظر مستخدم ويستعيد Skills المؤهلة (للمسؤول فقط).

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

أو

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

يغيّر دور مستخدم (للمسؤول فقط).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

أو

```json
{ "userId": "users_...", "role": "admin" }
```

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

يسرد المستخدمين أو يبحث عنهم (للمسؤول فقط).

معلمات الاستعلام:

- `q` (اختياري): استعلام البحث
- `query` (اختياري): اسم مستعار لـ `q`
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

إضافة/إزالة نجمة (تمييزات). كلتا نقطتي النهاية idempotent.

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

إذا كنت تستضيف ذاتياً، فاخدم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ `CLAWDHUB_REGISTRY` القديم).
