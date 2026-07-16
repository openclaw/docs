---
read_when:
    - क्लाउड वर्कर प्रोविज़निंग, वर्कर मोड या सेशन हैंडऑफ़ को डिज़ाइन या कार्यान्वित करना
    - परिवेशों.*, वर्कर प्रोटोकॉल, ट्रांसक्रिप्ट अंतर्ग्रहण, या इन्फ़रेंस प्रॉक्सी RPCs को बदलना
    - रिमोट एजेंट निष्पादन की सुरक्षा स्थिति की समीक्षा करना
summary: Gateway-प्रॉक्सी किए गए इन्फ़रेंस और लाइव साइडबार स्ट्रीमिंग के साथ क्षणिक SSH-पहुँच योग्य मशीनों पर एजेंट सत्र चलाएँ।
title: क्लाउड वर्कर्स योजना
x-i18n:
    generated_at: "2026-07-16T15:48:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## स्थिति

प्रस्ताव, संशोधन 3। कार्यान्वित नहीं। दिशा पर 2026-07 में सहमति हुई; संशोधन 2 में प्रतिकूल समीक्षा के निष्कर्ष शामिल किए गए (समर्पित वर्कर प्रोटोकॉल, प्लेसमेंट/एनवायरनमेंट स्टेट मशीनें, git-जागरूक इनबाउंड सिंक, एकतरफ़ा v1 हैंडऑफ़, नियंत्रित-इग्रेस सुरक्षा शब्दावली)। संशोधन 3 सिंक स्वामित्व मॉडल को अंतिम रूप देता है (वर्कर कमिट लिखता है, Gateway उन्हें अपनाकर प्रकाशित करता है), बिना-git वाला सामान्य सिंक मोड जोड़ता है, वर्कर exec को बॉक्स के भीतर पूर्ण पहुँच पर ठीक करता है, इंटरनेट नीति को प्रोविज़निंग समय पर ले जाता है, और एजेंट डिस्पैच को माइलस्टोन 3 में पुनर्स्थापित करता है।

## समस्या

OpenClaw एजेंट सेशन अपना लूप, टूल और इन्फ़रेंस एक मशीन पर Gateway प्रोसेस के भीतर चलाते हैं। कंप्यूट उस मशीन की क्षमता तक सीमित रहता है, लंबे कार्य उसे व्यस्त रखते हैं, और समानांतर कार्य उसके संसाधनों के लिए प्रतिस्पर्धा करते हैं। होस्टेड उत्पाद (Cursor क्लाउड एजेंट, वेब पर Claude Code, Codex क्लाउड) प्रति-कार्य अस्थायी क्लाउड सैंडबॉक्स से इसे हल करते हैं, लेकिन उनके लिए विक्रेता इन्फ़्रास्ट्रक्चर और विक्रेता पर भरोसा आवश्यक होता है।

जिन ऑपरेटरों के पास पहले से अतिरिक्त मशीनें हैं (या जो उन्हें कम लागत पर लीज़ कर सकते हैं), उनके पास यह कहने का कोई तरीका नहीं है: इस सेशन को वहाँ चलाएँ, इसे किसी अन्य सेशन की तरह मेरी साइडबार में दिखाएँ, और बाद में मशीन को समाप्त कर दें।

## लक्ष्य

- एक अस्थायी रिमोट मशीन ("क्लाउड वर्कर") पर पूरा एजेंट सेशन (लूप + टूल) चलाना, जबकि सेशन Control UI में स्थानीय सेशन की तरह ही दिखाई दे और स्ट्रीम हो।
- वर्कर पर कोई स्थायी क्रेडेंशियल नहीं (न प्रोवाइडर प्रमाणीकरण, न फ़ोर्ज टोकन) और कोई प्रत्यक्ष नेटवर्क इग्रेस नहीं; बॉक्स को केवल पहुँच योग्य sshd चाहिए।
- प्रोविज़न, सिंक, रन, संग्रह, नष्ट करना — पूरी तरह स्वचालित और प्रोवाइडर-प्लगेबल (पहला प्रोवाइडर: Crabbox-शैली के लीज़ CLI)।
- चल रहे कार्य को किसी टर्न सीमा पर Gateway से वर्कर पर डिस्पैच करना, बिना ट्रांसक्रिप्ट, सेशन पहचान या (जब अनुरोध बाइट समतुल्य रहें) प्रोवाइडर कैश एफ़िनिटी खोए; परिणामों को सुरक्षित रूप से वापस लाना।
- मनुष्य (UI) और एजेंट (टूल), दोनों कार्य को क्लाउड वर्कर पर डिस्पैच कर सकें।
- कई दिनों तक चलने वाले सेशन का समर्थन; जीवनकाल नीति से निर्धारित हो, हार्ड-कोडेड सीमा से नहीं।

