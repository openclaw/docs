---
read_when:
    - مرکز عیب‌یابی شما را برای تشخیص عمیق‌تر به اینجا هدایت کرد
    - شما به بخش‌های راهنمای اجرایی پایدارِ مبتنی بر نشانه‌ها با دستورهای دقیق نیاز دارید
sidebarTitle: Troubleshooting
summary: راهنمای عملیاتی عیب‌یابی عمیق برای Gateway، کانال‌ها، خودکارسازی، گره‌ها و مرورگر
title: عیب‌یابی
x-i18n:
    generated_at: "2026-05-01T11:47:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

این صفحه راهنمای اجرای عمیق است. اگر ابتدا جریان سریع عیب‌یابی را می‌خواهید، از [/help/troubleshooting](/fa/help/troubleshooting) شروع کنید.

## نردبان فرمان‌ها

این‌ها را ابتدا، به همین ترتیب اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

نشانه‌های سالم مورد انتظار:

- `openclaw gateway status` مقدار `Runtime: running`، مقدار `Connectivity probe: ok`، و یک خط `Capability: ...` را نشان می‌دهد.
- `openclaw doctor` هیچ مشکل مسدودکننده‌ای در پیکربندی/سرویس گزارش نمی‌کند.
- `openclaw channels status --probe` وضعیت زنده انتقال برای هر حساب و، در صورت پشتیبانی، نتایج probe/audit مانند `works` یا `audit ok` را نشان می‌دهد.

## نصب‌های split brain و محافظ پیکربندی جدیدتر

وقتی سرویس Gateway پس از یک به‌روزرسانی به‌طور غیرمنتظره متوقف می‌شود، یا لاگ‌ها نشان می‌دهند که یک باینری `openclaw` قدیمی‌تر از نسخه‌ای است که آخرین بار `openclaw.json` را نوشته، از این بخش استفاده کنید.

OpenClaw نوشتن پیکربندی را با `meta.lastTouchedVersion` مهر می‌زند. فرمان‌های فقط‌خواندنی همچنان می‌توانند پیکربندی نوشته‌شده توسط OpenClaw جدیدتر را بررسی کنند، اما جهش‌های فرایند و سرویس از ادامه با باینری قدیمی‌تر خودداری می‌کنند. اقدامات مسدودشده شامل شروع، توقف، راه‌اندازی دوباره، حذف نصب سرویس Gateway، نصب دوباره اجباری سرویس، راه‌اندازی Gateway در حالت سرویس، و پاک‌سازی پورت با `gateway --force` هستند.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="اصلاح PATH">
    `PATH` را طوری اصلاح کنید که `openclaw` به نصب جدیدتر اشاره کند، سپس اقدام را دوباره اجرا کنید.
  </Step>
  <Step title="نصب دوباره سرویس Gateway">
    سرویس Gateway مورد نظر را از نصب جدیدتر دوباره نصب کنید:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="حذف wrapperهای کهنه">
    بسته سیستمی کهنه یا ورودی‌های wrapper قدیمی را که هنوز به یک باینری قدیمی `openclaw` اشاره می‌کنند حذف کنید.
  </Step>
</Steps>

<Warning>
فقط برای downgrade عمدی یا بازیابی اضطراری، `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` را برای همان یک فرمان تنظیم کنید. برای عملیات عادی آن را تنظیم‌نشده بگذارید.
</Warning>

## استفاده اضافی Anthropic 429 برای زمینه بلند لازم است

وقتی لاگ‌ها/خطاها شامل این باشند، از این بخش استفاده کنید: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

به‌دنبال این موارد باشید:

- مدل Anthropic Opus/Sonnet انتخاب‌شده `params.context1m: true` دارد.
- اعتبارنامه فعلی Anthropic برای استفاده از زمینه بلند واجد شرایط نیست.
- درخواست‌ها فقط در جلسه‌ها/اجرای مدل‌های بلند که به مسیر beta یک‌میلیونی نیاز دارند شکست می‌خورند.

گزینه‌های اصلاح:

<Steps>
  <Step title="غیرفعال کردن context1m">
    برای آن مدل، `context1m` را غیرفعال کنید تا به پنجره زمینه عادی برگردد.
  </Step>
  <Step title="استفاده از اعتبارنامه واجد شرایط">
    از اعتبارنامه Anthropic واجد شرایط برای درخواست‌های زمینه بلند استفاده کنید، یا به کلید API Anthropic تغییر دهید.
  </Step>
  <Step title="پیکربندی مدل‌های fallback">
    مدل‌های fallback را پیکربندی کنید تا وقتی درخواست‌های زمینه بلند Anthropic رد می‌شوند، اجراها ادامه پیدا کنند.
  </Step>
