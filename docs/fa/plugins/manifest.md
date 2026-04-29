---
read_when:
    - شما در حال ساخت یک Plugin برای OpenClaw هستید
    - باید یک طرح‌وارهٔ پیکربندی Plugin ارائه کنید یا خطاهای اعتبارسنجی Plugin را اشکال‌زدایی کنید
summary: مانیفست Plugin + الزامات طرح‌واره JSON (اعتبارسنجی سخت‌گیرانه پیکربندی)
title: مانیفست Plugin
x-i18n:
    generated_at: "2026-04-29T23:15:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a529f9d4388039d76a6e351b454622b657a1ddcd4f4159f10be988568343cc2
    source_path: plugins/manifest.md
    workflow: 16
---

این صفحه فقط برای **مانیفست بومی Plugin OpenClaw** است.

برای چیدمان‌های بستهٔ سازگار، [بسته‌های Plugin](/fa/plugins/bundles) را ببینید.

قالب‌های بستهٔ سازگار از فایل‌های مانیفست متفاوتی استفاده می‌کنند:

- بستهٔ Codex: `.codex-plugin/plugin.json`
- بستهٔ Claude: `.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفهٔ Claude
  بدون مانیفست
- بستهٔ Cursor: `.cursor-plugin/plugin.json`

OpenClaw این چیدمان‌های بسته را نیز به‌صورت خودکار تشخیص می‌دهد، اما آن‌ها بر اساس
طرح‌وارهٔ `openclaw.plugin.json` که اینجا توضیح داده شده اعتبارسنجی نمی‌شوند.

برای بسته‌های سازگار، OpenClaw در حال حاضر فرادادهٔ بسته به‌همراه ریشه‌های Skills اعلام‌شده،
ریشه‌های دستور Claude، پیش‌فرض‌های `settings.json` بستهٔ Claude،
پیش‌فرض‌های LSP بستهٔ Claude، و بسته‌های hook پشتیبانی‌شده را وقتی چیدمان با
انتظارات زمان اجرای OpenClaw سازگار باشد می‌خواند.

هر Plugin بومی OpenClaw **باید** یک فایل `openclaw.plugin.json` را در
**ریشهٔ Plugin** ارائه کند. OpenClaw از این مانیفست برای اعتبارسنجی پیکربندی
**بدون اجرای کد Plugin** استفاده می‌کند. مانیفست‌های مفقود یا نامعتبر به‌عنوان
خطاهای Plugin در نظر گرفته می‌شوند و اعتبارسنجی پیکربندی را مسدود می‌کنند.

راهنمای کامل سامانهٔ Plugin را ببینید: [Plugins](/fa/tools/plugin).
برای مدل قابلیت بومی و راهنمای فعلی سازگاری خارجی:
[مدل قابلیت](/fa/plugins/architecture#public-capability-model).

## این فایل چه کاری انجام می‌دهد

`openclaw.plugin.json` فراداده‌ای است که OpenClaw **پیش از بارگذاری کد
Plugin شما** می‌خواند. همهٔ موارد زیر باید آن‌قدر کم‌هزینه باشند که بدون راه‌اندازی
زمان اجرای Plugin قابل بررسی باشند.

**برای این موارد استفاده کنید:**

- هویت Plugin، اعتبارسنجی پیکربندی، و راهنمایی‌های UI پیکربندی
- فرادادهٔ احراز هویت، راه‌اندازی اولیه، و آماده‌سازی (نام مستعار، فعال‌سازی خودکار، متغیرهای محیطی ارائه‌دهنده، گزینه‌های احراز هویت)
- راهنمایی‌های فعال‌سازی برای سطوح control-plane
- مالکیت کوتاه‌نویسی خانوادهٔ مدل
- نماهای ایستای مالکیت قابلیت (`contracts`)
- فرادادهٔ runner کنترل کیفیت که میزبان مشترک `openclaw qa` می‌تواند بررسی کند
- فرادادهٔ پیکربندی ویژهٔ کانال که در سطوح کاتالوگ و اعتبارسنجی ادغام می‌شود

**برای این موارد استفاده نکنید:** ثبت رفتار زمان اجرا، اعلام نقطه‌های ورود کد،
یا فرادادهٔ نصب npm. این موارد به کد Plugin شما و `package.json` تعلق دارند.

## نمونهٔ کمینه

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

## نمونهٔ کامل

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
| `id`                                 | بله      | `string`                         | شناسهٔ متعارف Plugin. این همان شناسه‌ای است که در `plugins.entries.<id>` استفاده می‌شود.                                                                                                                                                               |
| `configSchema`                       | بله      | `object`                         | JSON Schema درون‌خطی برای پیکربندی این Plugin.                                                                                                                                                                                      |
| `enabledByDefault`                   | خیر       | `true`                           | یک Plugin همراه را به‌صورت پیش‌فرض فعال علامت‌گذاری می‌کند. برای غیرفعال ماندن پیش‌فرض Plugin، آن را حذف کنید یا هر مقدار غیر از `true` تنظیم کنید.                                                                                                      |
| `legacyPluginIds`                    | خیر       | `string[]`                       | شناسه‌های قدیمی که به این شناسهٔ متعارف Plugin نرمال‌سازی می‌شوند.                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده‌ای که وقتی ارجاع‌های احراز هویت، پیکربندی یا مدل به آن‌ها اشاره می‌کنند، باید این Plugin را به‌طور خودکار فعال کنند.                                                                                                                                   |
| `kind`                               | خیر       | `"memory"` \| `"context-engine"` | نوع انحصاری Plugin را اعلام می‌کند که توسط `plugins.slots.*` استفاده می‌شود.                                                                                                                                                                      |
| `channels`                           | خیر       | `string[]`                       | شناسه‌های کانال متعلق به این Plugin. برای کشف و اعتبارسنجی پیکربندی استفاده می‌شود.                                                                                                                                                       |
| `providers`                          | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده متعلق به این Plugin.                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | خیر       | `string`                         | مسیر ماژول سبک کشف ارائه‌دهنده، نسبت به ریشهٔ Plugin، برای فرادادهٔ کاتالوگ ارائه‌دهنده در محدودهٔ مانیفست که می‌تواند بدون فعال‌سازی کامل زمان اجرای Plugin بارگذاری شود.                                             |
| `modelSupport`                       | خیر       | `object`                         | فرادادهٔ کوتاه خانوادهٔ مدل متعلق به مانیفست که برای بارگذاری خودکار Plugin پیش از زمان اجرا استفاده می‌شود.                                                                                                                                       |
| `modelCatalog`                       | خیر       | `object`                         | فرادادهٔ اعلانی کاتالوگ مدل برای ارائه‌دهنده‌های متعلق به این Plugin. این قرارداد سطح کنترل برای فهرست‌کردن فقط‌خواندنی آینده، راه‌اندازی، انتخابگرهای مدل، نام‌های مستعار و سرکوب بدون بارگذاری زمان اجرای Plugin است.       |
| `modelPricing`                       | خیر       | `object`                         | سیاست جست‌وجوی قیمت‌گذاری خارجی متعلق به ارائه‌دهنده. از آن برای مستثنی‌کردن ارائه‌دهنده‌های محلی/خودمیزبان از کاتالوگ‌های قیمت‌گذاری دوردست یا نگاشت ارجاع‌های ارائه‌دهنده به شناسه‌های کاتالوگ OpenRouter/LiteLLM بدون کدنویسی سخت شناسه‌های ارائه‌دهنده در هسته استفاده کنید.           |
| `modelIdNormalization`               | خیر       | `object`                         | پاک‌سازی نام مستعار/پیشوند شناسهٔ مدل متعلق به ارائه‌دهنده که باید پیش از بارگذاری زمان اجرای ارائه‌دهنده اجرا شود.                                                                                                                                         |
| `providerEndpoints`                  | خیر       | `object[]`                       | فرادادهٔ host/baseUrl نقطهٔ پایانی متعلق به مانیفست برای مسیرهای ارائه‌دهنده که هسته باید پیش از بارگذاری زمان اجرای ارائه‌دهنده آن‌ها را طبقه‌بندی کند.                                                                                                          |
| `providerRequest`                    | خیر       | `object`                         | فرادادهٔ ارزان خانوادهٔ ارائه‌دهنده و سازگاری درخواست که توسط سیاست درخواست عمومی پیش از بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌شود.                                                                                                            |
| `cliBackends`                        | خیر       | `string[]`                       | شناسه‌های بک‌اند استنتاج CLI متعلق به این Plugin. برای فعال‌سازی خودکار هنگام راه‌اندازی از ارجاع‌های صریح پیکربندی استفاده می‌شود.                                                                                                                       |
| `syntheticAuthRefs`                  | خیر       | `string[]`                       | ارجاع‌های ارائه‌دهنده یا بک‌اند CLI که hook احراز هویت مصنوعی متعلق به Plugin آن‌ها باید در طول کشف سرد مدل پیش از بارگذاری زمان اجرا بررسی شود.                                                                                            |
| `nonSecretAuthMarkers`               | خیر       | `string[]`                       | مقدارهای placeholder کلید API متعلق به Plugin همراه که وضعیت اعتبارنامهٔ غیرمحرمانهٔ محلی، OAuth یا محیطی را نشان می‌دهند.                                                                                                              |
| `commandAliases`                     | خیر       | `object[]`                       | نام‌های دستور متعلق به این Plugin که باید پیش از بارگذاری زمان اجرا، تشخیص‌های پیکربندی و CLI آگاه از Plugin تولید کنند.                                                                                                              |
| `providerAuthEnvVars`                | خیر       | `Record<string, string[]>`       | فرادادهٔ سازگاری منسوخ env برای جست‌وجوی احراز هویت/وضعیت ارائه‌دهنده. برای Pluginهای جدید، `setup.providers[].envVars` را ترجیح دهید؛ OpenClaw هنوز در طول بازهٔ منسوخ‌سازی این را می‌خواند.                                               |
| `providerAuthAliases`                | خیر       | `Record<string, string>`         | شناسه‌های ارائه‌دهنده‌ای که باید از شناسهٔ ارائه‌دهندهٔ دیگری برای جست‌وجوی احراز هویت دوباره استفاده کنند، برای مثال یک ارائه‌دهندهٔ کدنویسی که کلید API ارائه‌دهندهٔ پایه و پروفایل‌های احراز هویت را به اشتراک می‌گذارد.                                                                        |
| `channelEnvVars`                     | خیر       | `Record<string, string[]>`       | فرادادهٔ ارزان env کانال که OpenClaw می‌تواند بدون بارگذاری کد Plugin بررسی کند. از این برای راه‌اندازی کانال مبتنی بر env یا سطوح احراز هویتی استفاده کنید که کمک‌کننده‌های عمومی راه‌اندازی/پیکربندی باید ببینند.                                          |
| `providerAuthChoices`                | خیر       | `object[]`                       | فرادادهٔ ارزان انتخاب احراز هویت برای انتخابگرهای راه‌اندازی، حل ارائه‌دهندهٔ ترجیحی و سیم‌کشی سادهٔ پرچم CLI.                                                                                                                     |
| `activation`                         | خیر       | `object`                         | فرادادهٔ ارزان برنامه‌ریز فعال‌سازی برای بارگذاری ناشی از راه‌اندازی، ارائه‌دهنده، دستور، کانال، مسیر و قابلیت. فقط فراداده است؛ زمان اجرای Plugin همچنان مالک رفتار واقعی است.                                                     |
| `setup`                              | خیر       | `object`                         | توصیف‌گرهای ارزان راه‌اندازی/آنبوردینگ که سطوح کشف و راه‌اندازی می‌توانند بدون بارگذاری زمان اجرای Plugin بررسی کنند.                                                                                                                  |
| `qaRunners`                          | خیر       | `object[]`                       | توصیف‌گرهای ارزان runner تضمین کیفیت که توسط میزبان مشترک `openclaw qa` پیش از بارگذاری زمان اجرای Plugin استفاده می‌شوند.                                                                                                                                    |
| `contracts`                          | خیر       | `object`                         | نماگرفت ایستای قابلیت همراه برای hookهای احراز هویت خارجی، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید موسیقی، تولید ویدئو، واکشی وب، جست‌وجوی وب و مالکیت ابزار. |
| `mediaUnderstandingProviderMetadata` | خیر       | `Record<string, object>`         | پیش‌فرض‌های ارزان درک رسانه برای شناسه‌های ارائه‌دهنده اعلام‌شده در `contracts.mediaUnderstandingProviders`.                                                                                                                          |
| `channelConfigs`                     | خیر       | `Record<string, object>`         | فرادادهٔ پیکربندی کانال متعلق به مانیفست که پیش از بارگذاری زمان اجرا در سطوح کشف و اعتبارسنجی ادغام می‌شود.                                                                                                                        |
| `skills`                             | خیر       | `string[]`                       | دایرکتوری‌های Skills برای بارگذاری، نسبت به ریشهٔ Plugin.                                                                                                                                                                           |
| `name`                               | خیر       | `string`                         | نام خوانای انسانی Plugin.                                                                                                                                                                                                       |
| `description`                        | خیر       | `string`                         | خلاصهٔ کوتاهی که در سطوح Plugin نشان داده می‌شود.                                                                                                                                                                                           |
| `version`                            | خیر       | `string`                         | نسخهٔ اطلاعاتی Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | خیر       | `Record<string, object>`         | برچسب‌های UI، placeholderها و راهنمای حساسیت برای فیلدهای پیکربندی.                                                                                                                                                                 |

## مرجع providerAuthChoices

هر ورودی `providerAuthChoices` یک انتخاب آنبوردینگ یا احراز هویت را توصیف می‌کند.
OpenClaw این را پیش از بارگذاری زمان اجرای ارائه‌دهنده می‌خواند.
فهرست‌های راه‌اندازی ارائه‌دهنده از این انتخاب‌های مانیفست، انتخاب‌های راه‌اندازی مشتق‌شده از توصیف‌گر
و فرادادهٔ کاتالوگ نصب بدون بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌کنند.

| فیلد                 | الزامی | نوع                                            | معنی آن                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | بله      | `string`                                        | شناسه Provider که این انتخاب به آن تعلق دارد.                                                                      |
| `method`              | بله      | `string`                                        | شناسه روش احراز هویت برای ارسال به آن.                                                                           |
| `choiceId`            | بله      | `string`                                        | شناسه پایدار انتخاب احراز هویت که در جریان‌های راه‌اندازی اولیه و CLI استفاده می‌شود.                                                  |
| `choiceLabel`         | خیر       | `string`                                        | برچسب قابل‌نمایش به کاربر. اگر حذف شود، OpenClaw به `choiceId` بازمی‌گردد.                                        |
| `choiceHint`          | خیر       | `string`                                        | متن راهنمای کوتاه برای انتخابگر.                                                                        |
| `assistantPriority`   | خیر       | `number`                                        | مقدارهای پایین‌تر در انتخابگرهای تعاملیِ هدایت‌شده توسط دستیار زودتر مرتب می‌شوند.                                       |
| `assistantVisibility` | خیر       | `"visible"` \| `"manual-only"`                  | انتخاب را از انتخابگرهای دستیار پنهان می‌کند، در حالی که همچنان انتخاب دستی CLI را مجاز نگه می‌دارد.                        |
| `deprecatedChoiceIds` | خیر       | `string[]`                                      | شناسه‌های انتخاب قدیمی که باید کاربران را به این انتخاب جایگزین هدایت کنند.                                 |
| `groupId`             | خیر       | `string`                                        | شناسه گروه اختیاری برای گروه‌بندی انتخاب‌های مرتبط.                                                          |
| `groupLabel`          | خیر       | `string`                                        | برچسب قابل‌نمایش به کاربر برای آن گروه.                                                                        |
| `groupHint`           | خیر       | `string`                                        | متن راهنمای کوتاه برای گروه.                                                                         |
| `optionKey`           | خیر       | `string`                                        | کلید گزینه داخلی برای جریان‌های احراز هویت ساده با یک پرچم.                                                      |
| `cliFlag`             | خیر       | `string`                                        | نام پرچم CLI، مانند `--openrouter-api-key`.                                                           |
| `cliOption`           | خیر       | `string`                                        | شکل کامل گزینه CLI، مانند `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | خیر       | `string`                                        | توضیحی که در راهنمای CLI استفاده می‌شود.                                                                            |
| `onboardingScopes`    | خیر       | `Array<"text-inference" \| "image-generation">` | مشخص می‌کند این انتخاب در کدام سطح‌های راه‌اندازی اولیه نمایش داده شود. اگر حذف شود، مقدار پیش‌فرض آن `["text-inference"]` است. |

