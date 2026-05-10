---
read_when:
    - شما در حال ساخت یک Plugin جدید برای کانال پیام‌رسانی هستید
    - می‌خواهید OpenClaw را به یک پلتفرم پیام‌رسانی متصل کنید
    - باید سطح آداپتور ChannelPlugin را درک کنید
sidebarTitle: Channel Plugins
summary: راهنمای گام‌به‌گام برای ساخت Plugin کانال پیام‌رسانی برای OpenClaw
title: ساخت Plugin‌های کانال
x-i18n:
    generated_at: "2026-05-10T19:57:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

این راهنما ساخت یک Plugin کانال را توضیح می‌دهد که OpenClaw را به یک
پلتفرم پیام‌رسانی وصل می‌کند. در پایان، یک کانال کارآمد با امنیت DM،
جفت‌سازی، رشته‌بندی پاسخ‌ها، و پیام‌رسانی خروجی خواهید داشت.

<Info>
  اگر پیش‌تر هیچ Pluginای برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را بخوانید تا با ساختار پایه
  بسته و تنظیم manifest آشنا شوید.
</Info>

## Pluginهای کانال چگونه کار می‌کنند

Pluginهای کانال به ابزارهای send/edit/react اختصاصی خودشان نیاز ندارند. OpenClaw یک
ابزار مشترک `message` را در هسته نگه می‌دارد. Plugin شما مالک این موارد است:

- **پیکربندی** - تشخیص حساب و ویزارد راه‌اندازی
- **امنیت** - سیاست DM و allowlistها
- **جفت‌سازی** - جریان تأیید DM
- **دستور زبان نشست** - اینکه شناسه‌های مکالمه ویژه ارائه‌دهنده چگونه به چت‌های پایه، شناسه‌های رشته، و fallbackهای والد نگاشت می‌شوند
- **خروجی** - ارسال متن، رسانه، و نظرسنجی‌ها به پلتفرم
- **رشته‌بندی** - اینکه پاسخ‌ها چگونه رشته‌بندی می‌شوند
- **تایپ Heartbeat** - سیگنال‌های اختیاری تایپ/مشغول برای اهداف تحویل Heartbeat

هسته مالک ابزار پیام مشترک، اتصال prompt، شکل بیرونی کلید نشست،
ثبت‌ودفتر عمومی `:thread:`، و dispatch است.

