---
read_when:
    - برای openclaw onboard به رفتار دقیق نیاز دارید
    - در حال اشکال‌زدایی نتایج راه‌اندازی اولیه یا یکپارچه‌سازی کلاینت‌های راه‌اندازی اولیه هستید
sidebarTitle: CLI reference
summary: مرجع کامل برای روند راه‌اندازی CLI، راه‌اندازی احراز هویت/مدل، خروجی‌ها و سازوکارهای داخلی
title: مرجع راه‌اندازی CLI
x-i18n:
    generated_at: "2026-05-10T20:08:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

این صفحه مرجع کامل برای `openclaw onboard` است.
برای راهنمای کوتاه، [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

## ویزارد چه کاری انجام می‌دهد

حالت محلی (پیش‌فرض) شما را از این مراحل عبور می‌دهد:

- راه‌اندازی مدل و احراز هویت (OAuth اشتراک OpenAI Code، CLI یا کلید API برای Anthropic Claude، به‌همراه گزینه‌های MiniMax، GLM، Ollama، Moonshot، StepFun و AI Gateway)
- مکان فضای کاری و فایل‌های راه‌اندازی اولیه
- تنظیمات Gateway (پورت، bind، احراز هویت، tailscale)
- کانال‌ها و ارائه‌دهندگان (Telegram، WhatsApp، Discord، Google Chat، Mattermost، Signal، iMessage و سایر Pluginهای کانال همراه)
- نصب daemon (LaunchAgent، واحد کاربر systemd، یا Windows Scheduled Task بومی با fallback پوشه Startup)
- بررسی سلامت
- راه‌اندازی Skills

حالت راه‌دور این ماشین را برای اتصال به یک gateway در جای دیگر پیکربندی می‌کند.
این حالت چیزی را روی میزبان راه‌دور نصب یا تغییر نمی‌دهد.

## جزئیات جریان محلی

<Steps>
  <Step title="تشخیص پیکربندی موجود">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، Keep، Modify یا Reset را انتخاب کنید.
    - اجرای دوباره ویزارد چیزی را پاک نمی‌کند، مگر اینکه صریحا Reset را انتخاب کنید (یا `--reset` را پاس بدهید).
    - CLI `--reset` به‌طور پیش‌فرض `config+creds+sessions` است؛ برای حذف فضای کاری نیز از `--reset-scope full` استفاده کنید.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، ویزارد متوقف می‌شود و از شما می‌خواهد پیش از ادامه `openclaw doctor` را اجرا کنید.
    - Reset از `trash` استفاده می‌کند و این محدوده‌ها را پیشنهاد می‌دهد:
      - فقط پیکربندی
      - پیکربندی + اعتبارنامه‌ها + نشست‌ها
      - بازنشانی کامل (فضای کاری را هم حذف می‌کند)

  </Step>
  <Step title="مدل و احراز هویت">
    - ماتریس کامل گزینه‌ها در [گزینه‌های احراز هویت و مدل](#auth-and-model-options) آمده است.

  </Step>
  <Step title="فضای کاری">
    - پیش‌فرض `~/.openclaw/workspace` (قابل پیکربندی).
    - فایل‌های فضای کاری لازم برای آیین راه‌اندازی اولیه نخستین اجرا را seed می‌کند.
    - چیدمان فضای کاری: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - پورت، bind، حالت احراز هویت و در معرض قرار دادن tailscale را می‌پرسد.
    - توصیه‌شده: حتی برای loopback احراز هویت توکنی را فعال نگه دارید تا کلاینت‌های WS محلی هم مجبور به احراز هویت باشند.
    - در حالت توکن، راه‌اندازی تعاملی این گزینه‌ها را ارائه می‌دهد:
      - **تولید/ذخیره توکن متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (اختیاری)
    - در حالت رمز عبور، راه‌اندازی تعاملی از ذخیره‌سازی متن ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک متغیر محیطی غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
      - نمی‌تواند با `--gateway-token` ترکیب شود.
    - احراز هویت را فقط زمانی غیرفعال کنید که به همه فرایندهای محلی کاملا اعتماد دارید.
    - bindهای غیر loopback همچنان به احراز هویت نیاز دارند.

  </Step>
  <Step title="کانال‌ها">
    - [WhatsApp](/fa/channels/whatsapp): ورود QR اختیاری
    - [Telegram](/fa/channels/telegram): توکن بات
    - [Discord](/fa/channels/discord): توکن بات
    - [Google Chat](/fa/channels/googlechat): JSON حساب سرویس + مخاطب webhook
    - [Mattermost](/fa/channels/mattermost): توکن بات + URL پایه
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب
    - [iMessage](/fa/channels/imessage): مسیر CLI `imsg` + دسترسی به DB پیام‌ها؛ وقتی Gateway خارج از Mac اجرا می‌شود از یک wrapper برای SSH استفاده کنید
    - امنیت DM: پیش‌فرض pairing است. نخستین DM یک کد می‌فرستد؛ با
      `openclaw pairing approve <channel> <code>` تأیید کنید یا از allowlistها استفاده کنید.
  </Step>
  <Step title="نصب daemon">
    - macOS: LaunchAgent
      - به نشست کاربر واردشده نیاز دارد؛ برای حالت headless، از LaunchDaemon سفارشی استفاده کنید (همراه محصول ارائه نمی‌شود).
    - Linux و Windows از طریق WSL2: واحد کاربر systemd
      - ویزارد تلاش می‌کند `loginctl enable-linger <user>` را اجرا کند تا gateway پس از خروج کاربر هم فعال بماند.
      - ممکن است sudo بخواهد (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - Windows بومی: ابتدا Scheduled Task
      - اگر ایجاد task رد شود، OpenClaw به یک آیتم ورود پوشه Startup برای هر کاربر fallback می‌کند و gateway را بلافاصله شروع می‌کند.
      - Scheduled Taskها همچنان ترجیح داده می‌شوند، چون وضعیت supervisor بهتری ارائه می‌دهند.
    - انتخاب runtime: Node (توصیه‌شده؛ برای WhatsApp و Telegram لازم است). Bun توصیه نمی‌شود.

  </Step>
  <Step title="بررسی سلامت">
    - gateway را شروع می‌کند (در صورت نیاز) و `openclaw health` را اجرا می‌کند.
    - `openclaw status --deep` probe سلامت gateway زنده را به خروجی وضعیت اضافه می‌کند، شامل probeهای کانال وقتی پشتیبانی شوند.

  </Step>
  <Step title="Skills">
    - Skills موجود را می‌خواند و نیازمندی‌ها را بررسی می‌کند.
    - اجازه می‌دهد مدیر node را انتخاب کنید: npm، pnpm یا bun.
    - وابستگی‌های اختیاری را نصب می‌کند (برخی در macOS از Homebrew استفاده می‌کنند).

  </Step>
  <Step title="پایان">
    - خلاصه و گام‌های بعدی، شامل گزینه‌های اپ iOS، Android و macOS.

  </Step>
</Steps>

<Note>
اگر هیچ GUI تشخیص داده نشود، ویزارد به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward را برای Control UI چاپ می‌کند.
اگر assetهای Control UI موجود نباشند، ویزارد تلاش می‌کند آن‌ها را بسازد؛ fallback برابر `pnpm ui:build` است (وابستگی‌های UI را خودکار نصب می‌کند).
</Note>

## جزئیات حالت راه‌دور

حالت راه‌دور این ماشین را برای اتصال به یک gateway در جای دیگر پیکربندی می‌کند.

<Info>
حالت راه‌دور چیزی را روی میزبان راه‌دور نصب یا تغییر نمی‌دهد.
</Info>

چیزهایی که تنظیم می‌کنید:

- URL مربوط به gateway راه‌دور (`ws://...`)
- توکن، اگر احراز هویت gateway راه‌دور لازم باشد (توصیه‌شده)

<Note>
- اگر gateway فقط loopback باشد، از تونل‌سازی SSH یا یک tailnet استفاده کنید.
- راهنمایی‌های discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## گزینه‌های احراز هویت و مدل

<AccordionGroup>
  <Accordion title="کلید API برای Anthropic">
    اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند یا یک کلید می‌پرسد، سپس آن را برای استفاده daemon ذخیره می‌کند.
  </Accordion>
  <Accordion title="اشتراک OpenAI Code (OAuth)">
    جریان مرورگر؛ `code#state` را paste کنید.

    وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime مربوط به Codex روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="اشتراک OpenAI Code (pairing دستگاه)">
    جریان pairing مرورگر با یک کد دستگاه کوتاه‌عمر.

    وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime مربوط به Codex روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="کلید API برای OpenAI">
    اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند یا یک کلید می‌پرسد، سپس اعتبارنامه را در پروفایل‌های احراز هویت ذخیره می‌کند.

    وقتی مدل تنظیم نشده باشد، یا `openai/*` یا `openai-codex/*` باشد، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="کلید API برای xAI (Grok)">
    `XAI_API_KEY` را می‌پرسد و xAI را به‌عنوان ارائه‌دهنده مدل پیکربندی می‌کند.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را می‌پرسد و اجازه می‌دهد کاتالوگ Zen یا Go را انتخاب کنید.
    URL راه‌اندازی: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="کلید API (عمومی)">
    کلید را برای شما ذخیره می‌کند.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` را می‌پرسد.
    جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    شناسه حساب، شناسه gateway و `CLOUDFLARE_AI_GATEWAY_API_KEY` را می‌پرسد.
    جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    پیکربندی به‌صورت خودکار نوشته می‌شود. پیش‌فرض میزبانی‌شده `MiniMax-M2.7` است؛ راه‌اندازی با کلید API از
    `minimax/...` استفاده می‌کند و راه‌اندازی OAuth از `minimax-portal/...`.
    جزئیات بیشتر: [MiniMax](/fa/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    پیکربندی برای StepFun استاندارد یا Step Plan روی endpointهای چین یا جهانی به‌صورت خودکار نوشته می‌شود.
    استاندارد در حال حاضر شامل `step-3.5-flash` است، و Step Plan همچنین شامل `step-3.5-flash-2603` می‌شود.
    جزئیات بیشتر: [StepFun](/fa/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (سازگار با Anthropic)">
    `SYNTHETIC_API_KEY` را می‌پرسد.
    جزئیات بیشتر: [Synthetic](/fa/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (مدل‌های open ابری و محلی)">
    ابتدا `Cloud + Local`، `Cloud only` یا `Local only` را می‌پرسد.
    `Cloud only` از `OLLAMA_API_KEY` با `https://ollama.com` استفاده می‌کند.
    حالت‌های متکی به میزبان URL پایه را می‌پرسند (پیش‌فرض `http://127.0.0.1:11434`)، مدل‌های موجود را کشف می‌کنند و پیش‌فرض‌ها را پیشنهاد می‌دهند.
    `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی ابری وارد شده است یا نه.
    جزئیات بیشتر: [Ollama](/fa/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot و Kimi Coding">
    پیکربندی‌های Moonshot (Kimi K2) و Kimi Coding به‌صورت خودکار نوشته می‌شوند.
    جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot).
  </Accordion>
  <Accordion title="ارائه‌دهنده سفارشی">
    با endpointهای سازگار با OpenAI و سازگار با Anthropic کار می‌کند.

    راه‌اندازی اولیه تعاملی از همان گزینه‌های ذخیره‌سازی کلید API پشتیبانی می‌کند که جریان‌های کلید API سایر ارائه‌دهندگان دارند:
    - **اکنون کلید API را paste کنید** (متن ساده)
    - **استفاده از secret reference** (ارجاع env یا ارجاع ارائه‌دهنده پیکربندی‌شده، با اعتبارسنجی preflight)

    فلگ‌های غیرتعاملی:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختیاری؛ به `CUSTOM_API_KEY` fallback می‌کند)
    - `--custom-provider-id` (اختیاری)
    - `--custom-compatibility <openai|anthropic>` (اختیاری؛ پیش‌فرض `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختیاری؛ قابلیت ورودی مدل استنباط‌شده را override می‌کند)

  </Accordion>
  <Accordion title="رد کردن">
    احراز هویت را پیکربندی‌نشده باقی می‌گذارد.
  </Accordion>
</AccordionGroup>

رفتار مدل:

- مدل پیش‌فرض را از گزینه‌های تشخیص‌داده‌شده انتخاب کنید، یا ارائه‌دهنده و مدل را دستی وارد کنید.
- راه‌اندازی اولیه ارائه‌دهنده سفارشی، پشتیبانی تصویر را برای شناسه‌های رایج مدل استنباط می‌کند و فقط وقتی نام مدل ناشناخته باشد سؤال می‌پرسد.
- وقتی راه‌اندازی اولیه از یک گزینه احراز هویت ارائه‌دهنده شروع شود، انتخاب‌گر مدل به‌طور خودکار
  همان ارائه‌دهنده را ترجیح می‌دهد. برای Volcengine و BytePlus، همان ترجیح
  variantهای coding-plan آن‌ها (`volcengine-plan/*`،
  `byteplus-plan/*`) را نیز match می‌کند.
- اگر آن فیلتر ارائه‌دهنده ترجیحی خالی باشد، انتخاب‌گر به‌جای نمایش ندادن هیچ مدلی، به
  کاتالوگ کامل fallback می‌کند.
- ویزارد یک بررسی مدل اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا احراز هویت نداشته باشد، هشدار می‌دهد.

مسیرهای اعتبارنامه و پروفایل:

- پروفایل‌های احراز هویت (کلیدهای API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ورود OAuth قدیمی: `~/.openclaw/credentials/oauth.json`

حالت ذخیره‌سازی اعتبارنامه:

- رفتار پیش‌فرض راه‌اندازی اولیه، کلیدهای API را به‌عنوان مقدارهای متن ساده در پروفایل‌های احراز هویت نگه می‌دارد.
- `--secret-input-mode ref` به‌جای ذخیره‌سازی کلید متن ساده، حالت ارجاع را فعال می‌کند.
  در راه‌اندازی تعاملی، می‌توانید یکی از این‌ها را انتخاب کنید:
  - ارجاع متغیر محیطی (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ارجاع ارائه‌دهنده پیکربندی‌شده (`file` یا `exec`) با alias ارائه‌دهنده + id
- حالت ارجاع تعاملی پیش از ذخیره، یک اعتبارسنجی preflight سریع اجرا می‌کند.
  - ارجاع‌های Env: نام متغیر + مقدار غیرخالی در محیط فعلی راه‌اندازی اولیه را اعتبارسنجی می‌کند.
  - ارجاع‌های ارائه‌دهنده: پیکربندی ارائه‌دهنده را اعتبارسنجی می‌کند و id درخواستی را resolve می‌کند.
  - اگر preflight شکست بخورد، راه‌اندازی اولیه خطا را نشان می‌دهد و اجازه تلاش دوباره می‌دهد.
- در حالت غیرتعاملی، `--secret-input-mode ref` فقط با env پشتیبانی می‌شود.
  - متغیر env ارائه‌دهنده را در محیط فرایند راه‌اندازی اولیه تنظیم کنید.
  - فلگ‌های کلید inline (برای مثال `--openai-api-key`) نیاز دارند آن متغیر env تنظیم شده باشد؛ در غیر این صورت راه‌اندازی اولیه سریع شکست می‌خورد.
  - برای ارائه‌دهندگان سفارشی، حالت غیرتعاملی `ref` مقدار `models.providers.<id>.apiKey` را به‌صورت `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` ذخیره می‌کند.
  - در آن مورد ارائه‌دهنده سفارشی، `--custom-api-key` نیاز دارد `CUSTOM_API_KEY` تنظیم شده باشد؛ در غیر این صورت راه‌اندازی اولیه سریع شکست می‌خورد.
- اعتبارنامه‌های احراز هویت Gateway در راه‌اندازی تعاملی از گزینه‌های متن ساده و SecretRef پشتیبانی می‌کنند:
  - حالت توکن: **تولید/ذخیره توکن متن ساده** (پیش‌فرض) یا **استفاده از SecretRef**.
  - حالت رمز عبور: متن ساده یا SecretRef.
- مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
- راه‌اندازی‌های متن ساده موجود بدون تغییر به کار خود ادامه می‌دهند.

<Note>
نکته برای محیط‌های headless و سرور: OAuth را روی دستگاهی که مرورگر دارد کامل کنید، سپس
`auth-profiles.json` آن عامل را (برای مثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
`$OPENCLAW_STATE_DIR/...`) به میزبان gateway کپی کنید. `credentials/oauth.json`
فقط یک منبع واردسازی قدیمی است.
</Note>

## خروجی‌ها و اجزای داخلی

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` زمانی که `--skip-bootstrap` ارسال شده باشد
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (راه‌اندازی محلی در صورت تنظیم نبودن، به‌طور پیش‌فرض `"coding"` است؛ مقدارهای صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، bind، احراز هویت، tailscale)
- `session.dmScope` (راه‌اندازی محلی در صورت تنظیم نبودن، به‌طور پیش‌فرض آن را روی `per-channel-peer` می‌گذارد؛ مقدارهای صریح موجود حفظ می‌شوند)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Slack، Discord، Matrix، Microsoft Teams) زمانی که در اعلان‌ها انتخاب می‌کنید (نام‌ها در صورت امکان به IDها نگاشت می‌شوند)
- `skills.install.nodeManager`
  - پرچم `setup --node-manager` مقدارهای `npm`، `pnpm` یا `bun` را می‌پذیرد.
  - پیکربندی دستی همچنان می‌تواند بعداً `skills.install.nodeManager: "yarn"` را تنظیم کند.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` مقدار `agents.list[]` و `bindings` اختیاری را می‌نویسد.

اعتبارنامه‌های WhatsApp زیر `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرند.
نشست‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` ذخیره می‌شوند.

<Note>
برخی کانال‌ها به‌صورت plugin ارائه می‌شوند. وقتی در زمان راه‌اندازی انتخاب شوند، wizard
پیش از پیکربندی کانال، برای نصب plugin (npm یا مسیر محلی) درخواست می‌دهد.
</Note>

RPC مربوط به wizard در Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

کلاینت‌ها (برنامه macOS و Control UI) می‌توانند بدون پیاده‌سازی دوباره منطق onboarding، مراحل را نمایش دهند.

رفتار راه‌اندازی Signal:

- دارایی انتشار مناسب را دانلود می‌کند
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند
- `channels.signal.cliPath` را در پیکربندی می‌نویسد
- بیلدهای JVM به Java 21 نیاز دارند
- وقتی موجود باشند، از بیلدهای native استفاده می‌شود
- Windows از WSL2 استفاده می‌کند و جریان signal-cli لینوکس را داخل WSL دنبال می‌کند

## مستندات مرتبط

- مرکز onboarding: [Onboarding (CLI)](/fa/start/wizard)
- خودکارسازی و اسکریپت‌ها: [خودکارسازی CLI](/fa/start/wizard-cli-automation)
- مرجع فرمان: [`openclaw onboard`](/fa/cli/onboard)
