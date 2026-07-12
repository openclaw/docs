---
read_when:
    - تعريف الوافدين الجدد بـ OpenClaw
summary: OpenClaw هو Gateway متعدد القنوات لوكلاء الذكاء الاصطناعي يعمل على أي نظام تشغيل.
title: OpenClaw
x-i18n:
    generated_at: "2026-07-12T06:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b87c2a9ce06f110bda45709fb6055ed8000f73993793ea7386db2a47a782828
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"قَشِّر! قَشِّر!"_ — جراد بحر فضائي، على الأرجح

<p align="center">
  <strong>Gateway لأي نظام تشغيل لوكلاء الذكاء الاصطناعي عبر Discord وGoogle Chat وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo وغيرها.</strong><br />
  أرسل رسالة واحصل على رد من وكيل مباشرةً في جيبك. شغّل Gateway واحدًا عبر Plugins القنوات وWebChat وعُقد الأجهزة المحمولة.
</p>

<Columns>
  <Card title="البدء" href="/ar/start/getting-started" icon="rocket">
    ثبّت OpenClaw وشغّل Gateway خلال دقائق.
  </Card>
  <Card title="تشغيل الإعداد الأولي" href="/ar/start/wizard" icon="list-checks">
    إعداد موجّه باستخدام `openclaw onboard` وتدفقات الاقتران.
  </Card>
  <Card title="ربط قناة" href="/ar/channels" icon="message-circle">
    اربط Discord وSignal وTelegram وWhatsApp وغيرها للدردشة من أي مكان.
  </Card>
  <Card title="فتح واجهة التحكم" href="/ar/web/control-ui" icon="layout-dashboard">
    شغّل لوحة المعلومات في المتصفح للدردشة والتهيئة والجلسات.
  </Card>
</Columns>

## تصفّح الوثائق

قد تعرض متصفحات الأجهزة المحمولة قائمة الأقسام من دون شريط علامات تبويب سطح المكتب الكامل. استخدم
روابط المراكز هذه للوصول إلى مناطق الوثائق العليا نفسها من محتوى الصفحة.

<Columns>
  <Card title="البدء" href="/ar" icon="rocket">
    نظرة عامة وعرض توضيحي وخطوات أولى وأدلة إعداد.
  </Card>
  <Card title="التثبيت" href="/ar/install" icon="download">
    مسارات التثبيت والتحديثات والحاويات والاستضافة والإعداد المتقدم.
  </Card>
  <Card title="القنوات" href="/ar/channels" icon="messages-square">
    قنوات المراسلة والاقتران والتوجيه ومجموعات الوصول وضمان جودة القنوات.
  </Card>
  <Card title="الوكلاء" href="/ar/concepts/architecture" icon="bot">
    البنية والجلسات والسياق والذاكرة والتوجيه متعدد الوكلاء.
  </Card>
  <Card title="الإمكانات" href="/ar/tools" icon="wand-sparkles">
    الأدوات وSkills وCron وWebhooks وإمكانات الأتمتة.
  </Card>
  <Card title="ClawHub" href="/ar/clawhub" icon="store">
    سوق Plugins والنشر والتنظيم وإرشادات الثقة.
  </Card>
  <Card title="النماذج" href="/ar/providers" icon="brain">
    المزوّدون وتهيئة النماذج وتجاوز الأعطال وخدمات النماذج المحلية.
  </Card>
  <Card title="المنصات" href="/ar/platforms" icon="monitor-smartphone">
    macOS وWindows وiOS وAndroid والعُقد وواجهات الويب.
  </Card>
  <Card title="Gateway والعمليات" href="/ar/gateway" icon="server">
    تهيئة Gateway والأمان والتشخيص والعمليات.
  </Card>
  <Card title="المرجع" href="/ar/cli" icon="terminal">
    مرجع CLI والمخططات وRPC وملاحظات الإصدار والقوالب.
  </Card>
  <Card title="المساعدة" href="/ar/help" icon="life-buoy">
    استكشاف الأخطاء وإصلاحها والأسئلة الشائعة والاختبار والتشخيص وفحوصات البيئة.
  </Card>
</Columns>

## ما OpenClaw؟

OpenClaw هو **Gateway مستضاف ذاتيًا** يربط تطبيقات الدردشة المفضلة لديك — Discord وGoogle Chat وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo وغيرها عبر Plugins القنوات — بوكلاء برمجة مدعومين بالذكاء الاصطناعي. تشغّل عملية Gateway واحدة على جهازك (أو على خادم)، فتصبح جسرًا بين تطبيقات المراسلة لديك ومساعد ذكاء اصطناعي متاح دائمًا.

**لمن صُمّم؟** للمطورين والمستخدمين المتقدمين الذين يريدون مساعد ذكاء اصطناعي شخصيًا يمكنهم مراسلته من أي مكان، من دون التخلي عن التحكم في بياناتهم أو الاعتماد على خدمة مستضافة.

**ما الذي يميّزه؟**

- **مستضاف ذاتيًا**: يعمل على أجهزتك ووفق قواعدك
- **متعدد القنوات**: يخدم Gateway واحد كل Plugin قناة مُهيّأ في الوقت نفسه
- **مصمم للوكلاء**: بُني لوكلاء البرمجة مع استخدام الأدوات والجلسات والذاكرة والتوجيه متعدد الوكلاء
- **مفتوح المصدر**: مرخّص بموجب MIT ويطوره المجتمع

