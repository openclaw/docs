---
read_when:
    - OpenClaw'u Render'a dağıtma
    - Render Blueprints ile bildirimsel bir bulut dağıtımı istiyorsunuz.
summary: OpenClaw'u Infrastructure-as-Code ile Render üzerinde dağıtma
title: Render
x-i18n:
    generated_at: "2026-04-23T09:04:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Render

OpenClaw'u Infrastructure as Code kullanarak Render üzerinde dağıtın. Dahil edilen `render.yaml` Blueprint'i tüm yığınınızı bildirimsel olarak tanımlar: hizmet, disk, ortam değişkenleri; böylece tek tıklamayla dağıtım yapabilir ve altyapınızı kodunuzla birlikte sürümleyebilirsiniz.

## Ön koşullar

- Bir [Render hesabı](https://render.com) (ücretsiz katman mevcut)
- Tercih ettiğiniz [model provider](/tr/providers)'dan bir API anahtarı

## Render Blueprint ile dağıtım yapın

[Render'a dağıt](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Bu bağlantıya tıklamak şunları yapar:

1. Bu deponun kökündeki `render.yaml` Blueprint'inden yeni bir Render hizmeti oluşturur.
2. Docker imajını derler ve dağıtır

Dağıtıldıktan sonra hizmet URL'niz `https://<service-name>.onrender.com` biçimini izler.

## Blueprint'i anlama

Render Blueprint'leri altyapınızı tanımlayan YAML dosyalarıdır. Bu depodaki `render.yaml`,
OpenClaw'u çalıştırmak için gereken her şeyi yapılandırır:

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
        generateValue: true # güvenli bir token otomatik üretir
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Kullanılan temel Blueprint özellikleri:

| Özellik              | Amaç                                                         |
| -------------------- | ------------------------------------------------------------ |
| `runtime: docker`     | Deponun Dockerfile dosyasından derler                        |
| `healthCheckPath`     | Render `/health` yolunu izler ve sağlıksız örnekleri yeniden başlatır |
| `generateValue: true` | Kriptografik olarak güvenli bir değer otomatik üretir        |
| `disk`                | Yeniden dağıtımlardan sağ çıkan kalıcı depolama              |

## Plan seçimi

| Plan      | Askıya alma         | Disk          | En iyi kullanım               |
| --------- | ------------------- | ------------- | ----------------------------- |
| Free      | 15 dk boşta kalınca | Kullanılamaz  | Test, demolar                 |
| Starter   | Asla                | 1GB+          | Kişisel kullanım, küçük ekipler |
| Standard+ | Asla                | 1GB+          | Üretim, birden çok kanal      |

Blueprint varsayılan olarak `starter` kullanır. Ücretsiz katmanı kullanmak için
fork'unuzdaki `render.yaml` içinde `plan: free` olarak değiştirin (ancak unutmayın: kalıcı disk olmadığından OpenClaw durumu
her dağıtımda sıfırlanır).

## Dağıtımdan sonra

### Control UI'a erişin

Web dashboard `https://<your-service>.onrender.com/` adresinde kullanılabilir.

Yapılandırılmış paylaşılan sır ile bağlanın. Bu dağıtım şablonu otomatik olarak
`OPENCLAW_GATEWAY_TOKEN` üretir (bunu **Dashboard → hizmetiniz →
Environment** altında bulabilirsiniz); bunu parola kimlik doğrulamasıyla değiştirirseniz
onun yerine bu parolayı kullanın.

## Render Dashboard özellikleri

### Günlükler

Gerçek zamanlı günlükleri **Dashboard → hizmetiniz → Logs** altında görüntüleyin. Şunlara göre filtreleyin:

- Derleme günlükleri (Docker imajı oluşturma)
- Dağıtım günlükleri (hizmet başlangıcı)
- Çalışma zamanı günlükleri (uygulama çıktısı)

### Shell erişimi

Hata ayıklamak için **Dashboard → hizmetiniz → Shell** üzerinden bir shell oturumu açın. Kalıcı disk `/data` noktasına bağlanır.

### Ortam değişkenleri

Değişkenleri **Dashboard → hizmetiniz → Environment** altında değiştirin. Değişiklikler otomatik bir yeniden dağıtımı tetikler.

### Otomatik dağıtım

Özgün OpenClaw deposunu kullanıyorsanız Render OpenClaw'unuzu otomatik olarak yeniden dağıtmaz. Güncellemek için dashboard üzerinden elle Blueprint eşitlemesi çalıştırın.

## Özel alan adı

1. **Dashboard → hizmetiniz → Settings → Custom Domains** bölümüne gidin
2. Alan adınızı ekleyin
3. DNS'i yönergelere göre yapılandırın (`*.onrender.com` için CNAME)
4. Render otomatik olarak bir TLS sertifikası sağlar

## Ölçekleme

Render yatay ve dikey ölçeklemeyi destekler:

- **Dikey**: Daha fazla CPU/RAM almak için planı değiştirin
- **Yatay**: Örnek sayısını artırın (Standard plan ve üzeri)

OpenClaw için genellikle dikey ölçekleme yeterlidir. Yatay ölçekleme sticky session'lar veya harici durum yönetimi gerektirir.

## Yedekleme ve taşıma

Durumunuzu, yapılandırmanızı, auth profile'larınızı ve çalışma alanınızı Render Dashboard içindeki
shell erişimini kullanarak istediğiniz zaman dışa aktarın:

```bash
openclaw backup create
```

Bu, OpenClaw durumu ile birlikte yapılandırılmış
çalışma alanını da içeren taşınabilir bir yedek arşivi oluşturur. Ayrıntılar için [Backup](/tr/cli/backup) bölümüne bakın.

## Sorun giderme

### Hizmet başlamıyor

Render Dashboard'daki dağıtım günlüklerini kontrol edin. Yaygın sorunlar:

- Eksik `OPENCLAW_GATEWAY_TOKEN` — **Dashboard → Environment** altında ayarlandığını doğrulayın
- Port uyuşmazlığı — Gateway'in Render'ın beklediği porta bağlanması için `OPENCLAW_GATEWAY_PORT=8080` ayarlı olduğundan emin olun

### Yavaş soğuk başlangıçlar (ücretsiz katman)

Ücretsiz katman hizmetleri 15 dakika hareketsizlikten sonra askıya alınır. Askıya almadan sonraki ilk istek, container başlarken birkaç saniye sürer. Her zaman açık kullanım için Starter planına yükseltin.

### Yeniden dağıtımdan sonra veri kaybı

Bu ücretsiz katmanda olur (kalıcı disk yoktur). Ücretli bir plana yükseltin veya
Render shell içinde `openclaw backup create` ile düzenli olarak tam yedek dışa aktarın.

### Sağlık kontrolü hataları

Render, `/health` yolundan 30 saniye içinde 200 yanıtı bekler. Derlemeler başarılı ama dağıtımlar başarısız oluyorsa, hizmetin başlaması çok uzun sürüyor olabilir. Şunları kontrol edin:

- Hatalar için derleme günlükleri
- Container'ın yerelde `docker build && docker run` ile çalışıp çalışmadığı

## Sonraki adımlar

- Mesajlaşma kanallarını kurun: [Kanallar](/tr/channels)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw'u güncel tutun: [Güncelleme](/tr/install/updating)
