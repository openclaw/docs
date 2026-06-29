---
read_when:
    - सार्वजनिक रिलीज़ चैनल परिभाषाएँ खोजी जा रही हैं
    - रिलीज़ सत्यापन या पैकेज स्वीकृति चलाना
    - संस्करण नामकरण और आवृत्ति की तलाश
summary: रिलीज़ लेन, ऑपरेटर चेकलिस्ट, सत्यापन बॉक्स, संस्करण नामकरण, और कैडेंस
title: रिलीज़ नीति
x-i18n:
    generated_at: "2026-06-29T00:05:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw की तीन सार्वजनिक रिलीज़ लेन हैं:

- स्थिर: टैग की गई रिलीज़ जो डिफ़ॉल्ट रूप से npm `beta` पर प्रकाशित होती हैं, या स्पष्ट रूप से अनुरोध किए जाने पर npm `latest` पर
- बीटा: प्रीरिलीज़ टैग जो npm `beta` पर प्रकाशित होते हैं
- डेव: `main` का चलता हुआ हेड

## संस्करण नामकरण

- स्थिर रिलीज़ संस्करण: `YYYY.M.PATCH`
  - Git टैग: `vYYYY.M.PATCH`
- स्थिर सुधार रिलीज़ संस्करण: `YYYY.M.PATCH-N`
  - Git टैग: `vYYYY.M.PATCH-N`
- बीटा प्रीरिलीज़ संस्करण: `YYYY.M.PATCH-beta.N`
  - Git टैग: `vYYYY.M.PATCH-beta.N`
- महीने या पैच को शून्य से पैड न करें
- जून 2026 रिलीज़ प्रक्रिया अपडेट से शुरू करते हुए, तीसरा घटक एक
  क्रमिक मासिक रिलीज़-ट्रेन संख्या है, कैलेंडर दिन नहीं। स्थिर और बीटा
  रिलीज़ वर्तमान ट्रेन तय करती हैं; केवल-अल्फा टैग बीटा/स्थिर पैच संख्या
  का उपयोग या उसे आगे नहीं बढ़ाते। अपडेट से पहले के टैग और npm संस्करण
  अपने मौजूदा नाम रखते हैं और मान्य रहते हैं; रिलीज़ ऑटोमेशन उन्हें
  वर्ष, महीना, पैच, चैनल, और प्रीरिलीज़ या सुधार संख्या के आधार पर
  तुलना करना जारी रखता है।
- अल्फा/नाइटली बिल्ड अगली अप्रकाशित पैच ट्रेन का उपयोग करते हैं और बार-बार
  बिल्ड के लिए केवल `alpha.N` बढ़ाते हैं। जब उस पैच का बीटा आ जाता है, तो
  नए अल्फा बिल्ड अगले पैच पर चले जाते हैं। बीटा या स्थिर ट्रेन चुनते समय
  अधिक पैच संख्याओं वाले विरासती केवल-अल्फा टैग को अनदेखा करें।
- npm संस्करण अपरिवर्तनीय होते हैं। यदि कोई बीटा टैग पहले ही प्रकाशित हो
  चुका है, तो उसे हटाएँ, दोबारा प्रकाशित करें, या फिर से उपयोग न करें; अगली
  बीटा संख्या या अगला मासिक पैच काटें। क्योंकि `2026.6.5-beta.1` संक्रमण के
  दौरान पहले ही प्रकाशित हो चुका था, जून 2026 रिलीज़ ट्रेनों को पैच `5` या
  उससे अधिक उपयोग करना होगा। नए जून 2026 स्थिर या बीटा ट्रेनों को
  `2026.6.2`, `2026.6.3`, या `2026.6.4` के रूप में प्रकाशित न करें।
- स्थिर `2026.6.5` के बाद, अगली नई बीटा ट्रेन `2026.6.6-beta.1` है, भले ही
  अधिक पैच संख्याओं वाले स्वचालित केवल-अल्फा टैग पहले से मौजूद हों।
- `latest` का अर्थ वर्तमान प्रमोट की गई स्थिर npm रिलीज़ है
- `beta` का अर्थ वर्तमान बीटा इंस्टॉल लक्ष्य है
- स्थिर और स्थिर सुधार रिलीज़ डिफ़ॉल्ट रूप से npm `beta` पर प्रकाशित होती हैं; रिलीज़ ऑपरेटर स्पष्ट रूप से `latest` लक्ष्य कर सकते हैं, या बाद में जाँचे हुए बीटा बिल्ड को प्रमोट कर सकते हैं
- हर स्थिर OpenClaw रिलीज़ npm पैकेज, macOS ऐप, और हस्ताक्षरित
  Windows Hub इंस्टॉलर साथ में शिप करती है; बीटा रिलीज़ सामान्यतः पहले
  npm/पैकेज पथ को मान्य और प्रकाशित करती हैं, और नेटिव ऐप build/sign/notarize/promote
  स्थिर के लिए आरक्षित रहता है जब तक स्पष्ट रूप से अनुरोध न किया जाए

## रिलीज़ ताल

- रिलीज़ पहले बीटा में जाती हैं
- स्थिर केवल नवीनतम बीटा के मान्य होने के बाद आती है
- मेंटेनर सामान्यतः वर्तमान `main` से बनाई गई `release/YYYY.M.PATCH` शाखा से
  रिलीज़ काटते हैं, ताकि रिलीज़ सत्यापन और सुधार `main` पर नए विकास को
  ब्लॉक न करें
- यदि कोई बीटा टैग पुश या प्रकाशित हो चुका है और उसे सुधार चाहिए, तो मेंटेनर
  पुराने बीटा टैग को हटाने या फिर से बनाने के बजाय अगला `-beta.N` टैग काटते हैं
- विस्तृत रिलीज़ प्रक्रिया, अनुमोदन, क्रेडेंशियल, और रिकवरी नोट्स
  केवल मेंटेनर के लिए हैं

## रिलीज़ ऑपरेटर चेकलिस्ट

यह चेकलिस्ट रिलीज़ प्रवाह का सार्वजनिक रूप है। निजी क्रेडेंशियल,
साइनिंग, नोटराइज़ेशन, dist-tag रिकवरी, और आपातकालीन रोलबैक विवरण
केवल मेंटेनर रिलीज़ रनबुक में रहते हैं।

1. वर्तमान `main` से शुरू करें: नवीनतम पुल करें, पुष्टि करें कि लक्ष्य कमिट पुश है,
   और पुष्टि करें कि वर्तमान `main` CI इससे शाखा बनाने के लिए पर्याप्त हरा है।
2. अंतिम पहुँच योग्य रिलीज़ टैग के बाद से मर्ज किए गए PR और सभी सीधे
   कमिट से शीर्ष `CHANGELOG.md` अनुभाग जनरेट करें। प्रविष्टियों को उपयोगकर्ता-केंद्रित रखें,
   ओवरलैप करती PR/सीधे-कमिट प्रविष्टियों को डीडुप करें, पुनर्लेखन कमिट करें, उसे पुश करें,
   और शाखा बनाने से पहले एक बार फिर rebase/pull करें।
3. रिलीज़ संगतता रिकॉर्ड की समीक्षा करें
   `src/plugins/compat/registry.ts` और
   `src/commands/doctor/shared/deprecation-compat.ts` में। समाप्त हो चुकी
   संगतता केवल तब हटाएँ जब अपग्रेड पथ कवर रहे, या दर्ज करें कि उसे
   जानबूझकर क्यों रखा गया है।
4. वर्तमान `main` से `release/YYYY.M.PATCH` बनाएँ; सामान्य रिलीज़ कार्य
   सीधे `main` पर न करें।
5. इच्छित टैग के लिए हर आवश्यक संस्करण स्थान बढ़ाएँ, फिर
   `pnpm release:prep` चलाएँ। यह Plugin संस्करणों, Plugin इन्वेंटरी, कॉन्फ़िग
   स्कीमा, बंडल चैनल कॉन्फ़िग मेटाडेटा, कॉन्फ़िग डॉक्स बेसलाइन, Plugin SDK
   एक्सपोर्ट, और Plugin SDK API बेसलाइन को सही क्रम में रिफ्रेश करता है।
   टैग करने से पहले कोई भी जनरेटेड drift कमिट करें। फिर स्थानीय निर्धारक प्रीफ्लाइट चलाएँ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, और `pnpm release:check`।
