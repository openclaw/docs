---
read_when:
    - برای openclaw onboard به رفتار دقیق نیاز دارید
    - در حال اشکال‌زدایی نتایج راه‌اندازی اولیه یا یکپارچه‌سازی کلاینت‌های راه‌اندازی اولیه هستید
sidebarTitle: CLI reference
summary: مرجع کامل برای جریان راه‌اندازی CLI، راه‌اندازی احراز هویت/مدل، خروجی‌ها و سازوکارهای داخلی
title: مرجع راه‌اندازی CLI
x-i18n:
    generated_at: "2026-06-30T22:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

این صفحه مرجع کامل `openclaw onboard` است.
برای راهنمای کوتاه، [Onboarding (CLI)](/fa/start/wizard) را ببینید.

## ویزارد چه کاری انجام می‌دهد

حالت محلی (پیش‌فرض) شما را در این مراحل راهنمایی می‌کند:

- راه‌اندازی مدل و احراز هویت (OAuth اشتراک OpenAI Code، Anthropic Claude CLI یا کلید API، به‌علاوه گزینه‌های MiniMax، GLM، Ollama، Moonshot، StepFun و AI Gateway)
- مکان Workspace و فایل‌های راه‌اندازی اولیه
- تنظیمات Gateway (درگاه، bind، احراز هویت، Tailscale)
- کانال‌ها و ارائه‌دهندگان (Telegram، WhatsApp، Discord، Google Chat، Mattermost، Signal، iMessage و دیگر Pluginهای کانال همراه)
- نصب دیمون (LaunchAgent، واحد کاربری systemd، یا Windows Scheduled Task بومی با جایگزین پوشه Startup)
- بررسی سلامت
- راه‌اندازی Skills

حالت راه دور این دستگاه را برای اتصال به یک Gateway در جای دیگر پیکربندی می‌کند.
این حالت چیزی را روی میزبان راه دور نصب یا تغییر نمی‌دهد.

## جزئیات جریان محلی

