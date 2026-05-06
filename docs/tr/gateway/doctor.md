---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Bozucu yapılandırma değişikliklerini kullanıma sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-06T09:12:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eskimiş yapılandırma/durum verilerini düzeltir, sağlığı kontrol eder ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul eder (geçerli olduğunda yeniden başlatma/servis/sandbox onarım adımları dahil).

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

    Sorma olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalizasyonu + diskteki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/servis/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek gateway kurulumları için sistem servislerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek istiyorsanız önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön kontrol güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği kontrolü (protokol şeması daha yeniyse Control UI'yi yeniden derler).
    - Sağlık kontrolü + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Yapılandırma ve geçişler">
    - Eski değerler için yapılandırma normalizasyonu.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine Talk yapılandırması geçişi.
    - Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazır olma durumu için tarayıcı geçiş kontrolleri.
    - OpenCode sağlayıcı override uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS ön koşulları kontrolü.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ joker karakter veya Plugin'e ait araçlar istediğinde Plugin/araç allowlist uyarıları.
    - Eski disk üzeri durum geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` webhook yedek işleri).
    - Eski ajan çalışma zamanı ilkesi geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkinleştirildiğinde eskimiş Plugin yapılandırması temizliği; `plugins.enabled=false` olduğunda, eskimiş Plugin referansları etkisiz kapsama yapılandırması olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyası incelemesi ve eskimiş kilit temizliği.
    - Etkilenen 2026.4.24 derlemelerinin oluşturduğu yinelenmiş prompt-yeniden-yazma dalları için oturum transcript onarımı.
    - Başlangıcın alt süreci yeniden başlatma nedeniyle iptal edilmiş gibi işlemeye devam etmemesi için eskimiş iptal edilmiş kurtarma bayraklarını temizlemeye yönelik `--fix` desteğiyle, sıkışmış alt ajan yeniden başlatma-kurtarma tombstone algılaması.
    - Durum bütünlüğü ve izin kontrolleri (oturumlar, transcript'ler, durum dizini).
    - Yerel çalışırken yapılandırma dosyası izin kontrolleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını kontrol eder, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını bildirir.
    - Ek çalışma alanı dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servisler ve supervisor'lar">
    - Sandbox etkinleştirildiğinde sandbox imajı onarımı.
    - Eski servis geçişi ve ek gateway algılama.
    - Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı kontrolleri (servis kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durumu uyarıları (çalışan gateway'den yoklanır).
    - Yerel TUI istemcileri hâlâ çalışırken bozulmuş Gateway event-loop sağlığı için WhatsApp yanıt verebilirlik kontrolleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - Birincil modellerde, fallback'lerde, heartbeat/alt ajan/compaction override'larında, hook'larda, kanal model override'larında ve oturum rota sabitlemelerinde eski `openai-codex/*` model referansları için Codex rota onarımı; `--fix` bunları `openai/*` olarak yeniden yazar ve yalnızca Codex Plugin'i kuruluysa, etkinse, `codex` harness'ını sağlıyorsa ve kullanılabilir OAuth'a sahipse `agentRuntime.id: "codex"` seçer. Aksi takdirde `agentRuntime.id: "pi"` seçer.
    - İsteğe bağlı onarımla supervisor yapılandırma denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalamış gateway servisleri için gömülü proxy ortamı temizliği.
    - Gateway çalışma zamanı en iyi uygulama kontrolleri (Node ile Bun karşılaştırması, sürüm yöneticisi yolları).
    - Gateway port çakışması tanıları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Kimlik doğrulama, güvenlik ve eşleştirme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway kimlik doğrulama kontrolleri (token kaynağı yoksa token oluşturmayı önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk kez eşleşme istekleri, bekleyen rol/kapsam yükseltmeleri, eskimiş yerel cihaz-token önbelleği sapması ve eşlenmiş kayıt kimlik doğrulama sapması).

  </Accordion>
  <Accordion title="Çalışma alanı ve shell">
    - Linux'ta systemd linger kontrolü.
    - Çalışma alanı bootstrap dosya boyutu kontrolü (context dosyaları için kesilme/sınıra yakın uyarıları).
    - Varsayılan ajan için Skills hazır olma kontrolü; eksik bin, ortam, yapılandırma veya işletim sistemi gereksinimleri olan izin verilmiş Skills öğelerini bildirir ve `--fix`, kullanılamayan Skills öğelerini `skills.entries` içinde devre dışı bırakabilir.
    - Shell tamamlama durumu kontrolü ve otomatik kurulum/yükseltme.
    - Bellek arama embedding sağlayıcısı hazır olma kontrolü (yerel model, uzak API anahtarı veya QMD ikilisi).
    - Kaynak kurulum kontrolleri (pnpm çalışma alanı uyumsuzluğu, eksik UI varlıkları, eksik tsx ikilisi).
    - Güncellenmiş yapılandırmayı + sihirbaz metadata'sını yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Ne yaparlar:

- **Backfill**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve tersine çevrilebilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca bu işaretlenmiş geri doldurma günlük girdilerini `DREAMS.md` dosyasından kaldırır.
- **Clear Grounded**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı hatırlama veya günlük destek biriktirmemiş staged grounded-only kısa vadeli girdileri kaldırır.

Tek başlarına ne **yapmazlar**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- staged CLI yolunu önce açıkça çalıştırmadığınız sürece grounded adayları otomatik olarak canlı kısa vadeli promotion deposuna stage etmezler

Grounded geçmiş yeniden oynatmanın normal derin promotion hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken grounded dayanıklı adayları kısa vadeli dreaming deposuna stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Yapılandırma normalizasyonu">
    Yapılandırma eski değer şekilleri içeriyorsa (örneğin kanala özgü override olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları dahildir. Geçerli genel Talk konuşma yapılandırması `talk.provider` + `talk.providers.<provider>` şeklindedir ve gerçek zamanlı ses yapılandırması `talk.realtime.*` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini sağlayıcı haritasına yeniden yazar ve eski üst düzey gerçek zamanlı seçicileri (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` içine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi
    joker karakter veya Plugin'e ait araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca
    gerçekten yüklenen Plugin'lerden gelen araçlarla eşleşir; özel Plugin
    allowlist'ini atlamaz. Doctor, mevcut paketlenmiş sağlayıcı davranışını korumak için geçiş yapılmış
    eski allowlist yapılandırmalarına `plugins.bundledDiscovery: "compat"` yazar ve
    ardından daha sıkı `"allowlist"` ayarını gösterir.

  </Accordion>
  <Accordion title="2. Eski yapılandırma anahtarı geçişleri">
    Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway ayrıca eski bir yapılandırma biçimi algıladığında başlangıçta doctor geçişlerini otomatik olarak çalıştırır, böylece eskimiş yapılandırmalar manuel müdahale olmadan onarılır. Cron iş deposu geçişleri `openclaw doctor --fix` tarafından işlenir.

    Geçerli geçişler:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - görünür yanıt ilkesi eksik olan yapılandırılmış kanal yapılandırmaları → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → üst düzey `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - eski `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - eski üst düzey gerçek zamanlı Talk seçicileri (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - adlandırılmış `accounts` öğelerine sahip ancak tek hesaplı üst düzey kanal değerleri kalan kanallar için, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş provider/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski extension relay ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (gateway başlangıcı, `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış provider’ları da kapalı başarısız olmak yerine atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa doctor, yedek yönlendirmenin beklenmeyen bir hesabı seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap ID’sine ayarlanmışsa doctor uyarır ve yapılandırılmış hesap ID’lerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğelerini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API’ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome extension yolunu gösteriyorsa doctor bunu mevcut ana makine yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlanan profiller için Google Chrome’un aynı ana makinede kurulu olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144’ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışıyor olması
    - o tarayıcıda uzaktan hata ayıklamanın etkinleştirilmiş olması
    - tarayıcıdaki ilk bağlanma onayı istemini onaylama

    Buradaki hazır olma durumu yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme kesme ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, remote-browser veya diğer headless akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Bir OpenAI Codex OAuth profili yapılandırıldığında doctor, yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS’ta düzeltme genellikle `brew postinstall ca-certificates` komutudur. `--deep` ile gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Daha önce eski OpenAI taşıma ayarlarını `models.providers.openai-codex` altında eklediyseniz, bunlar yeni sürümlerin otomatik kullandığı yerleşik Codex OAuth provider yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece bayat taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy’ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor, eski `openai-codex/*` model referanslarını denetler. Native Codex harness yönlendirmesi, OpenClaw PI OpenAI yolu yerine turun Codex app-server harness üzerinden gitmesi için kurallı `openai/*` model referanslarını ve `agentRuntime.id: "codex"` değerini kullanır.

    `--fix` / `--repair` modunda doctor, birincil modeller, yedekler, Heartbeat/subagent/Compaction geçersiz kılmaları, hook’lar, kanal modeli geçersiz kılmaları ve bayat kalıcı oturum rota durumu dahil olmak üzere etkilenen varsayılan ajan ve ajan başına referansları yeniden yazar:

    - `openai-codex/gpt-*`, `openai/gpt-*` olur.
    - Eşleşen ajan çalışma zamanı yalnızca Codex kuruluysa, etkinse, `codex` harness sağlıyorsa ve kullanılabilir OAuth’a sahipse `agentRuntime.id: "codex"` olur.
    - Aksi halde eşleşen ajan çalışma zamanı `agentRuntime.id: "pi"` olur.
    - Mevcut model yedek listeleri, eski girdileri yeniden yazılmış şekilde korunur; kopyalanmış model başına ayarlar eski anahtardan kurallı `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, yedek bildirimleri, auth-profile pin’leri ve Codex harness pin’leri bulunan tüm ajan oturum depolarında onarılır.
    - `/codex ...`, “sohbetten native Codex konuşmasını denetle veya bağla” anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, “harici ACP/acpx bağdaştırıcısını kullan” anlamına gelir.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor ayrıca yapılandırılmış modelleri veya runtime’ı Codex gibi Plugin’e ait bir rotadan uzaklaştırdıktan sonra bayat otomatik oluşturulmuş rota durumu için bulunan ajan oturum depolarını tarar.

    `openclaw doctor --fix`, sahip olan rota artık yapılandırılmadığında `modelOverrideSource: "auto"` model pin’leri, runtime model meta verileri, pin’lenmiş harness ID’leri, CLI oturum bağlamaları ve otomatik auth-profile geçersiz kılmaları gibi otomatik oluşturulmuş bayat durumları temizleyebilir. Açık kullanıcı veya eski oturum modeli seçimleri elle inceleme için bildirilir ve dokunulmadan bırakılır; o rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor eski disk üzeri düzenleri mevcut yapıya taşıyabilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap id’si: `default`)

    Bu taşıma işlemleri best-effort ve idempotent’tir; doctor, herhangi bir eski klasörü yedek olarak geride bıraktığında uyarılar verir. Gateway/CLI de başlangıçta eski oturumları ve ajan dizinini otomatik taşır; böylece geçmiş/auth/modeller, elle doctor çalıştırmaya gerek kalmadan ajan başına yola iner. WhatsApp auth bilinçli olarak yalnızca `openclaw doctor` aracılığıyla taşınır. Talk provider/provider-map normalleştirmesi artık yapısal eşitliğe göre karşılaştırır; bu nedenle yalnızca anahtar sırası farkları artık yinelenen etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor, kullanımdan kaldırılmış üst düzey capability anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için kurulu tüm Plugin manifestlerini tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu taşıma idempotent’tir; `contracts` anahtarı zaten aynı değerlere sahipse eski anahtar veri çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş şekilleri açısından denetler.

    Mevcut cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey delivery alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` delivery diğer adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak taşır. Bir iş eski notify geri dönüşünü mevcut Webhook olmayan teslim modu ile birleştiriyorsa, doctor uyarır ve bu işi manuel inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab dosyası hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çağırdığında da uyarır. Bu makineye yerel betik güncel OpenClaw tarafından korunmaz ve cron systemd kullanıcı veri yoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` mesajları yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; güncel durum denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her ajan oturum dizinini eski yazma kilidi dosyaları için tarar — bir oturum anormal şekilde çıktığında geride kalan dosyalar. Bulduğu her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkript dalı onarımı">
    Doctor, ajan oturumu JSONL dosyalarını 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal biçimi için tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgün dosyanın yanına yedekler ve transkripti etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı önerir ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (sahip/grup uyumsuzluğu algılandığında bir `chown` ipucu da verir).
    - **macOS bulut eşitlemeli durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı aşınabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlı JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyordur).
    - **Birden fazla durum dizini**: ev dizinleri arasında birden fazla `~/.openclaw` klasörü olduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri işaret ettiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, onu uzak makinede çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süre dolumu)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'ların süresi dolmak üzereyken/dolmuşken uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili eskiyse bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalıştırmada (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerektiğini bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlıysa doctor, model başvurusunu katalog ve izin listesine göre doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox görüntüsü onarımı">
    Sandbox etkinleştirildiğinde doctor, Docker görüntülerini denetler ve geçerli görüntü eksikse oluşturmayı veya eski adlara geçmeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu kaldırır. Bu, eski oluşturulmuş bağımlılık köklerini, eski kurulum aşaması dizinlerini, önceki paketli Plugin bağımlılığı onarım kodundan kalan paket yerel artıklarını ve geçerli paketli manifesti gölgeleyebilen paketli `@openclaw/*` Plugin'lerinin sahipsiz veya kurtarılmış yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara başvurduğunda ancak yerel Plugin kayıt defteri bunları bulamadığında eksik indirilebilir Plugin'leri de yeniden kurabilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış ajan çalışma zamanları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlangıcı ve yapılandırma yeniden yüklemesi paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmeti taşımaları ve temizlik ipuçları">
    Doctor, eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp OpenClaw hizmetini geçerli gateway bağlantı noktasıyla kurmayı teklif eder. Ayrıca ek gateway benzeri hizmetleri tarayıp temizlik ipuçları yazdırabilir. Profil adlandırmalı OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ekstra" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw gateway hizmeti varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın veya gateway yaşam döngüsünü bir sistem denetleyicisi yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix taşıması">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum taşıması olduğunda doctor (`--fix` / `--repair` modunda) taşıma öncesi anlık görüntü oluşturur ve ardından en iyi çaba taşıma adımlarını çalıştırır: eski Matrix durum taşıması ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleme durumunu inceler.

    Raporladıkları:

    - bekleyen ilk kez eşleme istekleri
    - zaten eşlenmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşlenmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz id hâlâ eşleştiği ancak cihaz kimliği artık onaylı kayıtla eşleşmediği durumlarda ortak anahtar uyuşmazlığı onarımları
    - onaylı bir rol için etkin token'ı eksik olan eşlenmiş kayıtlar
    - kapsamları onaylı eşleme temel çizgisinin dışına sapan eşlenmiş token'lar
    - geçerli makine için gateway tarafı token döndürmesinden önce gelen veya eski kapsam meta verileri taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Doctor eşleme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşlenmiş ama hâlâ eşleme gerekli alınıyor" açığını kapatır: doctor artık ilk kez eşlemeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz-kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir ilke tehlikeli şekilde yapılandırıldığında uyarılar yayar.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, çıkış yaptıktan sonra gateway'in canlı kalması için lingering özelliğinin etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Doctor, varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve izin listesi tarafından engellenmiş skills sayılarını sayar.
    - **Eski çalışma alanı dizinleri**: geçerli çalışma alanının yanında `~/openclaw` veya diğer eski çalışma alanı dizinleri bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin ID'lerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yükleme sırasında yayılan tüm uyarı veya hataları yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın ya da bunun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir kesri olarak raporlar. Dosyalar kesildiğinde veya sınıra yakın olduğunda doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını ayarlamak için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, bu Plugin'e başvuran askıda kalmış kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın hâlâ gateway'den ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın kurulu olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya çeşidine yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor bunu kurmayı ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği manuel olarak yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel gateway token kimlik doğrulama hazırlığını denetler.

    - Token modu bir token gerektiriyorsa ve token kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve onu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkında onarımlar">
    Bazı onarım akışlarının, çalışma zamanı hızlı hata verme davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token’ı SecretRef ile yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çökmek ya da token’ı eksik olarak yanlış raporlamak yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık kontrolü + yeniden başlatma">
    Doktor bir sağlık kontrolü çalıştırır ve Gateway sağlıksız görünüyorsa yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek arama hazırlığı">
    Doktor, yapılandırılmış bellek arama embedding sağlayıcısının varsayılan agent için hazır olup olmadığını kontrol eder. Davranış yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin mevcut ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve manuel ikili dosya yolu seçeneği dahil düzeltme rehberliği yazdırır.
    - **Açık yerel sağlayıcı**: Yerel bir model dosyası veya tanınan bir uzak/indirilebilir model URL’si olup olmadığını kontrol eder. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): Ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: Önce yerel model kullanılabilirliğini kontrol eder, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (kontrol sırasında Gateway sağlıklıydı), doktor bu sonucu CLI’dan görülebilen yapılandırmayla çapraz karşılaştırır ve herhangi bir tutarsızlığı belirtir. Doktor, varsayılan yolda yeni bir embedding ping’i başlatmaz; canlı sağlayıcı kontrolü istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doktor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları raporlar.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doktor, kurulu supervisor yapılandırmasında (launchd/systemd/schtasks) eksik veya eski varsayılanları (örn. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi) kontrol eder. Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem olmadan uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway hizmet yaşam döngüsü için doctor’ı salt okunur tutar. Hizmet sağlığını raporlamaya ve hizmet dışı onarımları çalıştırmaya devam eder, ancak harici bir supervisor bu yaşam döngüsüne sahip olduğu için hizmet kurulumunu/başlatmasını/yeniden başlatmasını/bootstrap işlemini, supervisor yapılandırması yeniden yazımlarını ve eski hizmet temizliğini atlar.
    - Linux’ta doktor, eşleşen systemd Gateway birimi etkinken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan, eski olmayan ek Gateway benzeri birimleri yok sayar; böylece eşlik eden hizmet dosyaları temizlik gürültüsü oluşturmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurulumu/onarımı SecretRef’i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doktor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içinde gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için hizmet meta verilerini yeniden yazar.
    - Doktor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` sabitlediğini algılar ve hizmet meta verilerini geçerli porta yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef’i çözümlenmemişse, doktor kurulum/onarım yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doktor mod açıkça ayarlanana kadar kurulumu/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için doktor token sapması kontrolleri artık hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen bir Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanıları">
    Doktor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu halde gerçekten çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını kontrol eder ve olası nedenleri (Gateway zaten çalışıyor, SSH tüneli) raporlar.
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doktor, Gateway hizmeti Bun üzerinde veya sürüm yönetimli bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve hizmet kabuk başlatmanızı yüklemediği için sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir. Doktor, mevcut olduğunda bir sistem Node kurulumuna (Homebrew/apt/choco) geçmeyi önerir.

    Yeni kurulan veya onarılan macOS LaunchAgent’ları etkileşimli kabuk PATH’ini kopyalamak yerine standart bir sistem PATH’i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri, hangi Node alt süreçlerinin çözümleneceğini değiştirmez. Linux hizmetleri hâlâ açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini tutar, ancak tahmin edilen sürüm yöneticisi geri dönüş dizinleri yalnızca bu dizinler diskte mevcut olduğunda hizmet PATH’ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazımı + sihirbaz meta verileri">
    Doktor, tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doktor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi (önerilen özel GitHub veya GitLab) hakkında tam kılavuz için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
