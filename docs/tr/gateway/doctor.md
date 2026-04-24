---
read_when:
    - Doctor geçişlerini ekleme veya değiştirme
    - Kırıcı yapılandırma değişiklikleri getirme
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T09:09:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski yapılandırma/durumu düzeltir,
sağlığı kontrol eder ve uygulanabilir onarım adımları sunar.

## Hızlı başlangıç

```bash
openclaw doctor
```

### Başsız / otomasyon

```bash
openclaw doctor --yes
```

Sormadan varsayılanları kabul eder (uygunsa yeniden başlatma/servis/sandbox onarım adımları dahil).

```bash
openclaw doctor --repair
```

Önerilen onarımları sormadan uygular (güvenli olduğunda onarımlar + yeniden başlatmalar).

```bash
openclaw doctor --repair --force
```

Agresif onarımları da uygular (özel supervisor yapılandırmalarının üzerine yazar).

```bash
openclaw doctor --non-interactive
```

İstem olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalleştirme + disk üzerindeki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/servis/sandbox eylemlerini atlar.
Eski durum geçişleri algılandığında otomatik çalışır.

```bash
openclaw doctor --deep
```

Ek Gateway kurulumları için sistem servislerini tarar (launchd/systemd/schtasks).

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

- Git kurulumları için isteğe bağlı uçuş öncesi güncelleme (yalnızca etkileşimli).
- Arayüz protokol tazeliği denetimi (protokol şeması daha yeniyse Control UI'yi yeniden derler).
- Sağlık denetimi + yeniden başlatma istemi.
- Skills durum özeti (uygun/eksik/engelli) ve plugin durumu.
- Eski değerler için yapılandırma normalleştirmesi.
- Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk yapılandırma geçişi.
- Eski Chrome extension yapılandırmaları ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
- OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
- Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
- OpenAI Codex OAuth profilleri için OAuth TLS önkoşul denetimi.
- Eski disk üzeri durum geçişi (oturumlar/agent dizini/WhatsApp auth).
- Eski plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Eski Cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` Webhook fallback işleri).
- Oturum kilit dosyası incelemesi ve eski kilit temizliği.
- Durum bütünlüğü ve izin denetimleri (oturumlar, dökümler, durum dizini).
- Yerelde çalışırken yapılandırma dosyası izin denetimleri (`chmod 600`).
- Model auth sağlığı: OAuth süresinin dolmasını kontrol eder, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını bildirir.
- Ek çalışma alanı dizini tespiti (`~/openclaw`).
- Sandbox etkin olduğunda sandbox image onarımı.
- Eski servis geçişi ve ek Gateway tespiti.
- Matrix kanal eski durum geçişi (`--fix` / `--repair` modunda).
- Gateway çalışma zamanı denetimleri (servis kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
- Kanal durum uyarıları (çalışan Gateway'den probe edilir).
- Supervisor yapılandırma denetimi (launchd/systemd/schtasks) ve isteğe bağlı onarım.
- Gateway çalışma zamanı en iyi uygulama denetimleri (Node ile Bun, version-manager yolları).
- Gateway port çakışması tanılaması (varsayılan `18789`).
- Açık DM ilkeleri için güvenlik uyarıları.
- Yerel token modu için Gateway auth denetimleri (token kaynağı yoksa token üretmeyi önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
- Cihaz eşleştirme sorun tespiti (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel device-token önbellek kayması ve eşleştirilmiş kayıt auth kayması).
- Linux'ta systemd linger denetimi.
- Çalışma alanı bootstrap dosya boyutu denetimi (bağlam dosyaları için kesme/üst sınıra yakın uyarıları).
- Shell tamamlama durumu denetimi ve otomatik kurulum/yükseltme.
- Bellek araması embedding sağlayıcısı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD binary).
- Source kurulum denetimleri (pnpm çalışma alanı uyumsuzluğu, eksik UI varlıkları, eksik tsx binary).
- Güncellenmiş yapılandırma + wizard meta verilerini yazar.

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded**
eylemlerini içerir. Bu eylemler Gateway
doctor tarzı RPC yöntemlerini kullanır, ancak **`openclaw doctor` CLI**
onarımı/geçişinin parçası değildir.

Yaptıkları:

- **Backfill**, etkin
  çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM diary geçişini çalıştırır ve
  `DREAMS.md` dosyasına geri alınabilir backfill girdileri yazar.
- **Reset**, `DREAMS.md` içinden yalnızca işaretlenmiş backfill diary girdilerini kaldırır.
- **Clear Grounded**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı hatırlama veya günlük
  destek biriktirmemiş aşamalı grounded-only kısa süreli girdileri kaldırır.

Kendi başlarına yapmadıkları:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- açıkça önce aşamalı CLI yolunu çalıştırmadığınız sürece grounded adayları canlı kısa süreli
  terfi deposuna otomatik olarak aşamalandırmazlar

Grounded historical replay'in normal deep promotion
hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını gözden geçirme yüzeyi olarak korurken
grounded kalıcı adayları kısa süreli dreaming deposuna aşamalandırır.

## Ayrıntılı davranış ve gerekçe

### 0) İsteğe bağlı güncelleme (git kurulumları)

Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa,
doctor çalışmadan önce güncelleme (fetch/rebase/build) önerebilir.

### 1) Yapılandırma normalleştirme

Yapılandırma eski değer şekilleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`)
doctor bunları geçerli şemaya göre normalleştirir.

