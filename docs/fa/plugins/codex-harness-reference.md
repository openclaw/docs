---
read_when:
    - به همهٔ فیلدهای پیکربندی چارچوب اجرایی Codex نیاز دارید
    - شما در حال تغییر رفتار انتقال، احراز هویت، کشف یا وقفه زمانی app-server هستید
    - شما در حال اشکال‌زدایی راه‌اندازی هارنس Codex، کشف مدل، یا جداسازی محیط هستید
summary: مرجع پیکربندی، احراز هویت، کشف و سرور برنامه برای harness مربوط به Codex
title: مرجع هارنس Codex
x-i18n:
    generated_at: "2026-07-04T20:39:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

این مرجع پیکربندی دقیق Plugin همراه `codex` را پوشش می‌دهد. برای تصمیم‌های راه‌اندازی و مسیریابی، از
[هارنس Codex](/fa/plugins/codex-harness) شروع کنید.

## سطح پیکربندی Plugin

همه تنظیمات هارنس Codex زیر `plugins.entries.codex.config` قرار دارند.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

فیلدهای سطح بالای پشتیبانی‌شده:

| فیلد                       | پیش‌فرض                  | معنا                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | فعال                     | تنظیمات کشف مدل برای `model/list` سرور برنامه Codex.                                                                               |
| `appServer`                | سرور برنامه stdio مدیریت‌شده | تنظیمات انتقال، فرمان، احراز هویت، تأیید، sandbox و timeout.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw را مستقیماً در زمینه ابزار اولیه Codex قرار دهید.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های سرور برنامه Codex حذف شوند.                                                               |
| `codexPlugins`             | غیرفعال                  | پشتیبانی بومی Codex از Plugin/برنامه برای Pluginهای گزینش‌شده نصب‌شده از منبع که مهاجرت داده شده‌اند. [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) را ببینید. |
| `computerUse`              | غیرفعال                  | راه‌اندازی Codex Computer Use. [Codex Computer Use](/fa/plugins/codex-computer-use) را ببینید.                                                          |

## انتقال سرور برنامه

به‌طور پیش‌فرض، OpenClaw باینری مدیریت‌شده Codex را که همراه Plugin
ارائه می‌شود شروع می‌کند:

```bash
codex app-server --listen stdio://
```

این کار نسخه سرور برنامه را به Plugin همراه `codex` گره می‌زند، نه به
هر CLI جداگانه Codex که ممکن است به‌صورت محلی نصب شده باشد. فقط زمانی
`appServer.command` را تنظیم کنید که عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید.

