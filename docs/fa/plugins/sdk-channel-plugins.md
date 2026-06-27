---
read_when:
    - شما در حال ساخت یک Plugin جدید برای کانال پیام‌رسانی هستید
    - می‌خواهید OpenClaw را به یک پلتفرم پیام‌رسان متصل کنید
    - باید سطح آداپتر ChannelPlugin را درک کنید
sidebarTitle: Channel Plugins
summary: راهنمای گام‌به‌گام برای ساخت یک Plugin کانال پیام‌رسانی برای OpenClaw
title: ساخت Pluginهای کانال
x-i18n:
    generated_at: "2026-06-27T18:30:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

این راهنما ساخت یک Plugin کانال را توضیح می‌دهد که OpenClaw را به یک
سکوی پیام‌رسانی متصل می‌کند. در پایان، یک کانال عملیاتی با امنیت DM،
جفت‌سازی، رشته‌بندی پاسخ‌ها، و پیام‌رسانی خروجی خواهید داشت.

<Info>
  اگر قبلاً هیچ Plugin برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و راه‌اندازی مانیفست بخوانید.
</Info>

## Pluginهای کانال چگونه کار می‌کنند

Pluginهای کانال به ابزارهای ارسال/ویرایش/واکنش جداگانه خودشان نیاز ندارند. OpenClaw یک
ابزار مشترک `message` را در هسته نگه می‌دارد. Plugin شما مالک این بخش‌هاست:

- **پیکربندی** - تشخیص حساب و جادوگر راه‌اندازی
- **امنیت** - سیاست DM و فهرست‌های مجاز
- **جفت‌سازی** - جریان تأیید DM
- **دستور زبان نشست** - این‌که شناسه‌های مکالمه اختصاصی ارائه‌دهنده چگونه به گفت‌وگوهای پایه، شناسه‌های رشته، و جایگزین‌های والد نگاشت می‌شوند
- **خروجی** - ارسال متن، رسانه، و نظرسنجی‌ها به سکو
- **رشته‌بندی** - این‌که پاسخ‌ها چگونه در رشته‌ها قرار می‌گیرند
- **تایپ Heartbeat** - سیگنال‌های اختیاری تایپ/مشغول برای مقصدهای تحویل Heartbeat

هسته مالک ابزار پیام مشترک، سیم‌کشی پرامپت، شکل بیرونی کلید نشست،
ثبت‌داری عمومی `:thread:`، و توزیع است.

Pluginهای کانال جدید باید همچنین یک آداپتور `message` با
`defineChannelMessageAdapter` از `openclaw/plugin-sdk/channel-outbound` ارائه کنند. این
آداپتور اعلام می‌کند انتقال بومی واقعاً از کدام قابلیت‌های ارسال نهایی پایدار
پشتیبانی می‌کند و ارسال‌های متن/رسانه را به همان توابع انتقالی متصل می‌کند که
آداپتور قدیمی `outbound` استفاده می‌کرد. فقط زمانی یک قابلیت را اعلام کنید که یک آزمون قرارداد
اثر جانبی بومی و رسید برگشتی را اثبات کند.
برای قرارداد کامل API، نمونه‌ها، ماتریس قابلیت‌ها، قواعد رسید، نهایی‌سازی پیش‌نمایش زنده،
سیاست تأیید دریافت، آزمون‌ها، و جدول مهاجرت، ببینید:
[API خروجی کانال](/fa/plugins/sdk-channel-outbound).
اگر آداپتور موجود `outbound` از قبل متدهای ارسال و فراداده قابلیت مناسب را دارد،
از `createChannelMessageAdapterFromOutbound(...)` برای مشتق‌کردن آداپتور `message`
استفاده کنید، به‌جای این‌که یک پل دیگر را دستی بنویسید.
ارسال‌های آداپتور باید مقدارهای `MessageReceipt` برگردانند. وقتی کد سازگاری
هنوز به شناسه‌های قدیمی نیاز دارد، آن‌ها را با `listMessageReceiptPlatformIds(...)`
یا `resolveMessageReceiptPrimaryId(...)` مشتق کنید، به‌جای نگه‌داشتن فیلدهای موازی
`messageIds` در کد چرخه عمر جدید.
کانال‌های دارای قابلیت پیش‌نمایش باید همچنین `message.live.capabilities` را با
چرخه عمر زنده دقیقی که مالک آن هستند اعلام کنند، مانند `draftPreview`،
`previewFinalization`، `progressUpdates`، `nativeStreaming`، یا
`quietFinalization`. کانال‌هایی که یک پیش‌نمایش پیش‌نویس را درجا نهایی می‌کنند
باید همچنین `message.live.finalizer.capabilities` را اعلام کنند، مانند `finalEdit`،
`normalFallback`، `discardPending`، `previewReceipt`، و
`retainOnAmbiguousFailure`، و منطق زمان اجرا را از مسیر
`defineFinalizableLivePreviewAdapter(...)` به‌همراه
`deliverWithFinalizableLivePreviewAdapter(...)` عبور دهند. این قابلیت‌ها را با آزمون‌های
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` و
`verifyChannelMessageLiveFinalizerProofs(...)` پشتیبانی کنید تا رفتار پیش‌نمایش بومی،
پیشرفت، ویرایش، جایگزینی/نگه‌داری، پاک‌سازی، و رسید نتواند بی‌صدا منحرف شود.
گیرنده‌های ورودی که تأییدهای سکو را به تعویق می‌اندازند باید
`message.receive.defaultAckPolicy` و `supportedAckPolicies` را اعلام کنند، به‌جای این‌که
زمان‌بندی تأیید را در وضعیت محلی مانیتور پنهان کنند. هر سیاست اعلام‌شده را با
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` پوشش دهید.

