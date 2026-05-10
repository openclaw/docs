---
read_when:
    - شما در حال ساخت یک Plugin برای OpenClaw هستید
    - باید یک شمای پیکربندی Plugin را منتشر کنید یا خطاهای اعتبارسنجی Plugin را اشکال‌زدایی کنید
summary: مانیفست Plugin و الزامات طرح‌وارهٔ JSON (اعتبارسنجی سخت‌گیرانهٔ پیکربندی)
title: مانیفست Plugin
x-i18n:
    generated_at: "2026-05-10T19:55:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

این صفحه فقط برای **مانیفست بومی Plugin در OpenClaw** است.

برای چیدمان‌های بسته سازگار، [بسته‌های Plugin](/fa/plugins/bundles) را ببینید.

قالب‌های بسته سازگار از فایل‌های مانیفست متفاوتی استفاده می‌کنند:

- بسته Codex: `.codex-plugin/plugin.json`
- بسته Claude: `.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude
  بدون مانیفست
- بسته Cursor: `.cursor-plugin/plugin.json`

OpenClaw این چیدمان‌های بسته را نیز به‌طور خودکار شناسایی می‌کند، اما آن‌ها در برابر
شِمای `openclaw.plugin.json` که اینجا توصیف شده اعتبارسنجی نمی‌شوند.

برای بسته‌های سازگار، OpenClaw در حال حاضر فراداده بسته به‌همراه ریشه‌های Skills اعلام‌شده،
ریشه‌های فرمان Claude، پیش‌فرض‌های `settings.json` در بسته Claude،
پیش‌فرض‌های LSP در بسته Claude، و بسته‌های hook پشتیبانی‌شده را زمانی می‌خواند که چیدمان با
انتظارات زمان اجرای OpenClaw مطابقت داشته باشد.

هر Plugin بومی OpenClaw **باید** یک فایل `openclaw.plugin.json` را در
**ریشه Plugin** همراه داشته باشد. OpenClaw از این مانیفست برای اعتبارسنجی پیکربندی
**بدون اجرای کد Plugin** استفاده می‌کند. مانیفست‌های ناموجود یا نامعتبر به‌عنوان
خطاهای Plugin در نظر گرفته می‌شوند و اعتبارسنجی پیکربندی را مسدود می‌کنند.

راهنمای کامل سیستم Plugin را ببینید: [Plugins](/fa/tools/plugin).
برای مدل قابلیت بومی و راهنمای فعلی سازگاری خارجی:
[مدل قابلیت](/fa/plugins/architecture#public-capability-model).

## این فایل چه کاری انجام می‌دهد

`openclaw.plugin.json` فراداده‌ای است که OpenClaw **پیش از بارگذاری کد
Plugin شما** می‌خواند. همه موارد زیر باید آن‌قدر سبک باشند که بدون راه‌اندازی
زمان اجرای Plugin قابل بررسی باشند.

**از آن برای این موارد استفاده کنید:**

- هویت Plugin، اعتبارسنجی پیکربندی، و راهنماهای رابط کاربری پیکربندی
- فراداده احراز هویت، راه‌اندازی اولیه، و تنظیمات (نام مستعار، فعال‌سازی خودکار، متغیرهای محیطی ارائه‌دهنده، گزینه‌های احراز هویت)
- راهنماهای فعال‌سازی برای سطوح صفحه کنترل
- مالکیت کوتاه‌نویسی خانواده مدل
- نماهای ایستای مالکیت قابلیت (`contracts`)
- فراداده اجراکننده QA که میزبان مشترک `openclaw qa` بتواند بررسی کند
- فراداده پیکربندی مخصوص کانال که در کاتالوگ و سطوح اعتبارسنجی ادغام می‌شود

**از آن برای این موارد استفاده نکنید:** ثبت رفتار زمان اجرا، اعلام entrypointهای کد،
یا فراداده نصب npm. این موارد به کد Plugin شما و `package.json` تعلق دارند.

## نمونه کمینه

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

## نمونه کامل

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

| فیلد                                | الزامی | نوع                             | معنای آن                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | بله      | `string`                         | شناسهٔ مرجع Plugin. این همان شناسه‌ای است که در `plugins.entries.<id>` استفاده می‌شود.                                                                                                                                                                 |
| `configSchema`                       | بله      | `object`                         | JSON Schema درون‌خطی برای پیکربندی این Plugin.                                                                                                                                                                                        |
| `enabledByDefault`                   | خیر       | `true`                           | یک Plugin بسته‌بندی‌شده را به‌صورت پیش‌فرض فعال‌شده علامت‌گذاری می‌کند. آن را حذف کنید، یا هر مقدار غیر از `true` تنظیم کنید، تا Plugin به‌صورت پیش‌فرض غیرفعال بماند.                                                                                                        |
| `enabledByDefaultOnPlatforms`        | خیر       | `string[]`                       | یک Plugin بسته‌بندی‌شده را فقط روی پلتفرم‌های Node.js فهرست‌شده، برای مثال `["darwin"]`، به‌صورت پیش‌فرض فعال‌شده علامت‌گذاری می‌کند. پیکربندی صریح همچنان اولویت دارد.                                                                                            |
| `legacyPluginIds`                    | خیر       | `string[]`                       | شناسه‌های قدیمی که به این شناسهٔ مرجع Plugin نرمال‌سازی می‌شوند.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده‌ای که وقتی احراز هویت، پیکربندی، یا ارجاع‌های مدل به آن‌ها اشاره کنند، باید این Plugin را به‌صورت خودکار فعال کنند.                                                                                                                                     |
| `kind`                               | خیر       | `"memory"` \| `"context-engine"` | نوع انحصاری Plugin را که توسط `plugins.slots.*` استفاده می‌شود اعلام می‌کند.                                                                                                                                                                        |
| `channels`                           | خیر       | `string[]`                       | شناسه‌های کانال که مالکیتشان با این Plugin است. برای کشف و اعتبارسنجی پیکربندی استفاده می‌شود.                                                                                                                                                         |
| `providers`                          | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده که مالکیتشان با این Plugin است.                                                                                                                                                                                                  |
| `providerCatalogEntry`               | خیر       | `string`                         | مسیر ماژول سبک‌وزن کاتالوگ ارائه‌دهنده، نسبی به ریشهٔ Plugin، برای فرادادهٔ کاتالوگ ارائه‌دهنده در محدودهٔ مانیفست که می‌تواند بدون فعال‌سازی کامل runtime Plugin بارگذاری شود.                                                 |
| `modelSupport`                       | خیر       | `object`                         | فرادادهٔ خلاصهٔ خانوادهٔ مدل با مالکیت مانیفست که برای بارگذاری خودکار Plugin پیش از runtime استفاده می‌شود.                                                                                                                                         |
| `modelCatalog`                       | خیر       | `object`                         | فرادادهٔ اعلانی کاتالوگ مدل برای ارائه‌دهندگانی که مالکیتشان با این Plugin است. این قرارداد control-plane برای فهرست‌کردن فقط‌خواندنی آینده، راه‌اندازی اولیه، انتخابگرهای مدل، نام‌های مستعار، و سرکوب بدون بارگذاری runtime Plugin است.         |
| `modelPricing`                       | خیر       | `object`                         | خط‌مشی جست‌وجوی قیمت‌گذاری خارجی با مالکیت ارائه‌دهنده. از آن برای خارج‌کردن ارائه‌دهندگان محلی/خودمیزبان از کاتالوگ‌های قیمت‌گذاری راه‌دور یا نگاشت ارجاع‌های ارائه‌دهنده به شناسه‌های کاتالوگ OpenRouter/LiteLLM بدون کدنویسی سخت شناسه‌های ارائه‌دهنده در هسته استفاده کنید.             |
| `modelIdNormalization`               | خیر       | `object`                         | پاک‌سازی نام مستعار/پیشوند شناسهٔ مدل با مالکیت ارائه‌دهنده که باید پیش از بارگذاری runtime ارائه‌دهنده اجرا شود.                                                                                                                                           |
| `providerEndpoints`                  | خیر       | `object[]`                       | فرادادهٔ میزبان/baseUrl نقطهٔ پایانی با مالکیت مانیفست برای مسیرهای ارائه‌دهنده که هسته باید پیش از بارگذاری runtime ارائه‌دهنده طبقه‌بندی کند.                                                                                                            |
| `providerRequest`                    | خیر       | `object`                         | فرادادهٔ کم‌هزینهٔ خانوادهٔ ارائه‌دهنده و سازگاری درخواست که توسط خط‌مشی درخواست عمومی پیش از بارگذاری runtime ارائه‌دهنده استفاده می‌شود.                                                                                                              |
| `cliBackends`                        | خیر       | `string[]`                       | شناسه‌های بک‌اند استنتاج CLI که مالکیتشان با این Plugin است. برای فعال‌سازی خودکار هنگام راه‌اندازی از ارجاع‌های پیکربندی صریح استفاده می‌شود.                                                                                                                         |
| `syntheticAuthRefs`                  | خیر       | `string[]`                       | ارجاع‌های ارائه‌دهنده یا بک‌اند CLI که hook احراز هویت مصنوعی با مالکیت Plugin آن‌ها باید هنگام کشف سرد مدل پیش از بارگذاری runtime بررسی شود.                                                                                              |
| `nonSecretAuthMarkers`               | خیر       | `string[]`                       | مقادیر جایگزین کلید API با مالکیت Plugin بسته‌بندی‌شده که وضعیت اعتبارنامهٔ محلی، OAuth، یا محیطی غیرمحرمانه را نشان می‌دهند.                                                                                                                |
| `commandAliases`                     | خیر       | `object[]`                       | نام‌های فرمان با مالکیت این Plugin که باید پیش از بارگذاری runtime، عیب‌یابی پیکربندی و CLI آگاه از Plugin تولید کنند.                                                                                                                |
| `providerAuthEnvVars`                | خیر       | `Record<string, string[]>`       | فرادادهٔ سازگاری منسوخ‌شدهٔ env برای جست‌وجوی احراز هویت/وضعیت ارائه‌دهنده. برای Pluginهای جدید `setup.providers[].envVars` را ترجیح دهید؛ OpenClaw همچنان در بازهٔ منسوخ‌سازی این مقدار را می‌خواند.                                                 |
| `providerAuthAliases`                | خیر       | `Record<string, string>`         | شناسه‌های ارائه‌دهنده‌ای که باید از شناسهٔ ارائه‌دهندهٔ دیگری برای جست‌وجوی احراز هویت استفاده کنند، برای مثال یک ارائه‌دهندهٔ کدنویسی که کلید API ارائه‌دهندهٔ پایه و پروفایل‌های احراز هویت را به اشتراک می‌گذارد.                                                                          |
| `channelEnvVars`                     | خیر       | `Record<string, string[]>`       | فرادادهٔ کم‌هزینهٔ env کانال که OpenClaw می‌تواند بدون بارگذاری کد Plugin آن را بررسی کند. از این برای راه‌اندازی کانال مبتنی بر env یا سطوح احراز هویت که helperهای عمومی راه‌اندازی/پیکربندی باید ببینند استفاده کنید.                                            |
| `providerAuthChoices`                | خیر       | `object[]`                       | فرادادهٔ کم‌هزینهٔ انتخاب احراز هویت برای انتخابگرهای راه‌اندازی اولیه، حل ارائه‌دهندهٔ ترجیحی، و اتصال سادهٔ flagهای CLI.                                                                                                                       |
| `activation`                         | خیر       | `object`                         | فرادادهٔ کم‌هزینهٔ برنامه‌ریز فعال‌سازی برای راه‌اندازی، ارائه‌دهنده، فرمان، کانال، مسیر، و بارگذاری برانگیخته از قابلیت. فقط فراداده است؛ runtime Plugin همچنان مالک رفتار واقعی است.                                                       |
| `setup`                              | خیر       | `object`                         | توصیف‌گرهای کم‌هزینهٔ setup/راه‌اندازی اولیه که سطوح کشف و setup می‌توانند بدون بارگذاری runtime Plugin بررسی کنند.                                                                                                                    |
| `qaRunners`                          | خیر       | `object[]`                       | توصیف‌گرهای کم‌هزینهٔ اجراکنندهٔ QA که میزبان مشترک `openclaw qa` پیش از بارگذاری runtime Plugin استفاده می‌کند.                                                                                                                                      |
| `contracts`                          | خیر       | `object`                         | snapshot ایستای مالکیت قابلیت برای hookهای احراز هویت خارجی، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید موسیقی، تولید ویدیو، web-fetch، جست‌وجوی وب، و مالکیت ابزار. |
| `mediaUnderstandingProviderMetadata` | خیر       | `Record<string, object>`         | پیش‌فرض‌های کم‌هزینهٔ درک رسانه برای شناسه‌های ارائه‌دهندهٔ اعلام‌شده در `contracts.mediaUnderstandingProviders`.                                                                                                                            |
| `imageGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ کم‌هزینهٔ احراز هویت تولید تصویر برای شناسه‌های ارائه‌دهندهٔ اعلام‌شده در `contracts.imageGenerationProviders`، شامل نام‌های مستعار احراز هویت با مالکیت ارائه‌دهنده و محافظ‌های base-url.                                                                  |
| `videoGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ کم‌هزینهٔ احراز هویت تولید ویدیو برای شناسه‌های ارائه‌دهندهٔ اعلام‌شده در `contracts.videoGenerationProviders`، شامل نام‌های مستعار احراز هویت با مالکیت ارائه‌دهنده و محافظ‌های base-url.                                                                  |
| `musicGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ کم‌هزینهٔ احراز هویت تولید موسیقی برای شناسه‌های ارائه‌دهندهٔ اعلام‌شده در `contracts.musicGenerationProviders`، شامل نام‌های مستعار احراز هویت با مالکیت ارائه‌دهنده و محافظ‌های base-url.                                                                  |
| `toolMetadata`                       | خیر       | `Record<string, object>`         | فرادادهٔ کم‌هزینهٔ دسترس‌پذیری برای ابزارهای با مالکیت Plugin که در `contracts.tools` اعلام شده‌اند. وقتی یک ابزار نباید runtime را بارگذاری کند مگر اینکه شواهد پیکربندی، env، یا احراز هویت وجود داشته باشد، از آن استفاده کنید.                                                           |
| `channelConfigs`                     | خیر       | `Record<string, object>`         | فرادادهٔ پیکربندی کانال با مالکیت مانیفست که پیش از بارگذاری runtime در سطوح کشف و اعتبارسنجی ادغام می‌شود.                                                                                                                          |
| `skills`                             | خیر       | `string[]`                       | دایرکتوری‌های Skill برای بارگذاری، نسبی به ریشهٔ Plugin.                                                                                                                                                                             |
| `name`                               | خیر       | `string`                         | نام Plugin قابل‌خواندن برای انسان.                                                                                                                                                                                                         |
| `description`                        | خیر       | `string`                         | خلاصهٔ کوتاهی که در سطح‌های Plugin نمایش داده می‌شود.                                                                                                                                                                                             |
| `version`                            | خیر       | `string`                         | نسخهٔ اطلاعاتی Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | خیر       | `Record<string, object>`         | برچسب‌های رابط کاربری، جای‌نگهدارها، و راهنماهای حساسیت برای فیلدهای پیکربندی.                                                                                                                                                                   |

