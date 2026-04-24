---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve operasyonları için çalışma kılavuzu
title: Gateway çalışma kılavuzu
x-i18n:
    generated_at: "2026-04-24T09:09:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Gateway hizmetinin 1. gün başlatılması ve 2. gün operasyonları için bu sayfayı kullanın.

<CardGroup cols={2}>
  <Card title="Derin sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Belirti odaklı tanılama; tam komut sıraları ve günlük imzalarıyla.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgi yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntüsü davranışı ve taşıma/yeniden yükleme işlemleri.
  </Card>
  <Card title="Gizli bilgiler plan sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Tam `secrets apply` hedef/yol kuralları ve yalnızca ref içeren kimlik doğrulama profili davranışı.
  </Card>
</CardGroup>

## 5 dakikalık yerel başlangıç

<Steps>
  <Step title="Gateway’i başlatın">

```bash
openclaw gateway --port 18789
# hata ayıklama/iz stdio'ya yansıtılır
openclaw gateway --port 18789 --verbose
# seçilen porttaki dinleyiciyi zorla sonlandır, ardından başlat
openclaw gateway --force
```

  </Step>

  <Step title="Hizmet sağlığını doğrulayın">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: `Runtime: running`, `Connectivity probe: ok` ve beklediğinizle eşleşen `Capability: ...`. Sadece erişilebilirlik değil, okuma kapsamlı RPC kanıtı gerektiğinde `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazırlığını doğrulayın">

```bash
openclaw channels status --probe
```

Erişilebilir bir Gateway ile bu, canlı hesap başına kanal probe’larını ve isteğe bağlı denetimleri çalıştırır.
Gateway’e ulaşılamazsa CLI, canlı probe çıktısı yerine yalnızca yapılandırma temelli kanal özetlerine geri düşer.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yüklemesi etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından veya ayarlıysa `OPENCLAW_CONFIG_PATH` üzerinden çözülür).
Varsayılan kip `gateway.reload.mode="hybrid"` şeklindedir.
İlk başarılı yüklemeden sonra çalışan süreç etkin bellek içi yapılandırma anlık görüntüsünü sunar; başarılı yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, denetim düzlemi ve kanal bağlantıları için her zaman açık tek süreç.
- Şunlar için tek çoğullamalı port:
  - WebSocket denetim/RPC
  - HTTP API’leri, OpenAI uyumlu (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Denetim UI’si ve hook'lar
- Varsayılan bağlama kipi: `loopback`.
- Kimlik doğrulama varsayılan olarak gereklidir. Paylaşılan gizli kurulumlar
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır ve loopback olmayan
  reverse-proxy kurulumları `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw’ın artık en yüksek kaldıraçlı uyumluluk yüzeyi şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu kümenin neden önemli olduğu:

- Çoğu Open WebUI, LobeChat ve LibreChat entegrasyonu önce `/v1/models` probe eder.
- Birçok RAG ve bellek işlem hattı `/v1/embeddings` bekler.
- Aracıya özgü istemciler giderek daha fazla `/v1/responses` tercih ediyor.

Planlama notu:

- `/v1/models` önce aracı yaklaşımını kullanır: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, her zaman yapılandırılmış varsayılan aracıya eşlenen kararlı takma addır.
- Arka uç sağlayıcı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi halde seçilen aracının normal modeli ve embedding kurulumu denetimi elinde tutar.

Bunların tümü ana Gateway portunda çalışır ve Gateway HTTP API’sinin geri kalanıyla aynı güvenilen operatör kimlik doğrulama sınırını kullanır.

### Port ve bağlama önceliği

| Ayar         | Çözümleme sırası                                             |
| ------------ | ------------------------------------------------------------ |
| Gateway portu | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bağlama kipi | CLI/geçersiz kılma → `gateway.bind` → `loopback`             |

### Sıcak yeniden yükleme kipleri

| `gateway.reload.mode` | Davranış                                      |
| --------------------- | --------------------------------------------- |
| `off`                 | Yapılandırma yeniden yükleme yok              |
| `hot`                 | Yalnızca güvenli sıcak değişiklikleri uygula  |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlat |
| `hybrid` (varsayılan) | Güvenliyse sıcak uygula, gerekirse yeniden başlat |

## Operatör komut kümesi

```bash
openclaw gateway status
openclaw gateway status --deep   # sistem düzeyi hizmet taraması ekler
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep`, daha derin bir RPC sağlık probe’u için değil, ek hizmet keşfi içindir (LaunchDaemons/systemd sistem birimleri/schtasks).

## Birden fazla Gateway (aynı ana makine)

Çoğu kurulum makine başına bir Gateway çalıştırmalıdır. Tek bir Gateway birden fazla
aracıyı ve kanalı barındırabilir.

Yalnızca kasıtlı olarak yalıtım veya bir kurtarma botu istediğinizde birden fazla Gateway gerekir.

