---
read_when:
    - شما در حال ساخت یک Plugin برای OpenClaw هستید
    - باید یک طرحوارهٔ پیکربندی Plugin ارائه کنید یا خطاهای اعتبارسنجی Plugin را اشکال‌زدایی کنید
summary: الزامات مانیفست Plugin + طرح‌واره JSON (اعتبارسنجی سخت‌گیرانه پیکربندی)
title: مانیفست Plugin
x-i18n:
    generated_at: "2026-04-30T00:06:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4209b10042eaa88dca33073f3f5b8a024ee760bbe096fc2f476e12c2a874628e
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

OpenClaw آن چیدمان‌های بسته را نیز به‌صورت خودکار شناسایی می‌کند، اما آن‌ها در برابر طرحوارهٔ `openclaw.plugin.json` که اینجا توضیح داده شده اعتبارسنجی نمی‌شوند.

برای بسته‌های سازگار، OpenClaw در حال حاضر فرادادهٔ بسته به‌همراه ریشه‌های Skills اعلام‌شده، ریشه‌های فرمان Claude، پیش‌فرض‌های `settings.json` در بستهٔ Claude، پیش‌فرض‌های LSP در بستهٔ Claude، و بسته‌های hook پشتیبانی‌شده را وقتی چیدمان با انتظارات زمان اجرای OpenClaw سازگار باشد می‌خواند.

هر Plugin بومی OpenClaw **باید** یک فایل `openclaw.plugin.json` را در **ریشهٔ Plugin** ارائه کند. OpenClaw از این مانیفست برای اعتبارسنجی پیکربندی **بدون اجرای کد Plugin** استفاده می‌کند. مانیفست‌های ناموجود یا نامعتبر به‌عنوان خطاهای Plugin تلقی می‌شوند و اعتبارسنجی پیکربندی را مسدود می‌کنند.

