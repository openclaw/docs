---
read_when:
    - Gateway için ucuz, her zaman açık bir Linux ana bilgisayar istiyorsunuz
    - Kendi VPS'inizi çalıştırmadan uzak Control UI erişimi istiyorsunuz
summary: OpenClaw Gateway'i exe.dev üzerinde çalıştırın (uzak erişim için VM + HTTPS proxy)
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T09:15:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

Amaç: OpenClaw Gateway'in bir exe.dev VM'inde çalışması ve dizüstü bilgisayarınızdan şu adres üzerinden erişilebilir olması: `https://<vm-name>.exe.xyz`

Bu sayfa, exe.dev'in varsayılan **exeuntu** imajını varsayar. Farklı bir dağıtım seçtiyseniz paketleri buna göre eşleyin.

## Başlangıç için hızlı yol

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Gerekli kimlik doğrulama anahtarınızı/belirtecinizi girin
3. VM'inizin yanındaki "Agent" seçeneğine tıklayın ve Shelley'nin hazırlığı tamamlamasını bekleyin
4. `https://<vm-name>.exe.xyz/` adresini açın ve yapılandırılmış paylaşılan gizli bilgiyle kimlik doğrulayın (bu rehber varsayılan olarak token kimlik doğrulaması kullanır, ancak `gateway.auth.mode` değiştirirseniz parola kimlik doğrulaması da çalışır)
5. Bekleyen cihaz Pairing isteklerini `openclaw devices approve <requestId>` ile onaylayın

## İhtiyacınız olanlar

- exe.dev hesabı
- [exe.dev](https://exe.dev) sanal makinelerine `ssh exe.dev` erişimi (isteğe bağlı)

## Shelley ile otomatik kurulum

[exe.dev](https://exe.dev)'in ajanı Shelley, bizim
istemimizi kullanarak OpenClaw'ı anında kurabilir. Kullanılan istem aşağıdadır:

```
Bu VM üzerinde OpenClaw'ı (https://docs.openclaw.ai/install) kur. OpenClaw onboarding için non-interactive ve accept-risk bayraklarını kullan. Gerektiğinde sağlanan kimlik doğrulamayı veya belirteci ekle. nginx'i, varsayılan etkin site yapılandırmasında varsayılan 18789 portundan kök konuma yönlendirecek şekilde yapılandır; WebSocket desteğini etkinleştirdiğinden emin ol. Pairing işlemi "openclaw devices list" ve "openclaw devices approve <request id>" ile yapılır. Panoda OpenClaw sağlığının OK göründüğünden emin ol. exe.dev, bizim için 8000 portundan 80/443 portlarına yönlendirmeyi ve HTTPS'i hallediyor, bu yüzden son "reachable" değeri port belirtilmeden <vm-name>.exe.xyz olmalıdır.
```

## Elle kurulum

## 1) VM'i oluşturun

Cihazınızdan:

```bash
ssh exe.dev new
```

Ardından bağlanın:

```bash
ssh <vm-name>.exe.xyz
```

İpucu: bu VM'i **durumlu** tutun. OpenClaw; `openclaw.json`, ajan başına
`auth-profiles.json`, oturumlar ve kanal/sağlayıcı durumunu
`~/.openclaw/` altında; çalışma alanını ise `~/.openclaw/workspace/` altında saklar.

## 2) Önkoşulları kurun (VM üzerinde)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw'ı kurun

OpenClaw kurulum betiğini çalıştırın:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) OpenClaw'ı 8000 portuna proxy'lemek için nginx'i ayarlayın

`/etc/nginx/sites-enabled/default` dosyasını şununla düzenleyin:

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
OpenClaw, yönlendirilmiş IP meta verilerine yalnızca açıkça yapılandırılmış proxy'lerden güvenir
ve ekleme tarzı `X-Forwarded-For` zincirleri sağlamlaştırma riski olarak değerlendirilir.

## 5) OpenClaw'a erişin ve yetkileri verin

`https://<vm-name>.exe.xyz/` adresine erişin (onboarding sırasında Control UI çıktısına bakın). Kimlik doğrulama isterse
VM'deki yapılandırılmış paylaşılan gizli bilgiyi yapıştırın. Bu rehber token kimlik doğrulaması kullandığı için `gateway.auth.token`
değerini `openclaw config get gateway.auth.token` ile alın (veya `openclaw doctor --generate-gateway-token` ile bir tane oluşturun).
Gateway'i parola kimlik doğrulamasına geçirdiyseniz bunun yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanın.
Cihazları `openclaw devices list` ve `openclaw devices approve <requestId>` ile onaylayın. Emin değilseniz tarayıcınızdan Shelley'yi kullanın!

## Uzak Erişim

Uzak erişim [exe.dev](https://exe.dev)'in kimlik doğrulaması tarafından yönetilir. Varsayılan olarak
8000 portundan gelen HTTP trafiği e-posta kimlik doğrulamasıyla `https://<vm-name>.exe.xyz`
adresine yönlendirilir.

## Güncelleme

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Rehber: [Güncelleme](/tr/install/updating)

## İlgili

- [Uzak Gateway](/tr/gateway/remote)
- [Kuruluma genel bakış](/tr/install)
