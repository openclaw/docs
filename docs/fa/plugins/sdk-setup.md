---
read_when:
    - شما در حال افزودن یک راهنمای راه‌اندازی به یک Plugin هستید
    - باید تفاوت setup-entry.ts و index.ts را درک کنید
    - در حال تعریف طرح‌واره‌های پیکربندی Plugin یا فرادادهٔ openclaw در package.json هستید
sidebarTitle: Setup and config
summary: ویزاردهای راه‌اندازی، setup-entry.ts، طرح‌واره‌های پیکربندی و فرادادهٔ package.json
title: راه‌اندازی و پیکربندی Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع بسته‌بندی Plugin (فراداده `package.json`)، manifestها (`openclaw.plugin.json`)، ورودی‌های راه‌اندازی، و شِماهای پیکربندی.

<Tip>
**دنبال یک راهنمای گام‌به‌گام هستید؟** راهنماهای عملی، بسته‌بندی را در متن کاربردی پوشش می‌دهند: [Pluginهای کانال](/fa/plugins/sdk-channel-plugins#step-1-package-and-manifest) و [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## فراداده بسته

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
  <Tab title="Plugin ارائه‌دهنده / خط پایه ClawHub">
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
  فراداده کاتالوگ کانال برای سطوح راه‌اندازی، انتخابگر، شروع سریع، و وضعیت.
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

`openclaw.channel` فراداده سبک بسته برای کشف کانال و سطوح راه‌اندازی، پیش از بارگذاری زمان اجرا است.

| فیلد                                  | نوع       | معنی آن                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | شناسه مرجع کانال.                                                         |
| `label`                                | `string`   | برچسب اصلی کانال.                                                        |
| `selectionLabel`                       | `string`   | برچسب انتخابگر/راه‌اندازی وقتی باید با `label` متفاوت باشد.                        |
| `detailLabel`                          | `string`   | برچسب جزئیات ثانویه برای کاتالوگ‌های غنی‌تر کانال و سطوح وضعیت.       |
| `docsPath`                             | `string`   | مسیر مستندات برای پیوندهای راه‌اندازی و انتخاب.                                      |
| `docsLabel`                            | `string`   | بازنویسی برچسبی که برای پیوندهای مستندات استفاده می‌شود وقتی باید با شناسه کانال متفاوت باشد. |
| `blurb`                                | `string`   | توضیح کوتاه برای راه‌اندازی اولیه/کاتالوگ.                                         |
| `order`                                | `number`   | ترتیب مرتب‌سازی در کاتالوگ‌های کانال.                                               |
| `aliases`                              | `string[]` | نام‌های مستعار جست‌وجوی اضافی برای انتخاب کانال.                                   |
| `preferOver`                           | `string[]` | شناسه‌های Plugin/کانال با اولویت پایین‌تر که این کانال باید بالاتر از آن‌ها قرار بگیرد.                |
| `systemImage`                          | `string`   | نام اختیاری آیکن/system-image برای کاتالوگ‌های UI کانال.                      |
| `selectionDocsPrefix`                  | `string`   | متن پیشوند پیش از پیوندهای مستندات در سطوح انتخاب.                          |
| `selectionDocsOmitLabel`               | `boolean`  | نمایش مستقیم مسیر مستندات به‌جای پیوند مستندات برچسب‌دار در متن انتخاب. |
| `selectionExtras`                      | `string[]` | رشته‌های کوتاه اضافی که به متن انتخاب افزوده می‌شوند.                               |
| `markdownCapable`                      | `boolean`  | کانال را برای تصمیم‌های قالب‌بندی خروجی، سازگار با Markdown علامت‌گذاری می‌کند.      |
| `exposure`                             | `object`   | کنترل‌های نمایانی کانال برای سطوح راه‌اندازی، فهرست‌های پیکربندی‌شده، و مستندات.   |
| `quickstartAllowFrom`                  | `boolean`  | این کانال را وارد جریان استاندارد راه‌اندازی سریع `allowFrom` می‌کند.         |
| `forceAccountBinding`                  | `boolean`  | اتصال صریح حساب را حتی وقتی فقط یک حساب وجود دارد الزامی می‌کند.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | هنگام حل هدف‌های اعلام برای این کانال، جست‌وجوی نشست را ترجیح می‌دهد.       |

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

- `configured`: گنجاندن کانال در سطوح فهرست‌سازی پیکربندی‌شده/سبک وضعیت
- `setup`: گنجاندن کانال در انتخابگرهای تعاملی راه‌اندازی/پیکربندی
- `docs`: علامت‌گذاری کانال به‌عنوان عمومی در سطوح مستندات/ناوبری

<Note>
`showConfigured` و `showInSetup` همچنان به‌عنوان نام‌های مستعار قدیمی پشتیبانی می‌شوند. `exposure` را ترجیح دهید.
</Note>

### `openclaw.install`

`openclaw.install` فراداده بسته است، نه فراداده manifest.

| فیلد                        | نوع                                | معنی آن                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مشخصه مرجع ClawHub برای جریان‌های نصب/به‌روزرسانی و نصب هنگام نیاز در راه‌اندازی اولیه. |
| `npmSpec`                    | `string`                            | مشخصه مرجع npm برای جریان‌های جایگزین نصب/به‌روزرسانی.                             |
| `localPath`                  | `string`                            | مسیر توسعه محلی یا نصب همراه‌شده.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | منبع نصب ترجیحی وقتی چند منبع در دسترس است.                     |
| `minHostVersion`             | `string`                            | حداقل نسخه پشتیبانی‌شده OpenClaw به شکل `>=x.y.z` یا `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | رشته تمامیت مورد انتظار dist در npm، معمولا `sha512-...`، برای نصب‌های سنجاق‌شده.    |
| `allowInvalidConfigRecovery` | `boolean`                           | اجازه می‌دهد جریان‌های نصب مجدد Plugin همراه‌شده از خرابی‌های خاص پیکربندی کهنه بازیابی شوند.  |

<AccordionGroup>
  <Accordion title="رفتار راه‌اندازی اولیه">
    راه‌اندازی اولیه تعاملی نیز از `openclaw.install` برای سطوح نصب هنگام نیاز استفاده می‌کند. اگر Plugin شما انتخاب‌های احراز هویت ارائه‌دهنده یا فراداده راه‌اندازی/کاتالوگ کانال را پیش از بارگذاری زمان اجرا نمایش دهد، راه‌اندازی اولیه می‌تواند آن انتخاب را نشان دهد، برای نصب از ClawHub، npm، یا محلی درخواست کند، Plugin را نصب یا فعال کند، سپس جریان انتخاب‌شده را ادامه دهد. انتخاب‌های راه‌اندازی اولیه ClawHub از `clawhubSpec` استفاده می‌کنند و وقتی موجود باشند ترجیح داده می‌شوند؛ انتخاب‌های npm به فراداده کاتالوگ قابل اعتماد با `npmSpec` رجیستری نیاز دارند؛ نسخه‌های دقیق و `expectedIntegrity` سنجاق‌های اختیاری npm هستند. اگر `expectedIntegrity` وجود داشته باشد، جریان‌های نصب/به‌روزرسانی آن را برای npm اعمال می‌کنند. فراداده «چه چیزی نمایش داده شود» را در `openclaw.plugin.json` و فراداده «چگونه نصب شود» را در `package.json` نگه دارید.
  </Accordion>
  <Accordion title="اعمال minHostVersion">
    اگر `minHostVersion` تنظیم شده باشد، هم نصب و هم بارگذاری غیرهمراه رجیستری manifest آن را اعمال می‌کنند. میزبان‌های قدیمی‌تر Pluginهای خارجی را نادیده می‌گیرند؛ رشته‌های نسخه نامعتبر رد می‌شوند. فرض می‌شود Pluginهای منبع همراه‌شده با checkout میزبان هم‌نسخه هستند.
  </Accordion>
  <Accordion title="نصب‌های npm سنجاق‌شده">
    برای نصب‌های npm سنجاق‌شده، نسخه دقیق را در `npmSpec` نگه دارید و تمامیت مورد انتظار مصنوع را اضافه کنید:

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
    `allowInvalidConfigRecovery` دورزدن عمومی برای پیکربندی‌های خراب نیست. این فقط برای بازیابی محدود Pluginهای همراه‌شده است، تا نصب مجدد/راه‌اندازی بتواند باقی‌مانده‌های شناخته‌شده ارتقا مثل مسیر گم‌شده Plugin همراه‌شده یا ورودی کهنه `channels.<id>` برای همان Plugin را تعمیر کند. اگر پیکربندی به دلایل نامرتبط خراب باشد، نصب همچنان بسته شکست می‌خورد و به اپراتور می‌گوید `openclaw doctor --fix` را اجرا کند.
  </Accordion>
</AccordionGroup>

### بارگذاری کامل تعویق‌افتاده

Pluginهای کانال می‌توانند با این مورد، بارگذاری تعویق‌افتاده را فعال کنند:

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

وقتی فعال باشد، OpenClaw در مرحله راه‌اندازی پیش از گوش‌دادن، حتی برای کانال‌هایی که از قبل پیکربندی شده‌اند، فقط `setupEntry` را بارگذاری می‌کند. ورودی کامل پس از آن‌که gateway شروع به گوش‌دادن کرد بارگذاری می‌شود.

<Warning>
بارگذاری تعویق‌افتاده را فقط وقتی فعال کنید که `setupEntry` شما همه چیزهایی را که gateway پیش از شروع گوش‌دادن نیاز دارد ثبت کند (ثبت کانال، مسیرهای HTTP، متدهای gateway). اگر ورودی کامل مالک قابلیت‌های لازم راه‌اندازی است، رفتار پیش‌فرض را نگه دارید.
</Warning>

اگر ورودی setup/full شما متدهای RPC gateway را ثبت می‌کند، آن‌ها را روی یک پیشوند اختصاصی Plugin نگه دارید. فضای نام‌های رزروشده مدیریت هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) متعلق به هسته می‌مانند و همیشه به `operator.admin` resolve می‌شوند.

## manifest Plugin

هر Plugin بومی باید یک `openclaw.plugin.json` در ریشه بسته ارائه کند. OpenClaw از این برای اعتبارسنجی پیکربندی بدون اجرای کد Plugin استفاده می‌کند.

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

حتی Pluginهایی که هیچ پیکربندی ندارند باید یک شِما ارائه کنند. یک شِمای خالی معتبر است:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

برای مرجع کامل شِما، [manifest Plugin](/fa/plugins/manifest) را ببینید.

## انتشار در ClawHub

برای بسته‌های Plugin، از فرمان اختصاصی بسته ClawHub استفاده کنید:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
نام مستعار انتشار قدیمی که فقط برای skill بود، برای skills است. بسته‌های Plugin همیشه باید از `clawhub package publish` استفاده کنند.
</Note>

## ورودی راه‌اندازی

فایل `setup-entry.ts` جایگزینی سبک برای `index.ts` است که OpenClaw زمانی آن را بارگذاری می‌کند که فقط به سطح‌های راه‌اندازی نیاز داشته باشد (onboarding، تعمیر پیکربندی، بازرسی کانال غیرفعال).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

این کار از بارگذاری کد سنگین زمان اجرا (کتابخانه‌های رمزنگاری، ثبت‌های CLI، سرویس‌های پس‌زمینه) در جریان‌های راه‌اندازی جلوگیری می‌کند.

کانال‌های workspace همراه که exportهای ایمن برای راه‌اندازی را در ماژول‌های sidecar نگه می‌دارند، می‌توانند به‌جای `defineSetupPluginEntry(...)` از `defineBundledChannelSetupEntry(...)` از `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن قرارداد همراه همچنین از export اختیاری `runtime` پشتیبانی می‌کند تا اتصال‌های زمان اجرای زمان راه‌اندازی سبک و صریح بمانند.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - کانال غیرفعال است اما به سطح‌های راه‌اندازی/onboarding نیاز دارد.
    - کانال فعال است اما پیکربندی نشده است.
    - بارگذاری deferred فعال است (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - شیء Plugin کانال (از طریق `defineSetupPluginEntry`).
    - هر route‏ HTTP که پیش از listen کردن gateway لازم است.
    - هر متد gateway که هنگام startup لازم است.

    آن متدهای gateway مربوط به startup همچنان باید از namespaceهای admin رزروشده‌ی core مانند `config.*` یا `update.*` پرهیز کنند.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - ثبت‌های CLI.
    - سرویس‌های پس‌زمینه.
    - importهای سنگین زمان اجرا (crypto، SDKها).
    - متدهای Gateway که فقط پس از startup لازم هستند.

  </Accordion>
</AccordionGroup>

### importهای محدود helper راه‌اندازی

برای مسیرهای داغِ فقط راه‌اندازی، وقتی فقط به بخشی از سطح راه‌اندازی نیاز دارید، helper seamهای محدود راه‌اندازی را به umbrella گسترده‌تر `plugin-sdk/setup` ترجیح دهید:

| مسیر import                        | کاربرد                                                                                 | exportهای کلیدی                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helperهای زمان اجرای زمان راه‌اندازی که در `setupEntry` / startup کانال deferred در دسترس می‌مانند | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapterهای راه‌اندازی account آگاه از محیط                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helperهای setup/install مربوط به CLI/archive/docs                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

وقتی کل جعبه‌ابزار مشترک راه‌اندازی را می‌خواهید، از جمله helperهای config-patch مانند `moveSingleAccountChannelSectionToDefaultAccount(...)`، از seam گسترده‌تر `plugin-sdk/setup` استفاده کنید.

adapterهای patch راه‌اندازی هنگام import برای hot path ایمن می‌مانند. lookup سطح قرارداد promotion تک-account همراه آن‌ها lazy است، بنابراین import کردن `plugin-sdk/setup-runtime` پیش از استفاده واقعی از adapter، discovery سطح قرارداد همراه را مشتاقانه بارگذاری نمی‌کند.

### promotion تک-account متعلق به کانال

وقتی یک کانال از پیکربندی top-level تک-account به `channels.<id>.accounts.*` ارتقا پیدا می‌کند، رفتار مشترک پیش‌فرض این است که مقدارهای account-scoped ارتقایافته را به `accounts.default` منتقل کند.

کانال‌های همراه می‌توانند آن promotion را از طریق سطح قرارداد راه‌اندازی خود محدود یا override کنند:

- `singleAccountKeysToMove`: کلیدهای top-level اضافی که باید به account ارتقایافته منتقل شوند
- `namedAccountPromotionKeys`: وقتی accountهای نام‌دار از قبل وجود دارند، فقط این کلیدها به account ارتقایافته منتقل می‌شوند؛ کلیدهای shared policy/delivery در root کانال می‌مانند
- `resolveSingleAccountPromotionTarget(...)`: انتخاب می‌کند کدام account موجود مقدارهای ارتقایافته را دریافت کند

<Note>
Matrix نمونه همراه فعلی است. اگر دقیقاً یک account نام‌دار Matrix از قبل وجود داشته باشد، یا اگر `defaultAccount` به کلید non-canonical موجودی مانند `Ops` اشاره کند، promotion همان account را حفظ می‌کند، به‌جای اینکه entry جدید `accounts.default` بسازد.
</Note>

## schema پیکربندی

پیکربندی Plugin بر اساس JSON Schema موجود در manifest شما اعتبارسنجی می‌شود. کاربران Pluginها را از این طریق پیکربندی می‌کنند:

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

Plugin شما این پیکربندی را هنگام registration به‌صورت `api.pluginConfig` دریافت می‌کند.

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

از `buildChannelConfigSchema` برای تبدیل یک schema‏ Zod به wrapper‏ `ChannelConfigSchema` استفاده کنید که artifactهای پیکربندی متعلق به Plugin از آن استفاده می‌کنند:

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

اگر از قبل قرارداد را به‌صورت JSON Schema یا TypeBox می‌نویسید، از helper مستقیم استفاده کنید تا OpenClaw بتواند در مسیرهای metadata تبدیل Zod-to-JSON-Schema را skip کند:

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

برای Pluginهای third-party، قرارداد cold-path همچنان manifest Plugin است: JSON Schema تولیدشده را در `openclaw.plugin.json#channelConfigs` mirror کنید تا schema پیکربندی، راه‌اندازی و سطح‌های UI بتوانند `channels.<id>` را بدون بارگذاری کد runtime بازرسی کنند.

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

نوع `ChannelSetupWizard` از `credentials`، `textInputs`، `dmPolicy`، `allowFrom`، `groupAccess`، `prepare`، `finalize` و موارد بیشتر پشتیبانی می‌کند. برای نمونه‌های کامل، بسته‌های Plugin همراه را ببینید (برای مثال Plugin مربوط به Discord در `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    برای promptهای allowlist مربوط به DM که فقط به جریان استاندارد `note -> prompt -> parse -> merge -> patch` نیاز دارند، helperهای مشترک راه‌اندازی از `openclaw/plugin-sdk/setup` را ترجیح دهید: `createPromptParsedAllowFromForAccount(...)`، `createTopLevelChannelParsedAllowFromPrompt(...)`، و `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    برای blockهای وضعیت راه‌اندازی کانال که فقط در labelها، scoreها و lineهای اضافی اختیاری تفاوت دارند، به‌جای ساخت دستی همان شیء `status` در هر Plugin، `createStandardChannelSetupStatus(...)` از `openclaw/plugin-sdk/setup` را ترجیح دهید.
  </Accordion>
  <Accordion title="Optional channel setup surface">
    برای سطح‌های راه‌اندازی اختیاری که فقط باید در contextهای مشخصی ظاهر شوند، از `createOptionalChannelSetupSurface` از `openclaw/plugin-sdk/channel-setup` استفاده کنید:

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

    `plugin-sdk/channel-setup` همچنین builderهای سطح پایین‌تر `createOptionalChannelSetupAdapter(...)` و `createOptionalChannelSetupWizard(...)` را expose می‌کند، وقتی فقط به یک نیمه از آن سطح optional-install نیاز دارید.

    adapter/wizard اختیاری تولیدشده در writeهای واقعی پیکربندی fail-closed می‌شوند. آن‌ها یک پیام install-required را در `validateInput`، `applyAccountConfig` و `finalize` reuse می‌کنند و وقتی `docsPath` تنظیم شده باشد، link مستندات را اضافه می‌کنند.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    برای UIهای راه‌اندازی متکی بر binary، به‌جای کپی کردن glue یکسان binary/status در هر کانال، helperهای delegated مشترک را ترجیح دهید:

    - `createDetectedBinaryStatus(...)` برای blockهای وضعیت که فقط بر اساس labelها، hintها، scoreها و detection باینری تفاوت دارند
    - `createCliPathTextInput(...)` برای text inputهای متکی به path
    - `createDelegatedSetupWizardStatusResolvers(...)`، `createDelegatedPrepare(...)`، `createDelegatedFinalize(...)`، و `createDelegatedResolveConfigured(...)` وقتی `setupEntry` لازم دارد به‌صورت lazy به wizard کامل سنگین‌تری forward کند
    - `createDelegatedTextInputShouldPrompt(...)` وقتی `setupEntry` فقط باید تصمیم `textInputs[*].shouldPrompt` را delegate کند

  </Accordion>
</AccordionGroup>

## انتشار و نصب

**Pluginهای خارجی:** در [ClawHub](/fa/tools/clawhub) منتشر کنید، سپس نصب کنید:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    specهای package بدون prefix هنگام launch cutover از npm نصب می‌شوند.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    وقتی package هنوز به ClawHub منتقل نشده است، یا وقتی هنگام migration به یک مسیر نصب مستقیم npm نیاز دارید، از npm استفاده کنید:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginهای درون مخزن:** آن‌ها را زیر درخت workspace مربوط به Pluginهای همراه قرار دهید تا هنگام build به‌طور خودکار شناسایی شوند.

**کاربران می‌توانند نصب کنند:**

```bash
openclaw plugins install <package-name>
```

<Info>
برای نصب‌های برگرفته از npm، `openclaw plugins install` بسته را با غیرفعال بودن lifecycle scriptها زیر `~/.openclaw/npm` نصب می‌کند. درخت‌های وابستگی Plugin را JS/TS خالص نگه دارید و از بسته‌هایی که به buildهای `postinstall` نیاز دارند پرهیز کنید.
</Info>

<Note>
راه‌اندازی Gateway وابستگی‌های Plugin را نصب نمی‌کند. جریان‌های نصب npm/git/ClawHub مسئول همگرایی وابستگی‌ها هستند؛ Pluginهای محلی باید از قبل وابستگی‌هایشان نصب شده باشد.
</Note>

فرادادهٔ بسته‌های همراه صریح است و هنگام راه‌اندازی gateway از JavaScript ساخته‌شده استنتاج نمی‌شود. وابستگی‌های runtime به بستهٔ Pluginای تعلق دارند که مالک آن‌هاست؛ راه‌اندازی OpenClaw بسته‌بندی‌شده هرگز وابستگی‌های Plugin را تعمیر یا آینه‌سازی نمی‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — راهنمای شروع گام‌به‌گام
- [manifest مربوط به Plugin](/fa/plugins/manifest) — مرجع کامل طرح‌وارهٔ manifest
- [نقطه‌های ورود SDK](/fa/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
