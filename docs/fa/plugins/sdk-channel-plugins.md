---
read_when:
    - شما در حال ساخت یک Plugin جدید برای کانال پیام‌رسانی هستید
    - می‌خواهید OpenClaw را به یک پلتفرم پیام‌رسانی متصل کنید
    - باید سطح آداپتر ChannelPlugin را درک کنید
sidebarTitle: Channel Plugins
summary: راهنمای گام‌به‌گام ساخت یک Plugin کانال پیام‌رسانی برای OpenClaw
title: ساخت Plugin‌های کانال
x-i18n:
    generated_at: "2026-04-29T23:17:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03384057a4316b87c6088d3859d16ed4546c803f7c64639cd12be293f4841258
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

این راهنما روند ساخت یک Plugin کانال را توضیح می‌دهد که OpenClaw را به یک
پلتفرم پیام‌رسان متصل می‌کند. در پایان، یک کانال کاری با امنیت پیام خصوصی،
جفت‌سازی، رشته‌بندی پاسخ‌ها و پیام‌رسانی خروجی خواهید داشت.

<Info>
  اگر قبلاً هیچ Plugin برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و تنظیم manifest بخوانید.
</Info>

## Pluginهای کانال چگونه کار می‌کنند

Pluginهای کانال به ابزارهای ارسال/ویرایش/واکنش اختصاصی خودشان نیاز ندارند. OpenClaw یک
ابزار مشترک `message` را در هسته نگه می‌دارد. Plugin شما مالک این موارد است:

- **پیکربندی** — تشخیص حساب و جادوگر راه‌اندازی
- **امنیت** — سیاست پیام خصوصی و فهرست‌های مجاز
- **جفت‌سازی** — جریان تأیید پیام خصوصی
- **دستور زبان نشست** — اینکه شناسه‌های گفت‌وگوی مخصوص ارائه‌دهنده چگونه به گفتگوهای پایه، شناسه‌های رشته و fallbackهای والد نگاشت می‌شوند
- **خروجی** — ارسال متن، رسانه و نظرسنجی‌ها به پلتفرم
- **رشته‌بندی** — اینکه پاسخ‌ها چگونه رشته‌بندی می‌شوند
- **تایپ Heartbeat** — سیگنال‌های اختیاری تایپ/مشغول برای اهداف تحویل Heartbeat

هسته مالک ابزار پیام مشترک، سیم‌کشی prompt، شکل بیرونی کلید نشست،
ثبت‌های عمومی `:thread:` و dispatch است.

اگر کانال شما از نشانگرهای تایپ خارج از پاسخ‌های ورودی پشتیبانی می‌کند،
`heartbeat.sendTyping(...)` را روی Plugin کانال ارائه کنید. هسته آن را با
هدف تحویل Heartbeat حل‌شده، پیش از شروع اجرای مدل Heartbeat فراخوانی می‌کند و
از چرخه حیات مشترک keepalive/cleanup تایپ استفاده می‌کند. وقتی پلتفرم به سیگنال توقف صریح نیاز دارد،
`heartbeat.clearTyping(...)` را اضافه کنید.

