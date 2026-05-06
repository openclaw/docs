---
read_when:
    - می‌خواهید یک ربات Feishu/Lark را متصل کنید
    - در حال پیکربندی کانال Feishu هستید
summary: نمای کلی، ویژگی‌ها و پیکربندی ربات Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-06T09:02:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2498c3b800563105c00345426a70a95914486633a07894cd74dbe487b167a6f4
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark یک پلتفرم همکاری همه‌کاره است که تیم‌ها در آن گفت‌وگو می‌کنند، اسناد را به اشتراک می‌گذارند، تقویم‌ها را مدیریت می‌کنند و کارها را با هم پیش می‌برند.

**وضعیت:** آماده تولید برای پیام‌های مستقیم بات + گفت‌وگوهای گروهی. WebSocket حالت پیش‌فرض است؛ حالت webhook اختیاری است.

---

## شروع سریع

<Note>
به OpenClaw نسخه 2026.4.25 یا بالاتر نیاز دارد. برای بررسی، `openclaw --version` را اجرا کنید. با `openclaw update` ارتقا دهید.
</Note>

<Steps>
  <Step title="اجرای راه‌انداز کانال">
  ```bash
  openclaw channels login --channel feishu
  ```
  کد QR را با برنامه موبایل Feishu/Lark اسکن کنید تا یک بات Feishu/Lark به‌صورت خودکار ساخته شود.
  </Step>
  
  <Step title="پس از تکمیل راه‌اندازی، Gateway را برای اعمال تغییرات دوباره راه‌اندازی کنید">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## کنترل دسترسی

### پیام‌های مستقیم

`dmPolicy` را پیکربندی کنید تا کنترل شود چه کسانی می‌توانند به بات پیام مستقیم بدهند:

- `"pairing"` - کاربران ناشناخته یک کد جفت‌سازی دریافت می‌کنند؛ از طریق CLI تأیید کنید
- `"allowlist"` - فقط کاربران فهرست‌شده در `allowFrom` می‌توانند گفت‌وگو کنند (پیش‌فرض: فقط مالک بات)
- `"open"` - پیام‌های مستقیم عمومی را فقط وقتی مجاز می‌کند که `allowFrom` شامل `"*"` باشد؛ با ورودی‌های محدودکننده، فقط کاربران منطبق می‌توانند گفت‌وگو کنند
- `"disabled"` - همه پیام‌های مستقیم را غیرفعال می‌کند

**تأیید یک درخواست جفت‌سازی:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### گفت‌وگوهای گروهی

**سیاست گروه** (`channels.feishu.groupPolicy`):

| مقدار         | رفتار                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | به همه پیام‌ها در گروه‌ها پاسخ می‌دهد                                                            |
| `"allowlist"` | فقط به گروه‌های موجود در `groupAllowFrom` یا گروه‌هایی که صریحاً زیر `groups.<chat_id>` پیکربندی شده‌اند پاسخ می‌دهد |
| `"disabled"`  | همه پیام‌های گروهی را غیرفعال می‌کند؛ ورودی‌های صریح `groups.<chat_id>` این را بازنویسی نمی‌کنند         |

پیش‌فرض: `allowlist`

**الزام اشاره** (`channels.feishu.requireMention`):

