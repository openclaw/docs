---
read_when:
    - باید فضای کاری عامل یا ساختار فایل‌های آن را توضیح دهید
    - می‌خواهید از فضای کاری عامل نسخهٔ پشتیبان بگیرید یا آن را مهاجرت دهید
sidebarTitle: Agent workspace
summary: 'فضای کاری عامل: مکان، چیدمان و راهبرد پشتیبان‌گیری'
title: فضای کاری عامل
x-i18n:
    generated_at: "2026-05-10T19:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

فضای کاری، خانهٔ عامل است. این تنها شاخهٔ کاری‌ای است که برای ابزارهای فایل و زمینهٔ فضای کاری استفاده می‌شود. آن را خصوصی نگه دارید و مانند حافظه با آن رفتار کنید.

این مورد جدا از `~/.openclaw/` است که پیکربندی، اعتبارنامه‌ها و نشست‌ها را ذخیره می‌کند.

<Warning>
فضای کاری **cwd پیش‌فرض** است، نه یک sandbox سخت‌گیرانه. ابزارها مسیرهای نسبی را نسبت به فضای کاری resolve می‌کنند، اما مسیرهای مطلق همچنان می‌توانند به جاهای دیگر روی میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از [`agents.defaults.sandbox`](/fa/gateway/sandboxing) (و/یا پیکربندی sandbox مخصوص هر عامل) استفاده کنید.

وقتی sandboxing فعال است و `workspaceAccess` برابر `"rw"` نیست، ابزارها داخل یک فضای کاری sandbox زیر `~/.openclaw/sandboxes` کار می‌کنند، نه فضای کاری میزبان شما.
</Warning>

## مکان پیش‌فرض

- پیش‌فرض: `~/.openclaw/workspace`
- اگر `OPENCLAW_PROFILE` تنظیم شده باشد و `"default"` نباشد، مقدار پیش‌فرض به `~/.openclaw/workspace-<profile>` تبدیل می‌شود.
- بازنویسی در `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`، `openclaw configure`، یا `openclaw setup` فضای کاری را می‌سازد و اگر فایل‌های راه‌انداز وجود نداشته باشند، آن‌ها را seed می‌کند.

<Note>
کپی‌های seed مربوط به sandbox فقط فایل‌های معمولی داخل فضای کاری را می‌پذیرند؛ aliasهای symlink/hardlink که به بیرون از فضای کاری منبع resolve می‌شوند نادیده گرفته می‌شوند.
</Note>

اگر خودتان فایل‌های فضای کاری را مدیریت می‌کنید، می‌توانید ساخت فایل‌های راه‌انداز را غیرفعال کنید:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## پوشه‌های اضافی فضای کاری

نصب‌های قدیمی‌تر ممکن است `~/openclaw` را ساخته باشند. نگه داشتن چند شاخهٔ فضای کاری می‌تواند باعث ابهام در auth یا drift در state شود، چون در هر زمان فقط یک فضای کاری فعال است.

<Note>
**توصیه:** یک فضای کاری فعال واحد نگه دارید. اگر دیگر از پوشه‌های اضافی استفاده نمی‌کنید، آن‌ها را آرشیو کنید یا به Trash منتقل کنید (برای مثال `trash ~/openclaw`). اگر عمداً چند فضای کاری را نگه می‌دارید، مطمئن شوید `agents.defaults.workspace` به فضای کاری فعال اشاره می‌کند.

`openclaw doctor` وقتی شاخه‌های اضافی فضای کاری را تشخیص دهد هشدار می‌دهد.
</Note>

## نقشهٔ فایل‌های فضای کاری

این‌ها فایل‌های استانداردی هستند که OpenClaw انتظار دارد داخل فضای کاری وجود داشته باشند:

