---
read_when:
    - تريد قائمة كاملة بكل ما يدعمه OpenClaw
summary: إمكانات OpenClaw عبر القنوات، والتوجيه، والوسائط، وتجربة الاستخدام.
title: الميزات
x-i18n:
    generated_at: "2026-04-24T07:37:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## أبرز الميزات

<Columns>
  <Card title="القنوات" icon="message-square" href="/ar/channels">
    Discord، وiMessage، وSignal، وSlack، وTelegram، وWhatsApp، وWebChat، وغير ذلك عبر Gateway واحد.
  </Card>
  <Card title="Plugins" icon="plug" href="/ar/tools/plugin">
    تضيف Plugins المضمّنة Matrix، وNextcloud Talk، وNostr، وTwitch، وZalo، وغير ذلك من دون تثبيتات منفصلة في الإصدارات الحالية العادية.
  </Card>
  <Card title="التوجيه" icon="route" href="/ar/concepts/multi-agent">
    توجيه متعدد الوكلاء مع جلسات معزولة.
  </Card>
  <Card title="الوسائط" icon="image" href="/ar/nodes/images">
    الصور، والصوت، والفيديو، والمستندات، وتوليد الصور/الفيديو.
  </Card>
  <Card title="التطبيقات وواجهة المستخدم" icon="monitor" href="/ar/web/control-ui">
    واجهة التحكم UI على الويب وتطبيق macOS المرافق.
  </Card>
  <Card title="Node على الأجهزة المحمولة" icon="smartphone" href="/ar/nodes">
    Node على iOS وAndroid مع الاقتران، والصوت/الدردشة، وأوامر الجهاز الغنية.
  </Card>
</Columns>

## القائمة الكاملة

**القنوات:**

- تشمل القنوات المدمجة Discord، وGoogle Chat، وiMessage (قديم)، وIRC، وSignal، وSlack، وTelegram، وWebChat، وWhatsApp
- تشمل قنوات Plugins المضمّنة BlueBubbles لـ iMessage، وFeishu، وLINE، وMatrix، وMattermost، وMicrosoft Teams، وNextcloud Talk، وNostr، وQQ Bot، وSynology Chat، وTlon، وTwitch، وZalo، وZalo Personal
- تشمل Plugins القنوات الاختيارية المثبتة بشكل منفصل Voice Call وحزمًا خارجية مثل WeChat
- يمكن أن توسّع Plugins القنوات الخارجية Gateway بشكل أكبر، مثل WeChat
- دعم الدردشة الجماعية مع التفعيل القائم على الإشارات
- أمان الرسائل الخاصة عبر قوائم السماح والاقتران

**الوكيل:**

- Runtime وكيل مضمّن مع بث الأدوات
- توجيه متعدد الوكلاء مع جلسات معزولة لكل مساحة عمل أو مرسل
- الجلسات: تُدمج المحادثات المباشرة في `main` مشترك؛ وتكون المجموعات معزولة
- البث والتقسيم للردود الطويلة

**المصادقة والمزوّدون:**

- أكثر من 35 مزوّد نماذج (Anthropic، وOpenAI، وGoogle، وغير ذلك)
- مصادقة الاشتراك عبر OAuth (مثل OpenAI Codex)
- دعم المزوّدين المخصصين والمستضافين ذاتيًا (vLLM، وSGLang، وOllama، وأي نقطة نهاية متوافقة مع OpenAI أو متوافقة مع Anthropic)

**الوسائط:**

- الصور، والصوت، والفيديو، والمستندات إدخالًا وإخراجًا
- أسطح إمكانات مشتركة لتوليد الصور وتوليد الفيديو
- نسخ الملاحظات الصوتية
- تحويل النص إلى كلام مع عدة مزوّدين

**التطبيقات والواجهات:**

- WebChat وواجهة التحكم UI في المتصفح
- تطبيق مرافق في شريط قوائم macOS
- Node على iOS مع الاقتران، وCanvas، والكاميرا، وتسجيل الشاشة، والموقع، والصوت
- Node على Android مع الاقتران، والدردشة، والصوت، وCanvas، والكاميرا، وأوامر الجهاز

**الأدوات والأتمتة:**

- أتمتة المتصفح، وexec، وsandboxing
- البحث على الويب (Brave، وDuckDuckGo، وExa، وFirecrawl، وGemini، وGrok، وKimi، وMiniMax Search، وOllama Web Search، وPerplexity، وSearXNG، وTavily)
- مهام Cron وجدولة Heartbeat
- Skills، وPlugins، وخطوط أنابيب سير العمل (Lobster)

## ذو صلة

- [الميزات التجريبية](/ar/concepts/experimental-features)
- [Runtime الوكيل](/ar/concepts/agent)
