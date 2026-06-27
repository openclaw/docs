---
read_when:
    - در حال اشکال‌زدایی نصب بسته‌های Plugin هستید
    - شما رفتار راه‌اندازی Plugin، doctor یا نصب از طریق مدیر بسته را تغییر می‌دهید
    - شما در حال نگهداری نصب‌های بسته‌بندی‌شده OpenClaw یا manifestهای Plugin همراه هستید
sidebarTitle: Dependencies
summary: OpenClaw چگونه بسته‌های Plugin را نصب و وابستگی‌های Plugin را حل می‌کند
title: حل وابستگی Plugin
x-i18n:
    generated_at: "2026-06-27T18:15:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw کار وابستگی‌های Plugin را در زمان نصب/به‌روزرسانی نگه می‌دارد. بارگذاری زمان اجرا
package managerها را اجرا نمی‌کند، درخت‌های وابستگی را ترمیم نمی‌کند، یا دایرکتوری بسته‌ی OpenClaw
را تغییر نمی‌دهد.

## تقسیم مسئولیت

بسته‌های Plugin مالک گراف وابستگی خود هستند:

- وابستگی‌های زمان اجرا در `dependencies` یا
  `optionalDependencies` بسته‌ی Plugin قرار می‌گیرند
- ایمپورت‌های SDK/core به‌صورت peer یا ایمپورت‌های تأمین‌شده توسط OpenClaw هستند
- Pluginهای توسعه‌ی محلی وابستگی‌های از پیش نصب‌شده‌ی خودشان را همراه دارند
- Pluginهای npm و git در ریشه‌های بسته‌ی تحت مالکیت OpenClaw نصب می‌شوند

OpenClaw فقط مالک چرخه‌ی عمر Plugin است:

- کشف منبع Plugin
- نصب یا به‌روزرسانی بسته وقتی صریحاً درخواست شده باشد
- ثبت فراداده‌ی نصب
- بارگذاری نقطه‌ی ورود Plugin
- شکست با خطایی قابل اقدام وقتی وابستگی‌ها موجود نباشند

## ریشه‌های نصب

OpenClaw از ریشه‌های پایدار برای هر منبع استفاده می‌کند:

- بسته‌های npm در پروژه‌های جداگانه برای هر Plugin زیر
  `~/.openclaw/npm/projects/<encoded-package>` نصب می‌شوند
- بسته‌های git زیر `~/.openclaw/git` clone می‌شوند
- نصب‌های محلی/مسیر/آرشیو بدون ترمیم وابستگی کپی یا ارجاع داده می‌شوند

