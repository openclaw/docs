---
read_when:
    - doctor geçişleri ekleme veya değiştirme
    - Uyumluluğu bozan yapılandırma değişikliklerini kullanıma sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Tanılama
x-i18n:
    generated_at: "2026-05-01T09:00:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: eef5715d485609fa60bdb4aa97ee441b053a60519b9dea03b0c8ec09db157474
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski yapılandırma/durum verilerini düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul eder (uygulanabilir olduğunda yeniden başlatma/hizmet/sandbox onarım adımları dahil).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Sormadan önerilen onarımları uygular (güvenli olduğunda onarımlar + yeniden başlatmalar).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Agresif onarımları da uygular (özel supervisor yapılandırmalarının üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Sorma olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalleştirmesi + disk üzerindeki durum taşımaları). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri tespit edildiğinde otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek Gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeni olduğunda Control UI'yi yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config and migrations">
    - Eski değerler için yapılandırma normalleştirmesi.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk yapılandırması geçişi.
    - Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazır olma durumu için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ joker karakter veya Plugin'e ait araçlar istediğinde Plugin/araç izin listesi uyarıları.
    - Eski disk üzerindeki durum geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` webhook yedek işleri).
    - Eski ajan çalışma zamanı ilkesi geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkin olduğunda eski Plugin yapılandırması temizliği; `plugins.enabled=false` olduğunda eski Plugin başvuruları etkisiz kapsama yapılandırması olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="State and integrity">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt yeniden yazma dalları için oturum transcript onarımı.
    - Sıkışmış alt ajan yeniden başlatma-kurtarma tombstone tespiti; başlangıcın çocuğu yeniden başlatma nedeniyle iptal edilmiş olarak değerlendirmeyi sürdürmemesi için eski iptal edilmiş kurtarma bayraklarını temizlemeye yönelik `--fix` desteğiyle.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, transcript'ler, durum dizini).
    - Yerel olarak çalışırken yapılandırma dosyası izin denetimleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile bekleme/disabled durumlarını raporlar.
    - Ek çalışma alanı dizini tespiti (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Sandbox etkinleştirildiğinde sandbox image onarımı.
    - Eski hizmet geçişi ve ek Gateway tespiti.
    - Matrix kanal eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan Gateway'den yoklanır).
    - İsteğe bağlı onarımla supervisor yapılandırması denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalamış Gateway hizmetleri için gömülü proxy ortamı temizliği.
    - Gateway çalışma zamanı en iyi uygulama denetimleri (Node vs Bun, sürüm yöneticisi yolları).
    - Gateway port çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway kimlik doğrulama denetimleri (token kaynağı yoksa token oluşturmayı önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun tespiti (bekleyen ilk kez eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel cihaz-token önbelleği kayması ve eşleştirilmiş kayıt kimlik doğrulama kayması).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux'ta systemd linger denetimi.
    - Çalışma alanı bootstrap dosyası boyutu denetimi (bağlam dosyaları için kesilme/sınıra yaklaşma uyarıları).
    - Shell tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek arama embedding sağlayıcısı hazır olma denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyumsuzluğu, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş yapılandırma + sihirbaz metadata'sı yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler Gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Ne yaptıkları:

- **Backfill**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve geri alınabilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca işaretli geri doldurma günlük girdilerini `DREAMS.md` dosyasından kaldırır.
- **Clear Grounded**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı hatırlama ya da günlük destek biriktirmemiş staged grounded-only kısa vadeli girdileri kaldırır.

Kendi başlarına **yapmadıkları**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce staged CLI yolunu açıkça çalıştırmadığınız sürece grounded adayları otomatik olarak canlı kısa vadeli promotion deposuna stage etmezler

Grounded geçmiş yeniden oynatmasının normal derin promotion hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken grounded durable adayları kısa vadeli dreaming deposuna stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) yapmayı önerir.
  </Accordion>
  <Accordion title="1. Config normalization">
    Yapılandırma eski değer biçimleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları mevcut şemaya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Mevcut genel Talk yapılandırması `talk.provider` + `talk.providers.<provider>` biçimindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini sağlayıcı haritasına yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi
    joker karakter veya Plugin'e ait araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca
    gerçekten yüklenen Plugin'lerden gelen araçlarla eşleşir; özel Plugin
    izin listesini baypas etmez.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway ayrıca eski bir yapılandırma biçimi tespit ettiğinde başlangıçta doctor geçişlerini otomatik çalıştırır, böylece eski yapılandırmalar manuel müdahale olmadan onarılır. Cron iş deposu geçişleri `openclaw doctor --fix` tarafından işlenir.

    Mevcut geçişler:

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
    - Adlandırılmış `accounts` bulunan ancak tek hesaplı üst düzey kanal değerleri kalmış kanallar için, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (araçlar/yükseltilmiş/exec/sandbox/alt ajanlar)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` kaldırılır; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` kaldırılır (eski uzantı relay ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (gateway başlatması ayrıca `api` değeri kapalı biçimde başarısız olmak yerine gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap-varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` değerlerini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu gösteriyorsa, doctor bunu mevcut ana makine-yerel Chrome MCP ekleme modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine-yerel Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana makinede kurulu olup olmadığını kontrol eder
    - algılanan Chrome sürümünü kontrol eder ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine-yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışıyor olması
    - o tarayıcıda uzaktan hata ayıklamanın etkin olması
    - tarayıcıdaki ilk ekleme onay istemini onaylama

    Buradaki hazır olma yalnızca yerel ekleme önkoşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu kontrol Docker, sandbox, uzak-tarayıcı veya diğer başsız akışlar için **geçerli değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özel düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` komutudur. `--deep` ile, gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece bayat taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    Paketle gelen Codex Plugin etkinleştirildiğinde, doctor `openai-codex/*` birincil model referanslarının hâlâ varsayılan PI çalıştırıcısı üzerinden çözümlenip çözümlenmediğini de kontrol eder. Codex OAuth/abonelik kimlik doğrulamasını PI üzerinden kullanmak istediğinizde bu kombinasyon geçerlidir, ancak yerel Codex uygulama-sunucusu donanımıyla karıştırılması kolaydır. Doctor uyarır ve açık uygulama-sunucusu biçimini işaret eder: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik olarak onarmaz çünkü iki rota da geçerlidir:

    - `openai-codex/*` + PI, "normal OpenClaw çalıştırıcısı üzerinden Codex OAuth/abonelik kimlik doğrulamasını kullan" anlamına gelir.
    - `openai/*` + `runtime: "codex"`, "yerleşik dönüşü yerel Codex uygulama-sunucusu üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını kontrol et veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth kasıtlıysa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor eski disk üzeri düzenleri mevcut yapıya geçirebilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çabayla yapılır ve idempotenttir; doctor herhangi bir eski klasörü yedek olarak geride bıraktığında uyarılar yayımlar. Gateway/CLI ayrıca başlangıçta eski oturumları ve ajan dizinini otomatik olarak geçirir; böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırmadan ajan başına yola iner. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` ile geçirilir. Konuşma sağlayıcısı/sağlayıcı-haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır; bu nedenle yalnızca anahtar sırasından kaynaklanan farklar artık tekrarlanan işlemsiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için kurulu tüm Plugin manifestlerini tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar veriler çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json`, geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri açısından kontrol eder.

    Geçerli cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey yük alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - yük `provider` teslim diğer adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik geçirir. Bir iş eski bildirim yedeğini mevcut Webhook olmayan bir teslim modu ile birleştirirse, doctor uyarır ve o işi elle inceleme için bırakır.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor, her ajan oturum dizinini bayat yazma-kilidi dosyaları için tarar; bunlar bir oturum anormal şekilde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve bayat kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda bayat kilit dosyalarını otomatik kaldırır; aksi takdirde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor, 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal biçimi için ajan oturumu JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamı bulunan terk edilmiş bir kullanıcı dönüşü ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda, doctor etkilenen her dosyayı özgünün yanında yedekler ve transkripti etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenmiş dönüşler görmez.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa, oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları kontrol eder:

    - **Durum dizini eksik**: yıkıcı durum kaybı konusunda uyarır, dizini yeniden oluşturmanızı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (sahip/grup uyumsuzluğu algılandığında bir `chown` ipucu verir).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır, çünkü eşitleme destekli yollar daha yavaş G/Ç ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır, çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları sırasında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkript yalnızca bir satıra sahipse işaretler (geçmiş birikmiyordur).
    - **Birden çok durum dizini**: ev dizinleri arasında birden fazla `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/herkes tarafından okunabilir durumdaysa uyarır ve `600` olarak sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresi dolma)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, tokenlerin süresi dolmak üzereyken/dolduğunda uyarır ve güvenli olduğunda yenileyebilir. Anthropic OAuth/token profili eskiyse, bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model referansını katalog ve izin listesine göre doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Korumalı alan görüntüsü onarımı">
    Korumalı alan etkinleştirildiğinde doctor, Docker görüntülerini denetler ve geçerli görüntü eksikse derlemeyi veya eski adlara geçmeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Paketli Plugin çalışma zamanı bağımlılıkları">
    Doctor, çalışma zamanı bağımlılıklarını yalnızca geçerli yapılandırmada etkin olan veya paketli manifest varsayılanıyla etkinleştirilen paketli Plugin'ler için doğrular; örneğin `plugins.entries.discord.enabled: true`, eski `channels.discord.enabled: true`, yapılandırılmış `models.providers.*` / aracı model referansları veya sağlayıcı sahipliği olmayan varsayılan olarak etkin bir paketli Plugin. Eksik olan varsa doctor paketleri bildirir ve bunları `openclaw doctor --fix` / `openclaw doctor --repair` modunda yükler. Harici Plugin'ler hâlâ `openclaw plugins install` / `openclaw plugins update` kullanır; doctor keyfi Plugin yolları için bağımlılık yüklemez.

    Doctor onarımı sırasında, paketli çalışma zamanı bağımlılığı npm yüklemeleri TTY oturumlarında dönen ilerleme göstergesi, borulu/başsız çıktıda ise dönemsel satır ilerlemesi bildirir. Gateway başlatma ve yapılandırma yeniden yükleme, paketli Plugin çalışma zamanı modüllerini içe aktarmadan önce Plugin planı moduna girer; normal çalışma zamanı içe aktarmaları yalnızca doğrulama amaçlıdır ve paket yöneticisi onarımı başlatmaz. Bu yüklemeler Plugin çalışma zamanı yükleme köküyle sınırlıdır, betikler devre dışı çalıştırılır, paket kilidi yazmaz ve eşzamanlı CLI veya Gateway başlatmaları aynı `node_modules` ağacını aynı anda değiştirmesin diye bir yükleme kökü kilidiyle korunur. Öldürülmüş Docker/konteyner başlatmalarından kalan eski kilitler, sahip meta verileri geçerli bir süreç örneğini kanıtlayamadığında ve kilit dosyaları eski olduğunda geri alınır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizlik ipuçları">
    Doctor, eski Gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli Gateway bağlantı noktasını kullanarak OpenClaw hizmetini yüklemeyi teklif eder. Ayrıca ek Gateway benzeri hizmetleri tarayıp temizlik ipuçları yazdırabilir. Profil adlandırmalı OpenClaw Gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi Gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw Gateway hizmeti varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet yüklemez. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın ya da Gateway yaşam döngüsünü bir sistem gözetmeni yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya uygulanabilir bir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda), geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve başlatma devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleşirken cihaz kimliğinin artık onaylı kayıtla eşleşmediği ortak anahtar uyuşmazlığı onarımları
    - onaylı bir rol için etkin tokeni eksik eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme taban çizgisinin dışına sapan eşleştirilmiş tokenler
    - geçerli makine için Gateway tarafı token rotasyonundan daha eski olan veya eski kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Doctor eşleştirme isteklerini otomatik onaylamaz veya cihaz tokenlerini otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirildi ama hâlâ eşleştirme gerekli alınıyor" boşluğunu kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir ilke tehlikeli bir şekilde yapılandırıldığında uyarılar verir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, Gateway oturum kapatma sonrasında canlı kalsın diye linger etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Doctor, varsayılan aracı için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve izin listesi tarafından engellenmiş Skills sayısını sayar.
    - **Eski çalışma alanı dizinleri**: geçerli çalışma alanının yanında `~/openclaw` veya diğer eski çalışma alanı dizinleri bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yayımlanan yükleme zamanı uyarılarını veya hatalarını yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesilme yüzdesini, kesilme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir oranı olarak bildirir. Dosyalar kesildiğinde veya sınıra yaklaştığında doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı yokken yapılandırmanın Gateway'den hâlâ ona bağlanmasını istediği Gateway başlatma döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın yüklü olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama kalıbı (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmışsa ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor yüklemeyi ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel Gateway token kimlik doğrulama hazır oluşunu denetler.

    - Token modunun bir tokene ihtiyacı varsa ve token kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyorsa ancak kullanılamıyorsa doctor uyarır ve onu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca yapılandırılmış bir token SecretRef yoksa oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkındalıklı onarımlar">
    Bazı onarım akışlarının, çalışma zamanı fail-fast davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot tokeni SecretRef üzerinden yapılandırılmışsa ancak geçerli komut yolunda kullanılamıyorsa doctor, kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çökme veya tokeni eksik bildirme yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve sağlıksız göründüğünde Gateway'i yeniden başlatmayı teklif eder.
  </Accordion>
  <Accordion title="13b. Bellek arama hazır oluşu">
    Doctor, yapılandırılmış bellek arama gömme sağlayıcısının varsayılan aracı için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse npm paketi ve elle ikili yolu seçeneği dahil düzeltme kılavuzu yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan bir uzak/indirilebilir model URL'si denetler. Eksikse uzak sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage`, vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (Gateway denetim sırasında sağlıklıydı), doctor sonucunu CLI tarafından görülebilen yapılandırmayla çapraz referanslar ve varsa tutarsızlıkları belirtir. Doctor, varsayılan yolda yeni bir embedding pingi başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında embedding hazır olma durumunu doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, yüklü supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar açısından denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve servis dosyasını/görevi geçerli varsayılanlara göre yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce onay ister.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway servis yaşam döngüsü için doctor'ı salt okunur tutar. Servis sağlığını bildirmeye ve servis dışı onarımları çalıştırmaya devam eder, ancak bu yaşam döngüsünün sahibi harici bir supervisor olduğu için servis kurulumunu/başlatmayı/yeniden başlatmayı/bootstrap işlemini, supervisor yapılandırması yeniden yazımlarını ve eski servis temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkin durumdayken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca, yinelenen servis taraması sırasında etkin olmayan eski olmayan ek Gateway benzeri birimleri yok sayar; böylece eşlikçi servis dosyaları temizleme gürültüsü oluşturmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor servis kurulumu/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor servis ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içine gömdüğü yönetilen `.env`/SecretRef destekli servis ortamı değerlerini algılar ve servis meta verilerini, bu değerler supervisor tanımı yerine çalışma zamanı kaynağından yüklenecek şekilde yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra servis komutunun hâlâ eski bir `--port` sabitlediğini algılar ve servis meta verilerini geçerli porta göre yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılan token SecretRef çözümlenemiyorsa, doctor kurulum/onarım yolunu uygulanabilir yönlendirmeyle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulum/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için doctor token sapması denetimleri artık servis kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor servis onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa daha eski bir OpenClaw ikilisinden gelen Gateway servisini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor, servis çalışma zamanını (PID, son çıkış durumu) inceler ve servis yüklü olduğu hâlde gerçekten çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (Gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway servisi Bun üzerinde veya sürüm yönetimli bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü servis shell init dosyanızı yüklemez. Doctor, kullanılabilir olduğunda bir sistem Node kurulumuna geçiş yapmayı önerir (Homebrew/apt/choco).

    Yeni yüklenen veya onarılan servisler açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini korur, ancak tahmin edilen sürüm yöneticisi geri dönüş dizinleri yalnızca bu dizinler diskte mevcutsa servis PATH'ine yazılır. Bu, oluşturulan supervisor PATH'inin doctor'ın daha sonra çalıştırdığı aynı minimal-PATH denetimiyle uyumlu kalmasını sağlar.

  </Accordion>
  <Accordion title="18. Yapılandırma yazımı + sihirbaz meta verileri">
    Doctor, yapılandırma değişikliklerini kalıcılaştırır ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı hâlihazırda git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedekleme (önerilen özel GitHub veya GitLab) hakkında tam kılavuz için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook'u](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