6. `OpenClaw NPM Release` को `preflight_only=true` के साथ चलाएँ। टैग मौजूद होने से पहले,
   सत्यापन-केवल प्रीफ्लाइट के लिए पूरा 40-अक्षर रिलीज़-शाखा SHA अनुमत है।
   प्रीफ्लाइट सटीक चेक-आउट किए गए dependency graph के लिए dependency रिलीज़ evidence
   जनरेट करता है और उसे npm प्रीफ्लाइट artifact में संग्रहीत करता है।
   सफल `preflight_run_id` सहेजें।
7. रिलीज़ शाखा, टैग, या पूर्ण कमिट SHA के लिए `Full Release Validation` के साथ
   सभी प्री-रिलीज़ टेस्ट शुरू करें। यह चार बड़े रिलीज़ टेस्ट बॉक्स के लिए
   एकमात्र मैनुअल एंट्रीपॉइंट है: Vitest, Docker, QA Lab, और Package।
8. यदि सत्यापन विफल होता है, तो रिलीज़ शाखा पर सुधार करें और सबसे छोटी विफल
   फ़ाइल, लेन, workflow job, पैकेज प्रोफ़ाइल, प्रदाता, या मॉडल allowlist फिर चलाएँ
   जो सुधार को सिद्ध करती हो। पूरे umbrella को केवल तब फिर चलाएँ जब बदला हुआ
   सतह पूर्व evidence को stale बना दे।
9. टैग किए गए बीटा उम्मीदवार के लिए, मेल खाती
   `release/YYYY.M.PATCH` शाखा से
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` चलाएँ। स्थिर के लिए, आवश्यक Windows स्रोत
   रिलीज़ भी पास करें:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`।
   हेल्पर स्थानीय जनरेटेड-रिलीज़ checks चलाता है, पूर्ण रिलीज़ सत्यापन और npm
   प्रीफ्लाइट evidence को dispatch या verify करता है, सटीक तैयार tarball के विरुद्ध
   Parallels fresh/update proof और Telegram पैकेज proof चलाता है, Plugin npm और ClawHub
   योजनाएँ रिकॉर्ड करता है, और evidence bundle हरा होने के बाद ही सटीक
   `OpenClaw Release Publish` कमांड प्रिंट करता है।
   `OpenClaw Release Publish` चुने गए या सभी प्रकाशित-योग्य Plugin
   पैकेजों को npm और उसी सेट को समानांतर में ClawHub पर dispatch करता है, और फिर Plugin npm publish सफल होते ही
   मेल खाते dist-tag के साथ तैयार OpenClaw npm प्रीफ्लाइट artifact को प्रमोट करता है।
   OpenClaw npm publish child सफल होने के बाद, यह पूर्ण मेल खाते
   `CHANGELOG.md` अनुभाग से मेल खाता GitHub release/prerelease पेज बनाता या अपडेट करता है।
   npm `latest` पर प्रकाशित स्थिर रिलीज़ GitHub latest रिलीज़ बन जाती हैं; npm `beta` पर रखी
   स्थिर maintenance रिलीज़ GitHub `latest=false` के साथ बनाई जाती हैं। workflow प्रीफ्लाइट
   dependency evidence, full-validation manifest, और postpublish registry
   verification evidence को भी post-release incident response के लिए GitHub release पर अपलोड करता है।
   publish workflow तुरंत child run IDs प्रिंट करता है, जिन release environment gates को workflow token
   अनुमोदित कर सकता है उन्हें auto-approve करता है, विफल child jobs को log tails के साथ सारांशित करता है,
   OpenClaw npm publish सफल होते ही GitHub release और dependency
   evidence को close out करता है, जब भी OpenClaw npm प्रकाशित हो रहा हो ClawHub का इंतज़ार करता है,
   फिर `pnpm release:verify-beta` चलाता है और GitHub release, npm package, चुने हुए
   Plugin npm packages, चुने हुए ClawHub packages, child workflow run IDs, और
   वैकल्पिक NPM Telegram run ID के लिए postpublish evidence अपलोड करता है। ClawHub पथ transient CLI
   dependency install विफलताओं को retry करता है, एक preview cell flake होने पर भी preview-passing Plugins
   प्रकाशित करता है, और हर अपेक्षित Plugin version के लिए registry verification के साथ समाप्त होता है
   ताकि partial publishes दिखाई दें और retry किए जा सकें। फिर प्रकाशित
   `openclaw@YYYY.M.PATCH-beta.N` या
   `openclaw@beta` पैकेज के विरुद्ध post-publish
   package acceptance चलाएँ। यदि पुश या प्रकाशित प्रीरिलीज़ को सुधार चाहिए,
   तो अगली मेल खाती प्रीरिलीज़ संख्या काटें; पुराने
   प्रीरिलीज़ को हटाएँ या फिर से न लिखें।
10. स्थिर के लिए, केवल तब आगे बढ़ें जब जाँचे हुए बीटा या रिलीज़ उम्मीदवार के पास
    आवश्यक सत्यापन evidence हो। स्थिर npm publish भी
    `OpenClaw Release Publish` से होकर जाता है, सफल प्रीफ्लाइट artifact को
    `preflight_run_id` के माध्यम से फिर उपयोग करते हुए; स्थिर macOS release readiness के लिए
    packaged `.zip`, `.dmg`, `.dSYM.zip`, और `main` पर अपडेट किया गया `appcast.xml` भी आवश्यक है।
    macOS publish workflow रिलीज़ assets verify होने के बाद signed appcast को सार्वजनिक `main`
    पर स्वतः प्रकाशित करता है; यदि branch protection direct push को ब्लॉक करता है,
    तो यह appcast PR खोलता या अपडेट करता है। स्थिर Windows Hub
    readiness के लिए OpenClaw GitHub release पर signed `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, और
    `OpenClawCompanion-SHA256SUMS.txt` assets आवश्यक हैं।
    सटीक signed `openclaw/openclaw-windows-node` release tag को
    `windows_node_tag` के रूप में और उसके candidate-approved installer digest map को
    `windows_node_installer_digests` के रूप में पास करें; `OpenClaw Release Publish`
    release draft को रखता है, `Windows Node Release` dispatch करता है, और publication से पहले
    तीनों assets verify करता है।
11. publish के बाद, npm post-publish verifier चलाएँ, जब post-publish channel proof चाहिए हो तो वैकल्पिक standalone
    published-npm Telegram E2E चलाएँ,
    जरूरत पड़ने पर dist-tag promotion करें, जनरेटेड GitHub release page verify करें,
    release announcement steps चलाएँ, फिर स्थिर रिलीज़ को finished कहने से पहले [Stable main
    closeout](#stable-main-closeout) पूरा करें।

## Stable main closeout

स्थिर प्रकाशन तब तक पूरा नहीं होता जब तक `main` में वास्तविक shipped
रिलीज़ state न हो।

1. ताज़ा नवीनतम `main` से शुरू करें। उसके विरुद्ध `release/YYYY.M.PATCH` का ऑडिट करें और
   उन वास्तविक सुधारों को forward-port करें जो `main` में अनुपस्थित हैं। release-only संगतता,
   टेस्ट, या सत्यापन adapters को नए `main` में आँख मूँदकर merge न करें।
2. `main` को shipped स्थिर संस्करण पर सेट करें, किसी काल्पनिक अगली train पर नहीं। root version change के बाद
   `pnpm release:prep` चलाएँ, फिर
   `pnpm deps:shrinkwrap:generate` चलाएँ।
3. `main` पर `CHANGELOG.md` के `## YYYY.M.PATCH` section को tagged release branch से बिल्कुल मिलाएँ।
   जब mac release ने stable `appcast.xml` update प्रकाशित किया हो, तो उसे शामिल करें।
4. जब तक operator स्पष्ट रूप से उस release train को शुरू न करे, तब तक `main` में
   `YYYY.M.PATCH+1`, beta version, या खाली भविष्य changelog section न जोड़ें।
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, और
   `OPENCLAW_TESTBOX=1 pnpm check:changed` चलाएँ। Push करें, फिर stable release को पूर्ण कहने से पहले verify करें कि `origin/main`
   में shipped version और changelog मौजूद हैं।
