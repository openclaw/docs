---
read_when:
    - شما در حال ساخت یک Plugin برای OpenClaw هستید
    - باید یک طرح‌واره پیکربندی Plugin ارائه کنید یا خطاهای اعتبارسنجی Plugin را اشکال‌زدایی کنید
summary: الزامات مانیفست Plugin + طرحواره JSON (اعتبارسنجی سخت‌گیرانه پیکربندی)
title: مانیفست Plugin
x-i18n:
    generated_at: "2026-04-30T09:40:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

این صفحه فقط برای **مانیفست Plugin بومی OpenClaw** است.

برای چیدمان‌های باندل سازگار، [باندل‌های Plugin](/fa/plugins/bundles) را ببینید.

قالب‌های باندل سازگار از فایل‌های مانیفست متفاوتی استفاده می‌کنند:

- باندل Codex: `.codex-plugin/plugin.json`
- باندل Claude: `.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude
  بدون مانیفست
- باندل Cursor: `.cursor-plugin/plugin.json`

OpenClaw این چیدمان‌های باندل را هم به‌طور خودکار تشخیص می‌دهد، اما آن‌ها در برابر
طرحواره `openclaw.plugin.json` که اینجا توصیف شده اعتبارسنجی نمی‌شوند.

برای باندل‌های سازگار، OpenClaw در حال حاضر فراداده باندل به‌همراه ریشه‌های Skills
اعلام‌شده، ریشه‌های دستور Claude، پیش‌فرض‌های `settings.json` باندل Claude،
پیش‌فرض‌های LSP باندل Claude، و بسته‌های قلاب پشتیبانی‌شده را، وقتی چیدمان با
انتظارهای زمان اجرای OpenClaw همخوان است، می‌خواند.

هر Plugin بومی OpenClaw **باید** یک فایل `openclaw.plugin.json` را در
**ریشه Plugin** همراه خود داشته باشد. OpenClaw از این مانیفست برای اعتبارسنجی پیکربندی
**بدون اجرای کد Plugin** استفاده می‌کند. مانیفست‌های ناموجود یا نامعتبر به‌عنوان
خطاهای Plugin در نظر گرفته می‌شوند و اعتبارسنجی پیکربندی را مسدود می‌کنند.

راهنمای کامل سامانه Plugin را ببینید: [Pluginها](/fa/tools/plugin).
برای مدل قابلیت بومی و راهنمای فعلی سازگاری بیرونی:
[مدل قابلیت](/fa/plugins/architecture#public-capability-model).

## این فایل چه کاری انجام می‌دهد

`openclaw.plugin.json` فراداده‌ای است که OpenClaw **پیش از بارگذاری کد
Plugin شما** می‌خواند. همه موارد زیر باید آن‌قدر کم‌هزینه باشند که بدون راه‌اندازی
زمان اجرای Plugin قابل بررسی باشند.

**از آن برای این موارد استفاده کنید:**

- هویت Plugin، اعتبارسنجی پیکربندی، و راهنماهای رابط کاربری پیکربندی
- فراداده احراز هویت، آغازبه‌کار، و راه‌اندازی (نام مستعار، فعال‌سازی خودکار، متغیرهای محیطی فراهم‌کننده، انتخاب‌های احراز هویت)
- راهنماهای فعال‌سازی برای سطوح صفحه کنترل
- مالکیت کوتاه‌نویسی خانواده مدل
- نماهای ثابت مالکیت قابلیت (`contracts`)
- فراداده اجراکننده QA که میزبان مشترک `openclaw qa` بتواند بررسی کند
- فراداده پیکربندی مختص کانال که در سطوح کاتالوگ و اعتبارسنجی ادغام می‌شود

**از آن برای این موارد استفاده نکنید:** ثبت رفتار زمان اجرا، اعلام نقطه‌های ورود کد،
یا فراداده نصب npm. این موارد به کد Plugin شما و `package.json` تعلق دارند.

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

| فیلد                                | الزامی | نوع                             | معنی آن                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | بله      | `string`                         | شناسهٔ کانونی Plugin. این همان شناسه‌ای است که در `plugins.entries.<id>` استفاده می‌شود.                                                                                                                                                               |
| `configSchema`                       | بله      | `object`                         | JSON Schema درون‌خطی برای پیکربندی این Plugin.                                                                                                                                                                                      |
| `enabledByDefault`                   | خیر       | `true`                           | یک Plugin بسته‌بندی‌شده را به‌صورت پیش‌فرض فعال علامت‌گذاری می‌کند. برای اینکه Plugin به‌صورت پیش‌فرض غیرفعال بماند، آن را حذف کنید یا هر مقدار غیر از `true` تنظیم کنید.                                                                                                      |
| `legacyPluginIds`                    | خیر       | `string[]`                       | شناسه‌های قدیمی که به این شناسهٔ کانونی Plugin نرمال‌سازی می‌شوند.                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده که وقتی ارجاع‌های احراز هویت، پیکربندی یا مدل به آن‌ها اشاره کنند، باید این Plugin را به‌صورت خودکار فعال کنند.                                                                                                                                   |
| `kind`                               | خیر       | `"memory"` \| `"context-engine"` | نوع انحصاری Plugin را اعلام می‌کند که توسط `plugins.slots.*` استفاده می‌شود.                                                                                                                                                                      |
| `channels`                           | خیر       | `string[]`                       | شناسه‌های کانال که مالکیتشان با این Plugin است. برای کشف و اعتبارسنجی پیکربندی استفاده می‌شود.                                                                                                                                                       |
| `providers`                          | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده که مالکیتشان با این Plugin است.                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | خیر       | `string`                         | مسیر ماژول سبک کشف ارائه‌دهنده، نسبت به ریشهٔ Plugin، برای فرادادهٔ کاتالوگ ارائه‌دهنده در محدودهٔ مانیفست که می‌تواند بدون فعال‌سازی زمان اجرای کامل Plugin بارگذاری شود.                                             |
| `modelSupport`                       | خیر       | `object`                         | فرادادهٔ کوتاه خانوادهٔ مدل، متعلق به مانیفست، که برای بارگذاری خودکار Plugin پیش از زمان اجرا استفاده می‌شود.                                                                                                                                       |
| `modelCatalog`                       | خیر       | `object`                         | فرادادهٔ اعلانی کاتالوگ مدل برای ارائه‌دهنده‌هایی که مالکیتشان با این Plugin است. این قرارداد سطح کنترل برای فهرست‌کردن فقط‌خواندنی آینده، راه‌اندازی اولیه، انتخاب‌گرهای مدل، نام‌های مستعار و سرکوب بدون بارگذاری زمان اجرای Plugin است.       |
| `modelPricing`                       | خیر       | `object`                         | سیاست جست‌وجوی قیمت‌گذاری خارجی متعلق به ارائه‌دهنده. از آن برای خارج‌کردن ارائه‌دهنده‌های محلی/خودمیزبان از کاتالوگ‌های قیمت‌گذاری راه‌دور یا نگاشت ارجاع‌های ارائه‌دهنده به شناسه‌های کاتالوگ OpenRouter/LiteLLM بدون کدنویسی سخت شناسه‌های ارائه‌دهنده در هسته استفاده کنید.           |
| `modelIdNormalization`               | خیر       | `object`                         | پاک‌سازی نام مستعار/پیشوند شناسهٔ مدل متعلق به ارائه‌دهنده که باید پیش از بارگذاری زمان اجرای ارائه‌دهنده اجرا شود.                                                                                                                                         |
| `providerEndpoints`                  | خیر       | `object[]`                       | فرادادهٔ میزبان/‏baseUrl نقطهٔ پایانی، متعلق به مانیفست، برای مسیرهای ارائه‌دهنده که هسته باید پیش از بارگذاری زمان اجرای ارائه‌دهنده طبقه‌بندی کند.                                                                                                          |
| `providerRequest`                    | خیر       | `object`                         | فرادادهٔ ارزان خانوادهٔ ارائه‌دهنده و سازگاری درخواست که توسط سیاست عمومی درخواست پیش از بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌شود.                                                                                                            |
| `cliBackends`                        | خیر       | `string[]`                       | شناسه‌های بک‌اند استنتاج CLI که مالکیتشان با این Plugin است. برای فعال‌سازی خودکار هنگام شروع از ارجاع‌های صریح پیکربندی استفاده می‌شود.                                                                                                                       |
| `syntheticAuthRefs`                  | خیر       | `string[]`                       | ارجاع‌های ارائه‌دهنده یا بک‌اند CLI که قلاب احراز هویت مصنوعی متعلق به Plugin آن‌ها باید طی کشف سرد مدل، پیش از بارگذاری زمان اجرا، بررسی شود.                                                                                            |
| `nonSecretAuthMarkers`               | خیر       | `string[]`                       | مقادیر جایگزین کلید API متعلق به Plugin بسته‌بندی‌شده که وضعیت اعتبارنامهٔ غیرمحرمانهٔ محلی، OAuth یا محیطی را نشان می‌دهند.                                                                                                              |
| `commandAliases`                     | خیر       | `object[]`                       | نام‌های فرمانی که مالکیتشان با این Plugin است و باید پیش از بارگذاری زمان اجرا، عیب‌یابی‌های پیکربندی و CLI آگاه از Plugin تولید کنند.                                                                                                              |
| `providerAuthEnvVars`                | خیر       | `Record<string, string[]>`       | فرادادهٔ محیطی سازگاری منسوخ‌شده برای جست‌وجوی احراز هویت/وضعیت ارائه‌دهنده. برای Pluginهای جدید `setup.providers[].envVars` را ترجیح دهید؛ OpenClaw همچنان در بازهٔ منسوخ‌سازی این را می‌خواند.                                               |
| `providerAuthAliases`                | خیر       | `Record<string, string>`         | شناسه‌های ارائه‌دهنده که باید برای جست‌وجوی احراز هویت از یک شناسهٔ ارائه‌دهندهٔ دیگر دوباره استفاده کنند، برای مثال ارائه‌دهندهٔ کدنویسی که کلید API و پروفایل‌های احراز هویت ارائه‌دهندهٔ پایه را به اشتراک می‌گذارد.                                                                        |
| `channelEnvVars`                     | خیر       | `Record<string, string[]>`       | فرادادهٔ ارزان محیط کانال که OpenClaw می‌تواند بدون بارگذاری کد Plugin بررسی کند. از این برای راه‌اندازی کانال مبتنی بر محیط یا سطوح احراز هویتی استفاده کنید که کمک‌کننده‌های عمومی شروع/پیکربندی باید ببینند.                                          |
| `providerAuthChoices`                | خیر       | `object[]`                       | فرادادهٔ ارزان گزینهٔ احراز هویت برای انتخاب‌گرهای راه‌اندازی اولیه، حل ارائه‌دهندهٔ ترجیحی و سیم‌کشی سادهٔ پرچم CLI.                                                                                                                     |
| `activation`                         | خیر       | `object`                         | فرادادهٔ ارزان برنامه‌ریز فعال‌سازی برای بارگذاری هنگام شروع، ارائه‌دهنده، فرمان، کانال، مسیر و بارگذاری تحریک‌شده توسط قابلیت. فقط فراداده است؛ زمان اجرای Plugin همچنان مالک رفتار واقعی است.                                                     |
| `setup`                              | خیر       | `object`                         | توصیف‌گرهای ارزان راه‌اندازی/راه‌اندازی اولیه که سطوح کشف و راه‌اندازی می‌توانند بدون بارگذاری زمان اجرای Plugin بررسی کنند.                                                                                                                  |
| `qaRunners`                          | خیر       | `object[]`                       | توصیف‌گرهای ارزان اجراکنندهٔ QA که میزبان مشترک `openclaw qa` پیش از بارگذاری زمان اجرای Plugin استفاده می‌کند.                                                                                                                                    |
| `contracts`                          | خیر       | `object`                         | عکس‌برداشت ایستای قابلیت بسته‌بندی‌شده برای قلاب‌های احراز هویت خارجی، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید موسیقی، تولید ویدئو، واکشی وب، جست‌وجوی وب و مالکیت ابزار. |
| `mediaUnderstandingProviderMetadata` | خیر       | `Record<string, object>`         | پیش‌فرض‌های ارزان درک رسانه برای شناسه‌های ارائه‌دهنده که در `contracts.mediaUnderstandingProviders` اعلام شده‌اند.                                                                                                                          |
| `channelConfigs`                     | خیر       | `Record<string, object>`         | فرادادهٔ پیکربندی کانال متعلق به مانیفست که پیش از بارگذاری زمان اجرا در سطوح کشف و اعتبارسنجی ادغام می‌شود.                                                                                                                        |
| `skills`                             | خیر       | `string[]`                       | دایرکتوری‌های Skill برای بارگذاری، نسبت به ریشهٔ Plugin.                                                                                                                                                                           |
| `name`                               | خیر       | `string`                         | نام خوانای انسانی Plugin.                                                                                                                                                                                                       |
| `description`                        | خیر       | `string`                         | خلاصهٔ کوتاهی که در سطوح Plugin نمایش داده می‌شود.                                                                                                                                                                                           |
| `version`                            | خیر       | `string`                         | نسخهٔ اطلاع‌رسانی Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | خیر       | `Record<string, object>`         | برچسب‌های UI، جای‌نگهدارها و راهنمایی‌های حساسیت برای فیلدهای پیکربندی.                                                                                                                                                                 |

## مرجع `providerAuthChoices`

هر ورودی `providerAuthChoices` یک گزینهٔ راه‌اندازی اولیه یا احراز هویت را توصیف می‌کند.
OpenClaw این را پیش از بارگذاری زمان اجرای ارائه‌دهنده می‌خواند.
فهرست‌های راه‌اندازی ارائه‌دهنده از این گزینه‌های مانیفست، گزینه‌های راه‌اندازی مشتق‌شده از توصیف‌گر،
و فرادادهٔ کاتالوگ نصب بدون بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌کنند.

| فیلد                 | الزامی | نوع                                            | معنای آن                                                                                                                                                                                                                          |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | بله      | `string`                                        | شناسهٔ ارائه‌دهنده‌ای که این انتخاب به آن تعلق دارد.                                                                      |
| `method`              | بله      | `string`                                        | شناسهٔ روش احراز هویت برای ارسال به آن.                                                                           |
| `choiceId`            | بله      | `string`                                        | شناسهٔ پایدار انتخاب احراز هویت که توسط جریان‌های راه‌اندازی اولیه و CLI استفاده می‌شود.                                                  |
| `choiceLabel`         | خیر       | `string`                                        | برچسب قابل‌مشاهده برای کاربر. اگر حذف شود، OpenClaw به `choiceId` بازمی‌گردد.                                        |
| `choiceHint`          | خیر       | `string`                                        | متن راهنمای کوتاه برای انتخاب‌گر.                                                                        |
| `assistantPriority`   | خیر       | `number`                                        | مقادیر پایین‌تر در انتخاب‌گرهای تعاملی هدایت‌شده توسط دستیار زودتر مرتب می‌شوند.                                       |
| `assistantVisibility` | خیر       | `"visible"` \| `"manual-only"`                  | انتخاب را از انتخاب‌گرهای دستیار پنهان می‌کند، در حالی که انتخاب دستی CLI همچنان مجاز است.                        |
| `deprecatedChoiceIds` | خیر       | `string[]`                                      | شناسه‌های انتخاب قدیمی که باید کاربران را به این انتخاب جایگزین هدایت کنند.                                 |
| `groupId`             | خیر       | `string`                                        | شناسهٔ گروه اختیاری برای گروه‌بندی انتخاب‌های مرتبط.                                                          |
| `groupLabel`          | خیر       | `string`                                        | برچسب قابل‌مشاهده برای کاربر برای آن گروه.                                                                        |
| `groupHint`           | خیر       | `string`                                        | متن راهنمای کوتاه برای گروه.                                                                         |
| `optionKey`           | خیر       | `string`                                        | کلید گزینهٔ داخلی برای جریان‌های احراز هویت ساده با یک پرچم.                                                      |
| `cliFlag`             | خیر       | `string`                                        | نام پرچم CLI، مانند `--openrouter-api-key`.                                                           |
| `cliOption`           | خیر       | `string`                                        | شکل کامل گزینهٔ CLI، مانند `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | خیر       | `string`                                        | توضیحی که در راهنمای CLI استفاده می‌شود.                                                                            |
| `onboardingScopes`    | خیر       | `Array<"text-inference" \| "image-generation">` | این انتخاب باید در کدام سطح‌های راه‌اندازی اولیه ظاهر شود. اگر حذف شود، مقدار پیش‌فرض آن `["text-inference"]` است. |

