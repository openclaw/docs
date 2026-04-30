---
read_when:
    - شما در حال افزودن یک جادوگر راه‌اندازی به یک Plugin هستید
    - باید تفاوت setup-entry.ts با index.ts را بفهمید
    - شما در حال تعریف طرح‌واره‌های پیکربندی Plugin یا فرادادهٔ openclaw در package.json هستید
sidebarTitle: Setup and config
summary: جادوگرهای راه‌اندازی، setup-entry.ts، طرح‌واره‌های پیکربندی، و فرادادهٔ package.json
title: راه‌اندازی و پیکربندی Plugin
x-i18n:
    generated_at: "2026-04-30T00:06:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجعی برای بسته‌بندی Plugin (فراداده‌ی `package.json`)، مانیفست‌ها (`openclaw.plugin.json`)، ورودی‌های راه‌اندازی، و طرح‌واره‌های پیکربندی.

<Tip>
**دنبال یک راهنمای گام‌به‌گام هستید؟** راهنماهای عملی، بسته‌بندی را در متن کاربردی پوشش می‌دهند: [Pluginهای کانال](/fa/plugins/sdk-channel-plugins#step-1-package-and-manifest) و [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
اگر Plugin را به‌صورت خارجی در ClawHub منتشر می‌کنید، آن فیلدهای `compat` و `build` الزامی هستند. قطعه‌کدهای مرجع انتشار در `docs/snippets/plugin-publish/` قرار دارند.
</Note>

### فیلدهای `openclaw`

<ParamField path="extensions" type="string[]">
  فایل‌های نقطه‌ی ورود (نسبت به ریشه‌ی بسته).
</ParamField>
<ParamField path="setupEntry" type="string">
  ورودی سبک مخصوص راه‌اندازی (اختیاری).
</ParamField>
<ParamField path="channel" type="object">
  فراداده‌ی کاتالوگ کانال برای سطوح راه‌اندازی، انتخاب‌گر، شروع سریع، و وضعیت.
</ParamField>
<ParamField path="providers" type="string[]">
  شناسه‌های ارائه‌دهنده که این Plugin ثبت می‌کند.
</ParamField>
<ParamField path="install" type="object">
  راهنمایی‌های نصب: `npmSpec`، `localPath`، `defaultChoice`، `minHostVersion`، `expectedIntegrity`، `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  پرچم‌های رفتار شروع به کار.
</ParamField>

### `openclaw.channel`

`openclaw.channel` فراداده‌ی کم‌هزینه‌ی بسته برای کشف کانال و سطوح راه‌اندازی پیش از بارگذاری زمان اجرا است.

| فیلد                                  | نوع       | معنی آن                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | شناسه‌ی مرجع کانال.                                                         |
| `label`                                | `string`   | برچسب اصلی کانال.                                                        |
| `selectionLabel`                       | `string`   | برچسب انتخاب‌گر/راه‌اندازی، وقتی باید با `label` متفاوت باشد.                        |
| `detailLabel`                          | `string`   | برچسب جزئیات ثانویه برای کاتالوگ‌های غنی‌تر کانال و سطوح وضعیت.       |
| `docsPath`                             | `string`   | مسیر مستندات برای لینک‌های راه‌اندازی و انتخاب.                                      |
| `docsLabel`                            | `string`   | برچسب جایگزین برای لینک‌های مستندات، وقتی باید با شناسه‌ی کانال متفاوت باشد. |
| `blurb`                                | `string`   | توضیح کوتاه برای پذیرش اولیه/کاتالوگ.                                         |
| `order`                                | `number`   | ترتیب مرتب‌سازی در کاتالوگ‌های کانال.                                               |
| `aliases`                              | `string[]` | نام‌های مستعار اضافی برای جست‌وجوی انتخاب کانال.                                   |
| `preferOver`                           | `string[]` | شناسه‌های Plugin/کانال با اولویت پایین‌تر که این کانال باید بر آن‌ها مقدم باشد.                |
| `systemImage`                          | `string`   | نام اختیاری آیکون/تصویر سیستمی برای کاتالوگ‌های رابط کاربری کانال.                      |
| `selectionDocsPrefix`                  | `string`   | متن پیشوند پیش از لینک‌های مستندات در سطوح انتخاب.                          |
| `selectionDocsOmitLabel`               | `boolean`  | به‌جای لینک مستندات برچسب‌دار در متن انتخاب، مسیر مستندات را مستقیماً نمایش می‌دهد. |
| `selectionExtras`                      | `string[]` | رشته‌های کوتاه اضافی که به متن انتخاب افزوده می‌شوند.                               |
| `markdownCapable`                      | `boolean`  | کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان پشتیبان Markdown علامت‌گذاری می‌کند.      |
| `exposure`                             | `object`   | کنترل‌های نمایانی کانال برای سطوح راه‌اندازی، فهرست‌های پیکربندی‌شده، و مستندات.   |
| `quickstartAllowFrom`                  | `boolean`  | این کانال را وارد جریان استاندارد راه‌اندازی شروع سریع `allowFrom` می‌کند.         |
| `forceAccountBinding`                  | `boolean`  | حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | هنگام حل مقصدهای اعلان برای این کانال، جست‌وجوی نشست را ترجیح می‌دهد.       |

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

- `configured`: کانال را در سطوح فهرست‌نمایی پیکربندی‌شده/سبک وضعیت وارد می‌کند
- `setup`: کانال را در انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی وارد می‌کند
- `docs`: کانال را در سطوح مستندات/ناوبری به‌عنوان عمومی علامت‌گذاری می‌کند

<Note>
`showConfigured` و `showInSetup` همچنان به‌عنوان نام‌های مستعار قدیمی پشتیبانی می‌شوند. `exposure` را ترجیح دهید.
</Note>

### `openclaw.install`

`openclaw.install` فراداده‌ی بسته است، نه فراداده‌ی مانیفست.

| فیلد                        | نوع                 | معنی آن                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | مشخصه‌ی مرجع npm برای جریان‌های نصب/به‌روزرسانی.                                     |
| `localPath`                  | `string`             | مسیر نصب محلی توسعه یا نصب همراه بسته.                                       |
| `defaultChoice`              | `"npm"` \| `"local"` | منبع نصب ترجیحی وقتی هر دو در دسترس باشند.                                |
| `minHostVersion`             | `string`             | حداقل نسخه‌ی پشتیبانی‌شده‌ی OpenClaw به شکل `>=x.y.z`.                        |
| `expectedIntegrity`          | `string`             | رشته‌ی صحت مورد انتظار npm dist، معمولاً `sha512-...`، برای نصب‌های سنجاق‌شده.   |
| `allowInvalidConfigRecovery` | `boolean`            | به جریان‌های نصب مجدد Plugin همراه اجازه می‌دهد از خرابی‌های مشخص ناشی از پیکربندی کهنه بازیابی شوند. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    پذیرش اولیه‌ی تعاملی نیز از `openclaw.install` برای سطوح نصب در صورت نیاز استفاده می‌کند. اگر Plugin شما پیش از بارگذاری زمان اجرا، گزینه‌های احراز هویت ارائه‌دهنده یا فراداده‌ی راه‌اندازی/کاتالوگ کانال را نمایش دهد، پذیرش اولیه می‌تواند آن گزینه را نشان دهد، برای نصب npm در برابر نصب محلی درخواست کند، Plugin را نصب یا فعال کند، سپس جریان انتخاب‌شده را ادامه دهد. گزینه‌های پذیرش اولیه‌ی npm به فراداده‌ی کاتالوگ مورد اعتماد با `npmSpec` رجیستری نیاز دارند؛ نسخه‌های دقیق و `expectedIntegrity` سنجاق‌های اختیاری هستند. اگر `expectedIntegrity` وجود داشته باشد، جریان‌های نصب/به‌روزرسانی آن را اعمال می‌کنند. فراداده‌ی «چه چیزی نشان داده شود» را در `openclaw.plugin.json` و فراداده‌ی «چگونه نصب شود» را در `package.json` نگه دارید.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    اگر `minHostVersion` تنظیم شده باشد، هم نصب و هم بارگذاری رجیستری مانیفست آن را اعمال می‌کنند. میزبان‌های قدیمی‌تر Plugin را رد می‌کنند؛ رشته‌های نسخه‌ی نامعتبر رد می‌شوند.
  </Accordion>
  <Accordion title="Pinned npm installs">
    برای نصب‌های npm سنجاق‌شده، نسخه‌ی دقیق را در `npmSpec` نگه دارید و صحت آرتیفکت مورد انتظار را اضافه کنید:

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
  <Accordion title="دامنه allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` یک دورزدن عمومی برای پیکربندی‌های خراب نیست. فقط برای بازیابی محدود Pluginهای همراه است، تا نصب دوباره/راه‌اندازی بتواند باقی‌مانده‌های شناخته‌شدهٔ ارتقا، مثل مسیر ازدست‌رفتهٔ یک Plugin همراه یا ورودی کهنهٔ `channels.<id>` برای همان Plugin، را تعمیر کند. اگر پیکربندی به دلایل نامرتبط خراب باشد، نصب همچنان به‌صورت بسته شکست می‌خورد و به اپراتور می‌گوید `openclaw doctor --fix` را اجرا کند.
  </Accordion>
</AccordionGroup>

### بارگذاری کامل تعویق‌افتاده

Pluginهای کانال می‌توانند با این مورد، بارگذاری تعویقی را فعال کنند:

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

وقتی فعال باشد، OpenClaw در مرحلهٔ راه‌اندازی پیش از گوش‌دادن، حتی برای کانال‌هایی که از قبل پیکربندی شده‌اند، فقط `setupEntry` را بارگذاری می‌کند. ورودی کامل پس از آن بارگذاری می‌شود که Gateway شروع به گوش‌دادن کند.

<Warning>
بارگذاری تعویقی را فقط زمانی فعال کنید که `setupEntry` شما همهٔ چیزهایی را که Gateway پیش از شروع گوش‌دادن نیاز دارد ثبت کند (ثبت کانال، مسیرهای HTTP، متدهای Gateway). اگر ورودی کامل مالک قابلیت‌های لازم برای راه‌اندازی است، رفتار پیش‌فرض را نگه دارید.
</Warning>

اگر ورودی setup/کامل شما متدهای RPC مربوط به Gateway را ثبت می‌کند، آن‌ها را روی یک پیشوند مخصوص Plugin نگه دارید. فضاهای نام رزروشدهٔ مدیریت هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) همچنان متعلق به هسته می‌مانند و همیشه به `operator.admin` resolve می‌شوند.

