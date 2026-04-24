---
read_when:
    - macOS uygulaması özelliklerini uygulama
    - macOS üzerinde gateway yaşam döngüsünü veya Node köprülemesini değiştirme
summary: OpenClaw macOS yardımcı uygulaması (menü çubuğu + gateway aracısı)
title: macOS uygulaması
x-i18n:
    generated_at: "2026-04-24T09:20:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

macOS uygulaması, OpenClaw için **menü çubuğu yardımcı uygulamasıdır**. İzinlere sahiptir,
Gateway'i yerelde (launchd veya manuel) yönetir/ona bağlanır ve macOS
yeteneklerini aracıya bir Node olarak açar.

## Ne yapar

- Yerel bildirimleri ve menü çubuğu durumunu gösterir.
- TCC istemlerine sahiptir (Bildirimler, Erişilebilirlik, Ekran Kaydı, Mikrofon,
  Konuşma Tanıma, Automation/AppleScript).
- Gateway'i çalıştırır veya ona bağlanır (yerel veya uzak).
- macOS'a özgü araçları açar (Canvas, Kamera, Ekran Kaydı, `system.run`).
- **Remote** modda yerel Node host hizmetini (launchd) başlatır ve **Local** modda durdurur.
- İsteğe bağlı olarak UI otomasyonu için **PeekabooBridge** barındırır.
- İstek üzerine genel CLI'yi (`openclaw`) npm, pnpm veya bun ile kurar (uygulama önce npm'i, sonra pnpm'i, sonra bun'ı tercih eder; Gateway için önerilen çalışma zamanı yine Node'dur).

## Yerel ve uzak mod

- **Local** (varsayılan): uygulama, varsa çalışan yerel Gateway'e bağlanır;
  yoksa `openclaw gateway install` ile launchd hizmetini etkinleştirir.
- **Remote**: uygulama, Gateway'e SSH/Tailscale üzerinden bağlanır ve asla
  yerel bir süreç başlatmaz.
  Uygulama, uzak Gateway'in bu Mac'e ulaşabilmesi için yerel **Node host service** hizmetini başlatır.
  Uygulama, Gateway'i alt süreç olarak başlatmaz.
  Gateway keşfi artık ham tailnet IP'leri yerine Tailscale MagicDNS adlarını tercih eder,
  böylece tailnet IP'leri değiştiğinde Mac uygulaması daha güvenilir şekilde toparlanır.

## Launchd denetimi

Uygulama, kullanıcı başına `ai.openclaw.gateway`
(veya `--profile`/`OPENCLAW_PROFILE` kullanıldığında `ai.openclaw.<profile>`; eski `com.openclaw.*` yine unload edilir) etiketli bir LaunchAgent yönetir.

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış profil çalıştırırken etiketi `ai.openclaw.<profile>` ile değiştirin.

LaunchAgent kurulu değilse uygulamadan etkinleştirin veya
`openclaw gateway install` çalıştırın.

## Node yetenekleri (mac)

macOS uygulaması kendini bir Node olarak sunar. Yaygın komutlar:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Ekran: `screen.snapshot`, `screen.record`
- Sistem: `system.run`, `system.notify`

Node, aracıların neye izin verildiğine karar verebilmesi için bir `permissions` eşlemesi bildirir.

Node service + uygulama IPC:

- Başsız Node host service çalışırken (remote mod), Gateway WS'ye bir Node olarak bağlanır.
- `system.run`, macOS uygulamasında (UI/TCC bağlamı) yerel Unix soketi üzerinden çalışır; istemler + çıktı uygulama içinde kalır.

Diyagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals (`system.run`)

`system.run`, macOS uygulamasındaki **Exec approvals** üzerinden denetlenir (Ayarlar → Exec approvals).
Güvenlik + sor + izin listesi Mac üzerinde şu konumda yerel olarak saklanır:

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

