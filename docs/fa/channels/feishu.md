---
read_when:
    - می‌خواهید یک ربات Feishu/Lark را متصل کنید
    - شما در حال پیکربندی کانال Feishu هستید
summary: نمای کلی، ویژگی‌ها و پیکربندی ربات Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-29T22:25:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark یک پلتفرم همکاری همه‌کاره است که تیم‌ها در آن گفتگو می‌کنند، سندها را به اشتراک می‌گذارند، تقویم‌ها را مدیریت می‌کنند، و کارها را با هم پیش می‌برند.

**وضعیت:** آماده تولید برای پیام‌های مستقیم ربات + گفتگوهای گروهی. WebSocket حالت پیش‌فرض است؛ حالت webhook اختیاری است.

---

## شروع سریع

<Note>
به OpenClaw نسخه 2026.4.25 یا بالاتر نیاز دارد. برای بررسی، `openclaw --version` را اجرا کنید. با `openclaw update` ارتقا دهید.
</Note>

<Steps>
  <Step title="اجرای جادوگر راه‌اندازی کانال">
  ```bash
  openclaw channels login --channel feishu
  ```
  کد QR را با برنامه موبایل Feishu/Lark اسکن کنید تا یک ربات Feishu/Lark به‌صورت خودکار ساخته شود.
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

برای کنترل اینکه چه کسانی می‌توانند به ربات پیام مستقیم بدهند، `dmPolicy` را پیکربندی کنید:

- `"pairing"` — کاربران ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ از طریق CLI تأیید کنید
- `"allowlist"` — فقط کاربرانی که در `allowFrom` فهرست شده‌اند می‌توانند گفتگو کنند (پیش‌فرض: فقط مالک ربات)
- `"open"` — فقط وقتی `allowFrom` شامل `"*"` باشد پیام‌های مستقیم عمومی را مجاز می‌کند؛ با ورودی‌های محدودکننده، فقط کاربران منطبق می‌توانند گفتگو کنند
- `"disabled"` — همه پیام‌های مستقیم را غیرفعال می‌کند

**تأیید یک درخواست جفت‌سازی:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### گفتگوهای گروهی

**سیاست گروه** (`channels.feishu.groupPolicy`):

| مقدار         | رفتار                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | به همه پیام‌ها در گروه‌ها پاسخ می‌دهد                                                            |
| `"allowlist"` | فقط به گروه‌های موجود در `groupAllowFrom` یا گروه‌هایی که صراحتاً زیر `groups.<chat_id>` پیکربندی شده‌اند پاسخ می‌دهد |
| `"disabled"`  | همه پیام‌های گروهی را غیرفعال می‌کند؛ ورودی‌های صریح `groups.<chat_id>` این مورد را بازنویسی نمی‌کنند         |

پیش‌فرض: `allowlist`

**نیاز به منشن** (`channels.feishu.requireMention`):