برای یک سرور برنامه که از قبل در حال اجراست، از انتقال WebSocket استفاده کنید:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                                         | پیش‌فرض                                                | معنا                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`، Codex را ایجاد می‌کند؛ `"websocket"` به `url` متصل می‌شود.                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` وضعیت Codex را برای هر عامل OpenClaw جدا می‌کند. `"user"`، `$CODEX_HOME` بومی یا `~/.codex` را به اشتراک می‌گذارد، از احراز هویت بومی استفاده می‌کند، و مدیریت رشتهٔ فقط-مالک را فعال می‌کند. دامنهٔ کاربر به stdio نیاز دارد.                                                                                                                                                                                               |
| `command`                                     | باینری مدیریت‌شدهٔ Codex                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | تنظیم‌نشده                                                  | نشانی WebSocket برای app-server.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | تنظیم‌نشده                                                  | توکن حامل برای انتقال WebSocket. یک رشتهٔ لفظی یا SecretInput مانند `${CODEX_APP_SERVER_TOKEN}` را می‌پذیرد.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | سرآیندهای اضافی WebSocket. مقدارهای سرآیند، رشته‌های لفظی یا مقدارهای SecretInput را می‌پذیرند، برای مثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | نام متغیرهای محیطی اضافی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند ایجادشدهٔ app-server در stdio حذف می‌شوند.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | تنظیم‌نشده                                                  | ریشهٔ فضای کاری app-server راه‌دور Codex. وقتی تنظیم شود، OpenClaw ریشهٔ فضای کاری محلی را از فضای کاری حل‌شدهٔ OpenClaw استنباط می‌کند، پسوند cwd فعلی را زیر این ریشهٔ راه‌دور حفظ می‌کند، و فقط cwd نهایی app-server را به Codex می‌فرستد. اگر cwd بیرون از ریشهٔ فضای کاری حل‌شدهٔ OpenClaw باشد، OpenClaw به‌جای فرستادن یک مسیر محلی Gateway به app-server راه‌دور، به‌صورت بسته شکست می‌خورد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلت زمانی برای فراخوانی‌های صفحهٔ کنترل app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | پنجرهٔ سکوت پس از اینکه Codex یک نوبت را می‌پذیرد یا پس از یک درخواست app-server در دامنهٔ نوبت، در حالی که OpenClaw منتظر `turn/completed` است.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | نگهبان بیکاریِ تکمیل و پیشرفت که پس از تحویل به ابزار، تکمیل ابزار بومی، پیشرفت خام دستیار پس از ابزار، تکمیل استدلال خام، یا پیشرفت استدلال، در حالی که OpenClaw منتظر `turn/completed` است، استفاده می‌شود. از این گزینه برای بارهای کاری مورداعتماد یا سنگین استفاده کنید که در آن‌ها ترکیب پس از ابزار می‌تواند به‌طور مشروع بیش از بودجهٔ انتشار نهایی دستیار ساکت بماند.                                |
| `mode`                                        | `"yolo"` مگر اینکه الزامات Codex محلی YOLO را مجاز ندانند | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` یا یک خط‌مشی تأیید نگهبان مجاز       | خط‌مشی تأیید بومی Codex که به شروع رشته، ازسرگیری، و نوبت فرستاده می‌شود.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` یا یک سندباکس نگهبان مجاز  | حالت سندباکس بومی Codex که به شروع و ازسرگیری رشته فرستاده می‌شود. سندباکس‌های فعال OpenClaw، نوبت‌های `danger-full-access` را به `workspace-write` در Codex محدود می‌کنند؛ پرچم شبکهٔ نوبت از خروجی سندباکس OpenClaw پیروی می‌کند.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` یا یک بازبین نگهبان مجاز               | از `"auto_review"` استفاده کنید تا Codex در صورت مجاز بودن، اعلان‌های تأیید بومی را بازبینی کند.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | دایرکتوری فرایند فعلی                              | فضای کاری استفاده‌شده توسط `/codex bind` وقتی `--cwd` حذف شده باشد.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | تنظیم‌نشده                                                  | ردهٔ سرویس اختیاری app-server در Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش انعطاف‌پذیر را درخواست می‌کند، و `null` بازنویسی را پاک می‌کند. مقدار قدیمی `"fast"` به‌عنوان `"priority"` پذیرفته می‌شود.                                                                                                                                                                                                 |
| `networkProxy`                                | غیرفعال                                               | ورود اختیاری به شبکه‌سازی نمایهٔ مجوزهای Codex برای فرمان‌های app-server. OpenClaw پیکربندی `permissions.<profile>.network` انتخاب‌شده را تعریف می‌کند و آن را با `default_permissions` انتخاب می‌کند، به‌جای اینکه `sandbox` را بفرستد.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | ورود اختیاری پیش‌نمایشی که یک محیط Codex پشتیبانی‌شده با سندباکس OpenClaw را در Codex app-server نسخهٔ 0.132.0 یا جدیدتر ثبت می‌کند تا اجرای بومی Codex بتواند داخل سندباکس فعال OpenClaw اجرا شود.                                                                                                                                                                                                         |

`appServer.networkProxy` صریح است، چون قرارداد سندباکس Codex را تغییر می‌دهد.
وقتی فعال باشد، OpenClaw همچنین `features.network_proxy.enabled` و
`default_permissions` را در پیکربندی رشتهٔ Codex تنظیم می‌کند تا نمایهٔ مجوز
تولیدشده بتواند شبکه‌سازی مدیریت‌شدهٔ Codex را شروع کند. به‌طور پیش‌فرض، OpenClaw
از بدنهٔ نمایه یک نام نمایهٔ مقاوم در برابر برخورد به شکل
`openclaw-network-<fingerprint>` تولید می‌کند؛ فقط وقتی به یک نام محلی پایدار نیاز است از `profileName` استفاده کنید.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

اگر runtime معمول app-server برابر `danger-full-access` باشد، فعال‌کردن
`networkProxy` برای پروفایل مجوز تولیدشده از دسترسی فایل‌سیستم به سبک
workspace استفاده می‌کند. اعمال محدودیت شبکه مدیریت‌شده توسط Codex، شبکه‌سازی
sandboxشده است؛ بنابراین پروفایل با دسترسی کامل از ترافیک خروجی محافظت نمی‌کند.

Plugin، handshakeهای قدیمی‌تر یا بدون نسخه app-server را مسدود می‌کند. app-server
در Codex باید نسخه پایدار `0.125.0` یا جدیدتر را گزارش کند.

OpenClaw نشانی‌های WebSocket app-server غیر loopback را remote در نظر می‌گیرد و
احراز هویت WebSocket دارای هویت را از طریق `appServer.authToken` یا یک
هدر `Authorization` الزامی می‌کند. `appServer.authToken` و هر مقدار
`appServer.headers.*` می‌تواند SecretInput باشد؛ runtime اسرار، SecretRefها و
کوتاه‌نویسی env را پیش از ساخت گزینه‌های شروع app-server توسط OpenClaw resolve
می‌کند، و SecretRefهای ساختاری resolveنشده پیش از ارسال هر token یا header
با خطا متوقف می‌شوند. وقتی Pluginهای native در Codex پیکربندی شده باشند،
OpenClaw از control plane Plugin در app-server متصل برای نصب یا refresh آن
Pluginها استفاده می‌کند و سپس inventory برنامه را refresh می‌کند تا appهای
متعلق به Plugin برای thread در Codex قابل مشاهده باشند. `app/list` همچنان منبع
معتبر inventory و metadata است، اما policy در OpenClaw تصمیم می‌گیرد که آیا
`thread/start` برای یک app فهرست‌شده و قابل دسترس، حتی اگر Codex در حال حاضر آن
را disabled علامت‌گذاری کرده باشد، `config.apps[appId].enabled = true` بفرستد
یا نه. app idهای ناشناخته یا missing همچنان fail-closed می‌مانند؛ این مسیر فقط
Pluginهای marketplace را از طریق `plugin/install` فعال می‌کند و inventory را
refresh می‌کند. OpenClaw را فقط به app-serverهای remote وصل کنید که برای پذیرش
نصب Pluginهای مدیریت‌شده توسط OpenClaw و refresh inventory app قابل اعتمادند.

## حالت‌های approval و sandbox

sessionهای app-server محلی stdio به طور پیش‌فرض از حالت YOLO استفاده می‌کنند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. این وضعیت operator محلی مورد اعتماد اجازه
می‌دهد turnها و Heartbeatهای بی‌ناظر OpenClaw بدون promptهای native approval که
کسی برای پاسخ‌دادن به آن‌ها حاضر نیست پیش بروند.

اگر فایل system requirements محلی Codex مقدارهای implicit برای approval، reviewer
یا sandbox در حالت YOLO را مجاز نداند، OpenClaw به‌جای آن default implicit را
guardian در نظر می‌گیرد و permissionهای مجاز guardian را انتخاب می‌کند.
`tools.exec.mode: "auto"` نیز approvalهای Codex با بازبینی guardian را اجبار
می‌کند و overrideهای legacy ناامن مانند `approvalPolicy: "never"` یا
`sandbox: "danger-full-access"` را حفظ نمی‌کند؛ برای وضعیت عمدی بدون approval،
`tools.exec.mode: "full"` را تنظیم کنید. entryهای
`[[remote_sandbox_config]]` مطابق hostname در همان فایل requirements برای تصمیم
default sandbox رعایت می‌شوند.

برای approvalهای Codex با بازبینی guardian، `appServer.mode: "guardian"` را
تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

preset با نام `guardian` وقتی این مقدارها مجاز باشند به
`approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"` و
`sandbox: "workspace-write"` گسترش می‌یابد. fieldهای policy به‌صورت جداگانه
`mode` را override می‌کنند. مقدار reviewer قدیمی‌تر `guardian_subagent` همچنان
به‌عنوان alias سازگاری پذیرفته می‌شود، اما configهای جدید باید از `auto_review`
استفاده کنند.

