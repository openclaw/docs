---
read_when:
    - مرکز عیب‌یابی شما را برای تشخیص عمیق‌تر به اینجا هدایت کرده است
    - شما به بخش‌های پایدارِ راهنمای عملیاتیِ نشانه‌محور با دستورهای دقیق نیاز دارید
sidebarTitle: Troubleshooting
summary: راهنمای عملیاتی عیب‌یابی عمیق برای Gateway، کانال‌ها، خودکارسازی، گره‌ها و مرورگر
title: عیب‌یابی
x-i18n:
    generated_at: "2026-05-03T21:35:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

این صفحه runbook عمیق است. اگر ابتدا جریان سریع تریاژ را می‌خواهید، از [/help/troubleshooting](/fa/help/troubleshooting) شروع کنید.

## نردبان فرمان

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
- `openclaw channels status --probe` وضعیت زنده ترابری برای هر حساب و، در صورت پشتیبانی، نتایج probe/audit مانند `works` یا `audit ok` را نشان می‌دهد.

## نصب‌های دوپاره و نگهبان پیکربندی جدیدتر

وقتی یک سرویس Gateway بعد از به‌روزرسانی غیرمنتظره متوقف می‌شود، یا لاگ‌ها نشان می‌دهند که یک باینری `openclaw` قدیمی‌تر از نسخه‌ای است که آخرین بار `openclaw.json` را نوشته، از این بخش استفاده کنید.

OpenClaw نوشتن‌های پیکربندی را با `meta.lastTouchedVersion` مهر می‌زند. فرمان‌های فقط‌خواندنی هنوز می‌توانند پیکربندی نوشته‌شده توسط OpenClaw جدیدتر را بررسی کنند، اما جهش‌های فرایند و سرویس از ادامه با باینری قدیمی‌تر خودداری می‌کنند. اقدام‌های مسدودشده شامل شروع، توقف، راه‌اندازی دوباره، حذف نصب، نصب دوباره اجباری سرویس Gateway، راه‌اندازی Gateway در حالت سرویس، و پاک‌سازی پورت با `gateway --force` است.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="اصلاح PATH">
    `PATH` را طوری اصلاح کنید که `openclaw` به نصب جدیدتر resolve شود، سپس اقدام را دوباره اجرا کنید.
  </Step>
  <Step title="نصب دوباره سرویس Gateway">
    سرویس Gateway موردنظر را از نصب جدیدتر دوباره نصب کنید:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="حذف wrapperهای کهنه">
    ورودی‌های بسته سیستم یا wrapperهای قدیمی را که هنوز به یک باینری قدیمی `openclaw` اشاره می‌کنند حذف کنید.
  </Step>
</Steps>

<Warning>
فقط برای downgrade عمدی یا بازیابی اضطراری، برای همان یک فرمان `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` را تنظیم کنید. برای عملیات عادی آن را تنظیم‌نشده بگذارید.
</Warning>

## نیاز به استفاده اضافی Anthropic 429 برای context طولانی

وقتی لاگ‌ها/خطاها شامل این مورد هستند استفاده کنید: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

دنبال این موارد بگردید:

- مدل Anthropic Opus/Sonnet انتخاب‌شده `params.context1m: true` دارد.
- credential فعلی Anthropic واجد شرایط استفاده long-context نیست.
- درخواست‌ها فقط در نشست‌های طولانی/اجرای مدل‌هایی که به مسیر beta 1M نیاز دارند شکست می‌خورند.

گزینه‌های رفع:

<Steps>
  <Step title="غیرفعال کردن context1m">
    `context1m` را برای آن مدل غیرفعال کنید تا به پنجره context عادی برگردد.
  </Step>
  <Step title="استفاده از credential واجد شرایط">
    از یک credential Anthropic که برای درخواست‌های long-context واجد شرایط است استفاده کنید، یا به یک کلید API Anthropic تغییر دهید.
  </Step>
  <Step title="پیکربندی مدل‌های fallback">
    مدل‌های fallback را پیکربندی کنید تا وقتی درخواست‌های long-context Anthropic رد می‌شوند، اجراها ادامه پیدا کنند.
  </Step>
</Steps>

مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [چرا HTTP 429 از Anthropic می‌بینم؟](/fa/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend محلی سازگار با OpenAI probeهای مستقیم را پاس می‌کند اما اجرای عامل شکست می‌خورد

وقتی این موارد برقرار است استفاده کنید:

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

دنبال این موارد بگردید:

- فراخوانی‌های کوچک مستقیم موفق می‌شوند، اما اجراهای OpenClaw فقط روی promptهای بزرگ‌تر شکست می‌خورند
- خطاهای `model_not_found` یا 404، با اینکه `/v1/chat/completions` مستقیم
  با همان شناسه مدل bare کار می‌کند
- خطاهای backend درباره اینکه `messages[].content` انتظار string دارد
- هشدارهای متناوب `incomplete turn detected ... stopReason=stop payloads=0` با یک backend محلی سازگار با OpenAI
- crashهای backend که فقط با تعداد توکن prompt بزرگ‌تر یا promptهای کامل runtime عامل ظاهر می‌شوند

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `model_not_found` با یک سرور محلی به سبک MLX/vLLM → بررسی کنید `baseUrl` شامل `/v1` باشد، `api` برای backendهای `/v1/chat/completions` برابر `"openai-completions"` باشد، و `models.providers.<provider>.models[].id` همان شناسه bare محلی provider باشد. آن را یک بار با پیشوند provider انتخاب کنید، برای مثال `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ ورودی کاتالوگ را به صورت `mlx-community/Qwen3-30B-A3B-6bit` نگه دارید.
    - `messages[...].content: invalid type: sequence, expected a string` → backend بخش‌های محتوای ساخت‌یافته Chat Completions را رد می‌کند. رفع: `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend درخواست Chat Completions را کامل کرده اما برای آن نوبت هیچ متن دستیار قابل‌مشاهده برای کاربر برنگردانده است. OpenClaw نوبت‌های خالی سازگار با OpenAI و ایمن برای replay را یک بار دوباره امتحان می‌کند؛ شکست‌های پایدار معمولا یعنی backend محتوای خالی/غیرمتنی تولید می‌کند یا متن پاسخ نهایی را سرکوب می‌کند.
    - درخواست‌های کوچک مستقیم موفق می‌شوند، اما اجرای عامل OpenClaw با crashهای backend/model شکست می‌خورد (برای مثال Gemma روی بعضی buildهای `inferrs`) → ترابری OpenClaw احتمالا از قبل درست است؛ backend روی شکل prompt بزرگ‌تر runtime عامل شکست می‌خورد.
    - شکست‌ها پس از غیرفعال کردن ابزارها کمتر می‌شوند اما از بین نمی‌روند → schemaهای ابزار بخشی از فشار بودند، اما مشکل باقی‌مانده همچنان ظرفیت مدل/سرور upstream یا یک bug در backend است.

  </Accordion>
  <Accordion title="گزینه‌های رفع">
    1. برای backendهای Chat Completions فقط-string، `compat.requiresStringContent: true` را تنظیم کنید.
    2. برای مدل‌ها/backendهایی که نمی‌توانند سطح schema ابزار OpenClaw را قابل‌اعتماد مدیریت کنند، `compat.supportsTools: false` را تنظیم کنید.
    3. فشار prompt را تا جای ممکن کاهش دهید: bootstrap کوچک‌تر workspace، تاریخچه نشست کوتاه‌تر، مدل محلی سبک‌تر، یا backend با پشتیبانی long-context قوی‌تر.
    4. اگر درخواست‌های کوچک مستقیم همچنان پاس می‌شوند اما نوبت‌های عامل OpenClaw هنوز داخل backend crash می‌کنند، آن را محدودیت upstream سرور/مدل در نظر بگیرید و با شکل payload پذیرفته‌شده، آنجا یک repro ثبت کنید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/gateway/configuration)
- [مدل‌های محلی](/fa/gateway/local-models)
- [endpointهای سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)

## بدون پاسخ

اگر کانال‌ها بالا هستند اما هیچ چیزی پاسخ نمی‌دهد، پیش از اتصال دوباره هر چیز، routing و policy را بررسی کنید.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

دنبال این موارد بگردید:

- Pairing برای فرستنده‌های DM در حالت pending است.
- gating منشن گروه (`requireMention`, `mentionPatterns`).
- ناهماهنگی‌های allowlist کانال/گروه.

امضاهای رایج:

- `drop guild message (mention required` → پیام گروه تا زمان منشن نادیده گرفته می‌شود.
- `pairing request` → فرستنده به تایید نیاز دارد.
- `blocked` / `allowlist` → فرستنده/کانال توسط policy فیلتر شده است.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [گروه‌ها](/fa/channels/groups)
- [Pairing](/fa/channels/pairing)

