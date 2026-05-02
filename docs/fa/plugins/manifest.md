---
read_when:
    - شما در حال ساخت یک Plugin برای OpenClaw هستید
    - لازم است یک طرح‌وارهٔ پیکربندی Plugin منتشر کنید یا خطاهای اعتبارسنجی Plugin را اشکال‌زدایی کنید
summary: الزامات مانیفست Plugin و طرحواره JSON (اعتبارسنجی سخت‌گیرانه پیکربندی)
title: مانیفست Plugin
x-i18n:
    generated_at: "2026-05-02T11:56:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9cb6eff8d35cbd819178be9885801e2b84ad29cd12bbfd2f630467914366e4
    source_path: plugins/manifest.md
    workflow: 16
---

این صفحه فقط برای **manifest بومی Plugin در OpenClaw** است.

برای چیدمان‌های بستهٔ سازگار، [بسته‌های Plugin](/fa/plugins/bundles) را ببینید.

قالب‌های بستهٔ سازگار از فایل‌های manifest متفاوتی استفاده می‌کنند:

- بستهٔ Codex: `.codex-plugin/plugin.json`
- بستهٔ Claude: `.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفهٔ Claude
  بدون manifest
- بستهٔ Cursor: `.cursor-plugin/plugin.json`

OpenClaw این چیدمان‌های بسته را هم به‌صورت خودکار شناسایی می‌کند، اما آن‌ها در برابر
شِمای `openclaw.plugin.json` که اینجا توضیح داده شده اعتبارسنجی نمی‌شوند.

برای بسته‌های سازگار، OpenClaw در حال حاضر فرادادهٔ بسته به‌همراه ریشه‌های
Skills اعلام‌شده، ریشه‌های فرمان Claude، پیش‌فرض‌های `settings.json` بستهٔ Claude،
پیش‌فرض‌های LSP بستهٔ Claude، و بسته‌های hook پشتیبانی‌شده را وقتی چیدمان با
انتظارات runtime در OpenClaw همخوان باشد می‌خواند.

هر Plugin بومی OpenClaw **باید** یک فایل `openclaw.plugin.json` را در
**ریشهٔ Plugin** ارائه کند. OpenClaw از این manifest برای اعتبارسنجی پیکربندی
**بدون اجرای کد Plugin** استفاده می‌کند. manifestهای ناموجود یا نامعتبر به‌عنوان
خطاهای Plugin در نظر گرفته می‌شوند و اعتبارسنجی پیکربندی را مسدود می‌کنند.

راهنمای کامل سامانهٔ Plugin را ببینید: [Pluginها](/fa/tools/plugin).
برای مدل قابلیت بومی و راهنمای فعلی سازگاری خارجی:
[مدل قابلیت](/fa/plugins/architecture#public-capability-model).

## این فایل چه می‌کند

`openclaw.plugin.json` فراداده‌ای است که OpenClaw **پیش از بارگذاری کد
Plugin شما** می‌خواند. همهٔ موارد زیر باید آن‌قدر سبک باشند که بدون راه‌اندازی
runtime Plugin قابل بررسی باشند.

**برای این موارد از آن استفاده کنید:**

- هویت Plugin، اعتبارسنجی پیکربندی، و راهنماهای UI پیکربندی
- فرادادهٔ احراز هویت، onboarding، و setup (alias، فعال‌سازی خودکار، متغیرهای محیطی provider، گزینه‌های احراز هویت)
- راهنماهای فعال‌سازی برای سطح‌های control-plane
- مالکیت کوتاه‌نوشت خانوادهٔ مدل
- snapshotهای ایستای مالکیت قابلیت (`contracts`)
- فرادادهٔ runner برای QA که میزبان مشترک `openclaw qa` بتواند بررسی کند
- فرادادهٔ پیکربندی مختص کانال که در catalog و سطح‌های اعتبارسنجی ادغام می‌شود

**برای این موارد از آن استفاده نکنید:** ثبت رفتار runtime، اعلام entrypointهای کد،
یا فرادادهٔ نصب npm. این موارد به کد Plugin شما و `package.json` تعلق دارند.

## نمونهٔ حداقلی

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## نمونهٔ کامل‌تر

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## مرجع فیلدهای سطح بالا

| فیلد                                | الزامی | نوع                             | معنی آن                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | بله      | `string`                         | شناسهٔ متعارف Plugin. این همان شناسه‌ای است که در `plugins.entries.<id>` استفاده می‌شود.                                                                                                                                                                 |
| `configSchema`                       | بله      | `object`                         | JSON Schema درون‌خطی برای پیکربندی این Plugin.                                                                                                                                                                                        |
| `enabledByDefault`                   | خیر       | `true`                           | یک Plugin باندل‌شده را به‌طور پیش‌فرض فعال‌شده علامت‌گذاری می‌کند. برای غیرفعال نگه داشتن Plugin به‌طور پیش‌فرض، آن را حذف کنید، یا هر مقدار غیر از `true` تنظیم کنید.                                                                                                        |
| `legacyPluginIds`                    | خیر       | `string[]`                       | شناسه‌های قدیمی که به این شناسهٔ متعارف Plugin نرمال‌سازی می‌شوند.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده‌ای که وقتی ارجاع‌های احراز هویت، پیکربندی، یا مدل به آن‌ها اشاره کنند، باید این Plugin را به‌طور خودکار فعال کنند.                                                                                                                                     |
| `kind`                               | خیر       | `"memory"` \| `"context-engine"` | نوع انحصاری Plugin را اعلام می‌کند که توسط `plugins.slots.*` استفاده می‌شود.                                                                                                                                                                        |
| `channels`                           | خیر       | `string[]`                       | شناسه‌های کانال متعلق به این Plugin. برای کشف و اعتبارسنجی پیکربندی استفاده می‌شود.                                                                                                                                                         |
| `providers`                          | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده متعلق به این Plugin.                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | خیر       | `string`                         | مسیر سبک ماژول کشف ارائه‌دهنده، نسبت به ریشهٔ Plugin، برای فرادادهٔ کاتالوگ ارائه‌دهنده در محدودهٔ manifest که می‌تواند بدون فعال‌سازی کامل runtime Plugin بارگذاری شود.                                               |
| `modelSupport`                       | خیر       | `object`                         | فرادادهٔ کوتاه‌شدهٔ خانوادهٔ مدل که مالکیت آن با manifest است و برای بارگذاری خودکار Plugin پیش از runtime استفاده می‌شود.                                                                                                                                         |
| `modelCatalog`                       | خیر       | `object`                         | فرادادهٔ اعلانی کاتالوگ مدل برای ارائه‌دهنده‌هایی که مالکیتشان با این Plugin است. این قرارداد control-plane برای فهرست‌کردن فقط‌خواندنی آینده، onboarding، انتخاب‌گرهای مدل، نام‌های مستعار، و سرکوب بدون بارگذاری runtime Plugin است.         |
| `modelPricing`                       | خیر       | `object`                         | سیاست جست‌وجوی قیمت‌گذاری خارجی تحت مالکیت ارائه‌دهنده. از آن برای خارج‌کردن ارائه‌دهنده‌های محلی/خودمیزبان از کاتالوگ‌های قیمت‌گذاری راه‌دور، یا نگاشت ارجاع‌های ارائه‌دهنده به شناسه‌های کاتالوگ OpenRouter/LiteLLM بدون hardcode کردن شناسه‌های ارائه‌دهنده در core استفاده کنید.             |
| `modelIdNormalization`               | خیر       | `object`                         | پاک‌سازی نام مستعار/پیشوند شناسهٔ مدل تحت مالکیت ارائه‌دهنده که باید پیش از بارگذاری runtime ارائه‌دهنده اجرا شود.                                                                                                                                           |
| `providerEndpoints`                  | خیر       | `object[]`                       | فرادادهٔ میزبان/baseUrl نقطهٔ پایانی تحت مالکیت manifest برای مسیرهای ارائه‌دهنده که core باید پیش از بارگذاری runtime ارائه‌دهنده طبقه‌بندی کند.                                                                                                            |
| `providerRequest`                    | خیر       | `object`                         | فرادادهٔ سبک خانوادهٔ ارائه‌دهنده و سازگاری درخواست که پیش از بارگذاری runtime ارائه‌دهنده توسط سیاست عمومی درخواست استفاده می‌شود.                                                                                                              |
| `cliBackends`                        | خیر       | `string[]`                       | شناسه‌های backend استنتاج CLI متعلق به این Plugin. برای فعال‌سازی خودکار هنگام راه‌اندازی از ارجاع‌های صریح پیکربندی استفاده می‌شود.                                                                                                                         |
| `syntheticAuthRefs`                  | خیر       | `string[]`                       | ارجاع‌های ارائه‌دهنده یا backend CLI که hook احراز هویت مصنوعی متعلق به Plugin آن‌ها باید هنگام کشف سرد مدل پیش از بارگذاری runtime بررسی شود.                                                                                              |
| `nonSecretAuthMarkers`               | خیر       | `string[]`                       | مقادیر placeholder کلید API متعلق به Plugin باندل‌شده که وضعیت اعتبارنامهٔ غیرمحرمانهٔ محلی، OAuth، یا محیطی را نشان می‌دهند.                                                                                                                |
| `commandAliases`                     | خیر       | `object[]`                       | نام‌های دستور متعلق به این Plugin که باید پیش از بارگذاری runtime، تشخیص‌های پیکربندی و CLI آگاه از Plugin تولید کنند.                                                                                                                |
| `providerAuthEnvVars`                | خیر       | `Record<string, string[]>`       | فرادادهٔ env سازگاری منسوخ برای جست‌وجوی احراز هویت/وضعیت ارائه‌دهنده. برای Pluginهای جدید `setup.providers[].envVars` را ترجیح دهید؛ OpenClaw همچنان در بازهٔ منسوخ‌سازی این را می‌خواند.                                                 |
| `providerAuthAliases`                | خیر       | `Record<string, string>`         | شناسه‌های ارائه‌دهنده‌ای که باید برای جست‌وجوی احراز هویت از شناسهٔ ارائه‌دهندهٔ دیگری دوباره استفاده کنند، برای مثال ارائه‌دهندهٔ کدنویسی که کلید API ارائه‌دهندهٔ پایه و پروفایل‌های احراز هویت را به اشتراک می‌گذارد.                                                                          |
| `channelEnvVars`                     | خیر       | `Record<string, string[]>`       | فرادادهٔ سبک env کانال که OpenClaw می‌تواند بدون بارگذاری کد Plugin بررسی کند. از این برای راه‌اندازی کانال مبتنی بر env یا سطوح احراز هویتی استفاده کنید که کمک‌کننده‌های عمومی راه‌اندازی/پیکربندی باید ببینند.                                            |
| `providerAuthChoices`                | خیر       | `object[]`                       | فرادادهٔ سبک انتخاب احراز هویت برای انتخاب‌گرهای onboarding، حل ارائه‌دهندهٔ ترجیحی، و اتصال سادهٔ پرچم CLI.                                                                                                                       |
| `activation`                         | خیر       | `object`                         | فرادادهٔ سبک برنامه‌ریز فعال‌سازی برای بارگذاری برانگیخته‌شده توسط راه‌اندازی، ارائه‌دهنده، دستور، کانال، مسیر، و قابلیت. فقط فراداده است؛ runtime Plugin همچنان مالک رفتار واقعی است.                                                       |
| `setup`                              | خیر       | `object`                         | توصیف‌گرهای سبک setup/onboarding که سطوح کشف و راه‌اندازی می‌توانند بدون بارگذاری runtime Plugin بررسی کنند.                                                                                                                    |
| `qaRunners`                          | خیر       | `object[]`                       | توصیف‌گرهای سبک runner تضمین کیفیت که پیش از بارگذاری runtime Plugin توسط میزبان مشترک `openclaw qa` استفاده می‌شوند.                                                                                                                                      |
| `contracts`                          | خیر       | `object`                         | snapshot ایستای مالکیت قابلیت برای hookهای احراز هویت خارجی، گفتار، رونویسی realtime، صدای realtime، درک رسانه، تولید تصویر، تولید موسیقی، تولید ویدئو، web-fetch، جست‌وجوی وب، و مالکیت ابزار. |
| `mediaUnderstandingProviderMetadata` | خیر       | `Record<string, object>`         | پیش‌فرض‌های سبک درک رسانه برای شناسه‌های ارائه‌دهندهٔ اعلام‌شده در `contracts.mediaUnderstandingProviders`.                                                                                                                            |
| `imageGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ سبک احراز هویت تولید تصویر برای شناسه‌های ارائه‌دهندهٔ اعلام‌شده در `contracts.imageGenerationProviders`، شامل نام‌های مستعار احراز هویت و guardهای base-url تحت مالکیت ارائه‌دهنده.                                                                  |
| `videoGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ سبک احراز هویت تولید ویدئو برای شناسه‌های ارائه‌دهندهٔ اعلام‌شده در `contracts.videoGenerationProviders`، شامل نام‌های مستعار احراز هویت و guardهای base-url تحت مالکیت ارائه‌دهنده.                                                                  |
| `musicGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ سبک احراز هویت تولید موسیقی برای شناسه‌های ارائه‌دهندهٔ اعلام‌شده در `contracts.musicGenerationProviders`، شامل نام‌های مستعار احراز هویت و guardهای base-url تحت مالکیت ارائه‌دهنده.                                                                  |
| `toolMetadata`                       | خیر       | `Record<string, object>`         | فرادادهٔ سبک دسترس‌پذیری برای ابزارهای متعلق به Plugin که در `contracts.tools` اعلام شده‌اند. وقتی ابزاری نباید runtime را بارگذاری کند مگر اینکه شواهد پیکربندی، env، یا احراز هویت وجود داشته باشد، از آن استفاده کنید.                                                           |
| `channelConfigs`                     | خیر       | `Record<string, object>`         | فرادادهٔ پیکربندی کانال تحت مالکیت manifest که پیش از بارگذاری runtime در سطوح کشف و اعتبارسنجی ادغام می‌شود.                                                                                                                          |
| `skills`                             | خیر       | `string[]`                       | دایرکتوری‌های Skills برای بارگذاری، نسبت به ریشهٔ Plugin.                                                                                                                                                                             |
| `name`                               | خیر       | `string`                         | نام خوانای انسانی Plugin.                                                                                                                                                                                                         |
| `description`                        | خیر       | `string`                         | خلاصه‌ای کوتاه که در سطوح Plugin نمایش داده می‌شود.                                                                                                                                                                                             |
| `version`                            | خیر       | `string`                         | نسخهٔ اطلاعاتی Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | خیر       | `Record<string, object>`         | برچسب‌های رابط کاربری، جای‌نگهدارها، و راهنمایی‌های حساسیت برای فیلدهای پیکربندی.                                                                                                                                                                   |