## مرجع commandAliases

زمانی از `commandAliases` استفاده کنید که یک Plugin مالک نام فرمان زمان اجرا باشد که کاربران ممکن است
به‌اشتباه در `plugins.allow` بگذارند یا سعی کنند آن را به‌عنوان فرمان CLI ریشه اجرا کنند. OpenClaw
از این فراداده برای تشخیص استفاده می‌کند، بدون اینکه کد زمان اجرای Plugin را وارد کند.

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

| فیلد        | الزامی | نوع              | معنای آن                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | بله      | `string`          | نام فرمانی که به این Plugin تعلق دارد.                               |
| `kind`       | خیر       | `"runtime-slash"` | نام مستعار را به‌جای فرمان CLI ریشه، به‌عنوان فرمان اسلش گفت‌وگو علامت‌گذاری می‌کند. |
| `cliCommand` | خیر       | `string`          | فرمان CLI ریشهٔ مرتبط که در صورت وجود، برای عملیات CLI پیشنهاد می‌شود.  |

## مرجع activation

زمانی از `activation` استفاده کنید که Plugin بتواند با هزینهٔ کم اعلام کند کدام رویدادهای سطح کنترل
باید آن را در طرح فعال‌سازی/بارگذاری وارد کنند.

این بلوک فرادادهٔ برنامه‌ریز است، نه API چرخهٔ عمر. رفتار زمان اجرا را ثبت نمی‌کند،
جایگزین `register(...)` نمی‌شود، و تضمین نمی‌کند که کد Plugin از قبل اجرا شده باشد.
برنامه‌ریز فعال‌سازی از این فیلدها برای محدود کردن Pluginهای نامزد استفاده می‌کند، پیش از آنکه به فرادادهٔ مالکیت موجود در مانیفست
مانند `providers`، `channels`، `commandAliases`، `setup.providers`،
`contracts.tools` و هوک‌ها بازگردد.

باریک‌ترین فراداده‌ای را ترجیح دهید که از قبل مالکیت را توصیف می‌کند. زمانی از
`providers`، `channels`، `commandAliases`، توصیف‌گرهای setup یا `contracts`
استفاده کنید که آن فیلدها رابطه را بیان می‌کنند. از `activation` برای راهنماهای اضافی برنامه‌ریز
استفاده کنید که نمی‌توان آن‌ها را با آن فیلدهای مالکیت نمایش داد.
برای نام‌های مستعار زمان اجرای CLI مانند `claude-cli`،
`codex-cli` یا `google-gemini-cli` از `cliBackends` سطح بالا استفاده کنید؛ `activation.onAgentHarnesses` فقط برای
شناسه‌های مهار عامل تعبیه‌شده است که از قبل فیلد مالکیت ندارند.

