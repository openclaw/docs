---
read_when:
    - إضافة/تغيير نقاط النهاية
    - تصحيح أخطاء طلبات CLI ↔ السجل
summary: مرجع HTTP API (النقاط النهائية العامة + نقاط نهاية CLI + المصادقة).
x-i18n:
    generated_at: "2026-05-12T00:57:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# واجهة HTTP API

عنوان URL الأساسي: `https://clawhub.ai` (الافتراضي).

جميع مسارات v1 تقع تحت `/api/v1/...`.
تبقى المسارات القديمة `/api/...` و`/api/cli/...` للتوافق (راجع `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## إعادة استخدام الفهرس العام

يمكن للأدلة الخارجية استخدام نقاط نهاية القراءة العامة لسرد أو البحث في Skills الخاصة بـ ClawHub. يُرجى تخزين النتائج مؤقتًا، واحترام `429`/`Retry-After`، وربط المستخدمين بالقائمة الرسمية في ClawHub (`https://clawhub.ai/<owner>/<slug>`)، وتجنب الإيحاء بأن ClawHub يؤيد الموقع الخارجي. لا تحاول عكس المحتوى المخفي أو الخاص أو المحظور بالإشراف خارج سطح API العام.

تُحل اختصارات slug على الويب عبر عائلات السجل، لكن يجب على عملاء API استخدام
عناوين URL الرسمية التي تعيدها نقاط نهاية القراءة بدلًا من إعادة بناء أسبقية
المسارات.

## حدود المعدل

نموذج الإنفاذ:

- الطلبات المجهولة: تُفرض لكل عنوان IP.
- الطلبات الموثقة (رمز Bearer صالح): تُفرض لكل حاوية مستخدم.
- إذا كان الرمز مفقودًا/غير صالح، يعود السلوك إلى الإنفاذ حسب IP.
- يجب ألا تعيد نقاط نهاية الكتابة الموثقة مجرد `Unauthorized` عندما
  يعرف الخادم السبب. يجب أن تحصل الرموز المفقودة، والرموز غير الصالحة/الملغاة،
  والحسابات المحذوفة/المحظورة/المعطلة كلٌ منها على نص قابل للتصرف حتى يتمكن عملاء CLI
  من إخبار المستخدمين بما حظرهم.

- القراءة: 600/دقيقة لكل IP، و2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل IP، و180/دقيقة لكل مفتاح
- التنزيل: 30/دقيقة لكل IP، و180/دقيقة لكل مفتاح (`/api/v1/download`)

الرؤوس:

- توافق قديم: `X-RateLimit-Limit`، `X-RateLimit-Remaining`، `X-RateLimit-Reset`
- موحدة: `RateLimit-Limit`، `RateLimit-Remaining`، `RateLimit-Reset`
- عند `429`: `Retry-After`

دلالات الرؤوس:

- `X-RateLimit-Reset`: ثواني حقبة Unix المطلقة
- `RateLimit-Reset`: الثواني حتى إعادة التعيين (تأخير)
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
- استخدم تراجعًا مع تشويش عشوائي لتجنب عمليات إعادة المحاولة المتزامنة.
- إذا كان `Retry-After` مفقودًا، فارجع إلى `RateLimit-Reset` (أو احسب من `X-RateLimit-Reset`).

مصدر IP:

- يستخدم `cf-connecting-ip` (Cloudflare) لعنوان IP الخاص بالعميل افتراضيًا.
- يستخدم ClawHub رؤوس إعادة توجيه موثوقة لتحديد عناوين IP الخاصة بالعملاء عند الحافة.
- إذا لم يتوفر عنوان IP موثوق للعميل، تستخدم طلبات التنزيل المجهولة حاوية احتياطية محددة لنقطة النهاية بدلًا من حاوية عامة واحدة `ip:unknown`. لا تزال طلبات القراءة/الكتابة المجهولة تستخدم حاوية المجهول المشتركة حتى تبقى مسارات IP المفقود مرئية ومحافظة.

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
      "updatedAt": 1730000000000
    }
  ]
}
```

ملاحظات:

- تُعاد النتائج بترتيب الملاءمة (تشابه التضمين + تعزيزات تطابق رمز slug/الاسم الدقيقة + أولوية الشعبية من التنزيلات).
- الملاءمة أقوى من الشعبية. يمكن لتطابق دقيق لرمز slug أو اسم العرض أن يتفوق على تطابق أوسع لديه تنزيلات أكثر بكثير.
- يُجزأ نص ASCII على حدود الكلمات وعلامات الترقيم. على سبيل المثال، يحتوي `personal-map` على رمز مستقل `map`، بينما يحتوي `amap-jsapi-skill` على `amap` و`jsapi` و`skill`؛ لذلك فإن البحث عن `map` يعطي `personal-map` تطابقًا معجميًا أقوى من `amap-jsapi-skill`.
- تُستخدم التنزيلات كأولوية صغيرة بمقياس لوغاريتمي وكعامل حسم عند التعادل، وليست إشارة الترتيب الأساسية. يمكن أن تحصل Skills عالية التنزيلات على ترتيب أدنى عندما يكون نص الاستعلام أضعف تطابقًا.
- يمكن لحالة الإشراف المشبوهة أو المخفية أن تزيل Skill من البحث العام حسب مرشحات المستدعي وحالة الإشراف الحالية.

إرشادات قابلية اكتشاف الناشر:

- ضع المصطلحات التي سيبحث عنها المستخدمون حرفيًا في اسم العرض والملخص والوسوم. استخدم رمز slug مستقلًا فقط عندما يكون أيضًا هوية مستقرة تريد الاحتفاظ بها.
- لا تعد تسمية slug فقط لملاحقة استعلام واحد إلا إذا كان slug الجديد اسمًا رسميًا أفضل على المدى الطويل. تصبح slugs القديمة أسماء مستعارة لإعادة التوجيه، لكن عنوان URL الرسمي، وslug المعروض، وملخصات البحث المستقبلية تستخدم slug الجديد.
- تحافظ أسماء إعادة التسمية المستعارة على الحل لعناوين URL القديمة وعمليات التثبيت التي تُحل عبر السجل، لكن ترتيب البحث يعتمد على بيانات تعريف Skill الرسمية بعد فهرسة إعادة التسمية. تبقى الإحصاءات الحالية مع Skill.
- إذا كانت Skill غير مرئية على نحو غير متوقع، فتحقق أولًا من حالة الإشراف باستخدام `clawhub inspect <slug>` أثناء تسجيل الدخول قبل تغيير بيانات التعريف المتعلقة بالترتيب.

### `GET /api/v1/skills`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–200)
- `cursor` (اختياري): مؤشر ترقيم الصفحات لأي ترتيب غير `trending`
- `sort` (اختياري): `updated` (افتراضي)، `createdAt` (اسم مستعار: `newest`)، `downloads`، `stars` (اسم مستعار: `rating`)، `installsCurrent` (اسم مستعار: `installs`)، `installsAllTime`، `trending`
- `nonSuspiciousOnly` (اختياري): `true` لإخفاء Skills المشبوهة (`flagged.suspicious`)
- `nonSuspicious` (اختياري): اسم مستعار قديم لـ `nonSuspiciousOnly`

ملاحظات:

- يرتب `trending` حسب عمليات التثبيت في آخر 7 أيام (مستند إلى القياسات عن بُعد).
- يكون `createdAt` ثابتًا لعمليات الزحف إلى Skills الجديدة؛ ويتغير `updated` عند إعادة نشر Skills الحالية.
- عند `nonSuspiciousOnly=true`، قد تعيد عمليات الترتيب المستندة إلى المؤشر عناصر أقل من `limit` في صفحة لأن Skills المشبوهة تُرشح بعد استرداد الصفحة.
- استخدم `nextCursor` لمتابعة ترقيم الصفحات عند وجوده. لا تعني الصفحة القصيرة بحد ذاتها نهاية النتائج.

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

- تُحل slugs القديمة التي أنشأتها تدفقات إعادة تسمية/دمج المالك إلى Skill الرسمية.
- `metadata.os`: قيود نظام التشغيل المعلنة في frontmatter الخاصة بـ Skill (مثل `["macos"]`، `["linux"]`). تكون `null` إذا لم تُعلن.
- `metadata.systems`: أهداف نظام Nix (مثل `["aarch64-darwin", "x86_64-linux"]`). تكون `null` إذا لم تُعلن.
- تكون `metadata` هي `null` إذا لم تكن لدى Skill بيانات تعريف للمنصة.
- يُضمّن `moderation` فقط عندما تكون Skill معلّمة أو عندما يعرضها المالك.

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
- لا يحصل المستدعون العامون إلا على `200` لـ Skills المرئية المعلّمة مسبقًا.
- تُحجب الأدلة للمستدعين العامين ولا تتضمن مقتطفات خام إلا للمالكين/المشرفين.

### `POST /api/v1/skills/{slug}/report`

أبلغ عن Skill لمراجعة المشرف. تكون البلاغات على مستوى Skill، ويمكن ربطها اختياريًا
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

نقطة نهاية المشرف/المدير لاستقبال بلاغات Skill.

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

نقطة نهاية المشرف/المدير لحل بلاغات Skill أو إعادة فتحها.

الطلب:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ وقد يُحذف عند
إعادة تعيين `status` إلى `open`. مرر `finalAction: "hide"` مع بلاغ مُفرز
لإخفاء Skill في سير العمل نفسه القابل للتدقيق.

### `GET /api/v1/skills/{slug}/versions`

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح
- `cursor` (اختياري): مؤشر ترقيم الصفحات

### `GET /api/v1/skills/{slug}/versions/{version}`

يعيد بيانات تعريف الإصدار + قائمة الملفات.

- يتضمن `version.security` حالة تحقق الفحص المُطبّعة وتفاصيل الماسح
  (VirusTotal + LLM)، عند توفرها.

### `GET /api/v1/skills/{slug}/scan`

يعيد تفاصيل تحقق فحص الأمان لإصدار Skill.

معاملات الاستعلام:

- `version` (اختياري): سلسلة إصدار محددة.
- `tag` (اختياري): حل إصدار موسوم (مثل `latest`).

ملاحظات:

- إذا لم يُقدم لا `version` ولا `tag`، يستخدم أحدث إصدار.
- يتضمن حالة تحقق مُطبّعة بالإضافة إلى تفاصيل خاصة بالماسح.
- يتضمن `security.capabilityTags` تسميات قدرات/مخاطر حتمية مثل
  `crypto`، و`requires-wallet`، و`can-make-purchases`، و`can-sign-transactions`،
  و`requires-oauth-token`، و`posts-externally` عند اكتشافها.
- يكون `security.hasScanResult` هو `true` فقط عندما ينتج ماسح حكمًا حاسمًا (`clean`، أو `suspicious`، أو `malicious`).
- `moderation` هي لقطة إشراف حالية على مستوى Skill مشتقة من أحدث إصدار.
- عند الاستعلام عن إصدار تاريخي، تحقق من `moderation.matchesRequestedVersion` و`moderation.sourceVersion` قبل التعامل مع `moderation` و`security` على أنهما في سياق الإصدار نفسه.

### `GET /api/v1/skills/{slug}/file`

يعيد محتوى نصيًا خامًا.

معاملات الاستعلام:

- `path` (مطلوب)
- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- حد حجم الملف: 200KB.

### `GET /api/v1/packages`

نقطة نهاية فهرس موحدة لـ:

- Skills
- Plugins برمجية
- Plugins حزمية

معاملات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح القدرات لحزم Plugin
- `target` / `hostTarget` (اختياري): اختصار لـ `host:<target>`
- `os`، `arch`، `libc` (اختياري): اختصار لمرشحات قدرة المضيف
- `requiresBrowser`، `requiresDesktop`، `requiresNativeDeps`،
  `requiresExternalService`، `requiresBinary`، `requiresOsPermission`
  (اختياري): اختصار `true`/`1` لوسوم متطلبات البيئة
- `externalService`، `binary`، `osPermission` (اختياري): اختصار لوسوم متطلبات
  البيئة المسماة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` لإظهار إصدارات الحزم المدعومة من ClawPack
  والمتاحة عبر مرآة npm

