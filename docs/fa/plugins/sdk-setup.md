---
read_when:
    - در حال افزودن یک راهنمای راه‌اندازی به یک Plugin هستید
    - باید تفاوت setup-entry.ts و index.ts را درک کنید
    - شما در حال تعریف طرحواره‌های پیکربندی Plugin یا فرادادهٔ openclaw در package.json هستید
sidebarTitle: Setup and config
summary: جادوگرهای راه‌اندازی، setup-entry.ts، طرح‌واره‌های پیکربندی، و فرادادهٔ package.json
title: راه‌اندازی و پیکربندی Plugin
x-i18n:
    generated_at: "2026-04-29T23:20:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92f470a5c7e8fe06b9244a737de80c0509b26aa983d05e60dd1689cc628fc90d
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع بسته‌بندی Plugin (فراداده‌ی `package.json`)، manifestها (`openclaw.plugin.json`)، ورودی‌های راه‌اندازی، و schemaهای پیکربندی.

<Tip>
**به دنبال یک راهنمای گام‌به‌گام هستید؟** راهنماهای کاربردی، بسته‌بندی را در بستر خودش پوشش می‌دهند: [Pluginهای کانال](/fa/plugins/sdk-channel-plugins#step-1-package-and-manifest) و [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## فراداده‌ی بسته

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
  <Tab title="Plugin ارائه‌دهنده / خط مبنای ClawHub">
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
  فایل‌های نقطه‌ی ورود (نسبت به ریشه‌ی بسته).
</ParamField>
<ParamField path="setupEntry" type="string">
  ورودی سبک فقط برای راه‌اندازی (اختیاری).
</ParamField>
<ParamField path="channel" type="object">
  فراداده‌ی کاتالوگ کانال برای سطوح راه‌اندازی، انتخاب‌گر، شروع سریع، و وضعیت.
</ParamField>
<ParamField path="providers" type="string[]">
  شناسه‌های ارائه‌دهنده که توسط این Plugin ثبت شده‌اند.
</ParamField>
<ParamField path="install" type="object">
  راهنمای نصب: `npmSpec`، `localPath`، `defaultChoice`، `minHostVersion`، `expectedIntegrity`، `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  پرچم‌های رفتار شروع به کار.
</ParamField>

### `openclaw.channel`

`openclaw.channel` فراداده‌ی سبک بسته برای کشف کانال و سطوح راه‌اندازی، پیش از بارگذاری زمان اجرا است.

| فیلد                                  | نوع       | معنای آن                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | شناسه‌ی مرجع کانال.                                                           |
| `label`                                | `string`   | برچسب اصلی کانال.                                                             |
| `selectionLabel`                       | `string`   | برچسب انتخاب‌گر/راه‌اندازی، وقتی باید با `label` متفاوت باشد.                 |
| `detailLabel`                          | `string`   | برچسب جزئیات ثانویه برای کاتالوگ‌های غنی‌تر کانال و سطوح وضعیت.              |
| `docsPath`                             | `string`   | مسیر مستندات برای پیوندهای راه‌اندازی و انتخاب.                              |
| `docsLabel`                            | `string`   | بازنویسی برچسب استفاده‌شده برای پیوندهای مستندات، وقتی باید با شناسه‌ی کانال متفاوت باشد. |
| `blurb`                                | `string`   | توضیح کوتاه برای ورود اولیه/کاتالوگ.                                          |
| `order`                                | `number`   | ترتیب مرتب‌سازی در کاتالوگ‌های کانال.                                         |
| `aliases`                              | `string[]` | نام‌های مستعار اضافی برای جست‌وجوی انتخاب کانال.                              |
| `preferOver`                           | `string[]` | شناسه‌های Plugin/کانال با اولویت پایین‌تر که این کانال باید نسبت به آن‌ها برتری داشته باشد. |
| `systemImage`                          | `string`   | نام اختیاری آیکن/تصویر سیستمی برای کاتالوگ‌های UI کانال.                     |
| `selectionDocsPrefix`                  | `string`   | متن پیشوند قبل از پیوندهای مستندات در سطوح انتخاب.                           |
| `selectionDocsOmitLabel`               | `boolean`  | نمایش مستقیم مسیر مستندات به‌جای پیوند مستندات برچسب‌دار در متن انتخاب.      |
| `selectionExtras`                      | `string[]` | رشته‌های کوتاه اضافی که به متن انتخاب افزوده می‌شوند.                         |
| `markdownCapable`                      | `boolean`  | کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان پشتیبان Markdown علامت‌گذاری می‌کند. |
| `exposure`                             | `object`   | کنترل‌های دیده‌شدن کانال برای سطوح راه‌اندازی، فهرست‌های پیکربندی‌شده، و مستندات. |
| `quickstartAllowFrom`                  | `boolean`  | این کانال را وارد جریان استاندارد راه‌اندازی شروع سریع `allowFrom` می‌کند.   |
| `forceAccountBinding`                  | `boolean`  | حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند.             |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | هنگام حل مقصدهای اعلام برای این کانال، جست‌وجوی نشست را ترجیح می‌دهد.        |

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

- `configured`: شامل کردن کانال در سطوح فهرست‌کردن سبک پیکربندی‌شده/وضعیت
- `setup`: شامل کردن کانال در انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی
- `docs`: علامت‌گذاری کانال به‌عنوان عمومی در سطوح مستندات/ناوبری

<Note>
`showConfigured` و `showInSetup` همچنان به‌عنوان نام‌های مستعار قدیمی پشتیبانی می‌شوند. `exposure` را ترجیح دهید.
</Note>

### `openclaw.install`

`openclaw.install` فراداده‌ی بسته است، نه فراداده‌ی manifest.

| فیلد                        | نوع                 | معنای آن                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | مشخصه‌ی مرجع npm برای جریان‌های نصب/به‌روزرسانی.                                |
| `localPath`                  | `string`             | مسیر توسعه‌ی محلی یا نصب بسته‌بندی‌شده.                                         |
| `defaultChoice`              | `"npm"` \| `"local"` | منبع نصب ترجیحی وقتی هر دو در دسترس باشند.                                      |
| `minHostVersion`             | `string`             | حداقل نسخه‌ی پشتیبانی‌شده‌ی OpenClaw در قالب `>=x.y.z`.                          |
| `expectedIntegrity`          | `string`             | رشته‌ی یکپارچگی مورد انتظار توزیع npm، معمولا `sha512-...`، برای نصب‌های سنجاق‌شده. |
| `allowInvalidConfigRecovery` | `boolean`            | به جریان‌های نصب دوباره‌ی Plugin بسته‌بندی‌شده اجازه می‌دهد از خطاهای مشخص پیکربندی کهنه بازیابی شوند. |

<AccordionGroup>
  <Accordion title="رفتار ورود اولیه">
    ورود اولیه‌ی تعاملی نیز از `openclaw.install` برای سطوح نصب برحسب نیاز استفاده می‌کند. اگر Plugin شما پیش از بارگذاری زمان اجرا گزینه‌های احراز هویت ارائه‌دهنده یا فراداده‌ی راه‌اندازی/کاتالوگ کانال را ارائه کند، ورود اولیه می‌تواند آن گزینه را نشان دهد، برای نصب npm یا محلی درخواست کند، Plugin را نصب یا فعال کند، سپس جریان انتخاب‌شده را ادامه دهد. گزینه‌های ورود اولیه‌ی npm به فراداده‌ی کاتالوگ مورد اعتماد با `npmSpec` رجیستری نیاز دارند؛ نسخه‌های دقیق و `expectedIntegrity` پین‌های اختیاری هستند. اگر `expectedIntegrity` وجود داشته باشد، جریان‌های نصب/به‌روزرسانی آن را اعمال می‌کنند. فراداده‌ی «چه چیزی نشان داده شود» را در `openclaw.plugin.json` و فراداده‌ی «چگونه نصب شود» را در `package.json` نگه دارید.
  </Accordion>
  <Accordion title="اعمال minHostVersion">
    اگر `minHostVersion` تنظیم شده باشد، هم نصب و هم بارگذاری رجیستری manifest آن را اعمال می‌کنند. میزبان‌های قدیمی‌تر Plugin را نادیده می‌گیرند؛ رشته‌های نسخه‌ی نامعتبر رد می‌شوند.
  </Accordion>
  <Accordion title="نصب‌های npm سنجاق‌شده">
    برای نصب‌های npm سنجاق‌شده، نسخه‌ی دقیق را در `npmSpec` نگه دارید و یکپارچگی artifact مورد انتظار را اضافه کنید:

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
  <Accordion title="دامنه‌ی allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` یک دورزدن عمومی برای پیکربندی‌های خراب نیست. فقط برای بازیابی محدود Plugin بسته‌بندی‌شده است، تا نصب دوباره/راه‌اندازی بتواند باقی‌مانده‌های شناخته‌شده‌ی ارتقا مانند مسیر ازدست‌رفته‌ی Plugin بسته‌بندی‌شده یا ورودی کهنه‌ی `channels.<id>` برای همان Plugin را تعمیر کند. اگر پیکربندی به دلایل نامرتبط خراب باشد، نصب همچنان بسته شکست می‌خورد و به اپراتور می‌گوید `openclaw doctor --fix` را اجرا کند.
  </Accordion>
</AccordionGroup>

### بارگذاری کامل معوق

Pluginهای کانال می‌توانند با این مورد، بارگذاری معوق را فعال کنند:

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

وقتی فعال باشد، OpenClaw در مرحله‌ی شروع پیش از گوش‌دادن، حتی برای کانال‌های ازقبل پیکربندی‌شده، فقط `setupEntry` را بارگذاری می‌کند. ورودی کامل پس از شروع گوش‌دادن Gateway بارگذاری می‌شود.

<Warning>
بارگذاری معوق را فقط زمانی فعال کنید که `setupEntry` شما هر چیزی را که Gateway پیش از شروع گوش‌دادن نیاز دارد ثبت می‌کند (ثبت کانال، مسیرهای HTTP، متدهای Gateway). اگر ورودی کامل مالک قابلیت‌های ضروری شروع به کار است، رفتار پیش‌فرض را نگه دارید.
</Warning>

اگر ورودی راه‌اندازی/کامل شما متدهای RPC Gateway را ثبت می‌کند، آن‌ها را روی یک پیشوند اختصاصی Plugin نگه دارید. فضای نام‌های مدیریتی رزرو‌شده‌ی هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) متعلق به هسته می‌مانند و همیشه به `operator.admin` حل می‌شوند.

