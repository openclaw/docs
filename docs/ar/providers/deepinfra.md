---
read_when:
    - تريد مفتاح API واحدًا لأفضل نماذج LLM مفتوحة المصدر
    - تريد تشغيل النماذج عبر واجهة برمجة تطبيقات DeepInfra في OpenClaw
summary: استخدم واجهة API الموحّدة من DeepInfra للوصول إلى أشهر النماذج مفتوحة المصدر والنماذج الرائدة في OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:23:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

توفّر DeepInfra **واجهة API موحّدة** توجّه الطلبات إلى أشهر النماذج مفتوحة المصدر والنماذج الرائدة عبر
نقطة نهاية واحدة ومفتاح API واحد. وهي متوافقة مع OpenAI، لذلك تعمل معظم حِزم OpenAI SDK بمجرد تبديل عنوان URL الأساسي.

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## الحصول على مفتاح API

1. انتقل إلى [https://deepinfra.com/](https://deepinfra.com/)
2. سجّل الدخول أو أنشئ حسابًا
3. انتقل إلى لوحة التحكم / المفاتيح وأنشئ مفتاح API جديدًا أو استخدم المفتاح الذي أُنشئ تلقائيًا

## إعداد CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

أو عيّن متغير البيئة:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## مقتطف الإعدادات

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## واجهات OpenClaw المدعومة

يسجّل Plugin جميع واجهات DeepInfra التي تطابق عقود موفّري
OpenClaw الحالية. تعمل الدردشة وتوليد الصور وتوليد الفيديو على تحديث
فهارس النماذج مباشرةً من `/v1/openai/models?sort_by=openclaw&filter=with_meta`
عند إعداد `DEEPINFRA_API_KEY`؛ أما الواجهات الأخرى فتستخدم
الإعدادات الافتراضية الثابتة المنتقاة أدناه.

| الواجهة                  | النموذج الافتراضي                                                                                         | إعداد/أداة OpenClaw                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| الدردشة / موفّر النموذج    | أول إدخال موسوم للدردشة من الفهرس المباشر (البديل في البيان `deepseek-ai/DeepSeek-V4-Flash`)         | `agents.defaults.model`                                  |
| توليد/تحرير الصور | أول إدخال موسوم بـ `image-gen` من الفهرس المباشر (البديل الثابت `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| فهم الوسائط      | `moonshotai/Kimi-K2.5` للصور                                                                     | فهم الصور الواردة                              |
| تحويل الكلام إلى نص           | `openai/whisper-large-v3-turbo`                                                                       | نسخ الصوت الوارد                              |
| تحويل النص إلى كلام           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| توليد الفيديو         | أول إدخال موسوم بـ `video-gen` من الفهرس المباشر (البديل الثابت `Pixverse/Pixverse-T2V`)            | `video_generate`, `agents.defaults.videoGenerationModel` |
| تضمينات الذاكرة        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

تكشف DeepInfra أيضًا عن إعادة الترتيب، والتصنيف، واكتشاف الكائنات، وأنواع نماذج
أصلية أخرى. لا يملك OpenClaw حاليًا عقود موفّرين من الدرجة الأولى
لهذه الفئات، لذلك لا يسجّلها هذا Plugin بعد.

## النماذج المتاحة

يكتشف OpenClaw نماذج DeepInfra المتاحة ديناميكيًا عند بدء التشغيل. استخدم
`/models deepinfra` لرؤية القائمة الكاملة للنماذج المتاحة.

يمكن استخدام أي نموذج متاح على [DeepInfra.com](https://deepinfra.com/) مع بادئة `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...وغير ذلك الكثير
```

## ملاحظات

- مراجع النماذج هي `deepinfra/<provider>/<model>` (مثلًا، `deepinfra/Qwen/Qwen3-Max`).
- النموذج الافتراضي: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- عنوان URL الأساسي: `https://api.deepinfra.com/v1/openai`
- يستخدم توليد الفيديو الأصلي `https://api.deepinfra.com/v1/inference/<model>`.

## ذات صلة

- [موفّرو النماذج](/ar/concepts/model-providers)
- [جميع الموفّرين](/ar/providers/index)
