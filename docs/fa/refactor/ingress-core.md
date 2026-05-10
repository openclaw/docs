---
read_when:
    - بررسی اینکه چرا بازآرایی ورودی کانال کد بیش از حدی اضافه کرد
    - انتقال سیاست مسیر، دستور، رویداد، فعال‌سازی یا گروه دسترسی از Pluginهای همراه به هسته
    - بررسی اینکه آیا یک کمک‌کنندهٔ ورودی کانال واقعاً کد Plugin همراه را حذف می‌کند
sidebarTitle: Ingress core deletion
summary: برنامهٔ حذف‌محور برای انتقال کد اتصال تکراریِ ورودی کانال به هسته.
title: طرح حذف هستهٔ ورودی
x-i18n:
    generated_at: "2026-05-10T20:05:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# برنامه حذف هسته ورودی

بازطراحی ورودی تا وقتی هزاران خط خالص اضافه می‌کند سالم نیست. متمرکزسازی
هسته فقط وقتی حساب می‌شود که کد تولیدی Plugin‌های بسته‌بندی‌شده کوچک‌تر شود و
سازگاری SDK قدیمی شخص ثالث در shimهای SDK/هسته قرنطینه شود.

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

Plugin‌های بسته‌بندی‌شده نباید ورودی را دوباره به شکل‌های محلی `AccessResult`،
`GroupAccessDecision`، `CommandAuthDecision`، `DmCommandAccess`، یا
`{ allowed, reasonCode }` ترجمه کنند، مگر اینکه آن نوع API عمومی Plugin باشد.

## بودجه

در مقایسه با merge-base این PR با `origin/main`، شامل فایل‌های untracked.

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

حذف صرفا کامنتی به‌عنوان پاک‌سازی حساب نمی‌شود. عبور بودجه قبلی بیش از حد
سخاوتمندانه بود، چون کامنت‌های توضیحی بازگردانده‌شده QQBot را شامل می‌شد؛ این
سند فقط جابه‌جایی کد اجرایی/مستندات/تست را دنبال می‌کند.

پس از هر موج پاک‌سازی دوباره اندازه‌گیری کنید:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## تشخیص

گذر اول کرنل مشترک ورودی را اضافه کرد، سپس مقدار زیادی authorization محلی Plugin
را کنار آن باقی گذاشت:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

این مدل را تکرار می‌کند. کد تولیدی هسته حدود 3,376 خط رشد کرد، در حالی که کد
تولیدی Plugin‌های بسته‌بندی‌شده 1,240 خط کوچک‌تر شده است. این از گذر اول بهتر
است، اما داخل حداقل بودجه نیست. راه‌حل همچنان حذف‌محور است:

- حذف DTOهای Plugin که فقط نام فیلدهای ورودی را عوض می‌کنند
- حذف تست‌هایی که فقط شکل wrapper را assert می‌کنند
- افزودن helperهای هسته فقط وقتی همان patch کد Plugin بسته‌بندی‌شده را حذف کند
- نگه‌داشتن سازگاری SDK قدیمی فقط در shimهای SDK/هسته
- بازبسته‌بندی هسته پس از اینکه حذف wrapper شکل پایدار را آشکار کرد

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

این شاخه هنوز داخل حداقل بودجه نیست. کار باقی‌مانده مرتبط با review باید پیش
از افزودن یک انتزاع دیگر در هسته، جریان authorization تکراری، scaffolding نوبت،
یا تست‌های wrapper را حذف کند.

## خوانش کد فعلی

مرز سالم هسته از قبل در `src/channels/message-access/runtime.ts` وجود دارد:
این بخش مالک adapterهای هویت، allowlistهای مؤثر، خواندن pairing-store، توصیفگرهای
route، presetهای command/event، گروه‌های access، و projection نهایی
`ResolvedChannelMessageIngress` حل‌شده است.

رشد باقی‌مانده عمدتا glue مربوط به Plugin است که روی این مرز لایه شده است:

- `extensions/telegram/src/ingress.ts` تصمیم‌های هسته را در helperهای
  command/event مختص Telegram می‌پیچد، سپس call siteها همچنان allowlistهای
  normalized و فهرست‌های owner از پیش محاسبه‌شده را پاس می‌دهند.
- `extensions/discord/src/monitor/dm-command-auth.ts`،
  `extensions/feishu/src/policy.ts`، `extensions/googlechat/src/monitor-access.ts`،
  و `extensions/matrix/src/matrix/monitor/access-state.ts` همچنان DTOهای policy
  محلی یا نام‌های تصمیم legacy را کنار ورودی نگه می‌دارند.
- `extensions/signal/src/monitor/access-policy.ts` به‌درستی normalization هویت
  Signal و پاسخ‌های pairing را محلی نگه می‌دارد، اما هنوز یک مرز wrapper دارد
  که باید به مصرف مستقیم ورودی فروبپاشد.
- `extensions/nextcloud-talk/src/inbound.ts`، `extensions/irc/src/inbound.ts`،
  `extensions/qa-channel/src/inbound.ts`، `extensions/zalo/src/monitor.ts`، و
  `extensions/zalouser/src/monitor.ts` هنوز assembly مربوط به route/envelope/turn
  را تکرار می‌کنند که می‌تواند به helperهای turn مشترک خارج از کرنل ورودی منتقل
  شود.

