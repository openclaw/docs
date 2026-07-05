---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح طلبات CLI ↔ السجل
summary: مرجع واجهة برمجة تطبيقات HTTP (العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-07-05T06:24:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP API

عنوان URL الأساسي: `https://clawhub.ai` (افتراضي).

تقع كل مسارات v1 ضمن `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الفهرس العام

يجوز للأدلة التابعة لجهات خارجية استخدام نقاط النهاية العامة للقراءة لسرد مهارات ClawHub أو البحث فيها. يرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وإعادة ربط المستخدمين بقائمة ClawHub الأساسية (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد موقع الجهة الخارجية. لا تحاول نسخ المحتوى المخفي أو الخاص أو المحظور إشرافيًا خارج سطح API العام.

تُحل اختصارات slug على الويب عبر عائلات السجل، لكن ينبغي لعملاء API استخدام
عناوين URL الأساسية التي تعيدها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُفرض لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى الإنفاذ حسب IP.
- ينبغي ألا تعيد نقاط نهاية الكتابة المصادق عليها مجرد `Unauthorized` عندما
  يعرف الخادم السبب. ينبغي أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة،
  والحسابات المحذوفة/المحظورة/المعطلة كل منها على نص قابل للتنفيذ حتى يتمكن عملاء CLI
  من إخبار المستخدمين بما حظرهم.

- القراءة: 3000/دقيقة لكل IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل IP، و6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الرؤوس:

- توافق قديم: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- موحد: `RateLimit-Limit`، `RateLimit-Reset`
- عند `429`: `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix مطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند وجودها.
  تحذف الطلبات الناجحة المجزأة هذا الرأس بدلًا من إرجاع قيمة عالمية تقريبية.
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

- إذا كان `Retry-After` موجودًا، فانتظر ذلك العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعًا مع عشوائية لتجنب عمليات إعادة المحاولة المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم رؤوس IP العميل الموثوقة، بما في ذلك `cf-connecting-ip`، فقط عندما
  يفعّل النشر صراحةً الرؤوس الممررة الموثوقة.
- يستخدم ClawHub رؤوس التمرير الموثوقة لتحديد عناوين IP العملاء عند الحافة.
- إذا لم يتوفر IP عميل موثوق، تستخدم الطلبات المجهولة حاويات احتياطية
  مقيدة فقط بنوع حد المعدل. لا تتضمن هذه الحاويات الاحتياطية
  المسارات أو slugs أو أسماء الحزم أو الإصدارات أو سلاسل الاستعلام أو غيرها من
  معاملات القطع الأثرية التي يوفرها المستدعي.

## استجابات الأخطاء

استجابات أخطاء v1 العامة هي نص عادي مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك فشل التحقق (`400`)، والموارد العامة المفقودة (`404`)، وفشل المصادقة
والأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. ينبغي للعملاء
قراءة جسم الاستجابة كسلسلة قابلة للقراءة من البشر. تُتجاهل معاملات الاستعلام غير المعروفة
لأغراض التوافق، لكن معاملات الاستعلام المعروفة ذات القيم غير الصالحة تعيد
`400`.

## نقاط النهاية العامة (بدون مصادقة)

### `GET /api/v1/search`

معاملات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح
- `highlightedOnly` (اختياري): `true` للتصفية إلى المهارات المميزة
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء المهارات المشبوهة (`flagged.suspicious`)
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

- تُعاد النتائج بترتيب الصلة (تشابه التضمين + تعزيزات مطابقة رمز slug/الاسم الدقيقة + أولوية شعبية صغيرة).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتفوق على مطابقة أوسع ذات تفاعل أقوى بكثير.
- يُجزأ نص ASCII عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز `map` مستقل، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يمنح البحث عن `map` مطابقة معجمية أقوى لـ `personal-map` مقارنةً بـ `amap-jsapi-skill`.
- تُقاس الشعبية بمقياس لوغاريتمي وتُحد بسقف. قد تحصل المهارات عالية التفاعل على ترتيب أدنى عندما يكون نص الاستعلام أضعف مطابقة.
- يمكن لحالة الإشراف المشبوهة أو المخفية إزالة مهارة من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية ثابتة تريد الاحتفاظ بها.
- لا تغيّر اسم slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا أساسيًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الأساسي وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على الحل لعناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يعتمد على بيانات تعريف المهارة الأساسية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع المهارة.
- إذا كانت مهارة غير مرئية على نحو غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول قبل تغيير البيانات التعريفية المتعلقة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي ترتيب غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `recommended` (اسم مستعار: `default`)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، أسماء مستعارة قديمة للتثبيت `installsCurrent`/`installs`/`installsAllTime` تُطابق إلى `downloads`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء المهارات المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

تعيد قيم `sort` غير الصالحة `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتب `trending` حسب عمليات التثبيت في آخر 7 أيام (استنادًا إلى القياسات).
- `createdAt` ثابت لعمليات زحف المهارات الجديدة؛ يتغير `updated` عندما تُعاد نشر المهارات الحالية.
- عندما يكون `nonSuspiciousOnly=true`، قد تعيد الترتيبات المستندة إلى المؤشر عدد عناصر أقل من `limit` في الصفحة لأن المهارات المشبوهة تُرشح بعد استرداد الصفحة.
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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى المهارة الأساسية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter المهارة (مثل `["macos"]`، `["linux"]`). `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). `null` إذا لم تُعلن.
- تكون `metadata` هي `null` إذا لم تكن للمهارة بيانات تعريف منصة.
- تُضمّن `moderation` فقط عندما تكون المهارة موسومة أو عندما يعرضها المالك.

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

