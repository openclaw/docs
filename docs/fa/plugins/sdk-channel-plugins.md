---
read_when:
    - در حال ساخت یک Plugin جدید برای کانال پیام‌رسانی هستید
    - می‌خواهید OpenClaw را به یک پلتفرم پیام‌رسان متصل کنید
    - باید سطح آداپتور `ChannelPlugin` را درک کنید
sidebarTitle: Channel Plugins
summary: راهنمای گام‌به‌گام ساخت Plugin کانال پیام‌رسانی برای OpenClaw
title: ساخت Plugin‌های کانال
x-i18n:
    generated_at: "2026-07-16T16:58:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

این راهنما یک Plugin کانال می‌سازد که OpenClaw را به یک پلتفرم پیام‌رسانی متصل می‌کند: امنیت پیام خصوصی، جفت‌سازی، رشته‌بندی پاسخ‌ها و پیام‌رسانی خروجی.

<Info>
  با Pluginهای OpenClaw آشنا نیستید؟ ابتدا برای آشنایی با ساختار بسته و تنظیم مانیفست، [شروع به کار](/fa/plugins/building-plugins)
  را بخوانید.
</Info>

## مسئولیت‌های Plugin شما

Pluginهای کانال ابزارهای ارسال/ویرایش/واکنش را پیاده‌سازی نمی‌کنند؛ هسته یک ابزار
مشترک `message` فراهم می‌کند. مسئولیت‌های Plugin شما عبارت‌اند از:

- **پیکربندی** - تفکیک حساب و راه‌انداز تنظیمات
- **امنیت** - خط‌مشی پیام خصوصی و فهرست‌های مجاز
- **جفت‌سازی** - جریان تأیید پیام خصوصی
- **دستور زبان نشست** - نحوه نگاشت شناسه‌های مکالمه مختص ارائه‌دهنده به گفت‌وگوهای
  پایه، شناسه‌های رشته و جایگزین‌های والد
- **خروجی** - ارسال متن، رسانه و نظرسنجی به پلتفرم
- **رشته‌بندی** - نحوه رشته‌بندی پاسخ‌ها
- **نشانگر تایپ Heartbeat** - سیگنال‌های اختیاری تایپ/مشغول‌بودن برای مقصدهای تحویل
  Heartbeat

هسته مالک ابزار مشترک پیام، اتصال اعلان، شکل بیرونی کلید نشست،
ثبت عمومی `:thread:` و توزیع است.

## آداپتور پیام

یک آداپتور `message` را با `defineChannelMessageAdapter` از
`openclaw/plugin-sdk/channel-outbound` ارائه کنید. فقط قابلیت‌های پایدار ارسال نهایی
را که انتقال بومی شما واقعاً پشتیبانی می‌کند اعلام کنید و آن‌ها را با آزمون قراردادی
پشتیبانی کنید که اثر جانبی بومی و رسید بازگشتی را اثبات می‌کند. ارسال متن/رسانه را
به همان توابع انتقالی هدایت کنید که آداپتور قدیمی `outbound` استفاده می‌کند. برای
قرارداد کامل API، ماتریس قابلیت‌ها، قواعد رسید، نهایی‌سازی پیش‌نمایش زنده،
خط‌مشی تأیید دریافت، آزمون‌ها و جدول مهاجرت، به
[API خروجی کانال](/fa/plugins/sdk-channel-outbound) مراجعه کنید.

اگر آداپتور موجود `outbound` شما از قبل روش‌های ارسال و
فراداده قابلیت مناسب را دارد، به‌جای نوشتن دستی یک
پل دیگر، آداپتور `message` را با
`createChannelMessageAdapterFromOutbound(...)` مشتق کنید. ارسال‌های آداپتور مقادیر `MessageReceipt` را برمی‌گردانند. برای شناسه‌های قدیمی، آن‌ها را
با `listMessageReceiptPlatformIds(...)` یا
`resolveMessageReceiptPrimaryId(...)` مشتق کنید، نه اینکه فیلدهای موازی `messageIds`
را نگه دارید.

قابلیت‌های زنده و نهایی‌ساز را دقیق اعلام کنید؛ هسته از آن‌ها برای تصمیم‌گیری
درباره توانایی‌های کانال استفاده می‌کند و ناهماهنگی میان رفتار اعلام‌شده و واقعی،
شکست آزمون قرارداد محسوب می‌شود:

| سطح                                  | مقادیر                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

کانال‌هایی که پیش‌نمایش پیش‌نویس را درجا نهایی می‌کنند باید منطق زمان اجرا را
از طریق `defineFinalizableLivePreviewAdapter(...)` به‌همراه
`deliverWithFinalizableLivePreviewAdapter(...)` هدایت کنند و قابلیت‌های اعلام‌شده را
با آزمون‌های `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
و `verifyChannelMessageLiveFinalizerProofs(...)` پشتیبانی کنند تا رفتار پیش‌نمایش بومی،
پیشرفت، ویرایش، جایگزینی/نگه‌داری، پاک‌سازی و رسید نتواند بی‌سروصدا
دچار ناهماهنگی شود.

گیرنده‌های ورودی که تأییدهای پلتفرم را به تعویق می‌اندازند باید
`message.receive.defaultAckPolicy` و `supportedAckPolicies` را اعلام کنند، نه اینکه
زمان‌بندی تأیید را در وضعیت محلی پایشگر پنهان کنند. هر خط‌مشی اعلام‌شده را با
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` پوشش دهید.

کمک‌تابع‌های قدیمی پاسخ مانند `dispatchInboundReplyWithBase` و
`recordInboundSessionAndDispatchReply` همچنان برای توزیع‌کننده‌های
سازگار در دسترس‌اند. از آن‌ها برای کد کانال جدید استفاده نکنید؛ در عوض با آداپتور `message`،
رسیدها و کمک‌تابع‌های چرخه عمر دریافت/ارسال در
`openclaw/plugin-sdk/channel-outbound` شروع کنید.

### ورود داده ورودی (آزمایشی)

