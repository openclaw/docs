---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع HTTP API (النقاط الطرفية العامة + نقاط CLI الطرفية + المصادقة).
x-i18n:
    generated_at: "2026-07-01T15:23:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP API

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

كل مسارات v1 تقع تحت `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الفهرس العام

يمكن للأدلة الخارجية استخدام نقاط النهاية العامة للقراءة لسرد Skills في ClawHub أو البحث فيها. يرجى تخزين النتائج مؤقتا، واحترام `429`/`Retry-After`، وربط المستخدمين بالقائمة الأساسية في ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد الموقع الخارجي. لا تحاول نسخ المحتوى المخفي أو الخاص أو المحظور بالإشراف خارج سطح واجهة API العامة.

تعمل اختصارات slug على الويب عبر عائلات السجل، لكن يجب على عملاء API استخدام
عناوين URL الأساسية التي ترجعها نقاط نهاية القراءة بدلا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تطبق لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تطبق لكل حاوية مستخدم.
- إذا كان الرمز مفقودا/غير صالح، يعود السلوك إلى الإنفاذ حسب IP.
- يجب ألا ترجع نقاط نهاية الكتابة المصادق عليها قيمة `Unauthorized` مجردة عندما
  يعرف الخادم السبب. يجب أن يحصل كل من الرموز المفقودة، والرموز غير الصالحة/الملغاة، و
  الحسابات المحذوفة/المحظورة/المعطلة على نص قابل للتنفيذ حتى يتمكن عملاء CLI
  من إخبار المستخدمين بما منعهم.

- القراءة: 3000/دقيقة لكل IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل IP، و6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الرؤوس:

- توافق قديم: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- موحد: `RateLimit-Limit`، `RateLimit-Reset`
- عند `429`: `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية بدقة عند وجودها.
  تحذف الطلبات الناجحة المقسمة هذا الرأس بدلا من إرجاع قيمة عالمية تقريبية.
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

