---
read_when:
    - شما در حال اشکال‌زدایی نصب بسته‌های Plugin هستید
    - شما در حال تغییر رفتار راه‌اندازی Plugin، doctor یا نصب package-manager هستید
    - شما نصب‌های بسته‌بندی‌شده OpenClaw یا مانیفست‌های پلاگین همراه را نگهداری می‌کنید
sidebarTitle: Dependencies
summary: OpenClaw چگونه بسته‌های Plugin را نصب می‌کند و وابستگی‌های Plugin را resolve می‌کند
title: حل وابستگی‌های Plugin
x-i18n:
    generated_at: "2026-07-04T15:27:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw کار وابستگی‌های Plugin را در زمان نصب/به‌روزرسانی نگه می‌دارد. بارگذاری زمان اجرا
package managerها را اجرا نمی‌کند، درخت‌های وابستگی را تعمیر نمی‌کند، یا دایرکتوری بسته
OpenClaw را تغییر نمی‌دهد.

## تقسیم مسئولیت

بسته‌های Plugin مالک گراف وابستگی خود هستند:

- وابستگی‌های زمان اجرا در `dependencies` یا `optionalDependencies` بسته Plugin قرار می‌گیرند
- importهای SDK/هسته peer هستند یا importهایی هستند که OpenClaw فراهم می‌کند
- Pluginهای توسعه محلی وابستگی‌های از پیش نصب‌شده خود را همراه دارند
- Pluginهای npm و git در ریشه‌های بسته تحت مالکیت OpenClaw نصب می‌شوند

OpenClaw فقط چرخه عمر Plugin را مالک است:

- کشف منبع Plugin
- نصب یا به‌روزرسانی بسته وقتی صراحتاً درخواست شود
- ثبت فراداده نصب
- بارگذاری entrypoint مربوط به Plugin
- شکست با خطایی قابل اقدام وقتی وابستگی‌ها وجود ندارند

## ریشه‌های نصب

OpenClaw از ریشه‌های پایدار برای هر منبع استفاده می‌کند:

- بسته‌های npm در پروژه‌های جداگانه هر Plugin زیر
  `~/.openclaw/npm/projects/<encoded-package>` نصب می‌شوند
- بسته‌های git زیر `~/.openclaw/git` clone می‌شوند
- نصب‌های محلی/مسیر/archive بدون تعمیر وابستگی کپی یا ارجاع داده می‌شوند