## مرجع فرادادهٔ ارائه‌دهندهٔ تولید

فیلدهای فرادادهٔ ارائه‌دهندهٔ تولید، سیگنال‌های احراز هویت ایستا را برای
ارائه‌دهنده‌هایی توصیف می‌کنند که در فهرست متناظر `contracts.*GenerationProviders` اعلام شده‌اند.
OpenClaw این فیلدها را پیش از بارگذاری زمان‌اجرای ارائه‌دهنده می‌خواند تا ابزارهای هسته بتوانند
بدون وارد کردن همهٔ Pluginهای ارائه‌دهنده تصمیم بگیرند آیا یک ارائه‌دهندهٔ تولید در دسترس است یا نه.

از این فیلدها فقط برای واقعیت‌های ارزان و اعلانی استفاده کنید. انتقال، تبدیل‌های درخواست،
نوسازی توکن، اعتبارسنجی اعتبارنامه، و رفتار واقعی تولید
در زمان‌اجرای Plugin باقی می‌مانند.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

هر ورودی فراداده از این موارد پشتیبانی می‌کند:

| فیلد            | الزامی | نوع        | معنا                                                                                                                                 |
| --------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | خیر    | `string[]` | شناسه‌های ارائه‌دهندهٔ اضافی که باید به‌عنوان نام‌های مستعار احراز هویت ایستا برای ارائه‌دهندهٔ تولید به حساب بیایند.               |
| `authProviders` | خیر    | `string[]` | شناسه‌های ارائه‌دهنده‌ای که پروفایل‌های احراز هویت پیکربندی‌شدهٔ آن‌ها باید برای این ارائه‌دهندهٔ تولید احراز هویت محسوب شوند.     |
| `configSignals` | خیر    | `object[]` | سیگنال‌های ارزان و فقط مبتنی بر پیکربندی برای ارائه‌دهنده‌های محلی یا خودمیزبان که می‌توانند بدون پروفایل احراز هویت یا متغیر محیطی پیکربندی شوند. |
| `authSignals`   | خیر    | `object[]` | سیگنال‌های صریح احراز هویت. وقتی وجود داشته باشند، این‌ها مجموعهٔ سیگنال پیش‌فرض حاصل از شناسهٔ ارائه‌دهنده، `aliases`، و `authProviders` را جایگزین می‌کنند. |

هر ورودی `configSignals` از این موارد پشتیبانی می‌کند:

| فیلد          | الزامی | نوع        | معنا                                                                                                                                                                                    |
| ------------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | بله    | `string`   | مسیر نقطه‌ای به شیء پیکربندیِ متعلق به Plugin برای بررسی، برای مثال `plugins.entries.example.config`.                                                                                 |
| `overlayPath` | خیر    | `string`   | مسیر نقطه‌ای داخل پیکربندی ریشه که شیء آن باید پیش از ارزیابی سیگنال، روی شیء ریشه اعمال شود. از این برای پیکربندی مختص قابلیت مانند `image`، `video`، یا `music` استفاده کنید. |
| `required`    | خیر    | `string[]` | مسیرهای نقطه‌ای داخل پیکربندی مؤثر که باید مقدار پیکربندی‌شده داشته باشند. رشته‌ها باید غیرخالی باشند؛ شیءها و آرایه‌ها نباید خالی باشند.                                           |
| `requiredAny` | خیر    | `string[]` | مسیرهای نقطه‌ای داخل پیکربندی مؤثر که دست‌کم یکی از آن‌ها باید مقدار پیکربندی‌شده داشته باشد.                                                                                         |
| `mode`        | خیر    | `object`   | محافظ اختیاری حالت رشته‌ای داخل پیکربندی مؤثر. از این زمانی استفاده کنید که دسترس‌پذیری فقط مبتنی بر پیکربندی فقط برای یک حالت اعمال می‌شود.                                       |

هر محافظ `mode` از این موارد پشتیبانی می‌کند:

| فیلد         | الزامی | نوع        | معنا                                                                                 |
| ------------ | ------ | ---------- | ------------------------------------------------------------------------------------ |
| `path`       | خیر    | `string`   | مسیر نقطه‌ای داخل پیکربندی مؤثر. مقدار پیش‌فرض `mode` است.                          |
| `default`    | خیر    | `string`   | مقدار حالت برای استفاده وقتی پیکربندی مسیر را حذف کرده است.                         |
| `allowed`    | خیر    | `string[]` | اگر وجود داشته باشد، سیگنال فقط وقتی عبور می‌کند که حالت مؤثر یکی از این مقدارها باشد. |
| `disallowed` | خیر    | `string[]` | اگر وجود داشته باشد، سیگنال وقتی شکست می‌خورد که حالت مؤثر یکی از این مقدارها باشد.   |

هر ورودی `authSignals` از این موارد پشتیبانی می‌کند:

| فیلد              | الزامی | نوع      | معنا                                                                                                                                                                  |
| ----------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | بله    | `string` | شناسهٔ ارائه‌دهنده برای بررسی در پروفایل‌های احراز هویت پیکربندی‌شده.                                                                                                |
| `providerBaseUrl` | خیر    | `object` | محافظ اختیاری که باعث می‌شود سیگنال فقط وقتی حساب شود که ارائه‌دهندهٔ پیکربندی‌شدهٔ ارجاع‌شده از یک URL پایهٔ مجاز استفاده کند. از این زمانی استفاده کنید که یک نام مستعار احراز هویت فقط برای APIهای خاص معتبر است. |

هر محافظ `providerBaseUrl` از این موارد پشتیبانی می‌کند:

| فیلد              | الزامی | نوع        | معنا                                                                                                                                             |
| ----------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | بله    | `string`   | شناسهٔ پیکربندی ارائه‌دهنده که `baseUrl` آن باید بررسی شود.                                                                                     |
| `defaultBaseUrl`  | خیر    | `string`   | URL پایه‌ای که وقتی پیکربندی ارائه‌دهنده `baseUrl` را حذف کرده است باید فرض شود.                                                                |
| `allowedBaseUrls` | بله    | `string[]` | URLهای پایهٔ مجاز برای این سیگنال احراز هویت. وقتی URL پایهٔ پیکربندی‌شده یا پیش‌فرض با یکی از این مقدارهای نرمال‌سازی‌شده مطابقت نداشته باشد، سیگنال نادیده گرفته می‌شود. |

## مرجع فرادادهٔ ابزار

