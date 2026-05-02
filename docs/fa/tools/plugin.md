---
read_when:
    - نصب یا پیکربندی Plugin‌ها
    - آشنایی با کشف Plugin و قواعد بارگذاری
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Plugin‌های OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Pluginها
x-i18n:
    generated_at: "2026-05-02T21:01:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل، مهارهای عامل، ابزارها، Skills، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدیو، واکشی وب، جستجوی وب، و موارد بیشتر. برخی Pluginها **هسته‌ای** هستند (همراه با OpenClaw عرضه می‌شوند)، برخی دیگر **خارجی** هستند. بیشتر Pluginهای خارجی از طریق [ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. npm همچنان برای نصب‌های مستقیم و برای مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا پایان این مهاجرت پشتیبانی می‌شود.

## شروع سریع

برای نمونه‌های قابل کپی و جای‌گذاری نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی، و انتشار، [مدیریت Pluginها](/fa/plugins/manage-plugins) را ببینید.

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
    در یک Gateway در حال اجرا، `/plugins enable` و `/plugins disable` فقط برای مالک، بازبارگذار پیکربندی Gateway را فعال می‌کنند. Gateway سطوح زمان اجرای Plugin را در همان فرایند بازبارگذاری می‌کند، و نوبت‌های جدید عامل فهرست ابزارهای خود را از رجیستری تازه‌سازی‌شده دوباره می‌سازند. `/plugins install` کد منبع Plugin را تغییر می‌دهد، بنابراین Gateway به‌جای تظاهر به اینکه فرایند فعلی می‌تواند ماژول‌هایی را که قبلا import شده‌اند با ایمنی بازبارگذاری کند، درخواست راه‌اندازی مجدد می‌دهد.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    زمانی از `--runtime` استفاده کنید که باید ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway، hookها، یا فرمان‌های CLI متعلق به Plugin را اثبات کنید. `inspect` ساده یک بررسی سرد manifest/registry است و عمدا از import کردن زمان اجرای Plugin اجتناب می‌کند.

  </Step>
</Steps>

اگر کنترل بومی چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver استفاده می‌کند که CLI استفاده می‌کند: مسیر/آرشیو محلی، `clawhub:<pkg>` صریح، `npm:<pkg>` صریح، `git:<repo>` صریح، یا مشخصات بسته خام از طریق npm.

