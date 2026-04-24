---
read_when:
    - mac uygulamasını Gateway yaşam döngüsüyle entegre etme
summary: Gateway yaşam döngüsü macOS üzerinde (launchd)
title: Gateway yaşam döngüsü
x-i18n:
    generated_at: "2026-04-24T09:19:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# macOS üzerinde Gateway yaşam döngüsü

macOS uygulaması varsayılan olarak **Gateway'i launchd üzerinden yönetir** ve
Gateway'i alt süreç olarak başlatmaz. Önce yapılandırılmış portta zaten çalışan bir
Gateway'e bağlanmayı dener; ulaşılabilir bir örnek yoksa, harici `openclaw` CLI üzerinden
launchd hizmetini etkinleştirir (gömülü çalışma zamanı yok). Bu, oturum açıldığında güvenilir otomatik başlatma ve çökme sonrası yeniden başlatma sağlar.

Alt süreç modu (Gateway'in uygulama tarafından doğrudan başlatılması) bugün **kullanımda değildir**.
UI ile daha sıkı bağ kurmanız gerekiyorsa Gateway'i terminalde elle çalıştırın.

## Varsayılan davranış (launchd)

- Uygulama, `ai.openclaw.gateway` etiketli kullanıcı başına bir LaunchAgent yükler
  (veya `--profile`/`OPENCLAW_PROFILE` kullanılırken `ai.openclaw.<profile>`; eski `com.openclaw.*` desteklenir).
- Yerel mod etkin olduğunda uygulama LaunchAgent'ın yüklü olduğundan emin olur ve
  gerekirse Gateway'i başlatır.
- Günlükler, launchd Gateway günlük yoluna yazılır (Debug Settings içinde görülebilir).

Yaygın komutlar:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış profil çalıştırıyorsanız etiketi `ai.openclaw.<profile>` ile değiştirin.

## İmzalanmamış geliştirme yapıları

`scripts/restart-mac.sh --no-sign`, imzalama anahtarlarınız olmadığında hızlı yerel yapılar içindir. launchd'nin imzalanmamış bir relay ikilisini işaret etmesini önlemek için şunu yapar:

- `~/.openclaw/disable-launchagent` dosyasını yazar.

İmzalı `scripts/restart-mac.sh` çalıştırmaları, bu işaret mevcutsa bu geçersiz kılmayı temizler. Elle sıfırlamak için:

```bash
rm ~/.openclaw/disable-launchagent
```

## Yalnızca bağlan modu

macOS uygulamasının **launchd'yi asla kurmamasını veya yönetmemesini** zorlamak için
onu `--attach-only` (veya `--no-launchd`) ile başlatın. Bu, `~/.openclaw/disable-launchagent`
ayarını yapar; böylece uygulama yalnızca zaten çalışan bir Gateway'e bağlanır. Aynı
davranışı Debug Settings içinde de açıp kapatabilirsiniz.

## Uzak mod

Uzak mod hiçbir zaman yerel Gateway başlatmaz. Uygulama uzak ana bilgisayara bir
SSH tüneli kullanır ve bu tünel üzerinden bağlanır.

## Neden launchd'yi tercih ediyoruz

- Oturum açıldığında otomatik başlatma.
- Yerleşik yeniden başlatma/KeepAlive semantiği.
- Öngörülebilir günlükler ve denetim.

Gerçek bir alt süreç moduna bir gün yeniden ihtiyaç duyulursa, bu
ayrı ve açık bir yalnızca geliştirme modu olarak belgelenmelidir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Gateway runbook](/tr/gateway)
