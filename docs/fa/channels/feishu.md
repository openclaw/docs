---
read_when:
    - می‌خواهید یک ربات Feishu/Lark را متصل کنید
    - در حال پیکربندی کانال Feishu هستید
summary: نمای کلی، ویژگی‌ها و پیکربندی بات Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-11T20:20:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4e43c65072d44cb5973a1ed09cb5336f18d100d0cb5b43c5e31f37aecff329
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark یک پلتفرم همکاری همه‌کاره است که در آن تیم‌ها گفتگو می‌کنند، اسناد را به اشتراک می‌گذارند، تقویم‌ها را مدیریت می‌کنند و کارها را با هم انجام می‌دهند.

**وضعیت:** آمادهٔ تولید برای DMهای ربات + گفتگوهای گروهی. WebSocket حالت پیش‌فرض است؛ حالت webhook اختیاری است.

---

## شروع سریع

<Note>
به OpenClaw نسخهٔ 2026.4.25 یا بالاتر نیاز دارد. برای بررسی، `openclaw --version` را اجرا کنید. با `openclaw update` ارتقا دهید.
</Note>

<Steps>
  <Step title="Run the channel setup wizard">
  ```bash
  openclaw channels login --channel feishu
  ```
  راه‌اندازی دستی را انتخاب کنید تا App ID و App Secret را از Feishu Open Platform وارد کنید، یا راه‌اندازی QR را انتخاب کنید تا یک ربات به‌صورت خودکار ساخته شود. اگر برنامهٔ موبایل داخلی Feishu به کد QR واکنش نشان نداد، راه‌اندازی را دوباره اجرا کنید و راه‌اندازی دستی را انتخاب کنید.
  </Step>
  
  <Step title="After setup completes, restart the gateway to apply the changes">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## کنترل دسترسی

### پیام‌های مستقیم

برای کنترل اینکه چه کسی می‌تواند به ربات DM بدهد، `dmPolicy` را پیکربندی کنید:

- `"pairing"` - کاربران ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ از طریق CLI تأیید کنید
- `"allowlist"` - فقط کاربران فهرست‌شده در `allowFrom` می‌توانند گفتگو کنند (پیش‌فرض: فقط مالک ربات)
- `"open"` - فقط زمانی DMهای عمومی را مجاز می‌کند که `allowFrom` شامل `"*"` باشد؛ با ورودی‌های محدودکننده، فقط کاربران منطبق می‌توانند گفتگو کنند
- `"disabled"` - همهٔ DMها را غیرفعال می‌کند

**تأیید یک درخواست جفت‌سازی:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### گفتگوهای گروهی

**سیاست گروه** (`channels.feishu.groupPolicy`):

| مقدار         | رفتار                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | به همهٔ پیام‌ها در گروه‌ها پاسخ می‌دهد                                                            |
| `"allowlist"` | فقط به گروه‌های موجود در `groupAllowFrom` یا گروه‌هایی که صراحتاً زیر `groups.<chat_id>` پیکربندی شده‌اند پاسخ می‌دهد |
| `"disabled"`  | همهٔ پیام‌های گروهی را غیرفعال می‌کند؛ ورودی‌های صریح `groups.<chat_id>` این را بازنویسی نمی‌کنند         |

پیش‌فرض: `allowlist`

**الزام اشاره** (`channels.feishu.requireMention`):

