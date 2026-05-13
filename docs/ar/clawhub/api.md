---
read_when:
    - إنشاء عملاء API
    - إضافة نقاط نهاية أو مخططات
summary: نظرة عامة على واجهة برمجة التطبيقات العامة بنمط REST (v1) واصطلاحاتها.
x-i18n:
    generated_at: "2026-05-13T05:32:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

الأساس: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## إعادة استخدام الفهرس العام

يمكنك إنشاء فهرس أو دليل أو واجهة بحث تابعة لجهة خارجية فوق واجهات برمجة التطبيقات العامة للقراءة في ClawHub. تُنشر بيانات تعريف Skills العامة وملفات Skills بموجب قواعد ترخيص Skills في ClawHub، بينما تخضع واجهة API نفسها لحدود معدل ويجب استخدامها بمسؤولية.

الإرشادات:

- استخدم نقاط نهاية القراءة العامة مثل `GET /api/v1/skills` و`GET /api/v1/search` و`GET /api/v1/skills/{slug}` لقوائم الفهرس.
- خزّن الاستجابات مؤقتًا واحترم رؤوس `429` و`Retry-After` وحدود المعدل بدلًا من الاستطلاع المكثف.
- اربط بعنوان URL القانوني لـ Skills في ClawHub عند عرض القوائم حتى يتمكن المستخدمون من فحص سجل السجل المصدري.
- استخدم عناوين URL القانونية للصفحات بالشكل `https://clawhub.ai/<owner>/<slug>`.
- لا تلمّح إلى أن ClawHub يؤيد موقع الجهة الخارجية أو يتحقق منه أو يشغّله.
- لا تنسخ محتوى مخفيًا أو خاصًا أو محظورًا بالإشراف عبر تجاوز مرشحات API العامة أو حدود المصادقة.

## المصادقة

- القراءة العامة: لا يلزم رمز مميز.
- الكتابة + الحساب: `Authorization: Bearer clh_...`.

## حدود المعدل

فرض يراعي المصادقة:

- الطلبات المجهولة: لكل عنوان IP.
- الطلبات المصادق عليها (رمز Bearer صالح): لكل حاوية مستخدم.
- الرمز المفقود/غير الصالح يعود إلى الفرض حسب IP.

- القراءة: 600/دقيقة لكل IP، و2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل IP، و180/دقيقة لكل مفتاح

الرؤوس: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (عند 429).

الدلالات:

- `X-RateLimit-Reset`: ثواني حقبة Unix (وقت إعادة الضبط المطلق)
- `RateLimit-Reset`: ثواني التأخير حتى إعادة الضبط
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
- أضف تفاوتًا عشوائيًا إلى إعادة المحاولة.

## نقاط النهاية

القراءة العامة:

- `GET /api/v1/search?q=...`
  - مرشحات اختيارية: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - الاسم المستعار القديم: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، `installsCurrent` (`installs`)، `installsAllTime`، `trending`
  - ينطبق `cursor` على عمليات الفرز غير `trending`
  - مرشح اختياري: `nonSuspiciousOnly=true`
  - الاسم المستعار القديم: `nonSuspicious=true`
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

المصادقة مطلوبة:

- `POST /api/v1/skills` (النشر، ويفضّل متعدد الأجزاء)
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

- `POST /api/v1/users/reserve` يحجز اختصارات جذرية وعناصر نائبة لحزم خاصة بلا إصدار لمعرّف مالك.

## القديم

لا تزال المسارات القديمة `/api/*` و`/api/cli/*` متاحة. راجع `DEPRECATIONS.md`.
