---
read_when:
    - نصب یا پیکربندی Plugin‌ها
    - آشنایی با قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: نصب، پیکربندی و مدیریت Plugin‌های OpenClaw
title: Pluginها
x-i18n:
    generated_at: "2026-05-06T12:00:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cb1f43f7ccc99889b62648562319d205a13072a93cc9fbc7ca0e00c96e19ed6
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها قابلیت‌های جدیدی به OpenClaw اضافه می‌کنند: کانال‌ها، ارائه‌دهندگان مدل،
چارچوب‌های اجرای عامل، ابزارها، Skills، گفتار، رونویسی بلادرنگ، صدای بلادرنگ،
درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، جست‌وجوی وب و موارد دیگر. برخی
Pluginها **هسته‌ای** هستند (همراه OpenClaw عرضه می‌شوند) و برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. npm همچنان برای نصب مستقیم و
برای مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw پشتیبانی می‌شود تا
این مهاجرت کامل شود.

## شروع سریع

برای نمونه‌های آماده کپی و جای‌گذاری نصب، فهرست‌گیری، حذف نصب، به‌روزرسانی و
انتشار، [مدیریت Pluginها](/fa/plugins/manage-plugins) را ببینید.

<Steps>
  <Step title="ببینید چه چیزی بارگذاری شده است">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="یک Plugin نصب کنید">
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

  <Step title="Gateway را راه‌اندازی مجدد کنید">
    ```bash
    openclaw gateway restart
    ```

    سپس در فایل پیکربندی خود، زیر `plugins.entries.\<id\>.config` پیکربندی کنید.

  </Step>

  <Step title="مدیریت بومی چت">
    در یک Gateway در حال اجرا، دستورهای فقط مخصوص مالک یعنی `/plugins enable` و
    `/plugins disable` بارگذار مجدد پیکربندی Gateway را فعال می‌کنند. Gateway
    سطوح زمان اجرای Plugin را در همان فرایند دوباره بارگذاری می‌کند، و نوبت‌های
    جدید عامل فهرست ابزارهای خود را از registry تازه‌سازی‌شده بازسازی می‌کنند.
    `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین Gateway به‌جای
    وانمود کردن به اینکه فرایند فعلی می‌تواند ماژول‌های ازقبل importشده را با
    اطمینان دوباره بارگذاری کند، درخواست راه‌اندازی مجدد می‌دهد.

  </Step>

  <Step title="Plugin را تأیید کنید">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway، hookها یا
    دستورهای CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید.
    `inspect` ساده یک بررسی سرد manifest/registry است و عمداً از import کردن
    زمان اجرای Plugin پرهیز می‌کند.

  </Step>
</Steps>

اگر کنترل بومی چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از
این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver مربوط به CLI استفاده می‌کند: مسیر/آرشیو محلی،
`clawhub:<pkg>` صریح، `npm:<pkg>` صریح، `npm-pack:<path.tgz>` صریح،
`git:<repo>` صریح، یا مشخصات بسته بدون پیشوند از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولاً به‌صورت fail-closed متوقف می‌شود و شما
را به `openclaw doctor --fix` ارجاع می‌دهد. تنها استثنای بازیابی، مسیر محدودی
برای نصب دوباره Plugin همراه است برای Pluginهایی که به
`openclaw.install.allowInvalidConfigRecovery` opt in می‌کنند.
هنگام شروع Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگر
fail-closed می‌شود. برای قرنطینه کردن پیکربندی بد Plugin، `openclaw doctor --fix`
را اجرا کنید؛ این کار با غیرفعال کردن آن ورودی Plugin و حذف payload پیکربندی
نامعتبر آن انجام می‌شود، و پشتیبان‌گیری عادی پیکربندی مقادیر قبلی را نگه
می‌دارد.
وقتی پیکربندی یک کانال به Pluginی اشاره می‌کند که دیگر قابل کشف نیست اما همان
شناسه قدیمی Plugin هنوز در پیکربندی Plugin یا رکوردهای نصب باقی مانده است،
شروع Gateway هشدارهایی ثبت می‌کند و به‌جای مسدود کردن همه کانال‌های دیگر، آن
کانال را نادیده می‌گیرد. برای حذف ورودی‌های قدیمی کانال/Plugin،
`openclaw doctor --fix` را اجرا کنید؛ کلیدهای ناشناخته کانال بدون شواهد
Plugin قدیمی همچنان اعتبارسنجی را fail می‌کنند تا خطاهای تایپی قابل مشاهده
بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های قدیمی Plugin بی‌اثر در
نظر گرفته می‌شوند: شروع Gateway کار کشف/بارگذاری Plugin را رد می‌کند و
`openclaw doctor` به‌جای حذف خودکار، پیکربندی Plugin غیرفعال را حفظ می‌کند.
اگر می‌خواهید شناسه‌های قدیمی Plugin حذف شوند، پیش از اجرای پاکسازی doctor،
Pluginها را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط در جریان‌های نصب/به‌روزرسانی صریح یا تعمیر doctor
انجام می‌شود. شروع Gateway، بارگذاری مجدد پیکربندی و بازرسی زمان اجرا package
managerها را اجرا نمی‌کنند و درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای
محلی باید از قبل وابستگی‌های خود را نصب کرده باشند، در حالی که Pluginهای npm،
git و ClawHub زیر ریشه‌های Plugin مدیریت‌شده OpenClaw نصب می‌شوند. وابستگی‌های
npm ممکن است درون ریشه npm مدیریت‌شده OpenClaw hoist شوند؛ نصب/به‌روزرسانی
پیش از trust آن ریشه مدیریت‌شده را اسکن می‌کند و حذف نصب، بسته‌های مدیریت‌شده
با npm را از طریق npm حذف می‌کند. Pluginهای خارجی و مسیرهای بارگذاری سفارشی
همچنان باید از طریق `openclaw plugins install` نصب شوند. برای دیدن
`dependencyStatus` ایستای هر Plugin قابل مشاهده، بدون import کردن کد زمان اجرا
یا تعمیر وابستگی‌ها، از `openclaw plugins list --json` استفاده کنید.
برای چرخه عمر زمان نصب، [حل وابستگی‌های Plugin](/fa/plugins/dependency-resolution)
را ببینید.

### مالکیت مسیر Plugin مسدودشده

اگر عیب‌یابی Plugin بگوید
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
و اعتبارسنجی پیکربندی با `plugin present but blocked` ادامه پیدا کند، OpenClaw
فایل‌های Pluginی پیدا کرده که متعلق به کاربر یونیکس متفاوتی از فرایندی هستند
که آن‌ها را بارگذاری می‌کند. پیکربندی Plugin را سر جای خود نگه دارید؛ مالکیت
فایل‌سیستم را اصلاح کنید یا OpenClaw را با همان کاربری اجرا کنید که مالک
دایرکتوری state است.

برای نصب‌های Docker، تصویر رسمی با کاربر `node` (uid `1000`) اجرا می‌شود،
بنابراین دایرکتوری‌های پیکربندی و فضای کاری OpenClaw که از میزبان bind-mounted
شده‌اند معمولاً باید متعلق به uid `1000` باشند:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

اگر عمداً OpenClaw را به‌عنوان root اجرا می‌کنید، ریشه Plugin مدیریت‌شده را
به‌جای آن به مالکیت root تعمیر کنید:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

پس از اصلاح مالکیت، `openclaw doctor --fix` یا
`openclaw plugins registry --refresh` را دوباره اجرا کنید تا registry ماندگار
Plugin با فایل‌های تعمیرشده هماهنگ شود.

برای نصب‌های npm، selectorهای تغییرپذیر مانند `latest` یا یک dist-tag پیش از
نصب resolve می‌شوند و سپس در ریشه npm مدیریت‌شده OpenClaw به نسخه دقیق
تأییدشده pin می‌شوند. پس از پایان کار npm، OpenClaw تأیید می‌کند که ورودی
`package-lock.json` نصب‌شده همچنان با نسخه resolveشده و integrity مطابقت دارد.
اگر npm metadata متفاوتی برای بسته بنویسد، نصب fail می‌شود و بسته مدیریت‌شده
به‌جای پذیرش artifact متفاوت Plugin، roll back می‌شود.
ریشه‌های npm مدیریت‌شده همچنین `overrides` سطح بسته npm مربوط به OpenClaw را
به ارث می‌برند، بنابراین pinهای امنیتی که از میزبان بسته‌بندی‌شده محافظت
می‌کنند، برای وابستگی‌های hoistشده Pluginهای خارجی نیز اعمال می‌شوند.

چک‌اوت‌های منبع، workspaceهای pnpm هستند. اگر OpenClaw را clone می‌کنید تا روی
Pluginهای همراه کار کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw
Pluginهای همراه را از `extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و
وابستگی‌های محلی بسته مستقیماً استفاده شوند. نصب‌های ساده npm در ریشه برای
OpenClaw بسته‌بندی‌شده هستند، نه توسعه روی چک‌اوت منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را تشخیص می‌دهد:

