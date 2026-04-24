---
read_when:
    - Kanal bağlantısını veya Gateway sağlığını teşhis etme
    - Sağlık denetimi CLI komutlarını ve seçeneklerini anlama
summary: Sağlık denetimi komutları ve Gateway sağlık izleme
title: Sağlık denetimleri
x-i18n:
    generated_at: "2026-04-24T09:09:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# Sağlık Denetimleri (CLI)

Tahmine dayanmadan kanal bağlantısını doğrulamak için kısa kılavuz.

## Hızlı denetimler

- `openclaw status` — yerel özet: Gateway erişilebilirliği/modu, güncelleme ipucu, bağlı kanal kimlik doğrulama yaşı, oturumlar + yakın tarihli etkinlik.
- `openclaw status --all` — tam yerel teşhis (salt okunur, renkli, hata ayıklama için yapıştırması güvenli).
- `openclaw status --deep` — çalışan Gateway'den canlı sağlık probe'u ister (`probe:true` ile `health`), desteklendiğinde hesap başına kanal probe'ları da dahildir.
- `openclaw health` — çalışan Gateway'den sağlık anlık görüntüsünü ister (yalnızca WS; CLI'dan doğrudan kanal soketleri yoktur).
- `openclaw health --verbose` — canlı sağlık probe'unu zorlar ve Gateway bağlantı ayrıntılarını yazdırır.
- `openclaw health --json` — makine tarafından okunabilir sağlık anlık görüntüsü çıktısı.
- Ajanı invoke etmeden durum yanıtı almak için WhatsApp/WebChat'te bağımsız mesaj olarak `/status` gönderin.
- Günlükler: `/tmp/openclaw/openclaw-*.log` dosyasını tail edin ve `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` için filtreleyin.

## Derin teşhis

- Diskte kimlik bilgileri: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime yakın tarihli olmalıdır).
- Oturum deposu: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (yol yapılandırmada geçersiz kılınabilir). Sayı ve yakın tarihli alıcılar `status` ile gösterilir.
- Yeniden bağlama akışı: günlüklerde 409–515 durum kodları veya `loggedOut` göründüğünde `openclaw channels logout && openclaw channels login --verbose`. (Not: QR giriş akışı, eşleştirmeden sonra 515 durumu için bir kez otomatik yeniden başlatılır.)
- Tanılamalar varsayılan olarak etkindir. `diagnostics.enabled: false` ayarlanmadıkça Gateway operasyonel gerçekleri kaydeder. Bellek olayları RSS/heap bayt sayılarını, eşik baskısını ve büyüme baskısını kaydeder. Aşırı büyük yük olayları, varsa reddedilen, kısaltılan veya parçalanan öğeyi, boyutları ve sınırları kaydeder. Mesaj metnini, ek içeriklerini, Webhook gövdesini, ham istek veya yanıt gövdesini, token'ları, çerezleri veya gizli değerleri kaydetmezler. Aynı Heartbeat, `openclaw gateway stability` veya `diagnostics.stability` Gateway RPC üzerinden erişilebilen sınırlı kararlılık kaydedicisini başlatır. Ölümcül Gateway çıkışları, kapanma zaman aşımları ve yeniden başlatma başlangıç hataları, olay varsa en son kaydedici anlık görüntüsünü `~/.openclaw/logs/stability/` altında kalıcılaştırır; en yeni kaydedilmiş paketi `openclaw gateway stability --bundle latest` ile inceleyin.
- Hata raporları için `openclaw gateway diagnostics export` çalıştırın ve oluşturulan zip'i ekleyin. Dışa aktarma; Markdown özeti, en yeni kararlılık paketi, temizlenmiş günlük meta verileri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve yapılandırma şeklini birleştirir. Paylaşılması amaçlanmıştır: sohbet metni, Webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/mesaj tanımlayıcıları ve gizli değerler atlanır veya redakte edilir. Bkz. [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics).

## Sağlık izleyici yapılandırması

- `gateway.channelHealthCheckMinutes`: Gateway'in kanal sağlığını ne sıklıkla denetlediği. Varsayılan: `5`. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın.
- `gateway.channelStaleEventThresholdMinutes`: bağlı bir kanalın sağlık izleyicisi onu eski kabul edip yeniden başlatmadan önce ne kadar süre boşta kalabileceği. Varsayılan: `30`. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya eşit tutun.
- `gateway.channelMaxRestartsPerHour`: kanal/hesap başına sağlık izleyici yeniden başlatmaları için kayan bir saatlik üst sınır. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izlemeyi etkin bırakırken belirli bir kanal için sağlık izleyici yeniden başlatmalarını devre dışı bırakır.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kanal düzeyi ayarı geçersiz kılan çok hesaplı geçersiz kılma.
- Bu kanal başına geçersiz kılmalar bugün bunları sunan yerleşik kanal izleyicilerine uygulanır: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram ve WhatsApp.

## Bir şey başarısız olduğunda

- `logged out` veya durum 409–515 → `openclaw channels logout` sonra `openclaw channels login` ile yeniden bağlayın.
- Gateway erişilemez → başlatın: `openclaw gateway --port 18789` (bağlantı noktası meşgulse `--force` kullanın).
- Gelen mesaj yok → bağlı telefonun çevrimiçi olduğunu ve gönderenin izinli olduğunu doğrulayın (`channels.whatsapp.allowFrom`); grup sohbetleri için izin listesi + bahsetme kurallarının eşleştiğinden emin olun (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Ayrılmış "health" komutu

`openclaw health`, çalışan Gateway'den sağlık anlık görüntüsünü ister (CLI'dan doğrudan kanal
soketi yoktur). Varsayılan olarak yeni bir önbelleğe alınmış Gateway anlık görüntüsü döndürebilir; ardından
Gateway bu önbelleği arka planda yeniler. `openclaw health --verbose`
bunun yerine canlı probe'u zorlar. Komut, mevcut olduğunda bağlı kimlik bilgileri/kimlik doğrulama yaşını,
kanal başına probe özetlerini, oturum deposu özetini ve bir probe süresini bildirir. Gateway'e erişilemiyorsa
veya probe başarısız/zaman aşımına uğruyorsa sıfır olmayan kodla çıkar.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON çıktısı
- `--timeout <ms>`: varsayılan 10 sn probe zaman aşımını geçersiz kıl
- `--verbose`: canlı probe'u zorla ve Gateway bağlantı ayrıntılarını yazdır
- `--debug`: `--verbose` için takma ad

Sağlık anlık görüntüsü şunları içerir: `ok` (boolean), `ts` (zaman damgası), `durationMs` (probe süresi), kanal başına durum, ajan kullanılabilirliği ve oturum deposu özeti.

## İlgili

- [Gateway runbook](/tr/gateway)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
