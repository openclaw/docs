---
read_when:
    - OpenClaw’ı bir Kubernetes kümesinde çalıştırmak istiyorsunuz
    - OpenClaw’ı bir Kubernetes ortamında test etmek istiyorsunuz
summary: OpenClaw Gateway’i Kustomize ile bir Kubernetes kümesine dağıtın
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T09:16:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# Kubernetes üzerinde OpenClaw

Kubernetes üzerinde OpenClaw çalıştırmak için asgari bir başlangıç noktası — üretime hazır bir dağıtım değildir. Temel kaynakları kapsar ve ortamınıza uyarlanması amaçlanır.

## Neden Helm değil?

OpenClaw birkaç yapılandırma dosyası olan tek bir kapsayıcıdır. İlginç özelleştirme altyapı şablonlamasında değil, aracı içeriğinde (Markdown dosyaları, Skills, yapılandırma geçersiz kılmaları) yer alır. Kustomize, Helm chart ek yükü olmadan overlay'leri yönetir. Dağıtımınız daha karmaşık hâle gelirse bu manifestlerin üzerine bir Helm chart katmanı eklenebilir.

## Gerekenler

- Çalışan bir Kubernetes kümesi (AKS, EKS, GKE, k3s, kind, OpenShift vb.)
- Kümenize bağlı `kubectl`
- En az bir model sağlayıcısı için API anahtarı

## Hızlı başlangıç

```bash
# Sağlayıcınızla değiştirin: ANTHROPIC, GEMINI, OPENAI veya OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Control UI için yapılandırılmış paylaşılan gizli bilgiyi alın. Bu dağıtım betiği
varsayılan olarak token kimlik doğrulaması oluşturur:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Yerel hata ayıklama için `./scripts/k8s/deploy.sh --show-token`, dağıtımdan sonra token’ı yazdırır.

## Kind ile yerel test

Bir kümeniz yoksa [Kind](https://kind.sigs.k8s.io/) ile yerel olarak bir tane oluşturun:

```bash
./scripts/k8s/create-kind.sh           # docker veya podman'ı otomatik algılar
./scripts/k8s/create-kind.sh --delete  # kaldır
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

Betik API anahtarı ve otomatik üretilmiş bir Gateway token’ı içeren bir Kubernetes Secret oluşturur, ardından dağıtır. Secret zaten varsa mevcut Gateway token’ını ve değiştirilmemekte olan sağlayıcı anahtarlarını korur.

**Seçenek B** — secret’ı ayrı oluşturun:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Yerel test için token’ın stdout’a yazdırılmasını istiyorsanız her iki komutla da `--show-token` kullanın.

### 2) Gateway’e erişin

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Neler dağıtılır

```
Namespace: openclaw (OPENCLAW_NAMESPACE ile yapılandırılabilir)
├── Deployment/openclaw        # Tek pod, init kapsayıcı + gateway
├── Service/openclaw           # 18789 portunda ClusterIP
├── PersistentVolumeClaim      # Aracı durumu ve yapılandırması için 10Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API anahtarları
```

## Özelleştirme

### Aracı yönergeleri

`scripts/k8s/manifests/configmap.yaml` içindeki `AGENTS.md` dosyasını düzenleyin ve yeniden dağıtın:

```bash
./scripts/k8s/deploy.sh
```

### Gateway yapılandırması

`scripts/k8s/manifests/configmap.yaml` içindeki `openclaw.json` dosyasını düzenleyin. Tam başvuru için [Gateway yapılandırması](/tr/gateway/configuration) sayfasına bakın.

### Sağlayıcı ekleyin

Ek anahtarları dışa aktarıp yeniden çalıştırın:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Üzerine yazmadığınız sürece mevcut sağlayıcı anahtarları Secret içinde kalır.

Veya Secret’ı doğrudan yamalayın:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Özel namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Özel kalıp

`scripts/k8s/manifests/deployment.yaml` içindeki `image` alanını düzenleyin:

```yaml
image: ghcr.io/openclaw/openclaw:latest # veya https://github.com/openclaw/openclaw/releases adresinden belirli bir sürüme sabitleyin
```

### Port-forward ötesine açma

Varsayılan manifestler Gateway’i pod içinde loopback’e bağlar. Bu, `kubectl port-forward` ile çalışır ancak pod IP’sine ulaşması gereken bir Kubernetes `Service` veya Ingress yolu ile çalışmaz.

Gateway’i bir Ingress veya yük dengeleyici üzerinden açmak istiyorsanız:

- `scripts/k8s/manifests/configmap.yaml` içindeki Gateway bağlamasını `loopback`’ten dağıtım modelinize uyan loopback dışı bir bağlamaya değiştirin
- Gateway kimlik doğrulamasını etkin tutun ve uygun TLS sonlandırmalı bir giriş noktası kullanın
- Gerekli olduğunda desteklenen web güvenlik modelini kullanarak Control UI’yi uzak erişim için yapılandırın (örneğin HTTPS/Tailscale Serve ve açık izin verilen origin'ler)

## Yeniden dağıtım

```bash
./scripts/k8s/deploy.sh
```

Bu, tüm manifestleri uygular ve herhangi bir yapılandırma veya secret değişikliğini almak için pod’u yeniden başlatır.

## Kaldırma

```bash
./scripts/k8s/deploy.sh --delete
```

Bu, PVC dahil olmak üzere namespace’i ve içindeki tüm kaynakları siler.

## Mimari notları

- Gateway varsayılan olarak pod içinde loopback’e bağlanır, bu nedenle dahil edilen kurulum `kubectl port-forward` içindir
- Küme kapsamlı kaynak yoktur — her şey tek bir namespace içinde yaşar
- Güvenlik: `readOnlyRootFilesystem`, `drop: ALL` yetenekleri, root olmayan kullanıcı (UID 1000)
- Varsayılan yapılandırma Control UI’yi daha güvenli yerel erişim yolunda tutar: loopback bağlama artı `http://127.0.0.1:18789` için `kubectl port-forward`
- localhost erişiminin ötesine geçerseniz desteklenen uzak modeli kullanın: HTTPS/Tailscale artı uygun Gateway bağlama ve Control UI origin ayarları
- Secret’lar geçici bir dizinde üretilir ve doğrudan kümeye uygulanır — hiçbir gizli bilgi depo çalışma kopyasına yazılmaz

## Dosya yapısı

```
scripts/k8s/
├── deploy.sh                   # Namespace + secret oluşturur, kustomize ile dağıtır
├── create-kind.sh              # Yerel Kind kümesi (docker/podman'ı otomatik algılar)
└── manifests/
    ├── kustomization.yaml      # Kustomize tabanı
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Güvenlik sağlamlaştırmalı pod tanımı
    ├── pvc.yaml                # 10Gi kalıcı depolama
    └── service.yaml            # 18789 üzerinde ClusterIP
```

## İlgili

- [Docker](/tr/install/docker)
- [Docker VM çalışma zamanı](/tr/install/docker-vm-runtime)
- [Kuruluma genel bakış](/tr/install)