ملاحظات:

- يبقى `GET /api/v1/code-plugins` و`GET /api/v1/bundle-plugins` أسماء مستعارة ثابتة العائلة.
- تظل إدخالات Skills مدعومة بسجل Skills، ولا يزال يمكن نشرها فقط عبر `POST /api/v1/skills`.
- لا يزال `POST /api/v1/packages` مخصصا فقط لإصدارات code-plugin وbundle-plugin.
- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم رؤية الحزم الخاصة للناشرين الذين ينتمون إليهم في نتائج القائمة/البحث.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.

### `GET /api/v1/packages/search`

بحث موحد في الفهرس عبر Skills + حزم Plugin.

معلمات الاستعلام:

- `q` (مطلوب): سلسلة الاستعلام
- `limit` (اختياري): عدد صحيح (1–100)
- `family` (اختياري): `skill` أو `code-plugin` أو `bundle-plugin`
- `channel` (اختياري): `official` أو `community` أو `private`
- `isOfficial` (اختياري): `true` أو `false`
- `executesCode` (اختياري): `true` أو `false`
- `capabilityTag` (اختياري): مرشح القدرات لحزم Plugin
- يتم قبول `target` / `hostTarget` و`os` و`arch` و`libc` و`requiresBrowser`
  و`requiresDesktop` و`requiresNativeDeps` و`requiresExternalService`
  و`requiresBinary` و`requiresOsPermission` و`externalService` و`binary` و
  `osPermission` كاختصارات لوسوم القدرات الشائعة
