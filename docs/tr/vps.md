---
read_when:
    - Gateway'i bir Linux sunucusunda veya bulut VPS'inde çalıştırmak istiyorsunuz
    - Barındırma kılavuzlarına ilişkin hızlı bir genel bakışa ihtiyacınız var
    - OpenClaw için genel Linux sunucu optimizasyonu istiyorsunuz
sidebarTitle: Linux Server
summary: OpenClaw'u bir Linux sunucusunda veya bulut VPS'te çalıştırma — sağlayıcı seçici, mimari ve ince ayar
title: Linux sunucusu
x-i18n:
    generated_at: "2026-07-12T12:55:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

OpenClaw Gateway'ini herhangi bir Linux sunucusunda veya bulut VPS'sinde çalıştırın. Bu sayfa,
bir sağlayıcı seçmenize yardımcı olur, bulut dağıtımlarının nasıl çalıştığını açıklar ve her ortamda
geçerli olan genel Linux ayarlarını ele alır.

## Bir sağlayıcı seçin

<CardGroup cols={2}>
  <Card title="Azure" href="/tr/install/azure">Linux sanal makinesi</Card>
  <Card title="DigitalOcean" href="/tr/install/digitalocean">Basit ücretli VPS</Card>
  <Card title="exe.dev" href="/tr/install/exe-dev">HTTPS proxy'li sanal makine</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/tr/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner VPS üzerinde Docker</Card>
  <Card title="Hostinger" href="/tr/install/hostinger">Tek tıklamayla kurulum sunan VPS</Card>
  <Card title="Northflank" href="/tr/install/northflank">Tek tıklamayla tarayıcı üzerinden kurulum</Card>
  <Card title="Oracle Cloud" href="/tr/install/oracle">Daima Ücretsiz ARM katmanı</Card>
  <Card title="Railway" href="/tr/install/railway">Tek tıklamayla tarayıcı üzerinden kurulum</Card>
  <Card title="Raspberry Pi" href="/tr/install/raspberry-pi">ARM üzerinde kendi kendine barındırma</Card>
</CardGroup>

**AWS (EC2 / Lightsail / ücretsiz katman)** da iyi çalışır.
Topluluk tarafından hazırlanmış bir videolu anlatıma
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
adresinden ulaşabilirsiniz (topluluk kaynağıdır ve kullanılamaz hâle gelebilir).

## Bulut kurulumları nasıl çalışır?

- **Gateway VPS üzerinde çalışır** ve durum ile çalışma alanını yönetir.
- Dizüstü bilgisayarınızdan veya telefonunuzdan **Kontrol Arayüzü** ya da **Tailscale/SSH** aracılığıyla bağlanırsınız.
- VPS'yi asıl veri kaynağı olarak kabul edin ve durum ile çalışma alanını düzenli olarak **yedekleyin**.
- Güvenli varsayılan: Gateway'i local loopback üzerinde tutun ve SSH tüneli veya Tailscale Serve üzerinden erişin.
  `lan` veya `tailnet` adresine bağlarsanız kimlik doğrulama güvenilir bir
  proxy'ye devredilmediği sürece Gateway, paylaşılan bir gizli bilgi
  (`gateway.auth.token` veya `gateway.auth.password`) gerektirir.