## manifest Plugin

هر Plugin بومی باید یک `openclaw.plugin.json` در ریشه‌ی بسته ارسال کند. OpenClaw از آن برای اعتبارسنجی پیکربندی بدون اجرای کد Plugin استفاده می‌کند.

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

حتی Pluginهایی که پیکربندی ندارند نیز باید یک schema ارسال کنند. یک schema خالی معتبر است:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

برای مرجع کامل schema، [manifest Plugin](/fa/plugins/manifest) را ببینید.

## انتشار ClawHub

برای بسته‌های Plugin، از فرمان اختصاصی بسته‌ی ClawHub استفاده کنید:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
نام مستعار انتشار قدیمیِ فقط Skills برای Skills است. بسته‌های Plugin همیشه باید از `clawhub package publish` استفاده کنند.
</Note>

## ورودی راه‌اندازی

فایل `setup-entry.ts` جایگزینی سبک برای `index.ts` است که OpenClaw زمانی آن را بارگذاری می‌کند که فقط به سطوح راه‌اندازی نیاز دارد (ورود اولیه، تعمیر پیکربندی، بازرسی کانال غیرفعال).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

این کار از بارگذاری کد سنگین زمان اجرا (کتابخانه‌های رمزنگاری، ثبت‌های CLI، سرویس‌های پس‌زمینه) در طول جریان‌های راه‌اندازی جلوگیری می‌کند.

