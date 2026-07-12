---
read_when:
    - OpenClaw'u Railway'e Dağıtma
    - Tarayıcı tabanlı Denetim Kullanıcı Arabirimi ile tek tıklamayla buluta dağıtım yapmak istiyorsunuz
summary: Tek tıklamalı şablonla OpenClaw'ı Railway üzerinde dağıtın
title: Railway
x-i18n:
    generated_at: "2026-07-12T11:54:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

OpenClaw'ı tek tıklamalı bir şablonla Railway üzerinde dağıtın ve web Denetim Arayüzü üzerinden erişin. Bu, en kolay "sunucuda terminal gerektirmeyen" yöntemdir: Railway, Gateway'i sizin için çalıştırır.

## Tek tıklamayla dağıtım

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Railway üzerinde dağıt
</a>

<Steps>
  <Step title="Şablonu dağıtın">
    Yukarıdaki **Deploy on Railway** düğmesine tıklayın.
  </Step>

<Step title="Birim ekleyin">
  `/data` konumuna bağlanan bir birim ekleyin (kalıcı durum için gereklidir).
</Step>

  <Step title="Değişkenleri ayarlayın">
    Hizmette gerekli **Variables** değerlerini ayarlayın:

    - `OPENCLAW_GATEWAY_PORT=8080` (gerekli -- Public Networking bölümündeki bağlantı noktasıyla eşleşmelidir)
    - `OPENCLAW_GATEWAY_TOKEN` (gerekli; yönetici gizli bilgisi olarak değerlendirin)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (önerilir)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (önerilir)

  </Step>

<Step title="Genel ağ erişimini etkinleştirin">
  **Public Networking** altında, hizmet için `8080` bağlantı noktasında **HTTP Proxy** seçeneğini etkinleştirin.
</Step>

  <Step title="Bağlanın">
    Genel URL'nizi **Railway -> your service -> Settings -> Domains** konumunda bulun. Bu, oluşturulmuş bir alan adı (genellikle `https://<something>.up.railway.app`) veya eklediğiniz özel alan adı olabilir.

    `https://<your-railway-domain>/openclaw` adresini açın ve yapılandırılmış paylaşılan gizli bilgiyi kullanarak bağlanın. Şablon varsayılan olarak `OPENCLAW_GATEWAY_TOKEN` kullanır; bunu parola kimlik doğrulamasıyla değiştirirseniz onun yerine bu parolayı kullanın.

  </Step>
</Steps>

## Elde edecekleriniz

- Barındırılan OpenClaw Gateway + Denetim Arayüzü
- Railway Volume (`/data`) üzerinden kalıcı depolama; böylece `openclaw.json`, her aracıya özgü `auth-profiles.json`, kanal/sağlayıcı durumu, oturumlar ve çalışma alanı yeniden dağıtımlarda korunur

## Kanal bağlama

Kanal kurulum talimatları için `/openclaw` adresindeki Denetim Arayüzünü kullanın veya Railway kabuğu üzerinden `openclaw onboard` komutunu çalıştırın:

- [Discord](/tr/channels/discord)
- [Telegram](/tr/channels/telegram) (en hızlısı -- yalnızca bir bot belirteci gerekir)
- [Tüm kanallar](/tr/channels)

## Yedeklemeler ve geçiş

Durumunuzu, yapılandırmanızı, kimlik doğrulama profillerinizi ve çalışma alanınızı dışa aktarın:

```bash
openclaw backup create
```

Bu komut, OpenClaw durumu ve yapılandırılmış çalışma alanlarını içeren taşınabilir bir yedekleme arşivi oluşturur. Ayrıntılar için [Yedekleme](/tr/cli/backup) bölümüne bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw'ı güncel tutun: [Güncelleme](/tr/install/updating)
