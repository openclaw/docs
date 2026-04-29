---
read_when:
    - می‌خواهید عامل‌ها اصلاحات یا رویه‌های قابل استفادهٔ مجدد را به Skills فضای کاری تبدیل کنند
    - شما در حال پیکربندی حافظهٔ مهارت رویه‌ای هستید
    - شما در حال اشکال‌زدایی رفتار ابزار skill_workshop هستید
    - شما در حال تصمیم‌گیری هستید که آیا ایجاد خودکار مهارت را فعال کنید یا نه
summary: ثبت آزمایشی رویه‌های قابل‌استفادهٔ مجدد به‌عنوان Skills فضای کاری، با بازبینی، تأیید، قرنطینه و به‌روزرسانی داغ Skills
title: Plugin کارگاه مهارت
x-i18n:
    generated_at: "2026-04-29T23:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop **آزمایشی** است. به‌طور پیش‌فرض غیرفعال است، اکتشاف‌گرهای
ثبت و پرامپت‌های بازبین آن ممکن است بین نسخه‌ها تغییر کنند، و نوشتن خودکار
فقط باید در فضاهای کاری قابل اعتماد و پس از بازبینی خروجی حالت pending
استفاده شود.

Skill Workshop حافظه رویه‌ای برای Skills فضای کاری است. به agent اجازه می‌دهد
workflowهای قابل استفاده مجدد، اصلاحات کاربر، رفع‌اشکال‌های دشوار، و دام‌های
تکرارشونده را به فایل‌های `SKILL.md` زیر تبدیل کند:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

این با حافظه بلندمدت متفاوت است:

- **Memory** واقعیت‌ها، ترجیحات، موجودیت‌ها، و زمینه گذشته را ذخیره می‌کند.
- **Skills** رویه‌های قابل استفاده مجددی را ذخیره می‌کند که agent باید در taskهای آینده دنبال کند.
- **Skill Workshop** پلی از یک turn مفید به یک skill پایدار در فضای کاری است،
  همراه با بررسی‌های ایمنی و تایید اختیاری.

Skill Workshop زمانی مفید است که agent رویه‌ای مانند موارد زیر را یاد می‌گیرد:

- چگونه assetهای animated GIF با منبع خارجی را اعتبارسنجی کند
- چگونه assetهای screenshot را جایگزین کند و ابعاد را verify کند
- چگونه یک سناریوی QA مخصوص repo را اجرا کند
- چگونه یک failure تکرارشونده provider را debug کند
- چگونه یک یادداشت workflow محلی stale را repair کند

برای موارد زیر در نظر گرفته نشده است:

- واقعیت‌هایی مانند «کاربر رنگ آبی را دوست دارد»
- حافظه زندگینامه‌ای گسترده
- بایگانی خام transcript
- secrets، credentials، یا متن پنهان prompt
- دستورالعمل‌های یک‌باره که تکرار نخواهند شد

## وضعیت پیش‌فرض

Plugin همراه **آزمایشی** است و به‌طور پیش‌فرض **غیرفعال** است، مگر اینکه
به‌صراحت در `plugins.entries.skill-workshop` فعال شود.

manifest مربوط به plugin، مقدار `enabledByDefault: true` را تنظیم نمی‌کند. مقدار
پیش‌فرض `enabled: true` در schema پیکربندی plugin فقط پس از آن اعمال می‌شود که
entry مربوط به plugin از قبل انتخاب و load شده باشد.

آزمایشی یعنی:

- plugin برای تست opt-in و dogfooding به‌اندازه کافی پشتیبانی می‌شود
- storage مربوط به proposal، thresholdهای reviewer، و capture heuristicها می‌توانند تکامل پیدا کنند
- approval در حالت pending، حالت شروع پیشنهادی است
- auto apply برای setupهای شخصی/فضای کاری قابل اعتماد است، نه محیط‌های shared یا hostile
  که ورودی زیاد دارند

## فعال‌سازی

پیکربندی امن حداقلی:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

با این config:

- ابزار `skill_workshop` در دسترس است
- اصلاحات قابل استفاده مجدد صریح به‌عنوان proposalهای pending در صف قرار می‌گیرند
- passهای reviewer مبتنی بر threshold می‌توانند updateهای skill را پیشنهاد کنند
- هیچ فایل skillی تا زمانی که یک proposal pending اعمال نشود نوشته نمی‌شود

