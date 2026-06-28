---
read_when:
    - OpenClaw'u bir Kubernetes kümesinde çalıştırmak istiyorsunuz
    - OpenClaw'u bir Kubernetes ortamında test etmek istiyorsunuz
summary: OpenClaw Gateway'i Kustomize ile bir Kubernetes kümesine dağıt
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

OpenClaw'ı Kubernetes üzerinde çalıştırmak için minimal bir başlangıç noktası; üretime hazır bir dağıtım değildir. Temel kaynakları kapsar ve ortamınıza uyarlanmak üzere tasarlanmıştır.

## Neden Helm değil?

OpenClaw, bazı yapılandırma dosyalarına sahip tek bir container'dır. Asıl özelleştirme altyapı şablonlamasında değil, agent içeriğindedir (markdown dosyaları, Skills, yapılandırma geçersiz kılmaları). Kustomize, Helm chart ek yükü olmadan overlay'leri yönetir. Dağıtımınız daha karmaşık hale gelirse, bu manifestlerin üzerine bir Helm chart katman olarak eklenebilir.

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

Control UI için yapılandırılmış paylaşılan secret'ı alın. Bu dağıtım betiği
varsayılan olarak token kimlik doğrulaması oluşturur:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Yerel hata ayıklama için `./scripts/k8s/deploy.sh --show-token`, dağıtımdan sonra token'ı yazdırır.

## Kind ile yerel test

Bir kümeniz yoksa, [Kind](https://kind.sigs.k8s.io/) ile yerel olarak bir tane oluşturun:

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Ardından her zamanki gibi `./scripts/k8s/deploy.sh` ile dağıtın.

## Adım adım

### 1) Dağıt

**Seçenek A** — Ortamda API anahtarı (tek adım):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Betik, API anahtarı ve otomatik oluşturulmuş bir Gateway token'ı içeren bir Kubernetes Secret oluşturur, ardından dağıtımı yapar. Secret zaten varsa, mevcut Gateway token'ını ve değiştirilmeyen sağlayıcı anahtarlarını korur.

**Seçenek B** — Secret'ı ayrı oluştur:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Yerel test için token'ın stdout'a yazdırılmasını istiyorsanız iki komuttan biriyle `--show-token` kullanın.

### 2) Gateway'e eriş

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Neler dağıtılır?

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Özelleştirme

### Agent talimatları

`scripts/k8s/manifests/configmap.yaml` içindeki `AGENTS.md` dosyasını düzenleyin ve yeniden dağıtın:

```bash
./scripts/k8s/deploy.sh
```

### Gateway yapılandırması

`scripts/k8s/manifests/configmap.yaml` içindeki `openclaw.json` dosyasını düzenleyin. Tam başvuru için [Gateway yapılandırması](/tr/gateway/configuration) bölümüne bakın.

### Sağlayıcı ekleme

Ek anahtarlar dışa aktarılmış şekilde yeniden çalıştırın:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Mevcut sağlayıcı anahtarları, siz üzerine yazmadıkça Secret içinde kalır.

Veya Secret'ı doğrudan patch edin:

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
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Port-forward ötesine açma

Varsayılan manifestler, Gateway'i pod içinde loopback'e bağlar. Bu, `kubectl port-forward` ile çalışır, ancak pod IP'sine ulaşması gereken bir Kubernetes `Service` veya Ingress yolu ile çalışmaz.

Gateway'i bir Ingress veya yük dengeleyici üzerinden açmak istiyorsanız:

- `scripts/k8s/manifests/configmap.yaml` içindeki Gateway bind değerini `loopback` yerine dağıtım modelinizle eşleşen loopback olmayan bir bind olarak değiştirin
- Gateway kimlik doğrulamasını etkin tutun ve doğru TLS sonlandırmalı bir giriş noktası kullanın
- Desteklenen web güvenliği modelini kullanarak Control UI'ı uzak erişim için yapılandırın (örneğin gerektiğinde HTTPS/Tailscale Serve ve açıkça izin verilen origin'ler)

## Yeniden dağıtma

```bash
./scripts/k8s/deploy.sh
```

Bu, tüm manifestleri uygular ve yapılandırma veya secret değişikliklerini almak için pod'u yeniden başlatır.

## Kaldırma

```bash
./scripts/k8s/deploy.sh --delete
```

Bu, namespace'i ve içindeki PVC dahil tüm kaynakları siler.

## Mimari notları

- Gateway varsayılan olarak pod içinde loopback'e bağlanır, bu nedenle dahil edilen kurulum `kubectl port-forward` içindir
- Küme kapsamlı kaynak yoktur; her şey tek bir namespace içinde bulunur
- Güvenlik: `readOnlyRootFilesystem`, `drop: ALL` yetenekleri, root olmayan kullanıcı (UID 1000)
- Varsayılan yapılandırma, Control UI'ı daha güvenli yerel erişim yolunda tutar: loopback bind artı `http://127.0.0.1:18789` adresine `kubectl port-forward`
- localhost erişiminin ötesine geçerseniz, desteklenen uzak modeli kullanın: HTTPS/Tailscale artı uygun Gateway bind ve Control UI origin ayarları
- Secret'lar geçici bir dizinde oluşturulur ve doğrudan kümeye uygulanır; repo checkout'a hiçbir secret materyali yazılmaz

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
