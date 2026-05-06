---
read_when:
    - شما در حال ساخت یک Plugin جدید برای کانال پیام‌رسانی هستید
    - می‌خواهید OpenClaw را به یک پلتفرم پیام‌رسان متصل کنید
    - باید سطح آداپتور ChannelPlugin را درک کنید
sidebarTitle: Channel Plugins
summary: راهنمای گام‌به‌گام برای ساخت یک Plugin کانال پیام‌رسانی برای OpenClaw
title: ساخت Pluginهای کانال
x-i18n:
    generated_at: "2026-05-06T09:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

این راهنما ساخت یک Plugin کانال را توضیح می‌دهد که OpenClaw را به یک
پلتفرم پیام‌رسانی وصل می‌کند. در پایان، یک کانال عملیاتی با امنیت پیام مستقیم،
جفت‌سازی، رشته‌بندی پاسخ‌ها، و پیام‌رسانی خروجی خواهید داشت.

<Info>
  اگر قبلاً هیچ Pluginای برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و تنظیم manifest بخوانید.
</Info>

## Pluginهای کانال چگونه کار می‌کنند

Pluginهای کانال به ابزارهای send/edit/react اختصاصی نیاز ندارند. OpenClaw یک
ابزار مشترک `message` را در هسته نگه می‌دارد. Plugin شما مالک این بخش‌هاست:

- **پیکربندی** - حل حساب و راه‌انداز تنظیمات
- **امنیت** - سیاست پیام مستقیم و فهرست‌های مجاز
- **جفت‌سازی** - جریان تأیید پیام مستقیم
- **دستور زبان نشست** - اینکه شناسه‌های گفت‌وگوی ویژه ارائه‌دهنده چگونه به چت‌های پایه، شناسه‌های رشته، و fallbackهای والد نگاشت می‌شوند
- **خروجی** - ارسال متن، رسانه، و نظرسنجی‌ها به پلتفرم
- **رشته‌بندی** - اینکه پاسخ‌ها چگونه رشته‌بندی می‌شوند
- **تایپ Heartbeat** - سیگنال‌های اختیاری تایپ/مشغول برای مقصدهای تحویل Heartbeat

هسته مالک ابزار پیام مشترک، اتصال prompt، شکل بیرونی کلید نشست،
ثبت‌های عمومی `:thread:`، و dispatch است.

