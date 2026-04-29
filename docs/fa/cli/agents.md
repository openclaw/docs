---
read_when:
    - می‌خواهید چندین عامل مجزا داشته باشید (فضاهای کاری + مسیریابی + احراز هویت)
summary: مرجع CLI برای `openclaw agents` (فهرست/افزودن/حذف/اتصال‌ها/متصل‌کردن/قطع اتصال/تنظیم هویت)
title: عامل‌ها
x-i18n:
    generated_at: "2026-04-29T22:32:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

عامل‌های ایزوله را مدیریت کنید (محیط‌های کاری + احراز هویت + مسیریابی).

مرتبط:

- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [محیط کاری عامل](/fa/concepts/agent-workspace)
- [پیکربندی Skills](/fa/tools/skills-config): پیکربندی نمایش Skills.

## مثال‌ها

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## پیوندهای مسیریابی

از پیوندهای مسیریابی برای ثابت‌کردن ترافیک ورودی کانال به یک عامل مشخص استفاده کنید.

اگر همچنین Skills قابل مشاهده متفاوتی برای هر عامل می‌خواهید، `agents.defaults.skills` و `agents.list[].skills` را در `openclaw.json` پیکربندی کنید. [پیکربندی Skills](/fa/tools/skills-config) و [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

فهرست پیوندها:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

افزودن پیوندها:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

اگر `accountId` را حذف کنید (`--bind <channel>`)، OpenClaw در صورت وجود، آن را از پیش‌فرض‌های کانال و هوک‌های راه‌اندازی Plugin استخراج می‌کند.

اگر برای `bind` یا `unbind` گزینه `--agent` را حذف کنید، OpenClaw عامل پیش‌فرض فعلی را هدف قرار می‌دهد.

### رفتار دامنه پیوند

- پیوند بدون `accountId` فقط با حساب پیش‌فرض کانال مطابقت دارد.
- `accountId: "*"` جایگزین سراسری کانال است (همه حساب‌ها) و از پیوند حساب صریح، کمتر مشخص است.
- اگر همان عامل از قبل یک پیوند کانال مطابق بدون `accountId` داشته باشد، و بعدا با یک `accountId` صریح یا استخراج‌شده پیوند ایجاد کنید، OpenClaw همان پیوند موجود را درجا ارتقا می‌دهد، به‌جای اینکه مورد تکراری اضافه کند.

مثال:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

پس از ارتقا، مسیریابی برای آن پیوند به `telegram:ops` محدود می‌شود. اگر مسیریابی حساب پیش‌فرض را هم می‌خواهید، آن را صریح اضافه کنید (برای مثال `--bind telegram:default`).

حذف پیوندها:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` یا `--all` را می‌پذیرد یا یک یا چند مقدار `--bind`، نه هر دو را.

## سطح فرمان

### `agents`

اجرای `openclaw agents` بدون زیرفرمان، معادل `openclaw agents list` است.

### `agents list`

گزینه‌ها:

- `--json`
- `--bindings`: قوانین کامل مسیریابی را شامل شود، نه فقط شمارش‌ها/خلاصه‌های هر عامل

### `agents add [name]`

گزینه‌ها:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (قابل تکرار)
- `--non-interactive`
- `--json`

نکته‌ها:

- ارسال هر پرچم افزودن صریح، فرمان را وارد مسیر غیرتعاملی می‌کند.
- حالت غیرتعاملی هم نام عامل و هم `--workspace` را لازم دارد.
- `main` رزرو شده است و نمی‌توان از آن به‌عنوان شناسه عامل جدید استفاده کرد.
- در حالت تعاملی، بذرگذاری احراز هویت فقط پروفایل‌های ایستای قابل حمل را کپی می‌کند
  (به‌طور پیش‌فرض `api_key` و `token` ایستا). پروفایل‌های دارای توکن تازه‌سازی OAuth همچنان
  فقط از طریق وراثت خواندنی از مخزن واقعی عامل `main` در دسترس می‌مانند.
  اگر عامل پیش‌فرض پیکربندی‌شده `main` نیست، برای پروفایل‌های OAuth روی عامل جدید
  جداگانه وارد شوید.

### `agents bindings`

گزینه‌ها:

- `--agent <id>`
- `--json`

### `agents bind`

گزینه‌ها:

- `--agent <id>` (به‌طور پیش‌فرض عامل پیش‌فرض فعلی)
- `--bind <channel[:accountId]>` (قابل تکرار)
- `--json`

### `agents unbind`

گزینه‌ها:

- `--agent <id>` (به‌طور پیش‌فرض عامل پیش‌فرض فعلی)
- `--bind <channel[:accountId]>` (قابل تکرار)
- `--all`
- `--json`

### `agents delete <id>`

گزینه‌ها:

- `--force`
- `--json`

نکته‌ها:

- `main` قابل حذف نیست.
- بدون `--force`، تایید تعاملی لازم است.
- محیط کاری، وضعیت عامل، و دایرکتوری‌های رونوشت نشست به سطل زباله منتقل می‌شوند، نه اینکه به‌صورت دائمی حذف شوند.
- اگر محیط کاری عامل دیگری همان مسیر باشد، داخل این محیط کاری باشد، یا این محیط کاری را در بر بگیرد،
  محیط کاری نگه داشته می‌شود و `--json` مقادیر `workspaceRetained`،
  `workspaceRetainedReason`، و `workspaceSharedWith` را گزارش می‌کند.

## فایل‌های هویت

هر محیط کاری عامل می‌تواند یک `IDENTITY.md` در ریشه محیط کاری داشته باشد:

- مسیر نمونه: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` از ریشه محیط کاری می‌خواند (یا از یک `--identity-file` صریح)

مسیرهای آواتار نسبت به ریشه محیط کاری resolve می‌شوند.

## تنظیم هویت

`set-identity` فیلدها را در `agents.list[].identity` می‌نویسد:

- `name`
- `theme`
- `emoji`
- `avatar` (مسیر نسبی به محیط کاری، URL از نوع http(s)، یا data URI)

گزینه‌ها:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

نکته‌ها:

- برای انتخاب عامل هدف می‌توان از `--agent` یا `--workspace` استفاده کرد.
- اگر به `--workspace` اتکا کنید و چند عامل آن محیط کاری را به‌اشتراک بگذارند، فرمان شکست می‌خورد و از شما می‌خواهد `--agent` را ارسال کنید.
- وقتی هیچ فیلد هویت صریحی ارائه نشده باشد، فرمان داده‌های هویت را از `IDENTITY.md` می‌خواند.

بارگذاری از `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

بازنویسی صریح فیلدها:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

نمونه پیکربندی:

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
- [محیط کاری عامل](/fa/concepts/agent-workspace)