کانال‌های فضای کاری بسته‌بندی‌شده که exportهای ایمن برای راه‌اندازی را در ماژول‌های sidecar نگه می‌دارند، می‌توانند به‌جای `defineSetupPluginEntry(...)` از `defineBundledChannelSetupEntry(...)` در `openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن قرارداد بسته‌بندی‌شده همچنین از export اختیاری `runtime` پشتیبانی می‌کند تا سیم‌کشی زمان اجرا در زمان راه‌اندازی سبک و صریح بماند.

<AccordionGroup>
  <Accordion title="وقتی OpenClaw به‌جای ورودی کامل از setupEntry استفاده می‌کند">
    - کانال غیرفعال است اما به سطوح راه‌اندازی/معارفه نیاز دارد.
    - کانال فعال است اما پیکربندی نشده است.
    - بارگذاری با تأخیر فعال است (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry باید چه چیزی را ثبت کند">
    - شیء Plugin کانال (از طریق `defineSetupPluginEntry`).
    - هر مسیر HTTP که پیش از گوش‌دادن Gateway لازم است.
    - هر متد Gateway که هنگام شروع به کار لازم است.

    آن متدهای Gateway زمان شروع همچنان باید از فضای نام‌های ادمین هسته‌ای رزروشده مانند `config.*` یا `update.*` دوری کنند.

  </Accordion>
  <Accordion title="setupEntry نباید شامل چه چیزی باشد">
    - ثبت‌های CLI.
    - سرویس‌های پس‌زمینه.
    - importهای سنگین زمان اجرا (رمزنگاری، SDKها).
    - متدهای Gateway که فقط پس از شروع به کار لازم هستند.

  </Accordion>
</AccordionGroup>

### importهای محدود کمک‌کننده‌های راه‌اندازی

برای مسیرهای داغ فقط-راه‌اندازی، وقتی فقط به بخشی از سطح راه‌اندازی نیاز دارید، seamهای محدود کمک‌کننده راه‌اندازی را به چتر گسترده‌تر `plugin-sdk/setup` ترجیح دهید:

| مسیر import                        | کاربرد                                                                                | exportهای کلیدی                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | کمک‌کننده‌های زمان اجرای زمان راه‌اندازی که در `setupEntry` / شروع کانال با تأخیر در دسترس می‌مانند | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | آداپتورهای راه‌اندازی حساب آگاه از محیط                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | کمک‌کننده‌های CLI/آرشیو/مستندات برای راه‌اندازی/نصب                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

وقتی جعبه‌ابزار کامل راه‌اندازی مشترک را می‌خواهید، از جمله کمک‌کننده‌های وصله پیکربندی مانند `moveSingleAccountChannelSectionToDefaultAccount(...)`، از seam گسترده‌تر `plugin-sdk/setup` استفاده کنید.

آداپتورهای وصله راه‌اندازی هنگام import برای مسیر داغ ایمن می‌مانند. جست‌وجوی سطح قرارداد ارتقای تک‌حساب بسته‌بندی‌شده آن‌ها lazy است، بنابراین import کردن `plugin-sdk/setup-runtime` پیش از استفاده واقعی از آداپتور، کشف سطح قرارداد بسته‌بندی‌شده را به‌صورت مشتاقانه بارگذاری نمی‌کند.

### ارتقای تک‌حساب مالکیت‌شده توسط کانال

وقتی یک کانال از پیکربندی سطح‌بالای تک‌حساب به `channels.<id>.accounts.*` ارتقا پیدا می‌کند، رفتار مشترک پیش‌فرض این است که مقدارهای ارتقایافته دارای scope حساب به `accounts.default` منتقل شوند.

کانال‌های بسته‌بندی‌شده می‌توانند این ارتقا را از طریق سطح قرارداد راه‌اندازی خود محدود یا بازنویسی کنند:

- `singleAccountKeysToMove`: کلیدهای سطح‌بالای اضافی که باید به حساب ارتقایافته منتقل شوند
- `namedAccountPromotionKeys`: وقتی حساب‌های نام‌دار از قبل وجود دارند، فقط این کلیدها به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای سیاست/تحویل مشترک در ریشه کانال باقی می‌مانند
- `resolveSingleAccountPromotionTarget(...)`: انتخاب می‌کند کدام حساب موجود مقدارهای ارتقایافته را دریافت کند

<Note>
Matrix نمونه بسته‌بندی‌شده فعلی است. اگر دقیقاً یک حساب Matrix نام‌دار از قبل وجود داشته باشد، یا اگر `defaultAccount` به یک کلید غیرکانونی موجود مانند `Ops` اشاره کند، ارتقا همان حساب را حفظ می‌کند به‌جای اینکه ورودی جدید `accounts.default` بسازد.
</Note>

## طرح‌واره پیکربندی

پیکربندی Plugin در برابر JSON Schema موجود در manifest شما اعتبارسنجی می‌شود. کاربران Pluginها را از این راه پیکربندی می‌کنند:

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

برای پیکربندی ویژه کانال، به‌جای آن از بخش پیکربندی کانال استفاده کنید:

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

از `buildChannelConfigSchema` برای تبدیل یک طرح‌واره Zod به wrapper‏ `ChannelConfigSchema` استفاده کنید که توسط آرتیفکت‌های پیکربندی مالکیت‌شده توسط Plugin به کار می‌رود:

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

## جادوگرهای راه‌اندازی

Pluginهای کانال می‌توانند جادوگرهای راه‌اندازی تعاملی برای `openclaw onboard` ارائه کنند. جادوگر یک شیء `ChannelSetupWizard` روی `ChannelPlugin` است:

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
  <Accordion title="درخواست‌های مشترک allowFrom">
    برای درخواست‌های فهرست مجاز DM که فقط به جریان استاندارد `note -> prompt -> parse -> merge -> patch` نیاز دارند، کمک‌کننده‌های راه‌اندازی مشترک از `openclaw/plugin-sdk/setup` را ترجیح دهید: `createPromptParsedAllowFromForAccount(...)`، `createTopLevelChannelParsedAllowFromPrompt(...)` و `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="وضعیت استاندارد راه‌اندازی کانال">
    برای بلوک‌های وضعیت راه‌اندازی کانال که فقط بر اساس برچسب‌ها، امتیازها و خط‌های اضافی اختیاری تفاوت دارند، به‌جای ساخت دستی همان شیء `status` در هر Plugin، از `createStandardChannelSetupStatus(...)` در `openclaw/plugin-sdk/setup` استفاده کنید.
  </Accordion>
  <Accordion title="سطح اختیاری راه‌اندازی کانال">
    برای سطوح اختیاری راه‌اندازی که فقط باید در زمینه‌های خاص ظاهر شوند، از `createOptionalChannelSetupSurface` در `openclaw/plugin-sdk/channel-setup` استفاده کنید:

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

    `plugin-sdk/channel-setup` همچنین سازنده‌های سطح پایین‌تر `createOptionalChannelSetupAdapter(...)` و `createOptionalChannelSetupWizard(...)` را ارائه می‌کند، وقتی فقط به یک نیمه از آن سطح نصب اختیاری نیاز دارید.

    آداپتور/جادوگر اختیاری تولیدشده در نوشتن‌های واقعی پیکربندی به‌صورت بسته شکست می‌خورند. آن‌ها یک پیام نیازمند نصب را در `validateInput`، `applyAccountConfig` و `finalize` دوباره استفاده می‌کنند، و وقتی `docsPath` تنظیم شده باشد یک لینک مستندات اضافه می‌کنند.

  </Accordion>
  <Accordion title="کمک‌کننده‌های راه‌اندازی مبتنی بر باینری">
    برای UIهای راه‌اندازی مبتنی بر باینری، به‌جای کپی کردن همان چسب باینری/وضعیت در هر کانال، کمک‌کننده‌های واگذارشده مشترک را ترجیح دهید:

    - `createDetectedBinaryStatus(...)` برای بلوک‌های وضعیت که فقط بر اساس برچسب‌ها، راهنماها، امتیازها و تشخیص باینری تفاوت دارند
    - `createCliPathTextInput(...)` برای ورودی‌های متنی مبتنی بر مسیر
    - `createDelegatedSetupWizardStatusResolvers(...)`، `createDelegatedPrepare(...)`، `createDelegatedFinalize(...)` و `createDelegatedResolveConfigured(...)` وقتی `setupEntry` باید به‌صورت lazy به یک جادوگر کامل سنگین‌تر فوروارد کند
    - `createDelegatedTextInputShouldPrompt(...)` وقتی `setupEntry` فقط باید تصمیم `textInputs[*].shouldPrompt` را واگذار کند

  </Accordion>
