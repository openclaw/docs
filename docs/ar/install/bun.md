---
read_when:
    - تريد تثبيت التبعيات أو تشغيل نصوص الحزمة باستخدام Bun
    - واجهت مشكلات في التثبيت/التصحيحات/برامج دورة الحياة النصية في Bun
summary: سير عمل Bun لعمليات التثبيت والبرامج النصية للحزم؛ يلزم Node في وقت التشغيل
title: Bun
x-i18n:
    generated_at: "2026-07-16T14:30:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
لا يمكن لـ Bun تشغيل CLI أو Gateway الخاصين بـ OpenClaw لأنه لا يوفّر واجهة API المطلوبة `node:sqlite`. ثبّت إصدارًا مدعومًا من Node لجميع أوامر وقت تشغيل OpenClaw.
</Warning>

يظل Bun قابلًا للاستخدام كمثبّت اختياري للتبعيات ومشغّل لبرامج الحِزم النصية. يظل مدير الحِزم الافتراضي هو `pnpm`، وهو مدعوم بالكامل وتستخدمه أدوات التوثيق. لا يمكن لـ Bun استخدام `pnpm-lock.yaml` ويتجاهله.

## التثبيت

<Steps>
  <Step title="تثبيت التبعيات">
    ```sh
    bun install
    ```

    يُتجاهل `bun.lock` / `bun.lockb` بواسطة Git، لذا لا تحدث تغييرات غير ضرورية في المستودع. لتخطّي عمليات الكتابة إلى ملف القفل بالكامل:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="البناء والاختبار">
    ```sh
    bun run build
    bun run vitest run
    ```

    يجب أن تظل الأوامر التي تشغّل OpenClaw نفسه تعمل عبر Node.

  </Step>
</Steps>

## برامج دورة الحياة النصية

يحظر Bun برامج دورة حياة التبعيات النصية ما لم تكن موثوقة صراحةً. في هذا المستودع، لا تكون البرامج النصية المحظورة عادةً مطلوبة:

- `baileys` `preinstall`: يتحقق من أن الإصدار الرئيسي لـ Node هو >= 20 (يتطلب OpenClaw إصدار Node 22.22.3+ أو 24.15+ أو 25.9+، ويُنصح باستخدام Node 24)
- `protobufjs` `postinstall`: يصدر تحذيرات بشأن مخططات الإصدارات غير المتوافقة (من دون مخرجات بناء)

إذا واجهت مشكلة في وقت التشغيل تتطلب هذه البرامج النصية، فامنحها الثقة صراحةً:

```sh
bun pm trust baileys protobufjs
```

## محاذير

تضمّن بعض برامج الحِزم النصية `pnpm` بشكل ثابت داخليًا (مثل `check:docs` و`ui:*` و`protocol:check`). يؤدي تشغيلها عبر `bun run` مع ذلك إلى استدعاء `pnpm` من خلال الصدفة، لذا شغّلها مباشرةً عبر `pnpm`.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Node.js](/ar/install/node)
- [التحديث](/ar/install/updating)