- `allowlist` girdileri çözülmüş binary yolları için glob desenleridir.
- Kabuk denetimi veya genişletme söz dizimi (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham kabuk komut metni, izin listesi kaçırması olarak değerlendirilir ve açık onay gerektirir (veya kabuk binary'sinin izin listesine alınmasını gerektirir).
- İstemde “Always Allow” seçmek o komutu izin listesine ekler.
- `system.run` ortam geçersiz kılmaları filtrelenir (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` kaldırılır) ve ardından uygulamanın ortamıyla birleştirilir.
- Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı ortam geçersiz kılmaları küçük, açık bir izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- İzin listesi modunda her zaman izin ver kararları için, bilinen dispatch sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir yolları kalıcılaştırır. Sarmalayıcıyı açmak güvenli değilse otomatik olarak hiçbir izin listesi girdisi kalıcılaştırılmaz.

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
- `key` (isteğe bağlı başıboş mod anahtarı)

Güvenlik:

- `key` olmadan uygulama onay ister.
- `key` olmadan uygulama, onay istemi için kısa mesaj sınırı uygular ve `deliver` / `to` / `channel` değerlerini yok sayar.
- Geçerli bir `key` ile çalıştırma başıboştur (kişisel otomasyonlar için amaçlanmıştır).

## İlk kurulum akışı (tipik)

1. **OpenClaw.app** kurun ve başlatın.
2. İzinler kontrol listesini tamamlayın (TCC istemleri).
3. **Local** modun etkin olduğundan ve Gateway'in çalıştığından emin olun.
4. Terminal erişimi istiyorsanız CLI'yi kurun.

## Durum dizini yerleşimi (macOS)

OpenClaw durum dizininizi iCloud veya diğer bulut eşlemeli klasörlere koymaktan kaçının.
Eşitleme destekli yollar gecikme ekleyebilir ve bazen
oturumlar ile kimlik bilgileri için dosya kilidi/eşitleme yarışlarına neden olabilir.

Aşağıdaki gibi eşitlenmeyen yerel bir durum yolu tercih edin:
__OC_I18N_900005__
`openclaw doctor`, durumu şu konumlarda algılarsa:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

uyarır ve yeniden yerel yola taşımayı önerir.

## Derleme ve geliştirme iş akışı (yerel)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (veya Xcode)
- Uygulamayı paketleyin: `scripts/package-mac-app.sh`

## Gateway bağlantısını hata ayıklama (macOS CLI)

Uygulamayı başlatmadan, macOS uygulamasının kullandığı aynı Gateway WebSocket el sıkışmasını ve keşif
mantığını çalıştırmak için hata ayıklama CLI'sini kullanın.
__OC_I18N_900006__
Bağlantı seçenekleri:

- `--url <ws://host:port>`: yapılandırmayı geçersiz kılar
- `--mode <local|remote>`: yapılandırmadan çözümler (varsayılan: yapılandırma veya local)
- `--probe`: yeni bir sağlık yoklamasını zorlar
- `--timeout <ms>`: istek zaman aşımı (varsayılan: `15000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

Keşif seçenekleri:

- `--include-local`: “local” olarak filtrelenecek gateway'leri dahil eder
- `--timeout <ms>`: genel keşif penceresi (varsayılan: `2000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

İpucu: macOS uygulamasının keşif işlem hattısının (`local.` artı yapılandırılmış geniş alan domain'i, geniş alan ve Tailscale Serve geri dönüşleri ile birlikte)
Node CLI'nin `dns-sd` tabanlı keşfinden
farklı olup olmadığını görmek için `openclaw gateway discover --json` komutuyla karşılaştırın.

## Uzak bağlantı tesisatı (SSH tünelleri)

macOS uygulaması **Remote** modda çalıştığında, yerel UI
bileşenlerinin uzak bir Gateway ile localhost üzerindeymiş gibi konuşabilmesi için bir SSH tüneli açar.

### Kontrol tüneli (Gateway WebSocket portu)

- **Amaç:** sağlık kontrolleri, durum, Web Chat, yapılandırma ve diğer denetim düzlemi çağrıları.
- **Yerel port:** Gateway portu (varsayılan `18789`), her zaman kararlıdır.
- **Uzak port:** uzak host üzerindeki aynı Gateway portu.
- **Davranış:** rastgele yerel port yoktur; uygulama mevcut sağlıklı tüneli yeniden kullanır
  veya gerekirse yeniden başlatır.
- **SSH biçimi:** BatchMode +
  ExitOnForwardFailure + keepalive seçenekleriyle `ssh -N -L <local>:127.0.0.1:<remote>`.
- **IP raporlama:** SSH tüneli loopback kullandığı için gateway Node
  IP'sini `127.0.0.1` olarak görür. Gerçek istemci
  IP'sinin görünmesini istiyorsanız **Direct (ws/wss)** aktarımı kullanın (bkz. [macOS uzak erişimi](/tr/platforms/mac/remote)).

Kurulum adımları için bkz. [macOS uzak erişimi](/tr/platforms/mac/remote). Protokol
ayrıntıları için bkz. [Gateway protokolü](/tr/gateway/protocol).

## İlgili belgeler

- [Gateway runbook](/tr/gateway)
- [Gateway (macOS)](/tr/platforms/mac/bundled-gateway)
- [macOS izinleri](/tr/platforms/mac/permissions)
- [Canvas](/tr/platforms/mac/canvas)
