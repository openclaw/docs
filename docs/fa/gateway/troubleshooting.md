---
read_when:
    - مرکز عیب‌یابی شما را برای تشخیص عمیق‌تر به اینجا هدایت کرد
    - به بخش‌های پایدار راهنمای عملیاتی مبتنی بر نشانه با دستورهای دقیق نیاز دارید
sidebarTitle: Troubleshooting
summary: راهنمای عملیاتی عیب‌یابی عمیق برای Gateway، کانال‌ها، اتوماسیون، Nodeها و مرورگر
title: عیب‌یابی
x-i18n:
    generated_at: "2026-05-02T11:48:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

این صفحه راهنمای عملیاتی عمیق است. اگر ابتدا جریان سریع تریاژ را می‌خواهید، از [/help/troubleshooting](/fa/help/troubleshooting) شروع کنید.

## نردبان فرمان‌ها

ابتدا این‌ها را به همین ترتیب اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

نشانه‌های سالم مورد انتظار:

- `openclaw gateway status` مقدارهای `Runtime: running`، `Connectivity probe: ok` و یک خط `Capability: ...` را نشان می‌دهد.
- `openclaw doctor` هیچ مشکل مسدودکننده‌ای در پیکربندی/سرویس گزارش نمی‌کند.
- `openclaw channels status --probe` وضعیت زندهٔ انتقال برای هر حساب و، در صورت پشتیبانی، نتایج probe/audit مانند `works` یا `audit ok` را نشان می‌دهد.

## نصب‌های دوپاره و محافظ پیکربندی جدیدتر

وقتی پس از به‌روزرسانی، سرویس Gateway به‌شکل غیرمنتظره متوقف می‌شود، یا لاگ‌ها نشان می‌دهند که یک باینری `openclaw` قدیمی‌تر از نسخه‌ای است که آخرین بار `openclaw.json` را نوشته، از این بخش استفاده کنید.

OpenClaw نوشتن‌های پیکربندی را با `meta.lastTouchedVersion` مهر می‌کند. فرمان‌های فقط‌خواندنی همچنان می‌توانند پیکربندی نوشته‌شده با OpenClaw جدیدتر را بررسی کنند، اما جهش‌های پردازش و سرویس از ادامه دادن با باینری قدیمی‌تر خودداری می‌کنند. کنش‌های مسدودشده شامل شروع، توقف، راه‌اندازی دوباره، حذف نصب سرویس Gateway، نصب دوبارهٔ اجباری سرویس، راه‌اندازی Gateway در حالت سرویس، و پاک‌سازی پورت با `gateway --force` هستند.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH را اصلاح کنید">
    `PATH` را اصلاح کنید تا `openclaw` به نصب جدیدتر resolve شود، سپس کنش را دوباره اجرا کنید.
  </Step>
  <Step title="سرویس Gateway را دوباره نصب کنید">
    سرویس Gateway موردنظر را از نصب جدیدتر دوباره نصب کنید:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="wrapperهای کهنه را حذف کنید">
    بستهٔ سیستمی کهنه یا ورودی‌های wrapper قدیمی را که هنوز به یک باینری قدیمی `openclaw` اشاره می‌کنند حذف کنید.
  </Step>
</Steps>

<Warning>
فقط برای downgrade عمدی یا بازیابی اضطراری، `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` را برای همان یک فرمان تنظیم کنید. برای عملیات عادی آن را تنظیم‌نشده بگذارید.
</Warning>

## برای زمینهٔ بلند در Anthropic 429، extra usage لازم است

وقتی لاگ‌ها/خطاها شامل این عبارت هستند استفاده کنید: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

دنبال این موارد بگردید:

- مدل Anthropic Opus/Sonnet انتخاب‌شده `params.context1m: true` دارد.
- اعتبارنامهٔ Anthropic فعلی واجد شرایط استفاده از زمینهٔ بلند نیست.
- درخواست‌ها فقط در نشست‌های بلند/اجرای مدل‌هایی شکست می‌خورند که به مسیر بتای 1M نیاز دارند.

گزینه‌های اصلاح:

<Steps>
  <Step title="context1m را غیرفعال کنید">
    `context1m` را برای آن مدل غیرفعال کنید تا به پنجرهٔ زمینهٔ عادی بازگردد.
  </Step>
  <Step title="از یک اعتبارنامهٔ واجد شرایط استفاده کنید">
    از یک اعتبارنامهٔ Anthropic که واجد شرایط درخواست‌های زمینهٔ بلند است استفاده کنید، یا به یک کلید API Anthropic تغییر دهید.
  </Step>
  <Step title="مدل‌های fallback را پیکربندی کنید">
    مدل‌های fallback را پیکربندی کنید تا وقتی درخواست‌های زمینهٔ بلند Anthropic رد می‌شوند، اجراها ادامه پیدا کنند.
  </Step>