از نوشتن خودکار فقط در فضاهای کاری قابل اعتماد استفاده کنید:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` همچنان از همان scanner و مسیر quarantine استفاده می‌کند. این
proposalهایی را که findingهای critical دارند اعمال نمی‌کند.

## پیکربندی

| کلید                 | پیش‌فرض     | بازه / مقادیر                               | معنی                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | پس از load شدن entry مربوط به plugin، plugin را فعال می‌کند.        |
| `autoCapture`        | `true`      | boolean                                     | capture/review پس از turnهای موفق agent را فعال می‌کند.             |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | proposalها را در صف قرار می‌دهد یا proposalهای امن را خودکار می‌نویسد. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | capture اصلاح صریح، reviewer مبتنی بر LLM، هر دو، یا هیچ‌کدام را انتخاب می‌کند. |
| `reviewInterval`     | `15`        | `1..200`                                    | پس از این تعداد turn موفق، reviewer را اجرا می‌کند.                 |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | پس از این تعداد tool call مشاهده‌شده، reviewer را اجرا می‌کند.      |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | timeout برای اجرای reviewer تعبیه‌شده.                              |
| `maxPending`         | `50`        | `1..200`                                    | حداکثر proposalهای pending/quarantined نگهداری‌شده برای هر workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | حداکثر اندازه skill/support file تولیدشده.                          |

profileهای پیشنهادی:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## مسیرهای capture

Skill Workshop سه مسیر capture دارد.

### پیشنهادهای ابزار

model می‌تواند وقتی یک رویه قابل استفاده مجدد می‌بیند یا وقتی کاربر از آن می‌خواهد یک skill را save/update کند، مستقیما `skill_workshop` را call کند.

این صریح‌ترین مسیر است و حتی با `autoCapture: false` نیز کار می‌کند.

### capture اکتشافی

وقتی `autoCapture` فعال است و `reviewMode` برابر `heuristic` یا `hybrid` است،
plugin، turnهای موفق را برای عبارت‌های اصلاح صریح کاربر scan می‌کند:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

heuristic از آخرین دستورالعمل کاربر که match شده است یک proposal ایجاد می‌کند. از
topic hintها برای انتخاب نام skill برای workflowهای رایج استفاده می‌کند:

- taskهای animated GIF -> `animated-gif-workflow`
- taskهای screenshot یا asset -> `screenshot-asset-workflow`
- taskهای QA یا scenario -> `qa-scenario-workflow`
- taskهای GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

capture اکتشافی عمدا محدود است. برای اصلاحات روشن و یادداشت‌های process
تکرارپذیر است، نه برای خلاصه‌سازی عمومی transcript.

### reviewer مبتنی بر LLM

وقتی `autoCapture` فعال است و `reviewMode` برابر `llm` یا `hybrid` است، plugin
پس از رسیدن به thresholdها یک reviewer تعبیه‌شده فشرده اجرا می‌کند.

reviewer موارد زیر را دریافت می‌کند:

- متن transcript اخیر، محدود به ۱۲٬۰۰۰ کاراکتر آخر
- تا ۱۲ skill موجود در workspace
- تا ۲٬۰۰۰ کاراکتر از هر skill موجود
- دستورالعمل‌های فقط JSON

reviewer هیچ ابزاری ندارد:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

reviewer یا `{ "action": "none" }` را برمی‌گرداند یا یک proposal. فیلد `action` برابر `create`، `append`، یا `replace` است — وقتی یک skill مرتبط از قبل وجود دارد، `append`/`replace` را ترجیح دهید؛ فقط وقتی هیچ skill موجودی مناسب نیست از `create` استفاده کنید.

مثال `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append`، `section` + `body` را اضافه می‌کند. `replace`، `oldText` را در skill نام‌برده با `newText` جایگزین می‌کند.

## چرخه عمر proposal

هر update تولیدشده به یک proposal با موارد زیر تبدیل می‌شود:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- اختیاری `agentId`
- اختیاری `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`، `agent_end`، یا `reviewer`
- `status`
- `change`
- اختیاری `scanFindings`
- اختیاری `quarantineReason`

وضعیت‌های proposal:

- `pending` - در انتظار تأیید
- `applied` - نوشته‌شده در `<workspace>/skills`
- `rejected` - ردشده توسط اپراتور/مدل
- `quarantined` - مسدودشده به‌دلیل یافته‌های بحرانی اسکنر

وضعیت برای هر فضای کاری، زیر دایرکتوری وضعیت Gateway ذخیره می‌شود:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

پیشنهادهای در انتظار و قرنطینه‌شده بر اساس نام مهارت و بار تغییر
یکتا‌سازی می‌شوند. فروشگاه، جدیدترین پیشنهادهای در انتظار/قرنطینه‌شده را تا سقف
`maxPending` نگه می‌دارد.

## مرجع ابزار

Plugin یک ابزار عامل ثبت می‌کند:

```text
skill_workshop
```

### `status`

شمارش پیشنهادها بر اساس وضعیت برای فضای کاری فعال.

```json
{ "action": "status" }
```

شکل نتیجه:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

فهرست کردن پیشنهادهای در انتظار.

```json
{ "action": "list_pending" }
```

برای فهرست کردن وضعیت دیگر:

```json
{ "action": "list_pending", "status": "applied" }
```

مقادیر معتبر `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

