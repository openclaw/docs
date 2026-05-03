---
read_when:
    - نصب یا پیکربندی Plugin‌ها
    - درک قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: نصب، پیکربندی و مدیریت Pluginهای OpenClaw
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-03T21:42:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
مهارهای عامل، ابزارها، Skills، گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ،
درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، جستجوی وب، و موارد بیشتر.
برخی Pluginها **هسته‌ای** هستند (همراه OpenClaw عرضه می‌شوند)، برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. Npm همچنان برای نصب‌های مستقیم و برای
مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا پایان این مهاجرت پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های آماده کپی‌کردن نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی، و انتشار، ببینید
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
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` که فقط برای مالک هستند،
    بارگذار مجدد پیکربندی Gateway را فعال می‌کنند. Gateway سطح‌های زمان اجرای Plugin را
    در همان فرایند دوباره بارگذاری می‌کند، و نوبت‌های جدید عامل فهرست ابزار خود را از
    رجیستری تازه‌سازی‌شده دوباره می‌سازند. `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین
    Gateway به‌جای وانمودکردن به اینکه فرایند فعلی می‌تواند ماژول‌های ازقبل import‌شده را
    به‌صورت ایمن دوباره بارگذاری کند، درخواست راه‌اندازی دوباره می‌دهد.

  </Step>

  <Step title="تأیید Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارها، سرویس‌ها، متدهای Gateway، hookها، یا فرمان‌های CLI متعلق به Plugin
    را اثبات کنید، از `--runtime` استفاده کنید. `inspect` ساده یک بررسی سرد
    مانیفست/رجیستری است و عمداً از import کردن زمان اجرای Plugin پرهیز می‌کند.

  </Step>
</Steps>

اگر کنترل بومی چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و استفاده کنید از:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver که CLI استفاده می‌کند بهره می‌برد: مسیر/آرشیو محلی، مقدار صریح
`clawhub:<pkg>`، مقدار صریح `npm:<pkg>`، مقدار صریح `git:<repo>`، یا مشخصه بسته ساده
از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولاً بسته و ایمن شکست می‌خورد و شما را به
`openclaw doctor --fix` هدایت می‌کند. تنها استثنای بازیابی، مسیر محدود نصب مجدد Plugin همراه
برای Pluginهایی است که در
`openclaw.install.allowInvalidConfigRecovery` شرکت می‌کنند.
هنگام شروع به کار Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری
بسته و ایمن شکست می‌خورد. `openclaw doctor --fix` را اجرا کنید تا پیکربندی بد Plugin را با
غیرفعال‌کردن آن ورودی Plugin و حذف payload پیکربندی نامعتبر آن قرنطینه کنید؛ پشتیبان‌گیری معمول
پیکربندی مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی کانال به Pluginای ارجاع می‌دهد که دیگر قابل کشف نیست اما همان شناسه کهنه Plugin
در پیکربندی Plugin یا رکوردهای نصب باقی مانده است، شروع به کار Gateway هشدارها را ثبت می‌کند و
به‌جای مسدودکردن همه کانال‌های دیگر، آن کانال را رد می‌کند.
`openclaw doctor --fix` را اجرا کنید تا ورودی‌های کهنه کانال/Plugin حذف شوند؛ کلیدهای ناشناخته
کانال بدون شواهد Plugin کهنه همچنان در اعتبارسنجی شکست می‌خورند تا خطاهای تایپی قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های کهنه Plugin بی‌اثر تلقی می‌شوند:
شروع به کار Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor` به‌جای حذف خودکار آن،
پیکربندی غیرفعال Plugin را حفظ می‌کند. اگر می‌خواهید شناسه‌های کهنه Plugin حذف شوند، پیش از
اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید.

نصب وابستگی Plugin فقط در جریان نصب/به‌روزرسانی صریح یا جریان‌های تعمیر doctor انجام می‌شود.
شروع به کار Gateway، بارگذاری مجدد پیکربندی، و بازرسی زمان اجرا
package managerها را اجرا نمی‌کنند و درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای محلی باید از قبل
وابستگی‌های خود را نصب‌شده داشته باشند، در حالی که Pluginهای npm، git، و ClawHub
زیر ریشه‌های Plugin مدیریت‌شده OpenClaw نصب می‌شوند. وابستگی‌های npm ممکن است
درون ریشه npm مدیریت‌شده OpenClaw hoist شوند؛ نصب/به‌روزرسانی پیش از اعتماد، آن ریشه مدیریت‌شده را اسکن می‌کند
و حذف نصب بسته‌های مدیریت‌شده npm را از طریق npm حذف می‌کند. Pluginهای خارجی
و مسیرهای بارگذاری سفارشی همچنان باید از طریق `openclaw plugins install` نصب شوند.
از `openclaw plugins list --json` استفاده کنید تا `dependencyStatus` ایستای هر
Plugin قابل مشاهده را بدون import کردن کد زمان اجرا یا تعمیر وابستگی‌ها ببینید.
برای چرخه عمر زمان نصب، [حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

برای نصب‌های npm، selectorهای تغییرپذیر مانند `latest` یا یک dist-tag پیش از نصب resolve می‌شوند
و سپس به نسخه دقیق تأییدشده در ریشه npm مدیریت‌شده OpenClaw سنجاق می‌شوند.
پس از پایان npm، OpenClaw تأیید می‌کند ورودی نصب‌شده
`package-lock.json` همچنان با نسخه resolve‌شده و integrity مطابقت دارد. اگر
npm فراداده بسته متفاوتی بنویسد، نصب شکست می‌خورد و بسته مدیریت‌شده
به‌جای پذیرش یک artifact متفاوت Plugin، به حالت قبل برگردانده می‌شود.

checkoutهای منبع، workspaceهای pnpm هستند. اگر OpenClaw را برای کار روی Pluginهای همراه clone می‌کنید،
`pnpm install` را اجرا کنید؛ سپس OpenClaw، Pluginهای همراه را از
`extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و وابستگی‌های محلی بسته مستقیماً استفاده شوند.
نصب‌های ریشه npm ساده برای OpenClaw بسته‌بندی‌شده هستند، نه توسعه
checkout منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را می‌شناسد:

| قالب     | نحوه کارکرد                                                       | نمونه‌ها                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ماژول زمان اجرا؛ درون فرایند اجرا می‌شود       | Pluginهای رسمی، بسته‌های npm جامعه               |
| **Bundle** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`، `.claude-plugin/`، `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle، [Plugin Bundles](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin بومی هستید، با [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## نقطه‌های ورود بسته

بسته‌های npm مربوط به Plugin بومی باید `openclaw.extensions` را در `package.json` اعلام کنند.
هر ورودی باید داخل دایرکتوری بسته باقی بماند و به یک فایل زمان اجرای قابل خواندن
resolve شود، یا به یک فایل منبع TypeScript با یک همتای JavaScript ساخته‌شده استنتاج‌شده
مانند `src/index.ts` به `dist/index.js`.
نصب‌های بسته‌بندی‌شده باید آن خروجی زمان اجرای JavaScript را همراه داشته باشند. fallback منبع TypeScript
برای checkoutهای منبع و مسیرهای توسعه محلی است، نه برای
بسته‌های npm نصب‌شده در ریشه Plugin مدیریت‌شده OpenClaw.

وقتی فایل‌های زمان اجرای منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند، از `openclaw.runtimeExtensions` استفاده کنید.
وقتی موجود باشد، `runtimeExtensions` باید دقیقاً برای هر ورودی `extensions`
یک ورودی داشته باشد. فهرست‌های ناهماهنگ به‌جای fallback بی‌صدا به مسیرهای منبع، نصب و
کشف Plugin را شکست می‌دهند. اگر `openclaw.setupEntry` را نیز
منتشر می‌کنید، برای همتای JavaScript ساخته‌شده آن از `openclaw.runtimeSetupEntry` استفاده کنید؛ آن فایل هنگام اعلام‌شدن الزامی است.

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
OpenClaw از قبل بسیاری از Pluginهای رسمی را همراه دارند، بنابراین در راه‌اندازی‌های معمول به
نصب npm جداگانه نیاز ندارند. تا زمانی که همه Pluginهای متعلق به OpenClaw
به ClawHub مهاجرت کنند، OpenClaw همچنان برخی بسته‌های Plugin `@openclaw/*` را روی
npm برای نصب‌های قدیمی‌تر/سفارشی و workflowهای مستقیم npm عرضه می‌کند.

اگر npm یک بسته Plugin `@openclaw/*` را منسوخ گزارش کند، آن نسخه بسته
از قطار بسته خارجی قدیمی‌تر است. تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه در
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

### هسته (همراه OpenClaw عرضه می‌شود)

<AccordionGroup>
  <Accordion title="ارائه‌دهندگان مدل (به‌صورت پیش‌فرض فعال)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginهای حافظه">
    - `memory-core` — جستجوی حافظه همراه (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` — حافظه بلندمدت مبتنی بر LanceDB با فراخوانی/ثبت خودکار (تنظیم کنید `plugins.slots.memory = "memory-lancedb"`)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های فراخوانی، و عیب‌یابی،
    [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌صورت پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر">
    - `browser` — Plugin مرورگر همراه برای ابزار مرورگر، CLI `openclaw browser`، متد Gateway `browser.request`، زمان اجرای مرورگر، و سرویس کنترل مرورگر پیش‌فرض (به‌صورت پیش‌فرض فعال؛ پیش از جایگزین‌کردن آن غیرفعالش کنید)
    - `copilot-proxy` — پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال)

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

| فیلد            | توضیح                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | کلید اصلی فعال‌سازی (پیش‌فرض: `true`)                           |
| `allow`          | فهرست مجاز Plugin (اختیاری)                               |
| `deny`           | فهرست مسدود Plugin (اختیاری؛ مسدودسازی اولویت دارد)                     |
| `load.paths`     | فایل‌ها/دایرکتوری‌های اضافی Plugin                            |
| `slots`          | انتخابگرهای اسلات انحصاری (مثلا `memory`، `contextEngine`) |
| `entries.\<id\>` | کلیدهای فعال‌سازی هر Plugin + پیکربندی                               |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Pluginهای فهرست‌شده می‌توانند بارگذاری شوند
یا ابزارها را ارائه کنند، حتی اگر `tools.allow` شامل `"*"` یا نام یک ابزار مشخص
متعلق به Plugin باشد. اگر فهرست مجاز ابزار به ابزارهای Plugin اشاره می‌کند، شناسه‌های Plugin مالک
را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` درباره این
شکل هشدار می‌دهد.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، باعث
بارگذاری مجدد درون‌فرایندی Plugin در Gateway می‌شوند. نوبت‌های جدید agent فهرست ابزارهای خود را از
رجیستری Plugin تازه‌سازی‌شده بازسازی می‌کنند. عملیات‌هایی که منبع را تغییر می‌دهند، مانند نصب،
به‌روزرسانی و حذف نصب، همچنان فرایند Gateway را دوباره راه‌اندازی می‌کنند، چون ماژول‌های Plugin
که قبلا import شده‌اند، به‌صورت ایمن درجا قابل جایگزینی نیستند.

`openclaw plugins list` یک snapshot محلی از رجیستری/پیکربندی Plugin است. یک Plugin با وضعیت
`enabled` در آنجا یعنی رجیستری پایدارشده و پیکربندی فعلی اجازه می‌دهند Plugin
مشارکت کند. این ثابت نمی‌کند که یک Gateway راه‌دور که از قبل در حال اجراست،
با همان کد Plugin بارگذاری مجدد یا راه‌اندازی مجدد شده است. در تنظیمات VPS/کانتینر
با فرایندهای wrapper، راه‌اندازی‌های مجدد یا نوشتن‌هایی را که باعث بارگذاری مجدد می‌شوند به فرایند واقعی
`openclaw gateway run` بفرستید، یا وقتی گزارش بارگذاری مجدد خطا می‌دهد، از
`openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به شناسه Pluginای اشاره می‌کند که discovery پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده همخوان نیست. راه‌اندازی Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر را با غیرفعال‌کردن آن و حذف payload پیکربندی‌اش قرنطینه کند.

</Accordion>

## discovery و تقدم

OpenClaw به این ترتیب Pluginها را اسکن می‌کند (اولین تطابق برنده است):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که
    به دایرکتوری‌های Plugin بسته‌بندی‌شده خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛
    برای حذف آن aliasهای کهنه `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال هستند (ارائه‌دهندگان مدل، گفتار).
    برخی دیگر به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولا Pluginهای bundled را از درخت کامپایل‌شده
`dist/extensions` resolve می‌کنند. اگر دایرکتوری منبع یک Plugin bundled
روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount شود، برای مثال
`/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mount‌شده
را به‌عنوان overlay منبع bundled در نظر می‌گیرد و آن را پیش از bundle بسته‌بندی‌شده
`/app/dist/extensions/synology-chat` کشف می‌کند. این باعث می‌شود loopهای کانتینری نگهدارندگان
بدون برگرداندن همه Pluginهای bundled به منبع TypeScript کار کنند.
برای اجبار به استفاده از bundleهای packaged dist حتی وقتی mountهای overlay منبع وجود دارند،
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همه Pluginها را غیرفعال می‌کند و کار discovery/load Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow اولویت دارد
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهای با منشأ workspace به‌صورت **پیش‌فرض غیرفعال** هستند (باید صراحتا فعال شوند)
- Pluginهای bundled از مجموعه داخلی default-on پیروی می‌کنند مگر اینکه override شوند
- اسلات‌های انحصاری می‌توانند Plugin انتخاب‌شده برای آن اسلات را اجبارا فعال کنند
- برخی Pluginهای bundled opt-in وقتی پیکربندی یک سطح متعلق به Plugin را نام ببرد، خودکار فعال می‌شوند،
  مانند ref مدل provider، پیکربندی کانال، یا runtime harness
- پیکربندی کهنه Plugin تا زمانی که `plugins.enabled: false` فعال است حفظ می‌شود؛
  اگر می‌خواهید شناسه‌های کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای خانواده OpenAI Codex مرزهای Plugin جداگانه را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin OpenAI است، در حالی که Plugin bundled سرور app مربوط به Codex
  با `agentRuntime.id: "codex"` یا refهای مدل legacy
  `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` ظاهر می‌شود اما side effectها یا hookهای `register(api)`
در ترافیک live chat اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL،
  profile، مسیر پیکربندی و فرایند Gateway فعال همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را دوباره راه‌اندازی کنید. در کانتینرهای wrapper،
  PID 1 ممکن است فقط یک supervisor باشد؛ فرایند فرزند
  `openclaw gateway run` را دوباره راه‌اندازی یا signal کنید.
- از `openclaw plugins inspect <id> --runtime --json` برای تأیید ثبت hookها و
  diagnostics استفاده کنید. hookهای conversation غیرباندل مانند `llm_input`،
  `llm_output`، `before_agent_finalize` و `agent_end` به
  `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تغییر مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از resolution مدل
  برای نوبت‌های agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل
  خروجی assistant تولید کند.
- برای اثبات مدل مؤثر session، از `openclaw sessions` یا سطح‌های
  session/status در Gateway استفاده کنید و هنگام debug کردن payloadهای provider،
  Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### آماده‌سازی کند ابزار Plugin

اگر به نظر می‌رسد نوبت‌های agent هنگام آماده‌سازی ابزارها متوقف می‌شوند، trace logging را فعال کنید و
خطوط زمان‌بندی کارخانه ابزار Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند،
از جمله شناسه Plugin، نام ابزارهای اعلام‌شده، شکل نتیجه و اینکه ابزار
اختیاری است یا نه. وقتی یک factory منفرد حداقل 1s طول بکشد
یا آماده‌سازی کل factory ابزار Plugin حداقل 5s طول بکشد، خطوط کند به هشدار ارتقا داده می‌شوند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolutionهای تکراری
با همان context مؤثر request cache می‌کند. کلید cache شامل پیکربندی مؤثر
runtime، workspace، شناسه‌های agent/session، سیاست sandbox، تنظیمات browser،
context تحویل، هویت requester و وضعیت ownership است، بنابراین factoryهایی که
به آن فیلدهای قابل اعتماد وابسته‌اند، هنگام تغییر context دوباره اجرا می‌شوند.

اگر یک Plugin بر زمان‌بندی غالب است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب یا غیرفعال کنید. نویسندگان Plugin باید
بارگذاری dependencyهای پرهزینه را پشت مسیر اجرای ابزار منتقل کنند، نه اینکه آن را
داخل factory ابزار انجام دهند.

### ownership تکراری کانال یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان کانال،
flow راه‌اندازی، یا نام ابزار باشد. رایج‌ترین علت این است که یک Plugin کانال external
کنار یک Plugin bundled نصب شده که حالا همان شناسه کانال را ارائه می‌کند.

مراحل debug:

- `openclaw plugins list --enabled --verbose` را اجرا کنید تا هر Plugin فعال
  و منشأ آن را ببینید.
- برای هر Plugin مشکوک `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و
  `channels`، `channelConfigs`، `tools` و diagnostics را مقایسه کنید.
- پس از نصب یا حذف packageهای Plugin، `openclaw plugins registry --refresh` را اجرا کنید
  تا metadata پایدارشده وضعیت نصب فعلی را منعکس کند.
- پس از تغییرات نصب، رجیستری یا پیکربندی، Gateway را دوباره راه‌اندازی کنید.

گزینه‌های رفع مشکل:

- اگر یک Plugin عمدا جایگزین Plugin دیگری برای همان شناسه کانال می‌شود، Plugin
  ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسه Plugin
  با اولویت پایین‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با
  `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin کهنه را حذف کنید.
- اگر هر دو Plugin را صراحتا فعال کرده‌اید، OpenClaw آن request را حفظ می‌کند و
  conflict را گزارش می‌دهد. یک مالک برای کانال انتخاب کنید یا ابزارهای متعلق به Plugin را
  rename کنید تا سطح runtime بدون ابهام باشد.

## اسلات‌های Plugin (دسته‌های انحصاری)

برخی دسته‌ها انحصاری هستند (در هر زمان فقط یکی فعال است):

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

| اسلات            | آنچه کنترل می‌کند      | پیش‌فرض             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin حافظه فعال  | `memory-core`       |
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

Plugin‌های همراه با OpenClaw عرضه می‌شوند. بسیاری از آن‌ها به‌صورت پیش‌فرض فعال هستند (برای مثال
ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر
همراه). دیگر Plugin‌های همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا بستهٔ hook موجود را درجا بازنویسی می‌کند. برای
ارتقاهای معمول Plugin‌های npm ردیابی‌شده از
`openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link`
پشتیبانی نمی‌شود، چون `--link` به‌جای کپی کردن روی یک مقصد نصب مدیریت‌شده، از مسیر
مبدأ دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسهٔ
Plugin نصب‌شده را پیش از فعال‌سازی آن به آن فهرست مجاز اضافه می‌کند. اگر همان شناسهٔ
Plugin در `plugins.deny` وجود داشته باشد، نصب آن ورودی deny قدیمی را حذف می‌کند تا
نصب صریح پس از راه‌اندازی دوباره بلافاصله قابل بارگذاری باشد.

OpenClaw یک رجیستری محلی پایدار برای Plugin نگه می‌دارد که به‌عنوان مدل خواندن سرد
برای فهرست موجودی Plugin، مالکیت contribution، و برنامه‌ریزی راه‌اندازی استفاده می‌شود. جریان‌های نصب، به‌روزرسانی،
حذف نصب، فعال‌سازی، و غیرفعال‌سازی پس از تغییر وضعیت Plugin آن رجیستری را تازه‌سازی می‌کنند.
همان فایل `plugins/installs.json` فرادادهٔ نصب پایدار را در
`installRecords` سطح بالا و فرادادهٔ manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر
رجیستری وجود نداشته باشد، قدیمی باشد، یا نامعتبر باشد، `openclaw plugins registry
--refresh` نمای manifest آن را از رکوردهای نصب، سیاست پیکربندی، و
فرادادهٔ manifest/package بدون بارگذاری ماژول‌های runtime Plugin بازسازی می‌کند.
`openclaw plugins update <id-or-npm-spec>` روی نصب‌های ردیابی‌شده اعمال می‌شود. ارسال
یک spec بستهٔ npm با dist-tag یا نسخهٔ دقیق، نام بسته را
به رکورد Plugin ردیابی‌شده برمی‌گرداند و spec جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند.
ارسال نام بسته بدون نسخه، یک نصب دقیقاً pin‌شده را به
خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin نصب‌شدهٔ npm از قبل با
نسخهٔ resolve‌شده و هویت artifact ثبت‌شده مطابقت داشته باشد، OpenClaw به‌روزرسانی را
بدون دانلود، نصب دوباره، یا بازنویسی پیکربندی رد می‌کند.
وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای Plugin خط پیش‌فرض npm و ClawHub
ابتدا `@beta` را امتحان می‌کنند و وقتی انتشار beta برای Plugin وجود نداشته باشد، به default/latest
برمی‌گردند. نسخه‌های دقیق و tagهای صریح pin‌شده باقی می‌مانند.

`--pin` فقط مخصوص npm است. با `--marketplace` پشتیبانی نمی‌شود، چون
نصب‌های marketplace به‌جای spec مربوط به npm، فرادادهٔ منبع marketplace را پایدار نگه می‌دارند.

`--dangerously-force-unsafe-install` یک override اضطراری برای مثبت‌های کاذب
اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌ها و به‌روزرسانی‌های Plugin
از findings داخلی `critical` عبور کنند، اما همچنان بلوک‌های سیاست `before_install` مربوط به Plugin
یا بلوک ناشی از شکست اسکن را دور نمی‌زند.
اسکن‌های نصب، فایل‌ها و دایرکتوری‌های رایج آزمون مانند `tests/`،
`__tests__/`، `*.test.*`، و `*.spec.*` را نادیده می‌گیرند تا mockهای آزمون بسته‌بندی‌شده را مسدود نکنند؛
entrypointهای runtime اعلام‌شدهٔ Plugin همچنان اسکن می‌شوند، حتی اگر از یکی از
آن نام‌ها استفاده کنند.

این پرچم CLI فقط روی جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills
با پشتوانهٔ Gateway به‌جای آن از override درخواست متناظر `dangerouslyForceUnsafeInstall`
استفاده می‌کنند، در حالی که `openclaw skills install` همچنان جریان جداگانهٔ دانلود/نصب
Skill از ClawHub است.

اگر Pluginی که در ClawHub منتشر کرده‌اید توسط یک اسکن پنهان یا مسدود شده است، داشبورد
ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید
دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در دستگاه خودتان
اثر می‌گذارد؛ از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را
عمومی کند.

bundleهای سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin
شرکت می‌کنند. پشتیبانی runtime فعلی شامل Skills مربوط به bundle، command-skillهای Claude،
پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude و
`lspServers` اعلام‌شده در manifest، command-skillهای Cursor، و دایرکتوری‌های hook
سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های شناسایی‌شدهٔ bundle به‌علاوهٔ
ورودی‌های سرور MCP و LSP پشتیبانی‌شده یا پشتیبانی‌نشده برای Plugin‌های مبتنی بر bundle را گزارش می‌دهد.

منابع marketplace می‌توانند یک نام marketplace شناخته‌شدهٔ Claude از
`~/.claude/plugins/known_marketplaces.json`، یک ریشهٔ marketplace محلی یا
مسیر `marketplace.json`، یک shorthand مربوط به GitHub مانند `owner/repo`، یک URL مخزن GitHub،
یا یک URL مربوط به git باشند. برای marketplaceهای remote، ورودی‌های Plugin باید داخل
مخزن marketplace کلون‌شده بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API Plugin

Plugin‌های native یک entry object صادر می‌کنند که `register(api)` را در دسترس می‌گذارد. Plugin‌های قدیمی‌تر
ممکن است همچنان از `activate(api)` به‌عنوان alias قدیمی استفاده کنند، اما Plugin‌های جدید باید
از `register` استفاده کنند.

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

OpenClaw در زمان فعال‌سازی Plugin، entry object را بارگذاری می‌کند و `register(api)` را
فراخوانی می‌کند. loader همچنان برای Plugin‌های قدیمی‌تر به `activate(api)` برمی‌گردد،
اما Plugin‌های همراه و Plugin‌های خارجی جدید باید `register` را به‌عنوان
قرارداد عمومی در نظر بگیرند.

`api.registrationMode` به یک Plugin می‌گوید چرا entry آن در حال بارگذاری است:

| حالت | معنا |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | فعال‌سازی runtime. ابزارها، hookها، سرویس‌ها، فرمان‌ها، routeها، و دیگر عوارض جانبی live را ثبت کنید. |
| `discovery` | کشف قابلیت فقط‌خواندنی. ارائه‌دهندگان و فراداده را ثبت کنید؛ کد entry مربوط به Plugin مورد اعتماد ممکن است بارگذاری شود، اما عوارض جانبی live را رد کنید. |
| `setup-only` | بارگذاری فرادادهٔ راه‌اندازی Channel از طریق یک entry سبک راه‌اندازی. |
| `setup-runtime` | بارگذاری راه‌اندازی Channel که به entry runtime نیز نیاز دارد. |
| `cli-metadata` | فقط گردآوری فرادادهٔ فرمان CLI. |

entryهای Plugin که socket، پایگاه‌داده، workerهای پس‌زمینه، یا clientهای بلندعمر
باز می‌کنند باید آن عوارض جانبی را با `api.registrationMode === "full"` محافظت کنند.
بارگذاری‌های discovery جدا از بارگذاری‌های فعال‌سازی cache می‌شوند و
رجیستری Gateway در حال اجرا را جایگزین نمی‌کنند. discovery فعال‌کننده نیست، اما بدون import هم نیست:
OpenClaw ممکن است entry مورد اعتماد Plugin یا ماژول Plugin مربوط به channel را برای ساخت
snapshot ارزیابی کند. سطح بالای ماژول‌ها را سبک و بدون عوارض جانبی نگه دارید، و
clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و راه‌اندازی سرویس را
پشت مسیرهای full-runtime منتقل کنید.

روش‌های ثبت رایج:

| روش | آنچه ثبت می‌کند |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ارائه‌دهندهٔ مدل (LLM) |
| `registerChannel` | کانال گفتگو |
| `registerTool` | ابزار agent |
| `registerHook` / `on(...)` | hookهای چرخهٔ عمر |
| `registerSpeechProvider` | تبدیل متن به گفتار / STT |
| `registerRealtimeTranscriptionProvider` | STT جریانی |
| `registerRealtimeVoiceProvider` | صدای realtime دوطرفه |
| `registerMediaUnderstandingProvider` | تحلیل تصویر/صدا |
| `registerImageGenerationProvider` | تولید تصویر |
| `registerMusicGenerationProvider` | تولید موسیقی |
| `registerVideoGenerationProvider` | تولید ویدیو |
| `registerWebFetchProvider` | ارائه‌دهندهٔ دریافت / scrape وب |
| `registerWebSearchProvider` | جستجوی وب |
| `registerHttpRoute` | endpoint مربوط به HTTP |
| `registerCommand` / `registerCli` | فرمان‌های CLI |
| `registerContextEngine` | موتور context |
| `registerService` | سرویس پس‌زمینه |

رفتار guard مربوط به hookهای چرخهٔ عمر typed:

- `before_tool_call`: `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

app-server بومی Codex، رخدادهای ابزار بومی Codex را از طریق bridge دوباره به این
سطح hook برمی‌گرداند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call`
مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند، و در تأییدهای
`PermissionRequest` مربوط به Codex مشارکت داشته باشند. bridge هنوز آرگومان‌های ابزار بومی Codex
را بازنویسی نمی‌کند. مرز دقیق پشتیبانی runtime مربوط به Codex در
[قرارداد پشتیبانی v1 harness مربوط به Codex](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hookهای typed، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — Plugin خودتان را بسازید
- [bundleهای Plugin](/fa/plugins/bundles) — سازگاری bundleهای Codex/Claude/Cursor
- [manifest مربوط به Plugin](/fa/plugins/manifest) — schema مربوط به manifest
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) — افزودن ابزارهای agent در یک Plugin
- [جزئیات داخلی Plugin](/fa/plugins/architecture) — مدل قابلیت و pipeline بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) — فهرست‌های شخص ثالث
