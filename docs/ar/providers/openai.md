---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T18:21:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f099227b8c8be3a4e919ea286fcede1e4e47be60c7593eb63b4cbbe85aa8389
    source_path: providers/openai.md
    workflow: 15
---

توفّر OpenAI واجهات API للمطورين لنماذج GPT. ويدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. ويحدد بادئة النموذج المسار:

- **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex عبر Pi** — تسجيل دخول ChatGPT/Codex مع وصول الاشتراك (نماذج `openai-codex/*`)
- **حزام Codex app-server** — تنفيذ Codex app-server الأصلي (نماذج `openai/*` بالإضافة إلى `agents.defaults.embeddedHarness.runtime: "codex"`)

تدعم OpenAI صراحةً استخدام اشتراك OAuth في الأدوات وسير العمل الخارجية مثل OpenClaw.

يُعد كل من الموفّر، والنموذج، ووقت التشغيل، والقناة طبقات منفصلة. وإذا كانت هذه التسميات
تختلط عليك، فاقرأ [أوقات تشغيل Agent](/ar/concepts/agent-runtimes) قبل
تغيير الإعدادات.

## اختيار سريع

| الهدف                                         | الاستخدام                                                | ملاحظات                                                                      |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| فوترة مباشرة عبر مفتاح API                    | `openai/gpt-5.5`                                         | اضبط `OPENAI_API_KEY` أو شغّل إعداد OpenAI عبر مفتاح API.                    |
| GPT-5.5 مع مصادقة اشتراك ChatGPT/Codex        | `openai-codex/gpt-5.5`                                   | مسار Pi الافتراضي لـ Codex OAuth. أفضل خيار أول لإعدادات الاشتراك.         |
| GPT-5.5 مع سلوك Codex app-server الأصلي       | `openai/gpt-5.5` مع `embeddedHarness.runtime: "codex"`   | يفرض حزام Codex app-server لمرجع هذا النموذج.                                |
| إنشاء الصور أو تحريرها                        | `openai/gpt-image-2`                                     | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                              |

<Note>
يتوفر GPT-5.5 من خلال كلٍّ من الوصول المباشر عبر مفتاح API إلى OpenAI Platform
ومسارات الاشتراك/OAuth. استخدم `openai/gpt-5.5` لحركة المرور المباشرة عبر `OPENAI_API_KEY`،
واستخدم `openai-codex/gpt-5.5` لـ Codex OAuth عبر Pi، أو
`openai/gpt-5.5` مع `embeddedHarness.runtime: "codex"` لاستخدام حزام Codex
app-server الأصلي.
</Note>

<Note>
إن تمكين Plugin الخاص بـ OpenAI، أو اختيار نموذج `openai-codex/*`، لا
يؤدي إلى تمكين Plugin المضمّن الخاص بـ Codex app-server. إذ لا يفعّل OpenClaw ذلك Plugin إلا
عندما تختار صراحةً حزام Codex الأصلي باستخدام
`embeddedHarness.runtime: "codex"` أو تستخدم مرجع نموذج قديمًا بالشكل `codex/*`.
</Note>

## تغطية ميزات OpenClaw

