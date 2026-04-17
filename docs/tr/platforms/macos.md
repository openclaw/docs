---
read_when:
    - macOS uygulama özelliklerini uygulama
    - macOS’ta Gateway yaşam döngüsünü veya Node köprülemesini değiştirme
summary: OpenClaw macOS yardımcı uygulaması (menü çubuğu + Gateway aracısı)
title: macOS Uygulaması
x-i18n:
    generated_at: "2026-04-17T08:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d637df2f73ced110223c48ea3c934045d782e150a46495f434cf924a6a00baf0
    source_path: platforms/macos.md
    workflow: 15
---

# OpenClaw macOS Yardımcısı (menü çubuğu + Gateway aracısı)

macOS uygulaması, OpenClaw için **menü çubuğu yardımcısıdır**. İzinleri yönetir, Gateway’i yerel olarak yönetir/ona bağlanır (launchd veya manuel) ve macOS yeteneklerini düğüm olarak agente sunar.

## Ne yapar

- Menü çubuğunda yerel bildirimleri ve durumu gösterir.
- TCC istemlerini yönetir (Bildirimler, Erişilebilirlik, Ekran Kaydı, Mikrofon, Konuşma Tanıma, Otomasyon/AppleScript).
- Gateway’i çalıştırır veya ona bağlanır (yerel ya da uzak).
- Yalnızca macOS’a özgü araçları sunar (Canvas, Camera, Screen Recording, `system.run`).
- Yerel düğüm ana hizmetini **remote** modda başlatır (launchd) ve **local** modda durdurur.
- İsteğe bağlı olarak UI otomasyonu için **PeekabooBridge** barındırır.
- Genel CLI’ı (`openclaw`) istek üzerine npm, pnpm veya bun aracılığıyla kurar (uygulama önce npm’i, sonra pnpm’i, sonra bun’ı tercih eder; önerilen Gateway çalışma zamanı ise hâlâ Node’dur).

## Yerel ve uzak mod

- **Local** (varsayılan): uygulama, varsa çalışan bir yerel Gateway’e bağlanır; yoksa launchd hizmetini `openclaw gateway install` ile etkinleştirir.
- **Remote**: uygulama, SSH/Tailscale üzerinden bir Gateway’e bağlanır ve asla yerel bir süreç başlatmaz.
  Uygulama, uzak Gateway’in bu Mac’e erişebilmesi için yerel **node host service** hizmetini başlatır.
  Uygulama, Gateway’i alt süreç olarak başlatmaz.
  Gateway bulma artık ham tailnet IP’leri yerine Tailscale MagicDNS adlarını tercih eder, böylece tailnet IP’leri değiştiğinde Mac uygulaması daha güvenilir şekilde toparlanır.

## Launchd denetimi

Uygulama, `ai.openclaw.gateway` etiketli kullanıcı başına bir LaunchAgent yönetir
(`--profile`/`OPENCLAW_PROFILE` kullanıldığında `ai.openclaw.<profile>`; eski `com.openclaw.*` yine de unload edilir).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış bir profil çalıştırırken etiketi `ai.openclaw.<profile>` ile değiştirin.

LaunchAgent kurulu değilse, uygulamadan etkinleştirin veya
`openclaw gateway install` çalıştırın.

## Düğüm yetenekleri (mac)

macOS uygulaması kendini bir düğüm olarak sunar. Yaygın komutlar:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Düğüm, agentlerin neye izin verildiğine karar verebilmesi için bir `permissions` eşlemesi bildirir.

Düğüm hizmeti + uygulama IPC:

- Başsız düğüm ana hizmeti çalışırken (remote mod), Gateway WS’ye bir düğüm olarak bağlanır.
- `system.run`, yerel bir Unix soketi üzerinden macOS uygulamasında (UI/TCC bağlamı) yürütülür; istemler ve çıktı uygulama içinde kalır.

Diyagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Yürütme onayları (system.run)

`system.run`, macOS uygulamasındaki **Exec approvals** ile denetlenir (Ayarlar → Exec approvals).
Güvenlik + sor + izin listesi, Mac üzerinde yerel olarak şu dosyada saklanır:

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

