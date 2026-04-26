---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
summary: Gateway servisi, yaşam döngüsü ve operasyonlar için runbook
title: Gateway runbook'u
x-i18n:
    generated_at: "2026-04-26T11:29:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

Bu sayfayı Gateway servisinin 1. gün başlangıcı ve 2. gün operasyonları için kullanın.

<CardGroup cols={2}>
  <Card title="Derin sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Belirti odaklı tanılama; tam komut sıraları ve log imzalarıyla.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgi yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı snapshot davranışı ve taşıma/yeniden yükleme işlemleri.
  </Card>
  <Card title="Gizli bilgi plan sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Tam `secrets apply` hedef/yol kuralları ve yalnızca ref kullanan auth-profile davranışı.
  </Card>
</CardGroup>

## 5 dakikalık yerel başlangıç

<Steps>
  <Step title="Gateway'i başlatın">

```bash
openclaw gateway --port 18789
# debug/trace stdio'ya yansıtılır
openclaw gateway --port 18789 --verbose
# seçilen porttaki dinleyiciyi zorla öldür, sonra başlat
openclaw gateway --force
```

  </Step>

  <Step title="Servis sağlığını doğrulayın">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: `Runtime: running`, `Connectivity probe: ok` ve beklediğinizle eşleşen `Capability: ...`. Yalnızca erişilebilirlik değil, okuma kapsamlı RPC kanıtı gerektiğinde `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazır olma durumunu doğrulayın">

```bash
openclaw channels status --probe
```

Erişilebilir bir gateway ile bu komut canlı hesap başına kanal yoklamalarını ve isteğe bağlı denetimleri çalıştırır.
Gateway'e ulaşılamıyorsa CLI, canlı yoklama çıktısı yerine yalnızca yapılandırma tabanlı kanal özetlerine geri düşer.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yüklemesi etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından çözülür veya ayarlıysa `OPENCLAW_CONFIG_PATH` kullanılır).
Varsayılan mod `gateway.reload.mode="hybrid"` değeridir.
İlk başarılı yüklemeden sonra çalışan süreç etkin bellek içi yapılandırma snapshot'ını sunar; başarılı bir yeniden yükleme bu snapshot'ı atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, kontrol düzlemi ve kanal bağlantıları için tek bir her zaman açık süreç.
- Şunlar için tek çoklamalı port:
  - WebSocket kontrol/RPC
  - HTTP API'leri, OpenAI uyumlu (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI ve kancalar
- Varsayılan bağlama modu: `loopback`.
- Varsayılan olarak auth gerekir. Paylaşımlı secret kurulumları
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır ve loopback dışı
  reverse-proxy kurulumları `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw’un en yüksek etkili uyumluluk yüzeyi artık şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu kümenin neden önemli olduğu:

- Çoğu Open WebUI, LobeChat ve LibreChat entegrasyonu önce `/v1/models` yoklar.
- Birçok RAG ve bellek hattı `/v1/embeddings` bekler.
- Ajan-yerel istemciler giderek daha fazla `/v1/responses` tercih ediyor.

Planlama notu:

- `/v1/models`, agent-first'tür: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, her zaman yapılandırılmış varsayılan ajana eşlenen kararlı takma addır.
- Bir arka uç sağlayıcı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi halde seçilen ajanın normal model ve embedding kurulumu kontrolü elinde tutar.

Bunların tümü ana Gateway portunda çalışır ve Gateway HTTP API'sinin geri kalanıyla aynı güvenilir operatör auth sınırını kullanır.

### Port ve bağlama önceliği

| Ayar         | Çözümleme sırası                                               |
| ------------ | -------------------------------------------------------------- |
| Gateway portu | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bağlama modu | CLI/override → `gateway.bind` → `loopback`                     |

Gateway başlangıcı, loopback dışı bağlamalar için yerel
Control UI origin'lerini tohumlarken aynı etkin portu ve bağı kullanır. Örneğin, `--bind lan --port 3000`
çalışma zamanı doğrulaması başlamadan önce `http://localhost:3000` ve `http://127.0.0.1:3000`
değerlerini tohumlar. HTTPS proxy URL'leri gibi uzak tarayıcı origin'lerini
açıkça `gateway.controlUi.allowedOrigins` içine ekleyin.

