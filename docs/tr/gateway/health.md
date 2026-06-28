---
read_when:
    - Kanal bağlantısını veya gateway sağlığını tanılama
    - Sağlık denetimi CLI komutlarını ve seçeneklerini anlama
summary: Sağlık denetimi komutları ve Gateway sağlık izlemesi
title: Sağlık kontrolleri
x-i18n:
    generated_at: "2026-06-28T00:34:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Bağlantı kanalı durumunu tahmin yürütmeden doğrulamak için kısa kılavuz.

## Hızlı denetimler

- `openclaw status` — yerel özet: Gateway erişilebilirliği/modu, güncelleme ipucu, bağlı kanal kimlik doğrulama yaşı, oturumlar + son etkinlik.
- `openclaw status --all` — tam yerel tanılama (salt okunur, renkli, hata ayıklama için yapıştırması güvenli).
- `openclaw status --deep` — çalışan Gateway'den canlı bir sağlık yoklaması ister (`probe:true` ile `health`), desteklendiğinde hesap başına kanal yoklamaları dahil.
- `openclaw health` — çalışan Gateway'den sağlık anlık görüntüsünü ister (yalnızca WS; CLI'dan doğrudan kanal soketi yok).
- `openclaw health --verbose` — canlı sağlık yoklamasını zorlar ve Gateway bağlantı ayrıntılarını yazdırır.
- `openclaw health --json` — makine tarafından okunabilir sağlık anlık görüntüsü çıktısı.
- Ajanı çağırmadan durum yanıtı almak için WhatsApp/WebChat içinde bağımsız bir mesaj olarak `/status` gönderin.
- Günlükler: `/tmp/openclaw/openclaw-*.log` dosyalarını izleyin ve `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` için filtreleyin.

Discord ve diğer sohbet sağlayıcıları için oturum satırları soketin canlılığı değildir.
`openclaw sessions`, Gateway `sessions.list` ve ajan `sessions_list` aracı
depolanan konuşma durumunu okur. Bir sağlayıcı yeniden bağlanıp herhangi bir yeni
oturum satırı oluşturulmadan önce sağlıklı kanal durumu gösterebilir. Canlı bağlantı
denetimleri için yukarıdaki kanal durumu ve sağlık komutlarını kullanın.

## Derin tanılama

- Diskteki kimlik bilgileri: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime yakın tarihli olmalıdır).
- Oturum deposu: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (yol yapılandırmada geçersiz kılınabilir). Sayı ve son alıcılar `status` üzerinden gösterilir.
- Yeniden bağlama akışı: durum kodları 409-515 olduğunda veya günlüklerde `loggedOut` göründüğünde `openclaw channels logout && openclaw channels login --verbose`. (Not: QR oturum açma akışı, eşleştirmeden sonra durum 515 için bir kez otomatik olarak yeniden başlar.)
- Tanılamalar varsayılan olarak etkindir. Gateway, `diagnostics.enabled: false` ayarlanmadığı sürece operasyonel bilgileri kaydeder. Bellek olayları RSS/heap bayt sayılarını, eşik baskısını ve büyüme baskısını kaydeder. Kritik bellek baskısı Gateway günlükleyicisi üzerinden günlüğe yazılır. `diagnostics.memoryPressureSnapshot: true` ayarlandığında, kritik bellek baskısı ayrıca V8 heap istatistikleri, mevcut olduğunda Linux cgroup sayaçları, etkin kaynak sayıları ve redakte edilmiş göreli yola göre en büyük oturum/transkript dosyalarıyla birlikte OOM öncesi bir kararlılık paketi yazar. Canlılık uyarıları, süreç çalışırken ancak doygun durumdayken olay döngüsü gecikmesini, olay döngüsü kullanımını, CPU çekirdeği oranını ve etkin/bekleyen/kuyrukta oturum sayılarını kaydeder. Aşırı büyük yük olayları, mevcut olduğunda boyutlar ve sınırlarla birlikte neyin reddedildiğini, kesildiğini veya parçalara bölündüğünü kaydeder. Mesaj metnini, ek içeriklerini, Webhook gövdesini, ham istek veya yanıt gövdesini, tokenları, çerezleri ya da gizli değerleri kaydetmez. Aynı Heartbeat, `openclaw gateway stability` veya `diagnostics.stability` Gateway RPC üzerinden erişilebilen sınırlı kararlılık kaydedicisini başlatır. Önemli Gateway çıkışları, kapatma zaman aşımları ve yeniden başlatma başlangıç hataları, olaylar mevcut olduğunda en son kaydedici anlık görüntüsünü `~/.openclaw/logs/stability/` altında kalıcı hale getirir; kritik bellek baskısı bunu yalnızca `diagnostics.memoryPressureSnapshot: true` ayarlandığında yapar. En yeni kaydedilmiş paketi `openclaw gateway stability --bundle latest` ile inceleyin.
- Hata raporları için `openclaw gateway diagnostics export` çalıştırın ve oluşturulan zip dosyasını ekleyin. Dışa aktarma; bir Markdown özeti, en yeni kararlılık paketi, temizlenmiş günlük meta verileri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve yapılandırma şeklini birleştirir. Paylaşılmak üzere tasarlanmıştır: sohbet metni, Webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/mesaj tanımlayıcıları ve gizli değerler atlanır veya redakte edilir. Bkz. [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics).