Pluginهای کانال جدید باید یک adapter به نام `message` را نیز با
`defineChannelMessageAdapter` از `openclaw/plugin-sdk/channel-message` ارائه کنند. این
adapter اعلام می‌کند که انتقال native واقعاً از کدام قابلیت‌های durable final-send
پشتیبانی می‌کند و ارسال‌های متن/رسانه را به همان توابع انتقالی متصل می‌کند که
adapter قدیمی `outbound` استفاده می‌کند. فقط زمانی یک قابلیت را اعلام کنید که یک contract test
اثر جانبی native و رسید بازگشتی را اثبات کند.
برای قرارداد کامل API، نمونه‌ها، ماتریس قابلیت‌ها، قواعد رسید، نهایی‌سازی live
preview، سیاست receive ack، تست‌ها، و جدول مهاجرت، ببینید:
[API پیام کانال](/fa/plugins/sdk-channel-message).
اگر adapter موجود `outbound` از قبل متدهای ارسال و metadata قابلیت درست را دارد،
از `createChannelMessageAdapterFromOutbound(...)` برای مشتق کردن adapter `message`
استفاده کنید، به‌جای اینکه bridge دیگری را دستی بنویسید.
ارسال‌های adapter باید مقدارهای `MessageReceipt` برگردانند. وقتی کد سازگاری
هنوز به شناسه‌های قدیمی نیاز دارد، آن‌ها را با `listMessageReceiptPlatformIds(...)`
یا `resolveMessageReceiptPrimaryId(...)` مشتق کنید، به‌جای اینکه فیلدهای موازی
`messageIds` را در کد lifecycle جدید نگه دارید.
کانال‌های دارای قابلیت preview باید `message.live.capabilities` را نیز با
lifecycle زنده دقیقی که مالک آن هستند اعلام کنند، مانند `draftPreview`،
`previewFinalization`، `progressUpdates`، `nativeStreaming`، یا
`quietFinalization`. کانال‌هایی که یک draft preview را درجا نهایی می‌کنند
باید `message.live.finalizer.capabilities` را نیز اعلام کنند، مانند `finalEdit`،
`normalFallback`، `discardPending`، `previewReceipt`، و
`retainOnAmbiguousFailure`، و منطق runtime را از مسیر
`defineFinalizableLivePreviewAdapter(...)` به‌علاوه
`deliverWithFinalizableLivePreviewAdapter(...)` عبور دهند. این قابلیت‌ها را با
تست‌های `verifyChannelMessageLiveCapabilityAdapterProofs(...)` و
`verifyChannelMessageLiveFinalizerProofs(...)` پشتیبانی کنید تا رفتار native preview،
progress، edit، fallback/retention، cleanup، و receipt بی‌صدا منحرف نشود.
گیرنده‌های ورودی که تأییدیه‌های پلتفرم را به تعویق می‌اندازند باید
`message.receive.defaultAckPolicy` و `supportedAckPolicies` را اعلام کنند، به‌جای
اینکه زمان‌بندی ack را در state محلی monitor پنهان کنند. هر سیاست اعلام‌شده را با
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` پوشش دهید.

کمک‌تابع‌های قدیمی پاسخ/turn مانند `createChannelTurnReplyPipeline`،
`dispatchInboundReplyWithBase`، و `recordInboundSessionAndDispatchReply`
همچنان برای dispatcherهای سازگاری در دسترس هستند. از این نام‌ها برای کد کانال
جدید استفاده نکنید؛ Pluginهای جدید باید با adapter `message`، رسیدها، و
کمک‌تابع‌های lifecycle دریافت/ارسال در `openclaw/plugin-sdk/channel-message` شروع کنند.

کانال‌هایی که مجوزدهی ورودی را مهاجرت می‌دهند می‌توانند از subpath آزمایشی
`openclaw/plugin-sdk/channel-ingress-runtime` در مسیرهای receive runtime استفاده کنند.
این subpath lookup پلتفرم و اثرهای جانبی را در Plugin نگه می‌دارد، درحالی‌که
حل state مربوط به allowlist، تصمیم‌های route/sender/command/event/activation،
diagnosticهای redacted، و نگاشت turn-admission را مشترک می‌کند. نرمال‌سازی
هویت Plugin را در descriptorی که به resolver می‌دهید نگه دارید؛ مقدارهای خام match
را از state یا تصمیم resolveشده serialize نکنید. برای طراحی API،
مرز مالکیت، و انتظارات تست، ببینید:
[API ورود کانال](/fa/plugins/sdk-channel-ingress).

اگر کانال شما بیرون از پاسخ‌های ورودی از indicatorهای تایپ پشتیبانی می‌کند،
`heartbeat.sendTyping(...)` را روی Plugin کانال ارائه کنید. هسته پیش از شروع اجرای مدل
Heartbeat آن را با هدف تحویل Heartbeat resolveشده فراخوانی می‌کند و از lifecycle
مشترک keepalive/cleanup تایپ استفاده می‌کند. وقتی پلتفرم به سیگنال توقف صریح
نیاز دارد، `heartbeat.clearTyping(...)` را اضافه کنید.

اگر کانال شما پارامترهای ابزار پیام اضافه می‌کند که منبع رسانه را حمل می‌کنند،
نام آن پارامترها را از طریق `describeMessageTool(...).mediaSourceParams` ارائه کنید.
هسته از آن فهرست صریح برای نرمال‌سازی مسیر sandbox و سیاست دسترسی رسانه خروجی
استفاده می‌کند، بنابراین Pluginها برای پارامترهای ویژه ارائه‌دهنده مثل avatar،
attachment، یا cover-image به موردهای خاص در هسته مشترک نیاز ندارند.
ترجیح دهید یک map بر اساس کلید action برگردانید، مانند
`{ "set-profile": ["avatarUrl", "avatarPath"] }` تا actionهای نامرتبط
آرگومان‌های رسانه‌ای action دیگر را به ارث نبرند. یک آرایه تخت همچنان برای
پارامترهایی که عمداً در همه actionهای ارائه‌شده مشترک هستند کار می‌کند.

اگر کانال شما برای `message(action="send")` به شکل‌دهی ویژه ارائه‌دهنده نیاز دارد،
`actions.prepareSendPayload(...)` را ترجیح دهید. cardها، blockها، embedها، یا
داده‌های durable دیگر native را زیر `payload.channelData.<channel>` قرار دهید و
بگذارید هسته ارسال واقعی را از طریق adapter خروجی/پیام انجام دهد. از
`actions.handleAction(...)` برای send فقط به‌عنوان fallback سازگاری برای payloadهایی
استفاده کنید که نمی‌توان آن‌ها را serialize و retry کرد.

اگر پلتفرم شما scope اضافی را داخل شناسه‌های مکالمه ذخیره می‌کند، آن parsing را
با `messaging.resolveSessionConversation(...)` در Plugin نگه دارید. این hook
canonical برای نگاشت `rawId` به شناسه مکالمه پایه، شناسه رشته اختیاری،
`baseConversationId` صریح، و هر `parentConversationCandidates` است.
وقتی `parentConversationCandidates` را برمی‌گردانید، آن‌ها را از محدودترین والد
تا گسترده‌ترین/مکالمه پایه مرتب نگه دارید.

وقتی کد Plugin باید فیلدهای routeمانند را نرمال کند، یک رشته فرزند را با route
والدش مقایسه کند، یا از `{ channel, to, accountId, threadId }` یک کلید dedupe
پایدار بسازد، از `openclaw/plugin-sdk/channel-route` استفاده کنید. این helper
شناسه‌های رشته عددی را همان‌طور نرمال می‌کند که هسته انجام می‌دهد، بنابراین
Pluginها باید آن را به مقایسه‌های ad hoc مانند `String(threadId)` ترجیح دهند.
Pluginهایی با دستور زبان target ویژه ارائه‌دهنده می‌توانند parser خود را به
`resolveChannelRouteTargetWithParser(...)` تزریق کنند و همچنان همان شکل route target
و معناشناسی fallback رشته‌ای را بگیرند که هسته استفاده می‌کند.

Pluginهای bundled که پیش از بالا آمدن registry کانال به همان parsing نیاز دارند
می‌توانند یک فایل سطح بالای `session-key-api.ts` نیز با export متناظر
`resolveSessionConversation(...)` ارائه کنند. هسته فقط وقتی registry Plugin در runtime
هنوز در دسترس نیست از این سطح bootstrap-safe استفاده می‌کند.

`messaging.resolveParentConversationCandidates(...)` به‌عنوان fallback سازگاری قدیمی
وقتی یک Plugin فقط به fallbackهای والد روی generic/raw id نیاز دارد همچنان در دسترس است.
اگر هر دو hook وجود داشته باشند، هسته ابتدا از
`resolveSessionConversation(...).parentConversationCandidates` استفاده می‌کند و فقط
وقتی hook canonical آن‌ها را حذف کرده باشد به `resolveParentConversationCandidates(...)`
fallback می‌کند.

## تأییدها و قابلیت‌های کانال

بیشتر Pluginهای کانال به کد ویژه تأیید نیاز ندارند.

- هسته مالک `/approve` در همان چت، payloadهای دکمهٔ تأیید مشترک، و تحویل fallback عمومی است.
- وقتی کانال به رفتار ویژهٔ تأیید نیاز دارد، یک شیء `approvalCapability` روی Plugin کانال را ترجیح دهید.
- `ChannelPlugin.approvals` حذف شده است. اطلاعات تحویل/native/render/auth تأیید را روی `approvalCapability` قرار دهید.
- `plugin.auth` فقط برای ورود/خروج است؛ هسته دیگر hookهای auth تأیید را از آن شیء نمی‌خواند.
- `approvalCapability.authorizeActorAction` و `approvalCapability.getActionAvailabilityState` seam مرجع approval-auth هستند.
- برای دسترسی‌پذیری auth تأیید در همان چت، از `approvalCapability.getActionAvailabilityState` استفاده کنید.
- اگر کانال شما تأییدهای exec بومی را ارائه می‌کند، وقتی وضعیت initiating-surface/native-client با auth تأیید در همان چت متفاوت است، از `approvalCapability.getExecInitiatingSurfaceState` برای آن وضعیت استفاده کنید. هسته از آن hook ویژهٔ exec برای تمایز بین `enabled` و `disabled`، تصمیم‌گیری دربارهٔ اینکه آیا کانال initiating از تأییدهای exec بومی پشتیبانی می‌کند یا نه، و گنجاندن کانال در راهنمای fallback مربوط به native-client استفاده می‌کند. `createApproverRestrictedNativeApprovalCapability(...)` این مورد را برای حالت رایج پر می‌کند.
- برای رفتار چرخهٔ عمر payload مخصوص کانال، مانند پنهان کردن promptهای تأیید محلی تکراری یا ارسال نشانگرهای typing قبل از تحویل، از `outbound.shouldSuppressLocalPayloadPrompt` یا `outbound.beforeDeliverPayload` استفاده کنید.
- از `approvalCapability.delivery` فقط برای مسیریابی تأیید بومی یا سرکوب fallback استفاده کنید.
- برای اطلاعات تأیید بومیِ متعلق به کانال، از `approvalCapability.nativeRuntime` استفاده کنید. آن را روی entrypointهای داغ کانال با `createLazyChannelApprovalNativeRuntimeAdapter(...)` تنبل نگه دارید؛ این مورد می‌تواند ماژول runtime شما را در زمان نیاز import کند، درحالی‌که همچنان به هسته اجازه می‌دهد چرخهٔ عمر تأیید را سرهم‌بندی کند.
- از `approvalCapability.render` فقط زمانی استفاده کنید که یک کانال واقعاً به payloadهای تأیید سفارشی به‌جای renderer مشترک نیاز دارد.
- وقتی کانال می‌خواهد پاسخ مسیر disabled، knobهای دقیق config لازم برای فعال کردن تأییدهای exec بومی را توضیح دهد، از `approvalCapability.describeExecApprovalSetup` استفاده کنید. این hook مقدار `{ channel, channelLabel, accountId }` را دریافت می‌کند؛ کانال‌های named-account باید به‌جای پیش‌فرض‌های top-level، مسیرهای scoped به account مانند `channels.<channel>.accounts.<id>.execApprovals.*` را render کنند.
- اگر کانال می‌تواند هویت‌های DM پایدار و شبیه owner را از config موجود استنتاج کند، برای محدود کردن `/approve` در همان چت بدون افزودن منطق هستهٔ مخصوص تأیید، از `createResolvedApproverActionAuthAdapter` در `openclaw/plugin-sdk/approval-runtime` استفاده کنید.
- اگر یک کانال به تحویل تأیید بومی نیاز دارد، کد کانال را روی نرمال‌سازی target به‌همراه اطلاعات transport/presentation متمرکز نگه دارید. از `createChannelExecApprovalProfile`، `createChannelNativeOriginTargetResolver`، `createChannelApproverDmTargetResolver`، و `createApproverRestrictedNativeApprovalCapability` در `openclaw/plugin-sdk/approval-runtime` استفاده کنید. اطلاعات مخصوص کانال را پشت `approvalCapability.nativeRuntime` قرار دهید، ترجیحاً از طریق `createChannelApprovalNativeRuntimeAdapter(...)` یا `createLazyChannelApprovalNativeRuntimeAdapter(...)`، تا هسته بتواند handler را سرهم‌بندی کند و مالک فیلتر کردن request، مسیریابی، dedupe، expiry، subscription مربوط به Gateway، و اعلان‌های routed-elsewhere باشد. `nativeRuntime` به چند seam کوچک‌تر تقسیم شده است:
- `createChannelNativeOriginTargetResolver` به‌صورت پیش‌فرض از matcher مسیر کانال مشترک برای targetهای `{ to, accountId, threadId }` استفاده می‌کند. `targetsMatch` را فقط زمانی pass کنید که یک کانال قواعد هم‌ارزی مخصوص provider دارد، مانند match کردن پیشوند timestamp در Slack.
- وقتی کانال باید idهای provider را قبل از اجرای route matcher پیش‌فرض یا callback سفارشی `targetsMatch` canonicalize کند، درحالی‌که target اصلی برای تحویل حفظ می‌شود، `normalizeTargetForMatch` را به `createChannelNativeOriginTargetResolver` pass کنید. فقط زمانی از `normalizeTarget` استفاده کنید که خود target تحویل resolve‌شده باید canonicalize شود.
- `availability` - اینکه account پیکربندی شده است یا نه و اینکه آیا یک request باید handle شود یا نه
- `presentation` - نگاشت view model تأیید مشترک به payloadهای بومی pending/resolved/expired یا actionهای نهایی
- `transport` - آماده‌سازی targetها به‌همراه ارسال/به‌روزرسانی/حذف پیام‌های تأیید بومی
- `interactions` - hookهای اختیاری bind/unbind/clear-action برای دکمه‌ها یا reactionهای بومی
- `observe` - hookهای اختیاری diagnostics تحویل
- اگر کانال به اشیای runtime-owned مانند client، token، Bolt app، یا webhook receiver نیاز دارد، آن‌ها را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید. registry عمومی runtime-context به هسته اجازه می‌دهد handlerهای capability-driven را از وضعیت startup کانال bootstrap کند، بدون افزودن glue wrapper مخصوص تأیید.
- فقط زمانی سراغ `createChannelApprovalHandler` یا `createChannelNativeApprovalRuntime` سطح پایین‌تر بروید که seam مبتنی بر capability هنوز به‌اندازهٔ کافی گویا نیست.
- کانال‌های تأیید بومی باید هم `accountId` و هم `approvalKind` را از طریق آن helperها route کنند. `accountId` سیاست تأیید multi-account را در scope حساب bot درست نگه می‌دارد، و `approvalKind` رفتار تأیید exec در برابر Plugin را بدون branchهای hardcoded در هسته برای کانال در دسترس نگه می‌دارد.
- اکنون هسته مالک اعلان‌های reroute تأیید هم هست. Pluginهای کانال نباید پیام‌های follow-up اختصاصی خودشان مثل «تأیید به DMها / کانال دیگری رفت» را از `createChannelNativeApprovalRuntime` ارسال کنند؛ در عوض، مسیریابی دقیق origin + approver-DM را از طریق helperهای capability تأیید مشترک expose کنید و بگذارید هسته تحویل‌های واقعی را aggregate کند، سپس هر اعلانی را به چت initiating برگرداند.
- kind مربوط به id تأیید تحویل‌داده‌شده را end-to-end حفظ کنید. native clientها نباید
  مسیریابی تأیید exec در برابر Plugin را از وضعیت محلی کانال حدس بزنند یا بازنویسی کنند.
- kindهای مختلف تأیید می‌توانند عمداً surfaceهای بومی متفاوتی expose کنند.
  نمونه‌های bundled فعلی:
  - Slack مسیریابی تأیید بومی را برای هر دو id مربوط به exec و Plugin در دسترس نگه می‌دارد.
  - Matrix همان مسیریابی DM/channel بومی و UX مبتنی بر reaction را برای تأییدهای exec
    و Plugin نگه می‌دارد، درحالی‌که همچنان اجازه می‌دهد auth بر اساس kind تأیید متفاوت باشد.
- `createApproverRestrictedNativeApprovalAdapter` همچنان به‌عنوان wrapper سازگاری وجود دارد، اما کد جدید باید capability builder را ترجیح دهد و `approvalCapability` را روی Plugin expose کند.

برای entrypointهای داغ کانال، وقتی فقط به یک بخش از آن خانواده نیاز دارید،
زیرمسیرهای runtime محدودتر را ترجیح دهید:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

به همین ترتیب، وقتی به surface چتری گسترده‌تر نیاز ندارید،
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` را ترجیح دهید.

