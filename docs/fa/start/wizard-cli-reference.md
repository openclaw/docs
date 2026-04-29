---
read_when:
    - برای openclaw onboard به جزئیات رفتار نیاز دارید
    - در حال اشکال‌زدایی نتایج راه‌اندازی اولیه یا یکپارچه‌سازی کلاینت‌های راه‌اندازی اولیه هستید
sidebarTitle: CLI reference
summary: مرجع کامل برای جریان راه‌اندازی CLI، راه‌اندازی احراز هویت/مدل، خروجی‌ها و جزئیات داخلی
title: مرجع راه‌اندازی CLI
x-i18n:
    generated_at: "2026-04-29T23:37:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

این صفحه مرجع کامل `openclaw onboard` است.
برای راهنمای کوتاه، [Onboarding (CLI)](/fa/start/wizard) را ببینید.

## ویزارد چه کاری انجام می‌دهد

حالت محلی (پیش‌فرض) شما را در این مراحل راهنمایی می‌کند:

- راه‌اندازی مدل و احراز هویت (OAuth اشتراک OpenAI Code، Anthropic Claude CLI یا کلید API، به‌علاوه گزینه‌های MiniMax، GLM، Ollama، Moonshot، StepFun و AI Gateway)
- محل workspace و فایل‌های bootstrap
- تنظیمات Gateway (port، bind، auth، tailscale)
- کانال‌ها و ارائه‌دهندگان (Telegram، WhatsApp، Discord، Google Chat، Mattermost، Signal، BlueBubbles و دیگر Pluginهای کانال همراه)
- نصب daemon (LaunchAgent، واحد کاربر systemd، یا Windows Scheduled Task بومی با fallback پوشه Startup)
- بررسی سلامت
- راه‌اندازی Skills

حالت راه‌دور این دستگاه را برای اتصال به یک Gateway در جای دیگر پیکربندی می‌کند.
این حالت چیزی را روی میزبان راه‌دور نصب یا تغییر نمی‌دهد.

## جزئیات جریان محلی

