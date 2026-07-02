---
description: Real-world OpenClaw projects from the community
read_when:
    - البحث عن أمثلة استخدام حقيقية لـ OpenClaw
    - تحديث أبرز مشاريع المجتمع
summary: مشاريع وتكاملات أنشأها المجتمع وتعمل بواسطة OpenClaw
title: معرض
x-i18n:
    generated_at: "2026-07-02T08:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

مشاريع OpenClaw ليست عروضًا تجريبية بسيطة. يستخدم الناس OpenClaw فعليًا لتشغيل حلقات مراجعة PR، وتطبيقات جوّال، وأتمتة منزلية، وأنظمة صوتية، وأدوات devtools، وسير عمل كثيفة الذاكرة من القنوات التي يستخدمونها أصلًا — عمليات بناء مدمجة في المحادثة على Telegram وWhatsApp وDiscord والطرفيات؛ وأتمتة حقيقية للحجز والتسوق والدعم من دون انتظار API؛ وتكاملات مع العالم المادي تشمل الطابعات والمكانس والكاميرات وأنظمة المنزل.

<Info>
**هل تريد إبراز مشروعك؟** شارك مشروعك في [#self-promotion على Discord](https://discord.gg/clawd) أو [اذكر @openclaw على X](https://x.com/openclaw).
</Info>

## جديد من Discord

نماذج حديثة بارزة في البرمجة، وdevtools، والجوّال، وبناء المنتجات المدمجة في المحادثة.

<CardGroup cols={2}>

<Card title="مراجعة PR إلى ملاحظات Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

ينهي OpenCode التغيير، ويفتح PR، ويراجع OpenClaw الفروقات ثم يرد في Telegram باقتراحات مع حكم دمج واضح.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="ملاحظات مراجعة PR من OpenClaw مُرسلة في Telegram" />
</Card>

<Card title="Skill لقبو النبيذ في دقائق" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

طلب Skill محلي لقبو النبيذ من "Robby" (@openclaw). يطلب تصدير CSV نموذجيًا ومسار تخزين، ثم يبني Skill ويختبره (962 زجاجة في المثال).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw يبني Skill محليًا لقبو النبيذ من CSV" />
</Card>

<Card title="طيار Tesco Shop الآلي" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

خطة وجبات أسبوعية، المشتريات المعتادة، حجز خانة توصيل، تأكيد الطلب. لا توجد API، بل تحكم في المتصفح فقط.

  <img src="/assets/showcase/tesco-shop.jpg" alt="أتمتة متجر Tesco عبر المحادثة" />
</Card>

<Card title="SNAG من لقطة شاشة إلى Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

اختصار لوحة مفاتيح لمنطقة من الشاشة، ورؤية Gemini، وMarkdown فوري في الحافظة.

  <img src="/assets/showcase/snag.png" alt="أداة SNAG من لقطة شاشة إلى Markdown" />
</Card>

<Card title="واجهة Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

تطبيق سطح مكتب لإدارة Skills والأوامر عبر Agents وClaude وCodex وOpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="تطبيق واجهة Agents" />
</Card>

<Card title="ملاحظات Telegram الصوتية (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

يلف TTS من papla.media ويرسل النتائج كملاحظات صوتية في Telegram (من دون تشغيل تلقائي مزعج).

  <img src="/assets/showcase/papla-tts.jpg" alt="مخرجات ملاحظة صوتية في Telegram من TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

مساعد مثبّت عبر Homebrew لعرض جلسات OpenAI Codex المحلية وفحصها ومراقبتها (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor على ClawHub" />
</Card>

<Card title="التحكم بطابعة Bambu ثلاثية الأبعاد" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

التحكم في طابعات BambuLab واستكشاف مشكلاتها: الحالة، والمهام، والكاميرا، وAMS، والمعايرة، والمزيد.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI على ClawHub" />
</Card>

<Card title="مواصلات فيينا (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

مغادرات آنية، واضطرابات، وحالة المصاعد، وتوجيهات لمواصلات فيينا العامة.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien على ClawHub" />
</Card>

<Card title="وجبات ParentPay المدرسية" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

حجز آلي لوجبات المدارس في المملكة المتحدة عبر ParentPay. يستخدم إحداثيات الفأرة للنقر الموثوق على خلايا الجدول.
</Card>

<Card title="رفع R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

ارفع إلى Cloudflare R2/S3 وأنشئ روابط تنزيل آمنة موقعة مسبقًا. مفيد لمثيلات OpenClaw البعيدة.

  <img src="/assets/showcase/r2-upload.png" alt="Skill رفع R2 على ClawHub" />
</Card>

<Card title="تطبيق iOS عبر Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

بنى تطبيق iOS كاملًا مع خرائط وتسجيل صوتي، وجُهّز للتوزيع عبر App Store بالكامل عبر محادثة Telegram.
</Card>

<Card title="مساعد صحة Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

مساعد صحة شخصي بالذكاء الاصطناعي يدمج بيانات خاتم Oura مع التقويم والمواعيد وجدول النادي الرياضي.

  <img src="/assets/showcase/oura-health.png" alt="مساعد صحة Oura Ring" />
</Card>

<Card title="فريق Kev الحلم (أكثر من 14 وكيلًا)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

أكثر من 14 وكيلًا تحت Gateway واحدة مع منسق Opus 4.5 يفوض إلى عمال Codex. راجع [الشرح التقني](https://github.com/adam91holt/orchestrated-ai-articles) و[Clawdspace](https://github.com/adam91holt/clawdspace) لعزل الوكلاء.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI لـ Linear يتكامل مع سير العمل الوكيلية (Claude Code وOpenClaw). أدر القضايا والمشاريع وسير العمل من الطرفية.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

اقرأ الرسائل وأرسلها وأرشفها عبر Beeper Desktop. يستخدم Beeper local MCP API حتى تتمكن الوكلاء من إدارة كل محادثاتك (iMessage وWhatsApp والمزيد) في مكان واحد.
</Card>

</CardGroup>

## الأتمتة وسير العمل

الجدولة، والتحكم في المتصفح، وحلقات الدعم، وجانب "أنجز المهمة نيابة عني" من المنتج.

<CardGroup cols={2}>

<Card title="التحكم في منقّي هواء Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

اكتشف Claude Code عناصر التحكم في المنقّي وأكدها، ثم يتولى OpenClaw إدارة جودة هواء الغرفة.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="التحكم في منقّي هواء Winix عبر OpenClaw" />
</Card>

<Card title="لقطات كاميرا جميلة للسماء" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

تُشغَّل بكاميرا على السطح: اطلب من OpenClaw التقاط صورة للسماء كلما بدت جميلة. صمم Skill والتقط الصورة.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="لقطة للسماء من كاميرا سطح التقطها OpenClaw" />
</Card>

<Card title="مشهد موجز صباحي بصري" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

ينشئ موجه مجدول صورة مشهد واحدة كل صباح (الطقس، والمهام، والتاريخ، والمنشور أو الاقتباس المفضل) عبر شخصية OpenClaw.
</Card>

<Card title="حجز ملعب بادل" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

مدقق توافر Playtomic مع CLI للحجز. لا تفوّت ملعبًا متاحًا مرة أخرى.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="لقطة شاشة padel-cli" />
</Card>

<Card title="استقبال مستندات المحاسبة" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

يجمع ملفات PDF من البريد الإلكتروني، ويحضّر المستندات لمستشار ضريبي. محاسبة شهرية على الطيار الآلي.
</Card>

<Card title="وضع تطوير من الأريكة" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

أعاد بناء موقع شخصي كامل عبر Telegram أثناء مشاهدة Netflix — من Notion إلى Astro، مع ترحيل 18 منشورًا، وDNS إلى Cloudflare. لم يفتح حاسوبًا محمولًا.
</Card>

<Card title="وكيل بحث عن وظائف" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

يبحث في إعلانات الوظائف، ويطابقها مع كلمات CV المفتاحية، ويعيد فرصًا ذات صلة مع روابط. بُني في 30 دقيقة باستخدام JSearch API.
</Card>

<Card title="منشئ Skill لـ Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

اتصل OpenClaw بـ Jira، ثم ولّد Skill جديدًا في الحال (قبل أن يكون موجودًا على ClawHub).
</Card>

<Card title="Skill لـ Todoist عبر Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

أتمت مهام Todoist وجعل OpenClaw يولّد Skill مباشرة داخل محادثة Telegram.
</Card>

<Card title="تحليل TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

يسجل الدخول إلى TradingView عبر أتمتة المتصفح، ويلتقط لقطات شاشة للرسوم البيانية، ويجري تحليلًا فنيًا عند الطلب. لا حاجة إلى API — فقط تحكم في المتصفح.
</Card>

<Card title="دعم Slack التلقائي" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

يراقب قناة Slack لشركة، ويرد بمساعدة، ويحوّل الإشعارات إلى Telegram. أصلح ذاتيًا خطأ إنتاجيًا في تطبيق منشور من دون أن يُطلب منه ذلك.
</Card>

</CardGroup>

## المعرفة والذاكرة

أنظمة تفهرس وتبحث وتتذكر وتستدل على معرفة شخصية أو معرفة فريق.

<CardGroup cols={2}>

<Card title="تعلم الصينية xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

محرك لتعلم الصينية مع ملاحظات على النطق وتدفقات دراسة عبر OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="ملاحظات نطق xuezh" />
</Card>

<Card title="خزنة ذاكرة WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

يستوعب صادرات WhatsApp كاملة، وينسخ أكثر من ألف ملاحظة صوتية، ويقارنها مع سجلات git، ويخرج تقارير markdown مترابطة.
</Card>

<Card title="بحث Karakeep الدلالي" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

يضيف بحثًا متجهيًا إلى إشارات Karakeep المرجعية باستخدام Qdrant مع تضمينات OpenAI أو Ollama.
</Card>

<Card title="ذاكرة Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

مدير ذاكرة منفصل يحوّل ملفات الجلسات إلى ذكريات، ثم إلى معتقدات، ثم إلى نموذج ذاتي متطور.
</Card>

</CardGroup>

## الصوت والهاتف

نقاط دخول تعتمد على الكلام أولًا، وجسور هاتفية، وسير عمل كثيفة النسخ.

<CardGroup cols={2}>

<Card title="جسر هاتف Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

جسر من مساعد Vapi الصوتي إلى OpenClaw عبر HTTP. مكالمات هاتفية شبه آنية مع وكيلك.
</Card>

<Card title="نسخ OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

نسخ صوتي متعدد اللغات عبر OpenRouter (Gemini والمزيد). متاح على ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill نسخ OpenRouter على ClawHub" />
</Card>

</CardGroup>

## البنية التحتية والنشر

التغليف، والنشر، والتكاملات التي تجعل OpenClaw أسهل تشغيلًا وتوسيعًا.

<CardGroup cols={2}>

<Card title="إضافة Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway لـ OpenClaw يعمل على Home Assistant OS مع دعم نفق SSH وحالة مستمرة.
</Card>

<Card title="مهارة Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

تحكّم في أجهزة Home Assistant وأتمتها عبر اللغة الطبيعية.

  <img src="/assets/showcase/homeassistant.png" alt="مهارة Home Assistant على ClawHub" />
</Card>

<Card title="حزم Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

تهيئة OpenClaw مهيأة لـ Nix وشاملة لكل ما يلزم لعمليات نشر قابلة لإعادة الإنتاج.
</Card>

<Card title="تقويم CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

مهارة تقويم تستخدم khal وvdirsyncer. تكامل تقويم مستضاف ذاتيًا.

  <img src="/assets/showcase/caldav-calendar.png" alt="مهارة تقويم CalDAV على ClawHub" />
</Card>

</CardGroup>

## المنزل والأجهزة

الجانب المتصل بالعالم المادي من OpenClaw: المنازل، وأجهزة الاستشعار، والكاميرات، والمكانس الكهربائية، والأجهزة الأخرى.

<CardGroup cols={2}>

<Card title="أتمتة GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

أتمتة منزلية أصلية لـ Nix مع OpenClaw كواجهة، بالإضافة إلى لوحات معلومات Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="لوحة معلومات GoHome Grafana" />
</Card>

<Card title="مكنسة Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

تحكّم في مكنسة Roborock الروبوتية عبر محادثة طبيعية.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="حالة Roborock" />
</Card>

</CardGroup>

## مشاريع المجتمع

أشياء نمت إلى ما هو أبعد من سير عمل واحد لتصبح منتجات أو منظومات أوسع.

<CardGroup cols={2}>

<Card title="سوق StarSwap" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

سوق كامل لمعدات علم الفلك. بُني باستخدام منظومة OpenClaw وبالتمحور حولها.
</Card>

</CardGroup>

## أرسل مشروعك

<Steps>
  <Step title="شاركه">
    انشر في [#self-promotion على Discord](https://discord.gg/clawd) أو [غرّد إلى @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="أدرج التفاصيل">
    أخبرنا بما يفعله، وضع رابطًا إلى المستودع أو العرض التوضيحي، وشارك لقطة شاشة إذا كانت لديك.
  </Step>
  <Step title="احصل على التمييز">
    سنضيف المشاريع البارزة إلى هذه الصفحة.
  </Step>
</Steps>

## ذو صلة

- [بدء الاستخدام](/ar/start/getting-started)
- [OpenClaw](/ar/start/openclaw)
