---
read_when:
    - macOS uygulama özelliklerini geliştirme
    - macOS’ta Gateway yaşam döngüsünü veya Node köprülemeyi değiştirme
summary: OpenClaw macOS yardımcı uygulaması (menü çubuğu + Gateway aracısı)
title: macOS uygulaması
x-i18n:
    generated_at: "2026-04-30T09:32:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

macOS uygulaması, OpenClaw için **menü çubuğu yardımcısıdır**. İzinleri sahiplenir,
Gateway’i yerelde yönetir/ona bağlanır (launchd veya manuel) ve macOS
yeteneklerini ajana bir düğüm olarak sunar.

## Ne yapar

- Menü çubuğunda yerel bildirimleri ve durumu gösterir.
- TCC istemlerini sahiplenir (Bildirimler, Erişilebilirlik, Ekran Kaydı, Mikrofon,
  Konuşma Tanıma, Otomasyon/AppleScript).
- Gateway’i çalıştırır veya ona bağlanır (yerel ya da uzak).
- Yalnızca macOS’a özgü araçları sunar (Canvas, Kamera, Ekran Kaydı, `system.run`).
- **uzak** modda yerel düğüm ana makine hizmetini başlatır (launchd), **yerel** modda ise durdurur.
- İsteğe bağlı olarak UI otomasyonu için **PeekabooBridge** barındırır.
- İstek üzerine npm, pnpm veya bun aracılığıyla global CLI’yı (`openclaw`) kurar (uygulama önce npm’i, sonra pnpm’i, sonra bun’ı tercih eder; Node önerilen Gateway çalışma zamanı olmaya devam eder).

## Yerel ve uzak mod

- **Yerel** (varsayılan): varsa uygulama çalışan yerel bir Gateway’e bağlanır;
  yoksa `openclaw gateway install` aracılığıyla launchd hizmetini etkinleştirir.
- **Uzak**: uygulama SSH/Tailscale üzerinden bir Gateway’e bağlanır ve hiçbir zaman
  yerel bir süreç başlatmaz.
  Uygulama, uzak Gateway’in bu Mac’e erişebilmesi için yerel **düğüm ana makine hizmetini** başlatır.
  Uygulama Gateway’i alt süreç olarak başlatmaz.
  Gateway keşfi artık ham tailnet IP’leri yerine Tailscale MagicDNS adlarını tercih eder,
  böylece Mac uygulaması tailnet IP’leri değiştiğinde daha güvenilir şekilde toparlanır.

## Launchd denetimi

Uygulama, `ai.openclaw.gateway` etiketli kullanıcı başına bir LaunchAgent’ı yönetir
(`--profile`/`OPENCLAW_PROFILE` kullanılırken `ai.openclaw.<profile>`; eski `com.openclaw.*` hâlâ kaldırılır).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış bir profil çalıştırırken etiketi `ai.openclaw.<profile>` ile değiştirin.

LaunchAgent kurulu değilse uygulamadan etkinleştirin veya
`openclaw gateway install` çalıştırın.

## Düğüm yetenekleri (mac)

macOS uygulaması kendisini bir düğüm olarak sunar. Yaygın komutlar:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Ekran: `screen.snapshot`, `screen.record`
- Sistem: `system.run`, `system.notify`

Düğüm, ajanların neye izin verildiğine karar verebilmesi için bir `permissions` haritası bildirir.

Düğüm hizmeti + uygulama IPC:

- Başsız düğüm ana makine hizmeti çalışırken (uzak mod), Gateway WS’ye bir düğüm olarak bağlanır.
- `system.run`, yerel bir Unix soketi üzerinden macOS uygulamasında (UI/TCC bağlamı) yürütülür; istemler + çıktı uygulama içinde kalır.

Diyagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Yürütme onayları (system.run)

`system.run`, macOS uygulamasındaki **Yürütme onayları** ile denetlenir (Ayarlar → Yürütme onayları).
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

