---
read_when:
    - تريد قائمة كاملة بما يدعمه OpenClaw
summary: قدرات OpenClaw عبر القنوات والتوجيه والوسائط وتجربة المستخدم.
title: الميزات
x-i18n:
    generated_at: "2026-05-06T07:47:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## أبرز الميزات

<Columns>
  <Card title="القنوات" icon="message-square" href="/ar/channels">
    Discord وiMessage وSignal وSlack وTelegram وWhatsApp وWebChat والمزيد عبر Gateway واحد.
  </Card>
  <Card title="Plugins" icon="plug" href="/ar/tools/plugin">
    تضيف Plugins المضمّنة Matrix وNextcloud Talk وNostr وTwitch وZalo والمزيد دون عمليات تثبيت منفصلة في الإصدارات الحالية العادية.
  </Card>
  <Card title="التوجيه" icon="route" href="/ar/concepts/multi-agent">
    توجيه متعدد الوكلاء مع جلسات معزولة.
  </Card>
  <Card title="الوسائط" icon="image" href="/ar/nodes/images">
    الصور والصوت والفيديو والمستندات وإنشاء الصور/الفيديو.
  </Card>
  <Card title="التطبيقات وواجهة المستخدم" icon="monitor" href="/ar/web/control-ui">
    واجهة تحكم الويب وتطبيق macOS المرافق.
  </Card>
  <Card title="عُقد الأجهزة المحمولة" icon="smartphone" href="/ar/nodes">
    عُقد iOS وAndroid مع الاقتران والصوت/الدردشة وأوامر الأجهزة الغنية.
  </Card>
</Columns>

## القائمة الكاملة

**القنوات:**

- تشمل القنوات المضمّنة Discord وGoogle Chat وiMessage (قديم) وIRC وSignal وSlack وTelegram وWebChat وWhatsApp
- تشمل قنوات Plugin المضمّنة BlueBubbles لـ iMessage وFeishu وLINE وMatrix وMattermost وMicrosoft Teams وNextcloud Talk وNostr وQQ Bot وSynology Chat وTlon وTwitch وZalo وZalo Personal
- تشمل Plugins القنوات الاختيارية المثبتة بشكل منفصل Voice Call وحزم الجهات الخارجية مثل WeChat
- يمكن لـ Plugins قنوات الجهات الخارجية توسيع Gateway أكثر، مثل WeChat
- دعم دردشة المجموعات مع تفعيل قائم على الإشارة
- أمان الرسائل المباشرة مع قوائم السماح والاقتران

**الوكيل:**

- وقت تشغيل وكيل مضمّن مع بث الأدوات
- توجيه متعدد الوكلاء مع جلسات معزولة لكل مساحة عمل أو مُرسِل
- الجلسات: تُدمج الدردشات المباشرة في `main` مشتركة؛ أما المجموعات فمعزولة
- البث والتجزئة للاستجابات الطويلة

**المصادقة والمزوّدون:**

- أكثر من 35 مزوّد نماذج (Anthropic وOpenAI وGoogle والمزيد)
- مصادقة اشتراك عبر OAuth (مثل OpenAI Codex)
- دعم المزوّدين المخصصين والمستضافين ذاتيًا (vLLM وSGLang وOllama وأي نقطة نهاية متوافقة مع OpenAI أو Anthropic)

**الوسائط:**

- إدخال وإخراج الصور والصوت والفيديو والمستندات
- أسطح إمكانات مشتركة لإنشاء الصور وإنشاء الفيديو
- نسخ الملاحظات الصوتية
- تحويل النص إلى كلام مع عدة مزوّدين

**التطبيقات والواجهات:**

- WebChat وواجهة تحكم المتصفح
- تطبيق شريط قوائم macOS المرافق
- عقدة iOS مع الاقتران وCanvas والكاميرا وتسجيل الشاشة والموقع والصوت
- عقدة Android مع الاقتران والدردشة والصوت وCanvas والكاميرا وأوامر الجهاز

**الأدوات والأتمتة:**

- أتمتة المتصفح والتنفيذ والعزل
- بحث الويب (Brave وDuckDuckGo وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وOllama Web Search وPerplexity وSearXNG وTavily)
- مهام Cron وجدولة Heartbeat
- Skills وPlugins ومسارات سير العمل (Lobster)

## ذات صلة

<CardGroup cols={2}>
  <Card title="الميزات التجريبية" href="/ar/concepts/experimental-features" icon="flask">
    ميزات اختيارية لم تُشحن بعد إلى السطح الافتراضي.
  </Card>
  <Card title="وقت تشغيل الوكيل" href="/ar/concepts/agent" icon="robot">
    نموذج وقت تشغيل الوكيل وكيفية إرسال التشغيلات.
  </Card>
  <Card title="القنوات" href="/ar/channels" icon="message-square">
    وصّل Telegram وWhatsApp وDiscord وSlack والمزيد من Gateway واحد.
  </Card>
  <Card title="Plugins" href="/ar/tools/plugin" icon="plug">
    Plugins المضمّنة وPlugins الجهات الخارجية التي توسّع OpenClaw.
  </Card>
</CardGroup>