## مرجع فرادادهٔ ارائه‌دهندهٔ تولید

فیلدهای فرادادهٔ ارائه‌دهندهٔ تولید، سیگنال‌های ایستای احراز هویت را برای
ارائه‌دهنده‌هایی توصیف می‌کنند که در فهرست متناظر `contracts.*GenerationProviders` اعلام شده‌اند.
OpenClaw این فیلدها را پیش از بارگذاری زمان اجرای ارائه‌دهنده می‌خواند تا ابزارهای هسته بتوانند
بدون import کردن هر Plugin ارائه‌دهنده، تصمیم بگیرند آیا یک ارائه‌دهندهٔ تولید در دسترس است یا نه.

این فیلدها را فقط برای واقعیت‌های ارزان و اعلانی استفاده کنید. انتقال، تبدیل‌های درخواست،
نوسازی توکن، اعتبارسنجی اعتبارنامه، و رفتار واقعی تولید
در زمان اجرای Plugin باقی می‌مانند.

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

| فیلد            | الزامی | نوع        | معنی آن                                                                                                                               |
| --------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | خیر    | `string[]` | شناسه‌های اضافی ارائه‌دهنده که باید به‌عنوان نام‌های مستعار ایستای احراز هویت برای ارائه‌دهندهٔ تولید محسوب شوند.                    |
| `authProviders` | خیر    | `string[]` | شناسه‌های ارائه‌دهنده‌ای که پروفایل‌های احراز هویت پیکربندی‌شدهٔ آن‌ها باید به‌عنوان احراز هویت برای این ارائه‌دهندهٔ تولید محسوب شود. |
| `configSignals` | خیر    | `object[]` | سیگنال‌های در دسترس بودن ارزان و فقط مبتنی بر پیکربندی برای ارائه‌دهنده‌های محلی یا خودمیزبان که بدون پروفایل‌های احراز هویت یا متغیرهای محیطی قابل پیکربندی‌اند. |
| `authSignals`   | خیر    | `object[]` | سیگنال‌های صریح احراز هویت. وقتی وجود داشته باشند، مجموعهٔ سیگنال پیش‌فرض حاصل از شناسهٔ ارائه‌دهنده، `aliases` و `authProviders` را جایگزین می‌کنند. |

هر ورودی `configSignals` از این موارد پشتیبانی می‌کند:

| فیلد          | الزامی | نوع        | معنی آن                                                                                                                                                                                   |
| ------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | بله    | `string`   | مسیر نقطه‌ای به شیء پیکربندی متعلق به Plugin برای بررسی، برای مثال `plugins.entries.example.config`.                                                                                     |
| `overlayPath` | خیر    | `string`   | مسیر نقطه‌ای داخل پیکربندی ریشه که شیء آن باید پیش از ارزیابی سیگنال روی شیء ریشه overlay شود. از این برای پیکربندی ویژهٔ قابلیت مانند `image`، `video` یا `music` استفاده کنید. |
| `required`    | خیر    | `string[]` | مسیرهای نقطه‌ای داخل پیکربندی مؤثر که باید مقدارهای پیکربندی‌شده داشته باشند. رشته‌ها باید غیرخالی باشند؛ اشیا و آرایه‌ها نباید خالی باشند.                                          |
| `requiredAny` | خیر    | `string[]` | مسیرهای نقطه‌ای داخل پیکربندی مؤثر که دست‌کم یکی از آن‌ها باید مقدار پیکربندی‌شده داشته باشد.                                                                                           |
| `mode`        | خیر    | `object`   | نگهبان اختیاری حالت رشته‌ای داخل پیکربندی مؤثر. وقتی در دسترس بودن فقط مبتنی بر پیکربندی فقط برای یک حالت صدق می‌کند، از این استفاده کنید.                                          |

هر نگهبان `mode` از این موارد پشتیبانی می‌کند:

| فیلد          | الزامی | نوع        | معنی آن                                                                                      |
| ------------ | ------ | ---------- | -------------------------------------------------------------------------------------------- |
| `path`       | خیر    | `string`   | مسیر نقطه‌ای داخل پیکربندی مؤثر. مقدار پیش‌فرض `mode` است.                                  |
| `default`    | خیر    | `string`   | مقدار حالت برای استفاده زمانی که پیکربندی مسیر را حذف کرده است.                            |
| `allowed`    | خیر    | `string[]` | اگر وجود داشته باشد، سیگنال فقط زمانی عبور می‌کند که حالت مؤثر یکی از این مقدارها باشد.     |
| `disallowed` | خیر    | `string[]` | اگر وجود داشته باشد، سیگنال زمانی شکست می‌خورد که حالت مؤثر یکی از این مقدارها باشد.        |

هر ورودی `authSignals` از این موارد پشتیبانی می‌کند:

| فیلد              | الزامی | نوع      | معنی آن                                                                                                                                                                     |
| ----------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | بله    | `string` | شناسهٔ ارائه‌دهنده برای بررسی در پروفایل‌های احراز هویت پیکربندی‌شده.                                                                                                      |
| `providerBaseUrl` | خیر    | `object` | نگهبان اختیاری که باعث می‌شود سیگنال فقط زمانی محسوب شود که ارائه‌دهندهٔ پیکربندی‌شدهٔ ارجاع‌داده‌شده از URL پایهٔ مجاز استفاده کند. از این زمانی استفاده کنید که یک نام مستعار احراز هویت فقط برای APIهای خاصی معتبر است. |

هر نگهبان `providerBaseUrl` از این موارد پشتیبانی می‌کند:

| فیلد              | الزامی | نوع        | معنی آن                                                                                                                                      |
| ----------------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | بله    | `string`   | شناسهٔ پیکربندی ارائه‌دهنده که `baseUrl` آن باید بررسی شود.                                                                                 |
| `defaultBaseUrl`  | خیر    | `string`   | URL پایه‌ای که وقتی پیکربندی ارائه‌دهنده `baseUrl` را حذف کرده است باید فرض شود.                                                           |
| `allowedBaseUrls` | بله    | `string[]` | URLهای پایهٔ مجاز برای این سیگنال احراز هویت. وقتی URL پایهٔ پیکربندی‌شده یا پیش‌فرض با یکی از این مقدارهای نرمال‌سازی‌شده مطابقت نداشته باشد، سیگنال نادیده گرفته می‌شود. |

## مرجع فرادادهٔ ابزار

