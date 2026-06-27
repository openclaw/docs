---
read_when:
    - مرکز عیب‌یابی شما را برای تشخیص عمیق‌تر به اینجا ارجاع داده است
    - به بخش‌های راهنمای عملیاتی پایدار مبتنی بر نشانه‌ها با فرمان‌های دقیق نیاز دارید
sidebarTitle: Troubleshooting
summary: راهنمای جامع عیب‌یابی برای Gateway، کانال‌ها، اتوماسیون، گره‌ها و مرورگر
title: عیب‌یابی
x-i18n:
    generated_at: "2026-06-27T17:51:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

این صفحه runbook عمیق است. اگر ابتدا جریان triage سریع را می‌خواهید، از [/help/troubleshooting](/fa/help/troubleshooting) شروع کنید.

## نردبان فرمان‌ها

ابتدا این‌ها را به همین ترتیب اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

نشانه‌های مورد انتظار برای وضعیت سالم:

- `openclaw gateway status`، `Runtime: running`، `Connectivity probe: ok`، و یک خط `Capability: ...` را نشان می‌دهد.
- `openclaw doctor` هیچ مشکل مسدودکننده‌ای در config/service گزارش نمی‌کند.
- `openclaw channels status --probe` وضعیت زنده transport برای هر حساب را نشان می‌دهد و، در موارد پشتیبانی‌شده، نتایج probe/audit مانند `works` یا `audit ok` را نمایش می‌دهد.

## پس از یک به‌روزرسانی

وقتی به‌روزرسانی تمام شده اما Gateway پایین است، channelها خالی هستند، یا
فراخوانی‌های مدل با خطاهای 401 شکست می‌خورند، از این بخش استفاده کنید.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

دنبال این موارد بگردید:

- `Update restart` در `openclaw status` / `openclaw status --all`. handoffهای در انتظار یا
  شکست‌خورده فرمان بعدی برای اجرا را شامل می‌شوند.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  زیر Channels. این یعنی config مربوط به channel هنوز وجود دارد، اما
  ثبت Plugin پیش از آنکه channel بتواند بارگذاری شود شکست خورده است.
- خطاهای 401 provider پس از احراز هویت دوباره. `openclaw doctor --fix` وجود
  سایه‌های auth قدیمی OAuth برای هر agent را بررسی می‌کند و نسخه‌های قدیمی را حذف می‌کند تا همه agentها
  profile مشترک فعلی را resolve کنند.

## نصب‌های split brain و نگهبان config جدیدتر

وقتی یک سرویس gateway پس از به‌روزرسانی به‌طور غیرمنتظره متوقف می‌شود، یا logها نشان می‌دهند که یک باینری `openclaw` قدیمی‌تر از نسخه‌ای است که آخرین بار `openclaw.json` را نوشته، از این بخش استفاده کنید.

OpenClaw نوشتن‌های config را با `meta.lastTouchedVersion` نشان‌گذاری می‌کند. فرمان‌های فقط‌خواندنی همچنان می‌توانند config نوشته‌شده توسط OpenClaw جدیدتر را بررسی کنند، اما mutationهای process و service از ادامه دادن با یک باینری قدیمی‌تر خودداری می‌کنند. اقدام‌های مسدودشده شامل شروع، توقف، restart، uninstall سرویس gateway، reinstall اجباری service، راه‌اندازی gateway در حالت service، و پاک‌سازی port با `gateway --force` هستند.

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
    سرویس gateway موردنظر را از نصب جدیدتر دوباره نصب کنید:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    بسته‌های سیستمی قدیمی یا entryهای wrapper قدیمی را که هنوز به یک باینری قدیمی `openclaw` اشاره می‌کنند حذف کنید.
  </Step>
</Steps>

<Warning>
فقط برای downgrade عمدی یا بازیابی اضطراری، `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` را برای همان یک فرمان تنظیم کنید. برای عملیات عادی آن را unset نگه دارید.
</Warning>

## ناسازگاری protocol پس از rollback

وقتی پس از downgrade یا rollback کردن OpenClaw، logها همچنان `protocol mismatch` چاپ می‌کنند، از این بخش استفاده کنید. این یعنی یک Gateway قدیمی‌تر در حال اجراست، اما یک process کلاینت محلی جدیدتر هنوز تلاش می‌کند با بازه protocolی reconnect کند که Gateway قدیمی‌تر نمی‌تواند صحبت کند.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