</Steps>

مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [چرا HTTP 429 را از Anthropic می‌بینم؟](/fa/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## بک‌اند محلی سازگار با OpenAI probeهای مستقیم را پاس می‌کند اما اجرای عامل شکست می‌خورد

وقتی این موارد برقرار است، از این بخش استفاده کنید:

- `curl ... /v1/models` کار می‌کند
- فراخوانی‌های کوچک مستقیم `/v1/chat/completions` کار می‌کنند
- اجرای مدل OpenClaw فقط در نوبت‌های عادی عامل شکست می‌خورد

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

به‌دنبال این موارد باشید:

- فراخوانی‌های کوچک مستقیم موفق می‌شوند، اما اجرای OpenClaw فقط روی promptهای بزرگ‌تر شکست می‌خورد
- خطاهای `model_not_found` یا 404 با اینکه `/v1/chat/completions` مستقیم با همان شناسه مدل ساده کار می‌کند
- خطاهای بک‌اند درباره اینکه `messages[].content` انتظار رشته دارد
- هشدارهای متناوب `incomplete turn detected ... stopReason=stop payloads=0` با یک بک‌اند محلی سازگار با OpenAI
- خرابی‌های بک‌اند که فقط با تعداد توکن prompt بزرگ‌تر یا promptهای کامل زمان اجرای عامل ظاهر می‌شوند

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `model_not_found` با یک سرور محلی به سبک MLX/vLLM → بررسی کنید `baseUrl` شامل `/v1` باشد، برای بک‌اندهای `/v1/chat/completions` مقدار `api` برابر `"openai-completions"` باشد، و `models.providers.<provider>.models[].id` همان شناسه ساده محلیِ provider باشد. آن را یک بار با پیشوند provider انتخاب کنید، برای نمونه `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ ورودی کاتالوگ را به صورت `mlx-community/Qwen3-30B-A3B-6bit` نگه دارید.
    - `messages[...].content: invalid type: sequence, expected a string` → بک‌اند بخش‌های محتوای ساختاریافته Chat Completions را رد می‌کند. اصلاح: `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
    - `incomplete turn detected ... stopReason=stop payloads=0` → بک‌اند درخواست Chat Completions را کامل کرده اما برای آن نوبت هیچ متن قابل مشاهده‌ای از دستیار برنگردانده است. OpenClaw نوبت‌های خالی سازگار با OpenAI را که replay-safe هستند یک بار دوباره تلاش می‌کند؛ شکست‌های پایدار معمولا یعنی بک‌اند محتوای خالی/غیرمتنی منتشر می‌کند یا متن پاسخ نهایی را سرکوب می‌کند.
    - درخواست‌های کوچک مستقیم موفق می‌شوند، اما اجرای عامل OpenClaw با خرابی‌های بک‌اند/مدل شکست می‌خورد (برای مثال Gemma روی برخی buildهای `inferrs`) → انتقال OpenClaw احتمالا از قبل درست است؛ بک‌اند روی شکل prompt بزرگ‌تر زمان اجرای عامل شکست می‌خورد.
    - پس از غیرفعال کردن ابزارها، شکست‌ها کم می‌شوند اما از بین نمی‌روند → schemaهای ابزار بخشی از فشار بودند، اما مشکل باقی‌مانده همچنان ظرفیت مدل/سرور upstream یا یک باگ بک‌اند است.

  </Accordion>
  <Accordion title="گزینه‌های اصلاح">
    1. برای بک‌اندهای Chat Completions فقط‌رشته، `compat.requiresStringContent: true` را تنظیم کنید.
    2. برای مدل‌ها/بک‌اندهایی که نمی‌توانند سطح schema ابزار OpenClaw را قابل اتکا مدیریت کنند، `compat.supportsTools: false` را تنظیم کنید.
    3. هرجا ممکن است فشار prompt را کاهش دهید: bootstrap کوچک‌تر workspace، تاریخچه جلسه کوتاه‌تر، مدل محلی سبک‌تر، یا بک‌اندی با پشتیبانی قوی‌تر از زمینه بلند.
    4. اگر درخواست‌های کوچک مستقیم همچنان پاس می‌شوند اما نوبت‌های عامل OpenClaw هنوز داخل بک‌اند crash می‌کنند، آن را محدودیت upstream سرور/مدل در نظر بگیرید و یک repro با شکل payload پذیرفته‌شده همان‌جا ثبت کنید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/gateway/configuration)
