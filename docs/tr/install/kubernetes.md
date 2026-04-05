---
read_when:
    - OpenClaw'ı bir Kubernetes kümesinde çalıştırmak istiyorsunuz
    - OpenClaw'ı bir Kubernetes ortamında test etmek istiyorsunuz
summary: OpenClaw Gateway'i Kustomize ile bir Kubernetes kümesine dağıtın
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T13:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw on Kubernetes

OpenClaw'ı Kubernetes üzerinde çalıştırmak için minimal bir başlangıç noktası — üretime hazır bir dağıtım değildir. Temel kaynakları kapsar ve ortamınıza uyarlanması amaçlanmıştır.

## Neden Helm değil?

OpenClaw, birkaç yapılandırma dosyasına sahip tek bir kapsayıcıdır. Asıl ilginç özelleştirme altyapı şablonlamasında değil, ajan içeriğinde (markdown dosyaları, Skills, yapılandırma geçersiz kılmaları) yer alır. Kustomize, Helm chart'ın ek yükü olmadan overlay'leri yönetir. Dağıtımınız daha karmaşık hale gelirse, bu manifestlerin üstüne bir Helm chart katmanı eklenebilir.

## Gerekenler

- Çalışan bir Kubernetes kümesi (AKS, EKS, GKE, k3s, kind, OpenShift vb.)
- Kümenize bağlı `kubectl`
- En az bir model sağlayıcısı için bir API anahtarı

## Hızlı başlangıç

```bash
# Sağlayıcınızla değiştirin: ANTHROPIC, GEMINI, OPENAI veya OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Kontrol UI için yapılandırılmış paylaşılan gizli anahtarı alın. Bu dağıtım betiği
varsayılan olarak token kimlik doğrulaması oluşturur:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Yerel hata ayıklama için `./scripts/k8s/deploy.sh --show-token`, dağıtımdan sonra token'ı yazdırır.

## Kind ile yerel test

Bir kümeniz yoksa, [Kind](https://kind.sigs.k8s.io/) ile yerelde bir tane oluşturun:

```bash
./scripts/k8s/create-kind.sh           # docker veya podman'ı otomatik algılar
./scripts/k8s/create-kind.sh --delete  # kapatır
```

Ardından her zamanki gibi `./scripts/k8s/deploy.sh` ile dağıtın.

## Adım adım

### 1) Dağıtın

**Seçenek A** — ortamda API anahtarı (tek adım):

```bash
# Sağlayıcınızla değiştirin: ANTHROPIC, GEMINI, OPENAI veya OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Betik, API anahtarı ve otomatik oluşturulmuş gateway token'ı ile bir Kubernetes Secret oluşturur, ardından dağıtır. Secret zaten varsa, mevcut gateway token'ını ve değiştirilmeyen sağlayıcı anahtarlarını korur.

**Seçenek B** — secret'ı ayrı oluşturun:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Yerel test için token'ın stdout'a yazdırılmasını istiyorsanız her iki komutta da `--show-token` kullanın.

### 2) Gateway'e erişin

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Neler dağıtılır

```
Namespace: openclaw (OPENCLAW_NAMESPACE ile yapılandırılabilir)
├── Deployment/openclaw        # Tek pod, init container + gateway
├── Service/openclaw           # 18789 portunda ClusterIP
├── PersistentVolumeClaim      # Ajan durumu ve yapılandırması için 10Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token'ı + API anahtarları
```

## Özelleştirme

### Ajan talimatları

`scripts/k8s/manifests/configmap.yaml` içindeki `AGENTS.md` dosyasını düzenleyin ve yeniden dağıtın:

```bash
./scripts/k8s/deploy.sh
```

### Gateway yapılandırması

`scripts/k8s/manifests/configmap.yaml` içindeki `openclaw.json` dosyasını düzenleyin. Tam başvuru için [Gateway configuration](/gateway/configuration) bölümüne bakın.

### Sağlayıcı ekleme

Ek anahtarları dışa aktararak yeniden çalıştırın:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Üzerine yazmadığınız sürece mevcut sağlayıcı anahtarları Secret içinde kalır.

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

### Özel imaj

`scripts/k8s/manifests/deployment.yaml` içindeki `image` alanını düzenleyin:

```yaml
image: ghcr.io/openclaw/openclaw:latest # veya https://github.com/openclaw/openclaw/releases adresindeki belirli bir sürüme sabitleyin
```

### Port-forward ötesine açığa çıkarma

Varsayılan manifestler gateway'i pod içinde loopback üzerine bağlar. Bu, `kubectl port-forward` ile çalışır, ancak pod IP'sine ulaşması gereken bir Kubernetes `Service` veya Ingress yolu ile çalışmaz.

Gateway'i bir Ingress veya yük dengeleyici üzerinden açığa çıkarmak istiyorsanız:

- `scripts/k8s/manifests/configmap.yaml` içindeki gateway bind ayarını `loopback` değerinden dağıtım modelinize uygun loopback olmayan bir bağa değiştirin
- Gateway kimlik doğrulamasını etkin tutun ve uygun TLS sonlandırmalı bir giriş noktası kullanın
- Desteklenen web güvenlik modelini kullanarak uzak erişim için Kontrol UI'ı yapılandırın (örneğin gerektiğinde HTTPS/Tailscale Serve ve açık allowed origins)

## Yeniden dağıtım

```bash
./scripts/k8s/deploy.sh
```

Bu, tüm manifestleri uygular ve yapılandırma veya secret değişikliklerini almak için pod'u yeniden başlatır.

## Kaldırma

```bash
./scripts/k8s/deploy.sh --delete
```

Bu, PVC dahil namespace'i ve içindeki tüm kaynakları siler.

## Mimari notlar

- Gateway varsayılan olarak pod içinde loopback üzerine bağlanır, bu nedenle dahil edilen kurulum `kubectl port-forward` içindir
- Küme kapsamlı kaynak yoktur — her şey tek bir namespace içinde yaşar
- Güvenlik: `readOnlyRootFilesystem`, `drop: ALL` yetenekleri, root olmayan kullanıcı (UID 1000)
- Varsayılan yapılandırma Kontrol UI'ı daha güvenli yerel erişim yolunda tutar: loopback bind + `http://127.0.0.1:18789` için `kubectl port-forward`
- localhost erişiminin ötesine geçerseniz, desteklenen uzak modeli kullanın: HTTPS/Tailscale ve uygun gateway bind + Kontrol UI origin ayarları
- Secrets geçici bir dizinde oluşturulur ve doğrudan kümeye uygulanır — hiçbir secret materyali depo çalışma kopyasına yazılmaz

## Dosya yapısı

```
scripts/k8s/
├── deploy.sh                   # Namespace + secret oluşturur, kustomize ile dağıtır
├── create-kind.sh              # Yerel Kind kümesi (docker/podman'ı otomatik algılar)
└── manifests/
    ├── kustomization.yaml      # Kustomize tabanı
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Güvenlik güçlendirmeli pod belirtimi
    ├── pvc.yaml                # 10Gi kalıcı depolama
    └── service.yaml            # 18789 üzerinde ClusterIP
```
