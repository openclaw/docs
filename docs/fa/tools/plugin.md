---
read_when:
    - نصب یا پیکربندی Pluginها
    - آشنایی با قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: نصب، پیکربندی و مدیریت Plugin‌های OpenClaw
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-12T08:48:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
هارنس‌های عامل، ابزارها، Skills، گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ،
درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، جستجوی وب و موارد بیشتر.
برخی Pluginها **هسته‌ای** هستند (همراه OpenClaw ارائه می‌شوند)، و برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/clawhub) منتشر و کشف می‌شوند. Npm همچنان برای نصب‌های مستقیم و برای
مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا زمان تکمیل آن مهاجرت
پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های آماده کپی‌کردن نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی و انتشار، به
[مدیریت Pluginها](/fa/plugins/manage-plugins) مراجعه کنید.

<Steps>
  <Step title="ببینید چه چیزی بارگذاری شده است">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="نصب یک Plugin">
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

  <Step title="راه‌اندازی دوباره Gateway">
    ```bash
    openclaw gateway restart
    ```

    سپس در فایل پیکربندی خود، زیر `plugins.entries.\<id\>.config` پیکربندی کنید.

  </Step>

  <Step title="مدیریت بومی چت">
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` که فقط
    مالک مجاز به استفاده از آن‌هاست، بارگذار مجدد پیکربندی Gateway را فعال
    می‌کنند. Gateway سطح‌های runtime مربوط به Plugin را درون همان فرایند دوباره
    بارگذاری می‌کند، و نوبت‌های جدید عامل فهرست ابزارهای خود را از رجیستری
    تازه‌سازی‌شده دوباره می‌سازند. `/plugins install` کد منبع Plugin را تغییر
    می‌دهد، بنابراین Gateway به‌جای وانمود کردن به اینکه فرایند فعلی می‌تواند
    ماژول‌های از قبل importشده را با اطمینان دوباره بارگذاری کند، درخواست
    راه‌اندازی دوباره می‌دهد.

  </Step>

  <Step title="تأیید Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway، hookها یا
    فرمان‌های CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید.
    `inspect` ساده یک بررسی سرد manifest/registry است و عمداً از import کردن
    runtime مربوط به Plugin خودداری می‌کند.

  </Step>
</Steps>

اگر کنترل بومی چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این موارد استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver استفاده می‌کند که CLI استفاده می‌کند: مسیر/آرشیو محلی،
`clawhub:<pkg>` صریح، `npm:<pkg>` صریح، `npm-pack:<path.tgz>` صریح،
`git:<repo>` صریح، یا مشخصه بسته بدون پیشوند از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولاً بسته شکست می‌خورد و شما را به
`openclaw doctor --fix` هدایت می‌کند. تنها استثنای بازیابی، یک مسیر محدود
نصب دوباره Plugin همراه‌سازی‌شده برای Pluginهایی است که به
`openclaw.install.allowInvalidConfigRecovery` opt in می‌کنند.
در هنگام راه‌اندازی Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر
دیگری بسته شکست می‌خورد. `openclaw doctor --fix` را اجرا کنید تا پیکربندی
خراب Plugin با غیرفعال کردن آن ورودی Plugin و حذف payload نامعتبر پیکربندی آن
قرنطینه شود؛ پشتیبان‌گیری عادی پیکربندی مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی یک کانال به Pluginی اشاره می‌کند که دیگر قابل کشف نیست اما همان
شناسه Plugin کهنه در پیکربندی Plugin یا رکوردهای نصب باقی مانده است، راه‌اندازی
Gateway هشدارها را ثبت می‌کند و به‌جای مسدود کردن همه کانال‌های دیگر، آن کانال
را رد می‌کند. برای حذف ورودی‌های کانال/Plugin کهنه، `openclaw doctor --fix`
را اجرا کنید؛ کلیدهای کانال ناشناخته بدون شواهد Plugin کهنه همچنان در اعتبارسنجی
شکست می‌خورند تا خطاهای تایپی قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های کهنه Plugin بی‌اثر
در نظر گرفته می‌شوند: راه‌اندازی Gateway کار کشف/بارگذاری Plugin را رد می‌کند
و `openclaw doctor` به‌جای حذف خودکار پیکربندی غیرفعال Plugin، آن را حفظ می‌کند.
اگر می‌خواهید شناسه‌های کهنه Plugin حذف شوند، پیش از اجرای پاک‌سازی doctor،
Pluginها را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط در جریان‌های نصب/به‌روزرسانی صریح یا تعمیر doctor
انجام می‌شود. راه‌اندازی Gateway، بارگذاری مجدد پیکربندی و بازرسی runtime
مدیران بسته را اجرا نمی‌کنند یا درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای
محلی باید از قبل وابستگی‌های خود را نصب‌شده داشته باشند، در حالی که Pluginهای
npm، git و ClawHub زیر ریشه‌های Plugin مدیریت‌شده OpenClaw نصب می‌شوند.
وابستگی‌های npm ممکن است درون ریشه npm مدیریت‌شده OpenClaw hoist شوند؛
نصب/به‌روزرسانی آن ریشه مدیریت‌شده را پیش از اعتماد اسکن می‌کند و حذف نصب،
بسته‌های مدیریت‌شده با npm را از طریق npm حذف می‌کند. Pluginهای خارجی و
مسیرهای بارگذاری سفارشی همچنان باید از طریق `openclaw plugins install` نصب شوند.
برای دیدن `dependencyStatus` ایستا برای هر Plugin قابل مشاهده، بدون import کردن
کد runtime یا تعمیر وابستگی‌ها، از `openclaw plugins list --json` استفاده کنید.
برای چرخه عمر زمان نصب، [حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

### مالکیت مسیر Plugin مسدودشده

اگر عیب‌یابی‌های Plugin بگویند
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
و اعتبارسنجی پیکربندی با `plugin present but blocked` ادامه پیدا کند، OpenClaw
فایل‌های Pluginی پیدا کرده که مالک آن‌ها کاربر Unix متفاوتی از فرایندی است که
آن‌ها را بارگذاری می‌کند. پیکربندی Plugin را سر جای خود نگه دارید؛ مالکیت
فایل‌سیستم را اصلاح کنید یا OpenClaw را با همان کاربری اجرا کنید که مالک
دایرکتوری state است.

برای نصب‌های Docker، image رسمی با کاربر `node` (uid `1000`) اجرا می‌شود،
بنابراین دایرکتوری‌های پیکربندی و workspace مربوط به OpenClaw که از میزبان
bind-mounted شده‌اند معمولاً باید مالکیت uid `1000` داشته باشند:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

اگر عمداً OpenClaw را به‌عنوان root اجرا می‌کنید، ریشه Plugin مدیریت‌شده را
به‌جای آن به مالکیت root تعمیر کنید:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

پس از اصلاح مالکیت، دوباره `openclaw doctor --fix` یا
`openclaw plugins registry --refresh` را اجرا کنید تا رجیستری Plugin پایدارشده
با فایل‌های تعمیرشده هم‌خوان شود.

برای نصب‌های npm، selectorهای تغییرپذیر مانند `latest` یا dist-tag پیش از نصب
resolve می‌شوند و سپس به نسخه دقیق تأییدشده در ریشه npm مدیریت‌شده OpenClaw
pin می‌شوند. پس از پایان کار npm، OpenClaw تأیید می‌کند که ورودی نصب‌شده
`package-lock.json` همچنان با نسخه و integrity حل‌شده مطابقت دارد. اگر npm
فراداده بسته متفاوتی بنویسد، نصب شکست می‌خورد و بسته مدیریت‌شده به عقب برگردانده
می‌شود، به‌جای اینکه artifact متفاوتی از Plugin پذیرفته شود.
ریشه‌های npm مدیریت‌شده همچنین `overrides` سطح بسته npm مربوط به OpenClaw را
به ارث می‌برند، بنابراین pinهای امنیتی که از میزبان بسته‌بندی‌شده محافظت می‌کنند
برای وابستگی‌های Plugin خارجی hoistشده نیز اعمال می‌شوند.

checkoutهای منبع workspaceهای pnpm هستند. اگر OpenClaw را برای کار روی Pluginهای
همراه‌سازی‌شده clone می‌کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw
Pluginهای همراه‌سازی‌شده را از `extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و
وابستگی‌های محلی بسته مستقیماً استفاده شوند. نصب‌های ساده ریشه npm برای OpenClaw
بسته‌بندی‌شده هستند، نه توسعه checkout منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را تشخیص می‌دهد:

| قالب       | نحوه کار                                                        | نمونه‌ها                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **بومی** | `openclaw.plugin.json` + ماژول runtime؛ درون فرایند اجرا می‌شود       | Pluginهای رسمی، بسته‌های npm جامعه               |
| **Bundle** | چیدمان سازگار با Codex/Claude/Cursor؛ به ویژگی‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle، [Plugin Bundleها](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin بومی هستید، با [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## entrypointهای بسته

بسته‌های npm مربوط به Plugin بومی باید `openclaw.extensions` را در `package.json`
اعلام کنند. هر ورودی باید داخل دایرکتوری بسته باقی بماند و به یک فایل runtime
خواندنی resolve شود، یا به یک فایل منبع TypeScript با همتای JavaScript ساخته‌شده
استنباطی مانند `src/index.ts` به `dist/index.js` resolve شود.
نصب‌های بسته‌بندی‌شده باید آن خروجی runtime جاوااسکریپت را همراه خود داشته باشند.
fallback منبع TypeScript برای checkoutهای منبع و مسیرهای توسعه محلی است، نه برای
بسته‌های npm نصب‌شده در ریشه Plugin مدیریت‌شده OpenClaw.

دایرکتوری‌های ردیابی‌نشده‌ای که در ریشه extension سراسری انداخته می‌شوند، به‌عنوان
checkoutهای منبع محلی در نظر گرفته می‌شوند و ممکن است ورودی‌های TypeScript را
مستقیماً بارگذاری کنند. دایرکتوری‌هایی که همچنان توسط یک رکورد نصب نام‌گذاری
شده‌اند، از جمله `installPath` یا `sourcePath`، مدیریت‌شده باقی می‌مانند و حتی
وقتی اسکن سراسری آن‌ها را می‌بیند، الزام خروجی کامپایل‌شده را حفظ می‌کنند. اگر
عمداً یک نصب مدیریت‌شده را به checkout محلی ردیابی‌نشده تبدیل می‌کنید، ابتدا
رکورد نصب کهنه را با حذف نصب یا پاک‌سازی doctor حذف کنید.

اگر هشدار بسته مدیریت‌شده بگوید که برای ورودی TypeScript
`requires compiled runtime output for TypeScript entry ...`، بسته بدون فایل‌های
JavaScriptی منتشر شده است که OpenClaw در runtime نیاز دارد. این یک مشکل
بسته‌بندی Plugin است، نه یک مشکل پیکربندی محلی. پس از اینکه ناشر JavaScript
کامپایل‌شده را دوباره منتشر کرد، Plugin را به‌روزرسانی یا دوباره نصب کنید، یا
تا زمانی که بسته اصلاح‌شده در دسترس قرار بگیرد، آن Plugin را غیرفعال/حذف نصب کنید.

وقتی فایل‌های runtime منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند، از
`openclaw.runtimeExtensions` استفاده کنید. وقتی وجود داشته باشد، `runtimeExtensions`
باید دقیقاً برای هر ورودی `extensions` یک ورودی داشته باشد. فهرست‌های نامطابق
نصب و کشف Plugin را با شکست روبه‌رو می‌کنند، نه اینکه بی‌صدا به مسیرهای منبع
fallback کنند. اگر `openclaw.setupEntry` را نیز منتشر می‌کنید، از
`openclaw.runtimeSetupEntry` برای همتای JavaScript ساخته‌شده آن استفاده کنید؛
وقتی اعلام شود، آن فایل الزامی است.

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

### بسته‌های npm متعلق به OpenClaw در طول مهاجرت

ClawHub مسیر توزیع اصلی برای بیشتر Pluginهاست. نسخه‌های بسته‌بندی‌شده فعلی
OpenClaw از قبل بسیاری از Pluginهای رسمی را همراه خود دارند، بنابراین در تنظیمات
عادی به نصب‌های npm جداگانه نیاز ندارند. تا زمانی که هر Plugin متعلق به OpenClaw
به ClawHub مهاجرت کند، OpenClaw همچنان برخی بسته‌های Plugin با نام `@openclaw/*`
را برای نصب‌های قدیمی‌تر/سفارشی و workflowهای مستقیم npm روی npm منتشر می‌کند.

اگر npm یک بسته Plugin با نام `@openclaw/*` را deprecated گزارش کند، آن نسخه
بسته از یک ردیف قدیمی‌تر بسته خارجی است. تا زمانی که بسته npm جدیدتری منتشر شود،
از Plugin همراه نسخه فعلی OpenClaw یا یک checkout محلی استفاده کنید.

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
  <Accordion title="ارائه‌دهندگان مدل (به‌صورت پیش‌فرض فعال)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin‌های حافظه">
    - `memory-core` - جست‌وجوی حافظه‌ی همراه (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` - حافظه‌ی بلندمدت مبتنی بر LanceDB با فراخوانی/ثبت خودکار (تنظیم کنید `plugins.slots.memory = "memory-lancedb"`)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های فراخوانی، و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌صورت پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر">
    - `browser` - Plugin مرورگر همراه برای ابزار مرورگر، CLI مربوط به `openclaw browser`، روش Gateway با نام `browser.request`، runtime مرورگر، و سرویس پیش‌فرض کنترل مرورگر (به‌صورت پیش‌فرض فعال؛ پیش از جایگزینی آن را غیرفعال کنید)
    - `copilot-proxy` - پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

دنبال Plugin‌های شخص ثالث هستید؟ [ClawHub](/fa/clawhub) را ببینید.

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
| `enabled`          | کلید اصلی فعال/غیرفعال (پیش‌فرض: `true`)                           |
| `allow`            | فهرست مجاز Plugin‌ها (اختیاری)                               |
| `bundledDiscovery` | حالت کشف Plugin همراه (به‌صورت پیش‌فرض `allowlist`)    |
| `deny`             | فهرست مسدود Plugin‌ها (اختیاری؛ مسدودسازی اولویت دارد)                     |
| `load.paths`       | فایل‌ها/دایرکتوری‌های اضافی Plugin                            |
| `slots`            | انتخاب‌گرهای اسلات انحصاری (برای نمونه `memory`، `contextEngine`) |
| `entries.\<id\>`   | کلیدهای فعال/غیرفعال و پیکربندی برای هر Plugin                               |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Plugin‌های فهرست‌شده می‌توانند بارگذاری شوند یا ابزارها را در معرض دسترس قرار دهند، حتی اگر `tools.allow` شامل `"*"` یا نام ابزار مشخصی باشد که مالک آن یک Plugin است. اگر فهرست مجاز ابزار به ابزارهای Plugin اشاره می‌کند، شناسه‌های Plugin مالک را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` درباره‌ی این شکل هشدار می‌دهد.

`plugins.bundledDiscovery` برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین یک موجودی محدودکننده‌ی `plugins.allow`، Plugin‌های ارائه‌دهنده‌ی همراهِ حذف‌شده را نیز مسدود می‌کند، از جمله کشف ارائه‌دهنده‌ی جست‌وجوی وب در runtime. Doctor هنگام مهاجرت، پیکربندی‌های قدیمی‌ترِ فهرست مجاز محدودکننده را با `"compat"` مهر می‌کند تا ارتقاها رفتار قدیمی ارائه‌دهنده‌ی همراه را حفظ کنند تا زمانی که اپراتور حالت سخت‌گیرانه‌تر را انتخاب کند. `plugins.allow` خالی همچنان به‌عنوان تنظیم‌نشده/باز در نظر گرفته می‌شود.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، بازبارگذاری درون‌فرایندی Pluginهای Gateway را آغاز می‌کنند. نوبت‌های جدید agent فهرست ابزارهای خود را از registry تازه‌سازی‌شده‌ی Plugin بازسازی می‌کنند. عملیات تغییردهنده‌ی منبع مانند نصب، به‌روزرسانی، و حذف نصب همچنان فرایند Gateway را ری‌استارت می‌کنند، چون ماژول‌های Plugin که از قبل import شده‌اند را نمی‌توان با اطمینان درجا جایگزین کرد.

`openclaw plugins list` یک snapshot محلی از registry/پیکربندی Plugin است. یک Plugin با وضعیت `enabled` در آن‌جا یعنی registry پایدارشده و پیکربندی فعلی اجازه می‌دهند Plugin مشارکت کند. این ثابت نمی‌کند که یک Gateway راه‌دورِ در حال اجرا، به همان کد Plugin بازبارگذاری یا ری‌استارت شده است. در راه‌اندازی‌های VPS/container با فرایندهای wrapper، ری‌استارت‌ها یا نوشتن‌هایی که بازبارگذاری را فعال می‌کنند به فرایند واقعی `openclaw gateway run` بفرستید، یا وقتی بازبارگذاری خطا گزارش می‌کند از `openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال در برابر مفقود در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به شناسه‌ی Pluginی اشاره می‌کند که کشف پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده مطابقت ندارد. راه‌اندازی Gateway فقط همان Plugin را نادیده می‌گیرد؛ `openclaw doctor --fix` می‌تواند با غیرفعال کردن آن و حذف payload پیکربندی‌اش، ورودی نامعتبر را قرنطینه کند.

</Accordion>

## کشف و تقدم

OpenClaw به این ترتیب به‌دنبال Plugin‌ها می‌گردد (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` - مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که به دایرکتوری‌های Plugin همراهِ بسته‌بندی‌شده‌ی خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛ برای حذف آن aliasهای کهنه، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Plugin‌های workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin‌های سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin‌های همراه">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال‌اند (ارائه‌دهندگان مدل، گفتار).
    بقیه به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولاً Plugin‌های همراه را از درخت کامپایل‌شده‌ی `dist/extensions` resolve می‌کنند. اگر دایرکتوری منبع یک Plugin همراه روی مسیر منبع بسته‌بندی‌شده‌ی متناظر bind-mounted شود، برای مثال `/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mount‌شده را به‌عنوان overlay منبع همراه در نظر می‌گیرد و آن را پیش از bundle بسته‌بندی‌شده‌ی `/app/dist/extensions/synology-chat` کشف می‌کند. این کار loopهای container مربوط به maintainer را بدون برگرداندن همه‌ی Plugin‌های همراه به منبع TypeScript فعال نگه می‌دارد. برای اجبار به استفاده از bundleهای dist بسته‌بندی‌شده حتی وقتی mountهای overlay منبع وجود دارند، `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همه‌ی Plugin‌ها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow اولویت دارد
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Plugin‌های با منشأ workspace به‌صورت **پیش‌فرض غیرفعال‌اند** (باید صریحاً فعال شوند)
- Plugin‌های همراه از مجموعه‌ی داخلیِ پیش‌فرض فعال پیروی می‌کنند مگر این‌که override شوند
- اسلات‌های انحصاری می‌توانند Plugin انتخاب‌شده برای آن اسلات را force-enable کنند
- برخی Plugin‌های همراه opt-in وقتی پیکربندی یک سطح متعلق به Plugin را نام می‌برد، مانند ارجاع مدل ارائه‌دهنده، پیکربندی channel، یا runtime harness، به‌صورت خودکار فعال می‌شوند
- پیکربندی کهنه‌ی Plugin تا زمانی که `plugins.enabled: false` فعال است حفظ می‌شود؛ اگر می‌خواهید شناسه‌های کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor، Plugin‌ها را دوباره فعال کنید
- مسیرهای Codex خانواده‌ی OpenAI مرزهای Plugin جداگانه را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin OpenAI است، در حالی‌که Plugin app-server همراه Codex با ارجاع‌های canonical agent با نام `openai/*`، `agentRuntime.id: "codex"` صریح provider/model، یا ارجاع‌های قدیمی مدل `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` دیده می‌شود اما اثرات جانبی یا hookهای `register(api)` در ترافیک چت زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال Gateway، profile، مسیر پیکربندی، و فرایند همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را ری‌استارت کنید. در containerهای wrapper، PID 1 ممکن است فقط یک supervisor باشد؛ فرایند فرزند `openclaw gateway run` را ری‌استارت یا signal کنید.
- از `openclaw plugins inspect <id> --runtime --json` برای تأیید ثبت hookها و diagnostics استفاده کنید. hookهای گفت‌وگوی غیرهمراه مانند `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تغییر مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از resolve مدل برای نوبت‌های agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل خروجی assistant تولید کند.
- برای اثبات مدل مؤثر جلسه، از `openclaw sessions` یا سطح‌های session/status در Gateway استفاده کنید و هنگام debug کردن payloadهای provider، Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### راه‌اندازی کند ابزار Plugin

اگر به‌نظر می‌رسد نوبت‌های agent هنگام آماده‌سازی ابزارها متوقف می‌شوند، trace logging را فعال کنید و دنبال خطوط زمان‌بندی factory ابزار Plugin بگردید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند، از جمله شناسه‌ی Plugin، نام‌های ابزار اعلام‌شده، شکل نتیجه، و این‌که ابزار اختیاری است یا نه. وقتی یک factory دست‌کم 1s طول بکشد یا آماده‌سازی کل factory ابزار Plugin دست‌کم 5s طول بکشد، خطوط کند به هشدار ارتقا داده می‌شوند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolveهای تکراری با همان context مؤثر درخواست cache می‌کند. کلید cache شامل پیکربندی مؤثر runtime، workspace، شناسه‌های agent/session، سیاست sandbox، تنظیمات مرورگر، context تحویل، هویت درخواست‌کننده، و وضعیت مالکیت است، بنابراین factoryهایی که به آن فیلدهای مورد اعتماد وابسته‌اند وقتی context تغییر کند دوباره اجرا می‌شوند.

اگر یک Plugin بر زمان‌بندی مسلط است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید بارگذاری dependencyهای پرهزینه را پشت مسیر اجرای ابزار منتقل کنند، به‌جای این‌که آن را داخل factory ابزار انجام دهند.

### مالکیت تکراری channel یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان channel، جریان راه‌اندازی، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin خارجی channel در کنار یک Plugin همراه است که اکنون همان شناسه‌ی channel را فراهم می‌کند.

مراحل debug:

- برای دیدن هر Plugin فعال و منشأ آن، `openclaw plugins list --enabled --verbose` را اجرا کنید.
- برای هر Plugin مشکوک، `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و `channels`، `channelConfigs`، `tools`، و diagnostics را مقایسه کنید.
- پس از نصب یا حذف packageهای Plugin، `openclaw plugins registry --refresh` را اجرا کنید تا metadata پایدارشده وضعیت نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، registry، یا پیکربندی، Gateway را ری‌استارت کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً دیگری را برای همان شناسه‌ی channel جایگزین می‌کند، Plugin ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسه‌ی Plugin دارای اولویت پایین‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin کهنه را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را حفظ می‌کند و تعارض را گزارش می‌دهد. یک مالک برای channel انتخاب کنید یا ابزارهای متعلق به Plugin را تغییر نام دهید تا سطح runtime ابهام نداشته باشد.

## اسلات‌های Plugin (دسته‌های انحصاری)

برخی دسته‌ها انحصاری‌اند (در هر زمان فقط یکی فعال است):

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

| اسلات            | چه چیزی را کنترل می‌کند      | پیش‌فرض             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin حافظه‌ی فعال  | `memory-core`       |
| `contextEngine` | موتور context فعال | `legacy` (داخلی) |

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

Pluginهای همراه، با OpenClaw عرضه می‌شوند. بسیاری از آن‌ها به‌طور پیش‌فرض فعال هستند (برای نمونه ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه). سایر Pluginهای همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا بسته hook موجود را درجا بازنویسی می‌کند. برای ارتقاهای معمول Pluginهای npm ردیابی‌شده از `openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون `--link` به‌جای کپی‌کردن روی یک هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال‌سازی به آن فهرست مجاز اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، نصب آن ورودی deny کهنه را حذف می‌کند تا نصب صریح بلافاصله پس از راه‌اندازی دوباره قابل بارگذاری باشد.

OpenClaw یک رجیستری محلی ماندگار Plugin را به‌عنوان مدل خواندن سرد برای موجودی Plugin، مالکیت مشارکت‌ها، و برنامه‌ریزی راه‌اندازی نگه می‌دارد. جریان‌های نصب، به‌روزرسانی، حذف نصب، فعال‌سازی، و غیرفعال‌سازی پس از تغییر وضعیت Plugin آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فراداده نصب پایدار را در `installRecords` سطح بالا و فراداده manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر رجیستری موجود نباشد، کهنه باشد، یا نامعتبر باشد، `openclaw plugins registry --refresh` نمای manifest آن را از رکوردهای نصب، سیاست config، و فراداده manifest/package بدون بارگذاری ماژول‌های runtime مربوط به Plugin بازسازی می‌کند.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه‌عمر Plugin غیرفعال هستند. به‌جای آن، انتخاب بسته Plugin و config را از طریق منبع Nix همان نصب مدیریت کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور آغاز کنید. `openclaw plugins update <id-or-npm-spec>` برای نصب‌های ردیابی‌شده اعمال می‌شود. دادن یک spec بسته npm همراه با dist-tag یا نسخه دقیق، نام بسته را دوباره به رکورد Plugin ردیابی‌شده resolve می‌کند و spec جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند. دادن نام بسته بدون نسخه، یک نصب دقیق pin‌شده را به خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin نصب‌شده npm از قبل با نسخه resolve‌شده و هویت artifact ثبت‌شده مطابق باشد، OpenClaw به‌روزرسانی را بدون دانلود، نصب دوباره، یا بازنویسی config رد می‌کند.
وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای Plugin مربوط به خط پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند و وقتی انتشار beta برای Plugin وجود نداشته باشد به default/latest برمی‌گردند. نسخه‌های دقیق و tagهای صریح همچنان pin‌شده می‌مانند.

`--pin` فقط مخصوص npm است. این گزینه با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec مربوط به npm، فراداده منبع marketplace را پایدار نگه می‌دارند.

`--dangerously-force-unsafe-install` یک override اضطراری برای مثبت‌های کاذب اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌ها و به‌روزرسانی‌های Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان blockهای سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند. اسکن‌های نصب، برای جلوگیری از مسدود کردن mockهای تست بسته‌بندی‌شده، فایل‌ها و دایرکتوری‌های رایج تست مانند `tests/`، `__tests__/`، `*.test.*`، و `*.spec.*` را نادیده می‌گیرند؛ entrypointهای runtime اعلام‌شده برای Plugin همچنان اسکن می‌شوند حتی اگر یکی از آن نام‌ها را استفاده کنند.

این flag در CLI فقط برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skill که با پشتوانه Gateway انجام می‌شوند به‌جای آن از override متناظر درخواست `dangerouslyForceUnsafeInstall` استفاده می‌کنند، درحالی‌که `openclaw skills install` همچنان جریان جداگانه دانلود/نصب Skill از ClawHub باقی می‌ماند.

اگر Pluginی که در ClawHub منتشر کرده‌اید به‌دلیل یک اسکن پنهان یا مسدود شده است، داشبورد ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در دستگاه خودتان اثر دارد؛ از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را عمومی کند.

بسته‌های سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin مشارکت می‌کنند. پشتیبانی runtime فعلی شامل Skills بسته، command-skillهای Claude، پیش‌فرض‌های Claude `settings.json`، پیش‌فرض‌های Claude `.lsp.json` و `lspServers` اعلام‌شده در manifest، command-skillهای Cursor، و دایرکتوری‌های hook سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های شناسایی‌شده بسته به‌علاوه ورودی‌های پشتیبانی‌شده یا پشتیبانی‌نشده سرورهای MCP و LSP برای Pluginهای پشتیبانی‌شده با بسته را گزارش می‌کند.

منابع marketplace می‌توانند یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`، یک ریشه marketplace محلی یا مسیر `marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL مخزن گیت‌هاب، یا یک URL git باشند. برای marketplaceهای remote، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API مربوط به Plugin

Pluginهای native یک شیء entry صادر می‌کنند که `register(api)` را در دسترس می‌گذارد. Pluginهای قدیمی‌تر ممکن است همچنان از `activate(api)` به‌عنوان alias قدیمی استفاده کنند، اما Pluginهای جدید باید از `register` استفاده کنند.

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

OpenClaw در هنگام فعال‌سازی Plugin، شیء entry را بارگذاری می‌کند و `register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` fallback می‌کند، اما Pluginهای همراه و Pluginهای خارجی جدید باید `register` را به‌عنوان قرارداد عمومی در نظر بگیرند.

`api.registrationMode` به یک Plugin می‌گوید چرا entry آن در حال بارگذاری است:

| حالت | معنی |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | فعال‌سازی runtime. ابزارها، hookها، سرویس‌ها، فرمان‌ها، routeها، و سایر side effectهای زنده را ثبت کنید. |
| `discovery` | کشف قابلیت فقط‌خواندنی. ارائه‌دهندگان و فراداده را ثبت کنید؛ کد entry قابل‌اعتماد Plugin ممکن است بارگذاری شود، اما side effectهای زنده را رد کنید. |
| `setup-only` | بارگذاری فراداده راه‌اندازی کانال از طریق یک entry سبک setup. |
| `setup-runtime` | بارگذاری setup کانال که به entry مربوط به runtime هم نیاز دارد. |
| `cli-metadata` | فقط گردآوری فراداده فرمان CLI. |

entryهای Plugin که socket، database، worker پس‌زمینه، یا clientهای بلندعمر باز می‌کنند باید این side effectها را با `api.registrationMode === "full"` محافظت کنند. بارگذاری‌های discovery جدا از بارگذاری‌های activation cache می‌شوند و جایگزین رجیستری Gateway در حال اجرا نمی‌شوند. Discovery غیرفعال‌ساز است، اما import-free نیست: OpenClaw ممکن است برای ساخت snapshot، entry قابل‌اعتماد Plugin یا ماژول Plugin کانال را ارزیابی کند. سطح‌های بالایی ماژول را سبک و بدون side effect نگه دارید، و clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و راه‌اندازی سرویس را پشت مسیرهای full-runtime منتقل کنید.

روش‌های رایج registration:

| روش | آنچه ثبت می‌کند |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ارائه‌دهنده مدل (LLM) |
| `registerChannel` | کانال گفت‌وگو |
| `registerTool` | ابزار عامل |
| `registerHook` / `on(...)` | hookهای چرخه‌عمر |
| `registerSpeechProvider` | متن به گفتار / STT |
| `registerRealtimeTranscriptionProvider` | STT استریمینگ |
| `registerRealtimeVoiceProvider` | صدای realtime دوطرفه |
| `registerMediaUnderstandingProvider` | تحلیل تصویر/صوت |
| `registerImageGenerationProvider` | تولید تصویر |
| `registerMusicGenerationProvider` | تولید موسیقی |
| `registerVideoGenerationProvider` | تولید ویدیو |
| `registerWebFetchProvider` | ارائه‌دهنده fetch / scrape وب |
| `registerWebSearchProvider` | جست‌وجوی وب |
| `registerHttpRoute` | endpoint HTTP |
| `registerCommand` / `registerCli` | فرمان‌های CLI |
| `registerContextEngine` | موتور context |
| `registerService` | سرویس پس‌زمینه |

رفتار guard مربوط به hookهای چرخه‌عمر typed:

- `before_tool_call`: `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

سرور برنامهٔ بومی Codex رویدادهای ابزار بومیِ Codex را دوباره از طریق پل به این سطح hook برمی‌گرداند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند و در تأییدهای `PermissionRequest` در Codex مشارکت داشته باشند. این پل هنوز آرگومان‌های ابزارهای بومی Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی زمان اجرای Codex در [قرارداد پشتیبانی نسخهٔ ۱ harness Codex](/fa/plugins/codex-harness-runtime#v1-support-contract) قرار دارد.

برای رفتار کامل hook با نوع‌دهی، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) - Plugin خودتان را بسازید
- [بسته‌های Plugin](/fa/plugins/bundles) - سازگاری بستهٔ Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) - طرح‌وارهٔ مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) - افزودن ابزارهای عامل در یک Plugin
- [جزئیات داخلی Plugin](/fa/plugins/architecture) - مدل قابلیت و خط لولهٔ بارگذاری
- [ClawHub](/fa/clawhub) - کشف Pluginهای شخص ثالث
