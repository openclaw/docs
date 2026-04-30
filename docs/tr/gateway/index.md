---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve operasyonları için çalıştırma kılavuzu
title: Gateway operasyon kılavuzu
x-i18n:
    generated_at: "2026-04-30T09:22:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Bu sayfayı Gateway hizmetinin 1. gün başlatması ve 2. gün operasyonları için kullanın.

<CardGroup cols={2}>
  <Card title="Derin sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Kesin komut basamakları ve günlük imzalarıyla belirti öncelikli tanılama.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgiler yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve migrate/reload işlemleri.
  </Card>
  <Card title="Gizli bilgiler planı sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Kesin `secrets apply` hedef/yol kuralları ve yalnızca ref kullanan auth-profile davranışı.
  </Card>
</CardGroup>

## 5 dakikalık yerel başlatma

<Steps>
  <Step title="Gateway'i başlat">

```bash
openclaw gateway --port 18789
# debug/trace stdio'ya yansıtılır
openclaw gateway --port 18789 --verbose
# seçilen porttaki dinleyiciyi zorla sonlandır, sonra başlat
openclaw gateway --force
```

  </Step>

  <Step title="Hizmet sağlığını doğrula">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: `Runtime: running`, `Connectivity probe: ok` ve beklediğinizle eşleşen `Capability: ...`. Yalnızca erişilebilirlik değil, okuma kapsamlı RPC kanıtı gerektiğinde `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazır oluşunu doğrula">

```bash
openclaw channels status --probe
```

Erişilebilir bir gateway ile bu, hesap başına canlı kanal probları ve isteğe bağlı denetimler çalıştırır.
Gateway erişilemezse CLI, canlı prob çıktısı yerine yalnızca yapılandırmaya dayalı kanal özetlerine geri döner.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yüklemesi etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından çözümlenir veya ayarlanmışsa `OPENCLAW_CONFIG_PATH` kullanılır).
Varsayılan mod `gateway.reload.mode="hybrid"` şeklindedir.
İlk başarılı yüklemeden sonra çalışan süreç etkin bellek içi yapılandırma anlık görüntüsünü sunar; başarılı yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, kontrol düzlemi ve kanal bağlantıları için her zaman açık tek süreç.
- Şunlar için tek çoklanmış port:
  - WebSocket kontrol/RPC
  - HTTP API'leri, OpenAI uyumlu (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Kontrol UI ve hook'lar
- Varsayılan bağlama modu: `loopback`.
- Kimlik doğrulama varsayılan olarak gereklidir. Paylaşılan gizli bilgi kurulumları
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır ve loopback dışı
  ters proxy kurulumları `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu endpoint'ler

OpenClaw'ın en yüksek kaldıraçlı uyumluluk yüzeyi artık şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu küme neden önemlidir:

- Çoğu Open WebUI, LobeChat ve LibreChat entegrasyonu önce `/v1/models` sondajı yapar.
- Birçok RAG ve bellek hattı `/v1/embeddings` bekler.
- Ajan yerel istemcileri giderek daha fazla `/v1/responses` tercih eder.

Planlama notu:

- `/v1/models` ajan önceliklidir: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, her zaman yapılandırılmış varsayılan ajana eşlenen kararlı takma addır.
- Arka uç sağlayıcı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi halde seçili ajanın normal modeli ve embedding kurulumu denetimde kalır.

Bunların tümü ana Gateway portunda çalışır ve Gateway HTTP API'sinin geri kalanıyla aynı güvenilir operatör kimlik doğrulama sınırını kullanır.

### Port ve bağlama önceliği

| Ayar         | Çözümleme sırası                                            |
| ------------ | ----------------------------------------------------------- |
| Gateway port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bağlama modu | CLI/override → `gateway.bind` → `loopback`                  |

Kurulu gateway hizmetleri, çözümlenen `--port` değerini supervisor metadata'sına kaydeder. `gateway.port` değiştirildikten sonra launchd/systemd/schtasks süreci yeni portta başlatsın diye `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın.

Gateway başlangıcı, loopback dışı bağlamalar için yerel
Kontrol UI kaynaklarını tohumlarken aynı etkin port ve bağlamayı kullanır. Örneğin, `--bind lan --port 3000`
çalışma zamanı doğrulaması çalışmadan önce `http://localhost:3000` ve `http://127.0.0.1:3000`
tohumlar. HTTPS proxy URL'leri gibi uzak tarayıcı kaynaklarını
`gateway.controlUi.allowedOrigins` içine açıkça ekleyin.

