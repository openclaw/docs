---
read_when:
    - Kanal bağlantısını veya Gateway sağlığını tanılama
    - Sağlık denetimi CLI komutlarını ve seçeneklerini anlama
summary: Sağlık kontrolü komutları ve Gateway sağlık izlemesi
title: Sağlık kontrolleri
x-i18n:
    generated_at: "2026-04-30T09:22:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Tahmin yürütmeden kanal bağlantısını doğrulamak için kısa rehber.

## Hızlı kontroller

- `openclaw status` — yerel özet: Gateway erişilebilirliği/modu, güncelleme ipucu, bağlı kanal kimlik doğrulama yaşı, oturumlar + son etkinlik.
- `openclaw status --all` — tam yerel tanı (salt okunur, renkli, hata ayıklama için yapıştırması güvenli).
- `openclaw status --deep` — çalışan Gateway’den canlı sağlık yoklaması ister (`probe:true` ile `health`), desteklendiğinde hesap başına kanal yoklamaları dahil.
- `openclaw health` — çalışan Gateway’den sağlık anlık görüntüsünü ister (yalnızca WS; CLI’dan doğrudan kanal soketleri yoktur).
- `openclaw health --verbose` — canlı sağlık yoklamasını zorlar ve Gateway bağlantı ayrıntılarını yazdırır.
- `openclaw health --json` — makine tarafından okunabilir sağlık anlık görüntüsü çıktısı.
- Ajanı çağırmadan durum yanıtı almak için WhatsApp/WebChat’te bağımsız bir mesaj olarak `/status` gönderin.
- Günlükler: `/tmp/openclaw/openclaw-*.log` dosyalarını izleyin ve `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` için filtreleyin.

## Derin tanılama

- Diskteki kimlik bilgileri: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime yakın tarihli olmalıdır).
- Oturum deposu: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (yol yapılandırmada geçersiz kılınabilir). Sayı ve son alıcılar `status` üzerinden gösterilir.
- Yeniden bağlama akışı: durum kodları 409-515 olduğunda veya günlüklerde `loggedOut` göründüğünde `openclaw channels logout && openclaw channels login --verbose`. (Not: QR oturum açma akışı, eşleştirmeden sonra durum 515 için bir kez otomatik yeniden başlar.)
- Tanılama varsayılan olarak etkindir. `diagnostics.enabled: false` ayarlanmadığı sürece Gateway operasyonel olguları kaydeder. Bellek olayları RSS/heap bayt sayılarını, eşik baskısını ve büyüme baskısını kaydeder. Canlılık uyarıları, süreç çalışıyor ancak doygun durumdaysa olay döngüsü gecikmesini, olay döngüsü kullanımını, CPU çekirdek oranını ve etkin/bekleyen/kuyrukta oturum sayılarını kaydeder. Aşırı büyük yük olayları, mevcut olduğunda boyutlar ve sınırlarla birlikte neyin reddedildiğini, kırpıldığını veya parçalara ayrıldığını kaydeder. Mesaj metnini, ek içeriklerini, Webhook gövdesini, ham istek veya yanıt gövdesini, tokenları, çerezleri ya da gizli değerleri kaydetmezler. Aynı Heartbeat, `openclaw gateway stability` veya `diagnostics.stability` Gateway RPC üzerinden kullanılabilen sınırlı kararlılık kaydedicisini başlatır. Ölümcül Gateway çıkışları, kapatma zaman aşımları ve yeniden başlatma başlangıç hataları, olaylar varsa en son kaydedici anlık görüntüsünü `~/.openclaw/logs/stability/` altında kalıcılaştırır; en yeni kaydedilmiş paketi `openclaw gateway stability --bundle latest` ile inceleyin.
- Hata raporları için `openclaw gateway diagnostics export` çalıştırın ve oluşturulan zip dosyasını ekleyin. Dışa aktarma; Markdown özeti, en yeni kararlılık paketi, temizlenmiş günlük meta verileri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve yapılandırma şeklini birleştirir. Paylaşılmak üzere tasarlanmıştır: sohbet metni, Webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/mesaj tanımlayıcıları ve gizli değerler atlanır veya redakte edilir. Bkz. [Tanılama Dışa Aktarma](/tr/gateway/diagnostics).

## Sağlık izleyici yapılandırması

- `gateway.channelHealthCheckMinutes`: Gateway’in kanal sağlığını ne sıklıkta kontrol edeceği. Varsayılan: `5`. Sağlık izleyici yeniden başlatmalarını küresel olarak devre dışı bırakmak için `0` olarak ayarlayın.
- `gateway.channelStaleEventThresholdMinutes`: bağlı bir kanalın, sağlık izleyici onu bayat kabul edip yeniden başlatmadan önce ne kadar süre boşta kalabileceği. Varsayılan: `30`. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun.
- `gateway.channelMaxRestartsPerHour`: kanal/hesap başına sağlık izleyici yeniden başlatmaları için kayan bir saatlik üst sınır. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: küresel izlemeyi etkin bırakırken belirli bir kanal için sağlık izleyici yeniden başlatmalarını devre dışı bırakır.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kanal düzeyi ayara üstün gelen çok hesaplı geçersiz kılma.
- Bu kanal başına geçersiz kılmalar, bugün bunları sunan yerleşik kanal izleyicilerine uygulanır: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram ve WhatsApp.

## Bir şey başarısız olduğunda

- `logged out` veya durum 409-515 → `openclaw channels logout` ardından `openclaw channels login` ile yeniden bağlayın.
- Gateway erişilemiyor → başlatın: `openclaw gateway --port 18789` (bağlantı noktası meşgulse `--force` kullanın).
- Gelen mesaj yok → bağlı telefonun çevrimiçi olduğunu ve gönderenin izinli olduğunu doğrulayın (`channels.whatsapp.allowFrom`); grup sohbetleri için izin listesi + bahsetme kurallarının eşleştiğinden emin olun (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Özel "health" komutu

`openclaw health`, çalışan Gateway’den sağlık anlık görüntüsünü ister (CLI’dan doğrudan kanal
soketleri yoktur). Varsayılan olarak yeni bir önbelleğe alınmış Gateway anlık görüntüsü döndürebilir; ardından
Gateway bu önbelleği arka planda yeniler. `openclaw health --verbose` bunun yerine
canlı yoklamayı zorlar. Komut, mevcut olduğunda bağlı kimlik bilgilerini/kimlik doğrulama yaşını,
kanal başına yoklama özetlerini, oturum deposu özetini ve yoklama süresini bildirir. Gateway erişilemiyorsa veya yoklama başarısız olursa/zaman aşımına uğrarsa
sıfır olmayan değerle çıkar.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON çıktısı
- `--timeout <ms>`: varsayılan 10 sn yoklama zaman aşımını geçersiz kıl
- `--verbose`: canlı yoklamayı zorla ve Gateway bağlantı ayrıntılarını yazdır
- `--debug`: `--verbose` için diğer ad

Sağlık anlık görüntüsü şunları içerir: `ok` (boole), `ts` (zaman damgası), `durationMs` (yoklama süresi), kanal başına durum, ajan kullanılabilirliği ve oturum deposu özeti.

## İlgili

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Tanılama dışa aktarma](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