## مرجع commandAliases

زمانی از `commandAliases` استفاده کنید که یک Plugin مالک نام فرمان زمان اجرا باشد که کاربران ممکن است
به‌اشتباه آن را در `plugins.allow` بگذارند یا تلاش کنند آن را به‌عنوان یک فرمان ریشه CLI اجرا کنند. OpenClaw
از این فراداده برای عیب‌یابی استفاده می‌کند، بدون اینکه کد زمان اجرای Plugin را وارد کند.

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
| `kind`       | خیر       | `"runtime-slash"` | نام مستعار را به‌جای فرمان ریشه CLI، به‌عنوان فرمان اسلش چت علامت‌گذاری می‌کند. |
| `cliCommand` | خیر       | `string`          | فرمان ریشه CLI مرتبطی که برای عملیات CLI پیشنهاد می‌شود، اگر وجود داشته باشد.  |

## مرجع activation

زمانی از `activation` استفاده کنید که Plugin بتواند با هزینه کم اعلام کند کدام رویدادهای صفحه کنترل
باید آن را در یک برنامه فعال‌سازی/بارگذاری وارد کنند.

این بلوک فراداده برنامه‌ریز است، نه API چرخه عمر. رفتار زمان اجرا را ثبت نمی‌کند،
جایگزین `register(...)` نمی‌شود، و تضمین نمی‌کند که
کد Plugin از قبل اجرا شده باشد. برنامه‌ریز فعال‌سازی از این فیلدها برای
محدود کردن Pluginهای نامزد استفاده می‌کند، سپس به فراداده مالکیت موجود در manifest
مانند `providers`، `channels`، `commandAliases`، `setup.providers`،
`contracts.tools` و hookها بازمی‌گردد.

باریک‌ترین فراداده‌ای را ترجیح دهید که از قبل مالکیت را توصیف می‌کند. زمانی از
`providers`، `channels`، `commandAliases`، توصیفگرهای setup یا `contracts`
استفاده کنید که آن فیلدها رابطه را بیان می‌کنند. از `activation` برای راهنمایی‌های اضافی برنامه‌ریز
استفاده کنید که با آن فیلدهای مالکیت قابل نمایش نیستند.
برای نام‌های مستعار زمان اجرای CLI مانند `claude-cli`،
`codex-cli` یا `google-gemini-cli` از `cliBackends` سطح بالا استفاده کنید؛ `activation.onAgentHarnesses` فقط برای
شناسه‌های harness عاملِ تعبیه‌شده است که از قبل فیلد مالکیت ندارند.

