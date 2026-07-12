---
read_when:
    - به ویرایش‌های ساختاریافتهٔ فایل در چندین فایل نیاز دارید
    - می‌خواهید ویرایش‌های مبتنی بر وصله را مستندسازی یا اشکال‌زدایی کنید
summary: وصله‌های چندفایلی را با ابزار apply_patch اعمال کنید
title: ابزار apply_patch
x-i18n:
    generated_at: "2026-07-12T10:49:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

تغییرات فایل را با استفاده از قالب وصلهٔ ساختاریافته اعمال کنید. این روش برای ویرایش‌های چندفایلی
یا چندبخشی که در آن‌ها یک فراخوانی `edit` شکننده خواهد بود، ایدئال است.

این ابزار یک رشتهٔ `input` واحد می‌پذیرد که یک یا چند عملیات فایل را در بر می‌گیرد:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## پارامترها

- `input` (الزامی): محتوای کامل وصله، شامل `*** Begin Patch` و `*** End Patch`.

## نکات

- مسیرهای وصله از مسیرهای نسبی (نسبت به پوشهٔ فضای کاری) و مسیرهای مطلق پشتیبانی می‌کنند.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر با `true` است (محدود به فضای کاری). آن را فقط زمانی روی `false` تنظیم کنید که عمداً می‌خواهید `apply_patch` خارج از پوشهٔ فضای کاری بنویسد یا حذف کند.
- برای تغییر نام فایل‌ها، از `*** Move to:` درون یک بخش `*** Update File:` استفاده کنید.
- در صورت نیاز، `*** End of File` درج منحصراً در انتهای فایل را مشخص می‌کند.
- این قابلیت به‌طور پیش‌فرض برای همهٔ مدل‌ها فعال است. برای غیرفعال‌کردن آن، `tools.exec.applyPatch.enabled: false` را تنظیم کنید؛ یا با استفاده از `tools.exec.applyPatch.allowModels` آن را به مدل‌های مشخصی محدود کنید (شناسه‌های خام مانند `gpt-5.4` یا شناسه‌های کامل مانند `openai/gpt-5.4` را می‌پذیرد).
- پیکربندی در `tools.exec.applyPatch.*` قرار دارد.

## مثال

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## مرتبط

<CardGroup cols={2}>
  <Card title="تفاوت‌ها" href="/fa/tools/diffs" icon="code-compare">
    نمایشگر تفاوتِ فقط‌خواندنی برای ارائهٔ تغییرات.
  </Card>
  <Card title="ابزار اجرا" href="/fa/tools/exec" icon="terminal">
    اجرای فرمان‌های پوسته از طریق عامل.
  </Card>
  <Card title="اجرای کد" href="/fa/tools/code-execution" icon="square-code">
    تحلیل راه‌دور Python در محیط ایزوله با xAI.
  </Card>
</CardGroup>