`toolMetadata` از همان شکل‌های `configSignals` و `authSignals` فرادادهٔ
ارائه‌دهندهٔ تولید استفاده می‌کند و با نام ابزار کلیدگذاری می‌شود. `contracts.tools` مالکیت را اعلام می‌کند.
`toolMetadata` شواهد ارزان در دسترس بودن را اعلام می‌کند تا OpenClaw بتواند
از import کردن زمان اجرای Plugin فقط برای اینکه کارخانهٔ ابزار آن `null` برگرداند، اجتناب کند.

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
وقتی قرارداد ابزار با سیاست مطابقت دارد، Plugin مالک را بارگذاری می‌کند. برای ابزارهای مسیر داغ
که کارخانهٔ آن‌ها به احراز هویت/پیکربندی وابسته است، نویسندگان Plugin باید
به‌جای اینکه هسته را وادار کنند زمان اجرا را برای پرس‌وجو import کند، `toolMetadata` را اعلام کنند.

## مرجع providerAuthChoices

هر ورودی `providerAuthChoices` یک گزینهٔ onboarding یا احراز هویت را توصیف می‌کند.
OpenClaw این را پیش از بارگذاری زمان اجرای ارائه‌دهنده می‌خواند.
فهرست‌های راه‌اندازی ارائه‌دهنده از این گزینه‌های manifest، گزینه‌های راه‌اندازی مشتق‌شده از descriptor،
و فرادادهٔ کاتالوگ نصب بدون بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌کنند.

| فیلد                  | الزامی | نوع                                             | معنی آن                                                                                                 |
| --------------------- | ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | بله    | `string`                                        | شناسهٔ ارائه‌دهنده‌ای که این گزینه به آن تعلق دارد.                                                    |
| `method`              | بله    | `string`                                        | شناسهٔ روش احراز هویت برای dispatch به آن.                                                             |
| `choiceId`            | بله    | `string`                                        | شناسهٔ پایدار گزینهٔ احراز هویت که توسط جریان‌های onboarding و CLI استفاده می‌شود.                     |
| `choiceLabel`         | خیر    | `string`                                        | برچسب قابل مشاهده برای کاربر. اگر حذف شود، OpenClaw به `choiceId` fallback می‌کند.                    |
| `choiceHint`          | خیر    | `string`                                        | متن راهنمای کوتاه برای انتخاب‌گر.                                                                      |
| `assistantPriority`   | خیر    | `number`                                        | مقدارهای کمتر در انتخاب‌گرهای تعاملی هدایت‌شده توسط assistant زودتر مرتب می‌شوند.                     |
| `assistantVisibility` | خیر    | `"visible"` \| `"manual-only"`                  | گزینه را از انتخاب‌گرهای assistant پنهان می‌کند، در حالی که انتخاب دستی CLI همچنان مجاز است.          |
| `deprecatedChoiceIds` | خیر    | `string[]`                                      | شناسه‌های قدیمی گزینه که باید کاربران را به این گزینهٔ جایگزین هدایت کنند.                            |
| `groupId`             | خیر    | `string`                                        | شناسهٔ اختیاری گروه برای گروه‌بندی گزینه‌های مرتبط.                                                   |
| `groupLabel`          | خیر    | `string`                                        | برچسب قابل مشاهده برای کاربر برای آن گروه.                                                            |
| `groupHint`           | خیر    | `string`                                        | متن راهنمای کوتاه برای گروه.                                                                           |
| `optionKey`           | خیر    | `string`                                        | کلید گزینهٔ داخلی برای جریان‌های احراز هویت ساده با یک flag.                                          |
| `cliFlag`             | خیر    | `string`                                        | نام flag در CLI، مانند `--openrouter-api-key`.                                                         |
| `cliOption`           | خیر    | `string`                                        | شکل کامل گزینهٔ CLI، مانند `--openrouter-api-key <key>`.                                               |
| `cliDescription`      | خیر    | `string`                                        | توضیحی که در راهنمای CLI استفاده می‌شود.                                                              |
| `onboardingScopes`    | خیر    | `Array<"text-inference" \| "image-generation">` | اینکه این گزینه باید در کدام سطوح onboarding ظاهر شود. اگر حذف شود، مقدار پیش‌فرض آن `["text-inference"]` است. |

## مرجع commandAliases

از `commandAliases` زمانی استفاده کنید که یک Plugin مالک نام فرمان runtime است که کاربران ممکن است
به‌اشتباه آن را در `plugins.allow` قرار دهند یا تلاش کنند آن را به‌عنوان فرمان ریشه CLI اجرا کنند. OpenClaw
از این metadata برای diagnostics بدون import کردن کد runtime مربوط به Plugin استفاده می‌کند.

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

| فیلد        | الزامی | نوع               | معنی آن                                                                 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | بله      | `string`          | نام فرمانی که متعلق به این Plugin است.                                  |
| `kind`       | خیر      | `"runtime-slash"` | این alias را به‌عنوان فرمان slash در chat، نه فرمان ریشه CLI، علامت‌گذاری می‌کند. |
| `cliCommand` | خیر      | `string`          | فرمان ریشه CLI مرتبطی که در صورت وجود برای عملیات CLI پیشنهاد می‌شود.  |

## مرجع activation

از `activation` زمانی استفاده کنید که Plugin بتواند به‌صورت کم‌هزینه اعلام کند کدام رویدادهای control-plane
باید آن را در طرح activation/load وارد کنند.

این بلوک metadata مربوط به planner است، نه یک API چرخه‌عمر. رفتار
runtime را ثبت نمی‌کند، جایگزین `register(...)` نمی‌شود، و وعده نمی‌دهد که
کد Plugin از قبل اجرا شده است. planner فعال‌سازی از این فیلدها برای
محدود کردن Pluginهای نامزد پیش از بازگشت به metadata مالکیت موجود در manifest
مانند `providers`، `channels`، `commandAliases`، `setup.providers`،
`contracts.tools` و hooks استفاده می‌کند.

باریک‌ترین metadataای را ترجیح دهید که از قبل مالکیت را توصیف می‌کند. زمانی از
`providers`، `channels`، `commandAliases`، توصیفگرهای setup، یا `contracts`
استفاده کنید که آن فیلدها رابطه را بیان می‌کنند. از `activation` برای راهنمایی‌های اضافی planner
استفاده کنید که با آن فیلدهای مالکیت قابل نمایش نیستند.
برای aliasهای runtime مربوط به CLI مانند `claude-cli`،
`codex-cli`، یا `google-gemini-cli` از `cliBackends` در سطح بالا استفاده کنید؛ `activation.onAgentHarnesses` فقط برای
شناسه‌های agent harness توکار است که از قبل فیلد مالکیت ندارند.

این بلوک فقط metadata است. رفتار runtime را ثبت نمی‌کند، و
جایگزین `register(...)`، `setupEntry`، یا entrypointهای runtime/Plugin دیگر نمی‌شود.
مصرف‌کنندگان فعلی از آن به‌عنوان راهنمای محدودسازی پیش از بارگذاری گسترده‌تر Plugin استفاده می‌کنند، بنابراین
نبود metadata فعال‌سازی غیر-startup معمولاً فقط هزینه عملکردی دارد؛
تا زمانی که fallbackهای مالکیت manifest هنوز وجود دارند، نباید درستی را تغییر دهد.

هر Plugin باید `activation.onStartup` را آگاهانه تنظیم کند. فقط زمانی آن را روی `true`
بگذارید که Plugin باید هنگام startup مربوط به Gateway اجرا شود. زمانی آن را روی `false` بگذارید که
Plugin در startup غیرفعال است و باید فقط از طریق triggerهای باریک‌تر load شود.
حذف `onStartup` دیگر Plugin را به‌صورت ضمنی در startup بارگذاری نمی‌کند؛ برای startup، channel، config، agent-harness، memory، یا
triggerهای فعال‌سازی باریک‌تر دیگر از metadata فعال‌سازی صریح استفاده کنید.

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

| فیلد              | الزامی | نوع                                                  | معنی آن                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | خیر      | `boolean`                                            | فعال‌سازی صریح هنگام startup مربوط به Gateway. هر Plugin باید این را تنظیم کند. `true` Plugin را هنگام startup import می‌کند؛ `false` آن را برای startup تنبل نگه می‌دارد مگر اینکه trigger منطبق دیگری بارگذاری را لازم کند. |
| `onProviders`      | خیر      | `string[]`                                           | شناسه‌های provider که باید این Plugin را در طرح‌های activation/load وارد کنند.                                                                                                                      |
| `onAgentHarnesses` | خیر      | `string[]`                                           | شناسه‌های runtime مربوط به agent harness توکار که باید این Plugin را در طرح‌های activation/load وارد کنند. برای aliasهای backend مربوط به CLI از `cliBackends` در سطح بالا استفاده کنید.                                           |
| `onCommands`       | خیر      | `string[]`                                           | شناسه‌های فرمان که باید این Plugin را در طرح‌های activation/load وارد کنند.                                                                                                                       |
| `onChannels`       | خیر      | `string[]`                                           | شناسه‌های channel که باید این Plugin را در طرح‌های activation/load وارد کنند.                                                                                                                       |
| `onRoutes`         | خیر      | `string[]`                                           | گونه‌های route که باید این Plugin را در طرح‌های activation/load وارد کنند.                                                                                                                       |
| `onConfigPaths`    | خیر      | `string[]`                                           | مسیرهای config نسبی به ریشه که باید این Plugin را در طرح‌های startup/load وارد کنند، زمانی که مسیر وجود دارد و به‌صورت صریح غیرفعال نشده است.                                                      |
| `onCapabilities`   | خیر      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | راهنمایی‌های گسترده capability که توسط برنامه‌ریزی فعال‌سازی control-plane استفاده می‌شوند. در صورت امکان فیلدهای باریک‌تر را ترجیح دهید.                                                                                     |

مصرف‌کنندگان live فعلی:

- برنامه‌ریزی startup مربوط به Gateway از `activation.onStartup` برای import صریح هنگام startup
  استفاده می‌کند
- برنامه‌ریزی CLI که با command trigger می‌شود به `commandAliases[].cliCommand` یا `commandAliases[].name`
  قدیمی fallback می‌کند
- برنامه‌ریزی startup مربوط به agent-runtime از `activation.onAgentHarnesses` برای
  harnessهای توکار و از `cliBackends[]` در سطح بالا برای aliasهای runtime مربوط به CLI استفاده می‌کند
- برنامه‌ریزی setup/channel که با channel trigger می‌شود، زمانی که metadata فعال‌سازی صریح channel وجود ندارد، به مالکیت `channels[]`
  قدیمی fallback می‌کند
- برنامه‌ریزی Plugin در startup از `activation.onConfigPaths` برای سطوح config ریشه غیر-channel
  مانند بلوک `browser` مربوط به Plugin مرورگر bundled استفاده می‌کند
- برنامه‌ریزی setup/runtime که با provider trigger می‌شود، زمانی که metadata فعال‌سازی صریح provider
  وجود ندارد، به مالکیت `providers[]` قدیمی و `cliBackends[]` در سطح بالا fallback می‌کند

