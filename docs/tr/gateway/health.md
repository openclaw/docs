---
read_when:
    - Kanal bağlantısını veya Gateway durumunu tanılama
    - Durum denetimi CLI komutlarını ve seçeneklerini anlama
summary: Sağlık kontrolü komutları ve Gateway sağlık izleme sistemi
title: Sağlık kontrolleri
x-i18n:
    generated_at: "2026-07-16T17:10:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Tahminde bulunmadan kanal bağlantısını doğrulamak için kısa kılavuz.

## Hızlı kontroller

- `openclaw status` - yerel özet: gateway erişilebilirliği/modu, güncelleme ipucu, bağlı kanal kimlik doğrulamasının yaşı, oturumlar + son etkinlik.
- `openclaw status --all` - eksiksiz yerel tanılama (salt okunur, renkli, hata ayıklama amacıyla güvenle yapıştırılabilir).
- `openclaw status --deep` - desteklendiğinde hesap başına kanal yoklamaları dâhil olmak üzere çalışan gateway'den canlı yoklama ister (`probe:true` ile `health`).
- `openclaw status --usage` - model sağlayıcısı kullanım/kota anlık görüntülerini gösterir.
- `openclaw health` - çalışan gateway'den sağlık anlık görüntüsünü ister (yalnızca WS; CLI'dan doğrudan kanal soketi yoktur).
- `openclaw health --verbose` (`--debug` diğer adı) - canlı sağlık yoklamasını zorlar ve gateway bağlantı ayrıntılarını yazdırır.
- `openclaw health --json` - makine tarafından okunabilir sağlık anlık görüntüsü çıktısı.
- Aracıyı çağırmadan durum yanıtı almak için herhangi bir kanalda bağımsız sohbet komutu olarak `/status` gönderin.
- Günlükler: `/tmp/openclaw/openclaw-*.log` dosyasının sonunu izleyin ve `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` için filtreleyin.

Discord ve diğer sohbet sağlayıcılarında oturum satırları, soketin etkin olduğunu göstermez.
`openclaw sessions`, Gateway `sessions.list` ve aracının `sessions_list` aracı
depolanan konuşma durumunu okur. Bir sağlayıcı yeniden bağlanabilir ve yeni bir oturum
satırı oluşturulmadan önce sağlıklı kanal durumu gösterebilir. Canlı bağlantı kontrolleri
için yukarıdaki kanal durumu ve sağlık komutlarını kullanın.

## Ayrıntılı tanılama

