---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع HTTP API (النقاط النهائية العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-06-28T06:01:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP API

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

جميع مسارات v1 تقع ضمن `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الفهرس العام

يجوز للأدلة التابعة لجهات خارجية استخدام نقاط نهاية القراءة العامة لعرض Skills في ClawHub أو البحث فيها. يُرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وإرجاع المستخدمين برابط إلى قائمة ClawHub الأساسية (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بتأييد ClawHub للموقع التابع لجهة خارجية. لا تحاول نسخ المحتوى المخفي أو الخاص أو المحظور إشرافيًا خارج سطح API العام.

تُحل اختصارات slug الويب عبر عائلات السجل، لكن ينبغي لعملاء API استخدام
عناوين URL الأساسية التي تُرجعها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُفرض لكل عنوان IP.
- الطلبات الموثقة (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى الإنفاذ حسب IP.
- ينبغي ألا تُرجع نقاط نهاية الكتابة الموثقة رسالة `Unauthorized` مجردة عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة، و
  الحسابات المحذوفة/المحظورة/المعطلة، كل منها على نص قابل للتصرف حتى يتمكن عملاء CLI
  من إخبار المستخدمين بما منعهم.

- القراءة: 3000/دقيقة لكل IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل IP، و6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الرؤوس:

- توافق قديم: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- موحدة: `RateLimit-Limit`، `RateLimit-Reset`
- عند `429`: `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني Unix epoch المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند وجودها.
  تحذف الطلبات الناجحة المجزأة هذا الرأس بدلًا من إرجاع قيمة عامة تقريبية.
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

- إذا كان `Retry-After` موجودًا، فانتظر هذا العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعًا عشوائي التفاوت لتجنب عمليات إعادة المحاولة المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم رؤوس IP العميل الموثوقة، بما في ذلك `cf-connecting-ip`، فقط عندما
  يمكّن النشر صراحةً الرؤوس المعاد توجيهها الموثوقة.
- يستخدم ClawHub رؤوس إعادة التوجيه الموثوقة لتحديد عناوين IP للعملاء عند الحافة.
- إذا لم يتوفر IP عميل موثوق، تستخدم الطلبات المجهولة حاويات احتياطية
  محددة فقط حسب نوع حد المعدل. لا تتضمن هذه الحاويات الاحتياطية
  مسارات مقدمة من المستدعي، أو slugs، أو أسماء حزم، أو إصدارات، أو سلاسل استعلام، أو غيرها
  من معاملات الأثر.

## استجابات الأخطاء

استجابات أخطاء v1 العامة هي نص عادي مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك حالات فشل التحقق (`400`)، والموارد العامة المفقودة (`404`)، وفشل المصادقة و
الأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. ينبغي للعملاء
قراءة متن الاستجابة كسلسلة قابلة للقراءة البشرية. تُتجاهل معاملات الاستعلام غير المعروفة
للتوافق، لكن معاملات الاستعلام المعروفة ذات القيم غير الصالحة تُرجع
`400`.

## نقاط النهاية العامة (بدون مصادقة)

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

- تُرجع النتائج بترتيب الصلة (تشابه التضمين + تعزيزات رموز slug/الاسم المطابقة تمامًا + عامل شائع صغير مسبق).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتقدم على مطابقة أوسع ذات تفاعل أقوى بكثير.
- يُجزأ نص ASCII على حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز مستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يمنح البحث عن `map` تطابقًا معجميًا أقوى لـ `personal-map` مقارنةً بـ `amap-jsapi-skill`.
- الشعبية مقاسة لوغاريتميًا ومحددة بسقف. يمكن أن تأتي Skills عالية التفاعل في مرتبة أدنى عندما يكون نص الاستعلام أضعف تطابقًا.
- يمكن لحالة الإشراف المشبوهة أو المخفية أن تزيل Skill من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تُعد تسمية slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا أساسيًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأساسي، وslug المعروض، وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحفظ أسماء إعادة التسمية المستعارة حلّ عناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يستند إلى بيانات Skill الوصفية الأساسية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية بشكل غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المتعلقة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي ترتيب غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `recommended` (اسم مستعار: `default`)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، أسماء تثبيت قديمة مستعارة `installsCurrent`/`installs`/`installsAllTime` تُربط بـ `downloads`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

قيم `sort` غير الصالحة تُرجع `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتب `trending` حسب عمليات التثبيت في آخر 7 أيام (بناءً على القياسات).
- `createdAt` مستقر لزحوف Skills الجديدة؛ يتغير `updated` عند إعادة نشر Skills الحالية.
- عندما تكون `nonSuspiciousOnly=true`، قد تُرجع الترتيبات القائمة على المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تُصفّى بعد استرجاع الصفحة.
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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill الأساسية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاص بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى Skill بيانات وصفية للمنصة.
- يُضمن `moderation` فقط عندما تكون Skill موسومة أو عندما يعرضها المالك.

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

- يستطيع المالكون والمشرفون الوصول إلى تفاصيل الإشراف على Skills المخفية.
- يحصل المستدعون العامون على `200` فقط لـ Skills المرئية الموسومة مسبقًا.
- تُحجب الأدلة للمستدعين العامين ولا تتضمن المقتطفات الخام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن Skill لمراجعة المشرف. البلاغات على مستوى Skill، وترتبط اختياريًا
بإصدار، وتغذي قائمة انتظار بلاغات Skill.

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

نقطة نهاية للمشرف/المسؤول لاستقبال بلاغات Skill.

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

نقطة نهاية للمشرف/المسؤول لحل بلاغات Skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع بلاغ مفروز
لإخفاء Skill ضمن سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد بيانات الإصدار الوصفية + قائمة الملفات.

- يتضمن `version.security` حالة تحقق الفحص المنسقة وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل تحقق الفحص الأمني لإصدار Skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يُقدَّم أي من `version` أو `tag`، فسيُستخدم أحدث إصدار.
- يتضمن حالة تحقق مُطبَّعة إضافةً إلى تفاصيل خاصة بالماسح.
- تكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حكمًا قاطعًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى Skills مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` على أنهما ضمن سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة إرسال مصادَق عليها لمهام ClawScan الجديدة.

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
- تتطلب الفحوصات المنشورة صلاحية إدارة المالك/الناشر، أو صلاحية مشرف/مسؤول المنصة.
- لا تكتب الفحوصات المنشورة النتائج مرة أخرى إلا عندما تكون `update: true` ويكتمل الفحص بنجاح.
- الاستجابة هي `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تُعطى طلبات الفحص اليدوية أولوية قبل عمل النشر/إعادة الملء العادي، لكن اكتمالها يظل معتمدًا على توفر العمال.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة استطلاع مصادَق عليها لفحص مُرسَل.

- تُرجع حالة queued/running/succeeded/failed.
- تُرجع `queue.queuedAhead` و`queue.position` أثناء وجود الطلب في قائمة الانتظار حتى يتمكن العملاء من عرض عدد الفحوصات اليدوية ذات الأولوية الموجودة قبل الطلب. تُقيَّد قوائم الانتظار الكبيرة جدًا ويُبلَّغ عنها باستخدام `queuedAheadIsEstimate: true`.
- عند توفرها، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- تُرجع مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة أرشيف التقارير المصادَق عليها.

- تتطلب فحصًا ناجحًا؛ الفحوصات غير النهائية تُرجع `409`.
- تُرجع ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة أرشيف التقارير المخزنة المصادَق عليها للإصدارات المُرسَلة.

- تتطلب صلاحية إدارة المالك/الناشر للمهارة أو Plugin، أو صلاحية مشرف/مسؤول المنصة.
- تُرجع نتائج الفحص المخزنة للإصدار المُرسَل المحدد، بما في ذلك الإصدارات المحظورة أو المخفية.
- القيمة الافتراضية لـ`kind` هي `skill`؛ استخدم `kind=plugin` لفحوصات Plugin/الحزمة.
- تُرجع شكل ZIP نفسه مثل تنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة الفحص الدفعي القانوني للمسؤولين فقط. يقبل شكل الحمولة نفسه مثل `POST /api/v1/skills/-/rescan-batch` القديم.

### `POST /api/v1/skills/-/scan/batch/status`

مسار الحالة الدفعي القانوني للمسؤولين فقط. يقبل `{ "jobIds": ["..."] }` ويُرجع العدادات الإجمالية نفسها مثل `POST /api/v1/skills/-/rescan-batch/status` القديم.

### `GET /api/v1/skills/{slug}/verify`

يُرجع غلاف تحقق بطاقة Skill المستخدم بواسطة `clawhub skill verify`.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (مثل `latest`).

ملاحظات:

- تكون `ok` بقيمة `true` فقط عندما يكون للإصدار المحدد بطاقة Skill مولَّدة، ولا يكون محظورًا كبرمجية خبيثة بواسطة الإشراف، ويكون تحقق ClawScan نظيفًا.
- هوية Skill، وهوية الناشر، وبيانات الإصدار المحدد هي حقول غلاف علوية (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) حتى تتمكن أتمتة الصدفة من قراءتها دون فك أغلفة متداخلة.
- `security` هو حكم ClawScan/الأمان في المستوى العلوي. يجب أن تعتمد الأتمتة على `ok` و`decision` و`reasons` و`security.status`.
- يحتوي `security.signals` على أدلة ماسحات داعمة مثل `staticScan` و`virusTotal` و`skillSpector`.
- يُحتفظ بـ`security.signals.dependencyRegistry` لتوافق استجابة v1، لكن ماسح وجود سجل التبعيات متقاعد وهذا المفتاح دائمًا `null`.
- تكون `provenance` بقيمة `server-resolved-github-import` فقط عندما يحل ClawHub ويخزن مستودع/مرجع/التزام/مسار GitHub أثناء النشر أو الاستيراد؛ وإلا فهي `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يُرجع أحكام الأمان المدمجة الحالية لإصدارات Skills المحددة. نقطة نهاية
المجموعة هذه مخصصة للعملاء الذين يعرفون مسبقًا أي إصدارات Skills من
ClawHub المثبتة يحتاجون إلى عرضها، مثل OpenClaw Control UI.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن يحتوي `items` على 1-100 زوج `{ slug, version }` فريد.
- النتائج حسب كل عنصر؛ لا يؤدي فقدان Skill أو إصدار واحد إلى فشل الاستجابة كاملة.
- الاستجابة مخصصة للأمان فقط. لا تتضمن بيانات بطاقة Skill، أو حالة البطاقة المولَّدة، أو قوائم ملفات الأثر، أو حمولات ماسحات مفصلة.
- يحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق أمان ClawHub للحصول على تفاصيل الماسحات الكاملة.
- يُحتفظ بـ`security.signals.dependencyRegistry` لتوافق استجابة v1، لكن ماسح وجود سجل التبعيات متقاعد وهذا المفتاح دائمًا `null`.
- لا يؤثر غياب بطاقة Skill في `ok` أو `decision` أو `reasons` الخاصة بنقطة النهاية هذه؛ يجب على العملاء قراءة `skill-card.md` المثبت محليًا عندما يحتاجون إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى غلاف تحقق بطاقة Skill لمهارة واحدة، و`/card` عندما تحتاج إلى Markdown للبطاقة المولَّدة، و`/scan` عندما تحتاج إلى بيانات ماسحات مفصلة.

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

يعيد محتوى نصياً خاماً.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- القيمة الافتراضية هي أحدث إصدار.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية موحدة للفهرس من أجل:

- Skills
- Plugins برمجية
- Plugins حزم

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
  `family=code-plugin`/`family=bundle-plugin`). الفئات المضبوطة والأسماء
  المستعارة القديمة لمرشحات v1 موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured`
  أو `highlightedOnly` أو `sort` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- يبقى `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين مستعارين ثابتين للعائلة.
