---
read_when:
    - جست‌وجوی یک مرحلهٔ مشخص از راه‌اندازی اولیه یا پرچم
    - خودکارسازی راه‌اندازی اولیه با حالت غیرتعاملی
    - اشکال‌زدایی رفتار راه‌اندازی اولیه
sidebarTitle: Onboarding Reference
summary: 'مرجع کامل برای راه‌اندازی اولیهٔ CLI: هر مرحله، پرچم و فیلد پیکربندی'
title: مرجع راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-05-06T09:42:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

این مرجع کامل `openclaw onboard` است.
برای نمای کلی سطح بالا، [Onboarding (CLI)](/fa/start/wizard) را ببینید.

## جزئیات جریان (حالت محلی)

<Steps>
  <Step title="Existing config detection">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، **Keep / Modify / Reset** را انتخاب کنید.
    - اجرای دوبارهٔ راه‌اندازی اولیه هیچ چیزی را پاک **نمی‌کند**، مگر اینکه صراحتاً **Reset**
      را انتخاب کنید (یا `--reset` را پاس بدهید).
    - مقدار پیش‌فرض CLI `--reset` برابر `config+creds+sessions` است؛ برای حذف workspace نیز از `--reset-scope full`
      استفاده کنید.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، ویزارد متوقف می‌شود و پیش از ادامه
      از شما می‌خواهد `openclaw doctor` را اجرا کنید.
    - Reset از `trash` استفاده می‌کند (هرگز `rm`) و این دامنه‌ها را ارائه می‌دهد:
      - فقط پیکربندی
      - پیکربندی + credentials + sessions
      - بازنشانی کامل (workspace را هم حذف می‌کند)

  </Step>
  <Step title="Model/Auth">
    - **کلید Anthropic API**: اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند، یا کلید را درخواست می‌کند، سپس آن را برای استفادهٔ daemon ذخیره می‌کند.
    - **کلید Anthropic API**: انتخاب ترجیحی دستیار Anthropic در onboarding/configure.
    - **Anthropic setup-token**: همچنان در onboarding/configure در دسترس است، هرچند OpenClaw اکنون هنگام در دسترس بودن، استفادهٔ مجدد از Claude CLI را ترجیح می‌دهد.
    - **اشتراک OpenAI Code (Codex) (OAuth)**: جریان مرورگر؛ `code#state` را جای‌گذاری کنید.
      - وقتی مدل تنظیم نشده باشد یا از قبل متعلق به خانوادهٔ OpenAI باشد، `agents.defaults.model` را روی `openai-codex/gpt-5.5` تنظیم می‌کند.
    - **اشتراک OpenAI Code (Codex) (device pairing)**: جریان جفت‌سازی مرورگر با یک کد دستگاه کوتاه‌عمر.
      - وقتی مدل تنظیم نشده باشد یا از قبل متعلق به خانوادهٔ OpenAI باشد، `agents.defaults.model` را روی `openai-codex/gpt-5.5` تنظیم می‌کند.
    - **کلید OpenAI API**: اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند، یا کلید را درخواست می‌کند، سپس آن را در پروفایل‌های احراز هویت ذخیره می‌کند.
      - وقتی مدل تنظیم نشده باشد، `openai/*` باشد، یا `openai-codex/*` باشد، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.
    - **کلید xAI (Grok) API**: `XAI_API_KEY` را درخواست می‌کند و xAI را به‌عنوان ارائه‌دهندهٔ مدل پیکربندی می‌کند.
    - **OpenCode**: `OPENCODE_API_KEY` را درخواست می‌کند (یا `OPENCODE_ZEN_API_KEY`، آن را از https://opencode.ai/auth بگیرید) و اجازه می‌دهد کاتالوگ Zen یا Go را انتخاب کنید.
    - **Ollama**: ابتدا **Cloud + Local**، **Cloud only**، یا **Local only** را ارائه می‌دهد. `Cloud only`، `OLLAMA_API_KEY` را درخواست می‌کند و از `https://ollama.com` استفاده می‌کند؛ حالت‌های متکی به میزبان، URL پایهٔ Ollama را درخواست می‌کنند، مدل‌های موجود را کشف می‌کنند، و در صورت نیاز مدل محلی انتخاب‌شده را به‌طور خودکار pull می‌کنند؛ `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی cloud وارد شده است یا نه.
    - جزئیات بیشتر: [Ollama](/fa/providers/ollama)
    - **کلید API**: کلید را برای شما ذخیره می‌کند.
    - **Vercel AI Gateway (پروکسی چندمدلی)**: `AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID، Gateway ID، و `CLOUDFLARE_AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway)
    - **MiniMax**: پیکربندی به‌طور خودکار نوشته می‌شود؛ پیش‌فرض میزبانی‌شده `MiniMax-M2.7` است.
      راه‌اندازی با کلید API از `minimax/...` استفاده می‌کند، و راه‌اندازی OAuth از
      `minimax-portal/...`.
    - جزئیات بیشتر: [MiniMax](/fa/providers/minimax)
    - **StepFun**: پیکربندی برای StepFun استاندارد یا Step Plan روی endpointهای چین یا جهانی به‌طور خودکار نوشته می‌شود.
    - استاندارد در حال حاضر شامل `step-3.5-flash` است، و Step Plan نیز شامل `step-3.5-flash-2603` است.
    - جزئیات بیشتر: [StepFun](/fa/providers/stepfun)
    - **Synthetic (سازگار با Anthropic)**: `SYNTHETIC_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Synthetic](/fa/providers/synthetic)
    - **Moonshot (Kimi K2)**: پیکربندی به‌طور خودکار نوشته می‌شود.
    - **Kimi Coding**: پیکربندی به‌طور خودکار نوشته می‌شود.
    - جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot)
    - **Skip**: هنوز احراز هویتی پیکربندی نشده است.
    - یک مدل پیش‌فرض از گزینه‌های شناسایی‌شده انتخاب کنید (یا provider/model را دستی وارد کنید). برای بهترین کیفیت و ریسک کمتر prompt-injection، قوی‌ترین مدل نسل جدید موجود در پشتهٔ ارائه‌دهندهٔ خود را انتخاب کنید.
    - Onboarding یک بررسی مدل اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا احراز هویت نداشته باشد، هشدار می‌دهد.
    - حالت ذخیره‌سازی کلید API به‌طور پیش‌فرض مقادیر plaintext auth-profile است. برای ذخیرهٔ refs متکی به env به‌جای آن، از `--secret-input-mode ref` استفاده کنید (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - پروفایل‌های احراز هویت در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (کلیدهای API + OAuth). `~/.openclaw/credentials/oauth.json` فقط برای import قدیمی است.
    - جزئیات بیشتر: [/concepts/oauth](/fa/concepts/oauth)
    <Note>
    نکتهٔ headless/server: OAuth را روی ماشینی که مرورگر دارد کامل کنید، سپس
    `auth-profiles.json` آن agent را (برای مثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
    `$OPENCLAW_STATE_DIR/...`) به میزبان Gateway کپی کنید. `credentials/oauth.json`
    فقط یک منبع import قدیمی است.
    </Note>
  </Step>
  <Step title="Workspace">
    - پیش‌فرض `~/.openclaw/workspace` (قابل پیکربندی).
    - فایل‌های workspace لازم برای آیین bootstrap عامل را آماده می‌کند.
    - چیدمان کامل workspace + راهنمای backup: [workspace عامل](/fa/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port، bind، حالت احراز هویت، نمایش از طریق Tailscale.
    - توصیهٔ احراز هویت: حتی برای loopback هم **Token** را نگه دارید تا کلاینت‌های WS محلی مجبور به احراز هویت باشند.
    - در حالت token، راه‌اندازی تعاملی این گزینه‌ها را ارائه می‌دهد:
      - **تولید/ذخیرهٔ token به‌صورت plaintext** (پیش‌فرض)
      - **استفاده از SecretRef** (opt-in)
      - Quickstart از SecretRefهای موجود `gateway.auth.token` در providerهای `env`، `file`، و `exec` برای probe/dashboard bootstrap در onboarding دوباره استفاده می‌کند.
      - اگر آن SecretRef پیکربندی شده باشد اما قابل resolve نباشد، onboarding به‌جای کاهش بی‌صدای auth زمان اجرا، زودتر با یک پیام اصلاح روشن شکست می‌خورد.
    - در حالت password، راه‌اندازی تعاملی از ذخیره‌سازی plaintext یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef غیرتعاملی token: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک متغیر env غیرخالی در محیط فرایند onboarding نیاز دارد.
      - نمی‌تواند با `--gateway-token` ترکیب شود.
    - auth را فقط زمانی غیرفعال کنید که به همهٔ فرایندهای محلی کاملاً اعتماد دارید.
    - bindهای غیر loopback همچنان به auth نیاز دارند.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/fa/channels/whatsapp): ورود اختیاری با QR.
    - [Telegram](/fa/channels/telegram): bot token.
    - [Discord](/fa/channels/discord): bot token.
    - [Google Chat](/fa/channels/googlechat): service account JSON + webhook audience.
    - [Mattermost](/fa/channels/mattermost) (Plugin): bot token + base URL.
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب.
    - [BlueBubbles](/fa/channels/bluebubbles): **برای iMessage توصیه می‌شود**؛ server URL + password + webhook.
    - [iMessage](/fa/channels/imessage): مسیر legacy `imsg` CLI + دسترسی DB.
    - امنیت DM: پیش‌فرض pairing است. نخستین DM یک کد می‌فرستد؛ با `openclaw pairing approve <channel> <code>` تأیید کنید یا از allowlistها استفاده کنید.

  </Step>
  <Step title="Web search">
    - یک ارائه‌دهندهٔ پشتیبانی‌شده مانند Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Perplexity، SearXNG، یا Tavily را انتخاب کنید (یا رد کنید).
    - ارائه‌دهندگان متکی به API می‌توانند برای راه‌اندازی سریع از متغیرهای env یا پیکربندی موجود استفاده کنند؛ ارائه‌دهندگان بدون کلید به پیش‌نیازهای اختصاصی provider خودشان متکی هستند.
    - با `--skip-search` رد کنید.
    - بعداً پیکربندی کنید: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - به یک session کاربر واردشده نیاز دارد؛ برای headless، از LaunchDaemon سفارشی استفاده کنید (ارائه نشده است).
    - Linux (و Windows از طریق WSL2): systemd user unit
      - Onboarding تلاش می‌کند lingering را از طریق `loginctl enable-linger <user>` فعال کند تا Gateway پس از logout هم بالا بماند.
      - ممکن است sudo درخواست کند (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - **انتخاب runtime:** Node (توصیه‌شده؛ برای WhatsApp/Telegram لازم است). Bun **توصیه نمی‌شود**.
    - اگر auth با token به token نیاز داشته باشد و `gateway.auth.token` توسط SecretRef مدیریت شود، نصب daemon آن را اعتبارسنجی می‌کند اما مقادیر token plaintext resolve‌شده را در metadata محیط سرویس supervisor پایدار نمی‌کند.
    - اگر auth با token به token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، نصب daemon با راهنمایی قابل اقدام مسدود می‌شود.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب daemon تا زمانی که mode صراحتاً تنظیم شود مسدود می‌شود.

  </Step>
  <Step title="Health check">
    - Gateway را (در صورت نیاز) شروع می‌کند و `openclaw health` را اجرا می‌کند.
    - نکته: `openclaw status --deep` probe سلامت زندهٔ gateway را به خروجی status اضافه می‌کند، شامل probeهای channel در صورت پشتیبانی (به gateway قابل دسترسی نیاز دارد).

  </Step>
  <Step title="Skills (recommended)">
    - Skills موجود را می‌خواند و requirements را بررسی می‌کند.
    - اجازه می‌دهد یک node manager انتخاب کنید: **npm / pnpm** (bun توصیه نمی‌شود).
    - وابستگی‌های اختیاری را نصب می‌کند (بعضی از Homebrew روی macOS استفاده می‌کنند).

  </Step>
  <Step title="Finish">
    - خلاصه + مراحل بعدی، شامل برنامه‌های iOS/Android/macOS برای قابلیت‌های بیشتر.

  </Step>
</Steps>

<Note>
اگر هیچ GUI شناسایی نشود، onboarding به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward را برای Control UI چاپ می‌کند.
اگر assetهای Control UI موجود نباشند، onboarding تلاش می‌کند آنها را بسازد؛ fallback برابر `pnpm ui:build` است (وابستگی‌های UI را خودکار نصب می‌کند).
</Note>

## حالت غیرتعاملی

برای خودکارسازی یا اسکریپت‌کردن onboarding از `--non-interactive` استفاده کنید:

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

برای خلاصهٔ machine-readable، `--json` را اضافه کنید.

Gateway token SecretRef در حالت غیرتعاملی:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` و `--gateway-token-ref-env` با هم ناسازگارند.

<Note>
`--json` حالت غیرتعاملی را القا **نمی‌کند**. برای اسکریپت‌ها از `--non-interactive` (و `--workspace`) استفاده کنید.
</Note>

نمونه‌های دستور مخصوص provider در [CLI Automation](/fa/start/wizard-cli-automation#provider-specific-examples) قرار دارند.
از این صفحهٔ مرجع برای معنای flagها و ترتیب مراحل استفاده کنید.

### افزودن agent (غیرتعاملی)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway جریان onboarding را از طریق RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`) ارائه می‌کند.
کلاینت‌ها (برنامهٔ macOS، Control UI) می‌توانند مراحل را بدون پیاده‌سازی دوبارهٔ منطق onboarding رندر کنند.

## راه‌اندازی Signal (signal-cli)

Onboarding می‌تواند `signal-cli` را از GitHub releases نصب کند:

- asset مناسب release را دانلود می‌کند.
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند.
- `channels.signal.cliPath` را در پیکربندی شما می‌نویسد.

نکته‌ها:

- buildهای JVM به **Java 21** نیاز دارند.
- هرگاه موجود باشند از buildهای Native استفاده می‌شود.
- Windows از WSL2 استفاده می‌کند؛ نصب signal-cli جریان Linux را درون WSL دنبال می‌کند.

## آنچه ویزارد می‌نویسد

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (آماده‌سازی اولیه محلی، وقتی تنظیم نشده باشد، به‌طور پیش‌فرض از `"coding"` استفاده می‌کند؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، bind، احراز هویت، tailscale)
- `session.dmScope` (جزئیات رفتار: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Slack/Discord/Matrix/Microsoft Teams) وقتی در پرسش‌ها آن‌ها را فعال می‌کنید (نام‌ها در صورت امکان به IDها تبدیل می‌شوند).
- `skills.install.nodeManager`
  - `setup --node-manager` مقادیر `npm`، `pnpm` یا `bun` را می‌پذیرد.
  - پیکربندی دستی همچنان می‌تواند با تنظیم مستقیم `skills.install.nodeManager` از `yarn` استفاده کند.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` مقدار `agents.list[]` و `bindings` اختیاری را می‌نویسد.

اعتبارنامه‌های WhatsApp زیر `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرند.
نشست‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` ذخیره می‌شوند.

برخی کانال‌ها به‌صورت Plugin ارائه می‌شوند. وقتی هنگام راه‌اندازی یکی را انتخاب می‌کنید، آماده‌سازی اولیه
قبل از اینکه بتواند پیکربندی شود، از شما می‌خواهد آن را نصب کنید (npm یا یک مسیر محلی).

## مستندات مرتبط

- نمای کلی آماده‌سازی اولیه: [آماده‌سازی اولیه (CLI)](/fa/start/wizard)
- آماده‌سازی اولیه برنامه macOS: [آماده‌سازی اولیه](/fa/start/onboarding)
- مرجع پیکربندی: [پیکربندی Gateway](/fa/gateway/configuration)
- ارائه‌دهندگان: [WhatsApp](/fa/channels/whatsapp), [Telegram](/fa/channels/telegram), [Discord](/fa/channels/discord), [Google Chat](/fa/channels/googlechat), [Signal](/fa/channels/signal), [BlueBubbles](/fa/channels/bluebubbles) (iMessage), [iMessage](/fa/channels/imessage) (قدیمی)
- Skills: [Skills](/fa/tools/skills), [پیکربندی Skills](/fa/tools/skills-config)
