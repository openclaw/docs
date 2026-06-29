---
read_when:
    - आप diffs-language-pack Plugin को इंस्टॉल, कॉन्फ़िगर, या ऑडिट कर रहे हैं
summary: डिफ़ॉल्ट डिफ़्स व्यूअर सेट के बाहर की भाषाओं के लिए सिंटैक्स हाइलाइटिंग जोड़ता है।
title: Diffs भाषा पैक Plugin
x-i18n:
    generated_at: "2026-06-28T23:43:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs भाषा पैक Plugin

डिफ़ॉल्ट diffs व्यूअर सेट से बाहर की भाषाओं के लिए सिंटैक्स हाइलाइटिंग जोड़ता है।

## वितरण

- पैकेज: `@openclaw/diffs-language-pack`
- इंस्टॉल मार्ग: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## सतह

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## जोड़ी गई भाषाएँ

बेस `diffs` Plugin पहले से ही [Diffs](/hi/tools/diffs) में दस्तावेज़ित सामान्य भाषाओं को हाइलाइट करता है। जब आप Shiki-समर्थित भाषाओं के अधिक व्यापक सेट के लिए सिंटैक्स हाइलाइटिंग चाहते हैं, तो यह भाषा पैक इंस्टॉल करें। यदि पैक इंस्टॉल नहीं है, तब भी वे फ़ाइलें पढ़ने योग्य सादे टेक्स्ट के रूप में रेंडर होती हैं।

उदाहरणों में Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, और diff फ़ाइलें शामिल हैं।

Shiki की अपस्ट्रीम भाषा और उपनाम कैटलॉग के लिए [Shiki भाषाएँ](https://shiki.style/languages) देखें।

<!-- openclaw-plugin-reference:manual-end -->