به‌طور خاص برای setup:

- `openclaw/plugin-sdk/setup-runtime` helperهای setup امن برای runtime را پوشش می‌دهد:
  setup patch adapterهای امن برای import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و builderهای setup-proxy
  واگذارشده
- `openclaw/plugin-sdk/setup-runtime` شامل seam adapter آگاه از env برای
  `createEnvPatchedAccountSetupAdapter` است
- `openclaw/plugin-sdk/channel-setup` builderهای setup مربوط به optional-install
  به‌همراه چند primitive امن برای setup را پوشش می‌دهد:
  `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`،

اگر کانال شما از setup یا auth مبتنی بر env پشتیبانی می‌کند و flowهای عمومی startup/config
باید آن نام‌های env را قبل از بارگذاری runtime بدانند، آن‌ها را در manifest
Plugin با `channelEnvVars` declare کنید. `envVars` در runtime کانال یا ثابت‌های محلی را
فقط برای متن‌های operator-facing نگه دارید.

اگر کانال شما می‌تواند پیش از شروع runtime Plugin در `status`، `channels list`، `channels status`، یا
scanهای SecretRef ظاهر شود، `openclaw.setupEntry` را در
`package.json` اضافه کنید. آن entrypoint باید برای import در مسیرهای command
read-only امن باشد و metadata کانال، adapter config امن برای setup، adapter status،
و metadata مربوط به channel secret target لازم برای آن summaryها را برگرداند. از setup entry
client، listener، یا runtimeهای transport را شروع نکنید.