اگر کانال شما پارامترهای ابزار پیام اضافه می‌کند که منابع رسانه را حمل می‌کنند، نام آن
پارامترها را از طریق `describeMessageTool(...).mediaSourceParams` ارائه کنید. هسته از
آن فهرست صریح برای نرمال‌سازی مسیر sandbox و سیاست دسترسی رسانه خروجی استفاده می‌کند،
بنابراین Pluginها برای پارامترهای مخصوص ارائه‌دهنده مثل آواتار، پیوست یا تصویر جلد
به حالت‌های خاص در هسته مشترک نیاز ندارند.
ترجیحاً یک نگاشت keyed بر اساس action برگردانید، مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` تا actionهای نامرتبط
آرگومان‌های رسانه action دیگر را به ارث نبرند. یک آرایه تخت همچنان برای پارامترهایی
که عمداً در همه actionهای ارائه‌شده مشترک هستند کار می‌کند.

اگر پلتفرم شما scope اضافی را داخل شناسه‌های گفت‌وگو ذخیره می‌کند، آن parsing را
با `messaging.resolveSessionConversation(...)` در Plugin نگه دارید. این همان
hook اصلی برای نگاشت `rawId` به شناسه گفت‌وگوی پایه، شناسه رشته اختیاری،
`baseConversationId` صریح و هر `parentConversationCandidates` است.
وقتی `parentConversationCandidates` را برمی‌گردانید، آن‌ها را از باریک‌ترین والد
تا گسترده‌ترین/گفت‌وگوی پایه مرتب نگه دارید.

وقتی کد Plugin نیاز دارد فیلدهای routeمانند را نرمال کند، یک رشته فرزند را با route والدش مقایسه کند، یا از
`{ channel, to, accountId, threadId }` یک کلید dedupe پایدار بسازد، از
`openclaw/plugin-sdk/channel-route` استفاده کنید. این helper شناسه‌های عددی رشته را همان‌طور
نرمال می‌کند که هسته انجام می‌دهد، بنابراین Pluginها باید آن را به مقایسه‌های موردی
`String(threadId)` ترجیح دهند.
Pluginهایی با دستور زبان هدف مخصوص ارائه‌دهنده می‌توانند parser خود را به
`resolveChannelRouteTargetWithParser(...)` تزریق کنند و همچنان همان شکل هدف route
و معنای fallback رشته‌ای را بگیرند که هسته استفاده می‌کند.

Pluginهای همراه که پیش از راه‌اندازی registry کانال به همان parsing نیاز دارند
می‌توانند یک فایل سطح بالای `session-key-api.ts` نیز با export مطابق
`resolveSessionConversation(...)` ارائه کنند. هسته از این سطح bootstrap-safe
فقط وقتی استفاده می‌کند که registry Plugin در زمان اجرا هنوز در دسترس نیست.

`messaging.resolveParentConversationCandidates(...)` همچنان به‌عنوان یک
fallback سازگاری legacy در دسترس می‌ماند، زمانی که یک Plugin فقط روی
شناسه عمومی/raw به fallbackهای والد نیاز دارد. اگر هر دو hook وجود داشته باشند، هسته ابتدا از
`resolveSessionConversation(...).parentConversationCandidates` استفاده می‌کند و فقط
وقتی hook اصلی آن‌ها را حذف کرده باشد به `resolveParentConversationCandidates(...)`
fallback می‌کند.

## تأییدها و قابلیت‌های کانال

بیشتر Pluginهای کانال به کد مخصوص تأیید نیاز ندارند.

- هسته مالک `/approve` در همان گفتگو، payloadهای دکمه تأیید مشترک و تحویل fallback عمومی است.
- وقتی کانال به رفتار مخصوص تأیید نیاز دارد، یک شیء `approvalCapability` روی Plugin کانال را ترجیح دهید.
- `ChannelPlugin.approvals` حذف شده است. واقعیت‌های تحویل/بومی/render/auth تأیید را روی `approvalCapability` بگذارید.
- `plugin.auth` فقط برای login/logout است؛ هسته دیگر hookهای auth تأیید را از آن شیء نمی‌خواند.
- `approvalCapability.authorizeActorAction` و `approvalCapability.getActionAvailabilityState` درگاه اصلی approval-auth هستند.
- برای در دسترس بودن auth تأیید در همان گفتگو از `approvalCapability.getActionAvailabilityState` استفاده کنید.
- اگر کانال شما تأییدهای native exec ارائه می‌کند، وقتی وضعیت سطح آغازکننده/native-client با auth تأیید همان گفتگو فرق دارد، از `approvalCapability.getExecInitiatingSurfaceState` برای وضعیت initiating-surface/native-client استفاده کنید. هسته از این hook مخصوص exec برای تمایز `enabled` از `disabled`، تصمیم‌گیری درباره اینکه آیا کانال آغازکننده از تأییدهای native exec پشتیبانی می‌کند یا نه، و گنجاندن کانال در راهنمای fallback native-client استفاده می‌کند. `createApproverRestrictedNativeApprovalCapability(...)` این مورد را برای حالت رایج پر می‌کند.
- برای رفتار چرخه حیات payload مخصوص کانال، مثل پنهان کردن promptهای تأیید محلی تکراری یا ارسال نشانگرهای تایپ پیش از تحویل، از `outbound.shouldSuppressLocalPayloadPrompt` یا `outbound.beforeDeliverPayload` استفاده کنید.
- از `approvalCapability.delivery` فقط برای route کردن تأیید native یا suppression fallback استفاده کنید.
- از `approvalCapability.nativeRuntime` برای واقعیت‌های native approval متعلق به کانال استفاده کنید. آن را در entrypointهای داغ کانال با `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy نگه دارید؛ این adapter می‌تواند ماژول runtime شما را هنگام نیاز import کند و همچنان اجازه دهد هسته چرخه حیات تأیید را assemble کند.
- از `approvalCapability.render` فقط وقتی استفاده کنید که یک کانال واقعاً به payloadهای تأیید سفارشی به‌جای renderer مشترک نیاز دارد.
- وقتی کانال می‌خواهد پاسخ مسیر disabled دقیقاً knobهای پیکربندی لازم برای فعال کردن تأییدهای native exec را توضیح دهد، از `approvalCapability.describeExecApprovalSetup` استفاده کنید. این hook مقدار `{ channel, channelLabel, accountId }` را دریافت می‌کند؛ کانال‌های دارای حساب نام‌گذاری‌شده باید مسیرهای account-scoped مثل `channels.<channel>.accounts.<id>.execApprovals.*` را به‌جای پیش‌فرض‌های سطح بالا render کنند.
- اگر کانالی می‌تواند هویت‌های پیام خصوصی پایدار و ownerمانند را از پیکربندی موجود استنباط کند، از `createResolvedApproverActionAuthAdapter` در `openclaw/plugin-sdk/approval-runtime` استفاده کنید تا بدون افزودن منطق مخصوص تأیید در هسته، `/approve` همان گفتگو را محدود کند.
- اگر کانالی به تحویل تأیید native نیاز دارد، کد کانال را روی نرمال‌سازی هدف به‌علاوه واقعیت‌های transport/presentation متمرکز نگه دارید. از `createChannelExecApprovalProfile`، `createChannelNativeOriginTargetResolver`، `createChannelApproverDmTargetResolver` و `createApproverRestrictedNativeApprovalCapability` از `openclaw/plugin-sdk/approval-runtime` استفاده کنید. واقعیت‌های مخصوص کانال را پشت `approvalCapability.nativeRuntime` بگذارید، ترجیحاً از طریق `createChannelApprovalNativeRuntimeAdapter(...)` یا `createLazyChannelApprovalNativeRuntimeAdapter(...)`، تا هسته بتواند handler را assemble کند و مالک فیلتر کردن request، route کردن، dedupe، expiry، subscription Gateway و اعلان‌های routed-elsewhere باشد. `nativeRuntime` به چند درگاه کوچک‌تر تقسیم شده است:
- `createChannelNativeOriginTargetResolver` به‌طور پیش‌فرض از matcher مشترک channel-route برای اهداف `{ to, accountId, threadId }` استفاده می‌کند. `targetsMatch` را فقط وقتی پاس دهید که یک کانال قواعد هم‌ارزی مخصوص ارائه‌دهنده دارد، مثل تطبیق prefix timestamp در Slack.
- وقتی کانال نیاز دارد شناسه‌های ارائه‌دهنده را پیش از اجرای matcher route پیش‌فرض یا callback سفارشی `targetsMatch` canonical کند، درحالی‌که هدف اصلی برای تحویل حفظ می‌شود، `normalizeTargetForMatch` را به `createChannelNativeOriginTargetResolver` پاس دهید. فقط وقتی از `normalizeTarget` استفاده کنید که خود هدف تحویل حل‌شده باید canonical شود.
- `availability` — اینکه حساب پیکربندی شده است یا نه و اینکه آیا یک request باید رسیدگی شود
- `presentation` — نگاشت view model تأیید مشترک به payloadهای native در حالت pending/resolved/expired یا actionهای نهایی
- `transport` — آماده‌سازی اهداف به‌علاوه ارسال/به‌روزرسانی/حذف پیام‌های تأیید native
- `interactions` — hookهای اختیاری bind/unbind/clear-action برای دکمه‌ها یا واکنش‌های native
- `observe` — hookهای اختیاری diagnostics تحویل
- اگر کانال به objectهای runtime-owned مثل client، token، Bolt app یا webhook receiver نیاز دارد، آن‌ها را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید. registry عمومی runtime-context به هسته اجازه می‌دهد handlerهای capability-driven را از وضعیت startup کانال bootstrap کند، بدون افزودن glue wrapper مخصوص تأیید.
- فقط وقتی به `createChannelApprovalHandler` یا `createChannelNativeApprovalRuntime` سطح پایین‌تر رجوع کنید که درگاه capability-driven هنوز به‌اندازه کافی گویا نیست.
- کانال‌های تأیید native باید هم `accountId` و هم `approvalKind` را از طریق آن helperها route کنند. `accountId` سیاست تأیید چندحسابی را در محدوده حساب bot درست نگه می‌دارد، و `approvalKind` رفتار تأیید exec در برابر Plugin را بدون branchهای hardcoded در هسته برای کانال در دسترس نگه می‌دارد.
- هسته اکنون مالک اعلان‌های reroute تأیید نیز هست. Pluginهای کانال نباید پیام‌های follow-up خودشان را با مضمون «تأیید به پیام‌های خصوصی / کانال دیگری رفت» از `createChannelNativeApprovalRuntime` ارسال کنند؛ در عوض، route کردن دقیق origin + approver-DM را از طریق helperهای قابلیت تأیید مشترک ارائه کنند و اجازه دهند هسته تحویل‌های واقعی را پیش از ارسال هر اعلان به گفتگوی آغازکننده aggregate کند.
- نوع شناسه تأیید تحویل‌شده را end-to-end حفظ کنید. native clientها نباید
  route کردن تأیید exec در برابر Plugin را از وضعیت محلی کانال حدس بزنند یا بازنویسی کنند.