**ما الذي تحتاج إليه؟** Node 24 (موصى به)، أو Node 22 LTS ‏(`22.19+`) للتوافق، ومفتاح API من المزوّد الذي اخترته، و5 دقائق. للحصول على أفضل جودة وأمان، استخدم أقوى نموذج متاح من أحدث جيل.

## آلية العمل

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["OpenClaw agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

يُعد Gateway المصدر الوحيد للحقيقة فيما يتعلق بالجلسات والتوجيه واتصالات القنوات.

## الإمكانات الرئيسية

<Columns>
  <Card title="Gateway متعدد القنوات" icon="network" href="/ar/channels">
    Discord وiMessage وSignal وSlack وTelegram وWhatsApp وWebChat وغيرها باستخدام عملية Gateway واحدة.
  </Card>
  <Card title="قنوات Plugins" icon="plug" href="/ar/tools/plugin">
    تضيف Plugins القنوات Matrix وNostr وTwitch وZalo وغيرها؛ وتُثبّت Plugins الرسمية عند الطلب.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="route" href="/ar/concepts/multi-agent">
    جلسات معزولة لكل وكيل أو مساحة عمل أو مُرسِل.
  </Card>
  <Card title="دعم الوسائط" icon="image" href="/ar/nodes/images">
    أرسل الصور والمقاطع الصوتية والمستندات واستقبلها.
  </Card>
  <Card title="واجهة التحكم عبر الويب" icon="monitor" href="/ar/web/control-ui">
    لوحة معلومات في المتصفح للدردشة والتهيئة والجلسات والعُقد.
  </Card>
  <Card title="عُقد الأجهزة المحمولة" icon="smartphone" href="/ar/nodes">
    أقرن عُقد iOS وAndroid لاستخدام Canvas والكاميرا وتدفقات العمل المدعومة بالصوت.
  </Card>
</Columns>

## البدء السريع

<Steps>
  <Step title="تثبيت OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="إجراء الإعداد الأولي وتثبيت الخدمة">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="الدردشة">
    افتح واجهة التحكم في متصفحك وأرسل رسالة:

    ```bash
    openclaw dashboard
    ```

    أو اربط قناة ([Telegram](/ar/channels/telegram) هي الأسرع) وابدأ الدردشة من هاتفك.

  </Step>
</Steps>

هل تحتاج إلى تعليمات التثبيت وإعداد التطوير الكاملة؟ راجع [دليل البدء](/ar/start/getting-started).

## لوحة المعلومات

افتح واجهة التحكم في المتصفح بعد بدء تشغيل Gateway.

- الإعداد المحلي الافتراضي: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- الوصول عن بُعد: [واجهات الويب](/ar/web) و[Tailscale](/ar/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## التهيئة (اختيارية)

توجد التهيئة في `~/.openclaw/openclaw.json`.

- إذا **لم تفعل شيئًا**، فسيستخدم OpenClaw بيئة تشغيل وكيل OpenClaw المضمّنة؛ وتتشارك الرسائل المباشرة جلسة الوكيل الرئيسية، بينما تحصل كل دردشة جماعية على جلسة خاصة بها.
- إذا أردت تقييد الوصول، فابدأ باستخدام `channels.whatsapp.allowFrom` وقواعد الإشارة للمجموعات.

مثال:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## ابدأ من هنا

<Columns>
  <Card title="مراكز الوثائق" href="/ar/start/hubs" icon="book-open">
    جميع الوثائق والأدلة منظّمة حسب حالة الاستخدام.
  </Card>
  <Card title="التهيئة" href="/ar/gateway/configuration" icon="settings">
    إعدادات Gateway الأساسية والرموز المميزة وتهيئة المزوّد.
  </Card>
  <Card title="الوصول عن بُعد" href="/ar/gateway/remote" icon="globe">
    أنماط الوصول عبر SSH وشبكة tailnet.
  </Card>
  <Card title="القنوات" href="/ar/channels/telegram" icon="message-square">
    إعداد خاص بكل قناة لـ Discord وFeishu وMicrosoft Teams وTelegram وWhatsApp وغيرها.
  </Card>
  <Card title="العُقد" href="/ar/nodes" icon="smartphone">
    عُقد iOS وAndroid مع الاقتران وCanvas والكاميرا وإجراءات الجهاز.
  </Card>
  <Card title="المساعدة" href="/ar/help" icon="life-buoy">
    إصلاحات شائعة ونقطة بدء لاستكشاف الأخطاء وإصلاحها.
  </Card>
</Columns>

## معرفة المزيد

<Columns>
  <Card title="قائمة الميزات الكاملة" href="/ar/concepts/features" icon="list">
    إمكانات القنوات والتوجيه والوسائط كاملةً.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" href="/ar/concepts/multi-agent" icon="route">
    عزل مساحات العمل وجلسات خاصة بكل وكيل.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security" icon="shield">
    الرموز المميزة وقوائم السماح وضوابط السلامة.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/gateway/troubleshooting" icon="wrench">
    تشخيص Gateway والأخطاء الشائعة.
  </Card>
  <Card title="حول المشروع وشكر المساهمين" href="/ar/reference/credits" icon="info">
    نشأة المشروع والمساهمون والترخيص.
  </Card>
</Columns>
