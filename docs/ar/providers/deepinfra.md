---
read_when:
    - تريد مفتاح API واحدًا لأفضل نماذج اللغة الكبيرة مفتوحة المصدر
    - تريد تشغيل النماذج عبر واجهة API الخاصة بـ DeepInfra في OpenClaw
summary: استخدم واجهة API الموحّدة من DeepInfra للوصول إلى أشهر النماذج مفتوحة المصدر والنماذج المتقدمة في OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T06:26:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

توجّه DeepInfra الطلبات إلى نماذج مفتوحة المصدر ورائدة شائعة من خلال
نقطة نهاية واحدة متوافقة مع OpenAI ومفتاح API واحد. تعمل معظم حِزم SDK الخاصة بـ OpenAI
معها عبر تغيير عنوان URL الأساسي.

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## الحصول على مفتاح API

1. سجّل الدخول في [deepinfra.com](https://deepinfra.com/)
2. انتقل إلى Dashboard / Keys وأنشئ مفتاحًا، أو استخدم المفتاح المُنشأ تلقائيًا

## الإعداد عبر CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

أو عيّن متغير البيئة:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## مقتطف الإعداد

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

## الأسطح المدعومة

تُحدّث الدردشة وتوليد الصور وتوليد الفيديو كتالوجات نماذجها
مباشرةً من `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
بمجرد إعداد `DEEPINFRA_API_KEY`. تستخدم الأسطح الأخرى القيم الافتراضية الثابتة
أدناه إلى أن تنتقل إلى الكتالوج المباشر نفسه.

| السطح                    | النموذج الافتراضي                                                                                                      | إعداد/أداة OpenClaw                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| الدردشة / موفّر النماذج  | أول إدخال موسوم بعلامة الدردشة من الكتالوج المباشر (البديل الثابت `deepseek-ai/DeepSeek-V4-Flash`)                    | `agents.defaults.model`                                  |
| توليد/تحرير الصور        | أول إدخال موسوم بعلامة `image-gen` من الكتالوج المباشر (البديل الثابت `black-forest-labs/FLUX-1-schnell`)             | `image_generate`, `agents.defaults.imageGenerationModel` |
| فهم الوسائط              | `moonshotai/Kimi-K2.5` للصور                                                                                           | فهم الصور الواردة                                        |
| تحويل الكلام إلى نص      | `openai/whisper-large-v3-turbo`                                                                                        | نسخ الصوت الوارد                                         |
| تحويل النص إلى كلام      | `hexgrad/Kokoro-82M`                                                                                                   | `messages.tts.provider: "deepinfra"`                     |
| توليد الفيديو            | البديل الثابت `Pixverse/Pixverse-T2V` (لا توجد حاليًا صفوف مباشرة بعلامة `video-gen` من DeepInfra)                    | `video_generate`, `agents.defaults.videoGenerationModel` |
| تضمينات الذاكرة          | `BAAI/bge-m3`                                                                                                          | `agents.defaults.memorySearch.provider: "deepinfra"`     |

توفّر DeepInfra أيضًا إعادة الترتيب والتصنيف واكتشاف الكائنات وأنواعًا أخرى
أصلية من النماذج. لا يتوفر في OpenClaw حتى الآن عقد موفّر لهذه الفئات،
ولذلك لا يسجّل هذا Plugin هذه الأنواع.

## النماذج المتاحة

يكتشف OpenClaw نماذج DeepInfra ديناميكيًا بمجرد إعداد مفتاح. استخدم
`/models deepinfra` أو `openclaw models list --provider deepinfra` للاطلاع على
القائمة الحالية.

يعمل أي نموذج على [deepinfra.com](https://deepinfra.com/) باستخدام
البادئة `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...وغيرها الكثير
```

## ملاحظات

- مراجع النماذج هي `deepinfra/<provider>/<model>` (على سبيل المثال `deepinfra/Qwen/Qwen3-Max`).
- نموذج الدردشة الافتراضي: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- عنوان URL الأساسي: `https://api.deepinfra.com/v1/openai`
- يستخدم توليد الفيديو الأصلي `https://api.deepinfra.com/v1/inference/<model>`.

## ذو صلة

- [موفّرو النماذج](/ar/concepts/model-providers)
- [جميع الموفّرين](/ar/providers/index)
