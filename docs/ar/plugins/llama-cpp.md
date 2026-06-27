---
read_when:
    - تريد تضمينات بحث الذاكرة من نموذج GGUF محلي
    - أنت تقوم بتكوين memorySearch.provider = "local"
    - تحتاج إلى Plugin الخاص بـ OpenClaw المسؤول عن بيئة تشغيل node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: ثبّت مزود llama.cpp الرسمي لتضمينات الذاكرة المحلية بصيغة GGUF
title: موفّر llama.cpp
x-i18n:
    generated_at: "2026-06-27T18:06:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` هو Plugin المزوّد الخارجي الرسمي لتضمينات GGUF المحلية.
وهو يملك اعتمادية وقت التشغيل `node-llama-cpp` المستخدمة بواسطة
`memorySearch.provider: "local"`.

ثبّته قبل استخدام تضمينات الذاكرة المحلية:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

لا تتضمن حزمة npm الرئيسية `openclaw` الحزمة `node-llama-cpp`. إن إبقاء
الاعتمادية الأصلية في هذا Plugin يمنع تحديثات npm العادية لـ OpenClaw من
حذف وقت تشغيل مثبّت يدويًا داخل دليل حزمة OpenClaw.

## التكوين

اضبط مزوّد بحث الذاكرة على `local`:

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

النموذج الافتراضي هو `embeddinggemma-300m-qat-Q8_0.gguf`. يمكنك أيضًا توجيه
`local.modelPath` إلى ملف `.gguf` محلي.

## وقت التشغيل الأصلي

استخدم Node 24 للحصول على أسلس مسار تثبيت أصلي. قد تحتاج نسخ المصدر التي تستخدم pnpm
إلى الموافقة على الاعتمادية الأصلية وإعادة بنائها:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

لتضمينات محلية أقل احتكاكًا، استخدم مزوّد خدمة محليًا مثل
Ollama أو LM Studio بدلًا من ذلك.
