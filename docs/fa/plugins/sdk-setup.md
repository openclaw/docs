---
read_when:
    - شما در حال افزودن یک راه‌انداز پیکربندی به یک Plugin هستید
    - باید تفاوت میان setup-entry.ts و index.ts را درک کنید
    - شما در حال تعریف طرح‌واره‌های پیکربندی Plugin یا فرادادهٔ openclaw در package.json هستید
sidebarTitle: Setup and config
summary: راهنماهای گام‌به‌گام راه‌اندازی، setup-entry.ts، طرح‌واره‌های پیکربندی و فراداده‌های package.json
title: راه‌اندازی و پیکربندی Plugin
x-i18n:
    generated_at: "2026-07-12T10:39:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع بسته‌بندی Plugin (فرادادهٔ `package.json`)، مانیفست‌ها (`openclaw.plugin.json`)، ورودی‌های راه‌اندازی و طرح‌واره‌های پیکربندی.

<Tip>
**دنبال یک راهنمای گام‌به‌گام هستید؟** راهنماهای عملی، بسته‌بندی را در بستر کاربرد توضیح می‌دهند: [Pluginهای کانال](/fa/plugins/sdk-channel-plugins#step-1-package-and-manifest) و [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## فرادادهٔ بسته

فایل `package.json` شما به یک فیلد `openclaw` نیاز دارد که به سامانهٔ Plugin اعلام کند Plugin شما چه امکاناتی ارائه می‌دهد:

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
  <Tab title="Plugin ارائه‌دهنده / خط مبنای ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
انتشار خارجی در ClawHub به `compat` و `build` نیاز دارد. قطعه‌کدهای معیار انتشار در `docs/snippets/plugin-publish/` قرار دارند.
</Note>

### فیلدهای `openclaw`

<ParamField path="extensions" type="string[]">
  فایل‌های نقطهٔ ورود (نسبت به ریشهٔ بسته). ورودی‌های منبع معتبر برای توسعه در فضای کاری و وارسی git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  همتاهای JavaScript ساخته‌شده برای `extensions` که هنگام بارگذاری یک بستهٔ npm نصب‌شده توسط OpenClaw ترجیح داده می‌شوند. برای ترتیب تفکیک منبع/نسخهٔ ساخته‌شده، به [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) مراجعه کنید.
</ParamField>
<ParamField path="setupEntry" type="string">
  ورودی سبک‌وزنِ مخصوص راه‌اندازی (اختیاری).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  همتای JavaScript ساخته‌شده برای `setupEntry`. لازم است `setupEntry` نیز تنظیم شده باشد.
</ParamField>
<ParamField path="plugin" type="object">
  هویت جایگزین Plugin به‌شکل `{ id, label }` که وقتی Plugin فاقد فرادادهٔ کانال/ارائه‌دهنده برای استخراج شناسه یا برچسب است، استفاده می‌شود.
</ParamField>
<ParamField path="channel" type="object">
  فرادادهٔ کاتالوگ کانال برای سطوح راه‌اندازی، انتخاب‌گر، شروع سریع و وضعیت.
</ParamField>
<ParamField path="install" type="object">
  راهنمای نصب: `npmSpec`، `localPath`، `defaultChoice`، `minHostVersion`، `expectedIntegrity`، `allowInvalidConfigRecovery`، `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  پرچم‌های رفتار هنگام راه‌اندازی.
</ParamField>
<ParamField path="compat" type="object">
  بازهٔ نسخهٔ `pluginApi` که این Plugin پشتیبانی می‌کند. برای انتشار خارجی در ClawHub الزامی است.
</ParamField>

<Note>
شناسه‌های ارائه‌دهنده (`providers: string[]`) فرادادهٔ مانیفست هستند، نه فرادادهٔ بسته. آن‌ها را در `openclaw.plugin.json` تعریف کنید، نه اینجا — به [مانیفست Plugin](/fa/plugins/manifest) مراجعه کنید.
</Note>

### `openclaw.channel`

`openclaw.channel` فرادادهٔ سبک بسته برای کشف کانال و سطوح راه‌اندازی، پیش از بارگذاری زمان اجرا است.

| فیلد                                  | نوع        | مفهوم                                                                         |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | شناسهٔ معیار کانال.                                                           |
| `label`                                | `string`   | برچسب اصلی کانال.                                                             |
| `selectionLabel`                       | `string`   | برچسب انتخاب‌گر/راه‌اندازی، وقتی باید با `label` متفاوت باشد.                 |
| `detailLabel`                          | `string`   | برچسب جزئیات ثانویه برای کاتالوگ‌های غنی‌تر کانال و سطوح وضعیت.                |
| `docsPath`                             | `string`   | مسیر مستندات برای پیوندهای راه‌اندازی و انتخاب.                               |
| `docsLabel`                            | `string`   | برچسب جایگزین پیوندهای مستندات، وقتی باید با شناسهٔ کانال متفاوت باشد.        |
| `blurb`                                | `string`   | توضیح کوتاه آشنایی اولیه/کاتالوگ.                                             |
| `order`                                | `number`   | ترتیب مرتب‌سازی در کاتالوگ‌های کانال.                                         |
| `aliases`                              | `string[]` | نام‌های مستعار اضافی برای جست‌وجوی انتخاب کانال.                              |
| `preferOver`                           | `string[]` | شناسه‌های Plugin/کانال با اولویت پایین‌تر که این کانال باید بر آن‌ها مقدم باشد. |
| `systemImage`                          | `string`   | نام اختیاری نماد/تصویر سیستمی برای کاتالوگ‌های رابط کاربری کانال.             |
| `selectionDocsPrefix`                  | `string`   | متن پیشوند پیش از پیوندهای مستندات در سطوح انتخاب.                            |
| `selectionDocsOmitLabel`               | `boolean`  | نمایش مستقیم مسیر مستندات به‌جای پیوند مستندات برچسب‌دار در متن انتخاب.       |
| `selectionExtras`                      | `string[]` | رشته‌های کوتاه اضافی که به متن انتخاب افزوده می‌شوند.                         |
| `markdownCapable`                      | `boolean`  | کانال را برای تصمیم‌های قالب‌بندی خروجی، دارای قابلیت Markdown علامت‌گذاری می‌کند. |
| `exposure`                             | `object`   | کنترل‌های نمایان‌بودن کانال برای راه‌اندازی، فهرست‌های پیکربندی‌شده و سطوح مستندات. |
| `quickstartAllowFrom`                  | `boolean`  | این کانال را وارد جریان استاندارد راه‌اندازی `allowFrom` در شروع سریع می‌کند. |
| `forceAccountBinding`                  | `boolean`  | حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند.             |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | هنگام تفکیک مقصدهای اعلان برای این کانال، جست‌وجوی نشست را ترجیح می‌دهد.       |

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

`exposure` از موارد زیر پشتیبانی می‌کند:

- `configured`: کانال را در سطوح فهرست‌سازی به‌سبک پیکربندی‌شده/وضعیت قرار می‌دهد
- `setup`: کانال را در انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی قرار می‌دهد
- `docs`: کانال را در سطوح مستندات/پیمایش به‌عنوان عمومی علامت‌گذاری می‌کند

<Note>
`showConfigured` و `showInSetup` همچنان به‌عنوان نام‌های مستعار قدیمی پشتیبانی می‌شوند. `exposure` را ترجیح دهید.
</Note>

### `openclaw.install`

`openclaw.install` فرادادهٔ بسته است، نه فرادادهٔ مانیفست.

| فیلد                         | نوع                                 | مفهوم                                                                              |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مشخصهٔ معیار ClawHub برای جریان‌های نصب/به‌روزرسانی و نصب در صورت نیاز هنگام آشنایی اولیه. |
| `npmSpec`                    | `string`                            | مشخصهٔ معیار npm برای جریان‌های جایگزین نصب/به‌روزرسانی.                          |
| `localPath`                  | `string`                            | مسیر توسعهٔ محلی یا نصب همراه.                                                     |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | منبع نصب ترجیحی، وقتی چند منبع در دسترس است.                                      |
| `minHostVersion`             | `string`                            | حداقل نسخهٔ پشتیبانی‌شدهٔ OpenClaw، به‌شکل `>=x.y.z` یا `>=x.y.z-prerelease`.     |
| `expectedIntegrity`          | `string`                            | رشتهٔ یکپارچگی مورد انتظار توزیع npm، معمولاً `sha512-...`، برای نصب‌های سنجاق‌شده. |
| `allowInvalidConfigRecovery` | `boolean`                           | به جریان‌های نصب مجدد Plugin همراه اجازه می‌دهد خطاهای مشخص پیکربندی قدیمی را بازیابی کنند. |
| `requiredPlatformPackages`   | `string[]`                          | نام‌های مستعار npm مخصوص پلتفرم که هنگام نصب npm باید تأیید شوند.                 |

<AccordionGroup>
  <Accordion title="رفتار آشنایی اولیه">
    آشنایی اولیهٔ تعاملی از `openclaw.install` برای سطوح نصب در صورت نیاز استفاده می‌کند: اگر Plugin شما پیش از بارگذاری زمان اجرا گزینه‌های احراز هویت ارائه‌دهنده یا فرادادهٔ راه‌اندازی/کاتالوگ کانال را ارائه کند، فرایند آشنایی اولیه می‌تواند نصب از ClawHub، npm یا منبع محلی را پیشنهاد دهد، Plugin را نصب یا فعال کند و سپس جریان انتخاب‌شده را ادامه دهد. گزینه‌های ClawHub از `clawhubSpec` استفاده می‌کنند و در صورت وجود ترجیح داده می‌شوند؛ گزینه‌های npm به فرادادهٔ کاتالوگ مورد اعتماد با `npmSpec` رجیستری نیاز دارند (نسخه‌های دقیق و `expectedIntegrity` سنجاق‌های اختیاری‌اند که در صورت تنظیم، هنگام نصب/به‌روزرسانی اعمال می‌شوند). «چه چیزی نمایش داده شود» را در `openclaw.plugin.json` و «چگونه نصب شود» را در `package.json` نگه دارید.
  </Accordion>
  <Accordion title="اعمال minHostVersion">
    اگر `minHostVersion` تنظیم شده باشد، هم نصب و هم بارگذاری رجیستری مانیفستِ غیرهمراه آن را اعمال می‌کنند. میزبان‌های قدیمی‌تر از Pluginهای خارجی صرف‌نظر می‌کنند؛ رشته‌های نسخهٔ نامعتبر رد می‌شوند. فرض می‌شود Pluginهای منبع همراه با وارسی میزبان هم‌نسخه باشند.
  </Accordion>
  <Accordion title="نصب‌های سنجاق‌شدهٔ npm">
    برای نصب‌های سنجاق‌شدهٔ npm، نسخهٔ دقیق را در `npmSpec` نگه دارید و یکپارچگی مورد انتظار مصنوع را اضافه کنید:

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
    `allowInvalidConfigRecovery` راه عمومی برای دورزدن پیکربندی‌های خراب نیست. این گزینه فقط برای بازیابی محدود Plugin همراه است و به نصب مجدد/راه‌اندازی اجازه می‌دهد بقایای شناخته‌شدهٔ ارتقا، مانند نبود مسیر Plugin همراه یا ورودی قدیمی `channels.<id>` برای همان Plugin، را ترمیم کند. اگر پیکربندی به دلایل نامرتبط خراب باشد، نصب همچنان به‌صورت بسته شکست می‌خورد و به متصدی می‌گوید `openclaw doctor --fix` را اجرا کند.
  </Accordion>
</AccordionGroup>

### بارگذاری کامل با تأخیر

Pluginهای کانال می‌توانند با پیکربندی زیر بارگذاری با تأخیر را فعال کنند:

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

در صورت فعال‌سازی، OpenClaw در مرحلهٔ راه‌اندازی پیش از گوش‌دادن، حتی برای کانال‌هایی که از قبل پیکربندی شده‌اند، فقط `setupEntry` را بارگذاری می‌کند. ورودی کامل پس از آغاز گوش‌دادن Gateway بارگذاری می‌شود.

<Warning>
بارگذاری با تأخیر را فقط زمانی فعال کنید که `setupEntry` شما همهٔ موارد مورد نیاز Gateway را پیش از شروع گوش‌دادن ثبت کند (ثبت کانال، مسیرهای HTTP، متدهای Gateway). اگر ورودی کامل قابلیت‌های ضروری راه‌اندازی را در اختیار دارد، رفتار پیش‌فرض را حفظ کنید.
</Warning>

اگر ورودی راه‌اندازی/کامل شما متدهای RPC مربوط به Gateway را ثبت می‌کند، آن‌ها را زیر یک پیشوند مخصوص Plugin نگه دارید. فضاهای نام مدیریتی رزروشدهٔ هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) در مالکیت هسته باقی می‌مانند و همیشه به `operator.admin` نرمال‌سازی می‌شوند.

## مانیفست Plugin

هر Plugin بومی باید یک `openclaw.plugin.json` در ریشهٔ بسته ارائه کند. OpenClaw از آن برای اعتبارسنجی پیکربندی بدون اجرای کد Plugin استفاده می‌کند.

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

برای Pluginهای کانال، `channels` را اضافه کنید (و Pluginهای ارائه‌دهنده `providers` را اضافه می‌کنند):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

حتی Pluginهایی که پیکربندی ندارند نیز باید یک طرح‌واره ارائه کنند. طرح‌وارهٔ خالی معتبر است:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

برای مرجع کامل طرح‌واره، [مانیفست Plugin](/fa/plugins/manifest) را ببینید.

## انتشار در ClawHub

بسته‌های Skills و Plugin از فرمان‌های انتشار جداگانه‌ای در ClawHub استفاده می‌کنند. برای بسته‌های Plugin، از فرمان ویژهٔ بسته استفاده کنید:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` فرمان متفاوتی برای انتشار یک پوشهٔ Skill است، نه یک بستهٔ Plugin. [انتشار در ClawHub](/fa/clawhub/publishing) را ببینید.
</Note>

## ورودی راه‌اندازی

`setup-entry.ts` جایگزینی سبک برای `index.ts` است که OpenClaw هنگامی بارگذاری می‌کند که فقط به سطوح راه‌اندازی نیاز دارد (آغازبه‌کار، ترمیم پیکربندی، بازرسی کانال غیرفعال):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

این کار از بارگذاری کد سنگین زمان اجرا (کتابخانه‌های رمزنگاری، ثبت‌های CLI، سرویس‌های پس‌زمینه) طی جریان‌های راه‌اندازی جلوگیری می‌کند.

کانال‌های همراه فضای کاری که خروجی‌های امن برای راه‌اندازی را در ماژول‌های جانبی نگه می‌دارند، می‌توانند به‌جای `defineSetupPluginEntry(...)` از `defineBundledChannelSetupEntry(...)` در `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. این قرارداد همراه همچنین از خروجی اختیاری `runtime` پشتیبانی می‌کند تا سیم‌کشی زمان اجرای هنگام راه‌اندازی، سبک و صریح باقی بماند.

<AccordionGroup>
  <Accordion title="زمانی که OpenClaw به‌جای ورودی کامل از setupEntry استفاده می‌کند">
    - کانال غیرفعال است، اما به سطوح راه‌اندازی/آغازبه‌کار نیاز دارد.
    - کانال فعال است، اما پیکربندی نشده است.
    - بارگذاری معوق فعال است (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="مواردی که setupEntry باید ثبت کند">
    - شیء Plugin کانال (از طریق `defineSetupPluginEntry`).
    - هر مسیر HTTP موردنیاز پیش از شروع گوش‌دادن Gateway.
    - هر متد Gateway موردنیاز هنگام راه‌اندازی.

    این متدهای Gateway هنگام راه‌اندازی همچنان باید از فضای نام مدیریتی رزروشدهٔ هسته، مانند `config.*` یا `update.*`، اجتناب کنند.

  </Accordion>
  <Accordion title="مواردی که setupEntry نباید شامل شود">
    - ثبت‌های CLI.
    - سرویس‌های پس‌زمینه.
    - واردسازی‌های سنگین زمان اجرا (رمزنگاری، SDKها).
    - متدهای Gateway که فقط پس از راه‌اندازی موردنیازند.

  </Accordion>
</AccordionGroup>

### واردسازی‌های محدود راهنماهای راه‌اندازی

برای مسیرهای داغِ ویژهٔ راه‌اندازی، هنگامی که فقط به بخشی از سطح راه‌اندازی نیاز دارید، درزهای محدود راهنماهای راه‌اندازی را به چتر گسترده‌تر `plugin-sdk/setup` ترجیح دهید:

| مسیر واردسازی                        | کاربرد                                                                                | خروجی‌های کلیدی                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | راهنماهای زمان اجرای هنگام راه‌اندازی که در `setupEntry` / راه‌اندازی معوق کانال در دسترس می‌مانند | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/setup-runtime` استفاده کنید                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | راهنماهای CLI/بایگانی/مستنداتِ راه‌اندازی/نصب                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

هنگامی که جعبه‌ابزار کامل و مشترک راه‌اندازی، از جمله راهنماهای وصلهٔ پیکربندی مانند `moveSingleAccountChannelSectionToDefaultAccount(...)`، را می‌خواهید، از درز گسترده‌تر `plugin-sdk/setup` استفاده کنید.

برای متن ثابت جادوگر راه‌اندازی از `createSetupTranslator(...)` استفاده کنید. این تابع از منطقهٔ زبانی جادوگر CLI پیروی می‌کند (ابتدا `OPENCLAW_LOCALE`، سپس متغیرهای منطقهٔ زبانی سیستم) و در صورت نبود ترجمه به انگلیسی بازمی‌گردد. متن راه‌اندازی ویژهٔ Plugin را در کد متعلق به همان Plugin نگه دارید و کلیدهای کاتالوگ مشترک را فقط برای برچسب‌های عمومی راه‌اندازی، متن وضعیت و متن راه‌اندازی Pluginهای رسمی همراه به‌کار ببرید.

آداپتورهای وصلهٔ راه‌اندازی هنگام واردسازی برای مسیر داغ ایمن می‌مانند. جست‌وجوی سطح قرارداد ارتقای تک‌حسابی همراه آن‌ها تنبل است؛ بنابراین واردسازی `plugin-sdk/setup-runtime` پیش از استفادهٔ واقعی از آداپتور، کشف سطح قرارداد همراه را مشتاقانه بارگذاری نمی‌کند.

### ارتقای تک‌حسابی متعلق به کانال

هنگامی که کانالی از پیکربندی سطح‌بالای تک‌حسابی به `channels.<id>.accounts.*` ارتقا می‌یابد، رفتار مشترک پیش‌فرض، مقادیر ارتقایافتهٔ مختص حساب را به `accounts.default` منتقل می‌کند.

کانال‌های همراه می‌توانند این ارتقا را از طریق سطح قرارداد راه‌اندازی خود محدود یا بازنویسی کنند:

- `singleAccountKeysToMove`: کلیدهای سطح‌بالای اضافی که باید به حساب ارتقایافته منتقل شوند
- `namedAccountPromotionKeys`: هنگامی که حساب‌های نام‌گذاری‌شده از قبل وجود دارند، فقط این کلیدها به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای مشترک خط‌مشی/تحویل در ریشهٔ کانال باقی می‌مانند
- `resolveSingleAccountPromotionTarget(...)`: انتخاب اینکه کدام حساب موجود مقادیر ارتقایافته را دریافت کند

<Note>
Matrix نمونهٔ همراه کنونی است. اگر دقیقاً یک حساب نام‌گذاری‌شدهٔ Matrix از قبل وجود داشته باشد، یا اگر `defaultAccount` به کلید غیرمتعارف موجودی مانند `Ops` اشاره کند، ارتقا به‌جای ایجاد یک ورودی جدید `accounts.default`، همان حساب را حفظ می‌کند.
</Note>

## طرح‌وارهٔ پیکربندی

پیکربندی Plugin با JSON Schema موجود در مانیفست شما اعتبارسنجی می‌شود. کاربران Pluginها را به این شکل پیکربندی می‌کنند:

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

Plugin شما هنگام ثبت، این پیکربندی را به‌صورت `api.pluginConfig` دریافت می‌کند.

برای پیکربندی ویژهٔ کانال، در عوض از بخش پیکربندی کانال استفاده کنید:

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

از `buildChannelConfigSchema` برای تبدیل یک طرح‌وارهٔ Zod به پوشش `ChannelConfigSchema` استفاده کنید که مصنوعات پیکربندی متعلق به Plugin از آن بهره می‌برند:

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

اگر از قبل قرارداد را به‌صورت JSON Schema یا TypeBox می‌نویسید، از راهنمای مستقیم استفاده کنید تا OpenClaw بتواند در مسیرهای فراداده از تبدیل Zod به JSON Schema صرف‌نظر کند:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

برای Pluginهای شخص ثالث، قرارداد مسیر سرد همچنان مانیفست Plugin است: JSON Schema تولیدشده را در `openclaw.plugin.json#channelConfigs` بازتاب دهید تا طرح‌وارهٔ پیکربندی، راه‌اندازی و سطوح رابط کاربری بتوانند بدون بارگذاری کد زمان اجرا، `channels.<id>` را بازرسی کنند.

## جادوگرهای راه‌اندازی

Pluginهای کانال می‌توانند برای `openclaw onboard` جادوگرهای راه‌اندازی تعاملی فراهم کنند. جادوگر یک شیء `ChannelSetupWizard` در `ChannelPlugin` است:

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

`ChannelSetupWizard` همچنین از `textInputs`، `dmPolicy`، `allowFrom`، `groupAccess`، `prepare`، `finalize` و موارد دیگر پشتیبانی می‌کند. برای مشاهدهٔ یک نمونهٔ کامل همراه، `src/setup-core.ts` در Plugin مربوط به Discord را ببینید.

<AccordionGroup>
  <Accordion title="درخواست‌های مشترک allowFrom">
    برای درخواست‌های فهرست مجاز پیام خصوصی که فقط به جریان استاندارد `note -> prompt -> parse -> merge -> patch` نیاز دارند، راهنماهای مشترک راه‌اندازی از `openclaw/plugin-sdk/setup` را ترجیح دهید: `createPromptParsedAllowFromForAccount(...)`، `createTopLevelChannelParsedAllowFromPrompt(...)` و `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="وضعیت استاندارد راه‌اندازی کانال">
    برای بلوک‌های وضعیت راه‌اندازی کانال که فقط در برچسب‌ها، امتیازها و خطوط اضافی اختیاری تفاوت دارند، به‌جای ساخت دستی همان شیء `status` در هر Plugin، `createStandardChannelSetupStatus(...)` از `openclaw/plugin-sdk/setup` را ترجیح دهید.
  </Accordion>
  <Accordion title="سطح اختیاری راه‌اندازی کانال">
    برای سطوح اختیاری راه‌اندازی که فقط باید در زمینه‌های خاصی نمایش داده شوند، از `createOptionalChannelSetupSurface` در `openclaw/plugin-sdk/channel-setup` استفاده کنید:

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

    هنگامی که فقط به یکی از دو بخش این سطح نصب اختیاری نیاز دارید، `plugin-sdk/channel-setup` سازنده‌های سطح پایین‌تر `createOptionalChannelSetupAdapter(...)` و `createOptionalChannelSetupWizard(...)` را نیز ارائه می‌کند.

    آداپتور/ویزارد اختیاری تولیدشده هنگام نوشتن واقعی پیکربندی، به‌صورت بسته و همراه با خطا عمل می‌کند. آن‌ها در `validateInput`، `applyAccountConfig` و `finalize` از یک پیام واحد درباره الزام نصب استفاده می‌کنند و هنگامی که `docsPath` تنظیم شده باشد، پیوند مستندات را به آن می‌افزایند.

  </Accordion>
  <Accordion title="توابع کمکی راه‌اندازی مبتنی بر فایل اجرایی">
    برای رابط‌های کاربری راه‌اندازی مبتنی بر فایل اجرایی، به‌جای کپی‌کردن منطق یکسان فایل اجرایی/وضعیت در هر کانال، توابع کمکی واگذارشده مشترک را ترجیح دهید:

    - `createDetectedBinaryStatus(...)` برای بلوک‌های وضعیتی که فقط از نظر برچسب‌ها، راهنمایی‌ها، امتیازها و تشخیص فایل اجرایی تفاوت دارند
    - `createCliPathTextInput(...)` برای ورودی‌های متنی مبتنی بر مسیر
    - `createDelegatedSetupWizardStatusResolvers(...)`، `createDelegatedPrepare(...)`، `createDelegatedFinalize(...)` و `createDelegatedResolveConfigured(...)` هنگامی که `setupEntry` باید به‌صورت تنبل به یک ویزارد کامل و سنگین‌تر هدایت کند
    - `createDelegatedTextInputShouldPrompt(...)` هنگامی که `setupEntry` فقط باید تصمیم‌گیری درباره `textInputs[*].shouldPrompt` را واگذار کند

  </Accordion>
</AccordionGroup>

## انتشار و نصب

**Plugin‌های خارجی:** در [ClawHub](/fa/clawhub) منتشر کنید، سپس نصب کنید:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    مشخصات ساده بسته هنگام انتقال در زمان راه‌اندازی از npm نصب می‌شوند، مگر اینکه نام با شناسه یک Plugin همراه یا رسمی مطابقت داشته باشد؛ در این صورت OpenClaw به‌جای آن از نسخه محلی/رسمی استفاده می‌کند. برای انتخاب قطعی منبع از `clawhub:`، `npm:`، `git:` یا `npm-pack:` استفاده کنید — به [مدیریت Plugin‌ها](/fa/plugins/manage-plugins) مراجعه کنید.

  </Tab>
  <Tab title="فقط ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مشخصات بسته npm">
    هنگامی از npm استفاده کنید که بسته‌ای هنوز به ClawHub منتقل نشده است، یا زمانی که هنگام مهاجرت به مسیر نصب مستقیم npm نیاز دارید:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin‌های درون مخزن:** آن‌ها را زیر درخت فضای کاری Plugin‌های همراه قرار دهید؛ هنگام ساخت به‌طور خودکار شناسایی می‌شوند.

<Info>
برای نصب‌هایی که منبعشان npm است، `openclaw plugins install` بسته را در یک پروژه مختص هر Plugin زیر `~/.openclaw/npm/projects` و با غیرفعال‌بودن اسکریپت‌های چرخه حیات (`--ignore-scripts`) نصب می‌کند. درخت وابستگی Plugin را صرفاً مبتنی بر JS/TS نگه دارید و از بسته‌هایی که به ساخت‌های `postinstall` نیاز دارند پرهیز کنید.
</Info>

<Note>
راه‌اندازی Gateway وابستگی‌های Plugin را نصب نمی‌کند. فرایندهای نصب npm/git/ClawHub مسئول همگراکردن وابستگی‌ها هستند؛ وابستگی‌های Plugin‌های محلی باید از قبل نصب شده باشند.
</Note>

فراداده بسته‌های همراه صریح است و هنگام راه‌اندازی Gateway از JavaScript ساخته‌شده استنتاج نمی‌شود. وابستگی‌های زمان اجرا باید در بسته Plugin مالک آن‌ها قرار گیرند؛ راه‌اندازی نسخه بسته‌بندی‌شده OpenClaw هرگز وابستگی‌های Plugin را ترمیم یا همگام‌سازی نمی‌کند.

## مرتبط

- [ساخت Plugin‌ها](/fa/plugins/building-plugins) — راهنمای گام‌به‌گام شروع کار
- [مانیفست Plugin](/fa/plugins/manifest) — مرجع کامل شِمای مانیفست
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