این بلوک فقط فراداده است. رفتار زمان اجرا را ثبت نمی‌کند، و
جایگزین `register(...)`، `setupEntry` یا سایر نقاط ورود زمان اجرا/Plugin نمی‌شود.
مصرف‌کنندگان فعلی از آن به‌عنوان راهنمای محدودسازی پیش از بارگذاری گسترده‌تر Plugin استفاده می‌کنند، بنابراین
نبود فراداده فعال‌سازی معمولاً فقط هزینه عملکرد دارد؛ تا زمانی که fallbackهای مالکیت manifest قدیمی هنوز وجود دارند، نباید
درستی را تغییر دهد.

هر Plugin باید `activation.onStartup` را آگاهانه تنظیم کند، چون OpenClaw از
واردسازی‌های ضمنی زمان راه‌اندازی فاصله می‌گیرد. فقط وقتی آن را روی `true` بگذارید که Plugin باید
در زمان راه‌اندازی Gateway اجرا شود. وقتی Plugin در زمان
راه‌اندازی غیرفعال است و فقط باید از triggerهای باریک‌تر بارگذاری شود، آن را روی `false` بگذارید. حذف `onStartup` باعث حفظ
fallback قدیمی و منسوخ sidecar ضمنی زمان راه‌اندازی برای Pluginهایی می‌شود که هیچ
فراداده قابلیت ایستایی ندارند؛ نسخه‌های آینده ممکن است بارگذاری زمان راه‌اندازی آن
Pluginها را متوقف کنند، مگر اینکه `activation.onStartup: true` را اعلام کنند. گزارش‌های وضعیت و
سازگاری Plugin با `legacy-implicit-startup-sidecar` هشدار می‌دهند وقتی یک Plugin
هنوز به آن fallback متکی است.

برای آزمون مهاجرت، مقدار
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` را تنظیم کنید تا فقط آن
fallback منسوخ غیرفعال شود. این حالت اختیاری، Pluginهای دارای
`activation.onStartup: true` صریح یا Pluginهایی را که توسط channel، config،
agent-harness، memory یا سایر triggerهای فعال‌سازی باریک‌تر بارگذاری می‌شوند، مسدود نمی‌کند.

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

| فیلد              | الزامی | نوع                                                 | معنی آن                                                                                                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | خیر       | `boolean`                                            | فعال‌سازی صریح زمان راه‌اندازی Gateway. هر Plugin باید این را تنظیم کند. `true`، Plugin را هنگام راه‌اندازی وارد می‌کند؛ `false` از fallback منسوخ راه‌اندازی sidecar ضمنی خارج می‌شود، مگر اینکه trigger منطبق دیگری بارگذاری را لازم کند. |
| `onProviders`      | خیر       | `string[]`                                           | شناسه‌های Provider که باید این Plugin را در برنامه‌های فعال‌سازی/بارگذاری وارد کنند.                                                                                                                                                             |
| `onAgentHarnesses` | خیر       | `string[]`                                           | شناسه‌های زمان اجرای harness عاملِ تعبیه‌شده که باید این Plugin را در برنامه‌های فعال‌سازی/بارگذاری وارد کنند. برای نام‌های مستعار backend CLI از `cliBackends` سطح بالا استفاده کنید.                                                                                  |
| `onCommands`       | خیر       | `string[]`                                           | شناسه‌های فرمان که باید این Plugin را در برنامه‌های فعال‌سازی/بارگذاری وارد کنند.                                                                                                                                                              |
| `onChannels`       | خیر       | `string[]`                                           | شناسه‌های Channel که باید این Plugin را در برنامه‌های فعال‌سازی/بارگذاری وارد کنند.                                                                                                                                                              |
| `onRoutes`         | خیر       | `string[]`                                           | گونه‌های route که باید این Plugin را در برنامه‌های فعال‌سازی/بارگذاری وارد کنند.                                                                                                                                                              |
| `onConfigPaths`    | خیر       | `string[]`                                           | مسیرهای config نسبی به ریشه که وقتی مسیر وجود دارد و به‌صراحت غیرفعال نشده است، باید این Plugin را در برنامه‌های راه‌اندازی/بارگذاری وارد کنند.                                                                                             |
| `onCapabilities`   | خیر       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | راهنمایی‌های گسترده قابلیت که توسط برنامه‌ریزی فعال‌سازی صفحه کنترل استفاده می‌شوند. هر زمان ممکن است فیلدهای باریک‌تر را ترجیح دهید.                                                                                                                            |

مصرف‌کنندگان زنده فعلی:

- برنامه‌ریزی راه‌اندازی Gateway از `activation.onStartup` برای واردسازی صریح زمان راه‌اندازی
  و خروج از fallback منسوخ راه‌اندازی sidecar ضمنی استفاده می‌کند
- برنامه‌ریزی CLI مبتنی بر trigger فرمان به `commandAliases[].cliCommand` یا
  `commandAliases[].name` قدیمی بازمی‌گردد
- برنامه‌ریزی راه‌اندازی زمان اجرای عامل از `activation.onAgentHarnesses` برای
  harnessهای تعبیه‌شده و از `cliBackends[]` سطح بالا برای نام‌های مستعار زمان اجرای CLI استفاده می‌کند
- برنامه‌ریزی setup/channel مبتنی بر trigger کانال، وقتی فراداده فعال‌سازی صریح کانال وجود ندارد، به مالکیت قدیمی `channels[]`
  بازمی‌گردد
- برنامه‌ریزی Plugin راه‌اندازی از `activation.onConfigPaths` برای سطح‌های config ریشه غیرکانالی
  مانند بلوک `browser` مربوط به Plugin مرورگرِ همراه استفاده می‌کند
- برنامه‌ریزی setup/runtime مبتنی بر trigger Provider، وقتی فراداده فعال‌سازی صریح Provider
  وجود ندارد، به مالکیت قدیمی `providers[]` و `cliBackends[]` سطح بالا بازمی‌گردد

عیب‌یابی‌های برنامه‌ریز می‌توانند راهنمایی‌های فعال‌سازی صریح را از fallback مالکیت manifest
تشخیص دهند. برای مثال، `activation-command-hint` یعنی
`activation.onCommands` منطبق شده است، در حالی که `manifest-command-alias` یعنی
برنامه‌ریز به‌جای آن از مالکیت `commandAliases` استفاده کرده است. این برچسب‌های دلیل برای
عیب‌یابی میزبان و آزمون‌ها هستند؛ نویسندگان Plugin باید فراداده‌ای را اعلام کنند که
مالکیت را به بهترین شکل توصیف می‌کند.

## مرجع qaRunners

زمانی از `qaRunners` استفاده کنید که یک Plugin یک یا چند runner انتقال را زیر
ریشه مشترک `openclaw qa` اضافه می‌کند. این فراداده را کم‌هزینه و ایستا نگه دارید؛ زمان اجرای Plugin
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

| فیلد         | الزامی | نوع     | معنی آن                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | بله      | `string` | زیر‌فرمانی که زیر `openclaw qa` نصب می‌شود، برای مثال `matrix`.    |
| `description` | خیر       | `string` | متن راهنمای جایگزین که وقتی میزبان مشترک به یک فرمان stub نیاز دارد استفاده می‌شود. |

## مرجع setup

وقتی سطوح راه‌اندازی و آنبوردینگ پیش از بارگذاری زمان اجرا به فراداده ارزان و متعلق به Plugin نیاز دارند، از `setup` استفاده کنید.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` در سطح بالا همچنان معتبر می‌ماند و به توصیف backendهای استنتاج CLI ادامه می‌دهد. `setup.cliBackends` سطح توصیف‌گر ویژه راه‌اندازی برای جریان‌های سطح کنترل/راه‌اندازی است که باید فقط فراداده بمانند.

وقتی `setup.providers` و `setup.cliBackends` وجود داشته باشند، سطح جست‌وجوی descriptor-first ترجیحی برای کشف setup هستند. اگر descriptor فقط Plugin نامزد را محدود می‌کند و setup همچنان به hookهای زمان راه‌اندازی غنی‌تر نیاز دارد، `requiresRuntime: true` را تنظیم کنید و `setup-api` را به‌عنوان مسیر اجرای جایگزین نگه دارید.

OpenClaw همچنین `setup.providers[].envVars` را در جست‌وجوهای عمومی احراز هویت provider و متغیرهای env وارد می‌کند. `providerAuthEnvVars` در طول بازه منسوخ‌سازی همچنان از طریق یک adapter سازگاری پشتیبانی می‌شود، اما Pluginهای غیرباندل‌شده‌ای که هنوز از آن استفاده می‌کنند یک diagnostic در manifest دریافت می‌کنند. Pluginهای جدید باید فراداده env مربوط به setup/status را در `setup.providers[].envVars` قرار دهند.

OpenClaw همچنین می‌تواند وقتی هیچ ورودی setup در دسترس نیست، یا وقتی `setup.requiresRuntime: false` اعلام می‌کند زمان اجرای setup لازم نیست، انتخاب‌های ساده setup را از `setup.providers[].authMethods` استخراج کند. ورودی‌های صریح `providerAuthChoices` برای برچسب‌های سفارشی، پرچم‌های CLI، دامنه آنبوردینگ، و فراداده assistant همچنان ترجیح داده می‌شوند.

