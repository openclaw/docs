---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve operasyonları için operasyon kılavuzu
title: Gateway operasyon kılavuzu
x-i18n:
    generated_at: "2026-05-10T19:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

Bu sayfayı Gateway hizmetinin 1. gün başlatması ve 2. gün operasyonları için kullanın.

<CardGroup cols={2}>
  <Card title="Derin sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Kesin komut basamakları ve günlük imzalarıyla belirti odaklı tanılama.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgiler yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve migrate/reload işlemleri.
  </Card>
  <Card title="Gizli bilgiler planı sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Kesin `secrets apply` hedef/yol kuralları ve yalnızca ref auth-profile davranışı.
  </Card>
</CardGroup>

## 5 dakikalık yerel başlatma

<Steps>
  <Step title="Gateway’i başlat">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Hizmet sağlığını doğrula">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: Beklediğinizle eşleşen `Runtime: running`, `Connectivity probe: ok` ve `Capability: ...`. Yalnızca erişilebilirlik değil, okuma kapsamlı RPC kanıtı gerektiğinde `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazır olma durumunu doğrula">

```bash
openclaw channels status --probe
```

Erişilebilir bir Gateway ile bu, hesap başına canlı kanal yoklamaları ve isteğe bağlı denetimler çalıştırır.
Gateway erişilemezse CLI, canlı yoklama çıktısı yerine yalnızca yapılandırmaya dayalı kanal özetlerine geri döner.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yüklemesi etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından çözümlenir veya ayarlandığında `OPENCLAW_CONFIG_PATH` kullanılır).
Varsayılan mod `gateway.reload.mode="hybrid"` değeridir.
İlk başarılı yüklemeden sonra çalışan süreç etkin bellek içi yapılandırma anlık görüntüsünü sunar; başarılı yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, denetim düzlemi ve kanal bağlantıları için sürekli açık tek süreç.
- Şunlar için tek çoğullamalı port:
  - WebSocket denetimi/RPC
  - HTTP API’leri, OpenAI uyumlu (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Denetim kullanıcı arayüzü ve hook’lar
- Varsayılan bağlama modu: `loopback`.
- Kimlik doğrulama varsayılan olarak gereklidir. Paylaşılan gizli bilgi kurulumları
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır ve local loopback olmayan
  ters proxy kurulumları `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw’ın en yüksek getirili uyumluluk yüzeyi artık şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu kümenin neden önemli olduğu:

- Çoğu Open WebUI, LobeChat ve LibreChat entegrasyonu önce `/v1/models` yoklar.
- Birçok RAG ve bellek hattı `/v1/embeddings` bekler.
- Ajan yerel istemciler giderek daha fazla `/v1/responses` tercih eder.

Planlama notu:

- `/v1/models` ajan önceliklidir: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, her zaman yapılandırılmış varsayılan ajana eşlenen kararlı takma addır.
- Bir arka uç sağlayıcı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi halde seçilen ajanın normal model ve embedding kurulumu denetimde kalır.

Bunların tümü ana Gateway portunda çalışır ve Gateway HTTP API’sinin geri kalanıyla aynı güvenilir operatör kimlik doğrulama sınırını kullanır.

### Port ve bağlama önceliği

| Ayar         | Çözümleme sırası                                             |
| ------------ | ------------------------------------------------------------- |
| Gateway portu | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bağlama modu | CLI/geçersiz kılma → `gateway.bind` → `loopback`              |

Kurulu Gateway hizmetleri çözümlenen `--port` değerini gözetmen metaverisine kaydeder. `gateway.port` değiştirildikten sonra launchd/systemd/schtasks süreci yeni portta başlatsın diye `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın.

Gateway başlatması, local loopback olmayan bağlamalar için yerel Denetim kullanıcı arayüzü origin’lerini tohumlarken aynı etkin portu ve bağlamayı kullanır. Örneğin, `--bind lan --port 3000`, çalışma zamanı doğrulaması çalışmadan önce `http://localhost:3000` ve `http://127.0.0.1:3000` değerlerini tohumlar. HTTPS proxy URL’leri gibi uzak tarayıcı origin’lerini `gateway.controlUi.allowedOrigins` içine açıkça ekleyin.

### Sıcak yeniden yükleme modları

| `gateway.reload.mode` | Davranış                                      |
| --------------------- | --------------------------------------------- |
| `off`                 | Yapılandırma yeniden yüklemesi yok            |
| `hot`                 | Yalnızca sıcak-güvenli değişiklikleri uygula  |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlat |
| `hybrid` (varsayılan) | Güvenliyse sıcak uygula, gerektiğinde yeniden başlat |

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

`gateway status --deep`, daha derin bir RPC sağlık yoklaması için değil, ek hizmet keşfi (LaunchDaemons/systemd sistem birimleri/schtasks) içindir.

## Birden fazla Gateway (aynı ana makine)

Çoğu kurulum makine başına bir Gateway çalıştırmalıdır. Tek bir Gateway birden fazla ajan ve kanalı barındırabilir.

Yalnızca bilinçli olarak yalıtım veya kurtarma botu istediğinizde birden fazla Gateway gerekir.

Yararlı denetimler:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklenecekler:

- `gateway status --deep`, eski launchd/systemd/schtasks kurulumları hâlâ duruyorsa `Other gateway-like services detected (best effort)` bildirebilir ve temizlik ipuçları yazdırabilir.
- Birden fazla hedef yanıt verdiğinde `gateway probe`, `multiple reachable gateways` hakkında uyarabilir.
- Bu bilinçliyse portları, yapılandırma/durumu ve çalışma alanı köklerini Gateway başına yalıtın.

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

## Uzak erişim

Tercih edilen: Tailscale/VPN.
Geri dönüş: SSH tüneli.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Ardından istemcileri yerel olarak `ws://127.0.0.1:18789` adresine bağlayın.

<Warning>
SSH tünelleri Gateway kimlik doğrulamasını atlatmaz. Paylaşılan gizli bilgi kimlik doğrulaması için istemciler tünel üzerinden bile hâlâ `token`/`password` göndermelidir. Kimlik taşıyan modlarda isteğin yine de ilgili kimlik doğrulama yolunu karşılaması gerekir.
</Warning>

Bkz.: [Uzak Gateway](/tr/gateway/remote), [Kimlik doğrulama](/tr/gateway/authentication), [Tailscale](/tr/gateway/tailscale).

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

macOS’ta `gateway stop` varsayılan olarak `launchctl bootout` kullanır; bu, kalıcı bir devre dışı bırakma yapmadan LaunchAgent’ı geçerli önyükleme oturumundan kaldırır, böylece KeepAlive otomatik kurtarması beklenmeyen çökmelerden sonra hâlâ çalışır ve `gateway start` temiz biçimde yeniden etkinleştirir. Yeniden başlatmalar arasında otomatik yeniden doğmayı kalıcı olarak bastırmak için `--disable` geçirin: `openclaw gateway stop --disable`.

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) şeklindedir. `openclaw doctor` hizmet yapılandırması sapmasını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd kullanıcı)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Oturum kapattıktan sonra kalıcılık için lingering’i etkinleştirin:

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