این بلوک فقط فراداده است. رفتار زمان اجرا را ثبت نمی‌کند و جایگزین
`register(...)`، `setupEntry` یا دیگر نقاط ورود زمان اجرا/Plugin نمی‌شود.
مصرف‌کنندگان فعلی از آن به‌عنوان راهنمای محدودسازی پیش از بارگذاری گسترده‌تر Plugin استفاده می‌کنند، بنابراین
نبود فرادادهٔ فعال‌سازی معمولاً فقط هزینهٔ عملکردی دارد؛ تا زمانی که مسیرهای بازگشت مالکیت مانیفست قدیمی همچنان وجود دارند، نباید
درستی را تغییر دهد.

هر Plugin باید `activation.onStartup` را عامدانه تنظیم کند، زیرا OpenClaw از واردکردن‌های ضمنی هنگام شروع فاصله می‌گیرد.
فقط زمانی آن را روی `true` بگذارید که Plugin باید
هنگام شروع Gateway اجرا شود. زمانی آن را روی `false` بگذارید که Plugin در
شروع غیرفعال است و فقط باید از محرک‌های محدودتر بارگذاری شود. حذف `onStartup`
مسیر بازگشت سایدکار شروع ضمنی قدیمی منسوخ‌شده را برای Pluginهایی که هیچ
فرادادهٔ قابلیت ایستا ندارند نگه می‌دارد؛ نسخه‌های آینده ممکن است بارگذاری هنگام شروع آن
Pluginها را متوقف کنند مگر اینکه `activation.onStartup: true` را اعلام کنند. گزارش‌های وضعیت و
سازگاری Plugin با `legacy-implicit-startup-sidecar` هشدار می‌دهند وقتی یک Plugin
هنوز به آن مسیر بازگشت تکیه دارد.

برای آزمون مهاجرت، مقدار
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` را تنظیم کنید تا فقط همان
مسیر بازگشت منسوخ‌شده غیرفعال شود. این حالت opt-in، Pluginهای صریح با
`activation.onStartup: true` یا Pluginهایی را که توسط کانال، پیکربندی،
مهار عامل، حافظه یا دیگر محرک‌های فعال‌سازی محدودتر بارگذاری می‌شوند مسدود نمی‌کند.

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

| فیلد              | الزامی | نوع                                                 | معنای آن                                                                                                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | خیر       | `boolean`                                            | فعال‌سازی صریح هنگام شروع Gateway. هر Plugin باید این را تنظیم کند. `true` هنگام شروع، Plugin را وارد می‌کند؛ `false` از مسیر بازگشت شروع سایدکار ضمنی منسوخ‌شده خارج می‌شود، مگر اینکه محرک منطبق دیگری بارگذاری را لازم کند. |
| `onProviders`      | خیر       | `string[]`                                           | شناسه‌های ارائه‌دهنده که باید این Plugin را در طرح‌های فعال‌سازی/بارگذاری وارد کنند.                                                                                                                                                             |
| `onAgentHarnesses` | خیر       | `string[]`                                           | شناسه‌های زمان اجرای مهار عامل تعبیه‌شده که باید این Plugin را در طرح‌های فعال‌سازی/بارگذاری وارد کنند. برای نام‌های مستعار backendهای CLI از `cliBackends` سطح بالا استفاده کنید.                                                                                  |
| `onCommands`       | خیر       | `string[]`                                           | شناسه‌های فرمان که باید این Plugin را در طرح‌های فعال‌سازی/بارگذاری وارد کنند.                                                                                                                                                              |
| `onChannels`       | خیر       | `string[]`                                           | شناسه‌های کانال که باید این Plugin را در طرح‌های فعال‌سازی/بارگذاری وارد کنند.                                                                                                                                                              |
| `onRoutes`         | خیر       | `string[]`                                           | گونه‌های مسیر که باید این Plugin را در طرح‌های فعال‌سازی/بارگذاری وارد کنند.                                                                                                                                                              |
| `onConfigPaths`    | خیر       | `string[]`                                           | مسیرهای پیکربندی نسبی به ریشه که وقتی مسیر حاضر است و صریحاً غیرفعال نشده، باید این Plugin را در طرح‌های شروع/بارگذاری وارد کنند.                                                                                             |
| `onCapabilities`   | خیر       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | راهنماهای گستردهٔ قابلیت که توسط برنامه‌ریزی فعال‌سازی سطح کنترل استفاده می‌شوند. هر جا ممکن است، فیلدهای محدودتر را ترجیح دهید.                                                                                                                            |

مصرف‌کنندگان زندهٔ فعلی:

- برنامه‌ریزی شروع Gateway از `activation.onStartup` برای واردکردن صریح هنگام شروع
  و خروج از مسیر بازگشت شروع سایدکار ضمنی منسوخ‌شده استفاده می‌کند
- برنامه‌ریزی CLI برانگیخته‌شده با فرمان به `commandAliases[].cliCommand` یا
  `commandAliases[].name` قدیمی بازمی‌گردد
- برنامه‌ریزی شروع زمان اجرای عامل از `activation.onAgentHarnesses` برای
  مهارهای تعبیه‌شده و از `cliBackends[]` سطح بالا برای نام‌های مستعار زمان اجرای CLI استفاده می‌کند
- برنامه‌ریزی setup/کانال برانگیخته‌شده با کانال، وقتی فرادادهٔ فعال‌سازی صریح کانال موجود نیست، به مالکیت `channels[]`
  قدیمی بازمی‌گردد
- برنامه‌ریزی Plugin هنگام شروع از `activation.onConfigPaths` برای سطح‌های پیکربندی ریشهٔ غیرکانالی
  مانند بلوک `browser` مربوط به Plugin مرورگر بسته‌بندی‌شده استفاده می‌کند
- برنامه‌ریزی setup/زمان اجرا برانگیخته‌شده با ارائه‌دهنده، وقتی فرادادهٔ فعال‌سازی صریح ارائه‌دهنده
  موجود نیست، به مالکیت `providers[]` و `cliBackends[]` سطح بالا بازمی‌گردد

تشخیص‌های برنامه‌ریز می‌توانند راهنماهای فعال‌سازی صریح را از مسیر بازگشت مالکیت مانیفست
تشخیص دهند. برای نمونه، `activation-command-hint` یعنی
`activation.onCommands` منطبق شده است، در حالی که `manifest-command-alias` یعنی
برنامه‌ریز به‌جای آن از مالکیت `commandAliases` استفاده کرده است. این برچسب‌های دلیل برای
تشخیص‌های میزبان و آزمون‌ها هستند؛ نویسندگان Plugin باید همچنان فراداده‌ای را اعلام کنند
که مالکیت را به بهترین شکل توصیف می‌کند.

## مرجع qaRunners

زمانی از `qaRunners` استفاده کنید که یک Plugin یک یا چند اجراکنندهٔ انتقال را زیر
ریشهٔ مشترک `openclaw qa` فراهم می‌کند. این فراداده را کم‌هزینه و ایستا نگه دارید؛ زمان اجرای Plugin
همچنان مالک ثبت واقعی CLI از طریق یک سطح سبک
`runtime-api.ts` است که `qaRunnerCliRegistrations` را صادر می‌کند.

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

| فیلد          | الزامی | نوع      | معنا                                                               |
| ------------- | ------ | -------- | ------------------------------------------------------------------ |
| `commandName` | بله    | `string` | زیر‌دستوری که زیر `openclaw qa` نصب می‌شود، برای مثال `matrix`.    |
| `description` | خیر    | `string` | متن راهنمای جایگزین که وقتی میزبان مشترک به دستور stub نیاز دارد استفاده می‌شود. |

## مرجع setup

از `setup` زمانی استفاده کنید که سطح‌های راه‌اندازی و ورود اولیه، پیش از بارگذاری runtime، به فراداده ارزان تحت مالکیت Plugin نیاز دارند.

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

`cliBackends` سطح بالا همچنان معتبر می‌ماند و همچنان backendهای استنتاج CLI را توصیف می‌کند. `setup.cliBackends` سطح توصیف‌گر ویژه setup برای جریان‌های control-plane/setup است که باید فقط در حد فراداده باقی بمانند.

در صورت وجود، `setup.providers` و `setup.cliBackends` سطح جست‌وجوی ترجیحی descriptor-first برای کشف setup هستند. اگر توصیف‌گر فقط Plugin نامزد را محدود کند و setup همچنان به hookهای غنی‌تر runtime در زمان setup نیاز داشته باشد، `requiresRuntime: true` را تنظیم کنید و `setup-api` را به‌عنوان مسیر اجرای جایگزین حفظ کنید.

OpenClaw همچنین `setup.providers[].envVars` را در احراز هویت عمومی provider و جست‌وجوهای env-var لحاظ می‌کند. `providerAuthEnvVars` در طول بازه deprecation همچنان از طریق یک adapter سازگاری پشتیبانی می‌شود، اما Pluginهای غیرهمراهی که هنوز از آن استفاده می‌کنند یک diagnostic مانیفست دریافت می‌کنند. Pluginهای جدید باید فراداده env مربوط به setup/status را در `setup.providers[].envVars` قرار دهند.

OpenClaw همچنین می‌تواند انتخاب‌های ساده setup را از `setup.providers[].authMethods` استخراج کند، زمانی که ورودی setup موجود نیست، یا وقتی `setup.requiresRuntime: false` اعلام می‌کند که runtime setup لازم نیست. ورودی‌های صریح `providerAuthChoices` برای برچسب‌های سفارشی، پرچم‌های CLI، دامنه onboarding، و فراداده assistant همچنان ترجیح داده می‌شوند.

`requiresRuntime: false` را فقط زمانی تنظیم کنید که این توصیف‌گرها برای سطح setup کافی باشند. OpenClaw مقدار صریح `false` را به‌عنوان یک قرارداد فقط-توصیف‌گر در نظر می‌گیرد و برای جست‌وجوی setup، `setup-api` یا `openclaw.setupEntry` را اجرا نخواهد کرد. اگر یک Plugin فقط-توصیف‌گر همچنان یکی از آن ورودی‌های runtime مربوط به setup را ارائه کند، OpenClaw یک diagnostic افزایشی گزارش می‌کند و همچنان آن را نادیده می‌گیرد. حذف `requiresRuntime` رفتار fallback قدیمی را حفظ می‌کند تا Pluginهای موجود که توصیف‌گرها را بدون این پرچم افزوده‌اند دچار شکست نشوند.

از آنجا که جست‌وجوی setup می‌تواند کد `setup-api` تحت مالکیت Plugin را اجرا کند، مقدارهای نرمال‌شده `setup.providers[].id` و `setup.cliBackends[]` باید در میان Pluginهای کشف‌شده یکتا بمانند. مالکیت مبهم به‌جای انتخاب یک برنده بر اساس ترتیب کشف، به‌صورت fail closed عمل می‌کند.

وقتی runtime مربوط به setup اجرا می‌شود، diagnosticهای رجیستری setup در صورتی descriptor drift را گزارش می‌کنند که `setup-api` یک provider یا backend CLI را ثبت کند که توصیف‌گرهای مانیفست اعلام نکرده‌اند، یا اگر یک توصیف‌گر ثبت runtime منطبق نداشته باشد. این diagnosticها افزایشی هستند و Pluginهای قدیمی را رد نمی‌کنند.

### مرجع setup.providers

| فیلد           | الزامی | نوع        | معنا                                                                                              |
| -------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | بله    | `string`   | شناسه provider که هنگام setup یا onboarding ارائه می‌شود. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید. |
| `authMethods`  | خیر    | `string[]` | شناسه‌های روش setup/auth که این provider بدون بارگذاری runtime کامل پشتیبانی می‌کند.             |
| `envVars`      | خیر    | `string[]` | Env varهایی که سطح‌های عمومی setup/status می‌توانند پیش از بارگذاری runtime Plugin بررسی کنند.    |
| `authEvidence` | خیر    | `object[]` | بررسی‌های ارزان شواهد احراز هویت محلی برای providerهایی که می‌توانند از طریق نشانگرهای غیرمحرمانه احراز هویت کنند. |

`authEvidence` برای نشانگرهای credential محلی تحت مالکیت provider است که می‌توانند بدون بارگذاری کد runtime تأیید شوند. این بررسی‌ها باید ارزان و محلی باقی بمانند: بدون فراخوانی شبکه، بدون خواندن keychain یا secret-manager، بدون فرمان shell، و بدون probeهای API provider.

ورودی‌های شواهد پشتیبانی‌شده:

| فیلد               | الزامی | نوع        | معنا                                                                                                   |
| ------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `type`             | بله    | `string`   | در حال حاضر `local-file-with-env`.                                                                     |
| `fileEnvVar`       | خیر    | `string`   | Env var حاوی مسیر صریح فایل credential.                                                               |
| `fallbackPaths`    | خیر    | `string[]` | مسیرهای فایل credential محلی که هنگام نبودن یا خالی بودن `fileEnvVar` بررسی می‌شوند. از `${HOME}` و `${APPDATA}` پشتیبانی می‌کند. |
| `requiresAnyEnv`   | خیر    | `string[]` | پیش از معتبر شدن شواهد، حداقل یکی از env varهای فهرست‌شده باید غیرخالی باشد.                         |
| `requiresAllEnv`   | خیر    | `string[]` | پیش از معتبر شدن شواهد، همه env varهای فهرست‌شده باید غیرخالی باشند.                                 |
| `credentialMarker` | بله    | `string`   | نشانگر غیرمحرمانه‌ای که هنگام وجود شواهد برگردانده می‌شود.                                           |
| `source`           | خیر    | `string`   | برچسب منبع کاربرپسند برای خروجی auth/status.                                                          |

### فیلدهای setup

| فیلد               | الزامی | نوع        | معنا                                                                                         |
| ------------------ | ------ | ---------- | -------------------------------------------------------------------------------------------- |
| `providers`        | خیر    | `object[]` | توصیف‌گرهای setup مربوط به provider که هنگام setup و onboarding ارائه می‌شوند.               |
| `cliBackends`      | خیر    | `string[]` | شناسه‌های backend زمان setup که برای جست‌وجوی setup به‌صورت descriptor-first استفاده می‌شوند. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید. |
| `configMigrations` | خیر    | `string[]` | شناسه‌های migration پیکربندی که متعلق به سطح setup این Plugin هستند.                         |
| `requiresRuntime`  | خیر    | `boolean`  | اینکه آیا setup پس از جست‌وجوی توصیف‌گر همچنان به اجرای `setup-api` نیاز دارد یا نه.         |

## مرجع uiHints

`uiHints` نگاشتی از نام فیلدهای پیکربندی به hintهای کوچک رندر است.

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

هر hint فیلد می‌تواند شامل موارد زیر باشد:

| فیلد          | نوع        | معنا                                  |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | برچسب فیلد کاربرپسند.                |
| `help`        | `string`   | متن راهنمای کوتاه.                   |
| `tags`        | `string[]` | برچسب‌های اختیاری UI.                |
| `advanced`    | `boolean`  | فیلد را به‌عنوان پیشرفته علامت‌گذاری می‌کند. |
| `sensitive`   | `boolean`  | فیلد را به‌عنوان محرمانه یا حساس علامت‌گذاری می‌کند. |
| `placeholder` | `string`   | متن placeholder برای ورودی‌های فرم.  |

## مرجع contracts

از `contracts` فقط برای فراداده مالکیت قابلیت ایستا استفاده کنید که OpenClaw می‌تواند بدون وارد کردن runtime Plugin بخواند.

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

| فیلد                             | نوع        | معنا                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | شناسه‌های factory افزونه app-server در Codex، در حال حاضر `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | شناسه‌های runtime که یک Plugin همراه ممکن است middleware نتیجه ابزار را برای آن‌ها ثبت کند. |
| `externalAuthProviders`          | `string[]` | شناسه‌های provider که hook پروفایل auth خارجی آن‌ها متعلق به این Plugin است. |
| `speechProviders`                | `string[]` | شناسه‌های provider گفتار که متعلق به این Plugin هستند.               |
| `realtimeTranscriptionProviders` | `string[]` | شناسه‌های provider رونویسی بلادرنگ که متعلق به این Plugin هستند.    |
| `realtimeVoiceProviders`         | `string[]` | شناسه‌های provider صدای بلادرنگ که متعلق به این Plugin هستند.        |
| `memoryEmbeddingProviders`       | `string[]` | شناسه‌های provider embedding حافظه که متعلق به این Plugin هستند.     |
| `mediaUnderstandingProviders`    | `string[]` | شناسه‌های provider فهم رسانه که متعلق به این Plugin هستند.           |
| `imageGenerationProviders`       | `string[]` | شناسه‌های provider تولید تصویر که متعلق به این Plugin هستند.         |
| `videoGenerationProviders`       | `string[]` | شناسه‌های provider تولید ویدئو که متعلق به این Plugin هستند.         |
| `webFetchProviders`              | `string[]` | شناسه‌های provider واکشی وب که متعلق به این Plugin هستند.            |
| `webSearchProviders`             | `string[]` | شناسه‌های provider جست‌وجوی وب که متعلق به این Plugin هستند.         |
| `migrationProviders`             | `string[]` | شناسه‌های provider واردسازی که برای `openclaw migrate` متعلق به این Plugin هستند. |
| `tools`                          | `string[]` | نام‌های ابزار agent که برای بررسی‌های قرارداد همراه متعلق به این Plugin هستند. |