Pluginهای کانال جدید همچنین باید یک adapter به نام `message` را با
`defineChannelMessageAdapter` از `openclaw/plugin-sdk/channel-message` ارائه کنند.
adapter اعلام می‌کند transport بومی واقعاً از کدام قابلیت‌های ارسال نهایی پایدار
پشتیبانی می‌کند و ارسال‌های متن/رسانه را به همان توابع transport که adapter قدیمی
`outbound` استفاده می‌کند وصل می‌کند. فقط وقتی یک تست قرارداد اثر جانبی بومی و
رسید برگشتی را اثبات می‌کند، یک قابلیت را اعلام کنید.
برای قرارداد کامل API، مثال‌ها، ماتریس قابلیت‌ها، قواعد رسید، نهایی‌سازی
پیش‌نمایش زنده، سیاست ack دریافت، تست‌ها، و جدول مهاجرت، ببینید:
[API پیام کانال](/fa/plugins/sdk-channel-message).
اگر adapter فعلی `outbound` همین حالا متدهای ارسال و فراداده قابلیت درست را دارد،
از `createChannelMessageAdapterFromOutbound(...)` برای استخراج adapter به نام
`message` استفاده کنید، به‌جای اینکه پل دیگری را دستی بنویسید.
ارسال‌های adapter باید مقدارهای `MessageReceipt` برگردانند. وقتی کد سازگاری هنوز
به شناسه‌های قدیمی نیاز دارد، آن‌ها را با `listMessageReceiptPlatformIds(...)`
یا `resolveMessageReceiptPrimaryId(...)` استخراج کنید، به‌جای نگه داشتن فیلدهای
موازی `messageIds` در کد lifecycle جدید.
کانال‌های دارای قابلیت پیش‌نمایش همچنین باید `message.live.capabilities` را با
lifecycle زنده دقیقی که مالک آن هستند اعلام کنند، مانند `draftPreview`،
`previewFinalization`، `progressUpdates`، `nativeStreaming`، یا
`quietFinalization`. کانال‌هایی که یک پیش‌نمایش پیش‌نویس را درجا نهایی می‌کنند
همچنین باید `message.live.finalizer.capabilities` را اعلام کنند، مانند `finalEdit`،
`normalFallback`، `discardPending`، `previewReceipt`، و
`retainOnAmbiguousFailure`، و منطق runtime را از مسیر
`defineFinalizableLivePreviewAdapter(...)` به‌علاوه
`deliverWithFinalizableLivePreviewAdapter(...)` عبور دهند. این قابلیت‌ها را با
تست‌های `verifyChannelMessageLiveCapabilityAdapterProofs(...)` و
`verifyChannelMessageLiveFinalizerProofs(...)` پشتیبانی کنید تا رفتار پیش‌نمایش،
پیشرفت، ویرایش، fallback/نگهداری، پاک‌سازی، و رسید بومی نتواند بی‌صدا منحرف شود.
گیرنده‌های ورودی که تأییدهای پلتفرم را به تعویق می‌اندازند باید
`message.receive.defaultAckPolicy` و `supportedAckPolicies` را اعلام کنند، به‌جای
اینکه زمان‌بندی ack را در وضعیت محلی monitor پنهان کنند. هر سیاست اعلام‌شده را با
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` پوشش دهید.

کمک‌گرهای قدیمی پاسخ/نوبت مانند `createChannelTurnReplyPipeline`،
`dispatchInboundReplyWithBase`، و `recordInboundSessionAndDispatchReply` همچنان
برای dispatcherهای سازگاری در دسترس هستند. از این نام‌ها برای کد کانال جدید
استفاده نکنید؛ Pluginهای جدید باید با adapter به نام `message`، رسیدها، و
کمک‌گرهای lifecycle دریافت/ارسال در `openclaw/plugin-sdk/channel-message` شروع کنند.

اگر کانال شما از نشانگرهای تایپ بیرون از پاسخ‌های ورودی پشتیبانی می‌کند،
`heartbeat.sendTyping(...)` را روی Plugin کانال ارائه کنید. هسته آن را با مقصد
تحویل Heartbeat حل‌شده، پیش از شروع اجرای مدل Heartbeat، فراخوانی می‌کند و از
lifecycle مشترک keepalive/cleanup تایپ استفاده می‌کند. وقتی پلتفرم به سیگنال توقف
صریح نیاز دارد، `heartbeat.clearTyping(...)` را اضافه کنید.

اگر کانال شما پارامترهایی به ابزار پیام اضافه می‌کند که منبع رسانه حمل می‌کنند،
نام آن پارامترها را از طریق `describeMessageTool(...).mediaSourceParams` ارائه
کنید. هسته از آن فهرست صریح برای نرمال‌سازی مسیر sandbox و سیاست دسترسی رسانه
خروجی استفاده می‌کند، بنابراین Pluginها برای پارامترهای ویژه ارائه‌دهنده مانند
avatar، attachment، یا cover-image به حالت‌های ویژه در هسته مشترک نیاز ندارند.
ترجیح دهید یک نگاشت کلیددار بر اساس action برگردانید، مانند
`{ "set-profile": ["avatarUrl", "avatarPath"] }` تا actionهای نامرتبط،
آرگومان‌های رسانه action دیگری را به ارث نبرند. یک آرایه تخت همچنان برای
پارامترهایی که عمداً در همه actionهای ارائه‌شده مشترک هستند کار می‌کند.

اگر کانال شما برای `message(action="send")` به شکل‌دهی ویژه ارائه‌دهنده نیاز دارد،
`actions.prepareSendPayload(...)` را ترجیح دهید. کارت‌ها، blockها، embedها، یا
داده‌های پایدار بومی دیگر را زیر `payload.channelData.<channel>` بگذارید و اجازه
دهید هسته ارسال واقعی را از طریق adapter خروجی/پیام انجام دهد. از
`actions.handleAction(...)` برای send فقط به‌عنوان fallback سازگاری برای payloadهایی
استفاده کنید که نمی‌توان آن‌ها را سریال‌سازی و دوباره تلاش کرد.

اگر پلتفرم شما scope اضافی را داخل شناسه‌های گفت‌وگو ذخیره می‌کند، آن parsing را
با `messaging.resolveSessionConversation(...)` در Plugin نگه دارید. این hook
canonical برای نگاشت `rawId` به شناسه گفت‌وگوی پایه، شناسه رشته اختیاری،
`baseConversationId` صریح، و هر `parentConversationCandidates` است.
وقتی `parentConversationCandidates` برمی‌گردانید، آن‌ها را از باریک‌ترین والد تا
گسترده‌ترین/گفت‌وگوی پایه مرتب نگه دارید.

وقتی کد Plugin باید فیلدهای شبیه مسیر را نرمال‌سازی کند، یک رشته فرزند را با
مسیر والدش مقایسه کند، یا از `{ channel, to, accountId, threadId }` یک کلید
dedupe پایدار بسازد، از `openclaw/plugin-sdk/channel-route` استفاده کنید. این
کمک‌گر شناسه‌های رشته عددی را همان‌طور نرمال‌سازی می‌کند که هسته انجام می‌دهد،
پس Pluginها باید آن را به مقایسه‌های موردی `String(threadId)` ترجیح دهند.
Pluginهایی با دستور زبان هدف ویژه ارائه‌دهنده می‌توانند parser خود را به
`resolveChannelRouteTargetWithParser(...)` تزریق کنند و همچنان همان شکل هدف مسیر
و معنای fallback رشته‌ای را بگیرند که هسته استفاده می‌کند.

Pluginهای bundled که پیش از بوت شدن رجیستری کانال به همان parsing نیاز دارند
می‌توانند یک فایل سطح بالای `session-key-api.ts` نیز با export همسان
`resolveSessionConversation(...)` ارائه کنند. هسته فقط وقتی رجیستری Plugin زمان
اجرا هنوز در دسترس نیست از این سطح bootstrap-safe استفاده می‌کند.

`messaging.resolveParentConversationCandidates(...)` همچنان به‌عنوان fallback
سازگاری قدیمی در دسترس است، وقتی یک Plugin فقط به fallbackهای والد روی شناسه
عمومی/raw نیاز دارد. اگر هر دو hook وجود داشته باشند، هسته ابتدا از
`resolveSessionConversation(...).parentConversationCandidates` استفاده می‌کند و
فقط وقتی hook canonical آن‌ها را حذف کرده باشد به
`resolveParentConversationCandidates(...)` برمی‌گردد.

## تأییدها و قابلیت‌های کانال

بیشتر Pluginهای کانال به کد ویژه تأیید نیاز ندارند.

- هسته مالک `/approve` در همان گفتگو، payloadهای مشترک دکمه تأیید، و تحویل fallback عمومی است.
- وقتی کانال به رفتار ویژه تأیید نیاز دارد، یک شیء `approvalCapability` روی Plugin کانال را ترجیح دهید.
- `ChannelPlugin.approvals` حذف شده است. واقعیت‌های تحویل/بومی/render/auth تأیید را روی `approvalCapability` قرار دهید.
- `plugin.auth` فقط برای login/logout است؛ هسته دیگر hookهای auth تأیید را از آن شیء نمی‌خواند.
- `approvalCapability.authorizeActorAction` و `approvalCapability.getActionAvailabilityState` seam استاندارد auth تأیید هستند.
- برای در دسترس بودن auth تأیید در همان گفتگو از `approvalCapability.getActionAvailabilityState` استفاده کنید.
- اگر کانال شما تأییدهای exec بومی را عرضه می‌کند، وقتی وضعیت initiating-surface/native-client با auth تأیید همان گفتگو فرق دارد، از `approvalCapability.getExecInitiatingSurfaceState` برای آن وضعیت استفاده کنید. هسته از آن hook ویژه exec استفاده می‌کند تا `enabled` را از `disabled` تمایز دهد، تصمیم بگیرد که آیا کانال آغازگر از تأییدهای exec بومی پشتیبانی می‌کند یا نه، و کانال را در راهنمای fallback کلاینت بومی وارد کند. `createApproverRestrictedNativeApprovalCapability(...)` این را برای حالت رایج پر می‌کند.
- برای رفتار چرخه عمر payload ویژه کانال، مثل پنهان کردن promptهای تأیید محلی تکراری یا ارسال typing indicatorها پیش از تحویل، از `outbound.shouldSuppressLocalPayloadPrompt` یا `outbound.beforeDeliverPayload` استفاده کنید.
- از `approvalCapability.delivery` فقط برای مسیریابی تأیید بومی یا جلوگیری از fallback استفاده کنید.
- از `approvalCapability.nativeRuntime` برای واقعیت‌های تأیید بومی متعلق به کانال استفاده کنید. آن را روی entrypointهای داغ کانال با `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy نگه دارید؛ این adapter می‌تواند در صورت نیاز ماژول runtime شما را import کند و همچنان اجازه دهد هسته چرخه عمر تأیید را مونتاژ کند.
- از `approvalCapability.render` فقط وقتی استفاده کنید که یک کانال واقعا به payloadهای تأیید سفارشی به جای renderer مشترک نیاز دارد.
- وقتی کانال می‌خواهد پاسخ مسیر غیرفعال، knobهای دقیق config لازم برای فعال کردن تأییدهای exec بومی را توضیح دهد، از `approvalCapability.describeExecApprovalSetup` استفاده کنید. این hook مقدار `{ channel, channelLabel, accountId }` را دریافت می‌کند؛ کانال‌های named-account باید به جای defaultهای top-level، مسیرهای account-scoped مثل `channels.<channel>.accounts.<id>.execApprovals.*` را render کنند.
- اگر کانال می‌تواند هویت‌های DM پایدار و owner-like را از config موجود استنباط کند، از `createResolvedApproverActionAuthAdapter` در `openclaw/plugin-sdk/approval-runtime` استفاده کنید تا بدون افزودن منطق هسته‌ای ویژه تأیید، `/approve` همان گفتگو را محدود کنید.
- اگر کانال به تحویل تأیید بومی نیاز دارد، کد کانال را روی نرمال‌سازی target به‌علاوه واقعیت‌های transport/presentation متمرکز نگه دارید. از `createChannelExecApprovalProfile`، `createChannelNativeOriginTargetResolver`، `createChannelApproverDmTargetResolver`، و `createApproverRestrictedNativeApprovalCapability` در `openclaw/plugin-sdk/approval-runtime` استفاده کنید. واقعیت‌های ویژه کانال را پشت `approvalCapability.nativeRuntime` قرار دهید، ایده‌آل از طریق `createChannelApprovalNativeRuntimeAdapter(...)` یا `createLazyChannelApprovalNativeRuntimeAdapter(...)`، تا هسته بتواند handler را مونتاژ کند و مالک فیلتر کردن request، مسیریابی، dedupe، انقضا، subscription به Gateway، و اعلان‌های routed-elsewhere باشد. `nativeRuntime` به چند seam کوچک‌تر تقسیم شده است:
- `createChannelNativeOriginTargetResolver` به صورت پیش‌فرض از matcher مشترک channel-route برای targetهای `{ to, accountId, threadId }` استفاده می‌کند. `targetsMatch` را فقط وقتی pass کنید که یک کانال قواعد هم‌ارزی ویژه provider داشته باشد، مثل match کردن prefix timestamp در Slack.
- وقتی کانال باید پیش از اجرای route matcher پیش‌فرض یا callback سفارشی `targetsMatch`، provider idها را canonicalize کند، در حالی که target اصلی را برای تحویل حفظ می‌کند، `normalizeTargetForMatch` را به `createChannelNativeOriginTargetResolver` pass کنید. فقط وقتی از `normalizeTarget` استفاده کنید که خود target تحویل resolved باید canonicalize شود.
- `availability` - اینکه آیا account پیکربندی شده است و آیا یک request باید رسیدگی شود
- `presentation` - نگاشت view model مشترک تأیید به payloadهای بومی pending/resolved/expired یا actionهای نهایی
- `transport` - آماده‌سازی targetها به‌علاوه send/update/delete پیام‌های تأیید بومی
- `interactions` - hookهای اختیاری bind/unbind/clear-action برای دکمه‌ها یا reactionهای بومی
- `observe` - hookهای اختیاری diagnostics تحویل
- اگر کانال به اشیای runtime-owned مثل client، token، Bolt app، یا webhook receiver نیاز دارد، آن‌ها را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید. registry عمومی runtime-context به هسته اجازه می‌دهد handlerهای capability-driven را از وضعیت startup کانال bootstrap کند، بدون افزودن glue wrapper ویژه تأیید.
- فقط وقتی سراغ `createChannelApprovalHandler` یا `createChannelNativeApprovalRuntime` سطح پایین‌تر بروید که seam capability-driven هنوز به اندازه کافی گویا نیست.
- کانال‌های تأیید بومی باید هم `accountId` و هم `approvalKind` را از طریق آن helperها route کنند. `accountId` سیاست تأیید multi-account را به account درست bot محدود نگه می‌دارد، و `approvalKind` رفتار تأیید exec در برابر Plugin را بدون branchهای hardcoded در هسته برای کانال در دسترس نگه می‌دارد.
- هسته اکنون مالک اعلان‌های reroute تأیید هم هست. Pluginهای کانال نباید پیام‌های follow-up خودشان مثل «تأیید به DMها / کانال دیگری رفت» را از `createChannelNativeApprovalRuntime` ارسال کنند؛ در عوض، origin و مسیریابی approver-DM دقیق را از طریق helperهای مشترک capability تأیید expose کنند و اجازه دهند هسته پیش از ارسال هر اعلان به گفتگوی آغازگر، تحویل‌های واقعی را aggregate کند.
- نوع id تأیید تحویل‌شده را end-to-end حفظ کنید. کلاینت‌های بومی نباید
  مسیریابی تأیید exec در برابر Plugin را از وضعیت محلی کانال حدس بزنند یا بازنویسی کنند.