### Hot reload modları

| `gateway.reload.mode` | Davranış                                 |
| --------------------- | ---------------------------------------- |
| `off`                 | Yapılandırma yeniden yüklemesi yok       |
| `hot`                 | Yalnızca hot-safe değişiklikleri uygula  |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlat |
| `hybrid` (varsayılan) | Güvenliyse hot uygula, gerekiyorsa yeniden başlat |

## Operatör komut kümesi

```bash
openclaw gateway status
openclaw gateway status --deep   # sistem düzeyinde servis taraması ekler
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep`, daha derin bir RPC sağlık yoklaması için değil, ek servis keşfi içindir (LaunchDaemons/systemd sistem
birimleri/schtasks).

## Birden fazla gateway (aynı ana makine)

Çoğu kurulum, makine başına bir gateway çalıştırmalıdır. Tek bir gateway birden fazla
ajanı ve kanalı barındırabilir.

Yalnızca bilerek yalıtım veya bir kurtarma botu istiyorsanız birden fazla gateway gerekir.

Yararlı denetimler:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklenecek durum:

- `gateway status --deep`, `Other gateway-like services detected (best effort)`
  bildirebilir ve bayat launchd/systemd/schtasks kurulumları hâlâ etraftaysa temizleme ipuçları yazdırabilir.
- `gateway probe`, birden fazla hedef
  yanıt verdiğinde `multiple reachable gateways` uyarısı verebilir.
- Bu kasıtlıysa gateway başına portları, yapılandırma/durumu ve çalışma alanı köklerini yalıtın.

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

## VoiceClaw gerçek zamanlı beyin uç noktası

OpenClaw, `/voiceclaw/realtime` adresinde VoiceClaw uyumlu bir gerçek zamanlı WebSocket uç noktası sunar.
Bir VoiceClaw masaüstü istemcisinin ayrı bir relay
süreci üzerinden gitmek yerine doğrudan gerçek zamanlı bir OpenClaw beyniyle konuşması gerektiğinde bunu kullanın.

Uç nokta, gerçek zamanlı ses için Gemini Live kullanır ve
OpenClaw araçlarını doğrudan Gemini Live'a açığa çıkararak OpenClaw'u beyin olarak çağırır. Araç çağrıları ses turunun yanıt verebilir kalmasını sağlamak için hemen bir
`working` sonucu döndürür; ardından OpenClaw gerçek aracı eşzamansız çalıştırır ve sonucu
yeniden canlı oturuma enjekte eder. Gateway süreç ortamında `GEMINI_API_KEY`
ayarlayın. Gateway auth etkinken masaüstü istemcisi gateway token'ını veya password'ünü
ilk `session.config` mesajında gönderir.

Gerçek zamanlı beyin erişimi, sahip tarafından yetkilendirilmiş OpenClaw ajan komutlarını çalıştırır. `gateway.auth.mode: "none"` değerini
yalnızca loopback test örnekleriyle sınırlı tutun. Yerel olmayan
gerçek zamanlı beyin bağlantıları gateway auth gerektirir.

Yalıtılmış bir test gateway'i için kendi portu, yapılandırması
ve durumu olan ayrı bir örnek çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Ardından VoiceClaw'u şunu kullanacak şekilde yapılandırın:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Uzak erişim

Tercih edilen: Tailscale/VPN.
Fallback: SSH tüneli.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Ardından istemcileri yerel olarak `ws://127.0.0.1:18789` adresine bağlayın.

<Warning>
SSH tünelleri gateway auth'u atlamaz. Paylaşımlı secret auth için istemciler
tünel üzerinden bile yine `token`/`password` göndermelidir. Kimlik taşıyan modlar için
isteğin yine de o auth yolunu karşılaması gerekir.
</Warning>

Bkz.: [Remote Gateway](/tr/gateway/remote), [Authentication](/tr/gateway/authentication), [Tailscale](/tr/gateway/tailscale).

