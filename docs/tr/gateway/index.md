---
read_when:
    - Gateway işlemini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve operasyonları için çalışma kılavuzu
title: Gateway operasyon kılavuzu
x-i18n:
    generated_at: "2026-07-16T17:25:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Gateway hizmetinin ilk gün başlatılması ve sonraki günlerde işletilmesi için bu sayfayı kullanın.

<CardGroup cols={2}>
  <Card title="Derinlemesine sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Kesin komut sıraları ve günlük imzalarıyla belirti odaklı tanılama.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgi yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntüsü davranışı ve taşıma/yeniden yükleme işlemleri.
  </Card>
  <Card title="Gizli bilgiler planı sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Kesin `secrets apply` hedef/yol kuralları ve yalnızca başvuru kullanan kimlik doğrulama profili davranışı.
  </Card>
</CardGroup>

## 5 dakikada yerel başlatma

<Steps>
  <Step title="Gateway'i başlatın">

```bash
openclaw gateway --port 18789
# hata ayıklama/izleme stdio'ya yansıtılır
openclaw gateway --port 18789 --verbose
# seçilen porttaki dinleyiciyi zorla sonlandırın, ardından başlatın
openclaw gateway --force
```

  </Step>

  <Step title="Hizmet durumunu doğrulayın">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: `Runtime: running`, `Connectivity probe: ok` ve beklentinizle eşleşen bir `Capability` satırı. Yalnızca erişilebilirliği değil, okuma kapsamlı RPC kanıtını doğrulamak için `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazır olma durumunu doğrulayın">

```bash
openclaw channels status --probe
```

Erişilebilir bir Gateway ile bu komut, hesap başına canlı kanal yoklamaları ve isteğe bağlı denetimler çalıştırır. Gateway'e erişilemiyorsa CLI yalnızca yapılandırmaya dayalı kanal özetlerine geri döner.

  </Step>
</Steps>

<Note>
Gateway yapılandırmasını yeniden yükleme işlemi, etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından veya ayarlanmışsa `OPENCLAW_CONFIG_PATH` üzerinden çözümlenir). Varsayılan mod `gateway.reload.mode="hybrid"` değeridir. İlk başarılı yüklemeden sonra çalışan işlem, bellekteki etkin yapılandırma anlık görüntüsünü sunar; başarılı bir yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, kontrol düzlemi ve kanal bağlantıları için sürekli çalışan tek işlem.
- Şunlar için tek bir çoklanmış port:
  - WebSocket kontrolü/RPC
  - HTTP API'leri (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - İsteğe bağlı `/api/v1/admin/rpc` gibi Plugin HTTP rotaları
  - Kontrol kullanıcı arayüzü ve kancalar
- Varsayılan bağlama modu: `loopback`. Algılanan bir kapsayıcı ortamında geçerli varsayılan `auto` olur (port yönlendirme için `0.0.0.0` olarak çözümlenir); ancak Tailscale sunma/tünelleme etkinse her zaman `loopback` zorlanır.
- Kimlik doğrulama varsayılan olarak zorunludur. Paylaşılan gizli bilgi kurulumları `gateway.auth.token` / `gateway.auth.password` (veya `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır; geri döngü dışındaki ters proxy kurulumları ise `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw'ın en yüksek etkili uyumluluk yüzeyi:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu kümenin önemli olmasının nedenleri:

- Open WebUI, LobeChat ve LibreChat entegrasyonlarının çoğu önce `/v1/models` uç noktasını yoklar.
- Birçok RAG ve bellek işlem hattı `/v1/embeddings` uç noktasını bekler.
- Aracı tabanlı istemciler giderek daha fazla `/v1/responses` uç noktasını tercih ediyor.

`/v1/models` aracı önceliklidir: yapılandırılmış her aracı için `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür. `openclaw/default`, her zaman yapılandırılmış varsayılan aracıyla eşleşen kararlı diğer addır. Arka uç sağlayıcısı/model geçersiz kılması istediğinizde `x-openclaw-model` gönderin; aksi takdirde seçilen aracının normal model ve gömme kurulumu denetimi elinde tutar.

Bunların tümü ana Gateway portunda çalışır ve Gateway HTTP API'sinin geri kalanıyla aynı güvenilir operatör kimlik doğrulama sınırını kullanır.

Yönetici HTTP RPC'si (`POST /api/v1/admin/rpc`), WebSocket RPC kullanamayan ana makine araçları için ayrı ve varsayılan olarak kapalı bir Plugin rotasıdır. Bkz. [Yönetici HTTP RPC'si](/tr/plugins/admin-http-rpc).

### Port ve bağlama önceliği

| Ayar         | Çözümleme sırası                                                     |
| ------------ | -------------------------------------------------------------------- |
| Gateway portu | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Bağlama modu | CLI/geçersiz kılma → `gateway.bind` → `loopback` (veya kapsayıcılarda `auto`) |