</Steps>

مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [چرا HTTP 429 از Anthropic می‌بینم؟](/fa/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend محلی سازگار با OpenAI probeهای مستقیم را پاس می‌کند اما اجرای agent شکست می‌خورد

وقتی این موارد برقرار است استفاده کنید:

- `curl ... /v1/models` کار می‌کند
- فراخوانی‌های کوچک مستقیم `/v1/chat/completions` کار می‌کنند
- اجرای مدل در OpenClaw فقط در نوبت‌های عادی agent شکست می‌خورد

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

دنبال این موارد بگردید:

- فراخوانی‌های کوچک مستقیم موفق می‌شوند، اما اجرای OpenClaw فقط روی promptهای بزرگ‌تر شکست می‌خورد
- خطاهای `model_not_found` یا 404، حتی با اینکه `/v1/chat/completions` مستقیم با همان شناسهٔ مدل خام کار می‌کند
- خطاهای backend دربارهٔ اینکه `messages[].content` انتظار رشته دارد
- هشدارهای متناوب `incomplete turn detected ... stopReason=stop payloads=0` با یک backend محلی سازگار با OpenAI
- خرابی‌های backend که فقط با تعداد توکن prompt بزرگ‌تر یا promptهای کامل runtime agent ظاهر می‌شوند

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `model_not_found` با یک سرور محلی سبک MLX/vLLM → بررسی کنید `baseUrl` شامل `/v1` باشد، `api` برای backendهای `/v1/chat/completions` برابر `"openai-completions"` باشد، و `models.providers.<provider>.models[].id` همان شناسهٔ خام محلی provider باشد. آن را یک بار با پیشوند provider انتخاب کنید، برای مثال `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ ورودی کاتالوگ را به‌شکل `mlx-community/Qwen3-30B-A3B-6bit` نگه دارید.
    - `messages[...].content: invalid type: sequence, expected a string` → backend بخش‌های محتوای ساختاریافتهٔ Chat Completions را رد می‌کند. اصلاح: `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend درخواست Chat Completions را کامل کرده اما برای آن نوبت هیچ متن قابل مشاهده‌ای از assistant برنگردانده است. OpenClaw نوبت‌های خالی سازگار با OpenAI و replay-safe را یک بار دوباره تلاش می‌کند؛ شکست‌های پایدار معمولاً یعنی backend محتوای خالی/غیرمتنی منتشر می‌کند یا متن پاسخ نهایی را سرکوب می‌کند.
    - درخواست‌های کوچک مستقیم موفق می‌شوند، اما اجرای agent در OpenClaw با خرابی backend/model شکست می‌خورد، برای مثال Gemma روی برخی buildهای `inferrs` → احتمالاً انتقال OpenClaw از قبل درست است؛ backend روی شکل prompt بزرگ‌تر runtime agent شکست می‌خورد.
    - شکست‌ها پس از غیرفعال کردن ابزارها کمتر می‌شوند اما از بین نمی‌روند → schemaهای ابزار بخشی از فشار بوده‌اند، اما مشکل باقی‌مانده همچنان ظرفیت مدل/سرور بالادستی یا یک باگ backend است.

  </Accordion>
  <Accordion title="گزینه‌های اصلاح">
    1. برای backendهای Chat Completions فقط‌رشته‌ای، `compat.requiresStringContent: true` را تنظیم کنید.
    2. برای مدل‌ها/backendهایی که نمی‌توانند سطح schema ابزارهای OpenClaw را به‌طور قابل اعتماد مدیریت کنند، `compat.supportsTools: false` را تنظیم کنید.
    3. هر جا ممکن است فشار prompt را کاهش دهید: bootstrap کوچک‌تر workspace، تاریخچهٔ نشست کوتاه‌تر، مدل محلی سبک‌تر، یا backendی با پشتیبانی قوی‌تر از زمینهٔ بلند.
    4. اگر درخواست‌های کوچک مستقیم همچنان پاس می‌شوند اما نوبت‌های agent در OpenClaw هنوز داخل backend crash می‌کنند، آن را محدودیت سرور/مدل بالادستی در نظر بگیرید و یک بازتولید با شکل payload پذیرفته‌شده آنجا ثبت کنید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/gateway/configuration)
