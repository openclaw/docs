---
read_when:
    - شما در حال ساخت یک Plugin برای OpenClaw هستید
    - باید یک طرح‌وارهٔ پیکربندی Plugin ارائه کنید یا خطاهای اعتبارسنجی Plugin را اشکال‌زدایی کنید
summary: مانیفست Plugin + الزامات طرحواره JSON (اعتبارسنجی سخت‌گیرانه پیکربندی)
title: مانیفست Plugin
x-i18n:
    generated_at: "2026-05-03T21:38:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

این صفحه فقط برای **مانیفست Plugin بومی OpenClaw** است.

برای چیدمان‌های بستهٔ سازگار، [بسته‌های Plugin](/fa/plugins/bundles) را ببینید.

قالب‌های بستهٔ سازگار از فایل‌های مانیفست متفاوتی استفاده می‌کنند:

- بستهٔ Codex: `.codex-plugin/plugin.json`
- بستهٔ Claude: `.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفهٔ Claude
  بدون مانیفست
- بستهٔ Cursor: `.cursor-plugin/plugin.json`

OpenClaw این چیدمان‌های بسته را هم به‌طور خودکار تشخیص می‌دهد، اما آن‌ها در برابر
طرح‌وارهٔ `openclaw.plugin.json` که اینجا توصیف شده اعتبارسنجی نمی‌شوند.

برای بسته‌های سازگار، OpenClaw در حال حاضر فرادادهٔ بسته به‌همراه ریشه‌های Skills اعلام‌شده، ریشه‌های فرمان Claude، پیش‌فرض‌های `settings.json` بستهٔ Claude،
پیش‌فرض‌های LSP بستهٔ Claude، و بسته‌های hook پشتیبانی‌شده را هنگامی می‌خواند که چیدمان با
انتظارات زمان اجرای OpenClaw هم‌خوان باشد.

هر Plugin بومی OpenClaw **باید** یک فایل `openclaw.plugin.json` را در
**ریشهٔ Plugin** ارائه کند. OpenClaw از این مانیفست برای اعتبارسنجی پیکربندی
**بدون اجرای کد Plugin** استفاده می‌کند. مانیفست‌های ناموجود یا نامعتبر به‌عنوان
خطاهای Plugin در نظر گرفته می‌شوند و اعتبارسنجی پیکربندی را مسدود می‌کنند.

راهنمای کامل سیستم Plugin را ببینید: [Pluginها](/fa/tools/plugin).
برای مدل قابلیت بومی و راهنمایی فعلی سازگاری خارجی:
[مدل قابلیت](/fa/plugins/architecture#public-capability-model).

## این فایل چه می‌کند

`openclaw.plugin.json` فراداده‌ای است که OpenClaw **پیش از بارگذاری کد
Plugin شما** می‌خواند. هر چیزی در ادامه باید آن‌قدر سبک باشد که بتوان آن را بدون راه‌اندازی
زمان اجرای Plugin بررسی کرد.

**از آن برای این موارد استفاده کنید:**

- هویت Plugin، اعتبارسنجی پیکربندی، و راهنمایی‌های UI پیکربندی
- فرادادهٔ احراز هویت، ورود اولیه، و راه‌اندازی (نام مستعار، فعال‌سازی خودکار، متغیرهای محیطی provider، گزینه‌های احراز هویت)
- راهنمایی‌های فعال‌سازی برای سطوح control-plane
- مالکیت کوتاه‌نویس خانوادهٔ مدل
- snapshotهای ایستای مالکیت قابلیت (`contracts`)
- فرادادهٔ اجراکنندهٔ QA که میزبان مشترک `openclaw qa` می‌تواند بررسی کند
- فرادادهٔ پیکربندی ویژهٔ کانال که در سطوح کاتالوگ و اعتبارسنجی ادغام می‌شود

**از آن برای این موارد استفاده نکنید:** ثبت رفتار زمان اجرا، اعلام نقطه‌های ورود کد،
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

| فیلد                                | الزامی | نوع                             | معنای آن                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | بله      | `string`                         | شناسه متعارف Plugin. این همان شناسه‌ای است که در `plugins.entries.<id>` استفاده می‌شود.                                                                                                                                                                 |
| `configSchema`                       | بله      | `object`                         | JSON Schema درون‌خطی برای پیکربندی این Plugin.                                                                                                                                                                                        |
| `enabledByDefault`                   | خیر       | `true`                           | یک Plugin بسته‌بندی‌شده را به‌صورت پیش‌فرض فعال علامت‌گذاری می‌کند. آن را حذف کنید، یا هر مقدار غیر از `true` تنظیم کنید، تا Plugin به‌صورت پیش‌فرض غیرفعال بماند.                                                                                                        |
| `enabledByDefaultOnPlatforms`        | خیر       | `string[]`                       | یک Plugin بسته‌بندی‌شده را فقط روی پلتفرم‌های Node.js فهرست‌شده، برای مثال `["darwin"]`، به‌صورت پیش‌فرض فعال علامت‌گذاری می‌کند. پیکربندی صریح همچنان مقدم است.                                                                                            |
| `legacyPluginIds`                    | خیر       | `string[]`                       | شناسه‌های قدیمی که به این شناسه متعارف Plugin نرمال‌سازی می‌شوند.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده‌ای که وقتی احراز هویت، پیکربندی، یا ارجاع‌های مدل از آن‌ها نام می‌برند، باید این Plugin را خودکار فعال کنند.                                                                                                                                     |
| `kind`                               | خیر       | `"memory"` \| `"context-engine"` | یک گونه انحصاری Plugin را که توسط `plugins.slots.*` استفاده می‌شود اعلام می‌کند.                                                                                                                                                                        |
| `channels`                           | خیر       | `string[]`                       | شناسه‌های کانالی که مالکیتشان با این Plugin است. برای کشف و اعتبارسنجی پیکربندی استفاده می‌شود.                                                                                                                                                         |
| `providers`                          | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده‌ای که مالکیتشان با این Plugin است.                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | خیر       | `string`                         | مسیر ماژول سبک کشف ارائه‌دهنده، نسبت به ریشه Plugin، برای فراداده کاتالوگ ارائه‌دهنده در محدوده مانیفست که می‌تواند بدون فعال‌سازی زمان اجرای کامل Plugin بارگذاری شود.                                               |
| `modelSupport`                       | خیر       | `object`                         | فراداده کوتاه‌شده خانواده مدل که مالکیتش با مانیفست است و برای بارگذاری خودکار Plugin پیش از زمان اجرا استفاده می‌شود.                                                                                                                                         |
| `modelCatalog`                       | خیر       | `object`                         | فراداده اعلامی کاتالوگ مدل برای ارائه‌دهنده‌هایی که مالکیتشان با این Plugin است. این قرارداد سطح کنترل برای فهرست‌سازی فقط‌خواندنی آینده، راه‌اندازی اولیه، انتخابگرهای مدل، نام‌های مستعار، و سرکوب بدون بارگذاری زمان اجرای Plugin است.         |
| `modelPricing`                       | خیر       | `object`                         | سیاست جست‌وجوی قیمت‌گذاری خارجی که مالکیتش با ارائه‌دهنده است. از آن برای خارج کردن ارائه‌دهنده‌های محلی/خودمیزبان از کاتالوگ‌های قیمت‌گذاری راه‌دور یا نگاشت ارجاع‌های ارائه‌دهنده به شناسه‌های کاتالوگ OpenRouter/LiteLLM بدون کدنویسی سخت شناسه‌های ارائه‌دهنده در هسته استفاده کنید.             |
| `modelIdNormalization`               | خیر       | `object`                         | پاک‌سازی نام مستعار/پیشوند شناسه مدل که مالکیتش با ارائه‌دهنده است و باید پیش از بارگذاری زمان اجرای ارائه‌دهنده اجرا شود.                                                                                                                                           |
| `providerEndpoints`                  | خیر       | `object[]`                       | فراداده میزبان/baseUrl نقطه پایانی که مالکیتش با مانیفست است، برای مسیرهای ارائه‌دهنده که هسته باید پیش از بارگذاری زمان اجرای ارائه‌دهنده آن‌ها را طبقه‌بندی کند.                                                                                                            |
| `providerRequest`                    | خیر       | `object`                         | فراداده کم‌هزینه خانواده ارائه‌دهنده و سازگاری درخواست که پیش از بارگذاری زمان اجرای ارائه‌دهنده توسط سیاست درخواست عمومی استفاده می‌شود.                                                                                                              |
| `cliBackends`                        | خیر       | `string[]`                       | شناسه‌های پشتانه استنتاج CLI که مالکیتشان با این Plugin است. برای فعال‌سازی خودکار هنگام شروع از ارجاع‌های پیکربندی صریح استفاده می‌شود.                                                                                                                         |
| `syntheticAuthRefs`                  | خیر       | `string[]`                       | ارجاع‌های ارائه‌دهنده یا پشتانه CLI که hook احراز هویت مصنوعیِ متعلق به Plugin آن‌ها باید هنگام کشف سرد مدل، پیش از بارگذاری زمان اجرا، کاوش شود.                                                                                              |
| `nonSecretAuthMarkers`               | خیر       | `string[]`                       | مقادیر کلید API نگهدارنده جا که مالکیتشان با Plugin بسته‌بندی‌شده است و وضعیت اعتبارنامه محلی، OAuth، یا محیطیِ غیرمحرمانه را نشان می‌دهند.                                                                                                                |
| `commandAliases`                     | خیر       | `object[]`                       | نام‌های فرمانی که مالکیتشان با این Plugin است و باید پیش از بارگذاری زمان اجرا، تشخیص‌های پیکربندی و CLI آگاه از Plugin تولید کنند.                                                                                                                |
| `providerAuthEnvVars`                | خیر       | `Record<string, string[]>`       | فراداده سازگاری منسوخ برای محیط احراز هویت/وضعیت ارائه‌دهنده. برای Pluginهای جدید `setup.providers[].envVars` را ترجیح دهید؛ OpenClaw همچنان این را در بازه منسوخ‌سازی می‌خواند.                                                 |
| `providerAuthAliases`                | خیر       | `Record<string, string>`         | شناسه‌های ارائه‌دهنده‌ای که باید برای جست‌وجوی احراز هویت از شناسه ارائه‌دهنده دیگری دوباره استفاده کنند، برای مثال یک ارائه‌دهنده کدنویسی که کلید API ارائه‌دهنده پایه و پروفایل‌های احراز هویت را به اشتراک می‌گذارد.                                                                          |
| `channelEnvVars`                     | خیر       | `Record<string, string[]>`       | فراداده کم‌هزینه محیط کانال که OpenClaw می‌تواند بدون بارگذاری کد Plugin بررسی کند. از این برای راه‌اندازی کانال مبتنی بر محیط یا سطوح احراز هویتی استفاده کنید که کمک‌کننده‌های عمومی شروع/پیکربندی باید ببینند.                                            |
| `providerAuthChoices`                | خیر       | `object[]`                       | فراداده کم‌هزینه انتخاب احراز هویت برای انتخابگرهای راه‌اندازی اولیه، حل ارائه‌دهنده ترجیحی، و سیم‌کشی ساده پرچم CLI.                                                                                                                       |
| `activation`                         | خیر       | `object`                         | فراداده کم‌هزینه برنامه‌ریز فعال‌سازی برای بارگذاری هنگام شروع، ارائه‌دهنده، فرمان، کانال، مسیر، و بارگذاری برانگیخته از قابلیت. فقط فراداده؛ رفتار واقعی همچنان در مالکیت زمان اجرای Plugin است.                                                       |
| `setup`                              | خیر       | `object`                         | توصیفگرهای کم‌هزینه راه‌اندازی/راه‌اندازی اولیه که سطوح کشف و راه‌اندازی می‌توانند بدون بارگذاری زمان اجرای Plugin بررسی کنند.                                                                                                                    |
| `qaRunners`                          | خیر       | `object[]`                       | توصیفگرهای کم‌هزینه اجراکننده QA که پیش از بارگذاری زمان اجرای Plugin توسط میزبان مشترک `openclaw qa` استفاده می‌شوند.                                                                                                                                      |
| `contracts`                          | خیر       | `object`                         | نمای ثابت مالکیت قابلیت برای hookهای احراز هویت خارجی، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، فهم رسانه، تولید تصویر، تولید موسیقی، تولید ویدیو، واکشی وب، جست‌وجوی وب، و مالکیت ابزار. |
| `mediaUnderstandingProviderMetadata` | خیر       | `Record<string, object>`         | پیش‌فرض‌های کم‌هزینه فهم رسانه برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.mediaUnderstandingProviders`.                                                                                                                            |
| `imageGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فراداده کم‌هزینه احراز هویت تولید تصویر برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.imageGenerationProviders`، شامل نام‌های مستعار احراز هویت و محافظ‌های نشانی پایه که مالکیتشان با ارائه‌دهنده است.                                                                  |
| `videoGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فراداده کم‌هزینه احراز هویت تولید ویدیو برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.videoGenerationProviders`، شامل نام‌های مستعار احراز هویت و محافظ‌های نشانی پایه که مالکیتشان با ارائه‌دهنده است.                                                                  |
| `musicGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فراداده کم‌هزینه احراز هویت تولید موسیقی برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.musicGenerationProviders`، شامل نام‌های مستعار احراز هویت و محافظ‌های نشانی پایه که مالکیتشان با ارائه‌دهنده است.                                                                  |
| `toolMetadata`                       | خیر       | `Record<string, object>`         | فراداده کم‌هزینه دسترس‌پذیری برای ابزارهای متعلق به Plugin که در `contracts.tools` اعلام شده‌اند. وقتی یک ابزار نباید زمان اجرا را بارگذاری کند مگر اینکه شواهد پیکربندی، محیط، یا احراز هویت وجود داشته باشد، از آن استفاده کنید.                                                           |
| `channelConfigs`                     | خیر       | `Record<string, object>`         | فراداده پیکربندی کانال که مالکیتش با مانیفست است و پیش از بارگذاری زمان اجرا در سطوح کشف و اعتبارسنجی ادغام می‌شود.                                                                                                                          |
| `skills`                             | خیر       | `string[]`                       | پوشه‌های Skill برای بارگذاری، نسبت به ریشه Plugin.                                                                                                                                                                             |
| `name`                               | خیر       | `string`                         | نام Plugin قابل‌خواندن برای انسان.                                                                                                                                                                                                         |
| `description`                        | خیر       | `string`                         | خلاصهٔ کوتاهی که در سطوح Plugin نمایش داده می‌شود.                                                                                                                                                                                             |
| `version`                            | خیر       | `string`                         | نسخهٔ اطلاع‌رسانی Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | خیر       | `Record<string, object>`         | برچسب‌های UI، جای‌نگهدارها، و راهنمای حساسیت برای فیلدهای پیکربندی.                                                                                                                                                                   |

