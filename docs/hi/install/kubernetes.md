---
read_when:
    - आप OpenClaw को Kubernetes क्लस्टर पर चलाना चाहते हैं
    - आप Kubernetes परिवेश में OpenClaw का परीक्षण करना चाहते हैं
summary: Kustomize के साथ Kubernetes क्लस्टर में OpenClaw Gateway डिप्लॉय करें
title: कुबेरनेट्स
x-i18n:
    generated_at: "2026-07-16T15:28:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Kubernetes पर OpenClaw चलाने के लिए एक न्यूनतम शुरुआती बिंदु, न कि उत्पादन के लिए तैयार परिनियोजन। इसमें मुख्य संसाधन शामिल हैं और इसे आपके परिवेश के अनुसार अनुकूलित किया जाना है।

## Helm क्यों नहीं

OpenClaw कुछ कॉन्फ़िगरेशन फ़ाइलों वाला एकल कंटेनर है। महत्वपूर्ण अनुकूलन एजेंट सामग्री (Markdown फ़ाइलें, स्किल्स, कॉन्फ़िगरेशन ओवरराइड) में होता है, न कि इन्फ़्रास्ट्रक्चर टेम्पलेटिंग में। Kustomize, Helm चार्ट के अतिरिक्त भार के बिना ओवरले संभालता है। यदि आपका परिनियोजन अधिक जटिल हो जाए, तो इन मैनिफ़ेस्ट के ऊपर Helm चार्ट की परत जोड़ें।

## आपको क्या चाहिए

- चलता हुआ Kubernetes क्लस्टर (AKS, EKS, GKE, k3s, kind, OpenShift आदि)
- `kubectl` आपके क्लस्टर से जुड़ा हुआ
- कम-से-कम एक मॉडल प्रदाता के लिए API कुंजी

## त्वरित शुरुआत

```bash
# अपने प्रदाता से बदलें: ANTHROPIC, GEMINI, OPENAI, या OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` डिफ़ॉल्ट रूप से टोकन प्रमाणीकरण बनाता है। Control UI के लिए जनरेट किया गया gateway टोकन प्राप्त करें:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

स्थानीय डीबगिंग के लिए, `./scripts/k8s/deploy.sh --show-token` परिनियोजन के बाद टोकन प्रिंट करता है।

## Kind के साथ स्थानीय परीक्षण