وقتی sandbox در OpenClaw فعال است، process محلی app-server در Codex همچنان روی
hostِ Gateway اجرا می‌شود. بنابراین OpenClaw برای آن turn، Code Mode native در
Codex، serverهای MCP کاربر، و اجرای Plugin مبتنی بر app را غیرفعال می‌کند،
به‌جای آنکه sandboxing سمت host در Codex را معادل backend sandbox در OpenClaw
بداند. وقتی ابزارهای عادی exec/process در دسترس باشند، دسترسی shell از طریق
ابزارهای dynamic مبتنی بر sandbox در OpenClaw مانند `sandbox_exec` و
`sandbox_process` ارائه می‌شود.

روی hostهای Ubuntu/AppArmor، وقتی native Codex `workspace-write` را عمداً بدون
sandboxing فعال OpenClaw اجرا می‌کنید، bwrap در Codex می‌تواند تحت
`workspace-write` پیش از شروع فرمان shell شکست بخورد. اگر
`bwrap: setting up uid map: Permission denied` یا
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` را دیدید،
`openclaw doctor` را اجرا کنید و به‌جای دادن privilegeهای گسترده‌تر Docker
container، policy namespace گزارش‌شده برای user سرویس OpenClaw را اصلاح کنید.
برای process سرویس، یک پروفایل AppArmor محدود و scopeشده را ترجیح دهید؛ fallback
با `kernel.apparmor_restrict_unprivileged_userns=0` در سطح کل host است و مصالحه‌های
امنیتی دارد.

## اجرای native sandboxشده

default پایدار fail-closed است: sandboxing فعال OpenClaw سطح‌های اجرای native
در Codex را که در غیر این صورت از host app-server در Codex اجرا می‌شدند
غیرفعال می‌کند. فقط وقتی می‌خواهید پشتیبانی remote environment در Codex را با
backend sandbox در OpenClaw امتحان کنید، از
`appServer.experimental.sandboxExecServer: true` استفاده کنید. این مسیر preview
به app-server در Codex نسخه 0.132.0 یا جدیدتر نیاز دارد.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

وقتی flag روشن است و session فعلی OpenClaw sandboxشده باشد، OpenClaw یک
exec-server مبتنی بر local loopback را که با sandbox فعال پشتیبانی می‌شود شروع
می‌کند، آن را در app-server در Codex ثبت می‌کند، و thread و turn در Codex را با
همان environment متعلق به OpenClaw شروع می‌کند. اگر app-server نتواند environment
را ثبت کند، run به‌جای fallback خاموش به اجرای host، fail-closed می‌شود.

این مسیر preview فقط local است. app-server از راه دور WebSocket نمی‌تواند به
exec-server روی loopback دسترسی پیدا کند مگر اینکه روی همان host اجرا شود؛
بنابراین OpenClaw این ترکیب را رد می‌کند.

## جداسازی auth و environment

در home پیش‌فرض per-agent، auth به این ترتیب انتخاب می‌شود:

1. یک پروفایل auth صریح OpenClaw Codex برای agent.
2. account موجود app-server در Codex home همان agent.
3. فقط برای launchهای app-server محلی stdio، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی account app-server وجود ندارد و auth در OpenAI هنوز
   لازم است.

وقتی OpenClaw یک پروفایل auth در Codex از نوع subscription-style برای ChatGPT
می‌بیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از process فرزند Codex که spawn
شده حذف می‌کند. این کار کلیدهای API سطح Gateway را برای embeddings یا modelهای
مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه turnهای native app-server در
Codex به‌صورت تصادفی از طریق API billed شوند.

پروفایل‌های explicit API-key در Codex و fallback کلید env در stdio محلی به‌جای
env به‌ارث‌رسیده از child-process از login در app-server استفاده می‌کنند.
اتصال‌های WebSocket app-server، fallback کلید API از env در Gateway را دریافت
نمی‌کنند؛ از یک پروفایل auth صریح یا account خود app-server از راه دور استفاده
کنید.

launchهای stdio app-server به‌طور پیش‌فرض process environment در OpenClaw را به
ارث می‌برند. OpenClaw bridge حساب app-server در Codex را مالکیت می‌کند و
`CODEX_HOME` را روی یک directory per-agent زیر state همان agent در OpenClaw
تنظیم می‌کند. این کار config، accountها، cache/data مربوط به Plugin، و state
thread در Codex را در محدوده agent در OpenClaw نگه می‌دارد، به‌جای آنکه از home
شخصی operator در `~/.codex` نشت کند.

برای اشتراک‌گذاری state native در Codex با Codex Desktop و CLI،
`appServer.homeScope: "user"` را تنظیم کنید. این حالت فقط مخصوص stdio محلی،
وقتی `$CODEX_HOME` تنظیم شده باشد از آن و در غیر این صورت از `~/.codex` استفاده
می‌کند، شامل auth، config، Pluginها و threadهای native. OpenClaw bridge
auth-profile خود را برای app-server رد می‌کند. turnهای owner تأییدشده می‌توانند
از `codex_threads` برای فهرست‌کردن، جست‌وجو، خواندن، fork، تغییرنام، archive و
restore آن threadها استفاده کنند. پیش از ادامه‌دادن یک thread در OpenClaw، آن
را fork کنید؛ processهای مستقل Codex برای writerهای همزمان روی یک thread
هماهنگی انجام نمی‌دهند.

OpenClaw برای launchهای عادی app-server محلی، `HOME` را بازنویسی نمی‌کند.
subprocessهایی که توسط Codex اجرا می‌شوند، مانند `openclaw`، `gh`، `git`،
CLIهای cloud و فرمان‌های shell، home عادی process را می‌بینند و می‌توانند config
و tokenهای user-home را پیدا کنند. Codex همچنین ممکن است
`$HOME/.agents/skills` و `$HOME/.agents/plugins/marketplace.json` را discover
کند؛ آن discovery مربوط به `.agents` عمداً با home operator مشترک است و از
state جداشده `~/.codex` مستقل است.

در scope پیش‌فرض agent، Pluginهای OpenClaw و snapshotهای skill در OpenClaw
همچنان از registry Plugin و loader skill خود OpenClaw عبور می‌کنند؛ assetهای
شخصی Codex در `~/.codex` این‌طور نیستند. اگر Skills یا Pluginهای مفید Codex CLI
از یک Codex home دارید که باید بخشی از یک agent جداشده در OpenClaw شوند، آن‌ها
را صریحاً inventory کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

اگر یک deployment به جداسازی بیشتر environment نیاز دارد، آن variableها را به
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

`appServer.clearEnv` فقط روی process فرزند app-server در Codex که spawn شده اثر
می‌گذارد. OpenClaw هنگام normalization launch محلی، `CODEX_HOME` و `HOME` را از
این فهرست حذف می‌کند: `CODEX_HOME` همچنان به scope انتخاب‌شده agent یا user
اشاره می‌کند، و `HOME` همچنان inherited می‌ماند تا subprocessها بتوانند از state
عادی user-home استفاده کنند.

## ابزارهای dynamic

ابزارهای dynamic در Codex به‌طور پیش‌فرض با loading از نوع `searchable` هستند.
OpenClaw ابزارهای dynamicی را که عملیات workspace native در Codex را duplicate
می‌کنند expose نمی‌کند:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

بیشتر ابزارهای integration باقی‌مانده OpenClaw، مانند messaging، media، cron،
browser، nodes، gateway، `heartbeat_respond` و `web_search`، از طریق جست‌وجوی
ابزار Codex زیر namespace با نام `openclaw` در دسترس‌اند. این کار context اولیه
model را کوچک‌تر نگه می‌دارد. `sessions_yield` و replyهای source مخصوص
message-tool مستقیم می‌مانند، چون این‌ها قراردادهای کنترل turn هستند.
`sessions_spawn` به‌صورت searchable می‌ماند تا `spawn_agent` native در Codex
همچنان سطح اصلی subagent در Codex باشد، در حالی که delegation صریح OpenClaw یا
ACP همچنان از طریق namespace ابزار dynamic با نام `openclaw` در دسترس است.

`codexDynamicToolsLoading: "direct"` را فقط وقتی تنظیم کنید که به یک app-server
سفارشی Codex وصل می‌شوید که نمی‌تواند ابزارهای dynamic deferred را جست‌وجو کند،
یا وقتی payload کامل ابزار را debug می‌کنید.

## Timeoutها

فراخوانی‌های ابزار dynamic متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند. هر request با `item/tool/call` در
Codex نخستین timeout موجود را به این ترتیب استفاده می‌کند:

- آرگومان مثبت per-call با نام `timeoutMs`.
- برای `image_generate`، مقدار `agents.defaults.imageGenerationModel.timeoutMs`.
- برای `image_generate` بدون timeout پیکربندی‌شده، default تولید تصویر 120
  ثانیه‌ای.
- برای ابزار `image` مربوط به درک media، مقدار
  `tools.media.image.timeoutSeconds` تبدیل‌شده به millisecond، یا default
  media برابر 60 ثانیه. برای image understanding، این مقدار روی خود request
  اعمال می‌شود و با کارهای preparation قبلی کاهش نمی‌یابد.
- default ابزار dynamic برابر 90 ثانیه.

این watchdog بودجه بیرونی dynamic `item/tool/call` است. timeoutهای request
مختص provider داخل همان call اجرا می‌شوند و semantics timeout خودشان را حفظ
می‌کنند. بودجه‌های ابزار dynamic به 600000 ms محدود می‌شوند. هنگام timeout،
OpenClaw هرجا پشتیبانی شود signal ابزار را abort می‌کند و یک response شکست‌خورده
dynamic-tool به Codex برمی‌گرداند تا turn بتواند ادامه یابد، به‌جای اینکه
session در `processing` باقی بماند.

پس از اینکه Codex یک turn را می‌پذیرد، و پس از اینکه OpenClaw به یک request
app-server با scope همان turn پاسخ می‌دهد، harness انتظار دارد Codex در turn
فعلی پیشرفت کند و در نهایت turn native را با `turn/completed` تمام کند. اگر
app-server برای `appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw به
صورت best-effort turn در Codex را interrupt می‌کند، یک timeout تشخیصی ثبت
می‌کند، و lane مربوط به session در OpenClaw را آزاد می‌کند تا messageهای chat
بعدی پشت یک turn native stale در queue نمانند.

