---
read_when:
    - Yeni bir makine kurma
    - Kişisel kurulumunuzu bozmadan “en yeni + en iyiyi” istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-04-24T09:32:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
İlk kez kurulum yapıyorsanız [Getting Started](/tr/start/getting-started) ile başlayın.
Onboarding ayrıntıları için bkz. [Onboarding (CLI)](/tr/start/wizard).
</Note>

## TL;DR

Güncellemeleri ne sıklıkla istediğinize ve Gateway'i kendiniz çalıştırmak isteyip istemediğinize göre bir kurulum iş akışı seçin:

- **Kişiselleştirme repo dışında yaşar:** config'inizi ve çalışma alanınızı `~/.openclaw/openclaw.json` ve `~/.openclaw/workspace/` içinde tutun ki repo güncellemeleri onlara dokunmasın.
- **Stable iş akışı (çoğu kişi için önerilir):** macOS uygulamasını kurun ve paketlenmiş Gateway'i onun çalıştırmasına izin verin.
- **En güncel iş akışı (dev):** Gateway'i `pnpm gateway:watch` ile kendiniz çalıştırın, sonra macOS uygulamasının Local modda bağlanmasına izin verin.

## Ön koşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.14+`, hâlâ desteklenir)
- `pnpm` tercih edilir (veya bilerek [Bun workflow](/tr/install/bun) kullanıyorsanız Bun)
- Docker (isteğe bağlı; yalnızca container tabanlı kurulum/e2e için — bkz. [Docker](/tr/install/docker))

## Kişiselleştirme stratejisi (güncellemeler zarar vermesin diye)

“Bana %100 uyarlanmış” _ve_ kolay güncelleme istiyorsanız kişiselleştirmelerinizi burada tutun:

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (Skills, prompt'lar, bellekler; bunu özel bir git reposu yapın)

Bir kez bootstrap yapın:

```bash
openclaw setup
```

Bu repo içinden yerel CLI girişini kullanın:

```bash
openclaw setup
```

Henüz global kurulumunuz yoksa bunu `pnpm openclaw setup` ile çalıştırın (veya Bun iş akışı kullanıyorsanız `bun run openclaw setup`).

## Gateway'i bu repo'dan çalıştırın

`pnpm build` sonrasında paketlenmiş CLI'ı doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stable iş akışı (önce macOS uygulaması)

1. **OpenClaw.app** kurun ve başlatın (menü çubuğu).
2. Onboarding/izin kontrol listesini tamamlayın (TCC istemleri).
3. Gateway'in **Local** olduğundan ve çalıştığından emin olun (uygulama yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Sağlamasını yapın:

```bash
openclaw health
```

Derlemeniz içinde onboarding yoksa:

- `openclaw setup` çalıştırın, sonra `openclaw channels login`, sonra Gateway'i manuel başlatın (`openclaw gateway`).

## En güncel iş akışı (terminalde Gateway)

Amaç: TypeScript Gateway üzerinde çalışmak, hot reload almak, macOS uygulaması UI'ını bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

macOS uygulamasının da en güncel sürümde olmasını istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Geliştirme Gateway'ini başlatın

```bash
pnpm install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw config/çalışma alanını sıfırladıktan sonra)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`, gateway'i watch modunda çalıştırır ve ilgili kaynak,
config ve paketlenmiş-Plugin meta veri değişikliklerinde yeniden yükler.
`pnpm openclaw setup`, yeni bir checkout için tek seferlik yerel config/çalışma alanı başlatma adımıdır.
`pnpm gateway:watch`, `dist/control-ui` yeniden derlemez; bu yüzden `ui/` değişikliklerinden sonra `pnpm ui:build` yeniden çalıştırın veya Control UI geliştirirken `pnpm ui:dev` kullanın.

Bun iş akışını bilerek kullanıyorsanız eşdeğer komutlar şunlardır:

```bash
bun install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw config/çalışma alanını sıfırladıktan sonra)
bun run openclaw setup
bun run gateway:watch
```

### 2) macOS uygulamasını çalışan Gateway'inize yönlendirin

**OpenClaw.app** içinde:

- Connection Mode: **Local**
  Uygulama, yapılandırılmış porttaki çalışan gateway'e bağlanır.

### 3) Doğrulayın

- Uygulama içindeki Gateway durumu **“Using existing gateway …”** olarak görünmelidir
- Veya CLI ile:

```bash
openclaw health
```

### Yaygın tuzaklar

- **Yanlış port:** Gateway WS varsayılanı `ws://127.0.0.1:18789`; uygulama + CLI aynı portu kullanmalıdır.
- **Durumun yaşadığı yer:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Kimlik doğrulamayı hata ayıklarken veya neyi yedekleyeceğinize karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token'ı**: config/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink'ler reddedilir)
- **Discord bot token'ı**: config/env veya SecretRef (env/file/exec sağlayıcıları)
- **Slack token'ları**: config/env (`channels.slack.*`)
- **Pairing allowlist'leri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model auth profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli secret payload'u (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarma**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Security](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` alanlarını “sizin şeyleriniz” olarak tutun; kişisel prompt/config'leri `openclaw` reposuna koymayın.
- Kaynağı güncelleme: `git pull` + seçtiğiniz paket yöneticisi kurulum adımı (varsayılan `pnpm install`; Bun iş akışı için `bun install`) + eşleşen `gateway:watch` komutunu kullanmaya devam edin.

## Linux (systemd kullanıcı hizmeti)

Linux kurulumları bir systemd **kullanıcı** hizmeti kullanır. Varsayılan olarak systemd, çıkışta/boşta
kullanıcı hizmetlerini durdurur; bu da Gateway'i kapatır. Onboarding sizin için
lingering'i etkinleştirmeye çalışır (sudo isteyebilir). Hâlâ kapalıysa şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Her zaman açık veya çok kullanıcılı sunucular için, kullanıcı hizmeti yerine bir **sistem** hizmeti düşünün
(lingering gerekmez). Systemd notları için bkz. [Gateway runbook](/tr/gateway).

## İlgili belgeler

- [Gateway runbook](/tr/gateway) (bayraklar, denetim, portlar)
- [Gateway configuration](/tr/gateway/configuration) (config şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + `replyToMode` ayarları)
- [OpenClaw assistant setup](/tr/start/openclaw)
- [macOS app](/tr/platforms/macos) (gateway yaşam döngüsü)
