---
read_when:
    - به ویرایش‌های ساختاریافتهٔ فایل در چندین فایل نیاز دارید
    - می‌خواهید ویرایش‌های مبتنی بر پچ را مستندسازی یا اشکال‌زدایی کنید
summary: وصله‌های چندفایلی را با ابزار apply_patch اعمال کنید
title: ابزار apply_patch
x-i18n:
    generated_at: "2026-04-29T23:38:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 16
---

تغییرات فایل را با استفاده از قالب وصلهٔ ساختاریافته اعمال کنید. این روش برای ویرایش‌های
چندفایلی یا چندقطعه‌ای ایدئال است، جایی که یک فراخوانی واحد `edit` شکننده خواهد بود.

این ابزار یک رشتهٔ `input` واحد می‌پذیرد که یک یا چند عملیات فایل را در بر می‌گیرد:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## پارامترها

- `input` (الزامی): محتوای کامل وصله شامل `*** Begin Patch` و `*** End Patch`.

## نکته‌ها

- مسیرهای وصله از مسیرهای نسبی (از دایرکتوری workspace) و مسیرهای مطلق پشتیبانی می‌کنند.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر `true` است (محدود به workspace). فقط زمانی آن را روی `false` بگذارید که عمداً می‌خواهید `apply_patch` بیرون از دایرکتوری workspace بنویسد/حذف کند.
- برای تغییر نام فایل‌ها، از `*** Move to:` درون یک قطعهٔ `*** Update File:` استفاده کنید.
- `*** End of File` در صورت نیاز درج فقط-EOF را مشخص می‌کند.
- به‌طور پیش‌فرض برای مدل‌های OpenAI و OpenAI Codex در دسترس است. برای غیرفعال کردن آن،
  `tools.exec.applyPatch.enabled: false` را تنظیم کنید.
- در صورت تمایل، بر اساس مدل از طریق
  `tools.exec.applyPatch.allowModels` محدود کنید.
- پیکربندی فقط زیر `tools.exec` قرار دارد.

## مثال

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## مرتبط

- [Diffs](/fa/tools/diffs)
- [Exec tool](/fa/tools/exec)
- [Code execution](/fa/tools/code-execution)