`contracts.embeddedExtensionFactories` برای factoryهای افزونه فقط مخصوص app-server در Codex که همراه هستند حفظ شده است. transformهای نتیجه ابزار همراه باید به‌جای آن `contracts.agentToolResultMiddleware` را اعلام کنند و با `api.registerAgentToolResultMiddleware(...)` ثبت شوند. Pluginهای خارجی نمی‌توانند middleware نتیجه ابزار را ثبت کنند، زیرا این seam می‌تواند خروجی ابزار با اعتماد بالا را پیش از دیدن مدل بازنویسی کند.

Pluginهای provider که `resolveExternalAuthProfiles` را پیاده‌سازی می‌کنند باید `contracts.externalAuthProviders` را اعلام کنند. Pluginهای بدون این declaration همچنان از مسیر fallback سازگاری منسوخ‌شده عبور می‌کنند، اما آن fallback کندتر است و پس از بازه migration حذف خواهد شد.

Providerهای embedding حافظه همراه باید برای هر شناسه adapter که ارائه می‌کنند، از جمله adapterهای داخلی مانند `local`، `contracts.memoryEmbeddingProviders` را اعلام کنند. مسیرهای CLI مستقل از این قرارداد مانیفست استفاده می‌کنند تا پیش از آنکه runtime کامل Gateway providerها را ثبت کرده باشد، فقط Plugin مالک را بارگذاری کنند.

## مرجع mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` زمانی که یک ارائه‌دهندهٔ درک رسانه، مدل‌های پیش‌فرض، اولویت fallback احراز هویت خودکار، یا پشتیبانی بومی از سند دارد که helperهای عمومی هسته پیش از بارگذاری زمان اجرا به آن نیاز دارند. کلیدها باید در `contracts.mediaUnderstandingProviders` نیز اعلام شوند.

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

| فیلد                   | نوع                                 | معنای آن                                                                           |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قابلیت‌های رسانه‌ای که این ارائه‌دهنده در دسترس می‌گذارد.                         |
| `defaultModels`        | `Record<string, string>`            | پیش‌فرض‌های قابلیت به مدل که وقتی پیکربندی مدلی مشخص نکرده استفاده می‌شوند.       |
| `autoPriority`         | `Record<string, number>`            | عددهای پایین‌تر برای fallback خودکار ارائه‌دهنده بر اساس اعتبارنامه زودتر مرتب می‌شوند. |
| `nativeDocumentInputs` | `"pdf"[]`                           | ورودی‌های سند بومی که ارائه‌دهنده پشتیبانی می‌کند.                                 |

