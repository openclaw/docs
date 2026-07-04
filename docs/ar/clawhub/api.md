---
read_when:
    - بناء عملاء API
    - إضافة نقاط نهاية أو مخططات
summary: نظرة عامة على REST API العام (v1) واصطلاحاته.
x-i18n:
    generated_at: "2026-07-04T15:19:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# واجهة API v1

الأساس: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## إعادة استخدام الكتالوج العام

يمكنك بناء كتالوج أو دليل أو واجهة بحث تابعة لجهة خارجية فوق واجهات API العامة للقراءة في ClawHub. تُنشر بيانات Skills الوصفية العامة وملفات Skills بموجب قواعد ترخيص Skills في ClawHub، بينما تخضع واجهة API نفسها لحدود المعدل ويجب استخدامها بمسؤولية.

الإرشادات:

- استخدم نقاط نهاية القراءة العامة مثل `GET /api/v1/skills` و`GET /api/v1/search` و`GET /api/v1/skills/{slug}` لقوائم الكتالوج.
- خزّن الاستجابات مؤقتًا واحترم رؤوس `429` و`Retry-After` وحدود المعدل بدلًا من الاستطلاع المكثف.
- اربط بعنوان URL القانوني لـ Skills في ClawHub عند عرض القوائم حتى يتمكن المستخدمون من فحص سجل السجل المصدري.
- استخدم عناوين URL القانونية للصفحات بالصيغة `https://clawhub.ai/<owner>/skills/<slug>`.
- لا توحِ بأن ClawHub يؤيد الموقع التابع لجهة خارجية أو يتحقق منه أو يشغّله.
- لا تعكس محتوى مخفيًا أو خاصًا أو محظورًا بالإشراف عبر تجاوز مرشحات واجهة API العامة أو حدود المصادقة.

## المصادقة

- القراءة العامة: لا يلزم رمز مميز.
- الكتابة + الحساب: `Authorization: Bearer clh_...`.

## حدود المعدل

إنفاذ يراعي المصادقة:

- الطلبات المجهولة: لكل عنوان IP.
- الطلبات المصادقة (رمز Bearer صالح): لكل حاوية مستخدم.
- الرمز المفقود/غير الصالح يعود إلى الإنفاذ حسب عنوان IP.

- القراءة: 3000/دقيقة لكل عنوان IP، 12000/دقيقة لكل مفتاح
- الكتابة: 300/دقيقة لكل عنوان IP، 3000/دقيقة لكل مفتاح
- التنزيل: 1200/دقيقة لكل عنوان IP، 6000/دقيقة لكل مفتاح

الرؤوس: `X-RateLimit-Limit` و`X-RateLimit-Reset` و`RateLimit-Limit` و`RateLimit-Reset`؛
يتم تضمين `X-RateLimit-Remaining` و`RateLimit-Remaining` و`Retry-After` عند `429`.

الدلالات:

- `X-RateLimit-Reset`: ثواني زمن Unix epoch (وقت إعادة الضبط المطلق)
- `RateLimit-Reset`: ثواني التأخير حتى إعادة الضبط
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: الميزانية المتبقية الدقيقة عند
  وجودها؛ الطلبات الناجحة الموزعة على أجزاء تحذفها بدلًا من إرجاع قيمة عامة
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

معالجة العميل:

- فضّل `Retry-After` عند وجوده.
- وإلا فاستخدم `RateLimit-Reset` أو استنتج التأخير من `X-RateLimit-Reset`.
- أضف تفاوتًا عشوائيًا إلى عمليات إعادة المحاولة.

## الأخطاء

- أخطاء v1 هي نص عادي (`text/plain; charset=utf-8`)، بما في ذلك `400` و
  `401` و`403` و`404` و`429` واستجابات التنزيل المحظور.
- يتم تجاهل معلمات الاستعلام غير المعروفة للتوافق.
- معلمات الاستعلام المعروفة ذات القيم غير الصالحة تُرجع `400`.

## نقاط النهاية

القراءة العامة:

- `GET /api/v1/search?q=...`
  - مرشحات اختيارية: `highlightedOnly=true` و`nonSuspiciousOnly=true`
  - اسم بديل قديم: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، `recommended` (`default`)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، أسماء تثبيت بديلة قديمة `installsCurrent`/`installs`/`installsAllTime` تُعيَّن إلى `downloads`، `trending`
  - قيم `sort` غير الصالحة تُرجع `400`
  - ينطبق `cursor` على أنواع الفرز غير `trending`
  - مرشح اختياري: `nonSuspiciousOnly=true`
  - اسم بديل قديم: `nonSuspicious=true`
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
  - تُرجع Skills المستضافة بايتات ZIP حتمية.
  - تُرجع Skills الحالية المدعومة من GitHub ذات فحص `clean` أو `suspicious`
    واصف تسليم JSON باسم `public-github` بدلًا من بايتات ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - تُصدَّر Skills المستضافة كملفات مخزنة.
  - تُصدَّر Skills الحالية المدعومة من GitHub ذات فحص `clean` أو `suspicious`
    كواصفات تسليم `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، `recommended`، `downloads`، الاسم البديل القديم `installs`
  - قيم `sort` غير الصالحة تُرجع `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (الافتراضي)، `downloads`، `updated`، الاسم البديل القديم `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

تتطلب المصادقة:

- `POST /api/v1/skills` (نشر، ويفضّل multipart)
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

- يحجز `POST /api/v1/users/reserve` أسماء slugs الجذرية والعناصر النائبة الخاصة لحزم بلا إصدارات لمعرّف المالك.

## القديم

لا تزال `/api/*` و`/api/cli/*` القديمة متاحة. راجع `DEPRECATIONS.md`.
