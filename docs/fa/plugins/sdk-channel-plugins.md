---
read_when:
    - شما در حال ساخت یک Plugin جدید برای کانال پیام‌رسانی هستید
    - می‌خواهید OpenClaw را به یک پلتفرم پیام‌رسانی متصل کنید
    - باید سطح آداپتور ChannelPlugin را درک کنید
sidebarTitle: Channel Plugins
summary: راهنمای گام‌به‌گام ساخت یک Plugin کانال پیام‌رسانی برای OpenClaw
title: ساخت Pluginهای کانال
x-i18n:
    generated_at: "2026-07-02T22:41:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

این راهنما ساخت یک Plugin کانال را توضیح می‌دهد که OpenClaw را به یک
پلتفرم پیام‌رسان متصل می‌کند. در پایان، یک کانال کارآمد با امنیت DM،
جفت‌سازی، رشته‌بندی پاسخ‌ها و پیام‌رسانی خروجی خواهید داشت.

<Info>
  اگر قبلاً هیچ Plugin برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را برای ساختار پایه‌ی بسته
  و راه‌اندازی مانیفست بخوانید.
</Info>

## Pluginهای کانال چگونه کار می‌کنند

Pluginهای کانال به ابزارهای ارسال/ویرایش/واکنش مخصوص خود نیاز ندارند. OpenClaw یک
ابزار مشترک `message` را در هسته نگه می‌دارد. Plugin شما مالک این موارد است:

- **پیکربندی** - حل‌وفصل حساب و جادوگر راه‌اندازی
- **امنیت** - خط‌مشی DM و فهرست‌های مجاز
- **جفت‌سازی** - جریان تأیید DM
- **دستور زبان نشست** - اینکه شناسه‌های مکالمه‌ی مخصوص ارائه‌دهنده چگونه به چت‌های پایه، شناسه‌های رشته و fallbackهای والد نگاشت می‌شوند
- **خروجی** - ارسال متن، رسانه و نظرسنجی به پلتفرم
- **رشته‌بندی** - اینکه پاسخ‌ها چگونه رشته‌بندی می‌شوند
- **تایپ Heartbeat** - سیگنال‌های اختیاری تایپ/مشغول برای هدف‌های تحویل Heartbeat

هسته مالک ابزار مشترک پیام، سیم‌کشی prompt، شکل بیرونی کلید نشست،
ثبت‌وضبط عمومی `:thread:` و dispatch است.

Pluginهای کانال جدید همچنین باید یک آداپتور `message` را با
`defineChannelMessageAdapter` از `openclaw/plugin-sdk/channel-outbound` ارائه کنند. این
آداپتور اعلام می‌کند انتقال بومی واقعاً از کدام قابلیت‌های ارسال نهایی پایدار
پشتیبانی می‌کند و ارسال‌های متن/رسانه را به همان توابع انتقالی متصل می‌کند که
آداپتور قدیمی `outbound` استفاده می‌کند. فقط وقتی قابلیتی را اعلام کنید که یک تست قرارداد
اثر جانبی بومی و رسید برگشتی را ثابت کند.
برای قرارداد کامل API، نمونه‌ها، ماتریس قابلیت‌ها، قواعد رسید، نهایی‌سازی پیش‌نمایش زنده،
خط‌مشی ack دریافت، تست‌ها و جدول مهاجرت، به
[API خروجی کانال](/fa/plugins/sdk-channel-outbound) مراجعه کنید.
اگر آداپتور موجود `outbound` از قبل متدهای ارسال و فراداده‌ی قابلیت درست را دارد،
از `createChannelMessageAdapterFromOutbound(...)` برای
استخراج آداپتور `message` استفاده کنید، به‌جای اینکه یک پل دیگر را دستی بنویسید.
ارسال‌های آداپتور باید مقدارهای `MessageReceipt` برگردانند. وقتی کد سازگاری
هنوز به شناسه‌های قدیمی نیاز دارد، آن‌ها را با `listMessageReceiptPlatformIds(...)`
یا `resolveMessageReceiptPrimaryId(...)` استخراج کنید، به‌جای اینکه فیلدهای موازی
`messageIds` را در کد چرخه‌ی عمر جدید نگه دارید.
کانال‌های دارای قابلیت پیش‌نمایش همچنین باید `message.live.capabilities` را با
چرخه‌ی عمر زنده‌ی دقیقی که مالک آن هستند اعلام کنند، مانند `draftPreview`،
`previewFinalization`، `progressUpdates`، `nativeStreaming`، یا
`quietFinalization`. کانال‌هایی که پیش‌نمایش پیش‌نویس را درجا نهایی می‌کنند
همچنین باید `message.live.finalizer.capabilities` را اعلام کنند، مانند `finalEdit`،
`normalFallback`، `discardPending`، `previewReceipt`، و
`retainOnAmbiguousFailure`، و منطق runtime را از طریق
`defineFinalizableLivePreviewAdapter(...)` به‌همراه
`deliverWithFinalizableLivePreviewAdapter(...)` هدایت کنند. این قابلیت‌ها را با تست‌های
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` و
`verifyChannelMessageLiveFinalizerProofs(...)` پشتیبانی کنید تا رفتار پیش‌نمایش بومی،
پیشرفت، ویرایش، fallback/نگه‌داری، پاک‌سازی و رسید نتواند بی‌صدا منحرف شود.
گیرنده‌های ورودی که تأییدهای پلتفرم را به تعویق می‌اندازند باید
`message.receive.defaultAckPolicy` و `supportedAckPolicies` را اعلام کنند، به‌جای اینکه
زمان‌بندی ack را در وضعیت محلی monitor پنهان کنند. هر خط‌مشی اعلام‌شده را با
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` پوشش دهید.

