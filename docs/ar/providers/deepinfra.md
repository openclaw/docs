---
read_when:
    - تريد مفتاح واجهة برمجة تطبيقات واحدًا لأفضل نماذج اللغة الكبيرة مفتوحة المصدر
    - تريد تشغيل النماذج عبر واجهة برمجة تطبيقات DeepInfra في OpenClaw
summary: استخدم واجهة API الموحّدة من DeepInfra للوصول إلى أشهر النماذج مفتوحة المصدر والنماذج المتقدمة في OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T08:09:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

توفر DeepInfra **API موحّدة** توجّه الطلبات إلى أشهر النماذج مفتوحة المصدر والنماذج الرائدة عبر نقطة
نهاية واحدة ومفتاح API واحد. وهي متوافقة مع OpenAI، لذا تعمل معظم حزم OpenAI SDK بمجرد تغيير عنوان URL الأساسي.

## الحصول على مفتاح API

1. انتقل إلى [https://deepinfra.com/](https://deepinfra.com/)
2. سجّل الدخول أو أنشئ حسابًا
3. انتقل إلى Dashboard / Keys وأنشئ مفتاح API جديدًا أو استخدم المفتاح المُنشأ تلقائيًا

## إعداد CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

أو اضبط متغير البيئة:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## مقتطف الإعداد

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## أسطح OpenClaw المدعومة

يسجّل Plugin المضمّن جميع أسطح DeepInfra التي تطابق عقود مزوّد OpenClaw الحالية:

| السطح                    | النموذج الافتراضي                  | إعداد/أداة OpenClaw                                      |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| مزوّد المحادثة / النموذج | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| توليد/تحرير الصور        | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| فهم الوسائط              | `moonshotai/Kimi-K2.5` للصور       | فهم الصور الواردة                                        |
| تحويل الكلام إلى نص      | `openai/whisper-large-v3-turbo`    | نسخ الصوت الوارد                                         |
| تحويل النص إلى كلام      | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| توليد الفيديو            | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| تضمينات الذاكرة          | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

تعرض DeepInfra أيضًا إعادة الترتيب، والتصنيف، واكتشاف الأجسام، وأنواع نماذج أصلية أخرى. لا يملك OpenClaw حاليًا عقود مزوّد من الدرجة الأولى لهذه الفئات، لذلك لا يسجّلها هذا Plugin بعد.

## النماذج المتاحة

يكتشف OpenClaw نماذج DeepInfra المتاحة ديناميكيًا عند بدء التشغيل. استخدم
`/models deepinfra` للاطلاع على القائمة الكاملة للنماذج المتاحة.

يمكن استخدام أي نموذج متاح على [DeepInfra.com](https://deepinfra.com/) مع البادئة `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...وغير ذلك الكثير
```

## ملاحظات

- مراجع النماذج هي `deepinfra/<provider>/<model>` (مثل `deepinfra/Qwen/Qwen3-Max`).
- النموذج الافتراضي: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- عنوان URL الأساسي: `https://api.deepinfra.com/v1/openai`
- يستخدم توليد الفيديو الأصلي `https://api.deepinfra.com/v1/inference/<model>`.

## ذو صلة

- [مزوّدو النماذج](/ar/concepts/model-providers)
- [جميع المزوّدين](/ar/providers/index)
