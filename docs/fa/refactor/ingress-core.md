---
read_when:
    - بررسی اینکه چرا بازآرایی ورودی کانال کد زیادی اضافه کرد
    - انتقال سیاست مسیر، فرمان، رویداد، فعال‌سازی یا گروه دسترسی از Pluginهای همراه به هسته
    - بررسی اینکه آیا یک تابع کمکی ورودی کانال واقعاً کد Plugin همراه را حذف می‌کند
sidebarTitle: Ingress core deletion
summary: طرح حذف‌محور برای انتقال کد اتصال تکراریِ ورودی کانال‌ها به هسته.
title: طرح حذف هستهٔ ورودی
x-i18n:
    generated_at: "2026-05-12T01:01:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# برنامهٔ حذف هستهٔ ورودی

بازآرایی ورودی تا وقتی هزاران خط خالص اضافه می‌کند سالم نیست. متمرکزسازی در هسته فقط زمانی حساب می‌شود که کد تولیدی Pluginهای بسته‌بندی‌شده کوچک‌تر شود و سازگاری SDK قدیمی شخص ثالث در شیم‌های SDK/هسته قرنطینه شود.

شکل مطلوب زمان اجرا:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Pluginهای بسته‌بندی‌شده نباید ورودی را دوباره به شکل‌های محلی `AccessResult`، `GroupAccessDecision`، `CommandAuthDecision`، `DmCommandAccess`، یا `{ allowed, reasonCode }` ترجمه کنند، مگر اینکه آن نوع API عمومی Plugin باشد.

## بودجه

در برابر پایهٔ ادغام PR با `origin/main`، شامل فایل‌های ردیابی‌نشده، اندازه‌گیری شده است.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

حداقل پاک‌سازی باقی‌مانده:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

حذف فقط-دیدگاه به‌عنوان پاک‌سازی حساب نمی‌شود. گذر بودجهٔ قبلی بیش از حد سخاوتمندانه بود، چون دیدگاه‌های توضیحی بازیابی‌شدهٔ QQBot را هم شامل می‌شد؛ این سند فقط جابه‌جایی کد اجرایی/مستندات/تست را ردیابی می‌کند.

پس از هر موج پاک‌سازی دوباره اندازه‌گیری کنید:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## تشخیص

گذر اول هستهٔ مشترک ورودی را اضافه کرد، سپس مقدار زیادی مجوزدهی محلی Plugin را کنار آن باقی گذاشت:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

این کار مدل را تکرار می‌کند. کد تولیدی هسته حدود ۳٬۳۷۶ خط رشد کرد، در حالی که کد تولیدی Pluginهای بسته‌بندی‌شده ۱٬۲۴۰ خط کوچک‌تر شد. این بهتر از گذر اول است، اما داخل حداقل بودجه نیست. راه‌حل همچنان حذف‌محور است:

- DTOهای Plugin را که فقط نام فیلدهای ورودی را عوض می‌کنند حذف کنید
- تست‌هایی را که فقط شکل wrapper را assert می‌کنند حذف کنید
- helperهای هسته را فقط زمانی اضافه کنید که همان patch کد Plugin بسته‌بندی‌شده را حذف کند
- سازگاری SDK قدیمی را فقط در شیم‌های SDK/هسته نگه دارید
- پس از اینکه حذف wrapper شکل پایدار را آشکار کرد، هسته را دوباره بسته‌بندی کنید

## نقاط داغ

فایل‌های تولیدی مثبت بسته‌بندی‌شده که هنوز باید کوچک شوند:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

شاخه هنوز داخل حداقل بودجه نیست. کار باقی‌ماندهٔ مرتبط با بازبینی باید پیش از افزودن انتزاع هسته‌ای دیگر، جریان مجوزدهی تکراری، scaffolding نوبت، یا تست‌های wrapper را حذف کند.

## خوانش فعلی کد

مرز سالم هسته از قبل در `src/channels/message-access/runtime.ts` وجود دارد: مالک adapterهای هویت، allowlistهای مؤثر، خواندن‌های pairing-store، توصیفگرهای route، presetهای command/event، access groupها، و projection نهایی حل‌شدهٔ `ResolvedChannelMessageIngress` است.