## مرجع channelConfigs

از `channelConfigs` زمانی استفاده کنید که یک Plugin کانال پیش از بارگذاری زمان اجرا به فرادادهٔ ارزان پیکربندی نیاز دارد. کشف راه‌اندازی/وضعیت کانال به‌صورت فقط‌خواندنی می‌تواند برای کانال‌های خارجی پیکربندی‌شده، وقتی ورودی راه‌اندازی در دسترس نیست یا وقتی `setup.requiresRuntime: false` اعلام می‌کند زمان اجرای راه‌اندازی لازم نیست، مستقیماً از این فراداده استفاده کند.

`channelConfigs` فرادادهٔ مانیفست Plugin است، نه یک بخش جدید پیکربندی کاربر در سطح بالا. کاربران همچنان نمونه‌های کانال را زیر `channels.<channel-id>` پیکربندی می‌کنند. OpenClaw فرادادهٔ مانیفست را می‌خواند تا پیش از اجرای کد زمان اجرای Plugin تصمیم بگیرد کدام Plugin مالک آن کانال پیکربندی‌شده است.

برای یک Plugin کانال، `configSchema` و `channelConfigs` مسیرهای متفاوتی را توصیف می‌کنند:

- `configSchema` مقدار `plugins.entries.<plugin-id>.config` را اعتبارسنجی می‌کند
- `channelConfigs.<channel-id>.schema` مقدار `channels.<channel-id>` را اعتبارسنجی می‌کند

Pluginهای غیرباندل‌شده‌ای که `channels[]` را اعلام می‌کنند باید ورودی‌های متناظر `channelConfigs` را نیز اعلام کنند. بدون آن‌ها، OpenClaw همچنان می‌تواند Plugin را بارگذاری کند، اما schema پیکربندی مسیر سرد، راه‌اندازی، و سطوح Control UI تا زمان اجرای زمان اجرای Plugin نمی‌توانند شکل گزینه‌های متعلق به کانال را بدانند.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و `nativeSkillsAutoEnabled` می‌توانند پیش‌فرض‌های ایستای `auto` را برای بررسی‌های پیکربندی فرمان که پیش از بارگذاری زمان اجرای کانال اجرا می‌شوند اعلام کنند. کانال‌های باندل‌شده همچنین می‌توانند همان پیش‌فرض‌ها را از طریق `package.json#openclaw.channel.commands` در کنار دیگر فرادادهٔ کاتالوگ کانال متعلق به بستهٔ خود منتشر کنند.

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

| فیلد          | نوع                      | معنای آن                                                                                         |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema برای `channels.<id>`. برای هر ورودی پیکربندی کانال اعلام‌شده الزامی است.             |
| `uiHints`     | `Record<string, object>` | برچسب‌ها/placeholderها/راهنمایی‌های حساس اختیاری UI برای آن بخش پیکربندی کانال.                  |
| `label`       | `string`                 | برچسب کانال که وقتی فرادادهٔ زمان اجرا آماده نیست در سطوح انتخاب‌گر و بازرسی ادغام می‌شود.       |
| `description` | `string`                 | توضیح کوتاه کانال برای سطوح بازرسی و کاتالوگ.                                                     |
| `commands`    | `object`                 | پیش‌فرض‌های خودکار ایستای فرمان بومی و skill بومی برای بررسی‌های پیکربندی پیش از زمان اجرا.     |
| `preferOver`  | `string[]`               | شناسه‌های Plugin قدیمی یا با اولویت پایین‌تر که این کانال باید در سطوح انتخاب از آن‌ها جلوتر باشد. |

### جایگزینی یک Plugin کانال دیگر

از `preferOver` زمانی استفاده کنید که Plugin شما مالک ترجیحی برای شناسهٔ کانالی است که Plugin دیگری نیز می‌تواند ارائه کند. موردهای رایج شامل شناسهٔ Plugin تغییرنام‌یافته، Plugin مستقلی که جایگزین یک Plugin باندل‌شده می‌شود، یا fork نگه‌داری‌شده‌ای است که برای سازگاری پیکربندی همان شناسهٔ کانال را حفظ می‌کند.

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

وقتی `channels.chat` پیکربندی شده باشد، OpenClaw هم شناسهٔ کانال و هم شناسهٔ Plugin ترجیحی را در نظر می‌گیرد. اگر Plugin با اولویت پایین‌تر فقط به این دلیل انتخاب شده باشد که باندل‌شده است یا به‌صورت پیش‌فرض فعال است، OpenClaw آن را در پیکربندی مؤثر زمان اجرا غیرفعال می‌کند تا یک Plugin مالک کانال و ابزارهای آن باشد. انتخاب صریح کاربر همچنان برنده است: اگر کاربر هر دو Plugin را صریحاً فعال کند، OpenClaw آن انتخاب را حفظ می‌کند و به‌جای تغییر بی‌صدای مجموعهٔ Pluginهای درخواست‌شده، diagnostics کانال/ابزار تکراری را گزارش می‌دهد.

`preferOver` را محدود به شناسه‌های Plugin نگه دارید که واقعاً می‌توانند همان کانال را ارائه کنند. این یک فیلد اولویت عمومی نیست و کلیدهای پیکربندی کاربر را تغییرنام نمی‌دهد.

## مرجع modelSupport

از `modelSupport` زمانی استفاده کنید که OpenClaw باید Plugin ارائه‌دهندهٔ شما را از روی شناسه‌های کوتاه مدل مانند `gpt-5.5` یا `claude-sonnet-4.6` پیش از بارگذاری زمان اجرای Plugin استنتاج کند.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw این تقدم را اعمال می‌کند:

- ارجاع‌های صریح `provider/model` از فرادادهٔ مانیفست `providers` مالک استفاده می‌کنند
- `modelPatterns` بر `modelPrefixes` غلبه می‌کند
- اگر یک Plugin غیرباندل‌شده و یک Plugin باندل‌شده هر دو تطبیق داشته باشند، Plugin غیرباندل‌شده برنده است
- ابهام باقی‌مانده تا زمانی که کاربر یا پیکربندی ارائه‌دهنده‌ای مشخص کند نادیده گرفته می‌شود

فیلدها:

| فیلد            | نوع        | معنای آن                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | پیشوندهایی که با `startsWith` در برابر شناسه‌های کوتاه مدل تطبیق داده می‌شوند. |
| `modelPatterns` | `string[]` | منابع regex که پس از حذف پسوند profile در برابر شناسه‌های کوتاه مدل تطبیق داده می‌شوند. |

## مرجع modelCatalog

از `modelCatalog` زمانی استفاده کنید که OpenClaw باید پیش از بارگذاری زمان اجرای Plugin، فرادادهٔ مدل ارائه‌دهنده را بداند. این منبع متعلق به مانیفست برای ردیف‌های ثابت کاتالوگ، aliasهای ارائه‌دهنده، قواعد سرکوب، و حالت کشف است. refresh زمان اجرا همچنان متعلق به کد زمان اجرای ارائه‌دهنده است، اما مانیفست به هسته می‌گوید چه زمانی زمان اجرا لازم است.

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

| فیلد           | نوع                                                      | معنای آن                                                                                                  |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | ردیف‌های کاتالوگ برای شناسه‌های ارائه‌دهنده که متعلق به این Plugin هستند. کلیدها باید در `providers` سطح بالا نیز ظاهر شوند. |
| `aliases`      | `Record<string, object>`                                 | aliasهای ارائه‌دهنده که باید برای برنامه‌ریزی کاتالوگ یا سرکوب به یک ارائه‌دهندهٔ متعلق resolve شوند.     |
| `suppressions` | `object[]`                                               | ردیف‌های مدل از منبعی دیگر که این Plugin به دلیلی خاص ارائه‌دهنده سرکوب می‌کند.                           |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | اینکه کاتالوگ ارائه‌دهنده می‌تواند از فرادادهٔ مانیفست خوانده شود، در cache refresh شود، یا به زمان اجرا نیاز دارد. |

`aliases` در lookup مالکیت ارائه‌دهنده برای برنامه‌ریزی model-catalog مشارکت می‌کند. هدف‌های alias باید ارائه‌دهندگان سطح بالایی باشند که متعلق به همان Plugin هستند. وقتی یک فهرست فیلترشده بر اساس ارائه‌دهنده از alias استفاده می‌کند، OpenClaw می‌تواند مانیفست مالک را بخواند و overrideهای API/base URL مربوط به alias را بدون بارگذاری زمان اجرای ارائه‌دهنده اعمال کند.
Aliasها فهرست‌های کاتالوگ فیلترنشده را گسترش نمی‌دهند؛ فهرست‌های گسترده فقط ردیف‌های ارائه‌دهندهٔ canonical مالک را منتشر می‌کنند.

`suppressions` جای hook قدیمی زمان اجرای ارائه‌دهندهٔ `suppressBuiltInModel` را می‌گیرد. ورودی‌های سرکوب فقط زمانی رعایت می‌شوند که ارائه‌دهنده متعلق به Plugin باشد یا به‌عنوان کلید `modelCatalog.aliases` اعلام شده باشد که به یک ارائه‌دهندهٔ متعلق اشاره می‌کند. hookهای سرکوب زمان اجرا دیگر هنگام resolve مدل فراخوانی نمی‌شوند.

فیلدهای ارائه‌دهنده:

| فیلد      | نوع                      | معنای آن                                                                  |
| --------- | ------------------------ | -------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL پایهٔ پیش‌فرض اختیاری برای مدل‌ها در این کاتالوگ ارائه‌دهنده.          |
| `api`     | `ModelApi`               | adapter API پیش‌فرض اختیاری برای مدل‌ها در این کاتالوگ ارائه‌دهنده.        |
| `headers` | `Record<string, string>` | headerهای ایستای اختیاری که بر این کاتالوگ ارائه‌دهنده اعمال می‌شوند.      |
| `models`  | `object[]`               | ردیف‌های مدل الزامی. ردیف‌های بدون `id` نادیده گرفته می‌شوند.              |

