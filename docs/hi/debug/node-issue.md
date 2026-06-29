---
read_when:
    - केवल Node वाली डेवलपमेंट स्क्रिप्ट या वॉच मोड विफलताओं की डीबगिंग
    - OpenClaw में tsx/esbuild लोडर क्रैश की जाँच
summary: Node + tsx "__name is not a function" क्रैश नोट्स और समाधान
title: Node + tsx क्रैश
x-i18n:
    generated_at: "2026-06-28T23:04:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx "\_\_name is not a function" क्रैश

## सारांश

`tsx` के साथ Node के जरिए OpenClaw चलाने पर startup में यह विफल होता है:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

यह dev scripts को Bun से `tsx` पर स्विच करने के बाद शुरू हुआ (commit `2871657e`, 2026-01-06)। वही runtime path Bun के साथ काम करता था।

## Environment

- Node: v25.x (v25.3.0 पर देखा गया)
- tsx: 4.21.0
- OS: macOS (repro संभवतः Node 25 चलाने वाले अन्य platforms पर भी)

## Repro (केवल Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## repo में न्यूनतम repro

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node version check

- Node 25.3.0: विफल
- Node 22.22.0 (Homebrew `node@22`): विफल
- Node 24: अभी यहां installed नहीं है; verification चाहिए

## Notes / hypothesis

- `tsx`, TS/ESM को transform करने के लिए esbuild का उपयोग करता है। esbuild का `keepNames` एक `__name` helper emit करता है और function definitions को `__name(...)` से wrap करता है।
- क्रैश दिखाता है कि runtime पर `__name` मौजूद है लेकिन function नहीं है, जिसका अर्थ है कि इस module के लिए Node 25 loader path में helper missing या overwritten है।
- इसी तरह की `__name` helper समस्याएं अन्य esbuild consumers में report हुई हैं, जब helper missing या rewritten होता है।

## Regression history

- `2871657e` (2026-01-06): Bun को optional बनाने के लिए scripts को Bun से tsx में बदला गया।
- उससे पहले (Bun path), `openclaw status` और `gateway:watch` काम करते थे।

## Workarounds

- dev scripts के लिए Bun का उपयोग करें (मौजूदा temporary revert)।
- repo type checking के लिए `tsgo` का उपयोग करें, फिर built output चलाएं:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- ऐतिहासिक नोट: इस Node/tsx issue को debug करते समय यहां `tsc` इस्तेमाल किया गया था, लेकिन repo type-check lanes अब `tsgo` का उपयोग करते हैं।
- संभव हो तो TS loader में esbuild keepNames disable करें (`__name` helper insertion रोकता है); tsx वर्तमान में इसे expose नहीं करता।
- यह देखने के लिए Node LTS (22/24) को `tsx` के साथ test करें कि issue Node 25-specific है या नहीं।

## References

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Next steps

- Node 25 regression की पुष्टि करने के लिए Node 22/24 पर repro करें।
- यदि कोई known regression मौजूद है, तो `tsx` nightly test करें या earlier version पर pin करें।
- यदि Node LTS पर reproduce होता है, तो `__name` stack trace के साथ upstream में minimal repro file करें।

## Related

- [Node.js install](/hi/install/node)
- [Gateway troubleshooting](/hi/gateway/troubleshooting)
