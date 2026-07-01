---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع HTTP API (النقاط النهائية العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-07-01T08:04:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة برمجة تطبيقات HTTP

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

كل مسارات v1 تقع ضمن `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الكتالوج العام

يمكن للأدلة التابعة لأطراف ثالثة استخدام نقاط نهاية القراءة العامة لسرد ClawHub Skills أو البحث فيها. يرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وربط المستخدمين مرة أخرى بقائمة ClawHub الأساسية (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد موقع الطرف الثالث. لا تحاول عكس المحتوى المخفي أو الخاص أو المحظور إشرافيًا خارج سطح API العام.

تُحل اختصارات slug على الويب عبر عائلات السجل، لكن يجب على عملاء API استخدام
عناوين URL الأساسية التي ترجعها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُفرض لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى إنفاذ IP.
- يجب ألا ترجع نقاط نهاية الكتابة المصادق عليها مجرد `Unauthorized` عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/المبطلة،
  والحسابات المحذوفة/المحظورة/المعطلة، كل منها على نص قابل للتنفيذ حتى يستطيع
  عملاء CLI إخبار المستخدمين بما منعهم.

- القراءة: 3000/دقيقة لكل IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل IP، و6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الرؤوس:

- التوافق القديم: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- الموحّد: `RateLimit-Limit`، `RateLimit-Reset`
- عند `429`: `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix مطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (التأخير)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند وجودها.
  تحذف الطلبات الناجحة الموزعة هذا الرأس بدلًا من إرجاع قيمة عالمية تقريبية.
- `Retry-After`: الثواني التي يجب انتظارها قبل إعادة المحاولة (التأخير) عند `429`

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

- إذا كان `Retry-After` موجودًا، فانتظر هذا العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعًا مع عشوائية لتجنب إعادة المحاولات المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم رؤوس IP العميل الموثوقة، بما في ذلك `cf-connecting-ip`، فقط عندما
  يفعّل النشر صراحةً الرؤوس المُمرَّرة الموثوقة.
- يستخدم ClawHub رؤوس التمرير الموثوقة لتحديد عناوين IP للعملاء عند الحافة.
- إذا لم يتوفر IP عميل موثوق، تستخدم الطلبات المجهولة حاويات احتياطية
  محددة فقط بنوع حد المعدل. لا تتضمن هذه الحاويات الاحتياطية
  المسارات أو slugs أو أسماء الحزم أو الإصدارات أو سلاسل الاستعلام أو غيرها من
  معلمات القطع الأثرية التي يزودها المستدعي.

## استجابات الخطأ

استجابات خطأ v1 العامة هي نص عادي مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك إخفاقات التحقق (`400`)، والموارد العامة المفقودة (`404`)، وإخفاقات المصادقة
والأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. يجب على العملاء
قراءة نص الاستجابة كسلسلة مفهومة للبشر. تُتجاهل معلمات الاستعلام غير المعروفة
لأغراض التوافق، لكن معلمات الاستعلام المعروفة ذات القيم غير الصالحة ترجع
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

- تُرجع النتائج بترتيب الصلة (تشابه التضمين + تعزيزات مطابقة slug/رمز الاسم الدقيقة + أولوية شعبية صغيرة).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتقدم على مطابقة أوسع ذات تفاعل أقوى بكثير.
- يُقسّم نص ASCII إلى رموز عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز `map` مستقل، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يمنح البحث عن `map` تطابقًا معجميًا أقوى لـ `personal-map` مقارنة بـ `amap-jsapi-skill`.
- تُقاس الشعبية لوغاريتميًا وتُحد بسقف. قد تحصل Skills ذات التفاعل العالي على ترتيب أدنى عندما يكون نص الاستعلام أضعف مطابقة.
- يمكن لحالة الإشراف المشبوهة أو المخفية إزالة مهارة من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشرين:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تغيّر اسم slug فقط لملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا أساسيًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأساسي وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ الأسماء المستعارة لإعادة التسمية على الحل لعناوين URL القديمة والتثبيتات التي تُحل عبر السجل، لكن ترتيب البحث يستند إلى بيانات تعريف المهارة الأساسية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع المهارة.
- إذا كانت مهارة غير مرئية بشكل غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول قبل تغيير بيانات التعريف المتعلقة بالترتيب.

### `GET /api/v1/skills`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي فرز غير `trending`
- `sort` (اختياري): `updated` (الافتراضي)، `recommended` (اسم مستعار: `default`)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، أسماء التثبيت القديمة المستعارة `installsCurrent`/`installs`/`installsAllTime` تُطابق إلى `downloads`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

قيم `sort` غير الصالحة ترجع `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتب `trending` حسب التثبيتات في آخر 7 أيام (مستند إلى القياسات).
- `createdAt` ثابت لزحف Skills الجديدة؛ يتغير `updated` عندما يُعاد نشر Skills الحالية.
- عندما يكون `nonSuspiciousOnly=true`، قد ترجع عمليات الفرز المعتمدة على المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تُرشح بعد استرجاع الصفحة.
- استخدم `nextCursor` لمتابعة ترقيم الصفحات عند وجوده. لا تعني الصفحة القصيرة بحد ذاتها نهاية النتائج.

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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى المهارة الأساسية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter المهارة (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` هي `null` إذا لم تكن لدى المهارة بيانات تعريف للمنصة.
- يُضمَّن `moderation` فقط عندما تكون المهارة مُعلّمة أو عندما يعرضها المالك.

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
- يحصل المستدعون العامون فقط على `200` لـ Skills المرئية المعلّمة مسبقًا.
- تُنقح الأدلة للمستدعين العامين ولا تتضمن المقاطع الخام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن مهارة لمراجعة المشرف. البلاغات على مستوى المهارة، ويمكن ربطها اختياريًا
بإصدار، وتغذي قائمة انتظار بلاغات المهارات.

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

نقطة نهاية للمشرف/المسؤول لاستقبال بلاغات المهارات.

معلمات الاستعلام:

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

نقطة نهاية للمشرف/المسؤول لحل بلاغات المهارات أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع بلاغ
مفروز لإخفاء المهارة في سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يرجع بيانات تعريف الإصدار + قائمة الملفات.

- يتضمن `version.security` حالة التحقق من الفحص المطبعة وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يرجع تفاصيل التحقق من فحص الأمان لإصدار مهارة.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يتم توفير `version` ولا `tag`، فسيُستخدم أحدث إصدار.
- يتضمن حالة تحقق موحّدة بالإضافة إلى تفاصيل خاصة بالماسح.
- تكون `security.hasScanResult` بالقيمة `true` فقط عندما يُصدر ماسح حكمًا نهائيًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى المهارة مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` على أنهما في سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة نهاية إرسال مصادَق عليها لمهام ClawScan الجديدة.

لم تعد فحوصات الرفع المحلي مدعومة. الطلبات التي تستخدم
`multipart/form-data` أو `{ "source": { "kind": "upload" } }` تُرجع `410`.

تستخدم الفحوصات المنشورة JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

ملاحظات:

- تنتهي صلاحية حمولات طلبات الفحص والتقارير القابلة للتنزيل من مخزن طلبات الفحص بعد نافذة الاحتفاظ.
- تتطلب الفحوصات المنشورة وصول إدارة المالك/الناشر، أو صلاحية مشرف/مسؤول المنصة.
- لا تكتب الفحوصات المنشورة النتائج رجوعًا إلا عندما تكون `update: true` ويكتمل الفحص بنجاح.
- تكون الاستجابة `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تُعطى طلبات الفحص اليدوية أولوية قبل أعمال النشر/الملء الخلفي العادية، لكن الاكتمال لا يزال يعتمد على توفر العمال.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة نهاية استطلاع مصادَق عليها لفحص مُرسل.

- تُرجع حالة queued/running/succeeded/failed.
- تُرجع `queue.queuedAhead` و`queue.position` أثناء الانتظار في الصف حتى يتمكن العملاء من إظهار عدد الفحوصات اليدوية ذات الأولوية الموجودة قبل الطلب. تُقيَّد الصفوف الكبيرة جدًا ويُبلغ عنها مع `queuedAheadIsEstimate: true`.
- عند توفره، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- تُرجع مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة نهاية أرشيف تقرير مصادَق عليها.

- تتطلب فحصًا ناجحًا؛ الفحوصات غير النهائية تُرجع `409`.
- تُرجع ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة نهاية أرشيف تقرير مخزّن مصادَق عليها للإصدارات المُرسلة.

- تتطلب وصول إدارة المالك/الناشر إلى المهارة أو Plugin، أو صلاحية مشرف/مسؤول المنصة.
- تُرجع نتائج الفحص المخزنة للإصدار المُرسل بدقة، بما في ذلك الإصدارات المحظورة أو المخفية.
- القيمة الافتراضية لـ `kind` هي `skill`؛ استخدم `kind=plugin` لفحوصات Plugin/الحزمة.
- تُرجع شكل ZIP نفسه مثل تنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة فحص دفعي معياري للمسؤولين فقط. يقبل شكل الحمولة نفسه مثل `POST /api/v1/skills/-/rescan-batch` القديم.

### `POST /api/v1/skills/-/scan/batch/status`

مسار حالة دفعة معياري للمسؤولين فقط. يقبل `{ "jobIds": ["..."] }` ويُرجع عدادات التجميع نفسها مثل `POST /api/v1/skills/-/rescan-batch/status` القديم.

### `GET /api/v1/skills/{slug}/verify`

يُرجع غلاف تحقق بطاقة Skill Card المستخدم بواسطة `clawhub skill verify`.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- تكون `ok` بالقيمة `true` فقط عندما يحتوي الإصدار المحدد على بطاقة Skill Card مولّدة، ولا يكون محظورًا كبرمجية خبيثة بواسطة الإشراف، ويكون تحقق ClawScan نظيفًا.
- هوية المهارة، وهوية الناشر، وبيانات تعريف الإصدار المحدد هي حقول غلاف في المستوى الأعلى (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) حتى تتمكن أتمتة shell من قراءتها من دون فك أغلفة متداخلة.
- `security` هو حكم ClawScan/الأمان في المستوى الأعلى. ينبغي أن تعتمد الأتمتة على `ok` و`decision` و`reasons` و`security.status`.
- يحتوي `security.signals` على أدلة ماسح داعمة مثل `staticScan` و`virusTotal` و`skillSpector`.
- يُحتفظ بـ `security.signals.dependencyRegistry` لتوافق استجابة v1، لكن ماسح وجود سجل الاعتماديات أُوقف، وهذا المفتاح يكون دائمًا `null`.
- تكون `provenance` بالقيمة `server-resolved-github-import` فقط عندما يحل ClawHub ويخزن repo/ref/commit/path من GitHub أثناء النشر أو الاستيراد؛ وإلا فهي `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يُرجع أحكام الأمان الموجزة الحالية لإصدارات مهارات محددة بدقة. نقطة نهاية
المجموعة هذه مخصصة للعملاء الذين يعرفون مسبقًا إصدارات مهارات
ClawHub المثبتة التي يحتاجون إلى عرضها، مثل OpenClaw Control UI.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن يحتوي `items` على 1-100 زوج فريد من `{ slug, version }`.
- النتائج تكون لكل عنصر؛ لا يؤدي فقدان مهارة أو إصدار واحد إلى فشل الاستجابة بالكامل.
- الاستجابة مخصصة للأمان فقط. لا تتضمن بيانات Skill Card، أو حالة البطاقة المولّدة، أو قوائم ملفات artifact، أو حمولات ماسح مفصلة.
- يحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق أمان ClawHub للحصول على تفاصيل الماسح الكاملة.
- يُحتفظ بـ `security.signals.dependencyRegistry` لتوافق استجابة v1، لكن ماسح وجود سجل الاعتماديات أُوقف، وهذا المفتاح يكون دائمًا `null`.
- لا يؤثر غياب Skill Card في `ok` أو `decision` أو `reasons` الخاصة بنقطة النهاية هذه؛ ينبغي أن يقرأ العملاء `skill-card.md` المثبت محليًا عندما يحتاجون إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى غلاف تحقق Skill Card لمهارة واحدة، و`/card` عندما تحتاج إلى Markdown البطاقة المولّدة، و`/scan` عندما تحتاج إلى بيانات ماسح مفصلة.

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

- يكون الافتراضي هو أحدث إصدار.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية كتالوج موحّدة لـ:

- Skills
- Plugins برمجية
- Plugins الحِزم

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `updated` (افتراضي)، `recommended`، `trending`، `downloads`، الاسم المستعار القديم `installs`
- `category` (اختياري): عامل تصفية فئة Plugin. مدعوم فقط عندما يكون
  الطلب محدد النطاق لحزم Plugin (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، أو نقاط نهاية الحزم مع
  `family=code-plugin`/`family=bundle-plugin`). الفئات الخاضعة للتحكم
  والأسماء المستعارة القديمة لعوامل تصفية v1 موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` أو `sort` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- يظل `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين مستعارين ثابتَي العائلة.
- تظل إدخالات Skills مدعومة بسجل Skills، ولا يزال لا يمكن نشرها إلا عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصًا فقط لإصدارات code-plugin وbundle-plugin.
- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحّد في الكتالوج عبر Skills + حزم Plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): عامل تصفية فئة Plugin. مدعوم فقط عندما يكون
  الطلب محدد النطاق لحزم Plugin. الفئات الخاضعة للتحكم والأسماء المستعارة
  القديمة لعوامل تصفية v1 موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/plugins`

استعراض كتالوج مخصص لـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (افتراضي)، `trending`، `downloads`، `updated`، الاسم المستعار القديم `installs`
- `category` (اختياري): عامل تصفية فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

تظل الأسماء المستعارة القديمة لعوامل تصفية v1 مقبولة على نقاط نهاية القراءة:

- يتم حل `mcp-tooling` و`data` و`automation` إلى `tools`.
- يتم حل `observability` و`deployment` إلى `gateway`.
- يتم حل `dev-tools` إلى `runtime`.

`trending` هو ترتيب للتحميلات/التنزيلات خلال سبعة أيام ولا يستخدم الإجماليات الكلية عبر الزمن.
على نقطة النهاية الموحّدة `/api/v1/packages` يكون مخصصًا لـ Plugin فقط؛ استخدم
`/api/v1/skills?sort=trending` لكتالوج Skills.

لا تُقبل الأسماء المستعارة القديمة كقيم فئات مخزنة أو معلنة من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث Skills العامة للتحليل دون اتصال بالإنترنت.

المصادقة:

- رمز API مطلوب.

معلمات الاستعلام:

- `startDate` (مطلوب): حد أدنى بميلي ثانية Unix لـ `updatedAt` الخاص بـ Skill.
- `endDate` (مطلوب): حد أعلى بميلي ثانية Unix لـ `updatedAt` الخاص بـ Skill.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل Skill مصدّرة عند `{publisher}/{slug}/`.
- تتضمن Skills المستضافة أحدث ملفات الإصدار المخزن وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن Skills الحالية المدعومة من GitHub ذات فحص `clean` أو `suspicious`
  ملف `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، وعنوان URL للأرشيف. ولا تتضمن ملفات المصدر المستضافة على ClawHub.
- تتضمن كل Skill ملف `_export_skill_meta.json`.
- يتم تضمين `_manifest.json` دائمًا في جذر ZIP.
- يتم تضمين `_errors.json` عندما يتعذر تصدير Skills أو ملفات فردية.

الرؤوس:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

تصدير جماعي لأحدث إصدارات Plugin العامة للتحليل دون اتصال.

المصادقة:

- يلزم رمز API.

معلمات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بمللي ثانية Unix لقيمة `updatedAt` في Plugin.
- `endDate` (مطلوب): الحد الأعلى بمللي ثانية Unix لقيمة `updatedAt` في Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني الحذف كلتا
  عائلتي Plugin.

الاستجابة:

- النص: أرشيف ZIP.
- يكون جذر كل Plugin مُصدَّر عند `{family}/{packageName}/`.
- يتضمن كل Plugin مُصدَّر الملفات المخزنة لأحدث إصدار.
- تُخزَّن بيانات تعريف التصدير لكل Plugin في
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- يتم تضمين `_manifest.json` دائمًا في جذر ZIP.
- يتم تضمين `_errors.json` عندما يتعذر تصدير Plugins أو ملفات فردية.

الرؤوس:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

بحث خاص بـ Plugin عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1-100)
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): عامل تصفية فئة Plugin. القيم الحالية:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

ملاحظات:

- يتم أيضًا قبول الأسماء البديلة القديمة لعامل تصفية v1 الموثقة ضمن `GET /api/v1/plugins`.
- تصفية الفئات هي عامل تصفية API حقيقي مدعوم بصفوف ملخص فئات Plugin،
  وليست إعادة كتابة لاستعلام البحث.
- تُرجع النتائج بترتيب الصلة ولا تدعم التقسيم إلى صفحات حاليًا.
- تعيد عناصر تحكم الفرز في واجهة المتصفح لبحث Plugin ترتيب نتائج الصلة المحمّلة،
  بما يطابق سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

تُرجع بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن لـ Skills أيضًا الحل عبر هذا المسار في الكتالوج الموحّد.
- تُرجع الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وجميع إصداراتها حذفًا مبدئيًا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

تُرجع سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات

ملاحظات:

- تُرجع الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

تُرجع إصدار حزمة واحدًا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والتحقق، وبيانات تعريف العنصر الاصطناعي، وبيانات الفحص.

ملاحظات:

- `version.artifact.kind` هو `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة من ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- `version.sha256hash` هي بيانات تعريف توافق مهملة للعملاء القدامى. وهي
  تحسب تجزئة بايتات ZIP الدقيقة التي تُرجعها `/api/v1/packages/{name}/download`.
  ينبغي للعملاء الحديثين استخدام `version.artifact.sha256`، الذي يحدد
  عنصر الإصدار الاصطناعي القانوني.
- يتم تضمين `version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan`
  عندما توجد بيانات فحص.
- تُرجع الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/security`

تُرجع ملخص الأمان والثقة الدقيق لإصدار الحزمة لعملاء التثبيت. هذا هو سطح
الاستهلاك العام في OpenClaw لتقرير ما إذا كان يمكن تثبيت إصدار محلول.

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

- تحدد `package.name` و`package.displayName` و`package.family`
  حزمة السجل المحلولة.
- تحدد `release.releaseId` و`release.version` و`release.createdAt`
  الإصدار الدقيق الذي تم تقييمه.
- توجد `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity`
  و`release.npmShasum` و`release.npmTarballName` عندما تكون معروفة
  لعنصر الإصدار الاصطناعي.
- `trust.scanStatus` هي حالة الثقة الفعلية المشتقة من مدخلات الماسح
  والإشراف اليدوي على الإصدار.
- `trust.moderationState` قابلة لأن تكون null. تكون `null` عندما لا يوجد
  إشراف يدوي على الإصدار.
- `trust.blockedFromDownload` هي إشارة حظر التثبيت. ينبغي لـ OpenClaw وعملاء
  التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلًا من
  إعادة اشتقاق قواعد الحظر من حقول الماسح أو الإشراف.
- `trust.reasons` هي قائمة الشرح الموجّهة للمستخدم والتدقيق. رموز الأسباب
  سلاسل ثابتة ومختصرة مثل `manual:quarantined` و`scan:malicious`
  و`package:malicious`.
- تعني `trust.pending` أن واحدًا أو أكثر من مدخلات الثقة لا يزال ينتظر الاكتمال.
- تعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة ويجب التعامل معه
  على أنه يتطلب تحديثًا قبل قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة حسب الإصدار. ينبغي للعملاء استدعاؤها بعد حل إصدار
  الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف للحزمة.
- تُرجع الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدًا من نقاط نهاية إشراف المالك/المشرف. فهي تعرض
  قرار التثبيت والشرح العام، وليس هويات المبلّغين أو نصوص البلاغات أو
  الأدلة الخاصة أو الجداول الزمنية الداخلية للمراجعة.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

تُرجع بيانات تعريف محلل العنصر الاصطناعي الصريحة لإصدار حزمة.

ملاحظات:

- تُرجع إصدارات الحزم القديمة عنصرًا اصطناعيًا `legacy-zip` و`downloadUrl`
  قديمًا لـ ZIP.
- تُرجع إصدارات ClawPack عنصرًا اصطناعيًا `npm-pack`، وحقول سلامة npm،
  و`tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح المحلل في OpenClaw؛ فهو يتجنب تخمين تنسيق الأرشيف من رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزّل عنصر الإصدار الاصطناعي عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة كـ npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

تُرجع الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تشمل فحوص الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر عنصر ClawPack npm-pack الاصطناعي
- ملخص العنصر الاصطناعي
- مصدر المستودع ونَسَب الالتزام
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

- يتطلب رمز API لمشرف أو مستخدم مسؤول.

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

نقطة نهاية المسؤول لإنشاء أو تحديث صف ترحيل Plugin رسمي.

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

- يتم تطبيع `bundledPluginId` إلى أحرف صغيرة وهو مفتاح upsert الثابت.
- يتم تطبيع `packageName` كاسم npm؛ قد تكون الحزمة مفقودة لعمليات الترحيل المخطط لها.
- يتتبع هذا جاهزية الترحيل فقط. ولا يغيّر OpenClaw أو ينشئ ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية المشرف/المسؤول لقوائم انتظار مراجعة إصدارات الحزم.

المصادقة:

- يتطلب رمز API لمشرف أو مستخدم مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، `blocked`، `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات

معاني الحالة:

- `open`: إصدارات مشبوهة أو ضارة أو معلقة أو معزولة أو ملغاة أو مبلغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو ضارة.
- `manual`: أي إصدار له تجاوز إشراف يدوي.
- `all`: أي إصدار له تجاوز يدوي، أو حالة فحص غير نظيفة، أو بلاغ حزمة.

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

الإبلاغ عن حزمة لمراجعة المشرف. البلاغات على مستوى الحزمة، وترتبط اختياريًا
بإصدار. وهي تغذي قائمة انتظار الإشراف لكنها لا تخفي التنزيلات أو تحظرها
تلقائيًا بحد ذاتها؛ ينبغي للمشرفين استخدام إشراف الإصدار للموافقة على
العناصر الاصطناعية أو عزلها أو إلغائها.

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

نقطة نهاية للمشرف/المسؤول لاستقبال تقارير الحزم.

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

نقطة نهاية للمالك/المشرف لإظهار حالة الإشراف على الحزمة.

المصادقة:

- تتطلب رمز API لمالك الحزمة، أو عضو الناشر، أو المشرف، أو
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

نقطة نهاية للمشرف/المسؤول لحل تقارير الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` مطلوب عند استخدام `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة ضبط `status` إلى `open`. مرّر `finalAction: "quarantine"` أو
`finalAction: "revoke"` مع تقرير مؤكد لتطبيق إشراف الإصدار ضمن
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

- `approved`: تمت مراجعته يدوياً والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقاً سابقاً.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل الأثر.
يكتب كل تغيير إدخالاً في سجل التدقيق.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصياً خاماً لملف حزمة.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضياً.
- يستخدم حاوية معدل القراءة، وليس حاوية التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200KB.
- لا تمنع فحوصات VirusTotal المعلقة القراءة؛ وقد تظل الإصدارات الخبيثة محجوبة في مواضع أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادراً على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزّل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضياً.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip ذات جذر `package/` كي يستمر عمل عملاء OpenClaw
  القدامى.
- يبقى هذا المسار مقتصراً على ZIP. لا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة المحلّل.
- لا تُحقن البيانات الوصفية الخاصة بالسجل فقط في الأرشيف المنزّل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقاً مع npm لإصدارات الحزم المدعومة من ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي لديها كرات tarball من نوع ClawPack npm-pack مرفوعة.
- تُحذف عمداً الإصدارات القديمة المقتصرة على ZIP.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولاً متوافقة مع npm
  كي يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلاً من `/api/npm/@scope/name` ومسار طلب npm
  المشفّر `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات كرة tarball المرفوعة من ClawPack كما هي لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 الخاص بـ ClawHub إضافة إلى بيانات metadata الخاصة بـ npm integrity/shasum.
- ما زالت فحوصات الإشراف والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

يستخدمه CLI لربط بصمة محلية بإصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي بطول 64 حرفاً لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزّل ZIP لإصدار skill مستضاف، أو يعيد تسليماً إلى مصدر GitHub من أجل
skill حالي مدعوم من GitHub مع فحص `clean` أو `suspicious` ومن دون إصدار
مستضاف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يُقدّم `version` ولا `tag`، يُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفاً ليناً `410`.
- لا تعمل تسليمات skills المدعومة من GitHub كوسيط أو مرآة للبايتات. تتضمن استجابة JSON
  `sourceRef: "public-github"` و`repo` و`commit` و`path` و`contentHash`
  و`archiveUrl`؛ وتكون حالة الفحص/الحالة الحالية بوابة ولا تُضمّن كبيانات وصفية لحمولة نجاح.
- تُحسب إحصاءات التنزيل كهويات فريدة لكل يوم UTC (`userId` عندما يكون رمز API صالحاً، وإلا عنوان IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصداراً جديداً.

- المفضل: `multipart/form-data` مع JSON في `payload` + كتل `files[]`.
- يُقبل أيضاً جسم JSON يحتوي على `files` (مستندة إلى storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، تحل API ذلك الناشر من جهة الخادم
  وتتطلب أن يكون للفاعل صلاحية وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عند `true` مع `ownerHandle`، يمكن نقل
  skill موجود إلى ذلك المالك إذا كان الفاعل مسؤولاً/مالكاً لدى كل من
  الناشر الحالي والناشر الهدف. ومن دون هذا الاشتراك الصريح، تُرفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموح بها هي `payload`، أو كتل `files` المتكررة، أو مرجع كرة tarball واحد باسم `clawpack`.
  يمكن أن يكون `clawpack` كتلة `.tgz` أو معرّف تخزين أرجعه
  مسار upload-url. يجب أن تتضمن عمليات النشر المرحلية بمعرّف تخزين أيضاً
  `clawpackUploadTicket` الذي أُعيد مع عنوان URL لذلك الرفع.
- استخدم إما `files` أو `clawpack`، ولا تستخدمهما معاً في الطلب نفسه.
- تُرفض أجسام JSON والبيانات الوصفية `payload.files` / `payload.artifact`
  المقدمة من المستدعي.
- تُحدد طلبات النشر المباشرة عبر multipart بسقف 18MB. يمكن لكرات tarball الخاصة بـ ClawPack
  استخدام مسار upload-url حتى سقف كرة tarball البالغ 120MB.
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، لا يُسمح إلا للمسؤولين بالنشر نيابة عن ذلك المالك.

أبرز عناصر التحقق:

- يجب أن يكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. ويجب أن تحتوي رفعات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب code plugins وجود `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية لتعهد المصدر،
  وبيانات وصفية لمخطط الإعداد، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يجوز النشر إلى قناة `official` إلا لناشر مؤسسة `openclaw` وأعضاء مؤسسة `openclaw` الحاليين
  من الناشرين الشخصيين.
- ما زالت عمليات النشر نيابة عن الغير تتحقق من أهلية قناة official مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف لين / استعادة skill (المالك، أو المشرف، أو المسؤول).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزن كملاحظة إشراف على skill ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف اللين التي يبدأها المالك slug لمدة 30 يوماً، ثم يمكن لناشر
آخر المطالبة به. تتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانتهاء.
لا تنتهي إخفاءات المشرف/المسؤول وعمليات الإزالة الأمنية بهذه الطريقة.

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

للمسؤولين فقط. يضمن وجود ناشر مؤسسة لمعرّف. إذا كان المعرّف لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، تنقله نقطة النهاية أولاً إلى ناشر مؤسسة.
بالنسبة إلى مؤسسة منشأة حديثاً، قدّم `memberHandle`؛ لا يُضاف المسؤول الفاعل كعضو.
القيمة الافتراضية لـ `memberRole` هي `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ناشر مؤسسة بالخدمة الذاتية مع مصادقة. ينشئ ناشر مؤسسة جديداً ويضيف
المستدعي كمالك. لا تنقل نقطة النهاية هذه معرّفات المستخدم/الشخصية الموجودة ولا
تضع علامة موثوق/رسمي على الناشر.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- تعيد `409` عندما يكون المعرّف مستخدماً مسبقاً من قِبل ناشر أو مستخدم أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمسؤولين فقط. يحجز slugs الجذرية وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزماً نائبة خاصة من دون صفوف إصدارات، لذلك يمكن للمالك نفسه
نشر إصدار code-plugin أو bundle-plugin الحقيقي لاحقاً بذلك الاسم.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمسؤولين فقط. يستعيد ناشراً شخصياً لهوية GitHub OAuth بديلة تم التحقق منها
من دون تحرير صفوف حساب Convex Auth. يجب أن يسمي الطلب معرّفي حساب GitHub
للمزوّد غير القابلين للتغيير؛ ولا تُستخدم المعرّفات القابلة للتغيير إلا كحاجز موجه للمشغل.

تكون القيمة الافتراضية لنقطة النهاية هي التشغيل التجريبي. يتطلب تطبيق الاسترداد `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق الموظفون بشكل مستقل من الاستمرارية بين كلا
كياني GitHub الرئيسيين. يفشل الاسترداد بإغلاق آمن عندما يكون لدى الناشر الشخصي الحالي للمستخدم الوجهة
Skills أو حزم أو مصادر Skills من GitHub.
ينقل الاسترداد أيضا حقول `ownerUserId` القديمة الخاصة بـ Skills الناشر المسترد،
وأسماء slug المستعارة للـ Skill، والحزم، وتحذيرات فاحص الحزم، وصفوف ملخص البحث المشتقة بحيث
تتفق مسارات المالك المباشر مع سلطة الناشر الجديدة. كما يعاد إسناد حجز المقبض المحمي النشط
للمقبض المسترد إلى المستخدم البديل بحيث لا يمكن لمزامنة الملف الشخصي لاحقا استعادة سلطة المستخدم السابق المنافسة. يحد كل جدول أساسي من
100 صف لكل معاملة تطبيق؛ يجب أن تستخدم عمليات الاسترداد الأكبر أولا ترحيل مالك قابل للاستئناف.
مصادر GitHub للـ Skills مرتبطة بالناشر ويبلغ عنها كخاضعة للفحص بدلا من إعادة كتابتها.

- النص: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- الاستجابة: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط نهاية إدارة slug المالك

- `POST /api/v1/skills/{slug}/rename`
  - النص: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - النص: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة رمز API وتعملان فقط لمالك الـ Skill.
- يحافظ `rename` على الـ slug السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` الإدراج المصدر ويعيد توجيه slug المصدر إلى الإدراج الهدف.

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

حظر مستخدم وحذف Skills المملوكة حذفا نهائيا (للمشرف/المدير فقط).

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

إلغاء حظر مستخدم واستعادة Skills المؤهلة (للمدير فقط).

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
المحتوى (للمدير فقط). تكون القيمة الافتراضية تشغيلا تجريبيا ما لم تكن `dryRun` تساوي `false`.

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

تغيير دور مستخدم (للمدير فقط).

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

عرض قائمة المستخدمين أو البحث عنهم (للمدير فقط).

معلمات الاستعلام:

- `q` (اختياري): استعلام البحث
- `query` (اختياري): اسم مستعار لـ `q`
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

إضافة/إزالة نجمة (تمييزات). كلتا نقطتي النهاية ذاتا أثر تكراري ثابت.

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

يعيد `POST /api/cli/upload-url` القيمتين `uploadUrl` و `uploadTicket`. يجب أن ترسل عمليات
نشر الحزم التي تجهز أرشيف ClawPack بصيغة tarball معرف التخزين الناتج باسم
`clawpack` والتذكرة المعادة باسم `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيا، فقدم هذا الملف (أو اضبط `CLAWHUB_REGISTRY` صراحة؛ `CLAWDHUB_REGISTRY` القديم).