راهنمای کامل سامانهٔ Plugin را ببینید: [Pluginها](/fa/tools/plugin).
برای مدل قابلیت بومی و راهنمای فعلی سازگاری خارجی:
[مدل قابلیت](/fa/plugins/architecture#public-capability-model).

## این فایل چه کاری انجام می‌دهد

`openclaw.plugin.json` فراداده‌ای است که OpenClaw **پیش از بارگذاری کد Plugin شما** می‌خواند. همهٔ موارد زیر باید آن‌قدر سبک باشند که بدون راه‌اندازی زمان اجرای Plugin قابل بررسی باشند.

**از آن برای این موارد استفاده کنید:**

- هویت Plugin، اعتبارسنجی پیکربندی، و راهنمایی‌های رابط کاربری پیکربندی
- فرادادهٔ احراز هویت، ورود اولیه، و راه‌اندازی (نام مستعار، فعال‌سازی خودکار، متغیرهای محیطی ارائه‌دهنده، انتخاب‌های احراز هویت)
- راهنمایی‌های فعال‌سازی برای سطوح کنترل‌پلین
- مالکیت کوتاه‌نویسی خانوادهٔ مدل
- عکس‌های فوری مالکیت قابلیت ایستا (`contracts`)
- فرادادهٔ اجراکنندهٔ QA که میزبان مشترک `openclaw qa` بتواند بررسی کند
- فرادادهٔ پیکربندی مخصوص کانال که در سطوح کاتالوگ و اعتبارسنجی ادغام می‌شود

**از آن برای این موارد استفاده نکنید:** ثبت رفتار زمان اجرا، اعلام نقطه‌های ورود کد، یا فرادادهٔ نصب npm. این موارد به کد Plugin شما و `package.json` تعلق دارند.

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

## نمونهٔ غنی

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
| `autoEnableWhenConfiguredProviders`  | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده‌ای که وقتی احراز هویت، پیکربندی، یا ارجاع‌های مدل به آن‌ها اشاره کنند، باید این Plugin را خودکار فعال کنند.                                                                                                                                   |
| `kind`                               | خیر       | `"memory"` \| `"context-engine"` | نوع انحصاری Plugin را اعلام می‌کند که توسط `plugins.slots.*` استفاده می‌شود.                                                                                                                                                                      |
| `channels`                           | خیر       | `string[]`                       | شناسه‌های کانالی که مالکیتشان با این Plugin است. برای کشف و اعتبارسنجی پیکربندی استفاده می‌شود.                                                                                                                                                       |
| `providers`                          | خیر       | `string[]`                       | شناسه‌های ارائه‌دهنده‌ای که مالکیتشان با این Plugin است.                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | خیر       | `string`                         | مسیر سبک‌وزن ماژول کشف ارائه‌دهنده، نسبی به ریشهٔ Plugin، برای فرادادهٔ کاتالوگ ارائه‌دهنده در محدودهٔ مانیفست که می‌تواند بدون فعال‌سازی کامل زمان اجرای Plugin بارگذاری شود.                                             |
| `modelSupport`                       | خیر       | `object`                         | فرادادهٔ کوتاه خانوادهٔ مدل که مالکیتش با مانیفست است و برای بارگذاری خودکار Plugin پیش از زمان اجرا استفاده می‌شود.                                                                                                                                       |
| `modelCatalog`                       | خیر       | `object`                         | فرادادهٔ اعلانی کاتالوگ مدل برای ارائه‌دهنده‌هایی که مالکیتشان با این Plugin است. این قرارداد سطح کنترل برای فهرست‌کردن فقط‌خواندنی آینده، راه‌اندازی اولیه، انتخاب‌گرهای مدل، نام‌های مستعار، و سرکوب بدون بارگذاری زمان اجرای Plugin است.       |
| `modelPricing`                       | خیر       | `object`                         | سیاست جست‌وجوی قیمت‌گذاری خارجی که مالکیتش با ارائه‌دهنده است. از آن برای خارج‌کردن ارائه‌دهنده‌های محلی/خودمیزبان از کاتالوگ‌های قیمت‌گذاری راه‌دور یا نگاشت ارجاع‌های ارائه‌دهنده به شناسه‌های کاتالوگ OpenRouter/LiteLLM بدون کدنویسی سخت شناسه‌های ارائه‌دهنده در هسته استفاده کنید.           |
| `modelIdNormalization`               | خیر       | `object`                         | پاک‌سازی نام مستعار/پیشوند شناسهٔ مدل که مالکیتش با ارائه‌دهنده است و باید پیش از بارگذاری زمان اجرای ارائه‌دهنده اجرا شود.                                                                                                                                         |
| `providerEndpoints`                  | خیر       | `object[]`                       | فرادادهٔ میزبان/baseUrl نقطهٔ پایانی که مالکیتش با مانیفست است، برای مسیرهای ارائه‌دهنده که هسته باید پیش از بارگذاری زمان اجرای ارائه‌دهنده طبقه‌بندی کند.                                                                                                          |
| `providerRequest`                    | خیر       | `object`                         | فرادادهٔ ارزان خانوادهٔ ارائه‌دهنده و سازگاری درخواست که پیش از بارگذاری زمان اجرای ارائه‌دهنده توسط سیاست عمومی درخواست استفاده می‌شود.                                                                                                            |
| `cliBackends`                        | خیر       | `string[]`                       | شناسه‌های بک‌اند استنتاج CLI که مالکیتشان با این Plugin است. برای فعال‌سازی خودکار در شروع کار از ارجاع‌های صریح پیکربندی استفاده می‌شود.                                                                                                                       |
| `syntheticAuthRefs`                  | خیر       | `string[]`                       | ارجاع‌های ارائه‌دهنده یا بک‌اند CLI که قلاب احراز هویت مصنوعی متعلق به Plugin آن‌ها باید هنگام کشف سرد مدل، پیش از بارگذاری زمان اجرا، بررسی شود.                                                                                            |
| `nonSecretAuthMarkers`               | خیر       | `string[]`                       | مقادیر جای‌نگهدار کلید API متعلق به Plugin همراه که وضعیت محلی غیرمحرمانه، OAuth، یا اعتبارنامهٔ محیطی را نشان می‌دهند.                                                                                                              |
| `commandAliases`                     | خیر       | `object[]`                       | نام‌های فرمانی که مالکیتشان با این Plugin است و باید پیش از بارگذاری زمان اجرا، تشخیص‌های پیکربندی و CLI آگاه از Plugin تولید کنند.                                                                                                              |
| `providerAuthEnvVars`                | خیر       | `Record<string, string[]>`       | فرادادهٔ منسوخ سازگاری env برای جست‌وجوی احراز هویت/وضعیت ارائه‌دهنده. برای Pluginهای جدید `setup.providers[].envVars` را ترجیح دهید؛ OpenClaw همچنان در بازهٔ منسوخ‌سازی این را می‌خواند.                                               |
| `providerAuthAliases`                | خیر       | `Record<string, string>`         | شناسه‌های ارائه‌دهنده‌ای که باید برای جست‌وجوی احراز هویت از شناسهٔ ارائه‌دهندهٔ دیگری استفاده کنند، برای مثال یک ارائه‌دهندهٔ کدنویسی که کلید API و پروفایل‌های احراز هویت ارائه‌دهندهٔ پایه را به‌اشتراک می‌گذارد.                                                                        |
| `channelEnvVars`                     | خیر       | `Record<string, string[]>`       | فرادادهٔ ارزان env کانال که OpenClaw می‌تواند بدون بارگذاری کد Plugin بررسی کند. از این برای راه‌اندازی کانال مبتنی بر env یا سطح‌های احراز هویتی استفاده کنید که کمک‌کننده‌های عمومی شروع کار/پیکربندی باید ببینند.                                          |
| `providerAuthChoices`                | خیر       | `object[]`                       | فرادادهٔ ارزان گزینهٔ احراز هویت برای انتخاب‌گرهای راه‌اندازی اولیه، حل ارائه‌دهندهٔ ترجیحی، و سیم‌کشی سادهٔ پرچم CLI.                                                                                                                     |
| `activation`                         | خیر       | `object`                         | فرادادهٔ ارزان برنامه‌ریز فعال‌سازی برای بارگذاری هنگام شروع کار، ارائه‌دهنده، فرمان، کانال، مسیر، و قابلیت‌محور. فقط فراداده است؛ زمان اجرای Plugin همچنان مالک رفتار واقعی است.                                                     |
| `setup`                              | خیر       | `object`                         | توصیف‌گرهای ارزان راه‌اندازی/راه‌اندازی اولیه که سطح‌های کشف و راه‌اندازی می‌توانند بدون بارگذاری زمان اجرای Plugin بررسی کنند.                                                                                                                  |
| `qaRunners`                          | خیر       | `object[]`                       | توصیف‌گرهای ارزان اجراکنندهٔ QA که میزبان مشترک `openclaw qa` پیش از بارگذاری زمان اجرای Plugin از آن‌ها استفاده می‌کند.                                                                                                                                    |
| `contracts`                          | خیر       | `object`                         | اسنپ‌شات ایستای قابلیت همراه برای قلاب‌های احراز هویت خارجی، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید موسیقی، تولید ویدئو، واکشی وب، جست‌وجوی وب، و مالکیت ابزار. |
| `mediaUnderstandingProviderMetadata` | خیر       | `Record<string, object>`         | پیش‌فرض‌های ارزان درک رسانه برای شناسه‌های ارائه‌دهنده‌ای که در `contracts.mediaUnderstandingProviders` اعلام شده‌اند.                                                                                                                          |
| `channelConfigs`                     | خیر       | `Record<string, object>`         | فرادادهٔ پیکربندی کانال که مالکیتش با مانیفست است و پیش از بارگذاری زمان اجرا در سطح‌های کشف و اعتبارسنجی ادغام می‌شود.                                                                                                                        |
| `skills`                             | خیر       | `string[]`                       | دایرکتوری‌های Skills برای بارگذاری، نسبی به ریشهٔ Plugin.                                                                                                                                                                           |
| `name`                               | خیر       | `string`                         | نام خوانای انسانی Plugin.                                                                                                                                                                                                       |
| `description`                        | خیر       | `string`                         | خلاصهٔ کوتاهی که در سطح‌های Plugin نمایش داده می‌شود.                                                                                                                                                                                           |
| `version`                            | خیر       | `string`                         | نسخهٔ اطلاعاتی Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | خیر       | `Record<string, object>`         | برچسب‌های UI، جای‌نگهدارها، و راهنمای حساسیت برای فیلدهای پیکربندی.                                                                                                                                                                 |

## مرجع providerAuthChoices

هر ورودی `providerAuthChoices` یک گزینهٔ راه‌اندازی اولیه یا احراز هویت را توصیف می‌کند.
OpenClaw این را پیش از بارگذاری زمان اجرای ارائه‌دهنده می‌خواند.
فهرست‌های راه‌اندازی ارائه‌دهنده از این گزینه‌های مانیفست، گزینه‌های راه‌اندازی
مشتق‌شده از توصیف‌گر، و فرادادهٔ کاتالوگ نصب بدون بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌کنند.

| فیلد                  | الزامی | نوع                                             | معنی آن                                                                                                      |
| --------------------- | ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`            | بله    | `string`                                        | شناسه ارائه‌دهنده‌ای که این گزینه به آن تعلق دارد.                                                           |
| `method`              | بله    | `string`                                        | شناسه روش احراز هویت برای ارسال به آن.                                                                       |
| `choiceId`            | بله    | `string`                                        | شناسه پایدار گزینه احراز هویت که در جریان‌های راه‌اندازی اولیه و CLI استفاده می‌شود.                         |
| `choiceLabel`         | خیر    | `string`                                        | برچسب قابل مشاهده برای کاربر. اگر حذف شود، OpenClaw به `choiceId` بازمی‌گردد.                                |
| `choiceHint`          | خیر    | `string`                                        | متن راهنمای کوتاه برای انتخاب‌گر.                                                                            |
| `assistantPriority`   | خیر    | `number`                                        | مقدارهای پایین‌تر در انتخاب‌گرهای تعاملی هدایت‌شده توسط دستیار زودتر مرتب می‌شوند.                           |
| `assistantVisibility` | خیر    | `"visible"` \| `"manual-only"`                  | گزینه را از انتخاب‌گرهای دستیار پنهان می‌کند، در حالی که همچنان انتخاب دستی از CLI را مجاز نگه می‌دارد.      |
| `deprecatedChoiceIds` | خیر    | `string[]`                                      | شناسه‌های گزینه قدیمی که باید کاربران را به این گزینه جایگزین هدایت کنند.                                     |
| `groupId`             | خیر    | `string`                                        | شناسه گروه اختیاری برای گروه‌بندی گزینه‌های مرتبط.                                                           |
| `groupLabel`          | خیر    | `string`                                        | برچسب قابل مشاهده برای کاربر برای آن گروه.                                                                   |
| `groupHint`           | خیر    | `string`                                        | متن راهنمای کوتاه برای گروه.                                                                                 |
| `optionKey`           | خیر    | `string`                                        | کلید گزینه داخلی برای جریان‌های احراز هویت ساده تک‌پرچمی.                                                    |
| `cliFlag`             | خیر    | `string`                                        | نام پرچم CLI، مانند `--openrouter-api-key`.                                                                  |
| `cliOption`           | خیر    | `string`                                        | شکل کامل گزینه CLI، مانند `--openrouter-api-key <key>`.                                                      |
| `cliDescription`      | خیر    | `string`                                        | توضیحی که در راهنمای CLI استفاده می‌شود.                                                                     |
| `onboardingScopes`    | خیر    | `Array<"text-inference" \| "image-generation">` | این گزینه باید در کدام سطح‌های راه‌اندازی اولیه ظاهر شود. اگر حذف شود، مقدار پیش‌فرض آن `["text-inference"]` است. |

## مرجع commandAliases

از `commandAliases` زمانی استفاده کنید که یک plugin مالک نام فرمان runtime باشد که کاربران ممکن است
به‌اشتباه در `plugins.allow` قرار دهند یا تلاش کنند آن را به‌عنوان فرمان ریشه CLI اجرا کنند. OpenClaw
از این فراداده برای تشخیص‌ها بدون وارد کردن کد runtime مربوط به plugin استفاده می‌کند.

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

| فیلد         | الزامی | نوع               | معنی آن                                                                    |
| ------------ | ------ | ----------------- | -------------------------------------------------------------------------- |
| `name`       | بله    | `string`          | نام فرمانی که به این plugin تعلق دارد.                                     |
| `kind`       | خیر    | `"runtime-slash"` | نام مستعار را به‌جای فرمان ریشه CLI، به‌عنوان فرمان اسلش گفت‌وگو علامت می‌زند. |
| `cliCommand` | خیر    | `string`          | فرمان ریشه CLI مرتبط که برای عملیات CLI پیشنهاد می‌شود، اگر وجود داشته باشد. |

## مرجع activation

از `activation` زمانی استفاده کنید که plugin بتواند با هزینه کم اعلام کند کدام رویدادهای control-plane
باید آن را در طرح فعال‌سازی/بارگذاری قرار دهند.

این بلوک فراداده برنامه‌ریز است، نه API چرخه عمر. رفتار runtime را ثبت نمی‌کند،
جایگزین `register(...)` نمی‌شود، و تضمین نمی‌کند که کد plugin از قبل اجرا شده باشد.
برنامه‌ریز activation از این فیلدها برای محدود کردن pluginهای نامزد پیش از بازگشت به فراداده مالکیت manifest موجود
مانند `providers`، `channels`، `commandAliases`، `setup.providers`،
`contracts.tools` و hookها استفاده می‌کند.

باریک‌ترین فراداده‌ای را ترجیح دهید که از قبل مالکیت را توصیف می‌کند. از
`providers`، `channels`، `commandAliases`، توصیف‌گرهای setup یا `contracts`
زمانی استفاده کنید که آن فیلدها رابطه را بیان می‌کنند. از `activation` برای راهنمایی‌های اضافی برنامه‌ریز
استفاده کنید که با آن فیلدهای مالکیت قابل نمایش نیستند.
از `cliBackends` سطح بالا برای نام‌های مستعار runtime مربوط به CLI مانند `claude-cli`،
`codex-cli` یا `google-gemini-cli` استفاده کنید؛ `activation.onAgentHarnesses` فقط برای
شناسه‌های harness عامل تعبیه‌شده است که از قبل فیلد مالکیت ندارند.

این بلوک فقط فراداده است. رفتار runtime را ثبت نمی‌کند و جایگزین
`register(...)`، `setupEntry` یا سایر نقطه‌های ورود runtime/plugin نمی‌شود.
مصرف‌کنندگان فعلی از آن به‌عنوان راهنمای محدودسازی پیش از بارگذاری گسترده‌تر plugin استفاده می‌کنند، بنابراین
نبود فراداده activation معمولاً فقط هزینه عملکردی دارد؛ تا زمانی که fallbackهای مالکیت manifest قدیمی همچنان وجود دارند،
نباید درستی را تغییر دهد.

هر plugin باید `activation.onStartup` را آگاهانه تنظیم کند، زیرا OpenClaw در حال فاصله گرفتن
از importهای ضمنی startup است. فقط زمانی آن را روی `true` بگذارید که plugin باید
هنگام راه‌اندازی Gateway اجرا شود. زمانی آن را روی `false` بگذارید که plugin در
startup غیرفعال است و فقط باید از triggerهای باریک‌تر بارگذاری شود. حذف `onStartup`
fallback قدیمی و منسوخ sidecar ضمنی startup را برای pluginهایی که هیچ
فراداده قابلیت ایستای ندارند نگه می‌دارد؛ نسخه‌های آینده ممکن است بارگذاری در startup آن
pluginها را متوقف کنند، مگر اینکه `activation.onStartup: true` را اعلام کنند. گزارش‌های وضعیت و
سازگاری plugin وقتی plugin همچنان به آن fallback متکی باشد، با
`legacy-implicit-startup-sidecar` هشدار می‌دهند.

برای آزمون مهاجرت، مقدار
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` را تنظیم کنید تا فقط همان
fallback منسوخ غیرفعال شود. این حالت opt-in، pluginهای صریح
`activation.onStartup: true` یا pluginهایی را که با channel، config،
agent-harness، حافظه، یا triggerهای activation باریک‌تر دیگر بارگذاری می‌شوند مسدود نمی‌کند.

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

| فیلد               | الزامی | نوع                                                  | معنی آن                                                                                                                                                                                                                         |
| ------------------ | ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | خیر    | `boolean`                                            | فعال‌سازی صریح هنگام startup مربوط به Gateway. هر plugin باید این را تنظیم کند. `true` plugin را هنگام startup وارد می‌کند؛ `false` از fallback منسوخ startup ضمنی sidecar خارج می‌شود، مگر اینکه trigger منطبق دیگری بارگذاری را لازم کند. |
| `onProviders`      | خیر    | `string[]`                                           | شناسه‌های ارائه‌دهنده که باید این plugin را در طرح‌های activation/بارگذاری قرار دهند.                                                                                                                                          |
| `onAgentHarnesses` | خیر    | `string[]`                                           | شناسه‌های runtime مربوط به harness عامل تعبیه‌شده که باید این plugin را در طرح‌های activation/بارگذاری قرار دهند. برای نام‌های مستعار backend مربوط به CLI از `cliBackends` سطح بالا استفاده کنید.                              |
| `onCommands`       | خیر    | `string[]`                                           | شناسه‌های فرمان که باید این plugin را در طرح‌های activation/بارگذاری قرار دهند.                                                                                                                                                |
| `onChannels`       | خیر    | `string[]`                                           | شناسه‌های channel که باید این plugin را در طرح‌های activation/بارگذاری قرار دهند.                                                                                                                                              |
| `onRoutes`         | خیر    | `string[]`                                           | گونه‌های route که باید این plugin را در طرح‌های activation/بارگذاری قرار دهند.                                                                                                                                                 |
| `onConfigPaths`    | خیر    | `string[]`                                           | مسیرهای config نسبی به ریشه که وقتی مسیر حاضر است و صراحتاً غیرفعال نشده، باید این plugin را در طرح‌های startup/بارگذاری قرار دهند.                                                                                          |
| `onCapabilities`   | خیر    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | راهنمایی‌های گسترده capability که در برنامه‌ریزی activation مربوط به control-plane استفاده می‌شوند. هر وقت ممکن است فیلدهای باریک‌تر را ترجیح دهید.                                                                            |

مصرف‌کنندگان live فعلی:

- برنامه‌ریزی startup مربوط به Gateway از `activation.onStartup` برای import صریح startup
  و خروج از fallback منسوخ startup ضمنی sidecar استفاده می‌کند
- برنامه‌ریزی CLI که با فرمان trigger می‌شود، به
  `commandAliases[].cliCommand` یا `commandAliases[].name` قدیمی بازمی‌گردد
- برنامه‌ریزی startup مربوط به agent-runtime از `activation.onAgentHarnesses` برای
  harnessهای تعبیه‌شده و از `cliBackends[]` سطح بالا برای نام‌های مستعار runtime مربوط به CLI استفاده می‌کند
- برنامه‌ریزی setup/channel که با channel trigger می‌شود، وقتی فراداده صریح activation برای channel وجود ندارد
  به مالکیت قدیمی `channels[]` بازمی‌گردد
- برنامه‌ریزی plugin هنگام startup از `activation.onConfigPaths` برای سطح‌های config ریشه‌ای غیر-channel
  مانند بلوک `browser` در plugin مرورگر همراه استفاده می‌کند
- برنامه‌ریزی setup/runtime که با provider trigger می‌شود، وقتی فراداده صریح activation برای provider
  وجود ندارد به مالکیت قدیمی `providers[]` و `cliBackends[]` سطح بالا بازمی‌گردد

تشخیص‌های برنامه‌ریز می‌توانند راهنمایی‌های صریح activation را از fallback مالکیت manifest
تشخیص دهند. برای مثال، `activation-command-hint` یعنی
`activation.onCommands` منطبق شده، در حالی که `manifest-command-alias` یعنی
برنامه‌ریز به‌جای آن از مالکیت `commandAliases` استفاده کرده است. این برچسب‌های دلیل برای
تشخیص‌های میزبان و آزمون‌ها هستند؛ نویسندگان plugin باید همچنان فراداده‌ای را اعلام کنند
که مالکیت را به بهترین شکل توصیف می‌کند.

## مرجع qaRunners

از `qaRunners` زمانی استفاده کنید که یک plugin یک یا چند runner انتقال را در زیر
ریشه مشترک `openclaw qa` اضافه می‌کند. این فراداده را کم‌هزینه و ایستا نگه دارید؛ runtime مربوط به plugin
همچنان مالک ثبت واقعی CLI از طریق سطح سبک
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
| `commandName` | بله      | `string` | زیر‌دستوری که زیر `openclaw qa` نصب می‌شود، برای مثال `matrix`.    |
| `description` | خیر       | `string` | متن راهنمای جایگزین که وقتی میزبان مشترک به یک دستور stub نیاز دارد استفاده می‌شود. |

## مرجع setup

وقتی سطح‌های راه‌اندازی و ورود اولیه قبل از بارگذاری runtime به metadata ارزان و متعلق به Plugin نیاز دارند، از `setup` استفاده کنید.

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

`cliBackends` سطح بالا همچنان معتبر می‌ماند و همچنان backendهای استنتاج CLI را توصیف می‌کند. `setup.cliBackends` سطح توصیفگر مخصوص راه‌اندازی برای جریان‌های لایه کنترل/راه‌اندازی است که باید فقط در حد metadata باقی بمانند.

در صورت وجود، `setup.providers` و `setup.cliBackends` سطح ترجیحی جست‌وجوی مبتنی بر توصیفگر برای کشف راه‌اندازی هستند. اگر توصیفگر فقط Plugin نامزد را محدود می‌کند و راه‌اندازی هنوز به hookهای runtime غنی‌تر در زمان راه‌اندازی نیاز دارد، `requiresRuntime: true` را تنظیم کنید و `setup-api` را به‌عنوان مسیر اجرای جایگزین حفظ کنید.

OpenClaw همچنین `setup.providers[].envVars` را در جست‌وجوهای عمومی احراز هویت provider و متغیرهای محیطی وارد می‌کند. `providerAuthEnvVars` در طول بازه حذف تدریجی همچنان از طریق یک adapter سازگاری پشتیبانی می‌شود، اما Pluginهای غیرباندل‌شده‌ای که هنوز از آن استفاده می‌کنند یک diagnostic مانیفست دریافت می‌کنند. Pluginهای جدید باید metadata محیطی راه‌اندازی/وضعیت را روی `setup.providers[].envVars` قرار دهند.

OpenClaw همچنین می‌تواند انتخاب‌های ساده راه‌اندازی را از `setup.providers[].authMethods` استخراج کند وقتی هیچ ورودی راه‌اندازی در دسترس نیست، یا وقتی `setup.requiresRuntime: false` اعلام می‌کند runtime راه‌اندازی لازم نیست. ورودی‌های صریح `providerAuthChoices` همچنان برای برچسب‌های سفارشی، فلگ‌های CLI، دامنه ورود اولیه، و metadata دستیار ترجیح داده می‌شوند.

`requiresRuntime: false` را فقط وقتی تنظیم کنید که آن توصیفگرها برای سطح راه‌اندازی کافی باشند. OpenClaw مقدار صریح `false` را به‌عنوان یک قرارداد فقط-توصیفگر در نظر می‌گیرد و برای جست‌وجوی راه‌اندازی `setup-api` یا `openclaw.setupEntry` را اجرا نمی‌کند. اگر یک Plugin فقط-توصیفگر همچنان یکی از آن ورودی‌های runtime راه‌اندازی را منتشر کند، OpenClaw یک diagnostic افزایشی گزارش می‌کند و همچنان آن را نادیده می‌گیرد. حذف `requiresRuntime` رفتار جایگزین legacy را حفظ می‌کند تا Pluginهای موجودی که توصیفگرها را بدون این فلگ اضافه کرده‌اند نشکنند.

از آنجا که جست‌وجوی راه‌اندازی می‌تواند کد `setup-api` متعلق به Plugin را اجرا کند، مقدارهای نرمال‌شده `setup.providers[].id` و `setup.cliBackends[]` باید در همه Pluginهای کشف‌شده یکتا بمانند. مالکیت مبهم به‌جای انتخاب برنده بر اساس ترتیب کشف، به‌صورت بسته شکست می‌خورد.

وقتی runtime راه‌اندازی اجرا می‌شود، diagnosticهای رجیستری راه‌اندازی در صورت drift توصیفگر گزارش می‌دهند: اگر `setup-api` یک provider یا backend CLI را ثبت کند که توصیفگرهای مانیفست اعلام نکرده‌اند، یا اگر یک توصیفگر ثبت runtime متناظری نداشته باشد. این diagnosticها افزایشی هستند و Pluginهای legacy را رد نمی‌کنند.

### مرجع setup.providers

| فیلد          | الزامی | نوع       | معنی آن                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | بله      | `string`   | شناسه provider که هنگام راه‌اندازی یا ورود اولیه نمایش داده می‌شود. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید.             |
| `authMethods`  | خیر       | `string[]` | شناسه‌های روش راه‌اندازی/احراز هویت که این provider بدون بارگذاری runtime کامل پشتیبانی می‌کند.                       |
| `envVars`      | خیر       | `string[]` | متغیرهای محیطی که سطح‌های عمومی راه‌اندازی/وضعیت می‌توانند پیش از بارگذاری runtime Plugin بررسی کنند.               |
| `authEvidence` | خیر       | `object[]` | بررسی‌های ارزان شواهد احراز هویت محلی برای providerهایی که می‌توانند از طریق نشانگرهای غیرمحرمانه احراز هویت شوند. |

`authEvidence` برای نشانگرهای اعتبارنامه محلی متعلق به provider است که می‌توانند بدون بارگذاری کد runtime تأیید شوند. این بررسی‌ها باید ارزان و محلی بمانند: بدون فراخوانی شبکه، بدون خواندن keychain یا secret-manager، بدون دستورهای shell، و بدون probeهای API provider.

ورودی‌های شواهد پشتیبانی‌شده:

| فیلد              | الزامی | نوع       | معنی آن                                                                                 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------- |
| `type`             | بله      | `string`   | در حال حاضر `local-file-with-env`.                                                              |
| `fileEnvVar`       | خیر       | `string`   | متغیر محیطی شامل مسیر صریح فایل اعتبارنامه.                                          |
| `fallbackPaths`    | خیر       | `string[]` | مسیرهای فایل اعتبارنامه محلی که وقتی `fileEnvVar` وجود ندارد یا خالی است بررسی می‌شوند. از `${HOME}` پشتیبانی می‌کند. |
| `requiresAnyEnv`   | خیر       | `string[]` | دست‌کم یکی از متغیرهای محیطی فهرست‌شده باید غیرخالی باشد تا شواهد معتبر شوند.                   |
| `requiresAllEnv`   | خیر       | `string[]` | همه متغیرهای محیطی فهرست‌شده باید غیرخالی باشند تا شواهد معتبر شوند.                          |
| `credentialMarker` | بله      | `string`   | نشانگر غیرمحرمانه‌ای که وقتی شواهد وجود دارد برگردانده می‌شود.                                      |
| `source`           | خیر       | `string`   | برچسب منبع قابل مشاهده برای کاربر در خروجی احراز هویت/وضعیت.                                              |

### فیلدهای setup

| فیلد              | الزامی | نوع       | معنی آن                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | خیر       | `object[]` | توصیفگرهای راه‌اندازی provider که هنگام راه‌اندازی و ورود اولیه نمایش داده می‌شوند.                                     |
| `cliBackends`      | خیر       | `string[]` | شناسه‌های backend زمان راه‌اندازی که برای جست‌وجوی راه‌اندازی مبتنی بر توصیفگر استفاده می‌شوند. شناسه‌های نرمال‌شده را در سطح جهانی یکتا نگه دارید. |
| `configMigrations` | خیر       | `string[]` | شناسه‌های migration پیکربندی متعلق به سطح راه‌اندازی این Plugin.                                          |
| `requiresRuntime`  | خیر       | `boolean`  | اینکه آیا راه‌اندازی پس از جست‌وجوی توصیفگر همچنان به اجرای `setup-api` نیاز دارد یا نه.                            |

## مرجع uiHints

`uiHints` نگاشتی از نام فیلدهای پیکربندی به اشاره‌های کوچک رندر است.

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

هر اشاره فیلد می‌تواند شامل موارد زیر باشد:

| فیلد         | نوع       | معنی آن                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | برچسب فیلد قابل مشاهده برای کاربر.                |
| `help`        | `string`   | متن راهنمای کوتاه.                      |
| `tags`        | `string[]` | برچسب‌های اختیاری UI.                       |
| `advanced`    | `boolean`  | فیلد را به‌عنوان پیشرفته علامت‌گذاری می‌کند.            |
| `sensitive`   | `boolean`  | فیلد را به‌عنوان محرمانه یا حساس علامت‌گذاری می‌کند. |
| `placeholder` | `string`   | متن placeholder برای ورودی‌های فرم.       |

## مرجع contracts

از `contracts` فقط برای metadata ایستای مالکیت قابلیت استفاده کنید که OpenClaw می‌تواند بدون import کردن runtime Plugin بخواند.

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
| `embeddedExtensionFactories`     | `string[]` | شناسه‌های factory افزونه app-server مربوط به Codex، در حال حاضر `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | شناسه‌های runtime که یک Plugin باندل‌شده ممکن است middleware نتیجه ابزار را برای آن‌ها ثبت کند. |
| `externalAuthProviders`          | `string[]` | شناسه‌های provider که hook پروفایل احراز هویت خارجی آن‌ها متعلق به این Plugin است.       |
| `speechProviders`                | `string[]` | شناسه‌های provider گفتار که متعلق به این Plugin هستند.                                 |
| `realtimeTranscriptionProviders` | `string[]` | شناسه‌های provider رونویسی بلادرنگ که متعلق به این Plugin هستند.                 |
| `realtimeVoiceProviders`         | `string[]` | شناسه‌های provider صدای بلادرنگ که متعلق به این Plugin هستند.                         |
| `memoryEmbeddingProviders`       | `string[]` | شناسه‌های provider embedding حافظه که متعلق به این Plugin هستند.                       |
| `mediaUnderstandingProviders`    | `string[]` | شناسه‌های provider فهم رسانه که متعلق به این Plugin هستند.                    |
| `imageGenerationProviders`       | `string[]` | شناسه‌های provider تولید تصویر که متعلق به این Plugin هستند.                       |
| `videoGenerationProviders`       | `string[]` | شناسه‌های provider تولید ویدئو که متعلق به این Plugin هستند.                       |
| `webFetchProviders`              | `string[]` | شناسه‌های provider واکشی وب که متعلق به این Plugin هستند.                              |
| `webSearchProviders`             | `string[]` | شناسه‌های provider جست‌وجوی وب که متعلق به این Plugin هستند.                             |
| `migrationProviders`             | `string[]` | شناسه‌های provider واردسازی که برای `openclaw migrate` متعلق به این Plugin هستند.          |
| `tools`                          | `string[]` | نام ابزارهای عامل که برای بررسی‌های قرارداد باندل‌شده متعلق به این Plugin هستند.        |

`contracts.embeddedExtensionFactories` برای factoryهای افزونه فقط app-server مربوط به Codex که باندل شده‌اند حفظ شده است. تبدیل‌های نتیجه ابزار باندل‌شده باید به‌جای آن `contracts.agentToolResultMiddleware` را اعلام کنند و با `api.registerAgentToolResultMiddleware(...)` ثبت شوند. Pluginهای خارجی نمی‌توانند middleware نتیجه ابزار ثبت کنند، زیرا این seam می‌تواند خروجی ابزار با اعتماد بالا را پیش از دیده‌شدن توسط مدل بازنویسی کند.

Pluginهای provider که `resolveExternalAuthProfiles` را پیاده‌سازی می‌کنند باید `contracts.externalAuthProviders` را اعلام کنند. Pluginهای بدون این اعلام همچنان از مسیر fallback سازگاری منسوخ عبور می‌کنند، اما آن fallback کندتر است و پس از بازه migration حذف خواهد شد.

Providerهای embedding حافظه باندل‌شده باید برای هر شناسه adapter که ارائه می‌کنند، از جمله adapterهای داخلی مانند `local`، `contracts.memoryEmbeddingProviders` را اعلام کنند. مسیرهای CLI مستقل از این قرارداد مانیفست استفاده می‌کنند تا فقط Plugin مالک را پیش از آنکه runtime کامل Gateway providerها را ثبت کرده باشد بارگذاری کنند.

## مرجع mediaUnderstandingProviderMetadata

وقتی یک provider فهم رسانه مدل‌های پیش‌فرض، اولویت fallback احراز هویت خودکار، یا پشتیبانی بومی سند دارد که helperهای عمومی core پیش از بارگذاری runtime به آن نیاز دارند، از `mediaUnderstandingProviderMetadata` استفاده کنید. کلیدها باید در `contracts.mediaUnderstandingProviders` نیز اعلام شده باشند.

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

| فیلد                   | نوع                                | معنای آن                                                                                  |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قابلیت‌های رسانه‌ای که این ارائه‌دهنده عرضه می‌کند.                                       |
| `defaultModels`        | `Record<string, string>`            | پیش‌فرض‌های قابلیت به مدل که وقتی پیکربندی مدلی مشخص نکرده باشد استفاده می‌شوند.          |
| `autoPriority`         | `Record<string, number>`            | عددهای کمتر برای بازگشت خودکار ارائه‌دهنده بر پایه اعتبارنامه، زودتر مرتب می‌شوند.       |
| `nativeDocumentInputs` | `"pdf"[]`                           | ورودی‌های سند بومی که ارائه‌دهنده پشتیبانی می‌کند.                                        |

## مرجع channelConfigs

از `channelConfigs` زمانی استفاده کنید که یک Plugin کانال پیش از بارگذاری
زمان اجرا به فراداده ارزان پیکربندی نیاز دارد. کشف فقط‌خواندنی راه‌اندازی/وضعیت کانال می‌تواند برای
کانال‌های خارجی پیکربندی‌شده، وقتی هیچ ورودی راه‌اندازی در دسترس نیست، یا
وقتی `setup.requiresRuntime: false` اعلام می‌کند زمان اجرای راه‌اندازی لازم نیست، از این فراداده
به‌طور مستقیم استفاده کند.

`channelConfigs` فراداده مانیفست Plugin است، نه یک بخش جدید پیکربندی کاربر در سطح بالا.
کاربران همچنان نمونه‌های کانال را زیر `channels.<channel-id>` پیکربندی می‌کنند.
OpenClaw فراداده مانیفست را می‌خواند تا پیش از اجرای کد زمان اجرای Plugin تصمیم بگیرد کدام Plugin مالک آن کانال پیکربندی‌شده است.

برای یک Plugin کانال، `configSchema` و `channelConfigs` مسیرهای متفاوتی را توصیف می‌کنند:

- `configSchema` مقدار `plugins.entries.<plugin-id>.config` را اعتبارسنجی می‌کند
- `channelConfigs.<channel-id>.schema` مقدار `channels.<channel-id>` را اعتبارسنجی می‌کند

Pluginهای غیرباندل‌شده‌ای که `channels[]` را اعلام می‌کنند باید ورودی‌های مطابق
`channelConfigs` را نیز اعلام کنند. بدون آن‌ها، OpenClaw همچنان می‌تواند Plugin را بارگذاری کند، اما
طرحواره پیکربندی مسیر سرد، راه‌اندازی، و سطوح رابط کاربری کنترل تا زمان اجرای زمان اجرای Plugin نمی‌توانند شکل گزینه‌های متعلق به کانال را بدانند.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و
`nativeSkillsAutoEnabled` می‌توانند پیش‌فرض‌های ایستای `auto` را برای بررسی‌های پیکربندی فرمان
که پیش از بارگذاری زمان اجرای کانال اجرا می‌شوند اعلام کنند. کانال‌های باندل‌شده همچنین می‌توانند
همین پیش‌فرض‌ها را از طریق `package.json#openclaw.channel.commands` در کنار
سایر فراداده کاتالوگ کانالِ متعلق به بسته خود منتشر کنند.

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

| فیلد          | نوع                      | معنای آن                                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema برای `channels.<id>`. برای هر ورودی پیکربندی کانال اعلام‌شده الزامی است.                      |
| `uiHints`     | `Record<string, object>` | برچسب‌ها/جای‌نگهدارها/اشاره‌های حساس اختیاری رابط کاربری برای آن بخش پیکربندی کانال.                     |
| `label`       | `string`                 | برچسب کانال که وقتی فراداده زمان اجرا آماده نیست در سطوح انتخابگر و بازرسی ادغام می‌شود.                 |
| `description` | `string`                 | توضیح کوتاه کانال برای سطوح بازرسی و کاتالوگ.                                                            |
| `commands`    | `object`                 | پیش‌فرض‌های خودکار ایستای فرمان بومی و skill بومی برای بررسی‌های پیکربندی پیش از زمان اجرا.              |
| `preferOver`  | `string[]`               | شناسه‌های Plugin قدیمی یا کم‌اولویت‌تر که این کانال باید در سطوح انتخاب نسبت به آن‌ها اولویت داشته باشد. |

### جایگزین کردن یک Plugin کانال دیگر

از `preferOver` زمانی استفاده کنید که Plugin شما مالک ترجیحی برای یک شناسه کانال است که
Plugin دیگری نیز می‌تواند آن را ارائه کند. موارد رایج شامل شناسه Plugin تغییرنام‌یافته، یک
Plugin مستقل که جایگزین یک Plugin باندل‌شده می‌شود، یا یک فورک نگهداری‌شده است که
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
باندل‌شده است یا به‌طور پیش‌فرض فعال است، OpenClaw آن را در پیکربندی مؤثر
زمان اجرا غیرفعال می‌کند تا یک Plugin مالک کانال و ابزارهای آن باشد. انتخاب صریح کاربر همچنان غالب است: اگر کاربر هر دو Plugin را به‌طور صریح فعال کند، OpenClaw
آن انتخاب را حفظ می‌کند و به‌جای تغییر بی‌صدای مجموعه Pluginهای درخواستی، عیب‌یابی‌های کانال/ابزار تکراری را گزارش می‌دهد.

`preferOver` را به شناسه‌های Plugin محدود نگه دارید که واقعاً می‌توانند همان کانال را ارائه کنند.
این یک فیلد اولویت عمومی نیست و کلیدهای پیکربندی کاربر را تغییر نام نمی‌دهد.

## مرجع modelSupport

از `modelSupport` زمانی استفاده کنید که OpenClaw باید پیش از بارگذاری زمان اجرای Plugin،
Plugin ارائه‌دهنده شما را از شناسه‌های کوتاه مدل مانند `gpt-5.5` یا `claude-sonnet-4.6` استنباط کند.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw این ترتیب تقدم را اعمال می‌کند:

- ارجاع‌های صریح `provider/model` از فراداده مانیفست `providers` متعلق به مالک استفاده می‌کنند
- `modelPatterns` بر `modelPrefixes` مقدم است
- اگر یک Plugin غیرباندل‌شده و یک Plugin باندل‌شده هر دو مطابق باشند، Plugin غیرباندل‌شده
  غالب است
- ابهام باقی‌مانده تا زمانی که کاربر یا پیکربندی یک ارائه‌دهنده را مشخص کند نادیده گرفته می‌شود

فیلدها:

| فیلد            | نوع        | معنای آن                                                                                 |
| --------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | پیشوندهایی که با `startsWith` در برابر شناسه‌های کوتاه مدل مطابقت داده می‌شوند.          |
| `modelPatterns` | `string[]` | منابع Regex که پس از حذف پسوند پروفایل در برابر شناسه‌های کوتاه مدل مطابقت داده می‌شوند. |

## مرجع modelCatalog

از `modelCatalog` زمانی استفاده کنید که OpenClaw باید پیش از بارگذاری زمان اجرای Plugin
فراداده مدل ارائه‌دهنده را بداند. این منبع متعلق به مانیفست برای ردیف‌های ثابت کاتالوگ،
نام‌های مستعار ارائه‌دهنده، قواعد سرکوب، و حالت کشف است. نوسازی زمان اجرا
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

| فیلد           | نوع                                                      | معنای آن                                                                                                         |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | ردیف‌های کاتالوگ برای شناسه‌های ارائه‌دهنده متعلق به این Plugin. کلیدها باید در `providers` سطح بالا نیز ظاهر شوند. |
| `aliases`      | `Record<string, object>`                                 | نام‌های مستعار ارائه‌دهنده که باید برای برنامه‌ریزی کاتالوگ یا سرکوب به یک ارائه‌دهنده متعلق حل شوند.             |
| `suppressions` | `object[]`                                               | ردیف‌های مدل از منبعی دیگر که این Plugin به دلیلی ویژه ارائه‌دهنده سرکوب می‌کند.                                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | اینکه کاتالوگ ارائه‌دهنده می‌تواند از فراداده مانیفست خوانده شود، در کش نوسازی شود، یا به زمان اجرا نیاز دارد.    |

`aliases` در جست‌وجوی مالکیت ارائه‌دهنده برای برنامه‌ریزی کاتالوگ مدل مشارکت می‌کند.
هدف‌های نام مستعار باید ارائه‌دهندگان سطح بالایی باشند که به همان Plugin تعلق دارند. وقتی یک
فهرست فیلترشده بر اساس ارائه‌دهنده از نام مستعار استفاده می‌کند، OpenClaw می‌تواند مانیفست مالک را بخواند و
بازنویسی‌های API/نشانی پایه نام مستعار را بدون بارگذاری زمان اجرای ارائه‌دهنده اعمال کند.
نام‌های مستعار فهرست‌های کاتالوگ بدون فیلتر را گسترش نمی‌دهند؛ فهرست‌های گسترده فقط ردیف‌های ارائه‌دهنده
متعارف مالک را منتشر می‌کنند.

`suppressions` جایگزین hook قدیمی `suppressBuiltInModel` در زمان اجرای ارائه‌دهنده می‌شود.
ورودی‌های سرکوب فقط زمانی رعایت می‌شوند که ارائه‌دهنده متعلق به Plugin باشد یا
به‌عنوان کلید `modelCatalog.aliases` اعلام شده باشد که یک ارائه‌دهنده متعلق را هدف می‌گیرد. hookهای سرکوب
زمان اجرا دیگر هنگام حل مدل فراخوانی نمی‌شوند.

فیلدهای ارائه‌دهنده:

| فیلد      | نوع                      | معنای آن                                                                          |
| --------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | نشانی پایه پیش‌فرض اختیاری برای مدل‌های این کاتالوگ ارائه‌دهنده.                 |
| `api`     | `ModelApi`               | آداپتور API پیش‌فرض اختیاری برای مدل‌های این کاتالوگ ارائه‌دهنده.                |
| `headers` | `Record<string, string>` | سرآیندهای ایستای اختیاری که روی این کاتالوگ ارائه‌دهنده اعمال می‌شوند.           |
| `models`  | `object[]`               | ردیف‌های مدل الزامی. ردیف‌های بدون `id` نادیده گرفته می‌شوند.                    |

فیلدهای مدل:

| فیلد           | نوع                                                           | معنا                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | شناسه مدل محلیِ ارائه‌دهنده، بدون پیشوند `provider/`.                    |
| `name`          | `string`                                                       | نام نمایشی اختیاری.                                                      |
| `api`           | `ModelApi`                                                     | بازنویسی اختیاری API برای هر مدل.                                            |
| `baseUrl`       | `string`                                                       | بازنویسی اختیاری URL پایه برای هر مدل.                                       |
| `headers`       | `Record<string, string>`                                       | سرآیندهای ایستای اختیاری برای هر مدل.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | شیوه‌هایی که مدل می‌پذیرد.                                               |
| `reasoning`     | `boolean`                                                      | اینکه آیا مدل رفتار استدلالی ارائه می‌کند یا نه.                               |
| `contextWindow` | `number`                                                       | پنجره زمینه بومی ارائه‌دهنده.                                             |
| `contextTokens` | `number`                                                       | سقف اختیاری زمینه مؤثر در زمان اجرا، وقتی با `contextWindow` متفاوت است. |
| `maxTokens`     | `number`                                                       | بیشینه توکن‌های خروجی، وقتی شناخته‌شده باشد.                                           |
| `cost`          | `object`                                                       | قیمت‌گذاری اختیاری دلار آمریکا به ازای هر میلیون توکن، شامل `tieredPricing` اختیاری. |
| `compat`        | `object`                                                       | پرچم‌های سازگاری اختیاری مطابق با سازگاری پیکربندی مدل OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | وضعیت فهرست‌شدن. فقط وقتی ردیف اصلا نباید نمایش داده شود، آن را سرکوب کنید.          |
| `statusReason`  | `string`                                                       | دلیل اختیاری که همراه وضعیت غیرقابل‌دسترس نشان داده می‌شود.                            |
| `replaces`      | `string[]`                                                     | شناسه‌های قدیمی‌تر مدل محلیِ ارائه‌دهنده که این مدل جایگزینشان می‌شود.                       |
| `replacedBy`    | `string`                                                       | شناسه مدل محلیِ ارائه‌دهنده جایگزین برای ردیف‌های منسوخ‌شده.                    |
| `tags`          | `string[]`                                                     | برچسب‌های پایداری که توسط انتخاب‌گرها و فیلترها استفاده می‌شوند.                                    |

فیلدهای سرکوب:

| فیلد                      | نوع       | معنا                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | شناسه ارائه‌دهنده برای ردیف بالادستی که باید سرکوب شود. باید متعلق به این Plugin باشد یا به‌عنوان نام مستعار مالکیت‌شده اعلام شده باشد. |
| `model`                    | `string`   | شناسه مدل محلیِ ارائه‌دهنده که باید سرکوب شود.                                                                      |
| `reason`                   | `string`   | پیام اختیاری که وقتی ردیف سرکوب‌شده مستقیما درخواست می‌شود، نشان داده می‌شود.                                     |
| `when.baseUrlHosts`        | `string[]` | فهرست اختیاری میزبان‌های URL پایه مؤثر ارائه‌دهنده که پیش از اعمال سرکوب لازم‌اند.               |
| `when.providerConfigApiIn` | `string[]` | فهرست اختیاری مقدارهای دقیق `api` در پیکربندی ارائه‌دهنده که پیش از اعمال سرکوب لازم‌اند.              |

داده‌های فقط زمان اجرا را در `modelCatalog` قرار ندهید. فقط وقتی از `static` استفاده کنید که ردیف‌های manifest
برای سطح‌های فهرست فیلترشده بر اساس ارائه‌دهنده و انتخاب‌گرها آن‌قدر کامل باشند که از
کشف registry/زمان اجرا صرف‌نظر شود. وقتی ردیف‌های manifest به‌عنوان بذرهای قابل‌فهرست‌کردن
یا مکمل‌ها مفیدند اما refresh/cache می‌تواند بعدا ردیف‌های بیشتری اضافه کند، از `refreshable` استفاده کنید؛
ردیف‌های refreshable به‌تنهایی مرجعیت ندارند. وقتی OpenClaw
برای دانستن فهرست باید زمان اجرای ارائه‌دهنده را بارگذاری کند، از `runtime` استفاده کنید.

## مرجع modelIdNormalization

از `modelIdNormalization` برای پاک‌سازی کم‌هزینه شناسه مدلِ متعلق به ارائه‌دهنده استفاده کنید که باید
پیش از بارگذاری زمان اجرای ارائه‌دهنده انجام شود. این کار نام‌های مستعار مانند نام‌های کوتاه مدل،
شناسه‌های قدیمی محلیِ ارائه‌دهنده و قواعد پیشوند proxy را در manifest
Plugin مالک نگه می‌دارد، نه در جدول‌های انتخاب مدل core.

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

| فیلد                                | نوع                    | معنا                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | نام‌های مستعار دقیق شناسه مدل بدون حساسیت به بزرگی و کوچکی حروف. مقدارها همان‌طور که نوشته شده‌اند برگردانده می‌شوند.                  |
| `stripPrefixes`                      | `string[]`              | پیشوندهایی که پیش از جست‌وجوی نام مستعار حذف می‌شوند، مفید برای تکرار قدیمی provider/model.     |
| `prefixWhenBare`                     | `string`                | پیشوندی که وقتی شناسه مدل نرمال‌شده هنوز شامل `/` نیست، اضافه می‌شود.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | قواعد شرطی پیشوند برای شناسه‌های بدون پیشوند پس از جست‌وجوی نام مستعار، کلیدگذاری‌شده با `modelPrefix` و `prefix`. |

## مرجع providerEndpoints

از `providerEndpoints` برای طبقه‌بندی endpoint استفاده کنید که سیاست درخواست عمومی
باید پیش از بارگذاری زمان اجرای ارائه‌دهنده بداند. core همچنان معنای هر
`endpointClass` را در اختیار دارد؛ manifestهای Plugin مالک فراداده میزبان و URL پایه هستند.

فیلدهای endpoint:

| فیلد                          | نوع       | معنا                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | کلاس endpoint شناخته‌شده core، مانند `openrouter`، `moonshot-native`، یا `google-vertex`.        |
| `hosts`                        | `string[]` | نام‌های میزبان دقیق که به کلاس endpoint نگاشت می‌شوند.                                                |
| `hostSuffixes`                 | `string[]` | پسوندهای میزبان که به کلاس endpoint نگاشت می‌شوند. برای تطبیق فقط با پسوند دامنه، با `.` شروع کنید. |
| `baseUrls`                     | `string[]` | URLهای پایه HTTP(S) نرمال‌شده دقیق که به کلاس endpoint نگاشت می‌شوند.                             |
| `googleVertexRegion`           | `string`   | ناحیه ایستای Google Vertex برای میزبان‌های سراسری دقیق.                                            |
| `googleVertexRegionHostSuffix` | `string`   | پسوندی که از میزبان‌های مطابق حذف می‌شود تا پیشوند ناحیه Google Vertex آشکار شود.                 |

## مرجع providerRequest

از `providerRequest` برای فراداده کم‌هزینه سازگاری درخواست استفاده کنید که سیاست
درخواست عمومی بدون بارگذاری زمان اجرای ارائه‌دهنده به آن نیاز دارد. بازنویسی payload
مختص رفتار را در hookهای زمان اجرای ارائه‌دهنده یا helperهای مشترک خانواده ارائه‌دهنده نگه دارید.

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

| فیلد                 | نوع         | معنا                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | برچسب خانواده ارائه‌دهنده که در تصمیم‌های سازگاری درخواست عمومی و تشخیص‌ها استفاده می‌شود. |
| `compatibilityFamily` | `"moonshot"` | سبد سازگاری اختیاری خانواده ارائه‌دهنده برای helperهای مشترک درخواست.              |
| `openAICompletions`   | `object`     | پرچم‌های درخواست completions سازگار با OpenAI، در حال حاضر `supportsStreamingUsage`.       |

## مرجع modelPricing

وقتی یک ارائه‌دهنده پیش از بارگذاری زمان اجرا به رفتار قیمت‌گذاری در control plane نیاز دارد،
از `modelPricing` استفاده کنید. cache قیمت‌گذاری Gateway این فراداده را بدون import کردن
کد زمان اجرای ارائه‌دهنده می‌خواند.

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

| فیلد        | نوع              | معنا                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | برای ارائه‌دهندگان محلی/خودمیزبان که هرگز نباید قیمت‌گذاری OpenRouter یا LiteLLM را دریافت کنند، `false` تنظیم کنید. |
| `openRouter` | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری OpenRouter. مقدار `false` جست‌وجوی OpenRouter را برای این ارائه‌دهنده غیرفعال می‌کند.           |
| `liteLLM`    | `false \| object` | نگاشت جست‌وجوی قیمت‌گذاری LiteLLM. مقدار `false` جست‌وجوی LiteLLM را برای این ارائه‌دهنده غیرفعال می‌کند.                 |

فیلدهای منبع:

| فیلد                      | نوع               | معنا                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | شناسه ارائه‌دهنده کاتالوگ بیرونی وقتی با شناسه ارائه‌دهنده OpenClaw متفاوت است، برای مثال `z-ai` برای ارائه‌دهنده `zai`. |
| `passthroughProviderModel` | `boolean`          | شناسه‌های مدل دارای اسلش را به‌عنوان ارجاع‌های تودرتوی provider/model در نظر بگیرید، مفید برای ارائه‌دهندگان proxy مانند OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | گونه‌های اضافی شناسه مدل در کاتالوگ بیرونی. `version-dots` شناسه‌های نسخه نقطه‌دار مانند `claude-opus-4.6` را امتحان می‌کند.            |

### شاخص ارائه‌دهنده OpenClaw

شاخص ارائه‌دهنده OpenClaw فراداده پیش‌نمایش متعلق به OpenClaw برای ارائه‌دهندگانی است
که ممکن است Pluginهایشان هنوز نصب نشده باشند. این بخشی از manifest یک Plugin نیست.
manifestهای Plugin همچنان مرجعیت Plugin نصب‌شده هستند. شاخص ارائه‌دهنده
قرارداد fallback داخلی است که سطح‌های آینده انتخاب‌گر مدل برای ارائه‌دهندگان قابل‌نصب و پیش از نصب
وقتی یک Plugin ارائه‌دهنده نصب نیست، مصرف خواهند کرد.

ترتیب مرجعیت کاتالوگ:

1. پیکربندی کاربر.
2. `modelCatalog` در manifest Plugin نصب‌شده.
3. cache کاتالوگ مدل از refresh صریح.
4. ردیف‌های پیش‌نمایش شاخص ارائه‌دهنده OpenClaw.

نمایهٔ ارائه‌دهنده نباید شامل رازها، وضعیت فعال‌بودن، hookهای زمان اجرا، یا
داده‌های زندهٔ مدلِ خاصِ حساب باشد. کاتالوگ‌های پیش‌نمایش آن از همان شکل ردیف ارائه‌دهندهٔ
`modelCatalog` مانند manifestهای Plugin استفاده می‌کنند، اما باید به فرادادهٔ نمایشی پایدار
محدود بمانند، مگر اینکه فیلدهای adapter زمان اجرا مانند `api`،
`baseUrl`، قیمت‌گذاری، یا پرچم‌های سازگاری عمداً با
manifest Plugin نصب‌شده هم‌راستا نگه داشته شوند. ارائه‌دهنده‌هایی که کشف زندهٔ `/models` دارند باید
ردیف‌های تازه‌سازی‌شده را از مسیر صریح cache کاتالوگ مدل بنویسند، به‌جای اینکه
فهرست‌گیری معمولی یا onboarding باعث فراخوانی APIهای ارائه‌دهنده شود.

ورودی‌های نمایهٔ ارائه‌دهنده همچنین ممکن است برای ارائه‌دهنده‌هایی که Plugin آن‌ها از core
خارج شده یا هنوز نصب نشده است، فرادادهٔ Plugin قابل‌نصب داشته باشند. این
فراداده از الگوی کاتالوگ channel پیروی می‌کند: نام package، مشخصهٔ نصب npm،
درستی موردانتظار، و برچسب‌های سبک انتخاب auth برای نمایش یک گزینهٔ setup
قابل‌نصب کافی هستند. پس از نصب Plugin، manifest آن برنده است و
ورودی نمایهٔ ارائه‌دهنده برای آن ارائه‌دهنده نادیده گرفته می‌شود.

کلیدهای legacy سطح بالا برای capability منسوخ شده‌اند. از `openclaw doctor --fix` برای
انتقال `speechProviders`، `realtimeTranscriptionProviders`،
`realtimeVoiceProviders`، `mediaUnderstandingProviders`،
`imageGenerationProviders`، `videoGenerationProviders`،
`webFetchProviders`، و `webSearchProviders` به زیر `contracts` استفاده کنید؛ بارگذاری عادی
manifest دیگر این فیلدهای سطح بالا را به‌عنوان مالکیت capability
در نظر نمی‌گیرد.

## Manifest در برابر package.json

این دو فایل کارهای متفاوتی انجام می‌دهند:

| فایل                   | کاربرد                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | کشف، اعتبارسنجی config، فرادادهٔ انتخاب auth، و اشاره‌های UI که باید پیش از اجرای کد Plugin وجود داشته باشند                         |
| `package.json`         | فرادادهٔ npm، نصب dependency، و بلوک `openclaw` که برای entrypointها، install gating، setup، یا فرادادهٔ کاتالوگ استفاده می‌شود |

اگر مطمئن نیستید یک قطعه فراداده کجا باید قرار بگیرد، از این قاعده استفاده کنید:

- اگر OpenClaw باید آن را پیش از بارگذاری کد Plugin بداند، آن را در `openclaw.plugin.json` بگذارید
- اگر دربارهٔ packaging، فایل‌های entry، یا رفتار نصب npm است، آن را در `package.json` بگذارید

### فیلدهای package.json که بر کشف اثر می‌گذارند

بخشی از فرادادهٔ پیش از زمان اجرای Plugin عمداً به‌جای `openclaw.plugin.json` در
بلوک `openclaw` داخل `package.json` قرار می‌گیرد.

نمونه‌های مهم:

| فیلد                                                             | معنای آن                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | entrypointهای native Plugin را اعلام می‌کند. باید داخل دایرکتوری package Plugin باقی بماند.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | entrypointهای JavaScript ساخته‌شدهٔ زمان اجرا را برای packageهای نصب‌شده اعلام می‌کند. باید داخل دایرکتوری package Plugin باقی بماند.                                                                 |
| `openclaw.setupEntry`                                             | entrypoint سبک فقط برای setup که در onboarding، startup به‌تعویق‌افتادهٔ channel، و کشف وضعیت channel/SecretRef فقط‌خواندنی استفاده می‌شود. باید داخل دایرکتوری package Plugin باقی بماند. |
| `openclaw.runtimeSetupEntry`                                      | entrypoint ساخته‌شدهٔ JavaScript برای setup را برای packageهای نصب‌شده اعلام می‌کند. باید داخل دایرکتوری package Plugin باقی بماند.                                                                |
| `openclaw.channel`                                                | فرادادهٔ سبک کاتالوگ channel مانند برچسب‌ها، مسیرهای docs، aliasها، و متن انتخاب.                                                                                                 |
| `openclaw.channel.commands`                                       | فرادادهٔ ایستای command native و پیش‌فرض خودکار skill native که پیش از بارگذاری زمان اجرای channel توسط config، audit، و سطوح فهرست command استفاده می‌شود.                                          |
| `openclaw.channel.configuredState`                                | فرادادهٔ سبک بررسی‌کنندهٔ configured-state که می‌تواند بدون بارگذاری کامل زمان اجرای channel پاسخ دهد «آیا setup فقط-env از قبل وجود دارد؟».                                         |
| `openclaw.channel.persistedAuthState`                             | فرادادهٔ سبک بررسی‌کنندهٔ persisted-auth که می‌تواند بدون بارگذاری کامل زمان اجرای channel پاسخ دهد «آیا چیزی از قبل وارد حساب شده است؟».                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | راهنماهای install/update برای Pluginهای bundled و Pluginهای منتشرشدهٔ خارجی.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | مسیر نصب ترجیحی وقتی چند منبع نصب در دسترس است.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | حداقل نسخهٔ پشتیبانی‌شدهٔ میزبان OpenClaw، با استفاده از کف semver مانند `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | رشتهٔ درستی موردانتظار npm dist مانند `sha512-...`؛ جریان‌های نصب و update artifact دریافت‌شده را در برابر آن بررسی می‌کنند.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | اجازهٔ یک مسیر محدود بازیابی نصب مجدد Plugin bundled را وقتی config نامعتبر است می‌دهد.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | اجازه می‌دهد سطوح channel فقط برای setup پیش از Plugin کامل channel در زمان startup بارگذاری شوند.                                                                                                 |

فرادادهٔ manifest تعیین می‌کند کدام انتخاب‌های ارائه‌دهنده/channel/setup پیش از بارگذاری زمان اجرا در
onboarding ظاهر شوند. `package.json#openclaw.install` به
onboarding می‌گوید وقتی کاربر یکی از آن انتخاب‌ها را برمی‌گزیند، آن Plugin را چگونه دریافت یا فعال کند. راهنماهای نصب را به `openclaw.plugin.json` منتقل نکنید.

`openclaw.install.minHostVersion` هنگام نصب و بارگذاری registry
manifest اعمال می‌شود. مقدارهای نامعتبر رد می‌شوند؛ مقدارهای جدیدتر اما معتبر باعث می‌شوند
Plugin روی میزبان‌های قدیمی‌تر نادیده گرفته شود.

pin کردن دقیق نسخهٔ npm از قبل در `npmSpec` قرار دارد، برای مثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. ورودی‌های رسمی کاتالوگ خارجی
باید مشخصه‌های دقیق را با `expectedIntegrity` همراه کنند تا جریان‌های update در صورت
عدم تطابق artifact دریافت‌شدهٔ npm با release پین‌شده، fail closed شوند.
onboarding تعاملی همچنان برای سازگاری مشخصه‌های npm registry مورداعتماد، از جمله نام‌های خالی
package و dist-tagها را پیشنهاد می‌دهد. diagnostics کاتالوگ می‌تواند
منابع exact، floating، integrity-pinned، missing-integrity، package-name
mismatch، و invalid default-choice را از هم تفکیک کند. همچنین وقتی
`expectedIntegrity` وجود دارد اما هیچ منبع npm معتبری برای pin کردن آن وجود ندارد، هشدار می‌دهد.
وقتی `expectedIntegrity` وجود دارد،
جریان‌های install/update آن را اعمال می‌کنند؛ وقتی حذف شده باشد، resolution registry بدون pin درستی
ثبت می‌شود.

Pluginهای channel باید وقتی status، فهرست channel،
یا اسکن‌های SecretRef باید حساب‌های configured را بدون بارگذاری کامل
زمان اجرا شناسایی کنند، `openclaw.setupEntry` ارائه دهند. entry مربوط به setup باید فرادادهٔ channel به‌همراه config،
status، و adapterهای secrets ایمن برای setup را expose کند؛ کلاینت‌های شبکه، listenerهای Gateway، و
runtimeهای transport را در entrypoint اصلی extension نگه دارید.

فیلدهای entrypoint زمان اجرا، بررسی‌های مرز package برای فیلدهای
entrypoint منبع را override نمی‌کنند. برای مثال، `openclaw.runtimeExtensions` نمی‌تواند یک مسیر
خارج‌شوندهٔ `openclaw.extensions` را قابل‌بارگذاری کند.

`openclaw.install.allowInvalidConfigRecovery` عمداً محدود است. این گزینه
configهای خراب دلخواه را قابل‌نصب نمی‌کند. امروز فقط به جریان‌های نصب اجازه می‌دهد
از شکست‌های خاص upgrade مربوط به Plugin bundled قدیمی بازیابی شوند، مانند
مسیر گم‌شدهٔ Plugin bundled یا ورودی stale `channels.<id>` برای همان
Plugin bundled. خطاهای config نامرتبط همچنان نصب را مسدود می‌کنند و operatorها را
به `openclaw doctor --fix` می‌فرستند.

`openclaw.channel.persistedAuthState` فرادادهٔ package برای یک module بررسی‌کنندهٔ کوچک است:

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

وقتی setup، doctor، status، یا جریان‌های حضور فقط‌خواندنی پیش از بارگذاری کامل
Plugin channel به یک probe سبک بله/خیر برای auth نیاز دارند، از آن استفاده کنید. وضعیت auth ذخیره‌شده
وضعیت channel configured نیست: از این فراداده برای فعال‌سازی خودکار Pluginها،
repair کردن dependencyهای زمان اجرا، یا تصمیم‌گیری دربارهٔ اینکه آیا runtime یک channel باید بارگذاری شود استفاده نکنید.
export هدف باید یک تابع کوچک باشد که فقط وضعیت ذخیره‌شده را می‌خواند؛ آن را
از طریق barrel کامل زمان اجرای channel عبور ندهید.

`openclaw.channel.configuredState` برای بررسی‌های سبک configured فقط-env
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

وقتی یک channel می‌تواند configured-state را از env یا ورودی‌های کوچک
غیر-runtime دیگر پاسخ دهد، از آن استفاده کنید. اگر بررسی به resolution کامل config یا runtime واقعی
channel نیاز دارد، آن منطق را در hook
`config.hasConfiguredState` خود Plugin نگه دارید.

## تقدم کشف (idهای تکراری Plugin)

OpenClaw Pluginها را از چند root کشف می‌کند (bundled، نصب global، workspace، مسیرهای explicit انتخاب‌شده در config). اگر دو کشف `id` یکسانی داشته باشند، فقط manifest با **بالاترین تقدم** نگه داشته می‌شود؛ موارد تکراری با تقدم پایین‌تر به‌جای بارگذاری کنار آن حذف می‌شوند.

تقدم، از بیشترین به کمترین:

1. **انتخاب‌شده در config** — مسیری که صراحتاً در `plugins.entries.<id>` pin شده است
2. **Bundled** — Pluginهایی که همراه OpenClaw ارائه می‌شوند
3. **نصب global** — Pluginهایی که در root سراسری Pluginهای OpenClaw نصب شده‌اند
4. **Workspace** — Pluginهایی که نسبت به workspace فعلی کشف می‌شوند

پیامدها:

- یک نسخهٔ fork شده یا stale از یک Plugin bundled که در workspace قرار دارد، build bundled را shadow نخواهد کرد.
- برای override واقعی یک Plugin bundled با یک نسخهٔ محلی، آن را از طریق `plugins.entries.<id>` pin کنید تا با تقدم برنده شود، نه با اتکا به کشف workspace.
- حذف موارد تکراری log می‌شود تا Doctor و diagnostics زمان startup بتوانند به نسخهٔ کنارگذاشته‌شده اشاره کنند.

## الزامات JSON Schema

- **هر Plugin باید یک JSON Schema ارائه کند**، حتی اگر هیچ config نپذیرد.
- schema خالی قابل‌قبول است (برای مثال، `{ "type": "object", "additionalProperties": false }`).
- schemaها هنگام خواندن/نوشتن config اعتبارسنجی می‌شوند، نه در زمان اجرا.

## رفتار اعتبارسنجی

- کلیدهای ناشناختهٔ `channels.*` **خطا** هستند، مگر اینکه شناسهٔ channel توسط
  مانیفست Plugin اعلام شده باشد.
- `plugins.entries.<id>`، `plugins.allow`، `plugins.deny` و `plugins.slots.*`
  باید به شناسه‌های Plugin **قابل کشف** ارجاع دهند. شناسه‌های ناشناخته **خطا** هستند.
- اگر یک Plugin نصب شده باشد اما مانیفست یا schema آن خراب یا مفقود باشد،
  اعتبارسنجی شکست می‌خورد و Doctor خطای Plugin را گزارش می‌کند.
- اگر پیکربندی Plugin وجود داشته باشد اما Plugin **غیرفعال** باشد، پیکربندی نگه داشته می‌شود و
  یک **هشدار** در Doctor + لاگ‌ها نمایش داده می‌شود.

برای schema کامل `plugins.*`، [مرجع پیکربندی](/fa/gateway/configuration) را ببینید.

## یادداشت‌ها

- مانیفست برای **Pluginهای native OpenClaw**، از جمله بارگذاری‌های فایل‌سیستم محلی، **الزامی** است. Runtime همچنان ماژول Plugin را جداگانه بارگذاری می‌کند؛ مانیفست فقط برای کشف + اعتبارسنجی است.
- مانیفست‌های native با JSON5 تجزیه می‌شوند، بنابراین کامنت‌ها، ویرگول‌های انتهایی، و کلیدهای بدون نقل‌قول پذیرفته می‌شوند، به شرطی که مقدار نهایی همچنان یک شیء باشد.
- فقط فیلدهای مستندشدهٔ مانیفست توسط بارگذار مانیفست خوانده می‌شوند. از کلیدهای سفارشی سطح بالا پرهیز کنید.
- وقتی یک Plugin به آن‌ها نیاز ندارد، `channels`، `providers`، `cliBackends` و `skills` همگی می‌توانند حذف شوند.
- `providerDiscoveryEntry` باید سبک بماند و نباید کد runtime گسترده را import کند؛ از آن برای فرادادهٔ کاتالوگ provider ایستا یا توصیف‌گرهای کشف محدود استفاده کنید، نه اجرای زمان درخواست.
- گونه‌های انحصاری Plugin از طریق `plugins.slots.*` انتخاب می‌شوند: `kind: "memory"` از طریق `plugins.slots.memory`، و `kind: "context-engine"` از طریق `plugins.slots.contextEngine` (پیش‌فرض `legacy`).
- گونهٔ انحصاری Plugin را در این مانیفست اعلام کنید. `OpenClawPluginDefinition.kind` در ورودی runtime منسوخ شده و فقط به‌عنوان fallback سازگاری برای Pluginهای قدیمی‌تر باقی مانده است.
- فرادادهٔ متغیرهای محیطی (`setup.providers[].envVars`، `providerAuthEnvVars` منسوخ‌شده، و `channelEnvVars`) فقط اعلامی است. وضعیت، audit، اعتبارسنجی تحویل cron، و سایر سطوح فقط‌خواندنی همچنان پیش از اینکه یک متغیر محیطی را پیکربندی‌شده تلقی کنند، اعتماد Plugin و سیاست فعال‌سازی مؤثر را اعمال می‌کنند.
- برای فرادادهٔ wizard runtime که به کد provider نیاز دارد، [هوک‌های runtime provider](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
- اگر Plugin شما به ماژول‌های native وابسته است، مراحل build و هرگونه نیازمندی allowlist مدیر بسته را مستند کنید (برای مثال، pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
