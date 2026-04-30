---
read_when:
    - شما در حال ساخت یک Plugin جدید برای کانال پیام‌رسانی هستید
    - می‌خواهید OpenClaw را به یک پلتفرم پیام‌رسانی متصل کنید
    - باید سطح رابط آداپتور ChannelPlugin را درک کنید
sidebarTitle: Channel Plugins
summary: راهنمای گام‌به‌گام ساخت یک Plugin کانال پیام‌رسانی برای OpenClaw
title: ساخت Plugin‌های کانال
x-i18n:
    generated_at: "2026-04-30T09:40:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

این راهنما مراحل ساخت یک Plugin کانال را توضیح می‌دهد که OpenClaw را به یک
پلتفرم پیام‌رسان متصل می‌کند. در پایان، یک کانال عملیاتی با امنیت پیام مستقیم،
جفت‌سازی، رشته‌بندی پاسخ‌ها و پیام‌رسانی خروجی خواهید داشت.

<Info>
  اگر پیش از این هیچ Pluginی برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و تنظیم manifest بخوانید.
</Info>

## Pluginهای کانال چگونه کار می‌کنند

Pluginهای کانال به ابزارهای اختصاصی ارسال/ویرایش/واکنش نیاز ندارند. OpenClaw یک
ابزار مشترک `message` را در هسته نگه می‌دارد. Plugin شما مالک این موارد است:

- **پیکربندی** — تشخیص حساب و راه‌انداز تنظیمات
- **امنیت** — سیاست پیام مستقیم و allowlistها
- **جفت‌سازی** — جریان تأیید پیام مستقیم
- **دستور زبان نشست** — اینکه شناسه‌های گفت‌وگوی اختصاصی ارائه‌دهنده چگونه به چت‌های پایه، شناسه‌های thread و fallbackهای والد نگاشت می‌شوند
- **خروجی** — ارسال متن، رسانه و نظرسنجی‌ها به پلتفرم
- **رشته‌بندی** — اینکه پاسخ‌ها چگونه در thread قرار می‌گیرند
- **تایپ Heartbeat** — سیگنال‌های اختیاری تایپ/مشغول برای مقصدهای تحویل Heartbeat

هسته مالک ابزار پیام مشترک، سیم‌کشی prompt، شکل بیرونی کلید نشست،
حسابداری عمومی `:thread:` و dispatch است.

اگر کانال شما خارج از پاسخ‌های ورودی از نشانگرهای تایپ پشتیبانی می‌کند،
`heartbeat.sendTyping(...)` را روی Plugin کانال ارائه کنید. هسته آن را با
مقصد تحویل Heartbeat حل‌شده، پیش از شروع اجرای مدل Heartbeat فراخوانی می‌کند و
از چرخه عمر مشترک keepalive/cleanup تایپ استفاده می‌کند. وقتی پلتفرم به سیگنال
توقف صریح نیاز دارد، `heartbeat.clearTyping(...)` را اضافه کنید.

اگر کانال شما پارامترهای ابزار پیام اضافه می‌کند که منبع‌های رسانه را حمل می‌کنند، آن
نام پارامترها را از طریق `describeMessageTool(...).mediaSourceParams` ارائه کنید. هسته از
آن فهرست صریح برای نرمال‌سازی مسیر sandbox و سیاست دسترسی به رسانه خروجی
استفاده می‌کند، بنابراین Pluginها برای پارامترهای اختصاصی ارائه‌دهنده مانند
avatar، پیوست یا تصویر کاور به حالت‌های خاص در هسته مشترک نیاز ندارند.
ترجیح بدهید یک map کلیدگذاری‌شده با action برگردانید، مانند
`{ "set-profile": ["avatarUrl", "avatarPath"] }` تا actionهای نامرتبط
آرگومان‌های رسانه action دیگر را به ارث نبرند. یک آرایه تخت همچنان برای پارامترهایی
که عمداً میان همه actionهای ارائه‌شده مشترک هستند کار می‌کند.

اگر پلتفرم شما scope اضافی را داخل شناسه‌های گفت‌وگو ذخیره می‌کند، آن parsing را
با `messaging.resolveSessionConversation(...)` در Plugin نگه دارید. این hook
canonical برای نگاشت `rawId` به شناسه گفت‌وگوی پایه، شناسه thread اختیاری،
`baseConversationId` صریح و هر `parentConversationCandidates` است.
وقتی `parentConversationCandidates` برمی‌گردانید، آن‌ها را از محدودترین والد
تا گسترده‌ترین/گفت‌وگوی پایه مرتب نگه دارید.