فهرست کردن پیشنهادهای قرنطینه‌شده.

```json
{ "action": "list_quarantine" }
```

زمانی از این استفاده کنید که به نظر می‌رسد ثبت خودکار کاری انجام نمی‌دهد و لاگ‌ها به
`skill-workshop: quarantined <skill>` اشاره می‌کنند.

### `inspect`

دریافت یک پیشنهاد بر اساس شناسه.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

ایجاد یک پیشنهاد. با `approvalPolicy: "pending"` (پیش‌فرض)، این کار به‌جای نوشتن، آن را در صف قرار می‌دهد.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

اعمال یک پیشنهاد در انتظار.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` پیشنهادهای قرنطینه‌شده را رد می‌کند:

```text
quarantined proposal cannot be applied
```

### `reject`

علامت‌گذاری یک پیشنهاد به‌عنوان ردشده.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

نوشتن یک فایل پشتیبان داخل دایرکتوری یک مهارت موجود یا پیشنهادی.

دایرکتوری‌های پشتیبان سطح بالا که مجاز هستند:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

مثال:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

فایل‌های پشتیبانی به workspace محدودند، مسیرشان بررسی می‌شود، با
`maxSkillBytes` از نظر بایت محدود می‌شوند، اسکن می‌شوند و به‌صورت اتمیک نوشته می‌شوند.

## نوشتن مهارت

کارگاه مهارت فقط در مسیر زیر می‌نویسد:

```text
<workspace>/skills/<normalized-skill-name>/
```

نام مهارت‌ها عادی‌سازی می‌شوند:

- به حروف کوچک تبدیل می‌شوند
- دنباله‌های غیر `[a-z0-9_-]` به `-` تبدیل می‌شوند
- غیرحروف‌عددی‌های ابتدایی/انتهایی حذف می‌شوند
- حداکثر طول 80 نویسه است
- نام نهایی باید با `[a-z0-9][a-z0-9_-]{1,79}` مطابقت داشته باشد

برای `create`:

- اگر مهارت وجود نداشته باشد، کارگاه مهارت یک `SKILL.md` جدید می‌نویسد
- اگر از قبل وجود داشته باشد، کارگاه مهارت بدنه را به `## Workflow` اضافه می‌کند

برای `append`:

- اگر مهارت وجود داشته باشد، کارگاه مهارت به بخش درخواست‌شده اضافه می‌کند
- اگر وجود نداشته باشد، کارگاه مهارت یک مهارت حداقلی ایجاد می‌کند و سپس به آن اضافه می‌کند

برای `replace`:

- مهارت باید از قبل وجود داشته باشد
- `oldText` باید دقیقاً وجود داشته باشد
- فقط اولین مطابقت دقیق جایگزین می‌شود

همه نوشتن‌ها اتمیک هستند و snapshot درون‌حافظه‌ای Skills را فوراً تازه‌سازی می‌کنند، بنابراین
مهارت جدید یا به‌روزرسانی‌شده می‌تواند بدون راه‌اندازی دوباره Gateway قابل مشاهده شود.

