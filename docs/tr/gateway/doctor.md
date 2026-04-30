---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Uyumluluğu bozan yapılandırma değişikliklerini tanıtma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Tanılama
x-i18n:
    generated_at: "2026-04-30T16:29:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eskimiş yapılandırma/durumu düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul eder (uygulanabildiğinde yeniden başlatma/hizmet/sandbox onarım adımları dahil).

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

    Agresif onarımları da uygular (özel supervisor yapılandırmalarının üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Komut istemleri olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalleştirme + disk üzerindeki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek Gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek istiyorsanız, önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI'ı yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve plugin durumu.

  </Accordion>
  <Accordion title="Yapılandırma ve geçişler">
    - Eski değerler için yapılandırma normalleştirme.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine Talk yapılandırma geçişi.
    - Eski Chrome extension yapılandırmaları ve Chrome MCP hazır olma durumu için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS ön koşulları denetimi.
    - Eski disk üzerindeki durum geçişi (oturumlar/agent dizini/WhatsApp auth).
    - Eski plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` webhook yedek işleri).
    - Eski agent çalışma zamanı ilkesi geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkinleştirildiğinde eskimiş plugin yapılandırma temizliği; `plugins.enabled=false` olduğunda, eskimiş plugin referansları etkisiz kapsama yapılandırması olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyası incelemesi ve eskimiş kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-rewrite dalları için oturum dökümü onarımı.
    - Yeniden başlatma kurtarma sürecinde takılmış subagent tombstone algılama; başlangıcın child'ı yeniden başlatma iptal edildi olarak ele almaya devam etmemesi için eskimiş iptal edilmiş kurtarma bayraklarını temizlemede `--fix` desteği.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, dökümler, durum dizini).
    - Yerel çalışırken yapılandırma dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile bekleme/devre dışı durumlarını raporlar.
    - Ek çalışma alanı dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, hizmetler ve supervisor'lar">
    - Sandbox etkinleştirildiğinde sandbox imajı onarımı.
    - Eski hizmet geçişi ve ek Gateway algılama.
    - Matrix kanal eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı denetimleri (hizmet kurulmuş ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan Gateway üzerinden yoklanır).
    - İsteğe bağlı onarımla supervisor yapılandırma denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında kabuk `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalamış Gateway hizmetleri için gömülü proxy ortam temizliği.
    - Gateway çalışma zamanı en iyi uygulama denetimleri (Node ve Bun, sürüm yöneticisi yolları).
    - Gateway port çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, güvenlik ve eşleştirme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway auth denetimleri (token kaynağı yoksa token oluşturma önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eskimiş yerel cihaz-token önbelleği sapması ve eşleştirilmiş kayıt auth sapması).

  </Accordion>
  <Accordion title="Çalışma alanı ve kabuk">
    - Linux'ta systemd linger denetimi.
    - Çalışma alanı bootstrap dosya boyutu denetimi (bağlam dosyaları için kesilme/sınıra yakın uyarıları).
    - Kabuk tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek arama embedding sağlayıcısı hazır olma denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyuşmazlığı, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş yapılandırmayı + sihirbaz metadatasını yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, temellendirilmiş Dreaming iş akışı için **Geri Doldur**, **Sıfırla** ve **Temellendirilmişi Temizle** eylemlerini içerir. Bu eylemler Gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Yaptıkları:

- **Geri Doldur**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, temellendirilmiş REM günlük geçişini çalıştırır ve tersine çevrilebilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Sıfırla**, yalnızca bu işaretli geri doldurma günlük girdilerini `DREAMS.md` içinden kaldırır.
- **Temellendirilmişi Temizle**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı hatırlama veya günlük destek biriktirmemiş, staged temellendirilmişe özel kısa vadeli girdileri kaldırır.

Kendi başlarına **yapmadıkları**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce staged CLI yolunu açıkça çalıştırmadığınız sürece temellendirilmiş adayları otomatik olarak canlı kısa vadeli yükseltme deposuna stage etmezler

Temellendirilmiş geçmiş yeniden oynatmanın normal derin yükseltme hattını etkilemesini istiyorsanız, bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken temellendirilmiş dayanıklı adayları kısa vadeli Dreaming deposuna stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalıştırılmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Yapılandırma normalleştirme">
    Yapılandırma eski değer biçimleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski düz Talk alanları dahildir. Geçerli genel Talk yapılandırması `talk.provider` + `talk.providers.<provider>` biçimindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini sağlayıcı haritasına yeniden yazar.

  </Accordion>
  <Accordion title="2. Eski yapılandırma anahtarı geçişleri">
    Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - Güncellenmiş şemayla `~/.openclaw/openclaw.json` dosyasını yeniden yazar.

    Gateway de eski bir yapılandırma biçimi algıladığında başlangıçta doctor geçişlerini otomatik olarak çalıştırır; böylece eskimiş yapılandırmalar manuel müdahale olmadan onarılır. Cron iş deposu geçişleri `openclaw doctor --fix` tarafından işlenir.

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
    - Adlandırılmış `accounts` bulunan ancak kalıcı tek hesap üst düzey kanal değerleri olan kanallar için, bu hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşı (`accounts.default` çoğu kanal için; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldır; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullan
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldır (eski extension relay ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlangıcı ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları kapalı hata vermek yerine atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesabı seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` değerlerini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazır olma durumu">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu gösteriyorsa, doctor bunu geçerli ana makine-yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine-yerel Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana makinede yüklü olup olmadığını kontrol eder
    - algılanan Chrome sürümünü kontrol eder ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin yerinize etkinleştiremez. Ana makine-yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı bir tarayıcı 144+
    - tarayıcının yerel olarak çalışması
    - o tarayıcıda uzaktan hata ayıklamanın etkinleştirilmiş olması
    - tarayıcıdaki ilk bağlanma onay isteminin onaylanması

    Buradaki hazır olma durumu yalnızca yerel bağlanma ön koşullarıyla ilgilidir. Existing-session geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu kontrol Docker, sandbox, uzak tarayıcı veya diğer başsız akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS ön koşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS'te düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, eski taşıma geçersiz kılmasını kaldırıp veya yeniden yazıp yerleşik yönlendirme/yedek davranışını geri alabilmeniz için Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex Plugin rota uyarıları">
    Paketle gelen Codex Plugin etkinleştirildiğinde, doctor `openai-codex/*` birincil model referanslarının hâlâ varsayılan PI çalıştırıcısı üzerinden çözümlenip çözümlenmediğini de kontrol eder. Codex OAuth/abonelik kimlik doğrulamasını PI üzerinden istediğinizde bu kombinasyon geçerlidir, ancak yerel Codex uygulama sunucusu çalıştırma sistemiyle karıştırılması kolaydır. Doctor uyarır ve açık uygulama sunucusu biçimine işaret eder: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik olarak onarmaz çünkü iki rota da geçerlidir:

    - `openai-codex/*` + PI, "normal OpenClaw çalıştırıcısı üzerinden Codex OAuth/abonelik kimlik doğrulamasını kullan" anlamına gelir.
    - `openai/*` + `runtime: "codex"`, "yerleşik turu yerel Codex uygulama sunucusu üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth bilinçli olarak kullanılıyorsa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor, eski disk üzeri düzenleri geçerli yapıya geçirebilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çabayla yapılır ve idempotenttir; doctor herhangi bir eski klasörü yedek olarak geride bıraktığında uyarılar yayımlar. Gateway/CLI ayrıca başlangıçta eski oturumları ve ajan dizinini otomatik olarak geçirir; böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırmadan ajan başına yola yerleşir. WhatsApp kimlik doğrulaması bilinçli olarak yalnızca `openclaw doctor` üzerinden geçirilir. Konuşma sağlayıcısı/sağlayıcı haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu nedenle yalnızca anahtar sırası farkları artık yinelenen etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için yüklü tüm Plugin manifestlerini tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar verileri çoğaltmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri için Cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) kontrol eder.

    Geçerli cron temizlikleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey yük alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslimat alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - yük `provider` teslimat takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak geçirir. Bir iş eski bildirim yedeğini mevcut webhook olmayan bir teslimat moduyla birleştirirse, doctor uyarır ve o işi elle inceleme için bırakır.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, bayat yazma kilidi dosyaları için her ajan oturum dizinini tarar; bunlar bir oturum anormal biçimde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve bayat kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda bayat kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkripti dal onarımı">
    Doctor, 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenen dal biçimi için ajan oturumu JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda, doctor etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü kontrolleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları kontrol eder:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı sorar ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı önerir (ve sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu yayımlar).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır, çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır, çünkü SD veya eMMC destekli rastgele G/Ç oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girdilerinin transkript dosyaları eksik olduğunda uyarır.
    - **Ana oturum "1 satırlı JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyor).
    - **Birden çok durum dizini**: ev dizinleri arasında birden fazla `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise, doctor bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600` değerine sıkılaştırmayı önerir.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth sona ermesi)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, belirteçlerin süresi dolmak üzereyken/dolduğunda uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/belirteç profili bayatsa, bir Anthropic API anahtarı veya Anthropic kurulum belirteci yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalandırma/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model başvurusunu katalog ve allowlist'e göre doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imajı onarımı">
    Sandbox kullanımı etkinleştirildiğinde doctor, Docker imajlarını denetler ve geçerli imaj eksikse oluşturmayı veya eski adlara geçmeyi önerir.
  </Accordion>
  <Accordion title="7b. Paketle gelen Plugin çalışma zamanı bağımlılıkları">
    Doctor, çalışma zamanı bağımlılıklarını yalnızca geçerli yapılandırmada etkin olan veya paketli manifest varsayılanı tarafından etkinleştirilen paketli pluginler için doğrular; örneğin `plugins.entries.discord.enabled: true`, eski `channels.discord.enabled: true`, yapılandırılmış `models.providers.*` / aracı model başvuruları veya sağlayıcı sahipliği olmayan varsayılan olarak etkin bir paketli plugin. Eksik olan varsa doctor paketleri bildirir ve bunları `openclaw doctor --fix` / `openclaw doctor --repair` modunda yükler. Harici pluginler hâlâ `openclaw plugins install` / `openclaw plugins update` kullanır; doctor rastgele plugin yolları için bağımlılık yüklemez.

    Doctor onarımı sırasında, paketli çalışma zamanı bağımlılığı npm yüklemeleri TTY oturumlarında dönen gösterge ilerlemesi, borulanmış/başsız çıktıda ise periyodik satır ilerlemesi bildirir. Gateway ve yerel CLI de paketli bir plugini içe aktarmadan önce etkin paketli plugin çalışma zamanı bağımlılıklarını isteğe bağlı olarak onarabilir. Bu yüklemeler plugin çalışma zamanı yükleme köküyle sınırlıdır, betikler devre dışıyken çalışır, paket kilidi yazmaz ve eşzamanlı CLI veya Gateway başlatmaları aynı `node_modules` ağacını aynı anda değiştirmesin diye yükleme kökü kilidiyle korunur.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizleme ipuçları">
    Doctor eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli gateway bağlantı noktasını kullanarak OpenClaw hizmetini yüklemeyi önerir. Ayrıca ek gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adı verilmiş OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw gateway hizmeti varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet yüklemez. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın veya sistem denetleyicisi gateway yaşam döngüsüne sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi varsa doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin bir parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleşirken cihaz kimliğinin artık onaylı kayıtla eşleşmediği public-key uyuşmazlığı onarımları
    - onaylı bir rol için etkin token'ı olmayan eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme temel çizgisinin dışına kayan eşleştirilmiş token'lar
    - geçerli makine için gateway tarafı token rotasyonundan önce gelen veya eski kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz token'ı girdileri

    Doctor, eşleştirme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine kesin sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - kesin isteği `openclaw devices approve <requestId>` ile onaylayın
    - yeni bir token'ı `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirilmiş ama hâlâ eşleştirme gerekiyor hatası alınıyor" boşluğunu kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı allowlist olmadan DM'lere açıksa veya bir ilke tehlikeli şekilde yapılandırılmışsa uyarılar yayımlar.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, gateway'in oturum kapatıldıktan sonra canlı kalması için lingering'in etkin olmasını sağlar.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (skills, pluginler ve eski dizinler)">
    Doctor, varsayılan aracı için çalışma alanı durumunun özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve allowlist tarafından engellenmiş Skills sayılarını verir.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanıyla birlikte varsa uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı pluginleri sayar; hatalar için plugin kimliklerini listeler; paket plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanıyla uyumluluk sorunları olan pluginleri işaretler.
    - **Plugin tanılamaları**: plugin kayıt defterinin yükleme zamanında yayımladığı uyarı veya hataları yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın ya da bunun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kısaltma yüzdesini, kısaltma nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir kesri olarak bildirir. Dosyalar kısaltıldığında veya sınıra yakın olduğunda doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal plugini temizliği">
    `openclaw doctor --fix` eksik bir kanal pluginini kaldırdığında, o plugine başvuran askıda kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı yok olmuşken yapılandırmanın hâlâ gateway'den ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekmeyle tamamlamanın yüklü olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama kalıbı (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmışsa ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor bunu yüklemeyi ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel gateway token kimlik doğrulama hazırlığını denetler.

    - Token modu bir token gerektiriyorsa ve hiçbir token kaynağı yoksa doctor bir tane oluşturmayı önerir.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca hiçbir token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef duyarlı onarımlar">
    Bazı onarım akışlarının, çalışma zamanı hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, kullanılabildiğinde yapılandırılmış bot kimlik bilgilerini kullanmaya çalışır.
    - Telegram bot token'ı SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa doctor, kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve token'ı eksikmiş gibi yanlış bildirmek veya çökme yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve gateway sağlıksız görünüyorsa yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    Doctor, yapılandırılmış bellek arama embedding sağlayıcısının varsayılan aracı için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin mevcut ve başlatılabilir olup olmadığını yoklar. Değilse npm paketi ve elle ikili yolu seçeneği dahil düzeltme rehberliği yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan bir uzak/indirilebilir model URL'si olup olmadığını denetler. Eksikse uzak sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya auth deposunda bir API anahtarının bulunduğunu doğrular. Eksikse işlem yapılabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir gateway yoklama sonucu mevcut olduğunda (denetim sırasında gateway sağlıklıydı), doctor sonucunu CLI tarafından görülebilen yapılandırmayla çapraz başvurur ve varsa tutarsızlığı belirtir. Doctor varsayılan yolda yeni bir embedding ping başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, yüklü supervisor yapılandırmasında (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanları (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi) denetler. Bir uyuşmazlık bulduğunda güncelleme önerir ve hizmet dosyasını/görevini geçerli varsayılanlara göre yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce istem gösterir.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway hizmet yaşam döngüsü için doctor aracını salt okunur tutar. Hizmet sağlığını yine raporlar ve hizmet dışı onarımları çalıştırır, ancak bu yaşam döngüsüne harici bir supervisor sahip olduğu için hizmet kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırması yeniden yazımları ve eski hizmet temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkinken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan eski olmayan ek Gateway benzeri birimleri yok sayar; böylece eşlikçi hizmet dosyaları temizlik gürültüsü oluşturmaz.
    - Jeton kimlik doğrulaması bir jeton gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurulumu/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin jeton değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içine gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve hizmet meta verilerini bu değerler supervisor tanımı yerine çalışma zamanı kaynağından yüklenecek şekilde yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` değerini sabitlediğini algılar ve hizmet meta verilerini geçerli porta yeniden yazar.
    - Jeton kimlik doğrulaması bir jeton gerektiriyorsa ve yapılandırılmış jeton SecretRef'i çözümlenemiyorsa, doctor kurulum/onarım yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulum/onarımı engeller.
    - Linux kullanıcı systemd birimleri için doctor jeton sapması denetimleri artık hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazımı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanıları">
    Doctor, hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu halde gerçekten çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri (Gateway zaten çalışıyor, SSH tüneli) raporlar.
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway hizmeti Bun üzerinde veya sürüm yönetimli bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet kabuk başlatmanızı yüklemez. Doctor, mevcut olduğunda sistem Node kurulumuna (Homebrew/apt/choco) geçiş önermektedir.

    Yeni kurulan veya onarılan hizmetler açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı ikili dizinlerini korur, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcut olduğunda hizmet PATH'ine yazılır. Bu, oluşturulan supervisor PATH'inin doctor'ın daha sonra çalıştırdığı aynı minimal-PATH denetimiyle hizalı kalmasını sağlar.

  </Accordion>
  <Accordion title="18. Yapılandırma yazımı + sihirbaz meta verileri">
    Doctor, tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedekleme (önerilen özel GitHub veya GitLab) için tam kılavuz olarak [/concepts/agent-workspace](/tr/concepts/agent-workspace) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
