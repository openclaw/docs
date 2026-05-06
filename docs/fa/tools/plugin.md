---
read_when:
    - نصب یا پیکربندی Pluginها
    - درک قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Pluginهای OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Pluginها
x-i18n:
    generated_at: "2026-05-06T09:48:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها قابلیت‌های تازه‌ای به OpenClaw اضافه می‌کنند: کانال‌ها، ارائه‌دهندگان مدل،
مهارهای عامل، ابزارها، Skills، گفتار، رونویسی بلادرنگ، صدای بلادرنگ،
درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، جستجوی وب، و موارد دیگر.
برخی Pluginها **هسته‌ای** هستند (همراه OpenClaw عرضه می‌شوند) و برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. Npm همچنان برای نصب مستقیم و برای
مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا پایان این مهاجرت پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های قابل کپی و جای‌گذاری نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی، و انتشار، ببینید
[مدیریت Pluginها](/fa/plugins/manage-plugins).

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

  <Step title="مدیریت بومیِ چت">
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` فقط برای مالک
    بارگذارِ دوباره پیکربندی Gateway را فعال می‌کنند. Gateway سطوح زمان‌اجرای Plugin
    را در همان فرایند دوباره بارگذاری می‌کند و نوبت‌های تازه عامل فهرست ابزار خود را از
    رجیستری تازه‌سازی‌شده دوباره می‌سازند. `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین
    Gateway به‌جای وانمود کردن به اینکه فرایند فعلی می‌تواند
    ماژول‌های ازپیش importشده را با امنیت دوباره بارگذاری کند، درخواست راه‌اندازی دوباره می‌دهد.

  </Step>

  <Step title="تأیید Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway،
    hookها، یا فرمان‌های CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید.
    `inspect` ساده یک بررسی سردِ manifest/registry است و عمداً از import کردن زمان‌اجرای Plugin پرهیز می‌کند.

  </Step>
</Steps>