- [مدل‌های محلی](/fa/gateway/local-models)
- [endpointهای سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)

## پاسخی دریافت نمی‌شود

اگر کانال‌ها فعال هستند اما هیچ‌چیز پاسخ نمی‌دهد، پیش از اتصال دوباره هر چیزی، routing و policy را بررسی کنید.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

به‌دنبال این موارد باشید:

- Pairing برای فرستنده‌های DM در انتظار است.
- دروازه‌گذاری mention گروه (`requireMention`، `mentionPatterns`).
- ناهماهنگی‌های allowlist کانال/گروه.

امضاهای رایج:

- `drop guild message (mention required` → پیام گروه تا زمان mention نادیده گرفته می‌شود.
- `pairing request` → فرستنده به تایید نیاز دارد.
- `blocked` / `allowlist` → فرستنده/کانال با policy فیلتر شده است.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [گروه‌ها](/fa/channels/groups)
- [Pairing](/fa/channels/pairing)

## اتصال UI کنترل داشبورد

وقتی UI داشبورد/کنترل وصل نمی‌شود، URL، حالت احراز هویت، و فرض‌های زمینه امن را اعتبارسنجی کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

به‌دنبال این موارد باشید:

- URL درست probe و URL داشبورد.
- ناهماهنگی حالت احراز هویت/توکن بین client و Gateway.
- استفاده از HTTP جایی که هویت دستگاه لازم است.

