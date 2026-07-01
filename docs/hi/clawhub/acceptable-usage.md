---
read_when:
    - दुरुपयोग या नीति उल्लंघनों के लिए अपलोड की समीक्षा करना
    - मॉडरेशन दस्तावेज़ या समीक्षक रनबुक लिखना
    - यह तय करना कि किसी skill को छिपाया जाना चाहिए या किसी उपयोगकर्ता को प्रतिबंधित किया जाना चाहिए
sidebarTitle: Acceptable Usage
summary: 'मार्केटप्लेस नीति: ClawHub क्या अनुमति देता है और क्या होस्ट नहीं करेगा।'
title: स्वीकार्य उपयोग
x-i18n:
    generated_at: "2026-07-01T12:58:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# स्वीकार्य उपयोग

ClawHub OpenClaw के लिए Skills, plugins, packages, और marketplace metadata होस्ट करता है।
यह तय करने के लिए इस पेज का उपयोग करें कि content या publishing behavior
ClawHub पर होना चाहिए या नहीं।

ये नियम इस पर लागू होते हैं कि listing क्या करती है, वह users से क्या चलाने को कहती है, वह स्वयं को कैसे
प्रस्तुत करती है, और publishers ClawHub के discovery, install, और
trust surfaces का उपयोग कैसे करते हैं। moderation states और account standing के लिए, देखें
[Moderation and Account Safety](/clawhub/moderation)। copyright या अन्य rights
claims के लिए, देखें [Content Rights Requests](/hi/clawhub/content-rights)।

## अनुमत content

ClawHub ऐसे content का स्वागत करता है जो उपयोगी, समझने योग्य, और good
faith में प्रकाशित हो।

| Category                                         | Allowed when                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Developer productivity                           | listing users को software बनाने, test करने, migrate करने, debug करने, document करने, या operate करने में मदद करती है।                                               |
| UI, data, and automation workflows               | scope स्पष्ट है, आवश्यक credentials स्पष्ट हैं, और जोखिम भरे actions में review, dry-run, preview, या confirmation paths शामिल हैं। |
| Defensive security, moderation, and abuse review | tool को authorized review के लिए framed किया गया है, evidence सुरक्षित रखता है, और human approval boundaries स्पष्ट रखता है।                          |
| Personal or team workflows                       | workflow consent-based accounts, transparent setup, और explicit permissions का उपयोग करता है।                                            |
| Maintained catalogs                              | हर listing अलग, उपयोगी, सटीक रूप से वर्णित, और यथोचित रूप से maintained है।                                                |

Context मायने रखता है। वही topic एक संकीर्ण defensive या
consent-based setting में स्वीकार्य हो सकता है और abuse workflow के रूप में packaged होने पर अस्वीकार्य।

## अस्वीकृत content

ClawHub ऐसा content होस्ट नहीं करता जिसका मुख्य उद्देश्य abuse, deception, unsafe
execution, या rights infringement हो।

| Category                                                    | Not allowed                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unauthorized access or security bypass                      | Auth bypass, account takeover, rate-limit abuse, live call या agent takeover, reusable session theft, या unapproved users के लिए auto-approving pairing flows।                                                                                                                                                   |
| Platform abuse and ban evasion                              | bans के बाद stealth accounts, account warming या farming, fake engagement, multi-account automation, mass posting, spam bots, या detection से बचने के लिए बनाया गया automation।                                                                                                                                          |
| Fraud, scams, and deceptive financial workflows             | fake certificates या invoices, deceptive payment flows, scam outreach, fake social proof, fraud के लिए synthetic-identity workflows, या स्पष्ट human approval के बिना spending/charging tools।                                                                                                                    |
| Privacy-invasive enrichment or surveillance                 | spam के लिए contact scraping, doxxing, stalking, unsolicited outreach के साथ paired lead extraction, covert monitoring, non-consensual biometric matching, या leaked data या breach dumps का उपयोग।                                                                                                                  |
| Non-consensual impersonation or identity manipulation       | Face swap, digital twins, cloned influencers, fake personas, या impersonate या mislead करने के लिए इस्तेमाल होने वाली अन्य tooling।                                                                                                                                                                                                 |
| Explicit sexual content or safety-disabled adult generation | NSFW image, video, या content generation; third-party APIs के around adult-content wrappers; या listings जिनका primary purpose explicit sexual content है।                                                                                                                                                       |
| Hidden, unsafe, or misleading execution requirements        | Obfuscated install commands, pipe-to-shell installers जैसे downloaded content जिसे स्पष्ट reviewability के बिना `sh` या `bash` से चलाया जाता है, undeclared secret या private-key requirements, स्पष्ट reviewability के बिना remote `npx @latest` execution, या metadata जो listing को चलाने के लिए वास्तव में क्या चाहिए इसे छिपाता है। |
| Copyright-infringing or rights-violating material           | permission के बिना किसी और की skill, plugin, docs, brand assets, या proprietary code को republish करना; license terms का उल्लंघन करना; या original author या publisher का impersonation करना।                                                                                                                            |

