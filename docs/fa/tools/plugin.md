---
read_when:
    - نصب یا پیکربندی Plugin‌ها
    - درک قوانین کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Pluginهای OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-07T13:33:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugins قابلیت‌های تازه‌ای به OpenClaw اضافه می‌کنند: کانال‌ها، ارائه‌دهندگان مدل،
چارچوب‌های عامل، ابزارها، Skills، گفتار، رونویسی بلادرنگ، صدای بلادرنگ،
درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، جست‌وجوی وب، و موارد بیشتر.
برخی Pluginها **هسته‌ای** هستند (همراه OpenClaw عرضه می‌شوند) و برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. Npm همچنان برای نصب مستقیم و برای
مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا پایان این مهاجرت پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های آماده کپی‌کردن نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی، و انتشار، ببینید
[مدیریت Pluginها](/fa/plugins/manage-plugins).

<Steps>
  <Step title="مشاهده موارد بارگذاری‌شده">
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
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` که فقط برای مالک هستند،
    بارگذارِ دوباره پیکربندی Gateway را فعال می‌کنند. Gateway سطوح runtime مربوط به Plugin
    را در همان فرایند دوباره بارگذاری می‌کند، و نوبت‌های تازه عامل فهرست ابزارهای خود را از
    رجیستری تازه‌سازی‌شده دوباره می‌سازند. `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین
    Gateway به‌جای وانمودکردن به اینکه فرایند فعلی می‌تواند ماژول‌های ازقبل import‌شده را
    با اطمینان دوباره بارگذاری کند، درخواست راه‌اندازی دوباره می‌دهد.

  </Step>

  <Step title="اعتبارسنجی Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی باید ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway، هوک‌ها، یا فرمان‌های CLI متعلق به Plugin
    را اثبات کنید، از `--runtime` استفاده کنید. `inspect` ساده یک بررسی سردِ
    manifest/registry است و عمدا از import کردن runtime مربوط به Plugin پرهیز می‌کند.

  </Step>
</Steps>

