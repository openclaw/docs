---
read_when:
    - Yeni bir makineyi ayarlama
    - Kişisel kurulumunuzu bozmadan "en yeni + en iyi" sürümü istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-07-16T17:57:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
İlk kez kurulum yapıyorsanız [Başlarken](/tr/start/getting-started) ile başlayın.
İlk yapılandırma ayrıntıları için [İlk Yapılandırma (CLI)](/tr/start/wizard) bölümüne bakın.
</Note>

## Kısaca

Güncellemeleri ne sıklıkta istediğinize ve Gateway'i kendiniz çalıştırmak isteyip istemediğinize göre bir kurulum iş akışı seçin:

- **Kişiselleştirme depo dışında tutulur:** depo güncellemelerinin bunlara dokunmaması için yapılandırmanızı ve çalışma alanınızı `~/.openclaw/openclaw.json` ve `~/.openclaw/workspace/` içinde tutun.
- **Kararlı iş akışı (çoğu kullanıcı için önerilir):** macOS uygulamasını yükleyin ve paketle gelen Gateway'i çalıştırmasına izin verin.
- **En yeni geliştirme iş akışı (geliştirme):** Gateway'i `pnpm gateway:watch` aracılığıyla kendiniz çalıştırın, ardından macOS uygulamasının Yerel modda bağlanmasını sağlayın.

## Ön koşullar (kaynaktan)

- Node 24.15+ önerilir (şu anda `22.22.3+` olan Node 22 LTS hâlâ desteklenmektedir)
- Kaynak kod teslim almaları için `pnpm` gereklidir. OpenClaw, geliştirme modunda paketle gelen pluginleri
  `extensions/*` pnpm çalışma alanı paketlerinden yükler; bu nedenle kök `npm install`,
  kaynak ağacının tamamını hazırlamaz.
- Docker (isteğe bağlı; yalnızca konteyner tabanlı kurulum/e2e için — bkz. [Docker](/tr/install/docker))

## Kişiselleştirme stratejisi (güncellemelerin sorun çıkarmaması için)

Hem "%100 bana göre kişiselleştirilmiş" bir kurulum _hem de_ kolay güncellemeler istiyorsanız özelleştirmelerinizi şuralarda tutun:

- **Yapılandırma:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Çalışma alanı:** `~/.openclaw/workspace` (beceriler, istemler, anılar; bunu özel bir git deposu yapın)

Tam ilk yapılandırma sihirbazını çalıştırmadan yapılandırma/çalışma alanı klasörlerini bir kez hazırlayın:

```bash
openclaw setup --baseline
```

Henüz genel kurulum yapmadınız mı? Bunun yerine bu depodan çalıştırın:

```bash
pnpm openclaw setup --baseline
```

(`--baseline` olmadan yalın `openclaw setup`, `openclaw onboard` için bir diğer addır ve tam etkileşimli sihirbazı çalıştırır.)

## Gateway'i bu depodan çalıştırma

`pnpm build` sonrasında paketlenmiş CLI'yi doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app** uygulamasını yükleyip başlatın (menü çubuğu).
2. İlk yapılandırma/izinler kontrol listesini tamamlayın (TCC istemleri).
3. Gateway'in **Yerel** olduğundan ve çalıştığından emin olun (uygulama tarafından yönetilir).
4. Kanalları bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Temel doğrulama:

```bash
openclaw health
```

İlk yapılandırma derlemenizde kullanılamıyorsa:

- `openclaw setup` ve ardından `openclaw channels login` komutunu çalıştırın, sonra Gateway'i elle başlatın (`openclaw gateway`).

## En yeni geliştirme iş akışı (terminalde Gateway)

Amaç: TypeScript Gateway üzerinde çalışmak, çalışırken yeniden yüklemeden yararlanmak ve macOS uygulaması kullanıcı arayüzünü bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırma

macOS uygulamasının da en yeni geliştirme sürümünde olmasını istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Geliştirme Gateway'ini başlatma