## مرجع فراداده ارائه‌دهنده تولید

فیلدهای فراداده ارائه‌دهنده تولید، سیگنال‌های ثابت احراز هویت را برای
ارائه‌دهندگانی توصیف می‌کنند که در فهرست متناظر `contracts.*GenerationProviders` اعلام شده‌اند.
OpenClaw این فیلدها را پیش از بارگذاری runtime ارائه‌دهنده می‌خواند تا ابزارهای هسته بتوانند
بدون import کردن هر Plugin ارائه‌دهنده، تصمیم بگیرند آیا یک ارائه‌دهنده تولید در دسترس است یا نه.

از این فیلدها فقط برای واقعیت‌های ارزان و اعلامی استفاده کنید. انتقال، تبدیل‌های درخواست،
نوسازی token، اعتبارسنجی credential، و رفتار واقعی تولید
در runtime Plugin باقی می‌مانند.

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

| فیلد            | الزامی | نوع        | معنی آن                                                                                                                            |
| --------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | خیر    | `string[]` | شناسه‌های اضافی ارائه‌دهنده که باید برای ارائه‌دهنده تولید، aliasهای ثابت احراز هویت محسوب شوند.                                   |
| `authProviders` | خیر    | `string[]` | شناسه‌های ارائه‌دهنده که profileهای احراز هویت پیکربندی‌شده آن‌ها باید برای این ارائه‌دهنده تولید، احراز هویت محسوب شوند.         |
| `configSignals` | خیر    | `object[]` | سیگنال‌های دسترسی ارزان و فقط مبتنی بر پیکربندی برای ارائه‌دهندگان local یا self-hosted که می‌توانند بدون profileهای احراز هویت یا متغیرهای محیطی پیکربندی شوند. |
| `authSignals`   | خیر    | `object[]` | سیگنال‌های صریح احراز هویت. وقتی وجود داشته باشند، مجموعه سیگنال پیش‌فرض حاصل از شناسه ارائه‌دهنده، `aliases`، و `authProviders` را جایگزین می‌کنند. |

هر ورودی `configSignals` از این موارد پشتیبانی می‌کند:

| فیلد          | الزامی | نوع        | معنی آن                                                                                                                                                                            |
| ------------- | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | بله    | `string`   | مسیر نقطه‌ای به شیء پیکربندی متعلق به Plugin برای بررسی، برای مثال `plugins.entries.example.config`.                                                                              |
| `overlayPath` | خیر    | `string`   | مسیر نقطه‌ای داخل پیکربندی ریشه که شیء آن باید پیش از ارزیابی سیگنال روی شیء ریشه overlay شود. از این برای پیکربندی مخصوص قابلیت مانند `image`، `video`، یا `music` استفاده کنید. |
| `required`    | خیر    | `string[]` | مسیرهای نقطه‌ای داخل پیکربندی مؤثر که باید مقدارهای پیکربندی‌شده داشته باشند. رشته‌ها باید غیرخالی باشند؛ شیءها و آرایه‌ها نباید خالی باشند.                                   |
| `requiredAny` | خیر    | `string[]` | مسیرهای نقطه‌ای داخل پیکربندی مؤثر که دست‌کم یکی از آن‌ها باید مقدار پیکربندی‌شده داشته باشد.                                                                                      |
| `mode`        | خیر    | `object`   | guard اختیاری mode رشته‌ای داخل پیکربندی مؤثر. زمانی از این استفاده کنید که دسترسی فقط مبتنی بر پیکربندی فقط برای یک mode اعمال می‌شود.                                         |

هر guard مربوط به `mode` از این موارد پشتیبانی می‌کند:

| فیلد         | الزامی | نوع        | معنی آن                                                                            |
| ------------ | ------ | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | خیر    | `string`   | مسیر نقطه‌ای داخل پیکربندی مؤثر. مقدار پیش‌فرض `mode` است.                         |
| `default`    | خیر    | `string`   | مقدار mode برای استفاده وقتی پیکربندی این مسیر را حذف کرده است.                    |
| `allowed`    | خیر    | `string[]` | اگر وجود داشته باشد، سیگنال فقط وقتی عبور می‌کند که mode مؤثر یکی از این مقدارها باشد. |
| `disallowed` | خیر    | `string[]` | اگر وجود داشته باشد، سیگنال وقتی شکست می‌خورد که mode مؤثر یکی از این مقدارها باشد.   |

هر ورودی `authSignals` از این موارد پشتیبانی می‌کند:

| فیلد              | الزامی | نوع      | معنی آن                                                                                                                                                                  |
| ----------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | بله    | `string` | شناسه ارائه‌دهنده برای بررسی در profileهای احراز هویت پیکربندی‌شده.                                                                                                     |
| `providerBaseUrl` | خیر    | `object` | guard اختیاری که باعث می‌شود سیگنال فقط وقتی محاسبه شود که ارائه‌دهنده پیکربندی‌شده ارجاع‌شده از یک URL پایه مجاز استفاده کند. زمانی از این استفاده کنید که یک alias احراز هویت فقط برای APIهای خاص معتبر است. |

هر guard مربوط به `providerBaseUrl` از این موارد پشتیبانی می‌کند:

| فیلد              | الزامی | نوع        | معنی آن                                                                                                                                         |
| ----------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | بله    | `string`   | شناسه پیکربندی ارائه‌دهنده که `baseUrl` آن باید بررسی شود.                                                                                     |
| `defaultBaseUrl`  | خیر    | `string`   | URL پایه‌ای که وقتی پیکربندی ارائه‌دهنده `baseUrl` را حذف کرده است باید فرض شود.                                                               |
| `allowedBaseUrls` | بله    | `string[]` | URLهای پایه مجاز برای این سیگنال احراز هویت. وقتی URL پایه پیکربندی‌شده یا پیش‌فرض با یکی از این مقدارهای نرمال‌شده مطابقت نداشته باشد، سیگنال نادیده گرفته می‌شود. |

## مرجع فراداده ابزار

`toolMetadata` از همان شکل‌های `configSignals` و `authSignals` فراداده
ارائه‌دهنده تولید استفاده می‌کند، با کلیدگذاری بر اساس نام ابزار. `contracts.tools` مالکیت را اعلام می‌کند.
`toolMetadata` شواهد ارزان دسترسی را اعلام می‌کند تا OpenClaw بتواند
از import کردن runtime یک Plugin فقط برای اینکه factory ابزار آن `null` برگرداند پرهیز کند.

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