اگر کنترل بومیِ چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver استفاده می‌کند که CLI استفاده می‌کند: مسیر/آرشیو محلی، مقدار صریح
`clawhub:<pkg>`، مقدار صریح `npm:<pkg>`، مقدار صریح `npm-pack:<path.tgz>`،
مقدار صریح `git:<repo>`، یا مشخصات بسته بدون پیشوند از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولا به‌صورت بسته شکست می‌خورد و شما را به
`openclaw doctor --fix` راهنمایی می‌کند. تنها استثنای بازیابی، مسیر باریکِ نصب دوباره bundled-plugin
برای Pluginهایی است که `openclaw.install.allowInvalidConfigRecovery` را انتخاب می‌کنند.
هنگام راه‌اندازی Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری
به‌صورت بسته شکست می‌خورد. `openclaw doctor --fix` را اجرا کنید تا با غیرفعال‌کردن آن ورودی Plugin
و حذف payload نامعتبر پیکربندی آن، پیکربندی بد Plugin قرنطینه شود؛ پشتیبان‌گیری معمول
پیکربندی، مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی یک کانال به Pluginی ارجاع می‌دهد که دیگر قابل کشف نیست اما همان
شناسه قدیمی Plugin در پیکربندی Plugin یا سوابق نصب باقی مانده است، راه‌اندازی Gateway
هشدارهایی ثبت می‌کند و به‌جای مسدودکردن همه کانال‌های دیگر، آن کانال را رد می‌کند.
برای حذف ورودی‌های قدیمی کانال/Plugin، `openclaw doctor --fix` را اجرا کنید؛ کلیدهای
ناشناخته کانال بدون شواهد stale-plugin همچنان در اعتبارسنجی شکست می‌خورند تا غلط‌های تایپی
نمایان بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های قدیمی Plugin بی‌اثر در نظر گرفته می‌شوند:
راه‌اندازی Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor`
به‌جای حذف خودکار پیکربندی Plugin غیرفعال، آن را حفظ می‌کند. اگر می‌خواهید شناسه‌های قدیمی
Plugin حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط هنگام جریان‌های نصب/به‌روزرسانی صریح یا تعمیر doctor انجام می‌شود.
راه‌اندازی Gateway، بارگذاری دوباره پیکربندی، و بازرسی runtime، package managerها را اجرا نمی‌کنند
و درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای محلی باید از قبل وابستگی‌های خود را نصب کرده باشند،
درحالی‌که Pluginهای npm، git، و ClawHub زیر ریشه‌های Plugin مدیریت‌شده OpenClaw نصب می‌شوند.
وابستگی‌های npm ممکن است در ریشه npm مدیریت‌شده OpenClaw hoist شوند؛ نصب/به‌روزرسانی پیش از اعتماد،
آن ریشه مدیریت‌شده را اسکن می‌کند و حذف نصب، بسته‌های npm-managed را از طریق npm حذف می‌کند.
Pluginهای خارجی و مسیرهای بارگذاری سفارشی همچنان باید از طریق `openclaw plugins install` نصب شوند.
برای دیدن `dependencyStatus` ایستای هر Plugin قابل مشاهده بدون import کردن کد runtime یا تعمیر وابستگی‌ها،
از `openclaw plugins list --json` استفاده کنید.
برای چرخه عمر زمان نصب، ببینید [حل وابستگی Plugin](/fa/plugins/dependency-resolution).

### مالکیت مسیر Plugin مسدودشده

اگر diagnostics مربوط به Plugin بگوید
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
و پس از آن اعتبارسنجی پیکربندی با `plugin present but blocked` بیاید، OpenClaw
فایل‌های Pluginی پیدا کرده که مالک آن‌ها یک کاربر Unix متفاوت از فرایندی است که آن‌ها را بارگذاری می‌کند.
پیکربندی Plugin را نگه دارید؛ مالکیت filesystem را اصلاح کنید یا OpenClaw را با همان کاربری اجرا کنید
که مالک دایرکتوری state است.

برای نصب‌های Docker، image رسمی با کاربر `node` (uid `1000`) اجرا می‌شود، بنابراین
دایرکتوری‌های پیکربندی و workspace مربوط به OpenClaw که از host bind-mounted شده‌اند، معمولا باید
مالکیت uid `1000` داشته باشند:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

اگر عمدا OpenClaw را به‌صورت root اجرا می‌کنید، به‌جای آن ریشه Plugin مدیریت‌شده را به
مالکیت root تعمیر کنید:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

پس از اصلاح مالکیت، `openclaw doctor --fix` یا
`openclaw plugins registry --refresh` را دوباره اجرا کنید تا رجیستری پایدارشده Plugin با
فایل‌های تعمیرشده مطابقت داشته باشد.

برای نصب‌های npm، selectorهای mutable مانند `latest` یا dist-tag پیش از نصب resolve می‌شوند
و سپس به نسخه دقیقِ تأییدشده در ریشه npm مدیریت‌شده OpenClaw pin می‌شوند. پس از پایان npm،
OpenClaw بررسی می‌کند که ورودی نصب‌شده `package-lock.json` همچنان با نسخه و integrity
resolve‌شده مطابقت داشته باشد. اگر npm متادیتای بسته متفاوتی بنویسد، نصب شکست می‌خورد و
بسته مدیریت‌شده به عقب برگردانده می‌شود، به‌جای اینکه artifact متفاوتی از Plugin پذیرفته شود.
ریشه‌های npm مدیریت‌شده همچنین `overrides` سطح بسته npm مربوط به OpenClaw را به ارث می‌برند، بنابراین
pinهای امنیتی که از host بسته‌بندی‌شده محافظت می‌کنند، به وابستگی‌های خارجی hoist‌شده Plugin نیز اعمال می‌شوند.

checkoutهای منبع، workspaceهای pnpm هستند. اگر OpenClaw را clone می‌کنید تا روی Pluginهای bundled
کار کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw، Pluginهای bundled را از
`extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و وابستگی‌های package-local مستقیما استفاده شوند.
نصب‌های ساده ریشه npm برای OpenClaw بسته‌بندی‌شده هستند، نه توسعه با checkout منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را تشخیص می‌دهد:

| قالب     | نحوه کار                                                       | نمونه‌ها                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **بومی** | `openclaw.plugin.json` + ماژول runtime؛ درون همان فرایند اجرا می‌شود       | Pluginهای رسمی، بسته‌های npm جامعه               |
| **Bundle** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle ببینید [Bundleهای Plugin](/fa/plugins/bundles).

اگر در حال نوشتن یک Plugin بومی هستید، با [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## Entry pointهای بسته

بسته‌های npm مربوط به Plugin بومی باید `openclaw.extensions` را در `package.json` اعلام کنند.
هر ورودی باید داخل دایرکتوری بسته باقی بماند و به یک فایل runtime خواندنی resolve شود،
یا به یک فایل منبع TypeScript با همتای JavaScript ساخته‌شده استنباط‌شده مانند
`src/index.ts` به `dist/index.js`.
نصب‌های بسته‌بندی‌شده باید آن خروجی runtime مربوط به JavaScript را همراه داشته باشند. fallback منبع
TypeScript برای checkoutهای منبع و مسیرهای توسعه محلی است، نه برای
بسته‌های npm نصب‌شده در ریشه Plugin مدیریت‌شده OpenClaw.

اگر هشدار بسته مدیریت‌شده می‌گوید که برای `TypeScript entry ...` به `requires compiled runtime output for`
نیاز دارد، بسته بدون فایل‌های JavaScriptی منتشر شده که OpenClaw در runtime نیاز دارد.
این یک مشکل بسته‌بندی Plugin است، نه مشکل پیکربندی محلی. پس از اینکه منتشرکننده JavaScript
کامپایل‌شده را دوباره منتشر کرد، Plugin را به‌روزرسانی یا دوباره نصب کنید، یا تا زمانی که بسته اصلاح‌شده
در دسترس شود، آن Plugin را غیرفعال/حذف نصب کنید.

وقتی فایل‌های runtime منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند، از `openclaw.runtimeExtensions`
استفاده کنید. وقتی وجود داشته باشد، `runtimeExtensions` باید دقیقا برای هر ورودی `extensions`
یک ورودی داشته باشد. فهرست‌های نامنطبق به‌جای fallback بی‌صدا به مسیرهای منبع، باعث شکست نصب و
کشف Plugin می‌شوند. اگر `openclaw.setupEntry` را هم منتشر می‌کنید، برای همتای JavaScript ساخته‌شده آن
از `openclaw.runtimeSetupEntry` استفاده کنید؛ وقتی اعلام شود، آن فایل الزامی است.

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

### بسته‌های npm متعلق به OpenClaw هنگام مهاجرت

ClawHub مسیر توزیع اصلی برای بیشتر Pluginها است. نسخه‌های فعلی بسته‌بندی‌شده OpenClaw
از قبل بسیاری از Pluginهای رسمی را bundle می‌کنند، بنابراین آن‌ها در setupهای معمول به نصب جداگانه npm
نیاز ندارند. تا زمانی که همه Pluginهای متعلق به OpenClaw به ClawHub مهاجرت کنند،
OpenClaw همچنان برخی بسته‌های Plugin با نام `@openclaw/*` را برای نصب‌های قدیمی/سفارشی و
workflowهای مستقیم npm روی npm عرضه می‌کند.

اگر npm یک بسته Plugin با نام `@openclaw/*` را deprecated گزارش کند، آن نسخه بسته
از train قدیمی‌تر بسته خارجی است. تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin bundled
در OpenClaw فعلی یا checkout محلی استفاده کنید.

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

### هسته (همراه OpenClaw عرضه می‌شود)

<AccordionGroup>
  <Accordion title="ارائه‌دهندگان مدل (به‌صورت پیش‌فرض فعال)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin‌های حافظه">
    - `memory-core` - جستجوی حافظهٔ همراه‌شده (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` - حافظهٔ بلندمدت مبتنی بر LanceDB با یادآوری/ثبت خودکار (تنظیم کنید `plugins.slots.memory = "memory-lancedb"`)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های یادآوری و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌صورت پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر موارد">
    - `browser` - Plugin مرورگر همراه‌شده برای ابزار مرورگر، CLI مربوط به `openclaw browser`، متد Gateway با نام `browser.request`، runtime مرورگر، و سرویس کنترل مرورگر پیش‌فرض (به‌صورت پیش‌فرض فعال است؛ پیش از جایگزین‌کردن آن را غیرفعال کنید)
    - `copilot-proxy` - پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

دنبال Plugin‌های شخص ثالث هستید؟ [Plugin‌های جامعه](/fa/plugins/community) را ببینید.

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
| `allow`            | فهرست مجاز Plugin‌ها (اختیاری)                               |
| `bundledDiscovery` | حالت کشف Plugin‌های همراه‌شده (به‌صورت پیش‌فرض `allowlist`)    |
| `deny`             | فهرست ممنوع Plugin‌ها (اختیاری؛ ممنوعیت اولویت دارد)                     |
| `load.paths`       | فایل‌ها/دایرکتوری‌های اضافی Plugin                            |
| `slots`            | انتخاب‌گرهای slot انحصاری (مثلاً `memory`، `contextEngine`) |
| `entries.\<id\>`   | فعال/غیرفعال‌سازی‌ها + پیکربندی برای هر Plugin                               |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Plugin‌های فهرست‌شده می‌توانند بارگذاری شوند یا ابزارها را در معرض استفاده بگذارند، حتی اگر `tools.allow` شامل `"*"` یا نام یک ابزار مشخص متعلق به Plugin باشد. اگر فهرست مجاز ابزار به ابزارهای Plugin ارجاع می‌دهد، شناسه‌های Plugin مالک را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` دربارهٔ این شکل هشدار می‌دهد.

`plugins.bundledDiscovery` برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین یک موجودی محدودکنندهٔ `plugins.allow` همچنین Plugin‌های ارائه‌دهندهٔ همراه‌شدهٔ حذف‌شده را، از جمله کشف ارائه‌دهندهٔ جستجوی وب در runtime، مسدود می‌کند. Doctor هنگام مهاجرت، پیکربندی‌های قدیمی‌ترِ فهرست مجاز محدودکننده را با `"compat"` مهر می‌کند تا ارتقاها رفتار قدیمی ارائه‌دهندهٔ همراه‌شده را حفظ کنند تا زمانی که اپراتور حالت سخت‌گیرانه‌تر را انتخاب کند. `plugins.allow` خالی همچنان مثل تنظیم‌نشده/باز در نظر گرفته می‌شود.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، بازبارگذاری درون‌پردازه‌ای Pluginهای Gateway را فعال می‌کنند. نوبت‌های جدید agent فهرست ابزارهای خود را از رجیستری به‌روزشدهٔ Plugin دوباره می‌سازند. عملیات‌هایی که منبع را تغییر می‌دهند، مانند نصب، به‌روزرسانی و حذف نصب، همچنان فرایند Gateway را دوباره راه‌اندازی می‌کنند، چون ماژول‌های Plugin که قبلاً import شده‌اند را نمی‌توان به‌صورت امن درجا جایگزین کرد.

`openclaw plugins list` یک snapshot محلی از رجیستری/پیکربندی Plugin است. یک Plugin با وضعیت `enabled` در آنجا یعنی رجیستری ماندگار و پیکربندی فعلی اجازه می‌دهند Plugin مشارکت کند. این ثابت نمی‌کند که یک Gateway راه‌دورِ درحال‌اجرا بازبارگذاری یا دوباره راه‌اندازی شده و به همان کد Plugin رسیده است. در راه‌اندازی‌های VPS/container با پردازش‌های wrapper، راه‌اندازی مجدد یا نوشتن‌هایی را که بازبارگذاری را فعال می‌کنند به فرایند واقعی `openclaw gateway run` بفرستید، یا وقتی بازبارگذاری شکست گزارش می‌دهد، از `openclaw gateway restart` روی Gateway درحال‌اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال، گمشده، نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **گمشده**: پیکربندی به شناسهٔ Plugin اشاره می‌کند که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده مطابقت ندارد. شروع Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر را با غیرفعال‌کردن آن و حذف payload پیکربندی‌اش قرنطینه کند.

</Accordion>

## کشف و اولویت

OpenClaw در این ترتیب به‌دنبال Plugin‌ها می‌گردد (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` - مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که به دایرکتوری‌های Plugin همراه‌شدهٔ بسته‌بندی‌شدهٔ خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛ برای حذف آن aliasهای کهنه، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Plugin‌های workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin‌های سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin‌های همراه‌شده">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال‌اند (ارائه‌دهندگان مدل، گفتار).
    سایر موارد نیاز به فعال‌سازی صریح دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و تصویرهای Docker معمولاً Plugin‌های همراه‌شده را از درخت کامپایل‌شدهٔ `dist/extensions` resolve می‌کنند. اگر یک دایرکتوری منبع Plugin همراه‌شده روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount شود، برای مثال `/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mount‌شده را به‌عنوان overlay منبع همراه‌شده در نظر می‌گیرد و آن را پیش از bundle بسته‌بندی‌شدهٔ `/app/dist/extensions/synology-chat` کشف می‌کند. این کار loopهای container نگه‌دارنده را بدون برگرداندن هر Plugin همراه‌شده به منبع TypeScript فعال نگه می‌دارد. برای اجبار به استفاده از bundleهای dist بسته‌بندی‌شده حتی وقتی mountهای overlay منبع وجود دارند، `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همهٔ Plugin‌ها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow پیروز می‌شود
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Plugin‌هایی با منشأ workspace **به‌صورت پیش‌فرض غیرفعال‌اند** (باید صریحاً فعال شوند)
- Plugin‌های همراه‌شده از مجموعهٔ داخلیِ پیش‌فرض-فعال پیروی می‌کنند مگر اینکه override شوند
- slotهای انحصاری می‌توانند Plugin انتخاب‌شده برای آن slot را اجباری فعال کنند
- برخی Plugin‌های opt-in همراه‌شده وقتی پیکربندی یک سطح متعلق به Plugin را نام می‌برد، مانند ref مدل ارائه‌دهنده، پیکربندی channel، یا runtime harness، به‌صورت خودکار فعال می‌شوند
- پیکربندی کهنهٔ Plugin تا وقتی `plugins.enabled: false` فعال است حفظ می‌شود؛ اگر می‌خواهید شناسه‌های کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor، Plugin‌ها را دوباره فعال کنید
- مسیرهای Codex از خانوادهٔ OpenAI مرزهای جداگانهٔ Plugin را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin OpenAI است، درحالی‌که Plugin app-server همراه‌شدهٔ Codex با `agentRuntime.id: "codex"` یا refهای مدل قدیمی `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` دیده می‌شود اما اثرات جانبی یا hookهای `register(api)` در ترافیک گفت‌وگوی زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال Gateway، profile، مسیر پیکربندی و فرایند همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را دوباره راه‌اندازی کنید. در containerهای wrapper، PID 1 ممکن است فقط یک supervisor باشد؛ فرایند فرزند `openclaw gateway run` را دوباره راه‌اندازی کنید یا به آن signal بفرستید.
- برای تأیید ثبت hookها و diagnostics از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. hookهای مکالمهٔ غیرهمراه‌شده مانند `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `llm_input`، `llm_output`، `before_agent_finalize` و `agent_end` به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تغییر مدل، `before_model_resolve` را ترجیح دهید. این قبل از resolve مدل برای نوبت‌های agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل خروجی assistant تولید کند.
- برای اثبات مدل مؤثر session، از `openclaw sessions` یا سطوح session/status در Gateway استفاده کنید و هنگام دیباگ payloadهای ارائه‌دهنده، Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### راه‌اندازی کند ابزار Plugin

اگر به‌نظر می‌رسد نوبت‌های agent هنگام آماده‌سازی ابزارها متوقف می‌شوند، لاگ trace را فعال کنید و خطوط زمان‌بندی factory ابزار Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند، از جمله شناسهٔ Plugin، نام‌های ابزار اعلام‌شده، شکل نتیجه، و اینکه ابزار اختیاری است یا نه. وقتی یک factory حداقل 1s طول بکشد یا آماده‌سازی کل factory ابزار Plugin حداقل 5s طول بکشد، خطوط کند به هشدار ارتقا داده می‌شوند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolveهای تکراری با همان context مؤثر درخواست cache می‌کند. کلید cache شامل پیکربندی مؤثر runtime، workspace، شناسه‌های agent/session، سیاست sandbox، تنظیمات مرورگر، context تحویل، هویت درخواست‌کننده و وضعیت مالکیت است، بنابراین factoryهایی که به آن فیلدهای مورد اعتماد وابسته‌اند، هنگام تغییر context دوباره اجرا می‌شوند.

اگر یک Plugin بر زمان‌بندی غالب است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب یا غیرفعال کنید. نویسندگان Plugin باید بارگذاری پرهزینهٔ وابستگی را به مسیر اجرای ابزار منتقل کنند، به‌جای اینکه آن را داخل factory ابزار انجام دهند.

### مالکیت تکراری channel یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان channel، جریان راه‌اندازی، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin channel خارجی در کنار Plugin همراه‌شده‌ای است که اکنون همان شناسهٔ channel را فراهم می‌کند.

گام‌های دیباگ:

- `openclaw plugins list --enabled --verbose` را اجرا کنید تا همهٔ Plugin‌های فعال و منشأ آن‌ها را ببینید.
- برای هر Plugin مشکوک `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و `channels`، `channelConfigs`، `tools` و diagnostics را مقایسه کنید.
- پس از نصب یا حذف بسته‌های Plugin، `openclaw plugins registry --refresh` را اجرا کنید تا metadata ماندگار نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، رجیستری یا پیکربندی، Gateway را دوباره راه‌اندازی کنید.

گزینه‌های رفع مشکل:

- اگر یک Plugin عمداً جایگزین دیگری برای همان شناسهٔ channel می‌شود، Plugin ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسهٔ Plugin با اولویت پایین‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin کهنه را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را حفظ می‌کند و تعارض را گزارش می‌دهد. یک مالک برای channel انتخاب کنید یا ابزارهای متعلق به Plugin را تغییر نام دهید تا سطح runtime بدون ابهام باشد.

## slotهای Plugin (دسته‌های انحصاری)

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

| slot            | چیزی که کنترل می‌کند      | پیش‌فرض             |
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

`--force` یک Plugin نصب‌شده یا بسته hook موجود را در همان محل بازنویسی می‌کند. برای ارتقاهای معمول Pluginهای npm ردیابی‌شده از `openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون مسیر منبع را به‌جای کپی کردن روی هدف نصب مدیریت‌شده، دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال‌سازی به آن allowlist اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، نصب آن ورودی deny کهنه را حذف می‌کند تا نصب صریح بلافاصله پس از راه‌اندازی دوباره قابل بارگذاری باشد.

OpenClaw یک رجیستری محلی پایدارشده Plugin را به‌عنوان مدل خواندن سرد برای فهرست Pluginها، مالکیت contributionها، و برنامه‌ریزی راه‌اندازی نگه می‌دارد. جریان‌های نصب، به‌روزرسانی، حذف، فعال‌سازی، و غیرفعال‌سازی پس از تغییر وضعیت Plugin، آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فراداده نصب پایدار را در `installRecords` سطح بالا و فراداده manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر رجیستری گم‌شده، کهنه، یا نامعتبر باشد، `openclaw plugins registry --refresh` نمای manifest آن را از رکوردهای نصب، سیاست config، و فراداده manifest/package بدون بارگذاری ماژول‌های runtime Plugin بازسازی می‌کند.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه حیات Plugin غیرفعال هستند. در عوض، انتخاب package Plugin و config را از طریق منبع Nix برای نصب مدیریت کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first شروع کنید. `openclaw plugins update <id-or-npm-spec>` روی نصب‌های ردیابی‌شده اعمال می‌شود. دادن spec یک package npm با dist-tag یا نسخه دقیق، نام package را به رکورد Plugin ردیابی‌شده برمی‌گرداند و spec جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند. دادن نام package بدون نسخه، یک نصب دقیق pinشده را به خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin npm نصب‌شده از قبل با نسخه resolveشده و هویت artifact ثبت‌شده مطابقت داشته باشد، OpenClaw به‌روزرسانی را بدون دانلود، نصب دوباره، یا بازنویسی config رد می‌کند.
وقتی `openclaw update` روی کانال beta اجرا شود، رکوردهای Plugin خط پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند و وقتی انتشار beta برای Plugin وجود نداشته باشد، به default/latest برمی‌گردند. نسخه‌های دقیق و tagهای صریح pinشده باقی می‌مانند.

`--pin` فقط برای npm است. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec npm، فراداده منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای false positiveهای اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب Plugin و به‌روزرسانی Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان بلوک‌های سیاستی `before_install` مربوط به Plugin یا مسدودسازی شکست اسکن را دور نمی‌زند. اسکن‌های نصب، فایل‌ها و پوشه‌های رایج تست مانند `tests/`، `__tests__/`، `*.test.*`، و `*.spec.*` را نادیده می‌گیرند تا mockهای تست بسته‌بندی‌شده باعث مسدود شدن نشوند؛ entrypointهای runtime اعلام‌شده Plugin همچنان اسکن می‌شوند، حتی اگر از یکی از آن نام‌ها استفاده کنند.

این پرچم CLI فقط روی جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills مبتنی بر Gateway در عوض از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان جریان جداگانه دانلود/نصب Skills از ClawHub است.

اگر Pluginی که روی ClawHub منتشر کرده‌اید پنهان شده یا توسط اسکن مسدود شده است، داشبورد ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط نصب‌ها روی ماشین خودتان را تحت تأثیر قرار می‌دهد؛ از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را عمومی کند.

بسته‌های سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin شرکت می‌کنند. پشتیبانی runtime فعلی شامل Skills بسته، command-skillهای Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `lspServers` اعلام‌شده در manifest و `.lsp.json` مربوط به Claude، command-skillهای Cursor، و پوشه‌های hook سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های شناسایی‌شده bundle به‌همراه ورودی‌های server پشتیبانی‌شده یا پشتیبانی‌نشده MCP و LSP را برای Pluginهای مبتنی بر bundle گزارش می‌کند.

منابع Marketplace می‌توانند یک نام known-marketplace مربوط به Claude از `~/.claude/plugins/known_marketplaces.json`، یک ریشه marketplace محلی یا مسیر `marketplace.json`، یک shorthand GitHub مانند `owner/repo`، یک URL repo در GitHub، یا یک URL git باشند. برای marketplaceهای remote، ورودی‌های Plugin باید داخل repo کلون‌شده marketplace بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API Plugin

Pluginهای بومی یک شیء entry صادر می‌کنند که `register(api)` را ارائه می‌دهد. Pluginهای قدیمی‌تر ممکن است همچنان از `activate(api)` به‌عنوان alias legacy استفاده کنند، اما Pluginهای جدید باید از `register` استفاده کنند.

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

OpenClaw شیء entry را بارگذاری می‌کند و هنگام فعال‌سازی Plugin، `register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` fallback می‌کند، اما Pluginهای همراه و Pluginهای خارجی جدید باید `register` را قرارداد عمومی بدانند.

`api.registrationMode` به Plugin می‌گوید چرا entry آن در حال بارگذاری است:

| حالت | معنی |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | فعال‌سازی runtime. ابزارها، hookها، سرویس‌ها، commandها، routeها، و سایر اثرات جانبی زنده را register کنید. |
| `discovery` | کشف قابلیت فقط‌خواندنی. ارائه‌دهندگان و فراداده را register کنید؛ کد entry مورد اعتماد Plugin ممکن است بارگذاری شود، اما اثرات جانبی زنده را رد کنید. |
| `setup-only` | بارگذاری فراداده راه‌اندازی کانال از طریق یک entry سبک setup. |
| `setup-runtime` | بارگذاری setup کانال که به entry runtime هم نیاز دارد. |
| `cli-metadata` | فقط گردآوری فراداده commandهای CLI. |

entryهای Plugin که socket، database، worker پس‌زمینه، یا clientهای بلندمدت باز می‌کنند باید آن اثرات جانبی را با `api.registrationMode === "full"` محافظت کنند. بارگذاری‌های discovery جدا از بارگذاری‌های فعال‌کننده cache می‌شوند و رجیستری Gateway در حال اجرا را جایگزین نمی‌کنند. discovery فعال‌کننده نیست، اما بدون import هم نیست: OpenClaw ممکن است entry مورد اعتماد Plugin یا ماژول Plugin کانال را برای ساخت snapshot ارزیابی کند. سطح بالای ماژول‌ها را سبک و بدون اثر جانبی نگه دارید، و clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و راه‌اندازی سرویس را پشت مسیرهای full-runtime منتقل کنید.

روش‌های رایج registration:

| روش | آنچه register می‌کند |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ارائه‌دهنده مدل (LLM) |
| `registerChannel` | کانال گفتگو |
| `registerTool` | ابزار عامل |
| `registerHook` / `on(...)` | hookهای چرخه حیات |
| `registerSpeechProvider` | تبدیل متن به گفتار / STT |
| `registerRealtimeTranscriptionProvider` | STT جریانی |
| `registerRealtimeVoiceProvider` | صدای realtime دوطرفه |
| `registerMediaUnderstandingProvider` | تحلیل تصویر/صدا |
| `registerImageGenerationProvider` | تولید تصویر |
| `registerMusicGenerationProvider` | تولید موسیقی |
| `registerVideoGenerationProvider` | تولید ویدئو |
| `registerWebFetchProvider` | ارائه‌دهنده web fetch / scrape |
| `registerWebSearchProvider` | جستجوی وب |
| `registerHttpRoute` | endpoint HTTP |
| `registerCommand` / `registerCli` | commandهای CLI |
| `registerContextEngine` | موتور context |
| `registerService` | سرویس پس‌زمینه |

رفتار guard مربوط به hookهای چرخه حیات typed:

- `before_tool_call`: `{ block: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

برنامه-سرور بومی Codex رویدادهای ابزار بومی Codex را به این سطح هوک بازمی‌گرداند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند، و در تأییدهای `PermissionRequest` مربوط به Codex مشارکت داشته باشند. این bridge هنوز آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی زمان اجرای Codex در [قرارداد پشتیبانی Codex harness v1](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل هوک‌های تایپ‌شده، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) - Plugin خودتان را بسازید
- [بسته‌های Plugin](/fa/plugins/bundles) - سازگاری بسته‌های Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) - طرح‌واره مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) - افزودن ابزارهای عامل در یک Plugin
- [جزئیات داخلی Plugin](/fa/plugins/architecture) - مدل قابلیت و مسیر بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) - فهرست‌های شخص ثالث