Buna eski Talk düz alanları da dahildir. Geçerli genel Talk yapılandırması
`talk.provider` + `talk.providers.<provider>` biçimindedir. Doctor eski
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` şekillerini sağlayıcı map'ine yeniden yazar.

### 2) Eski yapılandırma anahtarı geçişleri

Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde diğer komutlar çalışmayı reddeder
ve sizden `openclaw doctor` çalıştırmanızı ister.

Doctor şunları yapar:

- Hangi eski anahtarların bulunduğunu açıklar.
- Uyguladığı geçişi gösterir.
- Güncellenmiş şema ile `~/.openclaw/openclaw.json` dosyasını yeniden yazar.

Gateway de eski yapılandırma biçimi algıladığında başlangıçta
doctor geçişlerini otomatik çalıştırır; böylece eski yapılandırmalar elle müdahale olmadan onarılır.
Cron iş deposu geçişleri `openclaw doctor --fix` tarafından ele alınır.

Geçerli geçişler:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → üst düzey `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- eski `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Adlandırılmış `accounts` kullanan kanallarda tek hesaplı üst düzey kanal değerleri kalmışsa, o hesap kapsamlı değerleri o kanal için seçilen terfi ettirilmiş hesaba taşı (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` kaldırılır (eski extension relay ayarı)

Doctor uyarıları çok hesaplı kanallar için varsayılan hesap yönlendirmesini de içerir:

- İki veya daha fazla `channels.<channel>.accounts` girdisi yapılandırılmış ancak `channels.<channel>.defaultAccount` veya `accounts.default` yoksa, doctor fallback yönlendirmenin beklenmedik bir hesabı seçebileceği konusunda uyarır.
- `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

### 2b) OpenCode sağlayıcı geçersiz kılmaları

`models.providers.opencode`, `opencode-zen` veya `opencode-go`
alanlarını elle eklediyseniz, bu işlem `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar.
Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilmeniz için uyarır.

### 2c) Tarayıcı geçişi ve Chrome MCP hazırlığı

Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome extension yolunu gösteriyorsa doctor
bunu geçerli host-local Chrome MCP bağlanma modeline normalleştirir:

- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` kaldırılır

Doctor ayrıca `defaultProfile:
"user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda host-local Chrome MCP yolunu da denetler:

- varsayılan otomatik bağlanan profiller için Google Chrome'un aynı host üzerinde kurulu olup olmadığını kontrol eder
- algılanan Chrome sürümünü kontrol eder ve Chrome 144'ten düşükse uyarır
- tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  veya `edge://inspect/#remote-debugging`)

Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Host-local Chrome MCP
yine de şunları gerektirir:

- Gateway/Node host üzerinde Chromium tabanlı bir tarayıcı 144+
- tarayıcının yerel olarak çalışıyor olması
- o tarayıcıda uzaktan hata ayıklamanın etkin olması
- tarayıcıdaki ilk attach onay isteminin onaylanması

Buradaki hazırlık yalnızca yerel attach önkoşullarıyla ilgilidir. Existing-session, geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar yine de yönetilen bir tarayıcı veya ham CDP profili gerektirir.

Bu denetim Docker, sandbox, remote-browser veya diğer
başsız akışlar için geçerli değildir. Bunlar ham CDP kullanmaya devam eder.

