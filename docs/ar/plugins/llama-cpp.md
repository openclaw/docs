---
read_when:
    - تريد تضمينات بحث الذاكرة من نموذج GGUF محلي
    - أنت تُعِدّ `memorySearch.provider = "local"`
    - تحتاج إلى Plugin الخاص بـ OpenClaw الذي يدير بيئة تشغيل node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: ثبّت موفّر llama.cpp الرسمي لتضمينات الذاكرة المحلية بتنسيق GGUF
title: موفّر llama.cpp
x-i18n:
    generated_at: "2026-07-12T06:16:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` هو Plugin المزوّد الخارجي الرسمي لتضمينات GGUF المحلية.
وهو يسجّل معرّف مزوّد التضمينات `local` ويمتلك تبعية وقت التشغيل
`node-llama-cpp` التي يستخدمها `memorySearch.provider: "local"`.

ثبّته قبل استخدام تضمينات الذاكرة المحلية:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

لا تتضمن حزمة npm الرئيسية `openclaw` التبعية `node-llama-cpp`. يؤدي إبقاء
التبعية الأصلية في هذا الـ Plugin إلى منع تحديثات npm العادية لـ OpenClaw من
حذف وقت تشغيل مُثبّت يدويًا داخل دليل حزمة OpenClaw.

## الإعداد

اضبط `memorySearch.provider` على `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

القيمة الافتراضية لـ `local.modelPath` هي معرّف URI ذي البادئة `hf:` الموضح أعلاه (`embeddinggemma-300m-qat-Q8_0.gguf`).
وجّهه إلى معرّف URI مختلف ذي البادئة `hf:` أو إلى ملف `.gguf` محلي لاستخدام
نموذج آخر. يتجاوز `local.modelCacheDir` الموقع الذي تُخزّن فيه النماذج المنزّلة
مؤقتًا (القيمة الافتراضية: `~/.node-llama-cpp/models`)، ويقبل `local.contextSize`
عددًا صحيحًا أو `"auto"`.

عندما تكون قيمة `local.contextSize` رقمية، يمرّر المزوّد هذا المتطلب أيضًا
إلى التوزيع التلقائي لطبقات وحدة معالجة الرسومات في node-llama-cpp. يتيح ذلك
لـ node-llama-cpp ملاءمة النموذج وسياق التضمين معًا مع الإبقاء على فحوصات
سلامة الذاكرة. عند استخدام `"auto"`، يحتفظ node-llama-cpp بالتوزيع التلقائي
المعتاد.

## وقت التشغيل الأصلي

استخدم Node 24 للحصول على أكثر مسارات التثبيت الأصلي سلاسة. قد تحتاج نُسخ
الشيفرة المصدرية التي تستخدم pnpm إلى الموافقة على التبعية الأصلية وإعادة بنائها:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## تشخيصات وقت التشغيل

شغّل `openclaw memory status --deep` بعد تحميل المزوّد لفحص الواجهة الخلفية
والبنية المحددتين، وأسماء الأجهزة، وطبقات وحدة معالجة الرسومات المنقولة إليها،
وحجم السياق المطلوب، وآخر لقطة مرصودة لذاكرة الفيديو أو الذاكرة الموحّدة. تتضمن
قيم ذاكرة الفيديو طابعًا زمنيًا للرصد لأن قراءات الحالة السلبية لا تعيد تحميل
النموذج ولا تستطلع الجهاز.

يمكن أن تظهر الحقائق نفسها بآخر قيم معروفة في `openclaw doctor` عندما يكون
Gateway قيد التشغيل قد استخدم المزوّد المحلي بالفعل. لا يحمّل أمر الحالة أو
الفحص العادي نموذجًا لمجرد جمع التشخيصات.

## استكشاف الأخطاء وإصلاحها

إذا كانت `node-llama-cpp` مفقودة أو فشل تحميلها، يُبلغ OpenClaw عن الفشل
مع الإرشادات التالية:

1. ثبّت الـ Plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. استخدم Node 24 لعمليات التثبيت والتحديث الأصلية.
3. من نسخة شيفرة مصدرية تستخدم pnpm: نفّذ `pnpm approve-builds`، ثم `pnpm rebuild node-llama-cpp`.

للحصول على تضمينات محلية أقل تعقيدًا دون خطوة البناء الأصلي، اضبط
`memorySearch.provider` بدلًا من ذلك على مزوّد تضمينات بعيد مثل `lmstudio`
أو `ollama` أو `openai` أو `voyage`.
