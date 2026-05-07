---
read_when:
    - نصب یا پیکربندی Pluginها
    - درک قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Plugin‌های OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Pluginها
x-i18n:
    generated_at: "2026-05-07T01:56:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Plugin‌ها OpenClaw را با قابلیت‌های تازه گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل، چارچوب‌های عامل، ابزارها، Skills، گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ، درک رسانه، تولید تصویر، تولید ویدیو، واکشی وب، جست‌وجوی وب و موارد بیشتر. برخی Plugin‌ها **هسته‌ای** هستند (همراه OpenClaw عرضه می‌شوند) و برخی دیگر **خارجی** هستند. بیشتر Plugin‌های خارجی از طریق [ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. Npm همچنان برای نصب مستقیم و برای مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا پایان این مهاجرت پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های آمادهٔ کپی و چسباندن برای نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی و انتشار، [مدیریت Plugin‌ها](/fa/plugins/manage-plugins) را ببینید.

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

  <Step title="راه‌اندازی دوبارهٔ Gateway">
    ```bash
    openclaw gateway restart
    ```

    سپس در فایل پیکربندی خود زیر `plugins.entries.\<id\>.config` پیکربندی کنید.

  </Step>

  <Step title="مدیریت بومی چت">
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` که فقط مخصوص مالک هستند، بارگذار مجدد پیکربندی Gateway را فعال می‌کنند. Gateway سطح‌های runtime Plugin را در همان فرایند دوباره بارگذاری می‌کند، و نوبت‌های جدید عامل فهرست ابزارهای خود را از رجیستری تازه‌سازی‌شده بازسازی می‌کنند. `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین Gateway به‌جای وانمود کردن به اینکه فرایند فعلی می‌تواند ماژول‌های ازپیش-import‌شده را با امنیت دوباره بارگذاری کند، درخواست راه‌اندازی دوباره می‌دهد.

  </Step>

  <Step title="تأیید Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارهای ثبت‌شده، سرویس‌ها، متدهای gateway، hookها یا فرمان‌های CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید. `inspect` ساده یک بررسی سرد manifest/registry است و عمداً از import کردن runtime Plugin خودداری می‌کند.

  </Step>
</Steps>

