---
read_when:
    - दुरुपयोग या नीति उल्लंघनों के लिए अपलोड की समीक्षा करना
    - मॉडरेशन दस्तावेज़ या समीक्षक रनबुक लिखना
    - यह तय करना कि किसी कौशल को छिपाया जाना चाहिए या किसी उपयोगकर्ता को प्रतिबंधित किया जाना चाहिए
sidebarTitle: Acceptable Usage
summary: 'Marketplace नीति: ClawHub क्या अनुमति देता है और क्या होस्ट नहीं करेगा।'
title: स्वीकार्य उपयोग
x-i18n:
    generated_at: "2026-07-02T14:02:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# स्वीकार्य उपयोग

ClawHub OpenClaw के लिए Skills, plugins, पैकेज और marketplace मेटाडेटा होस्ट करता है।
इस पेज का उपयोग यह तय करने के लिए करें कि सामग्री या प्रकाशन व्यवहार
ClawHub पर होना चाहिए या नहीं।

ये नियम इस बात पर लागू होते हैं कि कोई लिस्टिंग क्या करती है, वह उपयोगकर्ताओं से क्या चलाने को कहती है, वह स्वयं को कैसे
प्रस्तुत करती है, और प्रकाशक ClawHub की खोज, इंस्टॉल और
विश्वास सतहों का उपयोग कैसे करते हैं। मॉडरेशन स्थितियों और खाते की स्थिति के लिए,
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation) देखें। कॉपीराइट या अन्य अधिकारों के
दावों के लिए, [सामग्री अधिकार अनुरोध](/hi/clawhub/content-rights) देखें।

## अनुमत सामग्री

ClawHub ऐसी सामग्री का स्वागत करता है जो उपयोगी, समझने योग्य और सद्भावना में
प्रकाशित हो।

| श्रेणी                                         | कब अनुमत है                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| डेवलपर उत्पादकता                           | लिस्टिंग उपयोगकर्ताओं को सॉफ़्टवेयर बनाने, परीक्षण करने, माइग्रेट करने, डीबग करने, दस्तावेज़ित करने या संचालित करने में मदद करती है।                                               |
| UI, डेटा और ऑटोमेशन workflows               | दायरा स्पष्ट है, आवश्यक क्रेडेंशियल स्पष्ट हैं, और जोखिमपूर्ण कार्रवाइयों में समीक्षा, dry-run, preview या पुष्टि के रास्ते शामिल हैं। |
| रक्षात्मक सुरक्षा, मॉडरेशन और दुरुपयोग समीक्षा | टूल को अधिकृत समीक्षा के लिए प्रस्तुत किया गया है, साक्ष्य सुरक्षित रखता है, और मानवीय अनुमोदन सीमाओं को स्पष्ट रखता है।                          |
| व्यक्तिगत या टीम workflows                       | workflow सहमति-आधारित खातों, पारदर्शी सेटअप और स्पष्ट अनुमतियों का उपयोग करता है।                                            |
| अनुरक्षित catalogs                              | प्रत्येक लिस्टिंग अलग, उपयोगी, सटीक रूप से वर्णित और उचित रूप से अनुरक्षित है।                                                |

संदर्भ मायने रखता है। वही विषय संकीर्ण रक्षात्मक या
सहमति-आधारित संदर्भ में स्वीकार्य हो सकता है और दुरुपयोग workflow के रूप में पैक किए जाने पर अस्वीकार्य हो सकता है।

## निषिद्ध सामग्री

ClawHub ऐसी सामग्री होस्ट नहीं करता जिसका मुख्य उद्देश्य दुरुपयोग, धोखाधड़ी, असुरक्षित
निष्पादन या अधिकार उल्लंघन हो।