کمک‌گرهای پاسخ قدیمی مانند `createChannelTurnReplyPipeline`،
`dispatchInboundReplyWithBase`، و `recordInboundSessionAndDispatchReply`
برای توزیع‌کننده‌های سازگاری همچنان در دسترس هستند. از این نام‌ها برای کد کانال جدید
استفاده نکنید؛ Pluginهای جدید باید با آداپتور `message`، رسیدها، و کمک‌گرهای چرخه عمر
دریافت/ارسال در `openclaw/plugin-sdk/channel-outbound` شروع کنند.

کانال‌هایی که مجوزدهی ورودی را مهاجرت می‌دهند می‌توانند از زیرفهرست آزمایشی
`openclaw/plugin-sdk/channel-ingress-runtime` در مسیرهای دریافت زمان اجرا استفاده کنند.
این زیرفهرست جست‌وجوی سکو و اثرهای جانبی را در Plugin نگه می‌دارد، در حالی که
تشخیص وضعیت فهرست مجاز، تصمیم‌های مسیر/فرستنده/فرمان/رویداد/فعال‌سازی،
عیب‌یابی‌های ویرایش‌شده، و نگاشت پذیرش نوبت را به اشتراک می‌گذارد. نرمال‌سازی
هویت Plugin را در توصیف‌گری که به حل‌کننده می‌دهید نگه دارید؛ مقدارهای خام تطبیق را
از وضعیت یا تصمیم حل‌شده سریال‌سازی نکنید. برای طراحی API، مرز مالکیت، و انتظارهای آزمون،
ببینید [API ورود کانال](/fa/plugins/sdk-channel-ingress).

اگر کانال شما از نشانگرهای تایپ بیرون از پاسخ‌های ورودی پشتیبانی می‌کند،
`heartbeat.sendTyping(...)` را روی Plugin کانال ارائه کنید. هسته آن را با
مقصد تحویل Heartbeat حل‌شده، پیش از شروع اجرای مدل Heartbeat فراخوانی می‌کند و
از چرخه عمر مشترک زنده‌نگه‌داشتن/پاک‌سازی تایپ استفاده می‌کند. وقتی سکو به سیگنال توقف
صریح نیاز دارد، `heartbeat.clearTyping(...)` را اضافه کنید.

اگر کانال شما پارامترهای ابزار پیام اضافه می‌کند که منابع رسانه را حمل می‌کنند،
نام آن پارامترها را از طریق `describeMessageTool(...).mediaSourceParams` ارائه کنید.
هسته از آن فهرست صریح برای نرمال‌سازی مسیر sandbox و سیاست دسترسی رسانه خروجی
استفاده می‌کند، بنابراین Pluginها برای پارامترهای اختصاصی ارائه‌دهنده مانند آواتار،
پیوست، یا تصویر جلد به حالت‌های ویژه در هسته مشترک نیاز ندارند.
ترجیحاً یک نگاشت کلیدشده با action مانند
`{ "set-profile": ["avatarUrl", "avatarPath"] }` برگردانید تا actionهای نامرتبط
آرگومان‌های رسانه‌ای action دیگر را به ارث نبرند. یک آرایه تخت همچنان برای پارامترهایی
کار می‌کند که عمداً میان همه actionهای ارائه‌شده مشترک هستند.
کانال‌هایی که باید یک URL عمومی موقت برای دریافت رسانه در سمت سکو ارائه کنند
می‌توانند از `createHostedOutboundMediaStore(...)` از
`openclaw/plugin-sdk/outbound-media` به‌همراه ذخیره‌گاه‌های وضعیت Plugin استفاده کنند.
تجزیه مسیر سکو و اعمال توکن را در Plugin کانال نگه دارید؛ کمک‌گر مشترک
فقط مالک بارگذاری رسانه، فراداده انقضا، ردیف‌های قطعه، و پاک‌سازی است.

