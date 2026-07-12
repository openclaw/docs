---
read_when:
    - نشر OpenClaw على Railway
    - تريد نشراً سحابياً بنقرة واحدة مع واجهة تحكم قائمة على المتصفح
summary: انشر OpenClaw على Railway باستخدام قالب بنقرة واحدة
title: Railway
x-i18n:
    generated_at: "2026-07-12T06:10:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

انشر OpenClaw على Railway باستخدام قالب بنقرة واحدة، وصِل إليه عبر واجهة التحكم على الويب. هذا هو أسهل مسار «من دون طرفية على الخادم»: تشغّل Railway الـ Gateway نيابةً عنك.

## النشر بنقرة واحدة

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  النشر على Railway
</a>

<Steps>
  <Step title="نشر القالب">
    انقر على **Deploy on Railway** أعلاه.
  </Step>

<Step title="إضافة وحدة تخزين">
  أرفق وحدة تخزين مركّبة عند `/data` (مطلوبة للاحتفاظ بالحالة بشكل دائم).
</Step>

  <Step title="تعيين المتغيرات">
    عيّن **Variables** المطلوبة في الخدمة:

    - `OPENCLAW_GATEWAY_PORT=8080` (مطلوب -- يجب أن يطابق المنفذ في Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (مطلوب؛ تعامل معه باعتباره سرًا إداريًا)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (موصى به)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (موصى به)

  </Step>

<Step title="تمكين الاتصال بالشبكة العامة">
  ضمن **Public Networking**، فعّل **HTTP Proxy** للخدمة على المنفذ `8080`.
</Step>

  <Step title="الاتصال">
    ابحث عن عنوان URL العام في **Railway -> your service -> Settings -> Domains** -- إما نطاقًا منشأً (غالبًا `https://<something>.up.railway.app`) أو نطاقك المخصص المرفق.

    افتح `https://<your-railway-domain>/openclaw` واتصل باستخدام السر المشترك المُعدّ. يستخدم القالب `OPENCLAW_GATEWAY_TOKEN` افتراضيًا؛ وإذا استبدلته بالمصادقة بكلمة مرور، فاستخدم كلمة المرور تلك بدلًا منه.

  </Step>
</Steps>

## ما الذي ستحصل عليه

- Gateway مستضاف لـ OpenClaw مع واجهة التحكم
- تخزين دائم عبر وحدة تخزين Railway ‏(`/data`)، بحيث تظل ملفات `openclaw.json` وملفات `auth-profiles.json` الخاصة بكل وكيل، وحالة القنوات وموفّري الخدمة، والجلسات، ومساحة العمل محفوظة بعد عمليات إعادة النشر

## توصيل قناة

استخدم واجهة التحكم عند `/openclaw` أو شغّل `openclaw onboard` عبر صدفة Railway للحصول على إرشادات إعداد القناة:

- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram) (الأسرع -- لا تحتاج سوى إلى رمز بوت)
- [جميع القنوات](/ar/channels)

## النسخ الاحتياطية والترحيل

صدّر حالتك وإعداداتك وملفات تعريف المصادقة ومساحة العمل:

```bash
openclaw backup create
```

يؤدي هذا إلى إنشاء أرشيف نسخ احتياطي قابل للنقل، يتضمن حالة OpenClaw وأي مساحة عمل مُعدّة. راجع [النسخ الاحتياطي](/ar/cli/backup) للحصول على التفاصيل.

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- إعداد Gateway: [إعدادات Gateway](/ar/gateway/configuration)
- إبقاء OpenClaw محدّثًا: [التحديث](/ar/install/updating)
