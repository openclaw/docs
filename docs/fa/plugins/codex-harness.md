---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی چارچوب اجرای Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI، با شکست مواجه شوند
summary: نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: چارچوب اجرای Codex
x-i18n:
    generated_at: "2026-04-29T23:14:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8eba5cb48c94fe38392d85c9d5c79a7829a2fa7eaba81715f4449d39d7d0dea
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin بسته‌بندی‌شدهٔ `codex` به OpenClaw اجازه می‌دهد turnهای agent تعبیه‌شده را از طریق
app-server Codex اجرا کند، نه harness داخلی PI.

از این گزینه زمانی استفاده کنید که می‌خواهید Codex مالک session سطح پایین agent باشد: کشف
model، resume بومی thread، Compaction بومی، و اجرای app-server.
OpenClaw همچنان مالک channelهای chat، فایل‌های session، انتخاب model، toolها،
approvalها، تحویل media، و mirror قابل مشاهدهٔ transcript است.

اگر می‌خواهید مسیر را پیدا کنید، از
[Runtimeهای agent](/fa/concepts/agent-runtimes) شروع کنید. نسخهٔ کوتاه این است:
`openai/gpt-5.5` همان ref مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا channel دیگری همچنان سطح ارتباطی باقی می‌ماند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin بسته‌بندی‌شدهٔ `codex` چند قابلیت جداگانه اضافه می‌کند:

| قابلیت                           | چگونه از آن استفاده می‌کنید                            | چه کاری انجام می‌دهد                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime تعبیه‌شدهٔ بومی           | `agentRuntime.id: "codex"`                          | turnهای agent تعبیه‌شدهٔ OpenClaw را از طریق app-server Codex اجرا می‌کند.                  |
| فرمان‌های بومی کنترل chat      | `/codex bind`, `/codex resume`, `/codex steer`, ... | threadهای app-server Codex را از یک گفت‌وگوی پیام‌رسان bind و کنترل می‌کند.    |
| Provider/catalog app-server Codex | درونی‌های `codex`، که از طریق harness ارائه می‌شوند     | به runtime اجازه می‌دهد modelهای app-server را کشف و اعتبارسنجی کند.                     |
| مسیر درک media در Codex    | مسیرهای سازگاری image-model در `codex/*`           | turnهای محدود app-server Codex را برای modelهای پشتیبانی‌شدهٔ درک تصویر اجرا می‌کند. |
| Relay بومی hook                 | hookهای Plugin پیرامون eventهای بومی Codex             | به OpenClaw اجازه می‌دهد eventهای پشتیبانی‌شدهٔ tool/finalization بومی Codex را مشاهده/مسدود کند.  |

فعال کردن Plugin این قابلیت‌ها را در دسترس قرار می‌دهد. این کار **موارد زیر را انجام نمی‌دهد**:

- شروع به استفاده از Codex برای هر مدل OpenAI
- تبدیل refهای مدل `openai-codex/*` به runtime بومی
- تبدیل ACP/acpx به مسیر پیش‌فرض Codex
- hot-switch کردن sessionهای موجودی که قبلا runtime نوع PI ثبت کرده‌اند
- جایگزینی تحویل channel در OpenClaw، فایل‌های session، ذخیره‌سازی auth-profile، یا
  message routing

همین Plugin همچنین مالک سطح فرمان بومی کنترل chat یعنی `/codex` است. اگر
Plugin فعال باشد و کاربر بخواهد threadهای Codex را از chat bind، resume، steer، stop، یا inspect کند، agentها باید `/codex ...` را بر ACP ترجیح دهند. ACP وقتی کاربر ACP/acpx را درخواست می‌کند یا در حال آزمایش adapter Codex برای ACP است، fallback صریح باقی می‌ماند.