## مانیفست Plugin

هر Plugin بومی باید یک `openclaw.plugin.json` در ریشهٔ بسته ارائه کند. OpenClaw از این فایل برای اعتبارسنجی پیکربندی بدون اجرای کد Plugin استفاده می‌کند.

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

برای مرجع کامل schema، [مانیفست Plugin](/fa/plugins/manifest) را ببینید.

## انتشار در ClawHub

برای بسته‌های Plugin، از دستور مخصوص بسته در ClawHub استفاده کنید:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
نام مستعار انتشار قدیمی که فقط مخصوص skill بود، برای skills است. بسته‌های Plugin باید همیشه از `clawhub package publish` استفاده کنند.
</Note>

## ورودی راه‌اندازی

فایل `setup-entry.ts` یک جایگزین سبک برای `index.ts` است که OpenClaw زمانی آن را بارگذاری می‌کند که فقط به سطوح راه‌اندازی نیاز دارد (onboarding، تعمیر پیکربندی، بازرسی کانال غیرفعال).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

این کار از بارگذاری کدهای runtime سنگین (کتابخانه‌های crypto، ثبت‌های CLI، سرویس‌های پس‌زمینه) در جریان‌های setup جلوگیری می‌کند.

کانال‌های workspace همراه که خروجی‌های setup-safe را در ماژول‌های sidecar نگه می‌دارند، می‌توانند به‌جای `defineSetupPluginEntry(...)` از `defineBundledChannelSetupEntry(...)` در `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن قرارداد همراه همچنین از یک خروجی اختیاری `runtime` پشتیبانی می‌کند تا سیم‌کشی runtime در زمان setup سبک و صریح بماند.

<AccordionGroup>
  <Accordion title="زمانی که OpenClaw به‌جای ورودی کامل از setupEntry استفاده می‌کند">
    - کانال غیرفعال است اما به سطح‌های setup/onboarding نیاز دارد.
    - کانال فعال است اما پیکربندی نشده است.
    - بارگذاری deferred فعال است (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="آنچه setupEntry باید ثبت کند">
    - شیء Plugin کانال (از طریق `defineSetupPluginEntry`).
    - هر مسیر HTTP که پیش از گوش‌دادن Gateway لازم است.
    - هر متد Gateway که هنگام startup لازم است.

    آن متدهای Gateway در startup همچنان باید از namespaceهای رزروشده ادمین core مانند `config.*` یا `update.*` دوری کنند.

  </Accordion>
  <Accordion title="آنچه setupEntry نباید شامل شود">
    - ثبت‌های CLI.
    - سرویس‌های پس‌زمینه.
    - importهای runtime سنگین (crypto، SDKها).
    - متدهای Gateway که فقط پس از startup لازم هستند.

  </Accordion>
</AccordionGroup>

### importهای helper باریک برای setup

برای مسیرهای داغ و فقط setup، وقتی فقط به بخشی از سطح setup نیاز دارید، seamهای helper باریک setup را به umbrella گسترده‌تر `plugin-sdk/setup` ترجیح دهید:

| مسیر import                        | کاربرد                                                                                  | خروجی‌های کلیدی                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helperهای runtime زمان setup که در `setupEntry` / startup کانال deferred در دسترس می‌مانند | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapterهای setup حساب آگاه از محیط                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helperهای setup/install برای CLI/archive/docs                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

وقتی کل جعبه‌ابزار setup مشترک را می‌خواهید، از جمله helperهای config-patch مانند `moveSingleAccountChannelSectionToDefaultAccount(...)`، از seam گسترده‌تر `plugin-sdk/setup` استفاده کنید.

adapterهای patch setup هنگام import برای hot-path امن می‌مانند. lookup سطح قرارداد promotion حساب تکی همراه آن‌ها lazy است، بنابراین import کردن `plugin-sdk/setup-runtime` پیش از اینکه adapter واقعا استفاده شود، discovery سطح قرارداد همراه را eager بارگذاری نمی‌کند.

### promotion حساب تکی تحت مالکیت کانال

وقتی یک کانال از config سطح بالای تک‌حسابی به `channels.<id>.accounts.*` ارتقا پیدا می‌کند، رفتار مشترک پیش‌فرض این است که مقدارهای promote‌شده با scope حساب به `accounts.default` منتقل شوند.

کانال‌های همراه می‌توانند آن promotion را از طریق سطح قرارداد setup خود محدود یا override کنند:

- `singleAccountKeysToMove`: کلیدهای سطح بالای اضافی که باید به حساب promote‌شده منتقل شوند
- `namedAccountPromotionKeys`: وقتی حساب‌های نام‌دار از قبل وجود دارند، فقط این کلیدها به حساب promote‌شده منتقل می‌شوند؛ کلیدهای policy/delivery مشترک در ریشه کانال باقی می‌مانند
- `resolveSingleAccountPromotionTarget(...)`: انتخاب می‌کند کدام حساب موجود مقدارهای promote‌شده را دریافت کند

<Note>
Matrix نمونه همراه فعلی است. اگر دقیقا یک حساب Matrix نام‌دار از قبل وجود داشته باشد، یا اگر `defaultAccount` به یک کلید غیر canonical موجود مانند `Ops` اشاره کند، promotion به‌جای ایجاد ورودی جدید `accounts.default` همان حساب را حفظ می‌کند.
</Note>

## schema پیکربندی

config مربوط به Plugin در برابر JSON Schema موجود در manifest شما اعتبارسنجی می‌شود. کاربران Pluginها را از طریق این بخش پیکربندی می‌کنند:

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

Plugin شما هنگام registration این config را به‌صورت `api.pluginConfig` دریافت می‌کند.

برای config اختصاصی کانال، به‌جای آن از بخش config کانال استفاده کنید:

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

### ساختن schemaهای config کانال

از `buildChannelConfigSchema` برای تبدیل یک schema در Zod به wrapper نوع `ChannelConfigSchema` که artifactهای config تحت مالکیت Plugin از آن استفاده می‌کنند، استفاده کنید:

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

برای Pluginهای third-party، قرارداد cold-path همچنان manifest مربوط به Plugin است: JSON Schema تولیدشده را در `openclaw.plugin.json#channelConfigs` منعکس کنید تا schema config، setup، و سطح‌های UI بتوانند بدون بارگذاری کد runtime، `channels.<id>` را بازرسی کنند.

