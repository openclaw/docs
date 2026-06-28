---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع واجهة برمجة تطبيقات HTTP (العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-06-28T07:41:16Z"
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

## إعادة استخدام الكتالوج العام

يمكن للأدلة التابعة لجهات خارجية استخدام نقاط نهاية القراءة العامة لسرد Skills في ClawHub أو البحث عنها. يُرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وربط المستخدمين مرة أخرى بالقائمة الرسمية في ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد موقع الجهة الخارجية. لا تحاول نسخ المحتوى المخفي أو الخاص أو المحظور بالإشراف خارج سطح API العام.

تُحل اختصارات slug على الويب عبر عائلات السجل، لكن ينبغي لعملاء API استخدام
عناوين URL الرسمية التي تعيدها نقاط نهاية القراءة بدلًا من إعادة بناء أولوية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُفرض لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى الإنفاذ حسب IP.
- ينبغي ألا تعيد نقاط نهاية الكتابة المصادق عليها `Unauthorized` مجردة عندما
  يعرف الخادم السبب. ينبغي أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة،
  والحسابات المحذوفة/المحظورة/المعطلة، كل منها على نص قابل للتنفيذ كي يتمكن عملاء CLI
  من إخبار المستخدمين بما منعهم.

- القراءة: 3000/دقيقة لكل IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل IP، و6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الرؤوس:

- التوافق القديم: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- المعياري: `RateLimit-Limit`, `RateLimit-Reset`
- عند `429`: `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية بدقة عند وجودها.
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
- استخدم تراجعًا عشوائيًا متدرجًا لتجنب عمليات إعادة المحاولة المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم رؤوس IP العميل الموثوقة، بما في ذلك `cf-connecting-ip`، فقط عندما
  يفعّل النشر صراحةً الرؤوس الممررة الموثوقة.
- يستخدم ClawHub رؤوس التمرير الموثوقة لتحديد عناوين IP للعملاء عند الحافة.
- إذا لم يتوفر IP عميل موثوق، تستخدم الطلبات المجهولة حاويات احتياطية
  مقيّدة فقط بنوع حد المعدل. لا تتضمن هذه الحاويات الاحتياطية
  المسارات أو slugs أو أسماء الحزم أو الإصدارات أو سلاسل الاستعلام أو غيرها من
  معاملات القطع الأثرية المقدمة من المتصل.

## استجابات الأخطاء

استجابات أخطاء v1 العامة هي نص عادي مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك إخفاقات التحقق (`400`)، والموارد العامة المفقودة (`404`)، وإخفاقات المصادقة
والأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. ينبغي للعملاء
قراءة جسم الاستجابة كسلسلة قابلة للقراءة من البشر. تُتجاهل معاملات الاستعلام غير المعروفة
للتوافق، لكن معاملات الاستعلام المعروفة ذات القيم غير الصالحة تعيد
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

- تُعاد النتائج بترتيب الصلة (تشابه التضمين + تعزيزات تطابق slug/اسم الرمز بدقة + أولوية شعبية صغيرة).
- الصلة أقوى من الشعبية. يمكن لتطابق دقيق مع slug أو رمز اسم العرض أن يتفوق على تطابق أوسع ذي تفاعل أقوى بكثير.
- يُجزّأ نص ASCII عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز `map` مستقل، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك فإن البحث عن `map` يمنح `personal-map` تطابقًا معجميًا أقوى من `amap-jsapi-skill`.
- تُقاس الشعبية لوغاريتميًا وتُحدّ بسقف. يمكن أن تحتل Skills ذات التفاعل العالي مرتبة أدنى عندما يكون نص الاستعلام أضعف تطابقًا.
- يمكن لحالة الإشراف المشبوهة أو المخفية إزالة Skill من البحث العام بحسب مرشحات المتصل وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تعِد تسمية slug لمجرد ملاحقة استعلام واحد ما لم يكن slug الجديد اسمًا رسميًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الرسمي وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحفظ أسماء إعادة التسمية المستعارة الحل لعناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يستند إلى بيانات Skill الوصفية الرسمية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية على نحو غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المتعلقة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي ترتيب غير `trending`
- `sort` (اختياري): `updated` (الافتراضي)، `recommended` (اسم مستعار: `default`)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، أسماء التثبيت القديمة المستعارة `installsCurrent`/`installs`/`installsAllTime` تُطابق إلى `downloads`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

قيم `sort` غير الصالحة تعيد `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتب `trending` حسب عمليات التثبيت في آخر 7 أيام (استنادًا إلى القياسات).
- `createdAt` مستقر لزحف Skills الجديدة؛ يتغير `updated` عندما يُعاد نشر Skills الحالية.
- عند `nonSuspiciousOnly=true`، قد تعيد الترتيبات المستندة إلى المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تُرشح بعد استرجاع الصفحة.
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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill الرسمية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاص بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` بقيمة `null` إذا لم تكن لدى Skill بيانات وصفية للمنصة.
- تُضمّن `moderation` فقط عندما تكون Skill معلّمة أو عندما يعرضها المالك.

### `GET /api/v1/skills/{slug}/moderation`

يعيد حالة الإشراف المهيكلة.

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
- يحصل المتصلون العموميون على `200` فقط لـ Skills المرئية المعلّمة مسبقًا.
- تُحجب الأدلة عن المتصلين العموميين ولا تتضمن مقتطفات خامًا إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن Skill لمراجعة المشرف. التقارير على مستوى Skill، ويمكن ربطها اختياريًا
بإصدار، وتغذي قائمة انتظار تقارير Skill.

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

نقطة نهاية المشرف/المدير لاستقبال تقارير Skill.

معاملات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، `confirmed`، `dismissed`، أو `all`
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

نقطة نهاية المشرف/المدير لحل تقارير Skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب عند `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "hide"` مع تقرير مفروز
لإخفاء Skill ضمن تدفق العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد البيانات الوصفية للإصدار + قائمة الملفات.

- يتضمن `version.security` حالة التحقق من الفحص المعيارية وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل التحقق من فحص الأمان لإصدار Skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يتم توفير `version` ولا `tag`، فسيستخدم أحدث إصدار.
- يتضمن حالة تحقق موحدة بالإضافة إلى تفاصيل خاصة بالماسح.
- تكون `security.hasScanResult` بقيمة `true` فقط عندما يصدر ماسح حكمًا نهائيًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى المهارة مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` على أنهما في سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة إرسال مصادَق عليها لمهام ClawScan الجديدة.

لم تعد عمليات فحص الرفع المحلي مدعومة. الطلبات التي تستخدم
`multipart/form-data` أو `{ "source": { "kind": "upload" } }` تُرجع `410`.

تستخدم عمليات فحص الإصدارات المنشورة JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

ملاحظات:

- تنتهي صلاحية حمولات طلبات الفحص والتقارير القابلة للتنزيل من مخزن طلبات الفحص بعد نافذة الاحتفاظ.
- تتطلب عمليات فحص الإصدارات المنشورة صلاحية إدارة المالك/الناشر، أو صلاحية مشرف/مسؤول المنصة.
- تكتب عمليات فحص الإصدارات المنشورة النتائج مرة أخرى فقط عندما تكون `update: true` ويكتمل الفحص بنجاح.
- تكون الاستجابة `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تُعطى طلبات الفحص اليدوي أولوية على أعمال النشر/الملء اللاحق العادية، لكن الإكمال ما يزال يعتمد على توافر العامل.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة استطلاع مصادَق عليها لفحص تم إرساله.

- تُرجع حالة في قائمة الانتظار/قيد التشغيل/ناجح/فاشل.
- تُرجع `queue.queuedAhead` و`queue.position` أثناء الانتظار في القائمة حتى تتمكن العملاء من عرض عدد عمليات الفحص اليدوي ذات الأولوية التي تسبق الطلب. تُحدَّد حدود للقوائم الكبيرة جدًا ويُبلَّغ عنها باستخدام `queuedAheadIsEstimate: true`.
- عند التوفر، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- تُرجع مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة أرشيف تقارير مصادَق عليها.

- تتطلب فحصًا ناجحًا؛ وتُرجع عمليات الفحص غير النهائية `409`.
- تُرجع ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة أرشيف تقارير مخزنة مصادَق عليها للإصدارات المرسلة.

- تتطلب صلاحية إدارة المالك/الناشر للمهارة أو Plugin، أو صلاحية مشرف/مسؤول المنصة.
- تُرجع نتائج الفحص المخزنة للإصدار المرسل المحدد، بما في ذلك الإصدارات المحظورة أو المخفية.
- القيمة الافتراضية لـ `kind` هي `skill`؛ استخدم `kind=plugin` لفحوصات Plugin/الحزمة.
- تُرجع شكل ZIP نفسه مثل تنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة فحص دفعي معياري مخصص للمسؤولين فقط. يقبل شكل الحمولة نفسه مثل `POST /api/v1/skills/-/rescan-batch` القديم.

### `POST /api/v1/skills/-/scan/batch/status`

مسار حالة دفعي معياري مخصص للمسؤولين فقط. يقبل `{ "jobIds": ["..."] }` ويُرجع عدادات التجميع نفسها مثل `POST /api/v1/skills/-/rescan-batch/status` القديم.

### `GET /api/v1/skills/{slug}/verify`

يُرجع غلاف تحقق بطاقة المهارة المستخدم بواسطة `clawhub skill verify`.

معلمات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (مثل `latest`).

ملاحظات:

- تكون `ok` بقيمة `true` فقط عندما يحتوي الإصدار المحدد على بطاقة مهارة مولدة، ولا يكون محظورًا كبرمجية خبيثة بواسطة الإشراف، ويكون تحقق ClawScan نظيفًا.
- هوية المهارة، وهوية الناشر، وبيانات الإصدار المحدد الوصفية هي حقول غلاف على المستوى الأعلى (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) حتى تتمكن أتمتة الصدفة من قراءتها دون تفكيك أغلفة متداخلة.
- `security` هو حكم ClawScan/الأمان على المستوى الأعلى. يجب أن تعتمد الأتمتة على `ok` و`decision` و`reasons` و`security.status`.
- يحتوي `security.signals` على أدلة داعمة من الماسحات مثل `staticScan` و`virusTotal` و`skillSpector`.
- يتم الاحتفاظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن ماسح وجود سجل الاعتماديات متقاعد وهذا المفتاح دائمًا `null`.
- تكون `provenance` بقيمة `server-resolved-github-import` فقط عندما يحل ClawHub مستودع GitHub/المرجع/الالتزام/المسار ويخزنه أثناء النشر أو الاستيراد؛ وإلا تكون `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يُرجع أحكام الأمان الحالية المختصرة لإصدارات المهارات المحددة. نقطة نهاية
المجموعة هذه مخصصة للعملاء الذين يعرفون مسبقًا إصدارات مهارات ClawHub المثبتة
التي يحتاجون إلى عرضها، مثل OpenClaw Control UI.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن تحتوي `items` على 1-100 زوج فريد من `{ slug, version }`.
- النتائج لكل عنصر؛ لا يؤدي فقدان مهارة واحدة أو إصدار واحد إلى فشل الاستجابة بالكامل.
- الاستجابة مخصصة للأمان فقط. لا تتضمن بيانات بطاقة المهارة، أو حالة البطاقة المولدة، أو قوائم ملفات الأثر، أو حمولات الماسح التفصيلية.
- يحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق أمان ClawHub للحصول على تفاصيل الماسح الكاملة.
- يتم الاحتفاظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن ماسح وجود سجل الاعتماديات متقاعد وهذا المفتاح دائمًا `null`.
- لا يؤثر غياب بطاقة المهارة في `ok` أو `decision` أو `reasons` لهذه النقطة؛ يجب على العملاء قراءة `skill-card.md` المثبت محليًا عندما يحتاجون إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى غلاف تحقق بطاقة المهارة لمهارة واحدة، و`/card` عندما تحتاج إلى Markdown البطاقة المولدة، و`/scan` عندما تحتاج إلى بيانات ماسح تفصيلية.

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

نقطة نهاية موحدة للفهرس من أجل:

- المهارات
- المكوّنات الإضافية البرمجية
- المكوّنات الإضافية المجمّعة

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `updated` (الافتراضي)، `recommended`، `trending`، `downloads`، الاسم البديل القديم `installs`
- `category` (اختياري): مرشح فئة المكوّن الإضافي. مدعوم فقط عندما يكون
  الطلب محصورًا بحزم المكوّنات الإضافية (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، أو نقاط نهاية الحزم مع
  `family=code-plugin`/`family=bundle-plugin`). الفئات المضبوطة
  وأسماء مرشحات v1 البديلة القديمة موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured`
  أو `highlightedOnly` أو `sort` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- يبقى `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` اسمين بديلين ثابتَي العائلة.
- تظل إدخالات المهارات مدعومة بسجل المهارات، ولا يزال لا يمكن نشرها إلا عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصًا فقط لإصدارات `code-plugin` و`bundle-plugin`.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- يعيد `channel=private` فقط الحزم التي يمكن للمستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحد في الفهرس عبر المهارات + حزم المكوّنات الإضافية.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة المكوّن الإضافي. مدعوم فقط عندما يكون
  الطلب محصورًا بحزم المكوّنات الإضافية. الفئات المضبوطة وأسماء مرشحات v1
  البديلة القديمة موثقة ضمن `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` تعيد `400`. يتم تجاهل معلمات الاستعلام غير المعروفة.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- يعيد `channel=private` فقط الحزم التي يمكن للمستدعي المصادق عليه قراءتها.

### `GET /api/v1/plugins`

استعراض فهرس خاص بالمكوّنات الإضافية فقط عبر حزم `code-plugin` و`bundle-plugin`.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (الافتراضي)، `trending`، `downloads`، `updated`، الاسم البديل القديم `installs`
- `category` (اختياري): مرشح فئة المكوّن الإضافي. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

تظل أسماء مرشحات v1 البديلة القديمة مقبولة على نقاط نهاية القراءة:

- يتم تحويل `mcp-tooling` و`data` و`automation` إلى `tools`.
- يتم تحويل `observability` و`deployment` إلى `gateway`.
- يتم تحويل `dev-tools` إلى `runtime`.

`trending` هي لوحة صدارة للتثبيتات/التنزيلات خلال سبعة أيام ولا تستخدم الإجماليات عبر كل الوقت.
على نقطة النهاية الموحدة `/api/v1/packages` تكون خاصة بالمكوّنات الإضافية فقط؛ استخدم
`/api/v1/skills?sort=trending` لفهرس المهارات.

لا تُقبل الأسماء البديلة القديمة كقيم فئات مخزنة أو مصرّح بها من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث المهارات العامة للتحليل دون اتصال.

المصادقة:

- يلزم رمز API.

معلمات الاستعلام:

- `startDate` (مطلوب): حد أدنى بملّي ثواني Unix لـ `updatedAt` الخاص بالمهارة.
- `endDate` (مطلوب): حد أعلى بملّي ثواني Unix لـ `updatedAt` الخاص بالمهارة.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل مهارة مصدّرة عند `{publisher}/{slug}/`.
- تتضمن المهارات المستضافة أحدث ملفات الإصدار المخزن وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن المهارات الحالية المدعومة من GitHub والتي لديها فحص `clean` أو `suspicious`
  ملف `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، ورابط الأرشيف. ولا تتضمن ملفات المصدر المستضافة على ClawHub.
- تتضمن كل مهارة `_export_skill_meta.json`.
- يتم دائمًا تضمين `_manifest.json` في جذر ملف ZIP.
- يتم تضمين `_errors.json` عندما يتعذر تصدير مهارات أو ملفات فردية.

الرؤوس:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

تصدير جماعي لأحدث إصدارات Plugin العامة للتحليل دون اتصال.

المصادقة:

- مطلوب رمز API.

معلمات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بالميلي ثانية في Unix لقيمة `updatedAt` الخاصة بـ Plugin.
- `endDate` (مطلوب): الحد الأعلى بالميلي ثانية في Unix لقيمة `updatedAt` الخاصة بـ Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني إغفاله كلا
  عائلتي Plugin.

الاستجابة:

- النص: أرشيف ZIP.
- يكون جذر كل Plugin مُصدَّر عند `{family}/{packageName}/`.
- يتضمن كل Plugin مُصدَّر الملفات المخزنة لأحدث إصدار.
- تُخزَّن بيانات تعريف التصدير لكل Plugin عند
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

بحث خاص بـ Plugin عبر حزم code-plugin وbundle-plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1-100)
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