اگر کانال شما برای `message(action="send")` به شکل‌دهی اختصاصی ارائه‌دهنده نیاز دارد،
`actions.prepareSendPayload(...)` را ترجیح دهید. کارت‌های بومی، بلوک‌ها، embedها، یا
داده‌های پایدار دیگر را زیر `payload.channelData.<channel>` بگذارید و اجازه دهید هسته
ارسال واقعی را از طریق آداپتور outbound/message انجام دهد. از
`actions.handleAction(...)` برای ارسال فقط به‌عنوان جایگزین سازگاری برای payloadهایی
استفاده کنید که نمی‌توانند سریال‌سازی و دوباره امتحان شوند.

اگر سکوی شما دامنه اضافی را داخل شناسه‌های مکالمه ذخیره می‌کند، آن تجزیه را
در Plugin با `messaging.resolveSessionConversation(...)` نگه دارید. این hook
کانونی برای نگاشت `rawId` به شناسه مکالمه پایه، شناسه رشته اختیاری،
`baseConversationId` صریح، و هر `parentConversationCandidates` است.
وقتی `parentConversationCandidates` را برمی‌گردانید، آن‌ها را از محدودترین والد
تا گسترده‌ترین/مکالمه پایه مرتب نگه دارید.

وقتی کد Plugin نیاز دارد فیلدهای شبیه مسیر را نرمال کند، یک رشته فرزند را با مسیر والدش
مقایسه کند، یا از `{ channel, to, accountId, threadId }` یک کلید dedupe پایدار بسازد،
از `openclaw/plugin-sdk/channel-route` استفاده کنید. این کمک‌گر شناسه‌های رشته عددی را
همان‌طور نرمال می‌کند که هسته انجام می‌دهد، بنابراین Pluginها باید آن را به مقایسه‌های
موردی `String(threadId)` ترجیح دهند.
Pluginهایی با دستور زبان هدف اختصاصی ارائه‌دهنده باید
`messaging.resolveOutboundSessionRoute(...)` را ارائه کنند تا هسته بدون استفاده از
shimهای parser، هویت نشست و رشته بومی ارائه‌دهنده را دریافت کند.

Pluginهای همراه که پیش از راه‌اندازی رجیستری کانال به همین تجزیه نیاز دارند
می‌توانند یک فایل سطح‌بالای `session-key-api.ts` نیز با export همسان
`resolveSessionConversation(...)` ارائه کنند. هسته فقط وقتی رجیستری Plugin زمان اجرا
هنوز در دسترس نیست، از این سطح امن برای bootstrap استفاده می‌کند.

`messaging.resolveParentConversationCandidates(...)` به‌عنوان یک جایگزین سازگاری
قدیمی، وقتی Plugin فقط به جایگزین‌های والد روی شناسه عمومی/خام نیاز دارد، همچنان
در دسترس است. اگر هر دو hook وجود داشته باشند، هسته ابتدا از
`resolveSessionConversation(...).parentConversationCandidates` استفاده می‌کند و فقط وقتی
hook کانونی آن‌ها را حذف کرده باشد به `resolveParentConversationCandidates(...)`
برمی‌گردد.

## تأییدها و قابلیت‌های کانال

بیشتر Pluginهای کانال به کد اختصاصی تأیید نیاز ندارند.

