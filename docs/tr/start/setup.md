---
read_when:
    - Yeni bir makine kurma
    - Kişisel kurulumunuzu bozmadan "en yeni + en iyi" olanı istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-05-07T13:26:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
İlk kez kurulum yapıyorsanız [Başlarken](/tr/start/getting-started) ile başlayın.
Onboarding ayrıntıları için bkz. [Onboarding (CLI)](/tr/start/wizard).
</Note>

## Kısa Özet

Güncellemeleri ne sıklıkla istediğinize ve Gateway'i kendiniz çalıştırmak isteyip istemediğinize göre bir kurulum iş akışı seçin:

- **Özelleştirme repo dışında yaşar:** yapılandırmanızı ve çalışma alanınızı `~/.openclaw/openclaw.json` ve `~/.openclaw/workspace/` içinde tutun; böylece repo güncellemeleri bunlara dokunmaz.
- **Kararlı iş akışı (çoğu kişi için önerilir):** macOS uygulamasını kurun ve paketle gelen Gateway'i çalıştırmasına izin verin.
- **En güncel iş akışı (dev):** Gateway'i `pnpm gateway:watch` üzerinden kendiniz çalıştırın, ardından macOS uygulamasının Local modda bağlanmasına izin verin.

## Ön koşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.16+`, hâlâ desteklenir)
- Kaynak checkout'ları için `pnpm` gerekir. OpenClaw, dev modunda paketle gelen Plugin'leri
  `extensions/*` pnpm workspace paketlerinden yükler; bu nedenle kökte `npm install`
  çalıştırmak tam kaynak ağacını hazırlamaz.
- Docker (isteğe bağlı; yalnızca container tabanlı kurulum/e2e için - bkz. [Docker](/tr/install/docker))

## Özelleştirme stratejisi (güncellemelerin sorun çıkarmaması için)

Hem "tamamen bana göre özelleştirilmiş" _hem de_ kolay güncellemeler istiyorsanız, özelleştirmenizi şurada tutun:

- **Yapılandırma:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (skills, prompt'lar, bellekler; bunu özel bir git reposu yapın)

Bir kez bootstrap yapın:

```bash
openclaw setup
```

Bu reponun içinden yerel CLI girdisini kullanın:

```bash
openclaw setup
```

Henüz global kurulumunuz yoksa `pnpm openclaw setup` ile çalıştırın.

## Gateway'i bu repodan çalıştırma

`pnpm build` sonrasında paketlenmiş CLI'yi doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app** uygulamasını kurun ve başlatın (menü çubuğu).
2. Onboarding/izinler kontrol listesini tamamlayın (TCC istemleri).
3. Gateway'in **Local** olduğundan ve çalıştığından emin olun (uygulama bunu yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Sağlamlık kontrolü:

```bash
openclaw health
```

Onboarding derlemenizde mevcut değilse:

- `openclaw setup` çalıştırın, ardından `openclaw channels login` çalıştırın, sonra Gateway'i manuel olarak başlatın (`openclaw gateway`).

## En güncel iş akışı (Gateway bir terminalde)

Amaç: TypeScript Gateway üzerinde çalışmak, hot reload almak, macOS uygulama UI'ını bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

macOS uygulamasını da en güncel halde istiyorsanız:

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

`gateway:watch`, Gateway watch sürecini adlandırılmış bir tmux oturumunda başlatır
veya yeniden başlatır ve etkileşimli terminallerden otomatik bağlanır. Etkileşimsiz shell'ler
ayrık kalır ve `tmux attach -t openclaw-gateway-watch-main` yazdırır; etkileşimli bir çalıştırmayı
ayrık tutmak için `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, ön plan watch modu için
`pnpm gateway:watch:raw` kullanın. Watcher, ilgili kaynak, yapılandırma ve paketle gelen Plugin
metadata değişikliklerinde yeniden yükler. İzlenen Gateway başlangıç sırasında çıkarsa,
`gateway:watch` bir kez `openclaw doctor --fix --non-interactive` çalıştırır ve tekrar dener;
bu yalnızca dev'e özgü onarım geçişini devre dışı bırakmak için `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` ayarlayın.
`pnpm openclaw setup`, yeni bir checkout için tek seferlik yerel yapılandırma/çalışma alanı ilklendirme adımıdır.
`pnpm gateway:watch`, `dist/control-ui` yeniden derlemez; bu nedenle `ui/` değişikliklerinden sonra `pnpm ui:build` komutunu yeniden çalıştırın veya Control UI geliştirirken `pnpm ui:dev` kullanın.

### 2) macOS uygulamasını çalışan Gateway'inize yönlendirin

**OpenClaw.app** içinde:

- Bağlantı Modu: **Local**
  Uygulama, yapılandırılmış portta çalışan gateway'e bağlanır.

### 3) Doğrulayın

- Uygulama içi Gateway durumu **"Mevcut gateway kullanılıyor …"** yazmalıdır
- Veya CLI üzerinden:

```bash
openclaw health
```

### Yaygın tuzaklar

- **Yanlış port:** Gateway WS varsayılanı `ws://127.0.0.1:18789`; uygulama + CLI'yi aynı portta tutun.
- **Durumun bulunduğu yer:**
  - Kanal/provider durumu: `~/.openclaw/credentials/`
  - Model auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Loglar: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Auth hata ayıklarken veya neyin yedekleneceğine karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token'ı**: config/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink'ler reddedilir)
- **Discord bot token'ı**: config/env veya SecretRef (env/file/exec provider'ları)
- **Slack token'ları**: config/env (`channels.slack.*`)
- **Eşleştirme allowlist'leri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model auth profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli secrets payload'u (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarımı**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` dizinlerini "size ait şeyler" olarak tutun; kişisel prompt'ları/yapılandırmayı `openclaw` reposuna koymayın.
- Kaynağı güncelleme: `git pull` + `pnpm install` + `pnpm gateway:watch` kullanmaya devam edin.

## Linux (systemd kullanıcı servisi)

Linux kurulumları bir systemd **user** servisi kullanır. Varsayılan olarak systemd, çıkışta/idle durumunda kullanıcı
servislerini durdurur; bu da Gateway'i sonlandırır. Onboarding sizin için lingering'i etkinleştirmeye
çalışır (sudo isteyebilir). Hâlâ kapalıysa şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Her zaman açık veya çok kullanıcılı sunucular için bir
user servisi yerine **system** servisi düşünün (lingering gerekmez). systemd notları için [Gateway runbook](/tr/gateway) bölümüne bakın.

## İlgili belgeler

- [Gateway runbook](/tr/gateway) (flag'ler, denetim, portlar)
- [Gateway yapılandırması](/tr/gateway/configuration) (config şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw assistant kurulumu](/tr/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (gateway yaşam döngüsü)