- `artifactKind` (اختياري): `legacy-zip` أو `npm-pack`
- `npmMirror` (اختياري): `true`/`1` للبحث في إصدارات الحزم المدعومة من ClawPack
  والمتاحة عبر مرآة npm

ملاحظات:

- يرى المستدعون المجهولون قنوات الحزم العامة فقط.
- يمكن للمستدعين المصادق عليهم البحث في الحزم الخاصة للناشرين الذين ينتمون إليهم.
- لا يعيد `channel=private` إلا الحزم التي يستطيع المستدعي المصادق عليه قراءتها.
- تستند مرشحات العناصر الأثرية إلى وسوم قدرات مفهرسة:
  `artifact:legacy-zip` و`artifact:npm-pack` و`npm-mirror:available`.

### `GET /api/v1/packages/{name}`

يعيد بيانات تعريف تفاصيل الحزمة.

ملاحظات:

- يمكن أيضا حل Skills عبر هذا المسار في الفهرس الموحد.
- تعيد الحزم الخاصة `404` ما لم يستطع المستدعي قراءة الناشر المالك.

### `DELETE /api/v1/packages/{name}`

يحذف الحزمة وجميع الإصدارات حذفا ميسرا.

ملاحظات:

- يتطلب رمز API مميزا لمالك الحزمة، أو مالك/مسؤول ناشر مؤسسة،
  أو مشرف المنصة، أو مسؤول المنصة.