### 2d) OAuth TLS önkoşulları

Bir OpenAI Codex OAuth profili yapılandırıldığında doctor, yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini kontrol etmek için OpenAI
yetkilendirme uç noktasını probe eder. Probe, sertifika hatasıyla başarısız olursa (örneğin
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya self-signed sertifika),
doctor platforma özgü düzeltme yönergeleri yazdırır. Homebrew Node kullanan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile probe,
Gateway sağlıklı olsa bile çalışır.

### 2c) Codex OAuth sağlayıcı geçersiz kılmaları

Daha önce eski OpenAI taşıma ayarlarını
`models.providers.openai-codex` altında eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth
sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte
bu eski taşıma ayarlarını gördüğünde uyarır; böylece eski taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/fallback davranışını
geri alabilirsiniz. Özel proxy'ler ve yalnızca header geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.

### 3) Eski durum geçişleri (disk düzeni)

Doctor, eski disk üzeri düzenleri geçerli yapıya taşıyabilir:

- Oturum deposu + dökümler:
  - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
- Agent dizini:
  - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
- WhatsApp auth durumu (Baileys):
  - eski `~/.openclaw/credentials/*.json` dosyalarından (`oauth.json` hariç)
  - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

Bu geçişler best-effort ve idempotent'tır; doctor, geride yedek olarak bıraktığı
eski klasörler için uyarılar verir. Gateway/CLI ayrıca başlangıçta
eski oturumlar + agent dizinini otomatik taşır; böylece geçmiş/auth/models
elle doctor çalıştırmadan agent başına yola yerleşir. WhatsApp auth bilerek yalnızca
`openclaw doctor` üzerinden taşınır. Talk provider/provider-map normalleştirmesi artık
yapısal eşitliğe göre karşılaştırır; böylece yalnızca anahtar sırası farkları artık
tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

### 3a) Eski plugin manifest geçişleri