## اتصال رابط کاربری کنترل داشبورد

وقتی رابط کاربری داشبورد/کنترل وصل نمی‌شود، URL، حالت احراز هویت، و فرض‌های secure context را اعتبارسنجی کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

دنبال این موارد بگردید:

- URL درست probe و URL داشبورد.
- ناهماهنگی حالت/توکن احراز هویت بین client و Gateway.
- استفاده از HTTP در جایی که هویت دستگاه لازم است.

<AccordionGroup>
  <Accordion title="امضاهای اتصال / احراز هویت">
    - `device identity required` → context ناامن یا احراز هویت دستگاه موجود نیست.
    - `origin not allowed` → مقدار `Origin` مرورگر در `gateway.controlUi.allowedOrigins` نیست (یا از یک origin مرورگر غیر-loopback بدون allowlist صریح وصل می‌شوید).
    - `device nonce required` / `device nonce mismatch` → client جریان احراز هویت دستگاه مبتنی بر challenge را کامل نمی‌کند (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client payload اشتباه (یا timestamp کهنه) را برای handshake فعلی امضا کرده است.
    - `AUTH_TOKEN_MISMATCH` با `canRetryWithDeviceToken=true` → client می‌تواند یک retry مورداعتماد با توکن دستگاه cacheشده انجام دهد.
    - آن retry با cached-token همان مجموعه scope cacheشده ذخیره‌شده همراه با توکن دستگاه pairشده را دوباره استفاده می‌کند. فراخوان‌هایی که `deviceToken` صریح / `scopes` صریح دارند، مجموعه scope درخواستی خود را نگه می‌دارند.
    - بیرون از آن مسیر retry، تقدم احراز هویت اتصال به‌ترتیب token/password مشترک صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، سپس توکن bootstrap است.
    - در مسیر async Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, ip}` پیش از ثبت شکست توسط limiter سریال‌سازی می‌شوند. بنابراین دو retry بد هم‌زمان از همان client می‌توانند به‌جای دو mismatch ساده، در تلاش دوم `retry later` نشان دهند.
    - `too many failed authentication attempts (retry later)` از یک client مرورگر-origin loopback → شکست‌های تکراری از همان `Origin` نرمال‌شده به طور موقت قفل می‌شوند؛ یک origin localhost دیگر از bucket جداگانه استفاده می‌کند.
    - `unauthorized` تکراری پس از آن retry → drift توکن مشترک/توکن دستگاه؛ پیکربندی توکن را refresh کنید و در صورت نیاز توکن دستگاه را دوباره approve/rotate کنید.
    - `gateway connect failed:` → هدف host/port/url اشتباه است.

  </Accordion>
</AccordionGroup>

### نگاشت سریع کدهای جزئیات احراز هویت

برای انتخاب اقدام بعدی، از `error.details.code` در پاسخ ناموفق `connect` استفاده کنید:

| کد جزئیات                   | معنی                                                                                                                                                                                     | اقدام پیشنهادی                                                                                                                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | کلاینت توکن مشترک الزامی را ارسال نکرده است.                                                                                                                                                 | توکن را در کلاینت جای‌گذاری/تنظیم کنید و دوباره تلاش کنید. برای مسیرهای داشبورد: `openclaw config get gateway.auth.token` سپس آن را در تنظیمات رابط کاربری کنترل جای‌گذاری کنید.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | توکن مشترک با توکن احراز هویت Gateway مطابقت نداشت.                                                                                                                                               | اگر `canRetryWithDeviceToken=true` است، یک تلاش مجدد مورد اعتماد را مجاز کنید. تلاش‌های مجدد با توکن کش‌شده از scopeهای تأییدشده ذخیره‌شده دوباره استفاده می‌کنند؛ فراخوان‌های صریح `deviceToken` / `scopes` همان scopeهای درخواستی را نگه می‌دارند. اگر همچنان ناموفق بود، [چک‌لیست بازیابی ناهماهنگی توکن](/fa/cli/devices#token-drift-recovery-checklist) را اجرا کنید. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | توکن کش‌شده مخصوص دستگاه کهنه یا لغو شده است.                                                                                                                                                 | توکن دستگاه را با استفاده از [CLI دستگاه‌ها](/fa/cli/devices) بچرخانید/دوباره تأیید کنید، سپس دوباره وصل شوید.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | هویت دستگاه نیاز به تأیید دارد. `error.details.reason` را برای `not-paired`، `scope-upgrade`، `role-upgrade`، یا `metadata-upgrade` بررسی کنید، و در صورت وجود از `requestId` / `remediationHint` استفاده کنید. | درخواست معلق را تأیید کنید: `openclaw devices list` سپس `openclaw devices approve <requestId>`. ارتقاهای scope/نقش پس از بازبینی دسترسی درخواستی از همان جریان استفاده می‌کنند.                                                                                                               |

<Note>
RPCهای مستقیم backend از نوع loopback که با توکن/رمز عبور مشترک Gateway احراز هویت شده‌اند، نباید به baseline scope دستگاه جفت‌شده در CLI وابسته باشند. اگر subagentها یا فراخوان‌های داخلی دیگر همچنان با `scope-upgrade` ناموفق می‌شوند، بررسی کنید فراخواننده از `client.id: "gateway-client"` و `client.mode: "backend"` استفاده می‌کند و `deviceIdentity` صریح یا توکن دستگاه را اجباری نمی‌کند.
</Note>

بررسی مهاجرت احراز هویت دستگاه نسخه ۲:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

اگر logها خطاهای nonce/signature نشان می‌دهند، کلاینت متصل‌شونده را به‌روزرسانی و آن را تأیید کنید:

<Steps>
  <Step title="Wait for connect.challenge">
    کلاینت منتظر `connect.challenge` صادرشده توسط Gateway می‌ماند.
  </Step>
  <Step title="Sign the payload">
    کلاینت payload وابسته به challenge را امضا می‌کند.
  </Step>
  <Step title="Send the device nonce">
    کلاینت `connect.params.device.nonce` را با همان nonce مربوط به challenge ارسال می‌کند.
  </Step>
</Steps>

اگر `openclaw devices rotate` / `revoke` / `remove` به‌طور غیرمنتظره رد شد:

- نشست‌های توکن دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را مدیریت کنند، مگر اینکه فراخواننده `operator.admin` هم داشته باشد
- `openclaw devices rotate --scope ...` فقط می‌تواند scopeهای اپراتوری را درخواست کند که نشست فراخواننده از قبل دارد

مرتبط:

- [پیکربندی](/fa/gateway/configuration) (حالت‌های احراز هویت Gateway)
- [رابط کاربری کنترل](/fa/web/control-ui)
- [دستگاه‌ها](/fa/cli/devices)
- [دسترسی راه دور](/fa/gateway/remote)
- [احراز هویت trusted proxy](/fa/gateway/trusted-proxy-auth)

## سرویس Gateway اجرا نمی‌شود

وقتی سرویس نصب شده اما فرایند فعال نمی‌ماند، از این استفاده کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

دنبال این موارد بگردید:

- `Runtime: stopped` همراه با راهنمایی‌های exit.
- ناهماهنگی پیکربندی سرویس (`Config (cli)` در برابر `Config (service)`).
- تداخل‌های پورت/شنونده.
- نصب‌های اضافی launchd/systemd/schtasks وقتی `--deep` استفاده می‌شود.
- راهنمایی‌های پاک‌سازی `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` یا `existing config is missing gateway.mode` → حالت Gateway محلی فعال نیست، یا فایل پیکربندی بازنویسی شده و `gateway.mode` را از دست داده است. رفع: `gateway.mode="local"` را در پیکربندی خود تنظیم کنید، یا `openclaw onboard --mode local` / `openclaw setup` را دوباره اجرا کنید تا پیکربندی مورد انتظار حالت محلی دوباره مهر شود. اگر OpenClaw را از طریق Podman اجرا می‌کنید، مسیر پیش‌فرض پیکربندی `~/.openclaw/openclaw.json` است.
    - `refusing to bind gateway ... without auth` → اتصال non-loopback بدون مسیر معتبر احراز هویت Gateway (توکن/رمز عبور، یا trusted-proxy در جایی که پیکربندی شده است).
    - `another gateway instance is already listening` / `EADDRINUSE` → تداخل پورت.
    - `Other gateway-like services detected (best effort)` → واحدهای قدیمی یا موازی launchd/systemd/schtasks وجود دارند. بیشتر راه‌اندازی‌ها باید برای هر ماشین یک Gateway نگه دارند؛ اگر واقعاً به بیش از یکی نیاز دارید، پورت‌ها + پیکربندی/وضعیت/workspace را جدا کنید. [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.
    - `System-level OpenClaw gateway service detected` از doctor → یک واحد سیستم systemd وجود دارد در حالی که سرویس سطح کاربر وجود ندارد. قبل از اینکه به doctor اجازه دهید یک سرویس کاربری نصب کند، نسخه تکراری را حذف یا غیرفعال کنید، یا اگر واحد سیستم supervisor مورد نظر است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.
    - `Gateway service port does not match current gateway config` → supervisor نصب‌شده هنوز `--port` قدیمی را pin کرده است. `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید، سپس سرویس Gateway را دوباره راه‌اندازی کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [Doctor](/fa/gateway/doctor)