رشد باقی‌مانده بیشتر glue مربوط به Plugin است که روی آن مرز لایه شده است:

- `extensions/telegram/src/ingress.ts` تصمیم‌های هسته را در helperهای command/event ویژهٔ Telegram می‌پیچد، سپس محل‌های فراخوانی همچنان allowlistهای نرمال‌سازی‌شده و فهرست‌های مالک ازپیش‌محاسبه‌شده را پاس می‌دهند.
- `extensions/discord/src/monitor/dm-command-auth.ts`،
  `extensions/feishu/src/policy.ts`، `extensions/googlechat/src/monitor-access.ts`،
  و `extensions/matrix/src/matrix/monitor/access-state.ts` همچنان DTOهای policy محلی یا نام‌های تصمیم legacy را کنار ورودی نگه می‌دارند.
- `extensions/signal/src/monitor/access-policy.ts` به‌درستی نرمال‌سازی هویت Signal و پاسخ‌های pairing را محلی نگه می‌دارد، اما هنوز یک مرز wrapper دارد که باید به مصرف مستقیم ورودی فروبریزد.
- `extensions/nextcloud-talk/src/inbound.ts`، `extensions/irc/src/inbound.ts`،
  `extensions/qa-channel/src/inbound.ts`، `extensions/zalo/src/monitor.ts`، و
  `extensions/zalouser/src/monitor.ts` همچنان assembly مربوط به route/envelope/turn را تکرار می‌کنند که می‌تواند به helperهای مشترک turn خارج از هستهٔ ورودی منتقل شود.

نتیجه: انتقال کد بیشتر به هسته فقط زمانی مفید است که در همان patch این لایه‌های wrapper مربوط به Plugin را حذف کند. افزودن انتزاعی دیگر در حالی که خروجی‌های wrapper باقی مانده‌اند همان اشتباه را تکرار می‌کند.

## مرز

هسته مالک policy عمومی است:

- نرمال‌سازی و تطبیق allowlist
- گسترش access-group و diagnostics
- خواندن allowlist پیام مستقیم از pairing-store
- gateهای route، sender، command، event، و activation
- نگاشت پذیرش: dispatch، drop، skip، observe، pairing
- state، تصمیم‌ها، diagnostics، و projectionهای سازگاری SDK به‌شکل redactشده
- توصیفگرهای عمومی قابل استفادهٔ دوباره برای identity، route، command، event، activation، و outcomes

Pluginها مالک واقعیت‌های transport و side effectها هستند:

- اصالت webhook/socket/request
- استخراج هویت platform و lookupهای API
- پیش‌فرض‌های policy ویژهٔ channel
- تحویل challenge مربوط به pairing، پاسخ‌ها، ackها، reactionها، typing، media، history،
  setup، doctor، status، logs، و متن کاربرمحور

هسته باید مستقل از channel بماند: هیچ Discord، Slack، Telegram، Matrix، room،
guild، space، API client، یا پیش‌فرض ویژهٔ Plugin در
`src/channels/message-access` نباشد.

## قانون پذیرش

هر helper جدید هسته باید بلافاصله کد تولیدی Plugin بسته‌بندی‌شده را حذف کند.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

در این موارد متوقف شوید و بازطراحی کنید:

- LOC تولیدی Plugin افزایش یابد
- تست‌ها سریع‌تر از کوچک‌شدن تولید رشد کنند
- یک مسیر داغ بسته‌بندی‌شده DTOای برگرداند که فقط نام `ResolvedChannelMessageIngress` را عوض می‌کند
- یک helper هسته به channel id، شیء platform، API client، یا پیش‌فرض ویژهٔ channel نیاز داشته باشد

## بسته‌های کاری

1. بودجه را منجمد کنید.
   LOC را در PR بگذارید، lint ورودی منسوخ را سبز نگه دارید، و LOC قبل/بعد را در commitهای پاک‌سازی بیاورید.

