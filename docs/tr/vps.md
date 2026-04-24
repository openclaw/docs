---
read_when:
    - Gateway'i bir Linux sunucusunda veya bulut VPS üzerinde çalıştırmak istiyorsunuz
    - Barındırma kılavuzlarının hızlı bir özetine ihtiyacınız var
    - OpenClaw için genel Linux sunucusu ayarlamaları istiyorsunuz
sidebarTitle: Linux Server
summary: OpenClaw'ı bir Linux sunucusunda veya bulut VPS üzerinde çalıştırın — sağlayıcı seçici, mimari ve ayarlama
title: Linux sunucusu
x-i18n:
    generated_at: "2026-04-24T09:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

OpenClaw Gateway'i herhangi bir Linux sunucusunda veya bulut VPS üzerinde çalıştırın. Bu sayfa,
bir sağlayıcı seçmenize yardımcı olur, bulut dağıtımlarının nasıl çalıştığını açıklar ve
her yerde geçerli olan genel Linux ayarlamalarını kapsar.

## Bir sağlayıcı seçin

<CardGroup cols={2}>
  <Card title="Railway" href="/tr/install/railway">Tek tıkla, tarayıcı üzerinden kurulum</Card>
  <Card title="Northflank" href="/tr/install/northflank">Tek tıkla, tarayıcı üzerinden kurulum</Card>
  <Card title="DigitalOcean" href="/tr/install/digitalocean">Basit ücretli VPS</Card>
  <Card title="Oracle Cloud" href="/tr/install/oracle">Her zaman ücretsiz ARM katmanı</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner VPS üzerinde Docker</Card>
  <Card title="Hostinger" href="/tr/install/hostinger">Tek tıkla kurulumlu VPS</Card>
  <Card title="GCP" href="/tr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/tr/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/tr/install/exe-dev">HTTPS proxy'li VM</Card>
  <Card title="Raspberry Pi" href="/tr/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** de iyi çalışır.
Topluluk tarafından hazırlanmış bir video anlatımı şu adreste mevcuttur:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(topluluk kaynağı -- kullanılamaz hale gelebilir).

## Bulut kurulumları nasıl çalışır

- **Gateway VPS üzerinde çalışır** ve duruma + çalışma alanına sahiptir.
- Dizüstü bilgisayarınızdan veya telefonunuzdan **Control UI** ya da **Tailscale/SSH** üzerinden bağlanırsınız.
- VPS'yi doğruluğun kaynağı olarak değerlendirin ve durum + çalışma alanını düzenli olarak **yedekleyin**.
- Güvenli varsayılan: Gateway'i loopback üzerinde tutun ve buna SSH tüneli veya Tailscale Serve üzerinden erişin.
  `lan` veya `tailnet` üzerine bağlarsanız `gateway.auth.token` veya `gateway.auth.password` zorunlu olsun.

İlgili sayfalar: [Gateway remote access](/tr/gateway/remote), [Platforms hub](/tr/platforms).

## VPS üzerinde paylaşılan şirket agent'i

Bir ekip için tek bir agent çalıştırmak, her kullanıcı aynı güven sınırı içindeyse ve agent yalnızca iş amaçlıysa geçerli bir kurulumdur.

- Bunu özel bir çalışma ortamında tutun (VPS/VM/container + özel OS kullanıcısı/hesaplar).
- Bu çalışma ortamında kişisel Apple/Google hesaplarına veya kişisel tarayıcı/parola yöneticisi profillerine oturum açmayın.
- Kullanıcılar birbirine karşı hasımsa gateway/host/OS kullanıcısına göre ayırın.

Güvenlik modeli ayrıntıları: [Security](/tr/gateway/security).

## VPS ile Node kullanma

Gateway'i bulutta tutabilir ve yerel cihazlarınızda
(Mac/iOS/Android/headless) **Node** eşleyebilirsiniz. Node'lar yerel ekran/kamera/canvas ve `system.run`
yetenekleri sağlarken Gateway bulutta kalır.

Belgeler: [Nodes](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

## Küçük VM'ler ve ARM sunucuları için başlangıç ayarlamaları

Düşük güçlü VM'lerde (veya ARM sunucularında) CLI komutları yavaş geliyorsa Node'un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`, yinelenen komut başlatma sürelerini iyileştirir.
- `OPENCLAW_NO_RESPAWN=1`, kendini yeniden başlatma yolundan kaynaklanan ek başlangıç yükünü önler.
- İlk komut çalıştırması önbelleği ısıtır; sonraki çalıştırmalar daha hızlı olur.
- Raspberry Pi'ye özgü ayrıntılar için bkz. [Raspberry Pi](/tr/install/raspberry-pi).

### systemd ayar kontrol listesi (isteğe bağlı)

`systemd` kullanan VM sunucuları için şunları değerlendirin:

- Kararlı bir başlangıç yolu için servis env'si ekleyin:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Yeniden başlatma davranışını açık tutun:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Durum/önbellek yollarında rastgele G/Ç cold-start cezasını azaltmak için SSD destekli diskleri tercih edin.

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

Bilinçli olarak bir sistem birimi kurduysanız bunun yerine
`openclaw-gateway.service` birimini `sudo systemctl edit openclaw-gateway.service` ile düzenleyin.

`Restart=` ilkelerinin otomatik kurtarmaya nasıl yardımcı olduğu:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Linux OOM davranışı, alt süreç kurban seçimi ve `exit 137`
tanılaması için bkz. [Linux memory pressure and OOM kills](/tr/platforms/linux#memory-pressure-and-oom-kills).

## İlgili

- [Install overview](/tr/install)
- [DigitalOcean](/tr/install/digitalocean)
- [Fly.io](/tr/install/fly)
- [Hetzner](/tr/install/hetzner)
