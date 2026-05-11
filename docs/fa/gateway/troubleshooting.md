---
read_when:
    - مرکز عیب‌یابی برای تشخیص عمیق‌تر شما را به اینجا ارجاع داده است
    - به بخش‌های پایدارِ راهنمای عملیاتی مبتنی بر نشانه‌ها با فرمان‌های دقیق نیاز دارید
sidebarTitle: Troubleshooting
summary: راهنمای عملیاتی عیب‌یابی عمیق برای Gateway، کانال‌ها، خودکارسازی، گره‌ها و مرورگر
title: عیب‌یابی
x-i18n:
    generated_at: "2026-05-11T20:35:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

این صفحه runbook عمیق است. اگر ابتدا جریان triage سریع را می‌خواهید، از [/help/troubleshooting](/fa/help/troubleshooting) شروع کنید.

## نردبان دستور

ابتدا این‌ها را به همین ترتیب اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

نشانه‌های سالم مورد انتظار:

- `openclaw gateway status` عبارت‌های `Runtime: running`، `Connectivity probe: ok` و یک خط `Capability: ...` را نشان می‌دهد.
- `openclaw doctor` هیچ مشکل مسدودکننده‌ای در config/service گزارش نمی‌کند.
- `openclaw channels status --probe` وضعیت زندهٔ transport را برای هر حساب نشان می‌دهد و، در موارد پشتیبانی‌شده، نتایج probe/audit مانند `works` یا `audit ok` را نمایش می‌دهد.

## نصب‌های split brain و محافظ config جدیدتر

وقتی Gateway service پس از به‌روزرسانی به‌طور غیرمنتظره متوقف می‌شود، یا logها نشان می‌دهند که یک باینری `openclaw` قدیمی‌تر از نسخه‌ای است که آخرین بار `openclaw.json` را نوشته، از این بخش استفاده کنید.

OpenClaw نوشتن config را با `meta.lastTouchedVersion` مهر می‌کند. دستورهای فقط‌خواندنی همچنان می‌توانند config نوشته‌شده توسط OpenClaw جدیدتر را بررسی کنند، اما mutationهای process و service از ادامه با باینری قدیمی‌تر خودداری می‌کنند. اقدام‌های مسدودشده شامل start، stop، restart، uninstall برای gateway service، reinstall اجباری service، startup Gateway در service-mode، و پاک‌سازی پورت با `gateway --force` هستند.

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
    Gateway service مورد نظر را از نصب جدیدتر دوباره نصب کنید:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    بستهٔ سیستمی منسوخ یا wrapper entryهای قدیمی را که هنوز به باینری قدیمی `openclaw` اشاره می‌کنند حذف کنید.
  </Step>
</Steps>

<Warning>
فقط برای downgrade عمدی یا بازیابی اضطراری، `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` را برای همان یک دستور تنظیم کنید. برای عملیات عادی آن را unset بگذارید.
</Warning>

## symlink مهارت به‌دلیل خروج از مسیر رد شد

وقتی logها شامل این مورد هستند از این بخش استفاده کنید:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw هر ریشهٔ مهارت را به‌عنوان مرز containment در نظر می‌گیرد. یک symlink زیر
`~/.agents/skills`، `<workspace>/.agents/skills`، `<workspace>/skills` یا
`~/.openclaw/skills` وقتی رد می‌شود که هدف واقعی آن بیرون از آن root resolve شود،
مگر اینکه هدف به‌صراحت trusted باشد.

لینک را بررسی کنید:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

اگر هدف عمدی است، هم ریشهٔ مستقیم مهارت و هم هدف symlink مجاز را پیکربندی کنید:

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

سپس یک session جدید شروع کنید یا منتظر بمانید watcher مربوط به Skills refresh شود. اگر process در حال اجرا قبل از تغییر config شروع شده است، Gateway را restart کنید.

از هدف‌های گسترده مانند `~`، `/` یا کل یک پوشهٔ پروژهٔ sync‌شده استفاده نکنید.
`allowSymlinkTargets` را به ریشهٔ واقعی مهارت که شامل دایرکتوری‌های trusted
`SKILL.md` است محدود نگه دارید.

مرتبط:

- [config مربوط به Skills](/fa/tools/skills-config#symlinked-sibling-repos)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 برای context طولانی به استفادهٔ اضافی نیاز دارد

وقتی logها/errorها شامل این مورد هستند استفاده کنید: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

دنبال این موارد بگردید:

- مدل انتخاب‌شدهٔ Anthropic Opus/Sonnet دارای `params.context1m: true` است.
- credential فعلی Anthropic واجد شرایط استفاده از long-context نیست.
- درخواست‌ها فقط در sessionها/model runهای طولانی که به مسیر beta یک‌میلیونی نیاز دارند fail می‌شوند.

گزینه‌های رفع مشکل:

<Steps>
  <Step title="Disable context1m">
    `context1m` را برای آن مدل غیرفعال کنید تا به پنجرهٔ context عادی برگردد.
  </Step>
  <Step title="Use an eligible credential">
    از credential متعلق به Anthropic که واجد شرایط درخواست‌های long-context است استفاده کنید، یا به Anthropic API key تغییر دهید.
  </Step>
  <Step title="Configure fallback models">
    fallback modelها را پیکربندی کنید تا وقتی درخواست‌های long-context Anthropic رد می‌شوند، runها ادامه پیدا کنند.
  </Step>
</Steps>

مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف token و هزینه‌ها](/fa/reference/token-use)
- [چرا HTTP 429 از Anthropic می‌بینم؟](/fa/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## بک‌اند محلی سازگار با OpenAI probeهای مستقیم را پاس می‌کند اما اجرای agentها fail می‌شود

وقتی این شرایط وجود دارد استفاده کنید:

- `curl ... /v1/models` کار می‌کند
- فراخوانی‌های کوچک مستقیم `/v1/chat/completions` کار می‌کنند
- اجرای مدل OpenClaw فقط در turnهای عادی agent fail می‌شود

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

دنبال این موارد بگردید:

- فراخوانی‌های کوچک مستقیم موفق می‌شوند، اما runهای OpenClaw فقط روی promptهای بزرگ‌تر fail می‌شوند
- خطاهای `model_not_found` یا 404 با اینکه `/v1/chat/completions` مستقیم
  با همان bare model id کار می‌کند
- خطاهای backend دربارهٔ اینکه `messages[].content` انتظار string دارد
- هشدارهای متناوب `incomplete turn detected ... stopReason=stop payloads=0` با یک backend محلی سازگار با OpenAI
- crashهای backend که فقط با شمار tokenهای prompt بزرگ‌تر یا promptهای کامل runtime agent ظاهر می‌شوند

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` با یک server محلی سبک MLX/vLLM → بررسی کنید `baseUrl` شامل `/v1` باشد، برای backendهای `/v1/chat/completions` مقدار `api` برابر `"openai-completions"` باشد، و `models.providers.<provider>.models[].id` همان id محلی bare provider باشد. آن را یک‌بار با prefix provider انتخاب کنید، برای مثال `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ catalog entry را به‌شکل `mlx-community/Qwen3-30B-A3B-6bit` نگه دارید.
    - `messages[...].content: invalid type: sequence, expected a string` → backend بخش‌های محتوای structured Chat Completions را رد می‌کند. رفع مشکل: `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
    - `validation.keys` یا message keyهای مجاز مثل `["role","content"]` → backend metadata بازپخش سبک OpenAI را روی پیام‌های Chat Completions رد می‌کند. رفع مشکل: `models.providers.<provider>.models[].compat.strictMessageKeys: true` را تنظیم کنید.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend درخواست Chat Completions را کامل کرده اما برای آن turn هیچ متن assistant قابل‌مشاهده برای کاربر برنگردانده است. OpenClaw turnهای خالی سازگار با OpenAI را که replay-safe هستند یک‌بار retry می‌کند؛ failureهای پایدار معمولاً یعنی backend محتوای خالی/غیرمتنی منتشر می‌کند یا متن final-answer را suppress می‌کند.
    - درخواست‌های کوچک مستقیم موفق می‌شوند، اما runهای agent در OpenClaw با crashهای backend/model fail می‌شوند (برای مثال Gemma روی بعضی buildهای `inferrs`) → transport در OpenClaw احتمالاً از قبل درست است؛ backend روی شکل prompt بزرگ‌تر runtime agent fail می‌شود.
    - failureها پس از غیرفعال‌کردن toolها کمتر می‌شوند اما از بین نمی‌روند → schemaهای tool بخشی از فشار بودند، اما مشکل باقی‌مانده همچنان ظرفیت upstream model/server یا یک bug در backend است.

  </Accordion>
  <Accordion title="Fix options">
    1. برای backendهای Chat Completions فقط-string، `compat.requiresStringContent: true` را تنظیم کنید.
    2. برای backendهای سخت‌گیر Chat Completions که فقط `role` و `content` را روی هر message می‌پذیرند، `compat.strictMessageKeys: true` را تنظیم کنید.
    3. برای model/backendهایی که نمی‌توانند سطح tool schema در OpenClaw را قابل‌اعتماد handle کنند، `compat.supportsTools: false` را تنظیم کنید.
    4. تا جای ممکن فشار prompt را کم کنید: workspace bootstrap کوچک‌تر، تاریخچهٔ session کوتاه‌تر، مدل محلی سبک‌تر، یا backendی با پشتیبانی long-context قوی‌تر.
    5. اگر درخواست‌های کوچک مستقیم همچنان pass می‌شوند اما turnهای agent در OpenClaw هنوز داخل backend crash می‌کنند، آن را محدودیت upstream server/model در نظر بگیرید و با شکل payload پذیرفته‌شده آنجا یک repro ثبت کنید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/gateway/configuration)
- [مدل‌های محلی](/fa/gateway/local-models)
- [endpointهای سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)

## بدون پاسخ

اگر channelها فعال‌اند اما چیزی پاسخ نمی‌دهد، قبل از reconnect کردن هر چیزی routing و policy را بررسی کنید.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

دنبال این موارد بگردید:

- Pairing برای فرستنده‌های DM در حالت pending است.
- gating مربوط به mention در گروه (`requireMention`، `mentionPatterns`).
- ناهماهنگی‌های allowlist برای channel/group.

امضاهای رایج:

- `drop guild message (mention required` → پیام گروه تا زمان mention نادیده گرفته می‌شود.
- `pairing request` → فرستنده به approval نیاز دارد.
- `blocked` / `allowlist` → فرستنده/channel توسط policy فیلتر شده است.

مرتبط:

- [عیب‌یابی Channel](/fa/channels/troubleshooting)
- [گروه‌ها](/fa/channels/groups)
- [Pairing](/fa/channels/pairing)

## اتصال‌پذیری UI کنترل داشبورد

وقتی UI داشبورد/کنترل وصل نمی‌شود، URL، auth mode و فرض‌های secure context را اعتبارسنجی کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

دنبال این موارد بگردید:

- URL درست برای probe و URL درست برای dashboard.
- ناهماهنگی auth mode/token بین client و Gateway.
- استفاده از HTTP در جایی که device identity لازم است.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → context غیرامن یا device auth مفقود.
    - `origin not allowed` → `Origin` مرورگر در `gateway.controlUi.allowedOrigins` نیست (یا از یک browser origin غیر-loopback بدون allowlist صریح وصل می‌شوید).
    - `device nonce required` / `device nonce mismatch` → client جریان device auth مبتنی بر challenge را کامل نمی‌کند (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client payload اشتباه (یا timestamp قدیمی) را برای handshake فعلی sign کرده است.
    - `AUTH_TOKEN_MISMATCH` با `canRetryWithDeviceToken=true` → client می‌تواند با device token ذخیره‌شده یک retry trusted انجام دهد.
    - آن retry با cached-token از scope set ذخیره‌شده همراه با paired device token استفاده می‌کند. callerهای دارای `deviceToken` صریح / `scopes` صریح، scope set درخواستی خود را نگه می‌دارند.
    - `AUTH_SCOPE_MISMATCH` → device token شناخته شد، اما scopeهای approve‌شدهٔ آن این درخواست connect را پوشش نمی‌دهند؛ به‌جای rotate کردن shared gateway token، دوباره pair کنید یا قرارداد scope درخواستی را approve کنید.
    - خارج از آن مسیر retry، precedence احراز هویت connect ابتدا shared token/password صریح است، سپس `deviceToken` صریح، سپس device token ذخیره‌شده، سپس bootstrap token.
    - در مسیر async Tailscale Serve Control UI، تلاش‌های fail‌شده برای همان `{scope, ip}` پیش از اینکه limiter failure را ثبت کند serialized می‌شوند. بنابراین دو retry بد هم‌زمان از همان client می‌توانند در تلاش دوم به‌جای دو mismatch ساده، `retry later` نشان دهند.
    - `too many failed authentication attempts (retry later)` از یک client مرورگر-origin روی loopback → failureهای تکراری از همان `Origin` نرمال‌شده موقتاً lock out می‌شوند؛ یک localhost origin دیگر از bucket جداگانه استفاده می‌کند.
    - تکرار `unauthorized` پس از آن retry → shared token/device token drift؛ config مربوط به token را refresh کنید و در صورت نیاز device token را دوباره approve/rotate کنید.
    - `gateway connect failed:` → host/port/url target اشتباه.

  </Accordion>
</AccordionGroup>

### نقشهٔ سریع کدهای جزئیات auth

از `error.details.code` در پاسخ `connect` ناموفق برای انتخاب اقدام بعدی استفاده کنید:

| کد جزئیات                  | معنی                                                                                                                                                                                      | اقدام پیشنهادی                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | کلاینت توکن مشترک الزامی را ارسال نکرد.                                                                                                                                                 | توکن را در کلاینت وارد/تنظیم کنید و دوباره تلاش کنید. برای مسیرهای داشبورد: `openclaw config get gateway.auth.token` سپس آن را در تنظیمات رابط کاربری کنترل وارد کنید.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | توکن مشترک با توکن احراز هویت Gateway مطابقت نداشت.                                                                                                                                               | اگر `canRetryWithDeviceToken=true` است، اجازه یک تلاش دوباره قابل‌اعتماد را بدهید. تلاش‌های دوباره با توکن کش‌شده از scopeهای تأییدشده ذخیره‌شده استفاده می‌کنند؛ فراخوان‌های صریح `deviceToken` / `scopes` scopeهای درخواستی را نگه می‌دارند. اگر همچنان ناموفق بود، [چک‌لیست بازیابی انحراف توکن](/fa/cli/devices#token-drift-recovery-checklist) را اجرا کنید. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | توکن کش‌شده هر دستگاه قدیمی یا لغوشده است.                                                                                                                                                 | با استفاده از [CLI دستگاه‌ها](/fa/cli/devices)، توکن دستگاه را چرخش دهید/دوباره تأیید کنید، سپس دوباره متصل شوید.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | توکن دستگاه معتبر است، اما نقش/scopeهای تأییدشده آن این درخواست اتصال را پوشش نمی‌دهد.                                                                                                       | دستگاه را دوباره جفت کنید یا قرارداد scope درخواستی را تأیید کنید؛ این را به‌عنوان انحراف توکن مشترک تلقی نکنید.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | هویت دستگاه به تأیید نیاز دارد. `error.details.reason` را برای `not-paired`، `scope-upgrade`، `role-upgrade`، یا `metadata-upgrade` بررسی کنید و در صورت وجود از `requestId` / `remediationHint` استفاده کنید. | درخواست در انتظار را تأیید کنید: `openclaw devices list` سپس `openclaw devices approve <requestId>`. ارتقاهای scope/نقش پس از بررسی دسترسی درخواستی از همین جریان استفاده می‌کنند.                                                                                                               |

<Note>
RPCهای backend مستقیم loopback که با توکن/گذرواژه مشترک Gateway احراز هویت می‌شوند نباید به مبنای scope دستگاه‌های جفت‌شده CLI وابسته باشند. اگر subagentها یا دیگر فراخوان‌های داخلی همچنان با `scope-upgrade` شکست می‌خورند، بررسی کنید که فراخوان از `client.id: "gateway-client"` و `client.mode: "backend"` استفاده می‌کند و `deviceIdentity` صریح یا توکن دستگاه را اجبار نمی‌کند.
</Note>

بررسی مهاجرت احراز هویت دستگاه نسخه ۲:

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
    کلاینت payload وابسته به challenge را امضا می‌کند.
  </Step>
  <Step title="nonce دستگاه را ارسال کنید">
    کلاینت `connect.params.device.nonce` را با همان nonce مربوط به challenge ارسال می‌کند.
  </Step>
</Steps>

اگر `openclaw devices rotate` / `revoke` / `remove` به‌طور غیرمنتظره رد شد:

- نشست‌های توکن دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را مدیریت کنند، مگر اینکه فراخوان همچنین `operator.admin` داشته باشد
- `openclaw devices rotate --scope ...` فقط می‌تواند scopeهای اپراتوری را درخواست کند که نشست فراخوان از قبل دارد

مرتبط:

- [پیکربندی](/fa/gateway/configuration) (حالت‌های احراز هویت Gateway)
- [رابط کاربری کنترل](/fa/web/control-ui)
- [دستگاه‌ها](/fa/cli/devices)
- [دسترسی راه دور](/fa/gateway/remote)
- [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)

## سرویس Gateway در حال اجرا نیست

زمانی از این استفاده کنید که سرویس نصب شده اما فرایند پایدار نمی‌ماند.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

دنبال این موارد بگردید:

- `Runtime: stopped` همراه با راهنمایی‌های خروج.
- عدم تطابق پیکربندی سرویس (`Config (cli)` در برابر `Config (service)`).
- تداخل‌های پورت/listener.
- نصب‌های اضافی launchd/systemd/schtasks هنگام استفاده از `--deep`.
- راهنمایی‌های پاک‌سازی `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `Gateway start blocked: set gateway.mode=local` یا `existing config is missing gateway.mode` → حالت Gateway محلی فعال نیست، یا فایل پیکربندی بازنویسی شده و `gateway.mode` را از دست داده است. رفع: `gateway.mode="local"` را در پیکربندی خود تنظیم کنید، یا `openclaw onboard --mode local` / `openclaw setup` را دوباره اجرا کنید تا پیکربندی مورد انتظار حالت محلی دوباره ثبت شود. اگر OpenClaw را از طریق Podman اجرا می‌کنید، مسیر پیکربندی پیش‌فرض `~/.openclaw/openclaw.json` است.
    - `refusing to bind gateway ... without auth` → اتصال non-loopback بدون مسیر احراز هویت معتبر Gateway (توکن/گذرواژه، یا trusted-proxy در جایی که پیکربندی شده است).
    - `another gateway instance is already listening` / `EADDRINUSE` → تداخل پورت.
    - `Other gateway-like services detected (best effort)` → واحدهای قدیمی یا موازی launchd/systemd/schtasks وجود دارند. بیشتر تنظیمات باید برای هر ماشین یک Gateway نگه دارند؛ اگر واقعاً به بیش از یکی نیاز دارید، پورت‌ها + پیکربندی/وضعیت/workspace را جدا کنید. [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.
    - `System-level OpenClaw gateway service detected` از doctor → یک واحد سیستمی systemd وجود دارد در حالی که سرویس سطح کاربر موجود نیست. پیش از اجازه دادن به doctor برای نصب سرویس کاربر، مورد تکراری را حذف یا غیرفعال کنید، یا اگر واحد سیستمی supervisor مورد نظر است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.
    - `Gateway service port does not match current gateway config` → supervisor نصب‌شده همچنان `--port` قدیمی را پین می‌کند. `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید، سپس سرویس Gateway را دوباره راه‌اندازی کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [Doctor](/fa/gateway/doctor)

## Gateway پیکربندی نامعتبر را رد کرد

زمانی از این استفاده کنید که راه‌اندازی Gateway با `Invalid config` شکست می‌خورد یا لاگ‌های بارگذاری مجدد داغ می‌گویند
یک ویرایش نامعتبر را رد کرده است.

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
- یک فایل زمان‌دار `openclaw.json.rejected.*` کنار پیکربندی فعال
- یک فایل زمان‌دار `openclaw.json.clobbered.*` اگر `doctor --fix` یک ویرایش مستقیم خراب را تعمیر کرده باشد

<AccordionGroup>
  <Accordion title="چه اتفاقی افتاد">
    - پیکربندی هنگام راه‌اندازی، بارگذاری مجدد داغ، یا نوشتن تحت مالکیت OpenClaw اعتبارسنجی نشد.
    - راه‌اندازی Gateway به‌جای بازنویسی `openclaw.json` به‌صورت بسته شکست می‌خورد.
    - بارگذاری مجدد داغ ویرایش‌های خارجی نامعتبر را رد می‌کند و پیکربندی runtime فعلی را فعال نگه می‌دارد.
    - نوشتن‌های تحت مالکیت OpenClaw پیش از commit، payloadهای نامعتبر/مخرب را رد می‌کنند و `.rejected.*` را ذخیره می‌کنند.
    - `openclaw doctor --fix` مالک تعمیر است. می‌تواند پیشوندهای غیر JSON را حذف کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند و در همین حال payload ردشده را به‌صورت `.clobbered.*` حفظ کند.

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
    - `.rejected.*` وجود دارد → یک نوشتن پیکربندی تحت مالکیت OpenClaw پیش از commit در بررسی‌های schema یا clobber شکست خورده است.
    - `Config write rejected:` → نوشتن تلاش کرده شکل الزامی را حذف کند، اندازه فایل را به‌شدت کاهش دهد، یا پیکربندی نامعتبر را پایدار کند.
    - `config reload skipped (invalid config):` → یک ویرایش مستقیم در اعتبارسنجی شکست خورده و توسط Gateway در حال اجرا نادیده گرفته شده است.
    - `Invalid config at ...` → راه‌اندازی پیش از بوت شدن سرویس‌های Gateway شکست خورده است.
    - `missing-meta-vs-last-good`، `gateway-mode-missing-vs-last-good`، یا `size-drop-vs-last-good:*` → یک نوشتن تحت مالکیت OpenClaw رد شده چون نسبت به پشتیبان آخرین نسخه سالم شناخته‌شده، فیلدها یا اندازه را از دست داده است.
    - `Config last-known-good promotion skipped` → candidate شامل placeholderهای محرمانه redacted مانند `***` بوده است.

  </Accordion>
  <Accordion title="گزینه‌های رفع">
    1. `openclaw doctor --fix` را اجرا کنید تا doctor پیکربندی پیشونددار/clobbered را تعمیر کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند.
    2. فقط کلیدهای مورد نظر را از `.clobbered.*` یا `.rejected.*` کپی کنید، سپس آن‌ها را با `openclaw config set` یا `config.patch` اعمال کنید.
    3. پیش از راه‌اندازی مجدد، `openclaw config validate` را اجرا کنید.
    4. اگر دستی ویرایش می‌کنید، پیکربندی کامل JSON5 را نگه دارید، نه فقط شیء جزئی‌ای که می‌خواستید تغییر دهید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [Config](/fa/cli/config)
- [پیکربندی: بارگذاری مجدد داغ](/fa/gateway/configuration#config-hot-reload)
- [پیکربندی: اعتبارسنجی سخت‌گیرانه](/fa/gateway/configuration#strict-validation)
- [Doctor](/fa/gateway/doctor)

## هشدارهای probe Gateway

زمانی از این استفاده کنید که `openclaw gateway probe` به چیزی می‌رسد، اما همچنان یک بلوک هشدار چاپ می‌کند.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

دنبال این موارد بگردید:

- `warnings[].code` و `primaryTargetId` در خروجی JSON.
- اینکه هشدار درباره fallback SSH، چند Gateway، scopeهای مفقود، یا auth refهای resolveنشده است.

امضاهای رایج:

- `SSH tunnel failed to start; falling back to direct probes.` → راه‌اندازی SSH شکست خورد، اما فرمان همچنان targetهای مستقیم پیکربندی‌شده/loopback را امتحان کرد.
- `multiple reachable gateways detected` → بیش از یک target پاسخ داد. معمولاً این یعنی یک تنظیم چند-Gateway عمدی یا listenerهای قدیمی/تکراری.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → اتصال کار کرد، اما RPC جزئیات به scope محدود است؛ هویت دستگاه را جفت کنید یا از credentials با `operator.read` استفاده کنید.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → اتصال کار کرد، اما مجموعه کامل RPC تشخیصی timeout شد یا شکست خورد. این را به‌عنوان Gateway قابل‌دسترسی با تشخیص‌های تنزل‌یافته تلقی کنید؛ `connect.ok` و `connect.rpcOk` را در خروجی `--json` مقایسه کنید.
- `Capability: pairing-pending` یا `gateway closed (1008): pairing required` → Gateway پاسخ داد، اما این کلاینت هنوز پیش از دسترسی عادی اپراتور به pairing/approval نیاز دارد.
- متن هشدار SecretRef مربوط به `gateway.auth.*` / `gateway.remote.*` resolveنشده → مواد احراز هویت در این مسیر فرمان برای target شکست‌خورده در دسترس نبود.

مرتبط:

- [Gateway](/fa/cli/gateway)
- [چند Gateway روی یک میزبان](/fa/gateway#multiple-gateways-same-host)
- [دسترسی راه‌دور](/fa/gateway/remote)

## کانال متصل است، پیام‌ها جریان ندارند

اگر وضعیت کانال متصل است اما جریان پیام متوقف شده، روی خط‌مشی، مجوزها و قواعد تحویل ویژهٔ کانال تمرکز کنید.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

به دنبال این موارد بگردید:

- خط‌مشی DM (`pairing`، `allowlist`، `open`، `disabled`).
- فهرست مجاز گروه و الزامات منشن.
- مجوزها/دامنه‌های API کانال که وجود ندارند.

امضاهای رایج:

- `mention required` → پیام به‌دلیل خط‌مشی منشن گروه نادیده گرفته شد.
- `pairing` / ردپاهای تأیید در انتظار → فرستنده تأیید نشده است.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشکل احراز هویت/مجوزهای کانال.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [Discord](/fa/channels/discord)
- [Telegram](/fa/channels/telegram)
- [WhatsApp](/fa/channels/whatsapp)

## تحویل Cron و Heartbeat

اگر Cron یا Heartbeat اجرا نشد یا تحویل نداد، ابتدا وضعیت زمان‌بند را بررسی کنید، سپس مقصد تحویل را.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

به دنبال این موارد بگردید:

- Cron فعال باشد و بیدارباش بعدی وجود داشته باشد.
- وضعیت تاریخچهٔ اجرای کار (`ok`، `skipped`، `error`).
- دلایل رد شدن Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="امضاهای رایج">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron غیرفعال است.
    - `cron: timer tick failed` → تیک زمان‌بند شکست خورد؛ خطاهای فایل/لاگ/زمان اجرا را بررسی کنید.
    - `heartbeat skipped` با `reason=quiet-hours` → بیرون از بازهٔ ساعت‌های فعال است.
    - `heartbeat skipped` با `reason=empty-heartbeat-file` → `HEARTBEAT.md` وجود دارد اما فقط خط‌های خالی / سرآیندهای markdown دارد، بنابراین OpenClaw فراخوانی مدل را رد می‌کند.
    - `heartbeat skipped` با `reason=no-tasks-due` → `HEARTBEAT.md` یک بلوک `tasks:` دارد، اما هیچ‌کدام از کارها در این تیک موعدشان نرسیده است.
    - `heartbeat: unknown accountId` → شناسهٔ حساب برای مقصد تحویل Heartbeat نامعتبر است.
    - `heartbeat skipped` با `reason=dm-blocked` → مقصد Heartbeat به یک مقصد سبک DM حل شده، درحالی‌که `agents.defaults.heartbeat.directPolicy` (یا بازنویسی مخصوص عامل) روی `block` تنظیم شده است.

  </Accordion>
</AccordionGroup>

مرتبط:

- [Heartbeat](/fa/gateway/heartbeat)
- [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
- [کارهای زمان‌بندی‌شده: عیب‌یابی](/fa/automation/cron-jobs#troubleshooting)

## Node جفت شده، ابزار شکست می‌خورد

اگر یک Node جفت شده اما ابزارها شکست می‌خورند، وضعیت پیش‌زمینه، مجوز و تأیید را جداگانه بررسی کنید.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

به دنبال این موارد بگردید:

- Node آنلاین با قابلیت‌های مورد انتظار.
- اعطای مجوزهای سیستم‌عامل برای دوربین/میکروفون/مکان/صفحه‌نمایش.
- تأییدهای exec و وضعیت فهرست مجاز.

امضاهای رایج:

- `NODE_BACKGROUND_UNAVAILABLE` → برنامهٔ Node باید در پیش‌زمینه باشد.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → مجوز سیستم‌عامل وجود ندارد.
- `SYSTEM_RUN_DENIED: approval required` → تأیید exec در انتظار است.
- `SYSTEM_RUN_DENIED: allowlist miss` → فرمان توسط فهرست مجاز مسدود شده است.

مرتبط:

- [تأییدهای exec](/fa/tools/exec-approvals)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
- [Nodeها](/fa/nodes/index)

## ابزار مرورگر شکست می‌خورد

وقتی کنش‌های ابزار مرورگر شکست می‌خورند، حتی با اینکه خود Gateway سالم است، از این استفاده کنید.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

به دنبال این موارد بگردید:

- اینکه آیا `plugins.allow` تنظیم شده و شامل `browser` است.
- مسیر معتبر فایل اجرایی مرورگر.
- دسترس‌پذیری پروفایل CDP.
- در دسترس بودن Chrome محلی برای پروفایل‌های `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="امضاهای Plugin / فایل اجرایی">
    - `unknown command "browser"` یا `unknown command 'browser'` → Plugin مرورگر همراه، توسط `plugins.allow` کنار گذاشته شده است.
    - ابزار مرورگر وجود ندارد / در دسترس نیست درحالی‌که `browser.enabled=true` → `plugins.allow`، `browser` را کنار می‌گذارد، بنابراین Plugin هرگز بارگذاری نشده است.
    - `Failed to start Chrome CDP on port` → فرایند مرورگر نتوانست اجرا شود.
    - `browser.executablePath not found` → مسیر پیکربندی‌شده نامعتبر است.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL پیکربندی‌شدهٔ CDP از طرح پشتیبانی‌نشده‌ای مثل `file:` یا `ftp:` استفاده می‌کند.
    - `browser.cdpUrl has invalid port` → URL پیکربندی‌شدهٔ CDP پورت بد یا خارج از محدوده دارد.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → نصب فعلی Gateway وابستگی زمان اجرای اصلی مرورگر را ندارد؛ OpenClaw را دوباره نصب یا به‌روزرسانی کنید، سپس Gateway را بازراه‌اندازی کنید. اسنپ‌شات‌های ARIA و نماگرفت‌های پایهٔ صفحه هنوز می‌توانند کار کنند، اما ناوبری، اسنپ‌شات‌های AI، نماگرفت‌های عنصر با گزینشگر CSS، و خروجی PDF در دسترس نمی‌مانند.

  </Accordion>
  <Accordion title="امضاهای Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session در Chrome MCP هنوز نتوانست به دایرکتوری دادهٔ مرورگر انتخاب‌شده متصل شود. صفحهٔ inspect مرورگر را باز کنید، اشکال‌زدایی راه‌دور را فعال کنید، مرورگر را باز نگه دارید، درخواست اتصال نخست را تأیید کنید، سپس دوباره تلاش کنید. اگر وضعیت ورود به حساب لازم نیست، پروفایل مدیریت‌شدهٔ `openclaw` را ترجیح دهید.
    - `No Chrome tabs found for profile="user"` → پروفایل اتصال Chrome MCP هیچ زبانهٔ محلی باز Chrome ندارد.
    - `Remote CDP for profile "<name>" is not reachable` → نقطهٔ پایانی CDP راه‌دور پیکربندی‌شده از میزبان Gateway قابل دسترسی نیست.
    - `Browser attachOnly is enabled ... not reachable` یا `Browser attachOnly is enabled and CDP websocket ... is not reachable` → پروفایل فقط-اتصال هدف قابل دسترسی ندارد، یا نقطهٔ پایانی HTTP پاسخ داده اما WebSocket CDP همچنان باز نشده است.

  </Accordion>
  <Accordion title="امضاهای عنصر / نماگرفت / بارگذاری">
    - `fullPage is not supported for element screenshots` → درخواست نماگرفت، `--full-page` را با `--ref` یا `--element` ترکیب کرده است.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → فراخوانی‌های نماگرفت Chrome MCP / `existing-session` باید از گرفتن صفحه یا `--ref` یک اسنپ‌شات استفاده کنند، نه `--element` در CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → قلاب‌های بارگذاری Chrome MCP به ارجاع‌های اسنپ‌شات نیاز دارند، نه گزینشگرهای CSS.
    - `existing-session file uploads currently support one file at a time.` → روی پروفایل‌های Chrome MCP در هر فراخوانی یک بارگذاری بفرستید.
    - `existing-session dialog handling does not support timeoutMs.` → قلاب‌های گفت‌وگو روی پروفایل‌های Chrome MCP از بازنویسی مهلت زمانی پشتیبانی نمی‌کنند.
    - `existing-session type does not support timeoutMs overrides.` → برای `act:type` روی پروفایل‌های `profile="user"` / existing-session در Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی مهلت زمانی سفارشی لازم است از پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `existing-session evaluate does not support timeoutMs overrides.` → برای `act:evaluate` روی پروفایل‌های `profile="user"` / existing-session در Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی مهلت زمانی سفارشی لازم است از پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارد.
    - بازنویسی‌های کهنهٔ viewport / حالت تیره / locale / آفلاین روی پروفایل‌های فقط-اتصال یا CDP راه‌دور → `openclaw browser stop --browser-profile <name>` را اجرا کنید تا نشست کنترل فعال بسته شود و وضعیت شبیه‌سازی Playwright/CDP بدون بازراه‌اندازی کل Gateway آزاد شود.

  </Accordion>
</AccordionGroup>

مرتبط:

- [مرورگر (مدیریت‌شده توسط OpenClaw)](/fa/tools/browser)
- [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting)

## اگر ارتقا دادید و چیزی ناگهان خراب شد

بیشتر خرابی‌های پس از ارتقا ناشی از رانش پیکربندی یا پیش‌فرض‌های سخت‌گیرانه‌تری است که اکنون اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="۱. رفتار بازنویسی احراز هویت و URL تغییر کرده است">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    چه چیزی را بررسی کنید:

    - اگر `gateway.mode=remote` باشد، فراخوانی‌های CLI ممکن است راه‌دور را هدف بگیرند، درحالی‌که سرویس محلی شما سالم است.
    - فراخوانی‌های صریح `--url` به اعتبارنامه‌های ذخیره‌شده برنمی‌گردند.

    امضاهای رایج:

    - `gateway connect failed:` → هدف URL اشتباه است.
    - `unauthorized` → نقطهٔ پایانی قابل دسترسی است اما احراز هویت اشتباه است.

  </Accordion>
  <Accordion title="۲. حفاظ‌های bind و احراز هویت سخت‌گیرانه‌تر شده‌اند">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    چه چیزی را بررسی کنید:

    - bindهای غیر local loopback (`lan`، `tailnet`، `custom`) به یک مسیر معتبر احراز هویت Gateway نیاز دارند: احراز هویت با توکن/رمز عبور مشترک، یا استقرار `trusted-proxy` غیر local loopback که درست پیکربندی شده باشد.
    - کلیدهای قدیمی مثل `gateway.token` جایگزین `gateway.auth.token` نمی‌شوند.

    امضاهای رایج:

    - `refusing to bind gateway ... without auth` → bind غیر local loopback بدون مسیر معتبر احراز هویت Gateway.
    - `Connectivity probe: failed` درحالی‌که زمان اجرا در حال اجراست → Gateway زنده است اما با احراز هویت/URL فعلی در دسترس نیست.

  </Accordion>
  <Accordion title="۳. وضعیت جفت‌سازی و هویت دستگاه تغییر کرده است">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    چه چیزی را بررسی کنید:

    - تأییدهای دستگاه در انتظار برای داشبورد/Nodeها.
    - تأییدهای جفت‌سازی DM در انتظار پس از تغییرات خط‌مشی یا هویت.

    امضاهای رایج:

    - `device identity required` → احراز هویت دستگاه برآورده نشده است.
    - `pairing required` → فرستنده/دستگاه باید تأیید شود.

  </Accordion>
</AccordionGroup>

اگر پیکربندی سرویس و زمان اجرا پس از بررسی‌ها همچنان ناسازگار بودند، فرادادهٔ سرویس را از همان دایرکتوری پروفایل/وضعیت دوباره نصب کنید:

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
- [راهنمای عملیاتی Gateway](/fa/gateway)