| श्रेणी                                                    | अनुमत नहीं है                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| अनधिकृत पहुंच या सुरक्षा बाइपास                      | Auth बाइपास, खाता अधिग्रहण, rate-limit दुरुपयोग, लाइव कॉल या एजेंट अधिग्रहण, पुन: उपयोग योग्य सत्र चोरी, या अस्वीकृत उपयोगकर्ताओं के लिए pairing flows को स्वतः-स्वीकृत करना।                                                                                                                                                   |
| प्लेटफ़ॉर्म दुरुपयोग और ban evasion                              | प्रतिबंधों के बाद stealth खाते, account warming या farming, नकली engagement, multi-account automation, बड़े पैमाने पर पोस्टिंग, spam bots, या detection से बचने के लिए बनाया गया automation।                                                                                                                                          |
| धोखाधड़ी, scams और भ्रामक वित्तीय workflows             | नकली प्रमाणपत्र या इनवॉइस, भ्रामक भुगतान flows, scam outreach, नकली social proof, धोखाधड़ी के लिए synthetic-identity workflows, या स्पष्ट मानवीय अनुमोदन के बिना खर्च/चार्ज करने वाले टूल।                                                                                                                    |
| निजता-आक्रामक enrichment या निगरानी                 | spam के लिए contact scraping, doxxing, stalking, अनचाहे outreach के साथ lead extraction, गुप्त निगरानी, गैर-सहमति वाला biometric matching, या leaked data या breach dumps का उपयोग।                                                                                                                  |
| गैर-सहमति impersonation या पहचान manipulation       | Face swap, digital twins, cloned influencers, fake personas, या impersonate या mislead करने के लिए उपयोग किए जाने वाले अन्य tooling।                                                                                                                                                                                                 |
| स्पष्ट यौन सामग्री या safety-disabled adult generation | NSFW image, video या content generation; third-party APIs के आसपास adult-content wrappers; या ऐसी listings जिनका प्राथमिक उद्देश्य स्पष्ट यौन सामग्री है।                                                                                                                                                       |
| छिपी, असुरक्षित या भ्रामक निष्पादन आवश्यकताएं        | अस्पष्ट install commands, pipe-to-shell installers जैसे डाउनलोड की गई सामग्री जिसे स्पष्ट reviewability के बिना `sh` या `bash` से चलाया जाता है, अघोषित secret या private-key आवश्यकताएं, स्पष्ट reviewability के बिना remote `npx @latest` execution, या ऐसा metadata जो छिपाता है कि listing को वास्तव में चलने के लिए क्या चाहिए। |
| कॉपीराइट-उल्लंघनकारी या अधिकार-उल्लंघनकारी सामग्री           | अनुमति के बिना किसी और की skill, plugin, docs, brand assets या proprietary code को फिर से प्रकाशित करना; license terms का उल्लंघन करना; या मूल लेखक या प्रकाशक का impersonation करना।                                                                                                                            |

## निषिद्ध marketplace व्यवहार

ClawHub यह भी समीक्षा करता है कि प्रकाशक marketplace का उपयोग कैसे करते हैं। ClawHub का उपयोग
खोज, metrics, trust signals, moderation systems या उपयोगकर्ता
ध्यान में हेरफेर करने के लिए न करें।

निषिद्ध marketplace व्यवहार में शामिल हैं:

- बड़ी संख्या में low-effort, duplicative, placeholder या
  machine-generated listings को bulk publish करना, जिनमें वास्तविक उपयोगकर्ता मूल्य दिखाई नहीं देता
- search या category surfaces को लगभग समान skills या plugins से भर देना
- सैकड़ों listings प्रकाशित करना जिनमें उपयोग, रखरखाव, स्रोत
  स्पष्टता या सार्थक भिन्नता बहुत कम या बिल्कुल नहीं है
- automation, self-install loops, fake accounts, coordinated
  activity, paid engagement, या अन्य non-organic व्यवहार के माध्यम से installs, downloads, stars या अन्य engagement
  metrics को कृत्रिम रूप से बढ़ाना
- moderation, bans, publisher limits या
  marketplace review से बचने के लिए खाते बनाना या बदलते रहना
- ownership, source, capabilities, security posture,
  install requirements, या किसी अन्य project या publisher से affiliation के बारे में उपयोगकर्ताओं को गुमराह करना
- ऐसी सामग्री बार-बार upload करना जिसे पहले ही hidden, removed या blocked किया जा चुका है
  और मूल समस्या को ठीक न करना

High-volume publishing अपने आप दुरुपयोग नहीं है। बड़े catalogs तब स्वीकार्य हैं
जब listings सार्थक रूप से अलग, सटीक रूप से वर्णित, अनुरक्षित
और वास्तविक उपयोगकर्ताओं द्वारा उपयोग की जाती हों। बड़े catalogs trust और safety समस्या तब बनते हैं जब
volume के साथ thin, duplicative, misleading, unmaintained या
artificially promoted listings जुड़ी हों।

## सामग्री अधिकार

अगर आपको लगता है कि ClawHub पर सामग्री आपके copyright या अन्य अधिकारों का उल्लंघन करती है, तो
[सामग्री अधिकार अनुरोध](/hi/clawhub/content-rights) का उपयोग करें। copyright या rights claims के लिए सामान्य marketplace
reports का उपयोग न करें, जब तक कि listing असुरक्षित,
malicious या misleading भी न हो।

## समीक्षा और प्रवर्तन

ClawHub असुरक्षित सामग्री या दुरुपयोगपूर्ण प्रकाशन व्यवहार की पहचान करने के लिए automated checks, statistical abuse signals, user reports और
staff review का उपयोग कर सकता है। कोई signal
अपने आप दुरुपयोग साबित नहीं करता; यह ClawHub को यह तय करने में मदद करता है कि किस चीज़ की समीक्षा आवश्यक है।

हम कर सकते हैं:

- उल्लंघनकारी listings को hide, hold, remove, soft-delete, या resource type के लिए समर्थित होने पर,
  hard-delete करना
- असुरक्षित releases के लिए downloads या installs को block करना
- API tokens रद्द करना
- संबंधित सामग्री को soft-delete करना
- publishing access को सीमित करना
- repeat या severe offenders को ban करना

स्पष्ट दुरुपयोग के लिए हम warning-first enforcement की गारंटी नहीं देते। reports, moderation holds,
hidden listings, bans और account standing के लिए
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation) देखें।
