---
read_when:
    - Gateway işlemini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve operasyonları için operasyon kılavuzu
title: Gateway operasyon kılavuzu
x-i18n:
    generated_at: "2026-05-06T09:12:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

Gateway hizmetinin 1. gün başlatma ve 2. gün operasyonları için bu sayfayı kullanın.

<CardGroup cols={2}>
  <Card title="Derin sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Tam komut basamakları ve günlük imzalarıyla belirti odaklı tanılama.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgi yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve migrate/reload işlemleri.
  </Card>
  <Card title="Gizli bilgi planı sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Tam `secrets apply` hedef/yol kuralları ve yalnızca ref kullanan auth-profile davranışı.
  </Card>
</CardGroup>

## 5 dakikalık yerel başlatma

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

Sağlıklı temel durum: beklediğinizle eşleşen `Runtime: running`, `Connectivity probe: ok` ve `Capability: ...`. Yalnızca erişilebilirlik değil, okuma kapsamlı RPC kanıtı gerektiğinde `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazır olma durumunu doğrulayın">

```bash
openclaw channels status --probe
```

Erişilebilir bir gateway ile bu, hesap başına canlı kanal probları ve isteğe bağlı denetimler çalıştırır.
Gateway erişilemezse CLI, canlı prob çıktısı yerine yalnızca yapılandırmaya dayalı kanal özetlerine geri döner.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yüklemesi, etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından çözümlenir veya ayarlandığında `OPENCLAW_CONFIG_PATH` kullanılır).
Varsayılan mod `gateway.reload.mode="hybrid"` şeklindedir.
İlk başarılı yüklemeden sonra çalışan süreç, etkin bellek içi yapılandırma anlık görüntüsünü sunar; başarılı yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, kontrol düzlemi ve kanal bağlantıları için her zaman açık tek süreç.
- Şunlar için tek çoklanmış port:
  - WebSocket kontrol/RPC
  - HTTP API'leri, OpenAI uyumlu (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Kontrol kullanıcı arayüzü ve hook'lar
- Varsayılan bağlama modu: `loopback`.
- Kimlik doğrulama varsayılan olarak gereklidir. Paylaşılan gizli bilgi kurulumları
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır ve loopback olmayan
  ters proxy kurulumları `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw'ın en yüksek kaldıraçlı uyumluluk yüzeyi artık şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu kümenin neden önemli olduğu:

- Çoğu Open WebUI, LobeChat ve LibreChat entegrasyonu önce `/v1/models` yoklar.
- Birçok RAG ve bellek hattı `/v1/embeddings` bekler.
- Agent yerel istemciler giderek daha fazla `/v1/responses` tercih eder.

Planlama notu:

- `/v1/models` agent önceliklidir: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, her zaman yapılandırılmış varsayılan agent'a eşlenen kararlı takma addır.
- Arka uç sağlayıcı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi halde seçili agent'ın normal modeli ve embedding kurulumu denetimde kalır.

Bunların tümü ana Gateway portunda çalışır ve Gateway HTTP API'sinin geri kalanıyla aynı güvenilir operatör kimlik doğrulama sınırını kullanır.

### Port ve bağlama önceliği

| Ayar         | Çözümleme sırası                                             |
| ------------ | ------------------------------------------------------------- |
| Gateway portu | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bağlama modu | CLI/geçersiz kılma → `gateway.bind` → `loopback`              |

Yüklenen gateway hizmetleri çözümlenen `--port` değerini gözetmen meta verilerine kaydeder. `gateway.port` değiştirildikten sonra launchd/systemd/schtasks sürecin yeni portta başlaması için `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın.

Gateway başlatması, loopback olmayan bağlamalar için yerel Kontrol UI kökenlerini eklerken aynı etkin portu ve bağlamayı kullanır. Örneğin `--bind lan --port 3000`, çalışma zamanı doğrulaması çalışmadan önce `http://localhost:3000` ve `http://127.0.0.1:3000` ekler. HTTPS proxy URL'leri gibi uzak tarayıcı kökenlerini açıkça `gateway.controlUi.allowedOrigins` içine ekleyin.

### Sıcak yeniden yükleme modları

| `gateway.reload.mode` | Davranış                                      |
| --------------------- | --------------------------------------------- |
| `off`                 | Yapılandırma yeniden yüklemesi yok            |
| `hot`                 | Yalnızca sıcak güvenli değişiklikleri uygula  |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlat |
| `hybrid` (varsayılan) | Güvenliyse sıcak uygula, gerekiyorsa yeniden başlat |

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

`gateway status --deep` daha derin bir RPC sağlık probu değil, ek hizmet keşfi (LaunchDaemons/systemd sistem birimleri/schtasks) içindir.

## Birden çok gateway (aynı host)

Çoğu kurulumda makine başına tek bir gateway çalıştırılmalıdır. Tek bir gateway birden çok agent ve kanalı barındırabilir.

