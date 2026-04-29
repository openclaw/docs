---
read_when:
    - مرکز عیب‌یابی شما را برای تشخیص عمیق‌تر به اینجا هدایت کرده است
    - به بخش‌های پایدار راهنمای اجرایی مبتنی بر نشانه با دستورهای دقیق نیاز دارید.
sidebarTitle: Troubleshooting
summary: راهنمای عملیاتی عیب‌یابی عمیق برای Gateway، کانال‌ها، خودکارسازی، Nodeها و مرورگر
title: عیب‌یابی
x-i18n:
    generated_at: "2026-04-29T22:57:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

این صفحه runbook عمیق است. اگر ابتدا جریان تریاژ سریع را می‌خواهید، از [/help/troubleshooting](/fa/help/troubleshooting) شروع کنید.

## نردبان دستورها

ابتدا این‌ها را به همین ترتیب اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

نشانه‌های سالم مورد انتظار:

- `openclaw gateway status` مقدارهای `Runtime: running`، `Connectivity probe: ok`، و یک خط `Capability: ...` را نشان می‌دهد.
- `openclaw doctor` هیچ مشکل مسدودکننده‌ای در پیکربندی/سرویس گزارش نمی‌کند.
- `openclaw channels status --probe` وضعیت انتقال زنده برای هر حساب و، در موارد پشتیبانی‌شده، نتایج probe/audit مانند `works` یا `audit ok` را نشان می‌دهد.

## نصب‌های split brain و محافظ پیکربندی جدیدتر

وقتی یک سرویس Gateway پس از به‌روزرسانی به‌طور غیرمنتظره متوقف می‌شود، یا logها نشان می‌دهند که یک باینری `openclaw` قدیمی‌تر از نسخه‌ای است که آخرین بار `openclaw.json` را نوشته، از این بخش استفاده کنید.

OpenClaw نوشتن پیکربندی را با `meta.lastTouchedVersion` مهر می‌کند. دستورهای فقط‌خواندنی هنوز می‌توانند پیکربندی نوشته‌شده توسط OpenClaw جدیدتر را بررسی کنند، اما جهش‌های فرایند و سرویس از ادامه با یک باینری قدیمی‌تر خودداری می‌کنند. اقدام‌های مسدودشده شامل شروع، توقف، راه‌اندازی مجدد، حذف نصب سرویس Gateway، نصب مجدد اجباری سرویس، راه‌اندازی Gateway در حالت سرویس، و پاک‌سازی پورت با `gateway --force` هستند.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    `PATH` را اصلاح کنید تا `openclaw` به نصب جدیدتر resolve شود، سپس اقدام را دوباره اجرا کنید.
  </Step>
  <Step title="Reinstall the gateway service">
    سرویس Gateway موردنظر را از نصب جدیدتر دوباره نصب کنید:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    بسته سیستم قدیمی یا ورودی‌های wrapper قدیمی را که هنوز به یک باینری قدیمی `openclaw` اشاره می‌کنند حذف کنید.
  </Step>
</Steps>

<Warning>
فقط برای downgrade عمدی یا بازیابی اضطراری، `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` را برای همان یک دستور تنظیم کنید. برای عملیات عادی آن را تنظیم‌نشده بگذارید.
</Warning>

## مصرف اضافی Anthropic 429 برای زمینه طولانی لازم است

وقتی logها/خطاها شامل این مورد هستند استفاده کنید: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

به این موارد توجه کنید:

- مدل Anthropic Opus/Sonnet انتخاب‌شده دارای `params.context1m: true` است.
- credential فعلی Anthropic واجد شرایط استفاده از زمینه طولانی نیست.
- درخواست‌ها فقط در sessionهای طولانی/اجرای مدل‌هایی که به مسیر beta با 1M نیاز دارند شکست می‌خورند.

گزینه‌های رفع مشکل:

<Steps>
  <Step title="Disable context1m">
    `context1m` را برای آن مدل غیرفعال کنید تا به پنجره context عادی برگردد.
  </Step>
  <Step title="Use an eligible credential">
    از credential مربوط به Anthropic که واجد شرایط درخواست‌های زمینه طولانی است استفاده کنید، یا به یک کلید API مربوط به Anthropic تغییر دهید.
  </Step>
  <Step title="Configure fallback models">
    مدل‌های fallback را پیکربندی کنید تا وقتی درخواست‌های زمینه طولانی Anthropic رد می‌شوند، اجراها ادامه پیدا کنند.
  </Step>
