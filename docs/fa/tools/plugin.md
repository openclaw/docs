---
read_when:
    - نصب یا پیکربندی Plugin‌ها
    - آشنایی با کشف Plugin و قواعد بارگذاری
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Plugin‌های OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-05T01:53:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های تازه گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
هارنس‌های عامل، ابزارها، Skills، گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ،
درک رسانه، تولید تصویر، تولید ویدیو، واکشی وب، جست‌وجوی وب، و موارد بیشتر.
برخی Pluginها **هسته‌ای** هستند (همراه OpenClaw عرضه می‌شوند)، و برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. Npm همچنان برای نصب‌های مستقیم
و برای مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا زمان پایان این
مهاجرت پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های آماده کپی‌کردن مربوط به نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی،
و انتشار، [مدیریت Pluginها](/fa/plugins/manage-plugins) را ببینید.

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
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` که فقط
    برای مالک هستند، بارگذار مجدد پیکربندی Gateway را فعال می‌کنند. Gateway
    سطح‌های زمان اجرای Plugin را در همان فرایند دوباره بارگذاری می‌کند، و نوبت‌های
    تازه عامل، فهرست ابزار خود را از رجیستری تازه‌سازی‌شده دوباره می‌سازند.
    `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین Gateway به‌جای
    وانمود کردن به اینکه فرایند فعلی می‌تواند ماژول‌های ازپیش واردشده را با ایمنی
    دوباره بارگذاری کند، درخواست راه‌اندازی مجدد می‌کند.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway، هوک‌ها، یا فرمان‌های
    CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید. `inspect`
    ساده یک بررسی سردِ مانیفست/رجیستری است و عمدا از وارد کردن زمان اجرای Plugin
    اجتناب می‌کند.

  </Step>
</Steps>