Yalnızca bilinçli olarak yalıtım veya kurtarma botu istediğinizde birden çok gateway gerekir.

Yararlı kontroller:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklenenler:

- `gateway status --deep`, eskimiş launchd/systemd/schtasks kurulumları hâlâ mevcut olduğunda `Other gateway-like services detected (best effort)` bildirebilir ve temizleme ipuçları yazdırabilir.
- `gateway probe`, birden fazla hedef yanıt verdiğinde `multiple reachable gateways` hakkında uyarabilir.
- Bu bilinçliyse her gateway için portları, yapılandırma/durum verilerini ve çalışma alanı köklerini yalıtın.

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
SSH tünelleri gateway kimlik doğrulamasını atlatmaz. Paylaşılan gizli bilgi kimlik doğrulaması için istemciler tünel üzerinden bile `token`/`password` göndermelidir. Kimlik taşıyan modlarda, istek yine bu kimlik doğrulama yolunu karşılamalıdır.
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

Yeniden başlatmalar için `openclaw gateway restart` kullanın. `openclaw gateway stop` ve `openclaw gateway start` komutlarını zincirlemeyin; macOS'ta `gateway stop`, LaunchAgent'ı durdurmadan önce bilinçli olarak devre dışı bırakır.

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) şeklindedir. `openclaw doctor` hizmet yapılandırma kaymasını denetler ve onarır.

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

Yerel Windows yönetimli başlatma, `OpenClaw Gateway` (veya adlandırılmış profiller için `OpenClaw Gateway (<profile>)`) adlı bir Zamanlanmış Görev kullanır. Zamanlanmış Görev oluşturma reddedilirse OpenClaw, durum dizini içindeki `gateway.cmd` dosyasına işaret eden kullanıcı başına Startup klasörü başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (sistem hizmeti)">

Çok kullanıcılı/her zaman açık host'lar için bir sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Kullanıcı birimiyle aynı hizmet gövdesini kullanın, ancak bunu `/etc/systemd/system/openclaw-gateway[-<profile>].service` altına yükleyin ve `openclaw` ikiliniz başka bir yerdeyse `ExecStart=` değerini ayarlayın.

Aynı profil/port için `openclaw doctor --fix` komutunun ayrıca kullanıcı düzeyinde bir gateway hizmeti yüklemesine izin vermeyin. Doctor, sistem düzeyinde bir OpenClaw gateway hizmeti bulduğunda bu otomatik kurulumu reddeder; sistem birimi yaşam döngüsüne sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` kullanın.

  </Tab>
</Tabs>

## Geliştirme profili hızlı yolu

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlar yalıtılmış durum/yapılandırma ve temel gateway portu `19001` içerir.

## Protokol hızlı başvurusu (operatör görünümü)

- İlk istemci frame'i `connect` olmalıdır.
- Gateway `hello-ok` anlık görüntüsü (`presence`, `health`, `stateVersion`, `uptimeMs`, limitler/politika) döndürür.
- `hello-ok.features.methods` / `events`, çağrılabilir her yardımcı rotanın oluşturulmuş dökümü değil, ihtiyatlı bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Agent çalıştırmaları iki aşamalıdır:

1. Anında kabul onayı (`status:"accepted"`)
2. Arada akan `agent` olaylarıyla nihai tamamlama yanıtı (`status:"ok"|"error"`).

Tam protokol belgelerine bakın: [Gateway Protokolü](/tr/gateway/protocol).

## Operasyonel kontroller

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

Olaylar yeniden oynatılmaz. Sıra boşluklarında devam etmeden önce durumu (`health`, `system-presence`) yenileyin.

## Yaygın hata imzaları

| İmza                                                           | Olası sorun                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Geçerli bir gateway kimlik doğrulama yolu olmadan loopback olmayan bağlama      |
| `another gateway instance is already listening` / `EADDRINUSE` | Port çakışması                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak moda ayarlanmış veya hasarlı bir yapılandırmada yerel mod damgası eksik |
| `unauthorized` during connect                                  | İstemci ve gateway arasında kimlik doğrulama uyuşmazlığı                        |

Tam tanılama basamakları için [Gateway Sorun Giderme](/tr/gateway/troubleshooting) kullanın.

## Güvenlik garantileri

- Gateway protokol istemcileri, Gateway kullanılamadığında hızla başarısız olur (örtük doğrudan kanal geri dönüşü yoktur).
- Geçersiz/connect olmayan ilk çerçeveler reddedilip kapatılır.
- Zarif kapatma, soket kapanmadan önce `shutdown` olayını yayar.

---

İlgili:

- [Sorun giderme](/tr/gateway/troubleshooting)
- [Arka Plan Süreci](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Sağlık](/tr/gateway/health)
- [Doctor](/tr/gateway/doctor)
- [Kimlik doğrulama](/tr/gateway/authentication)

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
- [Uzaktan erişim](/tr/gateway/remote)
- [Gizli bilgi yönetimi](/tr/gateway/secrets)
