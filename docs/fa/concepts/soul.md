---
read_when:
    - می‌خواهید عامل شما کمتر کلی به نظر برسد
    - شما در حال ویرایش SOUL.md هستید
    - شخصیتی قوی‌تر می‌خواهید، بدون اینکه ایمنی یا اختصار آسیب ببیند
summary: از SOUL.md استفاده کنید تا به عامل OpenClaw خود، به‌جای لحن کلیشه‌ایِ دستیار عمومی، صدایی واقعی بدهید
title: راهنمای شخصیت SOUL.md
x-i18n:
    generated_at: "2026-04-29T22:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` جایی است که صدای عامل شما در آن زندگی می‌کند.

OpenClaw آن را در نشست‌های عادی تزریق می‌کند، بنابراین وزن واقعی دارد. اگر عامل شما
بی‌روح، دودل، یا به‌شکلی عجیب سازمانی به نظر می‌رسد، معمولاً این همان فایلی است که باید درست شود.

## چه چیزهایی باید در SOUL.md باشد

چیزهایی را بگذارید که حس صحبت کردن با عامل را تغییر می‌دهند:

- لحن
- دیدگاه‌ها
- ایجاز
- شوخ‌طبعی
- مرزها
- سطح پیش‌فرض صراحت

آن را به این چیزها تبدیل **نکنید**:

- داستان زندگی
- changelog
- تخلیه‌ی سیاست‌های امنیتی
- دیواری عظیم از حس‌وحال‌ها بدون اثر رفتاری

کوتاه بهتر از طولانی است. تیز بهتر از مبهم است.

## چرا این کار جواب می‌دهد

این با راهنمای پرامپت OpenAI هم‌راستا است:

- راهنمای مهندسی پرامپت می‌گوید رفتارهای سطح بالا، لحن، هدف‌ها، و
  نمونه‌ها باید در لایه‌ی دستورهای با اولویت بالا باشند، نه مدفون در نوبت
  کاربر.
- همان راهنما توصیه می‌کند با پرامپت‌ها مثل چیزی برخورد کنید که تکرارش می‌کنید،
  پین می‌کنید، و ارزیابی می‌کنید، نه نثر جادویی که یک‌بار می‌نویسید و فراموش می‌کنید.

برای OpenClaw، `SOUL.md` همان لایه است.

اگر شخصیت بهتر می‌خواهید، دستورهای قوی‌تری بنویسید. اگر شخصیت پایدار
می‌خواهید، آن‌ها را موجز و نسخه‌گذاری‌شده نگه دارید.

ارجاعات OpenAI:

- [مهندسی پرامپت](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [نقش‌های پیام و پیروی از دستور](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## پرامپت Molty

این را در عامل خود جای‌گذاری کنید و بگذارید `SOUL.md` را بازنویسی کند.

مسیر برای فضاهای کاری OpenClaw ثابت است: از `SOUL.md` استفاده کنید، نه `http://SOUL.md`.

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

## شکل خوبش چطور است

قواعد خوب `SOUL.md` این‌طور به نظر می‌رسند:

- موضع داشته باش
- حشو را کنار بگذار
- وقتی می‌نشیند بامزه باش
- ایده‌های بد را زود گوشزد کن
- موجز بمان مگر اینکه عمق واقعاً مفید باشد

قواعد بد `SOUL.md` این‌طور به نظر می‌رسند:

- همیشه حرفه‌ای‌بودن را حفظ کن
- کمک جامع و متفکرانه ارائه بده
- تجربه‌ای مثبت و حمایت‌گرانه تضمین کن

فهرست دوم همان چیزی است که خروجی را شل و بی‌خاصیت می‌کند.

## یک هشدار

شخصیت داشتن مجوز شلخته‌کاری نیست.

`AGENTS.md` را برای قواعد عملیاتی نگه دارید. `SOUL.md` را برای صدا، موضع، و
سبک نگه دارید. اگر عامل شما در کانال‌های مشترک، پاسخ‌های عمومی، یا سطوح
مشتری‌محور کار می‌کند، مطمئن شوید لحن هنوز با فضا جور است.

تیز بودن خوب است. آزاردهنده بودن نه.

## مستندات مرتبط

- [فضای کاری عامل](/fa/concepts/agent-workspace)
- [پرامپت سیستم](/fa/concepts/system-prompt)
- [قالب SOUL.md](/fa/reference/templates/SOUL)
