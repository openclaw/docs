---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح طلبات CLI ↔ السجل
summary: مرجع واجهة برمجة تطبيقات HTTP (النقاط الطرفية العامة + نقاط CLI الطرفية + المصادقة).
x-i18n:
    generated_at: "2026-06-28T05:06:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP API

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

جميع مسارات v1 تقع تحت `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الفهرس العام

يمكن للأدلة التابعة لجهات خارجية استخدام نقاط نهاية القراءة العامة لعرض Skills في ClawHub أو البحث فيها. يرجى تخزين النتائج مؤقتا، واحترام `429`/`Retry-After`، وإرجاع المستخدمين إلى قائمة ClawHub المرجعية (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد موقع الجهة الخارجية. لا تحاول عكس المحتوى المخفي أو الخاص أو المحظور بسبب الإشراف خارج سطح API العام.

تعمل اختصارات slug على الويب عبر عائلات السجل، لكن ينبغي لعملاء API استخدام
عناوين URL المرجعية التي تعيدها نقاط نهاية القراءة بدلا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُطبَّق لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تُطبَّق لكل حاوية مستخدم.
- إذا كان الرمز مفقودا/غير صالح، يرجع السلوك إلى الإنفاذ حسب عنوان IP.
- ينبغي ألا تعيد نقاط نهاية الكتابة المصادق عليها رسالة `Unauthorized` مجردة عندما
  يعرف الخادم السبب. ينبغي أن تحصل الرموز المفقودة، والرموز غير الصالحة/المبطلة،
  والحسابات المحذوفة/المحظورة/المعطلة، كل منها على نص قابل للتنفيذ حتى يتمكن عملاء CLI
  من إخبار المستخدمين بما حظرهم.

- القراءة: 3000/دقيقة لكل عنوان IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل عنوان IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل عنوان IP، و6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الرؤوس:

- توافق قديم: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- موحد: `RateLimit-Limit`، `RateLimit-Reset`
- عند `429`: `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix مطلقة
- `RateLimit-Reset`: ثوان حتى إعادة التعيين (تأخير)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند وجودها.
  تحذف الطلبات المجزأة الناجحة هذا الرأس بدلا من إرجاع قيمة عامة تقريبية.
- `Retry-After`: ثواني الانتظار قبل إعادة المحاولة (تأخير) عند `429`

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
- استخدم تراجعا بزمن عشوائي لتجنب إعادة المحاولات المتزامنة.
- إذا كان `Retry-After` مفقودا، فارجع إلى `RateLimit-Reset` (أو احسب من `X-RateLimit-Reset`).

مصدر عنوان IP:

- يستخدم رؤوس عنوان IP الخاصة بالعميل الموثوق، بما في ذلك `cf-connecting-ip`، فقط عندما
  يفعّل النشر صراحة الرؤوس المحولة الموثوقة.
- يستخدم ClawHub رؤوس التحويل الموثوقة لتحديد عناوين IP للعملاء عند الحافة.
- إذا لم يتوفر عنوان IP موثوق للعميل، تستخدم الطلبات المجهولة حاويات احتياطية
  نطاقها نوع حد المعدل فقط. لا تتضمن هذه الحاويات الاحتياطية
  مسارات أو slugs أو أسماء حزم أو إصدارات أو سلاسل استعلام أو غيرها
  من معاملات القطع الأثرية المقدمة من المستدعي.

## استجابات الأخطاء

استجابات أخطاء v1 العامة هي نص عادي مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك إخفاقات التحقق (`400`)، والموارد العامة المفقودة (`404`)، وإخفاقات المصادقة
والأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. ينبغي للعملاء
قراءة متن الاستجابة كسلسلة قابلة للقراءة البشرية. يتم تجاهل معاملات الاستعلام غير المعروفة
للتوافق، لكن معاملات الاستعلام المعروفة ذات القيم غير الصالحة تعيد `400`.

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