- انواع مختلف تأیید می‌توانند عمداً سطح‌های native متفاوتی ارائه کنند.
  نمونه‌های همراه فعلی:
  - Slack route کردن تأیید native را برای هر دو شناسه exec و Plugin در دسترس نگه می‌دارد.
  - Matrix همان route کردن native DM/channel و UX واکنشی را برای تأییدهای exec
    و Plugin نگه می‌دارد، درحالی‌که همچنان اجازه می‌دهد auth بر اساس نوع تأیید متفاوت باشد.
- `createApproverRestrictedNativeApprovalAdapter` همچنان به‌عنوان wrapper سازگاری وجود دارد، اما کد جدید باید capability builder را ترجیح دهد و `approvalCapability` را روی Plugin ارائه کند.

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
`openclaw/plugin-sdk/setup-adapter-runtime`،
`openclaw/plugin-sdk/reply-runtime`،
`openclaw/plugin-sdk/reply-dispatch-runtime`،
`openclaw/plugin-sdk/reply-reference` و
`openclaw/plugin-sdk/reply-chunking` را ترجیح دهید.

به‌طور خاص برای راه‌اندازی:

- `openclaw/plugin-sdk/setup-runtime` helperهای راه‌اندازی runtime-safe را پوشش می‌دهد:
  adapterهای import-safe setup patch (`createPatchedAccountSetupAdapter`،
  `createEnvPatchedAccountSetupAdapter`،
  `createSetupInputPresenceValidator`)، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries` و builderهای
  delegated setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` درگاه باریک adapter آگاه از env
  برای `createEnvPatchedAccountSetupAdapter` است