`toolMetadata` از همان شکل‌های `configSignals` و `authSignals` مانند
فرادادهٔ ارائه‌دهندهٔ تولید استفاده می‌کند، با کلیدگذاری بر اساس نام ابزار. `contracts.tools` مالکیت را اعلام می‌کند.
`toolMetadata` شواهد ارزان دسترس‌پذیری را اعلام می‌کند تا OpenClaw بتواند
از وارد کردن زمان‌اجرای Plugin فقط برای اینکه کارخانهٔ ابزار آن `null` برگرداند پرهیز کند.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

اگر ابزاری `toolMetadata` نداشته باشد، OpenClaw رفتار موجود را حفظ می‌کند و
وقتی قرارداد ابزار با سیاست مطابقت داشته باشد، Plugin مالک را بارگذاری می‌کند. برای ابزارهای مسیر داغ
که کارخانهٔ آن‌ها به احراز هویت/پیکربندی وابسته است، نویسندگان Plugin باید
به‌جای اینکه هسته را وادار کنند زمان‌اجرا را برای پرس‌وجو وارد کند، `toolMetadata` اعلام کنند.

## مرجع providerAuthChoices

هر ورودی `providerAuthChoices` یک گزینهٔ راه‌اندازی اولیه یا احراز هویت را توصیف می‌کند.
OpenClaw این را پیش از بارگذاری زمان‌اجرای ارائه‌دهنده می‌خواند.
فهرست‌های راه‌اندازی ارائه‌دهنده از این گزینه‌های manifest، گزینه‌های راه‌اندازی مشتق‌شده از توصیفگر،
و فرادادهٔ کاتالوگ نصب بدون بارگذاری زمان‌اجرای ارائه‌دهنده استفاده می‌کنند.

| فیلد                  | الزامی | نوع                                             | معنا                                                                                                  |
| --------------------- | ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | بله    | `string`                                        | شناسهٔ ارائه‌دهنده‌ای که این گزینه به آن تعلق دارد.                                                   |
| `method`              | بله    | `string`                                        | شناسهٔ روش احراز هویت برای ارسال به آن.                                                               |
| `choiceId`            | بله    | `string`                                        | شناسهٔ پایدار گزینهٔ احراز هویت که توسط جریان‌های راه‌اندازی اولیه و CLI استفاده می‌شود.              |
| `choiceLabel`         | خیر    | `string`                                        | برچسب قابل مشاهده برای کاربر. اگر حذف شود، OpenClaw به `choiceId` برمی‌گردد.                         |
| `choiceHint`          | خیر    | `string`                                        | متن راهنمای کوتاه برای انتخابگر.                                                                      |
| `assistantPriority`   | خیر    | `number`                                        | مقدارهای کمتر در انتخابگرهای تعاملی هدایت‌شده توسط دستیار زودتر مرتب می‌شوند.                        |
| `assistantVisibility` | خیر    | `"visible"` \| `"manual-only"`                  | گزینه را از انتخابگرهای دستیار پنهان می‌کند، در حالی که همچنان انتخاب دستی CLI را مجاز نگه می‌دارد.  |
| `deprecatedChoiceIds` | خیر    | `string[]`                                      | شناسه‌های گزینهٔ قدیمی که باید کاربران را به این گزینهٔ جایگزین هدایت کنند.                           |
| `groupId`             | خیر    | `string`                                        | شناسهٔ گروه اختیاری برای گروه‌بندی گزینه‌های مرتبط.                                                   |
| `groupLabel`          | خیر    | `string`                                        | برچسب قابل مشاهده برای کاربر برای آن گروه.                                                            |
| `groupHint`           | خیر    | `string`                                        | متن راهنمای کوتاه برای گروه.                                                                          |
| `optionKey`           | خیر    | `string`                                        | کلید گزینهٔ داخلی برای جریان‌های احراز هویت سادهٔ تک‌پرچمی.                                           |
| `cliFlag`             | خیر    | `string`                                        | نام پرچم CLI، مانند `--openrouter-api-key`.                                                           |
| `cliOption`           | خیر    | `string`                                        | شکل کامل گزینهٔ CLI، مانند `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | خیر    | `string`                                        | توضیحی که در راهنمای CLI استفاده می‌شود.                                                              |
| `onboardingScopes`    | خیر    | `Array<"text-inference" \| "image-generation">` | اینکه این گزینه باید در کدام سطح‌های راه‌اندازی اولیه ظاهر شود. اگر حذف شود، مقدار پیش‌فرض آن `["text-inference"]` است. |

## مرجع commandAliases

برای زمانی از `commandAliases` استفاده کنید که یک Plugin مالک نام فرمان زمان اجرا است که کاربران ممکن است به‌اشتباه آن را در `plugins.allow` قرار دهند یا تلاش کنند آن را به‌عنوان فرمان ریشه CLI اجرا کنند. OpenClaw از این فراداده برای عیب‌یابی بدون وارد کردن کد زمان اجرای Plugin استفاده می‌کند.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| فیلد        | الزامی | نوع              | معنی آن                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | بله      | `string`          | نام فرمانی که به این Plugin تعلق دارد.                               |
| `kind`       | خیر       | `"runtime-slash"` | نام مستعار را به‌عنوان فرمان اسلش چت، نه فرمان ریشه CLI، مشخص می‌کند. |
| `cliCommand` | خیر       | `string`          | فرمان ریشه CLI مرتبط برای پیشنهاد در عملیات CLI، اگر وجود داشته باشد.  |

## مرجع activation

زمانی از `activation` استفاده کنید که Plugin بتواند با هزینه کم اعلام کند کدام رویدادهای صفحه کنترل باید آن را در طرح activation/بارگذاری وارد کنند.

این بلوک فراداده برنامه‌ریز است، نه API چرخه حیات. رفتار زمان اجرا را ثبت نمی‌کند، جایگزین `register(...)` نمی‌شود، و تضمین نمی‌کند که کد Plugin از قبل اجرا شده باشد. برنامه‌ریز activation از این فیلدها برای محدود کردن Pluginهای نامزد پیش از بازگشت به فراداده مالکیت manifest موجود مانند `providers`، `channels`، `commandAliases`، `setup.providers`، `contracts.tools` و hookها استفاده می‌کند.

باریک‌ترین فراداده‌ای را ترجیح دهید که از قبل مالکیت را توصیف می‌کند. وقتی آن فیلدها رابطه را بیان می‌کنند، از `providers`، `channels`، `commandAliases`، توصیفگرهای setup، یا `contracts` استفاده کنید. از `activation` برای سرنخ‌های اضافی برنامه‌ریز استفاده کنید که با آن فیلدهای مالکیت قابل نمایش نیستند.
برای نام‌های مستعار زمان اجرای CLI مانند `claude-cli`، `codex-cli`، یا `google-gemini-cli` از `cliBackends` سطح بالا استفاده کنید؛ `activation.onAgentHarnesses` فقط برای شناسه‌های harness عامل تعبیه‌شده است که از قبل فیلد مالکیت ندارند.

این بلوک فقط فراداده است. رفتار زمان اجرا را ثبت نمی‌کند، و جایگزین `register(...)`، `setupEntry`، یا دیگر نقطه‌های ورود زمان اجرا/Plugin نمی‌شود. مصرف‌کنندگان فعلی از آن به‌عنوان سرنخ محدودسازی پیش از بارگذاری گسترده‌تر Plugin استفاده می‌کنند، بنابراین نبود فراداده activation غیرراه‌اندازی معمولاً فقط هزینه عملکرد دارد؛ تا زمانی که fallbackهای مالکیت manifest هنوز وجود دارند، نباید درستی را تغییر دهد.

هر Plugin باید `activation.onStartup` را آگاهانه تنظیم کند. فقط زمانی آن را روی `true` بگذارید که Plugin باید هنگام راه‌اندازی Gateway اجرا شود. وقتی Plugin در راه‌اندازی غیرفعال است و فقط باید از محرک‌های باریک‌تر بارگذاری شود، آن را روی `false` بگذارید. حذف `onStartup` دیگر به‌طور ضمنی Plugin را هنگام راه‌اندازی بارگذاری نمی‌کند؛ برای محرک‌های startup، channel، config، agent-harness، memory، یا دیگر محرک‌های باریک‌تر activation از فراداده activation صریح استفاده کنید.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| فیلد              | الزامی | نوع                                                 | معنی آن                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | خیر       | `boolean`                                            | activation صریح برای راه‌اندازی Gateway. هر Plugin باید این را تنظیم کند. `true` Plugin را هنگام startup وارد می‌کند؛ `false` آن را در startup تنبل نگه می‌دارد مگر اینکه محرک منطبق دیگری بارگذاری را لازم کند. |
| `onProviders`      | خیر       | `string[]`                                           | شناسه‌های provider که باید این Plugin را در طرح‌های activation/بارگذاری وارد کنند.                                                                                                                      |
| `onAgentHarnesses` | خیر       | `string[]`                                           | شناسه‌های زمان اجرای harness عامل تعبیه‌شده که باید این Plugin را در طرح‌های activation/بارگذاری وارد کنند. برای نام‌های مستعار backend CLI از `cliBackends` سطح بالا استفاده کنید.                                           |
| `onCommands`       | خیر       | `string[]`                                           | شناسه‌های فرمانی که باید این Plugin را در طرح‌های activation/بارگذاری وارد کنند.                                                                                                                       |
| `onChannels`       | خیر       | `string[]`                                           | شناسه‌های channel که باید این Plugin را در طرح‌های activation/بارگذاری وارد کنند.                                                                                                                       |
| `onRoutes`         | خیر       | `string[]`                                           | گونه‌های route که باید این Plugin را در طرح‌های activation/بارگذاری وارد کنند.                                                                                                                       |
| `onConfigPaths`    | خیر       | `string[]`                                           | مسیرهای config نسبی به root که وقتی مسیر وجود دارد و به‌طور صریح غیرفعال نشده است، باید این Plugin را در طرح‌های startup/بارگذاری وارد کنند.                                                      |
| `onCapabilities`   | خیر       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | سرنخ‌های قابلیت گسترده که برنامه‌ریزی activation صفحه کنترل از آن‌ها استفاده می‌کند. در صورت امکان، فیلدهای باریک‌تر را ترجیح دهید.                                                                                     |

مصرف‌کنندگان زنده فعلی:

- برنامه‌ریزی startup Gateway از `activation.onStartup` برای import صریح هنگام startup استفاده می‌کند
- برنامه‌ریزی CLI تحریک‌شده با فرمان به `commandAliases[].cliCommand` یا `commandAliases[].name` قدیمی fallback می‌کند
- برنامه‌ریزی startup زمان اجرای عامل از `activation.onAgentHarnesses` برای harnessهای تعبیه‌شده و از `cliBackends[]` سطح بالا برای نام‌های مستعار زمان اجرای CLI استفاده می‌کند
- برنامه‌ریزی setup/channel تحریک‌شده با channel، وقتی فراداده activation صریح channel موجود نیست، به مالکیت `channels[]` قدیمی fallback می‌کند
- برنامه‌ریزی startup Plugin از `activation.onConfigPaths` برای سطح‌های config ریشه غیر-channel مانند بلوک `browser` مربوط به Plugin مرورگر همراه استفاده می‌کند
- برنامه‌ریزی setup/runtime تحریک‌شده با provider، وقتی فراداده activation صریح provider موجود نیست، به مالکیت `providers[]` و `cliBackends[]` سطح بالا fallback می‌کند

عیب‌یابی‌های برنامه‌ریز می‌توانند سرنخ‌های activation صریح را از fallback مالکیت manifest تفکیک کنند. برای مثال، `activation-command-hint` یعنی `activation.onCommands` منطبق شده است، در حالی که `manifest-command-alias` یعنی برنامه‌ریز به‌جای آن از مالکیت `commandAliases` استفاده کرده است. این برچسب‌های دلیل برای عیب‌یابی‌های میزبان و آزمون‌ها هستند؛ نویسندگان Plugin باید همچنان فراداده‌ای را اعلام کنند که مالکیت را بهترین توصیف می‌کند.

## مرجع qaRunners

وقتی یک Plugin یک یا چند runner انتقال زیر ریشه مشترک `openclaw qa` اضافه می‌کند، از `qaRunners` استفاده کنید. این فراداده را کم‌هزینه و ایستا نگه دارید؛ زمان اجرای Plugin همچنان مالک ثبت واقعی CLI از طریق سطح سبک `runtime-api.ts` است که `qaRunnerCliRegistrations` را export می‌کند.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| فیلد         | الزامی | نوع     | معنی آن                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | بله      | `string` | زیرفرمانی که زیر `openclaw qa` نصب می‌شود، برای مثال `matrix`.    |
| `description` | خیر       | `string` | متن راهنمای fallback که وقتی میزبان مشترک به فرمان stub نیاز دارد استفاده می‌شود. |

## مرجع setup

وقتی سطح‌های setup و onboarding پیش از بارگذاری زمان اجرا به فراداده کم‌هزینه مالکیت Plugin نیاز دارند، از `setup` استفاده کنید.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` سطح بالا معتبر می‌ماند و همچنان backendهای استنتاج CLI را توصیف می‌کند. `setup.cliBackends` سطح توصیفگر ویژه setup برای جریان‌های control-plane/setup است که باید فقط فراداده بمانند.