diagnostics مربوط به planner می‌تواند راهنمایی‌های فعال‌سازی صریح را از fallback مالکیت manifest
تمایز دهد. برای مثال، `activation-command-hint` یعنی
`activation.onCommands` منطبق شده است، در حالی که `manifest-command-alias` یعنی
planner به‌جای آن از مالکیت `commandAliases` استفاده کرده است. این برچسب‌های دلیل برای
diagnostics و testهای host هستند؛ نویسندگان Plugin باید همچنان metadataای را اعلام کنند
که مالکیت را به بهترین شکل توصیف می‌کند.

## مرجع qaRunners

از `qaRunners` زمانی استفاده کنید که یک Plugin یک یا چند transport runner زیر
ریشه مشترک `openclaw qa` اضافه می‌کند. این metadata را کم‌هزینه و static نگه دارید؛ runtime مربوط به Plugin
هنوز مالک ثبت واقعی CLI از طریق یک سطح سبک
`runtime-api.ts` است که `qaRunnerCliRegistrations` را export می‌کند.

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

| فیلد          | الزامی | نوع      | معنی آن                                                       |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | بله      | `string` | subcommand نصب‌شده زیر `openclaw qa`، برای مثال `matrix`.    |
| `description` | خیر      | `string` | متن help جایگزین که وقتی host مشترک به یک stub command نیاز دارد استفاده می‌شود. |

## مرجع setup

از `setup` زمانی استفاده کنید که سطوح setup و onboarding پیش از load شدن runtime به metadata
کم‌هزینه و متعلق به Plugin نیاز دارند.

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

`cliBackends` در سطح بالا معتبر می‌ماند و همچنان backendهای inference مربوط به CLI را توصیف می‌کند.
`setup.cliBackends` سطح توصیفگر اختصاصی setup برای
جریان‌های control-plane/setup است که باید فقط metadata باقی بمانند.

وقتی وجود داشته باشند، `setup.providers` و `setup.cliBackends` سطح lookup ترجیحی descriptor-first
برای کشف setup هستند. اگر descriptor فقط
Plugin نامزد را محدود می‌کند و setup هنوز به hookهای runtime غنی‌تر در زمان setup نیاز دارد،
`requiresRuntime: true` را تنظیم کنید و `setup-api` را به‌عنوان
مسیر اجرای fallback حفظ کنید.

OpenClaw همچنین `setup.providers[].envVars` را در lookupهای عمومی auth مربوط به provider و
env-var وارد می‌کند. `providerAuthEnvVars` در طول پنجره deprecation همچنان از طریق یک compatibility
adapter پشتیبانی می‌شود، اما Pluginهای غیر-bundled که هنوز از آن استفاده می‌کنند
یک diagnostic مربوط به manifest دریافت می‌کنند. Pluginهای جدید باید metadata مربوط به env برای setup/status
را در `setup.providers[].envVars` قرار دهند.

OpenClaw همچنین می‌تواند انتخاب‌های setup ساده را از `setup.providers[].authMethods`
استنتاج کند، زمانی که entry مربوط به setup در دسترس نیست، یا زمانی که `setup.requiresRuntime: false`
اعلام می‌کند runtime مربوط به setup لازم نیست. entryهای صریح `providerAuthChoices` برای
برچسب‌های سفارشی، flagهای CLI، دامنه onboarding، و metadata دستیار همچنان ترجیح داده می‌شوند.

`requiresRuntime: false` را فقط زمانی تنظیم کنید که آن descriptorها برای
سطح setup کافی باشند. OpenClaw مقدار صریح `false` را به‌عنوان قرارداد descriptor-only
در نظر می‌گیرد و برای lookup مربوط به setup، `setup-api` یا `openclaw.setupEntry` را اجرا نخواهد کرد. اگر
یک Plugin descriptor-only همچنان یکی از آن entryهای runtime مربوط به setup را ارائه کند،
OpenClaw یک diagnostic افزایشی گزارش می‌دهد و همچنان آن را نادیده می‌گیرد. حذف
`requiresRuntime` رفتار fallback قدیمی را حفظ می‌کند تا Pluginهای موجود که
descriptorها را بدون flag اضافه کرده‌اند خراب نشوند.

از آنجا که lookup مربوط به setup می‌تواند کد `setup-api` متعلق به Plugin را اجرا کند، مقدارهای normalized
`setup.providers[].id` و `setup.cliBackends[]` باید در میان
Pluginهای کشف‌شده یکتا بمانند. مالکیت مبهم به‌جای انتخاب
یک برنده از ترتیب کشف، به‌صورت fail closed عمل می‌کند.

وقتی runtime مربوط به setup اجرا می‌شود، diagnostics رجیستری setup در صورتی descriptor
drift را گزارش می‌کند که `setup-api` یک provider یا backend مربوط به CLI را ثبت کند که descriptorهای manifest
اعلام نکرده‌اند، یا اگر یک descriptor ثبت runtime منطبق نداشته باشد.
این diagnostics افزایشی هستند و Pluginهای قدیمی را رد نمی‌کنند.

### مرجع setup.providers

| فیلد           | الزامی | نوع        | معنی آن                                                                                     |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | بله      | `string`   | شناسه provider که هنگام setup یا onboarding در معرض قرار می‌گیرد. شناسه‌های normalized را در سطح جهانی یکتا نگه دارید.             |
| `authMethods`  | خیر      | `string[]` | شناسه‌های روش setup/auth که این provider بدون load کردن runtime کامل پشتیبانی می‌کند.                       |
| `envVars`      | خیر      | `string[]` | env varهایی که سطوح عمومی setup/status می‌توانند پیش از load شدن runtime مربوط به Plugin بررسی کنند.               |
| `authEvidence` | خیر      | `object[]` | بررسی‌های کم‌هزینه شواهد auth محلی برای providerهایی که می‌توانند از طریق markerهای غیر-secret احراز هویت کنند. |

`authEvidence` برای نشانگرهای اعتبارنامهٔ محلیِ تحت مالکیت ارائه‌دهنده است که می‌توانند بدون بارگذاری کد runtime
راستی‌آزمایی شوند. این بررسی‌ها باید ارزان و محلی بمانند:
بدون فراخوانی شبکه، بدون خواندن keychain یا secret-manager، بدون فرمان‌های shell، و بدون
کاوش API ارائه‌دهنده.

ورودی‌های شواهد پشتیبانی‌شده:

| فیلد               | الزامی | نوع        | معنی آن                                                                                                           |
| ------------------ | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `type`             | بله    | `string`   | در حال حاضر `local-file-with-env`.                                                                                |
| `fileEnvVar`       | خیر    | `string`   | متغیر محیطی که یک مسیر صریح فایل اعتبارنامه را در خود دارد.                                                       |
| `fallbackPaths`    | خیر    | `string[]` | مسیرهای فایل اعتبارنامهٔ محلی که وقتی `fileEnvVar` وجود ندارد یا خالی است بررسی می‌شوند. از `${HOME}` و `${APPDATA}` پشتیبانی می‌کند. |
| `requiresAnyEnv`   | خیر    | `string[]` | دست‌کم یکی از متغیرهای محیطی فهرست‌شده باید غیرخالی باشد تا شواهد معتبر باشند.                                  |
| `requiresAllEnv`   | خیر    | `string[]` | همهٔ متغیرهای محیطی فهرست‌شده باید غیرخالی باشند تا شواهد معتبر باشند.                                           |
| `credentialMarker` | بله    | `string`   | نشانگر غیرمحرمانه‌ای که وقتی شواهد حاضر باشد بازگردانده می‌شود.                                                   |
| `source`           | خیر    | `string`   | برچسب منبعِ قابل مشاهده برای کاربر در خروجی احراز هویت/وضعیت.                                                     |

### فیلدهای setup

| فیلد               | الزامی | نوع        | معنی آن                                                                                                 |
| ------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | خیر    | `object[]` | توصیفگرهای راه‌اندازی ارائه‌دهنده که هنگام setup و onboarding عرضه می‌شوند.                            |
| `cliBackends`      | خیر    | `string[]` | شناسه‌های backend زمان setup که برای جست‌وجوی setup با اولویت توصیفگر استفاده می‌شوند. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید. |
| `configMigrations` | خیر    | `string[]` | شناسه‌های مهاجرت پیکربندی که سطح setup این plugin مالک آن‌هاست.                                        |
| `requiresRuntime`  | خیر    | `boolean`  | اینکه آیا setup پس از جست‌وجوی توصیفگر همچنان به اجرای `setup-api` نیاز دارد یا نه.                    |

## مرجع uiHints

`uiHints` نگاشتی از نام فیلدهای پیکربندی به راهنمایی‌های کوچک رندر است.

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

هر راهنمای فیلد می‌تواند شامل موارد زیر باشد:

| فیلد          | نوع        | معنی آن                                |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | برچسب فیلدِ قابل مشاهده برای کاربر.    |
| `help`        | `string`   | متن راهنمای کوتاه.                     |
| `tags`        | `string[]` | برچسب‌های اختیاری UI.                  |
| `advanced`    | `boolean`  | فیلد را پیشرفته علامت‌گذاری می‌کند.    |
| `sensitive`   | `boolean`  | فیلد را محرمانه یا حساس علامت‌گذاری می‌کند. |
| `placeholder` | `string`   | متن placeholder برای ورودی‌های فرم.    |

## مرجع contracts

از `contracts` فقط برای فرادادهٔ ایستای مالکیت قابلیت استفاده کنید که OpenClaw می‌تواند
بدون import کردن runtime plugin آن را بخواند.

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

