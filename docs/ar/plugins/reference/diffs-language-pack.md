---
read_when:
    - أنت تثبّت Plugin حزمة اللغة للفروقات أو تهيّئه أو تراجعه.
summary: يضيف تمييزًا للصياغة للغات خارج مجموعة عارض الفروقات الافتراضي.
title: Plugin حزمة لغة الفروقات
x-i18n:
    generated_at: "2026-06-27T18:11:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin حزمة لغات Diffs

يضيف تمييز الصياغة للغات خارج مجموعة عارض الفروقات الافتراضية.

## التوزيع

- الحزمة: `@openclaw/diffs-language-pack`
- مسار التثبيت: npm؛ ClawHub: `clawhub:@openclaw/diffs-language-pack`

## السطح

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## اللغات المضافة

يوفر Plugin الأساسي `diffs` بالفعل تمييزًا للغات الشائعة الموثقة في [Diffs](/ar/tools/diffs). ثبّت حزمة اللغات هذه عندما تريد تمييز الصياغة لمجموعة أوسع من اللغات التي يدعمها Shiki. إذا لم تكن الحزمة مثبتة، فستظل هذه الملفات تُعرض كنص عادي قابل للقراءة.

تشمل الأمثلة Astro وVue وSvelte وMDX وGraphQL وTerraform/HCL وNix وClojure وElixir وHaskell وOCaml وScala وZig وSolidity وVerilog/VHDL وFortran وMATLAB وLaTeX وMermaid وSass/Less/SCSS وNginx وApache وCSV وdotenv وINI وملفات diff.

راجع [لغات Shiki](https://shiki.style/languages) للاطلاع على كتالوج اللغات والأسماء البديلة upstream الخاص بـ Shiki.

<!-- openclaw-plugin-reference:manual-end -->