## Gateway پیکربندی نامعتبر را رد کرد

وقتی راه‌اندازی Gateway با `Invalid config` شکست می‌خورد یا logهای hot reload می‌گویند
یک ویرایش نامعتبر را رد کرده است، از این استفاده کنید.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

دنبال این موارد بگردید:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- یک فایل `openclaw.json.rejected.*` با timestamp کنار پیکربندی فعال
- اگر `doctor --fix` یک ویرایش مستقیم خراب را تعمیر کرده باشد، یک فایل `openclaw.json.clobbered.*` با timestamp

<AccordionGroup>
  <Accordion title="What happened">
    - پیکربندی هنگام راه‌اندازی، hot reload، یا نوشتن تحت مالکیت OpenClaw اعتبارسنجی نشد.
    - راه‌اندازی Gateway به‌جای بازنویسی `openclaw.json` به‌صورت بسته شکست می‌خورد.
    - hot reload ویرایش‌های خارجی نامعتبر را رد می‌کند و پیکربندی runtime فعلی را فعال نگه می‌دارد.
    - نوشتن‌های تحت مالکیت OpenClaw پیش از commit payloadهای نامعتبر/مخرب را رد می‌کنند و `.rejected.*` را ذخیره می‌کنند.
    - `openclaw doctor --fix` مالک تعمیر است. می‌تواند پیشوندهای غیر JSON را حذف کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند، در حالی که payload ردشده را به‌صورت `.clobbered.*` حفظ می‌کند.

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
    - `.clobbered.*` وجود دارد → doctor هنگام تعمیر پیکربندی فعال، یک ویرایش خارجی خراب را حفظ کرده است.
    - `.rejected.*` وجود دارد → یک نوشتن پیکربندی تحت مالکیت OpenClaw پیش از commit در schema یا بررسی‌های clobber شکست خورده است.
    - `Config write rejected:` → نوشتن تلاش کرده shape الزامی را حذف کند، فایل را به‌شدت کوچک کند، یا پیکربندی نامعتبر را persist کند.
    - `config reload skipped (invalid config):` → یک ویرایش مستقیم در اعتبارسنجی شکست خورد و توسط Gateway در حال اجرا نادیده گرفته شد.
    - `Invalid config at ...` → راه‌اندازی پیش از boot شدن سرویس‌های Gateway شکست خورد.
    - `missing-meta-vs-last-good`، `gateway-mode-missing-vs-last-good`، یا `size-drop-vs-last-good:*` → یک نوشتن تحت مالکیت OpenClaw رد شد چون نسبت به backup آخرین نسخه سالم شناخته‌شده، فیلدها یا اندازه را از دست داده بود.
    - `Config last-known-good promotion skipped` → candidate شامل placeholderهای secret سانسورشده مانند `***` بود.

  </Accordion>
  <Accordion title="Fix options">
    1. `openclaw doctor --fix` را اجرا کنید تا doctor پیکربندی دارای prefix/clobbered را تعمیر کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند.
    2. فقط کلیدهای مورد نظر را از `.clobbered.*` یا `.rejected.*` کپی کنید، سپس آن‌ها را با `openclaw config set` یا `config.patch` اعمال کنید.
    3. قبل از راه‌اندازی مجدد، `openclaw config validate` را اجرا کنید.
    4. اگر دستی ویرایش می‌کنید، پیکربندی کامل JSON5 را نگه دارید، نه فقط شیء جزئی‌ای که می‌خواستید تغییر دهید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [Config](/fa/cli/config)
