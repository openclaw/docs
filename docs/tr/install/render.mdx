---
read_when:
    - OpenClaw'u Render'a Dağıtma
    - Render Blueprints ile bildirimsel bir bulut dağıtımı istiyorsunuz
summary: OpenClaw'u Kod Olarak Altyapı ile Render üzerinde dağıtın
title: İşle
x-i18n:
    generated_at: "2026-07-12T12:23:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

OpenClaw'u, deponun `render.yaml` Blueprint'ini kullanarak [Render](https://render.com) üzerinde dağıtın. Bu dosya; hizmeti, diski ve ortam değişkenlerini tek bir dosyada tanımlar.

## Ön koşullar

- Bir [Render hesabı](https://render.com) (ücretsiz katman mevcuttur)
- Tercih ettiğiniz [model sağlayıcısından](/tr/providers) bir API anahtarı

## Dağıtım

[Render'a dağıt](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Bu işlem, `render.yaml` dosyasından bir Render hizmeti oluşturur, Docker imajını derler ve dağıtır. Hizmet URL'niz `https://<service-name>.onrender.com` biçimini izler.

## Blueprint

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # güvenli bir belirteci otomatik olarak oluşturur
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Özellik               | Amaç                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `runtime: docker`     | Deponun Dockerfile'ından derler                                    |
| `healthCheckPath`     | Render, `/health` yolunu izler ve sağlıksız örnekleri yeniden başlatır |
| `generateValue: true` | Kriptografik olarak güvenli bir değeri otomatik olarak oluşturur   |
| `disk`                | Yeniden dağıtımlardan sonra da korunan kalıcı depolama              |

## Plan seçimi

| Plan      | Devre dışı kalma       | Disk        | En uygun kullanım                |
| --------- | ---------------------- | ----------- | -------------------------------- |
| Ücretsiz  | 15 dakika boşta kalınca | Mevcut değil | Testler, demolar                 |
| Starter   | Asla                   | 1 GB+       | Kişisel kullanım, küçük ekipler  |
| Standard+ | Asla                   | 1 GB+       | Üretim, birden fazla kanal       |

Blueprint varsayılan olarak `starter` kullanır. Ücretsiz katmanı kullanmak için kendi fork'unuzdaki `render.yaml` dosyasında `plan: free` olarak değiştirin. Kalıcı disk olmadığında OpenClaw durumunun her dağıtımda sıfırlanacağını unutmayın.

## Dağıtımdan sonra

### Denetim Arayüzüne erişme

Web panosu `https://<your-service>.onrender.com/` adresinde kullanılabilir. Paylaşılan gizli anahtarı kullanarak bağlanın: otomatik oluşturulan `OPENCLAW_GATEWAY_TOKEN` (**Dashboard → your service → Environment** bölümünde bulabilirsiniz) veya parola kimlik doğrulamasına geçtiyseniz parolanız.

### Günlükler

**Dashboard → your service → Logs**, derleme günlüklerini (Docker imajının oluşturulması), dağıtım günlüklerini (hizmetin başlatılması) ve çalışma zamanı günlüklerini (uygulama çıktısı) gösterir.

### Kabuk erişimi

**Dashboard → your service → Shell**, bir kabuk oturumu açar. Kalıcı disk `/data` konumuna bağlanır.

### Ortam değişkenleri

Değişkenleri **Dashboard → your service → Environment** bölümünde düzenleyin. Değişiklikler otomatik yeniden dağıtımı tetikler.

### Otomatik dağıtım

Bağlı deponun dalına yeni bir commit geldiğinde Render otomatik olarak yeniden dağıtım yapar. Kendi fork'unuz yerine doğrudan `openclaw/openclaw` deposundan dağıtım yaptıysanız bunu tetikleyecek gönderim erişiminiz olmaz. Bu nedenle Dashboard üzerinden manuel bir Blueprint eşitlemesi çalıştırarak güncelleyin veya hizmeti kendi fork'unuza yönlendirin.

## Özel alan adı

1. **Dashboard → your service → Settings → Custom Domains**
2. Alan adınızı ekleyin
3. DNS'i belirtildiği şekilde yapılandırın (`*.onrender.com` adresine CNAME)
4. Render otomatik olarak bir TLS sertifikası sağlar

## Ölçeklendirme

- **Dikey**: Daha fazla CPU/RAM için planı değiştirin. Genellikle OpenClaw için yeterlidir.
- **Yatay**: Örnek sayısını artırın (Standard planı ve üzeri). OpenClaw çalışma zamanı durumunu yerel diskte tuttuğundan yapışkan oturumlar veya harici durum yönetimi gerektirir.

## Yedeklemeler ve geçiş

Render Dashboard kabuğundan durumu, yapılandırmayı, kimlik doğrulama profillerini ve çalışma alanını istediğiniz zaman dışa aktarın:

```bash
openclaw backup create
```

Bu işlem taşınabilir bir yedekleme arşivi oluşturur. Bkz. [Yedekleme](/tr/cli/backup).

## Sorun giderme

### Hizmet başlamıyor

Render Dashboard'daki dağıtım günlüklerini kontrol edin. Yaygın sorunlar:

- Eksik `OPENCLAW_GATEWAY_TOKEN` — **Dashboard → Environment** bölümünde ayarlandığını doğrulayın
- Port uyuşmazlığı — Gateway'in Render'ın beklediği porta bağlanması için `OPENCLAW_GATEWAY_PORT=8080` olduğundan emin olun

### Yavaş soğuk başlatmalar (ücretsiz katman)

Ücretsiz katman hizmetleri 15 dakika işlem yapılmadığında devre dışı kalır. Devre dışı kaldıktan sonraki ilk istek, konteyner başlatılırken birkaç saniye sürer. Hizmetin sürekli etkin kalması için Starter planına yükseltin.

### Yeniden dağıtımdan sonra veri kaybı

Bu durum ücretsiz katmanda meydana gelir (kalıcı disk yoktur). Ücretli bir plana yükseltin veya Render kabuğundan `openclaw backup create` komutuyla düzenli olarak yedeklemeyi dışa aktarın.

### Sistem durumu denetimi hataları

Derlemeler başarılı olduğu hâlde dağıtımlar başarısız oluyorsa hizmetin başlaması çok uzun sürüyor veya `/health` erişilebilir olmayabilir. Şunları kontrol edin:

- Hatalar için derleme günlükleri
- Konteynerin `docker build && docker run` komutuyla yerel olarak çalışıp çalışmadığı

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw'u güncel tutun: [Güncelleme](/tr/install/updating)