فیلدهای مدل:

| فیلد           | نوع                                                           | معنی آن                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | شناسهٔ مدل محلیِ ارائه‌دهنده، بدون پیشوند `provider/`.                    |
| `name`          | `string`                                                       | نام نمایشی اختیاری.                                                      |
| `api`           | `ModelApi`                                                     | بازنویسی اختیاری API برای هر مدل.                                            |
| `baseUrl`       | `string`                                                       | بازنویسی اختیاری URL پایه برای هر مدل.                                       |
| `headers`       | `Record<string, string>`                                       | سرآیندهای ایستای اختیاری برای هر مدل.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | گونه‌های ورودی‌ای که مدل می‌پذیرد.                                               |
| `reasoning`     | `boolean`                                                      | اینکه آیا مدل رفتار استدلالی را ارائه می‌کند یا نه.                               |
| `contextWindow` | `number`                                                       | پنجرهٔ زمینهٔ بومی ارائه‌دهنده.                                             |
| `contextTokens` | `number`                                                       | سقف اختیاری زمینهٔ مؤثر در زمان اجرا، وقتی با `contextWindow` متفاوت است. |
| `maxTokens`     | `number`                                                       | بیشینهٔ توکن‌های خروجی، وقتی معلوم باشد.                                           |
| `cost`          | `object`                                                       | قیمت‌گذاری اختیاری دلار آمریکا به‌ازای هر میلیون توکن، شامل `tieredPricing` اختیاری. |
| `compat`        | `object`                                                       | پرچم‌های سازگاری اختیاری مطابق با سازگاری پیکربندی مدل OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | وضعیت فهرست‌شدن. فقط وقتی ردیف اصلاً نباید نمایش داده شود، آن را حذف کنید.          |
| `statusReason`  | `string`                                                       | دلیل اختیاری که همراه با وضعیت غیرقابل‌دسترس نشان داده می‌شود.                            |
| `replaces`      | `string[]`                                                     | شناسه‌های مدل محلیِ قدیمی‌تر ارائه‌دهنده که این مدل جایگزین آن‌ها می‌شود.                       |
| `replacedBy`    | `string`                                                       | شناسهٔ مدل محلیِ جایگزین ارائه‌دهنده برای ردیف‌های منسوخ.                    |
| `tags`          | `string[]`                                                     | برچسب‌های پایدار که توسط انتخاب‌گرها و فیلترها استفاده می‌شوند.                                    |

فیلدهای حذف:

| فیلد                      | نوع       | معنی آن                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | شناسهٔ ارائه‌دهنده برای ردیف بالادستی که باید حذف شود. باید متعلق به این Plugin باشد یا به‌عنوان نام مستعار تحت مالکیت اعلام شده باشد. |
| `model`                    | `string`   | شناسهٔ مدل محلیِ ارائه‌دهنده که باید حذف شود.                                                                      |
| `reason`                   | `string`   | پیام اختیاری که وقتی ردیف حذف‌شده مستقیماً درخواست شود نشان داده می‌شود.                                     |
| `when.baseUrlHosts`        | `string[]` | فهرست اختیاری میزبان‌های URL پایهٔ مؤثر ارائه‌دهنده که پیش از اعمال حذف لازم هستند.               |
| `when.providerConfigApiIn` | `string[]` | فهرست اختیاری مقادیر دقیق `api` در پیکربندی ارائه‌دهنده که پیش از اعمال حذف لازم هستند.              |

داده‌های فقط زمان اجرا را در `modelCatalog` قرار ندهید. فقط وقتی از `static` استفاده کنید که ردیف‌های مانیفست برای سطح‌های فهرست و انتخاب‌گر فیلترشده بر اساس ارائه‌دهنده به‌اندازهٔ کافی کامل باشند تا کشف رجیستری/زمان اجرا را رد کنند. وقتی ردیف‌های مانیفست بذرها یا مکمل‌های قابل‌فهرست مفیدی هستند، اما یک تازه‌سازی/کش می‌تواند بعداً ردیف‌های بیشتری اضافه کند، از `refreshable` استفاده کنید؛ ردیف‌های قابل‌تازه‌سازی به‌تنهایی مرجعیت ندارند. وقتی OpenClaw باید زمان اجرای ارائه‌دهنده را بارگذاری کند تا فهرست را بداند، از `runtime` استفاده کنید.

## مرجع modelIdNormalization

از `modelIdNormalization` برای پاک‌سازی کم‌هزینهٔ شناسهٔ مدل تحت مالکیت ارائه‌دهنده استفاده کنید که باید پیش از بارگذاری زمان اجرای ارائه‌دهنده انجام شود. این کار نام‌های مستعاری مانند نام‌های کوتاه مدل، شناسه‌های قدیمی محلیِ ارائه‌دهنده، و قواعد پیشوند پروکسی را به‌جای جدول‌های مرکزی انتخاب مدل، در مانیفست Plugin مالک نگه می‌دارد.

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

| فیلد                                | نوع                    | معنی آن                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | نام‌های مستعار دقیق شناسهٔ مدل، بدون حساسیت به بزرگی و کوچکی حروف. مقدارها همان‌طور که نوشته شده‌اند برگردانده می‌شوند.                  |
| `stripPrefixes`                      | `string[]`              | پیشوندهایی که پیش از جست‌وجوی نام مستعار حذف می‌شوند؛ برای تکرار قدیمی ارائه‌دهنده/مدل مفید است.     |
| `prefixWhenBare`                     | `string`                | پیشوندی که وقتی شناسهٔ مدل نرمال‌شده از قبل شامل `/` نیست اضافه می‌شود.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | قواعد شرطی پیشوند برای شناسهٔ بدون پیشوند پس از جست‌وجوی نام مستعار، با کلیدهای `modelPrefix` و `prefix`. |

## مرجع providerEndpoints

از `providerEndpoints` برای طبقه‌بندی نقطهٔ پایانی استفاده کنید که خط‌مشی عمومی درخواست باید پیش از بارگذاری زمان اجرای ارائه‌دهنده بداند. هسته همچنان معنی هر `endpointClass` را مالک است؛ مانیفست‌های Plugin مالک فرادادهٔ میزبان و URL پایه هستند.

فیلدهای نقطهٔ پایانی:

| فیلد                          | نوع       | معنی آن                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | کلاس نقطهٔ پایانی شناخته‌شدهٔ هسته، مانند `openrouter`، `moonshot-native`، یا `google-vertex`.        |
| `hosts`                        | `string[]` | نام‌های میزبان دقیق که به کلاس نقطهٔ پایانی نگاشت می‌شوند.                                                |
| `hostSuffixes`                 | `string[]` | پسوندهای میزبان که به کلاس نقطهٔ پایانی نگاشت می‌شوند. برای تطبیق فقط پسوند دامنه با `.` شروع کنید. |
| `baseUrls`                     | `string[]` | URLهای پایهٔ HTTP(S) نرمال‌شدهٔ دقیق که به کلاس نقطهٔ پایانی نگاشت می‌شوند.                             |
| `googleVertexRegion`           | `string`   | منطقهٔ ایستای Google Vertex برای میزبان‌های جهانی دقیق.                                            |
| `googleVertexRegionHostSuffix` | `string`   | پسوندی که از میزبان‌های مطابق حذف می‌شود تا پیشوند منطقهٔ Google Vertex آشکار شود.                 |

## مرجع providerRequest

از `providerRequest` برای فرادادهٔ کم‌هزینهٔ سازگاری درخواست استفاده کنید که خط‌مشی عمومی درخواست بدون بارگذاری زمان اجرای ارائه‌دهنده به آن نیاز دارد. بازنویسی محتوای خاصِ رفتار را در قلاب‌های زمان اجرای ارائه‌دهنده یا کمک‌کننده‌های مشترک خانوادهٔ ارائه‌دهنده نگه دارید.

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
| `family`              | `string`     | برچسب خانوادهٔ ارائه‌دهنده که در تصمیم‌های عمومی سازگاری درخواست و عیب‌یابی استفاده می‌شود. |
| `compatibilityFamily` | `"moonshot"` | سبد اختیاری سازگاری خانوادهٔ ارائه‌دهنده برای کمک‌کننده‌های مشترک درخواست.              |
| `openAICompletions`   | `object`     | پرچم‌های درخواست تکمیل‌های سازگار با OpenAI، در حال حاضر `supportsStreamingUsage`.       |

## مرجع modelPricing

وقتی یک ارائه‌دهنده پیش از بارگذاری زمان اجرا به رفتار قیمت‌گذاری در سطح کنترل نیاز دارد، از `modelPricing` استفاده کنید. کش قیمت‌گذاری Gateway این فراداده را بدون وارد کردن کد زمان اجرای ارائه‌دهنده می‌خواند.

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
| `external`   | `boolean`         | برای ارائه‌دهندگان محلی/خودمیزبان که هرگز نباید قیمت‌گذاری OpenRouter یا LiteLLM را دریافت کنند، روی `false` تنظیم کنید. |
| `openRouter` | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری OpenRouter. مقدار `false` جست‌وجوی OpenRouter را برای این ارائه‌دهنده غیرفعال می‌کند.           |
| `liteLLM`    | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری LiteLLM. مقدار `false` جست‌وجوی LiteLLM را برای این ارائه‌دهنده غیرفعال می‌کند.                 |

فیلدهای منبع:

| فیلد                      | نوع               | معنی آن                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | شناسهٔ ارائه‌دهندهٔ کاتالوگ خارجی، وقتی با شناسهٔ ارائه‌دهندهٔ OpenClaw متفاوت است؛ برای مثال `z-ai` برای ارائه‌دهندهٔ `zai`. |
| `passthroughProviderModel` | `boolean`          | شناسه‌های مدلِ دارای اسلش را به‌عنوان ارجاع‌های تودرتوی ارائه‌دهنده/مدل در نظر بگیرید؛ برای ارائه‌دهندگان پروکسی مانند OpenRouter مفید است.       |
| `modelIdTransforms`        | `"version-dots"[]` | گونه‌های اضافی شناسهٔ مدل در کاتالوگ خارجی. `version-dots` شناسه‌های نسخهٔ نقطه‌دار مانند `claude-opus-4.6` را امتحان می‌کند.            |

### شاخص ارائه‌دهندگان OpenClaw

شاخص ارائه‌دهندگان OpenClaw فرادادهٔ پیش‌نمایشِ تحت مالکیت OpenClaw برای ارائه‌دهندگانی است که ممکن است Pluginهایشان هنوز نصب نشده باشد. این بخشی از مانیفست Plugin نیست. مانیفست‌های Plugin همچنان مرجع Plugin نصب‌شده هستند. شاخص ارائه‌دهندگان قرارداد جایگزین داخلی است که سطح‌های آیندهٔ انتخاب‌گر مدل برای ارائه‌دهندهٔ قابل‌نصب و پیش از نصب، وقتی Plugin ارائه‌دهنده نصب نیست، از آن استفاده خواهند کرد.

ترتیب مرجعیت کاتالوگ:

1. پیکربندی کاربر.
2. `modelCatalog` در مانیفست Plugin نصب‌شده.
3. کش کاتالوگ مدل از تازه‌سازی صریح.
4. ردیف‌های پیش‌نمایش شاخص ارائه‌دهندگان OpenClaw.

نمایهٔ ارائه‌دهنده نباید حاوی اسرار، وضعیت فعال‌بودن، قلاب‌های زمان اجرا، یا
داده‌های زندهٔ مدلِ مختص حساب باشد. کاتالوگ‌های پیش‌نمایش آن از همان شکل ردیف
ارائه‌دهندهٔ `modelCatalog` که در مانیفست‌های Plugin استفاده می‌شود بهره می‌برند،
اما باید به فرادادهٔ نمایشی پایدار محدود بمانند، مگر اینکه فیلدهای آداپتور زمان اجرا
مانند `api`، `baseUrl`، قیمت‌گذاری، یا پرچم‌های سازگاری عمداً با
مانیفست Plugin نصب‌شده هم‌راستا نگه داشته شوند. ارائه‌دهندگانی که کشف زندهٔ
`/models` دارند باید ردیف‌های تازه‌سازی‌شده را از مسیر صریح کش کاتالوگ مدل بنویسند،
نه اینکه فهرست‌کردن معمولی یا راه‌اندازی اولیه، APIهای ارائه‌دهنده را فراخوانی کند.

ورودی‌های نمایهٔ ارائه‌دهنده همچنین می‌توانند فرادادهٔ Plugin قابل‌نصب را برای
ارائه‌دهندگانی حمل کنند که Plugin آن‌ها از هسته خارج شده یا هنوز به هر دلیل نصب
نشده است. این فراداده الگوی کاتالوگ کانال را بازتاب می‌دهد: نام بسته، مشخصهٔ نصب
npm، یکپارچگی مورد انتظار، و برچسب‌های کم‌هزینهٔ انتخاب احراز هویت برای نمایش
گزینهٔ راه‌اندازی قابل‌نصب کافی هستند. پس از نصب Plugin، مانیفست آن اولویت دارد و
ورودی نمایهٔ ارائه‌دهنده برای آن ارائه‌دهنده نادیده گرفته می‌شود.

کلیدهای قابلیت سطح‌بالای قدیمی منسوخ شده‌اند. از `openclaw doctor --fix` برای
انتقال `speechProviders`، `realtimeTranscriptionProviders`،
`realtimeVoiceProviders`، `mediaUnderstandingProviders`،
`imageGenerationProviders`، `videoGenerationProviders`،
`webFetchProviders`، و `webSearchProviders` به زیر `contracts` استفاده کنید؛
بارگذاری عادی مانیفست دیگر این فیلدهای سطح‌بالا را به‌عنوان مالکیت قابلیت در نظر
نمی‌گیرد.

## مانیفست در برابر package.json

این دو فایل کارهای متفاوتی انجام می‌دهند:

| فایل                   | کاربرد آن                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | کشف، اعتبارسنجی پیکربندی، فرادادهٔ انتخاب احراز هویت، و راهنماهای UI که باید پیش از اجرای کد Plugin وجود داشته باشند                         |
| `package.json`         | فرادادهٔ npm، نصب وابستگی‌ها، و بلوک `openclaw` که برای نقاط ورود، کنترل نصب، راه‌اندازی، یا فرادادهٔ کاتالوگ استفاده می‌شود |

اگر مطمئن نیستید یک قطعه فراداده کجا باید قرار بگیرد، از این قاعده استفاده کنید:

- اگر OpenClaw باید آن را پیش از بارگذاری کد Plugin بداند، آن را در `openclaw.plugin.json` قرار دهید
- اگر دربارهٔ بسته‌بندی، فایل‌های ورودی، یا رفتار نصب npm است، آن را در `package.json` قرار دهید

### فیلدهای package.json که بر کشف اثر می‌گذارند

بخشی از فرادادهٔ پیش از زمان اجرای Plugin عمداً در `package.json` زیر بلوک
`openclaw` زندگی می‌کند، نه در `openclaw.plugin.json`.

نمونه‌های مهم:

| فیلد                                                             | معنی آن                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | نقاط ورود بومی Plugin را اعلام می‌کند. باید داخل دایرکتوری بستهٔ Plugin باقی بماند.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | نقاط ورود زمان اجرای JavaScript ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. باید داخل دایرکتوری بستهٔ Plugin باقی بماند.                                                                 |
| `openclaw.setupEntry`                                             | نقطهٔ ورود سبکِ فقط برای راه‌اندازی که هنگام راه‌اندازی اولیه، شروع به‌تعویق‌افتادهٔ کانال، و کشف وضعیت کانال فقط‌خواندنی/SecretRef استفاده می‌شود. باید داخل دایرکتوری بستهٔ Plugin باقی بماند. |
| `openclaw.runtimeSetupEntry`                                      | نقطهٔ ورود راه‌اندازی JavaScript ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. باید داخل دایرکتوری بستهٔ Plugin باقی بماند.                                                                |
| `openclaw.channel`                                                | فرادادهٔ کم‌هزینهٔ کاتالوگ کانال مانند برچسب‌ها، مسیرهای مستندات، نام‌های مستعار، و متن انتخاب.                                                                                                 |
| `openclaw.channel.commands`                                       | فرادادهٔ ایستای فرمان بومی و پیش‌فرض خودکار skill بومی که پیش از بارگذاری زمان اجرای کانال توسط سطوح پیکربندی، حسابرسی، و فهرست فرمان استفاده می‌شود.                                          |
| `openclaw.channel.configuredState`                                | فرادادهٔ سبکِ بررسی‌کنندهٔ وضعیت پیکربندی‌شده که می‌تواند بدون بارگذاری زمان اجرای کامل کانال پاسخ دهد «آیا راه‌اندازی فقط مبتنی بر env از قبل وجود دارد؟».                                         |
| `openclaw.channel.persistedAuthState`                             | فرادادهٔ سبکِ بررسی‌کنندهٔ احراز هویت پایدارشده که می‌تواند بدون بارگذاری زمان اجرای کامل کانال پاسخ دهد «آیا چیزی از قبل وارد شده است؟».                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | راهنماهای نصب/به‌روزرسانی برای Pluginهای همراه و منتشرشدهٔ خارجی.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | مسیر نصب ترجیحی وقتی چند منبع نصب در دسترس است.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | حداقل نسخهٔ پشتیبانی‌شدهٔ میزبان OpenClaw، با استفاده از کف semver مانند `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | رشتهٔ یکپارچگی مورد انتظار توزیع npm مانند `sha512-...`؛ جریان‌های نصب و به‌روزرسانی آرتیفکت دریافت‌شده را در برابر آن بررسی می‌کنند.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | یک مسیر بازیابی نصب مجدد محدود برای Plugin همراه را وقتی پیکربندی نامعتبر است مجاز می‌کند.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | اجازه می‌دهد سطوح کانال فقط برای راه‌اندازی، پیش از Plugin کامل کانال هنگام شروع، بارگذاری شوند.                                                                                                 |

فرادادهٔ مانیفست تعیین می‌کند کدام انتخاب‌های ارائه‌دهنده/کانال/راه‌اندازی در
راه‌اندازی اولیه پیش از بارگذاری زمان اجرا ظاهر شوند. `package.json#openclaw.install` به
راه‌اندازی اولیه می‌گوید وقتی کاربر یکی از آن انتخاب‌ها را برمی‌گزیند، چگونه آن
Plugin را دریافت یا فعال کند. راهنماهای نصب را به `openclaw.plugin.json` منتقل نکنید.

`openclaw.install.minHostVersion` هنگام نصب و بارگذاری رجیستری مانیفست اعمال
می‌شود. مقدارهای نامعتبر رد می‌شوند؛ مقدارهای جدیدتر اما معتبر باعث می‌شوند
Plugin روی میزبان‌های قدیمی‌تر رد شود.

