---
read_when:
    - Yeni bir makine kurma
    - Kişisel kurulumunuzu bozmadan "en yeni + en iyisini" istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-05-06T09:31:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
İlk kez kurulum yapıyorsanız [Başlarken](/tr/start/getting-started) ile başlayın.
İlk kullanım ayarları ayrıntıları için bkz. [İlk Kullanım (CLI)](/tr/start/wizard).
</Note>

## Kısaca

Güncellemeleri ne sıklıkla istediğinize ve Gateway’i kendiniz çalıştırmak isteyip istemediğinize göre bir kurulum iş akışı seçin:

- **Kişiselleştirme repo dışında yaşar:** yapılandırmanızı ve çalışma alanınızı `~/.openclaw/openclaw.json` ve `~/.openclaw/workspace/` içinde tutun; böylece repo güncellemeleri bunlara dokunmaz.
- **Kararlı iş akışı (çoğu kişi için önerilir):** macOS uygulamasını yükleyin ve paketlenmiş Gateway’i onun çalıştırmasına izin verin.
- **En yeni iş akışı (dev):** Gateway’i `pnpm gateway:watch` ile kendiniz çalıştırın, ardından macOS uygulamasının Yerel modda bağlanmasına izin verin.

## Önkoşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.14+`, hâlâ destekleniyor)
- Kaynak checkout’ları için `pnpm` gereklidir. OpenClaw, dev modunda paketlenmiş pluginleri
  `extensions/*` pnpm çalışma alanı paketlerinden yükler; bu nedenle kökte `npm install`
  komutu tam kaynak ağacını hazırlamaz.
- Docker (isteğe bağlı; yalnızca container tabanlı kurulum/e2e için - bkz. [Docker](/tr/install/docker))

## Kişiselleştirme stratejisi (güncellemeler sorun çıkarmasın diye)

"Tamamen bana göre" _ve_ kolay güncelleme istiyorsanız özelleştirmenizi şuralarda tutun:

- **Yapılandırma:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (skills, istemler, anılar; bunu özel bir git reposu yapın)

Bir kez başlatın:

```bash
openclaw setup
```

Bu repo içinden yerel CLI girişini kullanın:

```bash
openclaw setup
```

Henüz global kurulumunuz yoksa `pnpm openclaw setup` ile çalıştırın.

## Gateway’i bu repodan çalıştırma

`pnpm build` sonrasında paketlenmiş CLI’yi doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app**’i yükleyin ve başlatın (menü çubuğu).
2. İlk kullanım/izinler kontrol listesini tamamlayın (TCC istemleri).
3. Gateway’in **Yerel** olduğundan ve çalıştığından emin olun (uygulama bunu yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Sağlık kontrolü yapın:

```bash
openclaw health
```

İlk kullanım akışı derlemenizde yoksa:

- `openclaw setup` çalıştırın, ardından `openclaw channels login` çalıştırın, sonra Gateway’i elle başlatın (`openclaw gateway`).

## En yeni iş akışı (Gateway terminalde)

Amaç: TypeScript Gateway üzerinde çalışmak, sıcak yeniden yükleme almak, macOS uygulama UI’ını bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

macOS uygulamasını da en yeni sürümde kullanmak istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Dev Gateway’i başlatın

```bash
pnpm install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw yapılandırmasını/çalışma alanını sıfırladıktan sonra)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`, Gateway izleme sürecini adlandırılmış bir tmux
oturumunda başlatır veya yeniden başlatır ve etkileşimli terminallerden otomatik bağlanır. Etkileşimli olmayan kabuklar
ayrık kalır ve `tmux attach -t openclaw-gateway-watch-main` yazdırır; etkileşimli bir çalıştırmayı
ayrık tutmak için `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` kullanın
veya ön plan izleme modu için `pnpm gateway:watch:raw` kullanın. İzleyici,
ilgili kaynak, yapılandırma ve paketlenmiş-plugin meta veri değişikliklerinde yeniden yükler. İzlenen
Gateway başlangıç sırasında çıkarsa `gateway:watch`, `openclaw doctor --fix --non-interactive`
komutunu bir kez çalıştırır ve yeniden dener; bu yalnızca dev amaçlı onarım geçişini devre dışı bırakmak için
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` ayarlayın.
`pnpm openclaw setup`, taze bir checkout için tek seferlik yerel yapılandırma/çalışma alanı başlatma adımıdır.
`pnpm gateway:watch`, `dist/control-ui` öğesini yeniden derlemez; bu nedenle `ui/` değişikliklerinden sonra `pnpm ui:build` komutunu yeniden çalıştırın veya Control UI geliştirirken `pnpm ui:dev` kullanın.

### 2) macOS uygulamasını çalışan Gateway’inize yönlendirin

**OpenClaw.app** içinde:

- Bağlantı Modu: **Yerel**
  Uygulama, yapılandırılmış porttaki çalışan gateway’e bağlanır.

### 3) Doğrulayın

- Uygulama içi Gateway durumu **"Mevcut gateway kullanılıyor …"** olarak görünmelidir
- Veya CLI ile:

```bash
openclaw health
```

### Yaygın tuzaklar

- **Yanlış port:** Gateway WS varsayılanı `ws://127.0.0.1:18789`; uygulama + CLI aynı portta kalsın.
- **Durumun bulunduğu yer:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Kimlik doğrulama hata ayıklarken veya neleri yedekleyeceğinize karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token’ı**: yapılandırma/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink’ler reddedilir)
- **Discord bot token’ı**: yapılandırma/env veya SecretRef (env/file/exec sağlayıcıları)
- **Slack token’ları**: yapılandırma/env (`channels.slack.*`)
- **Eşleştirme izin listeleri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model kimlik doğrulama profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli gizli bilgi yükü (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarımı**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` öğelerini "size ait şeyler" olarak tutun; kişisel istemleri/yapılandırmayı `openclaw` reposuna koymayın.
- Kaynağı güncelleme: `git pull` + `pnpm install` + `pnpm gateway:watch` kullanmaya devam edin.

## Linux (systemd kullanıcı servisi)

Linux kurulumları bir systemd **kullanıcı** servisi kullanır. Varsayılan olarak systemd, oturum kapatma/boşta kalma durumunda kullanıcı
servislerini durdurur; bu da Gateway’i sonlandırır. İlk kullanım akışı sizin için
kalıcılığı etkinleştirmeyi dener (sudo isteyebilir). Hâlâ kapalıysa şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Her zaman açık veya çok kullanıcılı sunucular için kullanıcı servisi yerine bir **sistem**
servisi düşünün (kalıcılık gerekmez). systemd notları için bkz. [Gateway çalışma kılavuzu](/tr/gateway).

## İlgili belgeler

- [Gateway çalışma kılavuzu](/tr/gateway) (bayraklar, gözetim, portlar)
- [Gateway yapılandırması](/tr/gateway/configuration) (yapılandırma şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw asistan kurulumu](/tr/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (gateway yaşam döngüsü)
