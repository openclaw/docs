---
read_when:
    - می‌خواهید عامل شما کمتر عمومی به نظر برسد
    - شما در حال ویرایش SOUL.md هستید
    - شما شخصیتی قوی‌تر می‌خواهید، بدون آنکه ایمنی یا اختصار را به هم بزنید
summary: از SOUL.md استفاده کنید تا به عامل OpenClaw خود به‌جای لجن دستیار عمومی، صدایی واقعی بدهید
title: راهنمای شخصیت SOUL.md
x-i18n:
    generated_at: "2026-06-27T17:38:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` جایی است که صدای agent شما در آن زندگی می‌کند.

OpenClaw آن را در sessionهای عادی تزریق می‌کند، پس واقعاً وزن دارد. اگر agent شما
بی‌مزه، مردد، یا به‌طرز عجیبی شرکتی به نظر می‌رسد، معمولاً همین فایل باید اصلاح شود.

## چه چیزهایی در SOUL.md جای می‌گیرند

چیزهایی را بگذارید که حس مکالمه با agent را تغییر می‌دهند:

- لحن
- نظرها
- ایجاز
- شوخ‌طبعی
- مرزها
- سطح پیش‌فرض صراحت

آن را به این‌ها تبدیل **نکنید**:

- داستان زندگی
- changelog
- انبوهی از سیاست‌های امنیتی
- دیواری عظیم از حس‌وحال بدون اثر رفتاری

کوتاه بهتر از بلند است. تیز بهتر از مبهم است.

## چرا این کار جواب می‌دهد

این با راهنمایی‌های prompt در OpenAI هم‌راستا است:

- راهنمای مهندسی prompt می‌گوید رفتار سطح‌بالا، لحن، هدف‌ها و
  مثال‌ها باید در لایه دستورالعمل با اولویت بالا باشند، نه اینکه در
  نوبت کاربر دفن شوند.
- همان راهنما توصیه می‌کند با promptها مثل چیزی برخورد کنید که روی آن تکرار انجام می‌دهید،
  آن را pin می‌کنید و ارزیابی می‌کنید، نه نثری جادویی که یک بار می‌نویسید و فراموش می‌کنید.

برای OpenClaw، `SOUL.md` همان لایه است.

اگر شخصیت بهتری می‌خواهید، دستورالعمل‌های قوی‌تری بنویسید. اگر شخصیت پایدار می‌خواهید،
آن‌ها را موجز و نسخه‌بندی‌شده نگه دارید.

ارجاع‌های OpenAI:

- [مهندسی prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [نقش‌های پیام و پیروی از دستورالعمل](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## prompt مولتی

این را در agent خود paste کنید و بگذارید `SOUL.md` را بازنویسی کند.

مسیر برای workspaceهای OpenClaw ثابت است: از `SOUL.md` استفاده کنید، نه `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## شکل خوبش چیست

قواعد خوب `SOUL.md` این‌طور به نظر می‌رسند:

- موضع داشته باش
- حشو را حذف کن
- وقتی جا دارد بامزه باش
- ایده‌های بد را زود گوشزد کن
- موجز بمان مگر اینکه عمق واقعاً مفید باشد

قواعد بد `SOUL.md` این‌طور به نظر می‌رسند:

- همیشه حرفه‌ای‌گری را حفظ کن
- کمک جامع و سنجیده ارائه بده
- تجربه‌ای مثبت و حمایتی تضمین کن

فهرست دوم همان چیزی است که خروجی شل و بی‌اثر می‌سازد.

## یک هشدار

شخصیت داشتن مجوز شلختگی نیست.

`AGENTS.md` را برای قواعد عملیاتی نگه دارید. `SOUL.md` را برای صدا، موضع و
سبک نگه دارید. اگر agent شما در channelهای مشترک، پاسخ‌های عمومی، یا سطح‌های
مشتری‌محور کار می‌کند، مطمئن شوید لحن هنوز با فضا سازگار است.

تیز بودن خوب است. آزاردهنده بودن نه.

## مرتبط

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/fa/concepts/agent-workspace" icon="folder-open">
    فایل‌های workspace که OpenClaw در context مدل تزریق می‌کند.
  </Card>
  <Card title="System prompt" href="/fa/concepts/system-prompt" icon="message-lines">
    اینکه `SOUL.md` چگونه در context runtime مربوط به OpenClaw و Codex ترکیب می‌شود.
  </Card>
  <Card title="SOUL.md template" href="/fa/reference/templates/SOUL" icon="file-lines">
    template شروع برای فایل شخصیت.
  </Card>
</CardGroup>
