---
read_when:
    - نصب یا پیکربندی Plugin‌ها
    - درک قوانین کشف و بارگذاری Plugin
    - کار با بسته‌های Pluginِ سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Plugin‌های OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-10T20:12:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
مهارهای عامل، ابزارها، Skills، گفتار، رونویسی بلادرنگ، صدای بلادرنگ،
درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، جست‌وجوی وب،
و موارد بیشتر. برخی Pluginها **هسته‌ای** هستند (همراه OpenClaw ارائه می‌شوند)، برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/clawhub) منتشر و کشف می‌شوند. Npm همچنان برای نصب‌های مستقیم و برای
مجموعه‌ای موقت از بسته‌های Plugin تحت مالکیت OpenClaw تا پایان این مهاجرت پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی و انتشار که قابل کپی و جای‌گذاری هستند، به
[مدیریت Pluginها](/fa/plugins/manage-plugins) مراجعه کنید.

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    سپس در فایل پیکربندی خود، زیر `plugins.entries.\<id\>.config` پیکربندی کنید.

  </Step>

  <Step title="Chat-native management">
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` که فقط برای مالک هستند
    بارگذار مجدد پیکربندی Gateway را فعال می‌کنند. Gateway سطح‌های زمان اجرای Plugin را
    در همان فرایند دوباره بارگذاری می‌کند، و نوبت‌های جدید عامل فهرست ابزارهای خود را از
    رجیستری تازه‌سازی‌شده بازسازی می‌کنند. `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین
    Gateway به‌جای وانمود کردن به اینکه فرایند فعلی می‌تواند
    ماژول‌های از پیش import شده را با ایمنی دوباره بارگذاری کند، درخواست راه‌اندازی مجدد می‌دهد.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی باید ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway،
    hookها، یا فرمان‌های CLI تحت مالکیت Plugin را اثبات کنید از `--runtime` استفاده کنید. `inspect` ساده یک بررسی سرد
    manifest/registry است و عمداً از import کردن زمان اجرای Plugin پرهیز می‌کند.

  </Step>
</Steps>

