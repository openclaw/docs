---
read_when:
    - می‌خواهید یک ربات Feishu/Lark را متصل کنید
    - در حال پیکربندی کانال Feishu هستید
summary: نمای کلی، قابلیت‌ها و پیکربندی ربات Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-16T15:19:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw از طریق Plugin رسمی `@openclaw/feishu` به Feishu/Lark (پلتفرم جامع همکاری) متصل می‌شود: پیام‌های مستقیم ربات، گفت‌وگوهای گروهی، پاسخ‌های کارتی جریانی و ابزارهای سند/ویکی/درایو/Bitable در Feishu.

**وضعیت:** آماده بهره‌برداری برای پیام‌های مستقیم ربات و گفت‌وگوهای گروهی. WebSocket انتقال پیش‌فرض رویدادها است (به URL عمومی نیازی نیست)؛ حالت Webhook اختیاری است.

## شروع سریع

<Note>
به OpenClaw نسخه 2026.5.29 یا بالاتر نیاز دارد. برای بررسی، `openclaw --version` را اجرا کنید. با `openclaw update` ارتقا دهید.
</Note>

<Steps>
  <Step title="اجرای راهنمای راه‌اندازی کانال">
  ```bash
  openclaw channels login --channel feishu
  ```
  اگر Plugin ‏`@openclaw/feishu` موجود نباشد، این فرمان آن را نصب می‌کند و سپس مراحل راه‌اندازی را پیش می‌برد:

- **راه‌اندازی دستی**: یک App ID و App Secret را از Feishu Open Platform ‏(`https://open.feishu.cn`) یا Lark Developer ‏(`https://open.larksuite.com`) جای‌گذاری کنید.
- **راه‌اندازی با QR**: برای ایجاد خودکار ربات، یک کد QR را در برنامه Feishu اسکن کنید. این فرایند پیام‌های مستقیم را به حساب خودتان محدود می‌کند (`dmPolicy: "allowlist"` با `open_id` شما).

راهنما همچنین دامنه API ‏(Feishu یا Lark) و خط‌مشی گروه را می‌پرسد. اگر برنامه موبایل داخلی Feishu به کد QR واکنش نشان نداد، راه‌اندازی را دوباره اجرا و راه‌اندازی دستی را انتخاب کنید.
</Step>

  <Step title="پس از تکمیل راه‌اندازی، برای اعمال تغییرات Gateway را بازراه‌اندازی کنید">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## کنترل دسترسی

### پیام‌های مستقیم

برای کنترل اینکه چه کسانی می‌توانند به ربات پیام مستقیم بدهند، `channels.feishu.dmPolicy` (پیش‌فرض: `pairing`) را پیکربندی کنید:

| مقدار         | رفتار                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | کاربران ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ آن را از طریق CLI تأیید کنید                                                         |
| `"allowlist"` | فقط کاربران فهرست‌شده در `allowFrom` می‌توانند گفت‌وگو کنند                                                                     |
| `"open"`      | پیام‌های مستقیم عمومی؛ اعتبارسنجی پیکربندی مستلزم آن است که `allowFrom` شامل `"*"` باشد. ورودی‌های غیرعام همچنان دسترسی را محدود می‌کنند |

**تأیید درخواست جفت‌سازی:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### گفت‌وگوهای گروهی

**خط‌مشی گروه** (`channels.feishu.groupPolicy`، پیش‌فرض: `allowlist`):

| مقدار         | رفتار                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | به همه پیام‌ها در گروه‌ها پاسخ می‌دهد                                                            |
| `"allowlist"` | فقط به گروه‌های موجود در `groupAllowFrom` یا گروه‌هایی که صریحاً زیر `groups.<chat_id>` پیکربندی شده‌اند پاسخ می‌دهد |
| `"disabled"`  | همه پیام‌های گروهی را غیرفعال می‌کند؛ ورودی‌های صریح `groups.<chat_id>` این وضعیت را نادیده نمی‌گیرند         |

**الزام اشاره** (`channels.feishu.requireMention`):

