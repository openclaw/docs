---
read_when:
    - Gateway için ucuz, her zaman açık bir Linux ana makinesi istiyorsunuz
    - Kendi VPS'inizi çalıştırmadan uzaktan Control UI erişimi istiyorsunuz
summary: Uzaktan erişim için OpenClaw Gateway'i exe.dev üzerinde (VM + HTTPS proxy) çalıştırın
title: exe.dev
x-i18n:
    generated_at: "2026-04-05T13:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff95b6f35b95df35c1b0cae3215647eefe88d2b7f19923868385036cc0dbdbf1
    source_path: install/exe-dev.md
    workflow: 15
---

# exe.dev

Hedef: Bir exe.dev VM üzerinde çalışan ve dizüstü bilgisayarınızdan `https://<vm-name>.exe.xyz` üzerinden erişilebilen bir OpenClaw Gateway

Bu sayfa, exe.dev'in varsayılan **exeuntu** imajını varsayar. Farklı bir dağıtım seçtiyseniz paketleri buna göre eşleyin.

## Başlangıç düzeyi hızlı yol

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Gerektiği şekilde auth anahtarınızı/token'ınızı doldurun
3. VM'nizin yanında bulunan "Agent" seçeneğine tıklayın ve Shelley hazırlamayı tamamlayana kadar bekleyin
4. `https://<vm-name>.exe.xyz/` adresini açın ve yapılandırılmış paylaşılan gizli veriyle kimlik doğrulaması yapın (bu kılavuz varsayılan olarak token auth kullanır, ancak `gateway.auth.mode` değiştirirseniz password auth da çalışır)
5. Bekleyen cihaz eşleştirme isteklerini `openclaw devices approve <requestId>` ile onaylayın

## Gerekenler

- exe.dev hesabı
- [exe.dev](https://exe.dev) sanal makinelerine `ssh exe.dev` erişimi (isteğe bağlı)

## Shelley ile otomatik kurulum

[exe.dev](https://exe.dev)'in aracı Shelley, OpenClaw'ı bizim istemimizle anında kurabilir. Kullanılan istem aşağıdadır:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Elle kurulum

## 1) VM'yi oluşturun

Cihazınızdan:

```bash
ssh exe.dev new
```

Sonra bağlanın:

```bash
ssh <vm-name>.exe.xyz
```

İpucu: Bu VM'yi **durum bilgili** tutun. OpenClaw; `openclaw.json`, aracı başına
`auth-profiles.json`, oturumlar ve kanal/sağlayıcı durumunu
`~/.openclaw/` altında, ayrıca çalışma alanını `~/.openclaw/workspace/` altında saklar.

## 2) Ön koşulları kurun (VM üzerinde)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw'ı kurun

OpenClaw kurulum betiğini çalıştırın:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) OpenClaw'ı 8000 portuna proxy'lemek için nginx kurun

`/etc/nginx/sites-enabled/default` dosyasını şu içerikle düzenleyin:

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket desteği
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standart proxy üstbilgileri
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Uzun ömürlü bağlantılar için zaman aşımı ayarları
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

İstemci tarafından sağlanan zincirleri korumak yerine yönlendirme üstbilgilerinin üzerine yazın.
OpenClaw, iletilen IP meta verilerine yalnızca açıkça yapılandırılmış proxy'lerden güvenir
ve ekleme tarzı `X-Forwarded-For` zincirleri sağlamlaştırma riski olarak değerlendirilir.

## 5) OpenClaw'a erişin ve yetki verin

`https://<vm-name>.exe.xyz/` adresine erişin (onboarding sırasında çıkan Control UI çıktısına bakın). Auth isterse
VM'deki yapılandırılmış paylaşılan gizli veriyi yapıştırın. Bu kılavuz token auth kullandığı için `gateway.auth.token`
değerini `openclaw config get gateway.auth.token` ile alın (veya `openclaw doctor --generate-gateway-token` ile oluşturun).
Gateway'i password auth olarak değiştirdiyseniz bunun yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanın.
Cihazları `openclaw devices list` ve `openclaw devices approve <requestId>` ile onaylayın. Emin değilseniz tarayıcınızdan Shelley'yi kullanın!

## Uzak Erişim

Uzak erişim [exe.dev](https://exe.dev)'in kimlik doğrulaması tarafından yönetilir. Varsayılan olarak
8000 portundan gelen HTTP trafiği, e-posta auth ile `https://<vm-name>.exe.xyz`
adresine iletilir.

## Güncelleme

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Kılavuz: [Updating](/install/updating)