<Steps>
  <Step title="تشخیص پیکربندی موجود">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، Keep، Modify یا Reset را انتخاب کنید.
    - اجرای دوباره ویزارد چیزی را پاک نمی‌کند مگر اینکه صراحتاً Reset را انتخاب کنید (یا `--reset` را پاس دهید).
    - CLI `--reset` به‌طور پیش‌فرض `config+creds+sessions` است؛ برای حذف Workspace هم از `--reset-scope full` استفاده کنید.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، ویزارد متوقف می‌شود و از شما می‌خواهد پیش از ادامه `openclaw doctor` را اجرا کنید.
    - Reset از `trash` استفاده می‌کند و این دامنه‌ها را ارائه می‌دهد:
      - فقط پیکربندی
      - پیکربندی + اعتبارنامه‌ها + نشست‌ها
      - بازنشانی کامل (Workspace را هم حذف می‌کند)

  </Step>
  <Step title="مدل و احراز هویت">
    - ماتریس کامل گزینه‌ها در [گزینه‌های احراز هویت و مدل](#auth-and-model-options) است.

  </Step>
  <Step title="Workspace">
    - پیش‌فرض `~/.openclaw/workspace` (قابل پیکربندی).
    - فایل‌های Workspace لازم برای آیین راه‌اندازی اولیه در اولین اجرا را ایجاد می‌کند.
    - چیدمان Workspace: [Workspace عامل](/fa/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - برای درگاه، bind، حالت احراز هویت و در معرض قرار دادن از طریق Tailscale پرسش می‌کند.
    - توصیه می‌شود: احراز هویت توکنی را حتی برای loopback فعال نگه دارید تا کلاینت‌های WS محلی هم مجبور به احراز هویت باشند.
    - در حالت توکنی، راه‌اندازی تعاملی این گزینه‌ها را ارائه می‌دهد:
      - **تولید/ذخیره توکن متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (اختیاری)
    - در حالت گذرواژه، راه‌اندازی تعاملی از ذخیره‌سازی متن ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef توکنی غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک متغیر محیطی غیرخالی در محیط فرایند onboarding نیاز دارد.
      - نمی‌توان آن را با `--gateway-token` ترکیب کرد.
    - احراز هویت را فقط وقتی غیرفعال کنید که به همه فرایندهای محلی کاملاً اعتماد دارید.
    - bindهای غیر loopback همچنان به احراز هویت نیاز دارند.

  </Step>
  <Step title="کانال‌ها">
    - [WhatsApp](/fa/channels/whatsapp): ورود اختیاری با QR
    - [Telegram](/fa/channels/telegram): توکن ربات
    - [Discord](/fa/channels/discord): توکن ربات
    - [Google Chat](/fa/channels/googlechat): JSON حساب سرویس + مخاطب Webhook
    - [Mattermost](/fa/channels/mattermost): توکن ربات + URL پایه
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب
    - [iMessage](/fa/channels/imessage): مسیر CLI `imsg` + دسترسی به پایگاه داده Messages؛ وقتی Gateway خارج از Mac اجرا می‌شود از یک پوشش SSH استفاده کنید
    - امنیت DM: پیش‌فرض pairing است. اولین DM یک کد می‌فرستد؛ با
      `openclaw pairing approve <channel> <code>` تأیید کنید یا از allowlistها استفاده کنید.
  </Step>
  <Step title="نصب دیمون">
    - macOS: LaunchAgent
      - به نشست کاربر واردشده نیاز دارد؛ برای حالت headless، از LaunchDaemon سفارشی استفاده کنید (همراه محصول ارائه نمی‌شود).
    - Linux و Windows از طریق WSL2: واحد کاربری systemd
      - ویزارد تلاش می‌کند `loginctl enable-linger <user>` را اجرا کند تا Gateway پس از خروج کاربر هم فعال بماند.
      - ممکن است برای sudo درخواست کند (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - Windows بومی: ابتدا Scheduled Task
      - اگر ایجاد task رد شود، OpenClaw به یک آیتم ورود پوشه Startup برای هر کاربر برمی‌گردد و Gateway را فوراً شروع می‌کند.
      - Scheduled Taskها همچنان ترجیح داده می‌شوند چون وضعیت supervisor بهتری ارائه می‌دهند.
    - انتخاب Runtime: Node (توصیه‌شده؛ برای WhatsApp و Telegram لازم است). Bun توصیه نمی‌شود.

  </Step>
  <Step title="بررسی سلامت">
    - Gateway را شروع می‌کند (اگر لازم باشد) و `openclaw health` را اجرا می‌کند.
    - `openclaw status --deep` پروب سلامت Gateway زنده را به خروجی status اضافه می‌کند، از جمله پروب‌های کانال وقتی پشتیبانی شوند.

  </Step>
  <Step title="Skills">
    - Skills موجود را می‌خواند و نیازمندی‌ها را بررسی می‌کند.
    - اجازه می‌دهد مدیر node را انتخاب کنید: npm، pnpm یا bun.
    - وابستگی‌های اختیاری را نصب می‌کند (برخی در macOS از Homebrew استفاده می‌کنند).

  </Step>
  <Step title="پایان">
    - خلاصه و گام‌های بعدی، از جمله گزینه‌های برنامه iOS، Android و macOS.

  </Step>
</Steps>

<Note>
اگر هیچ GUI شناسایی نشود، ویزارد به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward برای Control UI را چاپ می‌کند.
اگر دارایی‌های Control UI موجود نباشند، ویزارد تلاش می‌کند آن‌ها را بسازد؛ جایگزین `pnpm ui:build` است (وابستگی‌های UI را خودکار نصب می‌کند).
</Note>

## جزئیات حالت راه دور

حالت راه دور این دستگاه را برای اتصال به یک Gateway در جای دیگر پیکربندی می‌کند.

<Info>
حالت راه دور چیزی را روی میزبان راه دور نصب یا تغییر نمی‌دهد.
</Info>

چیزهایی که تنظیم می‌کنید:

- URL Gateway راه دور (`ws://...`)
- توکن اگر احراز هویت Gateway راه دور لازم باشد (توصیه‌شده)

<Note>
- اگر Gateway فقط loopback باشد، از تونل‌زنی SSH یا یک tailnet استفاده کنید.
- راهنماهای کشف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## گزینه‌های احراز هویت و مدل

<AccordionGroup>
  <Accordion title="کلید API Anthropic">
    اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند یا برای یک کلید درخواست می‌کند، سپس آن را برای استفاده دیمون ذخیره می‌کند.
  </Accordion>
  <Accordion title="اشتراک OpenAI Code (OAuth)">
    جریان مرورگر؛ `code#state` را paste کنید.

    وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime Codex روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="اشتراک OpenAI Code (pairing دستگاه)">
    جریان pairing مرورگر با یک کد دستگاه کوتاه‌مدت.

    وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime Codex روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="کلید API OpenAI">
    اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند یا برای یک کلید درخواست می‌کند، سپس اعتبارنامه را در پروفایل‌های احراز هویت ذخیره می‌کند.

    وقتی مدل تنظیم نشده باشد، `openai/*` باشد یا ارجاع‌های مدل قدیمی Codex باشد، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    ورود با مرورگر برای حساب‌های واجد شرایط SuperGrok یا X Premium. این مسیر
    توصیه‌شده xAI برای بیشتر کاربران است. OpenClaw پروفایل احراز هویت حاصل را
    برای مدل‌های Grok، `web_search`، `x_search` و `code_execution` مربوط به Grok ذخیره می‌کند.
  </Accordion>
  <Accordion title="کد دستگاه xAI (Grok)">
    ورود با مرورگر مناسب راه دور با یک کد کوتاه به‌جای callback میزبان محلی.
    از این گزینه از میزبان‌های SSH، Docker یا VPS استفاده کنید.
  </Accordion>
  <Accordion title="کلید API xAI (Grok)">
    برای `XAI_API_KEY` درخواست می‌کند و xAI را به‌عنوان ارائه‌دهنده مدل پیکربندی می‌کند. وقتی
    به‌جای OAuth اشتراکی یک کلید API از xAI Console می‌خواهید از این گزینه استفاده کنید.
  </Accordion>
  <Accordion title="OpenCode">
    برای `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) درخواست می‌کند و اجازه می‌دهد کاتالوگ Zen یا Go را انتخاب کنید.
    URL راه‌اندازی: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="کلید API (عمومی)">
    کلید را برای شما ذخیره می‌کند.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    برای `AI_GATEWAY_API_KEY` درخواست می‌کند.
    جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    برای شناسه حساب، شناسه Gateway و `CLOUDFLARE_AI_GATEWAY_API_KEY` درخواست می‌کند.
    جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    پیکربندی به‌صورت خودکار نوشته می‌شود. پیش‌فرض میزبانی‌شده `MiniMax-M3` است؛ راه‌اندازی با کلید API از
    `minimax/...` استفاده می‌کند و راه‌اندازی OAuth از `minimax-portal/...` استفاده می‌کند.
    جزئیات بیشتر: [MiniMax](/fa/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    پیکربندی برای StepFun standard یا Step Plan روی endpointهای چین یا جهانی به‌صورت خودکار نوشته می‌شود.
    Standard در حال حاضر شامل `step-3.5-flash` است، و Step Plan همچنین شامل `step-3.5-flash-2603` است.
    جزئیات بیشتر: [StepFun](/fa/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (سازگار با Anthropic)">
    برای `SYNTHETIC_API_KEY` درخواست می‌کند.
    جزئیات بیشتر: [Synthetic](/fa/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (مدل‌های باز Cloud و محلی)">
    ابتدا برای `Cloud + Local`، `Cloud only` یا `Local only` درخواست می‌کند.
    `Cloud only` از `OLLAMA_API_KEY` با `https://ollama.com` استفاده می‌کند.
    حالت‌های متکی به میزبان برای URL پایه (پیش‌فرض `http://127.0.0.1:11434`) درخواست می‌کنند، مدل‌های موجود را کشف می‌کنند و پیش‌فرض‌ها را پیشنهاد می‌دهند.
    `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی cloud وارد شده است یا نه.
    جزئیات بیشتر: [Ollama](/fa/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot و Kimi Coding">
    پیکربندی‌های Moonshot (Kimi K2) و Kimi Coding به‌صورت خودکار نوشته می‌شوند.
    جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot).
  </Accordion>
  <Accordion title="ارائه‌دهنده سفارشی">
    با endpointهای سازگار با OpenAI و سازگار با Anthropic کار می‌کند.

    onboarding تعاملی همان گزینه‌های ذخیره‌سازی کلید API را که جریان‌های کلید API دیگر ارائه‌دهندگان دارند پشتیبانی می‌کند:
    - **Paste API key now** (متن ساده)
    - **Use secret reference** (ارجاع env یا ارجاع ارائه‌دهنده پیکربندی‌شده، با اعتبارسنجی preflight)

    پرچم‌های غیرتعاملی:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختیاری؛ به `CUSTOM_API_KEY` برمی‌گردد)
    - `--custom-provider-id` (اختیاری)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (اختیاری؛ پیش‌فرض `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختیاری؛ قابلیت ورودی مدل استنباط‌شده را بازنویسی می‌کند)

  </Accordion>
  <Accordion title="رد کردن">
    احراز هویت را پیکربندی‌نشده باقی می‌گذارد.
  </Accordion>
</AccordionGroup>

رفتار مدل:

- مدل پیش‌فرض را از گزینه‌های شناسایی‌شده انتخاب کنید، یا ارائه‌دهنده و مدل را دستی وارد کنید.
- onboarding ارائه‌دهنده سفارشی پشتیبانی تصویر را برای شناسه‌های مدل رایج استنباط می‌کند و فقط وقتی نام مدل ناشناخته باشد می‌پرسد.
- وقتی onboarding از یک انتخاب احراز هویت ارائه‌دهنده شروع می‌شود، انتخابگر مدل به‌طور خودکار
  آن ارائه‌دهنده را ترجیح می‌دهد. برای Volcengine و BytePlus، همین ترجیح
  با گونه‌های coding-plan آن‌ها نیز مطابقت دارد (`volcengine-plan/*`,
  `byteplus-plan/*`).
- اگر آن فیلتر ارائه‌دهنده ترجیحی خالی باشد، انتخابگر به‌جای نمایش ندادن مدل‌ها،
  به کاتالوگ کامل برمی‌گردد.
- ویزارد بررسی مدل را اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا احراز هویت نداشته باشد هشدار می‌دهد.

مسیرهای اعتبارنامه و پروفایل:

- پروفایل‌های احراز هویت (کلیدهای API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- وارد کردن OAuth قدیمی: `~/.openclaw/credentials/oauth.json`

حالت ذخیره‌سازی اعتبارنامه:

- رفتار پیش‌فرض راه‌اندازی اولیه، کلیدهای API را به‌صورت مقدارهای متن ساده در پروفایل‌های احراز هویت ذخیره می‌کند.
- `--secret-input-mode ref` به‌جای ذخیره‌سازی کلید به‌صورت متن ساده، حالت ارجاع را فعال می‌کند.
  در راه‌اندازی تعاملی، می‌توانید یکی از این دو را انتخاب کنید:
  - ارجاع متغیر محیطی (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ارجاع ارائه‌دهنده پیکربندی‌شده (`file` یا `exec`) با نام مستعار ارائه‌دهنده + شناسه
- حالت ارجاع تعاملی پیش از ذخیره، یک اعتبارسنجی پیش‌پرواز سریع اجرا می‌کند.
  - ارجاع‌های متغیر محیطی: نام متغیر + مقدار غیرخالی را در محیط راه‌اندازی اولیه فعلی اعتبارسنجی می‌کند.
  - ارجاع‌های ارائه‌دهنده: پیکربندی ارائه‌دهنده را اعتبارسنجی می‌کند و شناسه درخواستی را resolve می‌کند.
  - اگر پیش‌پرواز شکست بخورد، راه‌اندازی اولیه خطا را نشان می‌دهد و اجازه می‌دهد دوباره تلاش کنید.
- در حالت غیرتعاملی، `--secret-input-mode ref` فقط با متغیر محیطی پشتیبانی می‌شود.
  - متغیر محیطی ارائه‌دهنده را در محیط فرایند راه‌اندازی اولیه تنظیم کنید.
  - فلگ‌های کلید درون‌خطی (برای مثال `--openai-api-key`) نیاز دارند که آن متغیر محیطی تنظیم شده باشد؛ در غیر این صورت راه‌اندازی اولیه سریع شکست می‌خورد.
  - برای ارائه‌دهنده‌های سفارشی، حالت غیرتعاملی `ref` مقدار `models.providers.<id>.apiKey` را به‌صورت `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` ذخیره می‌کند.
  - در آن حالت ارائه‌دهنده سفارشی، `--custom-api-key` نیاز دارد که `CUSTOM_API_KEY` تنظیم شده باشد؛ در غیر این صورت راه‌اندازی اولیه سریع شکست می‌خورد.
- اعتبارنامه‌های احراز هویت Gateway در راه‌اندازی تعاملی از انتخاب‌های متن ساده و SecretRef پشتیبانی می‌کنند:
  - حالت توکن: **تولید/ذخیره توکن متن ساده** (پیش‌فرض) یا **استفاده از SecretRef**.
  - حالت گذرواژه: متن ساده یا SecretRef.
- مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
- راه‌اندازی‌های متن ساده موجود بدون تغییر به کار خود ادامه می‌دهند.

<Note>
نکته برای محیط بدون رابط گرافیکی و سرور: OAuth را روی دستگاهی که مرورگر دارد کامل کنید، سپس
`auth-profiles.json` آن عامل را (برای مثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
`$OPENCLAW_STATE_DIR/...`) به میزبان gateway کپی کنید. `credentials/oauth.json`
فقط یک منبع واردسازی قدیمی است.
</Note>

## خروجی‌ها و اجزای داخلی

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` وقتی `--skip-bootstrap` ارسال شده باشد
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (راه‌اندازی اولیه محلی وقتی تنظیم نشده باشد به‌صورت پیش‌فرض `"coding"` است؛ مقدارهای صریح موجود حفظ می‌شوند)
- `gateway.*` (mode، bind، auth، tailscale)
- `session.dmScope` (راه‌اندازی اولیه محلی وقتی تنظیم نشده باشد این مقدار را به‌صورت پیش‌فرض `per-channel-peer` قرار می‌دهد؛ مقدارهای صریح موجود حفظ می‌شوند)
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Slack، Discord، Matrix، Microsoft Teams) وقتی در promptها انتخاب می‌کنید (نام‌ها در صورت امکان به شناسه‌ها resolve می‌شوند)
- `skills.install.nodeManager`
  - فلگ `setup --node-manager` مقدارهای `npm`، `pnpm`، یا `bun` را می‌پذیرد.
  - پیکربندی دستی همچنان می‌تواند بعدا `skills.install.nodeManager: "yarn"` را تنظیم کند.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` مقدارهای `agents.list[]` و `bindings` اختیاری را می‌نویسد.

اعتبارنامه‌های WhatsApp زیر `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرند.
نشست‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` ذخیره می‌شوند.

<Note>
برخی کانال‌ها به‌صورت plugin ارائه می‌شوند. وقتی در طول راه‌اندازی انتخاب شوند، wizard
پیش از پیکربندی کانال، برای نصب plugin (npm یا مسیر محلی) درخواست می‌دهد.
</Note>

RPC مربوط به wizard در Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

کلاینت‌ها (برنامه macOS و Control UI) می‌توانند مرحله‌ها را بدون پیاده‌سازی دوباره منطق راه‌اندازی اولیه رندر کنند.

رفتار راه‌اندازی Signal:

- asset انتشار مناسب را دانلود می‌کند
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند
- `channels.signal.cliPath` را در پیکربندی می‌نویسد
- ساخت‌های JVM به Java 21 نیاز دارند
- وقتی ساخت‌های native موجود باشند از آن‌ها استفاده می‌شود
- Windows از WSL2 استفاده می‌کند و جریان signal-cli لینوکس را داخل WSL دنبال می‌کند

## مستندات مرتبط

- مرکز راه‌اندازی اولیه: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- خودکارسازی و اسکریپت‌ها: [خودکارسازی CLI](/fa/start/wizard-cli-automation)
- مرجع فرمان: [`openclaw onboard`](/fa/cli/onboard)