- پیش‌فرض: ‎@mention الزامی است، مگر زمانی که خط‌مشی مؤثر گروه `"open"` باشد؛ در آن حالت، مقدار پیش‌فرض `false` است تا پیام‌هایی که نمی‌توانند شامل اشاره باشند (برای مثال تصاویر) همچنان به عامل برسند.
- برای نادیده‌گرفتن مقدار پیش‌فرض، `true` یا `false` را صریحاً تنظیم کنید؛ نادیده‌گیری برای هر گروه: `channels.feishu.groups.<chat_id>.requireMention`.
- موارد صرفاً همگانیِ `@all` و `@_all` به‌عنوان اشاره به ربات در نظر گرفته نمی‌شوند. پیامی که هم‌زمان به `@all` و مستقیماً به ربات اشاره کند، همچنان اشاره به ربات محسوب می‌شود.

## نمونه‌های پیکربندی گروه

### اجازه به همه گروه‌ها، بدون الزام ‎@mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
    },
  },
}
```

### اجازه به همه گروه‌ها، همچنان با الزام ‎@mention

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

### اجازه فقط به گروه‌های مشخص

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

در حالت `allowlist`، می‌توانید با افزودن یک ورودی صریح `groups.<chat_id>` نیز گروهی را بپذیرید. ورودی‌های صریح `groupPolicy: "disabled"` را نادیده نمی‌گیرند. مقادیر پیش‌فرض عام زیر `groups.*` گروه‌های منطبق را پیکربندی می‌کنند، اما به‌تنهایی موجب پذیرش گروه‌ها نمی‌شوند.

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

### محدودکردن فرستندگان درون یک گروه

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

`channels.feishu.groupSenderAllowFrom` همان فهرست مجاز فرستندگان را برای همه گروه‌ها تنظیم می‌کند؛ `allowFrom` مختص هر گروه اولویت دارد.

<a id="get-groupuser-ids"></a>

## دریافت شناسه‌های گروه/کاربر

### شناسه‌های گروه (`chat_id`، قالب: `oc_xxx`)

گروه را در Feishu/Lark باز کنید، روی نماد منو در گوشه بالا سمت راست کلیک کنید و به **Settings** بروید. شناسه گروه (`chat_id`) در صفحه تنظیمات درج شده است.

![دریافت شناسه گروه](/images/feishu-get-group-id.png)

### شناسه‌های کاربر (`open_id`، قالب: `ou_xxx`)

Gateway را اجرا کنید، یک پیام مستقیم به ربات بفرستید و سپس گزارش‌ها را بررسی کنید:

```bash
openclaw logs --follow
```

در خروجی گزارش به‌دنبال `open_id` بگردید. همچنین می‌توانید درخواست‌های جفت‌سازی در انتظار را بررسی کنید:

```bash
openclaw pairing list feishu
```

## فرمان‌های رایج

| فرمان   | توضیحات                 |
| --------- | --------------------------- |
| `/status` | نمایش وضعیت ربات             |
| `/reset`  | بازنشانی نشست فعلی   |
| `/model`  | نمایش یا تغییر مدل هوش مصنوعی |

<Note>
Feishu/Lark از منوهای بومی فرمان‌های اسلش پشتیبانی نمی‌کند؛ بنابراین این فرمان‌ها را به‌صورت پیام متنی ساده ارسال کنید.
</Note>

## عیب‌یابی

### ربات در گفت‌وگوهای گروهی پاسخ نمی‌دهد

1. مطمئن شوید ربات به گروه افزوده شده است
2. مطمئن شوید با ‎@mention به ربات اشاره می‌کنید (به‌طور پیش‌فرض الزامی است)
3. بررسی کنید `groupPolicy` برابر با `"disabled"` نباشد
4. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پیام‌ها را دریافت نمی‌کند

1. مطمئن شوید ربات در Feishu Open Platform / Lark Developer منتشر و تأیید شده است
2. مطمئن شوید اشتراک رویداد شامل `im.message.receive_v1` است
3. مطمئن شوید **persistent connection** ‏(WebSocket) انتخاب شده است
4. مطمئن شوید همه دامنه‌های مجوز لازم اعطا شده‌اند
5. مطمئن شوید Gateway در حال اجرا است: `openclaw gateway status`
6. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

### راه‌اندازی با QR در برنامه موبایل Feishu واکنشی ایجاد نمی‌کند

1. راه‌اندازی را دوباره اجرا کنید: `openclaw channels login --channel feishu`
2. راه‌اندازی دستی را انتخاب کنید
3. در Feishu Open Platform یک برنامه خودساخته ایجاد و App ID و App Secret آن را کپی کنید
4. آن اطلاعات احراز هویت را در راهنمای راه‌اندازی جای‌گذاری کنید

### App Secret افشا شده است

1. App Secret را در Feishu Open Platform / Lark Developer بازنشانی کنید
2. مقدار را در پیکربندی خود به‌روزرسانی کنید
3. Gateway را بازراه‌اندازی کنید: `openclaw gateway restart`

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

`defaultAccount` تعیین می‌کند وقتی APIهای خروجی یک `accountId` را مشخص نمی‌کنند، از کدام حساب استفاده شود. ورودی‌های حساب تنظیمات سطح بالا را به ارث می‌برند؛ بیشتر کلیدهای سطح بالا را می‌توان برای هر حساب نادیده گرفت.
`accounts.<id>.tts` ساختاری یکسان با `messages.tts` دارد و با پیکربندی سراسری TTS به‌صورت عمیق ادغام می‌شود؛ بنابراین راه‌اندازی‌های چندرباتی Feishu می‌توانند اطلاعات احراز هویت مشترک ارائه‌دهنده را به‌صورت سراسری نگه دارند و فقط صدا، مدل، پرسونا یا حالت خودکار را برای هر حساب نادیده بگیرند.

### محدودیت‌های پیام

- `textChunkLimit` - اندازه قطعه متن خروجی (پیش‌فرض: `4000` نویسه)
- `streaming.chunkMode` - `"length"` (پیش‌فرض) متن را در حد تعیین‌شده تقسیم می‌کند؛ `"newline"` مرزهای خط جدید را ترجیح می‌دهد
- `mediaMaxMb` - محدودیت بارگذاری/دریافت رسانه (پیش‌فرض: `30` MB)

### جریان‌دهی

Feishu/Lark از پاسخ‌های جریانی از طریق کارت‌های تعاملی (API جریان‌دهی Card Kit) پشتیبانی می‌کند. وقتی فعال باشد، ربات هم‌زمان با تولید متن، کارت را بی‌درنگ به‌روزرسانی می‌کند.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // streaming card output (default: "partial")
        block: { enabled: true }, // opt into completed-block streaming
      },
    },
  },
}
```

