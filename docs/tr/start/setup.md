---
read_when:
    - Yeni bir makine kurma
    - Kişisel kurulumunuzu bozmadan “en yeni + en iyi” olanı istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-04-30T09:46:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
İlk kez kurulum yapıyorsanız [Başlarken](/tr/start/getting-started) ile başlayın.
Onboarding ayrıntıları için bkz. [Onboarding (CLI)](/tr/start/wizard).
</Note>

## Kısa Özet

Güncellemeleri ne sıklıkta istediğinize ve Gateway’i kendiniz çalıştırmak isteyip istemediğinize göre bir kurulum iş akışı seçin:

- **Özelleştirme repo dışında yaşar:** yapılandırmanızı ve çalışma alanınızı `~/.openclaw/openclaw.json` ve `~/.openclaw/workspace/` içinde tutun; böylece repo güncellemeleri bunlara dokunmaz.
- **Kararlı iş akışı (çoğu kullanıcı için önerilir):** macOS uygulamasını kurun ve paketlenmiş Gateway’i onun çalıştırmasına izin verin.
- **En güncel iş akışı (geliştirme):** Gateway’i `pnpm gateway:watch` ile kendiniz çalıştırın, ardından macOS uygulamasının Yerel modda bağlanmasına izin verin.

## Ön Koşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.14+`, hâlâ desteklenir)
- `pnpm` tercih edilir (veya bilinçli olarak [Bun iş akışını](/tr/install/bun) kullanıyorsanız Bun)
- Docker (isteğe bağlı; yalnızca konteynerleştirilmiş kurulum/e2e için — bkz. [Docker](/tr/install/docker))

## Özelleştirme stratejisi (güncellemelerin zarar vermemesi için)

“%100 bana özel” _ve_ kolay güncellemeler istiyorsanız, özelleştirmenizi şuralarda tutun:

- **Yapılandırma:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (skills, prompt’lar, bellekler; bunu özel bir git reposu yapın)

Bir kez başlatın:

```bash
openclaw setup
```

Bu reponun içinden yerel CLI girişini kullanın:

```bash
openclaw setup
```

Henüz global kurulumunuz yoksa `pnpm openclaw setup` ile çalıştırın (veya Bun iş akışını kullanıyorsanız `bun run openclaw setup`).

## Gateway’i bu repodan çalıştırma

`pnpm build` sonrasında paketlenmiş CLI’ı doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app**’i (menü çubuğu) kurun ve başlatın.
2. Onboarding/izinler kontrol listesini tamamlayın (TCC istemleri).
3. Gateway’in **Yerel** olduğundan ve çalıştığından emin olun (uygulama bunu yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Sağlık kontrolü yapın:

```bash
openclaw health
```

Onboarding derlemenizde mevcut değilse:

- `openclaw setup` çalıştırın, ardından `openclaw channels login` çalıştırın, sonra Gateway’i elle başlatın (`openclaw gateway`).

## En güncel iş akışı (Gateway terminalde)

Amaç: TypeScript Gateway üzerinde çalışmak, hot reload almak ve macOS uygulama arayüzünü bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

macOS uygulamasını da en güncel hâliyle kullanmak istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Geliştirme Gateway’ini başlatın

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`, Gateway izleme sürecini adlandırılmış bir tmux oturumunda başlatır veya yeniden başlatır ve etkileşimli terminallerden otomatik bağlanır. Etkileşimsiz kabuklar ayrık kalır ve `tmux attach -t openclaw-gateway-watch-main` yazdırır; etkileşimli bir çalıştırmayı ayrık tutmak için `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` kullanın veya ön planda izleme modu için `pnpm gateway:watch:raw` kullanın. İzleyici ilgili kaynak, yapılandırma ve paketlenmiş Plugin meta veri değişikliklerinde yeniden yüklenir.
`pnpm openclaw setup`, yeni bir checkout için tek seferlik yerel yapılandırma/çalışma alanı başlatma adımıdır.
`pnpm gateway:watch`, `dist/control-ui` dosyasını yeniden derlemez; bu nedenle `ui/` değişikliklerinden sonra `pnpm ui:build` komutunu yeniden çalıştırın veya Control UI geliştirirken `pnpm ui:dev` kullanın.

Bilinçli olarak Bun iş akışını kullanıyorsanız eşdeğer komutlar şunlardır:

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) macOS uygulamasını çalışan Gateway’inize yönlendirin

**OpenClaw.app** içinde:

- Bağlantı Modu: **Yerel**
  Uygulama, yapılandırılmış porttaki çalışan gateway’e bağlanır.

### 3) Doğrulayın

- Uygulama içi Gateway durumu **“Mevcut gateway kullanılıyor …”** yazmalıdır
- Veya CLI ile:

```bash
openclaw health
```

### Yaygın tuzaklar

- **Yanlış port:** Gateway WS varsayılanı `ws://127.0.0.1:18789`; uygulama ve CLI’ı aynı portta tutun.
- **Durumun yaşadığı yer:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Kimlik doğrulamayı hata ayıklarken veya nelerin yedekleneceğine karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token’ı**: yapılandırma/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink’ler reddedilir)
- **Discord bot token’ı**: yapılandırma/env veya SecretRef (env/file/exec sağlayıcıları)
- **Slack token’ları**: yapılandırma/env (`channels.slack.*`)
- **Eşleştirme izin listeleri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model kimlik doğrulama profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli gizli veri yükü (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarımı**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` dizinlerini “size ait şeyler” olarak tutun; kişisel prompt’ları/yapılandırmayı `openclaw` reposuna koymayın.
- Kaynağı güncelleme: `git pull` + seçtiğiniz paket yöneticisi kurulum adımı (varsayılan olarak `pnpm install`; Bun iş akışı için `bun install`) + eşleşen `gateway:watch` komutunu kullanmaya devam edin.

## Linux (systemd kullanıcı servisi)

Linux kurulumları systemd **kullanıcı** servisi kullanır. Varsayılan olarak systemd, çıkış/boşta kalma sırasında kullanıcı servislerini durdurur; bu da Gateway’i sonlandırır. Onboarding, sizin için lingering’i etkinleştirmeye çalışır (sudo isteyebilir). Hâlâ kapalıysa şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Her zaman açık veya çok kullanıcılı sunucular için kullanıcı servisi yerine **sistem** servisini değerlendirin (lingering gerekmez). systemd notları için bkz. [Gateway runbook](/tr/gateway).

## İlgili dokümanlar

- [Gateway runbook](/tr/gateway) (bayraklar, denetim, portlar)
- [Gateway yapılandırması](/tr/gateway/configuration) (yapılandırma şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw assistant kurulumu](/tr/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (gateway yaşam döngüsü)
