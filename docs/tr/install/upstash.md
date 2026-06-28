---
read_when:
    - OpenClaw'u Upstash Box'a dağıtma
    - OpenClaw için SSH tünelli pano erişimine sahip yönetilen bir Linux ortamı istiyorsunuz
summary: OpenClaw’u keep-alive ve SSH tüneli erişimiyle Upstash Box üzerinde barındırın
title: Upstash Kutusu
x-i18n:
    generated_at: "2026-06-28T00:45:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Upstash Box üzerinde, sürekli çalışır yaşam döngüsü desteğine sahip yönetilen bir Linux ortamında kalıcı bir OpenClaw Gateway çalıştırın.

Kontrol paneli erişimi için bir SSH tüneli kullanın. Gateway bağlantı noktasını doğrudan herkese açık internete açmayın.

## Önkoşullar

- Upstash hesabı
- Sürekli çalışır Upstash Box
- Yerel makinenizde SSH istemcisi

## Bir Box oluşturun

Upstash Console içinde sürekli çalışır bir Box oluşturun. `right-flamingo-14486` gibi Box ID değerini ve Box API anahtarınızı not edin.

Upstash, güncel OpenClaw Box kurulum kılavuzunu
[OpenClaw Kurulumu](https://upstash.com/docs/box/guides/openclaw-setup) sayfasında tutar.

## SSH tüneliyle bağlanın

OpenClaw kontrol paneli bağlantı noktasını yerel makinenize yönlendirin. İstendiğinde SSH parolası olarak Box API anahtarınızı kullanın:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Keepalive seçenekleri, onboarding sırasında boşta kalan tünel kopmalarını azaltır.

## OpenClaw'ı yükleyin

Box içinde:

```bash
sudo npm install -g openclaw
```

## Onboarding'i çalıştırın

```bash
openclaw onboard --install-daemon
```

İstemleri izleyin. Onboarding tamamlandığında kontrol paneli URL'sini ve token'ı kopyalayın.

## Gateway'i başlatın

Gateway'i Box ağı için yapılandırın ve arka planda başlatın:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

SSH tüneli etkin durumdayken kontrol paneli URL'sini yerel olarak açın:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Otomatik yeniden başlatma

Gateway'in Box başlatıldığında yeniden başlaması için bu komutu Box init betiği olarak ayarlayın:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Sorun giderme

Onboarding sırasında SSH donarsa temiz bir SSH yapılandırması ve keepalive'larla yeniden bağlanın:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Bu, eskimiş yerel `~/.ssh/config` ayarlarını atlar ve boşta kalan ağ dönemlerinde tüneli etkin tutar.

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Gateway güvenliği](/tr/gateway/security)
- [OpenClaw'ı güncelleme](/tr/install/updating)