کانال‌هایی که مجوزدهی ورودی را مهاجرت می‌دهند می‌توانند از زیرمسیر آزمایشی
`openclaw/plugin-sdk/channel-ingress-runtime` در مسیرهای دریافت زمان اجرا
استفاده کنند. این زیرمسیر واقعیت‌های پلتفرم، فهرست‌های مجاز خام، توصیفگرهای مسیر، واقعیت‌های
فرمان و پیکربندی گروه دسترسی را می‌پذیرد، سپس نگاشت‌های فرستنده/مسیر/فرمان/فعال‌سازی
و گراف مرتب‌شده ورود را برمی‌گرداند، درحالی‌که جست‌وجوی پلتفرم و اثرهای
جانبی در Plugin باقی می‌مانند. عادی‌سازی هویت Plugin را در
توصیفگری که به تفکیک‌کننده می‌دهید نگه دارید؛ مقادیر تطبیق خام را از
وضعیت یا تصمیم تفکیک‌شده سریال‌سازی نکنید. برای طراحی API،
مرز مالکیت و انتظارات آزمون، به
[API ورود کانال](/fa/plugins/sdk-channel-ingress) مراجعه کنید.

### نشانگرهای تایپ

اگر کانال شما از نشانگرهای تایپ خارج از پاسخ‌های ورودی پشتیبانی می‌کند،
`heartbeat.sendTyping(...)` را در Plugin کانال ارائه کنید. هسته پیش از آغاز اجرای مدل Heartbeat،
آن را با مقصد تفکیک‌شده تحویل Heartbeat فراخوانی می‌کند و
از چرخه عمر مشترک زنده‌نگه‌داشتن/پاک‌سازی تایپ استفاده می‌کند. اگر پلتفرم به
سیگنال توقف صریح نیاز دارد، `heartbeat.clearTyping(...)` را اضافه کنید.

### پارامترهای منبع رسانه

اگر کانال شما پارامترهایی به ابزار پیام اضافه می‌کند که حامل منابع رسانه هستند، نام
آن پارامترها را از طریق `plugin.actions.describeMessageTool(...).mediaSourceParams` ارائه کنید.
هسته از این فهرست صریح برای عادی‌سازی مسیر محیط ایزوله و خط‌مشی دسترسی
رسانه خروجی استفاده می‌کند، بنابراین Pluginها برای پارامترهای تصویر نمایه،
پیوست یا تصویر روی جلد مختص ارائه‌دهنده به حالت‌های خاص در هسته مشترک نیاز ندارند.

نگاشتی مبتنی بر کلید کنش، مانند `{ "set-profile": ["avatarUrl", "avatarPath"] }`،
را ترجیح دهید تا کنش‌های نامرتبط آرگومان‌های رسانه کنشی دیگر را به ارث نبرند. آرایه تخت
همچنان برای پارامترهایی که عمداً میان همه کنش‌های ارائه‌شده مشترک‌اند کار می‌کند.

کانال‌هایی که باید یک URL عمومی موقت برای واکشی رسانه در سمت پلتفرم
ارائه کنند، می‌توانند از `createHostedOutboundMediaStore(...)` از
`openclaw/plugin-sdk/outbound-media` همراه با مخازن وضعیت Plugin استفاده کنند. تجزیه
مسیر پلتفرم و اعمال توکن را در Plugin کانال نگه دارید؛ کمک‌تابع مشترک
فقط مالک بارگذاری رسانه، فراداده انقضا، ردیف‌های قطعه و پاک‌سازی است.

### شکل‌دهی محموله بومی

اگر کانال شما برای `message(action="send")` به شکل‌دهی مختص ارائه‌دهنده نیاز دارد،
`actions.prepareSendPayload(...)` را ترجیح دهید. کارت‌ها، بلوک‌ها، جاسازی‌ها یا
سایر داده‌های پایدار بومی را زیر `payload.channelData.<channel>` قرار دهید و اجازه دهید هسته
از طریق آداپتور خروجی/پیام ارسال کند. از `actions.handleAction(...)` برای ارسال
فقط به‌عنوان جایگزین سازگاری برای محموله‌هایی استفاده کنید که نمی‌توان آن‌ها را سریال‌سازی و
دوباره امتحان کرد.

### دستور زبان مکالمه نشست

اگر پلتفرم شما دامنه اضافی را درون شناسه‌های مکالمه ذخیره می‌کند، تجزیه آن را
با `messaging.resolveSessionConversation(...)` در Plugin نگه دارید. این قلاب
مرجع برای نگاشت `rawId` به شناسه مکالمه پایه، شناسه
اختیاری رشته، `baseConversationId` صریح و هر
`parentConversationCandidates` است. وقتی `parentConversationCandidates` را برمی‌گردانید،
آن‌ها را از محدودترین والد تا گسترده‌ترین/پایه‌ترین مکالمه مرتب کنید.

`messaging.resolveParentConversationCandidates(...)` یک جایگزین سازگاری
منسوخ برای Pluginهایی است که فقط روی شناسه عمومی/خام به جایگزین‌های والد نیاز دارند.
اگر هر دو قلاب وجود داشته باشند، هسته ابتدا از
`resolveSessionConversation(...).parentConversationCandidates` استفاده می‌کند و فقط زمانی
به `resolveParentConversationCandidates(...)` برمی‌گردد که قلاب مرجع
آن‌ها را حذف کرده باشد.

Pluginهای همراهی که پیش از راه‌اندازی رجیستری کانال به همین تجزیه نیاز دارند،
می‌توانند یک فایل سطح‌بالای `session-key-api.ts` با صادرات
`resolveSessionConversation(...)` منطبق ارائه کنند (Pluginهای Feishu و Telegram
را ببینید). هسته فقط زمانی از آن سطح ایمن برای راه‌اندازی اولیه استفاده می‌کند که رجیستری Plugin
زمان اجرا هنوز در دسترس نباشد.