نتیجه: انتقال کد بیشتر به هسته فقط وقتی مفید است که همین لایه‌های wrapper
Plugin را در همان patch حذف کند. افزودن یک انتزاع دیگر در حالی که returnهای
wrapper سر جای خود مانده‌اند، همان اشتباه را تکرار می‌کند.

## مرز

هسته مالک policy عمومی است:

- normalization و matching allowlist
- expansion و diagnostics گروه‌های access
- خواندن allowlist مربوط به DM از pairing-store
- gateهای route، sender، command، event، و activation
- نگاشت admission: dispatch، drop، skip، observe، pairing
- state، تصمیم‌ها، diagnostics، و projectionهای سازگاری SDK به‌شکل redacted
- توصیفگرهای عمومی قابل استفاده مجدد برای identity، route، command، event،
  activation، و outcomes

Plugin‌ها مالک facts و side effectهای transport هستند:

- اصالت webhook/socket/request
- استخراج هویت platform و lookupهای API
- پیش‌فرض‌های policy مختص کانال
- ارسال challenge مربوط به pairing، replyها، ackها، reactionها، typing، media،
  history، setup، doctor، status، logها، و متن قابل مشاهده برای کاربر

هسته باید channel-agnostic بماند: هیچ Discord، Slack، Telegram، Matrix، room،
guild، space، API client، یا پیش‌فرض مختص Plugin در
`src/channels/message-access`.

## قانون پذیرش

هر helper جدید هسته باید بلافاصله کد تولیدی Plugin بسته‌بندی‌شده را حذف کند.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

متوقف شوید و بازطراحی کنید اگر:

- LOC تولیدی Plugin افزایش یابد
- تست‌ها سریع‌تر از کوچک‌شدن production رشد کنند
- یک hot path بسته‌بندی‌شده DTOای برگرداند که فقط نام `ResolvedChannelMessageIngress` را عوض می‌کند
- یک helper هسته به channel id، platform object، API client، یا پیش‌فرض مختص
  کانال نیاز داشته باشد

## بسته‌های کاری

1. بودجه را منجمد کنید.
   LOC را در PR بگذارید، lint مربوط به deprecated-ingress را سبز نگه دارید، و
   LOC قبل/بعد را در commitهای پاک‌سازی وارد کنید.

2. مرزهای DTO نازک را حذف کنید.
   returnهای wrapper محلی Plugin را با `ResolvedChannelMessageIngress`،
   `senderAccess`، `commandAccess`، `routeAccess`، یا مستقیما `ingress` جایگزین
   کنید. با QQBot، Telegram، Slack، Discord، Signal، Feishu، Matrix، iMessage،
   و Tlon شروع کنید. تست‌های شکل wrapper را حذف کنید؛ تست‌های رفتار را نگه دارید.

3. classification مربوط به outcome را فقط همراه با حذف‌ها اضافه کنید.
   یک classifier عمومی می‌تواند `dispatch`، `pairing-required`،
   `skip-activation`، `drop-command`، `drop-route`، `drop-sender`، و
   `drop-ingress` را ارائه کند. باید از گراف تصمیم مشتق شود، نه از reason stringها،
   و حداقل سه Plugin را در همان patch migrate کند.

4. builderهای توصیفگر route را فقط همراه با حذف‌ها اضافه کنید.
   helperهای عمومی route target و route sender فقط وقتی قابل قبول‌اند که فورا
   Plugin‌های route-heavy را کوچک کنند: Google Chat، IRC، Microsoft Teams،
   Nextcloud Talk، Mattermost، Slack، Zalo، و Zalo Personal.

5. presetهای command/event را فقط همراه با حذف‌ها اضافه کنید.
   شکل‌های text-command، native-command، callback، و origin-subject را متمرکز
   کنید. مصرف‌کننده‌های command باید وقتی هیچ command gate اجرا نشده است به‌طور
   پیش‌فرض unauthorized باشند؛ eventها نباید pairing را شروع کنند.

6. presetهای identity را فقط جایی share کنید که boilerplate را حذف می‌کنند.
   helperهای stable-id، stable-id-plus-aliases، phone/e164، و multi-identifier
   وقتی مجازند که مقدارهای خام فقط وارد input adapter شوند و state به‌شکل
   redacted، id/countهای opaque را نگه دارد.

7. assembly مربوط به turn مجاز را share کنید.
   خارج از کرنل ورودی، scaffolding تکراری route/envelope/context/reply را از
   QA Channel، IRC، Nextcloud Talk، Zalo، و Zalo Personal حذف کنید. هسته می‌تواند
   sequencing مربوط به route/session/envelope/dispatch را مالک شود؛ Plugin‌ها
   delivery و context مختص کانال را نگه می‌دارند.

