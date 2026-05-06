---
read_when:
    - می‌خواهید عاملتان کمتر کلی به نظر برسد
    - شما در حال ویرایش SOUL.md هستید
    - می‌خواهید شخصیت پررنگ‌تری داشته باشید، بدون اینکه ایمنی یا اختصار به خطر بیفتد
summary: از SOUL.md استفاده کنید تا به عامل OpenClaw خود صدایی واقعی بدهید، نه محتوای عمومی و بی‌کیفیتِ یک دستیار
title: راهنمای شخصیت SOUL.md
x-i18n:
    generated_at: "2026-05-06T09:13:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` جایی است که صدای عامل شما در آن زندگی می‌کند.

OpenClaw آن را در نشست‌های معمول تزریق می‌کند، پس وزن واقعی دارد. اگر عامل شما
بی‌روح، محتاطانه، یا به‌شکلی عجیب سازمانی به نظر می‌رسد، معمولاً این همان فایلی است که باید اصلاح شود.

## چه چیزهایی در SOUL.md جای دارد

چیزهایی را بگذارید که حس صحبت با عامل را تغییر می‌دهند:

- لحن
- دیدگاه‌ها
- ایجاز
- طنز
- مرزها
- سطح پیش‌فرض صراحت

آن را به این‌ها تبدیل **نکنید**:

- داستان زندگی
- changelog
- تخلیهٔ policy امنیتی
- دیواری عظیم از حال‌وهوا بدون اثر رفتاری

کوتاه بهتر از بلند است. دقیق بهتر از مبهم است.

## چرا این کار جواب می‌دهد

این با راهنمایی prompt از OpenAI هم‌راستا است:

- راهنمای prompt engineering می‌گوید رفتار سطح‌بالا، لحن، هدف‌ها و
  نمونه‌ها باید در لایهٔ دستورهای با اولویت بالا باشند، نه اینکه در
  نوبت کاربر دفن شوند.
- همان راهنما توصیه می‌کند با promptها مثل چیزی برخورد کنید که آن را تکرار،
  تثبیت و ارزیابی می‌کنید، نه نثر جادویی که یک بار می‌نویسید و فراموش می‌کنید.

برای OpenClaw، `SOUL.md` همان لایه است.

اگر شخصیت بهتری می‌خواهید، دستورهای قوی‌تری بنویسید. اگر شخصیت پایدار
می‌خواهید، آن‌ها را موجز و نسخه‌بندی‌شده نگه دارید.

ارجاع‌های OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [نقش‌های پیام و پیروی از دستور](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## prompt مولتی

این را در عامل خود بچسبانید و بگذارید `SOUL.md` را بازنویسی کند.

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

## خوب بودن چه شکلی است

قواعد خوب `SOUL.md` این‌طور به نظر می‌رسند:

- موضع داشته باشید
- حشو را حذف کنید
- وقتی می‌نشیند، بامزه باشید
- ایده‌های بد را زود گوشزد کنید
- موجز بمانید، مگر اینکه عمق واقعاً مفید باشد

قواعد بد `SOUL.md` این‌طور به نظر می‌رسند:

- در همه حال حرفه‌ای‌گری را حفظ کنید
- کمک جامع و اندیشمندانه ارائه دهید
- تجربه‌ای مثبت و حمایتگرانه تضمین کنید

آن فهرست دوم همان چیزی است که خروجی را خمیرمانند می‌کند.

## یک هشدار

شخصیت مجوز شلختگی نیست.

`AGENTS.md` را برای قواعد عملیاتی نگه دارید. `SOUL.md` را برای صدا، موضع و
سبک نگه دارید. اگر عامل شما در کانال‌های مشترک، پاسخ‌های عمومی، یا سطح‌های
مشتری کار می‌کند، مطمئن شوید لحن هنوز مناسب فضاست.

تیز بودن خوب است. آزاردهنده بودن نه.

## مرتبط

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/fa/concepts/agent-workspace" icon="folder-open">
    فایل‌های workspace که OpenClaw به prompt سیستم تزریق می‌کند.
  </Card>
  <Card title="System prompt" href="/fa/concepts/system-prompt" icon="message-lines">
    اینکه `SOUL.md` چگونه در prompt سیستم هر نوبت ترکیب می‌شود.
  </Card>
  <Card title="SOUL.md template" href="/fa/reference/templates/SOUL" icon="file-lines">
    قالب آغازین برای فایل شخصیت.
  </Card>
</CardGroup>
