---
read_when:
    - OpenClaw çalışmıyor ve soruna en hızlı çözüm yoluna ihtiyacınız var
    - Derin çalışma kılavuzlarına dalmadan önce bir triyaj akışı istiyorsunuz
summary: OpenClaw için belirti odaklı ilk sorun giderme merkezi
title: Genel Sorun Giderme
x-i18n:
    generated_at: "2026-04-11T02:45:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16b38920dbfdc8d4a79bbb5d6fab2c67c9f218a97c36bb4695310d7db9c4614a
    source_path: help/troubleshooting.md
    workflow: 15
---

# Sorun Giderme

Yalnızca 2 dakikanız varsa, bu sayfayı bir triyaj giriş noktası olarak kullanın.

## İlk 60 saniye

Bu komut sırasını tam olarak şu sırayla çalıştırın:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

İyi çıktı tek satırda şöyle görünür:

- `openclaw status` → yapılandırılmış kanalları ve belirgin kimlik doğrulama hatalarının olmadığını gösterir.
- `openclaw status --all` → tam rapor mevcut ve paylaşılabilir.
- `openclaw gateway probe` → beklenen gateway hedefi erişilebilir (`Reachable: yes`). `RPC: limited - missing scope: operator.read`, bağlantı hatası değil, sınırlı tanılama anlamına gelir.
- `openclaw gateway status` → `Runtime: running` ve `RPC probe: ok`.
- `openclaw doctor` → engelleyici yapılandırma/hizmet hatası yok.
- `openclaw channels status --probe` → erişilebilir gateway, hesap başına canlı taşıma durumunu ve `works` veya `audit ok` gibi probe/denetim sonuçlarını döndürür; gateway erişilemezse komut yalnızca yapılandırma özetiyle geri döner.
- `openclaw logs --follow` → düzenli etkinlik vardır, tekrar eden kritik hatalar yoktur.

## Anthropic uzun bağlam 429

