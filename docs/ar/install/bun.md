---
read_when:
    - تريد أسرع حلقة تطوير محلية (bun + watch)
    - تواجه مشكلات في تثبيت Bun أو التصحيحات أو نصوص دورة الحياة
summary: 'سير عمل Bun (تجريبي): التثبيت والمحاذير مقارنةً بـ pnpm'
title: Bun (تجريبي)
x-i18n:
    generated_at: "2026-05-10T19:45:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **غير موصى به لوقت تشغيل Gateway** (مشكلات معروفة مع WhatsApp و Telegram). استخدم Node للإنتاج.
</Warning>

Bun هو وقت تشغيل محلي اختياري لتشغيل TypeScript مباشرةً (`bun run ...`، `bun --watch ...`). يظل مدير الحزم الافتراضي هو `pnpm`، وهو مدعوم بالكامل وتستخدمه أدوات التوثيق. لا يستطيع Bun استخدام `pnpm-lock.yaml` وسيتجاهله.

## التثبيت

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    يتم تجاهل `bun.lock` / `bun.lockb` في git، لذلك لا يحدث تغيير زائد في المستودع. لتجاوز كتابة ملف القفل بالكامل:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## نصوص دورة الحياة

يحظر Bun نصوص دورة حياة التبعيات ما لم تكن موثوقة صراحةً. في هذا المستودع، لا تكون النصوص المحظورة عادةً مطلوبة:

- `baileys` `preinstall` -- يتحقق من أن الإصدار الرئيسي من Node هو >= 20 (يعتمد OpenClaw افتراضيًا على Node 24 ولا يزال يدعم Node 22 LTS، حاليًا `22.16+`)
- `protobufjs` `postinstall` -- يصدر تحذيرات حول مخططات إصدارات غير متوافقة (لا توجد مصنوعات بناء)

إذا واجهت مشكلة وقت تشغيل تتطلب هذه النصوص، فاجعلها موثوقة صراحةً:

```sh
bun pm trust baileys protobufjs
```

## تنبيهات

لا تزال بعض النصوص ترمز pnpm بشكل ثابت (على سبيل المثال `docs:build` و`ui:*` و`protocol:check`). شغّلها عبر pnpm في الوقت الحالي.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Node.js](/ar/install/node)
- [التحديث](/ar/install/updating)
