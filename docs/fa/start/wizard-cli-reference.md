---
read_when:
    - به رفتار تفصیلی `openclaw onboard` نیاز دارید
    - شما در حال اشکال‌زدایی نتایج راه‌اندازی اولیه یا یکپارچه‌سازی کلاینت‌های راه‌اندازی اولیه هستید
sidebarTitle: CLI reference
summary: مرجع کامل برای جریان راه‌اندازی CLI، راه‌اندازی احراز هویت/مدل، خروجی‌ها و سازوکارهای داخلی
title: مرجع راه‌اندازی CLI
x-i18n:
    generated_at: "2026-07-04T06:43:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

این صفحه مرجع کامل `openclaw onboard` است.
برای راهنمای کوتاه، [Onboarding (CLI)](/fa/start/wizard) را ببینید.

## ویزارد چه می‌کند

حالت محلی (پیش‌فرض) شما را در این موارد راهنمایی می‌کند:

- راه‌اندازی مدل و احراز هویت (OAuth اشتراک OpenAI Code، Anthropic Claude CLI یا کلید API، به‌علاوه گزینه‌های MiniMax، GLM، Ollama، Moonshot، StepFun و AI Gateway)
- محل Workspace و فایل‌های راه‌اندازی اولیه
- تنظیمات Gateway (پورت، bind، احراز هویت، Tailscale)
- کانال‌ها و ارائه‌دهندگان (Telegram، WhatsApp، Discord، Google Chat، Mattermost، Signal، iMessage و دیگر Pluginهای کانال همراه)
- نصب Daemon (LaunchAgent، واحد کاربر systemd، یا Windows Scheduled Task بومی با fallback پوشه Startup)
- بررسی سلامت
- راه‌اندازی Skills

حالت راه دور این ماشین را برای اتصال به یک gateway در جای دیگر پیکربندی می‌کند.
این حالت چیزی را روی میزبان راه دور نصب یا تغییر نمی‌دهد.

## جزئیات جریان محلی