6. प्रत्येक निजी rollback drill के बाद repository variables `RELEASE_ROLLBACK_DRILL_ID` और
   `RELEASE_ROLLBACK_DRILL_DATE` को current रखें।
   `OpenClaw Stable Main Closeout` उस `main` push से शुरू होता है जिसमें stable publication के बाद
   shipped version, changelog, और appcast मौजूद होते हैं। यह shipped tag को उसके Full Release
   Validation और Publish runs से बाँधने के लिए immutable postpublish evidence पढ़ता है, फिर stable main state, release,
   अनिवार्य stable soak, और blocking performance evidence को verify करता है। यह GitHub release में
   एक immutable closeout manifest और checksum attach करता है। automatic
   push trigger उन legacy releases को skip करता है जो immutable postpublish
   evidence से पहले की हैं; यह उस skip को कभी completed closeout नहीं मानता। Complete
   closeout के लिए assets और matching checksum दोनों आवश्यक हैं। Partial manifest
   अपने recorded `main` SHA और rollback drill को replay करके identical
   bytes regenerate करता है, फिर missing checksum attach करता है; invalid pair, या manifest के बिना checksum,
   blocking रहता है। rollback drill repository variables के बिना push-triggered run
   closeout complete किए बिना skip करता है; missing या 90 दिनों से अधिक पुराने drill record से manual evidence-backed
   closeout फिर भी block रहता है। Private recovery commands maintainer-only runbook में रहती हैं।
   Manual dispatch का उपयोग केवल evidence-backed stable closeout को repair या replay करने के लिए करें।
   Legacy fallback correction tag base-package evidence का reuse केवल तब कर सकता है जब
   correction tag base stable tag के समान source commit पर resolve होता हो।
   अलग source वाली correction को अपना package
   evidence publish और verify करना होगा।

## रिलीज़ पूर्व-जांच

- रिलीज़ प्रीफ़्लाइट से पहले `pnpm check:test-types` चलाएँ, ताकि परीक्षण TypeScript तेज़ स्थानीय `pnpm check` गेट के बाहर भी
  कवर रहे
- रिलीज़ प्रीफ़्लाइट से पहले `pnpm check:architecture` चलाएँ, ताकि व्यापक import
  cycle और architecture boundary checks तेज़ स्थानीय गेट के बाहर हरे रहें
- `pnpm release:check` से पहले `pnpm build && pnpm ui:build` चलाएँ, ताकि अपेक्षित
  `dist/*` रिलीज़ artifacts और Control UI बंडल pack
  validation चरण के लिए मौजूद हों
- root version bump के बाद और tagging से पहले `pnpm release:prep` चलाएँ। यह
  हर deterministic release generator चलाता है जो version/config/API बदलाव के बाद
  आम तौर पर drift करता है: Plugin versions, Plugin inventory, base config
  schema, bundled channel config metadata, config docs baseline, Plugin SDK
  exports, और Plugin SDK API baseline। `pnpm release:check` उन
  guards को check mode में फिर से चलाता है और package release checks चलाने से पहले एक
  pass में मिले हर generated drift failure की रिपोर्ट करता है।
- Plugin version sync आधिकारिक Plugin package versions और मौजूदा
  `openclaw.compat.pluginApi` floors को default रूप से OpenClaw release version पर
  अपडेट करता है। उस field को Plugin SDK/runtime API floor मानें, केवल package version
  की copy नहीं: उन Plugin-only releases के लिए जो जानबूझकर पुराने OpenClaw hosts के साथ
  compatible रहते हैं, floor को सबसे पुराने supported host API पर रखें और उस चुनाव को
  Plugin release proof में document करें।
- Release approval से पहले manual `Full Release Validation` workflow चलाएँ, ताकि
  सभी pre-release test boxes एक entrypoint से शुरू हों। यह branch,
  tag, या full commit SHA स्वीकार करता है, manual `CI` dispatch करता है, और install smoke,
  package acceptance, cross-OS package checks, QA Lab parity, Matrix, और Telegram lanes के लिए
  `OpenClaw Release Checks` dispatch करता है। Stable और full
  runs हमेशा exhaustive live/E2E और Docker release-path soak शामिल करते हैं;
  `run_release_soak=true` एक explicit beta soak के लिए रखा गया है। Package
  Acceptance candidate validation के दौरान canonical package Telegram E2E देता है,
  जिससे दूसरा concurrent live poller नहीं चलता।
  Beta प्रकाशित करने के बाद `release_package_spec` दें, ताकि shipped
  npm package को release checks, Package Acceptance, और package Telegram
  E2E में release tarball rebuild किए बिना reuse किया जा सके।
  `npm_telegram_package_spec` केवल तब दें जब Telegram को बाकी
  release validation से अलग published package उपयोग करना हो।
  `package_acceptance_package_spec` तब दें जब Package Acceptance को
  release package spec से अलग published package उपयोग करना हो।
  `evidence_package_spec` तब दें जब release evidence report को यह साबित करना हो कि
  validation published npm package से मेल खाता है, बिना Telegram E2E force किए।
  उदाहरण:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- जब release work जारी रहते हुए package candidate के लिए side-channel proof चाहिए हो, तब
  manual `Package Acceptance` workflow चलाएँ। `openclaw@beta`,
  `openclaw@latest`, या exact release version के लिए `source=npm` उपयोग करें; current
  `workflow_ref` harness के साथ trusted `package_ref` branch/tag/SHA pack करने के लिए
  `source=ref`; required SHA-256 और strict public URL policy वाले public HTTPS tarball के लिए
  `source=url`; required `trusted_source_id` और SHA-256 वाले named trusted-source policy के लिए
  `source=trusted-url`; या किसी अन्य GitHub Actions run द्वारा uploaded tarball के लिए
  `source=artifact`। Workflow candidate को
  `package-under-test` में resolve करता है, उस tarball के विरुद्ध Docker E2E release scheduler reuse करता है,
  और उसी tarball के साथ `telegram_mode=mock-openai` या
  `telegram_mode=live-frontier` द्वारा Telegram QA चला सकता है। जब selected Docker lanes में
  `published-upgrade-survivor` शामिल हो, package
  artifact candidate होता है और `published_upgrade_survivor_baseline` published baseline चुनता है।
  `update-restart-auth` candidate package को installed CLI और package-under-test दोनों के रूप में उपयोग करता है,
  ताकि वह candidate update command के managed restart path का अभ्यास करे।
  उदाहरण: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  सामान्य profiles:
  - `smoke`: install/channel/agent, gateway network, और config reload lanes
  - `package`: OpenWebUI या live ClawHub के बिना artifact-native package/update/restart/Plugin lanes
  - `product`: package profile plus MCP channels, cron/subagent cleanup,
    OpenAI web search, और OpenWebUI
  - `full`: OpenWebUI के साथ Docker release-path chunks
  - `custom`: focused rerun के लिए exact `docker_lanes` selection
- जब release candidate के लिए केवल deterministic normal
  CI coverage चाहिए हो, तब manual `CI` workflow सीधे चलाएँ। Manual CI dispatches changed
  scoping को bypass करते हैं और Linux Node shards, bundled-Plugin shards, Plugin और
  channel contract shards, Node 22 compatibility, `check-*`, `check-additional-*`,
  built-artifact smoke checks, docs checks, Python skills, Windows, macOS, और
  Control UI i18n lanes को force करते हैं। Standalone manual CI Android केवल तब चलाता है
  जब `include_android=true` के साथ dispatch किया गया हो; `Full Release Validation` अपने CI child के लिए
  वह input pass करता है।
  Android सहित उदाहरण: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Release telemetry validate करते समय `pnpm qa:otel:smoke` चलाएँ। यह
  local OTLP/HTTP receiver के माध्यम से QA-lab चलाता है और trace, metric, और log
  export के साथ bounded trace attributes और content/identifier redaction verify करता है,
  बिना Opik, Langfuse, या किसी अन्य external collector की आवश्यकता के।
- Collector compatibility validate करते समय `pnpm qa:otel:collector-smoke` चलाएँ।
  यह local receiver assertions से पहले उसी QA-lab OTLP export को वास्तविक OpenTelemetry Collector
  Docker container के माध्यम से route करता है।