- `true` — نیازمند @mention است (پیش‌فرض)
- `false` — بدون @mention پاسخ می‌دهد
- بازنویسی برای هر گروه: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` و `@_all` که فقط برای اعلان عمومی هستند، به‌عنوان منشن ربات در نظر گرفته نمی‌شوند. پیامی که هم `@all` و هم خود ربات را مستقیماً منشن کند همچنان به‌عنوان منشن ربات حساب می‌شود.

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

### مجاز کردن فقط گروه‌های مشخص

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

در حالت `allowlist`، همچنین می‌توانید با افزودن یک ورودی صریح `groups.<chat_id>` یک گروه را بپذیرید. ورودی‌های صریح، `groupPolicy: "disabled"` را بازنویسی نمی‌کنند. پیش‌فرض‌های wildcard زیر `groups.*` گروه‌های منطبق را پیکربندی می‌کنند، اما به‌تنهایی گروه‌ها را نمی‌پذیرند.

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

گروه را در Feishu/Lark باز کنید، روی آیکون منو در گوشه بالا-راست کلیک کنید، و به **تنظیمات** بروید. شناسه گروه (`chat_id`) در صفحه تنظیمات فهرست شده است.

![دریافت شناسه گروه](/images/feishu-get-group-id.png)

### شناسه‌های کاربر (`open_id`، قالب: `ou_xxx`)

Gateway را شروع کنید، یک پیام مستقیم به ربات بفرستید، سپس لاگ‌ها را بررسی کنید:

```bash
openclaw logs --follow
```

در خروجی لاگ به دنبال `open_id` بگردید. همچنین می‌توانید درخواست‌های جفت‌سازی در انتظار را بررسی کنید:

```bash
openclaw pairing list feishu
```

---

## دستورهای رایج

| دستور   | توضیح                 |
| --------- | --------------------------- |
| `/status` | نمایش وضعیت ربات             |
| `/reset`  | بازنشانی نشست فعلی   |
| `/model`  | نمایش یا تغییر مدل هوش مصنوعی |

<Note>
Feishu/Lark از منوهای native برای دستورهای اسلش پشتیبانی نمی‌کند، بنابراین این‌ها را به‌صورت پیام‌های متنی ساده ارسال کنید.
</Note>

---

## عیب‌یابی

### ربات در گفتگوهای گروهی پاسخ نمی‌دهد

1. مطمئن شوید ربات به گروه افزوده شده است
2. مطمئن شوید ربات را @mention می‌کنید (به‌صورت پیش‌فرض لازم است)
3. بررسی کنید `groupPolicy` برابر `"disabled"` نباشد
4. لاگ‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پیام‌ها را دریافت نمی‌کند

1. مطمئن شوید ربات در Feishu Open Platform / Lark Developer منتشر و تأیید شده است
2. مطمئن شوید اشتراک رویداد شامل `im.message.receive_v1` است
3. مطمئن شوید **اتصال پایدار** (WebSocket) انتخاب شده است
4. مطمئن شوید همه دامنه‌های مجوز لازم اعطا شده‌اند
5. مطمئن شوید Gateway در حال اجرا است: `openclaw gateway status`
6. لاگ‌ها را بررسی کنید: `openclaw logs --follow`

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

`defaultAccount` کنترل می‌کند وقتی APIهای خروجی یک `accountId` مشخص نمی‌کنند، کدام حساب استفاده شود.
`accounts.<id>.tts` همان شکل `messages.tts` را دارد و روی پیکربندی سراسری TTS به‌صورت deep-merge اعمال می‌شود، بنابراین راه‌اندازی‌های چندرباتی Feishu می‌توانند اطلاعات احراز هویت provider مشترک را به‌صورت سراسری نگه دارند و فقط صدا، مدل، پرسونا، یا حالت خودکار را برای هر حساب بازنویسی کنند.

### محدودیت‌های پیام

- `textChunkLimit` — اندازه قطعه متن خروجی (پیش‌فرض: `2000` نویسه)
- `mediaMaxMb` — محدودیت بارگذاری/دریافت رسانه (پیش‌فرض: `30` مگابایت)

### Streaming

Feishu/Lark از پاسخ‌های streaming از طریق کارت‌های تعاملی پشتیبانی می‌کند. وقتی فعال باشد، ربات هنگام تولید متن، کارت را به‌صورت بلادرنگ به‌روزرسانی می‌کند.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

برای ارسال پاسخ کامل در یک پیام، `streaming: false` را تنظیم کنید.

### بهینه‌سازی سهمیه

با دو پرچم اختیاری، تعداد فراخوانی‌های API Feishu/Lark را کاهش دهید:

- `typingIndicator` (پیش‌فرض `true`): برای رد کردن فراخوانی‌های واکنش تایپ، `false` تنظیم کنید
- `resolveSenderNames` (پیش‌فرض `true`): برای رد کردن جستجوهای نمایه فرستنده، `false` تنظیم کنید

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

Feishu/Lark از ACP برای پیام‌های مستقیم و پیام‌های رشته گروهی پشتیبانی می‌کند. ACP در Feishu/Lark با دستورهای متنی هدایت می‌شود — منوی native برای دستورهای اسلش وجود ندارد، بنابراین پیام‌های `/acp ...` را مستقیماً در گفتگو استفاده کنید.

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

#### اجرای ACP از گفتگو

در یک پیام مستقیم یا رشته Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` برای پیام‌های مستقیم و پیام‌های رشته Feishu/Lark کار می‌کند. پیام‌های بعدی در گفتگوی متصل‌شده مستقیماً به آن نشست ACP هدایت می‌شوند.

### مسیریابی چندعامله

برای مسیریابی پیام‌های مستقیم یا گروه‌های Feishu/Lark به agentهای متفاوت، از `bindings` استفاده کنید.

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
- `match.peer.kind`: `"direct"` (پیام مستقیم) یا `"group"` (گفتگوی گروهی)
- `match.peer.id`: Open ID کاربر (`ou_xxx`) یا شناسه گروه (`oc_xxx`)