اغلب اعلان‌های غیرنهایی برای همان نوبت، آن watchdog کوتاه را غیرفعال می‌کنند
چون Codex ثابت کرده است که نوبت هنوز زنده است. واگذاری‌های ابزار از بودجهٔ بیکاری
طولانی‌تری پس از ابزار استفاده می‌کنند: پس از آنکه OpenClaw یک پاسخ `item/tool/call` برمی‌گرداند، پس از
کامل‌شدن آیتم‌های ابزار بومی مانند `commandExecution`، پس از تکمیل‌های خام
`custom_tool_call_output`، و پس از پیشرفت خام دستیار پس از ابزار،
تکمیل‌های خام استدلال، یا پیشرفت استدلال. این محافظ، هنگام پیکربندی، از
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` استفاده می‌کند و در غیر این صورت
به‌طور پیش‌فرض پنج دقیقه است. همان بودجهٔ پس از ابزار همچنین watchdog پیشرفت را
برای پنجرهٔ سنتز بی‌صدا پیش از آنکه Codex رویداد بعدی نوبت جاری را منتشر کند
تمدید می‌کند. تکمیل‌های استدلال، تکمیل‌های
`agentMessage` در commentary، و پیشرفت خام استدلال یا دستیار پیش از ابزار می‌توانند
با یک پاسخ نهایی خودکار دنبال شوند، بنابراین به‌جای آزادکردن فوری lane نشست،
از محافظ پاسخ پس از پیشرفت استفاده می‌کنند. فقط آیتم‌های `agentMessage`
کامل‌شدهٔ نهایی/غیر-commentary و تکمیل‌های خام دستیار پیش از ابزار، آزادسازی
خروجی دستیار را مسلح می‌کنند: اگر Codex سپس بدون `turn/completed` ساکت بماند،
OpenClaw به‌صورت best-effort نوبت بومی را قطع می‌کند و lane نشست را آزاد می‌کند.
خرابی‌های replay-safe در app-server مبتنی بر stdio، از جمله timeoutهای بیکاری
تکمیل نوبت بدون شواهد دستیار، ابزار، آیتم فعال، یا اثر جانبی، یک بار در تلاش
تازهٔ app-server دوباره امتحان می‌شوند. timeoutهای ناامن همچنان کلاینت
app-server گیرکرده را بازنشسته می‌کنند و lane نشست OpenClaw را آزاد می‌کنند.
آن‌ها همچنین binding کهنهٔ thread بومی را پاک می‌کنند، نه اینکه به‌صورت خودکار
دوباره پخش شوند. timeoutهای پایش تکمیل، متن timeout مخصوص Codex را نشان می‌دهند:
موارد replay-safe می‌گویند پاسخ ممکن است ناقص باشد، در حالی که موارد ناامن
به کاربر می‌گویند پیش از تلاش دوباره، وضعیت فعلی را بررسی کند. عیب‌یابی‌های
عمومی timeout شامل فیلدهای ساختاری مانند آخرین متد اعلان app-server،
شناسه/نوع/نقش آیتم پاسخ خام دستیار، شمارش درخواست/آیتم فعال، و وضعیت armed
watch هستند. وقتی آخرین اعلان یک آیتم پاسخ خام دستیار باشد، یک پیش‌نمایش
محدود از متن دستیار را نیز شامل می‌شوند. آن‌ها محتوای خام prompt یا ابزار را
شامل نمی‌شوند.

## کشف مدل

به‌طور پیش‌فرض، Plugin مربوط به Codex از app-server مدل‌های موجود را درخواست می‌کند. موجودبودن مدل
در مالکیت Codex app-server است، بنابراین وقتی OpenClaw نسخهٔ بسته‌بندی‌شدهٔ
`@openai/codex` را ارتقا می‌دهد یا وقتی یک استقرار، `appServer.command` را به
یک باینری Codex متفاوت اشاره می‌دهد، این فهرست می‌تواند تغییر کند. موجودبودن
همچنین می‌تواند وابسته به حساب باشد. برای دیدن کاتالوگ زندهٔ همان harness و
حساب، روی یک gateway در حال اجرا از `/codex models` استفاده کنید.

اگر کشف ناموفق شود یا timeout بدهد، OpenClaw برای موارد زیر از کاتالوگ fallback
بسته‌بندی‌شده استفاده می‌کند:

- GPT-5.5
- GPT-5.4 mini

harness بسته‌بندی‌شدهٔ فعلی `@openai/codex` `0.142.5` است. یک probe با
`model/list` علیه آن app-server بسته‌بندی‌شده، این ردیف‌های عمومی انتخاب‌گر را
برگرداند:

| شناسهٔ مدل              | modalityهای ورودی | تلاش‌های استدلال        |
| --------------------- | ---------------- | ------------------------ |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh |

مدل‌های پنهان می‌توانند برای جریان‌های داخلی یا تخصصی توسط کاتالوگ app-server
برگردانده شوند، اما گزینه‌های معمول انتخاب‌گر مدل نیستند.

کشف را زیر `plugins.entries.codex.config.discovery` تنظیم کنید:

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

وقتی می‌خواهید راه‌اندازی از probe کردن Codex خودداری کند و فقط از کاتالوگ
fallback استفاده کند، کشف را غیرفعال کنید:

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

## فایل‌های bootstrap فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی project-doc مدیریت می‌کند. OpenClaw
فایل‌های project-doc مصنوعی Codex را نمی‌نویسد یا به نام‌فایل‌های fallback
Codex برای فایل‌های persona وابسته نیست، چون fallbackهای Codex فقط وقتی اعمال
می‌شوند که `AGENTS.md` وجود نداشته باشد.

برای برابری فضای کاری OpenClaw، harness مربوط به Codex فایل‌های bootstrap دیگر
را resolve می‌کند. `SOUL.md`، `IDENTITY.md`، `TOOLS.md`، و `USER.md` به‌عنوان
دستورالعمل‌های developer مربوط به OpenClaw Codex ارسال می‌شوند، چون agent فعال،
راهنمای فضای کاری موجود، و پروفایل کاربر را تعریف می‌کنند. فهرست فشردهٔ Skills
در OpenClaw به‌عنوان دستورالعمل‌های developer برای همکاری محدود به نوبت ارسال
می‌شود. محتوای `HEARTBEAT.md` تزریق نمی‌شود؛ نوبت‌های heartbeat یک اشاره‌گر
حالت همکاری برای خواندن فایل دریافت می‌کنند، وقتی فایل وجود داشته باشد و خالی
نباشد. محتوای `MEMORY.md` از فضای کاری agent پیکربندی‌شده، وقتی ابزارهای حافظه
برای آن فضای کاری موجود باشند، در ورودی نوبت بومی Codex paste نمی‌شود؛ وقتی
وجود داشته باشد، harness یک اشاره‌گر کوچک حافظهٔ فضای کاری را به دستورالعمل‌های
developer همکاری محدود به نوبت اضافه می‌کند و Codex باید وقتی حافظهٔ پایدار
مرتبط است از `memory_search` یا `memory_get` استفاده کند. اگر ابزارها غیرفعال
باشند، جست‌وجوی حافظه در دسترس نباشد، یا فضای کاری فعال با فضای کاری حافظهٔ
agent متفاوت باشد، `MEMORY.md` از مسیر معمول context محدود نوبت استفاده می‌کند.
`BOOTSTRAP.md` وقتی حاضر باشد، به‌عنوان context مرجع ورودی نوبت OpenClaw ارسال
می‌شود.

## overrideهای محیط

overrideهای محیط برای آزمایش محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN`
باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای
آزمایش محلی موردی از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید.
برای استقرارهای تکرارپذیر، config ترجیح داده می‌شود، چون رفتار Plugin را در
همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیهٔ راه‌اندازی harness مربوط به Codex
در آن قرار دارد.

## مرتبط

- [harness مربوط به Codex](/fa/plugins/codex-harness)
- [runtime harness مربوط به Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [Codex Computer Use](/fa/plugins/codex-computer-use)
- [ارائه‌دهندهٔ OpenAI](/fa/providers/openai)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