- `true` - نیازمند @mention است (پیش‌فرض)
- `false` - بدون @mention پاسخ می‌دهد
- بازنویسی برای هر گروه: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` و `@_all` که فقط برای پخش همگانی هستند، به‌عنوان اشاره به ربات در نظر گرفته نمی‌شوند. پیامی که هم `@all` و هم خود ربات را مستقیماً اشاره کند، همچنان به‌عنوان اشاره به ربات شمرده می‌شود.

---

## نمونه‌های پیکربندی گروه

### مجاز کردن همهٔ گروه‌ها، بدون نیاز به @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### مجاز کردن همهٔ گروه‌ها، همچنان نیازمند @mention

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

در حالت `allowlist`، می‌توانید با افزودن یک ورودی صریح `groups.<chat_id>` نیز یک گروه را بپذیرید. ورودی‌های صریح `groupPolicy: "disabled"` را بازنویسی نمی‌کنند. پیش‌فرض‌های wildcard زیر `groups.*` گروه‌های منطبق را پیکربندی می‌کنند، اما به‌تنهایی گروه‌ها را نمی‌پذیرند.

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

گروه را در Feishu/Lark باز کنید، روی آیکن منو در گوشهٔ بالا-راست کلیک کنید و به **تنظیمات** بروید. شناسهٔ گروه (`chat_id`) در صفحهٔ تنظیمات فهرست شده است.

![دریافت شناسه گروه](/images/feishu-get-group-id.png)

### شناسه‌های کاربر (`open_id`، قالب: `ou_xxx`)

Gateway را شروع کنید، یک DM به ربات بفرستید، سپس لاگ‌ها را بررسی کنید:

```bash
openclaw logs --follow
```

در خروجی لاگ به‌دنبال `open_id` بگردید. همچنین می‌توانید درخواست‌های جفت‌سازی در انتظار را بررسی کنید:

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
Feishu/Lark از منوهای بومی فرمان اسلش پشتیبانی نمی‌کند، بنابراین این موارد را به‌صورت پیام‌های متنی ساده ارسال کنید.
</Note>

---

## عیب‌یابی

### ربات در گفتگوهای گروهی پاسخ نمی‌دهد

1. مطمئن شوید ربات به گروه اضافه شده است
2. مطمئن شوید ربات را @mention می‌کنید (به‌صورت پیش‌فرض لازم است)
3. بررسی کنید `groupPolicy` برابر `"disabled"` نباشد
4. لاگ‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پیام‌ها را دریافت نمی‌کند

1. مطمئن شوید ربات در Feishu Open Platform / Lark Developer منتشر و تأیید شده است
2. مطمئن شوید اشتراک رویداد شامل `im.message.receive_v1` باشد
3. مطمئن شوید **اتصال پایدار** (WebSocket) انتخاب شده است
4. مطمئن شوید همهٔ دامنه‌های مجوز لازم اعطا شده‌اند
5. مطمئن شوید Gateway در حال اجراست: `openclaw gateway status`
6. لاگ‌ها را بررسی کنید: `openclaw logs --follow`

### راه‌اندازی QR در برنامهٔ موبایل Feishu واکنش نشان نمی‌دهد

1. راه‌اندازی را دوباره اجرا کنید: `openclaw channels login --channel feishu`
2. راه‌اندازی دستی را انتخاب کنید
3. در Feishu Open Platform، یک برنامهٔ خودساخته ایجاد کنید و App ID و App Secret آن را کپی کنید
4. آن اعتبارنامه‌ها را در راهنمای راه‌اندازی وارد کنید

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
`accounts.<id>.tts` همان شکل `messages.tts` را استفاده می‌کند و روی پیکربندی سراسری TTS به‌صورت deep-merge اعمال می‌شود، بنابراین راه‌اندازی‌های چندرباتی Feishu می‌توانند اعتبارنامه‌های مشترک ارائه‌دهنده را به‌صورت سراسری نگه دارند و فقط صدا، مدل، persona، یا حالت خودکار را برای هر حساب بازنویسی کنند.

### محدودیت‌های پیام

- `textChunkLimit` - اندازهٔ قطعهٔ متن خروجی (پیش‌فرض: `2000` نویسه)
- `mediaMaxMb` - محدودیت بارگذاری/دریافت رسانه (پیش‌فرض: `30` MB)

### استریمینگ

Feishu/Lark از پاسخ‌های استریمینگ از طریق کارت‌های تعاملی پشتیبانی می‌کند. وقتی فعال باشد، ربات هنگام تولید متن، کارت را در زمان واقعی به‌روزرسانی می‌کند.

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

برای ارسال پاسخ کامل در یک پیام، `streaming: false` را تنظیم کنید. `blockStreaming` به‌صورت پیش‌فرض خاموش است؛ فقط زمانی آن را فعال کنید که می‌خواهید بلاک‌های کامل‌شدهٔ دستیار پیش از پاسخ نهایی ارسال شوند.

### بهینه‌سازی سهمیه

تعداد فراخوانی‌های API مربوط به Feishu/Lark را با دو پرچم اختیاری کاهش دهید:

- `typingIndicator` (پیش‌فرض `true`): برای رد کردن فراخوانی‌های واکنش تایپ، `false` تنظیم کنید
- `resolveSenderNames` (پیش‌فرض `true`): برای رد کردن جست‌وجوهای پروفایل فرستنده، `false` تنظیم کنید

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

Feishu/Lark از ACP برای DMها و پیام‌های رشتهٔ گروهی پشتیبانی می‌کند. ACP در Feishu/Lark مبتنی بر فرمان متنی است - منوهای بومی فرمان اسلش وجود ندارند، بنابراین از پیام‌های `/acp ...` مستقیماً در گفتگو استفاده کنید.

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

#### ایجاد ACP از گفتگو

در یک DM یا رشتهٔ Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` برای DMها و پیام‌های رشتهٔ Feishu/Lark کار می‌کند. پیام‌های بعدی در گفتگوی متصل‌شده مستقیماً به همان نشست ACP هدایت می‌شوند.