مسیر import اصلی entry کانال را هم محدود نگه دارید. Discovery می‌تواند
entry و ماژول Plugin کانال را برای ثبت capabilityها ارزیابی کند، بدون اینکه
کانال را فعال کند. فایل‌هایی مانند `channel-plugin-api.ts` باید شیء Plugin کانال
را بدون import کردن setup wizardها، transport clientها، socket
listenerها، subprocess launcherها، یا ماژول‌های startup سرویس export کنند. آن بخش‌های runtime
را در ماژول‌هایی قرار دهید که از `registerFull(...)`، setterهای runtime، یا adapterهای
capability تنبل بارگذاری می‌شوند.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, and
`splitSetupEntries`

- فقط زمانی از seam گسترده‌تر `openclaw/plugin-sdk/setup` استفاده کنید که به
  helperهای setup/config مشترک سنگین‌تر مانند
  `moveSingleAccountChannelSectionToDefaultAccount(...)`
  هم نیاز دارید

اگر کانال شما فقط می‌خواهد در surfaceهای setup پیام «ابتدا این Plugin را نصب کنید» را تبلیغ کند،
`createOptionalChannelSetupSurface(...)` را ترجیح دهید. adapter/wizard تولیدشده
روی writeهای config و finalization به‌صورت fail-closed عمل می‌کنند، و همان پیام install-required
را در validation، finalize، و متن docs-link دوباره استفاده می‌کنند.