| قالب       | نحوه کارکرد                                                       | مثال‌ها                                                |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **بومی**   | `openclaw.plugin.json` + ماژول زمان اجرا؛ درون‌فرایندی اجرا می‌شود | Pluginهای رسمی، بسته‌های npm جامعه                    |
| **باندل**  | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle،
[بسته‌های Plugin](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin بومی هستید، از [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview) شروع کنید.

## نقاط ورود بسته

بسته‌های npm مربوط به Plugin بومی باید `openclaw.extensions` را در
`package.json` اعلام کنند. هر ورودی باید داخل دایرکتوری بسته باقی بماند و به
یک فایل زمان اجرای خواندنی resolve شود، یا به یک فایل منبع TypeScript با همتای
JavaScript ساخته‌شده و استنتاج‌شده، مانند `src/index.ts` به `dist/index.js`.
نصب‌های بسته‌بندی‌شده باید آن خروجی زمان اجرای JavaScript را همراه خود داشته
باشند. fallback منبع TypeScript برای چک‌اوت‌های منبع و مسیرهای توسعه محلی است،
نه برای بسته‌های npm نصب‌شده در ریشه Plugin مدیریت‌شده OpenClaw.

اگر یک هشدار بسته مدیریت‌شده بگوید که `requires compiled runtime output for
TypeScript entry ...`، آن بسته بدون فایل‌های JavaScriptی منتشر شده که OpenClaw
در زمان اجرا نیاز دارد. این یک مشکل بسته‌بندی Plugin است، نه مشکل پیکربندی
محلی. پس از اینکه ناشر JavaScript کامپایل‌شده را دوباره منتشر کرد، Plugin را
به‌روزرسانی یا دوباره نصب کنید، یا تا زمانی که بسته اصلاح‌شده در دسترس قرار
گیرد آن Plugin را غیرفعال/حذف نصب کنید.

وقتی فایل‌های منتشرشده زمان اجرا در همان مسیرهای ورودی‌های منبع قرار ندارند،
از `openclaw.runtimeExtensions` استفاده کنید. وقتی وجود داشته باشد،
`runtimeExtensions` باید دقیقاً برای هر ورودی `extensions` یک ورودی داشته
باشد. فهرست‌های نامطابق به‌جای fallback بی‌صدا به مسیرهای منبع، نصب و کشف
Plugin را fail می‌کنند. اگر `openclaw.setupEntry` را نیز منتشر می‌کنید، برای
همتای JavaScript ساخته‌شده آن از `openclaw.runtimeSetupEntry` استفاده کنید؛
وقتی این فایل اعلام شود، وجود آن الزامی است.

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

### بسته‌های npm متعلق به OpenClaw در زمان مهاجرت

ClawHub مسیر اصلی توزیع برای بیشتر Pluginها است. انتشارهای بسته‌بندی‌شده فعلی
OpenClaw از قبل بسیاری از Pluginهای رسمی را bundle می‌کنند، بنابراین این‌ها در
راه‌اندازی‌های عادی به نصب جداگانه npm نیاز ندارند. تا زمانی که هر Plugin
متعلق به OpenClaw به ClawHub مهاجرت کند، OpenClaw همچنان برخی بسته‌های Plugin
`@openclaw/*` را روی npm برای نصب‌های قدیمی/سفارشی و گردش‌کارهای مستقیم npm
عرضه می‌کند.

اگر npm یک بسته Plugin با نام `@openclaw/*` را deprecated گزارش کند، آن نسخه
بسته از یک رشته انتشار قدیمی‌تر بسته خارجی است. تا زمانی که بسته npm جدیدتری
منتشر شود، از Plugin همراه در OpenClaw فعلی یا از یک چک‌اوت محلی استفاده کنید.

| Plugin          | بسته                      | مستندات                                   |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/fa/channels/bluebubbles)       |
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

