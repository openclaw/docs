---
read_when:
    - می‌خواهید یک ربات Feishu/Lark را متصل کنید
    - شما در حال پیکربندی کانال Feishu هستید
summary: مرور کلی، قابلیت‌ها و پیکربندی ربات Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-30T14:13:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark یک پلتفرم همکاری همه‌کاره است که در آن تیم‌ها گفت‌وگو می‌کنند، سندها را به اشتراک می‌گذارند، تقویم‌ها را مدیریت می‌کنند و کارها را با هم پیش می‌برند.

**وضعیت:** آماده تولید برای پیام‌های مستقیم ربات + گفت‌وگوهای گروهی. WebSocket حالت پیش‌فرض است؛ حالت Webhook اختیاری است.

---

## شروع سریع

<Note>
به OpenClaw 2026.5.29 یا بالاتر نیاز دارد. برای بررسی، `openclaw --version` را اجرا کنید. با `openclaw update` ارتقا دهید.
</Note>

<Steps>
  <Step title="جادوگر راه‌اندازی کانال را اجرا کنید">
  ```bash
  openclaw channels login --channel feishu
  ```
  راه‌اندازی دستی را انتخاب کنید تا App ID و App Secret را از Feishu Open Platform جای‌گذاری کنید، یا راه‌اندازی با QR را انتخاب کنید تا یک ربات به‌صورت خودکار ساخته شود. اگر اپلیکیشن موبایل داخلی Feishu به کد QR واکنش نشان نمی‌دهد، راه‌اندازی را دوباره اجرا کنید و راه‌اندازی دستی را انتخاب کنید.
  </Step>
  
  <Step title="پس از تکمیل راه‌اندازی، Gateway را بازراه‌اندازی کنید تا تغییرات اعمال شوند">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## کنترل دسترسی

### پیام‌های مستقیم

برای کنترل اینکه چه کسی می‌تواند به ربات پیام مستقیم بدهد، `dmPolicy` را پیکربندی کنید:

- `"pairing"` - کاربران ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ از طریق CLI تأیید کنید
- `"allowlist"` - فقط کاربران فهرست‌شده در `allowFrom` می‌توانند گفت‌وگو کنند
- `"open"` - فقط وقتی `allowFrom` شامل `"*"` باشد پیام‌های مستقیم عمومی را مجاز کنید؛ با ورودی‌های محدودکننده، فقط کاربران منطبق می‌توانند گفت‌وگو کنند

**تأیید درخواست جفت‌سازی:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### گفت‌وگوهای گروهی

**سیاست گروه** (`channels.feishu.groupPolicy`):

| مقدار         | رفتار                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | به همه پیام‌ها در گروه‌ها پاسخ بده                                                            |
| `"allowlist"` | فقط به گروه‌های موجود در `groupAllowFrom` یا گروه‌هایی که صراحتاً زیر `groups.<chat_id>` پیکربندی شده‌اند پاسخ بده |
| `"disabled"`  | همه پیام‌های گروهی را غیرفعال کن؛ ورودی‌های صریح `groups.<chat_id>` این را بازنویسی نمی‌کنند         |

پیش‌فرض: `allowlist`

**الزام اشاره** (`channels.feishu.requireMention`):

