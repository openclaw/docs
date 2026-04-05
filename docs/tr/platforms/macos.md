---
read_when:
    - macOS uygulaması özelliklerini uygularken
    - macOS üzerinde gateway yaşam döngüsünü veya düğüm köprülemesini değiştirirken
summary: OpenClaw macOS yardımcı uygulaması (menü çubuğu + gateway aracısı)
title: macOS Uygulaması
x-i18n:
    generated_at: "2026-04-05T14:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# OpenClaw macOS Yardımcısı (menü çubuğu + gateway aracısı)

macOS uygulaması, OpenClaw için **menü çubuğu yardımcısıdır**. İzinleri yönetir,
Gateway'i yerel olarak yönetir/ona bağlanır (launchd veya el ile) ve macOS
yeteneklerini ajan için bir düğüm olarak açığa çıkarır.

## Ne yapar

- Menü çubuğunda yerel bildirimleri ve durumu gösterir.
- TCC istemlerini yönetir (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript).
- Gateway'i çalıştırır veya ona bağlanır (yerel ya da uzak).
- Yalnızca macOS'e özgü araçları açığa çıkarır (Canvas, Camera, Screen Recording, `system.run`).
- **Uzak** modda yerel düğüm ana makinesi hizmetini başlatır (launchd), **yerel** modda durdurur.
- İsteğe bağlı olarak UI otomasyonu için **PeekabooBridge** barındırır.
- İstek üzerine npm, pnpm veya bun üzerinden genel CLI'yi (`openclaw`) kurar (uygulama önce npm'i, sonra pnpm'i, sonra bun'ı tercih eder; Node önerilen Gateway çalışma zamanı olmaya devam eder).

## Yerel ve uzak mod

- **Yerel** (varsayılan): uygulama, varsa çalışan yerel bir Gateway'e bağlanır;
  aksi halde `openclaw gateway install` ile launchd hizmetini etkinleştirir.
- **Uzak**: uygulama, SSH/Tailscale üzerinden bir Gateway'e bağlanır ve asla
  yerel bir işlem başlatmaz.
  Uzak Gateway'in bu Mac'e ulaşabilmesi için uygulama yerel **düğüm ana makinesi hizmetini** başlatır.
  Uygulama Gateway'i alt işlem olarak oluşturmaz.
  Gateway keşfi artık ham tailnet IP'leri yerine Tailscale MagicDNS adlarını tercih eder,
  böylece tailnet IP'leri değiştiğinde Mac uygulaması daha güvenilir şekilde toparlanır.

## Launchd denetimi

Uygulama, `ai.openclaw.gateway` etiketli kullanıcı başına bir LaunchAgent yönetir
(`--profile`/`OPENCLAW_PROFILE` kullanıldığında `ai.openclaw.<profile>`; eski `com.openclaw.*` yine de kaldırılır).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış bir profil çalıştırırken etiketi `ai.openclaw.<profile>` ile değiştirin.

LaunchAgent kurulu değilse, uygulamadan etkinleştirin veya
`openclaw gateway install` komutunu çalıştırın.

## Düğüm yetenekleri (mac)

macOS uygulaması kendisini bir düğüm olarak sunar. Yaygın komutlar:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Ekran: `screen.record`
- Sistem: `system.run`, `system.notify`

Düğüm, ajanların neye izin verildiğine karar verebilmesi için bir `permissions` eşlemi bildirir.

Düğüm hizmeti + uygulama IPC:

- Başsız düğüm ana makinesi hizmeti çalıştığında (uzak mod), Gateway WS'ye bir düğüm olarak bağlanır.
- `system.run`, yerel bir Unix soketi üzerinden macOS uygulamasında (UI/TCC bağlamı) yürütülür; istemler ve çıktı uygulama içinde kalır.

Diyagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Yürütme onayları (`system.run`)

`system.run`, macOS uygulamasındaki **Exec approvals** tarafından denetlenir (Settings → Exec approvals).
Güvenlik + sorma + izin listesi Mac üzerinde yerel olarak şurada saklanır:

```
~/.openclaw/exec-approvals.json
```

Örnek:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Notlar:

- `allowlist` girdileri, çözümlenmiş ikili dosya yolları için glob kalıplarıdır.
- Kabuk denetim veya genişletme söz dizimi (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham kabuk komut metni, izin listesi kaçırması olarak değerlendirilir ve açık onay gerektirir (veya kabuk ikili dosyasının izin listesine alınmasını).
- İstemde “Always Allow” seçmek, bu komutu izin listesine ekler.
- `system.run` ortam geçersiz kılmaları filtrelenir (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` kaldırılır) ve ardından uygulamanın ortamıyla birleştirilir.
- Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı ortam geçersiz kılmaları küçük ve açık bir izin listesine indirilir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- İzin listesi modundaki her zaman izin ver kararlarında, bilinen gönderim sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir dosya yollarını kalıcılaştırır. Sarmalı açmak güvenli değilse, otomatik olarak hiçbir izin listesi girdisi kalıcılaştırılmaz.

## Deep link'ler

Uygulama, yerel eylemler için `openclaw://` URL şemasını kaydeder.

### `openclaw://agent`

Bir Gateway `agent` isteğini tetikler.
__OC_I18N_900004__
Sorgu parametreleri:

- `message` (zorunlu)
- `sessionKey` (isteğe bağlı)
- `thinking` (isteğe bağlı)
- `deliver` / `to` / `channel` (isteğe bağlı)
- `timeoutSeconds` (isteğe bağlı)
- `key` (isteğe bağlı gözetimsiz mod anahtarı)

Güvenlik:

- `key` olmadan uygulama onay ister.
- `key` olmadan uygulama, onay istemi için kısa mesaj sınırı uygular ve `deliver` / `to` / `channel` parametrelerini yok sayar.
- Geçerli bir `key` ile çalışma gözetimsizdir (kişisel otomasyonlar için tasarlanmıştır).

## Onboarding akışı (tipik)

1. **OpenClaw.app** uygulamasını kurun ve başlatın.
2. İzinler kontrol listesini tamamlayın (TCC istemleri).
3. **Yerel** modun etkin olduğundan ve Gateway'in çalıştığından emin olun.
4. Terminal erişimi istiyorsanız CLI'yi kurun.

## Durum dizini yerleşimi (macOS)

OpenClaw durum dizininizi iCloud veya bulutla eşitlenen başka klasörlere koymaktan kaçının.
Eşitleme destekli yollar gecikme ekleyebilir ve zaman zaman
oturumlar ile kimlik bilgileri için dosya kilidi/eşitleme yarışlarına neden olabilir.

Şu gibi yerel, eşitlenmeyen bir durum yolu tercih edin:
__OC_I18N_900005__
`openclaw doctor`, durum dizinini şuralarda algılarsa:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

uyarır ve yeniden yerel bir yola taşımayı önerir.

## Derleme ve geliştirme iş akışı (yerel)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (veya Xcode)
- Uygulamayı paketleyin: `scripts/package-mac-app.sh`

## Gateway bağlantısını hata ayıklama (macOS CLI)

Uygulamayı başlatmadan, macOS uygulamasının kullandığı aynı Gateway WebSocket el sıkışmasını ve keşif
mantığını sınamak için hata ayıklama CLI'sini kullanın.
__OC_I18N_900006__
Bağlantı seçenekleri:

- `--url <ws://host:port>`: yapılandırmayı geçersiz kıl
- `--mode <local|remote>`: yapılandırmadan çözümle (varsayılan: yapılandırma veya yerel)
- `--probe`: yeni bir sağlık yoklamasını zorla
- `--timeout <ms>`: istek zaman aşımı (varsayılan: `15000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

Keşif seçenekleri:

- `--include-local`: “yerel” olarak filtrelenecek gateway'leri dahil et
- `--timeout <ms>`: genel keşif penceresi (varsayılan: `2000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

İpucu: macOS uygulamasının keşif işlem hattısının (`local.` ile yapılandırılmış geniş alan etki alanı,
geniş alan ve Tailscale Serve yedekleriyle birlikte) Node CLI'nin `dns-sd` tabanlı keşfinden
farklı olup olmadığını görmek için `openclaw gateway discover --json` ile karşılaştırın.

## Uzak bağlantı altyapısı (SSH tünelleri)

macOS uygulaması **Uzak** modda çalıştığında, yerel UI
bileşenlerinin uzak bir Gateway ile sanki localhost üzerindeymiş gibi konuşabilmesi için bir SSH tüneli açar.

### Kontrol tüneli (Gateway WebSocket portu)

- **Amaç:** sağlık denetimleri, durum, Web Chat, yapılandırma ve diğer kontrol düzlemi çağrıları.
- **Yerel port:** Gateway portu (varsayılan `18789`), her zaman sabittir.
- **Uzak port:** uzak ana makinedeki aynı Gateway portu.
- **Davranış:** rastgele yerel port yoktur; uygulama mevcut sağlıklı bir tüneli yeniden kullanır
  veya gerekirse yeniden başlatır.
- **SSH biçimi:** BatchMode +
  ExitOnForwardFailure + keepalive seçenekleriyle `ssh -N -L <local>:127.0.0.1:<remote>`.
- **IP bildirimi:** SSH tüneli loopback kullanır, bu yüzden gateway düğüm
  IP'sini `127.0.0.1` olarak görür. Gerçek istemci
  IP'sinin görünmesini istiyorsanız **Direct (ws/wss)** taşımayı kullanın (bkz. [macOS uzak erişim](/platforms/mac/remote)).

Kurulum adımları için [macOS uzak erişim](/platforms/mac/remote) bölümüne bakın. Protokol
ayrıntıları için [Gateway protokolü](/tr/gateway/protocol) bölümüne bakın.

## İlgili dokümanlar

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [macOS izinleri](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
