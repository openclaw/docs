---
read_when:
    - بناء عملاء API
    - إضافة نقاط نهاية أو مخططات
summary: نظرة عامة على واجهة برمجة تطبيقات REST العامة (v1) واصطلاحاتها.
x-i18n:
    generated_at: "2026-07-03T00:57:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

الأساس: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## إعادة استخدام الفهرس العام

يمكنك بناء فهرس أو دليل أو واجهة بحث تابعة لجهة خارجية فوق واجهات API العامة للقراءة في ClawHub. تُنشر بيانات Skills الوصفية العامة وملفات Skills بموجب قواعد ترخيص Skills في ClawHub، بينما تخضع واجهة API نفسها لحدود معدلات الطلبات ويجب استهلاكها بمسؤولية.

الإرشادات:

- استخدم نقاط نهاية القراءة العامة مثل `GET /api/v1/skills` و`GET /api/v1/search` و`GET /api/v1/skills/{slug}` لقوائم الفهرس.
- خزّن الاستجابات مؤقتًا واحترم ترويسات `429` و`Retry-After` وحدود المعدلات بدلًا من الاستطلاع المكثف.
- اربط بعنوان URL الأساسي لـ ClawHub Skill عند عرض القوائم حتى يتمكن المستخدمون من فحص سجل السجل المصدر.
- استخدم عناوين URL الأساسية للصفحات بالصيغة `https://clawhub.ai/<owner>/skills/<slug>`.
- لا توحِ بأن ClawHub يؤيد موقع الجهة الخارجية أو يتحقق منه أو يشغّله.
- لا تنسخ محتوى مخفيًا أو خاصًا أو محظورًا بالإشراف عبر تجاوز مرشحات API العامة أو حدود المصادقة.

## المصادقة

- القراءة العامة: لا يلزم رمز مميز.
- الكتابة + الحساب: `Authorization: Bearer clh_...`.

## حدود المعدلات

إنفاذ يراعي المصادقة:

- الطلبات المجهولة: لكل عنوان IP.
- الطلبات المصادَق عليها (رمز Bearer صالح): لكل حاوية مستخدم.
- الرمز المفقود/غير الصالح يعود إلى الإنفاذ حسب عنوان IP.

- القراءة: 3000/دقيقة لكل عنوان IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل عنوان IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل عنوان IP، و6000/دقيقة لكل مفتاح

الترويسات: `X-RateLimit-Limit`، `X-RateLimit-Reset`، `RateLimit-Limit`، `RateLimit-Reset`؛
يتم تضمين `X-RateLimit-Remaining` و`RateLimit-Remaining` و`Retry-After` عند `429`.

الدلالات:

- `X-RateLimit-Reset`: ثواني عصر يونكس (وقت إعادة التعيين المطلق)
- `RateLimit-Reset`: ثواني التأخير حتى إعادة التعيين
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند
  وجودها؛ تحذف الطلبات الناجحة الموزعة على شظايا هذه القيمة بدلًا من إرجاع قيمة
  عامة تقريبية
- `Retry-After`: ثواني التأخير للانتظار عند `429`

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

تعامل العميل:

- فضّل `Retry-After` عند وجوده.
- وإلا فاستخدم `RateLimit-Reset` أو استخرج التأخير من `X-RateLimit-Reset`.
- أضف عشوائية محدودة إلى إعادات المحاولة.

## الأخطاء

- أخطاء v1 هي نص عادي (`text/plain; charset=utf-8`)، بما في ذلك `400`
  و`401` و`403` و`404` و`429` واستجابات التنزيل المحظورة.
- يتم تجاهل معاملات الاستعلام غير المعروفة لأغراض التوافق.
- معاملات الاستعلام المعروفة ذات القيم غير الصالحة تُرجع `400`.

## نقاط النهاية

قراءة عامة:

- `GET /api/v1/search?q=...`
  - مرشحات اختيارية: `highlightedOnly=true`، `nonSuspiciousOnly=true`
  - اسم مستعار قديم: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، `recommended` (`default`)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، أسماء التثبيت القديمة المستعارة `installsCurrent`/`installs`/`installsAllTime` تُطابق `downloads`، `trending`
  - قيم `sort` غير الصالحة تُرجع `400`
  - ينطبق `cursor` على أنواع الفرز غير `trending`
  - مرشح اختياري: `nonSuspiciousOnly=true`
  - اسم مستعار قديم: `nonSuspicious=true`
  - مع `nonSuspiciousOnly=true`، قد تحتوي الصفحات المعتمدة على المؤشر على عناصر أقل من `limit`؛ استخدم `nextCursor` للمتابعة.
  - يستخدم `recommended` إشارات التفاعل والحداثة.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - تُرجع Skills المستضافة بايتات ZIP حتمية.
  - تُرجع Skills الحالية المدعومة من GitHub ذات فحص `clean` أو `suspicious`
    واصف تسليم JSON باسم `public-github` بدلًا من بايتات ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - يتم تصدير Skills المستضافة كملفات مخزنة.
  - يتم تصدير Skills الحالية المدعومة من GitHub ذات فحص `clean` أو `suspicious`
    كواصفات تسليم `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، `recommended`، `downloads`، الاسم المستعار القديم `installs`
  - قيم `sort` غير الصالحة تُرجع `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (الافتراضي)، `downloads`، `updated`، الاسم المستعار القديم `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

المصادقة مطلوبة:

- `POST /api/v1/skills` (النشر، ويفضل multipart)
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

- `POST /api/v1/users/reserve` يحجز slugs الجذرية وعناصر نائبة خاصة لحزم بلا إصدارات لمقبض مالك.

## القديم

لا تزال `/api/*` و`/api/cli/*` القديمتان متاحتين. راجع `DEPRECATIONS.md`.
