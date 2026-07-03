---
read_when:
    - بناء عملاء API
    - إضافة نقاط نهاية أو مخططات
summary: نظرة عامة واصطلاحات واجهة REST API العامة (v1).
x-i18n:
    generated_at: "2026-07-03T23:33:32Z"
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

## إعادة استخدام الكتالوج العام

يمكنك بناء كتالوج أو دليل أو واجهة بحث تابعة لجهة خارجية فوق واجهات API العامة للقراءة في ClawHub. تُنشر بيانات تعريف المهارات العامة وملفات المهارات بموجب قواعد ترخيص المهارات في ClawHub، بينما تخضع واجهة API نفسها لحدود المعدل ويجب استهلاكها بمسؤولية.

الإرشادات:

- استخدم نقاط نهاية القراءة العامة مثل `GET /api/v1/skills` و`GET /api/v1/search` و`GET /api/v1/skills/{slug}` لقوائم الكتالوج.
- خزّن الاستجابات مؤقتًا واحترم `429` و`Retry-After` وترويسات حدود المعدل بدلًا من الاستطلاع المكثف.
- اربط بعنوان URL المعياري لمهارة ClawHub عند عرض القوائم حتى يتمكن المستخدمون من فحص سجل السجل المصدر.
- استخدم عناوين URL للصفحات المعيارية بصيغة `https://clawhub.ai/<owner>/skills/<slug>`.
- لا توحِ بأن ClawHub يؤيد الموقع التابع لجهة خارجية أو يتحقق منه أو يشغّله.
- لا تعكس المحتوى المخفي أو الخاص أو المحظور بالوساطة عبر تجاوز مرشحات API العامة أو حدود المصادقة.

## المصادقة

- القراءة العامة: لا يلزم رمز مميز.
- الكتابة + الحساب: `Authorization: Bearer clh_...`.

## حدود المعدل

إنفاذ مدرك للمصادقة:

- الطلبات المجهولة: لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): لكل حاوية مستخدم.
- الرمز المفقود/غير الصالح يعود إلى الإنفاذ حسب عنوان IP.

- القراءة: 3000/دقيقة لكل عنوان IP، و12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل عنوان IP، و3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل عنوان IP، و6000/دقيقة لكل مفتاح

الترويسات: `X-RateLimit-Limit` و`X-RateLimit-Reset` و`RateLimit-Limit` و`RateLimit-Reset`;
تُضمّن `X-RateLimit-Remaining` و`RateLimit-Remaining` و`Retry-After` عند `429`.

الدلالات:

- `X-RateLimit-Reset`: ثواني حقبة Unix (وقت إعادة التعيين المطلق)
- `RateLimit-Reset`: ثواني التأخير حتى إعادة التعيين
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند
  وجودها؛ الطلبات الناجحة المجزأة تتجاهلها بدلًا من إرجاع قيمة عامة
  تقريبية
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
- وإلا فاستخدم `RateLimit-Reset` أو استنتج التأخير من `X-RateLimit-Reset`.
- أضف عشوائية بسيطة إلى إعادة المحاولات.

## الأخطاء

- أخطاء v1 هي نص عادي (`text/plain; charset=utf-8`)، بما في ذلك `400`
  و`401` و`403` و`404` و`429` واستجابات التنزيل المحظورة.
- تُتجاهل معاملات الاستعلام غير المعروفة للتوافق.
- معاملات الاستعلام المعروفة ذات القيم غير الصالحة تُرجع `400`.

## نقاط النهاية

قراءة عامة:

- `GET /api/v1/search?q=...`
  - مرشحات اختيارية: `highlightedOnly=true` و`nonSuspiciousOnly=true`
  - اسم مستعار قديم: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، `recommended` (`default`)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، أسماء التثبيت المستعارة القديمة `installsCurrent`/`installs`/`installsAllTime` تُعيّن إلى `downloads`، و`trending`
  - قيم `sort` غير الصالحة تُرجع `400`
  - ينطبق `cursor` على ترتيبات الفرز غير `trending`
  - مرشح اختياري: `nonSuspiciousOnly=true`
  - اسم مستعار قديم: `nonSuspicious=true`
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
  - المهارات المستضافة تُرجع بايتات ZIP حتمية.
  - المهارات الحالية المدعومة من GitHub التي لديها فحص `clean` أو `suspicious` تُرجع
    واصف تسليم JSON `public-github` بدلًا من بايتات ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - تُصدّر المهارات المستضافة كملفات مخزنة.
  - المهارات الحالية المدعومة من GitHub التي لديها فحص `clean` أو `suspicious` تُصدّر
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

للمشرف فقط:

- `POST /api/v1/users/reserve` يحجز slugs الجذرية والعناصر النائبة لحزم خاصة بلا إصدار لمعرّف مالك.

## قديم

ما زالت `/api/*` و`/api/cli/*` القديمتان متاحتين. راجع `DEPRECATIONS.md`.