- [مدل‌های محلی](/fa/gateway/local-models)
- [endpointهای سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)

## بدون پاسخ

اگر کانال‌ها بالا هستند اما چیزی پاسخ نمی‌دهد، پیش از reconnect کردن هر چیز، routing و policy را بررسی کنید.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

دنبال این موارد بگردید:

- Pairing برای فرستندگان DM در حالت pending است.
- گیت‌گذاری mention در گروه (`requireMention`, `mentionPatterns`).
- ناهماهنگی‌های allowlist کانال/گروه.

امضاهای رایج:

- `drop guild message (mention required` → پیام گروه تا زمان mention نادیده گرفته می‌شود.
- `pairing request` → فرستنده به تأیید نیاز دارد.
- `blocked` / `allowlist` → فرستنده/کانال توسط policy فیلتر شده است.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [گروه‌ها](/fa/channels/groups)
- [Pairing](/fa/channels/pairing)

## اتصال UI کنترل dashboard

وقتی UI داشبورد/کنترل وصل نمی‌شود، URL، حالت auth، و فرض‌های secure context را اعتبارسنجی کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

دنبال این موارد بگردید:

- URL صحیح probe و URL داشبورد.
- ناهماهنگی حالت/توکن auth بین client و Gateway.
- استفاده از HTTP در جایی که device identity لازم است.