- انواع مختلف تأیید می‌توانند عمدا سطح‌های بومی متفاوتی expose کنند.
  مثال‌های bundled فعلی:
  - Slack مسیریابی تأیید بومی را هم برای idهای exec و هم Plugin در دسترس نگه می‌دارد.
  - Matrix همان مسیریابی DM/channel بومی و UX مبتنی بر reaction را برای تأییدهای exec
    و Plugin نگه می‌دارد، در حالی که همچنان اجازه می‌دهد auth بر اساس نوع تأیید متفاوت باشد.
- `createApproverRestrictedNativeApprovalAdapter` همچنان به عنوان wrapper سازگاری وجود دارد، اما کد جدید باید capability builder را ترجیح دهد و `approvalCapability` را روی Plugin expose کند.

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

به همین ترتیب، وقتی به سطح umbrella گسترده‌تر نیاز ندارید، `openclaw/plugin-sdk/setup-runtime`،
`openclaw/plugin-sdk/setup-adapter-runtime`،
`openclaw/plugin-sdk/reply-runtime`،
`openclaw/plugin-sdk/reply-dispatch-runtime`،
`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` را ترجیح دهید.

به طور خاص برای setup:

- `openclaw/plugin-sdk/setup-runtime` helperهای setup امن برای runtime را پوشش می‌دهد:
  adapterهای patch setup ایمن برای import (`createPatchedAccountSetupAdapter`،
  `createEnvPatchedAccountSetupAdapter`،
  `createSetupInputPresenceValidator`)، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و builderهای delegated
  setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` seam محدود adapter آگاه از env
  برای `createEnvPatchedAccountSetupAdapter` است
- `openclaw/plugin-sdk/channel-setup` builderهای setup مربوط به optional-install
  به‌علاوه چند primitive امن برای setup را پوشش می‌دهد:
  `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`،

اگر کانال شما از setup یا auth مبتنی بر env پشتیبانی می‌کند و flowهای عمومی startup/config
باید پیش از بارگذاری runtime نام‌های آن env را بدانند، آن‌ها را در manifest
Plugin با `channelEnvVars` اعلام کنید. `envVars` runtime کانال یا constantهای محلی
را فقط برای متن‌های رو به operator نگه دارید.

اگر کانال شما پیش از شروع runtime Plugin می‌تواند در `status`، `channels list`، `channels status`، یا
scanهای SecretRef ظاهر شود، `openclaw.setupEntry` را در
`package.json` اضافه کنید. آن entrypoint باید برای import در مسیرهای command فقط‌خواندنی
ایمن باشد و metadata کانال، adapter config امن برای setup، adapter status،
و metadata target secret کانال لازم برای آن summaryها را برگرداند. از setup entry
کلاینت‌ها، listenerها، یا runtimeهای transport را شروع نکنید.

مسیر import اصلی entry کانال را هم محدود نگه دارید. Discovery می‌تواند entry
و ماژول Plugin کانال را برای ثبت capabilityها evaluate کند، بدون فعال کردن
کانال. فایل‌هایی مثل `channel-plugin-api.ts` باید شیء Plugin کانال را بدون import کردن
setup wizardها، transport clientها، socket
listenerها، subprocess launcherها، یا ماژول‌های startup سرویس export کنند. آن قطعات runtime
را در ماژول‌هایی قرار دهید که از `registerFull(...)`، setterهای runtime، یا adapterهای
capability lazy بارگذاری می‌شوند.

`createOptionalChannelSetupWizard`، `DEFAULT_ACCOUNT_ID`،
`createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، و
`splitSetupEntries`