- تبقى إدخالات Skills مدعومة بسجل Skills، ولا يزال يمكن نشرها فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصاً فقط لإصدارات code-plugin وbundle-plugin.
- لا يرى المتصلون المجهولون إلا قنوات الحزم العامة.
- يمكن للمتصلين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- لا يعيد `channel=private` إلا الحزم التي يمكن للمتصل المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث فهرس موحد عبر Skills + حزم Plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. مدعوم فقط عندما يكون
  الطلب محدد النطاق إلى حزم Plugin. الفئات المضبوطة والأسماء المستعارة القديمة
  لمرشحات v1 موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- لا يرى المتصلون المجهولون إلا قنوات الحزم العامة.
- يمكن للمتصلين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يمكن للمتصل المصادق عليه قراءتها.

### `GET /api/v1/plugins`

تصفح فهرس مخصص لـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (افتراضي)، `trending`، `downloads`، `updated`، الاسم المستعار القديم `installs`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

تظل الأسماء المستعارة القديمة لمرشحات v1 مقبولة على نقاط نهاية القراءة:

- يتم تحويل `mcp-tooling` و`data` و`automation` إلى `tools`.
- يتم تحويل `observability` و`deployment` إلى `gateway`.
- يتم تحويل `dev-tools` إلى `runtime`.