turnهای بومی Codex، hookهای Plugin در OpenClaw را به‌عنوان لایهٔ عمومی سازگاری نگه می‌دارند.
این‌ها hookهای درون‌پردازشی OpenClaw هستند، نه hookهای فرمان Codex در `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای mirror شدهٔ transcript
- `before_agent_finalize` از طریق relay نوع Codex `Stop`
- `agent_end`

Pluginها همچنین می‌توانند middleware خنثی نسبت به runtime برای نتیجهٔ tool ثبت کنند تا
نتایج dynamic tool در OpenClaw را پس از اجرای tool توسط OpenClaw و پیش از
بازگرداندن نتیجه به Codex بازنویسی کنند. این از hook عمومی Plugin به نام
`tool_result_persist` جداست، که writeهای tool-result متعلق به OpenClaw در transcript را transform می‌کند.

برای خود semanticsهای hookهای Plugin، [hookهای Plugin](/fa/plugins/hooks)
و [رفتار guard در Plugin](/fa/tools/plugin) را ببینید.

harness به‌صورت پیش‌فرض خاموش است. configهای جدید باید refهای مدل OpenAI را
به‌صورت canonical یعنی `openai/gpt-*` نگه دارند و وقتی اجرای بومی app-server را می‌خواهند،
به‌طور صریح
`agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex` را force کنند. refهای legacy مدل `codex/*` همچنان برای سازگاری به‌طور خودکار
harness را انتخاب می‌کنند، اما prefixهای legacy provider که پشتوانهٔ runtime دارند
به‌عنوان انتخاب‌های عادی model/provider نشان داده نمی‌شوند.

اگر Plugin‏ `codex` فعال باشد اما مدل اصلی همچنان
`openai-codex/*` باشد، `openclaw doctor` به‌جای تغییر route هشدار می‌دهد. این
عمدی است: `openai-codex/*` همچنان مسیر OAuth/subscription نوع PI برای Codex است، و
اجرای بومی app-server یک انتخاب صریح runtime باقی می‌ماند.

## نقشهٔ route

پیش از تغییر config از این جدول استفاده کنید:

| رفتار مطلوب                            | Ref مدل                  | config runtime                         | نیازمندی Plugin          | برچسب وضعیت مورد انتظار          |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API از طریق runner عادی OpenClaw   | `openai/gpt-*`             | حذف‌شده یا `runtime: "pi"`             | provider OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/subscription Codex از طریق PI         | `openai-codex/gpt-*`       | حذف‌شده یا `runtime: "pi"`             | provider OAuth نوع OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| turnهای تعبیه‌شدهٔ بومی app-server Codex      | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin‏ `codex`              | `Runtime: OpenAI Codex`        |
| providerهای ترکیبی با حالت auto محافظه‌کارانه | refهای مخصوص provider     | `agentRuntime.id: "auto"`              | runtimeهای اختیاری Plugin    | به runtime انتخاب‌شده بستگی دارد    |
| session صریح adapter ACP برای Codex          | وابسته به prompt/model در ACP | `sessions_spawn` با `runtime: "acp"` | backend سالم `acpx`      | وضعیت task/session در ACP        |

تفکیک مهم، provider در برابر runtime است:

- `openai-codex/*` پاسخ می‌دهد «PI باید از کدام مسیر provider/auth استفاده کند؟»
- `agentRuntime.id: "codex"` پاسخ می‌دهد «کدام loop باید این
  turn تعبیه‌شده را اجرا کند؟»
- `/codex ...` پاسخ می‌دهد «این chat باید کدام گفت‌وگوی بومی Codex را bind
  یا کنترل کند؟»
- ACP پاسخ می‌دهد «acpx باید کدام فرایند harness خارجی را launch کند؟»

## Prefix درست مدل را انتخاب کنید

routeهای خانوادهٔ OpenAI وابسته به prefix هستند. وقتی OAuth نوع Codex را از طریق PI می‌خواهید از `openai-codex/*` استفاده کنید؛ وقتی دسترسی مستقیم OpenAI API را می‌خواهید یا
harness بومی app-server Codex را force می‌کنید از `openai/*` استفاده کنید:

| Ref مدل                                     | مسیر runtime                                 | زمان استفاده                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | provider OpenAI از طریق plumbing OpenClaw/PI | دسترسی فعلی مستقیم به OpenAI Platform API را با `OPENAI_API_KEY` می‌خواهید. |
| `openai-codex/gpt-5.5`                        | OAuth نوع OpenAI Codex از طریق OpenClaw/PI       | auth اشتراکی ChatGPT/Codex را با runner پیش‌فرض PI می‌خواهید.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | harness app-server Codex                     | اجرای بومی app-server Codex را برای turn تعبیه‌شدهٔ agent می‌خواهید.   |

GPT-5.5 در OpenClaw در حال حاضر فقط subscription/OAuth است. برای OAuth نوع PI از
`openai-codex/gpt-5.5` استفاده کنید، یا از `openai/gpt-5.5` همراه با harness
app-server Codex. دسترسی مستقیم با API key برای `openai/gpt-5.5` زمانی پشتیبانی می‌شود
که OpenAI، GPT-5.5 را روی API عمومی فعال کند.

refهای legacy‏ `codex/gpt-*` همچنان به‌عنوان aliasهای سازگاری پذیرفته می‌شوند. migration
سازگاری doctor، refهای legacy اصلی runtime را به refهای canonical مدل بازنویسی می‌کند
و policy runtime را جداگانه ثبت می‌کند، در حالی که refهای legacy فقط-fallback
بدون تغییر می‌مانند، چون runtime برای کل container agent پیکربندی می‌شود.
configهای جدید PI Codex OAuth باید از `openai-codex/gpt-*` استفاده کنند؛ configهای جدید
harness بومی app-server باید از `openai/gpt-*` به‌همراه
`agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همان تفکیک prefix پیروی می‌کند. وقتی درک تصویر باید از مسیر provider OAuth نوع OpenAI
Codex اجرا شود از
`openai-codex/gpt-*` استفاده کنید. وقتی درک تصویر باید از طریق یک turn محدود app-server Codex اجرا شود از `codex/gpt-*` استفاده کنید. مدل app-server Codex باید
پشتیبانی از ورودی تصویر را advertise کند؛ مدل‌های فقط-متن Codex پیش از شروع turn media
fail می‌شوند.

برای تأیید harness مؤثر برای session فعلی از `/status` استفاده کنید. اگر
انتخاب غیرمنتظره است، debug logging را برای subsystem‏ `agents/harness` فعال کنید
و رکورد structured در gateway با عنوان `agent harness selected` را inspect کنید. این رکورد
شناسهٔ harness انتخاب‌شده، دلیل انتخاب، policy runtime/fallback، و در حالت `auto`، نتیجهٔ support هر candidate مربوط به Plugin را شامل می‌شود.

### هشدارهای doctor یعنی چه

`openclaw doctor` وقتی همهٔ موارد زیر درست باشند هشدار می‌دهد:

- Plugin بسته‌بندی‌شدهٔ `codex` فعال یا مجاز است
- مدل اصلی یک agent برابر `openai-codex/*` است
- runtime مؤثر آن agent برابر `codex` نیست

این هشدار وجود دارد چون کاربران اغلب انتظار دارند «Plugin‏ Codex فعال» به معنی
«runtime بومی app-server Codex» باشد. OpenClaw چنین جهشی انجام نمی‌دهد. هشدار
یعنی:

- اگر قصد شما ChatGPT/Codex OAuth از طریق PI بوده، **هیچ تغییری لازم نیست**.
- اگر قصد شما اجرای بومی app-server بوده، مدل را به `openai/<model>` تغییر دهید و
  `agentRuntime.id: "codex"` را set کنید.
- sessionهای موجود پس از تغییر runtime همچنان به `/new` یا `/reset` نیاز دارند،
  چون pinهای runtime در session چسبنده هستند.

انتخاب harness کنترل زندهٔ session نیست. وقتی یک turn تعبیه‌شده اجرا می‌شود،
OpenClaw شناسهٔ harness انتخاب‌شده را روی آن session ثبت می‌کند و برای
turnهای بعدی با همان شناسهٔ session به استفاده از آن ادامه می‌دهد. وقتی می‌خواهید sessionهای آینده از harness دیگری استفاده کنند، config‏ `agentRuntime` یا
`OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛ برای شروع session تازه پیش از جابه‌جایی یک
گفت‌وگوی موجود بین PI و Codex از `/new` یا `/reset` استفاده کنید. این از replay شدن یک transcript از طریق
دو سیستم session بومی ناسازگار جلوگیری می‌کند.

sessionهای legacy که پیش از pinهای harness ساخته شده‌اند، پس از داشتن
history در transcript به‌عنوان PI-pinned در نظر گرفته می‌شوند. برای وارد کردن آن گفت‌وگو به
Codex پس از تغییر config از `/new` یا `/reset` استفاده کنید.

`/status` runtime مؤثر مدل را نشان می‌دهد. harness پیش‌فرض PI به‌صورت
`Runtime: OpenClaw Pi Default` ظاهر می‌شود، و harness app-server Codex به‌صورت
`Runtime: OpenAI Codex`.

## نیازمندی‌ها

- OpenClaw با Plugin بسته‌بندی‌شدهٔ `codex` در دسترس.
- app-server Codex نسخهٔ `0.125.0` یا جدیدتر. Plugin بسته‌بندی‌شده به‌صورت پیش‌فرض یک binary سازگار
  app-server Codex را مدیریت می‌کند، پس فرمان‌های local‏ `codex` در `PATH` روی
  startup عادی harness اثر نمی‌گذارند.
- auth مربوط به Codex در دسترس process app-server یا bridge auth نوع Codex در OpenClaw.

Plugin handshakeهای app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار
OpenClaw را روی سطح protocolی نگه می‌دارد که در برابر آن آزمایش شده است.

برای smoke testهای live و Docker، auth معمولا از account در Codex CLI
یا یک auth profile نوع `openai-codex` در OpenClaw می‌آید. launchهای local stdio app-server
همچنین وقتی account وجود ندارد می‌توانند به `CODEX_API_KEY` / `OPENAI_API_KEY` fallback کنند.

## حداقل config

از `openai/gpt-5.5` استفاده کنید، Plugin بسته‌بندی‌شده را فعال کنید، و harness‏ `codex` را force کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

اگر config شما از `plugins.allow` استفاده می‌کند، `codex` را آنجا هم include کنید:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

configهای legacy که `agents.defaults.model` یا مدل یک agent را روی
`codex/<model>` set می‌کنند همچنان Plugin بسته‌بندی‌شدهٔ `codex` را به‌طور خودکار فعال می‌کنند. configهای جدید باید
`openai/<model>` به‌همراه entry صریح `agentRuntime` بالا را ترجیح دهند.

## Codex را کنار مدل‌های دیگر اضافه کنید

اگر همان agent باید آزادانه بین modelهای Codex و providerهای غیر-Codex جابه‌جا شود، `agentRuntime.id: "codex"` را به‌صورت global set نکنید. یک runtime force شده روی هر
turn تعبیه‌شده برای آن agent یا session اعمال می‌شود. اگر وقتی
آن runtime force شده است یک مدل Anthropic انتخاب کنید، OpenClaw همچنان harness Codex را امتحان می‌کند و
به‌جای route کردن بی‌صدای آن turn از طریق PI، fail closed می‌شود.

به‌جای آن از یکی از این شکل‌ها استفاده کنید:

- Codex را روی یک عامل اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- عامل پیش‌فرض را روی `agentRuntime.id: "auto"` و fallback مربوط به Pi برای استفاده عادیِ ترکیبی از
  providerها نگه دارید.
- refهای legacy `codex/*` را فقط برای سازگاری استفاده کنید. configهای جدید باید
  `openai/*` را همراه با یک policy صریح runtime برای Codex ترجیح دهند.

برای مثال، این شکل عامل پیش‌فرض را روی انتخاب خودکار عادی نگه می‌دارد و
یک عامل Codex جداگانه اضافه می‌کند:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

با این شکل:

- عامل پیش‌فرض `main` از مسیر provider عادی و fallback سازگاری Pi استفاده می‌کند.
- عامل `codex` از harness سرور اپ Codex استفاده می‌کند.
- اگر Codex برای عامل `codex` وجود نداشته باشد یا پشتیبانی نشود، turn شکست می‌خورد
  به‌جای اینکه بی‌سروصدا از Pi استفاده کند.

## مسیریابی فرمان عامل

عامل‌ها باید درخواست‌های کاربر را بر اساس intent مسیریابی کنند، نه فقط بر اساس واژه «Codex»:

| کاربر درخواست می‌کند...                                  | عامل باید استفاده کند...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| «این chat را به Codex bind کن»                           | `/codex bind`                                    |
| «thread مربوط به Codex با شناسه `<id>` را اینجا resume کن» | `/codex resume <id>`                             |
| «threadهای Codex را نشان بده»                            | `/codex threads`                                 |
| «برای یک اجرای بد Codex یک گزارش پشتیبانی ثبت کن»        | `/diagnostics [note]`                            |
| «فقط برای این thread پیوست‌شده feedback مربوط به Codex بفرست» | `/codex diagnostics [note]`                      |
| «از Codex به‌عنوان runtime برای این عامل استفاده کن»      | تغییر config به `agentRuntime.id`                |
| «از subscription ChatGPT/Codex من با OpenClaw عادی استفاده کن» | refهای مدل `openai-codex/*`                      |
| «Codex را از طریق ACP/acpx اجرا کن»                       | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| «Claude Code/Gemini/OpenCode/Cursor را در یک thread شروع کن» | ACP/acpx، نه `/codex` و نه sub-agentهای بومی     |

OpenClaw فقط زمانی راهنمایی ACP spawn را به عامل‌ها advertise می‌کند که ACP فعال،
قابل dispatch، و توسط یک runtime backend بارگذاری‌شده پشتیبانی شده باشد. اگر ACP در دسترس نباشد،
system prompt و Skills مربوط به Plugin نباید مسیریابی ACP را به عامل آموزش دهند.

## deploymentهای فقط Codex

وقتی باید ثابت کنید که هر turn عامل embedشده از Codex استفاده می‌کند،
harness مربوط به Codex را force کنید. runtimeهای Plugin صریح به‌صورت پیش‌فرض fallback به Pi ندارند، بنابراین
`fallback: "none"` اختیاری است اما اغلب به‌عنوان documentation مفید است:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

override محیط:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

وقتی Codex force شده باشد، اگر Plugin مربوط به Codex غیرفعال باشد، سرور اپ
خیلی قدیمی باشد، یا سرور اپ نتواند شروع شود، OpenClaw زود شکست می‌خورد. فقط زمانی
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` را تنظیم کنید که عمدا می‌خواهید Pi انتخاب harness
ناموجود را مدیریت کند.

## Codex برای هر عامل

می‌توانید یک عامل را فقط Codex کنید در حالی که عامل پیش‌فرض انتخاب خودکار
عادی را نگه می‌دارد:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

برای جابه‌جایی عامل‌ها و مدل‌ها از فرمان‌های session عادی استفاده کنید. `/new` یک
session تازه OpenClaw می‌سازد و harness مربوط به Codex در صورت نیاز thread
sidecar سرور اپ خود را ایجاد یا resume می‌کند. `/reset` binding مربوط به session
OpenClaw را برای آن thread پاک می‌کند و اجازه می‌دهد turn بعدی دوباره harness را از config فعلی resolve کند.

## کشف مدل

به‌صورت پیش‌فرض، Plugin مربوط به Codex از سرور اپ مدل‌های موجود را می‌پرسد. اگر
discovery شکست بخورد یا timeout شود، از یک catalog fallback bundled برای موارد زیر استفاده می‌کند:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

می‌توانید discovery را زیر `plugins.entries.codex.config.discovery` تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

وقتی می‌خواهید startup از probe کردن Codex پرهیز کند و به catalog
fallback پایبند بماند، discovery را غیرفعال کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## اتصال سرور اپ و policy

به‌صورت پیش‌فرض، Plugin باینری managed مربوط به Codex در OpenClaw را به‌صورت local با این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری managed به‌عنوان یک وابستگی runtime bundled Plugin تعریف شده و همراه با بقیه
وابستگی‌های Plugin `codex` staged می‌شود. این کار نسخه سرور اپ را به Plugin
bundled گره می‌زند، نه به هر Codex CLI جداگانه‌ای که اتفاقا به‌صورت local نصب شده است.
فقط زمانی `appServer.command` را تنظیم کنید که عمدا می‌خواهید یک executable متفاوت را اجرا کنید.

به‌صورت پیش‌فرض، OpenClaw sessionهای local harness مربوط به Codex را در حالت YOLO شروع می‌کند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این posture اپراتور local مورد اعتماد است که برای
Heartbeatهای autonomous استفاده می‌شود: Codex می‌تواند از shell و ابزارهای network استفاده کند، بدون اینکه
روی promptهای approval بومی که کسی برای پاسخ‌دادن به آن‌ها حاضر نیست متوقف شود.

برای opt in به approvalهای بررسی‌شده توسط guardian در Codex، `appServer.mode:
"guardian"` را تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

حالت Guardian از مسیر approval با auto-review بومی Codex استفاده می‌کند. وقتی Codex درخواست می‌کند
از sandbox خارج شود، بیرون از workspace بنویسد، یا permissionهایی مثل دسترسی network
اضافه کند، Codex آن درخواست approval را به reviewer بومی route می‌کند، نه به یک
prompt انسانی. reviewer چارچوب risk مربوط به Codex را اعمال می‌کند و درخواست
مشخص را approve یا deny می‌کند. وقتی guardrailهای بیشتری نسبت به حالت YOLO می‌خواهید
اما همچنان لازم دارید عامل‌های unattended پیشرفت کنند، از Guardian استفاده کنید.

preset مربوط به `guardian` به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` expand می‌شود.
fieldهای policy جداگانه همچنان `mode` را override می‌کنند، بنابراین deploymentهای advanced می‌توانند
preset را با انتخاب‌های صریح ترکیب کنند. مقدار reviewer قدیمی‌تر `guardian_subagent`
هنوز به‌عنوان alias سازگاری پذیرفته می‌شود، اما configهای جدید باید از
`auto_review` استفاده کنند.

برای یک سرور اپ که از قبل در حال اجراست، از transport مربوط به WebSocket استفاده کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

launchهای سرور اپ stdio به‌صورت پیش‌فرض محیط process مربوط به OpenClaw را inherit می‌کنند،
اما OpenClaw مالک bridge حساب سرور اپ Codex است. Auth به این ترتیب انتخاب می‌شود:

1. یک profile صریح OpenClaw Codex auth برای عامل.
2. حساب موجود سرور اپ، مثل sign-in محلی ChatGPT در Codex CLI.
3. فقط برای launchهای local stdio سرور اپ، `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب سرور اپی وجود ندارد و auth مربوط به OpenAI
   هنوز لازم است.

وقتی OpenClaw یک profile auth از نوع subscription ChatGPT برای Codex می‌بیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از child process مربوط به Codex که spawn شده حذف می‌کند. این کار
کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد،
بدون اینکه turnهای بومی سرور اپ Codex تصادفا از طریق API bill شوند.
profileهای صریح Codex API-key و fallback کلید env در local stdio از login سرور اپ
به‌جای env به‌ارث‌رسیده child process استفاده می‌کنند. اتصال‌های WebSocket سرور اپ
fallback کلید API از env مربوط به Gateway را دریافت نمی‌کنند؛ از یک profile auth صریح یا
حساب خود سرور اپ remote استفاده کنید.

اگر یک deployment به isolation محیطی بیشتری نیاز دارد، آن variableها را به
`appServer.clearEnv` اضافه کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` فقط روی child process سرور اپ Codex که spawn شده اثر می‌گذارد.

fieldهای پشتیبانی‌شده `appServer`:

| فیلد               | پیش‌فرض                                  | معنی                                                                                                                             |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                            |
| `command`           | باینری مدیریت‌شده Codex                     | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده تنظیم‌نشده بگذارید؛ فقط برای بازنویسی صریح آن را تنظیم کنید.                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | آرگومان‌ها برای انتقال stdio.                                                                                                      |
| `url`               | تنظیم‌نشده                                    | نشانی URL اپ‌سرور WebSocket.                                                                                                           |
| `authToken`         | تنظیم‌نشده                                    | توکن Bearer برای انتقال WebSocket.                                                                                               |
| `headers`           | `{}`                                     | سربرگ‌های اضافی WebSocket.                                                                                                            |
| `clearEnv`          | `[]`                                     | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند اپ‌سرور stdio اجراشده حذف می‌شوند. |
| `requestTimeoutMs`  | `60000`                                  | زمان انقضا برای فراخوانی‌های control-plane اپ‌سرور.                                                                                         |
| `mode`              | `"yolo"`                                 | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان.                                                                                     |
| `approvalPolicy`    | `"never"`                                | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت نخ ارسال می‌شود.                                                                      |
| `sandbox`           | `"danger-full-access"`                   | حالت sandbox بومی Codex که به شروع/ازسرگیری نخ ارسال می‌شود.                                                                              |
| `approvalsReviewer` | `"user"`                                 | برای اینکه Codex درخواست‌های تأیید بومی را بازبینی کند، از `"auto_review"` استفاده کنید. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                        |
| `serviceTier`       | تنظیم‌نشده                                    | سطح سرویس اختیاری اپ‌سرور Codex: `"fast"`، `"flex"`، یا `null`. مقدارهای قدیمی نامعتبر نادیده گرفته می‌شوند.                           |

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست Codex از نوع `item/tool/call` باید ظرف
۳۰ ثانیه یک پاسخ OpenClaw دریافت کند. در صورت انقضا، OpenClaw در جاهایی که پشتیبانی می‌شود سیگنال ابزار را
لغو می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا
نوبت بتواند ادامه یابد، به‌جای اینکه نشست در حالت `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست اپ‌سرور در محدوده نوبت Codex پاسخ می‌دهد، چارچوب آزمون
همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر
اپ‌سرور پس از آن پاسخ به مدت ۶۰ ثانیه ساکت بماند، OpenClaw به‌صورت best-effort
نوبت Codex را interrupt می‌کند، یک انقضای تشخیصی ثبت می‌کند و مسیر نشست
OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه
صف نشوند.

بازنویسی‌های محیطی همچنان برای آزمون محلی در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا
برای آزمون محلی یک‌باره از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. برای استقرارهای
تکرارپذیر، پیکربندی ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد
که بقیه تنظیمات چارچوب Codex در آن قرار دارد.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw اپ کنترل دسکتاپ را vendor نمی‌کند و خودش
کنش‌های دسکتاپ را اجرا نمی‌کند. اپ‌سرور Codex را آماده می‌کند، بررسی می‌کند که
سرور MCP با نام `computer-use` در دسترس است، و سپس اجازه می‌دهد Codex فراخوانی‌های
ابزار MCP بومی را در طول نوبت‌های حالت Codex مدیریت کند.

برای دسترسی مستقیم به درایور TryCua خارج از جریان marketplace Codex،
`cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ثبت کنید.
برای تفاوت بین استفاده از رایانه متعلق به Codex و ثبت مستقیم MCP، [استفاده از رایانه در Codex](/fa/plugins/codex-computer-use) را ببینید.

پیکربندی حداقلی:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

راه‌اندازی را می‌توان از سطح فرمان بررسی یا نصب کرد:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

استفاده از رایانه مخصوص macOS است و ممکن است پیش از اینکه سرور MCP متعلق به
Codex بتواند اپ‌ها را کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته باشد. اگر `computerUse.enabled` true باشد و سرور MCP
در دسترس نباشد، نوبت‌های حالت Codex پیش از شروع نخ شکست می‌خورند، به‌جای اینکه
بی‌صدا بدون ابزارهای بومی استفاده از رایانه اجرا شوند. برای گزینه‌های marketplace،
محدودیت‌های کاتالوگ دوردست، دلایل وضعیت، و عیب‌یابی، [استفاده از رایانه در Codex](/fa/plugins/codex-computer-use) را ببینید.

وقتی `computerUse.autoInstall` true باشد، OpenClaw می‌تواند marketplace استاندارد
باندل‌شده Codex Desktop را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، اگر Codex
هنوز marketplace محلی را کشف نکرده باشد. پس از تغییر پیکربندی runtime یا استفاده از رایانه، از `/new` یا `/reset` استفاده کنید
تا نشست‌های موجود اتصال قدیمی PI یا نخ Codex را نگه ندارند.

## دستورالعمل‌های رایج

Codex محلی با انتقال stdio پیش‌فرض:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

اعتبارسنجی چارچوب فقط Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

تأییدهای Codex بازبینی‌شده توسط نگهبان:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

اپ‌سرور دوردست با سربرگ‌های صریح:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

تغییر مدل تحت کنترل OpenClaw باقی می‌ماند. وقتی یک نشست OpenClaw به
یک نخ موجود Codex متصل باشد، نوبت بعدی دوباره مدل فعلی انتخاب‌شده
OpenAI، ارائه‌دهنده، سیاست تأیید، sandbox، و سطح سرویس را به
اپ‌سرور می‌فرستد. تغییر از `openai/gpt-5.5` به `openai/gpt-5.2` اتصال
نخ را نگه می‌دارد اما از Codex می‌خواهد با مدل تازه انتخاب‌شده ادامه دهد.

## فرمان Codex

Plugin باندل‌شده، `/codex` را به‌عنوان یک فرمان slash مجاز ثبت می‌کند. این فرمان
عمومی است و روی هر کانالی که از فرمان‌های متنی OpenClaw پشتیبانی می‌کند کار می‌کند.

شکل‌های رایج:

- `/codex status` اتصال زنده اپ‌سرور، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP، و Skills را نشان می‌دهد.
- `/codex models` مدل‌های زنده اپ‌سرور Codex را فهرست می‌کند.
- `/codex threads [filter]` نخ‌های اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک نخ موجود Codex متصل می‌کند.
- `/codex compact` از اپ‌سرور Codex می‌خواهد نخ متصل‌شده را compact کند.
- `/codex review` بازبینی بومی Codex را برای نخ متصل‌شده شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد تشخیصی Codex برای نخ متصل‌شده سؤال می‌کند.
- `/codex computer-use status` Plugin پیکربندی‌شده استفاده از رایانه و سرور MCP را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شده استفاده از رایانه را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP اپ‌سرور Codex را فهرست می‌کند.
- `/codex skills` مهارت‌های اپ‌سرور Codex را فهرست می‌کند.

### گردش‌کار عیب‌یابی رایج

وقتی یک عامل پشتیبانی‌شده با Codex در Telegram، Discord، Slack،
یا کانال دیگری کاری غیرمنتظره انجام می‌دهد، از مکالمه‌ای شروع کنید که مشکل در آن رخ داده است:

1. `/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را اجرا کنید
   که آنچه دیده‌اید را توصیف می‌کند.
2. درخواست diagnostics را یک‌بار تأیید کنید. این تأیید، فایل zip تشخیصی Gateway محلی
   را می‌سازد و چون نشست از چارچوب Codex استفاده می‌کند، بسته بازخورد مرتبط Codex را نیز
   به سرورهای OpenAI می‌فرستد.
3. پاسخ کامل‌شده diagnostics را در گزارش اشکال یا نخ پشتیبانی کپی کنید.
   این پاسخ شامل مسیر بسته محلی، خلاصه حریم خصوصی، شناسه‌های نشست OpenClaw،
   شناسه‌های نخ Codex، و یک خط `Inspect locally` برای هر نخ Codex است.
4. اگر می‌خواهید اجرا را خودتان عیب‌یابی کنید، فرمان چاپ‌شده `Inspect locally`
   را در ترمینال اجرا کنید. این فرمان شبیه `codex resume <thread-id>` است و
   نخ بومی Codex را باز می‌کند تا بتوانید مکالمه را بررسی کنید، آن را به‌صورت محلی ادامه دهید،
   یا از Codex بپرسید چرا ابزار یا برنامه خاصی را انتخاب کرده است.

فقط وقتی از `/codex diagnostics [note]` استفاده کنید که مشخصاً بخواهید بارگذاری
بازخورد Codex برای نخ فعلاً متصل‌شده را بدون بسته کامل diagnostics متعلق به
OpenClaw Gateway انجام دهید. برای بیشتر گزارش‌های پشتیبانی، `/diagnostics [note]`
نقطه شروع بهتری است، چون وضعیت Gateway محلی و شناسه‌های نخ Codex را
در یک پاسخ به هم گره می‌زند. برای مدل کامل حریم خصوصی و رفتار گفت‌وگوی گروهی، [صدور diagnostics](/fa/gateway/diagnostics)
را ببینید.

هسته OpenClaw همچنین `/diagnostics [note]` فقط-مالک را به‌عنوان فرمان عمومی
diagnostics متعلق به Gateway در معرض می‌گذارد. درخواست تأیید آن مقدمه داده‌های حساس را
نشان می‌دهد، به [صدور Diagnostics](/fa/gateway/diagnostics) پیوند می‌دهد، و هر بار
`openclaw gateway diagnostics export --json` را از طریق تأیید exec صریح درخواست می‌کند. diagnostics را با یک قاعده allow-all تأیید نکنید. پس از تأیید،
OpenClaw گزارشی قابل paste با مسیر بسته محلی و خلاصه manifest
می‌فرستد. وقتی نشست فعال OpenClaw از چارچوب Codex استفاده می‌کند، همان
تأیید همچنین ارسال بسته‌های بازخورد مرتبط Codex به سرورهای OpenAI را
مجاز می‌کند. درخواست تأیید می‌گوید که بازخورد Codex ارسال خواهد شد، اما
شناسه‌های نشست یا نخ Codex را پیش از تأیید فهرست نمی‌کند.

اگر `/diagnostics` توسط یک مالک در گفت‌وگوی گروهی فراخوانی شود، OpenClaw
کانال مشترک را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، در حالی که
مقدمه diagnostics، درخواست‌های تأیید، و شناسه‌های نشست/نخ Codex از طریق
مسیر تأیید خصوصی برای مالک ارسال می‌شوند. اگر هیچ مسیر خصوصی مالک وجود نداشته باشد،
OpenClaw درخواست گروه را رد می‌کند و از مالک می‌خواهد آن را از DM اجرا کند.

فراخوانی بارگذاری تأییدشده Codex، app-server مربوط به Codex با مسیر `feedback/upload` را فراخوانی می‌کند و از app-server می‌خواهد در صورت موجود بودن، لاگ‌ها را برای هر thread فهرست‌شده و subthreadهای Codex ایجادشده اضافه کند. بارگذاری از مسیر عادی بازخورد Codex به سرورهای OpenAI می‌رود؛ اگر بازخورد Codex در آن app-server غیرفعال باشد، فرمان خطای app-server را برمی‌گرداند. پاسخ diagnostics تکمیل‌شده، کانال‌ها، شناسه‌های session در OpenClaw، شناسه‌های thread در Codex، و فرمان‌های محلی `codex resume <thread-id>` را برای threadهایی که ارسال شده‌اند فهرست می‌کند. اگر تأیید را رد کنید یا نادیده بگیرید، OpenClaw آن شناسه‌های Codex را چاپ نمی‌کند. این بارگذاری جایگزین export محلی diagnostics در Gateway نمی‌شود.

`/codex resume` همان فایل binding جانبی را می‌نویسد که harness برای turnهای عادی استفاده می‌کند. در پیام بعدی، OpenClaw همان thread در Codex را ادامه می‌دهد، مدل OpenClaw انتخاب‌شده فعلی را به app-server می‌فرستد، و history گسترده را فعال نگه می‌دارد.

### بررسی یک thread در Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای بد Codex اغلب این است که thread بومی Codex را مستقیماً باز کنید:

```sh
codex resume <thread-id>
```

وقتی در یک گفت‌وگوی کانال باگ می‌بینید و می‌خواهید session مشکل‌دار Codex را بررسی کنید، آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا یک انتخاب خاص برای ابزار یا reasoning انجام داده است، از این استفاده کنید. ساده‌ترین مسیر معمولاً این است که ابتدا `/diagnostics [note]` را اجرا کنید: پس از تأیید شما، گزارش تکمیل‌شده هر thread در Codex را فهرست می‌کند و یک فرمان `Inspect locally` چاپ می‌کند، برای مثال `codex resume <thread-id>`. می‌توانید آن فرمان را مستقیماً در ترمینال کپی کنید.

همچنین می‌توانید شناسه thread را از `/codex binding` برای chat فعلی یا از `/codex threads [filter]` برای threadهای اخیر app-server در Codex بگیرید، سپس همان فرمان `codex resume` را در shell خود اجرا کنید.

سطح فرمان به Codex app-server نسخه `0.125.0` یا جدیدتر نیاز دارد. اگر یک app-server سفارشی یا آینده آن متد JSON-RPC را ارائه نکند، متدهای کنترلی جداگانه با پیام `unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای hook

harness مربوط به Codex سه لایه hook دارد:

| لایه                                  | مالک                     | هدف                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hookهای Plugin در OpenClaw            | OpenClaw                 | سازگاری محصول/Plugin در سراسر harnessهای PI و Codex.                |
| middleware افزونه app-server در Codex | Pluginهای همراه OpenClaw | رفتار adapter در هر turn پیرامون ابزارهای پویای OpenClaw.          |
| hookهای بومی Codex                    | Codex                    | چرخه عمر سطح پایین Codex و سیاست ابزار بومی از config مربوط به Codex. |

OpenClaw از فایل‌های project یا global مربوط به Codex با نام `hooks.json` برای مسیریابی رفتار Pluginهای OpenClaw استفاده نمی‌کند. برای bridge پشتیبانی‌شده ابزار بومی و permission، OpenClaw برای هر thread، config مربوط به Codex را برای `PreToolUse`، `PostToolUse`، `PermissionRequest` و `Stop` تزریق می‌کند. hookهای دیگر Codex مانند `SessionStart` و `UserPromptSubmit` همچنان کنترل‌های سطح Codex هستند؛ در قرارداد v1 به‌عنوان hookهای Plugin در OpenClaw ارائه نمی‌شوند.

برای ابزارهای پویای OpenClaw، OpenClaw ابزار را پس از درخواست فراخوانی توسط Codex اجرا می‌کند، بنابراین OpenClaw رفتار Plugin و middleware تحت مالکیت خود را در adapter مربوط به harness اجرا می‌کند. برای ابزارهای بومی Codex، Codex مالک رکورد canonical ابزار است. OpenClaw می‌تواند رویدادهای منتخب را mirror کند، اما نمی‌تواند thread بومی Codex را بازنویسی کند مگر اینکه Codex آن عملیات را از طریق app-server یا callbackهای hook بومی ارائه کند.

projectionهای چرخه عمر Compaction و LLM از notificationهای app-server در Codex و state مربوط به adapter در OpenClaw می‌آیند، نه از فرمان‌های hook بومی Codex. رویدادهای `before_compaction`، `after_compaction`، `llm_input` و `llm_output` در OpenClaw observationهای سطح adapter هستند، نه captureهای byte-for-byte از request داخلی Codex یا payloadهای Compaction.

notificationهای app-server بومی Codex با نام‌های `hook/started` و `hook/completed` به‌عنوان رویدادهای agent با نام `codex_app_server.hook` برای trajectory و debugging نمایش داده می‌شوند. آن‌ها hookهای Plugin در OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex همان PI با یک فراخوانی مدل متفاوت در زیرساخت نیست. Codex بخش بیشتری از model loop بومی را مالک است، و OpenClaw سطح‌های Plugin و session خود را پیرامون آن مرز تطبیق می‌دهد.

در runtime نسخه v1 مربوط به Codex پشتیبانی می‌شود:

| سطح                                           | پشتیبانی                                | دلیل                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| model loop مربوط به OpenAI از طریق Codex      | پشتیبانی می‌شود                         | app-server مربوط به Codex مالک turn در OpenAI، ادامه thread بومی، و ادامه ابزار بومی است.                                                                                                          |
| مسیریابی و تحویل کانال در OpenClaw            | پشتیبانی می‌شود                         | Telegram، Discord، Slack، WhatsApp، iMessage و کانال‌های دیگر بیرون از runtime مدل می‌مانند.                                                                                                       |
| ابزارهای پویای OpenClaw                       | پشتیبانی می‌شود                         | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.                                                                                                  |
| Prompt و Pluginهای context                    | پشتیبانی می‌شود                         | OpenClaw overlayهای prompt را می‌سازد و context را پیش از شروع یا ادامه thread به turn مربوط به Codex project می‌کند.                                                                              |
| چرخه عمر موتور context                        | پشتیبانی می‌شود                         | assemble، ingest یا نگهداری پس از turn، و هماهنگی Compaction موتور context برای turnهای Codex اجرا می‌شوند.                                                                                        |
| hookهای ابزار پویا                            | پشتیبانی می‌شود                         | `before_tool_call`، `after_tool_call` و middleware نتیجه ابزار پیرامون ابزارهای پویای تحت مالکیت OpenClaw اجرا می‌شوند.                                                                            |
| hookهای چرخه عمر                              | به‌عنوان observationهای adapter پشتیبانی می‌شود | `llm_input`، `llm_output`، `agent_end`، `before_compaction` و `after_compaction` با payloadهای صادقانه حالت Codex اجرا می‌شوند.                                                                      |
| gate بازبینی پاسخ نهایی                       | از طریق relay hook بومی پشتیبانی می‌شود | `Stop` در Codex به `before_agent_finalize` relay می‌شود؛ `revise` از Codex می‌خواهد پیش از نهایی‌سازی یک pass مدل دیگر انجام دهد.                                                                  |
| block یا observe برای shell، patch و MCP بومی | از طریق relay hook بومی پشتیبانی می‌شود | `PreToolUse` و `PostToolUse` در Codex برای سطح‌های ابزار بومی commit‌شده relay می‌شوند، از جمله payloadهای MCP روی Codex app-server نسخه `0.125.0` یا جدیدتر. blocking پشتیبانی می‌شود؛ بازنویسی argument پشتیبانی نمی‌شود. |
| سیاست permission بومی                         | از طریق relay hook بومی پشتیبانی می‌شود | `PermissionRequest` در جایی که runtime آن را ارائه کند می‌تواند از طریق سیاست OpenClaw مسیریابی شود. اگر OpenClaw تصمیمی برنگرداند، Codex از مسیر guardian عادی یا تأیید کاربر ادامه می‌دهد.        |
| capture کردن trajectory در app-server         | پشتیبانی می‌شود                         | OpenClaw request ارسالی به app-server و notificationهای دریافتی از app-server را ثبت می‌کند.                                                                                                      |

در runtime نسخه v1 مربوط به Codex پشتیبانی نمی‌شود:

| سطح                                                | مرز V1                                                                                                                                          | مسیر آینده                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| تغییر argument ابزار بومی                          | hookهای pre-tool بومی Codex می‌توانند block کنند، اما OpenClaw argumentهای ابزار بومی Codex را بازنویسی نمی‌کند.                              | به پشتیبانی hook/schema در Codex برای جایگزینی ورودی ابزار نیاز دارد.                       |
| history قابل ویرایش transcript بومی Codex          | Codex مالک history canonical thread بومی است. OpenClaw مالک یک mirror است و می‌تواند context آینده را project کند، اما نباید internals پشتیبانی‌نشده را تغییر دهد. | اگر جراحی thread بومی لازم باشد، APIهای صریح app-server در Codex اضافه شود.                 |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن hook نوشته‌های transcript تحت مالکیت OpenClaw را transform می‌کند، نه رکوردهای ابزار بومی Codex.                                           | می‌تواند رکوردهای transform‌شده را mirror کند، اما بازنویسی canonical به پشتیبانی Codex نیاز دارد. |
| metadata غنی Compaction بومی                       | OpenClaw شروع و تکمیل Compaction را observe می‌کند، اما فهرست پایدار نگه‌داشته‌شده/حذف‌شده، token delta، یا payload خلاصه دریافت نمی‌کند.     | به رویدادهای غنی‌تر Compaction در Codex نیاز دارد.                                          |
| مداخله در Compaction                               | hookهای فعلی Compaction در OpenClaw در حالت Codex در سطح notification هستند.                                                                   | اگر Pluginها نیاز به veto یا بازنویسی Compaction بومی داشته باشند، hookهای pre/post Compaction در Codex اضافه شود. |
| capture کردن request مدل API به‌صورت byte-for-byte | OpenClaw می‌تواند requestها و notificationهای app-server را capture کند، اما هسته Codex request نهایی OpenAI API را در داخل می‌سازد.          | به یک رویداد tracing برای request مدل در Codex یا debug API نیاز دارد.                     |

## ابزارها، رسانه و Compaction

harness مربوط به Codex فقط executor سطح پایین agent embedded را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزارها را می‌سازد و نتایج ابزار پویا را از harness دریافت می‌کند. متن، تصویر، ویدیو، موسیقی، TTS، تأییدها، و خروجی ابزارهای پیام‌رسانی همچنان از مسیر تحویل عادی OpenClaw عبور می‌کنند.

relay hook بومی عمداً generic است، اما قرارداد پشتیبانی v1 به مسیرهای ابزار بومی و permission در Codex محدود است که OpenClaw آن‌ها را تست می‌کند. در runtime مربوط به Codex، این شامل payloadهای shell، patch و MCP مربوط به `PreToolUse`، `PostToolUse` و `PermissionRequest` می‌شود. تا وقتی runtime contract آن را نام نبرده است، فرض نکنید هر رویداد hook آینده Codex یک سطح Plugin در OpenClaw است.

برای `PermissionRequest`، OpenClaw فقط وقتی سیاست تصمیم بگیرد، تصمیم‌های صریح allow یا deny برمی‌گرداند. نتیجه بدون تصمیم، allow نیست. Codex آن را به‌عنوان نبود تصمیم hook در نظر می‌گیرد و به guardian خودش یا مسیر تأیید کاربر fall through می‌کند.

elicitationهای approval ابزار MCP در Codex وقتی Codex مقدار `_meta.codex_approval_kind` را `"mcp_tool_call"` قرار دهد، از طریق جریان approval Plugin در OpenClaw مسیریابی می‌شوند. promptهای `request_user_input` در Codex به chat مبدأ برگردانده می‌شوند، و پیام follow-up بعدی در صف به همان request بومی سرور پاسخ می‌دهد، نه اینکه به‌عنوان context اضافی هدایت شود. requestهای elicitation دیگر MCP همچنان fail closed می‌شوند.

وقتی مدل انتخاب‌شده از هارنس Codex استفاده می‌کند، Compaction بومی رشته به app-serverِ Codex واگذار می‌شود. OpenClaw برای تاریخچه کانال، جستجو، `/new`، `/reset`، و جابه‌جایی آینده مدل یا هارنس، یک آینه رونوشت نگه می‌دارد. این آینه شامل پرامپت کاربر، متن نهایی دستیار، و رکوردهای سبک استدلال یا برنامه Codex است، وقتی app-server آن‌ها را منتشر می‌کند. در حال حاضر، OpenClaw فقط سیگنال‌های شروع و تکمیل Compaction بومی را ثبت می‌کند. هنوز خلاصه‌ای خوانا برای انسان از Compaction یا فهرستی قابل ممیزی از اینکه Codex پس از Compaction کدام ورودی‌ها را نگه داشته است، ارائه نمی‌کند.

از آنجا که Codex مالک رشته بومی مرجع است، `tool_result_persist` در حال حاضر رکوردهای نتیجه ابزار بومیِ Codex را بازنویسی نمی‌کند. این فقط زمانی اعمال می‌شود که OpenClaw در حال نوشتن نتیجه ابزار رونوشت نشستِ متعلق به OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدئو، موسیقی، PDF، TTS، و درک رسانه همچنان از تنظیمات ارائه‌دهنده/مدل متناظر مانند `agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و `messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهنده معمولی `/model` ظاهر نمی‌شود:** این برای پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` با `agentRuntime.id: "codex"` (یا یک ارجاع قدیمی `codex/*`) انتخاب کنید، `plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید که آیا `plugins.allow`، `codex` را مستثنا کرده است یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` همچنان می‌تواند وقتی هیچ هارنس Codex اجرای کار را در اختیار نمی‌گیرد، از PI به‌عنوان پشتیبان سازگاری استفاده کند. برای اجبار به انتخاب Codex هنگام آزمایش، `agentRuntime.id: "codex"` را تنظیم کنید. اکنون یک runtime اجباری Codex، به‌جای بازگشت به PI، شکست می‌خورد مگر اینکه صراحتاً `agentRuntime.fallback: "pi"` را تنظیم کنید. پس از انتخاب app-serverِ Codex، خطاهای آن بدون پیکربندی fallback اضافه مستقیماً نمایان می‌شوند.

**app-server رد می‌شود:** Codex را ارتقا دهید تا دست‌دهی app-server نسخه `0.125.0` یا جدیدتر را گزارش کند. پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند ساخت مانند `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون کف پروتکل پایدار `0.125.0` همان چیزی است که OpenClaw آزمایش می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید.

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`، و اینکه app-server راه‌دور با همان نسخه پروتکل app-serverِ Codex صحبت می‌کند را بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است، مگر اینکه برای آن عامل `agentRuntime.id: "codex"` را اجباری کرده باشید یا یک ارجاع قدیمی `codex/*` انتخاب کرده باشید. ارجاع‌های ساده `openai/gpt-*` و دیگر ارائه‌دهنده‌ها در حالت `auto` روی مسیر معمول ارائه‌دهنده خود می‌مانند. اگر `agentRuntime.id: "codex"` را اجباری کنید، هر نوبت تعبیه‌شده برای آن عامل باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه، `/codex computer-use status` را بررسی کنید. اگر ابزاری `Native hook relay unavailable` گزارش داد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، Gateway را راه‌اندازی مجدد کنید تا ثبت‌نام‌های قدیمی هوک بومی پاک شوند. اگر `computer-use.list_apps` به timeout خورد، Codex Computer Use یا Codex Desktop را راه‌اندازی مجدد کنید و دوباره تلاش کنید.

## مرتبط

- [Pluginهای هارنس عامل](/fa/plugins/sdk-agent-harness)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [هوک‌های Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)
