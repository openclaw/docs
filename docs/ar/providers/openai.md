---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدام OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T08:00:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

توفر OpenAI واجهات API للمطورين لنماذج GPT. يدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. وتحدد بادئة النموذج المسار:

- **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex عبر PI** — تسجيل دخول ChatGPT/Codex مع وصول الاشتراك (نماذج `openai-codex/*`)
- **Codex app-server harness** — تنفيذ Codex app-server الأصلي (نماذج `openai/*` بالإضافة إلى `agents.defaults.embeddedHarness.runtime: "codex"`)

تدعم OpenAI صراحةً استخدام OAuth الخاص بالاشتراك في الأدوات الخارجية وسير العمل مثل OpenClaw.

<Note>
يتوفر GPT-5.5 حاليًا في OpenClaw عبر مسارات الاشتراك/‏OAuth:
`openai-codex/gpt-5.5` مع مشغّل PI، أو `openai/gpt-5.5` مع
Codex app-server harness. وسيصبح الوصول المباشر عبر API key لـ `openai/gpt-5.5`
مدعومًا عندما تفعّل OpenAI نموذج GPT-5.5 على API العامة؛ وحتى ذلك الحين استخدم
نموذجًا مفعّلًا عبر API مثل `openai/gpt-5.4` في إعدادات `OPENAI_API_KEY`.
</Note>