Yüklü Gateway hizmetleri, çözümlenen `--port` değerini gözetmen meta verilerine kaydeder. `gateway.port` değerini değiştirdikten sonra launchd/systemd/schtasks işlemi yeni portta başlatsın diye `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın.

Gateway başlatma işlemi, geri döngü dışı bağlamalar için yerel Kontrol kullanıcı arayüzü kaynaklarını oluştururken aynı geçerli portu ve bağlamayı kullanır. Örneğin `--bind lan --port 3000`, çalışma zamanı doğrulaması çalışmadan önce `http://localhost:3000` ve `http://127.0.0.1:3000` değerlerini oluşturur. HTTPS proxy URL'leri gibi uzak tarayıcı kaynaklarını `gateway.controlUi.allowedOrigins` değerine açıkça ekleyin.

### Çalışırken yeniden yükleme modları

| `gateway.reload.mode` | Davranış                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Yapılandırma yeniden yüklenmez                           |
| `hot`                 | Yalnızca çalışırken güvenle uygulanabilen değişiklikleri uygular                |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlatır         |
| `hybrid` (varsayılan)    | Güvenliyse çalışırken uygular, gerektiğinde yeniden başlatır |

## Operatör komut kümesi

```bash
openclaw gateway status
openclaw gateway status --deep   # sistem düzeyinde hizmet taraması ekler
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` daha derin bir RPC durum yoklaması için değil, ek hizmet keşfi (LaunchDaemons/systemd sistem birimleri/schtasks) içindir.

## Birden fazla Gateway (aynı ana makine)

Çoğu kurulumda makine başına bir Gateway çalıştırılmalıdır. Tek bir Gateway birden fazla aracıyı ve kanalı barındırabilir. Yalnızca kasıtlı olarak yalıtım veya kurtarma botu istediğinizde birden fazla Gateway gerekir.

Yararlı kontroller:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklenecekler:

- `gateway status --deep`, eski launchd/systemd/schtasks kurulumları hâlâ mevcut olduğunda `Other gateway-like services detected (best effort)` bildirebilir ve temizleme ipuçları yazdırabilir.
- `gateway probe`, farklı Gateway'ler yanıt verdiğinde veya OpenClaw erişilebilir hedeflerin aynı Gateway olduğunu kanıtlayamadığında `multiple reachable gateway identities` konusunda uyarabilir. Aynı Gateway'e giden bir SSH tüneli, proxy URL'si veya yapılandırılmış uzak URL; aktarım portları farklı olsa bile birden fazla aktarıma sahip tek bir Gateway'dir.
- Bu kasıtlıysa her Gateway için portları, yapılandırmayı/durumu ve çalışma alanı köklerini yalıtın.

Örnek başına kontrol listesi:

- Benzersiz `gateway.port`
- Benzersiz `OPENCLAW_CONFIG_PATH`
- Benzersiz `OPENCLAW_STATE_DIR`
- Benzersiz `agents.defaults.workspace`

Örnek:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Ayrıntılı kurulum: [/gateway/multiple-gateways](/tr/gateway/multiple-gateways).

## Uzaktan erişim

Tercih edilen: Tailscale/VPN.
Alternatif: SSH tüneli.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Ardından istemcileri yerel olarak `ws://127.0.0.1:18789` adresine bağlayın.

<Warning>
SSH tünelleri Gateway kimlik doğrulamasını atlamaz. Paylaşılan gizli bilgiyle kimlik doğrulamada istemciler, tünel üzerinden bile
`token`/`password` göndermek zorundadır. Kimlik taşıyan modlarda
isteğin yine de ilgili kimlik doğrulama yolunu karşılaması gerekir.
</Warning>

Bkz: [Uzak Gateway](/tr/gateway/remote), [Kimlik doğrulama](/tr/gateway/authentication), [Tailscale](/tr/gateway/tailscale).

## Gözetim ve hizmet yaşam döngüsü

Üretim benzeri güvenilirlik için gözetimli çalıştırmaları kullanın.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Yeniden başlatmalar için `openclaw gateway restart` kullanın. Yeniden başlatma yerine `openclaw gateway stop` ile `openclaw gateway start` komutlarını zincirlemeyin.

macOS'ta `gateway stop` varsayılan olarak `launchctl bootout` kullanır. Bu, kalıcı bir devre dışı bırakma oluşturmadan LaunchAgent'ı mevcut önyükleme oturumundan kaldırır; böylece beklenmeyen çökmelerden sonra KeepAlive otomatik kurtarması çalışmaya devam eder ve `gateway start` yeniden etkinleştirmeyi sorunsuz yapar. Yeniden başlatmalar arasında otomatik yeniden oluşturmayı kalıcı olarak engellemek için `--disable` iletin: `openclaw gateway stop --disable`.

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) şeklindedir. `openclaw doctor`, hizmet yapılandırması sapmasını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd kullanıcısı)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Oturum kapatıldıktan sonra kalıcılık için lingering özelliğini etkinleştirin:

```bash
sudo loginctl enable-linger $(whoami)
```

Masaüstü oturumu olmayan başsız bir sunucuda `systemctl --user` komutlarını yeniden denemeden önce `XDG_RUNTIME_DIR` değerinin (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) ayarlanmış olduğundan da emin olun.