اگر یک ابزار `toolMetadata` نداشته باشد، OpenClaw رفتار موجود را حفظ می‌کند و
وقتی قرارداد ابزار با policy مطابقت داشته باشد، Plugin مالک را بارگذاری می‌کند. برای ابزارهای hot-path
که factory آن‌ها به احراز هویت/پیکربندی وابسته است، نویسندگان Plugin باید به‌جای وادار کردن هسته به import کردن runtime برای پرس‌وجو،
`toolMetadata` را اعلام کنند.

## مرجع providerAuthChoices

هر ورودی `providerAuthChoices` یک انتخاب onboarding یا احراز هویت را توصیف می‌کند.
OpenClaw این را پیش از بارگذاری runtime ارائه‌دهنده می‌خواند.
فهرست‌های راه‌اندازی ارائه‌دهنده از این انتخاب‌های manifest، انتخاب‌های راه‌اندازی مشتق‌شده از descriptor،
و فراداده کاتالوگ نصب بدون بارگذاری runtime ارائه‌دهنده استفاده می‌کنند.

| فیلد                  | الزامی | نوع                                             | معنی آن                                                                                                  |
| --------------------- | ------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | بله    | `string`                                        | شناسه ارائه‌دهنده‌ای که این انتخاب به آن تعلق دارد.                                                     |
| `method`              | بله    | `string`                                        | شناسه روش احراز هویت برای dispatch کردن به آن.                                                           |
| `choiceId`            | بله    | `string`                                        | شناسه پایدار انتخاب احراز هویت که توسط جریان‌های onboarding و CLI استفاده می‌شود.                        |
| `choiceLabel`         | خیر    | `string`                                        | برچسب رو به کاربر. اگر حذف شود، OpenClaw به `choiceId` fallback می‌کند.                                  |
| `choiceHint`          | خیر    | `string`                                        | متن راهنمای کوتاه برای picker.                                                                          |
| `assistantPriority`   | خیر    | `number`                                        | مقدارهای کمتر در pickerهای تعاملی هدایت‌شده توسط assistant زودتر مرتب می‌شوند.                           |
| `assistantVisibility` | خیر    | `"visible"` \| `"manual-only"`                  | انتخاب را از pickerهای assistant پنهان می‌کند، در حالی که انتخاب دستی CLI همچنان مجاز است.              |
| `deprecatedChoiceIds` | خیر    | `string[]`                                      | شناسه‌های انتخاب legacy که باید کاربران را به این انتخاب جایگزین هدایت کنند.                             |
| `groupId`             | خیر    | `string`                                        | شناسه گروه اختیاری برای گروه‌بندی انتخاب‌های مرتبط.                                                     |
| `groupLabel`          | خیر    | `string`                                        | برچسب رو به کاربر برای آن گروه.                                                                         |
| `groupHint`           | خیر    | `string`                                        | متن راهنمای کوتاه برای گروه.                                                                            |
| `optionKey`           | خیر    | `string`                                        | کلید گزینه داخلی برای جریان‌های احراز هویت ساده با یک flag.                                             |
| `cliFlag`             | خیر    | `string`                                        | نام flag در CLI، مانند `--openrouter-api-key`.                                                          |
| `cliOption`           | خیر    | `string`                                        | شکل کامل گزینه CLI، مانند `--openrouter-api-key <key>`.                                                 |
| `cliDescription`      | خیر    | `string`                                        | توضیحی که در راهنمای CLI استفاده می‌شود.                                                                |
| `onboardingScopes`    | خیر    | `Array<"text-inference" \| "image-generation">` | این انتخاب باید در کدام سطح‌های onboarding ظاهر شود. اگر حذف شود، مقدار پیش‌فرض آن `["text-inference"]` است. |

## مرجع commandAliases

از `commandAliases` زمانی استفاده کنید که یک Plugin مالک نام فرمان زمان اجرا باشد که کاربران ممکن است آن را به‌اشتباه در `plugins.allow` بگذارند یا تلاش کنند آن را به‌عنوان فرمان ریشهٔ CLI اجرا کنند. OpenClaw از این فراداده برای تشخیص‌ها استفاده می‌کند، بدون اینکه کد زمان اجرای Plugin را import کند.

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
| `name`       | بله      | `string`          | نام فرمانی که متعلق به این Plugin است.                               |
| `kind`       | خیر       | `"runtime-slash"` | نام مستعار را به‌جای فرمان ریشهٔ CLI، به‌عنوان فرمان slash چت علامت‌گذاری می‌کند. |
| `cliCommand` | خیر       | `string`          | فرمان ریشهٔ CLI مرتبط که در صورت وجود، برای عملیات CLI پیشنهاد می‌شود.  |

## مرجع activation

از `activation` زمانی استفاده کنید که Plugin بتواند با هزینهٔ کم اعلام کند کدام رویدادهای صفحهٔ کنترل باید آن را در طرح activation/load بگنجانند.

این بلوک فرادادهٔ برنامه‌ریز است، نه API چرخهٔ عمر. رفتار زمان اجرا را ثبت نمی‌کند، جایگزین `register(...)` نمی‌شود، و تضمین نمی‌کند که کد Plugin قبلاً اجرا شده باشد. برنامه‌ریز activation از این فیلدها استفاده می‌کند تا پیش از بازگشت به فرادادهٔ مالکیت موجود در manifest مانند `providers`، `channels`، `commandAliases`، `setup.providers`، `contracts.tools` و hooks، Pluginهای نامزد را محدود کند.

محدودترین فراداده‌ای را ترجیح دهید که از قبل مالکیت را توصیف می‌کند. وقتی این فیلدها رابطه را بیان می‌کنند، از `providers`، `channels`، `commandAliases`، توصیفگرهای setup یا `contracts` استفاده کنید. از `activation` برای راهنمایی‌های اضافی برنامه‌ریز استفاده کنید که با آن فیلدهای مالکیت قابل نمایش نیستند.
برای نام‌های مستعار زمان اجرای CLI مانند `claude-cli`، `codex-cli` یا `google-gemini-cli` از `cliBackends` سطح بالا استفاده کنید؛ `activation.onAgentHarnesses` فقط برای شناسه‌های agent harness توکار است که از قبل فیلد مالکیت ندارند.

این بلوک فقط فراداده است. رفتار زمان اجرا را ثبت نمی‌کند و جایگزین `register(...)`، `setupEntry` یا سایر entrypointهای زمان اجرا/Plugin نمی‌شود. مصرف‌کنندگان فعلی پیش از بارگذاری گسترده‌تر Plugin از آن به‌عنوان راهنمای محدودکننده استفاده می‌کنند، بنابراین نبود فرادادهٔ activation غیرراه‌اندازی معمولاً فقط هزینهٔ کارایی دارد؛ تا زمانی که fallbackهای مالکیت manifest هنوز وجود دارند، نباید درستی را تغییر دهد.

هر Plugin باید `activation.onStartup` را آگاهانه تنظیم کند. آن را فقط زمانی روی `true` بگذارید که Plugin باید هنگام راه‌اندازی Gateway اجرا شود. وقتی Plugin هنگام راه‌اندازی غیرفعال است و فقط باید از triggerهای محدودتر بارگذاری شود، آن را روی `false` بگذارید. حذف `onStartup` دیگر باعث بارگذاری ضمنی Plugin هنگام راه‌اندازی نمی‌شود؛ برای راه‌اندازی، channel، config، agent-harness، memory یا سایر triggerهای activation محدودتر از فرادادهٔ activation صریح استفاده کنید.

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
| `onStartup`        | خیر       | `boolean`                                            | activation صریح راه‌اندازی Gateway. هر Plugin باید این را تنظیم کند. `true` هنگام راه‌اندازی Plugin را import می‌کند؛ `false` آن را برای راه‌اندازی lazy نگه می‌دارد، مگر اینکه trigger منطبق دیگری به بارگذاری نیاز داشته باشد. |
| `onProviders`      | خیر       | `string[]`                                           | شناسه‌های Provider که باید این Plugin را در طرح‌های activation/load بگنجانند.                                                                                                                      |
| `onAgentHarnesses` | خیر       | `string[]`                                           | شناسه‌های زمان اجرای agent harness توکار که باید این Plugin را در طرح‌های activation/load بگنجانند. برای نام‌های مستعار backend CLI از `cliBackends` سطح بالا استفاده کنید.                                           |
| `onCommands`       | خیر       | `string[]`                                           | شناسه‌های Command که باید این Plugin را در طرح‌های activation/load بگنجانند.                                                                                                                       |
| `onChannels`       | خیر       | `string[]`                                           | شناسه‌های Channel که باید این Plugin را در طرح‌های activation/load بگنجانند.                                                                                                                       |
| `onRoutes`         | خیر       | `string[]`                                           | گونه‌های Route که باید این Plugin را در طرح‌های activation/load بگنجانند.                                                                                                                       |
| `onConfigPaths`    | خیر       | `string[]`                                           | مسیرهای config نسبی به ریشه که وقتی مسیر موجود است و به‌صراحت غیرفعال نشده، باید این Plugin را در طرح‌های startup/load بگنجانند.                                                      |
| `onCapabilities`   | خیر       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | راهنمایی‌های گستردهٔ capability که برنامه‌ریزی activation صفحهٔ کنترل از آن‌ها استفاده می‌کند. در صورت امکان فیلدهای محدودتر را ترجیح دهید.                                                                                     |

مصرف‌کنندگان زندهٔ فعلی:

- برنامه‌ریزی راه‌اندازی Gateway از `activation.onStartup` برای import صریح startup استفاده می‌کند
- برنامه‌ریزی CLI که با command تحریک می‌شود، به `commandAliases[].cliCommand` یا `commandAliases[].name` قدیمی fallback می‌کند
- برنامه‌ریزی راه‌اندازی agent-runtime از `activation.onAgentHarnesses` برای harnessهای توکار و از `cliBackends[]` سطح بالا برای نام‌های مستعار زمان اجرای CLI استفاده می‌کند
- برنامه‌ریزی setup/channel که با channel تحریک می‌شود، وقتی فرادادهٔ activation صریح channel وجود ندارد، به مالکیت قدیمی `channels[]` fallback می‌کند
- برنامه‌ریزی Plugin هنگام startup از `activation.onConfigPaths` برای سطح‌های config ریشهٔ غیر-channel مانند بلوک `browser` در Plugin مرورگر bundled استفاده می‌کند
- برنامه‌ریزی setup/runtime که با provider تحریک می‌شود، وقتی فرادادهٔ activation صریح provider وجود ندارد، به مالکیت قدیمی `providers[]` و `cliBackends[]` سطح بالا fallback می‌کند