وقتی کد Plugin نیاز دارد فیلدهای شبیه route را نرمال کند، thread فرزند را با route والدش
مقایسه کند، یا از `{ channel, to, accountId, threadId }` یک کلید dedupe پایدار بسازد،
از `openclaw/plugin-sdk/channel-route` استفاده کنید. این helper شناسه‌های عددی thread را
همان‌طور نرمال می‌کند که هسته انجام می‌دهد، بنابراین Pluginها باید آن را به مقایسه‌های
ad hoc مانند `String(threadId)` ترجیح بدهند.
Pluginهایی با دستور زبان مقصد اختصاصی ارائه‌دهنده می‌توانند parser خود را به
`resolveChannelRouteTargetWithParser(...)` تزریق کنند و همچنان همان شکل مقصد route
و معناشناسی fallback مربوط به thread را که هسته استفاده می‌کند دریافت کنند.

Pluginهای bundle‌شده‌ای که پیش از boot شدن registry کانال به همان parsing نیاز دارند
می‌توانند یک فایل سطح بالای `session-key-api.ts` نیز با export مطابق
`resolveSessionConversation(...)` ارائه کنند. هسته فقط وقتی registry Plugin در زمان اجرا
هنوز در دسترس نیست از این سطح bootstrap-safe استفاده می‌کند.

`messaging.resolveParentConversationCandidates(...)` همچنان به‌عنوان fallback سازگاری
قدیمی در دسترس است، وقتی یک Plugin فقط به fallbackهای والد روی شناسه عمومی/raw نیاز دارد.
اگر هر دو hook وجود داشته باشند، هسته ابتدا از
`resolveSessionConversation(...).parentConversationCandidates` استفاده می‌کند و فقط
وقتی hook canonical آن‌ها را حذف کرده باشد به `resolveParentConversationCandidates(...)`
fallback می‌کند.

## تأییدها و قابلیت‌های کانال

بیشتر Pluginهای کانال به کد اختصاصی تأیید نیاز ندارند.