دنبال این موارد بگردید:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` در logهای Gateway.
- `Established clients:` در `openclaw gateway status --deep` یا `Gateway clients` در `openclaw doctor --deep`. این فهرست کلاینت‌های TCP فعال متصل به port Gateway را نشان می‌دهد، از جمله PIDها و command lineها وقتی OS اجازه دهد.
- یک process کلاینت که command line آن به نصب یا wrapper جدیدتر OpenClaw اشاره می‌کند که از آن rollback کرده‌اید.

رفع:

1. process کلاینت قدیمی OpenClaw را که `gateway status --deep` نشان می‌دهد متوقف یا restart کنید.
2. appها یا wrapperهایی را که OpenClaw را embed می‌کنند restart کنید، مانند داشبوردهای محلی، ویرایشگرها، helperهای app-server، یا shellهای بلندمدت `openclaw logs --follow`.
3. `openclaw gateway status --deep` یا `openclaw doctor --deep` را دوباره اجرا کنید و تأیید کنید PID کلاینت قدیمی حذف شده است.

یک Gateway قدیمی‌تر را وادار نکنید protocol جدیدتر ناسازگار را بپذیرد. افزایش‌های protocol از قرارداد wire محافظت می‌کنند؛ بازیابی rollback مسئله پاک‌سازی process/version است.

## Symlink مربوط به Skill به‌عنوان خروج از path نادیده گرفته شد

وقتی logها شامل این مورد هستند از این بخش استفاده کنید:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw هر root مربوط به skill را یک مرز containment در نظر می‌گیرد. یک symlink زیر
`~/.agents/skills`، `<workspace>/.agents/skills`، `<workspace>/skills`، یا
`~/.openclaw/skills` وقتی target واقعی آن بیرون از آن root resolve شود نادیده گرفته می‌شود،
مگر اینکه target به‌صراحت trusted باشد.

link را بررسی کنید:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

اگر target عمدی است، هم root مستقیم skill و هم
target مجاز symlink را configure کنید:

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

سپس یک session جدید شروع کنید یا منتظر بمانید watcher مربوط به skills refresh شود. اگر process در حال اجرا پیش از تغییر config شروع شده، gateway را restart کنید.

از targetهای گسترده مانند `~`، `/`، یا یک پوشه پروژه synced کامل استفاده نکنید.
`allowSymlinkTargets` را به root واقعی skill که directoryهای trusted
`SKILL.md` را شامل می‌شود محدود نگه دارید.

اگر apply در Skill Workshop نیز باید از طریق همان pathهای trusted و symlinked
workspace skill بنویسد، `skills.workshop.allowSymlinkTargetWrites` را فعال کنید. آن را
برای rootهای skill مشترک فقط‌خواندنی غیرفعال نگه دارید.

مرتبط:

- [config مربوط به Skills](/fa/tools/skills-config#symlinked-skill-roots)
- [نمونه‌های Configuration](/fa/gateway/configuration-examples#symlinked-sibling-skill-repo)

## مصرف اضافی Anthropic 429 برای context طولانی لازم است

وقتی logها/خطاها شامل این مورد هستند از این بخش استفاده کنید: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

دنبال این موارد بگردید:

- مدل Anthropic انتخاب‌شده یک مدل 1M Claude 4.x با قابلیت GA است، یا مدل دارای `params.context1m: true` قدیمی است.
- credential فعلی Anthropic برای استفاده از context طولانی واجد شرایط نیست.
- requestها فقط در sessionهای طولانی/اجرای مدل‌هایی شکست می‌خورند که به مسیر context 1M نیاز دارند.

گزینه‌های رفع:

<Steps>
  <Step title="Use a standard context window">
    به مدلی با window استاندارد تغییر دهید، یا `context1m` قدیمی را از config مدل‌های قدیمی‌تری که برای context 1M قابلیت GA ندارند حذف کنید.
  </Step>
  <Step title="Use an eligible credential">
    از credential مربوط به Anthropic که برای requestهای context طولانی واجد شرایط است استفاده کنید، یا به یک Anthropic API key تغییر دهید.
  </Step>
  <Step title="Configure fallback models">
    مدل‌های fallback را configure کنید تا وقتی requestهای context طولانی Anthropic رد می‌شوند، اجراها ادامه پیدا کنند.
  </Step>
</Steps>

مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف token و هزینه‌ها](/fa/reference/token-use)
- [چرا HTTP 429 از Anthropic می‌بینم؟](/fa/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## پاسخ‌های مسدودشده 403 از upstream

وقتی یک provider بالادستی LLM یک `403` عمومی مانند
`Your request was blocked` برمی‌گرداند، از این بخش استفاده کنید.

فرض نکنید این همیشه یک مشکل configuration در OpenClaw است. پاسخ می‌تواند
از یک لایه امنیتی بالادستی مانند CDN، WAF، قاعده bot-management، یا
reverse proxy جلوی یک endpoint سازگار با OpenAI بیاید.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

دنبال این موارد بگردید:

- چندین مدل زیر یک provider یکسان به همان شکل شکست می‌خورند
- متن HTML یا security عمومی به‌جای خطای عادی API مربوط به provider
- eventهای security سمت provider در همان زمان request
- یک probe مستقیم کوچک با `curl` موفق می‌شود در حالی که requestهای عادی با شکل SDK شکست می‌خورند

وقتی evidence به block توسط WAF/CDN اشاره می‌کند، ابتدا filtering سمت provider را رفع کنید. یک قاعده allow یا skip با scope محدود برای path مربوط به API که OpenClaw استفاده می‌کند ترجیح دارد، و از غیرفعال کردن protection برای کل site خودداری کنید.

<Warning>
یک `curl` حداقلی موفق تضمین نمی‌کند که requestهای واقعی به سبک SDK از همان لایه security بالادستی عبور کنند.
</Warning>

مرتبط:

- [endpointهای سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuration مربوط به provider](/fa/providers)
- [Logها](/fa/logging)

## backend محلی سازگار با OpenAI از probeهای مستقیم عبور می‌کند اما اجراهای agent شکست می‌خورند

وقتی این موارد برقرار است از این بخش استفاده کنید:

- `curl ... /v1/models` کار می‌کند
- فراخوانی‌های مستقیم کوچک `/v1/chat/completions` کار می‌کنند
- اجرای مدل OpenClaw فقط در turnهای عادی agent شکست می‌خورد

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

دنبال این موارد بگردید:

- فراخوانی‌های مستقیم کوچک موفق می‌شوند، اما اجرای OpenClaw فقط روی promptهای بزرگ‌تر شکست می‌خورد
- خطاهای `model_not_found` یا 404، با وجود اینکه `/v1/chat/completions` مستقیم
  با همان bare model id کار می‌کند
- خطاهای backend درباره اینکه `messages[].content` باید string باشد
- هشدارهای متناوب `incomplete turn detected ... stopReason=stop payloads=0` با یک backend محلی سازگار با OpenAI
- crashهای backend که فقط با تعداد prompt-token بزرگ‌تر یا promptهای کامل runtime مربوط به agent ظاهر می‌شوند

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` با یک server محلی سبک MLX/vLLM → بررسی کنید `baseUrl` شامل `/v1` باشد، `api` برای backendهای `/v1/chat/completions` برابر `"openai-completions"` باشد، و `models.providers.<provider>.models[].id` همان bare provider-local id باشد. آن را یک‌بار با prefix مربوط به provider انتخاب کنید، برای مثال `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ entry مربوط به catalog را به‌شکل `mlx-community/Qwen3-30B-A3B-6bit` نگه دارید.
    - `messages[...].content: invalid type: sequence, expected a string` → backend بخش‌های محتوای structured مربوط به Chat Completions را رد می‌کند. رفع: `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
    - `validation.keys` یا کلیدهای مجاز message مانند `["role","content"]` → backend metadata مربوط به replay به سبک OpenAI را روی messageهای Chat Completions رد می‌کند. رفع: `models.providers.<provider>.models[].compat.strictMessageKeys: true` را تنظیم کنید.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend درخواست Chat Completions را کامل کرده اما برای آن turn هیچ متن assistant قابل مشاهده برای کاربر برنگردانده است. OpenClaw turnهای خالی و replay-safe سازگار با OpenAI را یک‌بار retry می‌کند؛ شکست‌های پایدار معمولاً یعنی backend محتوای خالی/غیرمتنی emit می‌کند یا متن final-answer را سرکوب می‌کند.
    - requestهای مستقیم کوچک موفق می‌شوند، اما اجرای agent در OpenClaw با crashهای backend/model شکست می‌خورد (برای مثال Gemma روی بعضی buildهای `inferrs`) → transport مربوط به OpenClaw احتمالاً از قبل درست است؛ backend روی شکل prompt بزرگ‌تر runtime مربوط به agent شکست می‌خورد.
    - پس از غیرفعال کردن toolها failureها کمتر می‌شوند اما حذف نمی‌شوند → schemaهای tool بخشی از فشار بودند، اما مسئله باقی‌مانده همچنان ظرفیت model/server بالادستی یا bug در backend است.

  </Accordion>
  <Accordion title="Fix options">
    1. برای backendهای Chat Completions فقط-string، `compat.requiresStringContent: true` را تنظیم کنید.
    2. برای backendهای strict Chat Completions که روی هر message فقط `role` و `content` را می‌پذیرند، `compat.strictMessageKeys: true` را تنظیم کنید.
    3. برای مدل‌ها/backendهایی که نمی‌توانند سطح schemaهای tool مربوط به OpenClaw را قابل‌اعتماد مدیریت کنند، `compat.supportsTools: false` را تنظیم کنید.
    4. فشار prompt را تا حد امکان کاهش دهید: bootstrap کوچک‌تر workspace، history کوتاه‌تر session، مدل محلی سبک‌تر، یا backendی با پشتیبانی قوی‌تر از context طولانی.
    5. اگر requestهای مستقیم کوچک همچنان موفق می‌شوند اما turnهای agent در OpenClaw هنوز داخل backend crash می‌کنند، آن را یک محدودیت server/model بالادستی در نظر بگیرید و با شکل payload پذیرفته‌شده، آنجا repro ثبت کنید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/gateway/configuration)