وقتی کد Plugin باید فیلدهای شبیه مسیر را عادی‌سازی کند،
یک رشته فرزند را با مسیر والد آن مقایسه کند یا کلید حذف تکرار پایداری از
`{ channel, to, accountId, threadId }` بسازد، از `openclaw/plugin-sdk/channel-route` استفاده کنید. این کمک‌تابع
شناسه‌های عددی رشته را مانند هسته عادی‌سازی می‌کند، بنابراین آن را بر مقایسه‌های موردی
`String(threadId)` ترجیح دهید. Pluginهایی با دستور زبان مقصد مختص ارائه‌دهنده
باید `messaging.resolveOutboundSessionRoute(...)` را ارائه کنند تا هسته
هویت بومی ارائه‌دهنده برای نشست و رشته را بدون واسطه‌های تجزیه‌کننده دریافت کند.

### پشتیبانی از اتصال مکالمه در دامنه حساب

وقتی کانال از اتصال‌های عمومی مکالمه جاری پشتیبانی می‌کند،
`conversationBindings.supportsCurrentConversationBinding` را تنظیم کنید. `createChatChannelPlugin(...)`
این قابلیت ایستا را به‌طور پیش‌فرض روی `true` تنظیم می‌کند.

اگر پشتیبانی بسته به حساب پیکربندی‌شده متفاوت است،
`conversationBindings.isCurrentConversationBindingSupported({ accountId })` را نیز پیاده‌سازی کنید.
هسته این قلاب همگام را فقط پس از فعال‌شدن قابلیت ایستا ارزیابی می‌کند.
برگرداندن `false` عملیات عمومی قابلیت مکالمه جاری،
اتصال، جست‌وجو، فهرست‌کردن، لمس و قطع اتصال را برای آن حساب از دسترس خارج می‌کند.
حذف قلاب، قابلیت ایستا را برای همه حساب‌ها اعمال می‌کند.

پاسخ را از پیکربندی حساب یا وضعیت زمان اجرایی که از قبل بارگذاری شده است تفکیک کنید. این
قلاب فقط اتصال‌های عمومی مکالمه جاری را کنترل می‌کند؛ جایگزین
قواعد اتصال پیکربندی‌شده یا مسیریابی نشست تحت مالکیت Plugin نمی‌شود. آزمون‌های قرارداد
باید دست‌کم یک حساب پشتیبانی‌شده و یک حساب پشتیبانی‌نشده را از طریق
قرارداد `ChannelPlugin["conversationBindings"]` صادرشده توسط
`openclaw/plugin-sdk/channel-core` پوشش دهند.

## تأییدها و قابلیت‌های کانال

بیشتر Pluginهای کانال به کد مختص تأیید نیاز ندارند. هسته مالک
`/approve` در همان گفت‌وگو، محموله‌های مشترک دکمه تأیید و تحویل جایگزین عمومی است.
`ChannelPlugin.approvals` حذف شده است؛ در عوض، واقعیت‌های تحویل/بومی/رندر/احراز هویت تأیید
را روی یک شیء `approvalCapability` قرار دهید. `plugin.auth` فقط برای ورود/خروج
است؛ هسته دیگر قلاب‌های احراز هویت تأیید را از آن شیء نمی‌خواند.

از `approvalCapability.delivery` فقط برای مسیریابی بومی تأیید یا جلوگیری از جایگزین،
و از `approvalCapability.render` فقط زمانی استفاده کنید که کانالی واقعاً به
محموله‌های سفارشی تأیید به‌جای رندرکننده مشترک نیاز دارد.

### احراز هویت تأیید

- `approvalCapability.authorizeActorAction` و
  `approvalCapability.getActionAvailabilityState` مرجع
  احراز هویت تأیید هستند.
- از `getActionAvailabilityState` برای دسترس‌پذیری احراز هویت تأیید در همان گفت‌وگو استفاده کنید.
  تأییدکنندگان پیکربندی‌شده را حتی زمانی که تحویل بومی
  غیرفعال است برای `/approve` در دسترس نگه دارید؛ به‌جای آن برای راهنمایی تحویل/راه‌اندازی
  از وضعیت بومی سطح آغازکننده استفاده کنید.
- اگر کانال شما تأییدهای بومی اجرا را ارائه می‌کند، هنگامی که
  وضعیت سطح آغازکننده/کارخواه بومی با احراز هویت تأیید در همان گفت‌وگو
  متفاوت است، از `approvalCapability.getExecInitiatingSurfaceState` برای آن استفاده کنید.
  هسته از این قلاب مختص اجرا برای تمایز `enabled` از
  `disabled`، تصمیم‌گیری درباره پشتیبانی کانال آغازکننده از تأییدهای بومی اجرا
  و گنجاندن کانال در راهنمایی جایگزین کارخواه بومی استفاده می‌کند.
  `createApproverRestrictedNativeApprovalCapability(...)` این مورد را برای
  حالت رایج تکمیل می‌کند.
- اگر کانالی بتواند هویت‌های پیام خصوصی پایدار و شبیه مالک را از پیکربندی موجود استنباط کند،
  از `createResolvedApproverActionAuthAdapter` از
  `openclaw/plugin-sdk/approval-runtime` استفاده کنید تا `/approve` در همان گفت‌وگو را
  بدون افزودن منطق مختص تأیید به هسته محدود کنید.