نصب‌های npm در همان ریشه‌ی پروژه‌ی جداگانه‌ی Plugin با این دستور اجرا می‌شوند:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` برای یک tarball محلی npm-pack از همان ریشه‌ی پروژه‌ی npm
جداگانه‌ی Plugin استفاده می‌کند. OpenClaw فراداده‌ی npm موجود در tarball را می‌خواند، آن را به‌عنوان یک وابستگی کپی‌شده‌ی `file:` به پروژه‌ی مدیریت‌شده اضافه می‌کند، نصب عادی npm را اجرا می‌کند، و سپس پیش از اعتماد به Plugin، فراداده‌ی lockfile نصب‌شده را راستی‌آزمایی می‌کند.
این برای اثبات پذیرش بسته و release-candidate در نظر گرفته شده است، جایی که یک مصنوع pack محلی باید مانند مصنوع registry که شبیه‌سازی می‌کند رفتار کند.

npm ممکن است وابستگی‌های گذرای را به `node_modules` پروژه‌ی جداگانه‌ی Plugin، کنار بسته‌ی Plugin، hoist کند. OpenClaw پیش از اعتماد به نصب، ریشه‌ی پروژه‌ی مدیریت‌شده را اسکن می‌کند و هنگام uninstall آن پروژه را حذف می‌کند، بنابراین وابستگی‌های زمان اجرای hoist‌شده داخل مرز پاک‌سازی همان Plugin می‌مانند.

بسته‌های منتشرشده‌ی npm Plugin می‌توانند `npm-shrinkwrap.json` ارائه کنند. npm در زمان نصب از آن lockfile قابل انتشار استفاده می‌کند، و ریشه‌ی پروژه‌ی npm مدیریت‌شده‌ی OpenClaw از مسیر نصب عادی npm از آن پشتیبانی می‌کند. بسته‌های قابل انتشار Plugin تحت مالکیت OpenClaw باید یک shrinkwrap محلیِ همان بسته داشته باشند که از گراف وابستگی منتشرشده‌ی همان بسته‌ی Plugin تولید شده باشد:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

مولد، `devDependencies`های Plugin را حذف می‌کند، سیاست override فضای کاری را اعمال می‌کند، و برای هر Plugin با `publishToNpm` فایل `extensions/<id>/npm-shrinkwrap.json` را می‌نویسد. بسته‌های Plugin شخص ثالث نیز ممکن است shrinkwrap ارائه کنند؛ OpenClaw آن را برای بسته‌های جامعه الزامی نمی‌کند، اما npm در صورت وجود به آن احترام می‌گذارد.

بسته‌های npm Plugin تحت مالکیت OpenClaw همچنین می‌توانند با `bundledDependencies` صریح منتشر شوند. مسیر انتشار npm فهرست نام وابستگی‌های زمان اجرا را روی هم می‌اندازد، فراداده‌ی فضای کاری فقط-توسعه را از manifest بسته‌ی منتشرشده حذف می‌کند، یک نصب npm بدون اسکریپت را برای وابستگی‌های زمان اجرای محلی بسته اجرا می‌کند، سپس tarball Plugin را با آن فایل‌های وابستگیِ درج‌شده pack یا publish می‌کند. بسته‌های سنگین از نظر native، از جمله زمان‌اجراهای Codex و ACP، با `openclaw.release.bundleRuntimeDependencies: false` انصراف می‌دهند؛ آن بسته‌ها همچنان shrinkwrap خود را ارائه می‌کنند، اما npm وابستگی‌های زمان اجرا را هنگام نصب resolve می‌کند، به‌جای اینکه هر binary پلتفرم را در tarball Plugin جاسازی کند. بسته‌ی ریشه‌ی `openclaw` کل درخت وابستگی خود را bundle نمی‌کند.

Pluginهایی که `openclaw/plugin-sdk/*` را import می‌کنند، `openclaw` را به‌عنوان peer dependency اعلام می‌کنند. OpenClaw اجازه نمی‌دهد npm یک کپی registry جداگانه از بسته‌ی میزبان را در یک پروژه‌ی مدیریت‌شده نصب کند، چون بسته‌های میزبان قدیمی می‌توانند بر peer resolution npm داخل آن Plugin اثر بگذارند. نصب‌های npm مدیریت‌شده از peer resolution/materialization در npm عبور می‌کنند و OpenClaw پس از install یا update، پیوندهای `node_modules/openclaw` محلی Plugin را برای بسته‌های نصب‌شده‌ای که peer میزبان را اعلام می‌کنند دوباره برقرار می‌کند.

نصب‌های git مخزن را clone یا refresh می‌کنند، سپس اجرا می‌کنند:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

سپس Plugin نصب‌شده از همان دایرکتوری بسته بارگذاری می‌شود، بنابراین resolution وابستگی‌های محلی بسته و والد `node_modules` همان‌طور کار می‌کند که برای یک بسته‌ی عادی Node کار می‌کند.

## Pluginهای محلی

Pluginهای محلی به‌عنوان دایرکتوری‌های تحت کنترل توسعه‌دهنده در نظر گرفته می‌شوند. OpenClaw برای آن‌ها
`npm install`، `pnpm install`، یا ترمیم وابستگی اجرا نمی‌کند. اگر یک Plugin محلی وابستگی دارد، پیش از بارگذاری، آن‌ها را در همان Plugin نصب کنید.

Pluginهای محلی TypeScript شخص ثالث می‌توانند از مسیر اضطراری Jiti استفاده کنند. Pluginهای JavaScript بسته‌بندی‌شده و Pluginهای داخلی bundle‌شده به‌جای Jiti از مسیر native
import/require بارگذاری می‌شوند.

## راه‌اندازی و بارگذاری مجدد

راه‌اندازی Gateway و بارگذاری مجدد config هرگز وابستگی‌های Plugin را نصب نمی‌کنند. آن‌ها
رکوردهای نصب Plugin را می‌خوانند، نقطه‌ی ورود را محاسبه می‌کنند، و آن را بارگذاری می‌کنند.

اگر وابستگی‌ای در زمان اجرا موجود نباشد، بارگذاری Plugin شکست می‌خورد و خطا
باید operator را به یک راه‌حل صریح هدایت کند:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` می‌تواند state وابستگی legacy تولیدشده توسط OpenClaw را پاک‌سازی کند و Pluginهای قابل دانلودی را که هنگام ارجاع config در رکوردهای نصب محلی وجود ندارند بازیابی کند. Doctor وابستگی‌های یک Plugin محلی از پیش نصب‌شده را ترمیم نمی‌کند.

## Pluginهای bundle‌شده

Pluginهای سبک و حیاتی برای core به‌عنوان بخشی از OpenClaw ارائه می‌شوند.
آن‌ها یا نباید درخت وابستگی زمان اجرای سنگینی داشته باشند، یا باید به یک بسته‌ی قابل دانلود در ClawHub/npm منتقل شوند.

برای فهرست فعلی تولیدشده‌ی Pluginهایی که در بسته‌ی core ارائه می‌شوند، بیرونی نصب می‌شوند، یا فقط source-only می‌مانند، [موجودی Plugin](/fa/plugins/plugin-inventory) را ببینید.

manifestهای Plugin bundle‌شده نباید dependency staging درخواست کنند. قابلیت‌های بزرگ یا اختیاری Plugin باید به‌عنوان یک Plugin عادی بسته‌بندی شوند و از همان مسیر npm/git/ClawHub مانند Pluginهای شخص ثالث نصب شوند.

در checkoutهای source، OpenClaw با مخزن مانند یک monorepo مبتنی بر pnpm رفتار می‌کند. پس از
`pnpm install`، Pluginهای bundle‌شده از `extensions/<id>` بارگذاری می‌شوند تا وابستگی‌های workspace محلی بسته در دسترس باشند و ویرایش‌ها مستقیماً اعمال شوند. توسعه در checkout source فقط با pnpm پشتیبانی می‌شود؛ اجرای ساده‌ی `npm install` در ریشه‌ی مخزن راه پشتیبانی‌شده‌ای برای آماده‌سازی وابستگی‌های Plugin bundle‌شده نیست.

| شکل نصب | مکان Plugin bundle‌شده | مالک وابستگی |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw` | درخت زمان اجرای ساخته‌شده داخل بسته | بسته‌ی OpenClaw و جریان‌های صریح نصب/به‌روزرسانی/doctor Plugin |
| checkout با Git به‌علاوه‌ی `pnpm install` | بسته‌های workspace در `extensions/<id>` | workspace مربوط به pnpm، شامل وابستگی‌های خود هر بسته‌ی Plugin |
| `openclaw plugins install ...` | ریشه‌ی مدیریت‌شده‌ی npm project/git/ClawHub | جریان نصب/به‌روزرسانی Plugin |

## پاک‌سازی legacy

نسخه‌های قدیمی‌تر OpenClaw ریشه‌های وابستگی Pluginهای bundle‌شده را هنگام startup یا
در طول ترمیم doctor تولید می‌کردند. پاک‌سازی فعلی doctor وقتی `--fix` استفاده شود، آن دایرکتوری‌ها و symlinkهای stale را حذف می‌کند، از جمله ریشه‌های قدیمی `plugin-runtime-deps`، symlinkهای بسته‌ی global Node-prefix که به targetهای pruned شده‌ی `plugin-runtime-deps` اشاره می‌کنند،
manifestهای `.openclaw-runtime-deps*`، `node_modules` تولیدشده‌ی Plugin، دایرکتوری‌های stage نصب، و storeهای محلی pnpm بسته. postinstall بسته‌بندی‌شده نیز آن symlinkهای global را پیش از pruning ریشه‌های target legacy حذف می‌کند تا upgradeها importهای بسته‌ی ESM آویزان باقی نگذارند.

نصب‌های قدیمی‌تر npm همچنین از یک ریشه‌ی مشترک `~/.openclaw/npm/node_modules` استفاده می‌کردند.
جریان‌های فعلی install، update، uninstall، و doctor همچنان آن ریشه‌ی تخت legacy را فقط برای recovery و cleanup می‌شناسند. نصب‌های جدید npm باید به‌جای آن ریشه‌های پروژه‌ی جداگانه برای هر Plugin ایجاد کنند.