وقتی موجود باشند، `setup.providers` و `setup.cliBackends` سطح lookup ترجیحی descriptor-first برای کشف setup هستند. اگر توصیفگر فقط Plugin نامزد را محدود می‌کند و setup همچنان به hookهای زمان اجرای setup-time غنی‌تر نیاز دارد، `requiresRuntime: true` را تنظیم کنید و `setup-api` را به‌عنوان مسیر اجرای fallback حفظ کنید.

OpenClaw همچنین `setup.providers[].envVars` را در lookupهای عمومی auth provider و env-var وارد می‌کند. `providerAuthEnvVars` در طول پنجره deprecation از طریق یک adapter سازگاری همچنان پشتیبانی می‌شود، اما Pluginهای غیرهمراه که هنوز از آن استفاده می‌کنند یک عیب‌یابی manifest دریافت می‌کنند. Pluginهای جدید باید فراداده env مربوط به setup/status را در `setup.providers[].envVars` قرار دهند.

OpenClaw همچنین می‌تواند انتخاب‌های setup ساده را از `setup.providers[].authMethods` استخراج کند، وقتی هیچ ورودی setup در دسترس نیست، یا وقتی `setup.requiresRuntime: false` اعلام می‌کند زمان اجرای setup غیرضروری است. ورودی‌های صریح `providerAuthChoices` برای برچسب‌های سفارشی، پرچم‌های CLI، دامنه onboarding، و فراداده assistant همچنان ترجیح داده می‌شوند.

فقط زمانی `requiresRuntime: false` را تنظیم کنید که آن توصیفگرها برای سطح setup کافی باشند. OpenClaw مقدار صریح `false` را به‌عنوان قرارداد descriptor-only در نظر می‌گیرد و برای lookup setup، `setup-api` یا `openclaw.setupEntry` را اجرا نمی‌کند. اگر یک Plugin descriptor-only همچنان یکی از آن ورودی‌های زمان اجرای setup را ارائه کند، OpenClaw یک عیب‌یابی افزایشی گزارش می‌کند و همچنان آن را نادیده می‌گیرد. حذف `requiresRuntime` رفتار fallback قدیمی را حفظ می‌کند تا Pluginهای موجودی که بدون این پرچم توصیفگر اضافه کرده‌اند خراب نشوند.

چون lookup setup می‌تواند کد `setup-api` مالک Plugin را اجرا کند، مقدارهای نرمال‌شده `setup.providers[].id` و `setup.cliBackends[]` باید در میان Pluginهای کشف‌شده یکتا بمانند. مالکیت مبهم به‌جای انتخاب برنده از ترتیب کشف، fail-closed می‌شود.

وقتی زمان اجرای setup اجرا می‌شود، عیب‌یابی‌های registry setup در صورتی drift توصیفگر را گزارش می‌کنند که `setup-api` یک provider یا backend CLI ثبت کند که توصیفگرهای manifest اعلام نکرده‌اند، یا اگر یک توصیفگر هیچ ثبت زمان اجرای متناظری نداشته باشد. این عیب‌یابی‌ها افزایشی هستند و Pluginهای قدیمی را رد نمی‌کنند.

### مرجع setup.providers

| فیلد          | الزامی | نوع       | معنی آن                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | بله      | `string`   | شناسه provider که هنگام setup یا onboarding در معرض قرار می‌گیرد. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید.             |
| `authMethods`  | خیر       | `string[]` | شناسه‌های روش setup/auth که این provider بدون بارگذاری زمان اجرای کامل پشتیبانی می‌کند.                       |
| `envVars`      | خیر       | `string[]` | Env varهایی که سطح‌های عمومی setup/status می‌توانند پیش از بارگذاری زمان اجرای Plugin بررسی کنند.               |
| `authEvidence` | خیر       | `object[]` | بررسی‌های کم‌هزینه شواهد auth محلی برای providerهایی که می‌توانند از طریق نشانگرهای غیرمحرمانه authenticate کنند. |

`authEvidence` برای نشانگرهای اعتبارنامهٔ محلیِ تحت مالکیت provider است که می‌توان آن‌ها را
بدون بارگذاری کد runtime راستی‌آزمایی کرد. این بررسی‌ها باید کم‌هزینه و محلی بمانند:
بدون فراخوانی شبکه، بدون خواندن از keychain یا secret-manager، بدون فرمان‌های shell، و بدون
آزمون‌های API مربوط به provider.

ورودی‌های evidence پشتیبانی‌شده:

| فیلد              | الزامی | نوع        | معنای آن                                                                                                         |
| ------------------ | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `type`             | بله    | `string`   | در حال حاضر `local-file-with-env`.                                                                               |
| `fileEnvVar`       | خیر    | `string`   | متغیر محیطی حاوی مسیر صریح فایل اعتبارنامه.                                                                      |
| `fallbackPaths`    | خیر    | `string[]` | مسیرهای فایل اعتبارنامهٔ محلی که وقتی `fileEnvVar` وجود ندارد یا خالی است بررسی می‌شوند. از `${HOME}` و `${APPDATA}` پشتیبانی می‌کند. |
| `requiresAnyEnv`   | خیر    | `string[]` | پیش از معتبر شدن evidence، دست‌کم یکی از متغیرهای محیطی فهرست‌شده باید غیرخالی باشد.                            |
| `requiresAllEnv`   | خیر    | `string[]` | پیش از معتبر شدن evidence، همهٔ متغیرهای محیطی فهرست‌شده باید غیرخالی باشند.                                    |
| `credentialMarker` | بله    | `string`   | نشانگر غیرمحرمانه‌ای که هنگام وجود evidence برگردانده می‌شود.                                                    |
| `source`           | خیر    | `string`   | برچسب منبعِ نمایش‌داده‌شده به کاربر برای خروجی auth/status.                                                      |

### فیلدهای setup

| فیلد              | الزامی | نوع        | معنای آن                                                                                             |
| ------------------ | ------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | خیر    | `object[]` | توصیف‌گرهای راه‌اندازی provider که هنگام setup و onboarding ارائه می‌شوند.                           |
| `cliBackends`      | خیر    | `string[]` | شناسه‌های backend زمان setup که برای جست‌وجوی descriptor-first setup استفاده می‌شوند. شناسه‌های نرمال‌شده را در سطح سراسری یکتا نگه دارید. |
| `configMigrations` | خیر    | `string[]` | شناسه‌های مهاجرت config که تحت مالکیت سطح setup این plugin هستند.                                    |
| `requiresRuntime`  | خیر    | `boolean`  | اینکه آیا setup پس از جست‌وجوی descriptor همچنان به اجرای `setup-api` نیاز دارد یا نه.               |

## مرجع uiHints

`uiHints` نگاشتی از نام فیلدهای config به راهنمایی‌های کوچک rendering است.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

هر راهنمای فیلد می‌تواند شامل این موارد باشد:

| فیلد          | نوع        | معنای آن                                  |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | برچسب فیلدِ نمایش‌داده‌شده به کاربر.      |
| `help`        | `string`   | متن راهنمای کوتاه.                        |
| `tags`        | `string[]` | برچسب‌های اختیاری UI.                     |
| `advanced`    | `boolean`  | فیلد را به‌عنوان پیشرفته علامت‌گذاری می‌کند. |
| `sensitive`   | `boolean`  | فیلد را به‌عنوان محرمانه یا حساس علامت‌گذاری می‌کند. |
| `placeholder` | `string`   | متن placeholder برای ورودی‌های فرم.       |

## مرجع contracts

از `contracts` فقط برای فرادادهٔ مالکیت قابلیت‌های ایستا استفاده کنید که OpenClaw می‌تواند
بدون import کردن runtime مربوط به plugin آن را بخواند.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

هر فهرست اختیاری است:

| فیلد                             | نوع        | معنای آن                                                              |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | شناسه‌های factory برای extension مربوط به Codex app-server، در حال حاضر `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | شناسه‌های runtime که یک plugin بسته‌بندی‌شده می‌تواند برای آن‌ها middleware نتیجهٔ ابزار ثبت کند. |
| `externalAuthProviders`          | `string[]` | شناسه‌های provider که hook پروفایل auth خارجی آن‌ها تحت مالکیت این plugin است. |
| `speechProviders`                | `string[]` | شناسه‌های provider گفتار که تحت مالکیت این plugin هستند.              |
| `realtimeTranscriptionProviders` | `string[]` | شناسه‌های provider رونویسی بلادرنگ که تحت مالکیت این plugin هستند.     |
| `realtimeVoiceProviders`         | `string[]` | شناسه‌های provider صدای بلادرنگ که تحت مالکیت این plugin هستند.        |
| `memoryEmbeddingProviders`       | `string[]` | شناسه‌های provider جاسازی حافظه که تحت مالکیت این plugin هستند.        |
| `mediaUnderstandingProviders`    | `string[]` | شناسه‌های provider درک رسانه که تحت مالکیت این plugin هستند.           |
| `imageGenerationProviders`       | `string[]` | شناسه‌های provider تولید تصویر که تحت مالکیت این plugin هستند.         |
| `videoGenerationProviders`       | `string[]` | شناسه‌های provider تولید ویدئو که تحت مالکیت این plugin هستند.         |
| `webFetchProviders`              | `string[]` | شناسه‌های provider واکشی وب که تحت مالکیت این plugin هستند.            |
| `webSearchProviders`             | `string[]` | شناسه‌های provider جست‌وجوی وب که تحت مالکیت این plugin هستند.         |
| `migrationProviders`             | `string[]` | شناسه‌های provider import که برای `openclaw migrate` تحت مالکیت این plugin هستند. |
| `tools`                          | `string[]` | نام‌های ابزار agent که تحت مالکیت این plugin هستند.                    |

`contracts.embeddedExtensionFactories` برای factoryهای extension فقط مربوط به
Codex app-server و بسته‌بندی‌شده نگه داشته شده است. تبدیل‌های tool-result بسته‌بندی‌شده باید
به‌جای آن `contracts.agentToolResultMiddleware` را اعلام کنند و با
`api.registerAgentToolResultMiddleware(...)` ثبت شوند. Pluginهای خارجی نمی‌توانند
middleware مربوط به tool-result را ثبت کنند، چون این seam می‌تواند خروجی ابزارهای با اعتماد بالا را
پیش از اینکه مدل آن را ببیند بازنویسی کند.

ثبت‌های runtime با `api.registerTool(...)` باید با `contracts.tools` مطابقت داشته باشند.
کشف ابزار از این فهرست استفاده می‌کند تا فقط runtimeهای pluginهایی را بارگذاری کند که می‌توانند
مالک ابزارهای درخواست‌شده باشند.

Pluginهای provider که `resolveExternalAuthProfiles` را پیاده‌سازی می‌کنند باید
`contracts.externalAuthProviders` را اعلام کنند. Pluginهای بدون این declaration همچنان
از مسیر fallback سازگاریِ منسوخ‌شده اجرا می‌شوند، اما آن fallback کندتر است و
پس از بازهٔ migration حذف خواهد شد.

Providerهای بسته‌بندی‌شدهٔ memory embedding باید برای هر شناسهٔ adapter که ارائه می‌کنند
`contracts.memoryEmbeddingProviders` را اعلام کنند، از جمله adapterهای داخلی مانند `local`.
مسیرهای مستقل CLI از این قرارداد manifest استفاده می‌کنند تا پیش از آنکه runtime کامل Gateway
providerها را ثبت کرده باشد، فقط plugin مالک را بارگذاری کنند.

## مرجع mediaUnderstandingProviderMetadata

از `mediaUnderstandingProviderMetadata` زمانی استفاده کنید که یک provider درک رسانه
مدل‌های پیش‌فرض، اولویت fallback احراز هویت خودکار، یا پشتیبانی native از سند دارد که
helperهای عمومی core پیش از بارگذاری runtime به آن نیاز دارند. کلیدها باید در
`contracts.mediaUnderstandingProviders` نیز اعلام شده باشند.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

هر ورودی provider می‌تواند شامل این موارد باشد:

| فیلد                   | نوع                                 | معنای آن                                                                   |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قابلیت‌های رسانه‌ای که این provider ارائه می‌کند.                           |
| `defaultModels`        | `Record<string, string>`            | پیش‌فرض‌های قابلیت به مدل که وقتی config مدلی مشخص نکرده استفاده می‌شوند.   |
| `autoPriority`         | `Record<string, number>`            | اعداد کمتر در fallback خودکار provider مبتنی بر اعتبارنامه زودتر مرتب می‌شوند. |
| `nativeDocumentInputs` | `"pdf"[]`                           | ورودی‌های native سند که توسط provider پشتیبانی می‌شوند.                     |

## مرجع channelConfigs

از `channelConfigs` زمانی استفاده کنید که یک plugin کانال پیش از بارگذاری runtime
به فرادادهٔ ارزان config نیاز دارد. کشف setup/status فقط‌خواندنی کانال می‌تواند از این فراداده
برای کانال‌های خارجیِ پیکربندی‌شده به‌طور مستقیم استفاده کند، وقتی ورودی setup در دسترس نیست، یا
وقتی `setup.requiresRuntime: false` اعلام می‌کند runtime مربوط به setup غیرضروری است.

`channelConfigs` فرادادهٔ manifest مربوط به plugin است، نه یک بخش جدید config سطح بالای کاربر.
کاربران همچنان instanceهای کانال را زیر `channels.<channel-id>` پیکربندی می‌کنند.
OpenClaw فرادادهٔ manifest را می‌خواند تا پیش از اجرای کد runtime مربوط به plugin تصمیم بگیرد
کدام plugin مالک آن کانال پیکربندی‌شده است.

برای یک plugin کانال، `configSchema` و `channelConfigs` مسیرهای متفاوتی را توصیف می‌کنند:

- `configSchema` مقدار `plugins.entries.<plugin-id>.config` را اعتبارسنجی می‌کند
- `channelConfigs.<channel-id>.schema` مقدار `channels.<channel-id>` را اعتبارسنجی می‌کند

Pluginهای غیربسته‌بندی‌شده که `channels[]` را اعلام می‌کنند باید ورودی‌های متناظر
`channelConfigs` را نیز اعلام کنند. بدون آن‌ها، OpenClaw همچنان می‌تواند plugin را بارگذاری کند، اما
سطح‌های schema مربوط به cold-path config، setup، و Control UI نمی‌توانند شکل گزینه‌های
تحت مالکیت کانال را تا زمان اجرای runtime مربوط به plugin بدانند.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و
`nativeSkillsAutoEnabled` می‌توانند پیش‌فرض‌های ایستای `auto` را برای بررسی‌های config فرمان
اعلام کنند که پیش از بارگذاری runtime کانال اجرا می‌شوند. کانال‌های بسته‌بندی‌شده همچنین می‌توانند
همین پیش‌فرض‌ها را از طریق `package.json#openclaw.channel.commands` در کنار
سایر فراداده‌های catalog کانالِ تحت مالکیت package منتشر کنند.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

هر ورودی کانال می‌تواند شامل این موارد باشد:

| فیلد         | نوع                     | معنای آن                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | طرح‌واره JSON برای `channels.<id>`. برای هر ورودی پیکربندی کانال اعلام‌شده الزامی است.         |
| `uiHints`     | `Record<string, object>` | برچسب‌ها/جای‌نگهدارها/راهنمایی‌های حساس اختیاری رابط کاربری برای آن بخش پیکربندی کانال.          |
| `label`       | `string`                 | برچسب کانال که وقتی فراداده زمان اجرا آماده نیست، در سطح‌های انتخابگر و بازرسی ادغام می‌شود. |
| `description` | `string`                 | توضیح کوتاه کانال برای سطح‌های بازرسی و کاتالوگ.                               |
| `commands`    | `object`                 | فرمان بومی ایستا و پیش‌فرض‌های خودکار مهارت بومی برای بررسی‌های پیکربندی پیش از زمان اجرا.       |
| `preferOver`  | `string[]`               | شناسه‌های Plugin قدیمی یا کم‌اولویت‌تر که این کانال باید در سطح‌های انتخاب بر آن‌ها اولویت داشته باشد.    |

### جایگزینی یک Plugin کانال دیگر

وقتی Plugin شما مالک ترجیحی برای شناسه کانالی است که
Plugin دیگری هم می‌تواند آن را ارائه کند، از `preferOver` استفاده کنید. موردهای رایج شامل شناسه Plugin تغییریافته،
Plugin مستقل که جایگزین یک Plugin بسته‌بندی‌شده می‌شود، یا فورک نگه‌داری‌شده‌ای است که
برای سازگاری پیکربندی همان شناسه کانال را حفظ می‌کند.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

وقتی `channels.chat` پیکربندی شده باشد، OpenClaw هم شناسه کانال و هم
شناسه Plugin ترجیحی را در نظر می‌گیرد. اگر Plugin کم‌اولویت‌تر فقط به این دلیل انتخاب شده باشد که
بسته‌بندی‌شده است یا به‌صورت پیش‌فرض فعال است، OpenClaw آن را در پیکربندی
موثر زمان اجرا غیرفعال می‌کند تا یک Plugin مالک کانال و ابزارهای آن باشد. انتخاب صریح کاربر
همچنان برنده است: اگر کاربر هر دو Plugin را صریحا فعال کند، OpenClaw
آن انتخاب را حفظ می‌کند و به‌جای تغییر بی‌سروصدای مجموعه Pluginهای درخواستی،
تشخیص‌های کانال/ابزار تکراری را گزارش می‌دهد.

`preferOver` را به شناسه‌های Plugin محدود کنید که واقعا می‌توانند همان کانال را ارائه کنند.
این یک فیلد اولویت عمومی نیست و کلیدهای پیکربندی کاربر را تغییر نام نمی‌دهد.

## مرجع `modelSupport`

وقتی OpenClaw باید پیش از بارگذاری زمان اجرای Plugin، Plugin ارائه‌دهنده شما را از
شناسه‌های کوتاه مدل مانند `gpt-5.5` یا `claude-sonnet-4.6` استنباط کند،
از `modelSupport` استفاده کنید.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw این تقدم را اعمال می‌کند:

- ارجاع‌های صریح `provider/model` از فراداده مانیفست `providers` مالک استفاده می‌کنند
- `modelPatterns` بر `modelPrefixes` برتری دارد
- اگر یک Plugin غیربسته‌بندی‌شده و یک Plugin بسته‌بندی‌شده هر دو مطابقت داشته باشند، Plugin غیربسته‌بندی‌شده
  برنده می‌شود
- ابهام باقی‌مانده نادیده گرفته می‌شود تا وقتی کاربر یا پیکربندی یک ارائه‌دهنده را مشخص کند

فیلدها:

| فیلد           | نوع       | معنای آن                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | پیشوندهایی که با `startsWith` با شناسه‌های کوتاه مدل تطبیق داده می‌شوند.                 |
| `modelPatterns` | `string[]` | منابع Regex که پس از حذف پسوند پروفایل با شناسه‌های کوتاه مدل تطبیق داده می‌شوند. |

