---
read_when:
    - جست‌وجوی یک گام یا پرچم مشخص در فرایند راه‌اندازی اولیه
    - خودکارسازی راه‌اندازی اولیه با حالت غیرتعاملی
    - اشکال‌زدایی رفتار راه‌اندازی اولیه
sidebarTitle: Onboarding Reference
summary: 'مرجع کامل برای راه‌اندازی اولیهٔ CLI: هر گام، فلگ و فیلد پیکربندی'
title: مرجع راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-04-29T23:35:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

این مرجع کامل برای `openclaw onboard` است.
برای نمای کلی سطح بالا، [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

## جزئیات جریان (حالت محلی)

<Steps>
  <Step title="تشخیص پیکربندی موجود">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، **نگه‌داری / تغییر / بازنشانی** را انتخاب کنید.
    - اجرای دوباره راه‌اندازی اولیه هیچ چیزی را پاک **نمی‌کند** مگر اینکه صراحتا **بازنشانی** را انتخاب کنید
      (یا `--reset` را پاس دهید).
    - `--reset` در CLI به‌طور پیش‌فرض روی `config+creds+sessions` است؛ از `--reset-scope full`
      استفاده کنید تا workspace نیز حذف شود.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، wizard متوقف می‌شود و از شما می‌خواهد
      پیش از ادامه `openclaw doctor` را اجرا کنید.
    - بازنشانی از `trash` استفاده می‌کند (هرگز `rm`) و این دامنه‌ها را ارائه می‌دهد:
      - فقط پیکربندی
      - پیکربندی + اعتبارنامه‌ها + نشست‌ها
      - بازنشانی کامل (workspace را نیز حذف می‌کند)

  </Step>
  <Step title="مدل/احراز هویت">
    - **کلید API Anthropic**: اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند، یا کلید را درخواست می‌کند، سپس آن را برای استفاده daemon ذخیره می‌کند.
    - **کلید API Anthropic**: گزینه دستیار Anthropic ترجیحی در راه‌اندازی اولیه/پیکربندی.
    - **setup-token Anthropic**: همچنان در راه‌اندازی اولیه/پیکربندی در دسترس است، هرچند OpenClaw اکنون در صورت وجود، استفاده دوباره از Claude CLI را ترجیح می‌دهد.
    - **اشتراک OpenAI Code (Codex) (OAuth)**: جریان مرورگر؛ `code#state` را جای‌گذاری کنید.
      - وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را روی `openai-codex/gpt-5.5` تنظیم می‌کند.
    - **اشتراک OpenAI Code (Codex) (جفت‌سازی دستگاه)**: جریان جفت‌سازی مرورگر با کد دستگاه کوتاه‌عمر.
      - وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را روی `openai-codex/gpt-5.5` تنظیم می‌کند.
    - **کلید API OpenAI**: اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند، یا کلید را درخواست می‌کند، سپس آن را در پروفایل‌های احراز هویت ذخیره می‌کند.
      - وقتی مدل تنظیم نشده باشد، `openai/*` باشد، یا `openai-codex/*` باشد، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.
    - **کلید API xAI (Grok)**: `XAI_API_KEY` را درخواست می‌کند و xAI را به‌عنوان ارائه‌دهنده مدل پیکربندی می‌کند.
    - **OpenCode**: `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`، آن را از https://opencode.ai/auth بگیرید) را درخواست می‌کند و اجازه می‌دهد کاتالوگ Zen یا Go را انتخاب کنید.
    - **Ollama**: ابتدا **Cloud + Local**، **Cloud only**، یا **Local only** را ارائه می‌دهد. `Cloud only` مقدار `OLLAMA_API_KEY` را درخواست می‌کند و از `https://ollama.com` استفاده می‌کند؛ حالت‌های متکی به میزبان، URL پایه Ollama را درخواست می‌کنند، مدل‌های موجود را کشف می‌کنند، و در صورت نیاز مدل محلی انتخاب‌شده را به‌صورت خودکار pull می‌کنند؛ `Cloud + Local` همچنین بررسی می‌کند که آن میزبان Ollama برای دسترسی ابری وارد شده باشد.
    - جزئیات بیشتر: [Ollama](/fa/providers/ollama)
    - **کلید API**: کلید را برای شما ذخیره می‌کند.
    - **Vercel AI Gateway (پراکسی چندمدلی)**: `AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: شناسه حساب، شناسه Gateway، و `CLOUDFLARE_AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway)
    - **MiniMax**: پیکربندی به‌صورت خودکار نوشته می‌شود؛ پیش‌فرض میزبانی‌شده `MiniMax-M2.7` است.
      راه‌اندازی با کلید API از `minimax/...` استفاده می‌کند، و راه‌اندازی OAuth از
      `minimax-portal/...` استفاده می‌کند.
    - جزئیات بیشتر: [MiniMax](/fa/providers/minimax)
    - **StepFun**: پیکربندی برای StepFun standard یا Step Plan روی endpointهای چین یا جهانی به‌صورت خودکار نوشته می‌شود.
    - Standard در حال حاضر شامل `step-3.5-flash` است، و Step Plan همچنین شامل `step-3.5-flash-2603` است.
    - جزئیات بیشتر: [StepFun](/fa/providers/stepfun)
    - **Synthetic (سازگار با Anthropic)**: `SYNTHETIC_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Synthetic](/fa/providers/synthetic)
    - **Moonshot (Kimi K2)**: پیکربندی به‌صورت خودکار نوشته می‌شود.
    - **Kimi Coding**: پیکربندی به‌صورت خودکار نوشته می‌شود.
    - جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot)
    - **رد کردن**: هنوز احراز هویتی پیکربندی نشده است.
    - یک مدل پیش‌فرض را از گزینه‌های شناسایی‌شده انتخاب کنید (یا provider/model را به‌صورت دستی وارد کنید). برای بهترین کیفیت و ریسک کمتر prompt-injection، قوی‌ترین مدل نسل جدیدِ موجود در مجموعه ارائه‌دهنده خود را انتخاب کنید.
    - راه‌اندازی اولیه یک بررسی مدل اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا احراز هویت نداشته باشد هشدار می‌دهد.
    - حالت ذخیره‌سازی کلید API به‌طور پیش‌فرض مقادیر auth-profile متن ساده است. از `--secret-input-mode ref` استفاده کنید تا به‌جای آن refهای متکی به env ذخیره شوند (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - پروفایل‌های احراز هویت در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (کلیدهای API + OAuth). `~/.openclaw/credentials/oauth.json` فقط برای import قدیمی است.
    - جزئیات بیشتر: [/concepts/oauth](/fa/concepts/oauth)
    <Note>
    نکته headless/server: OAuth را روی ماشینی با مرورگر کامل کنید، سپس
    `auth-profiles.json` آن agent را (برای مثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
    `$OPENCLAW_STATE_DIR/...`) به میزبان gateway کپی کنید. `credentials/oauth.json`
    فقط یک منبع import قدیمی است.
    </Note>
  </Step>
  <Step title="Workspace">
    - پیش‌فرض `~/.openclaw/workspace` (قابل پیکربندی).
    - فایل‌های workspace موردنیاز برای آیین bootstrap عامل را seed می‌کند.
    - چیدمان کامل workspace + راهنمای پشتیبان‌گیری: [Workspace عامل](/fa/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - پورت، bind، حالت احراز هویت، نمایش Tailscale.
    - توصیه احراز هویت: حتی برای loopback نیز **Token** را نگه دارید تا کلاینت‌های محلی WS مجبور به احراز هویت باشند.
    - در حالت token، راه‌اندازی تعاملی این موارد را ارائه می‌دهد:
      - **تولید/ذخیره token متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (اختیاری)
      - Quickstart از SecretRefهای موجود `gateway.auth.token` در ارائه‌دهندگان `env`، `file`، و `exec` برای probe راه‌اندازی اولیه/dashboard bootstrap دوباره استفاده می‌کند.
      - اگر آن SecretRef پیکربندی شده باشد اما قابل resolve نباشد، راه‌اندازی اولیه به‌جای کاهش بی‌صدای سطح احراز هویت runtime، زودتر با پیام اصلاح روشن fail می‌شود.
    - در حالت password، راه‌اندازی تعاملی از ذخیره‌سازی متن ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک env var غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
      - نمی‌تواند با `--gateway-token` ترکیب شود.
    - فقط اگر به همه فرایندهای محلی کاملا اعتماد دارید، احراز هویت را غیرفعال کنید.
    - bindهای غیر local loopback همچنان به احراز هویت نیاز دارند.

  </Step>
  <Step title="کانال‌ها">
    - [WhatsApp](/fa/channels/whatsapp): ورود QR اختیاری.
    - [Telegram](/fa/channels/telegram): توکن ربات.
    - [Discord](/fa/channels/discord): توکن ربات.
    - [Google Chat](/fa/channels/googlechat): JSON حساب سرویس + مخاطب Webhook.
    - [Mattermost](/fa/channels/mattermost) (Plugin): توکن ربات + URL پایه.
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب.
    - [BlueBubbles](/fa/channels/bluebubbles): **برای iMessage توصیه می‌شود**؛ URL سرور + گذرواژه + Webhook.
    - [iMessage](/fa/channels/imessage): مسیر قدیمی CLI `imsg` + دسترسی DB.
    - امنیت DM: پیش‌فرض جفت‌سازی است. نخستین DM یک کد ارسال می‌کند؛ از طریق `openclaw pairing approve <channel> <code>` تأیید کنید یا از allowlistها استفاده کنید.

  </Step>
  <Step title="جست‌وجوی وب">
    - یک ارائه‌دهنده پشتیبانی‌شده مانند Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Perplexity، SearXNG، یا Tavily را انتخاب کنید (یا رد کنید).
    - ارائه‌دهندگان متکی به API می‌توانند برای راه‌اندازی سریع از env varها یا پیکربندی موجود استفاده کنند؛ ارائه‌دهندگان بدون کلید به‌جای آن از پیش‌نیازهای اختصاصی ارائه‌دهنده خود استفاده می‌کنند.
    - با `--skip-search` رد کنید.
    - بعدا پیکربندی کنید: `openclaw configure --section web`.

  </Step>
  <Step title="نصب daemon">
    - macOS: LaunchAgent
      - به نشست کاربری واردشده نیاز دارد؛ برای headless، از یک LaunchDaemon سفارشی استفاده کنید (همراه محصول ارائه نمی‌شود).
    - Linux (و Windows از طریق WSL2): واحد کاربری systemd
      - راه‌اندازی اولیه تلاش می‌کند lingering را از طریق `loginctl enable-linger <user>` فعال کند تا Gateway پس از خروج نیز بالا بماند.
      - ممکن است sudo درخواست کند (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - **انتخاب runtime:** Node (توصیه‌شده؛ برای WhatsApp/Telegram لازم است). Bun **توصیه نمی‌شود**.
    - اگر احراز هویت token به token نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب daemon آن را اعتبارسنجی می‌کند اما مقادیر token متن ساده resolveشده را در فراداده محیط سرویس supervisor پایدار نمی‌کند.
    - اگر احراز هویت token به token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، نصب daemon با راهنمایی قابل اقدام مسدود می‌شود.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب daemon تا زمانی که mode صراحتا تنظیم شود مسدود می‌شود.

  </Step>
  <Step title="بررسی سلامت">
    - Gateway را (در صورت نیاز) شروع می‌کند و `openclaw health` را اجرا می‌کند.
    - نکته: `openclaw status --deep` probe سلامت gateway زنده را به خروجی status اضافه می‌کند، از جمله probeهای کانال در صورت پشتیبانی (به gateway قابل دسترس نیاز دارد).

  </Step>
  <Step title="Skills (توصیه‌شده)">
    - Skills موجود را می‌خواند و الزامات را بررسی می‌کند.
    - اجازه می‌دهد یک مدیر node انتخاب کنید: **npm / pnpm** (bun توصیه نمی‌شود).
    - وابستگی‌های اختیاری را نصب می‌کند (برخی از Homebrew روی macOS استفاده می‌کنند).

  </Step>
  <Step title="پایان">
    - خلاصه + گام‌های بعدی، شامل برنامه‌های iOS/Android/macOS برای قابلیت‌های بیشتر.

  </Step>
</Steps>

<Note>
اگر هیچ GUI شناسایی نشود، راه‌اندازی اولیه به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward را برای Control UI چاپ می‌کند.
اگر assetهای Control UI موجود نباشند، راه‌اندازی اولیه تلاش می‌کند آن‌ها را build کند؛ fallback برابر `pnpm ui:build` است (وابستگی‌های UI را به‌صورت خودکار نصب می‌کند).
</Note>

## حالت غیرتعاملی

برای خودکارسازی یا اسکریپت کردن راه‌اندازی اولیه از `--non-interactive` استفاده کنید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

برای خلاصه قابل خواندن توسط ماشین، `--json` را اضافه کنید.

SecretRef توکن Gateway در حالت غیرتعاملی:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` و `--gateway-token-ref-env` ناسازگارند.