### `GET /api/v1/packages/{name}/versions`

يعيد سجل الإصدارات.

معلمات الاستعلام:

- `limit` (اختياري): عدد صحيح (1–100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

ملاحظات:

- تعيد الحزم الخاصة `404` ما لم يستطع المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}`

يعيد إصدار حزمة واحدا، بما في ذلك بيانات تعريف الملفات، والتوافق،
والقدرات، والتحقق، وبيانات تعريف العنصر الأثري، وبيانات الفحص.

ملاحظات:

- يكون `version.artifact.kind` هو `legacy-zip` لأرشيفات حزم العالم القديم أو
  `npm-pack` للإصدارات المدعومة من ClawPack.
- تتضمن إصدارات ClawPack حقول `npmIntegrity` و`npmShasum` و
  `npmTarballName` المتوافقة مع npm.
- يتم تضمين `version.sha256hash` و`version.vtAnalysis` و`version.llmAnalysis` و`version.staticScan` عند وجود بيانات فحص.
- تعيد الحزم الخاصة `404` ما لم يستطع المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

يعيد بيانات تعريف محلل العنصر الأثري الصريح لإصدار حزمة.

ملاحظات:

- تعيد إصدارات الحزم القديمة عنصرا أثريا `legacy-zip` ورابط تنزيل ZIP قديما
  `downloadUrl`.
- تعيد إصدارات ClawPack عنصرا أثريا `npm-pack`، وحقول تكامل npm، و
  `tarballUrl`، ورابط توافق ZIP القديم.
- هذا هو سطح المحلل في OpenClaw؛ فهو يتجنب تخمين تنسيق الأرشيف من
  رابط مشترك.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ينزل عنصر الإصدار الأثري عبر مسار المحلل الصريح.

ملاحظات:

- تبث إصدارات ClawPack بايتات `.tgz` الخاصة بـ npm-pack المرفوع بالضبط.
- تعيد إصدارات ZIP القديمة التوجيه إلى `/api/v1/packages/{name}/download?version=`.
- يستخدم حاوية معدل التنزيل.

### `GET /api/v1/packages/{name}/readiness`

يعيد الجاهزية المحسوبة لاستهلاك OpenClaw المستقبلي.

تغطي فحوصات الجاهزية:

- حالة القناة الرسمية
- توفر أحدث إصدار
- توفر عنصر ClawPack npm-pack الأثري
- ملخص العنصر الأثري
- مصدر مستودع المصدر والالتزام
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

- تتطلب رمز API مميزا لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `phase` (اختياري): `planned` أو `published` أو `clawpack-ready`
  أو `legacy-zip-only` أو `metadata-ready` أو `blocked` أو `ready-for-openclaw` أو
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

نقطة نهاية للمسؤولين لإنشاء صف ترحيل Plugin رسمي أو تحديثه.

المصادقة:

- تتطلب رمز API مميزا لمستخدم مسؤول.

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

- يتم تطبيع `bundledPluginId` إلى أحرف صغيرة، وهو مفتاح upsert الثابت.
- يتم تطبيع `packageName` كاسم npm؛ يمكن أن تكون الحزمة غير موجودة للترحيلات
  المخطط لها.
- يتتبع هذا جاهزية الترحيل فقط. ولا يغير OpenClaw أو ينشئ ClawPacks.

### `GET /api/v1/packages/moderation/queue`

نقطة نهاية للمشرفين/المسؤولين لقوائم انتظار مراجعة إصدارات الحزم.

المصادقة:

- تتطلب رمز API مميزا لمستخدم مشرف أو مسؤول.

معلمات الاستعلام:

- `status` (اختياري): `open` (الافتراضي)، أو `blocked`، أو `manual`، أو `all`
- `limit` (اختياري): عدد صحيح (1-100)
- `cursor` (اختياري): مؤشر ترقيم الصفحات

معاني الحالة:

- `open`: إصدارات مشبوهة، أو ضارة، أو معلقة، أو معزولة، أو ملغاة، أو مبلغ عنها.
- `blocked`: إصدارات معزولة، أو ملغاة، أو ضارة.
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

الإبلاغ عن حزمة لمراجعة المشرف. تكون البلاغات على مستوى الحزمة، ويمكن ربطها
اختياريا بإصدار. إنها تغذي قائمة انتظار الإشراف لكنها لا تخفي التنزيلات أو
تحظرها تلقائيا بذاتها؛ ينبغي للمشرفين استخدام إشراف الإصدارات
للموافقة على العناصر الأثرية أو عزلها أو إلغائها.

المصادقة:

- تتطلب رمز API مميزا.

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

نقطة نهاية للمشرفين/المسؤولين لاستقبال بلاغات الحزم.

المصادقة:

- تتطلب رمز API مميزا لمستخدم مشرف أو مسؤول.

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

نقطة نهاية للمالك/المشرف لرؤية إشراف الحزمة.

المصادقة:

- تتطلب رمز API مميزا لمالك الحزمة، أو عضو الناشر، أو المشرف، أو
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

نقطة نهاية للمشرفين/المسؤولين لحل بلاغات الحزم أو إعادة فتحها.

الطلب:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` مطلوب لـ `confirmed` و`dismissed`؛ ويمكن حذفه عند
إعادة تعيين `status` إلى `open`. مرّر `finalAction: "quarantine"` أو
`finalAction: "revoke"` مع تقرير مؤكد لتطبيق الإشراف على الإصدار ضمن
سير العمل القابل للتدقيق نفسه.

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