- يمكن للمالكين والمشرفين الوصول إلى تفاصيل الإشراف للمهارات المخفية.
- لا يحصل المستدعون العامون على `200` إلا للمهارات المرئية الموسومة مسبقًا.
- تُنقح الأدلة للمستدعين العامين ولا تتضمن المقاطع الخام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن مهارة لمراجعة المشرف. التقارير على مستوى المهارة، وترتبط اختياريًا
بإصدار، وتغذي طابور تقارير المهارات.

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

نقطة نهاية للمشرف/المدير لاستقبال تقارير المهارات.

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

نقطة نهاية للمشرف/المدير لحل تقارير المهارات أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع تقرير
مفرز لإخفاء المهارة في سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد بيانات تعريف الإصدار + قائمة الملفات.

- يتضمن `version.security` حالة تحقق الفحص الموحدة وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل التحقق من الفحص الأمني لإصدار مهارة.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يتم توفير `version` ولا `tag`، فسيستخدم أحدث إصدار.
- يتضمن حالة تحقق مُطبَّعة بالإضافة إلى تفاصيل خاصة بالماسح.
- تكون `security.hasScanResult` بالقيمة `true` فقط عندما يُنتج ماسح حكمًا نهائيًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى المهارة مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` باعتبارهما ضمن سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة نهاية إرسال موثّقة لمهام ClawScan الجديدة.

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
- لا تكتب الفحوصات المنشورة النتائج مرة أخرى إلا عندما تكون `update: true` ويكتمل الفحص بنجاح.
- تكون الاستجابة `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تُمنح طلبات الفحص اليدوية أولوية قبل أعمال النشر/الملء الخلفي العادية، لكن الإكمال يظل معتمدًا على توفر العمال.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة نهاية استطلاع موثّقة لفحص مُرسَل.

- تُرجع حالة في الانتظار/قيد التشغيل/نجح/فشل.
- تُرجع `queue.queuedAhead` و`queue.position` أثناء الانتظار حتى يتمكن العملاء من إظهار عدد الفحوصات اليدوية ذات الأولوية التي تسبق الطلب. تُقيَّد قوائم الانتظار الكبيرة جدًا ويُبلَّغ عنها مع `queuedAheadIsEstimate: true`.
- عند التوفر، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- تُرجع مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة نهاية أرشيف تقرير موثّقة.

- تتطلب فحصًا ناجحًا؛ الفحوصات غير النهائية تُرجع `409`.
- تُرجع ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة نهاية أرشيف تقرير مخزّن موثّقة للإصدارات المُرسَلة.