## गैर-लक्ष्य (v1)

- वर्करों पर कोई बाहरी कोडिंग हार्नेस (Claude Code, Codex CLI) नहीं। वर्कर सेशन केवल OpenClaw का एम्बेडेड रनर चलाते हैं। हार्नेस समर्थन v2 में ऑप्ट-इन होगा, क्योंकि हार्नेस अपने क्रेडेंशियल से स्वयं इन्फ़रेंस करते हैं।
- कोई सर्वश्रेष्ठ-N / समानांतर प्रयास फ़ैन-आउट नहीं।
- कोई VPN/टेलनेट निर्भरता नहीं। ट्रांसपोर्ट केवल SSH है।
- कोई नया सैंडबॉक्स रनटाइम नहीं। वर्कर मशीन ही आइसोलेशन सीमा है; बॉक्स के भीतर OS सैंडबॉक्सिंग बाद में अतिरिक्त परत के रूप में जोड़ी जा सकती है।
- v1 में कोई सममित लाइव माइग्रेशन नहीं: डिस्पैच स्थानीय → वर्कर है; वर्कर → स्थानीय के लिए रुका हुआ सेशन और पूर्ण वर्कस्पेस मिलान आवश्यक है। लाइव द्विदिशीय हैंडऑफ़ बाद में इसी बैरियर व्यवस्था पर बनेगा।
- Gateway पर कोई JSON साइड-स्टेट नहीं; एनवायरनमेंट, प्लेसमेंट, कर्सर और ग्रांट स्थिति SQLite में रहती है।

## पूर्ववर्ती कार्य (हम क्या अपनाते हैं, क्या उलटते हैं)

- Cursor क्लाउड एजेंट: एजेंट लूप उनके क्लाउड में चलता है; VM टूल निष्पादन लक्ष्य है; केवल-जोड़ने योग्य वार्तालाप स्टोर सभी क्लाइंट को स्ट्रीम किया जाता है; इंस्टॉल के बाद स्नैपशॉट से वार्म स्टार्ट; स्वयं-होस्टेड वर्कर केवल आउटबाउंड वर्कर प्रोसेस होते हैं। हम "वार्तालाप का सत्य स्रोत ऑर्केस्ट्रेटर पर रहता है" और स्ट्रीमिंग मॉडल अपनाते हैं; हम लूप प्लेसमेंट को उलटते हैं (नीचे निर्णय देखें)।
- Codex क्लाउड: दो-चरणीय रनटाइम — नेटवर्कयुक्त सेटअप चरण, फिर सीक्रेट हटाकर ऑफ़लाइन एजेंट चरण; तेज़ फ़ॉलो-अप के लिए कंटेनर-स्टेट कैश। हम चरण विभाजन को अपने इग्रेस दृष्टिकोण के रूप में और कैश विचार को v2 वार्म इमेज के लिए अपनाते हैं।
- वेब पर Claude Code: प्रति-सेशन VM; क्रेडेंशियल-पृथक करने वाला git प्रॉक्सी (वास्तविक टोकन कभी सैंडबॉक्स में प्रवेश नहीं करते, पुश सेशन ब्रांच तक सीमित है); सेटअप के बाद फ़ाइल सिस्टम स्नैपशॉट; टेलीपोर्ट हैंडऑफ़ = पुश की गई ब्रांच + दोहराया गया इतिहास। हम क्रेडेंशियल आइसोलेशन और हैंडऑफ़ संरचना अपनाते हैं, लेकिन आउटबाउंड सिंक Gateway से rsync द्वारा होता है, ताकि डर्टी वर्किंग ट्री काम करें और बॉक्स के आसपास कहीं भी फ़ोर्ज टोकन मौजूद न हो।
- Copilot कोडिंग एजेंट: पैकेज-रजिस्ट्री अनुमति-सूची के साथ डिफ़ॉल्ट-अस्वीकृत इग्रेस। हमारा स्थिर-अवस्था डिफ़ॉल्ट अधिक कठोर है (कोई प्रत्यक्ष इग्रेस नहीं), क्योंकि इन्फ़रेंस और वेब खोज SSH टनल से आते हैं — लेकिन यह "शून्य इग्रेस" के बजाय "नियंत्रित इग्रेस" क्यों है, इसके लिए सुरक्षा अनुभाग देखें।

## आर्किटेक्चर निर्णय: लूप वर्कर पर, इन्फ़रेंस Gateway के माध्यम से

तीन प्लेसमेंट पर विचार किया गया:

1. लूप Gateway पर रहता है, वर्कर टूल निष्पादित करता है (Cursor मॉडल)। सबसे सुरक्षित विफलता डोमेन (ट्रांसक्रिप्ट, इन्फ़रेंस, अनुमोदन और पुनःआरंभ रिकवरी सभी स्थानीय रहते हैं) और समीक्षक द्वारा पसंद किया गया पहला माइलस्टोन। उत्पाद आर्किटेक्चर के रूप में अस्वीकृत: OpenClaw के गैर-exec टूल इन-प्रोसेस फ़ाइल सिस्टम ऑपरेशन हैं, इसलिए हर फ़ाइल पढ़ना/संपादित करना/grep एक नेटवर्क राउंड ट्रिप या मोटे वर्कस्पेस RPC में बड़े टूल-सतह रीफ़ैक्टर में बदल जाता है; रनटाइम व्यवहार अत्यधिक संवादात्मक और विलंबता-बाधित है। जहाँ यह पहले से निर्मित है (नोड पर exec ऑफ़लोड), वहाँ हम इसकी भावना का पुनः उपयोग करते हैं, लेकिन टूल-रिमोटिंग परत नहीं बनाते।
2. लूप और इन्फ़रेंस दोनों वर्कर पर। सबसे सरल विफलता डोमेन, लेकिन मॉडल क्रेडेंशियल (OAuth प्रोफ़ाइल सहित) अस्थायी मशीनों पर भेजने पड़ते हैं, Gateway नीति/रूटिंग/ऑडिट नियंत्रण खो देता है, और माइग्रेशन प्रोवाइडर को कॉल करने वाली पहचान बदल देता है, जिससे प्रोवाइडर कैश अमान्य हो जाते हैं।
3. लूप + टूल वर्कर पर, मॉडल कॉल Gateway के माध्यम से प्रॉक्सी किए जाते हैं। चयनित। प्रत्येक टूल कॉल के बजाय प्रत्येक मॉडल टर्न में एक राउंड ट्रिप; टूल कोड के पास चलते हैं; Gateway प्रमाणीकरण प्रोफ़ाइल, प्रोवाइडर रूटिंग और नीति का एकमात्र स्वामी बना रहता है; वर्कर के पास कोई सीक्रेट नहीं होता।

विकल्प 3 की लागत प्रत्येक मॉडल टर्न के दौरान Gateway पर समकालिक निर्भरता है, इसलिए इसके स्थायित्व नियम निर्णय का हिस्सा हैं, बाद में जोड़ा गया विचार नहीं:

- टर्न के बीच Gateway खोने से सक्रिय प्रोवाइडर कॉल विफल होती है। टर्न को विफल चिह्नित किया जाता है और पुनःकनेक्ट होने के बाद नए टर्न के रूप में पुनः प्रयास किया जाता है; प्रगति पर मौजूद प्रोवाइडर स्ट्रीम का कोई पारदर्शी रीप्ले नहीं होता (दोहरा-बिलिंग/दोहरा-टूल-कॉल जोखिम)।
- हर वर्कर↔Gateway ऑपरेशन में स्थायी पहचान होती है (वर्कर प्रोटोकॉल देखें), ताकि पुनःकनेक्शन लटकने के बजाय फिर से शुरू हों या कैश किए गए अंतिम परिणाम प्राप्त करें।
- Gateway क्षमता-प्रबंधित घटक है: समवर्ती-वर्कर सीमाएँ, प्रवाह नियंत्रण और लोड शेडिंग v1 के दायरे में हैं (क्षमता देखें)।

चूँकि Gateway ट्रांसक्रिप्ट संग्रहीत भी करता है और सभी प्रोवाइडर ट्रैफ़िक आरंभ भी करता है, सेशन स्थान-स्वतंत्र है: लूप को Gateway और वर्कर के बीच ले जाने से प्रोवाइडर पक्ष या UI डेटा पथ पर कुछ नहीं बदलता। यही डिस्पैच और वापस खींचने को कम लागत वाला बनाता है।

## घटक

### 1. एनवायरनमेंट स्टेट मशीन + प्रोवाइडर अनुबंध

`environments.*` Gateway प्रोटोकॉल में वर्तमान में केवल-स्थिति प्रोजेक्शन है। स्थायी कोर SQLite-स्वामित्व वाला एनवायरनमेंट रिकॉर्ड और स्टेट मशीन है, जिसे RPC आकारों से पहले डिज़ाइन किया गया है:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- प्रोविज़निंग क्रैश-सुरक्षित है: प्रोवाइडर कॉल से पहले इंटेंट पंक्ति को नियतात्मक ऑपरेशन आईडी के साथ स्थायी किया जाता है, ताकि Gateway पुनःआरंभ दोबारा प्रोविज़निंग करने या भुगतान वाली मशीन को अनाथ छोड़ने के बजाय प्रगति पर मौजूद लीज़ को अपना सके।
- पुनःआरंभ मिलान और अनाथ स्वीपर (प्रोवाइडर `inspect` बनाम स्थानीय रिकॉर्ड) v1 की आवश्यकताएँ हैं, केवल हार्डनिंग नहीं।

