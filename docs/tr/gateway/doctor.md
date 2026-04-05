---
read_when:
    - Doctor geçişlerini ekliyor veya değiştiriyorsunuz
    - Geriye dönük uyumsuz config değişiklikleri getiriyorsunuz
summary: 'Doctor komutu: sağlık kontrolleri, config geçişleri ve onarım adımları'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T13:54:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski config/durumu düzeltir,
sağlığı kontrol eder ve uygulanabilir onarım adımları sunar.

## Hızlı başlangıç

```bash
openclaw doctor
```

### Headless / otomasyon

```bash
openclaw doctor --yes
```

İstem göstermeden varsayılanları kabul eder (uygunsa yeniden başlatma/hizmet/sandbox onarım adımları dahil).

```bash
openclaw doctor --repair
```

Önerilen onarımları istem göstermeden uygular (güvenli olduğunda onarımlar + yeniden başlatmalar).

```bash
openclaw doctor --repair --force
```

Agresif onarımları da uygular (özel supervisor config'lerini üzerine yazar).

```bash
openclaw doctor --non-interactive
```

İstem göstermeden çalışır ve yalnızca güvenli geçişleri uygular (config normalleştirme + disk üzerindeki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar.
Legacy durum geçişleri algılandığında otomatik olarak çalıştırılır.

```bash
openclaw doctor --deep
```

Ek gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız önce config dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar? (özet)

- Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
- UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI'ı yeniden oluşturur).
- Sağlık kontrolü + yeniden başlatma istemi.
- Skills durum özeti (uygun/eksik/engelli) ve eklenti durumu.
- Legacy değerler için config normalleştirmesi.
- Legacy düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk config geçişi.
- Legacy Chrome uzantısı config'leri ve Chrome MCP hazır oluşu için tarayıcı geçiş denetimleri.
- OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
- OpenAI Codex OAuth profilleri için OAuth TLS ön koşul denetimi.
- Legacy disk üzeri durum geçişi (oturumlar/agent dizini/WhatsApp auth).
- Legacy eklenti manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Legacy cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` webhook fallback işleri).
- Oturum kilit dosyası incelemesi ve eski kilit temizliği.
- Durum bütünlüğü ve izin denetimleri (oturumlar, dökümler, durum dizini).
- Yerel çalıştırıldığında config dosyası izin denetimleri (`chmod 600`).
- Model auth sağlığı: OAuth süresinin dolmasını kontrol eder, süresi dolmak üzere olan token'ları yenileyebilir ve auth profili cooldown/devre dışı durumlarını bildirir.
- Ek çalışma alanı dizini algılama (`~/openclaw`).
- Sandboxing etkin olduğunda sandbox imaj onarımı.
- Legacy hizmet geçişi ve ek gateway algılama.
- Matrix kanalı legacy durum geçişi (`--fix` / `--repair` modunda).
- Gateway çalışma zamanı denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
- Kanal durum uyarıları (çalışan gateway'den prob alınır).
- İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
- Gateway çalışma zamanı en iyi uygulama denetimleri (Node vs Bun, sürüm yöneticisi yolları).
- Gateway port çakışması tanılamaları (varsayılan `18789`).
- Açık DM ilkeleri için güvenlik uyarıları.
- Yerel token modu için gateway auth denetimleri (token kaynağı yoksa token oluşturma sunar; token SecretRef config'lerini üzerine yazmaz).
- Linux'ta systemd linger denetimi.
- Çalışma alanı önyükleme dosyası boyut denetimi (bağlam dosyaları için kesme/üst sınıra yakın uyarıları).
- Shell completion durum denetimi ve otomatik kurulum/yükseltme.
- Memory search embedding sağlayıcısı hazır oluş denetimi (yerel model, uzak API anahtarı veya QMD ikilisi).
- Kaynak kurulum denetimleri (pnpm çalışma alanı uyuşmazlığı, eksik UI varlıkları, eksik tsx ikilisi).
- Güncellenmiş config + wizard meta verilerini yazar.

## Ayrıntılı davranış ve gerekçe

### 0) İsteğe bağlı güncelleme (git kurulumları)

Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa,
doctor çalıştırmadan önce güncelleme (fetch/rebase/build) sunar.

### 1) Config normalleştirmesi

Config, legacy değer biçimleri içeriyorsa (örneğin kanala özgü bir geçersiz kılma olmadan `messages.ackReaction`),
doctor bunları geçerli şemaya normalleştirir.

Buna legacy Talk düz alanları da dahildir. Geçerli herkese açık Talk config'i
`talk.provider` + `talk.providers.<provider>` biçimindedir. Doctor eski
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` biçimlerini sağlayıcı haritasına yeniden yazar.

### 2) Legacy config anahtar geçişleri

Config kullanımdan kaldırılmış anahtarlar içeriyorsa, diğer komutlar çalışmayı reddeder
ve sizden `openclaw doctor` çalıştırmanızı ister.

Doctor şunları yapar:

- Hangi legacy anahtarların bulunduğunu açıklar.
- Uyguladığı geçişi gösterir.
- `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

Gateway de legacy config biçimi algıladığında başlangıçta doctor geçişlerini otomatik çalıştırır,
böylece eski config'ler elle müdahale olmadan onarılır.
Cron iş deposu geçişleri `openclaw doctor --fix` tarafından ele alınır.

Geçerli geçişler:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → üst düzey `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Adlandırılmış `accounts` bulunan ama tek hesaplı üst düzey kanal değerleri kalan kanallarda, hesaba kapsamlı bu değerleri o kanal için seçilen terfi ettirilmiş hesaba taşı (`accounts.default` çoğu kanal için; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` kaldırılır (legacy uzantı relay ayarı)

Doctor uyarıları ayrıca çok hesaplı kanallar için varsayılan hesap yönlendirmesini de içerir:

- İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor fallback yönlendirmesinin beklenmeyen bir hesap seçebileceği konusunda uyarır.
- `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlıysa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

### 2b) OpenCode sağlayıcı geçersiz kılmaları

`models.providers.opencode`, `opencode-zen` veya `opencode-go`
değerlerini elle eklediyseniz, bu durum `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar.
Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor,
geçersiz kılmayı kaldırıp model başına API yönlendirmesi + maliyetleri geri yükleyebilmeniz için uyarı verir.

### 2c) Tarayıcı geçişi ve Chrome MCP hazır oluşu

Tarayıcı config'iniz hâlâ kaldırılmış Chrome uzantısı yolunu işaret ediyorsa, doctor
bunu geçerli host-yerel Chrome MCP bağlanma modeline normalleştirir:

- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` kaldırılır

Doctor ayrıca `defaultProfile:
"user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda host-yerel Chrome MCP yolunu da denetler:

- varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı host üzerinde kurulu olup olmadığını denetler
- algılanan Chrome sürümünü denetler ve Chrome 144'ün altındaysa uyarır
- tarayıcı inceleme sayfasında uzak hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  veya `edge://inspect/#remote-debugging`)

Doctor sizin yerinize Chrome tarafındaki ayarı etkinleştiremez. Host-yerel Chrome MCP
yine de şunları gerektirir:

- gateway/node host üzerinde Chromium tabanlı bir tarayıcı 144+
- tarayıcının yerel olarak çalışıyor olması
- o tarayıcıda uzak hata ayıklamanın etkin olması
- tarayıcıdaki ilk bağlanma izin isteminin onaylanması

Buradaki hazır oluş yalnızca yerel bağlanma ön koşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir
tarayıcı veya ham CDP profili gerektirir.

Bu denetim Docker, sandbox, remote-browser veya diğer
headless akışlar için geçerli değildir. Bunlar ham CDP kullanmaya devam eder.

### 2d) OAuth TLS ön koşulları

Bir OpenAI Codex OAuth profili yapılandırıldığında doctor, yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI
yetkilendirme uç noktasını probar. Prob bir sertifika hatasıyla başarısız olursa (örneğin
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika),
doctor platforma özgü düzeltme kılavuzu yazdırır. Homebrew Node kullanan macOS'ta bu
düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile,
gateway sağlıklı olsa bile prob çalışır.

### 3) Legacy durum geçişleri (disk düzeni)

Doctor eski disk düzenlerini geçerli yapıya taşıyabilir:

- Oturum deposu + dökümler:
  - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
- Agent dizini:
  - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
- WhatsApp auth durumu (Baileys):
  - legacy `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
  - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

Bu geçişler en iyi çaba esaslıdır ve tekrarlanabilir; doctor
yedek olarak herhangi bir legacy klasör bırakıldığında uyarılar verir. Gateway/CLI ayrıca
başlangıçta legacy oturumlar + agent dizinini otomatik taşır; böylece geçmiş/auth/models elle doctor çalıştırmadan
agent başına yola yerleşir. WhatsApp auth bilerek yalnızca `openclaw doctor` ile taşınır. Talk provider/provider-map normalleştirmesi artık yapısal eşitliğe göre karşılaştırılır; böylece yalnızca anahtar sırasından kaynaklı farklar artık
tekrarlayan anlamsız `doctor --fix` değişikliklerini tetiklemez.

### 3a) Legacy eklenti manifest geçişleri

Doctor kurulu tüm eklenti manifestlerini kullanımdan kaldırılmış üst düzey yetenek
anahtarları için tarar (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Bulunduğunda bunları `contracts`
nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş tekrarlanabilirdir;
`contracts` anahtarı zaten aynı değerlere sahipse legacy anahtar, veriyi
çoğaltmadan kaldırılır.

### 3b) Legacy cron deposu geçişleri

Doctor ayrıca cron iş deposunu da kontrol eder (varsayılan olarak `~/.openclaw/cron/jobs.json`,
veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği
eski iş biçimleri için.

Geçerli cron temizlemeleri şunları içerir:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
- üst düzey delivery alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` delivery takma adları → açık `delivery.channel`
- basit legacy `notify: true` webhook fallback işleri → açık `delivery.mode="webhook"` ve `delivery.to=cron.webhook`

Doctor `notify: true` işlerini yalnızca
davranışı değiştirmeden yapabildiğinde otomatik taşır. Bir iş legacy notify fallback'i var olan
webhook olmayan bir delivery moduyla birleştiriyorsa doctor uyarır ve o işi elle inceleme için bırakır.

### 3c) Oturum kilidi temizliği

Doctor her agent oturum dizinini eski yazma kilit dosyaları için tarar —
bir oturum anormal sonlandığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları bildirir:
yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve
eski kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair`
modunda eski kilit dosyalarını otomatik kaldırır; aksi halde not yazdırır ve
sizden `--fix` ile yeniden çalıştırmanızı ister.

### 4) Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)

Durum dizini operasyonel beyin sapıdır. Kaybolursa
oturumları, kimlik bilgilerini, günlükleri ve config'i kaybedersiniz (başka yerde yedekleriniz yoksa).

Doctor şunları kontrol eder:

- **Durum dizini eksik**: yıkıcı durum kaybı konusunda uyarır, dizini yeniden oluşturmayı ister
  ve eksik verileri kurtaramayacağını hatırlatır.
- **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı sunar
  (ve sahip/grup uyuşmazlığı algılandığında `chown` ipucu verir).
- **macOS bulut eşzamanlı durum dizini**: durum iCloud Drive altında çözümlendiğinde uyarır
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya
  `~/Library/CloudStorage/...`; çünkü senkronizasyon destekli yollar daha yavaş I/O
  ve kilit/eşzamanlama yarışlarına neden olabilir.
- **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*`
  bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele I/O
  oturum ve kimlik bilgisi yazımlarında daha yavaş olabilir ve daha hızlı yıpranabilir.
- **Oturum dizinleri eksik**: `sessions/` ve oturum deposu dizini
  geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için gereklidir.
- **Döküm uyuşmazlığı**: yakın tarihli oturum girdilerinde eksik
  döküm dosyaları olduğunda uyarır.
- **Ana oturum “1 satırlık JSONL”**: ana döküm yalnızca bir satır olduğunda işaretler
  (geçmiş birikmiyor demektir).
- **Birden çok durum dizini**: birden fazla `~/.openclaw` klasörü
  home dizinleri boyunca bulunduğunda veya `OPENCLAW_STATE_DIR` başka yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
- **Uzak mod hatırlatması**: `gateway.mode=remote` ise doctor bunun
  uzak host üzerinde çalıştırılması gerektiğini hatırlatır (durum orada yaşar).
- **Config dosyası izinleri**: `~/.openclaw/openclaw.json` dosyası
  grup/dünya tarafından okunabiliyorsa uyarır ve `600` olarak sıkılaştırmayı önerir.

### 5) Model auth sağlığı (OAuth süresi dolması)

Doctor auth deposundaki OAuth profillerini inceler, token'ların
süresi dolmak üzereyse/dolmuşsa uyarır ve güvenliyse yenileyebilir. Anthropic
OAuth/token profili eskiyse Claude CLI'ye veya bir
Anthropic API anahtarına geçmeyi önerir.
Yenileme istemleri yalnızca etkileşimli (TTY) çalıştırmada görünür; `--non-interactive`
yenileme denemelerini atlar.

Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de bildirir:

- kısa cooldown'lar (oran sınırları/zaman aşımları/auth başarısızlıkları)
- daha uzun devre dışı bırakmalar (faturalama/kredi başarısızlıkları)

### 6) Hooks model doğrulaması

`hooks.gmail.model` ayarlıysa doctor model başvurusunu
katalog ve allowlist'e göre doğrular ve çözülmeyecekse veya izin verilmiyorsa uyarır.

### 7) Sandbox imaj onarımı

Sandboxing etkin olduğunda doctor Docker imajlarını kontrol eder ve
geçerli imaj eksikse oluşturmayı veya legacy adlara geçmeyi önerir.

### 7b) Paketlenmiş eklenti çalışma zamanı bağımlılıkları

Doctor paketlenmiş eklenti çalışma zamanı bağımlılıklarının (örneğin
Discord eklentisi çalışma zamanı paketleri) OpenClaw kurulum kökünde
bulunduğunu doğrular.
Herhangi biri eksikse doctor paketleri bildirir ve bunları
`openclaw doctor --fix` / `openclaw doctor --repair` modunda kurar.

### 8) Gateway hizmet geçişleri ve temizlik ipuçları

Doctor legacy gateway hizmetlerini (launchd/systemd/schtasks) algılar ve
bunları kaldırıp geçerli gateway portunu kullanarak OpenClaw hizmetini kurmayı
önerir. Ayrıca ek gateway benzeri hizmetleri tarayabilir ve temizlik ipuçları yazdırabilir.
Profil adlandırılmış OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

### 8b) Başlangıç Matrix geçişi

Bir Matrix kanal hesabında bekleyen veya uygulanabilir bir legacy durum geçişi varsa,
doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve sonra
en iyi çaba geçiş adımlarını çalıştırır: legacy Matrix durum geçişi ve legacy
şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve
başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim
tamamen atlanır.

### 9) Güvenlik uyarıları

Doctor, bir sağlayıcı izin listesi olmadan DM'lere açıksa
veya bir ilke tehlikeli biçimde yapılandırılmışsa uyarılar üretir.

### 10) systemd linger (Linux)

Bir systemd kullanıcı hizmeti olarak çalışıyorsa doctor,
çıkış yaptıktan sonra gateway'in canlı kalması için lingering'in etkin olduğundan emin olur.

### 11) Çalışma alanı durumu (skills, eklentiler ve legacy dizinler)

Doctor varsayılan agent için çalışma alanı durumunun bir özetini yazdırır:

- **Skills durumu**: uygun, gereksinimi eksik ve allowlist tarafından engellenmiş skill sayılarını verir.
- **Legacy çalışma alanı dizinleri**: `~/openclaw` veya diğer legacy çalışma alanı dizinleri
  geçerli çalışma alanının yanında varsa uyarır.
- **Eklenti durumu**: yüklenen/devre dışı/hata veren eklenti sayılarını verir; herhangi bir
  hata için eklenti kimliklerini listeler; paket eklenti yeteneklerini bildirir.
- **Eklenti uyumluluk uyarıları**: geçerli çalışma zamanıyla
  uyumluluk sorunları olan eklentileri işaretler.
- **Eklenti tanıları**: eklenti kayıt defteri tarafından
  yükleme zamanında üretilen uyarıları veya hataları yüzeye çıkarır.

### 11b) Önyükleme dosyası boyutu

Doctor çalışma alanı önyükleme dosyalarının (`AGENTS.md`,
`CLAUDE.md` veya enjekte edilen diğer bağlam dosyaları gibi) yapılandırılmış
karakter bütçesine yakın veya üzerinde olup olmadığını kontrol eder. Dosya başına ham ve enjekte edilen karakter sayılarını, kesme
yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilen
karakterleri toplam bütçenin bir oranı olarak bildirir. Dosyalar kesildiğinde veya sınıra yakın olduğunda,
doctor `agents.defaults.bootstrapMaxChars`
ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını ince ayarlamak için ipuçları yazdırır.

### 11c) Shell completion

Doctor geçerli shell için
(zsh, bash, fish veya PowerShell) sekme tamamlama kurulup kurulmadığını kontrol eder:

- Shell profili yavaş dinamik tamamlama deseni kullanıyorsa
  (`source <(openclaw completion ...)`), doctor bunu daha hızlı
  önbellekli dosya varyantına yükseltir.
- Tamamlama profilde yapılandırılmış ama önbellek dosyası eksikse,
  doctor önbelleği otomatik yeniden üretir.
- Hiç tamamlama yapılandırılmamışsa, doctor bunu kurmayı önerir
  (yalnızca etkileşimli modda; `--non-interactive` ile atlanır).

Önbelleği elle yeniden üretmek için `openclaw completion --write-state` çalıştırın.

### 12) Gateway auth denetimleri (yerel token)

Doctor yerel gateway token auth hazır oluşunu kontrol eder.

- Token modu token gerektiriyorsa ve token kaynağı yoksa, doctor bir tane oluşturmayı önerir.
- `gateway.auth.token` SecretRef tarafından yönetiliyorsa ama kullanılamıyorsa, doctor uyarır ve bunu düz metinle üzerine yazmaz.
- `openclaw doctor --generate-gateway-token`, yalnızca token SecretRef yapılandırılmamışsa oluşturmayı zorlar.

### 12b) Salt okunur SecretRef farkında onarımlar

Bazı onarım akışlarının, çalışma zamanındaki hızlı başarısız ol davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

- `openclaw doctor --fix`, hedefli config onarımları için artık durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
- Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mümkün olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
- Telegram bot token'ı SecretRef üzerinden yapılandırılmışsa ancak geçerli komut yolunda kullanılamıyorsa, doctor bu kimlik bilgisinin yapılandırılmış ama kullanılamaz olduğunu bildirir ve çökme veya token'ı eksikmiş gibi yanlış bildirme yerine otomatik çözümü atlar.

### 13) Gateway sağlık kontrolü + yeniden başlatma

Doctor sağlık kontrolü çalıştırır ve gateway sağlıksız görünüyorsa
yeniden başlatmayı önerir.

### 13b) Memory search hazır oluşu

Doctor yapılandırılmış memory search embedding sağlayıcısının
varsayılan agent için hazır olup olmadığını kontrol eder. Davranış yapılandırılmış backend ve sağlayıcıya bağlıdır:

- **QMD backend**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını probar.
  Değilse npm paketi ve elle ikili yol seçeneği dahil düzeltme kılavuzu yazdırır.
- **Açık yerel sağlayıcı**: yerel model dosyasını veya tanınan bir
  uzak/indirilebilir model URL'sini kontrol eder. Eksikse uzak sağlayıcıya geçmeyi önerir.
- **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya auth deposunda
  API anahtarının mevcut olduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
- **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini kontrol eder, sonra
  otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

Bir gateway prob sonucu mevcut olduğunda (denetim sırasında gateway sağlıklıydı),
doctor bunu CLI tarafından görülebilen config ile çapraz doğrular ve
herhangi bir uyuşmazlığı not eder.

Embedding hazır oluşunu çalışma zamanında doğrulamak için `openclaw memory status --deep` kullanın.

### 14) Kanal durum uyarıları

Gateway sağlıklıysa doctor kanal durum probu çalıştırır ve
önerilen düzeltmelerle birlikte uyarıları bildirir.

### 15) Supervisor config denetimi + onarım

Doctor kurulu supervisor config'inde (launchd/systemd/schtasks)
eksik veya güncel olmayan varsayılanları denetler (ör. systemd network-online bağımlılıkları ve
yeniden başlatma gecikmesi). Uyuşmazlık bulduğunda bir güncelleme önerir ve
hizmet dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

Notlar:

- `openclaw doctor`, supervisor config'i yeniden yazmadan önce ister.
- `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
- `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
- `openclaw doctor --repair --force`, özel supervisor config'lerini üzerine yazar.
- Token auth token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurulum/onarı mı SecretRef'i doğrular ama çözümlenmiş düz metin token değerlerini supervisor hizmet ortam meta verisine kalıcı yazmaz.
- Token auth token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, doctor kurulum/onarı m yolunu uygulanabilir kılavuzla engeller.
- Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmış ve `gateway.auth.mode` ayarlı değilse, doctor mod açıkça ayarlanana kadar kurulum/onarı mı engeller.
- Linux user-systemd birimleri için doctor token sapması denetimleri, hizmet auth meta verisini karşılaştırırken artık hem `Environment=` hem `EnvironmentFile=` kaynaklarını içerir.
- Tam yeniden yazmayı her zaman `openclaw gateway install --force` ile zorlayabilirsiniz.

### 16) Gateway çalışma zamanı + port tanıları

Doctor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve
hizmet kurulu ama aslında çalışmıyorsa uyarır. Ayrıca gateway portunda
(varsayılan `18789`) port çakışmalarını kontrol eder ve olası nedenleri bildirir (gateway zaten
çalışıyor, SSH tüneli).

### 17) Gateway çalışma zamanı en iyi uygulamaları

Doctor gateway hizmeti Bun üzerinde veya sürüm yöneticili bir Node yolunda
(`nvm`, `fnm`, `volta`, `asdf` vb.) çalışıyorsa uyarır. WhatsApp + Telegram kanalları Node gerektirir
ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet shell init'inizi
yüklemez. Doctor uygun olduğunda sistem Node kurulumuna
(Homebrew/apt/choco) geçiş sunar.

### 18) Config yazma + wizard meta verileri

Doctor tüm config değişikliklerini kalıcı yazar ve
doctor çalıştırmasını kaydetmek için wizard meta verilerini damgalar.

### 19) Çalışma alanı ipuçları (yedekleme + hafıza sistemi)

Doctor eksikse bir çalışma alanı hafıza sistemi önerir ve çalışma alanı zaten git altında değilse
yedekleme ipucu yazdırır.

Çalışma alanı yapısı ve git yedekleme için tam kılavuz:
[/concepts/agent-workspace](/concepts/agent-workspace) bölümüne bakın (önerilen: özel GitHub veya GitLab).