اگر کنترل بومی چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver استفاده می‌کند که CLI استفاده می‌کند: مسیر/آرشیو محلی، `clawhub:<pkg>` صریح، `npm:<pkg>` صریح، `npm-pack:<path.tgz>` صریح، `git:<repo>` صریح، یا مشخصات بستهٔ ساده از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولاً بسته شکست می‌خورد و شما را به `openclaw doctor --fix` ارجاع می‌دهد. تنها استثنای بازیابی، یک مسیر محدود نصب دوبارهٔ Plugin همراه برای Plugin‌هایی است که `openclaw.install.allowInvalidConfigRecovery` را انتخاب می‌کنند.
در هنگام راه‌اندازی Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری بسته شکست می‌خورد. `openclaw doctor --fix` را اجرا کنید تا پیکربندی بد Plugin با غیرفعال کردن آن ورودی Plugin و حذف payload پیکربندی نامعتبرش قرنطینه شود؛ پشتیبان‌گیری معمول پیکربندی، مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی یک کانال به Pluginی اشاره می‌کند که دیگر قابل کشف نیست اما همان شناسهٔ قدیمی Plugin در پیکربندی Plugin یا سوابق نصب باقی مانده است، راه‌اندازی Gateway هشدارها را ثبت می‌کند و به‌جای مسدود کردن همهٔ کانال‌های دیگر، آن کانال را رد می‌کند.
`openclaw doctor --fix` را اجرا کنید تا ورودی‌های قدیمی کانال/Plugin حذف شوند؛ کلیدهای ناشناختهٔ کانال بدون شواهد Plugin قدیمی همچنان در اعتبارسنجی شکست می‌خورند تا اشتباه‌های تایپی قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های قدیمی Plugin بی‌اثر تلقی می‌شوند: راه‌اندازی Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor` به‌جای حذف خودکار، پیکربندی Plugin غیرفعال را حفظ می‌کند. اگر می‌خواهید شناسه‌های قدیمی Plugin حذف شوند، پیش از اجرای پاک‌سازی doctor، Plugin‌ها را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط در جریان‌های نصب/به‌روزرسانی صریح یا تعمیر doctor انجام می‌شود. راه‌اندازی Gateway، بارگذاری مجدد پیکربندی و بازرسی runtime، package manager اجرا نمی‌کنند یا درخت‌های وابستگی را تعمیر نمی‌کنند. Plugin‌های محلی باید از قبل وابستگی‌های خود را نصب کرده باشند، در حالی که Plugin‌های npm، git و ClawHub زیر ریشه‌های مدیریت‌شدهٔ Plugin در OpenClaw نصب می‌شوند. وابستگی‌های npm ممکن است درون ریشهٔ npm مدیریت‌شدهٔ OpenClaw hoist شوند؛ نصب/به‌روزرسانی پیش از اعتماد، آن ریشهٔ مدیریت‌شده را اسکن می‌کند و حذف نصب، بسته‌های مدیریت‌شده با npm را از طریق npm حذف می‌کند. Plugin‌های خارجی و مسیرهای بارگذاری سفارشی همچنان باید از طریق `openclaw plugins install` نصب شوند.
از `openclaw plugins list --json` استفاده کنید تا `dependencyStatus` ایستای هر Plugin قابل مشاهده را بدون import کردن کد runtime یا تعمیر وابستگی‌ها ببینید.
برای چرخهٔ عمر زمان نصب، [حل وابستگی‌های Plugin](/fa/plugins/dependency-resolution) را ببینید.

### مالکیت مسیر Plugin مسدودشده

اگر عیب‌یابی‌های Plugin بگویند
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
و اعتبارسنجی پیکربندی در ادامه با `plugin present but blocked` بیاید، OpenClaw فایل‌های Pluginی پیدا کرده است که متعلق به کاربر Unix متفاوتی از فرایندی هستند که آن‌ها را بارگذاری می‌کند. پیکربندی Plugin را سر جایش نگه دارید؛ مالکیت filesystem را اصلاح کنید یا OpenClaw را با همان کاربری اجرا کنید که مالک دایرکتوری state است.

برای نصب‌های Docker، تصویر رسمی با کاربر `node` (uid `1000`) اجرا می‌شود، بنابراین دایرکتوری‌های پیکربندی و workspace مربوط به OpenClaw که از میزبان bind-mounted شده‌اند، معمولاً باید متعلق به uid `1000` باشند:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

اگر عمداً OpenClaw را به‌عنوان root اجرا می‌کنید، به‌جای آن ریشهٔ Plugin مدیریت‌شده را به مالکیت root تعمیر کنید:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

پس از اصلاح مالکیت، `openclaw doctor --fix` یا
`openclaw plugins registry --refresh` را دوباره اجرا کنید تا رجیستری ماندگارشدهٔ Plugin با فایل‌های تعمیرشده مطابقت پیدا کند.

برای نصب‌های npm، انتخابگرهای mutable مانند `latest` یا یک dist-tag پیش از نصب resolve می‌شوند و سپس به نسخهٔ دقیق تأییدشده در ریشهٔ npm مدیریت‌شدهٔ OpenClaw pin می‌شوند. پس از پایان npm، OpenClaw تأیید می‌کند که ورودی نصب‌شدهٔ `package-lock.json` همچنان با نسخهٔ resolve‌شده و integrity مطابقت دارد. اگر npm فرادادهٔ بستهٔ متفاوتی بنویسد، نصب شکست می‌خورد و بستهٔ مدیریت‌شده به حالت قبل برگردانده می‌شود، به‌جای اینکه artifact متفاوتی از Plugin پذیرفته شود.
ریشه‌های npm مدیریت‌شده همچنین `overrides` سطح بستهٔ npm متعلق به OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی که از میزبان بسته‌بندی‌شده محافظت می‌کنند، برای وابستگی‌های Plugin خارجی hoist‌شده نیز اعمال می‌شوند.

checkoutهای منبع، workspaceهای pnpm هستند. اگر OpenClaw را clone می‌کنید تا روی Plugin‌های همراه کار کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw، Plugin‌های همراه را از `extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و وابستگی‌های محلی بسته مستقیماً استفاده شوند.
نصب‌های سادهٔ ریشهٔ npm برای OpenClaw بسته‌بندی‌شده هستند، نه برای توسعهٔ checkout منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را تشخیص می‌دهد:

| قالب | نحوهٔ کار | نمونه‌ها |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ماژول runtime؛ درون فرایند اجرا می‌شود | Plugin‌های رسمی، بسته‌های npm جامعه |
| **Bundle** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle، [Bundleهای Plugin](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin native هستید، با [ساخت Plugin‌ها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## entrypointهای بسته

بسته‌های npm Plugin native باید `openclaw.extensions` را در `package.json` اعلام کنند.
هر entry باید داخل دایرکتوری بسته باقی بماند و به یک فایل runtime خواندنی resolve شود، یا به یک فایل منبع TypeScript با همتای JavaScript ساخته‌شدهٔ استنباط‌شده، مانند `src/index.ts` به `dist/index.js`.
نصب‌های بسته‌بندی‌شده باید آن خروجی runtime JavaScript را همراه داشته باشند. fallback منبع TypeScript برای checkoutهای منبع و مسیرهای توسعهٔ محلی است، نه برای بسته‌های npm نصب‌شده در ریشهٔ Plugin مدیریت‌شدهٔ OpenClaw.

اگر هشدار بستهٔ مدیریت‌شده بگوید که برای `TypeScript entry ...` به `requires compiled runtime output for` نیاز دارد، بسته بدون فایل‌های JavaScript موردنیاز OpenClaw در runtime منتشر شده است. این یک مشکل بسته‌بندی Plugin است، نه مشکل پیکربندی محلی. پس از انتشار دوبارهٔ JavaScript کامپایل‌شده توسط منتشرکننده، Plugin را به‌روزرسانی یا دوباره نصب کنید، یا آن Plugin را تا زمانی که بستهٔ اصلاح‌شده در دسترس باشد غیرفعال/حذف نصب کنید.

وقتی فایل‌های runtime منتشرشده در همان مسیرهای entryهای منبع قرار ندارند، از `openclaw.runtimeExtensions` استفاده کنید. وقتی وجود دارد، `runtimeExtensions` باید دقیقاً برای هر entry در `extensions` یک entry داشته باشد. فهرست‌های ناهماهنگ، به‌جای fallback بی‌صدا به مسیرهای منبع، نصب و کشف Plugin را شکست می‌دهند. اگر `openclaw.setupEntry` را نیز منتشر می‌کنید، از `openclaw.runtimeSetupEntry` برای همتای JavaScript ساخته‌شدهٔ آن استفاده کنید؛ آن فایل هنگام اعلام شدن الزامی است.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugin‌های رسمی

### بسته‌های npm متعلق به OpenClaw در هنگام مهاجرت

ClawHub مسیر اصلی توزیع برای بیشتر Plugin‌ها است. نسخه‌های بسته‌بندی‌شدهٔ فعلی OpenClaw همین حالا بسیاری از Plugin‌های رسمی را همراه دارند، بنابراین در تنظیمات معمول به نصب npm جداگانه نیاز ندارند. تا زمانی که همهٔ Plugin‌های متعلق به OpenClaw به ClawHub مهاجرت کنند، OpenClaw همچنان برخی بسته‌های Plugin با الگوی `@openclaw/*` را برای نصب‌های قدیمی‌تر/سفارشی و workflowهای مستقیم npm روی npm منتشر می‌کند.

اگر npm یک بستهٔ Plugin با الگوی `@openclaw/*` را deprecated گزارش کند، آن نسخهٔ بسته از یک قطار بستهٔ خارجی قدیمی‌تر است. تا زمانی که بستهٔ npm تازه‌تری منتشر شود، از Plugin همراه در OpenClaw فعلی یا یک checkout محلی استفاده کنید.

| Plugin | بسته | مستندات |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles | `@openclaw/bluebubbles` | [BlueBubbles](/fa/channels/bluebubbles) |
| Discord | `@openclaw/discord` | [Discord](/fa/channels/discord) |
| Feishu | `@openclaw/feishu` | [Feishu](/fa/channels/feishu) |
| Matrix | `@openclaw/matrix` | [Matrix](/fa/channels/matrix) |
| Mattermost | `@openclaw/mattermost` | [Mattermost](/fa/channels/mattermost) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/fa/channels/msteams) |
| Nextcloud Talk | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/fa/channels/nextcloud-talk) |
| Nostr | `@openclaw/nostr` | [Nostr](/fa/channels/nostr) |
| Synology Chat | `@openclaw/synology-chat` | [Synology Chat](/fa/channels/synology-chat) |
| Tlon | `@openclaw/tlon` | [Tlon](/fa/channels/tlon) |
| WhatsApp | `@openclaw/whatsapp` | [WhatsApp](/fa/channels/whatsapp) |
| Zalo | `@openclaw/zalo` | [Zalo](/fa/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/fa/plugins/zalouser) |