Yararlı denetimler:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklenmesi gerekenler:

- `gateway status --deep`, `Other gateway-like services detected (best effort)`
  bildirebilir ve eski launchd/systemd/schtasks kurulumları hâlâ ortadaysa temizleme ipuçları yazdırabilir.
- `gateway probe`, birden fazla hedef yanıt verdiğinde `multiple reachable gateways` konusunda uyarabilir.
- Bu kasıtlıysa portları, yapılandırma/durum alanlarını ve çalışma alanı köklerini Gateway başına yalıtın.

Örnek başına denetim listesi:

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
SSH tünelleri Gateway kimlik doğrulamasını atlatmaz. Paylaşılan gizli kimlik doğrulaması için istemciler
tünel üzerinden bile yine `token`/`password` göndermelidir. Kimlik taşıyan kiplerde
isteğin yine de o kimlik doğrulama yolunu sağlaması gerekir.
</Warning>

Bkz.: [Uzak Gateway](/tr/gateway/remote), [Kimlik Doğrulama](/tr/gateway/authentication), [Tailscale](/tr/gateway/tailscale).

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

LaunchAgent etiketleri varsayılan için `ai.openclaw.gateway`, adlandırılmış profil için `ai.openclaw.<profile>` şeklindedir. `openclaw doctor`, hizmet yapılandırması sapmasını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Oturum kapatmadan sonra kalıcılık için lingering’i etkinleştirin:

```bash
sudo loginctl enable-linger <user>
```

Özel kurulum yolu gerektiğinde elle user-unit örneği:

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

Yerel Windows yönetilen başlangıcı, `OpenClaw Gateway`
(adlandırılmış profiller için `OpenClaw Gateway (<profile>)`) adlı bir Scheduled Task kullanır. Scheduled Task
oluşturma reddedilirse OpenClaw, durum dizini içindeki `gateway.cmd` dosyasına işaret eden kullanıcı başına Startup-folder başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (system service)">

Çok kullanıcılı/her zaman açık ana makineler için bir sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

User unit ile aynı hizmet gövdesini kullanın, ancak bunu
`/etc/systemd/system/openclaw-gateway[-<profile>].service` altına kurun ve
`openclaw` ikili dosyanız başka yerdeyse `ExecStart=` değerini ayarlayın.

  </Tab>
</Tabs>

## Geliştirici profili hızlı yol

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlar yalıtılmış durum/yapılandırma ve temel Gateway portu `19001` içerir.

## Protokol hızlı başvurusu (operatör görünümü)

- İlk istemci çerçevesi `connect` olmalıdır.
- Gateway, `hello-ok` anlık görüntüsü döndürür (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events`, çağrılabilir tüm yardımcı yolların oluşturulmuş dökümü değil,
  tutucu bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Aracı çalıştırmaları iki aşamalıdır:

1. Anında kabul onayı (`status:"accepted"`)
2. Arada akışlı `agent` olaylarıyla birlikte son tamamlama yanıtı (`status:"ok"|"error"`)

Tam protokol belgeleri: [Gateway Protocol](/tr/gateway/protocol).

## Operasyonel denetimler

### Canlılık

- WS açın ve `connect` gönderin.
- Anlık görüntüyle `hello-ok` yanıtı bekleyin.

### Hazır olma

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Boşluk kurtarma

Olaylar yeniden oynatılmaz. Sıra boşluklarında devam etmeden önce durumu yenileyin (`health`, `system-presence`).

## Yaygın hata imzaları

| İmza                                                           | Olası sorun                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Geçerli bir Gateway kimlik doğrulama yolu olmadan loopback dışı bağlama        |
| `another gateway instance is already listening` / `EADDRINUSE` | Port çakışması                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak kipte, veya yerel kip damgası hasarlı yapılandırmada eksik   |
| `unauthorized` during connect                                  | İstemci ile Gateway arasında kimlik doğrulama uyuşmazlığı                      |

Tam tanılama sıraları için [Gateway Sorun Giderme](/tr/gateway/troubleshooting) kullanın.

## Güvenlik garantileri

- Gateway protokol istemcileri Gateway kullanılamadığında hızlıca başarısız olur (örtük doğrudan kanal geri dönüşü yok).
- Geçersiz/connect olmayan ilk çerçeveler reddedilir ve kapatılır.
- Zarif kapatma, soket kapanmadan önce `shutdown` olayı üretir.

---

İlgili:

- [Sorun giderme](/tr/gateway/troubleshooting)
- [Arka Plan Süreci](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Sağlık](/tr/gateway/health)
- [Doctor](/tr/gateway/doctor)
- [Kimlik Doğrulama](/tr/gateway/authentication)

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
- [Uzak erişim](/tr/gateway/remote)
- [Gizli bilgi yönetimi](/tr/gateway/secrets)
