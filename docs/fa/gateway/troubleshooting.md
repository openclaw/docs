---
read_when:
    - مرکز عیب‌یابی شما را برای تشخیص عمیق‌تر به اینجا هدایت کرد
    - به بخش‌های پایدارِ راهنمای عملیاتی مبتنی بر نشانه‌ها با فرمان‌های دقیق نیاز دارید
sidebarTitle: Troubleshooting
summary: راهنمای عملیاتی عیب‌یابی عمیق برای Gateway، کانال‌ها، خودکارسازی، گره‌ها و مرورگر
title: عیب‌یابی
x-i18n:
    generated_at: "2026-05-10T19:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 798016211b615242abca327295c76223ff2dfd3d83dc8a08e396d9e65b9efed4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

این صفحه راهنمای اجرایی عمیق است. اگر ابتدا جریان تریاژ سریع را می‌خواهید، از [/help/troubleshooting](/fa/help/troubleshooting) شروع کنید.

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

- `openclaw gateway status` مقدار `Runtime: running`، مقدار `Connectivity probe: ok` و یک خط `Capability: ...` را نشان می‌دهد.
- `openclaw doctor` هیچ مشکل مسدودکننده‌ای در پیکربندی/سرویس گزارش نمی‌کند.
- `openclaw channels status --probe` وضعیت زندهٔ انتقال برای هر حساب را نشان می‌دهد و، در موارد پشتیبانی‌شده، نتایج پروب/ممیزی مانند `works` یا `audit ok` را نمایش می‌دهد.

## نصب‌های دوپاره و محافظ پیکربندی جدیدتر

وقتی یک سرویس Gateway پس از به‌روزرسانی به‌طور غیرمنتظره متوقف می‌شود، یا لاگ‌ها نشان می‌دهند که یک باینری `openclaw` از نسخه‌ای که آخرین بار `openclaw.json` را نوشته قدیمی‌تر است، از این بخش استفاده کنید.

OpenClaw نوشتن‌های پیکربندی را با `meta.lastTouchedVersion` مهر می‌کند. فرمان‌های فقط‌خواندنی همچنان می‌توانند پیکربندی‌ای را که توسط OpenClaw جدیدتر نوشته شده بررسی کنند، اما تغییرات پردازش و سرویس از ادامه با یک باینری قدیمی‌تر خودداری می‌کنند. اقدام‌های مسدودشده شامل شروع، توقف، راه‌اندازی مجدد، حذف نصب سرویس Gateway، نصب مجدد اجباری سرویس، راه‌اندازی Gateway در حالت سرویس، و پاک‌سازی پورت با `gateway --force` هستند.

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
    بستهٔ سیستمی قدیمی یا ورودی‌های wrapper قدیمی را که هنوز به یک باینری قدیمی `openclaw` اشاره می‌کنند حذف کنید.
  </Step>
</Steps>

<Warning>
فقط برای downgrade عمدی یا بازیابی اضطراری، برای همان یک فرمان `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` را تنظیم کنید. برای کارکرد عادی آن را تنظیم‌نشده بگذارید.
</Warning>

## symlink مربوط به Skill به‌دلیل خروج از مسیر نادیده گرفته شد

وقتی لاگ‌ها شامل این مورد هستند از این بخش استفاده کنید:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw هر ریشهٔ skill را یک مرز containment در نظر می‌گیرد. یک symlink زیر
`~/.agents/skills`، `<workspace>/.agents/skills`، `<workspace>/skills` یا
`~/.openclaw/skills` وقتی نادیده گرفته می‌شود که مقصد واقعی آن بیرون از آن ریشه resolve شود،
مگر اینکه مقصد به‌صراحت مورداعتماد باشد.

لینک را بررسی کنید:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

اگر مقصد عمدی است، هم ریشهٔ مستقیم skill و هم مقصد symlink مجاز را پیکربندی کنید:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

سپس یک نشست جدید شروع کنید یا منتظر بمانید تا ناظر Skills به‌روزرسانی شود. اگر فرایند در حال اجرا پیش از تغییر پیکربندی شروع شده است، Gateway را راه‌اندازی مجدد کنید.

از مقصدهای گسترده مانند `~`، `/` یا کل یک پوشهٔ پروژهٔ همگام‌شده استفاده نکنید.
`allowSymlinkTargets` را به ریشهٔ واقعی skill که شامل دایرکتوری‌های مورداعتماد
`SKILL.md` است محدود نگه دارید.

مرتبط:

- [پیکربندی Skills](/fa/tools/skills-config#symlinked-sibling-repos)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples#symlinked-sibling-skill-repo)

## برای context طولانی در Anthropic 429 به مصرف اضافی نیاز است

وقتی لاگ‌ها/خطاها شامل این مورد هستند استفاده کنید: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

به‌دنبال این‌ها بگردید:

- مدل Anthropic Opus/Sonnet انتخاب‌شده دارای `params.context1m: true` است.
- credential فعلی Anthropic برای مصرف long-context واجد شرایط نیست.
- درخواست‌ها فقط در نشست‌ها/اجرای مدل‌های طولانی که به مسیر بتای 1M نیاز دارند شکست می‌خورند.

گزینه‌های اصلاح:

<Steps>
  <Step title="Disable context1m">
    `context1m` را برای آن مدل غیرفعال کنید تا به پنجرهٔ context عادی بازگردد.
  </Step>
  <Step title="Use an eligible credential">
    از credential مربوط به Anthropic استفاده کنید که برای درخواست‌های long-context واجد شرایط است، یا به یک کلید API Anthropic تغییر دهید.
  </Step>
  <Step title="Configure fallback models">
    مدل‌های fallback را پیکربندی کنید تا اجراها هنگام رد شدن درخواست‌های long-context Anthropic ادامه پیدا کنند.
  </Step>
</Steps>

مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف token و هزینه‌ها](/fa/reference/token-use)
- [چرا HTTP 429 از Anthropic می‌بینم؟](/fa/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend محلی سازگار با OpenAI پروب‌های مستقیم را پاس می‌کند اما اجرای agent شکست می‌خورد

وقتی این موارد برقرار است استفاده کنید:

- `curl ... /v1/models` کار می‌کند
- فراخوانی‌های کوچک مستقیم `/v1/chat/completions` کار می‌کنند
- اجرای مدل در OpenClaw فقط در turnهای عادی agent شکست می‌خورد

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

به‌دنبال این‌ها بگردید:

- فراخوانی‌های مستقیم کوچک موفق می‌شوند، اما اجرای OpenClaw فقط روی promptهای بزرگ‌تر شکست می‌خورد
- خطاهای `model_not_found` یا 404، با اینکه `/v1/chat/completions` مستقیم
  با همان شناسهٔ bare مدل کار می‌کند
- خطاهای backend دربارهٔ اینکه `messages[].content` انتظار string دارد
- هشدارهای متناوب `incomplete turn detected ... stopReason=stop payloads=0` با یک backend محلی سازگار با OpenAI
- crashهای backend که فقط با تعداد prompt-token بیشتر یا promptهای کامل runtime agent ظاهر می‌شوند

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` با یک سرور محلی سبک MLX/vLLM → بررسی کنید `baseUrl` شامل `/v1` باشد، `api` برای backendهای `/v1/chat/completions` برابر `"openai-completions"` باشد، و `models.providers.<provider>.models[].id` همان شناسهٔ bare و محلیِ provider باشد. آن را یک بار با پیشوند provider انتخاب کنید، برای مثال `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ ورودی catalog را به‌شکل `mlx-community/Qwen3-30B-A3B-6bit` نگه دارید.
    - `messages[...].content: invalid type: sequence, expected a string` → backend بخش‌های محتوای ساختاریافتهٔ Chat Completions را رد می‌کند. اصلاح: `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
    - `validation.keys` یا کلیدهای مجاز پیام مثل `["role","content"]` → backend متادیتای replay سبک OpenAI را روی پیام‌های Chat Completions رد می‌کند. اصلاح: `models.providers.<provider>.models[].compat.strictMessageKeys: true` را تنظیم کنید.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend درخواست Chat Completions را کامل کرده اما برای آن turn هیچ متن assistant قابل‌مشاهده برای کاربر برنگردانده است. OpenClaw turnهای خالی سازگار با OpenAI و replay-safe را یک بار دوباره امتحان می‌کند؛ شکست‌های پایدار معمولاً یعنی backend محتوای خالی/غیرمتنی منتشر می‌کند یا متن پاسخ نهایی را سرکوب می‌کند.
    - درخواست‌های مستقیم کوچک موفق می‌شوند، اما اجرای agent در OpenClaw با crashهای backend/model شکست می‌خورد، برای مثال Gemma روی برخی buildهای `inferrs` → احتمالاً transport در OpenClaw از قبل درست است؛ backend روی شکل prompt بزرگ‌تر runtime agent شکست می‌خورد.
    - پس از غیرفعال کردن ابزارها شکست‌ها کمتر می‌شوند اما ناپدید نمی‌شوند → schemaهای ابزار بخشی از فشار بودند، اما مشکل باقی‌مانده همچنان ظرفیت model/server بالادستی یا یک bug در backend است.

  </Accordion>
  <Accordion title="Fix options">
    1. برای backendهای Chat Completions که فقط string می‌پذیرند، `compat.requiresStringContent: true` را تنظیم کنید.
    2. برای backendهای سخت‌گیر Chat Completions که روی هر پیام فقط `role` و `content` را می‌پذیرند، `compat.strictMessageKeys: true` را تنظیم کنید.
    3. برای مدل‌ها/backendهایی که نمی‌توانند سطح schema ابزارهای OpenClaw را با اطمینان مدیریت کنند، `compat.supportsTools: false` را تنظیم کنید.
    4. فشار prompt را تا جای ممکن کم کنید: bootstrap کوچک‌تر workspace، تاریخچهٔ نشست کوتاه‌تر، مدل محلی سبک‌تر، یا backend با پشتیبانی long-context قوی‌تر.
    5. اگر درخواست‌های مستقیم کوچک همچنان پاس می‌شوند اما turnهای agent در OpenClaw هنوز داخل backend crash می‌کنند، آن را یک محدودیت server/model بالادستی در نظر بگیرید و با شکل payload پذیرفته‌شده، یک repro آنجا ثبت کنید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/gateway/configuration)
- [مدل‌های محلی](/fa/gateway/local-models)
- [endpointهای سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)

## بدون پاسخ

اگر channelها بالا هستند اما چیزی پاسخ نمی‌دهد، قبل از reconnect کردن هرچیز، routing و policy را بررسی کنید.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

به‌دنبال این‌ها بگردید:

- Pairing برای فرستنده‌های DM در انتظار است.
- gating اشاره در گروه (`requireMention`، `mentionPatterns`).
- ناسازگاری‌های allowlist کانال/گروه.

امضاهای رایج:

- `drop guild message (mention required` → پیام گروه تا زمان mention نادیده گرفته می‌شود.
- `pairing request` → فرستنده به تأیید نیاز دارد.
- `blocked` / `allowlist` → فرستنده/channel توسط policy فیلتر شده است.

مرتبط:

- [عیب‌یابی Channel](/fa/channels/troubleshooting)
- [گروه‌ها](/fa/channels/groups)
- [Pairing](/fa/channels/pairing)

## اتصال UI کنترل داشبورد

وقتی dashboard/control UI وصل نمی‌شود، URL، حالت auth و فرض‌های secure context را اعتبارسنجی کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

به‌دنبال این‌ها بگردید:

- URL درست probe و URL داشبورد.
- ناسازگاری حالت auth/token بین client و Gateway.
- استفاده از HTTP در جایی که device identity لازم است.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → context ناامن یا نبود device auth.
    - `origin not allowed` → مقدار `Origin` مرورگر در `gateway.controlUi.allowedOrigins` نیست، یا از یک origin مرورگر غیر-loopback بدون allowlist صریح وصل می‌شوید.
    - `device nonce required` / `device nonce mismatch` → client جریان device auth مبتنی بر challenge را کامل نمی‌کند (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client برای handshake فعلی payload اشتباه، یا timestamp منقضی، را sign کرده است.
    - `AUTH_TOKEN_MISMATCH` با `canRetryWithDeviceToken=true` → client می‌تواند یک retry مورداعتماد با device token کش‌شده انجام دهد.
    - آن retry با cached-token همان مجموعهٔ scope کش‌شده را که همراه device token paired ذخیره شده دوباره استفاده می‌کند. فراخواننده‌های دارای `deviceToken` صریح / `scopes` صریح در عوض مجموعهٔ scope درخواستی خودشان را نگه می‌دارند.
    - خارج از آن مسیر retry، اولویت auth در connect ابتدا shared token/password صریح است، سپس `deviceToken` صریح، سپس stored device token، سپس bootstrap token.
    - در مسیر async مربوط به Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, ip}` پیش از ثبت failure توسط limiter سریالی می‌شوند. بنابراین دو retry هم‌زمان بد از همان client می‌توانند باعث شوند تلاش دوم به‌جای دو mismatch ساده، `retry later` نشان دهد.
    - `too many failed authentication attempts (retry later)` از یک client مرورگر-origin loopback → شکست‌های تکراری از همان `Origin` نرمال‌شده موقتاً lock out می‌شوند؛ یک origin localhost دیگر از bucket جداگانه استفاده می‌کند.
    - تکرار `unauthorized` پس از آن retry → drift در shared token/device token؛ پیکربندی token را refresh کنید و در صورت نیاز device token را دوباره تأیید/rotate کنید.
    - `gateway connect failed:` → هدف host/port/url اشتباه است.

  </Accordion>
</AccordionGroup>

### نقشهٔ سریع کدهای جزئیات auth

از `error.details.code` در پاسخ ناموفق `connect` استفاده کنید تا اقدام بعدی را انتخاب کنید:

| کد جزئیات                  | معنی                                                                                                                                                                                      | اقدام پیشنهادی                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | کلاینت توکن مشترک الزامی را ارسال نکرده است.                                                                                                                                                 | توکن را در کلاینت جای‌گذاری/تنظیم کنید و دوباره تلاش کنید. برای مسیرهای داشبورد: `openclaw config get gateway.auth.token` سپس آن را در تنظیمات Control UI جای‌گذاری کنید.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | توکن مشترک با توکن احراز هویت Gateway مطابقت نداشت.                                                                                                                                               | اگر `canRetryWithDeviceToken=true` است، اجازه یک تلاش دوباره مورد اعتماد را بدهید. تلاش‌های دوباره با توکن کش‌شده از scopeهای تأییدشده ذخیره‌شده دوباره استفاده می‌کنند؛ فراخوان‌های صریح `deviceToken` / `scopes` همان scopeهای درخواستی را نگه می‌دارند. اگر همچنان شکست می‌خورد، [چک‌لیست بازیابی انحراف توکن](/fa/cli/devices#token-drift-recovery-checklist) را اجرا کنید. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | توکن کش‌شده هر دستگاه منسوخ یا لغو شده است.                                                                                                                                                 | توکن دستگاه را با استفاده از [CLI دستگاه‌ها](/fa/cli/devices) بچرخانید/دوباره تأیید کنید، سپس دوباره وصل شوید.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | هویت دستگاه نیاز به تأیید دارد. `error.details.reason` را برای `not-paired`، `scope-upgrade`، `role-upgrade` یا `metadata-upgrade` بررسی کنید و در صورت وجود از `requestId` / `remediationHint` استفاده کنید. | درخواست در انتظار را تأیید کنید: `openclaw devices list` سپس `openclaw devices approve <requestId>`. ارتقاهای scope/نقش پس از بررسی دسترسی درخواستی از همان جریان استفاده می‌کنند.                                                                                                               |

<Note>
RPCهای مستقیم backend از طریق loopback که با توکن/گذرواژه مشترک Gateway احراز هویت شده‌اند، نباید به مبنای scope دستگاه جفت‌شده CLI وابسته باشند. اگر subagentها یا فراخوان‌های داخلی دیگر همچنان با `scope-upgrade` شکست می‌خورند، بررسی کنید که فراخواننده از `client.id: "gateway-client"` و `client.mode: "backend"` استفاده می‌کند و `deviceIdentity` صریح یا توکن دستگاه را تحمیل نمی‌کند.
</Note>

بررسی مهاجرت احراز هویت دستگاه v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

اگر لاگ‌ها خطاهای nonce/signature را نشان می‌دهند، کلاینت متصل‌شونده را به‌روزرسانی و آن را بررسی کنید:

<Steps>
  <Step title="منتظر connect.challenge بمانید">
    کلاینت منتظر `connect.challenge` صادرشده توسط Gateway می‌ماند.
  </Step>
  <Step title="payload را امضا کنید">
    کلاینت payload مقید به challenge را امضا می‌کند.
  </Step>
  <Step title="nonce دستگاه را ارسال کنید">
    کلاینت `connect.params.device.nonce` را با همان nonce مربوط به challenge ارسال می‌کند.
  </Step>
</Steps>

اگر `openclaw devices rotate` / `revoke` / `remove` به‌طور غیرمنتظره رد شد:

- نشست‌های توکن دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را مدیریت کنند، مگر اینکه فراخواننده `operator.admin` را نیز داشته باشد
- `openclaw devices rotate --scope ...` فقط می‌تواند scopeهای operator را درخواست کند که نشست فراخواننده از قبل در اختیار دارد

مرتبط:

- [پیکربندی](/fa/gateway/configuration) (حالت‌های احراز هویت Gateway)
- [Control UI](/fa/web/control-ui)
- [دستگاه‌ها](/fa/cli/devices)
- [دسترسی راه‌دور](/fa/gateway/remote)
- [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)

## سرویس Gateway اجرا نیست

وقتی سرویس نصب شده اما فرایند پایدار نمی‌ماند، از این استفاده کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

به‌دنبال این موارد بگردید:

- `Runtime: stopped` همراه با راهنمای exit.
- عدم تطابق پیکربندی سرویس (`Config (cli)` در برابر `Config (service)`).
- تداخل‌های پورت/listener.
- نصب‌های اضافی launchd/systemd/schtasks وقتی از `--deep` استفاده می‌شود.
- راهنمای پاک‌سازی `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `Gateway start blocked: set gateway.mode=local` یا `existing config is missing gateway.mode` → حالت Gateway محلی فعال نیست، یا فایل پیکربندی بازنویسی شده و `gateway.mode` را از دست داده است. رفع: `gateway.mode="local"` را در پیکربندی خود تنظیم کنید، یا `openclaw onboard --mode local` / `openclaw setup` را دوباره اجرا کنید تا پیکربندی مورد انتظار حالت محلی دوباره ثبت شود. اگر OpenClaw را از طریق Podman اجرا می‌کنید، مسیر پیش‌فرض پیکربندی `~/.openclaw/openclaw.json` است.
    - `refusing to bind gateway ... without auth` → bind غیر loopback بدون مسیر احراز هویت معتبر Gateway (توکن/گذرواژه، یا trusted-proxy در جایی که پیکربندی شده است).
    - `another gateway instance is already listening` / `EADDRINUSE` → تداخل پورت.
    - `Other gateway-like services detected (best effort)` → واحدهای قدیمی یا موازی launchd/systemd/schtasks وجود دارند. بیشتر راه‌اندازی‌ها باید برای هر ماشین یک Gateway نگه دارند؛ اگر واقعاً به بیش از یکی نیاز دارید، پورت‌ها + پیکربندی/وضعیت/workspace را ایزوله کنید. [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.
    - `System-level OpenClaw gateway service detected` از doctor → یک واحد systemd سیستمی وجود دارد در حالی که سرویس سطح کاربر وجود ندارد. پیش از اجازه دادن به doctor برای نصب سرویس کاربر، مورد تکراری را حذف یا غیرفعال کنید، یا اگر واحد سیستمی supervisor مورد نظر است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.
    - `Gateway service port does not match current gateway config` → supervisor نصب‌شده همچنان `--port` قدیمی را ثابت نگه داشته است. `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید، سپس سرویس Gateway را بازراه‌اندازی کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [Doctor](/fa/gateway/doctor)

## Gateway پیکربندی نامعتبر را رد کرد

وقتی راه‌اندازی Gateway با `Invalid config` شکست می‌خورد یا لاگ‌های بارگذاری مجدد داغ می‌گویند
که یک ویرایش نامعتبر را رد کرده است، از این استفاده کنید.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

به‌دنبال این موارد بگردید:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- فایل زمان‌دار `openclaw.json.rejected.*` کنار پیکربندی فعال
- فایل زمان‌دار `openclaw.json.clobbered.*` اگر `doctor --fix` یک ویرایش مستقیم خراب را تعمیر کرده باشد

<AccordionGroup>
  <Accordion title="چه اتفاقی افتاد">
    - پیکربندی هنگام راه‌اندازی، بارگذاری مجدد داغ، یا نوشتن متعلق به OpenClaw اعتبارسنجی نشد.
    - راه‌اندازی Gateway به‌جای بازنویسی `openclaw.json` به‌صورت بسته شکست می‌خورد.
    - بارگذاری مجدد داغ ویرایش‌های خارجی نامعتبر را رد می‌کند و پیکربندی runtime فعلی را فعال نگه می‌دارد.
    - نوشتن‌های متعلق به OpenClaw پیش از commit، payloadهای نامعتبر/مخرب را رد می‌کنند و `.rejected.*` را ذخیره می‌کنند.
    - `openclaw doctor --fix` مالک تعمیر است. می‌تواند پیشوندهای غیر JSON را حذف کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند، در حالی که payload ردشده را به‌صورت `.clobbered.*` حفظ می‌کند.

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
    - `.clobbered.*` وجود دارد → doctor یک ویرایش خارجی خراب را هنگام تعمیر پیکربندی فعال حفظ کرده است.
    - `.rejected.*` وجود دارد → یک نوشتن پیکربندی متعلق به OpenClaw پیش از commit در بررسی‌های schema یا clobber شکست خورده است.
    - `Config write rejected:` → نوشتن تلاش کرده شکل مورد نیاز را حذف کند، اندازه فایل را به‌طور شدید کاهش دهد، یا پیکربندی نامعتبر را پایدار کند.
    - `config reload skipped (invalid config):` → یک ویرایش مستقیم در اعتبارسنجی شکست خورد و توسط Gateway در حال اجرا نادیده گرفته شد.
    - `Invalid config at ...` → راه‌اندازی پیش از بالا آمدن سرویس‌های Gateway شکست خورد.
    - `missing-meta-vs-last-good`، `gateway-mode-missing-vs-last-good`، یا `size-drop-vs-last-good:*` → یک نوشتن متعلق به OpenClaw رد شد چون در مقایسه با نسخه پشتیبان آخرین نسخه سالم شناخته‌شده، فیلدها یا اندازه را از دست داده بود.
    - `Config last-known-good promotion skipped` → کاندیدا شامل جای‌نگهدارهای محرمانه ردکت‌شده مانند `***` بود.

  </Accordion>
  <Accordion title="گزینه‌های رفع">
    1. `openclaw doctor --fix` را اجرا کنید تا doctor پیکربندی دارای پیشوند/خراب‌شده را تعمیر کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند.
    2. فقط کلیدهای مورد نظر را از `.clobbered.*` یا `.rejected.*` کپی کنید، سپس آن‌ها را با `openclaw config set` یا `config.patch` اعمال کنید.
    3. پیش از بازراه‌اندازی، `openclaw config validate` را اجرا کنید.
    4. اگر دستی ویرایش می‌کنید، پیکربندی کامل JSON5 را نگه دارید، نه فقط آبجکت جزئی‌ای که می‌خواستید تغییر دهید.
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

به‌دنبال این موارد بگردید:

- `warnings[].code` و `primaryTargetId` در خروجی JSON.
- اینکه هشدار درباره fallback SSH، چند Gateway، scopeهای گمشده، یا auth refهای حل‌نشده است.

امضاهای رایج:

- `SSH tunnel failed to start; falling back to direct probes.` → راه‌اندازی SSH شکست خورد، اما فرمان همچنان هدف‌های مستقیم پیکربندی‌شده/loopback را امتحان کرد.
- `multiple reachable gateways detected` → بیش از یک هدف پاسخ داد. معمولاً این یعنی یک راه‌اندازی چند-Gateway عمدی یا listenerهای قدیمی/تکراری.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → اتصال کار کرد، اما RPC جزئیات به‌دلیل scope محدود شده است؛ هویت دستگاه را جفت کنید یا از اعتبارنامه‌هایی با `operator.read` استفاده کنید.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → اتصال کار کرد، اما مجموعه کامل RPCهای تشخیصی timeout شد یا شکست خورد. این را به‌عنوان Gateway قابل دسترس با تشخیص‌های تنزل‌یافته در نظر بگیرید؛ `connect.ok` و `connect.rpcOk` را در خروجی `--json` مقایسه کنید.
- `Capability: pairing-pending` یا `gateway closed (1008): pairing required` → Gateway پاسخ داد، اما این کلاینت هنوز پیش از دسترسی عادی operator به جفت‌سازی/تأیید نیاز دارد.
- متن هشدار SecretRef حل‌نشده `gateway.auth.*` / `gateway.remote.*` → داده احراز هویت در این مسیر فرمان برای هدف شکست‌خورده در دسترس نبود.

مرتبط:

- [Gateway](/fa/cli/gateway)
- [چند Gateway روی یک میزبان](/fa/gateway#multiple-gateways-same-host)
- [دسترسی راه‌دور](/fa/gateway/remote)

## کانال وصل است، پیام‌ها جریان ندارند

اگر وضعیت کانال وصل است اما جریان پیام از کار افتاده، روی policy، مجوزها، و قواعد تحویل خاص کانال تمرکز کنید.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

به‌دنبال این موارد بگردید:

- سیاست DM (`pairing`، `allowlist`، `open`، `disabled`).
- فهرست مجاز گروه و الزامات منشن.
- مجوزها/دامنه‌های دسترسی API کانال که موجود نیستند.

امضاهای رایج:

- `mention required` ← پیام به‌دلیل سیاست منشن گروه نادیده گرفته شد.
- `pairing` / ردپاهای تأیید در انتظار ← فرستنده تأیید نشده است.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` ← مشکل احراز هویت/مجوزهای کانال.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [Discord](/fa/channels/discord)
- [Telegram](/fa/channels/telegram)
- [WhatsApp](/fa/channels/whatsapp)

## تحویل Cron و Heartbeat

اگر cron یا heartbeat اجرا نشد یا تحویل داده نشد، ابتدا وضعیت زمان‌بند را بررسی کنید، سپس مقصد تحویل را.

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
- دلایل رد شدن Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `cron: scheduler disabled; jobs will not run automatically` ← cron غیرفعال است.
    - `cron: timer tick failed` ← tick زمان‌بند شکست خورد؛ خطاهای فایل/لاگ/زمان اجرا را بررسی کنید.
    - `heartbeat skipped` با `reason=quiet-hours` ← خارج از بازه ساعت‌های فعال.
    - `heartbeat skipped` با `reason=empty-heartbeat-file` ← `HEARTBEAT.md` وجود دارد اما فقط شامل خط‌های خالی / سرصفحه‌های markdown است، بنابراین OpenClaw فراخوانی مدل را رد می‌کند.
    - `heartbeat skipped` با `reason=no-tasks-due` ← `HEARTBEAT.md` شامل یک بلوک `tasks:` است، اما هیچ‌کدام از taskها در این tick موعد ندارند.
    - `heartbeat: unknown accountId` ← شناسه حساب برای مقصد تحویل heartbeat نامعتبر است.
    - `heartbeat skipped` با `reason=dm-blocked` ← مقصد heartbeat به یک مقصد سبک DM حل شده، در حالی که `agents.defaults.heartbeat.directPolicy` (یا بازنویسی هر agent) روی `block` تنظیم شده است.

  </Accordion>
</AccordionGroup>

مرتبط:

- [Heartbeat](/fa/gateway/heartbeat)
- [taskهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
- [taskهای زمان‌بندی‌شده: عیب‌یابی](/fa/automation/cron-jobs#troubleshooting)

## Node جفت شده، ابزار شکست می‌خورد

اگر یک node جفت شده اما ابزارها شکست می‌خورند، وضعیت foreground، مجوز، و تأیید را جداگانه بررسی کنید.

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
- تأییدهای exec و وضعیت فهرست مجاز.

امضاهای رایج:

- `NODE_BACKGROUND_UNAVAILABLE` ← برنامه node باید در foreground باشد.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` ← مجوز سیستم‌عامل موجود نیست.
- `SYSTEM_RUN_DENIED: approval required` ← تأیید exec در انتظار است.
- `SYSTEM_RUN_DENIED: allowlist miss` ← فرمان توسط فهرست مجاز مسدود شده است.

مرتبط:

- [تأییدهای exec](/fa/tools/exec-approvals)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
- [Nodes](/fa/nodes/index)

## ابزار مرورگر شکست می‌خورد

وقتی actionهای ابزار مرورگر شکست می‌خورند، با اینکه خود Gateway سالم است، از این بخش استفاده کنید.

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
- در دسترس بودن Chrome محلی برای پروفایل‌های `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="امضاهای Plugin / فایل اجرایی">
    - `unknown command "browser"` یا `unknown command 'browser'` ← Plugin مرورگر همراه، توسط `plugins.allow` کنار گذاشته شده است.
    - ابزار مرورگر موجود نیست / در دسترس نیست در حالی که `browser.enabled=true` ← `plugins.allow` شامل `browser` نیست، بنابراین Plugin هرگز بارگذاری نشده است.
    - `Failed to start Chrome CDP on port` ← پردازش مرورگر راه‌اندازی نشد.
    - `browser.executablePath not found` ← مسیر پیکربندی‌شده نامعتبر است.
    - `browser.cdpUrl must be http(s) or ws(s)` ← URL پیکربندی‌شده CDP از scheme پشتیبانی‌نشده‌ای مثل `file:` یا `ftp:` استفاده می‌کند.
    - `browser.cdpUrl has invalid port` ← URL پیکربندی‌شده CDP پورت بد یا خارج از محدوده دارد.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` ← نصب فعلی Gateway وابستگی زمان اجرای اصلی مرورگر را ندارد؛ OpenClaw را دوباره نصب یا به‌روزرسانی کنید، سپس Gateway را restart کنید. snapshotهای ARIA و screenshotهای پایه صفحه هنوز می‌توانند کار کنند، اما پیمایش، snapshotهای AI، screenshotهای عنصر با selector CSS، و export PDF همچنان در دسترس نیستند.

  </Accordion>
  <Accordion title="امضاهای Chrome MCP / نشست موجود">
    - `Could not find DevToolsActivePort for chrome` ← نشست موجود Chrome MCP هنوز نتوانست به data dir مرورگر انتخاب‌شده attach شود. صفحه inspect مرورگر را باز کنید، remote debugging را فعال کنید، مرورگر را باز نگه دارید، prompt اولین attach را تأیید کنید، سپس دوباره تلاش کنید. اگر وضعیت signed-in لازم نیست، پروفایل مدیریت‌شده `openclaw` را ترجیح دهید.
    - `No Chrome tabs found for profile="user"` ← پروفایل attach در Chrome MCP هیچ tab باز Chrome محلی ندارد.
    - `Remote CDP for profile "<name>" is not reachable` ← endpoint راه‌دور CDP پیکربندی‌شده از میزبان Gateway قابل دسترسی نیست.
    - `Browser attachOnly is enabled ... not reachable` یا `Browser attachOnly is enabled and CDP websocket ... is not reachable` ← پروفایل attach-only هیچ target قابل دسترسی ندارد، یا endpoint HTTP پاسخ داده اما CDP WebSocket هنوز باز نشده است.

  </Accordion>
  <Accordion title="امضاهای عنصر / screenshot / بارگذاری">
    - `fullPage is not supported for element screenshots` ← درخواست screenshot، `--full-page` را با `--ref` یا `--element` ترکیب کرده است.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` ← فراخوانی‌های screenshot در Chrome MCP / `existing-session` باید از capture صفحه یا یک `--ref` مربوط به snapshot استفاده کنند، نه `--element` از CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` ← hookهای upload در Chrome MCP به refهای snapshot نیاز دارند، نه selectorهای CSS.
    - `existing-session file uploads currently support one file at a time.` ← در پروفایل‌های Chrome MCP برای هر فراخوانی یک upload ارسال کنید.
    - `existing-session dialog handling does not support timeoutMs.` ← hookهای dialog در پروفایل‌های Chrome MCP از بازنویسی timeout پشتیبانی نمی‌کنند.
    - `existing-session type does not support timeoutMs overrides.` ← برای `act:type` روی `profile="user"` / پروفایل‌های existing-session در Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از یک پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `existing-session evaluate does not support timeoutMs overrides.` ← برای `act:evaluate` روی `profile="user"` / پروفایل‌های existing-session در Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از یک پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `response body is not supported for existing-session profiles yet.` ← `responsebody` هنوز به مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارد.
    - بازنویسی‌های viewport / dark-mode / locale / offline مانده روی پروفایل‌های attach-only یا remote CDP ← برای بستن نشست کنترل فعال و آزاد کردن وضعیت emulation در Playwright/CDP بدون restart کردن کل Gateway، `openclaw browser stop --browser-profile <name>` را اجرا کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [مرورگر (مدیریت‌شده توسط OpenClaw)](/fa/tools/browser)
- [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting)

## اگر upgrade کردید و چیزی ناگهان خراب شد

بیشتر خرابی‌های پس از upgrade ناشی از drift پیکربندی یا enforce شدن defaultهای سخت‌گیرانه‌تر است.

<AccordionGroup>
  <Accordion title="1. رفتار بازنویسی احراز هویت و URL تغییر کرده است">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    چه چیزی را بررسی کنید:

    - اگر `gateway.mode=remote` باشد، فراخوانی‌های CLI ممکن است راه‌دور را هدف بگیرند، در حالی که سرویس محلی شما مشکلی ندارد.
    - فراخوانی‌های صریح `--url` به credentials ذخیره‌شده fallback نمی‌کنند.

    امضاهای رایج:

    - `gateway connect failed:` ← target URL اشتباه است.
    - `unauthorized` ← endpoint قابل دسترسی است، اما احراز هویت اشتباه است.

  </Accordion>
  <Accordion title="2. guardrailهای bind و احراز هویت سخت‌گیرانه‌تر هستند">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    چه چیزی را بررسی کنید:

    - bindهای غیر loopback (`lan`، `tailnet`، `custom`) به یک مسیر احراز هویت معتبر Gateway نیاز دارند: احراز هویت با token/password مشترک، یا یک استقرار `trusted-proxy` غیر loopback که درست پیکربندی شده باشد.
    - کلیدهای قدیمی مثل `gateway.token` جایگزین `gateway.auth.token` نمی‌شوند.

    امضاهای رایج:

    - `refusing to bind gateway ... without auth` ← bind غیر loopback بدون مسیر احراز هویت معتبر Gateway.
    - `Connectivity probe: failed` در حالی که زمان اجرا فعال است ← Gateway زنده است اما با احراز هویت/URL فعلی قابل دسترسی نیست.

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
    - تأییدهای در انتظار جفت‌سازی DM پس از تغییرات سیاست یا هویت.

    امضاهای رایج:

    - `device identity required` ← احراز هویت دستگاه برآورده نشده است.
    - `pairing required` ← فرستنده/دستگاه باید تأیید شود.

  </Accordion>
</AccordionGroup>

اگر پیکربندی سرویس و زمان اجرا پس از بررسی‌ها هنوز با هم ناسازگارند، metadata سرویس را از همان دایرکتوری profile/state دوباره نصب کنید:

```bash
openclaw gateway install --force
openclaw gateway restart
```

مرتبط:

- [احراز هویت](/fa/gateway/authentication)
- [exec پس‌زمینه و ابزار پردازش](/fa/gateway/background-process)
- [جفت‌سازی تحت مالکیت Gateway](/fa/gateway/pairing)

## مرتبط

- [Doctor](/fa/gateway/doctor)
- [FAQ](/fa/help/faq)
- [runbook Gateway](/fa/gateway)