### هسته‌ای (همراه OpenClaw عرضه می‌شود)

<AccordionGroup>
  <Accordion title="ارائه‌دهندگان مدل (به‌صورت پیش‌فرض فعال)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginهای حافظه">
    - `memory-core` - جستجوی حافظهٔ همراه‌شده (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` - حافظهٔ بلندمدت مبتنی بر LanceDB با یادآوری/ثبت خودکار (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های یادآوری، و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌طور پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر">
    - `browser` - Plugin مرورگر همراه‌شده برای ابزار مرورگر، CLI `openclaw browser`، متد Gateway `browser.request`، زمان‌اجرای مرورگر، و سرویس پیش‌فرض کنترل مرورگر (به‌طور پیش‌فرض فعال است؛ پیش از جایگزین‌کردن آن را غیرفعال کنید)
    - `copilot-proxy` - پل VS Code Copilot Proxy (به‌طور پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

دنبال Pluginهای شخص ثالث هستید؟ [Pluginهای جامعه](/fa/plugins/community) را ببینید.

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
| `bundledDiscovery` | حالت کشف Pluginهای همراه‌شده (به‌طور پیش‌فرض `allowlist`)    |
| `deny`             | فهرست ممنوع Pluginها (اختیاری؛ ممنوعیت اولویت دارد)                     |
| `load.paths`       | فایل‌ها/پوشه‌های اضافی Plugin                            |
| `slots`            | انتخابگرهای جایگاه انحصاری (مثلاً `memory`، `contextEngine`) |
| `entries.\<id\>`   | فعال/غیرفعال‌سازی و پیکربندی برای هر Plugin                               |

`plugins.allow` انحصاری است. وقتی غیرخالی باشد، فقط Pluginهای فهرست‌شده می‌توانند بارگذاری شوند یا ابزارها را در دسترس بگذارند، حتی اگر `tools.allow` شامل `"*"` یا نام ابزار مشخصی باشد که متعلق به یک Plugin است. اگر فهرست مجاز ابزار به ابزارهای Plugin اشاره می‌کند، شناسه‌های Plugin مالک را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` دربارهٔ این شکل هشدار می‌دهد.

`plugins.bundledDiscovery` برای پیکربندی‌های جدید به‌طور پیش‌فرض `"allowlist"` است، بنابراین موجودی محدودکنندهٔ `plugins.allow`، Pluginهای ارائه‌دهندهٔ همراه‌شده‌ای را که از قلم افتاده‌اند نیز مسدود می‌کند، از جمله کشف ارائه‌دهندهٔ جستجوی وب در زمان‌اجرا. Doctor هنگام مهاجرت، پیکربندی‌های قدیمی‌تر با فهرست مجاز محدودکننده را با `"compat"` مُهر می‌زند تا ارتقاها رفتار قدیمی ارائه‌دهندگان همراه‌شده را حفظ کنند تا زمانی که اپراتور حالت سخت‌گیرانه‌تر را انتخاب کند. `plugins.allow` خالی همچنان تنظیم‌نشده/باز تلقی می‌شود.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، بارگذاری مجدد درون‌فرایندی Pluginهای Gateway را فعال می‌کنند. نوبت‌های جدید agent فهرست ابزارهای خود را از رجیستری Plugin به‌روزشده بازسازی می‌کنند. عملیات‌هایی که منبع را تغییر می‌دهند، مانند نصب، به‌روزرسانی و حذف نصب، همچنان فرایند Gateway را راه‌اندازی مجدد می‌کنند، چون ماژول‌های Plugin که قبلاً وارد شده‌اند را نمی‌توان با ایمنی درجا جایگزین کرد.

`openclaw plugins list` یک snapshot محلی از رجیستری/پیکربندی Plugin است. یک Plugin با وضعیت `enabled` در آنجا یعنی رجیستری ذخیره‌شده و پیکربندی فعلی اجازه می‌دهند Plugin مشارکت کند. این ثابت نمی‌کند که یک Gateway راه‌دورِ از قبل در حال اجرا، همان کد Plugin را دوباره بارگذاری کرده یا با آن راه‌اندازی مجدد شده است. در راه‌اندازی‌های VPS/کانتینر با فرایندهای wrapper، راه‌اندازی مجدد یا نوشتن‌هایی را که باعث reload می‌شوند به فرایند واقعی `openclaw gateway run` بفرستید، یا وقتی reload خطا گزارش می‌کند، از `openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال در برابر مفقود در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به شناسهٔ Pluginی ارجاع می‌دهد که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده مطابقت ندارد. راه‌اندازی Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر را با غیرفعال‌کردن آن و حذف payload پیکربندی‌اش قرنطینه کند.

</Accordion>

## کشف و تقدم

OpenClaw به این ترتیب Pluginها را اسکن می‌کند (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` - مسیرهای صریح فایل یا پوشه. مسیرهایی که به پوشه‌های Plugin همراه‌شدهٔ بسته‌بندی‌شدهٔ خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛ برای حذف آن aliasهای کهنه، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه‌شده">
    همراه OpenClaw ارائه می‌شوند. بسیاری به‌طور پیش‌فرض فعال‌اند (ارائه‌دهندگان مدل، گفتار).
    برخی دیگر نیازمند فعال‌سازی صریح هستند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولاً Pluginهای همراه‌شده را از درخت کامپایل‌شدهٔ `dist/extensions` resolve می‌کنند. اگر یک پوشهٔ منبع Plugin همراه‌شده روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount شود، برای مثال `/app/extensions/synology-chat`، OpenClaw آن پوشهٔ منبع mountشده را به‌عنوان overlay منبع همراه‌شده در نظر می‌گیرد و پیش از bundle بسته‌بندی‌شدهٔ `/app/dist/extensions/synology-chat` آن را کشف می‌کند. این کار loopهای کانتینری maintainer را بدون برگرداندن هر Plugin همراه‌شده به منبع TypeScript فعال نگه می‌دارد. برای اجبار به استفاده از bundleهای dist بسته‌بندی‌شده حتی وقتی mountهای overlay منبع وجود دارند، `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همهٔ Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow اولویت دارد
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهایی با مبدأ workspace **به‌طور پیش‌فرض غیرفعال‌اند** (باید صریحاً فعال شوند)
- Pluginهای همراه‌شده از مجموعهٔ داخلیِ پیش‌فرض-فعال پیروی می‌کنند مگر اینکه override شوند
- جایگاه‌های انحصاری می‌توانند Plugin انتخاب‌شده برای آن جایگاه را به‌اجبار فعال کنند
- برخی Pluginهای همراه‌شدهٔ opt-in وقتی پیکربندی نام یک سطح متعلق به Plugin را بیاورد، به‌طور خودکار فعال می‌شوند؛ مانند ref مدل ارائه‌دهنده، پیکربندی کانال، یا زمان‌اجرای harness
- پیکربندی کهنهٔ Plugin تا وقتی `plugins.enabled: false` فعال است حفظ می‌شود؛ اگر می‌خواهید شناسه‌های کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای Codex خانوادهٔ OpenAI مرزهای Plugin جداگانه را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin OpenAI است، در حالی که Plugin app-server همراه‌شدهٔ Codex با `agentRuntime.id: "codex"` یا refهای مدل قدیمی `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای زمان‌اجرا

اگر یک Plugin در `plugins list` ظاهر می‌شود اما اثرات جانبی یا hookهای `register(api)` در ترافیک چت زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال Gateway، profile، مسیر پیکربندی و فرایند همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را راه‌اندازی مجدد کنید. در کانتینرهای wrapper، PID 1 ممکن است فقط supervisor باشد؛ فرایند فرزند `openclaw gateway run` را راه‌اندازی مجدد کنید یا به آن signal بدهید.
- برای تأیید ثبت hookها و diagnostics از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. hookهای گفت‌وگوی غیرهمراه‌شده مانند `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `llm_input`، `llm_output`، `before_agent_finalize` و `agent_end` به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تغییر مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از resolve شدن مدل برای نوبت‌های agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل خروجی assistant تولید کند.
- برای اثبات مدل مؤثر جلسه، از `openclaw sessions` یا سطوح session/status در Gateway استفاده کنید و هنگام عیب‌یابی payloadهای ارائه‌دهنده، Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### راه‌اندازی کند ابزار Plugin

اگر به نظر می‌رسد نوبت‌های agent هنگام آماده‌سازی ابزارها متوقف می‌شوند، trace logging را فعال کنید و خطوط زمان‌بندی factory ابزار Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند، از جمله شناسهٔ Plugin، نام ابزارهای اعلام‌شده، شکل نتیجه و اینکه ابزار اختیاری است یا نه. وقتی یک factory حداقل 1 ثانیه طول بکشد یا آماده‌سازی کل factory ابزار Plugin حداقل 5 ثانیه طول بکشد، خطوط کند به هشدار ارتقا می‌یابند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolveهای تکراری با همان context مؤثر درخواست cache می‌کند. کلید cache شامل پیکربندی مؤثر زمان‌اجرا، workspace، شناسه‌های agent/session، سیاست sandbox، تنظیمات مرورگر، context تحویل، هویت درخواست‌دهنده و وضعیت مالکیت است؛ بنابراین factoryهایی که به آن فیلدهای trusted وابسته‌اند، هنگام تغییر context دوباره اجرا می‌شوند.

اگر یک Plugin بر زمان‌بندی غالب است، ثبت‌های زمان‌اجرای آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید بارگذاری dependencyهای پرهزینه را به مسیر اجرای ابزار منتقل کنند، نه اینکه آن را داخل factory ابزار انجام دهند.

### مالکیت تکراری کانال یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان کانال، جریان راه‌اندازی، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin کانال خارجی در کنار یک Plugin همراه‌شده است که اکنون همان شناسهٔ کانال را ارائه می‌کند.

گام‌های عیب‌یابی:

- برای دیدن هر Plugin فعال و مبدأ آن، `openclaw plugins list --enabled --verbose` را اجرا کنید.
- برای هر Plugin مشکوک، `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و `channels`، `channelConfigs`، `tools` و diagnostics را مقایسه کنید.
- پس از نصب یا حذف بسته‌های Plugin، `openclaw plugins registry --refresh` را اجرا کنید تا metadata ذخیره‌شده نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، رجیستری یا پیکربندی، Gateway را راه‌اندازی مجدد کنید.

گزینه‌های رفع مشکل:

- اگر یک Plugin عمداً جایگزین دیگری برای همان شناسهٔ کانال می‌شود، Plugin ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسهٔ Plugin با اولویت پایین‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin کهنه را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را حفظ می‌کند و تعارض را گزارش می‌دهد. یک مالک برای کانال انتخاب کنید یا ابزارهای متعلق به Plugin را تغییر نام دهید تا سطح زمان‌اجرا بدون ابهام باشد.

## جایگاه‌های Plugin (دسته‌های انحصاری)

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

| جایگاه            | آنچه کنترل می‌کند      | پیش‌فرض             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin حافظهٔ فعال  | `memory-core`       |
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

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری از آن‌ها به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه). سایر Pluginهای همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا بسته هوک موجود را در همان محل بازنویسی می‌کند. برای ارتقاهای معمول Pluginهای npm رهگیری‌شده، از `openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون `--link` به‌جای کپی‌کردن روی مقصد نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال‌سازی به آن فهرست مجاز اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، نصب آن ورودی منع قدیمی را حذف می‌کند تا نصب صریح پس از راه‌اندازی مجدد بلافاصله قابل بارگذاری باشد.

OpenClaw یک رجیستری محلی پایدار از Pluginها را به‌عنوان مدل خواندن سرد برای موجودی Pluginها، مالکیت مشارکت‌ها، و برنامه‌ریزی راه‌اندازی نگه می‌دارد. جریان‌های نصب، به‌روزرسانی، حذف نصب، فعال‌سازی، و غیرفعال‌سازی پس از تغییر وضعیت Plugin، آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فراداده نصب پایدار را در `installRecords` سطح بالا و فراداده مانیفست قابل بازسازی را در `plugins` نگه می‌دارد. اگر رجیستری موجود نباشد، قدیمی باشد، یا نامعتبر باشد، `openclaw plugins registry --refresh` نمای مانیفست آن را از روی رکوردهای نصب، سیاست پیکربندی، و فراداده مانیفست/بسته، بدون بارگذاری ماژول‌های زمان اجرای Plugin، بازسازی می‌کند.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییردهنده‌های چرخه عمر Plugin غیرفعال هستند. به‌جای آن، انتخاب بسته Plugin و پیکربندی را از طریق منبع Nix مربوط به نصب مدیریت کنید؛ برای nix-openclaw، با [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور آغاز کنید. `openclaw plugins update <id-or-npm-spec>` برای نصب‌های رهگیری‌شده اعمال می‌شود. دادن یک مشخصات بسته npm با dist-tag یا نسخه دقیق، نام بسته را به رکورد Plugin رهگیری‌شده برمی‌گرداند و مشخصات جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند. دادن نام بسته بدون نسخه، یک نصب دقیق پین‌شده را به خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin نصب‌شده npm از قبل با نسخه حل‌شده و هویت آرتیفکت ثبت‌شده مطابقت داشته باشد، OpenClaw به‌روزرسانی را بدون دانلود، نصب مجدد، یا بازنویسی پیکربندی رد می‌کند.
وقتی `openclaw update` روی کانال بتا اجرا می‌شود، رکوردهای Plugin مربوط به خط پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند و وقتی انتشار بتایی برای Plugin وجود نداشته باشد به پیش‌فرض/latest برمی‌گردند. نسخه‌های دقیق و تگ‌های صریح پین‌شده باقی می‌مانند.

OpenClaw هنوز کانال‌های Plugin با پشتیبانی LTS یا ماهانه را ارائه نمی‌کند. کار برنامه‌ریزی‌شده برای خط پشتیبانی ماهانه نیاز خواهد داشت که تگ‌های npm و ClawHub مربوط به Plugin، به‌جای استفاده بی‌صدا از `latest`، همان خط پشتیبانی بسته اصلی را دنبال کنند.

`--pin` فقط برای npm است. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای مشخصات npm، فراداده منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک بازنویسی اضطراری برای مثبت‌های کاذب اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌ها و به‌روزرسانی‌های Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند. اسکن‌های نصب، فایل‌ها و دایرکتوری‌های رایج تست مانند `tests/`، `__tests__/`، `*.test.*`، و `*.spec.*` را نادیده می‌گیرند تا مانع ماک‌های تست بسته‌بندی‌شده نشوند؛ نقاط ورود زمان اجرای اعلام‌شده Plugin همچنان اسکن می‌شوند، حتی اگر از یکی از آن نام‌ها استفاده کنند.

این پرچم CLI فقط برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب وابستگی Skills مبتنی بر Gateway به‌جای آن از بازنویسی درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کند، درحالی‌که `openclaw skills install` همچنان جریان جداگانه دانلود/نصب مهارت ClawHub است.

اگر Pluginی که در ClawHub منتشر کرده‌اید به‌دلیل اسکن پنهان یا مسدود شده است، داشبورد ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در دستگاه خودتان اثر می‌گذارد؛ از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا انتشار مسدودشده را عمومی کند.

باندل‌های سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin شرکت می‌کنند. پشتیبانی زمان اجرای فعلی شامل Skills باندل، command-skills کلود، پیش‌فرض‌های `settings.json` کلود، پیش‌فرض‌های `lspServers` اعلام‌شده در `.lsp.json` و مانیفست کلود، command-skills مربوط به Cursor، و دایرکتوری‌های هوک سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های باندل شناسایی‌شده به‌همراه ورودی‌های سرور MCP و LSP پشتیبانی‌شده یا پشتیبانی‌نشده را برای Pluginهای مبتنی بر باندل گزارش می‌کند.

منابع marketplace می‌توانند یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`، یک ریشه marketplace محلی یا مسیر `marketplace.json`، یک کوتاه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git باشند. برای marketplaceهای راه‌دور، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API Plugin