<AccordionGroup>
  <Accordion title="امضاهای اتصال / احراز هویت">
    - `device identity required` → زمینه غیرامن یا نبود احراز هویت دستگاه.
    - `origin not allowed` → مقدار `Origin` مرورگر در `gateway.controlUi.allowedOrigins` نیست (یا از یک origin مرورگر غیر-loopback بدون allowlist صریح وصل می‌شوید).
    - `device nonce required` / `device nonce mismatch` → client جریان احراز هویت دستگاه مبتنی بر challenge را کامل نمی‌کند (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client برای handshake فعلی payload اشتباه (یا timestamp کهنه) را امضا کرده است.
    - `AUTH_TOKEN_MISMATCH` با `canRetryWithDeviceToken=true` → client می‌تواند یک retry قابل اعتماد با توکن دستگاه cache‌شده انجام دهد.
    - آن retry توکن cache‌شده از مجموعه scope ذخیره‌شده همراه توکن دستگاه paired استفاده می‌کند. فراخوان‌های صریح `deviceToken` / `scopes` صریح، مجموعه scope درخواستی خود را نگه می‌دارند.
    - خارج از آن مسیر retry، اولویت احراز هویت اتصال ابتدا توکن/password مشترک صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، و بعد توکن bootstrap است.
    - در مسیر ناهمگام Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, ip}` پیش از اینکه limiter شکست را ثبت کند سریالی می‌شوند. بنابراین دو retry هم‌زمان بد از یک client می‌توانند در تلاش دوم به‌جای دو mismatch ساده، `retry later` را نشان دهند.
    - `too many failed authentication attempts (retry later)` از یک client loopback با origin مرورگر → شکست‌های تکراری از همان `Origin` نرمال‌سازی‌شده موقتا قفل می‌شوند؛ یک origin localhost دیگر از bucket جداگانه استفاده می‌کند.
    - `unauthorized` تکراری پس از آن retry → drift در توکن مشترک/توکن دستگاه؛ پیکربندی توکن را تازه کنید و در صورت نیاز توکن دستگاه را دوباره تایید/rotate کنید.
    - `gateway connect failed:` → هدف host/port/url اشتباه است.

  </Accordion>
</AccordionGroup>

### نقشه سریع کدهای جزئیات احراز هویت

از `error.details.code` در پاسخ ناموفق `connect` استفاده کنید تا اقدام بعدی را انتخاب کنید:

| کد جزئیات                  | معنی                                                                                                                                                                                      | اقدام پیشنهادی                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | کلاینت توکن مشترکِ الزامی را ارسال نکرد.                                                                                                                                                 | توکن را در کلاینت جای‌گذاری/تنظیم کنید و دوباره تلاش کنید. برای مسیرهای داشبورد: `openclaw config get gateway.auth.token` سپس آن را در تنظیمات Control UI جای‌گذاری کنید.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | توکن مشترک با توکن احراز هویت Gateway مطابقت نداشت.                                                                                                                                               | اگر `canRetryWithDeviceToken=true` است، یک تلاش مجددِ مورد اعتماد را مجاز کنید. تلاش‌های مجدد با توکن کش‌شده از scopeهای تاییدشده ذخیره‌شده دوباره استفاده می‌کنند؛ فراخوان‌های صریح `deviceToken` / `scopes` همان scopeهای درخواستی را نگه می‌دارند. اگر همچنان ناموفق بود، [چک‌لیست بازیابی انحراف توکن](/fa/cli/devices#token-drift-recovery-checklist) را اجرا کنید. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | توکن کش‌شده برای هر دستگاه منسوخ یا لغو شده است.                                                                                                                                                 | توکن دستگاه را با استفاده از [CLI دستگاه‌ها](/fa/cli/devices) بچرخانید/دوباره تایید کنید، سپس دوباره وصل شوید.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | هویت دستگاه به تایید نیاز دارد. `error.details.reason` را برای `not-paired`، `scope-upgrade`، `role-upgrade`، یا `metadata-upgrade` بررسی کنید، و در صورت وجود از `requestId` / `remediationHint` استفاده کنید. | درخواست در انتظار را تایید کنید: `openclaw devices list` سپس `openclaw devices approve <requestId>`. ارتقاهای scope/نقش پس از بررسی دسترسی درخواستی از همان جریان استفاده می‌کنند.                                                                                                               |

<Note>
RPCهای مستقیم بک‌اند loopback که با توکن/رمز عبور مشترک Gateway احراز هویت شده‌اند نباید به خط پایه scope دستگاه جفت‌شده‌ی CLI وابسته باشند. اگر subagentها یا فراخوان‌های داخلی دیگر همچنان با `scope-upgrade` ناموفق می‌شوند، بررسی کنید فراخواننده از `client.id: "gateway-client"` و `client.mode: "backend"` استفاده می‌کند و `deviceIdentity` صریح یا توکن دستگاه را اجبار نمی‌کند.
</Note>

بررسی مهاجرت احراز هویت دستگاه v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

اگر لاگ‌ها خطاهای nonce/signature نشان می‌دهند، کلاینت متصل‌شونده را به‌روزرسانی و آن را بررسی کنید:

<Steps>
  <Step title="منتظر connect.challenge بمانید">
    کلاینت منتظر `connect.challenge` صادرشده توسط Gateway می‌ماند.
  </Step>
  <Step title="payload را امضا کنید">
    کلاینت payload وابسته به challenge را امضا می‌کند.
  </Step>
  <Step title="nonce دستگاه را ارسال کنید">
    کلاینت `connect.params.device.nonce` را با همان nonce مربوط به challenge ارسال می‌کند.
  </Step>
</Steps>

اگر `openclaw devices rotate` / `revoke` / `remove` به‌طور غیرمنتظره رد شد:

- نشست‌های توکن دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را مدیریت کنند، مگر اینکه فراخواننده `operator.admin` هم داشته باشد
- `openclaw devices rotate --scope ...` فقط می‌تواند scopeهای اپراتوری را درخواست کند که نشست فراخواننده از قبل در اختیار دارد

مرتبط:

- [پیکربندی](/fa/gateway/configuration) (حالت‌های احراز هویت Gateway)
- [Control UI](/fa/web/control-ui)
- [دستگاه‌ها](/fa/cli/devices)
- [دسترسی راه دور](/fa/gateway/remote)
- [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)

## سرویس Gateway در حال اجرا نیست

وقتی سرویس نصب شده اما فرایند پایدار نمی‌ماند، از این بخش استفاده کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

دنبال این موارد بگردید:

- `Runtime: stopped` همراه با راهنمایی‌های خروج.
- ناهماهنگی پیکربندی سرویس (`Config (cli)` در برابر `Config (service)`).
- تداخل‌های پورت/listener.
- نصب‌های اضافی launchd/systemd/schtasks وقتی `--deep` استفاده می‌شود.
- راهنمایی‌های پاک‌سازی `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `Gateway start blocked: set gateway.mode=local` یا `existing config is missing gateway.mode` → حالت Gateway محلی فعال نیست، یا فایل پیکربندی بازنویسی شده و `gateway.mode` را از دست داده است. رفع: `gateway.mode="local"` را در پیکربندی خود تنظیم کنید، یا `openclaw onboard --mode local` / `openclaw setup` را دوباره اجرا کنید تا پیکربندی مورد انتظارِ حالت محلی دوباره ثبت شود. اگر OpenClaw را از طریق Podman اجرا می‌کنید، مسیر پیش‌فرض پیکربندی `~/.openclaw/openclaw.json` است.
    - `refusing to bind gateway ... without auth` → bind غیر loopback بدون مسیر احراز هویت معتبر Gateway (توکن/رمز عبور، یا trusted-proxy در جایی که پیکربندی شده است).
    - `another gateway instance is already listening` / `EADDRINUSE` → تداخل پورت.
    - `Other gateway-like services detected (best effort)` → واحدهای قدیمی یا موازی launchd/systemd/schtasks وجود دارند. بیشتر راه‌اندازی‌ها باید برای هر ماشین یک Gateway داشته باشند؛ اگر واقعا به بیش از یکی نیاز دارید، پورت‌ها + پیکربندی/وضعیت/فضای کاری را جدا کنید. به [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) مراجعه کنید.
    - `System-level OpenClaw gateway service detected` از doctor → یک واحد systemd سطح سیستم وجود دارد در حالی که سرویس سطح کاربر موجود نیست. قبل از اینکه به doctor اجازه نصب سرویس کاربر بدهید، نمونه تکراری را حذف یا غیرفعال کنید، یا اگر واحد سیستم supervisor مورد نظر است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.
    - `Gateway service port does not match current gateway config` → supervisor نصب‌شده هنوز `--port` قدیمی را ثابت نگه می‌دارد. `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید، سپس سرویس Gateway را راه‌اندازی مجدد کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [Doctor](/fa/gateway/doctor)

## Gateway پیکربندی last-known-good را بازیابی کرد

وقتی Gateway شروع می‌شود، اما لاگ‌ها می‌گویند `openclaw.json` را بازیابی کرده است، از این بخش استفاده کنید.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

دنبال این موارد بگردید:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- یک فایل دارای timestamp به نام `openclaw.json.clobbered.*` کنار پیکربندی فعال
- یک رویداد سیستم main-agent که با `Config recovery warning` شروع می‌شود

<AccordionGroup>
  <Accordion title="چه اتفاقی افتاد">
    - پیکربندی ردشده هنگام راه‌اندازی یا بارگذاری مجدد داغ اعتبارسنجی نشد.
    - OpenClaw payload ردشده را به صورت `.clobbered.*` نگه داشت.
    - پیکربندی فعال از آخرین کپی معتبر last-known-good بازیابی شد.
    - به نوبت بعدی main-agent هشدار داده می‌شود که پیکربندی ردشده را کورکورانه بازنویسی نکند.
    - اگر همه مشکلات اعتبارسنجی زیر `plugins.entries.<id>...` بودند، OpenClaw کل فایل را بازیابی نمی‌کرد. خرابی‌های محلی Plugin پرصدا باقی می‌مانند در حالی که تنظیمات نامرتبط کاربر در پیکربندی فعال باقی می‌مانند.

  </Accordion>
  <Accordion title="بازرسی و تعمیر">
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
    - `.rejected.*` وجود دارد → یک نوشتن پیکربندی متعلق به OpenClaw پیش از commit در schema یا بررسی‌های clobber ناموفق شده است.
    - `Config write rejected:` → عملیات نوشتن تلاش کرده شکل الزامی را حذف کند، اندازه فایل را به‌شدت کاهش دهد، یا پیکربندی نامعتبر را پایدار کند.
    - `Rejected validation details:` → لاگ بازیابی یا اعلان main-agent شامل مسیر schema است که باعث بازیابی شده، مانند `agents.defaults.execution` یا `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`، `gateway-mode-missing-vs-last-good`، یا `size-drop-vs-last-good:*` → راه‌اندازی، فایل فعلی را clobbered تلقی کرده چون در مقایسه با نسخه پشتیبان last-known-good فیلدها یا اندازه را از دست داده است.
    - `Config last-known-good promotion skipped` → گزینه candidate شامل placeholderهای secret سانسورشده مانند `***` بوده است.

  </Accordion>
  <Accordion title="گزینه‌های رفع">
    1. اگر پیکربندی فعالِ بازیابی‌شده درست است، آن را نگه دارید.
    2. فقط کلیدهای مورد نظر را از `.clobbered.*` یا `.rejected.*` کپی کنید، سپس آن‌ها را با `openclaw config set` یا `config.patch` اعمال کنید.
    3. پیش از راه‌اندازی مجدد، `openclaw config validate` را اجرا کنید.
    4. اگر دستی ویرایش می‌کنید، پیکربندی کامل JSON5 را نگه دارید، نه فقط شیء جزئی‌ای که می‌خواستید تغییر دهید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/cli/config)
- [پیکربندی: بارگذاری مجدد داغ](/fa/gateway/configuration#config-hot-reload)
- [پیکربندی: اعتبارسنجی سخت‌گیرانه](/fa/gateway/configuration#strict-validation)
- [Doctor](/fa/gateway/doctor)

## هشدارهای کاوش Gateway

وقتی `openclaw gateway probe` به چیزی می‌رسد، اما همچنان یک بلوک هشدار چاپ می‌کند، از این بخش استفاده کنید.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

دنبال این موارد بگردید:

- `warnings[].code` و `primaryTargetId` در خروجی JSON.
- اینکه هشدار درباره fallback SSH، چند Gateway، scopeهای گمشده، یا ارجاع‌های احراز هویت حل‌نشده است.

امضاهای رایج:

- `SSH tunnel failed to start; falling back to direct probes.` → راه‌اندازی SSH ناموفق بود، اما فرمان همچنان هدف‌های پیکربندی‌شده/loopback مستقیم را امتحان کرد.
- `multiple reachable gateways detected` → بیش از یک هدف پاسخ داد. معمولا این یعنی یک راه‌اندازی چند-Gateway عمدی یا listenerهای قدیمی/تکراری.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → اتصال کار کرد، اما RPC جزئیات با scope محدود شده است؛ هویت دستگاه را جفت کنید یا از credentialهایی با `operator.read` استفاده کنید.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → اتصال کار کرد، اما مجموعه کامل RPC تشخیصی timeout شد یا ناموفق بود. این را به‌عنوان یک Gateway قابل دسترس با تشخیص‌های کاهش‌یافته در نظر بگیرید؛ `connect.ok` و `connect.rpcOk` را در خروجی `--json` مقایسه کنید.
- `Capability: pairing-pending` یا `gateway closed (1008): pairing required` → Gateway پاسخ داد، اما این کلاینت هنوز پیش از دسترسی عادی اپراتور به جفت‌سازی/تایید نیاز دارد.
- متن هشدار SecretRef حل‌نشده `gateway.auth.*` / `gateway.remote.*` → مواد احراز هویت در این مسیر فرمان برای هدف ناموفق در دسترس نبود.

مرتبط:

- [Gateway](/fa/cli/gateway)
- [چند Gateway روی یک میزبان](/fa/gateway#multiple-gateways-same-host)
- [دسترسی راه دور](/fa/gateway/remote)

## کانال متصل است، پیام‌ها جریان ندارند

اگر وضعیت کانال متصل است اما جریان پیام متوقف شده، روی policy، مجوزها، و قواعد تحویل مخصوص کانال تمرکز کنید.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

دنبال این موارد بگردید:

- خط‌مشی DM (`pairing`، `allowlist`، `open`، `disabled`).
- allowlist گروه و الزامات mention.
- مجوزها/scopeهای API کانال که وجود ندارند.

امضاهای رایج:

- `mention required` → پیام به‌دلیل خط‌مشی mention گروه نادیده گرفته شد.
- `pairing` / ردپاهای تأیید در انتظار → فرستنده تأیید نشده است.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشکل احراز هویت/مجوزهای کانال.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [Discord](/fa/channels/discord)
- [Telegram](/fa/channels/telegram)
- [WhatsApp](/fa/channels/whatsapp)

## تحویل Cron و Heartbeat

اگر Cron یا Heartbeat اجرا نشد یا تحویل انجام نداد، ابتدا وضعیت زمان‌بند را بررسی کنید، سپس مقصد تحویل را.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

دنبال این موارد بگردید:

- Cron فعال باشد و بیدارباش بعدی موجود باشد.
- وضعیت تاریخچه اجرای کار (`ok`، `skipped`، `error`).
- دلایل رد شدن Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron غیرفعال است.
    - `cron: timer tick failed` → تیک زمان‌بند ناموفق بود؛ خطاهای فایل/لاگ/زمان اجرا را بررسی کنید.
    - `heartbeat skipped` با `reason=quiet-hours` → خارج از بازه ساعت‌های فعال است.
    - `heartbeat skipped` با `reason=empty-heartbeat-file` → `HEARTBEAT.md` وجود دارد اما فقط شامل خط‌های خالی / سرآیندهای markdown است، بنابراین OpenClaw فراخوانی مدل را رد می‌کند.
    - `heartbeat skipped` با `reason=no-tasks-due` → `HEARTBEAT.md` شامل یک بلوک `tasks:` است، اما هیچ‌کدام از کارها در این تیک موعد اجرا ندارند.
    - `heartbeat: unknown accountId` → شناسه حساب برای مقصد تحویل Heartbeat نامعتبر است.
    - `heartbeat skipped` با `reason=dm-blocked` → مقصد Heartbeat به یک مقصد سبک DM resolve شده، در حالی که `agents.defaults.heartbeat.directPolicy` (یا override هر agent) روی `block` تنظیم شده است.

  </Accordion>
</AccordionGroup>

مرتبط:

- [Heartbeat](/fa/gateway/heartbeat)
- [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
- [کارهای زمان‌بندی‌شده: عیب‌یابی](/fa/automation/cron-jobs#troubleshooting)

## Node جفت شده است، ابزار ناموفق می‌شود

اگر یک Node جفت شده اما ابزارها ناموفق می‌شوند، وضعیت foreground، مجوز و تأیید را جداگانه بررسی کنید.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

دنبال این موارد بگردید:

- Node آنلاین با قابلیت‌های مورد انتظار.
- اعطای مجوزهای سیستم‌عامل برای دوربین/میکروفون/مکان/صفحه‌نمایش.
- تأییدهای exec و وضعیت allowlist.

امضاهای رایج:

- `NODE_BACKGROUND_UNAVAILABLE` → برنامه Node باید در foreground باشد.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → مجوز سیستم‌عامل وجود ندارد.
- `SYSTEM_RUN_DENIED: approval required` → تأیید exec در انتظار است.
- `SYSTEM_RUN_DENIED: allowlist miss` → فرمان توسط allowlist مسدود شده است.

مرتبط:

- [تأییدهای exec](/fa/tools/exec-approvals)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
- [Nodes](/fa/nodes/index)

## ابزار مرورگر ناموفق می‌شود

وقتی کنش‌های ابزار مرورگر ناموفق می‌شوند، هرچند خود Gateway سالم است، از این استفاده کنید.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

دنبال این موارد بگردید:

- اینکه آیا `plugins.allow` تنظیم شده و شامل `browser` هست یا نه.
- مسیر معتبر فایل اجرایی مرورگر.
- دسترس‌پذیری پروفایل CDP.
- موجود بودن Chrome محلی برای پروفایل‌های `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="امضاهای Plugin / فایل اجرایی">
    - `unknown command "browser"` یا `unknown command 'browser'` → Plugin مرورگر bundled توسط `plugins.allow` کنار گذاشته شده است.
    - ابزار مرورگر وجود ندارد / در دسترس نیست در حالی که `browser.enabled=true` → `plugins.allow` مقدار `browser` را کنار می‌گذارد، بنابراین Plugin هرگز بارگذاری نشده است.
    - `Failed to start Chrome CDP on port` → فرایند مرورگر اجرا نشد.
    - `browser.executablePath not found` → مسیر پیکربندی‌شده نامعتبر است.
    - `browser.cdpUrl must be http(s) or ws(s)` → نشانی CDP پیکربندی‌شده از scheme پشتیبانی‌نشده‌ای مانند `file:` یا `ftp:` استفاده می‌کند.
    - `browser.cdpUrl has invalid port` → نشانی CDP پیکربندی‌شده port بد یا خارج از محدوده دارد.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → نصب فعلی Gateway وابستگی زمان اجرای `playwright-core` مربوط به Plugin مرورگر bundled را ندارد؛ `openclaw doctor --fix` را اجرا کنید، سپس Gateway را restart کنید. snapshotهای ARIA و screenshotهای پایه صفحه همچنان می‌توانند کار کنند، اما navigation، snapshotهای AI، screenshotهای element با selectorهای CSS، و export PDF در دسترس نمی‌مانند.

  </Accordion>
  <Accordion title="امضاهای Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session در Chrome MCP هنوز نتوانست به data dir مرورگر انتخاب‌شده attach شود. صفحه inspect مرورگر را باز کنید، remote debugging را فعال کنید، مرورگر را باز نگه دارید، اولین prompt اتصال را تأیید کنید، سپس دوباره تلاش کنید. اگر حالت signed-in لازم نیست، پروفایل مدیریت‌شده `openclaw` را ترجیح دهید.
    - `No Chrome tabs found for profile="user"` → پروفایل attach در Chrome MCP هیچ tab باز Chrome محلی ندارد.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint ریموت CDP پیکربندی‌شده از میزبان Gateway قابل دسترسی نیست.
    - `Browser attachOnly is enabled ... not reachable` یا `Browser attachOnly is enabled and CDP websocket ... is not reachable` → پروفایل attach-only هدف قابل دسترس ندارد، یا endpoint HTTP پاسخ داده اما CDP WebSocket همچنان باز نشده است.

  </Accordion>
  <Accordion title="امضاهای element / screenshot / upload">
    - `fullPage is not supported for element screenshots` → درخواست screenshot، `--full-page` را با `--ref` یا `--element` ترکیب کرده است.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → فراخوانی‌های screenshot در Chrome MCP / `existing-session` باید از capture صفحه یا `--ref` مربوط به snapshot استفاده کنند، نه `--element` در CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hookهای upload در Chrome MCP به refهای snapshot نیاز دارند، نه selectorهای CSS.
    - `existing-session file uploads currently support one file at a time.` → در پروفایل‌های Chrome MCP برای هر فراخوانی یک upload بفرستید.
    - `existing-session dialog handling does not support timeoutMs.` → hookهای dialog در پروفایل‌های Chrome MCP از overrideهای timeout پشتیبانی نمی‌کنند.
    - `existing-session type does not support timeoutMs overrides.` → برای `act:type` در پروفایل‌های `profile="user"` / Chrome MCP existing-session مقدار `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از یک پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `existing-session evaluate does not support timeoutMs overrides.` → برای `act:evaluate` در پروفایل‌های `profile="user"` / Chrome MCP existing-session مقدار `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از یک پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` همچنان به یک مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارد.
    - overrideهای کهنه viewport / dark-mode / locale / offline روی پروفایل‌های attach-only یا CDP ریموت → `openclaw browser stop --browser-profile <name>` را اجرا کنید تا session کنترل فعال بسته شود و state شبیه‌سازی Playwright/CDP بدون restart کردن کل Gateway آزاد شود.

  </Accordion>
</AccordionGroup>

مرتبط:

- [مرورگر (مدیریت‌شده توسط OpenClaw)](/fa/tools/browser)
- [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting)

## اگر upgrade کردید و چیزی ناگهان خراب شد

بیشتر خرابی‌های پس از upgrade ناشی از drift پیکربندی یا defaultهای سخت‌گیرانه‌تری است که اکنون enforce می‌شوند.

<AccordionGroup>
  <Accordion title="1. رفتار احراز هویت و override نشانی تغییر کرده است">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    چه چیزی را بررسی کنید:

    - اگر `gateway.mode=remote` باشد، فراخوانی‌های CLI ممکن است remote را هدف بگیرند، در حالی که سرویس محلی شما سالم است.
    - فراخوانی‌های صریح `--url` به credentials ذخیره‌شده fallback نمی‌کنند.

    امضاهای رایج:

    - `gateway connect failed:` → هدف URL اشتباه است.
    - `unauthorized` → endpoint قابل دسترسی است اما auth اشتباه است.

  </Accordion>
  <Accordion title="2. guardrailهای bind و auth سخت‌گیرانه‌تر هستند">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    چه چیزی را بررسی کنید:

    - bindهای غیر local loopback (`lan`، `tailnet`، `custom`) به یک مسیر احراز هویت معتبر Gateway نیاز دارند: احراز هویت با token/password مشترک، یا یک استقرار `trusted-proxy` غیر local loopback که درست پیکربندی شده باشد.
    - keyهای قدیمی مانند `gateway.token` جایگزین `gateway.auth.token` نمی‌شوند.

    امضاهای رایج:

    - `refusing to bind gateway ... without auth` → bind غیر local loopback بدون مسیر احراز هویت معتبر Gateway.
    - `Connectivity probe: failed` در حالی که runtime در حال اجرا است → Gateway زنده است اما با auth/url فعلی قابل دسترسی نیست.

  </Accordion>
  <Accordion title="3. وضعیت جفت‌سازی و هویت دستگاه تغییر کرده است">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    چه چیزی را بررسی کنید:

    - تأییدهای در انتظار دستگاه برای dashboard/nodes.
    - تأییدهای در انتظار جفت‌سازی DM پس از تغییرات خط‌مشی یا هویت.

    امضاهای رایج:

    - `device identity required` → احراز هویت دستگاه برآورده نشده است.
    - `pairing required` → فرستنده/دستگاه باید تأیید شود.

  </Accordion>
</AccordionGroup>

اگر پیکربندی سرویس و runtime پس از بررسی‌ها همچنان با هم ناسازگارند، metadata سرویس را از همان profile/state directory دوباره نصب کنید:

```bash
openclaw gateway install --force
openclaw gateway restart
```

مرتبط:

- [احراز هویت](/fa/gateway/authentication)
- [exec پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [جفت‌سازی تحت مالکیت Gateway](/fa/gateway/pairing)

## مرتبط

- [Doctor](/fa/gateway/doctor)
- [FAQ](/fa/help/faq)
- [runbook Gateway](/fa/gateway)