- تُعاد النتائج بترتيب الصلة (تشابه التضمين + تعزيزات مطابقة رمز slug/الاسم الدقيقة + أسبقية شعبية صغيرة).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتفوق على مطابقة أوسع ذات تفاعل أعلى بكثير.
- يُقسَّم نص ASCII إلى رموز عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز مستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يعطي البحث عن `map` مطابقة معجمية أقوى لـ `personal-map` من `amap-jsapi-skill`.
- الشعبية مقيّسة لوغاريتميا ومحددة بسقف. يمكن أن تحتل Skills ذات التفاعل العالي مرتبة أدنى عندما يكون نص الاستعلام مطابقا بدرجة أضعف.
- يمكن لحالة الإشراف المشبوهة أو المخفية أن تزيل Skill من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلا فقط عندما يكون أيضا هوية مستقرة تريد الاحتفاظ بها.
- لا تعِد تسمية slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسما مرجعيا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL المرجعي وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحفظ أسماء إعادة التسمية المستعارة حل العناوين لعناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يعتمد على بيانات تعريف Skill المرجعية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية بشكل غير متوقع، فتحقق أولا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول قبل تغيير بيانات التعريف المرتبطة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي ترتيب غير `trending`
- `sort` (اختياري): `updated` (الافتراضي)، `recommended` (اسم مستعار: `default`)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، أسماء التثبيت القديمة المستعارة `installsCurrent`/`installs`/`installsAllTime` تُربط إلى `downloads`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

تعيد قيم `sort` غير الصالحة `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتب `trending` حسب عمليات التثبيت في آخر 7 أيام (مبني على القياسات).
- `createdAt` مستقر لزحوف Skills الجديدة؛ يتغير `updated` عند إعادة نشر Skills الحالية.
- عندما يكون `nonSuspiciousOnly=true`، قد تعيد الترتيبات المستندة إلى المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تُرشح بعد جلب الصفحة.
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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill المرجعية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاصة بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` هي `null` إذا لم تكن لدى Skill بيانات تعريف منصة.
- يتم تضمين `moderation` فقط عندما تكون Skill معلَّمة أو عندما يعرضها المالك.

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
- يحصل المستدعون العامون على `200` فقط لـ Skills المرئية المعلَّمة مسبقا.
- تُنقّح الأدلة للمستدعين العامين ولا تتضمن مقتطفات خاما إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

الإبلاغ عن Skill لمراجعة المشرف. تكون البلاغات على مستوى Skill، ومرتبطة اختياريا
بإصدار، وتغذي طابور بلاغات Skill.

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

نقطة نهاية للمشرف/المدير لحل بلاغات Skills أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب للحالتين `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع بلاغ
تم فرزه لإخفاء Skill ضمن سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد بيانات تعريف الإصدار + قائمة الملفات.

- يتضمن `version.security` حالة التحقق من الفحص الطبيعية وتفاصيل الفاحص
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل التحقق من الفحص الأمني لإصدار Skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يتم توفير `version` ولا `tag`، فسيستخدم أحدث إصدار.
- يتضمن حالة تحقق موحدة بالإضافة إلى تفاصيل خاصة بالماسح.
- تكون `security.hasScanResult` بقيمة `true` فقط عندما ينتج ماسح حكما نهائيا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى المهارة، مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` باعتبارهما في سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة إرسال موثقة لمهام ClawScan الجديدة.

