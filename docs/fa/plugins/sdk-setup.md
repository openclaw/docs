---
read_when:
    - شما در حال افزودن یک راهنمای راه‌اندازی به یک Plugin هستید
    - باید تفاوت setup-entry.ts و index.ts را درک کنید
    - شما در حال تعریف طرح‌واره‌های پیکربندی Plugin یا فرادادهٔ openclaw در package.json هستید
sidebarTitle: Setup and config
summary: جادوگرهای راه‌اندازی، setup-entry.ts، شِماهای پیکربندی، و فرادادهٔ package.json
title: راه‌اندازی و پیکربندی Plugin
x-i18n:
    generated_at: "2026-06-27T18:32:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع بسته‌بندی Plugin (فراداده‌ی `package.json`)، manifestها (`openclaw.plugin.json`)، ورودی‌های راه‌اندازی، و schemaهای پیکربندی.

<Tip>
**به دنبال راهنمای گام‌به‌گام هستید؟** راهنماهای عملی، بسته‌بندی را در متن کاربرد پوشش می‌دهند: [Pluginهای کانال](/fa/plugins/sdk-channel-plugins#step-1-package-and-manifest) و [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## فراداده‌ی بسته

`package.json` شما به یک فیلد `openclaw` نیاز دارد که به سیستم Plugin بگوید Plugin شما چه چیزی ارائه می‌کند:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
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
اگر Plugin را به‌صورت خارجی روی ClawHub منتشر می‌کنید، آن فیلدهای `compat` و `build` الزامی هستند. قطعه‌کدهای canonical انتشار در `docs/snippets/plugin-publish/` قرار دارند.
</Note>

### فیلدهای `openclaw`

<ParamField path="extensions" type="string[]">
  فایل‌های نقطه‌ی ورود (نسبت به ریشه‌ی بسته).
</ParamField>
<ParamField path="setupEntry" type="string">
  ورودی سبک فقط برای راه‌اندازی (اختیاری).
</ParamField>
<ParamField path="channel" type="object">
  فراداده‌ی کاتالوگ کانال برای سطوح راه‌اندازی، انتخاب‌گر، شروع سریع، و وضعیت.
</ParamField>
<ParamField path="providers" type="string[]">
  شناسه‌های ارائه‌دهنده که توسط این Plugin ثبت می‌شوند.
</ParamField>
<ParamField path="install" type="object">
  راهنمایی‌های نصب: `npmSpec`، `localPath`، `defaultChoice`، `minHostVersion`، `expectedIntegrity`، `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  پرچم‌های رفتار شروع به کار.
</ParamField>

### `openclaw.channel`

`openclaw.channel` فراداده‌ی سبک بسته برای کشف کانال و سطوح راه‌اندازی پیش از بارگذاری runtime است.

| فیلد                                   | نوع        | معنی آن                                                                        |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | شناسه‌ی canonical کانال.                                                       |
| `label`                                | `string`   | برچسب اصلی کانال.                                                             |
| `selectionLabel`                       | `string`   | برچسب انتخاب‌گر/راه‌اندازی وقتی باید با `label` فرق داشته باشد.               |
| `detailLabel`                          | `string`   | برچسب جزئیات ثانویه برای کاتالوگ‌های کانال غنی‌تر و سطوح وضعیت.              |
| `docsPath`                             | `string`   | مسیر مستندات برای پیوندهای راه‌اندازی و انتخاب.                               |
| `docsLabel`                            | `string`   | بازنویسی برچسب استفاده‌شده برای پیوندهای مستندات وقتی باید با شناسه‌ی کانال فرق داشته باشد. |
| `blurb`                                | `string`   | توضیح کوتاه onboarding/کاتالوگ.                                                |
| `order`                                | `number`   | ترتیب مرتب‌سازی در کاتالوگ‌های کانال.                                         |
| `aliases`                              | `string[]` | aliasهای جست‌وجوی اضافی برای انتخاب کانال.                                    |
| `preferOver`                           | `string[]` | شناسه‌های Plugin/کانال با اولویت پایین‌تر که این کانال باید بالاتر از آن‌ها قرار گیرد. |
| `systemImage`                          | `string`   | نام اختیاری آیکن/تصویر سیستمی برای کاتالوگ‌های UI کانال.                      |
| `selectionDocsPrefix`                  | `string`   | متن پیشوند پیش از پیوندهای مستندات در سطوح انتخاب.                            |
| `selectionDocsOmitLabel`               | `boolean`  | در متن انتخاب، مسیر مستندات را مستقیما به‌جای پیوند مستندات برچسب‌دار نشان بده. |
| `selectionExtras`                      | `string[]` | رشته‌های کوتاه اضافی که به متن انتخاب افزوده می‌شوند.                         |
| `markdownCapable`                      | `boolean`  | کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان پشتیبان markdown علامت‌گذاری می‌کند. |
| `exposure`                             | `object`   | کنترل‌های دیده‌شدن کانال برای راه‌اندازی، فهرست‌های پیکربندی‌شده، و سطوح مستندات. |
| `quickstartAllowFrom`                  | `boolean`  | این کانال را وارد جریان راه‌اندازی استاندارد شروع سریع `allowFrom` می‌کند.     |
| `forceAccountBinding`                  | `boolean`  | حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند.             |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | هنگام resolve کردن هدف‌های اعلام برای این کانال، جست‌وجوی session را ترجیح می‌دهد. |

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

- `configured`: کانال را در سطوح فهرست‌کردن به سبک پیکربندی‌شده/وضعیت وارد کن
- `setup`: کانال را در انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی وارد کن
- `docs`: کانال را در سطوح مستندات/ناوبری به‌عنوان عمومی علامت‌گذاری کن

<Note>
`showConfigured` و `showInSetup` همچنان به‌عنوان aliasهای قدیمی پشتیبانی می‌شوند. `exposure` را ترجیح دهید.
</Note>

### `openclaw.install`

`openclaw.install` فراداده‌ی بسته است، نه فراداده‌ی manifest.

| فیلد                         | نوع                                 | معنی آن                                                                          |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | spec canonical ClawHub برای جریان‌های نصب/به‌روزرسانی و نصب هنگام نیاز در onboarding. |
| `npmSpec`                    | `string`                            | spec canonical npm برای جریان‌های fallback نصب/به‌روزرسانی.                      |
| `localPath`                  | `string`                            | مسیر نصب محلی برای توسعه یا بسته‌ی bundled.                                      |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | منبع نصب ترجیحی وقتی چند منبع در دسترس است.                                      |
| `minHostVersion`             | `string`                            | حداقل نسخه‌ی پشتیبانی‌شده‌ی OpenClaw به شکل `>=x.y.z` یا `>=x.y.z-prerelease`.   |
| `expectedIntegrity`          | `string`                            | رشته‌ی integrity مورد انتظار dist مربوط به npm، معمولا `sha512-...`، برای نصب‌های pinned. |
| `allowInvalidConfigRecovery` | `boolean`                           | به جریان‌های نصب مجدد Pluginهای bundled اجازه می‌دهد از خطاهای خاص پیکربندی stale بازیابی کنند. |
| `requiredPlatformPackages`   | `string[]`                          | aliasهای npm وابسته به پلتفرم که هنگام نصب npm اعتبارسنجی می‌شوند.              |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    onboarding تعاملی نیز از `openclaw.install` برای سطوح نصب هنگام نیاز استفاده می‌کند. اگر Plugin شما پیش از بارگذاری runtime گزینه‌های احراز هویت ارائه‌دهنده یا فراداده‌ی راه‌اندازی/کاتالوگ کانال را ارائه کند، onboarding می‌تواند آن گزینه را نشان دهد، برای نصب از ClawHub، npm، یا local درخواست کند، Plugin را نصب یا فعال کند، و سپس جریان انتخاب‌شده را ادامه دهد. گزینه‌های onboarding مربوط به ClawHub از `clawhubSpec` استفاده می‌کنند و وقتی موجود باشند ترجیح داده می‌شوند؛ گزینه‌های npm به فراداده‌ی کاتالوگ مورد اعتماد با `npmSpec` رجیستری نیاز دارند؛ نسخه‌های دقیق و `expectedIntegrity` پین‌های اختیاری npm هستند. اگر `expectedIntegrity` وجود داشته باشد، جریان‌های نصب/به‌روزرسانی آن را برای npm enforce می‌کنند. فراداده‌ی «چه چیزی نشان داده شود» را در `openclaw.plugin.json` و فراداده‌ی «چگونه نصب شود» را در `package.json` نگه دارید.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    اگر `minHostVersion` تنظیم شده باشد، هم نصب و هم بارگذاری رجیستری manifest غیرباندل‌شده آن را enforce می‌کنند. hostهای قدیمی‌تر Pluginهای خارجی را رد می‌کنند؛ رشته‌های نسخه‌ی نامعتبر رد می‌شوند. Pluginهای منبع bundled فرض می‌شوند که با checkout میزبان هم‌نسخه هستند.
  </Accordion>
  <Accordion title="Pinned npm installs">
    برای نصب‌های pinned npm، نسخه‌ی دقیق را در `npmSpec` نگه دارید و integrity artifact مورد انتظار را اضافه کنید:

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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` یک bypass عمومی برای پیکربندی‌های خراب نیست. فقط برای بازیابی محدود Pluginهای bundled است، تا نصب مجدد/راه‌اندازی بتواند باقی‌مانده‌های شناخته‌شده‌ی ارتقا مانند مسیر missing Plugin bundled یا ورودی stale `channels.<id>` برای همان Plugin را اصلاح کند. اگر پیکربندی به دلایل نامرتبط خراب باشد، نصب همچنان fail closed می‌شود و به operator می‌گوید `openclaw doctor --fix` را اجرا کند.
  </Accordion>
</AccordionGroup>

### بارگذاری کامل deferred

Pluginهای کانال می‌توانند با این مورد وارد بارگذاری deferred شوند:

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

وقتی فعال باشد، OpenClaw در مرحله‌ی شروع به کار پیش از listen فقط `setupEntry` را بارگذاری می‌کند، حتی برای کانال‌هایی که از قبل پیکربندی شده‌اند. ورودی کامل پس از آنکه Gateway شروع به listen کرد بارگذاری می‌شود.

<Warning>
بارگذاری deferred را فقط زمانی فعال کنید که `setupEntry` شما هر چیزی را که Gateway پیش از شروع به listen نیاز دارد ثبت کند (ثبت کانال، routeهای HTTP، متدهای Gateway). اگر ورودی کامل مالک قابلیت‌های لازم برای شروع به کار است، رفتار پیش‌فرض را نگه دارید.
</Warning>

اگر ورودی setup/full شما متدهای RPC مربوط به Gateway را ثبت می‌کند، آن‌ها را روی یک پیشوند ویژه‌ی Plugin نگه دارید. namespaceهای رزروشده‌ی مدیریت core (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) تحت مالکیت core باقی می‌مانند و همیشه به `operator.admin` resolve می‌شوند.

## manifest Plugin

هر Plugin بومی باید یک `openclaw.plugin.json` در ریشه‌ی بسته ارائه کند. OpenClaw از آن برای اعتبارسنجی پیکربندی بدون اجرای کد Plugin استفاده می‌کند.

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

حتی Pluginهایی که پیکربندی ندارند هم باید schema ارائه کنند. یک schema خالی معتبر است:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

برای مرجع کامل schema، [Plugin manifest](/fa/plugins/manifest) را ببینید.

## انتشار ClawHub

برای بسته‌های Plugin، از دستور مخصوص بسته در ClawHub استفاده کنید:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
نام مستعار انتشار قدیمی فقط برای Skills است. بسته‌های Plugin باید همیشه از `clawhub package publish` استفاده کنند.
</Note>

## ورودی راه‌اندازی

فایل `setup-entry.ts` جایگزینی سبک برای `index.ts` است که OpenClaw وقتی فقط به سطوح راه‌اندازی نیاز دارد، آن را بارگذاری می‌کند (onboarding، تعمیر پیکربندی، بازرسی کانال غیرفعال).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

این کار از بارگذاری کدهای سنگین زمان اجرا (کتابخانه‌های رمزنگاری، ثبت‌های CLI، سرویس‌های پس‌زمینه) در جریان‌های راه‌اندازی جلوگیری می‌کند.

کانال‌های bundled workspace که خروجی‌های امن برای راه‌اندازی را در ماژول‌های sidecar نگه می‌دارند، می‌توانند به‌جای `defineSetupPluginEntry(...)` از `defineBundledChannelSetupEntry(...)` در `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن قرارداد bundled همچنین از یک خروجی اختیاری `runtime` پشتیبانی می‌کند تا سیم‌کشی زمان اجرای هنگام راه‌اندازی سبک و صریح بماند.

<AccordionGroup>
  <Accordion title="چه زمانی OpenClaw به‌جای ورودی کامل از setupEntry استفاده می‌کند">
    - کانال غیرفعال است اما به سطوح راه‌اندازی/onboarding نیاز دارد.
    - کانال فعال است اما پیکربندی نشده است.
    - بارگذاری معوق فعال است (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry چه چیزی را باید ثبت کند">
    - شیء Plugin کانال (از طریق `defineSetupPluginEntry`).
    - هر مسیر HTTP که پیش از گوش‌دادن Gateway لازم است.
    - هر متد Gateway که هنگام startup لازم است.

    آن متدهای Gateway هنگام startup همچنان باید از namespaceهای رزرو‌شده مدیریت core مانند `config.*` یا `update.*` پرهیز کنند.

  </Accordion>
  <Accordion title="setupEntry چه چیزی را نباید شامل شود">
    - ثبت‌های CLI.
    - سرویس‌های پس‌زمینه.
    - importهای سنگین زمان اجرا (رمزنگاری، SDKها).
    - متدهای Gateway که فقط پس از startup لازم هستند.

  </Accordion>
</AccordionGroup>

### importهای محدود helper راه‌اندازی

برای مسیرهای داغ فقط-راه‌اندازی، وقتی فقط به بخشی از سطح راه‌اندازی نیاز دارید، seamهای محدود helper راه‌اندازی را به umbrella گسترده‌تر `plugin-sdk/setup` ترجیح دهید:

| مسیر import                        | کاربرد                                                                                | خروجی‌های کلیدی                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helperهای زمان اجرای هنگام راه‌اندازی که در `setupEntry` / startup معوق کانال در دسترس می‌مانند | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/setup-runtime` استفاده کنید                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helperهای setup/install CLI/archive/docs                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

وقتی جعبه‌ابزار کامل راه‌اندازی مشترک را می‌خواهید، از جمله helperهای وصله پیکربندی مانند `moveSingleAccountChannelSectionToDefaultAccount(...)`، از seam گسترده‌تر `plugin-sdk/setup` استفاده کنید.

برای متن ثابت wizard راه‌اندازی از `createSetupTranslator(...)` استفاده کنید. این تابع از locale ویزارد
CLI (`OPENCLAW_LOCALE`، سپس متغیرهای locale سیستم) پیروی می‌کند و به انگلیسی
fallback می‌کند. متن راه‌اندازی مخصوص Plugin را در کد تحت مالکیت Plugin نگه دارید و از
کلیدهای catalog مشترک فقط برای برچسب‌های رایج راه‌اندازی، متن وضعیت، و متن راه‌اندازی
Pluginهای official bundled استفاده کنید.

adapterهای وصله راه‌اندازی هنگام import برای hot-path امن می‌مانند. lookup سطح-قرارداد promotion تک‌حساب bundled آن‌ها lazy است، بنابراین import کردن `plugin-sdk/setup-runtime` پیش از استفاده واقعی adapter، کشف سطح-قرارداد bundled را مشتاقانه بارگذاری نمی‌کند.

### promotion تک‌حساب تحت مالکیت کانال

وقتی یک کانال از پیکربندی سطح‌بالای تک‌حساب به `channels.<id>.accounts.*` ارتقا پیدا می‌کند، رفتار مشترک پیش‌فرض این است که مقادیر promotion‌یافته با scope حساب را به `accounts.default` منتقل کند.

کانال‌های bundled می‌توانند این promotion را از طریق سطح قرارداد راه‌اندازی خود محدود یا بازنویسی کنند:

- `singleAccountKeysToMove`: کلیدهای سطح‌بالای اضافی که باید به حساب promotion‌یافته منتقل شوند
- `namedAccountPromotionKeys`: وقتی حساب‌های نام‌دار از قبل وجود دارند، فقط این کلیدها به حساب promotion‌یافته منتقل می‌شوند؛ کلیدهای policy/delivery مشترک در ریشه کانال باقی می‌مانند
- `resolveSingleAccountPromotionTarget(...)`: انتخاب می‌کند کدام حساب موجود مقادیر promotion‌یافته را دریافت کند

<Note>
Matrix نمونه bundled فعلی است. اگر دقیقاً یک حساب نام‌دار Matrix از قبل وجود داشته باشد، یا اگر `defaultAccount` به کلیدی غیرکانونی موجود مانند `Ops` اشاره کند، promotion به‌جای ساختن ورودی جدید `accounts.default`، همان حساب را حفظ می‌کند.
</Note>

## schema پیکربندی

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

برای پیکربندی مخصوص کانال، به‌جای آن از بخش پیکربندی کانال استفاده کنید:

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

### ساخت schemaهای پیکربندی کانال

از `buildChannelConfigSchema` برای تبدیل یک schema از Zod به wrapper با نام `ChannelConfigSchema` استفاده کنید که artifactهای پیکربندی تحت مالکیت Plugin از آن استفاده می‌کنند:

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

اگر قرارداد را از قبل به‌صورت JSON Schema یا TypeBox می‌نویسید، از helper مستقیم استفاده کنید تا OpenClaw بتواند در مسیرهای metadata از تبدیل Zod به JSON-Schema صرف‌نظر کند:

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

برای Pluginهای شخص ثالث، قرارداد cold-path همچنان manifest Plugin است: JSON Schema تولیدشده را در `openclaw.plugin.json#channelConfigs` mirror کنید تا schema پیکربندی، راه‌اندازی، و سطوح UI بتوانند `channels.<id>` را بدون بارگذاری کد زمان اجرا بازرسی کنند.

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

نوع `ChannelSetupWizard` از `credentials`، `textInputs`، `dmPolicy`، `allowFrom`، `groupAccess`، `prepare`، `finalize` و موارد بیشتر پشتیبانی می‌کند. برای نمونه‌های کامل، بسته‌های Plugin bundled را ببینید (برای مثال Plugin مربوط به Discord با فایل `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="promptهای allowFrom مشترک">
    برای promptهای allowlist پیام مستقیم که فقط به جریان استاندارد `note -> prompt -> parse -> merge -> patch` نیاز دارند، helperهای راه‌اندازی مشترک از `openclaw/plugin-sdk/setup` را ترجیح دهید: `createPromptParsedAllowFromForAccount(...)`، `createTopLevelChannelParsedAllowFromPrompt(...)`، و `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="وضعیت استاندارد راه‌اندازی کانال">
    برای بلوک‌های وضعیت راه‌اندازی کانال که فقط در برچسب‌ها، امتیازها، و خطوط اضافی اختیاری تفاوت دارند، به‌جای ساخت دستی همان شیء `status` در هر Plugin، `createStandardChannelSetupStatus(...)` از `openclaw/plugin-sdk/setup` را ترجیح دهید.
  </Accordion>
  <Accordion title="سطح راه‌اندازی اختیاری کانال">
    برای سطوح راه‌اندازی اختیاری که فقط باید در contextهای خاصی ظاهر شوند، از `createOptionalChannelSetupSurface` در `openclaw/plugin-sdk/channel-setup` استفاده کنید:

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

    `plugin-sdk/channel-setup` همچنین builderهای سطح‌پایین‌تر `createOptionalChannelSetupAdapter(...)` و `createOptionalChannelSetupWizard(...)` را وقتی فقط به نیمی از آن سطح optional-install نیاز دارید، در معرض استفاده می‌گذارد.

    adapter/wizard اختیاری تولیدشده در writeهای واقعی پیکربندی به‌صورت fail closed عمل می‌کنند. آن‌ها یک پیام install-required را در `validateInput`، `applyAccountConfig` و `finalize` بازاستفاده می‌کنند، و وقتی `docsPath` تنظیم شده باشد یک لینک docs اضافه می‌کنند.

  </Accordion>
  <Accordion title="helperهای راه‌اندازی مبتنی بر binary">
    برای UIهای راه‌اندازی مبتنی بر binary، به‌جای کپی‌کردن همان glue مربوط به binary/status در هر کانال، helperهای delegated مشترک را ترجیح دهید:

    - `createDetectedBinaryStatus(...)` برای بلوک‌های وضعیت که فقط بر اساس برچسب‌ها، hintها، امتیازها، و تشخیص binary تفاوت دارند
    - `createCliPathTextInput(...)` برای text inputهای مبتنی بر مسیر
    - `createDelegatedSetupWizardStatusResolvers(...)`، `createDelegatedPrepare(...)`، `createDelegatedFinalize(...)`، و `createDelegatedResolveConfigured(...)` وقتی `setupEntry` باید به‌صورت lazy به wizard کامل سنگین‌تری forward کند
    - `createDelegatedTextInputShouldPrompt(...)` وقتی `setupEntry` فقط باید تصمیم `textInputs[*].shouldPrompt` را delegate کند

  </Accordion>
</AccordionGroup>

## انتشار و نصب

**Pluginهای خارجی:** در [ClawHub](/fa/clawhub) منتشر کنید، سپس نصب کنید:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    مشخصات بستهٔ ساده در زمان انتقال راه‌اندازی از npm نصب می‌شوند.

  </Tab>
  <Tab title="فقط ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مشخصات بستهٔ npm">
    وقتی بسته‌ای هنوز به ClawHub منتقل نشده است، یا وقتی در طول مهاجرت به مسیر
    نصب مستقیم npm نیاز دارید، از npm استفاده کنید:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginهای داخل مخزن:** آن‌ها را زیر درخت فضای کاری Pluginهای همراه قرار دهید تا هنگام ساخت به‌صورت خودکار شناسایی شوند.

**کاربران می‌توانند نصب کنند:**

```bash
openclaw plugins install <package-name>
```

<Info>
برای نصب‌هایی که از npm می‌آیند، `openclaw plugins install` بسته را در پروژه‌ای مختص هر Plugin زیر `~/.openclaw/npm/projects` با اسکریپت‌های چرخهٔ عمر غیرفعال نصب می‌کند. درخت‌های وابستگی Plugin را JS/TS خالص نگه دارید و از بسته‌هایی که به ساخت‌های `postinstall` نیاز دارند پرهیز کنید.
</Info>

<Note>
راه‌اندازی Gateway وابستگی‌های Plugin را نصب نمی‌کند. جریان‌های نصب npm/git/ClawHub همگرایی وابستگی‌ها را بر عهده دارند؛ Pluginهای محلی باید از قبل وابستگی‌هایشان نصب شده باشد.
</Note>

فرادادهٔ بسته‌های همراه صریح است و در زمان راه‌اندازی gateway از JavaScript ساخته‌شده استنباط نمی‌شود. وابستگی‌های زمان اجرا در بستهٔ Pluginای قرار می‌گیرند که مالک آن‌هاست؛ راه‌اندازی OpenClaw بسته‌بندی‌شده هرگز وابستگی‌های Plugin را تعمیر یا آینه‌سازی نمی‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — راهنمای گام‌به‌گام شروع کار
- [مانیفست Plugin](/fa/plugins/manifest) — مرجع کامل طرح‌وارهٔ مانیفست
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
