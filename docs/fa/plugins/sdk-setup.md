---
read_when:
    - شما در حال افزودن یک جادوگر راه‌اندازی به یک Plugin هستید.
    - باید تفاوت setup-entry.ts و index.ts را درک کنید
    - شما در حال تعریف طرح‌واره‌های پیکربندی Plugin یا فرادادهٔ openclaw در package.json هستید
sidebarTitle: Setup and config
summary: جادوگرهای راه‌اندازی، setup-entry.ts، طرح‌واره‌های config، و فرادادهٔ package.json
title: راه‌اندازی و پیکربندی Plugin
x-i18n:
    generated_at: "2026-07-04T15:28:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع بسته‌بندی Plugin (فراداده `package.json`)، مانیفست‌ها (`openclaw.plugin.json`)، ورودی‌های راه‌اندازی، و شِماهای پیکربندی.

<Tip>
**دنبال راهنمای گام‌به‌گام هستید؟** راهنماهای کاربردی، بسته‌بندی را در بافت خودش پوشش می‌دهند: [Pluginهای کانال](/fa/plugins/sdk-channel-plugins#step-1-package-and-manifest) و [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## فراداده بسته

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
اگر Plugin را به‌صورت خارجی روی ClawHub منتشر می‌کنید، آن فیلدهای `compat` و `build` الزامی هستند. قطعه‌کدهای انتشار مرجع در `docs/snippets/plugin-publish/` قرار دارند.
</Note>

### فیلدهای `openclaw`

<ParamField path="extensions" type="string[]">
  فایل‌های نقطه ورود (نسبت به ریشه بسته).
</ParamField>
<ParamField path="setupEntry" type="string">
  ورودی سبک‌وزن فقط برای راه‌اندازی (اختیاری).
</ParamField>
<ParamField path="channel" type="object">
  فراداده کاتالوگ کانال برای راه‌اندازی، انتخاب‌گر، شروع سریع، و سطوح وضعیت.
</ParamField>
<ParamField path="providers" type="string[]">
  شناسه‌های ارائه‌دهنده که توسط این Plugin ثبت شده‌اند.
</ParamField>
<ParamField path="install" type="object">
  راهنمایی‌های نصب: `npmSpec`، `localPath`، `defaultChoice`، `minHostVersion`، `expectedIntegrity`، `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  پرچم‌های رفتار راه‌اندازی.
</ParamField>

### `openclaw.channel`

`openclaw.channel` فراداده بسته سبک برای کشف کانال و سطوح راه‌اندازی پیش از بارگذاری runtime است.

| فیلد                                   | نوع        | معنای آن                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | شناسه کانال مرجع.                                                             |
| `label`                                | `string`   | برچسب اصلی کانال.                                                             |
| `selectionLabel`                       | `string`   | برچسب انتخاب‌گر/راه‌اندازی وقتی باید با `label` متفاوت باشد.                  |
| `detailLabel`                          | `string`   | برچسب جزئیات ثانویه برای کاتالوگ‌های غنی‌تر کانال و سطوح وضعیت.              |
| `docsPath`                             | `string`   | مسیر مستندات برای پیوندهای راه‌اندازی و انتخاب.                              |
| `docsLabel`                            | `string`   | برچسب جایگزین برای پیوندهای مستندات وقتی باید با شناسه کانال متفاوت باشد.    |
| `blurb`                                | `string`   | توضیح کوتاه برای onboarding/کاتالوگ.                                          |
| `order`                                | `number`   | ترتیب مرتب‌سازی در کاتالوگ‌های کانال.                                         |
| `aliases`                              | `string[]` | نام‌های مستعار اضافی برای جست‌وجوی انتخاب کانال.                              |
| `preferOver`                           | `string[]` | شناسه‌های Plugin/کانال با اولویت پایین‌تر که این کانال باید از آن‌ها جلوتر باشد. |
| `systemImage`                          | `string`   | نام اختیاری آیکن/تصویر سیستمی برای کاتالوگ‌های UI کانال.                     |
| `selectionDocsPrefix`                  | `string`   | متن پیشوند پیش از پیوندهای مستندات در سطوح انتخاب.                           |
| `selectionDocsOmitLabel`               | `boolean`  | نمایش مستقیم مسیر مستندات به‌جای پیوند مستندات برچسب‌دار در متن انتخاب.      |
| `selectionExtras`                      | `string[]` | رشته‌های کوتاه اضافی که به متن انتخاب افزوده می‌شوند.                         |
| `markdownCapable`                      | `boolean`  | کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان سازگار با Markdown علامت‌گذاری می‌کند. |
| `exposure`                             | `object`   | کنترل‌های دیده‌شدن کانال برای راه‌اندازی، فهرست‌های پیکربندی‌شده، و سطوح مستندات. |
| `quickstartAllowFrom`                  | `boolean`  | این کانال را وارد جریان استاندارد راه‌اندازی شروع سریع `allowFrom` می‌کند.   |
| `forceAccountBinding`                  | `boolean`  | حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند.             |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | هنگام resolve کردن هدف‌های announce برای این کانال، جست‌وجوی نشست را ترجیح می‌دهد. |

نمونه:

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

- `configured`: کانال را در سطوح فهرست‌سازی پیکربندی‌شده/سبک وضعیت وارد کن
- `setup`: کانال را در انتخاب‌گرهای راه‌اندازی/پیکربندی تعاملی وارد کن
- `docs`: کانال را در سطوح مستندات/ناوبری به‌عنوان عمومی علامت‌گذاری کن

<Note>
`showConfigured` و `showInSetup` همچنان به‌عنوان نام‌های مستعار قدیمی پشتیبانی می‌شوند. `exposure` را ترجیح دهید.
</Note>

### `openclaw.install`

`openclaw.install` فراداده بسته است، نه فراداده مانیفست.

| فیلد                         | نوع                                 | معنای آن                                                                        |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مشخصه مرجع ClawHub برای نصب/به‌روزرسانی و جریان‌های نصب هنگام نیاز در onboarding. |
| `npmSpec`                    | `string`                            | مشخصه مرجع npm برای جریان‌های fallback نصب/به‌روزرسانی.                         |
| `localPath`                  | `string`                            | مسیر نصب محلی توسعه یا بسته‌شده.                                                |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | منبع نصب ترجیحی وقتی چند منبع در دسترس است.                                     |
| `minHostVersion`             | `string`                            | حداقل نسخه پشتیبانی‌شده OpenClaw به‌شکل `>=x.y.z` یا `>=x.y.z-prerelease`.       |
| `expectedIntegrity`          | `string`                            | رشته integrity مورد انتظار npm dist، معمولا `sha512-...`، برای نصب‌های pinned.  |
| `allowInvalidConfigRecovery` | `boolean`                           | به جریان‌های نصب دوباره Plugin بسته‌شده اجازه می‌دهد از خرابی‌های خاص پیکربندی کهنه بازیابی کنند. |
| `requiredPlatformPackages`   | `string[]`                          | aliasهای npm مخصوص پلتفرمِ الزامی که هنگام نصب npm راستی‌آزمایی می‌شوند.        |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    onboarding تعاملی نیز از `openclaw.install` برای سطوح نصب هنگام نیاز استفاده می‌کند. اگر Plugin شما گزینه‌های احراز هویت ارائه‌دهنده یا فراداده راه‌اندازی/کاتالوگ کانال را پیش از بارگذاری runtime آشکار کند، onboarding می‌تواند آن گزینه را نشان دهد، برای نصب از ClawHub، npm، یا local درخواست کند، Plugin را نصب یا فعال کند، سپس جریان انتخاب‌شده را ادامه دهد. گزینه‌های onboarding در ClawHub از `clawhubSpec` استفاده می‌کنند و در صورت وجود ترجیح داده می‌شوند؛ گزینه‌های npm به فراداده کاتالوگ مورد اعتماد با `npmSpec` رجیستری نیاز دارند؛ نسخه‌های دقیق و `expectedIntegrity` پین‌های اختیاری npm هستند. اگر `expectedIntegrity` وجود داشته باشد، جریان‌های نصب/به‌روزرسانی آن را برای npm enforce می‌کنند. فراداده «چه چیزی نشان داده شود» را در `openclaw.plugin.json` و فراداده «چگونه نصب شود» را در `package.json` نگه دارید.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    اگر `minHostVersion` تنظیم شده باشد، هم نصب و هم بارگذاری رجیستری مانیفستِ غیربسته‌شده آن را enforce می‌کنند. میزبان‌های قدیمی‌تر Pluginهای خارجی را رد می‌کنند؛ رشته‌های نسخه نامعتبر پذیرفته نمی‌شوند. فرض می‌شود Pluginهای منبع بسته‌شده با checkout میزبان هم‌نسخه هستند.
  </Accordion>
  <Accordion title="Pinned npm installs">
    برای نصب‌های pinned npm، نسخه دقیق را در `npmSpec` نگه دارید و integrity آرتیفکت مورد انتظار را اضافه کنید:

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
    `allowInvalidConfigRecovery` گذرگاه عمومی برای پیکربندی‌های خراب نیست. فقط برای بازیابی محدود Pluginهای بسته‌شده است، تا نصب دوباره/راه‌اندازی بتواند بازمانده‌های شناخته‌شده ارتقا مانند مسیر Plugin بسته‌شده گم‌شده یا ورودی کهنه `channels.<id>` برای همان Plugin را ترمیم کند. اگر پیکربندی به دلایل نامرتبط خراب باشد، نصب همچنان به‌صورت fail-closed شکست می‌خورد و به اپراتور می‌گوید `openclaw doctor --fix` را اجرا کند.
  </Accordion>
</AccordionGroup>

### بارگذاری کاملِ به‌تعویق‌افتاده

Pluginهای کانال می‌توانند با این مورد، بارگذاری به‌تعویق‌افتاده را فعال کنند:

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

وقتی فعال باشد، OpenClaw در مرحله راه‌اندازی پیش از listen فقط `setupEntry` را بارگذاری می‌کند، حتی برای کانال‌هایی که از قبل پیکربندی شده‌اند. ورودی کامل پس از شروع listen کردن Gateway بارگذاری می‌شود.

<Warning>
بارگذاری به‌تعویق‌افتاده را فقط وقتی فعال کنید که `setupEntry` شما هر چیزی را که Gateway پیش از شروع listen نیاز دارد ثبت کند (ثبت کانال، مسیرهای HTTP، متدهای Gateway). اگر ورودی کامل مالک capabilityهای الزامی راه‌اندازی است، رفتار پیش‌فرض را نگه دارید.
</Warning>

اگر ورودی setup/full شما متدهای RPC در Gateway ثبت می‌کند، آن‌ها را روی یک پیشوند مخصوص Plugin نگه دارید. namespaceهای رزروشده مدیریت هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) در مالکیت هسته می‌مانند و همیشه به `operator.admin` resolve می‌شوند.

## مانیفست Plugin

هر Plugin بومی باید یک `openclaw.plugin.json` در ریشه بسته داشته باشد. OpenClaw از این برای اعتبارسنجی پیکربندی بدون اجرای کد Plugin استفاده می‌کند.

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

حتی Pluginهایی که هیچ پیکربندی‌ای ندارند نیز باید یک طرحواره ارائه کنند. یک طرحواره خالی معتبر است:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

برای مرجع کامل طرحواره، [مانیفست Plugin](/fa/plugins/manifest) را ببینید.

## انتشار ClawHub

برای بسته‌های Plugin، از فرمان اختصاصی ClawHub برای بسته استفاده کنید:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
نام مستعار قدیمی انتشار فقط برای Skills است. بسته‌های Plugin همیشه باید از `clawhub package publish` استفاده کنند.
</Note>

## نقطه ورود راه‌اندازی

فایل `setup-entry.ts` جایگزینی سبک برای `index.ts` است که OpenClaw زمانی آن را بارگذاری می‌کند که فقط به سطح‌های راه‌اندازی نیاز دارد (آنبوردینگ، ترمیم پیکربندی، بازرسی کانال غیرفعال).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

این کار از بارگذاری کد سنگین زمان اجرا (کتابخانه‌های رمزنگاری، ثبت‌نام‌های CLI، سرویس‌های پس‌زمینه) در جریان‌های راه‌اندازی جلوگیری می‌کند.

کانال‌های workspace همراه که خروجی‌های ایمن برای راه‌اندازی را در ماژول‌های کناری نگه می‌دارند، می‌توانند به‌جای `defineSetupPluginEntry(...)` از `defineBundledChannelSetupEntry(...)` از `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن قرارداد همراه همچنین از یک خروجی اختیاری `runtime` پشتیبانی می‌کند تا سیم‌کشی زمان اجرای مربوط به زمان راه‌اندازی سبک و صریح باقی بماند.

<AccordionGroup>
  <Accordion title="زمانی که OpenClaw به‌جای ورودی کامل از setupEntry استفاده می‌کند">
    - کانال غیرفعال است اما به سطح‌های راه‌اندازی/آنبوردینگ نیاز دارد.
    - کانال فعال است اما پیکربندی نشده است.
    - بارگذاری به‌تعویق‌افتاده فعال است (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="چیزی که setupEntry باید ثبت کند">
    - شیء Plugin کانال (از طریق `defineSetupPluginEntry`).
    - هر مسیر HTTP که پیش از گوش‌دادن Gateway لازم است.
    - هر متد Gateway که هنگام شروع لازم است.

    آن متدهای Gateway هنگام شروع همچنان باید از namespaceهای رزروشده ادمین هسته مانند `config.*` یا `update.*` اجتناب کنند.

  </Accordion>
  <Accordion title="چیزی که setupEntry نباید شامل شود">
    - ثبت‌نام‌های CLI.
    - سرویس‌های پس‌زمینه.
    - importهای سنگین زمان اجرا (رمزنگاری، SDKها).
    - متدهای Gateway که فقط پس از شروع لازم‌اند.

  </Accordion>
</AccordionGroup>

### importهای محدود برای کمک‌گرهای راه‌اندازی

برای مسیرهای داغی که فقط مخصوص راه‌اندازی هستند، وقتی فقط به بخشی از سطح راه‌اندازی نیاز دارید، seamهای محدود کمک‌گر راه‌اندازی را بر چتر گسترده‌تر `plugin-sdk/setup` ترجیح دهید:

| مسیر import                        | کاربرد                                                                                | خروجی‌های کلیدی                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | کمک‌گرهای زمان اجرای زمان راه‌اندازی که در `setupEntry` / شروع کانال به‌تعویق‌افتاده در دسترس می‌مانند | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/setup-runtime` استفاده کنید                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | کمک‌گرهای راه‌اندازی/نصب CLI/آرشیو/مستندات                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

وقتی جعبه‌ابزار کامل راه‌اندازی مشترک را می‌خواهید، از جمله کمک‌گرهای وصله پیکربندی مانند `moveSingleAccountChannelSectionToDefaultAccount(...)`، از seam گسترده‌تر `plugin-sdk/setup` استفاده کنید.

برای متن ثابت ویزارد راه‌اندازی از `createSetupTranslator(...)` استفاده کنید. این تابع از locale ویزارد
CLI (`OPENCLAW_LOCALE`، سپس متغیرهای locale سیستم) پیروی می‌کند و به
انگلیسی برمی‌گردد. متن راه‌اندازی اختصاصی Plugin را در کد متعلق به Plugin نگه دارید و
کلیدهای کاتالوگ مشترک را فقط برای برچسب‌های رایج راه‌اندازی، متن وضعیت، و متن راه‌اندازی
Pluginهای رسمی همراه استفاده کنید.

آداپتورهای وصله راه‌اندازی هنگام import برای مسیر داغ ایمن می‌مانند. جست‌وجوی سطح قرارداد ارتقای تک‌حسابه همراه آن‌ها lazy است، بنابراین import کردن `plugin-sdk/setup-runtime` پیش از استفاده واقعی از آداپتور، کشف سطح قرارداد همراه را به‌صورت eager بارگذاری نمی‌کند.

### ارتقای تک‌حسابه متعلق به کانال

وقتی یک کانال از پیکربندی سطح بالای تک‌حسابه به `channels.<id>.accounts.*` ارتقا می‌یابد، رفتار مشترک پیش‌فرض این است که مقادیر account-scoped ارتقایافته را به `accounts.default` منتقل کند.

کانال‌های همراه می‌توانند آن ارتقا را از طریق سطح قرارداد راه‌اندازی خود محدود یا بازنویسی کنند:

- `singleAccountKeysToMove`: کلیدهای سطح بالای اضافی که باید به حساب ارتقایافته منتقل شوند
- `namedAccountPromotionKeys`: وقتی حساب‌های نام‌دار از قبل وجود دارند، فقط این کلیدها به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای policy/delivery مشترک در ریشه کانال می‌مانند
- `resolveSingleAccountPromotionTarget(...)`: انتخاب کنید کدام حساب موجود مقادیر ارتقایافته را دریافت کند

<Note>
Matrix نمونه همراه فعلی است. اگر دقیقاً یک حساب Matrix نام‌دار از قبل وجود داشته باشد، یا اگر `defaultAccount` به یک کلید موجود غیرکانونی مانند `Ops` اشاره کند، ارتقا همان حساب را حفظ می‌کند به‌جای اینکه یک ورودی جدید `accounts.default` بسازد.
</Note>

## طرحواره پیکربندی

پیکربندی Plugin در برابر JSON Schema موجود در مانیفست شما اعتبارسنجی می‌شود. کاربران Pluginها را از این طریق پیکربندی می‌کنند:

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

Plugin شما این پیکربندی را هنگام ثبت‌نام به‌صورت `api.pluginConfig` دریافت می‌کند.

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

### ساخت طرحواره‌های پیکربندی کانال

از `buildChannelConfigSchema` برای تبدیل یک طرحواره Zod به wrapper به نام `ChannelConfigSchema` استفاده کنید که توسط artifactهای پیکربندی متعلق به Plugin استفاده می‌شود:

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

اگر قرارداد را از قبل به‌صورت JSON Schema یا TypeBox می‌نویسید، از کمک‌گر مستقیم استفاده کنید تا OpenClaw بتواند در مسیرهای metadata از تبدیل Zod به JSON-Schema صرف‌نظر کند:

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

برای Pluginهای شخص ثالث، قرارداد مسیر سرد همچنان مانیفست Plugin است: JSON Schema تولیدشده را در `openclaw.plugin.json#channelConfigs` mirror کنید تا طرحواره پیکربندی، راه‌اندازی، و سطح‌های UI بتوانند `channels.<id>` را بدون بارگذاری کد زمان اجرا بازرسی کنند.

## ویزاردهای راه‌اندازی

Pluginهای کانال می‌توانند برای `openclaw onboard` ویزاردهای راه‌اندازی تعاملی ارائه کنند. ویزارد یک شیء `ChannelSetupWizard` روی `ChannelPlugin` است:

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

نوع `ChannelSetupWizard` از `credentials`، `textInputs`، `dmPolicy`، `allowFrom`، `groupAccess`، `prepare`، `finalize` و موارد بیشتر پشتیبانی می‌کند. برای نمونه‌های کامل، بسته‌های Plugin همراه را ببینید (برای مثال Plugin مربوط به Discord در `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="promptهای allowFrom مشترک">
    برای promptهای allowlist پیام مستقیم که فقط به جریان استاندارد `note -> prompt -> parse -> merge -> patch` نیاز دارند، کمک‌گرهای راه‌اندازی مشترک از `openclaw/plugin-sdk/setup` را ترجیح دهید: `createPromptParsedAllowFromForAccount(...)`، `createTopLevelChannelParsedAllowFromPrompt(...)`، و `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="وضعیت استاندارد راه‌اندازی کانال">
    برای بلوک‌های وضعیت راه‌اندازی کانال که فقط از نظر برچسب‌ها، امتیازها، و خط‌های اضافی اختیاری متفاوت‌اند، به‌جای ساخت دستی همان شیء `status` در هر Plugin، `createStandardChannelSetupStatus(...)` از `openclaw/plugin-sdk/setup` را ترجیح دهید.
  </Accordion>
  <Accordion title="سطح اختیاری راه‌اندازی کانال">
    برای سطح‌های راه‌اندازی اختیاری که باید فقط در contextهای خاصی ظاهر شوند، از `createOptionalChannelSetupSurface` از `openclaw/plugin-sdk/channel-setup` استفاده کنید:

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

    `plugin-sdk/channel-setup` همچنین سازنده‌های سطح پایین‌تر `createOptionalChannelSetupAdapter(...)` و `createOptionalChannelSetupWizard(...)` را زمانی که فقط به یکی از دو نیمه آن سطح نصب اختیاری نیاز دارید، ارائه می‌کند.

    آداپتور/ویزارد اختیاری تولیدشده در نوشتن‌های واقعی پیکربندی fail closed می‌شود. آن‌ها در `validateInput`، `applyAccountConfig`، و `finalize` از یک پیام واحد نیازمند نصب استفاده می‌کنند و وقتی `docsPath` تنظیم شده باشد، یک پیوند مستندات اضافه می‌کنند.

  </Accordion>
  <Accordion title="کمک‌گرهای راه‌اندازی پشتیبانی‌شده با باینری">
    برای UIهای راه‌اندازی پشتیبانی‌شده با باینری، به‌جای کپی‌کردن همان glue باینری/وضعیت در هر کانال، کمک‌گرهای delegated مشترک را ترجیح دهید:

    - `createDetectedBinaryStatus(...)` برای بلوک‌های وضعیت که فقط از نظر برچسب‌ها، راهنماها، امتیازها، و تشخیص باینری متفاوت هستند
    - `createCliPathTextInput(...)` برای ورودی‌های متنی مبتنی بر مسیر
    - `createDelegatedSetupWizardStatusResolvers(...)`، `createDelegatedPrepare(...)`، `createDelegatedFinalize(...)`، و `createDelegatedResolveConfigured(...)` زمانی که `setupEntry` باید به‌صورت در زمان نیاز به یک جادوگر کامل سنگین‌تر واگذار شود
    - `createDelegatedTextInputShouldPrompt(...)` زمانی که `setupEntry` فقط باید تصمیم `textInputs[*].shouldPrompt` را واگذار کند

  </Accordion>
</AccordionGroup>

## انتشار و نصب

**Pluginهای خارجی:** در [ClawHub](/clawhub) منتشر کنید، سپس نصب کنید:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    مشخصات بستهٔ بدون پیشوند در زمان گذار راه‌اندازی از npm نصب می‌شوند.

  </Tab>
  <Tab title="فقط ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مشخصات بستهٔ npm">
    وقتی بسته‌ای هنوز به ClawHub منتقل نشده است، یا وقتی در زمان مهاجرت به
    مسیر نصب مستقیم npm نیاز دارید، از npm استفاده کنید:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginهای داخل مخزن:** آن‌ها را زیر درخت فضای کاری Pluginهای بسته‌بندی‌شده قرار دهید تا در زمان ساخت به‌صورت خودکار کشف شوند.

**کاربران می‌توانند نصب کنند:**

```bash
openclaw plugins install <package-name>
```

<Info>
برای نصب‌های تأمین‌شده از npm، `openclaw plugins install` بسته را با اسکریپت‌های چرخهٔ عمر غیرفعال، در یک پروژهٔ جداگانه برای هر Plugin زیر `~/.openclaw/npm/projects` نصب می‌کند. درخت‌های وابستگی Plugin را JS/TS خالص نگه دارید و از بسته‌هایی که به ساخت‌های `postinstall` نیاز دارند پرهیز کنید.
</Info>

<Note>
راه‌اندازی Gateway وابستگی‌های Plugin را نصب نمی‌کند. جریان‌های نصب npm/git/ClawHub مسئول همگرایی وابستگی‌ها هستند؛ Pluginهای محلی باید از قبل وابستگی‌های خود را نصب کرده باشند.
</Note>

فرادادهٔ بستهٔ باندل‌شده صریح است و در زمان راه‌اندازی Gateway از JavaScript ساخته‌شده استنتاج نمی‌شود. وابستگی‌های زمان اجرا به بستهٔ Pluginی تعلق دارند که مالک آن‌هاست؛ راه‌اندازی OpenClaw بسته‌بندی‌شده هرگز وابستگی‌های Plugin را تعمیر یا بازتاب نمی‌دهد.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — راهنمای شروع گام‌به‌گام
- [مانیفست Plugin](/fa/plugins/manifest) — مرجع کامل شِمای مانیفست
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
