---
read_when:
    - تريد إنشاء وسائط Vydra في OpenClaw
    - تحتاج إلى إرشادات إعداد مفتاح API لـ Vydra
summary: استخدم الصور والفيديو والكلام من Vydra في OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:28:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

يضيف Plugin Vydra المضمّن ما يلي:

- توليد الصور عبر `vydra/grok-imagine`
- توليد الفيديو عبر `vydra/veo3` و`vydra/kling`
- تركيب الكلام عبر مسار TTS المدعوم من ElevenLabs في Vydra

يستخدم OpenClaw نفس `VYDRA_API_KEY` للقدرات الثلاث كلها.

| الخاصية        | القيمة                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| معرّف المزوّد     | `vydra`                                                                   |
| Plugin          | مضمن، `enabledByDefault: true`                                         |
| متغير بيئة المصادقة    | `VYDRA_API_KEY`                                                           |
| علامة الإعداد الأولي | `--auth-choice vydra-api-key`                                             |
| علامة CLI مباشرة | `--vydra-api-key <key>`                                                   |
| العقود       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| عنوان URL الأساسي        | `https://www.vydra.ai/api/v1` (استخدم مضيف `www`)                        |

<Warning>
  استخدم `https://www.vydra.ai/api/v1` كعنوان URL الأساسي. يعيد مضيف Vydra الجذري (`https://vydra.ai/api/v1`) التوجيه حاليًا إلى `www`. تسقط بعض عملاء HTTP ترويسة `Authorization` عند إعادة التوجيه هذه بين المضيفين، مما يحوّل مفتاح API صالحًا إلى فشل مصادقة مضلل. يستخدم Plugin المضمّن عنوان URL الأساسي `www` مباشرة لتجنب ذلك.
</Warning>

## الإعداد

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    أو عيّن متغير البيئة مباشرة:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    اختر واحدة أو أكثر من القدرات أدناه (الصورة أو الفيديو أو الكلام) وطبّق الإعداد المطابق.
  </Step>
</Steps>

## القدرات

<AccordionGroup>
  <Accordion title="Image generation">
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

    الدعم المضمّن الحالي يقتصر على تحويل النص إلى صورة. تتوقع مسارات التحرير المستضافة في Vydra عناوين URL بعيدة للصور، ولا يضيف OpenClaw بعد جسر رفع خاصًا بـ Vydra في Plugin المضمّن.

    <Note>
    راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
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

    - `vydra/veo3` مضمّن لتحويل النص إلى فيديو فقط.
    - يتطلب `vydra/kling` حاليًا مرجع URL بعيدًا لصورة. تُرفض عمليات رفع الملفات المحلية مقدمًا.
    - كان مسار HTTP الحالي `kling` في Vydra غير متسق بشأن ما إذا كان يتطلب `image_url` أو `video_url`؛ يربط المزوّد المضمّن نفس عنوان URL البعيد للصورة بكلا الحقلين.
    - يبقى Plugin المضمّن محافظًا ولا يمرر مقابض نمط غير موثقة مثل نسبة العرض إلى الارتفاع أو الدقة أو العلامة المائية أو الصوت المولّد.

    <Note>
    راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    تغطية مباشرة خاصة بالمزوّد:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    يغطي ملف Vydra المباشر المضمّن الآن:

    - تحويل النص إلى فيديو عبر `vydra/veo3`
    - تحويل الصورة إلى فيديو عبر `vydra/kling` باستخدام عنوان URL بعيد لصورة

    تجاوز عينة الصورة البعيدة عند الحاجة:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    عيّن Vydra كمزوّد الكلام:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    الإعدادات الافتراضية:

    - النموذج: `elevenlabs/tts`
    - معرّف الصوت: `21m00Tcm4TlvDq8ikWAM`

    يعرّض Plugin المضمّن حاليًا صوتًا افتراضيًا واحدًا معروفًا بجودته ويعيد ملفات صوتية بصيغة MP3.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Provider directory" href="/ar/providers/index" icon="list">
    تصفح جميع المزوّدين المتاحين.
  </Card>
  <Card title="Image generation" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    إعدادات الوكيل الافتراضية وتكوين النموذج.
  </Card>
</CardGroup>