<Note>
لا يؤدي تفعيل Plugin ‏OpenAI أو اختيار نموذج `openai-codex/*` إلى
تفعيل Plugin ‏Codex app-server المجمّعة. ولا يفعّل OpenClaw تلك Plugin إلا
عندما تختار صراحةً Codex harness الأصلية عبر
`embeddedHarness.runtime: "codex"` أو تستخدم مرجع نموذج قديم `codex/*`.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI | سطح OpenClaw | الحالة |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| الدردشة / Responses | مزود نموذج `openai/<model>` | نعم |
| نماذج اشتراك Codex | `openai-codex/<model>` مع OAuth ‏`openai-codex` | نعم |
| Codex app-server harness | `openai/<model>` مع `embeddedHarness.runtime: codex` | نعم |
| البحث على الويب من جهة الخادم | أداة OpenAI Responses الأصلية | نعم، عند تفعيل البحث على الويب وعدم تثبيت مزود |
| الصور | `image_generate` | نعم |
| الفيديو | `video_generate` | نعم |
| تحويل النص إلى كلام | `messages.tts.provider: "openai"` / `tts` | نعم |
| تحويل الصوت إلى نص دفعيًا | `tools.media.audio` / فهم الوسائط | نعم |
| تحويل الصوت إلى نص بالبث | Voice Call ‏`streaming.provider: "openai"` | نعم |
| الصوت الفوري | Voice Call ‏`realtime.provider: "openai"` / Control UI Talk | نعم |
| التضمينات | مزود تضمين الذاكرة | نعم |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="تحقّق من توفر النموذج">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai/gpt-5.4` | OpenAI Platform API مباشرة | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | OpenAI Platform API مباشرة | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | مسار API مباشر مستقبلي بمجرد أن تفعّل OpenAI نموذج GPT-5.5 على API | `OPENAI_API_KEY` |

    <Note>
    تمثل `openai/*` المسار المباشر لـ OpenAI عبر API key ما لم تفرض صراحةً
    Codex app-server harness. أما GPT-5.5 نفسه فهو حاليًا خاص بالاشتراك/‏OAuth
    فقط؛ استخدم `openai-codex/*` لـ Codex OAuth عبر مشغّل PI الافتراضي.
    </Note>

    ### مثال على الإعداد

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    لا يعرّض OpenClaw النموذج `openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API المباشرة ذلك النموذج، كما أن فهرس Codex الحالي لا يعرّضه أيضًا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك بدلًا من مفتاح API منفصل. تتطلب Codex cloud تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة إلى الإعدادات عديمة الواجهة أو غير الملائمة لردود النداء، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز الجهاز الخاص بـ ChatGPT بدلًا من رد نداء localhost في المتصفح:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="اضبط النموذج الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="تحقّق من توفر النموذج">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth عبر PI | تسجيل دخول Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | مصادقة Codex app-server |

    <Note>
    واصل استخدام معرّف المزود `openai-codex` لأوامر المصادقة/الملف التعريفي.
    وتمثل البادئة `openai-codex/*` أيضًا مسار PI الصريح لـ Codex OAuth.
    وهي لا تختار ولا تفعّل تلقائيًا Codex app-server harness المجمعة.
    </Note>

    ### مثال على الإعداد

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    لم يعد onboarding يستورد مواد OAuth من `~/.codex`. سجّل الدخول عبر OAuth في المتصفح (الافتراضي) أو عبر تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### مؤشر الحالة

    يعرض `/status` في الدردشة أي harness مضمنة فعالة للجلسة
    الحالية. تظهر PI harness الافتراضية على شكل `Runner: pi (embedded)` ولا
    تضيف شارة منفصلة. وعندما يتم اختيار Codex app-server harness المجمّعة،
    يضيف `/status` معرّف harness غير PI بجانب `Fast`، مثل
    `Fast · codex`. وتحتفظ الجلسات الموجودة بمعرّف harness المسجل لها، لذا استخدم
    `/new` أو `/reset` بعد تغيير `embeddedHarness` إذا كنت تريد لـ `/status` أن
    يعكس اختيارًا جديدًا بين PI/Codex.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات تعريف النموذج وحد سياق التشغيل على أنهما قيمتان منفصلتان.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي أثناء التشغيل: `272000`

    يمتلك الحد الافتراضي الأصغر خصائص أفضل عمليًا من حيث الكمون والجودة. ويمكن تجاوزه عبر `contextTokens`:

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
    استخدم `contextWindow` للتصريح عن بيانات تعريف النموذج الأصلية. واستخدم `contextTokens` لتقييد ميزانية السياق أثناء التشغيل.
    </Note>

  </Tab>
</Tabs>

## توليد الصور

تسجل Plugin ‏`openai` المجمّعة توليد الصور عبر أداة `image_generate`.
وهي تدعم كلًا من توليد الصور عبر OpenAI API key وتوليد الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة | مفتاح OpenAI API | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج | `openai/gpt-image-2` | `openai/gpt-image-2` |
| المصادقة | `OPENAI_API_KEY` | تسجيل دخول OpenAI Codex OAuth |
| النقل | OpenAI Images API | الواجهة الخلفية لـ Codex Responses |
| الحد الأقصى للصور لكل طلب | 4 | 4 |
| وضع التحرير | مفعّل (حتى 5 صور مرجعية) | مفعّل (حتى 5 صور مرجعية) |
| تجاوزات الحجم | مدعومة، بما في ذلك أحجام 2K/4K | مدعومة، بما في ذلك أحجام 2K/4K |
| نسبة الأبعاد / الدقة | لا تُمرَّر إلى OpenAI Images API | تُحوَّل إلى حجم مدعوم عندما يكون ذلك آمنًا |

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
راجع [توليد الصور](/ar/tools/image-generation) لمعرفة معلمات الأداة المشتركة، واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Note>

يمثل `gpt-image-2` الافتراضي لكل من توليد الصور من النص وتحرير الصور في OpenAI.
ولا يزال `gpt-image-1` قابلًا للاستخدام كتجاوز نموذج صريح، لكن
عمليات سير عمل الصور الجديدة في OpenAI ينبغي أن تستخدم `openai/gpt-image-2`.

بالنسبة إلى تثبيتات Codex OAuth، احتفظ بمرجع `openai/gpt-image-2` نفسه. فعندما
يكون ملف تعريف OAuth من نوع `openai-codex` مهيأً، يحل OpenClaw رمز وصول OAuth المخزن
ويرسل طلبات الصور عبر الواجهة الخلفية لـ Codex Responses. وهو
لا يحاول أولًا استخدام `OPENAI_API_KEY` ولا يرجع احتياطيًا بصمت إلى مفتاح API لذلك
الطلب. قم بتهيئة `models.providers.openai` صراحةً بمفتاح API،
أو base URL مخصصة، أو نقطة نهاية Azure عندما تريد المسار المباشر لـ OpenAI Images API
بدلًا من ذلك.
وإذا كانت نقطة نهاية الصور المخصصة هذه تقع على LAN موثوقة/عنوان خاص، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ يبقي OpenClaw
نقاط النهاية الخاصة/الداخلية المتوافقة مع OpenAI الخاصة بالصور محجوبة ما لم يوجد هذا الاشتراك.

وللتوليد:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

وللتحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

تسجل Plugin ‏`openai` المجمّعة توليد الفيديو عبر أداة `video_generate`.

| القدرة | القيمة |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2` |
| الأوضاع | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو منفرد |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد |
| تجاوزات الحجم | مدعومة |
| تجاوزات أخرى | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعرفة معلمات الأداة المشتركة، واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Note>

## مساهمة مطالبة GPT-5

يضيف OpenClaw مساهمة مطالبة مشتركة لـ GPT-5 لعمليات تشغيل عائلة GPT-5 عبر المزوّدين. وهي تُطبَّق حسب معرّف النموذج، لذا فإن `openai-codex/gpt-5.5` و`openai/gpt-5.4` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` وغيرها من مراجع GPT-5 المتوافقة تتلقى الطبقة نفسها. أما نماذج GPT-4.x الأقدم فلا تتلقاها.

تستخدم Codex harness الأصلية المجمعة سلوك GPT-5 نفسه وطبقة Heartbeat نفسها عبر تعليمات المطوّر في Codex app-server، لذلك تحافظ جلسات `openai/gpt-5.x` المفروضة عبر `embeddedHarness.runtime: "codex"` على الإرشاد نفسه الخاص بالمتابعة والتوجيه الاستباقي لـ Heartbeat، رغم أن Codex تملك بقية مطالبة harness.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرار persona، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الاكتمال، والتحقق. ويبقى سلوك الردود الخاصة بالقنوات وسلوك الرسائل الصامتة في system prompt المشتركة الخاصة بـ OpenClaw وفي سياسة التسليم الصادرة. ويكون إرشاد GPT-5 مفعّلًا دائمًا للنماذج المطابقة. أما طبقة أسلوب التفاعل الودّي فهي منفصلة وقابلة للضبط.

| القيمة | التأثير |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (الافتراضي) | تفعيل طبقة أسلوب التفاعل الودّي |
| `"on"` | اسم بديل لـ `"friendly"` |
| `"off"` | تعطيل طبقة الأسلوب الودّي فقط |

<Tabs>
  <Tab title="الإعداد">
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
تكون القيم غير حساسة لحالة الأحرف أثناء التشغيل، لذا فإن `"Off"` و`"off"` كلتاهما تعطلان طبقة الأسلوب الودّي.
</Tip>

<Note>
لا تزال القيمة القديمة `plugins.entries.openai.config.personality` تُقرأ كرجوع احتياطي للتوافق عندما لا يكون الإعداد المشترك `agents.defaults.promptOverlays.gpt5.personality` مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="تركيب الكلام (TTS)">
    تسجل Plugin ‏`openai` المجمعة تركيب الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، لـ `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يرجع احتياطيًا إلى `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    النماذج المتاحة: `gpt-4o-mini-tts`، و`tts-1`، و`tts-1-hd`. والأصوات المتاحة: `alloy`، و`ash`، و`ballad`، و`cedar`، و`coral`، و`echo`، و`fable`، و`juniper`، و`marin`، و`onyx`، و`nova`، و`sage`، و`shimmer`، و`verse`.

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
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز base URL الخاصة بـ TTS من دون التأثير في نقطة نهاية chat API.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    تسجل Plugin ‏`openai` المجمعة تحويل الكلام إلى نص دفعيًا عبر
    سطح النسخ الخاص بفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST ‏`/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي multipart
    - مدعوم في OpenClaw أينما استخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قناة Discord الصوتية ومرفقات
      الصوت في القنوات

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

    يتم تمرير تلميحات اللغة والمطالبة إلى OpenAI عند تزويدها من
    إعداد الوسائط الصوتية المشترك أو من طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ الفوري">
    تسجل Plugin ‏`openai` المجمعة النسخ الفوري لـ Plugin ‏Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | المطالبة | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يرجع احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law ‏(`g711_ulaw` / `audio/pcmu`). مزود البث هذا مخصص لمسار النسخ الفوري لـ Voice Call؛ أما Discord voice حاليًا فيسجّل مقاطع قصيرة ويستخدم مسار النسخ الدفعي `tools.media.audio` بدلًا من ذلك.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    تسجل Plugin ‏`openai` المجمعة الصوت الفوري لـ Plugin ‏Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يرجع احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح الإعداد `azureEndpoint` و`azureDeployment`. ويدعم الاستدعاء الثنائي الاتجاه للأدوات. ويستخدم تنسيق الصوت G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لمزوّد `openai` المجمّع أن يستهدف مورد Azure OpenAI لتوليد الصور
عبر تجاوز base URL. وفي مسار توليد الصور، يكتشف OpenClaw
أسماء مضيف Azure في `models.providers.openai.baseUrl` ويبدّل إلى
شكل الطلب الخاص بـ Azure تلقائيًا.

<Note>
يستخدم الصوت الفوري مسار إعداد منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع Accordion الخاصة بـ **الصوت
الفوري** ضمن [الصوت والكلام](#voice-and-speech) لمعرفة إعدادات Azure
الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure قائم

### الإعداد

بالنسبة إلى توليد الصور عبر Azure من خلال مزود `openai` المجمّع، وجّه
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

يتعرف OpenClaw على لواحق مضيف Azure هذه لمسار توليد الصور في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

وبالنسبة إلى طلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات مقيّدة بالنشر (`/openai/deployments/{deployment}/...`)
- يلحق `?api-version=...` بكل طلب

أما base URLs الأخرى (OpenAI العامة، أو الوكلاء المتوافقون مع OpenAI) فتبقي شكل
طلب الصور القياسي الخاص بـ OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور الخاص بمزوّد `openai`
الإصدار OpenClaw 2026.4.22 أو أحدث. أما الإصدارات الأقدم فتتعامل مع أي
`openai.baseUrl` مخصصة كما لو كانت نقطة نهاية OpenAI العامة، وستفشل مع
عمليات نشر الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure محدد، سواء كان preview أو GA،
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

الافتراضي هو `2024-12-01-preview` عندما لا يكون المتغير مضبوطًا.

### أسماء النماذج هي أسماء النشر

تربط Azure OpenAI النماذج بعمليات النشر. وبالنسبة إلى طلبات توليد الصور في Azure
الموجّهة عبر مزود `openai` المجمّع، يجب أن يكون حقل `model` في OpenClaw هو **اسم نشر Azure**
الذي ضبطته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجّهة عبر
مزود `openai` المجمّع.

### التوفر الإقليمي

يتوفر توليد الصور في Azure حاليًا فقط في مجموعة فرعية من المناطق
(مثل `eastus2`، و`swedencentral`، و`polandcentral`، و`westus3`،
و`uaenorth`). تحقّق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### فروق المعلمات

لا تقبل Azure OpenAI وOpenAI العامة دائمًا معلمات الصور نفسها.
قد ترفض Azure خيارات تسمح بها OpenAI العامة (مثل بعض
قيم `background` في `gpt-image-2`) أو قد تعرضها فقط في إصدارات
نماذج محددة. تأتي هذه الفروق من Azure والنموذج الأساسي، وليس
من OpenClaw. إذا فشل طلب Azure مع خطأ تحقق، فتحقّق من
مجموعة المعلمات المدعومة بواسطة النشر وإصدار API المحددين في
بوابة Azure.

<Note>
تستخدم Azure OpenAI النقل والسلوك التوافقيين الأصليين لكنها لا تتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع Accordion الخاصة بـ **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [الإعداد المتقدم](#advanced-configuration).

بالنسبة إلى حركة chat أو Responses على Azure (بخلاف توليد الصور)، استخدم
تدفق onboarding أو إعداد مزود Azure مخصصًا — فالقيمة `openai.baseUrl` وحدها
لا تلتقط شكل API/المصادقة الخاص بـ Azure. يوجد مزود منفصل
`azure-openai-responses/*`؛ راجع
Accordion الخاصة بـ Server-side compaction أدناه.
</Note>

## إعداد متقدم

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket-first مع SSE fallback ‏(`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket المبكر مرة واحدة قبل الرجوع الاحتياطي إلى SSE
    - بعد الفشل، يضع علامة degraded على WebSocket لمدة ~60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات هوية مستقرة للجلسة والدور من أجل عمليات إعادة المحاولة وإعادة الاتصال
    - يوحّد عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، ثم SSE احتياطيًا |
    | `"sse"` | فرض SSE فقط |
    | `"websocket"` | فرض WebSocket فقط |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
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

    وثائق OpenAI ذات الصلة:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="التهيئة المسبقة لـ WebSocket">
    يفعّل OpenClaw التهيئة المسبقة لـ WebSocket افتراضيًا لكل من `openai/*` و`openai-codex/*` لتقليل كمون الدور الأول.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الوضع السريع">
    يعرّض OpenClaw مفتاح تبديل مشتركًا للوضع السريع لكل من `openai/*` و`openai-codex/*`:

    - **الدردشة/واجهة المستخدم:** `/fast status|on|off`
    - **الإعداد:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التفعيل، يربط OpenClaw الوضع السريع بمعالجة OpenAI ذات الأولوية (`service_tier = "priority"`). ويتم الحفاظ على قيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    تتغلب تجاوزات الجلسة على الإعداد. ويؤدي مسح تجاوز الجلسة في واجهة Sessions إلى إعادة الجلسة إلى الافتراضي المهيأ.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تعرض OpenAI API المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    القيم المدعومة: `auto`، و`default`، و`flex`، و`priority`.

    <Warning>
    لا يتم تمرير `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). وإذا قمت بتوجيه أي من المزوّدين عبر وكيل، فإن OpenClaw يترك `service_tier` كما هي.
    </Warning>

  </Accordion>

  <Accordion title="Compaction على جانب الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، فإن غلاف تدفق Pi-harness الخاص بـ Plugin ‏OpenAI يفعّل تلقائيًا Compaction على جانب الخادم:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`: ‏70% من `contextWindow` (أو `80000` عندما لا تكون متاحة)

    ينطبق هذا على مسار Pi harness المدمج وعلى Hooks مزوّد OpenAI المستخدمة في التشغيلات المضمّنة. أما Codex app-server harness الأصلية فتدير سياقها الخاص عبر Codex وتُضبط بشكل منفصل عبر `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="تفعيل صريح">
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
      <Tab title="عتبة مخصصة">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. ولا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يضبط التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الوكيلي الصارم">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

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
    - لم يعد يتعامل مع دور يحتوي على خطة فقط على أنه تقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور مع توجيه "تحرك الآن"
    - يفعّل تلقائيًا `update_plan` للأعمال الجوهرية
    - يعرض حالة تعثر صريحة إذا استمر النموذج في التخطيط من دون تنفيذ

    <Note>
    هذا مقيّد فقط بتشغيلات عائلة GPT-5 الخاصة بـ OpenAI وCodex. أما المزوّدون الآخرون وعائلات النماذج الأقدم فيحتفظون بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط النهاية المباشرة لـ OpenAI وCodex وAzure OpenAI بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، وAzure OpenAI):
    - تبقي `reasoning: { effort: "none" }` فقط للنماذج التي تدعم قيمة OpenAI `none`
    - تحذف reasoning المعطلة للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - تجعل مخططات الأدوات في الوضع الصارم افتراضيًا
    - ترفق ترويسات إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - تبقي تشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier`، و`store`، وتوافق reasoning، وتلميحات prompt-cache)

    **المسارات المتوافقة/عبر الوكلاء:**
    - تستخدم سلوك توافق أكثر مرونة
    - لا تفرض مخططات أدوات صارمة أو ترويسات أصلية فقط

    تستخدم Azure OpenAI النقل والسلوك التوافقيين الأصليين لكنها لا تتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