- Diskteki kimlik bilgileri: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime yakın tarihli olmalıdır).
- Oturum deposu: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Sayı ve son alıcılar `status` aracılığıyla gösterilir.
- Yeniden bağlama akışı: günlüklerde 409-515 durum kodları veya `loggedOut` göründüğünde `openclaw channels logout && openclaw channels login --verbose`. QR oturum açma akışı, eşleştirmeden sonra 515 durumu için bir kez otomatik olarak yeniden başlatılır.
- Tanılama varsayılan olarak etkindir (`diagnostics.enabled: false` bunları devre dışı bırakır). Bellek olayları RSS/heap bayt sayılarını ve eşik/büyüme baskısını kaydeder; kritik bellek baskısı gateway günlük kaydedicisi üzerinden günlüğe yazılır ve `diagnostics.memoryPressureSnapshot: true` ayarlandığında ayrıca OOM öncesi kararlılık paketi (V8 heap istatistikleri, mevcut olduğunda Linux cgroup sayaçları, etkin kaynak sayıları, gizlenmiş göreli yola göre en büyük oturum/transkript dosyaları) oluşturur. Canlılık uyarıları, işlem çalıştığı ancak doygunluğa ulaştığı zaman olay döngüsü gecikmesini/kullanımını, CPU çekirdek oranını ve etkin/bekleyen/kuyruğa alınmış oturum sayılarını kaydeder. Aşırı büyük yük olayları, neyin reddedildiğini/kırpıldığını/parçalara ayrıldığını ve boyutlarla sınırları kaydeder; ileti metnini, ek içeriklerini, webhook gövdelerini, ham istek/yanıt gövdelerini, token'ları, çerezleri veya gizli değerleri asla kaydetmez.
- Aynı Heartbeat, sınırlı kararlılık kaydedicisini çalıştırır: `openclaw gateway stability` (veya `diagnostics.stability` Gateway RPC'si). Önemli Gateway çıkışları, kapatma zaman aşımları, yeniden başlatma sırasında başlangıç hataları ve (`diagnostics.memoryPressureSnapshot: true` olduğunda) kritik bellek baskısı, en son anlık görüntüyü `~/.openclaw/logs/stability/` altında kalıcı hâle getirir. En yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin.
- Hata raporları için `openclaw gateway diagnostics export` komutunu çalıştırın ve oluşturulan zip dosyasını ekleyin: bir Markdown özeti, en yeni kararlılık paketi, temizlenmiş günlük meta verileri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve yapılandırma şekli. Sohbet metni, webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/ileti tanımlayıcıları ve gizli değerler atlanır veya gizlenir. Bkz. [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics).

## Sağlık izleyicisi yapılandırması

- `gateway.channelHealthCheckMinutes`: gateway'in kanal sağlığını ne sıklıkta kontrol ettiği. Varsayılan: `5`. Sağlık izleyicisi yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın.
- `gateway.channelStaleEventThresholdMinutes`: bağlı bir kanalın, sağlık izleyicisi onu eski olarak değerlendirip yeniden başlatmadan önce ne kadar süre boşta kalabileceği. Varsayılan: `30`. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya bu değere eşit tutun.
- `gateway.channelMaxRestartsPerHour`: kanal/hesap başına sağlık izleyicisi yeniden başlatmaları için bir saatlik kayan sınır. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izlemeyi etkin bırakırken belirli bir kanal için sağlık izleyicisi yeniden başlatmalarını devre dışı bırakır.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kanal düzeyindeki ayara göre öncelikli olan çok hesaplı geçersiz kılma.
- Bu kanal başına geçersiz kılmalar, bugün bunları sunan yerleşik kanallar için geçerlidir: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram ve WhatsApp.

## Çalışma süresi izleme

Harici çalışma süresi izleme hizmetleri `/v1/chat/completions` değil, özel `/health` uç noktasını kullanmalıdır.

- **KULLANIN:** `GET /health` - anında yanıt verir, oturum oluşturmaz, LLM çağrısı yapmaz, `{"ok":true,"status":"live"}` döndürür
- **KULLANMAYIN:** sağlık kontrolleri için `/v1/chat/completions` - her istek Skills anlık görüntüsü, bağlam derlemesi ve LLM çağrılarıyla tam bir aracı oturumu oluşturur

`x-openclaw-session-key` üstbilgisi veya `user` alanı sağlanmadığında, `/v1/chat/completions` her istek için yeni ve rastgele bir oturum oluşturur. Her 15 dakikada bir yoklama yapan izleme hizmetleri günde ~96 oturum oluşturur ve bunların her biri 4-22KB tüketir. Bu durum zamanla oturum deposunun şişmesine ve bağlam penceresinin taşmasına yol açabilir.

### İzleme hizmeti kurulum örnekleri

- **BetterStack:** Sağlık kontrolü URL'sini `https://<your-gateway-host>:<port>/health` olarak ayarlayın
- **UptimeRobot:** `https://<your-gateway-host>:<port>/health` URL'siyle yeni bir HTTP izleyicisi ekleyin
- **Genel:** `/health` adresine yapılan herhangi bir HTTP GET isteği, gateway sağlıklı olduğunda `{"ok":true}` ile 200 döndürür

## Bir şey başarısız olduğunda

- `logged out` veya 409-515 durumu -> `openclaw channels logout` ve ardından `openclaw channels login` ile yeniden bağlayın.
- Gateway'e erişilemiyor -> başlatın: `openclaw gateway --port 18789` (bağlantı noktası meşgulse `--force` kullanın).
- Gelen ileti yok -> bağlı telefonun çevrimiçi olduğunu ve gönderene izin verildiğini doğrulayın (`channels.whatsapp.allowFrom`); grup sohbetlerinde izin listesi + bahsetme kurallarının eşleştiğinden emin olun (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Özel "health" komutu

`openclaw health`, çalışan gateway'den sağlık anlık görüntüsünü ister (CLI'dan doğrudan kanal
soketi kullanılmaz). Varsayılan olarak yeni bir önbelleğe alınmış gateway anlık görüntüsü döndürür ve
gateway bu önbelleği arka planda yeniler; `--verbose` bunun yerine canlı yoklamayı zorlar.
Komut, mevcut olduğunda bağlı kimlik bilgilerinin/kimlik doğrulamanın yaşını, kanal başına yoklama özetlerini,
oturum deposu özetini ve yoklama süresini bildirir. Gateway'e erişilemiyorsa veya yoklama
başarısız olursa/zaman aşımına uğrarsa sıfırdan farklı bir kodla çıkar.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON çıktısı
- `--timeout <ms>`: varsayılan 10s yoklama zaman aşımını geçersiz kılar
- `--verbose`: canlı yoklamayı zorlar ve gateway bağlantı ayrıntılarını yazdırır
- `--debug`: `--verbose` için diğer ad

Sağlık anlık görüntüsü şunları içerir: `ok` (boole), `ts` (zaman damgası), `durationMs` (yoklama süresi), kanal başına durum, aracı kullanılabilirliği ve oturum deposu özeti.

## İlgili

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
