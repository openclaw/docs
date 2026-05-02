---
read_when:
    - شما در حال ساخت یک Plugin برای OpenClaw هستید
    - باید یک طرح‌وارهٔ پیکربندی Plugin منتشر کنید یا خطاهای اعتبارسنجی Plugin را اشکال‌زدایی کنید
summary: الزامات مانیفست Plugin + طرح‌واره JSON (اعتبارسنجی سخت‌گیرانه پیکربندی)
title: مانیفست Plugin
x-i18n:
    generated_at: "2026-05-02T20:48:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

این صفحه فقط برای **مانیفست Plugin بومی OpenClaw** است.

برای چیدمان‌های bundle سازگار، [bundleهای Plugin](/fa/plugins/bundles) را ببینید.

قالب‌های bundle سازگار از فایل‌های مانیفست متفاوتی استفاده می‌کنند:

- bundle مربوط به Codex: `.codex-plugin/plugin.json`
- bundle مربوط به Claude: `.claude-plugin/plugin.json` یا چیدمان پیش‌فرض کامپوننت Claude
  بدون مانیفست
- bundle مربوط به Cursor: `.cursor-plugin/plugin.json`

OpenClaw این چیدمان‌های bundle را هم به‌صورت خودکار تشخیص می‌دهد، اما آن‌ها را
با schema مربوط به `openclaw.plugin.json` که اینجا توضیح داده شده اعتبارسنجی
نمی‌کند.

برای bundleهای سازگار، OpenClaw در حال حاضر metadata مربوط به bundle به‌همراه
ریشه‌های اعلام‌شده skill، ریشه‌های command در Claude، پیش‌فرض‌های `settings.json` در bundle مربوط به Claude،
پیش‌فرض‌های LSP در bundle مربوط به Claude، و بسته‌های hook پشتیبانی‌شده را می‌خواند، زمانی که چیدمان با
انتظارات runtime در OpenClaw سازگار باشد.

هر Plugin بومی OpenClaw **باید** یک فایل `openclaw.plugin.json` را در
**ریشه Plugin** عرضه کند. OpenClaw از این مانیفست برای اعتبارسنجی پیکربندی
**بدون اجرای کد Plugin** استفاده می‌کند. مانیفست‌های گم‌شده یا نامعتبر به‌عنوان
خطای Plugin در نظر گرفته می‌شوند و اعتبارسنجی پیکربندی را مسدود می‌کنند.

