---
read_when:
    - تريد إعادة استخدام وسائل نقل النماذج في OpenClaw ضمن تطبيق آخر
    - أنت تغيّر `packages/ai` أو منافذ مضيف نقل الذكاء الاصطناعي
    - أنت تراجع ما ينشره إصدار OpenClaw على npm إلى جانب الحزمة الجذرية
summary: 'حزمة npm ‏@openclaw/ai: وسائل نقل قابلة لإعادة الاستخدام للنماذج، وبيئات تشغيل معزولة، ومنافذ لسياسات المضيف'
title: حزمة @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T06:26:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` هو شكل مكتبة قابلة للنشر من طبقة تنفيذ النماذج في OpenClaw:
عقود محايدة لمزوّدي الرسائل والأدوات والتدفقات، والتحقق، والتشخيصات،
وتدفقات الأحداث، وسجل وقت تشغيل معزول، ومهايئات تُحمّل عند الطلب لعائلات
واجهات API الثماني المضمّنة (Anthropic Messages، وOpenAI Completions، وOpenAI
Responses، وAzure OpenAI Responses، وChatGPT/Codex Responses، وGoogle Generative
AI، وGoogle Vertex، وMistral Conversations).

تُنشر بالتزامن مع حزمة `openclaw` الجذرية في كل إصدار، وتُثبّت على الإصدار
نفسه، مع ملف `npm-shrinkwrap.json` خاص بها، بحيث تُقفل شجرة تبعياتها المتعدية
وقت التثبيت. يؤدي تثبيت `openclaw` إلى تثبيت إصدار `@openclaw/ai` المطابق
تلقائيًا؛ ويمكن لمستخدمي المكتبة الاعتماد عليها مباشرةً من دون أي شيفرة من
تطبيق OpenClaw.

## البدء السريع

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

توجد نسخة قابلة للتشغيل في المستودع ضمن `examples/ai-chat`.

## عقد التصميم

- **محدّد النطاق بالمثيل افتراضيًا.** لا يؤدي استيراد الحزمة إلى تسجيل أي شيء
  عموميًا. تُرجع `createApiRegistry()` و`createLlmRuntime()` مثيلات
  معزولة؛ ويضيف `registerBuiltInApiProviders(registry)` وسائل النقل المضمّنة
  إلى سجل واحد اختياريًا. تُحمّل وحدات SDK الخاصة بالمزوّدين عند أول استخدام.
- **تُحقن سياسة المضيف ولا تُضمّن.** تُعد حماية جلب الطلبات (مثل سياسة
  SSRF)، وتنقيح الأسرار من نص إعادة تشغيل نتائج الأدوات، والإعدادات الافتراضية
  الصارمة لأدوات OpenAI، وتسجيل التشخيصات، منافذ `AiTransportHost`
  تُضبط باستخدام `configureAiTransportHost`. الإعدادات الافتراضية للمكتبة
  خاملة؛ ويثبّت OpenClaw تطبيقاته الفعلية في واجهة التدفق الخاصة به.
- **هوية واحدة لتدفق الأحداث.** يمثّل `@openclaw/ai/event-stream` مُنشئ
  `EventStream` القياسي المشترك بين نواة OpenClaw، ونواة الوكيل، والمستخدمين
  الخارجيين.
- **المسارات الفرعية `internal/*` ليست واجهة API.** وهي موجودة لتطبيق
  OpenClaw نفسه ولا تحمل أي ضمان للتوافق الدلالي بين الإصدارات.
- تظل معرّفات المزوّدين، وبيانات الاعتماد، وكتالوجات النماذج، وإعادات المحاولة،
  وتجاوز الأعطال من مسؤوليات التطبيق. يضيف OpenClaw هذه الطبقات حول هذه الحزمة؛
  بينما يوفّر مستخدم المكتبة كائن `Model` والخيارات مباشرةً.

## تصديرات المسارات الفرعية

| المسار الفرعي    | المحتويات                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | العقود، و`createApiRegistry`، و`createLlmRuntime`، و`configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`، و`resetApiProviders`                             |
| `./types`        | أنواع النماذج والرسائل والأدوات والتدفقات                                      |
| `./validation`   | التحقق من وسائط الأدوات                                                        |
| `./diagnostics`  | عقود التشخيصات                                                                 |
| `./event-stream` | التنفيذ المشترك لـ`EventStream`                                                |
| `./internal/*`   | داخلي في OpenClaw، من دون ضمان للتوافق الدلالي بين الإصدارات                  |