`trending` هو ترتيب تثبيت/تنزيل لمدة سبعة أيام ولا يستخدم الإجماليات التاريخية.
على نقطة النهاية الموحدة `/api/v1/packages` يكون مخصصاً لـ Plugin فقط؛ استخدم
`/api/v1/skills?sort=trending` لفهرس Skills.

لا تُقبل الأسماء المستعارة القديمة كقيم فئات مخزنة أو معلنة من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث Skills العامة من أجل التحليل دون اتصال.

المصادقة:

- رمز API مطلوب.

معلمات الاستعلام:

- `startDate` (مطلوب): حد أدنى بالميلي ثانية وفق Unix لـ `updatedAt` الخاص بـ Skill.
- `endDate` (مطلوب): حد أعلى بالميلي ثانية وفق Unix لـ `updatedAt` الخاص بـ Skill.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- الجسم: أرشيف ZIP.
- تكون جذور كل Skill مصدرة عند `{publisher}/{slug}/`.
- تتضمن Skills المستضافة ملفات أحدث إصدار مخزن وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن Skills الحالية المدعومة من GitHub ذات فحص `clean` أو `suspicious`
  `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، ورابط الأرشيف. ولا تتضمن ملفات المصدر المستضافة على ClawHub.
- تتضمن كل Skill ملف `_export_skill_meta.json`.
- يتم دائماً تضمين `_manifest.json` في جذر ZIP.
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

- رمز API مطلوب.

معلمات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بميلي ثانية Unix للحقل `updatedAt` الخاص بـ Plugin.
- `endDate` (مطلوب): الحد الأعلى بميلي ثانية Unix للحقل `updatedAt` الخاص بـ Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني حذفه كلتا عائلتي
  Plugin.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل Plugin مصدّر عند `{family}/{packageName}/`.
- يتضمن كل Plugin مصدّر الملفات المخزنة لأحدث إصدار.
- تُخزّن بيانات تعريف التصدير لكل Plugin عند
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

بحث مخصص لـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1-100)
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

ملاحظات:

- تُقبل أيضًا أسماء مرشحات v1 القديمة الموثقة ضمن `GET /api/v1/plugins`.
- ترشيح الفئة هو مرشح API حقيقي مدعوم بصفوف ملخص فئات Plugin،
  وليس إعادة كتابة لاستعلام البحث.
- تُعاد النتائج بترتيب الملاءمة ولا تدعم ترقيم الصفحات حاليًا.
- تعيد عناصر تحكم الفرز في واجهة المتصفح لبحث Plugin ترتيب نتائج الملاءمة المحملة،
  بما يطابق سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن لـ Skills أيضًا الحل عبر هذا المسار في الفهرس الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وكل إصداراتها حذفًا مرنًا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدار حزمة واحدًا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والتحقق، وبيانات تعريف الأثر، وبيانات الفحص.

ملاحظات:

- يكون `version.artifact.kind` هو `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة من ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- `version.sha256hash` هو بيانات تعريف توافق مهملة للعملاء القدامى. وهو
  يجري تجزئة بايتات ZIP الدقيقة التي يعيدها `/api/v1/packages/{name}/download`.
  يجب على العملاء الحديثين استخدام `version.artifact.sha256`، الذي يحدد
  أثر الإصدار المعياري.
