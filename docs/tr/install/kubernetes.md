---
read_when:
    - OpenClaw'ı bir Kubernetes kümesinde çalıştırmak istiyorsunuz
    - OpenClaw'ı bir Kubernetes ortamında test etmek istiyorsunuz
summary: OpenClaw Gateway'i Kustomize ile bir Kubernetes kümesine dağıtın
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T09:19:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw'ı Kubernetes üzerinde çalıştırmak için asgari bir başlangıç noktası — üretime hazır bir dağıtım değildir. Temel kaynakları kapsar ve ortamınıza uyarlanması amaçlanır.

## Neden Helm değil?

OpenClaw, bazı yapılandırma dosyalarına sahip tek bir kapsayıcıdır. Asıl ilginç özelleştirme, altyapı şablonlamasında değil aracı içeriğindedir (markdown dosyaları, skills, yapılandırma geçersiz kılmaları). Kustomize, Helm chart ek yükü olmadan overlay'leri yönetir. Dağıtımınız daha karmaşık hale gelirse, bu manifestlerin üzerine bir Helm chart katmanı eklenebilir.

## Gerekenler

- Çalışan bir Kubernetes kümesi (AKS, EKS, GKE, k3s, kind, OpenShift vb.)
- Kümenize bağlı `kubectl`
- En az bir model sağlayıcısı için API anahtarı

## Hızlı başlangıç

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Denetim Kullanıcı Arayüzü için yapılandırılmış paylaşılan sırrı alın. Bu dağıtım betiği
varsayılan olarak token kimlik doğrulaması oluşturur:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Yerel hata ayıklama için `./scripts/k8s/deploy.sh --show-token`, dağıtımdan sonra token'ı yazdırır.

## Kind ile yerel test

Bir kümeniz yoksa, [Kind](https://kind.sigs.k8s.io/) ile yerelde bir küme oluşturun:

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Ardından her zamanki gibi `./scripts/k8s/deploy.sh` ile dağıtın.

## Adım adım

### 1) Dağıt

**Seçenek A** — ortamda API anahtarı (tek adım):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Betik, API anahtarı ve otomatik oluşturulmuş bir gateway token'ı içeren bir Kubernetes Secret oluşturur, ardından dağıtır. Secret zaten varsa mevcut gateway token'ını ve değiştirilmeyen sağlayıcı anahtarlarını korur.

**Seçenek B** — secret'ı ayrı oluşturun:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Yerel test için token'ın stdout'a yazdırılmasını istiyorsanız iki komutla da `--show-token` kullanın.

### 2) Gateway'e eriş

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Dağıtılanlar

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Özelleştirme

### Aracı talimatları

`scripts/k8s/manifests/configmap.yaml` içindeki `AGENTS.md` dosyasını düzenleyin ve yeniden dağıtın:

```bash
./scripts/k8s/deploy.sh
```

### Gateway yapılandırması

`scripts/k8s/manifests/configmap.yaml` içindeki `openclaw.json` dosyasını düzenleyin. Tam başvuru için [Gateway yapılandırması](/tr/gateway/configuration) bölümüne bakın.

### Sağlayıcı ekleme

Ek anahtarları dışa aktararak yeniden çalıştırın:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Mevcut sağlayıcı anahtarları, üzerine yazmadığınız sürece Secret içinde kalır.

Veya Secret'ı doğrudan patch'leyin:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Özel namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Özel image

`scripts/k8s/manifests/deployment.yaml` içindeki `image` alanını düzenleyin:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Port-forward ötesine açma

Varsayılan manifestler, gateway'i pod içindeki loopback'e bağlar. Bu, `kubectl port-forward` ile çalışır, ancak pod IP'sine ulaşması gereken bir Kubernetes `Service` veya Ingress yolu ile çalışmaz.

Gateway'i bir Ingress veya load balancer üzerinden açmak istiyorsanız:

- `scripts/k8s/manifests/configmap.yaml` içindeki gateway bağlamasını `loopback` değerinden dağıtım modelinize uyan loopback olmayan bir bağlamaya değiştirin
- Gateway kimlik doğrulamasını etkin tutun ve uygun TLS sonlandırmalı bir giriş noktası kullanın
- Desteklenen web güvenlik modelini kullanarak Denetim Kullanıcı Arayüzü'nü uzak erişim için yapılandırın (örneğin gerektiğinde HTTPS/Tailscale Serve ve açıkça izin verilen origin'ler)

## Yeniden dağıtma

```bash
./scripts/k8s/deploy.sh
```

Bu, tüm manifestleri uygular ve yapılandırma veya secret değişikliklerini almak için pod'u yeniden başlatır.

## Kaldırma

```bash
./scripts/k8s/deploy.sh --delete
```

Bu, namespace'i ve PVC dahil içindeki tüm kaynakları siler.

## Mimari notları

- Gateway, varsayılan olarak pod içinde loopback'e bağlanır; bu nedenle dahil edilen kurulum `kubectl port-forward` içindir
- Küme kapsamlı kaynak yoktur — her şey tek bir namespace içinde yaşar
- Güvenlik: `readOnlyRootFilesystem`, `drop: ALL` yetenekleri, root olmayan kullanıcı (UID 1000)
- Varsayılan yapılandırma, Denetim Kullanıcı Arayüzü'nü daha güvenli yerel erişim yolunda tutar: loopback bağlama artı `http://127.0.0.1:18789` adresine `kubectl port-forward`
- localhost erişiminin ötesine geçerseniz, desteklenen uzak modeli kullanın: HTTPS/Tailscale artı uygun gateway bağlaması ve Denetim Kullanıcı Arayüzü origin ayarları
- Secret'lar geçici bir dizinde oluşturulur ve doğrudan kümeye uygulanır — repo checkout'ına hiçbir secret materyali yazılmaz

## Dosya yapısı

```
scripts/k8s/
├── deploy.sh                   # Creates namespace + secret, deploys via kustomize
├── create-kind.sh              # Local Kind cluster (auto-detects docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec with security hardening
    ├── pvc.yaml                # 10Gi persistent storage
    └── service.yaml            # ClusterIP on 18789
```

## İlgili

- [Docker](/tr/install/docker)
- [Docker VM runtime](/tr/install/docker-vm-runtime)
- [Kurulum genel bakışı](/tr/install)