यदि आपके पास क्लस्टर नहीं है, तो [Kind](https://kind.sigs.k8s.io/) के साथ स्थानीय रूप से एक क्लस्टर बनाएँ:

```bash
./scripts/k8s/create-kind.sh           # docker या podman का स्वतः पता लगाता है
./scripts/k8s/create-kind.sh --delete  # हटाता है
```

फिर `./scripts/k8s/deploy.sh` के साथ सामान्य रूप से परिनियोजित करें।

## चरण-दर-चरण

### 1) परिनियोजित करें

**विकल्प A: परिवेश में API कुंजी (एक चरण)**

```bash
# अपने प्रदाता से बदलें: ANTHROPIC, GEMINI, OPENAI, या OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

स्क्रिप्ट API कुंजी और स्वतः जनरेट किए गए gateway टोकन के साथ एक Kubernetes Secret बनाती है, फिर परिनियोजन करती है। यदि Secret पहले से मौजूद है, तो यह मौजूदा gateway टोकन और उन सभी प्रदाता कुंजियों को सुरक्षित रखती है जिन्हें बदला नहीं जा रहा है।

**विकल्प B: सीक्रेट अलग से बनाएँ**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

स्थानीय परीक्षण के लिए टोकन को stdout पर प्रिंट करने हेतु किसी भी कमांड में `--show-token` जोड़ें।

### 2) gateway तक पहुँचें

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## क्या परिनियोजित होता है

```text
Namespace: openclaw (OPENCLAW_NAMESPACE के माध्यम से कॉन्फ़िगर करने योग्य)
├── Deployment/openclaw        # एकल पॉड, init कंटेनर + gateway
├── Service/openclaw           # पोर्ट 18789 पर ClusterIP
├── PersistentVolumeClaim      # एजेंट स्थिति और कॉन्फ़िगरेशन के लिए 10Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway टोकन + API कुंजियाँ
```

## अनुकूलन

### एजेंट निर्देश

`scripts/k8s/manifests/configmap.yaml` में `AGENTS.md` संपादित करें और दोबारा परिनियोजित करें:

```bash
./scripts/k8s/deploy.sh
```

### Gateway कॉन्फ़िगरेशन

`scripts/k8s/manifests/configmap.yaml` में `openclaw.json` संपादित करें। पूर्ण संदर्भ के लिए [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

### प्रदाता जोड़ें

अतिरिक्त कुंजियाँ एक्सपोर्ट करके दोबारा चलाएँ:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

मौजूदा प्रदाता कुंजियाँ Secret में बनी रहती हैं, जब तक कि आप उन्हें अधिलेखित न करें।

या सीधे Secret को पैच करें:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### कस्टम नेमस्पेस

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### कस्टम इमेज

`scripts/k8s/manifests/deployment.yaml` में `image` फ़ील्ड संपादित करें:

```yaml
image: ghcr.io/openclaw/openclaw:slim # प्राथमिक; आधिकारिक Docker Hub मिरर: openclaw/openclaw
```

### पोर्ट-फ़ॉरवर्ड से आगे एक्सपोज़ करें

डिफ़ॉल्ट मैनिफ़ेस्ट पॉड के भीतर gateway को लूपबैक से बाइंड करते हैं। यह `kubectl port-forward` के साथ काम करता है, लेकिन ऐसे Kubernetes `Service` या Ingress पथ के साथ नहीं, जिसे सीधे पॉड IP तक पहुँचना हो।

Ingress या लोड बैलेंसर के माध्यम से gateway को एक्सपोज़ करने के लिए:

- `scripts/k8s/manifests/configmap.yaml` में gateway बाइंड को `loopback` से ऐसे गैर-लूपबैक बाइंड में बदलें जो आपके परिनियोजन मॉडल से मेल खाता हो।
- Gateway प्रमाणीकरण सक्षम रखें और उचित TLS-टर्मिनेटेड प्रवेश-बिंदु का उपयोग करें।
- समर्थित वेब सुरक्षा मॉडल का उपयोग करके दूरस्थ पहुँच के लिए Control UI कॉन्फ़िगर करें (उदाहरण के लिए HTTPS/Tailscale Serve और आवश्यकता होने पर स्पष्ट रूप से अनुमत ऑरिजिन)।

## दोबारा परिनियोजित करें

```bash
./scripts/k8s/deploy.sh
```

यह सभी मैनिफ़ेस्ट लागू करता है और किसी भी कॉन्फ़िगरेशन या सीक्रेट परिवर्तन को अपनाने के लिए पॉड को पुनः आरंभ करता है।

## हटाना

```bash
./scripts/k8s/deploy.sh --delete
```

यह नेमस्पेस और उसमें मौजूद सभी संसाधनों को हटा देता है, जिसमें PVC भी शामिल है।

## आर्किटेक्चर संबंधी टिप्पणियाँ

- Gateway डिफ़ॉल्ट रूप से पॉड के भीतर लूपबैक से बाइंड होता है, इसलिए शामिल सेटअप `kubectl port-forward` के लिए है।
- कोई क्लस्टर-स्कोप संसाधन नहीं है; सब कुछ एक ही नेमस्पेस में रहता है।
- सुरक्षा सुदृढ़ीकरण: `readOnlyRootFilesystem`, `drop: ALL` क्षमताएँ, गैर-रूट उपयोगकर्ता (UID 1000)।
- डिफ़ॉल्ट कॉन्फ़िगरेशन Control UI को अधिक सुरक्षित स्थानीय-पहुँच पथ पर रखता है: लूपबैक बाइंड और `kubectl port-forward` को `http://127.0.0.1:18789` पर सेट करना।
- यदि आप localhost पहुँच से आगे बढ़ते हैं, तो समर्थित दूरस्थ मॉडल का उपयोग करें: HTTPS/Tailscale के साथ उपयुक्त gateway बाइंड और Control UI ऑरिजिन सेटिंग्स।
- सीक्रेट अस्थायी डायरेक्टरी में जनरेट किए जाते हैं और सीधे क्लस्टर पर लागू होते हैं; कोई भी सीक्रेट सामग्री रेपो चेकआउट में नहीं लिखी जाती।

## फ़ाइल संरचना

```text
scripts/k8s/
├── deploy.sh                   # नेमस्पेस + सीक्रेट बनाता है, kustomize के माध्यम से परिनियोजित करता है
├── create-kind.sh              # स्थानीय Kind क्लस्टर (docker/podman का स्वतः पता लगाता है)
└── manifests/
    ├── kustomization.yaml      # Kustomize आधार
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # सुरक्षा सुदृढ़ीकरण के साथ पॉड विनिर्देश
    ├── pvc.yaml                # 10Gi स्थायी संग्रहण
    └── service.yaml            # 18789 पर ClusterIP
```

## संबंधित

- [Docker](/hi/install/docker)
- [Docker VM रनटाइम](/hi/install/docker-vm-runtime)
- [इंस्टॉलेशन का अवलोकन](/hi/install)