- `openclaw/plugin-sdk/channel-setup` builderهای راه‌اندازی optional-install
  به‌علاوه چند primitive امن برای راه‌اندازی را پوشش می‌دهد:
  `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`،

اگر کانال شما از راه‌اندازی یا auth مبتنی بر env پشتیبانی می‌کند و جریان‌های عمومی startup/config
باید آن نام‌های env را پیش از بارگذاری runtime بدانند، آن‌ها را در
manifest Plugin با `channelEnvVars` اعلام کنید. `envVars` مربوط به runtime کانال یا
ثابت‌های محلی را فقط برای متن operator-facing نگه دارید.

اگر کانال شما می‌تواند پیش از شروع زمان اجرای Plugin در `status`، `channels list`، `channels status`، یا
اسکن‌های SecretRef ظاهر شود، در
`package.json` مقدار `openclaw.setupEntry` را اضافه کنید. این نقطه ورود باید برای import شدن در مسیرهای فرمان فقط‌خواندنی امن باشد
و باید فراداده کانال، آداپتور پیکربندی امن برای راه‌اندازی، آداپتور وضعیت،
و فراداده هدف secret کانال را که برای آن خلاصه‌ها لازم است برگرداند. از نقطه ورود راه‌اندازی
کلاینت‌ها، شنونده‌ها، یا زمان‌های اجرای انتقال را شروع نکنید.