`requiresRuntime: false` را فقط وقتی تنظیم کنید که آن descriptorها برای سطح setup کافی هستند. OpenClaw مقدار صریح `false` را به‌عنوان قرارداد فقط descriptor تلقی می‌کند و برای جست‌وجوی setup، `setup-api` یا `openclaw.setupEntry` را اجرا نخواهد کرد. اگر یک Plugin فقط descriptor همچنان یکی از آن ورودی‌های زمان اجرای setup را ارسال کند، OpenClaw یک diagnostic افزایشی گزارش می‌کند و همچنان آن را نادیده می‌گیرد. حذف `requiresRuntime` رفتار fallback قدیمی را حفظ می‌کند تا Pluginهای موجودی که descriptorها را بدون این پرچم اضافه کرده‌اند نشکنند.

از آنجا که جست‌وجوی setup می‌تواند کد `setup-api` متعلق به Plugin را اجرا کند، مقادیر نرمال‌شده `setup.providers[].id` و `setup.cliBackends[]` باید در میان Pluginهای کشف‌شده یکتا بمانند. مالکیت مبهم به‌جای انتخاب برنده از ترتیب کشف، به‌صورت بسته شکست می‌خورد.

وقتی زمان اجرای setup اجرا می‌شود، diagnosticهای registry setup در صورتی drift در descriptor را گزارش می‌کنند که `setup-api` یک provider یا backend CLI ثبت کند که descriptorهای manifest آن را اعلام نکرده‌اند، یا اگر یک descriptor هیچ ثبت زمان اجرای متناظری نداشته باشد. این diagnosticها افزایشی هستند و Pluginهای قدیمی را رد نمی‌کنند.

### مرجع setup.providers

| فیلد         | الزامی | نوع       | معنی آن                                                                        |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | بله      | `string`   | شناسه provider که هنگام setup یا آنبوردینگ در معرض استفاده قرار می‌گیرد. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید. |
| `authMethods` | خیر       | `string[]` | شناسه‌های روش setup/auth که این provider بدون بارگذاری کامل زمان اجرا پشتیبانی می‌کند.           |
| `envVars`     | خیر       | `string[]` | متغیرهای env که سطوح عمومی setup/status می‌توانند پیش از بارگذاری زمان اجرای Plugin بررسی کنند.   |

### فیلدهای setup

| فیلد              | الزامی | نوع       | معنی آن                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | خیر       | `object[]` | descriptorهای setup provider که هنگام setup و آنبوردینگ در معرض استفاده قرار می‌گیرند.                                     |
| `cliBackends`      | خیر       | `string[]` | شناسه‌های backend زمان setup که برای جست‌وجوی setup به روش descriptor-first استفاده می‌شوند. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید. |
| `configMigrations` | خیر       | `string[]` | شناسه‌های migration پیکربندی که متعلق به سطح setup این Plugin هستند.                                          |
| `requiresRuntime`  | خیر       | `boolean`  | اینکه آیا setup پس از جست‌وجوی descriptor همچنان به اجرای `setup-api` نیاز دارد یا نه.                            |

## مرجع uiHints

`uiHints` نگاشتی از نام فیلدهای پیکربندی به hintهای کوچک رندرینگ است.

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

| فیلد         | نوع       | معنی آن                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | برچسب فیلد قابل مشاهده برای کاربر.                |
| `help`        | `string`   | متن راهنمای کوتاه.                      |
| `tags`        | `string[]` | tagهای اختیاری UI.                       |
| `advanced`    | `boolean`  | فیلد را به‌عنوان پیشرفته علامت‌گذاری می‌کند.            |
| `sensitive`   | `boolean`  | فیلد را به‌عنوان محرمانه یا حساس علامت‌گذاری می‌کند. |
| `placeholder` | `string`   | متن placeholder برای ورودی‌های فرم.       |

## مرجع contracts

از `contracts` فقط برای فراداده مالکیت capability ایستا استفاده کنید که OpenClaw می‌تواند بدون import کردن زمان اجرای Plugin بخواند.

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

| فیلد                            | نوع       | معنی آن                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | شناسه‌های کارخانه extension سرور اپ Codex، در حال حاضر `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | شناسه‌های زمان اجرا که یک Plugin باندل‌شده ممکن است middleware نتیجه ابزار را برایشان ثبت کند. |
| `externalAuthProviders`          | `string[]` | شناسه‌های provider که hook پروفایل احراز هویت خارجی آن‌ها متعلق به این Plugin است.       |
| `speechProviders`                | `string[]` | شناسه‌های provider گفتار که متعلق به این Plugin هستند.                                 |
| `realtimeTranscriptionProviders` | `string[]` | شناسه‌های provider رونویسی بی‌درنگ که متعلق به این Plugin هستند.                 |
| `realtimeVoiceProviders`         | `string[]` | شناسه‌های provider صدای بی‌درنگ که متعلق به این Plugin هستند.                         |
| `memoryEmbeddingProviders`       | `string[]` | شناسه‌های provider embedding حافظه که متعلق به این Plugin هستند.                       |
| `mediaUnderstandingProviders`    | `string[]` | شناسه‌های provider درک رسانه که متعلق به این Plugin هستند.                    |
| `imageGenerationProviders`       | `string[]` | شناسه‌های provider تولید تصویر که متعلق به این Plugin هستند.                       |
| `videoGenerationProviders`       | `string[]` | شناسه‌های provider تولید ویدئو که متعلق به این Plugin هستند.                       |
| `webFetchProviders`              | `string[]` | شناسه‌های provider دریافت وب که متعلق به این Plugin هستند.                              |
| `webSearchProviders`             | `string[]` | شناسه‌های provider جست‌وجوی وب که متعلق به این Plugin هستند.                             |
| `migrationProviders`             | `string[]` | شناسه‌های provider import که برای `openclaw migrate` متعلق به این Plugin هستند.          |
| `tools`                          | `string[]` | نام‌های ابزار agent که برای بررسی‌های قرارداد باندل‌شده متعلق به این Plugin هستند.        |

`contracts.embeddedExtensionFactories` برای کارخانه‌های extension فقط مخصوص سرور اپ Codex باندل‌شده حفظ شده است. تبدیل‌های نتیجه ابزار باندل‌شده باید به‌جای آن `contracts.agentToolResultMiddleware` را اعلام کنند و با `api.registerAgentToolResultMiddleware(...)` ثبت شوند. Pluginهای خارجی نمی‌توانند middleware نتیجه ابزار ثبت کنند، چون این seam می‌تواند خروجی ابزار با اعتماد بالا را پیش از اینکه مدل آن را ببیند بازنویسی کند.

Pluginهای provider که `resolveExternalAuthProfiles` را پیاده‌سازی می‌کنند باید `contracts.externalAuthProviders` را اعلام کنند. Pluginهای بدون این declaration همچنان از طریق fallback سازگاری منسوخ‌شده اجرا می‌شوند، اما آن fallback کندتر است و پس از بازه migration حذف خواهد شد.

Providerهای embedding حافظه باندل‌شده باید برای هر شناسه adapter که در معرض استفاده قرار می‌دهند، از جمله adapterهای داخلی مانند `local`، `contracts.memoryEmbeddingProviders` را اعلام کنند. مسیرهای CLI مستقل از این قرارداد manifest استفاده می‌کنند تا پیش از اینکه زمان اجرای کامل Gateway providerها را ثبت کند، فقط Plugin مالک را بارگذاری کنند.

## مرجع mediaUnderstandingProviderMetadata

وقتی یک provider درک رسانه مدل‌های پیش‌فرض، اولویت fallback احراز هویت خودکار، یا پشتیبانی native از سند دارد که helperهای عمومی core پیش از بارگذاری زمان اجرا به آن نیاز دارند، از `mediaUnderstandingProviderMetadata` استفاده کنید. کلیدها همچنین باید در `contracts.mediaUnderstandingProviders` اعلام شده باشند.

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

هر ورودی provider می‌تواند شامل موارد زیر باشد:

| فیلد                  | نوع                                | معنی آن                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | capabilityهای رسانه‌ای که این provider در معرض استفاده قرار می‌دهد.                                 |
| `defaultModels`        | `Record<string, string>`            | پیش‌فرض‌های capability-to-model که وقتی پیکربندی مدلی مشخص نکرده باشد استفاده می‌شوند.      |
| `autoPriority`         | `Record<string, number>`            | عددهای کمتر برای fallback خودکار provider مبتنی بر credential زودتر مرتب می‌شوند. |
| `nativeDocumentInputs` | `"pdf"[]`                           | ورودی‌های سند native که provider پشتیبانی می‌کند.                            |

## مرجع channelConfigs

وقتی یک Plugin کانال پیش از بارگذاری زمان اجرا به فراداده ارزان پیکربندی نیاز دارد، از `channelConfigs` استفاده کنید. کشف read-only setup/status کانال می‌تواند برای کانال‌های خارجی پیکربندی‌شده، وقتی هیچ ورودی setup در دسترس نیست، یا وقتی `setup.requiresRuntime: false` اعلام می‌کند زمان اجرای setup لازم نیست، مستقیما از این فراداده استفاده کند.

`channelConfigs` فراداده manifest Plugin است، نه یک بخش جدید پیکربندی کاربر در سطح بالا. کاربران همچنان نمونه‌های کانال را زیر `channels.<channel-id>` پیکربندی می‌کنند. OpenClaw فراداده manifest را می‌خواند تا پیش از اجرای کد زمان اجرای Plugin تصمیم بگیرد کدام Plugin مالک آن کانال پیکربندی‌شده است.

برای یک Plugin کانال، `configSchema` و `channelConfigs` مسیرهای متفاوتی را توصیف می‌کنند:

- `configSchema` مقدار `plugins.entries.<plugin-id>.config` را اعتبارسنجی می‌کند
- `channelConfigs.<channel-id>.schema` مقدار `channels.<channel-id>` را اعتبارسنجی می‌کند

Pluginهای غیرباندل‌شده‌ای که `channels[]` را اعلان می‌کنند، باید ورودی‌های منطبق
`channelConfigs` را نیز اعلان کنند. بدون آن‌ها، OpenClaw همچنان می‌تواند Plugin را بارگذاری کند، اما
طرحواره پیکربندی مسیر سرد، راه‌اندازی، و سطوح رابط کاربری کنترل نمی‌توانند شکل گزینه‌های
متعلق به کانال را تا زمان اجرای runtimeِ Plugin بدانند.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و
`nativeSkillsAutoEnabled` می‌توانند پیش‌فرض‌های ایستای `auto` را برای بررسی‌های پیکربندی فرمان
اعلان کنند که پیش از بارگذاری runtime کانال اجرا می‌شوند. کانال‌های باندل‌شده همچنین می‌توانند
همین پیش‌فرض‌ها را از طریق `package.json#openclaw.channel.commands` در کنار
دیگر فراداده‌های کاتالوگ کانالِ متعلق به بسته خود منتشر کنند.

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