Pluginهای بومی یک شیء ورودی صادر می‌کنند که `register(api)` را در دسترس می‌گذارد. Pluginهای قدیمی‌تر ممکن است همچنان از `activate(api)` به‌عنوان نام مستعار قدیمی استفاده کنند، اما Pluginهای جدید باید از `register` استفاده کنند.

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

OpenClaw شیء ورودی را بارگذاری می‌کند و هنگام فعال‌سازی Plugin، `register(api)` را فراخوانی می‌کند. بارگذار هنوز برای Pluginهای قدیمی‌تر به `activate(api)` برمی‌گردد، اما Pluginهای همراه و Pluginهای خارجی جدید باید `register` را قرارداد عمومی در نظر بگیرند.

`api.registrationMode` به یک Plugin می‌گوید چرا ورودی آن در حال بارگذاری است:

| حالت | معنا |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | فعال‌سازی زمان اجرا. ابزارها، هوک‌ها، سرویس‌ها، فرمان‌ها، مسیرها، و سایر اثرات جانبی زنده را ثبت کنید. |
| `discovery` | کشف قابلیت فقط‌خواندنی. ارائه‌دهندگان و فراداده را ثبت کنید؛ کد ورودی Plugin مورد اعتماد ممکن است بارگذاری شود، اما اثرات جانبی زنده را رد کنید. |
| `setup-only` | بارگذاری فراداده راه‌اندازی کانال از طریق یک ورودی راه‌اندازی سبک. |
| `setup-runtime` | بارگذاری راه‌اندازی کانال که به ورودی زمان اجرا نیز نیاز دارد. |
| `cli-metadata` | فقط گردآوری فراداده فرمان CLI. |