برای دیگر مسیرهای داغ کانال، helperهای محدود را نسبت به surfaceهای legacy
گسترده‌تر ترجیح دهید:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, and
  `openclaw/plugin-sdk/account-helpers` برای config چندحسابی و
  fallback حساب پیش‌فرض
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` برای route/envelope ورودی و
  سیم‌کشی record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` برای parse/match کردن target
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` برای بارگذاری media به‌همراه
  delegateهای identity/send خروجی و برنامه‌ریزی payload
- `buildThreadAwareOutboundSessionRoute(...)` از
  `openclaw/plugin-sdk/channel-core` وقتی یک route خروجی باید یک
  `replyToId`/`threadId` صریح را حفظ کند یا session فعلی `:thread:` را
  پس از اینکه کلید session پایه هنوز match می‌شود، بازیابی کند. Pluginهای provider می‌توانند
  precedence، رفتار suffix، و نرمال‌سازی thread id را وقتی platform آن‌ها
  semanticهای تحویل thread بومی دارد override کنند.
- `openclaw/plugin-sdk/thread-bindings-runtime` برای چرخهٔ عمر thread-binding
  و ثبت adapter
- `openclaw/plugin-sdk/agent-media-payload` فقط زمانی که layout legacy فیلد
  agent/media payload هنوز لازم است
- `openclaw/plugin-sdk/telegram-command-config` برای نرمال‌سازی command سفارشی
  Telegram، validation تکرار/تعارض، و contract config command پایدار در fallback

کانال‌های فقط-auth معمولاً می‌توانند در مسیر پیش‌فرض متوقف شوند: هسته تأییدها را handle می‌کند و Plugin فقط capabilityهای outbound/auth را expose می‌کند. کانال‌های تأیید بومی مانند Matrix، Slack، Telegram، و transportهای chat سفارشی باید به‌جای ساختن چرخهٔ عمر تأیید اختصاصی خودشان، از helperهای بومی مشترک استفاده کنند.

## سیاست mention ورودی

پردازش mention ورودی را در دو لایه جدا نگه دارید:

- گردآوری شواهد متعلق به Plugin
- ارزیابی سیاست مشترک

برای تصمیم‌های mention-policy از `openclaw/plugin-sdk/channel-mention-gating` استفاده کنید.
فقط زمانی از `openclaw/plugin-sdk/channel-inbound` استفاده کنید که به helper barrel ورودی
گسترده‌تر نیاز دارید.

مناسب برای منطق محلی Plugin:

- تشخیص reply-to-bot
- تشخیص quoted-bot
- بررسی‌های مشارکت در thread
- مستثنی‌سازی پیام‌های service/system
- cacheهای بومی platform لازم برای اثبات مشارکت bot

مناسب برای helper مشترک:

- `requireMention`
- نتیجهٔ اشارهٔ صریح
- فهرست مجاز اشارهٔ ضمنی
- دور زدن فرمان
- تصمیم نهایی برای رد کردن

جریان پیشنهادی:

1. واقعیت‌های اشارهٔ محلی را محاسبه کنید.
2. آن واقعیت‌ها را به `resolveInboundMentionDecision({ facts, policy })` بدهید.
3. از `decision.effectiveWasMentioned`، `decision.shouldBypassMention`، و `decision.shouldSkip` در دروازهٔ ورودی خود استفاده کنید.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` همان کمک‌کننده‌های مشترک اشاره را برای
Pluginهای کانال بسته‌بندی‌شده‌ای در دسترس می‌گذارد که از قبل به تزریق زمان اجرا
وابسته‌اند:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

