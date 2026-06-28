---
read_when:
    - Gateway'i bir Linux sunucusunda veya bulut VPS'te çalıştırmak istiyorsunuz
    - Barındırma kılavuzlarının hızlı bir haritasına ihtiyacınız var
    - OpenClaw için genel Linux sunucu ayarlaması istiyorsunuz
sidebarTitle: Linux Server
summary: OpenClaw’ı bir Linux sunucusunda veya bulut VPS’te çalıştırma — sağlayıcı seçici, mimari ve ince ayar
title: Linux sunucusu
x-i18n:
    generated_at: "2026-06-28T01:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

OpenClaw Gateway'i herhangi bir Linux sunucusunda veya bulut VPS üzerinde çalıştırın. Bu sayfa bir sağlayıcı
seçmenize yardımcı olur, bulut dağıtımlarının nasıl çalıştığını açıklar ve her yerde geçerli olan genel Linux
ayarlamalarını kapsar.

## Bir sağlayıcı seçin

<CardGroup cols={2}>
  <Card title="Railway" href="/tr/install/railway">Tek tıklamayla tarayıcı kurulumu</Card>
  <Card title="Northflank" href="/tr/install/northflank">Tek tıklamayla tarayıcı kurulumu</Card>
  <Card title="DigitalOcean" href="/tr/install/digitalocean">Basit ücretli VPS</Card>
  <Card title="Oracle Cloud" href="/tr/install/oracle">Her Zaman Ücretsiz ARM katmanı</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner VPS üzerinde Docker</Card>
  <Card title="Hostinger" href="/tr/install/hostinger">Tek tıklamayla kurulum sunan VPS</Card>
  <Card title="GCP" href="/tr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/tr/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/tr/install/exe-dev">HTTPS proxy ile VM</Card>
  <Card title="Raspberry Pi" href="/tr/install/raspberry-pi">ARM kendi kendine barındırma</Card>
</CardGroup>

**AWS (EC2 / Lightsail / ücretsiz katman)** da iyi çalışır.
Şurada bir topluluk video adım adım anlatımı mevcuttur:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(topluluk kaynağı -- kullanılamaz hale gelebilir).

## Bulut kurulumları nasıl çalışır

- **Gateway VPS üzerinde çalışır** ve durum + çalışma alanının sahibidir.
- Dizüstü bilgisayarınızdan veya telefonunuzdan **Control UI** ya da **Tailscale/SSH** üzerinden bağlanırsınız.
- VPS'yi doğruluk kaynağı olarak kabul edin ve durum + çalışma alanını düzenli olarak **yedekleyin**.
- Güvenli varsayılan: Gateway'i loopback üzerinde tutun ve ona SSH tüneli veya Tailscale Serve üzerinden erişin.
  `lan` veya `tailnet` ile bağlarsanız `gateway.auth.token` veya `gateway.auth.password` zorunlu olsun.

İlgili sayfalar: [Gateway uzaktan erişimi](/tr/gateway/remote), [Platformlar merkezi](/tr/platforms).

## Önce yönetici erişimini güçlendirin

OpenClaw'u herkese açık bir VPS'ye kurmadan önce kutunun kendisini nasıl yöneteceğinize
karar verin.

- Yalnızca Tailnet yönetici erişimi istiyorsanız önce Tailscale'i kurun, VPS'yi
  tailnet'inize katın, Tailscale IP'si veya MagicDNS adı üzerinden ikinci bir SSH oturumunu
  doğrulayın, ardından herkese açık SSH'yi kısıtlayın.
- Tailscale kullanmıyorsanız daha fazla hizmeti açığa çıkarmadan önce SSH
  yolunuz için eşdeğer güçlendirmeyi uygulayın.
- Bu, Gateway erişiminden ayrıdır. OpenClaw'u yine de loopback'e bağlı tutabilir
  ve pano için bir SSH tüneli veya Tailscale Serve kullanabilirsiniz.

Tailscale'e özgü Gateway seçenekleri [Tailscale](/tr/gateway/tailscale) içindedir.

## VPS üzerinde paylaşılan şirket ajanı

Her kullanıcı aynı güven sınırındaysa ve ajan yalnızca iş amaçlıysa, bir ekip için tek bir ajan çalıştırmak geçerli bir kurulumdur.

- Onu ayrılmış bir çalışma zamanında tutun (VPS/VM/container + ayrılmış işletim sistemi kullanıcısı/hesapları).
- Bu çalışma zamanını kişisel Apple/Google hesaplarına veya kişisel tarayıcı/parola yöneticisi profillerine giriş yaptırmayın.
- Kullanıcılar birbirine karşı hasım durumdaysa gateway/ana makine/işletim sistemi kullanıcısına göre ayırın.

Güvenlik modeli ayrıntıları: [Güvenlik](/tr/gateway/security).

## VPS ile düğümleri kullanma

Gateway'i bulutta tutabilir ve yerel cihazlarınızdaki
(Mac/iOS/Android/headless) **düğümlerle** eşleyebilirsiniz. Düğümler yerel ekran/kamera/canvas ve `system.run`
yetenekleri sağlarken Gateway bulutta kalır.

Belgeler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

## Küçük VM'ler ve ARM ana makineleri için başlangıç ayarlaması

CLI komutları düşük güçlü VM'lerde (veya ARM ana makinelerinde) yavaş geliyorsa Node'un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`, tekrarlanan komut başlangıç sürelerini iyileştirir.
- `OPENCLAW_NO_RESPAWN=1`, rutin Gateway yeniden başlatmalarını işlem içinde tutar; bu, ek süreç devirlerini önler ve küçük ana makinelerde PID takibini basit tutar.
- İlk komut çalıştırması önbelleği ısıtır; sonraki çalıştırmalar daha hızlıdır.
- Raspberry Pi'ye özgü ayrıntılar için bkz. [Raspberry Pi](/tr/install/raspberry-pi).

### systemd ayarlama kontrol listesi (isteğe bağlı)

`systemd` kullanan VM ana makineleri için şunları değerlendirin:

- Kararlı bir başlangıç yolu için hizmet ortamı ekleyin:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Yeniden başlatma davranışını açık tutun:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Durum/önbellek yollarında rastgele G/Ç soğuk başlangıç cezalarını azaltmak için SSD destekli diskleri tercih edin.

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

Bunun yerine bilerek bir sistem birimi kurduysanız
`sudo systemctl edit openclaw-gateway.service` üzerinden `openclaw-gateway.service` dosyasını düzenleyin.

`Restart=` ilkelerinin otomatik kurtarmaya nasıl yardımcı olduğu:
[systemd hizmet kurtarmasını otomatikleştirebilir](https://www.redhat.com/en/blog/systemd-automate-recovery).

Linux OOM davranışı, alt süreç kurban seçimi ve `exit 137`
tanıları için bkz. [Linux bellek baskısı ve OOM sonlandırmaları](/tr/platforms/linux#memory-pressure-and-oom-kills).

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [DigitalOcean](/tr/install/digitalocean)
- [Fly.io](/tr/install/fly)
- [Hetzner](/tr/install/hetzner)