Doctor, kurulu tüm plugin manifest'lerinde kullanımdan kaldırılmış üst düzey yetenek
anahtarlarını (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`) tarar. Bulunduğunda, bunları `contracts`
nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotent'tır;
`contracts` anahtarı zaten aynı değerlere sahipse eski anahtar
veriyi yinelemeden kaldırılır.

### 3b) Eski Cron depo geçişleri

Doctor ayrıca Cron iş deposunu da (`varsayılan olarak ~/.openclaw/cron/jobs.json`,
veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ
kabul ettiği eski iş biçimleri açısından kontrol eder.

Geçerli Cron temizlemeleri şunları içerir:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
- üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` teslim takma adları → açık `delivery.channel`
- basit eski `notify: true` Webhook fallback işleri → `delivery.mode="webhook"` ve `delivery.to=cron.webhook` ile açık teslim

Doctor, `notify: true` işlerini yalnızca
davranışı değiştirmeden yapabildiğinde otomatik taşır. Bir iş, eski notify fallback'i mevcut
Webhook olmayan teslim moduyla birleştiriyorsa, doctor uyarır ve bu işi elle inceleme için bırakır.

### 3c) Oturum kilidi temizleme

Doctor, her agent oturum dizinini eski yazma kilidi dosyaları açısından tarar — bir
oturum anormal biçimde çıktığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları raporlar:
yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski sayılıp sayılmadığı
(ölü PID veya 30 dakikadan eski). `--fix` / `--repair`
modunda eski kilit dosyalarını otomatik kaldırır; aksi halde bir not yazdırır ve
sizden `--fix` ile yeniden çalıştırmanızı ister.

### 4) Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)

Durum dizini operasyonel beyin sapıdır. Kaybolursa,
oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

Doctor şunları kontrol eder:

- **Durum dizini eksik**: felaket düzeyinde durum kaybı konusunda uyarır, dizini yeniden oluşturmayı önerir
  ve eksik verileri kurtaramayacağını hatırlatır.
- **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı önerir
  (ve sahip/grup uyumsuzluğu algılandığında `chown` ipucu verir).
- **macOS bulut eşzamanlı durum dizini**: durum iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya
  `~/Library/CloudStorage/...` altında çözülüyorsa uyarır; çünkü senkronizasyon destekli yollar daha yavaş I/O
  ve kilit/senkronizasyon yarışlarına neden olabilir.
- **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*`
  bağlama kaynağına çözülüyorsa uyarır; çünkü SD veya eMMC destekli rastgele I/O, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
- **Oturum dizinleri eksik**: geçmişi kalıcılaştırmak ve `ENOENT` çöküşlerinden kaçınmak için `sessions/` ve oturum deposu dizini
  gereklidir.
- **Döküm uyumsuzluğu**: son oturum girdilerinde eksik
  döküm dosyaları varsa uyarır.
- **Ana oturum “1 satırlık JSONL”**: ana döküm yalnızca bir satıra sahipse işaretler
  (geçmiş birikmiyor demektir).
- **Birden fazla durum dizini**: birden fazla `~/.openclaw` klasörü
  home dizinleri arasında varsa veya `OPENCLAW_STATE_DIR` başka bir yeri gösteriyorsa uyarır
  (geçmiş kurulumlar arasında bölünebilir).
- **Uzak mod hatırlatması**: `gateway.mode=remote` ise doctor size
  uzak host üzerinde çalıştırmanızı hatırlatır (durum orada yaşar).
- **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` dosyası
  grup/herkes tarafından okunabilir durumdaysa uyarır ve `600`'e sıkılaştırmayı önerir.

### 5) Model auth sağlığı (OAuth süresinin dolması)

Doctor, auth deposundaki OAuth profillerini inceler, token'lar
süresi dolmak üzereyse/dolmuşsa uyarır ve güvenliyse bunları yenileyebilir. Anthropic
OAuth/token profili eskiyse bir Anthropic API anahtarı veya
Anthropic setup-token yolunu önerir.
Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive`
yenileme denemelerini atlar.

Bir OAuth yenilemesi kalıcı olarak başarısız olursa (örneğin `refresh_token_reused`,
`invalid_grant` veya bir sağlayıcının sizden yeniden oturum açmanızı söylemesi), doctor yeniden auth gerektiğini bildirir ve çalıştırmanız gereken tam
`openclaw models auth login --provider ...`
komutunu yazdırır.

Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de bildirir:

- kısa cooldown'lar (hız sınırları/zaman aşımları/auth hataları)
- daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

### 6) Hooks model doğrulaması

`hooks.gmail.model` ayarlıysa doctor model referansını
katalog ve allowlist'e göre doğrular ve çözümlenmeyecekse veya izin verilmiyorsa uyarır.

### 7) Sandbox image onarımı

Sandbox etkin olduğunda doctor Docker image'lerini kontrol eder ve geçerli image eksikse
bunları derlemeyi veya eski adlara geçmeyi önerir.

### 7b) Paketli plugin çalışma zamanı bağımlılıkları

Doctor, çalışma zamanı bağımlılıklarını yalnızca
geçerli yapılandırmada etkin olan veya paketli manifest varsayılanı ile etkinleşen paketli plugin'ler için doğrular; örneğin
`plugins.entries.discord.enabled: true`, eski
`channels.discord.enabled: true` veya varsayılan etkin bir paketli sağlayıcı. Eksik varsa,
doctor paketleri bildirir ve bunları
`openclaw doctor --fix` / `openclaw doctor --repair` modunda kurar. Harici plugin'ler yine
`openclaw plugins install` / `openclaw plugins update` kullanır; doctor
rastgele plugin yolları için bağımlılık kurmaz.

### 8) Gateway servis geçişleri ve temizleme ipuçları

Doctor, eski Gateway servislerini (launchd/systemd/schtasks) algılar ve
bunları kaldırıp geçerli Gateway portunu kullanan OpenClaw servisini kurmayı
önerir. Ayrıca ek Gateway benzeri servisleri tarayabilir ve temizleme ipuçları yazdırabilir.
Profile adlı OpenClaw Gateway servisleri birinci sınıf kabul edilir ve "ekstra" olarak işaretlenmez.

### 8b) Başlangıç Matrix geçişi

Bir Matrix kanal hesabında bekleyen veya uygulanabilir bir eski durum geçişi varsa,
doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve sonra
best-effort geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski
şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve
başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim
tamamen atlanır.

### 8c) Cihaz eşleştirme ve auth kayması

Doctor artık normal sağlık geçişinin bir parçası olarak cihaz eşleştirme durumunu inceler.

Raporladıkları:

- bekleyen ilk eşleştirme istekleri
- zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
- zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
- cihaz kimliği hâlâ eşleştiği halde cihaz
  kimliğinin artık onaylı kayıtla eşleşmediği açık anahtar uyumsuzluğu onarımları
- onaylı rol için etkin token'ı olmayan eşleştirilmiş kayıtlar
- kapsamları onaylı eşleştirme temel çizgisinin dışına kayan eşleştirilmiş token'lar
- geçerli makine için, Gateway tarafı token rotasyonundan önce gelen veya eski kapsam meta verileri taşıyan yerel önbelleğe alınmış device-token girdileri

Doctor eşleştirme isteklerini otomatik onaylamaz veya device token'ları otomatik döndürmez. Bunun yerine
tam sonraki adımları yazdırır:

- bekleyen istekleri `openclaw devices list` ile inceleyin
- tam isteği `openclaw devices approve <requestId>` ile onaylayın
- yeni bir token'ı `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
- eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

Bu, yaygın olan "zaten eşleştirilmiş ama hâlâ eşleştirme gerekli"
boşluğunu kapatır: doctor artık ilk eşleştirmeyi bekleyen rol/kapsam
yükseltmelerinden ve eski token/cihaz kimliği kaymasından ayırır.

### 9) Güvenlik uyarıları

Doctor, bir sağlayıcı allowlist olmadan DM'lere açık olduğunda veya
bir ilke tehlikeli biçimde yapılandırıldığında uyarılar verir.

### 10) systemd linger (Linux)

Bir systemd kullanıcı servisi olarak çalışıyorsa doctor, çıkış yaptıktan sonra Gateway'in
canlı kalması için lingering'in etkin olduğundan emin olur.

### 11) Çalışma alanı durumu (Skills, plugin'ler ve eski dizinler)

Doctor, varsayılan agent için çalışma alanı durumunun bir özetini yazdırır:

- **Skills durumu**: uygun, eksik gereksinimli ve allowlist tarafından engellenmiş Skills sayıları.
- **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri
  geçerli çalışma alanıyla birlikte varsa uyarır.
- **Plugin durumu**: yüklenmiş/devre dışı/hatalı plugin sayıları; herhangi bir
  hata için plugin kimliklerini listeler; paketli plugin yeteneklerini bildirir.
- **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile
  uyumluluk sorunu olan plugin'leri işaretler.
- **Plugin tanılamaları**: plugin kayıt defteri tarafından yayılan yükleme zamanı uyarılarını veya hatalarını
  yüzeye çıkarır.

### 11b) Bootstrap dosya boyutu

Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`,
`CLAUDE.md` veya başka enjekte edilen bağlam dosyaları) yapılandırılmış
karakter bütçesine yakın mı ya da üzerinde mi olduğunu kontrol eder. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme
yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilen
karakterleri toplam bütçenin bir oranı olarak raporlar. Dosyalar kesildiğinde veya sınıra yakın olduğunda
doctor, `agents.defaults.bootstrapMaxChars`
ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.

### 11c) Shell tamamlama

Doctor, geçerli shell için sekme tamamlamanın kurulu olup olmadığını kontrol eder
(zsh, bash, fish veya PowerShell):

- Shell profili yavaş bir dinamik tamamlama deseni kullanıyorsa
  (`source <(openclaw completion ...)`), doctor bunu daha hızlı
  önbelleğe alınmış dosya varyantına yükseltir.
- Tamamlama profilde yapılandırılmış ama önbellek dosyası eksikse,
  doctor önbelleği otomatik olarak yeniden üretir.
- Hiç tamamlama yapılandırılmamışsa doctor bunu kurmayı önerir
  (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

Önbelleği elle yeniden üretmek için `openclaw completion --write-state` çalıştırın.

### 12) Gateway auth denetimleri (yerel token)

Doctor, yerel Gateway token auth hazırlığını kontrol eder.

- Token modu bir token gerektiriyor ve token kaynağı yoksa doctor bir tane üretmeyi önerir.
- `gateway.auth.token` SecretRef ile yönetiliyor ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
- `openclaw doctor --generate-gateway-token`, yalnızca token SecretRef yapılandırılmamışsa üretimi zorlar.

### 12b) Salt okunur SecretRef farkındalıklı onarımlar

Bazı onarım akışları, çalışma zamanındaki fail-fast davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemeyi gerektirir.

- `openclaw doctor --fix`, hedefli yapılandırma onarımları için artık status ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
- Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mümkün olduğunda yapılandırılmış bot kimlik bilgilerini kullanmaya çalışır.
- Telegram bot token'ı SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, doctor token'ı eksik diye yanlış bildirmek veya çökme yerine kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu raporlar ve otomatik çözümlemeyi atlar.

### 13) Gateway sağlık denetimi + yeniden başlatma

Doctor bir sağlık denetimi çalıştırır ve sağlıksız görünüyorsa
Gateway'i yeniden başlatmayı önerir.

### 13b) Bellek araması hazırlığı

Doctor, yapılandırılmış bellek araması embedding sağlayıcısının varsayılan
agent için hazır olup olmadığını kontrol eder. Davranış, yapılandırılmış backend'e ve sağlayıcıya bağlıdır:

- **QMD backend'i**: `qmd` binary'sinin kullanılabilir ve başlatılabilir olup olmadığını probe eder.
  Değilse npm paketini ve elle binary yolu seçeneğini içeren düzeltme yönergeleri yazdırır.
- **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan
  uzak/indirilebilir model URL'si olup olmadığını kontrol eder. Eksikse uzak sağlayıcıya geçmeyi önerir.
- **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya auth deposunda
  API anahtarının mevcut olduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
- **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini kontrol eder, ardından
  her uzak sağlayıcıyı otomatik seçim sırasına göre dener.

Bir Gateway probe sonucu mevcut olduğunda (denetim sırasında Gateway sağlıklıysa),
doctor bunu CLI tarafından görülebilen yapılandırmayla çapraz karşılaştırır ve
herhangi bir tutarsızlığı not eder.

Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

### 14) Kanal durum uyarıları

Gateway sağlıklıysa doctor bir kanal durum probe'u çalıştırır ve
önerilen düzeltmelerle birlikte uyarıları bildirir.

### 15) Supervisor yapılandırma denetimi + onarım

Doctor, kurulu supervisor yapılandırmasında (launchd/systemd/schtasks)
eksik veya eski varsayılanları kontrol eder (ör. systemd network-online bağımlılıkları ve
yeniden başlatma gecikmesi). Uyumsuzluk bulduğunda güncelleme önerir ve
servis dosyasını/görevi geçerli varsayılanlara göre yeniden yazabilir.

Notlar:

- `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
- `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
- `openclaw doctor --repair`, önerilen düzeltmeleri sormadan uygular.
- `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
- Token auth bir token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa, doctor servis kurma/onarım işlemi SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor servis ortam meta verilerine kalıcı yazmaz.
- Token auth bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, doctor kurma/onarım yolunu uygulanabilir yönergelerle engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmış ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurma/onarımı engeller.
- Linux user-systemd birimleri için doctor token drift denetimleri, servis auth meta verilerini karşılaştırırken artık hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
- Tam yeniden yazmayı her zaman `openclaw gateway install --force` ile zorlayabilirsiniz.

### 16) Gateway çalışma zamanı + port tanılamaları

Doctor servis çalışma zamanını (PID, son çıkış durumu) inceler ve
servis kurulu olup gerçekte çalışmıyorsa uyarır. Ayrıca Gateway portunda
(varsayılan `18789`) port çakışmalarını kontrol eder ve olası nedenleri bildirir
(Gateway zaten çalışıyor, SSH tüneli).

### 17) Gateway çalışma zamanı en iyi uygulamaları

Doctor, Gateway servisinin Bun üzerinde veya sürüm yöneticisiyle yönetilen bir Node yolunda
(`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir
ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir; çünkü servis shell init'inizi
yüklemez. Doctor, mümkün olduğunda sistem Node kurulumuna geçmeyi önerir
(Homebrew/apt/choco).

### 18) Yapılandırma yazımı + wizard meta verileri

Doctor, tüm yapılandırma değişikliklerini kalıcı hale getirir ve
doctor çalıştırmasını kaydetmek için wizard meta verilerini damgalar.

### 19) Çalışma alanı ipuçları (yedek + bellek sistemi)

Doctor, eksikse bir çalışma alanı bellek sistemi önerir ve çalışma alanı
zaten git altında değilse bir yedekleme ipucu yazdırır.

Çalışma alanı yapısı ve git yedekleme için tam kılavuz
(önerilen özel GitHub veya GitLab) şu adrestedir: [/concepts/agent-workspace](/tr/concepts/agent-workspace).

## İlgili

- [Gateway troubleshooting](/tr/gateway/troubleshooting)
- [Gateway runbook](/tr/gateway)
