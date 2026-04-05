---
read_when:
    - Gateway'i bir Linux sunucusunda veya bulut VPS üzerinde çalıştırmak istiyorsunuz
    - Barındırma kılavuzlarının hızlı bir özetine ihtiyacınız var
    - OpenClaw için genel Linux sunucusu ayarlamaları istiyorsunuz
sidebarTitle: Linux Server
summary: OpenClaw'u bir Linux sunucusunda veya bulut VPS üzerinde çalıştırın — sağlayıcı seçici, mimari ve ayarlama
title: Linux Sunucusu
x-i18n:
    generated_at: "2026-04-05T14:14:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Linux Sunucusu

OpenClaw Gateway'i herhangi bir Linux sunucusunda veya bulut VPS üzerinde çalıştırın. Bu sayfa, bir sağlayıcı seçmenize yardımcı olur, bulut dağıtımlarının nasıl çalıştığını açıklar ve her yerde geçerli olan genel Linux ayarlamalarını kapsar.

## Bir sağlayıcı seçin

<CardGroup cols={2}>
  <Card title="Railway" href="/tr/install/railway">Tek tıklamayla, tarayıcıda kurulum</Card>
  <Card title="Northflank" href="/tr/install/northflank">Tek tıklamayla, tarayıcıda kurulum</Card>
  <Card title="DigitalOcean" href="/tr/install/digitalocean">Basit ücretli VPS</Card>
  <Card title="Oracle Cloud" href="/tr/install/oracle">Her zaman ücretsiz ARM katmanı</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner VPS üzerinde Docker</Card>
  <Card title="GCP" href="/tr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/tr/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/tr/install/exe-dev">HTTPS proxy ile VM</Card>
  <Card title="Raspberry Pi" href="/tr/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** da iyi çalışır.
Bir topluluk videosu adım adım anlatımı şu adreste mevcuttur:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(topluluk kaynağı -- erişilemez hale gelebilir).

## Bulut kurulumları nasıl çalışır

- **Gateway VPS üzerinde çalışır** ve duruma + çalışma alanına sahiptir.
- Dizüstü bilgisayarınızdan veya telefonunuzdan **Control UI** ya da **Tailscale/SSH** üzerinden bağlanırsınız.
- VPS'yi doğruluk kaynağı olarak değerlendirin ve durumu + çalışma alanını düzenli olarak **yedekleyin**.
- Güvenli varsayılan: Gateway'i loopback üzerinde tutun ve ona SSH tüneli veya Tailscale Serve üzerinden erişin.
  `lan` veya `tailnet` adresine bağlarsanız `gateway.auth.token` veya `gateway.auth.password` gerektirin.

İlgili sayfalar: [Gateway remote access](/tr/gateway/remote), [Platforms hub](/tr/platforms).

## VPS üzerinde paylaşılan şirket ajanı

Bir ekip için tek bir ajan çalıştırmak, her kullanıcının aynı güven sınırı içinde olduğu ve ajanın yalnızca iş amaçlı olduğu durumlarda geçerli bir kurulumdur.

- Bunu özel bir çalışma zamanında tutun (VPS/VM/container + özel OS kullanıcısı/hesapları).
- Bu çalışma zamanında kişisel Apple/Google hesapları veya kişisel tarayıcı/parola yöneticisi profilleri ile oturum açmayın.
- Kullanıcılar birbirine karşı hasım durumdaysa gateway/host/OS kullanıcısına göre ayırın.

Güvenlik modeli ayrıntıları: [Security](/tr/gateway/security).

## VPS ile node kullanma

Gateway'i bulutta tutabilir ve yerel cihazlarınızda **node** eşleyebilirsiniz
(Mac/iOS/Android/headless). Gateway bulutta kalırken node'lar yerel screen/camera/canvas ve `system.run`
özellikleri sağlar.

Belgeler: [Nodes](/tr/nodes), [Nodes CLI](/cli/nodes).

## Küçük VM'ler ve ARM ana makineleri için başlangıç ayarlamaları

CLI komutları düşük güçlü VM'lerde (veya ARM ana makinelerinde) yavaş hissettiriyorsa Node'un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`, tekrar eden komut başlangıç sürelerini iyileştirir.
- `OPENCLAW_NO_RESPAWN=1`, kendi kendine yeniden başlatma yolundan kaynaklanan ek başlangıç yükünü önler.
- İlk komut çalıştırması önbelleği ısıtır; sonraki çalıştırmalar daha hızlı olur.
- Raspberry Pi'ye özgü ayrıntılar için [Raspberry Pi](/tr/install/raspberry-pi) bölümüne bakın.

### systemd ayarlama denetim listesi (isteğe bağlı)

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
`openclaw-gateway.service` birimini `sudo systemctl edit openclaw-gateway.service` ile düzenleyin.

`Restart=` ilkelerinin otomatik kurtarmaya nasıl yardımcı olduğu:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).