### Sıcak yeniden yükleme modları

| `gateway.reload.mode` | Davranış                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Yapılandırma yeniden yüklemesi yok         |
| `hot`                 | Yalnızca hot-safe değişiklikleri uygula    |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlat |
| `hybrid` (varsayılan) | Güvenliyse sıcak uygula, gerekirse yeniden başlat |

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

`gateway status --deep` daha derin bir RPC sağlık probu için değil, ek hizmet keşfi (LaunchDaemons/systemd system
units/schtasks) içindir.

## Birden fazla gateway (aynı host)

Çoğu kurulum makine başına bir gateway çalıştırmalıdır. Tek bir gateway birden fazla
ajanı ve kanalı barındırabilir.

Birden fazla gateway'e yalnızca kasıtlı olarak izolasyon veya kurtarma botu istediğinizde ihtiyaç duyarsınız.

Yararlı kontroller:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklenenler:

- `gateway status --deep`, eski launchd/systemd/schtasks kurulumları hâlâ mevcut olduğunda
  `Other gateway-like services detected (best effort)` bildirebilir ve temizleme ipuçları yazdırabilir.
- `gateway probe`, birden fazla hedef yanıt verdiğinde `multiple reachable gateways`
  hakkında uyarabilir.
- Bu kasıtlıysa portları, yapılandırma/durumu ve çalışma alanı köklerini her gateway için izole edin.

Her örnek için kontrol listesi:

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

## VoiceClaw gerçek zamanlı beyin endpoint'i

OpenClaw, VoiceClaw uyumlu gerçek zamanlı WebSocket endpoint'ini
`/voiceclaw/realtime` konumunda sunar. Bir VoiceClaw masaüstü istemcisinin ayrı bir relay
sürecinden geçmek yerine doğrudan gerçek zamanlı OpenClaw beynine konuşması gerektiğinde bunu kullanın.

Endpoint, gerçek zamanlı ses için Gemini Live kullanır ve OpenClaw araçlarını
doğrudan Gemini Live'a sunarak OpenClaw'ı beyin olarak çağırır. Araç çağrıları,
ses dönüşünü duyarlı tutmak için anında `working` sonucu döndürür; ardından OpenClaw
asıl aracı eşzamansız olarak yürütür ve sonucu canlı oturuma geri enjekte eder.
Gateway süreç ortamında `GEMINI_API_KEY` ayarlayın. Gateway kimlik doğrulaması etkinse
masaüstü istemcisi ilk `session.config` iletisinde gateway token'ını veya parolasını gönderir.

Gerçek zamanlı beyin erişimi, sahip tarafından yetkilendirilmiş OpenClaw ajan komutları çalıştırır. `gateway.auth.mode: "none"` değerini yalnızca loopback'e özel test örnekleriyle sınırlayın. Yerel olmayan gerçek zamanlı beyin bağlantıları gateway kimlik doğrulaması gerektirir.

İzole bir test gateway'i için kendi portu, yapılandırması
ve durumu olan ayrı bir örnek çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Ardından VoiceClaw'ı şunu kullanacak şekilde yapılandırın:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Uzak erişim

Tercih edilen: Tailscale/VPN.
Yedek seçenek: SSH tüneli.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Ardından istemcileri yerel olarak `ws://127.0.0.1:18789` adresine bağlayın.

<Warning>
SSH tünelleri gateway kimlik doğrulamasını atlamaz. Paylaşılan gizli bilgi kimlik doğrulaması için istemciler
tünel üzerinden bile `token`/`password` göndermelidir. Kimlik taşıyan modlarda
istek yine de o kimlik doğrulama yolunu karşılamalıdır.
</Warning>

Bkz.: [Uzak Gateway](/tr/gateway/remote), [Kimlik doğrulama](/tr/gateway/authentication), [Tailscale](/tr/gateway/tailscale).

## Gözetim ve hizmet yaşam döngüsü