Özel kurulum yoluna ihtiyacınız olduğunda kullanılabilecek el ile kullanıcı birimi örneği:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (yerel)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Yerel Windows yönetimli başlatma, `OpenClaw Gateway` adlı bir Scheduled Task kullanır
(adlandırılmış profiller için `OpenClaw Gateway (<profile>)`). Scheduled Task
oluşturmaya izin verilmezse OpenClaw, durum dizinindeki `gateway.cmd`
konumuna işaret eden kullanıcı başına Startup klasörü başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (sistem hizmeti)">

Çok kullanıcılı/sürekli çalışan ana makineler için bir sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Kullanıcı birimiyle aynı hizmet gövdesini kullanın, ancak bunu
`/etc/systemd/system/openclaw-gateway[-<profile>].service` altında kurun ve
`openclaw` ikili dosyanız başka bir yerdeyse `ExecStart=` değerini ayarlayın.

Aynı profil/port için `openclaw doctor --fix` komutunun kullanıcı düzeyinde bir Gateway hizmeti kurmasına da izin vermeyin. Doctor, sistem düzeyinde bir OpenClaw Gateway hizmeti bulduğunda bu otomatik kurulumu reddeder; yaşam döngüsünün sahibi sistem birimiyse `OPENCLAW_SERVICE_REPAIR_POLICY=external` kullanın.

  </Tab>
</Tabs>

Geçersiz yapılandırma hataları `78` koduyla çıkar. Linux systemd birimleri, yapılandırma düzeltilene kadar yeniden başlatmayı durdurmak için `RestartPreventExitStatus=78` kullanır. launchd ve Windows Task Scheduler, çıkış koduna göre durdurma için eşdeğer bir kurala sahip değildir; bu nedenle Gateway ayrıca temiz olmayan hızlı önyükleme geçmişini kalıcı olarak kaydeder ve tekrarlanan başlatma hatalarından sonra kanal/sağlayıcı hesaplarının otomatik başlatılmasını engeller. Bu güvenli modda kontrol düzlemi inceleme ve onarım için yine başlar, yapılandırmayı çalışırken yeniden yükleme işlemleri ve `secrets.reload` otomatik kanal yeniden başlatmalarını reddeder; açık bir operatör `channels.start` isteği ise engellemeyi geçersiz kılabilir.

## Geliştirme profili için hızlı yol

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlar, yalıtılmış durum/yapılandırma ve `19001` temel Gateway portunu içerir.

## Protokol hızlı başvurusu (operatör görünümü)

- İlk istemci çerçevesi `connect` olmalıdır.
- Gateway, bir `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) ile birlikte `policy` sınırlarını (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`) içeren bir `hello-ok` çerçevesi döndürür.
- `hello-ok.features.methods` / `events`, çağrılabilir tüm yardımcı rotaların
  oluşturulmuş bir dökümü değil, ihtiyatlı bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, isteğe bağlı
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Ajan çalıştırmaları iki aşamalıdır:

1. Anında kabul alındı bildirimi (`status:"accepted"`)
2. Arada akışla iletilen `agent` olaylarıyla birlikte nihai tamamlanma yanıtı (`status:"ok"|"error"`).

Protokol belgelerinin tamamına bakın: [Gateway Protokolü](/tr/gateway/protocol).

## Operasyonel kontroller

### Çalışırlık

- WS'yi açın ve `connect` gönderin.
- Anlık görüntüyü içeren `hello-ok` yanıtını bekleyin.

### Hazır olma durumu

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Boşluk kurtarma

Olaylar yeniden oynatılmaz. Sıra boşluklarında devam etmeden önce durumu yenileyin (`health`, `system-presence`).

## Yaygın hata belirtileri

| Belirti                                                        | Olası sorun                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Geçerli bir gateway kimlik doğrulama yolu olmadan geri döngü dışı bağlama          |
| `another gateway instance is already listening` / `EADDRINUSE` | Bağlantı noktası çakışması                                                         |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak moda ayarlanmış veya hasarlı bir yapılandırmada `gateway.mode` eksik |
| Bağlantı sırasında `unauthorized`                                  | İstemci ile gateway arasında kimlik doğrulama uyuşmazlığı                          |

Eksiksiz tanılama adımları için [Gateway Sorun Giderme](/tr/gateway/troubleshooting) sayfasını kullanın.

## Güvenlik garantileri

- Gateway kullanılamadığında Gateway protokolü istemcileri hızla başarısız olur (örtük doğrudan kanal geri dönüşü yoktur).
- Geçersiz/bağlantı kurma amaçlı olmayan ilk çerçeveler reddedilir ve bağlantı kapatılır.
- Düzgün kapatma, soket kapatılmadan önce `shutdown` olayını yayınlar.

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
- [Arka plan işlemi](/tr/gateway/background-process)
- [Sistem durumu](/tr/gateway/health)
- [Doctor](/tr/gateway/doctor)
- [Kimlik doğrulama](/tr/gateway/authentication)
- [Uzaktan erişim](/tr/gateway/remote)
- [Gizli bilgi yönetimi](/tr/gateway/secrets)