کمک‌گرهای قدیمی پاسخ مانند `createChannelTurnReplyPipeline`،
`dispatchInboundReplyWithBase` و `recordInboundSessionAndDispatchReply`
برای dispatcherهای سازگار همچنان در دسترس هستند. از این نام‌ها برای کد کانال جدید
استفاده نکنید؛ Pluginهای جدید باید با آداپتور `message`، رسیدها و
کمک‌گرهای چرخه‌ی عمر دریافت/ارسال در `openclaw/plugin-sdk/channel-outbound` شروع کنند.

کانال‌هایی که authorization ورودی را مهاجرت می‌دهند می‌توانند از زیرمسیر آزمایشی
`openclaw/plugin-sdk/channel-ingress-runtime` در مسیرهای دریافت runtime استفاده کنند.
این زیرمسیر lookup پلتفرم و اثرهای جانبی را در Plugin نگه می‌دارد، درحالی‌که
حل‌وفصل وضعیت فهرست مجاز، تصمیم‌های route/sender/command/event/activation،
diagnosticهای redact‌شده و نگاشت پذیرش turn را به اشتراک می‌گذارد. نرمال‌سازی
هویت Plugin را در توصیف‌گری که به resolver می‌دهید نگه دارید؛ مقدارهای خام match
را از وضعیت یا تصمیم حل‌شده serialize نکنید. برای طراحی API، مرز مالکیت و
انتظارهای تست، به [API ورود کانال](/fa/plugins/sdk-channel-ingress) مراجعه کنید.

اگر کانال شما از نشانگرهای تایپ خارج از پاسخ‌های ورودی پشتیبانی می‌کند،
`heartbeat.sendTyping(...)` را روی Plugin کانال ارائه کنید. هسته آن را با
هدف تحویل Heartbeat حل‌شده، پیش از شروع اجرای مدل Heartbeat فراخوانی می‌کند و
از چرخه‌ی عمر مشترک keepalive/cleanup تایپ استفاده می‌کند. وقتی پلتفرم به سیگنال توقف
صریح نیاز دارد، `heartbeat.clearTyping(...)` را اضافه کنید.

اگر کانال شما paramهای ابزار پیام اضافه می‌کند که منبع‌های رسانه را حمل می‌کنند،
نام آن paramها را از طریق `describeMessageTool(...).mediaSourceParams` ارائه کنید. هسته از
آن فهرست صریح برای نرمال‌سازی مسیر sandbox و خط‌مشی دسترسی به رسانه‌ی خروجی استفاده می‌کند،
بنابراین Pluginها برای paramهای مخصوص ارائه‌دهنده مانند avatar، attachment یا cover-image
به موردهای ویژه در هسته‌ی مشترک نیاز ندارند.
ترجیحاً یک map کلیدگذاری‌شده با action مانند
`{ "set-profile": ["avatarUrl", "avatarPath"] }` برگردانید تا actionهای نامرتبط
آرگومان‌های رسانه‌ی action دیگری را به ارث نبرند. یک آرایه‌ی flat همچنان برای paramهایی
کار می‌کند که عمداً در همه‌ی actionهای ارائه‌شده مشترک هستند.
کانال‌هایی که باید یک URL عمومی موقت را برای fetch رسانه در سمت پلتفرم ارائه کنند
می‌توانند از `createHostedOutboundMediaStore(...)` از
`openclaw/plugin-sdk/outbound-media` با storeهای وضعیت Plugin استفاده کنند. parsing
route پلتفرم و اجرای token را در Plugin کانال نگه دارید؛ کمک‌گر مشترک
فقط مالک بارگذاری رسانه، فراداده‌ی انقضا، ردیف‌های chunk و پاک‌سازی است.

اگر کانال شما برای `message(action="send")` به شکل‌دهی مخصوص ارائه‌دهنده نیاز دارد،
`actions.prepareSendPayload(...)` را ترجیح دهید. کارت‌های بومی، blockها، embedها یا
داده‌های پایدار دیگر را زیر `payload.channelData.<channel>` بگذارید و اجازه دهید هسته
ارسال واقعی را از طریق آداپتور outbound/message انجام دهد. از
`actions.handleAction(...)` برای ارسال فقط به‌عنوان fallback سازگاری برای
payloadهایی استفاده کنید که قابل serialize و retry نیستند.