- [مدل‌های محلی](/fa/gateway/local-models)
- [نقاط پایانی سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)

## بدون پاسخ

اگر کانال‌ها فعال هستند اما چیزی پاسخ نمی‌دهد، پیش از اتصال دوباره هر چیز، مسیریابی و سیاست را بررسی کنید.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

به دنبال این موارد باشید:

- جفت‌سازی در انتظار برای فرستندگان پیام مستقیم.
- دروازه‌گذاری اشاره در گروه (`requireMention`, `mentionPatterns`).
- ناهماهنگی‌های فهرست مجاز کانال/گروه.

نشانه‌های رایج:

- `drop guild message (mention required` → پیام گروه تا زمان اشاره نادیده گرفته می‌شود.
- `pairing request` → فرستنده به تأیید نیاز دارد.
- `blocked` / `allowlist` → فرستنده/کانال توسط سیاست فیلتر شده است.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [گروه‌ها](/fa/channels/groups)
- [جفت‌سازی](/fa/channels/pairing)

## اتصال رابط کنترل داشبورد

وقتی داشبورد/رابط کنترل وصل نمی‌شود، URL، حالت احراز هویت، و فرض‌های زمینه امن را اعتبارسنجی کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

به دنبال این موارد باشید:

- URL درست برای کاوش و URL درست داشبورد.
- ناهماهنگی حالت احراز هویت/توکن بین کلاینت و Gateway.
- استفاده از HTTP جایی که هویت دستگاه لازم است.

اگر مرورگر محلی پس از به‌روزرسانی نمی‌تواند به `127.0.0.1:18789` وصل شود، ابتدا
سرویس Gateway محلی را بازیابی کنید و تأیید کنید که داشبورد را ارائه می‌کند:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

اگر `curl` HTML مربوط به OpenClaw را برگرداند، Gateway کار می‌کند و مشکل باقی‌مانده
احتمالاً کش مرورگر، یک پیوند عمیق قدیمی، یا وضعیت کهنه تب است. `http://127.0.0.1:18789`
را مستقیماً باز کنید و از داشبورد پیمایش کنید. اگر راه‌اندازی دوباره سرویس را در حال اجرا
باقی نمی‌گذارد، `openclaw gateway start` را اجرا کنید و دوباره `openclaw gateway status`
را بررسی کنید.