## مدل ایمنی

کارگاه مهارت روی محتوای تولیدشده `SKILL.md` و فایل‌های پشتیبانی یک اسکنر ایمنی دارد.

یافته‌های بحرانی پیشنهادها را قرنطینه می‌کنند:

| شناسه قانون                            | محتوایی را مسدود می‌کند که...                                      |
| -------------------------------------- | ------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | به عامل می‌گوید دستورهای قبلی/بالاتر را نادیده بگیرد              |
| `prompt-injection-system`              | به promptهای سیستم، پیام‌های توسعه‌دهنده، یا دستورهای پنهان اشاره می‌کند |
| `prompt-injection-tool`                | دور زدن مجوز/تأیید ابزار را تشویق می‌کند                           |
| `shell-pipe-to-shell`                  | شامل `curl`/`wget` پایپ‌شده به `sh`، `bash`، یا `zsh` است           |
| `secret-exfiltration`                  | ظاهراً داده‌های env/process env را از راه شبکه ارسال می‌کند        |

یافته‌های هشدار نگه داشته می‌شوند اما به‌تنهایی مسدود نمی‌کنند:

| شناسه قانون          | روی... هشدار می‌دهد              |
| -------------------- | -------------------------------- |
| `destructive-delete` | دستورهای گسترده سبک `rm -rf`     |
| `unsafe-permissions` | استفاده از مجوز به سبک `chmod 777` |

پیشنهادهای قرنطینه‌شده:

- `scanFindings` را نگه می‌دارند
- `quarantineReason` را نگه می‌دارند
- در `list_quarantine` ظاهر می‌شوند
- نمی‌توانند از طریق `apply` اعمال شوند

برای بازیابی از یک پیشنهاد قرنطینه‌شده، یک پیشنهاد امن جدید بسازید که
محتوای ناامن از آن حذف شده باشد. store JSON را دستی ویرایش نکنید.

## راهنمایی prompt

وقتی فعال باشد، کارگاه مهارت یک بخش کوتاه prompt تزریق می‌کند که به عامل می‌گوید
از `skill_workshop` برای حافظه رویه‌ای پایدار استفاده کند.

این راهنمایی بر موارد زیر تأکید دارد:

- رویه‌ها، نه واقعیت‌ها/ترجیحات
- اصلاحات کاربر
- رویه‌های موفق غیرآشکار
- دام‌های تکرارشونده
- ترمیم مهارت‌های کهنه/کم‌محتوا/نادرست از طریق اضافه‌کردن/جایگزینی
- ذخیره رویه قابل استفاده مجدد پس از حلقه‌های طولانی ابزار یا اصلاحات دشوار
- متن کوتاه و امری برای مهارت
- بدون dump رونوشت

متن حالت نوشتن با `approvalPolicy` تغییر می‌کند:

- حالت pending: پیشنهادها را در صف بگذارید؛ فقط پس از تأیید صریح اعمال کنید
- حالت auto: به‌روزرسانی‌های امن workspace-skill را وقتی به‌وضوح قابل استفاده مجدد هستند اعمال کنید

## هزینه‌ها و رفتار زمان اجرا

capture اکتشافی مدلی را فراخوانی نمی‌کند.

بازبینی LLM از یک اجرای تعبیه‌شده روی مدل فعال/پیش‌فرض عامل استفاده می‌کند. این بازبینی
مبتنی بر آستانه است، بنابراین به‌صورت پیش‌فرض در هر نوبت اجرا نمی‌شود.

بازبین:

- وقتی در دسترس باشد از همان context پیکربندی‌شده provider/model استفاده می‌کند
- به پیش‌فرض‌های عامل زمان اجرا fallback می‌کند
- `reviewTimeoutMs` دارد
- از context راه‌اندازی سبک استفاده می‌کند
- ابزار ندارد
- مستقیماً چیزی نمی‌نویسد
- فقط می‌تواند پیشنهادی منتشر کند که از مسیر عادی اسکنر و
  تأیید/قرنطینه عبور می‌کند

اگر بازبین شکست بخورد، timeout شود، یا JSON نامعتبر برگرداند، Plugin یک
پیام هشدار/debug ثبت می‌کند و آن گذر بازبینی را رد می‌کند.