- هسته مالک `/approve` در همان چت، payloadهای مشترک دکمه تایید، و تحویل fallback عمومی است.
- وقتی کانال به رفتار ویژه تایید نیاز دارد، یک شیء `approvalCapability` روی Plugin کانال را ترجیح دهید.
- `ChannelPlugin.approvals` حذف شده است. واقعیت‌های تحویل/بومی/render/auth تایید را روی `approvalCapability` قرار دهید.
- `plugin.auth` فقط برای ورود/خروج است؛ هسته دیگر hookهای auth تایید را از آن شیء نمی‌خواند.
- `approvalCapability.authorizeActorAction` و `approvalCapability.getActionAvailabilityState` مرز canonical برای approval-auth هستند.
- برای دسترس‌پذیری auth تایید در همان چت، از `approvalCapability.getActionAvailabilityState` استفاده کنید.
- اگر کانال شما تاییدهای native exec را ارائه می‌کند، برای وضعیت initiating-surface/native-client وقتی با auth تایید همان چت فرق دارد، از `approvalCapability.getExecInitiatingSurfaceState` استفاده کنید. هسته از آن hook ویژه exec برای تمایز `enabled` از `disabled`، تصمیم‌گیری درباره اینکه آیا کانال آغازگر از تاییدهای native exec پشتیبانی می‌کند، و گنجاندن کانال در راهنمای fallback کلاینت بومی استفاده می‌کند. `createApproverRestrictedNativeApprovalCapability(...)` این مورد را برای حالت رایج پر می‌کند.
- برای رفتار چرخه عمر payload ویژه کانال، مانند پنهان‌کردن promptهای تکراری تایید محلی یا ارسال نشانگرهای تایپ پیش از تحویل، از `outbound.shouldSuppressLocalPayloadPrompt` یا `outbound.beforeDeliverPayload` استفاده کنید.
- فقط برای مسیریابی تایید بومی یا سرکوب fallback از `approvalCapability.delivery` استفاده کنید.
- برای واقعیت‌های تایید بومی متعلق به کانال، از `approvalCapability.nativeRuntime` استفاده کنید. آن را روی entrypointهای داغ کانال با `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy نگه دارید؛ این می‌تواند ماژول runtime شما را هنگام نیاز import کند و هم‌زمان به هسته اجازه دهد چرخه عمر تایید را assemble کند.
- فقط وقتی کانال واقعا به payloadهای تایید سفارشی به‌جای renderer مشترک نیاز دارد، از `approvalCapability.render` استفاده کنید.
- وقتی کانال می‌خواهد پاسخ مسیر disabled پیکربندی دقیق لازم برای فعال‌کردن تاییدهای native exec را توضیح دهد، از `approvalCapability.describeExecApprovalSetup` استفاده کنید. این hook مقدار `{ channel, channelLabel, accountId }` را دریافت می‌کند؛ کانال‌های دارای named-account باید مسیرهای scoped به حساب مانند `channels.<channel>.accounts.<id>.execApprovals.*` را به‌جای پیش‌فرض‌های سطح بالا render کنند.
- اگر کانالی می‌تواند از پیکربندی موجود، هویت‌های DM پایدار و مالک‌مانند را استنباط کند، برای محدودکردن `/approve` در همان چت بدون افزودن منطق ویژه تایید در هسته، از `createResolvedApproverActionAuthAdapter` در `openclaw/plugin-sdk/approval-runtime` استفاده کنید.
- اگر auth تایید سفارشی عمدا فقط fallback همان چت را مجاز می‌داند، از `openclaw/plugin-sdk/approval-auth-runtime` مقدار `markImplicitSameChatApprovalAuthorization({ authorized: true })` را برگردانید؛ در غیر این صورت هسته نتیجه را به‌عنوان authorizaton صریح approver در نظر می‌گیرد.
- اگر یک callback بومی متعلق به کانال تاییدها را مستقیما resolve می‌کند، پیش از resolve کردن از `isImplicitSameChatApprovalAuthorization(...)` استفاده کنید تا fallback ضمنی همچنان از authorizaton عادی actor کانال عبور کند.
- اگر کانالی به تحویل تایید بومی نیاز دارد، کد کانال را روی نرمال‌سازی target به‌همراه واقعیت‌های transport/presentation متمرکز نگه دارید. از `openclaw/plugin-sdk/approval-runtime`، `createChannelExecApprovalProfile`، `createChannelNativeOriginTargetResolver`، `createChannelApproverDmTargetResolver`، و `createApproverRestrictedNativeApprovalCapability` را به‌کار ببرید. واقعیت‌های ویژه کانال را پشت `approvalCapability.nativeRuntime` بگذارید، در حالت ایده‌آل از طریق `createChannelApprovalNativeRuntimeAdapter(...)` یا `createLazyChannelApprovalNativeRuntimeAdapter(...)`، تا هسته بتواند handler را assemble کند و مالک فیلترکردن درخواست، مسیریابی، dedupe، انقضا، اشتراک Gateway، و اعلان‌های routed-elsewhere باشد. `nativeRuntime` به چند مرز کوچک‌تر تقسیم شده است:
- وقتی کانالی هم از تحویل بومی با session-origin و هم از targetهای صریح forwarding تایید پشتیبانی می‌کند، از `createNativeApprovalChannelRouteGates` در `openclaw/plugin-sdk/approval-native-runtime` استفاده کنید. این helper انتخاب پیکربندی تایید، مدیریت `mode`، فیلترهای agent/session، اتصال حساب، تطبیق session-target، و تطبیق target-list را متمرکز می‌کند، در حالی که callerها همچنان مالک id کانال، حالت forwarding پیش‌فرض، lookup حساب، بررسی فعال‌بودن transport، نرمال‌سازی target، و resolve کردن target منبع turn هستند. از آن برای ایجاد پیش‌فرض‌های policy کانال متعلق به هسته استفاده نکنید؛ حالت پیش‌فرض مستند کانال را صریحا پاس دهید.
- `createChannelNativeOriginTargetResolver` به‌صورت پیش‌فرض از matcher مشترک channel-route برای targetهای `{ to, accountId, threadId }` استفاده می‌کند. فقط وقتی کانال قواعد برابری ویژه provider دارد، مانند تطبیق پیشوند timestamp در Slack، `targetsMatch` را پاس دهید.
- وقتی کانال باید پیش از اجرای matcher پیش‌فرض route یا callback سفارشی `targetsMatch`، idهای provider را canonicalize کند و هم‌زمان target اصلی را برای تحویل حفظ کند، `normalizeTargetForMatch` را به `createChannelNativeOriginTargetResolver` پاس دهید. فقط وقتی خود target تحویل resolveشده باید canonicalize شود، از `normalizeTarget` استفاده کنید.
- `availability` - اینکه حساب پیکربندی شده است یا نه و اینکه آیا یک درخواست باید handled شود یا نه
- `presentation` - نگاشت view model مشترک تایید به payloadهای بومی pending/resolved/expired یا actionهای نهایی
- `transport` - آماده‌سازی targetها و ارسال/به‌روزرسانی/حذف پیام‌های تایید بومی
- `interactions` - hookهای اختیاری bind/unbind/clear-action برای دکمه‌ها یا reactionهای بومی، به‌علاوه hook اختیاری `cancelDelivered`. وقتی `deliverPending` وضعیت درون‌پردازشی یا پایدار ثبت می‌کند، مانند یک store هدف reaction، `cancelDelivered` را پیاده‌سازی کنید تا اگر توقف handler تحویل را پیش از اجرای `bindPending` لغو کرد یا وقتی `bindPending` هیچ handleای برنگرداند، آن وضعیت بتواند آزاد شود
- `observe` - hookهای اختیاری diagnostics تحویل
- اگر کانال به اشیای متعلق به runtime مانند client، token، برنامه Bolt، یا receiver مربوط به webhook نیاز دارد، آن‌ها را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید. رجیستری runtime-context عمومی به هسته اجازه می‌دهد handlerهای capability-driven را از وضعیت startup کانال bootstrap کند، بدون افزودن چسب wrapper ویژه تایید.
- فقط وقتی مرز capability-driven هنوز به‌اندازه کافی گویا نیست، سراغ `createChannelApprovalHandler` یا `createChannelNativeApprovalRuntime` سطح پایین‌تر بروید.
- کانال‌های تایید بومی باید هم `accountId` و هم `approvalKind` را از طریق آن helperها route کنند. `accountId` policy تایید چندحسابی را به حساب bot درست scoped نگه می‌دارد، و `approvalKind` رفتار تایید exec در برابر Plugin را بدون شاخه‌های hardcoded در هسته برای کانال قابل استفاده نگه می‌دارد.
- اکنون هسته مالک اعلان‌های reroute تایید نیز هست. Pluginهای کانال نباید پیام‌های follow-up اختصاصی «تایید به DMها / کانال دیگر رفت» را از `createChannelNativeApprovalRuntime` ارسال کنند؛ در عوض، مسیریابی دقیق origin + approver-DM را از طریق helperهای مشترک capability تایید expose کنند و اجازه دهند هسته تحویل‌های واقعی را aggregate کند و سپس هر اعلانی را به چت آغازگر ارسال کند.
- نوع id تایید تحویل‌شده را از ابتدا تا انتها حفظ کنید. کلاینت‌های بومی نباید
  مسیریابی تایید exec در برابر Plugin را از وضعیت محلی کانال حدس بزنند یا بازنویسی کنند.
- انواع مختلف تایید می‌توانند عمدا سطح‌های بومی متفاوتی expose کنند.
  نمونه‌های فعلی bundled:
  - Slack مسیریابی تایید بومی را برای idهای exec و Plugin در دسترس نگه می‌دارد.
  - Matrix همان مسیریابی بومی DM/کانال و UX واکنش را برای exec
    و تاییدهای Plugin نگه می‌دارد، در حالی که همچنان اجازه می‌دهد auth بر اساس نوع تایید فرق کند.
- `createApproverRestrictedNativeApprovalAdapter` همچنان به‌عنوان wrapper سازگاری وجود دارد، اما کد جدید باید capability builder را ترجیح دهد و `approvalCapability` را روی Plugin expose کند.

برای entrypointهای داغ کانال، وقتی فقط به یک بخش از آن خانواده نیاز دارید،
زیرمسیرهای runtime باریک‌تر را ترجیح دهید:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

به همین ترتیب، وقتی به سطح umbrella گسترده‌تر نیاز ندارید،
`openclaw/plugin-sdk/setup-runtime`،
`openclaw/plugin-sdk/setup-runtime`،
`openclaw/plugin-sdk/reply-runtime`،
`openclaw/plugin-sdk/reply-dispatch-runtime`،
`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` را ترجیح دهید.

به‌طور خاص برای setup:

- `openclaw/plugin-sdk/setup-runtime` helperهای setup امن برای runtime را پوشش می‌دهد:
  `createSetupTranslator`، adapterهای setup patch امن برای import (`createPatchedAccountSetupAdapter`،
  `createEnvPatchedAccountSetupAdapter`،
  `createSetupInputPresenceValidator`)، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و builderهای delegated
  setup-proxy
- `openclaw/plugin-sdk/setup-runtime` شامل مرز adapter آگاه از env برای
  `createEnvPatchedAccountSetupAdapter` است
- `openclaw/plugin-sdk/channel-setup` builderهای setup مربوط به optional-install
  به‌همراه چند primitive امن برای setup را پوشش می‌دهد:
  `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`،

اگر کانال شما از setup یا auth مبتنی بر env پشتیبانی می‌کند و جریان‌های عمومی startup/config
باید پیش از بارگذاری runtime آن نام‌های env را بدانند، آن‌ها را در manifest
Plugin با `channelEnvVars` اعلام کنید. `envVars` در runtime کانال یا ثابت‌های محلی
را فقط برای متن‌های رو به operator نگه دارید.

اگر کانال شما می‌تواند پیش از شروع runtime Plugin در `status`، `channels list`، `channels status`، یا
scanهای SecretRef ظاهر شود، `openclaw.setupEntry` را در
`package.json` اضافه کنید. آن entrypoint باید برای import در مسیرهای command
فقط‌خواندنی امن باشد و باید metadata کانال، adapter پیکربندی امن برای setup، adapter وضعیت،
و metadata target secret کانال لازم برای آن summaryها را برگرداند. از setup entry
کلاینت‌ها، listenerها، یا runtimeهای transport را شروع نکنید.

مسیر import ورودی اصلی کانال را نیز باریک نگه دارید. Discovery می‌تواند entry
و ماژول Plugin کانال را برای ثبت capabilityها evaluate کند، بدون اینکه کانال را فعال کند.
فایل‌هایی مانند `channel-plugin-api.ts` باید شیء Plugin کانال را بدون import کردن
setup wizardها، کلاینت‌های transport، listenerهای socket، launcherهای subprocess، یا ماژول‌های startup سرویس
export کنند. آن قطعات runtime را در ماژول‌هایی بگذارید که از `registerFull(...)`،
setterهای runtime، یا adapterهای lazy capability بارگذاری می‌شوند.

`createOptionalChannelSetupWizard`، `DEFAULT_ACCOUNT_ID`،
`createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، و
`splitSetupEntries`