لم تعد فحوصات الرفع المحلي مدعومة. الطلبات التي تستخدم
`multipart/form-data` أو `{ "source": { "kind": "upload" } }` ترجع `410`.

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
- لا تكتب الفحوصات المنشورة النتائج عائدا إلا عندما تكون `update: true` ويكتمل الفحص بنجاح.
- الاستجابة هي `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تحصل طلبات الفحص اليدوية على أولوية قبل أعمال النشر/الملء الخلفي العادية، لكن الإكمال ما زال يعتمد على توفر العامل.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة استطلاع موثقة لفحص تم إرساله.

- ترجع حالة في الانتظار/قيد التشغيل/ناجح/فاشل.
- ترجع `queue.queuedAhead` و`queue.position` أثناء الانتظار حتى يتمكن العملاء من إظهار عدد الفحوصات اليدوية ذات الأولوية الموجودة قبل الطلب. يتم تقييد الطوابير الكبيرة جدا والإبلاغ عنها مع `queuedAheadIsEstimate: true`.
- عند توفره، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- ترجع مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة أرشيف تقارير موثقة.

- تتطلب فحصا ناجحا؛ ترجع الفحوصات غير النهائية `409`.
- ترجع ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة أرشيف تقارير مخزنة وموثقة للإصدارات المرسلة.

- تتطلب وصول إدارة المالك/الناشر إلى المهارة أو Plugin، أو صلاحية مشرف/مسؤول المنصة.
- ترجع نتائج الفحص المخزنة للإصدار المرسل بدقة، بما في ذلك الإصدارات المحظورة أو المخفية.
- القيمة الافتراضية لـ `kind` هي `skill`؛ استخدم `kind=plugin` لفحوصات Plugin/الحزمة.
- ترجع بنية ZIP نفسها مثل تنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة فحص دفعي قانوني للمسؤولين فقط. يقبل بنية الحمولة نفسها مثل `POST /api/v1/skills/-/rescan-batch` القديم.

### `POST /api/v1/skills/-/scan/batch/status`

مسار حالة دفعات قانوني للمسؤولين فقط. يقبل `{ "jobIds": ["..."] }` ويرجع العدادات المجمعة نفسها مثل `POST /api/v1/skills/-/rescan-batch/status` القديم.

### `GET /api/v1/skills/{slug}/verify`

يرجع غلاف تحقق بطاقة Skill المستخدم بواسطة `clawhub skill verify`.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- تكون `ok` بقيمة `true` فقط عندما يحتوي الإصدار المحدد على بطاقة Skill مولدة، ولا يكون محظورا كبرمجية خبيثة بواسطة الإشراف، ويكون تحقق ClawScan نظيفا.
- هوية Skill، وهوية الناشر، وبيانات الإصدار المحدد الوصفية هي حقول غلاف عليا (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) حتى تتمكن أتمتة الصدفة من قراءتها دون فك أغلفة متداخلة.
- `security` هو حكم ClawScan/الأمان على المستوى الأعلى. يجب أن تعتمد الأتمتة على `ok` و`decision` و`reasons` و`security.status`.
- يحتوي `security.signals` على أدلة داعمة من الماسحات مثل `staticScan` و`virusTotal` و`skillSpector`.
- يتم الاحتفاظ بـ `security.signals.dependencyRegistry` لتوافق استجابة v1، لكن ماسح وجود سجل الاعتماديات متقاعد وهذا المفتاح يكون دائما `null`.
- تكون `provenance` بقيمة `server-resolved-github-import` فقط عندما يحل ClawHub ويخزن مستودع/مرجع/التزام/مسار GitHub أثناء النشر أو الاستيراد؛ وإلا فهي `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يرجع أحكام الأمان المدمجة الحالية لإصدارات Skill الدقيقة. هذه
نقطة المجموعة مخصصة للعملاء الذين يعرفون مسبقا إصدارات Skill من ClawHub المثبتة
التي يحتاجون إلى عرضها، مثل OpenClaw Control UI.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن يحتوي `items` على 1-100 زوج فريد من `{ slug, version }`.
- النتائج لكل عنصر؛ لا يؤدي فقدان Skill واحد أو إصدار واحد إلى فشل الاستجابة كلها.
- الاستجابة للأمان فقط. لا تتضمن بيانات بطاقة Skill، أو حالة البطاقة المولدة، أو قوائم ملفات الأثر، أو حمولات ماسحات مفصلة.
- يحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق الأمان في ClawHub للحصول على تفاصيل الماسح الكاملة.
- يتم الاحتفاظ بـ `security.signals.dependencyRegistry` لتوافق استجابة v1، لكن ماسح وجود سجل الاعتماديات متقاعد وهذا المفتاح يكون دائما `null`.
- لا يؤثر غياب بطاقة Skill في `ok` أو `decision` أو `reasons` الخاصة بهذه النقطة؛ يجب على العملاء قراءة `skill-card.md` المثبت محليا عندما يحتاجون إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى غلاف تحقق بطاقة Skill لمهارة واحدة، و`/card` عندما تحتاج إلى Markdown البطاقة المولدة، و`/scan` عندما تحتاج إلى بيانات ماسحات مفصلة.

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