مسیر import ورودی اصلی کانال را نیز محدود نگه دارید. Discovery می‌تواند
ورودی و ماژول Plugin کانال را ارزیابی کند تا قابلیت‌ها را بدون فعال کردن
کانال ثبت کند. فایل‌هایی مانند `channel-plugin-api.ts` باید شیء Plugin کانال
را بدون import کردن ویزاردهای راه‌اندازی، کلاینت‌های انتقال، شنونده‌های socket،
راه‌اندازهای subprocess، یا ماژول‌های شروع سرویس export کنند. آن بخش‌های زمان اجرا
را در ماژول‌هایی قرار دهید که از `registerFull(...)`، setterهای زمان اجرا، یا آداپتورهای lazy
قابلیت بارگذاری می‌شوند.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, و
`splitSetupEntries`

- از seam گسترده‌تر `openclaw/plugin-sdk/setup` فقط زمانی استفاده کنید که به
  helperهای سنگین‌تر و مشترک راه‌اندازی/پیکربندی نیز نیاز دارید، مانند
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

اگر کانال شما فقط می‌خواهد در سطوح راه‌اندازی پیام «ابتدا این Plugin را نصب کنید» را نمایش دهد،
`createOptionalChannelSetupSurface(...)` را ترجیح دهید. آداپتور/ویزارد تولیدشده
در نوشتن پیکربندی و نهایی‌سازی به‌صورت بسته شکست می‌خورند، و همان پیام نیاز به نصب
را در اعتبارسنجی، نهایی‌سازی، و متن لینک مستندات بازاستفاده می‌کنند.

برای دیگر مسیرهای داغ کانال، helperهای محدود را به‌جای سطوح legacy گسترده‌تر
ترجیح دهید:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` برای پیکربندی چندحسابی و
  fallback حساب پیش‌فرض
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` برای مسیر/envelope ورودی و
  سیم‌کشی ثبت‌و-dispatch
