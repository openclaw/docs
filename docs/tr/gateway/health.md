---
read_when:
    - Kanal bağlantısını veya gateway sağlığını teşhis etme
    - Sağlık denetimi CLI komutlarını ve seçeneklerini anlama
summary: Sağlık denetimi komutları ve gateway sağlık izleme
title: Sağlık Denetimleri
x-i18n:
    generated_at: "2026-04-05T13:52:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8824bca34c4d1139f043481c75f0a65d83e54008898c34cf69c6f98fd04e819
    source_path: gateway/health.md
    workflow: 15
---

# Sağlık Denetimleri (CLI)

Tahmin yürütmeden kanal bağlantısını doğrulamak için kısa kılavuz.

## Hızlı denetimler

- `openclaw status` — yerel özet: gateway erişilebilirliği/modu, güncelleme ipucu, bağlı kanal kimlik doğrulama yaşı, oturumlar + son etkinlik.
- `openclaw status --all` — tam yerel teşhis (salt okunur, renkli, hata ayıklama için güvenle yapıştırılabilir).
- `openclaw status --deep` — çalışan gateway’den canlı sağlık probu ister (`probe:true` ile `health`), destekleniyorsa hesap başına kanal probları da dahil.
- `openclaw health` — çalışan gateway’den sağlık anlık görüntüsünü ister (yalnızca WS; CLI’den doğrudan kanal soketleri yoktur).
- `openclaw health --verbose` — canlı sağlık probunu zorlar ve gateway bağlantı ayrıntılarını yazdırır.
- `openclaw health --json` — makine tarafından okunabilir sağlık anlık görüntüsü çıktısı.
- Agent’ı çağırmadan durum yanıtı almak için WhatsApp/WebChat içinde bağımsız bir mesaj olarak `/status` gönderin.
- Günlükler: `/tmp/openclaw/openclaw-*.log` dosyasını izleyin ve `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` için filtreleyin.

## Derin teşhis

- Diskteki kimlik bilgileri: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` yakın zamanlı olmalıdır).
- Oturum deposu: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (yol yapılandırmada geçersiz kılınabilir). Sayı ve son alıcılar `status` üzerinden gösterilir.
- Yeniden bağlama akışı: günlüklerde durum kodları 409–515 veya `loggedOut` göründüğünde `openclaw channels logout && openclaw channels login --verbose`. (Not: QR giriş akışı, eşleştirmeden sonra durum 515 için bir kez otomatik yeniden başlar.)

## Sağlık izleyici yapılandırması

- `gateway.channelHealthCheckMinutes`: gateway’in kanal sağlığını ne sıklıkla denetlediği. Varsayılan: `5`. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın.
- `gateway.channelStaleEventThresholdMinutes`: bağlı bir kanalın sağlık izleyicinin onu bayat kabul edip yeniden başlatmasından önce ne kadar süre boşta kalabileceği. Varsayılan: `30`. Bunu `gateway.channelHealthCheckMinutes` değerine eşit veya daha büyük tutun.
- `gateway.channelMaxRestartsPerHour`: kanal/hesap başına sağlık izleyici yeniden başlatmaları için kayan bir saatlik üst sınır. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izlemeyi açık bırakırken belirli bir kanal için sağlık izleyici yeniden başlatmalarını devre dışı bırakır.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kanal düzeyi ayara üstün gelen çoklu hesap geçersiz kılması.
- Bu kanal başına geçersiz kılmalar, bugün bunları sunan yerleşik kanal izleyicilerine uygulanır: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram ve WhatsApp.

## Bir şey başarısız olduğunda

- `logged out` veya durum 409–515 → `openclaw channels logout`, ardından `openclaw channels login` ile yeniden bağlayın.
- Gateway erişilemiyor → başlatın: `openclaw gateway --port 18789` (port meşgulse `--force` kullanın).
- Gelen mesaj yok → bağlı telefonun çevrimiçi olduğunu ve gönderenin izinli olduğunu doğrulayın (`channels.whatsapp.allowFrom`); grup sohbetleri için allowlist + mention kurallarının eşleştiğinden emin olun (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Ayrı `health` komutu

`openclaw health`, çalışan gateway’den sağlık anlık görüntüsünü ister (CLI’den doğrudan kanal
soketleri yoktur). Varsayılan olarak yeni bir önbellekli gateway anlık görüntüsü döndürebilir; gateway
ardından bu önbelleği arka planda yeniler. `openclaw health --verbose`
bunun yerine canlı probu zorlar. Komut, mevcut olduğunda bağlı kimlik bilgilerini/kimlik doğrulama yaşını,
kanal başına prob özetlerini, oturum deposu özetini ve prob süresini bildirir. Gateway’e
ulaşılamazsa veya prob başarısız olursa/zaman aşımına uğrarsa sıfır olmayan kodla çıkar.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON çıktısı
- `--timeout <ms>`: varsayılan 10 saniyelik prob zaman aşımını geçersiz kılar
- `--verbose`: canlı probu zorlar ve gateway bağlantı ayrıntılarını yazdırır
- `--debug`: `--verbose` için takma ad

Sağlık anlık görüntüsü şunları içerir: `ok` (boolean), `ts` (zaman damgası), `durationMs` (prob süresi), kanal başına durum, agent kullanılabilirliği ve oturum deposu özeti.
