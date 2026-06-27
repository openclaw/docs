---
read_when:
    - العمل على كود أو اختبارات وقت تشغيل وكيل OpenClaw
    - تشغيل تدفقات فحص lint وtypecheck والاختبار الحي لـ agent-runtime
summary: 'سير عمل المطوّر لوقت تشغيل وكيل OpenClaw: البناء والاختبار والتحقق المباشر'
title: سير عمل وقت تشغيل وكيل OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:55:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

مسار عمل سليم للعمل على وقت تشغيل وكيل OpenClaw في OpenClaw.

## فحص الأنواع والتدقيق

- بوابة التحقق المحلية الافتراضية: `pnpm check`
- بوابة البناء: `pnpm build` عندما يمكن أن يؤثر التغيير في مخرجات البناء أو التحزيم أو حدود التحميل الكسول/الوحدات
- بوابة الهبوط الكاملة لتغييرات وقت تشغيل الوكيل: `pnpm check && pnpm test`

## تشغيل اختبارات وقت تشغيل الوكيل

شغّل مجموعة اختبارات وقت تشغيل الوكيل مباشرةً باستخدام Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

لتضمين تمرين المزوّد الحي:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

يغطي هذا مجموعات اختبارات الوحدات الرئيسية لوقت تشغيل الوكيل:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## الاختبار اليدوي

المسار الموصى به:

- شغّل Gateway في وضع التطوير:
  - `pnpm gateway:dev`
- شغّل الوكيل مباشرةً:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- استخدم TUI لتصحيح الأخطاء تفاعليًا:
  - `pnpm tui`

بالنسبة إلى سلوك استدعاء الأدوات، اطلب إجراء `read` أو `exec` حتى تتمكن من رؤية بث الأدوات ومعالجة الحمولة.

## إعادة تعيين نظيفة

توجد الحالة ضمن دليل حالة OpenClaw. الافتراضي هو `~/.openclaw`. إذا كان `OPENCLAW_STATE_DIR` مضبوطًا، فاستخدم ذلك الدليل بدلاً من ذلك.

لإعادة تعيين كل شيء:

- `openclaw.json` للتكوين
- `agents/<agentId>/agent/auth-profiles.json` لملفات تعريف مصادقة النموذج (مفاتيح API + OAuth)
- `credentials/` لحالة المزوّد/القناة التي لا تزال موجودة خارج مخزن ملف تعريف المصادقة
- `agents/<agentId>/sessions/` لسجل جلسات الوكيل
- `agents/<agentId>/sessions/sessions.json` لفهرس الجلسات
- `sessions/` إذا كانت المسارات القديمة موجودة
- `workspace/` إذا كنت تريد مساحة عمل فارغة

إذا كنت تريد فقط إعادة تعيين الجلسات، فاحذف `agents/<agentId>/sessions/` لذلك الوكيل. إذا كنت تريد الاحتفاظ بالمصادقة، فاترك `agents/<agentId>/agent/auth-profiles.json` وأي حالة مزوّد ضمن `credentials/` في مكانها.

## المراجع

- [الاختبار](/ar/help/testing)
- [بدء الاستخدام](/ar/start/getting-started)

## ذات صلة

- [بنية وقت تشغيل وكيل OpenClaw](/ar/agent-runtime-architecture)