2. مرزهای نازک DTO را حذف کنید.
   خروجی‌های wrapper محلی Plugin را با `ResolvedChannelMessageIngress`،
   `senderAccess`، `commandAccess`، `routeAccess`، یا مستقیماً `ingress` جایگزین کنید. با QQBot، Telegram، Slack، Discord، Signal، Feishu، Matrix، iMessage، و
   Tlon شروع کنید. تست‌های شکل wrapper را حذف کنید؛ تست‌های رفتاری را نگه دارید.

3. طبقه‌بندی outcome را فقط همراه با حذف‌ها اضافه کنید.
   یک classifier عمومی می‌تواند `dispatch`، `pairing-required`،
   `skip-activation`، `drop-command`، `drop-route`، `drop-sender`، و
   `drop-ingress` را expose کند. باید از گراف تصمیم مشتق شود، نه از رشته‌های reason، و در همان patch دست‌کم سه Plugin را migrate کند.

4. سازنده‌های توصیفگر route را فقط همراه با حذف‌ها اضافه کنید.
   helperهای عمومی route target و route sender فقط زمانی پذیرفتنی هستند که بلافاصله Pluginهای route-heavy را کوچک کنند: Google Chat، IRC، Microsoft Teams،
   Nextcloud Talk، Mattermost، Slack، Zalo، و Zalo Personal.

5. presetهای command/event را فقط همراه با حذف‌ها اضافه کنید.
   شکل‌های text-command، native-command، callback، و origin-subject را متمرکز کنید.
   مصرف‌کننده‌های command وقتی هیچ command gate اجرا نشده است باید به‌طور پیش‌فرض unauthorized باشند؛ eventها نباید pairing را شروع کنند.

6. presetهای identity را فقط جایی share کنید که boilerplate را حذف می‌کنند.
   helperهای stable-id، stable-id-plus-aliases، phone/e164، و multi-identifier زمانی مجازند که مقدارهای خام فقط وارد adapter input شوند و state redactشده id/count مات را نگه دارد.

7. assembly نوبت مجاز را share کنید.
   خارج از هستهٔ ورودی، scaffolding تکراری route/envelope/context/reply را از QA Channel، IRC، Nextcloud Talk، Zalo، و Zalo Personal حذف کنید.
   هسته می‌تواند sequencing مربوط به route/session/envelope/dispatch را مالک شود؛ Pluginها delivery و context ویژهٔ channel را نگه می‌دارند.

8. سازگاری را قرنطینه کنید.
   helperهای منسوخ SDK سازگاری source-compatible را حفظ می‌کنند، اما مسیرهای داغ بسته‌بندی‌شده نباید facadeهای منسوخ ingress یا command-auth را import کنند. تست‌های سازگاری باید از Pluginهای جعلی شخص ثالث استفاده کنند، نه internals مربوط به Pluginهای بسته‌بندی‌شده.

9. هسته را دوباره بسته‌بندی کنید.
   پس از اینکه Pluginها projectionهای runtime را مستقیماً مصرف کردند، moduleهای تک‌کاربرده را collapse کنید، exportهای استفاده‌نشده را حذف کنید، projection سازگاری را از مسیرهای داغ بیرون ببرید، و تست‌های متمرکز را برای identity،
   route، command/event، activation، access groupها، و شیم‌های سازگاری نگه دارید.

## موج‌های حذف

این‌ها را به‌ترتیب اجرا کنید. هر موج باید LOC تولیدی بسته‌بندی‌شده را کاهش دهد.

1. فروریختن wrapper، delta مورد انتظار Plugin: ‎-۴۰۰ تا ‎-۶۰۰.
   نوع‌های نتیجهٔ `resolveXAccess`، `resolveXCommandAccess`، و
   `accessFromIngress` محلی Plugin را با خواندن مستقیم از
   `ResolvedChannelMessageIngress` جایگزین کنید. هدف‌های اول: Discord DM command auth،
   Feishu policy، Matrix access state، Telegram ingress، Signal access policy،
   QQBot SDK adapter.

