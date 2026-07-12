---
read_when:
    - می‌خواهید از انتقال‌دهنده‌های مدل OpenClaw در برنامه‌ای دیگر دوباره استفاده کنید
    - شما در حال تغییر `packages/ai` یا درگاه‌های میزبان انتقال هوش مصنوعی هستید
    - شما در حال بررسی این هستید که انتشار OpenClaw، افزون بر بستهٔ اصلی، چه چیزهایی را در npm منتشر می‌کند.
summary: 'بستهٔ npm با نام @openclaw/ai: انتقال‌دهنده‌های قابل‌استفادهٔ مجدد مدل، محیط‌های اجرای ایزوله و درگاه‌های سیاست میزبان'
title: بستهٔ @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T10:44:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` شکل کتابخانه‌ای قابل‌انتشارِ لایه اجرای مدل OpenClaw است:
قراردادهای مستقل از ارائه‌دهنده برای پیام، ابزار و جریان؛ اعتبارسنجی، عیب‌یابی،
جریان‌های رویداد، یک رجیستری زمان‌اجرای ایزوله و آداپتورهای با بارگذاری تنبل برای
هشت خانواده API داخلی (Anthropic Messages، OpenAI Completions، OpenAI
Responses، Azure OpenAI Responses، ChatGPT/Codex Responses، Google Generative
AI، Google Vertex، Mistral Conversations).

این کتابخانه در هر انتشار، همراه با بسته اصلی `openclaw` و با همان نسخه ثابت‌شده
منتشر می‌شود و `npm-shrinkwrap.json` مختص خود را دارد تا درخت وابستگی‌های
انتقالی آن هنگام نصب قفل شود. نصب `openclaw` نسخه منطبق `@openclaw/ai` را
به‌طور خودکار نصب می‌کند؛ مصرف‌کنندگان کتابخانه نیز می‌توانند بدون هیچ‌گونه کد
برنامه OpenClaw مستقیماً به آن وابسته باشند.

## شروع سریع

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

نسخه‌ای قابل‌اجرا در مسیر `examples/ai-chat` مخزن قرار دارد.

## قرارداد طراحی

- **به‌طور پیش‌فرض محدود به نمونه است.** واردکردن بسته هیچ چیزی را به‌صورت
  سراسری ثبت نمی‌کند. `createApiRegistry()` / `createLlmRuntime()` نمونه‌های
  ایزوله برمی‌گردانند؛ `registerBuiltInApiProviders(registry)` ترابری‌های داخلی
  را برای یک رجیستری فعال می‌کند. ماژول‌های SDK ارائه‌دهندگان در نخستین استفاده
  به‌صورت تنبل بارگذاری می‌شوند.
- **سیاست میزبان تزریق می‌شود، نه اینکه در بسته گنجانده شود.** محافظت از واکشی
  درخواست‌ها (برای مثال، سیاست SSRF)، حذف اسرار از متن بازپخش نتیجه ابزار،
  پیش‌فرض‌های ابزار سخت‌گیرانه OpenAI و ثبت گزارش‌های عیب‌یابی، درگاه‌های
  `AiTransportHost` هستند که با `configureAiTransportHost` پیکربندی می‌شوند.
  پیش‌فرض‌های کتابخانه غیرفعال‌اند؛ OpenClaw پیاده‌سازی‌های واقعی خود را در
  نمای جریان نصب می‌کند.
- **یک هویت واحد برای جریان رویداد.** `@openclaw/ai/event-stream` سازنده
  معیار `EventStream` است که میان هسته OpenClaw، agent-core و مصرف‌کنندگان
  خارجی به‌اشتراک گذاشته می‌شود.
- **زیرمسیرهای `internal/*` جزو API نیستند.** این زیرمسیرها برای خود برنامه
  OpenClaw وجود دارند و هیچ تضمین semver ندارند.
- شناسه‌های ارائه‌دهنده، اطلاعات احراز هویت، کاتالوگ‌های مدل، تلاش‌های مجدد و
  جایگزینی پس از خرابی همچنان دغدغه‌های برنامه هستند. OpenClaw این لایه‌ها را
  پیرامون این بسته قرار می‌دهد؛ مصرف‌کننده کتابخانه یک شیء `Model` و گزینه‌ها
  را مستقیماً ارائه می‌کند.

## خروجی‌های زیرمسیر

| زیرمسیر          | محتوا                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| `.`              | قراردادها، `createApiRegistry`، `createLlmRuntime`، `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`، `resetApiProviders`                            |
| `./types`        | انواع مدل، پیام، ابزار و جریان                                                |
| `./validation`   | اعتبارسنجی آرگومان‌های ابزار                                                  |
| `./diagnostics`  | قراردادهای عیب‌یابی                                                           |
| `./event-stream` | پیاده‌سازی مشترک `EventStream`                                                |
| `./internal/*`   | داخلی OpenClaw، بدون تضمین semver                                             |
