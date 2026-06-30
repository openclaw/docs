---
read_when:
    - दुरुपयोग या नीति उल्लंघनों के लिए अपलोड की समीक्षा करना
    - मॉडरेशन दस्तावेज़ या समीक्षक रनबुक लिखना
    - यह तय करना कि किसी skill को छिपाया जाना चाहिए या किसी उपयोगकर्ता को प्रतिबंधित किया जाना चाहिए
sidebarTitle: Acceptable Usage
summary: 'मार्केटप्लेस नीति: ClawHub क्या अनुमति देता है और क्या होस्ट नहीं करेगा।'
title: स्वीकार्य उपयोग
x-i18n:
    generated_at: "2026-06-30T22:15:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# स्वीकार्य उपयोग

ClawHub OpenClaw के लिए Skills, plugins, packages, और marketplace metadata होस्ट करता है।
यह तय करने के लिए इस पेज का उपयोग करें कि सामग्री या प्रकाशन व्यवहार
ClawHub पर होना चाहिए या नहीं।

ये नियम इस पर लागू होते हैं कि कोई लिस्टिंग क्या करती है, वह उपयोगकर्ताओं से क्या चलाने को कहती है, वह खुद को कैसे
प्रस्तुत करती है, और प्रकाशक ClawHub की खोज, इंस्टॉल, और
भरोसे की सतहों का उपयोग कैसे करते हैं। मॉडरेशन अवस्थाओं और खाते की स्थिति के लिए, देखें
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation)। कॉपीराइट या अन्य अधिकारों के
दावों के लिए, देखें [सामग्री अधिकार अनुरोध](/clawhub/content-rights)।

## अनुमत सामग्री

ClawHub ऐसी सामग्री का स्वागत करता है जो उपयोगी, समझने योग्य, और सद्भावना से
प्रकाशित हो।

| श्रेणी                                           | कब अनुमत है                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| डेवलपर उत्पादकता                                | लिस्टिंग उपयोगकर्ताओं को सॉफ़्टवेयर बनाने, टेस्ट करने, माइग्रेट करने, डीबग करने, दस्तावेज़ित करने, या संचालित करने में मदद करती है। |
| UI, डेटा, और ऑटोमेशन workflows                  | दायरा स्पष्ट है, आवश्यक credentials स्पष्ट हैं, और जोखिम भरी कार्रवाइयों में समीक्षा, dry-run, preview, या confirmation paths शामिल हैं। |
| रक्षात्मक सुरक्षा, मॉडरेशन, और दुरुपयोग समीक्षा | टूल अधिकृत समीक्षा के लिए प्रस्तुत किया गया है, साक्ष्य सुरक्षित रखता है, और मानव अनुमोदन सीमाओं को स्पष्ट रखता है।              |
| व्यक्तिगत या टीम workflows                      | workflow सहमति-आधारित खातों, पारदर्शी सेटअप, और स्पष्ट permissions का उपयोग करता है।                                            |
| मेंटेन किए गए catalogs                          | हर लिस्टिंग अलग, उपयोगी, सटीक रूप से वर्णित, और उचित रूप से मेंटेन की गई है।                                                     |

संदर्भ मायने रखता है। वही विषय संकीर्ण रक्षात्मक या
सहमति-आधारित सेटिंग में स्वीकार्य हो सकता है और दुरुपयोग workflow के रूप में पैक किए जाने पर अस्वीकार्य।

## निषिद्ध सामग्री

ClawHub ऐसी सामग्री होस्ट नहीं करता जिसका मुख्य उद्देश्य दुरुपयोग, छल, असुरक्षित
execution, या अधिकार उल्लंघन हो।