- `allowlist` girdileri, çözümlenmiş ikili dosya yolları için glob desenleridir.
- Kabuk denetimi veya genişletme söz dizimi içeren ham kabuk komut metni (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) izin listesi kaçırması olarak değerlendirilir ve açık onay gerektirir (veya kabuk ikilisinin izin listesine alınmasını).
- İstemde “Always Allow” seçildiğinde, bu komut izin listesine eklenir.
- `system.run` ortam değişkeni geçersiz kılmaları filtrelenir (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` çıkarılır) ve ardından uygulamanın ortamıyla birleştirilir.
- Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı ortam geçersiz kılmaları küçük ve açık bir izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- İzin listesi modunda her zaman izin ver kararları için, bilinen yönlendirme sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir dosya yollarını kalıcılaştırır. Sarmalayıcının açılması güvenli değilse, otomatik olarak hiçbir izin listesi girdisi kalıcılaştırılmaz.

## Derin bağlantılar

Uygulama, yerel işlemler için `openclaw://` URL şemasını kaydeder.

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
- `key` olmadan uygulama, onay istemi için kısa bir mesaj sınırı uygular ve `deliver` / `to` / `channel` değerlerini yok sayar.
- Geçerli bir `key` ile çalıştırma gözetimsiz olur (kişisel otomasyonlar için tasarlanmıştır).

## İlk kurulum akışı (tipik)

1. **OpenClaw.app** uygulamasını kurun ve başlatın.
2. İzinler denetim listesini tamamlayın (TCC istemleri).
3. **Local** modun etkin ve Gateway’in çalışıyor olduğundan emin olun.
4. Terminal erişimi istiyorsanız CLI’ı kurun.

## Durum dizini yerleşimi (macOS)

OpenClaw durum dizininizi iCloud veya bulutla eşitlenen başka klasörlere koymaktan kaçının.
Eşitleme destekli yollar gecikme ekleyebilir ve bazen oturumlar ile kimlik bilgileri için dosya kilidi/eşitleme yarışlarına neden olabilir.

Şunun gibi eşitlenmeyen yerel bir durum yolu tercih edin:
__OC_I18N_900005__
`openclaw doctor`, durumun şu yollar altında olduğunu algılarsa:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

uyarı verir ve tekrar yerel bir yola taşımayı önerir.

## Derleme ve geliştirme iş akışı (yerel)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (veya Xcode)
- Uygulamayı paketleme: `scripts/package-mac-app.sh`

## Gateway bağlantısını ayıklama (macOS CLI)

Uygulamayı başlatmadan, macOS uygulamasının kullandığı aynı Gateway WebSocket el sıkışmasını ve bulma mantığını çalıştırmak için hata ayıklama CLI’ını kullanın.
__OC_I18N_900006__
Bağlantı seçenekleri:

- `--url <ws://host:port>`: yapılandırmayı geçersiz kılar
- `--mode <local|remote>`: yapılandırmadan çözümler (varsayılan: yapılandırma veya local)
- `--probe`: yeni bir sağlık yoklamasını zorlar
- `--timeout <ms>`: istek zaman aşımı (varsayılan: `15000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

Bulma seçenekleri:

- `--include-local`: “local” olarak filtrelenecek Gateway’leri dahil eder
- `--timeout <ms>`: genel bulma penceresi (varsayılan: `2000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

İpucu: macOS uygulamasının bulma hattının (`local.` artı yapılandırılmış geniş alan etki alanı; geniş alan ve Tailscale Serve geri dönüşleriyle birlikte), Node CLI’nın `dns-sd` tabanlı bulmasından farklı olup olmadığını görmek için `openclaw gateway discover --json` ile karşılaştırın.

## Uzak bağlantı altyapısı (SSH tünelleri)

macOS uygulaması **Remote** modda çalıştığında, yerel UI bileşenlerinin uzak bir Gateway ile sanki localhost üzerindeymiş gibi konuşabilmesi için bir SSH tüneli açar.

### Denetim tüneli (Gateway WebSocket portu)

- **Amaç:** sağlık denetimleri, durum, Web Chat, yapılandırma ve diğer kontrol düzlemi çağrıları.
- **Yerel port:** Gateway portu (varsayılan `18789`), her zaman sabittir.
- **Uzak port:** uzak ana makinedeki aynı Gateway portu.
- **Davranış:** rastgele yerel port yoktur; uygulama mevcut sağlıklı tüneli yeniden kullanır veya gerekirse yeniden başlatır.
- **SSH biçimi:** BatchMode + ExitOnForwardFailure + keepalive seçenekleri ile `ssh -N -L <local>:127.0.0.1:<remote>`.
- **IP raporlama:** SSH tüneli loopback kullandığından, gateway düğüm IP’sini `127.0.0.1` olarak görür. Gerçek istemci IP’sinin görünmesini istiyorsanız **Direct (ws/wss)** taşımasını kullanın (bkz. [macOS remote access](/tr/platforms/mac/remote)).

Kurulum adımları için [macOS remote access](/tr/platforms/mac/remote) bölümüne bakın. Protokol ayrıntıları için [Gateway protocol](/tr/gateway/protocol) bölümüne bakın.

## İlgili belgeler

- [Gateway runbook](/tr/gateway)
- [Gateway (macOS)](/tr/platforms/mac/bundled-gateway)
- [macOS permissions](/tr/platforms/mac/permissions)
- [Canvas](/tr/platforms/mac/canvas)