تشخیص‌های برنامه‌ریز می‌توانند راهنمایی‌های activation صریح را از fallback مالکیت manifest تشخیص دهند. برای مثال، `activation-command-hint` یعنی `activation.onCommands` منطبق شده، در حالی که `manifest-command-alias` یعنی برنامه‌ریز به‌جای آن از مالکیت `commandAliases` استفاده کرده است. این برچسب‌های دلیل برای تشخیص‌های host و آزمون‌ها هستند؛ نویسندگان Plugin باید همچنان فراداده‌ای را اعلام کنند که مالکیت را به بهترین شکل توصیف می‌کند.

## مرجع qaRunners

از `qaRunners` زمانی استفاده کنید که یک Plugin یک یا چند runner انتقال را زیر ریشهٔ مشترک `openclaw qa` اضافه می‌کند. این فراداده را کم‌هزینه و ایستا نگه دارید؛ زمان اجرای Plugin همچنان مالک ثبت واقعی CLI از طریق سطح سبک `runtime-api.ts` است که `qaRunnerCliRegistrations` را export می‌کند.

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
| `commandName` | بله      | `string` | زیرcommand نصب‌شده زیر `openclaw qa`، برای مثال `matrix`.    |
| `description` | خیر       | `string` | متن راهنمای fallback که وقتی host مشترک به command stub نیاز دارد استفاده می‌شود. |

## مرجع setup

از `setup` زمانی استفاده کنید که سطح‌های setup و onboarding پیش از بارگذاری زمان اجرا به فرادادهٔ ارزانِ متعلق به Plugin نیاز دارند.

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

`cliBackends` سطح بالا معتبر می‌ماند و همچنان backendهای استنتاج CLI را توصیف می‌کند. `setup.cliBackends` سطح توصیفگر ویژهٔ setup برای جریان‌های صفحهٔ کنترل/setup است که باید فقط فراداده بمانند.

وقتی وجود داشته باشند، `setup.providers` و `setup.cliBackends` سطح lookup توصیفگر-اول ترجیحی برای کشف setup هستند. اگر توصیفگر فقط Plugin نامزد را محدود می‌کند و setup همچنان به hookهای زمان اجرای غنی‌تر در زمان setup نیاز دارد، `requiresRuntime: true` را تنظیم کنید و `setup-api` را به‌عنوان مسیر اجرای fallback نگه دارید.

OpenClaw همچنین `setup.providers[].envVars` را در lookupهای عمومی auth provider و env-var شامل می‌کند. `providerAuthEnvVars` در طول پنجرهٔ deprecation همچنان از طریق adapter سازگاری پشتیبانی می‌شود، اما Pluginهای غیرbundled که هنوز از آن استفاده می‌کنند یک تشخیص manifest دریافت می‌کنند. Pluginهای جدید باید فرادادهٔ env مربوط به setup/status را روی `setup.providers[].envVars` بگذارند.

OpenClaw همچنین وقتی entry مربوط به setup وجود ندارد، یا وقتی `setup.requiresRuntime: false` اعلام می‌کند زمان اجرای setup لازم نیست، می‌تواند انتخاب‌های سادهٔ setup را از `setup.providers[].authMethods` استخراج کند. entryهای صریح `providerAuthChoices` برای برچسب‌های سفارشی، flagهای CLI، دامنهٔ onboarding و فرادادهٔ assistant همچنان ترجیح داده می‌شوند.

`requiresRuntime: false` را فقط زمانی تنظیم کنید که آن توصیفگرها برای سطح setup کافی باشند. OpenClaw مقدار صریح `false` را به‌عنوان قرارداد فقط-توصیفگر در نظر می‌گیرد و برای lookup setup، `setup-api` یا `openclaw.setupEntry` را اجرا نخواهد کرد. اگر یک Plugin فقط-توصیفگر همچنان یکی از آن entryهای زمان اجرای setup را ارسال کند، OpenClaw یک تشخیص افزایشی گزارش می‌کند و همچنان آن را نادیده می‌گیرد. حذف `requiresRuntime` رفتار fallback قدیمی را حفظ می‌کند تا Pluginهای موجود که توصیفگرها را بدون این flag اضافه کرده‌اند خراب نشوند.

چون lookup setup می‌تواند کد `setup-api` متعلق به Plugin را اجرا کند، مقدارهای نرمال‌شدهٔ `setup.providers[].id` و `setup.cliBackends[]` باید در میان Pluginهای کشف‌شده یکتا بمانند. مالکیت مبهم به‌جای انتخاب یک برنده بر اساس ترتیب کشف، بسته شکست می‌خورد.

وقتی زمان اجرای setup اجرا می‌شود، اگر `setup-api` یک provider یا backend CLI ثبت کند که توصیفگرهای manifest اعلام نکرده‌اند، یا اگر یک توصیفگر ثبت زمان اجرای منطبق نداشته باشد، تشخیص‌های registry setup انحراف توصیفگر را گزارش می‌کنند. این تشخیص‌ها افزایشی هستند و Pluginهای قدیمی را رد نمی‌کنند.

### مرجع setup.providers

| فیلد          | الزامی | نوع       | معنی آن                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | بله      | `string`   | شناسهٔ Provider که هنگام setup یا onboarding در دسترس قرار می‌گیرد. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید.             |
| `authMethods`  | خیر       | `string[]` | شناسه‌های روش setup/auth که این provider بدون بارگذاری کامل زمان اجرا پشتیبانی می‌کند.                       |
| `envVars`      | خیر       | `string[]` | env varهایی که سطح‌های عمومی setup/status می‌توانند پیش از بارگذاری زمان اجرای Plugin بررسی کنند.               |
| `authEvidence` | خیر       | `object[]` | بررسی‌های ارزان evidence مربوط به auth محلی برای providerهایی که می‌توانند از طریق markerهای غیرمحرمانه احراز هویت کنند. |

`authEvidence` برای نشانگرهای محلی اعتبارنامه است که مالکیت آن‌ها با ارائه‌دهنده است و می‌توان آن‌ها را
بدون بارگذاری کد زمان اجرا راستی‌آزمایی کرد. این بررسی‌ها باید کم‌هزینه و محلی بمانند:
بدون فراخوانی شبکه، بدون خواندن keychain یا secret-manager، بدون فرمان‌های shell، و بدون
probe کردن API ارائه‌دهنده.

ورودی‌های evidence پشتیبانی‌شده:

| فیلد               | الزامی | نوع        | معنای آن                                                                                                      |
| ------------------ | ------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | بله    | `string`   | در حال حاضر `local-file-with-env`.                                                                            |
| `fileEnvVar`       | خیر    | `string`   | متغیر محیطی شامل مسیر صریح فایل اعتبارنامه.                                                                  |
| `fallbackPaths`    | خیر    | `string[]` | مسیرهای فایل اعتبارنامه محلی که وقتی `fileEnvVar` وجود ندارد یا خالی است بررسی می‌شوند. از `${HOME}` و `${APPDATA}` پشتیبانی می‌کند. |
| `requiresAnyEnv`   | خیر    | `string[]` | دست‌کم یکی از متغیرهای محیطی فهرست‌شده باید پیش از معتبر شدن evidence غیرخالی باشد.                         |
| `requiresAllEnv`   | خیر    | `string[]` | همه متغیرهای محیطی فهرست‌شده باید پیش از معتبر شدن evidence غیرخالی باشند.                                  |
| `credentialMarker` | بله    | `string`   | نشانگر غیرمحرمانه‌ای که هنگام وجود evidence برگردانده می‌شود.                                                |
| `source`           | خیر    | `string`   | برچسب منبع قابل‌نمایش به کاربر برای خروجی auth/status.                                                       |

### فیلدهای setup

| فیلد               | الزامی | نوع        | معنای آن                                                                                         |
| ------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | خیر    | `object[]` | توصیف‌گرهای setup ارائه‌دهنده که هنگام setup و onboarding ارائه می‌شوند.                         |
| `cliBackends`      | خیر    | `string[]` | شناسه‌های backend زمان setup که برای جست‌وجوی setup مبتنی بر توصیف‌گر استفاده می‌شوند. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید. |
| `configMigrations` | خیر    | `string[]` | شناسه‌های migration پیکربندی که مالکیت آن‌ها با سطح setup این Plugin است.                         |
| `requiresRuntime`  | خیر    | `boolean`  | اینکه آیا setup پس از جست‌وجوی توصیف‌گر هنوز به اجرای `setup-api` نیاز دارد یا نه.               |

## مرجع uiHints

`uiHints` نگاشتی از نام فیلدهای پیکربندی به نکته‌های کوچک رندر است.

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

| فیلد          | نوع        | معنای آن                                   |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | برچسب فیلد قابل‌نمایش به کاربر.            |
| `help`        | `string`   | متن کمکی کوتاه.                            |
| `tags`        | `string[]` | برچسب‌های UI اختیاری.                      |
| `advanced`    | `boolean`  | فیلد را به‌عنوان پیشرفته علامت‌گذاری می‌کند. |
| `sensitive`   | `boolean`  | فیلد را به‌عنوان محرمانه یا حساس علامت‌گذاری می‌کند. |
| `placeholder` | `string`   | متن placeholder برای ورودی‌های فرم.        |

## مرجع contracts

از `contracts` فقط برای فراداده مالکیت قابلیت ایستا استفاده کنید که OpenClaw بتواند
بدون import کردن زمان اجرای Plugin بخواند.

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