- Protected Prometheus scraping validate करते समय `pnpm qa:prometheus:smoke` चलाएँ।
  यह QA-lab चलाता है, unauthenticated scrapes reject करता है, और verify करता है कि
  release-critical metric families prompt content, raw identifiers,
  auth tokens, और local paths से मुक्त रहें।
- जब source-checkout OpenTelemetry और Prometheus smoke lanes back to back चाहिए हों,
  तब `pnpm qa:observability:smoke` चलाएँ।
- हर tagged release से पहले `pnpm release:check` चलाएँ
- `OpenClaw NPM Release` preflight npm tarball pack करने से पहले
  dependency release evidence generate करता है। npm advisory vulnerability gate
  release-blocking है। Transitive manifest risk, dependency ownership/install
  surface, और dependency change reports केवल release evidence हैं। Dependency change report
  release candidate की तुलना पिछले reachable release tag से करता है।
- Preflight dependency evidence को
  `openclaw-release-dependency-evidence-<tag>` के रूप में upload करता है और इसे prepared npm preflight artifact के भीतर
  `dependency-evidence/` के तहत embed भी करता है। वास्तविक
  publish path उसी preflight artifact को reuse करता है, फिर वही evidence
  GitHub release में `openclaw-<version>-dependency-evidence.zip` के रूप में attach करता है।
- Tag मौजूद होने के बाद mutating publish sequence के लिए `OpenClaw Release Publish` चलाएँ।
  इसे `release/YYYY.M.PATCH` से dispatch करें (या main-reachable tag publish करते समय `main` से),
  release tag, successful OpenClaw npm
  `preflight_run_id`, और successful `full_release_validation_run_id` pass करें, और default Plugin publish scope
  `all-publishable` रखें, जब तक आप जानबूझकर focused repair नहीं चला रहे हों।
  Workflow Plugin npm publish, Plugin
  ClawHub publish, और OpenClaw npm publish को serialize करता है, ताकि core package अपने externalized Plugins से पहले
  publish न हो।
- Stable `OpenClaw Release Publish` को matching non-prerelease
  `openclaw/openclaw-windows-node` release मौजूद होने के बाद exact `windows_node_tag` चाहिए।
  इसे candidate-approved `windows_node_installer_digests` map भी चाहिए।
  किसी भी publish child को dispatch करने से पहले, यह verify करता है कि source release
  published है, non-prerelease है, required x64/ARM64 installers रखता है, और
  अभी भी उस approved map से मेल खाता है। फिर यह OpenClaw release के draft रहते हुए
  `Windows Node Release` dispatch करता है, pinned installer
  digest map को बिना बदलाव carry करता है। Child
  workflow उस exact tag से signed Windows Hub installers download करता है,
  उन्हें pinned digests से match करता है, Windows runner पर verify करता है कि उनकी Authenticode
  signatures expected OpenClaw Foundation signer उपयोग करती हैं,
  SHA-256 manifest लिखता है, और installers plus manifest को canonical OpenClaw GitHub release पर upload करता है,
  फिर promoted assets को re-download करके manifest membership और hashes verify करता है। Parent publication से पहले current
  x64, ARM64, और checksum asset contract verify करता है। Direct recovery
  expected contract assets को pinned source bytes से replace करने से पहले unexpected `OpenClawCompanion-*` asset names reject करता है।
  `Windows Node Release` manual रूप से केवल recovery के लिए dispatch करें, और हमेशा exact tag pass करें,
  `latest` कभी नहीं, साथ ही approved source release से explicit `expected_installer_digests` JSON map दें।
  Website download links को current stable release के exact OpenClaw
  release asset URLs target करने चाहिए, या
  `releases/latest/download/...` केवल तब जब verify कर लिया हो कि GitHub का latest redirect
  उसी release की ओर जाता है; केवल companion repo release
  page से link न करें।
- Release checks अब अलग manual workflow में चलते हैं:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` release approval से पहले QA Lab mock parity lane plus fast
  live Matrix profile और Telegram QA lane भी चलाता है। Live
  lanes `qa-live-shared` environment उपयोग करते हैं; Telegram Convex CI
  credential leases भी उपयोग करता है। जब आपको full Matrix
  transport, media, और E2EE inventory parallel चाहिए हो, तब manual `QA-Lab - All Lanes` workflow को
  `matrix_profile=all` और `matrix_shards=true` के साथ चलाएँ।
- Cross-OS install और upgrade runtime validation public
  `OpenClaw Release Checks` और `Full Release Validation` का हिस्सा है, जो
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` को सीधे call करते हैं
- यह विभाजन intentional है: वास्तविक npm release path को छोटा,
  deterministic, और artifact-focused रखें, जबकि धीमे live checks अपने
  lane में रहें ताकि वे publish को stall या block न करें
- Secret-bearing release checks को `Full Release
Validation` के माध्यम से या `main`/release workflow ref से dispatch करना चाहिए, ताकि workflow logic और
  secrets नियंत्रित रहें
- `OpenClaw Release Checks` branch, tag, या full commit SHA स्वीकार करता है, जब तक
  resolved commit OpenClaw branch या release tag से reachable हो
- `OpenClaw NPM Release` validation-only preflight current
  full 40-character workflow-branch commit SHA भी स्वीकार करता है, pushed tag की आवश्यकता के बिना
- वह SHA path केवल validation-only है और वास्तविक publish में promote नहीं किया जा सकता
- SHA mode में workflow package metadata check के लिए केवल `v<package.json version>` synthesize करता है;
  real publish को अभी भी real release tag चाहिए
- दोनों workflows real publish और promotion path को GitHub-hosted
  runners पर रखते हैं, जबकि non-mutating validation path बड़े
  Blacksmith Linux runners उपयोग कर सकता है
- वह workflow दोनों `OPENAI_API_KEY` और `ANTHROPIC_API_KEY` workflow secrets का उपयोग करते हुए
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  चलाता है
- npm release preflight अब अलग release checks lane का इंतज़ार नहीं करता
- Release candidate को locally tag करने से पहले
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` चलाएँ। Helper
  fast release guardrails, Plugin npm/ClawHub release checks, build,
  UI build, और `release:openclaw:npm:check` को उस क्रम में चलाता है जो GitHub publish workflow शुरू होने से पहले आम
  approval-blocking गलतियाँ पकड़ता है।
- Approval से पहले
  `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (या matching beta/correction tag) चलाएँ
- npm publish के बाद, चलाएँ
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (या मेल खाने वाला beta/correction संस्करण) ताकि प्रकाशित registry
  install path को एक नए temp prefix में सत्यापित किया जा सके
- beta publish के बाद, `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` चलाएं
  ताकि साझा leased Telegram credential
  pool का उपयोग करके प्रकाशित npm package के विरुद्ध installed-package onboarding, Telegram setup, और वास्तविक Telegram E2E सत्यापित हो सके। स्थानीय maintainer one-offs Convex vars को छोड़ सकते हैं और तीन
  `OPENCLAW_QA_TELEGRAM_*` env credentials सीधे पास कर सकते हैं।
- maintainer मशीन से पूरा post-publish beta smoke चलाने के लिए, `pnpm release:beta-smoke -- --beta betaN` का उपयोग करें। helper Parallels npm update/fresh-target validation चलाता है, `NPM Telegram Beta E2E` dispatch करता है, exact workflow run poll करता है, artifact download करता है, और Telegram report print करता है।
- Maintainers GitHub Actions से भी वही post-publish check चला सकते हैं,
  manual `NPM Telegram Beta E2E` workflow के जरिए। यह जानबूझकर manual-only है और
  हर merge पर नहीं चलता।
