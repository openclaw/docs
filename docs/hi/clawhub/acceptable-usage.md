---
read_when:
    - दुरुपयोग या नीति उल्लंघनों के लिए अपलोड की समीक्षा करना
    - OpenClaw मॉडरेशन दस्तावेज़ या समीक्षक रनबुक लिखना
    - यह तय करना कि किसी skill को छिपाया जाना चाहिए या किसी उपयोगकर्ता को प्रतिबंधित किया जाना चाहिए
sidebarTitle: Acceptable Usage
summary: 'मार्केटप्लेस नीति: ClawHub क्या अनुमति देता है और यह क्या होस्ट नहीं करेगा।'
title: स्वीकार्य उपयोग
x-i18n:
    generated_at: "2026-06-30T14:00:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# स्वीकार्य उपयोग

ClawHub OpenClaw के लिए Skills, plugins, packages, और marketplace metadata होस्ट करता है।
इस पेज का उपयोग यह तय करने के लिए करें कि सामग्री या प्रकाशन व्यवहार
ClawHub पर होना चाहिए या नहीं।

ये नियम इस पर लागू होते हैं कि कोई लिस्टिंग क्या करती है, वह उपयोगकर्ताओं से क्या चलाने को कहती है, वह
अपने बारे में क्या बताती है, और प्रकाशक ClawHub की discovery, install, और
trust surfaces का उपयोग कैसे करते हैं। moderation states और account standing के लिए,
[Moderation and Account Safety](/clawhub/moderation) देखें। copyright या अन्य rights
claims के लिए, [Content Rights Requests](/clawhub/content-rights) देखें।

## अनुमत सामग्री

ClawHub ऐसी सामग्री का स्वागत करता है जो उपयोगी, समझने योग्य, और सद्भावना में
प्रकाशित हो।

| श्रेणी                                           | कब अनुमत है                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| डेवलपर उत्पादकता                                | लिस्टिंग उपयोगकर्ताओं को software बनाने, test करने, migrate करने, debug करने, document करने, या operate करने में मदद करती है।   |
| UI, data, और automation workflows                | scope स्पष्ट है, आवश्यक credentials स्पष्ट हैं, और जोखिमपूर्ण actions में review, dry-run, preview, या confirmation paths शामिल हैं। |
| Defensive security, moderation, और abuse review  | tool को authorized review के लिए प्रस्तुत किया गया है, evidence को सुरक्षित रखता है, और human approval boundaries को स्पष्ट रखता है। |
| व्यक्तिगत या टीम workflows                       | workflow consent-based accounts, transparent setup, और explicit permissions का उपयोग करता है।                                    |
| Maintained catalogs                              | हर लिस्टिंग अलग, उपयोगी, सही ढंग से वर्णित, और पर्याप्त रूप से maintained है।                                                     |

संदर्भ मायने रखता है। वही विषय एक संकीर्ण defensive या
consent-based setting में स्वीकार्य हो सकता है और abuse workflow के रूप में package किए जाने पर अस्वीकार्य।

## निषिद्ध सामग्री

ClawHub ऐसी सामग्री होस्ट नहीं करता जिसका मुख्य उद्देश्य abuse, deception, unsafe
execution, या rights infringement हो।

