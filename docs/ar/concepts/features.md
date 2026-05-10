---
read_when:
    - تريد قائمة كاملة بكل ما يدعمه OpenClaw
summary: إمكانات OpenClaw عبر القنوات والتوجيه والوسائط وتجربة المستخدم.
title: الميزات
x-i18n:
    generated_at: "2026-05-10T19:33:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## أبرز الميزات

<Columns>
  <Card title="القنوات" icon="message-square" href="/ar/channels">
    Discord وiMessage وSignal وSlack وTelegram وWhatsApp وWebChat والمزيد عبر Gateway واحد.
  </Card>
  <Card title="Plugins" icon="plug" href="/ar/tools/plugin">
    تضيف Plugins المضمّنة Matrix وNextcloud Talk وNostr وTwitch وZalo والمزيد من دون عمليات تثبيت منفصلة في الإصدارات الحالية العادية.
  </Card>
  <Card title="التوجيه" icon="route" href="/ar/concepts/multi-agent">
    توجيه متعدد الوكلاء مع جلسات معزولة.
  </Card>
  <Card title="الوسائط" icon="image" href="/ar/nodes/images">
    الصور والصوت والفيديو والمستندات وتوليد الصور/الفيديو.
  </Card>
  <Card title="التطبيقات وواجهة المستخدم" icon="monitor" href="/ar/web/control-ui">
    واجهة Web Control UI وتطبيق macOS المرافق.
  </Card>
  <Card title="عُقد الهاتف المحمول" icon="smartphone" href="/ar/nodes">
    عُقد iOS وAndroid مع الاقتران والصوت/الدردشة وأوامر الجهاز الغنية.
  </Card>
</Columns>

## القائمة الكاملة

**القنوات:**

- تشمل القنوات المدمجة Discord وGoogle Chat وiMessage وIRC وSignal وSlack وTelegram وWebChat وWhatsApp
- تشمل قنوات Plugins المضمّنة Feishu وLINE وMatrix وMattermost وMicrosoft Teams وNextcloud Talk وNostr وQQ Bot وSynology Chat وTlon وTwitch وZalo وZalo Personal
- تشمل Plugins القنوات الاختيارية المثبّتة بشكل منفصل Voice Call وحزم الجهات الخارجية مثل WeChat
- يمكن لـ Plugins القنوات التابعة لجهات خارجية توسيع Gateway أكثر، مثل WeChat
- دعم الدردشة الجماعية مع التفعيل المستند إلى الإشارة
- أمان الرسائل المباشرة باستخدام قوائم السماح والاقتران

**الوكيل:**

- وقت تشغيل وكيل مضمّن مع بث الأدوات
- توجيه متعدد الوكلاء مع جلسات معزولة لكل مساحة عمل أو مرسل
- الجلسات: تُدمج الدردشات المباشرة في `main` مشتركة؛ وتكون المجموعات معزولة
- البث والتجزئة للاستجابات الطويلة

**المصادقة والمزوّدون:**

- أكثر من 35 مزوّد نماذج (Anthropic وOpenAI وGoogle والمزيد)
- مصادقة الاشتراك عبر OAuth (مثل OpenAI Codex)
- دعم المزوّدين المخصّصين والمستضافين ذاتيًا (vLLM وSGLang وOllama وأي نقطة نهاية متوافقة مع OpenAI أو Anthropic)

**الوسائط:**

- إدخال وإخراج الصور والصوت والفيديو والمستندات
- أسطح قدرات مشتركة لتوليد الصور وتوليد الفيديو
- نسخ الملاحظات الصوتية
- تحويل النص إلى كلام مع عدة مزوّدين

**التطبيقات والواجهات:**

- WebChat وواجهة Control UI في المتصفح
- تطبيق مرافق في شريط قوائم macOS
- عقدة iOS مع الاقتران وCanvas والكاميرا وتسجيل الشاشة والموقع والصوت
- عقدة Android مع الاقتران والدردشة والصوت وCanvas والكاميرا وأوامر الجهاز

**الأدوات والأتمتة:**

- أتمتة المتصفح، والتنفيذ، والعزل
- البحث على الويب (Brave وDuckDuckGo وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وOllama Web Search وPerplexity وSearXNG وTavily)
- مهام Cron وجدولة Heartbeat
- Skills وPlugins ومسارات سير العمل (Lobster)

## ذات صلة

<CardGroup cols={2}>
  <Card title="الميزات التجريبية" href="/ar/concepts/experimental-features" icon="flask">
    ميزات اختيارية لم تُشحن بعد إلى السطح الافتراضي.
  </Card>
  <Card title="وقت تشغيل الوكيل" href="/ar/concepts/agent" icon="robot">
    نموذج وقت تشغيل الوكيل وكيفية إرسال عمليات التشغيل.
  </Card>
  <Card title="القنوات" href="/ar/channels" icon="message-square">
    صِل Telegram وWhatsApp وDiscord وSlack والمزيد من Gateway واحد.
  </Card>
  <Card title="Plugins" href="/ar/tools/plugin" icon="plug">
    Plugins مضمّنة وتابعة لجهات خارجية توسّع OpenClaw.
  </Card>
</CardGroup>
