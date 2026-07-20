---
read_when:
    - OpenClaw को पहचान-सचेत प्रॉक्सी के पीछे चलाना
    - OpenClaw के आगे OAuth के साथ Pomerium, Caddy या nginx सेट अप करना
    - रिवर्स प्रॉक्सी सेटअप में WebSocket 1008 अनधिकृत त्रुटियों को ठीक करना
    - HSTS और अन्य HTTP सुरक्षा-सुदृढ़ीकरण हेडर कहाँ सेट करने हैं, यह तय करना
sidebarTitle: Trusted proxy auth
summary: Gateway प्रमाणीकरण को किसी विश्वसनीय रिवर्स प्रॉक्सी (Pomerium, Caddy, nginx + OAuth) को सौंपें
title: विश्वसनीय प्रॉक्सी प्रमाणीकरण
x-i18n:
    generated_at: "2026-07-20T07:24:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 849824b53e518391d1a81f8a9a17320df3f42749f37d0c49b0e8b662f82b27cb
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**सुरक्षा-संवेदनशील सुविधा।** यह मोड प्रमाणीकरण पूरी तरह आपके रिवर्स प्रॉक्सी को सौंपता है। गलत कॉन्फ़िगरेशन आपके Gateway को अनधिकृत पहुँच के लिए उजागर कर सकता है। सक्षम करने से पहले इस पृष्ठ को ध्यान से पढ़ें।
</Warning>

## कब उपयोग करें

- आप OpenClaw को किसी **पहचान-जागरूक प्रॉक्सी** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth) के पीछे चलाते हैं।
- आपका प्रॉक्सी सभी प्रमाणीकरण संभालता है और हेडर के माध्यम से उपयोगकर्ता की पहचान भेजता है।
- आप Kubernetes या कंटेनर परिवेश में हैं, जहाँ प्रॉक्सी ही Gateway तक पहुँचने का एकमात्र मार्ग है।
- आपको WebSocket `1008 unauthorized` त्रुटियाँ मिल रही हैं, क्योंकि ब्राउज़र WS पेलोड में टोकन नहीं भेज सकते।

## कब उपयोग न करें

- आपका प्रॉक्सी उपयोगकर्ताओं को प्रमाणित नहीं करता (वह केवल TLS टर्मिनेटर या लोड बैलेंसर है)।
- Gateway तक पहुँचने का कोई भी ऐसा मार्ग मौजूद है जो प्रॉक्सी को बायपास करता है (फ़ायरवॉल में छेद, आंतरिक नेटवर्क पहुँच)।
- आप निश्चित नहीं हैं कि आपका प्रॉक्सी फ़ॉरवर्ड किए गए हेडर को सही ढंग से हटाता/ओवरराइट करता है।
- आपको केवल व्यक्तिगत एकल-उपयोगकर्ता पहुँच चाहिए (इसके बजाय Tailscale Serve + loopback पर विचार करें)।

## यह कैसे काम करता है

<Steps>
  <Step title="प्रॉक्सी उपयोगकर्ता को प्रमाणित करता है">
    आपका रिवर्स प्रॉक्सी उपयोगकर्ताओं को प्रमाणित करता है (OAuth, OIDC, SAML आदि)।
  </Step>
  <Step title="प्रॉक्सी पहचान हेडर जोड़ता है">
    प्रॉक्सी प्रमाणित उपयोगकर्ता की पहचान वाला हेडर जोड़ता है (उदाहरण के लिए, `x-forwarded-user: nick@example.com`)।
  </Step>
  <Step title="Gateway विश्वसनीय स्रोत की पुष्टि करता है">
    OpenClaw जाँचता है कि अनुरोध किसी **विश्वसनीय प्रॉक्सी IP** (`gateway.trustedProxies`) से आया है और वह Gateway का अपना लूपबैक या स्थानीय इंटरफ़ेस पता नहीं है।
  </Step>
  <Step title="Gateway पहचान निकालता है">
    OpenClaw आवश्यक हेडर पढ़ता है, फिर कॉन्फ़िगर किए गए हेडर से उपयोगकर्ता की पहचान निकालता है।
  </Step>
  <Step title="अधिकृत करें">
    यदि सभी जाँच सफल होती हैं और उपयोगकर्ता `allowUsers` (सेट होने पर) में अनुमत है, तो अनुरोध अधिकृत हो जाता है।
  </Step>
</Steps>

## कॉन्फ़िगरेशन

