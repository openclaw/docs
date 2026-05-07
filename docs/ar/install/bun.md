---
read_when:
    - تريد أسرع دورة تطوير محلية (bun + watch)
    - واجهت مشكلات في تثبيت Bun/تصحيحه/نصوص دورة الحياة الخاصة به
summary: 'سير عمل Bun (تجريبي): عمليات التثبيت والمحاذير مقارنةً بـ pnpm'
title: Bun (تجريبي)
x-i18n:
    generated_at: "2026-05-07T13:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
لا يُوصى باستخدام Bun **لوقت تشغيل Gateway** (بسبب مشكلات معروفة مع WhatsApp و Telegram). استخدم Node في الإنتاج.
</Warning>

Bun هو وقت تشغيل محلي اختياري لتشغيل TypeScript مباشرةً (`bun run ...`، `bun --watch ...`). يظل مدير الحزم الافتراضي هو `pnpm`، وهو مدعوم بالكامل وتستخدمه أدوات الوثائق. لا يستطيع Bun استخدام `pnpm-lock.yaml` وسيتجاهله.

## التثبيت

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    يتم تجاهل `bun.lock` / `bun.lockb` في git، لذلك لا يحدث أي تغيير زائد في المستودع. لتخطي كتابة ملف القفل بالكامل:

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

## سكربتات دورة الحياة

يحظر Bun سكربتات دورة حياة الاعتماديات ما لم تُوثق صراحةً. في هذا المستودع، السكربتات التي تُحظر عادةً غير مطلوبة:

- `@whiskeysockets/baileys` `preinstall` -- يتحقق من أن إصدار Node الرئيسي >= 20 (يستخدم OpenClaw افتراضيًا Node 24 ولا يزال يدعم Node 22 LTS، حاليًا `22.16+`)
- `protobufjs` `postinstall` -- يُصدر تحذيرات حول مخططات الإصدارات غير المتوافقة (لا توجد مخرجات بناء)

إذا واجهت مشكلة وقت تشغيل تتطلب هذه السكربتات، فوثّقها صراحةً:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## محاذير

لا تزال بعض السكربتات تضع pnpm بشكل ثابت (مثلًا `docs:build` و`ui:*` و`protocol:check`). شغّلها عبر pnpm في الوقت الحالي.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Node.js](/ar/install/node)
- [التحديث](/ar/install/updating)
