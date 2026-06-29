---
read_when:
    - पहचान-जागरूक प्रॉक्सी के पीछे OpenClaw चलाना
    - OpenClaw के सामने OAuth के साथ Pomerium, Caddy, या nginx सेट अप करना
    - रिवर्स प्रॉक्सी सेटअप के साथ WebSocket 1008 अनधिकृत त्रुटियों को ठीक करना
    - HSTS और अन्य HTTP हार्डनिंग हेडर कहाँ सेट करने हैं, यह तय करना
sidebarTitle: Trusted proxy auth
summary: Gateway प्रमाणीकरण को किसी विश्वसनीय रिवर्स प्रॉक्सी (Pomerium, Caddy, nginx + OAuth) को सौंपें
title: विश्वसनीय प्रॉक्सी प्रमाणीकरण
x-i18n:
    generated_at: "2026-06-28T23:15:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**सुरक्षा-संवेदनशील सुविधा।** यह मोड प्रमाणीकरण को पूरी तरह आपके reverse proxy को सौंपता है। गलत कॉन्फ़िगरेशन आपके Gateway को अनधिकृत पहुंच के लिए उजागर कर सकता है। सक्षम करने से पहले इस पेज को ध्यान से पढ़ें।
</Warning>

## कब उपयोग करें

`trusted-proxy` auth मोड का उपयोग तब करें जब:

- आप OpenClaw को किसी **identity-aware proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth) के पीछे चलाते हैं।
- आपका proxy पूरा प्रमाणीकरण संभालता है और headers के जरिए user identity पास करता है।
- आप Kubernetes या container परिवेश में हैं जहां proxy ही Gateway तक पहुंचने का एकमात्र रास्ता है।
- आपको WebSocket `1008 unauthorized` त्रुटियां मिल रही हैं क्योंकि browsers WS payloads में tokens पास नहीं कर सकते।

## कब उपयोग न करें

- यदि आपका proxy users को authenticate नहीं करता (सिर्फ TLS terminator या load balancer है)।
- यदि Gateway तक कोई ऐसा रास्ता है जो proxy को bypass करता है (firewall holes, internal network access)।
- यदि आप सुनिश्चित नहीं हैं कि आपका proxy forwarded headers को सही तरह strip/overwrite करता है या नहीं।
- यदि आपको केवल व्यक्तिगत single-user access चाहिए (सरल setup के लिए Tailscale Serve + loopback पर विचार करें)।

## यह कैसे काम करता है

<Steps>
  <Step title="Proxy user को authenticate करता है">
    आपका reverse proxy users को authenticate करता है (OAuth, OIDC, SAML, आदि)।
  </Step>
  <Step title="Proxy एक identity header जोड़ता है">
    Proxy authenticated user identity के साथ एक header जोड़ता है (जैसे, `x-forwarded-user: nick@example.com`)।
  </Step>
  <Step title="Gateway trusted source सत्यापित करता है">
    OpenClaw जांचता है कि request किसी **trusted proxy IP** से आई है (`gateway.trustedProxies` में configured)।
  </Step>
  <Step title="Gateway identity निकालता है">
    OpenClaw configured header से user identity निकालता है।
  </Step>
  <Step title="Authorize">
    यदि सब कुछ सही पाया जाता है, तो request authorized होती है।
  </Step>
</Steps>

## Control UI pairing व्यवहार

जब `gateway.auth.mode = "trusted-proxy"` सक्रिय हो और request trusted-proxy checks पास कर ले, तो Control UI WebSocket sessions device pairing identity के बिना connect कर सकते हैं।

Scope implications:

- Device-less Control UI WebSocket sessions connect करते हैं लेकिन default रूप से कोई operator scopes प्राप्त नहीं करते। OpenClaw requested scope list को `[]` पर clear कर देता है ताकि ऐसा session जो approved paired device/token से bound नहीं है, permissions self-declare न कर सके।
- यदि सफल WebSocket connect के बाद methods `missing scope` के साथ fail हों, तो HTTPS का उपयोग करें ताकि browser device identity generate कर सके और pairing complete कर सके। देखें [Control UI insecure HTTP](/hi/web/control-ui#insecure-http)।
- केवल break-glass: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` device identity के बिना भी requested scopes को preserve करता है। यह गंभीर security downgrade है; जल्दी revert करें। देखें [Control UI insecure HTTP](/hi/web/control-ui#insecure-http)।

Reverse-proxy scope capping:

- यदि आपका proxy Control UI WebSocket upgrade request पर `x-openclaw-scopes` भेजता है, तो OpenClaw session scopes को requested scopes और declared scopes के intersection तक cap करता है। यह header scopes grant नहीं करता; यह केवल session द्वारा रखे जा सकने वाले scopes को narrow करता है।

Implications:

- इस mode में Control UI access के लिए pairing अब primary gate नहीं है।
- आपकी reverse proxy auth policy और `allowUsers` effective access control बन जाते हैं।
- gateway ingress को केवल trusted proxy IPs तक locked रखें (`gateway.trustedProxies` + firewall)।

Custom WebSocket clients Control UI sessions नहीं हैं। `gateway.controlUi.dangerouslyDisableDeviceAuth` arbitrary `client.mode: "backend"` या CLI-shaped clients को scopes grant नहीं करता। Custom automation को device identity/pairing, reserved direct-local `client.id: "gateway-client"` backend helper path, या [admin HTTP RPC plugin](/hi/plugins/admin-http-rpc) का उपयोग करना चाहिए जब HTTP request/response surface बेहतर fit हो।

## कॉन्फ़िगरेशन

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**महत्वपूर्ण runtime नियम**

- Trusted-proxy auth default रूप से loopback-source requests (`127.0.0.1`, `::1`, loopback CIDRs) को reject करता है।
- Same-host loopback reverse proxies trusted-proxy auth को satisfy **नहीं** करते, जब तक आप स्पष्ट रूप से `gateway.auth.trustedProxy.allowLoopback = true` set न करें और loopback address को `gateway.trustedProxies` में include न करें।
- `allowLoopback` Gateway host पर local processes पर reverse proxy जितना ही trust करता है। इसे केवल तब enable करें जब Gateway अभी भी direct remote access से firewalled हो और local proxy client-supplied identity headers को strips या overwrites करता हो।
- Internal Gateway clients जो reverse proxy से होकर नहीं जाते, उन्हें trusted-proxy identity headers के बजाय `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` का उपयोग करना चाहिए।
- Non-loopback Control UI deployments को अभी भी explicit `gateway.controlUi.allowedOrigins` चाहिए।
- **Forwarded-header evidence local direct fallback के लिए loopback locality को override करता है।** यदि कोई request loopback पर आती है लेकिन `Forwarded`, कोई भी `X-Forwarded-*`, या `X-Real-IP` header evidence लेकर आती है, तो वह evidence local-direct password fallback और device-identity gating को disqualify करता है। `allowLoopback: true` के साथ, trusted-proxy auth request को same-host proxy request के रूप में फिर भी accept कर सकता है, जबकि `requiredHeaders` और `allowUsers` लागू रहते हैं।

</Warning>

### कॉन्फ़िगरेशन संदर्भ

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Trust करने के लिए proxy IP addresses की array। अन्य IPs से आने वाली requests reject की जाती हैं।
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  `"trusted-proxy"` होना चाहिए।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Authenticated user identity रखने वाले header का नाम।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  अतिरिक्त headers जो request को trusted मानने के लिए present होने चाहिए।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  User identities की allowlist। Empty का अर्थ है सभी authenticated users को allow करना।
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Same-host loopback reverse proxies के लिए opt-in support। Defaults to `false`।
</ParamField>

<Warning>
`allowLoopback` को केवल तब enable करें जब local reverse proxy intended trust boundary हो। कोई भी local process जो Gateway से connect कर सकता है, proxy identity headers भेजने की कोशिश कर सकता है, इसलिए direct Gateway access को host तक private रखें और proxy-owned headers जैसे `x-forwarded-proto` या signed assertion header require करें जहां आपका proxy इसका support करता हो।
</Warning>

## TLS termination और HSTS

एक TLS termination point का उपयोग करें और HSTS वहीं apply करें।

<Tabs>
  <Tab title="Proxy TLS termination (अनुशंसित)">
    जब आपका reverse proxy `https://control.example.com` के लिए HTTPS संभालता है, तो उस domain के लिए proxy पर `Strict-Transport-Security` set करें।

    - Internet-facing deployments के लिए अच्छा fit।
    - Certificate + HTTP hardening policy को एक जगह रखता है।
    - OpenClaw proxy के पीछे loopback HTTP पर रह सकता है।

    उदाहरण header value:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    यदि OpenClaw स्वयं सीधे HTTPS serve करता है (कोई TLS-terminating proxy नहीं), तो set करें:

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

    `strictTransportSecurity` string header value स्वीकार करता है, या explicit रूप से disable करने के लिए `false`।

  </Tab>
</Tabs>

### Rollout मार्गदर्शन

- Traffic validate करते समय पहले short max age से start करें (उदाहरण के लिए `max-age=300`)।
- केवल confidence high होने के बाद long-lived values तक बढ़ाएं (उदाहरण के लिए `max-age=31536000`)।
- `includeSubDomains` केवल तब add करें जब हर subdomain HTTPS-ready हो।
- Preload का उपयोग केवल तब करें जब आप अपने full domain set के लिए जानबूझकर preload requirements पूरी करते हों।
- Loopback-only local development को HSTS से लाभ नहीं होता।

## Proxy setup examples

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium identity को `x-pomerium-claim-email` (या अन्य claim headers) में और JWT को `x-pomerium-jwt-assertion` में पास करता है।

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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

    Pomerium config snippet:

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
  <Accordion title="Caddy with OAuth">
    `caddy-security` plugin वाला Caddy users को authenticate कर सकता है और identity headers पास कर सकता है।

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile snippet:

    ```
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
    oauth2-proxy users को authenticate करता है और identity को `x-auth-request-email` में पास करता है।

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

    nginx config snippet:

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
  <Accordion title="Traefik with forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
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

## Mixed token configuration

OpenClaw ऐसी ambiguous configurations को reject करता है जहां `gateway.auth.token` (या `OPENCLAW_GATEWAY_TOKEN`) और `trusted-proxy` mode दोनों एक साथ active हों। Mixed token configs loopback requests को गलत auth path पर चुपचाप authenticate करा सकते हैं।

यदि startup पर आपको `mixed_trusted_proxy_token` error दिखे:

- Trusted-proxy mode का उपयोग करते समय shared token remove करें, या
- यदि आप token-based auth चाहते हैं तो `gateway.auth.mode` को `"token"` पर switch करें।

Loopback विश्वसनीय-प्रॉक्सी पहचान हेडर अब भी बंद-रूप में विफल होते हैं: समान-होस्ट कॉलर को चुपचाप प्रॉक्सी उपयोगकर्ताओं के रूप में प्रमाणित नहीं किया जाता। आंतरिक OpenClaw कॉलर जो प्रॉक्सी को बायपास करते हैं, इसके बजाय `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` से प्रमाणित हो सकते हैं। विश्वसनीय-प्रॉक्सी मोड में टोकन फ़ॉलबैक जानबूझकर असमर्थित रहता है।

## ऑपरेटर स्कोप हेडर

विश्वसनीय-प्रॉक्सी प्रमाणीकरण एक **पहचान-वहन करने वाला** HTTP मोड है, इसलिए कॉलर HTTP API अनुरोधों पर `x-openclaw-scopes` के साथ वैकल्पिक रूप से ऑपरेटर स्कोप घोषित कर सकते हैं।

ध्यान दें: WebSocket स्कोप Gateway प्रोटोकॉल हैंडशेक और डिवाइस पहचान बाइंडिंग से निर्धारित होते हैं। Control UI WebSocket अपग्रेड अनुरोधों पर, `x-openclaw-scopes` केवल सहमति प्राप्त सत्र स्कोप पर एक सीमा है, अनुदान नहीं। विश्वसनीय-प्रॉक्सी के साथ WebSocket स्कोप व्यवहार के लिए, [Control UI पेयरिंग व्यवहार](#control-ui-pairing-behavior) देखें।

उदाहरण:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

व्यवहार:

- जब हेडर मौजूद होता है, OpenClaw घोषित स्कोप सेट का सम्मान करता है।
- जब हेडर मौजूद होता है लेकिन खाली होता है, अनुरोध **कोई** ऑपरेटर स्कोप घोषित नहीं करता।
- जब हेडर अनुपस्थित होता है, सामान्य पहचान-वहन करने वाले HTTP API मानक ऑपरेटर डिफ़ॉल्ट स्कोप सेट पर वापस जाते हैं।
- Gateway-प्रमाणीकरण **plugin HTTP रूट** डिफ़ॉल्ट रूप से अधिक संकरे हैं: जब `x-openclaw-scopes` अनुपस्थित होता है, उनका रनटाइम स्कोप `operator.write` पर वापस जाता है।
- ब्राउज़र-मूल HTTP अनुरोधों को विश्वसनीय-प्रॉक्सी प्रमाणीकरण सफल होने के बाद भी `gateway.controlUi.allowedOrigins` (या जानबूझकर Host-हेडर फ़ॉलबैक मोड) पास करना होता है।
- Control UI WebSocket सत्रों के लिए, अपग्रेड अनुरोध पर मौजूद होने पर `x-openclaw-scopes` एक स्कोप सीमा है। खाली मान से कोई स्कोप नहीं मिलता।

व्यावहारिक नियम: जब आप चाहते हैं कि कोई विश्वसनीय-प्रॉक्सी अनुरोध डिफ़ॉल्ट से संकरा हो, या जब किसी gateway-auth plugin रूट को write स्कोप से अधिक मजबूत कुछ चाहिए, तब `x-openclaw-scopes` स्पष्ट रूप से भेजें।

## सुरक्षा चेकलिस्ट

विश्वसनीय-प्रॉक्सी प्रमाणीकरण सक्षम करने से पहले, सत्यापित करें:

- [ ] **प्रॉक्सी ही एकमात्र पथ है**: Gateway पोर्ट आपके प्रॉक्सी के अलावा हर चीज़ से फ़ायरवॉल किया गया है।
- [ ] **trustedProxies न्यूनतम है**: केवल आपके वास्तविक प्रॉक्सी IP, पूरे सबनेट नहीं।
- [ ] **Loopback प्रॉक्सी स्रोत जानबूझकर है**: loopback-स्रोत अनुरोधों के लिए विश्वसनीय-प्रॉक्सी प्रमाणीकरण बंद-रूप में विफल होता है, जब तक कि समान-होस्ट प्रॉक्सी के लिए `gateway.auth.trustedProxy.allowLoopback` स्पष्ट रूप से सक्षम न हो।
- [ ] **प्रॉक्सी हेडर हटाता है**: आपका प्रॉक्सी क्लाइंट से आने वाले `x-forwarded-*` हेडर को ओवरराइट करता है (जोड़ता नहीं)।
- [ ] **TLS समाप्ति**: आपका प्रॉक्सी TLS संभालता है; उपयोगकर्ता HTTPS से कनेक्ट करते हैं।
- [ ] **allowedOrigins स्पष्ट है**: non-loopback Control UI स्पष्ट `gateway.controlUi.allowedOrigins` का उपयोग करता है।
- [ ] **allowUsers सेट है** (अनुशंसित): किसी भी प्रमाणित व्यक्ति को अनुमति देने के बजाय ज्ञात उपयोगकर्ताओं तक सीमित करें।
- [ ] **मिश्रित टोकन कॉन्फ़िग नहीं है**: `gateway.auth.token` और `gateway.auth.mode: "trusted-proxy"` दोनों सेट न करें।
- [ ] **स्थानीय पासवर्ड फ़ॉलबैक निजी है**: यदि आप आंतरिक प्रत्यक्ष कॉलरों के लिए `gateway.auth.password` कॉन्फ़िगर करते हैं, तो Gateway पोर्ट को फ़ायरवॉल रखें ताकि non-proxy रिमोट क्लाइंट सीधे उस तक न पहुंच सकें।

## सुरक्षा ऑडिट

`openclaw security audit` विश्वसनीय-प्रॉक्सी प्रमाणीकरण को **critical** गंभीरता वाली खोज के साथ फ़्लैग करेगा। यह जानबूझकर है — यह याद दिलाता है कि आप सुरक्षा को अपनी प्रॉक्सी सेटअप को सौंप रहे हैं।

ऑडिट इनकी जांच करता है:

- आधार `gateway.trusted_proxy_auth` चेतावनी/critical रिमाइंडर
- अनुपस्थित `trustedProxies` कॉन्फ़िगरेशन
- अनुपस्थित `userHeader` कॉन्फ़िगरेशन
- खाली `allowUsers` (किसी भी प्रमाणित उपयोगकर्ता को अनुमति देता है)
- समान-होस्ट प्रॉक्सी स्रोतों के लिए सक्षम `allowLoopback`
- उजागर Control UI सतहों पर वाइल्डकार्ड या अनुपस्थित ब्राउज़र-मूल नीति

## समस्या निवारण

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    अनुरोध `gateway.trustedProxies` में मौजूद किसी IP से नहीं आया। जांचें:

    - क्या प्रॉक्सी IP सही है? (Docker कंटेनर IP बदल सकते हैं।)
    - क्या आपके प्रॉक्सी के सामने कोई लोड बैलेंसर है?
    - वास्तविक IP खोजने के लिए `docker inspect` या `kubectl get pods -o wide` का उपयोग करें।

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ने loopback-स्रोत विश्वसनीय-प्रॉक्सी अनुरोध अस्वीकार कर दिया।

    जांचें:

    - क्या प्रॉक्सी `127.0.0.1` / `::1` से कनेक्ट कर रहा है?
    - क्या आप समान-होस्ट loopback reverse proxy के साथ विश्वसनीय-प्रॉक्सी प्रमाणीकरण का उपयोग करने की कोशिश कर रहे हैं?

    सुधार:

    - उन आंतरिक समान-होस्ट क्लाइंट के लिए token/password प्रमाणीकरण को प्राथमिकता दें जो प्रॉक्सी से होकर नहीं जाते, या
    - किसी non-loopback विश्वसनीय प्रॉक्सी पते से रूट करें और उस IP को `gateway.trustedProxies` में रखें, या
    - जानबूझकर समान-होस्ट reverse proxy के लिए, `gateway.auth.trustedProxy.allowLoopback = true` सेट करें, loopback पते को `gateway.trustedProxies` में रखें, और सुनिश्चित करें कि प्रॉक्सी पहचान हेडर को हटाता या ओवरराइट करता है।

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    उपयोगकर्ता हेडर खाली या अनुपस्थित था। जांचें:

    - क्या आपका प्रॉक्सी पहचान हेडर पास करने के लिए कॉन्फ़िगर है?
    - क्या हेडर नाम सही है? (case-insensitive है, लेकिन वर्तनी मायने रखती है)
    - क्या उपयोगकर्ता वास्तव में प्रॉक्सी पर प्रमाणित है?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    आवश्यक हेडर मौजूद नहीं था। जांचें:

    - उन विशिष्ट हेडरों के लिए आपका प्रॉक्सी कॉन्फ़िगरेशन।
    - क्या श्रृंखला में कहीं हेडर हटाए जा रहे हैं।

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    उपयोगकर्ता प्रमाणित है लेकिन `allowUsers` में नहीं है। या तो उन्हें जोड़ें या allowlist हटाएं।
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    विश्वसनीय-प्रॉक्सी प्रमाणीकरण सफल हुआ, लेकिन ब्राउज़र `Origin` हेडर ने Control UI origin जांच पास नहीं की।

    जांचें:

    - `gateway.controlUi.allowedOrigins` में सटीक ब्राउज़र origin शामिल है।
    - आप वाइल्डकार्ड origins पर निर्भर नहीं हैं, जब तक कि आप जानबूझकर allow-all व्यवहार नहीं चाहते।
    - यदि आप जानबूझकर Host-हेडर फ़ॉलबैक मोड उपयोग करते हैं, तो `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` सोच-समझकर सेट है।

  </Accordion>
  <Accordion title="कनेक्शन सफल होता है लेकिन मेथड अनुपस्थित स्कोप रिपोर्ट करते हैं">
    WebSocket कनेक्ट होता है, लेकिन `chat.history`, `sessions.list`, या
    `models.list` `missing scope: operator.read` के साथ विफल होता है।

    सामान्य कारण:

    - डिवाइस-रहित Control UI सत्र: विश्वसनीय-प्रॉक्सी प्रमाणीकरण डिवाइस पहचान के बिना WebSocket कनेक्शन को स्वीकार कर सकता है, लेकिन OpenClaw डिज़ाइन के अनुसार डिवाइस-रहित सत्रों पर स्कोप साफ़ कर देता है।
    - कस्टम बैकएंड क्लाइंट: `gateway.controlUi.dangerouslyDisableDeviceAuth` Control UI तक सीमित है और मनमाने बैकएंड या CLI-जैसे WebSocket क्लाइंट को स्कोप नहीं देता।
    - अत्यधिक संकरा `x-openclaw-scopes`: यदि आपका प्रॉक्सी Control UI WebSocket अपग्रेड अनुरोध पर यह हेडर inject करता है, तो सत्र स्कोप उसी सेट तक सीमित हो जाते हैं। खाली हेडर मान से कोई स्कोप नहीं मिलता।

    सुधार:

    - Control UI के लिए, HTTPS का उपयोग करें ताकि ब्राउज़र डिवाइस पहचान बना सके और पेयरिंग पूरी कर सके।
    - कस्टम ऑटोमेशन के लिए, डिवाइस पहचान/पेयरिंग, reserved direct-local `gateway-client` बैकएंड helper path, या [admin HTTP RPC](/hi/plugins/admin-http-rpc) का उपयोग करें।
    - `gateway.controlUi.dangerouslyDisableDeviceAuth: true` का उपयोग केवल अस्थायी Control UI आपातकालीन पथ के रूप में करें।

  </Accordion>
  <Accordion title="WebSocket अब भी विफल हो रहा है">
    सुनिश्चित करें कि आपका प्रॉक्सी:

    - WebSocket अपग्रेड का समर्थन करता है (`Upgrade: websocket`, `Connection: upgrade`)।
    - WebSocket अपग्रेड अनुरोधों पर पहचान हेडर पास करता है (केवल HTTP पर नहीं)।
    - WebSocket कनेक्शनों के लिए अलग auth path नहीं रखता।

  </Accordion>
</AccordionGroup>

## टोकन प्रमाणीकरण से माइग्रेशन

यदि आप टोकन प्रमाणीकरण से विश्वसनीय-प्रॉक्सी पर जा रहे हैं:

<Steps>
  <Step title="प्रॉक्सी कॉन्फ़िगर करें">
    उपयोगकर्ताओं को प्रमाणित करने और हेडर पास करने के लिए अपना प्रॉक्सी कॉन्फ़िगर करें।
  </Step>
  <Step title="प्रॉक्सी को स्वतंत्र रूप से टेस्ट करें">
    प्रॉक्सी सेटअप को स्वतंत्र रूप से टेस्ट करें (headers के साथ curl)।
  </Step>
  <Step title="OpenClaw कॉन्फ़िग अपडेट करें">
    OpenClaw कॉन्फ़िग को विश्वसनीय-प्रॉक्सी प्रमाणीकरण के साथ अपडेट करें।
  </Step>
  <Step title="Gateway पुनः शुरू करें">
    Gateway पुनः शुरू करें।
  </Step>
  <Step title="WebSocket टेस्ट करें">
    Control UI से WebSocket कनेक्शन टेस्ट करें।
  </Step>
  <Step title="ऑडिट">
    `openclaw security audit` चलाएं और findings की समीक्षा करें।
  </Step>
</Steps>

## संबंधित

- [कॉन्फ़िगरेशन](/hi/gateway/configuration) — कॉन्फ़िग संदर्भ
- [रिमोट एक्सेस](/hi/gateway/remote) — अन्य रिमोट एक्सेस पैटर्न
- [सुरक्षा](/hi/gateway/security) — पूर्ण सुरक्षा गाइड
- [Tailscale](/hi/gateway/tailscale) — केवल-tailnet एक्सेस के लिए सरल विकल्प