اگر کنترل بومیِ چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و
از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان حل‌کننده‌ای استفاده می‌کند که CLI استفاده می‌کند: مسیر/آرشیو
محلی، `clawhub:<pkg>` صریح، `npm:<pkg>` صریح، `git:<repo>` صریح، یا مشخصه
بسته خام از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولا به‌صورت بسته شکست می‌خورد و شما را به
`openclaw doctor --fix` راهنمایی می‌کند. تنها استثنای بازیابی، یک مسیر محدود
نصب مجدد Plugin همراه‌سازی‌شده برای Pluginهایی است که در
`openclaw.install.allowInvalidConfigRecovery` مشارکت می‌کنند.
هنگام شروع به کار Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر
دیگری به‌صورت بسته شکست می‌خورد. `openclaw doctor --fix` را اجرا کنید تا
پیکربندی بد Plugin را با غیرفعال کردن آن ورودی Plugin و حذف محتوای نامعتبر
پیکربندی آن قرنطینه کند؛ پشتیبان‌گیری عادی پیکربندی مقدارهای قبلی را نگه می‌دارد.
وقتی پیکربندی یک کانال به Pluginی ارجاع می‌دهد که دیگر قابل کشف نیست اما همان
شناسه کهنه Plugin همچنان در پیکربندی Plugin یا رکوردهای نصب باقی مانده است،
شروع به کار Gateway هشدارها را ثبت می‌کند و به‌جای مسدود کردن هر کانال دیگر، آن
کانال را رد می‌کند. `openclaw doctor --fix` را اجرا کنید تا ورودی‌های کهنه
کانال/Plugin حذف شوند؛ کلیدهای ناشناخته کانال بدون شواهد Plugin کهنه همچنان در
اعتبارسنجی شکست می‌خورند تا اشتباه‌های تایپی آشکار بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های کهنه Plugin بی‌اثر در نظر
گرفته می‌شوند: شروع به کار Gateway کار کشف/بارگذاری Plugin را رد می‌کند و
`openclaw doctor` به‌جای حذف خودکار، پیکربندی غیرفعال Plugin را حفظ می‌کند. اگر
می‌خواهید شناسه‌های کهنه Plugin حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها
را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط در جریان‌های نصب/به‌روزرسانی صریح یا تعمیر doctor
انجام می‌شود. شروع به کار Gateway، بارگذاری مجدد پیکربندی، و بازرسی زمان اجرا
مدیر بسته اجرا نمی‌کنند یا درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای محلی
باید از قبل وابستگی‌های خود را نصب کرده باشند، درحالی‌که Pluginهای npm، git، و
ClawHub زیر ریشه‌های Plugin مدیریت‌شده OpenClaw نصب می‌شوند. وابستگی‌های npm
ممکن است درون ریشه npm مدیریت‌شده OpenClaw hoist شوند؛ نصب/به‌روزرسانی پیش از
اعتماد، آن ریشه مدیریت‌شده را اسکن می‌کند و حذف نصب، بسته‌های مدیریت‌شده با npm
را از طریق npm حذف می‌کند. Pluginهای خارجی و مسیرهای بارگذاری سفارشی همچنان
باید از طریق `openclaw plugins install` نصب شوند. برای دیدن `dependencyStatus`
ایستا برای هر Plugin قابل مشاهده، بدون وارد کردن کد زمان اجرا یا تعمیر وابستگی‌ها،
از `openclaw plugins list --json` استفاده کنید. برای چرخه عمر زمان نصب،
[حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

برای نصب‌های npm، انتخابگرهای تغییرپذیر مانند `latest` یا یک dist-tag پیش از نصب
حل می‌شوند و سپس به نسخه دقیقِ تاییدشده در ریشه npm مدیریت‌شده OpenClaw سنجاق
می‌شوند. پس از پایان npm، OpenClaw بررسی می‌کند که ورودی نصب‌شده
`package-lock.json` همچنان با نسخه و یکپارچگی حل‌شده مطابقت داشته باشد. اگر npm
فراداده متفاوتی برای بسته بنویسد، نصب شکست می‌خورد و بسته مدیریت‌شده به حالت
قبلی برگردانده می‌شود، نه اینکه آرتیفکت متفاوت Plugin پذیرفته شود.

checkoutهای منبع، workspaceهای pnpm هستند. اگر OpenClaw را برای کار روی
Pluginهای همراه‌سازی‌شده clone می‌کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw
Pluginهای همراه‌سازی‌شده را از `extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و
وابستگی‌های محلی بسته مستقیما استفاده شوند. نصب‌های ساده ریشه npm برای OpenClaw
بسته‌بندی‌شده هستند، نه توسعه checkout منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را می‌شناسد:

| قالب       | نحوه کار                                                            | نمونه‌ها                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **بومی**   | `openclaw.plugin.json` + ماژول زمان اجرا؛ درون‌فرایندی اجرا می‌شود | Pluginهای رسمی، بسته‌های npm جامعه                    |
| **باندل** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات باندل،
[باندل‌های Plugin](/fa/plugins/bundles) را ببینید.

اگر یک Plugin بومی می‌نویسید، با [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی SDK Plugin](/fa/plugins/sdk-overview) شروع کنید.

## نقطه‌های ورود بسته

بسته‌های npm برای Plugin بومی باید `openclaw.extensions` را در `package.json`
اعلام کنند. هر ورودی باید داخل دایرکتوری بسته باقی بماند و به یک فایل زمان
اجرای خواندنی، یا به یک فایل منبع TypeScript با همتای JavaScript ساخته‌شده
استنباط‌شده مانند `src/index.ts` تا `dist/index.js` حل شود.
نصب‌های بسته‌بندی‌شده باید آن خروجی زمان اجرای JavaScript را عرضه کنند. fallback
منبع TypeScript برای checkoutهای منبع و مسیرهای توسعه محلی است، نه برای بسته‌های
npm نصب‌شده در ریشه Plugin مدیریت‌شده OpenClaw.

وقتی فایل‌های زمان اجرای منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند،
از `openclaw.runtimeExtensions` استفاده کنید. وقتی وجود داشته باشد،
`runtimeExtensions` باید دقیقا برای هر ورودی `extensions` یک ورودی داشته باشد.
فهرست‌های ناهماهنگ به‌جای fallback بی‌صدا به مسیرهای منبع، باعث شکست نصب و کشف
Plugin می‌شوند. اگر `openclaw.setupEntry` را هم منتشر می‌کنید، برای همتای
JavaScript ساخته‌شده آن از `openclaw.runtimeSetupEntry` استفاده کنید؛ وقتی اعلام
شود، آن فایل الزامی است.

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

ClawHub مسیر اصلی توزیع برای بیشتر Pluginها است. نسخه‌های بسته‌بندی‌شده فعلی
OpenClaw از قبل بسیاری از Pluginهای رسمی را همراه دارند، بنابراین در راه‌اندازی‌های
عادی به نصب npm جداگانه برای آن‌ها نیاز نیست. تا زمانی که همه Pluginهای متعلق به
OpenClaw به ClawHub مهاجرت کنند، OpenClaw همچنان برخی بسته‌های Plugin با الگوی
`@openclaw/*` را برای نصب‌های قدیمی‌تر/سفارشی و جریان‌های کاری مستقیم npm روی
npm منتشر می‌کند.

اگر npm یک بسته Plugin با الگوی `@openclaw/*` را deprecated گزارش کند، آن نسخه
بسته از یک قطار قدیمی‌تر بسته خارجی است. تا زمانی که بسته npm جدیدتری منتشر شود،
از Plugin همراه نسخه فعلی OpenClaw یا یک checkout محلی استفاده کنید.

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

### هسته (همراه OpenClaw عرضه می‌شود)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — جست‌وجوی حافظه همراه‌سازی‌شده (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` — حافظه بلندمدت مبتنی بر LanceDB با یادآوری/ثبت خودکار (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های
    یادآوری، و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — Plugin مرورگر همراه‌سازی‌شده برای ابزار مرورگر، CLI `openclaw browser`، متد Gateway `browser.request`، زمان اجرای مرورگر، و سرویس پیش‌فرض کنترل مرورگر (به‌صورت پیش‌فرض فعال است؛ پیش از جایگزین کردن آن غیرفعالش کنید)
    - `copilot-proxy` — پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال است)

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
| `enabled`          | کلید اصلی فعال‌سازی/غیرفعال‌سازی (پیش‌فرض: `true`)                           |
| `allow`            | فهرست مجاز Pluginها (اختیاری)                               |
| `bundledDiscovery` | حالت کشف Pluginهای همراه (`allowlist` به‌صورت پیش‌فرض)    |
| `deny`             | فهرست غیرمجاز Pluginها (اختیاری؛ deny غالب است)                     |
| `load.paths`       | فایل‌ها/دایرکتوری‌های اضافی Plugin                            |
| `slots`            | انتخابگرهای جایگاه انحصاری (مثلاً `memory`، `contextEngine`) |
| `entries.\<id\>`   | کلیدهای فعال‌سازی/غیرفعال‌سازی هر Plugin + پیکربندی                               |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Pluginهای فهرست‌شده می‌توانند بارگذاری شوند
یا ابزارها را در دسترس بگذارند، حتی اگر `tools.allow` شامل `"*"` یا نام یک ابزار مشخصِ متعلق به Plugin باشد. اگر فهرست مجاز ابزار به ابزارهای Plugin اشاره می‌کند، شناسه‌های Plugin مالک را
به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` درباره این
شکل هشدار می‌دهد.

`plugins.bundledDiscovery` برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین یک موجودی محدودکننده `plugins.allow` همچنین Pluginهای ارائه‌دهنده همراهِ حذف‌شده را مسدود می‌کند،
از جمله کشف ارائه‌دهنده وب‌جست‌وجوی زمان اجرا. Doctor هنگام مهاجرت، پیکربندی‌های قدیمیِ دارای فهرست مجاز محدودکننده را با `"compat"` مهر می‌زند تا ارتقاها رفتار قدیمی ارائه‌دهنده‌های همراه را نگه دارند تا زمانی که اپراتور حالت سخت‌گیرانه‌تر را انتخاب کند.
`plugins.allow` خالی همچنان تنظیم‌نشده/باز در نظر گرفته می‌شود.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، باعث بارگذاری مجدد Pluginهای Gateway در همان فرایند می‌شوند. نوبت‌های جدید عامل، فهرست ابزارهای خود را از رجیستری Plugin تازه‌سازی‌شده بازسازی می‌کنند. عملیات‌هایی که منبع را تغییر می‌دهند، مانند نصب،
به‌روزرسانی و حذف نصب، همچنان فرایند Gateway را راه‌اندازی مجدد می‌کنند، چون ماژول‌های Plugin که قبلاً import شده‌اند را نمی‌توان با اطمینان درجا جایگزین کرد.

`openclaw plugins list` یک عکس فوری محلی از رجیستری/پیکربندی Plugin است. یک Plugin
`enabled` در آنجا یعنی رجیستری ذخیره‌شده و پیکربندی فعلی به Plugin اجازه مشارکت می‌دهند. این ثابت نمی‌کند که یک Gateway راه دورِ از قبل در حال اجرا، با همان کد Plugin دوباره بارگذاری یا راه‌اندازی مجدد شده است. در راه‌اندازی‌های VPS/کانتینر با فرایندهای wrapper، راه‌اندازی مجدد یا نوشتن‌های محرکِ بارگذاری مجدد را به فرایند واقعی `openclaw gateway run` بفرستید، یا وقتی بارگذاری مجدد شکست گزارش می‌کند، از `openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به شناسه Plugin اشاره می‌کند که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده مطابقت ندارد. راه‌اندازی Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر را با غیرفعال‌کردن آن و حذف payload پیکربندی‌اش قرنطینه کند.

</Accordion>

## کشف و اولویت

OpenClaw به این ترتیب برای Pluginها اسکن می‌کند (اولین تطابق برنده است):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که
    دوباره به دایرکتوری‌های Plugin همراهِ بسته‌بندی‌شده خود OpenClaw اشاره می‌کنند نادیده گرفته می‌شوند؛
    برای حذف آن aliasهای قدیمی `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال‌اند (ارائه‌دهندگان مدل، گفتار).
    برخی دیگر به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولاً Pluginهای همراه را از درخت کامپایل‌شده
`dist/extensions` resolve می‌کنند. اگر دایرکتوری منبع یک Plugin همراه
روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount شود، برای مثال
`/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mount‌شده را
به‌عنوان overlay منبع همراه در نظر می‌گیرد و آن را پیش از بسته
`/app/dist/extensions/synology-chat` کشف می‌کند. این باعث می‌شود loopهای کانتینری نگه‌دارنده
بدون برگرداندن هر Plugin همراه به منبع TypeScript کار کنند.
برای اجبار به استفاده از بسته‌های dist بسته‌بندی‌شده حتی وقتی mountهای overlay منبع وجود دارند،
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همه Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow غالب است
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهایی با خاستگاه workspace **به‌صورت پیش‌فرض غیرفعال‌اند** (باید صریحاً فعال شوند)
- Pluginهای همراه از مجموعه داخلیِ پیش‌فرض فعال پیروی می‌کنند، مگر اینکه override شوند
- جایگاه‌های انحصاری می‌توانند Plugin انتخاب‌شده برای آن جایگاه را اجباری فعال کنند
- برخی Pluginهای همراهِ opt-in وقتی پیکربندی سطحی متعلق به Plugin را نام‌گذاری می‌کند، خودکار فعال می‌شوند، مانند یک ارجاع مدل ارائه‌دهنده، پیکربندی کانال، یا runtime harness
- پیکربندی کهنه Plugin تا زمانی که `plugins.enabled: false` فعال است حفظ می‌شود؛
  اگر می‌خواهید شناسه‌های کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای Codex خانواده OpenAI مرزهای جداگانه Plugin را نگه می‌دارند:
  `openai-codex/*` متعلق به Plugin OpenAI است، درحالی‌که Plugin همراه app-serverِ Codex
  با `agentRuntime.id: "codex"` یا ارجاع‌های مدل قدیمی
  `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` ظاهر می‌شود اما اثرات جانبی یا hookهای
`register(api)` در ترافیک چت زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال
  Gateway، profile، مسیر پیکربندی، و فرایند همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را راه‌اندازی مجدد کنید. در کانتینرهای wrapper،
  PID 1 ممکن است فقط یک supervisor باشد؛ فرایند فرزند
  `openclaw gateway run` را راه‌اندازی مجدد کنید یا به آن signal بفرستید.
- برای تأیید ثبت hookها و diagnostics از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. hookهای مکالمه غیرهمراه مانند `llm_input`,
  `llm_output`, `before_agent_finalize` و `agent_end` به
  `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تغییر مدل، `before_model_resolve` را ترجیح دهید. این پیش از resolve مدل
  برای نوبت‌های عامل اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل
  خروجی دستیار تولید کند.
- برای اثبات مدل مؤثر session، از `openclaw sessions` یا سطح‌های session/statusِ
  Gateway استفاده کنید و، هنگام debug کردن payloadهای ارائه‌دهنده، Gateway را با
  `--raw-stream --raw-stream-path <path>` شروع کنید.

### راه‌اندازی کند ابزار Plugin

اگر به نظر می‌رسد نوبت‌های عامل هنگام آماده‌سازی ابزارها متوقف می‌شوند، logging سطح trace را فعال کنید و
خطوط زمان‌بندی factory ابزار Plugin را بررسی کنید:

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
اختیاری است یا نه. وقتی یک factory منفرد حداقل 1s طول بکشد
یا آماده‌سازی کل factory ابزار Plugin حداقل 5s طول بکشد، خطوط کند به هشدار ارتقا داده می‌شوند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolutionهای تکراری
با همان context مؤثر درخواست cache می‌کند. کلید cache شامل پیکربندی مؤثر
runtime، workspace، شناسه‌های agent/session، سیاست sandbox، تنظیمات مرورگر،
context تحویل، هویت درخواست‌کننده، و وضعیت مالکیت است، بنابراین factoryهایی که
به آن فیلدهای مورد اعتماد وابسته‌اند، هنگام تغییر context دوباره اجرا می‌شوند.

اگر یک Plugin بر زمان‌بندی غالب است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید
بارگذاری وابستگی‌های پرهزینه را به پشت مسیر اجرای ابزار منتقل کنند، نه اینکه آن را
داخل factory ابزار انجام دهند.

### مالکیت تکراری کانال یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان کانال،
جریان setup، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin کانال خارجی
در کنار یک Plugin همراه است که اکنون همان شناسه کانال را ارائه می‌کند.

گام‌های debug:

- برای دیدن هر Plugin فعال و خاستگاه آن، `openclaw plugins list --enabled --verbose` را اجرا کنید.
- برای هر Plugin مشکوک `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و
  `channels`، `channelConfigs`، `tools` و diagnostics را مقایسه کنید.
- پس از نصب یا حذف packageهای Plugin، `openclaw plugins registry --refresh` را اجرا کنید
  تا metadata ذخیره‌شده نصب فعلی را منعکس کند.
- پس از تغییرات نصب، رجیستری، یا پیکربندی، Gateway را راه‌اندازی مجدد کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً Plugin دیگری را برای همان شناسه کانال جایگزین می‌کند، Plugin
  ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با
  شناسه Plugin دارای اولویت پایین‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با
  `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin کهنه را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را نگه می‌دارد و
  تعارض را گزارش می‌کند. برای کانال یک مالک انتخاب کنید یا ابزارهای متعلق به Plugin را
  تغییر نام دهید تا سطح runtime بدون ابهام باشد.

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

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری از آن‌ها به‌صورت پیش‌فرض فعال هستند (برای نمونه، ارائه‌دهنده‌های مدل همراه، ارائه‌دهنده‌های گفتار همراه، و Plugin مرورگر همراه). سایر Pluginهای همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا بسته hook موجود را در همان محل بازنویسی می‌کند. برای ارتقاهای معمول Pluginهای npm ردیابی‌شده از `openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون `--link` به‌جای کپی کردن روی یک مقصد نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال‌سازی آن به همان allowlist اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، نصب آن ورودی deny قدیمی را حذف می‌کند تا نصب صریح بلافاصله پس از راه‌اندازی مجدد قابل بارگذاری باشد.

OpenClaw یک رجیستری محلی پایدار Plugin را به‌عنوان مدل خواندن سرد برای موجودی Plugin، مالکیت مشارکت‌ها، و برنامه‌ریزی راه‌اندازی نگه می‌دارد. جریان‌های نصب، به‌روزرسانی، حذف نصب، فعال‌سازی، و غیرفعال‌سازی پس از تغییر وضعیت Plugin آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فراداده نصب پایدار را در `installRecords` سطح بالا و فراداده manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر رجیستری وجود نداشته باشد، قدیمی باشد، یا نامعتبر باشد، `openclaw plugins registry --refresh` نمای manifest آن را از رکوردهای نصب، سیاست پیکربندی، و فراداده manifest/package بدون بارگذاری ماژول‌های runtime مربوط به Plugin بازسازی می‌کند.
`openclaw plugins update <id-or-npm-spec>` روی نصب‌های ردیابی‌شده اعمال می‌شود. دادن یک spec بسته npm همراه با یک dist-tag یا نسخه دقیق، نام بسته را به رکورد Plugin ردیابی‌شده برمی‌گرداند و spec جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند. دادن نام بسته بدون نسخه، یک نصب پین‌شده دقیق را به خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin نصب‌شده npm از قبل با نسخه resolveشده و هویت artifact ثبت‌شده مطابقت داشته باشد، OpenClaw به‌روزرسانی را بدون دانلود، نصب مجدد، یا بازنویسی پیکربندی رد می‌کند.
وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای Plugin مربوط به npm در خط پیش‌فرض و ClawHub ابتدا `@beta` را امتحان می‌کنند و وقتی هیچ انتشار beta برای Plugin وجود نداشته باشد، به default/latest برمی‌گردند. نسخه‌های دقیق و tagهای صریح پین‌شده باقی می‌مانند.

`--pin` فقط مخصوص npm است. این گزینه با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای یک spec مربوط به npm، فراداده منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای مثبت‌های کاذب اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌ها و به‌روزرسانی‌های Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند. اسکن‌های نصب فایل‌ها و دایرکتوری‌های رایج تست مانند `tests/`،‏ `__tests__/`،‏ `*.test.*`، و `*.spec.*` را نادیده می‌گیرند تا mockهای تست بسته‌بندی‌شده باعث مسدودسازی نشوند؛ entrypointهای runtime اعلام‌شده Plugin همچنان اسکن می‌شوند حتی اگر از یکی از آن نام‌ها استفاده کنند.

این flag مربوط به CLI فقط برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب وابستگی‌های skill مبتنی بر Gateway در عوض از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کند، در حالی که `openclaw skills install` همچنان جریان جداگانه دانلود/نصب skill از ClawHub است.

اگر Pluginی که در ClawHub منتشر کرده‌اید به‌دلیل یک اسکن پنهان یا مسدود شده است، داشبورد ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در دستگاه خودتان اثر دارد؛ از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را عمومی کند.

بسته‌های سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin مشارکت می‌کنند. پشتیبانی runtime فعلی شامل Skills بسته، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `lspServers` اعلام‌شده در manifest و `.lsp.json` مربوط به Claude، command-skills مربوط به Cursor، و دایرکتوری‌های hook سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های بسته شناسایی‌شده به‌علاوه ورودی‌های پشتیبانی‌شده یا پشتیبانی‌نشده سرور MCP و LSP را برای Pluginهای مبتنی بر بسته گزارش می‌کند.

منابع marketplace می‌توانند یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`، یک ریشه marketplace محلی یا مسیر `marketplace.json`، یک کوتاه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git باشند. برای marketplaceهای راه‌دور، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API مربوط به Plugin

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

OpenClaw شیء entry را بارگذاری می‌کند و در زمان فعال‌سازی Plugin، `register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` fallback می‌کند، اما Pluginهای همراه و Pluginهای خارجی جدید باید `register` را به‌عنوان قرارداد عمومی در نظر بگیرند.

`api.registrationMode` به یک Plugin می‌گوید چرا entry آن در حال بارگذاری است:

| حالت | معنی |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | فعال‌سازی runtime. ابزارها، hookها، سرویس‌ها، commandها، routeها، و سایر اثرات جانبی زنده را ثبت کنید. |
| `discovery` | کشف قابلیت فقط‌خواندنی. ارائه‌دهنده‌ها و فراداده را ثبت کنید؛ کد entry مربوط به Plugin مورد اعتماد ممکن است بارگذاری شود، اما اثرات جانبی زنده را رد کنید. |
| `setup-only` | بارگذاری فراداده راه‌اندازی کانال از طریق یک setup entry سبک. |
| `setup-runtime` | بارگذاری راه‌اندازی کانال که به entry مربوط به runtime هم نیاز دارد. |
| `cli-metadata` | فقط گردآوری فراداده command مربوط به CLI. |

entryهای Plugin که socket، پایگاه‌داده، worker پس‌زمینه، یا clientهای بلندمدت باز می‌کنند باید آن اثرات جانبی را با `api.registrationMode === "full"` محافظت کنند. بارگذاری‌های discovery جدا از بارگذاری‌های فعال‌سازی cache می‌شوند و جایگزین رجیستری Gateway در حال اجرا نمی‌شوند. discovery غیرفعال‌ساز است، نه بدون import: OpenClaw ممکن است entry مربوط به Plugin مورد اعتماد یا ماژول Plugin کانال را برای ساخت snapshot ارزیابی کند. سطح بالای ماژول‌ها را سبک و بدون اثر جانبی نگه دارید، و clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و راه‌اندازی سرویس را پشت مسیرهای full-runtime منتقل کنید.

روش‌های رایج ثبت:

| روش | آنچه ثبت می‌کند |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ارائه‌دهنده مدل (LLM) |
| `registerChannel` | کانال chat |
| `registerTool` | ابزار عامل |
| `registerHook` / `on(...)` | hookهای چرخه حیات |
| `registerSpeechProvider` | تبدیل متن به گفتار / STT |
| `registerRealtimeTranscriptionProvider` | STT جریانی |
| `registerRealtimeVoiceProvider` | صدای realtime دوطرفه |
| `registerMediaUnderstandingProvider` | تحلیل تصویر/صدا |
| `registerImageGenerationProvider` | تولید تصویر |
| `registerMusicGenerationProvider` | تولید موسیقی |
| `registerVideoGenerationProvider` | تولید ویدیو |
| `registerWebFetchProvider` | ارائه‌دهنده واکشی وب / scrape |
| `registerWebSearchProvider` | جستجوی وب |
| `registerHttpRoute` | endpoint مربوط به HTTP |
| `registerCommand` / `registerCli` | commandهای CLI |
| `registerContextEngine` | موتور context |
| `registerService` | سرویس پس‌زمینه |

رفتار guard مربوط به hookهای چرخه حیات typed:

- `before_tool_call`:‏ `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`:‏ `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`:‏ `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`:‏ `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`:‏ `{ cancel: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`:‏ `{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

app-server بومی Codex رویدادهای ابزار بومی Codex را به این سطح hook پل می‌زند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند، نتیجه‌ها را از طریق `after_tool_call` مشاهده کنند، و در تاییدهای `PermissionRequest` مربوط به Codex مشارکت کنند. bridge هنوز آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی runtime مربوط به Codex در [قرارداد پشتیبانی v1 برای harness مربوط به Codex](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hookهای typed، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Plugin](/fa/plugins/building-plugins) — Plugin خود را بسازید
- [باندل‌های Plugin](/fa/plugins/bundles) — سازگاری باندل‌های Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) — طرح‌وارهٔ مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) — ابزارهای عامل را در یک Plugin اضافه کنید
- [درون‌ساخت Plugin](/fa/plugins/architecture) — مدل قابلیت و خط لولهٔ بارگذاری
- [Plugin‌های جامعه](/fa/plugins/community) — فهرست‌های شخص ثالث