- هسته مالک `/approve` در همان چت، payloadهای مشترک دکمه تأیید و تحویل fallback عمومی است.
- وقتی کانال به رفتار اختصاصی تأیید نیاز دارد، یک شیء `approvalCapability` روی Plugin کانال را ترجیح بدهید.
- `ChannelPlugin.approvals` حذف شده است. facts مربوط به تحویل/native/render/auth تأیید را روی `approvalCapability` قرار دهید.
- `plugin.auth` فقط برای ورود/خروج است؛ هسته دیگر hookهای auth تأیید را از آن شیء نمی‌خواند.
- `approvalCapability.authorizeActorAction` و `approvalCapability.getActionAvailabilityState` seamهای canonical برای auth تأیید هستند.
- برای availability مربوط به auth تأیید در همان چت از `approvalCapability.getActionAvailabilityState` استفاده کنید.
- اگر کانال شما تأییدهای native exec ارائه می‌کند، وقتی state سطح آغازکننده/native-client با auth تأیید همان چت تفاوت دارد، از `approvalCapability.getExecInitiatingSurfaceState` برای آن استفاده کنید. هسته از این hook اختصاصی exec برای تمایز `enabled` در برابر `disabled`، تصمیم‌گیری درباره اینکه آیا کانال آغازکننده از تأییدهای native exec پشتیبانی می‌کند یا نه، و گنجاندن کانال در راهنمای fallback مربوط به native-client استفاده می‌کند. `createApproverRestrictedNativeApprovalCapability(...)` این بخش را برای حالت رایج تکمیل می‌کند.
- برای رفتار چرخه عمر payload اختصاصی کانال، مانند پنهان‌کردن promptهای تأیید محلی تکراری یا ارسال نشانگرهای تایپ پیش از تحویل، از `outbound.shouldSuppressLocalPayloadPrompt` یا `outbound.beforeDeliverPayload` استفاده کنید.
- از `approvalCapability.delivery` فقط برای routing تأیید native یا سرکوب fallback استفاده کنید.
- برای facts تأیید native که مالکشان کانال است از `approvalCapability.nativeRuntime` استفاده کنید. آن را روی entrypointهای داغ کانال با `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy نگه دارید؛ این adapter می‌تواند ماژول runtime شما را در صورت نیاز import کند و در عین حال اجازه دهد هسته چرخه عمر تأیید را assemble کند.
- فقط وقتی یک کانال واقعاً به payloadهای تأیید سفارشی به‌جای renderer مشترک نیاز دارد، از `approvalCapability.render` استفاده کنید.
- وقتی کانال می‌خواهد پاسخ مسیر disabled دقیقاً توضیح دهد کدام knobهای پیکربندی برای فعال‌سازی تأییدهای native exec لازم‌اند، از `approvalCapability.describeExecApprovalSetup` استفاده کنید. این hook مقدار `{ channel, channelLabel, accountId }` را دریافت می‌کند؛ کانال‌های دارای حساب نام‌گذاری‌شده باید pathهای scope‌شده به حساب مانند `channels.<channel>.accounts.<id>.execApprovals.*` را به‌جای defaultهای سطح بالا render کنند.
- اگر کانالی می‌تواند هویت‌های پایدار شبیه مالک برای پیام مستقیم را از پیکربندی موجود استنباط کند، برای محدودکردن `/approve` در همان چت بدون افزودن منطق اختصاصی تأیید به هسته، از `createResolvedApproverActionAuthAdapter` از `openclaw/plugin-sdk/approval-runtime` استفاده کنید.
- اگر کانالی به تحویل تأیید native نیاز دارد، کد کانال را روی نرمال‌سازی مقصد به‌علاوه facts مربوط به transport/presentation متمرکز نگه دارید. از `createChannelExecApprovalProfile`، `createChannelNativeOriginTargetResolver`، `createChannelApproverDmTargetResolver` و `createApproverRestrictedNativeApprovalCapability` از `openclaw/plugin-sdk/approval-runtime` استفاده کنید. facts اختصاصی کانال را پشت `approvalCapability.nativeRuntime` قرار دهید، در حالت ایده‌آل از طریق `createChannelApprovalNativeRuntimeAdapter(...)` یا `createLazyChannelApprovalNativeRuntimeAdapter(...)`، تا هسته بتواند handler را assemble کند و مالک فیلتر کردن request، routing، dedupe، expiry، subscription به Gateway و اعلان‌های routed-elsewhere باشد. `nativeRuntime` به چند seam کوچک‌تر تقسیم شده است:
- `createChannelNativeOriginTargetResolver` به‌طور پیش‌فرض برای مقصدهای `{ to, accountId, threadId }` از matcher مشترک channel-route استفاده می‌کند. فقط وقتی کانال قواعد هم‌ارزی اختصاصی ارائه‌دهنده دارد، مانند matching پیشوند timestamp در Slack، `targetsMatch` را pass کنید.
- وقتی کانال باید پیش از اجرای matcher پیش‌فرض route یا callback سفارشی `targetsMatch`، شناسه‌های ارائه‌دهنده را canonical کند و در عین حال مقصد اصلی را برای تحویل حفظ کند، `normalizeTargetForMatch` را به `createChannelNativeOriginTargetResolver` pass کنید. فقط وقتی خود مقصد تحویل حل‌شده باید canonical شود از `normalizeTarget` استفاده کنید.
- `availability` — اینکه حساب پیکربندی شده است یا نه و اینکه request باید handle شود یا نه
- `presentation` — نگاشت view model تأیید مشترک به payloadهای native در حالت pending/resolved/expired یا actionهای نهایی
- `transport` — آماده‌سازی مقصدها به‌علاوه ارسال/به‌روزرسانی/حذف پیام‌های تأیید native
- `interactions` — hookهای اختیاری bind/unbind/clear-action برای دکمه‌ها یا واکنش‌های native
- `observe` — hookهای اختیاری diagnostics تحویل
- اگر کانال به اشیای مالک runtime مانند client، token، Bolt app یا webhook receiver نیاز دارد، آن‌ها را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید. registry عمومی runtime-context به هسته اجازه می‌دهد handlerهای capability-driven را از state شروع به کار کانال bootstrap کند، بدون افزودن glue wrapper اختصاصی تأیید.
- فقط وقتی seam capability-driven هنوز به‌اندازه کافی بیانگر نیست، سراغ `createChannelApprovalHandler` یا `createChannelNativeApprovalRuntime` سطح پایین‌تر بروید.
- کانال‌های تأیید native باید هم `accountId` و هم `approvalKind` را از طریق آن helperها route کنند. `accountId` سیاست تأیید چندحسابی را به حساب bot درست scope می‌کند، و `approvalKind` رفتار تأیید exec در برابر Plugin را بدون branchهای hardcoded در هسته برای کانال در دسترس نگه می‌دارد.
- هسته اکنون مالک اعلان‌های reroute تأیید نیز هست. Pluginهای کانال نباید پیام‌های follow-up اختصاصی خودشان مانند «تأیید به پیام‌های مستقیم / کانال دیگری رفت» را از `createChannelNativeApprovalRuntime` ارسال کنند؛ در عوض، routing دقیق origin و approver-DM را از طریق helperهای قابلیت تأیید مشترک ارائه کنند و اجازه دهند هسته پیش از ارسال هر اعلان به چت آغازکننده، تحویل‌های واقعی را aggregate کند.
- نوع شناسه تأیید تحویل‌شده را از ابتدا تا انتها حفظ کنید. clientهای native نباید
  routing تأیید exec در برابر Plugin را از state محلی کانال حدس بزنند یا بازنویسی کنند.
- انواع مختلف تأیید می‌توانند عمداً سطح‌های native متفاوتی ارائه کنند.
  نمونه‌های bundle‌شده فعلی:
  - Slack routing تأیید native را برای هر دو شناسه exec و Plugin در دسترس نگه می‌دارد.
  - Matrix همان routing پیام مستقیم/کانال native و تجربه واکنش را برای تأییدهای exec
    و Plugin نگه می‌دارد، در حالی که همچنان اجازه می‌دهد auth بر اساس نوع تأیید متفاوت باشد.
- `createApproverRestrictedNativeApprovalAdapter` همچنان به‌عنوان wrapper سازگاری وجود دارد، اما کد جدید باید builder قابلیت را ترجیح دهد و `approvalCapability` را روی Plugin ارائه کند.

برای entrypointهای داغ کانال، وقتی فقط به یک بخش از آن خانواده نیاز دارید،
subpathهای runtime محدودتر را ترجیح بدهید:

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
`openclaw/plugin-sdk/reply-chunking` را ترجیح بدهید.

به‌طور خاص برای setup:

- `openclaw/plugin-sdk/setup-runtime` helperهای setup ایمن برای runtime را پوشش می‌دهد:
  adapterهای patch setup ایمن برای import (`createPatchedAccountSetupAdapter`،
  `createEnvPatchedAccountSetupAdapter`،
  `createSetupInputPresenceValidator`)، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries` و builderهای delegated
  setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` seam محدود env-aware adapter
  برای `createEnvPatchedAccountSetupAdapter` است
- `openclaw/plugin-sdk/channel-setup` builderهای setup مربوط به optional-install
  به‌علاوه چند primitive ایمن برای setup را پوشش می‌دهد:
  `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`،

اگر کانال شما از setup یا auth مبتنی بر env پشتیبانی می‌کند و جریان‌های عمومی
startup/config باید پیش از load شدن runtime آن نام‌های env را بدانند، آن‌ها را در
manifest مربوط به Plugin با `channelEnvVars` declare کنید. `envVars` زمان اجرای کانال یا
ثابت‌های محلی را فقط برای متن‌های قابل مشاهده برای operator نگه دارید.

اگر کانال شما می‌تواند پیش از شروع runtime مربوط به Plugin در `status`، `channels list`، `channels status`، یا
اسکن‌های SecretRef ظاهر شود، در
`package.json` مقدار `openclaw.setupEntry` را اضافه کنید. آن entrypoint باید برای import شدن در مسیرهای فرمان فقط‌خواندنی امن باشد
و باید metadata کانال، adapter پیکربندی امن برای setup، adapter وضعیت،
و metadata هدف secret کانال را که برای آن خلاصه‌ها لازم است برگرداند. از setup entry
هیچ client، listener، یا transport runtimeای را شروع نکنید.

مسیر import ورودی اصلی کانال را نیز محدود نگه دارید. Discovery می‌تواند entry
و ماژول Plugin کانال را ارزیابی کند تا قابلیت‌ها را بدون فعال‌سازی
کانال ثبت کند. فایل‌هایی مانند `channel-plugin-api.ts` باید شیء Plugin کانال را
بدون import کردن wizardهای setup، transport clientها، socket
listenerها، subprocess launcherها، یا ماژول‌های startup سرویس export کنند. آن بخش‌های runtime
را در ماژول‌هایی قرار دهید که از `registerFull(...)`، setterهای runtime، یا adapterهای
قابلیت lazy بارگذاری می‌شوند.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, and
`splitSetupEntries`

- از seam گسترده‌تر `openclaw/plugin-sdk/setup` فقط زمانی استفاده کنید که به
  helperهای سنگین‌تر setup/config مشترک مانند
  `moveSingleAccountChannelSectionToDefaultAccount(...)` نیز نیاز دارید

اگر کانال شما فقط می‌خواهد در سطح‌های setup پیام «ابتدا این Plugin را نصب کنید» را نمایش دهد، `createOptionalChannelSetupSurface(...)` را ترجیح دهید. adapter/wizard تولیدشده روی نوشتن پیکربندی و finalization به‌صورت بسته fail می‌کند، و همان پیام نیاز به نصب را در validation، finalize، و متن لینک docs دوباره استفاده می‌کند.

برای مسیرهای داغ دیگر کانال، helperهای محدودتر را به سطح‌های legacy گسترده‌تر ترجیح دهید:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, و
  `openclaw/plugin-sdk/account-helpers` برای پیکربندی چندحسابی و
  fallback حساب پیش‌فرض
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` برای route/envelope ورودی و
  سیم‌کشی record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` برای parsing/matching هدف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` برای بارگذاری media به‌همراه
  delegateهای identity/send خروجی و برنامه‌ریزی payload