- يتم تضمين `version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan`
  عندما توجد بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/security`

يعيد ملخص الأمان والثقة الدقيق لإصدار الحزمة لعملاء التثبيت. هذا هو سطح
الاستهلاك العام في OpenClaw لتحديد ما إذا كان يمكن تثبيت إصدار محلول.

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

- يحدد `package.name` و`package.displayName` و`package.family` حزمة السجل
  المحلولة.
- يحدد `release.releaseId` و`release.version` و`release.createdAt` الإصدار
  الدقيق الذي تم تقييمه.
- تكون `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity`
  و`release.npmShasum` و`release.npmTarballName` موجودة عندما تكون معروفة
  لأثر الإصدار.
- `trust.scanStatus` هو حالة الثقة الفعالة المشتقة من مدخلات الماسح
  ومراجعة الإصدار اليدوية.
- `trust.moderationState` قابل لأن يكون null. يكون `null` عندما لا توجد
  مراجعة إصدار يدوية.
- `trust.blockedFromDownload` هو إشارة حظر التثبيت. يجب على OpenClaw وعملاء
  التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلًا من إعادة
  اشتقاق قواعد الحظر من حقول الماسح أو المراجعة.
- `trust.reasons` هي قائمة الشرح الموجهة للمستخدم والتدقيق. رموز الأسباب
  سلاسل ثابتة ومختصرة مثل `manual:quarantined` و`scan:malicious`
  و`package:malicious`.
- يعني `trust.pending` أن واحدًا أو أكثر من مدخلات الثقة ما زال بانتظار الاكتمال.
- يعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة ويجب التعامل معه
  على أنه يتطلب تحديثًا قبل قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة للإصدار. يجب على العملاء استدعاؤها بعد حل إصدار
  الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف للحزمة.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدًا من نقاط نهاية مراجعة المالك/المشرف. فهي تعرض
  قرار التثبيت والشرح العام، وليس هويات المبلغين أو نصوص البلاغات أو الأدلة
  الخاصة أو الجداول الزمنية الداخلية للمراجعة.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل الأثر الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثر `legacy-zip` و`downloadUrl` قديمًا لـ ZIP.
- تعيد إصدارات ClawPack أثر `npm-pack`، وحقول سلامة npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح محلل OpenClaw؛ فهو يتجنب تخمين تنسيق الأرشيف من رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزّل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة كـ npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تغطي فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر ClawPack npm-pack
- ملخص الأثر
- مصدر مستودع الشفرة وإثبات منشأ الالتزام
- بيانات تعريف التوافق مع OpenClaw
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

معلمات الاستعلام:

- `phase` (اختياري): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, أو
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

نقطة نهاية للمسؤولين لإنشاء أو تحديث صف ترحيل Plugin رسمية.

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

- يتم تطبيع `bundledPluginId` إلى أحرف صغيرة وهو مفتاح upsert الثابت.
- يتم تطبيع `packageName` كاسم npm؛ يمكن أن تكون الحزمة مفقودة للترحيلات
  المخططة.
- يتتبع هذا جاهزية الترحيل فقط. لا يغير OpenClaw ولا ينشئ ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لطوابير مراجعة إصدارات الحزم.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، `blocked`، `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالات:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مبلغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
- `manual`: أي إصدار يتضمن تجاوز مراجعة يدويًا.
- `all`: أي إصدار يتضمن تجاوزًا يدويًا أو حالة فحص غير نظيفة أو بلاغ حزمة.

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

