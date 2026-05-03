---
read_when:
    - Yeni bir makine kurma
    - Kişisel kurulumunuzu bozmadan “en yeni + en iyi” olanı istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-05-03T21:38:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
İlk kez kurulum yapıyorsanız [Başlarken](/tr/start/getting-started) ile başlayın.
Katılım ayrıntıları için bkz. [Katılım (CLI)](/tr/start/wizard).
</Note>

## TL;DR

Güncellemeleri ne kadar sık istediğinize ve Gateway’i kendiniz çalıştırmak isteyip istemediğinize göre bir kurulum iş akışı seçin:

- **Özelleştirme repo dışında yaşar:** yapılandırmanızı ve çalışma alanınızı `~/.openclaw/openclaw.json` ve `~/.openclaw/workspace/` içinde tutun, böylece repo güncellemeleri bunlara dokunmaz.
- **Kararlı iş akışı (çoğu kişi için önerilir):** macOS uygulamasını kurun ve paketlenmiş Gateway’i onun çalıştırmasına izin verin.
- **En yeni geliştirme iş akışı (dev):** Gateway’i `pnpm gateway:watch` ile kendiniz çalıştırın, ardından macOS uygulamasının Local modunda bağlanmasına izin verin.

## Ön koşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.14+`, hâlâ desteklenir)
- Kaynak checkout’ları için `pnpm` gerekir. OpenClaw, geliştirme modunda paketlenmiş plugin’leri
  `extensions/*` pnpm workspace paketlerinden yükler, bu yüzden kökte `npm install`
  tam kaynak ağacını hazırlamaz.
- Docker (isteğe bağlı; yalnızca container tabanlı kurulum/e2e için — bkz. [Docker](/tr/install/docker))

## Özelleştirme stratejisi (güncellemeler sorun çıkarmasın diye)

“%100 bana özel” _ve_ kolay güncellemeler istiyorsanız, özelleştirmelerinizi şurada tutun:

- **Yapılandırma:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (skills, istemler, bellekler; bunu özel bir git reposu yapın)

Bir kez başlatın:

```bash
openclaw setup
```

Bu reponun içinden yerel CLI girişini kullanın:

```bash
openclaw setup
```

Henüz global kurulumunuz yoksa `pnpm openclaw setup` ile çalıştırın.

## Gateway’i bu repodan çalıştırma

`pnpm build` sonrasında paketlenmiş CLI’ı doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app**’i kurun ve başlatın (menü çubuğu).
2. Katılım/izinler kontrol listesini tamamlayın (TCC istemleri).
3. Gateway’in **Local** olduğundan ve çalıştığından emin olun (uygulama bunu yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Sağlık kontrolü:

```bash
openclaw health
```

Katılım derlemenizde kullanılabilir değilse:

- `openclaw setup` çalıştırın, ardından `openclaw channels login` çalıştırın, sonra Gateway’i elle başlatın (`openclaw gateway`).

## En yeni geliştirme iş akışı (Gateway terminalde)

Amaç: TypeScript Gateway üzerinde çalışmak, hot reload almak, macOS uygulama UI’ını bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

macOS uygulamasını da en yeni geliştirme durumunda istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Geliştirme Gateway’ini başlatın

```bash
pnpm install
# Yalnızca ilk çalıştırma (veya yerel OpenClaw yapılandırması/çalışma alanı sıfırlandıktan sonra)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`, Gateway izleme sürecini adlandırılmış bir tmux
oturumunda başlatır veya yeniden başlatır ve etkileşimli terminallerden otomatik bağlanır. Etkileşimsiz shell’ler
ayrık kalır ve `tmux attach -t openclaw-gateway-watch-main` yazdırır; etkileşimli bir çalıştırmayı
ayrık tutmak için `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` kullanın
veya foreground izleme modu için `pnpm gateway:watch:raw` kullanın. İzleyici,
ilgili kaynak, yapılandırma ve paketlenmiş plugin metadata değişikliklerinde yeniden yükler. İzlenen
Gateway başlangıç sırasında çıkarsa, `gateway:watch`
`openclaw doctor --fix --non-interactive` komutunu bir kez çalıştırır ve yeniden dener; bu yalnızca geliştirme amaçlı onarım geçişini devre dışı bırakmak için
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` ayarlayın.
`pnpm openclaw setup`, yeni bir checkout için tek seferlik yerel yapılandırma/çalışma alanı başlatma adımıdır.
`pnpm gateway:watch`, `dist/control-ui` öğesini yeniden derlemez; bu nedenle `ui/` değişikliklerinden sonra `pnpm ui:build` komutunu yeniden çalıştırın veya Control UI geliştirirken `pnpm ui:dev` kullanın.

### 2) macOS uygulamasını çalışan Gateway’inize yönlendirin

**OpenClaw.app** içinde:

- Bağlantı Modu: **Local**
  Uygulama, yapılandırılan porttaki çalışan gateway’e bağlanır.

### 3) Doğrulayın

- Uygulama içi Gateway durumu **“Mevcut gateway kullanılıyor …”** şeklinde görünmelidir
- Veya CLI ile:

```bash
openclaw health
```

### Yaygın tuzaklar

- **Yanlış port:** Gateway WS varsayılanı `ws://127.0.0.1:18789`; uygulama + CLI aynı portta kalsın.
- **Durumun yaşadığı yer:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Kimlik doğrulamayı hata ayıklarken veya neyin yedekleneceğine karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token’ı**: yapılandırma/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink’ler reddedilir)
- **Discord bot token’ı**: yapılandırma/env veya SecretRef (env/file/exec sağlayıcıları)
- **Slack token’ları**: yapılandırma/env (`channels.slack.*`)
- **Eşleştirme izin listeleri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model kimlik doğrulama profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli secrets payload’u (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarımı**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` öğelerini “size ait şeyler” olarak tutun; kişisel istemleri/yapılandırmayı `openclaw` reposuna koymayın.
- Kaynağı güncelleme: `git pull` + `pnpm install` + `pnpm gateway:watch` kullanmaya devam edin.

## Linux (systemd kullanıcı servisi)

Linux kurulumları bir systemd **kullanıcı** servisi kullanır. Varsayılan olarak systemd, çıkış/boşta kalma durumunda kullanıcı
servislerini durdurur; bu da Gateway’i öldürür. Katılım sizin için
lingering’i etkinleştirmeyi dener (sudo isteyebilir). Hâlâ kapalıysa şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Her zaman açık veya çok kullanıcılı sunucular için bir
kullanıcı servisi yerine **sistem** servisi düşünün (lingering gerekmez). systemd notları için [Gateway runbook](/tr/gateway) bölümüne bakın.

## İlgili dokümanlar

- [Gateway runbook](/tr/gateway) (bayraklar, gözetim, portlar)
- [Gateway yapılandırması](/tr/gateway/configuration) (yapılandırma şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw asistan kurulumu](/tr/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (gateway yaşam döngüsü)