<AccordionGroup>
  <Accordion title="AGENTS.md - دستورالعمل‌های عملیاتی">
    دستورالعمل‌های عملیاتی برای عامل و اینکه چگونه باید از حافظه استفاده کند. در شروع هر نشست بارگذاری می‌شود. جای مناسبی برای قوانین، اولویت‌ها و جزئیات «چگونه رفتار کردن» است.
  </Accordion>
  <Accordion title="SOUL.md - شخصیت و لحن">
    شخصیت، لحن و مرزها. در هر نشست بارگذاری می‌شود. راهنما: [راهنمای شخصیت SOUL.md](/fa/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - کاربر کیست">
    کاربر کیست و چگونه باید خطاب شود. در هر نشست بارگذاری می‌شود.
  </Accordion>
  <Accordion title="IDENTITY.md - نام، حال‌وهوا، ایموجی">
    نام، حال‌وهوا و ایموجی عامل. در طول آیین راه‌اندازی ساخته/به‌روزرسانی می‌شود.
  </Accordion>
  <Accordion title="TOOLS.md - قراردادهای ابزار محلی">
    یادداشت‌هایی دربارهٔ ابزارها و قراردادهای محلی شما. دسترس‌پذیری ابزارها را کنترل نمی‌کند؛ فقط راهنماست.
  </Accordion>
  <Accordion title="HEARTBEAT.md - چک‌لیست Heartbeat">
    چک‌لیست کوچک اختیاری برای اجراهای Heartbeat. آن را کوتاه نگه دارید تا از مصرف توکن جلوگیری شود.
  </Accordion>
  <Accordion title="BOOT.md - چک‌لیست شروع">
    چک‌لیست شروع اختیاری که هنگام restart شدن Gateway به‌صورت خودکار اجرا می‌شود (وقتی [hookهای داخلی](/fa/automation/hooks) فعال باشند). آن را کوتاه نگه دارید؛ برای ارسال‌های خروجی از ابزار message استفاده کنید.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - آیین اجرای نخست">
    آیین یک‌بارهٔ اجرای نخست. فقط برای یک فضای کاری کاملاً جدید ساخته می‌شود. پس از کامل شدن آیین، آن را حذف کنید.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - لاگ روزانهٔ حافظه">
    لاگ روزانهٔ حافظه (یک فایل برای هر روز). توصیه می‌شود در شروع نشست، امروز + دیروز را بخوانید.
  </Accordion>
  <Accordion title="MEMORY.md - حافظهٔ بلندمدت گزینش‌شده (اختیاری)">
    حافظهٔ بلندمدت گزینش‌شده: واقعیت‌های پایدار، ترجیحات، تصمیم‌ها و خلاصه‌های کوتاه. لاگ‌های دقیق را در `memory/YYYY-MM-DD.md` نگه دارید تا ابزارهای حافظه بتوانند هنگام نیاز آن‌ها را بازیابی کنند بدون اینکه به هر prompt تزریق شوند. `MEMORY.md` را فقط در نشست اصلی و خصوصی بارگذاری کنید (نه زمینه‌های اشتراکی/گروهی). برای گردش‌کار و flush خودکار حافظه، [حافظه](/fa/concepts/memory) را ببینید.
  </Accordion>
  <Accordion title="skills/ - Skills فضای کاری (اختیاری)">
    Skills مخصوص فضای کاری. مکان Skills با بالاترین اولویت برای آن فضای کاری. وقتی نام‌ها تداخل داشته باشند، Skills عامل پروژه، Skills عامل شخصی، Skills مدیریت‌شده، Skills باندل‌شده و `skills.load.extraDirs` را override می‌کند.
  </Accordion>
  <Accordion title="canvas/ - فایل‌های Canvas UI (اختیاری)">
    فایل‌های Canvas UI برای نمایش‌های node (برای مثال `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
اگر هر فایل راه‌اندازی‌ای گم شده باشد، OpenClaw یک نشانگر «فایل گم‌شده» را به نشست تزریق می‌کند و ادامه می‌دهد. فایل‌های راه‌انداز بزرگ هنگام تزریق truncate می‌شوند؛ محدودیت‌ها را با `agents.defaults.bootstrapMaxChars` (پیش‌فرض: 12000) و `agents.defaults.bootstrapTotalMaxChars` (پیش‌فرض: 60000) تنظیم کنید. `openclaw setup` می‌تواند پیش‌فرض‌های گم‌شده را بدون بازنویسی فایل‌های موجود دوباره بسازد.
</Note>

## چه چیزهایی در فضای کاری نیستند

این موارد زیر `~/.openclaw/` قرار دارند و نباید به repo فضای کاری commit شوند:

- `~/.openclaw/openclaw.json` (پیکربندی)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (پروفایل‌های auth مدل: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (حساب runtime، پیکربندی، Skills، plugins و state بومی thread برای هر عامل در Codex)
- `~/.openclaw/credentials/` (state کانال/provider به‌علاوهٔ داده‌های import قدیمی OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (رونوشت‌های نشست + metadata)
- `~/.openclaw/skills/` (Skills مدیریت‌شده)

اگر باید نشست‌ها یا پیکربندی را migrate کنید، آن‌ها را جداگانه کپی کنید و بیرون از version control نگه دارید.

## پشتیبان‌گیری Git (توصیه‌شده، خصوصی)

با فضای کاری مانند حافظهٔ خصوصی رفتار کنید. آن را در یک repo **خصوصی** git قرار دهید تا پشتیبان‌گیری شود و قابل بازیابی باشد.

این مراحل را روی دستگاهی اجرا کنید که Gateway روی آن اجرا می‌شود (همان‌جایی که فضای کاری قرار دارد).

<Steps>
  <Step title="مقداردهی اولیهٔ repo">
    اگر git نصب شده باشد، فضای کاری‌های کاملاً جدید به‌صورت خودکار مقداردهی اولیه می‌شوند. اگر این فضای کاری هنوز repo نیست، اجرا کنید:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="افزودن remote خصوصی">
    <Tabs>
      <Tab title="GitHub web UI">
        1. یک repository **خصوصی** جدید روی GitHub بسازید.
        2. آن را با README مقداردهی اولیه نکنید (از merge conflict جلوگیری می‌کند).
        3. URL مربوط به HTTPS remote را کپی کنید.
        4. remote را اضافه کنید و push کنید:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. یک repository **خصوصی** جدید روی GitLab بسازید.
        2. آن را با README مقداردهی اولیه نکنید (از merge conflict جلوگیری می‌کند).
        3. URL مربوط به HTTPS remote را کپی کنید.
        4. remote را اضافه کنید و push کنید:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="به‌روزرسانی‌های مداوم">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## secrets را commit نکنید

<Warning>
حتی در یک repo خصوصی، از ذخیره‌سازی secrets در فضای کاری خودداری کنید:

- API keys، OAuth tokens، passwords، یا اعتبارنامه‌های خصوصی.
- هر چیزی زیر `~/.openclaw/`.
- dumpهای خام از chatها یا پیوست‌های حساس.

اگر باید referenceهای حساس را ذخیره کنید، از placeholders استفاده کنید و secret واقعی را جای دیگری نگه دارید (password manager، environment variables، یا `~/.openclaw/`).
</Warning>

شروع پیشنهادی برای `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## انتقال فضای کاری به دستگاه جدید

<Steps>
  <Step title="Clone کردن repo">
    repo را به مسیر موردنظر clone کنید (پیش‌فرض `~/.openclaw/workspace`).
  </Step>
  <Step title="به‌روزرسانی پیکربندی">
    `agents.defaults.workspace` را در `~/.openclaw/openclaw.json` روی آن مسیر تنظیم کنید.
  </Step>
  <Step title="Seed کردن فایل‌های گم‌شده">
    برای seed کردن هر فایل گم‌شده‌ای، `openclaw setup --workspace <path>` را اجرا کنید.
  </Step>
  <Step title="کپی نشست‌ها (اختیاری)">
    اگر به نشست‌ها نیاز دارید، `~/.openclaw/agents/<agentId>/sessions/` را جداگانه از دستگاه قدیمی کپی کنید.
  </Step>
</Steps>

## یادداشت‌های پیشرفته

- routing چندعاملی می‌تواند برای هر عامل از فضای کاری‌های متفاوت استفاده کند. برای پیکربندی routing، [Channel routing](/fa/channels/channel-routing) را ببینید.
- اگر `agents.defaults.sandbox` فعال باشد، نشست‌های غیر اصلی می‌توانند از فضای کاری‌های sandbox مخصوص هر نشست زیر `agents.defaults.sandbox.workspaceRoot` استفاده کنند.

## مرتبط

- [Heartbeat](/fa/gateway/heartbeat) - فایل فضای کاری HEARTBEAT.md
- [Sandboxing](/fa/gateway/sandboxing) - دسترسی به فضای کاری در محیط‌های sandboxشده
- [نشست](/fa/concepts/session) - مسیرهای ذخیره‌سازی نشست
- [دستورهای پایدار](/fa/automation/standing-orders) - دستورالعمل‌های پایدار در فایل‌های فضای کاری