| श्रेणी                                                       | अनुमत नहीं है                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unauthorized access या security bypass                       | Auth bypass, account takeover, rate-limit abuse, live call या agent takeover, reusable session theft, या unapproved users के लिए pairing flows को auto-approve करना।                                                                                                                                             |
| Platform abuse और ban evasion                                | bans के बाद stealth accounts, account warming या farming, fake engagement, multi-account automation, mass posting, spam bots, या detection से बचने के लिए बनी automation।                                                                                                                                        |
| Fraud, scams, और deceptive financial workflows                | नकली certificates या invoices, deceptive payment flows, scam outreach, fake social proof, fraud के लिए synthetic-identity workflows, या स्पष्ट human approval के बिना spending/charging tools।                                                                                                                  |
| Privacy-invasive enrichment या surveillance                  | spam के लिए contact scraping, doxxing, stalking, unsolicited outreach के साथ lead extraction, covert monitoring, non-consensual biometric matching, या leaked data या breach dumps का उपयोग।                                                                                                                    |
| Non-consensual impersonation या identity manipulation         | Face swap, digital twins, cloned influencers, fake personas, या impersonate या mislead करने के लिए उपयोग किए जाने वाले अन्य tooling।                                                                                                                                                                             |
| Explicit sexual content या safety-disabled adult generation  | NSFW image, video, या content generation; third-party APIs के आसपास adult-content wrappers; या ऐसी listings जिनका primary purpose explicit sexual content है।                                                                                                                                                    |
| Hidden, unsafe, या misleading execution requirements          | Obfuscated install commands, pipe-to-shell installers जैसे downloaded content को clear reviewability के बिना `sh` या `bash` से चलाना, undeclared secret या private-key requirements, clear reviewability के बिना remote `npx @latest` execution, या ऐसा metadata जो छिपाता है कि listing को चलने के लिए सच में क्या चाहिए। |
| Copyright-infringing या rights-violating material             | किसी और के skill, plugin, docs, brand assets, या proprietary code को permission के बिना फिर से प्रकाशित करना; license terms का उल्लंघन करना; या original author या publisher का impersonation करना।                                                                                                             |

## निषिद्ध marketplace व्यवहार

ClawHub यह भी review करता है कि प्रकाशक marketplace का उपयोग कैसे करते हैं। ClawHub का उपयोग
discovery, metrics, trust signals, moderation systems, या user
attention को manipulate करने के लिए न करें।

निषिद्ध marketplace व्यवहार में शामिल हैं:

- बड़ी संख्या में low-effort, duplicative, placeholder, या
  machine-generated listings को bulk publish करना जिनमें वास्तविक user value नहीं दिखती
- search या category surfaces को लगभग identical skills या plugins से भर देना
- सैकड़ों listings प्रकाशित करना जिनमें बहुत कम या कोई usage, maintenance, source
  clarity, या meaningful differentiation न हो
- automation, self-install loops, fake accounts, coordinated
  activity, paid engagement, या अन्य non-organic behavior के माध्यम से installs, downloads, stars, या अन्य engagement
  metrics को artificially inflate करना
- moderation, bans, publisher limits, या
  marketplace review से बचने के लिए accounts बनाना या rotate करना
- ownership, source, capabilities, security posture,
  install requirements, या किसी अन्य project या publisher से affiliation के बारे में users को mislead करना
- ऐसी सामग्री बार-बार upload करना जिसे underlying issue ठीक किए बिना
  पहले ही hidden, removed, या blocked किया जा चुका है

High-volume publishing अपने आप abuse नहीं है। बड़े catalogs स्वीकार्य हैं
जब listings meaningful रूप से अलग, सही ढंग से वर्णित, maintained,
और वास्तविक users द्वारा उपयोग की जाती हैं। बड़े catalogs trust और safety problem तब बनते हैं जब
volume के साथ thin, duplicative, misleading, unmaintained, या
artificially promoted listings जुड़ी हों।

## सामग्री अधिकार

अगर आपको लगता है कि ClawHub पर मौजूद सामग्री आपके copyright या अन्य rights का उल्लंघन करती है, तो
[Content Rights Requests](/clawhub/content-rights) का उपयोग करें। copyright या rights claims के लिए normal marketplace
reports का उपयोग न करें जब तक कि listing unsafe,
malicious, या misleading भी न हो।

## Review और enforcement

ClawHub unsafe content या abusive publishing behavior की पहचान करने के लिए automated checks, statistical abuse signals, user reports, और
staff review का उपयोग कर सकता है। कोई signal अपने आप abuse साबित नहीं करता; यह ClawHub को यह तय करने में मदद करता है कि क्या review की आवश्यकता है।

हम:

- violating listings को hide, hold, remove, soft-delete, या, जहां resource type के लिए supported हो,
  hard-delete कर सकते हैं
- unsafe releases के लिए downloads या installs block कर सकते हैं
- API tokens revoke कर सकते हैं
- associated content soft-delete कर सकते हैं
- publishing access restrict कर सकते हैं
- repeat या severe offenders को ban कर सकते हैं

हम obvious abuse के लिए warning-first enforcement की guarantee नहीं देते। reports, moderation holds,
hidden listings, bans, और account standing के लिए
[Moderation and Account Safety](/clawhub/moderation) देखें।