اگر کنترل بومیِ چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver استفاده می‌کند که CLI استفاده می‌کند: مسیر/آرشیو محلی، 
`clawhub:<pkg>` صریح، `npm:<pkg>` صریح، `npm-pack:<path.tgz>` صریح،
`git:<repo>` صریح، یا مشخصات بسته بدون پیشوند از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولاً بسته و ایمن شکست می‌خورد و شما را به
`openclaw doctor --fix` راهنمایی می‌کند. تنها استثنای بازیابی، مسیر باریکِ نصب دوباره Plugin همراه‌سازی‌شده
برای Pluginهایی است که به
`openclaw.install.allowInvalidConfigRecovery` اجازه می‌دهند.
در هنگام راه‌اندازی Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگر
بسته و ایمن شکست می‌خورد. `openclaw doctor --fix` را اجرا کنید تا پیکربندی خراب Plugin را با
غیرفعال کردن آن ورودی Plugin و حذف payload نامعتبر پیکربندی آن قرنطینه کند؛ پشتیبان‌گیری عادی
پیکربندی مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی یک کانال به Pluginی اشاره می‌کند که دیگر قابل کشف نیست، اما
همان شناسه کهنه Plugin همچنان در پیکربندی Plugin یا رکوردهای نصب باقی مانده است، راه‌اندازی Gateway
هشدارها را ثبت می‌کند و به‌جای مسدود کردن همه کانال‌های دیگر، آن کانال را رد می‌کند.
`openclaw doctor --fix` را اجرا کنید تا ورودی‌های کهنه کانال/Plugin حذف شوند؛ کلیدهای ناشناخته
کانال بدون شواهد Plugin کهنه همچنان در اعتبارسنجی شکست می‌خورند تا غلط‌های تایپی
قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های کهنه Plugin غیرفعال تلقی می‌شوند:
راه‌اندازی Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor`
به‌جای حذف خودکار، پیکربندی غیرفعال Plugin را حفظ می‌کند. اگر می‌خواهید شناسه‌های کهنه Plugin حذف شوند،
پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط در جریان‌های نصب/به‌روزرسانی صریح یا
تعمیر doctor انجام می‌شود. راه‌اندازی Gateway، بارگذاری دوباره پیکربندی، و بازرسی زمان‌اجرا
مدیر بسته اجرا نمی‌کنند یا درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای محلی باید از پیش
وابستگی‌های خود را نصب کرده باشند، در حالی که Pluginهای npm، git، و ClawHub
زیر ریشه‌های مدیریت‌شده Plugin در OpenClaw نصب می‌شوند. وابستگی‌های npm ممکن است
در ریشه npm مدیریت‌شده OpenClaw hoist شوند؛ نصب/به‌روزرسانی پیش از
اعتماد، آن ریشه مدیریت‌شده را اسکن می‌کند و حذف نصب، بسته‌های مدیریت‌شده با npm را از طریق npm حذف می‌کند.
Pluginهای خارجی و مسیرهای بارگذاری سفارشی همچنان باید از طریق `openclaw plugins install` نصب شوند.
برای دیدن `dependencyStatus` ایستای هر
Plugin قابل مشاهده بدون import کردن کد زمان‌اجرا یا تعمیر وابستگی‌ها، از `openclaw plugins list --json` استفاده کنید.
برای چرخه عمر زمان نصب، ببینید [حل وابستگی Plugin](/fa/plugins/dependency-resolution).

### مالکیت مسیر Plugin مسدودشده

اگر عیب‌یابی Plugin بگوید
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
و اعتبارسنجی پیکربندی با `plugin present but blocked` ادامه پیدا کند، OpenClaw
فایل‌های Pluginی را پیدا کرده است که متعلق به کاربر Unix متفاوتی از فرایندی هستند که آن‌ها را بارگذاری می‌کند.
پیکربندی Plugin را سر جای خود نگه دارید؛ مالکیت فایل‌سیستم را اصلاح کنید یا
OpenClaw را با همان کاربری اجرا کنید که مالک دایرکتوری state است.

برای نصب‌های Docker، تصویر رسمی با کاربر `node` (uid `1000`) اجرا می‌شود، بنابراین
دایرکتوری‌های پیکربندی و workspace مربوط به OpenClaw که از میزبان bind-mounted شده‌اند، معمولاً باید
متعلق به uid `1000` باشند:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

اگر عمداً OpenClaw را به‌صورت root اجرا می‌کنید، ریشه مدیریت‌شده Plugin را به
مالکیت root تعمیر کنید:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

پس از اصلاح مالکیت، `openclaw doctor --fix` یا
`openclaw plugins registry --refresh` را دوباره اجرا کنید تا رجیستری ماندگار Plugin با
فایل‌های تعمیرشده همخوان شود.

برای نصب‌های npm، گزینشگرهای تغییرپذیر مانند `latest` یا یک dist-tag پیش از نصب
حل می‌شوند و سپس به نسخه دقیق تأییدشده در ریشه npm مدیریت‌شده OpenClaw
سنجاق می‌شوند. پس از پایان npm، OpenClaw بررسی می‌کند که ورودی نصب‌شده
`package-lock.json` همچنان با نسخه و integrity حل‌شده همخوان باشد. اگر
npm فراداده بسته متفاوتی بنویسد، نصب شکست می‌خورد و بسته مدیریت‌شده
به‌جای پذیرفتن artifact متفاوت Plugin، rollback می‌شود.

checkoutهای منبع، workspaceهای pnpm هستند. اگر OpenClaw را برای کار روی Pluginهای همراه‌سازی‌شده
clone می‌کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw Pluginهای همراه‌سازی‌شده را از
`extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و وابستگی‌های محلیِ بسته مستقیماً استفاده شوند.
نصب‌های ساده ریشه npm برای OpenClaw بسته‌بندی‌شده هستند، نه توسعه با checkout
منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را می‌شناسد:

| قالب     | روش کار                                                       | نمونه‌ها                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ماژول زمان‌اجرا؛ درون‌فرایندی اجرا می‌شود       | Pluginهای رسمی، بسته‌های npm جامعه               |
| **Bundle** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle، ببینید [Plugin Bundles](/fa/plugins/bundles).

اگر در حال نوشتن یک Plugin native هستید، از [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## نقاط ورود بسته

بسته‌های npm متعلق به Plugin native باید `openclaw.extensions` را در `package.json` اعلام کنند.
هر ورودی باید داخل دایرکتوری بسته بماند و به یک فایل زمان‌اجرای خواندنی
یا به یک فایل منبع TypeScript با همتای JavaScript ساخته‌شده استنتاج‌شده
مانند `src/index.ts` به `dist/index.js` resolve شود.
نصب‌های بسته‌بندی‌شده باید آن خروجی زمان‌اجرای JavaScript را همراه داشته باشند. fallback
منبع TypeScript برای checkoutهای منبع و مسیرهای توسعه محلی است، نه برای
بسته‌های npm نصب‌شده در ریشه مدیریت‌شده Plugin در OpenClaw.

اگر هشدار بسته مدیریت‌شده بگوید که برای
ورودی TypeScript به `requires compiled runtime output for
TypeScript entry ...` نیاز دارد، بسته بدون فایل‌های JavaScriptی منتشر شده است
که OpenClaw در زمان‌اجرا لازم دارد. این یک مشکل بسته‌بندی Plugin است، نه مشکل پیکربندی محلی.
پس از اینکه منتشرکننده JavaScript کامپایل‌شده را دوباره منتشر کرد، Plugin را به‌روزرسانی یا دوباره نصب کنید،
یا تا زمانی که بسته اصلاح‌شده در دسترس قرار گیرد، آن Plugin را غیرفعال/حذف نصب کنید.

وقتی فایل‌های زمان‌اجرای منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند، از `openclaw.runtimeExtensions` استفاده کنید.
در صورت وجود، `runtimeExtensions` باید دقیقاً برای هر ورودی `extensions`
یک ورودی داشته باشد. فهرست‌های ناهماهنگ به‌جای fallback بی‌صدا به مسیرهای منبع، نصب و
کشف Plugin را شکست می‌دهند. اگر `openclaw.setupEntry` را هم منتشر می‌کنید، برای همتای
JavaScript ساخته‌شده آن از `openclaw.runtimeSetupEntry` استفاده کنید؛ وقتی اعلام شود، آن فایل الزامی است.

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

ClawHub مسیر اصلی توزیع برای بیشتر Pluginها است. نسخه‌های بسته‌بندی‌شده فعلی
OpenClaw از پیش بسیاری از Pluginهای رسمی را همراه دارند، بنابراین آن‌ها در تنظیمات عادی
به نصب‌های جداگانه npm نیاز ندارند. تا زمانی که هر Plugin متعلق به OpenClaw
به ClawHub مهاجرت کند، OpenClaw همچنان برخی بسته‌های Plugin با نام `@openclaw/*` را روی
npm برای نصب‌های قدیمی‌تر/سفارشی و جریان‌های کاری مستقیم npm عرضه می‌کند.

اگر npm یک بسته Plugin با نام `@openclaw/*` را deprecated گزارش کند، آن نسخه بسته
از یک قطار بسته خارجی قدیمی‌تر است. تا زمانی که بسته npm تازه‌تری منتشر شود، از Plugin همراه‌شده با
OpenClaw فعلی یا یک checkout محلی استفاده کنید.

| Plugin          | بسته                    | مستندات                                       |
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
    - `memory-core` - جستجوی حافظه همراه‌سازی‌شده (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` - حافظه بلندمدت مبتنی بر LanceDB با auto-recall/capture (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    به [Memory LanceDB](/fa/plugins/memory-lancedb) برای راه‌اندازی embedding سازگار با OpenAI،
    نمونه‌های Ollama، محدودیت‌های recall و عیب‌یابی مراجعه کنید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌صورت پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر موارد">
    - `browser` - Plugin مرورگر همراه برای ابزار مرورگر، CLI ‏`openclaw browser`، متد Gateway ‏`browser.request`، runtime مرورگر، و سرویس کنترل مرورگر پیش‌فرض (به‌صورت پیش‌فرض فعال است؛ پیش از جایگزینی آن را غیرفعال کنید)
    - `copilot-proxy` - پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

دنبال Pluginهای شخص ثالث هستید؟ به [Pluginهای جامعه](/fa/plugins/community) مراجعه کنید.

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
| `enabled`          | کلید اصلی فعال‌سازی (پیش‌فرض: `true`)                           |
| `allow`            | فهرست مجاز Pluginها (اختیاری)                               |
| `bundledDiscovery` | حالت کشف Pluginهای همراه (به‌صورت پیش‌فرض `allowlist`)    |
| `deny`             | فهرست ممنوع Pluginها (اختیاری؛ deny اولویت دارد)                     |
| `load.paths`       | فایل‌ها/دایرکتوری‌های Plugin اضافی                            |
| `slots`            | انتخابگرهای جایگاه انحصاری (مثلاً `memory`، `contextEngine`) |
| `entries.\<id\>`   | کلیدهای فعال‌سازی + پیکربندی برای هر Plugin                               |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Pluginهای فهرست‌شده می‌توانند بارگذاری شوند
یا ابزارها را ارائه کنند، حتی اگر `tools.allow` شامل `"*"` یا نام ابزار مشخصی باشد که
مالک آن یک Plugin است. اگر فهرست مجاز ابزارها به ابزارهای Plugin ارجاع می‌دهد، شناسه‌های Plugin مالک
را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` درباره این
ساختار هشدار می‌دهد.

`plugins.bundledDiscovery` برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین یک
فهرست موجودی محدودکننده `plugins.allow` همچنین Pluginهای ارائه‌دهنده همراهِ حذف‌شده را مسدود می‌کند،
از جمله کشف ارائه‌دهنده جست‌وجوی وب در runtime. Doctor هنگام مهاجرت، پیکربندی‌های قدیمی‌تر
با فهرست مجاز محدودکننده را با `"compat"` نشان‌گذاری می‌کند تا ارتقاها رفتار قدیمی
ارائه‌دهنده‌های همراه را حفظ کنند تا زمانی که اپراتور حالت سخت‌گیرانه‌تر را انتخاب کند.
یک `plugins.allow` خالی همچنان تنظیم‌نشده/باز در نظر گرفته می‌شود.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند،
بازبارگذاری درون‌فرایندی Pluginهای Gateway را فعال می‌کنند. نوبت‌های جدید agent فهرست ابزارهای خود را
از registry به‌روزشده Plugin بازسازی می‌کنند. عملیات‌هایی که source را تغییر می‌دهند، مانند نصب،
به‌روزرسانی و حذف نصب، همچنان فرایند Gateway را راه‌اندازی مجدد می‌کنند، چون ماژول‌های Plugin
که از قبل import شده‌اند را نمی‌توان با اطمینان درجا جایگزین کرد.

`openclaw plugins list` یک snapshot محلی از registry/پیکربندی Plugin است. یک Plugin
`enabled` در آن‌جا یعنی registry ماندگارشده و پیکربندی فعلی اجازه مشارکت به
Plugin می‌دهند. این ثابت نمی‌کند که یک Gateway راه‌دور که از قبل در حال اجراست
با همان کد Plugin بازبارگذاری یا راه‌اندازی مجدد شده است. در راه‌اندازی‌های VPS/container
با فرایندهای wrapper، restartها یا نوشته‌هایی که reload را فعال می‌کنند به فرایند واقعی
`openclaw gateway run` بفرستید، یا وقتی reload شکست گزارش می‌کند، از `openclaw gateway restart`
علیه Gateway در حال اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال، مفقود، نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به یک شناسه Plugin ارجاع می‌دهد که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده مطابقت ندارد. راه‌اندازی Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند entry نامعتبر را با غیرفعال کردن آن و حذف payload پیکربندی‌اش قرنطینه کند.

</Accordion>

## کشف و تقدم

OpenClaw به این ترتیب Pluginها را اسکن می‌کند (اولین تطبیق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` - مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که به
    دایرکتوری‌های Plugin همراه بسته‌بندی‌شده خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛
    برای حذف این aliasهای قدیمی `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال‌اند (ارائه‌دهندگان مدل، گفتار).
    برخی دیگر به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولاً Pluginهای همراه را از درخت
کامپایل‌شده `dist/extensions` resolve می‌کنند. اگر یک دایرکتوری source مربوط به Plugin همراه
روی مسیر source بسته‌بندی‌شده متناظر bind-mounted شود، برای مثال
`/app/extensions/synology-chat`، OpenClaw آن دایرکتوری source mount‌شده را
به‌عنوان overlay source همراه در نظر می‌گیرد و آن را پیش از bundle بسته‌بندی‌شده
`/app/dist/extensions/synology-chat` کشف می‌کند. این کار loopهای container مخصوص نگه‌دارندگان را
بدون برگرداندن هر Plugin همراه به source TypeScript عملی نگه می‌دارد.
برای اجبار به استفاده از bundleهای dist بسته‌بندی‌شده حتی وقتی mountهای overlay source حضور دارند،
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همه Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow مقدم است
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهایی که منشأ workspace دارند **به‌صورت پیش‌فرض غیرفعال‌اند** (باید صریحاً فعال شوند)
- Pluginهای همراه مجموعه پیش‌فرض داخلیِ فعال را دنبال می‌کنند مگر اینکه override شوند
- جایگاه‌های انحصاری می‌توانند Plugin انتخاب‌شده برای آن جایگاه را به‌اجبار فعال کنند
- برخی Pluginهای همراه opt-in وقتی پیکربندی یک سطح متعلق به Plugin را نام‌گذاری کند،
  مانند model ref ارائه‌دهنده، پیکربندی کانال، یا runtime harness، به‌طور خودکار فعال می‌شوند
- پیکربندی قدیمی Plugin تا زمانی که `plugins.enabled: false` فعال است حفظ می‌شود؛
  اگر می‌خواهید شناسه‌های قدیمی حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای Codex خانواده OpenAI مرزهای جداگانه Plugin را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin ‏OpenAI است، در حالی که Plugin همراه app-server ‏Codex
  با `agentRuntime.id: "codex"` یا model refهای قدیمی
  `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` دیده می‌شود اما side effectها یا hookهای
`register(api)` در ترافیک چت زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال
  Gateway، profile، مسیر پیکربندی، و فرایند همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را restart کنید. در containerهای wrapper،
  PID 1 ممکن است فقط یک supervisor باشد؛ فرایند فرزند
  `openclaw gateway run` را restart یا signal کنید.
- از `openclaw plugins inspect <id> --runtime --json` برای تأیید ثبت hookها و
  diagnostics استفاده کنید. hookهای گفت‌وگوی غیرهمراه مانند `llm_input`،
  `llm_output`، `before_agent_finalize` و `agent_end` به
  `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تغییر مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از resolution مدل
  برای نوبت‌های agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل
  خروجی assistant تولید کند.
- برای اثبات مدل مؤثر session، از `openclaw sessions` یا سطح‌های session/status در
  Gateway استفاده کنید و هنگام debug کردن payloadهای ارائه‌دهنده، Gateway را با
  `--raw-stream --raw-stream-path <path>` راه‌اندازی کنید.

### راه‌اندازی کند ابزار Plugin

اگر به نظر می‌رسد نوبت‌های agent هنگام آماده‌سازی ابزارها متوقف می‌شوند، trace logging را فعال کنید و
خطوط timing مربوط به factory ابزار Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند،
از جمله شناسه Plugin، نام‌های ابزار اعلام‌شده، شکل نتیجه، و اینکه ابزار
اختیاری است یا نه. وقتی یک factory منفرد دست‌کم 1s طول بکشد یا آماده‌سازی کل
factory ابزار Plugin دست‌کم 5s طول بکشد، خطوط کند به هشدار ارتقا می‌یابند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolutionهای تکراری با همان
context مؤثر request cache می‌کند. کلید cache شامل پیکربندی runtime مؤثر،
workspace، شناسه‌های agent/session، سیاست sandbox، تنظیمات مرورگر،
context تحویل، هویت requester و وضعیت ownership است، بنابراین factoryهایی که
به این فیلدهای مورد اعتماد وابسته‌اند هنگام تغییر context دوباره اجرا می‌شوند.

اگر یک Plugin بر timing غالب است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید
بارگذاری dependencyهای پرهزینه را به مسیر اجرای ابزار منتقل کنند، نه اینکه آن را
داخل factory ابزار انجام دهند.

### مالکیت تکراری کانال یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان کانال،
flow راه‌اندازی، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin کانال خارجی
در کنار Plugin همراهی است که اکنون همان شناسه کانال را ارائه می‌کند.

گام‌های debug:

- `openclaw plugins list --enabled --verbose` را اجرا کنید تا هر Plugin فعال
  و منشأ آن را ببینید.
- برای هر Plugin مشکوک `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و
  `channels`، `channelConfigs`، `tools` و diagnostics را مقایسه کنید.
- پس از نصب یا حذف packageهای Plugin، `openclaw plugins registry --refresh` را اجرا کنید
  تا metadata ماندگارشده وضعیت نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، registry یا پیکربندی، Gateway را restart کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً جایگزین Plugin دیگری برای همان شناسه کانال می‌شود، Plugin
  ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسه Plugin
  با اولویت پایین‌تر اعلام کند. به [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) مراجعه کنید.
- اگر تکرار تصادفی است، یک سمت را با
  `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin
  قدیمی را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن request را نگه می‌دارد و
  conflict را گزارش می‌کند. یک مالک برای کانال انتخاب کنید یا ابزارهای متعلق به Plugin را
  تغییر نام دهید تا سطح runtime بدون ابهام باشد.

## جایگاه‌های Plugin (دسته‌های انحصاری)

برخی دسته‌ها انحصاری‌اند (در هر لحظه فقط یکی فعال است):

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

| جایگاه            | چیزی که کنترل می‌کند      | پیش‌فرض             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin حافظه فعال  | `memory-core`       |
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

Pluginهای همراه با OpenClaw ارائه می‌شوند. بسیاری از آن‌ها به‌طور پیش‌فرض فعال هستند، برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه. سایر Pluginهای همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا بسته hook موجود را در همان محل بازنویسی می‌کند. برای ارتقاهای معمول Pluginهای npm رهگیری‌شده از `openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون `--link` به‌جای کپی‌کردن روی یک هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال‌کردن آن به آن فهرست مجاز اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، نصب آن ورودی deny کهنه را حذف می‌کند تا نصب صریح بلافاصله پس از راه‌اندازی دوباره قابل بارگذاری باشد.

OpenClaw یک رجیستری محلی پایدار از Pluginها را به‌عنوان مدل خواندن سرد برای موجودی Plugin، مالکیت مشارکت‌ها، و برنامه‌ریزی راه‌اندازی نگه می‌دارد. جریان‌های نصب، به‌روزرسانی، حذف نصب، فعال‌سازی، و غیرفعال‌سازی پس از تغییر وضعیت Plugin آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فراداده نصب پایدار را در `installRecords` سطح بالا و فراداده manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر رجیستری وجود نداشته باشد، کهنه باشد، یا نامعتبر باشد، `openclaw plugins registry --refresh` نمای manifest آن را از رکوردهای نصب، سیاست پیکربندی، و فراداده manifest/package بدون بارگذاری ماژول‌های runtime Plugin بازسازی می‌کند.
`openclaw plugins update <id-or-npm-spec>` روی نصب‌های رهگیری‌شده اعمال می‌شود. ارسال یک مشخصه package در npm همراه با dist-tag یا نسخه دقیق، نام package را به رکورد Plugin رهگیری‌شده برمی‌گرداند و مشخصه جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند. ارسال نام package بدون نسخه، یک نصب دقیق pin‌شده را به خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin نصب‌شده npm از قبل با نسخه resolve‌شده و هویت artifact ثبت‌شده مطابقت داشته باشد، OpenClaw به‌روزرسانی را بدون دانلود، نصب دوباره، یا بازنویسی پیکربندی رد می‌کند.
وقتی `openclaw update` روی کانال بتا اجرا می‌شود، رکوردهای Plugin مربوط به npm و ClawHub در خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند و وقتی هیچ انتشار بتای Plugin وجود نداشته باشد به default/latest برمی‌گردند. نسخه‌های دقیق و tagهای صریح pin‌شده باقی می‌مانند.

`--pin` فقط مخصوص npm است. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای یک مشخصه npm، فراداده منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای مثبت‌های کاذب از اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌ها و به‌روزرسانی‌های Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان بلوک‌های سیاستی `before_install` خود Plugin یا بلوک ناشی از شکست اسکن را دور نمی‌زند. اسکن‌های نصب، برای جلوگیری از مسدودشدن mockهای تست بسته‌بندی‌شده، فایل‌ها و دایرکتوری‌های رایج تست مانند `tests/`، `__tests__/`، `*.test.*`، و `*.spec.*` را نادیده می‌گیرند؛ entrypointهای runtime اعلام‌شده Plugin همچنان اسکن می‌شوند، حتی اگر از یکی از آن نام‌ها استفاده کنند.

این پرچم CLI فقط روی جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب وابستگی Skillsهای پشتیبانی‌شده با Gateway به‌جای آن از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کند، در حالی که `openclaw skills install` همچنان جریان جداگانه دانلود/نصب skill از ClawHub است.

اگر Pluginی که در ClawHub منتشر کرده‌اید توسط اسکن پنهان یا مسدود شده است، داشبورد ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در دستگاه خودتان اثر می‌گذارد؛ از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را عمومی کند.

باندل‌های سازگار در همان جریان فهرست‌کردن/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin شرکت می‌کنند. پشتیبانی runtime فعلی شامل Skillsهای باندل، command-skillهای Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude و `lspServers` اعلام‌شده در manifest، command-skillهای Cursor، و دایرکتوری‌های hook سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های شناسایی‌شده باندل به‌همراه ورودی‌های پشتیبانی‌شده یا پشتیبانی‌نشده سرورهای MCP و LSP را برای Pluginهای پشتیبانی‌شده با باندل گزارش می‌کند.

منابع marketplace می‌توانند یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`، یک ریشه marketplace محلی یا مسیر `marketplace.json`، یک کوتاه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git باشند. برای marketplaceهای راه‌دور، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## مرور کلی API Plugin

Pluginهای بومی یک شیء entry صادر می‌کنند که `register(api)` را در اختیار می‌گذارد. Pluginهای قدیمی‌تر ممکن است همچنان از `activate(api)` به‌عنوان alias قدیمی استفاده کنند، اما Pluginهای جدید باید از `register` استفاده کنند.

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

OpenClaw در زمان فعال‌سازی Plugin شیء entry را بارگذاری می‌کند و `register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` برمی‌گردد، اما Pluginهای همراه و Pluginهای خارجی جدید باید `register` را قرارداد عمومی بدانند.

`api.registrationMode` به یک Plugin می‌گوید entry آن چرا در حال بارگذاری است:

| حالت           | معنا                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `full`         | فعال‌سازی runtime. ابزارها، hookها، سرویس‌ها، فرمان‌ها، routeها، و سایر اثرات جانبی زنده را ثبت کنید.                      |
| `discovery`    | کشف قابلیت فقط‌خواندنی. ارائه‌دهندگان و فراداده را ثبت کنید؛ کد entry Plugin مورد اعتماد ممکن است بارگذاری شود، اما اثرات جانبی زنده را رد کنید. |
| `setup-only`   | بارگذاری فراداده راه‌اندازی کانال از طریق یک entry راه‌اندازی سبک.                                                        |
| `setup-runtime` | بارگذاری راه‌اندازی کانال که به entry runtime نیز نیاز دارد.                                                             |
| `cli-metadata` | فقط گردآوری فراداده فرمان CLI.                                                                                             |

entryهای Plugin که socket، پایگاه‌داده، worker پس‌زمینه، یا clientهای بلندمدت باز می‌کنند باید این اثرات جانبی را با `api.registrationMode === "full"` محافظت کنند. بارگذاری‌های discovery جدا از بارگذاری‌های activating کش می‌شوند و جایگزین رجیستری Gateway در حال اجرا نمی‌شوند. discovery فعال‌کننده نیست، اما بدون import هم نیست: OpenClaw ممکن است entry مورد اعتماد Plugin یا ماژول Plugin کانال را ارزیابی کند تا snapshot را بسازد. سطح بالای ماژول‌ها را سبک و بدون اثر جانبی نگه دارید، و clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و راه‌اندازی سرویس را پشت مسیرهای full-runtime منتقل کنید.

روش‌های ثبت رایج:

| روش                                    | آنچه ثبت می‌کند              |
| -------------------------------------- | ---------------------------- |
| `registerProvider`                     | ارائه‌دهنده مدل (LLM)        |
| `registerChannel`                      | کانال چت                     |
| `registerTool`                         | ابزار عامل                   |
| `registerHook` / `on(...)`             | hookهای چرخه عمر             |
| `registerSpeechProvider`               | متن‌به‌گفتار / STT           |
| `registerRealtimeTranscriptionProvider` | STT جریانی                  |
| `registerRealtimeVoiceProvider`        | صدای realtime دوطرفه         |
| `registerMediaUnderstandingProvider`   | تحلیل تصویر/صدا              |
| `registerImageGenerationProvider`      | تولید تصویر                  |
| `registerMusicGenerationProvider`      | تولید موسیقی                 |
| `registerVideoGenerationProvider`      | تولید ویدئو                  |
| `registerWebFetchProvider`             | ارائه‌دهنده fetch / scrape وب |
| `registerWebSearchProvider`            | جست‌وجوی وب                  |
| `registerHttpRoute`                    | endpoint HTTP                |
| `registerCommand` / `registerCli`      | فرمان‌های CLI                |
| `registerContextEngine`                | موتور context                |
| `registerService`                      | سرویس پس‌زمینه               |

رفتار guard در hookهای چرخه عمر typed:

- `before_tool_call`: `{ block: true }` پایان‌دهنده است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` بدون اثر است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایان‌دهنده است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` بدون اثر است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` پایان‌دهنده است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` بدون اثر است و cancel قبلی را پاک نمی‌کند.

app-server بومی Codex، رویدادهای ابزار بومی Codex را به این سطح hook بازمی‌گرداند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند، و در تأییدهای `PermissionRequest` مربوط به Codex شرکت کنند. این bridge هنوز آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی runtime در Codex در [قرارداد پشتیبانی Codex harness v1](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hookهای typed، [مرور کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) - Plugin خودتان را ایجاد کنید
- [باندل‌های Plugin](/fa/plugins/bundles) - سازگاری باندل Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) - طرحوارهٔ مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) - ابزارهای عامل را در یک Plugin اضافه کنید
- [جزئیات داخلی Plugin](/fa/plugins/architecture) - مدل قابلیت و پایپ‌لاین بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) - فهرست‌های شخص ثالث
