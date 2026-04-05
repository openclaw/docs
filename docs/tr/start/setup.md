---
read_when:
    - Yeni bir makine kuruyorsunuz
    - Kişisel kurulumunuzu bozmadan “en yeni + en iyi”yi istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-04-05T14:09:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# Kurulum

<Note>
İlk kez kurulum yapıyorsanız, [Başlarken](/start/getting-started) ile başlayın.
Onboarding ayrıntıları için bkz. [Onboarding (CLI)](/start/wizard).
</Note>

## Kısaca

- **Özelleştirme repo dışında yaşar:** `~/.openclaw/workspace` (çalışma alanı) + `~/.openclaw/openclaw.json` (yapılandırma).
- **Kararlı iş akışı:** macOS uygulamasını yükleyin; paketlenmiş Gateway'i onun çalıştırmasına izin verin.
- **En güncel iş akışı:** Gateway'i `pnpm gateway:watch` ile kendiniz çalıştırın, ardından macOS uygulamasının Yerel modda bağlanmasına izin verin.

## Önkoşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.14+`, hâlâ destekleniyor)
- `pnpm` tercih edilir (veya [Bun iş akışı](/tr/install/bun) ile bilinçli olarak çalışıyorsanız Bun)
- Docker (isteğe bağlı; yalnızca container tabanlı kurulum/e2e için — bkz. [Docker](/tr/install/docker))

## Özelleştirme stratejisi (güncellemeler zarar vermesin diye)

Eğer “%100 bana özel” _ve_ kolay güncellemeler istiyorsanız, özelleştirmelerinizi şurada tutun:

- **Yapılandırma:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (skills, istemler, anılar; bunu özel bir git reposu yapın)

Bir kez önyükleyin:

```bash
openclaw setup
```

Bu reponun içinden, yerel CLI girişini kullanın:

```bash
openclaw setup
```

Henüz global kurulumunuz yoksa, bunu `pnpm openclaw setup` ile çalıştırın (veya Bun iş akışını kullanıyorsanız `bun run openclaw setup`).

## Gateway'i bu repodan çalıştırın

`pnpm build` sonrasında paketlenmiş CLI'yi doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app** uygulamasını yükleyin ve başlatın (menü çubuğu).
2. Onboarding/izinler denetim listesini tamamlayın (TCC istemleri).
3. Gateway'in **Yerel** modda ve çalışır durumda olduğundan emin olun (uygulama bunu yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Hızlı sağlık kontrolü:

```bash
openclaw health
```

Eğer build'inizde onboarding mevcut değilse:

- `openclaw setup` çalıştırın, sonra `openclaw channels login` çalıştırın, ardından Gateway'i manuel olarak başlatın (`openclaw gateway`).

## En güncel iş akışı (terminalde Gateway)

Amaç: TypeScript Gateway üzerinde çalışmak, hot reload almak, macOS uygulaması UI'ının bağlı kalmasını sağlamak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

Eğer macOS uygulamasının da en güncel sürümde olmasını istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Geliştirme Gateway'ini başlatın

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch`, gateway'i watch modunda çalıştırır ve ilgili kaynak,
yapılandırma ve paketlenmiş eklenti meta veri değişikliklerinde yeniden yükler.

Bun iş akışını bilinçli olarak kullanıyorsanız, eşdeğer komutlar şunlardır:

```bash
bun install
bun run gateway:watch
```

### 2) macOS uygulamasını çalışan Gateway'inize yönlendirin

**OpenClaw.app** içinde:

- Bağlantı Modu: **Yerel**
  Uygulama, yapılandırılmış port üzerindeki çalışan gateway'e bağlanacaktır.

### 3) Doğrulayın

- Uygulama içi Gateway durumu **“Mevcut gateway kullanılıyor …”** olarak görünmelidir
- Veya CLI üzerinden:

```bash
openclaw health
```

### Sık yapılan hatalar

- **Yanlış port:** Gateway WS varsayılanı `ws://127.0.0.1:18789`; uygulama + CLI aynı portu kullanmalıdır.
- **Durumun yaşadığı yer:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Bunu, kimlik doğrulamada hata ayıklarken veya neyi yedekleyeceğinize karar verirken kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token'ı**: config/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink'ler reddedilir)
- **Discord bot token'ı**: config/env veya SecretRef (env/file/exec sağlayıcıları)
- **Slack token'ları**: config/env (`channels.slack.*`)
- **Eşleştirme izin listeleri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model kimlik doğrulama profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli secret yükü (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarma**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` dizinlerini “sizin şeyleriniz” olarak tutun; kişisel istemlerinizi/yapılandırmalarınızı `openclaw` reposuna koymayın.
- Kaynağı güncelleme: `git pull` + seçtiğiniz paket yöneticisi kurulum adımı (varsayılan olarak `pnpm install`; Bun iş akışı için `bun install`) + eşleşen `gateway:watch` komutunu kullanmaya devam edin.

## Linux (systemd kullanıcı hizmeti)

Linux kurulumları bir systemd **kullanıcı** hizmeti kullanır. Varsayılan olarak systemd, çıkış yapıldığında/boştayken kullanıcı
hizmetlerini durdurur; bu da Gateway'i sonlandırır. Onboarding, lingering'i sizin için etkinleştirmeye çalışır
(`sudo` isteyebilir). Hâlâ kapalıysa, şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Sürekli açık veya çok kullanıcılı sunucular için, kullanıcı hizmeti yerine bir **sistem** hizmeti düşünün
(linger gerekmez). systemd notları için [Gateway runbook](/tr/gateway) sayfasına bakın.

## İlgili belgeler

- [Gateway runbook](/tr/gateway) (bayraklar, denetim, portlar)
- [Gateway yapılandırması](/tr/gateway/configuration) (yapılandırma şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw asistan kurulumu](/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (gateway yaşam döngüsü)