## Sağlık izleyicisi yapılandırması

- `gateway.channelHealthCheckMinutes`: Gateway'in kanal sağlığını ne sıklıkla denetlediği. Varsayılan: `5`. Sağlık izleyicisi yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın.
- `gateway.channelStaleEventThresholdMinutes`: bağlı bir kanalın, sağlık izleyicisi onu eski kabul edip yeniden başlatmadan önce ne kadar süre boşta kalabileceği. Varsayılan: `30`. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun.
- `gateway.channelMaxRestartsPerHour`: kanal/hesap başına sağlık izleyicisi yeniden başlatmaları için kayan bir saatlik üst sınır. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izlemeyi etkin bırakırken belirli bir kanal için sağlık izleyicisi yeniden başlatmalarını devre dışı bırakır.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kanal düzeyi ayara üstün gelen çok hesaplı geçersiz kılma.
- Bu kanal başına geçersiz kılmalar, bugün bunları sunan yerleşik kanal izleyicileri için geçerlidir: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram ve WhatsApp.

## Çalışma süresi izleme

Harici çalışma süresi izleme hizmetleri `/v1/chat/completions` yerine ayrılmış `/health` uç noktasını kullanmalıdır.

- **KULLANIN:** `GET /health` — anında yanıt, oturum oluşturulmaz, LLM çağrısı yok, `{"ok":true,"status":"live"}` döndürür
- **KULLANMAYIN:** sağlık denetimleri için `/v1/chat/completions` — her istek beceri anlık görüntüsü, bağlam derlemesi ve LLM çağrılarıyla tam bir ajan oturumu oluşturur

`x-openclaw-session-key` başlığı veya `user` alanı sağlanmadığında, `/v1/chat/completions` her istek için yeni rastgele bir oturum üretir. Her 15 dakikada bir ping atan izleme hizmetleri günde yaklaşık 96 oturum oluşturur ve her biri 4-22 KB tüketir. Zamanla bu, oturum deposunun şişmesine neden olur ve bağlam penceresi taşmasına yol açabilir.

### İzleme hizmeti kurulum örnekleri

- **BetterStack:** Sağlık denetimi URL'sini `https://<your-gateway-host>:<port>/health` olarak ayarlayın
- **UptimeRobot:** `https://<your-gateway-host>:<port>/health` URL'siyle yeni bir HTTP izleyicisi ekleyin
- **Genel:** Gateway sağlıklı olduğunda `/health` adresine yapılan herhangi bir HTTP GET, `{"ok":true}` ile 200 döndürür

## Bir şey başarısız olduğunda

- `logged out` veya durum 409-515 → `openclaw channels logout` ardından `openclaw channels login` ile yeniden bağlayın.
- Gateway erişilemiyor → başlatın: `openclaw gateway --port 18789` (bağlantı noktası meşgulse `--force` kullanın).
- Gelen mesaj yok → bağlı telefonun çevrimiçi olduğunu ve gönderene izin verildiğini doğrulayın (`channels.whatsapp.allowFrom`); grup sohbetleri için izin listesi + mention kurallarının eşleştiğinden emin olun (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Ayrılmış "health" komutu

`openclaw health`, çalışan Gateway'den sağlık anlık görüntüsünü ister (CLI'dan doğrudan kanal
soketi yok). Varsayılan olarak taze önbelleğe alınmış bir Gateway anlık görüntüsü döndürebilir; ardından
Gateway bu önbelleği arka planda yeniler. `openclaw health --verbose` bunun yerine
canlı yoklamayı zorlar. Komut, mevcut olduğunda bağlı kimlik bilgilerini/kimlik doğrulama yaşını,
kanal başına yoklama özetlerini, oturum deposu özetini ve yoklama süresini bildirir. Gateway
erişilemezse veya yoklama başarısız olursa/zaman aşımına uğrarsa sıfır olmayan kodla çıkar.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON çıktısı
- `--timeout <ms>`: varsayılan 10 sn yoklama zaman aşımını geçersiz kıl
- `--verbose`: canlı yoklamayı zorla ve Gateway bağlantı ayrıntılarını yazdır
- `--debug`: `--verbose` için takma ad

Sağlık anlık görüntüsü şunları içerir: `ok` (boolean), `ts` (zaman damgası), `durationMs` (yoklama süresi), kanal başına durum, ajan kullanılabilirliği ve oturum deposu özeti.

## İlgili

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
