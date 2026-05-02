---
read_when:
    - Yeni bir makine kurulumu
    - Kişisel kurulumunuzu bozmadan “en yeni + en iyi” olanı istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-05-02T09:06:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
İlk kez kurulum yapıyorsanız [Başlarken](/tr/start/getting-started) ile başlayın.
Onboarding ayrıntıları için bkz. [Onboarding (CLI)](/tr/start/wizard).
</Note>

## Kısaca

Güncellemeleri ne sıklıkla istediğinize ve Gateway'i kendiniz çalıştırmak isteyip istemediğinize göre bir kurulum iş akışı seçin:

- **Özelleştirme depo dışında yaşar:** yapılandırmanızı ve çalışma alanınızı `~/.openclaw/openclaw.json` ve `~/.openclaw/workspace/` içinde tutun, böylece depo güncellemeleri bunlara dokunmaz.
- **Kararlı iş akışı (çoğu kişi için önerilir):** macOS uygulamasını kurun ve paketle gelen Gateway'i onun çalıştırmasına izin verin.
- **En yeni iş akışı (dev):** Gateway'i `pnpm gateway:watch` ile kendiniz çalıştırın, ardından macOS uygulamasının Yerel modda bağlanmasına izin verin.

## Önkoşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.14+`, hâlâ desteklenir)
- Kaynak çıkışları için `pnpm` gerekir. OpenClaw, geliştirme modunda pakete dahil Plugin'leri
  `extensions/*` pnpm çalışma alanı paketlerinden yükler; bu nedenle kökte `npm install`
  tam kaynak ağacını hazırlamaz.
- Docker (isteğe bağlı; yalnızca konteynerleştirilmiş kurulum/e2e için — bkz. [Docker](/tr/install/docker))

## Özelleştirme stratejisi (güncellemeler sorun çıkarmasın diye)

“%100 bana göre özelleştirilmiş” _ve_ kolay güncellenebilir bir kurulum istiyorsanız, özelleştirmelerinizi şurada tutun:

- **Yapılandırma:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (skills, istemler, bellekler; bunu özel bir git deposu yapın)

Bir kez önyükleyin:

```bash
openclaw setup
```

Bu deponun içinden yerel CLI girişini kullanın:

```bash
openclaw setup
```

Henüz genel bir kurulumunuz yoksa `pnpm openclaw setup` üzerinden çalıştırın.

## Gateway'i bu depodan çalıştırma

`pnpm build` sonrasında paketlenmiş CLI'yi doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app** uygulamasını kurun ve başlatın (menü çubuğu).
2. Onboarding/izinler kontrol listesini tamamlayın (TCC istemleri).
3. Gateway'in **Yerel** olduğundan ve çalıştığından emin olun (uygulama bunu yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Hızlı kontrol yapın:

```bash
openclaw health
```

Derlemenizde onboarding mevcut değilse:

- `openclaw setup` çalıştırın, ardından `openclaw channels login` çalıştırın, sonra Gateway'i elle başlatın (`openclaw gateway`).

## En yeni iş akışı (Gateway bir terminalde)

Amaç: TypeScript Gateway üzerinde çalışmak, hot reload almak ve macOS uygulaması UI'sını bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

macOS uygulamasını da en yeni sürümde istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Geliştirme Gateway'ini başlatın

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`, Gateway izleme sürecini adlandırılmış bir tmux
oturumunda başlatır veya yeniden başlatır ve etkileşimli terminallerden otomatik bağlanır. Etkileşimsiz kabuklar bağlı kalmaz
ve `tmux attach -t openclaw-gateway-watch-main` yazdırır; etkileşimli bir çalıştırmayı
bağlı olmadan tutmak için `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` kullanın
veya ön plan izleme modu için `pnpm gateway:watch:raw` kullanın. İzleyici,
ilgili kaynak, yapılandırma ve pakete dahil Plugin meta verisi değişikliklerinde yeniden yükler.
`pnpm openclaw setup`, yeni bir çıkış için tek seferlik yerel yapılandırma/çalışma alanı başlatma adımıdır.
`pnpm gateway:watch`, `dist/control-ui` öğesini yeniden derlemez; bu nedenle `ui/` değişikliklerinden sonra `pnpm ui:build` komutunu yeniden çalıştırın veya Control UI geliştirirken `pnpm ui:dev` kullanın.

### 2) macOS uygulamasını çalışan Gateway'inize yönlendirin

**OpenClaw.app** içinde:

- Bağlantı Modu: **Yerel**
  Uygulama, yapılandırılmış bağlantı noktasında çalışan gateway'e bağlanır.

### 3) Doğrulayın

- Uygulama içi Gateway durumu **“Mevcut gateway kullanılıyor …”** olarak görünmelidir
- Veya CLI üzerinden:

```bash
openclaw health
```

### Sık yapılan hatalar

- **Yanlış bağlantı noktası:** Gateway WS varsayılanı `ws://127.0.0.1:18789` değeridir; uygulama + CLI aynı bağlantı noktasında kalsın.
- **Durumun yaşadığı yer:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Kimlik doğrulamayı hata ayıklarken veya nelerin yedekleneceğine karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot belirteci**: yapılandırma/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir)
- **Discord bot belirteci**: yapılandırma/env veya SecretRef (env/file/exec sağlayıcıları)
- **Slack belirteçleri**: yapılandırma/env (`channels.slack.*`)
- **Eşleştirme izin listeleri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model kimlik doğrulama profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli gizli bilgiler yükü (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarma**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` dizinlerini “sizin şeyleriniz” olarak tutun; kişisel istemleri/yapılandırmayı `openclaw` deposuna koymayın.
- Kaynağı güncelleme: `git pull` + `pnpm install` + `pnpm gateway:watch` kullanmaya devam edin.

## Linux (systemd kullanıcı servisi)

Linux kurulumları systemd **kullanıcı** servisi kullanır. Varsayılan olarak systemd, çıkışta/boştayken kullanıcı
servislerini durdurur; bu da Gateway'i sonlandırır. Onboarding, lingering özelliğini sizin için etkinleştirmeye çalışır
(sudo isteyebilir). Hâlâ kapalıysa şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Her zaman açık veya çok kullanıcılı sunucular için kullanıcı servisi yerine bir **sistem** servisi düşünün
(lingering gerekmez). systemd notları için bkz. [Gateway çalışma kitabı](/tr/gateway).

## İlgili belgeler

- [Gateway çalışma kitabı](/tr/gateway) (bayraklar, denetim, bağlantı noktaları)
- [Gateway yapılandırması](/tr/gateway/configuration) (yapılandırma şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw asistan kurulumu](/tr/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (gateway yaşam döngüsü)
