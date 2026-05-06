---
read_when:
    - تريد توليد الوسائط باستخدام Vydra في OpenClaw
    - تحتاج إلى إرشادات إعداد مفتاح API الخاص بـ Vydra
summary: استخدم الصور والفيديو والكلام من Vydra في OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T08:11:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

يضيف Plugin المضمّن Vydra ما يلي:

- توليد الصور عبر `vydra/grok-imagine`
- توليد الفيديو عبر `vydra/veo3` و`vydra/kling`
- تركيب الكلام عبر مسار TTS المدعوم من ElevenLabs في Vydra

يستخدم OpenClaw المفتاح نفسه `VYDRA_API_KEY` للإمكانات الثلاث جميعها.

| الخاصية        | القيمة                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| معرّف المزوّد     | `vydra`                                                                   |
| Plugin          | مضمّن، `enabledByDefault: true`                                         |
| متغير بيئة المصادقة    | `VYDRA_API_KEY`                                                           |
| علم التهيئة الأولية | `--auth-choice vydra-api-key`                                             |
| علم CLI المباشر | `--vydra-api-key <key>`                                                   |
| العقود       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| عنوان URL الأساسي        | `https://www.vydra.ai/api/v1` (استخدم مضيف www)                        |

<Warning>
  استخدم `https://www.vydra.ai/api/v1` بصفته عنوان URL الأساسي. يعيد المضيف الجذري لـ Vydra ‏(`https://vydra.ai/api/v1`) حاليًا التوجيه إلى `www`. تُسقط بعض عملاء HTTP ترويسة `Authorization` عند إعادة التوجيه هذه بين مضيفين مختلفين، ما يحوّل مفتاح API صالحًا إلى فشل مصادقة مضلّل. يستخدم Plugin المضمّن عنوان URL الأساسي ذي `www` مباشرة لتجنب ذلك.
</Warning>

## الإعداد

<Steps>
  <Step title="تشغيل التهيئة الأولية التفاعلية">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    أو عيّن متغير البيئة مباشرة:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="اختيار إمكانية افتراضية">
    اختر واحدة أو أكثر من الإمكانات أدناه (الصورة أو الفيديو أو الكلام) وطبّق الإعداد المطابق.
  </Step>
</Steps>

## الإمكانات

<AccordionGroup>
  <Accordion title="توليد الصور">
    نموذج الصور الافتراضي:

    - `vydra/grok-imagine`

    عيّنه كمزوّد الصور الافتراضي:

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

    يقتصر الدعم المضمّن الحالي على تحويل النص إلى صورة فقط. تتوقع مسارات التحرير المستضافة لدى Vydra عناوين URL بعيدة للصور، ولا يضيف OpenClaw حتى الآن جسر رفع خاصًا بـ Vydra في Plugin المضمّن.

    <Note>
    راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="توليد الفيديو">
    نماذج الفيديو المسجلة:

    - `vydra/veo3` لتحويل النص إلى فيديو
    - `vydra/kling` لتحويل الصورة إلى فيديو

    عيّن Vydra كمزوّد الفيديو الافتراضي:

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

    - يتم تضمين `vydra/veo3` كتحويل من نص إلى فيديو فقط.
    - يتطلب `vydra/kling` حاليًا مرجع عنوان URL بعيدًا لصورة. تُرفض عمليات رفع الملفات المحلية مسبقًا.
    - كان مسار HTTP الحالي `kling` في Vydra غير متسق بشأن ما إذا كان يتطلب `image_url` أو `video_url`؛ يربط المزوّد المضمّن عنوان URL البعيد نفسه للصورة بكلا الحقلين.
    - يبقى Plugin المضمّن محافظًا ولا يمرر عناصر تحكم غير موثقة في النمط مثل نسبة العرض إلى الارتفاع أو الدقة أو العلامة المائية أو الصوت المولّد.

    <Note>
    راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="اختبارات الفيديو الحية">
    تغطية حية خاصة بالمزوّد:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    يغطي ملف Vydra الحي المضمّن الآن:

    - تحويل النص إلى فيديو عبر `vydra/veo3`
    - تحويل الصورة إلى فيديو عبر `vydra/kling` باستخدام عنوان URL بعيد لصورة

    تجاوز مُثبّت الصورة البعيد عند الحاجة:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="تركيب الكلام">
    عيّن Vydra كمزوّد الكلام:

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

    الإعدادات الافتراضية:

    - النموذج: `elevenlabs/tts`
    - معرّف الصوت: `21m00Tcm4TlvDq8ikWAM`

    يعرِض Plugin المضمّن حاليًا صوتًا افتراضيًا واحدًا معروفًا بجودته، ويعيد ملفات صوتية بصيغة MP3.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="دليل المزوّدين" href="/ar/providers/index" icon="list">
    تصفح جميع المزوّدين المتاحين.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    إعدادات الوكيل الافتراضية وإعدادات النموذج.
  </Card>
</CardGroup>