أبلغ عن حزمة لمراجعة المشرف. تكون البلاغات على مستوى الحزمة، ويمكن ربطها
اختياريًا بإصدار. وهي تغذي طابور المراجعة لكنها لا تخفي التنزيلات أو تحظرها
تلقائيًا بذاتها؛ يجب على المشرفين استخدام مراجعة الإصدار للموافقة على الآثار
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

نقطة نهاية للمالك/المشرف لرؤية حالة الإشراف على الحزمة.

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

نقطة نهاية للمشرف/المسؤول لحل تقارير الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` مطلوبة مع `confirmed` و`dismissed`؛ ويمكن حذفها عند
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

نقطة نهاية للمشرف/المسؤول لمراجعة إصدار الحزمة.

الطلب:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

الحالات المدعومة:

- `approved`: تمت مراجعته يدويًا والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقًا سابقًا.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل الأثر.
يكتب كل تغيير إدخالًا في سجل التدقيق.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصيًا خامًا لملف حزمة.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- يستخدم حاوية معدل القراءة، وليس حاوية التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200 كيلوبايت.
- لا تمنع فحوصات VirusTotal المعلقة عمليات القراءة؛ وقد تظل الإصدارات الضارة محجوبة في مكان آخر.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزمة هي ملفات zip بجذر `package/` كي تستمر عملاء OpenClaw
  القديمة في العمل.
- يبقى هذا المسار مخصصًا لـ ZIP فقط. لا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة المحلل.
- لا تُحقن بيانات التعريف الخاصة بالسجل فقط في الأرشيف المنزل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الضارة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقًا مع npm لإصدارات الحزم المدعومة بـ ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي لديها كرات tar من نوع ClawPack npm-pack مرفوعة.
- تُحذف الإصدارات القديمة المخصصة لـ ZIP فقط عمدًا.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولًا متوافقة مع npm
  كي يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلًا من `/api/npm/@scope/name` ومسار طلب npm
  المشفر `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات كرة tar المرفوعة بدقة من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 الخاص بـ ClawHub بالإضافة إلى بيانات تعريف integrity/shasum الخاصة بـ npm.