اگر پلتفرم شما scope اضافه‌ای را داخل شناسه‌های مکالمه ذخیره می‌کند، آن parsing را
با `messaging.resolveSessionConversation(...)` در Plugin نگه دارید. این hook
canonical برای نگاشت `rawId` به شناسه‌ی مکالمه‌ی پایه، شناسه‌ی رشته‌ی اختیاری،
`baseConversationId` صریح و هر `parentConversationCandidates` است.
وقتی `parentConversationCandidates` را برمی‌گردانید، آن‌ها را از باریک‌ترین والد
تا گسترده‌ترین/مکالمه‌ی پایه مرتب نگه دارید.

وقتی کد Plugin نیاز دارد فیلدهای شبیه route را نرمال کند، یک رشته‌ی فرزند را با
route والدش مقایسه کند، یا از `{ channel, to, accountId, threadId }` یک کلید dedupe
پایدار بسازد، از `openclaw/plugin-sdk/channel-route` استفاده کنید. این کمک‌گر
شناسه‌های عددی رشته را همان‌طور نرمال می‌کند که هسته انجام می‌دهد، بنابراین Pluginها
باید آن را به مقایسه‌های ad hoc مانند `String(threadId)` ترجیح دهند.
Pluginهایی با دستور زبان هدف مخصوص ارائه‌دهنده باید
`messaging.resolveOutboundSessionRoute(...)` را ارائه کنند تا هسته هویت نشست و رشته‌ی
بومی ارائه‌دهنده را بدون استفاده از parser shimها دریافت کند.

Pluginهای bundle‌شده که پیش از boot شدن registry کانال به همان parsing نیاز دارند
همچنین می‌توانند یک فایل سطح بالای `session-key-api.ts` با export همسان
`resolveSessionConversation(...)` ارائه کنند. هسته از این سطح امن برای bootstrap
فقط وقتی استفاده می‌کند که registry Plugin runtime هنوز در دسترس نیست.

`messaging.resolveParentConversationCandidates(...)` به‌عنوان یک fallback سازگاری
قدیمی همچنان در دسترس است، وقتی یک Plugin فقط به fallbackهای والد روی
شناسه‌ی عمومی/خام نیاز دارد. اگر هر دو hook وجود داشته باشند، هسته ابتدا از
`resolveSessionConversation(...).parentConversationCandidates` استفاده می‌کند و فقط
وقتی hook canonical آن‌ها را حذف کند، به `resolveParentConversationCandidates(...)`
برمی‌گردد.

## تأییدها و قابلیت‌های کانال

بیشتر Pluginهای کانال به کد مخصوص تأیید نیاز ندارند.