- فقط وقتی به helperهای مشترک سنگین‌تر setup/config مانند
  `moveSingleAccountChannelSectionToDefaultAccount(...)` نیز نیاز دارید، از مرز گسترده‌تر `openclaw/plugin-sdk/setup` استفاده کنید

اگر کانال شما فقط می‌خواهد در سطح‌های setup پیام «اول این Plugin را نصب کنید» را advertise کند،
`createOptionalChannelSetupSurface(...)` را ترجیح دهید. adapter/wizard تولیدشده
روی نوشتن پیکربندی و finalization fail closed می‌کند، و همان پیام install-required را در validation، finalize، و متن لینک docs دوباره استفاده می‌کند.

برای سایر مسیرهای داغ کانال، helperهای باریک را به سطح‌های legacy گسترده‌تر ترجیح دهید:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` برای پیکربندی چندحسابی و
  fallback حساب پیش‌فرض
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/channel-inbound` برای مسیر/پاکت ورودی و
  سیم‌کشی ثبت و ارسال
- `openclaw/plugin-sdk/channel-targets` برای کمک‌کننده‌های تجزیه هدف
- `openclaw/plugin-sdk/outbound-media` برای بارگذاری رسانه و
  `openclaw/plugin-sdk/channel-outbound` برای هویت خروجی/نماینده‌های ارسال
  و برنامه‌ریزی payload
