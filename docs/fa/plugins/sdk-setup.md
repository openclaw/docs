---
read_when:
    - شما در حال افزودن یک راهنمای راه‌اندازی به یک Plugin هستید
    - باید تفاوت میان setup-entry.ts و index.ts را درک کنید
    - شما در حال تعریف طرح‌واره‌های پیکربندی Plugin یا فرادادهٔ openclaw در package.json هستید
sidebarTitle: Setup and config
summary: جادوگرهای راه‌اندازی، setup-entry.ts، طرحواره‌های پیکربندی و فرادادهٔ package.json
title: راه‌اندازی و پیکربندی Plugin
x-i18n:
    generated_at: "2026-05-02T11:58:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع بسته‌بندی Plugin (فرادادهٔ `package.json`)، manifestها (`openclaw.plugin.json`)، ورودی‌های راه‌اندازی، و schemaهای config.

<Tip>
**دنبال یک راهنمای گام‌به‌گام هستید؟** راهنماهای عملی، بسته‌بندی را در متن کاربردی پوشش می‌دهند: [Pluginهای کانال](/fa/plugins/sdk-channel-plugins#step-1-package-and-manifest) و [Pluginهای Provider](/fa/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## فرادادهٔ Package

`package.json` شما به یک فیلد `openclaw` نیاز دارد که به سیستم Plugin بگوید Plugin شما چه چیزی ارائه می‌کند:

<Tabs>
  <Tab title="Plugin کانال">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin Provider / خط مبنای ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
اگر Plugin را به‌صورت خارجی روی ClawHub منتشر می‌کنید، آن فیلدهای `compat` و `build` الزامی هستند. قطعه‌کدهای رسمی انتشار در `docs/snippets/plugin-publish/` قرار دارند.
</Note>

### فیلدهای `openclaw`

<ParamField path="extensions" type="string[]">
  فایل‌های نقطهٔ ورود (نسبت به ریشهٔ package).
</ParamField>
<ParamField path="setupEntry" type="string">
  ورودی سبک فقط برای راه‌اندازی (اختیاری).
</ParamField>
<ParamField path="channel" type="object">
  فرادادهٔ کاتالوگ کانال برای سطوح راه‌اندازی، انتخابگر، شروع سریع، و وضعیت.
</ParamField>
<ParamField path="providers" type="string[]">
  شناسه‌های Provider ثبت‌شده توسط این Plugin.
</ParamField>
<ParamField path="install" type="object">
  راهنمایی‌های نصب: `npmSpec`، `localPath`، `defaultChoice`، `minHostVersion`، `expectedIntegrity`، `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  پرچم‌های رفتار startup.
</ParamField>

### `openclaw.channel`

`openclaw.channel` فرادادهٔ سبک package برای کشف کانال و سطوح راه‌اندازی پیش از بارگذاری runtime است.

| فیلد                                  | نوع       | معنی آن                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | شناسهٔ رسمی کانال.                                                         |
| `label`                                | `string`   | برچسب اصلی کانال.                                                        |
| `selectionLabel`                       | `string`   | برچسب انتخابگر/راه‌اندازی زمانی که باید با `label` متفاوت باشد.                        |
| `detailLabel`                          | `string`   | برچسب جزئیات ثانویه برای کاتالوگ‌های کانال غنی‌تر و سطوح وضعیت.       |
| `docsPath`                             | `string`   | مسیر docs برای پیوندهای راه‌اندازی و انتخاب.                                      |
| `docsLabel`                            | `string`   | برچسب جایگزین برای پیوندهای docs وقتی باید با شناسهٔ کانال متفاوت باشد. |
| `blurb`                                | `string`   | توضیح کوتاه onboarding/کاتالوگ.                                         |
| `order`                                | `number`   | ترتیب مرتب‌سازی در کاتالوگ‌های کانال.                                               |
| `aliases`                              | `string[]` | نام‌های مستعار اضافی برای جست‌وجوی انتخاب کانال.                                   |
| `preferOver`                           | `string[]` | شناسه‌های Plugin/کانال با اولویت پایین‌تر که این کانال باید بر آن‌ها برتری داشته باشد.                |
| `systemImage`                          | `string`   | نام اختیاری icon/system-image برای کاتالوگ‌های UI کانال.                      |
| `selectionDocsPrefix`                  | `string`   | متن پیشوند پیش از پیوندهای docs در سطوح انتخاب.                          |
| `selectionDocsOmitLabel`               | `boolean`  | در متن انتخاب، مسیر docs را مستقیماً به‌جای پیوند docs برچسب‌دار نمایش دهد. |
| `selectionExtras`                      | `string[]` | رشته‌های کوتاه اضافی که به متن انتخاب افزوده می‌شوند.                               |
| `markdownCapable`                      | `boolean`  | کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان markdown-capable علامت‌گذاری می‌کند.      |
| `exposure`                             | `object`   | کنترل‌های نمایانی کانال برای راه‌اندازی، فهرست‌های پیکربندی‌شده، و سطوح docs.   |
| `quickstartAllowFrom`                  | `boolean`  | این کانال را وارد جریان راه‌اندازی استاندارد شروع سریع `allowFrom` می‌کند.         |
| `forceAccountBinding`                  | `boolean`  | حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | هنگام resolve کردن هدف‌های announce برای این کانال، جست‌وجوی session را ترجیح می‌دهد.       |

مثال:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` پشتیبانی می‌کند از:

- `configured`: کانال را در سطوح فهرست‌سازی پیکربندی‌شده/سبک وضعیت وارد می‌کند
- `setup`: کانال را در انتخابگرهای راه‌اندازی/پیکربندی تعاملی وارد می‌کند
- `docs`: کانال را در سطوح docs/ناوبری به‌عنوان public-facing علامت‌گذاری می‌کند

<Note>
`showConfigured` و `showInSetup` همچنان به‌عنوان aliasهای legacy پشتیبانی می‌شوند. `exposure` را ترجیح دهید.
</Note>

### `openclaw.install`

`openclaw.install` فرادادهٔ package است، نه فرادادهٔ manifest.

| فیلد                        | نوع                 | معنی آن                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | spec رسمی npm برای جریان‌های نصب/به‌روزرسانی.                                      |
| `localPath`                  | `string`             | مسیر توسعهٔ محلی یا نصب bundled.                                        |
| `defaultChoice`              | `"npm"` \| `"local"` | منبع نصب ترجیحی وقتی هر دو در دسترس هستند.                                 |
| `minHostVersion`             | `string`             | حداقل نسخهٔ پشتیبانی‌شدهٔ OpenClaw به شکل `>=x.y.z` یا `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | رشتهٔ integrity مورد انتظار npm dist، معمولاً `sha512-...`، برای نصب‌های pinشده.    |
| `allowInvalidConfigRecovery` | `boolean`            | به جریان‌های نصب مجدد bundled-plugin اجازه می‌دهد از شکست‌های خاص stale-config بازیابی شوند.  |

<AccordionGroup>
  <Accordion title="رفتار Onboarding">
    Onboarding تعاملی نیز از `openclaw.install` برای سطوح install-on-demand استفاده می‌کند. اگر Plugin شما گزینه‌های احراز هویت Provider یا فرادادهٔ راه‌اندازی/کاتالوگ کانال را پیش از بارگذاری runtime آشکار کند، onboarding می‌تواند آن گزینه را نمایش دهد، برای نصب npm در برابر local سؤال کند، Plugin را نصب یا فعال کند، سپس جریان انتخاب‌شده را ادامه دهد. گزینه‌های onboarding برای npm به فرادادهٔ کاتالوگ قابل‌اعتماد با `npmSpec` رجیستری نیاز دارند؛ نسخه‌های دقیق و `expectedIntegrity` pinهای اختیاری هستند. اگر `expectedIntegrity` وجود داشته باشد، جریان‌های نصب/به‌روزرسانی آن را enforce می‌کنند. فرادادهٔ «چه چیزی نمایش داده شود» را در `openclaw.plugin.json` و فرادادهٔ «چگونه نصب شود» را در `package.json` نگه دارید.
  </Accordion>
  <Accordion title="اعمال minHostVersion">
    اگر `minHostVersion` تنظیم شده باشد، هم نصب و هم بارگذاری manifest-registry غیرباندل‌شده آن را enforce می‌کنند. hostهای قدیمی‌تر Pluginهای خارجی را رد می‌کنند؛ رشته‌های نسخهٔ نامعتبر رد می‌شوند. فرض می‌شود Pluginهای source باندل‌شده با checkout میزبان هم‌نسخه هستند.
  </Accordion>
  <Accordion title="نصب‌های npm pinشده">
    برای نصب‌های npm pinشده، نسخهٔ دقیق را در `npmSpec` نگه دارید و integrity مورد انتظار artifact را اضافه کنید:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="دامنهٔ allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` یک bypass عمومی برای configهای خراب نیست. فقط برای بازیابی محدود bundled-plugin است، تا نصب مجدد/راه‌اندازی بتواند leftoverهای شناخته‌شدهٔ ارتقا را تعمیر کند، مثل مسیر Plugin باندل‌شدهٔ گم‌شده یا ورودی stale `channels.<id>` برای همان Plugin. اگر config به دلایل نامرتبط خراب باشد، نصب همچنان بسته شکست می‌خورد و به operator می‌گوید `openclaw doctor --fix` را اجرا کند.
  </Accordion>
</AccordionGroup>

### بارگذاری کامل تعویقی

Pluginهای کانال می‌توانند با این مورد بارگذاری تعویقی را انتخاب کنند:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

وقتی فعال باشد، OpenClaw در مرحلهٔ startup پیش از listen فقط `setupEntry` را بارگذاری می‌کند، حتی برای کانال‌هایی که از قبل پیکربندی شده‌اند. ورودی کامل بعد از شروع listen کردن gateway بارگذاری می‌شود.

<Warning>
بارگذاری تعویقی را فقط زمانی فعال کنید که `setupEntry` شما همهٔ چیزهایی را که gateway پیش از شروع listen نیاز دارد ثبت کند (ثبت کانال، routeهای HTTP، متدهای gateway). اگر ورودی کامل مالک قابلیت‌های startup الزامی است، رفتار پیش‌فرض را نگه دارید.
</Warning>

اگر ورودی setup/full شما متدهای RPC gateway را ثبت می‌کند، آن‌ها را روی یک پیشوند مخصوص Plugin نگه دارید. namespaceهای ادمین هستهٔ رزرو‌شده (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) متعلق به core باقی می‌مانند و همیشه به `operator.admin` resolve می‌شوند.

## Manifest Plugin

هر Plugin بومی باید یک `openclaw.plugin.json` در ریشهٔ package همراه داشته باشد. OpenClaw از این برای اعتبارسنجی config بدون اجرای کد Plugin استفاده می‌کند.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

برای Pluginهای کانال، `kind` و `channels` را اضافه کنید:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

حتی Pluginهایی که config ندارند باید schema همراه داشته باشند. یک schema خالی معتبر است:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

برای مرجع کامل schema، [Manifest Plugin](/fa/plugins/manifest) را ببینید.

## انتشار ClawHub

برای packageهای Plugin، از فرمان مخصوص package در ClawHub استفاده کنید:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
alias انتشار legacy فقط مخصوص skill است. packageهای Plugin باید همیشه از `clawhub package publish` استفاده کنند.
</Note>

## ورودی راه‌اندازی

فایل `setup-entry.ts` جایگزینی سبک برای `index.ts` است که OpenClaw وقتی فقط به سطوح راه‌اندازی نیاز دارد آن را بارگذاری می‌کند (آماده‌سازی اولیه، تعمیر پیکربندی، بررسی کانال غیرفعال).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

این کار از بارگذاری کدهای سنگین زمان اجرا (کتابخانه‌های رمزنگاری، ثبت‌های CLI، سرویس‌های پس‌زمینه) در جریان‌های راه‌اندازی جلوگیری می‌کند.

کانال‌های فضای کاری بسته‌بندی‌شده که خروجی‌های امن برای راه‌اندازی را در ماژول‌های جانبی نگه می‌دارند، می‌توانند به‌جای `defineSetupPluginEntry(...)` از `defineBundledChannelSetupEntry(...)` در `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن قرارداد بسته‌بندی‌شده همچنین از خروجی اختیاری `runtime` پشتیبانی می‌کند تا سیم‌کشی زمان اجرای هنگام راه‌اندازی سبک و صریح بماند.

<AccordionGroup>
  <Accordion title="زمانی که OpenClaw به‌جای ورودی کامل از setupEntry استفاده می‌کند">
    - کانال غیرفعال است اما به سطوح راه‌اندازی/آماده‌سازی اولیه نیاز دارد.
    - کانال فعال است اما پیکربندی نشده است.
    - بارگذاری معوق فعال است (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="آنچه setupEntry باید ثبت کند">
    - شیء Plugin کانال (از طریق `defineSetupPluginEntry`).
    - هر مسیر HTTP که پیش از گوش‌دادن Gateway لازم است.
    - هر متد Gateway که هنگام شروع لازم است.

    آن متدهای Gateway هنگام شروع همچنان باید از فضای نام‌های مدیریتی رزروشده هسته مانند `config.*` یا `update.*` پرهیز کنند.

  </Accordion>
  <Accordion title="آنچه setupEntry نباید شامل شود">
    - ثبت‌های CLI.
    - سرویس‌های پس‌زمینه.
    - importهای سنگین زمان اجرا (رمزنگاری، SDKها).
    - متدهای Gateway که فقط پس از شروع لازم هستند.

  </Accordion>
</AccordionGroup>

### importهای محدود کمکی راه‌اندازی

برای مسیرهای داغ فقط-راه‌اندازی، وقتی فقط به بخشی از سطح راه‌اندازی نیاز دارید، seamهای کمکی محدود راه‌اندازی را به چتر گسترده‌تر `plugin-sdk/setup` ترجیح دهید:

| مسیر import                        | کاربرد                                                                                | خروجی‌های کلیدی                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | کمک‌کننده‌های زمان اجرای زمان راه‌اندازی که در `setupEntry` / شروع معوق کانال در دسترس می‌مانند | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | آداپتورهای راه‌اندازی حساب آگاه از محیط                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | کمک‌کننده‌های CLI/آرشیو/اسناد برای راه‌اندازی/نصب                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

وقتی جعبه‌ابزار کامل راه‌اندازی مشترک را می‌خواهید، از جمله کمک‌کننده‌های وصله پیکربندی مانند `moveSingleAccountChannelSectionToDefaultAccount(...)`، از seam گسترده‌تر `plugin-sdk/setup` استفاده کنید.

آداپتورهای وصله راه‌اندازی هنگام import برای مسیر داغ امن می‌مانند. جست‌وجوی سطح قرارداد ارتقای تک‌حساب بسته‌بندی‌شده آن‌ها lazy است، بنابراین import کردن `plugin-sdk/setup-runtime` پیش از اینکه آداپتور واقعاً استفاده شود، کشف سطح قرارداد بسته‌بندی‌شده را مشتاقانه بارگذاری نمی‌کند.

### ارتقای تک‌حساب متعلق به کانال

وقتی یک کانال از پیکربندی سطح‌بالای تک‌حساب به `channels.<id>.accounts.*` ارتقا پیدا می‌کند، رفتار مشترک پیش‌فرض این است که مقادیر account-scoped ارتقایافته را به `accounts.default` منتقل کند.

کانال‌های بسته‌بندی‌شده می‌توانند آن ارتقا را از طریق سطح قرارداد راه‌اندازی خود محدود یا بازنویسی کنند:

- `singleAccountKeysToMove`: کلیدهای سطح‌بالای اضافی که باید به حساب ارتقایافته منتقل شوند
- `namedAccountPromotionKeys`: وقتی حساب‌های نام‌دار از قبل وجود دارند، فقط این کلیدها به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای سیاست/تحویل مشترک در ریشه کانال می‌مانند
- `resolveSingleAccountPromotionTarget(...)`: انتخاب می‌کند کدام حساب موجود مقادیر ارتقایافته را دریافت کند

<Note>
Matrix نمونه بسته‌بندی‌شده فعلی است. اگر دقیقاً یک حساب نام‌دار Matrix از قبل وجود داشته باشد، یا اگر `defaultAccount` به یک کلید غیرمتعارف موجود مانند `Ops` اشاره کند، ارتقا به‌جای ایجاد یک ورودی جدید `accounts.default` همان حساب را حفظ می‌کند.
</Note>

## طرح‌واره پیکربندی

پیکربندی Plugin در برابر JSON Schema موجود در manifest شما اعتبارسنجی می‌شود. کاربران Pluginها را از این طریق پیکربندی می‌کنند:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Plugin شما این پیکربندی را هنگام ثبت به‌صورت `api.pluginConfig` دریافت می‌کند.

برای پیکربندی اختصاصی کانال، به‌جای آن از بخش پیکربندی کانال استفاده کنید:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### ساخت طرح‌واره‌های پیکربندی کانال

از `buildChannelConfigSchema` برای تبدیل یک طرح‌واره Zod به wrapper `ChannelConfigSchema` استفاده کنید که artifactهای پیکربندی متعلق به Plugin از آن استفاده می‌کنند:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

برای Pluginهای شخص ثالث، قرارداد مسیر سرد همچنان manifest Plugin است: JSON Schema تولیدشده را در `openclaw.plugin.json#channelConfigs` بازتاب دهید تا طرح‌واره پیکربندی، راه‌اندازی، و سطوح UI بتوانند `channels.<id>` را بدون بارگذاری کد زمان اجرا بررسی کنند.

## wizardهای راه‌اندازی

Pluginهای کانال می‌توانند برای `openclaw onboard` wizardهای راه‌اندازی تعاملی ارائه کنند. wizard یک شیء `ChannelSetupWizard` روی `ChannelPlugin` است:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

نوع `ChannelSetupWizard` از `credentials`، `textInputs`، `dmPolicy`، `allowFrom`، `groupAccess`، `prepare`، `finalize` و موارد بیشتر پشتیبانی می‌کند. برای نمونه‌های کامل، بسته‌های Plugin بسته‌بندی‌شده را ببینید (برای مثال Plugin مربوط به Discord در `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="promptهای مشترک allowFrom">
    برای promptهای allowlist پیام مستقیم که فقط به جریان استاندارد `note -> prompt -> parse -> merge -> patch` نیاز دارند، کمک‌کننده‌های راه‌اندازی مشترک از `openclaw/plugin-sdk/setup` را ترجیح دهید: `createPromptParsedAllowFromForAccount(...)`، `createTopLevelChannelParsedAllowFromPrompt(...)`، و `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="وضعیت استاندارد راه‌اندازی کانال">
    برای بلوک‌های وضعیت راه‌اندازی کانال که فقط از نظر برچسب‌ها، امتیازها، و خط‌های اضافی اختیاری تفاوت دارند، به‌جای ساخت دستی همان شیء `status` در هر Plugin، از `createStandardChannelSetupStatus(...)` در `openclaw/plugin-sdk/setup` استفاده کنید.
  </Accordion>
  <Accordion title="سطح راه‌اندازی اختیاری کانال">
    برای سطوح راه‌اندازی اختیاری که فقط باید در زمینه‌های خاصی ظاهر شوند، از `createOptionalChannelSetupSurface` در `openclaw/plugin-sdk/channel-setup` استفاده کنید:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Returns { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` همچنین سازنده‌های سطح پایین‌تر `createOptionalChannelSetupAdapter(...)` و `createOptionalChannelSetupWizard(...)` را در معرض می‌گذارد، وقتی فقط به یک نیمه از آن سطح نصب اختیاری نیاز دارید.

    آداپتور/wizard اختیاری تولیدشده در نوشتن پیکربندی واقعی fail closed می‌شود. آن‌ها یک پیام نیازمند نصب را در `validateInput`، `applyAccountConfig`، و `finalize` بازاستفاده می‌کنند و وقتی `docsPath` تنظیم شده باشد، یک پیوند اسناد اضافه می‌کنند.

  </Accordion>
  <Accordion title="کمک‌کننده‌های راه‌اندازی مبتنی بر باینری">
    برای UIهای راه‌اندازی مبتنی بر باینری، به‌جای کپی‌کردن همان چسب باینری/وضعیت در هر کانال، کمک‌کننده‌های delegated مشترک را ترجیح دهید:

    - `createDetectedBinaryStatus(...)` برای بلوک‌های وضعیت که فقط از نظر برچسب‌ها، راهنماها، امتیازها، و تشخیص باینری تفاوت دارند
    - `createCliPathTextInput(...)` برای ورودی‌های متنی مبتنی بر مسیر
    - `createDelegatedSetupWizardStatusResolvers(...)`، `createDelegatedPrepare(...)`، `createDelegatedFinalize(...)`، و `createDelegatedResolveConfigured(...)` وقتی `setupEntry` باید به‌صورت lazy به یک wizard کامل سنگین‌تر forward کند
    - `createDelegatedTextInputShouldPrompt(...)` وقتی `setupEntry` فقط باید تصمیم `textInputs[*].shouldPrompt` را delegate کند

  </Accordion>
</AccordionGroup>

## انتشار و نصب

**Pluginهای خارجی:** در [ClawHub](/fa/tools/clawhub) منتشر کنید، سپس نصب کنید:

<Tabs>
  <Tab title="خودکار (ابتدا ClawHub سپس npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw ابتدا ClawHub را امتحان می‌کند و به‌طور خودکار به npm fallback می‌کند.

  </Tab>
  <Tab title="فقط ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مشخصات بسته npm">
    وقتی یک بسته هنوز به ClawHub منتقل نشده است، یا وقتی هنگام مهاجرت به یک
    مسیر نصب مستقیم npm نیاز دارید، از npm استفاده کنید:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginهای درون مخزن:** زیر درخت فضای کاری Plugin بسته‌بندی‌شده قرار دهید و آن‌ها هنگام build به‌طور خودکار کشف می‌شوند.

**کاربران می‌توانند نصب کنند:**

```bash
openclaw plugins install <package-name>
```

<Info>
برای نصب‌های برگرفته از npm، `openclaw plugins install` بسته را زیر `~/.openclaw/npm` با اسکریپت‌های چرخه عمر غیرفعال نصب می‌کند. درخت‌های وابستگی Plugin را JS/TS خالص نگه دارید و از بسته‌هایی که به buildهای `postinstall` نیاز دارند پرهیز کنید.
</Info>

<Note>
شروع Gateway وابستگی‌های Plugin را نصب نمی‌کند. جریان‌های نصب npm/git/ClawHub مالک همگرایی وابستگی هستند؛ Pluginهای محلی باید وابستگی‌هایشان را از قبل نصب‌شده داشته باشند.
</Note>

فراداده بسته همراه صریح است و هنگام راه‌اندازی Gateway از JavaScript ساخته‌شده استنباط نمی‌شود. وابستگی‌های زمان اجرا باید در بسته Pluginای باشند که مالک آن‌هاست؛ راه‌اندازی OpenClaw بسته‌بندی‌شده هرگز وابستگی‌های Plugin را تعمیر یا آینه‌سازی نمی‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — راهنمای شروع گام‌به‌گام
- [مانیفست Plugin](/fa/plugins/manifest) — مرجع کامل طرح‌واره مانیفست
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
