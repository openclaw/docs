---
read_when:
    - جست‌وجوی یک مرحله یا پرچم مشخص در فرایند آماده‌سازی
    - خودکارسازی ورود اولیه با حالت غیرتعاملی
    - اشکال‌زدایی رفتار راه‌اندازی اولیه
sidebarTitle: Onboarding Reference
summary: 'مرجع کامل برای راه‌اندازی اولیهٔ CLI: هر مرحله، فلگ، و فیلد پیکربندی'
title: مرجع راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-06-27T18:52:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

این مرجع کامل برای `openclaw onboard` است.
برای یک نمای کلی سطح بالا، [Onboarding (CLI)](/fa/start/wizard) را ببینید.

## جزئیات جریان (حالت محلی)

<Steps>
  <Step title="تشخیص پیکربندی موجود">
    - اگر `~/.openclaw/openclaw.json` وجود داشته باشد، **Keep current values**، **Review and update** یا **Reset before setup** را انتخاب کنید.
    - اجرای دوبارهٔ onboarding هیچ چیزی را پاک **نمی‌کند** مگر اینکه صراحتاً **Reset**
      را انتخاب کنید (یا `--reset` را پاس بدهید).
    - `--reset` در CLI به‌صورت پیش‌فرض `config+creds+sessions` است؛ برای حذف workspace هم از `--reset-scope full`
      استفاده کنید.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، wizard متوقف می‌شود و از شما می‌خواهد
      پیش از ادامه `openclaw doctor` را اجرا کنید.
    - Reset از `trash` استفاده می‌کند (هرگز `rm`) و scopeهای زیر را پیشنهاد می‌دهد:
      - فقط پیکربندی
      - پیکربندی + credentials + sessions
      - reset کامل (workspace را هم حذف می‌کند)

  </Step>
  <Step title="مدل/Auth">
    - **کلید API Anthropic**: اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند، وگرنه کلید را درخواست می‌کند، سپس آن را برای استفادهٔ daemon ذخیره می‌کند.
    - **کلید API Anthropic**: انتخاب ترجیحی assistant Anthropic در onboarding/configure.
    - **Anthropic setup-token**: همچنان در onboarding/configure در دسترس است، هرچند OpenClaw اکنون وقتی ممکن باشد استفادهٔ دوباره از Claude CLI را ترجیح می‌دهد.
    - **اشتراک OpenAI Code (Codex) (OAuth)**: جریان مرورگر؛ `code#state` را جای‌گذاری کنید.
      - وقتی مدل تنظیم نشده باشد یا از قبل عضو خانوادهٔ OpenAI باشد، `agents.defaults.model` را از طریق runtime Codex روی `openai/gpt-5.5` تنظیم می‌کند.
    - **اشتراک OpenAI Code (Codex) (device pairing)**: جریان pairing مرورگر با یک device code کوتاه‌مدت.
      - وقتی مدل تنظیم نشده باشد یا از قبل عضو خانوادهٔ OpenAI باشد، `agents.defaults.model` را از طریق runtime Codex روی `openai/gpt-5.5` تنظیم می‌کند.
    - **کلید API OpenAI**: اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند، وگرنه کلید را درخواست می‌کند، سپس آن را در auth profileها ذخیره می‌کند.
      - وقتی مدل تنظیم نشده باشد، `openai/*` باشد، یا ارجاع مدل Codex قدیمی باشد، `agents.defaults.model` را روی `openai/gpt-5.5` تنظیم می‌کند.
    - **xAI (Grok) OAuth / کلید API**: وقتی انتخاب شود با xAI OAuth وارد می‌شود، یا در مسیر کلید API مقدار `XAI_API_KEY` را درخواست می‌کند، و xAI را به‌عنوان provider مدل پیکربندی می‌کند.
    - **OpenCode**: مقدار `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`، آن را از https://opencode.ai/auth بگیرید) را درخواست می‌کند و اجازه می‌دهد catalog مربوط به Zen یا Go را انتخاب کنید.
    - **Ollama**: ابتدا **Cloud + Local**، **Cloud only** یا **Local only** را پیشنهاد می‌دهد. `Cloud only` مقدار `OLLAMA_API_KEY` را درخواست می‌کند و از `https://ollama.com` استفاده می‌کند؛ حالت‌های متکی به میزبان، URL پایهٔ Ollama را درخواست می‌کنند، مدل‌های موجود را کشف می‌کنند، و در صورت نیاز مدل محلی انتخاب‌شده را خودکار pull می‌کنند؛ `Cloud + Local` همچنین بررسی می‌کند که آن میزبان Ollama برای دسترسی cloud وارد شده باشد.
    - جزئیات بیشتر: [Ollama](/fa/providers/ollama)
    - **کلید API**: کلید را برای شما ذخیره می‌کند.
    - **Vercel AI Gateway (پروکسی چندمدلی)**: مقدار `AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID، Gateway ID و `CLOUDFLARE_AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway)
    - **MiniMax**: پیکربندی به‌صورت خودکار نوشته می‌شود؛ پیش‌فرض hosted برابر `MiniMax-M3` است.
      راه‌اندازی با کلید API از `minimax/...` استفاده می‌کند، و راه‌اندازی OAuth از
      `minimax-portal/...`.
    - جزئیات بیشتر: [MiniMax](/fa/providers/minimax)
    - **StepFun**: پیکربندی برای StepFun standard یا Step Plan روی endpointهای چین یا جهانی به‌صورت خودکار نوشته می‌شود.
    - Standard در حال حاضر شامل `step-3.5-flash` است، و Step Plan همچنین شامل `step-3.5-flash-2603` است.
    - جزئیات بیشتر: [StepFun](/fa/providers/stepfun)
    - **Synthetic (سازگار با Anthropic)**: مقدار `SYNTHETIC_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Synthetic](/fa/providers/synthetic)
    - **Moonshot (Kimi K2)**: پیکربندی به‌صورت خودکار نوشته می‌شود.
    - **Kimi Coding**: پیکربندی به‌صورت خودکار نوشته می‌شود.
    - جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot)
    - **رد کردن**: هنوز auth پیکربندی نشده است.
    - یک مدل پیش‌فرض از گزینه‌های تشخیص‌داده‌شده انتخاب کنید (یا provider/model را دستی وارد کنید). برای بهترین کیفیت و ریسک کمتر prompt-injection، قوی‌ترین مدل نسل جدید موجود در provider stack خود را انتخاب کنید.
    - Onboarding یک بررسی مدل اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا auth نداشته باشد هشدار می‌دهد.
    - حالت ذخیره‌سازی کلید API به‌صورت پیش‌فرض مقدارهای auth-profile متن ساده است. برای ذخیرهٔ refهای متکی به env به‌جای آن، از `--secret-input-mode ref` استفاده کنید (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profileها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (کلیدهای API + OAuth). `~/.openclaw/credentials/oauth.json` فقط برای import قدیمی است.
    - جزئیات بیشتر: [/concepts/oauth](/fa/concepts/oauth)
    <Note>
    نکته برای headless/server: OAuth را روی دستگاهی دارای مرورگر کامل کنید، سپس
    `auth-profiles.json` همان agent را (برای مثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
    `$OPENCLAW_STATE_DIR/...`) به میزبان gateway کپی کنید. `credentials/oauth.json`
    فقط یک منبع import قدیمی است.
    </Note>
  </Step>
  <Step title="Workspace">
    - پیش‌فرض `~/.openclaw/workspace` (قابل پیکربندی).
    - فایل‌های workspace لازم برای bootstrap ritual عامل را seed می‌کند.
    - چیدمان کامل workspace + راهنمای پشتیبان‌گیری: [Agent workspace](/fa/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - پورت، bind، حالت auth، نمایش از طریق Tailscale.
    - توصیهٔ auth: حتی برای loopback هم **Token** را نگه دارید تا کلاینت‌های WS محلی مجبور به احراز هویت باشند.
    - در حالت token، راه‌اندازی تعاملی موارد زیر را پیشنهاد می‌دهد:
      - **تولید/ذخیرهٔ token متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (opt-in)
      - Quickstart از SecretRefهای موجود `gateway.auth.token` در providerهای `env`، `file` و `exec` برای probe/dashboard bootstrap مربوط به onboarding دوباره استفاده می‌کند.
      - اگر آن SecretRef پیکربندی شده باشد اما قابل resolve نباشد، onboarding به‌جای تضعیف بی‌صدای auth زمان اجرا، زودتر با یک پیام اصلاح روشن شکست می‌خورد.
    - در حالت password، راه‌اندازی تعاملی از ذخیره‌سازی متن ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef token غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک env var غیرخالی در محیط فرایند onboarding نیاز دارد.
      - نمی‌تواند با `--gateway-token` ترکیب شود.
    - auth را فقط وقتی غیرفعال کنید که به همهٔ فرایندهای محلی کاملاً اعتماد دارید.
    - bindهای غیر loopback همچنان به auth نیاز دارند.

  </Step>
  <Step title="کانال‌ها">
    - [WhatsApp](/fa/channels/whatsapp): ورود QR اختیاری.
    - [Telegram](/fa/channels/telegram): bot token.
    - [Discord](/fa/channels/discord): bot token.
    - [Google Chat](/fa/channels/googlechat): service account JSON + webhook audience.
    - [Mattermost](/fa/channels/mattermost) (Plugin): bot token + URL پایه.
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب.
    - [iMessage](/fa/channels/imessage): مسیر CLI `imsg` + دسترسی به Messages DB؛ وقتی Gateway خارج از Mac اجرا می‌شود از یک SSH wrapper استفاده کنید.
    - امنیت DM: پیش‌فرض pairing است. نخستین DM یک کد می‌فرستد؛ از طریق `openclaw pairing approve <channel> <code>` تأیید کنید یا از allowlistها استفاده کنید.

  </Step>
  <Step title="جست‌وجوی وب">
    - یک provider پشتیبانی‌شده مثل Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Perplexity، SearXNG یا Tavily را انتخاب کنید (یا رد کنید).
    - providerهای متکی به API می‌توانند برای راه‌اندازی سریع از env varها یا پیکربندی موجود استفاده کنند؛ providerهای بدون کلید به‌جای آن از پیش‌نیازهای اختصاصی provider خود استفاده می‌کنند.
    - با `--skip-search` رد کنید.
    - پیکربندی بعدی: `openclaw configure --section web`.

  </Step>
  <Step title="نصب daemon">
    - macOS: LaunchAgent
      - به یک نشست کاربر واردشده نیاز دارد؛ برای headless، از LaunchDaemon سفارشی استفاده کنید (ارسال نشده است).
    - Linux (و Windows از طریق WSL2): systemd user unit
      - Onboarding تلاش می‌کند lingering را از طریق `loginctl enable-linger <user>` فعال کند تا Gateway پس از logout هم بالا بماند.
      - ممکن است sudo درخواست کند (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - **انتخاب runtime:** Node (توصیه‌شده؛ برای WhatsApp/Telegram ضروری). Bun **توصیه نمی‌شود**.
    - اگر auth با token به token نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب daemon آن را اعتبارسنجی می‌کند اما مقدارهای token متن سادهٔ resolveشده را در metadata محیط سرویس supervisor پایدار نمی‌کند.
    - اگر auth با token به token نیاز داشته باشد و SecretRef token پیکربندی‌شده resolve نشده باشد، نصب daemon با راهنمایی قابل اقدام مسدود می‌شود.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب daemon تا زمانی که mode صراحتاً تنظیم شود مسدود می‌شود.

  </Step>
  <Step title="بررسی سلامت">
    - Gateway را (در صورت نیاز) شروع می‌کند و `openclaw health` را اجرا می‌کند.
    - نکته: `openclaw status --deep`، probe سلامت gateway زنده را به خروجی status اضافه می‌کند، شامل probeهای کانال وقتی پشتیبانی شوند (به gateway قابل دسترس نیاز دارد).

  </Step>
  <Step title="Skills (توصیه‌شده)">
    - Skills موجود را می‌خواند و الزامات را بررسی می‌کند.
    - اجازه می‌دهد یک node manager انتخاب کنید: **npm / pnpm** (bun توصیه نمی‌شود).
    - وابستگی‌های اختیاری را نصب می‌کند (بعضی از Homebrew روی macOS استفاده می‌کنند).

  </Step>
  <Step title="پایان">
    - خلاصه + گام‌های بعدی، شامل prompt **How do you want to hatch your agent?** برای Terminal، Browser یا بعداً.

  </Step>
</Steps>

<Note>
اگر هیچ GUI تشخیص داده نشود، onboarding به‌جای باز کردن مرورگر، دستورالعمل‌های SSH port-forward برای Control UI را چاپ می‌کند.
اگر assetهای Control UI وجود نداشته باشند، onboarding تلاش می‌کند آن‌ها را build کند؛ fallback برابر `pnpm ui:build` است (وابستگی‌های UI را خودکار نصب می‌کند).
</Note>

## حالت غیرتعاملی

برای خودکارسازی یا script کردن onboarding از `--non-interactive` استفاده کنید:

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

برای خلاصهٔ قابل خواندن توسط ماشین، `--json` را اضافه کنید.

SecretRef مربوط به Gateway token در حالت غیرتعاملی:

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
`--json` به معنی حالت غیرتعاملی **نیست**. برای scriptها از `--non-interactive` (و `--workspace`) استفاده کنید.
</Note>

نمونه فرمان‌های اختصاصی provider در [CLI Automation](/fa/start/wizard-cli-automation#provider-specific-examples) قرار دارند.
از این صفحهٔ مرجع برای معنای flagها و ترتیب گام‌ها استفاده کنید.

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

Gateway جریان onboarding را از طریق RPC (`wizard.start`، `wizard.next`، `wizard.cancel`، `wizard.status`) ارائه می‌کند.
کلاینت‌ها (برنامهٔ macOS، Control UI) می‌توانند بدون پیاده‌سازی دوبارهٔ منطق onboarding، گام‌ها را render کنند.

## راه‌اندازی Signal (signal-cli)

Onboarding می‌تواند `signal-cli` را از GitHub releases نصب کند:

- asset نسخهٔ مناسب را دانلود می‌کند.
- آن را زیر `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند.
- `channels.signal.cliPath` را در پیکربندی شما می‌نویسد.