```bash
pnpm install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw yapılandırması/çalışma alanı sıfırlandıktan sonra)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`, Gateway izleme işlemini adlandırılmış bir tmux
oturumunda (`openclaw-gateway-watch-main`) başlatır veya yeniden başlatır ve etkileşimli
terminallerden otomatik olarak bağlanır. Etkileşimsiz kabuklar bağlantısız kalır ve
`tmux attach -t openclaw-gateway-watch-main` çıktısını verir; etkileşimli bir çalıştırmayı
bağlantısız tutmak için `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, ön planda izleme modu içinse
`pnpm gateway:watch:raw` kullanın. İzleyici, yapılandırılmış/varsayılan bağlantı
noktasını devralmadan önce etkin profilin yüklü Gateway hizmetini durdurarak
hizmet yöneticisinin kaynak işlemin yerine geçmesini önler. Hizmet yüklü kalır;
izlemeyi bitirdiğinizde `pnpm openclaw gateway start` komutunu çalıştırın. Başlatma
başarısız olduktan sonra tmux bölmesi kullanılabilir durumda kalır; böylece başka
bir terminal veya temsilci bağlanabilir ya da günlüklerini yakalayabilir. İzleyici,
ilgili kaynak, yapılandırma ve paketle gelen plugin meta verisi değişikliklerinde
yeniden yükleme yapar. İzlenen Gateway başlatma sırasında kapanırsa
`gateway:watch`, `openclaw doctor --fix --non-interactive` komutunu bir kez çalıştırıp yeniden
dener; yalnızca geliştirmeye özgü bu onarım geçişini devre dışı bırakmak için
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` ayarlayın. `pnpm gateway:watch`, `dist/control-ui`
öğesini yeniden derlemez; bu nedenle `ui/` değişikliklerinden
sonra `pnpm ui:build` komutunu yeniden çalıştırın veya Denetim Kullanıcı
Arayüzünü geliştirirken `pnpm ui:dev` kullanın.

### 2) macOS uygulamasını çalışan Gateway'inize yönlendirme

**OpenClaw.app** içinde:

- Connection Mode: **Local**
  Uygulama, yapılandırılmış bağlantı noktasında çalışan Gateway'e bağlanır.

### 3) Doğrulama

- Uygulama içi Gateway durumunda **"Using existing gateway …"** yazmalıdır
- Veya CLI aracılığıyla:

```bash
openclaw health
```

### Yaygın hatalar

- **Yanlış bağlantı noktası:** Gateway WS için varsayılan değer `ws://127.0.0.1:18789`; uygulama ile CLI'yi aynı bağlantı noktasında tutun.
- **Durumun saklandığı yer:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar ve dökümler: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Eski/arşiv oturum yapıtları: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgileri depolama haritası

Kimlik doğrulama sorunlarını giderirken veya nelerin yedekleneceğine karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot belirteci**: yapılandırma/ortam veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir)
- **Discord bot belirteci**: yapılandırma/ortam veya SecretRef (ortam/dosya/çalıştırma sağlayıcıları)
- **Slack belirteçleri**: yapılandırma/ortam (`channels.slack.*`)
- **Eşleştirme izin listeleri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model kimlik doğrulama profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli gizli değer yükü (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarımı**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` öğelerini "size ait şeyler" olarak tutun; kişisel istemleri/yapılandırmayı `openclaw` deposuna koymayın.
- Kaynağı güncelleme: `git pull` + `pnpm install` + `pnpm gateway:watch` kullanmaya devam edin.

## Linux (systemd kullanıcı hizmeti)

Linux kurulumları bir systemd **kullanıcı** hizmeti kullanır. systemd varsayılan
olarak oturum kapatıldığında/boşta kalındığında kullanıcı hizmetlerini durdurur;
bu da Gateway'i sonlandırır. İlk yapılandırma, kalıcı oturumu sizin için
etkinleştirmeye çalışır (sudo istemi gösterebilir). Hâlâ kapalıysa şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Sürekli açık veya çok kullanıcılı sunucularda kullanıcı hizmeti yerine bir
**sistem** hizmeti kullanmayı değerlendirin (kalıcı oturum gerekmez). systemd
notları için [Gateway çalıştırma kılavuzuna](/tr/gateway) bakın.

## İlgili belgeler

- [Gateway çalıştırma kılavuzu](/tr/gateway) (bayraklar, denetim, bağlantı noktaları)
- [Gateway yapılandırması](/tr/gateway/configuration) (yapılandırma şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw asistanı kurulumu](/tr/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (Gateway yaşam döngüsü)