| فیلد                             | نوع        | معنای آن                                                               |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | شناسه‌های factory اکستنشن app-server مربوط به Codex، در حال حاضر `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | شناسه‌های زمان اجرا که یک Plugin همراه می‌تواند برای آن‌ها middleware نتیجه ابزار ثبت کند. |
| `externalAuthProviders`          | `string[]` | شناسه‌های ارائه‌دهنده‌ای که مالکیت hook پروفایل auth خارجی آن‌ها با این Plugin است. |
| `speechProviders`                | `string[]` | شناسه‌های ارائه‌دهنده گفتاری که مالکیت آن‌ها با این Plugin است.        |
| `realtimeTranscriptionProviders` | `string[]` | شناسه‌های ارائه‌دهنده realtime-transcription که مالکیت آن‌ها با این Plugin است. |
| `realtimeVoiceProviders`         | `string[]` | شناسه‌های ارائه‌دهنده realtime-voice که مالکیت آن‌ها با این Plugin است. |
| `memoryEmbeddingProviders`       | `string[]` | شناسه‌های ارائه‌دهنده memory embedding که مالکیت آن‌ها با این Plugin است. |
| `mediaUnderstandingProviders`    | `string[]` | شناسه‌های ارائه‌دهنده media-understanding که مالکیت آن‌ها با این Plugin است. |
| `imageGenerationProviders`       | `string[]` | شناسه‌های ارائه‌دهنده image-generation که مالکیت آن‌ها با این Plugin است. |
| `videoGenerationProviders`       | `string[]` | شناسه‌های ارائه‌دهنده video-generation که مالکیت آن‌ها با این Plugin است. |
| `webFetchProviders`              | `string[]` | شناسه‌های ارائه‌دهنده Web-fetch که مالکیت آن‌ها با این Plugin است.     |
| `webSearchProviders`             | `string[]` | شناسه‌های ارائه‌دهنده Web-search که مالکیت آن‌ها با این Plugin است.    |
| `migrationProviders`             | `string[]` | شناسه‌های ارائه‌دهنده import که مالکیت آن‌ها برای `openclaw migrate` با این Plugin است. |
| `tools`                          | `string[]` | نام ابزارهای عامل که مالکیت آن‌ها با این Plugin است.                   |

`contracts.embeddedExtensionFactories` برای factoryهای اکستنشن فقط app-server مربوط به Codex
که همراه بسته ارائه می‌شوند نگه داشته شده است. تبدیل‌های نتیجه ابزار همراه بسته باید
به‌جای آن `contracts.agentToolResultMiddleware` را اعلام کنند و با
`api.registerAgentToolResultMiddleware(...)` ثبت شوند. Pluginهای خارجی نمی‌توانند
middleware نتیجه ابزار ثبت کنند، زیرا این seam می‌تواند خروجی ابزار با اعتماد بالا را
پیش از دیده شدن توسط مدل بازنویسی کند.

ثبت‌های `api.registerTool(...)` در زمان اجرا باید با `contracts.tools` مطابقت داشته باشند.
کشف ابزار از این فهرست استفاده می‌کند تا فقط زمان اجراهای Pluginهایی را بارگذاری کند که می‌توانند مالک
ابزارهای درخواست‌شده باشند.

Pluginهای ارائه‌دهنده که `resolveExternalAuthProfiles` را پیاده‌سازی می‌کنند باید
`contracts.externalAuthProviders` را اعلام کنند. Pluginهای بدون این اعلامیه هنوز از مسیر
fallback سازگاری منسوخ عبور می‌کنند، اما آن fallback کندتر است و
پس از پنجره migration حذف خواهد شد.

ارائه‌دهنده‌های memory embedding همراه بسته باید
`contracts.memoryEmbeddingProviders` را برای هر شناسه adapter که ارائه می‌کنند اعلام کنند، از جمله
adapterهای داخلی مانند `local`. مسیرهای CLI مستقل از این قرارداد manifest
استفاده می‌کنند تا پیش از اینکه زمان اجرای کامل Gateway ارائه‌دهنده‌ها را ثبت کرده باشد، فقط Plugin مالک را
بارگذاری کنند.

## مرجع mediaUnderstandingProviderMetadata

از `mediaUnderstandingProviderMetadata` زمانی استفاده کنید که یک ارائه‌دهنده media-understanding
مدل‌های پیش‌فرض، اولویت fallback خودکار auth، یا پشتیبانی document بومی داشته باشد که
helperهای عمومی core پیش از بارگذاری زمان اجرا به آن نیاز دارند. کلیدها باید در
`contracts.mediaUnderstandingProviders` نیز اعلام شوند.

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

هر ورودی ارائه‌دهنده می‌تواند شامل این موارد باشد:

| فیلد                   | نوع                                 | معنای آن                                                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قابلیت‌های رسانه‌ای ارائه‌شده توسط این ارائه‌دهنده.                         |
| `defaultModels`        | `Record<string, string>`            | پیش‌فرض‌های capability-to-model که وقتی پیکربندی مدلی مشخص نکرده استفاده می‌شوند. |
| `autoPriority`         | `Record<string, number>`            | اعداد کمتر برای fallback خودکار ارائه‌دهنده مبتنی بر اعتبارنامه زودتر مرتب می‌شوند. |
| `nativeDocumentInputs` | `"pdf"[]`                           | ورودی‌های document بومی که ارائه‌دهنده پشتیبانی می‌کند.                     |

## مرجع channelConfigs

از `channelConfigs` زمانی استفاده کنید که یک Plugin کانال پیش از بارگذاری زمان اجرا به
فراداده پیکربندی کم‌هزینه نیاز دارد. کشف read-only مربوط به setup/status کانال می‌تواند از این فراداده
برای کانال‌های خارجی پیکربندی‌شده مستقیماً استفاده کند، وقتی ورودی setup در دسترس نیست، یا
وقتی `setup.requiresRuntime: false` اعلام می‌کند که زمان اجرای setup لازم نیست.

`channelConfigs` فراداده manifest Plugin است، نه یک بخش جدید پیکربندی سطح بالای کاربر.
کاربران همچنان نمونه‌های کانال را زیر `channels.<channel-id>` پیکربندی می‌کنند.
OpenClaw فراداده manifest را می‌خواند تا پیش از اجرای کد زمان اجرای Plugin تصمیم بگیرد کدام Plugin مالک آن کانال
پیکربندی‌شده است.

برای یک Plugin کانال، `configSchema` و `channelConfigs` مسیرهای متفاوتی را توصیف می‌کنند:

- `configSchema` مقدار `plugins.entries.<plugin-id>.config` را اعتبارسنجی می‌کند
- `channelConfigs.<channel-id>.schema` مقدار `channels.<channel-id>` را اعتبارسنجی می‌کند

Pluginهای غیرهمراه که `channels[]` را اعلام می‌کنند باید ورودی‌های متناظر
`channelConfigs` را نیز اعلام کنند. بدون آن‌ها، OpenClaw همچنان می‌تواند Plugin را بارگذاری کند، اما
سطوح schema پیکربندی cold-path، setup، و Control UI تا زمان اجرای زمان اجرای Plugin نمی‌توانند
شکل option متعلق به کانال را بدانند.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و
`nativeSkillsAutoEnabled` می‌توانند پیش‌فرض‌های ایستای `auto` را برای بررسی‌های پیکربندی فرمان اعلام کنند
که پیش از بارگذاری زمان اجرای کانال اجرا می‌شوند. کانال‌های همراه بسته همچنین می‌توانند
همان پیش‌فرض‌ها را از طریق `package.json#openclaw.channel.commands` در کنار
فراداده catalog کانال دیگری که مالکیت آن با package است منتشر کنند.

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

| فیلد         | نوع                     | معنی آن                                                                                     |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema برای `channels.<id>`. برای هر ورودی پیکربندی کانال اعلام‌شده الزامی است.        |
| `uiHints`     | `Record<string, object>` | برچسب‌ها/placeholderها/راهنمایی‌های حساس اختیاری UI برای آن بخش پیکربندی کانال.            |
| `label`       | `string`                 | برچسب کانال که وقتی فراداده runtime آماده نیست، در سطح‌های انتخاب‌گر و بازرسی ادغام می‌شود. |
| `description` | `string`                 | توضیح کوتاه کانال برای سطح‌های بازرسی و کاتالوگ.                                           |
| `commands`    | `object`                 | پیش‌فرض‌های خودکار فرمان بومی و skill بومی ایستا برای بررسی‌های پیکربندی پیش از runtime.    |
| `preferOver`  | `string[]`               | شناسه‌های Plugin قدیمی یا کم‌اولویت‌تری که این کانال باید در سطح‌های انتخاب از آن‌ها جلوتر باشد. |

### جایگزینی یک Plugin کانال دیگر

از `preferOver` زمانی استفاده کنید که Plugin شما مالک ترجیحی برای یک شناسه کانال است که
Plugin دیگری هم می‌تواند آن را فراهم کند. حالت‌های رایج شامل شناسه Plugin تغییرنام‌داده‌شده، یک
Plugin مستقل که جایگزین یک Plugin همراه‌شده می‌شود، یا یک fork نگه‌داری‌شده است که
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
شناسه Plugin ترجیحی را در نظر می‌گیرد. اگر Plugin کم‌اولویت‌تر فقط به این دلیل انتخاب شده باشد که
همراه‌شده است یا به‌طور پیش‌فرض فعال است، OpenClaw آن را در پیکربندی
runtime مؤثر غیرفعال می‌کند تا یک Plugin مالک کانال و ابزارهای آن باشد. انتخاب صریح کاربر
همچنان اولویت دارد: اگر کاربر هر دو Plugin را صریحاً فعال کند، OpenClaw
آن انتخاب را حفظ می‌کند و به‌جای تغییر بی‌صدا در مجموعه Pluginهای درخواست‌شده،
تشخیص‌های کانال/ابزار تکراری را گزارش می‌دهد.

`preferOver` را به شناسه‌های Plugin محدود کنید که واقعاً می‌توانند همان کانال را فراهم کنند.
این یک فیلد اولویت عمومی نیست و کلیدهای پیکربندی کاربر را تغییرنام نمی‌دهد.

## مرجع modelSupport

از `modelSupport` زمانی استفاده کنید که OpenClaw باید پیش از بارگیری runtime
Plugin، Plugin ارائه‌دهنده شما را از شناسه‌های مدل کوتاه‌نویسی‌شده مانند `gpt-5.5` یا `claude-sonnet-4.6` استنباط کند.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw این تقدم را اعمال می‌کند:

- ارجاع‌های صریح `provider/model` از فراداده manifest مالک `providers` استفاده می‌کنند
- `modelPatterns` بر `modelPrefixes` مقدم است
- اگر یک Plugin غیرهمراه‌شده و یک Plugin همراه‌شده هر دو تطبیق داشته باشند، Plugin غیرهمراه‌شده
  برنده می‌شود
- ابهام باقی‌مانده نادیده گرفته می‌شود تا زمانی که کاربر یا پیکربندی یک ارائه‌دهنده را مشخص کند

فیلدها:

| فیلد           | نوع       | معنی آن                                                                         |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | پیشوندهایی که با `startsWith` در برابر شناسه‌های مدل کوتاه‌نویسی‌شده تطبیق داده می‌شوند. |
| `modelPatterns` | `string[]` | منبع‌های regex که پس از حذف پسوند profile، در برابر شناسه‌های مدل کوتاه‌نویسی‌شده تطبیق داده می‌شوند. |

## مرجع modelCatalog

از `modelCatalog` زمانی استفاده کنید که OpenClaw باید پیش از بارگیری runtime
Plugin، فراداده مدل ارائه‌دهنده را بداند. این منبع تحت مالکیت manifest برای ردیف‌های
کاتالوگ ثابت، aliasهای ارائه‌دهنده، قوانین سرکوب و حالت کشف است. تازه‌سازی runtime
همچنان متعلق به کد runtime ارائه‌دهنده است، اما manifest به core می‌گوید runtime
چه زمانی لازم است.

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