نکته‌ها:

- buildهای JVM به **Java 21** نیاز دارند.
- وقتی موجود باشند، از buildهای native استفاده می‌شود.
- Windows از WSL2 استفاده می‌کند؛ نصب signal-cli جریان Linux را داخل WSL دنبال می‌کند.

## آنچه wizard می‌نویسد

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (راه‌اندازی اولیه محلی، وقتی تنظیم نشده باشد، به‌طور پیش‌فرض `"coding"` است؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، bind، احراز هویت، tailscale)
- `session.dmScope` (جزئیات رفتار: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Slack/Discord/Matrix/Microsoft Teams) وقتی هنگام اعلان‌ها انتخابشان می‌کنید (نام‌ها در صورت امکان به شناسه‌ها تبدیل می‌شوند).
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

برخی کانال‌ها به‌صورت plugins ارائه می‌شوند. وقتی هنگام راه‌اندازی یکی را انتخاب کنید، راه‌اندازی اولیه
پیش از امکان پیکربندی آن، از شما می‌خواهد آن را نصب کنید (npm یا یک مسیر محلی).

## مستندات مرتبط

- نمای کلی راه‌اندازی اولیه: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- راه‌اندازی اولیه برنامه macOS: [راه‌اندازی اولیه](/fa/start/onboarding)
- مرجع پیکربندی: [پیکربندی Gateway](/fa/gateway/configuration)
- ارائه‌دهندگان: [WhatsApp](/fa/channels/whatsapp), [Telegram](/fa/channels/telegram), [Discord](/fa/channels/discord), [Google Chat](/fa/channels/googlechat), [Signal](/fa/channels/signal), [iMessage](/fa/channels/imessage)
- Skills: [Skills](/fa/tools/skills), [پیکربندی Skills](/fa/tools/skills-config)