- `buildThreadAwareOutboundSessionRoute(...)` از
  `openclaw/plugin-sdk/channel-core` وقتی یک مسیر خروجی باید یک
  `replyToId`/`threadId` صریح را حفظ کند یا نشست فعلی `:thread:` را
  پس از اینکه کلید نشست پایه هنوز مطابق است بازیابی کند. Pluginهای ارائه‌دهنده می‌توانند
  تقدم، رفتار پسوند، و نرمال‌سازی شناسه رشته را وقتی پلتفرمشان
  معناشناسی تحویل رشته بومی دارد override کنند.
- `openclaw/plugin-sdk/thread-bindings-runtime` برای چرخه عمر اتصال‌های رشته
  و ثبت آداپتر
- `openclaw/plugin-sdk/agent-media-payload` فقط وقتی چیدمان فیلد payload
  قدیمی agent/media هنوز لازم است
- `openclaw/plugin-sdk/telegram-command-config` برای نرمال‌سازی دستورهای سفارشی
  Telegram، اعتبارسنجی تکرار/تعارض، و قرارداد پیکربندی دستور
  پایدار در fallback

کانال‌های فقط-auth معمولاً می‌توانند در مسیر پیش‌فرض متوقف شوند: core تأییدها را مدیریت می‌کند و Plugin فقط قابلیت‌های خروجی/auth را ارائه می‌دهد. کانال‌های تأیید بومی مانند Matrix، Slack، Telegram، و انتقال‌دهنده‌های چت سفارشی باید به‌جای ساختن چرخه عمر تأیید اختصاصی خود، از کمک‌کننده‌های بومی مشترک استفاده کنند.

## سیاست اشاره ورودی

مدیریت اشاره ورودی را در دو لایه جدا نگه دارید:

- گردآوری شواهد تحت مالکیت Plugin
- ارزیابی سیاست مشترک

برای تصمیم‌های سیاست اشاره از `openclaw/plugin-sdk/channel-mention-gating` استفاده کنید.
فقط وقتی به barrel کمکی ورودی گسترده‌تر نیاز دارید از
`openclaw/plugin-sdk/channel-inbound` استفاده کنید.

مناسب برای منطق محلی Plugin:

- تشخیص پاسخ به بات
- تشخیص نقل‌قول از بات
- بررسی مشارکت در رشته
- مستثنا کردن پیام‌های سرویس/سیستم
- cacheهای بومی پلتفرم که برای اثبات مشارکت بات لازم‌اند

مناسب برای کمک‌کننده مشترک:

- `requireMention`
- نتیجه اشاره صریح
- فهرست مجاز اشاره ضمنی
- عبور از دستور
- تصمیم نهایی برای رد کردن

جریان ترجیحی:

1. واقعیت‌های اشاره محلی را محاسبه کنید.
2. آن واقعیت‌ها را به `resolveInboundMentionDecision({ facts, policy })` بدهید.
3. در گیت ورودی خود از `decision.effectiveWasMentioned`، `decision.shouldBypassMention`، و `decision.shouldSkip` استفاده کنید.

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

`api.runtime.channel.mentions` همان کمک‌کننده‌های اشاره مشترک را برای
Pluginهای کانال bundled که از قبل به تزریق runtime وابسته‌اند ارائه می‌کند:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

اگر فقط به `implicitMentionKindWhen` و
`resolveInboundMentionDecision` نیاز دارید، برای جلوگیری از بارگذاری کمک‌کننده‌های
runtime ورودی نامرتبط، از
`openclaw/plugin-sdk/channel-mention-gating` import کنید.

برای gating اشاره از `resolveInboundMentionDecision({ facts, policy })` استفاده کنید.