| فیلد         | نوع                     | معنی آن                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | طرحواره JSON برای `channels.<id>`. برای هر ورودی پیکربندی کانال اعلان‌شده الزامی است.         |
| `uiHints`     | `Record<string, object>` | برچسب‌ها/placeholderها/راهنماهای حساس اختیاری رابط کاربری برای آن بخش پیکربندی کانال.          |
| `label`       | `string`                 | برچسب کانال که وقتی فراداده runtime آماده نیست، در سطوح انتخاب‌گر و بازبینی ادغام می‌شود. |
| `description` | `string`                 | توضیح کوتاه کانال برای سطوح بازبینی و کاتالوگ.                               |
| `commands`    | `object`                 | پیش‌فرض‌های ایستای خودکار فرمان بومی و skill بومی برای بررسی‌های پیکربندی پیش از runtime.       |
| `preferOver`  | `string[]`               | شناسه‌های Plugin قدیمی یا با اولویت پایین‌تر که این کانال باید در سطوح انتخاب نسبت به آن‌ها اولویت داشته باشد.    |

### جایگزینی یک Plugin کانال دیگر

از `preferOver` زمانی استفاده کنید که Plugin شما مالک ترجیحی برای یک شناسه کانال است که
Plugin دیگری نیز می‌تواند فراهم کند. موارد رایج شامل شناسه Plugin تغییرنام‌داده‌شده، یک
Plugin مستقل که جایگزین یک Plugin باندل‌شده می‌شود، یا یک fork نگهداری‌شده است که
همان شناسه کانال را برای سازگاری پیکربندی حفظ می‌کند.

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
شناسه Plugin ترجیحی را در نظر می‌گیرد. اگر Plugin با اولویت پایین‌تر فقط به این دلیل انتخاب شده باشد
که باندل‌شده است یا به‌صورت پیش‌فرض فعال می‌شود، OpenClaw آن را در پیکربندی runtime
موثر غیرفعال می‌کند تا یک Plugin مالک کانال و ابزارهای آن باشد. انتخاب صریح کاربر
همچنان اولویت دارد: اگر کاربر هر دو Plugin را صراحتا فعال کند، OpenClaw
آن انتخاب را حفظ می‌کند و به‌جای تغییر بی‌سروصدای مجموعه Pluginهای درخواست‌شده،
تشخیص‌های کانال/ابزار تکراری را گزارش می‌دهد.

`preferOver` را به شناسه‌های Pluginی محدود نگه دارید که واقعا می‌توانند همان کانال را فراهم کنند.
این یک فیلد اولویت عمومی نیست و کلیدهای پیکربندی کاربر را تغییر نام نمی‌دهد.

## مرجع modelSupport

زمانی از `modelSupport` استفاده کنید که OpenClaw باید پیش از بارگذاری runtimeِ Plugin،
Plugin ارائه‌دهنده شما را از شناسه‌های کوتاه مدل مانند `gpt-5.5` یا `claude-sonnet-4.6` استنباط کند.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw این تقدم را اعمال می‌کند:

- ارجاع‌های صریح `provider/model` از فراداده مانیفست `providers` متعلق به مالک استفاده می‌کنند
- `modelPatterns` بر `modelPrefixes` مقدم است
- اگر یک Plugin غیرهمراه و یک Plugin همراه هر دو منطبق شوند، Plugin غیرهمراه
  برنده می‌شود
- ابهام باقی‌مانده نادیده گرفته می‌شود تا زمانی که کاربر یا پیکربندی یک ارائه‌دهنده را مشخص کند

فیلدها:

| فیلد            | نوع        | معنی آن                                                                        |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | پیشوندهایی که با `startsWith` در برابر شناسه‌های کوتاه مدل منطبق می‌شوند.       |
| `modelPatterns` | `string[]` | منابع عبارت منظم که پس از حذف پسوند پروفایل در برابر شناسه‌های کوتاه مدل منطبق می‌شوند. |

## مرجع modelCatalog

از `modelCatalog` زمانی استفاده کنید که OpenClaw باید پیش از
بارگذاری زمان اجرای Plugin، فراداده مدل ارائه‌دهنده را بداند. این منبعِ متعلق به مانیفست برای ردیف‌های کاتالوگ ثابت،
نام‌های مستعار ارائه‌دهنده، قوانین سرکوب، و حالت کشف است. تازه‌سازی زمان اجرا
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

| فیلد           | نوع                                                      | معنی آن                                                                                                 |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | ردیف‌های کاتالوگ برای شناسه‌های ارائه‌دهنده متعلق به این Plugin. کلیدها باید در `providers` سطح بالا نیز ظاهر شوند. |
| `aliases`      | `Record<string, object>`                                 | نام‌های مستعار ارائه‌دهنده که باید برای برنامه‌ریزی کاتالوگ یا سرکوب به یک ارائه‌دهنده متعلق حل شوند. |
| `suppressions` | `object[]`                                               | ردیف‌های مدل از منبعی دیگر که این Plugin به دلیلی مختص ارائه‌دهنده سرکوب می‌کند.                       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | اینکه کاتالوگ ارائه‌دهنده می‌تواند از فراداده مانیفست خوانده شود، در حافظه نهان تازه‌سازی شود، یا به زمان اجرا نیاز دارد. |

`aliases` در جست‌وجوی مالکیت ارائه‌دهنده برای برنامه‌ریزی کاتالوگ مدل مشارکت می‌کند.
اهداف نام مستعار باید ارائه‌دهندگان سطح بالا باشند که متعلق به همان Plugin هستند. هنگامی که یک
فهرست فیلترشده بر اساس ارائه‌دهنده از یک نام مستعار استفاده می‌کند، OpenClaw می‌تواند مانیفست مالک را بخواند و
بازنویسی‌های API/نشانی پایه نام مستعار را بدون بارگذاری زمان اجرای ارائه‌دهنده اعمال کند.
نام‌های مستعار فهرست‌های کاتالوگ فیلترنشده را گسترش نمی‌دهند؛ فهرست‌های گسترده فقط ردیف‌های ارائه‌دهنده
کانونیِ مالک را منتشر می‌کنند.

`suppressions` جایگزین هوک قدیمی زمان اجرای ارائه‌دهنده `suppressBuiltInModel` می‌شود.
ورودی‌های سرکوب فقط زمانی رعایت می‌شوند که ارائه‌دهنده متعلق به Plugin باشد یا
به‌عنوان کلید `modelCatalog.aliases` اعلام شده باشد که به یک ارائه‌دهنده متعلق اشاره می‌کند. هوک‌های سرکوب
زمان اجرا دیگر هنگام حل مدل فراخوانی نمی‌شوند.

فیلدهای ارائه‌دهنده:

| فیلد      | نوع                      | معنی آن                                                                |
| --------- | ------------------------ | ---------------------------------------------------------------------- |
| `baseUrl` | `string`                 | نشانی پایه پیش‌فرض اختیاری برای مدل‌های موجود در این کاتالوگ ارائه‌دهنده. |
| `api`     | `ModelApi`               | آداپتور API پیش‌فرض اختیاری برای مدل‌های موجود در این کاتالوگ ارائه‌دهنده. |
| `headers` | `Record<string, string>` | سرآیندهای ایستای اختیاری که روی این کاتالوگ ارائه‌دهنده اعمال می‌شوند. |
| `models`  | `object[]`               | ردیف‌های مدل الزامی. ردیف‌های بدون `id` نادیده گرفته می‌شوند.          |

فیلدهای مدل:

| فیلد            | نوع                                                            | معنی آن                                                                          |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | شناسه مدل محلی ارائه‌دهنده، بدون پیشوند `provider/`.                            |
| `name`          | `string`                                                       | نام نمایشی اختیاری.                                                              |
| `api`           | `ModelApi`                                                     | بازنویسی API اختیاری برای هر مدل.                                                |
| `baseUrl`       | `string`                                                       | بازنویسی نشانی پایه اختیاری برای هر مدل.                                        |
| `headers`       | `Record<string, string>`                                       | سرآیندهای ایستای اختیاری برای هر مدل.                                           |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | مدالیته‌هایی که مدل می‌پذیرد.                                                     |
| `reasoning`     | `boolean`                                                      | اینکه آیا مدل رفتار استدلال را ارائه می‌کند یا نه.                               |
| `contextWindow` | `number`                                                       | پنجره زمینه بومی ارائه‌دهنده.                                                    |
| `contextTokens` | `number`                                                       | سقف مؤثر اختیاری زمینه در زمان اجرا، هنگامی که با `contextWindow` متفاوت است.    |
| `maxTokens`     | `number`                                                       | حداکثر توکن‌های خروجی، زمانی که مشخص باشد.                                       |
| `cost`          | `object`                                                       | قیمت‌گذاری اختیاری دلار آمریکا به‌ازای هر میلیون توکن، شامل `tieredPricing` اختیاری. |
| `compat`        | `object`                                                       | پرچم‌های سازگاری اختیاری که با سازگاری پیکربندی مدل OpenClaw مطابقت دارند.      |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | وضعیت فهرست شدن. فقط زمانی سرکوب کنید که ردیف اصلاً نباید ظاهر شود.             |
| `statusReason`  | `string`                                                       | دلیل اختیاری که همراه وضعیت غیرقابل‌دسترس نشان داده می‌شود.                     |
| `replaces`      | `string[]`                                                     | شناسه‌های مدل محلی ارائه‌دهنده قدیمی‌تر که این مدل جایگزینشان می‌شود.           |
| `replacedBy`    | `string`                                                       | شناسه مدل محلی ارائه‌دهنده جایگزین برای ردیف‌های منسوخ.                         |
| `tags`          | `string[]`                                                     | برچسب‌های پایدار که توسط انتخابگرها و فیلترها استفاده می‌شوند.                  |

فیلدهای سرکوب:

| فیلد                      | نوع       | معنی آن                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | شناسهٔ ارائه‌دهنده برای ردیف بالادستی که باید پنهان شود. باید متعلق به این Plugin باشد یا به‌عنوان یک نام مستعار متعلق اعلام شده باشد. |
| `model`                    | `string`   | شناسهٔ مدل محلیِ ارائه‌دهنده که باید پنهان شود.                                                                      |
| `reason`                   | `string`   | پیام اختیاری که وقتی ردیف پنهان‌شده مستقیماً درخواست می‌شود نمایش داده می‌شود.                                     |
| `when.baseUrlHosts`        | `string[]` | فهرست اختیاری میزبان‌های URL پایهٔ مؤثرِ ارائه‌دهنده که پیش از اعمال پنهان‌سازی لازم است.               |
| `when.providerConfigApiIn` | `string[]` | فهرست اختیاری مقادیر دقیق `api` در پیکربندی ارائه‌دهنده که پیش از اعمال پنهان‌سازی لازم است.              |

داده‌های صرفاً زمان اجرا را در `modelCatalog` قرار ندهید. فقط زمانی از `static` استفاده کنید که
ردیف‌های مانیفست برای سطوح فهرست و انتخاب‌گرِ فیلترشده بر اساس ارائه‌دهنده به‌اندازهٔ کافی کامل باشند تا
از کشف رجیستری/زمان اجرا عبور کنند. زمانی از `refreshable` استفاده کنید که ردیف‌های مانیفست به‌عنوان
بذرها یا مکمل‌های قابل فهرست شدن مفید باشند، اما تازه‌سازی/کش بتواند بعداً ردیف‌های بیشتری اضافه کند؛
ردیف‌های refreshable به‌تنهایی مرجع قطعی نیستند. زمانی از `runtime` استفاده کنید که OpenClaw
برای دانستن فهرست باید زمان اجرای ارائه‌دهنده را بارگذاری کند.

## مرجع modelIdNormalization

از `modelIdNormalization` برای پاک‌سازی ارزانِ شناسهٔ مدل، تحت مالکیت ارائه‌دهنده، استفاده کنید که باید
پیش از بارگذاری زمان اجرای ارائه‌دهنده انجام شود. این کار نام‌های مستعار مانند نام‌های کوتاه مدل،
شناسه‌های قدیمی محلیِ ارائه‌دهنده، و قواعد پیشوند پروکسی را به‌جای جدول‌های انتخاب مدل در هسته،
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

| فیلد                                | نوع                    | معنی آن                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | نام‌های مستعار دقیق شناسهٔ مدل بدون حساسیت به بزرگی/کوچکی حروف. مقدارها همان‌طور که نوشته شده‌اند برگردانده می‌شوند.                  |
| `stripPrefixes`                      | `string[]`              | پیشوندهایی که پیش از جست‌وجوی نام مستعار حذف می‌شوند، مفید برای تکرار قدیمی provider/model.     |
| `prefixWhenBare`                     | `string`                | پیشوندی که وقتی شناسهٔ مدل نرمال‌شده از قبل شامل `/` نیست اضافه می‌شود.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | قواعد شرطی پیشوند برای شناسه‌های بدون پیشوند، پس از جست‌وجوی نام مستعار، با کلیدهای `modelPrefix` و `prefix`. |

## مرجع providerEndpoints

از `providerEndpoints` برای طبقه‌بندی endpoint استفاده کنید که سیاست درخواست عمومی باید پیش از بارگذاری
زمان اجرای ارائه‌دهنده آن را بداند. هسته همچنان مالک معنی هر `endpointClass` است؛ مانیفست‌های Plugin
مالک فرادادهٔ میزبان و URL پایه هستند.

فیلدهای endpoint:

| فیلد                          | نوع       | معنی آن                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | کلاس endpoint شناخته‌شدهٔ هسته، مانند `openrouter`، `moonshot-native`، یا `google-vertex`.        |
| `hosts`                        | `string[]` | نام‌های میزبان دقیق که به کلاس endpoint نگاشت می‌شوند.                                                |
| `hostSuffixes`                 | `string[]` | پسوندهای میزبان که به کلاس endpoint نگاشت می‌شوند. برای تطبیق فقط بر اساس پسوند دامنه، با `.` آغاز کنید. |
| `baseUrls`                     | `string[]` | URLهای پایهٔ HTTP(S) نرمال‌شدهٔ دقیق که به کلاس endpoint نگاشت می‌شوند.                             |
| `googleVertexRegion`           | `string`   | ناحیهٔ ثابت Google Vertex برای میزبان‌های جهانی دقیق.                                            |
| `googleVertexRegionHostSuffix` | `string`   | پسوندی که از میزبان‌های منطبق حذف می‌شود تا پیشوند ناحیهٔ Google Vertex آشکار شود.                 |

## مرجع providerRequest

از `providerRequest` برای فرادادهٔ ارزانِ سازگاری درخواست استفاده کنید که سیاست درخواست عمومی
بدون بارگذاری زمان اجرای ارائه‌دهنده به آن نیاز دارد. بازنویسی payload ویژهٔ رفتار را در هوک‌های زمان اجرای
ارائه‌دهنده یا کمک‌کننده‌های مشترک خانوادهٔ ارائه‌دهنده نگه دارید.

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
| `family`              | `string`     | برچسب خانوادهٔ ارائه‌دهنده که در تصمیم‌های سازگاری درخواست عمومی و عیب‌یابی استفاده می‌شود. |
| `compatibilityFamily` | `"moonshot"` | سطل اختیاری سازگاری خانوادهٔ ارائه‌دهنده برای کمک‌کننده‌های مشترک درخواست.              |
| `openAICompletions`   | `object`     | پرچم‌های درخواست تکمیل‌های سازگار با OpenAI، در حال حاضر `supportsStreamingUsage`.       |

## مرجع modelPricing

زمانی از `modelPricing` استفاده کنید که یک ارائه‌دهنده پیش از بارگذاری زمان اجرا به رفتار قیمت‌گذاری
control-plane نیاز دارد. کش قیمت‌گذاری Gateway این فراداده را بدون وارد کردن کد زمان اجرای
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
| `external`   | `boolean`         | برای ارائه‌دهندگان محلی/خودمیزبان که هرگز نباید قیمت‌گذاری OpenRouter یا LiteLLM را دریافت کنند، روی `false` تنظیم کنید. |
| `openRouter` | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری OpenRouter. مقدار `false` جست‌وجوی OpenRouter را برای این ارائه‌دهنده غیرفعال می‌کند.           |
| `liteLLM`    | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری LiteLLM. مقدار `false` جست‌وجوی LiteLLM را برای این ارائه‌دهنده غیرفعال می‌کند.                 |

فیلدهای منبع:

| فیلد                      | نوع               | معنی آن                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | شناسهٔ ارائه‌دهنده در کاتالوگ خارجی وقتی با شناسهٔ ارائه‌دهندهٔ OpenClaw متفاوت است، برای مثال `z-ai` برای یک ارائه‌دهندهٔ `zai`. |
| `passthroughProviderModel` | `boolean`          | شناسه‌های مدل دارای اسلش را به‌عنوان ارجاع‌های تودرتوی provider/model در نظر بگیر، که برای ارائه‌دهندگان پروکسی مانند OpenRouter مفید است.       |
| `modelIdTransforms`        | `"version-dots"[]` | گونه‌های اضافی شناسهٔ مدل در کاتالوگ خارجی. `version-dots` شناسه‌های نسخهٔ نقطه‌دار مانند `claude-opus-4.6` را امتحان می‌کند.            |