## अस्वीकृत marketplace behavior

ClawHub यह भी review करता है कि publishers marketplace का उपयोग कैसे करते हैं। ClawHub का उपयोग
discovery, metrics, trust signals, moderation systems, या user
attention में हेरफेर करने के लिए न करें।

अस्वीकृत marketplace behavior में शामिल हैं:

- बड़ी संख्या में low-effort, duplicative, placeholder, या
  machine-generated listings को bulk publish करना जिनमें वास्तविक user value नहीं दिखती
- search या category surfaces को लगभग identical Skills या plugins से flood करना
- बहुत कम या बिना usage, maintenance, source
  clarity, या meaningful differentiation वाली सैकड़ों listings publish करना
- automation, self-install loops, fake accounts, coordinated
  activity, paid engagement, या अन्य non-organic behavior के माध्यम से installs, downloads, stars, या अन्य engagement
  metrics को artificial रूप से inflate करना
- moderation, bans, publisher limits, या
  marketplace review से बचने के लिए accounts बनाना या rotate करना
- ownership, source, capabilities, security posture,
  install requirements, या किसी अन्य project या publisher से affiliation के बारे में users को mislead करना
- underlying issue ठीक किए बिना ऐसा content बार-बार upload करना जो पहले से hidden, removed, या blocked
  हो चुका है

High-volume publishing अपने-आप abuse नहीं है। Large catalogs तब स्वीकार्य हैं
जब listings meaningfully different, accurately described, maintained,
और real users द्वारा used हों। Large catalogs trust और safety problem तब बनते हैं जब
volume thin, duplicative, misleading, unmaintained, या
artificially promoted listings के साथ paired हो।

## Content rights

यदि आपको लगता है कि ClawHub पर content आपके copyright या अन्य rights का उल्लंघन करता है, तो
[Content Rights Requests](/hi/clawhub/content-rights) का उपयोग करें। copyright या rights claims के लिए normal marketplace
reports का उपयोग न करें, जब तक कि listing unsafe,
malicious, या misleading भी न हो।

## Review और enforcement

ClawHub unsafe content या abusive publishing behavior की पहचान करने के लिए automated checks, statistical abuse signals, user reports, और
staff review का उपयोग कर सकता है। कोई signal
अपने-आप abuse साबित नहीं करता; यह ClawHub को यह तय करने में मदद करता है कि किसे review की आवश्यकता है।

हम कर सकते हैं:

- violating listings को hide, hold, remove, soft-delete, या, जहां resource type के लिए supported हो,
  hard-delete करना
- unsafe releases के लिए downloads या installs block करना
- API tokens revoke करना
- associated content soft-delete करना
- publishing access restrict करना
- repeat या severe offenders को ban करना

हम obvious abuse के लिए warning-first enforcement की guarantee नहीं देते। reports, moderation holds,
hidden listings, bans, और account standing के लिए
[Moderation and Account Safety](/clawhub/moderation) देखें।
