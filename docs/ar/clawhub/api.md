---
read_when:
    - إنشاء عملاء API
    - إضافة نقاط نهاية أو مخططات
summary: نظرة عامة على واجهة برمجة التطبيقات العامة REST (الإصدار v1) واصطلاحاتها.
x-i18n:
    generated_at: "2026-07-16T13:30:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

الأساس: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## إعادة استخدام الفهرس العام

يمكن إنشاء فهرس أو دليل أو واجهة بحث تابعة لجهة خارجية اعتمادًا على واجهات API العامة للقراءة في ClawHub. تُنشر البيانات الوصفية العامة لــ Skills وملفاتها وفق قواعد ترخيص Skills الخاصة بـ ClawHub، بينما تخضع واجهة API نفسها لحدود المعدل ويجب استخدامها بمسؤولية.

الإرشادات:

- استخدم نقاط نهاية القراءة العامة مثل `GET /api/v1/skills` و`GET /api/v1/search` و`GET /api/v1/skills/{slug}` لقوائم الفهرس.
- خزّن الاستجابات مؤقتًا والتزم بـ `429` و`Retry-After` وترويسات حدود المعدل بدلًا من الاستقصاء المكثف.
- أضف رابطًا إلى عنوان URL الأساسي للـ Skill في ClawHub عند عرض القوائم، ليتسنى للمستخدمين فحص سجل المصدر في السجل.
- استخدم عناوين URL الأساسية للصفحات بالصيغة `https://clawhub.ai/<owner>/skills/<slug>`.
- لا توحِ بأن ClawHub يؤيد موقع الجهة الخارجية أو يتحقق منه أو يديره.
- لا تنسخ المحتوى المخفي أو الخاص أو المحظور بموجب الإشراف عبر تجاوز مرشحات واجهة API العامة أو حدود المصادقة.

## المصادقة

- القراءة العامة: لا يلزم رمز مميز.
- الكتابة + الحساب: `Authorization: Bearer clh_...`.

## حدود المعدل

الإنفاذ المراعي للمصادقة:

- الطلبات المجهولة: لكل عنوان IP.
- الطلبات المصادَق عليها (رمز Bearer صالح): لكل حصة مستخدم.
- يؤدي غياب الرمز المميز أو عدم صلاحيته إلى الرجوع للإنفاذ حسب عنوان IP.

- القراءة: 3000/دقيقة لكل عنوان IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل عنوان IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل عنوان IP، و6000/دقيقة لكل مفتاح

الترويسات: `X-RateLimit-Limit`، و`X-RateLimit-Reset`، و`RateLimit-Limit`، و`RateLimit-Reset`؛
تُضمَّن `X-RateLimit-Remaining` و`RateLimit-Remaining` و`Retry-After` في `429`.

الدلالات:

- `X-RateLimit-Reset`: ثواني حقبة Unix (وقت إعادة الضبط المطلق)
- `RateLimit-Reset`: ثواني التأخير حتى إعادة الضبط
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الحصة المتبقية الدقيقة عند
  وجودها؛ تحذفها الطلبات الناجحة الموزعة على الأجزاء بدلًا من إرجاع قيمة
  عامة تقريبية
- `Retry-After`: عدد ثواني التأخير الواجب انتظارها عند `429`

مثال `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

معالجة العميل:

- فضّل `Retry-After` عند وجوده.
- وإلا، فاستخدم `RateLimit-Reset` أو استنتج التأخير من `X-RateLimit-Reset`.
- أضف تفاوتًا عشوائيًا إلى عمليات إعادة المحاولة.

## الأخطاء

- أخطاء v1 هي نص عادي (`text/plain; charset=utf-8`)، بما في ذلك `400`،
  و`401`، و`403`، و`404`، و`429`، واستجابات التنزيل المحظور.
- تُتجاهل معلمات الاستعلام غير المعروفة لأغراض التوافق.
- تعيد معلمات الاستعلام المعروفة ذات القيم غير الصالحة `400`.

## نقاط النهاية

القراءة العامة:

- `GET /api/v1/search?q=...`
  - المرشحات الاختيارية: `highlightedOnly=true`، و`nonSuspiciousOnly=true`
  - الاسم البديل القديم: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، و`recommended` (`default`)، و`createdAt` (`newest`)، و`downloads`، و`stars` (`rating`)، وتُربط أسماء التثبيت البديلة القديمة `installsCurrent`/`installs`/`installsAllTime` بـ `downloads`، و`trending`
  - تعيد قيم `sort` غير الصالحة `400`
  - ينطبق `cursor` على عمليات الفرز غير `trending`
  - المرشح الاختياري: `nonSuspiciousOnly=true`
  - الاسم البديل القديم: `nonSuspicious=true`
  - مع `nonSuspiciousOnly=true`، قد تحتوي الصفحات المستندة إلى المؤشر على عناصر أقل من `limit`؛ استخدم `nextCursor` للمتابعة.
  - يستخدم `recommended` إشارات التفاعل والحداثة.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - تعيد Skills المستضافة بايتات ZIP حتمية.
  - تعيد Skills الحالية المدعومة من GitHub التي تتضمن فحص `clean` أو `suspicious`
    واصف تسليم `public-github` بتنسيق JSON بدلًا من بايتات ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - تُصدَّر Skills المستضافة كملفات مخزنة.
  - تُصدَّر Skills الحالية المدعومة من GitHub التي تتضمن فحص `clean` أو `suspicious`
    كواصفات تسليم `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، و`recommended`، و`downloads`، والاسم البديل القديم `installs`
  - تعيد قيم `sort` غير الصالحة `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (الافتراضي)، و`downloads`، و`updated`، والاسم البديل القديم `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

المصادقة مطلوبة:

- `POST /api/v1/skills` (النشر، ويُفضّل متعدد الأجزاء)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

للمشرفين فقط:

- يحجز `POST /api/v1/users/reserve` الأسماء المختصرة الجذرية والعناصر النائبة لحزم خاصة بلا إصدار لمعرّف مالك.

## قديم

ما يزال `/api/*` و`/api/cli/*` القديمان متاحين. راجع `DEPRECATIONS.md`.