| فیلد                             | نوع        | معنی آن                                                               |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | شناسه‌های factory اکستنشن app-server در Codex، در حال حاضر `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | شناسه‌های runtime که یک plugin همراه ممکن است middleware نتیجهٔ ابزار را برای آن‌ها ثبت کند. |
| `externalAuthProviders`          | `string[]` | شناسه‌های ارائه‌دهنده‌ای که hook پروفایل احراز هویت خارجی آن‌ها تحت مالکیت این plugin است. |
| `speechProviders`                | `string[]` | شناسه‌های ارائه‌دهندهٔ گفتاری که این plugin مالک آن‌هاست.             |
| `realtimeTranscriptionProviders` | `string[]` | شناسه‌های ارائه‌دهندهٔ رونویسی بی‌درنگ که این plugin مالک آن‌هاست.    |
| `realtimeVoiceProviders`         | `string[]` | شناسه‌های ارائه‌دهندهٔ صدای بی‌درنگ که این plugin مالک آن‌هاست.       |
| `memoryEmbeddingProviders`       | `string[]` | شناسه‌های ارائه‌دهندهٔ embedding حافظه که این plugin مالک آن‌هاست.    |
| `mediaUnderstandingProviders`    | `string[]` | شناسه‌های ارائه‌دهندهٔ فهم رسانه که این plugin مالک آن‌هاست.          |
| `imageGenerationProviders`       | `string[]` | شناسه‌های ارائه‌دهندهٔ تولید تصویر که این plugin مالک آن‌هاست.        |
| `videoGenerationProviders`       | `string[]` | شناسه‌های ارائه‌دهندهٔ تولید ویدئو که این plugin مالک آن‌هاست.        |
| `webFetchProviders`              | `string[]` | شناسه‌های ارائه‌دهندهٔ واکشی وب که این plugin مالک آن‌هاست.           |
| `webSearchProviders`             | `string[]` | شناسه‌های ارائه‌دهندهٔ جست‌وجوی وب که این plugin مالک آن‌هاست.        |
| `migrationProviders`             | `string[]` | شناسه‌های ارائه‌دهندهٔ import که این plugin برای `openclaw migrate` مالک آن‌هاست. |
| `tools`                          | `string[]` | نام‌های ابزار عامل که این plugin مالک آن‌هاست.                        |

`contracts.embeddedExtensionFactories` برای factoryهای اکستنشنِ فقط app-server و همراه Codex
نگه داشته شده است. تبدیل‌های همراهِ نتیجهٔ ابزار باید
در عوض `contracts.agentToolResultMiddleware` را اعلام کنند و با
`api.registerAgentToolResultMiddleware(...)` ثبت شوند. pluginهای خارجی نمی‌توانند
middleware نتیجهٔ ابزار را ثبت کنند، زیرا این seam می‌تواند خروجی ابزار با اعتماد بالا را
پیش از آنکه مدل آن را ببیند بازنویسی کند.

ثبت‌های runtime `api.registerTool(...)` باید با `contracts.tools` مطابق باشند.
کشف ابزار از این فهرست استفاده می‌کند تا فقط runtimeهای pluginهایی را بارگذاری کند که می‌توانند مالک
ابزارهای درخواست‌شده باشند.

pluginهای ارائه‌دهنده‌ای که `resolveExternalAuthProfiles` را پیاده‌سازی می‌کنند باید
`contracts.externalAuthProviders` را اعلام کنند. pluginهای بدون این اعلامیه هنوز
از مسیر fallback سازگاری منسوخ‌شده اجرا می‌شوند، اما آن fallback کندتر است و
پس از بازهٔ مهاجرت حذف خواهد شد.

ارائه‌دهنده‌های embedding حافظهٔ همراه باید
`contracts.memoryEmbeddingProviders` را برای هر شناسهٔ adapter که عرضه می‌کنند اعلام کنند، از جمله
adapterهای داخلی مانند `local`. مسیرهای CLI مستقل از این قرارداد manifest
استفاده می‌کنند تا پیش از آنکه runtime کامل Gateway ارائه‌دهنده‌ها را
ثبت کرده باشد، فقط plugin مالک را بارگذاری کنند.

## مرجع mediaUnderstandingProviderMetadata

از `mediaUnderstandingProviderMetadata` زمانی استفاده کنید که یک ارائه‌دهندهٔ فهم رسانه
مدل‌های پیش‌فرض، اولویت fallback احراز هویت خودکار، یا پشتیبانی بومی از سند داشته باشد که
کمک‌کننده‌های generic هسته پیش از بارگذاری runtime به آن نیاز دارند. کلیدها باید همچنین در
`contracts.mediaUnderstandingProviders` اعلام شده باشند.

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

هر ورودی ارائه‌دهنده می‌تواند شامل موارد زیر باشد:

| فیلد                   | نوع                                 | معنی آن                                                                 |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قابلیت‌های رسانه‌ای عرضه‌شده توسط این ارائه‌دهنده.                     |
| `defaultModels`        | `Record<string, string>`            | پیش‌فرض‌های قابلیت به مدل که وقتی پیکربندی مدلی مشخص نکرده استفاده می‌شوند. |
| `autoPriority`         | `Record<string, number>`            | عددهای کوچک‌تر برای fallback خودکار ارائه‌دهنده بر پایهٔ اعتبارنامه زودتر مرتب می‌شوند. |
| `nativeDocumentInputs` | `"pdf"[]`                           | ورودی‌های سند بومی که ارائه‌دهنده پشتیبانی می‌کند.                     |

## مرجع channelConfigs

از `channelConfigs` زمانی استفاده کنید که یک plugin کانال پیش از بارگذاری runtime
به فرادادهٔ پیکربندی ارزان نیاز داشته باشد. کشف فقط‌خواندنی setup/status کانال می‌تواند از این فراداده
مستقیما برای کانال‌های خارجی پیکربندی‌شده استفاده کند، وقتی هیچ ورودی setup در دسترس نیست، یا
وقتی `setup.requiresRuntime: false` اعلام می‌کند runtime setup غیرضروری است.

`channelConfigs` فرادادهٔ manifest plugin است، نه یک بخش پیکربندی سطح‌بالای جدید برای کاربر.
کاربران همچنان instanceهای کانال را زیر `channels.<channel-id>` پیکربندی می‌کنند.
OpenClaw فرادادهٔ manifest را می‌خواند تا پیش از اجرای کد runtime plugin تصمیم بگیرد کدام plugin مالک آن
کانال پیکربندی‌شده است.

برای یک plugin کانال، `configSchema` و `channelConfigs` مسیرهای متفاوتی را توصیف می‌کنند:

- `configSchema` اعتبارسنجی `plugins.entries.<plugin-id>.config` را انجام می‌دهد
- `channelConfigs.<channel-id>.schema` اعتبارسنجی `channels.<channel-id>` را انجام می‌دهد

pluginهای غیرهمراهی که `channels[]` را اعلام می‌کنند باید ورودی‌های منطبق
`channelConfigs` را نیز اعلام کنند. بدون آن‌ها، OpenClaw همچنان می‌تواند plugin را بارگذاری کند، اما
سطوح schema پیکربندی مسیر سرد، setup، و Control UI نمی‌توانند شکل گزینه‌های
تحت مالکیت کانال را تا زمان اجرای runtime plugin بدانند.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و
`nativeSkillsAutoEnabled` می‌توانند پیش‌فرض‌های ایستای `auto` را برای بررسی‌های پیکربندی command
که پیش از بارگذاری runtime کانال اجرا می‌شوند اعلام کنند. کانال‌های همراه نیز می‌توانند
همان پیش‌فرض‌ها را از طریق `package.json#openclaw.channel.commands` در کنار
فرادادهٔ کاتالوگ کانالِ تحت مالکیت package خود منتشر کنند.

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

هر ورودی کانال می‌تواند شامل موارد زیر باشد:

| فیلد         | نوع                     | معنی آن                                                                                  |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema برای `channels.<id>`. برای هر ورودی پیکربندی کانالِ اعلام‌شده الزامی است.   |
| `uiHints`     | `Record<string, object>` | برچسب‌ها/جای‌نگهدارها/راهنمایی‌های حساس اختیاری UI برای آن بخش پیکربندی کانال.          |
| `label`       | `string`                 | برچسب کانال که وقتی فراداده زمان اجرا آماده نیست، در سطح‌های انتخاب‌گر و بازرسی ادغام می‌شود. |
| `description` | `string`                 | توضیح کوتاه کانال برای سطح‌های بازرسی و کاتالوگ.                                        |
| `commands`    | `object`                 | پیش‌فرض‌های خودکار فرمان بومی ثابت و مهارت بومی برای بررسی‌های پیکربندی پیش از زمان اجرا. |
| `preferOver`  | `string[]`               | شناسه‌های قدیمی یا کم‌اولویت‌تر پلاگین که این کانال باید در سطح‌های انتخاب از آن‌ها جلوتر باشد. |

### جایگزینی یک پلاگین کانال دیگر

وقتی پلاگین شما مالک ترجیحی برای شناسه کانالی است که
پلاگین دیگری نیز می‌تواند ارائه کند، از `preferOver` استفاده کنید. موارد رایج شامل شناسه پلاگین تغییرنام‌یافته،
پلاگین مستقلی که جایگزین یک پلاگین بسته‌بندی‌شده می‌شود، یا فورک نگهداری‌شده‌ای است که
برای سازگاری پیکربندی همان شناسه کانال را نگه می‌دارد.

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
شناسه پلاگین ترجیحی را در نظر می‌گیرد. اگر پلاگین کم‌اولویت‌تر فقط به این دلیل انتخاب شده باشد
که بسته‌بندی‌شده است یا به‌صورت پیش‌فرض فعال شده، OpenClaw آن را در پیکربندی مؤثر
زمان اجرا غیرفعال می‌کند تا یک پلاگین مالک کانال و ابزارهای آن باشد. انتخاب صریح کاربر
همچنان برنده است: اگر کاربر هر دو پلاگین را صراحتاً فعال کند، OpenClaw
آن انتخاب را حفظ می‌کند و به‌جای تغییر بی‌صدای مجموعه پلاگین‌های درخواستی،
عیب‌یابی‌های کانال/ابزار تکراری را گزارش می‌دهد.

`preferOver` را فقط به شناسه‌های پلاگینی محدود کنید که واقعاً می‌توانند همان کانال را ارائه کنند.
این یک فیلد اولویت عمومی نیست و کلیدهای پیکربندی کاربر را تغییرنام نمی‌دهد.

## مرجع modelSupport

وقتی OpenClaw باید پیش از بارگذاری زمان اجرای پلاگین، پلاگین ارائه‌دهنده شما را از
شناسه‌های کوتاه مدل مانند `gpt-5.5` یا `claude-sonnet-4.6` استنتاج کند، از `modelSupport` استفاده کنید.

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
- `modelPatterns` بر `modelPrefixes` مقدم است
- اگر یک پلاگین غیربسته‌بندی‌شده و یک پلاگین بسته‌بندی‌شده هر دو منطبق باشند، پلاگین غیربسته‌بندی‌شده
  برنده می‌شود
- ابهام باقی‌مانده تا زمانی که کاربر یا پیکربندی ارائه‌دهنده‌ای را مشخص کند نادیده گرفته می‌شود

فیلدها:

| فیلد           | نوع       | معنی آن                                                                    |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | پیشوندهایی که با `startsWith` در برابر شناسه‌های کوتاه مدل تطبیق داده می‌شوند. |
| `modelPatterns` | `string[]` | منابع Regex که پس از حذف پسوند پروفایل در برابر شناسه‌های کوتاه مدل تطبیق داده می‌شوند. |

## مرجع modelCatalog

وقتی OpenClaw باید پیش از بارگذاری زمان اجرای پلاگین، فراداده مدل ارائه‌دهنده را بداند،
از `modelCatalog` استفاده کنید. این منبع تحت مالکیت مانیفست برای ردیف‌های ثابت کاتالوگ،
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

| فیلد          | نوع                                                     | معنی آن                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | ردیف‌های کاتالوگ برای شناسه‌های ارائه‌دهنده که مالکشان این پلاگین است. کلیدها باید در `providers` سطح بالا نیز ظاهر شوند. |
| `aliases`      | `Record<string, object>`                                 | نام‌های مستعار ارائه‌دهنده که باید برای برنامه‌ریزی کاتالوگ یا سرکوب به یک ارائه‌دهنده تحت مالکیت حل شوند. |
| `suppressions` | `object[]`                                               | ردیف‌های مدل از منبعی دیگر که این پلاگین به دلیلی مخصوص ارائه‌دهنده سرکوب می‌کند. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | اینکه کاتالوگ ارائه‌دهنده می‌تواند از فراداده مانیفست خوانده شود، در کش تازه‌سازی شود، یا به زمان اجرا نیاز دارد. |