## Denetim ve servis yaşam döngüsü

Üretim benzeri güvenilirlik için denetimli çalıştırmalar kullanın.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Yeniden başlatmalar için `openclaw gateway restart` kullanın. `openclaw gateway stop` ve `openclaw gateway start` komutlarını zincirlemeyin; macOS'ta `gateway stop`, durdurmadan önce LaunchAgent'i bilerek devre dışı bırakır.

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) olur. `openclaw doctor`, servis yapılandırması sapmasını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Oturum kapatıldıktan sonra da sürmesi için lingering etkinleştirin:

```bash
sudo loginctl enable-linger <user>
```

Özel bir kurulum yolu gerektiğinde elle user-unit örneği:

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

Yerel Windows yönetilen başlangıç, `OpenClaw Gateway`
(adlandırılmış profiller için `OpenClaw Gateway (<profile>)`) adlı bir Scheduled Task kullanır. Scheduled Task
oluşturulması reddedilirse OpenClaw, durum dizini içindeki `gateway.cmd` dosyasını işaret eden kullanıcı başına Startup-folder başlatıcısına geri düşer.

  </Tab>

  <Tab title="Linux (sistem servisi)">

Çok kullanıcılı/her zaman açık ana makineler için bir sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

User unit ile aynı servis gövdesini kullanın, ancak bunu
`/etc/systemd/system/openclaw-gateway[-<profile>].service` altına kurun ve
`openclaw` binary'niz başka bir yerdeyse `ExecStart=` değerini ayarlayın.

  </Tab>
</Tabs>

## Geliştirici profili hızlı yolu

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlar; yalıtılmış durum/yapılandırma ve temel gateway portu `19001` içerir.

## Protokol hızlı başvurusu (operatör görünümü)

- İlk istemci çerçevesi `connect` olmalıdır.
- Gateway, `hello-ok` snapshot'ını (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy) döndürür.
- `hello-ok.features.methods` / `events`, çağrılabilir her yardımcı route'un üretilmiş dökümü değil,
  muhafazakâr bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Ajan çalıştırmaları iki aşamalıdır:

1. Anında kabul onayı (`status:"accepted"`)
2. Arada akış halinde `agent` olaylarıyla birlikte nihai tamamlama yanıtı (`status:"ok"|"error"`).

Tam protokol belgeleri: [Gateway Protocol](/tr/gateway/protocol).

## Operasyonel denetimler

### Canlılık

- WS açın ve `connect` gönderin.
- Snapshot ile birlikte `hello-ok` yanıtı bekleyin.

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
| `refusing to bind gateway ... without auth`                    | Geçerli bir gateway auth yolu olmadan loopback dışı bağlama                    |
| `another gateway instance is already listening` / `EADDRINUSE` | Port çakışması                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak moda ayarlı veya hasarlı bir yapılandırmada local-mode damgası eksik |
| bağlantı sırasında `unauthorized`                              | İstemci ile gateway arasında auth uyumsuzluğu                                  |

Tam tanılama sıraları için [Gateway Troubleshooting](/tr/gateway/troubleshooting) kullanın.

## Güvenlik garantileri

- Gateway kullanılamadığında Gateway protokol istemcileri hızlıca hata verir (örtük direct-channel fallback yoktur).
- Geçersiz/`connect` olmayan ilk çerçeveler reddedilir ve bağlantı kapatılır.
- Zarif kapatma, soket kapanmadan önce `shutdown` olayı yayar.

---

İlgili:

- [Troubleshooting](/tr/gateway/troubleshooting)
- [Background Process](/tr/gateway/background-process)
- [Configuration](/tr/gateway/configuration)
- [Health](/tr/gateway/health)
- [Doctor](/tr/gateway/doctor)
- [Authentication](/tr/gateway/authentication)

## İlgili

- [Configuration](/tr/gateway/configuration)
- [Gateway troubleshooting](/tr/gateway/troubleshooting)
- [Remote access](/tr/gateway/remote)
- [Secrets management](/tr/gateway/secrets)
