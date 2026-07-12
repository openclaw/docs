---
read_when:
    - انتقال میزبانی، ابزارها، فرمان‌ها، مستندات یا مالکیت پروتکل Canvas
    - ممیزی اینکه آیا Canvas همچنان تحت مالکیت هسته است
    - آماده‌سازی یا بازبینی PR مربوط به Plugin آزمایشی Canvas
summary: برنامه و چک‌لیست ممیزی برای انتقال Canvas از هسته به یک Plugin آزمایشی همراه.
title: بازآرایی Plugin بوم نقاشی
x-i18n:
    generated_at: "2026-07-12T10:48:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# بازآرایی Plugin مربوط به Canvas

Canvas کم‌استفاده و آزمایشی است. با آن به‌عنوان یک Plugin همراه برخورد کنید، نه یک قابلیت هسته‌ای. هسته می‌تواند زیرساخت عمومی Gateway، Node، HTTP، احراز هویت، پیکربندی و کلاینت بومی را نگه دارد، اما رفتار مختص Canvas باید زیر `extensions/canvas` قرار گیرد.

## هدف

انتقال مالکیت Canvas به `extensions/canvas` با حفظ رفتار فعلی Node جفت‌شده:

- ابزار `canvas` در دسترس عامل، توسط Plugin مربوط به Canvas ثبت شود
- فرمان‌های Node مربوط به Canvas فقط زمانی مجاز باشند که Plugin مربوط به Canvas آن‌ها را ثبت کند
- فایل‌های میزبان/منبع A2UI زیر Plugin مربوط به Canvas قرار گیرند
- مادی‌سازی سند Canvas زیر Plugin مربوط به Canvas قرار گیرد
- پیاده‌سازی فرمان CLI زیر Plugin مربوط به Canvas قرار گیرد، یا از طریق یک barrel زمان اجرای متعلق به Plugin واگذار شود
- مستندات و فهرست موجودی Plugin، Canvas را آزمایشی و مبتنی بر Plugin توصیف کنند

## موارد خارج از هدف

- در این بازآرایی، رابط کاربری Canvas در برنامه بومی را بازطراحی نکنید.
- پشتیبانی پروتکل/کلاینت Canvas را از iOS، Android یا macOS حذف نکنید، مگر اینکه تصمیم محصول جداگانه‌ای حذف Canvas را مقرر کند.
- فقط برای Canvas یک چارچوب گسترده خدمات Plugin نسازید، مگر اینکه حداقل یک Plugin همراه دیگر نیز به همان نقطه اتصال نیاز داشته باشد.

## وضعیت فعلی شاخه

انجام‌شده:

- بسته Plugin همراه در `extensions/canvas` اضافه شد.
- `extensions/canvas/openclaw.plugin.json` اضافه شد.
- ابزار `canvas` عامل از `src/agents/tools/canvas-tool.ts` به `extensions/canvas/src/tool.ts` منتقل شد.
- ثبت هسته‌ای `createCanvasTool` از `src/agents/openclaw-tools.ts` حذف شد.
- پیاده‌سازی میزبان Canvas از `src/canvas-host` به `extensions/canvas/src/host` منتقل شد.
- `extensions/canvas/runtime-api.ts` به‌عنوان barrel سازگاری متعلق به Plugin برای آزمون‌ها، بسته‌بندی و ابزارهای کمکی عمومی و خارجی Canvas حفظ شد.
- مادی‌سازی سند Canvas از `src/gateway/canvas-documents.ts` به `extensions/canvas/src/documents.ts` منتقل شد.
- پیاده‌سازی CLI مربوط به Canvas و ابزارهای کمکی JSONL مربوط به A2UI به `extensions/canvas/src/cli.ts` منتقل شدند.
- نشانی URL میزبان Canvas و ابزارهای کمکی قابلیت محدوده‌بندی‌شده به `extensions/canvas/src` منتقل شدند.
- مقادیر پیش‌فرض فرمان‌های Node مربوط به Canvas از فهرست‌های کدنویسی‌شده در هسته خارج و به `nodeInvokePolicies` در Plugin منتقل شدند.
- پیکربندی میزبان Canvas متعلق به Plugin در `plugins.entries.canvas.config.host` اضافه شد.
- ارائه HTTP مربوط به Canvas و A2UI پشت ثبت مسیر HTTP در Plugin مربوط به Canvas قرار گرفت.
- اعزام عمومی ارتقای WebSocket برای مسیرهای HTTP متعلق به Plugin اضافه شد.
- نشانی URL میزبان و مجوزدهی قابلیت Node مختص Canvas در Gateway با ابزارهای کمکی عمومی سطح میزبانی‌شده Plugin و قابلیت Node جایگزین شدند.
- حل‌کننده‌های رسانه میزبانی‌شده متعلق به Plugin اضافه شدند تا نشانی‌های URL سند Canvas به‌جای وارد کردن جزئیات داخلی سند Canvas توسط هسته، از طریق Plugin مربوط به Canvas حل شوند.
- `api.registerNodeCliFeature(...)` اضافه شد تا Canvas بتواند `openclaw nodes canvas` را به‌عنوان یک قابلیت Node متعلق به Plugin اعلام کند، بدون آنکه مسیر فرمان والد را به‌صورت دستی مشخص کند.
- واردسازی‌های زمان تولید `src/**` از `extensions/canvas/runtime-api.js` حذف شدند.
- منبع بسته A2UI از `apps/shared/OpenClawKit/Tools/CanvasA2UI` به `extensions/canvas/src/host/a2ui-app` منتقل شد.
- پیاده‌سازی ساخت/کپی A2UI به زیر `extensions/canvas/scripts` منتقل و سیم‌کشی ساخت ریشه با قلاب‌های عمومی دارایی Plugin همراه جایگزین شد.
- نام مستعار پیکربندی سطح‌بالای قدیمی `canvasHost` در زمان اجرا حذف شد.
- مهاجرت doctor مربوط به Canvas حفظ شد تا `openclaw doctor --fix` پیکربندی‌های قدیمی `canvasHost` را به `plugins.entries.canvas.config.host` بازنویسی کند.
- سازگاری پروتکل Canvas با عامل‌های قدیمی در پشت پروتکل Gateway نسخه ۴ حذف شد. کلاینت‌های بومی و Gatewayها اکنون فقط از `pluginSurfaceUrls.canvas` به‌همراه `node.pluginSurface.refresh` استفاده می‌کنند؛ مسیر منسوخ‌شده `canvasHostUrl`، `canvasCapability` و `node.canvas.capability.refresh` در این بازآرایی آزمایشی عمداً پشتیبانی نمی‌شود.
- فهرست موجودی تولیدشده Plugin برای افزودن Canvas به‌روزرسانی شد.
- مستندات مرجع Plugin در `docs/plugins/reference/canvas.md` اضافه شد.