`aliases` در جست‌وجوی مالکیت ارائه‌دهنده برای برنامه‌ریزی کاتالوگ مدل مشارکت می‌کند.
هدف‌های نام مستعار باید ارائه‌دهندگان سطح بالایی باشند که مالکشان همان پلاگین است. وقتی یک
فهرست فیلترشده بر اساس ارائه‌دهنده از نام مستعار استفاده می‌کند، OpenClaw می‌تواند مانیفست مالک را بخواند و
بدون بارگذاری زمان اجرای ارائه‌دهنده، بازنویسی‌های API/نشانی پایه نام مستعار را اعمال کند.
نام‌های مستعار فهرست‌های کاتالوگ بدون فیلتر را گسترش نمی‌دهند؛ فهرست‌های گسترده فقط ردیف‌های
ارائه‌دهنده canonical مالک را منتشر می‌کنند.

`suppressions` جایگزین hook قدیمی `suppressBuiltInModel` زمان اجرای ارائه‌دهنده می‌شود.
ورودی‌های سرکوب فقط زمانی رعایت می‌شوند که ارائه‌دهنده مالکیتش با پلاگین باشد یا
به‌عنوان یک کلید `modelCatalog.aliases` اعلام شده باشد که به یک ارائه‌دهنده تحت مالکیت اشاره می‌کند. hookهای سرکوب
زمان اجرا دیگر هنگام حل مدل فراخوانی نمی‌شوند.

فیلدهای ارائه‌دهنده:

| فیلد     | نوع                     | معنی آن                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | نشانی پایه پیش‌فرض اختیاری برای مدل‌ها در این کاتالوگ ارائه‌دهنده. |
| `api`     | `ModelApi`               | آداپتور API پیش‌فرض اختیاری برای مدل‌ها در این کاتالوگ ارائه‌دهنده. |
| `headers` | `Record<string, string>` | سرآیندهای ثابت اختیاری که برای این کاتالوگ ارائه‌دهنده اعمال می‌شوند. |
| `models`  | `object[]`               | ردیف‌های مدل الزامی. ردیف‌های بدون `id` نادیده گرفته می‌شوند.    |

فیلدهای مدل:

| فیلد           | نوع                                                           | معنی آن                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | شناسه مدل محلیِ ارائه‌دهنده، بدون پیشوند `provider/`.                    |
| `name`          | `string`                                                       | نام نمایشی اختیاری.                                                       |
| `api`           | `ModelApi`                                                     | بازنویسی اختیاری API برای هر مدل.                                        |
| `baseUrl`       | `string`                                                       | بازنویسی اختیاری نشانی پایه برای هر مدل.                                |
| `headers`       | `Record<string, string>`                                       | سرآیندهای ثابت اختیاری برای هر مدل.                                      |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | modalities که مدل می‌پذیرد.                                              |
| `reasoning`     | `boolean`                                                      | اینکه مدل رفتار reasoning را ارائه می‌کند یا نه.                         |
| `contextWindow` | `number`                                                       | پنجره زمینه بومی ارائه‌دهنده.                                             |
| `contextTokens` | `number`                                                       | سقف مؤثر اختیاری زمینه زمان اجرا وقتی با `contextWindow` متفاوت است.     |
| `maxTokens`     | `number`                                                       | بیشینه توکن‌های خروجی، وقتی مشخص باشد.                                  |
| `cost`          | `object`                                                       | قیمت‌گذاری اختیاری به دلار آمریکا برای هر میلیون توکن، شامل `tieredPricing` اختیاری. |
| `compat`        | `object`                                                       | پرچم‌های سازگاری اختیاری منطبق با سازگاری پیکربندی مدل OpenClaw.       |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | وضعیت فهرست‌شدن. فقط وقتی سرکوب کنید که ردیف اصلاً نباید ظاهر شود.      |
| `statusReason`  | `string`                                                       | دلیل اختیاری که همراه وضعیت غیر available نمایش داده می‌شود.            |
| `replaces`      | `string[]`                                                     | شناسه‌های قدیمی‌تر مدل محلیِ ارائه‌دهنده که این مدل جایگزینشان می‌شود. |
| `replacedBy`    | `string`                                                       | شناسه مدل محلیِ ارائه‌دهنده جایگزین برای ردیف‌های deprecated.          |
| `tags`          | `string[]`                                                     | برچسب‌های پایدار استفاده‌شده توسط انتخاب‌گرها و فیلترها.                |

فیلدهای سرکوب:

| فیلد                      | نوع       | معنی آن                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | شناسه ارائه‌دهنده برای ردیف بالادستی که باید سرکوب شود. باید مالکیتش با این پلاگین باشد یا به‌عنوان نام مستعار تحت مالکیت اعلام شده باشد. |
| `model`                    | `string`   | شناسه مدل محلیِ ارائه‌دهنده برای سرکوب.                                                                  |
| `reason`                   | `string`   | پیام اختیاری که وقتی ردیف سرکوب‌شده مستقیماً درخواست می‌شود نمایش داده می‌شود.                         |
| `when.baseUrlHosts`        | `string[]` | فهرست اختیاری میزبان‌های نشانی پایه مؤثر ارائه‌دهنده که پیش از اعمال سرکوب لازم‌اند.                  |
| `when.providerConfigApiIn` | `string[]` | فهرست اختیاری مقادیر دقیق `api` پیکربندی ارائه‌دهنده که پیش از اعمال سرکوب لازم‌اند.                  |

داده‌های فقط زمان اجرا را در `modelCatalog` قرار ندهید. فقط زمانی از `static` استفاده کنید که ردیف‌های مانیفست
برای سطح‌های فهرست و انتخاب‌گر فیلترشده بر اساس ارائه‌دهنده به اندازه‌ی کافی کامل باشند تا بتوانند از
کشف registry/زمان اجرا صرف‌نظر کنند. زمانی از `refreshable` استفاده کنید که ردیف‌های مانیفست
دانه‌ها یا تکمیل‌کننده‌های قابل‌فهرست‌سازی مفیدی باشند، اما refresh/cache بتواند بعدا ردیف‌های بیشتری اضافه کند؛
ردیف‌های refreshable به‌تنهایی مرجع قطعی نیستند. زمانی از `runtime` استفاده کنید که OpenClaw
برای دانستن فهرست باید زمان اجرای ارائه‌دهنده را بارگذاری کند.

## مرجع modelIdNormalization

از `modelIdNormalization` برای پاک‌سازی ارزان model-id متعلق به ارائه‌دهنده استفاده کنید که باید
پیش از بارگذاری زمان اجرای ارائه‌دهنده انجام شود. این کار aliasهایی مانند نام‌های کوتاه مدل،
شناسه‌های قدیمی محلیِ ارائه‌دهنده، و قواعد پیشوند proxy را به‌جای جدول‌های انتخاب مدل در core،
در مانیفست Plugin مالک نگه می‌دارد.

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

| فیلد                                | نوع                    | معنای آن                                                                                  |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | aliasهای دقیق model-id بدون حساسیت به بزرگی و کوچکی حروف. مقدارها همان‌طور که نوشته شده‌اند برگردانده می‌شوند. |
| `stripPrefixes`                      | `string[]`              | پیشوندهایی که پیش از جست‌وجوی alias حذف می‌شوند، مفید برای تکرار قدیمی provider/model. |
| `prefixWhenBare`                     | `string`                | پیشوندی که وقتی شناسه‌ی نرمال‌شده‌ی مدل از قبل شامل `/` نیست اضافه می‌شود. |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | قواعد شرطی پیشوند bare-id پس از جست‌وجوی alias، با کلیدهای `modelPrefix` و `prefix`. |

## مرجع providerEndpoints

از `providerEndpoints` برای طبقه‌بندی endpoint استفاده کنید که سیاست درخواست عمومی باید
پیش از بارگذاری زمان اجرای ارائه‌دهنده بداند. core همچنان مالک معنای هر
`endpointClass` است؛ مانیفست‌های Plugin مالک فراداده‌ی میزبان و URL پایه هستند.

فیلدهای endpoint:

| فیلد                          | نوع       | معنای آن                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | کلاس endpoint شناخته‌شده‌ی core، مانند `openrouter`، `moonshot-native`، یا `google-vertex`. |
| `hosts`                        | `string[]` | نام‌های میزبان دقیق که به کلاس endpoint نگاشت می‌شوند. |
| `hostSuffixes`                 | `string[]` | پسوندهای میزبان که به کلاس endpoint نگاشت می‌شوند. برای تطبیق فقط پسوند دامنه، با `.` شروع کنید. |
| `baseUrls`                     | `string[]` | URLهای پایه‌ی HTTP(S) نرمال‌شده‌ی دقیق که به کلاس endpoint نگاشت می‌شوند. |
| `googleVertexRegion`           | `string`   | ناحیه‌ی ثابت Google Vertex برای میزبان‌های جهانی دقیق. |
| `googleVertexRegionHostSuffix` | `string`   | پسوندی که از میزبان‌های مطابق حذف می‌شود تا پیشوند ناحیه‌ی Google Vertex آشکار شود. |

## مرجع providerRequest

از `providerRequest` برای فراداده‌ی ارزان سازگاری درخواست استفاده کنید که سیاست
درخواست عمومی بدون بارگذاری زمان اجرای ارائه‌دهنده نیاز دارد. بازنویسی payload وابسته به رفتار را
در hookهای زمان اجرای ارائه‌دهنده یا helperهای مشترک خانواده‌ی ارائه‌دهنده نگه دارید.

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

| فیلد                 | نوع         | معنای آن                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | برچسب خانواده‌ی ارائه‌دهنده که برای تصمیم‌های عمومی سازگاری درخواست و تشخیص‌ها استفاده می‌شود. |
| `compatibilityFamily` | `"moonshot"` | bucket اختیاری سازگاری خانواده‌ی ارائه‌دهنده برای helperهای مشترک درخواست. |
| `openAICompletions`   | `object`     | flagهای درخواست completions سازگار با OpenAI، در حال حاضر `supportsStreamingUsage`. |

## مرجع modelPricing

زمانی از `modelPricing` استفاده کنید که یک ارائه‌دهنده پیش از بارگذاری زمان اجرا به رفتار قیمت‌گذاری control-plane نیاز دارد.
کش قیمت‌گذاری Gateway این فراداده را بدون import کردن کد زمان اجرای
ارائه‌دهنده می‌خواند.

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

| فیلد        | نوع              | معنای آن                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | برای ارائه‌دهنده‌های محلی/خودمیزبان که هرگز نباید قیمت‌گذاری OpenRouter یا LiteLLM را fetch کنند، `false` تنظیم کنید. |
| `openRouter` | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری OpenRouter. `false` جست‌وجوی OpenRouter را برای این ارائه‌دهنده غیرفعال می‌کند. |
| `liteLLM`    | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری LiteLLM. `false` جست‌وجوی LiteLLM را برای این ارائه‌دهنده غیرفعال می‌کند. |