## راهنما

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    فایل‌های استاندارد Plugin را بسازید. فیلد `channel` در `package.json`
    چیزی است که این را به یک Plugin کانال تبدیل می‌کند. برای سطح کامل فراداده package،
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
    تنظیمات تحت مالکیت Plugin که پیکربندی حساب کانال نیستند استفاده کنید. `channelConfigs`
    مقدار `channels.acme-chat` را اعتبارسنجی می‌کند و منبع مسیر سردی است که قبل از بارگذاری
    runtime Plugin توسط schema پیکربندی، راه‌اندازی، و سطوح UI استفاده می‌شود.

  </Step>

  <Step title="Build the channel plugin object">
    رابط `ChannelPlugin` سطح‌های آداپتر اختیاری زیادی دارد. با حداقل‌ها شروع کنید -
    `id` و `setup` - و هر زمان نیاز داشتید آداپترها را اضافه کنید.

    `src/channel.ts` را بسازید:

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

    برای کانال‌هایی که هم کلیدهای DM سطح بالای canonical و هم کلیدهای nested قدیمی را می‌پذیرند، از کمک‌کننده‌های `plugin-sdk/channel-config-helpers` استفاده کنید: `resolveChannelDmAccess`، `resolveChannelDmPolicy`، `resolveChannelDmAllowFrom`، و `normalizeChannelDmPolicy` مقدارهای محلی حساب را جلوتر از مقدارهای root ارث‌برده‌شده نگه می‌دارند. همان resolver را با ترمیم doctor از طریق `normalizeLegacyDmAliases` همراه کنید تا runtime و migration یک قرارداد را بخوانند.

    <Accordion title="What createChatChannelPlugin does for you">
      به‌جای پیاده‌سازی دستی رابط‌های آداپتر سطح پایین، گزینه‌های declarative را می‌دهید
      و builder آن‌ها را ترکیب می‌کند:

      | گزینه | چیزی که سیم‌کشی می‌کند |
      | --- | --- |
      | `security.dm` | resolver امنیت DM scoped از فیلدهای پیکربندی |
      | `pairing.text` | جریان pairing مبتنی بر متن DM با تبادل کد |
      | `threading` | resolver حالت reply-to (ثابت، account-scoped، یا سفارشی) |
      | `outbound.attachedResults` | تابع‌های ارسال که فراداده نتیجه (شناسه‌های پیام) را برمی‌گردانند |

      اگر به کنترل کامل نیاز دارید، می‌توانید به‌جای گزینه‌های declarative
      اشیای آداپتر خام را هم بدهید.

      آداپترهای خروجی خام می‌توانند تابع `chunker(text, limit, ctx)` تعریف کنند.
      `ctx.formatting` اختیاری تصمیم‌های قالب‌بندی زمان تحویل مانند
      `maxLinesPerMessage` را حمل می‌کند؛ آن را پیش از ارسال اعمال کنید تا رشته‌بندی پاسخ
      و مرزهای chunk یک بار توسط تحویل خروجی مشترک حل شوند.
      contextهای ارسال همچنین وقتی یک هدف پاسخ بومی resolve شده باشد شامل `replyToIdSource` (`implicit` یا `explicit`)
      هستند، بنابراین کمک‌کننده‌های payload می‌توانند برچسب‌های پاسخ صریح را بدون مصرف کردن یک slot پاسخ ضمنی تک‌مصرف حفظ کنند.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    `index.ts` را بسازید:

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
    بتواند آن‌ها را در راهنمای ریشه نشان دهد، بدون اینکه runtime کامل کانال را فعال کند،
    در حالی که بارگذاری‌های کامل عادی همچنان همان توصیف‌گرها را برای ثبت واقعی فرمان
    دریافت می‌کنند. `registerFull(...)` را برای کارهای فقط مربوط به runtime نگه دارید.
    اگر `registerFull(...)` روش‌های RPC مربوط به gateway را ثبت می‌کند، از یک
    پیشوند مخصوص Plugin استفاده کنید. فضاهای نام مدیریتی هسته (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه
    به `operator.admin` resolve می‌شوند.
    `defineChannelPluginEntry` جداسازی حالت ثبت را به‌صورت خودکار انجام می‌دهد. برای همه
    گزینه‌ها، [نقاط ورود](/fa/plugins/sdk-entrypoints#definechannelpluginentry) را ببینید.

  </Step>

  <Step title="افزودن ورودی راه‌اندازی">
    برای بارگذاری سبک‌وزن هنگام آماده‌سازی اولیه، `setup-entry.ts` بسازید:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    وقتی کانال غیرفعال یا پیکربندی‌نشده باشد، OpenClaw به‌جای ورودی کامل این را بارگذاری می‌کند.
    این کار از وارد کردن کد سنگین runtime در جریان‌های راه‌اندازی جلوگیری می‌کند.
    برای جزئیات، [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup#setup-entry) را ببینید.

    کانال‌های workspace همراه که exportهای امن برای راه‌اندازی را به ماژول‌های sidecar
    جدا می‌کنند، زمانی که به یک setter صریح runtime در زمان راه‌اندازی نیز نیاز دارند،
    می‌توانند از `defineBundledChannelSetupEntry(...)` از
    `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند.

  </Step>

  <Step title="مدیریت پیام‌های ورودی">
    Plugin شما باید پیام‌ها را از پلتفرم دریافت کند و آن‌ها را به
    OpenClaw ارسال کند. الگوی معمول یک webhook است که درخواست را اعتبارسنجی می‌کند و
    آن را از طریق handler ورودی کانال شما dispatch می‌کند:

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
      مدیریت پیام ورودی مخصوص کانال است. هر Plugin کانال
      pipeline ورودی خودش را مالکیت می‌کند. برای الگوهای واقعی، به Pluginهای کانال همراه
      (برای مثال بسته Plugin مربوط به Microsoft Teams یا Google Chat) نگاه کنید.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="آزمون">
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

    برای helperهای آزمون مشترک، [آزمون‌نویسی](/fa/plugins/sdk-testing) را ببینید.

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
  <Card title="گزینه‌های thread" icon="git-branch" href="/fa/plugins/sdk-entrypoints#registration-mode">
    حالت‌های پاسخ ثابت، محدود به حساب، یا سفارشی
  </Card>
  <Card title="یکپارچه‌سازی ابزار پیام" icon="puzzle" href="/fa/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool و کشف action
  </Card>
  <Card title="resolve کردن هدف" icon="crosshair" href="/fa/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="helperهای runtime" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، STT، رسانه، subagent از طریق api.runtime
  </Card>
  <Card title="API ورودی کانال" icon="bolt" href="/fa/plugins/sdk-channel-inbound">
    چرخه عمر رویداد ورودی مشترک: ingest، resolve، record، dispatch، finalize
  </Card>
</CardGroup>

<Note>
برخی seamهای helper همراه همچنان برای نگهداری Plugin همراه و
سازگاری وجود دارند. آن‌ها الگوی توصیه‌شده برای Pluginهای کانال جدید نیستند؛
مگر اینکه مستقیماً همان خانواده Plugin همراه را نگهداری می‌کنید، مسیرهای فرعی عمومی
channel/setup/reply/runtime را از سطح مشترک SDK ترجیح دهید.
</Note>

## گام‌های بعدی

- [Pluginهای Provider](/fa/plugins/sdk-provider-plugins) - اگر Plugin شما مدل‌ها را نیز ارائه می‌کند
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل import مسیرهای فرعی
- [آزمون‌نویسی SDK](/fa/plugins/sdk-testing) - ابزارهای آزمون و آزمون‌های قرارداد
- [Manifest مربوط به Plugin](/fa/plugins/manifest) - schema کامل manifest

## مرتبط

- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [Pluginهای agent harness](/fa/plugins/sdk-agent-harness)