## مرجع `modelCatalog`

وقتی OpenClaw باید پیش از بارگذاری زمان اجرای Plugin، فراداده مدل ارائه‌دهنده را بداند،
از `modelCatalog` استفاده کنید. این منبعِ تحت مالکیت مانیفست برای ردیف‌های ثابت کاتالوگ،
نام‌های مستعار ارائه‌دهنده، قواعد سرکوب، و حالت کشف است. تازه‌سازی زمان اجرا
همچنان به کد زمان اجرای ارائه‌دهنده تعلق دارد، اما مانیفست به هسته می‌گوید چه زمانی زمان اجرا
لازم است.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

فیلدهای سطح بالا:

| فیلد          | نوع                                                     | معنای آن                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | ردیف‌های کاتالوگ برای شناسه‌های ارائه‌دهنده که مالک آن‌ها این Plugin است. کلیدها باید در `providers` سطح بالا نیز ظاهر شوند.       |
| `aliases`      | `Record<string, object>`                                 | نام‌های مستعار ارائه‌دهنده که باید برای برنامه‌ریزی کاتالوگ یا سرکوب به یک ارائه‌دهنده تحت مالکیت resolve شوند.              |
| `suppressions` | `object[]`                                               | ردیف‌های مدل از منبعی دیگر که این Plugin به دلیل خاصِ ارائه‌دهنده آن‌ها را سرکوب می‌کند.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | اینکه کاتالوگ ارائه‌دهنده می‌تواند از فراداده مانیفست خوانده شود، در کش تازه‌سازی شود، یا به زمان اجرا نیاز دارد. |

`aliases` در جست‌وجوی مالکیت ارائه‌دهنده برای برنامه‌ریزی کاتالوگ مدل مشارکت می‌کند.
هدف‌های نام مستعار باید ارائه‌دهنده‌های سطح بالایی باشند که مالک آن‌ها همان Plugin است. وقتی یک
فهرست فیلترشده بر اساس ارائه‌دهنده از نام مستعار استفاده می‌کند، OpenClaw می‌تواند مانیفست مالک را بخواند و
بازنویسی‌های API/آدرس پایه نام مستعار را بدون بارگذاری زمان اجرای ارائه‌دهنده اعمال کند.
نام‌های مستعار فهرست‌های کاتالوگ بدون فیلتر را گسترش نمی‌دهند؛ فهرست‌های گسترده فقط ردیف‌های
ارائه‌دهنده canonical مالک را منتشر می‌کنند.

`suppressions` جایگزین hook قدیمی `suppressBuiltInModel` در زمان اجرای ارائه‌دهنده می‌شود.
ورودی‌های سرکوب فقط وقتی رعایت می‌شوند که مالک ارائه‌دهنده Plugin باشد یا
به‌عنوان کلید `modelCatalog.aliases` اعلام شده باشد که یک ارائه‌دهنده تحت مالکیت را هدف می‌گیرد. hookهای
سرکوب زمان اجرا دیگر هنگام resolve کردن مدل فراخوانی نمی‌شوند.

فیلدهای ارائه‌دهنده:

| فیلد     | نوع                     | معنای آن                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | آدرس پایه پیش‌فرض اختیاری برای مدل‌های این کاتالوگ ارائه‌دهنده.    |
| `api`     | `ModelApi`               | آداپتر API پیش‌فرض اختیاری برای مدل‌های این کاتالوگ ارائه‌دهنده. |
| `headers` | `Record<string, string>` | سربرگ‌های ایستای اختیاری که به این کاتالوگ ارائه‌دهنده اعمال می‌شوند.      |
| `models`  | `object[]`               | ردیف‌های مدل الزامی. ردیف‌های بدون `id` نادیده گرفته می‌شوند.            |

فیلدهای مدل:

| فیلد           | نوع                                                           | معنای آن                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | شناسه مدل محلیِ ارائه‌دهنده، بدون پیشوند `provider/`.                    |
| `name`          | `string`                                                       | نام نمایشی اختیاری.                                                      |
| `api`           | `ModelApi`                                                     | بازنویسی اختیاری API برای هر مدل.                                            |
| `baseUrl`       | `string`                                                       | بازنویسی اختیاری آدرس پایه برای هر مدل.                                       |
| `headers`       | `Record<string, string>`                                       | سربرگ‌های ایستای اختیاری برای هر مدل.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | مدالیته‌هایی که مدل می‌پذیرد.                                               |
| `reasoning`     | `boolean`                                                      | اینکه آیا مدل رفتار استدلال را عرضه می‌کند یا نه.                               |
| `contextWindow` | `number`                                                       | پنجره زمینه بومی ارائه‌دهنده.                                             |
| `contextTokens` | `number`                                                       | سقف موثر اختیاری زمینه در زمان اجرا، وقتی با `contextWindow` متفاوت است. |
| `maxTokens`     | `number`                                                       | بیشینه توکن‌های خروجی، وقتی معلوم باشد.                                           |
| `cost`          | `object`                                                       | قیمت‌گذاری اختیاری دلار آمریکا به‌ازای هر میلیون توکن، شامل `tieredPricing` اختیاری. |
| `compat`        | `object`                                                       | پرچم‌های سازگاری اختیاری مطابق با سازگاری پیکربندی مدل OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | وضعیت فهرست‌شدن. فقط وقتی سرکوب کنید که ردیف اصلا نباید ظاهر شود.          |
| `statusReason`  | `string`                                                       | دلیل اختیاری که همراه با وضعیت غیرقابل‌دسترس نشان داده می‌شود.                            |
| `replaces`      | `string[]`                                                     | شناسه‌های مدل قدیمی‌تر محلیِ ارائه‌دهنده که این مدل جایگزین آن‌ها می‌شود.                       |
| `replacedBy`    | `string`                                                       | شناسه مدل جایگزین محلیِ ارائه‌دهنده برای ردیف‌های منسوخ.                    |
| `tags`          | `string[]`                                                     | برچسب‌های پایدار که توسط انتخابگرها و فیلترها استفاده می‌شوند.                                    |

فیلدهای سرکوب:

| فیلد                      | نوع       | معنای آن                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | شناسه ارائه‌دهنده برای ردیف بالادستی که باید سرکوب شود. باید تحت مالکیت این Plugin باشد یا به‌عنوان نام مستعار تحت مالکیت اعلام شده باشد. |
| `model`                    | `string`   | شناسه مدل محلیِ ارائه‌دهنده که باید سرکوب شود.                                                                      |
| `reason`                   | `string`   | پیام اختیاری که وقتی ردیف سرکوب‌شده مستقیما درخواست می‌شود نشان داده می‌شود.                                     |
| `when.baseUrlHosts`        | `string[]` | فهرست اختیاری میزبان‌های آدرس پایه موثر ارائه‌دهنده که پیش از اعمال سرکوب لازم‌اند.               |
| `when.providerConfigApiIn` | `string[]` | فهرست اختیاری مقادیر دقیق `api` در پیکربندی ارائه‌دهنده که پیش از اعمال سرکوب لازم‌اند.              |

داده‌های صرفاً زمان اجرا را در `modelCatalog` قرار ندهید. فقط زمانی از `static` استفاده کنید که ردیف‌های manifest برای سطح‌های فهرست فیلترشده بر پایه ارائه‌دهنده و انتخابگر به‌اندازه کافی کامل باشند تا کشف registry/runtime را رد کنند. زمانی از `refreshable` استفاده کنید که ردیف‌های manifest به‌عنوان دانه‌ها یا مکمل‌های قابل فهرست‌سازی مفید باشند، اما refresh/cache بتواند بعداً ردیف‌های بیشتری اضافه کند؛ ردیف‌های refreshable به‌تنهایی مرجع نهایی نیستند. زمانی از `runtime` استفاده کنید که OpenClaw برای دانستن فهرست باید runtime ارائه‌دهنده را بارگذاری کند.

## مرجع modelIdNormalization

از `modelIdNormalization` برای پاک‌سازی کم‌هزینه شناسه مدل تحت مالکیت ارائه‌دهنده استفاده کنید که باید پیش از بارگذاری runtime ارائه‌دهنده انجام شود. این کار aliasهایی مانند نام‌های کوتاه مدل، شناسه‌های legacy محلی ارائه‌دهنده، و قواعد prefix پراکسی را به‌جای جدول‌های اصلی انتخاب مدل، در manifest متعلق به Plugin نگه می‌دارد.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

فیلدهای ارائه‌دهنده:

| فیلد                                 | نوع                     | معنی آن                                                                                         |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | aliasهای دقیق شناسه مدل بدون حساسیت به بزرگی و کوچکی حروف. مقدارها همان‌طور که نوشته شده‌اند برگردانده می‌شوند. |
| `stripPrefixes`                      | `string[]`              | prefixهایی که پیش از جست‌وجوی alias حذف می‌شوند، برای تکرار legacy ارائه‌دهنده/مدل مفید است. |
| `prefixWhenBare`                     | `string`                | prefixی که وقتی شناسه مدل نرمال‌شده از قبل شامل `/` نیست اضافه می‌شود.                         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | قواعد شرطی prefix برای bare-id پس از جست‌وجوی alias، با کلیدهای `modelPrefix` و `prefix`.       |

## مرجع providerEndpoints

از `providerEndpoints` برای طبقه‌بندی endpoint استفاده کنید که سیاست عمومی درخواست باید پیش از بارگذاری runtime ارائه‌دهنده بداند. هسته همچنان مالک معنای هر `endpointClass` است؛ manifestهای Plugin مالک metadata مربوط به host و base URL هستند.

فیلدهای endpoint:

| فیلد                           | نوع        | معنی آن                                                                                         |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | کلاس شناخته‌شده endpoint در هسته، مانند `openrouter`، `moonshot-native`، یا `google-vertex`.    |
| `hosts`                        | `string[]` | hostnameهای دقیقی که به کلاس endpoint نگاشت می‌شوند.                                            |
| `hostSuffixes`                 | `string[]` | پسوندهای host که به کلاس endpoint نگاشت می‌شوند. برای تطبیق فقط پسوند دامنه، با `.` شروع کنید. |
| `baseUrls`                     | `string[]` | base URLهای HTTP(S) نرمال‌شده دقیق که به کلاس endpoint نگاشت می‌شوند.                          |
| `googleVertexRegion`           | `string`   | منطقه ثابت Google Vertex برای hostهای global دقیق.                                             |
| `googleVertexRegionHostSuffix` | `string`   | پسوندی که از hostهای منطبق حذف می‌شود تا prefix منطقه Google Vertex آشکار شود.                 |

## مرجع providerRequest