ملاحظات:

- تُقبل أيضًا أسماء مرشحات v1 القديمة البديلة الموثقة ضمن `GET /api/v1/plugins`.
- ترشيح الفئات هو مرشح API حقيقي مدعوم بصفوف ملخص فئات Plugin،
  وليس إعادة كتابة لاستعلام البحث.
- تُعاد النتائج بترتيب الصلة ولا تدعم ترقيم الصفحات حاليًا.
- تعيد عناصر التحكم في فرز واجهة المتصفح لبحث Plugin ترتيب نتائج الصلة المحمّلة،
  بما يطابق سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن لـ Skills أيضًا أن تُحل عبر هذا المسار في الفهرس الموحد.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وكل إصداراتها حذفًا منطقيًا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدارًا واحدًا من الحزمة، بما في ذلك بيانات تعريف الملفات، والتوافق،
والتحقق، وبيانات تعريف الأثر، وبيانات الفحص.

ملاحظات:

- تكون `version.artifact.kind` بالقيمة `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة بـ ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و`npmTarballName`
  المتوافقة مع npm.
- `version.sha256hash` هي بيانات تعريف توافق مهملة للعملاء القدامى. إنها
  تجزئ بايتات ZIP الدقيقة المعادة بواسطة `/api/v1/packages/{name}/download`.
  يجب على العملاء الحديثين استخدام `version.artifact.sha256`، التي تحدد
  أثر الإصدار المعياري.
- تُضمَّن `version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan`
  عندما توجد بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/security`