- [پیکربندی: hot reload](/fa/gateway/configuration#config-hot-reload)
- [پیکربندی: اعتبارسنجی سخت‌گیرانه](/fa/gateway/configuration#strict-validation)
- [Doctor](/fa/gateway/doctor)

## هشدارهای probe در Gateway

وقتی `openclaw gateway probe` به چیزی می‌رسد، اما همچنان یک بلوک هشدار چاپ می‌کند، از این استفاده کنید.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

دنبال این موارد بگردید:

- `warnings[].code` و `primaryTargetId` در خروجی JSON.
- اینکه هشدار درباره fallback SSH، چند Gateway، scopeهای مفقود، یا refهای احراز هویت resolveنشده است.

امضاهای رایج:

- `SSH tunnel failed to start; falling back to direct probes.` → راه‌اندازی SSH شکست خورد، اما دستور همچنان هدف‌های مستقیم پیکربندی‌شده/loopback را امتحان کرد.
- `multiple reachable gateways detected` → بیش از یک هدف پاسخ داد. معمولاً این یعنی یک راه‌اندازی چند-Gateway عمدی یا شنونده‌های قدیمی/تکراری.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → اتصال برقرار شد، اما RPC جزئیات به‌خاطر scope محدود شده است؛ هویت دستگاه را pair کنید یا از credentials دارای `operator.read` استفاده کنید.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → اتصال برقرار شد، اما مجموعه کامل RPCهای تشخیصی timeout شد یا شکست خورد. این را به‌عنوان یک Gateway قابل دسترسی با diagnostics تضعیف‌شده در نظر بگیرید؛ `connect.ok` و `connect.rpcOk` را در خروجی `--json` مقایسه کنید.
- `Capability: pairing-pending` یا `gateway closed (1008): pairing required` → Gateway پاسخ داد، اما این کلاینت هنوز پیش از دسترسی عادی اپراتور به pairing/approval نیاز دارد.
- متن هشدار SecretRef حل‌نشده `gateway.auth.*` / `gateway.remote.*` → material احراز هویت در این مسیر دستور برای هدف ناموفق در دسترس نبود.

مرتبط:

- [Gateway](/fa/cli/gateway)
- [چند Gateway روی همان میزبان](/fa/gateway#multiple-gateways-same-host)
- [دسترسی راه دور](/fa/gateway/remote)

## کانال وصل است، اما پیام‌ها جریان ندارند

اگر وضعیت کانال connected است اما جریان پیام‌ها متوقف شده، روی policy، مجوزها، و قواعد تحویل مخصوص کانال تمرکز کنید.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

دنبال این موارد بگردید:

- خط‌مشی DM (`pairing`، `allowlist`، `open`، `disabled`).
- فهرست مجاز گروه و الزامات اشاره.
- مجوزها/دامنه‌های API کانال که وجود ندارند.

امضاهای رایج:

- `mention required` → پیام به‌دلیل خط‌مشی اشاره در گروه نادیده گرفته شد.
- `pairing` / ردپاهای تأیید در انتظار → فرستنده تأیید نشده است.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشکل احراز هویت/مجوزهای کانال.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [Discord](/fa/channels/discord)
- [Telegram](/fa/channels/telegram)
- [WhatsApp](/fa/channels/whatsapp)

## Cron و تحویل Heartbeat

اگر cron یا heartbeat اجرا نشد یا تحویل نداد، ابتدا وضعیت زمان‌بند را بررسی کنید، سپس مقصد تحویل را.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

موارد زیر را بررسی کنید:

- Cron فعال باشد و بیدارباش بعدی وجود داشته باشد.
- وضعیت تاریخچه اجرای کار (`ok`، `skipped`، `error`).
- دلایل رد شدن Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `cron: scheduler disabled; jobs will not run automatically` → cron غیرفعال است.
    - `cron: timer tick failed` → تیک زمان‌بند ناموفق بود؛ خطاهای فایل/لاگ/زمان اجرا را بررسی کنید.
    - `heartbeat skipped` همراه با `reason=quiet-hours` → خارج از بازه ساعات فعال است.
    - `heartbeat skipped` همراه با `reason=empty-heartbeat-file` → `HEARTBEAT.md` وجود دارد اما فقط شامل خط‌های خالی / سربرگ‌های مارک‌داون است، بنابراین OpenClaw فراخوانی مدل را رد می‌کند.
    - `heartbeat skipped` همراه با `reason=no-tasks-due` → `HEARTBEAT.md` شامل یک بلوک `tasks:` است، اما هیچ‌کدام از کارها در این تیک موعد اجرا ندارند.
    - `heartbeat: unknown accountId` → شناسه حساب برای مقصد تحویل heartbeat نامعتبر است.
    - `heartbeat skipped` همراه با `reason=dm-blocked` → مقصد heartbeat به یک مقصد سبک DM resolve شده، در حالی که `agents.defaults.heartbeat.directPolicy` (یا override هر عامل) روی `block` تنظیم شده است.

  </Accordion>
</AccordionGroup>

مرتبط:

- [Heartbeat](/fa/gateway/heartbeat)
- [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
- [کارهای زمان‌بندی‌شده: عیب‌یابی](/fa/automation/cron-jobs#troubleshooting)

## Node جفت شده، ابزار ناموفق است

اگر یک node جفت شده اما ابزارها ناموفق هستند، وضعیت پیش‌زمینه، مجوز و تأیید را جداگانه بررسی کنید.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

موارد زیر را بررسی کنید:

- Node آنلاین با قابلیت‌های مورد انتظار.
- اعطای مجوزهای سیستم‌عامل برای دوربین/میکروفون/مکان/صفحه.
- وضعیت تأییدهای exec و فهرست مجاز.

امضاهای رایج:

- `NODE_BACKGROUND_UNAVAILABLE` → برنامه node باید در پیش‌زمینه باشد.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → مجوز سیستم‌عامل وجود ندارد.
- `SYSTEM_RUN_DENIED: approval required` → تأیید exec در انتظار است.
- `SYSTEM_RUN_DENIED: allowlist miss` → فرمان توسط فهرست مجاز مسدود شده است.

مرتبط:

- [تأییدهای exec](/fa/tools/exec-approvals)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
- [Nodes](/fa/nodes/index)

## ابزار مرورگر ناموفق است

وقتی اقدام‌های ابزار مرورگر با وجود سالم بودن خود Gateway ناموفق هستند، از این بخش استفاده کنید.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

موارد زیر را بررسی کنید:

- اینکه آیا `plugins.allow` تنظیم شده و شامل `browser` هست یا نه.
- مسیر اجرایی معتبر مرورگر.
- دسترس‌پذیری پروفایل CDP.
- در دسترس بودن Chrome محلی برای پروفایل‌های `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="امضاهای Plugin / فایل اجرایی">
    - `unknown command "browser"` یا `unknown command 'browser'` → Plugin مرورگر بسته‌بندی‌شده توسط `plugins.allow` مستثنی شده است.
    - ابزار مرورگر وجود ندارد / در دسترس نیست در حالی که `browser.enabled=true` → `plugins.allow` شامل `browser` نیست، پس Plugin هرگز بارگذاری نشده است.
    - `Failed to start Chrome CDP on port` → فرایند مرورگر اجرا نشد.
    - `browser.executablePath not found` → مسیر پیکربندی‌شده نامعتبر است.
    - `browser.cdpUrl must be http(s) or ws(s)` → نشانی CDP پیکربندی‌شده از طرح پشتیبانی‌نشده‌ای مثل `file:` یا `ftp:` استفاده می‌کند.
    - `browser.cdpUrl has invalid port` → نشانی CDP پیکربندی‌شده پورت بد یا خارج از محدوده دارد.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → نصب فعلی gateway وابستگی اصلی زمان اجرای مرورگر را ندارد؛ OpenClaw را دوباره نصب یا به‌روزرسانی کنید، سپس Gateway را راه‌اندازی مجدد کنید. اسنپ‌شات‌های ARIA و اسکرین‌شات‌های پایه صفحه همچنان می‌توانند کار کنند، اما ناوبری، اسنپ‌شات‌های AI، اسکرین‌شات‌های عنصر با انتخابگر CSS و خروجی PDF در دسترس نمی‌مانند.

  </Accordion>
  <Accordion title="امضاهای Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session هنوز نتوانسته به دایرکتوری داده مرورگر انتخاب‌شده attach شود. صفحه inspect مرورگر را باز کنید، remote debugging را فعال کنید، مرورگر را باز نگه دارید، اولین درخواست attach را تأیید کنید، سپس دوباره تلاش کنید. اگر وضعیت ورود لازم نیست، پروفایل مدیریت‌شده `openclaw` را ترجیح دهید.
    - `No Chrome tabs found for profile="user"` → پروفایل attach کروم MCP هیچ تب Chrome محلی بازی ندارد.
    - `Remote CDP for profile "<name>" is not reachable` → نقطه پایانی CDP راه دور پیکربندی‌شده از میزبان Gateway قابل دسترسی نیست.
    - `Browser attachOnly is enabled ... not reachable` یا `Browser attachOnly is enabled and CDP websocket ... is not reachable` → پروفایل فقط-attach هدف قابل دسترسی ندارد، یا نقطه پایانی HTTP پاسخ داده اما WebSocket مربوط به CDP همچنان باز نشده است.

  </Accordion>
  <Accordion title="امضاهای عنصر / اسکرین‌شات / آپلود">
    - `fullPage is not supported for element screenshots` → درخواست اسکرین‌شات `--full-page` را با `--ref` یا `--element` ترکیب کرده است.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → فراخوانی‌های اسکرین‌شات Chrome MCP / `existing-session` باید از capture صفحه یا `--ref` اسنپ‌شات استفاده کنند، نه CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hookهای آپلود Chrome MCP به refهای اسنپ‌شات نیاز دارند، نه انتخابگرهای CSS.
    - `existing-session file uploads currently support one file at a time.` → در پروفایل‌های Chrome MCP برای هر فراخوانی یک آپلود ارسال کنید.
    - `existing-session dialog handling does not support timeoutMs.` → hookهای دیالوگ در پروفایل‌های Chrome MCP از overrideهای timeout پشتیبانی نمی‌کنند.
    - `existing-session type does not support timeoutMs overrides.` → برای `act:type` در پروفایل‌های `profile="user"` / Chrome MCP existing-session، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `existing-session evaluate does not support timeoutMs overrides.` → برای `act:evaluate` در پروفایل‌های `profile="user"` / Chrome MCP existing-session، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارد.
    - overrideهای کهنه viewport / dark-mode / locale / offline روی پروفایل‌های attach-only یا CDP راه دور → `openclaw browser stop --browser-profile <name>` را اجرا کنید تا نشست کنترل فعال بسته شود و وضعیت emulation مربوط به Playwright/CDP بدون راه‌اندازی مجدد کل Gateway آزاد شود.

  </Accordion>
</AccordionGroup>

مرتبط:

- [مرورگر (مدیریت‌شده توسط OpenClaw)](/fa/tools/browser)
- [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting)

## اگر ارتقا دادید و چیزی ناگهان خراب شد

بیشتر خرابی‌های پس از ارتقا ناشی از drift پیکربندی یا اعمال شدن پیش‌فرض‌های سخت‌گیرانه‌تر فعلی است.

<AccordionGroup>
  <Accordion title="1. رفتار احراز هویت و override نشانی تغییر کرده است">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    چه چیزی را بررسی کنید:

    - اگر `gateway.mode=remote` باشد، فراخوانی‌های CLI ممکن است مقصدشان remote باشد در حالی که سرویس محلی شما سالم است.
    - فراخوانی‌های صریح `--url` به اعتبارنامه‌های ذخیره‌شده fallback نمی‌کنند.

    امضاهای رایج:

    - `gateway connect failed:` → مقصد نشانی اشتباه است.
    - `unauthorized` → نقطه پایانی قابل دسترسی است اما احراز هویت اشتباه است.

  </Accordion>
  <Accordion title="2. محافظ‌های bind و احراز هویت سخت‌گیرانه‌تر هستند">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    چه چیزی را بررسی کنید:

    - bindهای غیر local loopback (`lan`، `tailnet`، `custom`) به یک مسیر معتبر احراز هویت gateway نیاز دارند: احراز هویت با توکن/رمز عبور مشترک، یا استقرار `trusted-proxy` غیر local loopback که درست پیکربندی شده باشد.
    - کلیدهای قدیمی مثل `gateway.token` جایگزین `gateway.auth.token` نمی‌شوند.

    امضاهای رایج:

    - `refusing to bind gateway ... without auth` → bind غیر local loopback بدون مسیر معتبر احراز هویت gateway.
    - `Connectivity probe: failed` در حالی که زمان اجرا فعال است → gateway زنده است اما با auth/url فعلی قابل دسترسی نیست.

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

اگر پیکربندی سرویس و زمان اجرا پس از بررسی‌ها همچنان با هم ناسازگار هستند، فراداده سرویس را از همان دایرکتوری پروفایل/وضعیت دوباره نصب کنید:

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
- [پرسش‌های متداول](/fa/help/faq)
- [Runbook Gateway](/fa/gateway)