- Maintainer release automation अब preflight-then-promote का उपयोग करता है:
  - वास्तविक npm publish के लिए सफल npm `preflight_run_id` pass होना चाहिए
  - वास्तविक npm publish उसी `main` या
    `release/YYYY.M.PATCH` branch से dispatch होना चाहिए जिससे सफल preflight run हुआ था
  - stable npm releases default रूप से `beta` पर जाते हैं
  - stable npm publish workflow input के जरिए explicit रूप से `latest` target कर सकता है
  - token-based npm dist-tag mutation अब
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` में रहता है क्योंकि
    `npm dist-tag add` को अभी भी `NPM_TOKEN` चाहिए जबकि source repo
    OIDC-only publish रखता है
  - public `macOS Release` validation-only है; जब कोई tag केवल
    release branch पर हो लेकिन workflow `main` से dispatch हो, तो
    `public_release_branch=release/YYYY.M.PATCH` set करें
  - वास्तविक macOS publish के लिए सफल macOS `preflight_run_id` और
    `validate_run_id` pass होना चाहिए
  - वास्तविक publish paths artifacts को फिर से rebuild करने के बजाय prepared artifacts promote करते हैं
- `YYYY.M.PATCH-N` जैसे stable correction releases के लिए, post-publish verifier
  `YYYY.M.PATCH` से `YYYY.M.PATCH-N` तक वही temp-prefix upgrade path भी check करता है,
  ताकि release corrections चुपचाप पुराने global installs को
  base stable payload पर न छोड़ दें
- npm release preflight तब तक fail closed रहता है जब तक tarball में
  `dist/control-ui/index.html` और non-empty `dist/control-ui/assets/` payload दोनों शामिल न हों,
  ताकि हम फिर से खाली browser dashboard ship न करें
- Post-publish verification यह भी check करता है कि published Plugin entrypoints और
  package metadata installed registry layout में मौजूद हैं। कोई release जो
  missing Plugin runtime payloads ship करता है, postpublish verifier में fail होता है और
  `latest` पर promote नहीं किया जा सकता।
- `pnpm test:install:smoke` candidate update tarball पर npm pack `unpackedSize` budget भी enforce करता है,
  ताकि installer e2e release publish path से पहले accidental pack bloat पकड़ सके
- यदि release work ने CI planning, extension timing manifests, या
  extension test matrices को छुआ है, तो approval से पहले
  `.github/workflows/plugin-prerelease.yml` से planner-owned
  `plugin-prerelease-extension-shard` matrix outputs regenerate और review करें, ताकि release notes
  stale CI layout का वर्णन न करें
- Stable macOS release readiness में updater surfaces भी शामिल हैं:
  - GitHub release में अंततः packaged `.zip`, `.dmg`, और `.dSYM.zip` होने चाहिए
  - publish के बाद `main` पर `appcast.xml` को नए stable zip की ओर point करना चाहिए; macOS publish workflow इसे automatically commit करता है, या direct push blocked होने पर appcast
    PR खोलता है
  - packaged app में non-debug bundle id, non-empty Sparkle feed
    URL, और उस release version के canonical Sparkle build floor पर या उससे ऊपर का `CFBundleVersion` बना रहना चाहिए

## रिलीज़ टेस्ट बॉक्स

`Full Release Validation` वह तरीका है जिससे ऑपरेटर सभी प्री-रिलीज़ परीक्षणों को
एक एंट्रीपॉइंट से शुरू करते हैं। तेज़ी से बदलती शाखा पर पिन किए गए कमिट प्रमाण के लिए,
हेल्पर का उपयोग करें ताकि हर चाइल्ड वर्कफ़्लो लक्ष्य
SHA पर स्थिर अस्थायी शाखा से चले:

```bash
pnpm ci:full-release --sha <full-sha>
```

हेल्पर `release-ci/<sha>-...` पुश करता है, उस शाखा से `Full Release Validation`
को `ref=<sha>` के साथ डिस्पैच करता है, सत्यापित करता है कि हर चाइल्ड वर्कफ़्लो `headSha`
लक्ष्य से मेल खाता है, फिर अस्थायी शाखा हटाता है। इससे गलती से
किसी नए `main` चाइल्ड रन को प्रमाणित करने से बचा जाता है।

रिलीज़ शाखा या टैग वैलिडेशन के लिए, इसे भरोसेमंद `main` वर्कफ़्लो
ref से चलाएँ और रिलीज़ शाखा या टैग को `ref` के रूप में पास करें:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

वर्कफ़्लो लक्ष्य ref को रिज़ॉल्व करता है, `target_ref=<release-ref>` के साथ
मैनुअल `CI` डिस्पैच करता है, फिर `OpenClaw Release Checks` डिस्पैच करता है।
`OpenClaw Release Checks` इंस्टॉल स्मोक, क्रॉस-OS रिलीज़ चेक,
soak सक्षम होने पर लाइव/E2E Docker रिलीज़-पाथ कवरेज, कैनॉनिकल Telegram पैकेज E2E के साथ
Package Acceptance, QA Lab पैरिटी, लाइव Matrix, और लाइव
Telegram को फैलाता है। पूरा/all रन केवल तभी स्वीकार्य है जब `Full Release Validation`
सारांश `normal_ci`, `plugin_prerelease`, और `release_checks` को
सफल दिखाए, जब तक कि कोई केंद्रित री-रन जानबूझकर अलग `Plugin
Prerelease` चाइल्ड को छोड़ न दे। स्टैंडअलोन `npm-telegram` चाइल्ड का उपयोग केवल
`release_package_spec` या
`npm_telegram_package_spec` के साथ केंद्रित प्रकाशित-पैकेज री-रन के लिए करें। अंतिम
वेरिफायर सारांश में हर चाइल्ड रन के लिए सबसे धीमे-जॉब तालिकाएँ शामिल होती हैं, ताकि रिलीज़
मैनेजर लॉग डाउनलोड किए बिना मौजूदा क्रिटिकल पाथ देख सके।
पूर्ण स्टेज मैट्रिक्स, सटीक वर्कफ़्लो जॉब नाम, stable बनाम full प्रोफ़ाइल
अंतर, आर्टिफैक्ट, और केंद्रित री-रन हैंडल के लिए [पूर्ण रिलीज़ वैलिडेशन](/hi/reference/full-release-validation) देखें।
चाइल्ड वर्कफ़्लो उस भरोसेमंद ref से डिस्पैच किए जाते हैं जो `Full Release
Validation` चलाता है, सामान्यतः `--ref main`, भले ही लक्ष्य `ref` किसी
पुरानी रिलीज़ शाखा या टैग की ओर इशारा करता हो। कोई अलग Full Release Validation
वर्कफ़्लो-ref इनपुट नहीं है; वर्कफ़्लो रन ref चुनकर भरोसेमंद हार्नेस चुनें।
चलते हुए `main` पर सटीक कमिट प्रमाण के लिए `--ref main -f ref=<sha>` का उपयोग न करें;
कच्चे कमिट SHA वर्कफ़्लो डिस्पैच ref नहीं हो सकते, इसलिए
पिन की गई अस्थायी शाखा बनाने के लिए `pnpm ci:full-release --sha <sha>` का उपयोग करें।

लाइव/प्रदाता विस्तार चुनने के लिए `release_profile` का उपयोग करें:

- `minimum`: सबसे तेज़ रिलीज़-क्रिटिकल OpenAI/core लाइव और Docker पाथ
- `stable`: रिलीज़ अनुमोदन के लिए minimum के साथ स्थिर प्रदाता/बैकएंड कवरेज
- `full`: stable के साथ विस्तृत सलाहकार प्रदाता/मीडिया कवरेज

Stable और full वैलिडेशन प्रमोशन से पहले हमेशा संपूर्ण लाइव/E2E, Docker
रिलीज़-पाथ, और सीमित प्रकाशित अपग्रेड-सर्वाइवर स्वीप चलाते हैं।
beta के लिए वही स्वीप माँगने हेतु `run_release_soak=true` का उपयोग करें। यह स्वीप
नवीनतम चार stable पैकेजों के साथ पिन किए गए `2026.4.23` और `2026.5.2`
बेसलाइन तथा पुराने `2026.4.15` कवरेज को कवर करता है, डुप्लिकेट बेसलाइन हटाकर
हर बेसलाइन को उसके अपने Docker रनर जॉब में शार्ड करता है।

`OpenClaw Release Checks` लक्ष्य
ref को एक बार `release-package-under-test` के रूप में रिज़ॉल्व करने के लिए भरोसेमंद वर्कफ़्लो ref का उपयोग करता है और soak चलने पर उस आर्टिफैक्ट को क्रॉस-OS,
Package Acceptance, और रिलीज़-पाथ Docker चेक में दोबारा इस्तेमाल करता है। इससे
सभी पैकेज-फेसिंग बॉक्स वही बाइट्स उपयोग करते हैं और बार-बार पैकेज बिल्ड से बचते हैं।
beta पहले से npm पर होने के बाद, `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` सेट करें
ताकि रिलीज़ चेक भेजे गए पैकेज को एक बार डाउनलोड करें, उसका बिल्ड स्रोत
SHA `dist/build-info.json` से निकालें, और उस आर्टिफैक्ट को क्रॉस-OS,
Package Acceptance, रिलीज़-पाथ Docker, और पैकेज Telegram लेन के लिए दोबारा इस्तेमाल करें।
क्रॉस-OS OpenAI इंस्टॉल स्मोक `OPENCLAW_CROSS_OS_OPENAI_MODEL` का उपयोग करता है जब
repo/org वैरिएबल सेट हो, अन्यथा `openai/gpt-5.4`, क्योंकि यह लेन
सबसे धीमे डिफ़ॉल्ट मॉडल को बेंचमार्क करने के बजाय पैकेज इंस्टॉल, ऑनबोर्डिंग,
Gateway स्टार्टअप, और एक लाइव एजेंट टर्न साबित कर रही है। व्यापक लाइव प्रदाता
मैट्रिक्स मॉडल-विशिष्ट कवरेज की जगह बना रहता है।

रिलीज़ चरण के अनुसार इन वेरिएंट का उपयोग करें:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

केंद्रित फिक्स के बाद पहले री-रन के रूप में पूर्ण अंब्रेला का उपयोग न करें। यदि एक बॉक्स
विफल हो, तो अगले प्रमाण के लिए विफल चाइल्ड वर्कफ़्लो, जॉब, Docker लेन, पैकेज प्रोफ़ाइल, मॉडल
प्रदाता, या QA लेन का उपयोग करें। पूर्ण अंब्रेला फिर केवल तब चलाएँ जब
फिक्स ने साझा रिलीज़ ऑर्केस्ट्रेशन बदला हो या पहले का all-box प्रमाण
बासी बना दिया हो। अंब्रेला का अंतिम वेरिफायर दर्ज किए गए चाइल्ड वर्कफ़्लो रन
ids को दोबारा जाँचता है, इसलिए किसी चाइल्ड वर्कफ़्लो के सफलतापूर्वक री-रन होने के बाद, केवल विफल
`Verify full validation` पैरेंट जॉब को री-रन करें।

सीमित रिकवरी के लिए, अंब्रेला को `rerun_group` पास करें। `all` वास्तविक
रिलीज़-कैंडिडेट रन है, `ci` केवल सामान्य CI चाइल्ड चलाता है, `plugin-prerelease`
केवल रिलीज़-ओनली Plugin चाइल्ड चलाता है, `release-checks` हर रिलीज़
बॉक्स चलाता है, और संकरे रिलीज़ समूह `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, और `npm-telegram` हैं।
केंद्रित `npm-telegram` री-रन के लिए `release_package_spec` या
`npm_telegram_package_spec` आवश्यक है; full/all रन Package Acceptance के अंदर कैनॉनिकल पैकेज Telegram
E2E का उपयोग करते हैं। केंद्रित
क्रॉस-OS री-रन `cross_os_suite_filter=windows/packaged-upgrade` या
दूसरा OS/सूट फ़िल्टर जोड़ सकते हैं। QA रिलीज़-चेक विफलताएँ सामान्य रिलीज़
वैलिडेशन को रोकती हैं, जिसमें मानक टियर में आवश्यक OpenClaw डायनेमिक टूल ड्रिफ्ट शामिल है।
Tideclaw alpha रन अब भी गैर-पैकेज-सुरक्षा रिलीज़-चेक लेन को
सलाहकार मान सकते हैं। जब `live_suite_filter` स्पष्ट रूप से Discord, WhatsApp, या Slack जैसी gated QA लाइव लेन माँगता है, तो मेल खाता
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo वैरिएबल सक्षम होना चाहिए; अन्यथा
इनपुट कैप्चर लेन को चुपचाप छोड़ने के बजाय विफल होता है।