- اگر احراز هویت سفارشی تأیید عمداً فقط جایگزین همان گفت‌وگو را مجاز می‌کند،
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` را از
  `openclaw/plugin-sdk/approval-auth-runtime` برگردانید؛ در غیر این صورت هسته نتیجه را
  مجوز صریح تأییدکننده در نظر می‌گیرد.
- اگر فراخوان برگشتی بومی تحت مالکیت کانال مستقیماً تأییدها را تفکیک می‌کند، پیش از تفکیک
  از `isImplicitSameChatApprovalAuthorization(...)` استفاده کنید تا جایگزین
  ضمنی همچنان از مجوزدهی عادی کنشگر کانال عبور کند.

### چرخه عمر محموله و راهنمای راه‌اندازی

- از `outbound.shouldSuppressLocalPayloadPrompt` یا
  `outbound.beforeDeliverPayload` برای رفتار چرخه عمر محموله مختص کانال،
  مانند پنهان‌کردن اعلان‌های تکراری محلی تأیید یا ارسال نشانگرهای تایپ
  پیش از تحویل، استفاده کنید.
- وقتی کانال می‌خواهد پاسخ مسیر غیرفعال
  کنترل‌های دقیق پیکربندی لازم برای فعال‌کردن تأییدهای بومی اجرا را توضیح دهد،
  از `approvalCapability.describeExecApprovalSetup` استفاده کنید. این قلاب `{ channel, channelLabel, accountId }` را دریافت می‌کند؛
  کانال‌های دارای حساب نام‌گذاری‌شده باید مسیرهای محدود به حساب، مانند
  `channels.<channel>.accounts.<id>.execApprovals.*`، را به‌جای پیش‌فرض‌های
  سطح‌بالا رندر کنند.
- وقتی نمایش راهنمای شکست تأیید Plugin برای شکست‌های بدون مسیر و مهلت‌گذشته
  تأیید Plugin ایمن است، از `approvalCapability.describePluginApprovalSetup` استفاده کنید.
  `createApproverRestrictedNativeApprovalCapability(...)` این مورد را
  از `describeExecApprovalSetup` استنباط نمی‌کند؛ فقط زمانی همان کمک‌تابع را صریحاً
  ارسال کنید که تأییدهای Plugin و اجرا واقعاً از راه‌اندازی بومی یکسانی استفاده می‌کنند.

### تحویل بومی تأیید

اگر کانالی به تحویل بومی تأیید نیاز دارد، کد کانال را بر
عادی‌سازی مقصد به‌همراه واقعیت‌های انتقال/ارائه متمرکز نگه دارید. از
`createChannelExecApprovalProfile`، `createChannelNativeOriginTargetResolver`،
`createChannelApproverDmTargetResolver` و
`createApproverRestrictedNativeApprovalCapability` از
`openclaw/plugin-sdk/approval-runtime` استفاده کنید. واقعیت‌های مختص کانال را پشت
`approvalCapability.nativeRuntime`، ترجیحاً از طریق
`createChannelApprovalNativeRuntimeAdapter(...)` یا
`createLazyChannelApprovalNativeRuntimeAdapter(...)`، قرار دهید تا هسته بتواند
رسیدگی‌کننده را سرهم کند و مالک پالایش درخواست، مسیریابی، حذف تکرار، انقضا، اشتراک
Gateway و اعلان‌های مسیریابی‌شده به جای دیگر باشد.

`nativeRuntime` به چند مرجع کوچک‌تر تقسیم شده است:

- `availability` - اینکه آیا حساب پیکربندی شده است و آیا یک درخواست
  باید پردازش شود
- `presentation` - نگاشت مدل نمای مشترک تأیید به
  payloadهای بومی در انتظار/حل‌شده/منقضی‌شده یا کنش‌های نهایی
- `transport` - آماده‌سازی مقصدها و ارسال/به‌روزرسانی/حذف پیام‌های
  بومی تأیید
- `interactions` - hookهای اختیاری اتصال/قطع اتصال/پاک‌سازی کنش برای دکمه‌های بومی
  یا واکنش‌ها، به‌علاوه یک hook اختیاری `cancelDelivered`. هنگامی `cancelDelivered` را پیاده‌سازی کنید
  که `deliverPending` وضعیت درون‌فرایندی یا پایدار
  (مانند مخزن مقصد واکنش) را ثبت می‌کند تا اگر توقف یک
  handler تحویل را پیش از اجرای `bindPending` لغو کرد، یا هنگامی که
  `bindPending` هیچ handleای برنمی‌گرداند، بتوان آن وضعیت را آزاد کرد
- `observe` - hookهای اختیاری عیب‌یابی تحویل

سایر helperهای تأیید:

- هنگامی که یک کانال هم از تحویل بومی با مبدأ نشست و هم از مقصدهای صریح ارسال تأیید پشتیبانی می‌کند، از `createNativeApprovalChannelRouteGates` در
  `openclaw/plugin-sdk/approval-native-runtime` استفاده کنید. این
  helper انتخاب پیکربندی تأیید، مدیریت `mode`، فیلترهای عامل/نشست،
  اتصال حساب، تطبیق مقصد نشست و تطبیق فهرست مقصدها را متمرکز می‌کند؛
  درحالی‌که فراخواننده‌ها همچنان مالک شناسه کانال، حالت پیش‌فرض ارسال، جست‌وجوی حساب،
  بررسی فعال‌بودن انتقال، نرمال‌سازی مقصد و
  تفکیک مقصد منبع نوبت هستند. از آن برای ایجاد پیش‌فرض‌های سیاست کانال
  تحت مالکیت هسته استفاده نکنید؛ حالت پیش‌فرض مستندشده کانال را صریحاً ارسال کنید.
- `createChannelNativeOriginTargetResolver` به‌طور پیش‌فرض برای مقصدهای `{ to, accountId, threadId }` از تطبیق‌دهنده مشترک مسیر کانال
  استفاده می‌کند. `targetsMatch` را فقط هنگامی ارسال کنید که یک کانال قواعد هم‌ارزی ویژه ارائه‌دهنده دارد،
  مانند تطبیق پیشوند timestamp در Slack. هنگامی `normalizeTargetForMatch` را ارسال کنید که
  کانال باید شناسه‌های ارائه‌دهنده را پیش از اجرای تطبیق‌دهنده پیش‌فرض مسیر
  یا callback سفارشی `targetsMatch` به شکل کانونی درآورد، درحالی‌که
  مقصد اصلی را برای تحویل حفظ می‌کند. از `normalizeTarget` فقط هنگامی استفاده کنید که خود مقصد
  تفکیک‌شده تحویل باید به شکل کانونی درآید.
- اگر کانال به اشیای تحت مالکیت runtime مانند client، token، برنامه Bolt
  یا گیرنده Webhook نیاز دارد، آن‌ها را از طریق
  `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید. رجیستری عمومی زمینه runtime
  به هسته اجازه می‌دهد handlerهای قابلیت‌محور را از وضعیت راه‌اندازی کانال
  بدون افزودن کد چسبان wrapper مختص تأیید bootstrap کند.
- فقط هنگامی به سراغ `createChannelApprovalHandler` یا
  `createChannelNativeApprovalRuntime` سطح‌پایین‌تر بروید که درز قابلیت‌محور
  هنوز به‌اندازه کافی گویا نیست.
