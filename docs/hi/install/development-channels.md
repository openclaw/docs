---
read_when:
    - आप stable/beta/dev के बीच स्विच करना चाहते हैं
    - आप किसी विशिष्ट संस्करण, टैग या SHA को पिन करना चाहते हैं
    - आप पूर्व-रिलीज़ को टैग या प्रकाशित कर रहे हैं
sidebarTitle: Release Channels
summary: 'स्थिर, बीटा और dev चैनल: अर्थ, स्विचिंग, पिनिंग और टैगिंग'
title: रिलीज़ चैनल
x-i18n:
    generated_at: "2026-06-28T23:19:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw तीन अपडेट चैनल शिप करता है:

- **stable**: npm dist-tag `latest`। अधिकांश उपयोगकर्ताओं के लिए अनुशंसित।
- **beta**: npm dist-tag `beta` जब यह वर्तमान हो; यदि beta अनुपलब्ध है या
  नवीनतम stable रिलीज़ से पुराना है, तो अपडेट फ्लो `latest` पर वापस चला जाता है।
- **dev**: `main` (git) का गतिशील हेड। npm dist-tag: `dev` (प्रकाशित होने पर)।
  `main` ब्रांच प्रयोग और सक्रिय विकास के लिए है। इसमें
  अधूरी सुविधाएँ या ब्रेकिंग बदलाव हो सकते हैं। इसे उत्पादन gateways के लिए उपयोग न करें।

हम आमतौर पर stable builds को पहले **beta** में शिप करते हैं, वहाँ उनका परीक्षण करते हैं, फिर एक
स्पष्ट promotion चरण चलाते हैं जो सत्यापित build को संस्करण संख्या बदले बिना
`latest` पर ले जाता है। Maintainers ज़रूरत पड़ने पर stable रिलीज़ को
सीधे `latest` पर भी प्रकाशित कर सकते हैं। npm installs के लिए dist-tags ही सत्य का स्रोत हैं।

## चैनल बदलना

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` आपकी पसंद को config (`update.channel`) में बनाए रखता है और
install method को संरेखित करता है:

- **`stable`** (package installs): npm dist-tag `latest` के माध्यम से अपडेट होता है।
- **`beta`** (package installs): npm dist-tag `beta` को प्राथमिकता देता है, लेकिन
  जब `beta` अनुपलब्ध हो या वर्तमान stable tag से पुराना हो, तो `latest` पर वापस जाता है।
- **`stable`** (git installs): नवीनतम stable git tag को checkout करता है, और
  `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` जैसे semver prerelease tags
  तथा अन्य prerelease suffixes को बाहर रखता है।
- **`beta`** (git installs): नवीनतम beta git tag को प्राथमिकता देता है, लेकिन beta अनुपलब्ध या पुराना होने पर
  नवीनतम stable git tag पर वापस जाता है।
- **`dev`**: git checkout सुनिश्चित करता है (डिफ़ॉल्ट `~/openclaw`, या
  `OPENCLAW_HOME` सेट होने पर `$OPENCLAW_HOME/openclaw`; `OPENCLAW_GIT_DIR` से
  override करें), `main` पर स्विच करता है, upstream पर rebase करता है, build करता है, और
  उस checkout से global CLI install करता है।

<Tip>
यदि आप stable और dev को समानांतर रखना चाहते हैं, तो दो clones रखें और अपने gateway को stable वाले पर इंगित करें।
</Tip>

## One-off संस्करण या tag targeting

एकल अपडेट के लिए किसी विशिष्ट dist-tag, version, या package spec को target करने के लिए `--tag` का उपयोग करें,
**बिना** अपने persisted channel को बदले:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

नोट्स:

- `--tag` केवल **package (npm) installs** पर लागू होता है। Git installs इसे अनदेखा करते हैं।
- tag persist नहीं किया जाता। आपका अगला `openclaw update` सामान्य रूप से आपके configured
  channel का उपयोग करता है।
- package installs के लिए, OpenClaw staged npm install से पहले GitHub/git source specs को
  एक temporary tarball में pre-pack करता है। जब आप moving `main`
  checkout को अपना persistent install बनाना चाहते हैं, तो `--channel dev` या
  `--install-method git --version main` का उपयोग करें।
- Downgrade protection: यदि target version आपके वर्तमान version से पुराना है,
  OpenClaw पुष्टि के लिए prompt करता है (`--yes` से skip करें)।
- `--channel beta`, `--tag beta` से अलग है: channel flow beta अनुपलब्ध या पुराना होने पर
  stable/latest पर वापस जा सकता है, जबकि `--tag beta` उस एक run के लिए
  raw `beta` dist-tag को target करता है।

## Dry run

बदलाव किए बिना preview करें कि `openclaw update` क्या करेगा:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run प्रभावी channel, target version, planned actions, और
downgrade confirmation की आवश्यकता होगी या नहीं दिखाता है।

## Plugins और channels

जब आप `openclaw update` के साथ channels बदलते हैं, OpenClaw plugin
sources को भी sync करता है:

- `dev` git checkout से bundled plugins को प्राथमिकता देता है।
- `stable` और `beta` npm-installed plugin packages को restore करते हैं।
- npm-installed plugins core update पूरा होने के बाद update किए जाते हैं।

## वर्तमान स्थिति जाँचना

```bash
openclaw update status
```

active channel, install kind (git या package), current version, और
source (config, git tag, git branch, या default) दिखाता है।

## Tagging best practices

- उन releases को tag करें जिन पर आप git checkouts को land कराना चाहते हैं (`vYYYY.M.PATCH` stable के लिए,
  `vYYYY.M.PATCH-beta.N` beta के लिए; `-alpha.N`, `-rc.N`, और `-next.N` जैसे named semver prerelease suffixes
  stable targets नहीं हैं)।
- `vYYYY.M.PATCH-1` और `v1.0.1-1` जैसे legacy numeric stable tags अभी भी
  compatibility के लिए stable git tags के रूप में पहचाने जाते हैं।
- `vYYYY.M.PATCH.beta.N` भी compatibility के लिए पहचाना जाता है, लेकिन `-beta.N` को प्राथमिकता दें।
- tags को immutable रखें: कभी भी किसी tag को move या reuse न करें।
- npm dist-tags npm installs के लिए सत्य का स्रोत बने रहते हैं:
  - `latest` -> stable
  - `beta` -> candidate build या beta-first stable build
  - `dev` -> main snapshot (वैकल्पिक)

## macOS app availability

Beta और dev builds में macOS app release **नहीं** हो सकती। यह ठीक है:

- git tag और npm dist-tag फिर भी प्रकाशित किए जा सकते हैं।
- release notes या changelog में "no macOS build for this beta" का उल्लेख करें।

## संबंधित

- [अपडेट करना](/hi/install/updating)
- [Installer internals](/hi/install/installer)
