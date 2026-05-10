---
read_when:
    - در حال افزودن یک جادوگر راه‌اندازی به یک Plugin هستید
    - باید تفاوت setup-entry.ts و index.ts را درک کنید
    - شما در حال تعریف طرح‌واره‌های پیکربندی Plugin یا فرادادهٔ openclaw در package.json هستید
sidebarTitle: Setup and config
summary: ویزاردهای راه‌اندازی، setup-entry.ts، طرح‌واره‌های پیکربندی، و فراداده‌های package.json
title: راه‌اندازی و پیکربندی Plugin
x-i18n:
    generated_at: "2026-05-10T19:59:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع بسته‌بندی Plugin (فراداده‌ی `package.json`)، manifestها (`openclaw.plugin.json`)، ورودی‌های راه‌اندازی، و schemaهای پیکربندی.

<Tip>
**دنبال یک راهنمای گام‌به‌گام هستید؟** راهنماهای عملی بسته‌بندی را در بافتار پوشش می‌دهند: [Pluginهای کانال](/fa/plugins/sdk-channel-plugins#step-1-package-and-manifest) و [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
اگر Plugin را به‌صورت خارجی در ClawHub منتشر می‌کنید، این فیلدهای `compat` و `build` الزامی هستند. قطعه‌کدهای رسمی انتشار در `docs/snippets/plugin-publish/` قرار دارند.
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
  شناسه‌های ارائه‌دهنده‌ای که این Plugin ثبت می‌کند.
</ParamField>
<ParamField path="install" type="object">
  راهنمایی‌های نصب: `npmSpec`، `localPath`، `defaultChoice`، `minHostVersion`، `expectedIntegrity`، `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  پرچم‌های رفتار راه‌اندازی.
</ParamField>

### `openclaw.channel`

`openclaw.channel` فراداده‌ی سبک بسته برای کشف کانال و سطوح راه‌اندازی، پیش از بارگذاری زمان اجرا است.

| فیلد                                  | نوع       | معنی آن                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | شناسه‌ی رسمی کانال.                                                         |
| `label`                                | `string`   | برچسب اصلی کانال.                                                        |
| `selectionLabel`                       | `string`   | برچسب انتخاب‌گر/راه‌اندازی وقتی باید با `label` متفاوت باشد.                        |
| `detailLabel`                          | `string`   | برچسب جزئیات ثانویه برای کاتالوگ‌های غنی‌تر کانال و سطوح وضعیت.       |
| `docsPath`                             | `string`   | مسیر مستندات برای پیوندهای راه‌اندازی و انتخاب.                                      |
| `docsLabel`                            | `string`   | بازنویسی برچسب استفاده‌شده برای پیوندهای مستندات وقتی باید با شناسه‌ی کانال متفاوت باشد. |
| `blurb`                                | `string`   | توضیح کوتاه برای onboarding/کاتالوگ.                                         |
| `order`                                | `number`   | ترتیب مرتب‌سازی در کاتالوگ‌های کانال.                                               |
| `aliases`                              | `string[]` | نام‌های مستعار اضافی برای جست‌وجوی انتخاب کانال.                                   |
| `preferOver`                           | `string[]` | شناسه‌های Plugin/کانال با اولویت پایین‌تر که این کانال باید بالاتر از آن‌ها رتبه بگیرد.                |
| `systemImage`                          | `string`   | نام اختیاری icon/system-image برای کاتالوگ‌های UI کانال.                      |
| `selectionDocsPrefix`                  | `string`   | متن پیشوند پیش از پیوندهای مستندات در سطوح انتخاب.                          |
| `selectionDocsOmitLabel`               | `boolean`  | در متن انتخاب، مسیر مستندات را مستقیماً به‌جای پیوند مستنداتِ دارای برچسب نشان بده. |
| `selectionExtras`                      | `string[]` | رشته‌های کوتاه اضافی که به متن انتخاب افزوده می‌شوند.                               |
| `markdownCapable`                      | `boolean`  | کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان پشتیبان Markdown علامت‌گذاری می‌کند.      |
| `exposure`                             | `object`   | کنترل‌های نمایانی کانال برای راه‌اندازی، فهرست‌های پیکربندی‌شده، و سطوح مستندات.   |
| `quickstartAllowFrom`                  | `boolean`  | این کانال را وارد جریان راه‌اندازی استاندارد شروع سریع `allowFrom` می‌کند.         |
| `forceAccountBinding`                  | `boolean`  | حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | هنگام resolve کردن هدف‌های اعلام برای این کانال، جست‌وجوی نشست را ترجیح می‌دهد.       |

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

- `configured`: کانال را در سطوح فهرست‌سازی به سبک پیکربندی‌شده/وضعیت درج کن
- `setup`: کانال را در انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی درج کن
- `docs`: کانال را در سطوح مستندات/ناوبری به‌عنوان عمومی علامت‌گذاری کن

<Note>
`showConfigured` و `showInSetup` همچنان به‌عنوان نام‌های مستعار قدیمی پشتیبانی می‌شوند. `exposure` را ترجیح دهید.
</Note>

### `openclaw.install`

`openclaw.install` فراداده‌ی بسته است، نه فراداده‌ی manifest.

| فیلد                        | نوع                                | معنی آن                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مشخصه‌ی رسمی ClawHub برای جریان‌های نصب/به‌روزرسانی و نصب هنگام نیاز در onboarding. |
| `npmSpec`                    | `string`                            | مشخصه‌ی رسمی npm برای جریان‌های جایگزین نصب/به‌روزرسانی.                             |
| `localPath`                  | `string`                            | مسیر توسعه‌ی محلی یا نصب همراه بسته.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | منبع نصب ترجیحی وقتی چند منبع در دسترس است.                     |
| `minHostVersion`             | `string`                            | حداقل نسخه‌ی پشتیبانی‌شده‌ی OpenClaw به شکل `>=x.y.z` یا `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | رشته‌ی یکپارچگی مورد انتظار dist مربوط به npm، معمولاً `sha512-...`، برای نصب‌های pin‌شده.    |
| `allowInvalidConfigRecovery` | `boolean`                           | به جریان‌های نصب دوباره‌ی Plugin همراه بسته اجازه می‌دهد از خطاهای خاص پیکربندی کهنه بازیابی شوند.  |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    onboarding تعاملی همچنین از `openclaw.install` برای سطوح نصب هنگام نیاز استفاده می‌کند. اگر Plugin شما گزینه‌های احراز هویت ارائه‌دهنده یا فراداده‌ی راه‌اندازی/کاتالوگ کانال را پیش از بارگذاری زمان اجرا در معرض نمایش قرار دهد، onboarding می‌تواند آن گزینه را نشان دهد، برای نصب از ClawHub، npm، یا local درخواست کند، Plugin را نصب یا فعال کند، سپس جریان انتخاب‌شده را ادامه دهد. گزینه‌های onboarding مربوط به ClawHub از `clawhubSpec` استفاده می‌کنند و در صورت وجود ترجیح داده می‌شوند؛ گزینه‌های npm به فراداده‌ی کاتالوگ قابل اعتماد با `npmSpec` رجیستری نیاز دارند؛ نسخه‌های دقیق و `expectedIntegrity` پین‌های اختیاری npm هستند. اگر `expectedIntegrity` وجود داشته باشد، جریان‌های نصب/به‌روزرسانی آن را برای npm اعمال می‌کنند. فراداده‌ی «چه چیزی نشان داده شود» را در `openclaw.plugin.json` و فراداده‌ی «چگونه نصب شود» را در `package.json` نگه دارید.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    اگر `minHostVersion` تنظیم شده باشد، هم نصب و هم بارگذاری registry مربوط به manifestهای غیرهمراه بسته آن را اعمال می‌کنند. میزبان‌های قدیمی‌تر از Pluginهای خارجی صرف‌نظر می‌کنند؛ رشته‌های نسخه‌ی نامعتبر رد می‌شوند. فرض می‌شود Pluginهای منبعِ همراه بسته با checkout میزبان هم‌نسخه هستند.
  </Accordion>
  <Accordion title="Pinned npm installs">
    برای نصب‌های pin‌شده‌ی npm، نسخه‌ی دقیق را در `npmSpec` نگه دارید و یکپارچگی artifact مورد انتظار را اضافه کنید:

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
    `allowInvalidConfigRecovery` یک دورزدن عمومی برای پیکربندی‌های خراب نیست. این فقط برای بازیابی محدود Plugin همراه بسته است، تا نصب دوباره/راه‌اندازی بتواند باقی‌مانده‌های شناخته‌شده‌ی ارتقا را تعمیر کند، مانند مسیر مفقود Plugin همراه بسته یا ورودی کهنه‌ی `channels.<id>` برای همان Plugin. اگر پیکربندی به دلایل نامرتبط خراب باشد، نصب همچنان بسته شکست می‌خورد و به اپراتور می‌گوید `openclaw doctor --fix` را اجرا کند.
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

وقتی فعال باشد، OpenClaw در مرحله‌ی راه‌اندازی پیش از listen، حتی برای کانال‌هایی که از قبل پیکربندی شده‌اند، فقط `setupEntry` را بارگذاری می‌کند. ورودی کامل پس از شروع listen توسط gateway بارگذاری می‌شود.

<Warning>
بارگذاری به‌تعویق‌افتاده را فقط وقتی فعال کنید که `setupEntry` شما هر چیزی را که gateway پیش از شروع listen نیاز دارد ثبت کند (ثبت کانال، routeهای HTTP، methodهای gateway). اگر ورودی کامل مالک capabilityهای مورد نیاز راه‌اندازی است، رفتار پیش‌فرض را نگه دارید.
</Warning>

اگر ورودی setup/full شما methodهای RPC مربوط به gateway را ثبت می‌کند، آن‌ها را روی پیشوند مخصوص Plugin نگه دارید. namespaceهای رزروشده‌ی مدیریت core (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) در مالکیت core می‌مانند و همیشه به `operator.admin` resolve می‌شوند.

## manifest مربوط به Plugin

هر Plugin بومی باید یک `openclaw.plugin.json` در ریشه‌ی بسته ارائه کند. OpenClaw از این برای اعتبارسنجی پیکربندی بدون اجرای کد Plugin استفاده می‌کند.

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

حتی Pluginهایی که هیچ پیکربندی‌ای ندارند باید یک schema ارائه کنند. schema خالی معتبر است:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

برای مرجع کامل schema، [manifest مربوط به Plugin](/fa/plugins/manifest) را ببینید.

## انتشار در ClawHub

برای بسته‌های Plugin، از دستور مخصوص بسته در ClawHub استفاده کنید:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
نام مستعار انتشار قدیمی که فقط مخصوص Skills است، برای Skills است. بسته‌های Plugin همیشه باید از `clawhub package publish` استفاده کنند.
</Note>

## ورودی راه‌اندازی

فایل `setup-entry.ts` جایگزینی سبک برای `index.ts` است که OpenClaw زمانی آن را بارگذاری می‌کند که فقط به سطح‌های راه‌اندازی نیاز دارد (آنبوردینگ، ترمیم پیکربندی، بررسی کانال غیرفعال).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

این کار از بارگذاری کدهای سنگین زمان اجرا (کتابخانه‌های رمزنگاری، ثبت‌های CLI، سرویس‌های پس‌زمینه) در جریان‌های راه‌اندازی جلوگیری می‌کند.

کانال‌های workspace همراه که exportهای امن برای راه‌اندازی را در ماژول‌های جانبی نگه می‌دارند، می‌توانند به‌جای `defineSetupPluginEntry(...)` از `defineBundledChannelSetupEntry(...)` در `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن قرارداد همراه همچنین از export اختیاری `runtime` پشتیبانی می‌کند تا سیم‌کشی زمان اجرای هنگام راه‌اندازی سبک و صریح بماند.

<AccordionGroup>
  <Accordion title="وقتی OpenClaw از setupEntry به‌جای ورودی کامل استفاده می‌کند">
    - کانال غیرفعال است اما به سطح‌های راه‌اندازی/آنبوردینگ نیاز دارد.
    - کانال فعال است اما پیکربندی نشده است.
    - بارگذاری تعویقی فعال است (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry باید چه چیزهایی را ثبت کند">
    - شیء Plugin کانال (از طریق `defineSetupPluginEntry`).
    - هر مسیر HTTP که پیش از گوش‌دادن Gateway لازم است.
    - هر متد Gateway که در زمان راه‌اندازی لازم است.

    آن متدهای Gateway هنگام راه‌اندازی همچنان باید از namespaceهای رزرو‌شده مدیریت هسته مانند `config.*` یا `update.*` پرهیز کنند.

  </Accordion>
  <Accordion title="setupEntry نباید شامل چه چیزهایی باشد">
    - ثبت‌های CLI.
    - سرویس‌های پس‌زمینه.
    - importهای سنگین زمان اجرا (رمزنگاری، SDKها).
    - متدهای Gateway که فقط پس از راه‌اندازی لازم‌اند.

  </Accordion>
</AccordionGroup>

### importهای کم‌دامنه کمکی راه‌اندازی

برای مسیرهای داغِ فقط راه‌اندازی، وقتی فقط به بخشی از سطح راه‌اندازی نیاز دارید، seamهای کم‌دامنه کمکی راه‌اندازی را به umbrella گسترده‌تر `plugin-sdk/setup` ترجیح دهید:

| مسیر import                        | کاربرد                                                                                | exportهای کلیدی                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | کمک‌کننده‌های زمان اجرای هنگام راه‌اندازی که در `setupEntry` / راه‌اندازی تعویقی کانال در دسترس می‌مانند | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/setup-runtime` استفاده کنید                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | کمک‌کننده‌های setup/install CLI/archive/docs                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

وقتی کل جعبه‌ابزار مشترک راه‌اندازی را می‌خواهید، از جمله کمک‌کننده‌های patch پیکربندی مانند `moveSingleAccountChannelSectionToDefaultAccount(...)`، از seam گسترده‌تر `plugin-sdk/setup` استفاده کنید.

آداپتورهای patch راه‌اندازی هنگام import برای مسیر داغ امن می‌مانند. جست‌وجوی سطح قرارداد ارتقای تک‌حسابه همراه آن‌ها lazy است، بنابراین import کردن `plugin-sdk/setup-runtime` پیش از اینکه آداپتور واقعاً استفاده شود، کشف سطح قرارداد همراه را مشتاقانه بارگذاری نمی‌کند.

### ارتقای تک‌حسابه تحت مالکیت کانال

وقتی کانالی از پیکربندی سطح بالای تک‌حسابه به `channels.<id>.accounts.*` ارتقا می‌یابد، رفتار مشترک پیش‌فرض این است که مقادیر account-scoped ارتقایافته را به `accounts.default` منتقل کند.

کانال‌های همراه می‌توانند این ارتقا را از طریق سطح قرارداد راه‌اندازی خود محدود یا بازنویسی کنند:

- `singleAccountKeysToMove`: کلیدهای سطح بالای اضافی که باید به حساب ارتقایافته منتقل شوند
- `namedAccountPromotionKeys`: وقتی حساب‌های نام‌دار از قبل وجود دارند، فقط این کلیدها به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای سیاست/تحویل مشترک در ریشه کانال می‌مانند
- `resolveSingleAccountPromotionTarget(...)`: انتخاب می‌کند کدام حساب موجود مقادیر ارتقایافته را دریافت کند

<Note>
Matrix نمونه همراه فعلی است. اگر دقیقاً یک حساب نام‌دار Matrix از قبل وجود داشته باشد، یا اگر `defaultAccount` به کلیدی غیر canonical موجود مانند `Ops` اشاره کند، ارتقا به‌جای ساخت ورودی جدید `accounts.default`، همان حساب را حفظ می‌کند.
</Note>

## طرح‌واره پیکربندی

پیکربندی Plugin در برابر JSON Schema موجود در manifest شما اعتبارسنجی می‌شود. کاربران Pluginها را از طریق این ساختار پیکربندی می‌کنند:

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

### ساختن طرح‌واره‌های پیکربندی کانال

از `buildChannelConfigSchema` برای تبدیل یک طرح‌واره Zod به wrapper `ChannelConfigSchema` استفاده کنید که artifactهای پیکربندی تحت مالکیت Plugin از آن استفاده می‌کنند:

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

اگر از قبل قرارداد را به‌صورت JSON Schema یا TypeBox می‌نویسید، از کمک‌کننده مستقیم استفاده کنید تا OpenClaw بتواند تبدیل Zod به JSON Schema را در مسیرهای metadata کنار بگذارد:

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

برای Pluginهای شخص ثالث، قرارداد مسیر سرد همچنان manifest Plugin است: JSON Schema تولیدشده را در `openclaw.plugin.json#channelConfigs` منعکس کنید تا طرح‌واره پیکربندی، راه‌اندازی، و سطح‌های UI بتوانند `channels.<id>` را بدون بارگذاری کد زمان اجرا بررسی کنند.

## ویزاردهای راه‌اندازی

Pluginهای کانال می‌توانند برای `openclaw onboard` ویزاردهای راه‌اندازی تعاملی فراهم کنند. ویزارد یک شیء `ChannelSetupWizard` روی `ChannelPlugin` است:

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
    برای promptهای فهرست مجاز DM که فقط به جریان استاندارد `note -> prompt -> parse -> merge -> patch` نیاز دارند، کمک‌کننده‌های راه‌اندازی مشترک از `openclaw/plugin-sdk/setup` را ترجیح دهید: `createPromptParsedAllowFromForAccount(...)`، `createTopLevelChannelParsedAllowFromPrompt(...)`، و `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="وضعیت استاندارد راه‌اندازی کانال">
    برای بلوک‌های وضعیت راه‌اندازی کانال که فقط در برچسب‌ها، امتیازها، و خط‌های اضافی اختیاری تفاوت دارند، به‌جای ساخت دستی همان شیء `status` در هر Plugin، `createStandardChannelSetupStatus(...)` را از `openclaw/plugin-sdk/setup` ترجیح دهید.
  </Accordion>
  <Accordion title="سطح اختیاری راه‌اندازی کانال">
    برای سطح‌های اختیاری راه‌اندازی که فقط باید در contextهای مشخصی ظاهر شوند، از `createOptionalChannelSetupSurface` در `openclaw/plugin-sdk/channel-setup` استفاده کنید:

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

    `plugin-sdk/channel-setup` همچنین builderهای سطح پایین‌تر `createOptionalChannelSetupAdapter(...)` و `createOptionalChannelSetupWizard(...)` را در دسترس می‌گذارد، وقتی فقط به یک نیمه از آن سطح نصب اختیاری نیاز دارید.

    آداپتور/ویزارد اختیاری تولیدشده در برابر نوشتن پیکربندی واقعی fail closed می‌کند. آن‌ها یک پیام install-required مشترک را در `validateInput`، `applyAccountConfig`، و `finalize` دوباره استفاده می‌کنند، و وقتی `docsPath` تنظیم شده باشد یک لینک docs اضافه می‌کنند.

  </Accordion>
  <Accordion title="کمک‌کننده‌های راه‌اندازی متکی بر باینری">
    برای UIهای راه‌اندازی متکی بر باینری، به‌جای کپی کردن همان چسب باینری/وضعیت در هر کانال، کمک‌کننده‌های delegated مشترک را ترجیح دهید:

    - `createDetectedBinaryStatus(...)` برای بلوک‌های وضعیتی که فقط بر اساس برچسب‌ها، hintها، امتیازها، و تشخیص باینری تفاوت دارند
    - `createCliPathTextInput(...)` برای ورودی‌های متنی متکی بر مسیر
    - `createDelegatedSetupWizardStatusResolvers(...)`، `createDelegatedPrepare(...)`، `createDelegatedFinalize(...)`، و `createDelegatedResolveConfigured(...)` وقتی `setupEntry` باید به‌شکل lazy به ویزارد کامل سنگین‌تری forward کند
    - `createDelegatedTextInputShouldPrompt(...)` وقتی `setupEntry` فقط لازم است تصمیم `textInputs[*].shouldPrompt` را delegate کند

  </Accordion>
</AccordionGroup>

## انتشار و نصب

**پلاگین‌های خارجی:** در [ClawHub](/fa/clawhub) منتشر کنید، سپس نصب کنید:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    مشخصات بسته bare در زمان گذار راه‌اندازی از npm نصب می‌شوند.

  </Tab>
  <Tab title="فقط ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مشخصات بسته npm">
    وقتی بسته‌ای هنوز به ClawHub منتقل نشده است، یا وقتی در زمان مهاجرت به یک
    مسیر نصب مستقیم npm نیاز دارید، از npm استفاده کنید:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginهای درون مخزن:** آن‌ها را زیر درخت فضای کاری Pluginهای همراه قرار دهید تا هنگام ساخت به‌طور خودکار شناسایی شوند.

**کاربران می‌توانند نصب کنند:**

```bash
openclaw plugins install <package-name>
```

<Info>
برای نصب‌هایی که از npm می‌آیند، `openclaw plugins install` بسته را با اسکریپت‌های چرخهٔ عمر غیرفعال، زیر `~/.openclaw/npm` نصب می‌کند. درخت‌های وابستگی Plugin را JS/TS خالص نگه دارید و از بسته‌هایی که به ساخت‌های `postinstall` نیاز دارند پرهیز کنید.
</Info>

<Note>
راه‌اندازی Gateway وابستگی‌های Plugin را نصب نمی‌کند. جریان‌های نصب npm/git/ClawHub مسئول همگرایی وابستگی‌ها هستند؛ Pluginهای محلی باید وابستگی‌هایشان از قبل نصب شده باشد.
</Note>

فرادادهٔ بستهٔ همراه صریح است و هنگام راه‌اندازی Gateway از JavaScript ساخته‌شده استنتاج نمی‌شود. وابستگی‌های زمان اجرا باید در بستهٔ Pluginی باشند که مالک آن‌ها است؛ راه‌اندازی OpenClaw بسته‌بندی‌شده هرگز وابستگی‌های Plugin را ترمیم یا آینه‌سازی نمی‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — راهنمای شروع گام‌به‌گام
- [مانیفست Plugin](/fa/plugins/manifest) — مرجع کامل شِمای مانیفست
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
