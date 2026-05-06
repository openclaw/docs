---
read_when:
    - نصب یا پیکربندی Plugin‌ها
    - درک قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Pluginهای OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-06T18:03:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها با قابلیت‌های جدید OpenClaw را گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل، چارچوب‌های agent، ابزارها، Skills، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدیو، واکشی وب، جست‌وجوی وب، و موارد بیشتر. برخی Pluginها **هسته‌ای** هستند (همراه OpenClaw ارائه می‌شوند)، و برخی دیگر **خارجی** هستند. بیشتر Pluginهای خارجی از طریق [ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. npm همچنان برای نصب‌های مستقیم و برای مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا زمان تکمیل آن مهاجرت پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های آمادهٔ کپی و جای‌گذاریِ نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی، و انتشار، [مدیریت Pluginها](/fa/plugins/manage-plugins) را ببینید.

<Steps>
  <Step title="دیدن موارد بارگذاری‌شده">
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

    سپس در فایل پیکربندی خود، زیر `plugins.entries.\<id\>.config` پیکربندی کنید.

  </Step>

  <Step title="مدیریت بومیِ چت">
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` فقط برای مالک، بارگذار مجدد پیکربندی Gateway را فعال می‌کنند. Gateway سطوح زمان اجرای Plugin را در همان فرایند دوباره بارگذاری می‌کند، و نوبت‌های جدید agent فهرست ابزارهای خود را از رجیستری تازه‌سازی‌شده دوباره می‌سازند. `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین Gateway به‌جای وانمود کردن به اینکه فرایند فعلی می‌تواند ماژول‌هایی را که قبلاً import شده‌اند با ایمنی دوباره بارگذاری کند، درخواست راه‌اندازی دوباره می‌دهد.

  </Step>

  <Step title="اعتبارسنجی Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارهای ثبت‌شده، سرویس‌ها، متدهای gateway، hookها، یا فرمان‌های CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید. `inspect` ساده یک بررسی سردِ manifest/registry است و عمداً از import کردن زمان اجرای Plugin پرهیز می‌کند.

  </Step>
</Steps>

اگر کنترل بومیِ چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver استفاده می‌کند که CLI استفاده می‌کند: مسیر/آرشیو محلی، `clawhub:<pkg>` صریح، `npm:<pkg>` صریح، `npm-pack:<path.tgz>` صریح، `git:<repo>` صریح، یا مشخصهٔ بستهٔ بدون پیشوند از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولاً به‌صورت بسته شکست می‌خورد و شما را به `openclaw doctor --fix` ارجاع می‌دهد. تنها استثنای بازیابی، مسیر محدود نصب دوبارهٔ Plugin همراه برای Pluginهایی است که `openclaw.install.allowInvalidConfigRecovery` را انتخاب می‌کنند.
در زمان راه‌اندازی Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری به‌صورت بسته شکست می‌خورد. `openclaw doctor --fix` را اجرا کنید تا پیکربندی بد Plugin با غیرفعال کردن آن ورودی Plugin و حذف payload پیکربندی نامعتبرش قرنطینه شود؛ پشتیبان‌گیری عادی پیکربندی مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی یک کانال به Pluginی ارجاع می‌دهد که دیگر قابل کشف نیست اما همان شناسهٔ کهنهٔ Plugin همچنان در پیکربندی Plugin یا رکوردهای نصب باقی مانده است، راه‌اندازی Gateway هشدارها را ثبت می‌کند و به‌جای مسدود کردن هر کانال دیگر، آن کانال را رد می‌کند.
برای حذف ورودی‌های کهنهٔ کانال/Plugin، `openclaw doctor --fix` را اجرا کنید؛ کلیدهای ناشناختهٔ کانال بدون شواهد Plugin کهنه همچنان در اعتبارسنجی شکست می‌خورند تا خطاهای تایپی قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های کهنهٔ Plugin بی‌اثر تلقی می‌شوند: راه‌اندازی Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor` به‌جای حذف خودکار، پیکربندی Plugin غیرفعال را حفظ می‌کند. اگر می‌خواهید شناسه‌های کهنهٔ Plugin حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید.

نصب وابستگی Plugin فقط در جریان‌های نصب/به‌روزرسانی صریح یا تعمیر doctor انجام می‌شود. راه‌اندازی Gateway، بارگذاری مجدد پیکربندی، و بازرسی زمان اجرا package managerها را اجرا نمی‌کنند یا درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای محلی باید از قبل وابستگی‌های خود را نصب کرده باشند، درحالی‌که Pluginهای npm، git، و ClawHub زیر ریشه‌های Plugin مدیریت‌شدهٔ OpenClaw نصب می‌شوند. وابستگی‌های npm ممکن است در ریشهٔ npm مدیریت‌شدهٔ OpenClaw hoist شوند؛ نصب/به‌روزرسانی پیش از اعتماد آن ریشهٔ مدیریت‌شده را اسکن می‌کند و حذف نصب، بسته‌های مدیریت‌شده با npm را از طریق npm حذف می‌کند. Pluginهای خارجی و مسیرهای بارگذاری سفارشی همچنان باید از طریق `openclaw plugins install` نصب شوند.
برای دیدن `dependencyStatus` ایستای هر Plugin قابل مشاهده بدون import کردن کد زمان اجرا یا تعمیر وابستگی‌ها، از `openclaw plugins list --json` استفاده کنید.
برای چرخهٔ عمر زمان نصب، [حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

### مالکیت مسیر Plugin مسدودشده

اگر عیب‌یابی Plugin بگوید
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
و اعتبارسنجی پیکربندی با `plugin present but blocked` دنبال شود، OpenClaw فایل‌های Pluginی پیدا کرده است که مالک آن‌ها کاربر Unix متفاوتی از فرایندی است که آن‌ها را بارگذاری می‌کند. پیکربندی Plugin را سر جای خود نگه دارید؛ مالکیت فایل‌سیستم را اصلاح کنید یا OpenClaw را به‌عنوان همان کاربری اجرا کنید که مالک پوشهٔ state است.

برای نصب‌های Docker، image رسمی به‌عنوان `node` (uid `1000`) اجرا می‌شود، بنابراین دایرکتوری‌های پیکربندی و workspace OpenClaw که از میزبان bind-mount شده‌اند معمولاً باید متعلق به uid `1000` باشند:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

اگر عمداً OpenClaw را به‌عنوان root اجرا می‌کنید، در عوض ریشهٔ Plugin مدیریت‌شده را به مالکیت root تعمیر کنید:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

پس از اصلاح مالکیت، `openclaw doctor --fix` یا `openclaw plugins registry --refresh` را دوباره اجرا کنید تا رجیستری Plugin ذخیره‌شده با فایل‌های تعمیرشده منطبق شود.

برای نصب‌های npm، انتخابگرهای mutable مانند `latest` یا dist-tag پیش از نصب resolve می‌شوند و سپس به نسخهٔ دقیقِ تأییدشده در ریشهٔ npm مدیریت‌شدهٔ OpenClaw pin می‌شوند. پس از پایان npm، OpenClaw تأیید می‌کند که ورودی نصب‌شدهٔ `package-lock.json` همچنان با نسخه و integrity resolve‌شده مطابقت دارد. اگر npm فرادادهٔ بستهٔ متفاوتی بنویسد، نصب شکست می‌خورد و بستهٔ مدیریت‌شده به عقب برگردانده می‌شود، به‌جای اینکه artifact متفاوتی از Plugin پذیرفته شود.
ریشه‌های npm مدیریت‌شده همچنین `overrides` سطح بستهٔ npm مربوط به OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی که از میزبان بسته‌بندی‌شده محافظت می‌کنند روی وابستگی‌های Plugin خارجی hoist‌شده نیز اعمال می‌شوند.

checkoutهای منبع workspaceهای pnpm هستند. اگر OpenClaw را برای کار روی Pluginهای همراه clone می‌کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw Pluginهای همراه را از `extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و وابستگی‌های محلیِ بسته مستقیماً استفاده شوند.
نصب‌های سادهٔ ریشهٔ npm برای OpenClaw بسته‌بندی‌شده هستند، نه برای توسعهٔ checkout منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را تشخیص می‌دهد:

| قالب | شیوهٔ کار | نمونه‌ها |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ماژول زمان اجرا؛ درون‌فرایندی اجرا می‌شود | Pluginهای رسمی، بسته‌های npm جامعه |
| **Bundle** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle، [Bundleهای Plugin](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin native هستید، با [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## entrypointهای بسته

بسته‌های npm مربوط به Pluginهای native باید `openclaw.extensions` را در `package.json` declare کنند.
هر entry باید داخل دایرکتوری بسته بماند و به یک فایل زمان اجرای خواندنی، یا به یک فایل منبع TypeScript با peer ساخته‌شدهٔ JavaScript استنباط‌شده مانند `src/index.ts` تا `dist/index.js` resolve شود.
نصب‌های بسته‌بندی‌شده باید آن خروجی زمان اجرای JavaScript را ارسال کنند. fallback منبع TypeScript برای checkoutهای منبع و مسیرهای توسعهٔ محلی است، نه برای بسته‌های npm نصب‌شده در ریشهٔ Plugin مدیریت‌شدهٔ OpenClaw.

اگر یک هشدار بستهٔ مدیریت‌شده بگوید `requires compiled runtime output for TypeScript entry ...`، بسته بدون فایل‌های JavaScript مورد نیاز OpenClaw در زمان اجرا منتشر شده است. این یک مشکل بسته‌بندی Plugin است، نه مشکل پیکربندی محلی. پس از اینکه ناشر JavaScript کامپایل‌شده را دوباره منتشر کرد، Plugin را به‌روزرسانی یا دوباره نصب کنید، یا آن Plugin را تا زمانی که بستهٔ اصلاح‌شده در دسترس قرار گیرد غیرفعال/حذف نصب کنید.

وقتی فایل‌های زمان اجرای منتشرشده در همان مسیرهای entryهای منبع قرار ندارند، از `openclaw.runtimeExtensions` استفاده کنید. وقتی وجود دارد، `runtimeExtensions` باید دقیقاً یک entry برای هر entry در `extensions` داشته باشد. فهرست‌های نامنطبق به‌جای fallback بی‌صدا به مسیرهای منبع، نصب و کشف Plugin را شکست می‌دهند. اگر `openclaw.setupEntry` را نیز منتشر می‌کنید، برای peer ساخته‌شدهٔ JavaScript آن از `openclaw.runtimeSetupEntry` استفاده کنید؛ وقتی declare شده باشد، آن فایل الزامی است.

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

ClawHub مسیر اصلی توزیع برای بیشتر Pluginها است. نسخه‌های بسته‌بندی‌شدهٔ فعلی OpenClaw از قبل بسیاری از Pluginهای رسمی را bundle می‌کنند، بنابراین آن‌ها در راه‌اندازی‌های عادی به نصب npm جداگانه نیاز ندارند. تا زمانی که همهٔ Pluginهای متعلق به OpenClaw به ClawHub مهاجرت کنند، OpenClaw همچنان برخی بسته‌های Plugin با نام `@openclaw/*` را برای نصب‌های قدیمی/سفارشی و گردش‌کارهای مستقیم npm روی npm منتشر می‌کند.

اگر npm یک بستهٔ Plugin با نام `@openclaw/*` را deprecated گزارش کند، آن نسخهٔ بسته از یک زنجیرهٔ بستهٔ خارجی قدیمی‌تر است. تا زمانی که بستهٔ npm جدیدتری منتشر شود، از Plugin همراه در OpenClaw فعلی یا یک checkout محلی استفاده کنید.

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

### هسته‌ای (همراه OpenClaw ارائه می‌شود)

<AccordionGroup>
  <Accordion title="ارائه‌دهندگان مدل (به‌صورت پیش‌فرض فعال هستند)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginهای حافظه">
    - `memory-core` - جست‌وجوی حافظهٔ همراه‌شده (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` - حافظهٔ بلندمدت مبتنی بر LanceDB با فراخوانی/ثبت خودکار (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های فراخوانی، و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌صورت پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر">
    - `browser` - Plugin مرورگر همراه‌شده برای ابزار مرورگر، CLI ‏`openclaw browser`، متد Gateway ‏`browser.request`، runtime مرورگر، و سرویس پیش‌فرض کنترل مرورگر (به‌صورت پیش‌فرض فعال است؛ پیش از جایگزین کردن آن را غیرفعال کنید)
    - `copilot-proxy` - پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

به‌دنبال Pluginهای شخص ثالث هستید؟ [Pluginهای جامعه](/fa/plugins/community) را ببینید.

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
| `bundledDiscovery` | حالت کشف Pluginهای همراه‌شده (به‌صورت پیش‌فرض `allowlist`)    |
| `deny`             | فهرست ممنوع Pluginها (اختیاری؛ ممنوعیت اولویت دارد)                     |
| `load.paths`       | فایل‌ها/دایرکتوری‌های اضافهٔ Plugin                            |
| `slots`            | انتخابگرهای slot انحصاری (مثلاً `memory`، `contextEngine`) |
| `entries.\<id\>`   | کلیدهای فعال/غیرفعال‌سازی + پیکربندی برای هر Plugin                               |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Pluginهای فهرست‌شده می‌توانند بارگذاری شوند یا ابزارها را در معرض استفاده بگذارند، حتی اگر `tools.allow` شامل `"*"` یا نام ابزار مشخصی باشد که مالک آن یک Plugin است. اگر فهرست مجاز ابزارها به ابزارهای Plugin اشاره می‌کند، شناسه‌های Plugin مالک را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` دربارهٔ این ساختار هشدار می‌دهد.

`plugins.bundledDiscovery` برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین موجودی محدودکنندهٔ `plugins.allow`، Pluginهای ارائه‌دهندهٔ همراه‌شدهٔ جاافتاده را نیز مسدود می‌کند؛ از جمله کشف ارائه‌دهندهٔ جست‌وجوی وب در runtime. Doctor هنگام مهاجرت، پیکربندی‌های قدیمی فهرست مجاز محدودکننده را با `"compat"` نشان‌گذاری می‌کند تا ارتقاها رفتار قدیمی ارائه‌دهندهٔ همراه‌شده را تا زمانی که اپراتور حالت سخت‌گیرانه‌تر را انتخاب کند حفظ کنند. `plugins.allow` خالی همچنان به‌عنوان تنظیم‌نشده/باز در نظر گرفته می‌شود.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، باعث بارگذاری مجدد درون‌فرایندی Pluginهای Gateway می‌شوند. turnهای جدید agent فهرست ابزارهای خود را از رجیستری Plugin تازه‌سازی‌شده بازسازی می‌کنند. عملیات‌هایی که منبع را تغییر می‌دهند، مانند نصب، به‌روزرسانی، و حذف نصب، همچنان فرایند Gateway را بازراه‌اندازی می‌کنند، چون ماژول‌های Plugin که قبلاً import شده‌اند را نمی‌توان با اطمینان درجا جایگزین کرد.

`openclaw plugins list` یک snapshot محلی از رجیستری/پیکربندی Plugin است. یک Plugin با وضعیت `enabled` در آنجا یعنی رجیستری پایدار و پیکربندی فعلی اجازه می‌دهند Plugin مشارکت کند. این ثابت نمی‌کند که یک Gateway راه‌دورِ از قبل در حال اجرا، همان کد Plugin را reload یا restart کرده است. در راه‌اندازی‌های VPS/container با فرایندهای wrapper، restartها یا نوشته‌هایی را که reload را فعال می‌کنند به فرایند واقعی `openclaw gateway run` بفرستید، یا وقتی reload شکست گزارش می‌کند، از `openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال در برابر موجود نیست در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قوانین فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **موجود نیست**: پیکربندی به شناسهٔ Pluginای ارجاع می‌دهد که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده همخوانی ندارد. راه‌اندازی Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند با غیرفعال کردن آن و حذف payload پیکربندی‌اش، entry نامعتبر را قرنطینه کند.

</Accordion>

## کشف و تقدم

OpenClaw برای Pluginها به این ترتیب پویش می‌کند (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` - مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که
    به دایرکتوری‌های Plugin همراه‌شدهٔ بسته‌بندی‌شدهٔ خود OpenClaw برگردند نادیده گرفته می‌شوند؛
    برای حذف این aliasهای کهنه، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه‌شده">
    همراه OpenClaw ارائه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال هستند (ارائه‌دهندگان مدل، گفتار).
    بقیه به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولاً Pluginهای همراه‌شده را از درخت کامپایل‌شدهٔ `dist/extensions` resolve می‌کنند. اگر دایرکتوری منبع یک Plugin همراه‌شده روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mounted شده باشد، برای مثال `/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mounted را به‌عنوان overlay منبع همراه‌شده در نظر می‌گیرد و آن را پیش از bundle بسته‌بندی‌شدهٔ `/app/dist/extensions/synology-chat` کشف می‌کند. این کار loopهای container نگه‌دارنده را بدون برگرداندن هر Plugin همراه‌شده به منبع TypeScript فعال نگه می‌دارد. برای اجبار به استفاده از bundleهای dist بسته‌بندی‌شده، حتی وقتی mountهای overlay منبع وجود دارند، `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قوانین فعال‌سازی

- `plugins.enabled: false` همهٔ Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow اولویت دارد
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهایی با منشأ workspace به‌صورت **پیش‌فرض غیرفعال** هستند (باید صریحاً فعال شوند)
- Pluginهای همراه‌شده از مجموعهٔ پیش‌فرضِ داخلیِ روشن پیروی می‌کنند، مگر اینکه override شوند
- slotهای انحصاری می‌توانند Plugin انتخاب‌شده برای آن slot را force-enable کنند
- برخی Pluginهای همراه‌شدهٔ opt-in وقتی پیکربندی یک سطح متعلق به Plugin را نام ببرد، مانند ref مدل ارائه‌دهنده، پیکربندی channel، یا runtime harness، به‌صورت خودکار فعال می‌شوند
- پیکربندی کهنهٔ Plugin تا وقتی `plugins.enabled: false` فعال است حفظ می‌شود؛ اگر می‌خواهید شناسه‌های کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- routeهای Codex از خانوادهٔ OpenAI مرزهای جداگانهٔ Plugin را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin OpenAI است، در حالی که Plugin همراه‌شدهٔ app-server مربوط به Codex با `agentRuntime.id: "codex"` یا refهای مدل legacy ‏`codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` ظاهر می‌شود اما side effectها یا hookهای `register(api)` در ترافیک live chat اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال Gateway، profile، مسیر پیکربندی، و فرایند همان‌هایی هستند که در حال ویرایششان هستید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را restart کنید. در containerهای wrapper، PID 1 ممکن است فقط یک supervisor باشد؛ فرایند child ‏`openclaw gateway run` را restart یا signal کنید.
- برای تأیید ثبت hookها و diagnostics از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. hookهای مکالمهٔ غیرهمراه‌شده مانند `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تعویض مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از resolution مدل برای turnهای agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل، خروجی assistant تولید کند.
- برای اثبات مدل مؤثر session، از `openclaw sessions` یا سطوح session/status در Gateway استفاده کنید و هنگام debugging payloadهای ارائه‌دهنده، Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### راه‌اندازی کند ابزار Plugin

اگر به نظر می‌رسد turnهای agent هنگام آماده‌سازی ابزارها متوقف می‌شوند، logging در سطح trace را فعال کنید و به‌دنبال خط‌های timing مربوط به factory ابزار Plugin بگردید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

به‌دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند، از جمله شناسهٔ Plugin، نام‌های ابزار اعلام‌شده، شکل نتیجه، و اینکه ابزار اختیاری است یا نه. وقتی یک factory منفرد دست‌کم 1s طول بکشد یا آماده‌سازی کل factory ابزار Plugin دست‌کم 5s طول بکشد، خط‌های کند به warning ارتقا داده می‌شوند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolutionهای تکراری با همان context درخواست مؤثر cache می‌کند. کلید cache شامل پیکربندی runtime مؤثر، workspace، شناسه‌های agent/session، policy sandbox، تنظیمات مرورگر، context تحویل، هویت requester، و وضعیت مالکیت است؛ بنابراین factoryهایی که به این فیلدهای مورداعتماد وابسته‌اند، با تغییر context دوباره اجرا می‌شوند.

اگر timing تحت سلطهٔ یک Plugin است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید بارگذاری dependencyهای پرهزینه را پشت مسیر اجرای ابزار منتقل کنند، نه اینکه آن را داخل factory ابزار انجام دهند.

### مالکیت تکراری channel یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال در تلاش است مالک همان channel، جریان setup، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin channel خارجی در کنار Plugin همراه‌شده‌ای است که اکنون همان شناسهٔ channel را ارائه می‌کند.

گام‌های debugging:

- برای دیدن هر Plugin فعال و منشأ آن، `openclaw plugins list --enabled --verbose` را اجرا کنید.
- برای هر Plugin مشکوک، `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و `channels`، `channelConfigs`، `tools`، و diagnostics را مقایسه کنید.
- پس از نصب یا حذف packageهای Plugin، `openclaw plugins registry --refresh` را اجرا کنید تا metadata پایدار، نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، رجیستری، یا پیکربندی، Gateway را restart کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً Plugin دیگری را برای همان شناسهٔ channel جایگزین می‌کند، Plugin ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسهٔ Plugin کم‌اولویت‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin کهنه را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را حفظ می‌کند و conflict را گزارش می‌دهد. برای channel یک مالک انتخاب کنید یا ابزارهای متعلق به Plugin را تغییر نام دهید تا سطح runtime بدون ابهام باشد.

## slotهای Plugin (دسته‌های انحصاری)

برخی دسته‌ها انحصاری هستند (هر بار فقط یکی فعال است):

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

| Slot            | آنچه کنترل می‌کند      | پیش‌فرض             |
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

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری از آن‌ها به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهنده‌های مدل همراه، ارائه‌دهنده‌های گفتار همراه، و Plugin مرورگر همراه). سایر Pluginهای همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا بسته hook موجود را در همان محل بازنویسی می‌کند. برای ارتقاهای معمول Pluginهای npm رهگیری‌شده از `openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون `--link` به‌جای کپی‌کردن روی یک مقصد نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال‌سازی به آن allowlist اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، نصب آن ورودی deny کهنه را حذف می‌کند تا نصب صریح بلافاصله پس از راه‌اندازی مجدد قابل بارگذاری باشد.

OpenClaw یک registry محلی پایدار برای Plugin نگه می‌دارد که مدل خواندن سرد برای موجودی Plugin، مالکیت contribution، و برنامه‌ریزی startup است. جریان‌های install، update، uninstall، enable، و disable پس از تغییر وضعیت Plugin آن registry را refresh می‌کنند. همان فایل `plugins/installs.json` فراداده نصب پایدار را در `installRecords` سطح بالا و فراداده manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر registry وجود نداشته باشد، کهنه باشد، یا نامعتبر باشد، `openclaw plugins registry --refresh` نمای manifest آن را از روی رکوردهای نصب، سیاست config، و فراداده manifest/package، بدون بارگذاری ماژول‌های runtime Plugin بازسازی می‌کند.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییردهنده‌های چرخه عمر Plugin غیرفعال هستند. به‌جای آن، انتخاب package و config مربوط به Plugin را از طریق منبع Nix برای نصب مدیریت کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور شروع کنید. `openclaw plugins update <id-or-npm-spec>` روی نصب‌های رهگیری‌شده اعمال می‌شود. ارسال یک مشخصه package در npm با dist-tag یا نسخه دقیق، نام package را به رکورد Plugin رهگیری‌شده برمی‌گرداند و مشخصه جدید را برای updateهای آینده ثبت می‌کند. ارسال نام package بدون نسخه، یک نصب pinned دقیق را به خط انتشار پیش‌فرض registry برمی‌گرداند. اگر Plugin نصب‌شده npm از قبل با نسخه resolve‌شده و هویت artifact ثبت‌شده مطابقت داشته باشد، OpenClaw بدون دانلود، نصب مجدد، یا بازنویسی config از update صرف‌نظر می‌کند. وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای خط پیش‌فرض npm و ClawHub Plugin ابتدا `@beta` را امتحان می‌کنند و وقتی هیچ انتشار beta برای Plugin وجود نداشته باشد به default/latest برمی‌گردند. نسخه‌های دقیق و tagهای صریح pinned باقی می‌مانند.

`--pin` فقط مخصوص npm است. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای یک مشخصه npm، فراداده منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای مثبت‌های کاذب از اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌ها و updateهای Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان blockهای سیاست `before_install` مربوط به Plugin یا blocking ناشی از شکست scan را دور نمی‌زند. scanهای نصب برای جلوگیری از block شدن mockهای تست بسته‌بندی‌شده، فایل‌ها و پوشه‌های تست رایج مانند `tests/`، `__tests__/`، `*.test.*`، و `*.spec.*` را نادیده می‌گیرند؛ entrypointهای runtime اعلام‌شده Plugin همچنان scan می‌شوند حتی اگر از یکی از آن نام‌ها استفاده کنند.

این flag در CLI فقط روی جریان‌های install/update مربوط به Plugin اعمال می‌شود. نصب‌های وابستگی Skills مبتنی بر Gateway به‌جای آن از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان جریان جداگانه دانلود/نصب Skill از ClawHub است.

اگر Pluginی که در ClawHub منتشر کرده‌اید به‌دلیل یک scan پنهان یا block شده است، dashboard ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در دستگاه خودتان اثر می‌گذارد؛ از ClawHub نمی‌خواهد Plugin را دوباره scan کند یا یک انتشار block‌شده را عمومی کند.

bundleهای سازگار در همان جریان list/inspect/enable/disable مربوط به Plugin شرکت می‌کنند. پشتیبانی runtime فعلی شامل bundle skills، command-skills مربوط به Claude، پیش‌فرض‌های Claude `settings.json`، پیش‌فرض‌های Claude `.lsp.json` و `lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor، و پوشه‌های hook سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های bundle شناسایی‌شده به‌همراه ورودی‌های server مربوط به MCP و LSP پشتیبانی‌شده یا پشتیبانی‌نشده برای Pluginهای مبتنی بر bundle را گزارش می‌کند.

منابع marketplace می‌توانند یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`، یک root محلی marketplace یا مسیر `marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL مخزن گیت‌هاب، یا یک URL git باشند. برای marketplaceهای remote، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API Plugin

Pluginهای native یک شیء entry صادر می‌کنند که `register(api)` را ارائه می‌دهد. Pluginهای قدیمی‌تر ممکن است همچنان از `activate(api)` به‌عنوان یک alias legacy استفاده کنند، اما Pluginهای جدید باید از `register` استفاده کنند.

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

| حالت | معنا |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | فعال‌سازی runtime. toolها، hookها، serviceها، commandها، routeها، و سایر اثرهای جانبی زنده را register کنید. |
| `discovery` | کشف قابلیت فقط‌خواندنی. providerها و metadata را register کنید؛ کد entry مربوط به Plugin مورد اعتماد ممکن است بارگذاری شود، اما اثرهای جانبی زنده را رد کنید. |
| `setup-only` | بارگذاری metadata مربوط به setup کانال از طریق یک setup entry سبک. |
| `setup-runtime` | بارگذاری setup کانال که به runtime entry نیز نیاز دارد. |
| `cli-metadata` | فقط جمع‌آوری metadata مربوط به commandهای CLI. |

entryهای Plugin که socket، database، worker پس‌زمینه، یا clientهای طولانی‌عمر باز می‌کنند باید آن اثرهای جانبی را با `api.registrationMode === "full"` محافظت کنند. بارگذاری‌های discovery جدا از بارگذاری‌های activating cache می‌شوند و جایگزین registry در حال اجرای Gateway نمی‌شوند. discovery فعال‌کننده نیست، اما import-free هم نیست: OpenClaw ممکن است entry مورد اعتماد Plugin یا ماژول Plugin کانال را برای ساخت snapshot ارزیابی کند. top levelهای ماژول را سبک و بدون اثر جانبی نگه دارید، و network clientها، subprocessها، listenerها، خواندن credential، و راه‌اندازی service را پشت مسیرهای full-runtime منتقل کنید.

روش‌های رایج registration:

| روش | آنچه register می‌کند |
| --------------------------------------- | --------------------------- |
| `registerProvider` | provider مدل (LLM) |
| `registerChannel` | کانال chat |
| `registerTool` | tool عامل |
| `registerHook` / `on(...)` | hookهای چرخه عمر |
| `registerSpeechProvider` | تبدیل متن به گفتار / STT |
| `registerRealtimeTranscriptionProvider` | STT استریم‌شونده |
| `registerRealtimeVoiceProvider` | صدای realtime دوطرفه |
| `registerMediaUnderstandingProvider` | تحلیل تصویر/صدا |
| `registerImageGenerationProvider` | تولید تصویر |
| `registerMusicGenerationProvider` | تولید موسیقی |
| `registerVideoGenerationProvider` | تولید ویدیو |
| `registerWebFetchProvider` | provider واکشی / scrape وب |
| `registerWebSearchProvider` | جست‌وجوی وب |
| `registerHttpRoute` | endpoint HTTP |
| `registerCommand` / `registerCli` | commandهای CLI |
| `registerContextEngine` | engine زمینه |
| `registerService` | service پس‌زمینه |

رفتار guard برای hookهای چرخه عمر typed:

- `before_tool_call`: `{ block: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` پایانی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

app-server بومی Codex رویدادهای ابزار بومی Codex را دوباره به این
سطح hook پل می‌زند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call`
مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند و در تأییدهای
`PermissionRequest` مربوط به Codex مشارکت کنند. این پل هنوز آرگومان‌های ابزار
بومی Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی زمان اجرای Codex در
[قرارداد پشتیبانی harness v1 Codex](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hook تایپ‌شده، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) - Plugin خودتان را بسازید
- [بسته‌های Plugin](/fa/plugins/bundles) - سازگاری بسته‌های Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) - طرح‌واره مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) - ابزارهای عامل را در یک Plugin اضافه کنید
- [درون‌ساختار Plugin](/fa/plugins/architecture) - مدل قابلیت و خط لوله بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) - فهرست‌های شخص ثالث