راهنمای کامل سیستم Plugin را ببینید: [Pluginها](/fa/tools/plugin).
برای مدل قابلیت بومی و راهنمایی فعلی سازگاری خارجی:
[مدل قابلیت](/fa/plugins/architecture#public-capability-model).

## این فایل چه کاری انجام می‌دهد

`openclaw.plugin.json` همان metadataای است که OpenClaw **پیش از بارگذاری کد
Plugin شما** می‌خواند. همه موارد زیر باید آن‌قدر سبک باشند که بدون راه‌اندازی
runtime مربوط به Plugin قابل بررسی باشند.

**از آن برای این موارد استفاده کنید:**

- هویت Plugin، اعتبارسنجی پیکربندی، و راهنماهای UI پیکربندی
- metadata مربوط به auth، onboarding، و setup (alias، auto-enable، متغیرهای env ارائه‌دهنده، گزینه‌های auth)
- راهنماهای activation برای سطوح control-plane
- مالکیت کوتاه‌نویسی‌شده خانواده مدل
- snapshotهای مالکیت قابلیت ایستا (`contracts`)
- metadata مربوط به اجراکننده QA که میزبان مشترک `openclaw qa` می‌تواند بررسی کند
- metadata پیکربندی مخصوص channel که در catalog و سطوح اعتبارسنجی ادغام می‌شود

**از آن برای این موارد استفاده نکنید:** ثبت رفتار runtime، اعلام entrypointهای کد،
یا metadata نصب npm. این موارد به کد Plugin شما و `package.json` تعلق دارند.

## نمونه حداقلی

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
| `id`                                 | بله      | `string`                         | شناسهٔ canonical Plugin. این همان شناسه‌ای است که در `plugins.entries.<id>` استفاده می‌شود.                                                                                                                                                                 |
| `configSchema`                       | بله      | `object`                         | طرح‌وارهٔ JSON درون‌خطی برای پیکربندی این Plugin.                                                                                                                                                                                        |
| `enabledByDefault`                   | خیر       | `true`                           | یک Plugin بسته‌بندی‌شده را به‌صورت پیش‌فرض فعال علامت‌گذاری می‌کند. آن را حذف کنید، یا هر مقدار غیر از `true` را تنظیم کنید، تا Plugin به‌صورت پیش‌فرض غیرفعال بماند.                                                                                                        |
| `legacyPluginIds`                    | خیر       | `string[]`                       | شناسه‌های قدیمی که به این شناسهٔ canonical Plugin نرمال‌سازی می‌شوند.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده‌ای که وقتی احراز هویت، پیکربندی، یا ارجاع‌های مدل به آن‌ها اشاره می‌کنند، باید این Plugin را به‌صورت خودکار فعال کنند.                                                                                                                                     |
| `kind`                               | خیر       | `"memory"` \| `"context-engine"` | نوع انحصاری Plugin را اعلام می‌کند که توسط `plugins.slots.*` استفاده می‌شود.                                                                                                                                                                        |
| `channels`                           | خیر       | `string[]`                       | شناسه‌های کانال متعلق به این Plugin. برای کشف و اعتبارسنجی پیکربندی استفاده می‌شود.                                                                                                                                                         |
| `providers`                          | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده متعلق به این Plugin.                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | خیر       | `string`                         | مسیر ماژول سبک کشف ارائه‌دهنده، نسبت به ریشهٔ Plugin، برای فرادادهٔ کاتالوگ ارائه‌دهنده در محدودهٔ manifest که می‌تواند بدون فعال‌سازی کامل runtime مربوط به Plugin بارگذاری شود.                                               |
| `modelSupport`                       | خیر       | `object`                         | فرادادهٔ خلاصهٔ خانوادهٔ مدل که مالکیت آن با manifest است و برای بارگذاری خودکار Plugin پیش از runtime استفاده می‌شود.                                                                                                                                         |
| `modelCatalog`                       | خیر       | `object`                         | فرادادهٔ کاتالوگ مدل اعلانی برای ارائه‌دهندگانی که متعلق به این Plugin هستند. این قرارداد صفحهٔ کنترل برای فهرست‌سازی فقط‌خواندنی آینده، onboarding، انتخاب‌گرهای مدل، نام‌های مستعار، و سرکوب بدون بارگذاری runtime مربوط به Plugin است.         |
| `modelPricing`                       | خیر       | `object`                         | خط‌مشی جست‌وجوی قیمت‌گذاری خارجی با مالکیت ارائه‌دهنده. از آن برای خارج کردن ارائه‌دهندگان محلی/خودمیزبان از کاتالوگ‌های قیمت‌گذاری راه‌دور، یا نگاشت ارجاع‌های ارائه‌دهنده به شناسه‌های کاتالوگ OpenRouter/LiteLLM بدون کدنویسی سخت شناسه‌های ارائه‌دهنده در هسته استفاده کنید.             |
| `modelIdNormalization`               | خیر       | `object`                         | پاک‌سازی نام مستعار/پیشوند شناسهٔ مدل با مالکیت ارائه‌دهنده که باید پیش از بارگذاری runtime ارائه‌دهنده اجرا شود.                                                                                                                                           |
| `providerEndpoints`                  | خیر       | `object[]`                       | فرادادهٔ میزبان endpoint یا `baseUrl` با مالکیت manifest برای مسیرهای ارائه‌دهنده که هسته باید پیش از بارگذاری runtime ارائه‌دهنده طبقه‌بندی کند.                                                                                                            |
| `providerRequest`                    | خیر       | `object`                         | فرادادهٔ سبک خانوادهٔ ارائه‌دهنده و سازگاری درخواست که پیش از بارگذاری runtime ارائه‌دهنده توسط خط‌مشی عمومی درخواست استفاده می‌شود.                                                                                                              |
| `cliBackends`                        | خیر       | `string[]`                       | شناسه‌های backend استنتاج CLI متعلق به این Plugin. برای فعال‌سازی خودکار هنگام راه‌اندازی از ارجاع‌های پیکربندی صریح استفاده می‌شود.                                                                                                                         |
| `syntheticAuthRefs`                  | خیر       | `string[]`                       | ارجاع‌های ارائه‌دهنده یا backend CLI که hook احراز هویت ساختگیِ متعلق به Plugin آن‌ها باید هنگام کشف سرد مدل و پیش از بارگذاری runtime بررسی شود.                                                                                              |
| `nonSecretAuthMarkers`               | خیر       | `string[]`                       | مقادیر جای‌نگهدار کلید API با مالکیت Plugin بسته‌بندی‌شده که وضعیت اعتبارنامهٔ غیرمحرمانهٔ محلی، OAuth، یا محیطی را نشان می‌دهند.                                                                                                                |
| `commandAliases`                     | خیر       | `object[]`                       | نام‌های فرمان متعلق به این Plugin که باید پیش از بارگذاری runtime، تشخیص‌های پیکربندی و CLI آگاه از Plugin تولید کنند.                                                                                                                |
| `providerAuthEnvVars`                | خیر       | `Record<string, string[]>`       | فرادادهٔ محیطی سازگاریِ منسوخ برای جست‌وجوی احراز هویت/وضعیت ارائه‌دهنده. برای Pluginهای جدید `setup.providers[].envVars` را ترجیح دهید؛ OpenClaw هنوز در بازهٔ منسوخ‌سازی این مورد را می‌خواند.                                                 |
| `providerAuthAliases`                | خیر       | `Record<string, string>`         | شناسه‌های ارائه‌دهنده‌ای که باید برای جست‌وجوی احراز هویت از شناسهٔ ارائه‌دهندهٔ دیگری استفادهٔ مجدد کنند؛ برای مثال ارائه‌دهندهٔ کدنویسی که کلید API ارائه‌دهندهٔ پایه و پروفایل‌های احراز هویت را به اشتراک می‌گذارد.                                                                          |
| `channelEnvVars`                     | خیر       | `Record<string, string[]>`       | فرادادهٔ محیطی سبک کانال که OpenClaw می‌تواند بدون بارگذاری کد Plugin بررسی کند. از آن برای راه‌اندازی کانال مبتنی بر env یا سطوح احراز هویتی استفاده کنید که helperهای عمومی راه‌اندازی/پیکربندی باید ببینند.                                            |
| `providerAuthChoices`                | خیر       | `object[]`                       | فرادادهٔ سبک گزینهٔ احراز هویت برای انتخاب‌گرهای onboarding، حل ارائه‌دهندهٔ ترجیحی، و سیم‌کشی سادهٔ پرچم CLI.                                                                                                                       |
| `activation`                         | خیر       | `object`                         | فرادادهٔ سبک برنامه‌ریز فعال‌سازی برای بارگذاریِ برانگیخته از راه‌اندازی، ارائه‌دهنده، فرمان، کانال، مسیر، و قابلیت. فقط فراداده است؛ runtime مربوط به Plugin همچنان مالک رفتار واقعی است.                                                       |
| `setup`                              | خیر       | `object`                         | توصیف‌گرهای سبک راه‌اندازی/onboarding که سطوح کشف و راه‌اندازی می‌توانند بدون بارگذاری runtime مربوط به Plugin بررسی کنند.                                                                                                                    |
| `qaRunners`                          | خیر       | `object[]`                       | توصیف‌گرهای سبک اجراکنندهٔ QA که میزبان مشترک `openclaw qa` پیش از بارگذاری runtime مربوط به Plugin استفاده می‌کند.                                                                                                                                      |
| `contracts`                          | خیر       | `object`                         | نماگرفت ایستای مالکیت قابلیت برای hookهای احراز هویت خارجی، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید موسیقی، تولید ویدئو، واکشی وب، جست‌وجوی وب، و مالکیت ابزار. |
| `mediaUnderstandingProviderMetadata` | خیر       | `Record<string, object>`         | پیش‌فرض‌های سبک درک رسانه برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.mediaUnderstandingProviders`.                                                                                                                            |
| `imageGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ سبک احراز هویت تولید تصویر برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.imageGenerationProviders`، شامل نام‌های مستعار احراز هویت با مالکیت ارائه‌دهنده و نگهبان‌های base-url.                                                                  |
| `videoGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ سبک احراز هویت تولید ویدئو برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.videoGenerationProviders`، شامل نام‌های مستعار احراز هویت با مالکیت ارائه‌دهنده و نگهبان‌های base-url.                                                                  |
| `musicGenerationProviderMetadata`    | خیر       | `Record<string, object>`         | فرادادهٔ سبک احراز هویت تولید موسیقی برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.musicGenerationProviders`، شامل نام‌های مستعار احراز هویت با مالکیت ارائه‌دهنده و نگهبان‌های base-url.                                                                  |
| `toolMetadata`                       | خیر       | `Record<string, object>`         | فرادادهٔ سبک دسترس‌پذیری برای ابزارهای متعلق به Plugin که در `contracts.tools` اعلام شده‌اند. وقتی ابزاری نباید runtime را بارگذاری کند مگر اینکه شواهد پیکربندی، env، یا احراز هویت وجود داشته باشد، از آن استفاده کنید.                                                           |
| `channelConfigs`                     | خیر       | `Record<string, object>`         | فرادادهٔ پیکربندی کانال با مالکیت manifest که پیش از بارگذاری runtime در سطوح کشف و اعتبارسنجی ادغام می‌شود.                                                                                                                          |
| `skills`                             | خیر       | `string[]`                       | دایرکتوری‌های Skill برای بارگذاری، نسبت به ریشهٔ Plugin.                                                                                                                                                                             |
| `name`                               | خیر       | `string`                         | نام Plugin قابل خواندن برای انسان.                                                                                                                                                                                                         |
| `description`                        | No       | `string`                         | خلاصهٔ کوتاهی که در سطوح Plugin نمایش داده می‌شود.                                                                                                                                                                                             |
| `version`                            | No       | `string`                         | نسخهٔ اطلاع‌رسانی Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | No       | `Record<string, object>`         | برچسب‌های رابط کاربری، جای‌نگهدارها و نشانه‌های حساسیت برای فیلدهای پیکربندی.                                                                                                                                                                   |

## مرجع فراداده ارائه‌دهنده تولید

فیلدهای فراداده ارائه‌دهنده تولید، سیگنال‌های ایستای احراز هویت را برای
ارائه‌دهندگانی توصیف می‌کنند که در فهرست متناظر `contracts.*GenerationProviders` اعلام شده‌اند.
OpenClaw این فیلدها را پیش از بارگذاری زمان اجرای ارائه‌دهنده می‌خواند تا ابزارهای هسته بتوانند
بدون وارد کردن هر Plugin ارائه‌دهنده، تصمیم بگیرند آیا یک ارائه‌دهنده تولید در دسترس است یا نه.

از این فیلدها فقط برای واقعیت‌های ارزان و اعلامی استفاده کنید. انتقال، تبدیل‌های درخواست،
بازخوانی توکن، اعتبارسنجی اعتبارنامه، و رفتار واقعی تولید
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

هر ورودی فراداده از موارد زیر پشتیبانی می‌کند:

| فیلد           | الزامی | نوع       | معنی آن                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | خیر       | `string[]` | شناسه‌های اضافی ارائه‌دهنده که باید به‌عنوان نام‌های مستعار ایستای احراز هویت برای ارائه‌دهنده تولید حساب شوند.                                       |
| `authProviders` | خیر       | `string[]` | شناسه‌های ارائه‌دهنده‌ای که پروفایل‌های احراز هویت پیکربندی‌شده آن‌ها باید به‌عنوان احراز هویت برای این ارائه‌دهنده تولید حساب شوند.                                      |
| `configSignals` | خیر       | `object[]` | سیگنال‌های ارزانِ فقط پیکربندی برای ارائه‌دهندگان محلی یا خودمیزبان که می‌توانند بدون پروفایل‌های احراز هویت یا متغیرهای محیطی پیکربندی شوند. |
| `authSignals`   | خیر       | `object[]` | سیگنال‌های صریح احراز هویت. هنگام حضور، این‌ها مجموعه سیگنال پیش‌فرض را از شناسه ارائه‌دهنده، `aliases`، و `authProviders` جایگزین می‌کنند.     |

هر ورودی `configSignals` از موارد زیر پشتیبانی می‌کند:

| فیلد         | الزامی | نوع       | معنی آن                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | بله      | `string`   | مسیر نقطه‌ای به شیء پیکربندی متعلق به Plugin برای بررسی، برای مثال `plugins.entries.example.config`.                                                                                    |
| `overlayPath` | خیر       | `string`   | مسیر نقطه‌ای داخل پیکربندی ریشه که شیء آن باید پیش از ارزیابی سیگنال روی شیء ریشه اعمال شود. از این برای پیکربندی ویژه قابلیت مانند `image`، `video`، یا `music` استفاده کنید. |
| `required`    | خیر       | `string[]` | مسیرهای نقطه‌ای داخل پیکربندی مؤثر که باید مقدارهای پیکربندی‌شده داشته باشند. رشته‌ها باید غیرخالی باشند؛ اشیا و آرایه‌ها نباید خالی باشند.                                                |
| `requiredAny` | خیر       | `string[]` | مسیرهای نقطه‌ای داخل پیکربندی مؤثر که دست‌کم یکی از آن‌ها باید مقدار پیکربندی‌شده داشته باشد.                                                                                                  |
| `mode`        | خیر       | `object`   | نگهبان اختیاری حالت رشته‌ای داخل پیکربندی مؤثر. وقتی در دسترس بودنِ فقط پیکربندی فقط برای یک حالت اعمال می‌شود، از این استفاده کنید.                                                                |

هر نگهبان `mode` از موارد زیر پشتیبانی می‌کند:

| فیلد        | الزامی | نوع       | معنی آن                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | خیر       | `string`   | مسیر نقطه‌ای داخل پیکربندی مؤثر. به‌طور پیش‌فرض `mode` است.                          |
| `default`    | خیر       | `string`   | مقدار حالت برای استفاده وقتی پیکربندی مسیر را حذف کرده است.                                  |
| `allowed`    | خیر       | `string[]` | در صورت حضور، سیگنال فقط وقتی عبور می‌کند که حالت مؤثر یکی از این مقدارها باشد. |
| `disallowed` | خیر       | `string[]` | در صورت حضور، سیگنال وقتی شکست می‌خورد که حالت مؤثر یکی از این مقدارها باشد.       |

هر ورودی `authSignals` از موارد زیر پشتیبانی می‌کند:

| فیلد             | الزامی | نوع     | معنی آن                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | بله      | `string` | شناسه ارائه‌دهنده برای بررسی در پروفایل‌های احراز هویت پیکربندی‌شده.                                                                                                                             |
| `providerBaseUrl` | خیر       | `object` | نگهبان اختیاری که باعث می‌شود سیگنال فقط وقتی حساب شود که ارائه‌دهنده پیکربندی‌شده ارجاع‌داده‌شده از یک URL پایه مجاز استفاده کند. وقتی یک نام مستعار احراز هویت فقط برای APIهای خاص معتبر است، از این استفاده کنید. |

هر نگهبان `providerBaseUrl` از موارد زیر پشتیبانی می‌کند:

| فیلد             | الزامی | نوع       | معنی آن                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | بله      | `string`   | شناسه پیکربندی ارائه‌دهنده که `baseUrl` آن باید بررسی شود.                                                                                                |
| `defaultBaseUrl`  | خیر       | `string`   | URL پایه‌ای که وقتی پیکربندی ارائه‌دهنده `baseUrl` را حذف کرده است باید فرض شود.                                                                                         |
| `allowedBaseUrls` | بله      | `string[]` | URLهای پایه مجاز برای این سیگنال احراز هویت. وقتی URL پایه پیکربندی‌شده یا پیش‌فرض با یکی از این مقدارهای نرمال‌شده مطابقت نداشته باشد، سیگنال نادیده گرفته می‌شود. |

## مرجع فراداده ابزار

`toolMetadata` از همان شکل‌های `configSignals` و `authSignals` مانند
فراداده ارائه‌دهنده تولید استفاده می‌کند، با کلیدگذاری بر اساس نام ابزار. `contracts.tools`
مالکیت را اعلام می‌کند. `toolMetadata` شواهد ارزانِ در دسترس بودن را اعلام می‌کند تا OpenClaw بتواند
از وارد کردن زمان اجرای Plugin فقط برای اینکه کارخانه ابزار آن `null` برگرداند، پرهیز کند.

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
وقتی قرارداد ابزار با خط‌مشی مطابقت دارد، Plugin مالک را بارگذاری می‌کند. برای ابزارهای مسیر داغ
که کارخانه آن‌ها به احراز هویت/پیکربندی وابسته است، نویسندگان Plugin باید به‌جای اینکه هسته را وادار کنند زمان اجرا را برای پرس‌وجو وارد کند، `toolMetadata` اعلام کنند.

## مرجع providerAuthChoices

هر ورودی `providerAuthChoices` یک گزینه راه‌اندازی اولیه یا احراز هویت را توصیف می‌کند.
OpenClaw این را پیش از بارگذاری زمان اجرای ارائه‌دهنده می‌خواند.
فهرست‌های راه‌اندازی ارائه‌دهنده از این گزینه‌های مانیفست، گزینه‌های راه‌اندازی مشتق‌شده از توصیفگر،
و فراداده کاتالوگ نصب بدون بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌کنند.

| فیلد                 | الزامی | نوع                                            | معنی آن                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | بله      | `string`                                        | شناسه ارائه‌دهنده‌ای که این گزینه به آن تعلق دارد.                                                                      |
| `method`              | بله      | `string`                                        | شناسه روش احراز هویت برای ارسال به آن.                                                                           |
| `choiceId`            | بله      | `string`                                        | شناسه پایدار گزینه احراز هویت که توسط جریان‌های راه‌اندازی اولیه و CLI استفاده می‌شود.                                                  |
| `choiceLabel`         | خیر       | `string`                                        | برچسب قابل مشاهده برای کاربر. اگر حذف شود، OpenClaw به `choiceId` برمی‌گردد.                                        |
| `choiceHint`          | خیر       | `string`                                        | متن راهنمای کوتاه برای انتخابگر.                                                                        |
| `assistantPriority`   | خیر       | `number`                                        | مقدارهای کمتر در انتخابگرهای تعاملی هدایت‌شده توسط دستیار زودتر مرتب می‌شوند.                                       |
| `assistantVisibility` | خیر       | `"visible"` \| `"manual-only"`                  | گزینه را از انتخابگرهای دستیار پنهان می‌کند، در حالی که همچنان انتخاب دستی CLI را مجاز نگه می‌دارد.                        |
| `deprecatedChoiceIds` | خیر       | `string[]`                                      | شناسه‌های قدیمی گزینه که باید کاربران را به این گزینه جایگزین هدایت کنند.                                 |
| `groupId`             | خیر       | `string`                                        | شناسه گروه اختیاری برای گروه‌بندی گزینه‌های مرتبط.                                                          |
| `groupLabel`          | خیر       | `string`                                        | برچسب قابل مشاهده برای کاربر برای آن گروه.                                                                        |
| `groupHint`           | خیر       | `string`                                        | متن راهنمای کوتاه برای گروه.                                                                         |
| `optionKey`           | خیر       | `string`                                        | کلید گزینه داخلی برای جریان‌های ساده احراز هویت تک‌پرچمی.                                                      |
| `cliFlag`             | خیر       | `string`                                        | نام پرچم CLI، مانند `--openrouter-api-key`.                                                           |
| `cliOption`           | خیر       | `string`                                        | شکل کامل گزینه CLI، مانند `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | خیر       | `string`                                        | توضیحی که در راهنمای CLI استفاده می‌شود.                                                                            |
| `onboardingScopes`    | خیر       | `Array<"text-inference" \| "image-generation">` | اینکه این گزینه باید در کدام سطوح راه‌اندازی اولیه ظاهر شود. اگر حذف شود، مقدار پیش‌فرض آن `["text-inference"]` است. |

## مرجع commandAliases

از `commandAliases` زمانی استفاده کنید که یک Plugin مالک نام یک فرمان runtime است که کاربران ممکن است
به‌اشتباه در `plugins.allow` قرار دهند یا تلاش کنند آن را به‌عنوان یک فرمان ریشه CLI اجرا کنند. OpenClaw
از این فراداده برای عیب‌یابی استفاده می‌کند، بدون اینکه کد runtime مربوط به Plugin را import کند.

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

| فیلد         | الزامی | نوع               | معنی آن                                                                 |
| ------------ | ------ | ----------------- | ----------------------------------------------------------------------- |
| `name`       | بله    | `string`          | نام فرمانی که به این Plugin تعلق دارد.                                  |
| `kind`       | خیر    | `"runtime-slash"` | alias را به‌عنوان یک فرمان slash در چت، نه یک فرمان ریشه CLI، علامت‌گذاری می‌کند. |
| `cliCommand` | خیر    | `string`          | فرمان ریشه CLI مرتبط برای پیشنهاد در عملیات CLI، اگر وجود داشته باشد.  |

## مرجع activation

از `activation` زمانی استفاده کنید که Plugin بتواند با هزینه کم اعلام کند کدام رویدادهای control-plane
باید آن را در یک برنامه activation/load بگنجانند.

این بلوک فراداده برنامه‌ریز است، نه یک API چرخه عمر. رفتار runtime را ثبت نمی‌کند،
جایگزین `register(...)` نمی‌شود، و وعده نمی‌دهد که کد Plugin از قبل اجرا شده است.
برنامه‌ریز activation از این فیلدها برای محدود کردن Pluginهای نامزد پیش از بازگشت به فراداده مالکیت موجود در manifest
مانند `providers`، `channels`، `commandAliases`، `setup.providers`،
`contracts.tools` و hookها استفاده می‌کند.

باریک‌ترین فراداده‌ای را ترجیح دهید که از قبل مالکیت را توصیف می‌کند. وقتی این فیلدها رابطه را بیان می‌کنند، از
`providers`، `channels`، `commandAliases`، توصیف‌گرهای setup یا `contracts`
استفاده کنید. از `activation` برای راهنمایی‌های اضافی برنامه‌ریز استفاده کنید
که با آن فیلدهای مالکیت قابل نمایش نیستند.
برای aliasهای runtime مربوط به CLI مانند `claude-cli`،
`codex-cli` یا `google-gemini-cli` از `cliBackends` سطح بالا استفاده کنید؛ `activation.onAgentHarnesses` فقط برای
شناسه‌های embedded agent harness است که از قبل فیلد مالکیت ندارند.

این بلوک فقط فراداده است. رفتار runtime را ثبت نمی‌کند، و جایگزین
`register(...)`، `setupEntry` یا entrypointهای دیگر runtime/Plugin نمی‌شود.
مصرف‌کنندگان فعلی از آن به‌عنوان راهنمای محدودسازی پیش از بارگذاری گسترده‌تر Plugin استفاده می‌کنند، بنابراین
نبود فراداده activation غیر-startup معمولاً فقط هزینه عملکردی دارد؛ تا زمانی که fallbackهای مالکیت manifest همچنان وجود دارند،
نباید در درستی رفتار تغییری ایجاد کند.

هر Plugin باید `activation.onStartup` را آگاهانه تنظیم کند. آن را فقط زمانی روی `true`
بگذارید که Plugin باید هنگام راه‌اندازی Gateway اجرا شود. زمانی آن را روی `false` بگذارید که
Plugin هنگام startup غیرفعال است و باید فقط از triggerهای باریک‌تر بارگذاری شود.
حذف `onStartup` دیگر به‌طور ضمنی Plugin را در startup بارگذاری نمی‌کند؛ برای startup، channel، config، agent-harness، memory یا
triggerهای activation باریک‌تر دیگر از فراداده activation صریح استفاده کنید.

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

| فیلد               | الزامی | نوع                                                  | معنی آن                                                                                                                                                                                        |
| ------------------ | ------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | خیر    | `boolean`                                            | activation صریح هنگام startup در Gateway. هر Plugin باید این را تنظیم کند. `true` هنگام startup، Plugin را import می‌کند؛ `false` آن را startup-lazy نگه می‌دارد مگر اینکه trigger منطبق دیگری نیازمند بارگذاری باشد. |
| `onProviders`      | خیر    | `string[]`                                           | شناسه‌های provider که باید این Plugin را در برنامه‌های activation/load بگنجانند.                                                                                                              |
| `onAgentHarnesses` | خیر    | `string[]`                                           | شناسه‌های runtime مربوط به embedded agent harness که باید این Plugin را در برنامه‌های activation/load بگنجانند. برای aliasهای backend مربوط به CLI از `cliBackends` سطح بالا استفاده کنید.       |
| `onCommands`       | خیر    | `string[]`                                           | شناسه‌های فرمان که باید این Plugin را در برنامه‌های activation/load بگنجانند.                                                                                                                 |
| `onChannels`       | خیر    | `string[]`                                           | شناسه‌های channel که باید این Plugin را در برنامه‌های activation/load بگنجانند.                                                                                                                |
| `onRoutes`         | خیر    | `string[]`                                           | گونه‌های route که باید این Plugin را در برنامه‌های activation/load بگنجانند.                                                                                                                  |
| `onConfigPaths`    | خیر    | `string[]`                                           | مسیرهای config نسبی به ریشه که وقتی مسیر موجود است و به‌طور صریح غیرفعال نشده، باید این Plugin را در برنامه‌های startup/load بگنجانند.                                                       |
| `onCapabilities`   | خیر    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | راهنمایی‌های گسترده capability که توسط برنامه‌ریزی activation در control-plane استفاده می‌شوند. هرجا ممکن است فیلدهای باریک‌تر را ترجیح دهید.                                                |

مصرف‌کنندگان زنده فعلی:

- برنامه‌ریزی startup در Gateway از `activation.onStartup` برای import صریح در startup استفاده می‌کند
- برنامه‌ریزی CLI که با فرمان trigger شده، به `commandAliases[].cliCommand` یا `commandAliases[].name` قدیمی fallback می‌کند
- برنامه‌ریزی startup مربوط به agent-runtime از `activation.onAgentHarnesses` برای harnessهای embedded و از `cliBackends[]` سطح بالا برای aliasهای runtime مربوط به CLI استفاده می‌کند
- برنامه‌ریزی setup/channel که با channel trigger شده، وقتی فراداده activation صریح channel وجود ندارد به مالکیت قدیمی `channels[]` fallback می‌کند
- برنامه‌ریزی Plugin در startup از `activation.onConfigPaths` برای سطح‌های config ریشه غیر-channel، مانند بلوک `browser` در Plugin مرورگر bundled، استفاده می‌کند
- برنامه‌ریزی setup/runtime که با provider trigger شده، وقتی فراداده activation صریح provider وجود ندارد به مالکیت قدیمی `providers[]` و `cliBackends[]` سطح بالا fallback می‌کند

عیب‌یابی‌های برنامه‌ریز می‌توانند راهنمایی‌های activation صریح را از fallback مالکیت manifest
تشخیص دهند. برای مثال، `activation-command-hint` یعنی
`activation.onCommands` منطبق شده است، درحالی‌که `manifest-command-alias` یعنی
برنامه‌ریز به‌جای آن از مالکیت `commandAliases` استفاده کرده است. این برچسب‌های دلیل برای
عیب‌یابی‌ها و آزمون‌های host هستند؛ نویسندگان Plugin باید همچنان فراداده‌ای را اعلام کنند
که مالکیت را به بهترین شکل توصیف می‌کند.

## مرجع qaRunners

از `qaRunners` زمانی استفاده کنید که یک Plugin یک یا چند transport runner در زیر
ریشه مشترک `openclaw qa` اضافه می‌کند. این فراداده را ارزان و ایستا نگه دارید؛ runtime مربوط به Plugin
همچنان مالک ثبت واقعی CLI از طریق یک سطح سبک
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

| فیلد          | الزامی | نوع      | معنی آن                                                              |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| `commandName` | بله    | `string` | subcommand که در زیر `openclaw qa` mount می‌شود، برای مثال `matrix`. |
| `description` | خیر    | `string` | متن راهنمای fallback که وقتی host مشترک به یک فرمان stub نیاز دارد استفاده می‌شود. |

## مرجع setup

از `setup` زمانی استفاده کنید که سطح‌های setup و onboarding پیش از بارگذاری runtime
به فراداده ارزان متعلق به Plugin نیاز دارند.

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

`cliBackends` سطح بالا معتبر می‌ماند و همچنان backendهای استنتاج CLI را توصیف می‌کند.
`setup.cliBackends` سطح توصیف‌گر مختص setup برای
جریان‌های control-plane/setup است که باید فقط فراداده بمانند.

وقتی وجود داشته باشند، `setup.providers` و `setup.cliBackends` سطح lookup ترجیحی
descriptor-first برای کشف setup هستند. اگر توصیف‌گر فقط
Plugin نامزد را محدود می‌کند و setup همچنان به hookهای runtime غنی‌تر در زمان setup نیاز دارد،
`requiresRuntime: true` را تنظیم کنید و `setup-api` را به‌عنوان مسیر اجرای fallback
در جای خود نگه دارید.

OpenClaw همچنین `setup.providers[].envVars` را در lookupهای عمومی auth و
env-var مربوط به provider وارد می‌کند. `providerAuthEnvVars` در بازه deprecation همچنان از طریق یک adapter سازگاری
پشتیبانی می‌شود، اما Pluginهای غیر-bundled که هنوز از آن استفاده می‌کنند
یک عیب‌یابی manifest دریافت می‌کنند. Pluginهای جدید باید فراداده env مربوط به setup/status را
روی `setup.providers[].envVars` قرار دهند.

OpenClaw همچنین می‌تواند انتخاب‌های ساده setup را از `setup.providers[].authMethods`
زمانی استخراج کند که هیچ entry مربوط به setup موجود نیست، یا زمانی که `setup.requiresRuntime: false`
اعلام می‌کند runtime مربوط به setup لازم نیست. entryهای صریح `providerAuthChoices` برای
برچسب‌های سفارشی، flagهای CLI، دامنه onboarding و فراداده assistant همچنان ترجیح داده می‌شوند.

`requiresRuntime: false` را فقط زمانی تنظیم کنید که آن توصیف‌گرها برای سطح setup کافی باشند.
OpenClaw مقدار صریح `false` را به‌عنوان یک قرارداد descriptor-only در نظر می‌گیرد
و برای lookup مربوط به setup، `setup-api` یا `openclaw.setupEntry` را اجرا نخواهد کرد. اگر
یک Plugin descriptor-only همچنان یکی از آن entryهای runtime مربوط به setup را همراه خود داشته باشد،
OpenClaw یک عیب‌یابی افزوده گزارش می‌کند و همچنان آن را نادیده می‌گیرد. حذف
`requiresRuntime` رفتار fallback قدیمی را حفظ می‌کند تا Pluginهای موجود که توصیف‌گرها را بدون آن flag اضافه کرده‌اند
خراب نشوند.

از آنجا که lookup مربوط به setup می‌تواند کد `setup-api` متعلق به Plugin را اجرا کند، مقادیر normalize‌شده
`setup.providers[].id` و `setup.cliBackends[]` باید در میان
Pluginهای کشف‌شده یکتا بمانند. مالکیت مبهم به‌جای انتخاب یک
برنده از ترتیب کشف، fail-closed می‌شود.

وقتی runtime مربوط به setup اجرا می‌شود، عیب‌یابی‌های registry مربوط به setup در صورتی drift توصیف‌گر را گزارش می‌کنند
که `setup-api` یک provider یا backend مربوط به CLI را ثبت کند که توصیف‌گرهای manifest
اعلام نکرده‌اند، یا اگر یک توصیف‌گر هیچ registration منطبق در runtime نداشته باشد.
این عیب‌یابی‌ها افزوده هستند و Pluginهای قدیمی را رد نمی‌کنند.

### مرجع setup.providers

| فیلد           | الزامی | نوع        | معنی آن                                                                                             |
| -------------- | ------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `id`           | بله    | `string`   | شناسه provider که هنگام setup یا onboarding ارائه می‌شود. شناسه‌های normalize‌شده را به‌صورت سراسری یکتا نگه دارید. |
| `authMethods`  | خیر    | `string[]` | شناسه‌های روش setup/auth که این provider بدون بارگذاری runtime کامل پشتیبانی می‌کند.               |
| `envVars`      | خیر    | `string[]` | env varهایی که سطح‌های عمومی setup/status می‌توانند پیش از بارگذاری runtime مربوط به Plugin بررسی کنند. |
| `authEvidence` | خیر    | `object[]` | بررسی‌های ارزان شواهد auth محلی برای providerهایی که می‌توانند از طریق markerهای غیرمحرمانه احراز هویت کنند. |

`authEvidence` برای نشانگرهای محلی اعتبارنامه با مالکیت ارائه‌دهنده است که می‌توان آن‌ها را
بدون بارگذاری کد زمان اجرا تأیید کرد. این بررسی‌ها باید کم‌هزینه و محلی بمانند:
بدون فراخوانی شبکه، بدون خواندن keychain یا secret-manager، بدون فرمان shell، و بدون
بررسی‌های API ارائه‌دهنده.

ورودی‌های شواهد پشتیبانی‌شده:

| فیلد              | ضروری | نوع        | معنی آن                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | بله      | `string`   | در حال حاضر `local-file-with-env`.                                                                               |
| `fileEnvVar`       | خیر       | `string`   | متغیر محیطی شامل مسیر صریح فایل اعتبارنامه.                                                           |
| `fallbackPaths`    | خیر       | `string[]` | مسیرهای فایل اعتبارنامه محلی که وقتی `fileEnvVar` وجود ندارد یا خالی است بررسی می‌شوند. از `${HOME}` و `${APPDATA}` پشتیبانی می‌کند. |
| `requiresAnyEnv`   | خیر       | `string[]` | دست‌کم یکی از متغیرهای محیطی فهرست‌شده باید پیش از معتبر شدن شواهد، غیرخالی باشد.                                    |
| `requiresAllEnv`   | خیر       | `string[]` | همه متغیرهای محیطی فهرست‌شده باید پیش از معتبر شدن شواهد، غیرخالی باشند.                                           |
| `credentialMarker` | بله      | `string`   | نشانگر غیرمحرمانه‌ای که هنگام وجود شواهد برگردانده می‌شود.                                                       |
| `source`           | خیر       | `string`   | برچسب منبع کاربرنما برای خروجی احراز هویت/وضعیت.                                                               |

### فیلدهای setup

| فیلد              | ضروری | نوع        | معنی آن                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | خیر       | `object[]` | توصیفگرهای راه‌اندازی ارائه‌دهنده که هنگام راه‌اندازی و شروع به کار در دسترس قرار می‌گیرند.                                     |
| `cliBackends`      | خیر       | `string[]` | شناسه‌های backend زمان راه‌اندازی که برای جستجوی راه‌اندازی descriptor-first استفاده می‌شوند. شناسه‌های نرمال‌شده را در سطح سراسری یکتا نگه دارید. |
| `configMigrations` | خیر       | `string[]` | شناسه‌های مهاجرت پیکربندی که سطح راه‌اندازی این Plugin مالک آن‌هاست.                                          |
| `requiresRuntime`  | خیر       | `boolean`  | اینکه آیا راه‌اندازی پس از جستجوی توصیفگر همچنان به اجرای `setup-api` نیاز دارد یا نه.                            |

## مرجع uiHints

`uiHints` نگاشتی از نام فیلدهای پیکربندی به راهنماهای کوچک رندر است.

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

| فیلد         | نوع        | معنی آن                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | برچسب فیلد کاربرنما.                |
| `help`        | `string`   | متن راهنمای کوتاه.                      |
| `tags`        | `string[]` | برچسب‌های اختیاری UI.                       |
| `advanced`    | `boolean`  | فیلد را به‌عنوان پیشرفته علامت‌گذاری می‌کند.            |
| `sensitive`   | `boolean`  | فیلد را به‌عنوان محرمانه یا حساس علامت‌گذاری می‌کند. |
| `placeholder` | `string`   | متن placeholder برای ورودی‌های فرم.       |

## مرجع contracts

از `contracts` فقط برای فراداده مالکیت قابلیت ایستا استفاده کنید که OpenClaw بتواند
بدون وارد کردن زمان اجرای Plugin آن را بخواند.

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

| فیلد                             | نوع        | معنی آن                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | شناسه‌های کارخانه extension سرور برنامه Codex، در حال حاضر `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | شناسه‌های زمان اجرایی که یک Plugin همراه ممکن است middleware نتیجه ابزار را برای آن‌ها ثبت کند. |
| `externalAuthProviders`          | `string[]` | شناسه‌های ارائه‌دهنده‌ای که این Plugin مالک hook پروفایل احراز هویت خارجی آن‌هاست.       |
| `speechProviders`                | `string[]` | شناسه‌های ارائه‌دهنده گفتاری که این Plugin مالک آن‌هاست.                                 |
| `realtimeTranscriptionProviders` | `string[]` | شناسه‌های ارائه‌دهنده رونویسی بلادرنگ که این Plugin مالک آن‌هاست.                 |
| `realtimeVoiceProviders`         | `string[]` | شناسه‌های ارائه‌دهنده صدای بلادرنگ که این Plugin مالک آن‌هاست.                         |
| `memoryEmbeddingProviders`       | `string[]` | شناسه‌های ارائه‌دهنده embedding حافظه که این Plugin مالک آن‌هاست.                       |
| `mediaUnderstandingProviders`    | `string[]` | شناسه‌های ارائه‌دهنده درک رسانه که این Plugin مالک آن‌هاست.                    |
| `imageGenerationProviders`       | `string[]` | شناسه‌های ارائه‌دهنده تولید تصویر که این Plugin مالک آن‌هاست.                       |
| `videoGenerationProviders`       | `string[]` | شناسه‌های ارائه‌دهنده تولید ویدئو که این Plugin مالک آن‌هاست.                       |
| `webFetchProviders`              | `string[]` | شناسه‌های ارائه‌دهنده fetch وب که این Plugin مالک آن‌هاست.                              |
| `webSearchProviders`             | `string[]` | شناسه‌های ارائه‌دهنده جستجوی وب که این Plugin مالک آن‌هاست.                             |
| `migrationProviders`             | `string[]` | شناسه‌های ارائه‌دهنده import که این Plugin برای `openclaw migrate` مالک آن‌هاست.          |
| `tools`                          | `string[]` | نام‌های ابزار Agent که این Plugin مالک آن‌هاست.                                    |

`contracts.embeddedExtensionFactories` برای کارخانه‌های extension همراهِ فقط مخصوص سرور برنامه Codex
حفظ شده است. تبدیل‌های همراه نتیجه ابزار باید
`contracts.agentToolResultMiddleware` را اعلام کنند و در عوض با
`api.registerAgentToolResultMiddleware(...)` ثبت شوند. Pluginهای خارجی نمی‌توانند
middleware نتیجه ابزار را ثبت کنند، چون این seam می‌تواند خروجی ابزار با اعتماد بالا را
پیش از آنکه مدل آن را ببیند بازنویسی کند.

ثبت‌های زمان اجرای `api.registerTool(...)` باید با `contracts.tools` مطابقت داشته باشند.
کشف ابزار از این فهرست استفاده می‌کند تا فقط زمان‌های اجرای Pluginهایی را بارگذاری کند که می‌توانند مالک
ابزارهای درخواست‌شده باشند.

Pluginهای ارائه‌دهنده‌ای که `resolveExternalAuthProfiles` را پیاده‌سازی می‌کنند باید
`contracts.externalAuthProviders` را اعلام کنند. Pluginهای بدون این اعلام همچنان
از یک fallback سازگاری منسوخ عبور می‌کنند، اما آن fallback کندتر است و
پس از پنجره مهاجرت حذف خواهد شد.

ارائه‌دهندگان embedding حافظه همراه باید
`contracts.memoryEmbeddingProviders` را برای هر شناسه adapter که ارائه می‌کنند اعلام کنند، از جمله
adapterهای داخلی مانند `local`. مسیرهای مستقل CLI از این قرارداد مانیفست
استفاده می‌کنند تا پیش از اینکه زمان اجرای کامل Gateway ارائه‌دهندگان را
ثبت کرده باشد، فقط Plugin مالک را بارگذاری کنند.

## مرجع mediaUnderstandingProviderMetadata

وقتی یک ارائه‌دهنده درک رسانه مدل‌های پیش‌فرض، اولویت fallback احراز هویت خودکار، یا پشتیبانی سند بومی دارد که
helperهای عمومی core پیش از بارگذاری زمان اجرا به آن نیاز دارند، از `mediaUnderstandingProviderMetadata` استفاده کنید.
کلیدها باید در `contracts.mediaUnderstandingProviders` نیز اعلام شده باشند.

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

| فیلد                   | نوع                                 | معنی آن                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قابلیت‌های رسانه‌ای که این ارائه‌دهنده ارائه می‌کند.                                 |
| `defaultModels`        | `Record<string, string>`            | پیش‌فرض‌های نگاشت قابلیت به مدل که وقتی پیکربندی مدلی مشخص نکرده باشد استفاده می‌شوند.      |
| `autoPriority`         | `Record<string, number>`            | اعداد کمتر برای fallback خودکار ارائه‌دهنده مبتنی بر اعتبارنامه زودتر مرتب می‌شوند. |
| `nativeDocumentInputs` | `"pdf"[]`                           | ورودی‌های سند بومی که ارائه‌دهنده از آن‌ها پشتیبانی می‌کند.                            |

## مرجع channelConfigs

وقتی یک Plugin کانال پیش از بارگذاری زمان اجرا به فراداده پیکربندی کم‌هزینه نیاز دارد، از `channelConfigs` استفاده کنید.
کشف read-only راه‌اندازی/وضعیت کانال می‌تواند از این فراداده
مستقیماً برای کانال‌های خارجی پیکربندی‌شده استفاده کند، وقتی هیچ ورودی راه‌اندازی در دسترس نیست، یا
وقتی `setup.requiresRuntime: false` اعلام می‌کند زمان اجرای راه‌اندازی ضروری نیست.

`channelConfigs` فراداده مانیفست Plugin است، نه یک بخش جدید پیکربندی کاربر در سطح بالا.
کاربران همچنان نمونه‌های کانال را زیر `channels.<channel-id>` پیکربندی می‌کنند.
OpenClaw فراداده مانیفست را می‌خواند تا پیش از اجرای کد زمان اجرای Plugin تصمیم بگیرد کدام Plugin مالک آن کانال
پیکربندی‌شده است.

برای یک Plugin کانال، `configSchema` و `channelConfigs` مسیرهای متفاوتی را توصیف می‌کنند:

- `configSchema` مقدار `plugins.entries.<plugin-id>.config` را اعتبارسنجی می‌کند
- `channelConfigs.<channel-id>.schema` مقدار `channels.<channel-id>` را اعتبارسنجی می‌کند

Pluginهای غیرهمراه که `channels[]` را اعلام می‌کنند باید ورودی‌های منطبق
`channelConfigs` را نیز اعلام کنند. بدون آن‌ها، OpenClaw همچنان می‌تواند Plugin را بارگذاری کند، اما
schema پیکربندی cold-path، راه‌اندازی، و سطوح Control UI نمی‌توانند تا زمان اجرای زمان اجرای Plugin، شکل گزینه‌های
متعلق به کانال را بدانند.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و
`nativeSkillsAutoEnabled` می‌توانند پیش‌فرض‌های ایستای `auto` را برای بررسی‌های پیکربندی فرمان
اعلام کنند که پیش از بارگذاری زمان اجرای کانال اجرا می‌شوند. کانال‌های همراه همچنین می‌توانند
همین پیش‌فرض‌ها را از طریق `package.json#openclaw.channel.commands` در کنار
دیگر فراداده catalog کانال متعلق به package خود منتشر کنند.

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

| فیلد         | نوع                     | معنی آن                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema برای `channels.<id>`. برای هر ورودی پیکربندی کانال اعلام‌شده الزامی است.         |
| `uiHints`     | `Record<string, object>` | برچسب‌ها/جای‌نگهدارها/راهنماهای حساس اختیاری UI برای آن بخش پیکربندی کانال.          |
| `label`       | `string`                 | برچسب کانالی که وقتی فراداده زمان اجرا آماده نیست، در سطح‌های انتخابگر و بررسی ادغام می‌شود. |
| `description` | `string`                 | توضیح کوتاه کانال برای سطح‌های بررسی و کاتالوگ.                               |
| `commands`    | `object`                 | دستور native ایستا و پیش‌فرض‌های خودکار native skill برای بررسی‌های پیکربندی پیش از زمان اجرا.       |
| `preferOver`  | `string[]`               | شناسه‌های Plugin قدیمی یا کم‌اولویت‌تری که این کانال باید در سطح‌های انتخاب از آن‌ها بالاتر باشد.    |

### جایگزینی یک Plugin کانال دیگر

وقتی Plugin شما مالک ترجیحی برای شناسه کانالی است که
یک Plugin دیگر نیز می‌تواند ارائه کند، از `preferOver` استفاده کنید. موارد رایج شامل شناسه Plugin تغییرنام‌یافته،
Plugin مستقل که جایگزین یک Plugin بسته‌بندی‌شده می‌شود، یا فورک نگهداری‌شده‌ای است که
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
بسته‌بندی‌شده است یا به طور پیش‌فرض فعال است، OpenClaw آن را در پیکربندی مؤثر
زمان اجرا غیرفعال می‌کند تا یک Plugin مالک کانال و ابزارهای آن باشد. انتخاب صریح کاربر
همچنان اولویت دارد: اگر کاربر هر دو Plugin را صریحاً فعال کند، OpenClaw
آن انتخاب را حفظ می‌کند و به‌جای تغییر بی‌صدای مجموعه Pluginهای درخواست‌شده،
تشخیص‌های کانال/ابزار تکراری را گزارش می‌دهد.

`preferOver` را به شناسه‌های Plugin محدود کنید که واقعاً می‌توانند همان کانال را ارائه کنند.
این یک فیلد اولویت عمومی نیست و کلیدهای پیکربندی کاربر را تغییرنام نمی‌دهد.

## مرجع modelSupport

وقتی OpenClaw باید Plugin ارائه‌دهنده شما را پیش از بارگذاری زمان اجرای Plugin
از شناسه‌های کوتاه مدل مانند `gpt-5.5` یا `claude-sonnet-4.6` استنباط کند، از `modelSupport` استفاده کنید.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw این ترتیب تقدم را اعمال می‌کند:

- ارجاع‌های صریح `provider/model` از فراداده مانیفست مالک `providers` استفاده می‌کنند
- `modelPatterns` بر `modelPrefixes` مقدم است
- اگر یک Plugin غیر بسته‌بندی‌شده و یک Plugin بسته‌بندی‌شده هر دو مطابق باشند، Plugin غیر بسته‌بندی‌شده
  برنده می‌شود
- ابهام باقی‌مانده تا زمانی که کاربر یا پیکربندی یک ارائه‌دهنده را مشخص کند نادیده گرفته می‌شود

فیلدها:

| فیلد           | نوع       | معنی آن                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | پیشوندهایی که با `startsWith` در برابر شناسه‌های کوتاه مدل تطبیق داده می‌شوند.                 |
| `modelPatterns` | `string[]` | منابع Regex که پس از حذف پسوند پروفایل در برابر شناسه‌های کوتاه مدل تطبیق داده می‌شوند. |

## مرجع modelCatalog

وقتی OpenClaw باید پیش از بارگذاری زمان اجرای Plugin، فراداده مدل ارائه‌دهنده را بداند، از `modelCatalog` استفاده کنید. این منبع مالکیت‌شده توسط مانیفست برای ردیف‌های کاتالوگ ثابت،
نام‌های مستعار ارائه‌دهنده، قواعد سرکوب، و حالت کشف است. تازه‌سازی زمان اجرا
همچنان به کد زمان اجرای ارائه‌دهنده تعلق دارد، اما مانیفست به core می‌گوید چه زمانی زمان اجرا
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
| `providers`    | `Record<string, object>`                                 | ردیف‌های کاتالوگ برای شناسه‌های ارائه‌دهنده‌ای که مالکشان این Plugin است. کلیدها باید در `providers` سطح بالا نیز ظاهر شوند.       |
| `aliases`      | `Record<string, object>`                                 | نام‌های مستعار ارائه‌دهنده که باید برای برنامه‌ریزی کاتالوگ یا سرکوب به یک ارائه‌دهنده مالکیت‌شده resolve شوند.              |
| `suppressions` | `object[]`                                               | ردیف‌های مدل از منبعی دیگر که این Plugin به دلیلی مختص ارائه‌دهنده سرکوب می‌کند.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | اینکه کاتالوگ ارائه‌دهنده می‌تواند از فراداده مانیفست خوانده شود، در cache تازه‌سازی شود، یا به زمان اجرا نیاز دارد. |

`aliases` در جست‌وجوی مالکیت ارائه‌دهنده برای برنامه‌ریزی model-catalog مشارکت می‌کند.
هدف‌های نام مستعار باید ارائه‌دهنده‌های سطح بالایی باشند که مالکشان همان Plugin است. وقتی یک
فهرست فیلترشده بر اساس ارائه‌دهنده از نام مستعار استفاده می‌کند، OpenClaw می‌تواند مانیفست مالک را بخواند و
overrideهای API/base URL نام مستعار را بدون بارگذاری زمان اجرای ارائه‌دهنده اعمال کند.
نام‌های مستعار فهرست‌های کاتالوگ بدون فیلتر را گسترش نمی‌دهند؛ فهرست‌های گسترده فقط
ردیف‌های ارائه‌دهنده canonical مالک را منتشر می‌کنند.

`suppressions` جایگزین hook قدیمی زمان اجرای ارائه‌دهنده `suppressBuiltInModel` می‌شود.
ورودی‌های سرکوب فقط زمانی رعایت می‌شوند که مالک ارائه‌دهنده Plugin باشد یا
به‌عنوان کلید `modelCatalog.aliases` اعلام شده باشد که به یک ارائه‌دهنده مالکیت‌شده اشاره می‌کند. hookهای
سرکوب زمان اجرا دیگر هنگام resolve مدل فراخوانی نمی‌شوند.

فیلدهای ارائه‌دهنده:

| فیلد     | نوع                     | معنی آن                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | base URL پیش‌فرض اختیاری برای مدل‌ها در این کاتالوگ ارائه‌دهنده.    |
| `api`     | `ModelApi`               | آداپتور API پیش‌فرض اختیاری برای مدل‌ها در این کاتالوگ ارائه‌دهنده. |
| `headers` | `Record<string, string>` | headerهای ایستای اختیاری که برای این کاتالوگ ارائه‌دهنده اعمال می‌شوند.      |
| `models`  | `object[]`               | ردیف‌های مدل الزامی. ردیف‌های بدون `id` نادیده گرفته می‌شوند.            |

فیلدهای مدل:

| فیلد           | نوع                                                           | معنی آن                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | شناسه مدل محلیِ ارائه‌دهنده، بدون پیشوند `provider/`.                    |
| `name`          | `string`                                                       | نام نمایشی اختیاری.                                                      |
| `api`           | `ModelApi`                                                     | override اختیاری API برای هر مدل.                                            |
| `baseUrl`       | `string`                                                       | override اختیاری base URL برای هر مدل.                                       |
| `headers`       | `Record<string, string>`                                       | headerهای ایستای اختیاری برای هر مدل.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | حالت‌هایی که مدل می‌پذیرد.                                               |
| `reasoning`     | `boolean`                                                      | اینکه آیا مدل رفتار reasoning را ارائه می‌کند یا نه.                               |
| `contextWindow` | `number`                                                       | پنجره زمینه native ارائه‌دهنده.                                             |
| `contextTokens` | `number`                                                       | سقف اختیاری زمینه مؤثر زمان اجرا وقتی با `contextWindow` متفاوت باشد. |
| `maxTokens`     | `number`                                                       | حداکثر توکن‌های خروجی وقتی معلوم باشد.                                           |
| `cost`          | `object`                                                       | قیمت‌گذاری اختیاری USD به ازای هر میلیون توکن، شامل `tieredPricing` اختیاری. |
| `compat`        | `object`                                                       | پرچم‌های سازگاری اختیاری مطابق با سازگاری پیکربندی مدل OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | وضعیت فهرست. فقط زمانی سرکوب کنید که ردیف اصلاً نباید ظاهر شود.          |
| `statusReason`  | `string`                                                       | دلیل اختیاری که همراه با وضعیت غیر available نشان داده می‌شود.                            |
| `replaces`      | `string[]`                                                     | شناسه‌های مدل محلیِ قدیمی‌تر ارائه‌دهنده که این مدل جایگزینشان می‌شود.                       |
| `replacedBy`    | `string`                                                       | شناسه مدل محلیِ جایگزین ارائه‌دهنده برای ردیف‌های منسوخ.                    |
| `tags`          | `string[]`                                                     | برچسب‌های پایدار که انتخابگرها و فیلترها استفاده می‌کنند.                                    |

فیلدهای سرکوب:

| فیلد                      | نوع       | معنی آن                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | شناسه ارائه‌دهنده برای ردیف upstream که باید سرکوب شود. باید مالکیت آن با این Plugin باشد یا به‌عنوان نام مستعار مالکیت‌شده اعلام شده باشد. |
| `model`                    | `string`   | شناسه مدل محلیِ ارائه‌دهنده که باید سرکوب شود.                                                                      |
| `reason`                   | `string`   | پیام اختیاری که وقتی ردیف سرکوب‌شده مستقیماً درخواست می‌شود نشان داده می‌شود.                                     |
| `when.baseUrlHosts`        | `string[]` | فهرست اختیاری hostهای base URL مؤثر ارائه‌دهنده که پیش از اعمال سرکوب لازم‌اند.               |
| `when.providerConfigApiIn` | `string[]` | فهرست اختیاری مقادیر دقیق `api` پیکربندی ارائه‌دهنده که پیش از اعمال سرکوب لازم‌اند.              |

داده‌های فقط زمان اجرا را در `modelCatalog` قرار ندهید. از `static` فقط زمانی استفاده کنید که
ردیف‌های مانیفست برای سطح‌های فهرست و انتخابگر فیلترشده بر اساس ارائه‌دهنده به‌اندازه کافی کامل باشند تا
کشف رجیستری/زمان اجرا را رد کنند. زمانی از `refreshable` استفاده کنید که ردیف‌های مانیفست
بذرها یا مکمل‌های قابل فهرست‌سازی مفیدی باشند، اما تازه‌سازی/کش بتواند بعدا ردیف‌های بیشتری اضافه کند؛
ردیف‌های refreshable به‌تنهایی مرجع قطعی نیستند. زمانی از `runtime` استفاده کنید که OpenClaw
باید زمان اجرای ارائه‌دهنده را بارگذاری کند تا فهرست را بداند.

## مرجع modelIdNormalization

از `modelIdNormalization` برای پاک‌سازی کم‌هزینه شناسه مدل تحت مالکیت ارائه‌دهنده استفاده کنید که باید
پیش از بارگذاری زمان اجرای ارائه‌دهنده انجام شود. این کار نام‌های مستعار، مانند نام‌های کوتاه مدل،
شناسه‌های قدیمی محلی ارائه‌دهنده، و قواعد پیشوند پروکسی را به‌جای جدول‌های انتخاب مدل هسته، در
مانیفست Plugin مالک نگه می‌دارد.

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

| فیلد                                | نوع                    | معنی آن                                                                                   |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | نام‌های مستعار دقیق و بدون حساسیت به بزرگی/کوچکی حروف برای شناسه مدل. مقدارها همان‌طور که نوشته شده‌اند برگردانده می‌شوند. |
| `stripPrefixes`                      | `string[]`              | پیشوندهایی که پیش از جست‌وجوی نام مستعار حذف می‌شوند، مفید برای تکرار قدیمی ارائه‌دهنده/مدل. |
| `prefixWhenBare`                     | `string`                | پیشوندی که وقتی شناسه مدل نرمال‌سازی‌شده هنوز شامل `/` نیست، اضافه می‌شود. |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | قواعد شرطی پیشوند برای شناسه خام پس از جست‌وجوی نام مستعار، کلیدخورده با `modelPrefix` و `prefix`. |

## مرجع providerEndpoints

از `providerEndpoints` برای طبقه‌بندی endpointهایی استفاده کنید که سیاست درخواست عمومی باید پیش از
بارگذاری زمان اجرای ارائه‌دهنده بداند. هسته همچنان مالک معنای هر `endpointClass` است؛ مانیفست‌های
Plugin مالک فراداده میزبان و URL پایه هستند.

فیلدهای endpoint:

| فیلد                          | نوع       | معنی آن                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | کلاس endpoint شناخته‌شده در هسته، مانند `openrouter`، `moonshot-native`، یا `google-vertex`. |
| `hosts`                        | `string[]` | نام‌های میزبان دقیق که به کلاس endpoint نگاشت می‌شوند. |
| `hostSuffixes`                 | `string[]` | پسوندهای میزبان که به کلاس endpoint نگاشت می‌شوند. برای تطبیق فقط پسوند دامنه، با `.` شروع کنید. |
| `baseUrls`                     | `string[]` | URLهای پایه HTTP(S) نرمال‌سازی‌شده دقیق که به کلاس endpoint نگاشت می‌شوند. |
| `googleVertexRegion`           | `string`   | منطقه ثابت Google Vertex برای میزبان‌های سراسری دقیق. |
| `googleVertexRegionHostSuffix` | `string`   | پسوندی که از میزبان‌های مطابق حذف می‌شود تا پیشوند منطقه Google Vertex آشکار شود. |

## مرجع providerRequest

از `providerRequest` برای فراداده کم‌هزینه سازگاری درخواست استفاده کنید که سیاست درخواست عمومی
بدون بارگذاری زمان اجرای ارائه‌دهنده به آن نیاز دارد. بازنویسی payload وابسته به رفتار را در hookهای
زمان اجرای ارائه‌دهنده یا helperهای مشترک خانواده ارائه‌دهنده نگه دارید.

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

| فیلد                 | نوع         | معنی آن                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | برچسب خانواده ارائه‌دهنده که در تصمیم‌های سازگاری درخواست عمومی و عیب‌یابی‌ها استفاده می‌شود. |
| `compatibilityFamily` | `"moonshot"` | سطل سازگاری اختیاری خانواده ارائه‌دهنده برای helperهای مشترک درخواست. |
| `openAICompletions`   | `object`     | پرچم‌های درخواست completions سازگار با OpenAI، در حال حاضر `supportsStreamingUsage`. |

## مرجع modelPricing

زمانی از `modelPricing` استفاده کنید که یک ارائه‌دهنده پیش از بارگذاری زمان اجرا به رفتار قیمت‌گذاری
control plane نیاز دارد. کش قیمت‌گذاری Gateway این فراداده را بدون import کردن کد زمان اجرای
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

| فیلد        | نوع              | معنی آن                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | برای ارائه‌دهنده‌های محلی/خودمیزبان که هرگز نباید قیمت‌گذاری OpenRouter یا LiteLLM را واکشی کنند، `false` تنظیم کنید. |
| `openRouter` | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری OpenRouter. مقدار `false` جست‌وجوی OpenRouter را برای این ارائه‌دهنده غیرفعال می‌کند. |
| `liteLLM`    | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری LiteLLM. مقدار `false` جست‌وجوی LiteLLM را برای این ارائه‌دهنده غیرفعال می‌کند. |

فیلدهای منبع:

| فیلد                      | نوع               | معنی آن                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | شناسه ارائه‌دهنده کاتالوگ خارجی وقتی با شناسه ارائه‌دهنده OpenClaw فرق دارد، مثلا `z-ai` برای یک ارائه‌دهنده `zai`. |
| `passthroughProviderModel` | `boolean`          | شناسه‌های مدل شامل اسلش را به‌عنوان ارجاع‌های تو در توی ارائه‌دهنده/مدل در نظر بگیرید، مفید برای ارائه‌دهنده‌های پروکسی مانند OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | گونه‌های اضافی شناسه مدل کاتالوگ خارجی. `version-dots` شناسه‌های نسخه نقطه‌دار مانند `claude-opus-4.6` را امتحان می‌کند. |

### شاخص ارائه‌دهندگان OpenClaw

شاخص ارائه‌دهندگان OpenClaw فراداده پیش‌نمایش تحت مالکیت OpenClaw برای ارائه‌دهندگانی است
که Pluginهای آن‌ها ممکن است هنوز نصب نشده باشند. این بخشی از مانیفست Plugin نیست.
مانیفست‌های Plugin همچنان مرجع Plugin نصب‌شده باقی می‌مانند. شاخص ارائه‌دهندگان
قرارداد fallback داخلی است که سطح‌های آینده ارائه‌دهنده قابل نصب و انتخابگر مدل پیش از نصب،
وقتی Plugin ارائه‌دهنده نصب نشده باشد، مصرف خواهند کرد.

ترتیب مرجعیت کاتالوگ:

1. پیکربندی کاربر.
2. `modelCatalog` در مانیفست Plugin نصب‌شده.
3. کش کاتالوگ مدل از تازه‌سازی صریح.
4. ردیف‌های پیش‌نمایش شاخص ارائه‌دهندگان OpenClaw.

شاخص ارائه‌دهندگان نباید شامل secrets، وضعیت فعال، hookهای زمان اجرا، یا داده زنده مدل
ویژه حساب باشد. کاتالوگ‌های پیش‌نمایش آن از همان شکل ردیف ارائه‌دهنده `modelCatalog` مانند
مانیفست‌های Plugin استفاده می‌کنند، اما باید به فراداده نمایشی پایدار محدود بمانند، مگر اینکه
فیلدهای adapter زمان اجرا مانند `api`، `baseUrl`، قیمت‌گذاری، یا پرچم‌های سازگاری عمدا با
مانیفست Plugin نصب‌شده هم‌راستا نگه داشته شوند. ارائه‌دهندگان دارای کشف زنده `/models` باید
ردیف‌های تازه‌سازی‌شده را از مسیر صریح کش کاتالوگ مدل بنویسند، به‌جای اینکه فهرست‌سازی عادی یا
onboarding را وادار به فراخوانی APIهای ارائه‌دهنده کنند.

ورودی‌های شاخص ارائه‌دهندگان همچنین ممکن است برای ارائه‌دهندگانی که Plugin آن‌ها از هسته خارج شده
یا هنوز نصب نشده است، فراداده Plugin قابل نصب داشته باشند. این فراداده الگوی کاتالوگ کانال را
بازتاب می‌دهد: نام package، مشخصه نصب npm، integrity مورد انتظار، و برچسب‌های کم‌هزینه انتخاب auth
برای نمایش گزینه setup قابل نصب کافی هستند. پس از نصب Plugin، مانیفست آن برنده می‌شود و ورودی
شاخص ارائه‌دهندگان برای آن ارائه‌دهنده نادیده گرفته می‌شود.

کلیدهای قابلیت سطح بالای قدیمی منسوخ شده‌اند. از `openclaw doctor --fix` استفاده کنید تا
`speechProviders`، `realtimeTranscriptionProviders`،
`realtimeVoiceProviders`، `mediaUnderstandingProviders`،
`imageGenerationProviders`، `videoGenerationProviders`،
`webFetchProviders`، و `webSearchProviders` را به زیر `contracts` منتقل کنید؛ بارگذاری عادی
مانیفست دیگر این فیلدهای سطح بالا را به‌عنوان مالکیت قابلیت در نظر نمی‌گیرد.

## مانیفست در برابر package.json

این دو فایل کارکردهای متفاوتی دارند:

| فایل                   | کاربرد آن برای                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | کشف، اعتبارسنجی پیکربندی، فراداده انتخاب auth، و راهنمایی‌های UI که باید پیش از اجرای کد Plugin وجود داشته باشند |
| `package.json`         | فراداده npm، نصب وابستگی، و بلوک `openclaw` که برای entrypointها، gating نصب، setup، یا فراداده کاتالوگ استفاده می‌شود |

اگر مطمئن نیستید یک بخش از فراداده کجا باید قرار بگیرد، از این قاعده استفاده کنید:

- اگر OpenClaw باید آن را پیش از بارگذاری کد Plugin بداند، آن را در `openclaw.plugin.json` قرار دهید
- اگر مربوط به بسته‌بندی، فایل‌های ورودی، یا رفتار نصب npm است، آن را در `package.json` قرار دهید

### فیلدهای package.json که بر کشف اثر می‌گذارند

بخشی از فراداده پیش از زمان اجرای Plugin عمدا در `package.json` و زیر بلوک
`openclaw` قرار دارد، نه در `openclaw.plugin.json`.
`openclaw.bundle` و `openclaw.bundle.json` قراردادهای Plugin در OpenClaw نیستند؛
Pluginهای native باید از `openclaw.plugin.json` به‌همراه فیلدهای پشتیبانی‌شده
`package.json#openclaw` در ادامه استفاده کنند.

نمونه‌های مهم:

| فیلد                                                                                      | معنای آن                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | نقاط ورود Plugin بومی را اعلام می‌کند. باید داخل دایرکتوری بسته Plugin باقی بماند.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | نقاط ورود زمان اجرای JavaScript ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. باید داخل دایرکتوری بسته Plugin باقی بماند.                                                                 |
| `openclaw.setupEntry`                                                                      | نقطه ورود سبک و فقط مخصوص راه‌اندازی که هنگام onboarding، شروع به‌تعویق‌افتاده کانال، و کشف وضعیت کانال فقط‌خواندنی/SecretRef استفاده می‌شود. باید داخل دایرکتوری بسته Plugin باقی بماند. |
| `openclaw.runtimeSetupEntry`                                                               | نقطه ورود راه‌اندازی JavaScript ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. به `setupEntry` نیاز دارد، باید وجود داشته باشد، و باید داخل دایرکتوری بسته Plugin باقی بماند.                         |
| `openclaw.channel`                                                                         | فراداده ارزان کاتالوگ کانال مانند برچسب‌ها، مسیرهای مستندات، نام‌های مستعار، و متن انتخاب.                                                                                                 |
| `openclaw.channel.commands`                                                                | فراداده ایستای فرمان بومی و پیش‌فرض خودکار skill بومی که پیش از بارگذاری زمان اجرای کانال توسط سطوح config، audit، و فهرست فرمان استفاده می‌شود.                                          |
| `openclaw.channel.configuredState`                                                         | فراداده سبک بررسی‌کننده وضعیت پیکربندی‌شده که می‌تواند بدون بارگذاری کامل زمان اجرای کانال پاسخ دهد «آیا راه‌اندازی فقط-env از قبل وجود دارد؟».                                         |
| `openclaw.channel.persistedAuthState`                                                      | فراداده سبک بررسی‌کننده احراز هویت پایدارشده که می‌تواند بدون بارگذاری کامل زمان اجرای کانال پاسخ دهد «آیا چیزی از قبل وارد شده است؟».                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | راهنماهای نصب/به‌روزرسانی برای Pluginهای bundled و منتشرشده خارجی.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | مسیر نصب ترجیحی هنگامی که چند منبع نصب در دسترس است.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | حداقل نسخه پشتیبانی‌شده میزبان OpenClaw، با استفاده از کف semver مانند `>=2026.3.22` یا `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | رشته تمامیت مورد انتظار npm dist مانند `sha512-...`؛ جریان‌های نصب و به‌روزرسانی artifact دریافت‌شده را در برابر آن بررسی می‌کنند.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | مسیر بازیابی نصب مجدد محدود برای Plugin bundled را هنگامی که config نامعتبر است مجاز می‌کند.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | اجازه می‌دهد سطوح کانال فقط‌راه‌اندازی پیش از Plugin کامل کانال در هنگام شروع بارگذاری شوند.                                                                                                 |

فراداده manifest تصمیم می‌گیرد کدام انتخاب‌های provider/کانال/راه‌اندازی پیش از بارگذاری زمان اجرا در
onboarding ظاهر شوند. `package.json#openclaw.install` به
onboarding می‌گوید وقتی کاربر یکی از آن
انتخاب‌ها را برمی‌گزیند، چگونه آن Plugin را دریافت یا فعال کند. راهنماهای نصب را به `openclaw.plugin.json` منتقل نکنید.

`openclaw.install.minHostVersion` هنگام نصب و بارگذاری
registry manifest برای منابع Plugin غیرباندل‌شده enforce می‌شود. مقدارهای نامعتبر رد می‌شوند؛
مقدارهای جدیدتر اما معتبر، Pluginهای خارجی را روی میزبان‌های قدیمی‌تر رد می‌کنند. Pluginهای منبع bundled
هم‌نسخه با checkout میزبان فرض می‌شوند.

فراداده رسمی نصب در زمان نیاز باید وقتی Plugin روی ClawHub منتشر شده است از `clawhubSpec` استفاده کند؛ onboarding آن را منبع راه‌دور ترجیحی در نظر می‌گیرد و
پس از نصب، واقعیت‌های artifact مربوط به ClawHub را ثبت می‌کند. `npmSpec` همچنان fallback سازگاری
برای بسته‌هایی است که هنوز به ClawHub منتقل نشده‌اند.

پین‌کردن نسخه دقیق npm از قبل در `npmSpec` قرار دارد، برای مثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. ورودی‌های کاتالوگ خارجی رسمی
باید مشخصات دقیق را با `expectedIntegrity` همراه کنند تا اگر artifact دریافت‌شده npm دیگر با انتشار پین‌شده مطابقت نداشت،
جریان‌های به‌روزرسانی به‌شکل fail closed متوقف شوند.
onboarding تعاملی همچنان مشخصات npm رجیستری‌های مورداعتماد، شامل نام‌های bare
بسته و dist-tagها را برای سازگاری ارائه می‌دهد. diagnostics کاتالوگ می‌تواند
منابع دقیق، floating، integrity-pinned، missing-integrity، package-name
mismatch، و default-choice نامعتبر را تشخیص دهد. همچنین وقتی
`expectedIntegrity` وجود دارد اما منبع npm معتبری وجود ندارد که بتواند آن را پین کند، هشدار می‌دهد.
وقتی `expectedIntegrity` وجود دارد،
جریان‌های نصب/به‌روزرسانی آن را enforce می‌کنند؛ وقتی حذف شده باشد، resolution رجیستری
بدون پین integrity ثبت می‌شود.

Pluginهای کانال باید وقتی status، فهرست کانال،
یا اسکن‌های SecretRef باید حساب‌های پیکربندی‌شده را بدون بارگذاری کامل
runtime شناسایی کنند، `openclaw.setupEntry` ارائه کنند. ورودی setup باید فراداده کانال به‌همراه config،
status، و adapterهای secrets ایمن برای setup را expose کند؛ clientهای شبکه، listenerهای Gateway، و
runtimeهای transport را در نقطه ورود اصلی extension نگه دارید.

فیلدهای نقطه ورود runtime بررسی‌های مرز بسته را برای فیلدهای
نقطه ورود source override نمی‌کنند. برای مثال، `openclaw.runtimeExtensions` نمی‌تواند یک مسیر
گریزان `openclaw.extensions` را قابل بارگذاری کند.

`openclaw.install.allowInvalidConfigRecovery` عمدا محدود است. این
configهای خراب دلخواه را قابل نصب نمی‌کند. امروز فقط اجازه می‌دهد جریان‌های نصب
از خرابی‌های مشخص upgrade مربوط به Plugin bundled که stale هستند بازیابی شوند، مانند
نبود مسیر Plugin bundled یا ورودی stale `channels.<id>` برای همان
Plugin bundled. خطاهای config نامرتبط همچنان نصب را مسدود می‌کنند و operatorها را
به `openclaw doctor --fix` می‌فرستند.

`openclaw.channel.persistedAuthState` فراداده بسته برای یک module بررسی‌کننده کوچک است:

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

وقتی setup، doctor، status، یا جریان‌های حضور فقط‌خواندنی پیش از بارگذاری کامل Plugin کانال به یک
probe ارزان بله/خیر برای احراز هویت نیاز دارند، از آن استفاده کنید. وضعیت احراز هویت پایدارشده
وضعیت کانال پیکربندی‌شده نیست: از این فراداده برای فعال‌سازی خودکار Pluginها،
تعمیر dependencyهای runtime، یا تصمیم‌گیری درباره اینکه runtime کانال باید بارگذاری شود استفاده نکنید.
export هدف باید تابع کوچکی باشد که فقط وضعیت پایدارشده را می‌خواند؛ آن را
از مسیر barrel کامل runtime کانال عبور ندهید.

`openclaw.channel.configuredState` برای بررسی‌های ارزان
پیکربندی‌شده فقط-env از همان شکل پیروی می‌کند:

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
غیر-runtime دیگر پاسخ دهد، از آن استفاده کنید. اگر بررسی به resolution کامل config یا runtime واقعی
کانال نیاز دارد، آن منطق را به‌جای آن در hook مربوط به `config.hasConfiguredState`
در Plugin نگه دارید.

## تقدم کشف (شناسه‌های Plugin تکراری)

OpenClaw Pluginها را از چند root کشف می‌کند (bundled، نصب global، workspace، مسیرهای صریح انتخاب‌شده در config). اگر دو کشف `id` یکسانی داشته باشند، فقط manifest با **بالاترین تقدم** نگه داشته می‌شود؛ تکراری‌های با تقدم پایین‌تر به‌جای بارگذاری در کنار آن حذف می‌شوند.

تقدم، از بیشترین به کمترین:

1. **انتخاب‌شده با config** — مسیری که به‌صراحت در `plugins.entries.<id>` پین شده است
2. **Bundled** — Pluginهایی که همراه OpenClaw ارائه می‌شوند
3. **نصب global** — Pluginهایی که در root Plugin عمومی OpenClaw نصب شده‌اند
4. **Workspace** — Pluginهایی که نسبت به workspace فعلی کشف شده‌اند

پیامدها:

- یک کپی forkشده یا stale از یک Plugin bundled که در workspace قرار دارد، build bundled را shadow نمی‌کند.
- برای override واقعی یک Plugin bundled با نمونه local، آن را از طریق `plugins.entries.<id>` پین کنید تا با تقدم برنده شود، نه با تکیه بر کشف workspace.
- حذف تکراری‌ها log می‌شود تا Doctor و diagnostics شروع بتوانند به کپی دورریخته‌شده اشاره کنند.
- overrideهای تکراری انتخاب‌شده با config در diagnostics به‌صورت overrideهای صریح بیان می‌شوند، اما همچنان هشدار می‌دهند تا forkهای stale و shadowهای تصادفی قابل مشاهده بمانند.

## نیازمندی‌های JSON Schema

- **هر Plugin باید یک JSON Schema همراه داشته باشد**، حتی اگر هیچ configی قبول نکند.
- schema خالی پذیرفتنی است (برای مثال، `{ "type": "object", "additionalProperties": false }`).
- schemaها هنگام خواندن/نوشتن config اعتبارسنجی می‌شوند، نه در runtime.
- هنگام گسترش یا fork کردن یک Plugin bundled با کلیدهای config جدید، هم‌زمان `configSchema` همان Plugin را در `openclaw.plugin.json` به‌روزرسانی کنید. schemaهای Pluginهای bundled strict هستند، بنابراین افزودن `plugins.entries.<id>.config.myNewKey` در config کاربر بدون افزودن `myNewKey` به `configSchema.properties` پیش از بارگذاری runtime Plugin رد خواهد شد.

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
  یک manifest Plugin اعلام شده باشد.
- `plugins.entries.<id>`، `plugins.allow`، `plugins.deny`، و `plugins.slots.*`
  باید به شناسه‌های Plugin **قابل کشف** ارجاع دهند. شناسه‌های ناشناخته **خطا** هستند.
- اگر یک Plugin نصب شده باشد اما manifest یا schema آن خراب یا مفقود باشد،
  اعتبارسنجی fail می‌شود و Doctor خطای Plugin را گزارش می‌کند.
- اگر config مربوط به Plugin وجود داشته باشد اما Plugin **غیرفعال** باشد، config نگه داشته می‌شود و
  یک **هشدار** در Doctor + logها نمایش داده می‌شود.

برای schema کامل `plugins.*`، [مرجع پیکربندی](/fa/gateway/configuration) را ببینید.

## یادداشت‌ها

- مانیفست برای **Pluginهای بومی OpenClaw الزامی است**، از جمله بارگذاری‌های فایل‌سیستم محلی. Runtime همچنان ماژول Plugin را جداگانه بارگذاری می‌کند؛ مانیفست فقط برای کشف + اعتبارسنجی است.
- مانیفست‌های بومی با JSON5 پردازش می‌شوند، بنابراین کامنت‌ها، کاماهای انتهایی، و کلیدهای بدون کوتیشن پذیرفته می‌شوند، به شرطی که مقدار نهایی همچنان یک شیء باشد.
- فقط فیلدهای مستندشدهٔ مانیفست توسط بارگذار مانیفست خوانده می‌شوند. از کلیدهای سفارشی در سطح بالا پرهیز کنید.
- `channels`، `providers`، `cliBackends`، و `skills` همگی می‌توانند حذف شوند وقتی Plugin به آن‌ها نیاز ندارد.
- `providerDiscoveryEntry` باید سبک بماند و نباید کد گستردهٔ Runtime را import کند؛ از آن برای فرادادهٔ ثابت کاتالوگ ارائه‌دهنده یا توصیفگرهای محدود کشف استفاده کنید، نه اجرای زمان درخواست.
- گونه‌های انحصاری Plugin از طریق `plugins.slots.*` انتخاب می‌شوند: `kind: "memory"` از طریق `plugins.slots.memory`، و `kind: "context-engine"` از طریق `plugins.slots.contextEngine` (پیش‌فرض `legacy`).
- گونهٔ انحصاری Plugin را در این مانیفست اعلام کنید. `OpenClawPluginDefinition.kind` در ورودی Runtime منسوخ شده است و فقط به‌عنوان fallback سازگاری برای Pluginهای قدیمی‌تر باقی مانده است.
- فرادادهٔ متغیرهای محیطی (`setup.providers[].envVars`، `providerAuthEnvVars` منسوخ‌شده، و `channelEnvVars`) فقط اعلانی است. وضعیت، ممیزی، اعتبارسنجی تحویل cron، و سایر سطوح فقط‌خواندنی همچنان قبل از اینکه یک متغیر محیطی را پیکربندی‌شده تلقی کنند، اعتماد Plugin و سیاست فعال‌سازی مؤثر را اعمال می‌کنند.
- برای فرادادهٔ جادوگر Runtime که به کد ارائه‌دهنده نیاز دارد، [hookهای Runtime ارائه‌دهنده](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
- اگر Plugin شما به ماژول‌های بومی وابسته است، مراحل ساخت و هرگونه الزامات allowlist مدیر بسته را مستند کنید (برای مثال، pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## مرتبط

<CardGroup cols={3}>
  <Card title="ساخت Pluginها" href="/fa/plugins/building-plugins" icon="rocket">
    شروع کار با Pluginها.
  </Card>
  <Card title="معماری Plugin" href="/fa/plugins/architecture" icon="diagram-project">
    معماری داخلی و مدل قابلیت‌ها.
  </Card>
  <Card title="نمای کلی SDK" href="/fa/plugins/sdk-overview" icon="book">
    مرجع SDK برای Plugin و importهای subpath.
  </Card>
</CardGroup>
