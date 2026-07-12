---
read_when:
    - تريد إنشاء الوسائط باستخدام Vydra في OpenClaw
    - تحتاج إلى إرشادات لإعداد مفتاح Vydra API
summary: استخدام الصور والفيديو والصوت من Vydra في OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T06:25:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

تضيف Plugin ‏Vydra المضمّنة ما يلي:

- إنشاء الصور عبر `vydra/grok-imagine`
- إنشاء الفيديو عبر `vydra/veo3` (من النص إلى الفيديو) و`vydra/kling` (من الصورة إلى الفيديو)
- تركيب الكلام عبر مسار تحويل النص إلى كلام في Vydra والمدعوم من ElevenLabs

يستخدم OpenClaw مفتاح `VYDRA_API_KEY` نفسه للإمكانات الثلاث جميعها.

| الخاصية                | القيمة                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| معرّف المزوّد          | `vydra`                                                                   |
| Plugin                 | مضمّنة، `enabledByDefault: true`                                          |
| متغير بيئة المصادقة    | `VYDRA_API_KEY`                                                           |
| علامة الإعداد الأولي   | `--auth-choice vydra-api-key`                                             |
| علامة CLI المباشرة     | `--vydra-api-key <key>`                                                   |
| العقود                 | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| عنوان URL الأساسي      | `https://www.vydra.ai/api/v1` (استخدم مضيف `www`)                         |

<Warning>
استخدم `https://www.vydra.ai/api/v1` بوصفه عنوان URL الأساسي. يعيد المضيف الجذري لـ Vydra ‏(`https://vydra.ai/api/v1`) حاليًا التوجيه إلى `www`. تحذف بعض عملاء HTTP ترويسة `Authorization` عند إعادة التوجيه بين مضيفين مختلفين، ما يحوّل مفتاح API صالحًا إلى فشل مصادقة مضلل. تطبّع Plugin المضمّنة أي عنوان URL أساسي مضبوط على `vydra.ai` إلى `www.vydra.ai` لتجنب ذلك.
</Warning>

## الإعداد

<Steps>
  <Step title="تشغيل الإعداد الأولي التفاعلي">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    أو عيّن متغير البيئة مباشرةً:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="اختيار إمكانية افتراضية">
    اختر إمكانية واحدة أو أكثر من الإمكانات أدناه (الصور أو الفيديو أو الكلام)، وطبّق الإعداد المطابق.
  </Step>
</Steps>

## الإمكانات

<AccordionGroup>
  <Accordion title="إنشاء الصور">
    نموذج الصور الافتراضي والمضمّن الوحيد:

    - `vydra/grok-imagine`

    عيّنه بوصفه مزوّد الصور الافتراضي:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    يقتصر الدعم المضمّن على إنشاء الصور من النص، وبحد أقصى صورة واحدة لكل طلب. تتوقع مسارات التحرير المستضافة في Vydra عناوين URL لصور بعيدة، ولا تضيف Plugin المضمّنة جسر رفع خاصًا بـ Vydra.

    <Note>
    راجع [إنشاء الصور](/ar/tools/image-generation) للاطلاع على معاملات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="إنشاء الفيديو">
    نماذج الفيديو المسجّلة:

    - `vydra/veo3` لإنشاء الفيديو من النص (يرفض مدخلات مراجع الصور)
    - `vydra/kling` لإنشاء الفيديو من الصورة (يتطلب عنوان URL واحدًا بالضبط لصورة بعيدة)

    عيّن Vydra بوصفه مزوّد الفيديو الافتراضي:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    ملاحظات:

    - يرفض `vydra/kling` رفع الملفات المحلية مسبقًا؛ ولا يعمل سوى مرجع عنوان URL لصورة بعيدة.
    - كان مسار HTTP الخاص بـ `kling` في Vydra غير متسق بشأن ما إذا كان يتطلب `image_url` أم `video_url`؛ ويرسل المزوّد المضمّن عنوان URL نفسه للصورة البعيدة في كلا الحقلين.
    - تلتزم Plugin المضمّنة نهجًا متحفظًا ولا تمرر خيارات نمط غير موثّقة، مثل نسبة العرض إلى الارتفاع أو الدقة أو العلامة المائية أو الصوت المُنشأ.

    <Note>
    راجع [إنشاء الفيديو](/ar/tools/video-generation) للاطلاع على معاملات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="اختبارات الفيديو المباشرة">
    تغطية الاختبارات المباشرة الخاصة بالمزوّد:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    يغطي ملف الاختبارات المباشرة المضمّن لـ Vydra ما يلي:

    - `vydra/veo3` لإنشاء الفيديو من النص
    - `vydra/kling` لإنشاء الفيديو من الصورة باستخدام عنوان URL لصورة بعيدة

    استبدل عينة الصورة البعيدة عند الحاجة:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="تركيب الكلام">
    عيّن Vydra بوصفه مزوّد الكلام:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    القيم الافتراضية:

    - النموذج: `elevenlabs/tts`
    - معرّف الصوت: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    تعرض Plugin المضمّنة هذا الصوت الافتراضي الوحيد المعروف بسلامة عمله، وتعيد ملفات صوتية بتنسيق MP3.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="دليل المزوّدين" href="/ar/providers/index" icon="list">
    تصفّح جميع المزوّدين المتاحين.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل وإعداد النموذج.
  </Card>
</CardGroup>
