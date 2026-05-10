---
read_when:
    - جست‌وجوی یک گام راه‌اندازی اولیه یا پرچم مشخص
    - خودکارسازی راه‌اندازی اولیه با حالت غیرتعاملی
    - اشکال‌زدایی رفتار راه‌اندازی اولیه
sidebarTitle: Onboarding Reference
summary: 'مرجع کامل برای راه‌اندازی اولیه CLI: هر مرحله، گزینه و فیلد پیکربندی'
title: مرجع راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-05-10T20:07:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: be3e45f152700f02a212a390cdc02d5432ff531716a089f531de3bb6cc368cc9
    source_path: reference/wizard.md
    workflow: 16
---

این مرجع کامل برای `openclaw onboard` است.
برای مرور کلی سطح بالا، [Onboarding (CLI)](/fa/start/wizard) را ببینید.

## جزئیات جریان (حالت محلی)

<Steps>
  <Step title="Existing config detection">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، **مقادیر فعلی را نگه دارید**، **بازبینی و به‌روزرسانی**، یا **بازنشانی پیش از راه‌اندازی** را انتخاب کنید.
    - اجرای دوباره onboarding هیچ‌چیز را پاک **نمی‌کند** مگر اینکه صراحتا **Reset**
      را انتخاب کنید (یا `--reset` را پاس دهید).
    - `--reset` در CLI به‌طور پیش‌فرض روی `config+creds+sessions` است؛ از `--reset-scope full`
      استفاده کنید تا workspace هم حذف شود.
    - اگر config نامعتبر باشد یا کلیدهای قدیمی داشته باشد، wizard متوقف می‌شود و از شما می‌خواهد
      پیش از ادامه `openclaw doctor` را اجرا کنید.
    - Reset از `trash` استفاده می‌کند (هرگز `rm`) و این دامنه‌ها را ارائه می‌دهد:
      - فقط config
      - Config + credentials + sessions
      - بازنشانی کامل (workspace را هم حذف می‌کند)

  </Step>
  <Step title="Model/Auth">
    - **کلید API Anthropic**: اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند، یا کلید را درخواست می‌کند، سپس آن را برای استفاده daemon ذخیره می‌کند.
    - **کلید API Anthropic**: گزینه ترجیحی دستیار Anthropic در onboarding/configure.
    - **setup-token Anthropic**: هنوز در onboarding/configure در دسترس است، هرچند OpenClaw اکنون هنگام امکان، استفاده دوباره از Claude CLI را ترجیح می‌دهد.
    - **اشتراک OpenAI Code (Codex) (OAuth)**: جریان مرورگر؛ `code#state` را جای‌گذاری کنید.
      - وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime کدکس روی `openai/gpt-5.5` تنظیم می‌کند.
    - **اشتراک OpenAI Code (Codex) (جفت‌سازی دستگاه)**: جریان جفت‌سازی مرورگر با یک کد دستگاه کوتاه‌عمر.
      - وقتی مدل تنظیم نشده باشد یا از قبل از خانواده OpenAI باشد، `agents.defaults.model` را از طریق runtime کدکس روی `openai/gpt-5.5` تنظیم می‌کند.
    - **کلید API OpenAI**: اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند، یا کلید را درخواست می‌کند، سپس آن را در پروفایل‌های auth ذخیره می‌کند.
      - وقتی مدل تنظیم نشده باشد، `openai/*` باشد، یا `openai-codex/*` باشد، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.
    - **کلید API xAI (Grok)**: `XAI_API_KEY` را درخواست می‌کند و xAI را به‌عنوان provider مدل پیکربندی می‌کند.
    - **OpenCode**: `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`، آن را از https://opencode.ai/auth بگیرید) را درخواست می‌کند و به شما اجازه می‌دهد catalog Zen یا Go را انتخاب کنید.
    - **Ollama**: ابتدا **Cloud + Local**، **Cloud only**، یا **Local only** را ارائه می‌دهد. `Cloud only` کلید `OLLAMA_API_KEY` را درخواست می‌کند و از `https://ollama.com` استفاده می‌کند؛ حالت‌های متکی به host، URL پایه Ollama را درخواست می‌کنند، مدل‌های موجود را کشف می‌کنند، و در صورت نیاز مدل محلی انتخاب‌شده را به‌طور خودکار pull می‌کنند؛ `Cloud + Local` همچنین بررسی می‌کند که آیا آن host مربوط به Ollama برای دسترسی cloud وارد حساب شده است یا نه.
    - جزئیات بیشتر: [Ollama](/fa/providers/ollama)
    - **کلید API**: کلید را برای شما ذخیره می‌کند.
    - **Vercel AI Gateway (proxy چندمدلی)**: `AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID، Gateway ID، و `CLOUDFLARE_AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway)
    - **MiniMax**: config به‌طور خودکار نوشته می‌شود؛ پیش‌فرض میزبانی‌شده `MiniMax-M2.7` است.
      راه‌اندازی کلید API از `minimax/...` استفاده می‌کند، و راه‌اندازی OAuth از
      `minimax-portal/...` استفاده می‌کند.
    - جزئیات بیشتر: [MiniMax](/fa/providers/minimax)
    - **StepFun**: config برای StepFun استاندارد یا Step Plan روی endpointهای چین یا جهانی به‌طور خودکار نوشته می‌شود.
    - استاندارد در حال حاضر شامل `step-3.5-flash` است، و Step Plan همچنین شامل `step-3.5-flash-2603` است.
    - جزئیات بیشتر: [StepFun](/fa/providers/stepfun)
    - **Synthetic (سازگار با Anthropic)**: `SYNTHETIC_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Synthetic](/fa/providers/synthetic)
    - **Moonshot (Kimi K2)**: config به‌طور خودکار نوشته می‌شود.
    - **Kimi Coding**: config به‌طور خودکار نوشته می‌شود.
    - جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot)
    - **رد کردن**: هنوز هیچ auth پیکربندی نشده است.
    - یک مدل پیش‌فرض را از گزینه‌های شناسایی‌شده انتخاب کنید (یا provider/model را دستی وارد کنید). برای بهترین کیفیت و کاهش ریسک prompt-injection، قوی‌ترین مدل نسل جدید موجود در پشته provider خود را انتخاب کنید.
    - Onboarding یک بررسی مدل اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا auth نداشته باشد، هشدار می‌دهد.
    - حالت ذخیره‌سازی کلید API به‌طور پیش‌فرض مقادیر auth-profile متن ساده است. برای ذخیره refهای متکی به env به‌جای آن، از `--secret-input-mode ref` استفاده کنید (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - پروفایل‌های auth در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (کلیدهای API + OAuth). `~/.openclaw/credentials/oauth.json` فقط برای import قدیمی است.
    - جزئیات بیشتر: [/concepts/oauth](/fa/concepts/oauth)
    <Note>
    نکته برای حالت headless/server: OAuth را روی دستگاهی با مرورگر کامل کنید، سپس
    `auth-profiles.json` همان agent را (برای مثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
    `$OPENCLAW_STATE_DIR/...`) به host مربوط به gateway کپی کنید. `credentials/oauth.json`
    فقط یک منبع import قدیمی است.
    </Note>
  </Step>
  <Step title="Workspace">
    - پیش‌فرض `~/.openclaw/workspace` (قابل پیکربندی).
    - فایل‌های workspace لازم برای آیین bootstrap agent را seed می‌کند.
    - چیدمان کامل workspace + راهنمای پشتیبان‌گیری: [Agent workspace](/fa/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port، bind، حالت auth، نمایش از طریق Tailscale.
    - توصیه auth: حتی برای loopback هم **Token** را نگه دارید تا clientهای WS محلی ملزم به احراز هویت باشند.
    - در حالت token، راه‌اندازی تعاملی این گزینه‌ها را ارائه می‌دهد:
      - **تولید/ذخیره token متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (انتخابی)
      - Quickstart از SecretRefهای موجود `gateway.auth.token` در providerهای `env`، `file`، و `exec` برای probe onboarding/dashboard bootstrap استفاده دوباره می‌کند.
      - اگر آن SecretRef پیکربندی شده باشد اما قابل resolve نباشد، onboarding به‌جای افت بی‌صدای auth زمان اجرا، زودتر با یک پیام رفع مشکل روشن شکست می‌خورد.
    - در حالت password، راه‌اندازی تعاملی همچنین ذخیره‌سازی متن ساده یا SecretRef را پشتیبانی می‌کند.
    - مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک env var غیرخالی در محیط پردازش onboarding نیاز دارد.
      - نمی‌تواند با `--gateway-token` ترکیب شود.
    - auth را فقط زمانی غیرفعال کنید که به همه پردازش‌های محلی کاملا اعتماد دارید.
    - bindهای غیر loopback همچنان به auth نیاز دارند.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/fa/channels/whatsapp): ورود اختیاری با QR.
    - [Telegram](/fa/channels/telegram): توکن bot.
    - [Discord](/fa/channels/discord): توکن bot.
    - [Google Chat](/fa/channels/googlechat): JSON حساب service + مخاطب webhook.
    - [Mattermost](/fa/channels/mattermost) (plugin): توکن bot + URL پایه.
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + config حساب.
    - [iMessage](/fa/channels/imessage): مسیر CLI `imsg` + دسترسی به Messages DB؛ وقتی Gateway خارج از Mac اجرا می‌شود از یک wrapper SSH استفاده کنید.
    - امنیت DM: پیش‌فرض جفت‌سازی است. نخستین DM یک کد می‌فرستد؛ با `openclaw pairing approve <channel> <code>` تأیید کنید یا از allowlistها استفاده کنید.

  </Step>
  <Step title="Web search">
    - یک provider پشتیبانی‌شده مانند Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Perplexity، SearXNG، یا Tavily را انتخاب کنید (یا رد کنید).
    - providerهای متکی به API می‌توانند از env varها یا config موجود برای راه‌اندازی سریع استفاده کنند؛ providerهای بدون کلید به‌جای آن از پیش‌نیازهای خاص provider خود استفاده می‌کنند.
    - با `--skip-search` رد کنید.
    - پیکربندی بعدا: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - به session کاربر واردشده نیاز دارد؛ برای headless، از یک LaunchDaemon سفارشی استفاده کنید (ارائه نشده).
    - Linux (و Windows از طریق WSL2): systemd user unit
      - Onboarding تلاش می‌کند lingering را از طریق `loginctl enable-linger <user>` فعال کند تا Gateway پس از logout فعال بماند.
      - ممکن است sudo درخواست کند (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - **انتخاب runtime:** Node (توصیه‌شده؛ برای WhatsApp/Telegram الزامی). Bun **توصیه نمی‌شود**.
    - اگر auth توکنی به token نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب daemon آن را اعتبارسنجی می‌کند اما مقدارهای token متن ساده resolveشده را در metadata محیط سرویس supervisor پایدار نمی‌کند.
    - اگر auth توکنی به token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolveنشده باشد، نصب daemon با راهنمایی قابل اقدام مسدود می‌شود.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب daemon تا زمانی که mode صریحا تنظیم شود مسدود می‌شود.

  </Step>
  <Step title="Health check">
    - Gateway را شروع می‌کند (در صورت نیاز) و `openclaw health` را اجرا می‌کند.
    - نکته: `openclaw status --deep` probe سلامت gateway زنده را به خروجی status اضافه می‌کند، شامل probeهای channel وقتی پشتیبانی شوند (به gateway قابل دسترسی نیاز دارد).

  </Step>
  <Step title="Skills (recommended)">
    - Skills موجود را می‌خواند و نیازمندی‌ها را بررسی می‌کند.
    - به شما اجازه می‌دهد یک manager برای node انتخاب کنید: **npm / pnpm** (bun توصیه نمی‌شود).
    - وابستگی‌های اختیاری را نصب می‌کند (برخی در macOS از Homebrew استفاده می‌کنند).

  </Step>
  <Step title="Finish">
    - خلاصه + گام‌های بعدی، شامل prompt **می‌خواهید agent خود را چطور hatch کنید؟** برای Terminal، Browser، یا بعدا.

  </Step>
</Steps>

<Note>
اگر هیچ GUI شناسایی نشود، onboarding به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward را برای Control UI چاپ می‌کند.
اگر assetهای Control UI وجود نداشته باشند، onboarding تلاش می‌کند آن‌ها را بسازد؛ fallback برابر `pnpm ui:build` است (وابستگی‌های UI را خودکار نصب می‌کند).
</Note>

## حالت غیرتعاملی

برای خودکارسازی یا اسکریپت‌نویسی onboarding از `--non-interactive` استفاده کنید:

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

`--gateway-token` و `--gateway-token-ref-env` با یکدیگر ناسازگارند.

<Note>
`--json` به معنی حالت غیرتعاملی **نیست**. برای اسکریپت‌ها از `--non-interactive` (و `--workspace`) استفاده کنید.
</Note>

نمونه‌های دستور مخصوص provider در [CLI Automation](/fa/start/wizard-cli-automation#provider-specific-examples) قرار دارند.
از این صفحه مرجع برای معنای flagها و ترتیب stepها استفاده کنید.

### افزودن agent (غیرتعاملی)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC wizard مربوط به Gateway

Gateway جریان onboarding را از طریق RPC (`wizard.start`، `wizard.next`، `wizard.cancel`، `wizard.status`) در معرض استفاده قرار می‌دهد.
Clientها (app macOS، Control UI) می‌توانند stepها را بدون پیاده‌سازی دوباره منطق onboarding نمایش دهند.

## راه‌اندازی Signal (signal-cli)

Onboarding می‌تواند `signal-cli` را از releaseهای GitHub نصب کند:

- asset مناسب release را دانلود می‌کند.
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند.
- `channels.signal.cliPath` را در config شما می‌نویسد.

نکته‌ها:

- buildهای JVM به **Java 21** نیاز دارند.
- وقتی buildهای native موجود باشند، از آن‌ها استفاده می‌شود.
- Windows از WSL2 استفاده می‌کند؛ نصب signal-cli جریان Linux را داخل WSL دنبال می‌کند.

## آنچه wizard می‌نویسد

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (مقدار پیش‌فرض راه‌اندازی محلی، وقتی تنظیم نشده باشد، `"coding"` است؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، bind، احراز هویت، tailscale)
- `session.dmScope` (جزئیات رفتار: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Slack/Discord/Matrix/Microsoft Teams) وقتی در طول اعلان‌ها انتخابشان می‌کنید (نام‌ها در صورت امکان به شناسه‌ها تبدیل می‌شوند).
- `skills.install.nodeManager`
  - `setup --node-manager` مقدارهای `npm`، `pnpm` یا `bun` را می‌پذیرد.
  - پیکربندی دستی همچنان می‌تواند با تنظیم مستقیم `skills.install.nodeManager` از `yarn` استفاده کند.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` مقدارهای `agents.list[]` و `bindings` اختیاری را می‌نویسد.

اعتبارنامه‌های WhatsApp زیر `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرند.
نشست‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` ذخیره می‌شوند.

برخی کانال‌ها به‌صورت Plugin ارائه می‌شوند. وقتی یکی را هنگام راه‌اندازی انتخاب کنید، فرایند راه‌اندازی
پیش از امکان پیکربندی آن، برای نصب آن (npm یا یک مسیر محلی) از شما درخواست می‌کند.

## مستندات مرتبط

- نمای کلی راه‌اندازی: [راه‌اندازی (CLI)](/fa/start/wizard)
- راه‌اندازی برنامه macOS: [راه‌اندازی](/fa/start/onboarding)
- مرجع پیکربندی: [پیکربندی Gateway](/fa/gateway/configuration)
- ارائه‌دهندگان: [WhatsApp](/fa/channels/whatsapp)، [Telegram](/fa/channels/telegram)، [Discord](/fa/channels/discord)، [Google Chat](/fa/channels/googlechat)، [Signal](/fa/channels/signal)، [iMessage](/fa/channels/imessage)
- Skills: [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)