Şunu görüyorsanız:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
şuraya gidin: [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Yerel OpenAI uyumlu arka uç doğrudan çalışıyor ama OpenClaw'da başarısız oluyor

Yerel veya self-hosted `/v1` arka ucunuz küçük doğrudan
`/v1/chat/completions` denemelerine yanıt veriyor ama `openclaw infer model run`
veya normal ajan turlarında başarısız oluyorsa:

1. Hata `messages[].content` alanının bir dize beklediğini söylüyorsa,
   `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
2. Arka uç hâlâ yalnızca OpenClaw ajan turlarında başarısız oluyorsa,
   `models.providers.<provider>.models[].compat.supportsTools: false` ayarlayın ve tekrar deneyin.
3. Çok küçük doğrudan çağrılar hâlâ çalışıyor ama daha büyük OpenClaw istemleri
   arka ucu çökertiyorsa, kalan sorunu yukarı akış model/sunucu sınırlaması olarak değerlendirin ve
   ayrıntılı kılavuza devam edin:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/tr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Eksik openclaw extensions nedeniyle plugin yüklemesi başarısız oluyor

Yükleme `package.json missing openclaw.extensions` ile başarısız olursa, plugin paketi
artık OpenClaw'ın kabul etmediği eski bir biçim kullanıyordur.

Plugin paketinde düzeltme:

1. `package.json` içine `openclaw.extensions` ekleyin.
2. Girdileri derlenmiş çalışma zamanı dosyalarına yönlendirin (genellikle `./dist/index.js`).
3. Plugin'i yeniden yayımlayın ve `openclaw plugins install <package>` komutunu tekrar çalıştırın.

Örnek:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Başvuru: [Plugin mimarisi](/tr/plugins/architecture)

## Karar ağacı

```mermaid
flowchart TD
  A[OpenClaw çalışmıyor] --> B{İlk hangi kısım bozuluyor}
  B --> C[Yanıt yok]
  B --> D[Dashboard veya Control UI bağlanmıyor]
  B --> E[Gateway başlamıyor veya hizmet çalışmıyor]
  B --> F[Kanal bağlanıyor ama mesaj akışı olmuyor]
  B --> G[Cron veya heartbeat tetiklenmedi ya da teslim etmedi]
  B --> H[Node eşlenmiş ama camera canvas screen exec başarısız]
  B --> I[Browser aracı başarısız]

  C --> C1[/Yanıt yok bölümü/]
  D --> D1[/Control UI bölümü/]
  E --> E1[/Gateway bölümü/]
  F --> F1[/Kanal akışı bölümü/]
  G --> G1[/Otomasyon bölümü/]
  H --> H1[/Node araçları bölümü/]
  I --> I1[/Browser bölümü/]
```

<AccordionGroup>
  <Accordion title="Yanıt yok">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    İyi çıktı şöyle görünür:

    - `Runtime: running`
    - `RPC probe: ok`
    - Kanalınız bağlı taşıma durumunu gösterir ve desteklenen yerlerde `channels status --probe` içinde `works` veya `audit ok` görünür
    - Gönderen onaylı görünür (veya DM politikası açık/allowlist durumundadır)

    Yaygın günlük imzaları:

    - `drop guild message (mention required` → Discord'da mention zorunluluğu mesajı engelledi.
    - `pairing request` → gönderen onaylı değil ve DM eşleme onayı bekliyor.
    - Kanal günlüklerinde `blocked` / `allowlist` → gönderen, oda veya grup filtrelenmiş.

    Ayrıntılı sayfalar:

    - [/gateway/troubleshooting#no-replies](/tr/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/tr/channels/troubleshooting)
    - [/channels/pairing](/tr/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard veya Control UI bağlanmıyor">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    İyi çıktı şöyle görünür:

    - `Dashboard: http://...`, `openclaw gateway status` içinde gösterilir
    - `RPC probe: ok`
    - Günlüklerde kimlik doğrulama döngüsü yok

    Yaygın günlük imzaları:

    - `device identity required` → HTTP/güvenli olmayan bağlam cihaz kimlik doğrulamasını tamamlayamaz.
    - `origin not allowed` → tarayıcı `Origin`, Control UI gateway hedefi için izinli değil.
    - `AUTH_TOKEN_MISMATCH` ve yeniden deneme ipuçları (`canRetryWithDeviceToken=true`) → güvenilen cihaz belirteciyle bir otomatik yeniden deneme gerçekleşebilir.
    - Bu önbelleğe alınmış belirteç yeniden denemesi, eşlenmiş cihaz belirteciyle birlikte saklanan önbelleklenmiş kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları kendi istedikleri kapsam kümesini korur.
    - Zaman uyumsuz Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız denemeler sınırlayıcı hatayı kaydetmeden önce serileştirilir; bu yüzden eşzamanlı ikinci kötü yeniden deneme zaten `retry later` gösterebilir.
    - localhost tarayıcı kaynağından gelen `too many failed authentication attempts (retry later)` → aynı `Origin` içinden tekrar eden başarısızlıklar geçici olarak kilitlenmiştir; başka bir localhost origin ayrı bir kovayı kullanır.
    - Bu yeniden denemeden sonra tekrarlanan `unauthorized` → yanlış belirteç/parola, kimlik doğrulama modu uyuşmazlığı veya bayat eşlenmiş cihaz belirteci.
    - `gateway connect failed:` → UI yanlış URL/portunu hedefliyor veya gateway erişilemez durumda.

    Ayrıntılı sayfalar:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/tr/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway başlamıyor veya hizmet kurulu ama çalışmıyor">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    İyi çıktı şöyle görünür:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `RPC probe: ok`

    Yaygın günlük imzaları:

    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → gateway modu remote durumunda ya da yapılandırma dosyasında local mod damgası eksik ve onarılması gerekiyor.
    - `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu olmadan loopback dışı bağlama (belirteç/parola veya yapılandırıldıysa trusted-proxy).
    - `another gateway instance is already listening` veya `EADDRINUSE` → port zaten kullanımda.

    Ayrıntılı sayfalar:

    - [/gateway/troubleshooting#gateway-service-not-running](/tr/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/tr/gateway/background-process)
    - [/gateway/configuration](/tr/gateway/configuration)

  </Accordion>

  <Accordion title="Kanal bağlanıyor ama mesaj akışı olmuyor">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    İyi çıktı şöyle görünür:

    - Kanal taşıması bağlıdır.
    - Eşleme/allowlist kontrolleri geçer.
    - Gerekli yerlerde mention algılanır.

    Yaygın günlük imzaları:

    - `mention required` → grup mention zorunluluğu işlemeyi engelledi.
    - `pairing` / `pending` → DM gönderen henüz onaylı değil.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → kanal izinleri veya belirteç sorunu.

    Ayrıntılı sayfalar:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/tr/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/tr/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron veya heartbeat tetiklenmedi ya da teslim etmedi">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    İyi çıktı şöyle görünür:

    - `cron.status`, sonraki uyanma zamanı ile birlikte etkin olduğunu gösterir.
    - `cron runs`, son `ok` kayıtlarını gösterir.
    - Heartbeat etkindir ve etkin saatlerin dışında değildir.

    Yaygın günlük imzaları:

    - `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
    - `heartbeat skipped` ve `reason=quiet-hours` → yapılandırılmış etkin saatlerin dışında.
    - `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ama yalnızca boş/yalnızca başlık içeren iskelet içeriyor.
    - `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` görev modu etkin ama görev aralıklarının henüz hiçbiri zamanı gelmemiş.
    - `heartbeat skipped` ve `reason=alerts-disabled` → tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` tamamen kapalı).
    - `requests-in-flight` → ana hat meşgul; heartbeat uyanması ertelendi.
    - `unknown accountId` → heartbeat teslimat hedef hesabı mevcut değil.

    Ayrıntılı sayfalar:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/tr/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/tr/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/tr/gateway/heartbeat)

    </Accordion>

    <Accordion title="Node eşlenmiş ama araç camera canvas screen exec başarısız oluyor">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      İyi çıktı şöyle görünür:

      - Node, `node` rolü için bağlı ve eşlenmiş olarak listelenir.
      - Çağırdığınız komut için yetenek mevcuttur.
      - Araç için izin durumu verilmiştir.

      Yaygın günlük imzaları:

      - `NODE_BACKGROUND_UNAVAILABLE` → node uygulamasını ön plana getirin.
      - `*_PERMISSION_REQUIRED` → işletim sistemi izni reddedilmiş veya eksik.
      - `SYSTEM_RUN_DENIED: approval required` → exec onayı beklemede.
      - `SYSTEM_RUN_DENIED: allowlist miss` → komut exec allowlist içinde değil.

      Ayrıntılı sayfalar:

      - [/gateway/troubleshooting#node-paired-tool-fails](/tr/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/tr/nodes/troubleshooting)
      - [/tools/exec-approvals](/tr/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec aniden onay istemeye başladı">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      Değişen şey:

      - `tools.exec.host` ayarlanmamışsa varsayılan `auto` değeridir.
      - `host=auto`, bir sandbox çalışma zamanı etkin olduğunda `sandbox`, aksi halde `gateway` olarak çözülür.
      - `host=auto` yalnızca yönlendirmedir; istemsiz "YOLO" davranışı `security=full` artı gateway/node üzerinde `ask=off` ile gelir.
      - `gateway` ve `node` üzerinde, ayarlanmamış `tools.exec.security` varsayılan olarak `full` olur.
      - Ayarlanmamış `tools.exec.ask` varsayılan olarak `off` olur.
      - Sonuç: onaylar görüyorsanız, bazı ana makineye özgü veya oturum başına politikalar exec davranışını mevcut varsayılanlardan daha sıkı hale getirmiştir.

      Mevcut varsayılan onaysız davranışı geri yükleme:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Daha güvenli alternatifler:

      - Yalnızca kararlı ana makine yönlendirmesi istiyorsanız sadece `tools.exec.host=gateway` ayarlayın.
      - Ana makine exec istiyor ama allowlist dışı durumlarda yine de gözden geçirme istiyorsanız `security=allowlist` ile `ask=on-miss` kullanın.
      - `host=auto` değerinin yeniden `sandbox` olarak çözülmesini istiyorsanız sandbox modunu etkinleştirin.

      Yaygın günlük imzaları:

      - `Approval required.` → komut `/approve ...` bekliyor.
      - `SYSTEM_RUN_DENIED: approval required` → node-host exec onayı beklemede.
      - `exec host=sandbox requires a sandbox runtime for this session` → örtük/açık sandbox seçimi var ama sandbox modu kapalı.

      Ayrıntılı sayfalar:

      - [/tools/exec](/tr/tools/exec)
      - [/tools/exec-approvals](/tr/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/tr/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="Browser aracı başarısız oluyor">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      İyi çıktı şöyle görünür:

      - Browser durumu `running: true` ve seçilmiş bir tarayıcı/profil gösterir.
      - `openclaw` başlar veya `user` yerel Chrome sekmelerini görebilir.

      Yaygın günlük imzaları:

      - `unknown command "browser"` veya `unknown command 'browser'` → `plugins.allow` ayarlı ve `browser` içermiyor.
      - `Failed to start Chrome CDP on port` → yerel tarayıcı başlatma başarısız oldu.
      - `browser.executablePath not found` → yapılandırılmış ikili yol yanlış.
      - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si desteklenmeyen bir şema kullanıyor.
      - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde kötü veya aralık dışı bir port var.
      - `No Chrome tabs found for profile="user"` → Chrome MCP ekleme profilinde açık yerel Chrome sekmesi yok.
      - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına bu ana makineden erişilemiyor.
      - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca ekleme profili için canlı CDP hedefi yok.
      - attach-only veya uzak CDP profillerinde bayat viewport / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → etkin kontrol oturumunu kapatmak ve gateway'i yeniden başlatmadan emülasyon durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

      Ayrıntılı sayfalar:

      - [/gateway/troubleshooting#browser-tool-fails](/tr/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/tr/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/tr/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — sık sorulan sorular
- [Gateway Sorun Giderme](/tr/gateway/troubleshooting) — gateway'e özgü sorunlar
- [Doctor](/tr/gateway/doctor) — otomatik sağlık kontrolleri ve onarımlar
- [Kanal Sorun Giderme](/tr/channels/troubleshooting) — kanal bağlantı sorunları
- [Otomasyon Sorun Giderme](/tr/automation/cron-jobs#troubleshooting) — cron ve heartbeat sorunları