از `providerRequest` برای metadata کم‌هزینه سازگاری درخواست استفاده کنید که سیاست عمومی درخواست بدون بارگذاری runtime ارائه‌دهنده به آن نیاز دارد. بازنویسی payload وابسته به رفتار را در hookهای runtime ارائه‌دهنده یا helperهای مشترک خانواده ارائه‌دهنده نگه دارید.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

فیلدهای ارائه‌دهنده:

| فیلد                  | نوع          | معنی آن                                                                                         |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `family`              | `string`     | برچسب خانواده ارائه‌دهنده که در تصمیم‌های عمومی سازگاری درخواست و diagnostics استفاده می‌شود. |
| `compatibilityFamily` | `"moonshot"` | bucket اختیاری سازگاری خانواده ارائه‌دهنده برای helperهای مشترک درخواست.                      |
| `openAICompletions`   | `object`     | پرچم‌های درخواست completions سازگار با OpenAI، در حال حاضر `supportsStreamingUsage`.            |

## مرجع modelPricing

زمانی از `modelPricing` استفاده کنید که یک ارائه‌دهنده پیش از بارگذاری runtime به رفتار قیمت‌گذاری control-plane نیاز دارد. cache قیمت‌گذاری Gateway این metadata را بدون import کردن کد runtime ارائه‌دهنده می‌خواند.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

فیلدهای ارائه‌دهنده:

| فیلد         | نوع               | معنی آن                                                                                                  |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | برای ارائه‌دهندگان محلی/خودمیزبان که هرگز نباید قیمت‌گذاری OpenRouter یا LiteLLM را fetch کنند، `false` تنظیم کنید. |
| `openRouter` | `false \| object` | نگاشت lookup قیمت‌گذاری OpenRouter. `false` lookup OpenRouter را برای این ارائه‌دهنده غیرفعال می‌کند. |
| `liteLLM`    | `false \| object` | نگاشت lookup قیمت‌گذاری LiteLLM. `false` lookup LiteLLM را برای این ارائه‌دهنده غیرفعال می‌کند.       |

فیلدهای منبع:

| فیلد                       | نوع                | معنی آن                                                                                                               |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | شناسه ارائه‌دهنده کاتالوگ خارجی وقتی با شناسه ارائه‌دهنده OpenClaw متفاوت است، برای مثال `z-ai` برای ارائه‌دهنده `zai`. |
| `passthroughProviderModel` | `boolean`          | شناسه‌های مدل شامل slash را به‌عنوان ارجاع‌های تو‌در‌توی ارائه‌دهنده/مدل در نظر بگیرید، برای ارائه‌دهندگان پراکسی مانند OpenRouter مفید است. |
| `modelIdTransforms`        | `"version-dots"[]` | گونه‌های اضافی شناسه مدل در کاتالوگ خارجی. `version-dots` شناسه‌های نسخه نقطه‌دار مانند `claude-opus-4.6` را امتحان می‌کند. |

### نمایه ارائه‌دهنده OpenClaw

نمایه ارائه‌دهنده OpenClaw یک metadata پیش‌نمایش تحت مالکیت OpenClaw برای ارائه‌دهندگانی است که ممکن است Pluginهایشان هنوز نصب نشده باشد. این بخشی از manifest یک Plugin نیست. manifestهای Plugin همچنان مرجع Plugin نصب‌شده هستند. نمایه ارائه‌دهنده قرارداد fallback داخلی است که سطح‌های آینده انتخابگر مدل برای ارائه‌دهنده قابل نصب و پیش از نصب، وقتی Plugin ارائه‌دهنده نصب نشده باشد، مصرف خواهند کرد.

ترتیب مرجعیت کاتالوگ:

1. پیکربندی کاربر.
2. manifest `modelCatalog` از Plugin نصب‌شده.
3. cache کاتالوگ مدل از refresh صریح.
4. ردیف‌های پیش‌نمایش نمایه ارائه‌دهنده OpenClaw.

نمایه ارائه‌دهنده نباید شامل secretها، وضعیت فعال بودن، hookهای runtime، یا داده‌های مدل زنده و اختصاصی حساب باشد. کاتالوگ‌های پیش‌نمایش آن از همان شکل ردیف ارائه‌دهنده `modelCatalog` مانند manifestهای Plugin استفاده می‌کنند، اما باید به metadata پایدار نمایش محدود بمانند، مگر اینکه فیلدهای adapter runtime مانند `api`، `baseUrl`، قیمت‌گذاری، یا پرچم‌های سازگاری عمداً با manifest Plugin نصب‌شده همگام نگه داشته شوند. ارائه‌دهندگانی که کشف زنده `/models` دارند باید ردیف‌های refresh‌شده را از مسیر صریح cache کاتالوگ مدل بنویسند، نه اینکه فهرست‌سازی معمول یا onboarding باعث فراخوانی APIهای ارائه‌دهنده شود.

ورودی‌های نمایه ارائه‌دهنده ممکن است metadata مربوط به Plugin قابل نصب را نیز برای ارائه‌دهندگانی حمل کنند که Plugin آنها از هسته خارج شده یا به شکل دیگری هنوز نصب نشده است. این metadata الگوی کاتالوگ channel را بازتاب می‌دهد: نام package، spec نصب npm، integrity مورد انتظار، و برچسب‌های کم‌هزینه انتخاب auth برای نمایش یک گزینه setup قابل نصب کافی هستند. پس از نصب Plugin، manifest آن برنده است و ورودی نمایه ارائه‌دهنده برای آن ارائه‌دهنده نادیده گرفته می‌شود.

کلیدهای capability legacy در سطح بالا deprecated شده‌اند. از `openclaw doctor --fix` استفاده کنید تا `speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، و `webSearchProviders` را زیر `contracts` منتقل کنید؛ بارگذاری معمول manifest دیگر آن فیلدهای سطح بالا را به‌عنوان مالکیت capability در نظر نمی‌گیرد.

## Manifest در برابر package.json

این دو فایل کارهای متفاوتی انجام می‌دهند:

| فایل                   | کاربرد آن                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | کشف، اعتبارسنجی پیکربندی، metadata انتخاب auth، و راهنماهای UI که باید پیش از اجرای کد Plugin وجود داشته باشند                 |
| `package.json`         | metadata npm، نصب وابستگی‌ها، و بلوک `openclaw` که برای entrypointها، gating نصب، setup، یا metadata کاتالوگ استفاده می‌شود |

اگر مطمئن نیستید یک بخش از metadata کجا باید قرار بگیرد، از این قاعده استفاده کنید:

- اگر OpenClaw باید آن را پیش از بارگذاری کد Plugin بداند، آن را در `openclaw.plugin.json` قرار دهید
- اگر مربوط به بسته‌بندی، فایل‌های entry، یا رفتار نصب npm است، آن را در `package.json` قرار دهید

### فیلدهای package.json که بر کشف اثر می‌گذارند

برخی metadataهای Plugin پیش از runtime عمداً به‌جای `openclaw.plugin.json` در `package.json` زیر بلوک `openclaw` قرار دارند.

نمونه‌های مهم:

| فیلد                                                             | معنی آن                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | نقطه‌های ورود بومی Plugin را اعلام می‌کند. باید داخل دایرکتوری بسته Plugin باقی بماند.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | نقطه‌های ورود runtime جاوااسکریپت ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. باید داخل دایرکتوری بسته Plugin باقی بماند.                                                                 |
| `openclaw.setupEntry`                                             | نقطه ورود سبک و فقط مخصوص راه‌اندازی که هنگام onboarding، شروع با تأخیر کانال، و کشف وضعیت کانال فقط‌خواندنی/SecretRef استفاده می‌شود. باید داخل دایرکتوری بسته Plugin باقی بماند. |
| `openclaw.runtimeSetupEntry`                                      | نقطه ورود setup جاوااسکریپت ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. به `setupEntry` نیاز دارد، باید وجود داشته باشد، و باید داخل دایرکتوری بسته Plugin باقی بماند.                         |
| `openclaw.channel`                                                | metadata ارزان کاتالوگ کانال مانند برچسب‌ها، مسیرهای مستندات، نام‌های مستعار، و متن انتخاب.                                                                                                 |
| `openclaw.channel.commands`                                       | metadata ایستا برای فرمان بومی و پیش‌فرض خودکار skill بومی که پیش از بارگذاری runtime کانال توسط سطوح config، audit، و فهرست فرمان‌ها استفاده می‌شود.                                          |
| `openclaw.channel.configuredState`                                | metadata سبک بررسی‌کننده وضعیت پیکربندی‌شده که می‌تواند بدون بارگذاری runtime کامل کانال پاسخ دهد «آیا setup فقط با env از قبل وجود دارد؟».                                         |
| `openclaw.channel.persistedAuthState`                             | metadata سبک بررسی‌کننده احراز هویت ماندگارشده که می‌تواند بدون بارگذاری runtime کامل کانال پاسخ دهد «آیا چیزی از قبل وارد سیستم شده است؟».                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | راهنماهای نصب/به‌روزرسانی برای Pluginهای bundled و منتشرشده به‌صورت خارجی.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | مسیر نصب ترجیحی وقتی چند منبع نصب در دسترس باشد.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | حداقل نسخه پشتیبانی‌شده میزبان OpenClaw، با استفاده از کف semver مانند `>=2026.3.22` یا `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                              | رشته integrity مورد انتظار npm dist مانند `sha512-...`؛ جریان‌های نصب و به‌روزرسانی artifact دریافت‌شده را در برابر آن بررسی می‌کنند.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | یک مسیر بازیابی نصب مجدد باریک برای bundled-plugin را وقتی config نامعتبر است مجاز می‌کند.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | اجازه می‌دهد سطح‌های کانال فقط مخصوص setup پیش از Plugin کامل کانال در زمان startup بارگذاری شوند.                                                                                                 |

metadata manifest تعیین می‌کند کدام انتخاب‌های provider/channel/setup پیش از بارگذاری runtime در
onboarding ظاهر شوند. `package.json#openclaw.install` به
onboarding می‌گوید وقتی کاربر یکی از آن
گزینه‌ها را انتخاب می‌کند، آن Plugin را چگونه دریافت یا فعال کند. راهنماهای نصب را به `openclaw.plugin.json` منتقل نکنید.

`openclaw.install.minHostVersion` هنگام نصب و بارگذاری registry
manifest برای منابع Plugin غیر bundled اعمال می‌شود. مقدارهای نامعتبر رد می‌شوند؛
مقدارهای جدیدتر اما معتبر باعث می‌شوند Pluginهای خارجی روی میزبان‌های قدیمی‌تر نادیده گرفته شوند. Pluginهای منبع bundled
فرض می‌شوند با checkout میزبان هم‌نسخه هستند.

