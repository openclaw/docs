---
description: Real-world OpenClaw projects from the community
read_when:
    - البحث عن أمثلة فعلية لاستخدام OpenClaw
    - تحديث أبرز مشاريع المجتمع
summary: مشاريع وتكاملات أنشأها المجتمع بدعم من OpenClaw
title: معرض الأعمال
x-i18n:
    generated_at: "2026-07-12T06:37:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

مشاريع OpenClaw من بناء المجتمع: دورات مراجعة طلبات السحب، وتطبيقات الجوال، وأتمتة المنازل، والأنظمة الصوتية، وأدوات المطورين، وسير عمل الذاكرة، وكلها مبنية بأسلوب محادثة أصيل على Telegram وWhatsApp وDiscord والطرفيات.

<Info>
**هل تريد إبراز مشروعك؟** شارك مشروعك في [#self-promotion على Discord](https://discord.gg/clawd) أو [أشِر إلى @openclaw على X](https://x.com/openclaw).
</Info>

## الأحدث من Discord

أبرز المشاريع الحديثة في البرمجة وأدوات المطورين والجوال وبناء المنتجات القائمة على المحادثة.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

قل لوكيلك «انشر ملف HTML هذا» لتحصل على عنوان URL عام خلال ثانية تقريبًا. تنتهي صلاحية الصفحات تلقائيًا بعد ساعة — بلا خادم أو إعدادات أو تسجيل.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

الصق أي عنوان URL لتحصل على حكم بشأنه. أكثر من 2.5 مليون نطاق احتيالي من 38 موجزًا (PhishTank وOpenPhish وCERT.PL وغيرها)، وتُجرى المطابقة محليًا كي لا يغادر سجل التصفح الجهاز مطلقًا.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

ثلاثية لأعمال المنتجات: يقوم [الحوار السقراطي](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) بتمحيص السؤال قبل الإجابة، ويصنّف [استراتيجي نموذج كانو](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) الميزات وفق ما يستحق مكانه، وتعيد [مخرجات الوكيل الواضحة](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) صياغة مخرجات الوكيل بلغة بسيطة.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

يمنع منسّقات الوكلاء من البقاء في وضع الخمول أثناء عمل الوكلاء الفرعيين: آلية استدعاء غير متزامنة تصل فيها النتائج إلى صندوق بريد بدلًا من حظر الوكيل الأب.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

يبقي OpenClaw قابلًا للاستخدام على الأجهزة ذات ذاكرة 2–4 غيغابايت: يفحص الذاكرة المتاحة ويقلّص الميزات الثقيلة قبل أن يبدأ الجهاز باستخدام مساحة التبديل. [المصدر على GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

متتبّع لتكاليف الرموز من مهندس لدى NVIDIA مع دعم متكامل لـ OpenClaw: اعرف بدقة أين يذهب إنفاق وكيلك، حسب كل نموذج وكل جلسة.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

صِف مخططًا في المحادثة لتحصل على رسم Excalidraw مُنشأ برمجيًا.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

جعل OpenClaw يبني أداة الاستعلام الخاصة به لـ Google Analytics، ثم حزمها ونشرها على ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

يقيس أداء النماذج عبر 59 دورًا للوكلاء للإجابة عن سؤال «أي نموذج لغوي كبير يناسب وحدة معالجة الرسومات لدي؟». أداة مفضلة لدى المجتمع لاختيار النماذج المحلية.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

إنشاء أغانٍ مستقل عن المزوّد: خطط للمقطوعة، ونظّم كلمات الأغنية، وراجع النتائج المحدودة بدلًا من الاكتفاء بموجّه واحد. يتضمن [نسخة MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) مع التحكم في الإيقاع الموسيقي والمقام والبنية والمزج.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

ينهي OpenCode التغيير ويفتح طلب سحب، ثم يراجع OpenClaw الفروقات ويرد في Telegram باقتراحات وحكم واضح بشأن الدمج.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

طلب من «Robby» ‏(@openclaw) إنشاء مهارة محلية لقبو النبيذ. تطلب نموذجًا لتصدير CSV ومسارًا للتخزين، ثم تبني المهارة وتختبرها (962 زجاجة في المثال).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

خطة وجبات أسبوعية، ومشتريات معتادة، وحجز موعد التوصيل، وتأكيد الطلب. بلا واجهات API، مجرد تحكم في المتصفح.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

استخدم مفتاح اختصار لتحديد منطقة من الشاشة، ثم تعالجها رؤية Gemini، وتحصل فورًا على Markdown في الحافظة.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

تطبيق سطح مكتب لإدارة Skills والأوامر عبر Agents وClaude وCodex وOpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **المجتمع** • `voice` `tts` `telegram`

يغلّف خدمة تحويل النص إلى كلام من papla.media ويرسل النتائج كملاحظات صوتية عبر Telegram (من دون تشغيل تلقائي مزعج).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

أداة مساعدة تُثبّت عبر Homebrew لسرد جلسات OpenAI Codex المحلية وفحصها ومراقبتها (CLI وVS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

تحكّم في طابعات BambuLab واستكشف أعطالها: الحالة والمهام والكاميرا وAMS والمعايرة وغير ذلك.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

مواعيد المغادرة الفورية والاضطرابات وحالة المصاعد وتخطيط المسارات لوسائل النقل العام في فيينا.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

حجز آلي للوجبات المدرسية في المملكة المتحدة عبر ParentPay. يستخدم إحداثيات الفأرة للنقر الموثوق على خلايا الجدول.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

ارفع الملفات إلى Cloudflare R2/S3 وأنشئ روابط تنزيل آمنة موقعة مسبقًا. مفيد لمثيلات OpenClaw البعيدة.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

بنى تطبيق iOS كاملًا يتضمن خرائط وتسجيلًا صوتيًا، وأعدّه للتوزيع عبر App Store بالكامل من خلال محادثة Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

مساعد صحي شخصي بالذكاء الاصطناعي يدمج بيانات خاتم Oura مع التقويم والمواعيد وجدول النادي الرياضي.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

أكثر من 14 وكيلًا تحت Gateway واحد، مع منسّق Opus 4.5 يفوّض المهام إلى وكلاء Codex. راجع [الشرح التقني](https://github.com/adam91holt/orchestrated-ai-articles) و[Clawdspace](https://github.com/adam91holt/clawdspace) لعزل الوكلاء.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI لمنصة Linear يتكامل مع سير عمل الوكلاء (Claude Code وOpenClaw). أدر المشكلات والمشاريع وسير العمل من الطرفية.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

اقرأ الرسائل وأرسلها وأرشفها عبر Beeper Desktop. يستخدم واجهة MCP المحلية لـ Beeper كي يتمكن الوكلاء من إدارة جميع محادثاتك (iMessage وWhatsApp وغيرها) في مكان واحد.
</Card>

</CardGroup>

## الأتمتة وسير العمل

الجدولة والتحكم في المتصفح ودورات الدعم والجانب الذي «ينفّذ المهمة بالنيابة عني» من المنتج.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

اكتشف Claude Code عناصر التحكم في جهاز تنقية الهواء وأكّدها، ثم يتولى OpenClaw إدارة جودة هواء الغرفة.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

يُشغّل بواسطة كاميرا على السطح: اطلب من OpenClaw التقاط صورة للسماء كلما بدت جميلة. صمّم مهارة والتقط الصورة.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

ينشئ موجّه مجدول صورة مشهد واحدة كل صباح (الطقس والمهام والتاريخ والمنشور أو الاقتباس المفضل) عبر شخصية OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

أداة للتحقق من المواعيد المتاحة في Playtomic مع CLI للحجز. لن تفوّت ملعبًا متاحًا مرة أخرى.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **المجتمع** • `automation` `email` `pdf`

يجمع ملفات PDF من البريد الإلكتروني ويجهّز المستندات للمستشار الضريبي. محاسبة شهرية تعمل تلقائيًا.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

أعاد بناء موقع شخصي كامل عبر Telegram أثناء مشاهدة Netflix — من Notion إلى Astro، مع ترحيل 18 منشورًا ونقل DNS إلى Cloudflare. لم يفتح حاسوبًا محمولًا قط.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

يبحث في إعلانات الوظائف ويطابقها مع الكلمات المفتاحية في السيرة الذاتية ويعيد الفرص الملائمة مع روابطها. بُني خلال 30 دقيقة باستخدام واجهة JSearch API.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

اتصل OpenClaw بـ Jira، ثم أنشأ مهارة جديدة فورًا (قبل أن تكون موجودة على ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

أتمت مهام Todoist وجعل OpenClaw ينشئ المهارة مباشرةً في محادثة Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

يسجّل الدخول إلى TradingView عبر أتمتة المتصفح، ويلتقط صورًا للشاشات البيانية، ويُجري التحليل الفني عند الطلب. لا حاجة إلى API — يكفي التحكم في المتصفح.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

أُطلق OpenClaw للتفاوض مع وكلاء السيارات: فتولّى المفاوضات المتبادلة وخفّض السعر بمقدار 4,200 دولار.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

يعثر على الرحلة التالية في البريد الإلكتروني، ويُكمل إجراءات تسجيل الوصول عبر الإنترنت، ويختار مقعدًا بجانب النافذة — من دون الحاجة إلى تطبيق شركة الطيران.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

قدّم مطالبة تأمين وحدّد موعد المتابعة بصورة مستقلة.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

واجهة CLI لـ Idealista API للاستعلام عن العقارات وتقييمها، مغلّفة في صورة مهارة كي يتمكن الوكيل من البحث عن منزل عبر المحادثة.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

يراقب Gmail بحثًا عن أوامر العمل، ويحلّل صور العقارات المرسلة عبر Telegram، ويُنشئ ملفات PDF لعروض أسعار متعددة الصفحات باستخدام LaTeX، ويصدر الفواتير عبر Xero.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

يراقب قناة شركة على Slack، ويرد بطريقة مفيدة، ويعيد توجيه الإشعارات إلى Telegram. وقد أصلح بصورة مستقلة خللًا في بيئة الإنتاج داخل تطبيق منشور من دون أن يُطلب منه ذلك.
</Card>

</CardGroup>

## المعرفة والذاكرة

أنظمة تفهرس المعرفة الشخصية أو معرفة الفريق وتبحث فيها وتتذكرها وتستدل استنادًا إليها.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

محرك لتعلّم اللغة الصينية يقدّم ملاحظات على النطق ومسارات دراسية عبر OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

جمع 4 ملايين منشور من 100 من أبرز حسابات X وحوّلها إلى مسار تحليل يمكن الاستعلام فيه.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

نظّم نتائج تحاليل الدم المخبرية الممتدة لسنوات في قاعدة بيانات منظّمة على Notion.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

مساعد للاستخدام اليومي على WhatsApp، تُخزّن ذاكرته بالكامل بصيغة Markdown في خزنة Obsidian خاضعة للتحكم في الإصدارات: لتتبّع السعرات الحرارية والتمارين، وقوائم المهام، وإدارة شؤون الحياة.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

يعيش في محادثة جماعية عائلية على Telegram، ويوثّق قصص أكثر من 50 قريبًا، ويطرح أسئلة متابعة مستنيرة — ويرد باللغة النيبالية على الناطقين بها.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **المجتمع** • `memory` `transcription` `indexing`

يستوعب عمليات تصدير WhatsApp الكاملة، وينسخ أكثر من ألف ملاحظة صوتية، ويجري تحققًا متقاطعًا باستخدام سجلات git، ويُخرج تقارير Markdown مترابطة.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

يضيف البحث المتجهي إلى إشارات Karakeep المرجعية باستخدام Qdrant مع تضمينات OpenAI أو Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **المجتمع** • `memory` `beliefs` `self-model`

مدير ذاكرة منفصل يحوّل ملفات الجلسات إلى ذكريات، ثم إلى معتقدات، ثم إلى نموذج ذاتي متطور.
</Card>

</CardGroup>

## الصوت والهاتف

نقاط دخول تعتمد على الصوت أولًا، وجسور هاتفية، ومسارات عمل كثيفة النسخ الصوتي.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

نقرة واحدة على Pebble Ring تبدأ محادثة صوتية مع OpenClaw — ما يتيح الوصول إلى الوكيل من جهاز قابل للارتداء.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

استوديو وسائط متكامل داخل المحادثة: تحويل النص إلى كلام، والنسخ الصوتي، وأتمتة المتصفح، وكلها متصلة بـ Codex 5.2 وMiniMax.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

زر الإجراءات في iPhone متصل بـ OpenClaw: اضغط وتحدث، فيرد عليك الوكيل كما لو كان جهاز اتصال لاسلكيًا.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

جسر HTTP من المساعد الصوتي Vapi إلى OpenClaw. مكالمات هاتفية شبه فورية مع وكيلك.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

نسخ صوتي متعدد اللغات عبر OpenRouter ‏(Gemini وغيره). متاح على ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## البنية التحتية والنشر

الحزم والنشر وعمليات التكامل التي تجعل تشغيل OpenClaw وتوسيعه أسهل.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

تشغيل Gateway الخاص بـ OpenClaw على Home Assistant OS مع دعم نفق SSH والحالة الدائمة.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

التحكم في أجهزة Home Assistant وأتمتتها باستخدام اللغة الطبيعية.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

تطبيق أصلي بلغة Swift لشريط القوائم يعرض حالة الوكيل ويوفر عناصر تحكم سريعة.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

إعداد OpenClaw متكامل ومهيأ لـ Nix من أجل عمليات نشر قابلة لإعادة الإنتاج.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

مهارة تقويم تستخدم khal وvdirsyncer. تكامل مع تقويم مستضاف ذاتيًا.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## المنزل والأجهزة

جانب العالم المادي من OpenClaw: المنازل والمستشعرات والكاميرات والمكانس وغيرها من الأجهزة.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

عثر OpenClaw على أجهزة HomePod في الشبكة المحلية وكتب لنفسه مهارة للتحكم فيها.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

مكعب ثلاثي الأبعاد منخفض التكلفة يعمل بوصفه الوجه المادي للوكيل على المكتب.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

أتمتة منزلية أصلية لـ Nix تستخدم OpenClaw واجهةً لها، إلى جانب لوحات معلومات Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

تحكّم في مكنسة Roborock الروبوتية عبر محادثة طبيعية.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## مشاريع المجتمع

مشاريع تجاوزت نطاق مسار عمل واحد لتصبح منتجات أو منظومات أوسع.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **المجتمع** • `marketplace` `astronomy` `webapp`

سوق متكامل لمعدات علم الفلك، بُني باستخدام منظومة OpenClaw وحولها.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

تفاوض مفتوح بين الوكلاء: يساوم وكيلك على الصفقات والمواعيد واتفاقيات الخدمات مع العقد الأخرى، ويوقّع النتيجة تشفيريًا — وما عليك سوى الموافقة أو الرفض.
</Card>

</CardGroup>

## أرسل مشروعك

<Steps>
  <Step title="Share it">
    انشره في [#self-promotion على Discord](https://discord.gg/clawd) أو [غرّد إلى @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    أخبرنا بما يفعله، وأدرج رابط المستودع أو العرض التوضيحي، وشارك لقطة شاشة إن كانت لديك.
  </Step>
  <Step title="Get featured">
    سنضيف المشاريع المتميزة إلى هذه الصفحة.
  </Step>
</Steps>

## ذو صلة

- [بدء الاستخدام](/ar/start/getting-started)
- [OpenClaw](/ar/start/openclaw)
- [العرض الكامل على X في openclaw.ai](https://openclaw.ai/showcase/)