### Vitest

Vitest बॉक्स मैनुअल `CI` चाइल्ड वर्कफ़्लो है। मैनुअल CI जानबूझकर
changed scoping को बायपास करता है और रिलीज़
कैंडिडेट के लिए सामान्य टेस्ट ग्राफ़ को बाध्य करता है: Linux Node शार्ड, bundled-plugin शार्ड, Plugin और चैनल कॉन्ट्रैक्ट
शार्ड, Node 22 संगतता, `check-*`, `check-additional-*`,
बिल्ट-आर्टिफैक्ट स्मोक चेक, डॉक्स चेक, Python Skills, Windows, macOS,
और Control UI i18n। Android तब शामिल होता है जब `Full Release Validation`
बॉक्स चलाता है क्योंकि अंब्रेला `include_android=true` पास करता है; स्टैंडअलोन मैनुअल CI
के लिए Android कवरेज हेतु `include_android=true` आवश्यक है।

इस बॉक्स का उपयोग यह उत्तर देने के लिए करें कि "क्या सोर्स ट्री ने पूरा सामान्य टेस्ट सूट पास किया?"
यह रिलीज़-पाथ उत्पाद वैलिडेशन जैसा नहीं है। रखने योग्य प्रमाण:

- `Full Release Validation` सारांश जो डिस्पैच किए गए `CI` रन URL को दिखाए
- सटीक लक्ष्य SHA पर `CI` रन ग्रीन
- रिग्रेशन की जाँच करते समय CI जॉब से विफल या धीमे शार्ड नाम
- Vitest टाइमिंग आर्टिफैक्ट जैसे `.artifacts/vitest-shard-timings.json` जब
  किसी रन को परफ़ॉर्मेंस विश्लेषण चाहिए

मैनुअल CI सीधे केवल तब चलाएँ जब रिलीज़ को deterministic सामान्य CI चाहिए लेकिन
Docker, QA Lab, लाइव, क्रॉस-OS, या पैकेज बॉक्स नहीं। गैर-Android सीधे CI के लिए पहला कमांड
उपयोग करें। जब सीधे
रिलीज़-कैंडिडेट CI को Android कवर करना हो, तब `include_android=true` जोड़ें:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker बॉक्स `OpenClaw Release Checks` में
`openclaw-live-and-e2e-checks-reusable.yml` के माध्यम से रहता है, साथ ही release-mode
`install-smoke` वर्कफ़्लो में। यह रिलीज़ कैंडिडेट को केवल सोर्स-लेवल परीक्षणों के बजाय पैकेज्ड
Docker वातावरणों के माध्यम से वैलिडेट करता है।

रिलीज़ Docker कवरेज में शामिल है:

- धीमे Bun ग्लोबल इंस्टॉल स्मोक सक्षम के साथ पूरा इंस्टॉल स्मोक
- लक्ष्य SHA द्वारा root Dockerfile स्मोक इमेज तैयारी/पुनः उपयोग, जिसमें QR,
  root/gateway, और installer/Bun स्मोक जॉब अलग install-smoke
  शार्ड के रूप में चलती हैं
- रिपॉज़िटरी E2E लेन
- रिलीज़-पाथ Docker चंक: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, और `plugins-runtime-install-h`
- अनुरोध किए जाने पर `plugins-runtime-services` चंक के अंदर OpenWebUI कवरेज
- विभाजित bundled Plugin इंस्टॉल/अनइंस्टॉल लेन
  `bundled-plugin-install-uninstall-0` से
  `bundled-plugin-install-uninstall-23` तक
- जब रिलीज़ चेक लाइव सूट शामिल करते हैं, तब लाइव/E2E प्रदाता सूट और Docker लाइव मॉडल कवरेज