پین‌کردن دقیق نسخهٔ npm از قبل در `npmSpec` قرار دارد، برای نمونه
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. ورودی‌های رسمی کاتالوگ خارجی
باید مشخصه‌های دقیق را با `expectedIntegrity` همراه کنند تا اگر آرتیفکت دریافت‌شدهٔ
npm دیگر با انتشار پین‌شده مطابقت نداشت، جریان‌های به‌روزرسانی بسته و ناموفق شوند.
راه‌اندازی اولیهٔ تعاملی همچنان برای سازگاری، مشخصه‌های npm رجیستری معتمد، از جمله
نام‌های خام بسته و dist-tagها را پیشنهاد می‌دهد. عیب‌یابی کاتالوگ می‌تواند منابع
دقیق، شناور، پین‌شده با یکپارچگی، فاقد یکپارچگی، دارای ناهماهنگی نام بسته، و
انتخاب پیش‌فرض نامعتبر را از هم تفکیک کند. همچنین وقتی `expectedIntegrity` حاضر
است اما منبع npm معتبری وجود ندارد که بتواند به آن پین شود، هشدار می‌دهد.
وقتی `expectedIntegrity` حاضر است،
جریان‌های نصب/به‌روزرسانی آن را اعمال می‌کنند؛ وقتی حذف شده باشد، حل رجیستری بدون
پین یکپارچگی ثبت می‌شود.

Pluginهای کانال باید وقتی وضعیت، فهرست کانال، یا اسکن‌های SecretRef نیاز دارند
حساب‌های پیکربندی‌شده را بدون بارگذاری زمان اجرای کامل شناسایی کنند،
`openclaw.setupEntry` ارائه دهند. ورودی راه‌اندازی باید فرادادهٔ کانال به‌همراه
آداپتورهای پیکربندی، وضعیت، و اسرار امن برای راه‌اندازی را در معرض بگذارد؛ کلاینت‌های
شبکه، شنونده‌های Gateway، و زمان‌اجراهای انتقال را در نقطهٔ ورود اصلی افزونه نگه دارید.

فیلدهای نقطهٔ ورود زمان اجرا، بررسی‌های مرز بسته را برای فیلدهای نقطهٔ ورود منبع
لغو نمی‌کنند. برای مثال، `openclaw.runtimeExtensions` نمی‌تواند یک مسیر
`openclaw.extensions` خارج‌شونده را قابل‌بارگذاری کند.

`openclaw.install.allowInvalidConfigRecovery` عمداً محدود است. این گزینه
پیکربندی‌های خراب دلخواه را قابل‌نصب نمی‌کند. امروز فقط به جریان‌های نصب اجازه
می‌دهد از شکست‌های مشخص و کهنهٔ ارتقای Plugin همراه بازیابی شوند، مانند مسیر
گم‌شدهٔ Plugin همراه یا ورودی کهنهٔ `channels.<id>` برای همان Plugin همراه.
خطاهای نامرتبط پیکربندی همچنان نصب را مسدود می‌کنند و اپراتورها را به
`openclaw doctor --fix` می‌فرستند.

`openclaw.channel.persistedAuthState` فرادادهٔ بسته برای یک ماژول بررسی‌کنندهٔ
کوچک است:

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

وقتی جریان‌های راه‌اندازی، doctor، وضعیت، یا حضور فقط‌خواندنی به یک کاوش
کم‌هزینهٔ بله/خیر برای احراز هویت پیش از بارگذاری Plugin کامل کانال نیاز دارند،
از آن استفاده کنید. وضعیت احراز هویت پایدارشده همان وضعیت کانال پیکربندی‌شده نیست:
از این فراداده برای فعال‌سازی خودکار Pluginها، ترمیم وابستگی‌های زمان اجرا، یا
تصمیم‌گیری دربارهٔ اینکه آیا زمان اجرای کانال باید بارگذاری شود استفاده نکنید.
خروجی هدف باید تابع کوچکی باشد که فقط وضعیت پایدارشده را می‌خواند؛ آن را از مسیر
barrel کامل زمان اجرای کانال عبور ندهید.

`openclaw.channel.configuredState` برای بررسی‌های کم‌هزینهٔ پیکربندی‌شدهٔ فقط
مبتنی بر env همین شکل را دنبال می‌کند:

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

وقتی یک کانال می‌تواند وضعیت پیکربندی‌شده را از env یا ورودی‌های کوچک دیگرِ
غیرزمان‌اجرا پاسخ دهد، از آن استفاده کنید. اگر بررسی به حل کامل پیکربندی یا زمان
اجرای واقعی کانال نیاز دارد، آن منطق را در قلاب `config.hasConfiguredState`
Plugin نگه دارید.

## اولویت کشف (شناسه‌های تکراری Plugin)

OpenClaw، Pluginها را از چند ریشه کشف می‌کند (همراه، نصب سراسری، workspace، مسیرهای صریح انتخاب‌شده در پیکربندی). اگر دو کشف `id` یکسانی داشته باشند، فقط مانیفست با **بالاترین اولویت** نگه داشته می‌شود؛ نسخه‌های تکراری با اولویت پایین‌تر به‌جای اینکه کنار آن بارگذاری شوند، حذف می‌شوند.

اولویت، از بیشترین به کمترین:

1. **انتخاب‌شده در پیکربندی** — مسیری که صراحتاً در `plugins.entries.<id>` پین شده است
2. **همراه** — Pluginهایی که با OpenClaw ارائه می‌شوند
3. **نصب سراسری** — Pluginهایی که در ریشهٔ سراسری Pluginهای OpenClaw نصب شده‌اند
4. **Workspace** — Pluginهایی که نسبت به workspace فعلی کشف شده‌اند

پیامدها:

- یک کپی fork شده یا کهنه از یک Plugin همراه که در workspace قرار دارد، build همراه را پنهان نمی‌کند.
- برای اینکه واقعاً یک Plugin همراه را با نمونهٔ محلی جایگزین کنید، آن را از طریق `plugins.entries.<id>` پین کنید تا با اولویت برنده شود، نه اینکه به کشف workspace تکیه کنید.
- حذف نسخه‌های تکراری ثبت می‌شود تا Doctor و عیب‌یابی شروع بتوانند به کپی کنارگذاشته‌شده اشاره کنند.

## الزامات JSON Schema

- **هر Plugin باید یک JSON Schema ارائه کند**، حتی اگر هیچ پیکربندی‌ای نپذیرد.
- یک schema خالی قابل قبول است (برای مثال، `{ "type": "object", "additionalProperties": false }`).
- Schemaها هنگام خواندن/نوشتن پیکربندی اعتبارسنجی می‌شوند، نه در زمان اجرا.

## رفتار اعتبارسنجی

- کلیدهای ناشناخته‌ی `channels.*` **خطا** هستند، مگر اینکه شناسه‌ی کانال توسط
  یک مانیفست Plugin اعلام شده باشد.
- `plugins.entries.<id>`، `plugins.allow`، `plugins.deny`، و `plugins.slots.*`
  باید به شناسه‌های Plugin **قابل کشف** ارجاع دهند. شناسه‌های ناشناخته **خطا** هستند.
- اگر یک Plugin نصب شده باشد اما مانیفست یا اسکیمای خراب یا گمشده داشته باشد،
  اعتبارسنجی شکست می‌خورد و Doctor خطای Plugin را گزارش می‌کند.
- اگر پیکربندی Plugin وجود داشته باشد اما Plugin **غیرفعال** باشد، پیکربندی نگه داشته می‌شود و
  یک **هشدار** در Doctor + لاگ‌ها نمایش داده می‌شود.

برای اسکیمای کامل `plugins.*`، [مرجع پیکربندی](/fa/gateway/configuration) را ببینید.

## یادداشت‌ها

- مانیفست برای **Pluginهای بومی OpenClaw**، از جمله بارگذاری‌های سیستم فایل محلی، **الزامی** است. زمان اجرا همچنان ماژول Plugin را جداگانه بارگذاری می‌کند؛ مانیفست فقط برای کشف + اعتبارسنجی است.
- مانیفست‌های بومی با JSON5 تجزیه می‌شوند، بنابراین کامنت‌ها، ویرگول‌های انتهایی، و کلیدهای بدون نقل‌قول پذیرفته می‌شوند، تا زمانی که مقدار نهایی همچنان یک آبجکت باشد.
- فقط فیلدهای مستندشده‌ی مانیفست توسط بارگذار مانیفست خوانده می‌شوند. از کلیدهای سفارشی در سطح بالا پرهیز کنید.
- `channels`، `providers`، `cliBackends`، و `skills` همگی می‌توانند حذف شوند وقتی یک Plugin به آن‌ها نیاز ندارد.
- `providerDiscoveryEntry` باید سبک بماند و نباید کد گسترده‌ی زمان اجرا را import کند؛ از آن برای فراداده‌ی ایستای کاتالوگ ارائه‌دهنده یا توصیفگرهای محدود کشف استفاده کنید، نه اجرای زمان درخواست.
- انواع انحصاری Plugin از طریق `plugins.slots.*` انتخاب می‌شوند: `kind: "memory"` از طریق `plugins.slots.memory`، و `kind: "context-engine"` از طریق `plugins.slots.contextEngine` (پیش‌فرض `legacy`).
- نوع انحصاری Plugin را در این مانیفست اعلام کنید. `OpenClawPluginDefinition.kind` در ورودی زمان اجرا منسوخ شده و فقط به‌عنوان fallback سازگاری برای Pluginهای قدیمی‌تر باقی مانده است.
- فراداده‌ی متغیر محیطی (`setup.providers[].envVars`، `providerAuthEnvVars` منسوخ‌شده، و `channelEnvVars`) فقط اعلامی است. وضعیت، حسابرسی، اعتبارسنجی تحویل cron، و دیگر سطوح فقط‌خواندنی همچنان سیاست اعتماد Plugin و فعال‌سازی مؤثر را پیش از اینکه یک متغیر محیطی را پیکربندی‌شده تلقی کنند، اعمال می‌کنند.
- برای فراداده‌ی ویزارد زمان اجرا که به کد ارائه‌دهنده نیاز دارد، [hookهای زمان اجرای ارائه‌دهنده](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
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
    مرجع SDK Plugin و importهای subpath.
  </Card>
</CardGroup>