### مسیریابی چندعاملی

برای هدایت DMها یا گروه‌های Feishu/Lark به عامل‌های مختلف، از `bindings` استفاده کنید.

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
- `match.peer.kind`: `"direct"` (DM) یا `"group"` (گفتگوی گروهی)
- `match.peer.id`: Open ID کاربر (`ou_xxx`) یا شناسهٔ گروه (`oc_xxx`)

برای نکات جست‌وجو، [دریافت شناسه‌های گروه/کاربر](#get-groupuser-ids) را ببینید.

---

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیم                                           | توضیح                                                                      | پیش‌فرض          |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | فعال/غیرفعال کردن کانال                                                       | `true`           |
| `channels.feishu.domain`                          | دامنه API (`feishu` یا `lark`)                                                  | `feishu`         |
| `channels.feishu.connectionMode`                  | انتقال رویداد (`websocket` یا `webhook`)                                       | `websocket`      |
| `channels.feishu.defaultAccount`                  | حساب پیش‌فرض برای مسیریابی خروجی                                             | `default`        |
| `channels.feishu.verificationToken`               | برای حالت webhook لازم است                                                        | -                |
| `channels.feishu.encryptKey`                      | برای حالت webhook لازم است                                                        | -                |
| `channels.feishu.webhookPath`                     | مسیر route برای Webhook                                                               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | میزبان bind برای Webhook                                                                | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | پورت bind برای Webhook                                                                | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | شناسه App                                                                           | -                |
| `channels.feishu.accounts.<id>.appSecret`         | راز App                                                                       | -                |
| `channels.feishu.accounts.<id>.domain`            | بازنویسی دامنه برای هر حساب                                                      | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | بازنویسی TTS برای هر حساب                                                         | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | سیاست DM                                                                        | `allowlist`      |
| `channels.feishu.allowFrom`                       | فهرست مجاز DM (فهرست open_id)                                                      | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سیاست گروه                                                                     | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | فهرست مجاز گروه                                                                  | -                |
| `channels.feishu.requireMention`                  | الزام @mention در گروه‌ها                                                       | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | بازنویسی @mention برای هر گروه؛ شناسه‌های صریح همچنین گروه را در حالت فهرست مجاز می‌پذیرند | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | فعال/غیرفعال کردن یک گروه مشخص                                                  | `true`           |
| `channels.feishu.textChunkLimit`                  | اندازه قطعه پیام                                                               | `2000`           |
| `channels.feishu.mediaMaxMb`                      | محدودیت اندازه رسانه                                                                 | `30`             |
| `channels.feishu.streaming`                       | خروجی کارت جریانی                                                            | `true`           |
| `channels.feishu.blockStreaming`                  | پخش جریانی پاسخ بلوک تکمیل‌شده                                                  | `false`          |
| `channels.feishu.typingIndicator`                 | ارسال واکنش‌های در حال تایپ                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | رفع نام‌های نمایشی فرستنده                                                     | `true`           |

---

## نوع‌های پیام پشتیبانی‌شده

### دریافت

- ✅ متن
- ✅ متن غنی (post)
- ✅ تصویرها
- ✅ فایل‌ها
- ✅ صدا
- ✅ ویدئو/رسانه
- ✅ استیکرها

پیام‌های صوتی ورودی Feishu/Lark به‌جای JSON خام `file_key` به‌صورت جای‌نگهدار رسانه نرمال‌سازی می‌شوند. وقتی `tools.media.audio` پیکربندی شده باشد، OpenClaw منبع یادداشت صوتی را دانلود می‌کند و پیش از نوبت عامل، رونویسی صوتی مشترک را اجرا می‌کند؛ بنابراین عامل رونوشت گفتار را دریافت می‌کند. اگر Feishu متن رونوشت را مستقیماً در payload صوتی شامل کند، همان متن بدون فراخوانی ASR دیگر استفاده می‌شود. بدون ارائه‌دهنده رونویسی صوتی، عامل همچنان یک جای‌نگهدار `<media:audio>` به‌همراه پیوست ذخیره‌شده را دریافت می‌کند، نه payload خام منبع Feishu.

### ارسال

- ✅ متن
- ✅ تصویرها
- ✅ فایل‌ها
- ✅ صدا
- ✅ ویدئو/رسانه
- ✅ کارت‌های تعاملی (از جمله به‌روزرسانی‌های جریانی)
- ⚠️ متن غنی (قالب‌بندی به سبک post؛ از قابلیت‌های کامل نویسندگی Feishu/Lark پشتیبانی نمی‌کند)

حباب‌های صوتی بومی Feishu/Lark از نوع پیام `audio` در Feishu استفاده می‌کنند و به رسانه بارگذاری‌شده Ogg/Opus (`file_type: "opus"`) نیاز دارند. رسانه‌های موجود `.opus` و `.ogg` مستقیماً به‌صورت صدای بومی ارسال می‌شوند. MP3/WAV/M4A و دیگر قالب‌های محتمل صوتی فقط زمانی که پاسخ درخواست تحویل صوتی داشته باشد (`audioAsVoice` / ابزار پیام `asVoice`، از جمله پاسخ‌های یادداشت صوتی TTS)، با `ffmpeg` به Ogg/Opus با 48kHz تبدیل می‌شوند. پیوست‌های معمولی MP3 به‌صورت فایل‌های عادی باقی می‌مانند. اگر `ffmpeg` موجود نباشد یا تبدیل ناموفق شود، OpenClaw به پیوست فایل برمی‌گردد و دلیل را ثبت می‌کند.

### رشته‌ها و پاسخ‌ها

- ✅ پاسخ‌های درون‌خطی
- ✅ پاسخ‌های رشته‌ای
- ✅ پاسخ‌های رسانه‌ای هنگام پاسخ به یک پیام رشته‌ای همچنان از رشته آگاه می‌مانند

برای `groupSessionScope: "group_topic"` و `"group_topic_sender"`، گروه‌های موضوعی بومی Feishu/Lark از `thread_id` رویداد (`omt_*`) به‌عنوان کلید canonical جلسه موضوع استفاده می‌کنند. اگر یک رویداد آغازگر موضوع بومی `thread_id` را حذف کند، OpenClaw پیش از مسیریابی نوبت آن را از Feishu hydrate می‌کند. پاسخ‌های عادی گروه که OpenClaw آن‌ها را به رشته تبدیل می‌کند، همچنان از شناسه پیام ریشه پاسخ (`om_*`) استفاده می‌کنند تا نوبت اول و نوبت پیگیری در همان جلسه بمانند.

---

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و gate کردن mention
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی جلسه برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