- `true` - @mention لازم است (پیش‌فرض)
- `false` - بدون @mention پاسخ بده
- بازنویسی برای هر گروه: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` و `@_all` که فقط برای پخش همگانی هستند، به‌عنوان اشاره به ربات در نظر گرفته نمی‌شوند. پیامی که هم `@all` و هم مستقیماً ربات را اشاره کند، همچنان به‌عنوان اشاره به ربات شمرده می‌شود.

---

## نمونه‌های پیکربندی گروه

### مجاز کردن همه گروه‌ها، بدون نیاز به @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### مجاز کردن همه گروه‌ها، همچنان با نیاز به @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### فقط مجاز کردن گروه‌های مشخص

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

در حالت `allowlist`، می‌توانید با افزودن یک ورودی صریح `groups.<chat_id>` نیز یک گروه را بپذیرید. ورودی‌های صریح `groupPolicy: "disabled"` را بازنویسی نمی‌کنند. پیش‌فرض‌های wildcard زیر `groups.*` گروه‌های منطبق را پیکربندی می‌کنند، اما خودشان به‌تنهایی گروه‌ها را نمی‌پذیرند.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### محدود کردن فرستندگان درون یک گروه

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## دریافت شناسه‌های گروه/کاربر

### شناسه‌های گروه (`chat_id`، قالب: `oc_xxx`)

گروه را در Feishu/Lark باز کنید، روی آیکن منو در گوشه بالا-راست کلیک کنید، و به **Settings** بروید. شناسه گروه (`chat_id`) در صفحه تنظیمات فهرست شده است.

![دریافت شناسه گروه](/images/feishu-get-group-id.png)

### شناسه‌های کاربر (`open_id`، قالب: `ou_xxx`)

Gateway را شروع کنید، یک پیام مستقیم به ربات بفرستید، سپس گزارش‌ها را بررسی کنید:

```bash
openclaw logs --follow
```

در خروجی گزارش به‌دنبال `open_id` بگردید. همچنین می‌توانید درخواست‌های جفت‌سازی در انتظار را بررسی کنید:

```bash
openclaw pairing list feishu
```

---

## فرمان‌های رایج

| فرمان   | توضیح                 |
| --------- | --------------------------- |
| `/status` | نمایش وضعیت ربات             |
| `/reset`  | بازنشانی نشست فعلی   |
| `/model`  | نمایش یا تغییر مدل AI |

<Note>
Feishu/Lark از منوهای بومی فرمان اسلش پشتیبانی نمی‌کند، بنابراین این‌ها را به‌عنوان پیام‌های متنی ساده بفرستید.
</Note>

---

## عیب‌یابی

### ربات در گفت‌وگوهای گروهی پاسخ نمی‌دهد

1. مطمئن شوید ربات به گروه افزوده شده است
2. مطمئن شوید ربات را @mention می‌کنید (به‌صورت پیش‌فرض لازم است)
3. بررسی کنید `groupPolicy` برابر `"disabled"` نباشد
4. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پیام‌ها را دریافت نمی‌کند

1. مطمئن شوید ربات در Feishu Open Platform / Lark Developer منتشر و تأیید شده است
2. مطمئن شوید اشتراک رویداد شامل `im.message.receive_v1` است
3. مطمئن شوید **اتصال پایدار** (WebSocket) انتخاب شده است
4. مطمئن شوید همه دامنه‌های دسترسی مجوز لازم اعطا شده‌اند
5. مطمئن شوید Gateway در حال اجراست: `openclaw gateway status`
6. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

### راه‌اندازی QR در اپلیکیشن موبایل Feishu واکنش نشان نمی‌دهد

1. راه‌اندازی را دوباره اجرا کنید: `openclaw channels login --channel feishu`
2. راه‌اندازی دستی را انتخاب کنید
3. در Feishu Open Platform، یک اپلیکیشن خودساخته ایجاد کنید و App ID و App Secret آن را کپی کنید
4. آن اعتبارنامه‌ها را در جادوگر راه‌اندازی جای‌گذاری کنید

### App Secret افشا شده است

1. App Secret را در Feishu Open Platform / Lark Developer بازنشانی کنید
2. مقدار را در پیکربندی خود به‌روزرسانی کنید
3. Gateway را بازراه‌اندازی کنید: `openclaw gateway restart`

---

## پیکربندی پیشرفته

### چند حساب

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` کنترل می‌کند وقتی APIهای خروجی `accountId` مشخص نمی‌کنند، از کدام حساب استفاده شود.
`accounts.<id>.tts` از همان شکل `messages.tts` استفاده می‌کند و روی پیکربندی سراسری TTS
deep-merge می‌شود، بنابراین راه‌اندازی‌های چندرباتی Feishu می‌توانند اعتبارنامه‌های مشترک ارائه‌دهنده را
به‌صورت سراسری نگه دارند و فقط صدا، مدل، persona، یا حالت خودکار را
برای هر حساب بازنویسی کنند.