<AccordionGroup>
  <Accordion title="امضاهای اتصال / auth">
    - `device identity required` → زمینهٔ غیرایمن یا auth دستگاه موجود نیست.
    - `origin not allowed` → `Origin` مرورگر در `gateway.controlUi.allowedOrigins` نیست، یا از origin مرورگر غیر-loopback و بدون allowlist صریح وصل می‌شوید.
    - `device nonce required` / `device nonce mismatch` → client جریان auth دستگاه مبتنی بر challenge را کامل نمی‌کند (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client برای handshake فعلی payload اشتباه یا timestamp کهنه را امضا کرده است.
    - `AUTH_TOKEN_MISMATCH` همراه با `canRetryWithDeviceToken=true` → client می‌تواند یک بار با device token کش‌شده، retry مورداعتماد انجام دهد.
    - آن retry با توکن کش‌شده، مجموعهٔ scope کش‌شده‌ای را دوباره استفاده می‌کند که با device token جفت‌شده ذخیره شده است. فراخوان‌های صریح `deviceToken` / `scopes` صریح، همان مجموعهٔ scope درخواستی خود را نگه می‌دارند.
    - خارج از آن مسیر retry، اولویت auth اتصال ابتدا token/password مشترک صریح، سپس `deviceToken` صریح، سپس device token ذخیره‌شده، و بعد bootstrap token است.
    - در مسیر async Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, ip}` پیش از ثبت شکست توسط limiter سری‌سازی می‌شوند. بنابراین دو retry همزمان نامعتبر از همان client می‌توانند در تلاش دوم به‌جای دو mismatch ساده، `retry later` نشان دهند.
    - `too many failed authentication attempts (retry later)` از یک client loopback با browser-origin → شکست‌های تکراری از همان `Origin` نرمال‌سازی‌شده موقتاً قفل می‌شوند؛ یک origin localhost دیگر از bucket جداگانه استفاده می‌کند.
    - `unauthorized` تکراری پس از آن retry → drift در shared token/device token؛ پیکربندی توکن را تازه کنید و در صورت نیاز device token را دوباره تأیید/rotate کنید.
    - `gateway connect failed:` → مقصد host/port/url اشتباه است.

  </Accordion>
</AccordionGroup>

### نقشهٔ سریع کدهای جزئیات auth

از `error.details.code` در پاسخ `connect` ناموفق استفاده کنید تا کنش بعدی را انتخاب کنید:

| کد جزئیات                  | معنی                                                                                                                                                                                      | اقدام پیشنهادی                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | کلاینت توکن مشترک الزامی را ارسال نکرده است.                                                                                                                                                 | توکن را در کلاینت جای‌گذاری/تنظیم کنید و دوباره تلاش کنید. برای مسیرهای داشبورد: `openclaw config get gateway.auth.token` سپس آن را در تنظیمات Control UI جای‌گذاری کنید.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | توکن مشترک با توکن احراز هویت Gateway مطابقت نداشت.                                                                                                                                               | اگر `canRetryWithDeviceToken=true` است، یک تلاش مجدد مورد اعتماد را مجاز کنید. تلاش‌های مجدد با توکن کش‌شده از دامنه‌های تاییدشده ذخیره‌شده دوباره استفاده می‌کنند؛ فراخواننده‌های صریح `deviceToken` / `scopes` دامنه‌های درخواستی را نگه می‌دارند. اگر همچنان ناموفق بود، [چک‌لیست بازیابی انحراف توکن](/fa/cli/devices#token-drift-recovery-checklist) را اجرا کنید. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | توکن کش‌شده مخصوص هر دستگاه قدیمی یا لغو شده است.                                                                                                                                                 | توکن دستگاه را با استفاده از [CLI دستگاه‌ها](/fa/cli/devices) بچرخانید/دوباره تایید کنید، سپس دوباره متصل شوید.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | هویت دستگاه به تایید نیاز دارد. `error.details.reason` را برای `not-paired`، `scope-upgrade`، `role-upgrade`، یا `metadata-upgrade` بررسی کنید و در صورت وجود از `requestId` / `remediationHint` استفاده کنید. | درخواست در انتظار را تایید کنید: `openclaw devices list` سپس `openclaw devices approve <requestId>`. ارتقاهای دامنه/نقش پس از بازبینی دسترسی درخواستی از همان جریان استفاده می‌کنند.                                                                                                               |

<Note>
RPCهای مستقیم بک‌اند loopback که با توکن/رمز عبور مشترک Gateway احراز هویت شده‌اند نباید به خط پایه دامنه دستگاه جفت‌شده CLI وابسته باشند. اگر subagentها یا فراخوانی‌های داخلی دیگر همچنان با `scope-upgrade` ناموفق می‌شوند، بررسی کنید که فراخواننده از `client.id: "gateway-client"` و `client.mode: "backend"` استفاده می‌کند و یک `deviceIdentity` یا توکن دستگاه صریح را اجبار نمی‌کند.
</Note>

بررسی مهاجرت احراز هویت دستگاه v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

اگر لاگ‌ها خطاهای nonce/signature را نشان می‌دهند، کلاینت متصل‌شونده را به‌روزرسانی و آن را بررسی کنید:

<Steps>
  <Step title="Wait for connect.challenge">
    کلاینت منتظر `connect.challenge` صادرشده توسط Gateway می‌ماند.
  </Step>
  <Step title="Sign the payload">
    کلاینت payload مقید به چالش را امضا می‌کند.
  </Step>
  <Step title="Send the device nonce">
    کلاینت `connect.params.device.nonce` را با همان nonce چالش ارسال می‌کند.
  </Step>
</Steps>

اگر `openclaw devices rotate` / `revoke` / `remove` به‌طور غیرمنتظره رد شد:

- نشست‌های توکن دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را مدیریت کنند، مگر اینکه فراخواننده `operator.admin` را هم داشته باشد
- `openclaw devices rotate --scope ...` فقط می‌تواند دامنه‌های اپراتوری را درخواست کند که نشست فراخواننده از قبل دارد

مرتبط:

- [پیکربندی](/fa/gateway/configuration) (حالت‌های احراز هویت Gateway)
- [Control UI](/fa/web/control-ui)
- [دستگاه‌ها](/fa/cli/devices)
- [دسترسی از راه دور](/fa/gateway/remote)
- [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)

## سرویس Gateway اجرا نمی‌شود

زمانی از این استفاده کنید که سرویس نصب شده اما فرایند پایدار نمی‌ماند.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

به دنبال این موارد بگردید:

- `Runtime: stopped` همراه با راهنمایی‌های خروج.
- ناسازگاری پیکربندی سرویس (`Config (cli)` در برابر `Config (service)`).
- تداخل‌های پورت/شنونده.
- نصب‌های اضافی launchd/systemd/schtasks هنگام استفاده از `--deep`.
- راهنمایی‌های پاک‌سازی `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` یا `existing config is missing gateway.mode` → حالت Gateway محلی فعال نیست، یا فایل پیکربندی بازنویسی شده و `gateway.mode` را از دست داده است. رفع: `gateway.mode="local"` را در پیکربندی خود تنظیم کنید، یا `openclaw onboard --mode local` / `openclaw setup` را دوباره اجرا کنید تا پیکربندی مورد انتظار حالت محلی دوباره ثبت شود. اگر OpenClaw را از طریق Podman اجرا می‌کنید، مسیر پیش‌فرض پیکربندی `~/.openclaw/openclaw.json` است.
    - `refusing to bind gateway ... without auth` → اتصال غیر loopback بدون مسیر معتبر احراز هویت Gateway (توکن/رمز عبور، یا trusted-proxy در جایی که پیکربندی شده است).
    - `another gateway instance is already listening` / `EADDRINUSE` → تداخل پورت.
    - `Other gateway-like services detected (best effort)` → واحدهای قدیمی یا موازی launchd/systemd/schtasks وجود دارند. بیشتر راه‌اندازی‌ها باید در هر ماشین یک Gateway نگه دارند؛ اگر واقعا به بیش از یکی نیاز دارید، پورت‌ها + پیکربندی/وضعیت/فضای کاری را جدا کنید. به [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) مراجعه کنید.
    - `System-level OpenClaw gateway service detected` از doctor → یک واحد سیستمی systemd وجود دارد در حالی که سرویس سطح کاربر وجود ندارد. پیش از اجازه دادن به doctor برای نصب سرویس کاربری، مورد تکراری را حذف یا غیرفعال کنید، یا اگر واحد سیستمی سرپرست مورد نظر است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.
    - `Gateway service port does not match current gateway config` → سرپرست نصب‌شده هنوز `--port` قدیمی را ثابت نگه داشته است. `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید، سپس سرویس Gateway را بازراه‌اندازی کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [Doctor](/fa/gateway/doctor)

