---
read_when:
    - انتقال مالکیت میزبان، ابزارها، فرمان‌ها، مستندات یا پروتکل Canvas
    - ممیزی اینکه آیا Canvas همچنان متعلق به هسته است
    - آماده‌سازی یا بازبینی درخواست ادغام Plugin آزمایشی Canvas
summary: برنامه و چک‌لیست ممیزی برای انتقال Canvas از هسته به یک Plugin آزمایشی همراه.
title: بازآرایی Plugin بوم
x-i18n:
    generated_at: "2026-05-07T13:31:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# بازآرایی Plugin Canvas

Canvas کم‌استفاده و آزمایشی است. آن را به‌عنوان یک Plugin همراه در نظر بگیرید، نه یک قابلیت هسته. هسته می‌تواند لوله‌کشی عمومی Gateway، Node، HTTP، احراز هویت، پیکربندی، و کلاینت بومی را نگه دارد، اما رفتار ویژه Canvas باید زیر `extensions/canvas` قرار بگیرد.

## هدف

انتقال مالکیت Canvas به `extensions/canvas` با حفظ رفتار فعلی Node جفت‌شده:

- ابزار `canvas` که عامل از آن استفاده می‌کند توسط Plugin Canvas ثبت می‌شود
- فرمان‌های Node مربوط به Canvas فقط زمانی مجاز هستند که Plugin Canvas آن‌ها را ثبت کند
- فایل‌های میزبان/منبع A2UI زیر Plugin Canvas قرار می‌گیرند
- مادی‌سازی سند Canvas زیر Plugin Canvas قرار می‌گیرد
- پیاده‌سازی فرمان CLI زیر Plugin Canvas قرار می‌گیرد، یا از طریق یک barrel زمان اجرای متعلق به Plugin واگذار می‌شود
- مستندات و فهرست موجودی Plugin، Canvas را به‌عنوان آزمایشی و متکی بر Plugin توصیف می‌کنند

## غیرهدف‌ها

- در این بازآرایی، رابط کاربری Canvas در برنامه بومی را بازطراحی نکنید.
- پشتیبانی پروتکل/کلاینت Canvas را از iOS، Android، یا macOS حذف نکنید، مگر اینکه یک تصمیم محصولی جداگانه بگوید Canvas باید حذف شود.
- فقط برای Canvas یک چارچوب گسترده سرویس Plugin نسازید، مگر اینکه دست‌کم یک Plugin همراه دیگر به همان seam نیاز داشته باشد.

## وضعیت فعلی شاخه

انجام‌شده:

- بسته Plugin همراه در `extensions/canvas` اضافه شد.
- `extensions/canvas/openclaw.plugin.json` اضافه شد.
- ابزار عامل `canvas` از `src/agents/tools/canvas-tool.ts` به `extensions/canvas/src/tool.ts` منتقل شد.
- ثبت هسته‌ای `createCanvasTool` از `src/agents/openclaw-tools.ts` حذف شد.
- پیاده‌سازی میزبان Canvas از `src/canvas-host` به `extensions/canvas/src/host` منتقل شد.
- `extensions/canvas/runtime-api.ts` به‌عنوان barrel سازگاری متعلق به Plugin برای تست‌ها، بسته‌بندی، و کمک‌کننده‌های عمومی خارجی Canvas نگه داشته شد.
- مادی‌سازی سند Canvas از `src/gateway/canvas-documents.ts` به `extensions/canvas/src/documents.ts` منتقل شد.
- پیاده‌سازی CLI مربوط به Canvas و کمک‌کننده‌های JSONL مربوط به A2UI به `extensions/canvas/src/cli.ts` منتقل شدند.
- URL میزبان Canvas و کمک‌کننده‌های قابلیت دامنه‌دار به `extensions/canvas/src` منتقل شدند.
- پیش‌فرض‌های فرمان Node مربوط به Canvas از فهرست‌های سخت‌کدشده هسته خارج و به `nodeInvokePolicies` در Plugin منتقل شدند.
- پیکربندی میزبان Canvas متعلق به Plugin در `plugins.entries.canvas.config.host` اضافه شد.
- سرو HTTP مربوط به Canvas و A2UI پشت ثبت مسیر HTTP در Plugin Canvas قرار گرفت.
- dispatch عمومی ارتقای WebSocket برای مسیرهای HTTP متعلق به Plugin اضافه شد.
- URL میزبان ویژه Canvas در Gateway و احراز هویت قابلیت Node با سطح عمومی Plugin میزبانی‌شده و کمک‌کننده‌های قابلیت Node جایگزین شد.
- resolverهای رسانه میزبانی‌شده متعلق به Plugin اضافه شدند تا URLهای سند Canvas به‌جای import کردن داخلیات سند Canvas توسط هسته، از طریق Plugin Canvas resolve شوند.
- `api.registerNodeCliFeature(...)` اضافه شد تا Canvas بتواند `openclaw nodes canvas` را به‌عنوان قابلیت Node متعلق به Plugin اعلام کند، بدون اینکه مسیر فرمان والد را دستی بنویسد.
- importهای production از `extensions/canvas/runtime-api.js` در `src/**` حذف شدند.
- منبع bundle مربوط به A2UI از `apps/shared/OpenClawKit/Tools/CanvasA2UI` به `extensions/canvas/src/host/a2ui-app` منتقل شد.
- پیاده‌سازی build/copy مربوط به A2UI زیر `extensions/canvas/scripts` منتقل شد و سیم‌کشی build ریشه با hookهای دارایی عمومی Plugin همراه جایگزین شد.
- alias پیکربندی قدیمی و سطح‌بالای زمان اجرا `canvasHost` حذف شد.
- مهاجرت doctor مربوط به Canvas نگه داشته شد تا `openclaw doctor --fix` پیکربندی‌های قدیمی `canvasHost` را به `plugins.entries.canvas.config.host` بازنویسی کند.
- سازگاری پروتکل Canvas مربوط به عامل‌های قدیمی پشت پروتکل Gateway نسخه ۴ حذف شد. کلاینت‌های بومی و Gatewayها اکنون فقط از `pluginSurfaceUrls.canvas` به‌همراه `node.pluginSurface.refresh` استفاده می‌کنند؛ مسیر منسوخ `canvasHostUrl`، `canvasCapability`، و `node.canvas.capability.refresh` در این بازآرایی آزمایشی عمداً پشتیبانی نمی‌شود.
- فهرست موجودی تولیدشده Plugin برای شامل کردن Canvas به‌روزرسانی شد.
- مستندات مرجع Plugin در `docs/plugins/reference/canvas.md` اضافه شد.

