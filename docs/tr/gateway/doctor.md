---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Uyumluluğu bozan yapılandırma değişiklikleri yapma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-04-30T09:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + migrasyon aracıdır. Bayat config/state öğelerini düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

## Hızlı başlangıç

```bash
openclaw doctor
```

### Headless ve otomasyon modları

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Sormadan varsayılanları kabul eder (uygulanabilir olduğunda yeniden başlatma/servis/sandbox onarım adımları dahil).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Önerilen onarımları sormadan uygular (güvenli olduğunda onarımlar + yeniden başlatmalar).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Agresif onarımları da uygular (özel supervisor config dosyalarının üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    İstemler olmadan çalışır ve yalnızca güvenli migrasyonları uygular (config normalizasyonu + disk üzerindeki state taşımaları). İnsan onayı gerektiren yeniden başlatma/servis/sandbox işlemlerini atlar. Eski state migrasyonları algılandığında otomatik çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek Gateway kurulumları için sistem servislerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek istiyorsanız önce config dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, kullanıcı arayüzü ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön denetim güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI'yi yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config ve migrasyonlar">
    - Eski değerler için config normalizasyonu.
    - Talk config migrasyonu: eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına.
    - Eski Chrome uzantısı config dosyaları ve Chrome MCP hazırlığı için tarayıcı migrasyon denetimleri.
    - OpenCode provider geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - Eski disk üzeri state migrasyonu (oturumlar/agent dizini/WhatsApp auth).
    - Eski Plugin manifest contract anahtarı migrasyonu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu migrasyonu (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` webhook fallback işleri).
    - Eski agent runtime-policy migrasyonu: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkin olduğunda bayat Plugin config temizliği; `plugins.enabled=false` olduğunda bayat Plugin referansları etkisiz containment config olarak değerlendirilir ve korunur.

  </Accordion>
  <Accordion title="State ve bütünlük">
    - Oturum kilit dosyası incelemesi ve bayat kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-rewrite dalları için oturum transcript onarımı.
    - State bütünlüğü ve izin denetimleri (oturumlar, transcript'ler, state dizini).
    - Yerelde çalışırken config dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/disabled durumlarını raporlar.
    - Ek çalışma alanı dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servisler ve supervisor'lar">
    - Sandbox etkin olduğunda sandbox imajı onarımı.
    - Eski servis migrasyonu ve ek Gateway algılama.
    - Matrix kanalı eski state migrasyonu (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (servis kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan Gateway'den yoklanır).
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan Gateway servisleri için gömülü proxy ortamı temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node ve Bun, version-manager yolları).
    - Gateway port çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, güvenlik ve eşleştirme">
    - Açık DM politikaları için güvenlik uyarıları.
    - local token modu için Gateway auth denetimleri (token kaynağı yoksa token üretimi önerir; token SecretRef config dosyalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk kez eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, bayat yerel device-token cache drift'i ve paired-record auth drift'i).

  </Accordion>
  <Accordion title="Çalışma alanı ve shell">
    - Linux'ta systemd linger denetimi.
    - Çalışma alanı bootstrap dosya boyutu denetimi (context dosyaları için kırpılma/sınıra yakın uyarıları).
    - Shell tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Memory arama embedding provider hazırlığı denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyuşmazlığı, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş config + wizard metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, temellendirilmiş Dreaming iş akışı için **Geri Doldur**, **Sıfırla** ve **Temellendirilmişleri Temizle** işlemlerini içerir. Bu işlemler Gateway doctor tarzı RPC yöntemleri kullanır, ancak `openclaw doctor` CLI onarım/migrasyonunun parçası **değildir**.

Yaptıkları:

- **Geri Doldur**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, temellendirilmiş REM günlük geçişini çalıştırır ve geri alınabilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Sıfırla**, yalnızca işaretlenmiş geri doldurma günlük girdilerini `DREAMS.md` dosyasından kaldırır.
- **Temellendirilmişleri Temizle**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı recall veya günlük destek biriktirmemiş aşamalandırılmış yalnızca temellendirilmiş kısa vadeli girdileri kaldırır.

Kendi başlarına **yapmadıkları**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor migrasyonlarını çalıştırmazlar
- önce aşamalandırılmış CLI yolunu açıkça çalıştırmadığınız sürece temellendirilmiş adayları otomatik olarak canlı kısa vadeli promotion deposuna aşamalandırmazlar

Temellendirilmiş geçmiş yeniden oynatmanın normal deep promotion hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken temellendirilmiş dayanıklı adayları kısa vadeli Dreaming deposuna aşamalandırır.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Config normalizasyonu">
    Config eski değer biçimleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları mevcut şemaya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Mevcut herkese açık Talk config yapısı `talk.provider` + `talk.providers.<provider>` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini provider map'ine yeniden yazar.

  </Accordion>
  <Accordion title="2. Eski config anahtarı migrasyonları">
    Config kullanımdan kaldırılmış anahtarlar içerdiğinde diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı migrasyonu gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway de eski bir config biçimi algıladığında başlangıçta doctor migrasyonlarını otomatik çalıştırır, böylece bayat config dosyaları manuel müdahale olmadan onarılır. Cron iş deposu migrasyonları `openclaw doctor --fix` tarafından işlenir.

    Mevcut migrasyonlar:

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
    - `messages.tts.provider: "edge"` ve `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` ve `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` ve `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` ve `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Adlandırılmış `accounts` öğeleri olan ancak kalan tek hesaplı üst düzey kanal değerleri bulunan kanallar için, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşı (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` kaldırılır; yavaş provider/model timeout'ları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` kaldırılır (eski uzantı relay ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlangıcı ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış provider'ları kapalı hata vermek yerine atlar)

    Doctor uyarıları çok hesaplı kanallar için account-default rehberliği de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor fallback yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap ID'sine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap ID'lerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğesini elle eklediyseniz, `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazırlığı">
    Tarayıcı yapılandırmanız hala kaldırılmış Chrome uzantı yolunu gösteriyorsa, doctor bunu geçerli ana makine yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlantı profilleri için Google Chrome'un aynı ana makinede yüklü olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP hâlâ şunları gerektirir:

    - Gateway/Node ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışıyor olması
    - o tarayıcıda uzaktan hata ayıklamanın etkin olması
    - tarayıcıdaki ilk bağlanma onayı isteminin onaylanması

    Buradaki hazırlık yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session, geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu işlemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, korumalı alan, uzak tarayıcı veya diğer başsız akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS önkoşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini kontrol etmek için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme yönergeleri yazdırır. Homebrew Node kullanılan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile Gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar daha yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece bayat taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex plugin rota uyarıları">
    Paketle gelen Codex plugin etkinleştirildiğinde doctor, `openai-codex/*` birincil model başvurularının hâlâ varsayılan PI çalıştırıcısı üzerinden çözülüp çözülmediğini de denetler. Codex OAuth/abonelik kimlik doğrulamasını PI üzerinden istediğinizde bu kombinasyon geçerlidir, ancak yerel Codex uygulama sunucusu donanımıyla karıştırılması kolaydır. Doctor uyarır ve açık uygulama sunucusu biçimini gösterir: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik olarak onarmaz çünkü iki rota da geçerlidir:

    - `openai-codex/*` + PI, "normal OpenClaw çalıştırıcısı üzerinden Codex OAuth/abonelik kimlik doğrulamasını kullan" anlamına gelir.
    - `openai/*` + `runtime: "codex"`, "gömülü turu yerel Codex uygulama sunucusu üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth bilinçli olarak kullanılıyorsa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor, eski disk üstü düzenleri geçerli yapıya geçirebilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Aracı dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çaba esaslı ve idempotenttir; doctor herhangi bir eski klasörü yedek olarak geride bıraktığında uyarılar yayar. Gateway/CLI, başlangıçta eski oturumları ve aracı dizinini de otomatik olarak geçirir; böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırılmadan aracı başına yola iner. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` üzerinden geçirilir. Konuşma sağlayıcısı/sağlayıcı haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu nedenle yalnızca anahtar sırası farklılıkları artık tekrar eden işlemsiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için yüklü tüm plugin manifestlerini tarar. Bulduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse eski anahtar veri çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`), zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri açısından denetler.

    Geçerli cron temizlikleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` Webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak geçirir. Bir iş eski bildirim yedeğini mevcut Webhook dışı bir teslim moduyla birleştirirse, doctor uyarır ve o işi elle inceleme için bırakır.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her aracı oturum dizinini bayat yazma kilidi dosyaları açısından tarar; bunlar bir oturum anormal şekilde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve bayat kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda bayat kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkript dalı onarımı">
    Doctor, 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenen dal biçimi için aracı oturum JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala yeniden yazar; böylece Gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: felaket düzeyinde durum kaybı hakkında uyarır, dizini yeniden oluşturmayı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı önerir (sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu da yayar).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı aşınabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı hale getirmek ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyor).
    - **Birden çok durum dizini**: ana dizinler arasında birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, onu uzak ana makinede çalıştırmanızı hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600` değerine sıkılaştırmayı önerir.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresi dolma)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'ların süresi dolmak üzereyse veya dolmuşsa uyarır ve güvenli olduğunda onları yenileyebilir. Anthropic OAuth/token profili bayatsa, Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalıştırırken (TTY) görünür; `--non-interactive` yenileme girişimlerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini de bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlıysa, doctor model başvurusunu katalog ve izin listesine göre doğrular ve çözülmeyecekse veya izin verilmiyorsa uyarır.
  </Accordion>
  <Accordion title="7. Korumalı alan imajı onarımı">
    Korumalı alan etkinleştirildiğinde, doctor Docker imajlarını denetler ve geçerli imaj eksikse oluşturmayı veya eski adlara geçmeyi önerir.
  </Accordion>
  <Accordion title="7b. Paketle gelen plugin çalışma zamanı bağımlılıkları">
    Doctor, çalışma zamanı bağımlılıklarını yalnızca geçerli yapılandırmada etkin olan veya paketle gelen manifest varsayılanıyla etkinleştirilen paketle gelen plugin'ler için doğrular; örneğin `plugins.entries.discord.enabled: true`, eski `channels.discord.enabled: true`, yapılandırılmış `models.providers.*` / aracı model başvuruları veya sağlayıcı sahipliği olmayan varsayılan olarak etkin paketle gelen plugin. Eksik olanlar varsa doctor paketleri bildirir ve `openclaw doctor --fix` / `openclaw doctor --repair` modunda bunları yükler. Harici plugin'ler hâlâ `openclaw plugins install` / `openclaw plugins update` kullanır; doctor rastgele plugin yolları için bağımlılık yüklemez.

    Doctor onarımı sırasında, paketlenmiş çalışma zamanı bağımlılığı npm kurulumları TTY oturumlarında spinner ilerlemesi, yönlendirilmiş/headless çıktıda ise periyodik satır ilerlemesi bildirir. Gateway ve yerel CLI de paketlenmiş bir Plugin içe aktarılmadan önce etkin paketlenmiş Plugin çalışma zamanı bağımlılıklarını isteğe bağlı olarak onarabilir. Bu kurulumlar Plugin çalışma zamanı kurulum köküyle sınırlıdır, betikler devre dışı bırakılarak çalışır, package lock yazmaz ve eşzamanlı CLI veya Gateway başlatmalarının aynı `node_modules` ağacını aynı anda değiştirmemesi için kurulum kökü kilidiyle korunur.

  </Accordion>
  <Accordion title="8. Gateway servis geçişleri ve temizlik ipuçları">
    Doctor eski gateway servislerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli gateway portunu kullanarak OpenClaw servisini kurmayı önerir. Ayrıca ek gateway benzeri servisleri tarayabilir ve temizlik ipuçları yazdırabilir. Profil adı verilen OpenClaw gateway servisleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyindeki gateway servisi eksikse ancak sistem düzeyinde bir OpenClaw gateway servisi varsa, doctor otomatik olarak ikinci bir kullanıcı düzeyi servisi kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından kopya servisi kaldırın ya da gateway yaşam döngüsü bir sistem supervisor tarafından yönetildiğinde `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi olduğunda, doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çabayla geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk kez eşleme istekleri
    - zaten eşlenmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşlenmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleşirken cihaz kimliğinin onaylanmış kayıtla artık eşleşmediği public-key uyuşmazlığı onarımları
    - onaylanmış bir rol için etkin token eksik olan eşlenmiş kayıtlar
    - kapsamları onaylanmış eşleme temel çizgisinin dışına sapan eşlenmiş token'lar
    - geçerli makine için gateway tarafı token döndürmesinden önce gelen veya eski kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Doctor eşleme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - yeni bir token'ı `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşlenmiş ama hâlâ eşleme gerekli uyarısı alıyor" açığını kapatır: doctor artık ilk kez eşlemeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir provider allowlist olmadan DM'lere açıksa veya bir ilke tehlikeli şekilde yapılandırılmışsa uyarılar üretir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı servisi olarak çalışıyorsa doctor, gateway'in oturum kapatıldıktan sonra canlı kalması için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (skills, Plugin'ler ve eski dizinler)">
    Doctor varsayılan aracı için çalışma alanı durumunun özetini yazdırır:

    - **Skills durumu**: uygun, eksik gereksinimli ve allowlist tarafından engellenmiş skills sayılarını verir.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanıyla birlikte mevcut olduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin ID'lerini listeler; bundle Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanıyla uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yayılan yükleme zamanı uyarılarını veya hatalarını görünür kılar.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın ya da onun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam bütçenin bir kesri olarak toplam enjekte edilmiş karakterleri bildirir. Dosyalar kesildiğinde veya sınıra yakın olduğunda doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın gateway'den hâlâ ona bağlanmasını istemesi nedeniyle oluşan Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Shell tamamlama">
    Doctor, geçerli shell için sekme tamamlamanın kurulu olup olmadığını denetler (zsh, bash, fish veya PowerShell):

    - Shell profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor kurulum için istem gösterir (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor yerel gateway token kimlik doğrulama hazır olma durumunu denetler.

    - Token modu bir token gerektiriyorsa ve token kaynağı yoksa doctor bir tane oluşturmayı önerir.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve onu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca token SecretRef yapılandırılmamışsa oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkında onarımlar">
    Bazı onarım akışlarının, çalışma zamanı fail-fast davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedeflenmiş yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, varsa yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token'ı SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa doctor, çökmeden veya token'ı eksik olarak yanlış bildirmeden kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve gateway sağlıksız göründüğünde yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Memory arama hazır olma durumu">
    Doctor, yapılandırılmış memory arama embedding provider'ının varsayılan aracı için hazır olup olmadığını denetler. Davranış yapılandırılmış backend'e ve provider'a bağlıdır:

    - **QMD backend'i**: `qmd` binary'sinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse npm paketi ve elle binary yolu seçeneği dahil düzeltme rehberi yazdırır.
    - **Açık yerel provider**: yerel model dosyası veya tanınan uzak/indirilebilir model URL'si denetler. Eksikse uzak provider'a geçmeyi önerir.
    - **Açık uzak provider** (`openai`, `voyage` vb.): ortamda veya auth deposunda bir API anahtarının mevcut olduğunu doğrular. Eksikse işlem yapılabilir düzeltme ipuçları yazdırır.
    - **Otomatik provider**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak provider'ı dener.

    Önbelleğe alınmış gateway yoklama sonucu mevcut olduğunda (gateway denetim sırasında sağlıklıydı), doctor sonucunu CLI tarafından görülebilen yapılandırmayla çapraz referanslar ve herhangi bir tutarsızlığı not eder. Doctor varsayılan yolda yeni bir embedding ping'i başlatmaz; canlı provider denetimi istediğinizde derin memory durum komutunu kullanın.

    Çalışma zamanında embedding hazır olma durumunu doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya eski varsayılanlar için denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyuşmazlık bulduğunda güncelleme önerir ve servis dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce istem gösterir.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, doctor'ı gateway servis yaşam döngüsü için salt okunur tutar. Servis sağlığını yine bildirir ve servis dışı onarımları çalıştırır, ancak dış bir supervisor bu yaşam döngüsünü yönettiği için servis kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırma yeniden yazmaları ve eski servis temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd gateway unit'i etkinken komut/entrypoint meta verisini yeniden yazmaz. Ayrıca kopya servis taraması sırasında etkin olmayan eski olmayan ek gateway benzeri unit'leri yok sayar, böylece companion servis dosyaları temizlik gürültüsü oluşturmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa doctor servis kurulumu/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor servis ortamı meta verisine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içinde gömdüğü yönetilen `.env`/SecretRef destekli servis ortam değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için servis meta verisini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra servis komutunun hâlâ eski bir `--port` değerine sabitlendiğini algılar ve servis meta verisini geçerli porta yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse doctor, kurulum/onarım yolunu işlem yapılabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa doctor, mod açıkça ayarlanana kadar kurulum/onarımı engeller.
    - Linux kullanıcı-systemd unit'leri için doctor token sapması denetimleri artık servis auth meta verisini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor servis onarımları, yapılandırma son olarak daha yeni bir sürüm tarafından yazıldığında eski bir OpenClaw binary'sinden gelen gateway servisini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` üzerinden her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılama">
    Doctor, hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu halde gerçekten çalışmıyorsa uyarır. Ayrıca gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, gateway hizmeti Bun üzerinde veya sürümle yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları, hizmet kabuk başlangıcınızı yüklemediği için yükseltmelerden sonra bozulabilir. Doctor, mevcut olduğunda bir sistem Node kurulumuna geçirmeyi önerir (Homebrew/apt/choco).

    Yeni kurulan veya onarılan hizmetler açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini korur, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcut olduğunda hizmet PATH’ine yazılır. Bu, oluşturulan gözetici PATH’inin, doctor’ın daha sonra çalıştırdığı aynı minimal-PATH denetimiyle uyumlu kalmasını sağlar.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz metaverileri">
    Doctor, tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz metaverilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi (önerilen özel GitHub veya GitLab) hakkında eksiksiz kılavuz için [/concepts/agent-workspace](/tr/concepts/agent-workspace) sayfasına bakın.

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
