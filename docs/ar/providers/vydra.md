---
read_when:
    - تريد توليد وسائط Vydra في OpenClaw
    - تحتاج إلى إرشادات إعداد مفتاح API الخاص بـ Vydra
summary: استخدم الصور والفيديو والكلام من Vydra في OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-24T08:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

تضيف Plugin Vydra المضمنة ما يلي:

- توليد الصور عبر `vydra/grok-imagine`
- توليد الفيديو عبر `vydra/veo3` و`vydra/kling`
- تركيب الكلام عبر مسار TTS الخاص بـ Vydra والمدعوم من ElevenLabs

يستخدم OpenClaw المفتاح نفسه `VYDRA_API_KEY` للقدرات الثلاث كلها.

<Warning>
استخدم `https://www.vydra.ai/api/v1` بوصفه Base URL.

يقوم المضيف الأساسي لـ Vydra ‏(`https://vydra.ai/api/v1`) حاليًا بإعادة التوجيه إلى `www`. وتقوم بعض عملاء HTTP بإسقاط `Authorization` عند إعادة التوجيه تلك بين المضيفين، مما يحوّل مفتاح API صالحًا إلى فشل مصادقة مضلل. تستخدم Plugin المضمنة عنوان base URL الخاص بـ `www` مباشرة لتجنب ذلك.
</Warning>

## الإعداد

<Steps>
  <Step title="تشغيل onboarding التفاعلي">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    أو اضبط متغير البيئة مباشرة:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="اختيار قدرة افتراضية">
    اختر قدرة واحدة أو أكثر من القدرات أدناه (صورة أو فيديو أو كلام) وطبّق الإعداد المطابق.
  </Step>
</Steps>

## القدرات

<AccordionGroup>
  <Accordion title="توليد الصور">
    نموذج الصور الافتراضي:

    - `vydra/grok-imagine`

    اضبطه بوصفه موفر الصور الافتراضي:

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

    يقتصر الدعم المضمّن الحالي على النص إلى صورة فقط. إذ تتوقع مسارات التحرير المستضافة لدى Vydra عناوين URL لصور بعيدة، ولا يضيف OpenClaw جسر رفع خاصًا بـ Vydra في Plugin المضمنة حتى الآن.

    <Note>
    راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار الموفّر، وسلوك failover.
    </Note>

  </Accordion>

  <Accordion title="توليد الفيديو">
    نماذج الفيديو المسجلة:

    - `vydra/veo3` للنص إلى فيديو
    - `vydra/kling` للصورة إلى فيديو

    اضبط Vydra بوصفها موفر الفيديو الافتراضي:

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

    - يتم تضمين `vydra/veo3` كنموذج نص إلى فيديو فقط.
    - يتطلب `vydra/kling` حاليًا مرجع عنوان URL لصورة بعيدة. ويتم رفض عمليات رفع الملفات المحلية مقدمًا.
    - لم يكن مسار HTTP الحالي لـ `kling` في Vydra ثابتًا بشأن ما إذا كان يتطلب `image_url` أو `video_url`؛ وتقوم المزود المضمنة بربط عنوان URL للصورة البعيدة نفسه في الحقلين.
    - تظل Plugin المضمنة محافظة ولا تمرّر مقابض نمط غير موثقة مثل نسبة العرض إلى الارتفاع أو الدقة أو العلامة المائية أو الصوت المُولد.

    <Note>
    راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار الموفّر، وسلوك failover.
    </Note>

  </Accordion>

  <Accordion title="الاختبارات المباشرة للفيديو">
    التغطية المباشرة الخاصة بالموفر:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    يغطي ملف Vydra المباشر المضمن الآن:

    - `vydra/veo3` للنص إلى فيديو
    - `vydra/kling` للصورة إلى فيديو باستخدام عنوان URL لصورة بعيدة

    تجاوز fixture الصورة البعيدة عند الحاجة:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="تركيب الكلام">
    اضبط Vydra بوصفها موفر الكلام:

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
    - معرّف الصوت: `21m00Tcm4TlvDq8ikWAM`

    تكشف Plugin المضمنة حاليًا عن صوت افتراضي واحد معروف الجودة وتعيد ملفات صوت MP3.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="دليل الموفّرين" href="/ar/providers/index" icon="list">
    تصفح جميع الموفّرين المتاحين.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    القيم الافتراضية للوكيل وإعدادات النموذج.
  </Card>
</CardGroup>