<Steps>
  <Step title="تشخیص پیکربندی موجود">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، Keep، Modify یا Reset را انتخاب کنید.
    - اجرای دوباره ویزارد چیزی را پاک نمی‌کند، مگر اینکه صراحتاً Reset را انتخاب کنید (یا `--reset` را پاس بدهید).
    - `--reset` در CLI به‌طور پیش‌فرض `config+creds+sessions` است؛ برای حذف workspace هم از `--reset-scope full` استفاده کنید.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، ویزارد متوقف می‌شود و از شما می‌خواهد قبل از ادامه `openclaw doctor` را اجرا کنید.
    - Reset از `trash` استفاده می‌کند و این دامنه‌ها را ارائه می‌دهد:
      - فقط پیکربندی
      - پیکربندی + credentials + sessions
      - بازنشانی کامل (workspace را هم حذف می‌کند)

  </Step>
  <Step title="مدل و احراز هویت">
    - ماتریس کامل گزینه‌ها در [گزینه‌های احراز هویت و مدل](#auth-and-model-options) آمده است.

  </Step>
  <Step title="Workspace">
    - پیش‌فرض `~/.openclaw/workspace` (قابل پیکربندی).
    - فایل‌های workspace لازم برای آیین bootstrap اجرای اول را seed می‌کند.
    - چیدمان workspace: [workspace عامل](/fa/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - برای port، bind، حالت auth و قرار دادن در معرض tailscale پرسش می‌کند.
    - توصیه می‌شود: auth مبتنی بر token را حتی برای loopback فعال نگه دارید تا کلاینت‌های WS محلی مجبور به احراز هویت باشند.
    - در حالت token، راه‌اندازی تعاملی این گزینه‌ها را ارائه می‌دهد:
      - **تولید/ذخیره token متنی ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (اختیاری)
    - در حالت password، راه‌اندازی تعاملی از ذخیره‌سازی متنی ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef غیرتعاملی برای token: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک env var غیرخالی در محیط فرایند onboarding نیاز دارد.
      - نمی‌تواند با `--gateway-token` ترکیب شود.
    - فقط زمانی auth را غیرفعال کنید که به همه فرایندهای محلی کاملاً اعتماد دارید.
    - bindهای غیر loopback همچنان به auth نیاز دارند.

  </Step>
  <Step title="کانال‌ها">
    - [WhatsApp](/fa/channels/whatsapp): ورود QR اختیاری
    - [Telegram](/fa/channels/telegram): token ربات
    - [Discord](/fa/channels/discord): token ربات
    - [Google Chat](/fa/channels/googlechat): service account JSON + مخاطب webhook
    - [Mattermost](/fa/channels/mattermost): token ربات + URL پایه
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب
    - [BlueBubbles](/fa/channels/bluebubbles): برای iMessage توصیه می‌شود؛ URL سرور + password + webhook
    - [iMessage](/fa/channels/imessage): مسیر قدیمی `imsg` CLI + دسترسی DB
    - امنیت DM: پیش‌فرض pairing است. اولین DM یک code می‌فرستد؛ با
      `openclaw pairing approve <channel> <code>` تأیید کنید یا از allowlistها استفاده کنید.
  </Step>
  <Step title="نصب daemon">
    - macOS: LaunchAgent
      - به نشست کاربر واردشده نیاز دارد؛ برای headless، از LaunchDaemon سفارشی استفاده کنید (همراه محصول ارائه نمی‌شود).
    - Linux و Windows از طریق WSL2: واحد کاربر systemd
      - ویزارد تلاش می‌کند `loginctl enable-linger <user>` را اجرا کند تا Gateway پس از logout هم بالا بماند.
      - ممکن است sudo بخواهد (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - Windows بومی: ابتدا Scheduled Task
      - اگر ایجاد task رد شود، OpenClaw به یک login item در پوشه Startup برای هر کاربر fallback می‌کند و Gateway را فوراً شروع می‌کند.
      - Scheduled Taskها همچنان ترجیح داده می‌شوند، چون وضعیت supervisor بهتری فراهم می‌کنند.
    - انتخاب runtime: Node (توصیه‌شده؛ برای WhatsApp و Telegram لازم است). Bun توصیه نمی‌شود.

  </Step>
  <Step title="بررسی سلامت">
    - Gateway را شروع می‌کند (در صورت نیاز) و `openclaw health` را اجرا می‌کند.
    - `openclaw status --deep` پروب سلامت زنده Gateway را به خروجی status اضافه می‌کند، از جمله پروب‌های کانال در صورت پشتیبانی.

  </Step>
  <Step title="Skills">
    - Skills موجود را می‌خواند و requirements را بررسی می‌کند.
    - به شما اجازه می‌دهد node manager را انتخاب کنید: npm، pnpm یا bun.
    - وابستگی‌های اختیاری را نصب می‌کند (برخی در macOS از Homebrew استفاده می‌کنند).

  </Step>
  <Step title="پایان">
    - خلاصه و گام‌های بعدی، شامل گزینه‌های app برای iOS، Android و macOS.

  </Step>
</Steps>

<Note>
اگر GUI تشخیص داده نشود، ویزارد به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward را برای Control UI چاپ می‌کند.
اگر assetهای Control UI موجود نباشند، ویزارد تلاش می‌کند آن‌ها را بسازد؛ fallback برابر است با `pnpm ui:build` (وابستگی‌های UI را خودکار نصب می‌کند).
</Note>

## جزئیات حالت راه‌دور

حالت راه‌دور این دستگاه را برای اتصال به یک Gateway در جای دیگر پیکربندی می‌کند.

<Info>
حالت راه‌دور چیزی را روی میزبان راه‌دور نصب یا تغییر نمی‌دهد.
</Info>

آنچه تنظیم می‌کنید:

- URL Gateway راه‌دور (`ws://...`)
- token اگر auth Gateway راه‌دور لازم باشد (توصیه‌شده)

<Note>
- اگر Gateway فقط loopback باشد، از SSH tunneling یا یک tailnet استفاده کنید.
- سرنخ‌های discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## گزینه‌های احراز هویت و مدل

<AccordionGroup>
  <Accordion title="کلید API Anthropic">
    اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند، یا برای یک key پرسش می‌کند، سپس آن را برای استفاده daemon ذخیره می‌کند.
  </Accordion>
  <Accordion title="اشتراک OpenAI Code (OAuth)">
    جریان مرورگر؛ `code#state` را paste کنید.

    وقتی model تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را روی `openai-codex/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="اشتراک OpenAI Code (device pairing)">
    جریان pairing مرورگر با یک device code کوتاه‌عمر.

    وقتی model تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را روی `openai-codex/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="کلید API OpenAI">
    اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند، یا برای یک key پرسش می‌کند، سپس credential را در auth profiles ذخیره می‌کند.

    وقتی model تنظیم نشده باشد، `openai/*` باشد، یا `openai-codex/*` باشد، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.

  </Accordion>
  <Accordion title="کلید API xAI (Grok)">
    برای `XAI_API_KEY` پرسش می‌کند و xAI را به‌عنوان ارائه‌دهنده model پیکربندی می‌کند.
  </Accordion>
  <Accordion title="OpenCode">
    برای `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) پرسش می‌کند و به شما اجازه می‌دهد catalog Zen یا Go را انتخاب کنید.
    URL راه‌اندازی: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="کلید API (عمومی)">
    key را برای شما ذخیره می‌کند.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    برای `AI_GATEWAY_API_KEY` پرسش می‌کند.
    جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    برای account ID، gateway ID و `CLOUDFLARE_AI_GATEWAY_API_KEY` پرسش می‌کند.
    جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    پیکربندی به‌صورت خودکار نوشته می‌شود. پیش‌فرض میزبانی‌شده `MiniMax-M2.7` است؛ راه‌اندازی با کلید API از
    `minimax/...` استفاده می‌کند و راه‌اندازی OAuth از `minimax-portal/...`.
    جزئیات بیشتر: [MiniMax](/fa/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    پیکربندی برای StepFun standard یا Step Plan روی endpointهای چین یا جهانی به‌صورت خودکار نوشته می‌شود.
    Standard در حال حاضر شامل `step-3.5-flash` است، و Step Plan همچنین شامل `step-3.5-flash-2603` است.
    جزئیات بیشتر: [StepFun](/fa/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (سازگار با Anthropic)">
    برای `SYNTHETIC_API_KEY` پرسش می‌کند.
    جزئیات بیشتر: [Synthetic](/fa/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud و مدل‌های open محلی)">
    ابتدا برای `Cloud + Local`، `Cloud only` یا `Local only` پرسش می‌کند.
    `Cloud only` از `OLLAMA_API_KEY` با `https://ollama.com` استفاده می‌کند.
    حالت‌های متکی به host برای URL پایه (پیش‌فرض `http://127.0.0.1:11434`) پرسش می‌کنند، مدل‌های موجود را discover می‌کنند و پیش‌فرض‌هایی پیشنهاد می‌دهند.
    `Cloud + Local` همچنین بررسی می‌کند که آیا آن host مربوط به Ollama برای دسترسی cloud وارد شده است یا نه.
    جزئیات بیشتر: [Ollama](/fa/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot و Kimi Coding">
    پیکربندی‌های Moonshot (Kimi K2) و Kimi Coding به‌صورت خودکار نوشته می‌شوند.
    جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot).
  </Accordion>
  <Accordion title="ارائه‌دهنده سفارشی">
    با endpointهای سازگار با OpenAI و سازگار با Anthropic کار می‌کند.

    onboarding تعاملی از همان گزینه‌های ذخیره‌سازی کلید API مانند دیگر جریان‌های کلید API ارائه‌دهنده پشتیبانی می‌کند:
    - **اکنون کلید API را paste کنید** (متن ساده)
    - **استفاده از secret reference** (env ref یا provider ref پیکربندی‌شده، با preflight validation)

    flagهای غیرتعاملی:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختیاری؛ به `CUSTOM_API_KEY` fallback می‌کند)
    - `--custom-provider-id` (اختیاری)
    - `--custom-compatibility <openai|anthropic>` (اختیاری؛ پیش‌فرض `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختیاری؛ قابلیت ورودی model استنباط‌شده را override می‌کند)

  </Accordion>
  <Accordion title="رد کردن">
    auth را پیکربندی‌نشده باقی می‌گذارد.
  </Accordion>
</AccordionGroup>

رفتار model:

- model پیش‌فرض را از گزینه‌های تشخیص‌داده‌شده انتخاب کنید، یا provider و model را دستی وارد کنید.
- onboarding ارائه‌دهنده سفارشی، پشتیبانی image را برای IDهای رایج model استنباط می‌کند و فقط وقتی نام model ناشناخته باشد سؤال می‌پرسد.
- وقتی onboarding از یک انتخاب auth ارائه‌دهنده شروع شود، model picker به‌صورت خودکار همان ارائه‌دهنده را ترجیح می‌دهد. برای Volcengine و BytePlus، همان ترجیح
  با variantهای coding-plan آن‌ها نیز match می‌شود (`volcengine-plan/*`,
  `byteplus-plan/*`).
- اگر filter ارائه‌دهنده ترجیحی خالی باشد، picker به‌جای نمایش ندادن هیچ model، به catalog کامل fallback می‌کند.
- ویزارد یک بررسی model اجرا می‌کند و اگر model پیکربندی‌شده ناشناخته باشد یا auth آن موجود نباشد هشدار می‌دهد.

مسیرهای credential و profile:

- Auth profiles (کلیدهای API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- وارد کردن OAuth قدیمی: `~/.openclaw/credentials/oauth.json`

حالت ذخیره‌سازی credential:

- رفتار پیش‌فرض onboarding، کلیدهای API را به‌صورت مقادیر متنی ساده در auth profiles نگه می‌دارد.
- `--secret-input-mode ref` حالت reference را به‌جای ذخیره‌سازی key متنی ساده فعال می‌کند.
  در راه‌اندازی تعاملی، می‌توانید یکی از این‌ها را انتخاب کنید:
  - environment variable ref (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - configured provider ref (`file` یا `exec`) با provider alias + id
- حالت reference تعاملی قبل از ذخیره یک preflight validation سریع اجرا می‌کند.
  - Env refs: نام variable + مقدار غیرخالی در محیط onboarding فعلی را اعتبارسنجی می‌کند.
  - Provider refs: پیکربندی provider را اعتبارسنجی می‌کند و id درخواست‌شده را resolve می‌کند.
  - اگر preflight شکست بخورد، onboarding خطا را نشان می‌دهد و اجازه retry می‌دهد.
- در حالت غیرتعاملی، `--secret-input-mode ref` فقط مبتنی بر env است.
  - env var ارائه‌دهنده را در محیط فرایند onboarding تنظیم کنید.
  - flagهای inline key (برای مثال `--openai-api-key`) نیاز دارند که آن env var تنظیم شده باشد؛ در غیر این صورت onboarding سریعاً fail می‌شود.
  - برای ارائه‌دهندگان سفارشی، حالت غیرتعاملی `ref`، `models.providers.<id>.apiKey` را به‌صورت `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` ذخیره می‌کند.
  - در آن مورد ارائه‌دهنده سفارشی، `--custom-api-key` نیاز دارد `CUSTOM_API_KEY` تنظیم شده باشد؛ در غیر این صورت onboarding سریعاً fail می‌شود.
- credentials احراز هویت Gateway در راه‌اندازی تعاملی از گزینه‌های متن ساده و SecretRef پشتیبانی می‌کنند:
  - حالت Token: **تولید/ذخیره token متنی ساده** (پیش‌فرض) یا **استفاده از SecretRef**.
  - حالت Password: متن ساده یا SecretRef.
- مسیر SecretRef غیرتعاملی برای token: `--gateway-token-ref-env <ENV_VAR>`.
- راه‌اندازی‌های متنی ساده موجود بدون تغییر به کار خود ادامه می‌دهند.

<Note>
نکته برای حالت بدون رابط گرافیکی و سرور: OAuth را روی دستگاهی که مرورگر دارد کامل کنید، سپس
`auth-profiles.json` آن عامل (برای مثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
`$OPENCLAW_STATE_DIR/...`) را به میزبان Gateway کپی کنید. `credentials/oauth.json`
فقط یک منبع واردسازی قدیمی است.
</Note>

## خروجی‌ها و جزئیات داخلی

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` وقتی `--skip-bootstrap` پاس داده می‌شود
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (راه‌اندازی اولیه محلی، وقتی تنظیم نشده باشد، به‌طور پیش‌فرض `"coding"` است؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، اتصال، احراز هویت، tailscale)
- `session.dmScope` (راه‌اندازی اولیه محلی، وقتی تنظیم نشده باشد، این مقدار را به‌طور پیش‌فرض روی `per-channel-peer` می‌گذارد؛ مقادیر صریح موجود حفظ می‌شوند)
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Slack، Discord، Matrix، Microsoft Teams) وقتی هنگام اعلان‌ها آن را فعال می‌کنید (نام‌ها در صورت امکان به شناسه‌ها تبدیل می‌شوند)
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
برخی کانال‌ها به‌صورت Plugin ارائه می‌شوند. وقتی هنگام راه‌اندازی انتخاب شوند، ویزارد
پیش از پیکربندی کانال، برای نصب Plugin (از npm یا مسیر محلی) اعلان می‌دهد.
</Note>

RPC ویزارد Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

کلاینت‌ها (برنامه macOS و Control UI) می‌توانند بدون پیاده‌سازی دوباره منطق راه‌اندازی اولیه، مراحل را نمایش دهند.

رفتار راه‌اندازی Signal:

- دارایی انتشار مناسب را دانلود می‌کند
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند
- `channels.signal.cliPath` را در پیکربندی می‌نویسد
- ساخت‌های JVM به Java 21 نیاز دارند
- وقتی ساخت‌های بومی موجود باشند، از آن‌ها استفاده می‌شود
- Windows از WSL2 استفاده می‌کند و جریان signal-cli در Linux را داخل WSL دنبال می‌کند

## مستندات مرتبط

- مرکز راه‌اندازی اولیه: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- خودکارسازی و اسکریپت‌ها: [خودکارسازی CLI](/fa/start/wizard-cli-automation)
- مرجع فرمان: [`openclaw onboard`](/fa/cli/onboard)