- يكون الافتراضي هو أحدث إصدار.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية موحّدة للكتالوج من أجل:

- المهارات
- Plugins الكود
- Plugins الحِزم

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `updated` (الافتراضي)، `recommended`، `trending`، `downloads`، الاسم المستعار القديم `installs`
- `category` (اختياري): مرشح فئة Plugin. مدعوم فقط عندما يكون
  الطلب محدد النطاق إلى حزم Plugin (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، أو نقاط نهاية الحزم مع
  `family=code-plugin`/`family=bundle-plugin`). الفئات المضبوطة
  والأسماء المستعارة القديمة لمرشحات v1 موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` أو `sort` تعيد `400`. يتم تجاهل معاملات الاستعلام غير المعروفة.
- يظل `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين مستعارين ثابتَي العائلة.
- تظل إدخالات المهارات مدعومة بسجل المهارات، ولا يزال نشرها ممكنًا فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصًا فقط لإصدارات code-plugin وbundle-plugin.
- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القوائم/البحث.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحّد في الكتالوج عبر المهارات + حزم Plugin.

معاملات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. مدعوم فقط عندما يكون
  الطلب محدد النطاق إلى حزم Plugin. الفئات المضبوطة والأسماء المستعارة القديمة لمرشحات v1
  موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` تعيد `400`. يتم تجاهل معاملات الاستعلام غير المعروفة.
- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/plugins`

استعراض كتالوج خاص بـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (الافتراضي)، `trending`، `downloads`، `updated`، الاسم المستعار القديم `installs`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

تظل الأسماء المستعارة القديمة لمرشحات v1 مقبولة في نقاط نهاية القراءة:

- يتم حل `mcp-tooling` و`data` و`automation` إلى `tools`.
- يتم حل `observability` و`deployment` إلى `gateway`.
- يتم حل `dev-tools` إلى `runtime`.

`trending` هو ترتيب تثبيت/تنزيل لسبعة أيام ولا يستخدم الإجماليات منذ البداية.
على نقطة النهاية الموحّدة `/api/v1/packages` يكون خاصًا بـ Plugin فقط؛ استخدم
`/api/v1/skills?sort=trending` لكتالوج المهارات.

لا تُقبل الأسماء المستعارة القديمة كقيم فئات مخزنة أو معلنة من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث المهارات العامة من أجل التحليل دون اتصال.

المصادقة:

- رمز API مميز مطلوب.