- تتطلب وصول إدارة المالك/الناشر إلى المهارة أو Plugin، أو صلاحية مشرف/مسؤول المنصة.
- تُرجع نتائج الفحص المخزنة للإصدار المُرسَل المحدد، بما في ذلك الإصدارات المحظورة أو المخفية.
- القيمة الافتراضية لـ `kind` هي `skill`؛ استخدم `kind=plugin` لفحوصات Plugin/الحزمة.
- تُرجع بنية ZIP نفسها مثل تنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة فحص دفعي أساسي للمسؤولين فقط. يقبل بنية الحمولة نفسها مثل المسار القديم `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

مسار حالة دفعي أساسي للمسؤولين فقط. يقبل `{ "jobIds": ["..."] }` ويُرجع عدادات التجميع نفسها مثل المسار القديم `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

يُرجع مظروف تحقق بطاقة Skill المستخدم بواسطة `clawhub skill verify`.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (مثل `latest`).

ملاحظات:

- تكون `ok` بالقيمة `true` فقط عندما يكون للإصدار المحدد بطاقة Skill مولّدة، وغير محظور كبرمجية خبيثة بواسطة الإشراف، ويكون تحقق ClawScan نظيفًا.
- هوية المهارة، وهوية الناشر، وبيانات وصف الإصدار المحدد هي حقول مظروف علوية (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) حتى تتمكن أتمتة الصدفة من قراءتها دون فك أغلفة متداخلة.
- `security` هو حكم ClawScan/الأمان العلوي. ينبغي أن تعتمد الأتمتة على `ok` و`decision` و`reasons` و`security.status`.
- يحتوي `security.signals` على أدلة داعمة من الماسحات مثل `staticScan` و`virusTotal` و`skillSpector`.
- يُحتفظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن ماسح وجود سجل التبعيات متقاعد وهذا المفتاح دائمًا `null`.
- تكون `provenance` بالقيمة `server-resolved-github-import` فقط عندما يحل ClawHub مستودع GitHub/المرجع/الالتزام/المسار ويخزنه أثناء النشر أو الاستيراد؛ وإلا فهي `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يُرجع أحكام الأمان المختصرة الحالية لإصدارات مهارات محددة. نقطة نهاية
المجموعة هذه مخصصة للعملاء الذين يعرفون مسبقًا أي إصدارات مهارات
ClawHub المثبّتة يحتاجون إلى عرضها، مثل OpenClaw Control UI.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن يحتوي `items` على 1-100 زوج فريد من `{ slug, version }`.
- النتائج لكل عنصر؛ لا يؤدي فقدان مهارة أو إصدار واحد إلى فشل الاستجابة بأكملها.
- الاستجابة خاصة بالأمان فقط. لا تتضمن بيانات بطاقة Skill، أو حالة البطاقة المولّدة، أو قوائم ملفات الأثر، أو حمولات الماسحات التفصيلية.
- يحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق الأمان في ClawHub للحصول على تفاصيل الماسحات الكاملة.
- يُحتفظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن ماسح وجود سجل التبعيات متقاعد وهذا المفتاح دائمًا `null`.
- لا يؤثر غياب بطاقة Skill في `ok` أو `decision` أو `reasons` لهذه النقطة النهائية؛ ينبغي للعملاء قراءة `skill-card.md` المثبّت محليًا عندما يحتاجون إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى مظروف تحقق بطاقة Skill لمهارة واحدة، و`/card` عندما تحتاج إلى Markdown للبطاقة المولّدة، و`/scan` عندما تحتاج إلى بيانات ماسحات تفصيلية.

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

نقطة نهاية كتالوج موحّدة لكل من:

- skills
- code plugins
- bundle plugins

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `updated` (الافتراضي)، `recommended`، `trending`، `downloads`، الاسم البديل القديم `installs`
- `category` (اختياري): عامل تصفية فئة Plugin. يُدعَم فقط عندما يكون
  الطلب محصورًا بحزم Plugin (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، أو نقاط نهاية الحزم مع
  `family=code-plugin`/`family=bundle-plugin`). الفئات المتحكَّم بها
  والأسماء البديلة القديمة لعوامل تصفية v1 موثّقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` أو `sort` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- يبقى `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين بديلين ثابتَي العائلة.
- تظل إدخالات Skills مدعومة بسجل Skills ولا يمكن نشرها إلا عبر `POST /api/v1/skills`.
- يظل `POST /api/v1/packages` مخصصًا فقط لإصدارات code-plugin وbundle-plugin.
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
- `category` (اختياري): عامل تصفية فئة Plugin. يُدعَم فقط عندما يكون
  الطلب محصورًا بحزم Plugin. الفئات المتحكَّم بها والأسماء البديلة القديمة
  لعوامل تصفية v1 موثّقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/plugins`