برای ارسال پاسخ کامل در یک پیام، `streaming.mode: "off"` را تنظیم کنید؛ `renderMode: "raw"` (متن ساده به‌جای کارت‌ها) نیز کارت‌های جریانی را غیرفعال می‌کند. `streaming.block.enabled` به‌طور پیش‌فرض خاموش است؛ آن را فقط زمانی فعال کنید که می‌خواهید بلوک‌های تکمیل‌شده دستیار پیش از پاسخ نهایی ارسال شوند. مقدار بولی قدیمی `streaming` و کلیدهای مسطح `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` از طریق `openclaw doctor --fix` به این ساختار تودرتو مهاجرت می‌کنند.

### بهینه‌سازی سهمیه

با دو پرچم اختیاری، تعداد فراخوانی‌های API در Feishu/Lark را کاهش دهید:

- `typingIndicator` (پیش‌فرض `true`): برای صرف‌نظر از فراخوانی‌های واکنش تایپ، `false` را تنظیم کنید
- `resolveSenderNames` (پیش‌فرض `true`): برای صرف‌نظر از جست‌وجوی نمایه فرستنده، `false` را تنظیم کنید

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

### دامنه نشست گروه و رشته‌های موضوع

`channels.feishu.groupSessionScope` (در سطح بالا، برای هر حساب یا برای هر گروه) نحوه نگاشت پیام‌های گروهی به نشست‌های عامل را کنترل می‌کند:

| مقدار                  | نشست                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (پیش‌فرض)    | یک نشست برای هر گفت‌وگوی گروهی                                       |
| `"group_sender"`       | یک نشست برای هر (گروه + فرستنده)                                 |
| `"group_topic"`        | یک نشست برای هر رشته موضوع؛ در صورت عدم امکان، از نشست گروه استفاده می‌کند    |
| `"group_topic_sender"` | یک نشست برای هر (موضوع + فرستنده)؛ در صورت عدم امکان، از (گروه + فرستنده) استفاده می‌کند |

برای دامنه‌های موضوع، گروه‌های موضوعی بومی Feishu/Lark از رویداد `thread_id` ‏(`omt_*`) به‌عنوان کلید معیار نشست موضوع استفاده می‌کنند. اگر رویداد آغازگر موضوع بومی فاقد `thread_id` باشد، OpenClaw پیش از مسیریابی نوبت، آن را از Feishu دریافت و تکمیل می‌کند. پاسخ‌های عادی گروهی که OpenClaw به رشته تبدیل می‌کند، همچنان از شناسه پیام ریشه پاسخ (`om_*`) استفاده می‌کنند تا نوبت نخست و نوبت‌های بعدی در همان نشست باقی بمانند.

برای اینکه پاسخ‌های ربات به‌جای پاسخ درون‌خطی، یک رشته موضوع Feishu ایجاد یا ادامه دهند، `replyInThread: "enabled"` (در سطح بالا یا برای هر گروه) را تنظیم کنید. `topicSessionMode` نسخه منسوخ پیشین `groupSessionScope` است؛ `groupSessionScope` را ترجیح دهید.

### ابزارهای فضای کاری Feishu

این Plugin ابزارهای عامل را برای اسناد، گفت‌وگوها، پایگاه دانش، فضای ذخیره‌سازی ابری، مجوزها و Bitable در Feishu، همراه با Skills متناظر (`feishu-doc`، `feishu-drive`، `feishu-perm`، `feishu-wiki`) ارائه می‌کند. خانواده‌های ابزار توسط `channels.feishu.tools` کنترل می‌شوند:

| کلید             | ابزارها                                         | پیش‌فرض             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | عملیات اسناد `feishu_doc`              | `true`              |
| `tools.chat`    | اطلاعات گفت‌وگو + پرس‌وجوهای اعضا `feishu_chat`      | `true`              |
| `tools.wiki`    | پایگاه دانش `feishu_wiki` (نیازمند `doc`) | `true`              |
| `tools.drive`   | فضای ذخیره‌سازی ابری `feishu_drive`                  | `true`              |
| `tools.perm`    | مدیریت مجوزها `feishu_perm`           | `false` (حساس) |
| `tools.scopes`  | عیب‌یابی دامنه دسترسی برنامه `feishu_app_scopes`     | `true`              |
| `tools.bitable` | عملیات Bitable/Base در `feishu_bitable_*`    | `true`              |

`tools.base` نام مستعار `tools.bitable` است؛ اگر هر دو تنظیم شده باشند، مقدار صریح `bitable` اولویت دارد. محدودیت‌های هر حساب در `accounts.<id>.tools` قرار دارند.

برای جست‌وجوهای مستقیم `feishu_drive info` خارج از دایرکتوری ریشه، مجوز `drive:drive.metadata:readonly` را اعطا کنید؛ مگر اینکه برنامه از قبل دامنه دسترسی کامل `drive:drive` را داشته باشد. بدون هیچ‌یک از این دامنه‌های دسترسی، `info`
جست‌وجوی قدیمی دایرکتوری ریشه را از طریق `drive:drive:readonly` در دسترس نگه می‌دارد.

### نشست‌های ACP