### نمایهٔ ارائه‌دهندگان OpenClaw

نمایهٔ ارائه‌دهندگان OpenClaw فرادادهٔ پیش‌نمایشِ متعلق به OpenClaw برای ارائه‌دهندگانی است
که Pluginهای آن‌ها ممکن است هنوز نصب نشده باشند. این بخشی از مانیفست Plugin نیست.
مانیفست‌های Plugin همچنان مرجع Plugin نصب‌شده هستند. نمایهٔ ارائه‌دهندگان
قرارداد fallback داخلی است که سطوح آیندهٔ ارائه‌دهندهٔ قابل نصب و انتخاب‌گر مدل پیش از نصب
وقتی یک Plugin ارائه‌دهنده نصب نیست مصرف خواهند کرد.

ترتیب مرجعیت کاتالوگ:

1. پیکربندی کاربر.
2. `modelCatalog` در مانیفست Plugin نصب‌شده.
3. کش کاتالوگ مدل از تازه‌سازی صریح.
4. ردیف‌های پیش‌نمایش نمایهٔ ارائه‌دهندگان OpenClaw.

نمایهٔ ارائه‌دهندگان نباید شامل secrets، وضعیت فعال‌شده، هوک‌های زمان اجرا، یا
دادهٔ زندهٔ مدل مخصوص حساب باشد. کاتالوگ‌های پیش‌نمایش آن از همان شکل ردیف ارائه‌دهندهٔ
`modelCatalog` مانند مانیفست‌های Plugin استفاده می‌کنند، اما باید به فرادادهٔ نمایشی پایدار محدود بمانند
مگر اینکه فیلدهای adapter زمان اجرا مانند `api`، `baseUrl`، قیمت‌گذاری، یا پرچم‌های سازگاری
عمداً با مانیفست Plugin نصب‌شده هم‌راستا نگه داشته شوند. ارائه‌دهندگانی که کشف زندهٔ `/models` دارند باید
ردیف‌های تازه‌سازی‌شده را از مسیر صریح کش کاتالوگ مدل بنویسند، به‌جای اینکه فهرست‌گیری معمولی
یا onboarding را وادار به فراخوانی APIهای ارائه‌دهنده کنند.

مدخل‌های نمایهٔ ارائه‌دهندگان همچنین ممکن است فرادادهٔ Plugin قابل نصب را برای ارائه‌دهندگانی داشته باشند
که Plugin آن‌ها از هسته خارج شده یا به‌نحوی هنوز نصب نشده است. این فراداده
الگوی کاتالوگ کانال را بازتاب می‌دهد: نام بسته، مشخصهٔ نصب npm،
یکپارچگی مورد انتظار، و برچسب‌های ارزانِ انتخاب احراز هویت برای نمایش یک
گزینهٔ راه‌اندازی قابل نصب کافی هستند. پس از نصب Plugin، مانیفست آن برنده می‌شود و
مدخل نمایهٔ ارائه‌دهندگان برای آن ارائه‌دهنده نادیده گرفته می‌شود.

کلیدهای capability سطح بالای قدیمی منسوخ شده‌اند. از `openclaw doctor --fix` برای
انتقال `speechProviders`، `realtimeTranscriptionProviders`،
`realtimeVoiceProviders`، `mediaUnderstandingProviders`,
`imageGenerationProviders`، `videoGenerationProviders`,
`webFetchProviders`، و `webSearchProviders` به زیر `contracts` استفاده کنید؛ بارگذاری معمولی
مانیفست دیگر آن فیلدهای سطح بالا را به‌عنوان مالکیت capability در نظر نمی‌گیرد.

## مانیفست در برابر package.json

این دو فایل کارهای متفاوتی انجام می‌دهند:

| فایل                   | کاربرد                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | کشف، اعتبارسنجی پیکربندی، فرادادهٔ انتخاب احراز هویت، و راهنمایی‌های UI که باید پیش از اجرای کد Plugin وجود داشته باشند                         |
| `package.json`         | فرادادهٔ npm، نصب وابستگی، و بلوک `openclaw` که برای entrypointها، کنترل نصب، راه‌اندازی، یا فرادادهٔ کاتالوگ استفاده می‌شود |

اگر مطمئن نیستید یک قطعه فراداده کجا قرار می‌گیرد، از این قاعده استفاده کنید:

- اگر OpenClaw باید پیش از بارگذاری کد Plugin آن را بداند، آن را در `openclaw.plugin.json` بگذارید
- اگر دربارهٔ بسته‌بندی، فایل‌های ورودی، یا رفتار نصب npm است، آن را در `package.json` بگذارید

### فیلدهای package.json که بر کشف اثر می‌گذارند

برخی فراداده‌های Plugin پیش از زمان اجرا عمداً به‌جای `openclaw.plugin.json` در
بلوک `openclaw` داخل `package.json` قرار می‌گیرند.

نمونه‌های مهم:

| فیلد                                                             | معنی آن                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | نقاط ورود Plugin بومی را اعلام می‌کند. باید داخل دایرکتوری بسته Plugin بماند.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | نقاط ورود زمان اجرای JavaScript ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. باید داخل دایرکتوری بسته Plugin بماند.                                                                 |
| `openclaw.setupEntry`                                             | نقطه ورود سبک‌وزن و فقط مخصوص راه‌اندازی که هنگام آماده‌سازی اولیه، شروع با تأخیر کانال، و کشف وضعیت کانال فقط‌خواندنی/SecretRef استفاده می‌شود. باید داخل دایرکتوری بسته Plugin بماند. |
| `openclaw.runtimeSetupEntry`                                      | نقطه ورود راه‌اندازی JavaScript ساخته‌شده را برای بسته‌های نصب‌شده اعلام می‌کند. باید داخل دایرکتوری بسته Plugin بماند.                                                                |
| `openclaw.channel`                                                | فراداده کم‌هزینه کاتالوگ کانال مانند برچسب‌ها، مسیرهای مستندات، نام‌های مستعار، و متن انتخاب.                                                                                                 |
| `openclaw.channel.commands`                                       | فراداده ایستای فرمان بومی و پیش‌فرض خودکار skill بومی که پیش از بارگذاری زمان اجرای کانال توسط سطوح پیکربندی، ممیزی، و فهرست فرمان‌ها استفاده می‌شود.                                          |
| `openclaw.channel.configuredState`                                | فراداده سبک‌وزن بررسی‌کننده وضعیت پیکربندی‌شده که می‌تواند بدون بارگذاری زمان اجرای کامل کانال پاسخ دهد «آیا راه‌اندازی فقط با env از قبل وجود دارد؟».                                         |
| `openclaw.channel.persistedAuthState`                             | فراداده سبک‌وزن بررسی‌کننده احراز هویت پایدارشده که می‌تواند بدون بارگذاری زمان اجرای کامل کانال پاسخ دهد «آیا چیزی از قبل وارد شده است؟».                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | راهنمایی‌های نصب/به‌روزرسانی برای Pluginهای همراه و منتشرشده بیرونی.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | مسیر نصب ترجیحی وقتی چند منبع نصب در دسترس است.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | حداقل نسخه پشتیبانی‌شده میزبان OpenClaw، با استفاده از یک کف semver مانند `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | رشته یکپارچگی dist مورد انتظار npm مانند `sha512-...`؛ جریان‌های نصب و به‌روزرسانی مصنوع دریافت‌شده را در برابر آن راستی‌آزمایی می‌کنند.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | یک مسیر بازیابی محدود برای نصب مجدد Plugin همراه را وقتی پیکربندی نامعتبر است مجاز می‌کند.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | اجازه می‌دهد سطوح کانال فقط مخصوص راه‌اندازی پیش از Plugin کامل کانال هنگام شروع بارگذاری شوند.                                                                                                 |

فراداده manifest تعیین می‌کند پیش از بارگذاری زمان اجرا کدام گزینه‌های provider/کانال/راه‌اندازی در
آماده‌سازی اولیه ظاهر شوند. `package.json#openclaw.install` به
آماده‌سازی اولیه می‌گوید وقتی کاربر یکی از آن گزینه‌ها را انتخاب می‌کند،
چگونه آن Plugin را دریافت یا فعال کند. راهنمایی‌های نصب را به `openclaw.plugin.json` منتقل نکنید.

`openclaw.install.minHostVersion` هنگام نصب و بارگذاری رجیستری manifest
اعمال می‌شود. مقدارهای نامعتبر رد می‌شوند؛ مقدارهای جدیدتر اما معتبر باعث می‌شوند
Plugin روی میزبان‌های قدیمی‌تر نادیده گرفته شود.

سنجاق‌کردن دقیق نسخه npm از قبل در `npmSpec` قرار دارد، برای مثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. ورودی‌های رسمی کاتالوگ بیرونی
باید specهای دقیق را با `expectedIntegrity` همراه کنند تا اگر مصنوع npm دریافت‌شده
دیگر با انتشار سنجاق‌شده مطابقت نداشت، جریان‌های به‌روزرسانی به‌صورت بسته شکست بخورند.
آماده‌سازی اولیه تعاملی همچنان specهای npm رجیستری قابل‌اعتماد، از جمله
نام‌های ساده بسته و dist-tagها، را برای سازگاری پیشنهاد می‌دهد. عیب‌یابی‌های کاتالوگ می‌توانند
منابع دقیق، شناور، سنجاق‌شده با یکپارچگی، فاقد یکپارچگی، دارای عدم‌تطابق نام بسته،
و دارای انتخاب پیش‌فرض نامعتبر را تشخیص دهند. همچنین وقتی
`expectedIntegrity` وجود دارد اما هیچ منبع npm معتبری برای سنجاق‌کردن آن نیست، هشدار می‌دهند.
وقتی `expectedIntegrity` وجود دارد،
جریان‌های نصب/به‌روزرسانی آن را اعمال می‌کنند؛ وقتی حذف شده باشد، حل‌وفصل رجیستری
بدون سنجاق یکپارچگی ثبت می‌شود.