## wizardهای setup

Pluginهای کانال می‌توانند برای `openclaw onboard` wizardهای setup تعاملی ارائه کنند. wizard یک شیء `ChannelSetupWizard` روی `ChannelPlugin` است:

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

نوع `ChannelSetupWizard` از `credentials`، `textInputs`، `dmPolicy`، `allowFrom`، `groupAccess`، `prepare`، `finalize`، و موارد بیشتر پشتیبانی می‌کند. برای نمونه‌های کامل، packageهای Plugin همراه را ببینید (برای مثال Plugin مربوط به Discord در `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="promptهای allowFrom مشترک">
    برای promptهای allowlist مربوط به DM که فقط به جریان استاندارد `note -> prompt -> parse -> merge -> patch` نیاز دارند، helperهای setup مشترک از `openclaw/plugin-sdk/setup` را ترجیح دهید: `createPromptParsedAllowFromForAccount(...)`، `createTopLevelChannelParsedAllowFromPrompt(...)`، و `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="وضعیت setup استاندارد کانال">
    برای بلوک‌های وضعیت setup کانال که فقط از نظر labelها، scoreها، و خط‌های اضافی اختیاری متفاوت‌اند، به‌جای ساخت دستی همان شیء `status` در هر Plugin، `createStandardChannelSetupStatus(...)` از `openclaw/plugin-sdk/setup` را ترجیح دهید.
  </Accordion>
  <Accordion title="سطح setup اختیاری کانال">
    برای سطح‌های setup اختیاری که فقط باید در contextهای خاصی ظاهر شوند، از `createOptionalChannelSetupSurface` در `openclaw/plugin-sdk/channel-setup` استفاده کنید:

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

    `plugin-sdk/channel-setup` همچنین builderهای سطح پایین‌تر `createOptionalChannelSetupAdapter(...)` و `createOptionalChannelSetupWizard(...)` را زمانی که فقط به یک نیمه از آن سطح optional-install نیاز دارید، ارائه می‌کند.

    adapter/wizard اختیاری تولیدشده در writeهای واقعی config به‌صورت fail closed عمل می‌کنند. آن‌ها در `validateInput`، `applyAccountConfig`، و `finalize` از یک پیام install-required مشترک استفاده می‌کنند و وقتی `docsPath` تنظیم شده باشد، یک لینک docs اضافه می‌کنند.

  </Accordion>
  <Accordion title="helperهای setup مبتنی بر binary">
    برای UIهای setup مبتنی بر binary، به‌جای کپی‌کردن همان چسب binary/status در هر کانال، helperهای delegated مشترک را ترجیح دهید:

    - `createDetectedBinaryStatus(...)` برای بلوک‌های status که فقط از نظر labelها، hintها، scoreها، و detection مربوط به binary تفاوت دارند
    - `createCliPathTextInput(...)` برای text inputهای مبتنی بر path
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

    OpenClaw ابتدا ClawHub را امتحان می‌کند و به‌صورت خودکار به npm fallback می‌کند.

  </Tab>
  <Tab title="فقط ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مشخصات package در npm">
    وقتی یک package هنوز به ClawHub منتقل نشده است، یا وقتی در طول migration به یک
    مسیر نصب مستقیم npm نیاز دارید، از npm استفاده کنید:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginهای درون repo:** آن‌ها را زیر درخت workspace مربوط به Pluginهای همراه قرار دهید تا در زمان build به‌صورت خودکار کشف شوند.

**کاربران می‌توانند نصب کنند:**

```bash
openclaw plugins install <package-name>
```

<Info>
برای نصب‌هایی که از npm می‌آیند، `openclaw plugins install` دستور `npm install --ignore-scripts` محلی پروژه را اجرا می‌کند (بدون lifecycle script) و تنظیمات global به‌ارث‌رسیده نصب npm را نادیده می‌گیرد. درخت‌های dependency مربوط به Plugin را pure JS/TS نگه دارید و از packageهایی که به buildهای `postinstall` نیاز دارند دوری کنید.
</Info>

<Note>
Pluginهای متعلق به OpenClaw که همراه بسته ارائه می‌شوند تنها استثنای ترمیم هنگام راه‌اندازی هستند: وقتی یک نصب بسته‌بندی‌شده ببیند یکی از آن‌ها از طریق پیکربندی Plugin، پیکربندی کانال قدیمی، یا مانیفست همراه آن که به‌صورت پیش‌فرض فعال است، فعال شده، راه‌اندازی پیش از import وابستگی‌های زمان اجرای گمشده آن Plugin را نصب می‌کند. اپراتورها می‌توانند این مرحله را با `openclaw plugins deps` بررسی یا ترمیم کنند. Pluginهای شخص ثالث نباید به نصب‌های هنگام راه‌اندازی تکیه کنند؛ همچنان از نصب‌کننده صریح Plugin استفاده کنید.
</Note>

وابستگی‌های زمان اجرای سطح بسته که همراه ارائه می‌شوند، فراداده صریح هستند و هنگام راه‌اندازی Gateway از JavaScript ساخته‌شده استنباط نمی‌شوند. اگر یک وابستگی مشترک ریشه OpenClaw باید داخل آینه زمان اجرای Plugin همراه خارجی در دسترس باشد، آن را در `openclaw.bundle.mirroredRootRuntimeDependencies` در مانیفست بسته ریشه اعلام کنید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — راهنمای شروع گام‌به‌گام
- [مانیفست Plugin](/fa/plugins/manifest) — مرجع کامل شمای مانیفست
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
