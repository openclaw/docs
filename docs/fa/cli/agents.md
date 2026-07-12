---
read_when:
    - چند عامل مجزا می‌خواهید (فضاهای کاری + مسیریابی + احراز هویت)
summary: مرجع CLI برای `openclaw agents` (فهرست‌کردن/افزودن/حذف‌کردن/اتصال‌ها/متصل‌کردن/جداکردن/تنظیم هویت)
title: عامل‌ها
x-i18n:
    generated_at: "2026-07-12T09:43:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

عامل‌های ایزوله (فضاهای کاری + احراز هویت + مسیریابی) را مدیریت کنید. اجرای `openclaw agents` بدون زیرفرمان، معادل `openclaw agents list` است.

مرتبط:

- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [فضای کاری عامل](/fa/concepts/agent-workspace)
- [پیکربندی Skills](/fa/tools/skills-config): پیکربندی قابلیت مشاهدهٔ Skills.

## نمونه‌ها

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## مجموعهٔ فرمان‌ها

### `agents list`

گزینه‌ها: `--json`، `--bindings` (قواعد کامل مسیریابی را شامل می‌شود، نه فقط تعدادها/خلاصه‌های هر عامل).

### `agents add [name]`

گزینه‌ها: `--workspace <dir>`، `--model <id>`، `--agent-dir <dir>`، `--bind <channel[:accountId]>` (قابل تکرار)، `--non-interactive`، `--json`.

- ارائهٔ هر پرچم صریح مربوط به افزودن، فرمان را به مسیر غیرتعاملی منتقل می‌کند.
- حالت غیرتعاملی هم به نام عامل و هم به `--workspace` نیاز دارد.
- `main` رزروشده است و نمی‌توان از آن به‌عنوان شناسهٔ عامل جدید استفاده کرد.
- حالت تعاملی، احراز هویت را با کپی‌کردن فقط اعتبارنامه‌های ایستای قابل‌انتقال (پروفایل‌های `api_key` و `token` ایستا) مقداردهی اولیه می‌کند، مگر اینکه اعتبارنامه‌ای با `copyToAgents: false` از این کار انصراف دهد؛ پروفایل‌های توکن نوسازی OAuth کپی نمی‌شوند، مگر اینکه ارائه‌دهنده‌ای با `copyToAgents: true` آن را فعال کند. در صورت کپی‌نشدن، OAuth فقط از طریق وراثت خواندنی از مخزن عامل واقعی `main` در دسترس می‌ماند. اگر عامل پیش‌فرض پیکربندی‌شده `main` نیست، برای پروفایل‌های OAuth در عامل جدید جداگانه وارد شوید.

### `agents bindings`

گزینه‌ها: `--agent <id>`، `--json`.

### `agents bind`

گزینه‌ها: `--agent <id>` (به‌طور پیش‌فرض عامل پیش‌فرض فعلی)، `--bind <channel[:accountId]>` (قابل تکرار)، `--json`.

### `agents unbind`

گزینه‌ها: `--agent <id>` (به‌طور پیش‌فرض عامل پیش‌فرض فعلی)، `--bind <channel[:accountId]>` (قابل تکرار)، `--all`، `--json`. یا `--all` را می‌پذیرد یا یک یا چند مقدار `--bind` را، نه هر دو را.

### `agents set-identity`