- `buildThreadAwareOutboundSessionRoute(...)` از
  `openclaw/plugin-sdk/channel-core` زمانی که یک route خروجی باید
  یک `replyToId`/`threadId` صریح را حفظ کند یا پس از آن‌که کلید session پایه همچنان match می‌شود، session فعلی `:thread:` را بازیابی کند. Pluginهای provider می‌توانند
  precedence، رفتار suffix، و normalizing شناسه thread را زمانی که پلتفرم آن‌ها
  semantics تحویل thread بومی دارد override کنند.
- `openclaw/plugin-sdk/thread-bindings-runtime` برای lifecycle مربوط به thread-binding
  و ثبت adapter
- `openclaw/plugin-sdk/agent-media-payload` فقط زمانی که layout فیلد payload
  legacy agent/media همچنان لازم است
- `openclaw/plugin-sdk/telegram-command-config` برای normalization فرمان سفارشی Telegram،
  validation تکراری/conflict، و قرارداد پیکربندی فرمان fallback-stable

کانال‌های فقط-auth معمولاً می‌توانند در مسیر پیش‌فرض متوقف شوند: core approvalها را مدیریت می‌کند و Plugin فقط قابلیت‌های outbound/auth را ارائه می‌دهد. کانال‌های approval بومی مانند Matrix، Slack، Telegram، و transportهای chat سفارشی باید به‌جای ساخت lifecycle approval اختصاصی، از helperهای بومی مشترک استفاده کنند.