<Note>
`--json` به‌معنای حالت غیرتعاملی **نیست**. برای اسکریپت‌ها از `--non-interactive` (و `--workspace`) استفاده کنید.
</Note>

نمونه‌های فرمان اختصاصی ارائه‌دهنده در [خودکارسازی CLI](/fa/start/wizard-cli-automation#provider-specific-examples) قرار دارند.
از این صفحه مرجع برای معنای flagها و ترتیب گام‌ها استفاده کنید.

### افزودن agent (غیرتعاملی)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC ویزارد Gateway

Gateway جریان راه‌اندازی اولیه را از طریق RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`) ارائه می‌دهد.
کلاینت‌ها (برنامه macOS، Control UI) می‌توانند گام‌ها را بدون پیاده‌سازی دوباره منطق راه‌اندازی اولیه render کنند.

## راه‌اندازی Signal (signal-cli)

راه‌اندازی اولیه می‌تواند `signal-cli` را از releaseهای GitHub نصب کند:

- asset نسخه مناسب را دانلود می‌کند.
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند.
- `channels.signal.cliPath` را در پیکربندی شما می‌نویسد.

نکات:

- buildهای JVM به **Java 21** نیاز دارند.
- وقتی buildهای native موجود باشند، از آن‌ها استفاده می‌شود.
- Windows از WSL2 استفاده می‌کند؛ نصب signal-cli جریان Linux را داخل WSL دنبال می‌کند.

## آنچه wizard می‌نویسد

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (راه‌اندازی اولیه محلی، وقتی تنظیم نشده باشد، به `"coding"` پیش‌فرض می‌شود؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (mode، bind، auth، tailscale)
- `session.dmScope` (جزئیات رفتار: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Slack/Discord/Matrix/Microsoft Teams) وقتی در طول اعلان‌ها فعال‌سازی را انتخاب می‌کنید (نام‌ها در صورت امکان به ID تبدیل می‌شوند).
- `skills.install.nodeManager`
  - `setup --node-manager` مقدارهای `npm`، `pnpm`، یا `bun` را می‌پذیرد.
  - پیکربندی دستی همچنان می‌تواند با تنظیم مستقیم `skills.install.nodeManager` از `yarn` استفاده کند.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` مقدار `agents.list[]` و `bindings` اختیاری را می‌نویسد.

اعتبارنامه‌های WhatsApp زیر `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرند.
نشست‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` ذخیره می‌شوند.

برخی کانال‌ها به‌صورت Plugin ارائه می‌شوند. وقتی در طول راه‌اندازی یکی را انتخاب می‌کنید، فرایند راه‌اندازی اولیه
پیش از پیکربندی آن، از شما می‌خواهد آن را نصب کنید (npm یا یک مسیر محلی).

## مستندات مرتبط

- نمای کلی راه‌اندازی اولیه: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- راه‌اندازی اولیه اپ macOS: [راه‌اندازی اولیه](/fa/start/onboarding)
- مرجع پیکربندی: [پیکربندی Gateway](/fa/gateway/configuration)
- ارائه‌دهندگان: [WhatsApp](/fa/channels/whatsapp)، [Telegram](/fa/channels/telegram)، [Discord](/fa/channels/discord)، [Google Chat](/fa/channels/googlechat)، [Signal](/fa/channels/signal)، [BlueBubbles](/fa/channels/bluebubbles) (iMessage)، [iMessage](/fa/channels/imessage) (قدیمی)
- Skills: [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)