### هسته‌ای (همراه OpenClaw عرضه می‌شود)

<AccordionGroup>
  <Accordion title="ارائه‌دهندگان مدل (به‌طور پیش‌فرض فعال)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginهای حافظه">
    - `memory-core` - جست‌وجوی حافظهٔ همراه (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` - حافظهٔ بلندمدت مبتنی بر LanceDB با یادآوری/ثبت خودکار (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های یادآوری، و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌طور پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر موارد">
    - `browser` - Plugin مرورگر همراه برای ابزار مرورگر، CLI `openclaw browser`، متد Gateway `browser.request`، runtime مرورگر، و سرویس کنترل مرورگر پیش‌فرض (به‌طور پیش‌فرض فعال است؛ پیش از جایگزین کردن آن غیرفعالش کنید)
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
| `bundledDiscovery` | حالت کشف Pluginهای همراه (به‌طور پیش‌فرض `allowlist`)    |
| `deny`             | فهرست منع Pluginها (اختیاری؛ منع اولویت دارد)                     |
| `load.paths`       | فایل‌ها/دایرکتوری‌های اضافی Plugin                            |
| `slots`            | انتخاب‌گرهای جایگاه انحصاری (مانند `memory`، `contextEngine`) |
| `entries.\<id\>`   | کلیدهای فعال/غیرفعال‌سازی و پیکربندی هر Plugin                               |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Pluginهای فهرست‌شده می‌توانند بارگذاری شوند یا ابزارها را ارائه کنند، حتی اگر `tools.allow` شامل `"*"` یا نام ابزار مشخصی متعلق به یک Plugin باشد. اگر فهرست مجاز ابزارها به ابزارهای Plugin اشاره می‌کند، شناسه‌های Plugin مالک را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` دربارهٔ این شکل هشدار می‌دهد.

`plugins.bundledDiscovery` برای پیکربندی‌های جدید به‌طور پیش‌فرض `"allowlist"` است، بنابراین یک موجودی محدودکنندهٔ `plugins.allow` همچنین Pluginهای ارائه‌دهندهٔ همراهِ حذف‌شده را مسدود می‌کند، از جمله کشف ارائه‌دهندهٔ جست‌وجوی وب در runtime. Doctor هنگام مهاجرت، پیکربندی‌های قدیمی‌تر با فهرست مجاز محدودکننده را با `"compat"` مهر می‌زند تا ارتقاها رفتار قدیمی ارائه‌دهندهٔ همراه را نگه دارند تا زمانی که اپراتور حالت سخت‌گیرانه‌تر را انتخاب کند. `plugins.allow` خالی همچنان تنظیم‌نشده/باز تلقی می‌شود.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، باعث بارگذاری مجدد درون‌فرایندی Pluginهای Gateway می‌شوند. نوبت‌های جدید عامل، فهرست ابزارهای خود را از رجیستری به‌روزشدهٔ Plugin بازسازی می‌کنند. عملیات‌هایی که منبع را تغییر می‌دهند، مانند نصب، به‌روزرسانی، و حذف نصب، همچنان فرایند Gateway را بازراه‌اندازی می‌کنند، چون ماژول‌های Plugin که از قبل import شده‌اند را نمی‌توان با ایمنی درجا جایگزین کرد.

`openclaw plugins list` یک عکس فوری محلی از رجیستری/پیکربندی Plugin است. یک Plugin با وضعیت `enabled` در آن‌جا یعنی رجیستری ماندگار و پیکربندی فعلی اجازه می‌دهند Plugin مشارکت کند. این ثابت نمی‌کند که یک Gateway راه‌دور که از قبل در حال اجراست، با همان کد Plugin دوباره بارگذاری یا بازراه‌اندازی شده است. در راه‌اندازی‌های VPS/کانتینر با فرایندهای wrapper، بازراه‌اندازی‌ها یا نوشتن‌های محرک بارگذاری مجدد را به فرایند واقعی `openclaw gateway run` بفرستید، یا وقتی بارگذاری مجدد خطا گزارش می‌کند، برای Gateway در حال اجرا از `openclaw gateway restart` استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال در برابر مفقود در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به شناسهٔ Pluginای اشاره می‌کند که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده مطابقت ندارد. شروع Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر را با غیرفعال کردن آن و حذف payload پیکربندی‌اش قرنطینه کند.

</Accordion>

## کشف و اولویت

OpenClaw در این ترتیب برای Pluginها اسکن می‌کند (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` - مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که به دایرکتوری‌های Plugin همراه بسته‌بندی‌شدهٔ خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛ برای حذف آن aliasهای کهنه، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌طور پیش‌فرض فعال‌اند (ارائه‌دهندگان مدل، گفتار).
    برخی دیگر به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولاً Pluginهای همراه را از درخت کامپایل‌شدهٔ `dist/extensions` resolve می‌کنند. اگر یک دایرکتوری منبع Plugin همراه روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount شود، برای مثال `/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mount‌شده را به‌عنوان overlay منبع همراه تلقی می‌کند و آن را پیش از بستهٔ `/app/dist/extensions/synology-chat` کشف می‌کند. این باعث می‌شود loopهای کانتینری نگه‌دارنده بدون برگرداندن همهٔ Pluginهای همراه به منبع TypeScript کار کنند. برای اجبار به استفاده از بسته‌های dist بسته‌بندی‌شده حتی وقتی mountهای overlay منبع وجود دارند، `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همهٔ Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow پیروز است
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهای با منشأ workspace **به‌طور پیش‌فرض غیرفعال‌اند** (باید صریحاً فعال شوند)
- Pluginهای همراه، مگر اینکه override شوند، از مجموعهٔ built-in پیش‌فرض-روشن پیروی می‌کنند
- جایگاه‌های انحصاری می‌توانند Plugin انتخاب‌شده برای آن جایگاه را اجباراً فعال کنند
- برخی Pluginهای همراه opt-in وقتی پیکربندی از سطحی متعلق به Plugin نام می‌برد، مانند ارجاع مدل ارائه‌دهنده، پیکربندی channel، یا runtime harness، به‌طور خودکار فعال می‌شوند
- پیکربندی کهنهٔ Plugin تا زمانی که `plugins.enabled: false` فعال است حفظ می‌شود؛ اگر می‌خواهید شناسه‌های کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای Codex خانوادهٔ OpenAI مرزهای جداگانهٔ Plugin را نگه می‌دارند:
  `openai-codex/*` متعلق به Plugin OpenAI است، در حالی که Plugin app-server همراه Codex با `agentRuntime.id: "codex"` یا ارجاع‌های مدل قدیمی `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` ظاهر می‌شود اما اثرات جانبی یا hookهای `register(api)` در ترافیک گفت‌وگوی زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال Gateway، profile، مسیر پیکربندی، و فرایند همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را بازراه‌اندازی کنید. در کانتینرهای wrapper، PID 1 ممکن است فقط supervisor باشد؛ فرایند فرزند `openclaw gateway run` را بازراه‌اندازی یا signal کنید.
- برای تأیید ثبت hookها و diagnostics از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. hookهای گفت‌وگوی غیرهمراه مانند `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تعویض مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از resolve مدل برای نوبت‌های عامل اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل خروجی دستیار تولید کند.
- برای اثبات مدل مؤثر نشست، از `openclaw sessions` یا سطوح نشست/وضعیت Gateway استفاده کنید و هنگام اشکال‌زدایی payloadهای ارائه‌دهنده، Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### راه‌اندازی کند ابزار Plugin

اگر به نظر می‌رسد نوبت‌های عامل هنگام آماده‌سازی ابزارها متوقف می‌شوند، logging سطح trace را فعال کنید و خطوط زمان‌بندی factory ابزار Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند، شامل شناسهٔ Plugin، نام‌های ابزار اعلام‌شده، شکل نتیجه، و اینکه ابزار اختیاری است یا نه. وقتی یک factory حداقل ۱ ثانیه طول بکشد یا آماده‌سازی کل factory ابزار Plugin حداقل ۵ ثانیه طول بکشد، خطوط کند به هشدار ارتقا می‌یابند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolveهای تکراری با همان context مؤثر درخواست cache می‌کند. کلید cache شامل پیکربندی مؤثر runtime، workspace، شناسه‌های عامل/نشست، سیاست sandbox، تنظیمات مرورگر، context تحویل، هویت درخواست‌دهنده، و وضعیت مالکیت است، بنابراین factoryهایی که به این فیلدهای مورد اعتماد وابسته‌اند هنگام تغییر context دوباره اجرا می‌شوند.

اگر زمان‌بندی تحت سلطهٔ یک Plugin است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید بارگذاری وابستگی‌های پرهزینه را به پشت مسیر اجرای ابزار منتقل کنند، نه اینکه آن را داخل factory ابزار انجام دهند.

### مالکیت تکراری channel یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان channel، جریان راه‌اندازی، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin channel خارجی در کنار یک Plugin همراه است که اکنون همان شناسهٔ channel را فراهم می‌کند.

مراحل اشکال‌زدایی:

- برای دیدن همهٔ Pluginهای فعال و منشأشان، `openclaw plugins list --enabled --verbose` را اجرا کنید.
- برای هر Plugin مشکوک، `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و `channels`، `channelConfigs`، `tools`، و diagnostics را مقایسه کنید.
- پس از نصب یا حذف بسته‌های Plugin، `openclaw plugins registry --refresh` را اجرا کنید تا metadata ماندگار نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، رجیستری، یا پیکربندی، Gateway را بازراه‌اندازی کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً دیگری را برای همان شناسهٔ channel جایگزین می‌کند، Plugin ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسهٔ Plugin دارای اولویت پایین‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکراری بودن تصادفی است، یک طرف را با `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin کهنه را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را نگه می‌دارد و تعارض را گزارش می‌کند. یک مالک برای channel انتخاب کنید یا ابزارهای متعلق به Plugin را تغییرنام دهید تا سطح runtime بدون ابهام باشد.

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

| جایگاه            | چه چیزی را کنترل می‌کند      | پیش‌فرض             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin حافظهٔ فعال  | `memory-core`       |
| `contextEngine` | موتور context فعال | `legacy` (built-in) |

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

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری از آن‌ها به‌صورت پیش‌فرض فعال هستند (برای نمونه، ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه). سایر Pluginهای همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا بسته hook موجود را در همان محل بازنویسی می‌کند. برای ارتقاهای معمول Pluginهای npm ردیابی‌شده از `openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون `--link` به‌جای کپی کردن روی مقصد نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال‌سازی به آن allowlist اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، نصب آن ورودی deny قدیمی را حذف می‌کند تا نصب صریح بلافاصله پس از راه‌اندازی دوباره قابل بارگذاری باشد.

OpenClaw یک رجیستری محلی پایدار Plugin را به‌عنوان مدل خواندن سرد برای فهرست Pluginها، مالکیت مشارکت‌ها، و برنامه‌ریزی شروع به کار نگه می‌دارد. جریان‌های نصب، به‌روزرسانی، حذف نصب، فعال‌سازی و غیرفعال‌سازی پس از تغییر وضعیت Plugin، آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فراداده نصب پایدار را در `installRecords` سطح بالا و فراداده manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر رجیستری وجود نداشته باشد، قدیمی باشد، یا نامعتبر باشد، `openclaw plugins registry --refresh` نمای manifest آن را از رکوردهای نصب، سیاست پیکربندی، و فراداده manifest/package بدون بارگذاری ماژول‌های runtime مربوط به Plugin بازسازی می‌کند.
`openclaw plugins update <id-or-npm-spec>` روی نصب‌های ردیابی‌شده اعمال می‌شود. ارسال یک مشخصه بسته npm با dist-tag یا نسخه دقیق، نام بسته را دوباره به رکورد Plugin ردیابی‌شده resolve می‌کند و مشخصه جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند. ارسال نام بسته بدون نسخه، یک نصب دقیق pin‌شده را به خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin نصب‌شده npm از قبل با نسخه resolve‌شده و هویت artifact ثبت‌شده مطابق باشد، OpenClaw بدون دانلود، نصب دوباره، یا بازنویسی پیکربندی، به‌روزرسانی را رد می‌کند.
وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای Plugin مربوط به npm و ClawHub در خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند و وقتی انتشار beta برای Plugin وجود نداشته باشد به default/latest برمی‌گردند. نسخه‌های دقیق و tagهای صریح pin‌شده باقی می‌مانند.

`--pin` فقط مخصوص npm است. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای مشخصه npm، فراداده منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای مثبت‌های کاذب اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌ها و به‌روزرسانی‌های Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان مسدودسازی‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند. اسکن‌های نصب، فایل‌ها و پوشه‌های رایج تست مانند `tests/`، `__tests__/`، `*.test.*` و `*.spec.*` را نادیده می‌گیرند تا mockهای تست بسته‌بندی‌شده باعث مسدود شدن نشوند؛ entrypointهای runtime اعلام‌شده Plugin حتی اگر یکی از این نام‌ها را استفاده کنند همچنان اسکن می‌شوند.

این flag در CLI فقط روی جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills که با پشتیبانی Gateway انجام می‌شوند به‌جای آن از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان جریان جداگانه دانلود/نصب Skills از ClawHub باقی می‌ماند.

اگر Pluginای که روی ClawHub منتشر کرده‌اید به‌دلیل یک اسکن پنهان یا مسدود شده است، داشبورد ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید آن را دوباره بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در دستگاه خودتان اثر می‌گذارد؛ از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را عمومی کند.

بسته‌های سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin شرکت می‌کنند. پشتیبانی runtime فعلی شامل Skills بسته، command-skillهای Claude، پیش‌فرض‌های `settings.json` برای Claude، پیش‌فرض‌های `.lsp.json` در Claude و `lspServers` اعلام‌شده در manifest، command-skillهای Cursor، و پوشه‌های hook سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های بسته تشخیص‌داده‌شده به‌همراه ورودی‌های پشتیبانی‌شده یا پشتیبانی‌نشده سرور MCP و LSP برای Pluginهای مبتنی بر بسته را گزارش می‌کند.

منابع marketplace می‌توانند یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`، یک ریشه marketplace محلی یا مسیر `marketplace.json`، یک کوتاه‌نوشت GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git باشند. برای marketplaceهای راه‌دور، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API Plugin

Pluginهای بومی یک شیء entry صادر می‌کنند که `register(api)` را ارائه می‌دهد. Pluginهای قدیمی‌تر ممکن است همچنان از `activate(api)` به‌عنوان alias قدیمی استفاده کنند، اما Pluginهای جدید باید از `register` استفاده کنند.

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

OpenClaw شیء entry را بارگذاری می‌کند و در هنگام فعال‌سازی Plugin، `register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` برمی‌گردد، اما Pluginهای همراه و Pluginهای خارجی جدید باید `register` را قرارداد عمومی بدانند.

`api.registrationMode` به یک Plugin می‌گوید چرا entry آن در حال بارگذاری است:

| حالت | معنی |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | فعال‌سازی runtime. ابزارها، hookها، سرویس‌ها، فرمان‌ها، routeها، و سایر side effectهای زنده را ثبت کنید. |
| `discovery` | کشف قابلیت فقط‌خواندنی. ارائه‌دهندگان و فراداده را ثبت کنید؛ کد entry مربوط به Plugin مورداعتماد ممکن است بارگذاری شود، اما side effectهای زنده را رد کنید. |
| `setup-only` | بارگذاری فراداده setup کانال از طریق یک entry سبک setup. |
| `setup-runtime` | بارگذاری setup کانال که به entry مربوط به runtime هم نیاز دارد. |
| `cli-metadata` | فقط گردآوری فراداده فرمان CLI. |

entryهای Plugin که socket، پایگاه‌داده، worker پس‌زمینه، یا کلاینت‌های بلندمدت باز می‌کنند باید آن side effectها را با `api.registrationMode === "full"` محافظت کنند. بارگذاری‌های discovery جدا از بارگذاری‌های فعال‌سازی cache می‌شوند و جایگزین رجیستری Gateway در حال اجرا نمی‌شوند. discovery غیر‌فعال‌ساز است، نه بدون import: OpenClaw ممکن است entry مورداعتماد Plugin یا ماژول Plugin کانال را برای ساخت snapshot ارزیابی کند. سطح بالای ماژول‌ها را سبک و بدون side effect نگه دارید، و کلاینت‌های شبکه، subprocessها، listenerها، خواندن credentialها، و شروع سرویس را پشت مسیرهای full-runtime منتقل کنید.

روش‌های رایج ثبت:

| روش | آنچه ثبت می‌کند |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ارائه‌دهنده مدل (LLM) |
| `registerChannel` | کانال چت |
| `registerTool` | ابزار agent |
| `registerHook` / `on(...)` | hookهای چرخه عمر |
| `registerSpeechProvider` | تبدیل متن به گفتار / STT |
| `registerRealtimeTranscriptionProvider` | STT جریانی |
| `registerRealtimeVoiceProvider` | صدای realtime دوطرفه |
| `registerMediaUnderstandingProvider` | تحلیل تصویر/صدا |
| `registerImageGenerationProvider` | تولید تصویر |
| `registerMusicGenerationProvider` | تولید موسیقی |
| `registerVideoGenerationProvider` | تولید ویدئو |
| `registerWebFetchProvider` | ارائه‌دهنده واکشی / scrape وب |
| `registerWebSearchProvider` | جست‌وجوی وب |
| `registerHttpRoute` | endpoint HTTP |
| `registerCommand` / `registerCli` | فرمان‌های CLI |
| `registerContextEngine` | موتور context |
| `registerService` | سرویس پس‌زمینه |

رفتار محافظ hook برای hookهای چرخه عمر typed:

- `before_tool_call`: `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

app-server بومی Codex، رویدادهای ابزار بومی Codex را از طریق پل به این سطح hook برمی‌گرداند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند، و در تأییدهای `PermissionRequest` مربوط به Codex مشارکت کنند. bridge هنوز آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی runtime مربوط به Codex در [قرارداد پشتیبانی Codex harness v1](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hookهای typed، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) - Plugin خودتان را ایجاد کنید
- [بسته‌های Plugin](/fa/plugins/bundles) - سازگاری بسته‌های Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) - طرح‌واره مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) - افزودن ابزارهای عامل در یک Plugin
- [جزئیات داخلی Plugin](/fa/plugins/architecture) - مدل قابلیت و پایپ‌لاین بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) - فهرست‌های شخص ثالث