## سیاست mention ورودی

مدیریت mention ورودی را در دو لایه جدا نگه دارید:

- گردآوری evidence تحت مالکیت Plugin
- ارزیابی policy مشترک

برای تصمیم‌های mention-policy از `openclaw/plugin-sdk/channel-mention-gating` استفاده کنید.
فقط زمانی از `openclaw/plugin-sdk/channel-inbound` استفاده کنید که به barrel گسترده‌تر helperهای ورودی نیاز دارید.

مناسب برای logic محلی Plugin:

- تشخیص reply-to-bot
- تشخیص quoted-bot
- بررسی‌های مشارکت در thread
- حذف پیام‌های service/system
- cacheهای بومی پلتفرم که برای اثبات مشارکت bot لازم‌اند

مناسب برای helper مشترک:

- `requireMention`
- نتیجه mention صریح
- allowlist mention ضمنی
- bypass فرمان
- تصمیم نهایی skip

جریان ترجیحی:

1. factهای mention محلی را محاسبه کنید.
2. آن factها را به `resolveInboundMentionDecision({ facts, policy })` پاس دهید.
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

`api.runtime.channel.mentions` همان helperهای mention مشترک را برای
Pluginهای کانال bundled که از قبل به injection در runtime وابسته‌اند expose می‌کند:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

