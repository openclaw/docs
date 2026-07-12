---
read_when:
    - أنت تثبّت Plugin ‏diffs-language-pack أو تهيّئه أو تدقّق فيه
summary: يضيف تمييزًا نحويًا للغات غير المدرجة في المجموعة الافتراضية لعارض الفروقات.
title: Plugin حزمة لغة Diffs
x-i18n:
    generated_at: "2026-07-12T06:14:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin حزمة لغات Diffs

تضيف تمييز الصياغة للغات غير المضمّنة في المجموعة الافتراضية لعارض الفروقات.

## التوزيع

- الحزمة: `@openclaw/diffs-language-pack`
- مسار التثبيت: npm؛ ClawHub: `clawhub:@openclaw/diffs-language-pack`

## السطح

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## اللغات المضافة

يوفّر Plugin `diffs` الأساسي بالفعل تمييزًا للغات الشائعة الموثّقة في [الفروقات](/ar/tools/diffs). ثبّت حزمة اللغات هذه عندما تريد تمييز الصياغة لمجموعة أوسع من اللغات التي يدعمها Shiki. إذا لم تكن الحزمة مثبّتة، فستظل هذه الملفات تُعرض كنص عادي مقروء.

تشمل الأمثلة Astro وVue وSvelte وMDX وGraphQL وTerraform/HCL وNix وClojure وElixir وHaskell وOCaml وScala وZig وSolidity وVerilog/VHDL وFortran وMATLAB وLaTeX وMermaid وSass/Less/SCSS وNginx وApache وCSV وdotenv وINI وملفات الفروقات.

راجع [لغات Shiki](https://shiki.style/languages) للاطلاع على كتالوج Shiki الأساسي للغات والأسماء البديلة.

<!-- openclaw-plugin-reference:manual-end -->