اگر کنترل بومیِ چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver استفاده می‌کند که CLI استفاده می‌کند: مسیر/آرشیو محلی، صریح
`clawhub:<pkg>`، صریح `npm:<pkg>`، صریح `npm-pack:<path.tgz>`،
صریح `git:<repo>`، یا مشخصه بسته بدون پیشوند از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولاً به‌صورت بسته شکست می‌خورد و شما را به
`openclaw doctor --fix` ارجاع می‌دهد. تنها استثنای بازیابی، یک مسیر باریک نصب مجدد Plugin همراه
برای Pluginهایی است که در
`openclaw.install.allowInvalidConfigRecovery` opt in می‌کنند.
هنگام راه‌اندازی Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری
به‌صورت بسته شکست می‌خورد. `openclaw doctor --fix` را اجرا کنید تا پیکربندی بد Plugin را با
غیرفعال کردن آن ورودی Plugin و حذف payload پیکربندی نامعتبرش قرنطینه کند؛ backup عادی
پیکربندی مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی کانال به Pluginی اشاره می‌کند که دیگر قابل کشف نیست اما همان
شناسه قدیمی Plugin در پیکربندی Plugin یا رکوردهای نصب باقی مانده است، راه‌اندازی Gateway
هشدارها را log می‌کند و به‌جای مسدود کردن همه کانال‌های دیگر، آن کانال را رد می‌کند.
`openclaw doctor --fix` را اجرا کنید تا ورودی‌های قدیمی کانال/Plugin حذف شوند؛ کلیدهای ناشناخته
کانال بدون شواهد Plugin قدیمی همچنان در اعتبارسنجی شکست می‌خورند تا غلط‌های تایپی
قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های قدیمی Plugin بی‌اثر تلقی می‌شوند:
راه‌اندازی Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor`
به‌جای حذف خودکار، پیکربندی غیرفعال Plugin را حفظ می‌کند. اگر می‌خواهید شناسه‌های قدیمی Plugin حذف شوند،
پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط در جریان‌های نصب/به‌روزرسانی صریح یا
تعمیر doctor انجام می‌شود. راه‌اندازی Gateway، بارگذاری مجدد پیکربندی، و بازرسی زمان اجرا
مدیر بسته اجرا نمی‌کنند یا درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای محلی باید از قبل
وابستگی‌هایشان نصب شده باشد، در حالی که Pluginهای npm، git و ClawHub
زیر ریشه‌های Plugin مدیریت‌شده OpenClaw نصب می‌شوند. وابستگی‌های npm ممکن است
در ریشه npm مدیریت‌شده OpenClaw hoist شوند؛ نصب/به‌روزرسانی آن ریشه مدیریت‌شده را پیش از
اعتماد اسکن می‌کند و حذف نصب، بسته‌های مدیریت‌شده با npm را از طریق npm حذف می‌کند. Pluginهای خارجی
و مسیرهای بارگذاری سفارشی همچنان باید از طریق `openclaw plugins install` نصب شوند.
برای دیدن `dependencyStatus` ایستا برای هر
Plugin قابل مشاهده بدون import کردن کد زمان اجرا یا تعمیر وابستگی‌ها، از `openclaw plugins list --json` استفاده کنید.
برای چرخه عمر زمان نصب، [حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

### مالکیت مسیر Plugin مسدودشده

اگر diagnostics Plugin بگوید
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
و اعتبارسنجی پیکربندی با `plugin present but blocked` دنبال شود، OpenClaw
فایل‌های Pluginی را پیدا کرده است که مالکشان کاربر Unix متفاوتی از فرایندی است که آن‌ها را بارگذاری می‌کند.
پیکربندی Plugin را نگه دارید؛ مالکیت filesystem را اصلاح کنید یا
OpenClaw را با همان کاربری اجرا کنید که مالک دایرکتوری state است.

برای نصب‌های Docker، image رسمی با کاربر `node` (uid `1000`) اجرا می‌شود، بنابراین
دایرکتوری‌های پیکربندی و workspace متعلق به OpenClaw که روی میزبان bind-mount شده‌اند معمولاً باید
متعلق به uid `1000` باشند:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

اگر عمداً OpenClaw را به‌عنوان root اجرا می‌کنید، به‌جای آن ریشه مدیریت‌شده Plugin را به
مالکیت root تعمیر کنید:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

پس از اصلاح مالکیت، `openclaw doctor --fix` یا
`openclaw plugins registry --refresh` را دوباره اجرا کنید تا رجیستری ماندگار Plugin با
فایل‌های تعمیرشده هم‌خوان شود.

برای نصب‌های npm، selectorهای تغییرپذیر مانند `latest` یا یک dist-tag پیش از نصب resolve
می‌شوند و سپس در ریشه npm مدیریت‌شده OpenClaw به نسخه دقیق تأییدشده pin می‌شوند. پس از پایان کار npm، OpenClaw تأیید می‌کند که ورودی
`package-lock.json` نصب‌شده همچنان با نسخه و integrity resolve‌شده مطابقت دارد. اگر
npm metadata متفاوتی برای بسته بنویسد، نصب شکست می‌خورد و بسته مدیریت‌شده
به‌جای پذیرش artifact متفاوت Plugin، rollback می‌شود.
ریشه‌های مدیریت‌شده npm همچنین `overrides` سطح بسته npm متعلق به OpenClaw را به ارث می‌برند، بنابراین
pinهای امنیتی که از میزبان بسته‌بندی‌شده محافظت می‌کنند، روی وابستگی‌های Plugin خارجی
hoist شده نیز اعمال می‌شوند.

checkoutهای منبع، workspaceهای pnpm هستند. اگر OpenClaw را برای کار روی Pluginهای همراه clone می‌کنید،
`pnpm install` را اجرا کنید؛ سپس OpenClaw Pluginهای همراه را از
`extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و وابستگی‌های محلی بسته مستقیماً استفاده شوند.
نصب‌های ساده ریشه npm برای OpenClaw بسته‌بندی‌شده هستند، نه برای توسعه
checkout منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را می‌شناسد:

| قالب     | نحوه کار                                                       | نمونه‌ها                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **بومی** | `openclaw.plugin.json` + ماژول زمان اجرا؛ درون فرایند اجرا می‌شود       | Pluginهای رسمی، بسته‌های npm جامعه               |
| **باندل** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات باندل، [باندل‌های Plugin](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin بومی هستید، از [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## entrypointهای بسته

بسته‌های npm Plugin بومی باید `openclaw.extensions` را در `package.json` اعلام کنند.
هر ورودی باید داخل دایرکتوری بسته بماند و به یک
فایل زمان اجرای خواندنی resolve شود، یا به یک فایل منبع TypeScript با همتای JavaScript
ساخته‌شده استنباط‌شده، مانند `src/index.ts` به `dist/index.js`.
نصب‌های بسته‌بندی‌شده باید آن خروجی زمان اجرای JavaScript را همراه داشته باشند. fallback منبع
TypeScript برای checkoutهای منبع و مسیرهای توسعه محلی است، نه برای
بسته‌های npm نصب‌شده در ریشه Plugin مدیریت‌شده OpenClaw.

اگر هشداری برای بسته مدیریت‌شده می‌گوید که `requires compiled runtime output for
TypeScript entry ...`، بسته بدون فایل‌های JavaScriptی منتشر شده که
OpenClaw در زمان اجرا نیاز دارد. این یک مشکل بسته‌بندی Plugin است، نه مشکل پیکربندی محلی.
پس از اینکه ناشر JavaScript کامپایل‌شده را دوباره منتشر کرد، Plugin را به‌روزرسانی یا دوباره نصب کنید،
یا تا زمانی که بسته اصلاح‌شده در دسترس شود، آن Plugin را غیرفعال/حذف نصب کنید.

وقتی فایل‌های زمان اجرای منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند، از `openclaw.runtimeExtensions` استفاده کنید.
وقتی وجود داشته باشد، `runtimeExtensions` باید دقیقاً
یک ورودی برای هر ورودی `extensions` داشته باشد. فهرست‌های ناسازگار به‌جای fallback بی‌صدا به مسیرهای منبع، نصب و
کشف Plugin را ناموفق می‌کنند. اگر
`openclaw.setupEntry` را هم منتشر می‌کنید، برای همتای JavaScript ساخته‌شده آن از `openclaw.runtimeSetupEntry` استفاده کنید؛ آن فایل در صورت اعلام شدن الزامی است.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Pluginهای رسمی

### بسته‌های npm تحت مالکیت OpenClaw در زمان مهاجرت

ClawHub مسیر توزیع اصلی برای بیشتر Pluginها است. نسخه‌های بسته‌بندی‌شده فعلی
OpenClaw از قبل بسیاری از Pluginهای رسمی را bundle می‌کنند، بنابراین در راه‌اندازی‌های معمول به نصب npm جداگانه
نیاز ندارند. تا زمانی که هر Plugin تحت مالکیت OpenClaw
به ClawHub مهاجرت نکرده است، OpenClaw همچنان برخی بسته‌های Plugin با نام `@openclaw/*` را روی
npm برای نصب‌های قدیمی‌تر/سفارشی و workflowهای مستقیم npm منتشر می‌کند.

اگر npm یک بسته Plugin با نام `@openclaw/*` را deprecated گزارش کند، آن نسخه بسته
از یک قطار بسته خارجی قدیمی‌تر است. تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه در
OpenClaw فعلی یا یک checkout محلی استفاده کنید.

| Plugin          | بسته                    | مستندات                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| Discord         | `@openclaw/discord`        | [Discord](/fa/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/fa/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/fa/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/fa/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/fa/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/fa/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/fa/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/fa/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/fa/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/fa/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/fa/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/fa/plugins/zalouser)         |

### هسته (همراه OpenClaw ارائه می‌شود)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginهای حافظه">
    - `memory-core` - جست‌وجوی حافظهٔ همراه‌شده (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` - حافظهٔ بلندمدت مبتنی بر LanceDB با یادآوری/ثبت خودکار (تنظیم کنید `plugins.slots.memory = "memory-lancedb"`)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های یادآوری، و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌طور پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر موارد">
    - `browser` - Plugin مرورگر همراه‌شده برای ابزار مرورگر، CLI‏ `openclaw browser`، روش Gateway‏ `browser.request`، زمان اجرای مرورگر، و سرویس کنترل مرورگر پیش‌فرض (به‌طور پیش‌فرض فعال است؛ پیش از جایگزینی آن را غیرفعال کنید)
    - `copilot-proxy` - پل VS Code Copilot Proxy (به‌طور پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

به‌دنبال Pluginهای شخص ثالث هستید؟ [ClawHub](/fa/clawhub) را ببینید.

## پیکربندی

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| فیلد              | توضیح                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | کلید اصلی فعال/غیرفعال‌سازی (پیش‌فرض: `true`)                           |
| `allow`            | فهرست مجاز Pluginها (اختیاری)                               |
| `bundledDiscovery` | حالت کشف Plugin همراه‌شده (به‌طور پیش‌فرض `allowlist`)    |
| `deny`             | فهرست مسدود Pluginها (اختیاری؛ مسدودسازی اولویت دارد)                     |
| `load.paths`       | فایل‌ها/دایرکتوری‌های اضافی Plugin                            |
| `slots`            | انتخابگرهای شکاف انحصاری (مانند `memory`، `contextEngine`) |
| `entries.\<id\>`   | کلیدهای فعال/غیرفعال‌سازی + پیکربندی برای هر Plugin                               |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Pluginهای فهرست‌شده می‌توانند بارگذاری شوند یا ابزارها را آشکار کنند، حتی اگر `tools.allow` شامل `"*"` یا نام ابزار مشخصی متعلق به یک Plugin باشد. اگر فهرست مجاز ابزار به ابزارهای Plugin ارجاع می‌دهد، شناسه‌های Plugin مالک را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` دربارهٔ این شکل هشدار می‌دهد.

برای پیکربندی‌های جدید، مقدار پیش‌فرض `plugins.bundledDiscovery` برابر `"allowlist"` است، بنابراین یک موجودی محدودکنندهٔ `plugins.allow` همچنین Pluginهای ارائه‌دهندهٔ همراه‌شدهٔ حذف‌شده را مسدود می‌کند، از جمله کشف ارائه‌دهندهٔ جست‌وجوی وب در زمان اجرا. Doctor هنگام مهاجرت، پیکربندی‌های قدیمی‌ترِ دارای فهرست مجاز محدودکننده را با `"compat"` نشان‌گذاری می‌کند تا ارتقاها رفتار قدیمی ارائه‌دهندهٔ همراه‌شده را نگه دارند، تا زمانی که اپراتور حالت سخت‌گیرانه‌تر را انتخاب کند. `plugins.allow` خالی همچنان تنظیم‌نشده/باز در نظر گرفته می‌شود.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، بارگذاری مجدد درون‌فرایندی Pluginهای Gateway را فعال می‌کنند. نوبت‌های جدید عامل، فهرست ابزارهای خود را از رجیستری Plugin تازه‌سازی‌شده بازسازی می‌کنند. عملیات‌هایی که منبع را تغییر می‌دهند، مانند نصب، به‌روزرسانی، و حذف نصب، همچنان فرایند Gateway را راه‌اندازی مجدد می‌کنند، چون ماژول‌های Plugin که قبلاً import شده‌اند را نمی‌توان با ایمنی درجا جایگزین کرد.

`openclaw plugins list` یک نماگرفت محلی از رجیستری/پیکربندی Plugin است. یک Plugin با وضعیت `enabled` در آنجا یعنی رجیستری ماندگارشده و پیکربندی فعلی اجازه می‌دهند Plugin مشارکت کند. این ثابت نمی‌کند که یک Gateway راه‌دورِ از قبل در حال اجرا، با همان کد Plugin دوباره بارگذاری یا راه‌اندازی مجدد شده است. در راه‌اندازی‌های VPS/کانتینری با فرایندهای wrapper، راه‌اندازی مجدد یا نوشتارهای فعال‌کنندهٔ بارگذاری مجدد را به فرایند واقعی `openclaw gateway run` بفرستید، یا وقتی بارگذاری مجدد خطا گزارش می‌کند، از `openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال در برابر مفقود در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به شناسهٔ Pluginی ارجاع می‌دهد که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده سازگار نیست. شروع Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند با غیرفعال کردن ورودی نامعتبر و حذف payload پیکربندی آن، ورودی را قرنطینه کند.

</Accordion>

## کشف و تقدم

OpenClaw به این ترتیب به‌دنبال Pluginها می‌گردد (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` - مسیرهای فایل یا دایرکتوری صریح. مسیرهایی که به دایرکتوری‌های Plugin همراه‌شدهٔ بسته‌بندی‌شدهٔ خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛ برای حذف آن aliasهای قدیمی، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه‌شده">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌طور پیش‌فرض فعال‌اند (ارائه‌دهندگان مدل، گفتار).
    بقیه به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولاً Pluginهای همراه‌شده را از درخت کامپایل‌شدهٔ `dist/extensions` resolve می‌کنند. اگر یک دایرکتوری منبع Plugin همراه‌شده روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount شود، برای مثال `/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mountشده را به‌عنوان overlay منبع همراه‌شده در نظر می‌گیرد و آن را پیش از bundle بسته‌بندی‌شدهٔ `/app/dist/extensions/synology-chat` کشف می‌کند. این کار loopهای کانتینری نگه‌دارندگان را بدون برگرداندن هر Plugin همراه‌شده به منبع TypeScript فعال نگه می‌دارد. برای اجبار به استفاده از bundleهای dist بسته‌بندی‌شده حتی وقتی mountهای overlay منبع وجود دارند، `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همهٔ Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow غلبه می‌کند
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهای با منشأ workspace **به‌طور پیش‌فرض غیرفعال‌اند** (باید صریحاً فعال شوند)
- Pluginهای همراه‌شده از مجموعهٔ پیش‌فرضِ فعالِ داخلی پیروی می‌کنند مگر اینکه override شوند
- شکاف‌های انحصاری می‌توانند Plugin انتخاب‌شده برای آن شکاف را به‌اجبار فعال کنند
- بعضی Pluginهای همراه‌شدهٔ opt-in وقتی پیکربندی یک سطح متعلق به Plugin را نام می‌برد، به‌طور خودکار فعال می‌شوند؛ مانند ref مدل ارائه‌دهنده، پیکربندی کانال، یا زمان اجرای harness
- پیکربندی قدیمی Plugin تا زمانی که `plugins.enabled: false` فعال است حفظ می‌شود؛ اگر می‌خواهید شناسه‌های قدیمی حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای Codex خانوادهٔ OpenAI مرزهای Plugin جداگانه را نگه می‌دارند:
  `openai-codex/*` متعلق به Plugin OpenAI است، در حالی که Plugin app-server همراه‌شدهٔ Codex توسط refهای عامل canonical‏ `openai/*`، `agentRuntime.id: "codex"` صریح provider/model، یا refهای مدل قدیمی `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای زمان اجرا

اگر یک Plugin در `plugins list` ظاهر می‌شود اما اثرهای جانبی یا hookهای `register(api)` در ترافیک گفت‌وگوی زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال Gateway، profile، مسیر پیکربندی، و فرایند همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را راه‌اندازی مجدد کنید. در کانتینرهای wrapper، PID 1 ممکن است فقط یک supervisor باشد؛ فرایند فرزند `openclaw gateway run` را راه‌اندازی مجدد کنید یا به آن signal بفرستید.
- برای تأیید ثبت hookها و diagnostics از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. hookهای گفت‌وگوی غیرهمراه‌شده مانند `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تعویض مدل، `before_model_resolve` را ترجیح دهید. این مورد پیش از resolve مدل برای نوبت‌های عامل اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل، خروجی دستیار تولید کند.
- برای اثبات مدل مؤثر session، از `openclaw sessions` یا سطح‌های session/status در Gateway استفاده کنید و هنگام debug کردن payloadهای ارائه‌دهنده، Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### راه‌اندازی کند ابزار Plugin

اگر به‌نظر می‌رسد نوبت‌های عامل هنگام آماده‌سازی ابزارها متوقف می‌شوند، ثبت لاگ trace را فعال کنید و خطوط زمان‌بندی factory ابزار Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

به‌دنبال این باشید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند، شامل شناسهٔ Plugin، نام‌های اعلام‌شدهٔ ابزار، شکل نتیجه، و اینکه ابزار اختیاری است یا نه. وقتی یک factory حداقل 1s طول بکشد یا آماده‌سازی کل factory ابزار Plugin حداقل 5s طول بکشد، خطوط کند به هشدار ارتقا می‌یابند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolveهای تکراری با همان زمینهٔ مؤثر درخواست cache می‌کند. کلید cache شامل پیکربندی مؤثر runtime، workspace، شناسه‌های عامل/session، سیاست sandbox، تنظیمات مرورگر، زمینهٔ delivery، هویت درخواست‌کننده، و وضعیت مالکیت است، بنابراین factoryهایی که به آن فیلدهای مورد اعتماد وابسته‌اند هنگام تغییر زمینه دوباره اجرا می‌شوند.

اگر یک Plugin بر زمان‌بندی غالب است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید بارگذاری وابستگی‌های پرهزینه را به پشت مسیر اجرای ابزار منتقل کنند، نه اینکه آن را داخل factory ابزار انجام دهند.

### مالکیت تکراری کانال یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان کانال، جریان راه‌اندازی، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin کانال خارجی کنار یک Plugin همراه‌شده است که اکنون همان شناسهٔ کانال را فراهم می‌کند.

مراحل debug:

- `openclaw plugins list --enabled --verbose` را اجرا کنید تا هر Plugin فعال و منشأ آن را ببینید.
- برای هر Plugin مشکوک `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و `channels`، `channelConfigs`، `tools`، و diagnostics را مقایسه کنید.
- پس از نصب یا حذف packageهای Plugin، `openclaw plugins registry --refresh` را اجرا کنید تا metadata ماندگارشده نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، رجیستری، یا پیکربندی، Gateway را راه‌اندازی مجدد کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً برای همان شناسهٔ کانال جایگزین دیگری می‌شود، Plugin ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسهٔ Plugin کم‌اولویت‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب قدیمی Plugin را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را نگه می‌دارد و تعارض را گزارش می‌کند. یک مالک برای کانال انتخاب کنید یا ابزارهای متعلق به Plugin را تغییر نام دهید تا سطح runtime مبهم نباشد.

## شکاف‌های Plugin (دسته‌های انحصاری)

بعضی دسته‌ها انحصاری‌اند (در هر زمان فقط یکی فعال است):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| شکاف            | آنچه کنترل می‌کند      | پیش‌فرض             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin حافظهٔ فعال  | `memory-core`       |
| `contextEngine` | موتور زمینهٔ فعال | `legacy` (داخلی) |

## مرجع CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری از آن‌ها به‌صورت پیش‌فرض فعال هستند (برای نمونه
ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه). سایر Pluginهای همراه هنوز به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا بسته hook موجود را در همان محل بازنویسی می‌کند. برای ارتقاهای معمول Pluginهای npm ردیابی‌شده از
`openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون `--link` به‌جای کپی کردن روی مقصد نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال‌سازی به آن allowlist اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، install آن ورودی deny قدیمی را حذف می‌کند تا نصب صریح بلافاصله پس از راه‌اندازی دوباره قابل بارگذاری باشد.

OpenClaw یک رجیستری Plugin محلی پایدار را به‌عنوان مدل خواندن سرد برای موجودی Plugin، مالکیت مشارکت‌ها و برنامه‌ریزی startup نگه می‌دارد. جریان‌های install، update، uninstall، enable و disable پس از تغییر وضعیت Plugin آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فراداده نصب ماندگار را در `installRecords` سطح بالا و فراداده manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر رجیستری وجود نداشته باشد، قدیمی باشد، یا نامعتبر باشد، `openclaw plugins registry
--refresh` نمای manifest آن را از رکوردهای نصب، سیاست config، و فراداده manifest/package بدون بارگذاری ماژول‌های runtime Plugin بازسازی می‌کند.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه‌عمر Plugin غیرفعال هستند.
در عوض، انتخاب package و config مربوط به Plugin را از طریق منبع Nix برای نصب مدیریت کنید؛ برای nix-openclaw، با
[شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) مبتنی بر agent شروع کنید.
`openclaw plugins update <id-or-npm-spec>` روی نصب‌های ردیابی‌شده اعمال می‌شود. ارسال یک spec بسته npm با dist-tag یا نسخه دقیق، نام بسته را به رکورد Plugin ردیابی‌شده برمی‌گرداند و spec جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند. ارسال نام بسته بدون نسخه، یک نصب exact pinned را به خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin نصب‌شده npm از قبل با نسخه resolve‌شده و هویت artifact ثبت‌شده برابر باشد، OpenClaw بدون دانلود، نصب دوباره یا بازنویسی config از به‌روزرسانی صرف‌نظر می‌کند.
وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای Plugin پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند و وقتی هیچ انتشار beta برای Plugin وجود نداشته باشد به default/latest برمی‌گردند. نسخه‌های دقیق و tagهای صریح pinned باقی می‌مانند.

`--pin` فقط برای npm است. این گزینه با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec مربوط به npm، فراداده منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای مثبت‌های کاذب از scanner داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌ها و به‌روزرسانی‌های Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست scan را دور نمی‌زند.
scanهای install فایل‌ها و پوشه‌های تست رایج مانند `tests/`، `__tests__/`، `*.test.*` و `*.spec.*` را نادیده می‌گیرند تا mockهای تست بسته‌بندی‌شده باعث مسدود شدن نشوند؛ entrypointهای runtime اعلام‌شده Plugin همچنان scan می‌شوند حتی اگر از یکی از آن نام‌ها استفاده کنند.

این پرچم CLI فقط روی جریان‌های install/update مربوط به Plugin اعمال می‌شود. نصب‌های وابستگی Skills مبتنی بر Gateway به‌جای آن از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان جریان جداگانه دانلود/نصب Skills از ClawHub باقی می‌ماند.

اگر Pluginی که در ClawHub منتشر کرده‌اید به‌دلیل یک scan پنهان یا مسدود شده است، داشبورد ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط نصب‌ها روی ماشین خودتان را تحت تأثیر قرار می‌دهد؛ از ClawHub نمی‌خواهد Plugin را دوباره scan کند یا یک انتشار مسدودشده را عمومی کند.

بسته‌های سازگار در همان جریان list/inspect/enable/disable مربوط به Plugin شرکت می‌کنند. پشتیبانی فعلی runtime شامل Skills بسته، command-skillهای Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های Claude `.lsp.json` و `lspServers` اعلام‌شده در manifest، command-skillهای Cursor و دایرکتوری‌های hook سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های بسته شناسایی‌شده، به‌علاوه ورودی‌های server مربوط به MCP و LSP پشتیبانی‌شده یا پشتیبانی‌نشده برای Pluginهای پشتیبانی‌شده با بسته را گزارش می‌کند.

منابع marketplace می‌توانند یک نام marketplace شناخته‌شده Claude از
`~/.claude/plugins/known_marketplaces.json`، یک root محلی marketplace یا مسیر
`marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL مخزن گیت‌هاب، یا یک URL git باشند. برای marketplaceهای remote، ورودی‌های Plugin باید داخل مخزن marketplace clone‌شده باقی بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API Plugin

Pluginهای بومی یک شیء entry صادر می‌کنند که `register(api)` را در دسترس می‌گذارد. Pluginهای قدیمی‌تر ممکن است هنوز از `activate(api)` به‌عنوان alias قدیمی استفاده کنند، اما Pluginهای جدید باید از `register` استفاده کنند.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw شیء entry را بارگذاری می‌کند و هنگام فعال‌سازی Plugin، `register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` fallback می‌کند، اما Pluginهای همراه و Pluginهای خارجی جدید باید `register` را به‌عنوان قرارداد عمومی در نظر بگیرند.

`api.registrationMode` به یک Plugin می‌گوید چرا entry آن در حال بارگذاری است:

| Mode            | معنی                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | فعال‌سازی runtime. ابزارها، hookها، serviceها، commandها، routeها و سایر اثرات جانبی live را ثبت کنید.                              |
| `discovery`     | کشف قابلیت فقط‌خواندنی. ارائه‌دهندگان و فراداده را ثبت کنید؛ کد entry مورد اعتماد Plugin ممکن است بارگذاری شود، اما اثرات جانبی live را رد کنید. |
| `setup-only`    | بارگذاری فراداده setup کانال از طریق یک entry سبک setup.                                                                |
| `setup-runtime` | بارگذاری setup کانال که به entry مربوط به runtime نیز نیاز دارد.                                                                         |
| `cli-metadata`  | فقط گردآوری فراداده commandهای CLI.                                                                                            |

entryهای Plugin که socket، database، workerهای پس‌زمینه یا clientهای بلندمدت باز می‌کنند، باید آن اثرات جانبی را با `api.registrationMode === "full"` محافظت کنند.
بارگذاری‌های discovery جدا از بارگذاری‌های activation cache می‌شوند و جایگزین رجیستری در حال اجرای Gateway نمی‌شوند. discovery غیر‌فعال‌کننده است، اما import-free نیست:
OpenClaw ممکن است entry مورد اعتماد Plugin یا ماژول Plugin کانال را برای ساخت snapshot ارزیابی کند. سطح بالای ماژول را سبک و بدون اثر جانبی نگه دارید و clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و startup سرویس را پشت مسیرهای full-runtime منتقل کنید.

روش‌های رایج ثبت:

| Method                                  | آنچه ثبت می‌کند           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ارائه‌دهنده مدل (LLM)        |
| `registerChannel`                       | کانال chat                |
| `registerTool`                          | ابزار agent                  |
| `registerHook` / `on(...)`              | hookهای چرخه‌عمر             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT streaming               |
| `registerRealtimeVoiceProvider`         | صدای realtime دوطرفه       |
| `registerMediaUnderstandingProvider`    | تحلیل image/audio        |
| `registerImageGenerationProvider`       | تولید image            |
| `registerMusicGenerationProvider`       | تولید music            |
| `registerVideoGenerationProvider`       | تولید video            |
| `registerWebFetchProvider`              | ارائه‌دهنده web fetch / scrape |
| `registerWebSearchProvider`             | جستجوی web                  |
| `registerHttpRoute`                     | endpoint HTTP               |
| `registerCommand` / `registerCli`       | commandهای CLI                |
| `registerContextEngine`                 | engine متناظر context              |
| `registerService`                       | سرویس پس‌زمینه          |

رفتار guard مربوط به hookهای چرخه‌عمر typed:

- `before_tool_call`: `{ block: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

اجرای بومی سرور برنامه‌ی Codex رخدادهای ابزار بومیِ Codex را دوباره به این سطح هوک متصل می‌کند. Pluginها می‌توانند ابزارهای بومیِ Codex را از طریق `before_tool_call` مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند، و در تأییدهای `PermissionRequest` متعلق به Codex مشارکت داشته باشند. این پل هنوز آرگومان‌های ابزار بومیِ Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی زمان اجرای Codex در [قرارداد پشتیبانی نسخه ۱ هارنس Codex](/fa/plugins/codex-harness-runtime#v1-support-contract) قرار دارد.

برای رفتار کامل هوک‌های دارای نوع، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) - Plugin خودتان را بسازید
- [باندل‌های Plugin](/fa/plugins/bundles) - سازگاری باندل Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) - طرح‌واره‌ی مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) - افزودن ابزارهای عامل در یک Plugin
- [جزئیات داخلی Plugin](/fa/plugins/architecture) - مدل قابلیت و خط لوله‌ی بارگذاری
- [ClawHub](/fa/clawhub) - کشف Pluginهای شخص ثالث