Feishu/Lark از ACP برای پیام‌های خصوصی و پیام‌های رشته‌ای گروه پشتیبانی می‌کند. ACP در Feishu/Lark با فرمان‌های متنی هدایت می‌شود—منوی بومی فرمان‌های اسلش وجود ندارد؛ بنابراین پیام‌های `/acp ...` را مستقیماً در مکالمه استفاده کنید.

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

در یک پیام خصوصی یا رشته Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` برای پیام‌های خصوصی و پیام‌های رشته‌ای Feishu/Lark کار می‌کند. پیام‌های بعدی در مکالمه متصل‌شده مستقیماً به آن نشست ACP هدایت می‌شوند.

### مسیریابی چندعاملی

برای هدایت پیام‌های خصوصی یا گروه‌های Feishu/Lark به عامل‌های مختلف، از `bindings` استفاده کنید.

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
- `match.peer.kind`: `"direct"` (پیام خصوصی) یا `"group"` (گفت‌وگوی گروهی)
- `match.peer.id`: شناسه Open ID کاربر (`ou_xxx`) یا شناسه گروه (`oc_xxx`)

برای نکات مربوط به جست‌وجو، به [دریافت شناسه‌های گروه/کاربر](#get-groupuser-ids) مراجعه کنید.

## جداسازی عامل به‌ازای هر کاربر (ایجاد پویای عامل)

برای ایجاد خودکار **نمونه‌های مجزای عامل** برای هر کاربر پیام خصوصی، `dynamicAgentCreation` را فعال کنید. هر کاربر موارد زیر را به‌صورت اختصاصی دریافت می‌کند:

- دایرکتوری فضای کاری مستقل
- `USER.md` / `SOUL.md` / `MEMORY.md` جداگانه
- تاریخچه مکالمه خصوصی
- Skills و وضعیت مجزا

این قابلیت برای ربات‌های عمومی که می‌خواهید هر کاربر در آن‌ها تجربه دستیار هوش مصنوعی خصوصی خود را داشته باشد، ضروری است.

<Note>
اتصال‌های پویا شامل `accountId` نرمال‌شده Feishu هستند؛ بنابراین حساب‌های پیش‌فرض و نام‌گذاری‌شده هر فرستنده را به عامل پویای درست هدایت می‌کنند.

اگر یک حساب نام‌گذاری‌شده در نسخه‌ای قدیمی‌تر، عاملی پویا و بدون دامنه ایجاد کرده باشد، آن عامل قدیمی همچنان در `maxAgents` محاسبه می‌شود. پیش از حذف آن، تأیید کنید که حساب پیش‌فرض از آن استفاده نمی‌کند؛ یا `maxAgents` را موقتاً افزایش دهید. OpenClaw نمی‌تواند با اطمینان تشخیص دهد وضعیت قدیمی مبهم متعلق به کدام حساب است.
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
    // حیاتی: پیام خصوصی هر کاربر را به «نشست اصلی» او تبدیل می‌کند
    // فایل‌های USER.md / SOUL.md / MEMORY.md را به‌طور خودکار بارگیری می‌کند
    // برای جداسازی قوی‌تر، به‌جای آن از "per-channel-peer" استفاده کنید
    dmScope: "main",
  },
}
```

### نحوه کار

هنگامی که کاربری جدید نخستین پیام خصوصی خود را ارسال می‌کند:

1. کانال یک `agentId` یکتا تولید می‌کند: `feishu-{user_open_id}` برای حساب پیش‌فرض، یا یک چکیده هویت محدود و دارای پیشوند حساب برای حساب نام‌گذاری‌شده
2. فضای کاری جدیدی را در مسیر `workspaceTemplate` ایجاد می‌کند
3. عامل را ثبت و برای این کاربر یک اتصال ایجاد می‌کند
4. کمک‌یار فضای کاری در نخستین دسترسی، وجود فایل‌های راه‌اندازی اولیه (`AGENTS.md`، `SOUL.md`، `USER.md` و غیره) را تضمین می‌کند
5. همه پیام‌های آینده این کاربر را به عامل اختصاصی او هدایت می‌کند

### گزینه‌های پیکربندی