</Steps>

مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [چرا HTTP 429 از Anthropic می‌بینم؟](/fa/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend محلی سازگار با OpenAI در probeهای مستقیم موفق است اما اجرای agent شکست می‌خورد

وقتی این شرایط برقرار است استفاده کنید:

- `curl ... /v1/models` کار می‌کند
- فراخوانی‌های مستقیم کوچک `/v1/chat/completions` کار می‌کنند
- اجرای مدل در OpenClaw فقط در turnهای عادی agent شکست می‌خورد

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

به این موارد توجه کنید:

- فراخوانی‌های کوچک مستقیم موفق می‌شوند، اما اجرای OpenClaw فقط روی promptهای بزرگ‌تر شکست می‌خورد
- خطاهای `model_not_found` یا 404 با وجود اینکه `/v1/chat/completions` مستقیم با همان شناسه مدل bare کار می‌کند
- خطاهای backend درباره اینکه `messages[].content` انتظار string دارد
- هشدارهای متناوب `incomplete turn detected ... stopReason=stop payloads=0` با یک backend محلی سازگار با OpenAI
- crashهای backend که فقط با تعداد tokenهای prompt بزرگ‌تر یا promptهای کامل زمان اجرای agent ظاهر می‌شوند

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` با یک سرور محلی به سبک MLX/vLLM → بررسی کنید `baseUrl` شامل `/v1` باشد، مقدار `api` برای backendهای `/v1/chat/completions` برابر `"openai-completions"` باشد، و `models.providers.<provider>.models[].id` همان شناسه bare محلیِ provider باشد. آن را یک بار با پیشوند provider انتخاب کنید، برای مثال `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ ورودی catalog را به شکل `mlx-community/Qwen3-30B-A3B-6bit` نگه دارید.
    - `messages[...].content: invalid type: sequence, expected a string` → backend بخش‌های محتوای ساختاریافته Chat Completions را رد می‌کند. رفع: `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend درخواست Chat Completions را کامل کرده اما برای آن turn هیچ متن assistant قابل مشاهده برای کاربر برنگردانده است. OpenClaw turnهای خالی سازگار با OpenAI را که replay-safe هستند یک بار retry می‌کند؛ شکست‌های پایدار معمولا یعنی backend محتوای خالی/غیرمتنی منتشر می‌کند یا متن پاسخ نهایی را suppress می‌کند.
    - درخواست‌های کوچک مستقیم موفق می‌شوند، اما اجرای agent در OpenClaw با crashهای backend/model شکست می‌خورد (برای مثال Gemma روی برخی buildهای `inferrs`) → transport در OpenClaw احتمالا از قبل درست است؛ backend روی شکل بزرگ‌تر prompt زمان اجرای agent شکست می‌خورد.
    - شکست‌ها پس از غیرفعال‌کردن ابزارها کمتر می‌شوند اما ناپدید نمی‌شوند → schemaهای ابزار بخشی از فشار بودند، اما مشکل باقی‌مانده همچنان ظرفیت model/server بالادستی یا bug در backend است.

  </Accordion>
  <Accordion title="Fix options">
    1. برای backendهای Chat Completions فقط-string، مقدار `compat.requiresStringContent: true` را تنظیم کنید.
    2. برای model/backendهایی که نمی‌توانند سطح schema ابزار OpenClaw را قابل‌اعتماد مدیریت کنند، مقدار `compat.supportsTools: false` را تنظیم کنید.
    3. فشار prompt را تا حد ممکن کاهش دهید: bootstrap کوچک‌تر workspace، تاریخچه session کوتاه‌تر، مدل محلی سبک‌تر، یا backendی با پشتیبانی قوی‌تر از زمینه طولانی.
    4. اگر درخواست‌های کوچک مستقیم همچنان موفق می‌شوند اما turnهای agent در OpenClaw هنوز داخل backend crash می‌کنند، آن را به‌عنوان محدودیت server/model بالادستی در نظر بگیرید و یک repro با شکل payload پذیرفته‌شده در همان‌جا ثبت کنید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/gateway/configuration)
- [مدل‌های محلی](/fa/gateway/local-models)
- [endpointهای سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)

## بدون پاسخ

اگر channelها فعال هستند اما چیزی پاسخ نمی‌دهد، پیش از reconnect کردن هر چیزی، routing و policy را بررسی کنید.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

به این موارد توجه کنید:

- Pairing برای فرستنده‌های DM در حالت pending است.
- gating مربوط به اشاره در گروه (`requireMention`, `mentionPatterns`).
- ناسازگاری‌های allowlist در channel/group.

امضاهای رایج:

- `drop guild message (mention required` → پیام گروه تا زمان mention نادیده گرفته می‌شود.
- `pairing request` → فرستنده به تایید نیاز دارد.
- `blocked` / `allowlist` → فرستنده/channel توسط policy فیلتر شده است.

مرتبط:

- [عیب‌یابی Channel](/fa/channels/troubleshooting)
- [گروه‌ها](/fa/channels/groups)
- [Pairing](/fa/channels/pairing)

## اتصال‌پذیری UI کنترل داشبورد

وقتی UI داشبورد/کنترل وصل نمی‌شود، URL، حالت auth، و فرض‌های secure context را اعتبارسنجی کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

به این موارد توجه کنید:

- URL درست probe و URL درست dashboard.
- ناسازگاری حالت auth/token بین client و Gateway.
- استفاده از HTTP در جایی که device identity لازم است.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → context ناامن یا نبود device auth.
    - `origin not allowed` → مقدار `Origin` مرورگر در `gateway.controlUi.allowedOrigins` نیست (یا از یک origin مرورگر غیر-loopback بدون allowlist صریح وصل می‌شوید).
    - `device nonce required` / `device nonce mismatch` → client جریان device auth مبتنی بر challenge را کامل نمی‌کند (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client برای handshake فعلی payload اشتباه (یا timestamp قدیمی) را امضا کرده است.
    - `AUTH_TOKEN_MISMATCH` با `canRetryWithDeviceToken=true` → client می‌تواند یک retry مورداعتماد با device token کش‌شده انجام دهد.
    - آن retry با cached-token همان مجموعه scope کش‌شده‌ای را دوباره استفاده می‌کند که همراه device token جفت‌شده ذخیره شده است. فراخوان‌های explicit `deviceToken` / explicit `scopes` در عوض مجموعه scope درخواستی خودشان را نگه می‌دارند.
    - خارج از آن مسیر retry، تقدم auth در connect ابتدا shared token/password صریح است، سپس `deviceToken` صریح، سپس device token ذخیره‌شده، سپس bootstrap token.
    - در مسیر async Tailscale Serve Control UI، تلاش‌های شکست‌خورده برای همان `{scope, ip}` پیش از ثبت شکست توسط limiter سریالی می‌شوند. بنابراین دو retry هم‌زمان ناموفق از همان client می‌توانند در تلاش دوم به‌جای دو mismatch ساده، `retry later` را نشان دهند.
    - `too many failed authentication attempts (retry later)` از یک client مرورگر-origin loopback → شکست‌های تکراری از همان `Origin` نرمال‌شده موقتا lock out می‌شوند؛ یک origin localhost دیگر bucket جداگانه‌ای دارد.
    - `unauthorized` تکراری پس از آن retry → drift در shared token/device token؛ پیکربندی token را refresh کنید و در صورت نیاز device token را دوباره approve/rotate کنید.
    - `gateway connect failed:` → هدف host/port/url اشتباه است.

  </Accordion>
</AccordionGroup>

### نگاشت سریع کدهای جزئیات auth

از `error.details.code` در پاسخ `connect` ناموفق استفاده کنید تا اقدام بعدی را انتخاب کنید:

| کد جزئیات                  | معنی                                                                                                                                                                                      | اقدام پیشنهادی                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | کلاینت توکن مشترک الزامی را ارسال نکرد.                                                                                                                                                 | توکن را در کلاینت بچسبانید/تنظیم کنید و دوباره تلاش کنید. برای مسیرهای داشبورد: `openclaw config get gateway.auth.token` سپس آن را در تنظیمات Control UI بچسبانید.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | توکن مشترک با توکن احراز هویت Gateway مطابقت نداشت.                                                                                                                                               | اگر `canRetryWithDeviceToken=true` است، یک تلاش دوبارهٔ مورد اعتماد را مجاز کنید. تلاش‌های دوباره با توکن کش‌شده، دامنه‌های تأییدشدهٔ ذخیره‌شده را دوباره استفاده می‌کنند؛ فراخواننده‌های صریح `deviceToken` / `scopes` دامنه‌های درخواستی را نگه می‌دارند. اگر همچنان شکست خورد، [چک‌لیست بازیابی انحراف توکن](/fa/cli/devices#token-drift-recovery-checklist) را اجرا کنید. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | توکن کش‌شدهٔ هر دستگاه قدیمی یا لغوشده است.                                                                                                                                                 | توکن دستگاه را با استفاده از [CLI دستگاه‌ها](/fa/cli/devices) بچرخانید/دوباره تأیید کنید، سپس دوباره وصل شوید.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | هویت دستگاه نیاز به تأیید دارد. `error.details.reason` را برای `not-paired`، `scope-upgrade`، `role-upgrade`، یا `metadata-upgrade` بررسی کنید، و وقتی موجود است از `requestId` / `remediationHint` استفاده کنید. | درخواست در انتظار را تأیید کنید: `openclaw devices list` سپس `openclaw devices approve <requestId>`. ارتقاهای دامنه/نقش پس از بررسی دسترسی درخواستی، از همان جریان استفاده می‌کنند.                                                                                                               |

<Note>
RPCهای مستقیم بک‌اند loopback که با توکن/رمز عبور مشترک Gateway احراز هویت شده‌اند، نباید به خط مبنای دامنهٔ دستگاه جفت‌شدهٔ CLI وابسته باشند. اگر subagentها یا فراخوانی‌های داخلی دیگر همچنان با `scope-upgrade` شکست می‌خورند، بررسی کنید فراخواننده از `client.id: "gateway-client"` و `client.mode: "backend"` استفاده می‌کند و `deviceIdentity` صریح یا توکن دستگاه را به‌اجبار تنظیم نمی‌کند.
</Note>

بررسی مهاجرت احراز هویت دستگاه v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

اگر لاگ‌ها خطاهای nonce/signature را نشان می‌دهند، کلاینت متصل‌شونده را به‌روزرسانی و آن را تأیید کنید:

<Steps>
  <Step title="منتظر connect.challenge بمانید">
    کلاینت منتظر `connect.challenge` صادرشده از سوی Gateway می‌ماند.
  </Step>
  <Step title="payload را امضا کنید">
    کلاینت payload مقید به challenge را امضا می‌کند.
  </Step>
  <Step title="nonce دستگاه را ارسال کنید">
    کلاینت `connect.params.device.nonce` را با همان challenge nonce ارسال می‌کند.
  </Step>
</Steps>

اگر `openclaw devices rotate` / `revoke` / `remove` به‌طور غیرمنتظره رد شد:

- نشست‌های توکن دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را مدیریت کنند، مگر اینکه فراخواننده `operator.admin` را هم داشته باشد
- `openclaw devices rotate --scope ...` فقط می‌تواند دامنه‌های operator را درخواست کند که نشست فراخواننده از قبل دارد

مرتبط:

- [پیکربندی](/fa/gateway/configuration) (حالت‌های احراز هویت Gateway)
- [Control UI](/fa/web/control-ui)
- [دستگاه‌ها](/fa/cli/devices)
- [دسترسی راه دور](/fa/gateway/remote)
- [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)

## سرویس Gateway در حال اجرا نیست

وقتی سرویس نصب شده اما فرایند پایدار نمی‌ماند، از این استفاده کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

به دنبال این موارد باشید:

- `Runtime: stopped` همراه با راهنمایی‌های خروج.
- عدم تطابق پیکربندی سرویس (`Config (cli)` در برابر `Config (service)`).
- تداخل‌های پورت/شنونده.
- نصب‌های اضافی launchd/systemd/schtasks وقتی `--deep` استفاده می‌شود.
- راهنمایی‌های پاک‌سازی `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `Gateway start blocked: set gateway.mode=local` یا `existing config is missing gateway.mode` → حالت Gateway محلی فعال نیست، یا فایل پیکربندی بازنویسی شده و `gateway.mode` را از دست داده است. رفع: `gateway.mode="local"` را در پیکربندی خود تنظیم کنید، یا `openclaw onboard --mode local` / `openclaw setup` را دوباره اجرا کنید تا پیکربندی مورد انتظار حالت محلی دوباره ثبت شود. اگر OpenClaw را از طریق Podman اجرا می‌کنید، مسیر پیش‌فرض پیکربندی `~/.openclaw/openclaw.json` است.
    - `refusing to bind gateway ... without auth` → bind غیر-loopback بدون مسیر احراز هویت معتبر Gateway (توکن/رمز عبور، یا trusted-proxy در جایی که پیکربندی شده است).
    - `another gateway instance is already listening` / `EADDRINUSE` → تداخل پورت.
    - `Other gateway-like services detected (best effort)` → واحدهای launchd/systemd/schtasks قدیمی یا موازی وجود دارند. بیشتر راه‌اندازی‌ها باید یک Gateway در هر ماشین نگه دارند؛ اگر واقعاً به بیش از یکی نیاز دارید، پورت‌ها + پیکربندی/وضعیت/فضای کاری را جدا کنید. ببینید [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` از doctor → یک واحد سیستم systemd وجود دارد در حالی که سرویس سطح کاربر وجود ندارد. قبل از اجازه دادن به doctor برای نصب سرویس کاربر، مورد تکراری را حذف یا غیرفعال کنید، یا اگر واحد سیستم همان سرپرست مورد نظر است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.
    - `Gateway service port does not match current gateway config` → سرپرست نصب‌شده هنوز `--port` قدیمی را ثابت نگه داشته است. `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید، سپس سرویس Gateway را راه‌اندازی مجدد کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [Doctor](/fa/gateway/doctor)

## Gateway آخرین پیکربندی سالم شناخته‌شده را بازیابی کرد

وقتی Gateway شروع می‌شود، اما لاگ‌ها می‌گویند `openclaw.json` را بازیابی کرده است، از این استفاده کنید.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

به دنبال این موارد باشید:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- یک فایل `openclaw.json.clobbered.*` دارای timestamp کنار پیکربندی فعال
- یک رویداد سیستم main-agent که با `Config recovery warning` شروع می‌شود

<AccordionGroup>
  <Accordion title="چه اتفاقی افتاد">
    - پیکربندی ردشده هنگام راه‌اندازی یا بارگذاری مجدد داغ اعتبارسنجی نشد.
    - OpenClaw payload ردشده را به‌صورت `.clobbered.*` حفظ کرد.
    - پیکربندی فعال از آخرین کپی معتبرسازی‌شدهٔ آخرین سالم شناخته‌شده بازیابی شد.
    - به نوبت بعدی main-agent هشدار داده می‌شود که پیکربندی ردشده را کورکورانه بازنویسی نکند.
    - اگر همهٔ مشکلات اعتبارسنجی زیر `plugins.entries.<id>...` بودند، OpenClaw کل فایل را بازیابی نمی‌کرد. شکست‌های محلی Plugin آشکار می‌مانند، در حالی که تنظیمات نامرتبط کاربر در پیکربندی فعال باقی می‌مانند.

  </Accordion>
  <Accordion title="بررسی و تعمیر">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="امضاهای رایج">
    - `.clobbered.*` وجود دارد → یک ویرایش مستقیم خارجی یا خواندن هنگام راه‌اندازی بازیابی شده است.
    - `.rejected.*` وجود دارد → یک نوشتن پیکربندی متعلق به OpenClaw پیش از commit در schema یا بررسی‌های clobber شکست خورد.
    - `Config write rejected:` → نوشتن تلاش کرد شکل الزامی را حذف کند، فایل را به‌طور شدید کوچک کند، یا پیکربندی نامعتبر را پایدار کند.
    - `missing-meta-vs-last-good`، `gateway-mode-missing-vs-last-good`، یا `size-drop-vs-last-good:*` → راه‌اندازی فایل فعلی را clobbered تلقی کرد چون نسبت به پشتیبان آخرین سالم شناخته‌شده، فیلدها یا اندازه را از دست داده بود.
    - `Config last-known-good promotion skipped` → نامزد شامل جای‌نگهدارهای secret پوشانده‌شده مثل `***` بود.

  </Accordion>
  <Accordion title="گزینه‌های رفع">
    1. اگر پیکربندی فعال بازیابی‌شده درست است، آن را نگه دارید.
    2. فقط کلیدهای مورد نظر را از `.clobbered.*` یا `.rejected.*` کپی کنید، سپس آن‌ها را با `openclaw config set` یا `config.patch` اعمال کنید.
    3. پیش از راه‌اندازی مجدد، `openclaw config validate` را اجرا کنید.
    4. اگر دستی ویرایش می‌کنید، پیکربندی کامل JSON5 را نگه دارید، نه فقط شیء جزئی‌ای را که می‌خواستید تغییر دهید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [Config](/fa/cli/config)
- [پیکربندی: بارگذاری مجدد داغ](/fa/gateway/configuration#config-hot-reload)
- [پیکربندی: اعتبارسنجی سخت‌گیرانه](/fa/gateway/configuration#strict-validation)
- [Doctor](/fa/gateway/doctor)

## هشدارهای probe Gateway

وقتی `openclaw gateway probe` به چیزی می‌رسد، اما همچنان یک بلوک هشدار چاپ می‌کند، از این استفاده کنید.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

به دنبال این موارد باشید:

- `warnings[].code` و `primaryTargetId` در خروجی JSON.
- اینکه هشدار دربارهٔ fallback SSH، چندین Gateway، دامنه‌های گم‌شده، یا auth refهای حل‌نشده است.

امضاهای رایج:

- `SSH tunnel failed to start; falling back to direct probes.` → راه‌اندازی SSH شکست خورد، اما فرمان همچنان هدف‌های مستقیم پیکربندی‌شده/loopback را امتحان کرد.
- `multiple reachable gateways detected` → بیش از یک هدف پاسخ داد. معمولاً این یعنی راه‌اندازی چند-Gateway عمدی یا شنونده‌های قدیمی/تکراری.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → اتصال کار کرد، اما RPC جزئیات به‌دلیل دامنه محدود است؛ هویت دستگاه را جفت کنید یا از اعتبارنامه‌هایی با `operator.read` استفاده کنید.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → اتصال کار کرد، اما مجموعهٔ کامل RPC تشخیصی timeout شد یا شکست خورد. این را به‌عنوان Gateway قابل دسترسی با تشخیص‌های تنزل‌یافته در نظر بگیرید؛ `connect.ok` و `connect.rpcOk` را در خروجی `--json` مقایسه کنید.
- `Capability: pairing-pending` یا `gateway closed (1008): pairing required` → Gateway پاسخ داد، اما این کلاینت همچنان پیش از دسترسی معمول operator به جفت‌سازی/تأیید نیاز دارد.
- متن هشدار SecretRef حل‌نشدهٔ `gateway.auth.*` / `gateway.remote.*` → مواد احراز هویت در این مسیر فرمان برای هدف شکست‌خورده در دسترس نبود.

مرتبط:

- [Gateway](/fa/cli/gateway)
- [چند Gateway روی یک میزبان](/fa/gateway#multiple-gateways-same-host)
- [دسترسی راه دور](/fa/gateway/remote)

## کانال متصل است، پیام‌ها جریان ندارند

اگر وضعیت کانال متصل است اما جریان پیام مرده است، روی policy، مجوزها، و قوانین تحویل خاص کانال تمرکز کنید.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

به دنبال این موارد باشید:

- policy پیام مستقیم (`pairing`، `allowlist`، `open`، `disabled`).
- فهرست مجاز گروه و الزامات mention.
- مجوزها/دامنه‌های API کانال که وجود ندارند.

امضاهای رایج:

- `mention required` → پیام طبق سیاست منشن گروه نادیده گرفته شد.
- ردپاهای `pairing` / تأیید در انتظار → فرستنده تأیید نشده است.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشکل احراز هویت/مجوزهای کانال.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [Discord](/fa/channels/discord)
- [Telegram](/fa/channels/telegram)
- [WhatsApp](/fa/channels/whatsapp)

## تحویل Cron و Heartbeat

اگر cron یا heartbeat اجرا نشد یا تحویل نداد، ابتدا وضعیت زمان‌بند و سپس مقصد تحویل را بررسی کنید.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

دنبال این موارد بگردید:

- Cron فعال باشد و بیدارباش بعدی وجود داشته باشد.
- وضعیت تاریخچه اجرای کار (`ok`، `skipped`، `error`).
- دلایل رد شدن Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron غیرفعال است.
    - `cron: timer tick failed` → تیک زمان‌بند شکست خورد؛ خطاهای فایل/لاگ/زمان اجرا را بررسی کنید.
    - `heartbeat skipped` با `reason=quiet-hours` → خارج از بازه ساعت‌های فعال است.
    - `heartbeat skipped` با `reason=empty-heartbeat-file` → `HEARTBEAT.md` وجود دارد اما فقط شامل خطوط خالی / سرصفحه‌های markdown است، بنابراین OpenClaw فراخوانی مدل را رد می‌کند.
    - `heartbeat skipped` با `reason=no-tasks-due` → `HEARTBEAT.md` شامل یک بلوک `tasks:` است، اما هیچ‌کدام از کارها در این تیک موعد اجرا ندارند.
    - `heartbeat: unknown accountId` → شناسه حساب برای مقصد تحویل heartbeat نامعتبر است.
    - `heartbeat skipped` با `reason=dm-blocked` → مقصد heartbeat به یک مقصد سبک DM تبدیل شده، در حالی که `agents.defaults.heartbeat.directPolicy` (یا override هر عامل) روی `block` تنظیم شده است.

  </Accordion>
</AccordionGroup>

مرتبط:

- [Heartbeat](/fa/gateway/heartbeat)
- [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
- [کارهای زمان‌بندی‌شده: عیب‌یابی](/fa/automation/cron-jobs#troubleshooting)

## Node جفت شده است، ابزار شکست می‌خورد

اگر یک node جفت شده اما ابزارها شکست می‌خورند، وضعیت foreground، مجوز و تأیید را جداگانه بررسی کنید.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

دنبال این موارد بگردید:

- Node آنلاین با قابلیت‌های مورد انتظار.
- اعطای مجوزهای سیستم‌عامل برای دوربین/میکروفون/موقعیت/صفحه‌نمایش.
- وضعیت تأییدهای exec و allowlist.

امضاهای رایج:

- `NODE_BACKGROUND_UNAVAILABLE` → برنامه node باید در foreground باشد.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → مجوز سیستم‌عامل وجود ندارد.
- `SYSTEM_RUN_DENIED: approval required` → تأیید exec در انتظار است.
- `SYSTEM_RUN_DENIED: allowlist miss` → دستور توسط allowlist مسدود شده است.

مرتبط:

- [تأییدهای exec](/fa/tools/exec-approvals)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
- [Nodeها](/fa/nodes/index)

## ابزار مرورگر شکست می‌خورد

وقتی کنش‌های ابزار مرورگر شکست می‌خورند، با اینکه خود gateway سالم است، از این استفاده کنید.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

دنبال این موارد بگردید:

- اینکه `plugins.allow` تنظیم شده و شامل `browser` باشد.
- مسیر اجرایی معتبر مرورگر.
- دسترس‌پذیری پروفایل CDP.
- در دسترس بودن Chrome محلی برای پروفایل‌های `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` یا `unknown command 'browser'` → Plugin مرورگر همراه، توسط `plugins.allow` مستثنی شده است.
    - ابزار مرورگر وجود ندارد / در دسترس نیست در حالی که `browser.enabled=true` → `plugins.allow`، `browser` را مستثنی می‌کند، پس Plugin هرگز بارگذاری نشده است.
    - `Failed to start Chrome CDP on port` → فرایند مرورگر اجرا نشد.
    - `browser.executablePath not found` → مسیر پیکربندی‌شده نامعتبر است.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL پیکربندی‌شده CDP از طرح پشتیبانی‌نشده‌ای مثل `file:` یا `ftp:` استفاده می‌کند.
    - `browser.cdpUrl has invalid port` → URL پیکربندی‌شده CDP پورت بد یا خارج از محدوده دارد.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → نصب فعلی Gateway فاقد وابستگی زمان اجرای `playwright-core` مربوط به Plugin مرورگر همراه است؛ `openclaw doctor --fix` را اجرا کنید، سپس Gateway را راه‌اندازی مجدد کنید. snapshotهای ARIA و screenshotهای پایه صفحه همچنان می‌توانند کار کنند، اما پیمایش، snapshotهای AI، screenshotهای عنصر با selector CSS، و خروجی PDF همچنان در دسترس نیستند.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → existing-session مربوط به Chrome MCP هنوز نتوانست به dir داده مرورگر انتخاب‌شده attach شود. صفحه inspect مرورگر را باز کنید، remote debugging را فعال کنید، مرورگر را باز نگه دارید، اولین prompt اتصال را تأیید کنید، سپس دوباره تلاش کنید. اگر وضعیت ورود لازم نیست، پروفایل مدیریت‌شده `openclaw` را ترجیح دهید.
    - `No Chrome tabs found for profile="user"` → پروفایل attach در Chrome MCP هیچ tab محلی باز Chrome ندارد.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint راه دور CDP پیکربندی‌شده از میزبان Gateway قابل دسترسی نیست.
    - `Browser attachOnly is enabled ... not reachable` یا `Browser attachOnly is enabled and CDP websocket ... is not reachable` → پروفایل فقط-attach هدف قابل دسترس ندارد، یا endpoint HTTP پاسخ داده اما CDP WebSocket همچنان باز نشده است.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → درخواست screenshot، `--full-page` را با `--ref` یا `--element` ترکیب کرده است.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → فراخوانی‌های screenshot در Chrome MCP / `existing-session` باید از capture صفحه یا `--ref` یک snapshot استفاده کنند، نه CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hookهای آپلود Chrome MCP به refهای snapshot نیاز دارند، نه selectorهای CSS.
    - `existing-session file uploads currently support one file at a time.` → در پروفایل‌های Chrome MCP برای هر فراخوانی یک آپلود ارسال کنید.
    - `existing-session dialog handling does not support timeoutMs.` → hookهای dialog در پروفایل‌های Chrome MCP از overrideهای timeout پشتیبانی نمی‌کنند.
    - `existing-session type does not support timeoutMs overrides.` → برای `act:type` روی `profile="user"` / پروفایل‌های existing-session در Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از یک پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `existing-session evaluate does not support timeoutMs overrides.` → برای `act:evaluate` روی `profile="user"` / پروفایل‌های existing-session در Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از یک پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارد.
    - overrideهای viewport / dark-mode / locale / offline کهنه روی پروفایل‌های فقط-attach یا CDP راه دور → `openclaw browser stop --browser-profile <name>` را اجرا کنید تا نشست کنترل فعال بسته شود و وضعیت emulation مربوط به Playwright/CDP بدون راه‌اندازی مجدد کل Gateway آزاد شود.

  </Accordion>
</AccordionGroup>

مرتبط:

- [مرورگر (مدیریت‌شده توسط OpenClaw)](/fa/tools/browser)
- [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting)

## اگر ارتقا دادید و چیزی ناگهان خراب شد

بیشتر خرابی‌های پس از ارتقا ناشی از drift پیکربندی یا اعمال شدن پیش‌فرض‌های سخت‌گیرانه‌تر است.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    چه چیزهایی را بررسی کنید:

    - اگر `gateway.mode=remote` باشد، فراخوانی‌های CLI ممکن است مقصدشان remote باشد در حالی که سرویس محلی شما مشکلی ندارد.
    - فراخوانی‌های صریح `--url` به credentials ذخیره‌شده fallback نمی‌کنند.

    امضاهای رایج:

    - `gateway connect failed:` → مقصد URL اشتباه است.
    - `unauthorized` → endpoint قابل دسترسی است اما auth اشتباه است.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    چه چیزهایی را بررسی کنید:

    - bindهای غیر-loopback (`lan`، `tailnet`، `custom`) به یک مسیر معتبر auth برای Gateway نیاز دارند: auth با token/password مشترک، یا یک استقرار `trusted-proxy` غیر-loopback که درست پیکربندی شده باشد.
    - کلیدهای قدیمی مثل `gateway.token` جایگزین `gateway.auth.token` نمی‌شوند.

    امضاهای رایج:

    - `refusing to bind gateway ... without auth` → bind غیر-loopback بدون مسیر معتبر auth برای Gateway.
    - `Connectivity probe: failed` در حالی که runtime در حال اجراست → Gateway زنده است اما با auth/url فعلی قابل دسترسی نیست.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    چه چیزهایی را بررسی کنید:

    - تأییدهای در انتظار دستگاه برای dashboard/nodeها.
    - تأییدهای در انتظار pairing در DM پس از تغییرات policy یا identity.

    امضاهای رایج:

    - `device identity required` → auth دستگاه برآورده نشده است.
    - `pairing required` → فرستنده/دستگاه باید تأیید شود.

  </Accordion>
</AccordionGroup>

اگر پیکربندی سرویس و runtime پس از بررسی‌ها همچنان با هم اختلاف دارند، metadata سرویس را از همان دایرکتوری profile/state دوباره نصب کنید:

```bash
openclaw gateway install --force
openclaw gateway restart
```

مرتبط:

- [احراز هویت](/fa/gateway/authentication)
- [exec پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [pairing تحت مالکیت Gateway](/fa/gateway/pairing)

## مرتبط

- [Doctor](/fa/gateway/doctor)
- [FAQ](/fa/help/faq)
- [runbook Gateway](/fa/gateway)