### محدودیت‌های پیام

- `textChunkLimit` - اندازه قطعه متن خروجی (پیش‌فرض: `2000` نویسه)
- `mediaMaxMb` - محدودیت بارگذاری/بارگیری رسانه (پیش‌فرض: `30` MB)

### Streaming

Feishu/Lark از پاسخ‌های Streaming از طریق کارت‌های تعاملی پشتیبانی می‌کند. وقتی فعال باشد، ربات هنگام تولید متن، کارت را در زمان واقعی به‌روزرسانی می‌کند.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

برای ارسال پاسخ کامل در یک پیام، `streaming: false` را تنظیم کنید. `blockStreaming` به‌صورت پیش‌فرض خاموش است؛ آن را فقط وقتی فعال کنید که می‌خواهید بلوک‌های تکمیل‌شده دستیار پیش از پاسخ نهایی flush شوند.

### بهینه‌سازی سهمیه

تعداد فراخوانی‌های API Feishu/Lark را با دو پرچم اختیاری کاهش دهید:

- `typingIndicator` (پیش‌فرض `true`): برای رد کردن فراخوانی‌های واکنش تایپ، `false` تنظیم کنید
- `resolveSenderNames` (پیش‌فرض `true`): برای رد کردن lookupهای پروفایل فرستنده، `false` تنظیم کنید

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### نشست‌های ACP

Feishu/Lark از ACP برای پیام‌های مستقیم و پیام‌های رشته گروهی پشتیبانی می‌کند. ACP در Feishu/Lark مبتنی بر فرمان متنی است - منوهای بومی فرمان اسلش وجود ندارند، بنابراین پیام‌های `/acp ...` را مستقیماً در مکالمه استفاده کنید.

#### اتصال پایدار ACP

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### ایجاد ACP از گفت‌وگو

