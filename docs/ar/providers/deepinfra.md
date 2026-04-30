---
read_when:
    - تريد مفتاح API واحدًا لأفضل نماذج اللغة الكبيرة مفتوحة المصدر
    - تريد تشغيل النماذج عبر واجهة برمجة تطبيقات DeepInfra في OpenClaw
summary: استخدم واجهة API الموحّدة من DeepInfra للوصول إلى أشهر النماذج مفتوحة المصدر والنماذج المتقدمة في OpenClaw
x-i18n:
    generated_at: "2026-04-30T08:20:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

توفّر DeepInfra **واجهة API موحّدة** توجّه الطلبات إلى أشهر النماذج مفتوحة المصدر والنماذج المتقدمة عبر نقطة نهاية واحدة
ومفتاح API واحد. وهي متوافقة مع OpenAI، لذلك تعمل معظم حِزم OpenAI SDK عبر تبديل عنوان URL الأساسي.

## الحصول على مفتاح API

1. انتقل إلى [https://deepinfra.com/](https://deepinfra.com/)
2. سجّل الدخول أو أنشئ حسابًا
3. انتقل إلى Dashboard / Keys وأنشئ مفتاح API جديدًا أو استخدم المفتاح الذي تم إنشاؤه تلقائيًا

## إعداد CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

أو عيّن متغير البيئة:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## مقتطف إعدادات

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

## واجهات OpenClaw المدعومة

يسجّل Plugin المضمّن جميع واجهات DeepInfra التي تطابق عقود الموفّر الحالية
في OpenClaw:

| الواجهة                  | النموذج الافتراضي                   | إعداد/أداة OpenClaw                                      |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| الدردشة / موفّر النموذج  | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| إنشاء/تحرير الصور       | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| فهم الوسائط              | `moonshotai/Kimi-K2.5` للصور       | فهم الصور الواردة                                        |
| تحويل الكلام إلى نص      | `openai/whisper-large-v3-turbo`    | نسخ الصوت الوارد                                         |
| تحويل النص إلى كلام      | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| إنشاء الفيديو            | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| تضمينات الذاكرة          | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

تكشف DeepInfra أيضًا عن إعادة الترتيب، والتصنيف، واكتشاف الكائنات، وأنواع نماذج
أصلية أخرى. لا يملك OpenClaw حاليًا عقود موفّر من الدرجة الأولى لهذه الفئات،
لذلك لا يسجّل هذا Plugin هذه الفئات بعد.

## النماذج المتاحة

يكتشف OpenClaw نماذج DeepInfra المتاحة ديناميكيًا عند بدء التشغيل. استخدم
`/models deepinfra` لرؤية القائمة الكاملة للنماذج المتاحة.

يمكن استخدام أي نموذج متاح على [DeepInfra.com](https://deepinfra.com/) مع البادئة `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## ملاحظات

- مراجع النماذج هي `deepinfra/<provider>/<model>` (مثل `deepinfra/Qwen/Qwen3-Max`).
- النموذج الافتراضي: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- عنوان URL الأساسي: `https://api.deepinfra.com/v1/openai`
- يستخدم إنشاء الفيديو الأصلي `https://api.deepinfra.com/v1/inference/<model>`.