تصفح كتالوج خاص بـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (الافتراضي)، `trending`، `downloads`، `updated`، الاسم البديل القديم `installs`
- `category` (اختياري): عامل تصفية فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

تظل الأسماء البديلة القديمة لعوامل تصفية v1 مقبولة في نقاط نهاية القراءة:

- تتحول `mcp-tooling` و`data` و`automation` إلى `tools`.
- تتحول `observability` و`deployment` إلى `gateway`.
- يتحول `dev-tools` إلى `runtime`.

`trending` هي لوحة ترتيب للتثبيتات/التنزيلات خلال سبعة أيام ولا تستخدم الإجماليات التاريخية.
في نقطة النهاية الموحّدة `/api/v1/packages` تكون خاصة بـ Plugin فقط؛ استخدم
`/api/v1/skills?sort=trending` لكتالوج Skills.

لا تُقبَل الأسماء البديلة القديمة كقيم فئات مخزنة أو معلنة من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث Skills العامة من أجل التحليل دون اتصال.

المصادقة:

- مطلوب رمز API.

معلمات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بالمللي ثانية بتوقيت Unix للحقل `updatedAt` في Skill.
- `endDate` (مطلوب): الحد الأعلى بالمللي ثانية بتوقيت Unix للحقل `updatedAt` في Skill.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل Skill مُصدَّرة عند `{publisher}/{slug}/`.
- تتضمن Skills المستضافة أحدث ملفات الإصدار المخزّن وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن Skills الحالية المدعومة من GitHub التي لها فحص `clean` أو `suspicious`
  ملف `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، ورابط URL للأرشيف. ولا تتضمن ملفات المصدر المستضافة على ClawHub.
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

- رمز API مطلوب.

معلمات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بوحدة مللي ثانية Unix لحقل `updatedAt` في Plugin.
- `endDate` (مطلوب): الحد الأعلى بوحدة مللي ثانية Unix لحقل `updatedAt` في Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني الحذف كلتا
  عائلتي Plugin.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل Plugin مُصدَّر عند `{family}/{packageName}/`.
- يتضمن كل Plugin مُصدَّر الملفات المخزنة لأحدث إصدار.
- تُخزَّن بيانات التعريف الخاصة بتصدير كل Plugin عند
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- يُضمَّن `_manifest.json` دائمًا في جذر ZIP.
- يُضمَّن `_errors.json` عندما يتعذر تصدير Plugins أو ملفات فردية.

الترويسات:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

بحث مخصص لـ Plugin عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1-100)
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

ملاحظات:

- أسماء مرشحات v1 القديمة الموثقة ضمن `GET /api/v1/plugins` مقبولة أيضًا.
- ترشيح الفئة هو مرشح API حقيقي مدعوم بصفوف ملخص فئات Plugin،
  وليس إعادة كتابة لاستعلام البحث.
- تُعاد النتائج بترتيب الصلة ولا تدعم حاليًا التقسيم إلى صفحات.
- تعيد عناصر التحكم في فرز واجهة المتصفح لبحث Plugin ترتيب نتائج الصلة المحملة،
  بما يطابق سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن لـ Skills أيضًا الحل عبر هذا المسار في الفهرس الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وجميع إصداراتها حذفًا منطقيًا.

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

- يكون `version.artifact.kind` هو `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة بـ ClawPack.
- تتضمن إصدارات ClawPack الحقول المتوافقة مع npm: `npmIntegrity`، و`npmShasum`، و
  `npmTarballName`.
- `version.sha256hash` هي بيانات تعريف توافق مهملة للعملاء القدامى. وهي
  تُجزِّئ بايتات ZIP الدقيقة المعادة بواسطة `/api/v1/packages/{name}/download`.
  ينبغي للعملاء الحديثين استخدام `version.artifact.sha256`، الذي يحدد
  أثر الإصدار القانوني.
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

- يحدد `package.name` و`package.displayName` و`package.family`
  حزمة السجل المحلولة.
- يحدد `release.releaseId` و`release.version` و`release.createdAt`
  الإصدار الدقيق الذي جرى تقييمه.
- توجد `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity`
  و`release.npmShasum` و`release.npmTarballName` عندما تكون معروفة
  لأثر الإصدار.