- `approved`: تمت مراجعته يدويًا والسماح به.
- `quarantined`: محظور بانتظار المتابعة.
- `revoked`: محظور بعد أن كان الإصدار موثوقًا به سابقًا.

تعيد الإصدارات المعزولة والملغاة `403` من مسارات تنزيل المصنوعات.
يكتب كل تغيير إدخالًا في سجل التدقيق.

### `POST /api/v1/packages/backfill/artifacts`

نقطة نهاية صيانة للمديرين فقط لتسمية إصدارات الحزم الأقدم
ببيانات وصفية صريحة لنوع المصنوعة.

جسم الطلب:

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

- القيمة الافتراضية هي التشغيل التجريبي.
- الإصدارات التي لا تحتوي على تخزين ClawPack تُسمى `legacy-zip`.
- تُصلح الصفوف الحالية المدعومة بـ ClawPack التي تفتقد `artifactKind` على أنها
  `npm-pack`.
- لا يؤدي هذا إلى إنشاء ClawPacks أو تعديل بايتات المصنوعات.

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
- لا تمنع فحوصات VirusTotal المعلقة عمليات القراءة؛ وقد تظل الإصدارات الخبيثة محجوبة في موضع آخر.
- تعيد الحزم الخاصة `404` ما لم يكن بإمكان المستدعي قراءة الناشر المالك.

