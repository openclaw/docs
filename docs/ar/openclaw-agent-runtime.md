---
read_when:
    - العمل على شيفرة وقت تشغيل وكيل OpenClaw أو اختباراته
    - تشغيل تدفقات فحص الشيفرة والتحقق من الأنواع والاختبار المباشر لوقت تشغيل الوكيل
summary: 'سير عمل المطور لبيئة تشغيل وكيل OpenClaw: البناء والاختبار والتحقق المباشر'
title: سير عمل وقت تشغيل وكيل OpenClaw
x-i18n:
    generated_at: "2026-07-16T14:24:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

سير عمل المطوّر لبيئة تشغيل الوكيل (`src/agents/`) في مستودع OpenClaw.

## التحقق من الأنواع والتدقيق

- بوابة التحقق المحلية الافتراضية: `pnpm check` (التحقق من الأنواع، والتدقيق، وضوابط السياسات)
- بوابة البناء: `pnpm build` عندما يمكن أن يؤثر التغيير في مخرجات البناء أو التحزيم أو حدود التحميل الكسول/الوحدات
- بوابة التحقق الكاملة قبل الدفع: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## تشغيل اختبارات بيئة تشغيل الوكيل

شغّل حزم اختبارات الوحدة لبيئة تشغيل الوكيل:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

يشمل نمط glob الأول أيضًا حزم `agent-tools*` و`agent-settings` و
`agent-tool-definition-adapter*`.

تُستبعد الاختبارات المباشرة من إعدادات اختبارات الوحدة؛ شغّلها عبر مغلّف
الاختبارات المباشرة (يضبط `OPENCLAW_LIVE_TEST=1` ويتطلب بيانات اعتماد المزوّد):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## الاختبار اليدوي

- شغّل Gateway في وضع التطوير (يتخطى اتصالات القنوات عبر `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- شغّل دورة وكيل واحدة عبر Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- استخدم TUI لتصحيح الأخطاء تفاعليًا: `pnpm tui`

لاختبار سلوك استدعاء الأدوات، اطلب إجراء `read` أو `exec` حتى تتمكن من مراقبة
تدفّق الأداة ومعالجة الحمولة.

## إعادة الضبط إلى حالة نظيفة

توجد الحالة في دليل حالة OpenClaw: `~/.openclaw` افتراضيًا، أو
`$OPENCLAW_STATE_DIR` عند تعيينه. المسارات التالية نسبية إلى ذلك الدليل:

| المسار                                         | المحتويات                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | الإعدادات                                                          |
| `state/openclaw.sqlite`                        | قاعدة بيانات حالة بيئة التشغيل المشتركة                           |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | ملفات تعريف مصادقة النموذج لكل وكيل (مفاتيح API + OAuth) وحالة بيئة التشغيل |
| `credentials/`                                 | بيانات اعتماد المزوّد/القناة خارج مخزن ملفات تعريف المصادقة       |
| `agents/<agentId>/sessions/`                   | سجل النصوص المنسوخة ومصادر ترحيل الجلسات القديمة                   |
| `sessions/`                                    | مخزن جلسات الوكيل الواحد القديم (عمليات التثبيت القديمة فقط)       |
| `workspace/`                                   | مساحة عمل الوكيل الافتراضي (تستخدم الوكلاء الإضافية `workspace-<agentId>`)   |

احذف هذه المسارات لإجراء إعادة ضبط كاملة. لإعادة ضبط أضيق نطاقًا:

- الجلسات فقط: لا تحذف `agents/<agentId>/agent/openclaw-agent.sqlite`؛ توجد صفوف الجلسات فيه إلى جانب حالة الوكيل الأخرى. استخدم `/new` أو `/reset` لبدء جلسة جديدة لمحادثة واحدة، و`openclaw sessions cleanup` لصيانة الجلسات.
- الاحتفاظ بالمصادقة: اترك `agents/<agentId>/agent/openclaw-agent.sqlite` و`credentials/` في موضعيهما.

لم تعد ملفات `auth-profiles.json` القديمة تُقرأ في وقت التشغيل؛
يستوردها `openclaw doctor --fix` إلى مخزن SQLite.

## المراجع

- [الاختبار](/ar/help/testing)
- [بدء الاستخدام](/ar/start/getting-started)

## ذو صلة

- [بنية بيئة تشغيل وكيل OpenClaw](/ar/agent-runtime-architecture)
