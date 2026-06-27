---
description: Real-world OpenClaw projects from the community
read_when:
    - البحث عن أمثلة استخدام حقيقية لـ OpenClaw
    - تحديث أبرز مشاريع المجتمع
summary: مشاريع وتكاملات أنشأها المجتمع وتعمل بواسطة OpenClaw
title: معرض
x-i18n:
    generated_at: "2026-06-27T18:37:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

مشاريع OpenClaw ليست عروضًا تجريبية بسيطة. يستخدم الناس OpenClaw لشحن حلقات مراجعة PR، وتطبيقات الجوال، وأتمتة المنزل، وأنظمة الصوت، وأدوات المطورين، وسير عمل كثيفة الذاكرة من القنوات التي يستخدمونها بالفعل — بناءات أصلية للدردشة على Telegram وWhatsApp وDiscord والطرفيات؛ وأتمتة حقيقية للحجز والتسوق والدعم دون انتظار API؛ وتكاملات مع العالم المادي تشمل الطابعات والمكانس والكاميرات وأنظمة المنزل.

<Info>
**هل تريد إبراز مشروعك؟** شارك مشروعك في [#self-promotion على Discord](https://discord.gg/clawd) أو [اذكر @openclaw على X](https://x.com/openclaw).
</Info>

## جديد من Discord

نماذج بارزة حديثة في البرمجة وأدوات المطورين والجوال وبناء المنتجات الأصلية للدردشة.

<CardGroup cols={2}>

<Card title="مراجعة PR إلى ملاحظات Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

ينهي OpenCode التغيير، ويفتح PR، ويراجع OpenClaw الفروقات ويرد في Telegram باقتراحات مع حكم دمج واضح.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="ملاحظات مراجعة PR من OpenClaw مُرسلة في Telegram" />
</Card>

<Card title="Skill لقبو النبيذ في دقائق" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

طلب Skill محلية لقبو النبيذ من "Robby" (@openclaw). يطلب تصدير CSV نموذجيًا ومسار تخزين، ثم يبني Skill ويختبرها (962 زجاجة في المثال).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw يبني Skill محلية لقبو نبيذ من CSV" />
</Card>

<Card title="طيار Tesco Shop الآلي" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

خطة وجبات أسبوعية، العناصر المعتادة، حجز خانة التسليم، تأكيد الطلب. لا API، فقط تحكم في المتصفح.

  <img src="/assets/showcase/tesco-shop.jpg" alt="أتمتة Tesco shop عبر الدردشة" />
</Card>

<Card title="SNAG من لقطة شاشة إلى Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

اختصار لمنطقة من الشاشة، رؤية Gemini، وMarkdown فوري في الحافظة.

  <img src="/assets/showcase/snag.png" alt="أداة SNAG لتحويل لقطات الشاشة إلى markdown" />
</Card>

<Card title="واجهة Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

تطبيق سطح مكتب لإدارة Skills والأوامر عبر Agents وClaude وCodex وOpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="تطبيق واجهة Agents" />
</Card>

<Card title="ملاحظات Telegram الصوتية (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

يلف TTS الخاص بـ papla.media ويرسل النتائج كملاحظات صوتية على Telegram (بدون تشغيل تلقائي مزعج).

  <img src="/assets/showcase/papla-tts.jpg" alt="إخراج ملاحظة صوتية في Telegram من TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

مساعد مُثبّت عبر Homebrew لسرد جلسات OpenAI Codex المحلية وفحصها ومراقبتها (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor على ClawHub" />
</Card>

<Card title="التحكم في طابعة Bambu ثلاثية الأبعاد" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

تحكم في طابعات BambuLab واستكشاف مشكلاتها: الحالة، والمهام، والكاميرا، وAMS، والمعايرة، والمزيد.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI على ClawHub" />
</Card>

<Card title="مواصلات فيينا (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

المغادرات الفورية، والانقطاعات، وحالة المصاعد، وتخطيط المسارات للنقل العام في فيينا.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien على ClawHub" />
</Card>

<Card title="وجبات ParentPay المدرسية" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

حجز وجبات المدارس في المملكة المتحدة تلقائيًا عبر ParentPay. يستخدم إحداثيات الماوس للنقر الموثوق على خلايا الجداول.
</Card>

<Card title="رفع R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

ارفع إلى Cloudflare R2/S3 وأنشئ روابط تنزيل آمنة موقعة مسبقًا. مفيد لمثيلات OpenClaw البعيدة.

  <img src="/assets/showcase/r2-upload.png" alt="Skill رفع R2 على ClawHub" />
</Card>

<Card title="تطبيق iOS عبر Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

بُني تطبيق iOS كامل مع خرائط وتسجيل صوتي، ونُشر إلى TestFlight بالكامل عبر دردشة Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="تطبيق iOS على TestFlight" />
</Card>

<Card title="مساعد صحة Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

مساعد صحة شخصي بالذكاء الاصطناعي يدمج بيانات خاتم Oura مع التقويم والمواعيد وجدول النادي الرياضي.

  <img src="/assets/showcase/oura-health.png" alt="مساعد صحة خاتم Oura" />
</Card>

<Card title="فريق أحلام Kev (أكثر من 14 وكيلاً)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

أكثر من 14 وكيلاً تحت Gateway واحدة مع منسق Opus 4.5 يفوض إلى عاملي Codex. راجع [الشرح التقني](https://github.com/adam91holt/orchestrated-ai-articles) و[Clawdspace](https://github.com/adam91holt/clawdspace) لعزل الوكلاء.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI لـ Linear يتكامل مع سير العمل الوكيلي (Claude Code، OpenClaw). أدر القضايا والمشاريع وسير العمل من الطرفية.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

اقرأ الرسائل وأرسلها وأرشفها عبر Beeper Desktop. يستخدم API محليًا من Beeper MCP بحيث يمكن للوكلاء إدارة كل دردشاتك (iMessage وWhatsApp والمزيد) في مكان واحد.
</Card>

</CardGroup>

## الأتمتة وسير العمل

الجدولة، والتحكم في المتصفح، وحلقات الدعم، وجانب "نفذ المهمة عني فقط" في المنتج.

<CardGroup cols={2}>

<Card title="التحكم في منقي هواء Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

اكتشف Claude Code عناصر التحكم في المنقي وأكدها، ثم يتولى OpenClaw إدارة جودة هواء الغرفة.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="التحكم في منقي هواء Winix عبر OpenClaw" />
</Card>

<Card title="لقطات جميلة لكاميرا السماء" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

تُشغّلها كاميرا على السطح: اطلب من OpenClaw التقاط صورة للسماء كلما بدت جميلة. صمم Skill والتقط الصورة.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="لقطة سماء من كاميرا سطح التقطها OpenClaw" />
</Card>

<Card title="مشهد إحاطة صباحية مرئي" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

تُنشئ مطالبة مجدولة صورة مشهد واحدة كل صباح (الطقس، المهام، التاريخ، منشور أو اقتباس مفضل) عبر شخصية OpenClaw.
</Card>

<Card title="حجز ملعب Padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

مدقق توافر Playtomic مع CLI للحجز. لن تفوت ملعبًا شاغرًا مرة أخرى.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="لقطة شاشة padel-cli" />
</Card>

<Card title="استقبال المحاسبة" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

يجمع ملفات PDF من البريد الإلكتروني، ويجهز المستندات لمستشار ضريبي. محاسبة شهرية على الطيار الآلي.
</Card>

<Card title="وضع تطوير على الأريكة" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

أعاد بناء موقع شخصي كامل عبر Telegram أثناء مشاهدة Netflix — من Notion إلى Astro، مع ترحيل 18 منشورًا، وDNS إلى Cloudflare. لم يفتح حاسوبًا محمولًا.
</Card>

<Card title="وكيل البحث عن وظائف" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

يبحث في إعلانات الوظائف، ويطابقها مع كلمات السيرة الذاتية المفتاحية، ويعيد الفرص ذات الصلة مع الروابط. بُني في 30 دقيقة باستخدام JSearch API.
</Card>

<Card title="منشئ Skill لـ Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

اتصل OpenClaw بـ Jira، ثم أنشأ Skill جديدة فورًا (قبل أن تكون موجودة على ClawHub).
</Card>

<Card title="Skill Todoist عبر Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

أتمت مهام Todoist وجعل OpenClaw ينشئ Skill مباشرة في دردشة Telegram.
</Card>

<Card title="تحليل TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

يسجل الدخول إلى TradingView عبر أتمتة المتصفح، ويلتقط صورًا للرسوم البيانية، ويجري تحليلًا فنيًا عند الطلب. لا حاجة إلى API — فقط تحكم في المتصفح.
</Card>

<Card title="دعم Slack الآلي" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

يراقب قناة Slack للشركة، ويرد بشكل مفيد، ويحوّل الإشعارات إلى Telegram. أصلح ذاتيًا خطأً إنتاجيًا في تطبيق منشور دون أن يُطلب منه ذلك.
</Card>

</CardGroup>

## المعرفة والذاكرة

أنظمة تفهرس المعرفة الشخصية أو معرفة الفرق وتبحث فيها وتتذكرها وتستدل عليها.

<CardGroup cols={2}>

<Card title="تعلم الصينية xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

محرك لتعلم الصينية مع ملاحظات على النطق وتدفقات دراسة عبر OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="ملاحظات نطق xuezh" />
</Card>

<Card title="خزنة ذاكرة WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

يستوعب صادرات WhatsApp كاملة، ويفرغ أكثر من 1k ملاحظة صوتية نصيًا، ويطابقها مع سجلات git، ويخرج تقارير markdown مترابطة.
</Card>

<Card title="بحث Karakeep الدلالي" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

يضيف بحثًا متجهيًا إلى إشارات Karakeep باستخدام Qdrant مع تضمينات OpenAI أو Ollama.
</Card>

<Card title="ذاكرة Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

مدير ذاكرة منفصل يحول ملفات الجلسات إلى ذكريات، ثم معتقدات، ثم نموذج ذاتي متطور.
</Card>

</CardGroup>

## الصوت والهاتف

نقاط دخول تعتمد على الكلام أولًا، وجسور هاتفية، وسير عمل كثيفة التفريغ النصي.

<CardGroup cols={2}>

<Card title="جسر هاتف Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

جسر من مساعد Vapi الصوتي إلى HTTP لـ OpenClaw. مكالمات هاتفية شبه فورية مع وكيلك.
</Card>

<Card title="تفريغ OpenRouter النصي" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

تفريغ صوتي متعدد اللغات عبر OpenRouter (Gemini والمزيد). متاح على ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill تفريغ OpenRouter النصي على ClawHub" />
</Card>

</CardGroup>

## البنية التحتية والنشر

الحزم والنشر والتكاملات التي تجعل تشغيل OpenClaw وتوسيعه أسهل.

<CardGroup cols={2}>

<Card title="إضافة Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway الخاص بـ OpenClaw يعمل على Home Assistant OS مع دعم نفق SSH وحالة دائمة.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

تحكّم في أجهزة Home Assistant وأتمتها باستخدام اللغة الطبيعية.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

إعداد OpenClaw متكامل مبني على Nix لعمليات نشر قابلة لإعادة الإنتاج.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

مهارة تقويم تستخدم khal وvdirsyncer. تكامل تقويم مستضاف ذاتيًا.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## المنزل والأجهزة

جانب العالم المادي من OpenClaw: المنازل، والمستشعرات، والكاميرات، والمكانس، والأجهزة الأخرى.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

أتمتة منزلية أصلية لـ Nix مع OpenClaw كواجهة، بالإضافة إلى لوحات معلومات Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

تحكّم في مكنسة Roborock الروبوتية من خلال محادثة طبيعية.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## مشاريع المجتمع

أشياء تجاوزت سير عمل واحدًا لتصبح منتجات أو منظومات أوسع.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **المجتمع** • `marketplace` `astronomy` `webapp`

سوق متكامل لمعدات علم الفلك. بُني باستخدام منظومة OpenClaw وحولها.
</Card>

</CardGroup>

## أرسل مشروعك

<Steps>
  <Step title="Share it">
    انشر في [#self-promotion على Discord](https://discord.gg/clawd) أو [غرّد إلى @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    أخبرنا بما يفعله، وضع رابطًا إلى المستودع أو العرض التوضيحي، وشارك لقطة شاشة إن كانت لديك.
  </Step>
  <Step title="Get featured">
    سنضيف المشاريع البارزة إلى هذه الصفحة.
  </Step>
</Steps>

## ذات صلة

- [بدء الاستخدام](/ar/start/getting-started)
- [OpenClaw](/ar/start/openclaw)