री-रन करने से पहले Docker आर्टिफैक्ट का उपयोग करें। रिलीज़-पाथ शेड्यूलर
`.artifacts/docker-tests/` अपलोड करता है जिसमें लेन लॉग, `summary.json`, `failures.json`,
फेज़ टाइमिंग, शेड्यूलर प्लान JSON, और री-रन कमांड शामिल होते हैं। केंद्रित रिकवरी के लिए,
सभी रिलीज़ चंक दोबारा चलाने के बजाय reusable लाइव/E2E वर्कफ़्लो पर
`docker_lanes=<lane[,lane]>` का उपयोग करें। जनरेट किए गए री-रन कमांड में उपलब्ध होने पर पूर्व
`package_artifact_run_id` और तैयार Docker इमेज इनपुट शामिल होते हैं, ताकि
विफल लेन वही tarball और GHCR इमेज दोबारा इस्तेमाल कर सके।

### QA Lab

QA Lab बॉक्स भी `OpenClaw Release Checks` का हिस्सा है। यह agentic
व्यवहार और चैनल-लेवल रिलीज़ गेट है, Vitest और Docker
पैकेज मैकेनिक्स से अलग।

रिलीज़ QA Lab कवरेज में शामिल है:

- agentic पैरिटी पैक का उपयोग करके OpenAI कैंडिडेट लेन की Opus 4.6
  बेसलाइन से तुलना करने वाली mock पैरिटी लेन
- `qa-live-shared` वातावरण का उपयोग करने वाली तेज़ लाइव Matrix QA प्रोफ़ाइल
- Convex CI क्रेडेंशियल लीज़ का उपयोग करने वाली लाइव Telegram QA लेन
- रिलीज़ टेलीमेट्री को स्पष्ट स्थानीय
  प्रमाण चाहिए होने पर `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke`, या
  `pnpm qa:observability:smoke`

इस बॉक्स का उपयोग यह उत्तर देने के लिए करें कि "क्या रिलीज़ QA परिदृश्यों और
लाइव चैनल फ्लो में सही व्यवहार करती है?" रिलीज़ अनुमोदित करते समय पैरिटी, Matrix, और Telegram
लेन के आर्टिफैक्ट URL रखें। पूर्ण Matrix कवरेज डिफ़ॉल्ट रिलीज़-क्रिटिकल लेन के बजाय
मैनुअल sharded QA-Lab रन के रूप में उपलब्ध रहता है।

### पैकेज

Package बॉक्स इंस्टॉल करने योग्य-उत्पाद गेट है। इसे
`Package Acceptance` और resolver
`scripts/resolve-openclaw-package-candidate.mjs` द्वारा समर्थित किया जाता है। resolver किसी
कैंडिडेट को Docker E2E द्वारा उपभोग किए जाने वाले `package-under-test` tarball में सामान्यीकृत करता है,
पैकेज इन्वेंटरी वैलिडेट करता है, पैकेज वर्ज़न और SHA-256 रिकॉर्ड करता है, और
वर्कफ़्लो हार्नेस ref को पैकेज स्रोत ref से अलग रखता है।

समर्थित कैंडिडेट स्रोत:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, या कोई सटीक OpenClaw रिलीज़
  संस्करण
- `source=ref`: चुने गए `workflow_ref` हार्नेस के साथ किसी विश्वसनीय `package_ref`
  ब्रांच, टैग, या पूर्ण कमिट SHA को पैक करें
- `source=url`: आवश्यक `package_sha256` के साथ सार्वजनिक HTTPS `.tgz` डाउनलोड करें;
  URL क्रेडेंशियल, गैर-डिफ़ॉल्ट HTTPS पोर्ट, निजी/आंतरिक/विशेष-उपयोग
  होस्टनाम या रिज़ॉल्व किए गए पते, और असुरक्षित रीडायरेक्ट अस्वीकार किए जाते हैं
- `source=trusted-url`: `.github/package-trusted-sources.json` में नामित नीति से
  आवश्यक `package_sha256` और `trusted_source_id` के साथ HTTPS `.tgz` डाउनलोड करें;
  `source=url` में इनपुट-स्तर निजी-नेटवर्क बाइपास जोड़ने के बजाय इसका उपयोग
  मेंटेनर-स्वामित्व वाले एंटरप्राइज़ मिरर या निजी पैकेज रिपॉज़िटरी के लिए करें
- `source=artifact`: किसी अन्य GitHub Actions रन द्वारा अपलोड किए गए `.tgz` का
  पुनः उपयोग करें

`OpenClaw Release Checks` `source=artifact`, तैयार रिलीज़ पैकेज आर्टिफैक्ट,
`suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` के साथ Package Acceptance चलाता है। Package Acceptance उसी
रिज़ॉल्व किए गए टारबॉल के विरुद्ध माइग्रेशन, अपडेट, कॉन्फ़िगर किए गए ऑथ अपडेट
रीस्टार्ट, लाइव ClawHub skill install, पुराने Plugin dependency cleanup, ऑफ़लाइन Plugin
fixtures, Plugin update, और Telegram package QA बनाए रखता है। ब्लॉकिंग रिलीज़ चेक
डिफ़ॉल्ट latest प्रकाशित पैकेज baseline का उपयोग करते हैं; `run_release_soak=true`,
`release_profile=stable`, या `release_profile=full` वाला beta profile `2026.4.23` से
`latest` तक हर स्थिर npm-प्रकाशित baseline और रिपोर्टेड-इश्यू fixtures तक फैलता है।
पहले से शिप किए गए candidate के लिए `source=npm` के साथ Package Acceptance का उपयोग
करें, publish से पहले SHA-backed local npm tarball के लिए `source=ref`, मेंटेनर-स्वामित्व
वाले एंटरप्राइज़/निजी mirror के लिए `source=trusted-url`, या किसी अन्य GitHub Actions run
द्वारा अपलोड किए गए तैयार tarball के लिए `source=artifact`। यह अधिकांश package/update
coverage के लिए GitHub-native replacement है, जिसके लिए पहले Parallels की आवश्यकता
होती थी। Cross-OS release checks अब भी OS-specific onboarding, installer, और platform
behavior के लिए महत्वपूर्ण हैं, लेकिन package/update product validation को Package
Acceptance को प्राथमिकता देनी चाहिए।

update और Plugin validation के लिए canonical checklist
[Testing updates and plugins](/hi/help/testing-updates-plugins) है। इसका उपयोग तब करें
जब यह तय करना हो कि कौन सा local, Docker, Package Acceptance, या release-check lane किसी
Plugin install/update, doctor cleanup, या published-package migration change को साबित
करता है। हर stable `2026.4.23+` package से exhaustive published update migration एक
अलग manual `Update Migration` workflow है, Full Release CI का हिस्सा नहीं।

Legacy package-acceptance leniency जानबूझकर समय-सीमित है। `2026.4.25` तक के packages
npm पर पहले से प्रकाशित metadata gaps के लिए compatibility path का उपयोग कर सकते हैं:
tarball में missing private QA inventory entries, missing `gateway install --wrapper`,
tarball-derived git fixture में missing patch files, missing persisted `update.channel`,
legacy Plugin install-record locations, missing marketplace install-record persistence,
और `plugins update` के दौरान config metadata migration। प्रकाशित `2026.4.26` package
उन local build metadata stamp files के लिए warning दे सकता है जो पहले से shipped थीं।
बाद के packages को modern package contracts पूरा करना होगा; वही gaps release validation
को fail करते हैं।

जब release question वास्तविक installable package के बारे में हो, तब broader Package
Acceptance profiles का उपयोग करें:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

सामान्य package profiles:

- `smoke`: quick package install/channel/agent, Gateway network, और config
  reload lanes
- `package`: install/update/restart/Plugin package contracts और live ClawHub
  skill install proof; यह release-check default है
- `product`: `package` के साथ MCP channels, cron/subagent cleanup, OpenAI web
  search, और OpenWebUI
- `full`: OpenWebUI के साथ Docker release-path chunks
- `custom`: focused reruns के लिए सटीक `docker_lanes` list

package-candidate Telegram proof के लिए, Package Acceptance पर
`telegram_mode=mock-openai` या `telegram_mode=live-frontier` सक्षम करें। workflow
resolved `package-under-test` tarball को Telegram lane में पास करता है; standalone
Telegram workflow अब भी post-publish checks के लिए published npm spec स्वीकार करता है।

## Release publish automation

`OpenClaw Release Publish` सामान्य mutating publish entrypoint है। यह release की
ज़रूरत के क्रम में trusted-publisher workflows को orchestrate करता है:

1. release tag checkout करें और उसका commit SHA resolve करें।
2. सत्यापित करें कि tag `main` या `release/*` से reachable है।
3. `pnpm plugins:sync:check` चलाएँ।
4. `publish_scope=all-publishable` और `ref=<release-sha>` के साथ `Plugin NPM Release`
   dispatch करें।
5. उसी scope और SHA के साथ `Plugin ClawHub Release` dispatch करें।
6. saved `full_release_validation_run_id` verify करने के बाद release tag, npm dist-tag,
   और saved `preflight_run_id` के साथ `OpenClaw NPM Release` dispatch करें।
7. stable releases के लिए, GitHub release को draft के रूप में create या update करें,
   explicit `windows_node_tag` और candidate-approved
   `windows_node_installer_digests` के साथ `Windows Node Release` dispatch करें, और
   draft publish करने से पहले canonical installer/checksum assets verify करें।

Beta publish example:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

default beta dist-tag पर stable publish:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

सीधे `latest` पर stable promotion explicit है:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

lower-level `Plugin NPM Release` और `Plugin ClawHub Release` workflows का उपयोग केवल
focused repair या republish work के लिए करें। `OpenClaw Release Publish`
`publish_openclaw_npm=true` होने पर `plugin_publish_scope=selected` को reject करता है
ताकि core package हर publishable official Plugin, जिसमें `@openclaw/diffs-language-pack`
भी शामिल है, के बिना ship न हो सके। selected Plugin repair के लिए,
`plugin_publish_scope=selected` और `plugins=@openclaw/name` के साथ
`publish_openclaw_npm=false` सेट करें, या child workflow को सीधे dispatch करें।

## NPM workflow inputs

`OpenClaw NPM Release` ये operator-controlled inputs स्वीकार करता है:

- `tag`: आवश्यक release tag जैसे `v2026.4.2`, `v2026.4.2-1`, या
  `v2026.4.2-beta.1`; जब `preflight_only=true` हो, validation-only preflight के लिए यह
  current full 40-character workflow-branch commit SHA भी हो सकता है
- `preflight_only`: केवल validation/build/package के लिए `true`, real publish path के
  लिए `false`
- `preflight_run_id`: real publish path पर आवश्यक ताकि workflow successful preflight
  run से prepared tarball reuse करे
- `npm_dist_tag`: publish path के लिए npm target tag; default `beta` है

`OpenClaw Release Publish` ये operator-controlled inputs स्वीकार करता है:

- `tag`: आवश्यक release tag; पहले से मौजूद होना चाहिए
- `preflight_run_id`: successful `OpenClaw NPM Release` preflight run id;
  `publish_openclaw_npm=true` होने पर आवश्यक
- `full_release_validation_run_id`: successful `Full Release Validation` run
  id; `publish_openclaw_npm=true` होने पर आवश्यक
- `windows_node_tag`: exact non-prerelease `openclaw/openclaw-windows-node`
  release tag; stable OpenClaw publish के लिए आवश्यक
- `windows_node_installer_digests`: current Windows installer names से उनके pinned
  `sha256:` digests का candidate-approved compact JSON map; stable OpenClaw publish
  के लिए आवश्यक
- `npm_dist_tag`: OpenClaw package के लिए npm target tag
- `plugin_publish_scope`: default `all-publishable`; `selected` का उपयोग केवल
  `publish_openclaw_npm=false` के साथ focused plugin-only repair work के लिए करें
- `plugins`: जब `plugin_publish_scope=selected` हो, comma-separated `@openclaw/*`
  package names
- `publish_openclaw_npm`: default `true`; `false` केवल तब सेट करें जब workflow को
  plugin-only repair orchestrator के रूप में उपयोग कर रहे हों
- `wait_for_clawhub`: default `false` ताकि npm availability ClawHub sidecar से block
  न हो; `true` केवल तब सेट करें जब workflow completion में ClawHub completion शामिल
  होना आवश्यक हो

`OpenClaw Release Checks` ये operator-controlled inputs स्वीकार करता है:

- `ref`: validate करने के लिए branch, tag, या full commit SHA। Secret-bearing checks
  के लिए resolved commit का OpenClaw branch या release tag से reachable होना आवश्यक
  है।
- `run_release_soak`: beta release checks के लिए exhaustive live/E2E, Docker
  release-path, और all-since upgrade-survivor soak में opt in करें। इसे
  `release_profile=stable` और `release_profile=full` द्वारा forced on किया जाता है।

नियम:

- Stable और correction tags `beta` या `latest` में से किसी पर भी publish हो सकते हैं
- Beta prerelease tags केवल `beta` पर publish हो सकते हैं
- `OpenClaw NPM Release` के लिए, full commit SHA input केवल तब allowed है जब
  `preflight_only=true` हो
- `OpenClaw Release Checks` और `Full Release Validation` हमेशा validation-only हैं
- real publish path को वही `npm_dist_tag` उपयोग करना होगा जो preflight के दौरान उपयोग
  किया गया था; workflow verify करता है कि metadata publish से पहले जारी रहता है

## Stable npm release sequence

जब stable npm release काट रहे हों:

1. `preflight_only=true` के साथ `OpenClaw NPM Release` चलाएं
   - किसी टैग के मौजूद होने से पहले, आप preflight workflow के केवल-सत्यापन dry run के लिए मौजूदा पूर्ण workflow-branch commit
     SHA का उपयोग कर सकते हैं
2. सामान्य beta-first प्रवाह के लिए `npm_dist_tag=beta` चुनें, या `latest` केवल तब चुनें
   जब आप जानबूझकर सीधे stable publish चाहते हों
3. जब आप एक manual workflow से सामान्य CI के साथ live prompt cache, Docker, QA Lab,
   Matrix, और Telegram कवरेज चाहते हों, तो release branch, release tag, या पूर्ण
   commit SHA पर `Full Release Validation` चलाएं
4. यदि आपको जानबूझकर केवल deterministic सामान्य test graph चाहिए, तो इसके बजाय release ref पर
   manual `CI` workflow चलाएं
5. ठीक वह non-prerelease `openclaw/openclaw-windows-node` release tag चुनें
   जिसके signed x64 और ARM64 installers ship होने चाहिए। इसे
   `windows_node_tag` के रूप में सहेजें, और उनके validated digest map को
   `windows_node_installer_digests` के रूप में सहेजें। release-candidate helper दोनों को रिकॉर्ड करता है
   और उन्हें अपने generated publish command में शामिल करता है।
6. सफल `preflight_run_id` और `full_release_validation_run_id` सहेजें
7. उसी `tag`, उसी `npm_dist_tag`,
   चुने गए `windows_node_tag`, उसके सहेजे गए `windows_node_installer_digests`,
   सहेजे गए `preflight_run_id`, और सहेजे गए `full_release_validation_run_id` के साथ `OpenClaw Release Publish` चलाएं;
   यह OpenClaw npm package को promote करने से पहले externalized plugins को npm और ClawHub पर publish करता है
8. यदि release `beta` पर landed हुई है, तो उस stable version को `beta` से `latest` पर promote करने के लिए
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow का उपयोग करें
9. यदि release जानबूझकर सीधे `latest` पर publish की गई है और `beta`
   को तुरंत उसी stable build का पालन करना चाहिए, तो दोनों dist-tags को stable version पर point करने के लिए उसी release
   workflow का उपयोग करें, या उसके scheduled
   self-healing sync को बाद में `beta` move करने दें

dist-tag mutation release ledger repo में रहता है क्योंकि इसे अभी भी
`NPM_TOKEN` की आवश्यकता होती है, जबकि source repo OIDC-only publish रखता है।

इससे direct publish path और beta-first promotion path दोनों
documented और operator-visible बने रहते हैं।

यदि किसी maintainer को local npm authentication पर fallback करना पड़े, तो कोई भी 1Password
CLI (`op`) commands केवल dedicated tmux session के अंदर चलाएं। मुख्य agent shell से सीधे `op`
को call न करें; इसे tmux के अंदर रखने से prompts,
alerts, और OTP handling observable रहते हैं और repeated host alerts रुकते हैं।

## सार्वजनिक संदर्भ

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers वास्तविक runbook के लिए
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
में private release docs का उपयोग करते हैं।

## संबंधित

- [Release channels](/hi/install/development-channels)