- هسته مالک `/approve` در همان چت، payloadهای دکمه تایید مشترک، و تحویل fallback عمومی است.
- وقتی کانال به رفتار اختصاصی تایید نیاز دارد، یک شیء `approvalCapability` روی Plugin کانال را ترجیح دهید.
- `ChannelPlugin.approvals` حذف شده است. واقعیت‌های تحویل/native/render/auth تایید را روی `approvalCapability` قرار دهید.
- `plugin.auth` فقط برای ورود/خروج است؛ هسته دیگر hookهای auth تایید را از آن شیء نمی‌خواند.
- `approvalCapability.authorizeActorAction` و `approvalCapability.getActionAvailabilityState` seam استاندارد auth تایید هستند.
- برای دسترس‌پذیری auth تایید در همان چت از `approvalCapability.getActionAvailabilityState` استفاده کنید. تاییدکنندگان پیکربندی‌شده را برای `/approve` در دسترس نگه دارید، حتی وقتی تحویل native غیرفعال است؛ به‌جای آن برای راهنمایی تحویل/راه‌اندازی از وضعیت سطح آغازگر native استفاده کنید.
- اگر کانال شما تاییدهای native exec را ارائه می‌کند، وقتی وضعیت سطح آغازگر/native-client با auth تایید در همان چت متفاوت است، از `approvalCapability.getExecInitiatingSurfaceState` برای آن استفاده کنید. هسته از آن hook اختصاصی exec برای تفکیک `enabled` از `disabled`، تصمیم‌گیری درباره اینکه آیا کانال آغازگر از تاییدهای native exec پشتیبانی می‌کند یا نه، و گنجاندن کانال در راهنمای fallback مربوط به native-client استفاده می‌کند. `createApproverRestrictedNativeApprovalCapability(...)` این بخش را برای حالت رایج پر می‌کند.
- برای رفتار چرخه عمر payload اختصاصی کانال، مانند پنهان کردن اعلان‌های تایید محلی تکراری یا ارسال نشانگرهای تایپ پیش از تحویل، از `outbound.shouldSuppressLocalPayloadPrompt` یا `outbound.beforeDeliverPayload` استفاده کنید.
- از `approvalCapability.delivery` فقط برای مسیریابی تایید native یا سرکوب fallback استفاده کنید.
- برای واقعیت‌های تایید native متعلق به کانال از `approvalCapability.nativeRuntime` استفاده کنید. آن را روی entrypointهای داغ کانال با `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy نگه دارید؛ این آداپتر می‌تواند ماژول runtime شما را در زمان نیاز import کند، در حالی که همچنان به هسته اجازه می‌دهد چرخه عمر تایید را مونتاژ کند.
- فقط وقتی از `approvalCapability.render` استفاده کنید که کانال واقعا به payloadهای تایید سفارشی به‌جای renderer مشترک نیاز دارد.
- وقتی کانال می‌خواهد پاسخ مسیر غیرفعال، دکمه‌های دقیق پیکربندی لازم برای فعال‌سازی تاییدهای native exec را توضیح دهد، از `approvalCapability.describeExecApprovalSetup` استفاده کنید. این hook مقدار `{ channel, channelLabel, accountId }` را دریافت می‌کند؛ کانال‌های دارای حساب نام‌دار باید مسیرهای محدود به حساب مانند `channels.<channel>.accounts.<id>.execApprovals.*` را به‌جای پیش‌فرض‌های سطح بالا render کنند.
- وقتی راهنمای شکست تایید Plugin برای شکست‌های no-route و timeout تایید Plugin امن است، از `approvalCapability.describePluginApprovalSetup` استفاده کنید. `createApproverRestrictedNativeApprovalCapability(...)` این را از `describeExecApprovalSetup` استنباط نمی‌کند؛ همان helper را فقط وقتی صراحتا pass کنید که تاییدهای Plugin و exec واقعا از همان راه‌اندازی native استفاده می‌کنند.
- اگر کانالی بتواند از پیکربندی موجود هویت‌های DM پایدار شبیه مالک را استنباط کند، برای محدود کردن `/approve` در همان چت بدون افزودن منطق اختصاصی تایید به هسته، از `createResolvedApproverActionAuthAdapter` در `openclaw/plugin-sdk/approval-runtime` استفاده کنید.
- اگر auth تایید سفارشی عمدا فقط fallback همان چت را مجاز می‌کند، از `openclaw/plugin-sdk/approval-auth-runtime` مقدار `markImplicitSameChatApprovalAuthorization({ authorized: true })` را برگردانید؛ وگرنه هسته نتیجه را authorization صریح تاییدکننده در نظر می‌گیرد.
- اگر callback native متعلق به کانال تاییدها را مستقیم resolve می‌کند، پیش از resolve از `isImplicitSameChatApprovalAuthorization(...)` استفاده کنید تا fallback ضمنی همچنان از authorization عادی actor کانال عبور کند.
- اگر کانالی به تحویل تایید native نیاز دارد، کد کانال را روی نرمال‌سازی target و واقعیت‌های transport/presentation متمرکز نگه دارید. از `createChannelExecApprovalProfile`، `createChannelNativeOriginTargetResolver`، `createChannelApproverDmTargetResolver`، و `createApproverRestrictedNativeApprovalCapability` در `openclaw/plugin-sdk/approval-runtime` استفاده کنید. واقعیت‌های اختصاصی کانال را پشت `approvalCapability.nativeRuntime` قرار دهید، ترجیحا از طریق `createChannelApprovalNativeRuntimeAdapter(...)` یا `createLazyChannelApprovalNativeRuntimeAdapter(...)`، تا هسته بتواند handler را مونتاژ کند و مالک فیلترکردن درخواست، مسیریابی، dedupe، expiry، اشتراک Gateway، و اعلان‌های routed-elsewhere باشد. `nativeRuntime` به چند seam کوچک‌تر تقسیم شده است:
- وقتی یک کانال هم از تحویل native با مبدا session و هم از targetهای forwarding صریح تایید پشتیبانی می‌کند، از `createNativeApprovalChannelRouteGates` در `openclaw/plugin-sdk/approval-native-runtime` استفاده کنید. این helper انتخاب پیکربندی تایید، مدیریت `mode`، فیلترهای agent/session، اتصال حساب، تطبیق session-target، و تطبیق فهرست targetها را متمرکز می‌کند، در حالی که callers همچنان مالک شناسه کانال، حالت forwarding پیش‌فرض، lookup حساب، بررسی فعال بودن transport، نرمال‌سازی target، و resolve کردن target منبع turn هستند. از آن برای ایجاد پیش‌فرض‌های policy کانال متعلق به هسته استفاده نکنید؛ حالت پیش‌فرض مستند کانال را صریح pass کنید.
- `createChannelNativeOriginTargetResolver` به‌طور پیش‌فرض از matcher مشترک route کانال برای targetهای `{ to, accountId, threadId }` استفاده می‌کند. فقط وقتی `targetsMatch` را pass کنید که کانال قواعد هم‌ارزی اختصاصی provider دارد، مانند تطبیق prefix timestamp در Slack.
- وقتی کانال نیاز دارد پیش از اجرای matcher پیش‌فرض route یا callback سفارشی `targetsMatch`، شناسه‌های provider را canonical کند و هم‌زمان target اصلی را برای تحویل حفظ کند، `normalizeTargetForMatch` را به `createChannelNativeOriginTargetResolver` pass کنید. فقط وقتی از `normalizeTarget` استفاده کنید که خود target تحویل resolve‌شده باید canonical شود.
- `availability` - اینکه حساب پیکربندی شده است یا نه و اینکه درخواست باید handle شود یا نه
- `presentation` - نگاشت view model مشترک تایید به payloadهای native در حالت‌های pending/resolved/expired یا actionهای نهایی
- `transport` - آماده‌سازی targetها به‌همراه ارسال/به‌روزرسانی/حذف پیام‌های تایید native
- `interactions` - hookهای اختیاری bind/unbind/clear-action برای دکمه‌ها یا reactionهای native، به‌همراه hook اختیاری `cancelDelivered`. وقتی `deliverPending` وضعیت درون‌پردازشی یا پایدار ثبت می‌کند (مانند store هدف reaction)، `cancelDelivered` را پیاده‌سازی کنید تا اگر توقف handler تحویل را پیش از اجرای `bindPending` لغو کرد یا وقتی `bindPending` هیچ handleی برنگرداند، آن وضعیت آزاد شود
- `observe` - hookهای اختیاری diagnostics تحویل
- اگر کانال به اشیای متعلق به runtime مانند client، token، برنامه Bolt، یا گیرنده webhook نیاز دارد، آن‌ها را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید. registry عمومی runtime-context به هسته اجازه می‌دهد handlerهای capability-driven را از وضعیت startup کانال bootstrap کند، بدون افزودن glue wrapper اختصاصی تایید.
- فقط وقتی سراغ `createChannelApprovalHandler` یا `createChannelNativeApprovalRuntime` سطح پایین‌تر بروید که seam قابلیت‌محور هنوز به‌اندازه کافی گویا نیست.
- کانال‌های تایید native باید هم `accountId` و هم `approvalKind` را از طریق آن helperها route کنند. `accountId` policy تایید چندحسابی را به حساب bot درست محدود نگه می‌دارد، و `approvalKind` رفتار تایید exec در برابر Plugin را بدون branchهای hardcoded در هسته برای کانال در دسترس نگه می‌دارد.
- اکنون هسته مالک اعلان‌های reroute تایید نیز هست. Pluginهای کانال نباید پیام‌های follow-up اختصاصی خودشان با مضمون «تایید به DMها / کانال دیگری رفت» را از `createChannelNativeApprovalRuntime` ارسال کنند؛ در عوض، مسیریابی دقیق origin و approver-DM را از طریق helperهای مشترک capability تایید ارائه کنید و بگذارید هسته پیش از ارسال هر اعلانی به چت آغازگر، تحویل‌های واقعی را تجمیع کند.
- نوع شناسه تایید تحویل‌شده را end-to-end حفظ کنید. clientهای native نباید
  مسیریابی تایید exec در برابر Plugin را از وضعیت محلی کانال حدس بزنند یا بازنویسی کنند.
- انواع متفاوت تایید می‌توانند عمدا سطح‌های native متفاوتی ارائه کنند.
  نمونه‌های bundled فعلی:
  - Slack مسیریابی تایید native را برای هر دو شناسه exec و Plugin در دسترس نگه می‌دارد.
  - Matrix همان مسیریابی native DM/channel و UX مبتنی بر reaction را برای تاییدهای exec
    و Plugin نگه می‌دارد، در حالی که همچنان اجازه می‌دهد auth بر اساس نوع تایید متفاوت باشد.
- `createApproverRestrictedNativeApprovalAdapter` هنوز به‌عنوان wrapper سازگاری وجود دارد، اما کد جدید باید سازنده capability را ترجیح دهد و `approvalCapability` را روی Plugin ارائه کند.

برای entrypointهای داغ کانال، وقتی فقط به یک بخش از آن خانواده نیاز دارید،
مسیرهای runtime باریک‌تر را ترجیح دهید:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

به همین ترتیب، وقتی به سطح umbrella گسترده‌تر نیاز ندارید، این موارد را ترجیح دهید:
`openclaw/plugin-sdk/setup-runtime`،
`openclaw/plugin-sdk/setup-runtime`،
`openclaw/plugin-sdk/reply-runtime`،
`openclaw/plugin-sdk/reply-dispatch-runtime`،
`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking`.

به‌طور خاص برای setup:

- `openclaw/plugin-sdk/setup-runtime` helperهای setup امن برای runtime را پوشش می‌دهد:
  `createSetupTranslator`، آداپتورهای patch setup امن برای import (`createPatchedAccountSetupAdapter`،
  `createEnvPatchedAccountSetupAdapter`،
  `createSetupInputPresenceValidator`)، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و سازنده‌های
  delegated setup-proxy
- `openclaw/plugin-sdk/setup-runtime` شامل seam آداپتور آگاه از env برای
  `createEnvPatchedAccountSetupAdapter` است
- `openclaw/plugin-sdk/channel-setup` سازنده‌های setup نصب اختیاری
  به‌همراه چند primitive امن برای setup را پوشش می‌دهد:
  `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`،

اگر کانال شما از setup یا auth مبتنی بر env پشتیبانی می‌کند و جریان‌های عمومی startup/config
باید پیش از load شدن runtime آن نام‌های env را بدانند، آن‌ها را در manifest
Plugin با `channelEnvVars` اعلام کنید. `envVars` مربوط به runtime کانال یا ثابت‌های محلی
را فقط برای متن‌های رو به operator نگه دارید.

اگر کانال شما می‌تواند پیش از start شدن runtime Plugin در `status`، `channels list`، `channels status`، یا
اسکن‌های SecretRef ظاهر شود، `openclaw.setupEntry` را در
`package.json` اضافه کنید. آن entrypoint باید برای import در مسیرهای command فقط‌خواندنی امن باشد
و باید metadata کانال، آداپتور config امن برای setup، آداپتور status،
و metadata هدف secret کانال لازم برای آن خلاصه‌ها را برگرداند. clientها، listenerها، یا runtimeهای transport را از entry setup
شروع نکنید.

مسیر import اصلی entry کانال را نیز باریک نگه دارید. discovery می‌تواند
entry و ماژول Plugin کانال را برای ثبت capabilityها ارزیابی کند، بدون اینکه
کانال را فعال کند. فایل‌هایی مانند `channel-plugin-api.ts` باید شیء Plugin کانال
را بدون import کردن wizardهای setup، clientهای transport، listenerهای socket،
launcherهای subprocess، یا ماژول‌های startup سرویس export کنند. آن قطعات runtime
را در ماژول‌هایی قرار دهید که از `registerFull(...)`، setterهای runtime، یا آداپتورهای capability lazy
load می‌شوند.

`createOptionalChannelSetupWizard`، `DEFAULT_ACCOUNT_ID`،
`createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، و
`splitSetupEntries`

