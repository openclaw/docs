---
read_when:
    - تريد أسرع حلقة تطوير محلية (bun + watch)
    - واجهتَ مشكلات في تثبيت Bun أو التصحيحات أو البرامج النصية لدورة الحياة
summary: 'سير عمل Bun (تجريبي): التثبيت والمحاذير مقارنةً بـ pnpm'
title: Bun (تجريبي)
x-i18n:
    generated_at: "2026-07-12T06:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
لا يُنصح باستخدام Bun لتشغيل Gateway (بسبب مشكلات معروفة في WhatsApp وTelegram). استخدم Node في بيئة الإنتاج.
</Warning>

يُعد Bun بيئة تشغيل محلية اختيارية لتشغيل TypeScript مباشرةً (`bun run ...`، و`bun --watch ...`). ويظل مدير الحزم الافتراضي هو `pnpm`، وهو مدعوم بالكامل وتستخدمه أدوات التوثيق. لا يستطيع Bun استخدام `pnpm-lock.yaml` ويتجاهله.

## التثبيت

<Steps>
  <Step title="تثبيت التبعيات">
    ```sh
    bun install
    ```

    يُتجاهل `bun.lock` و`bun.lockb` بواسطة Git، لذلك لا تحدث تغييرات غير ضرورية في المستودع. ولتخطي كتابة ملف القفل بالكامل:

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

يحظر Bun نصوص دورة حياة التبعيات ما لم تُمنح الثقة صراحةً. في هذا المستودع، لا تكون النصوص التي تُحظر عادةً مطلوبة:

- `baileys`‏ `preinstall`: يتحقق من أن الإصدار الرئيسي لـ Node هو 20 أو أحدث (يتطلب OpenClaw إصدار Node 22.19 أو أحدث، أو 23.11 أو أحدث، مع التوصية باستخدام Node 24)
- `protobufjs`‏ `postinstall`: يصدر تحذيرات بشأن مخططات إصدارات غير متوافقة (من دون نواتج بناء)

إذا واجهت مشكلة في وقت التشغيل تستلزم هذه النصوص، فامنحها الثقة صراحةً:

```sh
bun pm trust baileys protobufjs
```

## محاذير

تُضمِّن بعض نصوص الحزم `pnpm` داخليًا بشكل ثابت (مثل `check:docs` و`ui:*` و`protocol:check`). وسيؤدي تشغيلها عبر `bun run` مع ذلك إلى استدعاء `pnpm` من الصدفة، لذا شغّلها مباشرةً عبر `pnpm`.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Node.js](/ar/install/node)
- [التحديث](/ar/install/updating)