## Gateway آخرین پیکربندی سالم شناخته‌شده را بازیابی کرد

زمانی از این استفاده کنید که Gateway شروع می‌شود، اما لاگ‌ها می‌گویند `openclaw.json` را بازیابی کرده است.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

به دنبال این موارد بگردید:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- یک فایل دارای مهر زمانی `openclaw.json.clobbered.*` کنار پیکربندی فعال
- یک رویداد سیستمی main-agent که با `Config recovery warning` شروع می‌شود

<AccordionGroup>
  <Accordion title="What happened">
    - پیکربندی ردشده هنگام راه‌اندازی یا بارگذاری مجدد داغ اعتبارسنجی نشد.
    - OpenClaw payload ردشده را به صورت `.clobbered.*` حفظ کرد.
    - پیکربندی فعال از آخرین نسخه معتبر last-known-good بازیابی شد.
    - به نوبت بعدی main-agent هشدار داده می‌شود که پیکربندی ردشده را کورکورانه بازنویسی نکند.
    - اگر همه مشکلات اعتبارسنجی زیر `plugins.entries.<id>...` بودند، OpenClaw کل فایل را بازیابی نمی‌کرد. خرابی‌های محلی Plugin پرصدا باقی می‌مانند در حالی که تنظیمات نامرتبط کاربر در پیکربندی فعال می‌مانند.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` وجود دارد → یک ویرایش مستقیم خارجی یا خواندن هنگام راه‌اندازی بازیابی شده است.
    - `.rejected.*` وجود دارد → یک نوشتن پیکربندی متعلق به OpenClaw پیش از commit در بررسی‌های schema یا clobber ناموفق شده است.
    - `Config write rejected:` → نوشتن تلاش کرده شکل الزامی را حذف کند، اندازه فایل را به‌شدت کوچک کند، یا پیکربندی نامعتبر را پایدار کند.
    - `Rejected validation details:` → لاگ بازیابی یا اعلان main-agent شامل مسیر schema است که باعث بازیابی شده، مانند `agents.defaults.execution` یا `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`، `gateway-mode-missing-vs-last-good`، یا `size-drop-vs-last-good:*` → راه‌اندازی فایل فعلی را clobbered در نظر گرفته، چون در مقایسه با پشتیبان last-known-good فیلدها یا اندازه را از دست داده است.
    - `Config last-known-good promotion skipped` → نامزد شامل placeholderهای اسرار redacted مانند `***` بوده است.

  </Accordion>
  <Accordion title="Fix options">
    1. اگر پیکربندی فعال بازیابی‌شده درست است، آن را نگه دارید.
    2. فقط کلیدهای مورد نظر را از `.clobbered.*` یا `.rejected.*` کپی کنید، سپس آن‌ها را با `openclaw config set` یا `config.patch` اعمال کنید.
    3. پیش از بازراه‌اندازی، `openclaw config validate` را اجرا کنید.
    4. اگر دستی ویرایش می‌کنید، پیکربندی کامل JSON5 را نگه دارید، نه فقط شیء جزئی‌ای که می‌خواستید تغییر دهید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [Config](/fa/cli/config)
- [پیکربندی: بارگذاری مجدد داغ](/fa/gateway/configuration#config-hot-reload)
- [پیکربندی: اعتبارسنجی سخت‌گیرانه](/fa/gateway/configuration#strict-validation)
- [Doctor](/fa/gateway/doctor)

## هشدارهای پروب Gateway

زمانی از این استفاده کنید که `openclaw gateway probe` به چیزی می‌رسد، اما همچنان یک بلوک هشدار چاپ می‌کند.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

به دنبال این موارد بگردید:

- `warnings[].code` و `primaryTargetId` در خروجی JSON.
- اینکه هشدار درباره fallback SSH، چند Gateway، دامنه‌های مفقود، یا ارجاع‌های احراز هویت حل‌نشده است.

امضاهای رایج:

- `SSH tunnel failed to start; falling back to direct probes.` → راه‌اندازی SSH ناموفق شد، اما فرمان همچنان هدف‌های مستقیم پیکربندی‌شده/loopback را امتحان کرد.
- `multiple reachable gateways detected` → بیش از یک هدف پاسخ داد. معمولا یعنی یک راه‌اندازی چند-Gateway عمدی یا شنونده‌های قدیمی/تکراری وجود دارد.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → اتصال برقرار شد، اما RPC جزئیات به دلیل دامنه محدود شده است؛ هویت دستگاه را جفت کنید یا از اعتبارنامه‌هایی با `operator.read` استفاده کنید.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → اتصال برقرار شد، اما مجموعه کامل RPC تشخیصی timeout شد یا ناموفق بود. این را به‌عنوان یک Gateway قابل دسترس با تشخیص‌های تضعیف‌شده در نظر بگیرید؛ `connect.ok` و `connect.rpcOk` را در خروجی `--json` مقایسه کنید.
- `Capability: pairing-pending` یا `gateway closed (1008): pairing required` → Gateway پاسخ داد، اما این کلاینت هنوز پیش از دسترسی عادی اپراتور به جفت‌سازی/تایید نیاز دارد.
- متن هشدار SecretRef حل‌نشده `gateway.auth.*` / `gateway.remote.*` → مواد احراز هویت در این مسیر فرمان برای هدف ناموفق در دسترس نبود.

مرتبط:

- [Gateway](/fa/cli/gateway)
- [چند Gateway روی یک میزبان](/fa/gateway#multiple-gateways-same-host)
- [دسترسی از راه دور](/fa/gateway/remote)

## کانال متصل است، پیام‌ها جریان ندارند

اگر وضعیت کانال متصل است اما جریان پیام متوقف شده، روی سیاست، مجوزها، و قواعد تحویل مخصوص کانال تمرکز کنید.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

به دنبال این موارد بگردید:

- خط‌مشی DM (`pairing`، `allowlist`، `open`، `disabled`).
- allowlist گروه و الزامات mention.
- مجوزها/scopeهای API کانال که وجود ندارند.

امضاهای رایج:

- `mention required` → پیام توسط خط‌مشی mention گروه نادیده گرفته شد.
- `pairing` / ردپاهای pending approval → فرستنده تأیید نشده است.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشکل احراز هویت/مجوزهای کانال.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [Discord](/fa/channels/discord)
- [Telegram](/fa/channels/telegram)
- [WhatsApp](/fa/channels/whatsapp)

## تحویل Cron و Heartbeat

اگر Cron یا Heartbeat اجرا نشد یا تحویل داده نشد، ابتدا وضعیت زمان‌بند و سپس مقصد تحویل را بررسی کنید.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

دنبال این موارد بگردید:

- Cron فعال باشد و بیدارباش بعدی وجود داشته باشد.
- وضعیت تاریخچه اجرای job (`ok`، `skipped`، `error`).
- دلایل پرش Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `cron: scheduler disabled; jobs will not run automatically` → cron غیرفعال است.
    - `cron: timer tick failed` → tick زمان‌بند شکست خورد؛ خطاهای فایل/لاگ/runtime را بررسی کنید.
    - `heartbeat skipped` همراه با `reason=quiet-hours` → خارج از پنجره ساعت‌های فعال.
    - `heartbeat skipped` همراه با `reason=empty-heartbeat-file` → `HEARTBEAT.md` وجود دارد اما فقط شامل خط‌های خالی / سرآیندهای markdown است، بنابراین OpenClaw فراخوانی مدل را رد می‌کند.
    - `heartbeat skipped` همراه با `reason=no-tasks-due` → `HEARTBEAT.md` شامل یک بلوک `tasks:` است، اما هیچ‌کدام از taskها در این tick موعدشان نرسیده است.
    - `heartbeat: unknown accountId` → شناسه حساب برای مقصد تحویل heartbeat نامعتبر است.
    - `heartbeat skipped` همراه با `reason=dm-blocked` → مقصد heartbeat به یک مقصد سبک DM resolve شده، در حالی که `agents.defaults.heartbeat.directPolicy` (یا override هر agent) روی `block` تنظیم شده است.

  </Accordion>
</AccordionGroup>

مرتبط:

- [Heartbeat](/fa/gateway/heartbeat)
- [taskهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
- [taskهای زمان‌بندی‌شده: عیب‌یابی](/fa/automation/cron-jobs#troubleshooting)

## Node جفت شده، ابزار شکست می‌خورد

اگر یک Node جفت شده است اما ابزارها شکست می‌خورند، وضعیت foreground، مجوز و approval را جداگانه بررسی کنید.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

دنبال این موارد بگردید:

- Node آنلاین با capabilityهای مورد انتظار.
- اعطای مجوزهای OS برای دوربین/میکروفون/موقعیت/صفحه.
- approvalهای exec و وضعیت allowlist.

امضاهای رایج:

- `NODE_BACKGROUND_UNAVAILABLE` → اپ Node باید در foreground باشد.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → مجوز OS وجود ندارد.
- `SYSTEM_RUN_DENIED: approval required` → approval اجرای فرمان در انتظار است.
- `SYSTEM_RUN_DENIED: allowlist miss` → فرمان توسط allowlist مسدود شده است.

مرتبط:

- [approvalهای Exec](/fa/tools/exec-approvals)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
- [Nodeها](/fa/nodes/index)

## ابزار مرورگر شکست می‌خورد

وقتی actionهای ابزار مرورگر شکست می‌خورند، با وجود اینکه خود Gateway سالم است، از این استفاده کنید.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

دنبال این موارد بگردید:

- اینکه `plugins.allow` تنظیم شده و شامل `browser` باشد.
- مسیر معتبر executable مرورگر.
- دسترس‌پذیری پروفایل CDP.
- در دسترس بودن Chrome محلی برای پروفایل‌های `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="امضاهای Plugin / executable">
    - `unknown command "browser"` یا `unknown command 'browser'` → Plugin مرورگر همراه توسط `plugins.allow` کنار گذاشته شده است.
    - ابزار مرورگر وجود ندارد / در دسترس نیست در حالی که `browser.enabled=true` → `plugins.allow` مقدار `browser` را مستثنا کرده، بنابراین Plugin هرگز بارگذاری نشده است.
    - `Failed to start Chrome CDP on port` → process مرورگر اجرا نشد.
    - `browser.executablePath not found` → مسیر پیکربندی‌شده نامعتبر است.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL پیکربندی‌شده CDP از scheme پشتیبانی‌نشده‌ای مانند `file:` یا `ftp:` استفاده می‌کند.
    - `browser.cdpUrl has invalid port` → URL پیکربندی‌شده CDP پورت بد یا خارج از محدوده دارد.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → نصب فعلی Gateway وابستگی runtime اصلی مرورگر را ندارد؛ OpenClaw را دوباره نصب یا به‌روزرسانی کنید، سپس Gateway را restart کنید. snapshotهای ARIA و screenshotهای ساده صفحه همچنان می‌توانند کار کنند، اما navigation، snapshotهای AI، screenshotهای element با selector CSS، و export PDF در دسترس نمی‌مانند.

  </Accordion>
  <Accordion title="امضاهای Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session در Chrome MCP هنوز نتوانست به data dir مرورگر انتخاب‌شده attach شود. صفحه inspect مرورگر را باز کنید، remote debugging را فعال کنید، مرورگر را باز نگه دارید، prompt نخستین attach را تأیید کنید، سپس دوباره تلاش کنید. اگر وضعیت signed-in لازم نیست، پروفایل مدیریت‌شده `openclaw` را ترجیح دهید.
    - `No Chrome tabs found for profile="user"` → پروفایل attach در Chrome MCP هیچ tab باز Chrome محلی ندارد.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint ریموت CDP پیکربندی‌شده از میزبان Gateway قابل دسترسی نیست.
    - `Browser attachOnly is enabled ... not reachable` یا `Browser attachOnly is enabled and CDP websocket ... is not reachable` → پروفایل attach-only هدف قابل دسترسی ندارد، یا endpoint HTTP پاسخ داده اما CDP WebSocket همچنان باز نشده است.

  </Accordion>
  <Accordion title="امضاهای element / screenshot / upload">
    - `fullPage is not supported for element screenshots` → درخواست screenshot مقدار `--full-page` را با `--ref` یا `--element` ترکیب کرده است.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → فراخوانی‌های screenshot در Chrome MCP / `existing-session` باید از capture صفحه یا یک `--ref` از snapshot استفاده کنند، نه `--element` در CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hookهای upload در Chrome MCP به refهای snapshot نیاز دارند، نه selectorهای CSS.
    - `existing-session file uploads currently support one file at a time.` → در پروفایل‌های Chrome MCP برای هر فراخوانی یک upload بفرستید.
    - `existing-session dialog handling does not support timeoutMs.` → hookهای dialog در پروفایل‌های Chrome MCP از overrideهای timeout پشتیبانی نمی‌کنند.
    - `existing-session type does not support timeoutMs overrides.` → برای `act:type` روی `profile="user"` / پروفایل‌های existing-session در Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `existing-session evaluate does not support timeoutMs overrides.` → برای `act:evaluate` روی `profile="user"` / پروفایل‌های existing-session در Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارد.
    - overrideهای stale viewport / dark-mode / locale / offline روی پروفایل‌های attach-only یا remote CDP → برای بستن session کنترل فعال و آزاد کردن وضعیت emulation در Playwright/CDP بدون restart کردن کل Gateway، `openclaw browser stop --browser-profile <name>` را اجرا کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [مرورگر (مدیریت‌شده توسط OpenClaw)](/fa/tools/browser)