<AccordionGroup>
  <Accordion title="نشانه‌های اتصال / احراز هویت">
    - `device identity required` → زمینه ناامن یا احراز هویت دستگاه وجود ندارد.
    - `origin not allowed` → مقدار `Origin` مرورگر در `gateway.controlUi.allowedOrigins` نیست (یا از یک مبدأ مرورگر غیر loopback بدون فهرست مجاز صریح وصل می‌شوید).
    - `device nonce required` / `device nonce mismatch` → کلاینت جریان احراز هویت دستگاه مبتنی بر چالش را کامل نمی‌کند (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → کلاینت بار داده نادرست (یا برچسب زمانی کهنه) را برای دست‌دهی فعلی امضا کرده است.
    - `AUTH_TOKEN_MISMATCH` با `canRetryWithDeviceToken=true` → کلاینت می‌تواند یک تلاش مجدد مورد اعتماد با توکن دستگاه کش‌شده انجام دهد.
    - آن تلاش مجدد با توکن کش‌شده از مجموعه محدوده کش‌شده‌ای استفاده می‌کند که همراه توکن دستگاه جفت‌شده ذخیره شده است. فراخوانندگان دارای `deviceToken` صریح / `scopes` صریح به‌جای آن مجموعه محدوده درخواستی خود را نگه می‌دارند.
    - `AUTH_SCOPE_MISMATCH` → توکن دستگاه شناخته شد، اما محدوده‌های تأییدشده آن این درخواست اتصال را پوشش نمی‌دهند؛ به‌جای چرخاندن یک توکن مشترک Gateway، دوباره جفت‌سازی کنید یا قرارداد محدوده درخواستی را تأیید کنید.
    - خارج از آن مسیر تلاش مجدد، اولویت احراز هویت اتصال ابتدا توکن/رمز عبور مشترک صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، و سپس توکن راه‌انداز است.
    - در مسیر ناهمگام رابط کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, ip}` پیش از ثبت شکست توسط محدودکننده، سریالی می‌شوند. بنابراین دو تلاش مجدد هم‌زمان نامعتبر از همان کلاینت می‌توانند در تلاش دوم به‌جای دو ناهماهنگی ساده، `retry later` را نشان دهند.
    - `too many failed authentication attempts (retry later)` از یک کلاینت loopback با مبدأ مرورگر → شکست‌های تکراری از همان `Origin` نرمال‌سازی‌شده به‌طور موقت قفل می‌شوند؛ یک مبدأ localhost دیگر از سبد جداگانه‌ای استفاده می‌کند.
    - `unauthorized` تکراری پس از آن تلاش مجدد → رانش توکن مشترک/توکن دستگاه؛ پیکربندی توکن را تازه کنید و در صورت نیاز توکن دستگاه را دوباره تأیید/چرخش دهید.
    - `gateway connect failed:` → هدف میزبان/درگاه/url نادرست است.

  </Accordion>
</AccordionGroup>

### نقشه سریع کدهای جزئیات احراز هویت

از `error.details.code` در پاسخ ناموفق `connect` استفاده کنید تا اقدام بعدی را انتخاب کنید:

| کد جزئیات                   | معنا                                                                                                                                                                                      | اقدام پیشنهادی                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | کلاینت توکن مشترک لازم را نفرستاده است.                                                                                                                                                 | توکن را در کلاینت جای‌گذاری/تنظیم کنید و دوباره تلاش کنید. برای مسیرهای داشبورد: `openclaw config get gateway.auth.token` و سپس در تنظیمات رابط کنترل جای‌گذاری کنید.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | توکن مشترک با توکن احراز هویت Gateway مطابقت نداشت.                                                                                                                                               | اگر `canRetryWithDeviceToken=true` است، یک تلاش مجدد مورد اعتماد را مجاز کنید. تلاش‌های مجدد با توکن کش‌شده از محدوده‌های تأییدشده ذخیره‌شده استفاده می‌کنند؛ فراخوانندگان دارای `deviceToken` / `scopes` صریح محدوده‌های درخواستی را نگه می‌دارند. اگر همچنان ناموفق بود، [فهرست بررسی بازیابی رانش توکن](/fa/cli/devices#token-drift-recovery-checklist) را اجرا کنید. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | توکن کش‌شده هر دستگاه کهنه یا لغو شده است.                                                                                                                                                 | توکن دستگاه را با استفاده از [CLI دستگاه‌ها](/fa/cli/devices) بچرخانید/دوباره تأیید کنید، سپس دوباره وصل شوید.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | توکن دستگاه معتبر است، اما نقش/محدوده‌های تأییدشده آن این درخواست اتصال را پوشش نمی‌دهند.                                                                                                       | دستگاه را دوباره جفت کنید یا قرارداد محدوده درخواستی را تأیید کنید؛ این مورد را به‌عنوان رانش توکن مشترک در نظر نگیرید.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | هویت دستگاه به تأیید نیاز دارد. `error.details.reason` را برای `not-paired`، `scope-upgrade`، `role-upgrade`، یا `metadata-upgrade` بررسی کنید و هنگام وجود، از `requestId` / `remediationHint` استفاده کنید. | درخواست در انتظار را تأیید کنید: `openclaw devices list` سپس `openclaw devices approve <requestId>`. ارتقاهای محدوده/نقش پس از بررسی دسترسی درخواستی از همان جریان استفاده می‌کنند.                                                                                                               |

<Note>
RPCهای مستقیم backend روی loopback که با توکن/رمز عبور مشترک Gateway احراز هویت شده‌اند نباید به خط مبنای محدوده دستگاه جفت‌شده CLI وابسته باشند. اگر subagentها یا فراخوانی‌های داخلی دیگر همچنان با `scope-upgrade` ناموفق می‌شوند، تأیید کنید فراخواننده از `client.id: "gateway-client"` و `client.mode: "backend"` استفاده می‌کند و `deviceIdentity` صریح یا توکن دستگاه را اجباری نمی‌کند.
</Note>

بررسی مهاجرت احراز هویت دستگاه نسخه ۲:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

اگر لاگ‌ها خطاهای nonce/امضا نشان می‌دهند، کلاینت متصل‌شونده را به‌روزرسانی و آن را تأیید کنید:

<Steps>
  <Step title="در انتظار connect.challenge بمانید">
    کلاینت منتظر `connect.challenge` صادرشده توسط Gateway می‌ماند.
  </Step>
  <Step title="بار داده را امضا کنید">
    کلاینت بار داده وابسته به چالش را امضا می‌کند.
  </Step>
  <Step title="nonce دستگاه را بفرستید">
    کلاینت `connect.params.device.nonce` را با همان nonce چالش می‌فرستد.
  </Step>
</Steps>

اگر `openclaw devices rotate` / `revoke` / `remove` به‌طور غیرمنتظره رد شد:

- نشست‌های توکن دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را مدیریت کنند، مگر اینکه فراخواننده `operator.admin` هم داشته باشد
- `openclaw devices rotate --scope ...` فقط می‌تواند محدوده‌های اپراتوری را درخواست کند که نشست فراخواننده از قبل دارد

مرتبط:

- [پیکربندی](/fa/gateway/configuration) (حالت‌های احراز هویت Gateway)
- [رابط کنترل](/fa/web/control-ui)
- [دستگاه‌ها](/fa/cli/devices)
- [دسترسی راه دور](/fa/gateway/remote)
- [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)

## سرویس Gateway در حال اجرا نیست

از این مورد زمانی استفاده کنید که سرویس نصب شده اما فرایند پایدار نمی‌ماند.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

به دنبال این موارد باشید:

- `Runtime: stopped` همراه با راهنمایی‌های خروج.
- ناهماهنگی پیکربندی سرویس (`Config (cli)` در برابر `Config (service)`).
- تداخل‌های درگاه/شنونده.
- نصب‌های اضافی launchd/systemd/schtasks هنگام استفاده از `--deep`.
- راهنمایی‌های پاک‌سازی `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="نشانه‌های رایج">
    - `Gateway start blocked: set gateway.mode=local` یا `existing config is missing gateway.mode` → حالت Gateway محلی فعال نیست، یا فایل پیکربندی بازنویسی شده و `gateway.mode` را از دست داده است. رفع: `gateway.mode="local"` را در پیکربندی خود تنظیم کنید، یا `openclaw onboard --mode local` / `openclaw setup` را دوباره اجرا کنید تا پیکربندی مورد انتظار حالت محلی دوباره مهر شود. اگر OpenClaw را از طریق Podman اجرا می‌کنید، مسیر پیش‌فرض پیکربندی `~/.openclaw/openclaw.json` است.
    - `refusing to bind gateway ... without auth` → اتصال غیر loopback بدون مسیر احراز هویت معتبر Gateway (توکن/رمز عبور، یا trusted-proxy در صورت پیکربندی).
    - `another gateway instance is already listening` / `EADDRINUSE` → تداخل درگاه.
    - `Other gateway-like services detected (best effort)` → واحدهای کهنه یا موازی launchd/systemd/schtasks وجود دارند. بیشتر راه‌اندازی‌ها باید یک Gateway برای هر ماشین نگه دارند؛ اگر واقعاً به بیش از یکی نیاز دارید، درگاه‌ها + پیکربندی/وضعیت/فضای کاری را جدا کنید. [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.
    - `System-level OpenClaw gateway service detected` از doctor → یک واحد systemd سیستمی وجود دارد در حالی که سرویس سطح کاربر وجود ندارد. پیش از اجازه دادن به doctor برای نصب سرویس کاربر، نسخه تکراری را حذف یا غیرفعال کنید، یا اگر واحد سیستمی ناظر مورد نظر است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.
    - `Gateway service port does not match current gateway config` → ناظر نصب‌شده هنوز `--port` قدیمی را ثابت نگه داشته است. `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید، سپس سرویس Gateway را دوباره راه‌اندازی کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [Doctor](/fa/gateway/doctor)

## Gateway در macOS بی‌صدا از پاسخ‌گویی بازمی‌ایستد، سپس وقتی داشبورد را لمس می‌کنید از سر می‌گیرد

از این مورد زمانی استفاده کنید که کانال‌ها (Telegram، WhatsApp، و غیره) روی میزبان macOS برای چند دقیقه تا چند ساعت در هر نوبت ساکت می‌شوند، و به نظر می‌رسد Gateway همان لحظه‌ای که رابط کنترل را باز می‌کنید، با SSH وارد می‌شوید، یا به هر شکل دیگری با میزبان تعامل می‌کنید، دوباره برمی‌گردد. معمولاً در `openclaw status` نشانه آشکاری وجود ندارد، چون تا وقتی بررسی می‌کنید Gateway دوباره زنده شده است.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

دنبال این موارد بگردید:

- یک یا چند بسته `*-uncaught_exception.json` در `~/.openclaw/logs/stability/` که `error.code` در آن‌ها روی یک کد شبکه گذرا مانند `ENETDOWN`، `ENETUNREACH`، `EHOSTUNREACH` یا `ECONNREFUSED` تنظیم شده باشد.
- خطوط `pmset -g log` مانند `Entering Sleep state due to 'Maintenance Sleep'` یا `en0 driver is slow (msg: WillChangeState to 0)` که با زمان‌های خرابی هم‌زمان باشند. Power Nap / Maintenance Sleep برای مدت کوتاهی درایور Wi-Fi را در وضعیت 0 قرار می‌دهد؛ هر `connect()` خروجی که در آن بازه رخ دهد می‌تواند با `ENETDOWN` شکست بخورد، حتی روی میزبانی که در حالت عادی اتصال شبکه کامل دارد.
- خروجی `launchctl print` که `state = not running` را همراه با چند `runs` اخیر و یک کد خروج نشان می‌دهد، به‌ویژه وقتی فاصله بین خرابی و اجرای بعدی در حد یک ساعت باشد، نه چند ثانیه. launchd در macOS پس از یک موج خرابی، یک دروازه محافظت در برابر اجرای دوباره اعمال می‌کند که مستند نشده است و می‌تواند تا زمان یک محرک خارجی مانند ورود تعاملی، اتصال داشبورد، یا `launchctl kickstart`، دیگر به `KeepAlive=true` عمل نکند.

امضاهای رایج:

- یک بسته پایداری که `error.code` آن `ENETDOWN` یا یک کد هم‌خانواده است و پشته فراخوانی به `lookupAndConnect` / `Socket.connect` در `net` مربوط به Node اشاره می‌کند. OpenClaw `2026.5.26` و نسخه‌های جدیدتر این موارد را به‌عنوان خطاهای شبکه گذرای بی‌خطر دسته‌بندی می‌کنند تا دیگر به هندلر سطح بالای uncaught منتقل نشوند؛ اگر روی نسخه قدیمی‌تر هستید، ابتدا ارتقا دهید.
- دوره‌های طولانی سکوت که درست همان لحظه‌ای تمام می‌شوند که به رابط کاربری کنترل وصل می‌شوید یا با SSH وارد میزبان می‌شوید: فعالیت قابل مشاهده برای کاربر همان چیزی است که دروازه اجرای دوباره launchd را دوباره مسلح می‌کند، نه کاری که داشبورد با Gateway انجام می‌دهد.
- افزایش شمارنده `runs` در طول روز بدون خط متناظر `received SIG*; shutting down` در `~/Library/Logs/openclaw/gateway.log`: خاموشی‌های تمیز یک سیگنال را ثبت می‌کنند؛ خرابی‌های گذرا این کار را نمی‌کنند.

چه باید کرد:

1. اگر نسخه‌ای قبل از `2026.5.26` را اجرا می‌کنید، **Gateway را ارتقا دهید**. پس از ارتقا، خطاهای آینده `ENETDOWN` به‌جای پایان دادن به فرایند، به‌صورت هشدار ثبت می‌شوند.
2. روی میزبان‌های Mac mini / دسکتاپ که قرار است سرور همیشه‌روشن باشند، **فعالیت maintenance sleep را کاهش دهید**:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   این کار نوسان زیربنایی درایور را به‌طور قابل توجهی کاهش می‌دهد، اما کاملا حذف نمی‌کند. سیستم همچنان می‌تواند صرف‌نظر از این پرچم‌ها، برای TCP keepalive و نگهداری mDNS برخی maintenance sleepها را انجام دهد.

3. **یک watchdog زنده‌بودن اضافه کنید** تا موج خرابی آینده که توسط launchd متوقف می‌شود، سریع شناسایی شود:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   هدف این است که دروازه اجرای دوباره از بیرون دوباره مسلح شود؛ `KeepAlive=true` به‌تنهایی پس از یک موج خرابی در macOS کافی نیست.

مرتبط:

- [نکته‌های پلتفرم macOS](/fa/platforms/macos)
- [ثبت گزارش](/fa/logging)
- [Doctor](/fa/gateway/doctor)

## خروج Gateway هنگام مصرف بالای حافظه

وقتی Gateway زیر بار ناپدید می‌شود، سرپرست یک راه‌اندازی مجدد شبیه OOM گزارش می‌کند، یا لاگ‌ها به `critical memory pressure bundle written` اشاره می‌کنند، از این بخش استفاده کنید.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

دنبال این موارد بگردید:

- `Reason: diagnostic.memory.pressure.critical` در آخرین بسته پایداری.
- `Memory pressure:` همراه با `critical/rss_threshold`، `critical/heap_threshold`، یا `critical/rss_growth`.
- مقادیر `V8 heap:` نزدیک به حد heap.
- ورودی‌های `Largest session files:` مانند `agents/<agent>/sessions/<session>.jsonl` یا `sessions/<session>.jsonl`.
- شمارنده‌های حافظه cgroup در Linux وقتی Gateway داخل یک کانتینر یا سرویس با محدودیت حافظه اجرا می‌شود.

امضاهای رایج:

- `critical memory pressure bundle written` کمی قبل از راه‌اندازی مجدد ظاهر می‌شود → OpenClaw یک بسته پایداری پیش از OOM ثبت کرده است. آن را با `openclaw gateway stability --bundle latest` بررسی کنید.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` در لاگ‌های Gateway ظاهر می‌شود → OpenClaw فشار بحرانی حافظه را تشخیص داده، اما snapshot پایداری پیش از OOM خاموش است.
- `Largest session files:` به یک مسیر transcript ویرایش‌شده بسیار بزرگ اشاره می‌کند → تاریخچه نگهداری‌شده session را کاهش دهید، رشد session را بررسی کنید، یا پیش از راه‌اندازی مجدد transcriptهای قدیمی را از store فعال خارج کنید.
- بایت‌های استفاده‌شده در `V8 heap:` نزدیک به حد heap هستند → فشار prompt/session را کم کنید، کار هم‌زمان را کاهش دهید، یا فقط پس از تأیید اینکه بار کاری مورد انتظار است، حد heap مربوط به Node را افزایش دهید.
- `Memory pressure: critical/rss_growth` → حافظه در یک پنجره نمونه‌برداری به‌سرعت رشد کرده است. آخرین لاگ‌ها را برای یک import بزرگ، خروجی بی‌مهار ابزار، تلاش‌های تکراری، یا مجموعه‌ای از کارهای agent در صف بررسی کنید.
- فشار بحرانی حافظه در لاگ‌ها دیده می‌شود اما بسته‌ای وجود ندارد → این حالت پیش‌فرض است. `diagnostics.memoryPressureSnapshot: true` را تنظیم کنید تا در رویدادهای آینده فشار بحرانی حافظه، بسته پایداری پیش از OOM ثبت شود.

بسته پایداری بدون payload است. این بسته شواهد عملیاتی حافظه و مسیرهای نسبی فایل به‌صورت ویرایش‌شده را شامل می‌شود، نه متن پیام، بدنه‌های Webhook، اعتبارنامه‌ها، توکن‌ها، کوکی‌ها یا شناسه‌های خام session. به‌جای کپی کردن لاگ‌های خام، خروجی diagnostics را به گزارش‌های باگ پیوست کنید.

مرتبط:

- [سلامت Gateway](/fa/gateway/health)
- [خروجی diagnostics](/fa/gateway/diagnostics)
- [Sessionها](/fa/cli/sessions)

## Gateway پیکربندی نامعتبر را رد کرد

وقتی راه‌اندازی Gateway با `Invalid config` شکست می‌خورد یا لاگ‌های hot reload می‌گویند
یک ویرایش نامعتبر را نادیده گرفته است، از این بخش استفاده کنید.

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
- یک فایل دارای timestamp با نام `openclaw.json.rejected.*` کنار پیکربندی فعال
- یک فایل دارای timestamp با نام `openclaw.json.clobbered.*` اگر `doctor --fix` یک ویرایش مستقیم خراب را تعمیر کرده باشد
- OpenClaw برای هر مسیر پیکربندی، آخرین 32 فایل `.clobbered.*` را نگه می‌دارد و فایل‌های قدیمی‌تر را می‌چرخاند

<AccordionGroup>
  <Accordion title="What happened">
    - پیکربندی هنگام راه‌اندازی، hot reload، یا نوشتنِ تحت مالکیت OpenClaw اعتبارسنجی نشد.
    - راه‌اندازی Gateway به‌جای بازنویسی `openclaw.json` به‌صورت بسته شکست می‌خورد.
    - hot reload ویرایش‌های خارجی نامعتبر را رد می‌کند و پیکربندی runtime فعلی را فعال نگه می‌دارد.
    - نوشتن‌های تحت مالکیت OpenClaw، payloadهای نامعتبر/مخرب را پیش از commit رد می‌کنند و `.rejected.*` را ذخیره می‌کنند.
    - `openclaw doctor --fix` مالک تعمیر است. می‌تواند پیشوندهای غیر JSON را حذف کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند، در حالی که payload ردشده را به‌صورت `.clobbered.*` حفظ می‌کند.
    - وقتی تعمیرهای زیادی برای یک مسیر پیکربندی رخ دهد، OpenClaw فایل‌های قدیمی‌تر `.clobbered.*` را می‌چرخاند تا جدیدترین payload تعمیرشده همچنان در دسترس باشد.

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
    - `.rejected.*` وجود دارد → یک نوشتن پیکربندی تحت مالکیت OpenClaw پیش از commit در بررسی schema یا clobber شکست خورده است.
    - `Config write rejected:` → نوشتن تلاش کرده shape لازم را حذف کند، فایل را به‌طور شدید کوچک کند، یا پیکربندی نامعتبر را پایدار کند.
    - `config reload skipped (invalid config):` → یک ویرایش مستقیم در اعتبارسنجی شکست خورد و توسط Gateway در حال اجرا نادیده گرفته شد.
    - `Invalid config at ...` → راه‌اندازی پیش از بالا آمدن سرویس‌های Gateway شکست خورد.
    - `missing-meta-vs-last-good`، `gateway-mode-missing-vs-last-good`، یا `size-drop-vs-last-good:*` → یک نوشتن تحت مالکیت OpenClaw رد شد چون نسبت به پشتیبان آخرین نسخه سالم شناخته‌شده، فیلدها یا اندازه را از دست داده بود.
    - `Config last-known-good promotion skipped` → نامزد شامل placeholderهای secret ویرایش‌شده مانند `***` بود.

  </Accordion>
  <Accordion title="Fix options">
    1. `openclaw doctor --fix` را اجرا کنید تا doctor پیکربندی دارای پیشوند/خراب‌شده را تعمیر کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند.
    2. فقط کلیدهای مورد نظر را از `.clobbered.*` یا `.rejected.*` کپی کنید، سپس آن‌ها را با `openclaw config set` یا `config.patch` اعمال کنید.
    3. پیش از راه‌اندازی مجدد، `openclaw config validate` را اجرا کنید.
    4. اگر دستی ویرایش می‌کنید، پیکربندی کامل JSON5 را نگه دارید، نه فقط آبجکت جزئی‌ای را که می‌خواستید تغییر دهید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/cli/config)
