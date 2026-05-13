---
read_when:
    - بناء عملاء API
    - إضافة نقاط النهاية أو المخططات
summary: نظرة عامة على واجهة REST API العامة (v1) واصطلاحاتها.
x-i18n:
    generated_at: "2026-05-13T04:17:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

الأساس: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## إعادة استخدام الكتالوج العام

يمكنك إنشاء كتالوج أو دليل أو واجهة بحث تابعة لجهة خارجية فوق واجهات API العامة للقراءة في ClawHub. تُنشر بيانات Skills الوصفية العامة وملفات Skills وفق قواعد ترخيص Skills في ClawHub، بينما تخضع API نفسها لحدود المعدل ويجب استخدامها بمسؤولية.

إرشادات:

- استخدم نقاط نهاية القراءة العامة مثل `GET /api/v1/skills` و`GET /api/v1/search` و`GET /api/v1/skills/{slug}` لقوائم الكتالوج.
- خزّن الاستجابات مؤقتًا واحترم `429` و`Retry-After` ورؤوس حدود المعدل بدلًا من الاستطلاع المكثف.
- أضف رابطًا إلى عنوان URL القانوني للـ Skill في ClawHub عند عرض القوائم حتى يتمكن المستخدمون من فحص سجل السجل المصدر.
- استخدم عناوين URL القانونية للصفحات بالشكل `https://clawhub.ai/<owner>/<slug>`.
- لا توحِ بأن ClawHub يؤيد موقع الجهة الخارجية أو يتحقق منه أو يشغّله.
- لا تنسخ محتوى مخفيًا أو خاصًا أو محظورًا بالإشراف عبر تجاوز فلاتر API العامة أو حدود المصادقة.

## المصادقة

- القراءة العامة: لا يلزم رمز.
- الكتابة + الحساب: `Authorization: Bearer clh_...`.

## حدود المعدل

فرض واعٍ بالمصادقة:

- الطلبات المجهولة: لكل عنوان IP.
- الطلبات المصادَق عليها (رمز Bearer صالح): لكل حاوية مستخدم.
- الرمز المفقود/غير الصالح يعود إلى الفرض حسب عنوان IP.

- القراءة: 600/دقيقة لكل عنوان IP، و2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل عنوان IP، و180/دقيقة لكل مفتاح

الرؤوس: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (على 429).

الدلالات:

- `X-RateLimit-Reset`: ثواني Unix epoch (وقت إعادة تعيين مطلق)
- `RateLimit-Reset`: ثواني التأخير حتى إعادة التعيين
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
- أضف jitter إلى إعادة المحاولة.

## نقاط النهاية

القراءة العامة:

- `GET /api/v1/search?q=...`
  - فلاتر اختيارية: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - اسم مستعار قديم: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، `installsCurrent` (`installs`)، `installsAllTime`، `trending`
  - ينطبق `cursor` على أنواع الفرز غير `trending`
  - فلتر اختياري: `nonSuspiciousOnly=true`
  - اسم مستعار قديم: `nonSuspicious=true`
  - مع `nonSuspiciousOnly=true`، قد تحتوي الصفحات المستندة إلى المؤشر على عناصر أقل من `limit`؛ استخدم `nextCursor` للمتابعة.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

تتطلب المصادقة:

- `POST /api/v1/skills` (نشر، يُفضّل multipart)
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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

للمسؤولين فقط:

- `POST /api/v1/users/reserve` يحجز slugs جذرية وعناصر نائبة خاصة لحزم بلا إصدار لمعرّف مالك.

## القديم

ما زالت `/api/*` و`/api/cli/*` القديمتان متاحتين. راجع `DEPRECATIONS.md`.