- `allowlist` girdileri, çözümlenmiş ikili dosya yolları için glob desenleri veya PATH üzerinden çağrılan komutlar için çıplak komut adlarıdır.
- Kabuk denetimi veya genişletme sözdizimi (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham kabuk komutu metni, izin listesi ıskası olarak değerlendirilir ve açık onay gerektirir (veya kabuk ikilisinin izin listesine alınmasını).
- İstemde “Always Allow” seçildiğinde bu komut izin listesine eklenir.
- `system.run` ortam geçersiz kılmaları filtrelenir (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` düşürülür) ve ardından uygulamanın ortamıyla birleştirilir.
- Kabuk sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamlı ortam geçersiz kılmaları küçük bir açık izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- İzin listesi modunda her zaman izin ver kararlarında, bilinen dağıtım sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir dosya yollarını kalıcılaştırır. Sarmalamayı açmak güvenli değilse otomatik olarak hiçbir izin listesi girdisi kalıcılaştırılmaz.

## Derin bağlantılar

Uygulama, yerel eylemler için `openclaw://` URL şemasını kaydeder.

### `openclaw://agent`

Bir Gateway `agent` isteğini tetikler.
__OC_I18N_900004__
Sorgu parametreleri:

- `message` (gerekli)
- `sessionKey` (isteğe bağlı)
- `thinking` (isteğe bağlı)
- `deliver` / `to` / `channel` (isteğe bağlı)
- `timeoutSeconds` (isteğe bağlı)
- `key` (isteğe bağlı gözetimsiz mod anahtarı)

Güvenlik:

- `key` olmadan uygulama onay ister.
- `key` olmadan uygulama onay istemi için kısa bir mesaj sınırı uygular ve `deliver` / `to` / `channel` değerlerini yok sayar.
- Geçerli bir `key` ile çalışma gözetimsizdir (kişisel otomasyonlar için tasarlanmıştır).

## İlk kurulum akışı (tipik)

1. **OpenClaw.app**’i kurun ve başlatın.
2. İzinler kontrol listesini tamamlayın (TCC istemleri).
3. **Yerel** modun etkin olduğundan ve Gateway’in çalıştığından emin olun.
4. Terminal erişimi istiyorsanız CLI’yı kurun.

## Durum dizini yerleşimi (macOS)

OpenClaw durum dizininizi iCloud veya başka bulutla eşitlenen klasörlere koymaktan kaçının.
Eşitleme destekli yollar gecikme ekleyebilir ve oturumlar ile kimlik bilgileri için zaman zaman dosya kilidi/eşitleme yarışlarına neden olabilir.

Şunun gibi yerel, eşitlenmeyen bir durum yolunu tercih edin:
__OC_I18N_900005__
`openclaw doctor` durumun şuraların altında olduğunu algılarsa:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

uyarı verir ve yerel bir yola geri taşımayı önerir.

## Derleme ve geliştirme iş akışı (yerel)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (veya Xcode)
- Uygulamayı paketle: `scripts/package-mac-app.sh`

## Gateway bağlantısında hata ayıklama (macOS CLI)

Uygulamayı başlatmadan, macOS uygulamasının kullandığı aynı Gateway WebSocket el sıkışmasını ve keşif
mantığını çalıştırmak için hata ayıklama CLI’sını kullanın.
__OC_I18N_900006__
Bağlantı seçenekleri:

- `--url <ws://host:port>`: yapılandırmayı geçersiz kıl
- `--mode <local|remote>`: yapılandırmadan çözümle (varsayılan: yapılandırma veya yerel)
- `--probe`: yeni bir sağlık yoklamasını zorla
- `--timeout <ms>`: istek zaman aşımı (varsayılan: `15000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

Keşif seçenekleri:

- `--include-local`: “yerel” olarak filtrelenecek gateway’leri dahil et
- `--timeout <ms>`: genel keşif penceresi (varsayılan: `2000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

<Tip>
macOS uygulamasının keşif hattının (`local.` artı yapılandırılmış geniş alan etki alanı, geniş alan ve Tailscale Serve geri dönüşleriyle) Node CLI’nın `dns-sd` tabanlı keşfinden farklı olup olmadığını görmek için `openclaw gateway discover --json` ile karşılaştırın.
</Tip>

## Uzak bağlantı tesisatı (SSH tünelleri)

macOS uygulaması **Uzak** modda çalıştığında, yerel UI
bileşenlerinin uzak bir Gateway ile sanki localhost üzerindeymiş gibi konuşabilmesi için bir SSH tüneli açar.

### Denetim tüneli (Gateway WebSocket bağlantı noktası)

- **Amaç:** sağlık kontrolleri, durum, Web Chat, yapılandırma ve diğer denetim düzlemi çağrıları.
- **Yerel bağlantı noktası:** Gateway bağlantı noktası (varsayılan `18789`), her zaman kararlı.
- **Uzak bağlantı noktası:** uzak ana makinedeki aynı Gateway bağlantı noktası.
- **Davranış:** rastgele yerel bağlantı noktası yoktur; uygulama mevcut sağlıklı bir tüneli yeniden kullanır
  veya gerekirse yeniden başlatır.
- **SSH biçimi:** BatchMode +
  ExitOnForwardFailure + keepalive seçenekleriyle `ssh -N -L <local>:127.0.0.1:<remote>`.
- **IP raporlama:** SSH tüneli local loopback kullanır, bu nedenle gateway düğüm
  IP’sini `127.0.0.1` olarak görür. Gerçek istemci
  IP’sinin görünmesini istiyorsanız **Doğrudan (ws/wss)** taşımasını kullanın (bkz. [macOS uzaktan erişim](/tr/platforms/mac/remote)).

Kurulum adımları için bkz. [macOS uzaktan erişim](/tr/platforms/mac/remote). Protokol
ayrıntıları için bkz. [Gateway protokolü](/tr/gateway/protocol).

## İlgili belgeler

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Gateway (macOS)](/tr/platforms/mac/bundled-gateway)
- [macOS izinleri](/tr/platforms/mac/permissions)
- [Canvas](/tr/platforms/mac/canvas)
