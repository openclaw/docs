---
read_when:
    - تريد أسرع دورة تطوير محلية (bun + watch)
    - واجهتَ مشكلات في تثبيت Bun أو التصحيحات أو سكربتات دورة الحياة
summary: 'سير عمل Bun (تجريبي): التثبيت والملاحظات المهمة مقارنةً بـ pnpm'
title: Bun (تجريبي)
x-i18n:
    generated_at: "2026-06-27T17:50:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
لا يُنصح باستخدام Bun **لتشغيل Gateway** (بسبب مشكلات معروفة مع WhatsApp وTelegram). استخدم Node للإنتاج.
</Warning>

Bun هو بيئة تشغيل محلية اختيارية لتشغيل TypeScript مباشرةً (`bun run ...`، `bun --watch ...`). يظل مدير الحزم الافتراضي هو `pnpm`، وهو مدعوم بالكامل وتستخدمه أدوات التوثيق. لا يستطيع Bun استخدام `pnpm-lock.yaml` وسيتجاهله.

## التثبيت

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    يتم تجاهل `bun.lock` / `bun.lockb` في git، لذلك لا يحدث أي تغيير غير ضروري في المستودع. لتخطي كتابة ملف القفل بالكامل:

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

يحظر Bun سكربتات دورة حياة التبعيات ما لم يتم الوثوق بها صراحةً. في هذا المستودع، السكربتات المحظورة عادةً غير مطلوبة:

- `baileys` `preinstall` -- يتحقق من أن الإصدار الرئيسي من Node >= 20 (يعتمد OpenClaw افتراضيًا على Node 24 ولا يزال يدعم Node 22 LTS، حاليًا `22.19+`)
- `protobufjs` `postinstall` -- يُصدر تحذيرات حول مخططات الإصدارات غير المتوافقة (لا توجد مُخرجات بناء)

إذا واجهت مشكلة في وقت التشغيل تتطلب هذه السكربتات، فثق بها صراحةً:

```sh
bun pm trust baileys protobufjs
```

## محاذير

لا تزال بعض السكربتات تثبّت استخدام pnpm بشكل صريح (على سبيل المثال `check:docs`، و`ui:*`، و`protocol:check`). شغّل هذه عبر pnpm في الوقت الحالي.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Node.js](/ar/install/node)
- [التحديث](/ar/install/updating)