प्रोवाइडर अनुबंध (Plugin द्वारा कार्यान्वित; कोर में कोई प्रोवाइडर नाम या नीति नहीं):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → ssh होस्ट/पोर्ट/उपयोगकर्ता/कुंजी सामग्री
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // अपनाना/स्वास्थ्य/अनाथ स्वीप
  renew?(leaseId: string): Promise<void>; // दीर्घकालिक सेशन बनाम प्रोवाइडर TTL
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // आइडेम्पोटेंट, समाप्ति के प्रमाण पर ही लौटता है
};
```

RPC: `environments.create`, `environments.destroy`, विस्तारित `environments.list/status` (प्रोवाइडर, लीज़ आईडी, स्थिति, आयु, निष्क्रिय समय, संलग्न सेशन)। पहले प्रोवाइडर: Crabbox-आकार का लीज़ CLI रैपर (उत्पाद पथ) और केवल-विकास के रूप में चिह्नित स्थिर-SSH-होस्ट प्रोवाइडर — साझा होस्ट पर वर्कर असंबंधित होस्ट डेटा पढ़ सकता है, इसलिए स्थिर होस्ट सुविधा विकास के लिए हैं, डिफ़ॉल्ट दृष्टिकोण के लिए नहीं।

### 2. वर्कर बूटस्ट्रैप: बॉक्स पर OpenClaw इंस्टॉल करना

कोई विशिष्ट वर्कर आर्टिफ़ैक्ट नहीं, और npm उपलब्धता पर कोई निर्भरता नहीं:

- सभी मोड के लिए मानक इंस्टॉल: Gateway द्वारा निर्मित, सामग्री-हैश किया हुआ वर्कर बंडल (Gateway का अपना बिल्ड आउटपुट tarball के रूप में पैक किया गया), SSH से भेजकर बॉक्स पर इंस्टॉल किया जाता है। यह संरचना के अनुसार डेवलपमेंट बिल्ड और अप्रकाशित कमिट को कवर करता है।
- `npm i -g openclaw@<exact gateway version>` तब एक अनुकूलन है जब Gateway कोई रिलीज़ किया गया संस्करण चलाता है; कभी भी `latest` नहीं।
- बूटस्ट्रैप आइडेम्पोटेंट है; मेल खाते बंडल हैश वाली वार्म लीज़ इंस्टॉल छोड़ देती है। कच्ची मशीनों को नेटवर्कयुक्त टूलचेन चरण (Node रनटाइम) की आवश्यकता हो सकती है — यह सेटअप चरण का हिस्सा है और बाद में बंद कर दिया जाता है।
- हैंडशेक वर्कर बिल्ड हैश, प्रोटोकॉल फ़ीचर सेट और रनटाइम संगतता सत्यापित करता है। मौजूदा Gateway संस्करण/प्रोटोकॉल जाँच इसके लिए अपर्याप्त हैं (SSH-टनल किए गए नोड सटीक-संस्करण अस्वीकृति से मुक्त हैं), इसलिए वर्कर प्रवेश अपनी सटीक-बिल्ड जाँच करता है।

वर्कर मोड (`openclaw worker`) एक प्रवेश बिंदु है, फ़ोर्क नहीं: कनेक्शन प्रबंधन और एम्बेडेड एजेंट रनर, जिसमें सेशन स्थायित्व और मॉडल कॉल Gateway RPC द्वारा समर्थित हैं। इसे Gateway सतहें आरंभ नहीं करनी चाहिए: कोई चैनल नहीं, सेशन टूलसेट से परे कोई Plugin स्वतः-आरंभ नहीं, अस्थायी स्टेट डायरेक्टरी, कोई स्थानीय प्रमाणीकरण प्रोफ़ाइल नहीं।

### 3. ट्रांसपोर्ट: सब कुछ SSH पर

Gateway कनेक्टिविटी का स्वामी है; वर्कर को sshd के अलावा कुछ नहीं चाहिए:

- Gateway वर्कर के लिए SSH खोलता है (प्रोवाइडर लीज़ से प्राप्त क्रेडेंशियल, प्रोविज़निंग आउटपुट से पिन की गई होस्ट कुंजी — कोई `StrictHostKeyChecking=no` नहीं) और वर्कर-स्थानीय सॉकेट को Gateway के WS एंडपॉइंट पर फ़ॉरवर्ड करने वाली रिवर्स टनल स्थापित करता है।
- नियंत्रण/मॉडल ट्रैफ़िक और वर्कस्पेस स्थानांतरण समान पिन की गई भरोसा सामग्री के साथ अलग SSH कनेक्शन का उपयोग करते हैं, ताकि rsync टोकन स्ट्रीम को हेड-ऑफ़-लाइन ब्लॉक न कर सके।
- टनल जीवनचक्र (कीपअलाइव, बैकऑफ़ के साथ पुनःकनेक्शन) Gateway पर एनवायरनमेंट रनटाइम के स्वामित्व में है। टनल में क्षणिक व्यवधान सेशन स्तर पर अदृश्य रहता है: स्थायी प्रोटोकॉल स्थिति (नीचे) वर्कर को पुनःसंलग्न होकर फिर से शुरू करने देती है।

### 4. वर्कर प्रोटोकॉल (समर्पित; नोड प्रोटोकॉल नहीं)

वर्तमान नोड सीमों के विरुद्ध प्रतिकूल समीक्षा ने सीधे पुनः उपयोग को अस्वीकार कर दिया: लंबित नोड इनवोक प्रोसेस-स्थानीय Promise हैं जो कनेक्शन के साथ समाप्त हो जाते हैं, नोड आइडेम्पोटेंसी कुंजियाँ पार्स की जाती हैं लेकिन डीडुप्लिकेट नहीं की जातीं, और — निर्णायक रूप से — कनेक्टेड नोड सामान्य नोड इवेंट (एजेंट-रन अनुरोध सहित) उत्सर्जित कर सकता है, इसलिए "नोड प्रकार + क्षमता सीमा" इनग्रेस सुरक्षा सीमा नहीं है। इसलिए वर्करों को बंद, संस्करणबद्ध RPC/इवेंट अनुमति-सूची के साथ प्रमाणित `worker` भूमिका मिलती है; वर्कर कनेक्शन किसी विरासत नोड इवेंट हैंडलर तक नहीं पहुँच सकते।

पहचान और क्रेडेंशियल: प्रोविज़निंग एनवायरनमेंट आईडी, वर्कर कुंजी, बंडल हैश, एकमात्र अनुमत सेशन, अनुमत RPC सेट और समाप्ति से बँधा अल्पकालिक वर्कर क्रेडेंशियल बनाती है। SSH-सत्यापित पेयरिंग अब भी लागू होती है (हमने बॉक्स प्रोविज़न किया और कुंजी हमारे पास है), लेकिन प्राधिकरण घोषित नोड सतह से नहीं, निर्मित क्रेडेंशियल से आता है।

स्थायी ऑपरेशन अर्थविज्ञान (आकार मौजूदा ACP रनटाइम और उसके इवेंट लेजर से लिया गया है — स्थिर हैंडल, प्रति-सेशन क्रमांकन, स्थायी `(session, seq)` रीप्ले):

- हर ऑपरेशन का दायरा `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)` तक सीमित है।
- स्वामित्व epoch पुराने workers को अलग रखते हैं: replacement worker epoch को आगे बढ़ाता है; पुराने epoch से देर से आने वाले परिणाम नियतात्मक रूप से अस्वीकार कर दिए जाते हैं।
- SQLite में स्थायी ACK cursors और cache किए गए terminal results के साथ कम-से-कम-एक-बार डिलीवरी; dedupe नियतात्मक है। ठीक-एक-बार की कोई गारंटी नहीं।
- cancel, close, resume और terminal results के लिए स्पष्ट frames; streams पर credit/window-आधारित flow control।
- Protocol feature negotiation सामान्य node protocol version से स्वतंत्र है।

### 5. Session backend RPCs

दो अलग-अलग contracts — वर्तमान codebase स्थायी transcript mutations (session-manager के स्वामित्व वाला, parent/leaf state वाला JSONL tree) को process-local live events (streaming deltas, tool lifecycle, approvals) से अलग रखता है, और worker protocol को यह विभाजन बनाए रखना होगा:

- स्थायी transcript commits: worker `runEpoch` + base-leaf compare-and-swap के साथ semantic append batches सबमिट करता है; Gateway session manager entry ids और parent ids जनरेट करता है। worker कभी भी विश्वसनीय transcript rows, entry ids, parent ids या विदेशी session ids नहीं दे सकता।
- फिर से चलाए जा सकने वाले live events: worker sequence numbers, Gateway ACKs, सीमित retention और late-event fencing वाला typed event union, जो मौजूदा agent-event fanout को feed करता है ताकि chat view, tool rows और unread/status logic स्थानीय sessions की तरह ही व्यवहार करें।

Inference proxy: मौजूदा runtime proxy stream client (`src/agents/runtime/proxy.ts`) की event vocabulary का पुनः उपयोग करें, लेकिन trust boundary को स्थानांतरित करें। worker केवल session/run identity, एक स्वीकृत model reference, context और सीमित generation options भेजता है; Gateway अपने catalog से provider, endpoint, auth, headers, routing और cost policy resolve करता है। worker द्वारा दिया गया model object (जैसे attacker-controlled `baseUrl`) अस्वीकार कर दिया जाता है। Request-size limits, cancellation, audit और terminal-result replay लागू होते हैं। Gateway में स्थित tools (websearch) Gateway पर execute होते हैं और उसी channel पर results लौटाते हैं।

### 6. Workspace sync

sync anchor एक Gateway-local workspace है, जिसका placement ownership अनन्य है: git workspaces के लिए, एक समर्पित managed worktree (मौजूदा managed-worktree metadata — branch, base, snapshot ownership — इसका आधार है); non-git workspaces के लिए, Gateway के स्वामित्व वाली target directory। उपयोगकर्ता का live checkout कभी नहीं। session के remotely placed रहने के दौरान अनन्य ownership ही inbound sync को संरचनात्मक रूप से conflict-free बनाता है।

Ownership विभाजन — commit बनाम publish:

- worker-side agent अपनी copy में सामान्य रूप से commits बनाता है (`git commit` एक local, credential-free operation है; author identity Gateway config से project की जाती है)। जब तक Gateway उन्हें अपनाता नहीं, वे commits निष्क्रिय objects रहते हैं।
- विश्वास की आवश्यकता वाला सब कुछ Gateway करता है: यह सत्यापित करना कि inbound commits दर्ज base पर बने हैं, local worktree को fast-forward करना, push, PR creation और वैकल्पिक signing/re-signing — सभी Gateway-local credentials के साथ। worker के पास कभी git या forge credentials नहीं होते और वह कभी किसी remote को नहीं छूता।

दो sync modes, जिनका चयन इस आधार पर होता है कि workspace एक git repository है या नहीं:

- Git mode। Outbound: tunnel की SSH identity पर worktree को rsync करें (uncommitted और पात्र untracked files सहित; crabbox-style include/exclude, `.worktreeinclude` का सम्मान करते हुए), जिसे immutable base manifest (content hashes + base commit) के रूप में दर्ज किया जाता है। Inbound: नए commits दर्ज base के विरुद्ध git bundle या temporary ref के रूप में लौटते हैं; untracked artifacts size/type/symlink-containment checks वाले स्पष्ट manifest के माध्यम से लौटते हैं। Adoption base ancestry को सत्यापित करता है और divergence होने पर रुक जाता है — किसी भी पक्ष को चुपचाप overwrite नहीं किया जाता। Deletes, renames, submodules और symlink escapes को manifest rules संभालते हैं, rsync heuristics नहीं।
- Plain mode (git नहीं — जैसे box पर शुरुआत से कोई project बनाना)। Outbound वही rsync + base manifest है। Inbound, delete propagation के साथ Gateway-owned target directory में manifest-diffed mirror है। यह उसी कारण से सुरक्षित है जिस कारण git mode सुरक्षित है: अनन्य ownership का अर्थ है कि conflict करने के लिए कोई समवर्ती local edits मौजूद नहीं हैं; base manifest फिर भी अप्रत्याशित local drift का पता लगाता है और overwrite करने के बजाय रुक जाता है।

Checkpointing lease खोने से कई दिनों तक चलने वाले sessions की रक्षा करता है: आवधिक inbound checkpoints (git mode में session-branch commits, plain mode में manifest snapshots); cadence profile policy है (turn-based default)।

### 7. Placement state machine, sessions और UI

Runtime placement session से जुड़ी SQLite-owned state machine है, न कि ढीले row fields की जोड़ी:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

यह environment id, transition generation, active owner epoch, workspace base manifest, worker bundle hash और अंतिम ACK cursors को स्थायी रखता है। Turn admission किसी भी loop के turn शुरू करने से पहले placement को atomically claim करता है, इसलिए stale snapshot के आधार पर स्वीकार किया गया local message कभी worker turn से race नहीं कर सकता — किसी भी समय ठीक एक loop session का स्वामी होता है।

UI:

- worker session एक सामान्य session row है, जिसमें placement metadata जुड़ा है। यह सामान्य store में रहता है, `sessions.list` के माध्यम से सूचीबद्ध होता है, मौजूदा subscriptions के माध्यम से stream होता है — sidebar और chat को किसी नए data path की आवश्यकता नहीं, केवल presentation की: worker badge और placement/environment status (`provisioning / syncing / running / idle / reconciling / reclaimed`)।
- Creation UX: session target bar (sessions sidebar redesign) में Gateway और Node के साथ cloud worker destination जोड़ा जाता है। configured provider profile आवश्यक है; configure किए जाने तक feature दिखाई नहीं देता।
- Agent dispatch: एक session tool agent को काम cloud worker को सौंपने देता है, जैसे कोई मानव करता है (worker-backed sub-session, subagent-style)। यह human dispatch वाले ही milestone में ship होता है और उसी opt-in provider config द्वारा gated होता है। Recursion संरचनात्मक रूप से सीमित है (v1 में worker sessions स्वयं workers dispatch नहीं कर सकते); spend control per-environment accounting/audit है, quota machinery नहीं।

## Dispatch और handoff

v1 जानबूझकर asymmetric है:

- Local → worker (dispatch): नीचे दिए migration barrier को पार करें, worker provision करें या पुनः उपयोग करें, sync करें, placement flip करें, अगला turn remotely execute होता है।
- Worker → local (pull-back): session रोकें (उसी barrier के अनुसार worker को drain करें), inbound reconciliation पूरी करें, placement को local पर flip करें। यह live migration नहीं है।
- Symmetric live handoff (सक्रिय रूप से काम कर रहे session को रोके बिना दोनों दिशाओं में ले जाना) उसी barrier और reconciliation machinery का पुनः उपयोग करता है और fault-injection tests द्वारा barrier सिद्ध किए जाने के बाद ship होता है।

Migration barrier ("turn boundary" अकेले पर्याप्त नहीं है — approvals, background processes और released-lock transcript merges इसे पार कर सकते हैं):

1. नए turn admission को रोकें (placement claim)।
2. सक्रिय runs को cancel या drain करें।
3. pending exec approvals और execution grants को revoke करें।
4. transcript side-writes और live-event ACKs को drain करें।
5. worker child processes को terminate करें।
6. owner epoch को आगे बढ़ाकर पुराने owner को अलग करें।
7. workspace को reconcile करें (inbound, conflict-aware)।
8. नए owner को activate करें।

Cache affinity: चूँकि दोनों placements में provider requests Gateway से उत्पन्न होते हैं, serialized provider request के equivalent रहने पर cache affinity बनी रहती है — समान tool order, system instructions, provider wrappers और cache metadata (जो Gateway-side रहते हैं)। यह एक testable property है, assumption नहीं: worker loop प्रस्तुत करने वाले milestone में प्रत्येक supported provider transport के लिए local/worker placement के बीच byte-equivalence tests शामिल हैं।

## Security model

सटीक रूप से कहें तो: worker के पास कोई direct network egress और कोई स्थायी provider/forge credentials नहीं हैं। यह "zero egress" नहीं है — inference और Gateway-executed tools नियंत्रित egress channels हैं (prompt-injected worker फिर भी workspace bytes को model context या websearch queries में डाल सकता है)। तदनुसार:

- Controlled-egress accounting: inference proxy और Gateway tools पर per-environment audit और operator-visible accounting। Rate/byte limits protocol flow control (capacity) के रूप में मौजूद हैं, spend-quota machinery के रूप में नहीं।
- Gateway में worker ingress बंद worker-protocol allowlist है; transcript writes संरचनात्मक रूप से सीमित हैं (Gateway-generated ids, एकल bound session)।
- worker exec को box के भीतर पूर्ण permission है। box disposable और credential-free है, इसलिए per-command approval कुछ भी सुरक्षित किए बिना बाधा बढ़ाता है; संरक्षित boundary inbound reconciliation और audit है। Exec कभी Gateway Node-approval path से नहीं गुजरता।
- Internet policy provision-time provider decision है: environment profile box creation के समय निर्णय लेता है (firewall/security group/no-egress network), वैकल्पिक रूप से networked setup phase के साथ जिसे provider agent phase से पहले बंद कर देता है। Core runtime network toggle लागू नहीं करता।
- Provision के समय box hygiene: cloud metadata endpoint blocked हो या उसकी अनुपस्थिति सत्यापित हो, कोई instance profile नहीं, कोई inherited SSH agent नहीं, कोई Docker socket नहीं, clean env/home। SSH host keys provisioning output से pin की जाती हैं।
- Gateway-side किसी भी चीज़ (push, PR, provider calls) के लिए approvals और policy Gateway पर ही चलते रहते हैं।

compromised worker session का blast radius: synced workspace copy और audited proxy channels द्वारा अनुमत सामग्री — कोई credentials नहीं, कोई direct network नहीं, allowlist के अलावा कोई Gateway surface नहीं।

## Capacity

Gateway N workers के लिए प्रत्येक prompt और token stream relay करता है, इसलिए v1 production में इसका पता लगाने के बजाय capacity model निर्दिष्ट करता है: प्रति Gateway concurrent-worker limits, per-stream credit windows (वर्तमान event stream queue unbounded है और Node socket buffer ceiling धीमे consumers को force-close करती है — दोनों बिना संशोधन के अनुपयुक्त हैं), bursts के लिए bounded disk spooling और UI में दिखाई देने वाली backpressure states के साथ load shedding। Workspace transfer अपने अलग SSH channel पर रहता है।

## Lifecycle

- Idle auto-stop और TTL provider-profile policy हैं, fixed constants नहीं। स्पष्ट keep-alive के साथ defaults उदार हैं; कई दिनों का काम first-class है (lease-based backends के लिए provider `renew` मौजूद है); in-flight turn या recent activity वाले session को कभी reclaim नहीं किया जाता।
- worker की मृत्यु या reclaim होने पर: placement `reclaimed` पर चला जाता है, session row बना रहता है, अगला message नया worker provision करता है और अंतिम checkpoint से फिर sync करता है। Conversation कभी नहीं खोती (Gateway-side store); अंतिम checkpoint के बाद के workspace changes खो जाते हैं और UI इसकी सूचना देता है।
- पहले दिन से warm-lease reuse (इसे support करने वाले providers के लिए); bootstrap के बाद image snapshot v2 का fast-start path है।

## Configuration surface

न्यूनतम और opt-in: provider profile block (provider id, credentials/CLI reference, sync rules, lifetime policy, budgets, वैकल्पिक setup phase) और per-session placement selection। कोई नया environment variable नहीं। Unconfigured installs में कुछ दिखाई नहीं देता।

## Milestones

Implementation छोटे, स्वतंत्र रूप से merge किए जा सकने वाले PRs के रूप में land होता है; नीचे दिया प्रत्येक milestone एक PR series है, एक change नहीं।

1. आधारभूत संरचना: परिवेश स्टेट मशीन + प्रदाता अनुबंध + crabbox-आकार का प्रदाता (डेवलपमेंट हार्नेस के रूप में static-SSH), वर्कर बंडल बूटस्ट्रैप + प्रवेश हैंडशेक, SSH टनल + होस्ट-की पिनिंग, प्रबंधित-वर्कट्री स्नैपशॉट + आउटबाउंड सिंक (git + प्लेन मोड)। अनाथ संसाधनों की सफ़ाई + पुनरारंभ पर अंगीकरण।
2. वर्कर प्रोटोकॉल + वर्कर लूप: प्रमाणीकृत वर्कर भूमिका, स्थायी ऑपरेशन/इपॉक/ACK कर्सर, ट्रांसक्रिप्ट कमिट + लाइव इवेंट अनुबंध, Gateway द्वारा समाधान किए गए मॉडल के साथ इन्फ़रेंस प्रॉक्सी, प्रवाह नियंत्रण। एक प्रदाता, केवल नए सेशन का मानव-प्रेषण, कोई हैंडऑफ़ नहीं। फॉल्ट-इंजेक्शन परीक्षण (टनल विभाजन, Gateway पुनरारंभ, वर्कर बंद होना) निकास को गेट करते हैं।
3. प्रेषण + वापस खींचना + एजेंट प्रेषण: माइग्रेशन अवरोध, UI लक्ष्य बार से जुड़ी प्लेसमेंट स्टेट मशीन, इनबाउंड मिलान + चेकपॉइंट, प्रति-परिवेश ऑडिट, क्षमता सीमाएँ, एजेंट प्रेषण टूल (वर्कर सेशन पुनरावर्ती प्रेषण नहीं कर सकते)। प्रॉम्प्ट-कैश बाइट-समतुल्यता परीक्षण।
4. माइलस्टोन-3 फॉल्ट-इंजेक्शन प्रमाण के बाद सममित लाइव हैंडऑफ़।

बाद में: प्रति-परिवेश क्रेडेंशियल-हाइड्रेशन ऑप्ट-इन के रूप में वर्करों पर ACP हार्नेस; तेज़ शुरुआत के लिए स्नैपशॉट/वार्म-इमेज; फैन-आउट (N लीज़, समान प्रॉम्प्ट); इन-बॉक्स OS सैंडबॉक्सिंग; आर्टिफ़ैक्ट स्कीमा के माध्यम से अधिक समृद्ध आर्टिफ़ैक्ट कैप्चर।

## खुले प्रश्न

- वर्करों पर Plugin/Skill की उपलब्धता: रिपॉज़िटरी में सम्मिलित Skills बिना अतिरिक्त लागत के वर्कस्पेस के साथ सिंक होते हैं; Gateway में कॉन्फ़िगर किए गए एजेंट Skills/Plugins के लिए स्पष्ट सिंक या बहिष्करण निर्णय आवश्यक है (दोनों स्थितियों में टूल/Plugin मैनिफ़ेस्ट प्रवेश हैंडशेक का भाग है)।
- चेकपॉइंट आवृत्ति का डिफ़ॉल्ट: अत्यधिक संवाद वाली सेशन के लिए टर्न-आधारित बनाम समय-आधारित।
- परिवेश प्रोफ़ाइल मल्टी-एजेंट रूटिंग के साथ कैसे अंतःक्रिया करती हैं (प्रति-एजेंट डिफ़ॉल्ट प्रोफ़ाइल बनाम केवल प्रति-सेशन चयन)।