- `true` - نیازمند @mention است (پیش‌فرض)
- `false` - بدون @mention پاسخ می‌دهد
- بازنویسی برای هر گروه: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` و `@_all` فقط برای پخش همگانی هستند و به‌عنوان اشاره به بات در نظر گرفته نمی‌شوند. پیامی که هم `@all` و هم خود بات را مستقیماً اشاره کند، همچنان به‌عنوان اشاره به بات شمرده می‌شود.

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

### مجاز کردن همه گروه‌ها، همچنان نیازمند @mention

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

در حالت `allowlist`، همچنین می‌توانید با افزودن یک ورودی صریح `groups.<chat_id>` یک گروه را بپذیرید. ورودی‌های صریح `groupPolicy: "disabled"` را بازنویسی نمی‌کنند. پیش‌فرض‌های wildcard زیر `groups.*` گروه‌های منطبق را پیکربندی می‌کنند، اما به‌تنهایی گروه‌ها را نمی‌پذیرند.

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

### محدود کردن فرستنده‌ها درون یک گروه

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

گروه را در Feishu/Lark باز کنید، روی آیکن منو در گوشه بالا-راست کلیک کنید و به **تنظیمات** بروید. شناسه گروه (`chat_id`) در صفحه تنظیمات فهرست شده است.

![دریافت شناسه گروه](/images/feishu-get-group-id.png)

### شناسه‌های کاربر (`open_id`، قالب: `ou_xxx`)

Gateway را شروع کنید، یک پیام مستقیم به بات بفرستید، سپس لاگ‌ها را بررسی کنید:

```bash
openclaw logs --follow
```

در خروجی لاگ به دنبال `open_id` بگردید. همچنین می‌توانید درخواست‌های جفت‌سازی در انتظار را بررسی کنید:

```bash
openclaw pairing list feishu
```

---

## فرمان‌های رایج

| فرمان   | توضیح                 |
| --------- | --------------------------- |
| `/status` | نمایش وضعیت بات             |
| `/reset`  | بازنشانی نشست فعلی   |
| `/model`  | نمایش یا تغییر مدل AI |

<Note>
Feishu/Lark از منوهای بومی فرمان اسلش پشتیبانی نمی‌کند، بنابراین این‌ها را به‌صورت پیام‌های متنی ساده بفرستید.
</Note>

---

## عیب‌یابی

### بات در گفت‌وگوهای گروهی پاسخ نمی‌دهد

1. مطمئن شوید بات به گروه اضافه شده است
2. مطمئن شوید بات را @mention می‌کنید (به‌صورت پیش‌فرض الزامی است)
3. بررسی کنید `groupPolicy` برابر `"disabled"` نباشد
4. لاگ‌ها را بررسی کنید: `openclaw logs --follow`

### بات پیام‌ها را دریافت نمی‌کند

1. مطمئن شوید بات در Feishu Open Platform / Lark Developer منتشر و تأیید شده است
2. مطمئن شوید اشتراک رویداد شامل `im.message.receive_v1` است
3. مطمئن شوید **اتصال پایدار** (WebSocket) انتخاب شده است
4. مطمئن شوید همه دامنه‌های دسترسی لازم اعطا شده‌اند
5. مطمئن شوید Gateway در حال اجرا است: `openclaw gateway status`
6. لاگ‌ها را بررسی کنید: `openclaw logs --follow`

### App Secret افشا شده است

1. App Secret را در Feishu Open Platform / Lark Developer بازنشانی کنید
2. مقدار را در پیکربندی خود به‌روزرسانی کنید
3. Gateway را دوباره راه‌اندازی کنید: `openclaw gateway restart`

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

`defaultAccount` کنترل می‌کند وقتی APIهای خروجی `accountId` مشخص نمی‌کنند، کدام حساب استفاده شود.
`accounts.<id>.tts` از همان شکل `messages.tts` استفاده می‌کند و با پیکربندی سراسری TTS به‌صورت عمیق ادغام می‌شود، بنابراین راه‌اندازی‌های چندباتی Feishu می‌توانند اعتبارنامه‌های مشترک provider را به‌صورت سراسری نگه دارند و فقط صدا، مدل، پرسونا یا حالت خودکار را برای هر حساب بازنویسی کنند.

### محدودیت‌های پیام

- `textChunkLimit` - اندازه قطعه متن خروجی (پیش‌فرض: `2000` نویسه)
- `mediaMaxMb` - محدودیت بارگذاری/دریافت رسانه (پیش‌فرض: `30` مگابایت)

### پخش جریانی

Feishu/Lark از پاسخ‌های پخش جریانی از طریق کارت‌های تعاملی پشتیبانی می‌کند. وقتی فعال باشد، بات هنگام تولید متن، کارت را به‌صورت بلادرنگ به‌روزرسانی می‌کند.

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

برای ارسال پاسخ کامل در یک پیام، `streaming: false` را تنظیم کنید. `blockStreaming` به‌صورت پیش‌فرض خاموش است؛ فقط وقتی آن را فعال کنید که می‌خواهید بلوک‌های تکمیل‌شده دستیار پیش از پاسخ نهایی ارسال شوند.

### بهینه‌سازی سهمیه

تعداد فراخوانی‌های API Feishu/Lark را با دو پرچم اختیاری کاهش دهید:

- `typingIndicator` (پیش‌فرض `true`): روی `false` تنظیم کنید تا فراخوانی‌های واکنش تایپ نادیده گرفته شوند
- `resolveSenderNames` (پیش‌فرض `true`): روی `false` تنظیم کنید تا جست‌وجوی پروفایل فرستنده نادیده گرفته شود

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

Feishu/Lark از ACP برای پیام‌های مستقیم و پیام‌های رشته‌ای گروه پشتیبانی می‌کند. ACP در Feishu/Lark مبتنی بر فرمان متنی است - منوهای بومی فرمان اسلش وجود ندارند، بنابراین پیام‌های `/acp ...` را مستقیماً در گفت‌وگو استفاده کنید.

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

`--thread here` برای پیام‌های مستقیم و پیام‌های رشته‌ای Feishu/Lark کار می‌کند. پیام‌های بعدی در گفت‌وگوی متصل، مستقیماً به آن نشست ACP مسیریابی می‌شوند.

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

برای نکات جست‌وجو، [دریافت شناسه‌های گروه/کاربر](#get-groupuser-ids) را ببینید.

---

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیم                                             | توضیح                                                                            | پیش‌فرض         |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | فعال/غیرفعال کردن کانال                                                         | `true`           |
| `channels.feishu.domain`                          | دامنه API (`feishu` یا `lark`)                                                   | `feishu`         |
| `channels.feishu.connectionMode`                  | انتقال رویداد (`websocket` یا `webhook`)                                         | `websocket`      |
| `channels.feishu.defaultAccount`                  | حساب پیش‌فرض برای مسیریابی خروجی                                                | `default`        |
| `channels.feishu.verificationToken`               | برای حالت Webhook الزامی است                                                    | -                |
| `channels.feishu.encryptKey`                      | برای حالت Webhook الزامی است                                                    | -                |
| `channels.feishu.webhookPath`                     | مسیر روت Webhook                                                                | `/feishu/events` |
| `channels.feishu.webhookHost`                     | میزبان اتصال Webhook                                                            | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | پورت اتصال Webhook                                                              | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | شناسه برنامه                                                                     | -                |
| `channels.feishu.accounts.<id>.appSecret`         | رمز برنامه                                                                       | -                |
| `channels.feishu.accounts.<id>.domain`            | بازنویسی دامنه برای هر حساب                                                     | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | بازنویسی TTS برای هر حساب                                                       | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | سیاست DM                                                                         | `allowlist`      |
| `channels.feishu.allowFrom`                       | فهرست مجاز DM (فهرست open_id)                                                   | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سیاست گروه                                                                       | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | فهرست مجاز گروه                                                                 | -                |
| `channels.feishu.requireMention`                  | نیاز به @mention در گروه‌ها                                                     | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | بازنویسی @mention برای هر گروه؛ شناسه‌های صریح همچنین گروه را در حالت فهرست مجاز می‌پذیرند | به ارث رسیده     |
| `channels.feishu.groups.<chat_id>.enabled`        | فعال/غیرفعال کردن یک گروه مشخص                                                  | `true`           |
| `channels.feishu.textChunkLimit`                  | اندازه بخش پیام                                                                 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | محدودیت اندازه رسانه                                                            | `30`             |
| `channels.feishu.streaming`                       | خروجی کارت جریانی                                                               | `true`           |
| `channels.feishu.blockStreaming`                  | جریان‌دهی پاسخ بلوک تکمیل‌شده                                                   | `false`          |
| `channels.feishu.typingIndicator`                 | ارسال واکنش‌های تایپ                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | حل نام‌های نمایشی فرستنده                                                       | `true`           |

---

## نوع‌های پیام پشتیبانی‌شده

### دریافت

- ✅ متن
- ✅ متن غنی (پست)
- ✅ تصویرها
- ✅ فایل‌ها
- ✅ صوت
- ✅ ویدیو/رسانه
- ✅ استیکرها

پیام‌های صوتی ورودی Feishu/Lark به‌جای JSON خام `file_key` به‌صورت جایگزین‌های رسانه‌ای عادی‌سازی می‌شوند. وقتی `tools.media.audio` پیکربندی شده باشد، OpenClaw منبع یادداشت صوتی را دانلود می‌کند و پیش از نوبت عامل، رونویسی صوتی مشترک را اجرا می‌کند، بنابراین عامل رونوشت گفتار را دریافت می‌کند. اگر Feishu متن رونوشت را مستقیما در بار صوتی قرار دهد، همان متن بدون فراخوانی ASR دیگری استفاده می‌شود. بدون ارائه‌دهنده رونویسی صوتی، عامل همچنان یک جایگزین `<media:audio>` به‌همراه پیوست ذخیره‌شده دریافت می‌کند، نه بار منبع خام Feishu.

### ارسال

- ✅ متن
- ✅ تصویرها
- ✅ فایل‌ها
- ✅ صوت
- ✅ ویدیو/رسانه
- ✅ کارت‌های تعاملی (از جمله به‌روزرسانی‌های جریانی)
- ⚠️ متن غنی (قالب‌بندی به سبک پست؛ از همه قابلیت‌های نگارش Feishu/Lark پشتیبانی نمی‌کند)

حباب‌های صوتی بومی Feishu/Lark از نوع پیام `audio` در Feishu استفاده می‌کنند و به رسانه بارگذاری‌شده Ogg/Opus (`file_type: "opus"`) نیاز دارند. رسانه‌های `.opus` و `.ogg` موجود مستقیما به‌صورت صوت بومی ارسال می‌شوند. MP3/WAV/M4A و دیگر قالب‌های احتمالی صوتی فقط وقتی پاسخ تحویل صوتی را درخواست کند (`audioAsVoice` / ابزار پیام `asVoice`، از جمله پاسخ‌های یادداشت صوتی TTS)، با `ffmpeg` به Ogg/Opus با 48kHz تبدیل می‌شوند. پیوست‌های معمولی MP3 به‌صورت فایل‌های عادی باقی می‌مانند. اگر `ffmpeg` موجود نباشد یا تبدیل شکست بخورد، OpenClaw به پیوست فایل برمی‌گردد و دلیل را ثبت می‌کند.

### رشته‌ها و پاسخ‌ها

- ✅ پاسخ‌های درون‌خطی
- ✅ پاسخ‌های رشته‌ای
- ✅ هنگام پاسخ به یک پیام رشته‌ای، پاسخ‌های رسانه‌ای همچنان آگاه از رشته می‌مانند

برای `groupSessionScope: "group_topic"` و `"group_topic_sender"`، گروه‌های موضوعی بومی Feishu/Lark از `thread_id` رویداد (`omt_*`) به‌عنوان کلید متعارف نشست موضوع استفاده می‌کنند. اگر یک رویداد آغازگر موضوع بومی `thread_id` را حذف کند، OpenClaw پیش از مسیریابی نوبت، آن را از Feishu تکمیل می‌کند. پاسخ‌های عادی گروهی که OpenClaw آن‌ها را به رشته تبدیل می‌کند همچنان از شناسه پیام ریشه پاسخ (`om_*`) استفاده می‌کنند تا نوبت نخست و نوبت پیگیری در همان نشست بمانند.

---

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفتگوی گروهی و کنترل نیاز به اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