```json5
{
  gateway: {
    // विश्वसनीय-प्रॉक्सी प्रमाणीकरण डिफ़ॉल्ट रूप से अपेक्षा करता है कि प्रॉक्सी का स्रोत IP लूपबैक न हो
    bind: "lan",

    // अत्यंत महत्वपूर्ण: यहाँ केवल अपने प्रॉक्सी के IP जोड़ें
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // प्रमाणित उपयोगकर्ता की पहचान वाला हेडर (आवश्यक)
        userHeader: "x-forwarded-user",

        // वैकल्पिक: वे हेडर जिनका मौजूद होना अनिवार्य है (प्रॉक्सी सत्यापन)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // वैकल्पिक: विशिष्ट उपयोगकर्ताओं तक सीमित करें (खाली = सभी को अनुमति दें)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // वैकल्पिक: स्पष्ट सहमति के बाद समान-होस्ट लूपबैक प्रॉक्सी की अनुमति दें
        allowLoopback: false,

        // वैकल्पिक: प्रमाणित प्रॉक्सी उपयोगकर्ताओं को नए ब्राउज़र डिवाइस नामांकित करने दें
        deviceAutoApprove: {
          enabled: false,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

<Warning>
**रनटाइम नियम, मूल्यांकन के क्रम में**

1. अनुरोध का स्रोत IP `gateway.trustedProxies` से मेल खाना चाहिए (CIDR को ध्यान में रखते हुए), अन्यथा उसे अस्वीकार कर दिया जाता है (`trusted_proxy_untrusted_source`)।
2. लूपबैक-स्रोत अनुरोधों (`127.0.0.1`, `::1`) को तब तक अस्वीकार किया जाता है, जब तक `gateway.auth.trustedProxy.allowLoopback = true` न हो और लूपबैक पता `trustedProxies` में भी शामिल न हो (`trusted_proxy_loopback_source`)। यह जाँच हेडर जाँचों से पहले होती है, इसलिए आवश्यक हेडर अनुपस्थित होने पर भी लूपबैक स्रोत इसी कारण विफल होता है।
3. Gateway होस्ट के अपने स्थानीय नेटवर्क इंटरफ़ेस पतों में से किसी से मेल खाने वाले गैर-लूपबैक स्रोतों को स्पूफ़िंग से सुरक्षा के लिए अस्वीकार किया जाता है (`trusted_proxy_local_interface_source`)। यदि इंटरफ़ेस खोज स्वयं विफल हो जाती है, तो अनुरोध भी अस्वीकार कर दिया जाता है (`trusted_proxy_local_interface_check_failed`)।
4. `requiredHeaders` और `userHeader` मौजूद और गैर-रिक्त होने चाहिए।
5. `allowUsers`, यदि गैर-रिक्त है, तो उसमें निकाला गया उपयोगकर्ता शामिल होना चाहिए।

**फ़ॉरवर्डेड-हेडर प्रमाण स्थानीय-प्रत्यक्ष फ़ॉलबैक के लिए लूपबैक स्थानीयता को ओवरराइड करता है।** यदि कोई अनुरोध लूपबैक पर आता है, लेकिन उसमें `Forwarded`, कोई भी `X-Forwarded-*`, या `X-Real-IP` हेडर है, तो वह प्रमाण उसे स्थानीय-प्रत्यक्ष पासवर्ड फ़ॉलबैक और डिवाइस-पहचान गेटिंग के लिए अयोग्य कर देता है, भले ही वह लूपबैक होने के कारण विश्वसनीय-प्रॉक्सी प्रमाणीकरण में फिर भी विफल हो।

`allowLoopback` Gateway होस्ट पर स्थानीय प्रक्रियाओं पर उतना ही भरोसा करता है जितना रिवर्स प्रॉक्सी पर। इसे केवल तभी सक्षम करें जब Gateway अब भी प्रत्यक्ष दूरस्थ पहुँच से फ़ायरवॉल द्वारा सुरक्षित हो और स्थानीय प्रॉक्सी क्लाइंट द्वारा दिए गए पहचान हेडर को हटाता या ओवरराइट करता हो।

जो आंतरिक Gateway क्लाइंट रिवर्स प्रॉक्सी से होकर नहीं जाते, उन्हें विश्वसनीय-प्रॉक्सी पहचान हेडर के बजाय `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` का उपयोग करना चाहिए। गैर-लूपबैक Control UI परिनियोजनों को अब भी स्पष्ट `gateway.controlUi.allowedOrigins` की आवश्यकता होती है।
</Warning>

### कॉन्फ़िगरेशन संदर्भ

<ParamField path="gateway.trustedProxies" type="string[]" required>
  भरोसेमंद प्रॉक्सी IP पतों (या CIDR) की सरणी। अन्य IP से आए अनुरोध अस्वीकार कर दिए जाते हैं।
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  `"trusted-proxy"` होना अनिवार्य है।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  प्रमाणित उपयोगकर्ता की पहचान वाला हेडर नाम।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  अनुरोध को विश्वसनीय मानने के लिए मौजूद होने वाले अतिरिक्त हेडर।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  उपयोगकर्ता पहचानों की अनुमत-सूची। खाली होने का अर्थ है सभी प्रमाणित उपयोगकर्ताओं को अनुमति देना।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  समान-होस्ट लूपबैक रिवर्स प्रॉक्सी के लिए स्पष्ट सहमति वाला समर्थन।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.enabled" type="boolean" default="false">
  विश्वसनीय-प्रॉक्सी प्रमाणीकरण के बाद नई Control UI और WebChat डिवाइस पहचानों को स्वचालित रूप से स्वीकृत करें।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.scopes" type="string[]" default='["operator.read", "operator.write", "operator.approvals"]'>
  स्वचालित रूप से स्वीकृत ब्राउज़र डिवाइस को दिए जाने वाले अधिकतम स्कोप। `operator.admin` को स्पष्ट रूप से सूचीबद्ध करने पर हर प्रॉक्सी-प्रमाणित उपयोगकर्ता स्वचालित पूर्ण-एडमिन डिवाइस अनुदान का अनुरोध कर सकता है, बिना स्कोप वाले अनुरोधों को स्वचालित रूप से पूर्ण एडमिन मिलता है, और अत्यंत गंभीर `gateway.trusted_proxy_device_auto_approve_admin` सुरक्षा ऑडिट निष्कर्ष तथा Gateway स्टार्टअप चेतावनी ट्रिगर होती है।
</ParamField>

<Warning>
`allowLoopback` को केवल तभी सक्षम करें जब स्थानीय रिवर्स प्रॉक्सी अभिप्रेत विश्वास सीमा हो। Gateway से कनेक्ट हो सकने वाली कोई भी स्थानीय प्रक्रिया प्रॉक्सी पहचान हेडर भेजने का प्रयास कर सकती है, इसलिए प्रत्यक्ष Gateway पहुँच को होस्ट तक निजी रखें और प्रॉक्सी-स्वामित्व वाले हेडर, जैसे `x-forwarded-proto`, या जहाँ आपका प्रॉक्सी समर्थन करता हो वहाँ हस्ताक्षरित अभिकथन हेडर अनिवार्य करें।
</Warning>

## स्वचालित डिवाइस स्वीकृति

विश्वसनीय-प्रॉक्सी प्रमाणीकरण नए ब्राउज़र डिवाइसों के लिए वैकल्पिक रूप से प्रॉक्सी पहचान को स्वीकृति सीमा के रूप में उपयोग कर सकता है:

```json5
{
  gateway: {
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
        allowUsers: ["operator@example.com"],
        deviceAutoApprove: {
          enabled: true,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

डिफ़ॉल्ट `enabled: false` है। सक्षम होने पर ये सभी नियम लागू होते हैं:

1. WebSocket को `trusted-proxy` विधि के माध्यम से प्रमाणित होना चाहिए, जिसमें गैर-रिक्त उपयोगकर्ता पहचान हो और अनुमत-सूची कॉन्फ़िगर होने पर वह `allowUsers` में अनुमत हो। टोकन, पासवर्ड, Tailscale और अप्रमाणित कनेक्शन इस नीति का कभी उपयोग नहीं करते।
2. केवल नई Control UI या WebChat ब्राउज़र डिवाइस को स्वचालित रूप से स्वीकृत किया जा सकता है। स्कोप अपग्रेड सहित मौजूदा डिवाइस का कोई भी अनुरोध `openclaw devices approve <requestId>` के माध्यम से मैन्युअल स्वीकृति के लिए लंबित रहता है।
3. डिवाइस को `operator` भूमिका के साथ स्वीकृत किया जाता है। यदि कनेक्ट अनुरोध में स्कोप शामिल हैं, तो अनुदान अनुरोधित स्कोप और `deviceAutoApprove.scopes` का सटीक प्रतिच्छेद होता है। यदि अनुरोध में स्कोप नहीं हैं, तो कॉन्फ़िगर की गई सूची प्रदान की जाती है; वह सूची अनुपस्थित होने पर डिफ़ॉल्ट रूप से `operator.read`, `operator.write`, और `operator.approvals` लागू होते हैं। इसके बाद परिणामी अनुदान को, मौजूद होने पर, कनेक्शन के [`x-openclaw-scopes`](#control-ui-pairing-behavior) प्रॉक्सी हेडर द्वारा अतिरिक्त रूप से सीमित किया जाता है, इसलिए किसी उपयोगकर्ता के स्कोप सीमित करने वाला प्रॉक्सी केवल सत्र को ही नहीं, बल्कि **स्थायी** डिवाइस अनुदान को भी सीमित करता है—मौजूद लेकिन खाली हेडर से कोई स्कोप नहीं मिलता। यह सीमा तब भी लागू होती है जब क्लाइंट अपनी स्कोप सूची नहीं देता।
4. `operator.admin` की अनुमति केवल `deviceAutoApprove.scopes` में स्पष्ट सूचीबद्धता के माध्यम से है। सूचीबद्ध होने पर, हर प्रॉक्सी-प्रमाणित उपयोगकर्ता नए ब्राउज़र डिवाइस पर पूर्ण एडमिन का अनुरोध कर सकता है और उसे स्वचालित रूप से प्राप्त कर सकता है; बिना स्कोप वाले अनुरोधों को स्वचालित रूप से पूर्ण एडमिन मिलता है। `openclaw security audit` अत्यंत गंभीर `gateway.trusted_proxy_device_auto_approve_admin` निष्कर्ष की रिपोर्ट करता है और Gateway स्टार्टअप पर एक बार चेतावनी लॉग करता है। प्रति-पहचान भूमिकाएँ उपलब्ध होने तक `openclaw devices approve` या `openclaw devices rotate` के माध्यम से मैन्युअल एडमिन स्वीकृति को प्राथमिकता दें।

<Warning>
इस विकल्प को सक्षम करने पर नए ब्राउज़र डिवाइस का नामांकन पूरी तरह रिवर्स-प्रॉक्सी पहचान को सौंप दिया जाता है। समझौता हो चुका प्रॉक्सी खाता हर कॉन्फ़िगर किए गए स्कोप वाला स्थायी डिवाइस नामांकित कर सकता है। `operator.admin` को सूचीबद्ध करने पर वह डिवाइस मैन्युअल स्वीकृति के बिना पूर्ण एडमिन बन जाता है। Gateway को केवल प्रॉक्सी के माध्यम से पहुँच योग्य रखें, सशक्त प्रॉक्सी प्रमाणीकरण अनिवार्य करें, पहचान हेडर ओवरराइट करें और संकीर्ण `allowUsers` सूची का उपयोग करें।
</Warning>

## Control UI पेयरिंग व्यवहार

जब `gateway.auth.mode = "trusted-proxy"` सक्रिय हो और अनुरोध विश्वसनीय-प्रॉक्सी जाँचों में सफल हो, तब Control UI WebSocket सत्र डिवाइस पेयरिंग पहचान के बिना कनेक्ट हो सकते हैं।

स्कोप संबंधी प्रभाव:

- डिवाइस-रहित Control UI WebSocket सत्र कनेक्ट होते हैं, लेकिन डिफ़ॉल्ट रूप से उन्हें कोई ऑपरेटर स्कोप नहीं मिलता। OpenClaw अनुरोधित स्कोप सूची को `[]` पर साफ़ कर देता है, ताकि स्वीकृत पेयर्ड डिवाइस/टोकन से न जुड़ा सत्र स्वयं अनुमतियाँ घोषित न कर सके।
- यदि सफल WebSocket कनेक्शन के बाद विधियाँ `missing scope` के साथ विफल होती हैं, तो HTTPS का उपयोग करें, ताकि ब्राउज़र डिवाइस पहचान बना सके और पेयरिंग पूरी कर सके। [Control UI असुरक्षित HTTP](/hi/web/control-ui#insecure-http) देखें।
- केवल आपातकालीन उपयोग: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` डिवाइस पहचान के बिना भी अनुरोधित स्कोप बनाए रखता है। यह सुरक्षा में गंभीर गिरावट है; इसे शीघ्र वापस बदलें। [Control UI असुरक्षित HTTP](/hi/web/control-ui#insecure-http) देखें।

रिवर्स-प्रॉक्सी स्कोप सीमा: यदि आपका प्रॉक्सी Control UI WebSocket अपग्रेड अनुरोध पर `x-openclaw-scopes` भेजता है, तो OpenClaw सत्र स्कोप को अनुरोधित और घोषित स्कोप के प्रतिच्छेद तक सीमित कर देता है। यह हेडर स्कोप प्रदान नहीं करता; यह केवल सत्र द्वारा रखे जा सकने वाले स्कोप को सीमित करता है। जब `deviceAutoApprove.enabled` सत्य हो, तो यही सीमा [स्वचालित डिवाइस स्वीकृति](#automatic-device-approval) द्वारा लिखे गए स्थायी डिवाइस अनुदान पर भी लागू होती है, इसलिए स्वचालित रूप से स्वीकृत डिवाइस के पास प्रॉक्सी द्वारा घोषित स्कोप से अधिक स्कोप कभी नहीं होते।

प्रभाव:

- डिवाइस-रहित Control UI पहुँच के लिए पेयरिंग अब प्राथमिक गेट नहीं रहती। जब `deviceAutoApprove.enabled` सत्य हो, तो प्रॉक्सी पहचान नए ब्राउज़र डिवाइस नामांकन के लिए भी स्वीकृति गेट बन जाती है।
- आपकी रिवर्स प्रॉक्सी प्रमाणीकरण नीति और `allowUsers` प्रभावी पहुँच नियंत्रण बन जाते हैं।
- Gateway इनग्रेस को केवल विश्वसनीय प्रॉक्सी IP तक सीमित रखें (`gateway.trustedProxies` + फ़ायरवॉल)।

कस्टम WebSocket क्लाइंट Control UI सत्र नहीं होते। `gateway.controlUi.dangerouslyDisableDeviceAuth` मनमाने `client.mode: "backend"` या CLI-जैसे क्लाइंट को स्कोप प्रदान नहीं करता। कस्टम स्वचालन को डिवाइस पहचान/पेयरिंग, आरक्षित प्रत्यक्ष-स्थानीय `client.id: "gateway-client"` बैकएंड सहायक मार्ग, या जहाँ HTTP अनुरोध/प्रतिक्रिया सतह अधिक उपयुक्त हो वहाँ [एडमिन HTTP RPC plugin](/hi/plugins/admin-http-rpc) का उपयोग करना चाहिए।

## ऑपरेटर स्कोप हेडर

Trusted-proxy प्रमाणीकरण एक **पहचान-धारक** HTTP मोड है, इसलिए कॉलर HTTP API अनुरोधों पर `x-openclaw-scopes` के साथ वैकल्पिक रूप से ऑपरेटर दायरे घोषित कर सकते हैं।

नोट: WebSocket दायरे Gateway प्रोटोकॉल हैंडशेक और डिवाइस पहचान बाइंडिंग द्वारा निर्धारित होते हैं। Control UI WebSocket अपग्रेड अनुरोधों पर, `x-openclaw-scopes` केवल तय किए गए सत्र दायरों की अधिकतम सीमा है, अनुमति नहीं। [Control UI पेयरिंग व्यवहार](#control-ui-pairing-behavior) देखें।

उदाहरण:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

व्यवहार:

- हेडर मौजूद होने पर, OpenClaw घोषित दायरा सेट का पालन करता है।
- हेडर मौजूद लेकिन खाली होने पर, अनुरोध **कोई भी** ऑपरेटर दायरा घोषित नहीं करता।
- हेडर अनुपस्थित होने पर, सामान्य पहचान-धारक HTTP API मानक डिफ़ॉल्ट ऑपरेटर दायरा सेट (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`) का उपयोग करते हैं।
- Gateway-प्रमाणित **plugin HTTP रूट** डिफ़ॉल्ट रूप से अधिक सीमित होते हैं: `x-openclaw-scopes` अनुपस्थित होने पर, उनका रनटाइम दायरा केवल `operator.write` का उपयोग करता है।
- Trusted-proxy प्रमाणीकरण सफल होने के बाद भी ब्राउज़र-मूल HTTP अनुरोधों को `gateway.controlUi.allowedOrigins` (या जानबूझकर सक्षम Host-header फ़ॉलबैक मोड) से गुजरना आवश्यक है।

व्यावहारिक नियम: जब किसी trusted-proxy अनुरोध को डिफ़ॉल्ट से अधिक सीमित रखना हो, या Gateway-प्रमाणित plugin रूट को लेखन दायरे से अधिक शक्तिशाली दायरे की आवश्यकता हो, तब `x-openclaw-scopes` स्पष्ट रूप से भेजें।

## TLS टर्मिनेशन और HSTS

एक TLS टर्मिनेशन बिंदु उपयोग करें और वहीं HSTS लागू करें।

<Tabs>
  <Tab title="प्रॉक्सी TLS टर्मिनेशन (अनुशंसित)">
    जब आपका रिवर्स प्रॉक्सी `https://control.example.com` के लिए HTTPS संभालता है, तो उस डोमेन के लिए प्रॉक्सी पर `Strict-Transport-Security` सेट करें।

    - इंटरनेट-सामना करने वाले परिनियोजनों के लिए उपयुक्त।
    - प्रमाणपत्र और HTTP सुरक्षा-सुदृढ़ीकरण नीति को एक ही स्थान पर रखता है।
    - OpenClaw प्रॉक्सी के पीछे लूपबैक HTTP पर रह सकता है।

    हेडर मान का उदाहरण:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS टर्मिनेशन">
    यदि OpenClaw स्वयं सीधे HTTPS प्रदान करता है (कोई TLS-टर्मिनेटिंग प्रॉक्सी नहीं), तो यह सेट करें:

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` एक स्ट्रिंग हेडर मान स्वीकार करता है, या स्पष्ट रूप से अक्षम करने के लिए `false` स्वीकार करता है।

  </Tab>
</Tabs>

### रोलआउट मार्गदर्शन

- ट्रैफ़िक सत्यापित करते समय पहले छोटी अधिकतम अवधि (उदाहरण के लिए `max-age=300`) से शुरुआत करें।
- पूरा भरोसा होने के बाद ही दीर्घकालिक मानों (उदाहरण के लिए `max-age=31536000`) तक बढ़ाएँ।
- केवल तभी `includeSubDomains` जोड़ें, जब प्रत्येक सबडोमेन HTTPS के लिए तैयार हो।
- Preload का उपयोग केवल तभी करें, जब आप जानबूझकर अपने संपूर्ण डोमेन सेट की preload आवश्यकताओं को पूरा करते हों।
- केवल-लूपबैक स्थानीय विकास को HSTS से कोई लाभ नहीं मिलता।

## प्रॉक्सी सेटअप के उदाहरण

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium पहचान को `x-pomerium-claim-email` (या अन्य क्लेम हेडर) में और JWT को `x-pomerium-jwt-assertion` में भेजता है।

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium का IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Pomerium कॉन्फ़िगरेशन अंश:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="OAuth के साथ Caddy">
    `caddy-security` plugin वाला Caddy उपयोगकर्ताओं को प्रमाणित कर सकता है और पहचान हेडर भेज सकता है।

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/साइडकार प्रॉक्सी IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile अंश:

    ```caddy
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy उपयोगकर्ताओं को प्रमाणित करता है और पहचान को `x-auth-request-email` में भेजता है।

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    nginx कॉन्फ़िगरेशन अंश:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="फ़ॉरवर्ड प्रमाणीकरण के साथ Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik कंटेनर IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## मिश्रित टोकन कॉन्फ़िगरेशन

यदि कोई साझा टोकन भी कॉन्फ़िगर किया गया हो (`gateway.auth.token` या `OPENCLAW_GATEWAY_TOKEN`), तो Gateway स्टार्टअप trusted-proxy प्रमाणीकरण को अस्वीकार करता है। दोनों परस्पर अनन्य हैं, क्योंकि साझा टोकन समान होस्ट के कॉलर को उस प्रॉक्सी-सत्यापित पहचान से बिल्कुल अलग मार्ग पर प्रमाणित होने देगा, जिसे यह मोड लागू करने के लिए बनाया गया है।

यदि स्टार्टअप `gateway auth mode is trusted-proxy, but a shared token is also configured` जैसी त्रुटि के साथ विफल होता है:

- Trusted-proxy मोड का उपयोग करते समय साझा टोकन हटाएँ, या
- यदि टोकन-आधारित प्रमाणीकरण अभीष्ट है, तो `gateway.auth.mode` को `"token"` में बदलें।

लूपबैक trusted-proxy पहचान हेडर अब भी विफलता पर बंद रहते हैं: समान होस्ट के कॉलर को चुपचाप प्रॉक्सी उपयोगकर्ताओं के रूप में प्रमाणित नहीं किया जाता। प्रॉक्सी को बायपास करने वाले आंतरिक OpenClaw कॉलर इसके बजाय `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` से प्रमाणित हो सकते हैं। Trusted-proxy मोड में टोकन फ़ॉलबैक जानबूझकर असमर्थित रहता है।

## सुरक्षा चेकलिस्ट

Trusted-proxy प्रमाणीकरण सक्षम करने से पहले सत्यापित करें:

- [ ] **प्रॉक्सी ही एकमात्र मार्ग है**: Gateway पोर्ट को आपके प्रॉक्सी के अतिरिक्त सभी स्रोतों से फ़ायरवॉल द्वारा अवरुद्ध किया गया है।
- [ ] **trustedProxies न्यूनतम है**: केवल आपके वास्तविक प्रॉक्सी IP, संपूर्ण सबनेट नहीं।
- [ ] **लूपबैक प्रॉक्सी स्रोत जानबूझकर चुना गया है**: समान-होस्ट प्रॉक्सी के लिए `gateway.auth.trustedProxy.allowLoopback` स्पष्ट रूप से सक्षम न होने पर, लूपबैक-स्रोत अनुरोधों के लिए trusted-proxy प्रमाणीकरण विफलता पर बंद रहता है।
- [ ] **प्रॉक्सी हेडर हटाता है**: आपका प्रॉक्सी क्लाइंट से आए `x-forwarded-*` हेडर को अधिलेखित करता है (उनमें जोड़ता नहीं है)।
- [ ] **TLS टर्मिनेशन**: आपका प्रॉक्सी TLS संभालता है; उपयोगकर्ता HTTPS के माध्यम से कनेक्ट होते हैं।
- [ ] **allowedOrigins स्पष्ट है**: गैर-लूपबैक Control UI स्पष्ट `gateway.controlUi.allowedOrigins` का उपयोग करता है।
- [ ] **allowUsers सेट है** (अनुशंसित): किसी भी प्रमाणित व्यक्ति को अनुमति देने के बजाय ज्ञात उपयोगकर्ताओं तक सीमित करें।
- [ ] **कोई मिश्रित टोकन कॉन्फ़िगरेशन नहीं**: `gateway.auth.token` और `gateway.auth.mode: "trusted-proxy"` दोनों सेट न करें।
- [ ] **स्थानीय पासवर्ड फ़ॉलबैक निजी है**: यदि आप आंतरिक प्रत्यक्ष कॉलर के लिए `gateway.auth.password` कॉन्फ़िगर करते हैं, तो Gateway पोर्ट को फ़ायरवॉल से सुरक्षित रखें, ताकि गैर-प्रॉक्सी दूरस्थ क्लाइंट उस तक सीधे न पहुँच सकें।
- [ ] **डिवाइस स्वतः-अनुमोदन जानबूझकर सक्षम है**: यदि `deviceAutoApprove.enabled` true है, तो रिवर्स-प्रॉक्सी खाता सुरक्षा को डिवाइस-पंजीकरण सीमा मानें और प्रदान की गई दायरा सूची को गैर-एडमिन तथा न्यूनतम रखें।

## सुरक्षा ऑडिट

`openclaw security audit` trusted-proxy प्रमाणीकरण को **गंभीर** तीव्रता वाले निष्कर्ष के रूप में चिह्नित करता है। यह जानबूझकर किया गया है; यह याद दिलाता है कि आप सुरक्षा अपने प्रॉक्सी सेटअप को सौंप रहे हैं।

ऑडिट इनकी जाँच करता है:

- मूल `gateway.trusted_proxy_auth` चेतावनी/गंभीर अनुस्मारक।
- `trustedProxies` कॉन्फ़िगरेशन अनुपस्थित है।
- `userHeader` कॉन्फ़िगरेशन अनुपस्थित है।
- खाली `allowUsers` (किसी भी प्रमाणित उपयोगकर्ता को अनुमति देता है)।
- समान-होस्ट प्रॉक्सी स्रोतों के लिए `allowLoopback` सक्षम है।
- ब्राउज़र डिवाइस स्वतः-अनुमोदन सक्षम है (नए डिवाइस की पेयरिंग प्रॉक्सी पहचान को सौंपता है)।

जब भी Control UI सार्वजनिक रूप से उपलब्ध होता है, अलग गैर-trusted-proxy-विशिष्ट निष्कर्ष भी लागू होते हैं: वाइल्डकार्ड या अनुपस्थित `gateway.controlUi.allowedOrigins`, और Host-header मूल फ़ॉलबैक।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    अनुरोध `gateway.trustedProxies` में शामिल किसी IP से नहीं आया। जाँचें:

    - क्या प्रॉक्सी IP सही है? (Docker कंटेनर IP बदल सकते हैं।)
    - क्या आपके प्रॉक्सी के सामने कोई लोड बैलेंसर है?
    - वास्तविक IP खोजने के लिए `docker inspect` या `kubectl get pods -o wide` का उपयोग करें।

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ने लूपबैक-स्रोत trusted-proxy अनुरोध अस्वीकार कर दिया।

    जाँचें:

    - क्या प्रॉक्सी `127.0.0.1` / `::1` से कनेक्ट हो रहा है?
    - क्या आप समान-होस्ट लूपबैक रिवर्स प्रॉक्सी के साथ trusted-proxy प्रमाणीकरण उपयोग करने का प्रयास कर रहे हैं?

    समाधान:

    - उन आंतरिक समान-होस्ट क्लाइंट के लिए टोकन/पासवर्ड प्रमाणीकरण को प्राथमिकता दें, जो प्रॉक्सी से होकर नहीं गुजरते, या
    - किसी गैर-लूपबैक विश्वसनीय प्रॉक्सी पते से रूट करें और उस IP को `gateway.trustedProxies` में रखें, या
    - जानबूझकर स्थापित समान-होस्ट रिवर्स प्रॉक्सी के लिए `gateway.auth.trustedProxy.allowLoopback = true` सेट करें, लूपबैक पते को `gateway.trustedProxies` में रखें और सुनिश्चित करें कि प्रॉक्सी पहचान हेडर को हटाता या अधिलेखित करता है।

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    अनुरोध का स्रोत IP Gateway होस्ट के अपने गैर-लूपबैक नेटवर्क इंटरफ़ेस पतों में से किसी एक (प्रॉक्सी नहीं) से मेल खाता है। यह टेलनेट या Docker ब्रिज नेटवर्क पर जाली समान-होस्ट ट्रैफ़िक के विरुद्ध सुरक्षा है। `..._check_failed` का अर्थ है कि इंटरफ़ेस खोज में ही त्रुटि हुई, इसलिए OpenClaw विफलता पर बंद रहता है।

    जाँचें:

    - क्या Gateway होस्ट पर चल रही कोई प्रक्रिया प्रॉक्सी को बायपास करके सीधे पहचान हेडर भेज रही है?
    - क्या प्रॉक्सी Gateway के समान नेटवर्क नेमस्पेस में ऐसे IP के साथ चलता है, जो स्थानीय इंटरफ़ेस के रूप में भी दिखाई देता है?

    समाधान: प्रॉक्सी ट्रैफ़िक को ऐसे पते से रूट करें जो Gateway होस्ट पर स्थानीय रूप से भी बाउंड न हो, या वास्तविक समान-होस्ट प्रॉक्सी सेटअप के लिए ही `allowLoopback` का उपयोग करें।

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    उपयोगकर्ता हेडर खाली या अनुपस्थित था। जाँचें:

    - क्या आपका प्रॉक्सी पहचान हेडर भेजने के लिए कॉन्फ़िगर किया गया है?
    - क्या हेडर का नाम सही है? (अक्षर केस से फ़र्क नहीं पड़ता, लेकिन वर्तनी महत्वपूर्ण है)
    - क्या उपयोगकर्ता वास्तव में प्रॉक्सी पर प्रमाणित है?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    एक आवश्यक हेडर मौजूद नहीं था। जाँचें:

    - उन विशिष्ट हेडर के लिए आपका प्रॉक्सी कॉन्फ़िगरेशन।
    - क्या शृंखला में कहीं हेडर हटाए जा रहे हैं।

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    उपयोगकर्ता प्रमाणित है, लेकिन `allowUsers` में नहीं है। उन्हें इसमें जोड़ें या अनुमति-सूची हटा दें।
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode`, `"trusted-proxy"` है, लेकिन `gateway.trustedProxies` खाली है, या स्वयं `gateway.auth.trustedProxy` मौजूद नहीं है। दोनों सेट होने तक प्रत्येक अनुरोध अस्वीकार किया जाता है।
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    विश्वसनीय-प्रॉक्सी प्रमाणीकरण सफल रहा, लेकिन ब्राउज़र का `Origin` हेडर Control UI की ओरिजिन जाँच में सफल नहीं हुआ।

    जाँचें:

    - `gateway.controlUi.allowedOrigins` में ब्राउज़र का सटीक ओरिजिन शामिल है।
    - आप वाइल्डकार्ड ओरिजिन पर निर्भर नहीं हैं, जब तक कि आप जानबूझकर सभी को अनुमति देने वाला व्यवहार नहीं चाहते।
    - यदि आप जानबूझकर Host-हेडर फ़ॉलबैक मोड का उपयोग करते हैं, तो `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` सोच-समझकर सेट किया गया है।

  </Accordion>
  <Accordion title="कनेक्शन सफल होता है, लेकिन विधियाँ अनुपलब्ध स्कोप की सूचना देती हैं">
    WebSocket कनेक्ट होता है, लेकिन `chat.history`, `sessions.list`, या
    `models.list`, `missing scope: operator.read` के साथ विफल होता है।

    सामान्य कारण:

    - डिवाइस-रहित Control UI सत्र: विश्वसनीय-प्रॉक्सी प्रमाणीकरण डिवाइस पहचान के बिना WebSocket कनेक्शन की अनुमति दे सकता है, लेकिन OpenClaw डिज़ाइन के अनुसार डिवाइस-रहित सत्रों से स्कोप हटा देता है।
    - कस्टम बैकएंड क्लाइंट: `gateway.controlUi.dangerouslyDisableDeviceAuth`, Control UI तक सीमित है और मनमाने बैकएंड या CLI-जैसे WebSocket क्लाइंट को स्कोप प्रदान नहीं करता।
    - अत्यधिक सीमित `x-openclaw-scopes`: यदि आपका प्रॉक्सी Control UI के WebSocket अपग्रेड अनुरोध में यह हेडर जोड़ता है, तो सत्र के स्कोप उस सेट तक सीमित हो जाते हैं। हेडर का खाली मान कोई स्कोप प्रदान नहीं करता।

    समाधान:

    - Control UI के लिए HTTPS का उपयोग करें, ताकि ब्राउज़र डिवाइस पहचान उत्पन्न कर सके और पेयरिंग पूरी कर सके।
    - कस्टम स्वचालन के लिए डिवाइस पहचान/पेयरिंग, आरक्षित प्रत्यक्ष-स्थानीय `gateway-client` बैकएंड सहायक पथ, या [एडमिन HTTP RPC](/hi/plugins/admin-http-rpc) का उपयोग करें।
    - `gateway.controlUi.dangerouslyDisableDeviceAuth: true` का उपयोग केवल अस्थायी Control UI आपातकालीन पहुँच पथ के रूप में करें।

  </Accordion>
  <Accordion title="WebSocket अब भी विफल हो रहा है">
    सुनिश्चित करें कि आपका प्रॉक्सी:

    - WebSocket अपग्रेड (`Upgrade: websocket`, `Connection: upgrade`) का समर्थन करता है।
    - WebSocket अपग्रेड अनुरोधों पर पहचान हेडर भेजता है (केवल HTTP पर नहीं)।
    - WebSocket कनेक्शनों के लिए अलग प्रमाणीकरण पथ का उपयोग नहीं करता।

  </Accordion>
</AccordionGroup>

## टोकन प्रमाणीकरण से माइग्रेशन

<Steps>
  <Step title="प्रॉक्सी कॉन्फ़िगर करें">
    उपयोगकर्ताओं को प्रमाणित करने और हेडर भेजने के लिए अपना प्रॉक्सी कॉन्फ़िगर करें।
  </Step>
  <Step title="प्रॉक्सी का स्वतंत्र रूप से परीक्षण करें">
    प्रॉक्सी सेटअप का स्वतंत्र रूप से परीक्षण करें (हेडर के साथ curl)।
  </Step>
  <Step title="OpenClaw कॉन्फ़िगरेशन अपडेट करें">
    विश्वसनीय-प्रॉक्सी प्रमाणीकरण के साथ OpenClaw कॉन्फ़िगरेशन अपडेट करें।
  </Step>
  <Step title="Gateway पुनः आरंभ करें">
    Gateway पुनः आरंभ करें।
  </Step>
  <Step title="WebSocket का परीक्षण करें">
    Control UI से WebSocket कनेक्शनों का परीक्षण करें।
  </Step>
  <Step title="ऑडिट करें">
    `openclaw security audit` चलाएँ और निष्कर्षों की समीक्षा करें।
  </Step>
</Steps>

## संबंधित

- [कॉन्फ़िगरेशन](/hi/gateway/configuration) — कॉन्फ़िगरेशन संदर्भ
- [ऑपरेटर स्कोप](/hi/gateway/operator-scopes) — भूमिकाएँ, स्कोप और अनुमोदन जाँच
- [रिमोट एक्सेस](/hi/gateway/remote) — रिमोट एक्सेस के अन्य पैटर्न
- [सुरक्षा](/hi/gateway/security) — संपूर्ण सुरक्षा मार्गदर्शिका
- [Tailscale](/hi/gateway/tailscale) — केवल टेलनेट एक्सेस के लिए सरल विकल्प