- إذا كان `Retry-After` موجودا، فانتظر ذلك العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعا عشوائيا لتجنب إعادة المحاولات المتزامنة.
- إذا كان `Retry-After` مفقودا، فارجع إلى `RateLimit-Reset` (أو احسب من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم رؤوس IP الخاصة بالعميل الموثوق، بما في ذلك `cf-connecting-ip`، فقط عندما
  يفعّل النشر صراحة الرؤوس الموثوقة المعاد توجيهها.
- يستخدم ClawHub رؤوس التوجيه الموثوقة لتحديد عناوين IP الخاصة بالعملاء عند الحافة.
- إذا لم يتوفر IP عميل موثوق، تستخدم الطلبات المجهولة حاويات احتياطية
  محددة فقط بنوع حد المعدل. لا تتضمن هذه الحاويات الاحتياطية
  المسارات أو slugs أو أسماء الحزم أو الإصدارات أو سلاسل الاستعلام أو غيرها من
  معلمات العناصر التي يوفرها المستدعي.

## استجابات الأخطاء

استجابات أخطاء v1 العامة هي نص عادي مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك إخفاقات التحقق (`400`)، والموارد العامة المفقودة (`404`)، وإخفاقات المصادقة و
الأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. يجب على العملاء
قراءة جسم الاستجابة كسلسلة نصية قابلة للقراءة البشرية. يتم تجاهل معلمات الاستعلام غير المعروفة
للتوافق، لكن معلمات الاستعلام المعروفة ذات القيم غير الصالحة ترجع
`400`.

## نقاط النهاية العامة (بلا مصادقة)

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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

ملاحظات:

- ترجع النتائج بترتيب الصلة (تشابه التضمين + تعزيزات مطابقة رموز slug/الاسم الدقيقة + أسبقية شعبية صغيرة).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتقدم على مطابقة أوسع ذات تفاعل أعلى بكثير.
- يتم تقسيم نص ASCII إلى رموز عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز مستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يمنح البحث عن `map` تطابقا معجميا أقوى لـ `personal-map` مقارنة بـ `amap-jsapi-skill`.
- تقاس الشعبية بمقياس لوغاريتمي وبحد أقصى. يمكن أن تأتي Skills ذات التفاعل العالي في مرتبة أدنى عندما يكون نص الاستعلام أضعف مطابقة.
- يمكن أن تزيل حالة الإشراف المشبوهة أو المخفية Skill من البحث العام بناء على مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشرين:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلا فقط عندما يكون أيضا هوية مستقرة تريد الاحتفاظ بها.
- لا تعد تسمية slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسما أساسيا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأساسي، وslug المعروض، وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على الحل لعناوين URL القديمة وعمليات التثبيت التي تحل عبر السجل، لكن ترتيب البحث يعتمد على بيانات Skill الوصفية الأساسية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية بشكل غير متوقع، فتحقق أولا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المتعلقة بالترتيب.

### `GET /api/v1/skills`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي فرز غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `recommended` (اسم مستعار: `default`)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، أسماء التثبيت القديمة المستعارة `installsCurrent`/`installs`/`installsAllTime` تتحول إلى `downloads`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

قيم `sort` غير الصالحة ترجع `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتب `trending` حسب عمليات التثبيت في آخر 7 أيام (استنادا إلى القياسات).
- `createdAt` مستقر لزحف Skills الجديدة؛ يتغير `updated` عند إعادة نشر Skills موجودة.
- عندما تكون `nonSuspiciousOnly=true`، قد ترجع عمليات الفرز المستندة إلى المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تصفى بعد استرجاع الصفحة.
- استخدم `nextCursor` لمتابعة ترقيم الصفحات عند وجوده. الصفحة القصيرة لا تعني بحد ذاتها نهاية النتائج.

الاستجابة:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- يتم حل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill الأساسية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاص بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تعلن.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى Skill بيانات وصفية للمنصة.
- يتم تضمين `moderation` فقط عندما تكون Skill معلّمة أو عندما يعرضها المالك.

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

- يمكن للمالكين والمشرفين الوصول إلى تفاصيل الإشراف لـ Skills المخفية.
- يحصل المستدعون العامون فقط على `200` لـ Skills المرئية المعلّمة مسبقا.
- يتم تنقيح الأدلة للمستدعين العامين ولا تتضمن المقاطع الخام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن Skill لمراجعة المشرفين. التقارير على مستوى Skill، ويمكن ربطها
اختياريا بإصدار، وتغذي طابور تقارير Skill.

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

نقطة نهاية للمشرف/المسؤول لاستقبال تقارير Skill.

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

نقطة نهاية للمشرف/المسؤول لحل تقارير Skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع تقرير
تم فرزه لإخفاء Skill في نفس سير العمل القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يرجع البيانات الوصفية للإصدار + قائمة الملفات.

- يتضمن `version.security` حالة التحقق من الفحص المعيارية وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يرجع تفاصيل التحقق من الفحص الأمني لإصدار Skill.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يُقدَّم `version` ولا `tag`، فيُستخدم أحدث إصدار.
- يتضمن حالة تحقق مُطبَّعة بالإضافة إلى تفاصيل خاصة بالماسح.
- تكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حكمًا نهائيًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى المهارة مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` باعتبارهما من سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة نهاية إرسال مصادق عليها لمهام ClawScan الجديدة.

لم تعد فحوصات الرفع المحلي مدعومة. الطلبات التي تستخدم
`multipart/form-data` أو `{ "source": { "kind": "upload" } }` تُرجع `410`.

تستخدم فحوصات المنشورات JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

ملاحظات:

- تنتهي صلاحية حمولات طلبات الفحص والتقارير القابلة للتنزيل من مخزن طلبات الفحص بعد نافذة الاحتفاظ.
- تتطلب فحوصات المنشورات صلاحية إدارة المالك/الناشر، أو صلاحية مشرف/مسؤول المنصة.
- لا تكتب فحوصات المنشورات النتائج مرة أخرى إلا عندما تكون `update: true` ويكتمل الفحص بنجاح.
- تكون الاستجابة `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تُمنح طلبات الفحص اليدوية أولوية قبل أعمال النشر/الملء الخلفي العادية، لكن الاكتمال ما زال يعتمد على توفر العامل.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة نهاية استطلاع مصادق عليها لفحص مُرسَل.

- تُرجع حالة الانتظار/التشغيل/النجاح/الفشل.
- تُرجع `queue.queuedAhead` و`queue.position` أثناء الانتظار كي يتمكن العملاء من عرض عدد الفحوصات اليدوية ذات الأولوية التي تسبق الطلب. تُحدَّد الطوابير الكبيرة جدًا ويُبلَّغ عنها باستخدام `queuedAheadIsEstimate: true`.
- عند توفره، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- تُرجع مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة نهاية مصادق عليها لأرشيف التقرير.

- تتطلب فحصًا ناجحًا؛ الفحوصات غير النهائية تُرجع `409`.
- تُرجع ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة نهاية مصادق عليها لأرشيف التقرير المخزن للإصدارات المُرسَلة.

- تتطلب صلاحية إدارة المالك/الناشر للمهارة أو Plugin، أو صلاحية مشرف/مسؤول المنصة.
- تُرجع نتائج الفحص المخزنة للإصدار المُرسَل بعينه، بما في ذلك الإصدارات المحظورة أو المخفية.
- القيمة الافتراضية لـ `kind` هي `skill`؛ استخدم `kind=plugin` لفحوصات Plugin/الحزمة.
- تُرجع شكل ZIP نفسه الخاص بتنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة فحص دفعي قياسي للمسؤولين فقط. يقبل شكل الحمولة نفسه مثل المسار القديم `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

مسار حالة دفعي قياسي للمسؤولين فقط. يقبل `{ "jobIds": ["..."] }` ويُرجع عدادات التجميع نفسها مثل المسار القديم `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

يُرجع غلاف تحقق بطاقة المهارة الذي يستخدمه `clawhub skill verify`.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (مثلًا `latest`).

ملاحظات:

- تكون `ok` بقيمة `true` فقط عندما يكون للإصدار المحدد بطاقة مهارة مُولَّدة، ولا يكون محظورًا كبرمجية خبيثة بواسطة الإشراف، ويكون تحقق ClawScan نظيفًا.
- تكون هوية المهارة، وهوية الناشر، وبيانات الإصدار المحدد حقولًا علوية في الغلاف (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) كي تتمكن أتمتة الصدفة من قراءتها دون فك أغلفة متداخلة.
- `security` هو حكم ClawScan/الأمان العلوي. ينبغي للأتمتة الاعتماد على `ok` و`decision` و`reasons` و`security.status`.
- يحتوي `security.signals` على أدلة داعمة من الماسحات مثل `staticScan` و`virusTotal` و`skillSpector`.
- يُحتفظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن ماسح وجود سجل التبعيات متقاعد، وهذا المفتاح دائمًا `null`.
- تكون `provenance` بقيمة `server-resolved-github-import` فقط عندما يحل ClawHub مستودع GitHub/مرجعًا/التزامًا/مسارًا ويخزنه أثناء النشر أو الاستيراد؛ وإلا تكون `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يُرجع أحكام الأمان الموجزة الحالية لإصدارات المهارات الدقيقة. نقطة نهاية
هذه المجموعة مخصصة للعملاء الذين يعرفون مسبقًا أي إصدارات مهارات ClawHub
المثبتة يحتاجون إلى عرضها، مثل OpenClaw Control UI.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن يحتوي `items` على 1-100 زوج فريد من `{ slug, version }`.
- النتائج لكل عنصر؛ لا يؤدي فقدان مهارة أو إصدار واحد إلى فشل الاستجابة كلها.
- الاستجابة خاصة بالأمان فقط. لا تتضمن بيانات بطاقة المهارة، أو حالة البطاقة المُولَّدة، أو قوائم ملفات الأثر، أو حمولات الماسح التفصيلية.
- يحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق أمان ClawHub للتفاصيل الكاملة للماسحات.
- يُحتفظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن ماسح وجود سجل التبعيات متقاعد، وهذا المفتاح دائمًا `null`.
- لا يؤثر غياب بطاقة المهارة في `ok` أو `decision` أو `reasons` لهذه النقطة النهائية؛ ينبغي للعملاء قراءة `skill-card.md` المثبت محليًا عندما يحتاجون إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى غلاف تحقق بطاقة مهارة واحدة، و`/card` عندما تحتاج إلى Markdown البطاقة المُولَّدة، و`/scan` عندما تحتاج إلى بيانات ماسح تفصيلية.

الاستجابة:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

يعيد محتوى نصيًا خامًا.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية فهرس موحدة لـ:

- المهارات
- Plugins الكود
- Plugins الحِزم

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `updated` (افتراضي)، `recommended`، `trending`، `downloads`، الاسم المستعار القديم `installs`
- `category` (اختياري): مرشح فئة Plugin. مدعوم فقط عندما يكون
  الطلب محدد النطاق إلى حزم Plugin (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، أو نقاط نهاية الحزم مع
  `family=code-plugin`/`family=bundle-plugin`). الفئات المضبوطة
  والأسماء المستعارة القديمة لمرشحات v1 موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` أو `sort` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- يظل `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين مستعارين ثابتَي العائلة.
- تبقى إدخالات المهارات مدعومة بسجل المهارات ولا يزال نشرها ممكنًا فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصًا فقط لإصدارات code-plugin وbundle-plugin.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يستطيع المستدعون المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القوائم/البحث.
- يعيد `channel=private` الحزم التي يستطيع المستدعي المصادق عليه قراءتها فقط.

### `GET /api/v1/packages/search`

بحث موحد في الفهرس عبر المهارات + حزم Plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. مدعوم فقط عندما يكون
  الطلب محدد النطاق إلى حزم Plugin. الفئات المضبوطة والأسماء المستعارة
  القديمة لمرشحات v1 موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يستطيع المستدعون المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- يعيد `channel=private` الحزم التي يستطيع المستدعي المصادق عليه قراءتها فقط.

### `GET /api/v1/plugins`

تصفح فهرس خاص بـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (افتراضي)، `trending`، `downloads`، `updated`، الاسم المستعار القديم `installs`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

تظل الأسماء المستعارة القديمة لمرشحات v1 مقبولة في نقاط نهاية القراءة:

- يتم حل `mcp-tooling` و`data` و`automation` إلى `tools`.
- يتم حل `observability` و`deployment` إلى `gateway`.
- يتم حل `dev-tools` إلى `runtime`.

`trending` هو ترتيب تثبيتات/تنزيلات لسبعة أيام ولا يستخدم الإجماليات لكل الأوقات.
في نقطة النهاية الموحدة `/api/v1/packages` يكون خاصًا بـ Plugin فقط؛ استخدم
`/api/v1/skills?sort=trending` لفهرس المهارات.

لا تُقبل الأسماء المستعارة القديمة كقيم فئات مخزنة أو معلنة من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث Skills العامة للتحليل دون اتصال.

المصادقة:

- رمز API مطلوب.

معلمات الاستعلام:

- `startDate` (مطلوب): حد أدنى بوحدة ميلي ثانية Unix لـ `updatedAt` الخاصة بالمهارة.
- `endDate` (مطلوب): حد أعلى بوحدة ميلي ثانية Unix لـ `updatedAt` الخاصة بالمهارة.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- الجسم: أرشيف ZIP.
- تكون جذر كل مهارة مصدّرة عند `{publisher}/{slug}/`.
- تتضمن Skills المستضافة ملفات أحدث إصدار مخزن وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن Skills الحالية المدعومة من GitHub التي لها فحص `clean` أو `suspicious`
  `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، وعنوان URL للأرشيف. ولا تتضمن ملفات مصدر مستضافة على ClawHub.
- تتضمن كل مهارة `_export_skill_meta.json`.
- يتم دائمًا تضمين `_manifest.json` في جذر ZIP.
- يتم تضمين `_errors.json` عندما يتعذر تصدير مهارات أو ملفات فردية.

الرؤوس:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

تصدير جماعي لأحدث إصدارات Plugin العامة من أجل التحليل دون اتصال.

المصادقة:

- رمز API مطلوب.

معلمات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بميلي ثواني Unix لقيمة `updatedAt` الخاصة بـ Plugin.
- `endDate` (مطلوب): الحد الأعلى بميلي ثواني Unix لقيمة `updatedAt` الخاصة بـ Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني حذفه كلتا
  عائلتي Plugin.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل Plugin مُصدَّر عند `{family}/{packageName}/`.
- يتضمن كل Plugin مُصدَّر الملفات المخزنة لأحدث إصدار.
- تُخزَّن بيانات التعريف الخاصة بتصدير كل Plugin في
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- يتم تضمين `_manifest.json` دائمًا في جذر ملف ZIP.
- يتم تضمين `_errors.json` عندما يتعذر تصدير Plugins أو ملفات فردية.

الرؤوس:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

بحث خاص بـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1-100)
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): عامل تصفية فئة Plugin. القيم الحالية:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

ملاحظات:

- يتم أيضًا قبول الأسماء المستعارة القديمة لعوامل تصفية v1 الموثقة تحت `GET /api/v1/plugins`.
- تصفية الفئات هي عامل تصفية API حقيقي مدعوم بصفوف ملخص فئات Plugin،
  وليست إعادة كتابة لاستعلام البحث.
- تُعاد النتائج بترتيب الصلة ولا تدعم حاليًا التقسيم إلى صفحات.
- تعيد عناصر تحكم الفرز في واجهة المتصفح لبحث Plugin ترتيب نتائج الصلة المحمَّلة،
  بما يطابق سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن لـ Skills أيضًا أن تُحل عبر هذا المسار في الكتالوج الموحَّد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وجميع إصداراتها حذفًا مبدئيًا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدارًا واحدًا من الحزمة، بما في ذلك بيانات تعريف الملفات، والتوافق،
والتحقق، وبيانات تعريف الأثر، وبيانات الفحص.

ملاحظات:

- تكون `version.artifact.kind` هي `legacy-zip` لأرشيفات الحزم من العالم القديم أو
  `npm-pack` للإصدارات المدعومة بـ ClawPack.
- تتضمن إصدارات ClawPack الحقول المتوافقة مع npm وهي `npmIntegrity` و`npmShasum` و
  `npmTarballName`.
- `version.sha256hash` هي بيانات تعريف توافق مهملة للعملاء القدامى. وهي
  تجزئ بايتات ZIP الدقيقة التي يعيدها `/api/v1/packages/{name}/download`.
  يجب على العملاء الحديثين استخدام `version.artifact.sha256`، الذي يحدد
  أثر الإصدار القانوني.
- يتم تضمين `version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan`
  عندما توجد بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/security`

يعيد ملخص الأمان والثقة الدقيق لإصدار الحزمة من أجل عملاء التثبيت. هذه هي
واجهة الاستهلاك العامة في OpenClaw لتحديد ما إذا كان يمكن تثبيت إصدار
تم حله.

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

- تحدد `package.name` و`package.displayName` و`package.family` حزمة السجل
  التي تم حلها.
- تحدد `release.releaseId` و`release.version` و`release.createdAt` الإصدار
  الدقيق الذي تم تقييمه.
- تكون `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity`
  و`release.npmShasum` و`release.npmTarballName` موجودة عند معرفتها لأثر
  الإصدار.
- `trust.scanStatus` هي حالة الثقة الفعلية المشتقة من مدخلات الماسح
  ومراجعة الإصدار اليدوية.
- `trust.moderationState` قابلة للإبطال. تكون `null` عندما لا توجد مراجعة
  يدوية للإصدار.
- `trust.blockedFromDownload` هي إشارة منع التثبيت. يجب على OpenClaw وعملاء
  التثبيت الآخرين منع التثبيت عندما تكون هذه القيمة `true` بدلًا من
  إعادة اشتقاق قواعد المنع من حقول الماسح أو المراجعة.
- `trust.reasons` هي قائمة الشرح الموجهة للمستخدم والتدقيق. رموز الأسباب
  سلاسل مستقرة ومضغوطة مثل `manual:quarantined` و`scan:malicious`
  و`package:malicious`.
- تعني `trust.pending` أن واحدًا أو أكثر من مدخلات الثقة لا يزال ينتظر الاكتمال.
- تعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة ويجب التعامل معه
  على أنه يتطلب تحديثًا قبل اتخاذ قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة على مستوى الإصدار. يجب على العملاء استدعاؤها بعد حل
  إصدار الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف
  للحزمة.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدًا من نقاط نهاية مراجعة المالك/المشرف. فهي تكشف
  قرار التثبيت والشرح العام، وليس هويات المبلّغين، أو نصوص البلاغات، أو
  الأدلة الخاصة، أو الجداول الزمنية الداخلية للمراجعة.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل الأثر الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثر `legacy-zip` و`downloadUrl` قديمًا لملف ZIP.
- تعيد إصدارات ClawPack أثر `npm-pack`، وحقول تكامل npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذه هي واجهة محلل OpenClaw؛ وهي تتجنب تخمين تنسيق الأرشيف من
  عنوان URL مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزّل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة من npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تغطي فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر ClawPack npm-pack
- ملخص الأثر
- مصدر المستودع وإثبات أصل الالتزام
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

نقطة نهاية للمشرف لسرد صفوف ترحيل Plugin الرسمية في OpenClaw.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, أو
  `all` (الافتراضي).
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات

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

نقطة نهاية للمسؤول لإنشاء صف ترحيل Plugin رسمي أو تحديثه.

المصادقة:

- يتطلب رمز API لمستخدم مسؤول.

جسم الطلب:

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
- يتم تطبيع `packageName` كاسم npm؛ يمكن أن تكون الحزمة مفقودة في
  الترحيـلات المخططة.
- يتتبع هذا جاهزية الترحيل فقط. لا يعدّل OpenClaw ولا ينشئ
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرف/المسؤول لطوابير مراجعة إصدارات الحزم.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات

معاني الحالة:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مُبلَّغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
- `manual`: أي إصدار له تجاوز مراجعة يدوي.
- `all`: أي إصدار له تجاوز يدوي، أو حالة فحص غير نظيفة، أو بلاغ عن الحزمة.

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
اختياريًا بإصدار. وهي تغذي طابور المراجعة لكنها لا تخفي التنزيلات أو
تحظرها تلقائيًا بحد ذاتها؛ يجب على المشرفين استخدام مراجعة الإصدارات
للموافقة على الآثار أو عزلها أو إلغائها.

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

نقطة نهاية للمشرف/المدير لاستقبال تقارير الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مدير.

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

نقطة نهاية للمالك/المشرف لعرض حالة الإشراف على الحزمة.

المصادقة:

- تتطلب رمز API لمالك الحزمة، أو عضو الناشر، أو المشرف، أو
  مستخدم مدير.

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

نقطة نهاية للمشرف/المدير لحل تقارير الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` مطلوبة للحالتين `confirmed` و`dismissed`؛ ويمكن حذفها عند
إرجاع `status` إلى `open`. مرر `finalAction: "quarantine"` أو
`finalAction: "revoke"` مع تقرير مؤكد لتطبيق الإشراف على الإصدار ضمن
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

- `approved`: تمت مراجعته يدويا والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقا سابقا.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل الأثر.
يكتب كل تغيير إدخالا في سجل التدقيق.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصيا خاما لملف حزمة.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيا.
- يستخدم حاوية معدل القراءة، وليس حاوية التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200KB.
- لا تمنع فحوصات VirusTotal المعلقة عمليات القراءة؛ قد تظل الإصدارات الخبيثة محجوبة في مواضع أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادرا على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيا.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip بجذر `package/` حتى تظل عملاء OpenClaw
  القديمة تعمل.
- يبقى هذا المسار مخصصا لـ ZIP فقط. لا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag`، و`Digest`، و`X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` لفحوصات تكامل المحلل.
- لا تُحقن بيانات التعريف الخاصة بالسجل فقط في الأرشيف المنزل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقا مع npm لإصدارات الحزم المدعومة بـ ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي رُفعت لها أرشيفات ClawPack npm-pack.
- تُحذف عمدا الإصدارات القديمة المخصصة لـ ZIP فقط.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولا متوافقة مع npm
  حتى يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلا من مسار الطلب `/api/npm/@scope/name` والمسار
  المشفر الخاص بـ npm وهو `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات أرشيف ClawPack المرفوع بالضبط لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 من ClawHub بالإضافة إلى بيانات تعريف integrity/shasum الخاصة بـ npm.
- تظل فحوصات الإشراف والوصول إلى الحزم الخاصة سارية.

### `GET /api/v1/resolve`

تستخدمه CLI لمطابقة بصمة محلية مع إصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي بطول 64 حرفا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزل ملف ZIP لإصدار Skill مستضاف، أو يعيد تسليما إلى مصدر GitHub
لـ Skill حالية مدعومة من GitHub ذات فحص `clean` أو `suspicious` ودون
إصدار مستضاف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثلا `latest`)

ملاحظات:

- إذا لم يقدَّم `version` ولا `tag`، فسيُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفا مرنا `410`.
- لا تقوم عمليات تسليم Skills المدعومة من GitHub بتمرير البايتات عبر وكيل أو عكسها. تتضمن استجابة JSON
  `sourceRef: "public-github"`، و`repo`، و`commit`، و`path`، و`contentHash`،
  و`archiveUrl`؛ حالة الفحص/الحالة الحالية هي بوابة ولا تُضمَّن كبيانات تعريف لحمولة نجاح.
- تُحتسب إحصاءات التنزيل كهويات فريدة لكل يوم UTC (`userId` عندما يكون رمز API صالحا، وإلا فعنوان IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب جميع نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصدارا جديدا.

- المفضل: `multipart/form-data` مع JSON في `payload` + كتل `files[]`.
- يُقبل أيضا جسم JSON مع `files` (المستندة إلى storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، يحل API ذلك
  الناشر من جهة الخادم ويتطلب أن يكون لدى الفاعل وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عند `true` مع `ownerHandle`، قد
  تنتقل Skill موجودة إلى ذلك المالك إذا كان الفاعل مديرا/مالكا لدى كل من
  الناشرين الحالي والمستهدف. من دون هذا الاشتراك الصريح، تُرفض تغييرات المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة Bearer token.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموح بها هي `payload`، أو كتل `files` مكررة، أو مرجع أرشيف `clawpack`
  واحد. قد يكون `clawpack` كتلة `.tgz` أو معرف تخزين أعاده
  تدفق upload-url. يجب أن تتضمن عمليات النشر عبر معرفات التخزين المرحلية أيضا
  `clawpackUploadTicket` المعاد مع عنوان URL لذلك الرفع.
- استخدم إما `files` أو `clawpack`، ولا تستخدمهما معا في الطلب نفسه.
- تُرفض أجسام JSON وبيانات تعريف `payload.files` / `payload.artifact`
  المقدمة من المستدعي.
- تُحدد طلبات النشر المباشرة متعددة الأجزاء بسقف 18MB. يمكن لأرشيفات ClawPack
  استخدام تدفق upload-url حتى سقف أرشيف 120MB.
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، لا يمكن إلا للمديرين النشر نيابة عن ذلك المالك.

أبرز نقاط التحقق:

- يجب أن تكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي عمليات رفع ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب Plugins البرمجية `package.json`، وبيانات تعريف مستودع المصدر، وبيانات تعريف التزام المصدر،
  وبيانات تعريف مخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- تعد `openclaw.hostTargets` و`openclaw.environment` بيانات تعريف اختيارية.
- لا يجوز النشر إلى قناة `official` إلا لناشر مؤسسة `openclaw` وأعضاء مؤسسة `openclaw` الحاليين
  عبر ناشريهم الشخصيين.
- تظل عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك المستهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف مرن / استعادة Skill (المالك أو المشرف أو المدير).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجوده، يُخزَّن `reason` كملاحظة إشراف على Skill ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف المرن التي يبدأها المالك slug لمدة 30 يوما، ثم يمكن
لناشر آخر المطالبة بذلك slug. تتضمن استجابة الحذف `slugReservedUntil` عند انطباق هذا الانتهاء.
لا تنتهي عمليات الإخفاء بواسطة المشرف/المدير وعمليات الإزالة الأمنية بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: موافق
- `401`: غير مصرح
- `403`: ممنوع
- `404`: لم يتم العثور على Skill/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمديرين فقط. يضمن وجود ناشر مؤسسة لمعرّف. إذا كان المعرّف لا يزال يشير إلى
مستخدم مشترك قديم/ناشر شخصي، فإن نقطة النهاية ترحله إلى ناشر مؤسسة أولا.
بالنسبة إلى مؤسسة منشأة حديثا، قدّم `memberHandle`؛ لا يُضاف المدير المنفذ كعضو.
القيمة الافتراضية لـ `memberRole` هي `owner`.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ناشر مؤسسة بالخدمة الذاتية لمستخدم مصادق عليه. ينشئ ناشر مؤسسة جديدا ويضيف
المستدعي كمالك. لا ترحل نقطة النهاية هذه معرّفات المستخدمين/الشخصية الموجودة ولا
تضع علامة موثوق/رسمي على الناشر.

- الجسم: `{ "handle": "opik", "displayName": "Opik" }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- تعيد `409` عندما يكون المعرّف مستخدما بالفعل من قبل ناشر أو مستخدم أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمديرين فقط. يحجز slugs الجذرية وأسماء الحزم للمالك الشرعي دون نشر
إصدار. تصبح أسماء الحزم حزما خاصة مؤقتة بلا صفوف إصدار، بحيث يمكن للمالك نفسه
لاحقا نشر إصدار code-plugin أو bundle-plugin الحقيقي بذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمديرين فقط. يستعيد ناشرا شخصيا لمعرّف GitHub OAuth بديل ومتحقق
دون تحرير صفوف حساب Convex Auth. يجب أن يذكر الطلب كلا معرّفي حساب مزود GitHub
غير القابلين للتغيير؛ وتُستخدم المعرّفات القابلة للتغيير فقط كحارس موجه للمشغل.

تكون نقطة النهاية افتراضيًا في وضع التشغيل التجريبي. يتطلب تطبيق الاسترداد `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق فريق العمل بشكل مستقل من الاستمرارية بين
كياني GitHub الرئيسيين. يفشل الاسترداد بشكل مغلق عندما يكون لدى الناشر الشخصي الحالي للمستخدم الوجهة
Skills أو حزم أو مصادر Skills على GitHub.
ينقل الاسترداد أيضًا حقول `ownerUserId` القديمة الخاصة بـ Skills للناشر المسترد،
وأسماء alias لمعرّفات Skills اللطيفة، والحزم، وتحذيرات فاحص الحزم، وصفوف ملخص البحث المشتقة بحيث
تتوافق مسارات المالك المباشر مع سلطة الناشر الجديدة. كما يُعاد تعيين حجز معرف محمي نشط
للمعرف المسترد إلى المستخدم البديل بحيث لا يمكن لمزامنة الملف الشخصي اللاحقة
استعادة السلطة المنافسة للمستخدم السابق. يقتصر كل جدول أساسي على
100 صف لكل معاملة تطبيق؛ يجب أن تستخدم عمليات الاسترداد الأكبر أولًا ترحيل مالك قابلًا للاستئناف.
مصادر Skills على GitHub محددة النطاق حسب الناشر ويتم الإبلاغ عنها على أنها فُحصت بدلًا من إعادة كتابتها.

- النص: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- الاستجابة: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط نهاية إدارة المعرّف اللطيف للمالك

- `POST /api/v1/skills/{slug}/rename`
  - النص: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - النص: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة برمز API ولا تعملان إلا لمالك Skill.
- يحافظ `rename` على المعرّف اللطيف السابق كاسم alias لإعادة التوجيه.
- يخفي `merge` قائمة المصدر ويعيد توجيه معرّف المصدر اللطيف إلى قائمة الهدف.

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

حظر مستخدم وحذف Skills المملوكة حذفًا نهائيًا (للمشرف/المسؤول فقط).

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

إلغاء حظر مستخدم واستعادة Skills المؤهلة (للمسؤول فقط).

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

### `POST /api/v1/users/reclassify-ban`

تغيير السبب المخزن لحظر قائم دون إلغاء الحظر أو استعادة
المحتوى (للمسؤول فقط). يكون افتراضيًا تشغيلًا تجريبيًا ما لم تكن `dryRun` هي `false`.

النص:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

أو

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

الاستجابة:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

تغيير دور مستخدم (للمسؤول فقط).

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

سرد المستخدمين أو البحث عنهم (للمسؤول فقط).

معاملات الاستعلام:

- `q` (اختياري): استعلام البحث
- `query` (اختياري): اسم alias لـ `q`
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

إضافة/إزالة نجمة (إبرازات). كلتا نقطتي النهاية متكررتا التطبيق بأمان.

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
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

راجع `DEPRECATIONS.md` للاطلاع على خطة الإزالة.

يعيد `POST /api/cli/upload-url` القيمتين `uploadUrl` و`uploadTicket`. يجب أن ترسل عمليات نشر الحزم
التي تجهز أرشيف ClawPack بصيغة tarball معرّف التخزين الناتج باسم
`clawpack` والتذكرة المعادة باسم `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيًا، فقدم هذا الملف (أو اضبط `CLAWHUB_REGISTRY` صراحةً؛ `CLAWDHUB_REGISTRY` القديم).
