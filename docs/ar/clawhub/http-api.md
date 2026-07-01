---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع HTTP API (العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-07-01T05:40:41Z"
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

يجوز للأدلة التابعة لجهات خارجية استخدام نقاط النهاية العامة للقراءة لسرد أو البحث في Skills الخاصة بـ ClawHub. يرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وربط المستخدمين مرة أخرى بقائمة ClawHub الأساسية (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد موقع الجهة الخارجية. لا تحاول عكس المحتوى المخفي أو الخاص أو المحظور إشرافيًا خارج سطح API العام.

تُحل اختصارات slug الويب عبر عائلات السجل، لكن يجب على عملاء API استخدام
عناوين URL الأساسية التي ترجعها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُفرض لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى الإنفاذ حسب IP.
- يجب ألا تُرجع نقاط نهاية الكتابة المصادق عليها `Unauthorized` مجردة عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة،
  والحسابات المحذوفة/المحظورة/المعطلة على نص قابل للتنفيذ حتى يتمكن عملاء CLI
  من إخبار المستخدمين بما حظرهم.

- القراءة: 3000/دقيقة لكل IP، 12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل IP، 3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل IP، 6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الرؤوس:

- توافق قديم: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- موحّد: `RateLimit-Limit`, `RateLimit-Reset`
- عند `429`: `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند وجودها.
  تحذف الطلبات الناجحة الموزعة هذا الرأس بدلًا من إرجاع قيمة عالمية تقريبية.
- `Retry-After`: الثواني التي يجب انتظارها قبل إعادة المحاولة (تأخير) عند `429`

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
- استخدم تراجعًا مع jitter لتجنب عمليات إعادة المحاولة المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسب من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم رؤوس IP العميل الموثوقة، بما في ذلك `cf-connecting-ip`، فقط عندما
  يفعّل النشر رؤوس التمرير الموثوقة صراحةً.
- يستخدم ClawHub رؤوس التمرير الموثوقة لتحديد عناوين IP الخاصة بالعملاء عند الحافة.
- إذا لم يتوفر IP عميل موثوق، تستخدم الطلبات المجهولة حاويات احتياطية
  محددة فقط بنوع حد المعدل. لا تتضمن هذه الحاويات الاحتياطية
  المسارات أو slugs أو أسماء الحزم أو الإصدارات أو سلاسل الاستعلام أو أي
  معاملات عناصر أخرى مقدمة من المستدعي.

## استجابات الأخطاء

استجابات أخطاء v1 العامة هي نص عادي مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك فشل التحقق (`400`)، والموارد العامة المفقودة (`404`)، وفشل المصادقة
والأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. يجب على العملاء
قراءة نص الاستجابة كسلسلة مفهومة للبشر. تُتجاهل معاملات الاستعلام غير المعروفة
للتوافق، لكن معاملات الاستعلام المعروفة ذات القيم غير الصالحة تُرجع
`400`.

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

- تُرجع النتائج بترتيب الصلة (تشابه التضمين + تعزيزات تطابق slug/رمز الاسم الدقيقة + أفضلية شعبية صغيرة).
- الصلة أقوى من الشعبية. يمكن لتطابق slug دقيق أو رمز اسم عرض أن يتجاوز تطابقًا أوسع مع تفاعل أقوى بكثير.
- يُجزّأ نص ASCII على حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز `map` مستقل، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يعطي البحث عن `map` تطابقًا معجميًا أقوى لـ `personal-map` من `amap-jsapi-skill`.
- تُقاس الشعبية لوغاريتميًا وتُحد بسقف. يمكن لـ Skills ذات التفاعل العالي أن تأتي بترتيب أدنى عندما يكون نص الاستعلام أضعف تطابقًا.
- يمكن للحالة الإشرافية المشبوهة أو المخفية إزالة skill من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تعيد تسمية slug لملاحقة استعلام واحد فقط ما لم يكن slug الجديد اسمًا أساسيًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأساسي وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على الحل لعناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يعتمد على بيانات skill الأساسية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع skill.
- إذا كانت skill غير مرئية بشكل غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المرتبطة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم صفحات لأي ترتيب غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `recommended` (اسم مستعار: `default`)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، أسماء التثبيت القديمة المستعارة `installsCurrent`/`installs`/`installsAllTime` تُطابق إلى `downloads`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

تُرجع قيم `sort` غير الصالحة `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتّب `trending` حسب عمليات التثبيت في آخر 7 أيام (استنادًا إلى القياس عن بُعد).
- `createdAt` مستقر لعمليات زحف Skills الجديدة؛ يتغير `updated` عندما يُعاد نشر Skills الحالية.
- عندما تكون `nonSuspiciousOnly=true`، قد تُرجع الترتيبات المعتمدة على المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تُصفّى بعد جلب الصفحة.
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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى skill الأساسية.
- `metadata.os`: قيود نظام التشغيل المصرح بها في frontmatter الخاصة بـ skill (مثل `["macos"]`، `["linux"]`). `null` إذا لم يُصرح بها.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). `null` إذا لم يُصرح بها.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى skill بيانات وصفية للمنصة.
- تُضمّن `moderation` فقط عندما تكون skill معلّمة أو عندما يعرضها المالك.

### `GET /api/v1/skills/{slug}/moderation`

يرجع حالة إشراف منظّمة.

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
- تُنقح الأدلة للمستدعين العامين ولا تتضمن مقتطفات خام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن skill لمراجعة المشرف. البلاغات على مستوى skill، وترتبط اختياريًا
بإصدار، وتغذي طابور بلاغات skill.

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

نقطة نهاية مشرف/مسؤول لاستقبال بلاغات skill.

معاملات الاستعلام:

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

نقطة نهاية مشرف/مسؤول لحل بلاغات skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويجوز حذفه عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع بلاغ
مفروز لإخفاء skill ضمن سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يرجع بيانات وصفية للإصدار + قائمة الملفات.

- يتضمن `version.security` حالة تحقق الفحص الموحّدة وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يرجع تفاصيل تحقق فحص الأمان لإصدار skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يُقدَّم أي من `version` أو `tag`، فسيستخدم أحدث إصدار.
- يتضمن حالة تحقق مُطبَّعة بالإضافة إلى تفاصيل خاصة بالماسح.
- تكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حُكمًا قاطعًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى المهارة مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` على أنهما ضمن سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة نهاية إرسال موثقة لمهام ClawScan الجديدة.

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

- تنتهي صلاحية حمولات طلبات الفحص والتقارير القابلة للتنزيل من مخزن طلبات الفحص بعد فترة الاحتفاظ.
- تتطلب الفحوصات المنشورة وصول إدارة المالك/الناشر، أو صلاحية مشرف/مدير المنصة.
- لا تكتب الفحوصات المنشورة النتائج عكسيًا إلا عندما تكون `update: true` ويكتمل الفحص بنجاح.
- تكون الاستجابة `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تُعطى طلبات الفحص اليدوية أولوية قبل أعمال النشر/الملء الخلفي العادية، لكن الاكتمال لا يزال يعتمد على توفر العاملين.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة نهاية استقصاء موثقة لفحص مُرسَل.

- تُرجع حالة في قائمة الانتظار/قيد التشغيل/ناجح/فاشل.
- تُرجع `queue.queuedAhead` و`queue.position` أثناء وجود الطلب في قائمة الانتظار حتى تتمكن العملاء من عرض عدد الفحوصات اليدوية ذات الأولوية السابقة للطلب. تُقيَّد قوائم الانتظار الكبيرة جدًا ويُبلَّغ عنها مع `queuedAheadIsEstimate: true`.
- عند توفره، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- تُرجع مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة نهاية موثقة لأرشيف التقرير.

- تتطلب فحصًا ناجحًا؛ الفحوصات غير النهائية تُرجع `409`.
- تُرجع ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة نهاية موثقة لأرشيف تقرير مخزن للإصدارات المُرسَلة.

- تتطلب وصول إدارة المالك/الناشر إلى المهارة أو Plugin، أو صلاحية مشرف/مدير المنصة.
- تُرجع نتائج الفحص المخزنة للإصدار المُرسَل المحدد، بما في ذلك الإصدارات المحظورة أو المخفية.
- القيمة الافتراضية لـ `kind` هي `skill`؛ استخدم `kind=plugin` لفحوصات Plugin/الحزمة.
- تُرجع شكل ZIP نفسه مثل تنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة فحص دفعي قياسي مخصص للمديرين فقط. يقبل شكل الحمولة نفسه مثل `POST /api/v1/skills/-/rescan-batch` القديم.

### `POST /api/v1/skills/-/scan/batch/status`

مسار حالة دفعة قياسي مخصص للمديرين فقط. يقبل `{ "jobIds": ["..."] }` ويُرجع العدادات الإجمالية نفسها مثل `POST /api/v1/skills/-/rescan-batch/status` القديم.

### `GET /api/v1/skills/{slug}/verify`

يُرجع غلاف تحقق Skill Card المستخدم بواسطة `clawhub skill verify`.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- تكون `ok` بقيمة `true` فقط عندما يحتوي الإصدار المحدد على Skill Card مُولَّدة، ولا يكون محظورًا كبرمجية خبيثة بواسطة الإشراف، ويكون تحقق ClawScan نظيفًا.
- هوية المهارة، وهوية الناشر، وبيانات الإصدار المحدد الوصفية هي حقول غلاف على المستوى الأعلى (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) حتى تتمكن أتمتة الصدفة من قراءتها دون فك أغلفة متداخلة.
- `security` هو حُكم ClawScan/الأمان على المستوى الأعلى. ينبغي للأتمتة الاعتماد على `ok` و`decision` و`reasons` و`security.status`.
- يحتوي `security.signals` على أدلة ماسح داعمة مثل `staticScan` و`virusTotal` و`skillSpector`.
- يُحتفَظ بـ `security.signals.dependencyRegistry` لتوافق استجابة v1، لكن ماسح وجود سجل التبعيات متقاعد وهذا المفتاح دائمًا `null`.
- تكون `provenance` بقيمة `server-resolved-github-import` فقط عندما يحل ClawHub ويخزن مستودع/مرجع/التزام/مسار GitHub أثناء النشر أو الاستيراد؛ وإلا فهي `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يُرجع أحكام الأمان المدمجة الحالية لإصدارات مهارات محددة. نقطة نهاية
المجموعة هذه مخصصة للعملاء الذين يعرفون بالفعل إصدارات مهارات ClawHub المثبتة
التي يحتاجون إلى عرضها، مثل OpenClaw Control UI.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن يحتوي `items` على 1-100 زوج فريد من `{ slug, version }`.
- النتائج لكل عنصر؛ لا يؤدي فقدان مهارة واحدة أو إصدار واحد إلى فشل الاستجابة كلها.
- الاستجابة خاصة بالأمان فقط. لا تتضمن بيانات Skill Card، أو حالة البطاقة المولدة، أو قوائم ملفات الأثر، أو حمولات الماسحات التفصيلية.
- يحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق الأمان في ClawHub للحصول على تفاصيل الماسحات الكاملة.
- يُحتفَظ بـ `security.signals.dependencyRegistry` لتوافق استجابة v1، لكن ماسح وجود سجل التبعيات متقاعد وهذا المفتاح دائمًا `null`.
- لا يؤثر غياب Skill Card في `ok` أو `decision` أو `reasons` لنقطة النهاية هذه؛ ينبغي للعملاء قراءة `skill-card.md` المثبت محليًا عندما يحتاجون إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى غلاف تحقق Skill Card لمهارة واحدة، و`/card` عندما تحتاج إلى Markdown البطاقة المولدة، و`/scan` عندما تحتاج إلى بيانات ماسح تفصيلية.

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

معاملات الاستعلام:

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
- Plugins الحزم

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `updated` (الافتراضي)، `recommended`، `trending`، `downloads`، الاسم المستعار القديم `installs`
- `category` (اختياري): مرشح فئة Plugin. مدعوم فقط عندما يكون
  الطلب مقيدًا بحزم Plugin (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، أو نقاط نهاية الحزم مع
  `family=code-plugin`/`family=bundle-plugin`). الفئات المضبوطة
  والأسماء المستعارة القديمة لمرشحات v1 موثقة تحت `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` أو `sort` تعيد `400`. يتم تجاهل معاملات الاستعلام غير المعروفة.
- يبقى `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` كاسمين مستعارين ثابتين للعائلة.
- تبقى إدخالات Skills مدعومة بسجل Skills ولا يزال نشرها ممكنًا فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصًا فقط لإصدارات code-plugin و bundle-plugin.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- يعيد `channel=private` فقط الحزم التي يمكن للمستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحد في الفهرس عبر Skills + حزم Plugin.

معاملات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. مدعوم فقط عندما يكون
  الطلب مقيدًا بحزم Plugin. الفئات المضبوطة والأسماء المستعارة القديمة
  لمرشحات v1 موثقة تحت `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` تعيد `400`. يتم تجاهل معاملات الاستعلام غير المعروفة.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- يعيد `channel=private` فقط الحزم التي يمكن للمستدعي المصادق عليه قراءتها.

### `GET /api/v1/plugins`

تصفح فهرس Plugin فقط عبر حزم code-plugin و bundle-plugin.

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (الافتراضي)، `trending`، `downloads`، `updated`، الاسم المستعار القديم `installs`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

تظل الأسماء المستعارة القديمة لمرشحات v1 مقبولة على نقاط نهاية القراءة:

- يتم حل `mcp-tooling` و `data` و `automation` إلى `tools`.
- يتم حل `observability` و `deployment` إلى `gateway`.
- يتم حل `dev-tools` إلى `runtime`.

`trending` هو ترتيب تثبيت/تنزيل لسبعة أيام ولا يستخدم الإجماليات لكل الأوقات.
في نقطة النهاية الموحدة `/api/v1/packages` يكون خاصًا بـ Plugin فقط؛ استخدم
`/api/v1/skills?sort=trending` لفهرس Skills.

لا تُقبل الأسماء المستعارة القديمة كقيم فئات مخزنة أو معلنة من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث Skills العامة للتحليل دون اتصال.

المصادقة:

- رمز API مميز مطلوب.

معاملات الاستعلام:

- `startDate` (مطلوب): حد أدنى بميلي ثانية Unix لـ `updatedAt` الخاصة بـ Skills.
- `endDate` (مطلوب): حد أعلى بميلي ثانية Unix لـ `updatedAt` الخاصة بـ Skills.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- الجسم: أرشيف ZIP.
- كل Skill مصدّرة تكون مجذرة عند `{publisher}/{slug}/`.
- تتضمن Skills المستضافة أحدث ملفات الإصدار المخزن وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن Skills الحالية المدعومة من GitHub التي لديها فحص `clean` أو `suspicious`
  `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، وعنوان URL للأرشيف. ولا تتضمن ملفات المصدر المستضافة على ClawHub.
- تتضمن كل Skill ملف `_export_skill_meta.json`.
- يتم تضمين `_manifest.json` دائمًا في جذر ملف ZIP.
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

- `startDate` (مطلوب): الحد الأدنى بميلي ثانية Unix لقيمة `updatedAt` الخاصة بـ Plugin.
- `endDate` (مطلوب): الحد الأعلى بميلي ثانية Unix لقيمة `updatedAt` الخاصة بـ Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني حذفه كلتا
  عائلتي Plugin.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل Plugin مُصدَّر عند `{family}/{packageName}/`.
- يتضمن كل Plugin مُصدَّر الملفات المخزنة لأحدث إصدار.
- تُخزَّن بيانات تعريف التصدير لكل Plugin في
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- يُضمَّن `_manifest.json` دائمًا في جذر ZIP.
- يُضمَّن `_errors.json` عندما يتعذر تصدير Plugins أو ملفات منفردة.

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
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

ملاحظات:

- تُقبل أيضًا الأسماء البديلة القديمة لمرشحات v1 الموثقة ضمن `GET /api/v1/plugins`.
- ترشيح الفئة هو مرشح API حقيقي مدعوم بصفوف ملخص فئات Plugin،
  وليس إعادة كتابة لاستعلام البحث.
- تُعاد النتائج بترتيب الصلة ولا تدعم حاليًا التقسيم إلى صفحات.
- عناصر التحكم في الفرز في واجهة المتصفح لبحث Plugin تعيد ترتيب نتائج الصلة المحملة،
  بما يطابق سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن أيضًا حل Skills عبر هذا المسار في الكتالوج الموحّد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف الحزمة وجميع الإصدارات حذفًا مرنًا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر المؤسسة،
  أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدارًا واحدًا من الحزمة، بما يشمل بيانات تعريف الملفات والتوافق
والتحقق وبيانات تعريف الأثر وبيانات الفحص.

ملاحظات:

- تكون `version.artifact.kind` بقيمة `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة بـ ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- `version.sha256hash` هي بيانات تعريف توافق مهملة للعملاء القدامى. وهي
  تجزئ بايتات ZIP الدقيقة التي يعيدها `/api/v1/packages/{name}/download`.
  ينبغي للعملاء الحديثين استخدام `version.artifact.sha256`، الذي يعرّف
  أثر الإصدار المعياري.
- تُضمَّن `version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan`
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

- تحدد `package.name` و`package.displayName` و`package.family` حزمة السجل
  المحلولة.
- تحدد `release.releaseId` و`release.version` و`release.createdAt` الإصدار
  الدقيق الذي جرى تقييمه.
- تكون `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity`
  و`release.npmShasum` و`release.npmTarballName` موجودة عندما تكون معروفة
  لأثر الإصدار.
- `trust.scanStatus` هي حالة الثقة الفعلية المشتقة من مدخلات الماسح
  ومراجعة الإصدار اليدوية.
- `trust.moderationState` قابلة لأن تكون فارغة. تكون `null` عندما لا توجد
  مراجعة يدوية للإصدار.
- `trust.blockedFromDownload` هي إشارة حظر التثبيت. ينبغي لـ OpenClaw وعملاء
  التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلًا من
  إعادة اشتقاق قواعد الحظر من حقول الماسح أو المراجعة.
- `trust.reasons` هي قائمة الشرح الموجهة للمستخدم والتدقيق. رموز الأسباب
  سلاسل مستقرة وموجزة مثل `manual:quarantined` و`scan:malicious`
  و`package:malicious`.
- تعني `trust.pending` أن واحدًا أو أكثر من مدخلات الثقة لا يزال ينتظر الاكتمال.
- تعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة وينبغي التعامل معه
  على أنه يتطلب تحديثًا قبل قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة بحسب الإصدار. ينبغي للعملاء استدعاؤها بعد حل إصدار
  الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف للحزمة.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدًا من نقاط نهاية مراجعة المالك/المشرف. فهي تكشف
  قرار التثبيت والشرح العام، لا هويات المبلغين أو نصوص البلاغات أو الأدلة
  الخاصة أو الجداول الزمنية الداخلية للمراجعة.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل الأثر الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثر `legacy-zip` و`downloadUrl` قديمًا بصيغة ZIP.
- تعيد إصدارات ClawPack أثر `npm-pack`، وحقول سلامة npm، و`tarballUrl`،
  ورابط توافق ZIP القديم.
- هذا هو سطح المحلل في OpenClaw؛ ويتجنب تخمين صيغة الأرشيف من
  عنوان URL مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة بصيغة npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تغطي فحوص الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر ClawPack بصيغة npm-pack
- ملخص الأثر
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

نقطة نهاية للمشرفين لسرد صفوف ترحيل Plugins OpenClaw الرسمية.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned`، `published`، `clawpack-ready`،
  `legacy-zip-only`، `metadata-ready`، `blocked`، `ready-for-openclaw`، أو
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

نقطة نهاية للمسؤولين لإنشاء أو تحديث صف ترحيل Plugin رسمي.

المصادقة:

- تتطلب رمز API لمستخدم مسؤول.

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

- يُطبَّع `bundledPluginId` إلى أحرف صغيرة وهو مفتاح upsert المستقر.
- يُطبَّع `packageName` كاسم npm؛ ويمكن أن تكون الحزمة مفقودة للترحيلات
  المخططة.
- يتتبع هذا جاهزية الترحيل فقط. لا يغيّر OpenClaw ولا ينشئ ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لقوائم انتظار مراجعة إصدارات الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، `blocked`، `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات

معاني الحالات:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مُبلّغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
- `manual`: أي إصدار مع تجاوز مراجعة يدوي.
- `all`: أي إصدار مع تجاوز يدوي أو حالة فحص غير نظيفة أو بلاغ حزمة.

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

أبلِغ عن حزمة لمراجعة المشرفين. البلاغات على مستوى الحزمة، ويمكن ربطها
اختياريًا بإصدار. وهي تغذي قائمة انتظار المراجعة لكنها لا تخفي أو تحظر
التنزيلات تلقائيًا بمفردها؛ ينبغي للمشرفين استخدام مراجعة الإصدار
لاعتماد الآثار أو عزلها أو إلغائها.

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

نقطة نهاية للمشرف/المدير لاستقبال بلاغات الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مدير.

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

نقطة نهاية للمالك/المشرف لإظهار حالة إشراف الحزمة.

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

نقطة نهاية للمشرف/المدير لحل بلاغات الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` مطلوبة عند `confirmed` و`dismissed`؛ ويمكن حذفها عند
إرجاع `status` إلى `open`. مرر `finalAction: "quarantine"` أو
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

- `approved`: تمت مراجعته يدويا والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقا سابقا.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل الأثر.
يكتب كل تغيير إدخالا في سجل التدقيق.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصيا خاما لملف حزمة.

معاملات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يكون الافتراضي هو أحدث إصدار.
- يستخدم حاوية معدل القراءة، وليس حاوية التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200KB.
- لا تمنع فحوصات VirusTotal المعلقة عمليات القراءة؛ قد تظل الإصدارات الخبيثة محجوبة في أماكن أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معاملات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يكون الافتراضي هو أحدث إصدار.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip لها جذر `package/` حتى يظل عملاء OpenClaw
  القدامى يعملون.
- يبقى هذا المسار مخصصا لـ ZIP فقط. لا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag`، و`Digest`، و`X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة المحلل.
- لا تُحقن بيانات السجل الوصفية فقط في الأرشيف المنزل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقا مع npm لإصدارات الحزم المدعومة بـ ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي رُفعت لها كرات tarball من نوع ClawPack npm-pack.
- تُحذف عمدا الإصدارات القديمة المقتصرة على ZIP.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولا متوافقة مع npm
  حتى يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments للحزم ذات النطاق كلا من مسار الطلب `/api/npm/@scope/name` ومسار
  npm المرمز `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات كرة tarball المرفوعة نفسها من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 من ClawHub إضافة إلى بيانات سلامة/مجموع shasum الوصفية الخاصة بـ npm.
- ما زالت فحوصات الإشراف والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

تستخدمه CLI لمطابقة بصمة محلية مع إصدار معروف.

معاملات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي عشري بطول 64 حرفا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزل ملف ZIP لإصدار skill مستضاف، أو يعيد تسليما إلى مصدر GitHub
لـ skill حالي مدعوم بـ GitHub وله فحص `clean` أو `suspicious` ولا توجد له
نسخة مستضافة.

معاملات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يُقدم `version` ولا `tag`، فسيُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفا مرنا `410`.
- لا تمرر تسليمات skill المدعومة بـ GitHub البايتات عبر وكيل ولا تنشئ لها مرآة. تتضمن استجابة JSON
  `sourceRef: "public-github"`، و`repo`، و`commit`، و`path`، و`contentHash`،
  و`archiveUrl`؛ حالة الفحص/الحالة الحالية بوابة ولا تُدرج كبيانات وصفية لحمولة نجاح.
- تُحسب إحصاءات التنزيل كهويات فريدة لكل يوم UTC (`userId` عندما يكون رمز API صالحا، وإلا IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب جميع نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصدارا جديدا.

- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات `files[]` الثنائية.
- يُقبل أيضا جسم JSON مع `files` (معتمدة على storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، يحل API ذلك
  الناشر من جهة الخادم ويتطلب أن يكون لدى الفاعل وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عند `true` مع `ownerHandle`، يمكن أن تنتقل
  skill موجودة إلى ذلك المالك إذا كان الفاعل مديرا/مالكا في كل من
  الناشرين الحالي والهدف. من دون هذا الاشتراك الصريح، تُرفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموح بها هي `payload`، أو كائنات `files` الثنائية المكررة، أو مرجع كرة tarball واحد باسم `clawpack`.
  يمكن أن يكون `clawpack` كائنا ثنائيا `.tgz` أو معرف تخزين أعاده
  مسار upload-url. يجب أن تتضمن عمليات النشر المرحلية بمعرف التخزين أيضا
  `clawpackUploadTicket` المعاد مع عنوان URL الخاص بذلك الرفع.
- استخدم إما `files` أو `clawpack`، ولا تستخدمهما معا في الطلب نفسه.
- تُرفض أجسام JSON وبيانات `payload.files` / `payload.artifact`
  الوصفية المقدمة من المستدعي.
- تحد طلبات النشر المباشرة بصيغة multipart عند 18MB. يمكن لكرات tarball من ClawPack
  استخدام تدفق upload-url حتى حد كرة tarball البالغ 120MB.
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، لا يجوز النشر نيابة عن ذلك المالك إلا للمديرين.

أبرز نقاط التحقق:

- يجب أن يكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin ملف `openclaw.plugin.json`. يجب أن تحتوي رفعات `.tgz` من ClawPack
  عليه في `package/openclaw.plugin.json`.
- تتطلب code plugins ملف `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية لالتزام المصدر،
  وبيانات وصفية لمخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- تعد `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يجوز النشر إلى قناة `official` إلا لناشر مؤسسة `openclaw` وأعضاء مؤسسة `openclaw` الحاليين
  عبر ناشريهم الشخصيين.
- لا تزال عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف مرن / استعادة skill (المالك، أو المشرف، أو المدير).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزن كملاحظة إشراف skill ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف المرن التي يبدأها المالك slug لمدة 30 يوما، ثم يمكن لناشر
آخر المطالبة بذلك slug. تتضمن استجابة الحذف `slugReservedUntil` عند انطباق هذا الانتهاء.
لا تنتهي إخفاءات المشرف/المدير والإزالات الأمنية بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسن
- `401`: غير مصرح
- `403`: محظور
- `404`: لم يُعثر على skill/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمديرين فقط. يضمن وجود ناشر مؤسسة لمعرّف. إذا كان المعرّف لا يزال يشير إلى
مستخدم مشترك قديم/ناشر شخصي، فتنقله نقطة النهاية أولا إلى ناشر مؤسسة.
بالنسبة إلى مؤسسة منشأة حديثا، قدم `memberHandle`؛ لا يُضاف المدير الفاعل كعضو.
تكون القيمة الافتراضية لـ `memberRole` هي `owner`.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ذاتي لناشر مؤسسة مع مصادقة. ينشئ ناشر مؤسسة جديدا ويضيف
المستدعي كمالك. لا تنقل نقطة النهاية هذه المعرّفات الموجودة للمستخدمين/الشخصيين ولا
تعلّم الناشر كموثوق/رسمي.

- الجسم: `{ "handle": "opik", "displayName": "Opik" }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- تعيد `409` عندما يكون المعرّف مستخدما بالفعل بواسطة ناشر، أو مستخدم، أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمديرين فقط. يحجز slugs الجذرية وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزما نائبة خاصة بلا صفوف إصدار، حتى يتمكن المالك نفسه
لاحقا من نشر إصدار code-plugin أو bundle-plugin الحقيقي تحت ذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمديرين فقط. يستعيد ناشرا شخصيا لهوية GitHub OAuth بديلة ومتحقق منها
من دون تعديل صفوف حساب Convex Auth. يجب أن يسمي الطلب كلا معرّفي حساب
موفر GitHub الثابتين؛ تُستخدم المعرّفات القابلة للتغيير فقط كحارس موجه للمشغل.

تكون نقطة النهاية افتراضياً في وضع التشغيل الجاف. يتطلب تطبيق الاسترداد `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق الموظفون بشكل مستقل من الاستمرارية بين كلا
المعرّفين الرئيسيين في GitHub. يفشل الاسترداد بشكل مغلق عندما يكون لدى الناشر الشخصي الحالي للمستخدم الوجهة
Skills أو حزم أو مصادر Skills على GitHub.
ينقل الاسترداد أيضاً حقول `ownerUserId` القديمة لـ Skills الناشر المسترد،
وأسماء slug المستعارة للـ Skills، والحزم، وتحذيرات فاحص الحزم، وصفوف ملخص البحث المشتقة بحيث
تتوافق مسارات المالك المباشر مع سلطة الناشر الجديدة. كما يُعاد تعيين حجز protected-handle
نشط للمقبض المسترد إلى المستخدم البديل حتى لا تتمكن مزامنة الملف الشخصي لاحقاً
من استعادة السلطة المنافسة للمستخدم السابق. يقتصر كل جدول أساسي على
100 صف لكل معاملة تطبيق؛ يجب أن تستخدم عمليات الاسترداد الأكبر أولاً ترحيل مالك قابل للاستئناف.
مصادر Skills على GitHub ذات نطاق ناشر ويتم الإبلاغ عنها كمفحوصة بدلاً من إعادة كتابتها.

- الجسم: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- الاستجابة: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط نهاية إدارة slug المالك

- `POST /api/v1/skills/{slug}/rename`
  - الجسم: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - الجسم: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة رمز API وتعملان فقط لمالك الـ Skill.
- يحافظ `rename` على الـ slug السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` قائمة المصدر ويعيد توجيه slug المصدر إلى قائمة الهدف.

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

حظر مستخدم وحذف Skills المملوكة نهائياً (للمشرف/المدير فقط).

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

إلغاء حظر مستخدم واستعادة Skills المؤهلة (للمدير فقط).

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

### `POST /api/v1/users/reclassify-ban`

تغيير السبب المخزن لحظر موجود دون إلغاء الحظر أو استعادة
المحتوى (للمدير فقط). يكون افتراضياً في وضع التشغيل الجاف ما لم تكن `dryRun` هي `false`.

الجسم:

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

سرد المستخدمين أو البحث عنهم (للمدير فقط).

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

إضافة/إزالة نجمة (تمييزات). كلتا نقطتي النهاية idempotent.

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

راجع `DEPRECATIONS.md` للاطلاع على خطة الإزالة.

تعيد `POST /api/cli/upload-url` القيمتين `uploadUrl` و `uploadTicket`. يجب على عمليات نشر الحزم
التي تجهز أرشيف ClawPack tarball أن ترسل معرّف التخزين الناتج باسم
`clawpack` والتذكرة المعادة باسم `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضّل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتياً، فقدم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ `CLAWDHUB_REGISTRY` القديم).