معاملات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بالميلي ثانية بتوقيت Unix لـ `updatedAt` الخاص بالمهارة.
- `endDate` (مطلوب): الحد الأعلى بالميلي ثانية بتوقيت Unix لـ `updatedAt` الخاص بالمهارة.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل مهارة مصدّرة عند `{publisher}/{slug}/`.
- تتضمن المهارات المستضافة أحدث ملفات الإصدار المخزن، وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن المهارات الحالية المدعومة من GitHub التي لديها فحص `clean` أو `suspicious`
  `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، وعنوان URL للأرشيف. ولا تتضمن ملفات المصدر المستضافة على ClawHub.
- تتضمن كل مهارة `_export_skill_meta.json`.
- يتم دائمًا تضمين `_manifest.json` في جذر ZIP.
- يتم تضمين `_errors.json` عندما لا يمكن تصدير مهارات أو ملفات فردية.

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

معاملات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بالمللي ثانية وفق Unix لقيمة `updatedAt` في Plugin.
- `endDate` (مطلوب): الحد الأقصى بالمللي ثانية وفق Unix لقيمة `updatedAt` في Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني حذفه كلتا عائلتي
  Plugin.

الاستجابة:

- المتن: أرشيف ZIP.
- يكون جذر كل Plugin مصدرة عند `{family}/{packageName}/`.
- تتضمن كل Plugin مصدرة الملفات المخزنة لأحدث إصدار.
- تُخزن بيانات تعريف التصدير الخاصة بكل Plugin عند
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- يُضمَّن `_manifest.json` دائمًا في جذر ملف ZIP.
- يُضمَّن `_errors.json` عندما يتعذر تصدير Plugins أو ملفات فردية.

الرؤوس:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

بحث مخصص لـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معاملات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1-100)
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): عامل تصفية فئة Plugin. القيم الحالية:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

ملاحظات:

- تُقبل أيضًا الأسماء البديلة القديمة لعوامل تصفية v1 الموثقة ضمن `GET /api/v1/plugins`.
- تصفية الفئات هي عامل تصفية API حقيقي مدعوم بصفوف ملخص فئات Plugin،
  وليست إعادة كتابة لاستعلام البحث.
- تُعاد النتائج بترتيب الصلة ولا تدعم حاليًا ترقيم الصفحات.
- تعيد عناصر التحكم في فرز واجهة المتصفح لبحث Plugin ترتيب نتائج الصلة المحملة،
  بما يطابق سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن لـ Skills أيضًا الحل عبر هذا المسار في الكتالوج الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف الحزمة وجميع الإصدارات حذفًا مبدئيًا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدار حزمة واحدًا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والتحقق، وبيانات تعريف الأثر، وبيانات الفحص.

ملاحظات:

- تكون `version.artifact.kind` بقيمة `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة بـ ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- تُعد `version.sha256hash` بيانات تعريف توافق مهملة للعملاء القدامى. وهي
  تجزئ بايتات ZIP الدقيقة التي يعيدها `/api/v1/packages/{name}/download`.
  ينبغي للعملاء الحديثين استخدام `version.artifact.sha256`، الذي يحدد أثر
  الإصدار القانوني.
