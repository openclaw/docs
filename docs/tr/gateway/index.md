---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve operasyonları için operasyon kılavuzu
title: Gateway çalıştırma kılavuzu
x-i18n:
    generated_at: "2026-06-28T00:35:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

Bu sayfayı Gateway hizmetinin 1. gün başlangıcı ve 2. gün operasyonları için kullanın.

<CardGroup cols={2}>
  <Card title="Derin sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Belirti öncelikli tanılama, kesin komut sıraları ve günlük imzalarıyla.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgiler yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve migrate/reload operasyonları.
  </Card>
  <Card title="Gizli bilgiler plan sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Kesin `secrets apply` hedef/yol kuralları ve yalnızca ref kullanan auth-profile davranışı.
  </Card>
</CardGroup>

## 5 dakikalık yerel başlangıç

<Steps>
  <Step title="Gateway'i başlatın">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Hizmet sağlığını doğrulayın">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: `Runtime: running`, `Connectivity probe: ok` ve beklediğinizle eşleşen `Capability: ...`. Yalnızca erişilebilirlik değil, read-scope RPC kanıtı gerektiğinde `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazır olma durumunu doğrulayın">

```bash
openclaw channels status --probe
```

Erişilebilir bir gateway ile bu, hesap başına canlı kanal yoklamaları ve isteğe bağlı denetimler çalıştırır.
Gateway erişilemez durumdaysa CLI, canlı yoklama çıktısı yerine yalnızca yapılandırmaya dayalı kanal özetlerine geri döner.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yüklemesi etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından çözümlenir veya ayarlandığında `OPENCLAW_CONFIG_PATH` kullanılır).
Varsayılan mod `gateway.reload.mode="hybrid"` değeridir.
İlk başarılı yüklemeden sonra çalışan süreç etkin bellek içi yapılandırma anlık görüntüsünü sunar; başarılı yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, denetim düzlemi ve kanal bağlantıları için her zaman açık tek süreç.
- Şunlar için tek çoklanmış port:
  - WebSocket denetim/RPC
  - HTTP API'leri (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - İsteğe bağlı `/api/v1/admin/rpc` gibi Plugin HTTP rotaları
  - Denetim UI'ı ve hook'lar
- Varsayılan bağlama modu: `loopback`.
- Kimlik doğrulama varsayılan olarak gereklidir. Paylaşılan gizli bilgi kurulumları
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır ve loopback olmayan
  ters proxy kurulumları `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw'un en yüksek kaldıraçlı uyumluluk yüzeyi artık şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu küme neden önemlidir:

- Çoğu Open WebUI, LobeChat ve LibreChat entegrasyonu önce `/v1/models` yoklar.
- Birçok RAG ve bellek hattı `/v1/embeddings` bekler.
- Agent-yerel istemciler giderek daha fazla `/v1/responses` tercih eder.

Planlama notu:

- `/v1/models` agent önceliklidir: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, her zaman yapılandırılmış varsayılan agent'a eşlenen kararlı takma addır.
- Arka uç sağlayıcısı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi halde seçili agent'ın normal modeli ve embedding kurulumu denetimde kalır.

Bunların tümü ana Gateway portunda çalışır ve Gateway HTTP API'sinin geri kalanıyla aynı güvenilir operatör kimlik doğrulama sınırını kullanır.

Yönetici HTTP RPC (`POST /api/v1/admin/rpc`), WebSocket RPC kullanamayan ana makine araçları için ayrı, varsayılan olarak kapalı bir Plugin rotasıdır. Bkz. [Yönetici HTTP RPC](/tr/plugins/admin-http-rpc).

### Port ve bağlama önceliği

| Ayar         | Çözümleme sırası                                             |
| ------------ | ------------------------------------------------------------ |
| Gateway portu | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bağlama modu | CLI/geçersiz kılma → `gateway.bind` → `loopback`             |

Kurulu gateway hizmetleri, çözümlenen `--port` değerini supervisor metadata'sına kaydeder. `gateway.port` değiştirildikten sonra launchd/systemd/schtasks süreci yeni portta başlatsın diye `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın.

Gateway başlangıcı, loopback olmayan bağlamalar için yerel
Denetim UI kaynaklarını tohumlarken aynı etkin portu ve bağlamayı kullanır. Örneğin, `--bind lan --port 3000`
çalışma zamanı doğrulaması çalışmadan önce `http://localhost:3000` ve `http://127.0.0.1:3000`
kaynaklarını tohumlar. HTTPS proxy URL'leri gibi uzak tarayıcı kaynaklarını
`gateway.controlUi.allowedOrigins` içine açıkça ekleyin.

### Sıcak yeniden yükleme modları

| `gateway.reload.mode` | Davranış                                  |
| --------------------- | ----------------------------------------- |
| `off`                 | Yapılandırma yeniden yüklemesi yok        |
| `hot`                 | Yalnızca hot-safe değişiklikleri uygula   |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlat |
| `hybrid` (varsayılan) | Güvenliyse sıcak uygula, gerekliyse yeniden başlat |