- `trust.scanStatus` هي حالة الثقة الفعلية المشتقة من مدخلات الماسح
  والإشراف اليدوي على الإصدار.
- `trust.moderationState` قابل للقيمة null. تكون قيمته `null` عندما لا يوجد
  إشراف يدوي على الإصدار.
- `trust.blockedFromDownload` هي إشارة حظر التثبيت. ينبغي لـ OpenClaw وعملاء
  التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلًا من
  إعادة اشتقاق قواعد الحظر من حقول الماسح أو الإشراف.
- `trust.reasons` هي قائمة الشرح الموجهة للمستخدم والتدقيق. رموز الأسباب
  سلاسل مستقرة ومضغوطة مثل `manual:quarantined`، و`scan:malicious`،
  و`package:malicious`.
- يعني `trust.pending` أن واحدًا أو أكثر من مدخلات الثقة ما زال بانتظار الاكتمال.
- يعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة ويجب التعامل معه
  على أنه يتطلب تحديثًا قبل قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة حسب الإصدار. ينبغي للعملاء استدعاؤها بعد حل إصدار
  الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف للحزمة.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدًا من نقاط نهاية إشراف المالك/المشرف. فهي تعرض
  قرار التثبيت والشرح العام، لا هويات المبلّغين، أو نصوص البلاغات، أو الأدلة
  الخاصة، أو جداول المراجعة الداخلية.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل الأثر الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثر `legacy-zip` و`downloadUrl` قديمًا لـ ZIP.
- تعيد إصدارات ClawPack أثر `npm-pack`، وحقول تكامل npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح المحلل في OpenClaw؛ وهو يتجنب تخمين صيغة الأرشيف من
  عنوان URL مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة كـ npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تغطي فحوص الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر ClawPack من نوع npm-pack
- ملخص الأثر
- مصدر المستودع ومنشأ الالتزام
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

نقطة نهاية للمشرفين لسرد صفوف ترحيل Plugin الرسمي في OpenClaw.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned`، أو `published`، أو `clawpack-ready`،
  أو `legacy-zip-only`، أو `metadata-ready`، أو `blocked`، أو `ready-for-openclaw`، أو
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

- يجري تطبيع `bundledPluginId` إلى أحرف صغيرة وهو مفتاح upsert المستقر.
- يجري تطبيع `packageName` كاسم npm؛ ويمكن أن تكون الحزمة مفقودة للترحيلات
  المخططة.
- يتتبع هذا جاهزية الترحيل فقط. ولا يغيّر OpenClaw أو ينشئ
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لطوابير مراجعة إصدارات الحزم.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر التقسيم إلى صفحات

معاني الحالات:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مُبلّغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
- `manual`: أي إصدار مع تجاوز إشراف يدوي.
- `all`: أي إصدار مع تجاوز يدوي، أو حالة فحص غير نظيفة، أو بلاغ عن الحزمة.

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

الإبلاغ عن حزمة لمراجعة المشرف. البلاغات على مستوى الحزمة، ويمكن ربطها
اختياريًا بإصدار. وهي تغذي طابور الإشراف لكنها لا تخفي التنزيلات أو
تحظرها تلقائيًا بحد ذاتها؛ ينبغي للمشرفين استخدام إشراف الإصدار
لاعتماد الآثار أو عزلها أو إلغائها.

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

نقطة نهاية للمالك/المشرف لعرض حالة الإشراف على الحزمة.

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

`note` مطلوبة لـ `confirmed` و`dismissed`؛ ويمكن حذفها عند
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

- `approved`: تمت مراجعته يدويا والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقا سابقا.

تُرجع الإصدارات المعزولة والملغاة `403` من مسارات تنزيل الأثر.
يكتب كل تغيير إدخالا في سجل التدقيق.

### `GET /api/v1/packages/{name}/file`

يعيد محتوى نصيا خاما لملف حزمة.

معلمات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار بشكل افتراضي.
- يستخدم حاوية معدل القراءة، وليس حاوية التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200KB.
- لا تمنع فحوصات VirusTotal المعلقة القراءة؛ قد تبقى الإصدارات الخبيثة محجوبة في موضع آخر.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزّل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار بشكل افتراضي.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip بجذر `package/` كي يستمر عمل عملاء OpenClaw
  القدامى.
- يبقى هذا المسار خاصا بملفات ZIP فقط. لا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة محلل الحزم.
- لا تُحقن بيانات التعريف الخاصة بالسجل فقط في الأرشيف المنزّل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقا مع npm لإصدارات الحزم المدعومة بـ ClawPack.

ملاحظات:

- لا تُدرج إلا الإصدارات التي رُفعت لها كرات tarball من نوع ClawPack npm-pack.
- تُحذف الإصدارات القديمة الخاصة بملفات ZIP فقط عمدا.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولا متوافقة مع npm
  حتى يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلا من `/api/npm/@scope/name` ومسار طلب npm
  المرمّز `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات كرة tarball المرفوعة بدقة من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 الخاص بـ ClawHub إضافة إلى بيانات تعريف السلامة/shasum الخاصة بـ npm.