فیلدهای منبع:

| فیلد                      | نوع               | معنای آن                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | شناسه‌ی ارائه‌دهنده‌ی کاتالوگ خارجی وقتی با شناسه‌ی ارائه‌دهنده‌ی OpenClaw متفاوت است، برای مثال `z-ai` برای ارائه‌دهنده‌ی `zai`. |
| `passthroughProviderModel` | `boolean`          | شناسه‌های مدل دارای اسلش را به‌عنوان refهای تو در توی provider/model در نظر بگیرید، مفید برای ارائه‌دهنده‌های proxy مانند OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | گونه‌های اضافی model-id کاتالوگ خارجی. `version-dots` شناسه‌های نسخه‌ی نقطه‌دار مانند `claude-opus-4.6` را امتحان می‌کند. |

### نمایه‌ی ارائه‌دهندگان OpenClaw

نمایه‌ی ارائه‌دهندگان OpenClaw فراداده‌ی preview متعلق به OpenClaw برای ارائه‌دهندگانی است
که Pluginهایشان ممکن است هنوز نصب نشده باشند. این بخشی از مانیفست Plugin نیست.
مانیفست‌های Plugin همچنان مرجع Plugin نصب‌شده هستند. نمایه‌ی ارائه‌دهندگان
قرارداد fallback داخلی است که سطح‌های آینده‌ی ارائه‌دهنده‌ی قابل‌نصب و انتخاب‌گر مدل پیش از نصب
وقتی Plugin ارائه‌دهنده نصب نشده باشد مصرف خواهند کرد.

ترتیب مرجعیت کاتالوگ:

1. پیکربندی کاربر.
2. `modelCatalog` مانیفست Plugin نصب‌شده.
3. کش کاتالوگ مدل از refresh صریح.
4. ردیف‌های preview نمایه‌ی ارائه‌دهندگان OpenClaw.

نمایه‌ی ارائه‌دهندگان نباید شامل secretها، وضعیت فعال‌بودن، hookهای زمان اجرا، یا
داده‌ی زنده‌ی مدلِ ویژه‌ی حساب باشد. کاتالوگ‌های preview آن از همان شکل ردیف ارائه‌دهنده‌ی
`modelCatalog` مانند مانیفست‌های Plugin استفاده می‌کنند، اما باید به فراداده‌ی نمایشی پایدار
محدود بمانند مگر اینکه فیلدهای runtime adapter مانند `api`،
`baseUrl`، قیمت‌گذاری، یا flagهای سازگاری عمدا با مانیفست Plugin نصب‌شده هم‌راستا نگه داشته شوند.
ارائه‌دهندگانی با کشف زنده‌ی `/models` باید به‌جای اینکه فهرست‌کردن معمول یا onboarding
APIهای ارائه‌دهنده را فراخوانی کند، ردیف‌های refreshشده را از مسیر صریح کش کاتالوگ مدل بنویسند.

ورودی‌های نمایه‌ی ارائه‌دهندگان همچنین می‌توانند فراداده‌ی Plugin قابل‌نصب را برای ارائه‌دهندگانی حمل کنند
که Plugin آن‌ها از core خارج شده یا در غیر این صورت هنوز نصب نشده است. این
فراداده از الگوی کاتالوگ channel پیروی می‌کند: نام package، spec نصب npm،
integrity مورد انتظار، و برچسب‌های ارزان انتخاب auth برای نمایش یک گزینه‌ی setup قابل‌نصب کافی هستند.
پس از نصب Plugin، مانیفست آن برنده می‌شود و
ورودی نمایه‌ی ارائه‌دهندگان برای آن ارائه‌دهنده نادیده گرفته می‌شود.

کلیدهای capability سطح بالای قدیمی منسوخ شده‌اند. از `openclaw doctor --fix` برای
انتقال `speechProviders`، `realtimeTranscriptionProviders`،
`realtimeVoiceProviders`، `mediaUnderstandingProviders`،
`imageGenerationProviders`، `videoGenerationProviders`،
`webFetchProviders`، و `webSearchProviders` به زیر `contracts` استفاده کنید؛ بارگذاری
عادی مانیفست دیگر آن فیلدهای سطح بالا را به‌عنوان مالکیت capability در نظر نمی‌گیرد.

## مانیفست در برابر package.json

این دو فایل وظایف متفاوتی دارند:

| فایل                   | کاربرد آن                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | کشف، اعتبارسنجی پیکربندی، فراداده‌ی انتخاب auth، و اشاره‌های UI که باید پیش از اجرای کد Plugin وجود داشته باشند |
| `package.json`         | فراداده‌ی npm، نصب وابستگی، و بلوک `openclaw` که برای entrypointها، gating نصب، setup، یا فراداده‌ی کاتالوگ استفاده می‌شود |

اگر مطمئن نیستید یک قطعه فراداده کجا باید قرار بگیرد، از این قاعده استفاده کنید:

- اگر OpenClaw باید آن را پیش از بارگذاری کد Plugin بداند، آن را در `openclaw.plugin.json` قرار دهید
- اگر درباره‌ی packaging، فایل‌های entry، یا رفتار نصب npm است، آن را در `package.json` قرار دهید

### فیلدهای package.json که بر کشف اثر می‌گذارند

بعضی فراداده‌های پیش از زمان اجرای Plugin عمدا به‌جای `openclaw.plugin.json` در
بلوک `openclaw` در `package.json` قرار می‌گیرند.
`openclaw.bundle` و `openclaw.bundle.json` قراردادهای Plugin در OpenClaw نیستند؛
Pluginهای native باید از `openclaw.plugin.json` به‌همراه فیلدهای پشتیبانی‌شده‌ی
`package.json#openclaw` زیر استفاده کنند.

نمونه‌های مهم:

| فیلد                                                                                      | معنای آن                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | نقطه‌های ورود Plugin بومی را اعلام می‌کند. باید داخل دایرکتوری بستهٔ Plugin باقی بماند.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | نقطه‌های ورود runtime ساخته‌شدهٔ JavaScript را برای بسته‌های نصب‌شده اعلام می‌کند. باید داخل دایرکتوری بستهٔ Plugin باقی بماند.                                                                 |
| `openclaw.setupEntry`                                                                      | نقطهٔ ورود سبک‌وزنِ فقط برای راه‌اندازی که هنگام onboarding، شروع به‌تعویق‌افتادهٔ کانال، و کشف وضعیت کانال فقط‌خواندنی/SecretRef استفاده می‌شود. باید داخل دایرکتوری بستهٔ Plugin باقی بماند. |
| `openclaw.runtimeSetupEntry`                                                               | نقطهٔ ورود راه‌اندازی ساخته‌شدهٔ JavaScript را برای بسته‌های نصب‌شده اعلام می‌کند. به `setupEntry` نیاز دارد، باید وجود داشته باشد، و باید داخل دایرکتوری بستهٔ Plugin باقی بماند.                         |
| `openclaw.channel`                                                                         | فرادادهٔ کم‌هزینهٔ کاتالوگ کانال مانند برچسب‌ها، مسیرهای مستندات، نام‌های مستعار، و متن انتخاب.                                                                                                 |
| `openclaw.channel.commands`                                                                | فرادادهٔ ایستای دستور بومی و پیش‌فرض خودکار Skills بومی که پیش از بارگذاری runtime کانال توسط سطح‌های پیکربندی، audit، و فهرست دستورها استفاده می‌شود.                                          |
| `openclaw.channel.configuredState`                                                         | فرادادهٔ سبک‌وزنِ بررسی‌کنندهٔ وضعیت پیکربندی‌شده که می‌تواند بدون بارگذاری runtime کامل کانال به این پرسش پاسخ دهد: «آیا راه‌اندازی فقط-env از قبل وجود دارد؟»                                         |
| `openclaw.channel.persistedAuthState`                                                      | فرادادهٔ سبک‌وزنِ بررسی‌کنندهٔ احراز هویت پایدار که می‌تواند بدون بارگذاری runtime کامل کانال به این پرسش پاسخ دهد: «آیا چیزی از قبل وارد سیستم شده است؟»                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | راهنمایی‌های نصب/به‌روزرسانی برای Pluginهای بسته‌بندی‌شده و منتشرشدهٔ خارجی.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | مسیر نصب ترجیحی هنگامی که چند منبع نصب در دسترس است.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | حداقل نسخهٔ پشتیبانی‌شدهٔ میزبان OpenClaw، با استفاده از کف semver مانند `>=2026.3.22` یا `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | رشتهٔ integrity مورد انتظار npm dist مانند `sha512-...`؛ جریان‌های نصب و به‌روزرسانی artifact دریافت‌شده را در برابر آن راستی‌آزمایی می‌کنند.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | یک مسیر بازیابی نصب مجدد محدود برای Plugin بسته‌بندی‌شده را هنگامی که پیکربندی نامعتبر است مجاز می‌کند.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | اجازه می‌دهد سطح‌های کانالِ فقط راه‌اندازی، پیش از Plugin کامل کانال هنگام startup بارگذاری شوند.                                                                                                 |

فرادادهٔ manifest تعیین می‌کند کدام انتخاب‌های provider/کانال/راه‌اندازی پیش از بارگذاری runtime در
onboarding ظاهر شوند. `package.json#openclaw.install` به
onboarding می‌گوید وقتی کاربر یکی از آن
انتخاب‌ها را برمی‌گزیند، چگونه آن Plugin را دریافت یا فعال کند. راهنمایی‌های نصب را به `openclaw.plugin.json` منتقل نکنید.

`openclaw.install.minHostVersion` هنگام نصب و بارگذاری registry
manifest برای منابع Plugin غیر بسته‌بندی‌شده اعمال می‌شود. مقادیر نامعتبر رد می‌شوند؛
مقادیر جدیدتر اما معتبر، Pluginهای خارجی را روی میزبان‌های قدیمی‌تر نادیده می‌گیرند. Pluginهای منبع
بسته‌بندی‌شده فرض می‌شوند که هم‌نسخه با checkout میزبان هستند.

فرادادهٔ رسمی install-on-demand باید وقتی Plugin روی ClawHub منتشر شده است از `clawhubSpec` استفاده کند؛ onboarding آن را به‌عنوان منبع راه‌دور ترجیحی در نظر می‌گیرد و
پس از نصب، واقعیت‌های artifact مربوط به ClawHub را ثبت می‌کند. `npmSpec` همچنان fallback سازگاری
برای بسته‌هایی است که هنوز به ClawHub منتقل نشده‌اند.

