---
read_when:
    - Gateway'i bir Linux sunucusunda veya bulut VPS'sinde çalıştırmak istiyorsunuz
    - Barındırma kılavuzlarının hızlı bir haritasına ihtiyacınız var
    - OpenClaw için genel Linux sunucusu ayarlaması istiyorsunuz
sidebarTitle: Linux Server
summary: OpenClaw’ı bir Linux sunucusunda veya bulut VPS’te çalıştırma — sağlayıcı seçici, mimari ve ayarlama
title: Linux sunucusu
x-i18n:
    generated_at: "2026-04-30T09:52:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

OpenClaw Gateway'i herhangi bir Linux sunucusunda veya bulut VPS üzerinde çalıştırın. Bu sayfa bir sağlayıcı
seçmenize yardımcı olur, bulut dağıtımlarının nasıl çalıştığını açıklar ve her yerde geçerli olan genel Linux
ayarlamalarını kapsar.

## Bir sağlayıcı seçin

<CardGroup cols={2}>
  <Card title="Railway" href="/tr/install/railway">Tek tıkla, tarayıcıda kurulum</Card>
  <Card title="Northflank" href="/tr/install/northflank">Tek tıkla, tarayıcıda kurulum</Card>
  <Card title="DigitalOcean" href="/tr/install/digitalocean">Basit ücretli VPS</Card>
  <Card title="Oracle Cloud" href="/tr/install/oracle">Her Zaman Ücretsiz ARM katmanı</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner VPS üzerinde Docker</Card>
  <Card title="Hostinger" href="/tr/install/hostinger">Tek tıkla kurulumlu VPS</Card>
  <Card title="GCP" href="/tr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/tr/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/tr/install/exe-dev">HTTPS proxy'li VM</Card>
  <Card title="Raspberry Pi" href="/tr/install/raspberry-pi">ARM kendi kendine barındırma</Card>
</CardGroup>

**AWS (EC2 / Lightsail / ücretsiz katman)** da iyi çalışır.
Topluluk tarafından hazırlanmış bir video anlatımı
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
adresinde mevcuttur (topluluk kaynağı -- kullanılamaz hale gelebilir).

## Bulut kurulumları nasıl çalışır

- **Gateway VPS üzerinde çalışır** ve durum + çalışma alanına sahip olur.
- Dizüstü bilgisayarınızdan veya telefonunuzdan **Kontrol Arayüzü** ya da **Tailscale/SSH** üzerinden bağlanırsınız.
- VPS'yi doğruluk kaynağı olarak kabul edin ve durum + çalışma alanını düzenli olarak **yedekleyin**.
- Güvenli varsayılan: Gateway'i loopback üzerinde tutun ve ona SSH tüneli veya Tailscale Serve üzerinden erişin.
  `lan` veya `tailnet` adresine bağlarsanız `gateway.auth.token` ya da `gateway.auth.password` zorunlu olsun.

İlgili sayfalar: [Gateway uzaktan erişim](/tr/gateway/remote), [Platformlar merkezi](/tr/platforms).

## Önce yönetici erişimini sağlamlaştırın

OpenClaw'u herkese açık bir VPS üzerine kurmadan önce, makinenin kendisini nasıl yönetmek
istediğinize karar verin.

- Yalnızca Tailnet üzerinden yönetici erişimi istiyorsanız önce Tailscale'i kurun, VPS'yi
  tailnet'inize katın, Tailscale IP'si veya MagicDNS adı üzerinden ikinci bir SSH oturumunu
  doğrulayın, ardından herkese açık SSH erişimini kısıtlayın.
- Tailscale kullanmıyorsanız, daha fazla hizmeti dışa açmadan önce SSH
  yolunuz için eşdeğer sağlamlaştırmayı uygulayın.
- Bu, Gateway erişiminden ayrıdır. OpenClaw'u yine loopback'e bağlı tutabilir ve
  pano için SSH tüneli veya Tailscale Serve kullanabilirsiniz.

Tailscale'e özgü Gateway seçenekleri [Tailscale](/tr/gateway/tailscale) bölümünde yer alır.

## VPS üzerinde paylaşılan şirket ajanı

Tek bir ajanı bir ekip için çalıştırmak, her kullanıcı aynı güven sınırı içindeyse ve ajan yalnızca iş amaçlıysa geçerli bir kurulumdur.

- Onu ayrılmış bir çalışma ortamında tutun (VPS/VM/kapsayıcı + ayrılmış OS kullanıcısı/hesapları).
- Bu çalışma ortamında kişisel Apple/Google hesaplarına veya kişisel tarayıcı/parola yöneticisi profillerine giriş yapmayın.
- Kullanıcılar birbirine karşı hasmane davranabilecekse gateway/ana makine/OS kullanıcısına göre ayırın.

Güvenlik modeli ayrıntıları: [Güvenlik](/tr/gateway/security).

## VPS ile düğümleri kullanma

Gateway'i bulutta tutabilir ve yerel cihazlarınızdaki **düğümleri** eşleyebilirsiniz
(Mac/iOS/Android/headless). Düğümler, Gateway bulutta kalırken yerel ekran/kamera/canvas ve `system.run`
yetenekleri sağlar.

Belgeler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

## Küçük VM'ler ve ARM ana makineleri için başlangıç ayarlaması

Düşük güçlü VM'lerde (veya ARM ana makinelerinde) CLI komutları yavaş geliyorsa Node'un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` tekrarlanan komut başlangıç sürelerini iyileştirir.
- `OPENCLAW_NO_RESPAWN=1`, kendini yeniden başlatma yolundan gelen ek başlangıç yükünü önler.
- İlk komut çalıştırması önbelleği ısıtır; sonraki çalıştırmalar daha hızlıdır.
- Raspberry Pi'ye özgü ayrıntılar için [Raspberry Pi](/tr/install/raspberry-pi) bölümüne bakın.

### systemd ayarlama kontrol listesi (isteğe bağlı)

`systemd` kullanan VM ana makineleri için şunları değerlendirin:

- Kararlı bir başlangıç yolu için hizmet ortam değişkenleri ekleyin:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Yeniden başlatma davranışını açık tutun:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Rastgele G/Ç soğuk başlangıç cezalarını azaltmak için durum/önbellek yollarında SSD destekli diskleri tercih edin.

Standart `openclaw onboard --install-daemon` yolu için kullanıcı birimini düzenleyin:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Bunun yerine bilerek bir sistem birimi kurduysanız,
`openclaw-gateway.service` dosyasını `sudo systemctl edit openclaw-gateway.service` ile düzenleyin.

`Restart=` ilkelerinin otomatik kurtarmaya nasıl yardımcı olduğu:
[systemd hizmet kurtarmayı otomatikleştirebilir](https://www.redhat.com/en/blog/systemd-automate-recovery).

Linux OOM davranışı, alt süreç kurban seçimi ve `exit 137`
tanıları için [Linux bellek baskısı ve OOM sonlandırmaları](/tr/platforms/linux#memory-pressure-and-oom-kills) bölümüne bakın.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [DigitalOcean](/tr/install/digitalocean)
- [Fly.io](/tr/install/fly)
- [Hetzner](/tr/install/hetzner)
