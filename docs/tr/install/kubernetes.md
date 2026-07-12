---
read_when:
    - OpenClaw'u bir Kubernetes kümesinde çalıştırmak istiyorsunuz
    - OpenClaw'u bir Kubernetes ortamında test etmek istiyorsunuz
summary: OpenClaw Gateway'i Kustomize ile bir Kubernetes kümesine dağıtın
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T12:22:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Kubernetes üzerinde OpenClaw çalıştırmak için asgari bir başlangıç noktasıdır; üretime hazır bir dağıtım değildir. Temel kaynakları kapsar ve ortamınıza uyarlanması amaçlanır.

## Neden Helm değil?

OpenClaw, bazı yapılandırma dosyaları içeren tek bir konteynerdir. Önemli özelleştirmeler altyapı şablonlamasında değil, ajan içeriğindedir (Markdown dosyaları, beceriler, yapılandırma geçersiz kılmaları). Kustomize, bir Helm chart'ının ek yükü olmadan katmanları yönetir. Dağıtımınız daha karmaşık hâle gelirse bu manifestlerin üzerine bir Helm chart'ı ekleyin.

## Gereksinimler

- Çalışan bir Kubernetes kümesi (AKS, EKS, GKE, k3s, kind, OpenShift vb.)
- Kümenize bağlı `kubectl`
- En az bir model sağlayıcısına ait API anahtarı

## Hızlı başlangıç

```bash
# Sağlayıcınızla değiştirin: ANTHROPIC, GEMINI, OPENAI veya OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh`, varsayılan olarak belirteç tabanlı kimlik doğrulaması oluşturur. Denetim Arayüzü için oluşturulan gateway belirtecini alın:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Yerel hata ayıklama için `./scripts/k8s/deploy.sh --show-token`, dağıtımdan sonra belirteci yazdırır.

## Kind ile yerel test

