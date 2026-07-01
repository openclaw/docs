---
read_when:
    - दुरुपयोग या नीति उल्लंघनों के लिए अपलोड की समीक्षा करना
    - मॉडरेशन दस्तावेज़ या समीक्षक रनबुक लिखना
    - यह तय करना कि किसी कौशल को छिपाया जाना चाहिए या किसी उपयोगकर्ता पर प्रतिबंध लगाया जाना चाहिए
sidebarTitle: Acceptable Usage
summary: 'Marketplace नीति: ClawHub क्या अनुमति देता है और क्या होस्ट नहीं करेगा।'
title: स्वीकार्य उपयोग
x-i18n:
    generated_at: "2026-07-01T05:39:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# स्वीकार्य उपयोग

ClawHub, OpenClaw के लिए skills, plugins, packages, और marketplace metadata होस्ट करता है।
इस पेज का उपयोग यह तय करने के लिए करें कि सामग्री या प्रकाशन व्यवहार
ClawHub पर होना चाहिए या नहीं।

ये नियम इस पर लागू होते हैं कि कोई listing क्या करती है, वह users से क्या चलाने को कहती है, वह
खुद को कैसे प्रस्तुत करती है, और publishers ClawHub की खोज, इंस्टॉल, और
trust surfaces का उपयोग कैसे करते हैं। moderation states और account standing के लिए, देखें
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation)। copyright या अन्य rights
claims के लिए, देखें [सामग्री अधिकार अनुरोध](/clawhub/content-rights)।

## अनुमत सामग्री

ClawHub ऐसी सामग्री का स्वागत करता है जो उपयोगी, समझने योग्य, और सद्भावना से
प्रकाशित हो।

| श्रेणी                                         | कब अनुमत है                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| डेवलपर उत्पादकता                           | listing users को software build, test, migrate, debug, document, या operate करने में मदद करती है।                                               |
| UI, data, और automation workflows               | scope स्पष्ट है, required credentials स्पष्ट हैं, और जोखिमपूर्ण actions में review, dry-run, preview, या confirmation paths शामिल हैं। |
| रक्षात्मक सुरक्षा, moderation, और abuse review | tool authorized review के लिए प्रस्तुत है, evidence सुरक्षित रखता है, और human approval boundaries स्पष्ट रखता है।                          |
| व्यक्तिगत या team workflows                       | workflow consent-based accounts, transparent setup, और explicit permissions का उपयोग करता है।                                            |
| Maintained catalogs                              | हर listing अलग, उपयोगी, सटीक रूप से वर्णित, और यथोचित रूप से maintained है।                                                |

Context मायने रखता है। वही विषय एक संकीर्ण defensive या
consent-based setting में स्वीकार्य हो सकता है और abuse workflow के रूप में packaged होने पर अस्वीकार्य हो सकता है।

## निषिद्ध सामग्री

ClawHub ऐसी सामग्री होस्ट नहीं करता जिसका मुख्य उद्देश्य abuse, deception, unsafe
execution, या rights infringement हो।