- فقط وقتی از seam گسترده‌تر `openclaw/plugin-sdk/setup` استفاده کنید که به
  helperهای سنگین‌تر setup/config مشترک مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)` هم نیاز دارید

اگر کانال شما فقط می‌خواهد در سطح‌های setup پیام «ابتدا این Plugin را install کنید» را advertise کند،
`createOptionalChannelSetupSurface(...)` را ترجیح دهید. adapter/wizard تولیدشده
روی writeهای config و finalization fail closed می‌شوند، و همان پیام install-required
را در validation، finalize، و متن docs-link reuse می‌کنند.

برای مسیرهای داغ دیگر کانال، helperهای محدود را به سطح‌های legacy گسترده‌تر
ترجیح دهید:

- `openclaw/plugin-sdk/account-core`،
  `openclaw/plugin-sdk/account-id`،
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` برای config چند-account و
  fallback account پیش‌فرض
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` برای route/envelope ورودی و
  سیم‌کشی record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` برای parsing/matching target
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` برای بارگذاری media به‌علاوه delegateهای
  identity/send خروجی و برنامه‌ریزی payload
- `buildThreadAwareOutboundSessionRoute(...)` از
  `openclaw/plugin-sdk/channel-core` وقتی یک route خروجی باید یک
  `replyToId`/`threadId` صریح را حفظ کند یا session فعلی `:thread:` را
  پس از اینکه key session پایه همچنان match است بازیابی کند. Pluginهای provider می‌توانند
  precedence، رفتار suffix، و نرمال‌سازی thread id را وقتی platform آن‌ها
  معنای تحویل thread بومی دارد override کنند.
- `openclaw/plugin-sdk/thread-bindings-runtime` برای چرخه عمر thread-binding
  و ثبت adapter
- `openclaw/plugin-sdk/agent-media-payload` فقط وقتی layout فیلد legacy agent/media
  payload هنوز لازم است
- `openclaw/plugin-sdk/telegram-command-config` برای نرمال‌سازی custom-command
  در Telegram، validation تکراری/تداخل، و contract config command
  پایدار در fallback

کانال‌های فقط auth معمولا می‌توانند در مسیر پیش‌فرض متوقف شوند: هسته تأییدها را مدیریت می‌کند و Plugin فقط capabilityهای outbound/auth را expose می‌کند. کانال‌های تأیید بومی مثل Matrix، Slack، Telegram، و transportهای chat سفارشی باید به جای ساخت چرخه عمر تأیید اختصاصی، از helperهای بومی مشترک استفاده کنند.

## سیاست mention ورودی

رسیدگی به mention ورودی را در دو لایه جدا نگه دارید:

- گردآوری evidence متعلق به Plugin
- ارزیابی policy مشترک

برای تصمیم‌های mention-policy از `openclaw/plugin-sdk/channel-mention-gating` استفاده کنید.
فقط وقتی از `openclaw/plugin-sdk/channel-inbound` استفاده کنید که به barrel گسترده‌تر helperهای ورودی
نیاز دارید.

مناسب برای منطق محلی Plugin:

- تشخیص reply-to-bot
- تشخیص quoted-bot
- بررسی‌های thread-participation
- حذف service/system-message
- cacheهای بومی platform لازم برای اثبات مشارکت bot

مناسب برای helper مشترک:

- `requireMention`
- نتیجه منشن صریح
- فهرست مجاز منشن ضمنی
- عبور از فرمان
- تصمیم نهایی برای رد کردن

جریان ترجیحی:

1. واقعیت‌های محلی منشن را محاسبه کنید.
2. آن واقعیت‌ها را به `resolveInboundMentionDecision({ facts, policy })` بدهید.
3. از `decision.effectiveWasMentioned`، `decision.shouldBypassMention` و `decision.shouldSkip` در دروازه ورودی خود استفاده کنید.

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

`api.runtime.channel.mentions` همان کمک‌کننده‌های مشترک منشن را برای
Pluginهای کانال همراهی که از قبل به تزریق زمان اجرا وابسته‌اند، در دسترس می‌گذارد:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

اگر فقط به `implicitMentionKindWhen` و
`resolveInboundMentionDecision` نیاز دارید، از
`openclaw/plugin-sdk/channel-mention-gating` وارد کنید تا از بارگذاری کمک‌کننده‌های نامرتبط زمان اجرای ورودی
جلوگیری شود.

کمک‌کننده‌های قدیمی‌تر `resolveMentionGating*` فقط به‌عنوان خروجی‌های سازگاری روی
`openclaw/plugin-sdk/channel-inbound` باقی می‌مانند. کد جدید
باید از `resolveInboundMentionDecision({ facts, policy })` استفاده کند.

## راهنمای گام‌به‌گام

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="بسته و مانیفست">
    فایل‌های استاندارد Plugin را ایجاد کنید. فیلد `channel` در `package.json`
    همان چیزی است که این را به یک Plugin کانال تبدیل می‌کند. برای سطح کامل فراداده بسته،
    [راه‌اندازی و پیکربندی Plugin](/fa/plugins/sdk-setup#openclaw-channel) را ببینید:

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

    `configSchema` مقدار `plugins.entries.acme-chat.config` را اعتبارسنجی می‌کند. از آن برای
    تنظیمات متعلق به Plugin استفاده کنید که پیکربندی حساب کانال نیستند. `channelConfigs`
    مقدار `channels.acme-chat` را اعتبارسنجی می‌کند و منبع مسیر سردی است که پیکربندی
    طرح‌واره، راه‌اندازی و سطوح UI پیش از بارگذاری زمان اجرای Plugin از آن استفاده می‌کنند.

  </Step>

  <Step title="ساخت شیء Plugin کانال">
    رابط `ChannelPlugin` سطح‌های سازگارکننده اختیاری زیادی دارد. با
    حداقل مقدار، یعنی `id` و `setup`، شروع کنید و سازگارکننده‌ها را در صورت نیاز اضافه کنید.

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

    برای کانال‌هایی که هم کلیدهای متعارف DM در سطح بالا و هم کلیدهای تودرتوی قدیمی را می‌پذیرند، از کمک‌کننده‌های `plugin-sdk/channel-config-helpers` استفاده کنید: `resolveChannelDmAccess`، `resolveChannelDmPolicy`، `resolveChannelDmAllowFrom` و `normalizeChannelDmPolicy` مقدارهای محلی حساب را جلوتر از مقدارهای ریشه‌ای ارث‌بری‌شده نگه می‌دارند. همان حل‌کننده را با تعمیر doctor از طریق `normalizeLegacyDmAliases` جفت کنید تا زمان اجرا و مهاجرت، قرارداد یکسانی را بخوانند.

    <Accordion title="createChatChannelPlugin چه کاری برای شما انجام می‌دهد">
      به‌جای پیاده‌سازی دستی رابط‌های سازگارکننده سطح پایین، گزینه‌های
      اعلانی را می‌دهید و سازنده آن‌ها را ترکیب می‌کند:

      | گزینه | آنچه متصل می‌کند |
      | --- | --- |
      | `security.dm` | حل‌کننده امنیت DM محدوده‌دار از فیلدهای پیکربندی |
      | `pairing.text` | جریان جفت‌سازی DM مبتنی بر متن با تبادل کد |
      | `threading` | حل‌کننده حالت پاسخ به (ثابت، محدوده‌دار به حساب، یا سفارشی) |
      | `outbound.attachedResults` | تابع‌های ارسال که فراداده نتیجه را برمی‌گردانند (شناسه‌های پیام) |

      اگر به کنترل کامل نیاز دارید، همچنین می‌توانید به‌جای گزینه‌های اعلانی،
      شیءهای سازگارکننده خام بدهید.

      سازگارکننده‌های خروجی خام می‌توانند تابع `chunker(text, limit, ctx)` را تعریف کنند.
      مقدار اختیاری `ctx.formatting` تصمیم‌های قالب‌بندی زمان تحویل
      مانند `maxLinesPerMessage` را حمل می‌کند؛ پیش از ارسال آن را اعمال کنید تا نخ‌بندی پاسخ
      و مرزهای قطعه‌ها یک‌بار توسط تحویل خروجی مشترک حل شوند.
      زمینه‌های ارسال همچنین وقتی یک هدف پاسخ بومی حل شده باشد، `replyToIdSource` (`implicit` یا `explicit`)
      را شامل می‌شوند تا کمک‌کننده‌های payload بتوانند
      برچسب‌های پاسخ صریح را بدون مصرف یک جایگاه پاسخ ضمنی یک‌بارمصرف حفظ کنند.
    </Accordion>

  </Step>

  <Step title="اتصال نقطه ورود">
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

    توصیف‌گرهای CLI متعلق به کانال را در `registerCliMetadata(...)` قرار دهید تا OpenClaw
    بتواند بدون فعال‌سازی زمان اجرای کامل کانال، آن‌ها را در راهنمای ریشه نشان دهد،
    در حالی که بارگذاری‌های کامل عادی همچنان همان توصیف‌گرها را برای ثبت واقعی فرمان
    دریافت می‌کنند. `registerFull(...)` را برای کارهای فقط زمان اجرا نگه دارید.
    اگر `registerFull(...)` روش‌های RPC برای Gateway ثبت می‌کند، از یک
    پیشوند ویژه Plugin استفاده کنید. فضاهای نام مدیریتی هسته (`config.*`،
    `exec.approvals.*`، `wizard.*`، `update.*`) رزرو می‌مانند و همیشه
    به `operator.admin` حل می‌شوند.
    `defineChannelPluginEntry` جداسازی حالت ثبت را به‌صورت خودکار انجام می‌دهد. برای همه
    گزینه‌ها [نقاط ورود](/fa/plugins/sdk-entrypoints#definechannelpluginentry) را ببینید.

  </Step>

  <Step title="افزودن ورودی راه‌اندازی">
    برای بارگذاری سبک هنگام آغازبه‌کار، `setup-entry.ts` را ایجاد کنید:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw وقتی کانال غیرفعال یا پیکربندی‌نشده باشد، این را به‌جای ورودی کامل بارگذاری می‌کند.
    این کار از کشیدن کد سنگین زمان اجرا در جریان‌های راه‌اندازی جلوگیری می‌کند.
    برای جزئیات، [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup#setup-entry) را ببینید.

    کانال‌های فضای کاری همراه که خروجی‌های امن برای راه‌اندازی را در ماژول‌های جانبی
    جدا می‌کنند، وقتی به یک تنظیم‌کننده صریح زمان اجرا در زمان راه‌اندازی نیز نیاز دارند،
    می‌توانند از `defineBundledChannelSetupEntry(...)` از
    `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند.

  </Step>

  <Step title="مدیریت پیام‌های ورودی">
    Plugin شما باید پیام‌ها را از پلتفرم دریافت کند و آن‌ها را به
    OpenClaw بفرستد. الگوی معمول یک Webhook است که درخواست را تأیید می‌کند و
    آن را از طریق handler ورودی کانال شما ارسال می‌کند:

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
      مدیریت پیام‌های ورودی وابسته به کانال است. هر Plugin کانال مالک
      خط لولهٔ ورودی خودش است. برای الگوهای واقعی، به Pluginهای کانال بسته‌بندی‌شده
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

    برای کمک‌کننده‌های آزمون مشترک، [آزمون‌نویسی](/fa/plugins/sdk-testing) را ببینید.

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
    TTS، STT، رسانه، subagent از طریق api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/fa/plugins/sdk-channel-turn">
    چرخهٔ عمر نوبت ورودی مشترک: دریافت، رفع، ثبت، ارسال، نهایی‌سازی
  </Card>
</CardGroup>

<Note>
برخی نقاط اتصال کمکی بسته‌بندی‌شده هنوز برای نگهداری Pluginهای بسته‌بندی‌شده و
سازگاری وجود دارند. این‌ها الگوی توصیه‌شده برای Pluginهای کانال جدید نیستند؛
مگر اینکه مستقیماً در حال نگهداری همان خانوادهٔ Plugin بسته‌بندی‌شده باشید،
زیرمسیرهای عمومی channel/setup/reply/runtime را از سطح SDK مشترک ترجیح دهید.
</Note>

## گام‌های بعدی

- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - اگر Plugin شما مدل‌ها را هم ارائه می‌کند
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل import زیرمسیرها
- [آزمون‌نویسی SDK](/fa/plugins/sdk-testing) - ابزارهای آزمون و آزمون‌های قرارداد
- [Manifest Plugin](/fa/plugins/manifest) - طرح‌وارهٔ کامل manifest

## مرتبط

- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [Pluginهای ابزار اجرای Agent](/fa/plugins/sdk-agent-harness)
