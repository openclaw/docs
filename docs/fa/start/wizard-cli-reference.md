---
read_when:
    - برای openclaw onboard به رفتار دقیق نیاز دارید
    - شما در حال اشکال‌زدایی نتایج راه‌اندازی اولیه یا یکپارچه‌سازی کلاینت‌های راه‌اندازی اولیه هستید
sidebarTitle: CLI reference
summary: مرجع کامل برای جریان راه‌اندازی CLI، راه‌اندازی احراز هویت/مدل، خروجی‌ها و جزئیات داخلی
title: مرجع راه‌اندازی CLI
x-i18n:
    generated_at: "2026-06-27T18:54:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

این صفحه مرجع کامل `openclaw onboard` است.
برای راهنمای کوتاه، [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

## جادوگر چه کاری انجام می‌دهد

حالت محلی (پیش‌فرض) شما را از این مراحل عبور می‌دهد:

- راه‌اندازی مدل و احراز هویت (OAuth اشتراک OpenAI Code، Anthropic Claude CLI یا کلید API، به‌علاوه گزینه‌های MiniMax، GLM، Ollama، Moonshot، StepFun و AI Gateway)
- مکان فضای کاری و فایل‌های راه‌اندازی اولیه
- تنظیمات Gateway (درگاه، اتصال، احراز هویت، Tailscale)
- کانال‌ها و ارائه‌دهندگان (Telegram، WhatsApp، Discord، Google Chat، Mattermost، Signal، iMessage و سایر Pluginهای کانال همراه)
- نصب daemon (LaunchAgent، واحد کاربری systemd، یا Windows Scheduled Task بومی با جایگزین پوشه Startup)
- بررسی سلامت
- راه‌اندازی Skills

حالت راه دور این دستگاه را برای اتصال به Gateway در جای دیگر پیکربندی می‌کند.
هیچ چیزی را روی میزبان راه دور نصب یا تغییر نمی‌دهد.

## جزئیات جریان محلی

<Steps>
  <Step title="Existing config detection">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، Keep، Modify یا Reset را انتخاب کنید.
    - اجرای دوباره جادوگر چیزی را پاک نمی‌کند، مگر اینکه صراحتاً Reset را انتخاب کنید (یا `--reset` را بدهید).
    - CLI `--reset` به‌طور پیش‌فرض `config+creds+sessions` است؛ برای حذف فضای کاری نیز از `--reset-scope full` استفاده کنید.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، جادوگر متوقف می‌شود و از شما می‌خواهد پیش از ادامه `openclaw doctor` را اجرا کنید.
    - Reset از `trash` استفاده می‌کند و این دامنه‌ها را پیشنهاد می‌دهد:
      - فقط پیکربندی
      - پیکربندی + اعتبارنامه‌ها + نشست‌ها
      - بازنشانی کامل (فضای کاری را هم حذف می‌کند)

  </Step>
  <Step title="Model and auth">
    - ماتریس کامل گزینه‌ها در [گزینه‌های احراز هویت و مدل](#auth-and-model-options) آمده است.

  </Step>
  <Step title="Workspace">
    - پیش‌فرض `~/.openclaw/workspace` است (قابل پیکربندی).
    - فایل‌های فضای کاری لازم برای آیین راه‌اندازی اولین اجرا را ایجاد می‌کند.
    - چیدمان فضای کاری: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - درگاه، اتصال، حالت احراز هویت و در معرض قرار دادن از طریق Tailscale را می‌پرسد.
    - توصیه‌شده: احراز هویت با توکن را حتی برای loopback فعال نگه دارید تا کلاینت‌های محلی WS مجبور به احراز هویت باشند.
    - در حالت توکن، راه‌اندازی تعاملی این گزینه‌ها را ارائه می‌دهد:
      - **تولید/ذخیره توکن متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (اختیاری)
    - در حالت رمز عبور، راه‌اندازی تعاملی از ذخیره‌سازی متن ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر غیرتعاملی SecretRef برای توکن: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک env var غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
      - نمی‌تواند با `--gateway-token` ترکیب شود.
    - احراز هویت را فقط زمانی غیرفعال کنید که کاملاً به همه فرایندهای محلی اعتماد دارید.
    - اتصال‌های غیر loopback همچنان به احراز هویت نیاز دارند.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/fa/channels/whatsapp): ورود اختیاری با QR
    - [Telegram](/fa/channels/telegram): توکن ربات
    - [Discord](/fa/channels/discord): توکن ربات
    - [Google Chat](/fa/channels/googlechat): JSON حساب سرویس + مخاطب Webhook
    - [Mattermost](/fa/channels/mattermost): توکن ربات + نشانی پایه
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب
    - [iMessage](/fa/channels/imessage): مسیر CLI `imsg` + دسترسی به DB پیام‌ها؛ وقتی Gateway خارج از Mac اجرا می‌شود از یک پوشش SSH استفاده کنید
    - امنیت DM: پیش‌فرض جفت‌سازی است. اولین DM یک کد می‌فرستد؛ با
      `openclaw pairing approve <channel> <code>` تأیید کنید یا از فهرست‌های مجاز استفاده کنید.
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - به نشست کاربر واردشده نیاز دارد؛ برای حالت بدون نمایشگر، از LaunchDaemon سفارشی استفاده کنید (همراه محصول ارائه نمی‌شود).
    - Linux و Windows از طریق WSL2: واحد کاربری systemd
      - جادوگر تلاش می‌کند `loginctl enable-linger <user>` را اجرا کند تا gateway پس از خروج هم فعال بماند.
      - ممکن است sudo بخواهد (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - Windows بومی: ابتدا Scheduled Task
      - اگر ایجاد task رد شود، OpenClaw به یک مورد ورود پوشه Startup برای هر کاربر برمی‌گردد و gateway را فوراً شروع می‌کند.
      - Scheduled Tasks همچنان ترجیح داده می‌شوند، چون وضعیت ناظر بهتری فراهم می‌کنند.
    - انتخاب runtime: Node (توصیه‌شده؛ برای WhatsApp و Telegram لازم است). Bun توصیه نمی‌شود.

  </Step>
  <Step title="Health check">
    - Gateway را شروع می‌کند (در صورت نیاز) و `openclaw health` را اجرا می‌کند.
    - `openclaw status --deep` پروب سلامت زنده gateway را به خروجی وضعیت اضافه می‌کند، از جمله پروب‌های کانال در صورت پشتیبانی.

  </Step>
  <Step title="Skills">
    - Skills موجود را می‌خواند و نیازمندی‌ها را بررسی می‌کند.
    - به شما اجازه می‌دهد مدیر node را انتخاب کنید: npm، pnpm یا bun.
    - وابستگی‌های اختیاری را نصب می‌کند (برخی در macOS از Homebrew استفاده می‌کنند).

  </Step>
  <Step title="Finish">
    - خلاصه و گام‌های بعدی، از جمله گزینه‌های برنامه iOS، Android و macOS.

  </Step>
</Steps>

<Note>
اگر هیچ GUI شناسایی نشود، جادوگر به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward را برای Control UI چاپ می‌کند.
اگر دارایی‌های Control UI موجود نباشند، جادوگر تلاش می‌کند آن‌ها را بسازد؛ جایگزین `pnpm ui:build` است (وابستگی‌های UI را خودکار نصب می‌کند).
</Note>

## جزئیات حالت راه دور

حالت راه دور این دستگاه را برای اتصال به Gateway در جای دیگر پیکربندی می‌کند.

<Info>
حالت راه دور هیچ چیزی را روی میزبان راه دور نصب یا تغییر نمی‌دهد.
</Info>

چیزهایی که تنظیم می‌کنید:

- URL گیت‌وی راه دور (`ws://...`)
- توکن، اگر احراز هویت Gateway راه دور لازم باشد (توصیه‌شده)

<Note>
- اگر gateway فقط loopback باشد، از تونل‌زنی SSH یا یک tailnet استفاده کنید.
- راهنمایی‌های کشف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## گزینه‌های احراز هویت و مدل

<AccordionGroup>
  <Accordion title="Anthropic API key">
    اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند، وگرنه کلید را درخواست می‌کند، سپس آن را برای استفاده daemon ذخیره می‌کند.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    جریان مرورگر؛ `code#state` را بچسبانید.

    وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime Codex روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    جریان جفت‌سازی مرورگر با یک کد دستگاه کوتاه‌عمر.

    وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime Codex روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="OpenAI API key">
    اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند، وگرنه کلید را درخواست می‌کند، سپس اعتبارنامه را در پروفایل‌های احراز هویت ذخیره می‌کند.

    وقتی مدل تنظیم نشده باشد، `openai/*` باشد، یا ارجاع‌های مدل Codex قدیمی باشند، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    ورود با مرورگر برای حساب‌های واجد شرایط SuperGrok یا X Premium. این مسیر
    توصیه‌شده xAI برای بیشتر کاربران است. OpenClaw پروفایل احراز هویت حاصل را
    برای مدل‌های Grok، `web_search`، `x_search` و `code_execution` در Grok ذخیره می‌کند.
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    ورود با مرورگر، مناسب راه دور، با یک کد کوتاه به‌جای callback
    localhost. از این گزینه در میزبان‌های SSH، Docker یا VPS استفاده کنید.
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY` را درخواست می‌کند و xAI را به‌عنوان ارائه‌دهنده مدل پیکربندی می‌کند. وقتی
    به‌جای OAuth اشتراکی، کلید API از xAI Console می‌خواهید از این گزینه استفاده کنید.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را درخواست می‌کند و اجازه می‌دهد کاتالوگ Zen یا Go را انتخاب کنید.
    URL راه‌اندازی: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generic)">
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
    پیکربندی خودکار نوشته می‌شود. پیش‌فرض میزبانی‌شده `MiniMax-M3` است؛ راه‌اندازی با کلید API از
    `minimax/...` استفاده می‌کند، و راه‌اندازی OAuth از `minimax-portal/...`.
    جزئیات بیشتر: [MiniMax](/fa/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    پیکربندی برای StepFun استاندارد یا Step Plan روی endpointهای چین یا جهانی خودکار نوشته می‌شود.
    استاندارد در حال حاضر شامل `step-3.5-flash` است، و Step Plan نیز شامل `step-3.5-flash-2603`.
    جزئیات بیشتر: [StepFun](/fa/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY` را درخواست می‌کند.
    جزئیات بیشتر: [Synthetic](/fa/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    ابتدا `Cloud + Local`، `Cloud only` یا `Local only` را درخواست می‌کند.
    `Cloud only` از `OLLAMA_API_KEY` با `https://ollama.com` استفاده می‌کند.
    حالت‌های پشتیبانی‌شده با میزبان، URL پایه (پیش‌فرض `http://127.0.0.1:11434`) را درخواست می‌کنند، مدل‌های موجود را کشف می‌کنند و پیش‌فرض‌ها را پیشنهاد می‌دهند.
    `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی ابری وارد شده است یا نه.
    جزئیات بیشتر: [Ollama](/fa/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    پیکربندی‌های Moonshot (Kimi K2) و Kimi Coding خودکار نوشته می‌شوند.
    جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot).
  </Accordion>
  <Accordion title="Custom provider">
    با endpointهای سازگار با OpenAI و سازگار با Anthropic کار می‌کند.

    راه‌اندازی اولیه تعاملی از همان انتخاب‌های ذخیره‌سازی کلید API مانند سایر جریان‌های کلید API ارائه‌دهنده پشتیبانی می‌کند:
    - **اکنون کلید API را بچسبانید** (متن ساده)
    - **استفاده از ارجاع محرمانه** (ارجاع env یا ارجاع ارائه‌دهنده پیکربندی‌شده، همراه با اعتبارسنجی preflight)

    پرچم‌های غیرتعاملی:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختیاری؛ به `CUSTOM_API_KEY` برمی‌گردد)
    - `--custom-provider-id` (اختیاری)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (اختیاری؛ پیش‌فرض `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختیاری؛ قابلیت ورودی مدل استنتاج‌شده را override می‌کند)

  </Accordion>
  <Accordion title="Skip">
    احراز هویت را پیکربندی‌نشده باقی می‌گذارد.
  </Accordion>
</AccordionGroup>

رفتار مدل:

- مدل پیش‌فرض را از گزینه‌های شناسایی‌شده انتخاب کنید، یا ارائه‌دهنده و مدل را دستی وارد کنید.
- راه‌اندازی اولیه ارائه‌دهنده سفارشی، پشتیبانی از تصویر را برای شناسه‌های رایج مدل استنتاج می‌کند و فقط وقتی نام مدل ناشناخته باشد سؤال می‌پرسد.
- وقتی راه‌اندازی اولیه از انتخاب احراز هویت ارائه‌دهنده شروع می‌شود، انتخاب‌گر مدل آن ارائه‌دهنده را
  به‌طور خودکار ترجیح می‌دهد. برای Volcengine و BytePlus، همین ترجیح
  با گونه‌های coding-plan آن‌ها نیز مطابقت دارد (`volcengine-plan/*`,
  `byteplus-plan/*`).
- اگر آن فیلتر ارائه‌دهنده ترجیحی خالی باشد، انتخاب‌گر به‌جای نمایش ندادن مدل‌ها،
  به کاتالوگ کامل برمی‌گردد.
- جادوگر یک بررسی مدل اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا احراز هویت نداشته باشد هشدار می‌دهد.

مسیرهای اعتبارنامه و پروفایل:

- پروفایل‌های احراز هویت (کلیدهای API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- واردسازی OAuth قدیمی: `~/.openclaw/credentials/oauth.json`

حالت ذخیره‌سازی اعتبارنامه:

- رفتار پیش‌فرض راه‌اندازی اولیه، کلیدهای API را به‌صورت مقادیر متن ساده در پروفایل‌های احراز هویت ذخیره می‌کند.
- `--secret-input-mode ref` حالت ارجاع را به‌جای ذخیره‌سازی کلید متن ساده فعال می‌کند.
  در راه‌اندازی تعاملی، می‌توانید یکی از این دو را انتخاب کنید:
  - ارجاع متغیر محیطی (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ارجاع ارائه‌دهنده پیکربندی‌شده (`file` یا `exec`) با نام مستعار ارائه‌دهنده + شناسه
- حالت ارجاع تعاملی پیش از ذخیره‌سازی، یک اعتبارسنجی مقدماتی سریع اجرا می‌کند.
  - ارجاع‌های محیطی: نام متغیر + مقدار غیرخالی را در محیط راه‌اندازی اولیه فعلی اعتبارسنجی می‌کند.
  - ارجاع‌های ارائه‌دهنده: پیکربندی ارائه‌دهنده را اعتبارسنجی می‌کند و شناسه درخواستی را حل می‌کند.
  - اگر اعتبارسنجی مقدماتی ناموفق باشد، راه‌اندازی اولیه خطا را نشان می‌دهد و اجازه می‌دهد دوباره تلاش کنید.
- در حالت غیرتعاملی، `--secret-input-mode ref` فقط بر پایه محیط است.
  - متغیر محیطی ارائه‌دهنده را در محیط فرایند راه‌اندازی اولیه تنظیم کنید.
  - پرچم‌های کلید درون‌خطی (برای مثال `--openai-api-key`) نیاز دارند آن متغیر محیطی تنظیم شده باشد؛ در غیر این صورت راه‌اندازی اولیه سریع شکست می‌خورد.
  - برای ارائه‌دهندگان سفارشی، حالت غیرتعاملی `ref` مقدار `models.providers.<id>.apiKey` را به‌صورت `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` ذخیره می‌کند.
  - در آن حالت ارائه‌دهنده سفارشی، `--custom-api-key` نیاز دارد `CUSTOM_API_KEY` تنظیم شده باشد؛ در غیر این صورت راه‌اندازی اولیه سریع شکست می‌خورد.
- اعتبارنامه‌های احراز هویت Gateway در راه‌اندازی تعاملی از انتخاب‌های متن ساده و SecretRef پشتیبانی می‌کنند:
  - حالت توکن: **تولید/ذخیره توکن متن ساده** (پیش‌فرض) یا **استفاده از SecretRef**.
  - حالت گذرواژه: متن ساده یا SecretRef.
- مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
- راه‌اندازی‌های متن ساده موجود بدون تغییر به کار خود ادامه می‌دهند.

<Note>
نکته برای حالت بدون رابط گرافیکی و سرور: OAuth را روی دستگاهی که مرورگر دارد تکمیل کنید، سپس
`auth-profiles.json` آن عامل را (برای مثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
`$OPENCLAW_STATE_DIR/...`) به میزبان Gateway کپی کنید. `credentials/oauth.json`
فقط یک منبع واردسازی قدیمی است.
</Note>

## خروجی‌ها و اجزای داخلی

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` وقتی `--skip-bootstrap` ارسال شده باشد
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (راه‌اندازی اولیه محلی وقتی تنظیم نشده باشد به‌صورت پیش‌فرض `"coding"` است؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، bind، احراز هویت، tailscale)
- `session.dmScope` (راه‌اندازی اولیه محلی وقتی تنظیم نشده باشد به‌صورت پیش‌فرض آن را `per-channel-peer` قرار می‌دهد؛ مقادیر صریح موجود حفظ می‌شوند)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Slack، Discord، Matrix، Microsoft Teams) وقتی هنگام اعلان‌ها انتخاب می‌کنید (نام‌ها در صورت امکان به شناسه‌ها حل می‌شوند)
- `skills.install.nodeManager`
  - پرچم `setup --node-manager` مقدارهای `npm`، `pnpm` یا `bun` را می‌پذیرد.
  - پیکربندی دستی همچنان می‌تواند بعدا `skills.install.nodeManager: "yarn"` را تنظیم کند.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` مقدار `agents.list[]` و `bindings` اختیاری را می‌نویسد.

اعتبارنامه‌های WhatsApp زیر `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرند.
جلسه‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` ذخیره می‌شوند.

<Note>
برخی کانال‌ها به‌صورت Plugin ارائه می‌شوند. وقتی هنگام راه‌اندازی انتخاب شوند، ویزارد
پیش از پیکربندی کانال، برای نصب Plugin (npm یا مسیر محلی) اعلان می‌دهد.
</Note>

RPC ویزارد Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

کلاینت‌ها (برنامه macOS و Control UI) می‌توانند مراحل را بدون پیاده‌سازی دوباره منطق راه‌اندازی اولیه نمایش دهند.

رفتار راه‌اندازی Signal:

- دارایی انتشار مناسب را دانلود می‌کند
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند
- `channels.signal.cliPath` را در پیکربندی می‌نویسد
- ساخت‌های JVM به Java 21 نیاز دارند
- وقتی ساخت‌های بومی در دسترس باشند از آن‌ها استفاده می‌شود
- Windows از WSL2 استفاده می‌کند و جریان signal-cli مربوط به Linux را داخل WSL دنبال می‌کند

## مستندات مرتبط

- مرکز راه‌اندازی اولیه: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- خودکارسازی و اسکریپت‌ها: [خودکارسازی CLI](/fa/start/wizard-cli-automation)
- مرجع فرمان: [`openclaw onboard`](/fa/cli/onboard)