- فقط وقتی از seam گسترده‌تر `openclaw/plugin-sdk/setup` استفاده کنید که به helperهای سنگین‌تر مشترک setup/config مانند
  `moveSingleAccountChannelSectionToDefaultAccount(...)` نیز نیاز دارید

اگر کانال شما فقط می‌خواهد در سطح‌های setup پیام «ابتدا این Plugin را نصب کنید» را تبلیغ کند، `createOptionalChannelSetupSurface(...)` را ترجیح دهید. آداپتور/wizard تولیدشده هنگام نوشتن config و finalization fail closed می‌کند، و همان پیام install-required را در validation، finalize، و متن docs-link بازاستفاده می‌کند.

برای سایر مسیرهای داغ کانال، helperهای باریک را به سطح‌های legacy گسترده‌تر ترجیح دهید:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` برای پیکربندی چندحسابی و
  بازگشت به حساب پیش‌فرض
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/channel-inbound` برای مسیر/پاکت ورودی و
  سیم‌کشی ضبط و ارسال
- `openclaw/plugin-sdk/channel-targets` برای کمکی‌های تجزیه هدف
- `openclaw/plugin-sdk/outbound-media` برای بارگذاری رسانه و
  `openclaw/plugin-sdk/channel-outbound` برای نمایندگان هویت/ارسال خروجی
  و برنامه‌ریزی payload
