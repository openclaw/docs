---
read_when:
    - تريد أسرع حلقة تطوير محلية (bun + watch)
    - واجهت مشكلات في التثبيت/التصحيحات/سكربتات دورة الحياة في Bun
summary: 'سير عمل Bun (تجريبي): التثبيت والمحاذير مقارنةً بـ pnpm'
title: Bun (تجريبي)
x-i18n:
    generated_at: "2026-04-24T07:46:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
لا يُوصى باستخدام Bun **في Runtime الخاص بـ Gateway** (توجد مشكلات معروفة مع WhatsApp وTelegram). استخدم Node في بيئات الإنتاج.
</Warning>

Bun هو Runtime محلي اختياري لتشغيل TypeScript مباشرةً (`bun run ...` و`bun --watch ...`). ويظل مدير الحزم الافتراضي هو `pnpm`، وهو مدعوم بالكامل ويُستخدم بواسطة أدوات الوثائق. لا يستطيع Bun استخدام `pnpm-lock.yaml` وسيتجاهله.

## التثبيت

<Steps>
  <Step title="تثبيت التبعيات">
    ```sh
    bun install
    ```

    يتم تجاهل `bun.lock` / `bun.lockb` بواسطة git، لذلك لا يحدث ضجيج في المستودع. ولتخطي كتابة lockfile بالكامل:

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

## سكربتات دورة الحياة

يحظر Bun سكربتات دورة حياة التبعيات ما لم تُوثق صراحةً. بالنسبة إلى هذا المستودع، فإن السكربتات الشائعة التي يتم حظرها ليست مطلوبة:

- `@whiskeysockets/baileys` ‏`preinstall` -- يتحقق من أن إصدار Node الرئيسي >= 20 (تستخدم OpenClaw افتراضيًا Node 24 وما تزال تدعم Node 22 LTS، حاليًا `22.14+`)
- `protobufjs` ‏`postinstall` -- يصدر تحذيرات حول مخططات إصدارات غير متوافقة (من دون نواتج build)

إذا واجهت مشكلة Runtime تتطلب هذه السكربتات، فقم بتوثيقها صراحةً:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## محاذير

لا تزال بعض السكربتات تكتب `pnpm` بشكل صريح (مثل `docs:build` و`ui:*` و`protocol:check`). شغّل هذه السكربتات عبر pnpm في الوقت الحالي.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Node.js](/ar/install/node)
- [التحديث](/ar/install/updating)