| श्रेणी                                                    | अनुमत नहीं है                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unauthorized access या security bypass                      | Auth bypass, account takeover, rate-limit abuse, live call या agent takeover, reusable session theft, या unapproved users के लिए auto-approving pairing flows।                                                                                                                                                   |
| Platform abuse और ban evasion                              | bans के बाद stealth accounts, account warming या farming, fake engagement, multi-account automation, mass posting, spam bots, या detection से बचने के लिए बनाई गई automation।                                                                                                                                          |
| Fraud, scams, और deceptive financial workflows             | Fake certificates या invoices, deceptive payment flows, scam outreach, fake social proof, fraud के लिए synthetic-identity workflows, या clear human approval के बिना spending/charging tools।                                                                                                                    |
| Privacy-invasive enrichment या surveillance                 | spam के लिए contact scraping, doxxing, stalking, unsolicited outreach के साथ lead extraction, covert monitoring, non-consensual biometric matching, या leaked data या breach dumps का उपयोग।                                                                                                                  |
| Non-consensual impersonation या identity manipulation       | Face swap, digital twins, cloned influencers, fake personas, या impersonate या mislead करने के लिए उपयोग किए जाने वाले अन्य tooling।                                                                                                                                                                                                 |
| स्पष्ट sexual content या safety-disabled adult generation | NSFW image, video, या content generation; third-party APIs के इर्द-गिर्द adult-content wrappers; या ऐसी listings जिनका प्राथमिक उद्देश्य स्पष्ट sexual content है।                                                                                                                                                       |
| छिपी हुई, unsafe, या misleading execution requirements        | Obfuscated install commands, pipe-to-shell installers जैसे downloaded content को स्पष्ट reviewability के बिना `sh` या `bash` से चलाना, undeclared secret या private-key requirements, clear reviewability के बिना remote `npx @latest` execution, या metadata जो छिपाता है कि listing को चलाने के लिए वास्तव में क्या चाहिए। |
| Copyright-infringing या rights-violating material           | अनुमति के बिना किसी और के skill, plugin, docs, brand assets, या proprietary code को फिर से प्रकाशित करना; license terms का उल्लंघन करना; या original author या publisher का impersonation करना।                                                                                                                            |

## निषिद्ध marketplace व्यवहार

ClawHub यह भी review करता है कि publishers marketplace का उपयोग कैसे करते हैं। ClawHub का उपयोग
discovery, metrics, trust signals, moderation systems, या user
attention को manipulate करने के लिए न करें।

निषिद्ध marketplace व्यवहार में शामिल हैं:

- बड़ी संख्या में low-effort, duplicative, placeholder, या
  machine-generated listings को bulk publishing करना, जिनमें वास्तविक user value नहीं दिखती
- search या category surfaces को लगभग identical skills या plugins से flood करना
- सैकड़ों listings प्रकाशित करना जिनमें बहुत कम या कोई usage, maintenance, source
  clarity, या meaningful differentiation न हो
- automation, self-install loops, fake accounts, coordinated
  activity, paid engagement, या अन्य non-organic behavior के माध्यम से installs, downloads, stars, या अन्य engagement
  metrics को artificial रूप से बढ़ाना
- moderation, bans, publisher limits, या
  marketplace review से बचने के लिए accounts बनाना या rotate करना
- ownership, source, capabilities, security posture,
  install requirements, या किसी अन्य project या publisher से affiliation के बारे में users को mislead करना
- underlying issue ठीक किए बिना ऐसी content को बार-बार upload करना जो पहले ही hidden, removed, या blocked
  की जा चुकी है

High-volume publishing अपने आप abuse नहीं है। बड़े catalogs स्वीकार्य हैं
जब listings meaningfully different, accurately described, maintained,
और real users द्वारा used हों। बड़े catalogs trust और safety problem बन जाते हैं जब
volume thin, duplicative, misleading, unmaintained, या
artificially promoted listings के साथ जुड़ता है।

## सामग्री अधिकार

यदि आपको लगता है कि ClawHub पर कोई content आपके copyright या अन्य rights का उल्लंघन करता है, तो
[सामग्री अधिकार अनुरोध](/clawhub/content-rights) का उपयोग करें। copyright या rights claims के लिए सामान्य marketplace
reports का उपयोग न करें, जब तक listing unsafe,
malicious, या misleading भी न हो।

## Review और enforcement

ClawHub unsafe content या abusive publishing behavior की पहचान करने के लिए automated checks, statistical abuse signals, user reports, और
staff review का उपयोग कर सकता है। कोई signal
अपने आप abuse साबित नहीं करता; यह ClawHub को यह तय करने में मदद करता है कि क्या review चाहिए।

हम कर सकते हैं:

- violating listings को hide, hold, remove, soft-delete, या, जहां resource type के लिए supported हो,
  hard-delete करना
- unsafe releases के लिए downloads या installs block करना
- API tokens revoke करना
- associated content soft-delete करना
- publishing access restrict करना
- repeat या severe offenders को ban करना

हम obvious abuse के लिए warning-first enforcement की guarantee नहीं देते। reports, moderation holds,
hidden listings, bans, और account standing के लिए देखें
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation)।