## الگوهای عملیاتی

وقتی کاربر می‌گوید از کارگاه مهارت استفاده کنید:

- «دفعه بعد، X را انجام بده»
- «از حالا به بعد، Y را ترجیح بده»
- «حتماً Z را verify کن»
- «این را به‌عنوان workflow ذخیره کن»
- «این کمی طول کشید؛ فرایند را به خاطر بسپار»
- «مهارت local را برای این به‌روزرسانی کن»

متن خوب مهارت:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

متن ضعیف مهارت:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

دلایلی که نسخه ضعیف نباید ذخیره شود:

- شبیه رونوشت است
- امری نیست
- شامل جزئیات پرسروصدای یک‌باره است
- به عامل بعدی نمی‌گوید چه‌کار کند

## اشکال‌زدایی

بررسی کنید که آیا Plugin بارگذاری شده است:

```bash
openclaw plugins list --enabled
```

شمار پیشنهادها را از context عامل/ابزار بررسی کنید:

```json
{ "action": "status" }
```

پیشنهادهای در انتظار را بررسی کنید:

```json
{ "action": "list_pending" }
```

پیشنهادهای قرنطینه‌شده را بررسی کنید:

```json
{ "action": "list_quarantine" }
```

نشانه‌های رایج:

| نشانه                                  | علت محتمل                                                                         | بررسی                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ابزار در دسترس نیست                    | ورودی Plugin فعال نیست                                                            | `plugins.entries.skill-workshop.enabled` و `openclaw plugins list`   |
| پیشنهاد خودکار ظاهر نمی‌شود            | `autoCapture: false`، `reviewMode: "off"`، یا آستانه‌ها برآورده نشده‌اند          | پیکربندی، وضعیت پیشنهاد، لاگ‌های Gateway                             |
| اکتشاف capture نکرد                    | عبارت‌بندی کاربر با الگوهای اصلاح مطابقت نداشت                                   | از `skill_workshop.suggest` صریح استفاده کنید یا بازبین LLM را فعال کنید |
| بازبین پیشنهادی ایجاد نکرد             | بازبین `none`، JSON نامعتبر، یا timeout برگرداند                                  | لاگ‌های Gateway، `reviewTimeoutMs`، آستانه‌ها                         |
| پیشنهاد اعمال نمی‌شود                  | `approvalPolicy: "pending"`                                                       | `list_pending`، سپس `apply`                                          |
| پیشنهاد از pending ناپدید شد           | پیشنهاد تکراری دوباره استفاده شد، pruning حداکثر pending، یا اعمال/رد/قرنطینه شد | `status`، `list_pending` با فیلترهای وضعیت، `list_quarantine`        |
| فایل مهارت وجود دارد اما مدل آن را از دست می‌دهد | snapshot مهارت تازه نشده یا gating مهارت آن را مستثنا می‌کند                     | وضعیت `openclaw skills` و واجد شرایط بودن مهارت workspace            |

لاگ‌های مرتبط:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## سناریوهای QA

سناریوهای QA مبتنی بر repo:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

coverage قطعی را اجرا کنید:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

coverage بازبین را اجرا کنید:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

سناریوی بازبین عمداً جداست، چون
`reviewMode: "llm"` را فعال می‌کند و گذر بازبین تعبیه‌شده را تمرین می‌دهد.

## چه زمانی auto apply را فعال نکنید

وقتی موارد زیر برقرار است از `approvalPolicy: "auto"` اجتناب کنید:

- workspace شامل رویه‌های حساس است
- عامل روی ورودی نامطمئن کار می‌کند
- مهارت‌ها در یک تیم گسترده به اشتراک گذاشته می‌شوند
- هنوز در حال تنظیم promptها یا قوانین اسکنر هستید
- مدل اغلب محتوای خصمانه وب/ایمیل را مدیریت می‌کند

ابتدا از حالت pending استفاده کنید. فقط پس از بازبینی نوع
مهارت‌هایی که عامل در آن workspace پیشنهاد می‌دهد، به حالت auto بروید.

## مستندات مرتبط

- [Skills](/fa/tools/skills)
- [Plugins](/fa/tools/plugin)
- [آزمایش](/fa/reference/test)