ورودی‌های Plugin که سوکت‌ها، پایگاه‌های داده، کارگرهای پس‌زمینه، یا کلاینت‌های بلندمدت را باز می‌کنند باید آن اثرات جانبی را با `api.registrationMode === "full"` محافظت کنند. بارگذاری‌های کشف جدا از بارگذاری‌های فعال‌سازی کش می‌شوند و جایگزین رجیستری Gateway در حال اجرا نمی‌شوند. کشف غیر‌فعال‌کننده است، نه بدون ایمپورت: OpenClaw ممکن است ورودی Plugin مورد اعتماد یا ماژول Plugin کانال را برای ساخت اسنپ‌شات ارزیابی کند. سطح بالای ماژول‌ها را سبک و بدون اثر جانبی نگه دارید، و کلاینت‌های شبکه، زیرفرایندها، شنونده‌ها، خواندن اعتبارنامه‌ها، و راه‌اندازی سرویس را پشت مسیرهای زمان اجرای کامل منتقل کنید.

روش‌های ثبت رایج:

| روش | چیزی که ثبت می‌کند |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ارائه‌دهنده مدل (LLM) |
| `registerChannel` | کانال چت |
| `registerTool` | ابزار عامل |
| `registerHook` / `on(...)` | هوک‌های چرخه عمر |
| `registerSpeechProvider` | تبدیل متن به گفتار / STT |
| `registerRealtimeTranscriptionProvider` | STT استریمینگ |
| `registerRealtimeVoiceProvider` | صدای بلادرنگ دوطرفه |
| `registerMediaUnderstandingProvider` | تحلیل تصویر/صوت |
| `registerImageGenerationProvider` | تولید تصویر |
| `registerMusicGenerationProvider` | تولید موسیقی |
| `registerVideoGenerationProvider` | تولید ویدئو |
| `registerWebFetchProvider` | ارائه‌دهنده دریافت وب / اسکرپ |
| `registerWebSearchProvider` | جستجوی وب |
| `registerHttpRoute` | نقطه پایانی HTTP |
| `registerCommand` / `registerCli` | فرمان‌های CLI |
| `registerContextEngine` | موتور زمینه |
| `registerService` | سرویس پس‌زمینه |

رفتار محافظ هوک برای هوک‌های چرخه عمر تایپ‌شده:

- `before_tool_call`: `{ block: true }` پایانی است؛ هندلرهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` بی‌اثر است و یک مسدودسازی قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایانی است؛ هندلرهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` بی‌اثر است و یک مسدودسازی قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` پایانی است؛ هندلرهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` بی‌اثر است و یک لغو قبلی را پاک نمی‌کند.

اجراهای app-server بومی Codex، رویدادهای ابزار بومی Codex را از طریق پل به این سطح قلاب بازمی‌گردانند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند، و در تأییدهای `PermissionRequest` مربوط به Codex مشارکت کنند. این پل هنوز آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی زمان اجرای Codex در
[قرارداد پشتیبانی Codex harness v1](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل قلاب‌های نوع‌دار، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) - Plugin خودتان را بسازید
- [بسته‌های Plugin](/fa/plugins/bundles) - سازگاری بسته Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) - شمای مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) - ابزارهای عامل را در یک Plugin اضافه کنید
- [درون‌سازوکارهای Plugin](/fa/plugins/architecture) - مدل قابلیت و مسیر بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) - فهرست‌های شخص ثالث
