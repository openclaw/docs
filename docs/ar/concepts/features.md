---
read_when:
    - تريد قائمة كاملة بما يدعمه OpenClaw
summary: إمكانات OpenClaw عبر القنوات والتوجيه والوسائط وتجربة المستخدم.
title: الميزات
x-i18n:
    generated_at: "2026-07-12T05:46:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## أبرز الميزات

<Columns>
  <Card title="القنوات" icon="message-square" href="/ar/channels">
    Discord وiMessage وSignal وSlack وTelegram وWhatsApp وWebChat وغيرها عبر Gateway واحدة.
  </Card>
  <Card title="الإضافات" icon="plug" href="/ar/tools/plugin">
    تضيف الإضافات الرسمية Matrix وNextcloud Talk وNostr وTwitch وZalo وعشرات الخدمات الأخرى بأمر تثبيت واحد.
  </Card>
  <Card title="التوجيه" icon="route" href="/ar/concepts/multi-agent">
    توجيه متعدد الوكلاء مع جلسات معزولة.
  </Card>
  <Card title="الوسائط" icon="image" href="/ar/nodes/images">
    الصور والصوت والفيديو والمستندات وتوليد الصور والفيديو.
  </Card>
  <Card title="التطبيقات وواجهة المستخدم" icon="monitor" href="/ar/platforms">
    مركز Windows وواجهة التحكم في المتصفح وتطبيق شريط قوائم macOS والعُقد المحمولة.
  </Card>
  <Card title="العُقد المحمولة" icon="smartphone" href="/ar/nodes">
    عُقد iOS وAndroid مزودة بالاقتران والصوت والدردشة وأوامر الأجهزة المتقدمة.
  </Card>
</Columns>

## القائمة الكاملة

**القنوات:**

- تأتي iMessage وTelegram وWebChat ضمن التثبيت الأساسي؛ أما كل قناة أخرى فهي إضافة
  رسمية تُثبَّت باستخدام `openclaw plugins install @openclaw/<id>` (أو عند الطلب
  أثناء `openclaw onboard` / `openclaw channels add`)
- قنوات الإضافات الرسمية: Discord وFeishu وGoogle Chat وIRC وLINE وMatrix وMattermost
  وMicrosoft Teams وNextcloud Talk وNostr وQQ Bot وRaft وSignal وSlack وSMS وSynology Chat
  وTlon وTwitch وVoice Call وWhatsApp وZalo وZalo Personal
- قنوات إضافات خارجية تُصان خارج مستودع OpenClaw: WeChat وYuanbao وZalo ClawBot
- دعم الدردشة الجماعية مع التنشيط المستند إلى الإشارة
- أمان الرسائل المباشرة باستخدام قوائم السماح والاقتران

**الوكيل:**

- بيئة تشغيل وكيل مضمّنة مع بث الأدوات
- توجيه متعدد الوكلاء مع جلسات معزولة لكل مساحة عمل أو مُرسِل
- الجلسات: تُدمج المحادثات المباشرة في جلسة `main` مشتركة؛ بينما تُعزل المجموعات
- البث والتقسيم إلى أجزاء للاستجابات الطويلة

**المصادقة ومزوّدو الخدمة:**

- أكثر من 35 مزوّدًا للنماذج (Anthropic وOpenAI وGoogle وغيرها)
- مصادقة الاشتراك عبر OAuth (مثل OpenAI Codex)
- دعم المزوّدين المخصصين والمستضافين ذاتيًا (vLLM وSGLang وOllama وllama.cpp وLM Studio
  وأي نقطة نهاية متوافقة مع OpenAI أو Anthropic)

**الوسائط:**

- إدخال الصور والصوت والفيديو والمستندات وإخراجها
- واجهات قدرات مشتركة لتوليد الصور والفيديو
- نسخ الملاحظات الصوتية
- تحويل النص إلى كلام عبر مزوّدين متعددين

**التطبيقات والواجهات:**

- WebChat وواجهة التحكم في المتصفح
- تطبيق مرافق في شريط قوائم macOS
- عقدة iOS مزودة بالاقتران وCanvas والكاميرا وتسجيل الشاشة والموقع والصوت
- عقدة Android مزودة بالاقتران والدردشة والصوت وCanvas والكاميرا وأوامر الجهاز

**الأدوات والأتمتة:**

- أتمتة المتصفح والتنفيذ والعزل
- البحث على الويب (Brave وDuckDuckGo وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وOllama Web Search وPerplexity وSearXNG وTavily)
- مهام Cron وجدولة Heartbeat
- Skills والإضافات ومسارات سير العمل (Lobster)

## ذو صلة

<CardGroup cols={2}>
  <Card title="الميزات التجريبية" href="/ar/concepts/experimental-features" icon="flask">
    ميزات اختيارية لم تُطرح بعد ضمن الواجهة الافتراضية.
  </Card>
  <Card title="بيئة تشغيل الوكيل" href="/ar/concepts/agent" icon="robot">
    نموذج بيئة تشغيل الوكيل وكيفية توزيع عمليات التشغيل.
  </Card>
  <Card title="القنوات" href="/ar/channels" icon="message-square">
    صِل Telegram وWhatsApp وDiscord وSlack وغيرها من خلال Gateway واحدة.
  </Card>
  <Card title="الإضافات" href="/ar/tools/plugin" icon="plug">
    إضافات رسمية وخارجية توسّع إمكانات OpenClaw.
  </Card>
</CardGroup>