</AccordionGroup>

## انتشار و نصب

**Pluginهای خارجی:** در [ClawHub](/fa/tools/clawhub) منتشر کنید، سپس نصب کنید:

<Tabs>
  <Tab title="خودکار (ابتدا ClawHub سپس npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw ابتدا ClawHub را امتحان می‌کند و به‌صورت خودکار به npm برمی‌گردد.

  </Tab>
  <Tab title="فقط ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مشخصات بسته npm">
    وقتی یک بسته هنوز به ClawHub منتقل نشده است، یا وقتی در طول مهاجرت به یک
    مسیر نصب مستقیم npm نیاز دارید، از npm استفاده کنید:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginهای داخل repo:** آن‌ها را زیر درخت فضای کاری Plugin بسته‌بندی‌شده قرار دهید تا هنگام build به‌صورت خودکار کشف شوند.

**کاربران می‌توانند نصب کنند:**

```bash
openclaw plugins install <package-name>
```

<Info>
برای نصب‌های منشأگرفته از npm، `openclaw plugins install` دستور `npm install --ignore-scripts` محلی پروژه را اجرا می‌کند (بدون اسکریپت‌های چرخه عمر)، و تنظیمات install سراسری npm به‌ارث‌رسیده را نادیده می‌گیرد. درخت‌های وابستگی Plugin را JS/TS خالص نگه دارید و از بسته‌هایی که به buildهای `postinstall` نیاز دارند دوری کنید.
</Info>

