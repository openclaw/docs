---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع واجهة HTTP API (نقاط النهاية العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-07-12T05:38:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP البرمجية

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

تقع جميع مسارات v1 ضمن `/api/v1/...`.
تظل المسارات القديمة `/api/...` و`/api/cli/...` متاحة للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الدليل العام

يجوز لأدلة الجهات الخارجية استخدام نقاط نهاية القراءة العامة لسرد Skills في ClawHub أو البحث عنها. يُرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وإعادة توجيه المستخدمين إلى صفحة ClawHub الأساسية (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد موقع الجهة الخارجية. لا تحاول نسخ المحتوى المخفي أو الخاص أو المحظور بالإشراف خارج النطاق العام للواجهة البرمجية.

تُحل اختصارات الأسماء اللطيفة للويب عبر عائلات السجل، لكن ينبغي لعملاء الواجهة البرمجية استخدام
عناوين URL الأساسية التي تعيدها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات مجهولة الهوية: تُفرض الحدود لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تُفرض الحدود لكل حصة مستخدم.
- إذا كان الرمز مفقودًا أو غير صالح، يعود السلوك إلى الإنفاذ حسب عنوان IP.
- ينبغي ألا تعيد نقاط نهاية الكتابة المصادق عليها مجرد `Unauthorized` عندما
  يعرف الخادم السبب. ينبغي أن تتلقى الرموز المفقودة والرموز غير الصالحة أو الملغاة
  والحسابات المحذوفة أو المحظورة أو المعطلة نصًا إجرائيًا لكل حالة، حتى يتمكن عملاء
  CLI من إبلاغ المستخدمين بما منعهم.

- القراءة: 3000/دقيقة لكل عنوان IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل عنوان IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل عنوان IP، و6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الترويسات:

- التوافق القديم: `X-RateLimit-Limit`، و`X-RateLimit-Reset`
- الموحّدة: `RateLimit-Limit`، و`RateLimit-Reset`
- عند `429`:‏ `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`:‏ `Retry-After`

دلالات الترويسات:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني المتبقية حتى إعادة الضبط (المهلة)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الحصة المتبقية الدقيقة عند وجودها.
  تحذف الطلبات المجزأة الناجحة هذه الترويسة بدلًا من إعادة قيمة عامة تقريبية.
- `Retry-After`: عدد الثواني المطلوب انتظارها قبل إعادة المحاولة (المهلة) عند `429`

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

- إذا وُجد `Retry-After`، فانتظر هذا العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعًا بزمن عشوائي لتجنب إعادة المحاولات المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر عنوان IP:

- يستخدم ترويسات عنوان IP الموثوقة للعميل، بما فيها `cf-connecting-ip`، فقط عندما
  يفعّل النشر صراحةً ترويسات إعادة التوجيه الموثوقة.
- يستخدم ClawHub ترويسات إعادة التوجيه الموثوقة لتحديد عناوين IP للعملاء عند الحافة.
- إذا لم يتوفر عنوان IP موثوق للعميل، تستخدم الطلبات مجهولة الهوية حصصًا احتياطية
  يقتصر نطاقها على نوع حد المعدل. لا تتضمن هذه الحصص الاحتياطية
  المسارات أو الأسماء اللطيفة أو أسماء الحزم أو الإصدارات أو سلاسل الاستعلام أو غيرها من
  معاملات العناصر التي يوفّرها المستدعي.

## استجابات الأخطاء

تكون استجابات أخطاء v1 العامة نصًا عاديًا مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك حالات فشل التحقق (`400`)، والموارد العامة المفقودة (`404`)، وحالات فشل المصادقة
والأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. ينبغي للعملاء
قراءة نص الاستجابة كسلسلة قابلة للقراءة من قِبل البشر. تُتجاهل معاملات الاستعلام غير المعروفة
لأغراض التوافق، لكن معاملات الاستعلام المعروفة ذات القيم غير الصالحة تعيد
`400`.

## نقاط النهاية العامة (دون مصادقة)

### `GET /api/v1/search`

معاملات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح
- `highlightedOnly` (اختياري):‏ `true` لتصفية Skills المميزة فقط
- `nonSuspiciousOnly` (اختياري):‏ `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ`nonSuspiciousOnly`

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

- تُعاد النتائج بترتيب الصلة (تشابه التضمين + تعزيزات المطابقة التامة لرموز الاسم اللطيف/الاسم + أفضلية طفيفة للشعبية).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز الاسم اللطيف أو اسم العرض أن تتفوق على مطابقة أقل دقة ذات تفاعل أقوى بكثير.
- يُجزّأ نص ASCII عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على الرمز المستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ ولذلك يمنح البحث عن `map` الاسم `personal-map` مطابقة معجمية أقوى من `amap-jsapi-skill`.
- تُقاس الشعبية لوغاريتميًا وتُحد بحد أقصى. قد تحصل Skills ذات التفاعل المرتفع على ترتيب أدنى عندما يكون نص الاستعلام أضعف مطابقةً.
- قد تؤدي حالة الإشراف المشبوهة أو المخفية إلى إزالة Skill من البحث العام، بناءً على مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمزًا مستقلًا في الاسم اللطيف فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تُعِد تسمية اسم لطيف لمجرد استهداف استعلام واحد، إلا إذا كان الاسم الجديد أفضل كاسم أساسي طويل الأمد. تصبح الأسماء اللطيفة القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأساسي والاسم اللطيف المعروض وملخصات البحث المستقبلية تستخدم الاسم الجديد.
- تحافظ الأسماء المستعارة الناتجة عن إعادة التسمية على إمكانية الحل لعناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يعتمد على البيانات الوصفية الأساسية لـSkill بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مرتبطة بـSkill.
- إذا كانت Skill غير ظاهرة على نحو غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول، قبل تغيير البيانات الوصفية المرتبطة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي ترتيب غير `trending`
- `sort` (اختياري):‏ `updated` (الافتراضي)، و`recommended` (الاسم المستعار: `default`)، و`createdAt` (الاسم المستعار: `newest`)، و`downloads`، و`stars` (الاسم المستعار: `rating`)، وتُطابق أسماء التثبيت القديمة المستعارة `installsCurrent`/`installs`/`installsAllTime` القيمة `downloads`، و`trending`
- `nonSuspiciousOnly` (اختياري):‏ `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ`nonSuspiciousOnly`

تعيد قيم `sort` غير الصالحة الرمز `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتّب `trending` حسب عمليات التثبيت خلال آخر 7 أيام (استنادًا إلى بيانات القياس عن بُعد).
- يكون `createdAt` مستقرًا لعمليات زحف Skills الجديدة؛ ويتغير `updated` عند إعادة نشر Skills الحالية.
- عندما تكون `nonSuspiciousOnly=true`، قد تعيد عمليات الترتيب القائمة على المؤشر عناصر أقل من `limit` في الصفحة، لأن Skills المشبوهة تُصفّى بعد استرجاع الصفحة.
- استخدم `nextCursor` لمتابعة ترقيم الصفحات عند وجوده. لا تعني الصفحة القصيرة وحدها انتهاء النتائج.

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

- تُحل الأسماء اللطيفة القديمة التي أنشأتها تدفقات إعادة تسمية المالك أو الدمج إلى Skill الأساسية.
- `metadata.os`: قيود أنظمة التشغيل المعلنة في البيانات التمهيدية لـSkill (مثل `["macos"]` و`["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أنظمة Nix المستهدفة (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` مساوية لـ`null` إذا لم تكن لـSkill بيانات وصفية للمنصة.
- لا تُضمّن `moderation` إلا عندما تكون Skill معلّمة أو عندما يعرضها مالكها.

### `GET /api/v1/skills/{slug}/moderation`

يعيد حالة إشراف منظّمة.

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

- يمكن للمالكين والمشرفين الوصول إلى تفاصيل الإشراف الخاصة بـSkills المخفية.
- لا يحصل المستدعون العامون على `200` إلا لـSkills الظاهرة والمعلّمة مسبقًا.
- تُنقّح الأدلة للمستدعين العامين، ولا تتضمن المقاطع الخام إلا للمالكين والمشرفين.

### `POST /api/v1/skills/{slug}/report`

يبلّغ عن Skill لمراجعتها من قِبل المشرف. تكون البلاغات على مستوى Skill، ويمكن ربطها
اختياريًا بإصدار، وتُضاف إلى قائمة انتظار بلاغات Skills.

المصادقة:

- تتطلب رمز واجهة برمجية.

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

نقطة نهاية للمشرف/المسؤول لاستقبال بلاغات Skills.

معاملات الاستعلام:

- `status` (اختياري):‏ `open` (الافتراضي)، أو`confirmed`، أو`dismissed`، أو`all`
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

نقطة نهاية للمشرف/المسؤول لحل بلاغات Skills أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

تكون `note` مطلوبة عند `confirmed` و`dismissed`؛ ويمكن حذفها عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "hide"` مع بلاغ
تم فرزه لإخفاء Skill ضمن سير العمل القابل للتدقيق نفسه.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد البيانات الوصفية للإصدار + قائمة الملفات.

- تتضمن `version.security` حالة التحقق الموحّدة للفحص وتفاصيل أداة الفحص
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل التحقق من الفحص الأمني لإصدار Skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار ذي وسم (مثل `latest`).

ملاحظات:

- إذا لم يُحدَّد أيٌّ من `version` أو `tag`، فسيُستخدم أحدث إصدار.
- يتضمن حالة تحقق موحَّدة بالإضافة إلى التفاصيل الخاصة بكل أداة فحص.
- تكون `security.hasScanResult` مساويةً لـ `true` فقط عندما تُصدر أداة فحص حكمًا قاطعًا (`clean` أو `suspicious` أو `malicious`).
- تمثل `moderation` لقطة حالية للإشراف على مستوى Skill مستمدة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقّق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل اعتبار `moderation` و`security` ضمن سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة نهاية إرسال موثَّقة لبدء مهام ClawScan جديدة.

لم يعد فحص الرفع المحلي مدعومًا. وتُرجع الطلبات التي تستخدم
`multipart/form-data` أو `{ "source": { "kind": "upload" } }` الرمز `410`.

تستخدم عمليات فحص الإصدارات المنشورة JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

ملاحظات:

- تنتهي صلاحية حمولات طلبات الفحص والتقارير القابلة للتنزيل في مخزن طلبات الفحص بعد انقضاء فترة الاحتفاظ.
- تتطلب عمليات فحص الإصدارات المنشورة صلاحية وصول إدارية للمالك/الناشر، أو صلاحية مشرف/مسؤول المنصة.
- لا تكتب عمليات فحص الإصدارات المنشورة النتائج مرة أخرى إلا عندما تكون `update: true` ويكتمل الفحص بنجاح.
- تكون الاستجابة `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تُعطى طلبات الفحص اليدوية أولوية على أعمال النشر/الاستكمال المعتادة، لكن اكتمالها يظل معتمدًا على توفّر العاملين.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة نهاية استقصاء موثَّقة لفحص مُرسَل.

- تُرجع حالة الانتظار/التشغيل/النجاح/الفشل.
- تُرجع `queue.queuedAhead` و`queue.position` أثناء الانتظار حتى يتمكن العملاء من عرض عدد عمليات الفحص اليدوية ذات الأولوية التي تسبق الطلب. تُقيَّد قوائم الانتظار الضخمة جدًا ويُبلَّغ عنها باستخدام `queuedAheadIsEstimate: true`.
- عندما يكون متاحًا، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- تُرجع مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة نهاية موثَّقة لأرشيف التقرير.

- تتطلب فحصًا ناجحًا؛ وتُرجع عمليات الفحص التي لم تصل إلى حالة نهائية الرمز `409`.
- تُرجع ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة نهاية موثَّقة لأرشيف التقارير المخزنة للإصدارات المُرسَلة.

- تتطلب صلاحية وصول إدارية للمالك/الناشر إلى Skill أو Plugin، أو صلاحية مشرف/مسؤول المنصة.
- تُرجع نتائج الفحص المخزنة للإصدار المُرسَل المحدد، بما في ذلك الإصدارات المحظورة أو المخفية.
- تكون القيمة الافتراضية لـ `kind` هي `skill`؛ استخدم `kind=plugin` لعمليات فحص Plugin/الحزمة.
- تُرجع بنية ZIP نفسها التي تُرجعها تنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة الفحص الدفعي القياسي المخصص للمسؤولين فقط. يقبل بنية الحمولة نفسها التي يقبلها المسار القديم `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

مسار حالة الدفعة القياسي المخصص للمسؤولين فقط. يقبل `{ "jobIds": ["..."] }` ويُرجع العدادات المجمعة نفسها التي يُرجعها المسار القديم `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

يُرجع غلاف التحقق من بطاقة Skill الذي يستخدمه `clawhub skill verify`.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): تحديد إصدار موسوم (مثل `latest`).

ملاحظات:

- تكون `ok` مساويةً لـ `true` فقط عندما يمتلك الإصدار المحدد بطاقة Skill مُنشأة، ولا يكون محظورًا بوصفه برمجية ضارة من قِبل الإشراف، ويكون تحقق ClawScan نظيفًا.
- تكون هوية Skill وهوية الناشر والبيانات الوصفية للإصدار المحدد حقولًا في المستوى الأعلى للغلاف (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) حتى تتمكن أتمتة الصدفة من قراءتها دون فك أغلفة متداخلة.
- تمثل `security` حكم ClawScan/الأمان في المستوى الأعلى. ينبغي أن تعتمد الأتمتة على `ok` و`decision` و`reasons` و`security.status`.
- تحتوي `security.signals` على أدلة داعمة من أدوات الفحص، مثل `staticScan` و`virusTotal` و`skillSpector`.
- يُحتفظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن أداة فحص وجود سجل التبعيات أُوقفت، وتكون قيمة هذا المفتاح دائمًا `null`.
- تكون `provenance` مساويةً لـ `server-resolved-github-import` فقط عندما يحل ClawHub مستودع GitHub/المرجع/الالتزام/المسار ويخزنه أثناء النشر أو الاستيراد؛ وإلا فتكون `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يُرجع أحكام الأمان الحالية الموجزة لإصدارات Skills المحددة. نقطة نهاية
المجموعة هذه مخصصة للعملاء الذين يعرفون مسبقًا إصدارات Skills من ClawHub
المثبتة التي يحتاجون إلى عرضها، مثل واجهة التحكم في OpenClaw.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن تحتوي `items` على 1-100 زوج فريد من `{ slug, version }`.
- تكون النتائج لكل عنصر على حدة؛ ولا يؤدي فقدان Skill أو إصدار واحد إلى فشل الاستجابة بأكملها.
- تقتصر الاستجابة على الأمان. ولا تتضمن بيانات بطاقة Skill أو حالة البطاقة المُنشأة أو قوائم ملفات العناصر المصاحبة أو حمولات أدوات الفحص التفصيلية.
- تحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق الأمان في ClawHub للحصول على التفاصيل الكاملة لأدوات الفحص.
- يُحتفظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن أداة فحص وجود سجل التبعيات أُوقفت، وتكون قيمة هذا المفتاح دائمًا `null`.
- لا يؤثر غياب بطاقة Skill في `ok` أو `decision` أو `reasons` لنقطة النهاية هذه؛ وينبغي للعملاء قراءة `skill-card.md` المثبت محليًا عند الحاجة إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى غلاف التحقق من بطاقة Skill لعنصر واحد، و`/card` عندما تحتاج إلى Markdown البطاقة المُنشأة، و`/scan` عندما تحتاج إلى بيانات تفصيلية من أدوات الفحص.

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
- الحد الأقصى لحجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية موحّدة للفهرس من أجل:

- Skills
- Plugins البرمجية
- Plugins الحِزمية

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `updated` (الافتراضي)، أو `recommended`، أو `trending`، أو `downloads`، أو الاسم البديل القديم `installs`
- `category` (اختياري): عامل تصفية فئة Plugin. لا يُدعم إلا عندما يكون
  نطاق الطلب محصورًا في حزم Plugins (`/api/v1/plugins` أو
  `/api/v1/code-plugins` أو `/api/v1/bundle-plugins` أو نقاط نهاية الحزم مع
  `family=code-plugin`/`family=bundle-plugin`). الفئات المضبوطة والأسماء
  البديلة القديمة لعوامل تصفية v1 موثّقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- تعيد القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured`
  أو `highlightedOnly` أو `sort` الحالة `400`. تُتجاهل معلمات الاستعلام غير المعروفة.
- يظل `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين بديلين لعائلتين ثابتتين.
- تظل إدخالات Skills مدعومة بسجل Skills، ولا يزال نشرها ممكنًا فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصًا فقط لإصدارات Plugins البرمجية وPlugins الحِزمية.
- لا يرى المستدعون مجهولو الهوية إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم ضمن نتائج القوائم والبحث.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحّد في الفهرس عبر Skills وحزم Plugins.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): عامل تصفية فئة Plugin. لا يُدعم إلا عندما يكون
  نطاق الطلب محصورًا في حزم Plugins. الفئات المضبوطة والأسماء البديلة القديمة
  لعوامل تصفية v1 موثّقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- تعيد القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` الحالة `400`. تُتجاهل معلمات الاستعلام غير المعروفة.
- لا يرى المستدعون مجهولو الهوية إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/plugins`

تصفّح فهرس خاص بـ Plugins عبر حزم Plugins البرمجية وPlugins الحِزمية.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (الافتراضي)، أو `trending`، أو `downloads`، أو `updated`، أو الاسم البديل القديم `installs`
- `category` (اختياري): عامل تصفية فئة Plugin. القيم الحالية:
  `channels`، و`models`، و`memory`، و`context`، و`voice`، و`media`، و`web`،
  و`tools`، و`runtime`، و`gateway`، و`security`، و`other`.

تظل الأسماء البديلة القديمة لعوامل تصفية v1 مقبولة في نقاط نهاية القراءة:

- تتحول `mcp-tooling` و`data` و`automation` إلى `tools`.
- تتحول `observability` و`deployment` إلى `gateway`.
- تتحول `dev-tools` إلى `runtime`.

يمثل `trending` لوحة ترتيب لعمليات التثبيت/التنزيل خلال سبعة أيام، ولا يستخدم الإجماليات التاريخية.
وفي نقطة النهاية الموحدة `/api/v1/packages`، يقتصر على Plugins؛ استخدم
`/api/v1/skills?sort=trending` لفهرس Skills.

لا تُقبل الأسماء البديلة القديمة بوصفها قيم فئات مخزنة أو مصرّحًا بها من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث Skills العامة من أجل التحليل دون اتصال بالإنترنت.

المصادقة:

- يلزم رمز API مميز.

معلمات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بالميلي ثانية وفق توقيت Unix لقيمة `updatedAt` في Skill.
- `endDate` (مطلوب): الحد الأعلى بالميلي ثانية وفق توقيت Unix لقيمة `updatedAt` في Skill.
- `limit` (اختياري): عدد صحيح (1-250)، والقيمة الافتراضية `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- النص الأساسي: أرشيف ZIP.
- يكون جذر كل Skill مُصدّرة في `{publisher}/{slug}/`.
- تتضمن Skills المستضافة ملفات أحدث إصدار مخزّن، وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن Skills الحالية المدعومة من GitHub والتي لها نتيجة فحص `clean` أو `suspicious`
  ملف `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، وعنوان URL للأرشيف. ولا تتضمن ملفات المصدر المستضافة على ClawHub.
- تتضمن كل Skill ملف `_export_skill_meta.json`.
- يُضمّن `_manifest.json` دائمًا في جذر ملف ZIP.
- يُضمّن `_errors.json` عندما يتعذر تصدير Skills أو ملفات فردية.

الرؤوس:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

تصدير مجمّع لأحدث إصدارات Plugins العامة للتحليل دون اتصال بالإنترنت.

المصادقة:

- يلزم رمز API مميز.

معلمات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بالمللي ثانية وفق توقيت Unix لقيمة `updatedAt` الخاصة بالـ Plugin.
- `endDate` (مطلوب): الحد الأعلى بالمللي ثانية وفق توقيت Unix لقيمة `updatedAt` الخاصة بالـ Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، والقيمة الافتراضية `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني حذفه تضمين
  كلتا عائلتي Plugins.

الاستجابة:

- المتن: أرشيف ZIP.
- يوجد جذر كل Plugin مُصدَّر في `{family}/{packageName}/`.
- يتضمن كل Plugin مُصدَّر الملفات المخزنة لأحدث إصدار.
- تُخزَّن بيانات التصدير الوصفية لكل Plugin في
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- يُضمَّن `_manifest.json` دائمًا في جذر ملف ZIP.
- يُضمَّن `_errors.json` عندما يتعذر تصدير بعض Plugins أو الملفات
  بصورة منفردة.

الترويسات:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

بحث مخصص للـ Plugins في حزم `code-plugin` و`bundle-plugin`.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1-100)
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`، و`models`، و`memory`، و`context`، و`voice`، و`media`، و`web`،
  و`tools`، و`runtime`، و`gateway`، و`security`، و`other`.

ملاحظات:

- تُقبل أيضًا أسماء مرشحات الإصدار v1 القديمة البديلة الموثقة ضمن `GET /api/v1/plugins`.
- ترشيح الفئات هو مرشح API فعلي مدعوم بصفوف ملخصات فئات Plugins،
  وليس إعادة صياغة لاستعلام البحث.
- تُعاد النتائج بترتيب الصلة ولا تدعم ترقيم الصفحات حاليًا.
- تعيد عناصر تحكم الفرز في واجهة المتصفح لبحث Plugins ترتيب نتائج الصلة المحمَّلة،
  بما يتوافق مع سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

يعيد البيانات الوصفية التفصيلية للحزمة.

ملاحظات:

- يمكن أيضًا تحليل Skills عبر هذا المسار في الفهرس الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة بيانات الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وجميع إصداراتها حذفًا منطقيًا.

ملاحظات:

- يتطلب رمز API مميزًا لمالك الحزمة، أو مالك/مسؤول مؤسسة ناشرة،
  أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة بيانات الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدارًا واحدًا من الحزمة، بما في ذلك البيانات الوصفية للملفات، والتوافق،
والتحقق، والبيانات الوصفية للأثر، وبيانات الفحص.

ملاحظات:

- تكون قيمة `version.artifact.kind` هي `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة بواسطة ClawPack.
- تتضمن إصدارات ClawPack الحقول المتوافقة مع npm: `npmIntegrity`، و`npmShasum`،
  و`npmTarballName`.
- تم إهمال `version.sha256hash`، وهي بيانات وصفية للتوافق مع العملاء القدامى. وهي
  تجزّئ وحدات بايت ZIP الدقيقة التي يعيدها `/api/v1/packages/{name}/download`.
  ينبغي للعملاء الحديثين استخدام `version.artifact.sha256`، الذي يحدد
  أثر الإصدار الأساسي.
- تُضمَّن `version.vtAnalysis`، و`version.llmAnalysis`، و`version.staticScan`
  عند وجود بيانات الفحص.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة بيانات الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/security`

يعيد الملخص الدقيق لأمان إصدار الحزمة وموثوقيته لعملاء
التثبيت. هذه هي واجهة OpenClaw العامة المستخدمة لتحديد ما إذا كان يمكن
تثبيت إصدار تم تحليله.

المصادقة:

- نقطة نهاية عامة للقراءة. لا يلزم رمز مميز للمالك أو الناشر أو المشرف أو المسؤول.

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

- تحدد `package.name`، و`package.displayName`، و`package.family`
  حزمة السجل التي تم تحليلها.
- تحدد `release.releaseId`، و`release.version`، و`release.createdAt`
  الإصدار الدقيق الذي جرى تقييمه.
- توجد `release.artifactKind`، و`release.artifactSha256`، و`release.npmIntegrity`،
  و`release.npmShasum`، و`release.npmTarballName` عند معرفة قيمها
  لأثر الإصدار.
- تمثل `trust.scanStatus` حالة الموثوقية الفعلية المشتقة من مدخلات أدوات الفحص
  والإشراف اليدوي على الإصدار.
- تقبل `trust.moderationState` قيمة خالية. وتكون `null` عند عدم وجود
  إشراف يدوي على الإصدار.
- تمثل `trust.blockedFromDownload` إشارة حظر التثبيت. ينبغي لـ OpenClaw وعملاء
  التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلًا من
  إعادة اشتقاق قواعد الحظر من حقول الفحص أو الإشراف.
- تمثل `trust.reasons` قائمة التفسيرات الموجهة للمستخدم والمخصصة للتدقيق. رموز الأسباب
  هي سلاسل ثابتة ومختصرة مثل `manual:quarantined`، و`scan:malicious`،
  و`package:malicious`.
- تعني `trust.pending` أن واحدًا أو أكثر من مدخلات الموثوقية لا يزال في انتظار الاكتمال.
- تعني `trust.stale` أن ملخص الموثوقية حُسب من مدخلات قديمة،
  وينبغي اعتباره بحاجة إلى التحديث قبل اتخاذ قرار سماح بدرجة ثقة عالية.

ملاحظات:

- نقطة النهاية هذه خاصة بإصدار محدد. ينبغي للعملاء استدعاؤها بعد تحليل
  إصدار الحزمة الذي ينوون تثبيته، وليس بعد قراءة أحدث بيانات
  وصفية للحزمة فقط.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة بيانات الناشر المالك.
- نقطة النهاية هذه أضيق نطاقًا عمدًا من نقاط نهاية الإشراف الخاصة
  بالمالك/المشرف. فهي تعرض قرار التثبيت والتفسير العام، وليس
  هويات المبلّغين، أو محتويات البلاغات، أو الأدلة الخاصة، أو الجداول الزمنية
  للمراجعة الداخلية.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد البيانات الوصفية الصريحة لمحلل الأثر الخاص بإصدار الحزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثرًا من نوع `legacy-zip` و`downloadUrl`
  قديمًا لملف ZIP.
- تعيد إصدارات ClawPack أثرًا من نوع `npm-pack`، وحقول تكامل npm،
  و`tarballUrl`، وعنوان URL القديم للتوافق مع ZIP.
- هذه هي واجهة محلل OpenClaw؛ وهي تتجنب تخمين تنسيق الأرشيف من
  عنوان URL مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزّل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack وحدات بايت `.tgz` الدقيقة من نوع npm-pack التي رُفعت.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حصة معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستخدام OpenClaw مستقبلًا.

تشمل فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر npm-pack الخاص بـ ClawPack
- ملخص الأثر
- مصدر مستودع الشيفرة والالتزام
- البيانات الوصفية لتوافق OpenClaw
- المضيفات المستهدفة
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

نقطة نهاية للمشرفين تسرد صفوف ترحيل Plugins الرسمية الخاصة بـ OpenClaw.

المصادقة:

- تتطلب رمز API مميزًا لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned`، أو `published`، أو `clawpack-ready`،
  أو `legacy-zip-only`، أو `metadata-ready`، أو `blocked`، أو `ready-for-openclaw`، أو
  `all` (القيمة الافتراضية).
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

نقطة نهاية للمسؤولين لإنشاء صف ترحيل Plugin رسمي أو تحديثه.

المصادقة:

- تتطلب رمز API مميزًا لمستخدم مسؤول.

متن الطلب:

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

- تُحوَّل `bundledPluginId` إلى أحرف صغيرة، وهي مفتاح الإدراج أو التحديث الثابت.
- يُطبَّع `packageName` وفق اسم npm؛ ويمكن أن تكون الحزمة مفقودة في عمليات
  الترحيل المخطط لها.
- يتتبع هذا جاهزية الترحيل فقط. ولا يعدّل OpenClaw ولا ينشئ
  حزم ClawPack.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لطوابير مراجعة إصدارات الحزم.

المصادقة:

- تتطلب رمز API مميزًا لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (القيمة الافتراضية)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالات:

- `open`: إصدارات مشبوهة، أو ضارة، أو معلقة، أو معزولة، أو مسحوبة، أو مُبلَّغ عنها.
- `blocked`: إصدارات معزولة، أو مسحوبة، أو ضارة.
- `manual`: أي إصدار يتضمن تجاوزًا يدويًا للإشراف.
- `all`: أي إصدار يتضمن تجاوزًا يدويًا، أو حالة فحص غير سليمة، أو بلاغًا عن الحزمة.

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

يبلّغ عن حزمة لمراجعتها بواسطة المشرفين. تكون البلاغات على مستوى الحزمة، ويمكن
ربطها اختياريًا بإصدار. وهي تغذي طابور الإشراف، لكنها لا تخفي
التنزيلات أو تحظرها تلقائيًا بمفردها؛ وينبغي للمشرفين استخدام الإشراف على الإصدارات
للموافقة على الآثار، أو عزلها، أو سحبها.

المصادقة:

- يتطلب رمز API مميزًا.

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

نقطة نهاية لمالك الحزمة/المشرف لعرض معلومات الإشراف على الحزمة.

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

نقطة نهاية للمشرف/المسؤول لحسم بلاغات الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

الحقل `note` مطلوب للقيمتين `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "quarantine"` أو
`finalAction: "revoke"` مع بلاغ مؤكد لتطبيق الإشراف على الإصدار ضمن
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

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل العناصر.
ويكتب كل تغيير إدخالًا في سجل التدقيق.

### `GET /api/v1/packages/{name}/file`

يعيد المحتوى النصي الخام لملف حزمة.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- يستخدم حصة معدل القراءة، لا حصة التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200 كيلوبايت.
- لا تمنع عمليات فحص VirusTotal المعلقة القراءة؛ وقد تظل الإصدارات الضارة محجوبة في مواضع أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزّل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات ZIP ذات جذر `package/` لكي تستمر عملاء OpenClaw
  القديمة في العمل.
- يظل هذا المسار مخصصًا لملفات ZIP فقط. ولا يبث ملفات ClawPack ذات الامتداد `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لإجراء فحوصات سلامة المحلّل.
- لا تُحقن البيانات الوصفية الخاصة بالسجل في الأرشيف المنزّل.
- لا تمنع عمليات فحص VirusTotal المعلقة التنزيلات؛ وتعيد الإصدارات الضارة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد بيان حزمة متوافقًا مع npm لإصدارات الحزم المدعومة بواسطة ClawPack.

ملاحظات:

- لا تُدرج إلا الإصدارات التي رُفعت لها كرات tar من نوع npm-pack عبر ClawPack.
- تُستبعد عمدًا الإصدارات القديمة المتوفرة بصيغة ZIP فقط.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولًا متوافقة مع npm
  حتى يتمكن المستخدمون من توجيه npm إلى المرآة إن أرادوا.
- تدعم بيانات الحزم ذات النطاق مسار الطلب `/api/npm/@scope/name` ومسار npm
  المرمّز `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث وحدات بايت كرة tar المرفوعة عبر ClawPack كما هي لعملاء مرآة npm.

ملاحظات:

- يستخدم حصة معدل التنزيل.
- تتضمن ترويسات التنزيل قيمة SHA-256 الخاصة بـ ClawHub، بالإضافة إلى بيانات سلامة npm والمجموع الاختباري.
- تظل فحوصات الإشراف والوصول إلى الحزم الخاصة سارية.

### `GET /api/v1/resolve`

تستخدمه CLI لمطابقة بصمة محلية مع إصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): قيمة sha256 سداسية عشرية من 64 محرفًا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزّل ملف ZIP لإصدار Skill مستضاف، أو يعيد إحالة إلى مصدر GitHub لإحدى Skills
الحالية المدعومة من GitHub ذات فحص `clean` أو `suspicious` والتي لا يوجد لها
إصدار مستضاف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يُقدَّم `version` ولا `tag`، يُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفًا مبدئيًا `410`.
- لا تمرر إحالات Skills المدعومة من GitHub وحدات البايت ولا تنشئ مرآة لها. تتضمن استجابة JSON
  الحقول `sourceRef: "public-github"` و`repo` و`commit` و`path` و`contentHash`
  و`archiveUrl`؛ وتكون حالة الفحص/الحالة الحالية بوابةً ولا تُضمَّن ضمن البيانات الوصفية
  لحمولة النجاح.