پین‌کردن دقیق نسخهٔ npm از قبل در `npmSpec` قرار دارد، برای مثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. مدخل‌های رسمی کاتالوگ خارجی
باید specهای دقیق را با `expectedIntegrity` جفت کنند تا اگر artifact دریافت‌شدهٔ npm دیگر با انتشار پین‌شده مطابقت نداشت، جریان‌های به‌روزرسانی به‌صورت بسته شکست بخورند.
onboarding تعاملی همچنان برای سازگاری، specهای npm از registry مورد اعتماد، از جمله نام‌های خام
بسته و dist-tagها، را ارائه می‌دهد. عیب‌یابی‌های کاتالوگ می‌توانند
منابع دقیق، شناور، پین‌شده با integrity، فاقد integrity، دارای عدم تطابق نام بسته،
و default-choice نامعتبر را از هم تشخیص دهند. همچنین وقتی
`expectedIntegrity` وجود دارد اما هیچ منبع npm معتبری که بتواند آن را پین کند وجود ندارد هشدار می‌دهند.
وقتی `expectedIntegrity` وجود دارد،
جریان‌های نصب/به‌روزرسانی آن را اعمال می‌کنند؛ وقتی حذف شده باشد، resolution رجیستری
بدون پین integrity ثبت می‌شود.

Pluginهای کانال باید وقتی اسکن‌های وضعیت، فهرست کانال،
یا SecretRef باید حساب‌های پیکربندی‌شده را بدون بارگذاری runtime کامل
شناسایی کنند، `openclaw.setupEntry` ارائه دهند. نقطهٔ ورود راه‌اندازی باید فرادادهٔ کانال به‌همراه پیکربندی،
و adapterهای وضعیت و secrets امن برای راه‌اندازی را ارائه کند؛ کلاینت‌های شبکه، شنونده‌های Gateway، و
runtimeهای transport را در نقطهٔ ورود اصلی extension نگه دارید.

فیلدهای نقطهٔ ورود runtime، بررسی‌های مرز بسته برای فیلدهای نقطهٔ ورود
منبع را override نمی‌کنند. برای مثال، `openclaw.runtimeExtensions` نمی‌تواند یک
مسیر `openclaw.extensions` خارج‌شونده را قابل بارگذاری کند.

`openclaw.install.allowInvalidConfigRecovery` عمدا محدود است. این
پیکربندی‌های خراب دلخواه را قابل نصب نمی‌کند. امروزه فقط به جریان‌های نصب اجازه می‌دهد
از شکست‌های مشخص و stale ارتقای Plugin بسته‌بندی‌شده بازیابی شوند، مانند یک
مسیر گم‌شدهٔ Plugin بسته‌بندی‌شده یا یک مدخل stale از `channels.<id>` برای همان
Plugin بسته‌بندی‌شده. خطاهای پیکربندی نامرتبط همچنان نصب را مسدود می‌کنند و operatorها
را به `openclaw doctor --fix` می‌فرستند.

`openclaw.channel.persistedAuthState` فرادادهٔ بسته برای یک module بررسی‌کنندهٔ کوچک است:

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

وقتی جریان‌های راه‌اندازی، doctor، وضعیت، یا حضور فقط‌خواندنی پیش از بارگذاری Plugin کامل کانال به یک
probe احراز هویت ارزان yes/no نیاز دارند، از آن استفاده کنید. وضعیت احراز هویت پایدار
وضعیت کانال پیکربندی‌شده نیست: از این فراداده برای فعال‌سازی خودکار Pluginها،
تعمیر وابستگی‌های runtime، یا تصمیم‌گیری دربارهٔ اینکه آیا runtime کانال باید بارگذاری شود استفاده نکنید.
export هدف باید یک تابع کوچک باشد که فقط وضعیت پایدار را می‌خواند؛ آن را
از طریق barrel کامل runtime کانال عبور ندهید.

`openclaw.channel.configuredState` برای بررسی‌های ارزان وضعیت پیکربندی‌شدهٔ فقط-env
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

وقتی یک کانال می‌تواند وضعیت پیکربندی‌شده را از env یا ورودی‌های کوچک
غیر-runtime دیگر پاسخ دهد، از آن استفاده کنید. اگر بررسی به resolution کامل پیکربندی یا runtime واقعی
کانال نیاز دارد، آن منطق را به‌جای آن در hook مربوط به `config.hasConfiguredState`
در Plugin نگه دارید.

## تقدم کشف (idهای تکراری Plugin)

OpenClaw، Pluginها را از چند ریشه کشف می‌کند (بسته‌بندی‌شده، نصب global، workspace، مسیرهای صریح انتخاب‌شده در پیکربندی). اگر دو کشف `id` یکسان داشته باشند، فقط manifest با **بالاترین تقدم** نگه داشته می‌شود؛ تکراری‌های با تقدم پایین‌تر به‌جای بارگذاری در کنار آن، کنار گذاشته می‌شوند.

تقدم، از بیشترین به کمترین:

1. **انتخاب‌شده در پیکربندی** — مسیری که به‌صراحت در `plugins.entries.<id>` پین شده است
2. **بسته‌بندی‌شده** — Pluginهایی که همراه OpenClaw ارائه می‌شوند
3. **نصب global** — Pluginهایی که در ریشهٔ global Plugin مربوط به OpenClaw نصب شده‌اند
4. **Workspace** — Pluginهایی که نسبت به workspace فعلی کشف می‌شوند

پیامدها:

- یک کپی fork شده یا stale از یک Plugin بسته‌بندی‌شده که در workspace قرار دارد، build بسته‌بندی‌شده را shadow نمی‌کند.
- برای override واقعی یک Plugin بسته‌بندی‌شده با نمونهٔ local، آن را از طریق `plugins.entries.<id>` پین کنید تا با تقدم برنده شود، نه اینکه به کشف workspace تکیه کنید.
- کنارگذاشتن تکراری‌ها log می‌شود تا Doctor و عیب‌یابی‌های startup بتوانند به کپی کنارگذاشته‌شده اشاره کنند.
- overrideهای تکراریِ انتخاب‌شده در پیکربندی در عیب‌یابی‌ها به‌عنوان overrideهای صریح بیان می‌شوند، اما همچنان هشدار می‌دهند تا forkهای stale و shadowهای تصادفی قابل مشاهده بمانند.

## الزامات JSON Schema

- **هر Plugin باید یک JSON Schema ارائه کند**، حتی اگر هیچ پیکربندی‌ای نمی‌پذیرد.
- یک schema خالی قابل قبول است (برای مثال، `{ "type": "object", "additionalProperties": false }`).
- schemaها هنگام خواندن/نوشتن پیکربندی اعتبارسنجی می‌شوند، نه در runtime.
- هنگام گسترش یا fork کردن یک Plugin بسته‌بندی‌شده با کلیدهای پیکربندی جدید، هم‌زمان `configSchema` در `openclaw.plugin.json` همان Plugin را به‌روزرسانی کنید. schemaهای Plugin بسته‌بندی‌شده سخت‌گیرانه‌اند، بنابراین افزودن `plugins.entries.<id>.config.myNewKey` در پیکربندی کاربر بدون افزودن `myNewKey` به `configSchema.properties` پیش از بارگذاری runtime Plugin رد خواهد شد.

نمونهٔ گسترش schema:

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

- کلیدهای ناشناختهٔ `channels.*` **خطا** هستند، مگر اینکه id کانال توسط
  manifest یک Plugin اعلام شده باشد.
- `plugins.entries.<id>`، `plugins.allow`، `plugins.deny`، و `plugins.slots.*`
  باید به idهای Plugin **قابل کشف** اشاره کنند. idهای ناشناخته **خطا** هستند.
- اگر Plugin نصب شده باشد اما manifest یا schema خراب یا گم‌شده داشته باشد،
  اعتبارسنجی شکست می‌خورد و Doctor خطای Plugin را گزارش می‌کند.
- اگر پیکربندی Plugin وجود داشته باشد اما Plugin **غیرفعال** باشد، پیکربندی نگه داشته می‌شود و
  یک **هشدار** در Doctor و logها نمایش داده می‌شود.

برای schema کامل `plugins.*`، [مرجع پیکربندی](/fa/gateway/configuration) را ببینید.

## یادداشت‌ها

- manifest برای **Pluginهای بومی OpenClaw** الزامی است، از جمله بارگذاری‌ها از فایل‌سیستم محلی. Runtime همچنان ماژول Plugin را جداگانه بارگذاری می‌کند؛ manifest فقط برای کشف + اعتبارسنجی است.
- manifestهای بومی با JSON5 تجزیه می‌شوند، بنابراین تا زمانی که مقدار نهایی همچنان یک شیء باشد، commentها، ویرگول‌های انتهایی، و کلیدهای بدون کوتیشن پذیرفته می‌شوند.
- manifest loader فقط فیلدهای مستندسازی‌شده‌ی manifest را می‌خواند. از کلیدهای سفارشی در سطح بالا پرهیز کنید.
- وقتی یک Plugin به `channels`، `providers`، `cliBackends`، و `skills` نیاز ندارد، همه‌ی آن‌ها می‌توانند حذف شوند.
- `providerCatalogEntry` باید سبک بماند و نباید کد گسترده‌ی Runtime را import کند؛ از آن برای فراداده‌ی ثابت کاتالوگ provider یا توصیف‌گرهای محدود کشف استفاده کنید، نه اجرای زمان درخواست. `providerDiscoveryEntry` املای قدیمی است و همچنان برای Pluginهای موجود کار می‌کند.
- نوع‌های انحصاری Plugin از طریق `plugins.slots.*` انتخاب می‌شوند: `kind: "memory"` از طریق `plugins.slots.memory`، و `kind: "context-engine"` از طریق `plugins.slots.contextEngine` (پیش‌فرض `legacy`).
- نوع انحصاری Plugin را در این manifest اعلام کنید. `OpenClawPluginDefinition.kind` در مدخل Runtime منسوخ شده و فقط به‌عنوان fallback سازگاری برای Pluginهای قدیمی‌تر باقی مانده است.
- فراداده‌ی env-var (`setup.providers[].envVars`، `providerAuthEnvVars` منسوخ‌شده، و `channelEnvVars`) فقط اعلانی است. وضعیت، audit، اعتبارسنجی تحویل Cron، و سایر سطح‌های فقط‌خواندنی همچنان پیش از اینکه یک env var را پیکربندی‌شده در نظر بگیرند، سیاست اعتماد Plugin و فعال‌سازی مؤثر را اعمال می‌کنند.
- برای فراداده‌ی wizard در Runtime که به کد provider نیاز دارد، [قلاب‌های Runtime provider](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
- اگر Plugin شما به native moduleها وابسته است، مراحل build و هرگونه نیازمندی allowlist مربوط به package manager را مستند کنید (برای مثال، pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## مرتبط

<CardGroup cols={3}>
  <Card title="ساخت Pluginها" href="/fa/plugins/building-plugins" icon="rocket">
    شروع کار با Pluginها.
  </Card>
  <Card title="معماری Plugin" href="/fa/plugins/architecture" icon="diagram-project">
    معماری داخلی و مدل capability.
  </Card>
  <Card title="نمای کلی SDK" href="/fa/plugins/sdk-overview" icon="book">
    مرجع SDK مربوط به Plugin و importهای subpath.
  </Card>
</CardGroup>
