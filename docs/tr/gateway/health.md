---
read_when:
    - Kanal bağlantısını veya Gateway sağlığını tanılama
    - Sağlık kontrolü CLI komutlarını ve seçeneklerini anlama
summary: Sağlık kontrolü komutları ve Gateway sağlık izlemesi
title: Sağlık kontrolleri
x-i18n:
    generated_at: "2026-05-02T08:54:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Bağlantı kanalı bağlantısını tahmin yürütmeden doğrulamak için kısa kılavuz.

## Hızlı kontroller

- `openclaw status` — yerel özet: gateway erişilebilirliği/modu, güncelleme ipucu, bağlı kanal kimlik doğrulama yaşı, oturumlar + son etkinlik.
- `openclaw status --all` — tam yerel tanılama (salt okunur, renkli, hata ayıklama için yapıştırması güvenli).
- `openclaw status --deep` — çalışan gateway’den canlı bir sağlık yoklaması ister (`probe:true` ile `health`), desteklendiğinde hesap başına kanal yoklamaları dahil.
- `openclaw health` — çalışan gateway’den sağlık anlık görüntüsünü ister (yalnızca WS; CLI’dan doğrudan kanal soketleri yok).
- `openclaw health --verbose` — canlı sağlık yoklamasını zorlar ve gateway bağlantı ayrıntılarını yazdırır.
- `openclaw health --json` — makine tarafından okunabilir sağlık anlık görüntüsü çıktısı.
- Temsilciyi çağırmadan durum yanıtı almak için WhatsApp/WebChat içinde bağımsız bir mesaj olarak `/status` gönderin.
- Günlükler: `/tmp/openclaw/openclaw-*.log` dosyasını izleyin ve `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` için filtreleyin.

Discord ve diğer sohbet sağlayıcıları için oturum satırları soketin canlılığı anlamına gelmez.
`openclaw sessions`, Gateway `sessions.list` ve temsilci `sessions_list` aracı
saklanan konuşma durumunu okur. Bir sağlayıcı yeniden bağlanabilir ve herhangi bir
yeni oturum satırı oluşturulmadan önce sağlıklı kanal durumunu gösterebilir. Canlı
bağlantı kontrolleri için yukarıdaki kanal durumu ve sağlık komutlarını kullanın.

## Derin tanılama

- Diskteki kimlik bilgileri: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime yakın tarihli olmalıdır).
- Oturum deposu: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (yol yapılandırmada geçersiz kılınabilir). Sayı ve son alıcılar `status` aracılığıyla gösterilir.
- Yeniden bağlama akışı: günlüklerde 409-515 durum kodları veya `loggedOut` göründüğünde `openclaw channels logout && openclaw channels login --verbose`. (Not: QR giriş akışı, eşleştirmeden sonra 515 durumu için bir kez otomatik yeniden başlar.)
- Tanılama varsayılan olarak etkindir. `diagnostics.enabled: false` ayarlanmadığı sürece gateway operasyonel gerçekleri kaydeder. Bellek olayları RSS/heap bayt sayılarını, eşik baskısını ve büyüme baskısını kaydeder. Canlılık uyarıları, süreç çalışıyor ancak doygun durumdayken event-loop gecikmesini, event-loop kullanımını, CPU çekirdeği oranını ve etkin/bekleyen/kuyruğa alınmış oturum sayılarını kaydeder. Aşırı büyük yük olayları, mevcut olduğunda boyutlar ve sınırlarla birlikte neyin reddedildiğini, kırpıldığını veya parçalara bölündüğünü kaydeder. Mesaj metnini, ek içeriklerini, webhook gövdesini, ham istek veya yanıt gövdesini, token’ları, çerezleri ya da gizli değerleri kaydetmezler. Aynı Heartbeat, `openclaw gateway stability` veya `diagnostics.stability` Gateway RPC üzerinden kullanılabilen sınırlı kararlılık kaydedicisini başlatır. Ölümcül Gateway çıkışları, kapatma zaman aşımları ve yeniden başlatma başlangıç hataları, olaylar mevcut olduğunda en son kaydedici anlık görüntüsünü `~/.openclaw/logs/stability/` altında kalıcı hale getirir; en yeni kaydedilmiş paketi `openclaw gateway stability --bundle latest` ile inceleyin.
- Hata raporları için `openclaw gateway diagnostics export` çalıştırın ve oluşturulan zip dosyasını ekleyin. Dışa aktarım; bir Markdown özetini, en yeni kararlılık paketini, temizlenmiş günlük meta verilerini, temizlenmiş Gateway durum/sağlık anlık görüntülerini ve yapılandırma şeklini birleştirir. Paylaşılmak üzere tasarlanmıştır: sohbet metni, webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/mesaj tanımlayıcıları ve gizli değerler atlanır veya redakte edilir. Bkz. [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics).

## Sağlık izleyici yapılandırması

- `gateway.channelHealthCheckMinutes`: gateway’in kanal sağlığını ne sıklıkla denetlediği. Varsayılan: `5`. Sağlık izleyicisi yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın.
- `gateway.channelStaleEventThresholdMinutes`: bağlı bir kanalın, sağlık izleyicisi onu bayat kabul edip yeniden başlatmadan önce ne kadar süre boşta kalabileceği. Varsayılan: `30`. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun.
- `gateway.channelMaxRestartsPerHour`: kanal/hesap başına sağlık izleyicisi yeniden başlatmaları için kayan bir saatlik üst sınır. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleme etkin kalırken belirli bir kanal için sağlık izleyicisi yeniden başlatmalarını devre dışı bırakır.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kanal düzeyi ayarı geçersiz kılan çok hesaplı geçersiz kılma.
- Bu kanal başına geçersiz kılmalar, bugün bunları sunan yerleşik kanal izleyicilerine uygulanır: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram ve WhatsApp.

## Bir şey başarısız olduğunda

- `logged out` veya durum 409-515 → `openclaw channels logout` ve ardından `openclaw channels login` ile yeniden bağlayın.
- Gateway erişilemiyor → başlatın: `openclaw gateway --port 18789` (port meşgulse `--force` kullanın).
- Gelen mesaj yok → bağlı telefonun çevrimiçi olduğunu ve gönderenin izinli olduğunu doğrulayın (`channels.whatsapp.allowFrom`); grup sohbetleri için allowlist + mention kurallarının eşleştiğinden emin olun (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Özel "health" komutu

`openclaw health`, çalışan gateway’den sağlık anlık görüntüsünü ister (CLI’dan doğrudan
kanal soketleri yok). Varsayılan olarak yeni önbelleğe alınmış bir gateway anlık görüntüsü
döndürebilir; gateway daha sonra bu önbelleği arka planda yeniler. `openclaw health --verbose`
bunun yerine canlı yoklamayı zorlar. Komut, mevcut olduğunda bağlı kimlik bilgilerini/kimlik
doğrulama yaşını, kanal başına yoklama özetlerini, oturum deposu özetini ve yoklama süresini
raporlar. Gateway erişilemezse veya yoklama başarısız olursa/zaman aşımına uğrarsa sıfırdan
farklı kodla çıkar.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON çıktısı
- `--timeout <ms>`: varsayılan 10s yoklama zaman aşımını geçersiz kılar
- `--verbose`: canlı yoklamayı zorlar ve gateway bağlantı ayrıntılarını yazdırır
- `--debug`: `--verbose` için takma ad

Sağlık anlık görüntüsü şunları içerir: `ok` (boolean), `ts` (timestamp), `durationMs` (yoklama süresi), kanal başına durum, temsilci kullanılabilirliği ve oturum deposu özeti.

## İlgili

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