| श्रेणी                                                       | अनुमत नहीं                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| अनधिकृत access या security bypass                           | Auth bypass, account takeover, rate-limit abuse, live call या agent takeover, reusable session theft, या अस्वीकृत उपयोगकर्ताओं के लिए pairing flows को auto-approve करना।                                                                                                                                     |
| Platform दुरुपयोग और ban evasion                            | प्रतिबंधों के बाद stealth accounts, account warming या farming, fake engagement, multi-account automation, mass posting, spam bots, या detection से बचने के लिए बनाया गया automation।                                                                                                                        |
| धोखाधड़ी, scams, और भ्रामक financial workflows              | नकली certificates या invoices, भ्रामक payment flows, scam outreach, fake social proof, fraud के लिए synthetic-identity workflows, या स्पष्ट मानव अनुमोदन के बिना spending/charging tools।                                                                                                                    |
| Privacy-invasive enrichment या surveillance                  | spam के लिए contact scraping, doxxing, stalking, unsolicited outreach के साथ lead extraction, covert monitoring, non-consensual biometric matching, या leaked data या breach dumps का उपयोग।                                                                                                                  |
| Non-consensual impersonation या identity manipulation        | Face swap, digital twins, cloned influencers, fake personas, या impersonate या mislead करने के लिए उपयोग किए जाने वाले अन्य tooling।                                                                                                                                                                         |
| स्पष्ट sexual content या safety-disabled adult generation    | NSFW image, video, या content generation; third-party APIs के इर्द-गिर्द adult-content wrappers; या ऐसी listings जिनका प्राथमिक उद्देश्य स्पष्ट sexual content हो।                                                                                                                                             |
| छिपी हुई, असुरक्षित, या भ्रामक execution requirements        | Obfuscated install commands, pipe-to-shell installers जैसे कि डाउनलोड की गई सामग्री को स्पष्ट reviewability के बिना `sh` या `bash` से चलाना, अघोषित secret या private-key requirements, स्पष्ट reviewability के बिना remote `npx @latest` execution, या ऐसा metadata जो छिपाता है कि लिस्टिंग को चलने के लिए वास्तव में क्या चाहिए। |
| Copyright-infringing या rights-violating material            | अनुमति के बिना किसी और की skill, plugin, docs, brand assets, या proprietary code को दोबारा प्रकाशित करना; license terms का उल्लंघन करना; या मूल author या publisher का impersonation करना।                                                                                                                   |

## निषिद्ध marketplace व्यवहार

ClawHub यह भी समीक्षा करता है कि प्रकाशक marketplace का उपयोग कैसे करते हैं। ClawHub का उपयोग
discovery, metrics, trust signals, moderation systems, या user
attention में हेरफेर करने के लिए न करें।

निषिद्ध marketplace व्यवहार में शामिल हैं:

- बहुत बड़ी संख्या में low-effort, duplicative, placeholder, या
  machine-generated listings को bulk में प्रकाशित करना जिनमें वास्तविक user value दिखाई नहीं देती
- search या category surfaces को लगभग समान Skills या plugins से भर देना
- ऐसी सैकड़ों listings प्रकाशित करना जिनमें usage, maintenance, source
  clarity, या meaningful differentiation बहुत कम या बिल्कुल नहीं हो
- automation, self-install loops, fake accounts, coordinated
  activity, paid engagement, या अन्य non-organic behavior के माध्यम से installs, downloads, stars, या अन्य engagement
  metrics को कृत्रिम रूप से बढ़ाना
- moderation, bans, publisher limits, या
  marketplace review से बचने के लिए accounts बनाना या rotate करना
- ownership, source, capabilities, security posture,
  install requirements, या किसी अन्य project या publisher से affiliation के बारे में users को भ्रमित करना
- underlying issue को ठीक किए बिना ऐसी content को बार-बार upload करना जिसे पहले ही hidden, removed, या blocked
  किया जा चुका है

High-volume publishing अपने आप में abuse नहीं है। बड़े catalogs तब स्वीकार्य हैं
जब listings अर्थपूर्ण रूप से अलग, सटीक रूप से वर्णित, मेंटेन की गई,
और वास्तविक users द्वारा उपयोग की जाती हों। बड़े catalogs trust और safety समस्या तब बनते हैं जब
volume को thin, duplicative, misleading, unmaintained, या
artificially promoted listings के साथ जोड़ा जाता है।

## सामग्री अधिकार

यदि आपको लगता है कि ClawHub पर मौजूद content आपके copyright या अन्य rights का उल्लंघन करता है, तो
[सामग्री अधिकार अनुरोध](/clawhub/content-rights) का उपयोग करें। Copyright या rights claims के लिए सामान्य marketplace
reports का उपयोग न करें, जब तक कि listing असुरक्षित,
malicious, या misleading भी न हो।

## समीक्षा और enforcement

ClawHub असुरक्षित content या abusive publishing behavior की पहचान करने के लिए automated checks, statistical abuse signals, user reports, और
staff review का उपयोग कर सकता है। कोई signal अपने आप abuse साबित नहीं करता; यह ClawHub को यह तय करने में मदद करता है कि किस चीज़ की समीक्षा चाहिए।

हम कर सकते हैं:

- violating listings को hide, hold, remove, soft-delete, या, जहाँ resource type के लिए supported हो,
  hard-delete करना
- unsafe releases के लिए downloads या installs को block करना
- API tokens को revoke करना
- associated content को soft-delete करना
- publishing access को restrict करना
- repeat या severe offenders को ban करना

स्पष्ट abuse के लिए हम warning-first enforcement की गारंटी नहीं देते। Reports, moderation holds,
hidden listings, bans, और account standing के लिए देखें
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation)।