گزینه‌ها: `--agent <id>`، `--workspace <dir>`، `--identity-file <path>`، `--from-identity`، `--name <name>`، `--theme <theme>`، `--emoji <emoji>`، `--avatar <value>`، `--json`. بخش [تنظیم هویت](#set-identity) را در ادامه ببینید.

### `agents delete <id>`

گزینه‌ها: `--force`، `--json`.

- `main` را نمی‌توان حذف کرد.
- بدون `--force`، تأیید تعاملی الزامی است (در نشست غیر TTY با خطا مواجه می‌شود؛ فرمان را با `--force` دوباره اجرا کنید).
- پوشه‌های فضای کاری، وضعیت عامل و رونوشت نشست به سطل زباله منتقل می‌شوند و به‌طور دائمی حذف نمی‌شوند.
- وقتی Gateway در دسترس باشد، حذف از طریق Gateway مسیریابی می‌شود تا پاک‌سازی پیکربندی و مخزن نشست از همان نویسنده‌ای استفاده کند که ترافیک زمان اجرا به کار می‌برد. اگر Gateway در دسترس نباشد، CLI به مسیر محلی آفلاین بازمی‌گردد.
- اگر فضای کاری عامل دیگری همان مسیر باشد، داخل این فضای کاری قرار داشته باشد یا این فضای کاری را دربر بگیرد، فضای کاری حفظ می‌شود و `--json` مقادیر `workspaceRetained`، `workspaceRetainedReason` و `workspaceSharedWith` را گزارش می‌کند.

## اتصال‌های مسیریابی

از اتصال‌های مسیریابی برای مقیدکردن ترافیک ورودی کانال به یک عامل مشخص استفاده کنید.

اگر می‌خواهید Skills قابل‌مشاهده برای هر عامل نیز متفاوت باشند، `agents.defaults.skills` و `agents.list[].skills` را در `openclaw.json` پیکربندی کنید. [پیکربندی Skills](/fa/tools/skills-config) و [مرجع پیکربندی](/fa/gateway/config-agents#agentsdefaultsskills) را ببینید.

فهرست‌کردن اتصال‌ها:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

افزودن اتصال‌ها:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

همچنین می‌توانید هنگام ایجاد عامل، اتصال‌ها را اضافه کنید:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

اگر `accountId` را حذف کنید (`--bind <channel>`)، OpenClaw آن را از هوک‌های راه‌اندازی Plugin، اتصال اجباری حساب یا تعداد حساب‌های پیکربندی‌شدهٔ کانال تعیین می‌کند.

اگر برای `bind` یا `unbind` گزینهٔ `--agent` را حذف کنید، OpenClaw عامل پیش‌فرض فعلی را هدف قرار می‌دهد.

### قالب `--bind`

| قالب                         | معنا                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | با همهٔ حساب‌های کانال مطابقت دارد.                                                                                   |
| `--bind <channel>:<account>` | با یک حساب مطابقت دارد.                                                                                               |
| `--bind <channel>`           | فقط با حساب پیش‌فرض مطابقت دارد، مگر اینکه CLI بتواند با اطمینان محدودهٔ حساب مختص یک Plugin را تعیین کند.           |

### رفتار محدودهٔ اتصال

- اتصال ذخیره‌شده‌ای که `accountId` ندارد، فقط با حساب پیش‌فرض کانال مطابقت دارد.
- `accountId: "*"` گزینهٔ جایگزین سراسری کانال (همهٔ حساب‌ها) است و از اتصال صریح حساب اختصاصیت کمتری دارد.
- اگر همان عامل از قبل یک اتصال کانال منطبق بدون `accountId` داشته باشد و بعداً با یک `accountId` صریح یا تعیین‌شده اتصال برقرار کنید، OpenClaw همان اتصال موجود را درجا ارتقا می‌دهد و اتصال تکراری اضافه نمی‌کند.

نمونه‌ها:

```bash
# مطابقت با همهٔ حساب‌های کانال
openclaw agents bind --agent work --bind telegram:*

# مطابقت با یک حساب مشخص
openclaw agents bind --agent work --bind telegram:ops

# اتصال اولیه فقط به کانال
openclaw agents bind --agent work --bind telegram

# ارتقای بعدی به اتصال محدود به حساب
openclaw agents bind --agent work --bind telegram:alerts
```

پس از ارتقا، مسیریابی این اتصال به `telegram:alerts` محدود می‌شود. اگر مسیریابی حساب پیش‌فرض را نیز می‌خواهید، آن را صریحاً اضافه کنید (برای نمونه `--bind telegram:default`).

حذف اتصال‌ها:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## فایل‌های هویت

هر فضای کاری عامل می‌تواند یک `IDENTITY.md` در ریشهٔ فضای کاری داشته باشد:

- مسیر نمونه: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` از ریشهٔ فضای کاری (یا یک `--identity-file` صریح) می‌خواند.

مسیرهای آواتار نسبت به ریشهٔ فضای کاری تعیین می‌شوند و حتی از طریق پیوند نمادین نیز نمی‌توانند از آن خارج شوند.

## تنظیم هویت

`set-identity` فیلدها را در `agents.list[].identity` می‌نویسد: `name`، `theme`، `emoji`، `avatar` (مسیر نسبی به فضای کاری، نشانی اینترنتی http(s) یا URI داده).

- `--agent` یا `--workspace` عامل هدف را انتخاب می‌کند. اگر `--workspace` با بیش از یک عامل مطابقت داشته باشد، فرمان با خطا مواجه می‌شود و از شما می‌خواهد `--agent` را ارائه دهید.
- فایل‌های تصویر آواتار محلی با مسیر نسبی به فضای کاری به ۲ مگابایت محدود هستند. نشانی‌های HTTP(S) و URIهای `data:` در برابر محدودیت اندازهٔ فایل محلی بررسی نمی‌شوند.
- وقتی هیچ فیلد هویت صریحی ارائه نشده باشد، فرمان داده‌های هویت را از `IDENTITY.md` می‌خواند.

بارگیری از `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

بازنویسی صریح فیلدها:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

نمونهٔ پیکربندی:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [فضای کاری عامل](/fa/concepts/agent-workspace)