يعيد ملخص الأمان والثقة الدقيق لإصدار الحزمة لعملاء التثبيت. هذا هو سطح
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

- تحدد `package.name` و`package.displayName` و`package.family` حزمة السجل
  المحلولة.
- تحدد `release.releaseId` و`release.version` و`release.createdAt` الإصدار
  الدقيق الذي تم تقييمه.
- تكون `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity`
  و`release.npmShasum` و`release.npmTarballName` موجودة عندما تكون معروفة
  لأثر الإصدار.
- `trust.scanStatus` هي حالة الثقة الفعلية المستمدة من مدخلات الماسح
  والإشراف اليدوي على الإصدار.
- `trust.moderationState` قابلة لأن تكون فارغة. تكون `null` عندما لا يوجد
  إشراف يدوي على الإصدار.
- `trust.blockedFromDownload` هي إشارة حظر التثبيت. يجب على OpenClaw وعملاء
  التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلًا من إعادة
  اشتقاق قواعد الحظر من حقول الماسح أو الإشراف.
- `trust.reasons` هي قائمة الشرح الموجهة للمستخدم والتدقيق. رموز الأسباب
  سلاسل مستقرة ومختصرة مثل `manual:quarantined` و`scan:malicious`
  و`package:malicious`.
- تعني `trust.pending` أن واحدًا أو أكثر من مدخلات الثقة لا يزال ينتظر الاكتمال.
- تعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة ويجب التعامل معه
  كأنه يتطلب تحديثًا قبل قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة على مستوى الإصدار. يجب على العملاء استدعاؤها بعد حل
  إصدار الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف الحزمة.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدًا من نقاط نهاية إشراف المالك/المشرف. إنها تكشف
  قرار التثبيت والشرح العام، لا هويات المبلغين أو نصوص البلاغات أو الأدلة
  الخاصة أو الجداول الزمنية الداخلية للمراجعة.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل الأثر الصريحة لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة أثر `legacy-zip` ورابط تنزيل ZIP قديمًا
  `downloadUrl`.