| إمكانة OpenAI              | سطح OpenClaw                                              | الحالة                                                 |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses           | موفّر نموذج `openai/<model>`                             | نعم                                                    |
| نماذج اشتراك Codex         | `openai-codex/<model>` مع OAuth من `openai-codex`        | نعم                                                    |
| حزام Codex app-server      | `openai/<model>` مع `embeddedHarness.runtime: codex`     | نعم                                                    |
| البحث على الويب من جهة الخادم | أداة OpenAI Responses الأصلية                           | نعم، عند تمكين البحث على الويب وعدم تثبيت موفّر محدد   |
| الصور                      | `image_generate`                                          | نعم                                                    |
| الفيديو                    | `video_generate`                                          | نعم                                                    |
| تحويل النص إلى كلام        | `messages.tts.provider: "openai"` / `tts`                 | نعم                                                    |
| تحويل الكلام إلى نص دفعي   | `tools.media.audio` / فهم الوسائط                        | نعم                                                    |
| تحويل الكلام إلى نص مباشر  | Voice Call `streaming.provider: "openai"`                | نعم                                                    |
| الصوت الفوري               | Voice Call `realtime.provider: "openai"` / Control UI Talk | نعم                                                  |
| التضمينات                  | موفّر تضمينات الذاكرة                                     | نعم                                                    |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai/gpt-5.5` | واجهة OpenAI Platform API المباشرة | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | واجهة OpenAI Platform API المباشرة | `OPENAI_API_KEY` |

    <Note>
    يمثّل `openai/*` مسار OpenAI المباشر عبر مفتاح API ما لم تُجبر صراحةً
    حزام Codex app-server. استخدم `openai-codex/*` لـ Codex OAuth عبر
    مشغّل Pi الافتراضي، أو استخدم `openai/gpt-5.5` مع
    `embeddedHarness.runtime: "codex"` لتنفيذ Codex app-server الأصلي.
    </Note>

    ### مثال على الإعدادات

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    لا يعرّض OpenClaw **مطلقًا** `openai/gpt-5.3-codex-spark`. إذ ترفض طلبات OpenAI API الحية هذا النموذج، كما أن كتالوج Codex الحالي لا يعرضه أيضًا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك بدلًا من مفتاح API منفصل. يتطلب Codex السحابي تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة إلى الإعدادات دون واجهة أو غير المتوافقة مع رد الاتصال، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز جهاز ChatGPT بدلًا من رد اتصال المتصفح المحلي:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="اضبط النموذج الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth عبر Pi | تسجيل دخول Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | حزام Codex app-server | مصادقة Codex app-server |

    <Note>
    استمر في استخدام معرّف الموفّر `openai-codex` لأوامر المصادقة/ملف التعريف. كما أن
    بادئة النموذج `openai-codex/*` هي أيضًا المسار الصريح لـ Pi بالنسبة إلى Codex OAuth.
    وهي لا تختار أو تفعّل تلقائيًا حزام Codex app-server المضمّن.
    </Note>

    ### مثال على الإعدادات

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    لم يعد الإعداد يستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يتولى OpenClaw إدارة بيانات الاعتماد الناتجة في مخزن مصادقة agent الخاص به.
    </Note>

    ### مؤشر الحالة

    يعرض Chat `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    ويظهر حزام Pi الافتراضي بالشكل `Runtime: OpenClaw Pi Default`. وعند
    اختيار حزام Codex app-server المضمّن، يعرض `/status`
    القيمة `Runtime: OpenAI Codex`. وتحتفظ الجلسات الحالية بمعرّف الحزام المسجّل لها، لذا استخدم
    `/new` أو `/reset` بعد تغيير `embeddedHarness` إذا كنت تريد أن يعكس `/status`
    اختيار Pi/Codex جديدًا.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات النموذج الوصفية وحد وقت تشغيل السياق كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - القيمة الأصلية `contextWindow`: `1000000`
    - الحد الافتراضي لوقت التشغيل `contextTokens`: `272000`

    يتمتع الحد الافتراضي الأصغر بأفضلية عملية من حيث زمن الوصول والجودة. ويمكنك تجاوزه باستخدام `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    استخدم `contextWindow` لتعريف بيانات النموذج الأصلية. واستخدم `contextTokens` لتقييد ميزانية سياق وقت التشغيل.
    </Note>

    ### استرداد الكتالوج

    يستخدم OpenClaw بيانات كتالوج Codex الوصفية من المصدر الأعلى لـ `gpt-5.5` عندما
    تكون موجودة. وإذا أغفل الاكتشاف الحي لـ Codex صف `openai-codex/gpt-5.5` بينما
    يكون الحساب موثّقًا، فإن OpenClaw يُنشئ صف نموذج OAuth هذا اصطناعيًا بحيث
    لا تفشل عمليات cron وsub-agent وعمليات تشغيل النموذج الافتراضي المُعد
    بخطأ `Unknown model`.

  </Tab>
</Tabs>

## إنشاء الصور

يسجّل Plugin `openai` المضمّن إنشاء الصور من خلال الأداة `image_generate`.
وهو يدعم كلاً من إنشاء الصور عبر مفتاح OpenAI API وإنشاء الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| الإمكانة                  | مفتاح OpenAI API                    | Codex OAuth                          |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| مرجع النموذج              | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| المصادقة                  | `OPENAI_API_KEY`                    | تسجيل دخول OpenAI Codex OAuth        |
| النقل                     | OpenAI Images API                   | الخلفية Responses الخاصة بـ Codex    |
| الحد الأقصى للصور لكل طلب | 4                                   | 4                                    |
| وضع التحرير               | مفعّل (حتى 5 صور مرجعية)            | مفعّل (حتى 5 صور مرجعية)             |
| تجاوزات الحجم             | مدعومة، بما في ذلك أحجام 2K/4K      | مدعومة، بما في ذلك أحجام 2K/4K       |
| نسبة الأبعاد / الدقة      | لا تُمرر إلى OpenAI Images API      | تُحوَّل إلى حجم مدعوم عندما يكون ذلك آمنًا |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار الموفّر، وسلوك الرجوع الاحتياطي.
</Note>

يمثل `gpt-image-2` القيمة الافتراضية لكلٍّ من إنشاء الصور من النص في OpenAI وتحرير الصور.
وما يزال `gpt-image-1` قابلًا للاستخدام كتجاوز صريح للنموذج، لكن
عمليات OpenAI الجديدة الخاصة بالصور يجب أن تستخدم `openai/gpt-image-2`.

بالنسبة إلى تثبيتات Codex OAuth، احتفظ بمرجع `openai/gpt-image-2` نفسه. فعندما يكون
ملف تعريف OAuth لـ `openai-codex` مُعدًا، يحل OpenClaw رمز وصول OAuth
المخزن هذا ويرسل طلبات الصور عبر الواجهة الخلفية Codex Responses. وهو
لا يجرّب أولًا `OPENAI_API_KEY` ولا يعود بصمت إلى مفتاح API لذلك
الطلب. قم بإعداد `models.providers.openai` صراحةً باستخدام مفتاح API،
أو `baseUrl` مخصص، أو نقطة نهاية Azure عندما تريد استخدام
مسار OpenAI Images API المباشر بدلًا من ذلك.
وإذا كانت نقطة نهاية الصور المخصصة هذه موجودة على شبكة LAN موثوقة/عنوان خاص، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ يُبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محجوبة ما لم يكن خيار الاشتراك هذا
موجودًا.

إنشاء:

```
/tool image_generate model=openai/gpt-image-2 prompt="ملصق إطلاق مصقول لـ OpenClaw على macOS" size=3840x2160 count=1
```

تحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="حافظ على شكل العنصر، وغيّر المادة إلى زجاج شفاف" image=/path/to/reference.png size=1024x1536
```

## إنشاء الفيديو

يسجّل Plugin `openai` المضمّن إنشاء الفيديو من خلال الأداة `video_generate`.

| الإمكانة        | القيمة                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                  |
| الأوضاع         | تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، وتحرير فيديو واحد                |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                         |
| تجاوزات الحجم   | مدعومة                                                                            |
| تجاوزات أخرى    | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة     |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار الموفّر، وسلوك الرجوع الاحتياطي.
</Note>

## مساهمة مطالبة GPT-5

يضيف OpenClaw مساهمة مطالبة مشتركة لـ GPT-5 لعمليات تشغيل عائلة GPT-5 عبر الموفّرين. وهي تُطبّق حسب معرّف النموذج، لذا تتلقى `openai-codex/gpt-5.5` و`openai/gpt-5.5` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` ومراجع GPT-5 المتوافقة الأخرى الطبقة نفسها. أما نماذج GPT-4.x الأقدم فلا تتلقاها.

يستخدم حزام Codex الأصلي المضمّن سلوك GPT-5 نفسه وطبقة Heartbeat نفسها من خلال تعليمات المطور الخاصة بـ Codex app-server، لذا تحتفظ جلسات `openai/gpt-5.x` التي تُفرض عبر `embeddedHarness.runtime: "codex"` بنفس إرشادات المتابعة وHeartbeat الاستباقية، رغم أن Codex يتولى بقية مطالبة الحزام.

تضيف مساهمة GPT-5 عقد سلوك معنونًا لاستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. وتظل استجابة القناة الخاصة وسلوك الرسائل الصامتة ضمن مطالبة نظام OpenClaw المشتركة وسياسة التسليم الصادر. وتكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. أما طبقة أسلوب التفاعل الودية فهي منفصلة وقابلة للإعداد.

| القيمة                 | التأثير                                  |
| ---------------------- | ---------------------------------------- |
| `"friendly"` (الافتراضي) | تمكين طبقة أسلوب التفاعل الودية          |
| `"on"`                 | اسم بديل لـ `"friendly"`                 |
| `"off"`                | تعطيل طبقة الأسلوب الودية فقط            |

<Tabs>
  <Tab title="الإعدادات">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذا فإن كلاً من `"Off"` و`"off"` يعطّل طبقة الأسلوب الودية.
</Tip>

<Note>
ما يزال `plugins.entries.openai.config.personality` القديم يُقرأ كبديل توافق عندما لا يكون الإعداد المشترك `agents.defaults.promptOverlays.gpt5.personality` مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="توليف الكلام (TTS)">
    يسجّل Plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    النماذج المتاحة: `gpt-4o-mini-tts` و`tts-1` و`tts-1-hd`. والأصوات المتاحة: `alloy` و`ash` و`ballad` و`cedar` و`coral` و`echo` و`fable` و`juniper` و`marin` و`onyx` و`nova` و`sage` و`shimmer` و`verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز Base URL الخاص بـ TTS من دون التأثير في نقطة نهاية Chat API.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin `openai` المضمّن تحويل الكلام إلى نص على دفعات عبر
    سطح النسخ الخاص بفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: واجهة OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw أينما استخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع القنوات الصوتية في Discord و
      مرفقات الصوت في القنوات

    لفرض OpenAI لنسخ الصوت الوارد:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    تُمرَّر تلميحات اللغة والمطالبة إلى OpenAI عند توفيرها من خلال
    إعدادات وسائط الصوت المشتركة أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ الفوري">
    يسجّل Plugin `openai` المضمّن النسخ الفوري لصالح Plugin Voice Call.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | المطالبة | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | حد VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). ويُستخدم موفّر البث هذا لمسار النسخ الفوري في Voice Call؛ أما الصوت في Discord فيسجل حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    يسجّل Plugin `openai` المضمّن الصوت الفوري لصالح Plugin Voice Call.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | حد VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفتاحي الإعداد `azureEndpoint` و`azureDeployment`. كما يدعم استدعاء الأدوات في الاتجاهين. ويستخدم تنسيق الصوت G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن للموفّر `openai` المضمّن استهداف مورد Azure OpenAI لإنشاء الصور
من خلال تجاوز base URL. وفي مسار إنشاء الصور، يكتشف OpenClaw
أسماء مضيفات Azure في `models.providers.openai.baseUrl` ويتحول إلى
شكل طلب Azure تلقائيًا.

<Note>
يستخدم الصوت الفوري مسار إعدادات منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت
الفوري** ضمن [الصوت والكلام](#voice-and-speech) للاطلاع على إعدادات Azure
الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة المرور داخل بيئة Azure الحالية لديك

### الإعداد

بالنسبة إلى إنشاء الصور عبر Azure من خلال الموفّر `openai` المضمّن، وجّه
`models.providers.openai.baseUrl` إلى مورد Azure الخاص بك واضبط `apiKey` على
مفتاح Azure OpenAI (وليس مفتاح OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

يتعرف OpenClaw على لواحق مضيف Azure التالية لمسار Azure الخاص بإنشاء الصور:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة إلى طلبات إنشاء الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات بنطاق deployment (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب

أما Base URL الأخرى (OpenAI العامة، والوكلاء المتوافقون مع OpenAI) فتحافظ على
شكل طلب الصورة القياسي الخاص بـ OpenAI.

<Note>
يتطلب توجيه Azure لمسار إنشاء الصور في الموفّر `openai`
OpenClaw 2026.4.22 أو أحدث. أما الإصدارات الأقدم فتعامل أي
`openai.baseUrl` مخصص كما لو كان نقطة نهاية OpenAI العامة، وستفشل مع
عمليات نشر الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار معاينة أو GA محدد من Azure
لمسار إنشاء الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما لا يكون المتغير مضبوطًا.

### أسماء النماذج هي أسماء deployment

يربط Azure OpenAI النماذج بعمليات deployment. وبالنسبة إلى طلبات إنشاء الصور في Azure
الموجّهة عبر الموفّر `openai` المضمّن، يجب أن يكون الحقل `model` في OpenClaw
هو **اسم Azure deployment** الذي قمت بإعداده في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت deployment باسم `gpt-image-2-prod` يخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="ملصق نظيف" size=1024x1024 count=1
```

تنطبق قاعدة اسم deployment نفسها على استدعاءات إنشاء الصور الموجّهة عبر
الموفّر `openai` المضمّن.

### التوفر الإقليمي

يتوفر إنشاء الصور في Azure حاليًا فقط في مجموعة فرعية من المناطق
(مثل `eastus2` و`swedencentral` و`polandcentral` و`westus3`
و`uaenorth`). تحقّق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
deployment، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

قد لا تقبل Azure OpenAI وOpenAI العامة دائمًا معلمات الصور نفسها.
فقد ترفض Azure خيارات تسمح بها OpenAI العامة (على سبيل المثال بعض قيم
`background` على `gpt-image-2`) أو تعرضها فقط في إصدارات نموذج
معينة. تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. وإذا فشل طلب Azure بسبب خطأ تحقق، فتحقق من
مجموعة المعلمات التي يدعمها deployment وإصدار API المحددان لديك في
بوابة Azure.

<Note>
تستخدم Azure OpenAI سلوك النقل والتوافق الأصلي، لكنها لا تتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل
المسارات المتوافقة مع OpenAI** ضمن [الإعدادات المتقدمة](#advanced-configuration).

وبالنسبة إلى حركة مرور Chat أو Responses على Azure (إلى جانب إنشاء الصور)، استخدم
تدفق الإعداد أو إعداد موفّر Azure مخصصًا — فـ `openai.baseUrl` وحده
لا يلتقط شكل API/المصادقة الخاص بـ Azure. يوجد موفّر منفصل
`azure-openai-responses/*`؛ راجع
أكورديون Compaction من جهة الخادم أدناه.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket أولًا مع الرجوع الاحتياطي إلى SSE (`"auto"`) لكلٍّ من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد المحاولة مرة واحدة عند فشل WebSocket مبكر قبل الرجوع إلى SSE
    - بعد الفشل، يضع علامة على WebSocket على أنه متدهور لمدة تقارب 60 ثانية ويستخدم SSE خلال فترة التهدئة
    - يربط ترويسات هوية الجلسة والدوران الثابتة لعمليات إعادة المحاولة وإعادة الاتصال
    - يطبع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، مع رجوع احتياطي إلى SSE |
    | `"sse"` | فرض SSE فقط |
    | `"websocket"` | فرض WebSocket فقط |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    مستندات OpenAI ذات الصلة:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="تهيئة WebSocket مسبقًا">
    يفعّل OpenClaw تهيئة WebSocket مسبقًا افتراضيًا لكلٍّ من `openai/*` و`openai-codex/*` لتقليل زمن الاستجابة في الدور الأول.

    ```json5
    // تعطيل التهيئة المسبقة
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الوضع السريع">
    يوفّر OpenClaw مفتاح تبديل مشتركًا للوضع السريع لكلٍّ من `openai/*` و`openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **الإعدادات:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التمكين، يربط OpenClaw الوضع السريع بالمعالجة ذات الأولوية في OpenAI (`service_tier = "priority"`). وتُحفَظ قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    تتغلب تجاوزات الجلسة على الإعدادات. وتؤدي إزالة تجاوز الجلسة في Sessions UI إلى إعادة الجلسة إلى القيمة الافتراضية المُعدّة.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تعرض API الخاصة بـ OpenAI المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    القيم المدعومة: `auto` و`default` و`flex` و`priority`.

    <Warning>
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). وإذا وجّهت أيًا من الموفّرين عبر وكيل، فإن OpenClaw يترك `service_tier` دون تعديل.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يقوم غلاف البث Pi-harness في Plugin الخاص بـ OpenAI بتمكين Compaction من جهة الخادم تلقائيًا:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`: 70% من `contextWindow` (أو `80000` عند عدم توفرها)

    ينطبق هذا على مسار Pi harness المضمّن وعلى خطافات موفّر OpenAI المستخدمة في عمليات التشغيل المضمنة. أما حزام Codex app-server الأصلي فيدير السياق الخاص به عبر Codex ويتم إعداده بشكل منفصل بواسطة `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="تمكين صريح">
        مفيد لنقاط النهاية المتوافقة مثل Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="حد مخصص">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="تعطيل">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. وما تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يضبط التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الوكيلي الصارم">
    بالنسبة إلى عمليات تشغيل عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمن أكثر صرامة:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    مع `strict-agentic`، يقوم OpenClaw بما يلي:
    - لم يعد يعتبر الدور القائم على الخطة فقط تقدمًا ناجحًا عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور مع توجيه للتنفيذ الفوري
    - يفعّل `update_plan` تلقائيًا للأعمال الجوهرية
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط من دون تنفيذ

    <Note>
    هذا النطاق يقتصر على عمليات تشغيل OpenAI وCodex لعائلة GPT-5 فقط. أما الموفّرون الآخرون وعائلات النماذج الأقدم فتحتفظ بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI المباشرة، وCodex، وAzure OpenAI بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، وAzure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم قيمة `none` في OpenAI
    - تحذف التعليل المعطّل للنماذج أو الوكلاء التي ترفض `reasoning.effort: "none"`
    - تجعل مخططات الأدوات في الوضع الصارم افتراضيًا
    - تربط ترويسات إسناد مخفية على المضيفات الأصلية المتحقق منها فقط
    - تحتفظ بتشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier` و`store` وتوافق reasoning وتلميحات ذاكرة التخزين المؤقت للمطالبة)

    **المسارات المتوافقة/الوكلاء:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل `store` الخاص بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON لـ `params.extra_body`/`params.extraBody` المتقدم إلى وكلاء Completions المتوافقة مع OpenAI
    - لا تفرض مخططات أدوات صارمة أو ترويسات خاصة بالمسارات الأصلية

    تستخدم Azure OpenAI سلوك النقل والتوافق الأصلي، لكنها لا تتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