- `buildThreadAwareOutboundSessionRoute(...)` از
  `openclaw/plugin-sdk/channel-core` زمانی که یک مسیر خروجی باید یک
  `replyToId`/`threadId` صریح را حفظ کند یا نشست فعلی `:thread:` را
  پس از اینکه کلید نشست پایه همچنان مطابق است، بازیابی کند. Pluginهای ارائه‌دهنده می‌توانند
  تقدم، رفتار پسوند، و عادی‌سازی شناسه رشته را وقتی پلتفرم آن‌ها
  معناشناسی تحویل رشته بومی دارد، بازنویسی کنند.
- `openclaw/plugin-sdk/thread-bindings-runtime` برای چرخه عمر اتصال رشته
  و ثبت adapter
- `openclaw/plugin-sdk/agent-media-payload` فقط زمانی که چیدمان فیلد payload
  قدیمی agent/media هنوز لازم است
- `openclaw/plugin-sdk/telegram-command-config` برای عادی‌سازی فرمان سفارشی
  Telegram، اعتبارسنجی تکرار/تداخل، و قرارداد پیکربندی فرمان
  پایدار در fallback

کانال‌های فقط احراز هویت معمولاً می‌توانند در مسیر پیش‌فرض متوقف شوند: core تأییدها را مدیریت می‌کند و Plugin فقط قابلیت‌های خروجی/احراز هویت را ارائه می‌دهد. کانال‌های تأیید بومی مانند Matrix، Slack، Telegram، و انتقال‌های چت سفارشی باید به‌جای پیاده‌سازی چرخه عمر تأیید اختصاصی، از کمکی‌های بومی مشترک استفاده کنند.