سطوح شناخته‌شده باقی‌مانده Canvas که همچنان متعلق به هسته هستند:

- کنترل‌کننده‌های Canvas در برنامه بومی زیر `apps/` همچنان عمداً سطح Plugin مربوط به Canvas را مصرف می‌کنند
- کنترل‌کننده‌های پروتکل/کلاینت Canvas در برنامه بومی زیر `apps/`
- خروجی مصنوع منتشرشده برای جست‌وجوی سازگار با نسخه‌های قبلی در زمان اجرا همچنان از `dist/canvas-host/a2ui` استفاده می‌کند، اما مرحله کپی اکنون متعلق به Plugin است

## ساختار هدف

`extensions/canvas` باید مالک موارد زیر باشد:

- مانیفست Plugin و فراداده بسته
- ثبت ابزار عامل
- سیاست فرمان فراخوانی Node
- میزبان Canvas و زمان اجرای A2UI
- منبع بسته A2UI مربوط به Canvas و اسکریپت‌های ساخت/کپی دارایی
- ایجاد سند Canvas و حل دارایی
- پیاده‌سازی CLI مربوط به Canvas
- صفحه مستندات Canvas و مدخل فهرست موجودی Plugin

هسته باید فقط مالک نقاط اتصال عمومی زیر باشد:

- کشف و ثبت Plugin
- رجیستری عمومی ابزار عامل
- رجیستری عمومی سیاست فراخوانی Node
- احراز هویت/HTTP عمومی Gateway و اعزام ارتقای WebSocket
- حل عمومی نشانی URL سطح میزبانی‌شده Plugin
- ثبت عمومی حل‌کننده رسانه میزبانی‌شده
- انتقال عمومی قابلیت Node
- زیرساخت عمومی پیکربندی
- کشف عمومی قلاب دارایی Plugin همراه

برنامه‌های بومی می‌توانند کنترل‌کننده‌های فرمان Canvas را به‌عنوان کلاینت‌های پروتکل نگه دارند. آن‌ها مالک زمان اجرای Plugin نیستند.

## مراحل مهاجرت

1. با `plugins.entries.canvas.config.host` به‌عنوان سطح پیکربندی متعلق به Plugin برخورد کنید.
2. مستندات را به‌روزرسانی کنید تا Canvas به‌عنوان یک Plugin همراه آزمایشی توصیف شود.
3. آزمون‌های متمرکز Canvas، بررسی‌های فهرست موجودی Plugin، بررسی‌های API مربوط به SDK افزونه و دروازه‌های ساخت/نوع متأثر از مرزهای زمان اجرا را اجرا کنید.

## چک‌لیست ممیزی

پیش از کامل اعلام کردن بازآرایی:

- `rg "src/canvas-host|../canvas-host"` هیچ واردسازی فعال منبعی برنگرداند.
- `rg "canvas-tool|createCanvasTool" src` هیچ پیاده‌سازی ابزار Canvas متعلق به هسته پیدا نکند.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` هیچ مقدار پیش‌فرض فهرست مجاز کدنویسی‌شده‌ای خارج از آزمون‌های سیاست عمومی Plugin پیدا نکند.
- خروجی `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` خالی باشد.
- خروجی `rg "canvas-documents" src` خالی باشد.
- خروجی `rg "registerNodesCanvasCommands|nodes-canvas" src` خالی باشد؛ Plugin مربوط به Canvas فرمان `openclaw nodes canvas` را از طریق فراداده تودرتوی CLI مربوط به Plugin ثبت کند.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` هیچ مالکیت زمان اجرای Gateway برنگرداند.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` فقط پوشش‌های سازگاری یا مسیرهای متعلق به Plugin را پیدا کند.
- `pnpm plugins:inventory:check` با موفقیت اجرا شود.
- `pnpm plugin-sdk:api:check` با موفقیت اجرا شود، یا خطوط مبنای API تولیدشده عمداً به‌روزرسانی و بازبینی شوند.
- آزمون‌های هدفمند Canvas با موفقیت اجرا شوند.
- آزمون‌های مسیرهای تغییریافته برای مسیرهای میزبان Canvas/A2UI با موفقیت اجرا شوند.
- متن PR صراحتاً بیان کند که Canvas آزمایشی و مبتنی بر Plugin است.

## فرمان‌های راستی‌آزمایی

هنگام تکرار و اصلاح، از بررسی‌های محلی هدفمند استفاده کنید:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

اگر barrel زمان اجرا، واردسازی تنبل، بسته‌بندی یا سطوح منتشرشده Plugin تغییر می‌کنند، پیش از push فرمان `pnpm build` را اجرا کنید.