## Operatör komut kümesi

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep`, daha derin bir RPC sağlık yoklaması için değil, ek hizmet keşfi (LaunchDaemons/systemd sistem
birimleri/schtasks) içindir.

## Birden çok gateway (aynı ana makine)

Çoğu kurulum makine başına bir gateway çalıştırmalıdır. Tek bir gateway birden çok
agent ve kanal barındırabilir.

Yalnızca bilinçli olarak izolasyon veya bir kurtarma botu istediğinizde birden çok gateway gerekir.

Yararlı denetimler:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklenecekler:

- `gateway status --deep`, eski launchd/systemd/schtasks kurulumları hâlâ duruyorsa `Other gateway-like services detected (best effort)`
  raporlayabilir ve temizlik ipuçları yazdırabilir.
- `gateway probe`, farklı gateway'ler yanıt verdiğinde veya OpenClaw erişilebilir hedeflerin aynı gateway olduğunu kanıtlayamadığında `multiple reachable gateway identities` uyarısı verebilir.
  Aynı gateway'e giden bir SSH tüneli, proxy URL'si veya yapılandırılmış uzak URL, taşıma portları farklı olsa bile
  birden çok taşıması olan tek
  gateway'dir.
- Bu bilinçliyse, her gateway için portları, yapılandırma/durumu ve çalışma alanı köklerini izole edin.

Her örnek için denetim listesi:

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
Geri dönüş: SSH tüneli.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Ardından istemcileri yerel olarak `ws://127.0.0.1:18789` adresine bağlayın.

<Warning>
SSH tünelleri gateway kimlik doğrulamasını atlatmaz. Paylaşılan gizli bilgi kimlik doğrulamasında, istemciler tünel üzerinden bile
`token`/`password` göndermelidir. Kimlik taşıyan modlarda,
isteğin yine de ilgili kimlik doğrulama yolunu karşılaması gerekir.
</Warning>

Bkz.: [Uzak Gateway](/tr/gateway/remote), [Kimlik Doğrulama](/tr/gateway/authentication), [Tailscale](/tr/gateway/tailscale).

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

Yeniden başlatmalar için `openclaw gateway restart` kullanın. Yeniden başlatma yerine `openclaw gateway stop` ve `openclaw gateway start` komutlarını zincirlemeyin.

macOS üzerinde `gateway stop` varsayılan olarak `launchctl bootout` kullanır; bu, LaunchAgent'ı kalıcı bir devre dışı bırakma olmadan geçerli önyükleme oturumundan kaldırır, böylece KeepAlive otomatik kurtarması beklenmeyen çökmelerden sonra hâlâ çalışır ve `gateway start` temiz şekilde yeniden etkinleştirir. Yeniden başlatmalar boyunca otomatik yeniden doğmayı kalıcı olarak bastırmak için `--disable` geçin: `openclaw gateway stop --disable`.

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) şeklindedir. `openclaw doctor`, hizmet yapılandırması sapmalarını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd kullanıcı)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Oturum kapatıldıktan sonra kalıcılık için lingering'i etkinleştirin:

```bash
sudo loginctl enable-linger <user>
```

Özel kurulum yolu gerektiğinde manuel kullanıcı birimi örneği:

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

Yerel Windows yönetimli başlangıç, `OpenClaw Gateway`
(veya adlandırılmış profiller için `OpenClaw Gateway (<profile>)`) adlı bir Scheduled Task kullanır. Scheduled Task
oluşturma reddedilirse OpenClaw, durum dizini içindeki `gateway.cmd` dosyasını işaret eden kullanıcı başına Startup-folder başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (sistem hizmeti)">

Çok kullanıcılı/her zaman açık ana makineler için bir sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Kullanıcı birimiyle aynı hizmet gövdesini kullanın, ancak bunu
`/etc/systemd/system/openclaw-gateway[-<profile>].service` altına kurun ve
`openclaw` ikiliniz başka bir yerdeyse `ExecStart=` değerini ayarlayın.

Aynı profil/port için `openclaw doctor --fix` komutunun ayrıca kullanıcı düzeyinde gateway hizmeti kurmasına izin vermeyin. Doctor, sistem düzeyinde bir OpenClaw gateway hizmeti bulduğunda bu otomatik kurulumu reddeder; sistem birimi yaşam döngüsünün sahibiyse `OPENCLAW_SERVICE_REPAIR_POLICY=external` kullanın.

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
- `hello-ok.features.methods` / `events`, çağrılabilir her yardımcı rotanın
  oluşturulmuş dökümü değil, tutucu bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları
  ve `shutdown` bulunur.

Agent çalıştırmaları iki aşamalıdır:

1. Anında kabul onayı (`status:"accepted"`)
2. Arada stream edilen `agent` olaylarıyla birlikte son tamamlama yanıtı (`status:"ok"|"error"`).

Tam protokol belgelerine bakın: [Gateway Protokolü](/tr/gateway/protocol).

## Operasyonel denetimler

### Canlılık

- WS açın ve `connect` gönderin.
- Anlık görüntüyle birlikte `hello-ok` yanıtı bekleyin.

### Hazır olma

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Boşluk kurtarma

Olaylar yeniden oynatılmaz. Sıra boşluklarında, devam etmeden önce durumu (`health`, `system-presence`) yenileyin.

## Yaygın hata imzaları

| İmza                                                          | Olası sorun                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Geçerli bir gateway auth yolu olmadan loopback olmayan bağlama                  |
| `another gateway instance is already listening` / `EADDRINUSE` | Bağlantı noktası çakışması                                                      |
| `Gateway start blocked: set gateway.mode=local`               | Yapılandırma uzak moda ayarlanmış veya hasarlı bir yapılandırmada yerel mod damgası eksik |
| Bağlanma sırasında `unauthorized`                             | İstemci ile Gateway arasında auth uyuşmazlığı                                   |

Tam tanılama basamakları için [Gateway Sorun Giderme](/tr/gateway/troubleshooting) sayfasını kullanın.

## Güvenlik garantileri

- Gateway protokol istemcileri Gateway kullanılamadığında hızlı başarısız olur (örtük doğrudan kanal yedeği yoktur).
- Geçersiz/bağlantı olmayan ilk frame'ler reddedilir ve kapatılır.
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