- [پیکربندی: hot reload](/fa/gateway/configuration#config-hot-reload)
- [پیکربندی: اعتبارسنجی سخت‌گیرانه](/fa/gateway/configuration#strict-validation)
- [Doctor](/fa/gateway/doctor)

## هشدارهای probe برای Gateway

وقتی `openclaw gateway probe` به چیزی می‌رسد، اما همچنان یک بلوک هشدار چاپ می‌کند، از این بخش استفاده کنید.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

دنبال این موارد بگردید:

- `warnings[].code` و `primaryTargetId` در خروجی JSON.
- اینکه هشدار درباره fallback مربوط به SSH، چند Gateway، scopeهای گمشده، یا auth refهای حل‌نشده است.

امضاهای رایج:

- `SSH tunnel failed to start; falling back to direct probes.` → راه‌اندازی SSH شکست خورد، اما فرمان همچنان اهداف پیکربندی‌شده/loopback مستقیم را امتحان کرد.
- `multiple reachable gateway identities detected` → Gatewayهای متمایز پاسخ دادند، یا OpenClaw نتوانست ثابت کند اهداف در دسترس همان Gateway هستند. یک تونل SSH، نشانی proxy، یا نشانی remote پیکربندی‌شده به همان Gateway، حتی وقتی پورت‌های transport متفاوت باشند، به‌عنوان یک Gateway با چند transport در نظر گرفته می‌شود.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → اتصال برقرار شد، اما RPC جزئیات به‌دلیل scope محدود شده است؛ هویت دستگاه را pair کنید یا از اعتبارنامه‌هایی با `operator.read` استفاده کنید.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → اتصال برقرار شد، اما مجموعه کامل RPCهای diagnostic timeout شد یا شکست خورد. این را به‌عنوان یک Gateway در دسترس با diagnostics تنزل‌یافته در نظر بگیرید؛ `connect.ok` و `connect.rpcOk` را در خروجی `--json` مقایسه کنید.
- `Capability: pairing-pending` یا `gateway closed (1008): pairing required` → Gateway پاسخ داد، اما این client هنوز پیش از دسترسی عادی operator به pairing/approval نیاز دارد.
- متن هشدار SecretRef حل‌نشده `gateway.auth.*` / `gateway.remote.*` → ماده auth در این مسیر فرمان برای هدف شکست‌خورده در دسترس نبود.

مرتبط:

- [Gateway](/fa/cli/gateway)
- [چند Gateway روی یک میزبان](/fa/gateway#multiple-gateways-same-host)
- [دسترسی remote](/fa/gateway/remote)

## کانال وصل است، اما پیام‌ها جریان ندارند

اگر وضعیت کانال connected است اما جریان پیام قطع شده، روی policy، permissionها و قواعد تحویل مخصوص کانال تمرکز کنید.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

دنبال این موارد بگردید:

- policy مربوط به DM (`pairing`، `allowlist`، `open`، `disabled`).
- allowlist گروه و الزامات mention.
- permissionها/scopeهای گمشده API کانال.

امضاهای رایج:

- `mention required` → پیام به‌دلیل policy مربوط به mention گروه نادیده گرفته شد.
- ردپاهای `pairing` / pending approval → فرستنده تأیید نشده است.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشکل auth/permission کانال.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [Discord](/fa/channels/discord)
- [Telegram](/fa/channels/telegram)
- [WhatsApp](/fa/channels/whatsapp)

## تحویل Cron و Heartbeat

اگر Cron یا Heartbeat اجرا نشد یا تحویل داده نشد، ابتدا وضعیت scheduler و سپس هدف تحویل را بررسی کنید.

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
    - `cron: scheduler disabled; jobs will not run automatically` → cron غیرفعال است.
    - `cron: timer tick failed` → تیک زمان‌بند شکست خورد؛ خطاهای فایل/لاگ/زمان اجرا را بررسی کنید.
    - `heartbeat skipped` با `reason=quiet-hours` → خارج از بازه ساعت‌های فعال.
    - `heartbeat skipped` با `reason=empty-heartbeat-file` → `HEARTBEAT.md` وجود دارد اما فقط شامل فضای خالی، کامنت، سربرگ، حصار، یا داربست چک‌لیست خالی است، بنابراین OpenClaw فراخوانی مدل را رد می‌کند.
    - `heartbeat skipped` با `reason=no-tasks-due` → `HEARTBEAT.md` شامل یک بلوک `tasks:` است، اما هیچ‌کدام از کارها در این تیک موعد اجرا ندارند.
    - `heartbeat: unknown accountId` → شناسه حساب برای مقصد تحویل Heartbeat نامعتبر است.
    - `heartbeat skipped` با `reason=dm-blocked` → مقصد Heartbeat به یک مقصد سبک DM تبدیل شده، در حالی که `agents.defaults.heartbeat.directPolicy` (یا بازنویسی مخصوص عامل) روی `block` تنظیم شده است.

  </Accordion>
</AccordionGroup>

مرتبط:

- [Heartbeat](/fa/gateway/heartbeat)
- [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
- [کارهای زمان‌بندی‌شده: عیب‌یابی](/fa/automation/cron-jobs#troubleshooting)

## Node جفت شده، ابزار شکست می‌خورد

اگر یک node جفت شده اما ابزارها شکست می‌خورند، وضعیت پیش‌زمینه، مجوز، و تأیید را جداگانه بررسی کنید.

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

- `NODE_BACKGROUND_UNAVAILABLE` → برنامه node باید در پیش‌زمینه باشد.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → مجوز سیستم‌عامل موجود نیست.
- `SYSTEM_RUN_DENIED: approval required` → تأیید exec در انتظار است.
- `SYSTEM_RUN_DENIED: allowlist miss` → فرمان توسط allowlist مسدود شده است.

مرتبط:

- [تأییدهای exec](/fa/tools/exec-approvals)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
- [Nodes](/fa/nodes/index)

## ابزار مرورگر شکست می‌خورد

وقتی کنش‌های ابزار مرورگر شکست می‌خورند اما خود gateway سالم است، از این استفاده کنید.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

دنبال این موارد بگردید:

- اینکه آیا `plugins.allow` تنظیم شده و شامل `browser` هست یا نه.
- مسیر اجرایی معتبر مرورگر.
- دسترس‌پذیری پروفایل CDP.
- دسترس‌پذیری Chrome محلی برای پروفایل‌های `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="امضاهای Plugin / فایل اجرایی">
    - `unknown command "browser"` یا `unknown command 'browser'` → plugin مرورگر همراه، توسط `plugins.allow` حذف شده است.
    - ابزار مرورگر گم‌شده / در دسترس نیست در حالی که `browser.enabled=true` → `plugins.allow` شامل `browser` نیست، بنابراین plugin هرگز بارگذاری نشده است.
    - `Failed to start Chrome CDP on port` → فرایند مرورگر اجرا نشد.
    - `browser.executablePath not found` → مسیر پیکربندی‌شده نامعتبر است.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL پیکربندی‌شده CDP از یک scheme پشتیبانی‌نشده مانند `file:` یا `ftp:` استفاده می‌کند.
    - `browser.cdpUrl has invalid port` → URL پیکربندی‌شده CDP پورت بد یا خارج از محدوده دارد.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → نصب فعلی gateway وابستگی اصلی زمان اجرای مرورگر را ندارد؛ OpenClaw را دوباره نصب یا به‌روزرسانی کنید، سپس gateway را بازراه‌اندازی کنید. snapshotهای ARIA و screenshotهای پایه صفحه همچنان می‌توانند کار کنند، اما ناوبری، snapshotهای AI، screenshotهای عنصر با selector CSS، و خروجی PDF همچنان در دسترس نمی‌مانند.

  </Accordion>
  <Accordion title="امضاهای Chrome MCP / نشست موجود">
    - `Could not find DevToolsActivePort for chrome` → نشست موجود Chrome MCP هنوز نتوانسته به data dir مرورگر انتخاب‌شده متصل شود. صفحه inspect مرورگر را باز کنید، remote debugging را فعال کنید، مرورگر را باز نگه دارید، نخستین درخواست attach را تأیید کنید، سپس دوباره تلاش کنید. اگر وضعیت ورود به حساب لازم نیست، پروفایل مدیریت‌شده `openclaw` را ترجیح دهید.
    - `No Chrome tabs found for profile="user"` → پروفایل attach در Chrome MCP هیچ تب محلی باز Chrome ندارد.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint ریموت CDP پیکربندی‌شده از میزبان gateway قابل دسترسی نیست.
    - `Browser attachOnly is enabled ... not reachable` یا `Browser attachOnly is enabled and CDP websocket ... is not reachable` → پروفایل فقط-attach هیچ هدف قابل دسترسی ندارد، یا endpoint HTTP پاسخ داده اما WebSocket مربوط به CDP همچنان باز نشده است.

  </Accordion>
  <Accordion title="امضاهای عنصر / screenshot / upload">
    - `fullPage is not supported for element screenshots` → درخواست screenshot، `--full-page` را با `--ref` یا `--element` ترکیب کرده است.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → فراخوانی‌های screenshot در Chrome MCP / `existing-session` باید از capture صفحه یا `--ref` مربوط به snapshot استفاده کنند، نه `--element` در CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hookهای upload در Chrome MCP به refهای snapshot نیاز دارند، نه selectorهای CSS.
    - `existing-session file uploads currently support one file at a time.` → روی پروفایل‌های Chrome MCP در هر فراخوانی یک upload ارسال کنید.
    - `existing-session dialog handling does not support timeoutMs.` → hookهای dialog روی پروفایل‌های Chrome MCP از بازنویسی timeout پشتیبانی نمی‌کنند.
    - `existing-session type does not support timeoutMs overrides.` → برای `act:type` روی پروفایل‌های `profile="user"` / نشست موجود Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از یک پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `existing-session evaluate does not support timeoutMs overrides.` → برای `act:evaluate` روی پروفایل‌های `profile="user"` / نشست موجود Chrome MCP، `timeoutMs` را حذف کنید، یا وقتی timeout سفارشی لازم است از یک پروفایل مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارد.
    - بازنویسی‌های کهنه viewport / dark-mode / locale / offline روی پروفایل‌های فقط-attach یا CDP ریموت → برای بستن نشست کنترل فعال و آزاد کردن وضعیت emulation در Playwright/CDP بدون بازراه‌اندازی کل gateway، `openclaw browser stop --browser-profile <name>` را اجرا کنید.

  </Accordion>
</AccordionGroup>

مرتبط:

- [مرورگر (مدیریت‌شده توسط OpenClaw)](/fa/tools/browser)
- [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting)

## اگر ارتقا دادید و چیزی ناگهان خراب شد

بیشتر خرابی‌های پس از ارتقا ناشی از drift پیکربندی یا اعمال شدن پیش‌فرض‌های سخت‌گیرانه‌تر است.

<AccordionGroup>
  <Accordion title="۱. رفتار بازنویسی احراز هویت و URL تغییر کرده است">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    چه چیزی را بررسی کنید:

    - اگر `gateway.mode=remote` باشد، فراخوانی‌های CLI ممکن است remote را هدف بگیرند در حالی که سرویس محلی شما سالم است.
    - فراخوانی‌های صریح `--url` به credentials ذخیره‌شده fallback نمی‌کنند.

    امضاهای رایج:

    - `gateway connect failed:` → هدف URL اشتباه است.
    - `unauthorized` → endpoint قابل دسترسی است اما احراز هویت اشتباه است.

  </Accordion>
  <Accordion title="۲. محافظ‌های bind و auth سخت‌گیرانه‌تر هستند">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    چه چیزی را بررسی کنید:

    - bindهای غیر-loopback (`lan`، `tailnet`، `custom`) به یک مسیر معتبر auth برای gateway نیاز دارند: احراز هویت با توکن/گذرواژه مشترک، یا یک استقرار `trusted-proxy` غیر-loopback که درست پیکربندی شده باشد.
    - کلیدهای قدیمی مانند `gateway.token` جایگزین `gateway.auth.token` نمی‌شوند.

    امضاهای رایج:

    - `refusing to bind gateway ... without auth` → bind غیر-loopback بدون مسیر معتبر auth برای gateway.
    - `Connectivity probe: failed` در حالی که runtime در حال اجراست → gateway زنده است اما با auth/url فعلی قابل دسترسی نیست.

  </Accordion>
  <Accordion title="۳. وضعیت جفت‌سازی و هویت دستگاه تغییر کرده است">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    چه چیزی را بررسی کنید:

    - تأییدهای در انتظار دستگاه برای داشبورد/nodes.
    - تأییدهای در انتظار جفت‌سازی DM پس از تغییرات سیاست یا هویت.

    امضاهای رایج:

    - `device identity required` → احراز هویت دستگاه برآورده نشده است.
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
- [جفت‌سازی تحت مالکیت Gateway](/fa/gateway/pairing)

## مرتبط

- [Doctor](/fa/gateway/doctor)
- [پرسش‌های متداول](/fa/help/faq)
- [Runbook Gateway](/fa/gateway)