- تُضمَّن `version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan`
  عندما توجد بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/security`

يعيد ملخص أمان وثقة إصدار الحزمة الدقيق لعملاء التثبيت. هذا هو سطح استهلاك
OpenClaw العام لتقرير ما إذا كان يمكن تثبيت إصدار محلول.

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
  الدقيق الذي تم تقييمه.
- تكون `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity`
  و`release.npmShasum` و`release.npmTarballName` موجودة عندما تكون معروفة
  لأثر الإصدار.
- `trust.scanStatus` هي حالة الثقة الفعلية المشتقة من مدخلات الماسح والإشراف
  اليدوي على الإصدار.
- `trust.moderationState` قابلة لأن تكون فارغة. تكون `null` عندما لا يوجد
  إشراف يدوي على الإصدار.
- `trust.blockedFromDownload` هي إشارة حظر التثبيت. ينبغي لـ OpenClaw وعملاء
  التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلًا من إعادة
  اشتقاق قواعد الحظر من حقول الماسح أو الإشراف.
- `trust.reasons` هي قائمة الشرح الموجهة للمستخدم والتدقيق. رموز الأسباب
  سلاسل مستقرة ومضغوطة مثل `manual:quarantined` و`scan:malicious` و
  `package:malicious`.
- تعني `trust.pending` أن واحدًا أو أكثر من مدخلات الثقة لا يزال ينتظر الاكتمال.
- تعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة وينبغي التعامل معه
  على أنه يتطلب تحديثًا قبل قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة حسب الإصدار. ينبغي للعملاء استدعاؤها بعد حل إصدار
  الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف للحزمة.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدًا من نقاط نهاية إشراف المالك/المشرف. فهي تعرض
  قرار التثبيت والشرح العام، لا هويات المبلغين، أو متون البلاغات، أو الأدلة
  الخاصة، أو الجداول الزمنية الداخلية للمراجعة.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل الأثر الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثر `legacy-zip` و`downloadUrl` قديمًا لملف ZIP.
- تعيد إصدارات ClawPack أثر `npm-pack`، وحقول سلامة npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح محلل OpenClaw؛ فهو يتجنب تخمين تنسيق الأرشيف من رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزّل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة لحزمة npm-pack المرفوعة.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw في المستقبل.

تشمل فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر ClawPack npm-pack
- ملخص الأثر
- مصدر مستودع المصدر وإثبات الالتزام
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

نقطة نهاية مشرف لسرد صفوف ترحيل Plugins OpenClaw الرسمية.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معاملات الاستعلام:

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

نقطة نهاية مسؤول لإنشاء صف ترحيل Plugin رسمية أو تحديثه.

المصادقة:

- يتطلب رمز API لمستخدم مسؤول.

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

- تُطبَّع `bundledPluginId` إلى أحرف صغيرة وهي مفتاح upsert المستقر.
- يُطبَّع `packageName` كاسم npm؛ ويمكن أن تكون الحزمة مفقودة للترحيلات المخططة.
- يتتبع هذا جاهزية الترحيل فقط. ولا يغير OpenClaw أو ينشئ ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية مشرف/مسؤول لقوائم انتظار مراجعة إصدارات الحزم.

المصادقة:

- يتطلب رمز API لمستخدم مشرف أو مسؤول.

معاملات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالة:

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

أبلغ عن حزمة لمراجعة المشرف. البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا
بإصدار. وهي تغذي قائمة انتظار الإشراف لكنها لا تخفي التنزيلات أو تحظرها
تلقائيًا بذاتها؛ ينبغي للمشرفين استخدام إشراف الإصدارات للموافقة على الآثار أو
عزلها أو إلغائها.

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

`note` مطلوبة للحالتين `confirmed` و`dismissed`؛ ويمكن حذفها عند
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

تعيد الإصدارات المحجورة والملغاة `403` من مسارات تنزيل الأثر.
كل تغيير يكتب إدخالا في سجل التدقيق.

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
- لا تمنع فحوصات VirusTotal المعلقة القراءة؛ قد تظل الإصدارات الخبيثة محجوبة في مكان آخر.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيا.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip بجذر `package/` لكي تستمر عملاء OpenClaw
  القديمة في العمل.
- يبقى هذا المسار مخصصا لـ ZIP فقط. ولا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag`، و`Digest`، و`X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة المحلل.
- لا تُحقن بيانات السجل الوصفية فقط داخل الأرشيف المنزل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقا مع npm لإصدارات الحزم المدعومة بـ ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي رُفعت لها كرات tar من نوع ClawPack npm-pack.
- تُحذف إصدارات ZIP القديمة فقط عمدا.
- تستخدم `dist.tarball`، و`dist.integrity`، و`dist.shasum` حقولا متوافقة مع npm
  لكي يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلا من مسار الطلب `/api/npm/@scope/name` ومسار
  npm المرمز `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات كرة tar المرفوعة نفسها من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 من ClawHub بالإضافة إلى بيانات سلامة/‏shasum الوصفية من npm.
- لا تزال فحوصات الإشراف والوصول إلى الحزم الخاصة سارية.

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

