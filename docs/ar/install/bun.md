---
read_when:
    - تريد أسرع دورة تطوير محلية (bun + watch)
    - واجهت مشكلات في تثبيت Bun أو التصحيحات أو نصوص دورة الحياة
summary: 'سير عمل Bun (تجريبي): عمليات التثبيت والمحاذير مقارنةً بـ pnpm'
title: Bun (تجريبي)
x-i18n:
    generated_at: "2026-04-30T08:05:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **غير موصى به لتشغيل Gateway** (مشكلات معروفة مع WhatsApp وTelegram). استخدم Node للإنتاج.
</Warning>

Bun هو بيئة تشغيل محلية اختيارية لتشغيل TypeScript مباشرة (`bun run ...`، `bun --watch ...`). يبقى مدير الحزم الافتراضي هو `pnpm`، وهو مدعوم بالكامل وتستخدمه أدوات التوثيق. لا يمكن لـ Bun استخدام `pnpm-lock.yaml` وسيتجاهله.

## التثبيت

<Steps>
  <Step title="تثبيت التبعيات">
    ```sh
    bun install
    ```

    يتم تجاهل `bun.lock` / `bun.lockb` في git، لذلك لا يحدث اضطراب في المستودع. لتجاوز كتابة ملف القفل بالكامل:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="البناء والاختبار">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## نصوص دورة الحياة

يحظر Bun نصوص دورة حياة التبعيات ما لم تكن موثوقة صراحة. في هذا المستودع، لا تكون النصوص المحظورة عادة مطلوبة:

- `@whiskeysockets/baileys` `preinstall` -- يتحقق من أن الإصدار الرئيسي لـ Node هو >= 20 (يعتمد OpenClaw افتراضيا على Node 24 وما يزال يدعم Node 22 LTS، حاليا `22.14+`)
- `protobufjs` `postinstall` -- يصدر تحذيرات حول مخططات إصدارات غير متوافقة (لا توجد مخرجات بناء)

إذا واجهت مشكلة وقت تشغيل تتطلب هذه النصوص، فثق بها صراحة:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## تنبيهات

ما تزال بعض النصوص تضع pnpm بشكل ثابت (على سبيل المثال `docs:build` و`ui:*` و`protocol:check`). شغلها عبر pnpm في الوقت الحالي.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Node.js](/ar/install/node)
- [التحديث](/ar/install/updating)