- کانال‌های بومی تأیید باید هم `accountId` و هم `approvalKind` را
  از طریق آن helperها مسیریابی کنند. `accountId` سیاست تأیید چندحسابی را
  به حساب bot درست محدود نگه می‌دارد و `approvalKind` رفتار تأیید exec در برابر Plugin را
  بدون شاخه‌های hardcodeشده در هسته، در دسترس کانال نگه می‌دارد.
- هسته مالک اعلان‌های تغییر مسیر تأیید نیز هست. Pluginهای کانال نباید
  پیام‌های پیگیری «تأیید به DMها / کانال دیگری رفت» خود را از
  `createChannelNativeApprovalRuntime` ارسال کنند؛ در عوض، مسیریابی دقیق مبدأ +
  DM تأییدکننده را از طریق helperهای مشترک قابلیت تأیید ارائه کنند و اجازه دهند
  هسته پیش از ارسال هر اعلانی به گفت‌وگوی آغازکننده، تحویل‌های واقعی را تجمیع کند.
- نوع شناسه تأیید تحویل‌شده را سرتاسری حفظ کنید. clientهای بومی نباید
  مسیریابی تأیید exec در برابر Plugin را از وضعیت محلی کانال حدس بزنند یا بازنویسی کنند.
- آن `approvalKind` صریح را به `resolveApprovalOverGateway` ارسال کنید. این کار از
  سرویس کانونی `approval.resolve` استفاده می‌کند و هنگامی که سطح دیگری نخست پاسخ می‌دهد،
  برنده ثبت‌شده را برمی‌گرداند. ورودی صریح قدیمی‌تر `resolveMethod`
  برای کنترل‌های مبتنی بر فرمان باقی می‌ماند؛ کنش‌های بومی جدید نباید از آن استفاده کنند یا
  نوع را از روی یک شناسه استنتاج کنند.
- انواع مختلف تأیید می‌توانند عامدانه سطوح بومی متفاوتی ارائه کنند.
  نمونه‌های همراه فعلی: Matrix همان مسیریابی بومی DM/کانال و تجربه کاربری واکنش را
  برای تأییدهای exec و Plugin حفظ می‌کند، درحالی‌که همچنان اجازه می‌دهد
  احراز هویت بر اساس نوع تأیید متفاوت باشد؛ Slack مسیریابی بومی تأیید را
  برای هر دو نوع شناسه exec و Plugin در دسترس نگه می‌دارد.
- `createApproverRestrictedNativeApprovalAdapter` همچنان به‌عنوان یک
  wrapper سازگاری وجود دارد، اما کد جدید باید سازنده قابلیت را ترجیح دهد
  و `approvalCapability` را روی Plugin ارائه کند.

### زیرمسیرهای محدودتر runtime تأیید

برای نقطه‌های ورود پرترافیک کانال، هنگامی که فقط به یک بخش از این خانواده نیاز دارید، این زیرمسیرهای محدودتر را به barrel گسترده‌تر
`approval-runtime` ترجیح دهید:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

به همین ترتیب، هنگامی که به همه آن‌ها نیاز ندارید، `openclaw/plugin-sdk/reply-runtime`،
`openclaw/plugin-sdk/reply-dispatch-runtime`،
`openclaw/plugin-sdk/reply-reference` و
`openclaw/plugin-sdk/reply-chunking` را به سطوح چتری گسترده‌تر ترجیح دهید.

### زیرمسیرهای راه‌اندازی

- `openclaw/plugin-sdk/setup-runtime` helperهای راه‌اندازی ایمن برای runtime را پوشش می‌دهد:
  `createSetupTranslator`، آداپتورهای patch راه‌اندازی ایمن برای import
  (`createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`،
  `createSetupInputPresenceValidator`)، خروجی یادداشت جست‌وجو،
  `promptResolvedAllowFrom`، `splitSetupEntries` و سازنده‌های
  proxy تفویض‌شده راه‌اندازی.
- `openclaw/plugin-sdk/channel-setup` سازنده‌های راه‌اندازی نصب اختیاری
  و چند سازه اولیه ایمن برای راه‌اندازی را پوشش می‌دهد: `createOptionalChannelSetupSurface`،
  `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`،
  `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`،
  `setSetupChannelEnabled` و `splitSetupEntries`.
- فقط هنگامی از درز گسترده‌تر `openclaw/plugin-sdk/setup` استفاده کنید که به
  helperهای سنگین‌تر مشترک راه‌اندازی/پیکربندی مانند
  `moveSingleAccountChannelSectionToDefaultAccount(...)` نیز نیاز دارید.

اگر کانال شما فقط می‌خواهد در سطوح راه‌اندازی پیام «ابتدا این Plugin را نصب کنید» را نمایش دهد،
`createOptionalChannelSetupSurface(...)` را ترجیح دهید. آداپتور/ویزارد تولیدشده
در نوشتن پیکربندی و نهایی‌سازی fail closed می‌کند و همان پیام الزام نصب را
در اعتبارسنجی، نهایی‌سازی و متن پیوند مستندات دوباره به‌کار می‌گیرد.

اگر کانال شما از راه‌اندازی یا احراز هویت مبتنی بر env پشتیبانی می‌کند و جریان‌های عمومی راه‌اندازی/پیکربندی
باید پیش از بارگذاری runtime آن نام‌های env را بدانند، آن‌ها را در
manifest افزونه با `channelEnvVars` اعلام کنید. `envVars` در runtime کانال یا ثابت‌های محلی را
فقط برای متن نمایش‌داده‌شده به اپراتور نگه دارید.

اگر کانال شما می‌تواند پیش از شروع runtime افزونه در `status`، `channels list`، `channels status` یا
اسکن‌های SecretRef ظاهر شود، `openclaw.setupEntry` را در
`package.json` اضافه کنید. import این نقطه ورود باید در مسیرهای فرمان فقط‌خواندنی
ایمن باشد و فراداده کانال، آداپتور پیکربندی ایمن برای راه‌اندازی،
آداپتور وضعیت و فراداده مقصد secret کانال موردنیاز برای آن
خلاصه‌ها را برگرداند. clientها، listenerها یا runtimeهای انتقال را از ورودی
راه‌اندازی شروع نکنید.

