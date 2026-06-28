---
read_when:
    - Yeni bir makine ayarlama
    - En yeni ve en iyisini, kişisel kurulumunuzu bozmadan istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-06-28T01:19:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
İlk kez kurulum yapıyorsanız [Başlarken](/tr/start/getting-started) ile başlayın.
İlk katılım ayrıntıları için bkz. [İlk katılım (CLI)](/tr/start/wizard).
</Note>

## TL;DR

Güncellemeleri ne sıklıkta istediğinize ve Gateway'i kendiniz çalıştırmak isteyip istemediğinize göre bir kurulum iş akışı seçin:

- **Özelleştirme repo dışında yaşar:** yapılandırmanızı ve çalışma alanınızı `~/.openclaw/openclaw.json` ve `~/.openclaw/workspace/` içinde tutun; böylece repo güncellemeleri bunlara dokunmaz.
- **Kararlı iş akışı (çoğu kişi için önerilir):** macOS uygulamasını kurun ve paketlenmiş Gateway'i çalıştırmasına izin verin.
- **En yeni iş akışı (dev):** Gateway'i `pnpm gateway:watch` ile kendiniz çalıştırın, ardından macOS uygulamasının Local modda bağlanmasına izin verin.

## Önkoşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.19+`, hâlâ desteklenir)
- Kaynak checkout'ları için `pnpm` gerekir. OpenClaw, dev modunda paketlenmiş plugin'leri
  `extensions/*` pnpm çalışma alanı paketlerinden yükler; bu nedenle kökte `npm install`
  tam kaynak ağacını hazırlamaz.
- Docker (isteğe bağlı; yalnızca konteynerleştirilmiş kurulum/e2e için - bkz. [Docker](/tr/install/docker))

## Özelleştirme stratejisi (güncellemeler sorun çıkarmasın diye)

"%100 bana göre özelleştirilmiş" _ve_ kolay güncellemeler istiyorsanız, özelleştirmelerinizi şurada tutun:

- **Yapılandırma:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (skills, istemler, bellekler; bunu özel bir git reposu yapın)

Bir kez önyükleyin:

```bash
openclaw setup
```

Bu repo içinden yerel CLI girişini kullanın:

```bash
openclaw setup
```

Henüz global kurulumunuz yoksa `pnpm openclaw setup` ile çalıştırın.

## Gateway'i bu repodan çalıştırın

`pnpm build` sonrasında paketlenmiş CLI'yi doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app**'i (menü çubuğu) kurun ve başlatın.
2. İlk katılım/izinler kontrol listesini tamamlayın (TCC istemleri).
3. Gateway'in **Local** olduğundan ve çalıştığından emin olun (uygulama yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Sağlamlık kontrolü:

```bash
openclaw health
```

İlk katılım derlemenizde mevcut değilse:

- `openclaw setup` çalıştırın, ardından `openclaw channels login` çalıştırın, sonra Gateway'i manuel başlatın (`openclaw gateway`).

## En yeni iş akışı (Gateway bir terminalde)

Hedef: TypeScript Gateway üzerinde çalışmak, hot reload almak, macOS uygulama UI'ını bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

macOS uygulamasını da en yeni sürümde istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Dev Gateway'i başlatın

```bash
pnpm install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw yapılandırmasını/çalışma alanını sıfırladıktan sonra)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`, Gateway izleme sürecini adlandırılmış bir tmux
oturumunda başlatır veya yeniden başlatır ve etkileşimli terminallerden otomatik bağlanır. Etkileşimsiz shell'ler
ayrık kalır ve `tmux attach -t openclaw-gateway-watch-main` yazdırır; etkileşimli bir çalıştırmayı
ayrık tutmak için `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` kullanın
veya foreground izleme modu için `pnpm gateway:watch:raw` kullanın. İzleyici
ilgili kaynak, yapılandırma ve paketlenmiş plugin meta verisi değişikliklerinde yeniden yükler. İzlenen
Gateway başlangıç sırasında çıkarsa, `gateway:watch`
`openclaw doctor --fix --non-interactive` komutunu bir kez çalıştırır ve yeniden dener; bu yalnızca dev'e özel onarım geçişini devre dışı bırakmak için
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` ayarlayın.
`pnpm openclaw setup`, yeni bir checkout için tek seferlik yerel yapılandırma/çalışma alanı başlatma adımıdır.
`pnpm gateway:watch`, `dist/control-ui`'ı yeniden derlemez; bu nedenle `ui/` değişikliklerinden sonra `pnpm ui:build` komutunu yeniden çalıştırın veya Control UI geliştirirken `pnpm ui:dev` kullanın.

### 2) macOS uygulamasını çalışan Gateway'inize yönlendirin

**OpenClaw.app** içinde:

- Bağlantı Modu: **Local**
  Uygulama, yapılandırılmış porttaki çalışan gateway'e bağlanır.

### 3) Doğrulayın

- Uygulama içi Gateway durumu **"Mevcut gateway kullanılıyor …"** olarak görünmelidir
- Veya CLI ile:

```bash
openclaw health
```

### Yaygın tuzaklar

- **Yanlış port:** Gateway WS varsayılanı `ws://127.0.0.1:18789`; uygulama + CLI'yi aynı portta tutun.
- **Durumun nerede yaşadığı:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Kimlik doğrulamayı hata ayıklarken veya nelerin yedekleneceğine karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token'ı**: config/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir)
- **Discord bot token'ı**: config/env veya SecretRef (env/file/exec sağlayıcıları)
- **Slack token'ları**: config/env (`channels.slack.*`)
- **Eşleştirme izin listeleri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model kimlik doğrulama profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli gizli bilgi payload'ı (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarma**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` konumlarını "size ait şeyler" olarak tutun; kişisel istemleri/yapılandırmayı `openclaw` reposuna koymayın.
- Kaynağı güncelleme: `git pull` + `pnpm install` + `pnpm gateway:watch` kullanmaya devam edin.

## Linux (systemd kullanıcı servisi)

Linux kurulumları systemd **kullanıcı** servisi kullanır. Varsayılan olarak systemd, oturum kapatma/boşta kalma durumunda kullanıcı
servislerini durdurur; bu da Gateway'i sonlandırır. İlk katılım sizin için
lingering'i etkinleştirmeyi dener (sudo isteyebilir). Hâlâ kapalıysa şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Her zaman açık veya çok kullanıcılı sunucular için kullanıcı servisi yerine
**sistem** servisini düşünün (lingering gerekmez). systemd notları için bkz. [Gateway runbook](/tr/gateway).

## İlgili dokümanlar

- [Gateway runbook](/tr/gateway) (bayraklar, gözetim, portlar)
- [Gateway yapılandırması](/tr/gateway/configuration) (yapılandırma şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw assistant kurulumu](/tr/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (gateway yaşam döngüsü)
