---
read_when:
    - بناء عملاء واجهة برمجة التطبيقات
    - إضافة نقاط النهاية أو المخططات
summary: نظرة عامة على واجهة برمجة تطبيقات REST العامة (v1) واصطلاحاتها.
x-i18n:
    generated_at: "2026-05-12T12:48:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# واجهة برمجة التطبيقات v1

الأساس: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## إعادة استخدام الفهرس العام

يمكنك إنشاء فهرس أو دليل أو واجهة بحث تابعة لجهة خارجية فوق واجهات API العامة للقراءة في ClawHub. تُنشر بيانات تعريف Skills العامة وملفات Skills بموجب قواعد ترخيص Skills في ClawHub، بينما تخضع واجهة API نفسها لحدود المعدل ويجب استهلاكها بمسؤولية.

الإرشادات:

- استخدم نقاط نهاية القراءة العامة مثل `GET /api/v1/skills` و`GET /api/v1/search` و`GET /api/v1/skills/{slug}` لقوائم الفهرس.
- خزّن الاستجابات مؤقتًا واحترم `429` و`Retry-After` وترويسات حدود المعدل بدلًا من الاستقصاء المكثف.
- اربط بعنوان URL الأساسي لـ Skills في ClawHub عند عرض القوائم حتى يتمكن المستخدمون من فحص سجل السجل المصدري.
- استخدم عناوين URL الأساسية للصفحات بالصيغة `https://clawhub.ai/<owner>/<slug>`.
- لا توحِ بأن ClawHub يؤيد أو يتحقق من أو يشغّل موقع الجهة الخارجية.
- لا تنسخ محتوى مخفيًا أو خاصًا أو محظورًا بالإشراف عبر تجاوز مرشحات واجهة API العامة أو حدود المصادقة.

## المصادقة

- القراءة العامة: لا يلزم رمز مميز.
- الكتابة + الحساب: `Authorization: Bearer clh_...`.

## حدود المعدل

فرض الحدود مع مراعاة المصادقة:

- الطلبات المجهولة: لكل عنوان IP.
- الطلبات المصادَق عليها (رمز Bearer صالح): لكل حاوية مستخدم.
- الرمز المفقود/غير الصالح يعود إلى الفرض حسب عنوان IP.

- القراءة: 600/دقيقة لكل عنوان IP، و2400/دقيقة لكل مفتاح
- الكتابة: 45/دقيقة لكل عنوان IP، و180/دقيقة لكل مفتاح

الترويسات: `X-RateLimit-Limit`، `X-RateLimit-Remaining`، `X-RateLimit-Reset`، `RateLimit-Limit`، `RateLimit-Remaining`، `RateLimit-Reset`، `Retry-After` (عند 429).

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

تعامل العميل:

- فضّل `Retry-After` عند وجوده.
- وإلا فاستخدم `RateLimit-Reset` أو استنتج التأخير من `X-RateLimit-Reset`.
- أضف تذبذبًا إلى إعادة المحاولات.

## نقاط النهاية

القراءة العامة:

- `GET /api/v1/search?q=...`
  - المرشحات الاختيارية: `highlightedOnly=true`، `nonSuspiciousOnly=true`
  - الاسم البديل القديم: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (الافتراضي)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، `installsCurrent` (`installs`)، `installsAllTime`، `trending`
  - ينطبق `cursor` على عمليات الفرز غير `trending`
  - مرشح اختياري: `nonSuspiciousOnly=true`
  - الاسم البديل القديم: `nonSuspicious=true`
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
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

تتطلب المصادقة:

- `POST /api/v1/skills` (النشر، ويفضّل multipart)
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

- `POST /api/v1/users/reserve` يحجز root slugs وعناصر نائبة لحزم خاصة بلا إصدارات لمعرّف مالك.

## القديم

لا تزال `/api/*` و`/api/cli/*` القديمتان متاحتين. راجع `DEPRECATIONS.md`.