- `openclaw/plugin-sdk/messaging-targets` برای parse/match کردن هدف‌ها
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` برای بارگذاری رسانه به‌همراه delegateهای
  هویت/ارسال خروجی و برنامه‌ریزی payload
- `buildThreadAwareOutboundSessionRoute(...)` از
  `openclaw/plugin-sdk/channel-core` وقتی یک مسیر خروجی باید یک
  `replyToId`/`threadId` صریح را حفظ کند یا جلسه فعلی `:thread:` را
  پس از اینکه کلید پایه جلسه همچنان match می‌شود بازیابی کند. Pluginهای Provider می‌توانند
  تقدم، رفتار پسوند، و عادی‌سازی شناسه thread را وقتی پلتفرمشان
  معناشناسی تحویل thread بومی دارد override کنند.
- `openclaw/plugin-sdk/thread-bindings-runtime` برای چرخه عمر thread-binding
  و ثبت آداپتور
- `openclaw/plugin-sdk/agent-media-payload` فقط زمانی که چیدمان legacy فیلد
  payload عامل/رسانه همچنان لازم است
- `openclaw/plugin-sdk/telegram-command-config` برای عادی‌سازی فرمان سفارشی Telegram،
  اعتبارسنجی تکرار/تداخل، و قرارداد پیکربندی فرمان با fallback پایدار

کانال‌های فقط-auth معمولاً می‌توانند در مسیر پیش‌فرض متوقف شوند: هسته approvals را مدیریت می‌کند و Plugin فقط قابلیت‌های خروجی/auth را ارائه می‌دهد. کانال‌های approval بومی مانند Matrix، Slack، Telegram، و انتقال‌های چت سفارشی باید به‌جای ساخت چرخه عمر approval اختصاصی خودشان از helperهای بومی مشترک استفاده کنند.

## سیاست منشن ورودی

مدیریت منشن ورودی را در دو لایه جدا نگه دارید:

- گردآوری شواهد تحت مالکیت Plugin
- ارزیابی سیاست مشترک

برای تصمیم‌های سیاست منشن از `openclaw/plugin-sdk/channel-mention-gating` استفاده کنید.
از `openclaw/plugin-sdk/channel-inbound` فقط زمانی استفاده کنید که به barrel گسترده‌تر helperهای ورودی
نیاز دارید.

مناسب برای منطق محلی Plugin:

- تشخیص reply-to-bot
- تشخیص quoted-bot
- بررسی‌های مشارکت در thread
- استثناهای پیام سرویس/سیستم
- cacheهای بومی پلتفرم که برای اثبات مشارکت bot لازم هستند

مناسب برای helper مشترک:

- `requireMention`
- نتیجه منشن صریح
- allowlist منشن ضمنی
- bypass فرمان
- تصمیم نهایی skip

جریان پیشنهادی:

1. factهای منشن محلی را محاسبه کنید.
2. آن factها را به `resolveInboundMentionDecision({ facts, policy })` بدهید.
3. از `decision.effectiveWasMentioned`، `decision.shouldBypassMention`، و `decision.shouldSkip` در gate ورودی خود استفاده کنید.

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

`api.runtime.channel.mentions` همان helperهای مشترک منشن را برای
Pluginهای کانال bundled که از قبل به تزریق زمان اجرا وابسته‌اند ارائه می‌کند:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

اگر فقط به `implicitMentionKindWhen` و
`resolveInboundMentionDecision` نیاز دارید، از
`openclaw/plugin-sdk/channel-mention-gating` import کنید تا از بارگذاری helperهای نامرتبط
زمان اجرای ورودی جلوگیری شود.

helperهای قدیمی‌تر `resolveMentionGating*` همچنان روی
`openclaw/plugin-sdk/channel-inbound` فقط به‌عنوان exportهای سازگاری باقی می‌مانند. کد جدید
باید از `resolveInboundMentionDecision({ facts, policy })` استفاده کند.

## راهنما

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="بسته و manifest">
    فایل‌های استاندارد Plugin را ایجاد کنید. فیلد `channel` در `package.json`
    چیزی است که این را به یک Plugin کانال تبدیل می‌کند. برای سطح کامل package-metadata،
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
    مقدار `channels.acme-chat` را اعتبارسنجی می‌کند و منبع مسیر سردی است که پیکربندی
    schema، راه‌اندازی، و سطوح UI پیش از بارگذاری زمان اجرای Plugin از آن استفاده می‌کنند.

  </Step>

  <Step title="ساخت شیء Plugin کانال">
    رابط `ChannelPlugin` سطح‌های آداپتور اختیاری زیادی دارد. با حداقل‌ها شروع کنید
    — `id` و `setup` — و آداپتورها را هر زمان نیاز داشتید اضافه کنید.

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

    برای کانال‌هایی که هم کلیدهای canonical سطح بالای DM و هم کلیدهای nested قدیمی را می‌پذیرند، از helperهای `plugin-sdk/channel-config-helpers` استفاده کنید: `resolveChannelDmAccess`، `resolveChannelDmPolicy`، `resolveChannelDmAllowFrom`، و `normalizeChannelDmPolicy` مقدارهای محلی حساب را جلوتر از مقدارهای root ارث‌بری‌شده نگه می‌دارند. همان resolver را با تعمیر doctor از طریق `normalizeLegacyDmAliases` جفت کنید تا runtime و migration همان قرارداد را بخوانند.

    <Accordion title="createChatChannelPlugin چه کاری برای شما انجام می‌دهد">
      به‌جای پیاده‌سازی دستی رابط‌های آداپتور سطح پایین، گزینه‌های
      declarative را پاس می‌دهید و builder آن‌ها را compose می‌کند:

      | گزینه | چیزی که سیم‌کشی می‌کند |
      | --- | --- |
      | `security.dm` | resolver امنیتی DM scoped از فیلدهای پیکربندی |
      | `pairing.text` | جریان pairing متنی DM با تبادل کد |
      | `threading` | resolver حالت reply-to (ثابت، scoped به حساب، یا سفارشی) |
      | `outbound.attachedResults` | تابع‌های ارسال که فراداده نتیجه (شناسه‌های پیام) را برمی‌گردانند |

      همچنین اگر به کنترل کامل نیاز دارید، می‌توانید به‌جای گزینه‌های declarative،
      شیءهای خام آداپتور را پاس دهید.

      آداپتورهای خروجی خام می‌توانند تابع `chunker(text, limit, ctx)` را تعریف کنند.
      `ctx.formatting` اختیاری تصمیم‌های قالب‌بندی زمان تحویل
      مانند `maxLinesPerMessage` را حمل می‌کند؛ آن را پیش از ارسال اعمال کنید تا رشته‌بندی پاسخ
      و مرزهای قطعه‌ها یک‌بار توسط تحویل خروجی مشترک تعیین شوند.
      زمینه‌های ارسال همچنین وقتی یک هدف پاسخ بومی تعیین شده باشد شامل `replyToIdSource` (`implicit` یا `explicit`)
      هستند، تا کمک‌سازهای payload بتوانند برچسب‌های پاسخ صریح را بدون مصرف یک اسلات پاسخ ضمنی یک‌بارمصرف حفظ کنند.
    </Accordion>

  </Step>

  <Step title="سیم‌کشی نقطه ورود">
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
    بتواند آن‌ها را بدون فعال‌کردن runtime کامل کانال در راهنمای ریشه نشان دهد،
    در حالی که بارگذاری‌های کامل معمول همچنان همان توصیف‌گرها را برای ثبت واقعی فرمان
    دریافت می‌کنند. `registerFull(...)` را برای کارهای صرفا runtime نگه دارید.
    اگر `registerFull(...)` متدهای RPC مربوط به Gateway را ثبت می‌کند، از یک پیشوند
    ویژه Plugin استفاده کنید. فضاهای نام مدیریتی هسته (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه
    به `operator.admin` resolve می‌شوند.
    `defineChannelPluginEntry` جداسازی حالت ثبت را به‌صورت خودکار مدیریت می‌کند. برای همه
    گزینه‌ها، [نقاط ورود](/fa/plugins/sdk-entrypoints#definechannelpluginentry) را ببینید.

  </Step>

  <Step title="افزودن ورودی راه‌اندازی">
    برای بارگذاری سبک هنگام onboarding، `setup-entry.ts` را ایجاد کنید:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    وقتی کانال غیرفعال یا پیکربندی‌نشده باشد، OpenClaw این مورد را به‌جای ورودی کامل بارگذاری می‌کند.
    این کار از کشیده‌شدن کد سنگین runtime در جریان‌های راه‌اندازی جلوگیری می‌کند.
    برای جزئیات، [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup#setup-entry) را ببینید.

    کانال‌های workspace همراه که exportهای امن برای راه‌اندازی را به ماژول‌های sidecar جدا می‌کنند،
    وقتی به setter صریح runtime در زمان راه‌اندازی هم نیاز دارند، می‌توانند از
    `defineBundledChannelSetupEntry(...)` از
    `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند.

  </Step>

  <Step title="مدیریت پیام‌های ورودی">
    Plugin شما باید پیام‌ها را از پلتفرم دریافت کند و آن‌ها را به
    OpenClaw بفرستد. الگوی رایج یک Webhook است که درخواست را راستی‌آزمایی می‌کند و
    آن را از طریق handler ورودی کانال شما dispatch می‌کند:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      مدیریت پیام ورودی وابسته به کانال است. هر Plugin کانال مالک
      pipeline ورودی خودش است. برای الگوهای واقعی، به Pluginهای کانال همراه
      (برای مثال بسته Plugin مربوط به Microsoft Teams یا Google Chat) نگاه کنید.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="تست">
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

    برای کمک‌سازهای تست مشترک، [تست](/fa/plugins/sdk-testing) را ببینید.

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
  <Card title="گزینه‌های رشته‌بندی" icon="git-branch" href="/fa/plugins/sdk-entrypoints#registration-mode">
    حالت‌های پاسخ ثابت، محدود به حساب، یا سفارشی
  </Card>
  <Card title="یکپارچه‌سازی ابزار پیام" icon="puzzle" href="/fa/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool و کشف action
  </Card>
  <Card title="تعیین هدف" icon="crosshair" href="/fa/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType، looksLikeId، resolveTarget
  </Card>
  <Card title="کمک‌سازهای Runtime" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، STT، رسانه، subagent از طریق api.runtime
  </Card>
</CardGroup>

<Note>
برخی seamهای کمک‌ساز همراه هنوز برای نگهداری Pluginهای همراه و
سازگاری وجود دارند. این‌ها الگوی توصیه‌شده برای Pluginهای کانال جدید نیستند؛
مگر اینکه مستقیما همان خانواده Plugin همراه را نگهداری می‌کنید، مسیرهای فرعی generic کانال/راه‌اندازی/پاسخ/runtime را از سطح مشترک SDK
ترجیح دهید.
</Note>

## مراحل بعدی

- [Pluginهای Provider](/fa/plugins/sdk-provider-plugins) — اگر Plugin شما مدل‌ها را هم فراهم می‌کند
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع کامل import مسیرهای فرعی
- [تست SDK](/fa/plugins/sdk-testing) — ابزارهای تست و تست‌های contract
- [Manifest مربوط به Plugin](/fa/plugins/manifest) — schema کامل manifest

## مرتبط

- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [Pluginهای harness عامل](/fa/plugins/sdk-agent-harness)