نصب‌های npm در همان ریشه پروژه هر Plugin با این دستور اجرا می‌شوند:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` برای یک tarball محلی npm-pack از همان ریشه پروژه npm
هر Plugin استفاده می‌کند. OpenClaw فراداده npm داخل tarball را می‌خواند، آن را به‌عنوان یک وابستگی
`file:` کپی‌شده به پروژه مدیریت‌شده اضافه می‌کند، نصب معمول npm را اجرا می‌کند، و سپس پیش از اعتماد
به Plugin، فراداده lockfile نصب‌شده را بررسی می‌کند.
این مسیر برای اثبات package-acceptance و release-candidate در نظر گرفته شده است، جایی که یک artifact
محلی pack باید مانند artifact رجیستری که شبیه‌سازی می‌کند رفتار کند.

هنگام آزمایش بسته‌های رسمی یا خارجی Plugin پیش از انتشار، از `npm-pack:` استفاده کنید. نصب خام archive
یا مسیر برای اشکال‌زدایی محلی مفید است، اما همان مسیر وابستگی یک بسته npm یا ClawHub نصب‌شده را اثبات
نمی‌کند. `npm-pack:` شکل نصب بسته مدیریت‌شده را اثبات می‌کند؛ به‌تنهایی اثبات نمی‌کند که Plugin محتوای
رسمی متصل به catalog است.

وقتی رفتار به وضعیت bundled-plugin یا Plugin رسمی مورد اعتماد وابسته است، اثبات بسته محلی را با یک نصب
رسمی مبتنی بر catalog یا یک مسیر بسته منتشرشده که اعتماد رسمی را ثبت می‌کند همراه کنید. دسترسی helper
دارای امتیاز و مدیریت محدوده trusted-official باید روی همان مسیر نصب مورد اعتماد اعتبارسنجی شود، نه از
نصب tarball محلی استنباط شود.

اگر یک Plugin در زمان اجرا با import گم‌شده شکست بخورد، به‌جای تعمیر دستی پروژه مدیریت‌شده، manifest
بسته را اصلاح کنید. importهای زمان اجرا باید در `dependencies` یا `optionalDependencies` بسته Plugin
باشند؛ `devDependencies` برای پروژه‌های زمان اجرای مدیریت‌شده نصب نمی‌شوند. یک `npm install` محلی داخل
`~/.openclaw/npm/projects/<encoded-package>` می‌تواند یک تشخیص موقت را باز کند، اما اثبات
package-acceptance نیست، چون نصب یا به‌روزرسانی بعدی پروژه را دوباره از فراداده بسته می‌سازد.

npm ممکن است وابستگی‌های transitively را به `node_modules` پروژه هر Plugin در کنار بسته Plugin hoist کند.
OpenClaw پیش از اعتماد به نصب، ریشه پروژه مدیریت‌شده را اسکن می‌کند و هنگام uninstall همان پروژه را حذف
می‌کند، بنابراین وابستگی‌های زمان اجرای hoistشده داخل مرز cleanup همان Plugin باقی می‌مانند.

بسته‌های npm منتشرشده برای Plugin می‌توانند `npm-shrinkwrap.json` داشته باشند. npm هنگام نصب از آن
lockfile قابل انتشار استفاده می‌کند، و ریشه پروژه npm مدیریت‌شده OpenClaw آن را از مسیر نصب عادی npm
پشتیبانی می‌کند. بسته‌های Plugin قابل انتشار و تحت مالکیت OpenClaw باید یک shrinkwrap محلی بسته داشته
باشند که از گراف وابستگی منتشرشده همان بسته Plugin تولید شده باشد:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

generator، `devDependencies` مربوط به Plugin را حذف می‌کند، سیاست override فضای کاری را اعمال می‌کند،
و برای هر Plugin دارای `publishToNpm`، فایل `extensions/<id>/npm-shrinkwrap.json` را می‌نویسد. بسته‌های
Plugin شخص ثالث نیز ممکن است shrinkwrap ارسال کنند؛ OpenClaw آن را برای بسته‌های جامعه الزامی نمی‌کند،
اما npm در صورت وجود آن را رعایت می‌کند.

پیش از اینکه یک بسته محلی را اثبات release-candidate بدانید، tarballی را که نصب خواهد شد بررسی کنید:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

برای تغییرات وابستگی، همچنین بررسی کنید که یک نصب تولید بتواند بسته‌های زمان اجرا را بدون وابستگی‌های
توسعه resolve کند:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

بسته‌های npm Plugin تحت مالکیت OpenClaw همچنین می‌توانند با `bundledDependencies` صریح منتشر شوند. مسیر
انتشار npm فهرست نام وابستگی‌های زمان اجرا را overlay می‌کند، فراداده فقط-توسعه فضای کاری را از manifest
بسته منتشرشده حذف می‌کند، یک نصب npm بدون script برای وابستگی‌های زمان اجرای محلی بسته اجرا می‌کند، سپس
tarball Plugin را با فایل‌های آن وابستگی‌ها pack یا publish می‌کند. بسته‌های سنگین از نظر native، از جمله
زمان اجراهای Codex و ACP، با `openclaw.release.bundleRuntimeDependencies: false` opt out می‌کنند؛ این
بسته‌ها همچنان shrinkwrap خود را ارسال می‌کنند، اما npm به‌جای جاسازی هر باینری پلتفرم در tarball Plugin،
وابستگی‌های زمان اجرا را هنگام نصب resolve می‌کند. بسته ریشه `openclaw` کل درخت وابستگی خود را bundle
نمی‌کند.

Pluginهایی که `openclaw/plugin-sdk/*` را import می‌کنند، `openclaw` را به‌عنوان peer dependency اعلام
می‌کنند. OpenClaw اجازه نمی‌دهد npm یک کپی جداگانه رجیستری از بسته میزبان را در پروژه مدیریت‌شده نصب کند،
چون بسته‌های میزبان قدیمی می‌توانند بر resolution مربوط به peerهای npm داخل آن Plugin اثر بگذارند. نصب‌های
npm مدیریت‌شده از resolution/materialization مربوط به peerهای npm عبور می‌کنند و OpenClaw پس از نصب یا
به‌روزرسانی، لینک‌های `node_modules/openclaw` محلی Plugin را برای بسته‌های نصب‌شده‌ای که peer میزبان را
اعلام می‌کنند دوباره برقرار می‌کند.

نصب‌های git مخزن را clone یا refresh می‌کنند، سپس اجرا می‌کنند:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

سپس Plugin نصب‌شده از همان دایرکتوری بسته بارگذاری می‌شود، بنابراین resolution مربوط به `node_modules`
محلی بسته و والد همان‌طور کار می‌کند که برای یک بسته عادی Node کار می‌کند.

## Pluginهای محلی

Pluginهای محلی به‌عنوان دایرکتوری‌های تحت کنترل توسعه‌دهنده تلقی می‌شوند. OpenClaw برای آن‌ها
`npm install`، `pnpm install` یا تعمیر وابستگی اجرا نمی‌کند. اگر یک Plugin محلی وابستگی دارد، پیش از
بارگذاری آن، وابستگی‌ها را در همان Plugin نصب کنید.

Pluginهای محلی TypeScript شخص ثالث می‌توانند از مسیر اضطراری Jiti استفاده کنند. Pluginهای JavaScript
بسته‌بندی‌شده و Pluginهای داخلی bundled به‌جای Jiti از طریق import/require بومی بارگذاری می‌شوند.

## راه‌اندازی و بارگذاری مجدد

راه‌اندازی Gateway و reload پیکربندی هرگز وابستگی‌های Plugin را نصب نمی‌کنند. آن‌ها رکوردهای نصب Plugin
را می‌خوانند، entrypoint را محاسبه می‌کنند، و آن را بارگذاری می‌کنند.

اگر وابستگی‌ای در زمان اجرا وجود نداشته باشد، Plugin بارگذاری نمی‌شود و خطا باید operator را به یک رفع
صریح هدایت کند:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` می‌تواند وضعیت وابستگی قدیمی تولیدشده توسط OpenClaw را پاک کند و Pluginهای قابل دانلودی
را که هنگام ارجاع پیکربندی، از رکوردهای نصب محلی غایب هستند بازیابی کند. Doctor وابستگی‌های یک Plugin
محلی از پیش نصب‌شده را تعمیر نمی‌کند.

## Pluginهای bundled

Pluginهای سبک و حیاتی برای هسته به‌عنوان بخشی از OpenClaw ارسال می‌شوند. آن‌ها باید یا درخت وابستگی
زمان اجرای سنگین نداشته باشند یا به یک بسته قابل دانلود روی ClawHub/npm منتقل شوند.

برای فهرست تولیدشده فعلی Pluginهایی که در بسته هسته ارسال می‌شوند، بیرونی نصب می‌شوند، یا فقط در source
باقی می‌مانند، [موجودی Plugin](/fa/plugins/plugin-inventory) را ببینید.

manifestهای Plugin bundled نباید درخواست dependency staging کنند. کارکردهای بزرگ یا اختیاری Plugin
باید به‌عنوان یک Plugin عادی بسته‌بندی شوند و از همان مسیر npm/git/ClawHub مثل Pluginهای شخص ثالث نصب
شوند.

در checkoutهای source، OpenClaw مخزن را به‌عنوان یک monorepo مربوط به pnpm در نظر می‌گیرد. پس از
`pnpm install`، Pluginهای bundled از `extensions/<id>` بارگذاری می‌شوند تا وابستگی‌های workspace محلی
بسته در دسترس باشند و ویرایش‌ها مستقیم اعمال شوند. توسعه checkout منبع فقط با pnpm پشتیبانی می‌شود؛
`npm install` ساده در ریشه مخزن راه پشتیبانی‌شده‌ای برای آماده‌سازی وابستگی‌های Pluginهای bundled نیست.

| شکل نصب                         | مکان Plugin bundled                  | مالک وابستگی                                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | درخت زمان اجرای ساخته‌شده داخل بسته  | بسته OpenClaw و جریان‌های صریح install/update/doctor مربوط به Plugin |
| Git checkout plus `pnpm install` | بسته‌های workspace در `extensions/<id>` | فضای کاری pnpm، شامل وابستگی‌های خود هر بسته Plugin                 |
| `openclaw plugins install ...`   | ریشه npm project/git/ClawHub مدیریت‌شده | جریان install/update مربوط به Plugin                                |

## پاک‌سازی legacy

نسخه‌های قدیمی‌تر OpenClaw ریشه‌های وابستگی Pluginهای bundled را هنگام startup یا در طول تعمیر doctor
تولید می‌کردند. cleanup فعلی doctor وقتی `--fix` استفاده شود، آن دایرکتوری‌ها و symlinkهای قدیمی را حذف
می‌کند، از جمله ریشه‌های قدیمی `plugin-runtime-deps`، symlinkهای بسته global Node-prefix که به targetهای
حذف‌شده `plugin-runtime-deps` اشاره می‌کنند، manifestهای `.openclaw-runtime-deps*`، `node_modules` تولیدشده
برای Plugin، دایرکتوری‌های install stage، و storeهای pnpm محلی بسته. postinstall بسته‌بندی‌شده نیز پیش از
prune کردن ریشه‌های target قدیمی، آن symlinkهای global را حذف می‌کند تا upgradeها importهای بسته ESM آویزان
باقی نگذارند.

نصب‌های قدیمی‌تر npm همچنین از یک ریشه مشترک `~/.openclaw/npm/node_modules` استفاده می‌کردند. جریان‌های
فعلی install، update، uninstall و doctor هنوز آن ریشه تخت legacy را فقط برای بازیابی و cleanup می‌شناسند.
نصب‌های جدید npm باید به‌جای آن، ریشه‌های پروژه جداگانه برای هر Plugin ایجاد کنند.