- لا تزال فحوصات الإشراف والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

تستخدمه CLI لربط بصمة محلية بإصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي بطول 64 محرفًا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزل ملف ZIP لإصدار skill مستضاف، أو يعيد تسليم مصدر GitHub لـ skill
حالية مدعومة بـ GitHub لديها فحص `clean` أو `suspicious` ولا توجد لها
نسخة مستضافة.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يُقدم `version` ولا `tag`، فسيُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفًا ناعمًا `410`.
- لا تعمل عمليات تسليم skill المدعومة بـ GitHub كوكيل للبايتات ولا تعكسها. تتضمن استجابة JSON
  `sourceRef: "public-github"` و`repo` و`commit` و`path` و`contentHash`
  و`archiveUrl`؛ حالة الفحص/الحالة الحالية هي بوابة ولا تُضمّن كبيانات تعريف
  حمولة نجاح.
- تُحسب إحصاءات التنزيل كهويات فريدة لكل يوم UTC (`userId` عندما يكون رمز API صالحًا، وإلا IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصدارًا جديدًا.

- المفضل: `multipart/form-data` مع JSON في `payload` + كتل `files[]`.
- يُقبل أيضًا جسم JSON مع `files` (المستندة إلى storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، تحل API ذلك
  الناشر من جهة الخادم وتتطلب أن يمتلك الفاعل وصولًا إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عند ضبطه على `true` مع `ownerHandle`، قد تنتقل
  skill موجودة إلى ذلك المالك إذا كان الفاعل مسؤولًا/مالكًا لدى كل من
  الناشرين الحالي والهدف. من دون هذا الاشتراك الصريح، تُرفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموحة هي `payload`، أو كتل `files` مكررة، أو مرجع كرة tar واحد باسم `clawpack`.
  يمكن أن يكون `clawpack` كتلة `.tgz` أو معرّف تخزين تعيده
  مسار upload-url. يجب أن تتضمن عمليات النشر المرحلية المستندة إلى معرّف التخزين أيضًا
  `clawpackUploadTicket` المعاد مع URL الرفع ذلك.
- استخدم إما `files` أو `clawpack`، ولا تستخدم كليهما في الطلب نفسه أبدًا.
- تُرفض أجسام JSON وبيانات تعريف `payload.files` / `payload.artifact`
  التي يوفرها المستدعي.
- تُحد طلبات النشر المباشرة متعددة الأجزاء عند 18 ميغابايت. يمكن لكرات tar الخاصة بـ ClawPack
  استخدام مسار upload-url حتى حد كرة tar البالغ 120 ميغابايت.
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، يمكن للمسؤولين فقط النشر نيابة عن ذلك المالك.

أبرز نقاط التحقق:

- يجب أن تكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي رفعات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب code plugins وجود `package.json`، وبيانات تعريف مستودع المصدر، وبيانات تعريف التزام المصدر،
  وبيانات تعريف مخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات تعريف اختيارية.
- يمكن فقط لناشر مؤسسة `openclaw` وأعضاء مؤسسة `openclaw` الحاليين
  ضمن ناشريهم الشخصيين النشر إلى قناة `official`.
- لا تزال عمليات النشر نيابة عن الغير تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف ناعم / استعادة skill (المالك، أو المشرف، أو المسؤول).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، تُخزن كملاحظة إشراف skill وتُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف الناعم التي يبدأها المالك slug لمدة 30 يومًا، ثم يمكن لناشر
آخر المطالبة بـ slug. تتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانتهاء.
لا تنتهي إخفاءات المشرف/المسؤول وإزالات الأمان بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسنًا
- `401`: غير مصرح
- `403`: محظور
- `404`: لم يتم العثور على skill/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمسؤول فقط. يضمن وجود ناشر مؤسسة لمعرّف. إذا كان المعرّف لا يزال يشير إلى
مستخدم مشترك قديم/ناشر شخصي، فإن نقطة النهاية ترحله أولًا إلى ناشر مؤسسة.
للمؤسسة المنشأة حديثًا، قدم `memberHandle`؛ لا يُضاف المسؤول الفاعل كعضو.
القيمة الافتراضية لـ `memberRole` هي `owner`.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ناشر مؤسسة ذاتي الخدمة للمستخدمين المصادق عليهم. ينشئ ناشر مؤسسة جديدًا ويضيف
المستدعي كمالك. لا ترحل نقطة النهاية هذه معرّفات المستخدمين/المعرّفات الشخصية الحالية ولا
تضع علامة موثوق/رسمي على الناشر.

- الجسم: `{ "handle": "opik", "displayName": "Opik" }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- يعيد `409` عندما يكون المعرّف مستخدمًا بالفعل من قبل ناشر، أو مستخدم، أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمسؤول فقط. يحجز slugs الجذرية وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزم عناصر نائبة خاصة بلا صفوف إصدارات، بحيث يستطيع
المالك نفسه لاحقًا نشر إصدار code-plugin أو bundle-plugin الحقيقي إلى ذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمسؤول فقط. يستعيد ناشرًا شخصيًا لمبدأ GitHub OAuth بديل ومتحقق منه
من دون تعديل صفوف حساب Convex Auth. يجب أن يسمي الطلب كلا معرّفي حساب
موفر GitHub غير القابلين للتغيير؛ وتُستخدم المعرّفات القابلة للتغيير فقط كحاجز موجه للمشغل.

تكون نقطة النهاية افتراضيا في وضع التشغيل التجريبي. يتطلب تطبيق الاسترداد `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق فريق العمل بشكل مستقل من الاستمرارية بين كلا
كياني GitHub الرئيسيين. يفشل الاسترداد بإغلاق آمن عندما يكون لدى الناشر الشخصي الحالي للمستخدم الوجهة
مهارات أو حزم أو مصادر مهارات GitHub.
يرحّل الاسترداد أيضا حقول `ownerUserId` القديمة لمهارات الناشر المسترد،
وأسماء slug المستعارة للمهارات، والحزم، وتحذيرات فاحص الحزم، وصفوف ملخص البحث المشتقة بحيث
تتفق مسارات المالك المباشر مع سلطة الناشر الجديدة. كما يعاد تعيين حجز المقبض المحمي النشط
للمقبض المسترد إلى المستخدم البديل حتى لا تتمكن مزامنة الملف الشخصي لاحقا
من استعادة سلطة المستخدم السابق المنافسة. يقتصر كل جدول أساسي على
100 صف لكل معاملة تطبيق؛ يجب أن تستخدم عمليات الاسترداد الأكبر أولا ترحيلا قابلا للاستئناف للمالك.
مصادر مهارات GitHub مضبوطة النطاق حسب الناشر ويبلغ عنها على أنها مفحوصة بدلا من إعادة كتابتها.

- النص: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- الاستجابة: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط نهاية إدارة slug للمالك

- `POST /api/v1/skills/{slug}/rename`
  - النص: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - النص: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة برمز API، ولا تعملان إلا لمالك المهارة.
- يحافظ `rename` على slug السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` قائمة المصدر ويعيد توجيه slug المصدر إلى قائمة الهدف.

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

حظر مستخدم وحذف المهارات المملوكة نهائيا (للمشرف/المسؤول فقط).

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

إلغاء حظر مستخدم واستعادة المهارات المؤهلة (للمسؤول فقط).

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
المحتوى (للمسؤول فقط). يكون الوضع افتراضيا تشغيلًا تجريبيا ما لم تكن `dryRun` هي `false`.

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

معلمات الاستعلام:

- `q` (اختياري): استعلام البحث
- `query` (اختياري): اسم مستعار لـ `q`
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

إضافة/إزالة نجمة (تمييزات). كلتا نقطتي النهاية متطابقتا التأثير.

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
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

راجع `DEPRECATIONS.md` لمعرفة خطة الإزالة.

يعيد `POST /api/cli/upload-url` القيمتين `uploadUrl` و `uploadTicket`. يجب أن ترسل عمليات نشر الحزم
التي تجهز أرشيف ClawPack ناتج التخزين بصفته
`clawpack`، والتذكرة المعادة بصفتها `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضّل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيا، فقدّم هذا الملف (أو اضبط `CLAWHUB_REGISTRY` صراحة؛ القديم `CLAWDHUB_REGISTRY`).
