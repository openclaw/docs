---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve işlemleri için runbook
title: Gateway Runbook
x-i18n:
    generated_at: "2026-04-05T13:53:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Gateway runbook

Bu sayfayı Gateway hizmetinin ilk gün kurulumu ve sonraki operasyonları için kullanın.

<CardGroup cols={2}>
  <Card title="Derin sorun giderme" icon="siren" href="/gateway/troubleshooting">
    Belirti odaklı tanılama, tam komut sıraları ve günlük imzalarıyla birlikte.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli değer yönetimi" icon="key-round" href="/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve taşıma/yeniden yükleme işlemleri.
  </Card>
  <Card title="Gizli değer planı sözleşmesi" icon="shield-check" href="/gateway/secrets-plan-contract">
    Tam `secrets apply` hedef/yol kuralları ve yalnızca ref kullanan auth-profile davranışı.
  </Card>
</CardGroup>

## 5 dakikada yerel başlangıç

<Steps>
  <Step title="Gateway'i başlatın">

```bash
openclaw gateway --port 18789
# stdio'ya yansıtılmış debug/trace
openclaw gateway --port 18789 --verbose
# seçilen bağlantı noktasındaki dinleyiciyi zorla sonlandır, sonra başlat
openclaw gateway --force
```

  </Step>

  <Step title="Hizmet sağlığını doğrulayın">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: `Runtime: running` ve `RPC probe: ok`.

  </Step>

  <Step title="Kanal hazır olma durumunu doğrulayın">

```bash
openclaw channels status --probe
```

Erişilebilir bir gateway ile bu komut, hesap başına canlı kanal yoklamalarını ve isteğe bağlı denetimleri çalıştırır.
Gateway'e erişilemiyorsa, CLI canlı yoklama çıktısı yerine yalnızca yapılandırma tabanlı kanal özetlerine geri döner.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yüklemesi etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından çözülür veya ayarlanmışsa `OPENCLAW_CONFIG_PATH` kullanılır).
Varsayılan mod `gateway.reload.mode="hybrid"` şeklindedir.
İlk başarılı yüklemeden sonra çalışan süreç etkin bellek içi yapılandırma anlık görüntüsünü sunar; başarılı bir yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, kontrol düzlemi ve kanal bağlantıları için her zaman açık tek süreç.
- Aşağıdakiler için tek çoklanmış bağlantı noktası:
  - WebSocket denetim/RPC
  - HTTP API'leri, OpenAI uyumlu (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Kontrol UI'si ve hook'lar
- Varsayılan bind modu: `loopback`.
- Kimlik doğrulama varsayılan olarak gereklidir. Paylaşılan gizli değer kurulumları
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır ve loopback dışı
  reverse-proxy kurulumları `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw'ın en yüksek etkili uyumluluk yüzeyi artık şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu kümenin neden önemli olduğu:

- Open WebUI, LobeChat ve LibreChat entegrasyonlarının çoğu önce `/v1/models` yoklaması yapar.
- Birçok RAG ve bellek işlem hattı `/v1/embeddings` bekler.
- Ajan odaklı istemciler giderek daha çok `/v1/responses` tercih ediyor.

Planlama notu:

- `/v1/models` ajan odaklıdır: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, her zaman yapılandırılmış varsayılan ajana eşlenen kararlı takma addır.
- Bir arka uç sağlayıcı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi takdirde seçilen ajanın normal model ve embedding kurulumu denetimde kalır.

Bunların tümü ana Gateway bağlantı noktasında çalışır ve Gateway HTTP API'sinin geri kalanıyla aynı güvenilen operatör auth sınırını kullanır.

### Bağlantı noktası ve bind önceliği

| Ayar          | Çözümleme sırası                                              |
| ------------- | ------------------------------------------------------------- |
| Gateway portu | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind modu     | CLI/override → `gateway.bind` → `loopback`                    |

### Anında yeniden yükleme modları

| `gateway.reload.mode` | Davranış                                    |
| --------------------- | ------------------------------------------- |
| `off`                 | Yapılandırma yeniden yüklemesi yok          |
| `hot`                 | Yalnızca anında uygulanması güvenli değişiklikleri uygula |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlat |
| `hybrid` (varsayılan) | Güvenliyse anında uygula, gerekirse yeniden başlat |

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

`gateway status --deep`, daha derin bir RPC sağlık yoklaması için değil, ek hizmet keşfi içindir (LaunchDaemons/systemd sistem birimleri/schtasks).

## Birden fazla gateway (aynı ana makine)

Çoğu kurulum makine başına bir gateway çalıştırmalıdır. Tek bir gateway birden fazla
ajanı ve kanalı barındırabilir.

Yalnızca bilinçli olarak yalıtım veya kurtarma botu istiyorsanız birden fazla gateway gerekir.

Yararlı kontroller:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklenmesi gerekenler:

- `gateway status --deep`, `Other gateway-like services detected (best effort)` bildirebilir
  ve eski launchd/systemd/schtasks kurulumları hâlâ mevcutsa temizleme ipuçları yazdırabilir.
- `gateway probe`, birden fazla hedef yanıt verdiğinde `multiple reachable gateways`
  uyarısı verebilir.
- Bu kasıtlıysa, gateway başına bağlantı noktalarını, yapılandırma/durum ve çalışma alanı köklerini yalıtın.

Ayrıntılı kurulum: [/gateway/multiple-gateways](/gateway/multiple-gateways).

## Uzak erişim

Tercih edilen: Tailscale/VPN.
Geri dönüş: SSH tüneli.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Ardından istemcileri yerelde `ws://127.0.0.1:18789` adresine bağlayın.

