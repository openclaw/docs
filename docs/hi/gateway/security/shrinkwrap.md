---
read_when:
    - आप जानना चाहते हैं कि OpenClaw रिलीज़ में npm shrinkwrap का क्या अर्थ है
    - आप package lockfiles, dependency बदलावों या supply-chain जोखिम की समीक्षा कर रहे हैं
    - आप प्रकाशित करने से पहले रूट या Plugin npm पैकेजों को सत्यापित कर रहे हैं
summary: OpenClaw रिलीज़ में npm shrinkwrap की सरल अंग्रेज़ी और तकनीकी व्याख्या
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-28T23:14:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw स्रोत checkouts `pnpm-lock.yaml` का उपयोग करते हैं। प्रकाशित OpenClaw npm
पैकेज `npm-shrinkwrap.json`, npm की publishable dependency lockfile, का उपयोग करते हैं, ताकि
पैकेज इंस्टॉल रिलीज़ के दौरान समीक्षा किए गए dependency graph का उपयोग करें।

## आसान संस्करण

Shrinkwrap उस dependency tree की रसीद है जो npm पैकेज के साथ शिप होती है।
यह npm को बताता है कि कौन से सटीक transitive package versions इंस्टॉल करने हैं।

OpenClaw रिलीज़ के लिए, इसका मतलब है:

- प्रकाशित पैकेज इंस्टॉल समय पर npm से नया dependency graph बनाने को नहीं कहता;
- dependency बदलावों की समीक्षा आसान हो जाती है क्योंकि वे lockfile में दिखाई देते हैं;
- रिलीज़ सत्यापन उसी graph का परीक्षण कर सकता है जिसे उपयोगकर्ता इंस्टॉल करेंगे;
- प्रकाशित करने से पहले package-size या native-dependency आश्चर्य पहचानना आसान होता है।

Shrinkwrap sandbox नहीं है। यह किसी dependency को अपने आप सुरक्षित नहीं बनाता, और
यह host isolation, `openclaw security audit`, package
provenance, या install smoke tests की जगह नहीं लेता।

संक्षिप्त मानसिक मॉडल:

| फ़ाइल                  | जहाँ यह मायने रखती है         | इसका अर्थ                     |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw स्रोत checkout | Maintainer dependency graph       |
| `npm-shrinkwrap.json` | प्रकाशित npm पैकेज    | उपयोगकर्ताओं के लिए npm install graph       |
| `package-lock.json`   | स्थानीय npm ऐप्स           | OpenClaw publish contract नहीं |

## OpenClaw इसका उपयोग क्यों करता है

OpenClaw एक Gateway, Plugin host, model router, और agent runtime है। एक default
install startup time, disk use, native package downloads, और
supply-chain exposure को प्रभावित कर सकता है।

Shrinkwrap रिलीज़ समीक्षा को एक स्थिर सीमा देता है:

- reviewers transitive dependency movement देख सकते हैं;
- package validators अनपेक्षित lockfile drift को अस्वीकार कर सकते हैं;
- package acceptance उस graph के साथ installs का परीक्षण कर सकता है जो शिप होगा;
- plugin packages root package पर plugin-only dependencies का स्वामित्व रखने के बजाय
  अपना locked dependency graph साथ ले जा सकते हैं।

लक्ष्य "अधिक lockfiles" नहीं है। लक्ष्य स्पष्ट स्वामित्व के साथ reproducible release installs
है।

## तकनीकी विवरण

root `openclaw` npm package और OpenClaw-स्वामित्व वाले npm plugin packages प्रकाशित होते समय
`npm-shrinkwrap.json` शामिल करते हैं। उपयुक्त OpenClaw-स्वामित्व वाले plugin
packages स्पष्ट `bundledDependencies` के साथ भी प्रकाशित हो सकते हैं, ताकि उनकी runtime
dependency files install-time resolution पर ही निर्भर रहने के बजाय plugin tarball में साथ लाई जाएँ।

सीमा को इस तरह बनाए रखें:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

generator npm का publishable lock format resolve करता है, लेकिन उन generated
package versions को अस्वीकार करता है जो पहले से `pnpm-lock.yaml` में मौजूद नहीं हैं। इससे
pnpm dependency age, override, और patch-review boundary अक्षुण्ण रहती है।

root package को plugin packages छुए बिना जानबूझकर refresh करते समय ही root-only commands का उपयोग करें:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

इन फ़ाइलों की समीक्षा security-sensitive मानकर करें:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- bundled plugin dependency payloads
- कोई भी `package-lock.json` diff

OpenClaw package validators नए root package tarballs में shrinkwrap आवश्यक करते हैं।
plugin npm publish path plugin-local shrinkwrap जाँचता है, package-local bundled dependencies
इंस्टॉल करता है, और फिर pack या publish करता है। Package
validators प्रकाशित OpenClaw packages के लिए `package-lock.json` को अस्वीकार करते हैं।

प्रकाशित root package का निरीक्षण करने के लिए:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

OpenClaw-स्वामित्व वाले plugin package का निरीक्षण करने के लिए:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

पृष्ठभूमि: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