سطوح شناخته‌شده Canvas که هنوز متعلق به هسته هستند:

- handlerهای Canvas در برنامه بومی زیر `apps/` هنوز عمداً سطح Plugin Canvas را مصرف می‌کنند
- handlerهای پروتکل/کلاینت Canvas در برنامه بومی زیر `apps/`
- خروجی artifact منتشرشده هنوز برای lookup زمان اجرای سازگار با گذشته از `dist/canvas-host/a2ui` استفاده می‌کند، اما گام copy اکنون متعلق به Plugin است

## شکل هدف

`extensions/canvas` باید مالک این موارد باشد:

- manifest و فراداده بسته Plugin
- ثبت ابزار عامل
- سیاست فرمان invoke در Node
- میزبان Canvas و زمان اجرای A2UI
- منبع bundle مربوط به Canvas A2UI و اسکریپت‌های build/copy دارایی
- ایجاد سند Canvas و resolve دارایی
- پیاده‌سازی CLI مربوط به Canvas
- صفحه مستندات Canvas و ورودی فهرست موجودی Plugin

هسته باید فقط مالک seamهای عمومی باشد:

- کشف و ثبت Plugin
- رجیستری عمومی ابزار عامل
- رجیستری عمومی سیاست invoke در Node
- HTTP/auth عمومی Gateway و dispatch ارتقای WebSocket
- resolve عمومی URL سطح Plugin میزبانی‌شده
- ثبت عمومی resolver رسانه میزبانی‌شده
- انتقال عمومی قابلیت Node
- لوله‌کشی عمومی پیکربندی
- کشف عمومی hook دارایی Plugin همراه

برنامه‌های بومی می‌توانند handlerهای فرمان Canvas را به‌عنوان کلاینت‌های پروتکل نگه دارند. آن‌ها مالک زمان اجرای Plugin نیستند.

## گام‌های مهاجرت

1. `plugins.entries.canvas.config.host` را به‌عنوان سطح پیکربندی متعلق به Plugin در نظر بگیرید.
2. مستندات را به‌روزرسانی کنید تا Canvas به‌عنوان یک Plugin همراه آزمایشی توصیف شود.
3. تست‌های متمرکز Canvas، بررسی‌های فهرست موجودی Plugin، بررسی‌های API مربوط به SDK Plugin، و gateهای build/type تحت تأثیر مرزهای زمان اجرا را اجرا کنید.

## چک‌لیست audit

پیش از کامل دانستن بازآرایی:

- `rg "src/canvas-host|../canvas-host"` هیچ import زنده‌ای از منبع برنگرداند.
- `rg "canvas-tool|createCanvasTool" src` هیچ پیاده‌سازی ابزار Canvas متعلق به هسته پیدا نکند.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` هیچ پیش‌فرض allowlist سخت‌کدشده‌ای بیرون از تست‌های عمومی سیاست Plugin پیدا نکند.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` خالی باشد.
- `rg "canvas-documents" src` خالی باشد.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` خالی باشد؛ Plugin Canvas، `openclaw nodes canvas` را از طریق فراداده تودرتوی CLI مربوط به Plugin ثبت می‌کند.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` هیچ مالکیت زمان اجرای Gateway برنگرداند.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` فقط wrapperهای سازگاری یا مسیرهای متعلق به Plugin را پیدا کند.
- `pnpm plugins:inventory:check` قبول شود.
- `pnpm plugin-sdk:api:check` قبول شود، یا baselineهای API تولیدشده عمداً به‌روزرسانی و بازبینی شده باشند.
- تست‌های هدفمند Canvas قبول شوند.
- تست‌های changed-lanes برای مسیرهای میزبان Canvas/A2UI قبول شوند.
- متن PR صریحاً بگوید Canvas آزمایشی و متکی بر Plugin است.

## فرمان‌های راستی‌آزمایی

هنگام تکرار، از بررسی‌های هدفمند محلی استفاده کنید:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

اگر barrel زمان اجرا، import تنبل، بسته‌بندی، یا سطوح منتشرشده Plugin تغییر کرد، پیش از push، `pnpm build` را اجرا کنید.