- تُحتسب إحصاءات التنزيل كهويات فريدة لكل يوم حسب UTC (`userId` عندما يكون رمز API صالحًا، وإلا فعنوان IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب جميع نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصدارًا جديدًا.

- المفضل: `multipart/form-data` مع JSON في `payload` وبيانات ثنائية في `files[]`.
- يُقبل أيضًا نص طلب JSON يحتوي على `files` (استنادًا إلى storageId).
- حقل اختياري في الحمولة: `ownerHandle`. عند وجوده، تحل واجهة API ذلك
  الناشر من جهة الخادم، وتشترط أن يمتلك المنفّذ صلاحية الوصول إلى الناشر.
- حقل اختياري في الحمولة: `migrateOwner`. عندما تكون قيمته `true` مع `ownerHandle`، يمكن
  نقل Skill موجودة إلى ذلك المالك إذا كان المنفّذ مسؤولًا/مالكًا لدى كل من
  الناشر الحالي والناشر المستهدف. ومن دون هذا الاشتراك الصريح، تُرفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة برمز Bearer.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموح بها هي `payload`، أو بيانات `files` المتكررة، أو مرجع كرة tar واحد في `clawpack`.
  وقد يكون `clawpack` بيانات `.tgz` أو معرّف تخزين تُعيده آلية عنوان URL للرفع.
  ويجب أن تتضمن عمليات النشر المرحلية باستخدام معرّف التخزين أيضًا
  `clawpackUploadTicket` المُعاد مع عنوان URL الخاص بالرفع.
- استخدم إما `files` أو `clawpack`، ولا تستخدمهما معًا في الطلب نفسه.
- تُرفض نصوص طلبات JSON والبيانات الوصفية `payload.files` / `payload.artifact`
  التي يقدّمها المستدعي.
- يقتصر حجم طلبات النشر المباشر متعددة الأجزاء على 18 ميغابايت. ويمكن لكرات tar الخاصة بـ ClawPack
  استخدام آلية عنوان URL للرفع حتى حد كرة tar البالغ 120 ميغابايت.
- حقل اختياري في الحمولة: `ownerHandle`. عند وجوده، لا يجوز النشر نيابةً عن ذلك المالك إلا للمسؤولين.

أبرز قواعد التحقق:

- يجب أن تكون قيمة `family` هي `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin الملف `openclaw.plugin.json`. ويجب أن تحتوي عمليات رفع ClawPack ذات الامتداد `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب إضافات الشيفرة `package.json`، وبيانات مستودع المصدر الوصفية، وبيانات التزام
  المصدر الوصفية، وبيانات مخطط الإعداد الوصفية، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- تُعد `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يجوز النشر في قناة `official` إلا لناشر مؤسسة `openclaw` والناشرين الشخصيين
  للأعضاء الحاليين في مؤسسة `openclaw`.
- تظل عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية استنادًا إلى حساب المالك المستهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

يحذف Skill حذفًا مبدئيًا / يستعيدها (المالك أو المشرف أو المسؤول).

نص طلب JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزَّن كملاحظة إشراف على Skill ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف المبدئي التي يبدأها المالك الاسم المختصر لمدة 30 يومًا، ثم يمكن لناشر
آخر المطالبة به. وتتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانتهاء.
ولا تنتهي بهذه الطريقة عمليات الإخفاء التي يجريها المشرف/المسؤول وعمليات الإزالة الأمنية.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: ناجح
- `401`: غير مصرح
- `403`: محظور
- `404`: لم يتم العثور على Skill/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمسؤولين فقط. يضمن وجود ناشر مؤسسة لمعرّف معين. إذا كان المعرّف لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، تنقله نقطة النهاية أولًا إلى ناشر مؤسسة.
بالنسبة إلى مؤسسة منشأة حديثًا، قدّم `memberHandle`؛ ولا يُضاف المسؤول المنفّذ كعضو.
القيمة الافتراضية لـ `memberRole` هي `owner`.

- نص الطلب: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ذاتي الخدمة لناشر مؤسسة مع مصادقة. ينشئ ناشر مؤسسة جديدًا ويضيف
المستدعي كمالك. لا تنقل نقطة النهاية هذه معرّفات المستخدمين/المعرّفات الشخصية الموجودة، ولا
تضع علامة موثوق/رسمي على الناشر.

- نص الطلب: `{ "handle": "opik", "displayName": "Opik" }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- تعيد `409` عندما يكون المعرّف مستخدمًا بالفعل بواسطة ناشر أو مستخدم أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمسؤولين فقط. يحجز الأسماء المختصرة الجذرية وأسماء الحزم لمالكها الشرعي دون نشر
إصدار. تصبح أسماء الحزم حزمًا نائبة خاصة بلا صفوف إصدارات، حتى يتمكن المالك نفسه
لاحقًا من نشر إصدار code-plugin أو bundle-plugin الحقيقي بذلك الاسم.

- نص الطلب: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمسؤولين فقط. يستعيد ناشرًا شخصيًا لحساب GitHub OAuth بديل تم التحقق منه
من دون تعديل صفوف حساب Convex Auth. يجب أن يحدد الطلب معرّفي حساب موفر GitHub
الثابتين؛ ولا تُستخدم المعرّفات القابلة للتغيير إلا كإجراء حماية موجّه للمشغّل.

تعتمد نقطة النهاية افتراضيًا وضع التشغيل التجريبي. يتطلب تطبيق الاسترداد ضبط `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق الموظفون بشكل مستقل من الاستمرارية بين
هويتي GitHub الرئيسيتين. يفشل الاسترداد بشكل مغلق عندما يكون للناشر الشخصي الحالي
للمستخدم الوجهة Skills أو حزم أو مصادر Skills على GitHub.
يرحّل الاسترداد أيضًا حقول `ownerUserId` القديمة الخاصة بـ Skills التابعة للناشر المسترد،
والأسماء البديلة لمعرّفات Skills، والحزم، وتحذيرات فاحص الحزم، وصفوف ملخصات البحث المشتقة بحيث
تتوافق مسارات المالك المباشر مع صلاحية الناشر الجديدة. كما يُعاد تعيين حجز نشط ومحمي
للمعرّف المسترد إلى المستخدم البديل حتى لا تتمكن مزامنة الملف الشخصي لاحقًا من استعادة
الصلاحية المنافسة للمستخدم السابق. يقتصر كل جدول أساسي على
100 صف لكل معاملة تطبيق؛ ويجب أن تستخدم عمليات الاسترداد الأكبر أولًا ترحيلًا قابلًا للاستئناف للمالك.
تكون مصادر Skills على GitHub ضمن نطاق الناشر ويُبلّغ عنها بوصفها مفحوصة بدلًا من إعادة كتابتها.

- النص: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- الاستجابة: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط نهاية إدارة معرّفات المالك

- `POST /api/v1/skills/{slug}/rename`
  - النص: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - النص: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب نقطتا النهاية مصادقة رمز API ولا تعملان إلا لمالك Skill.
- يحافظ `rename` على المعرّف السابق بوصفه اسمًا بديلًا لإعادة التوجيه.
- يخفي `merge` الإدراج المصدر ويعيد توجيه معرّف المصدر إلى الإدراج الهدف.

### نقاط نهاية نقل الملكية

- `POST /api/v1/skills/{slug}/transfer`
  - النص: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - الاستجابة: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - الاستجابة (القبول/الرفض/الإلغاء): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - بنية الاستجابة: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

حظر مستخدم وحذف Skills المملوكة له نهائيًا (للمشرف/المسؤول فقط).

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

تغيير السبب المخزّن لحظر قائم دون إلغاء الحظر أو استعادة
المحتوى (للمسؤول فقط). يكون الوضع الافتراضي تشغيلًا تجريبيًا ما لم تكن قيمة `dryRun` هي `false`.

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
- `query` (اختياري): اسم بديل لـ `q`
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

إضافة/إزالة نجمة (تمييز). نقطتا النهاية متساويتا الأثر عند التكرار.

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

يعيد `POST /api/cli/upload-url` القيمتين `uploadUrl` و`uploadTicket`. يجب على عمليات
نشر الحزم التي تجهّز أرشيف ClawPack بصيغة tarball إرسال معرّف التخزين الناتج بوصفه
`clawpack` والتذكرة المُعادة بوصفها `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` ‏(JSON، مفضّل)
- `/.well-known/clawdhub.json` ‏(قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيفه ذاتيًا، فقدّم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ والمتغير القديم `CLAWDHUB_REGISTRY`).