## سیاست منشن ورودی

مدیریت منشن ورودی را در دو لایه جدا نگه دارید:

- گردآوری شواهد تحت مالکیت Plugin
- ارزیابی سیاست مشترک

برای تصمیم‌های سیاست منشن از `openclaw/plugin-sdk/channel-mention-gating` استفاده کنید.
فقط زمانی از `openclaw/plugin-sdk/channel-inbound` استفاده کنید که به barrel کمکی ورودی
گسترده‌تر نیاز دارید.

مناسب برای منطق محلی Plugin:

- تشخیص پاسخ به bot
- تشخیص نقل‌قول از bot
- بررسی‌های مشارکت در رشته
- حذف پیام‌های سرویس/سیستم
- cacheهای بومی پلتفرم که برای اثبات مشارکت bot لازم‌اند

مناسب برای کمکی مشترک:

- `requireMention`
- نتیجه منشن صریح
- allowlist منشن ضمنی
- دور زدن فرمان
- تصمیم نهایی برای رد کردن

جریان ترجیحی:

1. واقعیت‌های منشن محلی را محاسبه کنید.
2. آن واقعیت‌ها را به `resolveInboundMentionDecision({ facts, policy })` بدهید.
3. در gate ورودی خود از `decision.effectiveWasMentioned`، `decision.shouldBypassMention`، و `decision.shouldSkip` استفاده کنید.

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

`api.runtime.channel.mentions` همان کمکی‌های منشن مشترک را برای
Pluginهای کانال bundled که از قبل به تزریق runtime وابسته‌اند، ارائه می‌کند:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

اگر فقط به `implicitMentionKindWhen` و
`resolveInboundMentionDecision` نیاز دارید، از
`openclaw/plugin-sdk/channel-mention-gating` وارد کنید تا از بارگذاری کمکی‌های runtime
ورودی نامرتبط جلوگیری شود.

برای gate منشن از `resolveInboundMentionDecision({ facts, policy })` استفاده کنید.