- تعيد إصدارات ClawPack أثر `npm-pack`، وحقول تكامل npm، و`tarballUrl`،
  ورابط توافق ZIP القديم.
- هذا هو سطح المحلل في OpenClaw؛ فهو يتجنب تخمين تنسيق الأرشيف من رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزّل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة بصيغة npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تشمل فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر ClawPack بصيغة npm-pack
- ملخص الأثر
- أصل مستودع المصدر والالتزام
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

نقطة نهاية للمشرفين لسرد صفوف ترحيل Plugins الرسمية في OpenClaw.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

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

- تُطبّع `bundledPluginId` إلى أحرف صغيرة وهي مفتاح upsert المستقر.
- يُطبّع `packageName` كاسم npm؛ يمكن أن تكون الحزمة مفقودة في عمليات
  الترحيل المخططة.
- يتتبع هذا جاهزية الترحيل فقط. لا يغيّر OpenClaw ولا ينشئ ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لطوابير مراجعة إصدارات الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، `blocked`، `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالات:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مُبلَّغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
- `manual`: أي إصدار له تجاوز إشراف يدوي.
- `all`: أي إصدار له تجاوز يدوي أو حالة فحص غير نظيفة أو بلاغ حزمة.

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

أبلغ عن حزمة لمراجعة المشرفين. البلاغات على مستوى الحزمة، وترتبط اختياريًا
بإصدار. إنها تغذي طابور الإشراف لكنها لا تخفي التنزيلات أو تحظرها تلقائيًا
بمفردها؛ يجب على المشرفين استخدام إشراف الإصدارات للموافقة على الآثار أو عزلها
أو إلغائها.

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

- تتطلب رمز API لمالك الحزمة، أو عضو الناشر، أو مشرف، أو
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

- يستخدم أحدث إصدار افتراضيا.
- يستخدم حصة معدل القراءة، لا حصة التنزيل.
- تعيد الملفات الثنائية `415`.
- حد حجم الملف: 200KB.
- لا تمنع فحوص VirusTotal المعلقة عمليات القراءة؛ قد تظل الإصدارات الخبيثة محجوبة في مواضع أخرى.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معاملات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيا.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip بجذر `package/` كي يستمر عمل عملاء OpenClaw
  القدامى.
- يبقى هذا المسار مقتصرا على ZIP. ولا يبث ملفات ClawPack ذات الامتداد `.tgz`.
- تتضمن الاستجابات ترويسات `ETag`، و`Digest`، و`X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` لفحوص سلامة المحلل.
- لا تُحقن البيانات الوصفية الخاصة بالسجل فقط في الأرشيف المنزل.
- لا تمنع فحوص VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقا مع npm لإصدارات الحزم المدعومة من ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي لديها أرشيفات tarball مرفوعة من نوع ClawPack npm-pack.
- تُحذف الإصدارات القديمة المقتصرة على ZIP عمدا.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولا متوافقة مع npm
  حتى يستطيع المستخدمون توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلا من مسار الطلب `/api/npm/@scope/name` ومسار npm
  المشفر `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات tarball المرفوعة بدقة من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حصة معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 الخاص بـ ClawHub إضافة إلى بيانات سلامة/شاسوم npm الوصفية.