### `GET /api/v1/packages/{name}/download`

ينزّل أرشيف ZIP الحتمي القديم لإصدار حزمة.

معلمات الاستعلام:

- `version` (اختياري)
- `tag` (اختياري)

ملاحظات:

- يستخدم أحدث إصدار افتراضيًا.
- تعيد Skills التوجيه إلى `GET /api/v1/download`.
- أرشيفات Plugin/الحزم هي ملفات zip بجذر `package/` بحيث يظل عملاء OpenClaw
  القدامى يعملون.
- يبقى هذا المسار مخصصًا لـ ZIP فقط. ولا يبث ملفات ClawPack `.tgz`.
- تتضمن الاستجابات ترويسات `ETag` و`Digest` و`X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` لفحوصات تكامل المحلل.
- لا تُحقن البيانات الوصفية الخاصة بالسجل فقط في الأرشيف المنزّل.
- لا تمنع فحوصات VirusTotal المعلقة التنزيلات؛ تعيد الإصدارات الخبيثة `403`.
- تعيد الحزم الخاصة `404` ما لم يكن المستدعي هو المالك.

### `GET /api/npm/{package}`

يعيد packument متوافقًا مع npm لإصدارات الحزم المدعومة بـ ClawPack.

ملاحظات:

- تُدرج فقط الإصدارات التي تحتوي على كرات tar من نوع ClawPack npm-pack مرفوعة.
- تُحذف عمدًا الإصدارات القديمة المقتصرة على ZIP.
- يستخدم `dist.tarball` و`dist.integrity` و`dist.shasum` حقولًا متوافقة مع npm
  حتى يتمكن المستخدمون من توجيه npm إلى المرآة إذا اختاروا ذلك.
