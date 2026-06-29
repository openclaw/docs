---
x-i18n:
    generated_at: "2026-06-28T22:31:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# दस्तावेज़ मार्गदर्शिका

यह निर्देशिका दस्तावेज़ लेखन, Mintlify लिंक नियमों, और दस्तावेज़ i18n नीति की मालिक है।

## Mintlify नियम

- दस्तावेज़ Mintlify (`https://docs.openclaw.ai`) पर होस्ट किए जाते हैं।
- `docs/**/*.md` में आंतरिक दस्तावेज़ लिंक root-relative रहने चाहिए, बिना `.md` या `.mdx` प्रत्यय के (उदाहरण: `[कॉन्फ़िगरेशन](/gateway/configuration)`)।
- सेक्शन क्रॉस-रेफ़रेंस में root-relative पाथ पर anchors का उपयोग होना चाहिए (उदाहरण: `[Hooks](/gateway/configuration-reference#hooks)`)।
- दस्तावेज़ शीर्षकों में em dashes और apostrophes से बचना चाहिए क्योंकि वहाँ Mintlify anchor जनरेशन नाज़ुक है।
- README और अन्य GitHub-रेंडर किए गए दस्तावेज़ों में पूर्ण दस्तावेज़ URL रखने चाहिए ताकि लिंक Mintlify के बाहर भी काम करें।
- दस्तावेज़ सामग्री सामान्य रहनी चाहिए: कोई निजी डिवाइस नाम, होस्टनाम, या लोकल पाथ नहीं; `user@gateway-host` जैसे placeholders का उपयोग करें।

## दस्तावेज़ सामग्री नियम

- दस्तावेज़ों, UI कॉपी, और picker सूचियों के लिए, सेवाओं/providers को वर्णमाला क्रम में रखें, जब तक कि सेक्शन स्पष्ट रूप से runtime क्रम या auto-detection क्रम का वर्णन न कर रहा हो।
- bundled plugin नामकरण को root `AGENTS.md` में repo-wide plugin शब्दावली नियमों के अनुरूप रखें।

## आंतरिक दस्तावेज़

- लंबे समय तक रहने वाले निजी ऑपरेटर दस्तावेज़ `~/Projects/manager/docs/` में होने चाहिए।
- repo-local आंतरिक scratch/mirror दस्तावेज़ ignored `docs/internal/` के अंतर्गत रह सकते हैं।
- कभी भी `docs/internal/**` पेजों को `docs/docs.json` navigation में न जोड़ें या उन्हें सार्वजनिक दस्तावेज़ों से लिंक न करें।
- यदि कोई पेज बाद में force-add किया जाता है, तो `scripts/docs-sync-publish.mjs` सार्वजनिक `openclaw/docs` publish repo से `docs/internal/**` को exclude और prune करता है।
- आंतरिक दस्तावेज़ repo paths, निजी app names, 1Password item names, और runbooks का उल्लेख कर सकते हैं, लेकिन कभी भी secret values शामिल न करें।

## Maturity Scorecard संपादन

`taxonomy.yaml` और `qa/maturity-scores.yaml` स्रोत inputs हैं; `docs/maturity/` के अंतर्गत generated maturity docs projections हैं और score, LTS, taxonomy, QA profile, या evidence tables के लिए हाथ से संपादित नहीं किए जाने चाहिए।
`scripts/qa/render-maturity-docs.ts` generation का मालिक है; committed docs को refresh करने के लिए `pnpm maturity:render` और उन्हें verify करने के लिए `pnpm maturity:check` का उपयोग करें।
`.github/workflows/maturity-scorecard.yml` artifact previews render करता है और generated-doc PRs खोल सकता है; `.github/workflows/openclaw-release-checks.yml` release QA के लिए इसे dispatch करता है।
deterministic `qa-evidence.json.scorecard` data को GitHub Actions artifacts में रखें, जब तक कोई maintainer स्पष्ट रूप से sanitized committed projection न मांगे।
मानवीय overrides को PR में source state बदलनी होगी और कारण के साथ सार्वजनिक या redacted evidence समझाना होगा।

## दस्तावेज़ i18n

- विदेशी-भाषा दस्तावेज़ इस repo में maintained नहीं हैं। generated publish output अलग `openclaw/docs` repo में रहता है (अक्सर locally `../openclaw-docs` के रूप में cloned)।
- यहाँ `docs/<locale>/**` के अंतर्गत localized docs न जोड़ें या संपादित न करें।
- इस repo के English docs और glossary files को source of truth मानें।
- Pipeline: यहाँ English docs update करें, ज़रूरत के अनुसार `docs/.i18n/glossary.<locale>.json` update करें, फिर publish-repo sync और `scripts/docs-i18n` को `openclaw/docs` में run होने दें।
- `scripts/docs-i18n` फिर से run करने से पहले, किसी भी नए technical terms, page titles, या short nav labels के लिए glossary entries जोड़ें जिन्हें English में रहना है या fixed translation का उपयोग करना है।
- `pnpm docs:check-i18n-glossary` बदले हुए English doc titles और short internal doc labels के लिए guard है।
- Translation memory publish repo में generated `docs/.i18n/*.tm.jsonl` files में रहती है।
- `docs/.i18n/README.md` देखें।