- [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting)

## اگر ارتقا دادید و چیزی ناگهان خراب شد

بیشتر خرابی‌های پس از ارتقا، drift پیکربندی یا پیش‌فرض‌های سخت‌گیرانه‌تری هستند که اکنون اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="۱. رفتار احراز هویت و override کردن URL تغییر کرده است">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    چه چیزی را بررسی کنید:

    - اگر `gateway.mode=remote` باشد، فراخوانی‌های CLI ممکن است remote را هدف گرفته باشند در حالی که service محلی شما سالم است.
    - فراخوانی‌های صریح `--url` به credentials ذخیره‌شده fallback نمی‌کنند.

    امضاهای رایج:

    - `gateway connect failed:` → هدف URL اشتباه است.
    - `unauthorized` → endpoint قابل دسترسی است اما auth اشتباه است.

  </Accordion>
  <Accordion title="۲. guardrailهای bind و auth سخت‌گیرانه‌تر هستند">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    چه چیزی را بررسی کنید:

    - bindهای غیر loopback (`lan`، `tailnet`، `custom`) به یک مسیر معتبر auth برای Gateway نیاز دارند: auth با token/password مشترک، یا deployment غیر loopback از نوع `trusted-proxy` که درست پیکربندی شده باشد.
    - keyهای قدیمی مانند `gateway.token` جایگزین `gateway.auth.token` نمی‌شوند.

    امضاهای رایج:

    - `refusing to bind gateway ... without auth` → bind غیر loopback بدون مسیر معتبر auth برای Gateway.
    - `Connectivity probe: failed` در حالی که runtime در حال اجراست → Gateway زنده است اما با auth/url فعلی قابل دسترسی نیست.

  </Accordion>
  <Accordion title="۳. وضعیت pairing و هویت دستگاه تغییر کرده است">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    چه چیزی را بررسی کنید:

    - approvalهای در انتظار دستگاه برای dashboard/nodeها.
    - approvalهای در انتظار pairing در DM پس از تغییرات policy یا identity.

    امضاهای رایج:

    - `device identity required` → احراز هویت دستگاه برآورده نشده است.
    - `pairing required` → فرستنده/دستگاه باید تأیید شود.

  </Accordion>
</AccordionGroup>

اگر پیکربندی service و runtime پس از بررسی‌ها همچنان ناسازگارند، metadata مربوط به service را از همان دایرکتوری profile/state دوباره نصب کنید:

```bash
openclaw gateway install --force
openclaw gateway restart
```

مرتبط:

- [احراز هویت](/fa/gateway/authentication)
- [exec پس‌زمینه و ابزار process](/fa/gateway/background-process)
- [pairing تحت مالکیت Gateway](/fa/gateway/pairing)

## مرتبط

- [Doctor](/fa/gateway/doctor)
- [FAQ](/fa/help/faq)
- [runbook Gateway](/fa/gateway)