- تدعم packuments الحزم ذات النطاق كلًا من `/api/npm/@scope/name` ومسار طلب npm
  المشفر `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

يبث بايتات كرة tar المرفوعة نفسها من ClawPack لعملاء مرآة npm.

ملاحظات:

- يستخدم حاوية معدل التنزيل.
- تتضمن ترويسات التنزيل SHA-256 الخاص بـ ClawHub بالإضافة إلى بيانات npm الوصفية للتكامل/shasum.
- لا تزال فحوصات الإشراف والوصول إلى الحزم الخاصة مطبقة.

### `GET /api/v1/resolve`

تستخدمه CLI لمطابقة بصمة محلية مع إصدار معروف.

معلمات الاستعلام:

- `slug` (مطلوب)
- `hash` (مطلوب): sha256 سداسي عشري بطول 64 محرفًا لبصمة الحزمة

الاستجابة:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ينزّل ملف zip لإصدار Skills.

معلمات الاستعلام:

- `slug` (مطلوب)
- `version` (اختياري): سلسلة semver
- `tag` (اختياري): اسم وسم (مثل `latest`)

ملاحظات:

- إذا لم يُقدّم `version` ولا `tag`، يُستخدم أحدث إصدار.
- تعيد الإصدارات المحذوفة حذفًا ناعمًا `410`.
- تُحتسب إحصاءات التنزيل كهويات فريدة لكل ساعة (`userId` عندما يكون رمز API صالحًا، وإلا فعنوان IP).

## نقاط نهاية المصادقة (رمز Bearer)

تتطلب كل نقاط النهاية:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

يتحقق من الرمز ويعيد معرّف المستخدم.

### `POST /api/v1/skills`

ينشر إصدارًا جديدًا.

- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات ثنائية `files[]`.
- يُقبل أيضًا جسم JSON مع `files` (مستندة إلى storageId).
- حقل اختياري في الحمولة: `ownerHandle`. عند وجوده، يحل API ذلك
  الناشر من جهة الخادم ويتطلب أن يمتلك الفاعل وصولًا إلى الناشر.
- حقل اختياري في الحمولة: `migrateOwner`. عند تعيينه إلى `true` مع `ownerHandle`، يمكن نقل
  Skills موجودة إلى ذلك المالك إذا كان الفاعل مديرًا/مالكًا لدى كل من
  الناشرين الحالي والهدف. من دون هذا الاشتراك الصريح، تُرفض تغييرات المالك.

### `POST /api/v1/packages`

ينشر إصدار code-plugin أو bundle-plugin.

- يتطلب مصادقة رمز Bearer.
- المفضل: `multipart/form-data` مع JSON في `payload` + كائنات ثنائية `files[]`.
- يُقبل أيضًا جسم JSON مع `files` (مستندة إلى storageId).
- حقل اختياري في الحمولة: `ownerHandle`. عند وجوده، يحق للمديرين فقط النشر نيابةً عن ذلك المالك.

أبرز نقاط التحقق:

- يجب أن تكون `family` إما `code-plugin` أو `bundle-plugin`.
- تتطلب حزم Plugin وجود `openclaw.plugin.json`. يجب أن تحتوي عمليات رفع ClawPack `.tgz`
  عليه في `package/openclaw.plugin.json`.
- تتطلب Plugins البرمجية `package.json`، وبيانات وصفية لمستودع المصدر، وبيانات وصفية لالتزام المصدر،
  وبيانات وصفية لمخطط الإعدادات، و`openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion`.
- تُعد `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
- يحق للناشرين الموثوقين فقط النشر إلى قناة `official`.
- لا تزال عمليات النشر بالنيابة تتحقق من أهلية القناة الرسمية مقابل حساب المالك الهدف.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف ناعم / استعادة Skills (المالك أو المشرف أو المدير).