2. helperهای outcome مشترک، delta مورد انتظار Plugin: ‎-۲۰۰ تا ‎-۳۵۰.
   یک classifier عمومی را فقط در صورتی اضافه کنید که ladderهای تکراری
   `shouldBlockControlCommand`، pairing، activation skip، route block، و sender
   block را در دست‌کم سه Plugin حذف کند.

3. سازنده‌های توصیفگر route، delta مورد انتظار Plugin: ‎-۲۰۰ تا ‎-۳۵۰.
   assembly تکراری توصیفگر route target و route sender را به helperهای هسته منتقل کنید. هدف‌های اول: Google Chat، IRC، Microsoft Teams، Nextcloud Talk،
   Mattermost، Slack، Zalo، Zalo Personal.

4. اشتراک assembly نوبت، delta مورد انتظار Plugin: ‎-۲۵۰ تا ‎-۴۵۰.
   از sequencing مشترک route/session/envelope/dispatch برای Pluginهای inbound ساده استفاده کنید. هدف‌های اول: QA Channel، IRC، Nextcloud Talk، Zalo، Zalo Personal.

5. بسته‌بندی دوبارهٔ هسته، delta مورد انتظار هسته: ‎-۳۰۰ تا ‎-۷۰۰.
   پس از اینکه Pluginها projectionهای runtime را مستقیماً مصرف کردند، moduleهای تک‌کاربرده را حذف کنید،
   فایل‌های کوچک را دوباره در `runtime.ts` یا siblingهای متمرکز merge کنید، و فایل‌های سازگاری SDK را از مسیرهای داغ بسته‌بندی‌شده جدا نگه دارید.

6. هرس تست، delta مورد انتظار تست: ‎-۳۰۰ تا ‎-۶۰۰.
   تست‌هایی را که فقط شکل‌های wrapper حذف‌شده را assert می‌کنند حذف کنید. تست‌های رفتاری را برای
   command denial، group fallback، تطبیق origin-subject، activation skip،
   access groupها، pairing، و redaction نگه دارید.

شکل حداقلی مورد انتظار برای فرود پس از این موج‌ها:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## منتقل نکنید

پیش‌فرض‌های پیکربندی پلتفرم، UX راه‌اندازی، متن doctor/fix، جست‌وجوهای API،
بررسی‌های حضور مالک Slack، مدیریت نام مستعار/راستی‌آزمایی Matrix، تجزیه callbackهای Telegram،
تجزیه نحو فرمان، ثبت فرمان بومی، تجزیه payload واکنش، پاسخ‌های جفت‌سازی، پاسخ‌های فرمان، ackها، تایپ کردن، رسانه، تاریخچه،
یا گزارش‌ها را جابه‌جا نکنید.

## راستی‌آزمایی

چرخه محلی هدفمند:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

پس از اینکه روند LOC در محدوده بودجه قرار گرفت، برای گیت‌های تغییر‌یافته گسترده/اثبات مجموعه کامل از Testbox استفاده کنید.

هر بسته کاری ثبت می‌کند:

- LOC قبل/بعد بر اساس دسته
- wrapperهای Plugin حذف‌شده
- LOC کمک‌گیرنده اصلی جدید، در صورت وجود
- آزمون‌های هدفمند اجراشده
- فهرست hotspotهای باقی‌مانده

## معیارهای خروج

- importهای تولیدی بسته‌شده از facadeهای channel-access یا command-auth منسوخ‌شده استفاده نمی‌کنند
- کد سازگاری به درزهای SDK/core محدود شده است
- Pluginهای بسته‌شده مستقیماً projectionهای ingress یا نتیجه‌های عمومی را مصرف می‌کنند
- LOC تولیدی Plugin نسبت به `origin/main` دست‌کم 1,500 واحد کاهش خالص دارد
- LOC تولیدی core برابر `<= +1,500` است، یا هر مازاد آن جبران شده و مجموع
  همچنان `<= +2,000` می‌ماند
- آزمون‌های نماینده رفتارهای redaction، route، command/event، activation،
  access-group و fallback ویژه کانال را پوشش می‌دهند