- لا تزال فحوصات الإشراف والوصول إلى الحزم الخاصة مطبقة.

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

ينزّل ZIP لإصدار skill مستضاف، أو يعيد تسليما لمصدر GitHub من أجل
skill حالية مدعومة من GitHub ولها فحص `clean` أو `suspicious` ولا يوجد لها
إصدار مستضاف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يُقدَّم `version` ولا `tag`، يُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفًا ناعمًا `410`.
- لا تقوم تسليمات skill المدعومة من GitHub بتمرير البايتات أو عكسها. تتضمن استجابة JSON
  `sourceRef: "public-github"` و`repo` و`commit` و`path` و`contentHash`
  و`archiveUrl`؛ وتكون حالة الفحص/الحالة الحالية بوابة ولا تُضمَّن كبيانات تعريف
  لحمولة النجاح.
- تُحتسب إحصاءات التنزيل كهويات فريدة لكل يوم UTC (`userId` عندما يكون رمز API صالحا، وإلا فعنوان IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد مقبض المستخدم.

### `POST /api/v1/skills`

ينشر إصدارا جديدا.

- المفضل: `multipart/form-data` مع JSON في `payload` + كتل `files[]`.
- يُقبل أيضا جسم JSON يحتوي على `files` (بناء على storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، تحل API ذلك
  الناشر على الخادم وتتطلب أن يكون للفاعل وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عندما تكون قيمته `true` مع `ownerHandle`، قد
  تنتقل skill موجودة إلى ذلك المالك إذا كان الفاعل مسؤولا/مالكا لدى كل من
  الناشر الحالي والناشر الهدف. ومن دون هذا الاشتراك الصريح، تُرفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموح بها هي `payload`، أو كتل `files` مكررة، أو مرجع كرة tarball واحد
  باسم `clawpack`. قد يكون `clawpack` كتلة `.tgz` أو معرّف تخزين أعاده
  تدفق upload-url. كما يجب أن تتضمن عمليات النشر المرحلية بمعرّف التخزين
  `clawpackUploadTicket` المعاد مع عنوان URL ذلك للرفع.
- استخدم إما `files` أو `clawpack`، ولا تستخدمهما معا في الطلب نفسه.
- تُرفض أجسام JSON وبيانات تعريف `payload.files` / `payload.artifact`
  التي يزوّدها المستدعي.
- تُحدد طلبات النشر المباشر متعددة الأجزاء بسقف 18MB. يمكن لكرات tarball الخاصة بـ ClawPack
  استخدام تدفق upload-url حتى سقف كرة tarball البالغ 120MB.
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، لا يجوز النشر نيابة عن ذلك المالك إلا للمسؤولين.

أبرز نقاط التحقق:

- يجب أن تكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي رفعات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب code plugins وجود `package.json`، وبيانات تعريف مستودع المصدر، وبيانات تعريف تثبيتة المصدر،
  وبيانات تعريف مخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- تعد `openclaw.hostTargets` و`openclaw.environment` بيانات تعريف اختيارية.
- لا يجوز النشر إلى قناة `official` إلا لناشر مؤسسة `openclaw` وأعضاء مؤسسة `openclaw` الحاليين
  من ناشريهم الشخصيين.
- لا تزال عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف ناعم / استعادة skill (المالك، أو المشرف، أو المسؤول).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، تُخزَّن كملاحظة إشراف على skill وتُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف الناعم التي يبدأها المالك الـ slug لمدة 30 يوما، ثم يمكن لناشر
آخر المطالبة بالـ slug. تتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانقضاء.
لا تنتهي إخفاءات المشرف/المسؤول وعمليات الإزالة الأمنية بهذه الطريقة.

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

للمسؤولين فقط. يضمن وجود ناشر مؤسسة لمقبض. إذا كان المقبض لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، تنقله نقطة النهاية أولا إلى ناشر مؤسسة.
بالنسبة إلى مؤسسة منشأة حديثا، قدّم `memberHandle`؛ ولا يُضاف المسؤول الفاعل كعضو.
تكون القيمة الافتراضية لـ `memberRole` هي `owner`.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ناشر مؤسسة بالخدمة الذاتية مع المصادقة. ينشئ ناشر مؤسسة جديدا ويضيف
المستدعي كمالك. لا تنقل نقطة النهاية هذه مقابض المستخدم/الشخصية الموجودة ولا
تضع علامة موثوق/رسمي على الناشر.

- الجسم: `{ "handle": "opik", "displayName": "Opik" }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- تعيد `409` عندما يكون المقبض مستخدما بالفعل من قبل ناشر، أو مستخدم، أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمسؤولين فقط. يحجز root slugs وأسماء الحزم للمالك الشرعي دون نشر
إصدار. تصبح أسماء الحزم حزما نائبة خاصة بلا صفوف إصدار، بحيث يستطيع
المالك نفسه لاحقا نشر إصدار code-plugin أو bundle-plugin الحقيقي إلى ذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمسؤولين فقط. يستعيد ناشرا شخصيا لكيان GitHub OAuth بديل ومتحقق منه
دون تعديل صفوف حساب Convex Auth. يجب أن يذكر الطلب كلا معرّفي حساب
المزوّد GitHub غير القابلين للتغيير؛ ولا تُستخدم المقابض القابلة للتغيير إلا كحماية موجهة للمشغل.

تكون نقطة النهاية افتراضيا في وضع التشغيل التجريبي. يتطلب تطبيق الاسترداد `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق الموظفون بشكل مستقل من استمرارية الهوية بين كلا
حسابي GitHub الأساسيين. يفشل الاسترداد بإغلاق آمن عندما يكون لدى الناشر الشخصي الحالي للمستخدم الوجهة
Skills أو حزم أو مصادر GitHub للـ Skills.
ينقل الاسترداد أيضا حقول `ownerUserId` القديمة الخاصة بـ Skills للناشر المسترد،
والأسماء المستعارة لـ slug الخاص بالـ Skill، والحزم، وتحذيرات فاحص الحزم، وصفوف ملخص البحث المشتقة بحيث
تتوافق مسارات المالك المباشر مع سلطة الناشر الجديدة. كما يعاد تعيين حجز protected-handle
نشط للمعرّف المسترد إلى المستخدم البديل حتى لا تتمكن مزامنة الملف الشخصي لاحقا من استعادة
سلطة المستخدم السابق المنافسة. يقتصر كل جدول أساسي على
100 صف لكل معاملة تطبيق؛ ويجب أن تستخدم عمليات الاسترداد الأكبر أولا ترحيل مالك قابل للاستئناف.
مصادر GitHub للـ Skills مرتبطة بالناشر ويتم الإبلاغ عنها على أنها مفحوصة بدلا من إعادة كتابتها.

- النص: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- الاستجابة: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط نهاية إدارة slug الخاص بالمالك

- `POST /api/v1/skills/{slug}/rename`
  - النص: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - النص: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة رمز API، وتعملان فقط لمالك الـ Skill.
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

حظر مستخدم وحذف Skills التي يملكها حذفا نهائيا (للمشرف/المدير فقط).

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
المحتوى (للمدير فقط). يكون الافتراضي هو التشغيل التجريبي ما لم تكن `dryRun` هي `false`.

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

سرد المستخدمين أو البحث عنهم (للمدير فقط).

معاملات الاستعلام:

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

راجع `DEPRECATIONS.md` لمعرفة خطة الإزالة.

يرجع `POST /api/cli/upload-url` القيمتين `uploadUrl` و`uploadTicket`. يجب على عمليات نشر الحزم
التي تجهز أرشيف ClawPack بصيغة tarball إرسال معرّف التخزين الناتج باسم
`clawpack` والتذكرة المرجعة باسم `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيا، فقدم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحة؛ `CLAWDHUB_REGISTRY` القديم).