اگر فقط به `implicitMentionKindWhen` و
`resolveInboundMentionDecision` نیاز دارید، برای جلوگیری از بارگذاری کمک‌کننده‌های
نامرتبط زمان اجرای ورودی، از
`openclaw/plugin-sdk/channel-mention-gating` ایمپورت کنید.

کمک‌کننده‌های قدیمی‌تر `resolveMentionGating*` همچنان روی
`openclaw/plugin-sdk/channel-inbound` فقط به‌عنوان خروجی‌های سازگاری باقی می‌مانند.
کد جدید باید از `resolveInboundMentionDecision({ facts, policy })` استفاده کند.

## راهنما

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    فایل‌های استاندارد Plugin را ایجاد کنید. فیلد `channel` در `package.json`
    چیزی است که این را به یک Plugin کانال تبدیل می‌کند. برای سطح کامل فرادادهٔ
    بسته، [راه‌اندازی و پیکربندی Plugin](/fa/plugins/sdk-setup#openclaw-channel) را
    ببینید:

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` مقدار `plugins.entries.acme-chat.config` را اعتبارسنجی می‌کند.
    از آن برای تنظیمات متعلق به Plugin که پیکربندی حساب کانال نیستند استفاده کنید.
    `channelConfigs` مقدار `channels.acme-chat` را اعتبارسنجی می‌کند و منبع مسیر
    سردی است که پیش از بارگذاری زمان اجرای Plugin توسط شمای پیکربندی، راه‌اندازی،
    و سطوح UI استفاده می‌شود.

  </Step>

  <Step title="Build the channel plugin object">
    رابط `ChannelPlugin` سطوح آداپتور اختیاری زیادی دارد. با حداقل موارد، یعنی
    `id` و `setup`، شروع کنید و آداپتورها را هر زمان که نیاز داشتید اضافه کنید.

    `src/channel.ts` را ایجاد کنید:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    برای کانال‌هایی که هم کلیدهای canonical سطح بالای DM و هم کلیدهای قدیمی
    تودرتو را می‌پذیرند، از کمک‌کننده‌های `plugin-sdk/channel-config-helpers`
    استفاده کنید: `resolveChannelDmAccess`، `resolveChannelDmPolicy`،
    `resolveChannelDmAllowFrom`، و `normalizeChannelDmPolicy` مقدارهای محلی حساب
    را جلوتر از مقدارهای ریشهٔ ارث‌بری‌شده نگه می‌دارند. همان resolver را از طریق
    `normalizeLegacyDmAliases` با تعمیر doctor جفت کنید تا زمان اجرا و مهاجرت
    همان قرارداد را بخوانند.

    <Accordion title="What createChatChannelPlugin does for you">
      به‌جای پیاده‌سازی دستی رابط‌های آداپتور سطح پایین، گزینه‌های اعلانی را
      می‌دهید و سازنده آن‌ها را ترکیب می‌کند:

      | گزینه | چیزی که سیم‌کشی می‌کند |
      | --- | --- |
      | `security.dm` | resolver امنیتی DM دامنه‌بندی‌شده از فیلدهای پیکربندی |
      | `pairing.text` | جریان جفت‌سازی DM متنی با تبادل کد |
      | `threading` | resolver حالت پاسخ‌دهی (ثابت، دامنه‌بندی‌شده به حساب، یا سفارشی) |
      | `outbound.attachedResults` | توابع ارسال که فرادادهٔ نتیجه (شناسه‌های پیام) برمی‌گردانند |

      اگر به کنترل کامل نیاز دارید، می‌توانید به‌جای گزینه‌های اعلانی، اشیای
      آداپتور خام را نیز بدهید.

      آداپتورهای خروجی خام می‌توانند تابع `chunker(text, limit, ctx)` تعریف کنند.
      مقدار اختیاری `ctx.formatting` تصمیم‌های قالب‌بندی زمان تحویل، مانند
      `maxLinesPerMessage`، را حمل می‌کند؛ آن را پیش از ارسال اعمال کنید تا
      رشته‌بندی پاسخ و مرزهای قطعه‌ها یک‌بار توسط تحویل خروجی مشترک حل شوند.
      بافت‌های ارسال همچنین وقتی یک هدف پاسخ native حل شده باشد، شامل
      `replyToIdSource` (`implicit` یا `explicit`) هستند، تا کمک‌کننده‌های payload
      بتوانند برچسب‌های پاسخ صریح را بدون مصرف یک جایگاه پاسخ ضمنی یک‌بارمصرف
      حفظ کنند.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    `index.ts` را ایجاد کنید:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    descriptorهای CLI متعلق به کانال را در `registerCliMetadata(...)` قرار دهید تا
    OpenClaw بتواند آن‌ها را بدون فعال کردن زمان اجرای کامل کانال در راهنمای ریشه
    نشان دهد، در حالی که بارگذاری‌های کامل عادی همچنان همان descriptorها را برای
    ثبت واقعی فرمان دریافت می‌کنند. `registerFull(...)` را برای کارهای فقط زمان
    اجرا نگه دارید. اگر `registerFull(...)` روش‌های RPC مربوط به Gateway را ثبت
    می‌کند، از یک پیشوند مختص Plugin استفاده کنید. فضاهای نام مدیریتی هسته
    (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) رزرو می‌مانند و همیشه
    به `operator.admin` resolve می‌شوند. `defineChannelPluginEntry` جداسازی حالت
    ثبت را به‌صورت خودکار انجام می‌دهد. برای همهٔ گزینه‌ها، [نقاط
    ورود](/fa/plugins/sdk-entrypoints#definechannelpluginentry) را ببینید.

  </Step>

  <Step title="Add a setup entry">
    برای بارگذاری سبک در زمان onboarding، `setup-entry.ts` را ایجاد کنید:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    وقتی کانال غیرفعال یا پیکربندی‌نشده باشد، OpenClaw این را به‌جای ورودی کامل
    بارگذاری می‌کند. این کار از کشیدن کد سنگین زمان اجرا به جریان‌های راه‌اندازی
    جلوگیری می‌کند. برای جزئیات، [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup#setup-entry)
    را ببینید.

    کانال‌های workspace بسته‌بندی‌شده‌ای که خروجی‌های امن برای راه‌اندازی را به
    ماژول‌های sidecar جدا می‌کنند، وقتی به setter صریح زمان اجرای زمان راه‌اندازی
    هم نیاز دارند، می‌توانند از `defineBundledChannelSetupEntry(...)` از
    `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند.

  </Step>

  <Step title="Handle inbound messages">
    Plugin شما باید پیام‌ها را از پلتفرم دریافت کند و آن‌ها را به OpenClaw
    بفرستد. الگوی معمول یک Webhook است که درخواست را تأیید می‌کند و آن را از
    طریق handler ورودی کانال شما dispatch می‌کند:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      مدیریت پیام‌های ورودی مختص هر کانال است. هر Plugin کانال مالک
      خط لولهٔ ورودی خودش است. برای الگوهای واقعی به Pluginهای کانال همراه
      (برای مثال بستهٔ Plugin مربوط به Microsoft Teams یا Google Chat) نگاه کنید.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
آزمون‌های هم‌مکان را در `src/channel.test.ts` بنویسید:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    برای کمک‌یارهای آزمون مشترک، [آزمون](/fa/plugins/sdk-testing) را ببینید.

</Step>
</Steps>

## ساختار فایل

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## موضوعات پیشرفته

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/fa/plugins/sdk-entrypoints#registration-mode">
    حالت‌های پاسخ ثابت، محدود به حساب، یا سفارشی
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/fa/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool و کشف کنش
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/fa/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType، looksLikeId، resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، STT، رسانه، زیرعامل از طریق api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/fa/plugins/sdk-channel-turn">
    چرخهٔ عمر نوبت ورودی مشترک: دریافت، حل، ثبت، ارسال، نهایی‌سازی
  </Card>
</CardGroup>

<Note>
برخی seamهای کمک‌یار همراه هنوز برای نگهداری Pluginهای همراه و
سازگاری وجود دارند. آن‌ها الگوی پیشنهادی برای Pluginهای کانال جدید نیستند؛
مگر اینکه مستقیماً در حال نگهداری آن خانوادهٔ Plugin همراه باشید، مسیرهای فرعی
عمومی channel/setup/reply/runtime را از سطح SDK مشترک ترجیح دهید.
</Note>

## گام‌های بعدی

- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - اگر Plugin شما مدل‌ها را هم ارائه می‌دهد
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل import مسیرهای فرعی
- [آزمون SDK](/fa/plugins/sdk-testing) - ابزارهای آزمون و آزمون‌های قرارداد
- [Manifest مربوط به Plugin](/fa/plugins/manifest) - شمای کامل manifest

## مرتبط

- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [Pluginهای پوستهٔ عامل](/fa/plugins/sdk-agent-harness)
