---
read_when:
    - OpenClaw'ı Railway'e dağıtma
    - Tarayıcı tabanlı Control UI ile tek tıklamalı bir bulut dağıtımı istiyorsunuz
summary: OpenClaw'ı Railway üzerinde tek tıklamalı şablonla dağıtın
title: Railway
x-i18n:
    generated_at: "2026-04-23T09:04:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Railway

OpenClaw'ı Railway üzerinde tek tıklamalı şablonla dağıtın ve web Control UI üzerinden erişin.
Bu, "sunucuda terminal yok" için en kolay yoldur: Gateway'i Railway sizin için çalıştırır.

## Hızlı kontrol listesi (yeni kullanıcılar)

1. Aşağıdaki **Railway'de dağıt** düğmesine tıklayın.
2. `/data` konumuna bağlanan bir **Volume** ekleyin.
3. Gerekli **Variables** değerlerini ayarlayın (en azından `OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_GATEWAY_TOKEN`).
4. `8080` portunda **HTTP Proxy**'yi etkinleştirin.
5. `https://<your-railway-domain>/openclaw` adresini açın ve yapılandırılmış paylaşılan gizli anahtarı kullanarak bağlanın. Bu şablon varsayılan olarak `OPENCLAW_GATEWAY_TOKEN` kullanır; bunu parola kimlik doğrulamasıyla değiştirirseniz onun yerine bu parolayı kullanın.

## Tek tıklamayla dağıtım

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Railway'de dağıt
</a>

Dağıtımdan sonra genel URL'nizi **Railway → hizmetiniz → Settings → Domains** içinde bulun.

Railway ya:

- size oluşturulmuş bir alan adı verir (çoğunlukla `https://<something>.up.railway.app`), veya
- bir tane bağladıysanız özel alan adınızı kullanır.

Ardından şunu açın:

- `https://<your-railway-domain>/openclaw` — Control UI

## Elde ettikleriniz

- Barındırılan OpenClaw Gateway + Control UI
- `openclaw.json`,
  ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu, oturumlar ve
  çalışma alanının yeniden dağıtımlarda kalıcı olması için Railway Volume (`/data`) üzerinden kalıcı depolama

## Gerekli Railway ayarları

### Public Networking

Hizmet için **HTTP Proxy**'yi etkinleştirin.

- Port: `8080`

### Volume (zorunlu)

Şu konuma bağlanan bir volume ekleyin:

- `/data`

### Variables

Hizmet üzerinde şu değişkenleri ayarlayın:

- `OPENCLAW_GATEWAY_PORT=8080` (zorunlu — Public Networking içindeki portla eşleşmelidir)
- `OPENCLAW_GATEWAY_TOKEN` (zorunlu; yönetici sırrı olarak değerlendirin)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (önerilir)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (önerilir)

## Bir kanal bağlayın

Kanal kurulum yönergeleri için `/openclaw` üzerindeki Control UI'yi kullanın veya Railway'nin shell'i üzerinden `openclaw onboard` çalıştırın:

- [Telegram](/tr/channels/telegram) (en hızlısı — yalnızca bir bot token'ı)
- [Discord](/tr/channels/discord)
- [Tüm kanallar](/tr/channels)

## Yedekler ve geçiş

Durumunuzu, yapılandırmanızı, kimlik doğrulama profillerinizi ve çalışma alanınızı dışa aktarın:

```bash
openclaw backup create
```

Bu, OpenClaw durumu ile birlikte yapılandırılmış
çalışma alanını da içeren taşınabilir bir yedek arşivi oluşturur. Ayrıntılar için bkz. [Backup](/tr/cli/backup).

## Sonraki adımlar

- Mesajlaşma kanallarını kurun: [Kanallar](/tr/channels)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw'ı güncel tutun: [Güncelleme](/tr/install/updating)