<Note>
Pluginهای همراهِ متعلق به OpenClaw تنها استثنای تعمیر هنگام راه‌اندازی هستند: وقتی یک نصب بسته‌بندی‌شده ببیند که یکی از آن‌ها از طریق پیکربندی Plugin، پیکربندی قدیمی کانال، یا manifest همراهِ دارای فعال‌سازی پیش‌فرض فعال شده است، راه‌اندازی پیش از import، وابستگی‌های runtime گم‌شدهٔ آن Plugin را نصب می‌کند. Pluginهای شخص ثالث نباید به نصب‌های هنگام راه‌اندازی تکیه کنند؛ همچنان از نصب‌کنندهٔ صریح Plugin استفاده کنید.
</Note>

وابستگی‌های runtime در سطح بستهٔ همراه، فرادادهٔ صریح هستند و از JavaScript ساخته‌شده هنگام راه‌اندازی Gateway استنباط نمی‌شوند. اگر یک وابستگی مشترک ریشهٔ OpenClaw باید داخل آینهٔ runtime خارجی Plugin همراه در دسترس باشد، آن را در `openclaw.bundle.mirroredRootRuntimeDependencies` در manifest بستهٔ ریشه اعلام کنید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — راهنمای گام‌به‌گام برای شروع
- [manifest Plugin](/fa/plugins/manifest) — مرجع کامل طرح‌وارهٔ manifest
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