| فیلد          | نوع                                                     | معنی آن                                                                                                      |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | ردیف‌های کاتالوگ برای شناسه‌های ارائه‌دهنده که مالکیت آن‌ها با این Plugin است. کلیدها باید در `providers` سطح بالا نیز ظاهر شوند. |
| `aliases`      | `Record<string, object>`                                 | aliasهای ارائه‌دهنده که باید برای برنامه‌ریزی کاتالوگ یا سرکوب به یک ارائه‌دهنده تحت مالکیت resolve شوند. |
| `suppressions` | `object[]`                                               | ردیف‌های مدل از منبعی دیگر که این Plugin به دلیلی ویژه ارائه‌دهنده سرکوب می‌کند.                            |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | اینکه آیا کاتالوگ ارائه‌دهنده را می‌توان از فراداده manifest خواند، در cache تازه‌سازی کرد، یا به runtime نیاز دارد. |

`aliases` در جست‌وجوی مالکیت ارائه‌دهنده برای برنامه‌ریزی کاتالوگ مدل مشارکت می‌کند.
مقصدهای alias باید ارائه‌دهنده‌های سطح بالایی باشند که مالکیتشان با همان Plugin است. وقتی یک
فهرست فیلترشده بر اساس ارائه‌دهنده از یک alias استفاده می‌کند، OpenClaw می‌تواند manifest مالک را بخواند و
بدون بارگیری runtime ارائه‌دهنده، بازنویسی‌های API/base URL مربوط به alias را اعمال کند.
Aliasها فهرست‌های کاتالوگ بدون فیلتر را گسترش نمی‌دهند؛ فهرست‌های گسترده فقط ردیف‌های
ارائه‌دهنده canonical مالک را منتشر می‌کنند.

`suppressions` جایگزین hook قدیمی runtime ارائه‌دهنده `suppressBuiltInModel` می‌شود.
ورودی‌های سرکوب فقط زمانی رعایت می‌شوند که ارائه‌دهنده تحت مالکیت Plugin باشد یا
به‌عنوان یک کلید `modelCatalog.aliases` اعلام شده باشد که به یک ارائه‌دهنده تحت مالکیت اشاره می‌کند. hookهای
سرکوب runtime دیگر هنگام resolve مدل فراخوانی نمی‌شوند.

فیلدهای ارائه‌دهنده:

| فیلد     | نوع                     | معنی آن                                                              |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL پایه پیش‌فرض اختیاری برای مدل‌ها در این کاتالوگ ارائه‌دهنده.     |
| `api`     | `ModelApi`               | adapter پیش‌فرض اختیاری API برای مدل‌ها در این کاتالوگ ارائه‌دهنده. |
| `headers` | `Record<string, string>` | headerهای ایستای اختیاری که روی این کاتالوگ ارائه‌دهنده اعمال می‌شوند. |
| `models`  | `object[]`               | ردیف‌های مدل الزامی. ردیف‌های بدون `id` نادیده گرفته می‌شوند.        |

فیلدهای مدل:

| فیلد           | نوع                                                           | معنی آن                                                                             |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | شناسه مدل محلی ارائه‌دهنده، بدون پیشوند `provider/`.                               |
| `name`          | `string`                                                       | نام نمایشی اختیاری.                                                                 |
| `api`           | `ModelApi`                                                     | بازنویسی اختیاری API برای هر مدل.                                                   |
| `baseUrl`       | `string`                                                       | بازنویسی اختیاری URL پایه برای هر مدل.                                              |
| `headers`       | `Record<string, string>`                                       | headerهای ایستای اختیاری برای هر مدل.                                               |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | modalityهایی که مدل می‌پذیرد.                                                       |
| `reasoning`     | `boolean`                                                      | اینکه آیا مدل رفتار reasoning را ارائه می‌کند یا نه.                                |
| `contextWindow` | `number`                                                       | پنجره context بومی ارائه‌دهنده.                                                     |
| `contextTokens` | `number`                                                       | سقف مؤثر اختیاری context در runtime وقتی با `contextWindow` متفاوت است.             |
| `maxTokens`     | `number`                                                       | بیشینه توکن‌های خروجی وقتی مشخص باشد.                                               |
| `cost`          | `object`                                                       | قیمت‌گذاری اختیاری USD به‌ازای هر میلیون توکن، شامل `tieredPricing` اختیاری.       |
| `compat`        | `object`                                                       | پرچم‌های سازگاری اختیاری که با سازگاری پیکربندی مدل OpenClaw مطابقت دارند.         |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | وضعیت فهرست. فقط زمانی سرکوب کنید که ردیف اصلاً نباید ظاهر شود.                    |
| `statusReason`  | `string`                                                       | دلیل اختیاری که همراه با وضعیت غیرقابل‌دسترس نمایش داده می‌شود.                    |
| `replaces`      | `string[]`                                                     | شناسه‌های مدل محلی ارائه‌دهنده قدیمی‌تر که این مدل جایگزین آن‌ها می‌شود.           |
| `replacedBy`    | `string`                                                       | شناسه مدل محلی ارائه‌دهنده جایگزین برای ردیف‌های deprecated.                       |
| `tags`          | `string[]`                                                     | برچسب‌های پایدار که توسط انتخاب‌گرها و فیلترها استفاده می‌شوند.                    |

فیلدهای سرکوب:

| فیلد                      | نوع       | معنی آن                                                                                                        |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | شناسه ارائه‌دهنده برای ردیف بالادستی که باید سرکوب شود. باید تحت مالکیت این Plugin باشد یا به‌عنوان alias تحت مالکیت اعلام شده باشد. |
| `model`                    | `string`   | شناسه مدل محلی ارائه‌دهنده که باید سرکوب شود.                                                                 |
| `reason`                   | `string`   | پیام اختیاری که وقتی ردیف سرکوب‌شده مستقیماً درخواست می‌شود نمایش داده می‌شود.                                |
| `when.baseUrlHosts`        | `string[]` | فهرست اختیاری hostهای URL پایه مؤثر ارائه‌دهنده که پیش از اعمال سرکوب لازم هستند.                            |
| `when.providerConfigApiIn` | `string[]` | فهرست اختیاری مقادیر دقیق `api` در پیکربندی ارائه‌دهنده که پیش از اعمال سرکوب لازم هستند.                    |

داده‌های صرفاً زمان اجرا را در `modelCatalog` قرار ندهید. از `static` فقط زمانی استفاده کنید که ردیف‌های manifest به‌اندازه‌ای کامل باشند که سطوح فهرست و انتخابگر فیلترشده بر اساس ارائه‌دهنده بتوانند از کشف registry/زمان اجرا صرف‌نظر کنند. از `refreshable` زمانی استفاده کنید که ردیف‌های manifest به‌عنوان بذرها یا مکمل‌های قابل‌فهرست مفید باشند، اما refresh/cache بتواند بعداً ردیف‌های بیشتری اضافه کند؛ ردیف‌های refreshable به‌تنهایی مرجع قطعی نیستند. از `runtime` زمانی استفاده کنید که OpenClaw باید زمان اجرای ارائه‌دهنده را بارگذاری کند تا فهرست را بداند.

## مرجع `modelIdNormalization`

از `modelIdNormalization` برای پاک‌سازی سبک و متعلق به ارائه‌دهندهٔ شناسهٔ مدل استفاده کنید که باید پیش از بارگذاری زمان اجرای ارائه‌دهنده انجام شود. این کار aliasهایی مانند نام‌های کوتاه مدل، شناسه‌های قدیمی محلیِ ارائه‌دهنده، و قواعد prefix پراکسی را به‌جای جدول‌های انتخاب مدل در هسته، در manifest مربوط به Plugin مالک نگه می‌دارد.

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

| فیلد                                | نوع                    | معنای آن                                                                                   |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | aliasهای دقیق و غیرحساس به بزرگی/کوچکی حروف برای شناسهٔ مدل. مقدارها همان‌طور که نوشته شده‌اند برگردانده می‌شوند. |
| `stripPrefixes`                      | `string[]`              | prefixهایی که پیش از جست‌وجوی alias حذف می‌شوند، برای تکرار قدیمی provider/model مفید است. |
| `prefixWhenBare`                     | `string`                | prefixی که وقتی شناسهٔ مدل نرمال‌شده هنوز شامل `/` نیست اضافه می‌شود.                    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | قواعد شرطی prefix برای شناسهٔ بدون prefix پس از جست‌وجوی alias، بر اساس `modelPrefix` و `prefix`. |

## مرجع `providerEndpoints`

از `providerEndpoints` برای طبقه‌بندی endpoint استفاده کنید که سیاست عمومی درخواست باید پیش از بارگذاری زمان اجرای ارائه‌دهنده بداند. هسته همچنان معنای هر `endpointClass` را مالک است؛ manifestهای Plugin مالک فرادادهٔ host و base URL هستند.

فیلدهای endpoint:

| فیلد                          | نوع        | معنای آن                                                                                   |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | کلاس endpoint شناخته‌شده در هسته، مانند `openrouter`، `moonshot-native` یا `google-vertex`. |
| `hosts`                        | `string[]` | نام میزبان‌های دقیق که به کلاس endpoint نگاشت می‌شوند.                                      |
| `hostSuffixes`                 | `string[]` | پسوندهای میزبان که به کلاس endpoint نگاشت می‌شوند. برای تطبیق فقط با پسوند دامنه، با `.` شروع کنید. |
| `baseUrls`                     | `string[]` | base URLهای HTTP(S) نرمال‌شدهٔ دقیق که به کلاس endpoint نگاشت می‌شوند.                     |
| `googleVertexRegion`           | `string`   | منطقهٔ ثابت Google Vertex برای میزبان‌های سراسری دقیق.                                      |
| `googleVertexRegionHostSuffix` | `string`   | پسوندی که از میزبان‌های مطابق حذف می‌شود تا prefix منطقهٔ Google Vertex آشکار شود.        |

## مرجع `providerRequest`

از `providerRequest` برای فرادادهٔ سبکِ سازگاری درخواست استفاده کنید که سیاست عمومی درخواست بدون بارگذاری زمان اجرای ارائه‌دهنده به آن نیاز دارد. بازنویسی payload وابسته به رفتار را در hookهای زمان اجرای ارائه‌دهنده یا helperهای مشترک خانوادهٔ ارائه‌دهنده نگه دارید.

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

| فیلد                  | نوع          | معنای آن                                                                              |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | برچسب خانوادهٔ ارائه‌دهنده که در تصمیم‌های سازگاری درخواست عمومی و عیب‌یابی استفاده می‌شود. |
| `compatibilityFamily` | `"moonshot"` | سبد اختیاری سازگاری خانوادهٔ ارائه‌دهنده برای helperهای مشترک درخواست.              |
| `openAICompletions`   | `object`     | flagهای درخواست completions سازگار با OpenAI، در حال حاضر `supportsStreamingUsage`.   |