İlgili sayfalar: [Gateway'e uzaktan erişim](/tr/gateway/remote), [Platformlar merkezi](/tr/platforms).

## Önce yönetici erişimini güçlendirin

OpenClaw'ı herkese açık bir VPS'ye kurmadan önce, makinenin kendisini nasıl
yöneteceğinize karar verin.

- Yalnızca Tailnet üzerinden yönetici erişimi için: önce Tailscale'i kurun, VPS'yi
  tailnet'inize katın, Tailscale IP'si veya MagicDNS adı üzerinden ikinci bir SSH oturumunu
  doğrulayın, ardından herkese açık SSH erişimini kısıtlayın.
- Tailscale olmadan: daha fazla hizmeti dışarı açmadan önce SSH erişim yolunuz için
  eşdeğer güçlendirmeyi uygulayın.
- Bu, Gateway erişiminden ayrıdır. OpenClaw'ı local loopback'e bağlı tutmaya devam edebilir
  ve kontrol paneli için SSH tüneli veya Tailscale Serve kullanabilirsiniz.

Tailscale'e özgü Gateway seçenekleri [Tailscale](/tr/gateway/tailscale) sayfasında yer alır.

## VPS üzerinde paylaşılan şirket aracısı

Tüm kullanıcılar aynı güven sınırı içindeyse ve aracı yalnızca iş amacıyla kullanılıyorsa,
bir ekip için tek bir aracı çalıştırmak geçerli bir kurulumdur.

- Aracıyı özel bir çalışma ortamında tutun (VPS/sanal makine/konteyner + özel işletim sistemi kullanıcısı/hesapları).
- Bu çalışma ortamında kişisel Apple/Google hesaplarında veya kişisel tarayıcı/parola yöneticisi profillerinde oturum açmayın.
- Kullanıcılar birbirine karşı kötü niyetli olabilecekse gateway/ana makine/işletim sistemi kullanıcısına göre ayırın.

Güvenlik modeli ayrıntıları: [Güvenlik](/tr/gateway/security).

## VPS ile Node kullanımı

Gateway'i bulutta tutabilir ve yerel cihazlarınızdaki
(Mac/iOS/Android/başsız) **Node'ları** eşleştirebilirsiniz. Gateway bulutta kalırken Node'lar,
yerel ekran/kamera/canvas ve `system.run` yeteneklerini sağlar.

Belgeler: [Node'lar](/tr/nodes), [Node CLI](/tr/cli/nodes).

## Küçük sanal makineler ve ARM ana makineleri için başlangıç ayarları

Düşük güçlü sanal makinelerde (veya ARM ana makinelerinde) CLI komutları yavaş çalışıyorsa Node'un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`, tekrarlanan komutların başlatma sürelerini iyileştirir; ilk çalıştırma önbelleği hazırlar.
- `OPENCLAW_NO_RESPAWN=1`, rutin Gateway yeniden başlatmalarını aynı işlem içinde tutar; bu, ek işlem devirlerini önler ve küçük ana makinelerde PID takibini basit tutar.
- Raspberry Pi'ye özgü ayrıntılar için [Raspberry Pi](/tr/install/raspberry-pi) sayfasına bakın.

### systemd ayarları kontrol listesi (isteğe bağlı)

`systemd` kullanan sanal makine ana makineleri için şunları değerlendirin:

- Kararlı bir başlatma yolu için hizmet ortam değişkenleri: `OPENCLAW_NO_RESPAWN=1` ve
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Açık yeniden başlatma davranışı: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Rastgele G/Ç kaynaklı soğuk başlatma gecikmelerini azaltmak için durum/önbellek yollarında SSD destekli diskler.

Standart `openclaw onboard --install-daemon` yolu bir systemd kullanıcı
birimi kurar; şu komutla düzenleyin:

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

Bunun yerine kasıtlı olarak bir sistem birimi kurduysanız şu komutla düzenleyin:
`sudo systemctl edit openclaw-gateway.service`.

`Restart=` ilkeleri otomatik kurtarmaya nasıl yardımcı olur:
[systemd hizmet kurtarmayı otomatikleştirebilir](https://www.redhat.com/en/blog/systemd-automate-recovery).

Linux OOM davranışı, alt işlemlerde kurban seçimi ve `exit 137`
tanılaması için [Linux bellek baskısı ve OOM sonlandırmaları](/tr/platforms/linux#memory-pressure-and-oom-kills) sayfasına bakın.

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [DigitalOcean](/tr/install/digitalocean)
- [Fly.io](/tr/install/fly)
- [Hetzner](/tr/install/hetzner)