ينزل ZIP لإصدار skill مستضاف، أو يعيد تسليما إلى مصدر GitHub من أجل skill
حالية مدعومة بـ GitHub مع فحص `clean` أو `suspicious` ومن دون إصدار
مستضاف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يقدَّم `version` ولا `tag`، فسيُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفًا ناعمًا `410`.
- لا تقوم عمليات تسليم skill المدعومة بـ GitHub بتمرير البايتات أو عكسها. تتضمن استجابة JSON
  `sourceRef: "public-github"`، و`repo`، و`commit`، و`path`، و`contentHash`،
  و`archiveUrl`؛ تكون حالة الفحص/الحالة الحالية بوابة، ولا تُضمَّن بوصفها بيانات وصفية لحمولة نجاح.
- تُحسب إحصاءات التنزيل كهويات فريدة لكل يوم UTC (`userId` عندما يكون رمز API صالحا، وإلا IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصدارا جديدا.

- المفضل: `multipart/form-data` مع JSON في `payload` + كتل `files[]`.
- يُقبل أيضا جسم JSON مع `files` (معتمد على storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، تحل API ذلك
  الناشر من جهة الخادم وتتطلب أن يكون للفاعل وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عندما يكون `true` مع `ownerHandle`، قد
  تنتقل skill موجودة إلى ذلك المالك إذا كان الفاعل مسؤولا/مالكا لدى كل من
  الناشرين الحالي والمستهدف. من دون هذا الاشتراك الصريح، تُرفض تغييرات
  المالك.

### `POST /api/v1/packages`

ينشر إصدار Plugin من نوع code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموح بها هي `payload`، أو كتل `files` المتكررة، أو مرجع كرة tar واحد
  باسم `clawpack`. قد يكون `clawpack` كتلة `.tgz` أو معرف تخزين أعاده
  مسار upload-url. يجب أن تتضمن عمليات النشر الممرحلة بمعرف التخزين أيضا
  `clawpackUploadTicket` المعاد مع عنوان URL لذلك الرفع.
- استخدم إما `files` أو `clawpack`، ولا تستخدمهما معا في الطلب نفسه.
- تُرفض أجسام JSON وبيانات `payload.files` / `payload.artifact`
  الوصفية المقدمة من المستدعي.
- تحد طلبات النشر المباشرة بصيغة multipart عند 18MB. يمكن لكرات tar من ClawPack
  استخدام مسار upload-url حتى حد كرة tar البالغ 120MB.
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، لا يمكن إلا للمسؤولين النشر نيابة عن ذلك المالك.

أبرز نقاط التحقق:

- يجب أن تكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin ملف `openclaw.plugin.json`. يجب أن تحتوي رفعات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب Plugins البرمجية `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية لالتزام المصدر،
  وبيانات وصفية لمخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يمكن النشر إلى قناة `official` إلا لناشر مؤسسة `openclaw` والناشرين الشخصيين
  لأعضاء مؤسسة `openclaw` الحاليين.
- لا تزال عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك المستهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف ناعم / استعادة skill (المالك، أو المشرف، أو المسؤول).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزن كملاحظة إشراف skill ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف الناعم التي يبدأها المالك slug لمدة 30 يوما، ثم يمكن لناشر
آخر المطالبة بالـ slug. تتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانقضاء.
لا تنتهي عمليات الإخفاء بواسطة المشرف/المسؤول وإزالات الأمان بهذه الطريقة.

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

للمسؤول فقط. يضمن وجود ناشر مؤسسة لمعرّف. إذا كان المعرّف لا يزال يشير إلى
مستخدم مشترك قديم/ناشر شخصي، فتنقله نقطة النهاية إلى ناشر مؤسسة أولا.
بالنسبة إلى مؤسسة منشأة حديثا، قدم `memberHandle`؛ لا يُضاف المسؤول الفاعل كعضو.
القيمة الافتراضية لـ `memberRole` هي `owner`.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ناشر مؤسسة ذاتي الخدمة مع المصادقة. ينشئ ناشر مؤسسة جديدا ويضيف
المستدعي مالكا. لا تنقل نقطة النهاية هذه معرّفات المستخدمين/الشخصية الموجودة ولا
تعلّم الناشر كموثوق/رسمي.

- الجسم: `{ "handle": "opik", "displayName": "Opik" }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- يعيد `409` عندما يكون المعرّف مستخدما بالفعل من ناشر، أو مستخدم، أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمسؤول فقط. يحجز slugs الجذرية وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزما نائبة خاصة بلا صفوف إصدار، بحيث يستطيع
المالك نفسه لاحقا نشر إصدار Plugin الحقيقي من نوع code-plugin أو bundle-plugin إلى ذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمسؤول فقط. يستعيد ناشرا شخصيا لمعرّف GitHub OAuth بديل متحقق منه
من دون تعديل صفوف حساب Convex Auth. يجب أن يسمي الطلب كلا معرفي حساب
موفر GitHub غير القابلين للتغيير؛ ولا تُستخدم المعرّفات القابلة للتغيير إلا كحارس مواجه للمشغل.

تكون نقطة النهاية افتراضياً في وضع التشغيل التجريبي. يتطلب تطبيق الاسترداد `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق الموظفون بشكل مستقل من الاستمرارية بين هويتَي
GitHub الأساسيتين. يفشل الاسترداد بوضع مغلق عندما يكون للناشر الشخصي الحالي للمستخدم الوجهة
Skills أو حزم أو مصادر Skills على GitHub.
ينقل الاسترداد أيضاً حقول `ownerUserId` القديمة الخاصة بـ Skills للناشر المسترد،
والأسماء المستعارة لـ slug الخاصة بـ Skills، والحزم، وتحذيرات مفتش الحزم، وصفوف ملخص البحث المشتقة بحيث
تتفق مسارات المالك المباشر مع سلطة الناشر الجديدة. كما يُعاد تعيين حجز المقبض المحمي النشط
للمقبض المسترد إلى المستخدم البديل حتى لا تتمكن مزامنة الملف الشخصي لاحقاً
من استعادة السلطة المنافسة للمستخدم السابق. يقتصر كل جدول أساسي على
100 صف لكل معاملة تطبيق؛ يجب أن تستخدم عمليات الاسترداد الأكبر أولاً ترحيلاً قابلاً للاستئناف للمالك.
مصادر Skills على GitHub محددة النطاق بالناشر ويُبلّغ عنها على أنها فُحصت بدلاً من إعادة كتابتها.

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

- تتطلب كلتا نقطتي النهاية مصادقة رمز API ولا تعملان إلا لمالك Skills.
- يحافظ `rename` على slug السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` إدراج المصدر ويعيد توجيه slug المصدر إلى الإدراج الهدف.

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

احظر مستخدماً واحذف Skills المملوكة حذفاً نهائياً (للمشرف/المسؤول فقط).

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

ألغِ حظر مستخدم واستعد Skills المؤهلة (للمسؤول فقط).

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

غيّر السبب المخزن لحظر موجود من دون إلغاء الحظر أو استعادة
المحتوى (للمسؤول فقط). يكون الافتراضي تشغيلًا تجريبيًا ما لم تكن `dryRun` هي `false`.

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

غيّر دور مستخدم (للمسؤول فقط).

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

اعرض قائمة المستخدمين أو ابحث عنهم (للمسؤول فقط).

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

أضف/أزل نجمة (تمييزات). كلتا نقطتي النهاية متطابقتا الأثر.

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

يعيد `POST /api/cli/upload-url` القيمتين `uploadUrl` و `uploadTicket`. يجب على عمليات نشر الحزم
التي تهيئ كرة tar من ClawPack أن ترسل معرف التخزين الناتج باسم
`clawpack` والتذكرة المعادة باسم `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتياً، فقدم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ القديم `CLAWDHUB_REGISTRY`).