در یک پیام مستقیم یا رشته Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` برای پیام‌های مستقیم و پیام‌های رشته Feishu/Lark کار می‌کند. پیام‌های بعدی در مکالمه متصل‌شده مستقیماً به همان نشست ACP هدایت می‌شوند.

### مسیریابی چندعاملی

از `bindings` برای مسیریابی پیام‌های مستقیم یا گروه‌های Feishu/Lark به عامل‌های مختلف استفاده کنید.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

فیلدهای مسیریابی:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (پیام مستقیم) یا `"group"` (گفت‌وگوی گروهی)
- `match.peer.id`: Open ID کاربر (`ou_xxx`) یا شناسه گروه (`oc_xxx`)

برای نکات lookup، [دریافت شناسه‌های گروه/کاربر](#get-groupuser-ids) را ببینید.

---

## ایزوله‌سازی عامل برای هر کاربر (ایجاد پویای عامل)

`dynamicAgentCreation` را فعال کنید تا برای هر کاربر پیام مستقیم، **نمونه‌های عامل ایزوله** به‌صورت خودکار ایجاد شوند. هر کاربر موارد زیر را دریافت می‌کند:

- پوشه کاری مستقل
- `USER.md` / `SOUL.md` / `MEMORY.md` جداگانه
- تاریخچه مکالمه خصوصی
- Skills و وضعیت ایزوله

این برای ربات‌های عمومی ضروری است؛ جایی که می‌خواهید هر کاربر تجربه دستیار AI خصوصی خودش را داشته باشد.

<Note>
اتصال‌های پویا شامل `accountId` نرمال‌شده Feishu هستند، بنابراین حساب‌های پیش‌فرض و نام‌دار هر فرستنده را به عامل پویای درست هدایت می‌کنند.

اگر یک حساب نام‌دار در نسخه‌ای قدیمی‌تر یک عامل پویای بدون دامنه ایجاد کرده باشد، آن عامل قدیمی همچنان در `maxAgents` حساب می‌شود. پیش از حذف آن، تأیید کنید که توسط حساب پیش‌فرض استفاده نمی‌شود، یا موقتاً `maxAgents` را افزایش دهید؛ OpenClaw نمی‌تواند با اطمینان استنباط کند کدام حساب مالک وضعیت قدیمی مبهم است.
</Note>

### راه‌اندازی سریع

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### نحوه کار

وقتی کاربر جدیدی نخستین پیام مستقیم خود را می‌فرستد:

1. کانال یک `agentId` یکتا تولید می‌کند: `feishu-{user_open_id}` برای حساب پیش‌فرض، یا یک digest هویت محدود و پیشونددار با حساب برای حساب نام‌دار
2. یک پوشه کاری جدید در مسیر `workspaceTemplate` ایجاد می‌کند
3. عامل را ثبت می‌کند و برای این کاربر یک اتصال می‌سازد
4. کمک‌کننده پوشه کاری در نخستین دسترسی وجود فایل‌های راه‌اندازی اولیه (`AGENTS.md`، `SOUL.md`، `USER.md` و غیره) را تضمین می‌کند
5. همه پیام‌های آینده از این کاربر را به عامل اختصاصی او هدایت می‌کند

### گزینه‌های پیکربندی

| تنظیم                                                  | توضیح                                | پیش‌فرض                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | فعال‌سازی ایجاد خودکار عامل برای هر کاربر   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | قالب مسیر برای فضاهای کاری پویای عامل | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | قالب نام پوشه عامل              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | حداکثر تعداد عامل‌های پویا برای ایجاد | نامحدود                            |

متغیرهای قالب:

- `{agentId}` - شناسه عامل تولیدشده (مثلاً `feishu-ou_xxxxxx` یا `feishu-support-<identity_digest>`)
- `{userId}` - open_id فرستنده در Feishu (مثلاً `ou_xxxxxx`)

### دامنه نشست

`session.dmScope` کنترل می‌کند پیام‌های مستقیم چگونه به نشست‌های عامل نگاشت شوند. این یک **تنظیم سراسری** است که روی همه کانال‌ها اثر می‌گذارد.

| مقدار                        | رفتار                                                            | مناسب برای                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | پیام مستقیم هر کاربر به نشست اصلی عامل خودش نگاشت می‌شود                   | ربات‌های تک‌کاربره که می‌خواهید `USER.md` / `SOUL.md` به‌طور خودکار بارگذاری شوند |
| `"per-channel-peer"`         | هر ترکیب (کانال + کاربر) یک نشست جداگانه می‌گیرد           | ربات‌های عمومی چندکاربره که به جداسازی قوی‌تر نیاز دارند                  |
| `"per-account-channel-peer"` | هر ترکیب (حساب + کانال + کاربر) یک نشست جداگانه می‌گیرد | ربات‌های چندحسابی که به جداسازی نشست در سطح حساب نیاز دارند         |

**مصالحه**: استفاده از `"main"` بارگذاری خودکار فایل‌های راه‌انداز (`USER.md`، `SOUL.md`، `MEMORY.md`) را فعال می‌کند، اما یعنی همه پیام‌های مستقیم در همه کانال‌ها الگوی کلید نشست یکسانی را به اشتراک می‌گذارند. برای ربات‌های عمومی چندکاربره که جداسازی در آن‌ها مهم‌تر از بارگذاری خودکار راه‌انداز است، `"per-channel-peer"` را در نظر بگیرید و فایل‌های راه‌انداز را دستی مدیریت کنید.

<Note>
وقتی حساب‌های نام‌دار Feishu باید برای یک فرستنده یکسان نشست‌های جداگانه نگه دارند، از `"per-account-channel-peer"` استفاده کنید. اتصال‌های پویا دامنه حساب را حفظ می‌کنند.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### استقرار معمول چندکاربره

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### راستی‌آزمایی

لاگ‌های Gateway را بررسی کنید تا تأیید شود ایجاد پویا کار می‌کند:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

فهرست همه فضاهای کاری ایجادشده:

```bash
ls -la ~/.openclaw/workspace-*
```

### نکات

- **جداسازی فضای کاری**: هر کاربر پوشه فضای کاری و نمونه عامل خودش را می‌گیرد. کاربران در جریان عادی پیام‌رسانی نمی‌توانند تاریخچه مکالمه یا فایل‌های یکدیگر را ببینند.
- **مرز امنیتی**: این یک سازوکار جداسازی زمینه پیام‌رسانی است، نه یک مرز امنیتی برای هم‌مستأجر متخاصم. فرایند عامل و محیط میزبان مشترک هستند.
- **`bindings` باید خالی باشد**: عامل‌های پویا اتصال‌های خودشان را خودکار ثبت می‌کنند
- **مسیر ارتقا**: اتصال‌های دستی موجود در کنار عامل‌های پویا همچنان کار می‌کنند
- **`session.dmScope` سراسری است**: این روی همه کانال‌ها اثر می‌گذارد، نه فقط Feishu

---

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیم                                                  | توضیح                                                                      | پیش‌فرض                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | فعال/غیرفعال کردن کانال                                                       | `true`                               |
| `channels.feishu.domain`                                 | دامنه API (`feishu` یا `lark`)                                                  | `feishu`                             |
| `channels.feishu.connectionMode`                         | انتقال رویداد (`websocket` یا `webhook`)                                       | `websocket`                          |
| `channels.feishu.defaultAccount`                         | حساب پیش‌فرض برای مسیریابی خروجی                                             | `default`                            |
| `channels.feishu.verificationToken`                      | برای حالت webhook لازم است                                                        | -                                    |
| `channels.feishu.encryptKey`                             | برای حالت webhook لازم است                                                        | -                                    |
| `channels.feishu.webhookPath`                            | مسیر Webhook                                                               | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | میزبان اتصال Webhook                                                                | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | درگاه اتصال Webhook                                                                | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | شناسه برنامه                                                                           | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | راز برنامه                                                                       | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | بازنویسی دامنه برای هر حساب                                                      | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | بازنویسی TTS برای هر حساب                                                         | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | سیاست پیام مستقیم                                                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | فهرست مجاز پیام مستقیم (فهرست open_id)                                                      | -                                    |
| `channels.feishu.groupPolicy`                            | سیاست گروه                                                                     | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | فهرست مجاز گروه                                                                  | -                                    |
| `channels.feishu.requireMention`                         | نیاز به @mention در گروه‌ها                                                       | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | بازنویسی @mention برای هر گروه؛ شناسه‌های صریح گروه را در حالت فهرست مجاز نیز می‌پذیرند | موروثی                            |
| `channels.feishu.groups.<chat_id>.enabled`               | فعال/غیرفعال کردن یک گروه مشخص                                                  | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | فعال‌سازی ایجاد خودکار عامل برای هر کاربر                                         | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | قالب مسیر برای فضاهای کاری پویای عامل                                       | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | قالب نام پوشه عامل                                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | حداکثر تعداد عامل‌های پویا برای ایجاد                                       | نامحدود                            |
| `channels.feishu.textChunkLimit`                         | اندازه قطعه پیام                                                               | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | محدودیت اندازه رسانه                                                                 | `30`                                 |
| `channels.feishu.streaming`                              | خروجی کارت جریانی                                                            | `true`                               |
| `channels.feishu.blockStreaming`                         | جریان‌سازی پاسخ بلوک تکمیل‌شده                                                  | `false`                              |
| `channels.feishu.typingIndicator`                        | ارسال واکنش‌های تایپ                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | تشخیص نام‌های نمایشی فرستنده                                                     | `true`                               |
| `channels.feishu.tools.bitable`                          | فعال‌سازی ابزارهای Bitable/Base                                                        | `true`                               |
| `channels.feishu.tools.base`                             | نام مستعار برای `channels.feishu.tools.bitable`؛ وقتی هر دو تنظیم شده باشند، `bitable` مقدم است | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | دروازه ابزار Bitable/Base برای هر حساب                                               | موروثی                            |
| `channels.feishu.accounts.<id>.tools.base`               | نام مستعار هر حساب برای `tools.bitable`                                            | موروثی                            |

---

## انواع پیام پشتیبانی‌شده

### دریافت

- ✅ متن
- ✅ متن غنی (post)
- ✅ تصاویر
- ✅ فایل‌ها
- ✅ صوت
- ✅ ویدئو/رسانه
- ✅ استیکرها

پیام‌های صوتی ورودی Feishu/Lark به‌جای JSON خام `file_key` به‌صورت جای‌نگهدارهای رسانه‌ای نرمال‌سازی می‌شوند. وقتی `tools.media.audio` پیکربندی شده باشد، OpenClaw منبع یادداشت صوتی را دانلود می‌کند و پیش از نوبت عامل، رونویسی صوتی مشترک را اجرا می‌کند، بنابراین عامل رونویس گفتار را دریافت می‌کند. اگر Feishu متن رونویس را مستقیماً در بار صوتی بگنجاند، آن متن بدون فراخوانی ASR دیگر استفاده می‌شود. بدون ارائه‌دهنده رونویسی صوتی، عامل همچنان یک جای‌نگهدار `<media:audio>` به‌همراه پیوست ذخیره‌شده دریافت می‌کند، نه بار منبع خام Feishu.

### ارسال

- ✅ متن
- ✅ تصاویر
- ✅ فایل‌ها
- ✅ صدا
- ✅ ویدئو/رسانه
- ✅ کارت‌های تعاملی (از جمله به‌روزرسانی‌های جریانی)
- ⚠️ متن غنی (قالب‌بندی به سبک پست؛ از قابلیت‌های کامل نگارش Feishu/Lark پشتیبانی نمی‌کند)

حباب‌های صوتی بومی Feishu/Lark از نوع پیام `audio` در Feishu استفاده می‌کنند و به
رسانهٔ بارگذاری‌شدهٔ Ogg/Opus (`file_type: "opus"`) نیاز دارند. رسانه‌های `.opus` و `.ogg` موجود
مستقیماً به‌صورت صدای بومی ارسال می‌شوند. MP3/WAV/M4A و دیگر قالب‌های محتمل صوتی
فقط زمانی با `ffmpeg` به Ogg/Opus با 48kHz تبدیل می‌شوند که پاسخ، تحویل صوتی را درخواست کند
(`audioAsVoice` / ابزار پیام `asVoice`، از جمله پاسخ‌های یادداشت صوتی TTS).
پیوست‌های معمولی MP3 به‌صورت فایل‌های عادی باقی می‌مانند. اگر `ffmpeg` موجود نباشد یا
تبدیل شکست بخورد، OpenClaw به پیوست فایل بازمی‌گردد و دلیل را ثبت می‌کند.

### رشته‌ها و پاسخ‌ها

- ✅ پاسخ‌های درون‌خطی
- ✅ پاسخ‌های رشته‌ای
- ✅ پاسخ‌های رسانه‌ای هنگام پاسخ به یک پیام رشته‌ای، آگاه از رشته باقی می‌مانند

برای `groupSessionScope: "group_topic"` و `"group_topic_sender"`، گروه‌های موضوعی بومی
Feishu/Lark از `thread_id` رویداد (`omt_*`) به‌عنوان کلید متعارف نشست موضوع استفاده می‌کنند.
اگر یک رویداد شروع‌کنندهٔ موضوع بومی `thread_id` را حذف کرده باشد، OpenClaw پیش از مسیریابی نوبت
آن را از Feishu تکمیل می‌کند. پاسخ‌های عادی گروهی که OpenClaw آن‌ها را به رشته تبدیل می‌کند
همچنان از شناسهٔ پیام ریشهٔ پاسخ (`om_*`) استفاده می‌کنند تا نوبت نخست و نوبت پیگیری در همان نشست باقی بمانند.

---

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - جریان احراز هویت و جفت‌سازی DM
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و کنترل دروازه‌ای اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