| تنظیم                                                  | توضیحات                                | پیش‌فرض                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | فعال‌سازی ایجاد خودکار عامل به‌ازای هر کاربر   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | الگوی مسیر برای فضاهای کاری پویای عامل | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | الگوی نام دایرکتوری عامل              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | حداکثر تعداد عامل‌های پویای قابل ایجاد | نامحدود                            |

متغیرهای الگو:

- `{agentId}` - شناسه عامل تولیدشده (برای مثال، `feishu-ou_xxxxxx` یا `feishu-support-<identity_digest>`)
- `{userId}` - شناسه open_id فرستنده در Feishu (برای مثال، `ou_xxxxxx`)

### دامنه نشست

`session.dmScope` نحوه نگاشت پیام‌های مستقیم به نشست‌های عامل را کنترل می‌کند. این یک **تنظیم سراسری** است که بر همه کانال‌ها اثر می‌گذارد.

| مقدار                        | رفتار                                                            | مناسب برای                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | پیام خصوصی هر کاربر به نشست اصلی عامل او نگاشت می‌شود                   | ربات‌های تک‌کاربره‌ای که می‌خواهید `USER.md` / `SOUL.md` به‌طور خودکار بارگیری شوند |
| `"per-peer"`                 | هر همتا یک نشست جداگانه دریافت می‌کند (صرف‌نظر از کانال)           | جداسازی صرفاً بر اساس هویت فرستنده                            |
| `"per-channel-peer"`         | هر ترکیب (کانال + کاربر) یک نشست جداگانه دریافت می‌کند           | ربات‌های عمومی چندکاربره‌ای که به جداسازی قوی‌تر نیاز دارند                  |
| `"per-account-channel-peer"` | هر ترکیب (حساب + کانال + کاربر) یک نشست جداگانه دریافت می‌کند | ربات‌های چندحسابی که به جداسازی نشست در سطح حساب نیاز دارند         |

**موازنه**: استفاده از `"main"` بارگیری خودکار فایل‌های راه‌اندازی اولیه (`USER.md`، `SOUL.md`، `MEMORY.md`) را فعال می‌کند، اما به این معناست که همه پیام‌های خصوصی در تمام کانال‌ها الگوی کلید نشست یکسانی را به اشتراک می‌گذارند. برای ربات‌های عمومی چندکاربره‌ای که جداسازی در آن‌ها مهم‌تر از بارگیری خودکار فایل‌های راه‌اندازی اولیه است، `"per-channel-peer"` را در نظر بگیرید و فایل‌های راه‌اندازی اولیه را به‌صورت دستی مدیریت کنید.

<Note>
وقتی حساب‌های نام‌گذاری‌شده Feishu باید برای یک فرستنده نشست‌های جداگانه داشته باشند، از `"per-account-channel-peer"` استفاده کنید. اتصال‌های پویا دامنه حساب را حفظ می‌کنند.
</Note>

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
    // dmScope را بر اساس نیازهای جداسازی خود انتخاب کنید:
    // "main" برای بارگیری خودکار فایل‌های راه‌اندازی اولیه، "per-channel-peer" برای جداسازی قوی‌تر
    dmScope: "main",
  },
  bindings: [], // خالی — عامل‌های پویا به‌طور خودکار متصل می‌شوند
}
```

### تأیید عملکرد

برای تأیید عملکرد صحیح ایجاد پویا، گزارش‌های Gateway را بررسی کنید:

```text
feishu: در حال ایجاد عامل پویای "feishu-ou_xxxxxx" برای کاربر ou_xxxxxx
  فضای کاری: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  دایرکتوری عامل: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

فهرست همه فضاهای کاری ایجادشده:

```bash
ls -la ~/.openclaw/workspace-*
```

### نکات