Üretim benzeri güvenilirlik için gözetimli çalıştırmalar kullanın.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Yeniden başlatmalar için `openclaw gateway restart` kullanın. `openclaw gateway stop` ve `openclaw gateway start` komutlarını zincirlemeyin; macOS'ta `gateway stop`, durdurmadan önce LaunchAgent'ı bilinçli olarak devre dışı bırakır.

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) şeklindedir. `openclaw doctor` hizmet yapılandırması sapmasını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Oturum kapatıldıktan sonra kalıcılık için lingering'i etkinleştirin:

```bash
sudo loginctl enable-linger <user>
```

Özel kurulum yolu gerektiğinde manuel user-unit örneği:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Yerel Windows yönetimli başlangıç, `OpenClaw Gateway` adlı bir Scheduled Task
(veya adlandırılmış profiller için `OpenClaw Gateway (<profile>)`) kullanır. Scheduled Task
oluşturma reddedilirse OpenClaw, durum dizini içindeki `gateway.cmd` dosyasına işaret eden
kullanıcı başına Startup-folder başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (sistem hizmeti)">

Çok kullanıcılı/her zaman açık host'lar için bir sistem unit'i kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Kullanıcı unit'iyle aynı hizmet gövdesini kullanın, ancak bunu
`/etc/systemd/system/openclaw-gateway[-<profile>].service` altına kurun ve
`openclaw` ikiliniz başka bir yerdeyse `ExecStart=` değerini ayarlayın.

Aynı profil/port için `openclaw doctor --fix` komutunun ayrıca kullanıcı düzeyinde bir gateway hizmeti kurmasına izin vermeyin. Doctor, sistem düzeyinde bir OpenClaw gateway hizmeti bulduğunda bu otomatik kurulumu reddeder; yaşam döngüsüne sistem unit'i sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` kullanın.

  </Tab>
</Tabs>

## Geliştirme profili hızlı yolu

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlar izole durum/yapılandırma ve temel gateway portu `19001` içerir.

## Protokol hızlı başvurusu (operatör görünümü)

- İlk istemci çerçevesi `connect` olmalıdır.
- Gateway `hello-ok` anlık görüntüsü döndürür (`presence`, `health`, `stateVersion`, `uptimeMs`, sınırlar/politika).
- `hello-ok.features.methods` / `events`, her çağrılabilir yardımcı rotanın
  oluşturulmuş dökümü değil, temkinli bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Ajan çalıştırmaları iki aşamalıdır:

1. Anında kabul edildi onayı (`status:"accepted"`)
2. Arada akışla gelen `agent` olaylarıyla birlikte nihai tamamlama yanıtı (`status:"ok"|"error"`).

Tam protokol belgelerine bakın: [Gateway Protokolü](/tr/gateway/protocol).

## Operasyonel kontroller

### Canlılık

- WS'yi açın ve `connect` gönderin.
- Anlık görüntü içeren `hello-ok` yanıtı bekleyin.

### Hazır olma

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Boşluk kurtarma

Olaylar yeniden oynatılmaz. Sıra boşluklarında, devam etmeden önce durumu (`health`, `system-presence`) yenileyin.

## Yaygın hata imzaları

| İmza                                                           | Olası sorun                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Geçerli bir Gateway kimlik doğrulama yolu olmadan loopback dışı bağlama         |
| `another gateway instance is already listening` / `EADDRINUSE` | Port çakışması                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak moda ayarlanmış veya hasarlı bir yapılandırmada yerel mod damgası eksik |
| `unauthorized` during connect                                  | İstemci ile Gateway arasında kimlik doğrulama uyuşmazlığı                       |

Tam tanılama adımları için [Gateway Sorun Giderme](/tr/gateway/troubleshooting) bölümünü kullanın.

## Güvenlik garantileri

- Gateway protokol istemcileri, Gateway kullanılamadığında hızlıca başarısız olur (örtük doğrudan kanal geri dönüşü yoktur).
- Geçersiz/bağlantı olmayan ilk çerçeveler reddedilir ve kapatılır.
- Zarif kapatma, soket kapanmadan önce `shutdown` olayı yayar.

---

İlgili:

- [Sorun Giderme](/tr/gateway/troubleshooting)
- [Arka Plan Süreci](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Sağlık](/tr/gateway/health)
- [Doctor](/tr/gateway/doctor)
- [Kimlik Doğrulama](/tr/gateway/authentication)

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
- [Uzaktan erişim](/tr/gateway/remote)
- [Gizli bilgiler yönetimi](/tr/gateway/secrets)