8. سازگاری را قرنطینه کنید.
   helperهای SDK deprecated سازگاری source-compatible را حفظ می‌کنند، اما hot
   pathهای بسته‌بندی‌شده نباید facadeهای ورودی یا command-auth deprecated را
   import کنند. تست‌های سازگاری باید از Plugin‌های fake شخص ثالث استفاده کنند،
   نه internals مربوط به Plugin‌های بسته‌بندی‌شده.

9. هسته را بازبسته‌بندی کنید.
   پس از اینکه Plugin‌ها projectionهای runtime را مستقیما مصرف کردند، moduleهای
   تک‌استفاده را فروبپاشید، exportهای استفاده‌نشده را حذف کنید، projection
   سازگاری را از hot pathها بیرون ببرید، و تست‌های متمرکز برای identity، route،
   command/event، activation، گروه‌های access، و shimهای سازگاری نگه دارید.

## موج‌های حذف

این‌ها را به‌ترتیب اجرا کنید. هر موج باید LOC تولیدی بسته‌بندی‌شده را کاهش دهد.

1. فروپاشی wrapper، delta مورد انتظار Plugin: -400 تا -600.
   نوع‌های result مربوط به `resolveXAccess`، `resolveXCommandAccess`، و
   `accessFromIngress` محلی Plugin را با خواندن مستقیم از
   `ResolvedChannelMessageIngress` جایگزین کنید. هدف‌های اول: Discord DM command
   auth، Feishu policy، Matrix access state، Telegram ingress، Signal access
   policy، QQBot SDK adapter.

2. helperهای outcome مشترک، delta مورد انتظار Plugin: -200 تا -350.
   یک classifier عمومی فقط وقتی اضافه کنید که ladderهای تکراری
   `shouldBlockControlCommand`، pairing، activation skip، route block، و sender
   block را در حداقل سه Plugin حذف کند.

3. builderهای توصیفگر route، delta مورد انتظار Plugin: -200 تا -350.
   assembly تکراری توصیفگرهای route target و route sender را به helperهای هسته
   منتقل کنید. هدف‌های اول: Google Chat، IRC، Microsoft Teams، Nextcloud Talk،
   Mattermost، Slack، Zalo، Zalo Personal.

4. share کردن assembly مربوط به turn، delta مورد انتظار Plugin: -250 تا -450.
   برای Plugin‌های inbound ساده از sequencing مشترک route/session/envelope/dispatch
   استفاده کنید. هدف‌های اول: QA Channel، IRC، Nextcloud Talk، Zalo، Zalo Personal.

5. بازبسته‌بندی هسته، delta مورد انتظار هسته: -300 تا -700.
   پس از اینکه Plugin‌ها projectionهای runtime را مستقیما مصرف کردند، moduleهای
   تک‌استفاده را حذف کنید، فایل‌های کوچک را دوباره در `runtime.ts` یا siblingهای
   متمرکز merge کنید، و فایل‌های سازگاری SDK را از hot pathهای بسته‌بندی‌شده
   جدا نگه دارید.

6. هرس تست‌ها، delta مورد انتظار تست: -300 تا -600.
   تست‌هایی را که فقط شکل‌های wrapper حذف‌شده را assert می‌کنند حذف کنید.
   تست‌های رفتاری برای command denial، group fallback، origin-subject matching،
   activation skip، access groups، pairing، و redaction را نگه دارید.

حداقل شکل مورد انتظار برای landing پس از این موج‌ها:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## منتقل نکنید

پیش‌فرض‌های پیکربندی پلتفرم، تجربه راه‌اندازی، متن doctor/fix، جست‌وجوهای API،
بررسی‌های حضور مالک Slack، مدیریت نام مستعار/تأیید Matrix، تجزیه callback در Telegram،
تجزیه نحو فرمان، ثبت فرمان native، تجزیه payload واکنش، پاسخ‌های pairing، پاسخ‌های فرمان، ackها، typing، رسانه، تاریخچه،
یا لاگ‌ها را جابه‌جا نکنید.

## تأیید

حلقه محلی هدفمند:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

وقتی روند LOC در محدوده بود، برای گیت‌های گسترده تغییرات/اثبات مجموعه کامل از Testbox استفاده کنید.

هر بسته کاری ثبت می‌کند:

- LOC قبل/بعد بر اساس دسته
- wrapperهای حذف‌شده Plugin
- LOC کمک‌کننده جدید core، در صورت وجود
- آزمون‌های هدفمندی که اجرا شده‌اند
- فهرست hotspotهای باقی‌مانده

## معیارهای خروج

- importهای تولیدی bundled از نمای deprecated channel-access یا command-auth استفاده نکنند
- کد سازگاری به seamهای SDK/core محدود شده باشد
- Pluginهای bundled مستقیماً projectionهای ingress یا outcomeهای عمومی را مصرف کنند
- LOC تولیدی Plugin دست‌کم 1,500 کاهش خالص نسبت به `origin/main` داشته باشد
- LOC تولیدی core برابر <= +1,500 باشد، یا هر مقدار اضافه جبران شده باشد در حالی که کل مقدار
  <= +2,000 باقی بماند
- آزمون‌های نماینده، رفتار redaction، route، command/event، activation،
  access-group، و fallback مخصوص کانال را پوشش دهند