Bir kümeniz yoksa [Kind](https://kind.sigs.k8s.io/) ile yerel olarak oluşturun:

```bash
./scripts/k8s/create-kind.sh           # docker veya podman'ı otomatik algılar
./scripts/k8s/create-kind.sh --delete  # kaldırır
```

Ardından her zamanki gibi `./scripts/k8s/deploy.sh` ile dağıtın.

## Adım adım

### 1) Dağıtın

**Seçenek A: Ortam değişkeninde API anahtarı (tek adım)**

```bash
# Sağlayıcınızla değiştirin: ANTHROPIC, GEMINI, OPENAI veya OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Betik, API anahtarını ve otomatik oluşturulan gateway belirtecini içeren bir Kubernetes Secret oluşturur, ardından dağıtımı gerçekleştirir. Secret zaten mevcutsa geçerli gateway belirtecini ve değiştirilmeyen sağlayıcı anahtarlarını korur.

**Seçenek B: Secret'ı ayrı olarak oluşturun**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Yerel test amacıyla belirteci standart çıktıya yazdırmak için komutlardan birine `--show-token` ekleyin.

### 2) Gateway'e erişin

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Dağıtılan bileşenler

```text
Ad alanı: openclaw (OPENCLAW_NAMESPACE ile yapılandırılabilir)
├── Deployment/openclaw        # Tek pod, başlatma konteyneri + gateway
├── Service/openclaw           # 18789 numaralı bağlantı noktasında ClusterIP
├── PersistentVolumeClaim      # Ajan durumu ve yapılandırması için 10 Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway belirteci + API anahtarları
```

## Özelleştirme

### Ajan talimatları

`scripts/k8s/manifests/configmap.yaml` içindeki `AGENTS.md` dosyasını düzenleyip yeniden dağıtın:

```bash
./scripts/k8s/deploy.sh
```

### Gateway yapılandırması

`scripts/k8s/manifests/configmap.yaml` içindeki `openclaw.json` dosyasını düzenleyin. Tam başvuru için [Gateway yapılandırması](/tr/gateway/configuration) bölümüne bakın.

### Sağlayıcı ekleme

Ek anahtarları dışa aktardıktan sonra yeniden çalıştırın:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Üzerine yazmadığınız sürece mevcut sağlayıcı anahtarları Secret içinde kalır.

Alternatif olarak Secret'a doğrudan yama uygulayın:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Özel ad alanı

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Özel imaj

`scripts/k8s/manifests/deployment.yaml` içindeki `image` alanını düzenleyin:

```yaml
image: ghcr.io/openclaw/openclaw:slim # birincil; resmî Docker Hub aynası: openclaw/openclaw
```

### Bağlantı noktası yönlendirmenin ötesinde erişime açma

Varsayılan manifestler, gateway'i pod içindeki geri döngü arabirimine bağlar. Bu, `kubectl port-forward` ile çalışır ancak pod IP'sine doğrudan ulaşması gereken bir Kubernetes `Service` veya Ingress yolu ile çalışmaz.

Gateway'i bir Ingress veya yük dengeleyici üzerinden erişime açmak için:

- `scripts/k8s/manifests/configmap.yaml` içindeki gateway bağlama ayarını `loopback` değerinden, dağıtım modelinize uyan geri döngü dışı bir bağlama ayarına değiştirin.
- Gateway kimlik doğrulamasını etkin tutun ve TLS sonlandırması düzgün yapılandırılmış bir giriş noktası kullanın.
- Denetim Arayüzünü, desteklenen web güvenliği modelini kullanarak uzaktan erişim için yapılandırın (örneğin HTTPS/Tailscale Serve ve gerektiğinde açıkça belirtilmiş izin verilen kaynaklar).

## Yeniden dağıtma

```bash
./scripts/k8s/deploy.sh
```

Bu komut tüm manifestleri uygular ve yapılandırma veya Secret değişikliklerinin etkinleşmesi için pod'u yeniden başlatır.

## Kaldırma

```bash
./scripts/k8s/deploy.sh --delete
```

Bu komut, PVC dâhil olmak üzere ad alanını ve içindeki tüm kaynakları siler.

## Mimari notları

- Gateway, varsayılan olarak pod içindeki geri döngü arabirimine bağlanır; bu nedenle sağlanan kurulum `kubectl port-forward` içindir.
- Küme kapsamlı kaynak yoktur; her şey tek bir ad alanında bulunur.
- Güvenlik sağlamlaştırması: `readOnlyRootFilesystem`, `drop: ALL` yetenekleri, root olmayan kullanıcı (UID 1000).
- Varsayılan yapılandırma, Denetim Arayüzünü daha güvenli yerel erişim yolunda tutar: geri döngü bağlaması ve `http://127.0.0.1:18789` adresine `kubectl port-forward`.
- localhost erişiminin ötesine geçerseniz desteklenen uzak erişim modelini kullanın: HTTPS/Tailscale ile uygun gateway bağlama ve Denetim Arayüzü kaynak ayarları.
- Gizli bilgiler geçici bir dizinde oluşturulur ve doğrudan kümeye uygulanır; depo çalışma kopyasına hiçbir gizli bilgi yazılmaz.

## Dosya yapısı

```text
scripts/k8s/
├── deploy.sh                   # Ad alanı + Secret oluşturur, kustomize aracılığıyla dağıtır
├── create-kind.sh              # Yerel Kind kümesi (docker/podman'ı otomatik algılar)
└── manifests/
    ├── kustomization.yaml      # Kustomize tabanı
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Güvenlik sağlamlaştırması içeren pod belirtimi
    ├── pvc.yaml                # 10 Gi kalıcı depolama
    └── service.yaml            # 18789 üzerinde ClusterIP
```

## İlgili bölümler

- [Docker](/tr/install/docker)
- [Docker VM çalışma zamanı](/tr/install/docker-vm-runtime)
- [Kuruluma genel bakış](/tr/install)