اگر پیکربندی نامعتبر باشد، نصب معمولا بسته و ایمن شکست می‌خورد و شما را به `openclaw doctor --fix` ارجاع می‌دهد. تنها استثنای بازیابی، یک مسیر محدود نصب مجدد Plugin همراه است برای Pluginهایی که `openclaw.install.allowInvalidConfigRecovery` را فعال می‌کنند.
در زمان راه‌اندازی Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود: راه‌اندازی مشکل `plugins.entries.<id>.config` را در لاگ ثبت می‌کند، آن Plugin را هنگام بارگذاری رد می‌کند، و سایر Pluginها و کانال‌ها را آنلاین نگه می‌دارد. `openclaw doctor --fix` را اجرا کنید تا پیکربندی بد Plugin با غیرفعال کردن آن ورودی Plugin و حذف payload پیکربندی نامعتبر آن قرنطینه شود؛ پشتیبان‌گیری عادی پیکربندی مقادیر قبلی را نگه می‌دارد.
وقتی یک پیکربندی کانال به Pluginی ارجاع می‌دهد که دیگر قابل کشف نیست اما همان شناسه قدیمی Plugin در پیکربندی Plugin یا رکوردهای نصب باقی مانده است، راه‌اندازی Gateway هشدارها را لاگ می‌کند و آن کانال را رد می‌کند، به‌جای اینکه همه کانال‌های دیگر را مسدود کند. `openclaw doctor --fix` را اجرا کنید تا ورودی‌های قدیمی کانال/Plugin حذف شوند؛ کلیدهای ناشناخته کانال بدون شواهد Plugin قدیمی همچنان در اعتبارسنجی شکست می‌خورند تا تایپوها قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های قدیمی Plugin بی‌اثر در نظر گرفته می‌شوند: راه‌اندازی Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor` پیکربندی Plugin غیرفعال را به‌جای حذف خودکار آن حفظ می‌کند. اگر می‌خواهید شناسه‌های قدیمی Plugin حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط در جریان‌های نصب/به‌روزرسانی صریح یا تعمیر doctor انجام می‌شود. راه‌اندازی Gateway، بازبارگذاری پیکربندی، و بازرسی زمان اجرا package managerها را اجرا نمی‌کنند یا درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای محلی باید از قبل وابستگی‌های خود را نصب کرده باشند، در حالی که Pluginهای npm، git، و ClawHub زیر ریشه‌های Plugin مدیریت‌شده OpenClaw نصب می‌شوند. وابستگی‌های npm ممکن است در ریشه npm مدیریت‌شده OpenClaw hoist شوند؛ نصب/به‌روزرسانی پیش از اعتماد آن ریشه مدیریت‌شده را اسکن می‌کند و حذف نصب بسته‌های مدیریت‌شده npm را از طریق npm حذف می‌کند. Pluginهای خارجی و مسیرهای بارگذاری سفارشی همچنان باید از طریق `openclaw plugins install` نصب شوند. از `openclaw plugins list --json` استفاده کنید تا `dependencyStatus` ایستا را برای هر Plugin قابل مشاهده بدون import کردن کد زمان اجرا یا تعمیر وابستگی‌ها ببینید.
برای چرخه عمر زمان نصب، [حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

Checkoutهای منبع، workspaceهای pnpm هستند. اگر OpenClaw را برای کار روی Pluginهای همراه clone می‌کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw Pluginهای همراه را از `extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و وابستگی‌های محلی بسته مستقیما استفاده شوند. نصب‌های ریشه npm ساده برای OpenClaw بسته‌بندی‌شده هستند، نه توسعه checkout منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را تشخیص می‌دهد:

| قالب | نحوه کار | نمونه‌ها |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **بومی** | `openclaw.plugin.json` + ماژول زمان اجرا؛ درون فرایند اجرا می‌شود | Pluginهای رسمی، بسته‌های npm جامعه |
| **Bundle** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle، [Plugin Bundles](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin بومی هستید، از [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## Entry pointهای بسته

بسته‌های npm Plugin بومی باید `openclaw.extensions` را در `package.json` اعلام کنند. هر entry باید داخل دایرکتوری بسته بماند و به یک فایل زمان اجرای قابل خواندن resolve شود، یا به یک فایل منبع TypeScript با peer جاوااسکریپت ساخته‌شده استنباطی، مانند `src/index.ts` به `dist/index.js`.

وقتی فایل‌های زمان اجرای منتشرشده در همان مسیرهای entryهای منبع قرار ندارند، از `openclaw.runtimeExtensions` استفاده کنید. وقتی وجود داشته باشد، `runtimeExtensions` باید دقیقا برای هر entry در `extensions` یک entry داشته باشد. فهرست‌های ناسازگار باعث شکست نصب و کشف Plugin می‌شوند، نه اینکه بی‌صدا به مسیرهای منبع fallback کنند. اگر `openclaw.setupEntry` را هم منتشر می‌کنید، از `openclaw.runtimeSetupEntry` برای peer جاوااسکریپت ساخته‌شده آن استفاده کنید؛ آن فایل هنگام اعلام‌شدن الزامی است.

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

ClawHub مسیر اصلی توزیع برای بیشتر Pluginها است. انتشارهای بسته‌بندی‌شده فعلی OpenClaw از قبل بسیاری از Pluginهای رسمی را bundle می‌کنند، بنابراین در راه‌اندازی‌های معمول نیازی به نصب‌های جداگانه npm ندارند. تا زمانی که هر Plugin متعلق به OpenClaw به ClawHub مهاجرت کند، OpenClaw همچنان برخی بسته‌های Plugin با الگوی `@openclaw/*` را برای نصب‌های قدیمی‌تر/سفارشی و workflowهای مستقیم npm روی npm عرضه می‌کند.

اگر npm یک بسته Plugin با الگوی `@openclaw/*` را deprecated گزارش کرد، آن نسخه بسته از یک train قدیمی‌تر بسته خارجی است. تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه در OpenClaw فعلی یا یک checkout محلی استفاده کنید.

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

### هسته‌ای (همراه با OpenClaw عرضه می‌شود)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — جستجوی حافظه همراه (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` — حافظه بلندمدت مبتنی بر LanceDB با recall/capture خودکار (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های recall، و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — Plugin مرورگر همراه برای ابزار مرورگر، CLI `openclaw browser`، متد Gateway `browser.request`، زمان اجرای مرورگر، و سرویس کنترل مرورگر پیش‌فرض (به‌صورت پیش‌فرض فعال است؛ پیش از جایگزینی آن را غیرفعال کنید)
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

| فیلد | توضیح |
| ---------------- | --------------------------------------------------------- |
| `enabled` | کلید اصلی فعال/غیرفعال (پیش‌فرض: `true`) |
| `allow` | allowlist Plugin (اختیاری) |
| `deny` | denylist Plugin (اختیاری؛ deny برنده است) |
| `load.paths` | فایل‌ها/دایرکتوری‌های Plugin اضافی |
| `slots` | selectorهای slot انحصاری (مثلا `memory`، `contextEngine`) |
| `entries.\<id\>` | toggleها + پیکربندی مخصوص هر Plugin |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Pluginهای فهرست‌شده می‌توانند بارگذاری شوند یا ابزارها را در معرض استفاده قرار دهند، حتی اگر `tools.allow` شامل `"*"` یا نام ابزار مشخصی متعلق به Plugin باشد. اگر یک allowlist ابزار به ابزارهای Plugin ارجاع می‌دهد، شناسه‌های Plugin مالک را به `plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` درباره این شکل هشدار می‌دهد.

تغییرات پیکربندی که از طریق `/plugins enable` یا `/plugins disable` انجام می‌شوند، یک بارگذاری مجدد Plugin درون‌پردازشی در Gateway را راه‌اندازی می‌کنند. نوبت‌های جدید عامل، فهرست ابزارهای خود را از رجیستری Plugin تازه‌سازی‌شده دوباره می‌سازند. عملیات‌هایی که منبع را تغییر می‌دهند، مانند نصب، به‌روزرسانی و حذف نصب، همچنان فرایند Gateway را دوباره راه‌اندازی می‌کنند، زیرا ماژول‌های Plugin که قبلا import شده‌اند را نمی‌توان به‌صورت ایمن درجا جایگزین کرد.

`openclaw plugins list` یک عکس فوری محلی از رجیستری/پیکربندی Plugin است. یک Plugin با وضعیت `enabled` در آنجا یعنی رجیستری پایدارشده و پیکربندی فعلی اجازه می‌دهند Plugin مشارکت کند. این ثابت نمی‌کند که یک Gateway راه دور که از قبل در حال اجراست، با همان کد Plugin دوباره بارگذاری یا دوباره راه‌اندازی شده باشد. در راه‌اندازی‌های VPS/کانتینر با فرایندهای wrapper، راه‌اندازی‌های مجدد یا نوشتن‌هایی که بارگذاری مجدد را تحریک می‌کنند به فرایند واقعی `openclaw gateway run` ارسال کنید، یا وقتی بارگذاری مجدد خطا گزارش می‌کند، از `openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="حالت‌های Plugin: غیرفعال در برابر مفقود در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به یک شناسه Plugin ارجاع می‌دهد که discovery آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده مطابقت ندارد. راه‌اندازی Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر را با غیرفعال کردن آن و حذف payload پیکربندی‌اش قرنطینه کند.

</Accordion>

## Discovery و تقدم

OpenClaw برای Pluginها به این ترتیب اسکن می‌کند (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` — مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که به دایرکتوری‌های Plugin بسته‌بندی‌شده خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛
    برای حذف آن aliasهای قدیمی، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال هستند (providerهای مدل، گفتار).
    برخی دیگر به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولا Pluginهای همراه را از درخت کامپایل‌شده `dist/extensions` resolve می‌کنند. اگر یک دایرکتوری منبع Plugin همراه روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount شود، برای مثال `/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mount‌شده را به‌عنوان یک overlay منبع همراه در نظر می‌گیرد و پیش از bundle بسته‌بندی‌شده `/app/dist/extensions/synology-chat` آن را discover می‌کند. این کار loopهای کانتینری maintainer را بدون برگرداندن هر Plugin همراه به منبع TypeScript فعال نگه می‌دارد. برای اجبار به استفاده از bundleهای dist بسته‌بندی‌شده حتی وقتی mountهای overlay منبع وجود دارند، `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همه Pluginها را غیرفعال می‌کند و کار discovery/load Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow مقدم است
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهایی با مبدا workspace به‌صورت **پیش‌فرض غیرفعال‌اند** (باید صراحتا فعال شوند)
- Pluginهای همراه، مگر اینکه override شوند، از مجموعه داخلی پیش‌فرض روشن پیروی می‌کنند
- slotهای انحصاری می‌توانند Plugin انتخاب‌شده برای آن slot را اجباری فعال کنند
- برخی Pluginهای opt-in همراه، وقتی پیکربندی نام یک سطح متعلق به Plugin را مشخص کند، به‌صورت خودکار فعال می‌شوند، مانند یک provider model ref، پیکربندی channel، یا runtime harness
- پیکربندی قدیمی Plugin تا زمانی که `plugins.enabled: false` فعال است حفظ می‌شود؛ اگر می‌خواهید شناسه‌های قدیمی حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای Codex از خانواده OpenAI مرزهای Plugin جداگانه را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin OpenAI است، در حالی که Plugin app-server همراه Codex با `agentRuntime.id: "codex"` یا model refهای قدیمی `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` ظاهر می‌شود اما اثرات جانبی یا hookهای `register(api)` در ترافیک live chat اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تایید کنید URL فعال Gateway، profile، مسیر پیکربندی و فرایند همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را دوباره راه‌اندازی کنید. در کانتینرهای wrapper، PID 1 ممکن است فقط یک supervisor باشد؛ فرایند فرزند `openclaw gateway run` را دوباره راه‌اندازی یا signal کنید.
- برای تایید ثبت hookها و diagnostics از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. hookهای گفت‌وگوی غیرهمراه مانند `llm_input`، `llm_output`، `before_agent_finalize` و `agent_end` به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تغییر مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از resolve شدن مدل برای نوبت‌های عامل اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل خروجی assistant تولید کند.
- برای اثبات مدل موثر session، از `openclaw sessions` یا سطح‌های session/status در Gateway استفاده کنید و هنگام debug کردن payloadهای provider، Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### کندی آماده‌سازی ابزار Plugin

اگر به نظر می‌رسد نوبت‌های عامل هنگام آماده‌سازی ابزارها متوقف می‌شوند، trace logging را فعال کنید و خطوط timing مربوط به factory ابزار Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند، از جمله شناسه Plugin، نام‌های اعلام‌شده ابزار، شکل نتیجه، و اینکه ابزار optional است یا نه. وقتی یک factory حداقل 1s طول بکشد یا کل آماده‌سازی factory ابزار Plugin حداقل 5s طول بکشد، خطوط کند به warning ارتقا داده می‌شوند.

OpenClaw نتایج موفق factory ابزار Plugin را برای resolutionهای تکراری با همان context درخواست موثر cache می‌کند. کلید cache شامل پیکربندی موثر runtime، workspace، شناسه‌های agent/session، سیاست sandbox، تنظیمات مرورگر، context تحویل، هویت requester و وضعیت ownership است، بنابراین factoryهایی که به آن فیلدهای مورد اعتماد وابسته‌اند، وقتی context تغییر کند دوباره اجرا می‌شوند.

اگر یک Plugin بر timing غالب است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید بارگذاری وابستگی‌های پرهزینه را به پشت مسیر اجرای ابزار منتقل کنند، نه اینکه آن را داخل factory ابزار انجام دهند.

### مالکیت تکراری channel یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان channel، جریان setup، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin channel خارجی کنار یک Plugin همراه است که اکنون همان شناسه channel را فراهم می‌کند.

مراحل debug:

- برای دیدن هر Plugin فعال و مبدا آن، `openclaw plugins list --enabled --verbose` را اجرا کنید.
- برای هر Plugin مشکوک، `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و `channels`، `channelConfigs`، `tools` و diagnostics را مقایسه کنید.
- پس از نصب یا حذف packageهای Plugin، `openclaw plugins registry --refresh` را اجرا کنید تا metadata پایدارشده نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، رجیستری یا پیکربندی، Gateway را دوباره راه‌اندازی کنید.

گزینه‌های رفع:

- اگر یک Plugin عمدا جایگزین دیگری برای همان شناسه channel می‌شود، Plugin ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسه Plugin با اولویت پایین‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکراری بودن تصادفی است، یک طرف را با `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin قدیمی را حذف کنید.
- اگر هر دو Plugin را صراحتا فعال کرده‌اید، OpenClaw آن درخواست را حفظ می‌کند و conflict را گزارش می‌دهد. یک مالک برای channel انتخاب کنید یا ابزارهای متعلق به Plugin را تغییر نام دهید تا سطح runtime بدون ابهام باشد.

## Slotهای Plugin (دسته‌های انحصاری)

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

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال هستند (برای مثال providerهای مدل همراه، providerهای گفتار همراه، و Plugin مرورگر همراه). سایر Pluginهای همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا hook pack موجود را درجا overwrite می‌کند. برای ارتقاهای معمول Pluginهای npm ردیابی‌شده، از `openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، زیرا `--link` به‌جای کپی کردن روی یک هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin نصب‌شده را پیش از فعال کردن آن به آن allowlist اضافه می‌کند. اگر همان شناسه Plugin در `plugins.deny` وجود داشته باشد، install آن ورودی deny قدیمی را حذف می‌کند تا نصب صریح بلافاصله پس از restart قابل load باشد.

OpenClaw یک رجیستری محلی پایدار Plugin را به‌عنوان مدل خواندنی سرد برای
موجودی Pluginها، مالکیت مشارکت، و برنامه‌ریزی راه‌اندازی نگه می‌دارد. جریان‌های نصب، به‌روزرسانی،
حذف نصب، فعال‌سازی، و غیرفعال‌سازی پس از تغییر وضعیت Plugin،
آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فراداده نصب پایدار را در
`installRecords` سطح بالا و فراداده مانیفست قابل بازسازی را در `plugins` نگه می‌دارد. اگر
رجیستری وجود نداشته باشد، قدیمی باشد، یا نامعتبر باشد، `openclaw plugins registry
--refresh` نمای مانیفست آن را از رکوردهای نصب، سیاست پیکربندی، و
فراداده مانیفست/بسته بازسازی می‌کند، بدون اینکه ماژول‌های زمان اجرای Plugin را بارگذاری کند.
`openclaw plugins update <id-or-npm-spec>` روی نصب‌های ردیابی‌شده اعمال می‌شود. ارسال
یک مشخصه بسته npm با یک dist-tag یا نسخه دقیق، نام بسته را
به رکورد Plugin ردیابی‌شده بازحل می‌کند و مشخصه جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند.
ارسال نام بسته بدون نسخه، یک نصب پین‌شده دقیق را به
خط انتشار پیش‌فرض رجیستری برمی‌گرداند. اگر Plugin نصب‌شده npm از قبل با
نسخه بازحل‌شده و هویت آرتیفکت ثبت‌شده مطابقت داشته باشد، OpenClaw به‌روزرسانی را
بدون دانلود، نصب مجدد، یا بازنویسی پیکربندی رد می‌کند.
وقتی `openclaw update` روی کانال بتا اجرا می‌شود، رکوردهای npm و ClawHub
در خط پیش‌فرض Plugin ابتدا `@beta` را امتحان می‌کنند و وقتی هیچ انتشار بتای Plugin
وجود نداشته باشد به پیش‌فرض/latest برمی‌گردند. نسخه‌های دقیق و تگ‌های صریح پین‌شده باقی می‌مانند.

`--pin` فقط مخصوص npm است. با `--marketplace` پشتیبانی نمی‌شود، چون
نصب‌های marketplace به‌جای یک مشخصه npm، فراداده منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک بازنویسی اضطراری برای مثبت‌های کاذب
از اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌های Plugin
و به‌روزرسانی‌های Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان
مسدودسازی‌های سیاستی `before_install` خود Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند.
اسکن‌های نصب، فایل‌ها و دایرکتوری‌های رایج تست مانند `tests/`,
`__tests__/`, `*.test.*`, و `*.spec.*` را نادیده می‌گیرند تا mockهای تست بسته‌بندی‌شده
مسدود نشوند؛ entrypointهای زمان اجرای اعلام‌شده Plugin همچنان اسکن می‌شوند، حتی اگر از یکی از
آن نام‌ها استفاده کنند.

این پرچم CLI فقط روی جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills
پشتیبانی‌شده توسط Gateway به‌جای آن از بازنویسی درخواست متناظر `dangerouslyForceUnsafeInstall`
استفاده می‌کنند، درحالی‌که `openclaw skills install` جریان جداگانه دانلود/نصب Skill از ClawHub
باقی می‌ماند.

اگر Pluginای که در ClawHub منتشر کرده‌اید توسط اسکن پنهان یا مسدود شده است، داشبورد
ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید
دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط نصب‌ها را روی دستگاه خودتان
تحت تأثیر قرار می‌دهد؛ از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را
عمومی کند.

باندل‌های سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin شرکت می‌کنند.
پشتیبانی فعلی زمان اجرا شامل bundle skills، command-skills کلود،
پیش‌فرض‌های `settings.json` کلود، پیش‌فرض‌های `.lsp.json` کلود و
`lspServers` اعلام‌شده در مانیفست، command-skills کرسر، و دایرکتوری‌های hook
سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های شناسایی‌شده باندل به‌علاوه
ورودی‌های پشتیبانی‌شده یا پشتیبانی‌نشده سرور MCP و LSP را برای Pluginهای پشتیبانی‌شده توسط باندل گزارش می‌کند.

منابع Marketplace می‌توانند یک نام known-marketplace کلود از
`~/.claude/plugins/known_marketplaces.json`، یک ریشه marketplace محلی یا
مسیر `marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL مخزن گیت‌هاب،
یا یک URL گیت باشند. برای marketplaceهای راه‌دور، ورودی‌های Plugin باید داخل
مخزن marketplace کلون‌شده بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API Plugin

Pluginهای بومی یک شیء ورودی صادر می‌کنند که `register(api)` را ارائه می‌کند. Pluginهای قدیمی‌تر
ممکن است هنوز از `activate(api)` به‌عنوان نام مستعار legacy استفاده کنند، اما Pluginهای جدید باید
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

OpenClaw شیء ورودی را بارگذاری می‌کند و هنگام فعال‌سازی Plugin،
`register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` fallback می‌کند،
اما Pluginهای باندل‌شده و Pluginهای خارجی جدید باید `register` را
قرارداد عمومی بدانند.

`api.registrationMode` به Plugin می‌گوید چرا ورودی آن در حال بارگذاری است:

| حالت            | معنا                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | فعال‌سازی زمان اجرا. ابزارها، hookها، سرویس‌ها، فرمان‌ها، routeها، و سایر side effectهای زنده را ثبت کنید.                              |
| `discovery`     | کشف قابلیت فقط‌خواندنی. providerها و فراداده را ثبت کنید؛ کد ورودی Plugin مورد اعتماد ممکن است بارگذاری شود، اما side effectهای زنده را رد کنید. |
| `setup-only`    | بارگذاری فراداده راه‌اندازی کانال از طریق یک ورودی راه‌اندازی سبک.                                                                |
| `setup-runtime` | بارگذاری راه‌اندازی کانال که به ورودی زمان اجرا هم نیاز دارد.                                                                         |
| `cli-metadata`  | فقط گردآوری فراداده فرمان CLI.                                                                                            |

ورودی‌های Plugin که socketها، پایگاه‌های داده، workerهای پس‌زمینه، یا clientهای بلندعمر
باز می‌کنند باید آن side effectها را با `api.registrationMode === "full"` محافظت کنند.
بارگذاری‌های کشف جدا از بارگذاری‌های فعال‌سازی cache می‌شوند و
جایگزین رجیستری در حال اجرای Gateway نمی‌شوند. کشف غیر‌فعال‌کننده است، نه بدون import:
OpenClaw ممکن است ورودی مورد اعتماد Plugin یا ماژول Plugin کانال را ارزیابی کند تا
snapshot را بسازد. سطح بالای ماژول‌ها را سبک و بدون side effect نگه دارید، و
clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و راه‌اندازی سرویس را
پشت مسیرهای full-runtime منتقل کنید.

روش‌های ثبت رایج:

| روش                                  | چه چیزی را ثبت می‌کند           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | provider مدل (LLM)        |
| `registerChannel`                       | کانال چت                |
| `registerTool`                          | ابزار agent                  |
| `registerHook` / `on(...)`              | hookهای چرخه عمر             |
| `registerSpeechProvider`                | تبدیل متن به گفتار / STT        |
| `registerRealtimeTranscriptionProvider` | STT استریمینگ               |
| `registerRealtimeVoiceProvider`         | صدای realtime دوطرفه       |
| `registerMediaUnderstandingProvider`    | تحلیل تصویر/صدا        |
| `registerImageGenerationProvider`       | تولید تصویر            |
| `registerMusicGenerationProvider`       | تولید موسیقی            |
| `registerVideoGenerationProvider`       | تولید ویدئو            |
| `registerWebFetchProvider`              | provider دریافت وب / scrape |
| `registerWebSearchProvider`             | جست‌وجوی وب                  |
| `registerHttpRoute`                     | endpoint HTTP               |
| `registerCommand` / `registerCli`       | فرمان‌های CLI                |
| `registerContextEngine`                 | موتور context              |
| `registerService`                       | سرویس پس‌زمینه          |

رفتار guard hook برای hookهای چرخه عمر typed:

- `before_tool_call`: `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: `{ block: false }` بدون اثر است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: `{ block: false }` بدون اثر است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: `{ cancel: false }` بدون اثر است و cancel قبلی را پاک نمی‌کند.

app-server بومی Codex رویدادهای ابزار بومی Codex را به این
سطح hook bridge می‌کند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند،
نتایج را از طریق `after_tool_call` مشاهده کنند، و در تأییدهای
`PermissionRequest` Codex شرکت کنند. bridge هنوز آرگومان‌های ابزار بومی Codex را
بازنویسی نمی‌کند. مرز دقیق پشتیبانی زمان اجرای Codex در
[قرارداد پشتیبانی v1 harness Codex](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hook typed، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — Plugin خودتان را بسازید
- [باندل‌های Plugin](/fa/plugins/bundles) — سازگاری باندل Codex/Claude/Cursor
- [مانیفست Plugin](/fa/plugins/manifest) — schema مانیفست
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) — ابزارهای agent را در یک Plugin اضافه کنید
- [جزئیات داخلی Plugin](/fa/plugins/architecture) — مدل قابلیت و pipeline بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) — فهرست‌های شخص ثالث
