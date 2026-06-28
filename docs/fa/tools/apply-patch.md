---
read_when:
    - به ویرایش‌های ساختاریافتهٔ فایل در چندین فایل نیاز دارید
    - می‌خواهید ویرایش‌های مبتنی بر وصله را مستندسازی یا عیب‌یابی کنید
summary: وصله‌های چندفایلی را با ابزار apply_patch اعمال کنید
title: ابزار apply_patch
x-i18n:
    generated_at: "2026-05-06T09:44:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

تغییرات فایل را با استفاده از قالب patch ساختاریافته اعمال کنید. این روش برای ویرایش‌های چندفایلی
یا چندبخشی مناسب است، جایی که یک فراخوانی `edit` شکننده خواهد بود.

این ابزار یک رشته‌ی `input` می‌پذیرد که یک یا چند عملیات فایل را در بر می‌گیرد:

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

- `input` (الزامی): محتوای کامل patch شامل `*** Begin Patch` و `*** End Patch`.

## نکته‌ها

- مسیرهای patch از مسیرهای نسبی (از دایرکتوری workspace) و مسیرهای مطلق پشتیبانی می‌کنند.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر `true` است (محدود به workspace). فقط زمانی آن را روی `false` تنظیم کنید که عمداً می‌خواهید `apply_patch` بیرون از دایرکتوری workspace بنویسد/حذف کند.
- برای تغییر نام فایل‌ها، از `*** Move to:` داخل یک بخش `*** Update File:` استفاده کنید.
- `*** End of File` در صورت نیاز درج فقط-EOF را مشخص می‌کند.
- به‌طور پیش‌فرض برای مدل‌های OpenAI و OpenAI Codex در دسترس است. برای غیرفعال‌کردن آن،
  `tools.exec.applyPatch.enabled: false` را تنظیم کنید.
- در صورت نیاز، از طریق
  `tools.exec.applyPatch.allowModels`
  بر اساس مدل محدودسازی کنید.
- پیکربندی فقط زیر `tools.exec` قرار دارد.

## مثال

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## مرتبط

<CardGroup cols={2}>
  <Card title="Diffs" href="/fa/tools/diffs" icon="code-compare">
    نمایشگر diff فقط‌خواندنی برای ارائه‌ی تغییرات.
  </Card>
  <Card title="Exec tool" href="/fa/tools/exec" icon="terminal">
    اجرای فرمان shell از سوی agent.
  </Card>
  <Card title="Code execution" href="/fa/tools/code-execution" icon="square-code">
    تحلیل Python راه‌دور sandbox‌شده با xAI.
  </Card>
</CardGroup>