## مرجع `modelPricing`

از `modelPricing` زمانی استفاده کنید که یک ارائه‌دهنده پیش از بارگذاری زمان اجرا به کنترل رفتار قیمت‌گذاری control-plane نیاز دارد. کش قیمت‌گذاری Gateway این فراداده را بدون import کردن کد زمان اجرای ارائه‌دهنده می‌خواند.

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

| فیلد         | نوع               | معنای آن                                                                                         |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | برای ارائه‌دهنده‌های محلی/خودمیزبان که هرگز نباید قیمت‌گذاری OpenRouter یا LiteLLM را دریافت کنند، `false` تنظیم کنید. |
| `openRouter` | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری OpenRouter. `false` جست‌وجوی OpenRouter را برای این ارائه‌دهنده غیرفعال می‌کند. |
| `liteLLM`    | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری LiteLLM. `false` جست‌وجوی LiteLLM را برای این ارائه‌دهنده غیرفعال می‌کند. |

فیلدهای منبع:

| فیلد                       | نوع                | معنای آن                                                                                                             |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | شناسهٔ ارائه‌دهنده در کاتالوگ خارجی وقتی با شناسهٔ ارائه‌دهندهٔ OpenClaw متفاوت است، برای مثال `z-ai` برای ارائه‌دهندهٔ `zai`. |
| `passthroughProviderModel` | `boolean`          | شناسه‌های مدل دارای slash را به‌عنوان ارجاع‌های تو در توی provider/model در نظر بگیرید؛ برای ارائه‌دهنده‌های پراکسی مانند OpenRouter مفید است. |
| `modelIdTransforms`        | `"version-dots"[]` | گونه‌های اضافی شناسهٔ مدل در کاتالوگ خارجی. `version-dots` شناسه‌های نسخهٔ نقطه‌دار مانند `claude-opus-4.6` را امتحان می‌کند. |

### نمایهٔ ارائه‌دهندهٔ OpenClaw

نمایهٔ ارائه‌دهندهٔ OpenClaw فرادادهٔ پیش‌نمایشِ متعلق به OpenClaw برای ارائه‌دهندگانی است که Pluginهای آن‌ها ممکن است هنوز نصب نشده باشند. این بخشی از manifest یک Plugin نیست. manifestهای Plugin همچنان مرجع نصب‌شدهٔ Plugin هستند. نمایهٔ ارائه‌دهنده قرارداد fallback داخلی است که سطوح انتخابگر مدل برای ارائه‌دهندهٔ قابل نصب و پیش از نصب در آینده، وقتی Plugin ارائه‌دهنده نصب نشده باشد، مصرف خواهند کرد.

ترتیب مرجع کاتالوگ:

1. پیکربندی کاربر.
2. manifest نصب‌شدهٔ Plugin `modelCatalog`.
3. کش کاتالوگ مدل از refresh صریح.
4. ردیف‌های پیش‌نمایش نمایهٔ ارائه‌دهندهٔ OpenClaw.

نمایهٔ ارائه‌دهنده نباید شامل secrets، وضعیت فعال‌سازی، hookهای زمان اجرا، یا دادهٔ مدل زنده و مختص حساب باشد. کاتالوگ‌های پیش‌نمایش آن از همان شکل ردیف ارائه‌دهندهٔ `modelCatalog` مانند manifestهای Plugin استفاده می‌کنند، اما باید به فرادادهٔ نمایشی پایدار محدود بمانند، مگر اینکه فیلدهای adapter زمان اجرا مانند `api`، `baseUrl`، قیمت‌گذاری، یا flagهای سازگاری عمداً با manifest نصب‌شدهٔ Plugin هم‌راستا نگه داشته شوند. ارائه‌دهندگانی که کشف زندهٔ `/models` دارند باید ردیف‌های refresh‌شده را از مسیر کش صریح کاتالوگ مدل بنویسند، نه اینکه فهرست‌گیری معمولی یا onboarding را وادار به فراخوانی APIهای ارائه‌دهنده کنند.

ورودی‌های نمایهٔ ارائه‌دهنده همچنین می‌توانند فرادادهٔ Plugin قابل نصب را برای ارائه‌دهندگانی حمل کنند که Plugin آن‌ها از هسته خارج شده یا به هر دلیل هنوز نصب نشده است. این فراداده الگوی کاتالوگ کانال را بازتاب می‌دهد: نام package، spec نصب npm، integrity مورد انتظار، و برچسب‌های سبک انتخاب احراز هویت برای نمایش یک گزینهٔ راه‌اندازی قابل نصب کافی هستند. پس از نصب Plugin، manifest آن برنده است و ورودی نمایهٔ ارائه‌دهنده برای آن ارائه‌دهنده نادیده گرفته می‌شود.

کلیدهای capability سطح بالا و قدیمی منسوخ شده‌اند. از `openclaw doctor --fix` استفاده کنید تا `speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders` و `webSearchProviders` را زیر `contracts` منتقل کنید؛ بارگذاری معمول manifest دیگر این فیلدهای سطح بالا را به‌عنوان مالکیت capability در نظر نمی‌گیرد.

## Manifest در برابر package.json

این دو فایل کارهای متفاوتی انجام می‌دهند:

| فایل                    | برای این مورد استفاده کنید                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | کشف، اعتبارسنجی پیکربندی، فرادادهٔ انتخاب احراز هویت، و اشاره‌های UI که باید پیش از اجرای کد Plugin وجود داشته باشند |
| `package.json`         | فرادادهٔ npm، نصب dependency، و بلوک `openclaw` که برای entrypointها، gating نصب، راه‌اندازی، یا فرادادهٔ کاتالوگ استفاده می‌شود |

اگر مطمئن نیستید یک قطعه فراداده کجا باید قرار بگیرد، از این قاعده استفاده کنید:

- اگر OpenClaw باید پیش از بارگذاری کد Plugin آن را بداند، آن را در `openclaw.plugin.json` قرار دهید
- اگر دربارهٔ packaging، فایل‌های entry، یا رفتار نصب npm است، آن را در `package.json` قرار دهید

### فیلدهای package.json که بر کشف اثر می‌گذارند

برخی فراداده‌های پیش از زمان اجرا برای Plugin عمداً در `package.json` و زیر بلوک `openclaw` قرار می‌گیرند، نه در `openclaw.plugin.json`.
`openclaw.bundle` و `openclaw.bundle.json` قراردادهای Plugin در OpenClaw نیستند؛ Pluginهای native باید از `openclaw.plugin.json` به‌همراه فیلدهای پشتیبانی‌شدهٔ `package.json#openclaw` در زیر استفاده کنند.

نمونه‌های مهم:

| فیلد                                                                                      | معنای آن                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | نقاط ورود Plugin بومی را اعلام می‌کند. باید داخل دایرکتوری بسته Plugin باقی بماند.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | نقاط ورود runtime جاوااسکریپت ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. باید داخل دایرکتوری بسته Plugin باقی بماند.                                                                 |
| `openclaw.setupEntry`                                                                      | نقطه ورود سبکِ فقط برای راه‌اندازی است که هنگام onboarding، راه‌اندازی به‌تعویق‌افتاده کانال، و کشف وضعیت کانال فقط‌خواندنی/SecretRef استفاده می‌شود. باید داخل دایرکتوری بسته Plugin باقی بماند. |
| `openclaw.runtimeSetupEntry`                                                               | نقطه ورود setup جاوااسکریپت ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. به `setupEntry` نیاز دارد، باید وجود داشته باشد، و باید داخل دایرکتوری بسته Plugin باقی بماند.                         |
| `openclaw.channel`                                                                         | فراداده ارزان کاتالوگ کانال، مانند برچسب‌ها، مسیرهای مستندات، نام‌های مستعار، و متن انتخاب.                                                                                                 |
| `openclaw.channel.commands`                                                                | فراداده ایستای فرمان بومی و پیش‌فرض خودکار skill بومی که پیش از بارگذاری runtime کانال توسط سطوح config، audit، و command-list استفاده می‌شود.                                          |
| `openclaw.channel.configuredState`                                                         | فراداده سبک بررسی‌کننده وضعیت پیکربندی‌شده که می‌تواند بدون بارگذاری runtime کامل کانال پاسخ دهد «آیا راه‌اندازی فقط env از قبل وجود دارد؟».                                         |
| `openclaw.channel.persistedAuthState`                                                      | فراداده سبک بررسی‌کننده احراز هویت پایدارشده که می‌تواند بدون بارگذاری runtime کامل کانال پاسخ دهد «آیا چیزی از قبل وارد شده است؟».                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | راهنمایی‌های نصب/به‌روزرسانی برای Pluginهای همراه و منتشرشده بیرونی.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | مسیر نصب ترجیحی هنگامی که چند منبع نصب در دسترس است.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | حداقل نسخه پشتیبانی‌شده میزبان OpenClaw، با استفاده از کف semver مانند `>=2026.3.22` یا `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | رشته integrity مورد انتظار npm dist مانند `sha512-...`؛ جریان‌های نصب و به‌روزرسانی artifact دریافت‌شده را در برابر آن بررسی می‌کنند.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | یک مسیر محدود بازیابی نصب مجدد Plugin همراه را هنگامی که config نامعتبر است مجاز می‌کند.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | اجازه می‌دهد سطوح کانالِ فقط setup پیش از Plugin کامل کانال در هنگام راه‌اندازی بارگذاری شوند.                                                                                                 |

فراداده manifest تعیین می‌کند کدام گزینه‌های provider/channel/setup پیش از
بارگذاری runtime در onboarding ظاهر شوند. `package.json#openclaw.install` به
onboarding می‌گوید وقتی کاربر یکی از آن گزینه‌ها را انتخاب می‌کند، چگونه آن
Plugin را دریافت یا فعال کند. راهنمایی‌های نصب را به `openclaw.plugin.json` منتقل نکنید.

`openclaw.install.minHostVersion` هنگام نصب و بارگذاری registry manifest
برای منابع Plugin غیرهمراه اعمال می‌شود. مقادیر نامعتبر رد می‌شوند؛
مقادیر جدیدتر اما معتبر باعث می‌شوند Pluginهای بیرونی در میزبان‌های قدیمی‌تر نادیده گرفته شوند. Pluginهای منبع همراه
فرض می‌شوند با checkout میزبان هم‌نسخه هستند.