Yerel Windows yönetimli başlangıcı `OpenClaw Gateway` adlı bir Zamanlanmış Görev kullanır (veya adlandırılmış profiller için `OpenClaw Gateway (<profile>)`). Zamanlanmış Görev oluşturma reddedilirse OpenClaw, durum dizini içindeki `gateway.cmd` dosyasını işaret eden kullanıcı başına Başlangıç klasörü başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (sistem hizmeti)">

Çok kullanıcılı/sürekli açık ana makineler için bir sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Kullanıcı birimiyle aynı hizmet gövdesini kullanın, ancak bunu `/etc/systemd/system/openclaw-gateway[-<profile>].service` altına kurun ve `openclaw` ikiliniz başka bir yerdeyse `ExecStart=` değerini ayarlayın.

Aynı profil/port için `openclaw doctor --fix` komutunun ayrıca kullanıcı düzeyinde bir Gateway hizmeti kurmasına izin vermeyin. Doctor, sistem düzeyinde bir OpenClaw Gateway hizmeti bulduğunda bu otomatik kurulumu reddeder; yaşam döngüsünün sahibi sistem birimiyse `OPENCLAW_SERVICE_REPAIR_POLICY=external` kullanın.

  </Tab>
</Tabs>

## Geliştirme profili hızlı yolu

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlar yalıtılmış durum/yapılandırma ve temel Gateway portu `19001` içerir.

## Protokol hızlı başvurusu (operatör görünümü)

- İlk istemci karesi `connect` olmalıdır.
- Gateway `hello-ok` anlık görüntüsünü döndürür (`presence`, `health`, `stateVersion`, `uptimeMs`, sınırlar/politika).
- `hello-ok.features.methods` / `events`, çağrılabilir her yardımcı rotanın üretilmiş dökümü değil, temkinli bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`, `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`, `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Ajan çalıştırmaları iki aşamalıdır:

1. Anında kabul edildi onayı (`status:"accepted"`)
2. Arada akışla gelen `agent` olaylarıyla nihai tamamlama yanıtı (`status:"ok"|"error"`).

Tam protokol belgelerine bakın: [Gateway Protokolü](/tr/gateway/protocol).

## Operasyonel denetimler

### Canlılık

- WS açın ve `connect` gönderin.
- Anlık görüntü içeren `hello-ok` yanıtı bekleyin.

### Hazır olma

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Boşluk kurtarma

Olaylar yeniden oynatılmaz. Sıra boşluklarında devam etmeden önce durumu yenileyin (`health`, `system-presence`).

## Yaygın hata imzaları

| İmza                                                           | Olası sorun                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Geçerli bir Gateway kimlik doğrulama yolu olmadan loopback dışı bağlama         |
| `another gateway instance is already listening` / `EADDRINUSE` | Bağlantı noktası çakışması                                                      |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak moda ayarlanmış veya hasarlı bir yapılandırmada yerel mod damgası eksik |
| `unauthorized` sırasında connect                              | İstemci ile Gateway arasında kimlik doğrulama uyuşmazlığı                       |

Tam tanılama merdivenleri için [Gateway Sorun Giderme](/tr/gateway/troubleshooting) sayfasını kullanın.

## Güvenlik garantileri

- Gateway kullanılamadığında Gateway protokol istemcileri hızla başarısız olur (örtük doğrudan kanal yedeği yoktur).
- Geçersiz/bağlanmayan ilk çerçeveler reddedilir ve kapatılır.
- Zarif kapatma, soket kapanmadan önce `shutdown` olayını yayar.

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