اگر فقط به `implicitMentionKindWhen` و
`resolveInboundMentionDecision` نیاز دارید، از
`openclaw/plugin-sdk/channel-mention-gating` import کنید تا از بارگذاری helperهای runtime ورودی نامرتبط جلوگیری شود.

helperهای قدیمی‌تر `resolveMentionGating*` روی
`openclaw/plugin-sdk/channel-inbound` فقط به‌عنوان exportهای سازگاری باقی مانده‌اند. کد جدید
باید از `resolveInboundMentionDecision({ facts, policy })` استفاده کند.

## راهنمای گام‌به‌گام

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    فایل‌های استاندارد Plugin را بسازید. فیلد `channel` در `package.json`
    چیزی است که این را به یک Plugin کانال تبدیل می‌کند. برای سطح کامل package-metadata،
    [Plugin Setup and Config](/fa/plugins/sdk-setup#openclaw-channel) را ببینید:

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

    `configSchema` مقدار `plugins.entries.acme-chat.config` را validate می‌کند. از آن برای
    settingهای تحت مالکیت Plugin که پیکربندی حساب کانال نیستند استفاده کنید. `channelConfigs`
    مقدار `channels.acme-chat` را validate می‌کند و منبع cold-pathای است که schema پیکربندی،
    setup، و سطح‌های UI پیش از بارگذاری runtime مربوط به Plugin از آن استفاده می‌کنند.

  </Step>

  <Step title="Build the channel plugin object">
    interface مربوط به `ChannelPlugin` سطح‌های adapter اختیاری زیادی دارد. با
    حداقل‌ها شروع کنید: `id` و `setup`؛ سپس adapterها را به‌اندازه نیاز اضافه کنید.

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

    برای کانال‌هایی که هم کلیدهای canonical top-level DM و هم کلیدهای legacy nested را می‌پذیرند، از helperهای `plugin-sdk/channel-config-helpers` استفاده کنید: `resolveChannelDmAccess`، `resolveChannelDmPolicy`، `resolveChannelDmAllowFrom`، و `normalizeChannelDmPolicy` مقدارهای account-local را پیش از مقدارهای root ارث‌بری‌شده نگه می‌دارند. همان resolver را با repair مربوط به doctor از طریق `normalizeLegacyDmAliases` جفت کنید تا runtime و migration قرارداد یکسانی را بخوانند.

    <Accordion title="What createChatChannelPlugin does for you">
      به‌جای پیاده‌سازی دستی interfaceهای adapter سطح پایین، optionهای
      declarative را پاس می‌دهید و builder آن‌ها را compose می‌کند:

      | گزینه | آنچه سیم‌کشی می‌کند |
      | --- | --- |
      | `security.dm` | resolver امنیت DM scoped از فیلدهای پیکربندی |
      | `pairing.text` | جریان pairing متنی DM با تبادل کد |
      | `threading` | resolver حالت reply-to (ثابت، account-scoped، یا سفارشی) |
      | `outbound.attachedResults` | تابع‌های send که metadata نتیجه (شناسه‌های پیام) را برمی‌گردانند |

      همچنین اگر به کنترل کامل نیاز دارید، می‌توانید به‌جای optionهای declarative
      شیءهای adapter خام را پاس دهید.

      آداپتورهای خروجی خام می‌توانند یک تابع `chunker(text, limit, ctx)` تعریف کنند.
      گزینهٔ اختیاری `ctx.formatting` تصمیم‌های قالب‌بندی زمان تحویل را حمل می‌کند
      مانند `maxLinesPerMessage`؛ پیش از ارسال آن را اعمال کنید تا رشته‌بندی پاسخ
      و مرزهای قطعه‌ها فقط یک بار توسط تحویل خروجی مشترک حل شوند.
      زمینه‌های ارسال همچنین وقتی هدف پاسخ بومی حل شده باشد شامل `replyToIdSource` (`implicit` یا `explicit`)
      هستند، تا کمک‌کننده‌های payload بتوانند
      برچسب‌های پاسخ صریح را بدون مصرف کردن یک جایگاه پاسخ ضمنی یک‌بارمصرف حفظ کنند.
    </Accordion>

  </Step>

  <Step title="نقطهٔ ورود را متصل کنید">
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
    بتواند آن‌ها را بدون فعال کردن runtime کامل کانال در راهنمای ریشه نشان دهد،
    در حالی که بارگذاری‌های کامل معمول همچنان همان توصیف‌گرها را برای ثبت واقعی دستور
    دریافت می‌کنند. `registerFull(...)` را برای کارهای فقط runtime نگه دارید.
    اگر `registerFull(...)` روش‌های RPC مربوط به Gateway را ثبت می‌کند، از یک
    پیشوند ویژهٔ plugin استفاده کنید. namespaceهای مدیریتی هسته (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) رزرو شده باقی می‌مانند و همیشه
    به `operator.admin` حل می‌شوند.
    `defineChannelPluginEntry` جداسازی حالت ثبت را به‌صورت خودکار مدیریت می‌کند. برای همهٔ
    گزینه‌ها، [نقاط ورود](/fa/plugins/sdk-entrypoints#definechannelpluginentry) را ببینید.

  </Step>

  <Step title="یک ورودی راه‌اندازی اضافه کنید">
    برای بارگذاری سبک در طول onboarding، `setup-entry.ts` را ایجاد کنید:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    وقتی کانال غیرفعال یا پیکربندی‌نشده باشد، OpenClaw این را به‌جای ورودی کامل
    بارگذاری می‌کند. این کار از وارد کردن کد runtime سنگین در جریان‌های راه‌اندازی جلوگیری می‌کند.
    برای جزئیات، [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup#setup-entry) را ببینید.

    کانال‌های workspace همراه که exportهای ایمن برای راه‌اندازی را به moduleهای جانبی
    جدا می‌کنند، وقتی به یک تنظیم‌کنندهٔ صریح runtime در زمان راه‌اندازی هم نیاز دارند
    می‌توانند از `defineBundledChannelSetupEntry(...)` از
    `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند.

  </Step>

  <Step title="پیام‌های ورودی را مدیریت کنید">
    plugin شما باید پیام‌ها را از پلتفرم دریافت کند و آن‌ها را به
    OpenClaw بفرستد. الگوی معمول یک Webhook است که درخواست را اعتبارسنجی می‌کند و
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
      مدیریت پیام ورودی مخصوص کانال است. هر Plugin کانال مالک
      pipeline ورودی خودش است. برای الگوهای واقعی به Pluginهای کانال همراه
      (برای مثال بستهٔ Plugin مربوط به Microsoft Teams یا Google Chat) نگاه کنید.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="آزمایش">
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

    برای helperهای آزمون مشترک، [آزمایش](/fa/plugins/sdk-testing) را ببینید.

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
  <Card title="حل هدف" icon="crosshair" href="/fa/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="helperهای runtime" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، STT، رسانه، subagent از طریق api.runtime
  </Card>
  <Card title="هستهٔ turn کانال" icon="bolt" href="/fa/plugins/sdk-channel-turn">
    چرخهٔ عمر turn ورودی مشترک: دریافت، حل، ثبت، dispatch، نهایی‌سازی
  </Card>
</CardGroup>

<Note>
برخی seamهای helper همراه هنوز برای نگهداری Pluginهای همراه و
سازگاری وجود دارند. این‌ها الگوی پیشنهادی برای Pluginهای کانال جدید نیستند؛
مگر اینکه مستقیما همان خانوادهٔ Plugin همراه را نگهداری می‌کنید،
subpathهای عمومی channel/setup/reply/runtime را از سطح SDK مشترک ترجیح دهید.
</Note>

## گام‌های بعدی

- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) — اگر plugin شما مدل‌ها را هم فراهم می‌کند
- [مرور کلی SDK](/fa/plugins/sdk-overview) — مرجع کامل importهای subpath
- [آزمایش SDK](/fa/plugins/sdk-testing) — ابزارهای آزمون و آزمون‌های contract
- [Manifest مربوط به Plugin](/fa/plugins/manifest) — schema کامل manifest

## مرتبط

- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [Pluginهای harness عامل](/fa/plugins/sdk-agent-harness)
