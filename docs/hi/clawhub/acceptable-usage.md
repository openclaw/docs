---
read_when:
    - दुरुपयोग या नीति उल्लंघनों के लिए अपलोड की समीक्षा करना
    - मॉडरेशन दस्तावेज़ या समीक्षक रनबुक लिखना
    - यह तय करना कि किसी skill को छिपाया जाना चाहिए या किसी उपयोगकर्ता को प्रतिबंधित किया जाना चाहिए
sidebarTitle: Acceptable Usage
summary: 'मार्केटप्लेस नीति: ClawHub क्या अनुमति देता है और क्या होस्ट नहीं करेगा।'
title: स्वीकार्य उपयोग
x-i18n:
    generated_at: "2026-07-02T17:36:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# स्वीकार्य उपयोग

ClawHub OpenClaw के लिए Skills, plugins, packages और marketplace metadata होस्ट करता है।
यह तय करने के लिए इस पृष्ठ का उपयोग करें कि content या publishing behavior
ClawHub पर होना चाहिए या नहीं।

ये नियम इस पर लागू होते हैं कि कोई listing क्या करती है, वह users से क्या चलाने को कहती है, वह
खुद को कैसे प्रस्तुत करती है, और publishers ClawHub की discovery, install, और
trust surfaces का उपयोग कैसे करते हैं। moderation states और account standing के लिए, देखें
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation)। copyright या अन्य rights
claims के लिए, देखें [content rights requests](/clawhub/content-rights)।

## अनुमत content

ClawHub ऐसे content का स्वागत करता है जो उपयोगी, समझने योग्य, और good
faith में प्रकाशित हो।

| Category                                         | कब अनुमति है                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Developer productivity                           | listing users को software बनाने, test करने, migrate करने, debug करने, document करने, या operate करने में मदद करती है।                                               |
| UI, data, and automation workflows               | scope स्पष्ट है, required credentials स्पष्ट हैं, और जोखिम भरी actions में review, dry-run, preview, या confirmation paths शामिल हैं। |
| Defensive security, moderation, and abuse review | tool को authorized review के लिए प्रस्तुत किया गया है, evidence सुरक्षित रखता है, और human approval boundaries को स्पष्ट रखता है।                          |
| Personal or team workflows                       | workflow consent-based accounts, transparent setup, और explicit permissions का उपयोग करता है।                                            |
| Maintained catalogs                              | प्रत्येक listing अलग, उपयोगी, सटीक रूप से वर्णित, और उचित रूप से maintained है।                                                |

Context महत्वपूर्ण है। वही topic संकीर्ण defensive या
consent-based setting में स्वीकार्य हो सकता है और abuse workflow के रूप में packaged होने पर अस्वीकार्य हो सकता है।

## निषिद्ध content

ClawHub ऐसा content होस्ट नहीं करता जिसका मुख्य purpose abuse, deception, unsafe
execution, या rights infringement हो।

| Category                                                    | अनुमति नहीं है                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unauthorized access or security bypass                      | Auth bypass, account takeover, rate-limit abuse, live call या agent takeover, reusable session theft, या unapproved users के लिए auto-approving pairing flows।                                                                                                                                                   |
| Platform abuse and ban evasion                              | bans के बाद stealth accounts, account warming या farming, fake engagement, multi-account automation, mass posting, spam bots, या detection से बचने के लिए built automation।                                                                                                                                          |
| Fraud, scams, and deceptive financial workflows             | fake certificates या invoices, deceptive payment flows, scam outreach, fake social proof, fraud के लिए synthetic-identity workflows, या स्पष्ट human approval के बिना spending/charging tools।                                                                                                                    |
| Privacy-invasive enrichment or surveillance                 | spam के लिए contact scraping, doxxing, stalking, unsolicited outreach के साथ lead extraction, covert monitoring, non-consensual biometric matching, या leaked data या breach dumps का उपयोग।                                                                                                                  |
| Non-consensual impersonation or identity manipulation       | Face swap, digital twins, cloned influencers, fake personas, या impersonate या mislead करने के लिए उपयोग किए जाने वाले अन्य tooling।                                                                                                                                                                                                 |
| Explicit sexual content or safety-disabled adult generation | NSFW image, video, या content generation; third-party APIs के आसपास adult-content wrappers; या ऐसी listings जिनका primary purpose explicit sexual content है।                                                                                                                                                       |
| Hidden, unsafe, or misleading execution requirements        | Obfuscated install commands, pipe-to-shell installers जैसे downloaded content को `sh` या `bash` के साथ बिना clear reviewability के चलाना, undeclared secret या private-key requirements, बिना clear reviewability के remote `npx @latest` execution, या ऐसा metadata जो छिपाता है कि listing को वास्तव में चलाने के लिए क्या चाहिए। |
| Copyright-infringing or rights-violating material           | permission के बिना किसी और की skill, plugin, docs, brand assets, या proprietary code को republish करना; license terms का उल्लंघन; या original author या publisher का impersonation करना।                                                                                                                            |

## निषिद्ध marketplace behavior

ClawHub यह भी review करता है कि publishers marketplace का उपयोग कैसे करते हैं। ClawHub का उपयोग
discovery, metrics, trust signals, moderation systems, या user
attention को manipulate करने के लिए न करें।

निषिद्ध marketplace behavior में शामिल हैं:

- बड़ी संख्या में low-effort, duplicative, placeholder, या
  machine-generated listings को bulk publishing करना जिनमें real user value दिखाई नहीं देती
- search या category surfaces को लगभग identical skills या plugins से भर देना
- ऐसी सैकड़ों listings publish करना जिनमें usage, maintenance, source
  clarity, या meaningful differentiation बहुत कम या न के बराबर हो
- automation, self-install loops, fake accounts, coordinated
  activity, paid engagement, या अन्य non-organic behavior के माध्यम से installs, downloads, stars, या अन्य engagement
  metrics को कृत्रिम रूप से बढ़ाना
- moderation, bans, publisher limits, या
  marketplace review से बचने के लिए accounts बनाना या rotate करना
- ownership, source, capabilities, security posture,
  install requirements, या किसी अन्य project या publisher से affiliation के बारे में users को mislead करना
- underlying issue को ठीक किए बिना ऐसे content को बार-बार upload करना जिसे पहले ही hidden, removed, या blocked किया जा चुका है

High-volume publishing अपने-आप abuse नहीं है। Large catalogs स्वीकार्य हैं
जब listings meaningfully different, accurately described, maintained,
और real users द्वारा used हों। Large catalogs trust और safety problem बन जाते हैं जब
volume thin, duplicative, misleading, unmaintained, या
artificially promoted listings के साथ paired हो।

## Content rights

यदि आपको लगता है कि ClawHub पर content आपके copyright या अन्य rights का उल्लंघन करता है, तो
[content rights requests](/clawhub/content-rights) का उपयोग करें। copyright या rights claims के लिए normal marketplace
reports का उपयोग न करें, जब तक कि listing unsafe,
malicious, या misleading भी न हो।

## Review और enforcement

ClawHub unsafe content या abusive publishing behavior की पहचान करने के लिए automated checks, statistical abuse signals, user reports, और
staff review का उपयोग कर सकता है। कोई signal
अपने-आप abuse साबित नहीं करता; यह ClawHub को यह तय करने में मदद करता है कि किसे review की जरूरत है।

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