- **جداسازی فضای کاری**: هر کاربر دایرکتوری فضای کاری و نمونه عامل اختصاصی خود را دریافت می‌کند. کاربران در جریان عادی پیام‌رسانی نمی‌توانند تاریخچه مکالمه یا فایل‌های یکدیگر را ببینند.
- **مرز امنیتی**: این سازوکاری برای جداسازی زمینه پیام‌رسانی است، نه یک مرز امنیتی در برابر هم‌مستأجر متخاصم. فرایند عامل و محیط میزبان مشترک هستند.
- **نوشتن پیکربندی باید فعال بماند**: ایجاد پویای عامل، عامل‌ها و اتصال‌ها را در پیکربندی می‌نویسد؛ وقتی `channels.feishu.configWrites` برابر با `false` باشد، این فرایند نادیده گرفته می‌شود (پیش‌فرض: فعال).
- **`bindings` باید خالی باشد**: عامل‌های پویا اتصال‌های خود را به‌طور خودکار ثبت می‌کنند
- **مسیر ارتقا**: اتصال‌های دستی موجود در کنار عامل‌های پویا همچنان کار می‌کنند
- **`session.dmScope` سراسری است**: این تنظیم بر همه کانال‌ها اثر می‌گذارد، نه فقط Feishu

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیم                                                  | توضیحات                                                                          | پیش‌فرض                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | فعال/غیرفعال‌کردن کانال                                                           | `true`                               |
| `channels.feishu.domain`                                 | دامنه API ‏(`feishu`، `lark`، یا یک URL پایه `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | انتقال رویداد (`websocket` یا `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | حساب پیش‌فرض برای مسیریابی خروجی                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | برای حالت Webhook الزامی است                                                            | -                                    |
| `channels.feishu.encryptKey`                             | برای حالت Webhook الزامی است                                                            | -                                    |
| `channels.feishu.webhookPath`                            | مسیر Webhook                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | میزبان اتصال Webhook                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | درگاه اتصال Webhook                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | شناسه برنامه                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | راز برنامه                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | بازنویسی دامنه برای هر حساب                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | بازنویسی TTS برای هر حساب                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | خط‌مشی پیام مستقیم (`pairing`، `allowlist`، `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | فهرست مجاز پیام مستقیم (فهرست open_id)                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | خط‌مشی گروه (`open`، `allowlist`، `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | فهرست مجاز گروه‌ها                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | فهرست مجاز فرستندگان که بر همه گروه‌ها اعمال می‌شود                                               | -                                    |
| `channels.feishu.requireMention`                         | الزام @منشن در گروه‌ها                                                           | `true` (`false` هنگام خط‌مشی `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | بازنویسی @منشن برای هر گروه؛ شناسه‌های صریح نیز گروه را در حالت فهرست مجاز می‌پذیرند     | ارث‌بری‌شده                            |
| `channels.feishu.groups.<chat_id>.enabled`               | فعال/غیرفعال‌کردن یک گروه مشخص                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | فهرست مجاز فرستندگان برای هر گروه (بازنویسی `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | نگاشت نشست گروه (`group`، `group_sender`، `group_topic`، `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | پاسخ‌های ربات رشته‌های موضوع را ایجاد/ادامه می‌دهند (`disabled`، `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | رویدادهای واکنش ورودی (`off`، `own`، `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | فعال‌کردن ایجاد خودکار عامل برای هر کاربر                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | الگوی مسیر برای فضاهای کاری پویای عامل                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | الگوی نام پوشه عامل                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | حداکثر تعداد عامل‌های پویا برای ایجاد                                           | نامحدود                            |
| `channels.feishu.textChunkLimit`                         | اندازه قطعه پیام                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | تقسیم‌بندی قطعه (`length` یا `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | محدودیت اندازه رسانه                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | رندر پاسخ (`auto`، `raw`، `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | خروجی جریانی کارت (`partial` یا `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | پخش جریانی پاسخِ بلوک‌های تکمیل‌شده                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | ارسال واکنش‌های در حال تایپ                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | شناسایی نام‌های نمایشی فرستندگان                                                         | `true`                               |
| `channels.feishu.configWrites`                           | اجازه نوشتن پیکربندی به ابتکار کانال (موردنیاز عامل‌های پویا)                     | `true`                               |
| `channels.feishu.tools.doc`                              | فعال‌کردن ابزارهای سند                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | فعال‌کردن ابزارهای اطلاعات گفت‌وگو                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | فعال‌کردن ابزارهای پایگاه دانش (نیازمند `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | فعال‌کردن ابزارهای فضای ذخیره‌سازی ابری                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | فعال‌کردن ابزارهای مدیریت مجوز                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | فعال‌کردن ابزار تشخیص دامنه‌های دسترسی برنامه                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | فعال‌کردن ابزارهای Bitable/Base                                                            | `true`                               |
| `channels.feishu.tools.base`                             | نام مستعار برای `channels.feishu.tools.bitable`؛ اگر هر دو تنظیم شوند، `bitable` صریح اولویت دارد     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | دروازه ابزار Bitable/Base برای هر حساب                                                   | ارث‌بری‌شده                            |
| `channels.feishu.accounts.<id>.tools.base`               | نام مستعار برای هر حساب برای `tools.bitable`                                                | ارث‌بری‌شده                            |

## انواع پیام پشتیبانی‌شده

### دریافت

- ✅ متن
- ✅ متن غنی (پست)
- ✅ تصاویر
- ✅ فایل‌ها
- ✅ صدا
- ✅ ویدئو/رسانه
- ✅ برچسب‌ها

پیام‌های صوتی ورودی Feishu/Lark به‌جای JSON خام `file_key` به‌صورت
جای‌نگهدار رسانه عادی‌سازی می‌شوند. وقتی `tools.media.audio` پیکربندی شده باشد، OpenClaw
منبع یادداشت صوتی را دانلود می‌کند و پیش از نوبت عامل، رونویسی صوتی مشترک را اجرا
می‌کند تا عامل متن گفتاری را دریافت کند. اگر Feishu متن رونویسی را مستقیماً
در بار صوتی قرار دهد، همان متن بدون فراخوانی دوباره ASR استفاده می‌شود.
بدون ارائه‌دهنده رونویسی صوتی، عامل همچنان یک جای‌نگهدار
`<media:audio>` به‌همراه پیوست ذخیره‌شده دریافت می‌کند، نه بار خام منبع Feishu.

### ارسال

- ✅ متن
- ✅ تصاویر
- ✅ فایل‌ها
- ✅ صدا
- ✅ ویدئو/رسانه
- ✅ کارت‌های تعاملی (شامل به‌روزرسانی‌های جریانی)
- ⚠️ متن غنی (قالب‌بندی به‌سبک پست؛ از تمام قابلیت‌های نگارش Feishu/Lark پشتیبانی نمی‌کند)

حباب‌های صوتی بومی Feishu/Lark از نوع پیام `audio` در Feishu استفاده می‌کنند و
به رسانه بارگذاری‌شده Ogg/Opus ‏(`file_type: "opus"`) نیاز دارند. رسانه‌های موجود
`.opus` و `.ogg` مستقیماً به‌صورت صدای بومی ارسال می‌شوند.
MP3/WAV/M4A و دیگر قالب‌های احتمالاً صوتی تنها زمانی با `ffmpeg` به
Ogg/Opus با فرکانس 48kHz تبدیل می‌شوند که پاسخ، تحویل صوتی را درخواست کند
(`audioAsVoice` / ابزار پیام `asVoice`، شامل پاسخ‌های یادداشت صوتی TTS).
پیوست‌های معمولی MP3 همچنان فایل عادی باقی می‌مانند. اگر `ffmpeg` موجود نباشد
یا تبدیل ناموفق باشد، OpenClaw به پیوست فایل بازمی‌گردد و دلیل را ثبت می‌کند.

### رشته‌ها و پاسخ‌ها

- ✅ پاسخ‌های درون‌خطی
- ✅ پاسخ‌های رشته‌ای
- ✅ پاسخ‌های رسانه‌ای هنگام پاسخ به پیام رشته، از رشته آگاه باقی می‌مانند

مسیریابی نشست گروه موضوعی در
[دامنه نشست گروه و رشته‌های موضوع](#group-session-scope-and-topic-threads) توضیح داده شده است.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و کنترل منشن
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
