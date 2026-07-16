---
read_when:
    - جست‌وجوی یک مرحله یا پرچم خاص در فرایند راه‌اندازی اولیه
    - خودکارسازی راه‌اندازی اولیه با حالت غیرتعاملی
    - اشکال‌زدایی رفتار راه‌اندازی اولیه
sidebarTitle: Onboarding Reference
summary: 'مرجع کامل برای راه‌اندازی اولیه با CLI: همه مراحل، پرچم‌ها و فیلدهای پیکربندی'
title: مرجع راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-07-16T17:24:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

این مرجع کامل `openclaw onboard` است.
برای نمایی کلی، به [راه‌اندازی اولیه (CLI)](/fa/start/wizard) مراجعه کنید. برای رفتار و خروجی‌های
گام‌به‌گام، [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference) را ببینید.

## جزئیات جریان (حالت محلی)

<Steps>
  <Step title="بازنشانی (اختیاری)">
    - `--reset` پیش از اجرای راه‌اندازی، وضعیت را بازنشانی می‌کند؛ بدون آن، اجرای دوباره راه‌اندازی اولیه
      پیکربندی موجود را حفظ می‌کند و از آن به‌عنوان مقادیر پیش‌فرض استفاده می‌کند.
    - `--reset-scope` مواردی را که `--reset` حذف می‌کند کنترل می‌کند: `config` (فقط فایل پیکربندی)،
      `config+creds+sessions` (پیش‌فرض)، یا `full` (فضای کاری را نیز
      حذف می‌کند).
    - اگر فایل پیکربندی نامعتبر باشد، راه‌اندازی اولیه متوقف می‌شود و از شما می‌خواهد ابتدا
      `openclaw doctor` را اجرا کنید، سپس راه‌اندازی را دوباره اجرا کنید.
    - بازنشانی، وضعیت را به سطل زباله منتقل می‌کند (هرگز مستقیماً حذف نمی‌کند).

  </Step>
  <Step title="پذیرش ریسک">
    - در نخستین اجرا (یا هر اجرایی پیش از تنظیم‌شدن `wizard.securityAcknowledgedAt`)
      از شما خواسته می‌شود تأیید کنید که می‌دانید عامل‌ها قدرتمند هستند و دسترسی کامل
      به سیستم خطرناک است.
    - `--non-interactive` مستلزم ارائه صریح `--accept-risk` است؛ بدون آن،
      راه‌اندازی اولیه به‌جای نمایش درخواست، با خطا خارج می‌شود.
    - در اجراهای تعاملی به‌جای پرچم، درخواست تأیید نمایش داده می‌شود؛ ردکردن آن
      راه‌اندازی را لغو می‌کند.

  </Step>
  <Step title="مدل/احراز هویت">
    - **کلید API‏ Anthropic**: در صورت وجود از `ANTHROPIC_API_KEY` استفاده می‌کند یا کلید را درخواست می‌کند، سپس آن را برای استفاده دیمن ذخیره می‌کند.
    - **CLI‏ Anthropic Claude**: وقتی ورود به Claude CLI از قبل وجود دارد، مسیر محلی ترجیحی است؛ OpenClaw همچنان احراز هویت با توکن راه‌اندازی Anthropic را به‌عنوان جایگزین پشتیبانی می‌کند.
    - **اشتراک OpenAI Code (Codex) ‏(OAuth)**: جریان مرورگر؛ `code#state` را جای‌گذاری کنید.
      - در راه‌اندازی تازه و بدون مدل اصلی، `agents.defaults.model` را از طریق زمان‌اجرای Codex روی `openai/gpt-5.6-sol` تنظیم می‌کند.
    - **اشتراک OpenAI Code (Codex) ‏(جفت‌سازی دستگاه)**: جریان جفت‌سازی مرورگر با کد دستگاه کوتاه‌عمر.
      - در راه‌اندازی تازه و بدون مدل اصلی، `agents.defaults.model` را از طریق زمان‌اجرای Codex روی `openai/gpt-5.6-sol` تنظیم می‌کند.
    - **کلید API‏ OpenAI**: در صورت وجود از `OPENAI_API_KEY` استفاده می‌کند یا کلید را درخواست می‌کند، سپس آن را در نمایه‌های احراز هویت ذخیره می‌کند.
      - در راه‌اندازی تازه و بدون مدل اصلی، `agents.defaults.model` را روی `openai/gpt-5.6` تنظیم می‌کند؛ شناسه مدل ساده API مستقیم به سطح Sol تفکیک می‌شود.
    - افزودن یا احراز هویت دوباره OpenAI، مدل اصلی صریح موجود، از جمله `openai/gpt-5.5`، را حفظ می‌کند. اگر حساب GPT-5.6 را ارائه نمی‌دهد، `openai/gpt-5.5` را صریحاً انتخاب کنید؛ OpenClaw مدل را بی‌سروصدا به نسخه پایین‌تر تنزل نمی‌دهد.
    - **OAuth‏ xAI**: ورود در مرورگر با کد دستگاه، بدون نیاز به فراخوانی برگشتی localhost؛ بنابراین از طریق SSH/Docker/VPS نیز کار می‌کند (`--auth-choice xai-oauth`).
    - **کلید API‏ xAI**: مقدار `XAI_API_KEY` را درخواست می‌کند (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` همچنان به‌عنوان نام مستعار سازگاریِ صرفاً دستی برای همان جریان OAuth کد دستگاه xAI کار می‌کند؛ برای اسکریپت‌های جدید از `xai-oauth` استفاده کنید.
    - **OpenCode**: مقدار `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`، آن را از https://opencode.ai/auth دریافت کنید) را درخواست می‌کند و امکان انتخاب کاتالوگ Zen یا Go را می‌دهد.
    - **Ollama**: ابتدا گزینه‌های **ابری + محلی**، **فقط ابری** یا **فقط محلی** را ارائه می‌دهد. `Cloud only` مقدار `OLLAMA_API_KEY` را درخواست می‌کند و از `https://ollama.com` استفاده می‌کند؛ حالت‌های مبتنی بر میزبان، URL پایه Ollama (پیش‌فرض `http://127.0.0.1:11434`) را درخواست می‌کنند، مدل‌های موجود را کشف می‌کنند و در صورت نیاز مدل محلی انتخاب‌شده را به‌طور خودکار دریافت می‌کنند؛ `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی ابری وارد حساب شده است یا نه.
    - جزئیات بیشتر: [Ollama](/fa/providers/ollama)
    - **کلید API**: کلید را برای شما ذخیره می‌کند.
    - **Vercel AI Gateway (پراکسی چندمدلی)**: مقدار `AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Vercel AI Gateway](/fa/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: شناسه حساب، شناسه Gateway و `CLOUDFLARE_AI_GATEWAY_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway)
    - **MiniMax**: پیکربندی به‌طور خودکار نوشته می‌شود؛ پیش‌فرض میزبانی‌شده `MiniMax-M3` است.
      راه‌اندازی با کلید API از `minimax/...` و راه‌اندازی OAuth از
      `minimax-portal/...` استفاده می‌کند.
    - جزئیات بیشتر: [MiniMax](/fa/providers/minimax)
    - **StepFun**: پیکربندی برای StepFun استاندارد یا Step Plan در نقاط پایانی چین یا جهانی به‌طور خودکار نوشته می‌شود.
    - پیش‌فرض فعلی حالت استاندارد `step-3.5-flash` است؛ Step Plan همچنین شامل `step-3.5-flash-2603` می‌شود.
    - جزئیات بیشتر: [StepFun](/fa/providers/stepfun)
    - **Synthetic (سازگار با Anthropic)**: مقدار `SYNTHETIC_API_KEY` را درخواست می‌کند.
    - جزئیات بیشتر: [Synthetic](/fa/providers/synthetic)
    - **Moonshot (Kimi K2)**: پیکربندی به‌طور خودکار نوشته می‌شود.
    - **Kimi Coding**: پیکربندی به‌طور خودکار نوشته می‌شود.
    - جزئیات بیشتر: [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot)
    - **ارائه‌دهنده سفارشی**: با نقاط پایانی سازگار با OpenAI، سازگار با OpenAI Responses یا سازگار با Anthropic کار می‌کند. پرچم‌های غیرتعاملی: `--auth-choice custom-api-key`، `--custom-base-url`، `--custom-model-id`، `--custom-api-key` (اختیاری؛ به `CUSTOM_API_KEY` برمی‌گردد)، `--custom-provider-id` (اختیاری؛ به‌طور خودکار از URL پایه استخراج می‌شود)، `--custom-compatibility openai|openai-responses|anthropic` (پیش‌فرض `openai`)، `--custom-image-input` / `--custom-text-input` (تشخیص استنباط‌شده مدل بینایی را بازنویسی می‌کند).
    - **ردکردن**: هنوز هیچ احراز هویتی پیکربندی نشده است.
    - یک مدل پیش‌فرض از میان گزینه‌های شناسایی‌شده انتخاب کنید (یا ارائه‌دهنده/مدل را دستی وارد کنید). برای بهترین کیفیت و کاهش خطر تزریق پرامپت، قوی‌ترین مدل نسل جدید موجود در پشته ارائه‌دهنده خود را انتخاب کنید.
    - راه‌اندازی اولیه بررسی مدل را اجرا می‌کند و اگر مدل پیکربندی‌شده ناشناخته باشد یا احراز هویت نداشته باشد، هشدار می‌دهد.
    - حالت ذخیره‌سازی کلید API به‌طور پیش‌فرض از مقادیر متن ساده نمایه احراز هویت استفاده می‌کند. برای ذخیره ارجاع‌های مبتنی بر متغیر محیطی، به‌جای آن از `--secret-input-mode ref` استفاده کنید (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)؛ متغیر محیطی ارجاع‌شده باید از قبل تنظیم شده باشد، وگرنه راه‌اندازی اولیه فوراً ناموفق می‌شود.
    - نمایه‌های احراز هویت در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (کلیدهای API و OAuth). `~/.openclaw/credentials/oauth.json` فقط برای واردکردن داده‌های قدیمی است.
    - جزئیات بیشتر: [OAuth](/fa/concepts/oauth)
    <Note>
    نکته برای محیط بدون رابط گرافیکی/سرور: OAuth را روی دستگاهی دارای مرورگر تکمیل کنید، سپس
    فایل `auth-profiles.json` آن عامل را (برای مثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، یا مسیر متناظر
    `$OPENCLAW_STATE_DIR/...`) به میزبان Gateway کپی کنید. `credentials/oauth.json`
    فقط منبع واردکردن داده‌های قدیمی است.
    </Note>
  </Step>
  <Step title="فضای کاری">
    - پیش‌فرض `~/.openclaw/workspace` است (قابل پیکربندی).
    - فایل‌های فضای کاری موردنیاز برای آیین راه‌اندازی عامل را ایجاد می‌کند.
    - راهنمای کامل چیدمان فضای کاری و پشتیبان‌گیری: [فضای کاری عامل](/fa/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - درگاه (پیش‌فرض **18789**)، اتصال، حالت احراز هویت و دسترسی از طریق Tailscale.
    - توصیه احراز هویت: حتی برای loopback نیز **توکن** را حفظ کنید تا کلاینت‌های محلی WS ملزم به احراز هویت باشند.
    - در حالت توکن، راه‌اندازی تعاملی این گزینه‌ها را ارائه می‌دهد:
      - **تولید/ذخیره توکن متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (انتخابی)
      - شروع سریع از SecretRefهای موجود `gateway.auth.token` در ارائه‌دهندگان `env`، `file` و `exec` برای کاوش راه‌اندازی اولیه/راه‌اندازی داشبورد استفاده مجدد می‌کند.
      - اگر آن SecretRef پیکربندی شده باشد اما قابل تفکیک نباشد، راه‌اندازی اولیه به‌جای تضعیف بی‌سروصدای احراز هویت زمان اجرا، زودهنگام و با پیام اصلاحی روشن ناموفق می‌شود.
    - در حالت گذرواژه، راه‌اندازی تعاملی از ذخیره‌سازی متن ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
      - به متغیر محیطی غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
      - نمی‌توان آن را با `--gateway-token` ترکیب کرد.
    - احراز هویت را فقط در صورتی غیرفعال کنید که به همه فرایندهای محلی کاملاً اعتماد دارید.
    - اتصال‌های غیر-loopback همچنان به احراز هویت نیاز دارند.

  </Step>
  <Step title="کانال‌ها">
    - [WhatsApp](/fa/channels/whatsapp): ورود اختیاری با کد QR.
    - [Telegram](/fa/channels/telegram): توکن ربات.
    - [Discord](/fa/channels/discord): توکن ربات.
    - [Google Chat](/fa/channels/googlechat): فایل JSON حساب سرویس + مخاطب Webhook.
    - [Mattermost](/fa/channels/mattermost) (Plugin): توکن ربات + URL پایه.
    - [Signal](/fa/channels/signal) (Plugin): نصب اختیاری `signal-cli` + پیکربندی حساب.
    - [iMessage](/fa/channels/imessage): مسیر CLI‏ `imsg` + دسترسی به پایگاه داده Messages؛ وقتی Gateway خارج از Mac اجرا می‌شود از پوشش SSH استفاده کنید.
    - Discord، Feishu، Microsoft Teams، QQ Bot، Slack و کانال‌های دیگر به‌صورت
      Plugin ارائه می‌شوند و راه‌اندازی اولیه می‌تواند آن‌ها را برای شما نصب کند. کاتالوگ کامل: [کانال‌ها](/fa/channels).
    - امنیت پیام خصوصی: حالت پیش‌فرض جفت‌سازی است. نخستین پیام خصوصی یک کد ارسال می‌کند؛ آن را از طریق `openclaw pairing approve <channel> <code>` تأیید کنید یا از فهرست‌های مجاز استفاده کنید.

  </Step>
  <Step title="جست‌وجوی وب">
    - یک ارائه‌دهنده پشتیبانی‌شده مانند Brave، Codex (Hosted Search)، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Parallel، Perplexity، SearXNG یا Tavily را انتخاب کنید (یا رد کنید).
    - ارائه‌دهندگان مبتنی بر API می‌توانند برای راه‌اندازی سریع از متغیرهای محیطی یا پیکربندی موجود استفاده کنند؛ ارائه‌دهندگان بدون کلید به‌جای آن از پیش‌نیازهای مختص ارائه‌دهنده خود استفاده می‌کنند.
    - با `--skip-search` رد کنید.
    - پیکربندی در آینده: `openclaw configure --section web`.

  </Step>
  <Step title="نصب دیمن">
    - macOS:‏ LaunchAgent
      - به نشست کاربری واردشده نیاز دارد؛ برای محیط بدون رابط گرافیکی، از LaunchDaemon سفارشی استفاده کنید (ارائه نمی‌شود).
    - Linux (و Windows از طریق WSL2): واحد کاربری systemd
      - راه‌اندازی اولیه تلاش می‌کند با `loginctl enable-linger <user>` ماندگاری را فعال کند تا Gateway پس از خروج از حساب نیز فعال بماند.
      - ممکن است sudo را درخواست کند (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - Windows بومی: ابتدا Scheduled Task؛ اگر ایجاد وظیفه رد شود، OpenClaw به یک مورد ورود مخصوص هر کاربر در پوشه Startup برمی‌گردد و Gateway را بلافاصله راه‌اندازی می‌کند.
    - **انتخاب زمان اجرا:** Node الزامی است، زیرا مخزن متعارف وضعیت زمان اجرا از `node:sqlite` استفاده می‌کند. سرویس‌های قدیمی Bun هنگام تعمیر به Node مهاجرت داده می‌شوند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب دیمن آن را اعتبارسنجی می‌کند اما مقادیر متن ساده تفکیک‌شده توکن را در فراداده محیط سرویس سرپرست ماندگار نمی‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده تفکیک‌نشده باشد، نصب دیمن با راهنمایی عملی مسدود می‌شود.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب دیمن تا زمانی که حالت صریحاً تنظیم شود مسدود می‌ماند.

  </Step>
  <Step title="بررسی سلامت">
    - Gateway را (در صورت نیاز) راه‌اندازی می‌کند و `openclaw health` را اجرا می‌کند.
    - نکته: `openclaw status --deep` کاوش زنده سلامت Gateway را به خروجی وضعیت اضافه می‌کند، از جمله کاوش کانال‌ها در صورت پشتیبانی (به Gateway در دسترس نیاز دارد).

  </Step>
  <Step title="Skills (توصیه‌شده)">
    - Skills موجود را می‌خواند و پیش‌نیازها را بررسی می‌کند.
    - امکان انتخاب مدیر Node را می‌دهد: **npm / pnpm / bun**.
    - وابستگی‌های اختیاری Skills بسته‌بندی‌شده و مورداعتماد را به‌طور خودکار نصب می‌کند (برخی در macOS از Homebrew استفاده می‌کنند).
    - Skillsی را که پیش‌نیاز نصب‌کننده Homebrew، uv یا Go آن‌ها در دسترس نیست رد می‌کند، آن‌ها را همراه با راهنمای راه‌اندازی دستی گروه‌بندی می‌کند و پس از نصب پیش‌نیاز شما را به `openclaw doctor` هدایت می‌کند.

  </Step>
  <Step title="پایان">
    - خلاصه + گام‌های بعدی، از جمله درخواست **می‌خواهید عامل خود را چگونه از تخم بیرون بیاورید؟** برای Terminal، Browser یا بعداً.

  </Step>
</Steps>

<Note>
اگر هیچ رابط کاربری گرافیکی شناسایی نشود، راه‌اندازی اولیه به‌جای باز کردن مرورگر، دستورالعمل‌های انتقال پورت SSH برای رابط کاربری کنترل را نمایش می‌دهد.
اگر دارایی‌های رابط کاربری کنترل موجود نباشند، راه‌اندازی اولیه تلاش می‌کند آن‌ها را بسازد؛ روش جایگزین `pnpm ui:build` است (وابستگی‌های رابط کاربری را به‌طور خودکار نصب می‌کند).
</Note>

## حالت غیرتعاملی

برای خودکارسازی یا اسکریپت‌نویسی راه‌اندازی اولیه از `--non-interactive --accept-risk` استفاده کنید (این
پرچم تأیید الزامی پذیرش ریسک است؛ راه‌اندازی اولیه بدون آن
با خطا خارج می‌شود):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

برای دریافت خلاصه‌ای قابل‌خواندن توسط ماشین، `--json` را اضافه کنید.

SecretRef توکن Gateway در حالت غیرتعاملی:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` و `--gateway-token-ref-env` با یکدیگر ناسازگارند.

<Note>
`--json` به‌معنای حالت غیرتعاملی **نیست**. برای اسکریپت‌ها از `--non-interactive --accept-risk` (و `--workspace`) استفاده کنید.
</Note>

نمونه‌فرمان‌های ویژه هر ارائه‌دهنده در [خودکارسازی CLI](/fa/start/wizard-cli-automation#provider-specific-examples) قرار دارند.
برای معناشناسی پرچم‌ها و ترتیب مراحل از این صفحه مرجع استفاده کنید.

### افزودن عامل (غیرتعاملی)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` شناسه عامل رزروشده‌ای است و نمی‌توان از آن برای `openclaw agents add` استفاده کرد.

## RPC جادوگر Gateway

Gateway جریان راه‌اندازی اولیه را از طریق RPC ارائه می‌کند (`wizard.start`، `wizard.next`، `wizard.cancel`، `wizard.status`).
کلاینت‌ها (برنامه macOS، رابط کاربری کنترل) می‌توانند بدون پیاده‌سازی مجدد منطق راه‌اندازی اولیه، مراحل را رندر کنند.

## راه‌اندازی Signal ‏(signal-cli)

راه‌اندازی اولیه تشخیص می‌دهد که آیا `signal-cli` در `PATH` قرار دارد یا نه و اگر موجود نباشد، نصب آن را پیشنهاد می‌کند:

- Linux x86-64: بیلد بومی رسمی GraalVM را از انتشارهای GitHub مربوط به `signal-cli` دانلود می‌کند و آن را در `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند.
- macOS و معماری‌های دیگر: در عوض از طریق Homebrew نصب می‌کند.
- Windows بومی: هنوز پشتیبانی نمی‌شود؛ راه‌اندازی اولیه را درون WSL2 اجرا کنید تا از مسیر نصب Linux استفاده شود.
- در هر دو حالت، `channels.signal.cliPath` را در پیکربندی شما می‌نویسد.

## آنچه جادوگر می‌نویسد

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` هنگامی که `--skip-bootstrap` ارسال شود
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شود)
- `tools.profile` (اگر تنظیم نشده باشد، راه‌اندازی اولیه محلی به‌طور پیش‌فرض از `"coding"` استفاده می‌کند؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، اتصال، احراز هویت، tailscale)
- `session.dmScope` (اگر تنظیم نشده باشد، راه‌اندازی اولیه محلی به‌طور پیش‌فرض آن را روی `"per-channel-peer"` قرار می‌دهد؛ مقادیر صریح موجود حفظ می‌شوند. جزئیات: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- فهرست‌های مجاز پیام مستقیم کانال، هنگامی که در اعلان‌های کانال آن‌ها را فعال می‌کنید. Discord، Matrix، Microsoft Teams و Slack در صورت امکان نام‌ها را به شناسه‌ها تبدیل می‌کنند؛ کانال‌های دیگر مستقیماً شناسه دریافت می‌کنند (برای مثال، شناسه‌های عددی فرستنده Telegram یا شماره‌تلفن‌های WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` مقادیر `npm`، `pnpm` یا `bun` را می‌پذیرد.
  - در پیکربندی دستی همچنان می‌توان با تنظیم مستقیم `skills.install.nodeManager` از `yarn` استفاده کرد.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` مقدار `agents.list[]` و در صورت نیاز `bindings` را می‌نویسد.

اعتبارنامه‌های WhatsApp در `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرند.
نشست‌های فعال و رونوشت‌ها در
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` ذخیره می‌شوند. از پوشه
`~/.openclaw/agents/<agentId>/sessions/` برای ورودی‌های مهاجرت قدیمی
و مصنوعات بایگانی/پشتیبانی استفاده می‌شود.

برخی کانال‌ها به‌صورت Plugin ارائه می‌شوند. هنگامی که یکی از آن‌ها را در جریان راه‌اندازی انتخاب کنید، راه‌اندازی اولیه
پیش از امکان پیکربندی آن، نصبش را (از npm یا یک مسیر محلی) درخواست می‌کند.

## مستندات مرتبط

- نمای کلی راه‌اندازی اولیه: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- مرجع راه‌اندازی CLI: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference)
- راه‌اندازی اولیه برنامه macOS: [راه‌اندازی اولیه](/fa/start/onboarding)
- مرجع پیکربندی: [پیکربندی Gateway](/fa/gateway/configuration)
- ارائه‌دهندگان: [WhatsApp](/fa/channels/whatsapp)، [Telegram](/fa/channels/telegram)، [Discord](/fa/channels/discord)، [Google Chat](/fa/channels/googlechat)، [Signal](/fa/channels/signal)، [iMessage](/fa/channels/imessage)
- Skills: [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)