<Steps>
  <Step title="تشخیص پیکربندی موجود">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، Keep، Modify یا Reset را انتخاب کنید.
    - اجرای دوباره ویزارد چیزی را پاک نمی‌کند مگر اینکه صراحتاً Reset را انتخاب کنید (یا `--reset` را پاس دهید).
    - CLI `--reset` به‌طور پیش‌فرض `config+creds+sessions` است؛ برای حذف Workspace هم از `--reset-scope full` استفاده کنید.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، ویزارد متوقف می‌شود و از شما می‌خواهد پیش از ادامه `openclaw doctor` را اجرا کنید.
    - Reset از `trash` استفاده می‌کند و این محدوده‌ها را پیشنهاد می‌دهد:
      - فقط پیکربندی
      - پیکربندی + اعتبارنامه‌ها + نشست‌ها
      - بازنشانی کامل (Workspace را هم حذف می‌کند)

  </Step>
  <Step title="مدل و احراز هویت">
    - ماتریس کامل گزینه‌ها در [گزینه‌های احراز هویت و مدل](#auth-and-model-options) آمده است.

  </Step>
  <Step title="Workspace">
    - پیش‌فرض `~/.openclaw/workspace` (قابل پیکربندی).
    - فایل‌های Workspace موردنیاز برای آیین راه‌اندازی اولیه در اولین اجرا را seed می‌کند.
    - چیدمان Workspace: [Agent workspace](/fa/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - برای پورت، bind، حالت احراز هویت و در معرض قرار دادن از طریق Tailscale سؤال می‌کند.
    - توصیه‌شده: حتی برای loopback نیز احراز هویت توکنی را فعال نگه دارید تا کلاینت‌های WS محلی مجبور به احراز هویت باشند.
    - در حالت توکن، راه‌اندازی تعاملی این گزینه‌ها را ارائه می‌دهد:
      - **ایجاد/ذخیره توکن متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (اختیاری)
    - در حالت گذرواژه، راه‌اندازی تعاملی از ذخیره‌سازی متن ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک متغیر محیطی غیرخالی در محیط فرایند onboarding نیاز دارد.
      - نمی‌تواند با `--gateway-token` ترکیب شود.
    - احراز هویت را فقط زمانی غیرفعال کنید که به تمام فرایندهای محلی کاملاً اعتماد دارید.
    - bindهای غیر loopback همچنان به احراز هویت نیاز دارند.

  </Step>
  <Step title="کانال‌ها">
    - [WhatsApp](/fa/channels/whatsapp): ورود اختیاری با QR
    - [Telegram](/fa/channels/telegram): توکن بات
    - [Discord](/fa/channels/discord): توکن بات
    - [Google Chat](/fa/channels/googlechat): JSON حساب سرویس + مخاطب Webhook
    - [Mattermost](/fa/channels/mattermost): توکن بات + URL پایه
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب
    - [iMessage](/fa/channels/imessage): مسیر CLI `imsg` + دسترسی به پایگاه داده Messages؛ وقتی Gateway خارج از Mac اجرا می‌شود از wrapper SSH استفاده کنید
    - امنیت DM: پیش‌فرض pairing است. اولین DM یک کد ارسال می‌کند؛ با
      `openclaw pairing approve <channel> <code>` تأیید کنید یا از allowlistها استفاده کنید.
  </Step>
  <Step title="نصب Daemon">
    - macOS: LaunchAgent
      - به نشست کاربر واردشده نیاز دارد؛ برای حالت headless از LaunchDaemon سفارشی استفاده کنید (همراه محصول ارائه نمی‌شود).
    - Linux و Windows از طریق WSL2: واحد کاربر systemd
      - ویزارد تلاش می‌کند `loginctl enable-linger <user>` را اجرا کند تا gateway پس از خروج از حساب نیز فعال بماند.
      - ممکن است sudo بخواهد (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo امتحان می‌کند.
    - Windows بومی: ابتدا Scheduled Task
      - اگر ایجاد task رد شود، OpenClaw به یک مورد ورود پوشه Startup برای هر کاربر fallback می‌کند و gateway را فوراً شروع می‌کند.
      - Scheduled Taskها همچنان ترجیح داده می‌شوند چون وضعیت supervisor بهتری فراهم می‌کنند.
    - انتخاب runtime: Node (توصیه‌شده؛ برای WhatsApp و Telegram لازم است). Bun توصیه نمی‌شود.

  </Step>
  <Step title="بررسی سلامت">
    - Gateway را شروع می‌کند (در صورت نیاز) و `openclaw health` را اجرا می‌کند.
    - `openclaw status --deep` پروب سلامت gateway زنده را به خروجی status اضافه می‌کند، از جمله پروب‌های کانال وقتی پشتیبانی شوند.

  </Step>
  <Step title="Skills">
    - Skills موجود را می‌خواند و نیازمندی‌ها را بررسی می‌کند.
    - به شما اجازه می‌دهد مدیر node را انتخاب کنید: npm، pnpm یا bun.
    - وابستگی‌های اختیاری Skills همراه و مورداعتماد را وقتی installer لازم در دسترس باشد نصب می‌کند.
    - installerهای Homebrew، uv و Go ناموجود را رد می‌کند، سپس Skills متأثر را با راهنمای راه‌اندازی دستی گروه‌بندی می‌کند. پس از نصب پیش‌نیازهای جاافتاده `openclaw doctor` را اجرا کنید.

  </Step>
  <Step title="پایان">
    - خلاصه و گام‌های بعدی، از جمله گزینه‌های برنامه iOS، Android و macOS.

  </Step>
</Steps>

<Note>
اگر GUI تشخیص داده نشود، ویزارد به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward برای Control UI را چاپ می‌کند.
اگر assetهای Control UI وجود نداشته باشند، ویزارد تلاش می‌کند آن‌ها را بسازد؛ fallback برابر `pnpm ui:build` است (وابستگی‌های UI را به‌طور خودکار نصب می‌کند).
</Note>

## جزئیات حالت راه دور

حالت راه دور این ماشین را برای اتصال به یک gateway در جای دیگر پیکربندی می‌کند.

<Info>
حالت راه دور چیزی را روی میزبان راه دور نصب یا تغییر نمی‌دهد.
</Info>

چیزهایی که تنظیم می‌کنید:

- URL Gateway راه دور (`ws://...`)
- توکن، اگر احراز هویت gateway راه دور لازم باشد (توصیه‌شده)

<Note>
- اگر gateway فقط loopback است، از SSH tunneling یا tailnet استفاده کنید.
- راهنمایی‌های کشف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## گزینه‌های احراز هویت و مدل

<AccordionGroup>
  <Accordion title="کلید API Anthropic">
    اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند، یا کلید را درخواست می‌کند و سپس آن را برای استفاده Daemon ذخیره می‌کند.
  </Accordion>
  <Accordion title="اشتراک OpenAI Code (OAuth)">
    جریان مرورگر؛ `code#state` را paste کنید.

    وقتی مدل تنظیم نشده باشد یا از قبل عضو خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime مربوط به Codex روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="اشتراک OpenAI Code (device pairing)">
    جریان pairing مرورگر با یک device code کوتاه‌عمر.

    وقتی مدل تنظیم نشده باشد یا از قبل عضو خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime مربوط به Codex روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="کلید API OpenAI">
    اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند، یا کلید را درخواست می‌کند و سپس اعتبارنامه را در پروفایل‌های احراز هویت ذخیره می‌کند.

    وقتی مدل تنظیم نشده باشد، `openai/*` باشد، یا refهای مدل Codex قدیمی باشند، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    ورود با مرورگر برای حساب‌های واجد شرایط SuperGrok یا X Premium. این مسیر
    xAI توصیه‌شده برای بیشتر کاربران است. OpenClaw پروفایل احراز هویت حاصل را
    برای مدل‌های Grok، Grok `web_search`، `x_search` و `code_execution` ذخیره می‌کند.
  </Accordion>
  <Accordion title="کد دستگاه xAI (Grok)">
    ورود با مرورگر مناسب راه دور، با یک کد کوتاه به‌جای callback به localhost.
    از این گزینه روی میزبان‌های SSH، Docker یا VPS استفاده کنید.
  </Accordion>
  <Accordion title="کلید API xAI (Grok)">
    `XAI_API_KEY` را درخواست می‌کند و xAI را به‌عنوان ارائه‌دهنده مدل پیکربندی می‌کند. وقتی
    به‌جای OAuth اشتراکی یک کلید API مربوط به xAI Console می‌خواهید از این گزینه استفاده کنید.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را درخواست می‌کند و به شما اجازه می‌دهد کاتالوگ Zen یا Go را انتخاب کنید.
    URL راه‌اندازی: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="کلید API (عمومی)">
    کلید را برای شما ذخیره می‌کند.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` را درخواست می‌کند.
    جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    شناسه حساب، شناسه gateway و `CLOUDFLARE_AI_GATEWAY_API_KEY` را درخواست می‌کند.
    جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    پیکربندی به‌طور خودکار نوشته می‌شود. پیش‌فرض میزبانی‌شده `MiniMax-M3` است؛ راه‌اندازی با کلید API از
    `minimax/...` و راه‌اندازی OAuth از `minimax-portal/...` استفاده می‌کند.
    جزئیات بیشتر: [MiniMax](/fa/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    پیکربندی برای StepFun standard یا Step Plan روی endpointهای چین یا جهانی به‌طور خودکار نوشته می‌شود.
    Standard در حال حاضر شامل `step-3.5-flash` است و Step Plan همچنین شامل `step-3.5-flash-2603` می‌شود.
    جزئیات بیشتر: [StepFun](/fa/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (سازگار با Anthropic)">
    `SYNTHETIC_API_KEY` را درخواست می‌کند.
    جزئیات بیشتر: [Synthetic](/fa/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (مدل‌های باز Cloud و محلی)">
    ابتدا برای `Cloud + Local`، `Cloud only` یا `Local only` سؤال می‌کند.
    `Cloud only` از `OLLAMA_API_KEY` همراه با `https://ollama.com` استفاده می‌کند.
    حالت‌های متکی به میزبان URL پایه را درخواست می‌کنند (پیش‌فرض `http://127.0.0.1:11434`)، مدل‌های موجود را کشف می‌کنند و پیش‌فرض‌ها را پیشنهاد می‌دهند.
    `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی ابری وارد شده است یا نه.
    جزئیات بیشتر: [Ollama](/fa/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot و Kimi Coding">
    پیکربندی‌های Moonshot (Kimi K2) و Kimi Coding به‌طور خودکار نوشته می‌شوند.
    جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot).
  </Accordion>
  <Accordion title="ارائه‌دهنده سفارشی">
    با endpointهای سازگار با OpenAI و سازگار با Anthropic کار می‌کند.

    Onboarding تعاملی از همان گزینه‌های ذخیره‌سازی کلید API پشتیبانی می‌کند که جریان‌های کلید API دیگر ارائه‌دهنده‌ها دارند:
    - **همین حالا کلید API را paste کنید** (متن ساده)
    - **استفاده از reference محرمانه** (env ref یا provider ref پیکربندی‌شده، همراه با اعتبارسنجی preflight)

    پرچم‌های غیرتعاملی:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختیاری؛ به `CUSTOM_API_KEY` fallback می‌کند)
    - `--custom-provider-id` (اختیاری)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (اختیاری؛ پیش‌فرض `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختیاری؛ قابلیت ورودی مدل استنباط‌شده را override می‌کند)

  </Accordion>
  <Accordion title="رد کردن">
    احراز هویت را پیکربندی‌نشده باقی می‌گذارد.
  </Accordion>
</AccordionGroup>

رفتار مدل:

- مدل پیش‌فرض را از گزینه‌های تشخیص‌داده‌شده انتخاب کنید، یا ارائه‌دهنده و مدل را دستی وارد کنید.
- Onboarding ارائه‌دهنده سفارشی پشتیبانی تصویر را برای شناسه‌های رایج مدل استنباط می‌کند و فقط وقتی نام مدل ناشناخته باشد سؤال می‌کند.
- وقتی onboarding از یک گزینه احراز هویت ارائه‌دهنده شروع شود، انتخاب‌گر مدل
  آن ارائه‌دهنده را به‌طور خودکار ترجیح می‌دهد. برای Volcengine و BytePlus، همین ترجیح
  با variantهای coding-plan آن‌ها نیز مطابقت دارد (`volcengine-plan/*`،
  `byteplus-plan/*`).
- اگر فیلتر ارائه‌دهنده ترجیحی خالی شود، انتخاب‌گر به‌جای نمایش ندادن مدل‌ها
  به کاتالوگ کامل fallback می‌کند.
- ویزارد بررسی مدل را اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا احراز هویت نداشته باشد هشدار می‌دهد.

مسیرهای اعتبارنامه و پروفایل:

- پروفایل‌های احراز هویت (کلیدهای API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- وارد کردن OAuth قدیمی: `~/.openclaw/credentials/oauth.json`

حالت ذخیره‌سازی اعتبارنامه:

- رفتار پیش‌فرض راه‌اندازی اولیه، کلیدهای API را به‌صورت مقادیر متن ساده در پروفایل‌های احراز هویت ذخیره می‌کند.
- `--secret-input-mode ref` به‌جای ذخیره‌سازی کلید به‌صورت متن ساده، حالت ارجاع را فعال می‌کند.
  در راه‌اندازی تعاملی، می‌توانید یکی از این دو را انتخاب کنید:
  - ارجاع متغیر محیطی (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ارجاع ارائه‌دهنده پیکربندی‌شده (`file` یا `exec`) با نام مستعار ارائه‌دهنده + شناسه
- حالت ارجاع تعاملی، پیش از ذخیره‌سازی یک اعتبارسنجی پیش‌پرواز سریع اجرا می‌کند.
  - ارجاع‌های محیطی: نام متغیر + مقدار غیرخالی را در محیط راه‌اندازی فعلی اعتبارسنجی می‌کند.
  - ارجاع‌های ارائه‌دهنده: پیکربندی ارائه‌دهنده را اعتبارسنجی می‌کند و شناسه درخواستی را resolve می‌کند.
  - اگر پیش‌پرواز ناموفق باشد، راه‌اندازی خطا را نشان می‌دهد و به شما اجازه تلاش دوباره می‌دهد.
- در حالت غیرتعاملی، `--secret-input-mode ref` فقط با env پشتیبانی می‌شود.
  - متغیر محیطی ارائه‌دهنده را در محیط فرایند راه‌اندازی تنظیم کنید.
  - فلگ‌های کلید درون‌خطی (برای مثال `--openai-api-key`) نیاز دارند آن متغیر محیطی تنظیم شده باشد؛ در غیر این صورت راه‌اندازی سریعاً شکست می‌خورد.
  - برای ارائه‌دهنده‌های سفارشی، حالت غیرتعاملی `ref` مقدار `models.providers.<id>.apiKey` را به‌صورت `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` ذخیره می‌کند.
  - در آن حالت ارائه‌دهنده سفارشی، `--custom-api-key` نیاز دارد `CUSTOM_API_KEY` تنظیم شده باشد؛ در غیر این صورت راه‌اندازی سریعاً شکست می‌خورد.
- اعتبارنامه‌های احراز هویت Gateway در راه‌اندازی تعاملی از انتخاب‌های متن ساده و SecretRef پشتیبانی می‌کنند:
  - حالت توکن: **تولید/ذخیره توکن متن ساده** (پیش‌فرض) یا **استفاده از SecretRef**.
  - حالت گذرواژه: متن ساده یا SecretRef.
- مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
- راه‌اندازی‌های متن ساده موجود بدون تغییر به کار ادامه می‌دهند.

<Note>
نکته برای حالت headless و سرور: OAuth را روی ماشینی دارای مرورگر کامل کنید، سپس
`auth-profiles.json` همان agent را (برای مثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
`$OPENCLAW_STATE_DIR/...`) به میزبان gateway کپی کنید. `credentials/oauth.json`
فقط یک منبع import قدیمی است.
</Note>

## خروجی‌ها و اجزای داخلی

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` وقتی `--skip-bootstrap` پاس داده شود
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (راه‌اندازی محلی وقتی تنظیم نشده باشد به‌صورت پیش‌فرض `"coding"` است؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، bind، احراز هویت، tailscale)
- `session.dmScope` (راه‌اندازی محلی وقتی تنظیم نشده باشد این را به‌صورت پیش‌فرض `per-channel-peer` قرار می‌دهد؛ مقادیر صریح موجود حفظ می‌شوند)
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- allowlistهای کانال (Slack، Discord، Matrix، Microsoft Teams) وقتی هنگام promptها انتخاب می‌کنید (نام‌ها در صورت امکان به شناسه‌ها resolve می‌شوند)
- `skills.install.nodeManager`
  - فلگ `setup --node-manager` مقدارهای `npm`، `pnpm`، یا `bun` را می‌پذیرد.
  - پیکربندی دستی همچنان می‌تواند بعداً `skills.install.nodeManager: "yarn"` را تنظیم کند.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` مقدار `agents.list[]` و `bindings` اختیاری را می‌نویسد.

اعتبارنامه‌های WhatsApp زیر `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرند.
جلسه‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` ذخیره می‌شوند.

<Note>
برخی کانال‌ها به‌صورت plugins ارائه می‌شوند. وقتی هنگام راه‌اندازی انتخاب شوند، wizard
پیش از پیکربندی کانال از شما می‌خواهد plugin را نصب کنید (npm یا مسیر محلی).
</Note>

RPC ویزارد Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

کلاینت‌ها (اپ macOS و Control UI) می‌توانند مرحله‌ها را بدون پیاده‌سازی دوباره منطق راه‌اندازی نمایش دهند.

رفتار راه‌اندازی Signal:

- asset انتشار مناسب را دانلود می‌کند
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند
- مقدار `channels.signal.cliPath` را در پیکربندی می‌نویسد
- buildهای JVM به Java 21 نیاز دارند
- وقتی buildهای native موجود باشند، از آن‌ها استفاده می‌شود
- Windows از WSL2 استفاده می‌کند و جریان signal-cli لینوکس را داخل WSL دنبال می‌کند

## مستندات مرتبط

- مرکز راه‌اندازی اولیه: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- اتوماسیون و اسکریپت‌ها: [اتوماسیون CLI](/fa/start/wizard-cli-automation)
- مرجع دستور: [`openclaw onboard`](/fa/cli/onboard)
