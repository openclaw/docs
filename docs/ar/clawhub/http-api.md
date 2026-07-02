---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع واجهة برمجة تطبيقات HTTP (العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-07-02T08:20:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة برمجة تطبيقات HTTP

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

كل مسارات v1 تقع تحت `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الكتالوج العام

يمكن للأدلة التابعة لأطراف خارجية استخدام نقاط نهاية القراءة العامة لسرد Skills في ClawHub أو البحث عنها. يُرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وإعادة ربط المستخدمين بالقائمة القانونية في ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد موقع الطرف الخارجي. لا تحاول نسخ محتوى مخفي أو خاص أو محظور بالإشراف خارج سطح API العام.

تُحل اختصارات web slug عبر عائلات السجل، لكن على عملاء API استخدام
عناوين URL القانونية التي تعيدها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُنفذ لكل عنوان IP.
- الطلبات المصادَق عليها (رمز Bearer صالح): تُنفذ لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى إنفاذ عنوان IP.
- يجب ألا تعيد نقاط نهاية الكتابة المصادَق عليها قيمة `Unauthorized` مجردة عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة،
  والحسابات المحذوفة/المحظورة/المعطلة على نص قابل للتنفيذ حتى يستطيع عملاء CLI
  إخبار المستخدمين بما منعهم.

- القراءة: 3000/دقيقة لكل IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل IP، و6000/دقيقة لكل مفتاح (نقاط نهاية التنزيل)

الترويسات:

- توافق قديم: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- موحدة: `RateLimit-Limit`، `RateLimit-Reset`
- عند `429`: `X-RateLimit-Remaining: 0` و`RateLimit-Remaining: 0`
- عند `429`: `Retry-After`

دلالات الترويسات:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة الضبط (تأخير)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند وجودها.
  تحذف الطلبات الناجحة المجزأة هذه الترويسة بدلًا من إرجاع قيمة عالمية تقريبية.
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

- إذا كان `Retry-After` موجودًا، فانتظر هذا العدد من الثواني قبل إعادة المحاولة.
- استخدم تراجعًا بزمن عشوائي لتجنب إعادة المحاولات المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسبه من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم ترويسات IP العميل الموثوقة، بما في ذلك `cf-connecting-ip`، فقط عندما
  يفعّل النشر صراحةً الترويسات المُمررة الموثوقة.
- يستخدم ClawHub ترويسات التمرير الموثوقة لتحديد عناوين IP العملاء عند الحافة.
- إذا لم يكن IP عميل موثوق متاحًا، تستخدم الطلبات المجهولة حاويات احتياطية
  مقيّدة فقط بنوع حد المعدل. لا تتضمن هذه الحاويات الاحتياطية
  المسارات أو slugs أو أسماء الحزم أو الإصدارات أو سلاسل الاستعلام أو غيرها من
  معاملات الأثر التي يزوّدها المستدعي.

## استجابات الأخطاء

استجابات أخطاء v1 العامة هي نص عادي مع `content-type: text/plain; charset=utf-8`.
يشمل ذلك إخفاقات التحقق (`400`)، والموارد العامة المفقودة (`404`)، وإخفاقات المصادقة
والأذونات (`401`/`403`)، وحدود المعدل (`429`)، والتنزيلات المحظورة. يجب على العملاء
قراءة جسم الاستجابة كسلسلة مفهومة للبشر. تُتجاهل معاملات الاستعلام غير المعروفة
للتوافق، لكن معاملات الاستعلام المعروفة ذات القيم غير الصالحة تعيد
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

- تُعاد النتائج بترتيب الصلة (تشابه التضمين + تعزيزات مطابقة slug/رمز الاسم الدقيقة + أولوية شعبية صغيرة).
- الصلة أقوى من الشعبية. يمكن لمطابقة دقيقة لرمز slug أو اسم العرض أن تتفوق على مطابقة أوسع ذات تفاعل أقوى بكثير.
- يُجزّأ نص ASCII عند حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز `map` مستقل، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك يعطي البحث عن `map` لـ `personal-map` مطابقة معجمية أقوى من `amap-jsapi-skill`.
- تُقاس الشعبية بمقياس لوغاريتمي وتُحدد بسقف. يمكن أن تأتي Skills عالية التفاعل بترتيب أدنى عندما يكون نص الاستعلام مطابقته أضعف.
- يمكن لحالة الإشراف المشبوهة أو المخفية إزالة Skill من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشرين:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تغيّر اسم slug لمجرد ملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا قانونيًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL القانوني وslug المعروض وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على حل عناوين URL والتثبيتات القديمة التي تُحل عبر السجل، لكن ترتيب البحث يعتمد على بيانات Skill الوصفية القانونية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الموجودة مع Skill.
- إذا أصبحت Skill غير مرئية على نحو غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect @owner/slug` أثناء تسجيل الدخول قبل تغيير البيانات الوصفية المتعلقة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي ترتيب غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `recommended` (اسم مستعار: `default`)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، أسماء التثبيت القديمة المستعارة `installsCurrent`/`installs`/`installsAllTime` تُطابق إلى `downloads`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

تعيد قيم `sort` غير الصالحة `400`.

ملاحظات:

- يستخدم `recommended` إشارات التفاعل والحداثة.
- يرتب `trending` حسب التثبيتات في آخر 7 أيام (استنادًا إلى القياسات).
- `createdAt` مستقر لعمليات زحف Skills الجديدة؛ يتغير `updated` عندما يُعاد نشر Skills الموجودة.
- عندما يكون `nonSuspiciousOnly=true`، قد تعيد الترتيبات المستندة إلى المؤشر عناصر أقل من `limit` في الصفحة لأن Skills المشبوهة تُرشح بعد استرجاع الصفحة.
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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill القانونية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاص بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` هي `null` إذا لم تكن لدى Skill بيانات وصفية للمنصة.
- يُضمن `moderation` فقط عندما تكون Skill معلّمة أو عندما يعرضها المالك.

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

- يمكن للمالكين والمشرفين الوصول إلى تفاصيل الإشراف على Skills المخفية.
- يحصل المستدعون العامون على `200` فقط لـ Skills المرئية المعلّمة مسبقًا.
- تُنقح الأدلة للمستدعين العامين ولا تتضمن المقاطع الخام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

الإبلاغ عن Skill لمراجعة المشرف. تكون البلاغات على مستوى Skill، ومرتبطة اختياريًا
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

نقطة نهاية مشرف/مسؤول لاستقبال بلاغات Skill.

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

نقطة نهاية مشرف/مسؤول لحل بلاغات Skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "hide"` مع بلاغ تمت مراجعته
لإخفاء Skill ضمن سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد بيانات الإصدار الوصفية + قائمة الملفات.

- يتضمن `version.security` حالة التحقق المعيارية للمسح وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل التحقق من الفحص الأمني لإصدار Skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (على سبيل المثال `latest`).

ملاحظات:

- إذا لم يتم توفير `version` ولا `tag`، يُستخدم أحدث إصدار.
- يتضمن حالة تحقق مُطبَّعة بالإضافة إلى تفاصيل خاصة بالماسح.
- تكون `security.hasScanResult` بقيمة `true` فقط عندما يُصدر ماسح حُكمًا نهائيًا (`clean` أو `suspicious` أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى المهارة مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` على أنهما ضمن سياق الإصدار نفسه.

### `POST /api/v1/skills/-/scan`

نقطة إرسال مصادَق عليها لمهام ClawScan الجديدة.

لم تعد فحوصات الرفع المحلية مدعومة. تعيد الطلبات التي تستخدم
`multipart/form-data` أو `{ "source": { "kind": "upload" } }` الرمز `410`.

تستخدم فحوصات المنشور JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

ملاحظات:

- تنتهي صلاحية حمولات طلبات الفحص والتقارير القابلة للتنزيل من مخزن طلبات الفحص بعد نافذة الاحتفاظ.
- تتطلب فحوصات المنشور وصول إدارة المالك/الناشر، أو صلاحية مشرف/مدير المنصة.
- لا تكتب فحوصات المنشور النتائج إلا عندما تكون `update: true` ويكتمل الفحص بنجاح.
- تكون الاستجابة `202` مع `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- مهام الفحص غير متزامنة. تُمنح طلبات الفحص اليدوية أولوية قبل أعمال النشر/الملء الراجع العادية، لكن الإكمال لا يزال يعتمد على توفر العامل.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطة استطلاع مصادَق عليها لفحص مُرسَل.

- تعيد حالة في قائمة الانتظار/قيد التشغيل/ناجح/فاشل.
- تعيد `queue.queuedAhead` و`queue.position` أثناء الانتظار حتى تتمكن العملاء من إظهار عدد الفحوصات اليدوية ذات الأولوية الموجودة قبل الطلب. تُقيَّد الطوابير الكبيرة جدًا ويُبلَّغ عنها مع `queuedAheadIsEstimate: true`.
- عند توفره، يحتوي `report` على أقسام `clawscan` و`skillspector` و`staticAnalysis` و`virustotal`.
- تعيد مهام الفحص الفاشلة `status: "failed"` مع `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطة أرشيف تقرير مصادَق عليها.

- تتطلب فحصًا ناجحًا؛ تعيد الفحوصات غير النهائية `409`.
- تعيد ملف ZIP يحتوي على `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطة أرشيف تقرير مخزَّن مصادَق عليها للإصدارات المُرسَلة.

- تتطلب وصول إدارة المالك/الناشر إلى المهارة أو Plugin، أو صلاحية مشرف/مدير المنصة.
- تعيد نتائج الفحص المخزَّنة للإصدار المُرسَل بالضبط، بما في ذلك الإصدارات المحظورة أو المخفية.
- القيمة الافتراضية لـ `kind` هي `skill`؛ استخدم `kind=plugin` لفحوصات Plugin/الحزمة.
- تعيد شكل ZIP نفسه مثل تنزيلات طلبات الفحص.

### `POST /api/v1/skills/-/scan/batch`

مسار إعادة فحص دُفعي قانوني للمسؤولين فقط. يقبل شكل الحمولة نفسه مثل `POST /api/v1/skills/-/rescan-batch` القديم.

### `POST /api/v1/skills/-/scan/batch/status`

مسار حالة دُفعية قانوني للمسؤولين فقط. يقبل `{ "jobIds": ["..."] }` ويعيد عدادات التجميع نفسها مثل `POST /api/v1/skills/-/rescan-batch/status` القديم.

### `GET /api/v1/skills/{slug}/verify`

يعيد غلاف تحقق بطاقة المهارة المستخدم بواسطة `clawhub skill verify`.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): يحل إصدارًا موسومًا (على سبيل المثال `latest`).

ملاحظات:

- تكون `ok` بقيمة `true` فقط عندما يحتوي الإصدار المحدد على بطاقة مهارة مولَّدة، ولا يكون محظورًا كبرمجية خبيثة بواسطة الإشراف، ويكون تحقق ClawScan نظيفًا.
- تُعرض هوية المهارة، وهوية الناشر، وبيانات الإصدار المحدد الوصفية كحقول غلاف عليا (`slug` و`displayName` و`publisherHandle` و`version` و`resolvedFrom` و`tag` و`createdAt`) حتى تتمكن أتمتة الصدفة من قراءتها دون فك أغلفة متداخلة.
- `security` هو حكم ClawScan/الأمان على المستوى الأعلى. يجب أن تعتمد الأتمتة على `ok` و`decision` و`reasons` و`security.status`.
- يحتوي `security.signals` على أدلة داعمة من الماسحات مثل `staticScan` و`virusTotal` و`skillSpector`.
- يُحتفظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن ماسح وجود سجل الاعتماديات متقاعد وهذا المفتاح دائمًا `null`.
- تكون `provenance` بقيمة `server-resolved-github-import` فقط عندما يحل ClawHub ويخزن مستودع GitHub/مرجعًا/التزامًا/مسارًا أثناء النشر أو الاستيراد؛ وإلا تكون `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

يعيد أحكام الأمان المدمجة الحالية لإصدارات المهارات الدقيقة. نقطة نهاية
هذه المجموعة مخصصة للعملاء الذين يعرفون بالفعل إصدارات مهارات
ClawHub المثبتة التي يحتاجون إلى عرضها، مثل OpenClaw Control UI.

الطلب:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

ملاحظات:

- يجب أن يحتوي `items` على 1-100 زوج فريد من `{ slug, version }`.
- النتائج لكل عنصر؛ لا يؤدي فقدان مهارة أو إصدار واحد إلى فشل الاستجابة بالكامل.
- الاستجابة للأمان فقط. لا تتضمن بيانات بطاقة المهارة، أو حالة البطاقة المولَّدة، أو قوائم ملفات الأثر، أو حمولات الماسحات المفصلة.
- يحتوي `security.signals` على أدلة داعمة على مستوى الحالة فقط؛ استخدم `/scan` أو صفحة تدقيق أمان ClawHub للحصول على تفاصيل الماسح الكاملة.
- يُحتفظ بـ `security.signals.dependencyRegistry` للتوافق مع استجابة v1، لكن ماسح وجود سجل الاعتماديات متقاعد وهذا المفتاح دائمًا `null`.
- لا يؤثر غياب بطاقة المهارة في `ok` أو `decision` أو `reasons` لهذه النقطة؛ يجب على العملاء قراءة `skill-card.md` المثبت محليًا عندما يحتاجون إلى محتوى البطاقة.
- استخدم `/verify` عندما تحتاج إلى غلاف تحقق بطاقة مهارة واحدة، و`/card` عندما تحتاج إلى Markdown البطاقة المولَّدة، و`/scan` عندما تحتاج إلى بيانات ماسح مفصلة.

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

- يكون الافتراضي أحدث إصدار.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية كتالوج موحّدة لـ:

- skills
- إضافات الشيفرة
- إضافات الحزم

معاملات الاستعلام:

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
  وأسماء المرشحات المستعارة القديمة في v1 موثقة تحت `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` أو `sort` تعيد `400`. يتم تجاهل معاملات الاستعلام غير المعروفة.
- يبقى `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` اسمين مستعارين ثابتَي العائلة.
- تبقى إدخالات Skills مدعومة بسجل Skills ولا يزال نشرها ممكنًا فقط عبر `POST /api/v1/skills`.
- يظل `POST /api/v1/packages` مخصصًا فقط لإصدارات code-plugin وbundle-plugin.
- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- لا يعيد `channel=private` إلا الحزم التي يمكن للمستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث كتالوج موحّد عبر Skills + حزم Plugin.

معاملات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `category` (اختياري): مرشح فئة Plugin. مدعوم فقط عندما يكون
  الطلب محدد النطاق إلى حزم Plugin. الفئات المضبوطة وأسماء مرشحات v1
  المستعارة القديمة موثقة تحت `GET /api/v1/plugins`.

ملاحظات:

- القيم غير الصالحة لـ `family` أو `channel` أو `isOfficial` أو `featured` أو
  `highlightedOnly` تعيد `400`. يتم تجاهل معاملات الاستعلام غير المعروفة.
- لا يرى المستدعون المجهولون إلا قنوات الحزم العامة.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يمكن للمستدعي المصادق عليه قراءتها.

### `GET /api/v1/plugins`

تصفح كتالوج خاص بـ Plugin فقط عبر حزم code-plugin وbundle-plugin.

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `isOfficial` (اختياري): `true` أو `false`
- `sort` (اختياري): `recommended` (افتراضي)، `trending`، `downloads`، `updated`، الاسم المستعار القديم `installs`
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

تبقى أسماء مرشحات v1 المستعارة القديمة مقبولة على نقاط نهاية القراءة:

- تتحول `mcp-tooling` و`data` و`automation` إلى `tools`.
- تتحول `observability` و`deployment` إلى `gateway`.
- تتحول `dev-tools` إلى `runtime`.

`trending` هي لوحة صدارة للتثبيت/التنزيل لمدة سبعة أيام ولا تستخدم الإجماليات لكل الأوقات.
في نقطة النهاية الموحدة `/api/v1/packages` تكون خاصة بـ Plugin فقط؛ استخدم
`/api/v1/skills?sort=trending` لكتالوج Skills.

لا تُقبل الأسماء المستعارة القديمة كقيم فئات مخزنة أو معلنة من المؤلف.

### `GET /api/v1/skills/export`

تصدير جماعي لأحدث Skills العامة للتحليل دون اتصال.

المصادقة:

- رمز API مطلوب.

معاملات الاستعلام:

- `startDate` (مطلوب): حد أدنى بالمللي ثانية وفق Unix لـ `updatedAt` الخاص بـ Skill.
- `endDate` (مطلوب): حد أعلى بالمللي ثانية وفق Unix لـ `updatedAt` الخاص بـ Skill.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر ترقيم الصفحات من الاستجابة السابقة.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل Skill مصدّرة عند `{publisher}/{slug}/`.
- تتضمن Skills المستضافة أحدث ملفات الإصدار المخزنة وتُدرج في
  `_manifest.json` مع `sourceRef: "public-clawhub"`.
- تتضمن Skills الحالية المدعومة من GitHub ذات فحص `clean` أو `suspicious`
  ملف `_source_handoff.json` مع `sourceRef: "public-github"`، والمستودع، والالتزام، والمسار،
  وتجزئة المحتوى، ورابط URL للأرشيف. لا تتضمن ملفات المصدر المستضافة على ClawHub.
- تتضمن كل Skill ملف `_export_skill_meta.json`.
- يتم تضمين `_manifest.json` دائمًا في جذر ZIP.
- يتم تضمين `_errors.json` عندما لا يمكن تصدير Skills أو ملفات فردية.

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

معاملات الاستعلام:

- `startDate` (مطلوب): الحد الأدنى بالميلي ثانية وفق Unix لقيمة `updatedAt` الخاصة بـ Plugin.
- `endDate` (مطلوب): الحد الأعلى بالميلي ثانية وفق Unix لقيمة `updatedAt` الخاصة بـ Plugin.
- `limit` (اختياري): عدد صحيح (1-250)، الافتراضي `250`.
- `cursor` (اختياري): مؤشر الصفحات من الاستجابة السابقة.
- `family` (اختياري): `code-plugin` أو `bundle-plugin`. يعني حذفه عائلتي
  Plugin كلتيهما.

الاستجابة:

- الجسم: أرشيف ZIP.
- يكون جذر كل Plugin مصدّر عند `{family}/{packageName}/`.
- يتضمن كل Plugin مصدّر ملفات أحدث إصدار مخزّنة.
- تُخزّن بيانات تعريف التصدير لكل Plugin عند
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- يتم دائمًا تضمين `_manifest.json` في جذر ZIP.
- يتم تضمين `_errors.json` عندما يتعذر تصدير Plugins أو ملفات منفردة.

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
- `category` (اختياري): مرشح فئة Plugin. القيم الحالية:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

ملاحظات:

- تُقبل أيضًا الأسماء المستعارة القديمة لمرشحات v1 الموثقة ضمن `GET /api/v1/plugins`.
- ترشيح الفئات هو مرشح API حقيقي مدعوم بصفوف ملخص فئات Plugin،
  وليس إعادة كتابة لاستعلام البحث.
- تُرجع النتائج بترتيب الصلة ولا تدعم الصفحات حاليًا.
- عناصر تحكم الفرز في واجهة المتصفح لبحث Plugin تعيد ترتيب نتائج الصلة المحمّلة،
  بما يطابق سلوك التصفح الحالي في `/skills`.

### `GET /api/v1/packages/{name}`

يرجع بيانات تعريف تفصيلية للحزمة.

ملاحظات:

- يمكن أيضًا حل Skills عبر هذا المسار في الكتالوج الموحد.
- ترجع الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف حزمة وجميع إصداراتها حذفًا ناعمًا.

ملاحظات:

- يتطلب رمز API لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يرجع سجل الإصدارات.

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر الصفحات

ملاحظات:

- ترجع الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يرجع إصدار حزمة واحدًا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والتحقق، وبيانات تعريف الأثر، وبيانات الفحص.

ملاحظات:

- تكون `version.artifact.kind` بقيمة `legacy-zip` لأرشيفات الحزم القديمة أو
  `npm-pack` للإصدارات المدعومة بـ ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- `version.sha256hash` بيانات تعريف توافق مهملة للعملاء القدامى. وهي
  تجزّئ بايتات ZIP الدقيقة التي يرجعها `/api/v1/packages/{name}/download`.
  ينبغي للعملاء الأحدث استخدام `version.artifact.sha256`، الذي يحدد
  أثر الإصدار القانوني.
- يتم تضمين `version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan`
  عند وجود بيانات الفحص.
- ترجع الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/security`

يرجع ملخص الأمان والثقة الدقيق لإصدار الحزمة لعملاء التثبيت. هذا هو سطح
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

- تحدد `package.name` و`package.displayName` و`package.family`
  حزمة السجل المحلولة.
- تحدد `release.releaseId` و`release.version` و`release.createdAt`
  الإصدار الدقيق الذي تم تقييمه.
- تكون `release.artifactKind` و`release.artifactSha256` و`release.npmIntegrity`
  و`release.npmShasum` و`release.npmTarballName` موجودة عند معرفتها
  لأثر الإصدار.
- `trust.scanStatus` هي حالة الثقة الفعالة المشتقة من مدخلات الماسح
  ومراجعة الإصدار اليدوية.
- `trust.moderationState` قابلة للقيمة null. تكون `null` عند عدم وجود
  مراجعة إصدار يدوية.
- `trust.blockedFromDownload` هي إشارة حظر التثبيت. ينبغي لـ OpenClaw
  وعملاء التثبيت الآخرين حظر التثبيت عندما تكون هذه القيمة `true` بدلًا من
  إعادة اشتقاق قواعد الحظر من حقول الماسح أو المراجعة.
- `trust.reasons` هي قائمة الشرح الموجهة للمستخدم والتدقيق. رموز الأسباب
  سلاسل مستقرة ومضغوطة مثل `manual:quarantined` و`scan:malicious`
  و`package:malicious`.
- تعني `trust.pending` أن واحدًا أو أكثر من مدخلات الثقة لا يزال ينتظر الإكمال.
- تعني `trust.stale` أن ملخص الثقة حُسب من مدخلات قديمة وينبغي التعامل معه
  على أنه يتطلب تحديثًا قبل اتخاذ قرار سماح عالي الثقة.

ملاحظات:

- نقطة النهاية هذه دقيقة على مستوى الإصدار. ينبغي للعملاء استدعاؤها بعد حل
  إصدار الحزمة الذي ينوون تثبيته، وليس فقط بعد قراءة أحدث بيانات تعريف للحزمة.
- ترجع الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.
- نقطة النهاية هذه أضيق عمدًا من نقاط نهاية مراجعة المالك/المشرف. فهي تعرض
  قرار التثبيت والشرح العام، وليس هويات المبلّغين أو نصوص البلاغات أو الأدلة
  الخاصة أو الجداول الزمنية الداخلية للمراجعة.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يرجع بيانات تعريف محلل الأثر الصريحة لإصدار حزمة.

ملاحظات:

- ترجع إصدارات الحزم القديمة أثر `legacy-zip` و`downloadUrl` قديمًا لـ ZIP.
- ترجع إصدارات ClawPack أثر `npm-pack`، وحقول سلامة npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح المحلل في OpenClaw؛ وهو يتجنب تخمين تنسيق الأرشيف من
  رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزّل أثر الإصدار عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الدقيقة المرفوعة بصيغة npm-pack.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يرجع الجاهزية المحسوبة للاستهلاك المستقبلي في OpenClaw.

تغطي فحوص الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر أثر ClawPack بصيغة npm-pack
- ملخص الأثر
- مصدر مستودع المصدر وإثبات commit
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

معاملات الاستعلام:

- `phase` (اختياري): `planned`، `published`، `clawpack-ready`،
  `legacy-zip-only`، `metadata-ready`، `blocked`، `ready-for-openclaw`، أو
  `all` (الافتراضي).
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر الصفحات

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

- تتم تسوية `bundledPluginId` إلى أحرف صغيرة وهو مفتاح upsert المستقر.
- تتم تسوية `packageName` وفق اسم npm؛ ويمكن أن تكون الحزمة مفقودة
  للترحيلات المخطط لها.
- يتتبع هذا جاهزية الترحيل فقط. ولا يغيّر OpenClaw ولا يولّد ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لقوائم انتظار مراجعة إصدارات الحزم.

المصادقة:

- تتطلب رمز API لمستخدم مشرف أو مسؤول.

معاملات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر الصفحات

معاني الحالات:

- `open`: إصدارات مشبوهة أو خبيثة أو معلقة أو معزولة أو ملغاة أو مبلغ عنها.
- `blocked`: إصدارات معزولة أو ملغاة أو خبيثة.
- `manual`: أي إصدار لديه تجاوز مراجعة يدوي.
- `all`: أي إصدار لديه تجاوز يدوي، أو حالة فحص غير نظيفة، أو بلاغ حزمة.

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

أبلغ عن حزمة لمراجعة المشرف. البلاغات على مستوى الحزمة، ويمكن ربطها
اختياريًا بإصدار. وهي تغذي قائمة انتظار المراجعة لكنها لا تخفي التنزيلات
تلقائيًا ولا تحظرها بذاتها؛ ينبغي للمشرفين استخدام مراجعة الإصدار
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

- `approved`: تمت مراجعته يدوياً والسماح به.
- `quarantined`: محظور بانتظار متابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقاً سابقاً.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل القطع الأثرية.
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
- حد حجم الملف: 200 كيلوبايت.
- لا تمنع فحوصات VirusTotal المعلّقة القراءة؛ وقد تظل الإصدارات الخبيثة محجوبة في مكان آخر.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي قادراً على قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزّل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضياً.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip بجذر `package/` كي يستمر عمل عملاء OpenClaw
  القدامى.
- يبقى هذا المسار مقتصراً على ZIP. ولا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات سلامة المحلّل.
- لا تُحقن البيانات الوصفية الخاصة بالسجل فقط في الأرشيف المُنزّل.
- لا تمنع فحوصات VirusTotal المعلّقة التنزيلات؛ وتعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقاً مع npm لإصدارات الحزم المدعومة من ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي لديها tarballs مرفوعة من نوع ClawPack npm-pack.
- تُحذف عمداً الإصدارات القديمة المقتصرة على ZIP.
- تستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولاً متوافقة مع npm
  كي يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلاً من `/api/npm/@scope/name` ومسار طلب npm
  المرمّز `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات tarball الدقيقة المرفوعة من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 من ClawHub بالإضافة إلى بيانات npm الوصفية الخاصة بالسلامة/shasum.
- لا تزال فحوصات الإشراف والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

تستخدمه CLI لربط بصمة محلية بإصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي بطول 64 حرفاً لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزّل ملف ZIP لإصدار skill مستضاف، أو يعيد تسليماً إلى مصدر GitHub لمهارة
حالية مدعومة من GitHub لديها فحص `clean` أو `suspicious` ولا تملك إصداراً
مستضافاً.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم الوسم (مثل `latest`)

ملاحظات:

- إذا لم يُوفَّر `version` ولا `tag`، فسيُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفاً مرناً `410`.
- لا تقوم تسليمات مهارات GitHub بعمل وكيل للبايتات أو عكسها. تتضمن استجابة JSON
  `sourceRef: "public-github"` و`repo` و`commit` و`path` و`contentHash`
  و`archiveUrl`؛ وتكون حالة الفحص/الحالة الحالية بوابة ولا تُضمَّن كبيانات وصفية
  لحمولة النجاح.
- تُحسب إحصاءات التنزيل كهويات فريدة لكل يوم UTC (`userId` عندما يكون رمز API صالحاً، وإلا فعنوان IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من صحة الرمز ويعيد مقبض المستخدم.

### `POST /api/v1/skills`

ينشر إصداراً جديداً.

- المفضل: `multipart/form-data` مع JSON في `payload` + كتل `files[]`.
- يُقبل أيضاً جسم JSON يحتوي على `files` (مستندة إلى storageId).
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، تحل API ذلك
  الناشر من جانب الخادم وتتطلب أن يمتلك الفاعل صلاحية وصول إلى الناشر.
- حقل حمولة اختياري: `migrateOwner`. عند ضبطه على `true` مع `ownerHandle`، قد
  تنتقل skill موجودة إلى ذلك المالك إذا كان الفاعل مسؤولاً/مالكاً لدى كل من
  الناشرين الحالي والهدف. ومن دون هذا الاشتراك الصريح، تُرفض تغييرات المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- يتطلب `multipart/form-data`.
- حقول النموذج المسموح بها هي `payload`، أو كتل `files` المكررة، أو مرجع tarball واحد باسم `clawpack`.
  يمكن أن يكون `clawpack` كتلة `.tgz` أو معرّف تخزين أعاده
  تدفق upload-url. ويجب أن تتضمن عمليات النشر المرحلية بمعرّف التخزين أيضاً
  `clawpackUploadTicket` المعاد مع عنوان URL ذلك للرفع.
- استخدم إما `files` أو `clawpack`، ولا تستخدمهما معاً في الطلب نفسه.
- تُرفض أجسام JSON والبيانات الوصفية `payload.files` / `payload.artifact`
  المقدمة من المستدعي.
- تُحد طلبات النشر المباشر عبر multipart عند 18 ميغابايت. ويمكن أن
  تستخدم tarballs من ClawPack تدفق upload-url حتى حد tarball البالغ 120 ميغابايت.
- حقل حمولة اختياري: `ownerHandle`. عند وجوده، لا يجوز النشر نيابة عن ذلك المالك إلا للمسؤولين.

أبرز نقاط التحقق:

- يجب أن تكون `family` هي `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. ويجب أن تحتوي رفعات ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب Plugins البرمجية `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية للالتزام المصدر،
  وبيانات وصفية لمخطط التهيئة، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- لا يجوز النشر إلى قناة `official` إلا لناشر مؤسسة `openclaw` وأعضاء مؤسسة `openclaw` الحاليين
  عبر ناشريهم الشخصيين.
- لا تزال عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف مرن / استعادة skill (المالك أو المشرف أو المسؤول).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزّن كملاحظة إشراف للمهارة ويُنسخ إلى سجل التدقيق.
تحجز عمليات الحذف المرن التي يبدأها المالك slug لمدة 30 يوماً، ثم يمكن لناشر
آخر المطالبة بالـ slug. تتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانتهاء.
ولا تنتهي إخفاءات المشرف/المسؤول وعمليات الإزالة الأمنية بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسن
- `401`: غير مصرح
- `403`: محظور
- `404`: لم يتم العثور على skill/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمسؤول فقط. يضمن وجود ناشر مؤسسة لمقبض. إذا كان المقبض لا يزال يشير إلى
مستخدم/ناشر شخصي مشترك قديم، ترحّله نقطة النهاية أولاً إلى ناشر مؤسسة.
للمؤسسة المنشأة حديثاً، وفّر `memberHandle`؛ ولا يُضاف المسؤول الفاعل كعضو.
القيمة الافتراضية لـ `memberRole` هي `owner`.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

إنشاء ناشر مؤسسة بالخدمة الذاتية للمستخدمين المصادقين. ينشئ ناشر مؤسسة جديداً ويضيف
المستدعي كمالك. لا ترحّل نقطة النهاية هذه مقابض المستخدمين/الشخصية الحالية ولا
تضع علامة موثوق/رسمي على الناشر.

- الجسم: `{ "handle": "opik", "displayName": "Opik" }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- تعيد `409` عندما يكون المقبض مستخدماً بالفعل من قبل ناشر أو مستخدم أو ناشر شخصي.

### `POST /api/v1/users/reserve`

للمسؤول فقط. يحجز slugs الجذرية وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزماً نائبة خاصة بلا صفوف إصدار، بحيث يمكن
للمالك نفسه لاحقاً نشر إصدار code-plugin أو bundle-plugin الحقيقي إلى ذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

للمسؤول فقط. يستعيد ناشراً شخصياً لمبدأ GitHub OAuth بديل تم التحقق منه
من دون تعديل صفوف حساب Convex Auth. يجب أن يذكر الطلب كلا معرّفي حساب
مزود GitHub غير القابلين للتغيير؛ وتُستخدم المقابض القابلة للتغيير فقط كحاجز مواجه للمشغّل.

يكون الإعداد الافتراضي لنقطة النهاية هو التشغيل الجاف. يتطلب تطبيق الاسترداد `dryRun: false` و
`confirmIdentityVerified: true` بعد أن يتحقق الموظفون بشكل مستقل من الاستمرارية بين كلا
حسابي GitHub الأساسيين. يفشل الاسترداد بإغلاق آمن عندما يكون للناشر الشخصي الحالي للمستخدم الوجهة
Skills أو حزم أو مصادر Skills من GitHub.
ينقل الاسترداد أيضًا حقول `ownerUserId` القديمة الخاصة بـ Skills الناشر المسترد،
وأسماء Skills المستعارة للـ slug، والحزم، وتحذيرات مفتش الحزم، وصفوف ملخص البحث المشتقة بحيث
تتوافق مسارات المالك المباشر مع سلطة الناشر الجديدة. كما يُعاد إسناد حجز المقبض المحمي النشط
للمقبض المسترد إلى المستخدم البديل، بحيث لا يمكن لمزامنة الملف الشخصي اللاحقة استعادة سلطة المستخدم السابق المنافسة. كل جدول أساسي محدود بـ
100 صف لكل معاملة تطبيق؛ ويجب أن تستخدم عمليات الاسترداد الأكبر أولًا ترحيل مالك قابلًا للاستئناف.
مصادر Skills من GitHub scoped حسب الناشر، ويُبلّغ عنها بوصفها مفحوصة بدلًا من إعادة كتابتها.

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

- تتطلب كلتا نقطتي النهاية مصادقة رمز API ولا تعملان إلا لمالك Skill.
- يحافظ `rename` على slug السابق بوصفه اسمًا مستعارًا لإعادة التوجيه.
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

حظر مستخدم وحذف Skills المملوكة حذفًا نهائيًا (للمشرف/المدير فقط).

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

تغيير السبب المخزن لحظر موجود دون إلغاء الحظر أو استعادة
المحتوى (للمدير فقط). الإعداد الافتراضي هو التشغيل الجاف ما لم تكن `dryRun` هي `false`.

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

معلمات الاستعلام:

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

لا تزال مدعومة لإصدارات CLI الأقدم:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

راجع `DEPRECATIONS.md` لخطة الإزالة.

يعيد `POST /api/cli/upload-url` القيمتين `uploadUrl` و `uploadTicket`. يجب على عمليات نشر الحزم
التي تضع أرشيف ClawPack مرحليًا إرسال معرف التخزين الناتج باسم
`clawpack` والتذكرة المعادة باسم `clawpackUploadTicket`.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيًا، فقدّم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ القديم `CLAWDHUB_REGISTRY`).