- لا تزال فحوص الإشراف والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

تستخدمه CLI لربط بصمة محلية بإصدار معروف.

معاملات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي عشري من 64 محرفا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزل ZIP لإصدار Skill مستضاف، أو يعيد تسليما لمصدر GitHub من أجل
Skill حالي مدعوم من GitHub لديه فحص `clean` أو `suspicious` ولا توجد له
نسخة مستضافة.

معاملات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثلا `latest`)

ملاحظات:

- إذا لم يُقدّم `version` ولا `tag`، فسيُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفًا ناعمًا `410`.
- لا تنوب تسليمات Skills المدعومة من GitHub عن البايتات ولا تعكسها. تتضمن استجابة JSON
  `sourceRef: "public-github"` و`repo` و`commit` و`path` و`contentHash`
  و`archiveUrl`؛ حالة الفحص/الحالة الحالية بوابة وليست مضمنة كبيانات وصفية لحمولة نجاح.
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

- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات blob في `files[]`.
- يُقبل أيضا جسم JSON يحتوي على `files` (بناء على storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، تحل API هذا
  الناشر من جهة الخادم وتتطلب أن يكون للفاعل وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عند كونه `true` مع `ownerHandle`، قد تنتقل
  Skill موجودة إلى ذلك المالك إذا كان الفاعل مديرا/مالكا لدى كل من
  الناشرين الحالي والهدف. بدون هذا الاشتراك الصريح، تُرفض تغييرات المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموح بها هي `payload`، أو كائنات blob مكررة باسم `files`، أو مرجع tarball واحد باسم `clawpack`.
  قد يكون `clawpack` كائن blob بامتداد `.tgz` أو معرف تخزين تعيده
  آلية upload-url. يجب أن تتضمن عمليات النشر المرحلية بمعرف التخزين أيضا
  `clawpackUploadTicket` المعاد مع عنوان URL الخاص بذلك الرفع.
- استخدم إما `files` أو `clawpack`، ولا تستخدمهما معا في الطلب نفسه أبدا.
- تُرفض أجسام JSON والبيانات الوصفية `payload.files` / `payload.artifact`
  المقدمة من المستدعي.
- تُحدد طلبات النشر multipart المباشرة بسقف 18MB. ويمكن لأرشيفات ClawPack tarball
  استخدام آلية upload-url حتى سقف tarball البالغ 120MB.
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، يمكن للمديرين فقط النشر نيابة عن ذلك المالك.

أبرز نقاط التحقق:

- يجب أن تكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي عمليات رفع ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب code plugins وجود `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية لالتزام المصدر،
  وبيانات وصفية لمخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- يمكن فقط لناشر مؤسسة `openclaw` وأعضاء مؤسسة `openclaw` الحاليين
  النشر إلى القناة `official` عبر ناشريهم الشخصيين.
- لا تزال عمليات النشر نيابة عن الغير تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف ناعم / استعادة Skill (المالك أو المشرف أو المدير).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزن كملاحظة إشراف للـ Skill ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف الناعم التي يبدأها المالك الـ slug لمدة 30 يوما، ثم يمكن لناشر
آخر المطالبة بالـ slug. تتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانتهاء.
إخفاءات المشرف/المدير والإزالات الأمنية لا تنتهي بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسنًا
- `401`: غير مصرح
- `403`: محظور
- `404`: Skill/المستخدم غير موجود
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمدير فقط. يضمن وجود ناشر مؤسسة لمعرّف معين. إذا كان المعرّف لا يزال يشير إلى
مستخدم/ناشر شخصي مشترك قديم، فتنقله نقطة النهاية إلى ناشر مؤسسة أولا.
بالنسبة إلى مؤسسة منشأة حديثا، قدم `memberHandle`؛ لا يُضاف المدير الفاعل كعضو.
القيمة الافتراضية لـ `memberRole` هي `owner`.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ناشر مؤسسة بالخدمة الذاتية للمستخدمين المصادق عليهم. ينشئ ناشر مؤسسة جديدا ويضيف
المستدعي كمالك. لا تنقل نقطة النهاية هذه المعرّفات الموجودة للمستخدمين/الشخصيين ولا
تضع علامة موثوق/رسمي على الناشر.

- الجسم: `{ "handle": "opik", "displayName": "Opik" }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- تعيد `409` عندما يكون المعرّف مستخدما مسبقا من ناشر، أو مستخدم، أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمدير فقط. يحجز slugs الجذرية وأسماء الحزم للمالك الشرعي دون نشر
إصدار. تصبح أسماء الحزم حزما نائبة خاصة بلا صفوف إصدارات، بحيث يستطيع
المالك نفسه لاحقا نشر إصدار code-plugin أو bundle-plugin الحقيقي إلى ذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمدير فقط. يستعيد ناشرا شخصيا لمبدأ GitHub OAuth بديل تم التحقق منه
دون تعديل صفوف حساب Convex Auth. يجب أن يذكر الطلب كلا معرّفي حساب
مزود GitHub غير القابلين للتغيير؛ ولا تُستخدم المعرّفات القابلة للتغيير إلا كحاجز موجه للمشغل.

تكون القيمة الافتراضية لنقطة النهاية هي التشغيل الجاف. يتطلب تطبيق الاسترداد `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق الموظفون بشكل مستقل من الاستمرارية بين كلا
حسابَي GitHub الأساسيين. يفشل الاسترداد مغلقًا عندما يكون لدى الناشر الشخصي الحالي للمستخدم الوجهة
Skills أو حزم أو مصادر Skills من GitHub.
ينقل الاسترداد أيضًا حقول `ownerUserId` القديمة لـ Skills الخاصة بالناشر المسترد،
والأسماء المستعارة لمعرّفات Skills، والحزم، وتحذيرات مفتش الحزم، وصفوف ملخص البحث المشتقة بحيث
تتفق مسارات المالك المباشر مع سلطة الناشر الجديدة. كما يُعاد تعيين حجز مقبض محمي نشط
للمقبض المسترد إلى المستخدم البديل حتى لا تتمكن مزامنة الملف الشخصي لاحقًا
من استعادة سلطة المستخدم السابق المنافسة. يقتصر كل جدول أساسي على
100 صف لكل معاملة تطبيق؛ يجب أن تستخدم عمليات الاسترداد الأكبر أولًا ترحيل مالك قابلًا للاستئناف.
مصادر Skills من GitHub محددة بنطاق الناشر ويُبلّغ عنها على أنها مفحوصة بدلًا من إعادة كتابتها.

- المتن: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- الاستجابة: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط نهاية إدارة معرّف المالك

- `POST /api/v1/skills/{slug}/rename`
  - المتن: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - المتن: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب نقطتا النهاية مصادقة رمز API ولا تعملان إلا لمالك Skill.
- يحافظ `rename` على المعرّف السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` قائمة المصدر ويوجه معرّف المصدر إلى قائمة الهدف.

### نقاط نهاية نقل الملكية

- `POST /api/v1/skills/{slug}/transfer`
  - المتن: `{ "toUserHandle": "target_handle", "message": "optional" }`
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

المتن:

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

المتن:

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
المحتوى (للمسؤول فقط). تكون القيمة الافتراضية تشغيلًا جافًا ما لم تكن `dryRun` هي `false`.

المتن:

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

المتن:

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

اسرد المستخدمين أو ابحث عنهم (للمسؤول فقط).

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

أضف/أزل نجمة (إبرازات). كلتا نقطتي النهاية غير متأثرتين بالتكرار.

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

يعيد `POST /api/cli/upload-url` القيمتين `uploadUrl` و`uploadTicket`. يجب أن ترسل عمليات
نشر الحزم التي تجهز أرشيف ClawPack بصيغة tarball معرّف التخزين الناتج كـ
`clawpack` والتذكرة المعادة كـ `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيًا، فقدّم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ `CLAWDHUB_REGISTRY` القديم).