پین‌کردن دقیق نسخه npm از قبل در `npmSpec` قرار دارد، برای مثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. ورودی‌های کاتالوگ خارجی رسمی
باید specهای دقیق را با `expectedIntegrity` همراه کنند تا اگر artifact دریافت‌شده npm دیگر با release پین‌شده منطبق نبود،
جریان‌های به‌روزرسانی به‌صورت بسته fail شوند.
onboarding تعاملی همچنان برای سازگاری specهای npm registry مورد اعتماد، از جمله نام‌های خام بسته و dist-tagها، را ارائه می‌کند. عیب‌یابی‌های کاتالوگ می‌توانند
منابع دقیق، floating، پین‌شده با integrity، بدون integrity، با عدم‌تطابق نام بسته،
و default-choice نامعتبر را از هم تشخیص دهند. همچنین وقتی
`expectedIntegrity` وجود دارد اما هیچ منبع معتبر npm که بتواند آن را pin کند وجود ندارد، هشدار می‌دهند.
وقتی `expectedIntegrity` وجود دارد،
جریان‌های نصب/به‌روزرسانی آن را enforce می‌کنند؛ وقتی حذف شده باشد، resolution مربوط به registry بدون pin مربوط به integrity
ثبت می‌شود.

Pluginهای کانال باید وقتی status، فهرست کانال،
یا اسکن‌های SecretRef لازم دارند حساب‌های پیکربندی‌شده را بدون بارگذاری runtime کامل شناسایی کنند، `openclaw.setupEntry` ارائه دهند. ورودی setup باید metadata کانال به‌علاوه adapterهای config،
status، و secrets امن برای setup را expose کند؛ کلاینت‌های شبکه، listenerهای Gateway، و runtimeهای transport را در نقطه ورود اصلی extension نگه دارید.

فیلدهای نقطه ورود runtime بررسی‌های مرز بسته را برای فیلدهای نقطه ورود source
override نمی‌کنند. برای مثال، `openclaw.runtimeExtensions` نمی‌تواند یک مسیر فراری `openclaw.extensions` را قابل بارگذاری کند.

`openclaw.install.allowInvalidConfigRecovery` عمداً باریک است. این گزینه
configهای خراب دلخواه را قابل نصب نمی‌کند. امروز فقط به جریان‌های نصب اجازه می‌دهد
از شکست‌های stale مشخص در upgrade مربوط به bundled-plugin بازیابی شوند، مانند
مسیر missing bundled plugin یا ورودی stale `channels.<id>` برای همان
bundled plugin. خطاهای unrelated config همچنان نصب را block می‌کنند و operatorها را
به `openclaw doctor --fix` می‌فرستند.

`openclaw.channel.persistedAuthState` metadata بسته برای یک module بررسی‌کننده بسیار کوچک است:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

از آن زمانی استفاده کنید که جریان‌های setup، doctor، status، یا حضور فقط‌خواندنی به یک probe ارزان
بله/خیر auth پیش از بارگذاری Plugin کامل کانال نیاز دارند. وضعیت auth ماندگارشده
وضعیت کانال پیکربندی‌شده نیست: از این metadata برای فعال‌سازی خودکار Pluginها،
repair وابستگی‌های runtime، یا تصمیم‌گیری درباره اینکه runtime کانال باید load شود استفاده نکنید.
export هدف باید یک function کوچک باشد که فقط وضعیت ماندگارشده را می‌خواند؛ آن را
از طریق barrel کامل runtime کانال route نکنید.

`openclaw.channel.configuredState` برای بررسی‌های ارزان configured فقط env
از همان شکل پیروی می‌کند:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

زمانی از آن استفاده کنید که یک کانال بتواند configured-state را از env یا سایر inputهای کوچک
غیر runtime پاسخ دهد. اگر بررسی به resolution کامل config یا runtime واقعی
کانال نیاز دارد، آن logic را به‌جای آن در hook مربوط به Plugin `config.hasConfiguredState`
نگه دارید.

## اولویت discovery (شناسه‌های تکراری Plugin)

OpenClaw Pluginها را از چند root کشف می‌کند (bundled، نصب global، workspace، مسیرهای صریح انتخاب‌شده توسط config). اگر دو discovery یک `id` یکسان داشته باشند، فقط manifest با **بالاترین اولویت** نگه داشته می‌شود؛ duplicateهای با اولویت پایین‌تر به‌جای اینکه کنار آن بارگذاری شوند، حذف می‌شوند.

اولویت، از بیشترین به کمترین:

1. **انتخاب‌شده توسط config** — مسیری که صراحتاً در `plugins.entries.<id>` pin شده است
2. **Bundled** — Pluginهایی که همراه OpenClaw shipped می‌شوند
3. **نصب global** — Pluginهایی که در root global Plugin مربوط به OpenClaw نصب شده‌اند
4. **Workspace** — Pluginهایی که نسبت به workspace فعلی کشف می‌شوند

پیامدها:

- یک کپی forkشده یا stale از یک bundled plugin که در workspace قرار دارد، build bundled را shadow نخواهد کرد.
- برای override واقعی یک bundled plugin با یک مورد local، آن را از طریق `plugins.entries.<id>` pin کنید تا به‌جای تکیه بر discovery از workspace، بر اساس اولویت برنده شود.
- حذف duplicateها log می‌شود تا Doctor و عیب‌یابی‌های startup بتوانند به کپی کنارگذاشته‌شده اشاره کنند.
- overrideهای duplicate انتخاب‌شده توسط config در عیب‌یابی‌ها به‌صورت overrideهای صریح بیان می‌شوند، اما همچنان هشدار می‌دهند تا forkهای stale و shadowهای تصادفی قابل مشاهده بمانند.

## الزامات JSON Schema

- **هر Plugin باید یک JSON Schema همراه داشته باشد**، حتی اگر هیچ config نپذیرد.
- schema خالی قابل قبول است (برای مثال، `{ "type": "object", "additionalProperties": false }`).
- Schemaها هنگام خواندن/نوشتن config اعتبارسنجی می‌شوند، نه در runtime.
- هنگام گسترش یا fork کردن یک bundled plugin با کلیدهای config جدید، هم‌زمان `configSchema` همان Plugin در `openclaw.plugin.json` را به‌روزرسانی کنید. Schemaهای bundled plugin سخت‌گیر هستند، بنابراین افزودن `plugins.entries.<id>.config.myNewKey` در config کاربر بدون افزودن `myNewKey` به `configSchema.properties` پیش از بارگذاری runtime مربوط به Plugin رد خواهد شد.

نمونه extension برای schema:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## رفتار اعتبارسنجی

- کلیدهای ناشناخته `channels.*` **خطا** هستند، مگر اینکه شناسه کانال توسط
  manifest یک Plugin اعلام شده باشد.
- `plugins.entries.<id>`، `plugins.allow`، `plugins.deny`، و `plugins.slots.*`
  باید به شناسه‌های Plugin **قابل discovery** اشاره کنند. شناسه‌های ناشناخته **خطا** هستند.
- اگر یک Plugin نصب شده باشد اما manifest یا schema آن خراب یا missing باشد،
  اعتبارسنجی fail می‌شود و Doctor خطای Plugin را گزارش می‌کند.
- اگر config مربوط به Plugin وجود داشته باشد اما Plugin **غیرفعال** باشد، config نگه داشته می‌شود و
  یک **هشدار** در Doctor + logها نمایش داده می‌شود.

برای schema کامل `plugins.*`، [مرجع پیکربندی](/fa/gateway/configuration) را ببینید.

## یادداشت‌ها

- مانیفست برای **Pluginهای بومی OpenClaw** الزامی است، از جمله بارگذاری‌های فایل‌سیستم محلی. زمان اجرا همچنان ماژول Plugin را جداگانه بارگذاری می‌کند؛ مانیفست فقط برای کشف + اعتبارسنجی است.
- مانیفست‌های بومی با JSON5 تجزیه می‌شوند، بنابراین کامنت‌ها، ویرگول‌های انتهایی و کلیدهای بدون کوتیشن پذیرفته می‌شوند، تا زمانی که مقدار نهایی همچنان یک شیء باشد.
- فقط فیلدهای مستندشده‌ی مانیفست توسط بارگذار مانیفست خوانده می‌شوند. از کلیدهای سفارشی در سطح بالایی خودداری کنید.
- `channels`، `providers`، `cliBackends` و `skills` همگی وقتی یک Plugin به آن‌ها نیاز ندارد می‌توانند حذف شوند.
- `providerDiscoveryEntry` باید سبک بماند و نباید کد گسترده‌ی زمان اجرا را import کند؛ از آن برای فراداده‌ی ایستای کاتالوگ ارائه‌دهنده یا توصیفگرهای محدود کشف استفاده کنید، نه اجرای زمان درخواست.
- گونه‌های انحصاری Plugin از طریق `plugins.slots.*` انتخاب می‌شوند: `kind: "memory"` از طریق `plugins.slots.memory`، و `kind: "context-engine"` از طریق `plugins.slots.contextEngine` (پیش‌فرض `legacy`).
- گونه‌ی انحصاری Plugin را در این مانیفست اعلام کنید. `OpenClawPluginDefinition.kind` در ورودی زمان اجرا منسوخ شده و فقط به‌عنوان fallback سازگاری برای Pluginهای قدیمی‌تر باقی مانده است.
- فراداده‌ی متغیر محیطی (`setup.providers[].envVars`، `providerAuthEnvVars` منسوخ‌شده، و `channelEnvVars`) فقط اعلامی است. وضعیت، ممیزی، اعتبارسنجی تحویل Cron و سایر سطوح فقط‌خواندنی همچنان سیاست اعتماد Plugin و فعال‌سازی مؤثر را پیش از تلقی کردن یک متغیر محیطی به‌عنوان پیکربندی‌شده اعمال می‌کنند.
- برای فراداده‌ی جادوگر زمان اجرا که به کد ارائه‌دهنده نیاز دارد، [hookهای زمان اجرای ارائه‌دهنده](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
- اگر Plugin شما به ماژول‌های بومی وابسته است، مراحل ساخت و هرگونه الزامات allowlist مدیر بسته را مستند کنید (برای مثال، pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## مرتبط

<CardGroup cols={3}>
  <Card title="ساخت Pluginها" href="/fa/plugins/building-plugins" icon="rocket">
    شروع کار با Pluginها.
  </Card>
  <Card title="معماری Plugin" href="/fa/plugins/architecture" icon="diagram-project">
    معماری داخلی و مدل قابلیت.
  </Card>
  <Card title="نمای کلی SDK" href="/fa/plugins/sdk-overview" icon="book">
    مرجع SDK Plugin و importهای subpath.
  </Card>
</CardGroup>