برای نکته‌های جستجو، [دریافت شناسه‌های گروه/کاربر](#get-groupuser-ids) را ببینید.

---

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیم                                            | توضیح                                                                            | پیش‌فرض          |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | فعال/غیرفعال کردن کانال                                                          | `true`           |
| `channels.feishu.domain`                          | دامنه API (`feishu` یا `lark`)                                                   | `feishu`         |
| `channels.feishu.connectionMode`                  | انتقال رویداد (`websocket` یا `webhook`)                                         | `websocket`      |
| `channels.feishu.defaultAccount`                  | حساب پیش‌فرض برای مسیریابی خروجی                                                | `default`        |
| `channels.feishu.verificationToken`               | برای حالت webhook الزامی است                                                     | —                |
| `channels.feishu.encryptKey`                      | برای حالت webhook الزامی است                                                     | —                |
| `channels.feishu.webhookPath`                     | مسیر روت Webhook                                                                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | میزبان bind برای Webhook                                                         | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | پورت bind برای Webhook                                                           | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | شناسه برنامه                                                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | رمز برنامه                                                                       | —                |
| `channels.feishu.accounts.<id>.domain`            | بازنویسی دامنه برای هر حساب                                                      | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | بازنویسی TTS برای هر حساب                                                        | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | سیاست DM                                                                         | `allowlist`      |
| `channels.feishu.allowFrom`                       | فهرست مجاز DM (فهرست open_id)                                                    | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سیاست گروه                                                                       | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | فهرست مجاز گروه                                                                  | —                |
| `channels.feishu.requireMention`                  | الزام @mention در گروه‌ها                                                        | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | بازنویسی @mention برای هر گروه؛ شناسه‌های صریح همچنین گروه را در حالت فهرست مجاز می‌پذیرند | به‌ارث‌رسیده     |
| `channels.feishu.groups.<chat_id>.enabled`        | فعال/غیرفعال کردن یک گروه مشخص                                                   | `true`           |
| `channels.feishu.textChunkLimit`                  | اندازه قطعه پیام                                                                 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | محدودیت اندازه رسانه                                                             | `30`             |
| `channels.feishu.streaming`                       | خروجی کارت استریمینگ                                                             | `true`           |
| `channels.feishu.blockStreaming`                  | استریمینگ در سطح بلوک                                                            | `true`           |
| `channels.feishu.typingIndicator`                 | ارسال واکنش‌های در حال تایپ                                                      | `true`           |
| `channels.feishu.resolveSenderNames`              | تشخیص نام‌های نمایشی فرستنده                                                     | `true`           |

---

## انواع پیام پشتیبانی‌شده

### دریافت

- ✅ متن
- ✅ متن غنی (post)
- ✅ تصویرها
- ✅ فایل‌ها
- ✅ صوت
- ✅ ویدئو/رسانه
- ✅ استیکرها

پیام‌های صوتی ورودی Feishu/Lark به‌جای JSON خام `file_key` به‌صورت جایگزین‌های رسانه‌ای نرمال‌سازی می‌شوند. وقتی `tools.media.audio` پیکربندی شده باشد، OpenClaw منبع یادداشت صوتی را دانلود می‌کند و پیش از نوبت عامل، رونویسی صوتی مشترک را اجرا می‌کند؛ بنابراین عامل متن گفتاری رونویسی‌شده را دریافت می‌کند. اگر Feishu متن رونویسی را مستقیما در payload صوتی قرار دهد، همان متن بدون یک فراخوانی ASR دیگر استفاده می‌شود. بدون ارائه‌دهنده رونویسی صوتی، عامل همچنان یک جایگزین `<media:audio>` به‌همراه پیوست ذخیره‌شده را دریافت می‌کند، نه payload خام منبع Feishu.

### ارسال

- ✅ متن
- ✅ تصویرها
- ✅ فایل‌ها
- ✅ صوت
- ✅ ویدئو/رسانه
- ✅ کارت‌های تعاملی (از جمله به‌روزرسانی‌های استریمینگ)
- ⚠️ متن غنی (قالب‌بندی به سبک post؛ از تمام قابلیت‌های نگارش Feishu/Lark پشتیبانی نمی‌کند)

حباب‌های صوتی بومی Feishu/Lark از نوع پیام `audio` در Feishu استفاده می‌کنند و به رسانه آپلودی Ogg/Opus (`file_type: "opus"`) نیاز دارند. رسانه‌های موجود `.opus` و `.ogg` مستقیما به‌عنوان صوت بومی ارسال می‌شوند. MP3/WAV/M4A و قالب‌های احتمالا صوتی دیگر فقط وقتی پاسخ، تحویل صوتی را درخواست کند (`audioAsVoice` / ابزار پیام `asVoice`، از جمله پاسخ‌های یادداشت صوتی TTS)، با `ffmpeg` به Ogg/Opus با 48kHz تبدیل می‌شوند. پیوست‌های معمولی MP3 به‌صورت فایل‌های عادی باقی می‌مانند. اگر `ffmpeg` موجود نباشد یا تبدیل شکست بخورد، OpenClaw به پیوست فایل بازمی‌گردد و دلیل را لاگ می‌کند.

### رشته‌ها و پاسخ‌ها

- ✅ پاسخ‌های درون‌خطی
- ✅ پاسخ‌های رشته‌ای
- ✅ هنگام پاسخ به یک پیام رشته‌ای، پاسخ‌های رسانه‌ای همچنان نسبت به رشته آگاه می‌مانند

برای `groupSessionScope: "group_topic"` و `"group_topic_sender"`، گروه‌های موضوعی بومی Feishu/Lark از `thread_id` رویداد (`omt_*`) به‌عنوان کلید نشست موضوعی استاندارد استفاده می‌کنند. پاسخ‌های گروهی عادی که OpenClaw آن‌ها را به رشته تبدیل می‌کند، همچنان از شناسه پیام ریشه پاسخ (`om_*`) استفاده می‌کنند تا نوبت اول و نوبت پیگیری در همان نشست بمانند.

---

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه‌گذاری mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