Pluginهای کانال باید وقتی بررسی‌های وضعیت، فهرست کانال،
یا SecretRef نیاز دارند حساب‌های پیکربندی‌شده را بدون بارگذاری زمان اجرای کامل
شناسایی کنند، `openclaw.setupEntry` ارائه دهند. ورودی راه‌اندازی باید فراداده کانال به‌همراه پیکربندی،
وضعیت، و آداپتورهای اسرارِ امن برای راه‌اندازی را در معرض بگذارد؛ کلاینت‌های شبکه، شنونده‌های Gateway، و
زمان‌های اجرای انتقال را در نقطه ورود اصلی extension نگه دارید.

فیلدهای نقطه ورود زمان اجرا بررسی‌های مرز بسته برای فیلدهای نقطه ورود
منبع را بازنویسی نمی‌کنند. برای مثال، `openclaw.runtimeExtensions` نمی‌تواند یک مسیر
گریزان `openclaw.extensions` را قابل بارگذاری کند.

`openclaw.install.allowInvalidConfigRecovery` عمداً محدود است. این گزینه
پیکربندی‌های خراب دلخواه را قابل نصب نمی‌کند. امروز فقط به جریان‌های نصب اجازه می‌دهد
از شکست‌های مشخص ارتقای Plugin همراه قدیمی بازیابی شوند، مانند
مسیر Plugin همراهِ مفقود یا ورودی قدیمی `channels.<id>` برای همان
Plugin همراه. خطاهای پیکربندی نامرتبط همچنان نصب را مسدود می‌کنند و اپراتورها را
به `openclaw doctor --fix` می‌فرستند.

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

وقتی راه‌اندازی، doctor، وضعیت، یا جریان‌های حضور فقط‌خواندنی به یک
بررسی ارزان بله/خیر احراز هویت پیش از بارگذاری Plugin کامل کانال نیاز دارند، از آن استفاده کنید. وضعیت احراز هویت پایدارشده
وضعیت کانال پیکربندی‌شده نیست: از این فراداده برای فعال‌سازی خودکار Pluginها،
ترمیم وابستگی‌های زمان اجرا، یا تصمیم‌گیری درباره اینکه آیا زمان اجرای کانال باید بارگذاری شود استفاده نکنید.
export هدف باید یک تابع کوچک باشد که فقط وضعیت پایدارشده را می‌خواند؛
آن را از طریق barrel کامل زمان اجرای کانال مسیریابی نکنید.

`openclaw.channel.configuredState` برای بررسی‌های ارزان پیکربندی‌شده فقط env
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
غیرزمان‌اجرا پاسخ دهد، از آن استفاده کنید. اگر بررسی به حل‌وفصل کامل پیکربندی یا زمان اجرای واقعی
کانال نیاز دارد، آن منطق را به‌جای آن در hook
`config.hasConfiguredState` مربوط به Plugin نگه دارید.

## اولویت کشف (شناسه‌های تکراری Plugin)

OpenClaw Pluginها را از چند ریشه کشف می‌کند (همراه، نصب سراسری، workspace، مسیرهای صریح انتخاب‌شده در پیکربندی). اگر دو کشف `id` یکسانی داشته باشند، فقط manifest با **بالاترین اولویت** نگه داشته می‌شود؛ موارد تکراری با اولویت پایین‌تر به‌جای بارگذاری کنار آن حذف می‌شوند.

اولویت، از بالاترین به پایین‌ترین:

1. **انتخاب‌شده در پیکربندی** — مسیری که صراحتاً در `plugins.entries.<id>` سنجاق شده است
2. **همراه** — Pluginهایی که با OpenClaw عرضه می‌شوند
3. **نصب سراسری** — Pluginهایی که در ریشه سراسری Pluginهای OpenClaw نصب شده‌اند
4. **Workspace** — Pluginهایی که نسبت به workspace فعلی کشف می‌شوند

پیامدها:

- یک کپی forkشده یا قدیمی از یک Plugin همراه که در workspace قرار دارد، build همراه را تحت‌الشعاع قرار نمی‌دهد.
- برای بازنویسی واقعی یک Plugin همراه با نسخه محلی، آن را از طریق `plugins.entries.<id>` سنجاق کنید تا بر اساس اولویت برنده شود، نه با اتکا به کشف workspace.
- حذف موارد تکراری ثبت می‌شود تا Doctor و عیب‌یابی‌های شروع بتوانند به کپی کنارگذاشته‌شده اشاره کنند.

## الزامات JSON Schema

- **هر Plugin باید یک JSON Schema همراه خود داشته باشد**، حتی اگر هیچ پیکربندی‌ای نپذیرد.
- schema خالی قابل قبول است (برای مثال، `{ "type": "object", "additionalProperties": false }`).
- schemaها هنگام خواندن/نوشتن پیکربندی اعتبارسنجی می‌شوند، نه هنگام زمان اجرا.

## رفتار اعتبارسنجی

- کلیدهای ناشناخته `channels.*` **خطا** هستند، مگر اینکه شناسه کانال توسط
  یک manifest مربوط به Plugin اعلام شده باشد.
- `plugins.entries.<id>`، `plugins.allow`، `plugins.deny`، و `plugins.slots.*`
  باید به شناسه‌های Plugin **قابل کشف** ارجاع دهند. شناسه‌های ناشناخته **خطا** هستند.
- اگر یک Plugin نصب شده باشد اما manifest یا schema آن خراب یا مفقود باشد،
  اعتبارسنجی شکست می‌خورد و Doctor خطای Plugin را گزارش می‌کند.
- اگر پیکربندی Plugin وجود داشته باشد اما Plugin **غیرفعال** باشد، پیکربندی نگه داشته می‌شود و
  یک **هشدار** در Doctor + لاگ‌ها نمایش داده می‌شود.

برای schema کامل `plugins.*`، [مرجع پیکربندی](/fa/gateway/configuration) را ببینید.

## یادداشت‌ها

- manifest برای **Pluginهای بومی OpenClaw الزامی است**، از جمله بارگذاری‌های فایل‌سیستم محلی. زمان اجرا همچنان ماژول Plugin را جداگانه بارگذاری می‌کند؛ manifest فقط برای کشف + اعتبارسنجی است.
- manifestهای بومی با JSON5 پارس می‌شوند، بنابراین کامنت‌ها، ویرگول‌های پایانی، و کلیدهای بدون نقل‌قول تا وقتی مقدار نهایی همچنان یک object باشد پذیرفته می‌شوند.
- فقط فیلدهای مستندسازی‌شده manifest توسط بارگذار manifest خوانده می‌شوند. از کلیدهای سطح بالای سفارشی پرهیز کنید.
- وقتی یک Plugin به `channels`، `providers`، `cliBackends`، و `skills` نیاز ندارد، همه آن‌ها می‌توانند حذف شوند.
- `providerDiscoveryEntry` باید سبک‌وزن بماند و نباید کد گسترده زمان اجرا را import کند؛ از آن برای فراداده ایستای کاتالوگ provider یا توصیف‌گرهای محدود کشف استفاده کنید، نه اجرای هنگام درخواست.
- گونه‌های انحصاری Plugin از طریق `plugins.slots.*` انتخاب می‌شوند: `kind: "memory"` از طریق `plugins.slots.memory`، `kind: "context-engine"` از طریق `plugins.slots.contextEngine` (پیش‌فرض `legacy`).
- گونه انحصاری Plugin را در این manifest اعلام کنید. `OpenClawPluginDefinition.kind` در ورودی زمان اجرا منسوخ شده و فقط به‌عنوان fallback سازگاری برای Pluginهای قدیمی‌تر باقی مانده است.
- فراداده env-var (`setup.providers[].envVars`، `providerAuthEnvVars` منسوخ‌شده، و `channelEnvVars`) فقط declarative است. وضعیت، ممیزی، اعتبارسنجی تحویل cron، و دیگر سطوح فقط‌خواندنی همچنان پیش از اینکه یک env var را پیکربندی‌شده بدانند، اعتماد Plugin و سیاست فعال‌سازی مؤثر را اعمال می‌کنند.
- برای فراداده wizard زمان اجرا که به کد provider نیاز دارد، [hookهای زمان اجرای provider](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
- اگر Plugin شما به ماژول‌های بومی وابسته است، مراحل build و هر الزام allowlist مدیر بسته را مستند کنید (برای مثال، pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## مرتبط

<CardGroup cols={3}>
  <Card title="ساخت Pluginها" href="/fa/plugins/building-plugins" icon="rocket">
    شروع کار با Pluginها.
  </Card>
  <Card title="معماری Plugin" href="/fa/plugins/architecture" icon="diagram-project">
    معماری داخلی و مدل قابلیت.
  </Card>
  <Card title="نمای کلی SDK" href="/fa/plugins/sdk-overview" icon="book">
    مرجع SDK مربوط به Plugin و importهای subpath.
  </Card>
</CardGroup>