مسیر import ورودی اصلی کانال را نیز محدود نگه دارید. کشف می‌تواند
ورودی و ماژول Plugin کانال را برای ثبت قابلیت‌ها ارزیابی کند، بدون اینکه
کانال را فعال کند. فایل‌هایی مانند `channel-plugin-api.ts` باید
شیء Plugin کانال را بدون importکردن ویزاردهای راه‌اندازی، clientهای انتقال،
listenerهای socket، اجراکننده‌های subprocess یا ماژول‌های شروع سرویس export کنند.
آن قطعات runtime را در ماژول‌هایی قرار دهید که از `registerFull(...)`، setterهای runtime
یا آداپتورهای قابلیت lazy بارگذاری می‌شوند.

### سایر زیرمسیرهای محدود کانال

برای سایر مسیرهای پرترافیک کانال، helperهای محدود را به سطوح قدیمی گسترده‌تر ترجیح دهید:

- `openclaw/plugin-sdk/account-core`، `openclaw/plugin-sdk/account-id`،
  `openclaw/plugin-sdk/account-resolution` و
  `openclaw/plugin-sdk/account-helpers` برای پیکربندی چندحسابی و
  fallback حساب پیش‌فرض
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/channel-inbound` برای سیم‌کشی مسیر/envelope ورودی و
  ثبت‌و‌ارسال
- `openclaw/plugin-sdk/channel-targets` برای helperهای تجزیه مقصد
- `openclaw/plugin-sdk/outbound-media` برای بارگذاری رسانه و
  `openclaw/plugin-sdk/channel-outbound` برای delegateهای هویت/ارسال خروجی
  و برنامه‌ریزی payload
- `buildThreadAwareOutboundSessionRoute(...)` از
  `openclaw/plugin-sdk/channel-core` هنگامی که یک مسیر خروجی باید یک `replyToId`/`threadId` صریح را حفظ کند یا پس از اینکه کلید پایه نشست همچنان تطبیق دارد، نشست فعلی `:thread:` را بازیابی کند.
  Pluginهای ارائه‌دهنده می‌توانند هنگامی که پلتفرم آن‌ها معنای تحویل بومی thread دارد،
  تقدم، رفتار پسوند و نرمال‌سازی شناسه thread را override کنند.
- `openclaw/plugin-sdk/thread-bindings-runtime` برای چرخه عمر اتصال thread
  و ثبت آداپتور
- `openclaw/plugin-sdk/agent-media-payload` فقط هنگامی که چیدمان قدیمی فیلد payload
  عامل/رسانه همچنان لازم است
- `openclaw/plugin-sdk/telegram-command-config` (منسوخ: هیچ Plugin همراهی
  در محیط عملیاتی از آن استفاده نمی‌کند) برای نرمال‌سازی فرمان سفارشی Telegram،
  اعتبارسنجی تکرار/تعارض و قرارداد پیکربندی فرمان با fallback پایدار؛
  برای کد Plugin جدید، مدیریت محلی پیکربندی فرمان در Plugin را ترجیح دهید

کانال‌های صرفاً احراز هویت معمولاً می‌توانند به مسیر پیش‌فرض بسنده کنند: هسته
تأییدها را مدیریت می‌کند و Plugin فقط قابلیت‌های خروجی/احراز هویت را ارائه می‌دهد. کانال‌های
بومی تأیید مانند Matrix، Slack، Telegram و انتقال‌دهنده‌های سفارشی گفت‌وگو
باید به‌جای ساخت چرخه عمر تأیید اختصاصی خود، از helperهای مشترک بومی استفاده کنند.

## سیاست اشاره ورودی

مدیریت اشاره ورودی را در دو لایه جدا نگه دارید:

- گردآوری شواهد تحت مالکیت Plugin
- ارزیابی سیاست مشترک

برای تصمیم‌های سیاست اشاره از `openclaw/plugin-sdk/channel-mention-gating` استفاده کنید.
فقط هنگامی که به barrel گسترده‌تر helper ورودی نیاز دارید، از
`openclaw/plugin-sdk/channel-inbound` استفاده کنید.

موارد مناسب برای منطق محلی Plugin:

- تشخیص پاسخ به bot
- تشخیص نقل‌قول از bot
- بررسی مشارکت در thread
- استثناهای پیام سرویس/سیستم
- cacheهای بومی پلتفرم که برای اثبات مشارکت bot لازم‌اند

موارد مناسب برای helper مشترک:

- `requireMention`
- نتیجه اشاره صریح
- فهرست مجاز اشاره ضمنی
- دورزدن فرمان
- تصمیم نهایی صرف‌نظرکردن

جریان ترجیحی:

1. واقعیت‌های محلی اشاره را محاسبه کنید.
2. آن واقعیت‌ها را به `resolveInboundMentionDecision({ facts, policy })` ارسال کنید.
3. از `decision.effectiveWasMentioned`، `decision.shouldBypassMention` و
   `decision.shouldSkip` در دروازه ورودی خود استفاده کنید.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
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

`matchesMentionWithExplicit(...)` یک مقدار boolean برمی‌گرداند. `hasAnyMention`،
`isExplicitlyMentioned` و `canResolveExplicit` از فراداده بومی اشاره خود کانال
(موجودیت‌های پیام، پرچم‌های پاسخ به bot و موارد مشابه) می‌آیند؛
هنگامی که پلتفرم شما نمی‌تواند آن‌ها را تشخیص دهد، مقادیر `false`/`undefined` را ارائه کنید.

`api.runtime.channel.mentions` همان helperهای مشترک اشاره را برای
Pluginهای همراه کانال که از قبل به تزریق runtime وابسته‌اند ارائه می‌کند:
`buildMentionRegexes`، `matchesMentionPatterns`، `matchesMentionWithExplicit`،
`implicitMentionKindWhen`، `resolveInboundMentionDecision`.

اگر فقط به `implicitMentionKindWhen` و `resolveInboundMentionDecision` نیاز دارید،
از `openclaw/plugin-sdk/channel-mention-gating` import کنید تا از بارگذاری
helperهای نامرتبط runtime ورودی جلوگیری شود.

## راهنمای گام‌به‌گام

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="بسته و مانیفست">
    فایل‌های استاندارد Plugin را ایجاد کنید. فیلد `channels` در
    `openclaw.plugin.json` (نه فیلد `kind`) مشخص می‌کند که یک مانیفست
    مالک یک کانال است. برای مشاهده همه فراداده‌های بسته، به
    [راه‌اندازی و پیکربندی Plugin](/fa/plugins/sdk-setup#openclaw-channel) مراجعه کنید:

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
          "label": "گفت‌وگوی Acme",
          "blurb": "OpenClaw را به گفت‌وگوی Acme متصل کنید."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "گفت‌وگوی Acme",
      "description": "Plugin کانال گفت‌وگوی Acme",
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
              "label": "توکن ربات",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` مقدار `plugins.entries.acme-chat.config` را اعتبارسنجی می‌کند. از آن برای
    تنظیمات متعلق به Plugin که جزو پیکربندی حساب کانال نیستند استفاده کنید.
    `channelConfigs.acme-chat.schema` مقدار `channels.acme-chat` را اعتبارسنجی می‌کند و
    منبع مسیر سردی است که سطوح طرح‌واره پیکربندی، راه‌اندازی و رابط کاربری پیش از
    بارگذاری زمان اجرای Plugin از آن استفاده می‌کنند. برای مرجع کامل فیلدهای
    سطح بالا، به [مانیفست Plugin](/fa/plugins/manifest) مراجعه کنید.

  </Step>

  <Step title="ساخت شیء Plugin کانال">
    رابط `ChannelPlugin` سطوح آداپتور اختیاری بسیاری دارد. با حداقل موارد،
    یعنی `id`، `config` و `setup`، شروع کنید و آداپتورها را در صورت نیاز
    بیفزایید.

    `src/channel.ts` را ایجاد کنید:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // کلاینت API پلتفرم شما

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
      if (!token) throw new Error("acme-chat: توکن الزامی است");
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
        // تفکیک/بازرسی حساب در `config` قرار می‌گیرد، نه در `setup`.
        // `setup` نوشتن داده‌های پذیرش اولیه (applyAccountConfig، validateInput) را پوشش می‌دهد.
        config: {
          listAccountIds: () => ["default"],
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
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // امنیت پیام مستقیم: چه کسانی می‌توانند به ربات پیام دهند
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // جفت‌سازی: جریان تأیید برای مخاطبان جدید پیام مستقیم
      pairing: {
        text: {
          idLabel: "نام کاربری گفت‌وگوی Acme",
          message: "برای تأیید هویت خود، این کد را ارسال کنید:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `کد جفت‌سازی: ${code}`);
          },
        },
      },

      // رشته‌بندی: پاسخ‌ها چگونه تحویل داده می‌شوند
      threading: { topLevelReplyToMode: "reply" },

      // خروجی: ارسال پیام‌ها به پلتفرم
      outbound: {
        attachedResults: {
          channel: "acme-chat",
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

    برای کانال‌هایی که هم کلیدهای متعارف پیام مستقیم در سطح بالا و هم کلیدهای تودرتوی قدیمی را می‌پذیرند، از راهنماهای `plugin-sdk/channel-config-helpers` استفاده کنید: `resolveChannelDmAccess`، `resolveChannelDmPolicy`، `resolveChannelDmAllowFrom` و `normalizeChannelDmPolicy` مقادیر محلی حساب را مقدم بر مقادیر ارث‌برده‌شده از ریشه نگه می‌دارند. همان تفکیک‌گر را از طریق `normalizeLegacyDmAliases` با تعمیر doctor همراه کنید تا زمان اجرا و مهاجرت قرارداد یکسانی را بخوانند.

    <Accordion title="createChatChannelPlugin چه کارهایی برای شما انجام می‌دهد">
      به‌جای پیاده‌سازی دستی رابط‌های آداپتور سطح پایین، گزینه‌های اعلانی را
      ارسال می‌کنید و سازنده آن‌ها را با هم ترکیب می‌کند:

      | گزینه | آنچه متصل می‌کند |
      | --- | --- |
      | `security.dm` | تفکیک‌گر امنیت پیام مستقیم با دامنه محدود از فیلدهای پیکربندی |
      | `pairing.text` | جریان جفت‌سازی پیام مستقیم مبتنی بر متن با تبادل کد |
      | `threading` | تفکیک‌گر حالت پاسخ‌به (ثابت، محدود به حساب یا سفارشی) |
      | `outbound.attachedResults` | توابع ارسالی که فراداده نتیجه (شناسه‌های پیام) را برمی‌گردانند؛ به شناسه هم‌تراز `channel` نیاز دارد تا هسته بتواند نتیجه تحویل بازگشتی را مهر بزند |

      اگر به کنترل کامل نیاز دارید، می‌توانید به‌جای گزینه‌های اعلانی، اشیای
      خام آداپتور را نیز ارسال کنید.

      آداپتورهای خروجی خام می‌توانند تابع `chunker(text, limit, ctx)` را تعریف کنند.
      `ctx.formatting` اختیاری تصمیم‌های قالب‌بندی هنگام تحویل،
      مانند `maxLinesPerMessage`، را حمل می‌کند؛ آن را پیش از ارسال اعمال کنید تا
      رشته‌بندی پاسخ و مرزهای قطعه‌بندی فقط یک‌بار به‌وسیله تحویل خروجی مشترک
      تفکیک شوند. زمینه‌های ارسال همچنین در صورت تفکیک یک مقصد پاسخ بومی،
      `replyToIdSource` (`implicit` یا `explicit`) را شامل می‌شوند،
      تا راهنماهای محموله بتوانند برچسب‌های صریح پاسخ را بدون مصرف یک جایگاه
      ضمنی و یک‌بارمصرف پاسخ حفظ کنند.
    </Accordion>

  </Step>

  <Step title="اتصال نقطه ورود">
    `index.ts` را ایجاد کنید:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "گفت‌وگوی Acme",
      description: "Plugin کانال گفت‌وگوی Acme",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("مدیریت گفت‌وگوی Acme");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "مدیریت گفت‌وگوی Acme",
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
    بتواند بدون فعال‌سازی کامل زمان اجرای کانال، آن‌ها را در راهنمای ریشه نمایش
    دهد؛ در عین حال، بارگذاری‌های کامل عادی نیز همان توصیف‌گرها را برای ثبت
    واقعی فرمان دریافت می‌کنند. `registerFull(...)` را برای کارهای مختص زمان اجرا
    نگه دارید. `defineChannelPluginEntry` جداسازی حالت ثبت را به‌صورت خودکار مدیریت
    می‌کند. اگر `registerFull(...)` متدهای RPC مربوط به Gateway را ثبت می‌کند، از
    پیشوند مختص Plugin استفاده کنید. فضاهای نام مدیریتی هسته
    (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`)
    رزروشده باقی می‌مانند و همیشه به `operator.admin` تفکیک می‌شوند. برای همه
    گزینه‌ها به [نقاط ورود](/fa/plugins/sdk-entrypoints#definechannelpluginentry)
    مراجعه کنید.

  </Step>

  <Step title="افزودن ورودی راه‌اندازی">
    برای بارگذاری سبک هنگام پذیرش اولیه، `setup-entry.ts` را ایجاد کنید:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    وقتی کانال غیرفعال یا پیکربندی‌نشده باشد، OpenClaw این مورد را به‌جای ورودی
    کامل بارگذاری می‌کند. این کار از وارد شدن کد سنگین زمان اجرا در جریان‌های
    راه‌اندازی جلوگیری می‌کند. برای جزئیات به
    [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup#setup-entry) مراجعه کنید.

    کانال‌های فضای کاری همراه که خروجی‌های ایمن برای راه‌اندازی را در ماژول‌های
    جانبی تفکیک می‌کنند، هنگامی که به یک تنظیم‌کننده صریح زمان اجرا در هنگام
    راه‌اندازی نیز نیاز دارند، می‌توانند از `defineBundledChannelSetupEntry(...)` در
    `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند.

  </Step>

  <Step title="مدیریت پیام‌های ورودی">
    Plugin شما باید پیام‌ها را از پلتفرم دریافت و به OpenClaw هدایت کند.
    الگوی معمول، Webhookی است که درخواست را تأیید و آن را از طریق مدیریت‌کننده
    ورودی کانال شما توزیع می‌کند:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // احراز هویت مدیریت‌شده توسط Plugin (امضاها را خودتان تأیید کنید)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // مدیریت‌کننده ورودی شما پیام را به OpenClaw توزیع می‌کند.
          // نحوه دقیق اتصال به SDK پلتفرم شما بستگی دارد -
          // یک نمونه واقعی را در بسته Plugin همراه Microsoft Teams یا Google Chat ببینید.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      مدیریت پیام ورودی مختص هر کانال است. هر Plugin کانال مالک خط لوله ورودی
      خود است. برای مشاهده الگوهای واقعی، Pluginهای کانال همراه را بررسی کنید
      (برای مثال بسته Plugin مربوط به Microsoft Teams یا Google Chat).
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="آزمایش">
آزمایش‌های هم‌مکان را در `src/channel.test.ts` بنویسید:

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
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    برای راهنماهای مشترک آزمون، به [آزمایش](/fa/plugins/sdk-testing) مراجعه کنید.

</Step>
</Steps>

## ساختار فایل

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # فراداده openclaw.channel
├── openclaw.plugin.json      # مانیفست دارای طرح‌واره پیکربندی
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # خروجی‌های عمومی (اختیاری)
├── runtime-api.ts            # خروجی‌های داخلی زمان اجرا (اختیاری)
└── src/
    ├── channel.ts            # ChannelPlugin از طریق createChatChannelPlugin
    ├── channel.test.ts       # آزمون‌ها
    ├── client.ts             # کلاینت API پلتفرم
    └── runtime.ts            # مخزن زمان اجرا (در صورت نیاز)
```

## موضوعات پیشرفته

<CardGroup cols={2}>
  <Card title="گزینه‌های رشته‌بندی" icon="git-branch" href="/fa/plugins/sdk-entrypoints#registration-mode">
    حالت‌های پاسخ ثابت، محدود به حساب، یا سفارشی
  </Card>
  <Card title="یکپارچه‌سازی ابزار پیام" icon="puzzle" href="/fa/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool و کشف کنش‌ها
  </Card>
  <Card title="تفکیک مقصد" icon="crosshair" href="/fa/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType، looksLikeId، reservedLiterals، resolveTarget
  </Card>
  <Card title="راهنماهای زمان اجرا" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، STT، رسانه و زیرعامل از طریق api.runtime
  </Card>
  <Card title="API ورودی کانال" icon="bolt" href="/fa/plugins/sdk-channel-inbound">
    چرخه عمر مشترک رویداد ورودی: دریافت، تفکیک، ثبت، توزیع و نهایی‌سازی
  </Card>
</CardGroup>

<Note>
برخی نقاط اتصال راهنمای بسته‌بندی‌شده همچنان برای نگه‌داری Plugin‌های بسته‌بندی‌شده و
سازگاری وجود دارند. این‌ها الگوی توصیه‌شده برای Plugin‌های کانال جدید نیستند؛
مگر آنکه مستقیماً در حال نگه‌داری آن خانواده Plugin بسته‌بندی‌شده باشید، مسیرهای فرعی
عمومی کانال، راه‌اندازی، پاسخ و زمان اجرا را از سطح SDK مشترک ترجیح دهید.
</Note>

## گام‌های بعدی

- [Plugin‌های ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - اگر Plugin شما مدل‌ها را نیز ارائه می‌کند
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل واردکردن مسیرهای فرعی
- [آزمایش SDK](/fa/plugins/sdk-testing) - ابزارهای آزمون و آزمون‌های قرارداد
- [مانیفست Plugin](/fa/plugins/manifest) - طرح‌واره کامل مانیفست

## مرتبط

- [راه‌اندازی SDK ‏Plugin](/fa/plugins/sdk-setup)
- [ساخت Plugin‌ها](/fa/plugins/building-plugins)
- [Plugin‌های چارچوب عامل](/fa/plugins/sdk-agent-harness)