فراداده رسمی نصب در زمان نیاز باید وقتی Plugin در ClawHub منتشر شده است از
`clawhubSpec` استفاده کند؛ onboarding آن را به‌عنوان منبع remote ترجیحی در نظر می‌گیرد و
پس از نصب، واقعیت‌های artifact مربوط به ClawHub را ثبت می‌کند. `npmSpec` برای بسته‌هایی که هنوز به ClawHub منتقل نشده‌اند،
fallback سازگاری باقی می‌ماند.

پین‌کردن نسخه دقیق npm از قبل در `npmSpec` قرار دارد، برای مثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. ورودی‌های رسمی کاتالوگ بیرونی
باید specهای دقیق را با `expectedIntegrity` همراه کنند تا اگر artifact دریافت‌شده npm دیگر با انتشار پین‌شده مطابقت نداشت،
جریان‌های به‌روزرسانی بسته شکست‌خورده و بسته بمانند.
onboarding تعاملی همچنان specهای npm از registry مورد اعتماد، از جمله نام‌های خام بسته
و dist-tagها را برای سازگاری ارائه می‌دهد. diagnostics کاتالوگ می‌تواند
منابع exact، floating، integrity-pinned، missing-integrity، package-name
mismatch، و invalid default-choice را از هم تشخیص دهد. همچنین وقتی
`expectedIntegrity` وجود دارد اما منبع معتبر npmای برای پین‌کردن آن وجود ندارد،
هشدار می‌دهد.
وقتی `expectedIntegrity` وجود دارد،
جریان‌های نصب/به‌روزرسانی آن را اعمال می‌کنند؛ وقتی حذف شده باشد، resolution رجیستری
بدون integrity pin ثبت می‌شود.

Pluginهای کانال باید زمانی `openclaw.setupEntry` ارائه کنند که status، فهرست کانال،
یا اسکن‌های SecretRef نیاز دارند حساب‌های پیکربندی‌شده را بدون بارگذاری runtime کامل
شناسایی کنند. نقطه ورود setup باید فراداده کانال به‌همراه adapterهای config،
status، و secrets امن برای setup را ارائه کند؛ کلاینت‌های شبکه، listenerهای Gateway، و
runtimeهای transport را در نقطه ورود اصلی extension نگه دارید.

فیلدهای نقطه ورود runtime بررسی‌های مرز بسته برای فیلدهای نقطه ورود source را
override نمی‌کنند. برای مثال، `openclaw.runtimeExtensions` نمی‌تواند یک مسیر
گریزان `openclaw.extensions` را قابل بارگذاری کند.

`openclaw.install.allowInvalidConfigRecovery` عمداً محدود است. این گزینه
configهای خراب دلخواه را قابل نصب نمی‌کند. امروز فقط به جریان‌های نصب اجازه می‌دهد
از خرابی‌های مشخص ارتقای Plugin همراهِ stale بازیابی شوند، مانند یک مسیر Plugin همراه
مفقود یا یک ورودی stale `channels.<id>` برای همان Plugin همراه.
خطاهای نامرتبط config همچنان نصب را مسدود می‌کنند و operators را به
`openclaw doctor --fix` هدایت می‌کنند.

`openclaw.channel.persistedAuthState` فراداده بسته برای یک ماژول بررسی‌کننده کوچک است:

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

وقتی setup، doctor، status، یا جریان‌های presence فقط‌خواندنی به یک probe ارزان
بله/خیر احراز هویت پیش از بارگذاری Plugin کامل کانال نیاز دارند، از آن استفاده کنید.
وضعیت احراز هویت پایدارشده وضعیت کانال پیکربندی‌شده نیست: از این فراداده برای فعال‌سازی خودکار Pluginها،
ترمیم وابستگی‌های runtime، یا تصمیم‌گیری درباره اینکه runtime کانال باید بارگذاری شود استفاده نکنید.
export هدف باید تابع کوچکی باشد که فقط وضعیت پایدارشده را می‌خواند؛ آن را
از طریق barrel کامل runtime کانال مسیردهی نکنید.

`openclaw.channel.configuredState` برای بررسی‌های ارزان پیکربندی‌شده فقط env
همان شکل را دنبال می‌کند:

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

وقتی یک کانال می‌تواند وضعیت پیکربندی‌شده را از env یا ورودی‌های کوچک دیگر
غیر runtime پاسخ دهد، از آن استفاده کنید. اگر بررسی به resolution کامل config یا runtime واقعی
کانال نیاز دارد، آن منطق را به‌جای اینجا در hook
`config.hasConfiguredState` خود Plugin نگه دارید.

## تقدم کشف (شناسه‌های تکراری Plugin)

OpenClaw، Pluginها را از چندین ریشه کشف می‌کند (همراه، نصب سراسری، workspace، مسیرهای صریح انتخاب‌شده در config). اگر دو کشف `id` یکسان داشته باشند، فقط manifest با **بالاترین تقدم** نگه داشته می‌شود؛ تکراری‌های با تقدم کمتر به‌جای اینکه کنار آن بارگذاری شوند حذف می‌شوند.

تقدم، از بیشترین به کمترین:

1. **انتخاب‌شده در config** — مسیری که به‌طور صریح در `plugins.entries.<id>` پین شده است
2. **همراه** — Pluginهایی که با OpenClaw عرضه می‌شوند
3. **نصب سراسری** — Pluginهایی که در ریشه سراسری Pluginهای OpenClaw نصب شده‌اند
4. **Workspace** — Pluginهایی که نسبت به workspace فعلی کشف شده‌اند

پیامدها:

- یک کپی forkشده یا stale از یک Plugin همراه که در workspace قرار دارد، build همراه را shadow نمی‌کند.
- برای override واقعی یک Plugin همراه با یک نسخه محلی، آن را از طریق `plugins.entries.<id>` پین کنید تا با تقدم برنده شود، نه با تکیه بر کشف workspace.
- حذف تکراری‌ها log می‌شود تا Doctor و diagnostics راه‌اندازی بتوانند به کپی کنارگذاشته‌شده اشاره کنند.
- overrideهای تکراری انتخاب‌شده در config در diagnostics به‌عنوان overrideهای صریح بیان می‌شوند، اما همچنان هشدار می‌دهند تا forkهای stale و shadowهای تصادفی قابل مشاهده بمانند.

## الزامات JSON Schema

- **هر Plugin باید یک JSON Schema ارائه کند**، حتی اگر هیچ configای نپذیرد.
- schema خالی پذیرفتنی است (برای مثال، `{ "type": "object", "additionalProperties": false }`).
- schemaها هنگام خواندن/نوشتن config اعتبارسنجی می‌شوند، نه در runtime.
- هنگام گسترش یا fork کردن یک Plugin همراه با کلیدهای config جدید، هم‌زمان `configSchema` در `openclaw.plugin.json` آن Plugin را به‌روزرسانی کنید. schemaهای Plugin همراه strict هستند، بنابراین افزودن `plugins.entries.<id>.config.myNewKey` در config کاربر بدون افزودن `myNewKey` به `configSchema.properties` پیش از بارگذاری runtime Plugin رد خواهد شد.

نمونه گسترش schema:

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
  باید به شناسه‌های Plugin **قابل کشف** ارجاع دهند. شناسه‌های ناشناخته **خطا** هستند.
- اگر یک Plugin نصب شده باشد اما manifest یا schema خراب یا مفقود داشته باشد،
  اعتبارسنجی شکست می‌خورد و Doctor خطای Plugin را گزارش می‌کند.
- اگر config مربوط به Plugin وجود داشته باشد اما Plugin **غیرفعال** باشد، config نگه داشته می‌شود و
  یک **هشدار** در Doctor و logها نمایش داده می‌شود.

برای schema کامل `plugins.*`، [مرجع پیکربندی](/fa/gateway/configuration) را ببینید.

## یادداشت‌ها

- مانیفست برای **Pluginهای بومی OpenClaw الزامی است**، از جمله بارگذاری‌ها از فایل‌سیستم محلی. runtime همچنان ماژول Plugin را جداگانه بارگذاری می‌کند؛ مانیفست فقط برای کشف + اعتبارسنجی است.
- مانیفست‌های بومی با JSON5 تجزیه می‌شوند، بنابراین کامنت‌ها، کاماهای انتهایی، و کلیدهای بدون کوتیشن تا وقتی پذیرفته می‌شوند که مقدار نهایی همچنان یک آبجکت باشد.
- فقط فیلدهای مستندشدهٔ مانیفست توسط بارگذار مانیفست خوانده می‌شوند. از کلیدهای سفارشی سطح بالا خودداری کنید.
- وقتی یک Plugin به `channels`، `providers`، `cliBackends`، و `skills` نیاز ندارد، همهٔ آن‌ها می‌توانند حذف شوند.
- `providerDiscoveryEntry` باید سبک بماند و نباید کد runtime گسترده را import کند؛ از آن برای متادیتای ایستای کاتالوگ provider یا توصیف‌گرهای محدود کشف استفاده کنید، نه اجرای زمان درخواست.
- گونه‌های انحصاری Plugin از طریق `plugins.slots.*` انتخاب می‌شوند: `kind: "memory"` از طریق `plugins.slots.memory`، و `kind: "context-engine"` از طریق `plugins.slots.contextEngine` (پیش‌فرض `legacy`).
- گونهٔ انحصاری Plugin را در این مانیفست اعلام کنید. `OpenClawPluginDefinition.kind` در ورودی runtime منسوخ شده و فقط به‌عنوان fallback سازگاری برای Pluginهای قدیمی‌تر باقی مانده است.
- متادیتای متغیر محیطی (`setup.providers[].envVars`، `providerAuthEnvVars` منسوخ‌شده، و `channelEnvVars`) فقط اعلانی است. وضعیت، audit، اعتبارسنجی تحویل cron، و سایر سطوح فقط‌خواندنی همچنان پیش از اینکه یک متغیر محیطی را پیکربندی‌شده بدانند، سیاست اعتماد Plugin و فعال‌سازی مؤثر را اعمال می‌کنند.
- برای متادیتای runtime wizard که به کد provider نیاز دارد، [قلاب‌های runtime provider](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
- اگر Plugin شما به ماژول‌های بومی وابسته است، مراحل ساخت و هرگونه نیازمندی allowlist مربوط به package-manager را مستند کنید (برای مثال، pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## مرتبط

<CardGroup cols={3}>
  <Card title="Building plugins" href="/fa/plugins/building-plugins" icon="rocket">
    شروع کار با Pluginها.
  </Card>
  <Card title="Plugin architecture" href="/fa/plugins/architecture" icon="diagram-project">
    معماری داخلی و مدل قابلیت‌ها.
  </Card>
  <Card title="SDK overview" href="/fa/plugins/sdk-overview" icon="book">
    مرجع SDK Plugin و importهای subpath.
  </Card>
</CardGroup>