<Warning>
SSH tünelleri gateway auth'u atlatmaz. Paylaşılan gizli değer auth için istemciler
tünel üzerinden bile hâlâ `token`/`password` göndermelidir. Kimlik taşıyan modlarda,
isteğin yine de o auth yolunu sağlaması gerekir.
</Warning>

Bkz.: [Remote Gateway](/gateway/remote), [Authentication](/gateway/authentication), [Tailscale](/gateway/tailscale).

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

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) şeklindedir. `openclaw doctor`, hizmet yapılandırma kaymasını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd kullanıcısı)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Çıkış yaptıktan sonra da kalıcılık için lingering etkinleştirin:

```bash
sudo loginctl enable-linger <user>
```

Özel bir kurulum yoluna ihtiyacınız olduğunda el ile kullanıcı birimi örneği:

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
oluşturma reddedilirse, OpenClaw durum dizini içindeki `gateway.cmd` dosyasını işaret eden kullanıcı başına Startup-folder başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (sistem hizmeti)">

Çok kullanıcılı/her zaman açık ana makineler için sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Kullanıcı birimiyle aynı hizmet gövdesini kullanın, ancak bunu
`/etc/systemd/system/openclaw-gateway[-<profile>].service` altına kurun ve
`openclaw` ikiliniz başka bir yerdeyse `ExecStart=` değerini ayarlayın.

  </Tab>
</Tabs>

## Tek ana makinede birden fazla gateway

Çoğu kurulum **tek** bir Gateway çalıştırmalıdır.
Birden fazlasını yalnızca katı yalıtım/yedeklilik için kullanın (örneğin bir kurtarma profili).

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

Bkz.: [Multiple gateways](/gateway/multiple-gateways).

### Geliştirici profili için hızlı yol

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlara yalıtılmış durum/yapılandırma ve temel gateway bağlantı noktası `19001` dahildir.

## Protokol hızlı başvuru (operatör görünümü)

- İlk istemci çerçevesi `connect` olmalıdır.
- Gateway, `hello-ok` anlık görüntüsünü döndürür (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events`, çağrılabilir tüm yardımcı rotaların üretilmiş bir dökümü değil,
  ihtiyatlı bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Ajan çalıştırmaları iki aşamalıdır:

1. Anında kabul onayı (`status:"accepted"`)
2. Arada akışlı `agent` olaylarıyla birlikte son tamamlanma yanıtı (`status:"ok"|"error"`).

Tam protokol belgeleri için bkz.: [Gateway Protocol](/gateway/protocol).

## Operasyonel kontroller

### Liveness

- WS açın ve `connect` gönderin.
- Anlık görüntüyle birlikte `hello-ok` yanıtı bekleyin.

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
| `refusing to bind gateway ... without auth`                    | Geçerli bir gateway auth yolu olmadan loopback dışı bind                        |
| `another gateway instance is already listening` / `EADDRINUSE` | Bağlantı noktası çakışması                                                      |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak moda ayarlı veya hasarlı yapılandırmada yerel mod damgası eksik |
| `unauthorized` during connect                                  | İstemci ile gateway arasında auth uyuşmazlığı                                   |

Tam tanılama sıraları için [Gateway Troubleshooting](/gateway/troubleshooting) kullanın.

## Güvenlik garantileri

- Gateway kullanılamadığında Gateway protokol istemcileri hızlıca başarısız olur (örtük doğrudan kanal fallback'i yoktur).
- Geçersiz/`connect` olmayan ilk çerçeveler reddedilir ve kapatılır.
- Zarif kapatma, soket kapanmadan önce `shutdown` olayı yayar.

---

İlgili:

- [Troubleshooting](/gateway/troubleshooting)
- [Background Process](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentication](/gateway/authentication)