## راهنمای گام‌به‌گام

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    فایل‌های استاندارد Plugin را ایجاد کنید. فیلد `channel` در `package.json`
    چیزی است که این را به یک Plugin کانال تبدیل می‌کند. برای سطح کامل فراداده بسته،
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
    مقدار `channels.acme-chat` را اعتبارسنجی می‌کند و منبع مسیر سردی است که پیش از بارگذاری runtime
    Plugin توسط schema پیکربندی، setup، و سطوح UI استفاده می‌شود.

  </Step>

  <Step title="Build the channel plugin object">
    رابط `ChannelPlugin` سطح‌های adapter اختیاری زیادی دارد. با حداقل‌ها شروع کنید -
    `id` و `setup` - و adapterها را به‌اندازه نیاز اضافه کنید.

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

    برای کانال‌هایی که هم کلیدهای DM سطح بالای canonical و هم کلیدهای تو در توی legacy را می‌پذیرند، از کمکی‌های `plugin-sdk/channel-config-helpers` استفاده کنید: `resolveChannelDmAccess`، `resolveChannelDmPolicy`، `resolveChannelDmAllowFrom`، و `normalizeChannelDmPolicy` مقدارهای محلی حساب را جلوتر از مقدارهای root به‌ارث‌رسیده نگه می‌دارند. همان resolver را با تعمیر doctor از طریق `normalizeLegacyDmAliases` جفت کنید تا runtime و migration یک قرارداد واحد را بخوانند.

    <Accordion title="What createChatChannelPlugin does for you">
      به‌جای پیاده‌سازی دستی رابط‌های adapter سطح پایین، گزینه‌های
      declarative را می‌دهید و builder آن‌ها را ترکیب می‌کند:

      | گزینه | چه چیزی را متصل می‌کند |
      | --- | --- |
      | `security.dm` | resolver امنیت DM محدود به scope از فیلدهای پیکربندی |
      | `pairing.text` | جریان جفت‌سازی DM مبتنی بر متن با تبادل کد |
      | `threading` | resolver حالت پاسخ به (ثابت، محدود به حساب، یا سفارشی) |
      | `outbound.attachedResults` | تابع‌های ارسال که فراداده نتیجه را برمی‌گردانند (شناسه‌های پیام) |

      اگر به کنترل کامل نیاز دارید، همچنین می‌توانید به‌جای گزینه‌های declarative
      اشیای adapter خام را بدهید.

      adapterهای خروجی خام می‌توانند تابع `chunker(text, limit, ctx)` تعریف کنند.
      مقدار اختیاری `ctx.formatting` تصمیم‌های قالب‌بندی زمان تحویل
      مانند `maxLinesPerMessage` را حمل می‌کند؛ آن را پیش از ارسال اعمال کنید تا رشته‌بندی پاسخ
      و مرزهای chunk یک بار توسط تحویل خروجی مشترک حل شوند.
      contextهای ارسال همچنین وقتی یک هدف پاسخ بومی resolve شده باشد، `replyToIdSource` (`implicit` یا `explicit`)
      را شامل می‌شوند، تا کمکی‌های payload بتوانند tagهای پاسخ صریح را بدون مصرف
      slot پاسخ ضمنی یک‌بارمصرف حفظ کنند.
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

    توصیف‌گرهای CLI متعلق به کانال را در `registerCliMetadata(...)` قرار دهید تا OpenClaw
    بتواند آن‌ها را در راهنمای ریشه نشان دهد، بدون اینکه runtime کامل کانال را فعال کند،
    در حالی که بارگذاری‌های کامل عادی همچنان همان توصیف‌گرها را برای ثبت واقعی فرمان
    دریافت می‌کنند. `registerFull(...)` را برای کارهای صرفا مربوط به runtime نگه دارید.
    اگر `registerFull(...)` متدهای RPC مربوط به gateway را ثبت می‌کند، از یک
    پیشوند اختصاصی Plugin استفاده کنید. فضاهای نام مدیریتی هسته (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه
    به `operator.admin` resolve می‌شوند.
    `defineChannelPluginEntry` جداسازی حالت ثبت را به‌صورت خودکار انجام می‌دهد. برای همه
    گزینه‌ها، [نقاط ورود](/fa/plugins/sdk-entrypoints#definechannelpluginentry) را ببینید.

  </Step>

  <Step title="Add a setup entry">
    برای بارگذاری سبک‌وزن هنگام راه‌اندازی اولیه، `setup-entry.ts` بسازید:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    وقتی کانال غیرفعال یا پیکربندی‌نشده است، OpenClaw این مورد را به‌جای ورودی کامل
    بارگذاری می‌کند. این کار از وارد شدن کد سنگین runtime در جریان‌های setup جلوگیری می‌کند.
    برای جزئیات، [Setup و پیکربندی](/fa/plugins/sdk-setup#setup-entry) را ببینید.

    کانال‌های workspace همراه که exportهای امن برای setup را به ماژول‌های sidecar
    جدا می‌کنند، وقتی به یک setter صریح runtime در زمان setup هم نیاز دارند، می‌توانند از
    `defineBundledChannelSetupEntry(...)` از
    `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند.

  </Step>

  <Step title="Handle inbound messages">
    Plugin شما باید پیام‌ها را از پلتفرم دریافت کند و آن‌ها را به
    OpenClaw منتقل کند. الگوی معمول یک Webhook است که درخواست را اعتبارسنجی می‌کند و
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
      مدیریت پیام ورودی مخصوص کانال است. هر Plugin کانال مالک
      pipeline ورودی خودش است. برای الگوهای واقعی، به Pluginهای کانال همراه
      (برای مثال بسته Plugin مربوط به Microsoft Teams یا Google Chat) نگاه کنید.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
تست‌های هم‌مکان را در `src/channel.test.ts` بنویسید:

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

    برای helperهای مشترک تست، [تست کردن](/fa/plugins/sdk-testing) را ببینید.

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
    حالت‌های پاسخ ثابت، محدود به account، یا سفارشی
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/fa/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    `describeMessageTool` و کشف action
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/fa/plugins/architecture-internals#channel-target-resolution">
    `inferTargetChatType`، `looksLikeId`، `reservedLiterals`، `resolveTarget`
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، STT، رسانه، زیرعامل از طریق `api.runtime`
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/fa/plugins/sdk-channel-inbound">
    چرخه عمر مشترک رویداد ورودی: ingest، resolve، record، dispatch، finalize
  </Card>
</CardGroup>

<Note>
برخی seamهای helper همراه هنوز برای نگهداری Pluginهای همراه و
سازگاری وجود دارند. این‌ها الگوی توصیه‌شده برای Pluginهای کانال جدید نیستند؛
مگر اینکه مستقیما همان خانواده Plugin همراه را نگهداری می‌کنید، subpathهای عمومی
کانال/setup/reply/runtime را از سطح مشترک SDK ترجیح دهید.
</Note>

## گام‌های بعدی

- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - اگر Plugin شما مدل‌ها را نیز ارائه می‌دهد
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل importهای subpath
- [تست SDK](/fa/plugins/sdk-testing) - ابزارهای تست و تست‌های قرارداد
- [Manifest مربوط به Plugin](/fa/plugins/manifest) - schema کامل manifest

## مرتبط

- [setup مربوط به Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [Pluginهای harness عامل](/fa/plugins/sdk-agent-harness)