جسم JSON اختياري:

```json
{ "reason": "Held for moderation pending legal review." }
```

عند وجود `reason`، يُخزن كملاحظة إشراف Skills ويُنسخ إلى سجل التدقيق.
تحتفظ عمليات الحذف الناعم التي يبدأها المالك بالاسم اللطيف لمدة 30 يومًا، ثم يمكن
لناشر آخر المطالبة به. تتضمن استجابة الحذف `slugReservedUntil` عندما ينطبق هذا الانقضاء.
لا تنتهي إخفاءات المشرف/المدير والإزالات الأمنية بهذه الطريقة.

استجابة الحذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

رموز الحالة:

- `200`: حسنًا
- `401`: غير مصرح
- `403`: محظور
- `404`: لم يُعثر على Skills/المستخدم
- `500`: خطأ داخلي في الخادم

### `POST /api/v1/users/publisher`

للمديرين فقط. يضمن وجود ناشر مؤسسة لمعرّف. إذا كان المعرّف لا يزال يشير إلى
ناشر مستخدم/شخصي مشترك قديم، تنقله نقطة النهاية أولًا إلى ناشر مؤسسة.

- الجسم: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- الاستجابة: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

للمديرين فقط. يحجز الأسماء اللطيفة الجذرية وأسماء الحزم للمالك الشرعي من دون نشر
إصدار. تصبح أسماء الحزم حزمًا نائبة خاصة بلا صفوف إصدارات، بحيث يستطيع
المالك نفسه لاحقًا نشر إصدار code-plugin أو bundle-plugin الحقيقي إلى ذلك الاسم.

- الجسم: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- الاستجابة: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط نهاية إدارة الأسماء اللطيفة للمالك

- `POST /api/v1/skills/{slug}/rename`
  - الجسم: `{ "newSlug": "new-canonical-slug" }`
  - الاستجابة: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - الجسم: `{ "targetSlug": "canonical-target-slug" }`
  - الاستجابة: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

ملاحظات:

- تتطلب كلتا نقطتي النهاية مصادقة رمز API وتعملان فقط لمالك Skills.
- يحافظ `rename` على الاسم اللطيف السابق كاسم مستعار لإعادة التوجيه.
- يخفي `merge` قائمة المصدر ويعيد توجيه الاسم اللطيف للمصدر إلى قائمة الهدف.

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

يحظر مستخدمًا ويحذف Skills المملوكة حذفًا نهائيًا (للمشرف/المدير فقط).

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

يفك حظر مستخدم ويستعيد Skills المؤهلة (للمدير فقط).

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

### `POST /api/v1/users/role`

يغيّر دور مستخدم (للمدير فقط).

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

يسرد المستخدمين أو يبحث عنهم (للمدير فقط).

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
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

راجع `DEPRECATIONS.md` لمعرفة خطة الإزالة.

## اكتشاف السجل (`/.well-known/clawhub.json`)

يمكن لـ CLI اكتشاف إعدادات السجل/المصادقة من الموقع:

- `/.well-known/clawhub.json` (JSON، مفضل)
- `/.well-known/clawdhub.json` (قديم)

المخطط:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

إذا كنت تستضيف ذاتيًا، فقدّم هذا الملف (أو عيّن `CLAWHUB_REGISTRY` صراحةً؛ `CLAWDHUB_REGISTRY` القديم).
