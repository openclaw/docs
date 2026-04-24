---
read_when:
    - تريد استخدام Volcano Engine أو نماذج Doubao مع OpenClaw
    - تحتاج إلى إعداد مفتاح Volcengine API】【”】【analysis to=commentary.multi_tool_use.parallel  qq彩票_json {"tool_uses":[{"recipient_name":"functions.bash","parameters":{"command":"rg -n \"Volcano Engine setup|Doubao models|Volcengine|Doubao\" -S .. -g '!node_modules'","timeout":10}},{"recipient_name":"functions.read","parameters":{"path":"docs/AGENTS.md","offset":1,"limit":120}}]}
summary: إعداد Volcano Engine ‏(نماذج Doubao، ونقاط النهاية العامة ونقاط نهاية البرمجة)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-24T08:01:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

يوفّر مزوّد Volcengine وصولًا إلى نماذج Doubao ونماذج الجهات الخارجية
المستضافة على Volcano Engine، مع نقاط نهاية منفصلة لأحمال العمل العامة وأحمال
البرمجة.

| التفصيل  | القيمة                                                |
| -------- | ----------------------------------------------------- |
| المزوّدون | `volcengine` ‏(عام) + `volcengine-plan` ‏(برمجة)      |
| المصادقة | `VOLCANO_ENGINE_API_KEY`                              |
| API      | متوافقة مع OpenAI                                     |

## البدء

<Steps>
  <Step title="اضبط مفتاح API">
    شغّل onboarding التفاعلي:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    يؤدي ذلك إلى تسجيل مزوّدَي العام (`volcengine`) والبرمجة (`volcengine-plan`) من مفتاح API واحد.

  </Step>
  <Step title="اضبط نموذجًا افتراضيًا">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="تحقّق من توفر النموذج">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
بالنسبة إلى الإعداد غير التفاعلي (CI، والسكربتات)، مرّر المفتاح مباشرةً:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## المزوّدون ونقاط النهاية

| المزوّد            | نقطة النهاية                              | حالة الاستخدام   |
| ------------------ | ----------------------------------------- | ---------------- |
| `volcengine`       | `ark.cn-beijing.volces.com/api/v3`        | النماذج العامة   |
| `volcengine-plan`  | `ark.cn-beijing.volces.com/api/coding/v3` | نماذج البرمجة    |

<Note>
يتم تكوين كلا المزوّدين من مفتاح API واحد. ويقوم الإعداد بتسجيل كليهما تلقائيًا.
</Note>

## الفهرس المدمج

<Tabs>
  <Tab title="العام (volcengine)">
    | مرجع النموذج                                   | الاسم                            | الإدخال      | السياق  |
    | --------------------------------------------- | -------------------------------- | ------------ | ------- |
    | `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                  | text, image  | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028  | text, image  | 256,000 |
    | `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                        | text, image  | 256,000 |
    | `volcengine/glm-4-7-251222`                   | GLM 4.7                          | text, image  | 200,000 |
    | `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                    | text, image  | 128,000 |
  </Tab>
  <Tab title="البرمجة (volcengine-plan)">
    | مرجع النموذج                                        | الاسم                     | الإدخال | السياق  |
    | -------------------------------------------------- | ------------------------ | ------- | ------- |
    | `volcengine-plan/ark-code-latest`                  | Ark Coding Plan          | text    | 256,000 |
    | `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code         | text    | 256,000 |
    | `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding           | text    | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking         | text    | 256,000 |
    | `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding         | text    | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview | text    | 256,000 |
  </Tab>
</Tabs>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="النموذج الافتراضي بعد onboarding">
    يضبط `openclaw onboard --auth-choice volcengine-api-key` حاليًا
    `volcengine-plan/ark-code-latest` كنموذج افتراضي، مع تسجيل
    الفهرس العام `volcengine` أيضًا.
  </Accordion>

  <Accordion title="سلوك الاحتياط في محدد النماذج">
    أثناء اختيار النموذج في onboarding/configure، يفضّل خيار مصادقة Volcengine
    كلاً من الصفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن تلك النماذج
    محمّلة بعد، يعود OpenClaw إلى الفهرس غير المصفّى بدلًا من إظهار
    محدد فارغ ضمن نطاق المزوّد.
  </Accordion>

  <Accordion title="متغيرات البيئة لعمليات daemon">
    إذا كان Gateway يعمل كـ daemon ‏(launchd/systemd)، فتأكد من أن
    `VOLCANO_ENGINE_API_KEY` متاح لتلك العملية (على سبيل المثال في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
عند تشغيل OpenClaw كخدمة في الخلفية، لا يتم وراثة متغيرات البيئة المضبوطة في
shell التفاعلية الخاصة بك تلقائيًا. راجع ملاحظة daemon أعلاه.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الاحتياط.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration" icon="gear">
    مرجع التكوين الكامل للوكلاء، والنماذج، والمزوّدين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات التصحيح.
  </Card>
  <Card title="الأسئلة الشائعة" href="/ar/help/faq" icon="circle-question">
    الأسئلة الشائعة حول إعداد OpenClaw.
  </Card>
</CardGroup>
